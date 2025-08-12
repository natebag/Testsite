/**
 * Conditional Requests Handler
 * Implements ETags and Last-Modified headers for efficient caching
 * and conditional request handling (304 Not Modified responses)
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

/**
 * ETag generation strategies
 */
export const ETAG_STRATEGIES = {
  STRONG: 'strong',    // Content-based (default)
  WEAK: 'weak',        // Modified time + size based
  HYBRID: 'hybrid'     // Content hash + modified time
};

/**
 * Conditional Request Manager
 * Handles ETags, Last-Modified headers, and conditional request processing
 */
export class ConditionalRequestManager {
  constructor(options = {}) {
    this.options = {
      etagStrategy: ETAG_STRATEGIES.STRONG,
      enableLastModified: true,
      enableETag: true,
      cacheETags: true,
      maxETagCacheSize: 1000,
      etagCacheTTL: 300000, // 5 minutes
      ...options
    };
    
    this.etagCache = new Map();
    this.fileStatsCache = new Map();
    this.cacheTimes = new Map();
  }

  /**
   * Express middleware for conditional requests
   */
  middleware() {
    return async (req, res, next) => {
      const originalSendFile = res.sendFile;
      const originalSend = res.send;
      const originalJson = res.json;
      
      // Override sendFile to add conditional request handling
      res.sendFile = async (filePath, options, callback) => {
        try {
          await this.handleFileConditionalRequest(req, res, filePath);
          
          // If 304 was sent, don't call original sendFile
          if (res.headersSent) {
            if (callback) callback();
            return;
          }
          
          return originalSendFile.call(res, filePath, options, callback);
        } catch (error) {
          console.error('[ConditionalRequests] Error in sendFile handler:', error);
          return originalSendFile.call(res, filePath, options, callback);
        }
      };
      
      // Override send to add ETag for dynamic content
      res.send = (body) => {
        if (this.options.enableETag && !res.get('ETag')) {
          this.generateContentETag(res, body);
        }
        
        // Check conditional request for dynamic content
        if (this.handleConditionalRequest(req, res)) {
          return res;
        }
        
        return originalSend.call(res, body);
      };
      
      // Override json to add ETag for API responses
      res.json = (obj) => {
        if (this.options.enableETag && !res.get('ETag')) {
          const jsonString = JSON.stringify(obj);
          this.generateContentETag(res, jsonString);
        }
        
        // Check conditional request for API responses
        if (this.handleConditionalRequest(req, res)) {
          return res;
        }
        
        return originalJson.call(res, obj);
      };
      
      next();
    };
  }

  /**
   * Handle conditional requests for files
   */
  async handleFileConditionalRequest(req, res, filePath) {
    try {
      // Generate ETags and Last-Modified headers
      if (this.options.enableETag) {
        await this.setFileETag(res, filePath);
      }
      
      if (this.options.enableLastModified) {
        await this.setLastModified(res, filePath);
      }
      
      // Check if client's cached version is still valid
      if (this.handleConditionalRequest(req, res)) {
        // Resource hasn't changed - send 304
        res.status(304).end();
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('[ConditionalRequests] Failed to handle file conditional request:', error.message);
      return false;
    }
  }

  /**
   * Generate and set ETag for file
   */
  async setFileETag(res, filePath) {
    try {
      const etag = await this.generateFileETag(filePath);
      if (etag) {
        res.set('ETag', etag);
      }
    } catch (error) {
      console.warn('[ConditionalRequests] Failed to set file ETag:', error.message);
    }
  }

  /**
   * Set Last-Modified header for file
   */
  async setLastModified(res, filePath) {
    try {
      const stats = await this.getFileStats(filePath);
      if (stats) {
        res.set('Last-Modified', stats.mtime.toUTCString());
      }
    } catch (error) {
      console.warn('[ConditionalRequests] Failed to set Last-Modified:', error.message);
    }
  }

  /**
   * Generate ETag for file based on strategy
   */
  async generateFileETag(filePath) {
    const cacheKey = `file:${filePath}`;
    
    // Check cache first
    if (this.options.cacheETags && this.etagCache.has(cacheKey)) {
      const cached = this.etagCache.get(cacheKey);
      const cacheTime = this.cacheTimes.get(cacheKey);
      
      if (cacheTime && Date.now() - cacheTime < this.options.etagCacheTTL) {
        return cached.etag;
      }
    }
    
    let etag;
    
    switch (this.options.etagStrategy) {
      case ETAG_STRATEGIES.STRONG:
        etag = await this.generateStrongFileETag(filePath);
        break;
      
      case ETAG_STRATEGIES.WEAK:
        etag = await this.generateWeakFileETag(filePath);
        break;
      
      case ETAG_STRATEGIES.HYBRID:
        etag = await this.generateHybridFileETag(filePath);
        break;
      
      default:
        etag = await this.generateStrongFileETag(filePath);
    }
    
    // Cache the ETag
    if (this.options.cacheETags && etag) {
      this.cacheETag(cacheKey, etag);
    }
    
    return etag;
  }

  /**
   * Generate strong ETag based on file content
   */
  async generateStrongFileETag(filePath) {
    try {
      const content = await fs.readFile(filePath);
      const hash = crypto.createHash('sha256');
      hash.update(content);
      const etag = `"${hash.digest('hex').substring(0, 16)}"`;
      return etag;
    } catch (error) {
      console.warn('[ConditionalRequests] Failed to generate strong ETag:', error.message);
      return null;
    }
  }

  /**
   * Generate weak ETag based on file stats
   */
  async generateWeakFileETag(filePath) {
    try {
      const stats = await this.getFileStats(filePath);
      if (stats) {
        const etag = `W/"${stats.mtime.getTime().toString(16)}-${stats.size.toString(16)}"`;
        return etag;
      }
    } catch (error) {
      console.warn('[ConditionalRequests] Failed to generate weak ETag:', error.message);
    }
    return null;
  }

  /**
   * Generate hybrid ETag (content hash + modification time)
   */
  async generateHybridFileETag(filePath) {
    try {
      const [content, stats] = await Promise.all([
        fs.readFile(filePath),
        this.getFileStats(filePath)
      ]);
      
      const hash = crypto.createHash('md5');
      hash.update(content);
      const contentHash = hash.digest('hex').substring(0, 8);
      const mtime = stats.mtime.getTime().toString(16);
      
      const etag = `"${contentHash}-${mtime}"`;
      return etag;
    } catch (error) {
      console.warn('[ConditionalRequests] Failed to generate hybrid ETag:', error.message);
      return null;
    }
  }

  /**
   * Generate ETag for content string
   */
  generateContentETag(res, content) {
    if (typeof content !== 'string' && !Buffer.isBuffer(content)) {
      content = String(content);
    }
    
    const hash = crypto.createHash('sha256');
    hash.update(content);
    const etag = `"${hash.digest('hex').substring(0, 16)}"`;
    
    res.set('ETag', etag);
    return etag;
  }

  /**
   * Get file stats with caching
   */
  async getFileStats(filePath) {
    const cacheKey = `stats:${filePath}`;
    
    if (this.fileStatsCache.has(cacheKey)) {
      const cached = this.fileStatsCache.get(cacheKey);
      const cacheTime = this.cacheTimes.get(cacheKey);
      
      if (cacheTime && Date.now() - cacheTime < this.options.etagCacheTTL) {
        return cached;
      }
    }
    
    try {
      const stats = await fs.stat(filePath);
      this.cacheFileStats(cacheKey, stats);
      return stats;
    } catch (error) {
      console.warn('[ConditionalRequests] Failed to get file stats:', error.message);
      return null;
    }
  }

  /**
   * Handle conditional request headers
   */
  handleConditionalRequest(req, res) {
    const ifNoneMatch = req.get('If-None-Match');
    const ifModifiedSince = req.get('If-Modified-Since');
    const ifMatch = req.get('If-Match');
    const ifUnmodifiedSince = req.get('If-Unmodified-Since');
    
    const currentETag = res.get('ETag');
    const lastModified = res.get('Last-Modified');
    
    // Handle If-None-Match (for GET/HEAD requests)
    if (ifNoneMatch && currentETag) {
      if (this.matchesETag(ifNoneMatch, currentETag)) {
        res.status(304).end();
        return true;
      }
    }
    
    // Handle If-Modified-Since (for GET/HEAD requests)
    if (ifModifiedSince && lastModified && !ifNoneMatch) {
      if (this.isNotModified(ifModifiedSince, lastModified)) {
        res.status(304).end();
        return true;
      }
    }
    
    // Handle If-Match (for PUT/POST/DELETE requests)
    if (ifMatch && currentETag) {
      if (!this.matchesETag(ifMatch, currentETag)) {
        res.status(412).json({ error: 'Precondition Failed' });
        return true;
      }
    }
    
    // Handle If-Unmodified-Since (for PUT/POST/DELETE requests)
    if (ifUnmodifiedSince && lastModified) {
      if (!this.isNotModified(ifUnmodifiedSince, lastModified)) {
        res.status(412).json({ error: 'Precondition Failed' });
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if ETags match
   */
  matchesETag(clientETag, serverETag) {
    // Handle multiple ETags in If-None-Match
    const clientETags = clientETag.split(',').map(tag => tag.trim());
    
    // Check for wildcard
    if (clientETags.includes('*')) {
      return true;
    }
    
    // Check each client ETag against server ETag
    for (const clientTag of clientETags) {
      if (this.compareETags(clientTag, serverETag)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Compare two ETags (handles weak/strong comparison)
   */
  compareETags(etag1, etag2) {
    if (!etag1 || !etag2) return false;
    
    // Remove weak indicators for comparison
    const clean1 = etag1.replace(/^W\//, '');
    const clean2 = etag2.replace(/^W\//, '');
    
    return clean1 === clean2;
  }

  /**
   * Check if resource is not modified
   */
  isNotModified(ifModifiedSinceHeader, lastModifiedHeader) {
    try {
      const ifModifiedSince = new Date(ifModifiedSinceHeader);
      const lastModified = new Date(lastModifiedHeader);
      
      // Resource is not modified if last modified time is not after if-modified-since
      return lastModified <= ifModifiedSince;
    } catch (error) {
      console.warn('[ConditionalRequests] Failed to parse dates:', error.message);
      return false;
    }
  }

  /**
   * Cache ETag with size management
   */
  cacheETag(key, etag) {
    // Remove oldest entries if cache is full
    if (this.etagCache.size >= this.options.maxETagCacheSize) {
      const oldestKey = this.etagCache.keys().next().value;
      this.etagCache.delete(oldestKey);
      this.cacheTimes.delete(oldestKey);
    }
    
    this.etagCache.set(key, { etag });
    this.cacheTimes.set(key, Date.now());
  }

  /**
   * Cache file stats
   */
  cacheFileStats(key, stats) {
    if (this.fileStatsCache.size >= this.options.maxETagCacheSize) {
      const oldestKey = this.fileStatsCache.keys().next().value;
      this.fileStatsCache.delete(oldestKey);
      this.cacheTimes.delete(oldestKey);
    }
    
    this.fileStatsCache.set(key, stats);
    this.cacheTimes.set(key, Date.now());
  }

  /**
   * Clear cache entries
   */
  clearCache(pattern = null) {
    if (pattern) {
      const regex = new RegExp(pattern);
      
      for (const key of this.etagCache.keys()) {
        if (regex.test(key)) {
          this.etagCache.delete(key);
          this.cacheTimes.delete(key);
        }
      }
      
      for (const key of this.fileStatsCache.keys()) {
        if (regex.test(key)) {
          this.fileStatsCache.delete(key);
          this.cacheTimes.delete(key);
        }
      }
    } else {
      this.etagCache.clear();
      this.fileStatsCache.clear();
      this.cacheTimes.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      etagCacheSize: this.etagCache.size,
      fileStatsCacheSize: this.fileStatsCache.size,
      maxCacheSize: this.options.maxETagCacheSize,
      cacheTTL: this.options.etagCacheTTL,
      strategy: this.options.etagStrategy
    };
  }

  /**
   * Validate ETag format
   */
  validateETag(etag) {
    if (!etag) return false;
    
    // Valid ETag patterns:
    // "strong-etag"
    // W/"weak-etag"
    const strongPattern = /^"[^"]*"$/;
    const weakPattern = /^W\/"[^"]*"$/;
    
    return strongPattern.test(etag) || weakPattern.test(etag);
  }

  /**
   * Generate ETag for API response based on data
   */
  generateAPIResponseETag(data, lastModified = null) {
    const hash = crypto.createHash('sha256');
    
    if (typeof data === 'object') {
      // Sort object keys for consistent hashing
      const sortedData = this.sortObjectKeys(data);
      hash.update(JSON.stringify(sortedData));
    } else {
      hash.update(String(data));
    }
    
    if (lastModified) {
      hash.update(lastModified.toString());
    }
    
    return `"${hash.digest('hex').substring(0, 16)}"`;
  }

  /**
   * Sort object keys recursively for consistent hashing
   */
  sortObjectKeys(obj) {
    if (obj === null || typeof obj !== 'object' || obj instanceof Date) {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    }
    
    const sortedKeys = Object.keys(obj).sort();
    const sortedObj = {};
    
    for (const key of sortedKeys) {
      sortedObj[key] = this.sortObjectKeys(obj[key]);
    }
    
    return sortedObj;
  }
}

/**
 * Factory function to create conditional request manager
 */
export function createConditionalRequestManager(options) {
  return new ConditionalRequestManager(options);
}

/**
 * Utility middleware for API responses
 */
export function apiConditionalCaching(options = {}) {
  const manager = new ConditionalRequestManager(options);
  
  return (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
      // Generate ETag for API response
      const etag = manager.generateAPIResponseETag(data);
      res.set('ETag', etag);
      
      // Set Last-Modified for timestamped data
      if (data && data.updatedAt) {
        res.set('Last-Modified', new Date(data.updatedAt).toUTCString());
      } else if (data && data.timestamp) {
        res.set('Last-Modified', new Date(data.timestamp).toUTCString());
      }
      
      // Handle conditional request
      if (manager.handleConditionalRequest(req, res)) {
        return res;
      }
      
      return originalJson.call(res, data);
    };
    
    next();
  };
}

export default ConditionalRequestManager;