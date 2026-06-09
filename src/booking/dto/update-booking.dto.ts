// src/booking/dto/update-booking.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateBookingDto } from './create-booking.dto';

// Kế thừa toàn bộ nhưng biến tất cả thành optional (dấu ?) tự động
export class UpdateBookingDto extends PartialType(CreateBookingDto) {}