/**
 * Cache Monitoring and Performance Analytics
 * Implements comprehensive monitoring for cache hit rates, performance metrics,
 * and cache effectiveness analysis
 */

/**
 * Performance thresholds and targets
 */
export const PERFORMANCE_THRESHOLDS = {
  // Cache hit rate targets
  CACHE_HIT_RATES: {
    excellent: 0.95,   // 95%+
    good: 0.85,        // 85%+
    acceptable: 0.70,  // 70%+
    poor: 0.50         // Below 50% needs attention
  },
  
  // Response time targets (milliseconds)
  RESPONSE_TIMES: {
    excellent: 50,     // Under 50ms
    good: 100,         // Under 100ms
    acceptable: 200,   // Under 200ms
    poor: 500          // Over 500ms needs attention
  },
  
  // Cache miss penalties
  CACHE_MISS_IMPACT: {
    critical: 1000,    // Critical assets > 1s penalty
    high: 500,         // High priority > 500ms
    medium: 200,       // Medium priority > 200ms
    low: 100           // Low priority > 100ms
  }
};

/**
 * Monitoring event types
 */
export const MONITORING_EVENTS = {
  CACHE_HIT: 'cache_hit',
  CACHE_MISS: 'cache_miss',
  CACHE_STORE: 'cache_store',
  CACHE_INVALIDATE: 'cache_invalidate',
  CACHE_ERROR: 'cache_error',
  PERFORMANCE_MARK: 'performance_mark',
  NETWORK_REQUEST: 'network_request',
  RESOURCE_TIMING: 'resource_timing'
};

/**
 * Cache Performance Monitor
 * Tracks cache effectiveness, hit rates, and performance metrics
 */
export class CachePerformanceMonitor {
  constructor(options = {}) {
    this.options = {
      enableRealTimeMonitoring: true,
      enablePerformanceAPI: true,
      enableResourceTiming: true,
      enableNetworkMonitoring: true,
      sampleRate: 1.0, // 100% sampling by default
      aggregationInterval: 60000, // 1 minute
      retentionPeriod: 86400000, // 24 hours
      enableAnalytics: true,
      analyticsEndpoint: '/api/cache-analytics',
      ...options
    };
    
    this.metrics = {
      hits: 0,
      misses: 0,
      stores: 0,
      invalidations: 0,
      errors: 0,
      totalRequests: 0,
      totalResponseTime: 0,
      bytesSaved: 0
    };
    
    this.detailedMetrics = new Map(); // Per-resource metrics
    this.performanceEntries = [];
    this.realtimeData = [];
    this.aggregatedData = [];
    this.startTime = Date.now();
    
    this.init();
  }

  /**
   * Initialize cache monitoring
   */
  init() {
    try {
      // Set up performance API monitoring
      if (this.options.enablePerformanceAPI && 'performance' in window) {
        this.setupPerformanceMonitoring();
      }
      
      // Set up resource timing monitoring
      if (this.options.enableResourceTiming) {
        this.setupResourceTimingMonitoring();
      }
      
      // Set up network monitoring
      if (this.options.enableNetworkMonitoring) {
        this.setupNetworkMonitoring();
      }
      
      // Set up real-time monitoring
      if (this.options.enableRealTimeMonitoring) {
        this.setupRealTimeMonitoring();
      }
      
      // Set up data aggregation
      this.setupDataAggregation();
      
      console.log('[CacheMonitoring] Performance monitor initialized');
    } catch (error) {
      console.error('[CacheMonitoring] Initialization failed:', error);
    }
  }

  /**
   * Set up Performance API monitoring
   */
  setupPerformanceMonitoring() {
    if (!performance.mark) return;
    
    // Create performance observer
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          this.processPerformanceEntry(entry);
        });
      });
      
      // Observe various entry types
      observer.observe({ 
        entryTypes: ['mark', 'measure', 'navigation', 'resource', 'paint'] 
      });
      
      this.performanceObserver = observer;
    } catch (error) {
      console.warn('[CacheMonitoring] Performance observer not available:', error);
    }
  }

  /**
   * Set up resource timing monitoring
   */
  setupResourceTimingMonitoring() {
    // Monitor resource loading performance
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const [resource] = args;
      const url = typeof resource === 'string' ? resource : resource.url;
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Record fetch performance
        this.recordNetworkRequest(url, duration, response.ok, false);
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.recordNetworkRequest(url, duration, false, false);
        throw error;
      }
    };
  }

  /**
   * Set up network monitoring
   */
  setupNetworkMonitoring() {
    // Monitor navigator.connection if available
    if ('connection' in navigator) {
      this.networkConnection = navigator.connection;
      
      this.networkConnection.addEventListener('change', () => {
        this.recordNetworkChange();
      });
    }
    
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.recordNetworkStatus('online');
    });
    
    window.addEventListener('offline', () => {
      this.recordNetworkStatus('offline');
    });
  }

  /**
   * Set up real-time monitoring
   */
  setupRealTimeMonitoring() {
    // Sample requests based on sample rate
    this.shouldSample = () => Math.random() < this.options.sampleRate;
    
    // Create real-time data stream
    this.realtimeStream = {
      subscribers: new Set(),
      subscribe: (callback) => this.realtimeStream.subscribers.add(callback),
      unsubscribe: (callback) => this.realtimeStream.subscribers.delete(callback),
      publish: (data) => {
        this.realtimeStream.subscribers.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.warn('[CacheMonitoring] Subscriber error:', error);
          }
        });
      }
    };
  }

  /**
   * Set up data aggregation
   */
  setupDataAggregation() {
    // Aggregate data periodically
    setInterval(() => {
      this.aggregateMetrics();
      this.cleanupOldData();
    }, this.options.aggregationInterval);
    
    // Send analytics data
    if (this.options.enableAnalytics) {
      setInterval(() => {
        this.sendAnalytics();
      }, this.options.aggregationInterval * 5); // Every 5 minutes
    }
  }

  /**
   * Record cache hit
   */
  recordCacheHit(resource, responseTime = 0, source = 'unknown') {
    if (!this.shouldSample()) return;
    
    this.metrics.hits++;
    this.metrics.totalRequests++;
    this.metrics.totalResponseTime += responseTime;
    
    // Calculate bytes saved (estimated)
    const estimatedSize = this.estimateResourceSize(resource);
    this.metrics.bytesSaved += estimatedSize;
    
    const event = {
      type: MONITORING_EVENTS.CACHE_HIT,
      resource,
      responseTime,
      source,
      timestamp: Date.now(),
      estimatedSize
    };
    
    this.recordEvent(event);
    this.updateResourceMetrics(resource, 'hit', responseTime);
    
    console.log(`[CacheMonitoring] Cache HIT: ${resource} (${responseTime}ms, ${source})`);
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(resource, responseTime = 0, reason = 'unknown') {
    if (!this.shouldSample()) return;
    
    this.metrics.misses++;
    this.metrics.totalRequests++;
    this.metrics.totalResponseTime += responseTime;
    
    const event = {
      type: MONITORING_EVENTS.CACHE_MISS,
      resource,
      responseTime,
      reason,
      timestamp: Date.now()
    };
    
    this.recordEvent(event);
    this.updateResourceMetrics(resource, 'miss', responseTime);
    
    console.log(`[CacheMonitoring] Cache MISS: ${resource} (${responseTime}ms, ${reason})`);
  }

  /**
   * Record cache store operation
   */
  recordCacheStore(resource, size = 0, duration = 0) {
    if (!this.shouldSample()) return;
    
    this.metrics.stores++;
    
    const event = {
      type: MONITORING_EVENTS.CACHE_STORE,
      resource,
      size,
      duration,
      timestamp: Date.now()
    };
    
    this.recordEvent(event);
    
    console.log(`[CacheMonitoring] Cache STORE: ${resource} (${size} bytes, ${duration}ms)`);
  }

  /**
   * Record cache invalidation
   */
  recordCacheInvalidation(resource, reason = 'unknown') {
    if (!this.shouldSample()) return;
    
    this.metrics.invalidations++;
    
    const event = {
      type: MONITORING_EVENTS.CACHE_INVALIDATE,
      resource,
      reason,
      timestamp: Date.now()
    };
    
    this.recordEvent(event);
    
    console.log(`[CacheMonitoring] Cache INVALIDATE: ${resource} (${reason})`);
  }

  /**
   * Record cache error
   */
  recordCacheError(resource, error, operation = 'unknown') {
    this.metrics.errors++;
    
    const event = {
      type: MONITORING_EVENTS.CACHE_ERROR,
      resource,
      error: error.message,
      operation,
      timestamp: Date.now()
    };
    
    this.recordEvent(event);
    
    console.error(`[CacheMonitoring] Cache ERROR: ${resource} (${operation}) - ${error.message}`);
  }

  /**
   * Record network request
   */
  recordNetworkRequest(url, duration, success, fromCache) {
    const event = {
      type: MONITORING_EVENTS.NETWORK_REQUEST,
      url,
      duration,
      success,
      fromCache,
      timestamp: Date.now()
    };
    
    this.recordEvent(event);
    
    if (fromCache) {
      this.recordCacheHit(url, duration, 'network');
    } else {
      this.recordCacheMiss(url, duration, 'network');
    }
  }

  /**
   * Record network change
   */
  recordNetworkChange() {
    const connection = this.networkConnection;
    
    const event = {
      type: 'network_change',
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
      timestamp: Date.now()
    };
    
    this.recordEvent(event);
  }

  /**
   * Record network status change
   */
  recordNetworkStatus(status) {
    const event = {
      type: 'network_status',
      status,
      timestamp: Date.now()
    };
    
    this.recordEvent(event);
  }

  /**
   * Process performance entry
   */
  processPerformanceEntry(entry) {
    const event = {
      type: MONITORING_EVENTS.PERFORMANCE_MARK,
      name: entry.name,
      entryType: entry.entryType,
      startTime: entry.startTime,
      duration: entry.duration || 0,
      timestamp: Date.now()
    };
    
    // Special handling for resource entries
    if (entry.entryType === 'resource') {
      this.processResourceEntry(entry);
    }
    
    this.recordEvent(event);
  }

  /**
   * Process resource timing entry
   */
  processResourceEntry(entry) {
    const cacheHit = entry.transferSize === 0 && entry.decodedBodySize > 0;
    const responseTime = entry.responseEnd - entry.responseStart;
    
    if (cacheHit) {
      this.recordCacheHit(entry.name, responseTime, 'browser-cache');
    } else {
      this.recordCacheMiss(entry.name, responseTime, 'not-cached');
    }
    
    const resourceEvent = {
      type: MONITORING_EVENTS.RESOURCE_TIMING,
      name: entry.name,
      duration: entry.duration,
      transferSize: entry.transferSize,
      decodedBodySize: entry.decodedBodySize,
      cacheHit,
      timestamp: Date.now()
    };
    
    this.recordEvent(resourceEvent);
  }

  /**
   * Record monitoring event
   */
  recordEvent(event) {
    // Add to real-time data
    this.realtimeData.push(event);
    
    // Publish to real-time stream
    if (this.realtimeStream) {
      this.realtimeStream.publish(event);
    }
    
    // Limit real-time data size
    if (this.realtimeData.length > 1000) {
      this.realtimeData = this.realtimeData.slice(-1000);
    }
  }

  /**
   * Update resource-specific metrics
   */
  updateResourceMetrics(resource, type, responseTime) {
    if (!this.detailedMetrics.has(resource)) {
      this.detailedMetrics.set(resource, {
        hits: 0,
        misses: 0,
        totalResponseTime: 0,
        requestCount: 0,
        lastAccessed: 0
      });
    }
    
    const metrics = this.detailedMetrics.get(resource);
    metrics[type === 'hit' ? 'hits' : 'misses']++;
    metrics.totalResponseTime += responseTime;
    metrics.requestCount++;
    metrics.lastAccessed = Date.now();
    
    this.detailedMetrics.set(resource, metrics);
  }

  /**
   * Estimate resource size
   */
  estimateResourceSize(resource) {
    // Basic size estimation based on resource type
    const ext = resource.split('.').pop()?.toLowerCase();
    
    const sizeMap = {
      'js': 50000,      // 50KB average
      'css': 20000,     // 20KB average
      'html': 10000,    // 10KB average
      'json': 5000,     // 5KB average
      'png': 100000,    // 100KB average
      'jpg': 150000,    // 150KB average
      'svg': 5000,      // 5KB average
      'woff2': 30000,   // 30KB average
      'woff': 50000     // 50KB average
    };
    
    return sizeMap[ext] || 10000; // 10KB default
  }

  /**
   * Calculate cache hit rate
   */
  getCacheHitRate() {
    const total = this.metrics.hits + this.metrics.misses;
    return total > 0 ? this.metrics.hits / total : 0;
  }

  /**
   * Calculate average response time
   */
  getAverageResponseTime() {
    return this.metrics.totalRequests > 0 
      ? this.metrics.totalResponseTime / this.metrics.totalRequests 
      : 0;
  }

  /**
   * Get performance grade
   */
  getPerformanceGrade() {
    const hitRate = this.getCacheHitRate();
    const avgResponseTime = this.getAverageResponseTime();
    
    let grade = 'A';
    
    // Evaluate hit rate
    if (hitRate < PERFORMANCE_THRESHOLDS.CACHE_HIT_RATES.poor) {
      grade = 'F';
    } else if (hitRate < PERFORMANCE_THRESHOLDS.CACHE_HIT_RATES.acceptable) {
      grade = 'D';
    } else if (hitRate < PERFORMANCE_THRESHOLDS.CACHE_HIT_RATES.good) {
      grade = 'C';
    } else if (hitRate < PERFORMANCE_THRESHOLDS.CACHE_HIT_RATES.excellent) {
      grade = 'B';
    }
    
    // Evaluate response time
    if (avgResponseTime > PERFORMANCE_THRESHOLDS.RESPONSE_TIMES.poor) {
      grade = grade === 'A' ? 'C' : 'F';
    } else if (avgResponseTime > PERFORMANCE_THRESHOLDS.RESPONSE_TIMES.acceptable) {
      grade = grade === 'A' ? 'B' : grade;
    }
    
    return grade;
  }

  /**
   * Get comprehensive performance report
   */
  getPerformanceReport() {
    const hitRate = this.getCacheHitRate();
    const avgResponseTime = this.getAverageResponseTime();
    const uptime = Date.now() - this.startTime;
    
    return {
      summary: {
        hitRate: hitRate,
        hitRatePercentage: (hitRate * 100).toFixed(2),
        averageResponseTime: avgResponseTime.toFixed(2),
        grade: this.getPerformanceGrade(),
        uptime: uptime,
        totalRequests: this.metrics.totalRequests,
        bytesSaved: this.metrics.bytesSaved
      },
      metrics: { ...this.metrics },
      thresholds: PERFORMANCE_THRESHOLDS,
      topResources: this.getTopResources(),
      recentEvents: this.realtimeData.slice(-20),
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Get top performing/underperforming resources
   */
  getTopResources() {
    const resources = Array.from(this.detailedMetrics.entries()).map(([resource, metrics]) => {
      const hitRate = metrics.requestCount > 0 ? metrics.hits / metrics.requestCount : 0;
      const avgResponseTime = metrics.requestCount > 0 ? metrics.totalResponseTime / metrics.requestCount : 0;
      
      return {
        resource,
        hitRate,
        avgResponseTime,
        requestCount: metrics.requestCount,
        lastAccessed: metrics.lastAccessed
      };
    });
    
    return {
      mostRequested: resources.sort((a, b) => b.requestCount - a.requestCount).slice(0, 10),
      highestHitRate: resources.sort((a, b) => b.hitRate - a.hitRate).slice(0, 10),
      lowestHitRate: resources.sort((a, b) => a.hitRate - b.hitRate).slice(0, 10),
      slowestResponse: resources.sort((a, b) => b.avgResponseTime - a.avgResponseTime).slice(0, 10)
    };
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    const hitRate = this.getCacheHitRate();
    const avgResponseTime = this.getAverageResponseTime();
    
    // Hit rate recommendations
    if (hitRate < PERFORMANCE_THRESHOLDS.CACHE_HIT_RATES.acceptable) {
      recommendations.push({
        type: 'critical',
        category: 'hit-rate',
        message: `Cache hit rate is ${(hitRate * 100).toFixed(1)}%. Consider implementing better caching strategies.`,
        action: 'Implement preloading and cache warming for frequently accessed resources.'
      });
    }
    
    // Response time recommendations
    if (avgResponseTime > PERFORMANCE_THRESHOLDS.RESPONSE_TIMES.acceptable) {
      recommendations.push({
        type: 'warning',
        category: 'response-time',
        message: `Average response time is ${avgResponseTime.toFixed(1)}ms. Consider optimizing cache retrieval.`,
        action: 'Optimize cache storage mechanisms and consider using faster storage options.'
      });
    }
    
    // Error rate recommendations
    const errorRate = this.metrics.totalRequests > 0 ? this.metrics.errors / this.metrics.totalRequests : 0;
    if (errorRate > 0.05) { // 5% error rate
      recommendations.push({
        type: 'critical',
        category: 'errors',
        message: `Cache error rate is ${(errorRate * 100).toFixed(1)}%. Investigate cache reliability.`,
        action: 'Check cache storage quotas and implement better error handling.'
      });
    }
    
    // Storage recommendations
    const topResources = this.getTopResources();
    if (topResources.lowestHitRate.length > 0) {
      const worstResource = topResources.lowestHitRate[0];
      if (worstResource.hitRate < 0.3 && worstResource.requestCount > 10) {
        recommendations.push({
          type: 'info',
          category: 'optimization',
          message: `Resource "${worstResource.resource}" has low hit rate (${(worstResource.hitRate * 100).toFixed(1)}%).`,
          action: 'Consider implementing better caching strategy for this resource.'
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Aggregate metrics for historical analysis
   */
  aggregateMetrics() {
    const timestamp = Date.now();
    const interval = Math.floor(timestamp / this.options.aggregationInterval) * this.options.aggregationInterval;
    
    const aggregated = {
      timestamp: interval,
      metrics: { ...this.metrics },
      hitRate: this.getCacheHitRate(),
      avgResponseTime: this.getAverageResponseTime(),
      grade: this.getPerformanceGrade(),
      eventCount: this.realtimeData.length,
      resourceCount: this.detailedMetrics.size
    };
    
    this.aggregatedData.push(aggregated);
    
    // Limit aggregated data size
    if (this.aggregatedData.length > 1440) { // Keep 24 hours at 1-minute intervals
      this.aggregatedData = this.aggregatedData.slice(-1440);
    }
  }

  /**
   * Clean up old data
   */
  cleanupOldData() {
    const cutoffTime = Date.now() - this.options.retentionPeriod;
    
    // Clean up real-time data
    this.realtimeData = this.realtimeData.filter(event => event.timestamp > cutoffTime);
    
    // Clean up resource metrics
    for (const [resource, metrics] of this.detailedMetrics.entries()) {
      if (metrics.lastAccessed < cutoffTime) {
        this.detailedMetrics.delete(resource);
      }
    }
  }

  /**
   * Send analytics data
   */
  async sendAnalytics() {
    if (!this.options.enableAnalytics || !this.options.analyticsEndpoint) {
      return;
    }
    
    try {
      const report = this.getPerformanceReport();
      
      await fetch(this.options.analyticsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'cache_performance',
          timestamp: Date.now(),
          report
        })
      });
    } catch (error) {
      console.warn('[CacheMonitoring] Failed to send analytics:', error);
    }
  }

  /**
   * Export monitoring data
   */
  exportData(format = 'json') {
    const data = {
      metadata: {
        exportTime: new Date().toISOString(),
        monitoringPeriod: {
          start: new Date(this.startTime).toISOString(),
          end: new Date().toISOString(),
          duration: Date.now() - this.startTime
        },
        version: '1.0.0'
      },
      summary: this.getPerformanceReport().summary,
      metrics: this.metrics,
      aggregatedData: this.aggregatedData,
      detailedMetrics: Object.fromEntries(this.detailedMetrics),
      recentEvents: this.realtimeData.slice(-100)
    };
    
    switch (format.toLowerCase()) {
      case 'csv':
        return this.convertToCSV(data);
      case 'json':
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * Convert data to CSV format
   */
  convertToCSV(data) {
    const csvRows = [];
    
    // Headers
    csvRows.push('timestamp,hits,misses,hitRate,avgResponseTime,grade');
    
    // Data rows
    data.aggregatedData.forEach(row => {
      csvRows.push([
        new Date(row.timestamp).toISOString(),
        row.metrics.hits,
        row.metrics.misses,
        (row.hitRate * 100).toFixed(2),
        row.avgResponseTime.toFixed(2),
        row.grade
      ].join(','));
    });
    
    return csvRows.join('\n');
  }

  /**
   * Subscribe to real-time monitoring data
   */
  subscribe(callback) {
    return this.realtimeStream.subscribe(callback);
  }

  /**
   * Unsubscribe from real-time monitoring data
   */
  unsubscribe(callback) {
    this.realtimeStream.unsubscribe(callback);
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics() {
    return {
      ...this.metrics,
      hitRate: this.getCacheHitRate(),
      avgResponseTime: this.getAverageResponseTime(),
      grade: this.getPerformanceGrade(),
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      hits: 0,
      misses: 0,
      stores: 0,
      invalidations: 0,
      errors: 0,
      totalRequests: 0,
      totalResponseTime: 0,
      bytesSaved: 0
    };
    
    this.detailedMetrics.clear();
    this.realtimeData = [];
    this.aggregatedData = [];
    this.startTime = Date.now();
    
    console.log('[CacheMonitoring] Metrics reset');
  }

  /**
   * Cleanup monitor
   */
  destroy() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    this.realtimeStream.subscribers.clear();
    
    console.log('[CacheMonitoring] Performance monitor destroyed');
  }
}

/**
 * Global cache performance monitor instance
 */
let globalMonitor = null;

/**
 * Factory function to create or get global monitor
 */
export function getCacheMonitor(options) {
  if (!globalMonitor) {
    globalMonitor = new CachePerformanceMonitor(options);
  }
  return globalMonitor;
}

/**
 * Convenience functions for common monitoring tasks
 */
export function recordCacheHit(resource, responseTime, source) {
  const monitor = getCacheMonitor();
  monitor.recordCacheHit(resource, responseTime, source);
}

export function recordCacheMiss(resource, responseTime, reason) {
  const monitor = getCacheMonitor();
  monitor.recordCacheMiss(resource, responseTime, reason);
}

export function getPerformanceReport() {
  const monitor = getCacheMonitor();
  return monitor.getPerformanceReport();
}

export function getCacheHitRate() {
  const monitor = getCacheMonitor();
  return monitor.getCacheHitRate();
}

export default CachePerformanceMonitor;