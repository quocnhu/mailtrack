import { Module } from '@nestjs/common';
import { GmailController } from '@/gmail/gmail.controller';
import { GmailService } from '@/gmail/gmail.service';
import { PrismaModule } from '@/prisma/prisma.module'; // ◄ ADD THIS (Adjust path if needed, e.g., '@/prisma/prisma.module')
import { RedisModule } from '@/redis/redis.module';   // ◄ ADD THIS (Adjust path if needed, e.g., '@/redis/redis.module')

@Module({
  imports: [
    PrismaModule, // ◄ CRITICAL: Gives GmailModule access to PrismaService
    RedisModule,  // ◄ CRITICAL: Gives GmailModule access to RedisService
  ],
  controllers: [GmailController],
  providers: [GmailService], 
  exports: [GmailService], 
})
export class GmailModule {}