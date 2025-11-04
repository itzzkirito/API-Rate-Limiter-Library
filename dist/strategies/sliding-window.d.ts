import { Redis } from 'ioredis';
import { RateLimitOptions, RateLimitResult } from '../types';
import { RateLimitStrategy } from './base';
/**
 * Sliding Window rate limiting strategy
 *
 * Tracks requests in a sliding time window. Uses sorted sets in Redis
 * to efficiently count requests within the time window.
 */
export declare class SlidingWindowStrategy implements RateLimitStrategy {
    private redis;
    private maxRequests;
    private windowSeconds;
    constructor(redis: Redis, options: RateLimitOptions);
    check(key: string): Promise<RateLimitResult>;
    reset(key: string): Promise<void>;
}
