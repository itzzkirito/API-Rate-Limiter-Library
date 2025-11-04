/**
 * Rate limiting strategy types
 */
export type RateLimitStrategy = 'token-bucket' | 'sliding-window' | 'fixed-window';

/**
 * Rate limit configuration options
 */
export interface RateLimitOptions {
  /**
   * Maximum number of requests allowed
   */
  maxRequests: number;
  
  /**
   * Time window in seconds
   */
  windowSeconds: number;
  
  /**
   * Rate limiting strategy to use
   * @default 'sliding-window'
   */
  strategy?: RateLimitStrategy;
  
  /**
   * Custom key generator function
   * @default (identifier) => identifier
   */
  keyGenerator?: (identifier: string) => string;
  
  /**
   * Whether to block requests when limit is exceeded
   * @default true
   */
  blockOnLimit?: boolean;
  
  /**
   * Custom error message when rate limit is exceeded
   */
  errorMessage?: string;
  
  /**
   * Token bucket specific options (only used when strategy is 'token-bucket')
   */
  tokenBucket?: {
    /**
     * Maximum bucket size
     * @default maxRequests
     */
    capacity?: number;
    
    /**
     * Tokens refilled per second
     * @default maxRequests / windowSeconds
     */
    refillRate?: number;
  };
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  /**
   * Whether the request is allowed
   */
  allowed: boolean;
  
  /**
   * Number of requests remaining in the current window
   */
  remaining: number;
  
  /**
   * Total number of requests allowed in the window
   */
  limit: number;
  
  /**
   * Unix timestamp (seconds) when the rate limit will reset
   */
  resetAt: number;
  
  /**
   * Number of seconds until the rate limit resets
   */
  resetIn: number;
}

/**
 * Redis connection options
 */
export interface RedisOptions {
  /**
   * Redis host
   * @default 'localhost'
   */
  host?: string;
  
  /**
   * Redis port
   * @default 6379
   */
  port?: number;
  
  /**
   * Redis password
   */
  password?: string;
  
  /**
   * Redis database number
   * @default 0
   */
  db?: number;
  
  /**
   * Redis connection URL (alternative to host/port)
   */
  url?: string;
  
  /**
   * Redis connection options (for ioredis)
   */
  redisOptions?: any;
}

/**
 * Rate limit error
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly result: RateLimitResult
  ) {
    super(message);
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

