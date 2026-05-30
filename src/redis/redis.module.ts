import { Global, Module } from '@nestjs/common';
import { RedisProvider } from '@/redis/redis.provider';
import { RedisService } from '@/redis/redis.service';

@Global() // Makes RedisService globally injectable across your modules
@Module({
  providers: [RedisProvider, RedisService],
  exports: [RedisService],
})
export class RedisModule {}