// src/booking/booking.controller.ts
import { Controller, Post, Body, Get, Param, UsePipes, ValidationPipe } from '@nestjs/common';
import { BookingService } from '@/booking/booking.service';
import { CreateBookingDto } from '@/booking/dto/create-booking.dto';

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  /**
   * 📥 API Tạo mới Booking thủ công (Hoặc dùng cho Operator cập nhật/chèn đè sau này)
   */
  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createBooking(@Body() createBookingDto: CreateBookingDto) {
    return await this.bookingService.create(createBookingDto);
  }

  /**
   * 🔍 API Lấy thông tin chi tiết một Booking theo Mã Tham Chiếu (BookingRef)
   */
  @Get(':ref')
  async getBookingByRef(@Param('ref') ref: string) {
    return await this.bookingService.findByRef(ref);
  }
}