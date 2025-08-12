/**
 * Response Cache Middleware for MLG.clan Platform
 * 
 * Advanced HTTP response caching middleware with intelligent cache strategies,
 * conditional requests support, compression optimization, and CDN-ready headers.
 * Designed for high-performance API endpoints with smart cache invalidation.
 * 
 * Features:
 * - HTTP response caching for GET endpoints
 * - Conditional requests (ETag/Last-Modified)
 * - Compression optimization
 * - CDN-ready cache headers
 * - User-specific and global caching
 * - Cache vary by headers/query parameters
 * - Automatic cache invalidation
 * - Performance monitoring
 * 
 * @author Claude Code - Performance Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { getCacheManager } from '../cache-manager.js';
import crypto from 'crypto';
import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);

export class ResponseCacheMiddleware {
  constructor(options = {}) {
    this.config = {
      // Cache settings
      defaultTTL: options.defaultTTL || 300, // 5 minutes
      maxCacheSize: options.maxCacheSize || 50 * 1024 * 1024, // 50MB
      
      // Response settings
      enableCompression: options.enableCompression !== false,
      compressionThreshold: options.compressionThreshold || 1024, // 1KB
      
      // Headers and ETags
      enableETags: options.enableETags !== false,
      enableLastModified: options.enableLastModified !== false,
      
      // Cache control
      defaultCacheControl: options.defaultCacheControl || 'public, max-age=300',
      privatePaths: options.privatePaths || ['/user/', '/auth/', '/admin/'],
      noCachePaths: options.noCachePaths || ['/api/realtime/', '/api/stream/'],
      
      // Vary headers
      varyByHeaders: options.varyByHeaders || ['Accept-Encoding', 'Accept'],
      varyByQuery: options.varyByQuery !== false,
      varyByUser: options.varyByUser !== false,
      
      // Performance
      enableMetrics: options.enableMetrics !== false,
      
      ...options
    };
    
    this.cache = getCacheManager();
    
    // Metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      bypassed: 0,
      errors: 0,
      totalResponseTime: 0,
      compressionSaves: 0
    };
    
    this.logger = options.logger || console;
  }

  /**
   * Main middleware function
   */
  middleware() {
    return async (req, res, next) => {
      const startTime = Date.now();
      
      try {
        // Skip caching for non-GET requests
        if (req.method !== 'GET') {
          return next();
        }
        
        // Check if path should be cached
        if (!this.shouldCacheRequest(req)) {
          this.metrics.bypassed++;
          return next();
        }
        
        // Generate cache key
        const cacheKey = this.generateCacheKey(req);
        
        // Check for cached response
        const cachedResponse = await this.getCachedResponse(cacheKey);
        
        if (cachedResponse) {
          // Handle conditional requests
          if (this.handleConditionalRequest(req, cachedResponse)) {
            return this.sendNotModified(res, cachedResponse);
          }
          
          return this.sendCachedResponse(res, cachedResponse, startTime);
        }
        
        // Cache miss - intercept response
        this.interceptResponse(req, res, cacheKey, startTime, next);
        
      } catch (error) {
        this.metrics.errors++;
        this.logger.error('Response cache middleware error:', error);
        next();
      }
    };
  }

  /**
   * Determine if request should be cached
   */
  shouldCacheRequest(req) {
    const path = req.path;
    
    // Check no-cache paths
    if (this.config.noCachePaths.some(pattern => path.startsWith(pattern))) {
      return false;
    }
    
    // Check for cache-control header
    const cacheControl = req.headers['cache-control'];
    if (cacheControl && (cacheControl.includes('no-cache') || cacheControl.includes('no-store'))) {
      return false;
    }
    
    // Check for bypass parameter
    if (req.query.nocache || req.query._cache === 'false') {
      return false;
    }
    
    return true;
  }

  /**
   * Generate cache key for request
   */
  generateCacheKey(req) {
    const keyParts = ['response', req.path];
    
    // Add query parameters if configured
    if (this.config.varyByQuery && Object.keys(req.query).length > 0) {
      const sortedQuery = Object.keys(req.query)
        .sort()
        .reduce((result, key) => {
          // Skip cache control parameters
          if (!['nocache', '_cache', '_t'].includes(key)) {
            result[key] = req.query[key];
          }
          return result;
        }, {});
      
      if (Object.keys(sortedQuery).length > 0) {
        keyParts.push(crypto.createHash('md5').update(JSON.stringify(sortedQuery)).digest('hex'));
      }
    }
    
    // Add user ID if user-specific caching
    if (this.config.varyByUser && req.user?.id) {
      keyParts.push(`user:${req.user.id}`);
    }
    
    // Add vary headers
    if (this.config.varyByHeaders.length > 0) {
      const varyValues = this.config.varyByHeaders
        .map(header => req.headers[header.toLowerCase()] || '')
        .filter(value => value)
        .join('|');
      
      if (varyValues) {
        keyParts.push(crypto.createHash('md5').update(varyValues).digest('hex').substring(0, 8));
      }
    }
    
    return keyParts.join(':');
  }

  /**
   * Get cached response
   */
  async getCachedResponse(cacheKey) {
    try {
      const cached = await this.cache.get('http:response', cacheKey);
      if (cached && this.isValidCachedResponse(cached)) {
        this.metrics.hits++;
        return cached;
      }
    } catch (error) {
      this.logger.warn('Cache retrieval error:', error);
    }
    
    this.metrics.misses++;
    return null;
  }

  /**
   * Check if cached response is still valid
   */
  isValidCachedResponse(cached) {
    if (!cached || !cached.timestamp) return false;
    
    const age = Date.now() - cached.timestamp;
    const maxAge = (cached.maxAge || this.config.defaultTTL) * 1000;
    
    return age < maxAge;
  }

  /**
   * Handle conditional requests (ETags, Last-Modified)
   */
  handleConditionalRequest(req, cachedResponse) {
    if (!cachedResponse) return false;
    
    // Check If-None-Match (ETag)
    if (this.config.enableETags && req.headers['if-none-match'] && cachedResponse.etag) {
      const clientETags = req.headers['if-none-match'].split(',').map(tag => tag.trim());
      if (clientETags.includes(cachedResponse.etag) || clientETags.includes('*')) {
        return true;
      }
    }
    
    // Check If-Modified-Since
    if (this.config.enableLastModified && req.headers['if-modified-since'] && cachedResponse.lastModified) {
      const clientDate = new Date(req.headers['if-modified-since']);
      const responseDate = new Date(cachedResponse.lastModified);
      
      if (responseDate <= clientDate) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Send 304 Not Modified response
   */
  sendNotModified(res, cachedResponse) {
    res.status(304);
    
    if (cachedResponse.etag) {
      res.set('ETag', cachedResponse.etag);
    }
    
    if (cachedResponse.lastModified) {
      res.set('Last-Modified', cachedResponse.lastModified);
    }
    
    if (cachedResponse.cacheControl) {
      res.set('Cache-Control', cachedResponse.cacheControl);
    }
    
    res.set('X-Cache', 'HIT-304');
    res.end();
  }

  /**
   * Send cached response
   */
  sendCachedResponse(res, cachedResponse, startTime) {
    // Set headers
    if (cachedResponse.headers) {
      Object.entries(cachedResponse.headers).forEach(([key, value]) => {
        res.set(key, value);
      });
    }
    
    // Set cache headers
    if (cachedResponse.etag) {
      res.set('ETag', cachedResponse.etag);
    }
    
    if (cachedResponse.lastModified) {
      res.set('Last-Modified', cachedResponse.lastModified);
    }
    
    if (cachedResponse.cacheControl) {
      res.set('Cache-Control', cachedResponse.cacheControl);
    }
    
    // Set cache status headers
    const age = Math.floor((Date.now() - cachedResponse.timestamp) / 1000);
    res.set('Age', age.toString());
    res.set('X-Cache', 'HIT');
    res.set('X-Cache-Age', age.toString());
    
    // Send response
    res.status(cachedResponse.statusCode || 200);
    
    if (cachedResponse.compressed && cachedResponse.originalData) {
      res.send(cachedResponse.originalData);
    } else {
      res.send(cachedResponse.data);
    }
    
    // Update metrics
    if (this.config.enableMetrics) {
      this.metrics.totalResponseTime += Date.now() - startTime;
    }
  }

  /**
   * Intercept response for caching
   */
  interceptResponse(req, res, cacheKey, startTime, next) {
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;
    
    let responseData = null;
    let responseSent = false;
    
    // Override send method
    res.send = (data) => {
      if (!responseSent) {
        responseSent = true;
        responseData = data;
        this.cacheResponse(req, res, cacheKey, data, startTime);
      }
      return originalSend.call(res, data);
    };
    
    // Override json method
    res.json = (data) => {
      if (!responseSent) {
        responseSent = true;
        responseData = JSON.stringify(data);
        this.cacheResponse(req, res, cacheKey, responseData, startTime);
      }
      return originalJson.call(res, data);
    };
    
    // Override end method
    res.end = (data) => {
      if (!responseSent && data) {
        responseSent = true;
        responseData = data;
        this.cacheResponse(req, res, cacheKey, data, startTime);
      }
      return originalEnd.call(res, data);
    };
    
    next();
  }

  /**
   * Cache the response
   */
  async cacheResponse(req, res, cacheKey, data, startTime) {
    try {
      // Only cache successful responses
      if (res.statusCode >= 400) {
        return;
      }
      
      // Don't cache responses that are too large
      const dataSize = Buffer.byteLength(data, 'utf8');
      if (dataSize > this.config.maxCacheSize) {
        return;
      }
      
      // Prepare cache data
      const cacheData = {
        data,
        statusCode: res.statusCode,
        headers: this.getFilteredHeaders(res),
        timestamp: Date.now(),
        maxAge: this.getTTLForPath(req.path),
        size: dataSize,
        compressed: false,
        originalData: null
      };
      
      // Add ETag if enabled
      if (this.config.enableETags) {
        cacheData.etag = this.generateETag(data);
        res.set('ETag', cacheData.etag);
      }
      
      // Add Last-Modified if enabled
      if (this.config.enableLastModified) {
        cacheData.lastModified = new Date().toUTCString();
        res.set('Last-Modified', cacheData.lastModified);
      }
      
      // Set cache control headers
      cacheData.cacheControl = this.getCacheControl(req);
      res.set('Cache-Control', cacheData.cacheControl);
      
      // Compress if beneficial
      if (this.config.enableCompression && dataSize > this.config.compressionThreshold) {
        try {
          const compressed = await gzip(data);
          if (compressed.length < dataSize) {
            cacheData.data = compressed;
            cacheData.compressed = true;
            cacheData.originalData = data;
            this.metrics.compressionSaves++;
          }
        } catch (error) {
          this.logger.warn('Compression failed:', error);
        }
      }
      
      // Set vary headers
      if (this.config.varyByHeaders.length > 0) {
        res.set('Vary', this.config.varyByHeaders.join(', '));
      }
      
      // Cache the response
      await this.cache.set('http:response', cacheKey, cacheData, { 
        ttl: cacheData.maxAge 
      });
      
      this.metrics.sets++;
      
      // Update metrics
      if (this.config.enableMetrics) {
        this.metrics.totalResponseTime += Date.now() - startTime;
      }
      
    } catch (error) {
      this.logger.error('Response caching error:', error);
      this.metrics.errors++;
    }
  }

  /**
   * Get filtered headers for caching
   */
  getFilteredHeaders(res) {
    const headers = {};
    const headersToCache = [
      'content-type',
      'content-encoding',
      'content-language',
      'vary',
      'x-ratelimit-remaining',
      'x-ratelimit-reset'
    ];
    
    headersToCache.forEach(header => {
      const value = res.get(header);
      if (value) {
        headers[header] = value;
      }
    });
    
    return headers;
  }

  /**
   * Generate ETag for response data
   */
  generateETag(data) {
    return `"${crypto.createHash('md5').update(data).digest('hex')}"`;
  }

  /**
   * Get TTL for specific path
   */
  getTTLForPath(path) {
    const ttlMap = {
      '/api/user/profile': 1800,      // 30 minutes
      '/api/clan/leaderboard': 300,   // 5 minutes
      '/api/content/trending': 180,   // 3 minutes
      '/api/voting/results': 600,     // 10 minutes
      '/api/content/list': 600,       // 10 minutes
      '/api/clan/list': 1800,         // 30 minutes
      '/api/user/stats': 900          // 15 minutes
    };
    
    // Check for exact matches
    if (ttlMap[path]) {
      return ttlMap[path];
    }
    
    // Check for pattern matches
    for (const [pattern, ttl] of Object.entries(ttlMap)) {
      if (path.startsWith(pattern.replace(/\/\*$/, ''))) {
        return ttl;
      }
    }
    
    return this.config.defaultTTL;
  }

  /**
   * Get cache control header value
   */
  getCacheControl(req) {
    const path = req.path;
    
    // Private cache for user-specific paths
    if (this.config.privatePaths.some(pattern => path.startsWith(pattern))) {
      return `private, max-age=${this.getTTLForPath(path)}`;
    }
    
    // Public cache by default
    const maxAge = this.getTTLForPath(path);
    return `public, max-age=${maxAge}, s-maxage=${maxAge}`;
  }

  /**
   * Cache invalidation methods
   */
  
  /**
   * Invalidate cache by path pattern
   */
  async invalidateByPath(pathPattern) {
    try {
      const pattern = `response:${pathPattern}*`;
      return await this.cache.invalidatePattern('http', pattern);
    } catch (error) {
      this.logger.error('Cache invalidation error:', error);
      return 0;
    }
  }
  
  /**
   * Invalidate user-specific cache
   */
  async invalidateUserCache(userId) {
    try {
      const pattern = `response:*:user:${userId}*`;
      return await this.cache.invalidatePattern('http', pattern);
    } catch (error) {
      this.logger.error('User cache invalidation error:', error);
      return 0;
    }
  }
  
  /**
   * Invalidate all response cache
   */
  async invalidateAll() {
    try {
      return await this.cache.invalidatePattern('http', 'response:*');
    } catch (error) {
      this.logger.error('All cache invalidation error:', error);
      return 0;
    }
  }

  /**
   * Cache warming methods
   */
  
  /**
   * Warm cache for popular endpoints
   */
  async warmCache(endpoints = []) {
    const warmingPromises = endpoints.map(async (endpoint) => {
      try {
        // This would make actual HTTP requests to warm the cache
        // Implementation would depend on your HTTP client
        this.logger.debug(`Warming cache for ${endpoint.path}`);
      } catch (error) {
        this.logger.warn(`Cache warming failed for ${endpoint.path}:`, error);
      }
    });
    
    await Promise.allSettled(warmingPromises);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.metrics.hits + this.metrics.misses + this.metrics.bypassed;
    const hitRate = totalRequests > 0 ? (this.metrics.hits / totalRequests) * 100 : 0;
    const avgResponseTime = totalRequests > 0 ? 
      this.metrics.totalResponseTime / totalRequests : 0;
    
    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      sets: this.metrics.sets,
      bypassed: this.metrics.bypassed,
      errors: this.metrics.errors,
      hitRate: Math.round(hitRate * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime),
      compressionSaves: this.metrics.compressionSaves,
      totalRequests
    };
  }
  
  /**
   * Reset statistics
   */
  resetStats() {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      bypassed: 0,
      errors: 0,
      totalResponseTime: 0,
      compressionSaves: 0
    };
  }

  /**
   * Get cache health information
   */
  async getCacheHealth() {
    const stats = this.getStats();
    
    return {
      status: stats.errors > stats.totalRequests * 0.05 ? 'unhealthy' : 'healthy',
      stats,
      config: {
        defaultTTL: this.config.defaultTTL,
        enableCompression: this.config.enableCompression,
        enableETags: this.config.enableETags,
        maxCacheSize: this.config.maxCacheSize
      },
      recommendations: this.generateCacheRecommendations(stats)
    };
  }
  
  generateCacheRecommendations(stats) {
    const recommendations = [];
    
    if (stats.hitRate < 50) {
      recommendations.push('Low cache hit rate - consider increasing TTL or improving cache keys');
    }
    
    if (stats.errors > stats.totalRequests * 0.01) {
      recommendations.push('High error rate - investigate cache infrastructure');
    }
    
    if (stats.compressionSaves > 0) {
      recommendations.push(`Compression saving space - ${stats.compressionSaves} responses compressed`);
    }
    
    if (stats.avgResponseTime > 100) {
      recommendations.push('High average response time - consider optimizing cache operations');
    }
    
    return recommendations;
  }
}

// Factory function for middleware creation
export function createResponseCacheMiddleware(options = {}) {
  const middleware = new ResponseCacheMiddleware(options);
  return middleware.middleware();
}

// Named export for class
export { ResponseCacheMiddleware };

export default createResponseCacheMiddleware;