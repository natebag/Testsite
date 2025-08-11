/**
 * MLG.clan Platform Performance Benchmarking Suite
 * 
 * Comprehensive performance benchmarking with response time and throughput measurements.
 * Tests system performance under various load conditions, measures resource utilization,
 * and provides detailed performance analytics with trend analysis.
 * 
 * Features:
 * - Response time percentile analysis (P50, P95, P99)
 * - Throughput measurements (requests/second, transactions/second)
 * - Resource utilization monitoring (CPU, memory, I/O)
 * - Performance trend analysis and regression detection
 * - Scalability testing with different load patterns
 * - Performance baseline establishment
 * - Real-time performance monitoring
 * - Performance bottleneck identification
 * 
 * @author Claude Code - Universal Testing & Verification Agent
 * @version 1.0.0
 * @created 2025-08-11
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { cpuUsage, memoryUsage } from 'process';
import crypto from 'crypto';
import fs from 'fs/promises';

import { DatabaseManager } from '../../database/database-config.js';
import { getCacheManager } from '../../cache/cache-manager.js';

/**
 * Performance Benchmark Configuration
 */
const BENCHMARK_CONFIG = {
  // Benchmark parameters
  testDuration: parseInt(process.env.PERF_TEST_DURATION) || 300000, // 5 minutes
  warmupDuration: parseInt(process.env.PERF_WARMUP_DURATION) || 60000, // 1 minute
  cooldownDuration: parseInt(process.env.PERF_COOLDOWN_DURATION) || 30000, // 30 seconds
  
  // Load patterns
  loadPatterns: [
    { name: 'baseline', targetRPS: 100, duration: 60000 },
    { name: 'moderate', targetRPS: 500, duration: 120000 },
    { name: 'high', targetRPS: 1000, duration: 120000 },
    { name: 'peak', targetRPS: 2000, duration: 60000 },
    { name: 'stress', targetRPS: 5000, duration: 30000 },
  ],
  
  // Performance thresholds
  thresholds: {
    responseTime: {
      p50: 100,  // 50th percentile < 100ms
      p95: 500,  // 95th percentile < 500ms
      p99: 1000, // 99th percentile < 1000ms
    },
    throughput: {
      minimum: 100,    // At least 100 RPS
      target: 1000,    // Target 1000 RPS
      maximum: 5000,   // Peak capacity 5000 RPS
    },
    resources: {
      cpuLimit: 80,     // CPU usage < 80%
      memoryLimit: 85,  // Memory usage < 85%
      ioWaitLimit: 20,  // I/O wait < 20%
    },
    errors: {
      maxErrorRate: 0.01, // < 1% error rate
      maxTimeouts: 0.005, // < 0.5% timeout rate
    },
  },
  
  // Benchmark categories
  categories: [
    'api_endpoints',
    'database_operations', 
    'cache_operations',
    'websocket_operations',
    'file_operations',
    'search_operations',
    'authentication',
    'gaming_operations',
  ],
  
  // Measurement intervals
  measurementInterval: 1000, // 1 second
  resourceMonitoringInterval: 5000, // 5 seconds
  
  // Worker configuration
  workerCount: parseInt(process.env.PERF_WORKERS) || 20,
};

/**
 * Performance measurement utilities
 */
class PerformanceMeasurement {
  constructor(name) {
    this.name = name;
    this.measurements = [];
    this.startTime = null;
    this.endTime = null;
    this.errors = [];
  }
  
  start() {
    this.startTime = performance.now();
  }
  
  end(success = true, error = null) {
    this.endTime = performance.now();
    const duration = this.endTime - this.startTime;
    
    this.measurements.push({
      duration,
      timestamp: Date.now(),
      success,
      error: error?.message || null,
    });
    
    if (!success && error) {
      this.errors.push(error);
    }
    
    return duration;
  }
  
  getStatistics() {
    const durations = this.measurements
      .filter(m => m.success)
      .map(m => m.duration)
      .sort((a, b) => a - b);
    
    if (durations.length === 0) {
      return {
        count: 0,
        mean: 0,
        median: 0,
        p95: 0,
        p99: 0,
        min: 0,
        max: 0,
        errorRate: 1,
      };
    }
    
    const errorCount = this.measurements.filter(m => !m.success).length;
    const totalCount = this.measurements.length;
    
    return {
      count: durations.length,
      mean: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      median: durations[Math.floor(durations.length * 0.5)],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)],
      min: durations[0],
      max: durations[durations.length - 1],
      errorRate: errorCount / totalCount,
      errors: errorCount,
      total: totalCount,
    };
  }
}

/**
 * Resource Monitor
 */
class ResourceMonitor extends EventEmitter {
  constructor() {
    super();
    this.monitoring = false;
    this.measurements = [];
    this.interval = null;
    this.baseline = null;
  }
  
  start() {
    if (this.monitoring) return;
    
    this.monitoring = true;
    this.measurements = [];
    
    // Establish baseline
    this.baseline = {
      cpu: cpuUsage(),
      memory: memoryUsage(),
      timestamp: Date.now(),
    };
    
    this.interval = setInterval(() => {
      this.takeMeasurement();
    }, BENCHMARK_CONFIG.resourceMonitoringInterval);
    
    this.emit('started');
  }
  
  stop() {
    if (!this.monitoring) return;
    
    this.monitoring = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    this.emit('stopped');
  }
  
  takeMeasurement() {
    const cpu = cpuUsage(this.baseline.cpu);
    const memory = memoryUsage();
    
    const measurement = {
      timestamp: Date.now(),
      cpu: {
        user: cpu.user / 1000, // Convert to milliseconds
        system: cpu.system / 1000,
        total: (cpu.user + cpu.system) / 1000,
      },
      memory: {
        rss: memory.rss,
        heapTotal: memory.heapTotal,
        heapUsed: memory.heapUsed,
        external: memory.external,
        arrayBuffers: memory.arrayBuffers,
      },
      loadAverage: this.getLoadAverage(),
    };
    
    this.measurements.push(measurement);
    this.emit('measurement', measurement);
  }
  
  getLoadAverage() {
    try {
      // Simplified load average calculation
      const recent = this.measurements.slice(-10);
      if (recent.length === 0) return 0;
      
      const avgCpu = recent.reduce((sum, m) => sum + m.cpu.total, 0) / recent.length;
      return Math.min(100, (avgCpu / 1000) * 100); // Convert to percentage
      
    } catch (error) {
      return 0;
    }
  }
  
  getStatistics() {
    if (this.measurements.length === 0) {
      return {
        cpu: { avg: 0, max: 0, min: 0 },
        memory: { avg: 0, max: 0, min: 0, peak: 0 },
        loadAverage: { avg: 0, max: 0 },
      };
    }
    
    const cpuValues = this.measurements.map(m => m.cpu.total);
    const memoryValues = this.measurements.map(m => m.memory.heapUsed);
    const loadValues = this.measurements.map(m => m.loadAverage);
    
    return {
      cpu: {
        avg: cpuValues.reduce((sum, v) => sum + v, 0) / cpuValues.length,
        max: Math.max(...cpuValues),
        min: Math.min(...cpuValues),
      },
      memory: {
        avg: memoryValues.reduce((sum, v) => sum + v, 0) / memoryValues.length,
        max: Math.max(...memoryValues),
        min: Math.min(...memoryValues),
        peak: Math.max(...this.measurements.map(m => m.memory.rss)),
      },
      loadAverage: {
        avg: loadValues.reduce((sum, v) => sum + v, 0) / loadValues.length,
        max: Math.max(...loadValues),
      },
    };
  }
}

/**
 * Performance Benchmark Suite
 */
class PerformanceBenchmark extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = { ...BENCHMARK_CONFIG, ...config };
    this.dbManager = new DatabaseManager();
    this.cacheManager = getCacheManager();
    this.resourceMonitor = new ResourceMonitor();
    
    // Benchmark state
    this.measurements = new Map();
    this.benchmarkResults = [];
    this.currentPhase = null;
    this.startTime = null;
    this.endTime = null;
    
    // Performance tracking
    this.throughputTracker = {
      startTime: null,
      requestCount: 0,
      intervals: [],
    };
    
    this.workers = [];
    this.isRunning = false;
    
    this.logger = config.logger || console;
  }

  /**
   * Initialize performance benchmark environment
   */
  async initialize() {
    try {
      this.logger.info('Initializing performance benchmark environment...');
      
      // Initialize database connections
      await this.dbManager.initialize();
      
      // Verify database health
      const health = await this.dbManager.healthCheck();
      if (health.status !== 'healthy') {
        throw new Error(`Database not healthy: ${health.error || 'Unknown error'}`);
      }
      
      // Initialize measurements for each category
      for (const category of this.config.categories) {
        this.measurements.set(category, new PerformanceMeasurement(category));
      }
      
      // Set up resource monitoring
      this.resourceMonitor.on('measurement', (data) => {
        this.handleResourceMeasurement(data);
      });
      
      this.logger.info('Performance benchmark environment initialized');
      
    } catch (error) {
      this.logger.error('Failed to initialize performance benchmark environment:', error);
      throw error;
    }
  }

  /**
   * Run comprehensive performance benchmark
   */
  async runPerformanceBenchmark() {
    this.startTime = Date.now();
    this.isRunning = true;
    
    this.logger.info('Starting comprehensive performance benchmark...');
    
    try {
      // Start resource monitoring
      this.resourceMonitor.start();
      
      // Phase 1: Warmup
      await this.runWarmupPhase();
      
      // Phase 2: Baseline establishment
      await this.establishBaseline();
      
      // Phase 3: Load pattern testing
      await this.runLoadPatternTests();
      
      // Phase 4: Stress testing
      await this.runStressTests();
      
      // Phase 5: Cooldown
      await this.runCooldownPhase();
      
      // Stop resource monitoring
      this.resourceMonitor.stop();
      
      this.endTime = Date.now();
      this.isRunning = false;
      
      // Generate comprehensive report
      const report = await this.generateBenchmarkReport();
      
      this.logger.info('Performance benchmark completed');
      return report;
      
    } catch (error) {
      this.logger.error('Performance benchmark failed:', error);
      throw error;
    }
  }

  /**
   * Run warmup phase
   */
  async runWarmupPhase() {
    this.currentPhase = 'warmup';
    this.logger.info('Starting warmup phase...');
    
    const warmupDuration = this.config.warmupDuration;
    const warmupRPS = 50; // Low RPS for warmup
    
    await this.runLoadPattern({
      name: 'warmup',
      targetRPS: warmupRPS,
      duration: warmupDuration,
    });
    
    this.logger.info('Warmup phase completed');
  }

  /**
   * Establish performance baseline
   */
  async establishBaseline() {
    this.currentPhase = 'baseline';
    this.logger.info('Establishing performance baseline...');
    
    // Run low-load baseline test
    const baselineResults = await this.runLoadPattern({
      name: 'baseline',
      targetRPS: 100,
      duration: 60000, // 1 minute
    });
    
    this.baseline = {
      ...baselineResults,
      timestamp: Date.now(),
    };
    
    this.logger.info(`Baseline established: ${baselineResults.actualRPS.toFixed(2)} RPS, ${baselineResults.avgResponseTime.toFixed(2)}ms avg response time`);
  }

  /**
   * Run load pattern tests
   */
  async runLoadPatternTests() {
    this.currentPhase = 'load_patterns';
    this.logger.info('Running load pattern tests...');
    
    for (const pattern of this.config.loadPatterns) {
      this.logger.info(`Testing load pattern: ${pattern.name} (${pattern.targetRPS} RPS for ${pattern.duration/1000}s)`);
      
      const results = await this.runLoadPattern(pattern);
      
      this.benchmarkResults.push({
        phase: 'load_pattern',
        pattern: pattern.name,
        results,
        timestamp: Date.now(),
      });
      
      // Cool down between patterns
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    this.logger.info('Load pattern tests completed');
  }

  /**
   * Run stress tests
   */
  async runStressTests() {
    this.currentPhase = 'stress';
    this.logger.info('Running stress tests...');
    
    const stressPatterns = [
      { name: 'cpu_stress', type: 'cpu_intensive', targetRPS: 1000, duration: 30000 },
      { name: 'memory_stress', type: 'memory_intensive', targetRPS: 800, duration: 30000 },
      { name: 'io_stress', type: 'io_intensive', targetRPS: 600, duration: 30000 },
      { name: 'concurrent_stress', type: 'high_concurrency', targetRPS: 2000, duration: 20000 },
    ];
    
    for (const stressPattern of stressPatterns) {
      this.logger.info(`Running stress test: ${stressPattern.name}`);
      
      const results = await this.runStressPattern(stressPattern);
      
      this.benchmarkResults.push({
        phase: 'stress_test',
        pattern: stressPattern.name,
        results,
        timestamp: Date.now(),
      });
      
      // Longer cool down between stress tests
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    this.logger.info('Stress tests completed');
  }

  /**
   * Run cooldown phase
   */
  async runCooldownPhase() {
    this.currentPhase = 'cooldown';
    this.logger.info('Starting cooldown phase...');
    
    await new Promise(resolve => setTimeout(resolve, this.config.cooldownDuration));
    
    this.logger.info('Cooldown phase completed');
  }

  /**
   * Run specific load pattern
   */
  async runLoadPattern(pattern) {
    const { name, targetRPS, duration } = pattern;
    const startTime = Date.now();
    
    // Initialize tracking
    this.throughputTracker = {
      startTime,
      requestCount: 0,
      intervals: [],
      pattern: name,
    };
    
    // Calculate request interval
    const requestInterval = 1000 / targetRPS; // milliseconds between requests
    const totalRequests = Math.floor((duration / 1000) * targetRPS);
    
    // Start throughput tracking
    const throughputInterval = setInterval(() => {
      this.trackThroughput();
    }, this.config.measurementInterval);
    
    // Create workers for load generation
    const workerPromises = [];
    const requestsPerWorker = Math.ceil(totalRequests / this.config.workerCount);
    
    for (let i = 0; i < this.config.workerCount; i++) {
      const workerLoad = {
        workerId: i,
        requestCount: Math.min(requestsPerWorker, totalRequests - (i * requestsPerWorker)),
        requestInterval,
        duration,
        pattern: name,
      };
      
      workerPromises.push(this.createLoadWorker(workerLoad));
    }
    
    // Wait for completion or timeout
    const testTimeout = new Promise(resolve => setTimeout(resolve, duration + 10000));
    
    await Promise.race([
      Promise.all(workerPromises),
      testTimeout
    ]);
    
    // Stop throughput tracking
    clearInterval(throughputInterval);
    
    const endTime = Date.now();
    const actualDuration = (endTime - startTime) / 1000;
    const actualRPS = this.throughputTracker.requestCount / actualDuration;
    
    // Calculate statistics
    const stats = this.calculateLoadPatternStats(pattern);
    
    return {
      ...stats,
      actualRPS,
      targetRPS,
      actualDuration,
      requestCount: this.throughputTracker.requestCount,
    };
  }

  /**
   * Create load generation worker
   */
  async createLoadWorker(workload) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: {
          type: 'load_worker',
          workload,
          config: this.config,
        }
      });
      
      this.workers.push(worker);
      
      worker.on('message', (message) => {
        this.handleWorkerMessage(message);
      });
      
      worker.on('error', (error) => {
        this.logger.error(`Load worker ${workload.workerId} error:`, error);
        reject(error);
      });
      
      worker.on('exit', (code) => {
        if (code !== 0) {
          this.logger.warn(`Load worker ${workload.workerId} exited with code ${code}`);
        }
        resolve();
      });
    });
  }

  /**
   * Handle worker messages
   */
  handleWorkerMessage(message) {
    const { type, data } = message;
    
    switch (type) {
      case 'request_completed':
        this.recordRequest(data);
        break;
        
      case 'performance_measurement':
        this.recordPerformanceMeasurement(data);
        break;
        
      case 'error_occurred':
        this.recordError(data);
        break;
    }
  }

  /**
   * Record individual request
   */
  recordRequest(data) {
    this.throughputTracker.requestCount++;
    
    const { category, duration, success, error } = data;
    const measurement = this.measurements.get(category);
    
    if (measurement) {
      measurement.measurements.push({
        duration,
        timestamp: Date.now(),
        success,
        error: error?.message || null,
      });
    }
  }

  /**
   * Record performance measurement
   */
  recordPerformanceMeasurement(data) {
    const { category, operation, metrics } = data;
    
    // Store detailed metrics for analysis
    this.emit('performance_data', {
      category,
      operation,
      metrics,
      timestamp: Date.now(),
    });
  }

  /**
   * Record error
   */
  recordError(data) {
    const { category, error, operation } = data;
    
    this.logger.warn(`Error in ${category}/${operation}: ${error}`);
    
    this.emit('error_recorded', {
      category,
      operation,
      error,
      timestamp: Date.now(),
    });
  }

  /**
   * Track throughput in real-time
   */
  trackThroughput() {
    const now = Date.now();
    const interval = {
      timestamp: now,
      requests: this.throughputTracker.requestCount,
      rps: 0,
    };
    
    // Calculate RPS for this interval
    const previousInterval = this.throughputTracker.intervals[this.throughputTracker.intervals.length - 1];
    if (previousInterval) {
      const timeDiff = (now - previousInterval.timestamp) / 1000;
      const requestDiff = this.throughputTracker.requestCount - previousInterval.requests;
      interval.rps = requestDiff / timeDiff;
    }
    
    this.throughputTracker.intervals.push(interval);
    
    // Keep only recent intervals
    if (this.throughputTracker.intervals.length > 300) { // 5 minutes at 1s intervals
      this.throughputTracker.intervals = this.throughputTracker.intervals.slice(-150);
    }
  }

  /**
   * Calculate load pattern statistics
   */
  calculateLoadPatternStats(pattern) {
    const stats = {};
    
    for (const [category, measurement] of this.measurements) {
      stats[category] = measurement.getStatistics();
    }
    
    // Overall statistics
    const allMeasurements = Array.from(this.measurements.values())
      .flatMap(m => m.measurements)
      .filter(m => m.success);
    
    if (allMeasurements.length > 0) {
      const durations = allMeasurements.map(m => m.duration).sort((a, b) => a - b);
      
      stats.overall = {
        count: allMeasurements.length,
        mean: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        median: durations[Math.floor(durations.length * 0.5)],
        p95: durations[Math.floor(durations.length * 0.95)],
        p99: durations[Math.floor(durations.length * 0.99)],
        min: durations[0],
        max: durations[durations.length - 1],
      };
    } else {
      stats.overall = {
        count: 0,
        mean: 0,
        median: 0,
        p95: 0,
        p99: 0,
        min: 0,
        max: 0,
      };
    }
    
    return stats;
  }

  /**
   * Run stress pattern
   */
  async runStressPattern(stressPattern) {
    const { name, type, targetRPS, duration } = stressPattern;
    
    // Configure stress-specific parameters
    const stressConfig = { ...stressPattern };
    
    switch (type) {
      case 'cpu_intensive':
        stressConfig.operations = ['complex_calculations', 'data_processing', 'encryption'];
        break;
      case 'memory_intensive':
        stressConfig.operations = ['large_data_sets', 'bulk_operations', 'data_aggregation'];
        break;
      case 'io_intensive':
        stressConfig.operations = ['file_operations', 'database_queries', 'network_requests'];
        break;
      case 'high_concurrency':
        stressConfig.concurrentUsers = targetRPS * 2;
        break;
    }
    
    return await this.runLoadPattern(stressConfig);
  }

  /**
   * Handle resource measurement
   */
  handleResourceMeasurement(data) {
    this.emit('resource_measurement', data);
    
    // Check for resource thresholds
    const { cpu, memory, loadAverage } = data;
    
    if (cpu.total > this.config.thresholds.resources.cpuLimit) {
      this.emit('threshold_exceeded', {
        type: 'cpu',
        value: cpu.total,
        threshold: this.config.thresholds.resources.cpuLimit,
      });
    }
    
    const memoryUsagePercent = (memory.heapUsed / memory.heapTotal) * 100;
    if (memoryUsagePercent > this.config.thresholds.resources.memoryLimit) {
      this.emit('threshold_exceeded', {
        type: 'memory',
        value: memoryUsagePercent,
        threshold: this.config.thresholds.resources.memoryLimit,
      });
    }
  }

  /**
   * Generate comprehensive benchmark report
   */
  async generateBenchmarkReport() {
    const testDuration = (this.endTime - this.startTime) / 1000;
    const resourceStats = this.resourceMonitor.getStatistics();
    
    // Calculate overall performance metrics
    const overallStats = this.calculateOverallStatistics();
    
    // Performance trend analysis
    const trends = this.analyzeTrends();
    
    // Bottleneck identification
    const bottlenecks = this.identifyBottlenecks();
    
    const report = {
      summary: {
        testDuration,
        totalRequests: this.throughputTracker.requestCount,
        avgRPS: this.throughputTracker.requestCount / testDuration,
        avgResponseTime: overallStats.overall.mean,
        p95ResponseTime: overallStats.overall.p95,
        p99ResponseTime: overallStats.overall.p99,
        errorRate: this.calculateOverallErrorRate(),
        status: this.getBenchmarkStatus(),
      },
      
      baseline: this.baseline,
      
      loadPatterns: this.benchmarkResults.filter(r => r.phase === 'load_pattern'),
      
      stressTests: this.benchmarkResults.filter(r => r.phase === 'stress_test'),
      
      performance: {
        responseTime: {
          p50: overallStats.overall.median,
          p95: overallStats.overall.p95,
          p99: overallStats.overall.p99,
          mean: overallStats.overall.mean,
          min: overallStats.overall.min,
          max: overallStats.overall.max,
        },
        throughput: {
          average: this.throughputTracker.requestCount / testDuration,
          peak: this.calculatePeakThroughput(),
          sustained: this.calculateSustainedThroughput(),
        },
        categories: overallStats,
      },
      
      resources: {
        cpu: resourceStats.cpu,
        memory: resourceStats.memory,
        loadAverage: resourceStats.loadAverage,
        efficiency: this.calculateResourceEfficiency(resourceStats),
      },
      
      trends,
      bottlenecks,
      
      thresholds: this.evaluateThresholds(overallStats, resourceStats),
      
      recommendations: this.generatePerformanceRecommendations(overallStats, resourceStats, bottlenecks),
      
      timestamp: new Date().toISOString(),
    };
    
    return report;
  }

  /**
   * Calculate overall statistics
   */
  calculateOverallStatistics() {
    const stats = {};
    
    for (const [category, measurement] of this.measurements) {
      stats[category] = measurement.getStatistics();
    }
    
    // Calculate overall metrics
    const allMeasurements = Array.from(this.measurements.values())
      .flatMap(m => m.measurements.filter(measurement => measurement.success));
    
    if (allMeasurements.length > 0) {
      const durations = allMeasurements.map(m => m.duration).sort((a, b) => a - b);
      
      stats.overall = {
        count: allMeasurements.length,
        mean: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        median: durations[Math.floor(durations.length * 0.5)],
        p95: durations[Math.floor(durations.length * 0.95)],
        p99: durations[Math.floor(durations.length * 0.99)],
        min: durations[0],
        max: durations[durations.length - 1],
      };
    } else {
      stats.overall = {
        count: 0,
        mean: 0,
        median: 0,
        p95: 0,
        p99: 0,
        min: 0,
        max: 0,
      };
    }
    
    return stats;
  }

  /**
   * Analyze performance trends
   */
  analyzeTrends() {
    const trends = {
      responseTime: 'stable',
      throughput: 'stable',
      resources: 'stable',
      errors: 'stable',
    };
    
    // Simple trend analysis based on load pattern results
    if (this.benchmarkResults.length >= 2) {
      const early = this.benchmarkResults.slice(0, Math.floor(this.benchmarkResults.length / 2));
      const late = this.benchmarkResults.slice(Math.floor(this.benchmarkResults.length / 2));
      
      const earlyAvgRT = early.reduce((sum, r) => sum + (r.results.overall?.mean || 0), 0) / early.length;
      const lateAvgRT = late.reduce((sum, r) => sum + (r.results.overall?.mean || 0), 0) / late.length;
      
      if (lateAvgRT > earlyAvgRT * 1.2) {
        trends.responseTime = 'degrading';
      } else if (lateAvgRT < earlyAvgRT * 0.8) {
        trends.responseTime = 'improving';
      }
    }
    
    return trends;
  }

  /**
   * Identify performance bottlenecks
   */
  identifyBottlenecks() {
    const bottlenecks = [];
    
    // Analyze category performance
    for (const [category, measurement] of this.measurements) {
      const stats = measurement.getStatistics();
      
      if (stats.p95 > this.config.thresholds.responseTime.p95) {
        bottlenecks.push({
          type: 'response_time',
          category,
          severity: stats.p95 > this.config.thresholds.responseTime.p99 ? 'high' : 'medium',
          value: stats.p95,
          threshold: this.config.thresholds.responseTime.p95,
          description: `${category} response time P95 exceeds threshold`,
        });
      }
      
      if (stats.errorRate > this.config.thresholds.errors.maxErrorRate) {
        bottlenecks.push({
          type: 'error_rate',
          category,
          severity: 'high',
          value: stats.errorRate,
          threshold: this.config.thresholds.errors.maxErrorRate,
          description: `${category} error rate exceeds threshold`,
        });
      }
    }
    
    // Analyze resource bottlenecks
    const resourceStats = this.resourceMonitor.getStatistics();
    
    if (resourceStats.cpu.avg > this.config.thresholds.resources.cpuLimit) {
      bottlenecks.push({
        type: 'cpu',
        category: 'resources',
        severity: 'high',
        value: resourceStats.cpu.avg,
        threshold: this.config.thresholds.resources.cpuLimit,
        description: 'CPU usage exceeds threshold',
      });
    }
    
    const avgMemoryPercent = (resourceStats.memory.avg / resourceStats.memory.peak) * 100;
    if (avgMemoryPercent > this.config.thresholds.resources.memoryLimit) {
      bottlenecks.push({
        type: 'memory',
        category: 'resources',
        severity: 'medium',
        value: avgMemoryPercent,
        threshold: this.config.thresholds.resources.memoryLimit,
        description: 'Memory usage exceeds threshold',
      });
    }
    
    return bottlenecks.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Calculate overall error rate
   */
  calculateOverallErrorRate() {
    let totalRequests = 0;
    let totalErrors = 0;
    
    for (const measurement of this.measurements.values()) {
      const stats = measurement.getStatistics();
      totalRequests += stats.total;
      totalErrors += stats.errors;
    }
    
    return totalRequests > 0 ? totalErrors / totalRequests : 0;
  }

  /**
   * Calculate peak throughput
   */
  calculatePeakThroughput() {
    if (this.throughputTracker.intervals.length === 0) return 0;
    
    return Math.max(...this.throughputTracker.intervals.map(i => i.rps));
  }

  /**
   * Calculate sustained throughput
   */
  calculateSustainedThroughput() {
    if (this.throughputTracker.intervals.length < 10) return 0;
    
    // Take 90th percentile of throughput measurements
    const sorted = this.throughputTracker.intervals
      .map(i => i.rps)
      .sort((a, b) => a - b);
    
    return sorted[Math.floor(sorted.length * 0.9)];
  }

  /**
   * Calculate resource efficiency
   */
  calculateResourceEfficiency(resourceStats) {
    const cpuEfficiency = Math.max(0, 100 - resourceStats.cpu.avg);
    const memoryEfficiency = Math.max(0, 100 - (resourceStats.memory.avg / resourceStats.memory.peak * 100));
    
    return {
      overall: (cpuEfficiency + memoryEfficiency) / 2,
      cpu: cpuEfficiency,
      memory: memoryEfficiency,
    };
  }

  /**
   * Evaluate performance against thresholds
   */
  evaluateThresholds(overallStats, resourceStats) {
    const evaluation = {
      responseTime: {
        p50: {
          value: overallStats.overall.median,
          threshold: this.config.thresholds.responseTime.p50,
          passed: overallStats.overall.median <= this.config.thresholds.responseTime.p50,
        },
        p95: {
          value: overallStats.overall.p95,
          threshold: this.config.thresholds.responseTime.p95,
          passed: overallStats.overall.p95 <= this.config.thresholds.responseTime.p95,
        },
        p99: {
          value: overallStats.overall.p99,
          threshold: this.config.thresholds.responseTime.p99,
          passed: overallStats.overall.p99 <= this.config.thresholds.responseTime.p99,
        },
      },
      throughput: {
        minimum: {
          value: this.throughputTracker.requestCount / ((this.endTime - this.startTime) / 1000),
          threshold: this.config.thresholds.throughput.minimum,
          passed: (this.throughputTracker.requestCount / ((this.endTime - this.startTime) / 1000)) >= this.config.thresholds.throughput.minimum,
        },
      },
      resources: {
        cpu: {
          value: resourceStats.cpu.avg,
          threshold: this.config.thresholds.resources.cpuLimit,
          passed: resourceStats.cpu.avg <= this.config.thresholds.resources.cpuLimit,
        },
        memory: {
          value: (resourceStats.memory.avg / resourceStats.memory.peak) * 100,
          threshold: this.config.thresholds.resources.memoryLimit,
          passed: (resourceStats.memory.avg / resourceStats.memory.peak) * 100 <= this.config.thresholds.resources.memoryLimit,
        },
      },
    };
    
    return evaluation;
  }

  /**
   * Get benchmark status
   */
  getBenchmarkStatus() {
    const overallStats = this.calculateOverallStatistics();
    const resourceStats = this.resourceMonitor.getStatistics();
    const thresholds = this.evaluateThresholds(overallStats, resourceStats);
    
    const allPassed = Object.values(thresholds)
      .flatMap(category => Object.values(category))
      .every(metric => metric.passed);
    
    return allPassed ? 'PASSED' : 'FAILED';
  }

  /**
   * Generate performance recommendations
   */
  generatePerformanceRecommendations(overallStats, resourceStats, bottlenecks) {
    const recommendations = [];
    
    // Response time recommendations
    if (overallStats.overall.p95 > this.config.thresholds.responseTime.p95) {
      recommendations.push({
        type: 'RESPONSE_TIME',
        severity: 'HIGH',
        message: `P95 response time (${overallStats.overall.p95.toFixed(2)}ms) exceeds threshold`,
        action: 'Optimize slow operations, add caching, or scale horizontally',
        impact: 'User experience degradation',
      });
    }
    
    // Throughput recommendations
    const avgThroughput = this.throughputTracker.requestCount / ((this.endTime - this.startTime) / 1000);
    if (avgThroughput < this.config.thresholds.throughput.target) {
      recommendations.push({
        type: 'THROUGHPUT',
        severity: 'MEDIUM',
        message: `Average throughput (${avgThroughput.toFixed(2)} RPS) below target`,
        action: 'Optimize request processing, add load balancing, or increase server capacity',
        impact: 'Reduced system capacity',
      });
    }
    
    // Resource recommendations
    if (resourceStats.cpu.avg > this.config.thresholds.resources.cpuLimit) {
      recommendations.push({
        type: 'CPU_UTILIZATION',
        severity: 'HIGH',
        message: `High CPU utilization (${resourceStats.cpu.avg.toFixed(2)}%)`,
        action: 'Optimize CPU-intensive operations or add more CPU cores',
        impact: 'Performance degradation and potential service interruption',
      });
    }
    
    // Bottleneck-specific recommendations
    for (const bottleneck of bottlenecks.slice(0, 3)) { // Top 3 bottlenecks
      recommendations.push({
        type: 'BOTTLENECK',
        severity: bottleneck.severity.toUpperCase(),
        message: bottleneck.description,
        action: this.getBottleneckRecommendation(bottleneck),
        impact: 'Performance bottleneck limiting system capacity',
      });
    }
    
    return recommendations;
  }

  /**
   * Get specific recommendation for bottleneck
   */
  getBottleneckRecommendation(bottleneck) {
    switch (bottleneck.type) {
      case 'response_time':
        return `Optimize ${bottleneck.category} operations, add caching, or review database queries`;
      case 'error_rate':
        return `Investigate and fix errors in ${bottleneck.category} to improve reliability`;
      case 'cpu':
        return 'Scale CPU resources or optimize CPU-intensive operations';
      case 'memory':
        return 'Increase memory allocation or optimize memory usage patterns';
      default:
        return 'Review system architecture and optimize identified bottleneck';
    }
  }

  /**
   * Cleanup benchmark resources
   */
  async cleanup() {
    this.logger.info('Cleaning up performance benchmark resources...');
    
    try {
      // Stop resource monitoring
      this.resourceMonitor.stop();
      
      // Terminate workers
      for (const worker of this.workers) {
        await worker.terminate();
      }
      this.workers = [];
      
      // Close database connections
      await this.dbManager.close();
      
      this.logger.info('Performance benchmark cleanup completed');
      
    } catch (error) {
      this.logger.error('Performance benchmark cleanup failed:', error);
    }
  }
}

/**
 * Worker thread implementation
 */
if (!isMainThread) {
  const { type, workload, config } = workerData;
  
  if (type === 'load_worker') {
    import('./performance-worker.js').then(async ({ PerformanceWorker }) => {
      const worker = new PerformanceWorker(workload, config);
      await worker.run();
    }).catch(error => {
      parentPort.postMessage({
        type: 'error_occurred',
        data: { error: error.message, workerId: workload.workerId }
      });
    });
  }
}

export default PerformanceBenchmark;

/**
 * Standalone execution
 */
if (isMainThread && import.meta.url === `file://${process.argv[1]}`) {
  const benchmark = new PerformanceBenchmark();
  
  const runBenchmark = async () => {
    try {
      await benchmark.initialize();
      const report = await benchmark.runPerformanceBenchmark();
      
      console.log('\n=== PERFORMANCE BENCHMARK REPORT ===');
      console.log(JSON.stringify(report, null, 2));
      
      // Save report to file
      const reportPath = `performance-benchmark-report-${Date.now()}.json`;
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`\nReport saved to: ${reportPath}`);
      
      process.exit(report.summary.status === 'PASSED' ? 0 : 1);
      
    } catch (error) {
      console.error('Performance benchmark failed:', error);
      process.exit(1);
    } finally {
      await benchmark.cleanup();
    }
  };
  
  runBenchmark();
}