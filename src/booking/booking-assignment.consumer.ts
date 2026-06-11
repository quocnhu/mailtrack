// src/booking/booking-assignment.consumer.ts
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from '@/prisma/prisma.service';
import * as geolib from 'geolib';

interface AssignmentJobData {
  bookingId: number;
  bookingRef: string;
  tourType: string;
  latitude: number | null;
  longitude: number | null;
}

@Processor('booking-assignment-queue')
export class BookingAssignmentConsumer {
  constructor(private readonly prisma: PrismaService) {}

  @Process('manual-assign-operator-job')
  async handleBookingAssignment(job: Job<AssignmentJobData>) {
    const { bookingId, tourType, latitude, longitude } = job.data;

    console.log(`[Dispatch Engine] Processing Booking #${bookingId} (${tourType})`);

    try {
      // 1. Fetch current booking details & double-check cancellation status
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking || booking.status === 'CANCELLED') {
        console.log(`[Dispatch Engine] Booking #${bookingId} is cancelled or missing. Skipping auto-allocation.`);
        return;
      }

      const tourDate = booking.startingDate;
      if (!tourDate) return;

      // 2. Fetch all active buses for this day to analyze current load & manual overrides
      // Note: We respect 'isLocked' or custom sequences set by Admin drag-and-drop actions
      const activeBuses = await this.prisma.busAssignment.findMany({
        where: { date: tourDate },
        include: {
          bookings: true,
          tourGuide: true,
          driver: true,
        },
      });

      // 3. SEPARATION: Handle Private vs Group allocations
      if (tourType === 'Private') {
        await this.assignToPrivateBus(booking, activeBuses);
      } else {
        await this.assignToGroupBus(booking, activeBuses, latitude, longitude);
      }

    } catch (error) {
      console.error(`[Dispatch Engine Error] Failed processing job ${job.id}:`, error);
      throw error; // Let Bull handle the backoff attempts configured in your service
    }
  }

  /**
   * GROUP TOUR LOGIC: Clustered by distance (Geolib) & Capped at 12 Pax
   */
  private async assignToGroupBus(booking: any, activeBuses: any[], lat: number | null, lng: number | null) {
    let targetBus = null;
    let closestDistance = Infinity;

    // Filter out buses that already hit the 12 pax threshold or are designated for Private tours
    const availableBuses = activeBuses.filter(bus => {
      const currentPaxCount = bus.bookings.reduce((sum: number, b: any) => sum + b.totalPax, 0);
      return bus.type === 'Group' && (currentPaxCount + booking.totalPax) <= 12;
    });

    if (availableBuses.length > 0 && lat && lng) {
      // Sort buses by geographical proximity using Geolib to optimize pickup routes
      for (const bus of availableBuses) {
        // Find the "anchor" location of the bus (the coordinates of its first pickup)
        const anchorBooking = bus.bookings[0];
        if (anchorBooking && anchorBooking.latitude && anchorBooking.longitude) {
          const distance = geolib.getDistance(
            { latitude: lat, longitude: lng },
            { latitude: anchorBooking.latitude, longitude: anchorBooking.longitude }
          );

          if (distance < closestDistance) {
            closestDistance = distance;
            targetBus = bus;
          }
        } else {
          // If the bus is empty but exists, prioritize it
          targetBus = bus;
          break;
        }
      }
    }

    // If no eligible bus is found under the 12-pax ceiling, create a brand-new empty bus assignment
    if (!targetBus) {
      targetBus = await this.prisma.busAssignment.create({
        data: {
          date: booking.startingDate,
          type: 'Group',
          status: 'PROPOSED',
        },
        include: { bookings: true },
      });
    }

    // Bind booking to the designated vehicle
    await this.prisma.booking.update({
      where: { id: booking.id },
      data: { busAssignmentId: targetBus.id },
    });

    // 4. Run smart crew provisioning optimizations for the selected bus
    await this.optimizeCrewAssignments(targetBus.id, booking.startingDate, booking.tourName);
  }

  /**
   * PRIVATE TOUR LOGIC: Isolated configurations
   */
  private async assignToPrivateBus(booking: any, activeBuses: any[]) {
    // Private tours strictly command dedicated transfers. Create an exclusive bus instantly.
    const newPrivateBus = await this.prisma.busAssignment.create({
      data: {
        date: booking.startingDate,
        type: 'Private',
        status: 'PROPOSED',
      },
    });

    await this.prisma.booking.update({
      where: { id: booking.id },
      data: { busAssignmentId: newPrivateBus.id },
    });

    await this.optimizeCrewAssignments(newPrivateBus.id, booking.startingDate, booking.tourName);
  }

  /**
   * CREW AUTOMATION PROTOCOL (Guides Matrix & Provider Driver Matching)
   */
  private async optimizeCrewAssignments(busId: number, date: Date, tourName: string) {
    // --- 1. TOUR GUIDE ALLOCATION MATRIX ---
    // Fetch guides while checking availability
    const tourGuides = await this.prisma.tourGuide.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [
        { type: 'OFFICIAL' }, // Official guides take absolute priority
        { id: 'asc' },        // Freelancers act as secondary backups
      ],
    });

    let assignedGuideId = null;

    for (const guide of tourGuides) {
      // Rule constraint: Skip guides booked on consecutive > 2 days tours
      const consecutiveToursCount = await this.prisma.busAssignment.count({
        where: {
          tourGuideId: guide.id,
          date: {
            gte: new Date(new Date(date).setDate(date.getDate() - 2)),
            lte: date,
          },
        },
      });

      if (consecutiveToursCount < 2) {
        assignedGuideId = guide.id;
        break; // Guard found, assign immediately
      }
    }

    // --- 2. DRIVER & TRANSPORT PROVIDER MATCHING ---
    // Extract driver details mapped dynamically to specific contract vendors matching the tour template
    const matchedDriver = await this.prisma.driverRegistry.findFirst({
      where: {
        providerVehicleType: 'BUS',
        assignedTours: {
          has: tourName, // Verification that driver matches specified transport rules
        },
        // Verify they aren't already booked on this day
        commitments: {
          none: { date: date },
        },
      },
    });

    // Apply optimizations to the dynamic manifest
    await this.prisma.busAssignment.update({
      where: { id: busId },
      data: {
        tourGuideId: assignedGuideId || undefined,
        driverId: matchedDriver ? matchedDriver.id : undefined,
      },
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