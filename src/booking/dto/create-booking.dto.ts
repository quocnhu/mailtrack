// src/booking/dto/create-booking.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsEmail, IsObject, Min } from 'class-validator';
import { TourType, BookingStatus, PaymentStatus } from '@prisma/client';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  bookingRef!: string;

  @IsString()
  @IsNotEmpty()
  provider!: string;

  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

  @IsString()
  @IsOptional()
  address?: string | null;

  @IsNumber()
  @IsOptional()
  latitude?: number | null;

  @IsNumber()
  @IsOptional()
  longitude?: number | null;

  @IsString()
  @IsOptional()
  startingDate?: string | null;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  phone?: string | null;

  @IsEmail()
  @IsOptional()
  mail?: string | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  totalPax?: number;

  // 🎯 GỘP THẲNG VÀO ĐÂY: Định nghĩa trực tiếp kiểu dáng Object cho paxDetail
  @IsObject()
  @IsOptional()
  paxDetail?: {
    adults: number;
    children: number;
    infants: number;
  };

  @IsEnum(TourType)
  @IsOptional()
  tourType?: TourType | null;

  @IsString()
  @IsOptional()
  tourName?: string | null;

  @IsEnum(PaymentStatus)
  @IsOptional()
  payment?: PaymentStatus | null;

  @IsString()
  @IsNotEmpty()
  rawDataId!: string;
}