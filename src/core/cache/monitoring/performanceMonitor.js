/**
 * Performance Monitor for MLG.clan Platform Cache System
 * 
 * Comprehensive performance monitoring system that tracks cache performance,
 * database query efficiency, memory usage, and overall system health with
 * real-time metrics collection and intelligent alerting.
 * 
 * Features:
 * - Real-time performance metrics collection
 * - Cache efficiency monitoring and analysis
 * - Database performance tracking
 * - Memory usage monitoring
 * - System health assessment
 * - Automated alerting and notifications
 * - Performance trend analysis
 * - Bottleneck identification
 * 
 * @author Claude Code - Performance Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { EventEmitter } from 'events';
import { getCacheManager } from '../cache-manager.js';
import { getQueryOptimizer } from '../../performance/queryOptimizer.js';
import { getMemoryManager } from '../../performance/memoryManager.js';

export class PerformanceMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Monitoring intervals
      metricsCollectionInterval: options.metricsCollectionInterval || 10000, // 10 seconds
      healthCheckInterval: options.healthCheckInterval || 30000, // 30 seconds
      performanceAnalysisInterval: options.performanceAnalysisInterval || 60000, // 1 minute
      
      // Alert thresholds
      cacheHitRateThreshold: options.cacheHitRateThreshold || 0.8, // 80%
      responseTimeThreshold: options.responseTimeThreshold || 500, // 500ms
      errorRateThreshold: options.errorRateThreshold || 0.05, // 5%
      memoryUsageThreshold: options.memoryUsageThreshold || 0.8, // 80%
      
      // Data retention
      metricsRetentionHours: options.metricsRetentionHours || 24,
      maxMetricsSamples: options.maxMetricsSamples || 8640, // 24 hours at 10s intervals
      maxAlertHistory: options.maxAlertHistory || 1000,
      
      // Reporting
      enableRealTimeReporting: options.enableRealTimeReporting !== false,
      reportingInterval: options.reportingInterval || 300000, // 5 minutes
      
      ...options
    };
    
    // System components
    this.cache = getCacheManager();
    this.queryOptimizer = getQueryOptimizer();
    this.memoryManager = getMemoryManager();
    
    // Metrics storage
    this.metrics = {
      current: this.initializeMetrics(),
      history: [],
      aggregated: this.initializeAggregatedMetrics()
    };
    
    // Alert system
    this.alerts = {
      active: new Map(),
      history: [],
      rules: new Map()
    };
    
    // Performance baselines
    this.baselines = {
      cacheHitRate: 0.85,
      avgResponseTime: 200,
      errorRate: 0.01,
      memoryUsage: 0.7
    };
    
    // Analysis data
    this.performanceAnalysis = {
      trends: new Map(),
      anomalies: [],
      bottlenecks: [],
      recommendations: []
    };
    
    this.logger = options.logger || console;
    
    this.setupAlertRules();
    this.startMonitoring();
  }

  /**
   * Initialize metrics structure
   */
  initializeMetrics() {
    return {
      timestamp: Date.now(),
      cache: {
        hitRate: 0,
        missRate: 0,
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        avgResponseTime: 0,
        errorRate: 0,
        memoryUsage: 0,
        keyCount: 0
      },
      database: {
        totalQueries: 0,
        avgQueryTime: 0,
        slowQueries: 0,
        failedQueries: 0,
        connectionPoolUtilization: 0,
        cacheHitRate: 0
      },
      memory: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0,
        gcFrequency: 0,
        memoryLeaks: 0
      },
      system: {
        cpuUsage: 0,
        loadAverage: 0,
        uptime: 0,
        activeConnections: 0,
        requestsPerSecond: 0
      },
      application: {
        totalRequests: 0,
        avgResponseTime: 0,
        errorRate: 0,
        throughput: 0,
        concurrentUsers: 0
      }
    };
  }

  /**
   * Initialize aggregated metrics
   */
  initializeAggregatedMetrics() {
    return {
      last5Minutes: this.initializeMetrics(),
      lastHour: this.initializeMetrics(),
      last24Hours: this.initializeMetrics(),
      trends: {
        cacheHitRate: { direction: 'stable', change: 0 },
        responseTime: { direction: 'stable', change: 0 },
        errorRate: { direction: 'stable', change: 0 },
        memoryUsage: { direction: 'stable', change: 0 }
      }
    };
  }

  /**
   * Setup alert rules
   */
  setupAlertRules() {
    this.alerts.rules.set('low_cache_hit_rate', {
      condition: (metrics) => metrics.cache.hitRate < this.config.cacheHitRateThreshold,
      severity: 'warning',
      message: 'Cache hit rate below threshold',
      cooldown: 300000 // 5 minutes
    });
    
    this.alerts.rules.set('high_response_time', {
      condition: (metrics) => metrics.application.avgResponseTime > this.config.responseTimeThreshold,
      severity: 'warning',
      message: 'Average response time above threshold',
      cooldown: 300000
    });
    
    this.alerts.rules.set('high_error_rate', {
      condition: (metrics) => metrics.application.errorRate > this.config.errorRateThreshold,
      severity: 'critical',
      message: 'Error rate above acceptable threshold',
      cooldown: 180000 // 3 minutes
    });
    
    this.alerts.rules.set('high_memory_usage', {
      condition: (metrics) => metrics.memory.heapUsed / metrics.memory.heapTotal > this.config.memoryUsageThreshold,
      severity: 'critical',
      message: 'Memory usage critically high',
      cooldown: 300000
    });
    
    this.alerts.rules.set('database_slow_queries', {
      condition: (metrics) => metrics.database.slowQueries > 10,
      severity: 'warning',
      message: 'High number of slow database queries',
      cooldown: 600000 // 10 minutes
    });
    
    this.alerts.rules.set('connection_pool_saturation', {
      condition: (metrics) => metrics.database.connectionPoolUtilization > 0.9,
      severity: 'critical',
      message: 'Database connection pool near saturation',
      cooldown: 180000
    });
  }

  /**
   * Start monitoring services
   */
  startMonitoring() {
    // Metrics collection
    setInterval(() => {
      this.collectMetrics();
    }, this.config.metricsCollectionInterval);
    
    // Health checks
    setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
    
    // Performance analysis
    setInterval(() => {
      this.performPerformanceAnalysis();
    }, this.config.performanceAnalysisInterval);
    
    // Reporting
    if (this.config.enableRealTimeReporting) {
      setInterval(() => {
        this.generatePerformanceReport();
      }, this.config.reportingInterval);
    }
  }

  /**
   * Collect performance metrics
   */
  async collectMetrics() {
    try {
      const currentMetrics = this.initializeMetrics();
      currentMetrics.timestamp = Date.now();
      
      // Collect cache metrics
      await this.collectCacheMetrics(currentMetrics.cache);
      
      // Collect database metrics
      await this.collectDatabaseMetrics(currentMetrics.database);
      
      // Collect memory metrics
      await this.collectMemoryMetrics(currentMetrics.memory);
      
      // Collect system metrics
      await this.collectSystemMetrics(currentMetrics.system);
      
      // Collect application metrics
      await this.collectApplicationMetrics(currentMetrics.application);
      
      // Store current metrics
      this.metrics.current = currentMetrics;
      
      // Add to history
      this.addToMetricsHistory(currentMetrics);
      
      // Update aggregated metrics
      this.updateAggregatedMetrics(currentMetrics);
      
      // Check alerts
      this.checkAlerts(currentMetrics);
      
      // Emit metrics event
      this.emit('metrics:collected', currentMetrics);
      
    } catch (error) {
      this.logger.error('Failed to collect metrics:', error);
    }
  }

  /**
   * Collect cache-specific metrics
   */
  async collectCacheMetrics(cacheMetrics) {
    const cacheStats = this.cache.getStats();
    
    cacheMetrics.hitRate = cacheStats.hitRate / 100; // Convert to decimal
    cacheMetrics.missRate = (100 - cacheStats.hitRate) / 100;
    cacheMetrics.hits = cacheStats.hits;
    cacheMetrics.misses = cacheStats.misses;
    cacheMetrics.sets = cacheStats.sets;
    cacheMetrics.deletes = cacheStats.deletes;
    cacheMetrics.avgResponseTime = cacheStats.avgResponseTime;
    cacheMetrics.errorRate = cacheStats.totalRequests > 0 ? 
      cacheStats.errors / cacheStats.totalRequests : 0;
    cacheMetrics.memoryUsage = cacheStats.memoryCacheSize;
    cacheMetrics.keyCount = cacheStats.totalRequests; // Approximation
  }

  /**
   * Collect database-specific metrics
   */
  async collectDatabaseMetrics(dbMetrics) {
    if (this.queryOptimizer) {
      const queryStats = this.queryOptimizer.getPerformanceStats();
      
      dbMetrics.totalQueries = queryStats.queries.total;
      dbMetrics.avgQueryTime = queryStats.queries.avgExecutionTime;
      dbMetrics.slowQueries = queryStats.queries.slow;
      dbMetrics.failedQueries = queryStats.queries.failed;
      dbMetrics.connectionPoolUtilization = queryStats.connectionPool.utilizationPercent / 100;
      dbMetrics.cacheHitRate = queryStats.queries.cacheHitRate / 100;
    }
  }

  /**
   * Collect memory-specific metrics
   */
  async collectMemoryMetrics(memoryMetrics) {
    if (this.memoryManager) {
      const memoryHealth = this.memoryManager.getMemoryHealth();
      const memoryStats = memoryHealth.memory;
      
      // Parse memory values (assuming they're formatted strings)
      memoryMetrics.heapUsed = this.parseMemoryString(memoryStats.heapUsed);
      memoryMetrics.heapTotal = this.parseMemoryString(memoryStats.heapTotal);
      memoryMetrics.external = this.parseMemoryString(memoryStats.external);
      memoryMetrics.rss = this.parseMemoryString(memoryStats.rss);
      
      // GC and leak metrics
      if (memoryHealth.gc) {
        memoryMetrics.gcFrequency = memoryHealth.gc.minorGC + memoryHealth.gc.majorGC;
      }
      
      if (memoryHealth.recentLeaks) {
        memoryMetrics.memoryLeaks = memoryHealth.recentLeaks.length;
      }
    } else {
      // Fallback to process.memoryUsage()
      const memUsage = process.memoryUsage();
      memoryMetrics.heapUsed = memUsage.heapUsed;
      memoryMetrics.heapTotal = memUsage.heapTotal;
      memoryMetrics.external = memUsage.external;
      memoryMetrics.rss = memUsage.rss;
    }
  }

  /**
   * Collect system-specific metrics
   */
  async collectSystemMetrics(systemMetrics) {
    try {
      // CPU usage (if available)
      if (process.cpuUsage) {
        const cpuUsage = process.cpuUsage();
        systemMetrics.cpuUsage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
      }
      
      // Load average (Unix systems)
      if (process.platform !== 'win32') {
        try {
          const { loadavg } = require('os');
          systemMetrics.loadAverage = loadavg()[0]; // 1-minute average
        } catch (error) {
          // Not available on all systems
        }
      }
      
      // Uptime
      systemMetrics.uptime = process.uptime();
      
    } catch (error) {
      this.logger.warn('Failed to collect system metrics:', error);
    }
  }

  /**
   * Collect application-specific metrics
   */
  async collectApplicationMetrics(appMetrics) {
    // These would typically come from application middleware
    // For now, we'll use placeholder values that would be injected
    appMetrics.totalRequests = this.getApplicationMetric('totalRequests', 0);
    appMetrics.avgResponseTime = this.getApplicationMetric('avgResponseTime', 0);
    appMetrics.errorRate = this.getApplicationMetric('errorRate', 0);
    appMetrics.throughput = this.getApplicationMetric('throughput', 0);
    appMetrics.concurrentUsers = this.getApplicationMetric('concurrentUsers', 0);
  }

  getApplicationMetric(metricName, defaultValue) {
    // This would integrate with application metrics collection
    // For now, return default values
    return defaultValue;
  }

  /**
   * Add metrics to history with retention management
   */
  addToMetricsHistory(metrics) {
    this.metrics.history.push(metrics);
    
    // Maintain retention limit
    if (this.metrics.history.length > this.config.maxMetricsSamples) {
      this.metrics.history.shift();
    }
    
    // Remove old metrics based on time retention
    const retentionThreshold = Date.now() - (this.config.metricsRetentionHours * 3600000);
    this.metrics.history = this.metrics.history.filter(
      metric => metric.timestamp > retentionThreshold
    );
  }

  /**
   * Update aggregated metrics
   */
  updateAggregatedMetrics(currentMetrics) {
    const now = Date.now();
    
    // Update 5-minute aggregation
    this.updateTimeWindowMetrics('last5Minutes', 300000, currentMetrics);
    
    // Update hourly aggregation
    this.updateTimeWindowMetrics('lastHour', 3600000, currentMetrics);
    
    // Update 24-hour aggregation
    this.updateTimeWindowMetrics('last24Hours', 86400000, currentMetrics);
    
    // Update trends
    this.updatePerformanceTrends(currentMetrics);
  }

  updateTimeWindowMetrics(window, timeMs, currentMetrics) {
    const windowStart = Date.now() - timeMs;
    const windowMetrics = this.metrics.history.filter(
      metric => metric.timestamp > windowStart
    );
    
    if (windowMetrics.length === 0) return;
    
    // Aggregate metrics for the time window
    this.metrics.aggregated[window] = this.aggregateMetrics(windowMetrics);
  }

  aggregateMetrics(metricsArray) {
    if (metricsArray.length === 0) return this.initializeMetrics();
    
    const aggregated = this.initializeMetrics();
    const count = metricsArray.length;
    
    // Average cache metrics
    aggregated.cache.hitRate = this.average(metricsArray, 'cache.hitRate');
    aggregated.cache.avgResponseTime = this.average(metricsArray, 'cache.avgResponseTime');
    aggregated.cache.errorRate = this.average(metricsArray, 'cache.errorRate');
    
    // Average database metrics
    aggregated.database.avgQueryTime = this.average(metricsArray, 'database.avgQueryTime');
    aggregated.database.connectionPoolUtilization = this.average(metricsArray, 'database.connectionPoolUtilization');
    
    // Average memory metrics
    aggregated.memory.heapUsed = this.average(metricsArray, 'memory.heapUsed');
    aggregated.memory.heapTotal = this.average(metricsArray, 'memory.heapTotal');
    
    // Average application metrics
    aggregated.application.avgResponseTime = this.average(metricsArray, 'application.avgResponseTime');
    aggregated.application.errorRate = this.average(metricsArray, 'application.errorRate');
    
    // Sum totals
    aggregated.cache.hits = this.sum(metricsArray, 'cache.hits');
    aggregated.cache.misses = this.sum(metricsArray, 'cache.misses');
    aggregated.database.totalQueries = this.sum(metricsArray, 'database.totalQueries');
    
    return aggregated;
  }

  average(metricsArray, path) {
    const values = metricsArray.map(metric => this.getNestedValue(metric, path)).filter(v => v != null);
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  sum(metricsArray, path) {
    const values = metricsArray.map(metric => this.getNestedValue(metric, path)).filter(v => v != null);
    return values.reduce((a, b) => a + b, 0);
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  /**
   * Update performance trends
   */
  updatePerformanceTrends(currentMetrics) {
    const trends = this.metrics.aggregated.trends;
    const previous = this.metrics.history[this.metrics.history.length - 2];
    
    if (!previous) return;
    
    // Cache hit rate trend
    trends.cacheHitRate = this.calculateTrend(
      previous.cache.hitRate,
      currentMetrics.cache.hitRate
    );
    
    // Response time trend
    trends.responseTime = this.calculateTrend(
      previous.application.avgResponseTime,
      currentMetrics.application.avgResponseTime,
      true // Lower is better
    );
    
    // Error rate trend
    trends.errorRate = this.calculateTrend(
      previous.application.errorRate,
      currentMetrics.application.errorRate,
      true // Lower is better
    );
    
    // Memory usage trend
    const prevMemUsage = previous.memory.heapUsed / previous.memory.heapTotal;
    const currMemUsage = currentMetrics.memory.heapUsed / currentMetrics.memory.heapTotal;
    trends.memoryUsage = this.calculateTrend(prevMemUsage, currMemUsage, true);
  }

  calculateTrend(previous, current, lowerIsBetter = false) {
    const change = current - previous;
    const percentChange = previous > 0 ? (change / previous) * 100 : 0;
    
    let direction = 'stable';
    if (Math.abs(percentChange) > 5) { // 5% threshold
      if (lowerIsBetter) {
        direction = change < 0 ? 'improving' : 'degrading';
      } else {
        direction = change > 0 ? 'improving' : 'degrading';
      }
    }
    
    return { direction, change: percentChange };
  }

  /**
   * Check alert conditions
   */
  checkAlerts(metrics) {
    for (const [alertId, rule] of this.alerts.rules) {
      try {
        if (rule.condition(metrics)) {
          this.triggerAlert(alertId, rule, metrics);
        } else {
          this.resolveAlert(alertId);
        }
      } catch (error) {
        this.logger.error(`Alert check failed for ${alertId}:`, error);
      }
    }
  }

  triggerAlert(alertId, rule, metrics) {
    const existingAlert = this.alerts.active.get(alertId);
    
    // Check cooldown period
    if (existingAlert && 
        Date.now() - existingAlert.lastTriggered < rule.cooldown) {
      return;
    }
    
    const alert = {
      id: alertId,
      severity: rule.severity,
      message: rule.message,
      triggered: Date.now(),
      lastTriggered: Date.now(),
      metrics: { ...metrics },
      resolved: false,
      count: existingAlert ? existingAlert.count + 1 : 1
    };
    
    this.alerts.active.set(alertId, alert);
    this.addToAlertHistory(alert);
    
    this.emit('alert:triggered', alert);
    this.logger.warn(`Performance alert: ${alert.message}`, {
      severity: alert.severity,
      alertId,
      count: alert.count
    });
  }

  resolveAlert(alertId) {
    const alert = this.alerts.active.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      
      this.alerts.active.delete(alertId);
      
      this.emit('alert:resolved', alert);
      this.logger.info(`Performance alert resolved: ${alert.message}`);
    }
  }

  addToAlertHistory(alert) {
    this.alerts.history.push({ ...alert });
    
    // Maintain history limit
    if (this.alerts.history.length > this.config.maxAlertHistory) {
      this.alerts.history.shift();
    }
  }

  /**
   * Perform health check
   */
  async performHealthCheck() {
    try {
      const healthStatus = {
        timestamp: Date.now(),
        overall: 'healthy',
        components: {}
      };
      
      // Cache health
      const cacheHealth = await this.cache.getHealthStatus();
      healthStatus.components.cache = cacheHealth;
      
      // Database health
      if (this.queryOptimizer) {
        const dbHealth = await this.queryOptimizer.getConnectionPoolHealth();
        healthStatus.components.database = dbHealth;
      }
      
      // Memory health
      if (this.memoryManager) {
        const memHealth = this.memoryManager.getMemoryHealth();
        healthStatus.components.memory = memHealth;
      }
      
      // Determine overall health
      const componentStatuses = Object.values(healthStatus.components).map(c => c.status);
      if (componentStatuses.includes('critical') || componentStatuses.includes('unhealthy')) {
        healthStatus.overall = 'unhealthy';
      } else if (componentStatuses.includes('warning')) {
        healthStatus.overall = 'degraded';
      }
      
      this.emit('health:checked', healthStatus);
      
    } catch (error) {
      this.logger.error('Health check failed:', error);
      this.emit('health:checked', {
        timestamp: Date.now(),
        overall: 'unknown',
        error: error.message
      });
    }
  }

  /**
   * Perform performance analysis
   */
  performPerformanceAnalysis() {
    try {
      this.identifyBottlenecks();
      this.detectAnomalies();
      this.generateRecommendations();
      
      const analysis = {
        timestamp: Date.now(),
        bottlenecks: this.performanceAnalysis.bottlenecks,
        anomalies: this.performanceAnalysis.anomalies,
        recommendations: this.performanceAnalysis.recommendations,
        trends: this.metrics.aggregated.trends
      };
      
      this.emit('performance:analyzed', analysis);
      
    } catch (error) {
      this.logger.error('Performance analysis failed:', error);
    }
  }

  identifyBottlenecks() {
    this.performanceAnalysis.bottlenecks = [];
    const current = this.metrics.current;
    
    // Cache bottlenecks
    if (current.cache.hitRate < 0.7) {
      this.performanceAnalysis.bottlenecks.push({
        type: 'cache',
        severity: 'high',
        issue: 'Low cache hit rate',
        impact: 'Increased database load and response times',
        value: current.cache.hitRate
      });
    }
    
    // Database bottlenecks
    if (current.database.avgQueryTime > 1000) {
      this.performanceAnalysis.bottlenecks.push({
        type: 'database',
        severity: 'high',
        issue: 'Slow database queries',
        impact: 'High application response times',
        value: current.database.avgQueryTime
      });
    }
    
    // Memory bottlenecks
    const memUsage = current.memory.heapUsed / current.memory.heapTotal;
    if (memUsage > 0.8) {
      this.performanceAnalysis.bottlenecks.push({
        type: 'memory',
        severity: 'critical',
        issue: 'High memory usage',
        impact: 'Risk of out-of-memory errors and GC pressure',
        value: memUsage
      });
    }
  }

  detectAnomalies() {
    // Simple anomaly detection based on standard deviation
    this.performanceAnalysis.anomalies = [];
    
    if (this.metrics.history.length < 10) return; // Need enough data
    
    const recent = this.metrics.history.slice(-10);
    const current = this.metrics.current;
    
    // Check cache hit rate anomalies
    const hitRates = recent.map(m => m.cache.hitRate);
    const avgHitRate = hitRates.reduce((a, b) => a + b, 0) / hitRates.length;
    const stdDev = Math.sqrt(hitRates.reduce((sum, rate) => sum + Math.pow(rate - avgHitRate, 2), 0) / hitRates.length);
    
    if (Math.abs(current.cache.hitRate - avgHitRate) > stdDev * 2) {
      this.performanceAnalysis.anomalies.push({
        type: 'cache_hit_rate',
        severity: 'medium',
        description: 'Unusual cache hit rate detected',
        currentValue: current.cache.hitRate,
        expectedRange: [avgHitRate - stdDev, avgHitRate + stdDev]
      });
    }
  }

  generateRecommendations() {
    this.performanceAnalysis.recommendations = [];
    
    const current = this.metrics.current;
    const trends = this.metrics.aggregated.trends;
    
    // Cache recommendations
    if (current.cache.hitRate < 0.8) {
      this.performanceAnalysis.recommendations.push({
        category: 'cache',
        priority: 'high',
        title: 'Improve Cache Hit Rate',
        description: 'Current hit rate is below optimal threshold',
        actions: [
          'Increase cache TTL for stable data',
          'Review cache key strategies',
          'Implement cache warming for popular data',
          'Optimize cache eviction policies'
        ],
        expectedImpact: 'Reduced database load and improved response times'
      });
    }
    
    // Database recommendations
    if (current.database.slowQueries > 5) {
      this.performanceAnalysis.recommendations.push({
        category: 'database',
        priority: 'high',
        title: 'Optimize Database Queries',
        description: 'Multiple slow queries detected',
        actions: [
          'Add missing database indexes',
          'Optimize query execution plans',
          'Implement query result caching',
          'Consider read replicas for heavy read workloads'
        ],
        expectedImpact: 'Faster query execution and reduced database load'
      });
    }
    
    // Memory recommendations
    const memUsage = current.memory.heapUsed / current.memory.heapTotal;
    if (memUsage > 0.7 || trends.memoryUsage.direction === 'degrading') {
      this.performanceAnalysis.recommendations.push({
        category: 'memory',
        priority: 'medium',
        title: 'Optimize Memory Usage',
        description: 'Memory usage is high or increasing',
        actions: [
          'Review object lifecycle management',
          'Implement more aggressive cache cleanup',
          'Optimize data structures for memory efficiency',
          'Consider increasing heap size if appropriate'
        ],
        expectedImpact: 'Reduced memory pressure and GC overhead'
      });
    }
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport() {
    const report = {
      timestamp: Date.now(),
      summary: {
        overall: this.assessOverallPerformance(),
        cacheEfficiency: this.metrics.current.cache.hitRate,
        avgResponseTime: this.metrics.current.application.avgResponseTime,
        errorRate: this.metrics.current.application.errorRate,
        memoryUsage: this.metrics.current.memory.heapUsed / this.metrics.current.memory.heapTotal
      },
      trends: this.metrics.aggregated.trends,
      activeAlerts: Array.from(this.alerts.active.values()),
      topIssues: this.getTopPerformanceIssues(),
      recommendations: this.performanceAnalysis.recommendations.slice(0, 5),
      metrics: {
        current: this.metrics.current,
        aggregated: {
          last5Minutes: this.metrics.aggregated.last5Minutes,
          lastHour: this.metrics.aggregated.lastHour
        }
      }
    };
    
    this.emit('performance:report', report);
    
    if (this.config.enableRealTimeReporting) {
      this.logger.info('Performance Report Generated', {
        overall: report.summary.overall,
        cacheHitRate: Math.round(report.summary.cacheEfficiency * 100) + '%',
        avgResponseTime: Math.round(report.summary.avgResponseTime) + 'ms',
        activeAlerts: report.activeAlerts.length,
        recommendations: report.recommendations.length
      });
    }
    
    return report;
  }

  assessOverallPerformance() {
    const current = this.metrics.current;
    let score = 100;
    
    // Cache performance impact
    if (current.cache.hitRate < 0.5) score -= 30;
    else if (current.cache.hitRate < 0.7) score -= 15;
    else if (current.cache.hitRate < 0.8) score -= 5;
    
    // Response time impact
    if (current.application.avgResponseTime > 2000) score -= 25;
    else if (current.application.avgResponseTime > 1000) score -= 15;
    else if (current.application.avgResponseTime > 500) score -= 5;
    
    // Error rate impact
    if (current.application.errorRate > 0.1) score -= 40;
    else if (current.application.errorRate > 0.05) score -= 20;
    else if (current.application.errorRate > 0.01) score -= 5;
    
    // Memory usage impact
    const memUsage = current.memory.heapUsed / current.memory.heapTotal;
    if (memUsage > 0.9) score -= 30;
    else if (memUsage > 0.8) score -= 15;
    else if (memUsage > 0.7) score -= 5;
    
    score = Math.max(0, score);
    
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 50) return 'fair';
    if (score >= 25) return 'poor';
    return 'critical';
  }

  getTopPerformanceIssues() {
    const issues = [
      ...this.performanceAnalysis.bottlenecks,
      ...this.performanceAnalysis.anomalies
    ];
    
    return issues
      .sort((a, b) => {
        const severityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })
      .slice(0, 5);
  }

  /**
   * Utility methods
   */
  
  parseMemoryString(memStr) {
    if (typeof memStr === 'number') return memStr;
    if (typeof memStr !== 'string') return 0;
    
    const units = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
    const match = memStr.match(/^([\d.]+)\s*(\w+)$/);
    
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2];
      return value * (units[unit] || 1);
    }
    
    return 0;
  }

  /**
   * Get current performance status
   */
  getPerformanceStatus() {
    return {
      timestamp: Date.now(),
      current: this.metrics.current,
      aggregated: this.metrics.aggregated,
      alerts: {
        active: Array.from(this.alerts.active.values()),
        total: this.alerts.history.length
      },
      analysis: this.performanceAnalysis,
      health: this.assessOverallPerformance()
    };
  }

  /**
   * Reset metrics and analysis
   */
  reset() {
    this.metrics.history = [];
    this.metrics.aggregated = this.initializeAggregatedMetrics();
    this.performanceAnalysis = {
      trends: new Map(),
      anomalies: [],
      bottlenecks: [],
      recommendations: []
    };
    this.alerts.active.clear();
  }

  /**
   * Shutdown monitoring
   */
  shutdown() {
    this.emit('shutdown');
    this.removeAllListeners();
  }
}

// Create singleton instance
let globalPerformanceMonitor = null;

export function createPerformanceMonitor(options = {}) {
  return new PerformanceMonitor(options);
}

export function getPerformanceMonitor(options = {}) {
  if (!globalPerformanceMonitor) {
    globalPerformanceMonitor = new PerformanceMonitor(options);
  }
  return globalPerformanceMonitor;
}

export default PerformanceMonitor;