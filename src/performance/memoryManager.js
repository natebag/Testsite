/**
 * Memory Manager for MLG.clan Platform
 * 
 * Advanced memory management system with application-level LRU caching,
 * memory usage monitoring, garbage collection optimization, and memory leak detection.
 * Designed to optimize memory utilization and prevent memory-related performance issues.
 * 
 * Features:
 * - Application-level LRU caching
 * - Memory usage monitoring and alerts
 * - Garbage collection optimization
 * - Memory leak detection and reporting
 * - Object pool management
 * - Memory-efficient data structures
 * - Automatic memory cleanup
 * - Performance profiling integration
 * 
 * @author Claude Code - Performance Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { EventEmitter } from 'events';

export class MemoryManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // LRU Cache settings
      maxCacheSize: options.maxCacheSize || 10000,
      defaultTTL: options.defaultTTL || 300000, // 5 minutes
      cleanupInterval: options.cleanupInterval || 60000, // 1 minute
      
      // Memory monitoring
      memoryCheckInterval: options.memoryCheckInterval || 30000, // 30 seconds
      memoryWarningThreshold: options.memoryWarningThreshold || 0.8, // 80%
      memoryCriticalThreshold: options.memoryCriticalThreshold || 0.9, // 90%
      
      // GC optimization
      enableGCOptimization: options.enableGCOptimization !== false,
      gcStatsInterval: options.gcStatsInterval || 60000, // 1 minute
      forceGCThreshold: options.forceGCThreshold || 0.85, // 85%
      
      // Leak detection
      enableLeakDetection: options.enableLeakDetection !== false,
      leakDetectionInterval: options.leakDetectionInterval || 300000, // 5 minutes
      objectGrowthThreshold: options.objectGrowthThreshold || 1000,
      
      // Object pooling
      enableObjectPooling: options.enableObjectPooling !== false,
      defaultPoolSize: options.defaultPoolSize || 100,
      
      ...options
    };
    
    // LRU Cache implementation
    this.cache = new Map();
    this.cacheOrder = new Map(); // For LRU tracking
    this.cacheTTL = new Map(); // For TTL tracking
    
    // Memory monitoring
    this.memoryStats = {
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      arrayBuffers: 0,
      rss: 0,
      maxHeapSize: 0
    };
    
    // GC statistics
    this.gcStats = {
      minorGC: 0,
      majorGC: 0,
      incrementalGC: 0,
      totalGCTime: 0,
      avgGCTime: 0,
      lastGCTime: 0
    };
    
    // Leak detection data
    this.objectTracking = new Map();
    this.memorySnapshots = [];
    this.leakWarnings = [];
    
    // Object pools
    this.objectPools = new Map();
    
    // Performance monitoring
    this.performanceEntries = new Map();
    
    this.logger = options.logger || console;
    
    this.startMonitoring();
    this.setupGCTracking();
  }

  /**
   * Start memory monitoring and cleanup
   */
  startMonitoring() {
    // Memory monitoring
    setInterval(() => {
      this.updateMemoryStats();
      this.checkMemoryThresholds();
    }, this.config.memoryCheckInterval);
    
    // Cache cleanup
    setInterval(() => {
      this.cleanupExpiredCache();
    }, this.config.cleanupInterval);
    
    // Leak detection
    if (this.config.enableLeakDetection) {
      setInterval(() => {
        this.detectMemoryLeaks();
      }, this.config.leakDetectionInterval);
    }
    
    // GC statistics
    if (this.config.enableGCOptimization) {
      setInterval(() => {
        this.updateGCStats();
      }, this.config.gcStatsInterval);
    }
  }

  /**
   * LRU Cache Implementation
   */
  
  /**
   * Set cache value with LRU and TTL support
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {Object} options - Caching options
   */
  setCacheValue(key, value, options = {}) {
    const now = Date.now();
    const ttl = options.ttl || this.config.defaultTTL;
    
    // Remove oldest item if cache is full
    if (this.cache.size >= this.config.maxCacheSize && !this.cache.has(key)) {
      this.evictLRU();
    }
    
    // Set value and update tracking
    this.cache.set(key, value);
    this.cacheOrder.set(key, now);
    this.cacheTTL.set(key, now + ttl);
    
    // Track object for leak detection
    if (this.config.enableLeakDetection) {
      this.trackObject(key, value);
    }
    
    this.emit('cache:set', { key, size: this.cache.size });
  }

  /**
   * Get cache value with LRU update
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null
   */
  getCacheValue(key) {
    if (!this.cache.has(key)) {
      return null;
    }
    
    const now = Date.now();
    const expiry = this.cacheTTL.get(key);
    
    // Check if expired
    if (expiry && now > expiry) {
      this.deleteCacheValue(key);
      return null;
    }
    
    // Update LRU order
    this.cacheOrder.set(key, now);
    
    return this.cache.get(key);
  }

  /**
   * Delete cache value
   * @param {string} key - Cache key
   * @returns {boolean} Success status
   */
  deleteCacheValue(key) {
    const deleted = this.cache.delete(key);
    this.cacheOrder.delete(key);
    this.cacheTTL.delete(key);
    
    if (deleted) {
      this.emit('cache:delete', { key, size: this.cache.size });
    }
    
    return deleted;
  }

  /**
   * Evict least recently used item
   */
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, time] of this.cacheOrder) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.deleteCacheValue(oldestKey);
      this.emit('cache:evict', { key: oldestKey, reason: 'LRU' });
    }
  }

  /**
   * Clean up expired cache entries
   */
  cleanupExpiredCache() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, expiry] of this.cacheTTL) {
      if (expiry && now > expiry) {
        expiredKeys.push(key);
      }
    }
    
    for (const key of expiredKeys) {
      this.deleteCacheValue(key);
    }
    
    if (expiredKeys.length > 0) {
      this.emit('cache:cleanup', { expiredKeys: expiredKeys.length });
    }
  }

  /**
   * Memory Monitoring
   */
  
  updateMemoryStats() {
    const memUsage = process.memoryUsage();
    
    this.memoryStats = {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
      rss: memUsage.rss,
      maxHeapSize: Math.max(this.memoryStats.maxHeapSize, memUsage.heapUsed)
    };
    
    // Store snapshot for leak detection
    if (this.memorySnapshots.length >= 20) {
      this.memorySnapshots.shift();
    }
    this.memorySnapshots.push({
      timestamp: Date.now(),
      ...this.memoryStats
    });
    
    this.emit('memory:stats', this.memoryStats);
  }
  
  checkMemoryThresholds() {
    const heapUsagePercent = this.memoryStats.heapUsed / this.memoryStats.heapTotal;
    
    if (heapUsagePercent >= this.config.memoryCriticalThreshold) {
      this.handleCriticalMemory();
    } else if (heapUsagePercent >= this.config.memoryWarningThreshold) {
      this.handleMemoryWarning();
    }
  }
  
  handleMemoryWarning() {
    this.logger.warn('Memory usage warning:', {
      heapUsed: this.formatBytes(this.memoryStats.heapUsed),
      heapTotal: this.formatBytes(this.memoryStats.heapTotal),
      percentage: Math.round((this.memoryStats.heapUsed / this.memoryStats.heapTotal) * 100)
    });
    
    // Cleanup strategies
    this.cleanupExpiredCache();
    this.cleanupObjectPools();
    
    this.emit('memory:warning', this.memoryStats);
  }
  
  handleCriticalMemory() {
    this.logger.error('Critical memory usage detected:', {
      heapUsed: this.formatBytes(this.memoryStats.heapUsed),
      heapTotal: this.formatBytes(this.memoryStats.heapTotal),
      percentage: Math.round((this.memoryStats.heapUsed / this.memoryStats.heapTotal) * 100)
    });
    
    // Aggressive cleanup
    this.cache.clear();
    this.cacheOrder.clear();
    this.cacheTTL.clear();
    this.cleanupObjectPools();
    
    // Force garbage collection if available
    if (global.gc && this.config.enableGCOptimization) {
      global.gc();
    }
    
    this.emit('memory:critical', this.memoryStats);
  }

  /**
   * Garbage Collection Optimization
   */
  
  setupGCTracking() {
    if (!this.config.enableGCOptimization) return;
    
    // Track GC events using performance observer if available
    try {
      const { PerformanceObserver } = require('perf_hooks');
      
      const obs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'gc') {
            this.recordGCEvent(entry);
          }
        }
      });
      
      obs.observe({ entryTypes: ['gc'] });
    } catch (error) {
      this.logger.debug('GC tracking not available:', error.message);
    }
  }
  
  recordGCEvent(gcEntry) {
    const gcType = gcEntry.detail.kind;
    const duration = gcEntry.duration;
    
    switch (gcType) {
      case 1: // Minor GC
        this.gcStats.minorGC++;
        break;
      case 2: // Major GC
        this.gcStats.majorGC++;
        break;
      case 4: // Incremental GC
        this.gcStats.incrementalGC++;
        break;
    }
    
    this.gcStats.totalGCTime += duration;
    this.gcStats.lastGCTime = Date.now();
    
    const totalGCs = this.gcStats.minorGC + this.gcStats.majorGC + this.gcStats.incrementalGC;
    this.gcStats.avgGCTime = totalGCs > 0 ? this.gcStats.totalGCTime / totalGCs : 0;
    
    this.emit('gc:event', {
      type: gcType,
      duration,
      stats: this.gcStats
    });
  }
  
  updateGCStats() {
    // Check if we should force GC
    const heapUsagePercent = this.memoryStats.heapUsed / this.memoryStats.heapTotal;
    
    if (heapUsagePercent >= this.config.forceGCThreshold && global.gc) {
      this.logger.debug('Forcing garbage collection');
      global.gc();
    }
  }

  /**
   * Memory Leak Detection
   */
  
  trackObject(key, obj) {
    if (!this.config.enableLeakDetection) return;
    
    const objType = typeof obj;
    const objSize = this.estimateObjectSize(obj);
    
    if (!this.objectTracking.has(objType)) {
      this.objectTracking.set(objType, {
        count: 0,
        totalSize: 0,
        lastGrowth: Date.now(),
        growthRate: 0
      });
    }
    
    const tracking = this.objectTracking.get(objType);
    tracking.count++;
    tracking.totalSize += objSize;
  }
  
  detectMemoryLeaks() {
    if (!this.config.enableLeakDetection) return;
    
    const now = Date.now();
    const leaks = [];
    
    for (const [objType, tracking] of this.objectTracking) {
      const timeSinceLastCheck = now - tracking.lastGrowth;
      const growthRate = tracking.count / (timeSinceLastCheck / 1000); // objects per second
      
      if (growthRate > this.config.objectGrowthThreshold / 60) { // per minute to per second
        leaks.push({
          type: objType,
          count: tracking.count,
          totalSize: tracking.totalSize,
          growthRate: growthRate * 60, // convert back to per minute
          severity: this.calculateLeakSeverity(tracking)
        });
      }
    }
    
    if (leaks.length > 0) {
      this.reportMemoryLeaks(leaks);
    }
    
    // Reset tracking for next interval
    this.objectTracking.clear();
  }
  
  calculateLeakSeverity(tracking) {
    const sizeInMB = tracking.totalSize / (1024 * 1024);
    
    if (sizeInMB > 100) return 'critical';
    if (sizeInMB > 50) return 'high';
    if (sizeInMB > 10) return 'medium';
    return 'low';
  }
  
  reportMemoryLeaks(leaks) {
    this.leakWarnings.push({
      timestamp: Date.now(),
      leaks,
      memoryStats: { ...this.memoryStats }
    });
    
    // Keep only last 10 leak reports
    if (this.leakWarnings.length > 10) {
      this.leakWarnings.shift();
    }
    
    this.logger.warn('Potential memory leaks detected:', leaks);
    this.emit('memory:leak', { leaks, memoryStats: this.memoryStats });
  }
  
  estimateObjectSize(obj) {
    if (obj === null || obj === undefined) return 0;
    
    switch (typeof obj) {
      case 'boolean':
        return 4;
      case 'number':
        return 8;
      case 'string':
        return obj.length * 2;
      case 'object':
        if (Array.isArray(obj)) {
          return obj.reduce((size, item) => size + this.estimateObjectSize(item), 0);
        }
        return Object.keys(obj).reduce((size, key) => {
          return size + key.length * 2 + this.estimateObjectSize(obj[key]);
        }, 0);
      default:
        return 8; // Default estimate
    }
  }

  /**
   * Object Pooling
   */
  
  createObjectPool(name, factory, resetFn = null, initialSize = null) {
    if (!this.config.enableObjectPooling) return null;
    
    const poolSize = initialSize || this.config.defaultPoolSize;
    const pool = {
      factory,
      resetFn,
      available: [],
      inUse: new Set(),
      created: 0,
      reused: 0
    };
    
    // Pre-populate pool
    for (let i = 0; i < poolSize; i++) {
      pool.available.push(factory());
      pool.created++;
    }
    
    this.objectPools.set(name, pool);
    return pool;
  }
  
  getFromPool(poolName) {
    const pool = this.objectPools.get(poolName);
    if (!pool) return null;
    
    let obj;
    if (pool.available.length > 0) {
      obj = pool.available.pop();
      pool.reused++;
    } else {
      obj = pool.factory();
      pool.created++;
    }
    
    pool.inUse.add(obj);
    return obj;
  }
  
  returnToPool(poolName, obj) {
    const pool = this.objectPools.get(poolName);
    if (!pool || !pool.inUse.has(obj)) return false;
    
    pool.inUse.delete(obj);
    
    // Reset object if reset function provided
    if (pool.resetFn) {
      pool.resetFn(obj);
    }
    
    pool.available.push(obj);
    return true;
  }
  
  cleanupObjectPools() {
    for (const [name, pool] of this.objectPools) {
      // Keep only half the objects in available pool during cleanup
      const keepCount = Math.floor(pool.available.length / 2);
      pool.available = pool.available.slice(0, keepCount);
    }
  }

  /**
   * Performance Profiling
   */
  
  startProfile(name) {
    if (typeof performance !== 'undefined') {
      this.performanceEntries.set(name, performance.now());
    }
  }
  
  endProfile(name) {
    if (typeof performance !== 'undefined' && this.performanceEntries.has(name)) {
      const startTime = this.performanceEntries.get(name);
      const duration = performance.now() - startTime;
      this.performanceEntries.delete(name);
      
      this.emit('profile:end', { name, duration });
      return duration;
    }
    return 0;
  }

  /**
   * Utility methods
   */
  
  formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
  
  /**
   * Get memory statistics and health information
   */
  getMemoryHealth() {
    const heapUsagePercent = this.memoryStats.heapTotal > 0 ? 
      (this.memoryStats.heapUsed / this.memoryStats.heapTotal) * 100 : 0;
    
    const cacheEfficiency = this.cache.size > 0 ? 
      ((this.cache.size / this.config.maxCacheSize) * 100) : 0;
    
    return {
      status: heapUsagePercent > this.config.memoryCriticalThreshold * 100 ? 'critical' :
              heapUsagePercent > this.config.memoryWarningThreshold * 100 ? 'warning' : 'healthy',
      memory: {
        heapUsed: this.formatBytes(this.memoryStats.heapUsed),
        heapTotal: this.formatBytes(this.memoryStats.heapTotal),
        heapUsagePercent: Math.round(heapUsagePercent),
        rss: this.formatBytes(this.memoryStats.rss),
        external: this.formatBytes(this.memoryStats.external)
      },
      cache: {
        size: this.cache.size,
        maxSize: this.config.maxCacheSize,
        efficiency: Math.round(cacheEfficiency)
      },
      gc: this.gcStats,
      pools: this.getObjectPoolStats(),
      recentLeaks: this.leakWarnings.slice(-3),
      recommendations: this.generateMemoryRecommendations()
    };
  }
  
  getObjectPoolStats() {
    const poolStats = {};
    
    for (const [name, pool] of this.objectPools) {
      poolStats[name] = {
        available: pool.available.length,
        inUse: pool.inUse.size,
        created: pool.created,
        reused: pool.reused,
        reuseRate: pool.created > 0 ? Math.round((pool.reused / pool.created) * 100) : 0
      };
    }
    
    return poolStats;
  }
  
  generateMemoryRecommendations() {
    const recommendations = [];
    const heapUsagePercent = (this.memoryStats.heapUsed / this.memoryStats.heapTotal) * 100;
    
    if (heapUsagePercent > 70) {
      recommendations.push('Consider increasing cache cleanup frequency');
      recommendations.push('Review object lifecycle management');
    }
    
    if (this.cache.size > this.config.maxCacheSize * 0.8) {
      recommendations.push('Cache is near capacity - consider increasing max size or reducing TTL');
    }
    
    if (this.gcStats.majorGC > this.gcStats.minorGC * 0.1) {
      recommendations.push('High major GC frequency - review large object allocations');
    }
    
    if (this.leakWarnings.length > 0) {
      recommendations.push('Memory leaks detected - investigate object retention');
    }
    
    return recommendations;
  }
  
  /**
   * Reset statistics
   */
  resetStats() {
    this.gcStats = {
      minorGC: 0,
      majorGC: 0,
      incrementalGC: 0,
      totalGCTime: 0,
      avgGCTime: 0,
      lastGCTime: 0
    };
    
    this.memorySnapshots = [];
    this.leakWarnings = [];
    this.objectTracking.clear();
  }
  
  /**
   * Cleanup and shutdown
   */
  cleanup() {
    this.cache.clear();
    this.cacheOrder.clear();
    this.cacheTTL.clear();
    this.cleanupObjectPools();
    this.objectTracking.clear();
    this.performanceEntries.clear();
    
    this.emit('cleanup:complete');
  }
}

// Create singleton instance for global use
let globalMemoryManager = null;

export function createMemoryManager(options = {}) {
  return new MemoryManager(options);
}

export function getMemoryManager(options = {}) {
  if (!globalMemoryManager) {
    globalMemoryManager = new MemoryManager(options);
  }
  return globalMemoryManager;
}

export default MemoryManager;