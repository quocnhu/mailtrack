import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

@Injectable()
export class DataService {
  constructor(private readonly prisma: PrismaService) {}

  async importHotels() {
    const hotels: any[] = [];

    const csvPath = path.join(
      process.cwd(),
      'src',
        'data',
      'hotelcoordinate.csv',
    );
    console.log('cwd:', process.cwd());
console.log('csvPath:', csvPath);
console.log('exists:', fs.existsSync(csvPath));

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
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
}