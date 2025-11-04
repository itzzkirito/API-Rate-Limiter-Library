import { Request, Response, NextFunction } from 'express';
import { RateLimiter } from '../rate-limiter';
import { RateLimitResult } from '../types';

/**
 * Express middleware factory for rate limiting
 * 
 * @param rateLimiter - RateLimiter instance
 * @param getIdentifier - Function to extract identifier from request (default: uses IP address)
 * @returns Express middleware function
 */
export function rateLimitMiddleware(
  rateLimiter: RateLimiter,
  getIdentifier?: (req: Request) => string
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const identifier = getIdentifier
        ? getIdentifier(req)
        : req.ip || req.socket.remoteAddress || 'unknown';

      const result = await rateLimiter.check(identifier);

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', result.limit.toString());
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      res.setHeader('X-RateLimit-Reset', result.resetAt.toString());

      next();
    } catch (error: any) {
      if (error?.name === 'RateLimitError' && error?.result) {
        const result = error.result as RateLimitResult;
        res.setHeader('X-RateLimit-Limit', result.limit.toString());
        res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
        res.setHeader('X-RateLimit-Reset', result.resetAt.toString());
        res.setHeader('Retry-After', result.resetIn.toString());
        
        return res.status(429).json({
          error: error.message,
          retryAfter: result.resetIn,
          resetAt: result.resetAt,
        });
      }
      
      // Handle Redis connection errors
      if (error.message && error.message.includes('ECONNREFUSED')) {
        console.error('Redis connection error:', error.message);
        // Continue without rate limiting if Redis is unavailable
        // In production, you might want to handle this differently
        return next();
      }
      
      next(error);
    }
  };
}

