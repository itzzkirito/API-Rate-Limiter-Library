import { Redis } from 'ioredis';
import { RateLimitOptions, RateLimitResult } from '../types';
import { RateLimitStrategy } from './base';
/**
 * Token Bucket rate limiting strategy
 *
 * Tokens are refilled at a constant rate. Each request consumes one token.
 * If no tokens are available, the request is denied.
 */
export declare class TokenBucketStrategy implements RateLimitStrategy {
    private redis;
    private maxRequests;
    private capacity;
    private refillRate;
    private windowSeconds;
    constructor(redis: Redis, options: RateLimitOptions);
    check(key: string): Promise<RateLimitResult>;
    reset(key: string): Promise<void>;
}
