"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRedisClient = createRedisClient;
const ioredis_1 = __importDefault(require("ioredis"));
/**
 * Create and configure a Redis client
 */
function createRedisClient(options) {
    if (options?.url) {
        return new ioredis_1.default(options.url, options.redisOptions);
    }
    const redisOptions = {
        host: options?.host ?? 'localhost',
        port: options?.port ?? 6379,
        password: options?.password,
        db: options?.db ?? 0,
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        maxRetriesPerRequest: 3,
        ...options?.redisOptions,
    };
    return new ioredis_1.default(redisOptions);
}
//# sourceMappingURL=redis-client.js.map