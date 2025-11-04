"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitMiddleware = rateLimitMiddleware;
/**
 * Express middleware factory for rate limiting
 *
 * @param rateLimiter - RateLimiter instance
 * @param getIdentifier - Function to extract identifier from request (default: uses IP address)
 * @returns Express middleware function
 */
function rateLimitMiddleware(rateLimiter, getIdentifier) {
    return async (req, res, next) => {
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
        }
        catch (error) {
            if (error?.name === 'RateLimitError' && error?.result) {
                const result = error.result;
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
//# sourceMappingURL=express.js.map