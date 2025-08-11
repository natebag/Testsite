/**
 * Cache Analytics for MLG.clan Platform
 * 
 * Advanced analytics system for cache performance analysis, usage patterns,
 * and optimization insights. Provides detailed metrics, visualizations,
 * and actionable recommendations for cache optimization.
 * 
 * Features:
 * - Comprehensive cache usage analytics
 * - Performance pattern analysis
 * - Cache efficiency metrics
 * - Usage trend analysis
 * - Key pattern optimization
 * - Hit/miss ratio analysis
 * - Storage utilization tracking
 * - Performance bottleneck identification
 * 
 * @author Claude Code - Performance Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { EventEmitter } from 'events';
import { getCacheManager } from '../cache-manager.js';

export class CacheAnalytics extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Analytics intervals
      analysisInterval: options.analysisInterval || 300000, // 5 minutes
      reportingInterval: options.reportingInterval || 3600000, // 1 hour
      dataRetentionDays: options.dataRetentionDays || 7,
      
      // Analysis settings
      enableHitRateAnalysis: options.enableHitRateAnalysis !== false,
      enableKeyPatternAnalysis: options.enableKeyPatternAnalysis !== false,
      enableUsagePatternAnalysis: options.enableUsagePatternAnalysis !== false,
      enablePerformanceAnalysis: options.enablePerformanceAnalysis !== false,
      
      // Thresholds for analytics
      lowHitRateThreshold: options.lowHitRateThreshold || 0.7,
      highMemoryUsageThreshold: options.highMemoryUsageThreshold || 0.8,
      slowOperationThreshold: options.slowOperationThreshold || 100, // ms
      
      // Key pattern analysis
      maxKeyPatterns: options.maxKeyPatterns || 1000,
      minPatternCount: options.minPatternCount || 10,
      
      ...options
    };
    
    this.cache = getCacheManager();
    
    // Analytics data storage
    this.analytics = {
      hitRateAnalysis: {
        hourly: [],
        daily: [],
        patterns: new Map()
      },
      keyPatterns: {
        usage: new Map(),
        performance: new Map(),
        hotKeys: new Set(),
        coldKeys: new Set()
      },
      usagePatterns: {
        timeOfDay: new Map(),
        dayOfWeek: new Map(),
        operations: new Map()
      },
      performance: {
        responseTime: [],
        throughput: [],
        errors: [],
        bottlenecks: []
      },
      storage: {
        utilization: [],
        keyDistribution: new Map(),
        sizeDistribution: new Map()
      }
    };
    
    // Current session tracking
    this.sessionStats = {
      operations: new Map(),
      keyAccess: new Map(),
      errorPatterns: new Map(),
      performanceData: []
    };
    
    this.logger = options.logger || console;
    
    this.startAnalytics();
    this.setupEventListeners();
  }

  /**
   * Start analytics collection
   */
  startAnalytics() {
    // Regular analysis
    setInterval(() => {
      this.performAnalysis();
    }, this.config.analysisInterval);
    
    // Regular reporting
    setInterval(() => {
      this.generateAnalyticsReport();
    }, this.config.reportingInterval);
    
    // Data cleanup
    setInterval(() => {
      this.cleanupOldData();
    }, 86400000); // Daily
  }

  /**
   * Setup event listeners for real-time analytics
   */
  setupEventListeners() {
    this.cache.on('cache:set', (data) => {
      this.trackCacheOperation('set', data);
    });
    
    this.cache.on('cache:hit', (data) => {
      this.trackCacheOperation('hit', data);
    });
    
    this.cache.on('cache:miss', (data) => {
      this.trackCacheOperation('miss', data);
    });
    
    this.cache.on('cache:delete', (data) => {
      this.trackCacheOperation('delete', data);
    });
    
    this.cache.on('cache:evict', (data) => {
      this.trackCacheOperation('evict', data);
    });
    
    this.cache.on('cache:invalidate', (data) => {
      this.trackCacheOperation('invalidate', data);
    });
  }

  /**
   * Track cache operations for analytics
   */
  trackCacheOperation(operation, data) {
    const timestamp = Date.now();
    
    // Track operation counts
    if (!this.sessionStats.operations.has(operation)) {
      this.sessionStats.operations.set(operation, 0);
    }
    this.sessionStats.operations.set(operation, 
      this.sessionStats.operations.get(operation) + 1
    );
    
    // Track key access patterns
    if (data.key) {
      this.trackKeyAccess(data.key, operation, data);
    }
    
    // Track performance data
    if (data.responseTime || data.age !== undefined) {
      this.sessionStats.performanceData.push({
        operation,
        timestamp,
        responseTime: data.responseTime,
        age: data.age,
        compressed: data.compressed,
        source: data.source
      });
    }
    
    // Track usage patterns by time
    this.trackUsageByTime(operation, timestamp);
  }

  /**
   * Track key access patterns
   */
  trackKeyAccess(key, operation, data) {
    if (!this.sessionStats.keyAccess.has(key)) {
      this.sessionStats.keyAccess.set(key, {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        totalAccess: 0,
        lastAccess: 0,
        avgResponseTime: 0,
        totalResponseTime: 0
      });
    }
    
    const keyStats = this.sessionStats.keyAccess.get(key);
    keyStats.totalAccess++;
    keyStats.lastAccess = Date.now();
    
    switch (operation) {
      case 'hit':
        keyStats.hits++;
        break;
      case 'miss':
        keyStats.misses++;
        break;
      case 'set':
        keyStats.sets++;
        break;
      case 'delete':
        keyStats.deletes++;
        break;
    }
    
    // Track response time
    if (data.responseTime) {
      keyStats.totalResponseTime += data.responseTime;
      keyStats.avgResponseTime = keyStats.totalResponseTime / keyStats.totalAccess;
    }
  }

  /**
   * Track usage patterns by time
   */
  trackUsageByTime(operation, timestamp) {
    const hour = new Date(timestamp).getHours();
    const dayOfWeek = new Date(timestamp).getDay();
    
    // Track by hour of day
    if (!this.analytics.usagePatterns.timeOfDay.has(hour)) {
      this.analytics.usagePatterns.timeOfDay.set(hour, new Map());
    }
    const hourStats = this.analytics.usagePatterns.timeOfDay.get(hour);
    hourStats.set(operation, (hourStats.get(operation) || 0) + 1);
    
    // Track by day of week
    if (!this.analytics.usagePatterns.dayOfWeek.has(dayOfWeek)) {
      this.analytics.usagePatterns.dayOfWeek.set(dayOfWeek, new Map());
    }
    const dayStats = this.analytics.usagePatterns.dayOfWeek.get(dayOfWeek);
    dayStats.set(operation, (dayStats.get(operation) || 0) + 1);
  }

  /**
   * Perform comprehensive cache analysis
   */
  async performAnalysis() {
    try {
      if (this.config.enableHitRateAnalysis) {
        await this.analyzeHitRates();
      }
      
      if (this.config.enableKeyPatternAnalysis) {
        await this.analyzeKeyPatterns();
      }
      
      if (this.config.enableUsagePatternAnalysis) {
        await this.analyzeUsagePatterns();
      }
      
      if (this.config.enablePerformanceAnalysis) {
        await this.analyzePerformance();
      }
      
      await this.analyzeStorageUtilization();
      
      this.emit('analytics:completed', {
        timestamp: Date.now(),
        analysisTypes: this.getEnabledAnalysisTypes()
      });
      
    } catch (error) {
      this.logger.error('Cache analytics analysis failed:', error);
    }
  }

  /**
   * Analyze cache hit rates and patterns
   */
  async analyzeHitRates() {
    const cacheStats = this.cache.getStats();
    const timestamp = Date.now();
    
    // Current hit rate analysis
    const hitRateData = {
      timestamp,
      hitRate: cacheStats.hitRate / 100,
      hits: cacheStats.hits,
      misses: cacheStats.misses,
      totalRequests: cacheStats.totalRequests
    };
    
    // Store hourly data
    this.analytics.hitRateAnalysis.hourly.push(hitRateData);
    
    // Aggregate daily data
    this.aggregateDailyHitRates();
    
    // Analyze patterns
    this.identifyHitRatePatterns();
    
    // Maintain data retention
    this.trimHitRateData();
  }

  aggregateDailyHitRates() {
    if (this.analytics.hitRateAnalysis.hourly.length === 0) return;
    
    const today = new Date().toDateString();
    const todayData = this.analytics.hitRateAnalysis.hourly.filter(data => 
      new Date(data.timestamp).toDateString() === today
    );
    
    if (todayData.length === 0) return;
    
    const totalHits = todayData.reduce((sum, data) => sum + data.hits, 0);
    const totalMisses = todayData.reduce((sum, data) => sum + data.misses, 0);
    const avgHitRate = todayData.reduce((sum, data) => sum + data.hitRate, 0) / todayData.length;
    
    // Update or create daily entry
    const existingDailyIndex = this.analytics.hitRateAnalysis.daily.findIndex(data =>
      new Date(data.timestamp).toDateString() === today
    );
    
    const dailyData = {
      timestamp: Date.now(),
      date: today,
      hitRate: avgHitRate,
      totalHits: totalHits,
      totalMisses: totalMisses,
      totalRequests: totalHits + totalMisses
    };
    
    if (existingDailyIndex >= 0) {
      this.analytics.hitRateAnalysis.daily[existingDailyIndex] = dailyData;
    } else {
      this.analytics.hitRateAnalysis.daily.push(dailyData);
    }
  }

  identifyHitRatePatterns() {
    if (this.analytics.hitRateAnalysis.hourly.length < 24) return;
    
    const recent24h = this.analytics.hitRateAnalysis.hourly.slice(-24);
    
    // Identify patterns
    const patterns = {
      trend: this.calculateTrend(recent24h.map(d => d.hitRate)),
      volatility: this.calculateVolatility(recent24h.map(d => d.hitRate)),
      peakHours: this.identifyPeakHours(recent24h),
      lowPerformanceHours: this.identifyLowPerformanceHours(recent24h)
    };
    
    this.analytics.hitRateAnalysis.patterns.set('recent24h', patterns);
  }

  /**
   * Analyze key usage patterns and identify hot/cold keys
   */
  async analyzeKeyPatterns() {
    // Identify hot keys (frequently accessed)
    const hotKeyThreshold = this.calculateHotKeyThreshold();
    this.analytics.keyPatterns.hotKeys.clear();
    
    // Identify cold keys (rarely accessed)
    const coldKeyThreshold = this.calculateColdKeyThreshold();
    this.analytics.keyPatterns.coldKeys.clear();
    
    for (const [key, stats] of this.sessionStats.keyAccess) {
      // Update key patterns
      this.analytics.keyPatterns.usage.set(key, {
        ...stats,
        hitRate: stats.hits > 0 ? stats.hits / (stats.hits + stats.misses) : 0,
        accessFrequency: stats.totalAccess,
        lastAccessAge: Date.now() - stats.lastAccess
      });
      
      // Classify keys
      if (stats.totalAccess > hotKeyThreshold) {
        this.analytics.keyPatterns.hotKeys.add(key);
      } else if (stats.totalAccess < coldKeyThreshold) {
        this.analytics.keyPatterns.coldKeys.add(key);
      }
    }
    
    // Analyze key patterns
    this.analyzeKeyPrefixPatterns();
    this.identifyIneffectiveKeys();
  }

  analyzeKeyPrefixPatterns() {
    const prefixStats = new Map();
    
    for (const [key, stats] of this.analytics.keyPatterns.usage) {
      const prefix = key.split(':')[0] || 'unknown';
      
      if (!prefixStats.has(prefix)) {
        prefixStats.set(prefix, {
          count: 0,
          totalAccess: 0,
          totalHits: 0,
          totalMisses: 0,
          avgResponseTime: 0,
          totalResponseTime: 0
        });
      }
      
      const prefixData = prefixStats.get(prefix);
      prefixData.count++;
      prefixData.totalAccess += stats.totalAccess;
      prefixData.totalHits += stats.hits;
      prefixData.totalMisses += stats.misses;
      prefixData.totalResponseTime += stats.totalResponseTime;
    }
    
    // Calculate averages
    for (const [prefix, data] of prefixStats) {
      data.avgResponseTime = data.count > 0 ? data.totalResponseTime / data.count : 0;
      data.hitRate = (data.totalHits + data.totalMisses) > 0 ? 
        data.totalHits / (data.totalHits + data.totalMisses) : 0;
    }
    
    this.analytics.keyPatterns.prefixStats = prefixStats;
  }

  identifyIneffectiveKeys() {
    const ineffectiveKeys = [];
    
    for (const [key, stats] of this.analytics.keyPatterns.usage) {
      const hitRate = stats.hits > 0 ? stats.hits / (stats.hits + stats.misses) : 0;
      const accessAge = Date.now() - stats.lastAccess;
      
      // Keys with low hit rate and recent access
      if (hitRate < 0.3 && stats.totalAccess > 5 && accessAge < 3600000) {
        ineffectiveKeys.push({
          key,
          hitRate,
          totalAccess: stats.totalAccess,
          reason: 'Low hit rate with frequent access'
        });
      }
      
      // Keys not accessed recently
      if (accessAge > 86400000) { // 24 hours
        ineffectiveKeys.push({
          key,
          hitRate,
          totalAccess: stats.totalAccess,
          lastAccess: stats.lastAccess,
          reason: 'Not accessed recently'
        });
      }
    }
    
    this.analytics.keyPatterns.ineffectiveKeys = ineffectiveKeys;
  }

  /**
   * Analyze usage patterns over time
   */
  async analyzeUsagePatterns() {
    // Analyze peak usage hours
    this.identifyPeakUsageHours();
    
    // Analyze operation distribution
    this.analyzeOperationDistribution();
    
    // Analyze seasonal patterns
    this.analyzeSeasonalPatterns();
  }

  identifyPeakUsageHours() {
    const hourlyTotals = new Map();
    
    for (const [hour, operations] of this.analytics.usagePatterns.timeOfDay) {
      const total = Array.from(operations.values()).reduce((sum, count) => sum + count, 0);
      hourlyTotals.set(hour, total);
    }
    
    // Find peak hours
    const sortedHours = Array.from(hourlyTotals.entries())
      .sort(([,a], [,b]) => b - a);
    
    this.analytics.usagePatterns.peakHours = sortedHours.slice(0, 5);
    this.analytics.usagePatterns.lowUsageHours = sortedHours.slice(-5);
  }

  analyzeOperationDistribution() {
    const totalOperations = {};
    
    for (const [operation, count] of this.sessionStats.operations) {
      totalOperations[operation] = count;
    }
    
    // Calculate percentages
    const total = Object.values(totalOperations).reduce((sum, count) => sum + count, 0);
    const distribution = {};
    
    for (const [operation, count] of Object.entries(totalOperations)) {
      distribution[operation] = {
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      };
    }
    
    this.analytics.usagePatterns.operationDistribution = distribution;
  }

  analyzeSeasonalPatterns() {
    const weekdayTotals = new Map();
    
    for (const [day, operations] of this.analytics.usagePatterns.dayOfWeek) {
      const total = Array.from(operations.values()).reduce((sum, count) => sum + count, 0);
      weekdayTotals.set(day, total);
    }
    
    this.analytics.usagePatterns.weekdayDistribution = weekdayTotals;
  }

  /**
   * Analyze cache performance metrics
   */
  async analyzePerformance() {
    if (this.sessionStats.performanceData.length === 0) return;
    
    const performanceMetrics = this.calculatePerformanceMetrics();
    this.analytics.performance.responseTime.push(performanceMetrics);
    
    // Identify performance bottlenecks
    this.identifyPerformanceBottlenecks(performanceMetrics);
    
    // Maintain data retention
    this.trimPerformanceData();
  }

  calculatePerformanceMetrics() {
    const data = this.sessionStats.performanceData;
    const timestamp = Date.now();
    
    const responseTimes = data.filter(d => d.responseTime).map(d => d.responseTime);
    const cacheHits = data.filter(d => d.operation === 'hit');
    const cacheMisses = data.filter(d => d.operation === 'miss');
    
    return {
      timestamp,
      avgResponseTime: responseTimes.length > 0 ? 
        responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0,
      medianResponseTime: this.calculateMedian(responseTimes),
      p95ResponseTime: this.calculatePercentile(responseTimes, 95),
      p99ResponseTime: this.calculatePercentile(responseTimes, 99),
      maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
      minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
      throughput: data.length / 60, // operations per second over last minute
      hitRate: (cacheHits.length + cacheMisses.length) > 0 ? 
        cacheHits.length / (cacheHits.length + cacheMisses.length) : 0,
      compressionRate: data.filter(d => d.compressed).length / data.length,
      sourceDistribution: this.calculateSourceDistribution(data)
    };
  }

  identifyPerformanceBottlenecks(metrics) {
    const bottlenecks = [];
    
    // High response time
    if (metrics.avgResponseTime > this.config.slowOperationThreshold) {
      bottlenecks.push({
        type: 'high_response_time',
        severity: 'medium',
        value: metrics.avgResponseTime,
        threshold: this.config.slowOperationThreshold,
        description: 'Average response time exceeds threshold'
      });
    }
    
    // Low hit rate
    if (metrics.hitRate < this.config.lowHitRateThreshold) {
      bottlenecks.push({
        type: 'low_hit_rate',
        severity: 'high',
        value: metrics.hitRate,
        threshold: this.config.lowHitRateThreshold,
        description: 'Cache hit rate below optimal threshold'
      });
    }
    
    // High P99 response time
    if (metrics.p99ResponseTime > metrics.avgResponseTime * 5) {
      bottlenecks.push({
        type: 'high_tail_latency',
        severity: 'medium',
        value: metrics.p99ResponseTime,
        description: 'P99 response time significantly higher than average'
      });
    }
    
    this.analytics.performance.bottlenecks.push({
      timestamp: Date.now(),
      bottlenecks
    });
  }

  /**
   * Analyze storage utilization
   */
  async analyzeStorageUtilization() {
    const cacheStats = this.cache.getStats();
    
    const utilizationData = {
      timestamp: Date.now(),
      totalKeys: cacheStats.totalRequests, // Approximation
      memoryCacheSize: cacheStats.memoryCacheSize,
      hitRate: cacheStats.hitRate,
      avgResponseTime: cacheStats.avgResponseTime
    };
    
    this.analytics.storage.utilization.push(utilizationData);
    
    // Analyze key distribution by prefix
    this.analyzeKeyDistribution();
    
    // Maintain data retention
    this.trimStorageData();
  }

  analyzeKeyDistribution() {
    const distribution = new Map();
    
    for (const [key, stats] of this.analytics.keyPatterns.usage) {
      const namespace = key.split(':')[0] || 'unknown';
      
      if (!distribution.has(namespace)) {
        distribution.set(namespace, {
          count: 0,
          totalAccess: 0,
          avgHitRate: 0,
          totalHits: 0,
          totalRequests: 0
        });
      }
      
      const namespaceData = distribution.get(namespace);
      namespaceData.count++;
      namespaceData.totalAccess += stats.totalAccess;
      namespaceData.totalHits += stats.hits;
      namespaceData.totalRequests += (stats.hits + stats.misses);
    }
    
    // Calculate averages
    for (const [namespace, data] of distribution) {
      data.avgHitRate = data.totalRequests > 0 ? data.totalHits / data.totalRequests : 0;
    }
    
    this.analytics.storage.keyDistribution = distribution;
  }

  /**
   * Generate comprehensive analytics report
   */
  generateAnalyticsReport() {
    const report = {
      timestamp: Date.now(),
      period: {
        start: Date.now() - this.config.reportingInterval,
        end: Date.now()
      },
      summary: this.generateAnalyticsSummary(),
      hitRateAnalysis: this.getHitRateAnalysis(),
      keyPatterns: this.getKeyPatternsAnalysis(),
      usagePatterns: this.getUsagePatternsAnalysis(),
      performance: this.getPerformanceAnalysis(),
      storage: this.getStorageAnalysis(),
      recommendations: this.generateOptimizationRecommendations()
    };
    
    this.emit('analytics:report', report);
    
    this.logger.info('Cache Analytics Report Generated', {
      hitRate: Math.round(report.summary.avgHitRate * 100) + '%',
      hotKeys: report.keyPatterns.hotKeysCount,
      peakHour: report.usagePatterns.peakHour,
      avgResponseTime: Math.round(report.performance.avgResponseTime) + 'ms',
      recommendations: report.recommendations.length
    });
    
    return report;
  }

  generateAnalyticsSummary() {
    const cacheStats = this.cache.getStats();
    
    return {
      totalOperations: Array.from(this.sessionStats.operations.values())
        .reduce((sum, count) => sum + count, 0),
      avgHitRate: cacheStats.hitRate / 100,
      avgResponseTime: cacheStats.avgResponseTime,
      totalKeys: this.sessionStats.keyAccess.size,
      hotKeysCount: this.analytics.keyPatterns.hotKeys.size,
      coldKeysCount: this.analytics.keyPatterns.coldKeys.size,
      ineffectiveKeysCount: this.analytics.keyPatterns.ineffectiveKeys?.length || 0
    };
  }

  getHitRateAnalysis() {
    return {
      current: this.analytics.hitRateAnalysis.hourly[this.analytics.hitRateAnalysis.hourly.length - 1],
      trend: this.calculateRecentTrend(this.analytics.hitRateAnalysis.hourly, 'hitRate'),
      patterns: Object.fromEntries(this.analytics.hitRateAnalysis.patterns),
      dailyAverage: this.calculateDailyAverage()
    };
  }

  getKeyPatternsAnalysis() {
    return {
      hotKeysCount: this.analytics.keyPatterns.hotKeys.size,
      coldKeysCount: this.analytics.keyPatterns.coldKeys.size,
      topHotKeys: this.getTopHotKeys(10),
      ineffectiveKeys: this.analytics.keyPatterns.ineffectiveKeys || [],
      prefixStats: Object.fromEntries(this.analytics.keyPatterns.prefixStats || new Map())
    };
  }

  getUsagePatternsAnalysis() {
    const peakHours = this.analytics.usagePatterns.peakHours || [];
    return {
      peakHour: peakHours[0] ? peakHours[0][0] : null,
      peakHours: peakHours.slice(0, 3),
      operationDistribution: this.analytics.usagePatterns.operationDistribution || {},
      weekdayDistribution: Object.fromEntries(this.analytics.usagePatterns.weekdayDistribution || new Map())
    };
  }

  getPerformanceAnalysis() {
    const recent = this.analytics.performance.responseTime[this.analytics.performance.responseTime.length - 1];
    return {
      current: recent || {},
      trend: this.calculateRecentTrend(this.analytics.performance.responseTime, 'avgResponseTime'),
      bottlenecks: this.analytics.performance.bottlenecks.slice(-5),
      avgResponseTime: recent?.avgResponseTime || 0,
      p95ResponseTime: recent?.p95ResponseTime || 0
    };
  }

  getStorageAnalysis() {
    const recent = this.analytics.storage.utilization[this.analytics.storage.utilization.length - 1];
    return {
      current: recent || {},
      keyDistribution: Object.fromEntries(this.analytics.storage.keyDistribution || new Map()),
      utilizationTrend: this.calculateRecentTrend(this.analytics.storage.utilization, 'memoryCacheSize')
    };
  }

  /**
   * Generate optimization recommendations
   */
  generateOptimizationRecommendations() {
    const recommendations = [];
    
    // Hit rate recommendations
    const hitRate = this.cache.getStats().hitRate / 100;
    if (hitRate < 0.8) {
      recommendations.push({
        category: 'hit_rate',
        priority: 'high',
        title: 'Improve Cache Hit Rate',
        description: `Current hit rate (${Math.round(hitRate * 100)}%) is below optimal`,
        actions: [
          'Increase TTL for stable data',
          'Implement cache warming for popular keys',
          'Review cache invalidation strategies'
        ]
      });
    }
    
    // Hot keys recommendations
    if (this.analytics.keyPatterns.hotKeys.size > 100) {
      recommendations.push({
        category: 'hot_keys',
        priority: 'medium',
        title: 'Optimize Hot Keys',
        description: `${this.analytics.keyPatterns.hotKeys.size} hot keys detected`,
        actions: [
          'Consider implementing local caching for hot keys',
          'Increase TTL for frequently accessed data',
          'Implement key-specific optimization strategies'
        ]
      });
    }
    
    // Ineffective keys recommendations
    const ineffectiveCount = this.analytics.keyPatterns.ineffectiveKeys?.length || 0;
    if (ineffectiveCount > 10) {
      recommendations.push({
        category: 'ineffective_keys',
        priority: 'medium',
        title: 'Remove Ineffective Keys',
        description: `${ineffectiveCount} ineffective keys found`,
        actions: [
          'Review and remove keys with low hit rates',
          'Implement more intelligent caching strategies',
          'Adjust cache eviction policies'
        ]
      });
    }
    
    // Performance recommendations
    const avgResponseTime = this.cache.getStats().avgResponseTime;
    if (avgResponseTime > 100) {
      recommendations.push({
        category: 'performance',
        priority: 'high',
        title: 'Improve Response Time',
        description: `Average response time (${avgResponseTime}ms) is high`,
        actions: [
          'Optimize cache serialization/deserialization',
          'Consider using compression for large values',
          'Review network latency to cache servers'
        ]
      });
    }
    
    return recommendations;
  }

  /**
   * Utility methods
   */
  
  calculateHotKeyThreshold() {
    const accessCounts = Array.from(this.sessionStats.keyAccess.values())
      .map(stats => stats.totalAccess);
    
    if (accessCounts.length === 0) return 10;
    
    const sorted = accessCounts.sort((a, b) => b - a);
    const top10Percent = Math.ceil(sorted.length * 0.1);
    return sorted[top10Percent - 1] || 10;
  }

  calculateColdKeyThreshold() {
    const accessCounts = Array.from(this.sessionStats.keyAccess.values())
      .map(stats => stats.totalAccess);
    
    if (accessCounts.length === 0) return 2;
    
    const sorted = accessCounts.sort((a, b) => a - b);
    const bottom10Percent = Math.ceil(sorted.length * 0.1);
    return sorted[bottom10Percent - 1] || 2;
  }

  getTopHotKeys(limit) {
    return Array.from(this.analytics.keyPatterns.usage.entries())
      .sort(([,a], [,b]) => b.totalAccess - a.totalAccess)
      .slice(0, limit)
      .map(([key, stats]) => ({ key, ...stats }));
  }

  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const recent = values.slice(-5);
    const older = values.slice(-10, -5);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change > 0.05) return 'increasing';
    if (change < -0.05) return 'decreasing';
    return 'stable';
  }

  calculateVolatility(values) {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  calculateMedian(values) {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * (percentile / 100)) - 1;
    return sorted[Math.max(0, index)];
  }

  calculateRecentTrend(dataArray, field) {
    if (dataArray.length < 2) return 'stable';
    
    const recent = dataArray.slice(-5).map(d => d[field] || 0);
    return this.calculateTrend(recent);
  }

  calculateDailyAverage() {
    if (this.analytics.hitRateAnalysis.daily.length === 0) return 0;
    
    const rates = this.analytics.hitRateAnalysis.daily.map(d => d.hitRate);
    return rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
  }

  calculateSourceDistribution(data) {
    const sources = {};
    for (const item of data) {
      if (item.source) {
        sources[item.source] = (sources[item.source] || 0) + 1;
      }
    }
    return sources;
  }

  identifyPeakHours(data) {
    const hourCounts = new Map();
    
    for (const item of data) {
      const hour = new Date(item.timestamp).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + item.totalRequests);
    }
    
    return Array.from(hourCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => hour);
  }

  identifyLowPerformanceHours(data) {
    return data
      .filter(d => d.hitRate < this.config.lowHitRateThreshold)
      .map(d => new Date(d.timestamp).getHours());
  }

  /**
   * Data cleanup methods
   */
  
  cleanupOldData() {
    const retentionThreshold = Date.now() - (this.config.dataRetentionDays * 86400000);
    
    // Clean hit rate data
    this.analytics.hitRateAnalysis.hourly = this.analytics.hitRateAnalysis.hourly
      .filter(data => data.timestamp > retentionThreshold);
    
    this.analytics.hitRateAnalysis.daily = this.analytics.hitRateAnalysis.daily
      .filter(data => data.timestamp > retentionThreshold);
    
    // Clean performance data
    this.trimPerformanceData();
    
    // Clean storage data
    this.trimStorageData();
    
    // Reset session stats periodically
    if (Object.keys(this.sessionStats.keyAccess).length > this.config.maxKeyPatterns) {
      this.sessionStats.keyAccess.clear();
    }
  }

  trimHitRateData() {
    const maxHourlyPoints = 168; // 1 week
    const maxDailyPoints = 30; // 1 month
    
    if (this.analytics.hitRateAnalysis.hourly.length > maxHourlyPoints) {
      this.analytics.hitRateAnalysis.hourly = this.analytics.hitRateAnalysis.hourly.slice(-maxHourlyPoints);
    }
    
    if (this.analytics.hitRateAnalysis.daily.length > maxDailyPoints) {
      this.analytics.hitRateAnalysis.daily = this.analytics.hitRateAnalysis.daily.slice(-maxDailyPoints);
    }
  }

  trimPerformanceData() {
    const maxPoints = 1000;
    
    if (this.analytics.performance.responseTime.length > maxPoints) {
      this.analytics.performance.responseTime = this.analytics.performance.responseTime.slice(-maxPoints);
    }
    
    if (this.analytics.performance.bottlenecks.length > maxPoints) {
      this.analytics.performance.bottlenecks = this.analytics.performance.bottlenecks.slice(-maxPoints);
    }
  }

  trimStorageData() {
    const maxPoints = 1000;
    
    if (this.analytics.storage.utilization.length > maxPoints) {
      this.analytics.storage.utilization = this.analytics.storage.utilization.slice(-maxPoints);
    }
  }

  getEnabledAnalysisTypes() {
    const types = [];
    if (this.config.enableHitRateAnalysis) types.push('hitRate');
    if (this.config.enableKeyPatternAnalysis) types.push('keyPatterns');
    if (this.config.enableUsagePatternAnalysis) types.push('usagePatterns');
    if (this.config.enablePerformanceAnalysis) types.push('performance');
    return types;
  }

  /**
   * Get current analytics status
   */
  getAnalyticsStatus() {
    return {
      timestamp: Date.now(),
      config: this.config,
      dataPoints: {
        hitRateHourly: this.analytics.hitRateAnalysis.hourly.length,
        hitRateDaily: this.analytics.hitRateAnalysis.daily.length,
        performanceMetrics: this.analytics.performance.responseTime.length,
        storageMetrics: this.analytics.storage.utilization.length,
        trackedKeys: this.sessionStats.keyAccess.size,
        sessionOperations: this.sessionStats.operations.size
      },
      analysis: {
        hotKeys: this.analytics.keyPatterns.hotKeys.size,
        coldKeys: this.analytics.keyPatterns.coldKeys.size,
        ineffectiveKeys: this.analytics.keyPatterns.ineffectiveKeys?.length || 0,
        recentBottlenecks: this.analytics.performance.bottlenecks.slice(-5).length
      }
    };
  }

  /**
   * Reset analytics data
   */
  reset() {
    this.analytics = {
      hitRateAnalysis: { hourly: [], daily: [], patterns: new Map() },
      keyPatterns: { usage: new Map(), performance: new Map(), hotKeys: new Set(), coldKeys: new Set() },
      usagePatterns: { timeOfDay: new Map(), dayOfWeek: new Map(), operations: new Map() },
      performance: { responseTime: [], throughput: [], errors: [], bottlenecks: [] },
      storage: { utilization: [], keyDistribution: new Map(), sizeDistribution: new Map() }
    };
    
    this.sessionStats = {
      operations: new Map(),
      keyAccess: new Map(),
      errorPatterns: new Map(),
      performanceData: []
    };
  }

  /**
   * Shutdown analytics
   */
  shutdown() {
    this.emit('shutdown');
    this.removeAllListeners();
  }
}

// Create singleton instance
let globalCacheAnalytics = null;

export function createCacheAnalytics(options = {}) {
  return new CacheAnalytics(options);
}

export function getCacheAnalytics(options = {}) {
  if (!globalCacheAnalytics) {
    globalCacheAnalytics = new CacheAnalytics(options);
  }
  return globalCacheAnalytics;
}

export default CacheAnalytics;