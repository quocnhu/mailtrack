"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisProvider = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
exports.RedisProvider = {
    provide: 'REDIS_CLIENT',
    useFactory: () => {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        console.log('Creating Redis client');
        const client = new ioredis_1.default(redisUrl);
        client.on('connect', () => {
            console.log('🚀 [Redis] Connected successfully to cache cluster!');
        });
        client.on('error', (err) => {
            console.error('❌ [Redis] Connection error:', err);
        });
        return client;
    },
};
//# sourceMappingURL=redis.provider.js.map