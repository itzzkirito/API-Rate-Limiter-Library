import { Redis } from 'ioredis';
import { RateLimitOptions, RateLimitResult } from '../types';
import { RateLimitStrategy } from './base';

/**
 * Sliding Window rate limiting strategy
 * 
 * Tracks requests in a sliding time window. Uses sorted sets in Redis
 * to efficiently count requests within the time window.
 */
export class SlidingWindowStrategy implements RateLimitStrategy {
  private redis: Redis;
  private maxRequests: number;
  private windowSeconds: number;

  constructor(redis: Redis, options: RateLimitOptions) {
    this.redis = redis;
    this.maxRequests = options.maxRequests;
    this.windowSeconds = options.windowSeconds;
  }

  async check(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - this.windowSeconds * 1000;
    const redisKey = `ratelimit:sliding-window:${key}`;
    
    // Use Lua script for atomic operations
    const luaScript = `
      local key = KEYS[1]
      local windowStart = tonumber(ARGV[1])
      local now = tonumber(ARGV[2])
      local maxRequests = tonumber(ARGV[3])
      local windowSeconds = tonumber(ARGV[4])
      
      -- Remove old entries outside the window
      redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)
      
      -- Count current requests in window
      local currentCount = redis.call('ZCARD', key)
      
      -- Check if we can allow the request
      local allowed = 0
      local remaining = maxRequests - currentCount
      
      if currentCount < maxRequests then
        -- Add current request with unique identifier (timestamp + microsecond precision + counter)
        -- Use a counter stored in Redis to ensure uniqueness
        local counterKey = key .. ':counter'
        local counter = redis.call('INCR', counterKey)
        redis.call('EXPIRE', counterKey, windowSeconds)
        local uniqueId = now .. ':' .. counter
        redis.call('ZADD', key, now, uniqueId)
        redis.call('EXPIRE', key, windowSeconds)
        allowed = 1
        remaining = maxRequests - currentCount - 1
      end
      
      -- Calculate reset time (when oldest entry expires)
      local resetIn = windowSeconds
      local oldestEntry = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
      if #oldestEntry > 0 then
        local oldestTime = tonumber(oldestEntry[2])
        resetIn = math.ceil((oldestTime + windowSeconds * 1000 - now) / 1000)
      end
      
      return {allowed, remaining, resetIn}
    `;

    const result = await this.redis.eval(
      luaScript,
      1,
      redisKey,
      windowStart.toString(),
      now.toString(),
      this.maxRequests.toString(),
      this.windowSeconds.toString()
    ) as [number, number, number];

    const [allowed, remaining, resetIn] = result;
    const resetAt = Math.floor(now / 1000) + resetIn;

    return {
      allowed: allowed === 1,
      remaining: Math.max(0, remaining),
      limit: this.maxRequests,
      resetAt,
      resetIn: Math.max(0, resetIn),
    };
  }

  async reset(key: string): Promise<void> {
    const redisKey = `ratelimit:sliding-window:${key}`;
    const counterKey = `${redisKey}:counter`;
    await Promise.all([
      this.redis.del(redisKey),
      this.redis.del(counterKey),
    ]);
  }
}

