// src/booking/dto/create-booking.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsEmail, IsObject, Min } from 'class-validator';
import { TourType, BookingStatus, PaymentStatus } from '@prisma/client';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  bookingRef?: string;

  @IsString()
  @IsNotEmpty()
  provider?: string | null;

  @IsEnum(BookingStatus)
  @IsOptional()
  status!: BookingStatus;

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
  hotelName?: string;

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


  @IsObject()
  @IsOptional()
  paxDetail?: string | null;

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
  rawDataId?: string | null; // Liên kết thô với RawData để dễ dàng truy vết nguồn gốc

}