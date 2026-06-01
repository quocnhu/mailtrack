import { OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from "../prisma/prisma.service";
export declare class GmailService implements OnApplicationBootstrap {
    private readonly prisma;
    private readonly logger;
    private oauth2Client;
    constructor(prisma: PrismaService);
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
    private decodeBase64Url;
    private extractParts;
    private stripHtml;
    private detectProvider;
    private parseBookingData;
    private parseEmailBody;
}
