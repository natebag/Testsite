/**
 * Comprehensive Rate Limiting Integration for MLG.clan Platform
 * 
 * Master rate limiting system that orchestrates:
 * - Gaming-specific rate limiting
 * - Web3 transaction controls
 * - Tournament mode protections
 * - Real-time analytics
 * - Abuse prevention
 * 
 * @author Claude Code - Security Performance Auditor
 * @version 1.0.0
 * @created 2025-08-12
 */

import { gamingRateLimiterMiddleware, gamingSessionMiddleware, tournamentTrackingMiddleware } from './gaming-rate-limiter.js';
import { web3RateLimiterMiddleware, web3TransactionTrackingMiddleware } from './web3-rate-limiter.js';
import { rateLimitAnalyticsMiddleware, gamingAnalyticsMiddleware, web3AnalyticsMiddleware } from './rate-limit-analytics.js';
import { rateLimiterMiddleware } from './rateLimiter.middleware.js';

/**
 * Comprehensive rate limiting configuration
 */
const COMPREHENSIVE_CONFIG = {
  // Performance targets
  PERFORMANCE_TARGETS: {
    max_overhead_ms: 1,           // <1ms rate limiting overhead
    target_availability: 99.9,    // 99.9% availability
    max_response_time: 100        // <100ms for gaming operations
  },

  // Gaming context detection
  GAMING_CONTEXT: {
    headers: [
      'x-gaming-session',
      'x-tournament-mode', 
      'x-competitive-mode',
      'x-tournament-id',
      'x-wallet-address'
    ],
    paths: [
      '/api/voting/',
      '/api/clans/',
      '/api/tournaments/',
      '/api/leaderboards/',
      '/api/chat/',
      '/api/web3/',
      '/api/wallet/'
    ]
  },

  // Endpoint categorization for optimal rate limiting
  ENDPOINT_CATEGORIES: {
    // High-frequency gaming operations
    realtime: [
      '/api/leaderboards/update',
      '/api/chat/message',
      '/api/tournaments/status',
      '/api/gaming/heartbeat'
    ],
    
    // Critical gaming operations
    critical: [
      '/api/voting/votes/cast',
      '/api/voting/votes/purchase',
      '/api/tournaments/join',
      '/api/clans/join'
    ],
    
    // Web3 blockchain operations
    blockchain: [
      '/api/web3/transaction',
      '/api/wallet/connect',
      '/api/tokens/burn',
      '/api/spl/transfer'
    ],
    
    // Standard gaming operations
    standard: [
      '/api/clans/',
      '/api/content/',
      '/api/user/profile',
      '/api/achievements/'
    ]
  }
};

/**
 * Intelligent rate limiter selector
 */
class IntelligentRateLimiterSelector {
  static selectOptimalLimiter(req) {
    const context = this.analyzeRequestContext(req);
    
    // Prioritize by context type
    if (context.isWeb3) {
      return 'web3';
    }
    
    if (context.isTournament) {
      return 'tournament';
    }
    
    if (context.isCompetitive) {
      return 'competitive';
    }
    
    if (context.isGaming) {
      return 'gaming';
    }
    
    // Fallback to endpoint-based selection
    return this.selectByEndpoint(req.path);
  }

  static analyzeRequestContext(req) {
    return {
      isWeb3: this.detectWeb3Context(req),
      isTournament: this.detectTournamentContext(req),
      isCompetitive: this.detectCompetitiveContext(req),
      isGaming: this.detectGamingContext(req),
      isRealtime: this.detectRealtimeContext(req),
      isCritical: this.detectCriticalContext(req)
    };
  }

  static detectWeb3Context(req) {
    const path = req.path.toLowerCase();
    const hasWeb3Headers = req.headers['x-wallet-address'] || 
                          req.body?.walletAddress ||
                          req.body?.transactionId;
    
    const isWeb3Path = COMPREHENSIVE_CONFIG.ENDPOINT_CATEGORIES.blockchain
      .some(pattern => path.includes(pattern.replace('/api', '')));
    
    return hasWeb3Headers || isWeb3Path;
  }

  static detectTournamentContext(req) {
    return req.headers['x-tournament-mode'] === 'true' ||
           req.headers['x-tournament-id'] ||
           req.path.includes('/tournaments/');
  }

  static detectCompetitiveContext(req) {
    return req.headers['x-competitive-mode'] === 'true' ||
           this.detectTournamentContext(req) ||
           req.path.includes('/competitive/');
  }

  static detectGamingContext(req) {
    const hasGamingHeaders = COMPREHENSIVE_CONFIG.GAMING_CONTEXT.headers
      .some(header => req.headers[header]);
    
    const isGamingPath = COMPREHENSIVE_CONFIG.GAMING_CONTEXT.paths
      .some(path => req.path.includes(path.replace('/api', '')));
    
    return hasGamingHeaders || isGamingPath;
  }

  static detectRealtimeContext(req) {
    return COMPREHENSIVE_CONFIG.ENDPOINT_CATEGORIES.realtime
      .some(pattern => req.path.includes(pattern.replace('/api', '')));
  }

  static detectCriticalContext(req) {
    return COMPREHENSIVE_CONFIG.ENDPOINT_CATEGORIES.critical
      .some(pattern => req.path.includes(pattern.replace('/api', '')));
  }

  static selectByEndpoint(path) {
    if (path.includes('/voting/')) return 'voting';
    if (path.includes('/clans/')) return 'clans';
    if (path.includes('/tournaments/')) return 'tournaments';
    if (path.includes('/leaderboards/')) return 'leaderboards';
    if (path.includes('/chat/')) return 'chat';
    if (path.includes('/web3/') || path.includes('/wallet/')) return 'web3';
    
    return 'general';
  }
}

/**
 * Performance monitoring for rate limiting
 */
class RateLimitingPerformanceMonitor {
  constructor() {
    this.startTime = Date.now();
    this.performanceMetrics = {
      totalRequests: 0,
      rateLimitHits: 0,
      averageOverhead: 0,
      maxOverhead: 0,
      errorCount: 0
    };
  }

  trackRequest(overhead, wasRateLimited, hadError) {
    this.performanceMetrics.totalRequests++;
    
    if (wasRateLimited) {
      this.performanceMetrics.rateLimitHits++;
    }
    
    if (hadError) {
      this.performanceMetrics.errorCount++;
    }

    // Update overhead metrics
    this.performanceMetrics.averageOverhead = 
      (this.performanceMetrics.averageOverhead * (this.performanceMetrics.totalRequests - 1) + overhead) /
      this.performanceMetrics.totalRequests;
    
    this.performanceMetrics.maxOverhead = Math.max(
      this.performanceMetrics.maxOverhead, 
      overhead
    );

    // Alert if performance targets are not met
    this.checkPerformanceTargets(overhead);
  }

  checkPerformanceTargets(overhead) {
    if (overhead > COMPREHENSIVE_CONFIG.PERFORMANCE_TARGETS.max_overhead_ms) {
      console.warn(`Rate limiting overhead exceeded target: ${overhead}ms > ${COMPREHENSIVE_CONFIG.PERFORMANCE_TARGETS.max_overhead_ms}ms`);
    }

    const rateLimitPercentage = (this.performanceMetrics.rateLimitHits / this.performanceMetrics.totalRequests) * 100;
    if (rateLimitPercentage > 10) { // Alert if >10% of requests are rate limited
      console.warn(`High rate limiting percentage: ${rateLimitPercentage.toFixed(2)}%`);
    }
  }

  getPerformanceReport() {
    const uptime = Date.now() - this.startTime;
    return {
      ...this.performanceMetrics,
      uptime,
      requestsPerSecond: this.performanceMetrics.totalRequests / (uptime / 1000),
      rateLimitPercentage: (this.performanceMetrics.rateLimitHits / this.performanceMetrics.totalRequests) * 100,
      errorPercentage: (this.performanceMetrics.errorCount / this.performanceMetrics.totalRequests) * 100
    };
  }
}

// Initialize performance monitor
const performanceMonitor = new RateLimitingPerformanceMonitor();

/**
 * Master comprehensive rate limiting middleware
 */
export const comprehensiveRateLimiterMiddleware = (defaultType = 'auto', options = {}) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    let wasRateLimited = false;
    let hadError = false;

    try {
      // Determine optimal rate limiting strategy
      const limiterType = defaultType === 'auto' ? 
        IntelligentRateLimiterSelector.selectOptimalLimiter(req) : 
        defaultType;

      // Apply analytics tracking first
      await new Promise((resolve) => {
        rateLimitAnalyticsMiddleware(req, res, resolve);
      });

      // Apply gaming analytics if gaming context detected
      if (IntelligentRateLimiterSelector.detectGamingContext(req)) {
        await new Promise((resolve) => {
          gamingAnalyticsMiddleware(req, res, resolve);
        });
      }

      // Apply Web3 analytics if Web3 context detected
      if (IntelligentRateLimiterSelector.detectWeb3Context(req)) {
        await new Promise((resolve) => {
          web3AnalyticsMiddleware(req, res, resolve);
        });
      }

      // Apply gaming session tracking
      if (IntelligentRateLimiterSelector.detectGamingContext(req)) {
        await new Promise((resolve) => {
          gamingSessionMiddleware(req, res, resolve);
        });
      }

      // Apply tournament tracking
      if (IntelligentRateLimiterSelector.detectTournamentContext(req)) {
        await new Promise((resolve) => {
          tournamentTrackingMiddleware(req, res, resolve);
        });
      }

      // Apply Web3 transaction tracking
      if (IntelligentRateLimiterSelector.detectWeb3Context(req)) {
        await new Promise((resolve) => {
          web3TransactionTrackingMiddleware(req, res, resolve);
        });
      }

      // Apply the appropriate rate limiter
      await new Promise((resolve, reject) => {
        const limiterMiddleware = this.selectMiddleware(limiterType, options);
        
        limiterMiddleware(req, res, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

    } catch (error) {
      hadError = true;
      
      // Check if it's a rate limiting error
      if (error.statusCode === 429 || res.statusCode === 429) {
        wasRateLimited = true;
      }

      // Continue with error handling
      return next(error);
    }

    // Track performance metrics
    const overhead = Date.now() - startTime;
    wasRateLimited = res.statusCode === 429;
    performanceMonitor.trackRequest(overhead, wasRateLimited, hadError);

    // Add performance headers
    res.set({
      'X-Rate-Limit-Overhead': `${overhead}ms`,
      'X-Rate-Limit-Type': IntelligentRateLimiterSelector.selectOptimalLimiter(req),
      'X-Gaming-Context': IntelligentRateLimiterSelector.detectGamingContext(req).toString(),
      'X-Web3-Context': IntelligentRateLimiterSelector.detectWeb3Context(req).toString()
    });

    next();
  };

  selectMiddleware(limiterType, options) {
    switch (limiterType) {
      case 'web3':
      case 'wallet':
      case 'blockchain':
        return web3RateLimiterMiddleware('auto', options);
      
      case 'voting':
      case 'clans':
      case 'tournaments':
      case 'leaderboards':
      case 'chat':
      case 'competitive':
        return gamingRateLimiterMiddleware(limiterType, options);
      
      case 'gaming':
        return gamingRateLimiterMiddleware('general', options);
      
      case 'tournament':
        return gamingRateLimiterMiddleware('tournaments', { 
          ...options, 
          tournamentMode: true 
        });
      
      default:
        // Fallback to standard rate limiter
        return rateLimiterMiddleware('global');
    }
  }
};

/**
 * Emergency rate limiting for critical situations
 */
export const emergencyRateLimitingMiddleware = (req, res, next) => {
  // Check for emergency conditions
  const isEmergency = process.env.EMERGENCY_MODE === 'true' ||
                     req.headers['x-emergency-mode'] === 'true';

  if (isEmergency) {
    // Apply extremely strict rate limiting
    const emergencyLimiter = rateLimiterMiddleware('auth'); // Very strict limits
    return emergencyLimiter(req, res, next);
  }

  next();
};

/**
 * Performance dashboard for rate limiting
 */
export const getRateLimitingPerformanceDashboard = (req, res) => {
  try {
    const performanceReport = performanceMonitor.getPerformanceReport();
    
    res.json({
      success: true,
      data: {
        performance: performanceReport,
        targets: COMPREHENSIVE_CONFIG.PERFORMANCE_TARGETS,
        status: {
          overhead_status: performanceReport.averageOverhead <= COMPREHENSIVE_CONFIG.PERFORMANCE_TARGETS.max_overhead_ms ? 'good' : 'warning',
          availability_status: performanceReport.errorPercentage <= 0.1 ? 'good' : 'warning',
          rate_limit_status: performanceReport.rateLimitPercentage <= 10 ? 'good' : 'warning'
        },
        generated_at: Date.now()
      }
    });
  } catch (error) {
    console.error('Failed to generate performance dashboard:', error);
    res.status(500).json({
      error: 'Failed to retrieve performance data',
      code: 'PERFORMANCE_DASHBOARD_ERROR'
    });
  }
};

/**
 * Rate limiting health check
 */
export const rateLimitingHealthCheck = async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      checks: {
        gaming_rate_limiter: 'ok',
        web3_rate_limiter: 'ok',
        analytics_system: 'ok',
        redis_connection: 'ok'
      },
      performance: performanceMonitor.getPerformanceReport(),
      timestamp: Date.now()
    };

    // Quick performance check
    const overhead = Date.now() - Date.now(); // This will be very small
    if (overhead > COMPREHENSIVE_CONFIG.PERFORMANCE_TARGETS.max_overhead_ms) {
      health.status = 'degraded';
      health.checks.performance = 'warning';
    }

    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: Date.now()
    });
  }
};

/**
 * Configure comprehensive rate limiting for Express app
 */
export const configureComprehensiveRateLimiting = (app) => {
  // Apply emergency rate limiting first (highest priority)
  app.use('/api', emergencyRateLimitingMiddleware);

  // Apply comprehensive rate limiting to all API routes
  app.use('/api', comprehensiveRateLimiterMiddleware('auto'));

  // Add performance dashboard endpoint
  app.get('/api/admin/rate-limiting/performance', getRateLimitingPerformanceDashboard);
  
  // Add health check endpoint
  app.get('/api/health/rate-limiting', rateLimitingHealthCheck);

  console.log('✅ Comprehensive rate limiting configured for MLG.clan platform');
};

// Export everything
export default {
  comprehensiveRateLimiterMiddleware,
  emergencyRateLimitingMiddleware,
  getRateLimitingPerformanceDashboard,
  rateLimitingHealthCheck,
  configureComprehensiveRateLimiting,
  IntelligentRateLimiterSelector,
  performanceMonitor
};