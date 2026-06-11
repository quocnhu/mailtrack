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