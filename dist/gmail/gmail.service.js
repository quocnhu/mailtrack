"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GmailService = void 0;
const common_1 = require("@nestjs/common");
const googleapis_1 = require("googleapis");
const prisma_service_1 = require("../prisma/prisma.service");
const cheerio = __importStar(require("cheerio"));
const tripadvisorHtmlParser_1 = require("./parsers/tripadvisorHtmlParser");
const websiteHtmlParser_1 = require("./parsers/websiteHtmlParser");
let GmailService = GmailService_1 = class GmailService {
    prisma;
    logger = new common_1.Logger(GmailService_1.name);
    oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
    constructor(prisma) {
        this.prisma = prisma;
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
                this.logger.log(`Watch expiration approaching for ${email}. Renewing watch subscription...`);
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
                labelId: 'INBOX',
            });
            if (historyResponse.data.history) {
                for (const record of historyResponse.data.history) {
                    if (record.messagesAdded) {
                        for (const addedRecord of record.messagesAdded) {
                            const messageId = addedRecord.message?.id;
                            const hasInboxLabel = addedRecord.message?.labelIds?.includes('INBOX');
                            if (messageId && hasInboxLabel) {
                                this.logger.log(`📬 New incoming inbox message detected: ${messageId}`);
                                await this.processMessage(gmail, messageId);
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
            const parsed = this.parseEmailBody(message.data);
            console.log('--- Parsed Email ---', parsed);
        }
        catch (error) {
            this.logger.error(`Error processing message ${messageId}:`, error);
        }
    }
    decodeBase64Url(data) {
        const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
        return Buffer.from(base64, 'base64').toString('utf-8');
    }
    extractParts(payload, parts = []) {
        if (!payload)
            return parts;
        if (payload.body?.data) {
            parts.push({ mimeType: payload.mimeType, data: payload.body.data });
        }
        if (payload.parts?.length) {
            for (const part of payload.parts) {
                this.extractParts(part, parts);
            }
        }
        return parts;
    }
    stripHtml(html) {
        const $ = cheerio.load(html);
        $('style, script, head, img, link, meta, noscript').remove();
        return $.text().replace(/\s{2,}/g, ' ').trim();
    }
    detectProvider(headers) {
        const senderFields = [
            headers['from'] ?? '',
            headers['reply-to'] ?? '',
            headers['sender'] ?? '',
            headers['return-path'] ?? '',
        ].join(' ').toLowerCase();
        if (senderFields.includes('nquocnhu95tourguide@gmail.com'))
            return 'tripadvisor';
        if (senderFields.includes('yourdomain.com'))
            return 'website';
        return 'unknown';
    }
    parseBookingData(provider, htmlBody) {
        if (!htmlBody)
            return null;
        switch (provider) {
            case 'tripadvisor':
                return tripadvisorHtmlParser_1.TripAdvisorHtmlParser.parse(htmlBody);
            case 'website':
                return websiteHtmlParser_1.WebsiteHtmlParser.parse(htmlBody);
            default:
                return null;
        }
    }
    parseEmailBody(messageData) {
        const allParts = this.extractParts(messageData.payload);
        const plainPart = allParts.find((p) => p.mimeType === 'text/plain');
        const htmlPart = allParts.find((p) => p.mimeType === 'text/html');
        const textBody = plainPart ? this.decodeBase64Url(plainPart.data) : null;
        const htmlBody = htmlPart ? this.decodeBase64Url(htmlPart.data) : null;
        const cleanBody = textBody ?? (htmlBody ? this.stripHtml(htmlBody) : null);
        const headers = {};
        for (const h of messageData.payload?.headers ?? []) {
            headers[h.name.toLowerCase()] = h.value;
        }
        const provider = this.detectProvider(headers);
        const bookingData = this.parseBookingData(provider, htmlBody);
        return {
            subject: headers['subject'] ?? null,
            from: headers['from'] ?? null,
            to: headers['to'] ?? null,
            date: headers['date'] ?? null,
            messageId: headers['message-id'] ?? null,
            snippet: messageData.snippet ?? null,
            internalDate: messageData.internalDate ?? null,
            textBody,
            htmlBody,
            cleanBody,
            provider,
            bookingData,
        };
    }
};
exports.GmailService = GmailService;
exports.GmailService = GmailService = GmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GmailService);
//# sourceMappingURL=gmail.service.js.map