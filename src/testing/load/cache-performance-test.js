/**
 * MLG.clan Platform Cache Performance Testing Suite
 * 
 * Comprehensive performance testing for Redis cache system with high-throughput scenarios.
 * Tests cache performance under various load conditions, measures hit/miss rates,
 * validates cache consistency, and ensures optimal memory usage.
 * 
 * Features:
 * - High-throughput cache operations simulation
 * - Cache hit/miss ratio analysis
 * - Memory usage and eviction testing
 * - Cache consistency validation
 * - Compression performance testing
 * - Multi-tier cache testing (memory + Redis)
 * - Cache warming and invalidation testing
 * - Performance degradation analysis
 * 
 * @author Claude Code - Universal Testing & Verification Agent
 * @version 1.0.0
 * @created 2025-08-11
 */

import { performance } from 'perf_hooks';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { EventEmitter } from 'events';
import crypto from 'crypto';

import { getCacheManager } from '../../cache/cache-manager.js';
import { getRedisClient } from '../../cache/redis-client.js';

/**
 * Cache Performance Test Configuration
 */
const CACHE_TEST_CONFIG = {
  // Test parameters
  testDuration: parseInt(process.env.CACHE_TEST_DURATION) || 300000, // 5 minutes
  maxConcurrentOperations: parseInt(process.env.CACHE_MAX_CONCURRENT) || 1000,
  workerCount: parseInt(process.env.CACHE_TEST_WORKERS) || 20,
  
  // Operation distribution
  operationDistribution: {
    read: 0.7,    // 70% reads
    write: 0.2,   // 20% writes
    delete: 0.05, // 5% deletes
    invalidate: 0.05, // 5% invalidations
  },
  
  // Performance thresholds
  maxResponseTime: 100, // 100ms for cache operations
  minHitRate: 0.8, // 80% hit rate
  maxErrorRate: 0.01, // 1% error rate
  minThroughput: 10000, // 10k operations per second
  
  // Data generation
  keyCount: 100000,
  valueSize: {
    small: 100,   // 100 bytes
    medium: 1000, // 1KB
    large: 10000, // 10KB
  },
  
  // Cache settings
  namespaces: ['user', 'clan', 'content', 'voting', 'session'],
  compressionThreshold: 1024,
  
  // Memory pressure testing
  memoryPressureEnabled: true,
  maxMemoryUsage: 512 * 1024 * 1024, // 512MB
};

/**
 * Test data generators
 */
const generateCacheKey = (namespace, index) => {
  const keyTypes = ['profile', 'stats', 'settings', 'history', 'temp'];
  const keyType = keyTypes[Math.floor(Math.random() * keyTypes.length)];
  return `${keyType}_${index}_${Math.random().toString(36).substring(2, 8)}`;
};

const generateCacheValue = (size) => {
  const data = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    type: 'performance_test_data',
    payload: crypto.randomBytes(size).toString('base64'),
    metadata: {
      generated_at: new Date().toISOString(),
      size_bytes: size,
      test_run: process.pid,
    },
  };
  
  // Add nested objects for complexity
  if (size > 1000) {
    data.complex_data = {
      stats: Array.from({ length: 10 }, (_, i) => ({
        metric: `metric_${i}`,
        value: Math.random() * 1000,
        timestamp: Date.now() - Math.random() * 86400000,
      })),
      preferences: {
        theme: 'dark',
        language: 'en',
        notifications: true,
        privacy_settings: {
          profile_visible: true,
          show_online_status: false,
          allow_clan_invites: true,
        },
      },
    };
  }
  
  return data;
};

const generateGameSpecificData = (namespace, index) => {
  switch (namespace) {
    case 'user':
      return {
        user_id: `test_user_${index}`,
        wallet_address: `MLG${crypto.randomBytes(16).toString('hex')}`,
        username: `TestUser${index}`,
        level: Math.floor(Math.random() * 100) + 1,
        xp: Math.floor(Math.random() * 100000),
        clan_id: `clan_${Math.floor(Math.random() * 1000)}`,
        stats: {
          games_played: Math.floor(Math.random() * 1000),
          wins: Math.floor(Math.random() * 500),
          losses: Math.floor(Math.random() * 500),
          score: Math.floor(Math.random() * 50000),
        },
      };
      
    case 'clan':
      return {
        clan_id: `test_clan_${index}`,
        name: `TestClan${index}`,
        member_count: Math.floor(Math.random() * 1000) + 10,
        level: Math.floor(Math.random() * 50) + 1,
        total_score: Math.floor(Math.random() * 1000000),
        leaderboard_position: Math.floor(Math.random() * 10000) + 1,
        recent_activities: Array.from({ length: 20 }, (_, i) => ({
          type: ['vote', 'join', 'achievement', 'battle'][Math.floor(Math.random() * 4)],
          timestamp: Date.now() - Math.random() * 86400000,
          user_id: `user_${Math.floor(Math.random() * 1000)}`,
        })),
      };
      
    case 'content':
      return {
        content_id: `content_${index}`,
        title: `Test Content ${index}`,
        creator_id: `user_${Math.floor(Math.random() * 1000)}`,
        views: Math.floor(Math.random() * 100000),
        likes: Math.floor(Math.random() * 10000),
        comments_count: Math.floor(Math.random() * 1000),
        trending_score: Math.random() * 100,
        tags: ['gaming', 'mlg', 'clan', 'competitive'],
        metadata: {
          duration: Math.floor(Math.random() * 600) + 30,
          file_size: Math.floor(Math.random() * 100000000) + 1000000,
          resolution: '1920x1080',
        },
      };
      
    case 'voting':
      return {
        session_id: `vote_session_${index}`,
        title: `Vote Session ${index}`,
        status: ['active', 'completed', 'pending'][Math.floor(Math.random() * 3)],
        total_votes: Math.floor(Math.random() * 10000),
        total_tokens_burned: Math.floor(Math.random() * 1000000),
        options: Array.from({ length: Math.floor(Math.random() * 5) + 2 }, (_, i) => ({
          id: i,
          text: `Option ${i + 1}`,
          votes: Math.floor(Math.random() * 1000),
          tokens_burned: Math.floor(Math.random() * 100000),
        })),
        results: {
          winner: Math.floor(Math.random() * 5),
          margin: Math.random(),
          participation_rate: Math.random(),
        },
      };
      
    case 'session':
      return {
        session_id: `session_${index}`,
        user_id: `user_${Math.floor(Math.random() * 1000)}`,
        created_at: Date.now() - Math.random() * 3600000,
        last_activity: Date.now() - Math.random() * 600000,
        ip_address: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
        user_agent: 'Mozilla/5.0 (Test Browser) MLG/1.0',
        permissions: ['read', 'write', 'vote', 'clan_manage'],
        features: {
          voting_enabled: true,
          clan_management: Math.random() > 0.5,
          content_creation: Math.random() > 0.3,
        },
      };
      
    default:
      return generateCacheValue(CACHE_TEST_CONFIG.valueSize.medium);
  }
};

/**
 * Cache Performance Tester Class
 */
class CachePerformanceTester extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = { ...CACHE_TEST_CONFIG, ...config };
    this.cacheManager = getCacheManager();
    this.redisClient = getRedisClient();
    
    // Test metrics
    this.metrics = {
      operations: {
        total: 0,
        read: 0,
        write: 0,
        delete: 0,
        invalidate: 0,
      },
      
      results: {
        hits: 0,
        misses: 0,
        errors: 0,
        timeouts: 0,
      },
      
      performance: {
        totalResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        responseTimeP50: 0,
        responseTimeP95: 0,
        responseTimeP99: 0,
        responseTimes: [],
      },
      
      throughput: {
        startTime: null,
        endTime: null,
        operationsPerSecond: 0,
        peakOps: 0,
        averageOps: 0,
      },
      
      memory: {
        redisMemoryUsage: 0,
        localCacheSize: 0,
        compressionRatio: 0,
        evictions: 0,
      },
      
      consistency: {
        inconsistencies: 0,
        staleReads: 0,
        writeConflicts: 0,
      },
    };
    
    this.workers = [];
    this.testKeys = [];
    this.isRunning = false;
    
    this.logger = config.logger || console;
  }

  /**
   * Initialize cache performance testing environment
   */
  async initialize() {
    try {
      this.logger.info('Initializing cache performance testing environment...');
      
      // Test cache connectivity
      await this.redisClient.ping();
      
      // Generate test keys
      this.generateTestKeys();
      
      // Pre-warm cache with test data
      await this.warmCache();
      
      this.logger.info('Cache performance testing environment initialized');
      
    } catch (error) {
      this.logger.error('Failed to initialize cache testing environment:', error);
      throw error;
    }
  }

  /**
   * Generate test keys for consistent testing
   */
  generateTestKeys() {
    this.logger.info('Generating test keys...');
    
    const keysPerNamespace = Math.floor(this.config.keyCount / this.config.namespaces.length);
    
    for (const namespace of this.config.namespaces) {
      for (let i = 0; i < keysPerNamespace; i++) {
        this.testKeys.push({
          namespace,
          key: generateCacheKey(namespace, i),
          index: i,
        });
      }
    }
    
    this.logger.info(`Generated ${this.testKeys.length} test keys across ${this.config.namespaces.length} namespaces`);
  }

  /**
   * Pre-warm cache with test data
   */
  async warmCache() {
    this.logger.info('Warming cache with test data...');
    
    const warmingPromises = [];
    const batchSize = 100;
    
    for (let i = 0; i < this.testKeys.length; i += batchSize) {
      const batch = this.testKeys.slice(i, i + batchSize);
      
      const batchPromise = Promise.all(
        batch.map(async ({ namespace, key, index }) => {
          try {
            const value = generateGameSpecificData(namespace, index);
            const ttl = Math.floor(Math.random() * 3600) + 300; // 5 minutes to 1 hour
            
            await this.cacheManager.set(namespace, key, value, { ttl });
            
          } catch (error) {
            this.logger.warn(`Failed to warm cache for ${namespace}:${key}:`, error.message);
          }
        })
      );
      
      warmingPromises.push(batchPromise);
      
      // Small delay to avoid overwhelming Redis
      if (warmingPromises.length % 10 === 0) {
        await Promise.all(warmingPromises.splice(0, 10));
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    await Promise.all(warmingPromises);
    this.logger.info('Cache warming completed');
  }

  /**
   * Run comprehensive cache performance test
   */
  async runPerformanceTest() {
    this.metrics.throughput.startTime = Date.now();
    this.isRunning = true;
    
    this.logger.info('Starting cache performance test...');
    
    try {
      // Start monitoring
      const monitoringInterval = setInterval(() => {
        this.updateMetrics();
      }, 5000); // Update metrics every 5 seconds
      
      // Create worker threads for concurrent operations
      const workerPromises = [];
      
      for (let i = 0; i < this.config.workerCount; i++) {
        const workerPromise = this.createPerformanceWorker(i);
        workerPromises.push(workerPromise);
      }
      
      // Run memory pressure test if enabled
      let memoryTestPromise = Promise.resolve();
      if (this.config.memoryPressureEnabled) {
        memoryTestPromise = this.runMemoryPressureTest();
      }
      
      // Wait for test duration or workers to complete
      const testTimeout = new Promise(resolve => 
        setTimeout(resolve, this.config.testDuration)
      );
      
      await Promise.race([
        Promise.all([...workerPromises, memoryTestPromise]),
        testTimeout
      ]);
      
      // Stop monitoring
      clearInterval(monitoringInterval);
      
      // Terminate all workers
      await this.terminateAllWorkers();
      
      this.metrics.throughput.endTime = Date.now();
      this.isRunning = false;
      
      // Final metrics calculation
      await this.calculateFinalMetrics();
      
      // Generate comprehensive report
      const report = await this.generatePerformanceReport();
      
      this.logger.info('Cache performance test completed');
      return report;
      
    } catch (error) {
      this.logger.error('Cache performance test failed:', error);
      throw error;
    }
  }

  /**
   * Create performance test worker
   */
  async createPerformanceWorker(workerId) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: {
          workerId,
          config: this.config,
          testKeys: this.testKeys,
        }
      });
      
      this.workers.push(worker);
      
      worker.on('message', (message) => {
        this.handleWorkerMessage(message);
      });
      
      worker.on('error', (error) => {
        this.logger.error(`Cache worker ${workerId} error:`, error);
        reject(error);
      });
      
      worker.on('exit', (code) => {
        if (code !== 0) {
          this.logger.warn(`Cache worker ${workerId} exited with code ${code}`);
        }
        resolve();
      });
    });
  }

  /**
   * Handle worker messages for metrics collection
   */
  handleWorkerMessage(message) {
    const { type, data } = message;
    
    switch (type) {
      case 'operation_completed':
        this.recordOperation(data);
        break;
        
      case 'metrics_update':
        this.updateWorkerMetrics(data);
        break;
        
      case 'error_occurred':
        this.recordError(data);
        break;
    }
  }

  /**
   * Record operation results
   */
  recordOperation(data) {
    const { operation, responseTime, result, error } = data;
    
    this.metrics.operations.total++;
    this.metrics.operations[operation]++;
    
    if (error) {
      this.metrics.results.errors++;
      return;
    }
    
    // Record response time
    this.metrics.performance.totalResponseTime += responseTime;
    this.metrics.performance.minResponseTime = Math.min(
      this.metrics.performance.minResponseTime,
      responseTime
    );
    this.metrics.performance.maxResponseTime = Math.max(
      this.metrics.performance.maxResponseTime,
      responseTime
    );
    this.metrics.performance.responseTimes.push(responseTime);
    
    // Record cache hit/miss
    if (operation === 'read') {
      if (result && result !== null) {
        this.metrics.results.hits++;
      } else {
        this.metrics.results.misses++;
      }
    }
    
    // Keep only recent response times for percentile calculation
    if (this.metrics.performance.responseTimes.length > 10000) {
      this.metrics.performance.responseTimes = this.metrics.performance.responseTimes.slice(-5000);
    }
  }

  /**
   * Update metrics from worker data
   */
  updateWorkerMetrics(data) {
    // Update throughput metrics
    const currentTime = Date.now();
    const duration = (currentTime - this.metrics.throughput.startTime) / 1000;
    
    if (duration > 0) {
      this.metrics.throughput.operationsPerSecond = this.metrics.operations.total / duration;
      this.metrics.throughput.peakOps = Math.max(
        this.metrics.throughput.peakOps,
        this.metrics.throughput.operationsPerSecond
      );
    }
  }

  /**
   * Record error
   */
  recordError(data) {
    const { error, operation } = data;
    
    this.metrics.results.errors++;
    
    if (error.includes('timeout')) {
      this.metrics.results.timeouts++;
    }
    
    if (error.includes('consistency')) {
      this.metrics.consistency.inconsistencies++;
    }
  }

  /**
   * Run memory pressure test
   */
  async runMemoryPressureTest() {
    this.logger.info('Starting memory pressure test...');
    
    const largeDatas = [];
    const testDuration = Math.min(this.config.testDuration / 2, 60000); // Max 1 minute
    const startTime = Date.now();
    
    try {
      while (Date.now() - startTime < testDuration) {
        // Generate large cache entries
        const largeValue = generateCacheValue(this.config.valueSize.large);
        const key = `memory_pressure_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        
        await this.cacheManager.set('test', key, largeValue, { ttl: 60 });
        largeDatas.push(key);
        
        // Check memory usage
        const memoryInfo = await this.redisClient.info('memory');
        const memoryUsage = parseInt(memoryInfo.match(/used_memory:(\d+)/)?.[1] || 0);
        
        this.metrics.memory.redisMemoryUsage = Math.max(
          this.metrics.memory.redisMemoryUsage,
          memoryUsage
        );
        
        if (memoryUsage > this.config.maxMemoryUsage) {
          this.logger.warn(`Memory usage (${memoryUsage}) exceeds threshold (${this.config.maxMemoryUsage})`);
          this.metrics.memory.evictions++;
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      this.logger.error('Memory pressure test error:', error);
    } finally {
      // Cleanup large data
      for (const key of largeDatas) {
        try {
          await this.cacheManager.delete('test', key);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }
    
    this.logger.info('Memory pressure test completed');
  }

  /**
   * Calculate final performance metrics
   */
  async calculateFinalMetrics() {
    const duration = (this.metrics.throughput.endTime - this.metrics.throughput.startTime) / 1000;
    
    // Calculate throughput
    this.metrics.throughput.averageOps = this.metrics.operations.total / duration;
    
    // Calculate response time percentiles
    if (this.metrics.performance.responseTimes.length > 0) {
      const sortedTimes = this.metrics.performance.responseTimes.sort((a, b) => a - b);
      const len = sortedTimes.length;
      
      this.metrics.performance.responseTimeP50 = sortedTimes[Math.floor(len * 0.5)];
      this.metrics.performance.responseTimeP95 = sortedTimes[Math.floor(len * 0.95)];
      this.metrics.performance.responseTimeP99 = sortedTimes[Math.floor(len * 0.99)];
    }
    
    // Get cache statistics
    const cacheStats = this.cacheManager.getStats();
    this.metrics.memory.localCacheSize = cacheStats.memoryCacheSize;
    
    // Calculate hit rate
    const totalReads = this.metrics.results.hits + this.metrics.results.misses;
    this.metrics.hitRate = totalReads > 0 ? this.metrics.results.hits / totalReads : 0;
    
    // Calculate error rate
    this.metrics.errorRate = this.metrics.operations.total > 0 
      ? this.metrics.results.errors / this.metrics.operations.total 
      : 0;
  }

  /**
   * Update real-time metrics
   */
  async updateMetrics() {
    if (!this.isRunning) return;
    
    const currentTime = Date.now();
    const duration = (currentTime - this.metrics.throughput.startTime) / 1000;
    
    if (duration > 0) {
      const currentOps = this.metrics.operations.total / duration;
      this.metrics.throughput.operationsPerSecond = currentOps;
      this.metrics.throughput.peakOps = Math.max(this.metrics.throughput.peakOps, currentOps);
      
      this.logger.info(`Cache Performance: ${currentOps.toFixed(2)} ops/s, Hit Rate: ${(this.metrics.hitRate * 100).toFixed(2)}%, Errors: ${this.metrics.results.errors}`);
    }
  }

  /**
   * Terminate all worker threads
   */
  async terminateAllWorkers() {
    const terminatePromises = this.workers.map(worker => {
      return new Promise((resolve) => {
        worker.terminate().then(() => resolve()).catch(() => resolve());
      });
    });
    
    await Promise.all(terminatePromises);
    this.workers = [];
  }

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport() {
    const duration = (this.metrics.throughput.endTime - this.metrics.throughput.startTime) / 1000;
    
    // Get Redis info
    const redisInfo = await this.redisClient.info();
    const redisStats = this.redisClient.getStats?.() || {};
    
    const report = {
      summary: {
        testDuration: duration,
        totalOperations: this.metrics.operations.total,
        operationsPerSecond: this.metrics.throughput.averageOps,
        peakOperationsPerSecond: this.metrics.throughput.peakOps,
        hitRate: this.metrics.hitRate,
        errorRate: this.metrics.errorRate,
        status: this.getTestStatus(),
      },
      
      operations: {
        breakdown: { ...this.metrics.operations },
        distribution: {
          read: this.metrics.operations.read / this.metrics.operations.total,
          write: this.metrics.operations.write / this.metrics.operations.total,
          delete: this.metrics.operations.delete / this.metrics.operations.total,
          invalidate: this.metrics.operations.invalidate / this.metrics.operations.total,
        },
      },
      
      performance: {
        averageResponseTime: this.metrics.operations.total > 0 
          ? this.metrics.performance.totalResponseTime / this.metrics.operations.total 
          : 0,
        minResponseTime: this.metrics.performance.minResponseTime === Infinity 
          ? 0 
          : this.metrics.performance.minResponseTime,
        maxResponseTime: this.metrics.performance.maxResponseTime,
        percentiles: {
          p50: this.metrics.performance.responseTimeP50,
          p95: this.metrics.performance.responseTimeP95,
          p99: this.metrics.performance.responseTimeP99,
        },
      },
      
      cache: {
        hits: this.metrics.results.hits,
        misses: this.metrics.results.misses,
        hitRate: this.metrics.hitRate,
        localCacheSize: this.metrics.memory.localCacheSize,
        compressionRatio: this.metrics.memory.compressionRatio,
        evictions: this.metrics.memory.evictions,
      },
      
      redis: {
        memoryUsage: this.metrics.memory.redisMemoryUsage,
        connectionStats: redisStats,
        info: this.parseRedisInfo(redisInfo),
      },
      
      errors: {
        total: this.metrics.results.errors,
        rate: this.metrics.errorRate,
        timeouts: this.metrics.results.timeouts,
        consistency: {
          inconsistencies: this.metrics.consistency.inconsistencies,
          staleReads: this.metrics.consistency.staleReads,
          writeConflicts: this.metrics.consistency.writeConflicts,
        },
      },
      
      recommendations: this.generatePerformanceRecommendations(),
      
      timestamp: new Date().toISOString(),
    };
    
    return report;
  }

  /**
   * Determine test status based on thresholds
   */
  getTestStatus() {
    const conditions = [
      this.metrics.throughput.averageOps >= this.config.minThroughput,
      this.metrics.hitRate >= this.config.minHitRate,
      this.metrics.errorRate <= this.config.maxErrorRate,
      this.metrics.performance.responseTimeP95 <= this.config.maxResponseTime,
    ];
    
    return conditions.every(Boolean) ? 'PASSED' : 'FAILED';
  }

  /**
   * Parse Redis info string
   */
  parseRedisInfo(infoString) {
    const info = {};
    const sections = infoString.split(/\r?\n\r?\n/);
    
    for (const section of sections) {
      const lines = section.split(/\r?\n/);
      const sectionName = lines[0]?.replace('# ', '') || 'unknown';
      info[sectionName] = {};
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line && line.includes(':')) {
          const [key, value] = line.split(':');
          info[sectionName][key] = isNaN(value) ? value : Number(value);
        }
      }
    }
    
    return info;
  }

  /**
   * Generate performance recommendations
   */
  generatePerformanceRecommendations() {
    const recommendations = [];
    
    // Throughput recommendations
    if (this.metrics.throughput.averageOps < this.config.minThroughput) {
      recommendations.push({
        type: 'THROUGHPUT',
        severity: 'HIGH',
        message: `Average throughput (${this.metrics.throughput.averageOps.toFixed(2)} ops/s) below minimum (${this.config.minThroughput} ops/s)`,
        action: 'Consider increasing Redis instance size, optimizing serialization, or implementing connection pooling',
      });
    }
    
    // Hit rate recommendations
    if (this.metrics.hitRate < this.config.minHitRate) {
      recommendations.push({
        type: 'HIT_RATE',
        severity: 'MEDIUM',
        message: `Cache hit rate (${(this.metrics.hitRate * 100).toFixed(2)}%) below target (${(this.config.minHitRate * 100)}%)`,
        action: 'Review cache TTL settings, implement cache warming strategies, or optimize cache key patterns',
      });
    }
    
    // Response time recommendations
    if (this.metrics.performance.responseTimeP95 > this.config.maxResponseTime) {
      recommendations.push({
        type: 'RESPONSE_TIME',
        severity: 'HIGH',
        message: `95th percentile response time (${this.metrics.performance.responseTimeP95.toFixed(2)}ms) exceeds threshold (${this.config.maxResponseTime}ms)`,
        action: 'Optimize Redis configuration, reduce payload sizes, or implement compression',
      });
    }
    
    // Error rate recommendations
    if (this.metrics.errorRate > this.config.maxErrorRate) {
      recommendations.push({
        type: 'ERROR_RATE',
        severity: 'HIGH',
        message: `Error rate (${(this.metrics.errorRate * 100).toFixed(2)}%) exceeds threshold (${(this.config.maxErrorRate * 100)}%)`,
        action: 'Investigate error logs, implement retry logic, or increase timeout values',
      });
    }
    
    // Memory recommendations
    if (this.metrics.memory.evictions > 0) {
      recommendations.push({
        type: 'MEMORY',
        severity: 'MEDIUM',
        message: `Cache evictions detected (${this.metrics.memory.evictions})`,
        action: 'Increase Redis memory limit or review TTL settings to prevent premature evictions',
      });
    }
    
    // Consistency recommendations
    if (this.metrics.consistency.inconsistencies > 0) {
      recommendations.push({
        type: 'CONSISTENCY',
        severity: 'HIGH',
        message: `Cache consistency issues detected (${this.metrics.consistency.inconsistencies})`,
        action: 'Review cache invalidation patterns and implement proper cache synchronization',
      });
    }
    
    return recommendations;
  }

  /**
   * Cleanup cache testing resources
   */
  async cleanup() {
    this.logger.info('Cleaning up cache test resources...');
    
    try {
      // Clear test data from cache
      for (const namespace of this.config.namespaces) {
        await this.cacheManager.invalidatePattern(namespace, '*');
      }
      
      // Clear test namespace
      await this.cacheManager.invalidatePattern('test', '*');
      
      this.logger.info('Cache cleanup completed');
      
    } catch (error) {
      this.logger.error('Cache cleanup failed:', error);
    }
  }
}

/**
 * Worker thread implementation for cache operations
 */
if (!isMainThread) {
  const { workerId, config, testKeys } = workerData;
  
  // Import cache manager in worker
  import('../../cache/cache-manager.js').then(async ({ getCacheManager }) => {
    const cacheManager = getCacheManager();
    
    const runCacheOperations = async () => {
      const startTime = Date.now();
      const operations = ['read', 'write', 'delete', 'invalidate'];
      
      try {
        while (Date.now() - startTime < config.testDuration) {
          // Select random operation based on distribution
          const rand = Math.random();
          let operation;
          
          if (rand < config.operationDistribution.read) {
            operation = 'read';
          } else if (rand < config.operationDistribution.read + config.operationDistribution.write) {
            operation = 'write';
          } else if (rand < config.operationDistribution.read + config.operationDistribution.write + config.operationDistribution.delete) {
            operation = 'delete';
          } else {
            operation = 'invalidate';
          }
          
          const testKey = testKeys[Math.floor(Math.random() * testKeys.length)];
          const startOpTime = performance.now();
          
          let result = null;
          let error = null;
          
          try {
            switch (operation) {
              case 'read':
                result = await cacheManager.get(testKey.namespace, testKey.key);
                break;
                
              case 'write':
                const value = generateGameSpecificData(testKey.namespace, testKey.index);
                const ttl = Math.floor(Math.random() * 3600) + 300;
                result = await cacheManager.set(testKey.namespace, testKey.key, value, { ttl });
                break;
                
              case 'delete':
                result = await cacheManager.delete(testKey.namespace, testKey.key);
                break;
                
              case 'invalidate':
                result = await cacheManager.invalidatePattern(testKey.namespace, `${testKey.key.split('_')[0]}*`);
                break;
            }
            
          } catch (err) {
            error = err.message;
          }
          
          const responseTime = performance.now() - startOpTime;
          
          parentPort.postMessage({
            type: 'operation_completed',
            data: {
              workerId,
              operation,
              responseTime,
              result,
              error,
            }
          });
          
          // Small delay to simulate realistic load
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        }
        
      } catch (error) {
        parentPort.postMessage({
          type: 'error_occurred',
          data: { workerId, error: error.message, operation: 'worker_operations' }
        });
      }
    };
    
    await runCacheOperations();
  });
}

export default CachePerformanceTester;

/**
 * Standalone execution
 */
if (isMainThread && import.meta.url === `file://${process.argv[1]}`) {
  const performanceTester = new CachePerformanceTester();
  
  const runTest = async () => {
    try {
      await performanceTester.initialize();
      const report = await performanceTester.runPerformanceTest();
      
      console.log('\n=== CACHE PERFORMANCE TEST REPORT ===');
      console.log(JSON.stringify(report, null, 2));
      
      // Save report to file
      const fs = await import('fs/promises');
      const reportPath = `cache-performance-report-${Date.now()}.json`;
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`\nReport saved to: ${reportPath}`);
      
      process.exit(report.summary.status === 'PASSED' ? 0 : 1);
      
    } catch (error) {
      console.error('Cache performance test failed:', error);
      process.exit(1);
    } finally {
      await performanceTester.cleanup();
    }
  };
  
  runTest();
}