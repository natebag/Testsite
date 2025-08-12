/**
 * @fileoverview CDN Monitoring and Analytics System
 * Handles performance monitoring, cost tracking, and analytics for CDN operations
 */

import { EventEmitter } from 'events';

/**
 * CDN Monitoring Manager
 */
export class CDNMonitoringManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Monitoring intervals
      metricsInterval: config.metricsInterval || 30000, // 30 seconds
      aggregationInterval: config.aggregationInterval || 300000, // 5 minutes
      retentionPeriod: config.retentionPeriod || 2592000000, // 30 days
      
      // Alert thresholds
      alerts: {
        errorRate: config.alerts?.errorRate || 5, // percent
        latencyThreshold: config.alerts?.latencyThreshold || 500, // ms
        availabilityThreshold: config.alerts?.availabilityThreshold || 99.5, // percent
        bandwidthThreshold: config.alerts?.bandwidthThreshold || 10737418240, // 10GB
        costThreshold: config.alerts?.costThreshold || 1000, // USD
        ...config.alerts
      },
      
      // Cost tracking
      costTracking: {
        enabled: config.costTracking?.enabled !== false,
        currency: config.costTracking?.currency || 'USD',
        billing: {
          // CDN pricing tiers (per GB)
          bandwidthCosts: {
            'us-east': 0.085,
            'us-west': 0.085,
            'europe': 0.085,
            'asia-pacific': 0.12,
            'default': 0.085
          },
          // Requests pricing (per 10,000 requests)
          requestCosts: {
            http: 0.0075,
            https: 0.01
          },
          // Additional features
          additionalCosts: {
            real_time_logs: 0.01, // per million log lines
            bot_management: 5.00, // per million requests
            image_optimization: 1.00 // per 1,000 optimizations
          }
        },
        ...config.costTracking
      },
      
      ...config
    };
    
    // Monitoring data stores
    this.realTimeMetrics = new Map();
    this.historicalMetrics = [];
    this.alerts = [];
    this.costData = new Map();
    this.providerMetrics = new Map();
    this.regionalMetrics = new Map();
    
    // Performance tracking
    this.requestMetrics = {
      total: 0,
      successful: 0,
      failed: 0,
      bytes: 0,
      responseTimeSum: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    
    this.initializeMonitoring();
  }

  /**
   * Initialize monitoring system
   */
  initializeMonitoring() {
    this.startMetricsCollection();
    this.startAggregation();
    this.setupAlertSystem();
    this.loadHistoricalData();
  }

  /**
   * Record request metrics
   * @param {Object} request - Request data
   */
  recordRequest(request) {
    const {
      provider,
      region,
      path,
      method,
      status,
      responseTime,
      bytes,
      cacheStatus,
      userAgent,
      ip,
      timestamp = Date.now()
    } = request;
    
    // Update request metrics
    this.requestMetrics.total++;
    this.requestMetrics.bytes += bytes || 0;
    this.requestMetrics.responseTimeSum += responseTime || 0;
    
    if (status >= 200 && status < 300) {
      this.requestMetrics.successful++;
    } else {
      this.requestMetrics.failed++;
    }
    
    if (cacheStatus === 'HIT') {
      this.requestMetrics.cacheHits++;
    } else if (cacheStatus === 'MISS') {
      this.requestMetrics.cacheMisses++;
    }
    
    // Record provider-specific metrics
    this.recordProviderMetrics(provider, {
      requests: 1,
      bytes: bytes || 0,
      responseTime: responseTime || 0,
      status,
      cacheStatus
    });
    
    // Record regional metrics
    this.recordRegionalMetrics(region, {
      requests: 1,
      bytes: bytes || 0,
      responseTime: responseTime || 0
    });
    
    // Update cost tracking
    if (this.config.costTracking.enabled) {
      this.updateCostTracking(provider, region, bytes || 0, 1);
    }
    
    // Emit real-time event
    this.emit('requestRecorded', {
      provider,
      region,
      status,
      responseTime,
      bytes,
      cacheStatus,
      timestamp
    });
  }

  /**
   * Record provider-specific metrics
   * @param {string} provider - Provider name
   * @param {Object} metrics - Metrics data
   */
  recordProviderMetrics(provider, metrics) {
    if (!this.providerMetrics.has(provider)) {
      this.providerMetrics.set(provider, {
        requests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalBytes: 0,
        responseTimeSum: 0,
        cacheHits: 0,
        cacheMisses: 0,
        avgResponseTime: 0,
        errorRate: 0,
        cacheHitRate: 0,
        lastUpdated: Date.now()
      });
    }
    
    const providerData = this.providerMetrics.get(provider);
    
    providerData.requests += metrics.requests;
    providerData.totalBytes += metrics.bytes;
    providerData.responseTimeSum += metrics.responseTime;
    
    if (metrics.status >= 200 && metrics.status < 300) {
      providerData.successfulRequests++;
    } else {
      providerData.failedRequests++;
    }
    
    if (metrics.cacheStatus === 'HIT') {
      providerData.cacheHits++;
    } else if (metrics.cacheStatus === 'MISS') {
      providerData.cacheMisses++;
    }
    
    // Update calculated metrics
    providerData.avgResponseTime = providerData.responseTimeSum / providerData.requests;
    providerData.errorRate = (providerData.failedRequests / providerData.requests) * 100;
    const totalCacheRequests = providerData.cacheHits + providerData.cacheMisses;
    providerData.cacheHitRate = totalCacheRequests > 0 ? 
      (providerData.cacheHits / totalCacheRequests) * 100 : 0;
    providerData.lastUpdated = Date.now();
  }

  /**
   * Record regional metrics
   * @param {string} region - Region name
   * @param {Object} metrics - Metrics data
   */
  recordRegionalMetrics(region, metrics) {
    if (!this.regionalMetrics.has(region)) {
      this.regionalMetrics.set(region, {
        requests: 0,
        totalBytes: 0,
        responseTimeSum: 0,
        avgResponseTime: 0,
        bandwidthMbps: 0,
        lastUpdated: Date.now()
      });
    }
    
    const regionData = this.regionalMetrics.get(region);
    
    regionData.requests += metrics.requests;
    regionData.totalBytes += metrics.bytes;
    regionData.responseTimeSum += metrics.responseTime;
    regionData.avgResponseTime = regionData.responseTimeSum / regionData.requests;
    regionData.lastUpdated = Date.now();
  }

  /**
   * Update cost tracking
   * @param {string} provider - Provider name
   * @param {string} region - Region name
   * @param {number} bytes - Bytes transferred
   * @param {number} requests - Number of requests
   */
  updateCostTracking(provider, region, bytes, requests) {
    const costKey = `${provider}_${region}`;
    
    if (!this.costData.has(costKey)) {
      this.costData.set(costKey, {
        provider,
        region,
        bandwidth: {
          bytes: 0,
          cost: 0
        },
        requests: {
          http: 0,
          https: 0,
          cost: 0
        },
        additional: {
          optimizations: 0,
          cost: 0
        },
        totalCost: 0,
        lastUpdated: Date.now()
      });
    }
    
    const costData = this.costData.get(costKey);
    
    // Update bandwidth costs
    costData.bandwidth.bytes += bytes;
    const bandwidthGB = costData.bandwidth.bytes / (1024 * 1024 * 1024);
    const bandwidthRate = this.config.costTracking.billing.bandwidthCosts[region] || 
                         this.config.costTracking.billing.bandwidthCosts.default;
    costData.bandwidth.cost = bandwidthGB * bandwidthRate;
    
    // Update request costs (assume HTTPS for now)
    costData.requests.https += requests;
    const requestGroups = Math.ceil(costData.requests.https / 10000);
    costData.requests.cost = requestGroups * this.config.costTracking.billing.requestCosts.https;
    
    // Calculate total cost
    costData.totalCost = costData.bandwidth.cost + costData.requests.cost + costData.additional.cost;
    costData.lastUpdated = Date.now();
  }

  /**
   * Start real-time metrics collection
   */
  startMetricsCollection() {
    setInterval(() => {
      this.collectRealTimeMetrics();
    }, this.config.metricsInterval);
  }

  /**
   * Collect real-time metrics snapshot
   */
  collectRealTimeMetrics() {
    const timestamp = Date.now();
    const timeWindow = this.config.metricsInterval;
    
    // Calculate current rates
    const requestRate = (this.requestMetrics.total / (timeWindow / 1000)) || 0;
    const errorRate = this.requestMetrics.total > 0 ? 
      (this.requestMetrics.failed / this.requestMetrics.total) * 100 : 0;
    const avgResponseTime = this.requestMetrics.total > 0 ?
      this.requestMetrics.responseTimeSum / this.requestMetrics.total : 0;
    const cacheHitRate = (this.requestMetrics.cacheHits + this.requestMetrics.cacheMisses) > 0 ?
      (this.requestMetrics.cacheHits / (this.requestMetrics.cacheHits + this.requestMetrics.cacheMisses)) * 100 : 0;
    const bandwidthMbps = (this.requestMetrics.bytes * 8) / (timeWindow / 1000) / (1024 * 1024);
    
    const metrics = {
      timestamp,
      requests: {
        total: this.requestMetrics.total,
        successful: this.requestMetrics.successful,
        failed: this.requestMetrics.failed,
        rate: requestRate
      },
      performance: {
        avgResponseTime,
        errorRate,
        availability: this.requestMetrics.total > 0 ? 
          (this.requestMetrics.successful / this.requestMetrics.total) * 100 : 100
      },
      cache: {
        hits: this.requestMetrics.cacheHits,
        misses: this.requestMetrics.cacheMisses,
        hitRate: cacheHitRate
      },
      bandwidth: {
        bytes: this.requestMetrics.bytes,
        mbps: bandwidthMbps
      },
      providers: Object.fromEntries(this.providerMetrics),
      regions: Object.fromEntries(this.regionalMetrics)
    };
    
    this.realTimeMetrics.set(timestamp, metrics);
    
    // Keep only last hour of real-time data
    const cutoff = timestamp - 3600000; // 1 hour
    for (const [ts] of this.realTimeMetrics) {
      if (ts < cutoff) {
        this.realTimeMetrics.delete(ts);
      }
    }
    
    // Check for alerts
    this.checkAlerts(metrics);
    
    // Reset counters for next interval
    this.resetRequestMetrics();
    
    this.emit('metricsCollected', metrics);
  }

  /**
   * Start aggregation process
   */
  startAggregation() {
    setInterval(() => {
      this.aggregateMetrics();
    }, this.config.aggregationInterval);
  }

  /**
   * Aggregate metrics for historical storage
   */
  aggregateMetrics() {
    const now = Date.now();
    const windowStart = now - this.config.aggregationInterval;
    
    // Get real-time metrics from the window
    const windowMetrics = Array.from(this.realTimeMetrics.entries())
      .filter(([timestamp]) => timestamp >= windowStart)
      .map(([_, metrics]) => metrics);
    
    if (windowMetrics.length === 0) return;
    
    // Aggregate the metrics
    const aggregated = this.aggregateMetricsData(windowMetrics);
    aggregated.timestamp = now;
    aggregated.windowStart = windowStart;
    aggregated.windowSize = this.config.aggregationInterval;
    
    // Store historical data
    this.historicalMetrics.push(aggregated);
    
    // Clean up old historical data
    const retentionCutoff = now - this.config.retentionPeriod;
    this.historicalMetrics = this.historicalMetrics.filter(
      metrics => metrics.timestamp >= retentionCutoff
    );
    
    this.emit('metricsAggregated', aggregated);
  }

  /**
   * Aggregate metrics data from multiple samples
   * @param {Array} metricsArray - Array of metrics samples
   * @returns {Object} - Aggregated metrics
   */
  aggregateMetricsData(metricsArray) {
    if (metricsArray.length === 0) return {};
    
    const totals = metricsArray.reduce((acc, metrics) => {
      acc.requests.total += metrics.requests.total;
      acc.requests.successful += metrics.requests.successful;
      acc.requests.failed += metrics.requests.failed;
      acc.bandwidth.bytes += metrics.bandwidth.bytes;
      acc.cache.hits += metrics.cache.hits;
      acc.cache.misses += metrics.cache.misses;
      acc.responseTimeSum += metrics.performance.avgResponseTime * metrics.requests.total;
      return acc;
    }, {
      requests: { total: 0, successful: 0, failed: 0 },
      bandwidth: { bytes: 0 },
      cache: { hits: 0, misses: 0 },
      responseTimeSum: 0
    });
    
    return {
      requests: {
        total: totals.requests.total,
        successful: totals.requests.successful,
        failed: totals.requests.failed,
        rate: totals.requests.total / (this.config.aggregationInterval / 1000)
      },
      performance: {
        avgResponseTime: totals.requests.total > 0 ? 
          totals.responseTimeSum / totals.requests.total : 0,
        errorRate: totals.requests.total > 0 ? 
          (totals.requests.failed / totals.requests.total) * 100 : 0,
        availability: totals.requests.total > 0 ? 
          (totals.requests.successful / totals.requests.total) * 100 : 100
      },
      cache: {
        hits: totals.cache.hits,
        misses: totals.cache.misses,
        hitRate: (totals.cache.hits + totals.cache.misses) > 0 ?
          (totals.cache.hits / (totals.cache.hits + totals.cache.misses)) * 100 : 0
      },
      bandwidth: {
        bytes: totals.bandwidth.bytes,
        mbps: (totals.bandwidth.bytes * 8) / (this.config.aggregationInterval / 1000) / (1024 * 1024)
      }
    };
  }

  /**
   * Setup alert system
   */
  setupAlertSystem() {
    this.on('metricsCollected', (metrics) => {
      // No additional setup needed - alerts are checked in collectRealTimeMetrics
    });
  }

  /**
   * Check metrics against alert thresholds
   * @param {Object} metrics - Current metrics
   */
  checkAlerts(metrics) {
    const alerts = [];
    const thresholds = this.config.alerts;
    
    // Error rate alert
    if (metrics.performance.errorRate > thresholds.errorRate) {
      alerts.push({
        type: 'error_rate',
        severity: metrics.performance.errorRate > thresholds.errorRate * 2 ? 'critical' : 'warning',
        message: `Error rate ${metrics.performance.errorRate.toFixed(2)}% exceeds threshold ${thresholds.errorRate}%`,
        value: metrics.performance.errorRate,
        threshold: thresholds.errorRate,
        timestamp: Date.now()
      });
    }
    
    // Latency alert
    if (metrics.performance.avgResponseTime > thresholds.latencyThreshold) {
      alerts.push({
        type: 'high_latency',
        severity: metrics.performance.avgResponseTime > thresholds.latencyThreshold * 2 ? 'critical' : 'warning',
        message: `Average response time ${metrics.performance.avgResponseTime.toFixed(2)}ms exceeds threshold ${thresholds.latencyThreshold}ms`,
        value: metrics.performance.avgResponseTime,
        threshold: thresholds.latencyThreshold,
        timestamp: Date.now()
      });
    }
    
    // Availability alert
    if (metrics.performance.availability < thresholds.availabilityThreshold) {
      alerts.push({
        type: 'low_availability',
        severity: metrics.performance.availability < thresholds.availabilityThreshold * 0.8 ? 'critical' : 'warning',
        message: `Availability ${metrics.performance.availability.toFixed(2)}% below threshold ${thresholds.availabilityThreshold}%`,
        value: metrics.performance.availability,
        threshold: thresholds.availabilityThreshold,
        timestamp: Date.now()
      });
    }
    
    // Bandwidth alert
    if (metrics.bandwidth.bytes > thresholds.bandwidthThreshold) {
      alerts.push({
        type: 'high_bandwidth',
        severity: 'warning',
        message: `Bandwidth usage ${(metrics.bandwidth.bytes / (1024 * 1024 * 1024)).toFixed(2)}GB exceeds threshold ${(thresholds.bandwidthThreshold / (1024 * 1024 * 1024)).toFixed(2)}GB`,
        value: metrics.bandwidth.bytes,
        threshold: thresholds.bandwidthThreshold,
        timestamp: Date.now()
      });
    }
    
    // Cost alerts
    if (this.config.costTracking.enabled) {
      const totalCost = this.getTotalCost();
      if (totalCost > thresholds.costThreshold) {
        alerts.push({
          type: 'high_cost',
          severity: totalCost > thresholds.costThreshold * 1.5 ? 'critical' : 'warning',
          message: `Total cost $${totalCost.toFixed(2)} exceeds threshold $${thresholds.costThreshold}`,
          value: totalCost,
          threshold: thresholds.costThreshold,
          timestamp: Date.now()
        });
      }
    }
    
    // Process new alerts
    alerts.forEach(alert => {
      this.processAlert(alert);
    });
  }

  /**
   * Process and store alert
   * @param {Object} alert - Alert data
   */
  processAlert(alert) {
    // Check if this is a duplicate recent alert
    const recentAlerts = this.alerts.filter(
      a => a.type === alert.type && 
           (Date.now() - a.timestamp) < 300000 // 5 minutes
    );
    
    if (recentAlerts.length > 0) {
      return; // Skip duplicate alerts
    }
    
    // Store alert
    this.alerts.push(alert);
    
    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts.shift();
    }
    
    // Emit alert event
    this.emit('alert', alert);
    
    console.warn(`🚨 CDN Alert [${alert.severity.toUpperCase()}]: ${alert.message}`);
  }

  /**
   * Get total cost across all providers and regions
   * @returns {number} - Total cost
   */
  getTotalCost() {
    return Array.from(this.costData.values())
      .reduce((total, data) => total + data.totalCost, 0);
  }

  /**
   * Reset request metrics for next collection cycle
   */
  resetRequestMetrics() {
    this.requestMetrics = {
      total: 0,
      successful: 0,
      failed: 0,
      bytes: 0,
      responseTimeSum: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  /**
   * Load historical data (in production, this would load from database)
   */
  loadHistoricalData() {
    // Mock historical data loading
    console.log('Loading historical CDN metrics...');
  }

  /**
   * Get real-time metrics
   * @returns {Object} - Current real-time metrics
   */
  getRealTimeMetrics() {
    const latest = Array.from(this.realTimeMetrics.values()).slice(-1)[0];
    return latest || {};
  }

  /**
   * Get historical metrics with filtering
   * @param {Object} filters - Query filters
   * @returns {Array} - Filtered historical metrics
   */
  getHistoricalMetrics(filters = {}) {
    let metrics = [...this.historicalMetrics];
    
    if (filters.startTime) {
      metrics = metrics.filter(m => m.timestamp >= filters.startTime);
    }
    
    if (filters.endTime) {
      metrics = metrics.filter(m => m.timestamp <= filters.endTime);
    }
    
    if (filters.limit) {
      metrics = metrics.slice(-filters.limit);
    }
    
    return metrics;
  }

  /**
   * Get cost breakdown
   * @param {Object} filters - Cost filters
   * @returns {Object} - Cost breakdown
   */
  getCostBreakdown(filters = {}) {
    const breakdown = {
      total: 0,
      byProvider: {},
      byRegion: {},
      byType: {
        bandwidth: 0,
        requests: 0,
        additional: 0
      }
    };
    
    for (const [key, data] of this.costData) {
      if (filters.provider && data.provider !== filters.provider) continue;
      if (filters.region && data.region !== filters.region) continue;
      
      breakdown.total += data.totalCost;
      
      breakdown.byProvider[data.provider] = 
        (breakdown.byProvider[data.provider] || 0) + data.totalCost;
      
      breakdown.byRegion[data.region] = 
        (breakdown.byRegion[data.region] || 0) + data.totalCost;
      
      breakdown.byType.bandwidth += data.bandwidth.cost;
      breakdown.byType.requests += data.requests.cost;
      breakdown.byType.additional += data.additional.cost;
    }
    
    return breakdown;
  }

  /**
   * Get performance summary
   * @param {Object} timeRange - Time range for summary
   * @returns {Object} - Performance summary
   */
  getPerformanceSummary(timeRange = {}) {
    const { startTime, endTime } = timeRange;
    const now = Date.now();
    const start = startTime || (now - 3600000); // Last hour
    const end = endTime || now;
    
    const metrics = this.getHistoricalMetrics({ startTime: start, endTime: end });
    
    if (metrics.length === 0) {
      return { message: 'No data available for the specified time range' };
    }
    
    // Aggregate metrics for summary
    const totals = metrics.reduce((acc, m) => ({
      requests: acc.requests + m.requests.total,
      successful: acc.successful + m.requests.successful,
      failed: acc.failed + m.requests.failed,
      bytes: acc.bytes + m.bandwidth.bytes,
      responseTimeSum: acc.responseTimeSum + (m.performance.avgResponseTime * m.requests.total),
      cacheHits: acc.cacheHits + m.cache.hits,
      cacheMisses: acc.cacheMisses + m.cache.misses
    }), {
      requests: 0, successful: 0, failed: 0, bytes: 0, 
      responseTimeSum: 0, cacheHits: 0, cacheMisses: 0
    });
    
    return {
      timeRange: { start: new Date(start), end: new Date(end) },
      requests: {
        total: totals.requests,
        successful: totals.successful,
        failed: totals.failed,
        successRate: totals.requests > 0 ? 
          (totals.successful / totals.requests) * 100 : 0
      },
      performance: {
        avgResponseTime: totals.requests > 0 ? 
          totals.responseTimeSum / totals.requests : 0,
        availability: totals.requests > 0 ? 
          (totals.successful / totals.requests) * 100 : 100
      },
      cache: {
        hits: totals.cacheHits,
        misses: totals.cacheMisses,
        hitRate: (totals.cacheHits + totals.cacheMisses) > 0 ?
          (totals.cacheHits / (totals.cacheHits + totals.cacheMisses)) * 100 : 0
      },
      bandwidth: {
        total: totals.bytes,
        totalGB: totals.bytes / (1024 * 1024 * 1024)
      }
    };
  }

  /**
   * Get active alerts
   * @param {string} severity - Filter by severity
   * @returns {Array} - Active alerts
   */
  getActiveAlerts(severity = null) {
    const cutoff = Date.now() - 3600000; // Last hour
    let alerts = this.alerts.filter(alert => alert.timestamp >= cutoff);
    
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    
    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Export metrics data
   * @param {Object} options - Export options
   * @returns {Object} - Exported data
   */
  exportMetrics(options = {}) {
    const {
      format = 'json',
      timeRange = {},
      includeRealTime = true,
      includeHistorical = true,
      includeCosts = true,
      includeAlerts = true
    } = options;
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      timeRange: timeRange
    };
    
    if (includeRealTime) {
      exportData.realTimeMetrics = Array.from(this.realTimeMetrics.entries())
        .map(([timestamp, metrics]) => ({ timestamp, ...metrics }));
    }
    
    if (includeHistorical) {
      exportData.historicalMetrics = this.getHistoricalMetrics(timeRange);
    }
    
    if (includeCosts && this.config.costTracking.enabled) {
      exportData.costs = {
        breakdown: this.getCostBreakdown(),
        details: Object.fromEntries(this.costData)
      };
    }
    
    if (includeAlerts) {
      exportData.alerts = this.getActiveAlerts();
    }
    
    return exportData;
  }

  /**
   * Shutdown monitoring system
   */
  shutdown() {
    this.removeAllListeners();
    console.log('CDN monitoring system shutdown');
  }
}

/**
 * Create and export default CDN monitoring manager
 */
export const cdnMonitoringManager = new CDNMonitoringManager();

/**
 * Express middleware for CDN monitoring
 * @param {Object} options - Middleware options
 * @returns {Function} - Express middleware function
 */
export function cdnMonitoringMiddleware(options = {}) {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Override end method to capture metrics
    const originalEnd = res.end;
    
    res.end = function(chunk, encoding) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Record request metrics
      cdnMonitoringManager.recordRequest({
        provider: req.cdnProvider || 'unknown',
        region: req.cdnRegion || 'unknown',
        path: req.path,
        method: req.method,
        status: res.statusCode,
        responseTime,
        bytes: res.get('content-length') || (chunk ? Buffer.byteLength(chunk) : 0),
        cacheStatus: res.get('x-cache') || 'MISS',
        userAgent: req.get('user-agent'),
        ip: req.ip,
        timestamp: startTime
      });
      
      originalEnd.call(this, chunk, encoding);
    };
    
    next();
  };
}