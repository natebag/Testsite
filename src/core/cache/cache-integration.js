/**
 * Cache System Integration Middleware
 * Provides simple integration for the comprehensive caching system
 * with existing Express applications
 */

import { setupCache } from './index.js';

/**
 * Simple cache integration for Express applications
 */
export class SimpleCacheIntegration {
  constructor(options = {}) {
    this.options = {
      preset: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      enableLogging: true,
      enableMetrics: true,
      ...options
    };
    
    this.cacheSystem = null;
    this.initialized = false;
  }

  /**
   * Initialize cache system
   */
  async init() {
    try {
      if (this.options.enableLogging) {
        console.log('[CacheIntegration] Initializing cache system...');
      }
      
      this.cacheSystem = setupCache(this.options.preset);
      await this.cacheSystem.init();
      this.initialized = true;
      
      if (this.options.enableLogging) {
        console.log('[CacheIntegration] Cache system initialized successfully');
      }
      
      return true;
    } catch (error) {
      console.error('[CacheIntegration] Failed to initialize cache system:', error);
      return false;
    }
  }

  /**
   * Get Express middleware
   */
  middleware() {
    return (req, res, next) => {
      // Add cache utilities to request/response
      req.cache = this.getCacheUtilities();
      res.cache = this.getResponseCacheUtilities(res);
      
      // Add performance tracking
      if (this.options.enableMetrics && this.cacheSystem?.components?.monitor) {
        const startTime = Date.now();
        
        res.on('finish', () => {
          const duration = Date.now() - startTime;
          const fromCache = res.getHeader('X-Cache') === 'HIT';
          
          if (fromCache) {
            this.cacheSystem.components.monitor.recordCacheHit(req.url, duration, 'middleware');
          } else {
            this.cacheSystem.components.monitor.recordCacheMiss(req.url, duration, 'not-cached');
          }
        });
      }
      
      next();
    };
  }

  /**
   * Get cache utilities for request object
   */
  getCacheUtilities() {
    return {
      // Check if resource should be cached
      shouldCache: (url) => {
        if (!this.initialized) return false;
        
        // Basic caching logic
        return !url.includes('/api/') || url.includes('/api/public/');
      },
      
      // Get cache key for resource
      getCacheKey: (url, userId = null) => {
        if (userId && url.includes('/api/')) {
          return `${url}:user:${userId}`;
        }
        return url;
      },
      
      // Invalidate cache
      invalidate: async (keys, reason = 'manual') => {
        if (!this.initialized || !this.cacheSystem?.components?.invalidation) {
          return false;
        }
        
        try {
          await this.cacheSystem.components.invalidation.invalidate(keys, reason);
          return true;
        } catch (error) {
          console.error('[CacheIntegration] Cache invalidation failed:', error);
          return false;
        }
      }
    };
  }

  /**
   * Get cache utilities for response object
   */
  getResponseCacheUtilities(res) {
    return {
      // Set cache headers
      setCacheHeaders: (maxAge = 3600, options = {}) => {
        const {
          public: isPublic = true,
          immutable = false,
          mustRevalidate = false,
          staleWhileRevalidate = null
        } = options;
        
        const directives = [];
        
        if (isPublic) {
          directives.push('public');
        } else {
          directives.push('private');
        }
        
        directives.push(`max-age=${maxAge}`);
        
        if (immutable) {
          directives.push('immutable');
        }
        
        if (mustRevalidate) {
          directives.push('must-revalidate');
        }
        
        if (staleWhileRevalidate) {
          directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
        }
        
        res.set('Cache-Control', directives.join(', '));
      },
      
      // Set cache hit/miss indicator
      setCacheStatus: (status) => {
        res.set('X-Cache', status.toUpperCase());
      },
      
      // Set ETag
      setETag: (content) => {
        if (!this.initialized || !this.cacheSystem?.components?.conditionalRequests) {
          return;
        }
        
        try {
          this.cacheSystem.components.conditionalRequests.generateContentETag(res, content);
        } catch (error) {
          console.warn('[CacheIntegration] ETag generation failed:', error);
        }
      }
    };
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    if (!this.initialized || !this.cacheSystem?.components?.monitor) {
      return null;
    }
    
    return this.cacheSystem.components.monitor.getCurrentMetrics();
  }

  /**
   * Get performance report
   */
  getPerformanceReport() {
    if (!this.initialized) {
      return { error: 'Cache system not initialized' };
    }
    
    return this.cacheSystem.getPerformanceReport();
  }

  /**
   * Warm critical caches
   */
  async warmCaches() {
    if (!this.initialized) {
      return false;
    }
    
    try {
      return await this.cacheSystem.warmCaches();
    } catch (error) {
      console.error('[CacheIntegration] Cache warming failed:', error);
      return false;
    }
  }

  /**
   * Handle cache events
   */
  emitCacheEvent(eventName, data = {}) {
    if (!this.initialized) {
      return;
    }
    
    this.cacheSystem.handleCacheEvent(eventName, data);
  }

  /**
   * Emergency cache purge
   */
  async emergencyPurge(reason = 'manual') {
    if (!this.initialized) {
      return [];
    }
    
    return await this.cacheSystem.emergencyPurge(reason);
  }
}

/**
 * Factory function for simple cache integration
 */
export function createCacheIntegration(options = {}) {
  return new SimpleCacheIntegration(options);
}

/**
 * Express middleware factory
 */
export function cacheMiddleware(options = {}) {
  const integration = createCacheIntegration(options);
  
  // Initialize on first use
  let initPromise = null;
  
  return async (req, res, next) => {
    if (!integration.initialized && !initPromise) {
      initPromise = integration.init();
    }
    
    if (initPromise) {
      await initPromise;
      initPromise = null;
    }
    
    return integration.middleware()(req, res, next);
  };
}

/**
 * Simple cache headers middleware
 */
export function simpleCacheHeaders() {
  return (req, res, next) => {
    const originalSendFile = res.sendFile;
    const originalJson = res.json;
    const originalSend = res.send;
    
    // Override sendFile to add cache headers
    res.sendFile = function(filePath, options, callback) {
      // Determine cache strategy based on file type
      const ext = filePath.split('.').pop()?.toLowerCase();
      
      switch (ext) {
        case 'js':
        case 'css':
          res.set('Cache-Control', 'public, max-age=31536000, immutable');
          res.set('X-Content-Type-Options', 'nosniff');
          break;
        
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'svg':
        case 'webp':
          res.set('Cache-Control', 'public, max-age=2592000');
          res.set('X-Content-Type-Options', 'nosniff');
          break;
        
        case 'woff':
        case 'woff2':
        case 'ttf':
        case 'eot':
          res.set('Cache-Control', 'public, max-age=31536000, immutable');
          res.set('Access-Control-Allow-Origin', '*');
          break;
        
        case 'html':
          res.set('Cache-Control', 'public, max-age=300, must-revalidate');
          res.set('X-Content-Type-Options', 'nosniff');
          res.set('X-Frame-Options', 'SAMEORIGIN');
          break;
        
        default:
          res.set('Cache-Control', 'public, max-age=3600');
      }
      
      // Add compression hint for text-based files
      if (['js', 'css', 'html', 'json', 'xml', 'txt'].includes(ext)) {
        res.set('Vary', 'Accept-Encoding');
      }
      
      return originalSendFile.call(res, filePath, options, callback);
    };
    
    // Override JSON responses for API caching
    res.json = function(data) {
      if (req.url.startsWith('/api/')) {
        // API responses - shorter cache
        res.set('Cache-Control', 'public, max-age=900, must-revalidate');
        res.set('X-Content-Type-Options', 'nosniff');
      }
      
      return originalJson.call(res, data);
    };
    
    // Override send for other responses
    res.send = function(data) {
      if (!res.get('Cache-Control')) {
        res.set('Cache-Control', 'public, max-age=300');
      }
      
      return originalSend.call(res, data);
    };
    
    next();
  };
}

export default SimpleCacheIntegration;