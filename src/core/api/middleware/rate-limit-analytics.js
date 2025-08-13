/**
 * Rate Limiting Analytics and Monitoring System
 * 
 * Comprehensive analytics for rate limiting across the MLG.clan platform:
 * - Real-time rate limit monitoring
 * - Gaming performance metrics
 * - Abuse pattern detection
 * - Tournament analytics
 * - Web3 transaction monitoring
 * 
 * @author Claude Code - Security Performance Auditor
 * @version 1.0.0
 * @created 2025-08-12
 */

import Redis from 'redis';
import { EventEmitter } from 'events';

/**
 * Rate limit analytics configuration
 */
const ANALYTICS_CONFIG = {
  // Redis configuration for analytics
  REDIS: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    database: process.env.REDIS_ANALYTICS_DB || 3,
    keyPrefix: 'mlg_analytics:',
    retentionPeriods: {
      realtime: 300,      // 5 minutes
      hourly: 86400,      // 24 hours
      daily: 2592000,     // 30 days
      weekly: 7776000     // 90 days
    }
  },

  // Metrics collection intervals
  COLLECTION_INTERVALS: {
    realtime: 10000,    // 10 seconds
    aggregation: 60000, // 1 minute
    cleanup: 3600000    // 1 hour
  },

  // Alert thresholds
  ALERT_THRESHOLDS: {
    rate_limit_percentage: 80,    // Alert when 80% of rate limit reached
    failure_rate: 20,             // Alert when failure rate > 20%
    response_time: 1000,          // Alert when response time > 1s
    concurrent_violations: 10,     // Alert when 10+ violations simultaneously
    gaming_abuse_score: 100       // Gaming-specific abuse detection threshold
  },

  // Gaming-specific monitoring
  GAMING_METRICS: {
    session_duration: true,
    tournament_performance: true,
    competitive_integrity: true,
    web3_transaction_health: true,
    real_time_gaming_latency: true
  }
};

/**
 * Rate limit analytics event emitter
 */
class RateLimitAnalyticsEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50); // Support many listeners
  }
}

const analyticsEmitter = new RateLimitAnalyticsEmitter();

/**
 * Redis analytics store
 */
class AnalyticsRedisStore {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.init();
  }

  async init() {
    try {
      this.client = Redis.createClient({
        url: ANALYTICS_CONFIG.REDIS.url,
        socket: {
          connectTimeout: 5000,
          lazyConnect: true
        },
        database: ANALYTICS_CONFIG.REDIS.database
      });

      this.client.on('connect', () => {
        console.log('Rate limit analytics Redis connected');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.error('Rate limit analytics Redis error:', err);
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.warn('Failed to initialize analytics Redis store:', error.message);
    }
  }

  isReady() {
    return this.isConnected && this.client;
  }

  // Record rate limit event
  async recordRateLimitEvent(eventData) {
    if (!this.isReady()) return false;

    try {
      const timestamp = Date.now();
      const key = `rate_limit_events:${eventData.endpoint_type}:${timestamp}`;
      
      await this.client.setEx(
        key,
        ANALYTICS_CONFIG.REDIS.retentionPeriods.realtime,
        JSON.stringify({
          ...eventData,
          timestamp
        })
      );

      // Add to time series for aggregation
      await this.addToTimeSeries('rate_limit_hits', eventData.endpoint_type, 1);
      
      return true;
    } catch (error) {
      console.error('Failed to record rate limit event:', error);
      return false;
    }
  }

  // Record performance metrics
  async recordPerformanceMetric(metricType, value, tags = {}) {
    if (!this.isReady()) return false;

    try {
      const timestamp = Date.now();
      const key = `performance:${metricType}:${timestamp}`;
      
      await this.client.setEx(
        key,
        ANALYTICS_CONFIG.REDIS.retentionPeriods.hourly,
        JSON.stringify({
          metric_type: metricType,
          value,
          tags,
          timestamp
        })
      );

      // Add to time series
      await this.addToTimeSeries('performance', metricType, value);
      
      return true;
    } catch (error) {
      console.error('Failed to record performance metric:', error);
      return false;
    }
  }

  // Add to time series data
  async addToTimeSeries(seriesType, subType, value) {
    if (!this.isReady()) return false;

    try {
      const minute = Math.floor(Date.now() / 60000) * 60000;
      const key = `timeseries:${seriesType}:${subType}:${minute}`;
      
      await this.client.incrByFloat(key, value);
      await this.client.expire(key, ANALYTICS_CONFIG.REDIS.retentionPeriods.daily);
      
      return true;
    } catch (error) {
      console.error('Failed to add to time series:', error);
      return false;
    }
  }

  // Get time series data
  async getTimeSeries(seriesType, subType, startTime, endTime) {
    if (!this.isReady()) return [];

    try {
      const keys = [];
      for (let time = startTime; time <= endTime; time += 60000) {
        keys.push(`timeseries:${seriesType}:${subType}:${time}`);
      }

      const values = await this.client.mGet(keys);
      
      return keys.map((key, index) => ({
        timestamp: parseInt(key.split(':').pop()),
        value: parseFloat(values[index]) || 0
      }));
    } catch (error) {
      console.error('Failed to get time series data:', error);
      return [];
    }
  }

  // Record gaming session metrics
  async recordGamingSession(sessionData) {
    if (!this.isReady()) return false;

    try {
      const key = `gaming_session:${sessionData.userId}:${sessionData.sessionId}`;
      
      await this.client.setEx(
        key,
        ANALYTICS_CONFIG.REDIS.retentionPeriods.daily,
        JSON.stringify(sessionData)
      );

      // Track gaming metrics
      await this.addToTimeSeries('gaming_sessions', 'count', 1);
      await this.addToTimeSeries('gaming_sessions', 'duration', sessionData.duration || 0);
      
      return true;
    } catch (error) {
      console.error('Failed to record gaming session:', error);
      return false;
    }
  }

  // Record tournament metrics
  async recordTournamentMetric(tournamentId, metricType, value, userId = null) {
    if (!this.isReady()) return false;

    try {
      const timestamp = Date.now();
      const key = `tournament:${tournamentId}:${metricType}:${timestamp}`;
      
      await this.client.setEx(
        key,
        ANALYTICS_CONFIG.REDIS.retentionPeriods.weekly,
        JSON.stringify({
          tournament_id: tournamentId,
          metric_type: metricType,
          value,
          user_id: userId,
          timestamp
        })
      );

      // Add to tournament time series
      await this.addToTimeSeries('tournament', `${tournamentId}:${metricType}`, value);
      
      return true;
    } catch (error) {
      console.error('Failed to record tournament metric:', error);
      return false;
    }
  }

  // Get real-time analytics dashboard data
  async getDashboardData(timeRange = 300000) { // 5 minutes default
    if (!this.isReady()) return {};

    try {
      const endTime = Date.now();
      const startTime = endTime - timeRange;
      
      // Get various metrics
      const rateLimitHits = await this.getTimeSeries('rate_limit_hits', '*', startTime, endTime);
      const performanceMetrics = await this.getTimeSeries('performance', '*', startTime, endTime);
      const gamingSessions = await this.getTimeSeries('gaming_sessions', 'count', startTime, endTime);
      
      return {
        time_range: { start: startTime, end: endTime },
        rate_limit_hits: rateLimitHits,
        performance_metrics: performanceMetrics,
        gaming_sessions: gamingSessions,
        generated_at: Date.now()
      };
    } catch (error) {
      console.error('Failed to get dashboard data:', error);
      return {};
    }
  }
}

// Initialize analytics store
const analyticsStore = new AnalyticsRedisStore();

/**
 * Rate limit analytics collector
 */
class RateLimitAnalyticsCollector {
  constructor() {
    this.startTime = Date.now();
    this.requestCount = 0;
    this.rateLimitCount = 0;
    this.errorCount = 0;
    this.performanceData = new Map();
    
    // Start collection intervals
    this.startCollectionIntervals();
  }

  startCollectionIntervals() {
    // Real-time metrics collection
    setInterval(() => {
      this.collectRealtimeMetrics();
    }, ANALYTICS_CONFIG.COLLECTION_INTERVALS.realtime);

    // Aggregated metrics collection
    setInterval(() => {
      this.aggregateMetrics();
    }, ANALYTICS_CONFIG.COLLECTION_INTERVALS.aggregation);

    // Cleanup old data
    setInterval(() => {
      this.cleanupOldData();
    }, ANALYTICS_CONFIG.COLLECTION_INTERVALS.cleanup);
  }

  collectRealtimeMetrics() {
    const now = Date.now();
    const uptime = now - this.startTime;
    
    // Emit real-time metrics
    analyticsEmitter.emit('realtime_metrics', {
      timestamp: now,
      uptime,
      requests_per_second: this.requestCount / (uptime / 1000),
      rate_limit_percentage: (this.rateLimitCount / this.requestCount) * 100,
      error_percentage: (this.errorCount / this.requestCount) * 100
    });
  }

  aggregateMetrics() {
    // Calculate aggregated metrics
    const metrics = {
      total_requests: this.requestCount,
      total_rate_limits: this.rateLimitCount,
      total_errors: this.errorCount,
      average_response_time: this.calculateAverageResponseTime(),
      endpoint_breakdown: this.getEndpointBreakdown()
    };

    analyticsEmitter.emit('aggregated_metrics', metrics);
  }

  calculateAverageResponseTime() {
    if (this.performanceData.size === 0) return 0;
    
    let total = 0;
    let count = 0;
    
    for (const [endpoint, times] of this.performanceData) {
      total += times.reduce((sum, time) => sum + time, 0);
      count += times.length;
    }
    
    return count > 0 ? total / count : 0;
  }

  getEndpointBreakdown() {
    const breakdown = {};
    
    for (const [endpoint, times] of this.performanceData) {
      breakdown[endpoint] = {
        request_count: times.length,
        average_time: times.reduce((sum, time) => sum + time, 0) / times.length,
        max_time: Math.max(...times),
        min_time: Math.min(...times)
      };
    }
    
    return breakdown;
  }

  cleanupOldData() {
    // Clean up in-memory performance data
    const cutoffTime = Date.now() - 3600000; // 1 hour
    
    for (const [endpoint, times] of this.performanceData) {
      // Keep only recent data (this is simplified - in reality you'd store timestamps)
      if (times.length > 1000) {
        this.performanceData.set(endpoint, times.slice(-500));
      }
    }
  }

  // Record request metrics
  recordRequest(endpoint, responseTime, statusCode) {
    this.requestCount++;
    
    if (statusCode === 429) {
      this.rateLimitCount++;
    }
    
    if (statusCode >= 400) {
      this.errorCount++;
    }

    // Store performance data
    if (!this.performanceData.has(endpoint)) {
      this.performanceData.set(endpoint, []);
    }
    this.performanceData.get(endpoint).push(responseTime);

    // Emit individual request event
    analyticsEmitter.emit('request_recorded', {
      endpoint,
      response_time: responseTime,
      status_code: statusCode,
      timestamp: Date.now()
    });
  }
}

// Initialize analytics collector
const analyticsCollector = new RateLimitAnalyticsCollector();

/**
 * Gaming-specific analytics tracker
 */
class GamingAnalyticsTracker {
  constructor() {
    this.activeSessions = new Map();
    this.tournamentMetrics = new Map();
    this.competitiveEvents = [];
    this.web3TransactionMetrics = new Map();
  }

  // Track gaming session
  trackGamingSession(userId, sessionData) {
    this.activeSessions.set(userId, {
      ...sessionData,
      start_time: Date.now(),
      request_count: 0,
      rate_limit_hits: 0
    });

    analyticsStore.recordGamingSession({
      userId,
      sessionId: sessionData.sessionId || `session_${Date.now()}`,
      ...sessionData
    });
  }

  // Update gaming session metrics
  updateGamingSession(userId, updateData) {
    const session = this.activeSessions.get(userId);
    if (session) {
      Object.assign(session, updateData);
      session.request_count = (session.request_count || 0) + 1;
    }
  }

  // Track tournament participation
  trackTournamentParticipation(userId, tournamentId, action, metadata = {}) {
    const key = `${tournamentId}:${userId}`;
    
    if (!this.tournamentMetrics.has(key)) {
      this.tournamentMetrics.set(key, {
        tournament_id: tournamentId,
        user_id: userId,
        actions: [],
        rate_limit_hits: 0,
        performance_score: 100
      });
    }

    const metrics = this.tournamentMetrics.get(key);
    metrics.actions.push({
      action,
      timestamp: Date.now(),
      metadata
    });

    analyticsStore.recordTournamentMetric(tournamentId, action, 1, userId);
  }

  // Track competitive integrity events
  trackCompetitiveEvent(eventType, data) {
    const event = {
      event_type: eventType,
      timestamp: Date.now(),
      data
    };

    this.competitiveEvents.push(event);
    
    // Keep only recent events
    if (this.competitiveEvents.length > 1000) {
      this.competitiveEvents = this.competitiveEvents.slice(-500);
    }

    analyticsEmitter.emit('competitive_event', event);
  }

  // Track Web3 transaction metrics
  trackWeb3Transaction(walletAddress, operation, success, responseTime) {
    if (!this.web3TransactionMetrics.has(walletAddress)) {
      this.web3TransactionMetrics.set(walletAddress, {
        total_transactions: 0,
        successful_transactions: 0,
        failed_transactions: 0,
        average_response_time: 0,
        operations: new Map()
      });
    }

    const metrics = this.web3TransactionMetrics.get(walletAddress);
    metrics.total_transactions++;
    
    if (success) {
      metrics.successful_transactions++;
    } else {
      metrics.failed_transactions++;
    }

    // Update average response time
    metrics.average_response_time = (
      (metrics.average_response_time * (metrics.total_transactions - 1) + responseTime) /
      metrics.total_transactions
    );

    // Track operation-specific metrics
    if (!metrics.operations.has(operation)) {
      metrics.operations.set(operation, { count: 0, success_rate: 0 });
    }
    
    const opMetrics = metrics.operations.get(operation);
    opMetrics.count++;
    opMetrics.success_rate = success ? 
      ((opMetrics.success_rate * (opMetrics.count - 1)) + (success ? 1 : 0)) / opMetrics.count :
      opMetrics.success_rate;
  }

  // Get gaming analytics summary
  getGamingAnalyticsSummary() {
    return {
      active_gaming_sessions: this.activeSessions.size,
      active_tournaments: this.tournamentMetrics.size,
      recent_competitive_events: this.competitiveEvents.slice(-10),
      web3_wallet_count: this.web3TransactionMetrics.size,
      generated_at: Date.now()
    };
  }
}

// Initialize gaming analytics tracker
const gamingTracker = new GamingAnalyticsTracker();

/**
 * Abuse detection system
 */
class AbuseDetectionSystem {
  constructor() {
    this.suspiciousPatterns = new Map();
    this.abuseScores = new Map();
    this.alertThresholds = ANALYTICS_CONFIG.ALERT_THRESHOLDS;
  }

  // Analyze request pattern for abuse
  analyzeRequestPattern(userId, endpoint, timestamp) {
    const key = `${userId}:${endpoint}`;
    
    if (!this.suspiciousPatterns.has(key)) {
      this.suspiciousPatterns.set(key, []);
    }

    const patterns = this.suspiciousPatterns.get(key);
    patterns.push(timestamp);

    // Keep only recent patterns (last hour)
    const cutoff = timestamp - 3600000;
    const recentPatterns = patterns.filter(t => t > cutoff);
    this.suspiciousPatterns.set(key, recentPatterns);

    // Calculate abuse score
    const abuseScore = this.calculateAbuseScore(recentPatterns);
    this.abuseScores.set(key, abuseScore);

    // Check for alerts
    if (abuseScore > this.alertThresholds.gaming_abuse_score) {
      this.triggerAbuseAlert(userId, endpoint, abuseScore);
    }

    return abuseScore;
  }

  calculateAbuseScore(patterns) {
    if (patterns.length < 2) return 0;

    let score = 0;
    
    // High frequency penalty
    const frequency = patterns.length / (3600000 / 60000); // requests per minute
    if (frequency > 100) score += 50;
    else if (frequency > 50) score += 25;

    // Regularity penalty (bot-like behavior)
    const intervals = [];
    for (let i = 1; i < patterns.length; i++) {
      intervals.push(patterns[i] - patterns[i-1]);
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    
    // Low variance indicates bot-like regularity
    if (variance < 1000) score += 30; // Very regular
    else if (variance < 10000) score += 15; // Somewhat regular

    return Math.min(score, 100); // Cap at 100
  }

  triggerAbuseAlert(userId, endpoint, score) {
    const alert = {
      type: 'abuse_detection',
      user_id: userId,
      endpoint,
      abuse_score: score,
      timestamp: Date.now(),
      severity: score > 80 ? 'high' : 'medium'
    };

    analyticsEmitter.emit('abuse_alert', alert);
    console.warn(`Abuse detected: User ${userId} - Endpoint ${endpoint} - Score ${score}`);
  }
}

// Initialize abuse detection
const abuseDetection = new AbuseDetectionSystem();

/**
 * Main analytics middleware
 */
export const rateLimitAnalyticsMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const endpoint = req.path;
  const userId = req.user?.id;

  // Track request start
  if (userId) {
    gamingTracker.updateGamingSession(userId, { last_request: startTime });
    abuseDetection.analyzeRequestPattern(userId, endpoint, startTime);
  }

  // Monitor response
  const originalSend = res.send;
  res.send = function(data) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const statusCode = res.statusCode;

    // Record analytics
    analyticsCollector.recordRequest(endpoint, responseTime, statusCode);

    // Record rate limit events
    if (statusCode === 429) {
      analyticsStore.recordRateLimitEvent({
        endpoint,
        endpoint_type: endpoint.split('/')[2] || 'unknown',
        user_id: userId,
        ip_address: req.ip,
        response_time: responseTime,
        user_agent: req.get('User-Agent'),
        rate_limit_type: res.get('X-RateLimit-Type') || 'unknown'
      });

      // Update gaming session metrics
      if (userId) {
        gamingTracker.updateGamingSession(userId, { 
          rate_limit_hits: (gamingTracker.activeSessions.get(userId)?.rate_limit_hits || 0) + 1 
        });
      }
    }

    // Record performance metrics
    analyticsStore.recordPerformanceMetric('response_time', responseTime, {
      endpoint,
      status_code: statusCode,
      user_id: userId
    });

    // Performance alerts
    if (responseTime > ANALYTICS_CONFIG.ALERT_THRESHOLDS.response_time) {
      analyticsEmitter.emit('performance_alert', {
        type: 'slow_response',
        endpoint,
        response_time: responseTime,
        user_id: userId,
        timestamp: endTime
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Gaming analytics middleware
 */
export const gamingAnalyticsMiddleware = (req, res, next) => {
  const userId = req.user?.id;
  
  // Track gaming session if detected
  if (userId && req.headers['x-gaming-session']) {
    gamingTracker.trackGamingSession(userId, {
      sessionId: req.headers['x-gaming-session'],
      tournament_mode: req.headers['x-tournament-mode'] === 'true',
      competitive_mode: req.headers['x-competitive-mode'] === 'true'
    });
  }

  // Track tournament participation
  const tournamentId = req.headers['x-tournament-id'];
  if (userId && tournamentId) {
    gamingTracker.trackTournamentParticipation(userId, tournamentId, req.method, {
      endpoint: req.path,
      timestamp: Date.now()
    });
  }

  // Track competitive events
  if (req.headers['x-competitive-mode'] === 'true') {
    gamingTracker.trackCompetitiveEvent('competitive_request', {
      user_id: userId,
      endpoint: req.path,
      method: req.method
    });
  }

  next();
};

/**
 * Web3 analytics middleware
 */
export const web3AnalyticsMiddleware = (req, res, next) => {
  const walletAddress = req.body?.walletAddress || req.headers['x-wallet-address'];
  
  if (walletAddress) {
    const startTime = Date.now();
    
    const originalSend = res.send;
    res.send = function(data) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const success = res.statusCode >= 200 && res.statusCode < 300;
      
      // Extract operation type from path
      const operation = req.path.split('/').pop() || 'unknown';
      
      gamingTracker.trackWeb3Transaction(walletAddress, operation, success, responseTime);
      
      return originalSend.call(this, data);
    };
  }

  next();
};

/**
 * Get analytics dashboard
 */
export const getAnalyticsDashboard = async (req, res) => {
  try {
    const timeRange = parseInt(req.query.timeRange) || 300000; // 5 minutes default
    
    const [dashboardData, gamingSummary] = await Promise.all([
      analyticsStore.getDashboardData(timeRange),
      Promise.resolve(gamingTracker.getGamingAnalyticsSummary())
    ]);

    res.json({
      success: true,
      data: {
        ...dashboardData,
        gaming_analytics: gamingSummary,
        abuse_detection: {
          active_patterns: abuseDetection.suspiciousPatterns.size,
          high_risk_users: Array.from(abuseDetection.abuseScores.entries())
            .filter(([key, score]) => score > 50)
            .length
        }
      }
    });
  } catch (error) {
    console.error('Failed to get analytics dashboard:', error);
    res.status(500).json({
      error: 'Failed to retrieve analytics data',
      code: 'ANALYTICS_ERROR'
    });
  }
};

// Export everything
export default {
  rateLimitAnalyticsMiddleware,
  gamingAnalyticsMiddleware,
  web3AnalyticsMiddleware,
  getAnalyticsDashboard,
  analyticsEmitter,
  analyticsStore,
  gamingTracker,
  abuseDetection
};