import { DataService } from "./data.service";
export declare class DataController {
    private readonly dataService;
    constructor(dataService: DataService);
    importHotels(): Promise<{
        imported: number;
        totalRows: number;
    }>;
}
