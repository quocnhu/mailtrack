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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const csv_parser_1 = __importDefault(require("csv-parser"));
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DataService);
//# sourceMappingURL=data.service.js.map