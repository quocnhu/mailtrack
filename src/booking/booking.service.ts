// src/booking/booking.controller.ts
import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull'; // 🎯 Thêm cái này
import { Queue } from 'bull';                // 🎯 Thêm cái này
import { BookingService } from './booking.service';

@Controller('bookings')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    // 🚀 NGAY TẠI ĐÂY: Inject cái Queue vào Controller của Booking
    @InjectQueue('booking-processing-queue') private readonly bookingQueue: Queue,
  ) {}

  /**
   * =========================================================================
   * 📥 [POST] /bookings/import-manual -> ENDPOINT: IMPORT THỦ CÔNG QUA QUEUE
   * Trận chiến thực tế: Operator ném một cục Data thô lên API này.
   * thay vì xử lý trực tiếp gây lag web, chúng ta bắn thẳng vào Bull Queue.
   * =========================================================================
   */
  @Post('import-manual')
  async importManualBookings(@Body() rawPayload: any) {
    
    // 🚀 BẮN VÀO HÀNG ĐỢI CHẠY NGẦM
    // Vì bạn dùng chung tên Job 'enrich-booking-job' và tên Queue với Gmail,
    // Nên cái `GmailConsumer` bên thư mục kia sẽ TỰ ĐỘNG nhặt cái Job này về xử lý!
    await this.bookingQueue.add(
      'enrich-booking-job', 
      {
        provider: 'MANUAL_IMPORT', // Đánh dấu đây là nguồn import tay
        emailContent: rawPayload.text, // Chữ thô do Operator copy-paste vào form
        rawId: null, // Không có id từ bảng RawEmail vì đây là tạo bằng tay
      },
      { attempts: 3, backoff: 5000 }
    );

    // Trả về ngay lập tức cho Next.js: "Tôi đã nhận đơn, đang xếp hàng xử lý ngầm!"
    return { success: true, message: 'Dữ liệu đã được đưa vào hàng đợi xử lý ngầm!' };
  }
}