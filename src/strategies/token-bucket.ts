import { Redis } from 'ioredis';
import { RateLimitOptions, RateLimitResult } from '../types';
import { RateLimitStrategy } from './base';

/**
 * Token Bucket rate limiting strategy
 * 
 * Tokens are refilled at a constant rate. Each request consumes one token.
 * If no tokens are available, the request is denied.
 */
export class TokenBucketStrategy implements RateLimitStrategy {
  private redis: Redis;
  private maxRequests: number;
  private capacity: number;
  private refillRate: number;
  private windowSeconds: number;

  constructor(redis: Redis, options: RateLimitOptions) {
    this.redis = redis;
    this.maxRequests = options.maxRequests;
    this.windowSeconds = options.windowSeconds;
    this.capacity = options.tokenBucket?.capacity ?? options.maxRequests;
    this.refillRate = options.tokenBucket?.refillRate ?? (options.maxRequests / options.windowSeconds);
  }

  async check(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const bucketKey = `ratelimit:token-bucket:${key}`;
    const lastRefillKey = `ratelimit:token-bucket:last-refill:${key}`;
    
    // Use Lua script for atomic operations
    const luaScript = `
      local bucketKey = KEYS[1]
      local lastRefillKey = KEYS[2]
      local capacity = tonumber(ARGV[1])
      local refillRate = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      
      local tokens = tonumber(redis.call('GET', bucketKey) or capacity)
      local lastRefill = tonumber(redis.call('GET', lastRefillKey) or now)
      
      -- Calculate time passed since last refill (in seconds)
      local timePassed = (now - lastRefill) / 1000
      
      -- Refill tokens
      if timePassed > 0 then
        local tokensToAdd = math.floor(timePassed * refillRate)
        tokens = math.min(capacity, tokens + tokensToAdd)
        lastRefill = now
      end
      
      -- Check if we have enough tokens
      local allowed = 0
      local remaining = tokens
      
      if tokens >= 1 then
        tokens = tokens - 1
        allowed = 1
        remaining = tokens
      else
        remaining = 0
      end
      
      -- Store updated values
      redis.call('SET', bucketKey, tokens)
      redis.call('SET', lastRefillKey, lastRefill)
      
      -- Calculate reset time (when next token will be available)
      local resetIn = 0
      if remaining < capacity and refillRate > 0 then
        if tokens < 1 then
          resetIn = math.ceil(1 / refillRate)
        else
          resetIn = 0
        end
      end
      
      return {allowed, remaining, resetIn}
    `;

    const result = await this.redis.eval(
      luaScript,
      2,
      bucketKey,
      lastRefillKey,
      this.capacity.toString(),
      this.refillRate.toString(),
      now.toString()
    ) as [number, number, number];

    const [allowed, remaining, resetIn] = result;
    const resetAt = Math.floor(now / 1000) + resetIn;

    return {
      allowed: allowed === 1,
      remaining: Math.max(0, remaining),
      limit: this.capacity,
      resetAt,
      resetIn: Math.max(0, resetIn),
    };
  }

  async reset(key: string): Promise<void> {
    const bucketKey = `ratelimit:token-bucket:${key}`;
    const lastRefillKey = `ratelimit:token-bucket:last-refill:${key}`;
    
    await Promise.all([
      this.redis.del(bucketKey),
      this.redis.del(lastRefillKey),
    ]);
  }
}

