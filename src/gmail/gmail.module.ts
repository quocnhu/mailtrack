import { Module } from '@nestjs/common';
import { GmailController } from '@/gmail/gmail.controller';
import { GmailService } from '@/gmail/gmail.service';
import { PrismaModule } from '@/prisma/prisma.module'; 
import { RedisModule } from '@/redis/redis.module';  
import { BullModule } from '@nestjs/bull'; 
import { GmailConsumer } from '@/gmail/gmail.consumer'; 
import { BookingModule } from '@/booking/booking.module'; 
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    BookingModule, // 🚀 Nạp BookingModule vào đây để GmailConsumer có thể @Inject(BookingService)
    PrismaModule, 
    RedisModule,  // ◄ CRITICAL: Gives GmailModule access to RedisService
    CacheModule.register(), // ◄ ADD THIS: Provides CACHE_MANAGER
    BullModule.registerQueue({
      name: 'booking-processing-queue', // Creates your custom conveyor belt name
    }),
  ],
  controllers: [GmailController],
  providers: [GmailService, GmailConsumer], // Don't forget to register the consumer!
  exports: [GmailService,GmailConsumer], // Export if other modules (like BookingModule) need to call GmailService or GmailConsumer
})
export class GmailModule {}