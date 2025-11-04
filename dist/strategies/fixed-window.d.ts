import { Redis } from 'ioredis';
import { RateLimitOptions, RateLimitResult } from '../types';
import { RateLimitStrategy } from './base';
/**
 * Fixed Window rate limiting strategy
 *
 * Divides time into fixed windows. Each window has a maximum number of requests.
 * When the window expires, the counter resets.
 */
export declare class FixedWindowStrategy implements RateLimitStrategy {
    private redis;
    private maxRequests;
    private windowSeconds;
    constructor(redis: Redis, options: RateLimitOptions);
    check(key: string): Promise<RateLimitResult>;
    reset(key: string): Promise<void>;
}
