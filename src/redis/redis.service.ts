import { Inject, Injectable } from '@nestjs/common';
// ◄ THE FIX: Import the explicit structural Type interface from ioredis
import { type Redis as RedisType } from 'ioredis'; 

@Injectable()
export class RedisService {
  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: RedisType, // ◄ THE FIX: Use 'RedisType' instead of 'Redis'
  ) {}

  async set(key: string, value: string) {
    return this.redis.set(key, value);
  }

  async setEx(key: string, seconds: number, value: string) {
    return this.redis.set(key, value, 'EX', seconds);
  }

/**
   * Sets a key only if it doesn't already exist (NX), 
   * and automatically expires it after a set duration (EX).
   */
  async setNxEx(key: string, value: string, seconds: number): Promise<string | null> {
    // Standard native positioning: Key -> Value -> EX -> Seconds -> NX
    return this.redis.set(key, value, 'EX', seconds, 'NX');
  }

  async get(key: string) {
    return this.redis.get(key);
  }

  async delete(key: string) {
    return this.redis.del(key);
  }
}