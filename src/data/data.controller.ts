import { Controller, Post } from '@nestjs/common';
import { DataService } from '@/data/data.service';

@Controller('data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Post('import-hotels')
  async importHotels() {
    return this.dataService.importHotels();
  }
}