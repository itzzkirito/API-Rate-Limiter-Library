/**
 * Basic usage example for ratelimit-ts
 */

import { RateLimiter } from '../src/index';

async function example() {
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

  try {
    // Check rate limit for a user
    const result = await limiter.check('user-123');
    console.log(`Request allowed: ${result.allowed}`);
    console.log(`Requests remaining: ${result.remaining}`);
    console.log(`Reset in: ${result.resetIn} seconds`);

    // Proceed with your request
  } catch (error: any) {
    if (error.name === 'RateLimitError') {
      console.log('Rate limit exceeded!');
      console.log(`Retry after: ${error.result.resetIn} seconds`);
    } else {
      console.error('Error:', error);
    }
  } finally {
    // Clean up
    await limiter.disconnect();
  }
}

// Run example
if (require.main === module) {
  example().catch(console.error);
}

