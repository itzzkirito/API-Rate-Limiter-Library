import { RateLimitResult } from '../types';
/**
 * Base interface for rate limiting strategies
 */
export interface RateLimitStrategy {
    /**
     * Check if a request should be allowed
     * @param key - Unique identifier for the rate limit
     * @returns Promise resolving to rate limit result
     */
    check(key: string): Promise<RateLimitResult>;
    /**
     * Reset the rate limit for a given key
     * @param key - Unique identifier for the rate limit
     */
    reset(key: string): Promise<void>;
}
