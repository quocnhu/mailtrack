// src/booking/booking.service.ts
import { Injectable, ConflictException, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Prisma, BookingStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('booking-assignment-queue') private readonly assignmentQueue: Queue,
  ) {}

  /**
   * 🚚 DISPATCHER ENGINE: Handle incoming raw bookings and stage them for automatic lane grouping
   */
  async create(dto: CreateBookingDto) {
    try {
      const uniqueSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
      const fallbackRef = `REF-${Date.now()}-${uniqueSuffix}`;

      // Ingest raw booking data. Defaults vehicle layouts to null so the consumer can claim them.
      const newBooking = await this.prisma.booking.create({
        data: {
          bookingRef: dto.bookingRef?.trim() || fallbackRef, 
          provider: dto.provider || 'manual-entry', 
          status: (dto.status as BookingStatus) || BookingStatus.PENDING,
          address: dto.address || null,
          latitude: dto.latitude ?? null,   
          longitude: dto.longitude ?? null, 
          startingDate: dto.startingDate ? new Date(dto.startingDate) : null,
          customerName: dto.customerName?.trim() || 'Unknown Customer',
          hotelName: dto.hotelName?.trim() || 'Unknown Hotel',
          phone: dto.phone || null,
          mail: dto.mail || null,
          totalPax: dto.totalPax || 0,
          paxDetail: dto.paxDetail || null, // Matches string? field layout in your schema
          tourType: dto.tourType || null,
          tourName: dto.tourName || null,
          payment: dto.payment || 'PENDING',
          rawDataId: dto.rawDataId ?? null,
          vehicleId: null,
          lanePosition: null,
        },
      });

      // Delegate asset sorting downstream to the background Bull optimization queue worker
      try {
        await this.assignmentQueue.add('manual-assign-operator-job', {
          bookingId: newBooking.id,
          bookingRef: newBooking.bookingRef,
          tourType: newBooking.tourType,
          tourName: newBooking.tourName,
          startingDate: newBooking.startingDate,
        }, {
          attempts: 3,       
          backoff: 5000, 
          removeOnComplete: true, 
          removeOnFail: false,    
        });
      } catch (queueError) {
        console.error(`[Queue Warning] Auto-grouping assignment bypass for ${newBooking.bookingRef}:`, queueError);
      }

      return newBooking;

    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') throw new ConflictException(`Data collision: Code '${dto.bookingRef}' exists.`);
        if (error.code === 'P2003') throw new BadRequestException(`Foreign key mismatch: 'rawDataId' is invalid.`);
      }
      throw new InternalServerErrorException('System error encountered while processing raw booking data.');
    }
  }

  /**
   * 🛑 DISPATCHER CANCELLATION GUARD: Strips assets from lanes safely using bookingRef
   */
  async cancelBooking(bookingRef: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        
        // 1. Single database trip: Pull target booking AND join its unique layout assignment 
        const target = await tx.booking.findUnique({ 
          where: { bookingRef: bookingRef },
          include: { assignment: true } // 🎯 Match updated lowercase schema field name
        });
        
        if (!target) {
          throw new NotFoundException(`Requested operational record '${bookingRef}' not found.`);
        }

        // 2. Isolate and remove from layout sequences first to ensure lane continuous integrity
        // 🎯 Safely check if vehicleId and assignment exist before reading nested sequence numbers
        if (target.vehicleId && target.assignment) {
          
          // Capture the index sequence number safely into a scoped variable
          const currentSequenceIndex = target.assignment.sequenceIndex;
          const assignedVehicleId = target.vehicleId;

          // Delete assignment row directly using its strict 1-to-1 unique foreign key relationship
          await tx.assignment.delete({ 
            where: { bookingId: target.id } 
          });

          // Collapse visual row indexing gaps in this specific bus lane instantly
          await tx.assignment.updateMany({
            where: {
              vehicleId: assignedVehicleId,
              sequenceIndex: { gt: currentSequenceIndex }
            },
            data: { sequenceIndex: { decrement: 1 } }
          });
        }

        // 3. Complete dispatch removal: Decouple lane fields and flip status to CANCELLED
        return await tx.booking.update({
          where: { bookingRef: bookingRef }, 
          data: {
            status: BookingStatus.CANCELED, 
            vehicleId: null,
            lanePosition: null
          }
        });
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('[Dispatcher Error] Safe cancellation sequence interrupted:', error);
      throw new InternalServerErrorException('Dispatcher failed to safely clear lane structure during cancellation.');
    }
  }

  /**
   * 📊 FEED CONSUMER: Pull sorted operational lines straight to the frontend dashboard matrix
   */
  async findAll() {
    try {
      return await this.prisma.booking.findMany({
        include: {
          assignment: true // 🎯 Match updated lowercase schema relation field name
        },
        orderBy: [
          { startingDate: 'asc' },
          { tourName: 'asc' } 
        ]
      });
    } catch (error) {
      console.error('[Prisma Error] Failed to fetch active dispatch map:', error);
      throw new InternalServerErrorException('Could not retrieve booking configurations.');
    }
  }

  /**
 * 🎛️ DRAG & DROP ENGINE: Explicitly handles user manual lane drops and re-indexing
 */
async updateDroppedSequence(bookingId: string, targetVehicleId: string | null, newSequenceIndex: number) {
  try {
    return await this.prisma.$transaction(async (tx) => {
      
      // 1. Find the current layout state of the moving booking card
      const currentAssignment = await tx.assignment.findUnique({
        where: { bookingId }
      });

      if (!currentAssignment) {
        // If it was in the unassigned pool, it won't have an Assignment record yet
        // Create a new assignment row at the user's targeted dropped location
        await tx.assignment.create({
          data: { bookingId, vehicleId: targetVehicleId || 'UNASSIGNED', sequenceIndex: newSequenceIndex }
        });
      } else {
        // 2. If it moved within or between active lanes, clear its old layout footprint first
        await tx.assignment.delete({ where: { bookingId } });

        // Collapse the gap left behind in the source lane
        await tx.assignment.updateMany({
          where: {
            vehicleId: currentAssignment.vehicleId,
            sequenceIndex: { gt: currentAssignment.sequenceIndex }
          },
          data: { sequenceIndex: { decrement: 1 } }
        });
      }

      // 3. Make room in the destination lane by shifting lower items down by 1
      if (targetVehicleId) {
        await tx.assignment.updateMany({
          where: {
            vehicleId: targetVehicleId,
            sequenceIndex: { gte: newSequenceIndex }
          },
          data: { sequenceIndex: { increment: 1 } }
        });

        // 4. Lock the moved booking card into its precise new slot
        await tx.assignment.upsert({
          where: { bookingId },
          create: { bookingId, vehicleId: targetVehicleId, sequenceIndex: newSequenceIndex },
          update: { vehicleId: targetVehicleId, sequenceIndex: newSequenceIndex }
        });
      }

      // 5. Update the parent Booking entity relation wrapper
      return await tx.booking.update({
        where: { id: bookingId },
        data: { 
          vehicleId: targetVehicleId,
          // If moved back to unassigned staging, revert status to PENDING
          status: targetVehicleId ? 'ASSIGNED' : 'PENDING' 
        }
      });
    });
  } catch (error) {
    console.error('[Dispatcher Drag Error] Failed to persist layout shift:', error);
    throw new InternalServerErrorException('Database failed to re-index lanes during layout shift.');
  }
}

}
// // src/booking/booking.service.ts
// import { Injectable, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
// import { PrismaService } from '@/prisma/prisma.service';
// import { InjectQueue } from '@nestjs/bull';
// import type { Queue } from 'bull';
// import { CreateBookingDto } from './dto/create-booking.dto';
// import { Prisma } from '@prisma/client';
// import * as crypto from 'crypto'; // 🚀 Thêm thư viện lõi của Node.js để sinh chuỗi ngẫu nhiên

// @Injectable()
// export class BookingService {
//   constructor(
//     private readonly prisma: PrismaService,
//     @InjectQueue('booking-assignment-queue') private readonly assignmentQueue: Queue,
//   ) {}

//   async create(dto: CreateBookingDto) {
//     try {
//       // 🛡️ Giải quyết triệt để lỗi trùng mili-giây bằng chuỗi ngẫu nhiên mã hóa crypto
//       const uniqueSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
//       const fallbackRef = `REF-${Date.now()}-${uniqueSuffix}`;

//       // 1. Ghi nhận thông tin vào Database
//       const newBooking = await this.prisma.booking.create({
//         data: {
//           bookingRef: dto.bookingRef?.trim() || fallbackRef, 
//           provider: dto.provider || 'manual-entry', 
//           status: dto.status,
//           address: dto.address || null,
//           latitude: dto.latitude ?? null,   
//           longitude: dto.longitude ?? null, 
//           startingDate: dto.startingDate ? new Date(dto.startingDate) : null,
//           customerName: dto.customerName?.trim() || 'Unknown Customer',
//           hotelName: dto.hotelName?.trim() || 'Unknown Hotel',
//           phone: dto.phone || null,
//           mail: dto.mail || null,
//           totalPax: dto.totalPax || 0,
//           paxDetail: dto.paxDetail as Prisma.InputJsonValue, 
//           tourType: dto.tourType || null,
//           tourName: dto.tourName || null,
//           payment: dto.payment || null,
//           rawDataId: dto.rawDataId ?? null, 
//         } as Prisma.BookingUncheckedCreateInput,
//       });

//       // 2. 🚀 CÔ LẬP LUỒNG CHẠY NGẦM ĐIỀU PHỐI (STAGE 3)
//       // Bọc riêng luồng Queue để nếu Redis có sập, đơn hàng trong DB vẫn được tạo an toàn
//       try {
//         await this.assignmentQueue.add('manual-assign-operator-job', {
//           bookingId: newBooking.id,
//           bookingRef: newBooking.bookingRef,
//           tourType: newBooking.tourType,
//           latitude: newBooking.latitude,
//           longitude: newBooking.longitude,
//         }, {
//           attempts: 3,       
//           backoff: 5000, 
//           removeOnComplete: true, // Tối ưu bộ nhớ cho Redis, chạy xong tự xóa job
//           removeOnFail: false,    // Giữ lại job lỗi để sau này Admin vào xem tại sao chia đơn hỏng
//         });
//       } catch (queueError) {
//         // Chỉ ghi nhận log lỗi vận hành, KHÔNG ném lỗi ra ngoài làm chết request người dùng
//         console.error(`[Queue Emergency Log] Không thể đẩy job điều phối cho đơn ${newBooking.bookingRef}:`, queueError);
//       }

//       return newBooking;

//     } catch (error) {
//       // 🎯 BẮT TRỌN VÀ GIẢI ĐỘC CÁC MÃ LỖI PRISMA
//       if (error instanceof Prisma.PrismaClientKnownRequestError) {
//         // P2002: Lỗi trùng Unique (Ví dụ: Trùng bookingRef)
//         if (error.code === 'P2002') {
//           throw new ConflictException(
//             `Trùng lặp dữ liệu: Mã tham chiếu '${dto.bookingRef}' đã tồn tại trên hệ thống.`
//           );
//         }

//         // P2003: Lỗi khóa ngoại (Ví dụ: rawDataId truyền lên không có thật)
//         if (error.code === 'P2003') {
//           throw new BadRequestException(
//             `Liên kết dữ liệu thất bại: 'rawDataId' được cung cấp không tồn tại trong hệ thống.`
//           );
//         }
//       }
      
//       // Bọc toàn bộ lỗi hệ thống lạ (nếu có) thành 500 chung chung để bảo mật tuyệt đối cấu trúc file
//       throw new InternalServerErrorException('Đã xảy ra lỗi hệ thống trong quá trình xử lý đơn hàng.');
//     }
//   }

//   /**
//    * 📋 Tìm kiếm toàn bộ Bookings xếp theo ngày tạo mới nhất
//    */
//   async findAll() {
//     try {
//       return await this.prisma.booking.findMany({
//         orderBy: {
//           id: 'desc', // Sắp xếp bản ghi mới tạo hiển thị lên đầu bảng điều khiển
//         },
//       });
//     } catch (error) {
//       console.error('[Prisma Error] Không thể truy vấn danh sách bookings:', error);
//       throw new InternalServerErrorException('Không thể tải danh sách đơn hàng từ máy chủ.');
//     }
//   }
// }





// datasource db {
//   provider = "postgresql" // Or "mysql" / "sqlite" depending on your infrastructure
//   url      = env("DATABASE_URL")
// }

// generator client {
//   provider = "prisma-client-js"
// }

// /// 🚥 System-wide Core Booking Enums
// enum TourType {
//   GROUP
//   PRIVATE
// }

// enum BookingStatus {
//   PENDING    // Map to '🟡 PENDING / UNASSIGNED DRAFT' on the floor
//   ASSIGNED   // Map to '🟢 ASSIGNED' inside a locked bus/asset lane
//   CANCELLED
// }

// enum GuideType {
//   OFFICIAL
//   FREELANCER
// }

// /// 🎫 Individual Passenger Ticket Model
// model Booking {
//   id            String        @id @default(uuid()) @db.Uuid
//   bookingRef    String        @unique // e.g., "REF-9901" or "REF-ADMIN-777"
//   customerName  String        // 👤 Traveler name displayed on card header
//   customerPhone String        // 📞 Phone number printed side-by-side with pax
//   hotelAddress  String        // 🏨 Specific pickup landmark text string
//   totalPax      Int           // 👥 Numerical headcount weight for the vehicle load calculations
//   tourType      TourType      @default(GROUP)
//   itinerary     String        // 📍 Destination identifier (e.g., "Cu Chi", "Mekong")
//   status        BookingStatus @default(PENDING)
//   tourDate      DateTime      @db.Date
//   createdAt     DateTime      @default(now())
//   updatedAt     DateTime      @updatedAt

//   /// 📐 DRAG & DROP POSITION TRACKER
//   /// Organizes items 1, 2, 3... locally inside its container box.
//   positionIndex Int           @default(0)

//   /// 🔗 Relation to the Dispatched Fleet Vehicle Row
//   vehicleId       String?            @db.Uuid
//   assignedVehicle AssignmentVehicle? @relation(fields: [vehicleId], references: [id], onDelete: SetNull)

//   /// 🏎️ Performance Composite Tracking Indexes
//   @@index([tourDate, tourType, status])
//   @@index([vehicleId, positionIndex asc])
// }

// /// 🚌 Physical Asset / Route Placeholder Container Model
// model AssignmentVehicle {
//   id           String   @id @default(uuid()) @db.Uuid
//   tourDate     DateTime @db.Date
//   itinerary    String   // 📍 Inherits route text from children items ("Cu Chi", "Mekong")
//   tourType     TourType @default(GROUP)
  
//   /// 🏷️ BRANDING & ASSET NAMING
//   /// Defaults to a temporary string like "Cu Chi Tour [GROUP]" during staging.
//   /// Flips to "INTERNAL BUS #1" or "PARTNER SUV - SAIGONTRANSIT" after asset assignment.
//   providerName String   @default("Generic Placeholder Lane")
//   maxPax       Int      @default(12) // Maximum seating boundary limit constraints

//   /// 🧑‍💼 CREW RECORDS
//   guideName    String?
//   guideType    GuideType?
//   driverName   String?
//   driverPhone  String?

//   /// 📐 COLUMN SORT INDEX
//   /// Controls the structural arrangement of the entire bus cards column grid.
//   layoutIndex  Int      @default(0)
//   createdAt    DateTime @default(now())
//   updatedAt    DateTime @updatedAt

//   /// 🔗 One-to-Many Relational Nested Bookings Backlink Array
//   bookings     Booking[]

//   @@index([tourDate, tourType, layoutIndex asc])
// }