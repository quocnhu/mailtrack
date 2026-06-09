import { Module } from '@nestjs/common';
import { GmailController } from '@/gmail/gmail.controller';
import { GmailService } from '@/gmail/gmail.service';
import { PrismaModule } from '@/prisma/prisma.module'; // ◄ ADD THIS (Adjust path if needed, e.g., '@/prisma/prisma.module')
import { RedisModule } from '@/redis/redis.module';   // ◄ ADD THIS (Adjust path if needed, e.g., '@/redis/redis.module')
import { BullModule } from '@nestjs/bull'; // ◄ ADD THIS (For Redis-based queues)
import { GmailConsumer } from '@/gmail/gmail.consumer'; // ◄ ADD THIS (Your Bull consumer for processing jobs)
@Module({
  imports: [
    PrismaModule, // ◄ CRITICAL: Gives GmailModule access to PrismaService
    RedisModule,  // ◄ CRITICAL: Gives GmailModule access to RedisService
    BullModule.registerQueue({
      name: 'booking-processing-queue', // Creates your custom conveyor belt name
    }),
  ],
  controllers: [GmailController],
  providers: [GmailService, GmailConsumer], // Don't forget to register the consumer!
  exports: [GmailService], 
})
export class GmailModule {}