import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { ParsedEmailDto } from './dto/parsedEmail.dto';
import { TourType, BookingStatus } from '@prisma/client';

// 🌐 REAL GOOGLE MAPS IMPORTS (Kept for future use)
// import { Client as GoogleMapsClient } from '@googlemaps/google-maps-services-js';

@Processor('booking-processing-queue')
export class GmailConsumer {
  private readonly logger = new Logger(GmailConsumer.name);
  // private readonly googleMapsClient: GoogleMapsClient; // (Future use)

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {
    // Initialize the official Google client once when the worker boots up
    // this.googleMapsClient = new GoogleMapsClient({}); // (Future use)
  }

  @Process('process-email-job')
  async handleEmailJob(job: Job<{ bookingKey: string; payload: ParsedEmailDto }>) {
    const { bookingKey, payload } = job.data;
    this.logger.log(`[CONVEYOR BELT OUT] Starting Stage 2 processing for: ${bookingKey}`);

    // ─── STEP 1: FAST LANDING GROUNDWORK ─────────────────────────────
    let rawDataRecord = await this.prisma.rawData.findUnique({
      where: { sourceId: payload.messageId || bookingKey }
    });

    if (!rawDataRecord) {
      rawDataRecord = await this.prisma.rawData.create({
        data: {
          sourceId: payload.messageId || bookingKey,
          payload: payload as any,
          status: 'PENDING',
        },
      });
    }

    try {
      // ─── STEP 2: MULTI-LAYER COST-SAVING GEOCODING LAYER ────────────
      const rawAddress =
        payload.bookingData?.hotelAddress ||
        payload.bookingData?.pickupLocation ||
        payload.bookingData?.pickUpAddress;

      const hotelName = payload.bookingData?.pickUp || payload.bookingData?.hotelName || '';

      // CRITICAL LOG: See exactly what we are processing
      this.logger.log(`[GEO-DEBUG] Attempting lookup: Address="${rawAddress}", Hotel="${hotelName}"`);

      let finalCoordinates = { lat: null as number | null, lng: null as number | null };
      console.log(`[GEO-DEBUG] Raw Address: "${rawAddress}", Hotel Name: "${hotelName}"`);
      if (rawAddress) {
        // Normalize strings for comparison
        const sanitizedAddress = rawAddress.trim().toLowerCase();
        const normalizedHotelName = hotelName.trim().toLowerCase();

        const redisGeoKey = `geo:cache:${sanitizedAddress}`;

        // LAYER 1: CHECK REDIS CACHE (RAM) 
        const cachedData = await this.redisService.get(redisGeoKey);

        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          // Validate hotelName match on cached record
          if (parsed.hotelName?.toLowerCase().trim() === normalizedHotelName) {
            this.logger.log(`[GEO-CACHE HIT] Found coordinates in Redis RAM for: ${sanitizedAddress}`);
            finalCoordinates = { lat: parsed.lat, lng: parsed.lng };
          } else {
            this.logger.warn(`[GEO-CACHE MISMATCH] Hotel name mismatch for address: ${sanitizedAddress}`);
          }
        } else {
          // LAYER 2: CHECK POSTGRES TABLE
          this.logger.log(`[GEO-CACHE MISS] Checking Postgres Coordinate Table for: ${sanitizedAddress}`);

          const dbRecord = await this.prisma.coordinate.findUnique({
            where: { address: sanitizedAddress },
          });

          // Validate hotelName match on DB record
          if (dbRecord && dbRecord.hotelName?.toLowerCase().trim() === normalizedHotelName) {
            this.logger.log(`[GEO-DB HIT] Found coordinates in Postgres Table. Saving to Redis RAM.`);
            finalCoordinates = { lat: dbRecord.latitude, lng: dbRecord.longitude };

            const ONE_MONTH_SECONDS = 30 * 24 * 60 * 60;
            await this.redisService.set(
              redisGeoKey,
              JSON.stringify({
                lat: dbRecord.latitude,
                lng: dbRecord.longitude,
                hotelName: dbRecord.hotelName
              }),
              ONE_MONTH_SECONDS
            );
          } else {
            // LOG: Capture the inputs that failed to match
            this.logger.warn(`[GEO-MISS] No match found for Address: "${sanitizedAddress}" and Hotel: "${normalizedHotelName}"`);

            // LOG: If you have a dbRecord, log what the DB actually had 
            // so you can see if it was a wrong name or a missing address
            if (dbRecord) {
              this.logger.debug(`[GEO-DEBUG] DB record found, but name mismatch. DB Name: "${dbRecord.hotelName}"`);
            } else {
              this.logger.debug(`[GEO-DEBUG] No record found in DB for address: "${sanitizedAddress}"`);
            }

            finalCoordinates = { lat: null, lng: null };

            /* ... Proceed to Google API Logic ... */
          }
        }
      }

      // ─── STEP 3: PAYLOAD CONVERSION & METRIC ARITHMETIC ─────────────
      const bookingData = payload.bookingData;
      const totalAdults = Number(bookingData?.paxDetail?.adults || 0);
      const totalChildren = Number(bookingData?.paxDetail?.children || 0);
      const totalInfants = Number(bookingData?.paxDetail?.infants || 0);
      const calculatedTotalPax = totalAdults + totalChildren + totalInfants;

      let mappedTourType: TourType | null = null;
      const rawTourNameLower = bookingData?.tourName?.toLowerCase() || '';
      if (rawTourNameLower.includes('private')) {
        mappedTourType = TourType.PRIVATE_TOUR;
      } else if (rawTourNameLower.includes('group')) {
        mappedTourType = TourType.GROUP_TOUR;
      }

      let parsedStartingDate: Date | null = null;
      if (bookingData?.travelDate) {
        parsedStartingDate = new Date(bookingData.travelDate);
      }

      // ─── STEP 4: WRITE FINAL STRUCTURED BOOKING RECORD ─────────────
      await this.prisma.booking.create({
        data: {
          bookingRef: bookingData?.bookingRef || `REF-${Date.now()}`,
          provider: payload.provider,
          status: BookingStatus.PENDING,

          address: rawAddress || null,
          latitude: finalCoordinates.lat,
          longitude: finalCoordinates.lng,

          startingDate: parsedStartingDate,

          customerName: bookingData?.customerName || 'Unknown Customer',
          phone: bookingData?.customerPhone || null,
          mail: bookingData?.customerEmail || null,

          totalPax: calculatedTotalPax > 0 ? calculatedTotalPax : (bookingData?.totalPax || 0),
          paxDetail: {
            adults: totalAdults,
            children: totalChildren,
            infants: totalInfants
          } as any,

          tourType: mappedTourType,
          tourName: bookingData?.tourName || 'Standard Tour',

          payment: null,
          rawDataId: rawDataRecord.id,
        },
      });

      // ─── STEP 5: CLOSE PIPELINE STEP STATE ──────────────────────────
      await this.prisma.rawData.update({
        where: { id: rawDataRecord.id },
        data: { status: 'PROCESSED' },
      });

      this.logger.log(`[COMPLETED SUCCESS] Booking pipeline closed cleanly for reference key: ${bookingKey}.`);

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[PIPELINE FAILURE] Failed processing booking metrics: ${message}`);
      await this.prisma.rawData.update({
        where: { id: rawDataRecord.id },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  }
}
 