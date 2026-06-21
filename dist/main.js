/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/app.controller.ts"
/*!*******************************!*\
  !*** ./src/app.controller.ts ***!
  \*******************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const app_service_1 = __webpack_require__(/*! ./app.service */ "./src/app.service.ts");
let AppController = class AppController {
    appService;
    constructor(appService) {
        this.appService = appService;
    }
    getHello() {
        return this.appService.getHello();
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "getHello", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [typeof (_a = typeof app_service_1.AppService !== "undefined" && app_service_1.AppService) === "function" ? _a : Object])
], AppController);


/***/ },

/***/ "./src/app.module.ts"
/*!***************************!*\
  !*** ./src/app.module.ts ***!
  \***************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const schedule_1 = __webpack_require__(/*! @nestjs/schedule */ "@nestjs/schedule");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
const gmail_module_1 = __webpack_require__(/*! @/gmail/gmail.module */ "./src/gmail/gmail.module.ts");
const app_controller_1 = __webpack_require__(/*! @/app.controller */ "./src/app.controller.ts");
const app_service_1 = __webpack_require__(/*! @/app.service */ "./src/app.service.ts");
const redis_module_1 = __webpack_require__(/*! @/redis/redis.module */ "./src/redis/redis.module.ts");
const prisma_module_1 = __webpack_require__(/*! @/prisma/prisma.module */ "./src/prisma/prisma.module.ts");
const bull_1 = __webpack_require__(/*! @nestjs/bull */ "@nestjs/bull");
const data_module_1 = __webpack_require__(/*! ./data/data.module */ "./src/data/data.module.ts");
const booking_module_1 = __webpack_require__(/*! ./booking/booking.module */ "./src/booking/booking.module.ts");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            schedule_1.ScheduleModule.forRoot(),
            bull_1.BullModule.forRoot({
                url: process.env.REDIS_URL || 'redis://localhost:6379',
            }),
            gmail_module_1.GmailModule,
            redis_module_1.RedisModule,
            prisma_module_1.PrismaModule,
            data_module_1.DataModule,
            booking_module_1.BookingModule,
        ],
        providers: [app_service_1.AppService],
        controllers: [app_controller_1.AppController],
    })
], AppModule);


/***/ },

/***/ "./src/app.service.ts"
/*!****************************!*\
  !*** ./src/app.service.ts ***!
  \****************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
let AppService = class AppService {
    getHello() {
        return 'Hello World!';
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)()
], AppService);


/***/ },

/***/ "./src/booking/booking-assignment.consumer.ts"
/*!****************************************************!*\
  !*** ./src/booking/booking-assignment.consumer.ts ***!
  \****************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BookingAssignmentProcessor_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BookingAssignmentProcessor = void 0;
const bull_1 = __webpack_require__(/*! @nestjs/bull */ "@nestjs/bull");
const prisma_service_1 = __webpack_require__(/*! @/prisma/prisma.service */ "./src/prisma/prisma.service.ts");
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
let BookingAssignmentProcessor = BookingAssignmentProcessor_1 = class BookingAssignmentProcessor {
    prisma;
    logger = new common_1.Logger(BookingAssignmentProcessor_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleAutoGrouping(job) {
        const { bookingId, tourName, tourType, startingDate, totalPax } = job.data;
        this.logger.log(`Processing booking: ${job.data.bookingId}, Pax: ${job.data.totalPax}`);
        console.log(`Processing booking for assignment: ${job.data.bookingId}, Pax: ${job.data.totalPax}`);
        const targetDate = new Date(startingDate);
        if (tourType === 'PRIVATE_TOUR') {
            const newVehicleId = `BUS-PVT-${Date.now()}`;
            await this.assignToNewLane(bookingId, newVehicleId, 0);
            return;
        }
        let remainingPax = totalPax;
        while (remainingPax > 0) {
            const currentBatchPax = Math.min(remainingPax, 12);
            const existingLane = await this.findAvailableGroupLane(tourName, targetDate, currentBatchPax);
            if (existingLane) {
                const nextIndex = await this.getNextSequenceIndex(existingLane.vehicleId);
                await this.prisma.assignment.create({
                    data: {
                        bookingId: bookingId,
                        vehicleId: existingLane.vehicleId,
                        sequenceIndex: nextIndex
                    }
                });
                remainingPax -= currentBatchPax;
            }
            else {
                const newVehicleId = `BUS-GRP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                await this.assignToNewLane(bookingId, newVehicleId, 0);
                remainingPax -= currentBatchPax;
            }
        }
    }
    async findAvailableGroupLane(tourName, date, incomingPax) {
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));
        const activeAssignments = await this.prisma.assignment.findMany({
            where: {
                booking: {
                    tourName,
                    startingDate: { gte: startOfDay, lte: endOfDay }
                }
            },
            include: { booking: true }
        });
        const laneOccupancy = {};
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
    async getNextSequenceIndex(vehicleId) {
        return await this.prisma.assignment.count({ where: { vehicleId } });
    }
    async assignToNewLane(bookingId, vehicleId, index) {
        await this.prisma.assignment.create({
            data: { bookingId, vehicleId, sequenceIndex: index }
        });
    }
};
exports.BookingAssignmentProcessor = BookingAssignmentProcessor;
__decorate([
    (0, bull_1.Process)('manual-assign-operator-job'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingAssignmentProcessor.prototype, "handleAutoGrouping", null);
exports.BookingAssignmentProcessor = BookingAssignmentProcessor = BookingAssignmentProcessor_1 = __decorate([
    (0, bull_1.Processor)('booking-assignment-queue'),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], BookingAssignmentProcessor);


/***/ },

/***/ "./src/booking/booking.controller.ts"
/*!*******************************************!*\
  !*** ./src/booking/booking.controller.ts ***!
  \*******************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BookingController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const booking_service_1 = __webpack_require__(/*! @/booking/booking.service */ "./src/booking/booking.service.ts");
const create_booking_dto_1 = __webpack_require__(/*! @/booking/dto/create-booking.dto */ "./src/booking/dto/create-booking.dto.ts");
let BookingController = class BookingController {
    bookingService;
    constructor(bookingService) {
        this.bookingService = bookingService;
    }
    async createBooking(createBookingDto) {
        return await this.bookingService.create(createBookingDto);
    }
    async getAllBookings() {
        return await this.bookingService.findAll();
    }
};
exports.BookingController = BookingController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true, whitelist: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof create_booking_dto_1.CreateBookingDto !== "undefined" && create_booking_dto_1.CreateBookingDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "createBooking", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getAllBookings", null);
exports.BookingController = BookingController = __decorate([
    (0, common_1.Controller)('bookings'),
    __metadata("design:paramtypes", [typeof (_a = typeof booking_service_1.BookingService !== "undefined" && booking_service_1.BookingService) === "function" ? _a : Object])
], BookingController);


/***/ },

/***/ "./src/booking/booking.module.ts"
/*!***************************************!*\
  !*** ./src/booking/booking.module.ts ***!
  \***************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BookingModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const booking_controller_1 = __webpack_require__(/*! ./booking.controller */ "./src/booking/booking.controller.ts");
const booking_service_1 = __webpack_require__(/*! ./booking.service */ "./src/booking/booking.service.ts");
const prisma_module_1 = __webpack_require__(/*! @/prisma/prisma.module */ "./src/prisma/prisma.module.ts");
const bull_1 = __webpack_require__(/*! @nestjs/bull */ "@nestjs/bull");
const booking_assignment_consumer_1 = __webpack_require__(/*! ./booking-assignment.consumer */ "./src/booking/booking-assignment.consumer.ts");
let BookingModule = class BookingModule {
};
exports.BookingModule = BookingModule;
exports.BookingModule = BookingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            bull_1.BullModule.registerQueue({
                name: 'booking-assignment-queue',
            })
        ],
        controllers: [booking_controller_1.BookingController],
        providers: [booking_service_1.BookingService, booking_assignment_consumer_1.BookingAssignmentProcessor],
        exports: [booking_service_1.BookingService],
    })
], BookingModule);


/***/ },

/***/ "./src/booking/booking.service.ts"
/*!****************************************!*\
  !*** ./src/booking/booking.service.ts ***!
  \****************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BookingService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const prisma_service_1 = __webpack_require__(/*! @/prisma/prisma.service */ "./src/prisma/prisma.service.ts");
const bull_1 = __webpack_require__(/*! @nestjs/bull */ "@nestjs/bull");
const client_1 = __webpack_require__(/*! @prisma/client */ "@prisma/client");
const crypto = __importStar(__webpack_require__(/*! crypto */ "crypto"));
let BookingService = class BookingService {
    prisma;
    assignmentQueue;
    constructor(prisma, assignmentQueue) {
        this.prisma = prisma;
        this.assignmentQueue = assignmentQueue;
    }
    async create(dto) {
        try {
            const uniqueSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
            const fallbackRef = `REF-${Date.now()}-${uniqueSuffix}`;
            const newBooking = await this.prisma.booking.create({
                data: {
                    bookingRef: dto.bookingRef?.trim() || fallbackRef,
                    provider: dto.provider || 'manual-entry',
                    status: dto.status || client_1.BookingStatus.PENDING,
                    address: dto.address || null,
                    latitude: dto.latitude ?? null,
                    longitude: dto.longitude ?? null,
                    startingDate: dto.startingDate ? new Date(dto.startingDate) : null,
                    customerName: dto.customerName?.trim() || 'Unknown Customer',
                    hotelName: dto.hotelName?.trim() || 'Unknown Hotel',
                    phone: dto.phone || null,
                    mail: dto.mail || null,
                    totalPax: dto.totalPax || 0,
                    paxDetail: dto.paxDetail || null,
                    tourType: dto.tourType || null,
                    tourName: dto.tourName || null,
                    payment: dto.payment || 'PENDING',
                    rawDataId: dto.rawDataId ?? null,
                    vehicleId: null,
                },
            });
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
            }
            catch (queueError) {
                console.error(`[Queue Warning] Auto-grouping assignment bypass for ${newBooking.bookingRef}:`, queueError);
            }
            return newBooking;
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002')
                    throw new common_1.ConflictException(`Data collision: Code '${dto.bookingRef}' exists.`);
                if (error.code === 'P2003')
                    throw new common_1.BadRequestException(`Foreign key mismatch: 'rawDataId' is invalid.`);
            }
            throw new common_1.InternalServerErrorException('System error encountered while processing raw booking data.');
        }
    }
    async cancelBooking(bookingRef) {
        return await this.prisma.$transaction(async (tx) => {
            const target = await tx.booking.findUnique({
                where: { bookingRef },
                include: { assignment: true }
            });
            if (!target)
                throw new common_1.NotFoundException(`Record '${bookingRef}' not found.`);
            const assignments = target.assignment || [];
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
                data: { status: client_1.BookingStatus.CANCELED, vehicleId: null }
            });
        });
    }
    async updateDroppedSequence(bookingId, targetVehicleId, newSequenceIndex) {
        return await this.prisma.$transaction(async (tx) => {
            const currentAssignment = await tx.assignment.findFirst({ where: { bookingId } });
            if (currentAssignment) {
                await tx.assignment.delete({ where: { id: currentAssignment.id } });
                await tx.assignment.updateMany({
                    where: {
                        vehicleId: currentAssignment.vehicleId,
                        sequenceIndex: { gt: currentAssignment.sequenceIndex }
                    },
                    data: { sequenceIndex: { decrement: 1 } }
                });
            }
            if (targetVehicleId) {
                await tx.assignment.updateMany({
                    where: { vehicleId: targetVehicleId, sequenceIndex: { gte: newSequenceIndex } },
                    data: { sequenceIndex: { increment: 1 } }
                });
                await tx.assignment.create({
                    data: { bookingId, vehicleId: targetVehicleId, sequenceIndex: newSequenceIndex }
                });
            }
            return await tx.booking.update({
                where: { id: bookingId },
                data: {
                    vehicleId: targetVehicleId,
                    status: targetVehicleId ? client_1.BookingStatus.ASSIGNED : client_1.BookingStatus.PENDING
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
};
exports.BookingService = BookingService;
exports.BookingService = BookingService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bull_1.InjectQueue)('booking-assignment-queue')),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, Object])
], BookingService);


/***/ },

/***/ "./src/booking/dto/create-booking.dto.ts"
/*!***********************************************!*\
  !*** ./src/booking/dto/create-booking.dto.ts ***!
  \***********************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateBookingDto = void 0;
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const client_1 = __webpack_require__(/*! @prisma/client */ "@prisma/client");
class CreateBookingDto {
    bookingRef;
    provider;
    status;
    address;
    latitude;
    longitude;
    startingDate;
    customerName;
    hotelName;
    phone;
    mail;
    totalPax;
    paxDetail;
    tourType;
    tourName;
    payment;
    rawDataId;
}
exports.CreateBookingDto = CreateBookingDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "bookingRef", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Object)
], CreateBookingDto.prototype, "provider", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.BookingStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_a = typeof client_1.BookingStatus !== "undefined" && client_1.BookingStatus) === "function" ? _a : Object)
], CreateBookingDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateBookingDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateBookingDto.prototype, "latitude", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateBookingDto.prototype, "longitude", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateBookingDto.prototype, "startingDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "customerName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "hotelName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateBookingDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateBookingDto.prototype, "mail", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateBookingDto.prototype, "totalPax", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateBookingDto.prototype, "paxDetail", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.TourType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateBookingDto.prototype, "tourType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateBookingDto.prototype, "tourName", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.PaymentStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateBookingDto.prototype, "payment", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Object)
], CreateBookingDto.prototype, "rawDataId", void 0);


/***/ },

/***/ "./src/data/data.controller.ts"
/*!*************************************!*\
  !*** ./src/data/data.controller.ts ***!
  \*************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DataController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const data_service_1 = __webpack_require__(/*! @/data/data.service */ "./src/data/data.service.ts");
let DataController = class DataController {
    dataService;
    constructor(dataService) {
        this.dataService = dataService;
    }
    async importHotels() {
        return this.dataService.importHotels();
    }
};
exports.DataController = DataController;
__decorate([
    (0, common_1.Post)('import-hotels'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DataController.prototype, "importHotels", null);
exports.DataController = DataController = __decorate([
    (0, common_1.Controller)('data'),
    __metadata("design:paramtypes", [typeof (_a = typeof data_service_1.DataService !== "undefined" && data_service_1.DataService) === "function" ? _a : Object])
], DataController);


/***/ },

/***/ "./src/data/data.module.ts"
/*!*********************************!*\
  !*** ./src/data/data.module.ts ***!
  \*********************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DataModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const data_controller_1 = __webpack_require__(/*! ./data.controller */ "./src/data/data.controller.ts");
const data_service_1 = __webpack_require__(/*! ./data.service */ "./src/data/data.service.ts");
const prisma_service_1 = __webpack_require__(/*! ../prisma/prisma.service */ "./src/prisma/prisma.service.ts");
let DataModule = class DataModule {
};
exports.DataModule = DataModule;
exports.DataModule = DataModule = __decorate([
    (0, common_1.Module)({
        controllers: [data_controller_1.DataController],
        providers: [data_service_1.DataService, prisma_service_1.PrismaService],
    })
], DataModule);


/***/ },

/***/ "./src/data/data.service.ts"
/*!**********************************!*\
  !*** ./src/data/data.service.ts ***!
  \**********************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DataService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const prisma_service_1 = __webpack_require__(/*! ../prisma/prisma.service */ "./src/prisma/prisma.service.ts");
const fs_1 = __importDefault(__webpack_require__(/*! fs */ "fs"));
const path_1 = __importDefault(__webpack_require__(/*! path */ "path"));
const csv_parser_1 = __importDefault(__webpack_require__(/*! csv-parser */ "csv-parser"));
let DataService = class DataService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async importHotels() {
        const hotels = [];
        const csvPath = path_1.default.join(process.cwd(), 'src', 'data', 'hotelcoordinate.csv');
        console.log('cwd:', process.cwd());
        console.log('csvPath:', csvPath);
        console.log('exists:', fs_1.default.existsSync(csvPath));
        await new Promise((resolve, reject) => {
            fs_1.default.createReadStream(csvPath)
                .pipe((0, csv_parser_1.default)())
                .on('data', (row) => {
                hotels.push({
                    hotelName: row.hotelName,
                    starRating: row.starRating || null,
                    address: row.address,
                    coordinate: row.coordinate || null,
                    latitude: Number(row.latitude),
                    longitude: Number(row.longitude),
                });
            })
                .on('end', () => resolve())
                .on('error', reject);
        });
        const result = await this.prisma.coordinate.createMany({
            data: hotels,
            skipDuplicates: true,
        });
        return {
            imported: result.count,
            totalRows: hotels.length,
        };
    }
};
exports.DataService = DataService;
exports.DataService = DataService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], DataService);


/***/ },

/***/ "./src/gmail/gmail.consumer.ts"
/*!*************************************!*\
  !*** ./src/gmail/gmail.consumer.ts ***!
  \*************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var GmailConsumer_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GmailConsumer = void 0;
const bull_1 = __webpack_require__(/*! @nestjs/bull */ "@nestjs/bull");
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const prisma_service_1 = __webpack_require__(/*! @/prisma/prisma.service */ "./src/prisma/prisma.service.ts");
const cache_manager_1 = __webpack_require__(/*! @nestjs/cache-manager */ "@nestjs/cache-manager");
const client_1 = __webpack_require__(/*! @prisma/client */ "@prisma/client");
const gmail_parser_util_1 = __webpack_require__(/*! ./utils/gmail-parser.util */ "./src/gmail/utils/gmail-parser.util.ts");
const booking_service_1 = __webpack_require__(/*! ../booking/booking.service */ "./src/booking/booking.service.ts");
let GmailConsumer = GmailConsumer_1 = class GmailConsumer {
    prisma;
    bookingQueue;
    cacheManager;
    bookingService;
    logger = new common_1.Logger(GmailConsumer_1.name);
    constructor(prisma, bookingQueue, cacheManager, bookingService) {
        this.prisma = prisma;
        this.bookingQueue = bookingQueue;
        this.cacheManager = cacheManager;
        this.bookingService = bookingService;
    }
    async handleRawEmailJob(job) {
        const { messageId, messageData } = job.data;
        this.logger.log(`[STAGE 1 - RAW] Saving email snapshot for Message ID: ${messageId}`);
        try {
            const parsed = gmail_parser_util_1.GmailParserUtil.parseEmailBody(messageData);
            const bookingData = parsed.bookingData;
            if (!bookingData?.bookingRef) {
                this.logger.warn(`[STAGE 1 ABORT] No unique booking reference could be resolved for message ${messageId}.`);
                return;
            }
            const rawDataRecord = await this.prisma.rawData.upsert({
                where: { sourceId: messageId },
                update: {
                    payload: parsed,
                    status: 'PENDING',
                },
                create: {
                    sourceId: messageId,
                    payload: parsed,
                    status: 'PENDING',
                },
            });
            await this.bookingQueue.add('enrich-booking-job', {
                rawId: rawDataRecord.id,
                parsedPayload: parsed
            }, {
                attempts: 5,
                backoff: 10000,
            });
            this.logger.log(`[STAGE 1 SUCCESS] RawData ${messageId} handled smoothly`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`[STAGE 1 CRITICAL ERROR] Failed to save raw data: ${errorMessage}`);
            throw error;
        }
    }
    async handleEnrichBookingJob(job) {
        const { rawId, parsedPayload } = job.data;
        this.logger.log(`[STAGE 2 - ENRICH] Processing booking enrichment for RawData ID: ${rawId}`);
        try {
            const bookingData = parsedPayload.bookingData;
            console.log('Booking Data Extracted from Parsed Payload:', bookingData);
            const rawAddress = bookingData?.hotelAddress || bookingData?.pickupLocation || bookingData?.pickUpAddress;
            const hotelName = bookingData?.pickUp || bookingData?.hotelName || 'Unknown Hotel';
            let finalCoordinates = { lat: null, lng: null };
            console.log(`[GEO-DEBUG] Extracted raw address: "${rawAddress}", hotel name: "${hotelName}"`);
            console.log("check finalCoordinates before lookup:", finalCoordinates);
            if (rawAddress) {
                const streetRegex = /^(\d+[-\d]*\s+[\w\s]+)/i;
                const match = rawAddress.match(streetRegex);
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
                    await this.cacheManager.set(`geo:${rawAddress.trim().toLowerCase()}`, JSON.stringify({
                        lat: dbRecord.latitude,
                        lng: dbRecord.longitude,
                        hotelName: dbRecord.hotelName
                    }), 2592000);
                }
                else {
                    this.logger.warn(`[GEO-DB MISS] No record found for key: "${searchKey}"`);
                }
            }
            try {
                await this.bookingService.create({
                    bookingRef: bookingData?.bookingRef,
                    provider: bookingData?.provider || 'UNKNOWN',
                    status: client_1.BookingStatus.PENDING,
                    address: bookingData?.pickUpAddress || null,
                    latitude: finalCoordinates.lat,
                    longitude: finalCoordinates.lng,
                    startingDate: bookingData?.date || bookingData?.tripDate || null,
                    customerName: bookingData?.customer || bookingData?.billingName || 'Unknown Customer',
                    phone: bookingData?.customerPhone || bookingData?.billingCity || null,
                    mail: bookingData?.customerEmail || bookingData?.billingEmail || null,
                    totalPax: bookingData?.paxTotal || bookingData?.travellers || 0,
                    paxDetail: bookingData?.pax || bookingData?.priceLines || null,
                    hotelName: bookingData?.pickUp || 'Unknown Hotel' || 0,
                    tourType: bookingData?.tourType ? bookingData.tourType : null,
                    tourName: bookingData?.tourName || null,
                    payment: client_1.PaymentStatus.PENDING,
                    rawDataId: rawId || null,
                });
                this.logger.log(`[POSTGRES] Booking created successfully with full unified fields.`);
            }
            catch (dbError) {
                if (dbError instanceof client_1.Prisma.PrismaClientKnownRequestError && dbError.code === 'P2002') {
                    this.logger.warn(`[DUPLICATE BLOCKED] Booking already exists. Skipping insertion smoothly.`);
                }
                else {
                    throw dbError;
                }
            }
            await this.prisma.rawData.update({
                where: { id: rawId },
                data: { status: 'PROCESSED' }
            });
            this.logger.log(`[STAGE 2 SUCCESS] RawData ${rawId} status updated to PROCESSED.`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`[STAGE 2 FAILURE] Error enriching booking database: ${errorMessage}`);
            await this.prisma.rawData.update({
                where: { id: rawId },
                data: { status: 'FAILED' }
            });
            throw error;
        }
    }
};
exports.GmailConsumer = GmailConsumer;
__decorate([
    (0, bull_1.Process)('process-raw-email-job'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GmailConsumer.prototype, "handleRawEmailJob", null);
__decorate([
    (0, bull_1.Process)('enrich-booking-job'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GmailConsumer.prototype, "handleEnrichBookingJob", null);
exports.GmailConsumer = GmailConsumer = GmailConsumer_1 = __decorate([
    (0, bull_1.Processor)('booking-processing-queue'),
    __param(1, (0, bull_1.InjectQueue)('booking-processing-queue')),
    __param(2, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, Object, Object, typeof (_b = typeof booking_service_1.BookingService !== "undefined" && booking_service_1.BookingService) === "function" ? _b : Object])
], GmailConsumer);


/***/ },

/***/ "./src/gmail/gmail.controller.ts"
/*!***************************************!*\
  !*** ./src/gmail/gmail.controller.ts ***!
  \***************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GmailController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const gmail_service_1 = __webpack_require__(/*! @/gmail/gmail.service */ "./src/gmail/gmail.service.ts");
let GmailController = class GmailController {
    gmailService;
    constructor(gmailService) {
        this.gmailService = gmailService;
    }
    async redirectToGoogle(res) {
        const url = await this.gmailService.getAuthUrl();
        return res.redirect(url);
    }
    async handleCallback(code, res) {
        if (!code)
            return res.status(common_1.HttpStatus.BAD_REQUEST).json({ error: 'Missing code' });
        const account = await this.gmailService.handleAuthorizationCode(code);
        return res.status(common_1.HttpStatus.OK).json({ status: 'success', email: account.email });
    }
    async handlePubSubWebhook(body, res) {
        if (!body?.message?.data) {
            return res.status(common_1.HttpStatus.OK).json({ status: 'ignored' });
        }
        this.gmailService.processWebhookPayload(body.message.data).catch(() => { });
        return res.status(common_1.HttpStatus.OK).json({ status: 'acknowledged' });
    }
};
exports.GmailController = GmailController;
__decorate([
    (0, common_1.Get)('auth'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GmailController.prototype, "redirectToGoogle", null);
__decorate([
    (0, common_1.Get)('callback'),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GmailController.prototype, "handleCallback", null);
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GmailController.prototype, "handlePubSubWebhook", null);
exports.GmailController = GmailController = __decorate([
    (0, common_1.Controller)('gmail'),
    __metadata("design:paramtypes", [typeof (_a = typeof gmail_service_1.GmailService !== "undefined" && gmail_service_1.GmailService) === "function" ? _a : Object])
], GmailController);


/***/ },

/***/ "./src/gmail/gmail.module.ts"
/*!***********************************!*\
  !*** ./src/gmail/gmail.module.ts ***!
  \***********************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GmailModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const gmail_controller_1 = __webpack_require__(/*! @/gmail/gmail.controller */ "./src/gmail/gmail.controller.ts");
const gmail_service_1 = __webpack_require__(/*! @/gmail/gmail.service */ "./src/gmail/gmail.service.ts");
const prisma_module_1 = __webpack_require__(/*! @/prisma/prisma.module */ "./src/prisma/prisma.module.ts");
const redis_module_1 = __webpack_require__(/*! @/redis/redis.module */ "./src/redis/redis.module.ts");
const bull_1 = __webpack_require__(/*! @nestjs/bull */ "@nestjs/bull");
const gmail_consumer_1 = __webpack_require__(/*! @/gmail/gmail.consumer */ "./src/gmail/gmail.consumer.ts");
const booking_module_1 = __webpack_require__(/*! @/booking/booking.module */ "./src/booking/booking.module.ts");
const cache_manager_1 = __webpack_require__(/*! @nestjs/cache-manager */ "@nestjs/cache-manager");
let GmailModule = class GmailModule {
};
exports.GmailModule = GmailModule;
exports.GmailModule = GmailModule = __decorate([
    (0, common_1.Module)({
        imports: [
            booking_module_1.BookingModule,
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            cache_manager_1.CacheModule.register(),
            bull_1.BullModule.registerQueue({
                name: 'booking-processing-queue',
            }),
        ],
        controllers: [gmail_controller_1.GmailController],
        providers: [gmail_service_1.GmailService, gmail_consumer_1.GmailConsumer],
        exports: [gmail_service_1.GmailService, gmail_consumer_1.GmailConsumer],
    })
], GmailModule);


/***/ },

/***/ "./src/gmail/gmail.service.ts"
/*!************************************!*\
  !*** ./src/gmail/gmail.service.ts ***!
  \************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var GmailService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GmailService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const googleapis_1 = __webpack_require__(/*! googleapis */ "googleapis");
const prisma_service_1 = __webpack_require__(/*! @/prisma/prisma.service */ "./src/prisma/prisma.service.ts");
const bull_1 = __webpack_require__(/*! @nestjs/bull */ "@nestjs/bull");
let GmailService = GmailService_1 = class GmailService {
    prisma;
    bookingQueue;
    logger = new common_1.Logger(GmailService_1.name);
    oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
    constructor(prisma, bookingQueue) {
        this.prisma = prisma;
        this.bookingQueue = bookingQueue;
        this.oauth2Client.on('tokens', (tokens) => {
            if (tokens.access_token) {
                this.logger.log('Access token rotated hiddenly by Google SDK.');
            }
        });
    }
    async onApplicationBootstrap() {
        try {
            const account = await this.prisma.gmailAccount.findFirst();
            if (!account) {
                this.logger.warn('⚠️ No active Google Accounts found in database!');
                const loginUrl = await this.getAuthUrl();
                this.logger.log(`👉 Please authorize the app by visiting this URL: \n${loginUrl}`);
            }
            else {
                this.logger.log(`✅ System connected. Tracking active mailbox for: ${account.email}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to run startup database check:', error);
        }
    }
    async getAuthUrl() {
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: ['https://www.googleapis.com/auth/gmail.readonly'],
        });
    }
    async handleAuthorizationCode(code) {
        const { tokens } = await this.oauth2Client.getToken(code);
        this.oauth2Client.setCredentials(tokens);
        const gmail = googleapis_1.google.gmail({ version: 'v1', auth: this.oauth2Client });
        const profile = await gmail.users.getProfile({ userId: 'me' });
        const email = profile.data.emailAddress?.toLowerCase();
        if (!email)
            throw new Error('Could not retrieve email address from Google profile.');
        const watchResult = await gmail.users.watch({
            userId: 'me',
            requestBody: { topicName: process.env.GOOGLE_PUBSUB_TOPIC },
        });
        const lastHistoryId = String(profile.data.historyId);
        const watchExpiration = new Date(Number(watchResult.data.expiration));
        return await this.prisma.gmailAccount.upsert({
            where: { email },
            update: { lastHistoryId, watchExpiration, refreshToken: tokens.refresh_token || undefined },
            create: { email, lastHistoryId, watchExpiration, refreshToken: tokens.refresh_token || '' },
        });
    }
    async processWebhookPayload(base64Data) {
        try {
            const rawData = Buffer.from(base64Data, 'base64').toString('utf-8');
            const { emailAddress, historyId } = JSON.parse(rawData);
            const email = emailAddress.toLowerCase();
            const account = await this.prisma.gmailAccount.findUnique({ where: { email } });
            if (!account || !account.lastHistoryId)
                return;
            this.oauth2Client.setCredentials({ refresh_token: account.refreshToken });
            const gmail = googleapis_1.google.gmail({ version: 'v1', auth: this.oauth2Client });
            const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
            if (!account.watchExpiration || account.watchExpiration < oneDayFromNow) {
                this.logger.log(`Watch expiration approaching for ${email}. Renewing watch subscription...`);
                const watchResult = await gmail.users.watch({
                    userId: 'me',
                    requestBody: { topicName: process.env.GOOGLE_PUBSUB_TOPIC },
                });
                await this.prisma.gmailAccount.update({
                    where: { email },
                    data: { watchExpiration: new Date(Number(watchResult.data.expiration)) },
                });
            }
            const historyResponse = await gmail.users.history.list({
                userId: 'me',
                startHistoryId: account.lastHistoryId,
                labelId: 'INBOX',
            });
            if (historyResponse.data.history) {
                for (const record of historyResponse.data.history) {
                    if (record.messagesAdded) {
                        for (const addedRecord of record.messagesAdded) {
                            const messageId = addedRecord.message?.id;
                            const hasInboxLabel = addedRecord.message?.labelIds?.includes('INBOX');
                            if (messageId && hasInboxLabel) {
                                this.logger.log(`📬 New incoming inbox message detected: ${messageId}`);
                                await this.processMessage(gmail, messageId);
                            }
                        }
                    }
                }
            }
            await this.prisma.gmailAccount.update({
                where: { email },
                data: { lastHistoryId: String(historyId) },
            });
        }
        catch (error) {
            this.logger.error('Failed to process incoming webhook sync:', error);
        }
    }
    async processMessage(gmail, messageId) {
        try {
            const message = await gmail.users.messages.get({ userId: 'me', id: messageId });
            await this.bookingQueue.add('process-raw-email-job', {
                messageId,
                messageData: message.data
            }, {
                jobId: `msg:${messageId}`,
                attempts: 3,
                backoff: 5000,
            });
            this.logger.log(`[DISPATCH SUCCESS] Full email JSON data for message ${messageId} pushed to queue.`);
        }
        catch (error) {
            this.logger.error(`Error fetching and dispatching message ${messageId}:`, error);
        }
    }
};
exports.GmailService = GmailService;
exports.GmailService = GmailService = GmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bull_1.InjectQueue)('booking-processing-queue')),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, Object])
], GmailService);


/***/ },

/***/ "./src/gmail/parsers/tripadvisorHtmlParser.ts"
/*!****************************************************!*\
  !*** ./src/gmail/parsers/tripadvisorHtmlParser.ts ***!
  \****************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TripAdvisorHtmlParser = void 0;
const cheerio = __importStar(__webpack_require__(/*! cheerio */ "cheerio"));
class TripAdvisorHtmlParser {
    static parse(htmlBody) {
        if (!htmlBody || htmlBody.trim() === '') {
            return {
                provider: 'tripadvisor',
                bookingRef: null,
                productBookingRef: null,
                extBookingRef: null,
                tourName: null,
                supplier: null,
                soldBy: null,
                bookingChannel: null,
                customer: null,
                customerEmail: null,
                customerPhone: null,
                date: null,
                rate: null,
                pax: null,
                paxTotal: null,
                tourType: 'UNKNOWN',
                pickUp: null,
                pickUpAddress: null,
                guidedLanguages: null,
                extras: null,
                inclusions: null,
                bookingLanguages: null,
                totalcost: null,
                createdAt: null,
            };
        }
        const $ = cheerio.load(htmlBody);
        const extractedData = {};
        const mappingRules = {
            'booking ref.': 'bookingRef',
            'product booking ref.': 'productBookingRef',
            'ext. booking ref': 'extBookingRef',
            'product': 'product',
            'supplier': 'supplier',
            'sold by': 'soldBy',
            'booking channel': 'bookingChannel',
            'customer': 'customerName',
            'customer email': 'customerEmail',
            'customer phone': 'customerPhone',
            'date': 'date',
            'rate': 'rate',
            'pax': 'pax',
            'pick-up': 'pickup',
            'guided languages': 'guidedLanguages',
            'created': 'created',
            'notes': 'notes',
            'extras': 'extras'
        };
        $('table tbody tr').each((_, element) => {
            const cells = $(element).find('td');
            if (cells.length >= 2) {
                const firstCell = cells.first();
                const secondCell = cells.last();
                const rawLabel = firstCell.text().replace(/[:\n]/g, '').trim().toLowerCase();
                const targetKey = mappingRules[rawLabel];
                if (targetKey) {
                    let cleanValue = '';
                    if (targetKey === 'notes') {
                        const lines = [];
                        secondCell.find('div').each((_, div) => {
                            const textLine = $(div).text().trim();
                            if (textLine)
                                lines.push(textLine);
                        });
                        cleanValue = lines.length > 0 ? lines.join('\n') : secondCell.text().trim();
                    }
                    else {
                        cleanValue = secondCell.text().trim();
                    }
                    if (targetKey !== 'notes') {
                        cleanValue = cleanValue.replace(/\s+/g, ' ').trim();
                    }
                    extractedData[targetKey] = cleanValue;
                }
            }
        });
        let paxTotal = 0;
        if (extractedData.pax) {
            const numbersFound = extractedData.pax.match(/(\d+)\s*(?:Adult|Child|Infant)/gi);
            if (numbersFound) {
                paxTotal = numbersFound.reduce((sum, match) => {
                    const digits = match.match(/\d+/);
                    return sum + (digits ? parseInt(digits[0], 10) : 0);
                }, 0);
            }
        }
        let tourType = 'UNKNOWN';
        const combinedContent = `
      ${(extractedData.rate || '').toLowerCase()} 
      ${(extractedData.product || '').toLowerCase()}
    `;
        if (combinedContent.includes('private') || combinedContent.includes('solo')) {
            tourType = 'PRIVATE_TOUR';
        }
        else if (combinedContent.includes('shared') || combinedContent.includes('group') || combinedContent.includes('max ')) {
            tourType = 'GROUP_TOUR';
        }
        let isoStandardDate = null;
        const rawDate = extractedData.date;
        if (rawDate) {
            try {
                let cleanStr = rawDate.replace(/^[A-Za-z]+\s+/, '').replace('@ ', '');
                cleanStr = cleanStr.replace('.', ' ').replace("'", '');
                const [day, monthStr, yearShort, timeStr] = cleanStr.split(' ');
                const [hours, minutes] = timeStr.split(':');
                const monthsMap = {
                    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
                    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
                };
                const monthIdx = monthsMap[monthStr];
                const fullYear = 2000 + parseInt(yearShort, 10);
                if (monthIdx !== undefined && !isNaN(fullYear)) {
                    const nativeDateObj = new Date(fullYear, monthIdx, parseInt(day, 10), parseInt(hours, 10), parseInt(minutes, 10));
                    isoStandardDate = nativeDateObj.toISOString();
                }
            }
            catch (dateError) {
                isoStandardDate = rawDate;
            }
        }
        let rawNotes = extractedData.notes || '';
        let calculatedCost = null;
        const priceMatch = rawNotes.match(/Viator amount:\s*([A-Za-z0-9.$ ]+)/i);
        if (priceMatch) {
            calculatedCost = priceMatch[1].trim();
        }
        let inclusions = null;
        let bookingLanguages = null;
        if (rawNotes) {
            const inclusionMatch = rawNotes.match(/---\s*Inclusions:\s*---([\s\S]*?)(?:---\s*Booking languages:\s*---|Viator amount:|$)/i);
            if (inclusionMatch && inclusionMatch[1]) {
                inclusions = inclusionMatch[1]
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line && !line.startsWith('---'))
                    .join(', ');
            }
            const languageMatch = rawNotes.match(/---\s*Booking languages:\s*---([\s\S]*?)(?:Viator amount:|$)/i);
            if (languageMatch && languageMatch[1]) {
                bookingLanguages = languageMatch[1]
                    .split('\n')
                    .map(line => line.replace(/GUIDE\s*:/i, '').trim())
                    .filter(line => line)
                    .join(', ');
            }
        }
        let pickUpLocation = extractedData.pickup || null;
        let pickUpAddress = null;
        if (pickUpLocation && pickUpLocation.includes(',')) {
            const commaIndex = pickUpLocation.indexOf(',');
            const isolatedHotel = pickUpLocation.substring(0, commaIndex).trim();
            const isolatedAddress = pickUpLocation.substring(commaIndex + 1).trim();
            pickUpLocation = isolatedHotel;
            pickUpAddress = isolatedAddress;
        }
        let cleanExtras = extractedData.extras || null;
        if (cleanExtras === '')
            cleanExtras = null;
        return {
            provider: 'tripadvisor',
            bookingRef: extractedData.bookingRef || null,
            productBookingRef: extractedData.productBookingRef || null,
            extBookingRef: extractedData.extBookingRef || null,
            tourName: extractedData.product || null,
            supplier: extractedData.supplier || null,
            soldBy: extractedData.soldBy || null,
            bookingChannel: extractedData.bookingChannel || null,
            customer: extractedData.customerName || null,
            customerEmail: extractedData.customerEmail || null,
            customerPhone: extractedData.customerPhone || null,
            date: isoStandardDate,
            rate: extractedData.rate || null,
            pax: extractedData.pax || null,
            paxTotal: paxTotal > 0 ? paxTotal : null,
            tourType,
            pickUp: pickUpLocation,
            pickUpAddress: pickUpAddress,
            guidedLanguages: extractedData.guidedLanguages || null,
            extras: cleanExtras,
            inclusions: inclusions,
            bookingLanguages: bookingLanguages,
            totalcost: calculatedCost,
            createdAt: extractedData.created || null,
        };
    }
}
exports.TripAdvisorHtmlParser = TripAdvisorHtmlParser;


/***/ },

/***/ "./src/gmail/parsers/websiteHtmlParser.ts"
/*!************************************************!*\
  !*** ./src/gmail/parsers/websiteHtmlParser.ts ***!
  \************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WebsiteHtmlParser = void 0;
const cheerio = __importStar(__webpack_require__(/*! cheerio */ "cheerio"));
class WebsiteHtmlParser {
    static parse(htmlBody) {
        if (!htmlBody) {
            return {
                provider: 'website',
                bookingRef: null,
                tourName: null,
                packageName: null,
                tourType: 'UNKNOWN',
                tripDate: null,
                travellers: null,
                priceLines: null,
                subtotal: null,
                discount: null,
                totalcost: null,
                billingName: null,
                billingEmail: null,
                billingAddress: null,
                pickUp: null,
                pickUpAddress: null,
                billingCity: null,
                billingCountry: null,
                bookingLink: null,
            };
        }
        const $ = cheerio.load(htmlBody);
        const parseDollar = (raw) => {
            if (!raw)
                return null;
            const parsed = parseFloat(raw.replace(/[^0-9.]/g, ''));
            return isNaN(parsed) ? null : parsed;
        };
        let tourName = null;
        let packageName = null;
        let tripDate = null;
        let travellers = null;
        let subtotal = null;
        let discount = null;
        let total = null;
        const tourNameElement = $('td b').first();
        tourName = tourNameElement.length > 0 ? tourNameElement.text().trim() : null;
        const priceLinesParts = [];
        $('tr').each((_, row) => {
            const cells = $(row).find('td');
            if (cells.length < 2)
                return;
            const key = cells.eq(0).text().trim();
            const val = cells.eq(1).text().trim();
            if (key === 'Package Name')
                packageName = val || null;
            if (key === 'Trip Date')
                tripDate = val || null;
            if (key === 'Travellers')
                travellers = parseInt(val, 10) || null;
            if (key === 'Subtotal' && val.startsWith('$'))
                subtotal = parseDollar(val);
            if (key === 'Discount')
                discount = parseDollar(val);
            if (key === 'Total')
                total = parseDollar(val);
            const priceMatch = val.match(/^(\d+)\s*[Xx]\s*\$([0-9.]+)\s*=\s*\$([0-9.]+)$/);
            if (priceMatch && key && key !== 'Subtotal') {
                priceLinesParts.push(`${key}: ${priceMatch[1]}x$${priceMatch[2]}=$${priceMatch[3]}`);
            }
        });
        const priceLines = priceLinesParts.length > 0 ? priceLinesParts.join(', ') : null;
        let billingName = null;
        let billingEmail = null;
        let billingAddress = null;
        let billingCity = null;
        let billingCountry = null;
        $('tr').each((_, row) => {
            const cells = $(row).find('td');
            if (cells.length < 2)
                return;
            const key = cells.eq(0).text().trim();
            const val = cells.eq(1).text().trim();
            if (key === 'Name')
                billingName = val || null;
            if (key === 'Email')
                billingEmail = cells.eq(1).find('a').attr('href')?.replace('mailto:', '').trim() ?? val ?? null;
            if (key === 'Billing Address')
                billingAddress = val || null;
            if (key === 'City')
                billingCity = val || null;
            if (key === 'Country')
                billingCountry = val || null;
        });
        const bookingLink = $('a[href*="wp-admin"][href*="action=edit"]').attr('href') || null;
        let bookingRef;
        const wpPostId = bookingLink?.match(/post=(\d+)/)?.[1];
        if (wpPostId) {
            bookingRef = `WEB-${wpPostId}`;
        }
        else {
            bookingRef = `WEB-FALLBACK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }
        let tourType = 'UNKNOWN';
        const combinedContent = `
      ${(packageName || '').toLowerCase()} 
      ${(tourName || '').toLowerCase()}
    `.replace(/\s+/g, ' ');
        if (combinedContent.includes('private') || combinedContent.includes('solo')) {
            tourType = 'PRIVATE_TOUR';
        }
        else if (combinedContent.includes('shared') ||
            combinedContent.includes('group') ||
            combinedContent.includes('max ')) {
            tourType = 'GROUP_TOUR';
        }
        let pickUpLocation = null;
        let pickUpAddress = null;
        const forcedAddress = billingAddress;
        if (forcedAddress && forcedAddress.trim() !== '') {
            const cleanAddress = forcedAddress.replace(/\s+/g, ' ').trim();
            const hotelPattern = /^([^,]+?\b(?:Residence|Hotel|Apartment|Apartments|Suite|Suites|Villa|Villas|Stay|Hostel|Homestay|Spa)\b)(?:,\s*)(.*)$/i;
            const match = cleanAddress.match(hotelPattern);
            if (match) {
                pickUpLocation = match[1].trim() || null;
                pickUpAddress = match[2].trim() || null;
            }
            else if (cleanAddress.includes(',')) {
                const commaIndex = cleanAddress.indexOf(',');
                pickUpLocation = cleanAddress.substring(0, commaIndex).trim() || null;
                pickUpAddress = cleanAddress.substring(commaIndex + 1).trim() || null;
            }
            else {
                pickUpLocation = cleanAddress || null;
            }
        }
        return {
            provider: 'website',
            bookingRef: bookingRef,
            tourName: tourName || null,
            packageName: packageName || null,
            tourType: tourType || null,
            tripDate: tripDate || null,
            travellers: travellers ?? null,
            priceLines: priceLines || null,
            subtotal: subtotal ?? null,
            discount: discount ?? null,
            totalcost: total || null,
            billingName: billingName || null,
            billingEmail: billingEmail || null,
            billingAddress: billingAddress || null,
            pickUp: pickUpLocation || null,
            pickUpAddress: pickUpAddress || null,
            billingCity: billingCity || null,
            billingCountry: billingCountry || null,
            bookingLink: bookingLink || null,
        };
    }
}
exports.WebsiteHtmlParser = WebsiteHtmlParser;


/***/ },

/***/ "./src/gmail/utils/gmail-parser.util.ts"
/*!**********************************************!*\
  !*** ./src/gmail/utils/gmail-parser.util.ts ***!
  \**********************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GmailParserUtil = void 0;
const cheerio = __importStar(__webpack_require__(/*! cheerio */ "cheerio"));
const tripadvisorHtmlParser_1 = __webpack_require__(/*! ../parsers/tripadvisorHtmlParser */ "./src/gmail/parsers/tripadvisorHtmlParser.ts");
const websiteHtmlParser_1 = __webpack_require__(/*! ../parsers/websiteHtmlParser */ "./src/gmail/parsers/websiteHtmlParser.ts");
class GmailParserUtil {
    static decodeBase64Url(data) {
        const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
        return Buffer.from(base64, 'base64').toString('utf-8');
    }
    static extractParts(payload, parts = []) {
        if (!payload)
            return parts;
        if (payload.body?.data)
            parts.push({ mimeType: payload.mimeType, data: payload.body.data });
        if (payload.parts?.length) {
            for (const part of payload.parts)
                this.extractParts(part, parts);
        }
        return parts;
    }
    static stripHtml(html) {
        const $ = cheerio.load(html);
        $('style, script, head, img, link, meta, noscript').remove();
        return $.text().replace(/\s{2,}/g, ' ').trim();
    }
    static detectProvider(headers) {
        const senderFields = [
            headers['from'] ?? '', headers['reply-to'] ?? '', headers['sender'] ?? '', headers['return-path'] ?? ''
        ].join(' ').toLowerCase();
        if (senderFields.includes('nquocnhu95tourguide@gmail.com'))
            return 'tripadvisor';
        if (senderFields.includes('nquocnhu95book@gmail.com'))
            return 'website';
        return 'unknown';
    }
    static parseBookingData(provider, htmlBody) {
        if (!htmlBody)
            return null;
        switch (provider) {
            case 'tripadvisor': return tripadvisorHtmlParser_1.TripAdvisorHtmlParser.parse(htmlBody);
            case 'website': return websiteHtmlParser_1.WebsiteHtmlParser.parse(htmlBody);
            default: return null;
        }
    }
    static parseEmailBody(messageData) {
        const allParts = this.extractParts(messageData.payload);
        const plainPart = allParts.find((p) => p.mimeType === 'text/plain');
        const htmlPart = allParts.find((p) => p.mimeType === 'text/html');
        const textBody = plainPart ? this.decodeBase64Url(plainPart.data) : null;
        const htmlBody = htmlPart ? this.decodeBase64Url(htmlPart.data) : null;
        const cleanBody = textBody ?? (htmlBody ? this.stripHtml(htmlBody) : null);
        const headers = {};
        for (const h of messageData.payload?.headers ?? []) {
            headers[h.name.toLowerCase()] = h.value;
        }
        const subject = headers['subject'] ?? '';
        const lowerSubject = subject.toLowerCase();
        const status = lowerSubject.includes('cancel') || lowerSubject.includes('cancellation') || lowerSubject.includes('cancelled')
            ? 'CANCEL' : 'NEW_BOOKING';
        const provider = this.detectProvider(headers);
        const bookingData = this.parseBookingData(provider, htmlBody);
        return {
            bookingStatus: status,
            subject: headers['subject'] ?? null,
            from: headers['from'] ?? null,
            to: headers['to'] ?? null,
            date: headers['date'] ?? null,
            messageId: headers['message-id'] ?? null,
            snippet: messageData.snippet ?? null,
            internalDate: messageData.internalDate ?? null,
            textBody, htmlBody, cleanBody, provider, bookingData,
        };
    }
}
exports.GmailParserUtil = GmailParserUtil;


/***/ },

/***/ "./src/prisma/prisma.module.ts"
/*!*************************************!*\
  !*** ./src/prisma/prisma.module.ts ***!
  \*************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PrismaModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const prisma_service_1 = __webpack_require__(/*! @/prisma/prisma.service */ "./src/prisma/prisma.service.ts");
let PrismaModule = class PrismaModule {
};
exports.PrismaModule = PrismaModule;
exports.PrismaModule = PrismaModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [prisma_service_1.PrismaService],
        exports: [prisma_service_1.PrismaService],
    })
], PrismaModule);


/***/ },

/***/ "./src/prisma/prisma.service.ts"
/*!**************************************!*\
  !*** ./src/prisma/prisma.service.ts ***!
  \**************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PrismaService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const client_1 = __webpack_require__(/*! @prisma/client */ "@prisma/client");
let PrismaService = class PrismaService extends client_1.PrismaClient {
    async onModuleInit() {
        await this.$connect();
        console.log('Prisma connected');
    }
    async enableShutdownHooks(app) {
        process.on('beforeExit', async () => {
            await app.close();
        });
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)()
], PrismaService);


/***/ },

/***/ "./src/redis/redis.module.ts"
/*!***********************************!*\
  !*** ./src/redis/redis.module.ts ***!
  \***********************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const redis_provider_1 = __webpack_require__(/*! @/redis/redis.provider */ "./src/redis/redis.provider.ts");
const redis_service_1 = __webpack_require__(/*! @/redis/redis.service */ "./src/redis/redis.service.ts");
let RedisModule = class RedisModule {
};
exports.RedisModule = RedisModule;
exports.RedisModule = RedisModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [redis_provider_1.RedisProvider, redis_service_1.RedisService],
        exports: [redis_service_1.RedisService],
    })
], RedisModule);


/***/ },

/***/ "./src/redis/redis.provider.ts"
/*!*************************************!*\
  !*** ./src/redis/redis.provider.ts ***!
  \*************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisProvider = void 0;
const ioredis_1 = __importDefault(__webpack_require__(/*! ioredis */ "ioredis"));
exports.RedisProvider = {
    provide: 'REDIS_CLIENT',
    useFactory: () => {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        console.log('Creating Redis client');
        const client = new ioredis_1.default(redisUrl);
        client.on('connect', () => {
            console.log('🚀 [Redis] Connected successfully to cache cluster!');
        });
        client.on('error', (err) => {
            console.error('❌ [Redis] Connection error:', err);
        });
        return client;
    },
};


/***/ },

/***/ "./src/redis/redis.service.ts"
/*!************************************!*\
  !*** ./src/redis/redis.service.ts ***!
  \************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
let RedisService = class RedisService {
    redis;
    constructor(redis) {
        this.redis = redis;
    }
    getBookingKey(provider, bookingRef) {
        return `parsedmail:booking:${provider.toLowerCase()}:${bookingRef.toLowerCase()}`;
    }
    async cacheParsedMail(key, data, ttlSeconds = 86400) {
        await this.redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
    }
    async pushToRawQueue(data) {
        const queueKey = 'parsedmail:queue:raw-postgres';
        return this.redis.rpush(queueKey, JSON.stringify(data));
    }
    async popFromRawQueue() {
        const queueKey = 'parsedmail:queue:raw-postgres';
        const rawData = await this.redis.lpop(queueKey);
        if (!rawData)
            return null;
        return JSON.parse(rawData);
    }
    async getRawQueueLength() {
        const queueKey = 'parsedmail:queue:raw-postgres';
        return this.redis.llen(queueKey);
    }
    getGeoCacheKey(sanitizedAddress) {
        return `geo:cache:${sanitizedAddress.trim().toLowerCase()}`;
    }
    async cacheCoordinates(key, coordinates, ttlSeconds = 2592000) {
        await this.redis.set(key, JSON.stringify(coordinates), 'EX', ttlSeconds);
    }
    async incr(key) {
        return this.redis.incr(key);
    }
    async set(key, value, ttlSeconds) {
        await this.redis.set(key, value, 'EX', ttlSeconds);
    }
    async get(key) {
        return this.redis.get(key);
    }
    async delete(key) {
        return this.redis.del(key);
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [Object])
], RedisService);


/***/ },

/***/ "@nestjs/bull"
/*!*******************************!*\
  !*** external "@nestjs/bull" ***!
  \*******************************/
(module) {

module.exports = require("@nestjs/bull");

/***/ },

/***/ "@nestjs/cache-manager"
/*!****************************************!*\
  !*** external "@nestjs/cache-manager" ***!
  \****************************************/
(module) {

module.exports = require("@nestjs/cache-manager");

/***/ },

/***/ "@nestjs/common"
/*!*********************************!*\
  !*** external "@nestjs/common" ***!
  \*********************************/
(module) {

module.exports = require("@nestjs/common");

/***/ },

/***/ "@nestjs/config"
/*!*********************************!*\
  !*** external "@nestjs/config" ***!
  \*********************************/
(module) {

module.exports = require("@nestjs/config");

/***/ },

/***/ "@nestjs/core"
/*!*******************************!*\
  !*** external "@nestjs/core" ***!
  \*******************************/
(module) {

module.exports = require("@nestjs/core");

/***/ },

/***/ "@nestjs/schedule"
/*!***********************************!*\
  !*** external "@nestjs/schedule" ***!
  \***********************************/
(module) {

module.exports = require("@nestjs/schedule");

/***/ },

/***/ "@prisma/client"
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
(module) {

module.exports = require("@prisma/client");

/***/ },

/***/ "cheerio"
/*!**************************!*\
  !*** external "cheerio" ***!
  \**************************/
(module) {

module.exports = require("cheerio");

/***/ },

/***/ "class-validator"
/*!**********************************!*\
  !*** external "class-validator" ***!
  \**********************************/
(module) {

module.exports = require("class-validator");

/***/ },

/***/ "csv-parser"
/*!*****************************!*\
  !*** external "csv-parser" ***!
  \*****************************/
(module) {

module.exports = require("csv-parser");

/***/ },

/***/ "googleapis"
/*!*****************************!*\
  !*** external "googleapis" ***!
  \*****************************/
(module) {

module.exports = require("googleapis");

/***/ },

/***/ "ioredis"
/*!**************************!*\
  !*** external "ioredis" ***!
  \**************************/
(module) {

module.exports = require("ioredis");

/***/ },

/***/ "crypto"
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
(module) {

module.exports = require("crypto");

/***/ },

/***/ "fs"
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
(module) {

module.exports = require("fs");

/***/ },

/***/ "path"
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
(module) {

module.exports = require("path");

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
const core_1 = __webpack_require__(/*! @nestjs/core */ "@nestjs/core");
const app_module_1 = __webpack_require__(/*! @/app.module */ "./src/app.module.ts");
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: ['http://localhost:3000'],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
    }));
    const port = process.env.PORT || 3000;
    await app.listen(port);
    common_1.Logger.log(`🚀 Mailbox Testing Environment active on: http://localhost:${port}/api`, 'Bootstrap');
}
bootstrap();

})();

/******/ })()
;