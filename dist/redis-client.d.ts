import Redis from 'ioredis';
import { RedisOptions as RateLimiterRedisOptions } from './types';
/**
 * Create and configure a Redis client
 */
export declare function createRedisClient(options?: RateLimiterRedisOptions): Redis;
