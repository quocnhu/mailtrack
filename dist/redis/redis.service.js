"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
let RedisService = class RedisService {
    redis;
    constructor(redis) {
        this.redis = redis;
    }
    getBookingKey(provider, bookingRef) {
        return `parsedmail:booking:${provider.toLowerCase()}:${bookingRef.toLowerCase()}`;
    }
    async cacheParsedMail(key, data, ttlSeconds = 86400) {
        await this.redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
    }
    async pushToRawQueue(data) {
        const queueKey = 'parsedmail:queue:raw-postgres';
        return this.redis.rpush(queueKey, JSON.stringify(data));
    }
    async popFromRawQueue() {
        const queueKey = 'parsedmail:queue:raw-postgres';
        const rawData = await this.redis.lpop(queueKey);
        if (!rawData)
            return null;
        return JSON.parse(rawData);
    }
    async getRawQueueLength() {
        const queueKey = 'parsedmail:queue:raw-postgres';
        return this.redis.llen(queueKey);
    }
    getGeoCacheKey(sanitizedAddress) {
        return `geo:cache:${sanitizedAddress.trim().toLowerCase()}`;
    }
    async cacheCoordinates(key, coordinates, ttlSeconds = 2592000) {
        await this.redis.set(key, JSON.stringify(coordinates), 'EX', ttlSeconds);
    }
    async incr(key) {
        return this.redis.incr(key);
    }
    async set(key, value, ttlSeconds) {
        await this.redis.set(key, value, 'EX', ttlSeconds);
    }
    async get(key) {
        return this.redis.get(key);
    }
    async delete(key) {
        return this.redis.del(key);
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [Function])
], RedisService);
//# sourceMappingURL=redis.service.js.map