import { Redis } from 'ioredis';
import { RateLimitOptions, RateLimitResult } from '../types';
import { RateLimitStrategy } from './base';

/**
 * Fixed Window rate limiting strategy
 * 
 * Divides time into fixed windows. Each window has a maximum number of requests.
 * When the window expires, the counter resets.
 */
export class FixedWindowStrategy implements RateLimitStrategy {
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
    const windowStart = Math.floor(now / 1000 / this.windowSeconds) * this.windowSeconds;
    const redisKey = `ratelimit:fixed-window:${key}:${windowStart}`;
    
    // Use Lua script for atomic operations
    const luaScript = `
      local key = KEYS[1]
      local maxRequests = tonumber(ARGV[1])
      local windowSeconds = tonumber(ARGV[2])
      
      -- Get current count
      local count = tonumber(redis.call('GET', key) or 0)
      
      -- Check if we can allow the request
      local allowed = 0
      local remaining = maxRequests - count
      
      if count < maxRequests then
        count = count + 1
        redis.call('SET', key, count)
        redis.call('EXPIRE', key, windowSeconds)
        allowed = 1
        remaining = maxRequests - count
      end
      
      return {allowed, remaining, windowSeconds}
    `;

    const result = await this.redis.eval(
      luaScript,
      1,
      redisKey,
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
    // For fixed window, we need to delete all possible window keys
    // Note: Using SCAN instead of KEYS for better performance in production
    const pattern = `ratelimit:fixed-window:${key}:*`;
    
    // Use SCAN for better performance (doesn't block Redis)
    const stream = this.redis.scanStream({
      match: pattern,
      count: 100,
    });
    
    const keysToDelete: string[] = [];
    for await (const keys of stream) {
      if (Array.isArray(keys)) {
        keysToDelete.push(...keys);
      } else if (typeof keys === 'string') {
        keysToDelete.push(keys);
      }
      
      if (keysToDelete.length > 1000) {
        // Delete in batches to avoid memory issues
        const batch = keysToDelete.splice(0, 1000);
        await this.redis.del(...batch);
      }
    }
    
    if (keysToDelete.length > 0) {
      await this.redis.del(...keysToDelete);
    }
  }
}

