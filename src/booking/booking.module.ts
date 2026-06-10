// src/booking/booking.module.ts
import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { PrismaModule } from '@/prisma/prisma.module'; // Đảm bảo bạn đã có PrismaModule trong dự án
import { BullModule } from '@nestjs/bull'; // 🎯 Thêm BullModule vào đây
@Module({
  imports: [
    PrismaModule, 
    BullModule.registerQueue({
      name: 'booking-assignment-queue',
    })],  
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService], // Export ra ngoài nếu mai sau các Module khác (như GmailModule) cần gọi
})
export class BookingModule {}    