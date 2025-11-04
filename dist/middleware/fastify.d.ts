import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { RateLimiter } from '../rate-limiter';
/**
 * Fastify plugin factory for rate limiting
 *
 * @param rateLimiter - RateLimiter instance
 * @param getIdentifier - Function to extract identifier from request (default: uses IP address)
 * @returns Fastify plugin
 */
export declare function rateLimitPlugin(rateLimiter: RateLimiter, getIdentifier?: (req: FastifyRequest) => string): FastifyPluginAsync;
