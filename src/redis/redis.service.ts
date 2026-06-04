import { Inject, Injectable } from '@nestjs/common';
import { type Redis as RedisType } from 'ioredis'; 

@Injectable()
export class RedisService {
  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: RedisType,
  ) {}

  // ─── PLACE 1: BOOKING CACHE (DEDUPLICATION) ────────────────────────
  
  /**
   * Generates the semantic key name for checking duplicate email processes.
   * Example output: parsedmail:booking:viator:via123456
   */
  getBookingKey(provider: string, bookingRef: string): string {
    return `parsedmail:booking:${provider.toLowerCase()}:${bookingRef.toLowerCase()}`;
  }

  /**
   * Saves the entire parsed email payload as a flat JSON string value.
   * Locks it in memory for 24 hours to prevent duplicate insertions into Postgres.
   */
  async cacheParsedMail(key: string, data: any, ttlSeconds = 86400): Promise<void> {
    await this.redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  }

  // ─── PLACE 2: REDIS RAW DATA QUEUE (THE CONVEYOR BELT) ──────────────
  
  /**
   * Pushes the parsed email payload straight onto your Postgres ingestion queue.
   */
  async pushToRawQueue(data: any): Promise<number> {
    const queueKey = 'parsedmail:queue:raw-postgres';
    return this.redis.rpush(queueKey, JSON.stringify(data));
  }

  /**
   * Pulls the oldest pending parsed email off the queue.
   */
  async popFromRawQueue(): Promise<any | null> {
    const queueKey = 'parsedmail:queue:raw-postgres';
    const rawData = await this.redis.lpop(queueKey);
    
    if (!rawData) return null;
    return JSON.parse(rawData);
  }

  /**
   * Checks how many parsed emails are backed up, waiting to be saved to Postgres.
   */
  async getRawQueueLength(): Promise<number> {
    const queueKey = 'parsedmail:queue:raw-postgres';
    return this.redis.llen(queueKey);
  }

  // ─── PLACE 3: GEOCODING CACHE & ANTI-SPAM (NEW) ────────────────────

  /**
   * Generates a unique cache key based on a sanitized address string.
   * Example output: geo:cache:123 alley block hanoi
   */
  getGeoCacheKey(sanitizedAddress: string): string {
    return `geo:cache:${sanitizedAddress.trim().toLowerCase()}`;
  }

  /**
   * Caches resolved coordinates in Redis RAM with an explicit expiration (defaults to 1 month).
   */
  async cacheCoordinates(key: string, coordinates: { lat: number | null; lng: number | null }, ttlSeconds = 2592000): Promise<void> {
    await this.redis.set(key, JSON.stringify(coordinates), 'EX', ttlSeconds);
  }

  /**
   * Atomically increments the rate-limit window tracker key for your anti-spam layer.
   */
  async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  /**
   * Sets a key string along with an explicit TTL in seconds.
   */
  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, value, 'EX', ttlSeconds);
  }

  // ─── REDIS PRIMITIVE UTILITIES ─────────────────────────────────────

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async delete(key: string): Promise<number> {
    return this.redis.del(key);
  }
}