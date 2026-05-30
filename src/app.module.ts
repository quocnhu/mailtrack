import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { GmailModule } from '@/gmail/gmail.module';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service'; 
import { RedisModule } from '@/redis/redis.module';
import { PrismaModule } from '@/prisma/prisma.module'; // ◄ ADD THIS (Adjust path if needed, e.g., '@/prisma/prisma.module')
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    GmailModule,
    RedisModule,
    PrismaModule, 
  ],
  providers: [AppService],
  controllers: [AppController],
})
export class AppModule {}