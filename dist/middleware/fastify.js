"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitPlugin = rateLimitPlugin;
/**
 * Fastify plugin factory for rate limiting
 *
 * @param rateLimiter - RateLimiter instance
 * @param getIdentifier - Function to extract identifier from request (default: uses IP address)
 * @returns Fastify plugin
 */
function rateLimitPlugin(rateLimiter, getIdentifier) {
    return async function (fastify) {
        fastify.addHook('onRequest', async (request, reply) => {
            try {
                const identifier = getIdentifier
                    ? getIdentifier(request)
                    : request.ip || request.socket.remoteAddress || 'unknown';
                const result = await rateLimiter.check(identifier);
                // Add rate limit headers
                reply.header('X-RateLimit-Limit', result.limit.toString());
                reply.header('X-RateLimit-Remaining', result.remaining.toString());
                reply.header('X-RateLimit-Reset', result.resetAt.toString());
            }
            catch (error) {
                if (error?.name === 'RateLimitError' && error?.result) {
                    const result = error.result;
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
//# sourceMappingURL=fastify.js.map