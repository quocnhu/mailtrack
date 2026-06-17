// src/booking/booking-assignment.processor.ts
import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { PrismaService } from '@/prisma/prisma.service';

@Processor('booking-assignment-queue')
export class BookingAssignmentProcessor {
  constructor(private readonly prisma: PrismaService) {}

  @Process('manual-assign-operator-job')
  async handleAutoGrouping(job: Job<{ bookingId: string; tourName: string; tourType: string; startingDate: string; totalPax: number }>) {
    const { bookingId, tourName, tourType, startingDate, totalPax } = job.data;
    const targetDate = new Date(startingDate);

    // 1. ISOLATE PRIVATE TOURS
    if (tourType === 'PRIVATE_TOUR') {
      const newVehicleId = `BUS-PVT-${Date.now()}`;
      await this.assignToNewLane(bookingId, newVehicleId, 0);
      return;
    }

    // 2. PROCESSING GROUP TOURS
    let remainingPax = totalPax;
    let isFirstBatch = true;

    while (remainingPax > 0) {
      const currentBatchPax = Math.min(remainingPax, 12);
      const existingLane = await this.findAvailableGroupLane(tourName, targetDate, currentBatchPax);

      if (existingLane) {
        const nextIndex = await this.getNextSequenceIndex(existingLane.vehicleId);
        
        await this.prisma.$transaction(async (tx) => {
          await tx.assignment.create({
            data: { 
              bookingId: isFirstBatch ? bookingId : `${bookingId}-SPLIT-${Date.now()}`, 
              vehicleId: existingLane.vehicleId, 
              sequenceIndex: nextIndex 
            }
          });
          await tx.booking.update({
            where: { id: bookingId },
            data: { vehicleId: existingLane.vehicleId }
          });
        });

        remainingPax -= currentBatchPax;
      } else {
        const newVehicleId = `BUS-GRP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const targetBookingId = isFirstBatch ? bookingId : `${bookingId}-SPLIT-${Date.now()}`;
        
        await this.assignToNewLane(targetBookingId, newVehicleId, 0);
        
        if (isFirstBatch) {
          await this.prisma.booking.update({
            where: { id: bookingId },
            data: { vehicleId: newVehicleId }
          });
        }
        
        remainingPax -= currentBatchPax;
      }
      isFirstBatch = false;
    }
  }

  private async findAvailableGroupLane(tourName: string, date: Date, incomingPax: number) {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const activeGroupBookings = await this.prisma.booking.findMany({
      where: {
        tourName,
        startingDate: { gte: startOfDay, lte: endOfDay },
        vehicleId: { startsWith: 'BUS-GRP-' }
      },
      include: { assignment: true }
    });

    const laneOccupancy: Record<string, number> = {};
    activeGroupBookings.forEach((b) => {
      if (b.vehicleId) {
        laneOccupancy[b.vehicleId] = (laneOccupancy[b.vehicleId] || 0) + b.totalPax;
      }
    });

    for (const [vehicleId, currentPaxTotal] of Object.entries(laneOccupancy)) {
      if (currentPaxTotal + incomingPax <= 12) {
        return { vehicleId };
      }
    }
    return null;
  }

  // 🎯 FIX: Explicitly mapped return type wrapper to match Prisma count operations
  private async getNextSequenceIndex(vehicleId: string): Promise<number> {
    const count = await this.prisma.assignment.count({ where: { vehicleId } });
    return count;
  }

  private async assignToNewLane(bookingId: string, vehicleId: string, index: number): Promise<void> {
    await this.prisma.assignment.create({
      data: { bookingId, vehicleId, sequenceIndex: index }
    });
  }
}
// datasource db {
//   provider = "postgresql" // works perfectly with mysql or sqlite as well
//   url      = env("DATABASE_URL")
// }

// generator client {
//   provider = "prisma-client-js"
// }

// // =========================================================================
// // 🚌 BUS ASSIGNMENT MANIFEST (The Visual Columns/Cards)
// // =========================================================================
// model BusAssignment {
//   id          Int       @id @default(autoincrement())
//   date        DateTime  @db.Date
//   type        String    // "Group" or "Private"
//   busCode     String    // E.g., "G-1", "G-2", "P-1"
//   status      String    @default("PROPOSED") // "PROPOSED" (Open to adjustments) or "LOCKED" (Finalized)
//   tourName    String    // E.g., "Mekong Delta", "Cu Chi Tunnels"

//   // 🦺 Top-Left Controls: Crew Relations
//   tourGuideId Int?
//   tourGuide   TourGuide? @relation(fields: [tourGuideId], references: [id], onDelete: SetNull)
//   driverId    Int?
//   driver      Driver?    @relation(fields: [driverId], references: [id], onDelete: SetNull)

//   // 🎫 Middle Segment: Bookings assigned to this specific vehicle container
//   bookings    Booking[]

//   createdAt   DateTime   @default(now())
//   updatedAt   DateTime   @updatedAt

//   @@unique([date, type, busCode]) // Protects against duplicate bus names on the same day
//   @@index([date, status])         // Speeds up searching for unconfirmed crews on today's dashboard
// }

// // =========================================================================
// // 🎟️ BOOKING LEDGER (The Visual Ticket Rows inside your buses)
// // =========================================================================
// model Booking {
//   id              Int            @id @default(autoincrement())
//   bookingRef      String         @unique // Baseline confirmation code (e.g., "GET-91511242")
//   provider        String         // "tripadvisor", "getyourguide", "website", etc.
//   status          String         @default("CONFIRMED") // "CONFIRMED", "CANCELLED"
  
//   // Passenger Info displayed directly on your permanent info card
//   customerName    String
//   hotelName       String
//   address         String         // Detailed street pickup address
//   phone           String?
//   payment         String         @default("UNPAID") // "PAID" or "UNPAID"
//   guidedLanguage  String         @default("EN")     // "EN", "DE", "FR", etc.
//   paxDetail       Json           // Deep breakdown: {"adult": 2, "child": 1, "infant": 1}
//   totalPax        Int            @default(0)        // Total aggregate seat count (e.g., 4)

//   // Geolib Sorting Parameters
//   latitude        Float?
//   longitude       Float?
//   startingDate    DateTime       @db.Date
//   tourType        String         // "Group" or "Private"
//   tourName        String         // Matches the BusAssignment tourName

//   // 🔄 Drag & Drop Matrix Tracking Fields
//   busAssignmentId Int?
//   busAssignment   BusAssignment? @relation(fields: [busAssignmentId], references: [id], onDelete: SetNull)
//   sequence        Int            @default(0) // Handles vertical list index (0 = Index 1 on UI, 1 = Index 2...)

//   // ✂️ Split-Group Traceability Overspill Fields
//   isSplit         Boolean        @default(false)
//   parentRef       String?        // Traces back to original bookingRef if family split over 2 buses

//   createdAt       DateTime       @default(now())
//   updatedAt       DateTime       @updatedAt

//   // 🎯 HIGH-PERFORMANCE INDEXING FOR PERMANENT ROW SORTING
//   // This combined index guarantees that browser refreshes sort rows instantly without performance drops
//   @@index([busAssignmentId, sequence])
//   @@index([startingDate, status])
// }

// // =========================================================================
// // 🗺️ TOUR GUIDE DICTIONARY
// // =========================================================================
// model TourGuide {
//   id          Int             @id @default(autoincrement())
//   name        String          // E.g., "Alex"
//   type        String          // "OFFICIAL" or "FREELANCER"
//   status      String          @default("ACTIVE") // "ACTIVE", "INACTIVE"
//   phone       String?
  
//   assignments BusAssignment[] // Reverse relation to see history

//   createdAt   DateTime        @default(now())
//   updatedAt   DateTime        @updatedAt
// }

// // =========================================================================
// // 🚏 DRIVER FLEET DICTIONARY
// // =========================================================================
// model Driver {
//   id            Int             @id @default(autoincrement())
//   name          String          // E.g., "Mr. Chien"
//   phone         String?
//   providerName  String          // Company managing the asset
//   assignedTours String[]        // Array of certified locations they know how to drive to
  
//   assignments   BusAssignment[] // Reverse relation to track history

//   createdAt     DateTime        @default(now())
//   updatedAt     DateTime        @updatedAt
// }