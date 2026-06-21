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
          totalPax: newBooking.totalPax,
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

  async cancelBooking(bookingRef: string) {
  return await this.prisma.$transaction(async (tx) => {
    const target = await tx.booking.findUnique({
      where: { bookingRef },
      include: { assignment: true }
    });
    
    if (!target) throw new NotFoundException(`Record '${bookingRef}' not found.`);

    // 🎯 FIX: Use the 'as any' cast if TypeScript is stubborn about the generated type.
    // Since we know the schema is One-to-Many, this tells TS to treat it as an array.
    const assignments = (target.assignment as any[] | null) || [];
    const assignment = assignments[0];

    if (target.vehicleId && assignment) {
      await tx.assignment.delete({ where: { id: assignment.id } });

      await tx.assignment.updateMany({
        where: {
          vehicleId: target.vehicleId,
          sequenceIndex: { gt: assignment.sequenceIndex }
        },
        data: { sequenceIndex: { decrement: 1 } }
      });
    }

    return await tx.booking.update({
      where: { bookingRef },
      data: { status: BookingStatus.CANCELED, vehicleId: null }
    });
  });
}

// drag-and-drop, re-indexing, shifting items, and handling browser refreshes
  async updateDroppedSequence(bookingId: string, targetVehicleId: string | null, newSequenceIndex: number) {
  return await this.prisma.$transaction(async (tx) => {
    
    // 1. Remove existing assignment
    const currentAssignment = await tx.assignment.findFirst({ where: { bookingId } });
    if (currentAssignment) {
      await tx.assignment.delete({ where: { id: currentAssignment.id } });
      // Collapse gaps in the OLD lane
      await tx.assignment.updateMany({
        where: {
          vehicleId: currentAssignment.vehicleId,
          sequenceIndex: { gt: currentAssignment.sequenceIndex }
        },
        data: { sequenceIndex: { decrement: 1 } }
      });
    }

    // 2. Add new assignment
    if (targetVehicleId) {
      // Create space in the NEW lane
      await tx.assignment.updateMany({
        where: { vehicleId: targetVehicleId, sequenceIndex: { gte: newSequenceIndex } },
        data: { sequenceIndex: { increment: 1 } }
      });

      // Insert at the new index
      await tx.assignment.create({
        data: { bookingId, vehicleId: targetVehicleId, sequenceIndex: newSequenceIndex }
      });
    }

    // 3. Update Booking status only
    return await tx.booking.update({
      where: { id: bookingId },
      data: { 
        vehicleId: targetVehicleId,
        status: targetVehicleId ? BookingStatus.ASSIGNED : BookingStatus.PENDING 
      }
    });
  });
}

  async findAll() {
    return await this.prisma.booking.findMany({
      include: { assignment: true },
      orderBy: [{ startingDate: 'asc' }, { tourName: 'asc' }]
    });
  }
}

