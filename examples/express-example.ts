/**
 * Express middleware example for ratelimit-ts
 */

import express from 'express';
import { RateLimiter, rateLimitMiddleware } from '../src/index';

const app = express();
app.use(express.json());

// Create rate limiter
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

// Apply rate limiting to all routes
app.use(rateLimitMiddleware(limiter));

// Or apply to specific routes
app.get('/api/users', rateLimitMiddleware(limiter), (req, res) => {
  res.json({ users: [] });
});

// Custom identifier extraction
app.post(
  '/api/login',
  rateLimitMiddleware(limiter, (req) => {
    return req.headers['x-api-key'] as string || req.ip || 'unknown';
  }),
  (req, res) => {
    res.json({ message: 'Login successful' });
  }
);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

