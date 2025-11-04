# ratelimit-ts


[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Lightweight, production-ready NPM library to add customizable rate limiting to any REST API or bot system. Built with TypeScript and Redis for high performance and distributed system support.

## Features

- 🚀 **Multiple Strategies**: Token bucket, sliding window, and fixed window algorithms
- ⚡ **High Performance**: Redis-backed with atomic Lua scripts for accurate rate limiting
- 🔧 **Flexible Configuration**: Customizable limits, windows, and key generation
- 📦 **TypeScript**: Full type safety and IntelliSense support
- 🌐 **Distributed**: Perfect for multi-server deployments
- 🎯 **Framework Agnostic**: Works with Express, Fastify, or any Node.js application
- 🛡️ **Production Ready**: Error handling, retry logic, and connection management

## Installation

```bash
npm install ratelimit-ts ioredis
```

## Quick Start

```typescript
import { RateLimiter } from 'ratelimit-ts';
import Redis from 'ioredis';

// Create a rate limiter
const limiter = new RateLimiter(
  {
    host: 'localhost',
    port: 6379,
  },
  {
    maxRequests: 100,
    windowSeconds: 60,
    strategy: 'sliding-window',
  }
);

// Check rate limit
try {
  const result = await limiter.check('user-123');
  console.log(`Requests remaining: ${result.remaining}`);
  // Proceed with request
} catch (error) {
  if (error.name === 'RateLimitError') {
    console.log('Rate limit exceeded!');
    console.log(`Retry after: ${error.result.resetIn} seconds`);
  }
}
```

## Usage

### Basic Usage

```typescript
import { RateLimiter } from 'ratelimit-ts';
import Redis from 'ioredis';

// Option 1: Pass Redis connection options
const limiter = new RateLimiter(
  { host: 'localhost', port: 6379 },
  {
    maxRequests: 100,
    windowSeconds: 60,
  }
);

// Option 2: Pass existing Redis instance
const redis = new Redis('redis://localhost:6379');
const limiter = new RateLimiter(redis, {
  maxRequests: 100,
  windowSeconds: 60,
});
```

### Rate Limiting Strategies

#### Sliding Window (Default)

Tracks requests in a sliding time window. Provides smooth rate limiting.

```typescript
const limiter = new RateLimiter(redisOptions, {
  maxRequests: 100,
  windowSeconds: 60,
  strategy: 'sliding-window', // default
});
```

#### Fixed Window

Divides time into fixed windows. Simpler but can allow bursts at window boundaries.

```typescript
const limiter = new RateLimiter(redisOptions, {
  maxRequests: 100,
  windowSeconds: 60,
  strategy: 'fixed-window',
});
```

#### Token Bucket

Refills tokens at a constant rate. Great for allowing bursts while maintaining average rate.

```typescript
const limiter = new RateLimiter(redisOptions, {
  maxRequests: 100,
  windowSeconds: 60,
  strategy: 'token-bucket',
  tokenBucket: {
    capacity: 200, // Max bucket size
    refillRate: 100 / 60, // Tokens per second
  },
});
```

### Express Middleware

```typescript
import express from 'express';
import { RateLimiter } from 'ratelimit-ts';
import { rateLimitMiddleware } from 'ratelimit-ts/middleware/express';

const app = express();

const limiter = new RateLimiter(redisOptions, {
  maxRequests: 100,
  windowSeconds: 60,
});

// Apply to all routes
app.use(rateLimitMiddleware(limiter));

// Custom identifier extraction
app.use(
  rateLimitMiddleware(limiter, (req) => {
    return req.headers['x-api-key'] || req.ip;
  })
);

// Apply to specific route
app.get('/api/users', rateLimitMiddleware(limiter), (req, res) => {
  res.json({ users: [] });
});
```

### Fastify Plugin

```typescript
import Fastify from 'fastify';
import { RateLimiter } from 'ratelimit-ts';
import { rateLimitPlugin } from 'ratelimit-ts/middleware/fastify';

const fastify = Fastify();

const limiter = new RateLimiter(redisOptions, {
  maxRequests: 100,
  windowSeconds: 60,
});

fastify.register(rateLimitPlugin(limiter));
```

### Custom Key Generation

```typescript
const limiter = new RateLimiter(redisOptions, {
  maxRequests: 100,
  windowSeconds: 60,
  keyGenerator: (identifier) => {
    return `api:${identifier}:ratelimit`;
  },
});
```

### Handling Rate Limit Errors

```typescript
try {
  const result = await limiter.check('user-123');
  console.log(`Allowed: ${result.allowed}`);
  console.log(`Remaining: ${result.remaining}`);
  console.log(`Reset in: ${result.resetIn} seconds`);
} catch (error) {
  if (error.name === 'RateLimitError') {
    const { result } = error;
    console.log(`Rate limit exceeded!`);
    console.log(`Retry after ${result.resetIn} seconds`);
    // Send 429 response or handle appropriately
  }
}
```

### Non-blocking Mode

By default, the rate limiter throws an error when the limit is exceeded. You can disable this:

```typescript
const limiter = new RateLimiter(redisOptions, {
  maxRequests: 100,
  windowSeconds: 60,
  blockOnLimit: false, // Don't throw error, just return result
});

const result = await limiter.check('user-123');
if (!result.allowed) {
  // Handle rate limit exceeded
}
```

### Reset Rate Limits

```typescript
// Reset rate limit for a specific identifier
await limiter.reset('user-123');
```

### Get Current Status

```typescript
const result = await limiter.getStatus('user-123');
console.log(`Remaining: ${result.remaining}/${result.limit}`);
```

## API Reference

### RateLimiter

#### Constructor

```typescript
new RateLimiter(redisOptions?: RedisOptions, rateLimitOptions?: RateLimitOptions)
new RateLimiter(redis: Redis, rateLimitOptions?: RateLimitOptions)
```

#### Methods

- `check(identifier: string): Promise<RateLimitResult>` - Check and consume a rate limit token
- `reset(identifier: string): Promise<void>` - Reset rate limit for an identifier
- `getStatus(identifier: string): Promise<RateLimitResult>` - Get current status without consuming
- `disconnect(): Promise<void>` - Close Redis connection
- `getRedisClient(): Redis` - Get underlying Redis client

### RateLimitOptions

```typescript
interface RateLimitOptions {
  maxRequests: number;           // Maximum requests allowed
  windowSeconds: number;          // Time window in seconds
  strategy?: RateLimitStrategy;   // 'token-bucket' | 'sliding-window' | 'fixed-window'
  keyGenerator?: (id: string) => string; // Custom key generator
  blockOnLimit?: boolean;         // Throw error on limit (default: true)
  errorMessage?: string;          // Custom error message
  tokenBucket?: {                 // Token bucket specific options
    capacity?: number;            // Max bucket size
    refillRate?: number;          // Tokens per second
  };
}
```

### RateLimitResult

```typescript
interface RateLimitResult {
  allowed: boolean;    // Whether request is allowed
  remaining: number;   // Requests remaining in window
  limit: number;       // Total requests allowed
  resetAt: number;     // Unix timestamp when limit resets
  resetIn: number;     // Seconds until reset
}
```

### RedisOptions

```typescript
interface RedisOptions {
  host?: string;        // Redis host (default: 'localhost')
  port?: number;        // Redis port (default: 6379)
  password?: string;    // Redis password
  db?: number;          // Database number (default: 0)
  url?: string;         // Redis connection URL
  redisOptions?: any;   // Additional ioredis options
}
```

## Performance Considerations

- **Lua Scripts**: All rate limit operations use atomic Lua scripts for accuracy in distributed systems
- **Connection Pooling**: Reuse Redis connections across multiple rate limiter instances
- **Key Naming**: Use consistent, prefixed keys to avoid collisions
- **Memory**: Redis stores minimal data per rate limit key

## Best Practices

1. **Choose the Right Strategy**:
   - Use `sliding-window` for smooth, continuous rate limiting
   - Use `fixed-window` for simple, predictable limits
   - Use `token-bucket` when you need to allow bursts

2. **Identifier Selection**:
   - Use user IDs for per-user rate limiting
   - Use IP addresses for per-IP rate limiting
   - Use API keys for per-key rate limiting
   - Combine multiple identifiers for complex scenarios

3. **Error Handling**:
   - Always handle `RateLimitError` appropriately
   - Return proper HTTP 429 status codes
   - Include `Retry-After` headers

4. **Monitoring**:
   - Monitor Redis memory usage
   - Track rate limit hit rates
   - Set up alerts for unusual patterns

## Examples

### REST API Rate Limiting

```typescript
import { RateLimiter } from 'ratelimit-ts';
import { rateLimitMiddleware } from 'ratelimit-ts/middleware/express';

// Different limits for different endpoints
const apiLimiter = new RateLimiter(redisOptions, {
  maxRequests: 1000,
  windowSeconds: 3600, // 1 hour
  strategy: 'sliding-window',
});

const strictLimiter = new RateLimiter(redisOptions, {
  maxRequests: 10,
  windowSeconds: 60,
  strategy: 'token-bucket',
});

app.use('/api/v1', rateLimitMiddleware(apiLimiter));
app.post('/api/v1/login', rateLimitMiddleware(strictLimiter), loginHandler);
```

### Bot Rate Limiting

```typescript
import { RateLimiter } from 'ratelimit-ts';

const botLimiter = new RateLimiter(redisOptions, {
  maxRequests: 30,
  windowSeconds: 60,
  strategy: 'token-bucket',
  tokenBucket: {
    capacity: 30,
    refillRate: 0.5, // 30 requests per minute
  },
});

async function sendMessage(userId: string, message: string) {
  try {
    await botLimiter.check(`bot:${userId}`);
    // Send message
  } catch (error) {
    if (error.name === 'RateLimitError') {
      console.log(`Rate limit exceeded for user ${userId}`);
      // Queue message or notify user
    }
  }
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/YOUR_USERNAME/ratelimit-ts).


