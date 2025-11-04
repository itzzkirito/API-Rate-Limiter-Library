"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
const ioredis_1 = require("ioredis");
const types_1 = require("./types");
const token_bucket_1 = require("./strategies/token-bucket");
const sliding_window_1 = require("./strategies/sliding-window");
const fixed_window_1 = require("./strategies/fixed-window");
const redis_client_1 = require("./redis-client");
/**
 * Main RateLimiter class
 *
 * Provides a flexible rate limiting solution with multiple strategies
 * and Redis backend for distributed systems.
 */
class RateLimiter {
    constructor(redisOrOptions, rateLimitOptions) {
        // Determine if first argument is Redis instance or options
        if (redisOrOptions instanceof ioredis_1.Redis) {
            this.redis = redisOrOptions;
            this.options = this.normalizeOptions(rateLimitOptions);
        }
        else {
            this.redis = (0, redis_client_1.createRedisClient)(redisOrOptions);
            this.options = this.normalizeOptions(rateLimitOptions);
        }
        // Initialize strategy
        this.strategy = this.createStrategy(this.options.strategy);
        this.keyGenerator = this.options.keyGenerator;
    }
    /**
     * Normalize and validate rate limit options
     */
    normalizeOptions(options) {
        if (!options) {
            throw new Error('Rate limit options are required');
        }
        if (!options.maxRequests || options.maxRequests <= 0) {
            throw new Error('maxRequests must be a positive number');
        }
        if (!options.windowSeconds || options.windowSeconds <= 0) {
            throw new Error('windowSeconds must be a positive number');
        }
        return {
            maxRequests: options.maxRequests,
            windowSeconds: options.windowSeconds,
            strategy: options.strategy ?? 'sliding-window',
            keyGenerator: options.keyGenerator ?? ((id) => id),
            blockOnLimit: options.blockOnLimit ?? true,
            errorMessage: options.errorMessage ?? 'Rate limit exceeded',
            tokenBucket: options.tokenBucket,
        };
    }
    /**
     * Create the appropriate rate limiting strategy
     */
    createStrategy(strategyType) {
        const strategyOptions = {
            maxRequests: this.options.maxRequests,
            windowSeconds: this.options.windowSeconds,
            tokenBucket: this.options.tokenBucket,
        };
        switch (strategyType) {
            case 'token-bucket':
                return new token_bucket_1.TokenBucketStrategy(this.redis, strategyOptions);
            case 'sliding-window':
                return new sliding_window_1.SlidingWindowStrategy(this.redis, strategyOptions);
            case 'fixed-window':
                return new fixed_window_1.FixedWindowStrategy(this.redis, strategyOptions);
            default:
                throw new Error(`Unknown strategy: ${strategyType}`);
        }
    }
    /**
     * Check if a request should be allowed
     *
     * @param identifier - Unique identifier for the rate limit (e.g., user ID, IP address)
     * @returns Promise resolving to rate limit result
     * @throws RateLimitError if blockOnLimit is true and limit is exceeded
     */
    async check(identifier) {
        const key = this.keyGenerator(identifier);
        const result = await this.strategy.check(key);
        if (!result.allowed && this.options.blockOnLimit) {
            throw new types_1.RateLimitError(this.options.errorMessage, result);
        }
        return result;
    }
    /**
     * Reset the rate limit for a given identifier
     *
     * @param identifier - Unique identifier for the rate limit
     */
    async reset(identifier) {
        const key = this.keyGenerator(identifier);
        await this.strategy.reset(key);
    }
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
    async getStatus(identifier) {
        // This is a simplified implementation
        // For accurate status without consuming, strategies would need peek methods
        const key = this.keyGenerator(identifier);
        // Temporarily disable blocking to check status
        const originalBlockOnLimit = this.options.blockOnLimit;
        this.options.blockOnLimit = false;
        try {
            const result = await this.strategy.check(key);
            return result;
        }
        finally {
            this.options.blockOnLimit = originalBlockOnLimit;
        }
    }
    /**
     * Close the Redis connection
     */
    async disconnect() {
        await this.redis.quit();
    }
    /**
     * Get the underlying Redis client
     */
    getRedisClient() {
        return this.redis;
    }
}
exports.RateLimiter = RateLimiter;
//# sourceMappingURL=rate-limiter.js.map