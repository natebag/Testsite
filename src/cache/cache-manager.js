/**
 * Cache Manager for MLG.clan Platform
 * 
 * Generic cache interface with TTL management, key generation, namespacing,
 * and intelligent cache invalidation strategies. Provides a high-level abstraction
 * over Redis operations with built-in performance monitoring and analytics.
 * 
 * Features:
 * - Generic cache interface with TTL management
 * - Intelligent key generation and namespacing
 * - Cache invalidation strategies (TTL, LRU, pattern-based)
 * - Performance monitoring and statistics
 * - Multi-tier caching (memory + Redis)
 * - Compression for large objects
 * - Cache warming strategies
 * - Event-driven cache updates
 * 
 * @author Claude Code - Performance Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { EventEmitter } from 'events';
import { getRedisClient } from './redis-client.js';
import crypto from 'crypto';
import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

export class CacheManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Redis configuration
      redis: options.redis || {},
      
      // Default TTL settings (in seconds)
      defaultTTL: options.defaultTTL || 3600, // 1 hour
      shortTTL: options.shortTTL || 300,     // 5 minutes  
      longTTL: options.longTTL || 86400,     // 24 hours
      
      // Key configuration
      keyPrefix: options.keyPrefix || 'mlg:',
      keySeparator: options.keySeparator || ':',
      
      // Compression settings
      compressionThreshold: options.compressionThreshold || 1024, // 1KB
      enableCompression: options.enableCompression !== false,
      
      // Memory cache settings
      enableMemoryCache: options.enableMemoryCache !== false,
      memoryCacheSize: options.memoryCacheSize || 1000,
      memoryCacheTTL: options.memoryCacheTTL || 60, // 1 minute
      
      // Performance settings
      batchSize: options.batchSize || 100,
      enableAnalytics: options.enableAnalytics !== false,
      
      // Warming settings
      enableWarming: options.enableWarming !== false,
      warmingConcurrency: options.warmingConcurrency || 5,
      
      ...options
    };
    
    // Initialize Redis client
    this.redis = getRedisClient(this.config.redis);
    
    // Memory cache (LRU implementation)
    this.memoryCache = new Map();
    this.memoryCacheOrder = new Map(); // For LRU tracking
    
    // Performance metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      totalResponseTime: 0,
      avgResponseTime: 0,
      memoryHits: 0,
      redisHits: 0,
      compressionSaves: 0,
      warmingRequests: 0,
      invalidations: 0
    };
    
    // Invalidation patterns
    this.invalidationPatterns = new Map();
    
    // Warming queue
    this.warmingQueue = [];
    this.isWarming = false;
    
    this.logger = options.logger || console;
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.redis.on('error', (error) => {
      this.metrics.errors++;
      this.logger.error('Redis cache error:', error);
    });
    
    // Clean up memory cache periodically
    setInterval(() => {
      this.cleanMemoryCache();
    }, this.config.memoryCacheTTL * 1000);
  }

  /**
   * Generate cache key with namespace and hashing
   * @param {string} namespace - Cache namespace
   * @param {string|Object} key - Cache key or key object
   * @param {Object} options - Key generation options
   * @returns {string} Generated cache key
   */
  generateKey(namespace, key, options = {}) {
    const keyParts = [this.config.keyPrefix, namespace];
    
    // Handle different key types
    if (typeof key === 'object') {
      // Sort object keys for consistent hashing
      const sortedKey = Object.keys(key)
        .sort()
        .reduce((result, k) => {
          result[k] = key[k];
          return result;
        }, {});
      
      const keyString = JSON.stringify(sortedKey);
      
      // Hash complex keys to avoid key length issues
      if (keyString.length > 100) {
        const hash = crypto.createHash('sha256').update(keyString).digest('hex').substring(0, 16);
        keyParts.push(hash);
      } else {
        keyParts.push(keyString.replace(/[{}",]/g, ''));
      }
    } else {
      keyParts.push(String(key));
    }
    
    // Add version if specified
    if (options.version) {
      keyParts.push(`v${options.version}`);
    }
    
    // Add environment prefix in development
    if (process.env.NODE_ENV !== 'production') {
      keyParts.unshift(process.env.NODE_ENV);
    }
    
    return keyParts.join(this.config.keySeparator);
  }

  /**
   * Set cache value with intelligent compression and TTL
   * @param {string} namespace - Cache namespace
   * @param {string|Object} key - Cache key
   * @param {any} value - Value to cache
   * @param {Object} options - Cache options
   * @returns {Promise<boolean>} Success status
   */
  async set(namespace, key, value, options = {}) {
    const startTime = Date.now();
    const cacheKey = this.generateKey(namespace, key, options);
    
    try {
      // Serialize value
      let serializedValue = JSON.stringify(value);
      let compressed = false;
      
      // Apply compression if value is large enough
      if (this.config.enableCompression && 
          serializedValue.length > this.config.compressionThreshold) {
        const compressedBuffer = await gzip(serializedValue);
        if (compressedBuffer.length < serializedValue.length) {
          serializedValue = compressedBuffer.toString('base64');
          compressed = true;
          this.metrics.compressionSaves++;
        }
      }
      
      // Determine TTL
      const ttl = options.ttl || this.getTTLForNamespace(namespace);
      
      // Store metadata alongside value
      const cacheData = {
        value: serializedValue,
        compressed,
        timestamp: Date.now(),
        namespace,
        originalKey: key
      };
      
      // Set in Redis with TTL
      await this.redis.set(cacheKey, JSON.stringify(cacheData), { ttl });
      
      // Also set in memory cache if enabled
      if (this.config.enableMemoryCache && !compressed) {
        this.setMemoryCache(cacheKey, cacheData, ttl);
      }
      
      this.metrics.sets++;
      this.updateResponseTime(startTime);
      
      // Emit cache set event
      this.emit('cache:set', {
        namespace,
        key: cacheKey,
        compressed,
        ttl,
        size: serializedValue.length
      });
      
      return true;
      
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Cache set error for key ${cacheKey}:`, error);
      return false;
    }
  }

  /**
   * Get cache value with multi-tier lookup
   * @param {string} namespace - Cache namespace
   * @param {string|Object} key - Cache key
   * @param {Object} options - Cache options
   * @returns {Promise<any|null>} Cached value or null
   */
  async get(namespace, key, options = {}) {
    const startTime = Date.now();
    const cacheKey = this.generateKey(namespace, key, options);
    
    try {
      let cacheData = null;
      let source = 'miss';
      
      // Try memory cache first
      if (this.config.enableMemoryCache) {
        cacheData = this.getMemoryCache(cacheKey);
        if (cacheData) {
          source = 'memory';
          this.metrics.memoryHits++;
        }
      }
      
      // Try Redis if not in memory cache
      if (!cacheData) {
        const redisValue = await this.redis.get(cacheKey);
        if (redisValue) {
          cacheData = JSON.parse(redisValue);
          source = 'redis';
          this.metrics.redisHits++;
          
          // Update memory cache
          if (this.config.enableMemoryCache && !cacheData.compressed) {
            this.setMemoryCache(cacheKey, cacheData, this.config.memoryCacheTTL);
          }
        }
      }
      
      if (!cacheData) {
        this.metrics.misses++;
        this.updateResponseTime(startTime);
        
        this.emit('cache:miss', { namespace, key: cacheKey });
        return null;
      }
      
      // Deserialize value
      let value = cacheData.value;
      
      // Decompress if needed
      if (cacheData.compressed) {
        const compressedBuffer = Buffer.from(value, 'base64');
        const decompressed = await gunzip(compressedBuffer);
        value = decompressed.toString();
      }
      
      const deserializedValue = JSON.parse(value);
      
      this.metrics.hits++;
      this.updateResponseTime(startTime);
      
      this.emit('cache:hit', {
        namespace,
        key: cacheKey,
        source,
        compressed: cacheData.compressed,
        age: Date.now() - cacheData.timestamp
      });
      
      return deserializedValue;
      
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Cache get error for key ${cacheKey}:`, error);
      return null;
    }
  }

  /**
   * Get multiple cache values efficiently
   * @param {string} namespace - Cache namespace
   * @param {Array} keys - Array of cache keys
   * @param {Object} options - Cache options
   * @returns {Promise<Object>} Object with keys and their values
   */
  async getMultiple(namespace, keys, options = {}) {
    const startTime = Date.now();
    const results = {};
    
    try {
      // Generate cache keys
      const cacheKeys = keys.map(key => ({
        original: key,
        cache: this.generateKey(namespace, key, options)
      }));
      
      // Try memory cache first
      const memoryHits = new Map();
      const remainingKeys = [];
      
      if (this.config.enableMemoryCache) {
        for (const keyPair of cacheKeys) {
          const cached = this.getMemoryCache(keyPair.cache);
          if (cached && !cached.compressed) {
            memoryHits.set(keyPair.original, cached);
          } else {
            remainingKeys.push(keyPair);
          }
        }
      } else {
        remainingKeys.push(...cacheKeys);
      }
      
      // Get remaining from Redis
      if (remainingKeys.length > 0) {
        const redisKeys = remainingKeys.map(kp => kp.cache);
        const redisValues = await this.redis.mget(...redisKeys);
        
        for (let i = 0; i < remainingKeys.length; i++) {
          const keyPair = remainingKeys[i];
          const redisValue = redisValues[i];
          
          if (redisValue) {
            try {
              const cacheData = JSON.parse(redisValue);
              
              // Decompress if needed
              let value = cacheData.value;
              if (cacheData.compressed) {
                const compressedBuffer = Buffer.from(value, 'base64');
                const decompressed = await gunzip(compressedBuffer);
                value = decompressed.toString();
              }
              
              results[keyPair.original] = JSON.parse(value);
              
              // Update memory cache
              if (this.config.enableMemoryCache && !cacheData.compressed) {
                this.setMemoryCache(keyPair.cache, cacheData, this.config.memoryCacheTTL);
              }
              
            } catch (error) {
              this.logger.warn(`Error deserializing cache value for key ${keyPair.cache}:`, error);
            }
          }
        }
      }
      
      // Add memory hits to results
      for (const [key, cacheData] of memoryHits) {
        try {
          results[key] = JSON.parse(cacheData.value);
        } catch (error) {
          this.logger.warn(`Error deserializing memory cache value for key ${key}:`, error);
        }
      }
      
      this.updateResponseTime(startTime);
      
      return results;
      
    } catch (error) {
      this.metrics.errors++;
      this.logger.error('Cache getMultiple error:', error);
      return results;
    }
  }

  /**
   * Delete cache value(s)
   * @param {string} namespace - Cache namespace
   * @param {string|Array} key - Cache key or array of keys
   * @param {Object} options - Cache options
   * @returns {Promise<number>} Number of deleted keys
   */
  async delete(namespace, key, options = {}) {
    const startTime = Date.now();
    
    try {
      const keys = Array.isArray(key) ? key : [key];
      const cacheKeys = keys.map(k => this.generateKey(namespace, k, options));
      
      // Delete from Redis
      const deletedCount = await this.redis.del(...cacheKeys);
      
      // Delete from memory cache
      if (this.config.enableMemoryCache) {
        for (const cacheKey of cacheKeys) {
          this.deleteMemoryCache(cacheKey);
        }
      }
      
      this.metrics.deletes += deletedCount;
      this.updateResponseTime(startTime);
      
      this.emit('cache:delete', {
        namespace,
        keys: cacheKeys,
        deletedCount
      });
      
      return deletedCount;
      
    } catch (error) {
      this.metrics.errors++;
      this.logger.error('Cache delete error:', error);
      return 0;
    }
  }

  /**
   * Invalidate cache by pattern
   * @param {string} namespace - Cache namespace
   * @param {string} pattern - Pattern to match keys
   * @returns {Promise<number>} Number of invalidated keys
   */
  async invalidatePattern(namespace, pattern) {
    const startTime = Date.now();
    
    try {
      const searchPattern = this.generateKey(namespace, pattern, {}).replace('*', '*');
      
      // Use SCAN to find matching keys (more efficient than KEYS)
      const matchingKeys = [];
      let cursor = '0';
      
      do {
        const result = await this.redis.executeCommand('scan', cursor, 'MATCH', searchPattern, 'COUNT', 100);
        cursor = result[0];
        matchingKeys.push(...result[1]);
      } while (cursor !== '0');
      
      if (matchingKeys.length === 0) {
        return 0;
      }
      
      // Delete in batches
      let totalDeleted = 0;
      for (let i = 0; i < matchingKeys.length; i += this.config.batchSize) {
        const batch = matchingKeys.slice(i, i + this.config.batchSize);
        const deleted = await this.redis.del(...batch);
        totalDeleted += deleted;
        
        // Also clean memory cache
        if (this.config.enableMemoryCache) {
          for (const key of batch) {
            this.deleteMemoryCache(key);
          }
        }
      }
      
      this.metrics.invalidations++;
      this.updateResponseTime(startTime);
      
      this.emit('cache:invalidate', {
        namespace,
        pattern: searchPattern,
        deletedCount: totalDeleted
      });
      
      return totalDeleted;
      
    } catch (error) {
      this.metrics.errors++;
      this.logger.error('Cache pattern invalidation error:', error);
      return 0;
    }
  }

  /**
   * Register invalidation pattern for automatic cache clearing
   * @param {string} triggerNamespace - Namespace that triggers invalidation
   * @param {string} targetPattern - Pattern to invalidate
   * @param {Function} conditionFn - Optional condition function
   */
  registerInvalidationPattern(triggerNamespace, targetPattern, conditionFn = null) {
    if (!this.invalidationPatterns.has(triggerNamespace)) {
      this.invalidationPatterns.set(triggerNamespace, []);
    }
    
    this.invalidationPatterns.get(triggerNamespace).push({
      pattern: targetPattern,
      condition: conditionFn
    });
  }

  /**
   * Trigger invalidation based on registered patterns
   * @param {string} namespace - Namespace that changed
   * @param {any} data - Data context for conditions
   */
  async triggerInvalidation(namespace, data = {}) {
    const patterns = this.invalidationPatterns.get(namespace);
    if (!patterns) return;
    
    for (const { pattern, condition } of patterns) {
      try {
        // Check condition if specified
        if (condition && !condition(data)) {
          continue;
        }
        
        await this.invalidatePattern(namespace, pattern);
        
      } catch (error) {
        this.logger.error(`Error triggering invalidation for pattern ${pattern}:`, error);
      }
    }
  }

  /**
   * Warm cache with predefined data
   * @param {string} namespace - Cache namespace
   * @param {Array} warmingData - Array of {key, value, ttl} objects
   * @returns {Promise<number>} Number of warmed entries
   */
  async warmCache(namespace, warmingData) {
    if (!this.config.enableWarming) {
      return 0;
    }
    
    this.warmingQueue.push(...warmingData.map(data => ({ namespace, ...data })));
    
    if (!this.isWarming) {
      this.processWarmingQueue();
    }
    
    return warmingData.length;
  }

  /**
   * Process warming queue with concurrency control
   */
  async processWarmingQueue() {
    if (this.isWarming || this.warmingQueue.length === 0) {
      return;
    }
    
    this.isWarming = true;
    const concurrency = this.config.warmingConcurrency;
    
    try {
      while (this.warmingQueue.length > 0) {
        const batch = this.warmingQueue.splice(0, concurrency);
        
        await Promise.all(batch.map(async (item) => {
          try {
            await this.set(item.namespace, item.key, item.value, { ttl: item.ttl });
            this.metrics.warmingRequests++;
          } catch (error) {
            this.logger.warn('Cache warming error:', error);
          }
        }));
      }
    } finally {
      this.isWarming = false;
    }
  }

  /**
   * Get TTL for namespace
   * @param {string} namespace - Cache namespace
   * @returns {number} TTL in seconds
   */
  getTTLForNamespace(namespace) {
    const ttlMap = {
      'user:profile': this.config.longTTL,
      'user:stats': this.config.defaultTTL,
      'clan:leaderboard': this.config.shortTTL,
      'content:trending': this.config.shortTTL,
      'voting:results': this.config.longTTL,
      'session': this.config.shortTTL
    };
    
    return ttlMap[namespace] || this.config.defaultTTL;
  }

  /**
   * Memory cache operations
   */
  setMemoryCache(key, value, ttl) {
    if (this.memoryCache.size >= this.config.memoryCacheSize) {
      this.evictLRU();
    }
    
    this.memoryCache.set(key, {
      ...value,
      memoryExpiry: Date.now() + (ttl * 1000)
    });
    this.memoryCacheOrder.set(key, Date.now());
  }

  getMemoryCache(key) {
    const cached = this.memoryCache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.memoryExpiry) {
      this.deleteMemoryCache(key);
      return null;
    }
    
    // Update LRU order
    this.memoryCacheOrder.set(key, Date.now());
    return cached;
  }

  deleteMemoryCache(key) {
    this.memoryCache.delete(key);
    this.memoryCacheOrder.delete(key);
  }

  evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, time] of this.memoryCacheOrder) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.deleteMemoryCache(oldestKey);
    }
  }

  cleanMemoryCache() {
    const now = Date.now();
    const expired = [];
    
    for (const [key, cached] of this.memoryCache) {
      if (now > cached.memoryExpiry) {
        expired.push(key);
      }
    }
    
    for (const key of expired) {
      this.deleteMemoryCache(key);
    }
  }

  /**
   * Update response time metrics
   */
  updateResponseTime(startTime) {
    const responseTime = Date.now() - startTime;
    this.metrics.totalResponseTime += responseTime;
    const totalOps = this.metrics.hits + this.metrics.misses + this.metrics.sets + this.metrics.deletes;
    this.metrics.avgResponseTime = totalOps > 0 ? Math.round(this.metrics.totalResponseTime / totalOps) : 0;
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache performance metrics
   */
  getStats() {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    const hitRate = totalRequests > 0 ? (this.metrics.hits / totalRequests) * 100 : 0;
    const memoryHitRate = this.metrics.redisHits > 0 ? (this.metrics.memoryHits / (this.metrics.memoryHits + this.metrics.redisHits)) * 100 : 0;
    
    return {
      ...this.metrics,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryHitRate: Math.round(memoryHitRate * 100) / 100,
      memoryCacheSize: this.memoryCache.size,
      warmingQueueSize: this.warmingQueue.length,
      isWarming: this.isWarming,
      totalRequests
    };
  }

  /**
   * Reset cache statistics
   */
  resetStats() {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      totalResponseTime: 0,
      avgResponseTime: 0,
      memoryHits: 0,
      redisHits: 0,
      compressionSaves: 0,
      warmingRequests: 0,
      invalidations: 0
    };
  }

  /**
   * Get cache health status
   * @returns {Object} Health status information
   */
  async getHealthStatus() {
    try {
      const redisInfo = await this.redis.info('memory');
      const redisStats = this.redis.getStats();
      const cacheStats = this.getStats();
      
      return {
        status: 'healthy',
        redis: {
          connected: redisStats.isConnected,
          uptime: redisStats.uptime,
          avgResponseTime: redisStats.avgResponseTime,
          errorRate: redisStats.errorRate
        },
        cache: {
          hitRate: cacheStats.hitRate,
          avgResponseTime: cacheStats.avgResponseTime,
          memoryCacheSize: cacheStats.memoryCacheSize,
          totalRequests: cacheStats.totalRequests
        },
        memory: {
          redis: redisInfo,
          memoryCache: `${this.memoryCache.size}/${this.config.memoryCacheSize}`
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

// Create singleton instance for global use
let globalCacheManager = null;

export function createCacheManager(options = {}) {
  return new CacheManager(options);
}

export function getCacheManager(options = {}) {
  if (!globalCacheManager) {
    globalCacheManager = new CacheManager(options);
  }
  return globalCacheManager;
}

export default CacheManager;