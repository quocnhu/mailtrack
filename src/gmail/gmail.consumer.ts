import { Processor, Process, InjectQueue } from '@nestjs/bull';
import type { Job, Queue } from 'bull';
import { Logger, Inject } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PaymentStatus, TourType, BookingStatus, Prisma } from '@prisma/client';
import { ParsedEmailDto } from './dto/parsedEmail.dto';
import { GmailParserUtil } from './utils/gmail-parser.util';
import { BookingService } from '../booking/booking.service';

@Processor('booking-processing-queue')
export class GmailConsumer {
  private readonly logger = new Logger(GmailConsumer.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('booking-processing-queue')
    private readonly bookingQueue: Queue,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly bookingService: BookingService,
  ) { }

  /**
   * 🔥 STAGE 1: HẠ CÁNH SIÊU TỐC & LƯU RAW DATA
   * Nhiệm vụ: Tiếp nhận email thô, parse nhanh, đồng bộ / tự sinh uniqueRef và lưu vết an toàn.
   */
  @Process('process-raw-email-job')
  async handleRawEmailJob(job: Job<{ messageId: string; messageData: any }>) {
    const { messageId, messageData } = job.data;
    this.logger.log(`[STAGE 1 - RAW] Saving email snapshot for Message ID: ${messageId}`);

    try {
      const parsed: ParsedEmailDto = GmailParserUtil.parseEmailBody(messageData);
      // I will check right here to kick out any email with booking status is unknown will not be in stage 2, to save resource and avoid junk email
      const bookingData = parsed.bookingData;




      // 🎯 Check bookingRef to prevent junk 
      if (!bookingData?.bookingRef) {
        this.logger.warn(`[STAGE 1 ABORT] No unique booking reference could be resolved for message ${messageId}.`);
        return;
      }
      // // ──────────────────────────────────────────────────────────────────

      const rawDataRecord = await this.prisma.rawData.upsert({
        where: { sourceId: messageId },
        update: {
          payload: parsed as unknown as Prisma.InputJsonValue,
          status: 'PENDING',
        },
        create: {
          sourceId: messageId,
          payload: parsed as unknown as Prisma.InputJsonValue,
          status: 'PENDING',
        },
      });

      // Đẩy gói tin siêu nhẹ sang Stage 2 qua BullMQ
      await this.bookingQueue.add('enrich-booking-job', {
        rawId: rawDataRecord.id,
        parsedPayload: parsed
      }, {
        attempts: 5,
        backoff: 10000,
      });

      this.logger.log(`[STAGE 1 SUCCESS] RawData ${messageId} handled smoothly`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`[STAGE 1 CRITICAL ERROR] Failed to save raw data: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * ⚙️ STAGE 2: PHÂN TÍCH CHUYÊN SÂU & ĐÚC KHUÔN BOOKING
   * Nhiệm vụ: Chuyển đổi dữ liệu đa cấu trúc về một khuôn DB duy nhất, xử lý địa lý, PAX và lưu trữ.
   */
  @Process('enrich-booking-job')
  async handleEnrichBookingJob(job: Job<{ rawId: string; parsedPayload: ParsedEmailDto }>) {
    const { rawId, parsedPayload } = job.data;
    this.logger.log(`[STAGE 2 - ENRICH] Processing booking enrichment for RawData ID: ${rawId}`);

    try {
      const bookingData = parsedPayload.bookingData;
      console.log('Booking Data Extracted from Parsed Payload:', bookingData);
      // HANDLING LONGITUDE & LATITUDE
      // 1. EXTRACT RAW GEO DATA
      const rawAddress = bookingData?.hotelAddress || bookingData?.pickupLocation || bookingData?.pickUpAddress;
      const hotelName = bookingData?.pickUp || bookingData?.hotelName || 'Unknown Hotel';

      let finalCoordinates = { lat: null as number | null, lng: null as number | null };

      console.log(`[GEO-DEBUG] Extracted raw address: "${rawAddress}", hotel name: "${hotelName}"`);
      console.log("check finalCoordinates before lookup:", finalCoordinates);

      // 2. RUN GEO-LOOKUP LOGIC
      if (rawAddress) {
        // Regex to extract the first part: the number(s) + the main street name
        // This matches patterns like "65 Le Loi", "19-23 Lam Son", "2A-4A Ton Duc Thang"
        const streetRegex = /^(\d+[-\d]*\s+[\w\s]+)/i;
        const match = rawAddress.match(streetRegex);

        // Use the regex match if found, otherwise fallback to the original logic
        const searchKey = match ? match[0].trim().toLowerCase() : rawAddress.split(',')[0].trim().toLowerCase();

        this.logger.log(`[GEO-DEBUG] Searching DB for street: "${searchKey}"`);

        const dbRecord = await this.prisma.coordinate.findFirst({
          where: {
            address: {
              contains: searchKey,
              mode: 'insensitive',
            },
          },
        });

        if (dbRecord) {
          finalCoordinates = { lat: dbRecord.latitude, lng: dbRecord.longitude };
          this.logger.log(`[GEO-DB HIT] Successfully matched "${rawAddress}" to "${dbRecord.address}"`);

          // Update cache
          await this.cacheManager.set(`geo:${rawAddress.trim().toLowerCase()}`, JSON.stringify({
            lat: dbRecord.latitude,
            lng: dbRecord.longitude,
            hotelName: dbRecord.hotelName
          }), 2592000);
        } else {
          this.logger.warn(`[GEO-DB MISS] No record found for key: "${searchKey}"`);
        }
      }

      
      try {
        await this.bookingService.create({
          bookingRef: bookingData?.bookingRef,
          provider: bookingData?.provider || 'UNKNOWN',
          status: BookingStatus.PENDING,
          address: bookingData?.pickUpAddress || null,
          latitude: finalCoordinates.lat,
          longitude: finalCoordinates.lng,

          // Nạp dữ liệu qua bộ biến đã được chuẩn hóa, chống Null hoàn toàn
          startingDate: bookingData?.date || bookingData?.tripDate || null,
          customerName: bookingData?.customer || bookingData?.billingName || 'Unknown Customer',
          phone: bookingData?.customerPhone || bookingData?.billingCity || null,
          mail: bookingData?.customerEmail || bookingData?.billingEmail || null,
          totalPax: bookingData?.paxTotal || bookingData?.travellers || 0,
          paxDetail: bookingData?.pax || bookingData?.priceLines || null,
          hotelName: bookingData?.pickUp || 'Unknown Hotel' || null,
          tourType: bookingData?.tourType ? (bookingData.tourType as TourType) : null,
          tourName: bookingData?.tourName || null,
          payment: PaymentStatus.PENDING,
          rawDataId: rawId || null,
        });

        this.logger.log(`[POSTGRES] Booking created successfully with full unified fields.`);
      } catch (dbError) {
        if (dbError instanceof Prisma.PrismaClientKnownRequestError && dbError.code === 'P2002') {
          this.logger.warn(`[DUPLICATE BLOCKED] Booking already exists. Skipping insertion smoothly.`);
        } else {
          throw dbError;
        }
      }

      // 🎉 Đánh dấu hoàn thành xử lý cho RawData Record
      await this.prisma.rawData.update({
        where: { id: rawId },
        data: { status: 'PROCESSED' }
      });
      this.logger.log(`[STAGE 2 SUCCESS] RawData ${rawId} status updated to PROCESSED.`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`[STAGE 2 FAILURE] Error enriching booking database: ${errorMessage}`);

      await this.prisma.rawData.update({
        where: { id: rawId },
        data: { status: 'FAILED' }
      });
      throw error;
    }
  }
}
// provider: 'tripadvisor',
//   bookingRef: 'GET-91511242',
//   productBookingRef: 'Hana-T130501920',
//   extBookingRef: 'GYG6H8A3FLB7',
//   tourName: '107622P19 - Cu Chi Ben Duoc Tunnels: Authentic & Less Touristy (Max 10)',
//   supplier: 'HANA TOURIST',
//   soldBy: 'GetYourGuide',
//   bookingChannel: 'GetYourGuide',
//   customer: 'Loinger, Adrian',
//   customerEmail: 'customer-wiuxwepds3rwdxxs@reply.getyourguide.com',
//   customerPhone: '+4916098945692',
//   date: "Thu 14.May '26 @ 07:30",
//   rate: 'Shared Group Morning/Noon Trip',
//   pax: '1 Child 2 Adult 1 Infant',
//   paxTotal: 4,
//   tourType: 'GROUP TOUR',
//   pickUp: 'Fusion Original Saigon Centre',
//   pickUpAddress: '65 Le Loi, Ben Nghe, District 1, Ho Chi Minh City, Vietnam',
//   guidedLanguages: '(Guided language: English)',
//   extras: null,
//   inclusions: null,
//   bookingLanguages: null,
//   totalcost: null,
//   createdAt: 'Mon, May 11 2026 @ 14:56'



// Booking Data Extracted from Parsed Payload: {
//   provider: 'website',
//   tourName: 'Cu Chi Ben Duoc Tunnels: Authentic & Less Touristy',
//   packageName: 'Shared Group Of 10 Max 7:30 AM',
//   tourType: 'GROUP TOUR',
//   tripDate: '2026-04-13',
//   travellers: 5,
//   priceLines: 'Adult: 2x$25=$50, Infant 1-4 Yrs FOC: 1x$0=$0, Child 5-11 Yrs: 2x$20=$40',
//   subtotal: 90,
//   discount: 0,
//   totalcost: 90,
//   billingName: 'Rikke Nord',
//   billingEmail: 'rikke@nord.dk',
//   billingAddress: 'Sherwood Residence, 127 Pasteur Street, Distrikt 3, Ho Chi Minh City',
//   pickUp: 'Sherwood Residence',
//   pickUpAddress: '127 Pasteur Street, Distrikt 3, Ho Chi Minh City',
//   billingCity: '004520888461',
//   billingCountry: null,
//   bookingLink: 'https://hanatourist.vip/wp-admin/post.php?post=3286&action=edit'


