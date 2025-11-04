import { FastifyPluginAsync, FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { RateLimiter } from '../rate-limiter';
import { RateLimitResult } from '../types';

/**
 * Fastify plugin factory for rate limiting
 * 
 * @param rateLimiter - RateLimiter instance
 * @param getIdentifier - Function to extract identifier from request (default: uses IP address)
 * @returns Fastify plugin
 */
export function rateLimitPlugin(
  rateLimiter: RateLimiter,
  getIdentifier?: (req: FastifyRequest) => string
): FastifyPluginAsync {
  return async function (fastify: FastifyInstance) {
    fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const identifier = getIdentifier
          ? getIdentifier(request)
          : request.ip || request.socket.remoteAddress || 'unknown';

        const result = await rateLimiter.check(identifier);

        // Add rate limit headers
        reply.header('X-RateLimit-Limit', result.limit.toString());
        reply.header('X-RateLimit-Remaining', result.remaining.toString());
        reply.header('X-RateLimit-Reset', result.resetAt.toString());
      } catch (error: any) {
        if (error?.name === 'RateLimitError' && error?.result) {
          const result = error.result as RateLimitResult;
          reply.header('X-RateLimit-Limit', result.limit.toString());
          reply.header('X-RateLimit-Remaining', result.remaining.toString());
          reply.header('X-RateLimit-Reset', result.resetAt.toString());
          reply.header('Retry-After', result.resetIn.toString());
          
          return reply.code(429).send({
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
          return;
        }
        
        // For other errors, let Fastify handle them
        throw error;
      }
    });
  };
}

