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
      const rawAddress = payload.bookingData?.hotelAddress || payload.bookingData?.pickupLocation;
      const hotelName = payload.bookingData?.hotelName || 'Unknown Hotel';
      
      let finalCoordinates = { lat: null as number | null, lng: null as number | null };

      if (rawAddress) {
        const sanitizedAddress = rawAddress.trim().toLowerCase();
        const redisGeoKey = `geo:cache:${sanitizedAddress}`;

        // LAYER 1: CHECK REDIS CACHE (RAM) 
        const cachedCoordinates = await this.redisService.get(redisGeoKey);
        
        if (cachedCoordinates) {
          this.logger.log(`[GEO-CACHE HIT] Found coordinates in Redis RAM for: ${sanitizedAddress}`);
          finalCoordinates = JSON.parse(cachedCoordinates);
        } else {
          
          // LAYER 2: CHECK POSTGRES TABLE (DATABASE COOLDOWN CACHE)
          this.logger.log(`[GEO-CACHE MISS] Checking Postgres Coordinate Table for: ${sanitizedAddress}`);
          const dbCoordinates = await this.prisma.coordinate.findUnique({
            where: { address: sanitizedAddress },
          });

          if (dbCoordinates) {
            this.logger.log(`[GEO-DB HIT] Found coordinates in Postgres Table. Saving to Redis RAM.`);
            finalCoordinates = { lat: dbCoordinates.latitude, lng: dbCoordinates.longitude };
            
            const ONE_MONTH_SECONDS = 30 * 24 * 60 * 60;
            await this.redisService.set(redisGeoKey, JSON.stringify(finalCoordinates), ONE_MONTH_SECONDS);
          } else {
            
            // 🛑 LAYER 3: REAL GOOGLE API CALL WITH ALLEYWAY FALLBACK (TEMPORARILY DISABLED)
            this.logger.warn(`[GEO-LOCAL MISS] Address not found in local DB cache. Google API is disabled. Proceeding with null values.`);
            finalCoordinates = { lat: null, lng: null };

            /* ── UNCOMMENT THIS ENTIRE BLOCK TO RE-ENABLE GOOGLE MAPS API ──
            this.logger.warn(`[GEO-EXTERNAL] Hitting Google Maps API for: ${sanitizedAddress}`);
            
            await this.preventGeocodingSpam(sanitizedAddress);

            try {
              const googleResult = await this.callGoogleGeocodingApi(rawAddress);

              if (googleResult && googleResult.lat && googleResult.lng) {
                this.logger.log(`[GEO-GOOGLE SUCCESS] Address resolved. Saving to permanent lookup tables.`);
                finalCoordinates = { lat: googleResult.lat, lng: googleResult.lng };

                await this.prisma.coordinate.create({
                  data: {
                    address: sanitizedAddress,
                    hotelName: hotelName,
                    latitude: finalCoordinates.lat || 0, 
                    longitude: finalCoordinates.lng || 0, 
                  },
                });

                const ONE_MONTH_SECONDS = 30 * 24 * 60 * 60;
                await this.redisService.set(redisGeoKey, JSON.stringify(finalCoordinates), ONE_MONTH_SECONDS);
              } else {
                this.logger.warn(`[GEO-GOOGLE NULL] Google could not resolve matching coordinates for "${sanitizedAddress}". Using fallback null fields.`);
                finalCoordinates = { lat: null, lng: null };
              }
            } catch (googleApiError) {
              this.logger.error(`[GEO-GOOGLE CRASH] External Google HTTP endpoint failure: ${googleApiError.message}`);
              finalCoordinates = { lat: null, lng: null };
            }
            ─────────────────────────────────────────────────────────────── */
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
      this.logger.error(`[PIPELINE FAILURE] Failed processing booking metrics: ${error.message}`);
      await this.prisma.rawData.update({
        where: { id: rawDataRecord.id },
        data: { status: 'FAILED' },
      });
      throw error; 
    }
  }

  /**
   * ─── REAL GOOGLE GEOCODING API IMPLEMENTATION (Kept for future use)
   */
  /* private async callGoogleGeocodingApi(address: string): Promise<{ lat: number, lng: number } | null> {
    try {
      const response = await this.googleMapsClient.geocode({
        params: {
          address: address,
          key: process.env.GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_FALLBACK',
        },
        timeout: 5000, 
      });

      if (response.data.results && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng,
        };
      }

      return null;
    } catch (error) {
      this.logger.error(`[GOOGLE MAPS SDK ERROR] Failed fetching address payload: ${error.message}`);
      throw error; 
    }
  }
  */

  /**
   * Anti-Spam Layer Strategy Tracker (Kept for future use)
   */
  /*
  private async preventGeocodingSpam(sanitizedAddress: string): Promise<void> {
    const rateLimitKey = `geo:limit:window`;
    const currentHits = await this.redisService.get(rateLimitKey);
    const limit = 20; 

    if (currentHits && Number(currentHits) >= limit) {
      this.logger.error(`[ANTI-SPAM ALERT] Geocoding system ceiling threshold reached (${currentHits}/${limit}).`);
      throw new Error('Geocoding system rate limit triggered. Postponing job execution for cooldown.');
    }

    if (!currentHits) {
      await this.redisService.set(rateLimitKey, '1', 60); 
    } else {
      await this.redisService.incr(rateLimitKey);
    }
  }
  */
}