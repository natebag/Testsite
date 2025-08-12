/**
 * HTTP Cache Headers Manager
 * Implements comprehensive caching strategies with optimal cache-control policies
 * for different asset types to maximize performance while maintaining freshness
 */

import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

/**
 * Cache Configuration - Optimal cache durations for different asset types
 */
export const CACHE_POLICIES = {
  // Static assets (immutable with hashing)
  STATIC_ASSETS: {
    maxAge: 31536000, // 1 year
    immutable: true,
    public: true,
    sMaxAge: 31536000 // CDN cache: 1 year
  },
  
  // HTML pages (short cache for freshness)
  HTML_PAGES: {
    maxAge: 300, // 5 minutes
    public: true,
    mustRevalidate: true,
    sMaxAge: 3600 // CDN cache: 1 hour
  },
  
  // API responses (conditional caching)
  API_RESPONSES: {
    maxAge: 900, // 15 minutes
    public: false,
    mustRevalidate: true,
    staleWhileRevalidate: 300 // 5 minutes stale serving
  },
  
  // Dynamic content (aggressive revalidation)
  DYNAMIC_CONTENT: {
    maxAge: 60, // 1 minute
    public: true,
    mustRevalidate: true,
    staleWhileRevalidate: 30
  },
  
  // Service Worker (immediate updates)
  SERVICE_WORKER: {
    maxAge: 0,
    noCache: true,
    noStore: false,
    mustRevalidate: true
  },
  
  // Fonts (long cache)
  FONTS: {
    maxAge: 31536000, // 1 year
    immutable: true,
    public: true,
    crossOrigin: 'anonymous'
  },
  
  // Images (medium-long cache)
  IMAGES: {
    maxAge: 2592000, // 30 days
    public: true,
    staleWhileRevalidate: 86400 // 1 day
  },
  
  // Critical resources (balanced caching)
  CRITICAL_RESOURCES: {
    maxAge: 3600, // 1 hour
    public: true,
    mustRevalidate: true,
    staleWhileRevalidate: 1800 // 30 minutes
  }
};

/**
 * Asset type detection based on file extension and path patterns
 */
export const ASSET_TYPES = {
  STATIC_ASSETS: /\.(js|css)$/i,
  HTML_PAGES: /\.html$/i,
  FONTS: /\.(woff2?|ttf|eot|otf)$/i,
  IMAGES: /\.(png|jpe?g|gif|svg|webp|avif|ico)$/i,
  SERVICE_WORKER: /sw\.js$|service-worker\.js$/i,
  API_RESPONSES: /^\/api\//,
  CRITICAL_RESOURCES: /\/(main|app|core|vendor)\./i
};

/**
 * Main HTTP Cache Headers Middleware
 * Applies appropriate caching strategies based on request type and configuration
 */
export class HTTPCacheManager {
  constructor(options = {}) {
    this.options = {
      enableETag: true,
      enableLastModified: true,
      enableVary: true,
      enableSRI: true,
      enableCompression: true,
      ...options
    };
    
    this.eTagCache = new Map();
    this.fileStatsCache = new Map();
    this.sriHashes = new Map();
  }

  /**
   * Express middleware function for HTTP caching
   */
  middleware() {
    return (req, res, next) => {
      const originalSend = res.send;
      const originalSendFile = res.sendFile;
      const originalJson = res.json;
      
      // Override res.send to apply caching
      res.send = (body) => {
        this.applyCachingHeaders(req, res, body);
        return originalSend.call(res, body);
      };
      
      // Override res.sendFile to apply file-based caching
      res.sendFile = (filePath, options, callback) => {
        this.applyFileCachingHeaders(req, res, filePath);
        return originalSendFile.call(res, filePath, options, callback);
      };
      
      // Override res.json to apply API caching
      res.json = (obj) => {
        this.applyAPICachingHeaders(req, res);
        return originalJson.call(res, obj);
      };
      
      next();
    };
  }

  /**
   * Apply caching headers based on content type and request
   */
  applyCachingHeaders(req, res, body) {
    const url = req.url;
    const method = req.method.toLowerCase();
    
    // Only cache GET requests
    if (method !== 'get') {
      this.setNoCacheHeaders(res);
      return;
    }

    // Determine asset type and apply appropriate policy
    const assetType = this.detectAssetType(url);
    const policy = this.getCachePolicy(assetType);
    
    // Apply headers
    this.setCacheControlHeaders(res, policy);
    
    if (this.options.enableETag) {
      this.setETagHeader(res, body, url);
    }
    
    if (this.options.enableVary) {
      this.setVaryHeader(res, assetType);
    }
    
    if (this.options.enableSRI && this.shouldApplySRI(assetType)) {
      this.setSRIHeader(res, body);
    }

    // Set security headers for cached assets
    this.setSecurityHeaders(res, assetType);
  }

  /**
   * Apply file-specific caching headers
   */
  applyFileCachingHeaders(req, res, filePath) {
    const url = req.url;
    const assetType = this.detectAssetType(url);
    const policy = this.getCachePolicy(assetType);
    
    // Apply cache control
    this.setCacheControlHeaders(res, policy);
    
    if (this.options.enableLastModified) {
      this.setLastModifiedHeader(res, filePath);
    }
    
    if (this.options.enableETag) {
      this.setFileETagHeader(res, filePath);
    }
    
    if (this.options.enableVary) {
      this.setVaryHeader(res, assetType);
    }

    // Set security headers
    this.setSecurityHeaders(res, assetType);
    
    // Apply compression hints
    if (this.options.enableCompression && this.shouldCompress(assetType)) {
      res.set('Vary', 'Accept-Encoding');
    }
  }

  /**
   * Apply API-specific caching headers
   */
  applyAPICachingHeaders(req, res) {
    const policy = CACHE_POLICIES.API_RESPONSES;
    
    // Check if API response should be cached
    if (this.shouldCacheAPI(req)) {
      this.setCacheControlHeaders(res, policy);
      
      if (this.options.enableETag) {
        // ETag will be set when response is sent
        res.locals.shouldSetETag = true;
      }
    } else {
      this.setNoCacheHeaders(res);
    }
    
    // Always set security headers for APIs
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
  }

  /**
   * Detect asset type based on URL patterns
   */
  detectAssetType(url) {
    const pathname = new URL(url, 'http://localhost').pathname;
    
    if (ASSET_TYPES.SERVICE_WORKER.test(pathname)) {
      return 'SERVICE_WORKER';
    }
    if (ASSET_TYPES.API_RESPONSES.test(pathname)) {
      return 'API_RESPONSES';
    }
    if (ASSET_TYPES.FONTS.test(pathname)) {
      return 'FONTS';
    }
    if (ASSET_TYPES.IMAGES.test(pathname)) {
      return 'IMAGES';
    }
    if (ASSET_TYPES.CRITICAL_RESOURCES.test(pathname)) {
      return 'CRITICAL_RESOURCES';
    }
    if (ASSET_TYPES.STATIC_ASSETS.test(pathname)) {
      return 'STATIC_ASSETS';
    }
    if (ASSET_TYPES.HTML_PAGES.test(pathname)) {
      return 'HTML_PAGES';
    }
    
    return 'DYNAMIC_CONTENT';
  }

  /**
   * Get cache policy for asset type
   */
  getCachePolicy(assetType) {
    return CACHE_POLICIES[assetType] || CACHE_POLICIES.DYNAMIC_CONTENT;
  }

  /**
   * Set Cache-Control headers based on policy
   */
  setCacheControlHeaders(res, policy) {
    const directives = [];
    
    if (policy.public) {
      directives.push('public');
    } else if (policy.public === false) {
      directives.push('private');
    }
    
    if (policy.noCache) {
      directives.push('no-cache');
    }
    
    if (policy.noStore) {
      directives.push('no-store');
    }
    
    if (policy.maxAge !== undefined) {
      directives.push(`max-age=${policy.maxAge}`);
    }
    
    if (policy.sMaxAge) {
      directives.push(`s-maxage=${policy.sMaxAge}`);
    }
    
    if (policy.mustRevalidate) {
      directives.push('must-revalidate');
    }
    
    if (policy.immutable) {
      directives.push('immutable');
    }
    
    if (policy.staleWhileRevalidate) {
      directives.push(`stale-while-revalidate=${policy.staleWhileRevalidate}`);
    }
    
    if (directives.length > 0) {
      res.set('Cache-Control', directives.join(', '));
    }
  }

  /**
   * Set ETag header based on content
   */
  setETagHeader(res, content, url) {
    const hash = crypto.createHash('sha256');
    hash.update(content);
    const etag = `"${hash.digest('hex').substring(0, 16)}"`;
    
    res.set('ETag', etag);
    this.eTagCache.set(url, etag);
  }

  /**
   * Set ETag header for files
   */
  setFileETagHeader(res, filePath) {
    try {
      const stats = fs.statSync(filePath);
      const etag = `"${stats.mtime.getTime().toString(16)}-${stats.size.toString(16)}"`;
      res.set('ETag', etag);
    } catch (error) {
      console.warn('[Cache] Failed to set ETag for file:', filePath, error.message);
    }
  }

  /**
   * Set Last-Modified header for files
   */
  setLastModifiedHeader(res, filePath) {
    try {
      let stats = this.fileStatsCache.get(filePath);
      
      if (!stats) {
        stats = fs.statSync(filePath);
        this.fileStatsCache.set(filePath, stats);
        
        // Clear cache after 5 minutes
        setTimeout(() => {
          this.fileStatsCache.delete(filePath);
        }, 300000);
      }
      
      res.set('Last-Modified', stats.mtime.toUTCString());
    } catch (error) {
      console.warn('[Cache] Failed to set Last-Modified for file:', filePath, error.message);
    }
  }

  /**
   * Set Vary header based on asset type
   */
  setVaryHeader(res, assetType) {
    const varyHeaders = [];
    
    // Always vary on Accept-Encoding for compressible assets
    if (this.shouldCompress(assetType)) {
      varyHeaders.push('Accept-Encoding');
    }
    
    // Vary on Accept for content negotiation
    if (assetType === 'API_RESPONSES' || assetType === 'DYNAMIC_CONTENT') {
      varyHeaders.push('Accept');
    }
    
    // Vary on Origin for CORS
    if (assetType === 'API_RESPONSES' || assetType === 'FONTS') {
      varyHeaders.push('Origin');
    }
    
    if (varyHeaders.length > 0) {
      res.set('Vary', varyHeaders.join(', '));
    }
  }

  /**
   * Set Subresource Integrity header
   */
  setSRIHeader(res, content) {
    if (typeof content === 'string') {
      const hash = crypto.createHash('sha384');
      hash.update(content);
      const integrity = `sha384-${hash.digest('base64')}`;
      res.set('X-Content-Integrity', integrity);
    }
  }

  /**
   * Set security headers for cached assets
   */
  setSecurityHeaders(res, assetType) {
    // Basic security headers
    res.set('X-Content-Type-Options', 'nosniff');
    
    // Frame options for HTML content
    if (assetType === 'HTML_PAGES') {
      res.set('X-Frame-Options', 'SAMEORIGIN');
    }
    
    // CORS headers for fonts
    if (assetType === 'FONTS') {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET');
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
    
    // Referrer policy
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  }

  /**
   * Set no-cache headers for uncacheable content
   */
  setNoCacheHeaders(res) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }

  /**
   * Check if asset type should be compressed
   */
  shouldCompress(assetType) {
    return ['STATIC_ASSETS', 'HTML_PAGES', 'API_RESPONSES', 'DYNAMIC_CONTENT'].includes(assetType);
  }

  /**
   * Check if SRI should be applied
   */
  shouldApplySRI(assetType) {
    return ['STATIC_ASSETS', 'CRITICAL_RESOURCES'].includes(assetType);
  }

  /**
   * Check if API response should be cached
   */
  shouldCacheAPI(req) {
    const url = req.url;
    const method = req.method.toLowerCase();
    
    // Only cache GET requests
    if (method !== 'get') return false;
    
    // Cache public API endpoints
    const cacheableEndpoints = [
      '/api/health',
      '/api/clans',
      '/api/content/public',
      '/api/leaderboard',
      '/api/tournaments/public',
      '/api/stats'
    ];
    
    return cacheableEndpoints.some(endpoint => url.startsWith(endpoint));
  }

  /**
   * Handle conditional requests (304 Not Modified)
   */
  handleConditionalRequest(req, res) {
    const ifNoneMatch = req.get('If-None-Match');
    const ifModifiedSince = req.get('If-Modified-Since');
    
    const currentETag = res.get('ETag');
    const lastModified = res.get('Last-Modified');
    
    // Check ETag
    if (ifNoneMatch && currentETag && ifNoneMatch === currentETag) {
      res.status(304).end();
      return true;
    }
    
    // Check Last-Modified
    if (ifModifiedSince && lastModified) {
      const ifModifiedSinceDate = new Date(ifModifiedSince);
      const lastModifiedDate = new Date(lastModified);
      
      if (ifModifiedSinceDate >= lastModifiedDate) {
        res.status(304).end();
        return true;
      }
    }
    
    return false;
  }

  /**
   * Clear cache entries (for cache invalidation)
   */
  clearCache(pattern) {
    if (pattern) {
      // Clear specific entries matching pattern
      const regex = new RegExp(pattern);
      for (const key of this.eTagCache.keys()) {
        if (regex.test(key)) {
          this.eTagCache.delete(key);
        }
      }
      for (const key of this.fileStatsCache.keys()) {
        if (regex.test(key)) {
          this.fileStatsCache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.eTagCache.clear();
      this.fileStatsCache.clear();
      this.sriHashes.clear();
    }
  }
}

/**
 * Factory function to create cache manager instance
 */
export function createCacheManager(options) {
  return new HTTPCacheManager(options);
}

/**
 * Utility function to get optimal cache headers for specific asset
 */
export function getCacheHeaders(assetType, customOptions = {}) {
  const policy = CACHE_POLICIES[assetType] || CACHE_POLICIES.DYNAMIC_CONTENT;
  const manager = new HTTPCacheManager();
  
  const mockRes = {
    headers: {},
    set(name, value) {
      this.headers[name] = value;
    }
  };
  
  manager.setCacheControlHeaders(mockRes, { ...policy, ...customOptions });
  return mockRes.headers;
}

export default HTTPCacheManager;