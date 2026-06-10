// src/gmail/gmail.consumer.ts
import { Processor, Process, InjectQueue } from '@nestjs/bull';
import type { Job, Queue } from 'bull';
import { Logger, Inject } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { TourType, BookingStatus, Prisma } from '@prisma/client';
import { ParsedEmailDto } from './dto/parsedEmail.dto';
import { GmailParserUtil } from './utils/gmail-parser.util';
import { BookingService } from '../booking/booking.service'; // Import BookingService để gọi từ đây

@Processor('booking-processing-queue')
export class GmailConsumer {
  private readonly logger = new Logger(GmailConsumer.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('booking-processing-queue')
    private readonly bookingQueue: Queue,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly bookingService: BookingService, // Inject BookingService
  ) { }

  /**
   * 🔥 STAGE 1: HẠ CÁNH SIÊU TỐC & LƯU RAW DATA
   */
  @Process('process-raw-email-job')
  async handleRawEmailJob(job: Job<{ messageId: string; messageData: any }>) {
    const { messageId, messageData } = job.data;
    this.logger.log(`[STAGE 1 - RAW] Saving email snapshot for Message ID: ${messageId}`);

    try {
      const parsed: ParsedEmailDto = GmailParserUtil.parseEmailBody(messageData);
      const uniqueRef = parsed.bookingData?.bookingRef;

      if (!uniqueRef) {
        this.logger.warn(`[STAGE 1 ABORT] No unique booking reference found in message ${messageId}.`);
        return;
      }

      const rawDataRecord = await this.prisma.rawData.upsert({
        where: { sourceId: messageId },
        update: {},
        create: {
          sourceId: messageId,
          payload: parsed as unknown as Prisma.InputJsonValue,
          status: 'PENDING',
        },
      });

      await this.bookingQueue.add('enrich-booking-job', {
        rawId: rawDataRecord.id,
        uniqueRef,
        parsedPayload: parsed
      }, {
        attempts: 5,
        backoff: 10000,
      });

      this.logger.log(`[STAGE 1 SUCCESS] RawData ${messageId} handled smoothly.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`[STAGE 1 CRITICAL ERROR] Failed to save raw data: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * ⚙️ STAGE 2: PHÂN TÍCH CHUYÊN SÂU & ĐÚC KHUÔN BOOKING
   */
  @Process('enrich-booking-job')
  async handleEnrichBookingJob(job: Job<{ rawId: string; uniqueRef: string; parsedPayload: ParsedEmailDto }>) {
    const { rawId, uniqueRef, parsedPayload } = job.data;
    this.logger.log(`[STAGE 2 - ENRICH] Processing heavy business logic for Ref: ${uniqueRef}`);

    try {
      const bookingData = parsedPayload.bookingData;
      const rawAddress = bookingData?.hotelAddress || bookingData?.pickupLocation;
      const hotelName = bookingData?.hotelName || 'Unknown Hotel';

      const totalAdults = Number(bookingData?.paxDetail?.adults || 0);
      const totalChildren = Number(bookingData?.paxDetail?.children || 0);
      const totalInfants = Number(bookingData?.paxDetail?.infants || 0);
      const calculatedTotalPax = totalAdults + totalChildren + totalInfants;

      let mappedTourType: TourType | null = null;
      if (bookingData?.tourName?.toLowerCase().includes('private')) mappedTourType = TourType.PRIVATE_TOUR;
      if (bookingData?.tourName?.toLowerCase().includes('group')) mappedTourType = TourType.GROUP_TOUR;

      // ─── 📍 HỆ THỐNG PHÂN PHỐI & TRUY VẾT TỌA ĐỘ 3 TẦNG ───────────────────
      let latitude: number | null = null;
      let longitude: number | null = null;

      // Định danh mục tiêu tìm kiếm (Ưu tiên Address, nếu không có thì dùng Hotel Name)
      const lookupTarget = rawAddress || hotelName;

      if (lookupTarget && lookupTarget !== 'Unknown Hotel') {
        const cacheKey = `geo:${lookupTarget.trim().toLowerCase()}`;

        try {
          // 🔎 TẦNG 1: Kiểm tra trên Memory Cache (Redis / In-Memory)
          const cachedCoords = await this.cacheManager.get<{ lat: number; lng: number }>(cacheKey);

          if (cachedCoords) {
            this.logger.log(`[GEO-HIT][MEMORY] Found coordinates in Cache for: ${lookupTarget}`);
            latitude = cachedCoords.lat;
            longitude = cachedCoords.lng;
          } else {
            // 🔎 TẦNG 2: Memory Cache trượt -> Xuống kiểm tra DB qua Prisma
            this.logger.log(`[GEO-MISS][MEMORY] Checking DB Coordinate table for: ${lookupTarget}`);

            const dbCoordinate = await this.prisma.coordinate.findFirst({
              where: {
                OR: [
                  { address: lookupTarget },
                  { hotelName: hotelName }
                ]
              },
            });

            if (dbCoordinate) {
              this.logger.log(`[GEO-HIT][DATABASE] Found coordinates in DB for: ${lookupTarget}`);
              latitude = dbCoordinate.latitude;
              longitude = dbCoordinate.longitude;

              // 💾 Bù đắp ngược lại cho Memory Cache giữ trong 1 tháng
              await this.cacheManager.set(cacheKey, { lat: latitude, lng: longitude }, 30 * 24 * 60 * 60 * 1000);
            } else {
              // 🔎 TẦNG 3: Cả hai nơi đều không có -> Gọi API Geocoding thực tế
              this.logger.log(`[GEO-MISS][ALL] Triggering live Geocoding API for: ${lookupTarget}`);

              let apiLat: number | null = null;
              let apiLng: number | null = null;

              // 📡 KHỐI GỌI API THỰC TẾ (Uncomment đoạn này khi bạn lắp Key thật vào env)
              try {
                /*
                const apiKey = process.env.GOOGLE_MAPS_API_KEY;
                const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
                  params: { address: lookupTarget, key: apiKey },
                  timeout: 5000 // Chờ tối đa 5 giây
                });
                
                if (response.data.status === 'OK' && response.data.results.length > 0) {
                  const location = response.data.results[0].geometry.location;
                  apiLat = location.lat;
                  apiLng = location.lng;
                }
                */
              } catch (apiError) {
                const apiErrorMessage = apiError instanceof Error ? apiError.message : String(apiError);
                this.logger.error(`[GOOGLE API ERROR] Live call failed: ${apiErrorMessage}`);
                // API lỗi -> Giữ apiLat, apiLng là null để hạ cánh an toàn xuống kịch bản 2
              }

              // ─── PHÂN TÁCH LÀM 2 TRƯỜNG HỢP XỬ LÝ (KẾT QUẢ TỪ API) ───

              if (apiLat !== null && apiLng !== null) {
                // ✅ Kịch bản 1: Tìm thấy tọa độ thực tế từ API
                latitude = apiLat;
                longitude = apiLng;

                const uniqueField = rawAddress || `hotel-fallback:${hotelName.toLowerCase()}`;

                // 📥 1. Lưu vết vào database Coordinate làm cache vật lý
                await this.prisma.coordinate.upsert({
                  where: { address: uniqueField },
                  update: {
                    hotelName: hotelName,
                    latitude: latitude,
                    longitude: longitude,
                    coordinate: `${latitude},${longitude}`
                  },
                  create: {
                    hotelName: hotelName,
                    address: uniqueField,
                    latitude: latitude,
                    longitude: longitude,
                    coordinate: `${latitude},${longitude}`,
                  },
                });
                this.logger.log(`[GEO-SAVED][DATABASE] Saved coordinates to Coordinate table.`);

                // 📥 2. Set Cache bộ nhớ trong 1 tháng giống như tầng 2
                await this.cacheManager.set(cacheKey, { lat: latitude, lng: longitude }, 30 * 24 * 60 * 60 * 1000);
                this.logger.log(`[GEO-SAVED][MEMORY] Cached coordinates for 1 month.`);

              } else {
                // ❌ Kịch bản 2: API không tìm thấy hoặc lỗi kết nối
                this.logger.warn(`[GEO-NOT-FOUND] Geocoding could not resolve coordinates for: ${lookupTarget}. Skipping cache/DB storage.`);

                // Trả trực tiếp giá trị null ra toán tử xử lý bên ngoài
                latitude = null;
                longitude = null;
              }
            }
          }
        } catch (geoError) {
          const geoErrorMessage = geoError instanceof Error ? geoError.message : String(geoError);
          this.logger.warn(`[GEO-ERROR] Geocoding workflow failed: ${geoErrorMessage}. Proceeding with null coordinates.`);
        }
      }

      // ─── 🛠️ TIẾN HÀNH ĐÚC BẢNG BOOKING (Kế thừa toán tử của bạn) ───────────────────
      try {
        await this.bookingService.create(
          {
            bookingRef: uniqueRef, 
            provider: parsedPayload.provider,
            status: BookingStatus.PENDING,
            address: rawAddress || null,

            // 🎯 Toán tử ghi nhận giá trị: 
            // Nếu qua kịch bản 1: Sẽ nhận giá trị số thực từ API.
            // Nếu rơi vào kịch bản 2: Nhận giá trị null để toán tử vận hành cập nhật lại sau này.
            latitude: latitude,
            longitude: longitude,

            startingDate: bookingData?.travelDate || null, 
            customerName: bookingData?.customerName || 'Unknown Customer', 
            phone: bookingData?.customerPhone || null, 
            mail: bookingData?.customerEmail || null, 
            totalPax: calculatedTotalPax > 0 ? calculatedTotalPax : (bookingData?.totalPax || 0), //
            paxDetail: { adults: totalAdults, children: totalChildren, infants: totalInfants } as any, //
            tourType: mappedTourType, //
            tourName: bookingData?.tourName || null, 
            payment: null,
            rawDataId: rawId || null, // Liên kết thô với RawData để dễ dàng truy vết nguồn gốc
          },
        );
        this.logger.log(`[POSTGRES] Booking ${uniqueRef} created successfully.`);
      } catch (dbError) {
        if (dbError instanceof Prisma.PrismaClientKnownRequestError && dbError.code === 'P2002') {
          this.logger.warn(`[DUPLICATE BLOCKED] Booking ${uniqueRef} already exists. Skipping insertion smoothly.`);
        } else {
          throw dbError;
        }
      }

      // 🎉 Chuyển trạng thái RawData sang PROCESSED
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