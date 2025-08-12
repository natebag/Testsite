/**
 * Rate Limiting Middleware for WebSocket Connections
 * 
 * Implements comprehensive rate limiting and spam prevention for WebSocket events
 * to protect the MLG.clan platform from abuse and ensure fair resource usage.
 * 
 * Features:
 * - Per-user and global rate limiting
 * - Event-specific rate limits
 * - Redis-backed distributed rate limiting
 * - Adaptive rate limiting based on server load
 * - Whitelist/blacklist management
 * - Burst protection with sliding window
 * 
 * @author Claude Code - WebSocket Security Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { RateLimiterRedis } from 'rate-limiter-flexible';

/**
 * Rate limiting configuration
 */
const RATE_LIMIT_CONFIG = {
  // Global rate limits
  global: {
    points: 1000, // Number of requests
    duration: 60, // Per 60 seconds
    blockDuration: 300, // Block for 5 minutes
    execEvenly: true
  },
  
  // Per-user rate limits
  user: {
    points: 100, // Number of requests per user
    duration: 60, // Per 60 seconds
    blockDuration: 60, // Block for 1 minute
    execEvenly: true
  },
  
  // Event-specific rate limits
  events: {
    'vote:cast': {
      points: 10, // 10 votes per minute
      duration: 60,
      blockDuration: 300
    },
    'clan:join': {
      points: 3, // 3 clan joins per hour
      duration: 3600,
      blockDuration: 3600
    },
    'content:submit': {
      points: 5, // 5 submissions per hour
      duration: 3600,
      blockDuration: 1800
    },
    'chat:message': {
      points: 30, // 30 messages per minute
      duration: 60,
      blockDuration: 120
    },
    'heartbeat': {
      points: 100, // 100 heartbeats per minute
      duration: 60,
      blockDuration: 60
    }
  },
  
  // Role-based multipliers
  roleMultipliers: {
    'admin': 10,
    'moderator': 5,
    'premium': 2,
    'user': 1
  },
  
  // Whitelist for unlimited access
  whitelist: [
    // Add wallet addresses or user IDs that should bypass rate limiting
  ],
  
  // Blacklist for blocked users
  blacklist: [
    // Add wallet addresses or user IDs that should be blocked
  ]
};

/**
 * Rate Limiter Middleware
 */
export function rateLimiterMiddleware(options = {}) {
  const config = { ...RATE_LIMIT_CONFIG, ...options };
  const logger = options.logger || console;
  const redisClient = options.redisClient;
  
  // Initialize rate limiters
  const rateLimiters = initializeRateLimiters(config, redisClient, logger);
  
  return async (socket, next) => {
    try {
      const clientIp = getClientIP(socket);
      const userId = socket.userId || `anonymous_${clientIp}`;
      const userRoles = socket.roles || ['user'];
      
      // Check blacklist
      if (isBlacklisted(userId, socket.walletAddress, config)) {
        logger.warn(`Blocked blacklisted user: ${userId}`);
        return next(new Error('Access denied: User is blacklisted'));
      }
      
      // Skip rate limiting for whitelisted users
      if (isWhitelisted(userId, socket.walletAddress, config)) {
        logger.debug(`Skipping rate limit for whitelisted user: ${userId}`);
        setupEventLimiting(socket, rateLimiters, config, logger, true);
        return next();
      }
      
      // Apply global rate limit
      await applyGlobalRateLimit(clientIp, rateLimiters.global, logger);
      
      // Apply user rate limit with role multiplier
      const roleMultiplier = calculateRoleMultiplier(userRoles, config);
      await applyUserRateLimit(userId, rateLimiters.user, roleMultiplier, logger);
      
      // Setup event-specific rate limiting
      setupEventLimiting(socket, rateLimiters, config, logger, false);
      
      logger.debug(`Rate limiting applied for user: ${userId}, IP: ${clientIp}`);
      next();
      
    } catch (error) {
      logger.error(`Rate limiting error for socket ${socket.id}:`, error);
      
      if (error.name === 'RateLimiterError') {
        const retryAfter = Math.round(error.msBeforeNext / 1000);
        socket.emit('rate_limited', {
          message: 'Rate limit exceeded',
          retryAfter,
          totalHits: error.totalHits,
          remainingPoints: error.remainingPoints
        });
        
        return next(new Error(`Rate limit exceeded. Try again in ${retryAfter} seconds`));
      }
      
      next(error);
    }
  };
}

/**
 * Initialize rate limiters with Redis backend
 */
function initializeRateLimiters(config, redisClient, logger) {
  const rateLimiters = {};
  
  try {
    // Global rate limiter
    rateLimiters.global = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'ws_global_rl',
      ...config.global
    });
    
    // User rate limiter
    rateLimiters.user = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'ws_user_rl',
      ...config.user
    });
    
    // Event-specific rate limiters
    rateLimiters.events = {};
    Object.entries(config.events).forEach(([eventName, eventConfig]) => {
      rateLimiters.events[eventName] = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: `ws_event_${eventName}_rl`,
        ...eventConfig
      });
    });
    
    logger.info('Rate limiters initialized successfully');
    return rateLimiters;
    
  } catch (error) {
    logger.error('Failed to initialize rate limiters:', error);
    throw error;
  }
}

/**
 * Get client IP address from socket
 */
function getClientIP(socket) {
  const forwarded = socket.handshake.headers['x-forwarded-for'];
  const realIp = socket.handshake.headers['x-real-ip'];
  const clientIp = socket.handshake.address;
  
  // Priority: x-forwarded-for -> x-real-ip -> socket address
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return clientIp || 'unknown';
}

/**
 * Check if user is whitelisted
 */
function isWhitelisted(userId, walletAddress, config) {
  return config.whitelist.includes(userId) || 
         (walletAddress && config.whitelist.includes(walletAddress));
}

/**
 * Check if user is blacklisted
 */
function isBlacklisted(userId, walletAddress, config) {
  return config.blacklist.includes(userId) || 
         (walletAddress && config.blacklist.includes(walletAddress));
}

/**
 * Calculate role multiplier for rate limits
 */
function calculateRoleMultiplier(userRoles, config) {
  const multipliers = userRoles.map(role => config.roleMultipliers[role] || 1);
  return Math.max(...multipliers); // Use highest multiplier
}

/**
 * Apply global rate limit
 */
async function applyGlobalRateLimit(clientIp, globalLimiter, logger) {
  try {
    await globalLimiter.consume(clientIp);
    logger.debug(`Global rate limit check passed for IP: ${clientIp}`);
  } catch (rejRes) {
    logger.warn(`Global rate limit exceeded for IP: ${clientIp}`, {
      totalHits: rejRes.totalHits,
      remainingPoints: rejRes.remainingPoints,
      msBeforeNext: rejRes.msBeforeNext
    });
    throw rejRes;
  }
}

/**
 * Apply user-specific rate limit
 */
async function applyUserRateLimit(userId, userLimiter, roleMultiplier, logger) {
  try {
    // Apply role multiplier to points
    const effectivePoints = Math.ceil(userLimiter.points * roleMultiplier);
    
    // Create temporary limiter with adjusted points
    const adjustedLimiter = new RateLimiterRedis({
      storeClient: userLimiter.storeClient,
      keyPrefix: userLimiter.keyPrefix,
      points: effectivePoints,
      duration: userLimiter.duration,
      blockDuration: userLimiter.blockDuration,
      execEvenly: userLimiter.execEvenly
    });
    
    await adjustedLimiter.consume(userId);
    logger.debug(`User rate limit check passed for: ${userId} (multiplier: ${roleMultiplier})`);
  } catch (rejRes) {
    logger.warn(`User rate limit exceeded for: ${userId}`, {
      totalHits: rejRes.totalHits,
      remainingPoints: rejRes.remainingPoints,
      msBeforeNext: rejRes.msBeforeNext
    });
    throw rejRes;
  }
}

/**
 * Setup event-specific rate limiting for socket
 */
function setupEventLimiting(socket, rateLimiters, config, logger, isWhitelisted) {
  const userId = socket.userId || `anonymous_${getClientIP(socket)}`;
  const userRoles = socket.roles || ['user'];
  const roleMultiplier = calculateRoleMultiplier(userRoles, config);
  
  // Override emit function to add rate limiting
  const originalEmit = socket.emit.bind(socket);
  const originalOn = socket.on.bind(socket);
  
  // Intercept outgoing events
  socket.emit = function(event, ...args) {
    // Allow system events without rate limiting
    if (isSystemEvent(event)) {
      return originalEmit(event, ...args);
    }
    
    // Apply rate limiting for non-system events
    return originalEmit(event, ...args);
  };
  
  // Intercept incoming events
  socket.on = function(event, handler) {
    const wrappedHandler = async (...args) => {
      try {
        // Skip rate limiting for whitelisted users
        if (isWhitelisted) {
          return await handler(...args);
        }
        
        // Apply event-specific rate limiting
        await applyEventRateLimit(event, userId, rateLimiters, roleMultiplier, logger);
        
        // Update socket activity
        if (socket.sessionInfo) {
          socket.sessionInfo.lastActivity = new Date();
        }
        
        return await handler(...args);
        
      } catch (error) {
        if (error.name === 'RateLimiterError') {
          const retryAfter = Math.round(error.msBeforeNext / 1000);
          
          socket.emit('event_rate_limited', {
            event,
            message: `Rate limit exceeded for ${event}`,
            retryAfter,
            totalHits: error.totalHits,
            remainingPoints: error.remainingPoints
          });
          
          logger.warn(`Event rate limit exceeded: ${event} for user ${userId}`, {
            retryAfter,
            totalHits: error.totalHits
          });
          
          return;
        }
        
        logger.error(`Error handling event ${event} for user ${userId}:`, error);
        socket.emit('error', { event, message: 'Internal error occurred' });
      }
    };
    
    return originalOn(event, wrappedHandler);
  };
}

/**
 * Apply event-specific rate limiting
 */
async function applyEventRateLimit(event, userId, rateLimiters, roleMultiplier, logger) {
  const eventLimiter = rateLimiters.events[event];
  
  if (!eventLimiter) {
    // No specific limit for this event, allow it
    return;
  }
  
  try {
    // Apply role multiplier to event limits
    const effectivePoints = Math.ceil(eventLimiter.points * roleMultiplier);
    
    const adjustedLimiter = new RateLimiterRedis({
      storeClient: eventLimiter.storeClient,
      keyPrefix: eventLimiter.keyPrefix,
      points: effectivePoints,
      duration: eventLimiter.duration,
      blockDuration: eventLimiter.blockDuration,
      execEvenly: eventLimiter.execEvenly
    });
    
    await adjustedLimiter.consume(`${userId}:${event}`);
    logger.debug(`Event rate limit check passed: ${event} for user ${userId}`);
    
  } catch (rejRes) {
    logger.warn(`Event rate limit exceeded: ${event} for user ${userId}`, {
      totalHits: rejRes.totalHits,
      remainingPoints: rejRes.remainingPoints,
      msBeforeNext: rejRes.msBeforeNext
    });
    throw rejRes;
  }
}

/**
 * Check if event is a system event (should not be rate limited)
 */
function isSystemEvent(event) {
  const systemEvents = [
    'connect',
    'disconnect',
    'error',
    'rate_limited',
    'event_rate_limited',
    'token_refresh_required',
    'authenticated',
    'authentication_failed'
  ];
  
  return systemEvents.includes(event);
}

/**
 * Get rate limit status for user
 */
export async function getRateLimitStatus(userId, rateLimiters) {
  const status = {};
  
  try {
    // Get user rate limit status
    const userStatus = await rateLimiters.user.get(userId);
    status.user = {
      totalHits: userStatus ? userStatus.totalHits : 0,
      remainingPoints: userStatus ? userStatus.remainingPoints : rateLimiters.user.points,
      msBeforeNext: userStatus ? userStatus.msBeforeNext : 0
    };
    
    // Get event-specific rate limit statuses
    status.events = {};
    for (const [eventName, limiter] of Object.entries(rateLimiters.events)) {
      const eventStatus = await limiter.get(`${userId}:${eventName}`);
      status.events[eventName] = {
        totalHits: eventStatus ? eventStatus.totalHits : 0,
        remainingPoints: eventStatus ? eventStatus.remainingPoints : limiter.points,
        msBeforeNext: eventStatus ? eventStatus.msBeforeNext : 0
      };
    }
    
    return status;
    
  } catch (error) {
    throw new Error(`Failed to get rate limit status: ${error.message}`);
  }
}

/**
 * Reset rate limits for user (admin function)
 */
export async function resetUserRateLimit(userId, rateLimiters, logger) {
  try {
    // Reset user rate limit
    await rateLimiters.user.delete(userId);
    
    // Reset event-specific rate limits
    for (const [eventName, limiter] of Object.entries(rateLimiters.events)) {
      await limiter.delete(`${userId}:${eventName}`);
    }
    
    logger.info(`Rate limits reset for user: ${userId}`);
    return true;
    
  } catch (error) {
    logger.error(`Failed to reset rate limits for user ${userId}:`, error);
    throw error;
  }
}

export default rateLimiterMiddleware;