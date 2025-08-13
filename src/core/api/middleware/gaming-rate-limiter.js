/**
 * Gaming-Specific Rate Limiter for MLG.clan Platform
 * 
 * Advanced rate limiting system optimized for gaming platforms with:
 * - Gaming session awareness
 * - Tournament mode protections
 * - Web3 transaction rate limiting
 * - Competitive gaming abuse prevention
 * - Real-time gaming data rate management
 * 
 * @author Claude Code - Security Performance Auditor
 * @version 1.0.0
 * @created 2025-08-12
 */

import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import RedisStore from 'rate-limit-redis';
import Redis from 'redis';

/**
 * Gaming-specific rate limiting configurations
 */
const GAMING_RATE_LIMITS = {
  // Redis configuration with gaming optimizations
  REDIS: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    keyPrefix: 'mlg_rate_limit:',
    // Gaming-optimized connection settings
    socket: {
      connectTimeout: 5000, // Fast connection for gaming
      lazyConnect: true,
      keepAlive: 30000
    },
    // Gaming session persistence
    database: process.env.REDIS_GAMING_DB || 1
  },

  // Gaming session-aware limits
  GAMING_SESSION: {
    windowMs: 60 * 1000, // 1 minute windows for active gaming
    max: 200, // High limits for active gaming sessions
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Tournament mode enhanced limits
  TOURNAMENT_MODE: {
    windowMs: 30 * 1000, // 30 second windows during tournaments
    max: 500, // Very high limits for tournament participants
    skipSuccessfulRequests: false
  },

  // Web3 transaction rate limiting
  WEB3_TRANSACTIONS: {
    windowMs: 5 * 60 * 1000, // 5 minute window
    max: 20, // Max 20 transactions per 5 minutes
    skipSuccessfulRequests: true, // Don't count successful transactions
    skipFailedRequests: false // Count failed attempts
  },

  // Vote submission and burn-to-vote
  VOTING_OPERATIONS: {
    windowMs: 60 * 1000, // 1 minute
    max: 15, // Max 15 votes per minute
    skipSuccessfulRequests: false
  },

  // Clan management operations
  CLAN_OPERATIONS: {
    windowMs: 2 * 60 * 1000, // 2 minutes
    max: 30, // Clan operations
    skipSuccessfulRequests: false
  },

  // Real-time gaming communication
  GAMING_CHAT: {
    windowMs: 10 * 1000, // 10 seconds
    max: 25, // Max 25 messages per 10 seconds
    skipSuccessfulRequests: false
  },

  // Leaderboard and score updates
  LEADERBOARD_UPDATES: {
    windowMs: 30 * 1000, // 30 seconds
    max: 100, // High frequency for real-time leaderboards
    skipSuccessfulRequests: false
  },

  // Competitive gaming protections
  COMPETITIVE_ACTIONS: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50, // Limited for competitive integrity
    skipSuccessfulRequests: false
  },

  // Tournament bracket operations
  TOURNAMENT_BRACKETS: {
    windowMs: 60 * 1000, // 1 minute
    max: 40, // Tournament bracket interactions
    skipSuccessfulRequests: false
  }
};

/**
 * User tier multipliers for gaming platform
 */
const GAMING_TIER_MULTIPLIERS = {
  anonymous: 0.5,      // Reduced limits for anonymous users
  registered: 1.0,     // Base limits for registered players
  premium: 2.0,        // 2x limits for premium members
  vip: 3.0,           // 3x limits for VIP members
  tournament: 5.0,     // 5x limits during tournament participation
  clan_leader: 2.5,    // Enhanced limits for clan leaders
  moderator: 8.0,      // High limits for moderators
  admin: 20.0          // Very high limits for admins
};

/**
 * Gaming context detection
 */
class GamingContextDetector {
  static detectGamingSession(req) {
    // Check for gaming session indicators
    const gamingHeaders = [
      'x-gaming-session',
      'x-tournament-mode',
      'x-competitive-mode'
    ];
    
    return gamingHeaders.some(header => req.headers[header]);
  }

  static detectTournamentMode(req) {
    return req.headers['x-tournament-mode'] === 'true' ||
           req.headers['x-tournament-id'] ||
           req.path.includes('/tournaments/');
  }

  static detectCompetitiveMode(req) {
    return req.headers['x-competitive-mode'] === 'true' ||
           this.detectTournamentMode(req) ||
           req.path.includes('/competitive/');
  }

  static detectWeb3Transaction(req) {
    return req.path.includes('/web3/') ||
           req.path.includes('/wallet/') ||
           req.path.includes('/transactions/') ||
           req.body?.transactionId ||
           req.body?.walletAddress;
  }

  static getGamingEndpointType(req) {
    const path = req.path.toLowerCase();
    
    if (path.includes('/voting/')) return 'voting';
    if (path.includes('/clans/')) return 'clan';
    if (path.includes('/chat/')) return 'chat';
    if (path.includes('/leaderboards/')) return 'leaderboard';
    if (path.includes('/tournaments/')) return 'tournament';
    if (path.includes('/web3/') || path.includes('/wallet/')) return 'web3';
    if (path.includes('/competitive/')) return 'competitive';
    
    return 'general';
  }
}

/**
 * Enhanced Redis store for gaming
 */
class GamingRedisStore {
  constructor() {
    this.client = null;
    this.store = null;
    this.isConnected = false;
    this.init();
  }

  async init() {
    try {
      this.client = Redis.createClient(GAMING_RATE_LIMITS.REDIS);
      
      this.client.on('connect', () => {
        console.log('Gaming rate limiter Redis connected');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.error('Gaming rate limiter Redis error:', err);
        this.isConnected = false;
      });

      await this.client.connect();

      this.store = new RedisStore({
        sendCommand: (...args) => this.client.sendCommand(args),
        prefix: GAMING_RATE_LIMITS.REDIS.keyPrefix
      });

    } catch (error) {
      console.warn('Failed to initialize gaming Redis store:', error.message);
    }
  }

  getStore() {
    return this.store;
  }

  isReady() {
    return this.isConnected && this.store;
  }

  // Gaming-specific operations
  async setGamingSession(userId, sessionData) {
    if (!this.isReady()) return false;
    
    try {
      await this.client.setEx(
        `gaming_session:${userId}`,
        300, // 5 minutes TTL
        JSON.stringify(sessionData)
      );
      return true;
    } catch (error) {
      console.error('Failed to set gaming session:', error);
      return false;
    }
  }

  async getGamingSession(userId) {
    if (!this.isReady()) return null;
    
    try {
      const session = await this.client.get(`gaming_session:${userId}`);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Failed to get gaming session:', error);
      return null;
    }
  }

  async markTournamentParticipant(userId, tournamentId) {
    if (!this.isReady()) return false;
    
    try {
      await this.client.setEx(
        `tournament:${tournamentId}:participant:${userId}`,
        3600, // 1 hour TTL
        Date.now().toString()
      );
      return true;
    } catch (error) {
      console.error('Failed to mark tournament participant:', error);
      return false;
    }
  }

  async isTournamentParticipant(userId, tournamentId) {
    if (!this.isReady()) return false;
    
    try {
      const result = await this.client.exists(`tournament:${tournamentId}:participant:${userId}`);
      return result === 1;
    } catch (error) {
      console.error('Failed to check tournament participant:', error);
      return false;
    }
  }
}

// Initialize gaming Redis store
const gamingRedisStore = new GamingRedisStore();

/**
 * Gaming rate limiter factory with enhanced features
 */
class GamingRateLimiterFactory {
  static createGamingLimiter(baseConfig, options = {}) {
    const config = {
      ...baseConfig,
      standardHeaders: true,
      legacyHeaders: false,
      ...options
    };

    // Add Redis store if available
    if (gamingRedisStore.isReady()) {
      config.store = gamingRedisStore.getStore();
    }

    // Gaming-specific key generator
    config.keyGenerator = (req) => {
      const endpointType = GamingContextDetector.getGamingEndpointType(req);
      const baseKey = req.user ? 
        `user:${req.user.id}:${endpointType}` : 
        `ip:${req.ip}:${endpointType}`;

      // Add gaming context modifiers
      const modifiers = [];
      if (GamingContextDetector.detectTournamentMode(req)) {
        modifiers.push('tournament');
      }
      if (GamingContextDetector.detectCompetitiveMode(req)) {
        modifiers.push('competitive');
      }
      if (GamingContextDetector.detectGamingSession(req)) {
        modifiers.push('gaming');
      }

      return modifiers.length > 0 ? 
        `${baseKey}:${modifiers.join(':')}` : 
        baseKey;
    };

    // Gaming-specific skip logic
    config.skip = (req) => {
      // Skip for health checks
      if (req.path === '/api/health' || req.path === '/api/status') {
        return true;
      }

      // Skip for admin bypass
      if (req.user?.roles?.includes('admin') && options.skipAdmin) {
        return true;
      }

      // Skip for emergency maintenance mode
      if (process.env.EMERGENCY_MODE === 'true' && req.user?.roles?.includes('moderator')) {
        return true;
      }

      return false;
    };

    // Gaming-specific message formatting
    config.message = (req, res) => {
      const endpointType = GamingContextDetector.getGamingEndpointType(req);
      
      return {
        error: 'Gaming rate limit exceeded',
        code: `GAMING_RATE_LIMITED_${endpointType.toUpperCase()}`,
        type: endpointType,
        retryAfter: Math.ceil(config.windowMs / 1000),
        message: options.customMessage || 
          `Rate limit exceeded for ${endpointType} operations. Please wait before trying again.`,
        gaming_context: {
          tournament_mode: GamingContextDetector.detectTournamentMode(req),
          competitive_mode: GamingContextDetector.detectCompetitiveMode(req),
          gaming_session: GamingContextDetector.detectGamingSession(req)
        }
      };
    };

    return rateLimit(config);
  }

  static createTieredGamingLimiter(baseConfig, options = {}) {
    return async (req, res, next) => {
      let config = { ...baseConfig };
      const userTier = this.determineUserTier(req);
      const multiplier = GAMING_TIER_MULTIPLIERS[userTier] || 1.0;

      // Apply tier multiplier
      config.max = Math.floor(config.max * multiplier);

      // Tournament mode enhancements
      if (GamingContextDetector.detectTournamentMode(req)) {
        const tournamentId = req.headers['x-tournament-id'];
        if (tournamentId && req.user) {
          const isParticipant = await gamingRedisStore.isTournamentParticipant(
            req.user.id, 
            tournamentId
          );
          if (isParticipant) {
            config.max = Math.floor(config.max * GAMING_TIER_MULTIPLIERS.tournament);
          }
        }
      }

      // Gaming session enhancements
      if (GamingContextDetector.detectGamingSession(req) && req.user) {
        const session = await gamingRedisStore.getGamingSession(req.user.id);
        if (session && session.active) {
          config = { ...config, ...GAMING_RATE_LIMITS.GAMING_SESSION };
          config.max = Math.floor(config.max * multiplier);
        }
      }

      const limiter = this.createGamingLimiter(config, options);
      return limiter(req, res, next);
    };
  }

  static determineUserTier(req) {
    if (!req.user) return 'anonymous';
    
    const roles = req.user.roles || [];
    
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('moderator')) return 'moderator';
    if (roles.includes('clan_leader')) return 'clan_leader';
    if (roles.includes('vip')) return 'vip';
    if (roles.includes('premium')) return 'premium';
    
    return 'registered';
  }
}

/**
 * Gaming endpoint rate limiters
 */
export const gamingRateLimiters = {
  // Voting and burn-to-vote operations
  voting: GamingRateLimiterFactory.createTieredGamingLimiter(
    GAMING_RATE_LIMITS.VOTING_OPERATIONS,
    {
      customMessage: 'Voting rate limit exceeded. Please wait before casting another vote.',
      skipAdmin: false // Enforce voting limits even for admins for fairness
    }
  ),

  // Clan management operations
  clans: GamingRateLimiterFactory.createTieredGamingLimiter(
    GAMING_RATE_LIMITS.CLAN_OPERATIONS,
    {
      customMessage: 'Clan operation rate limit exceeded. Please wait before performing another clan action.',
      skipAdmin: true
    }
  ),

  // Tournament operations
  tournaments: GamingRateLimiterFactory.createTieredGamingLimiter(
    GAMING_RATE_LIMITS.TOURNAMENT_BRACKETS,
    {
      customMessage: 'Tournament operation rate limit exceeded. Please wait before interacting with tournaments again.',
      skipAdmin: true
    }
  ),

  // Leaderboard updates
  leaderboards: GamingRateLimiterFactory.createTieredGamingLimiter(
    GAMING_RATE_LIMITS.LEADERBOARD_UPDATES,
    {
      customMessage: 'Leaderboard update rate limit exceeded. Please wait before updating scores again.',
      skipAdmin: true
    }
  ),

  // Gaming chat and communication
  chat: GamingRateLimiterFactory.createGamingLimiter(
    GAMING_RATE_LIMITS.GAMING_CHAT,
    {
      customMessage: 'Chat rate limit exceeded. Please slow down your messages.',
      skipAdmin: false // Enforce chat limits for everyone
    }
  ),

  // Web3 and wallet operations
  web3: GamingRateLimiterFactory.createTieredGamingLimiter(
    GAMING_RATE_LIMITS.WEB3_TRANSACTIONS,
    {
      customMessage: 'Web3 transaction rate limit exceeded. Please wait before performing another blockchain operation.',
      skipAdmin: true
    }
  ),

  // Competitive gaming operations
  competitive: GamingRateLimiterFactory.createGamingLimiter(
    GAMING_RATE_LIMITS.COMPETITIVE_ACTIONS,
    {
      customMessage: 'Competitive action rate limit exceeded. Please wait before performing another competitive action.',
      skipAdmin: false // Strict limits for competitive integrity
    }
  )
};

/**
 * Gaming session middleware
 */
export const gamingSessionMiddleware = async (req, res, next) => {
  if (req.user && GamingContextDetector.detectGamingSession(req)) {
    const sessionData = {
      userId: req.user.id,
      active: true,
      startTime: Date.now(),
      endpointType: GamingContextDetector.getGamingEndpointType(req),
      tournamentMode: GamingContextDetector.detectTournamentMode(req),
      competitiveMode: GamingContextDetector.detectCompetitiveMode(req)
    };

    await gamingRedisStore.setGamingSession(req.user.id, sessionData);
  }

  next();
};

/**
 * Tournament participant tracking middleware
 */
export const tournamentTrackingMiddleware = async (req, res, next) => {
  const tournamentId = req.headers['x-tournament-id'] || req.params.tournamentId;
  
  if (tournamentId && req.user && GamingContextDetector.detectTournamentMode(req)) {
    await gamingRedisStore.markTournamentParticipant(req.user.id, tournamentId);
  }

  next();
};

/**
 * Abuse prevention middleware for competitive environments
 */
export const competitiveAbusePreventionMiddleware = (req, res, next) => {
  if (GamingContextDetector.detectCompetitiveMode(req)) {
    // Add additional headers for competitive integrity
    res.set({
      'X-Competitive-Mode': 'true',
      'X-Rate-Limit-Enforcement': 'strict',
      'X-Gaming-Integrity': 'protected'
    });

    // Enhanced logging for competitive operations
    console.log(`Competitive operation: ${req.method} ${req.path} - User: ${req.user?.id || 'anonymous'}`);
  }

  next();
};

/**
 * Gaming performance monitoring middleware
 */
export const gamingPerformanceMonitoringMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Track gaming-specific metrics
  const originalSend = res.send;
  res.send = function(data) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Log performance for gaming operations
    if (responseTime > 100) { // Log slow responses
      console.warn(`Slow gaming operation: ${req.method} ${req.path} - ${responseTime}ms`);
    }

    // Track rate limit hits for gaming endpoints
    if (res.statusCode === 429) {
      const endpointType = GamingContextDetector.getGamingEndpointType(req);
      console.warn(`Gaming rate limit hit: ${endpointType} - User: ${req.user?.id || 'anonymous'}`);
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Main gaming rate limiter middleware
 */
export const gamingRateLimiterMiddleware = (endpointType = 'general', options = {}) => {
  return async (req, res, next) => {
    // Apply gaming session tracking
    await gamingSessionMiddleware(req, res, () => {});
    
    // Apply tournament tracking
    await tournamentTrackingMiddleware(req, res, () => {});
    
    // Apply competitive abuse prevention
    competitiveAbusePreventionMiddleware(req, res, () => {});
    
    // Apply performance monitoring
    gamingPerformanceMonitoringMiddleware(req, res, () => {});

    // Determine the appropriate rate limiter
    let limiter;
    
    // Auto-detect endpoint type if not specified
    if (endpointType === 'general') {
      endpointType = GamingContextDetector.getGamingEndpointType(req);
    }

    // Web3 transaction detection
    if (GamingContextDetector.detectWeb3Transaction(req)) {
      endpointType = 'web3';
    }

    // Get the appropriate limiter
    limiter = gamingRateLimiters[endpointType];
    
    if (!limiter) {
      console.warn(`Unknown gaming rate limiter type: ${endpointType}`);
      return next();
    }

    // Apply the rate limiter
    return limiter(req, res, next);
  };
};

/**
 * Gaming rate limit bypass for testing and development
 */
export const gamingRateLimitBypass = (req, res, next) => {
  // Test environment bypass
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  // Development bypass with special header
  if (process.env.NODE_ENV === 'development' && 
      req.headers['x-bypass-gaming-rate-limit'] === 'true') {
    return next();
  }

  // Emergency bypass for critical issues
  if (process.env.EMERGENCY_MODE === 'true' && 
      req.user?.roles?.includes('admin')) {
    return next();
  }

  next();
};

// Export everything
export default {
  gamingRateLimiters,
  gamingRateLimiterMiddleware,
  gamingSessionMiddleware,
  tournamentTrackingMiddleware,
  competitiveAbusePreventionMiddleware,
  gamingPerformanceMonitoringMiddleware,
  gamingRateLimitBypass,
  GamingContextDetector,
  GamingRateLimiterFactory
};