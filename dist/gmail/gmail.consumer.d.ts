import type { Job } from 'bull';
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { ParsedEmailDto } from './dto/parsedEmail.dto';
export declare class GmailConsumer {
    private readonly prisma;
    private readonly redisService;
    private readonly logger;
    constructor(prisma: PrismaService, redisService: RedisService);
    handleEmailJob(job: Job<{
        bookingKey: string;
        payload: ParsedEmailDto;
    }>): Promise<void>;
}
