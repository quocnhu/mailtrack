// src/booking/booking.service.ts
import { Injectable, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto'; // 🚀 Thêm thư viện lõi của Node.js để sinh chuỗi ngẫu nhiên

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('booking-assignment-queue') private readonly assignmentQueue: Queue,
  ) {}

  async create(dto: CreateBookingDto) {
    try {
      // 🛡️ Giải quyết triệt để lỗi trùng mili-giây bằng chuỗi ngẫu nhiên mã hóa crypto
      const uniqueSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
      const fallbackRef = `REF-${Date.now()}-${uniqueSuffix}`;

      // 1. Ghi nhận thông tin vào Database
      const newBooking = await this.prisma.booking.create({
        data: {
          bookingRef: dto.bookingRef?.trim() || fallbackRef, 
          provider: dto.provider || 'manual-entry', 
          status: dto.status,
          address: dto.address || null,
          latitude: dto.latitude ?? null,   
          longitude: dto.longitude ?? null, 
          startingDate: dto.startingDate ? new Date(dto.startingDate) : null,
          customerName: dto.customerName?.trim() || 'Unknown Customer',
          hotelName: dto.hotelName?.trim() || 'Unknown Hotel',
          phone: dto.phone || null,
          mail: dto.mail || null,
          totalPax: dto.totalPax || 0,
          paxDetail: dto.paxDetail as Prisma.InputJsonValue, 
          tourType: dto.tourType || null,
          tourName: dto.tourName || null,
          payment: dto.payment || null,
          rawDataId: dto.rawDataId ?? null, 
        } as Prisma.BookingUncheckedCreateInput,
      });

      // 2. 🚀 CÔ LẬP LUỒNG CHẠY NGẦM ĐIỀU PHỐI (STAGE 3)
      // Bọc riêng luồng Queue để nếu Redis có sập, đơn hàng trong DB vẫn được tạo an toàn
      try {
        await this.assignmentQueue.add('auto-assign-operator-job', {
          bookingId: newBooking.id,
          bookingRef: newBooking.bookingRef,
          tourType: newBooking.tourType,
          latitude: newBooking.latitude,
          longitude: newBooking.longitude,
        }, {
          attempts: 3,       
          backoff: 5000, 
          removeOnComplete: true, // Tối ưu bộ nhớ cho Redis, chạy xong tự xóa job
          removeOnFail: false,    // Giữ lại job lỗi để sau này Admin vào xem tại sao chia đơn hỏng
        });
      } catch (queueError) {
        // Chỉ ghi nhận log lỗi vận hành, KHÔNG ném lỗi ra ngoài làm chết request người dùng
        console.error(`[Queue Emergency Log] Không thể đẩy job điều phối cho đơn ${newBooking.bookingRef}:`, queueError);
      }

      return newBooking;

    } catch (error) {
      // 🎯 BẮT TRỌN VÀ GIẢI ĐỘC CÁC MÃ LỖI PRISMA
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // P2002: Lỗi trùng Unique (Ví dụ: Trùng bookingRef)
        if (error.code === 'P2002') {
          throw new ConflictException(
            `Trùng lặp dữ liệu: Mã tham chiếu '${dto.bookingRef}' đã tồn tại trên hệ thống.`
          );
        }

        // P2003: Lỗi khóa ngoại (Ví dụ: rawDataId truyền lên không có thật)
        if (error.code === 'P2003') {
          throw new BadRequestException(
            `Liên kết dữ liệu thất bại: 'rawDataId' được cung cấp không tồn tại trong hệ thống.`
          );
        }
      }
      
      // Bọc toàn bộ lỗi hệ thống lạ (nếu có) thành 500 chung chung để bảo mật tuyệt đối cấu trúc file
      throw new InternalServerErrorException('Đã xảy ra lỗi hệ thống trong quá trình xử lý đơn hàng.');
    }
  }

  /**
   * 📋 Tìm kiếm toàn bộ Bookings xếp theo ngày tạo mới nhất
   */
  async findAll() {
    try {
      return await this.prisma.booking.findMany({
        orderBy: {
          id: 'desc', // Sắp xếp bản ghi mới tạo hiển thị lên đầu bảng điều khiển
        },
      });
    } catch (error) {
      console.error('[Prisma Error] Không thể truy vấn danh sách bookings:', error);
      throw new InternalServerErrorException('Không thể tải danh sách đơn hàng từ máy chủ.');
    }
  }
}


