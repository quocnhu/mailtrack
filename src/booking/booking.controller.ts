// src/booking/booking.controller.ts
import { Controller, Post, Body, Get, Param, UsePipes, ValidationPipe } from '@nestjs/common';
import { BookingService } from '@/booking/booking.service';
import { CreateBookingDto } from '@/booking/dto/create-booking.dto';

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) { }

  /**
   * 📥 API Tạo mới Booking thủ công (Hoặc dùng cho Operator cập nhật/chèn đè sau này)
   */
  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createBooking(@Body() createBookingDto: CreateBookingDto) {
    return await this.bookingService.create(createBookingDto);
  }

  /**
    * 📋 API Lấy danh sách toàn bộ Bookings cho Ant Design Table
    * Lộ trình: GET /bookings
    */
  @Get()
  async getAllBookings() {
    return await this.bookingService.findAll();
  }
}




// // src/booking/booking.controller.ts
// import { Controller, Patch, Param, Body } from '@nestjs/common';
// import { BookingService } from './booking.service';

// @Controller('booking')
// export class BookingController {
//   constructor(private readonly bookingService: BookingService) {}

//   /**
//    * 🎛️ CAPTURE FRONTEND DROPS: Re-index positions instantly on a single targeted call
//    */
//   @Patch(':id/sequence')
//   async syncDroppedSequence(
//     @Param('id') bookingId: string,
//     @Body() body: { targetVehicleId: string | null; newIndex: number }
//   ) {
//     // This executes your highly optimized layout shifting transaction query block cleanly
//     return await this.bookingService.updateSequence(bookingId, body.targetVehicleId, body.newIndex);
//   }
// }