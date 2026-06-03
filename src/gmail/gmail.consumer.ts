import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ParsedEmailDto } from './dto/parsedEmail.dto';

@Processor('booking-processing-queue')
export class GmailConsumer {
  private readonly logger = new Logger(GmailConsumer.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process('process-email-job')
  async handleEmailJob(job: Job<{ bookingKey: string; payload: ParsedEmailDto }>) {
    const { bookingKey, payload } = job.data;
    this.logger.log(`[CONVEYOR BELT OUT] Processing job ${job.id} for key: ${bookingKey}`);

    try {
      // ─── PRISMA RAWDATA DATABASE COMMIT ─────────────────────────────
      // Maps your incoming parsed data directly to your RawData schema model
      await this.prisma.rawData.create({
        data: {
          // 1. sourceId must be @unique. We use the unique message ID from Gmail or your cache key
          sourceId: payload.messageId || `fallback-${Date.now()}`,
          
          // 2. payload is of type Json. Prisma automatically handles pure JS objects for Json fields
          payload: payload as any, 
          
          // 3. status is a String ('PENDING', 'PROCESSED', 'FAILED')
          // Since it just rolled off the queue, we mark it as 'PENDING' before the next step parses it into your final tables
          status: 'PENDING', 
        },
      });

      this.logger.log(`[DATABASE SUCCESS] Committed raw email payload to Postgres RawData table.`);
    } catch (error) {
      this.logger.error(`[DATABASE ERROR] Failed to write to RawData table: ${error.message}`);
      
      // Throwing the error lets Bull handle it. Bull will track this job as 'FAILED' 
      // in Redis and trigger automatic retries if you configured them!
      throw error; 
    }
  }
}