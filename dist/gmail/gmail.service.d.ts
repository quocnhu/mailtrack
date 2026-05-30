import { OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
export declare class GmailService implements OnApplicationBootstrap {
    private readonly prisma;
    private readonly redisService;
    private readonly logger;
    private oauth2Client;
    constructor(prisma: PrismaService, redisService: RedisService);
    onApplicationBootstrap(): Promise<void>;
    getAuthUrl(): Promise<string>;
    handleAuthorizationCode(code: string): Promise<{
        id: string;
        email: string;
        lastHistoryId: string;
        watchExpiration: Date;
        refreshToken: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
    }>;
    processWebhookPayload(base64Data: string): Promise<void>;
    private processMessage;
    private extractExternalId;
    private parseEmailBody;
}
