import { Provider } from '@nestjs/common';
import Redis from 'ioredis';

export const RedisProvider: Provider = {
  provide: 'REDIS_CLIENT',
  useFactory: () => {
    // Falls back to localhost if the variable isn't loaded yet
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    console.log('Creating Redis client');
    // ioredis accepts the entire connection URL string directly here!
    const client = new Redis(redisUrl);

    // ADD THIS LOG: It will fire instantly on app startup
    client.on('connect', () => {
      console.log('🚀 [Redis] Connected successfully to cache cluster!');
    });

    client.on('error', (err) => {
      console.error('❌ [Redis] Connection error:', err);
    });

    return client;
  },
};