import { PrismaService } from '../prisma/prisma.service';
export declare class DataService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    importHotels(): Promise<{
        imported: number;
        totalRows: number;
    }>;
}
