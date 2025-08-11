/**
 * Cache Statistics Middleware for MLG.clan Platform
 * 
 * Advanced cache statistics and monitoring middleware that tracks cache performance,
 * provides real-time metrics, and generates performance insights for optimization.
 * 
 * Features:
 * - Real-time cache performance tracking
 * - Request-level cache metrics
 * - Cache efficiency analysis
 * - Performance bottleneck identification
 * - Cache health monitoring
 * - Automated alerting for cache issues
 * - Historical performance data
 * - Cache optimization recommendations
 * 
 * @author Claude Code - Performance Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { getCacheManager } from '../cache-manager.js';
import { EventEmitter } from 'events';

export class CacheStatsMiddleware extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Monitoring settings
      enableRealTimeStats: options.enableRealTimeStats !== false,
      enableRequestTracking: options.enableRequestTracking !== false,
      enablePerformanceAnalysis: options.enablePerformanceAnalysis !== false,
      
      // Alerting thresholds
      lowHitRateThreshold: options.lowHitRateThreshold || 0.7, // 70%
      highErrorRateThreshold: options.highErrorRateThreshold || 0.05, // 5%
      slowResponseThreshold: options.slowResponseThreshold || 1000, // 1 second
      
      // Data retention
      maxRequestHistory: options.maxRequestHistory || 1000,
      maxPerformanceSnapshots: options.maxPerformanceSnapshots || 100,
      statsRetentionTime: options.statsRetentionTime || 3600000, // 1 hour
      
      // Reporting intervals
      reportingInterval: options.reportingInterval || 60000, // 1 minute
      alertCheckInterval: options.alertCheckInterval || 30000, // 30 seconds
      
      ...options
    };
    
    this.cache = getCacheManager();
    
    // Statistics tracking
    this.stats = {
      requests: {
        total: 0,
        cached: 0,
        uncached: 0,
        errors: 0
      },
      performance: {
        totalResponseTime: 0,
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        cacheResponseTime: 0,
        uncachedResponseTime: 0
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        sets: 0,
        deletes: 0,
        errors: 0
      },
      endpoints: new Map(),
      users: new Map(),
      timeWindows: {
        lastMinute: { requests: 0, errors: 0, responseTime: 0 },
        lastHour: { requests: 0, errors: 0, responseTime: 0 },
        lastDay: { requests: 0, errors: 0, responseTime: 0 }
      }
    };
    
    // Request history for detailed analysis
    this.requestHistory = [];
    
    // Performance snapshots over time
    this.performanceSnapshots = [];
    
    // Alert tracking
    this.alerts = {
      active: new Map(),
      history: []
    };
    
    this.logger = options.logger || console;
    
    this.startPeriodicReporting();
    this.startAlertMonitoring();
  }

  /**
   * Main middleware function
   */
  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      const requestId = this.generateRequestId();
      
      // Track request start
      if (this.config.enableRequestTracking) {
        this.trackRequestStart(req, requestId, startTime);
      }
      
      // Override response methods to capture cache behavior
      const originalSend = res.send;
      const originalJson = res.json;
      
      let responseSent = false;
      let cacheHit = false;
      
      // Check for cache hit indicators
      res.on('header', () => {
        cacheHit = res.get('X-Cache') === 'HIT' || res.get('X-Cache') === 'HIT-304';
      });
      
      const trackResponse = (data) => {
        if (!responseSent) {
          responseSent = true;
          this.trackRequestEnd(req, res, requestId, startTime, cacheHit, data);
        }
      };
      
      res.send = function(data) {
        trackResponse(data);
        return originalSend.call(this, data);
      };
      
      res.json = function(data) {
        trackResponse(data);
        return originalJson.call(this, data);
      };
      
      next();
    };
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track request start
   */
  trackRequestStart(req, requestId, startTime) {
    const requestData = {
      id: requestId,
      method: req.method,
      path: req.path,
      query: { ...req.query },
      userId: req.user?.id,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      startTime,
      cached: false,
      error: null
    };
    
    if (this.requestHistory.length >= this.config.maxRequestHistory) {
      this.requestHistory.shift();
    }
    
    this.requestHistory.push(requestData);
    
    // Update real-time stats
    this.updateTimeWindowStats('requests', 1);
  }

  /**
   * Track request end
   */
  trackRequestEnd(req, res, requestId, startTime, cacheHit, responseData) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const isError = res.statusCode >= 400;
    
    // Find request in history
    const requestIndex = this.requestHistory.findIndex(r => r.id === requestId);
    if (requestIndex !== -1) {
      const request = this.requestHistory[requestIndex];
      request.endTime = endTime;
      request.responseTime = responseTime;
      request.statusCode = res.statusCode;
      request.cached = cacheHit;
      request.error = isError;
      request.responseSize = responseData ? Buffer.byteLength(JSON.stringify(responseData), 'utf8') : 0;
    }
    
    // Update statistics
    this.updateRequestStats(req, responseTime, cacheHit, isError);
    this.updatePerformanceStats(responseTime, cacheHit);
    this.updateEndpointStats(req.path, responseTime, cacheHit, isError);
    
    if (req.user?.id) {
      this.updateUserStats(req.user.id, responseTime, cacheHit, isError);
    }
    
    // Update time window stats
    this.updateTimeWindowStats('responseTime', responseTime);
    if (isError) {
      this.updateTimeWindowStats('errors', 1);
    }
    
    // Emit performance event
    this.emit('request:complete', {
      requestId,
      path: req.path,
      responseTime,
      cached: cacheHit,
      error: isError,
      statusCode: res.statusCode
    });
    
    // Check for performance issues
    if (this.config.enablePerformanceAnalysis) {
      this.analyzeRequestPerformance(req, responseTime, cacheHit, isError);
    }
  }

  /**
   * Update request statistics
   */
  updateRequestStats(req, responseTime, cacheHit, isError) {
    this.stats.requests.total++;
    
    if (cacheHit) {
      this.stats.requests.cached++;
      this.stats.cache.hits++;
    } else {
      this.stats.requests.uncached++;
      this.stats.cache.misses++;
    }
    
    if (isError) {
      this.stats.requests.errors++;
      this.stats.cache.errors++;
    }
    
    // Update hit rate
    const totalCacheRequests = this.stats.cache.hits + this.stats.cache.misses;
    this.stats.cache.hitRate = totalCacheRequests > 0 ? 
      this.stats.cache.hits / totalCacheRequests : 0;
  }

  /**
   * Update performance statistics
   */
  updatePerformanceStats(responseTime, cacheHit) {
    this.stats.performance.totalResponseTime += responseTime;
    this.stats.performance.averageResponseTime = 
      this.stats.performance.totalResponseTime / this.stats.requests.total;
    
    this.stats.performance.minResponseTime = 
      Math.min(this.stats.performance.minResponseTime, responseTime);
    this.stats.performance.maxResponseTime = 
      Math.max(this.stats.performance.maxResponseTime, responseTime);
    
    if (cacheHit) {
      this.stats.performance.cacheResponseTime += responseTime;
    } else {
      this.stats.performance.uncachedResponseTime += responseTime;
    }
  }

  /**
   * Update endpoint-specific statistics
   */
  updateEndpointStats(path, responseTime, cacheHit, isError) {
    if (!this.stats.endpoints.has(path)) {
      this.stats.endpoints.set(path, {
        requests: 0,
        errors: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
        cacheHits: 0,
        cacheMisses: 0,
        hitRate: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0
      });
    }
    
    const endpointStats = this.stats.endpoints.get(path);
    
    endpointStats.requests++;
    endpointStats.totalResponseTime += responseTime;
    endpointStats.averageResponseTime = endpointStats.totalResponseTime / endpointStats.requests;
    endpointStats.minResponseTime = Math.min(endpointStats.minResponseTime, responseTime);
    endpointStats.maxResponseTime = Math.max(endpointStats.maxResponseTime, responseTime);
    
    if (cacheHit) {
      endpointStats.cacheHits++;
    } else {
      endpointStats.cacheMisses++;
    }
    
    if (isError) {
      endpointStats.errors++;
    }
    
    const totalEndpointCache = endpointStats.cacheHits + endpointStats.cacheMisses;
    endpointStats.hitRate = totalEndpointCache > 0 ? 
      endpointStats.cacheHits / totalEndpointCache : 0;
  }

  /**
   * Update user-specific statistics
   */
  updateUserStats(userId, responseTime, cacheHit, isError) {
    if (!this.stats.users.has(userId)) {
      this.stats.users.set(userId, {
        requests: 0,
        errors: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
        cacheHits: 0,
        cacheMisses: 0,
        hitRate: 0
      });
    }
    
    const userStats = this.stats.users.get(userId);
    
    userStats.requests++;
    userStats.totalResponseTime += responseTime;
    userStats.averageResponseTime = userStats.totalResponseTime / userStats.requests;
    
    if (cacheHit) {
      userStats.cacheHits++;
    } else {
      userStats.cacheMisses++;
    }
    
    if (isError) {
      userStats.errors++;
    }
    
    const totalUserCache = userStats.cacheHits + userStats.cacheMisses;
    userStats.hitRate = totalUserCache > 0 ? userStats.cacheHits / totalUserCache : 0;
  }

  /**
   * Update time window statistics
   */
  updateTimeWindowStats(metric, value) {
    const now = Date.now();
    
    // Initialize time windows if needed
    Object.keys(this.stats.timeWindows).forEach(window => {
      if (!this.stats.timeWindows[window].startTime) {
        this.stats.timeWindows[window].startTime = now;
      }
    });
    
    // Update each time window
    this.stats.timeWindows.lastMinute[metric] += value;
    this.stats.timeWindows.lastHour[metric] += value;
    this.stats.timeWindows.lastDay[metric] += value;
    
    // Reset windows if expired
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;
    const oneDayAgo = now - 86400000;
    
    if (this.stats.timeWindows.lastMinute.startTime < oneMinuteAgo) {
      this.stats.timeWindows.lastMinute = { 
        requests: metric === 'requests' ? value : 0,
        errors: metric === 'errors' ? value : 0,
        responseTime: metric === 'responseTime' ? value : 0,
        startTime: now
      };
    }
    
    if (this.stats.timeWindows.lastHour.startTime < oneHourAgo) {
      this.stats.timeWindows.lastHour = { 
        requests: metric === 'requests' ? value : 0,
        errors: metric === 'errors' ? value : 0,
        responseTime: metric === 'responseTime' ? value : 0,
        startTime: now
      };
    }
    
    if (this.stats.timeWindows.lastDay.startTime < oneDayAgo) {
      this.stats.timeWindows.lastDay = { 
        requests: metric === 'requests' ? value : 0,
        errors: metric === 'errors' ? value : 0,
        responseTime: metric === 'responseTime' ? value : 0,
        startTime: now
      };
    }
  }

  /**
   * Analyze request performance
   */
  analyzeRequestPerformance(req, responseTime, cacheHit, isError) {
    // Identify slow requests
    if (responseTime > this.config.slowResponseThreshold) {
      this.emit('performance:slow_request', {
        path: req.path,
        responseTime,
        cached: cacheHit,
        threshold: this.config.slowResponseThreshold
      });
    }
    
    // Identify cache misses on frequently accessed endpoints
    if (!cacheHit && req.method === 'GET') {
      const endpointStats = this.stats.endpoints.get(req.path);
      if (endpointStats && endpointStats.requests > 10 && endpointStats.hitRate < 0.5) {
        this.emit('performance:poor_cache_efficiency', {
          path: req.path,
          hitRate: endpointStats.hitRate,
          requests: endpointStats.requests
        });
      }
    }
  }

  /**
   * Start periodic performance reporting
   */
  startPeriodicReporting() {
    setInterval(() => {
      this.generatePerformanceSnapshot();
      this.emitPeriodicReport();
    }, this.config.reportingInterval);
  }

  /**
   * Generate performance snapshot
   */
  generatePerformanceSnapshot() {
    const snapshot = {
      timestamp: Date.now(),
      stats: JSON.parse(JSON.stringify(this.stats)),
      topEndpoints: this.getTopEndpoints(10),
      cacheHealth: this.getCacheHealth(),
      performanceIssues: this.identifyPerformanceIssues()
    };
    
    if (this.performanceSnapshots.length >= this.config.maxPerformanceSnapshots) {
      this.performanceSnapshots.shift();
    }
    
    this.performanceSnapshots.push(snapshot);
  }

  /**
   * Emit periodic performance report
   */
  emitPeriodicReport() {
    const report = {
      timestamp: Date.now(),
      summary: this.getPerformanceSummary(),
      alerts: this.getActiveAlerts(),
      recommendations: this.generateRecommendations()
    };
    
    this.emit('performance:report', report);
    
    if (this.config.enableRealTimeStats) {
      this.logger.debug('Cache performance report:', report.summary);
    }
  }

  /**
   * Start alert monitoring
   */
  startAlertMonitoring() {
    setInterval(() => {
      this.checkAlertConditions();
    }, this.config.alertCheckInterval);
  }

  /**
   * Check alert conditions
   */
  checkAlertConditions() {
    const now = Date.now();
    
    // Check hit rate
    if (this.stats.cache.hitRate < this.config.lowHitRateThreshold) {
      this.triggerAlert('low_hit_rate', {
        currentHitRate: this.stats.cache.hitRate,
        threshold: this.config.lowHitRateThreshold,
        severity: 'warning'
      });
    }
    
    // Check error rate
    const errorRate = this.stats.requests.total > 0 ? 
      this.stats.requests.errors / this.stats.requests.total : 0;
    
    if (errorRate > this.config.highErrorRateThreshold) {
      this.triggerAlert('high_error_rate', {
        currentErrorRate: errorRate,
        threshold: this.config.highErrorRateThreshold,
        severity: 'critical'
      });
    }
    
    // Check average response time
    if (this.stats.performance.averageResponseTime > this.config.slowResponseThreshold) {
      this.triggerAlert('slow_response_time', {
        currentAvgTime: this.stats.performance.averageResponseTime,
        threshold: this.config.slowResponseThreshold,
        severity: 'warning'
      });
    }
  }

  /**
   * Trigger alert
   */
  triggerAlert(alertType, alertData) {
    const alertKey = `${alertType}_${Date.now()}`;
    
    const alert = {
      id: alertKey,
      type: alertType,
      severity: alertData.severity,
      data: alertData,
      triggered: Date.now(),
      resolved: null,
      active: true
    };
    
    this.alerts.active.set(alertKey, alert);
    
    // Add to history
    this.alerts.history.push(alert);
    
    // Keep only last 100 alerts in history
    if (this.alerts.history.length > 100) {
      this.alerts.history.shift();
    }
    
    this.emit('alert:triggered', alert);
    this.logger.warn(`Cache alert triggered: ${alertType}`, alertData);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    return {
      requests: this.stats.requests,
      performance: {
        ...this.stats.performance,
        averageCacheResponseTime: this.stats.cache.hits > 0 ? 
          this.stats.performance.cacheResponseTime / this.stats.cache.hits : 0,
        averageUncachedResponseTime: this.stats.cache.misses > 0 ? 
          this.stats.performance.uncachedResponseTime / this.stats.cache.misses : 0
      },
      cache: this.stats.cache,
      timeWindows: this.stats.timeWindows
    };
  }

  /**
   * Get top endpoints by various metrics
   */
  getTopEndpoints(limit = 10) {
    const endpoints = Array.from(this.stats.endpoints.entries())
      .map(([path, stats]) => ({ path, ...stats }));
    
    return {
      byRequests: endpoints
        .sort((a, b) => b.requests - a.requests)
        .slice(0, limit),
      byResponseTime: endpoints
        .sort((a, b) => b.averageResponseTime - a.averageResponseTime)
        .slice(0, limit),
      byErrors: endpoints
        .sort((a, b) => b.errors - a.errors)
        .slice(0, limit),
      byHitRate: endpoints
        .sort((a, b) => a.hitRate - b.hitRate)
        .slice(0, limit)
    };
  }

  /**
   * Get cache health status
   */
  getCacheHealth() {
    const hitRate = this.stats.cache.hitRate;
    const errorRate = this.stats.requests.total > 0 ? 
      this.stats.requests.errors / this.stats.requests.total : 0;
    
    let status = 'healthy';
    
    if (hitRate < this.config.lowHitRateThreshold || 
        errorRate > this.config.highErrorRateThreshold) {
      status = 'unhealthy';
    } else if (hitRate < 0.8 || errorRate > 0.02) {
      status = 'warning';
    }
    
    return {
      status,
      hitRate,
      errorRate,
      averageResponseTime: this.stats.performance.averageResponseTime,
      totalRequests: this.stats.requests.total
    };
  }

  /**
   * Identify performance issues
   */
  identifyPerformanceIssues() {
    const issues = [];
    
    // Low hit rate
    if (this.stats.cache.hitRate < 0.7) {
      issues.push({
        type: 'low_cache_hit_rate',
        severity: 'medium',
        description: `Cache hit rate is ${Math.round(this.stats.cache.hitRate * 100)}%, below optimal threshold`,
        impact: 'Increased response times and database load'
      });
    }
    
    // High response time variance
    const responseTimeRange = this.stats.performance.maxResponseTime - this.stats.performance.minResponseTime;
    if (responseTimeRange > 5000) {
      issues.push({
        type: 'high_response_time_variance',
        severity: 'low',
        description: `Response time variance is ${responseTimeRange}ms`,
        impact: 'Inconsistent user experience'
      });
    }
    
    // Frequently accessed uncached endpoints
    for (const [path, stats] of this.stats.endpoints) {
      if (stats.requests > 50 && stats.hitRate < 0.3) {
        issues.push({
          type: 'poor_endpoint_caching',
          severity: 'medium',
          description: `Endpoint ${path} has low hit rate (${Math.round(stats.hitRate * 100)}%) with ${stats.requests} requests`,
          impact: 'Inefficient cache utilization for popular endpoint'
        });
      }
    }
    
    return issues;
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    if (this.stats.cache.hitRate < 0.7) {
      recommendations.push({
        category: 'caching',
        priority: 'high',
        recommendation: 'Increase cache TTL for frequently accessed data',
        expectedImpact: 'Improve hit rate and reduce database load'
      });
    }
    
    if (this.stats.performance.averageResponseTime > 500) {
      recommendations.push({
        category: 'performance',
        priority: 'medium',
        recommendation: 'Implement more aggressive caching for slow endpoints',
        expectedImpact: 'Reduce average response time'
      });
    }
    
    const topErrorEndpoints = this.getTopEndpoints(5).byErrors;
    if (topErrorEndpoints.length > 0 && topErrorEndpoints[0].errors > 10) {
      recommendations.push({
        category: 'reliability',
        priority: 'high',
        recommendation: `Investigate high error rate on ${topErrorEndpoints[0].path}`,
        expectedImpact: 'Improve system reliability'
      });
    }
    
    return recommendations;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    return Array.from(this.alerts.active.values());
  }

  /**
   * Get detailed statistics
   */
  getDetailedStats() {
    return {
      summary: this.getPerformanceSummary(),
      endpoints: Object.fromEntries(this.stats.endpoints),
      users: Object.fromEntries(this.stats.users),
      recentRequests: this.requestHistory.slice(-50),
      performanceSnapshots: this.performanceSnapshots.slice(-10),
      alerts: {
        active: this.getActiveAlerts(),
        history: this.alerts.history.slice(-20)
      },
      health: this.getCacheHealth(),
      issues: this.identifyPerformanceIssues(),
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      requests: { total: 0, cached: 0, uncached: 0, errors: 0 },
      performance: {
        totalResponseTime: 0,
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        cacheResponseTime: 0,
        uncachedResponseTime: 0
      },
      cache: { hits: 0, misses: 0, hitRate: 0, sets: 0, deletes: 0, errors: 0 },
      endpoints: new Map(),
      users: new Map(),
      timeWindows: {
        lastMinute: { requests: 0, errors: 0, responseTime: 0 },
        lastHour: { requests: 0, errors: 0, responseTime: 0 },
        lastDay: { requests: 0, errors: 0, responseTime: 0 }
      }
    };
    
    this.requestHistory = [];
    this.performanceSnapshots = [];
    this.alerts.active.clear();
  }
}

// Factory function for middleware creation
export function createCacheStatsMiddleware(options = {}) {
  const middleware = new CacheStatsMiddleware(options);
  return middleware.middleware();
}

// Export the class for advanced usage
export { CacheStatsMiddleware };

export default createCacheStatsMiddleware;