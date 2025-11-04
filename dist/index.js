"use strict";
/**
 * ratelimit-ts
 *
 * Lightweight NPM library to add customizable rate limiting to any REST API or bot system.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.rateLimitPlugin = exports.rateLimitMiddleware = exports.createRedisClient = exports.FixedWindowStrategy = exports.SlidingWindowStrategy = exports.TokenBucketStrategy = exports.RateLimitError = exports.RateLimiter = void 0;
var rate_limiter_1 = require("./rate-limiter");
Object.defineProperty(exports, "RateLimiter", { enumerable: true, get: function () { return rate_limiter_1.RateLimiter; } });
var types_1 = require("./types");
Object.defineProperty(exports, "RateLimitError", { enumerable: true, get: function () { return types_1.RateLimitError; } });
var strategies_1 = require("./strategies");
Object.defineProperty(exports, "TokenBucketStrategy", { enumerable: true, get: function () { return strategies_1.TokenBucketStrategy; } });
Object.defineProperty(exports, "SlidingWindowStrategy", { enumerable: true, get: function () { return strategies_1.SlidingWindowStrategy; } });
Object.defineProperty(exports, "FixedWindowStrategy", { enumerable: true, get: function () { return strategies_1.FixedWindowStrategy; } });
var redis_client_1 = require("./redis-client");
Object.defineProperty(exports, "createRedisClient", { enumerable: true, get: function () { return redis_client_1.createRedisClient; } });
var express_1 = require("./middleware/express");
Object.defineProperty(exports, "rateLimitMiddleware", { enumerable: true, get: function () { return express_1.rateLimitMiddleware; } });
var fastify_1 = require("./middleware/fastify");
Object.defineProperty(exports, "rateLimitPlugin", { enumerable: true, get: function () { return fastify_1.rateLimitPlugin; } });
// Default export for convenience
var rate_limiter_2 = require("./rate-limiter");
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return rate_limiter_2.RateLimiter; } });
//# sourceMappingURL=index.js.map