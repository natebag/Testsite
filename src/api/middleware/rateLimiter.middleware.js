/**
 * Rate Limiting Middleware for MLG.clan API
 * 
 * Advanced rate limiting with multiple strategies, user-based limits,
 * and integration with Redis for distributed rate limiting.
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import RedisStore from 'rate-limit-redis';
import Redis from 'redis';

/**
 * Rate limiting configuration
 */
const RATE_LIMIT_CONFIG = {
  // Redis configuration
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Global rate limits
  GLOBAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  },
  
  // Authentication endpoints
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // attempts per windowMs
    skipSuccessfulRequests: true,
    message: 'Too many authentication attempts, please try again later.'
  },
  
  // User endpoints
  USER: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 100, // requests per windowMs
    message: 'Too many user requests, please slow down.'
  },
  
  // Voting endpoints (strict limits)
  VOTING: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // votes per minute
    message: 'Voting rate limit exceeded. Please wait before voting again.'
  },
  
  // Content submission
  CONTENT_SUBMIT: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // submissions per hour
    message: 'Too many content submissions. Please wait before submitting more.'
  },
  
  // Clan operations
  CLAN: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50, // requests per windowMs
    message: 'Too many clan requests, please slow down.'
  },
  
  // Search endpoints
  SEARCH: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // searches per minute
    message: 'Too many search requests, please slow down.'
  }
};

/**
 * Create Redis store if available
 */
let redisStore = null;
if (process.env.REDIS_URL || process.env.NODE_ENV === 'production') {
  try {
    const redisClient = Redis.createClient({
      url: RATE_LIMIT_CONFIG.REDIS_URL,
      socket: {
        connectTimeout: 60000,
        lazyConnect: true,
      }
    });
    
    redisStore = new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
    });
  } catch (error) {
    console.warn('Failed to initialize Redis rate limiter store:', error.message);
  }
}

/**
 * Standard rate limiter factory
 */
const createRateLimiter = (config, options = {}) => {
  const limiterConfig = {
    ...config,
    standardHeaders: true,
    legacyHeaders: false,
    ...options
  };
  
  // Add Redis store if available
  if (redisStore) {
    limiterConfig.store = redisStore;
  }
  
  // Custom key generator for authenticated users
  limiterConfig.keyGenerator = (req) => {
    if (req.user) {
      return `user:${req.user.id}:${req.route?.path || req.path}`;
    }
    return `ip:${req.ip}:${req.route?.path || req.path}`;
  };
  
  // Custom skip function
  limiterConfig.skip = (req) => {
    // Skip rate limiting for health checks
    if (req.path === '/api/health' || req.path === '/api/status') {
      return true;
    }
    
    // Skip for admin users (be careful with this)
    if (req.user?.roles?.includes('admin') && options.skipAdmin) {
      return true;
    }
    
    return false;
  };
  
  return rateLimit(limiterConfig);
};

/**
 * Slow down middleware factory
 */
const createSlowDown = (config) => {
  const slowDownConfig = {
    windowMs: config.windowMs,
    delayAfter: Math.floor(config.max * 0.7), // Start slowing after 70% of limit
    delayMs: 500, // Delay by 500ms
    maxDelayMs: 20000, // Maximum delay of 20 seconds
    skipFailedRequests: true,
    skipSuccessfulRequests: false,
    ...config
  };
  
  // Add Redis store if available
  if (redisStore) {
    slowDownConfig.store = redisStore;
  }
  
  // Custom key generator
  slowDownConfig.keyGenerator = (req) => {
    if (req.user) {
      return `slow:user:${req.user.id}:${req.route?.path || req.path}`;
    }
    return `slow:ip:${req.ip}:${req.route?.path || req.path}`;
  };
  
  return slowDown(slowDownConfig);
};

/**
 * Predefined rate limiters
 */
export const rateLimiters = {
  // Global rate limiter
  global: createRateLimiter(RATE_LIMIT_CONFIG.GLOBAL),
  
  // Authentication rate limiter
  auth: createRateLimiter(RATE_LIMIT_CONFIG.AUTH, {
    message: {
      error: 'Too many authentication attempts',
      code: 'AUTH_RATE_LIMITED',
      retryAfter: Math.ceil(RATE_LIMIT_CONFIG.AUTH.windowMs / 1000)
    }
  }),
  
  // User operations rate limiter
  user: createRateLimiter(RATE_LIMIT_CONFIG.USER, {
    message: {
      error: 'Too many user requests',
      code: 'USER_RATE_LIMITED',
      retryAfter: Math.ceil(RATE_LIMIT_CONFIG.USER.windowMs / 1000)
    }
  }),
  
  // Voting rate limiter with slow down
  voting: [
    createSlowDown(RATE_LIMIT_CONFIG.VOTING),
    createRateLimiter(RATE_LIMIT_CONFIG.VOTING, {
      message: {
        error: 'Voting rate limit exceeded',
        code: 'VOTING_RATE_LIMITED',
        retryAfter: Math.ceil(RATE_LIMIT_CONFIG.VOTING.windowMs / 1000)
      }
    })
  ],
  
  // Content submission rate limiter
  contentSubmit: createRateLimiter(RATE_LIMIT_CONFIG.CONTENT_SUBMIT, {
    message: {
      error: 'Content submission rate limit exceeded',
      code: 'CONTENT_SUBMIT_RATE_LIMITED',
      retryAfter: Math.ceil(RATE_LIMIT_CONFIG.CONTENT_SUBMIT.windowMs / 1000)
    }
  }),
  
  // Clan operations rate limiter
  clan: createRateLimiter(RATE_LIMIT_CONFIG.CLAN, {
    skipAdmin: true,
    message: {
      error: 'Too many clan requests',
      code: 'CLAN_RATE_LIMITED',
      retryAfter: Math.ceil(RATE_LIMIT_CONFIG.CLAN.windowMs / 1000)
    }
  }),
  
  // Search rate limiter
  search: createRateLimiter(RATE_LIMIT_CONFIG.SEARCH, {
    message: {
      error: 'Too many search requests',
      code: 'SEARCH_RATE_LIMITED',
      retryAfter: Math.ceil(RATE_LIMIT_CONFIG.SEARCH.windowMs / 1000)
    }
  })
};

/**
 * Dynamic rate limiter based on user tier
 */
export const tieredRateLimit = (baseConfig, tierMultipliers = {}) => {
  return (req, res, next) => {
    let config = { ...baseConfig };
    
    // Adjust limits based on user tier/role
    if (req.user) {
      const userRoles = req.user.roles || [];
      
      if (userRoles.includes('premium')) {
        config.max = Math.floor(config.max * (tierMultipliers.premium || 2));
      } else if (userRoles.includes('vip')) {
        config.max = Math.floor(config.max * (tierMultipliers.vip || 5));
      } else if (userRoles.includes('admin')) {
        config.max = Math.floor(config.max * (tierMultipliers.admin || 10));
      }
    }
    
    const limiter = createRateLimiter(config);
    return limiter(req, res, next);
  };
};

/**
 * Adaptive rate limiter that adjusts based on server load
 */
export const adaptiveRateLimit = (baseConfig, loadThresholds = {}) => {
  return (req, res, next) => {
    let config = { ...baseConfig };
    
    // Get current server metrics (would need to be implemented)
    const serverLoad = getServerLoad(); // Placeholder function
    
    if (serverLoad > (loadThresholds.high || 0.8)) {
      // High load: reduce limits by 50%
      config.max = Math.floor(config.max * 0.5);
    } else if (serverLoad > (loadThresholds.medium || 0.6)) {
      // Medium load: reduce limits by 25%
      config.max = Math.floor(config.max * 0.75);
    }
    
    const limiter = createRateLimiter(config);
    return limiter(req, res, next);
  };
};

/**
 * Placeholder function for server load (would integrate with monitoring)
 */
function getServerLoad() {
  // This would integrate with your monitoring system
  // Return a value between 0 and 1 representing current server load
  return Math.random() * 0.5; // Placeholder
}

/**
 * Rate limit bypass for testing
 */
export const bypassRateLimit = (req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }
  
  // Check for bypass header (only in development)
  if (process.env.NODE_ENV === 'development' && req.headers['x-bypass-rate-limit']) {
    return next();
  }
  
  // Continue to actual rate limiter
  next();
};

/**
 * Rate limit headers middleware
 */
export const rateLimitHeaders = (req, res, next) => {
  // Add custom rate limit headers
  res.set({
    'X-RateLimit-Policy': 'MLG-Clan-API-v1',
    'X-RateLimit-User': req.user?.id ? 'authenticated' : 'anonymous'
  });
  
  next();
};

/**
 * Rate limit monitoring middleware
 */
export const rateLimitMonitoring = (req, res, next) => {
  // Track rate limit metrics
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log rate limit hits
    if (res.statusCode === 429) {
      const rateLimitType = req.route?.path || 'unknown';
      console.warn(`Rate limit exceeded: ${req.ip} - ${rateLimitType} - User: ${req.user?.id || 'anonymous'}`);
      
      // Could integrate with monitoring service here
      // metrics.increment('rate_limit.exceeded', { type: rateLimitType });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Main rate limiter middleware that can be customized per route
 */
export const rateLimiterMiddleware = (type = 'global', options = {}) => {
  return (req, res, next) => {
    const limiter = rateLimiters[type];
    
    if (!limiter) {
      console.warn(`Unknown rate limiter type: ${type}`);
      return next();
    }
    
    // Apply bypass first
    bypassRateLimit(req, res, () => {
      // Apply rate limit headers
      rateLimitHeaders(req, res, () => {
        // Apply monitoring
        rateLimitMonitoring(req, res, () => {
          // Apply the actual rate limiter
          if (Array.isArray(limiter)) {
            // Apply multiple limiters in sequence
            let index = 0;
            const applyNext = () => {
              if (index < limiter.length) {
                limiter[index++](req, res, applyNext);
              } else {
                next();
              }
            };
            applyNext();
          } else {
            limiter(req, res, next);
          }
        });
      });
    });
  };
};

// Export everything
export default {
  rateLimiters,
  tieredRateLimit,
  adaptiveRateLimit,
  rateLimiterMiddleware,
  bypassRateLimit,
  rateLimitHeaders,
  rateLimitMonitoring
};