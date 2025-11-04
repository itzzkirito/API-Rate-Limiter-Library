import { Request, Response, NextFunction } from 'express';
import { RateLimiter } from '../rate-limiter';
/**
 * Express middleware factory for rate limiting
 *
 * @param rateLimiter - RateLimiter instance
 * @param getIdentifier - Function to extract identifier from request (default: uses IP address)
 * @returns Express middleware function
 */
export declare function rateLimitMiddleware(rateLimiter: RateLimiter, getIdentifier?: (req: Request) => string): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
