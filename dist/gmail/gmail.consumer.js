"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GmailConsumer_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GmailConsumer = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../redis/redis.service");
const client_1 = require("@prisma/client");
let GmailConsumer = GmailConsumer_1 = class GmailConsumer {
    prisma;
    redisService;
    logger = new common_1.Logger(GmailConsumer_1.name);
    constructor(prisma, redisService) {
        this.prisma = prisma;
        this.redisService = redisService;
    }
    async handleEmailJob(job) {
        const { bookingKey, payload } = job.data;
        this.logger.log(`[CONVEYOR BELT OUT] Starting Stage 2 processing for: ${bookingKey}`);
        let rawDataRecord = await this.prisma.rawData.findUnique({
            where: { sourceId: payload.messageId || bookingKey }
        });
        if (!rawDataRecord) {
            rawDataRecord = await this.prisma.rawData.create({
                data: {
                    sourceId: payload.messageId || bookingKey,
                    payload: payload,
                    status: 'PENDING',
                },
            });
        }
        try {
            const rawAddress = payload.bookingData?.hotelAddress || payload.bookingData?.pickupLocation;
            const hotelName = payload.bookingData?.hotelName || 'Unknown Hotel';
            let finalCoordinates = { lat: null, lng: null };
            if (rawAddress) {
                const sanitizedAddress = rawAddress.trim().toLowerCase();
                const redisGeoKey = `geo:cache:${sanitizedAddress}`;
                const cachedCoordinates = await this.redisService.get(redisGeoKey);
                if (cachedCoordinates) {
                    this.logger.log(`[GEO-CACHE HIT] Found coordinates in Redis RAM for: ${sanitizedAddress}`);
                    finalCoordinates = JSON.parse(cachedCoordinates);
                }
                else {
                    this.logger.log(`[GEO-CACHE MISS] Checking Postgres Coordinate Table for: ${sanitizedAddress}`);
                    const dbCoordinates = await this.prisma.coordinate.findUnique({
                        where: { address: sanitizedAddress },
                    });
                    if (dbCoordinates) {
                        this.logger.log(`[GEO-DB HIT] Found coordinates in Postgres Table. Saving to Redis RAM.`);
                        finalCoordinates = { lat: dbCoordinates.latitude, lng: dbCoordinates.longitude };
                        const ONE_MONTH_SECONDS = 30 * 24 * 60 * 60;
                        await this.redisService.set(redisGeoKey, JSON.stringify(finalCoordinates), ONE_MONTH_SECONDS);
                    }
                    else {
                        this.logger.warn(`[GEO-LOCAL MISS] Address not found in local DB cache. Google API is disabled. Proceeding with null values.`);
                        finalCoordinates = { lat: null, lng: null };
                    }
                }
            }
            const bookingData = payload.bookingData;
            const totalAdults = Number(bookingData?.paxDetail?.adults || 0);
            const totalChildren = Number(bookingData?.paxDetail?.children || 0);
            const totalInfants = Number(bookingData?.paxDetail?.infants || 0);
            const calculatedTotalPax = totalAdults + totalChildren + totalInfants;
            let mappedTourType = null;
            const rawTourNameLower = bookingData?.tourName?.toLowerCase() || '';
            if (rawTourNameLower.includes('private')) {
                mappedTourType = client_1.TourType.PRIVATE_TOUR;
            }
            else if (rawTourNameLower.includes('group')) {
                mappedTourType = client_1.TourType.GROUP_TOUR;
            }
            let parsedStartingDate = null;
            if (bookingData?.travelDate) {
                parsedStartingDate = new Date(bookingData.travelDate);
            }
            await this.prisma.booking.create({
                data: {
                    bookingRef: bookingData?.bookingRef || `REF-${Date.now()}`,
                    provider: payload.provider,
                    status: client_1.BookingStatus.PENDING,
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
                    },
                    tourType: mappedTourType,
                    tourName: bookingData?.tourName || 'Standard Tour',
                    payment: null,
                    rawDataId: rawDataRecord.id,
                },
            });
            await this.prisma.rawData.update({
                where: { id: rawDataRecord.id },
                data: { status: 'PROCESSED' },
            });
            this.logger.log(`[COMPLETED SUCCESS] Booking pipeline closed cleanly for reference key: ${bookingKey}.`);
        }
        catch (error) {
            this.logger.error(`[PIPELINE FAILURE] Failed processing booking metrics: ${error.message}`);
            await this.prisma.rawData.update({
                where: { id: rawDataRecord.id },
                data: { status: 'FAILED' },
            });
            throw error;
        }
    }
};
exports.GmailConsumer = GmailConsumer;
__decorate([
    (0, bull_1.Process)('process-email-job'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GmailConsumer.prototype, "handleEmailJob", null);
exports.GmailConsumer = GmailConsumer = GmailConsumer_1 = __decorate([
    (0, bull_1.Processor)('booking-processing-queue'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], GmailConsumer);
//# sourceMappingURL=gmail.consumer.js.map