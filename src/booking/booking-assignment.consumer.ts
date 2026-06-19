import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { PrismaService } from '@/prisma/prisma.service';
import { Logger } from '@nestjs/common'; // Add this import

@Processor('booking-assignment-queue')
export class BookingAssignmentProcessor {
  private readonly logger = new Logger(BookingAssignmentProcessor.name); // Initialize logger
  constructor(private readonly prisma: PrismaService) {}

  @Process('manual-assign-operator-job')
  async handleAutoGrouping(job: Job<{ bookingId: string; tourName: string; tourType: string; startingDate: string; totalPax: number }>) {
    const { bookingId, tourName, tourType, startingDate, totalPax } = job.data;
    this.logger.log(`Processing booking: ${job.data.bookingId}, Pax: ${job.data.totalPax}`);
    console.log(`Processing booking for assignment: ${job.data.bookingId}, Pax: ${job.data.totalPax}`);
    const targetDate = new Date(startingDate);

    // 1. ISOLATE PRIVATE TOURS
    if (tourType === 'PRIVATE_TOUR') {
      const newVehicleId = `BUS-PVT-${Date.now()}`;
      await this.assignToNewLane(bookingId, newVehicleId, 0);
      return;
    }

    // 2. PROCESSING GROUP TOURS
    let remainingPax = totalPax;

    while (remainingPax > 0) {
      const currentBatchPax = Math.min(remainingPax, 12);
      const existingLane = await this.findAvailableGroupLane(tourName, targetDate, currentBatchPax);

      if (existingLane) {
        const nextIndex = await this.getNextSequenceIndex(existingLane.vehicleId);
        
        // Use the original bookingId (The schema now supports multiple assignments)
        await this.prisma.assignment.create({
          data: { 
            bookingId: bookingId, 
            vehicleId: existingLane.vehicleId, 
            sequenceIndex: nextIndex 
          }
        });

        remainingPax -= currentBatchPax;
      } else {
        const newVehicleId = `BUS-GRP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        await this.assignToNewLane(bookingId, newVehicleId, 0);
        
        remainingPax -= currentBatchPax;
      }
    }
  }

  private async findAvailableGroupLane(tourName: string, date: Date, incomingPax: number) {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    // Look for all assignments grouped by vehicle
    const activeAssignments = await this.prisma.assignment.findMany({
      where: {
        booking: {
          tourName,
          startingDate: { gte: startOfDay, lte: endOfDay }
        }
      },
      include: { booking: true }
    });

    // Calculate occupancy per vehicle
    const laneOccupancy: Record<string, number> = {};
    activeAssignments.forEach((a) => {
      laneOccupancy[a.vehicleId] = (laneOccupancy[a.vehicleId] || 0) + (a.booking.totalPax / Math.ceil(a.booking.totalPax / 12)); 
    });

    for (const [vehicleId, currentPaxTotal] of Object.entries(laneOccupancy)) {
      if (currentPaxTotal + incomingPax <= 12) {
        return { vehicleId };
      }
    }
    return null;
  }

  private async getNextSequenceIndex(vehicleId: string): Promise<number> {
    return await this.prisma.assignment.count({ where: { vehicleId } });
  }

  private async assignToNewLane(bookingId: string, vehicleId: string, index: number): Promise<void> {
    await this.prisma.assignment.create({
      data: { bookingId, vehicleId, sequenceIndex: index }
    });
  }
}
