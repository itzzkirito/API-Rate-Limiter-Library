/**
 * ratelimit-ts
 *
 * Lightweight NPM library to add customizable rate limiting to any REST API or bot system.
 */
export { RateLimiter } from './rate-limiter';
export { RateLimitOptions, RateLimitResult, RateLimitStrategy, RateLimitError, RedisOptions, } from './types';
export { RateLimitStrategy as StrategyInterface, TokenBucketStrategy, SlidingWindowStrategy, FixedWindowStrategy, } from './strategies';
export { createRedisClient } from './redis-client';
export { rateLimitMiddleware } from './middleware/express';
export { rateLimitPlugin } from './middleware/fastify';
export { RateLimiter as default } from './rate-limiter';
