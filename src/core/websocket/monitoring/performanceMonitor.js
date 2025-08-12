/**
 * Performance Monitor for WebSocket Server
 * 
 * Advanced performance monitoring system that tracks real-time metrics,
 * identifies bottlenecks, and provides optimization recommendations for
 * the MLG.clan platform WebSocket infrastructure.
 * 
 * Features:
 * - Real-time performance tracking
 * - Bottleneck detection and analysis
 * - Memory leak detection
 * - Load balancing recommendations
 * - Automatic scaling suggestions
 * - Performance trend analysis
 * 
 * @author Claude Code - Performance Monitoring Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { EventEmitter } from 'events';

/**
 * Performance Monitor Configuration
 */
const PERFORMANCE_CONFIG = {
  // Monitoring intervals
  monitoringInterval: 5000, // 5 seconds
  analysisInterval: 30000, // 30 seconds
  reportingInterval: 300000, // 5 minutes
  
  // Performance thresholds
  thresholds: {
    critical: {
      memoryUsage: 0.90, // 90%
      cpuUsage: 0.85, // 85%
      eventLoopLag: 100, // 100ms
      responseTime: 2000, // 2 seconds
      errorRate: 0.1 // 10%
    },
    warning: {
      memoryUsage: 0.75, // 75%
      cpuUsage: 0.70, // 70%
      eventLoopLag: 50, // 50ms
      responseTime: 1000, // 1 second
      errorRate: 0.05 // 5%
    },
    target: {
      memoryUsage: 0.60, // 60%
      cpuUsage: 0.50, // 50%
      eventLoopLag: 20, // 20ms
      responseTime: 500, // 500ms
      errorRate: 0.01 // 1%
    }
  },
  
  // Analysis settings
  analysis: {
    trendWindow: 600000, // 10 minutes
    anomalyThreshold: 2, // Standard deviations
    memoryLeakThreshold: 0.1, // 10% increase over time
    performanceDegradationThreshold: 0.2 // 20% degradation
  },
  
  // Optimization settings
  optimization: {
    enableAutoRecommendations: true,
    enableAutoScaling: false, // Should be enabled in production with proper infrastructure
    enableGarbageCollection: true,
    enableConnectionThrottling: true
  }
};

/**
 * Performance Monitor Class
 */
export class PerformanceMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = { ...PERFORMANCE_CONFIG, ...options };
    this.io = options.io;
    this.metrics = options.metrics;
    this.logger = options.logger || console;
    
    // Performance data
    this.performanceData = {
      current: {},
      history: [],
      trends: {},
      alerts: [],
      recommendations: []
    };
    
    // Analysis state
    this.analysisState = {
      memoryBaseline: null,
      cpuBaseline: null,
      performanceBaseline: null,
      lastAnalysis: null
    };
    
    // Timers
    this.monitoringTimer = null;
    this.analysisTimer = null;
    this.reportingTimer = null;
    
    this.startMonitoring();
    
    this.logger.info('Performance Monitor initialized');
  }

  /**
   * Start performance monitoring
   */
  startMonitoring() {
    // Real-time monitoring
    this.monitoringTimer = setInterval(() => {
      this.collectPerformanceData();
    }, this.config.monitoringInterval);
    
    // Performance analysis
    this.analysisTimer = setInterval(() => {
      this.analyzePerformance();
    }, this.config.analysisInterval);
    
    // Performance reporting
    this.reportingTimer = setInterval(() => {
      this.generatePerformanceReport();
    }, this.config.reportingInterval);
    
    this.logger.info('Performance monitoring started');
  }

  /**
   * Collect real-time performance data
   */
  collectPerformanceData() {
    try {
      const timestamp = Date.now();
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      const performanceSnapshot = {
        timestamp,
        
        // System metrics
        memory: {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          heapUsage: memUsage.heapUsed / memUsage.heapTotal,
          external: memUsage.external,
          rss: memUsage.rss
        },
        
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
          usage: this.calculateCpuUsage(cpuUsage)
        },
        
        // Event loop metrics
        eventLoop: {
          lag: this.measureEventLoopLag(),
          utilization: this.calculateEventLoopUtilization()
        },
        
        // WebSocket metrics
        websocket: this.getWebSocketMetrics(),
        
        // Network metrics
        network: this.getNetworkMetrics(),
        
        // Performance indicators
        performance: {
          responseTime: this.measureResponseTime(),
          throughput: this.calculateThroughput(),
          concurrency: this.calculateConcurrency(),
          efficiency: this.calculateEfficiency()
        }
      };
      
      this.performanceData.current = performanceSnapshot;
      this.addToHistory(performanceSnapshot);
      
      // Check for immediate issues
      this.checkPerformanceThresholds(performanceSnapshot);
      
    } catch (error) {
      this.logger.error('Error collecting performance data:', error);
    }
  }

  /**
   * Calculate CPU usage
   */
  calculateCpuUsage(cpuUsage) {
    if (!this.lastCpuUsage) {
      this.lastCpuUsage = cpuUsage;
      return 0;
    }
    
    const userDiff = cpuUsage.user - this.lastCpuUsage.user;
    const systemDiff = cpuUsage.system - this.lastCpuUsage.system;
    
    this.lastCpuUsage = cpuUsage;
    
    // Convert microseconds to percentage (rough approximation)
    const totalDiff = userDiff + systemDiff;
    return Math.min(totalDiff / (this.config.monitoringInterval * 1000), 1);
  }

  /**
   * Measure event loop lag
   */
  measureEventLoopLag() {
    if (!this.lagStart) {
      this.lagStart = process.hrtime();
    }
    
    const lag = process.hrtime(this.lagStart);
    this.lagStart = process.hrtime();
    
    return (lag[0] * 1000) + (lag[1] * 1e-6); // Convert to milliseconds
  }

  /**
   * Calculate event loop utilization
   */
  calculateEventLoopUtilization() {
    const lag = this.measureEventLoopLag();
    return Math.min(lag / this.config.monitoringInterval, 1);
  }

  /**
   * Get WebSocket metrics from metrics collector
   */
  getWebSocketMetrics() {
    if (!this.metrics) {
      return {
        connections: 0,
        events: 0,
        rooms: 0,
        errors: 0
      };
    }
    
    const stats = this.metrics.getStats();
    
    return {
      connections: stats.connections.active,
      authenticatedConnections: stats.connections.authenticated,
      rooms: stats.rooms.active,
      events: stats.events.throughputPerSecond,
      errors: stats.errors.errorRate,
      eventLatency: stats.events.averageLatency || 0
    };
  }

  /**
   * Get network metrics
   */
  getNetworkMetrics() {
    // In a real implementation, you would collect actual network metrics
    // This is a simplified version
    return {
      bytesIn: 0,
      bytesOut: 0,
      packetsIn: 0,
      packetsOut: 0,
      bandwidth: {
        incoming: 0,
        outgoing: 0
      }
    };
  }

  /**
   * Measure response time
   */
  measureResponseTime() {
    // This would typically measure actual request/response times
    // For now, we'll use event loop lag as a proxy
    return this.measureEventLoopLag();
  }

  /**
   * Calculate throughput
   */
  calculateThroughput() {
    const wsMetrics = this.getWebSocketMetrics();
    return wsMetrics.events || 0;
  }

  /**
   * Calculate concurrency
   */
  calculateConcurrency() {
    const wsMetrics = this.getWebSocketMetrics();
    return wsMetrics.connections || 0;
  }

  /**
   * Calculate efficiency
   */
  calculateEfficiency() {
    const current = this.performanceData.current;
    
    if (!current || !current.websocket) {
      return 0;
    }
    
    const throughput = current.websocket.events || 0;
    const resources = (current.memory.heapUsage + current.cpu.usage) / 2;
    
    // Efficiency = Throughput / Resource Usage
    return resources > 0 ? throughput / resources : 0;
  }

  /**
   * Add performance data to history
   */
  addToHistory(snapshot) {
    this.performanceData.history.push(snapshot);
    
    // Keep only recent history
    const cutoff = Date.now() - this.config.analysis.trendWindow;
    this.performanceData.history = this.performanceData.history.filter(
      item => item.timestamp > cutoff
    );
  }

  /**
   * Check performance thresholds
   */
  checkPerformanceThresholds(snapshot) {
    const alerts = [];
    
    // Memory usage
    if (snapshot.memory.heapUsage > this.config.thresholds.critical.memoryUsage) {
      alerts.push({
        type: 'memory_critical',
        severity: 'critical',
        value: snapshot.memory.heapUsage,
        threshold: this.config.thresholds.critical.memoryUsage,
        message: 'Memory usage critical - immediate action required',
        recommendation: 'Consider restarting the service or implementing memory optimization'
      });
    } else if (snapshot.memory.heapUsage > this.config.thresholds.warning.memoryUsage) {
      alerts.push({
        type: 'memory_warning',
        severity: 'warning',
        value: snapshot.memory.heapUsage,
        threshold: this.config.thresholds.warning.memoryUsage,
        message: 'Memory usage high',
        recommendation: 'Monitor memory usage and consider optimization'
      });
    }
    
    // CPU usage
    if (snapshot.cpu.usage > this.config.thresholds.critical.cpuUsage) {
      alerts.push({
        type: 'cpu_critical',
        severity: 'critical',
        value: snapshot.cpu.usage,
        threshold: this.config.thresholds.critical.cpuUsage,
        message: 'CPU usage critical - performance severely impacted',
        recommendation: 'Scale horizontally or optimize CPU-intensive operations'
      });
    } else if (snapshot.cpu.usage > this.config.thresholds.warning.cpuUsage) {
      alerts.push({
        type: 'cpu_warning',
        severity: 'warning',
        value: snapshot.cpu.usage,
        threshold: this.config.thresholds.warning.cpuUsage,
        message: 'CPU usage high',
        recommendation: 'Consider load balancing or optimization'
      });
    }
    
    // Event loop lag
    if (snapshot.eventLoop.lag > this.config.thresholds.critical.eventLoopLag) {
      alerts.push({
        type: 'eventloop_critical',
        severity: 'critical',
        value: snapshot.eventLoop.lag,
        threshold: this.config.thresholds.critical.eventLoopLag,
        message: 'Event loop blocked - responsiveness severely impacted',
        recommendation: 'Identify and optimize blocking operations'
      });
    } else if (snapshot.eventLoop.lag > this.config.thresholds.warning.eventLoopLag) {
      alerts.push({
        type: 'eventloop_warning',
        severity: 'warning',
        value: snapshot.eventLoop.lag,
        threshold: this.config.thresholds.warning.eventLoopLag,
        message: 'Event loop lag detected',
        recommendation: 'Review for blocking operations'
      });
    }
    
    // Process alerts
    alerts.forEach(alert => {
      this.handlePerformanceAlert(alert);
    });
  }

  /**
   * Handle performance alerts
   */
  handlePerformanceAlert(alert) {
    // Add to alerts history
    this.performanceData.alerts.push({
      ...alert,
      timestamp: Date.now(),
      id: this.generateAlertId()
    });
    
    // Keep only recent alerts
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    this.performanceData.alerts = this.performanceData.alerts.filter(
      alert => alert.timestamp > cutoff
    );
    
    // Emit alert
    this.emit('performance_alert', alert);
    
    // Log alert
    const logLevel = alert.severity === 'critical' ? 'error' : 'warn';
    this.logger[logLevel](`Performance Alert: ${alert.message}`, {
      type: alert.type,
      value: alert.value,
      threshold: alert.threshold
    });
    
    // Execute automatic optimizations if enabled
    if (this.config.optimization.enableAutoRecommendations) {
      this.executeOptimizations(alert);
    }
  }

  /**
   * Analyze performance trends
   */
  analyzePerformance() {
    try {
      if (this.performanceData.history.length < 2) {
        return; // Need at least 2 data points
      }
      
      const analysis = {
        timestamp: Date.now(),
        trends: this.calculateTrends(),
        anomalies: this.detectAnomalies(),
        memoryLeaks: this.detectMemoryLeaks(),
        degradation: this.detectPerformanceDegradation(),
        recommendations: []
      };
      
      // Generate recommendations based on analysis
      analysis.recommendations = this.generateRecommendations(analysis);
      
      // Store analysis results
      this.performanceData.trends = analysis;
      this.analysisState.lastAnalysis = analysis.timestamp;
      
      // Emit analysis complete event
      this.emit('analysis_complete', analysis);
      
      this.logger.debug('Performance analysis completed', {
        trends: Object.keys(analysis.trends).length,
        anomalies: analysis.anomalies.length,
        recommendations: analysis.recommendations.length
      });
      
    } catch (error) {
      this.logger.error('Error analyzing performance:', error);
    }
  }

  /**
   * Calculate performance trends
   */
  calculateTrends() {
    const history = this.performanceData.history;
    const trends = {};
    
    if (history.length < 10) {
      return trends; // Need sufficient data for trend analysis
    }
    
    // Calculate trends for key metrics
    const metrics = [
      'memory.heapUsage',
      'cpu.usage',
      'eventLoop.lag',
      'performance.responseTime',
      'websocket.connections',
      'websocket.events'
    ];
    
    metrics.forEach(metric => {
      const values = history.map(snapshot => this.getNestedValue(snapshot, metric)).filter(v => v !== undefined);
      
      if (values.length >= 5) {
        trends[metric] = {
          direction: this.calculateTrendDirection(values),
          slope: this.calculateSlope(values),
          correlation: this.calculateCorrelation(values),
          volatility: this.calculateVolatility(values)
        };
      }
    });
    
    return trends;
  }

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  /**
   * Calculate trend direction
   */
  calculateTrendDirection(values) {
    const recent = values.slice(-5);
    const older = values.slice(-10, -5);
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    
    if (recentAvg > olderAvg * 1.1) return 'increasing';
    if (recentAvg < olderAvg * 0.9) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate slope (simple linear regression)
   */
  calculateSlope(values) {
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    const sumX = indices.reduce((sum, x) => sum + x, 0);
    const sumY = values.reduce((sum, y) => sum + y, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = indices.reduce((sum, x) => sum + x * x, 0);
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  /**
   * Calculate correlation coefficient
   */
  calculateCorrelation(values) {
    // Simplified correlation with time series
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    const meanX = indices.reduce((sum, x) => sum + x, 0) / n;
    const meanY = values.reduce((sum, y) => sum + y, 0) / n;
    
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    
    for (let i = 0; i < n; i++) {
      const diffX = indices[i] - meanX;
      const diffY = values[i] - meanY;
      
      numerator += diffX * diffY;
      denomX += diffX * diffX;
      denomY += diffY * diffY;
    }
    
    return numerator / Math.sqrt(denomX * denomY);
  }

  /**
   * Calculate volatility
   */
  calculateVolatility(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Detect anomalies
   */
  detectAnomalies() {
    const anomalies = [];
    const current = this.performanceData.current;
    const history = this.performanceData.history;
    
    if (history.length < 10) {
      return anomalies; // Need sufficient history
    }
    
    // Check for anomalies in key metrics
    const metricsToCheck = [
      { path: 'memory.heapUsage', name: 'Memory Usage' },
      { path: 'cpu.usage', name: 'CPU Usage' },
      { path: 'eventLoop.lag', name: 'Event Loop Lag' },
      { path: 'websocket.connections', name: 'WebSocket Connections' }
    ];
    
    metricsToCheck.forEach(metric => {
      const currentValue = this.getNestedValue(current, metric.path);
      const historicalValues = history.map(snapshot => this.getNestedValue(snapshot, metric.path)).filter(v => v !== undefined);
      
      if (currentValue !== undefined && historicalValues.length >= 10) {
        const mean = historicalValues.reduce((sum, val) => sum + val, 0) / historicalValues.length;
        const stdDev = Math.sqrt(
          historicalValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalValues.length
        );
        
        const zScore = Math.abs((currentValue - mean) / stdDev);
        
        if (zScore > this.config.analysis.anomalyThreshold) {
          anomalies.push({
            metric: metric.name,
            path: metric.path,
            currentValue,
            expectedValue: mean,
            deviation: zScore,
            severity: zScore > 3 ? 'critical' : 'warning'
          });
        }
      }
    });
    
    return anomalies;
  }

  /**
   * Detect memory leaks
   */
  detectMemoryLeaks() {
    const history = this.performanceData.history;
    
    if (history.length < 20) {
      return { detected: false }; // Need sufficient history
    }
    
    const memoryValues = history.map(snapshot => snapshot.memory.heapUsed);
    const recentValues = memoryValues.slice(-10);
    const olderValues = memoryValues.slice(-20, -10);
    
    const recentAvg = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
    const olderAvg = olderValues.reduce((sum, val) => sum + val, 0) / olderValues.length;
    
    const increaseRate = (recentAvg - olderAvg) / olderAvg;
    
    if (increaseRate > this.config.analysis.memoryLeakThreshold) {
      return {
        detected: true,
        increaseRate,
        severity: increaseRate > 0.25 ? 'critical' : 'warning',
        recommendation: 'Investigate potential memory leaks and consider garbage collection'
      };
    }
    
    return { detected: false };
  }

  /**
   * Detect performance degradation
   */
  detectPerformanceDegradation() {
    const history = this.performanceData.history;
    
    if (history.length < 20) {
      return { detected: false };
    }
    
    // Compare recent performance with baseline
    const recentPerformance = history.slice(-10).map(s => s.performance.efficiency || 0);
    const baselinePerformance = history.slice(-20, -10).map(s => s.performance.efficiency || 0);
    
    const recentAvg = recentPerformance.reduce((sum, val) => sum + val, 0) / recentPerformance.length;
    const baselineAvg = baselinePerformance.reduce((sum, val) => sum + val, 0) / baselinePerformance.length;
    
    const degradationRate = baselineAvg > 0 ? (baselineAvg - recentAvg) / baselineAvg : 0;
    
    if (degradationRate > this.config.analysis.performanceDegradationThreshold) {
      return {
        detected: true,
        degradationRate,
        severity: degradationRate > 0.4 ? 'critical' : 'warning',
        recommendation: 'Performance degradation detected - investigate recent changes and optimize'
      };
    }
    
    return { detected: false };
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations(analysis) {
    const recommendations = [];
    
    // Memory recommendations
    if (analysis.memoryLeaks.detected) {
      recommendations.push({
        type: 'memory_optimization',
        priority: analysis.memoryLeaks.severity === 'critical' ? 'high' : 'medium',
        title: 'Memory Leak Detection',
        description: 'Potential memory leak detected',
        actions: [
          'Run garbage collection',
          'Audit memory usage patterns',
          'Check for event listener leaks',
          'Review object retention'
        ]
      });
    }
    
    // CPU recommendations
    if (analysis.trends['cpu.usage']?.direction === 'increasing') {
      recommendations.push({
        type: 'cpu_optimization',
        priority: 'medium',
        title: 'CPU Usage Trending Up',
        description: 'CPU usage is consistently increasing',
        actions: [
          'Profile CPU-intensive operations',
          'Optimize event handling',
          'Consider horizontal scaling',
          'Review algorithmic complexity'
        ]
      });
    }
    
    // Event loop recommendations
    if (analysis.trends['eventLoop.lag']?.direction === 'increasing') {
      recommendations.push({
        type: 'eventloop_optimization',
        priority: 'high',
        title: 'Event Loop Lag Increasing',
        description: 'Event loop is becoming blocked more frequently',
        actions: [
          'Identify blocking operations',
          'Use asynchronous alternatives',
          'Implement worker threads for CPU-intensive tasks',
          'Optimize database queries'
        ]
      });
    }
    
    // Connection recommendations
    if (analysis.trends['websocket.connections']?.direction === 'increasing') {
      recommendations.push({
        type: 'scaling_optimization',
        priority: 'medium',
        title: 'Connection Growth',
        description: 'WebSocket connections are growing rapidly',
        actions: [
          'Monitor resource limits',
          'Prepare for horizontal scaling',
          'Optimize connection handling',
          'Implement connection pooling'
        ]
      });
    }
    
    return recommendations;
  }

  /**
   * Execute automatic optimizations
   */
  executeOptimizations(alert) {
    try {
      if (alert.type === 'memory_critical' && this.config.optimization.enableGarbageCollection) {
        // Force garbage collection
        if (global.gc) {
          global.gc();
          this.logger.info('Automatic garbage collection executed due to critical memory usage');
        }
      }
      
      if (alert.type === 'cpu_critical' && this.config.optimization.enableConnectionThrottling) {
        // Implement connection throttling (would need to be integrated with connection manager)
        this.emit('throttle_connections', { severity: alert.severity });
        this.logger.info('Connection throttling activated due to critical CPU usage');
      }
      
    } catch (error) {
      this.logger.error('Error executing automatic optimizations:', error);
    }
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport() {
    try {
      const report = {
        timestamp: Date.now(),
        period: this.config.reportingInterval,
        summary: this.generateSummary(),
        trends: this.performanceData.trends,
        alerts: this.getRecentAlerts(),
        recommendations: this.performanceData.recommendations,
        health: this.calculateHealthScore()
      };
      
      this.emit('performance_report', report);
      
      this.logger.info('Performance report generated', {
        health: report.health,
        alerts: report.alerts.length,
        recommendations: report.recommendations.length
      });
      
    } catch (error) {
      this.logger.error('Error generating performance report:', error);
    }
  }

  /**
   * Generate performance summary
   */
  generateSummary() {
    const current = this.performanceData.current;
    
    return {
      memory: {
        current: Math.round(current.memory?.heapUsage * 100) || 0,
        trend: this.performanceData.trends?.['memory.heapUsage']?.direction || 'unknown'
      },
      cpu: {
        current: Math.round(current.cpu?.usage * 100) || 0,
        trend: this.performanceData.trends?.['cpu.usage']?.direction || 'unknown'
      },
      eventLoop: {
        lag: Math.round(current.eventLoop?.lag) || 0,
        trend: this.performanceData.trends?.['eventLoop.lag']?.direction || 'unknown'
      },
      connections: {
        current: current.websocket?.connections || 0,
        trend: this.performanceData.trends?.['websocket.connections']?.direction || 'unknown'
      },
      throughput: {
        current: current.websocket?.events || 0,
        trend: this.performanceData.trends?.['websocket.events']?.direction || 'unknown'
      }
    };
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts() {
    const cutoff = Date.now() - this.config.reportingInterval;
    return this.performanceData.alerts.filter(alert => alert.timestamp > cutoff);
  }

  /**
   * Calculate overall health score
   */
  calculateHealthScore() {
    const current = this.performanceData.current;
    
    if (!current || !current.memory || !current.cpu) {
      return 0;
    }
    
    const scores = {
      memory: this.scoreMetric(current.memory.heapUsage, this.config.thresholds.target.memoryUsage, this.config.thresholds.critical.memoryUsage),
      cpu: this.scoreMetric(current.cpu.usage, this.config.thresholds.target.cpuUsage, this.config.thresholds.critical.cpuUsage),
      eventLoop: this.scoreMetric(current.eventLoop.lag, this.config.thresholds.target.eventLoopLag, this.config.thresholds.critical.eventLoopLag),
      errors: current.websocket.errors ? (1 - Math.min(current.websocket.errors, 0.1)) : 1
    };
    
    const avgScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;
    return Math.round(avgScore * 100);
  }

  /**
   * Score individual metric
   */
  scoreMetric(value, target, critical) {
    if (value <= target) return 1; // Perfect score
    if (value >= critical) return 0; // Worst score
    
    // Linear interpolation between target and critical
    return 1 - ((value - target) / (critical - target));
  }

  /**
   * Generate alert ID
   */
  generateAlertId() {
    return `perf_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get performance statistics
   */
  getStats() {
    return {
      current: this.performanceData.current,
      trends: this.performanceData.trends,
      alerts: this.getRecentAlerts(),
      recommendations: this.performanceData.recommendations,
      health: this.calculateHealthScore(),
      summary: this.generateSummary()
    };
  }

  /**
   * Shutdown performance monitor
   */
  shutdown() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }
    
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
    }
    
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer);
    }
    
    this.logger.info('Performance Monitor shutdown completed');
  }
}

export default PerformanceMonitor;