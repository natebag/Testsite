/**
 * Advanced API Response Caching Middleware for MLG.clan Platform
 * 
 * High-performance API response caching with intelligent invalidation,
 * conditional caching, and gaming-specific optimization strategies.
 * 
 * Features:
 * - Multi-tier response caching (Memory + Redis)
 * - Intelligent cache invalidation based on data relationships
 * - Gaming-specific cache strategies (leaderboards, voting, tournaments)
 * - Conditional caching with ETags and Last-Modified headers
 * - Cache warming for high-traffic endpoints
 * - Real-time cache invalidation via WebSocket events
 * - Performance monitoring and analytics
 * - Bandwidth optimization with response compression
 * 
 * @author Claude Code - API Performance Architect
 * @version 1.0.0
 * @created 2025-08-12
 */

import { EventEmitter } from 'events';
import { getCacheManager } from '../../cache/cache-manager.js';
import crypto from 'crypto';
import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

export class APIResponseCache extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Cache configuration
      defaultTTL: options.defaultTTL || 300, // 5 minutes
      shortTTL: options.shortTTL || 60,     // 1 minute
      longTTL: options.longTTL || 3600,     // 1 hour
      
      // Response size limits
      maxResponseSize: options.maxResponseSize || 1024 * 1024, // 1MB
      compressionThreshold: options.compressionThreshold || 1024, // 1KB
      
      // Gaming-specific settings
      leaderboardTTL: options.leaderboardTTL || 30,      // 30 seconds
      votingResultsTTL: options.votingResultsTTL || 5,    // 5 seconds  
      userProfileTTL: options.userProfileTTL || 300,     // 5 minutes
      clanStatsTTL: options.clanStatsTTL || 120,         // 2 minutes
      
      // Performance settings
      enableConditionalCaching: options.enableConditionalCaching !== false,
      enableResponseCompression: options.enableResponseCompression !== false,
      enableCacheWarming: options.enableCacheWarming !== false,
      
      // Invalidation settings
      enableSmartInvalidation: options.enableSmartInvalidation !== false,
      invalidationBatchSize: options.invalidationBatchSize || 50,
      
      ...options
    };
    
    this.cache = getCacheManager();
    
    // Performance metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0,
      totalResponseTime: 0,
      avgResponseTime: 0,
      compressionSavings: 0,
      invalidations: 0,
      warmingRequests: 0
    };
    
    // Cache invalidation mappings
    this.invalidationMappings = new Map();
    
    // Warming queue
    this.warmingQueue = [];
    this.isWarming = false;
    
    this.logger = options.logger || console;
    
    this.setupInvalidationMappings();
  }

  /**
   * Setup cache invalidation relationships for gaming data
   */
  setupInvalidationMappings() {
    // User-related invalidations
    this.invalidationMappings.set('user:update', [
      'user:profile:*',
      'clan:members:*',
      'leaderboard:users:*',
      'user:stats:*'
    ]);
    
    // Voting-related invalidations
    this.invalidationMappings.set('vote:cast', [
      'voting:results:*',
      'content:stats:*', 
      'leaderboard:*',
      'user:stats:*',
      'clan:stats:*'
    ]);
    
    // Clan-related invalidations
    this.invalidationMappings.set('clan:update', [
      'clan:profile:*',
      'clan:members:*',
      'clan:stats:*',
      'leaderboard:clans:*',
      'user:profile:*' // Members' profiles show clan info
    ]);
    
    // Content-related invalidations
    this.invalidationMappings.set('content:update', [
      'content:trending:*',
      'content:category:*',
      'user:content:*',
      'search:content:*'
    ]);
    
    // Tournament-related invalidations
    this.invalidationMappings.set('tournament:update', [
      'tournament:brackets:*',
      'tournament:leaderboard:*',
      'user:tournaments:*',
      'clan:tournaments:*'
    ]);
  }

  /**
   * Generate cache key for API response
   */
  generateCacheKey(req, additionalKeys = []) {
    const keyParts = [
      req.method,
      req.route?.path || req.path,
      req.user?.id || 'anonymous'
    ];
    
    // Add query parameters (sorted for consistency)
    if (Object.keys(req.query).length > 0) {
      const sortedQuery = Object.keys(req.query)
        .sort()
        .map(key => `${key}=${req.query[key]}`)
        .join('&');
      keyParts.push(sortedQuery);
    }
    
    // Add additional keys
    keyParts.push(...additionalKeys);
    
    // Add user tier for different cache versions
    if (req.user?.tier) {
      keyParts.push(`tier:${req.user.tier}`);
    }
    
    return keyParts.join(':');
  }

  /**
   * Generate ETag for response
   */
  generateETag(content) {
    return `"${crypto.createHash('md5').update(content).digest('hex')}"`;
  }

  /**
   * Get cache TTL based on endpoint type
   */
  getTTLForEndpoint(req) {
    const path = req.route?.path || req.path;
    
    // Gaming-specific TTL strategies
    if (path.includes('leaderboard')) {
      return this.config.leaderboardTTL;
    }
    
    if (path.includes('voting') && path.includes('results')) {
      return this.config.votingResultsTTL;
    }
    
    if (path.includes('user') && (path.includes('profile') || path.includes('stats'))) {
      return this.config.userProfileTTL;
    }
    
    if (path.includes('clan') && path.includes('stats')) {
      return this.config.clanStatsTTL;
    }
    
    // Static content - long cache
    if (path.includes('static') || path.includes('assets')) {
      return this.config.longTTL;
    }
    
    // Real-time data - short cache
    if (path.includes('live') || path.includes('realtime')) {
      return this.config.shortTTL;
    }
    
    return this.config.defaultTTL;
  }

  /**
   * Check if endpoint should be cached
   */
  shouldCacheResponse(req, res) {
    // Only cache successful GET requests
    if (req.method !== 'GET' || res.statusCode !== 200) {
      return false;
    }
    
    // Don't cache if explicitly disabled
    if (req.headers['cache-control'] === 'no-cache' || 
        req.query.nocache === 'true') {
      return false;
    }
    
    // Don't cache error responses
    if (res.statusCode >= 400) {
      return false;
    }
    
    // Don't cache user-specific sensitive data
    const path = req.route?.path || req.path;
    if (path.includes('admin') || 
        path.includes('private') || 
        path.includes('auth/me')) {
      return false;
    }
    
    return true;
  }

  /**
   * Main caching middleware
   */
  middleware() {
    return async (req, res, next) => {
      const startTime = Date.now();
      this.metrics.totalRequests++;
      
      try {
        // Skip if caching not appropriate
        if (!this.shouldCacheResponse(req, res)) {
          return next();
        }
        
        const cacheKey = this.generateCacheKey(req);
        const namespace = this.getNamespaceFromPath(req.route?.path || req.path);
        
        // Try to get cached response
        const cachedResponse = await this.getCachedResponse(namespace, cacheKey, req);
        
        if (cachedResponse) {
          // Handle conditional requests
          if (this.handleConditionalRequest(req, res, cachedResponse)) {
            this.metrics.hits++;
            this.updateMetrics(startTime);
            return; // 304 Not Modified sent
          }
          
          // Serve cached response
          this.serveCachedResponse(res, cachedResponse);
          this.metrics.hits++;
          this.updateMetrics(startTime);
          
          this.emit('cache:hit', {
            namespace,
            key: cacheKey,
            path: req.path,
            user: req.user?.id
          });
          
          return;
        }
        
        // Cache miss - proceed with request processing
        this.metrics.misses++;
        
        // Intercept response to cache it
        this.interceptResponse(req, res, namespace, cacheKey, startTime);
        
        this.emit('cache:miss', {
          namespace,
          key: cacheKey,
          path: req.path,
          user: req.user?.id
        });
        
        next();
        
      } catch (error) {
        this.logger.error('Response cache middleware error:', error);
        next();
      }
    };
  }

  /**
   * Get cached response
   */
  async getCachedResponse(namespace, key, req) {
    try {
      const cached = await this.cache.get(namespace, key);
      
      if (!cached) {
        return null;
      }
      
      // Check if cached response is still valid
      if (cached.expiresAt && Date.now() > cached.expiresAt) {
        await this.cache.delete(namespace, key);
        return null;
      }
      
      return cached;
      
    } catch (error) {
      this.logger.error('Error getting cached response:', error);
      return null;
    }
  }

  /**
   * Handle conditional requests (ETags, Last-Modified)
   */
  handleConditionalRequest(req, res, cachedResponse) {
    if (!this.config.enableConditionalCaching || !cachedResponse.etag) {
      return false;
    }
    
    const clientETag = req.headers['if-none-match'];
    const clientLastModified = req.headers['if-modified-since'];
    
    // Check ETag
    if (clientETag && clientETag === cachedResponse.etag) {
      res.status(304).end();
      return true;
    }
    
    // Check Last-Modified
    if (clientLastModified && cachedResponse.lastModified) {
      const clientDate = new Date(clientLastModified);
      const cachedDate = new Date(cachedResponse.lastModified);
      
      if (clientDate >= cachedDate) {
        res.status(304).end();
        return true;
      }
    }
    
    return false;
  }

  /**
   * Serve cached response
   */
  serveCachedResponse(res, cachedResponse) {
    // Set cache headers
    if (cachedResponse.etag) {
      res.set('ETag', cachedResponse.etag);
    }
    
    if (cachedResponse.lastModified) {
      res.set('Last-Modified', cachedResponse.lastModified);
    }
    
    res.set({
      'X-Cache': 'HIT',
      'X-Cache-TTL': cachedResponse.ttl,
      'Content-Type': cachedResponse.contentType || 'application/json'
    });
    
    // Handle compressed responses
    if (cachedResponse.compressed && this.config.enableResponseCompression) {
      res.set('Content-Encoding', 'gzip');
    }
    
    res.send(cachedResponse.body);
  }

  /**
   * Intercept response to cache it
   */
  interceptResponse(req, res, namespace, cacheKey, startTime) {
    const originalSend = res.send;
    const originalJson = res.json;
    
    res.send = async (body) => {
      await this.cacheResponse(req, res, namespace, cacheKey, body);
      this.updateMetrics(startTime);
      return originalSend.call(res, body);
    };
    
    res.json = async (obj) => {
      const body = JSON.stringify(obj);
      await this.cacheResponse(req, res, namespace, cacheKey, body);
      this.updateMetrics(startTime);
      return originalJson.call(res, obj);
    };
  }

  /**
   * Cache response
   */
  async cacheResponse(req, res, namespace, cacheKey, body) {
    try {
      // Don't cache if response is too large
      if (body.length > this.config.maxResponseSize) {
        return;
      }
      
      // Don't cache error responses
      if (res.statusCode >= 400) {
        return;
      }
      
      const ttl = this.getTTLForEndpoint(req);
      let processedBody = body;
      let compressed = false;
      
      // Apply compression if beneficial
      if (this.config.enableResponseCompression && 
          body.length > this.config.compressionThreshold) {
        try {
          const compressedBuffer = await gzip(body);
          if (compressedBuffer.length < body.length) {
            processedBody = compressedBuffer;
            compressed = true;
            this.metrics.compressionSavings += body.length - compressedBuffer.length;
          }
        } catch (error) {
          this.logger.warn('Response compression failed:', error);
        }
      }
      
      const cacheData = {
        body: processedBody,
        compressed,
        statusCode: res.statusCode,
        contentType: res.getHeader('content-type') || 'application/json',
        etag: this.generateETag(body),
        lastModified: new Date().toUTCString(),
        cachedAt: Date.now(),
        expiresAt: Date.now() + (ttl * 1000),
        ttl,
        endpoint: req.route?.path || req.path,
        method: req.method
      };
      
      await this.cache.set(namespace, cacheKey, cacheData, { ttl });
      
      // Set response headers
      if (this.config.enableConditionalCaching) {
        res.set({
          'ETag': cacheData.etag,
          'Last-Modified': cacheData.lastModified,
          'Cache-Control': `max-age=${ttl}`,
          'X-Cache': 'MISS',
          'X-Cache-TTL': ttl
        });
      }
      
    } catch (error) {
      this.logger.error('Error caching response:', error);
    }
  }

  /**
   * Get namespace from endpoint path
   */
  getNamespaceFromPath(path) {
    if (path.includes('user')) return 'api:user';
    if (path.includes('clan')) return 'api:clan';
    if (path.includes('voting')) return 'api:voting';
    if (path.includes('content')) return 'api:content';
    if (path.includes('leaderboard')) return 'api:leaderboard';
    if (path.includes('tournament')) return 'api:tournament';
    if (path.includes('search')) return 'api:search';
    
    return 'api:general';
  }

  /**
   * Smart cache invalidation
   */
  async invalidateCache(eventType, data = {}) {
    if (!this.config.enableSmartInvalidation) {
      return;
    }
    
    const patterns = this.invalidationMappings.get(eventType);
    if (!patterns) {
      return;
    }
    
    try {
      let totalInvalidated = 0;
      
      for (const pattern of patterns) {
        // Replace wildcards with actual values from data
        let processedPattern = pattern;
        
        if (data.userId && pattern.includes('user:')) {
          processedPattern = pattern.replace('*', data.userId);
        }
        
        if (data.clanId && pattern.includes('clan:')) {
          processedPattern = pattern.replace('*', data.clanId);
        }
        
        if (data.contentId && pattern.includes('content:')) {
          processedPattern = pattern.replace('*', data.contentId);
        }
        
        // Invalidate matching cache entries
        const namespace = this.getNamespaceFromPattern(pattern);
        const invalidated = await this.cache.invalidatePattern(namespace, processedPattern);
        totalInvalidated += invalidated;
      }
      
      this.metrics.invalidations += totalInvalidated;
      
      this.emit('cache:invalidate', {
        eventType,
        totalInvalidated,
        data
      });
      
      this.logger.info(`Cache invalidation: ${eventType} -> ${totalInvalidated} entries`);
      
    } catch (error) {
      this.logger.error('Cache invalidation error:', error);
    }
  }

  /**
   * Get namespace from invalidation pattern
   */
  getNamespaceFromPattern(pattern) {
    if (pattern.includes('user:')) return 'api:user';
    if (pattern.includes('clan:')) return 'api:clan';
    if (pattern.includes('voting:')) return 'api:voting';
    if (pattern.includes('content:')) return 'api:content';
    if (pattern.includes('leaderboard:')) return 'api:leaderboard';
    if (pattern.includes('tournament:')) return 'api:tournament';
    
    return 'api:general';
  }

  /**
   * Cache warming for popular endpoints
   */
  async warmCache(warmingData) {
    if (!this.config.enableCacheWarming) {
      return;
    }
    
    this.warmingQueue.push(...warmingData);
    
    if (!this.isWarming) {
      this.processWarmingQueue();
    }
  }

  /**
   * Process cache warming queue
   */
  async processWarmingQueue() {
    if (this.isWarming || this.warmingQueue.length === 0) {
      return;
    }
    
    this.isWarming = true;
    
    try {
      while (this.warmingQueue.length > 0) {
        const batch = this.warmingQueue.splice(0, 10); // Process in batches
        
        await Promise.all(batch.map(async (item) => {
          try {
            // Simulate request to warm cache
            const mockReq = {
              method: 'GET',
              path: item.endpoint,
              route: { path: item.endpoint },
              query: item.query || {},
              user: item.user || null
            };
            
            const cacheKey = this.generateCacheKey(mockReq);
            const namespace = this.getNamespaceFromPath(item.endpoint);
            
            await this.cache.set(namespace, cacheKey, item.response, {
              ttl: item.ttl || this.config.defaultTTL
            });
            
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
   * Update performance metrics
   */
  updateMetrics(startTime) {
    const responseTime = Date.now() - startTime;
    this.metrics.totalResponseTime += responseTime;
    this.metrics.avgResponseTime = Math.round(
      this.metrics.totalResponseTime / this.metrics.totalRequests
    );
    this.metrics.hitRate = Math.round(
      (this.metrics.hits / this.metrics.totalRequests) * 100 * 100
    ) / 100;
  }

  /**
   * Get performance statistics
   */
  getStats() {
    return {
      ...this.metrics,
      warmingQueueSize: this.warmingQueue.length,
      isWarming: this.isWarming,
      cacheHealth: 'healthy' // Could integrate with cache health check
    };
  }

  /**
   * Clear all cached responses
   */
  async clearCache(namespace = null) {
    if (namespace) {
      return await this.cache.invalidatePattern(namespace, '*');
    } else {
      // Clear all API caches
      const namespaces = [
        'api:user', 'api:clan', 'api:voting', 'api:content',
        'api:leaderboard', 'api:tournament', 'api:search', 'api:general'
      ];
      
      let totalCleared = 0;
      for (const ns of namespaces) {
        totalCleared += await this.cache.invalidatePattern(ns, '*');
      }
      
      return totalCleared;
    }
  }
}

// Create singleton instance
let globalResponseCache = null;

export function createAPIResponseCache(options = {}) {
  return new APIResponseCache(options);
}

export function getAPIResponseCache(options = {}) {
  if (!globalResponseCache) {
    globalResponseCache = new APIResponseCache(options);
  }
  return globalResponseCache;
}

// Export middleware function for easy use
export function responseCache(options = {}) {
  const cache = getAPIResponseCache(options);
  return cache.middleware();
}

// Export invalidation helper
export function invalidateAPICache(eventType, data = {}) {
  const cache = getAPIResponseCache();
  return cache.invalidateCache(eventType, data);
}

export default APIResponseCache;