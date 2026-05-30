import { type Redis as RedisType } from 'ioredis';
export declare class RedisService {
    private readonly redis;
    constructor(redis: RedisType);
    set(key: string, value: string): Promise<"OK">;
    setEx(key: string, seconds: number, value: string): Promise<"OK">;
    setNxEx(key: string, value: string, seconds: number): Promise<string | null>;
    get(key: string): Promise<string | null>;
    delete(key: string): Promise<number>;
}
