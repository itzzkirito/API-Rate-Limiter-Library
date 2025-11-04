import { Redis } from 'ioredis';
import { RateLimitOptions, RateLimitResult } from './types';
import { RedisOptions } from './types';
/**
 * Main RateLimiter class
 *
 * Provides a flexible rate limiting solution with multiple strategies
 * and Redis backend for distributed systems.
 */
export declare class RateLimiter {
    private redis;
    private strategy;
    private options;
    private keyGenerator;
    constructor(redisOptions?: RedisOptions, rateLimitOptions?: RateLimitOptions);
    constructor(redis: Redis, rateLimitOptions?: RateLimitOptions);
    /**
     * Normalize and validate rate limit options
     */
    private normalizeOptions;
    /**
     * Create the appropriate rate limiting strategy
     */
    private createStrategy;
    /**
     * Check if a request should be allowed
     *
     * @param identifier - Unique identifier for the rate limit (e.g., user ID, IP address)
     * @returns Promise resolving to rate limit result
     * @throws RateLimitError if blockOnLimit is true and limit is exceeded
     */
    check(identifier: string): Promise<RateLimitResult>;
    /**
     * Reset the rate limit for a given identifier
     *
     * @param identifier - Unique identifier for the rate limit
     */
    reset(identifier: string): Promise<void>;
    /**
     * Get the current rate limit status without consuming a request
     *
     * Note: This is a best-effort implementation. For accurate status checking
     * without consuming tokens, strategies would need dedicated peek methods.
     * Currently, this may consume a token in some strategies.
     *
     * @param identifier - Unique identifier for the rate limit
     * @returns Promise resolving to rate limit result
     */
    getStatus(identifier: string): Promise<RateLimitResult>;
    /**
     * Close the Redis connection
     */
    disconnect(): Promise<void>;
    /**
     * Get the underlying Redis client
     */
    getRedisClient(): Redis;
}
