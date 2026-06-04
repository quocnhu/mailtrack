import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { GmailModule } from '@/gmail/gmail.module';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service'; 
import { RedisModule } from '@/redis/redis.module';
import { PrismaModule } from '@/prisma/prisma.module'; // ◄ ADD THIS (Adjust path if needed, e.g., '@/prisma/prisma.module')
import { BullModule } from '@nestjs/bull';
import { DataModule } from './data/data.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    // 1. Give Bull its own connection using your working URL string
    BullModule.forRoot({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    }),
    GmailModule,
    RedisModule,
    PrismaModule, 
    DataModule,//test data import
  ],
  providers: [AppService],
  controllers: [AppController],
})
export class AppModule {}