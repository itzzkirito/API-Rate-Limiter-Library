import Redis, { RedisOptions as IORedisOptions } from 'ioredis';
import { RedisOptions as RateLimiterRedisOptions } from './types';

/**
 * Create and configure a Redis client
 */
export function createRedisClient(options?: RateLimiterRedisOptions): Redis {
  if (options?.url) {
    return new Redis(options.url, options.redisOptions);
  }

  const redisOptions: IORedisOptions = {
    host: options?.host ?? 'localhost',
    port: options?.port ?? 6379,
    password: options?.password,
    db: options?.db ?? 0,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    ...options?.redisOptions,
  };

  return new Redis(redisOptions);
}

