/**
 * Advanced Rate Limiting System for MLG.clan Platform
 * 
 * Multi-tier rate limiting with wallet-based identification, gaming-specific limits,
 * and dynamic adjustment based on user reputation and behavior patterns.
 * 
 * Features:
 * - Wallet-based and IP-based rate limiting
 * - User tier-based limits (basic, premium, VIP)
 * - Gaming-specific rate limiting (votes, content, clan actions)
 * - Dynamic rate adjustment based on reputation
 * - Suspicious activity detection
 * - Performance optimization for gaming operations
 * 
 * @author Claude Code - Security Auditor
 * @version 2.0.0
 * @created 2025-08-11
 */

import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import RedisStore from 'rate-limit-redis';
import Redis from 'redis';
import { randomBytes, createHash } from 'crypto';

/**
 * Advanced Rate Limiting Configuration
 */
const SECURITY_CONFIG = {
  // Redis configuration with security
  REDIS: {
    URL: process.env.REDIS_URL || 'redis://localhost:6379',
    CONNECTION_TIMEOUT: 5000,
    COMMAND_TIMEOUT: 3000,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    // Security settings
    AUTH_TOKEN: process.env.REDIS_AUTH_TOKEN,
    TLS_ENABLED: process.env.REDIS_TLS_ENABLED === 'true'
  },

  // Tier-based rate limits (requests per window)
  TIERS: {
    BASIC: {
      GLOBAL: { windowMs: 15 * 60 * 1000, max: 500 },
      VOTING: { windowMs: 60 * 1000, max: 5 },
      CONTENT: { windowMs: 60 * 60 * 1000, max: 10 },
      CLAN: { windowMs: 5 * 60 * 1000, max: 25 },
      SEARCH: { windowMs: 60 * 1000, max: 15 },
      MLG_BURN: { windowMs: 5 * 60 * 1000, max: 3 }
    },
    PREMIUM: {
      GLOBAL: { windowMs: 15 * 60 * 1000, max: 1500 },
      VOTING: { windowMs: 60 * 1000, max: 15 },
      CONTENT: { windowMs: 60 * 60 * 1000, max: 50 },
      CLAN: { windowMs: 5 * 60 * 1000, max: 100 },
      SEARCH: { windowMs: 60 * 1000, max: 50 },
      MLG_BURN: { windowMs: 5 * 60 * 1000, max: 10 }
    },
    VIP: {
      GLOBAL: { windowMs: 15 * 60 * 1000, max: 5000 },
      VOTING: { windowMs: 60 * 1000, max: 50 },
      CONTENT: { windowMs: 60 * 60 * 1000, max: 200 },
      CLAN: { windowMs: 5 * 60 * 1000, max: 500 },
      SEARCH: { windowMs: 60 * 1000, max: 200 },
      MLG_BURN: { windowMs: 5 * 60 * 1000, max: 50 }
    },
    ADMIN: {
      GLOBAL: { windowMs: 15 * 60 * 1000, max: 10000 },
      VOTING: { windowMs: 60 * 1000, max: 100 },
      CONTENT: { windowMs: 60 * 60 * 1000, max: 1000 },
      CLAN: { windowMs: 5 * 60 * 1000, max: 1000 },
      SEARCH: { windowMs: 60 * 1000, max: 500 },
      MLG_BURN: { windowMs: 5 * 60 * 1000, max: 100 }
    }
  },

  // Gaming-specific limits
  GAMING: {
    // Vote manipulation prevention
    VOTE_PATTERNS: {
      MAX_VOTES_PER_CONTENT: 1,
      MIN_TIME_BETWEEN_VOTES: 30 * 1000, // 30 seconds
      SUSPICIOUS_VOTING_THRESHOLD: 10, // votes per minute
      REPUTATION_MULTIPLIER: 0.1
    },
    
    // Content submission spam prevention
    CONTENT_SUBMISSION: {
      MIN_TIME_BETWEEN_SUBMISSIONS: 5 * 60 * 1000, // 5 minutes
      DUPLICATE_CONTENT_CHECK: true,
      MAX_PENDING_SUBMISSIONS: 5
    },
    
    // Clan action spam prevention
    CLAN_ACTIONS: {
      MAX_INVITES_PER_HOUR: 10,
      MIN_TIME_BETWEEN_APPLICATIONS: 60 * 60 * 1000, // 1 hour
      MAX_ROLE_CHANGES_PER_DAY: 5
    }
  },

  // Security thresholds
  SECURITY: {
    SUSPICIOUS_IP_THRESHOLD: 1000, // requests per hour
    WALLET_SWITCHING_THRESHOLD: 5, // wallet changes per hour
    FAILED_AUTH_THRESHOLD: 10, // failed attempts per hour
    LOCKOUT_DURATION: 60 * 60 * 1000, // 1 hour
    EMERGENCY_THRESHOLD: 10000 // requests per minute for emergency lockdown
  }
};

/**
 * Secure Redis Client with Enhanced Configuration
 */
class SecureRedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = SECURITY_CONFIG.REDIS.MAX_RETRIES;
  }

  async connect() {
    if (this.isConnected) return this.client;

    try {
      const redisConfig = {
        url: SECURITY_CONFIG.REDIS.URL,
        socket: {
          connectTimeout: SECURITY_CONFIG.REDIS.CONNECTION_TIMEOUT,
          commandTimeout: SECURITY_CONFIG.REDIS.COMMAND_TIMEOUT,
          reconnectStrategy: (retries) => {
            if (retries >= this.maxConnectionAttempts) {
              console.error('Redis: Max connection attempts reached');
              return false;
            }
            return Math.min(retries * SECURITY_CONFIG.REDIS.RETRY_DELAY, 5000);
          }
        }
      };

      // Add authentication if configured
      if (SECURITY_CONFIG.REDIS.AUTH_TOKEN) {
        redisConfig.password = SECURITY_CONFIG.REDIS.AUTH_TOKEN;
      }

      // Add TLS if enabled
      if (SECURITY_CONFIG.REDIS.TLS_ENABLED) {
        redisConfig.socket.tls = true;
      }

      this.client = Redis.createClient(redisConfig);

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.isConnected = true;
        this.connectionAttempts = 0;
      });

      this.client.on('disconnect', () => {
        console.warn('Redis Client Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      return this.client;

    } catch (error) {
      console.error('Failed to connect to Redis:', error.message);
      this.connectionAttempts++;
      this.isConnected = false;
      return null;
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  getClient() {
    return this.isConnected ? this.client : null;
  }
}

// Initialize secure Redis client
const secureRedisClient = new SecureRedisClient();

/**
 * Advanced Rate Limiter Class
 */
class AdvancedRateLimiter {
  constructor() {
    this.redisStore = null;
    this.suspiciousIPs = new Map();
    this.walletAnalytics = new Map();
    this.emergencyMode = false;
    this.initializeRedisStore();
  }

  async initializeRedisStore() {
    try {
      const redisClient = await secureRedisClient.connect();
      if (redisClient) {
        this.redisStore = new RedisStore({
          sendCommand: (...args) => redisClient.sendCommand(args),
          prefix: 'mlg_rl:',
        });
        console.log('Advanced Rate Limiter: Redis store initialized');
      }
    } catch (error) {
      console.warn('Advanced Rate Limiter: Failed to initialize Redis store:', error.message);
    }
  }

  /**
   * Generate secure key for rate limiting
   */
  generateSecureKey(req, context = '') {
    const components = [];
    
    // Add user identifier (wallet preferred over user ID)
    if (req.user?.walletAddress) {
      components.push(`wallet:${req.user.walletAddress}`);
    } else if (req.user?.id) {
      components.push(`user:${req.user.id}`);
    } else {
      // Hash IP for anonymity while maintaining uniqueness
      const ipHash = createHash('sha256').update(req.ip + process.env.RATE_LIMIT_SALT).digest('hex');
      components.push(`ip:${ipHash.substring(0, 16)}`);
    }
    
    // Add context (endpoint, action type)
    if (context) {
      components.push(`ctx:${context}`);
    }
    
    // Add route path
    const routePath = req.route?.path || req.path || 'unknown';
    components.push(`route:${routePath}`);
    
    return components.join(':');
  }

  /**
   * Determine user tier based on roles and reputation
   */
  getUserTier(req) {
    if (!req.user) return 'BASIC';
    
    const roles = req.user.roles || [];
    const reputation = req.user.reputation || 0;
    
    if (roles.includes('admin') || roles.includes('owner')) {
      return 'ADMIN';
    } else if (roles.includes('vip') || reputation > 1000) {
      return 'VIP';
    } else if (roles.includes('premium') || reputation > 100) {
      return 'PREMIUM';
    }
    
    return 'BASIC';
  }

  /**
   * Check for suspicious voting patterns
   */
  async checkVotingPatterns(req) {
    const walletAddress = req.user?.walletAddress;
    if (!walletAddress) return false;

    const key = `vote_pattern:${walletAddress}`;
    const now = Date.now();
    
    try {
      const redisClient = secureRedisClient.getClient();
      if (!redisClient) return false;

      // Get recent votes
      const recentVotes = await redisClient.lRange(key, 0, -1);
      const validVotes = recentVotes
        .map(vote => parseInt(vote))
        .filter(timestamp => now - timestamp < 60 * 1000); // Last minute

      // Check suspicious patterns
      if (validVotes.length >= SECURITY_CONFIG.GAMING.VOTE_PATTERNS.SUSPICIOUS_VOTING_THRESHOLD) {
        console.warn(`Suspicious voting pattern detected: ${walletAddress}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking voting patterns:', error);
      return false;
    }
  }

  /**
   * Track voting activity
   */
  async trackVotingActivity(req) {
    const walletAddress = req.user?.walletAddress;
    if (!walletAddress) return;

    const key = `vote_pattern:${walletAddress}`;
    const now = Date.now();
    
    try {
      const redisClient = secureRedisClient.getClient();
      if (!redisClient) return;

      // Add current vote timestamp
      await redisClient.lPush(key, now.toString());
      
      // Keep only recent votes (last hour)
      const oneHourAgo = now - 60 * 60 * 1000;
      await redisClient.lTrim(key, 0, 100); // Limit list size
      
      // Remove old entries
      const votes = await redisClient.lRange(key, 0, -1);
      const validVotes = votes.filter(vote => parseInt(vote) > oneHourAgo);
      
      await redisClient.del(key);
      if (validVotes.length > 0) {
        await redisClient.lPush(key, ...validVotes);
      }
      
      // Set expiry
      await redisClient.expire(key, 3600); // 1 hour
      
    } catch (error) {
      console.error('Error tracking voting activity:', error);
    }
  }

  /**
   * Check for wallet switching abuse
   */
  async checkWalletSwitching(req) {
    const ip = req.ip;
    const walletAddress = req.user?.walletAddress;
    
    if (!ip || !walletAddress) return false;

    const key = `wallet_switch:${ip}`;
    const now = Date.now();
    
    try {
      const redisClient = secureRedisClient.getClient();
      if (!redisClient) return false;

      // Get recent wallet switches for this IP
      const switches = await redisClient.hGetAll(key);
      const recentSwitches = Object.entries(switches)
        .filter(([timestamp]) => now - parseInt(timestamp) < 60 * 60 * 1000) // Last hour
        .map(([, wallet]) => wallet);

      const uniqueWallets = new Set(recentSwitches);
      
      if (uniqueWallets.size >= SECURITY_CONFIG.SECURITY.WALLET_SWITCHING_THRESHOLD) {
        console.warn(`Suspicious wallet switching detected: IP ${ip}`);
        return true;
      }

      // Track current wallet
      await redisClient.hSet(key, now.toString(), walletAddress);
      await redisClient.expire(key, 3600); // 1 hour

      return false;
    } catch (error) {
      console.error('Error checking wallet switching:', error);
      return false;
    }
  }

  /**
   * Create gaming-specific rate limiter
   */
  createGamingRateLimiter(type, options = {}) {
    const baseLimiterConfig = {
      windowMs: 60 * 1000, // Default 1 minute
      max: 10, // Default max requests
      standardHeaders: true,
      legacyHeaders: false,
      ...options
    };

    // Add Redis store if available
    if (this.redisStore) {
      baseLimiterConfig.store = this.redisStore;
    }

    // Custom key generator with security enhancements
    baseLimiterConfig.keyGenerator = (req) => {
      return this.generateSecureKey(req, type);
    };

    // Enhanced skip function with security checks
    baseLimiterConfig.skip = async (req) => {
      // Emergency mode - block most requests
      if (this.emergencyMode && type !== 'health') {
        return false; // Don't skip, apply rate limiting
      }

      // Health check bypass
      if (req.path === '/api/health' || req.path === '/api/status') {
        return true;
      }

      // Admin bypass with additional security
      if (req.user?.roles?.includes('admin') && options.allowAdminBypass) {
        // Still check for admin abuse
        const adminKey = `admin_activity:${req.user.id}`;
        const redisClient = secureRedisClient.getClient();
        if (redisClient) {
          try {
            const count = await redisClient.incr(adminKey);
            await redisClient.expire(adminKey, 300); // 5 minutes
            
            if (count > 1000) { // Admin abuse threshold
              console.warn(`Admin rate limit abuse detected: ${req.user.id}`);
              return false;
            }
          } catch (error) {
            console.error('Error checking admin activity:', error);
          }
        }
        return true;
      }

      return false;
    };

    // Custom handler for rate limit exceeded
    baseLimiterConfig.handler = async (req, res) => {
      // Log suspicious activity
      this.logSuspiciousActivity(req, type);

      // Gaming-specific responses
      let message = 'Rate limit exceeded';
      let code = 'RATE_LIMITED';

      switch (type) {
        case 'voting':
          message = 'Voting too quickly. Please wait before voting again.';
          code = 'VOTING_RATE_LIMITED';
          break;
        case 'content':
          message = 'Content submission limit reached. Please wait before submitting more.';
          code = 'CONTENT_RATE_LIMITED';
          break;
        case 'clan':
          message = 'Too many clan actions. Please slow down.';
          code = 'CLAN_RATE_LIMITED';
          break;
        case 'mlg_burn':
          message = 'MLG token burn limit exceeded. Please wait before burning more tokens.';
          code = 'MLG_BURN_RATE_LIMITED';
          break;
      }

      res.status(429).json({
        error: message,
        code: code,
        type: type,
        retryAfter: Math.ceil(baseLimiterConfig.windowMs / 1000),
        timestamp: new Date().toISOString()
      });
    };

    return rateLimit(baseLimiterConfig);
  }

  /**
   * Create tiered rate limiter that adapts to user status
   */
  createTieredRateLimiter(limitType) {
    return async (req, res, next) => {
      try {
        // Check for emergency mode
        if (this.emergencyMode && limitType !== 'health') {
          return res.status(503).json({
            error: 'Service temporarily unavailable due to high load',
            code: 'EMERGENCY_MODE',
            retryAfter: 300
          });
        }

        // Determine user tier
        const userTier = this.getUserTier(req);
        const tierConfig = SECURITY_CONFIG.TIERS[userTier][limitType.toUpperCase()];

        if (!tierConfig) {
          console.warn(`Unknown limit type: ${limitType}`);
          return next();
        }

        // Gaming-specific security checks
        if (limitType === 'voting') {
          const isSuspicious = await this.checkVotingPatterns(req);
          if (isSuspicious) {
            return res.status(429).json({
              error: 'Suspicious voting pattern detected',
              code: 'VOTING_PATTERN_BLOCKED',
              retryAfter: 300
            });
          }
        }

        // Check wallet switching abuse
        const isWalletAbuse = await this.checkWalletSwitching(req);
        if (isWalletAbuse) {
          return res.status(429).json({
            error: 'Too many wallet switches detected',
            code: 'WALLET_ABUSE_BLOCKED',
            retryAfter: 3600
          });
        }

        // Create dynamic rate limiter with tier-specific config
        const dynamicLimiter = this.createGamingRateLimiter(limitType, {
          windowMs: tierConfig.windowMs,
          max: tierConfig.max,
          allowAdminBypass: limitType !== 'voting' // No admin bypass for voting
        });

        // Apply the rate limiter
        dynamicLimiter(req, res, (error) => {
          if (error) {
            console.error(`Rate limiter error for ${limitType}:`, error);
          }
          
          // Track voting activity after successful rate limit check
          if (limitType === 'voting' && req.method === 'POST') {
            this.trackVotingActivity(req);
          }
          
          next(error);
        });

      } catch (error) {
        console.error(`Tiered rate limiter error:`, error);
        next();
      }
    };
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(req, type) {
    const activity = {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      walletAddress: req.user?.walletAddress,
      type: type,
      path: req.path,
      method: req.method
    };

    console.warn('Suspicious activity detected:', JSON.stringify(activity));

    // Store in Redis for analysis
    const redisClient = secureRedisClient.getClient();
    if (redisClient) {
      const key = `suspicious:${Date.now()}:${req.ip}`;
      redisClient.setEx(key, 86400, JSON.stringify(activity)); // Store for 24 hours
    }
  }

  /**
   * Emergency lockdown mode
   */
  activateEmergencyMode(duration = 5 * 60 * 1000) { // 5 minutes default
    console.warn('EMERGENCY MODE ACTIVATED');
    this.emergencyMode = true;
    
    setTimeout(() => {
      this.emergencyMode = false;
      console.log('Emergency mode deactivated');
    }, duration);
  }

  /**
   * Check if emergency lockdown should be triggered
   */
  async checkEmergencyThreshold(req) {
    const key = 'emergency_counter';
    const redisClient = secureRedisClient.getClient();
    
    if (!redisClient) return;

    try {
      const count = await redisClient.incr(key);
      await redisClient.expire(key, 60); // 1 minute window
      
      if (count >= SECURITY_CONFIG.SECURITY.EMERGENCY_THRESHOLD) {
        this.activateEmergencyMode(10 * 60 * 1000); // 10 minutes
      }
    } catch (error) {
      console.error('Error checking emergency threshold:', error);
    }
  }
}

// Initialize the advanced rate limiter
const advancedRateLimiter = new AdvancedRateLimiter();

/**
 * Export rate limiting middleware functions
 */
export const rateLimiters = {
  // Global rate limiter with tier support
  global: advancedRateLimiter.createTieredRateLimiter('global'),
  
  // Gaming-specific rate limiters
  voting: advancedRateLimiter.createTieredRateLimiter('voting'),
  content: advancedRateLimiter.createTieredRateLimiter('content'),
  clan: advancedRateLimiter.createTieredRateLimiter('clan'),
  search: advancedRateLimiter.createTieredRateLimiter('search'),
  mlgBurn: advancedRateLimiter.createTieredRateLimiter('mlg_burn'),
  
  // Special limiters
  emergency: (req, res, next) => {
    if (advancedRateLimiter.emergencyMode) {
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        code: 'EMERGENCY_MODE',
        retryAfter: 300
      });
    }
    next();
  }
};

/**
 * Middleware to check and increment emergency counter
 */
export const emergencyMonitor = async (req, res, next) => {
  await advancedRateLimiter.checkEmergencyThreshold(req);
  next();
};

/**
 * Get rate limiter instance for testing and management
 */
export const getRateLimiterInstance = () => advancedRateLimiter;

/**
 * Cleanup function for graceful shutdown
 */
export const cleanup = async () => {
  await secureRedisClient.disconnect();
};

export default {
  rateLimiters,
  emergencyMonitor,
  getRateLimiterInstance,
  cleanup
};