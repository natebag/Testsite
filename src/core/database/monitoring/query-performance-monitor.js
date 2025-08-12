/**
 * Database Query Performance Monitor for MLG.clan Platform
 * 
 * Comprehensive query performance monitoring system with real-time analytics,
 * automated optimization suggestions, and gaming-specific performance tracking.
 * 
 * Features:
 * - Real-time query performance tracking
 * - Slow query detection and analysis
 * - Gaming-specific query categorization
 * - Automated optimization recommendations
 * - Performance trend analysis
 * - Query execution plan monitoring
 * - Resource utilization tracking
 * - Alerting and notification system
 * - Performance regression detection
 * 
 * @author Claude Code - Database Performance Architect
 * @version 1.0.0
 * @created 2025-08-12
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { getCacheManager } from '../../cache/cache-manager.js';
import crypto from 'crypto';

export class QueryPerformanceMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Monitoring thresholds
      slowQueryThreshold: options.slowQueryThreshold || 1000,    // 1 second
      verySlowQueryThreshold: options.verySlowQueryThreshold || 5000, // 5 seconds
      
      // Gaming-specific thresholds
      votingQueryThreshold: options.votingQueryThreshold || 100,      // 100ms
      leaderboardQueryThreshold: options.leaderboardQueryThreshold || 500, // 500ms
      tournamentQueryThreshold: options.tournamentQueryThreshold || 1000,  // 1 second
      
      // Sampling and retention
      enableSampling: options.enableSampling !== false,
      samplingRate: options.samplingRate || 0.1, // 10% sampling
      retentionPeriod: options.retentionPeriod || 86400000, // 24 hours
      maxStoredQueries: options.maxStoredQueries || 10000,
      
      // Analysis settings
      enableQueryAnalysis: options.enableQueryAnalysis !== false,
      enableExecutionPlans: options.enableExecutionPlans !== false,
      enableTrendAnalysis: options.enableTrendAnalysis !== false,
      
      // Alerting
      enableAlerting: options.enableAlerting !== false,
      alertThreshold: options.alertThreshold || 10, // 10 slow queries in window
      alertWindow: options.alertWindow || 300000,   // 5 minutes
      
      // Performance regression detection
      enableRegressionDetection: options.enableRegressionDetection !== false,
      regressionThreshold: options.regressionThreshold || 50, // 50% increase
      
      ...options
    };
    
    this.cache = getCacheManager();
    
    // Query storage
    this.queryHistory = new Map();
    this.recentQueries = [];
    this.slowQueries = [];
    this.queryStats = new Map();
    
    // Performance metrics
    this.metrics = {
      // Query counts
      totalQueries: 0,
      slowQueries: 0,
      verySlowQueries: 0,
      failedQueries: 0,
      
      // Gaming-specific counts
      votingQueries: 0,
      leaderboardQueries: 0,
      tournamentQueries: 0,
      userQueries: 0,
      clanQueries: 0,
      contentQueries: 0,
      
      // Performance metrics
      avgQueryTime: 0,
      totalQueryTime: 0,
      p95QueryTime: 0,
      p99QueryTime: 0,
      
      // Resource metrics
      avgCpuUsage: 0,
      avgMemoryUsage: 0,
      avgIoWait: 0,
      
      // Alert metrics
      alertsTriggered: 0,
      regressionsDetected: 0,
      
      // Timing
      lastAnalysis: null,
      monitoringStartTime: Date.now()
    };
    
    // Query patterns for analysis
    this.queryPatterns = new Map();
    this.optimizationSuggestions = new Map();
    
    // Alert state
    this.alertWindows = new Map();
    this.regressionBaselines = new Map();
    
    // Analysis intervals
    this.analysisInterval = null;
    this.cleanupInterval = null;
    
    this.logger = options.logger || console;
    
    this.startMonitoring();
  }

  /**
   * Start monitoring services
   */
  startMonitoring() {
    // Start periodic analysis
    this.analysisInterval = setInterval(() => {
      this.performAnalysis();
    }, 60000); // Every minute
    
    // Start cleanup
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 300000); // Every 5 minutes
    
    this.logger.info('Query Performance Monitor started');
  }

  /**
   * Record query execution
   */
  recordQuery(sql, params = [], executionTime, metadata = {}) {
    const queryId = this.generateQueryId(sql, params);
    const timestamp = Date.now();
    
    // Check sampling
    if (this.config.enableSampling && Math.random() > this.config.samplingRate) {
      return;
    }
    
    // Classify query
    const classification = this.classifyQuery(sql, metadata);
    
    // Create query record
    const queryRecord = {
      id: queryId,
      sql: this.sanitizeSQL(sql),
      params: params.slice(0, 10), // Limit params for storage
      executionTime,
      timestamp,
      classification,
      metadata: {
        ...metadata,
        userId: metadata.userId || null,
        clanId: metadata.clanId || null,
        endpoint: metadata.endpoint || null
      }
    };
    
    // Update metrics
    this.updateMetrics(queryRecord);
    
    // Store query
    this.storeQuery(queryRecord);
    
    // Check for slow queries
    if (this.isSlowQuery(queryRecord)) {
      this.handleSlowQuery(queryRecord);
    }
    
    // Check for gaming-specific performance issues
    this.checkGamingPerformance(queryRecord);
    
    // Emit events
    this.emit('query:recorded', queryRecord);
    
    if (queryRecord.executionTime > this.config.slowQueryThreshold) {
      this.emit('query:slow', queryRecord);
    }
  }

  /**
   * Generate unique query ID
   */
  generateQueryId(sql, params) {
    const normalizedSQL = sql.replace(/\s+/g, ' ').trim().toLowerCase();
    const combined = `${normalizedSQL}:${JSON.stringify(params)}`;
    return crypto.createHash('md5').update(combined).digest('hex').substring(0, 16);
  }

  /**
   * Classify query by type and purpose
   */
  classifyQuery(sql, metadata = {}) {
    const normalizedSQL = sql.toLowerCase();
    
    // Gaming-specific classification
    if (metadata.queryType) {
      return {
        type: metadata.queryType,
        category: this.getCategoryFromType(metadata.queryType),
        priority: this.getPriorityFromType(metadata.queryType)
      };
    }
    
    // Voting queries
    if (normalizedSQL.includes('votes') || normalizedSQL.includes('voting')) {
      return {
        type: 'voting',
        category: 'gaming',
        priority: 'high'
      };
    }
    
    // Leaderboard queries
    if (normalizedSQL.includes('leaderboard') || 
        (normalizedSQL.includes('order by') && normalizedSQL.includes('desc'))) {
      return {
        type: 'leaderboard',
        category: 'gaming',
        priority: 'high'
      };
    }
    
    // Tournament queries
    if (normalizedSQL.includes('tournament')) {
      return {
        type: 'tournament',
        category: 'gaming',
        priority: 'medium'
      };
    }
    
    // User queries
    if (normalizedSQL.includes('users') || normalizedSQL.includes('user_')) {
      return {
        type: 'user',
        category: 'core',
        priority: 'medium'
      };
    }
    
    // Clan queries
    if (normalizedSQL.includes('clan')) {
      return {
        type: 'clan',
        category: 'gaming',
        priority: 'medium'
      };
    }
    
    // Content queries
    if (normalizedSQL.includes('content')) {
      return {
        type: 'content',
        category: 'core',
        priority: 'low'
      };
    }
    
    // Operation type
    let operationType = 'unknown';
    if (normalizedSQL.startsWith('select')) operationType = 'read';
    else if (normalizedSQL.startsWith('insert')) operationType = 'write';
    else if (normalizedSQL.startsWith('update')) operationType = 'write';
    else if (normalizedSQL.startsWith('delete')) operationType = 'write';
    
    return {
      type: operationType,
      category: 'general',
      priority: 'low'
    };
  }

  /**
   * Update performance metrics
   */
  updateMetrics(queryRecord) {
    this.metrics.totalQueries++;
    this.metrics.totalQueryTime += queryRecord.executionTime;
    this.metrics.avgQueryTime = this.metrics.totalQueryTime / this.metrics.totalQueries;
    
    // Slow query tracking
    if (queryRecord.executionTime > this.config.slowQueryThreshold) {
      this.metrics.slowQueries++;
    }
    
    if (queryRecord.executionTime > this.config.verySlowQueryThreshold) {
      this.metrics.verySlowQueries++;
    }
    
    // Gaming-specific tracking
    switch (queryRecord.classification.type) {
      case 'voting':
        this.metrics.votingQueries++;
        break;
      case 'leaderboard':
        this.metrics.leaderboardQueries++;
        break;
      case 'tournament':
        this.metrics.tournamentQueries++;
        break;
      case 'user':
        this.metrics.userQueries++;
        break;
      case 'clan':
        this.metrics.clanQueries++;
        break;
      case 'content':
        this.metrics.contentQueries++;
        break;
    }
    
    // Update percentiles
    this.updatePercentiles();
  }

  /**
   * Store query for analysis
   */
  storeQuery(queryRecord) {
    // Add to recent queries
    this.recentQueries.push(queryRecord);
    if (this.recentQueries.length > 1000) {
      this.recentQueries.shift();
    }
    
    // Update query stats
    const queryHash = this.getQueryHash(queryRecord.sql);
    if (!this.queryStats.has(queryHash)) {
      this.queryStats.set(queryHash, {
        sql: queryRecord.sql,
        count: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0,
        firstSeen: queryRecord.timestamp,
        lastSeen: queryRecord.timestamp
      });
    }
    
    const stats = this.queryStats.get(queryHash);
    stats.count++;
    stats.totalTime += queryRecord.executionTime;
    stats.avgTime = stats.totalTime / stats.count;
    stats.minTime = Math.min(stats.minTime, queryRecord.executionTime);
    stats.maxTime = Math.max(stats.maxTime, queryRecord.executionTime);
    stats.lastSeen = queryRecord.timestamp;
    
    // Store in query history
    this.queryHistory.set(queryRecord.id, queryRecord);
    
    // Limit storage size
    if (this.queryHistory.size > this.config.maxStoredQueries) {
      const oldest = Array.from(this.queryHistory.keys())[0];
      this.queryHistory.delete(oldest);
    }
  }

  /**
   * Check if query is slow based on type
   */
  isSlowQuery(queryRecord) {
    const { type } = queryRecord.classification;
    const { executionTime } = queryRecord;
    
    switch (type) {
      case 'voting':
        return executionTime > this.config.votingQueryThreshold;
      case 'leaderboard':
        return executionTime > this.config.leaderboardQueryThreshold;
      case 'tournament':
        return executionTime > this.config.tournamentQueryThreshold;
      default:
        return executionTime > this.config.slowQueryThreshold;
    }
  }

  /**
   * Handle slow query detection
   */
  handleSlowQuery(queryRecord) {
    this.slowQueries.push(queryRecord);
    if (this.slowQueries.length > 100) {
      this.slowQueries.shift();
    }
    
    // Generate optimization suggestions
    const suggestions = this.generateOptimizationSuggestions(queryRecord);
    if (suggestions.length > 0) {
      this.optimizationSuggestions.set(queryRecord.id, {
        query: queryRecord,
        suggestions,
        generatedAt: Date.now()
      });
    }
    
    // Check for alerts
    this.checkAlerts(queryRecord);
    
    this.logger.warn(`Slow query detected: ${queryRecord.executionTime}ms`, {
      sql: queryRecord.sql.substring(0, 200),
      type: queryRecord.classification.type,
      suggestions: suggestions.length
    });
  }

  /**
   * Check gaming-specific performance
   */
  checkGamingPerformance(queryRecord) {
    const { type } = queryRecord.classification;
    const { executionTime } = queryRecord;
    
    // Critical gaming operations
    if (type === 'voting' && executionTime > this.config.votingQueryThreshold) {
      this.emit('performance:critical', {
        type: 'voting_slow',
        query: queryRecord,
        threshold: this.config.votingQueryThreshold,
        severity: 'high'
      });
    }
    
    if (type === 'leaderboard' && executionTime > this.config.leaderboardQueryThreshold) {
      this.emit('performance:warning', {
        type: 'leaderboard_slow',
        query: queryRecord,
        threshold: this.config.leaderboardQueryThreshold,
        severity: 'medium'
      });
    }
  }

  /**
   * Generate optimization suggestions
   */
  generateOptimizationSuggestions(queryRecord) {
    const suggestions = [];
    const sql = queryRecord.sql.toLowerCase();
    
    // Missing WHERE clause
    if (sql.includes('select') && !sql.includes('where') && !sql.includes('limit')) {
      suggestions.push({
        type: 'missing_where',
        message: 'Consider adding WHERE clause or LIMIT to reduce result set',
        impact: 'high'
      });
    }
    
    // N+1 query pattern
    if (sql.includes('select') && sql.includes(' in (')) {
      suggestions.push({
        type: 'n_plus_one',
        message: 'Consider using JOINs instead of IN clauses for better performance',
        impact: 'medium'
      });
    }
    
    // Function calls in WHERE
    if (sql.includes('where') && (sql.includes('lower(') || sql.includes('upper('))) {
      suggestions.push({
        type: 'function_in_where',
        message: 'Consider using functional indexes for case-insensitive searches',
        impact: 'medium'
      });
    }
    
    // Large ORDER BY without INDEX
    if (sql.includes('order by') && queryRecord.executionTime > 2000) {
      suggestions.push({
        type: 'missing_index',
        message: 'Consider adding index on ORDER BY columns',
        impact: 'high'
      });
    }
    
    // Gaming-specific suggestions
    if (queryRecord.classification.type === 'voting' && queryRecord.executionTime > 500) {
      suggestions.push({
        type: 'voting_optimization',
        message: 'Consider caching voting results or using materialized views',
        impact: 'high'
      });
    }
    
    if (queryRecord.classification.type === 'leaderboard' && queryRecord.executionTime > 1000) {
      suggestions.push({
        type: 'leaderboard_optimization',
        message: 'Consider pre-computed leaderboard tables or Redis sorted sets',
        impact: 'high'
      });
    }
    
    return suggestions;
  }

  /**
   * Perform periodic analysis
   */
  async performAnalysis() {
    if (!this.config.enableQueryAnalysis) {
      return;
    }
    
    try {
      // Analyze query patterns
      await this.analyzeQueryPatterns();
      
      // Detect performance regressions
      if (this.config.enableRegressionDetection) {
        await this.detectRegressions();
      }
      
      // Update trend analysis
      if (this.config.enableTrendAnalysis) {
        await this.updateTrends();
      }
      
      // Generate performance report
      const report = this.generatePerformanceReport();
      
      this.metrics.lastAnalysis = Date.now();
      
      this.emit('analysis:complete', report);
      
    } catch (error) {
      this.logger.error('Performance analysis failed:', error);
    }
  }

  /**
   * Analyze query patterns
   */
  async analyzeQueryPatterns() {
    const patterns = new Map();
    
    // Group queries by normalized pattern
    for (const queryRecord of this.recentQueries) {
      const pattern = this.normalizeQueryPattern(queryRecord.sql);
      
      if (!patterns.has(pattern)) {
        patterns.set(pattern, {
          count: 0,
          totalTime: 0,
          avgTime: 0,
          examples: []
        });
      }
      
      const patternData = patterns.get(pattern);
      patternData.count++;
      patternData.totalTime += queryRecord.executionTime;
      patternData.avgTime = patternData.totalTime / patternData.count;
      
      if (patternData.examples.length < 3) {
        patternData.examples.push(queryRecord);
      }
    }
    
    this.queryPatterns = patterns;
  }

  /**
   * Detect performance regressions
   */
  async detectRegressions() {
    for (const [queryHash, stats] of this.queryStats) {
      if (stats.count < 10) continue; // Need enough samples
      
      const baseline = this.regressionBaselines.get(queryHash);
      
      if (!baseline) {
        // Establish baseline
        this.regressionBaselines.set(queryHash, {
          avgTime: stats.avgTime,
          establishedAt: Date.now(),
          sampleCount: stats.count
        });
        continue;
      }
      
      // Check for regression
      const regressionPercent = ((stats.avgTime - baseline.avgTime) / baseline.avgTime) * 100;
      
      if (regressionPercent > this.config.regressionThreshold) {
        this.metrics.regressionsDetected++;
        
        this.emit('performance:regression', {
          queryHash,
          sql: stats.sql,
          baselineAvg: baseline.avgTime,
          currentAvg: stats.avgTime,
          regressionPercent: Math.round(regressionPercent),
          sampleCount: stats.count
        });
        
        // Update baseline to prevent repeated alerts
        baseline.avgTime = stats.avgTime;
        baseline.establishedAt = Date.now();
      }
    }
  }

  /**
   * Update trend analysis
   */
  async updateTrends() {
    const trends = {
      queryVolume: this.calculateTrend('totalQueries'),
      avgResponseTime: this.calculateTrend('avgQueryTime'),
      slowQueryRate: this.calculateTrend('slowQueries'),
      gamingQueryPerformance: {
        voting: this.calculateGamingTrend('voting'),
        leaderboard: this.calculateGamingTrend('leaderboard'),
        tournament: this.calculateGamingTrend('tournament')
      }
    };
    
    // Store trends in cache for dashboard
    await this.cache.set('performance', 'trends', trends, { ttl: 300 });
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport() {
    const topSlowQueries = this.slowQueries
      .slice(-20)
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10);
    
    const topOptimizationSuggestions = Array.from(this.optimizationSuggestions.values())
      .sort((a, b) => b.query.executionTime - a.query.executionTime)
      .slice(0, 5);
    
    return {
      timestamp: Date.now(),
      metrics: this.metrics,
      performance: {
        queryVelocity: this.metrics.totalQueries / ((Date.now() - this.metrics.monitoringStartTime) / 1000),
        slowQueryRate: (this.metrics.slowQueries / this.metrics.totalQueries) * 100,
        gamingQueryHealth: this.getGamingQueryHealth()
      },
      topSlowQueries,
      topOptimizationSuggestions,
      queryPatterns: Array.from(this.queryPatterns.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
    };
  }

  /**
   * Get gaming query health summary
   */
  getGamingQueryHealth() {
    const votingAvg = this.getAverageTimeForType('voting');
    const leaderboardAvg = this.getAverageTimeForType('leaderboard');
    const tournamentAvg = this.getAverageTimeForType('tournament');
    
    return {
      voting: {
        avgTime: votingAvg,
        health: votingAvg < this.config.votingQueryThreshold ? 'healthy' : 'warning',
        count: this.metrics.votingQueries
      },
      leaderboard: {
        avgTime: leaderboardAvg,
        health: leaderboardAvg < this.config.leaderboardQueryThreshold ? 'healthy' : 'warning',
        count: this.metrics.leaderboardQueries
      },
      tournament: {
        avgTime: tournamentAvg,
        health: tournamentAvg < this.config.tournamentQueryThreshold ? 'healthy' : 'warning',
        count: this.metrics.tournamentQueries
      }
    };
  }

  /**
   * Check for alerts
   */
  checkAlerts(queryRecord) {
    if (!this.config.enableAlerting) {
      return;
    }
    
    const windowKey = Math.floor(Date.now() / this.config.alertWindow);
    
    if (!this.alertWindows.has(windowKey)) {
      this.alertWindows.set(windowKey, { slowQueries: 0, startTime: Date.now() });
    }
    
    const window = this.alertWindows.get(windowKey);
    window.slowQueries++;
    
    if (window.slowQueries >= this.config.alertThreshold) {
      this.metrics.alertsTriggered++;
      
      this.emit('alert:triggered', {
        type: 'slow_queries_threshold',
        count: window.slowQueries,
        threshold: this.config.alertThreshold,
        windowDuration: this.config.alertWindow,
        severity: 'warning'
      });
      
      // Reset to prevent repeated alerts
      window.slowQueries = 0;
    }
  }

  /**
   * Utility methods
   */
  
  sanitizeSQL(sql) {
    // Remove sensitive data and normalize for storage
    return sql.replace(/('[^']*'|"[^"]*")/g, '?').substring(0, 1000);
  }
  
  normalizeQueryPattern(sql) {
    return sql
      .replace(/\b\d+\b/g, '?')
      .replace(/('[^']*'|"[^"]*")/g, '?')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  getQueryHash(sql) {
    const normalized = this.normalizeQueryPattern(sql.toLowerCase());
    return crypto.createHash('md5').update(normalized).digest('hex').substring(0, 16);
  }
  
  updatePercentiles() {
    if (this.recentQueries.length === 0) return;
    
    const times = this.recentQueries.map(q => q.executionTime).sort((a, b) => a - b);
    const p95Index = Math.floor(times.length * 0.95);
    const p99Index = Math.floor(times.length * 0.99);
    
    this.metrics.p95QueryTime = times[p95Index] || 0;
    this.metrics.p99QueryTime = times[p99Index] || 0;
  }
  
  getAverageTimeForType(type) {
    const typeQueries = this.recentQueries.filter(q => q.classification.type === type);
    if (typeQueries.length === 0) return 0;
    
    const totalTime = typeQueries.reduce((sum, q) => sum + q.executionTime, 0);
    return Math.round(totalTime / typeQueries.length);
  }
  
  calculateTrend(metric) {
    // Placeholder for trend calculation
    return 'stable'; // Would implement actual trend analysis
  }
  
  calculateGamingTrend(type) {
    return {
      avgTime: this.getAverageTimeForType(type),
      trend: 'stable'
    };
  }

  /**
   * Cleanup old data
   */
  cleanup() {
    const cutoff = Date.now() - this.config.retentionPeriod;
    
    // Clean recent queries
    this.recentQueries = this.recentQueries.filter(q => q.timestamp > cutoff);
    
    // Clean slow queries
    this.slowQueries = this.slowQueries.filter(q => q.timestamp > cutoff);
    
    // Clean query history
    for (const [id, query] of this.queryHistory) {
      if (query.timestamp < cutoff) {
        this.queryHistory.delete(id);
      }
    }
    
    // Clean optimization suggestions
    for (const [id, suggestion] of this.optimizationSuggestions) {
      if (suggestion.generatedAt < cutoff) {
        this.optimizationSuggestions.delete(id);
      }
    }
    
    // Clean old alert windows
    const currentWindow = Math.floor(Date.now() / this.config.alertWindow);
    for (const windowKey of this.alertWindows.keys()) {
      if (windowKey < currentWindow - 10) {
        this.alertWindows.delete(windowKey);
      }
    }
  }

  /**
   * Get performance statistics
   */
  getStats() {
    return {
      ...this.metrics,
      storageStats: {
        recentQueries: this.recentQueries.length,
        slowQueries: this.slowQueries.length,
        queryHistory: this.queryHistory.size,
        queryStats: this.queryStats.size,
        optimizationSuggestions: this.optimizationSuggestions.size
      }
    };
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.logger.info('Query Performance Monitor stopped');
  }
}

// Utility functions
export function getCategoryFromType(type) {
  const gamingTypes = ['voting', 'leaderboard', 'tournament', 'clan'];
  return gamingTypes.includes(type) ? 'gaming' : 'core';
}

export function getPriorityFromType(type) {
  const highPriority = ['voting', 'leaderboard'];
  const mediumPriority = ['tournament', 'user', 'clan'];
  
  if (highPriority.includes(type)) return 'high';
  if (mediumPriority.includes(type)) return 'medium';
  return 'low';
}

// Create singleton instance
let globalQueryMonitor = null;

export function createQueryPerformanceMonitor(options = {}) {
  return new QueryPerformanceMonitor(options);
}

export function getQueryPerformanceMonitor(options = {}) {
  if (!globalQueryMonitor) {
    globalQueryMonitor = new QueryPerformanceMonitor(options);
  }
  return globalQueryMonitor;
}

export default QueryPerformanceMonitor;