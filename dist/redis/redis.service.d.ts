import { type Redis as RedisType } from 'ioredis';
export declare class RedisService {
    private readonly redis;
    constructor(redis: RedisType);
    getBookingKey(provider: string, bookingRef: string): string;
    cacheParsedMail(key: string, data: any, ttlSeconds?: number): Promise<void>;
    pushToRawQueue(data: any): Promise<number>;
    popFromRawQueue(): Promise<any | null>;
    getRawQueueLength(): Promise<number>;
    getGeoCacheKey(sanitizedAddress: string): string;
    cacheCoordinates(key: string, coordinates: {
        lat: number | null;
        lng: number | null;
    }, ttlSeconds?: number): Promise<void>;
    incr(key: string): Promise<number>;
    set(key: string, value: string, ttlSeconds: number): Promise<void>;
    get(key: string): Promise<string | null>;
    delete(key: string): Promise<number>;
}
