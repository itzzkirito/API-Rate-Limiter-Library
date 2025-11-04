import { Redis } from 'ioredis';
import {
  RateLimitOptions,
  RateLimitResult,
  RateLimitStrategy as StrategyType,
  RateLimitError,
} from './types';
import { RateLimitStrategy } from './strategies/base';
import { TokenBucketStrategy } from './strategies/token-bucket';
import { SlidingWindowStrategy } from './strategies/sliding-window';
import { FixedWindowStrategy } from './strategies/fixed-window';
import { createRedisClient } from './redis-client';
import { RedisOptions } from './types';

/**
 * Main RateLimiter class
 * 
 * Provides a flexible rate limiting solution with multiple strategies
 * and Redis backend for distributed systems.
 */
export class RateLimiter {
  private redis: Redis;
  private strategy: RateLimitStrategy;
  private options: Required<Omit<RateLimitOptions, 'tokenBucket'>> & {
    tokenBucket?: RateLimitOptions['tokenBucket'];
  };
  private keyGenerator: (identifier: string) => string;

  constructor(redisOptions?: RedisOptions, rateLimitOptions?: RateLimitOptions);
  constructor(redis: Redis, rateLimitOptions?: RateLimitOptions);
  constructor(
    redisOrOptions?: Redis | RedisOptions,
    rateLimitOptions?: RateLimitOptions
  ) {
    // Determine if first argument is Redis instance or options
    if (redisOrOptions instanceof Redis) {
      this.redis = redisOrOptions;
      this.options = this.normalizeOptions(rateLimitOptions);
    } else {
      this.redis = createRedisClient(redisOrOptions);
      this.options = this.normalizeOptions(rateLimitOptions);
    }

    // Initialize strategy
    this.strategy = this.createStrategy(this.options.strategy);
    this.keyGenerator = this.options.keyGenerator;
  }

  /**
   * Normalize and validate rate limit options
   */
  private normalizeOptions(
    options?: RateLimitOptions
  ): Required<Omit<RateLimitOptions, 'tokenBucket'>> & {
    tokenBucket?: RateLimitOptions['tokenBucket'];
  } {
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
      keyGenerator: options.keyGenerator ?? ((id: string) => id),
      blockOnLimit: options.blockOnLimit ?? true,
      errorMessage: options.errorMessage ?? 'Rate limit exceeded',
      tokenBucket: options.tokenBucket,
    };
  }

  /**
   * Create the appropriate rate limiting strategy
   */
  private createStrategy(strategyType: StrategyType): RateLimitStrategy {
    const strategyOptions: RateLimitOptions = {
      maxRequests: this.options.maxRequests,
      windowSeconds: this.options.windowSeconds,
      tokenBucket: this.options.tokenBucket,
    };

    switch (strategyType) {
      case 'token-bucket':
        return new TokenBucketStrategy(this.redis, strategyOptions);
      case 'sliding-window':
        return new SlidingWindowStrategy(this.redis, strategyOptions);
      case 'fixed-window':
        return new FixedWindowStrategy(this.redis, strategyOptions);
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
  async check(identifier: string): Promise<RateLimitResult> {
    const key = this.keyGenerator(identifier);
    const result = await this.strategy.check(key);

    if (!result.allowed && this.options.blockOnLimit) {
      throw new RateLimitError(this.options.errorMessage, result);
    }

    return result;
  }

  /**
   * Reset the rate limit for a given identifier
   * 
   * @param identifier - Unique identifier for the rate limit
   */
  async reset(identifier: string): Promise<void> {
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
  async getStatus(identifier: string): Promise<RateLimitResult> {
    // This is a simplified implementation
    // For accurate status without consuming, strategies would need peek methods
    const key = this.keyGenerator(identifier);
    
    // Temporarily disable blocking to check status
    const originalBlockOnLimit = this.options.blockOnLimit;
    this.options.blockOnLimit = false;
    
    try {
      const result = await this.strategy.check(key);
      return result;
    } finally {
      this.options.blockOnLimit = originalBlockOnLimit;
    }
  }

  /**
   * Close the Redis connection
   */
  async disconnect(): Promise<void> {
    await this.redis.quit();
  }

  /**
   * Get the underlying Redis client
   */
  getRedisClient(): Redis {
    return this.redis;
  }
}

