"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GmailService = void 0;
const common_1 = require("@nestjs/common");
const googleapis_1 = require("googleapis");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../redis/redis.service");
let GmailService = GmailService_1 = class GmailService {
    prisma;
    redisService;
    logger = new common_1.Logger(GmailService_1.name);
    oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
    constructor(prisma, redisService) {
        this.prisma = prisma;
        this.redisService = redisService;
        this.oauth2Client.on('tokens', (tokens) => {
            if (tokens.access_token) {
                this.logger.log('Access token rotated hiddenly by Google SDK.');
            }
        });
    }
    async onApplicationBootstrap() {
        try {
            const account = await this.prisma.gmailAccount.findFirst();
            if (!account) {
                this.logger.warn('⚠️ No active Google Accounts found in database!');
                const loginUrl = await this.getAuthUrl();
                this.logger.log(`👉 Please authorize the app by visiting this URL: \n${loginUrl}`);
            }
            else {
                this.logger.log(`✅ System connected. Tracking active mailbox for: ${account.email}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to run startup database check:', error);
        }
    }
    async getAuthUrl() {
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: ['https://www.googleapis.com/auth/gmail.readonly'],
        });
    }
    async handleAuthorizationCode(code) {
        const { tokens } = await this.oauth2Client.getToken(code);
        this.oauth2Client.setCredentials(tokens);
        const gmail = googleapis_1.google.gmail({ version: 'v1', auth: this.oauth2Client });
        const profile = await gmail.users.getProfile({ userId: 'me' });
        const email = profile.data.emailAddress?.toLowerCase();
        if (!email)
            throw new Error('Could not retrieve email address from Google profile.');
        const watchResult = await gmail.users.watch({
            userId: 'me',
            requestBody: { topicName: process.env.GOOGLE_PUBSUB_TOPIC },
        });
        const lastHistoryId = String(profile.data.historyId);
        const watchExpiration = new Date(Number(watchResult.data.expiration));
        return await this.prisma.gmailAccount.upsert({
            where: { email },
            update: {
                lastHistoryId,
                watchExpiration,
                refreshToken: tokens.refresh_token || undefined,
            },
            create: {
                email,
                lastHistoryId,
                watchExpiration,
                refreshToken: tokens.refresh_token || '',
            },
        });
    }
    async processWebhookPayload(base64Data) {
        try {
            const rawData = Buffer.from(base64Data, 'base64').toString('utf-8');
            const { emailAddress, historyId } = JSON.parse(rawData);
            const email = emailAddress.toLowerCase();
            const account = await this.prisma.gmailAccount.findUnique({ where: { email } });
            if (!account || !account.lastHistoryId)
                return;
            this.oauth2Client.setCredentials({
                refresh_token: account.refreshToken,
            });
            const gmail = googleapis_1.google.gmail({ version: 'v1', auth: this.oauth2Client });
            const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
            if (!account.watchExpiration || account.watchExpiration < oneDayFromNow) {
                this.logger.log(`Watch expiration approaching for ${email}. Renewing watch subscription hiddenly...`);
                const watchResult = await gmail.users.watch({
                    userId: 'me',
                    requestBody: { topicName: process.env.GOOGLE_PUBSUB_TOPIC },
                });
                await this.prisma.gmailAccount.update({
                    where: { email },
                    data: { watchExpiration: new Date(Number(watchResult.data.expiration)) },
                });
            }
            const historyResponse = await gmail.users.history.list({
                userId: 'me',
                startHistoryId: account.lastHistoryId,
            });
            if (historyResponse.data.history) {
                for (const record of historyResponse.data.history) {
                    if (record.messages) {
                        for (const msg of record.messages) {
                            if (msg.id) {
                                await this.processMessage(gmail, msg.id);
                            }
                        }
                    }
                }
            }
            await this.prisma.gmailAccount.update({
                where: { email },
                data: { lastHistoryId: String(historyId) },
            });
        }
        catch (error) {
            this.logger.error('Failed to process incoming webhook sync:', error);
        }
    }
    async processMessage(gmail, messageId) {
        try {
            const message = await gmail.users.messages.get({ userId: 'me', id: messageId });
            const sourceId = this.extractExternalId(message.data);
            if (!sourceId)
                return;
            const isNew = await this.redisService.setNxEx(`sync:msg:${sourceId}`, 'processing', 3600);
            if (!isNew) {
                this.logger.warn(`Duplicate conflict flagged for ID: ${sourceId}. Dropping task.`);
                return;
            }
            const rawRecord = await this.prisma.rawData.create({
                data: {
                    sourceId,
                    payload: message.data,
                    status: 'PENDING',
                },
            });
            try {
                const parsedEmailContent = this.parseEmailBody(message.data);
                console.log('--- Parsed Unique Mail Content ---');
                console.log(`Source Platform ID: ${sourceId}`);
                console.log('Content Details:', parsedEmailContent);
                console.log('---------------------------------');
                await this.prisma.rawData.update({
                    where: { id: rawRecord.id },
                    data: { status: 'PROCESSED' },
                });
            }
            catch (err) {
                await this.prisma.rawData.update({
                    where: { id: rawRecord.id },
                    data: { status: 'FAILED' },
                });
            }
        }
        catch (error) {
            this.logger.error(`Error processing message ${messageId}:`, error);
        }
    }
    extractExternalId(messageData) {
        return messageData.id || null;
    }
    parseEmailBody(messageData) {
        return {
            snippet: messageData.snippet,
            internalDate: messageData.internalDate,
        };
    }
};
exports.GmailService = GmailService;
exports.GmailService = GmailService = GmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], GmailService);
//# sourceMappingURL=gmail.service.js.map