/**
 * MLG.clan Cache Manager
 * Intelligent caching system for API responses and static data
 * 
 * Features:
 * - Multi-level cache (memory + localStorage)
 * - TTL-based expiration
 * - Cache invalidation strategies
 * - Compression for large responses
 * - Cache warming for critical data
 * - Gaming performance metrics
 * - Cache hit/miss analytics
 * 
 * @author Claude Code - Frontend Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

class MLGCacheManager {
  constructor(options = {}) {
    this.memoryCache = new Map();
    this.storagePrefix = 'mlg_cache_';
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutes
    this.maxMemorySize = options.maxMemorySize || 50; // 50 items in memory
    this.maxStorageSize = options.maxStorageSize || 5 * 1024 * 1024; // 5MB
    this.compressionThreshold = options.compressionThreshold || 1024; // 1KB
    
    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      compressions: 0,
      totalSize: 0
    };
    
    // Cache strategies per endpoint
    this.strategies = {
      '/system/status': { ttl: 30 * 1000, priority: 'high' }, // 30 seconds
      '/voting/active': { ttl: 15 * 1000, priority: 'high' }, // 15 seconds
      '/clans': { ttl: 2 * 60 * 1000, priority: 'medium' }, // 2 minutes
      '/content': { ttl: 60 * 1000, priority: 'medium' }, // 1 minute
      '/users/profile': { ttl: 10 * 60 * 1000, priority: 'low' }, // 10 minutes
      '/leaderboard': { ttl: 5 * 60 * 1000, priority: 'medium' }, // 5 minutes
      '/dao': { ttl: 30 * 60 * 1000, priority: 'low' }, // 30 minutes
      'static': { ttl: 24 * 60 * 60 * 1000, priority: 'low' } // 24 hours
    };
    
    this.init();
  }

  init() {
    console.log('🗄️ Initializing MLG Cache Manager...');
    
    // Clean up expired items on startup
    this.cleanup();
    
    // Setup periodic cleanup
    this.setupPeriodicCleanup();
    
    // Setup storage event listener for multi-tab sync
    this.setupStorageSync();
    
    // Warm critical cache
    this.warmCache();
    
    console.log('✅ MLG Cache Manager initialized');
  }

  // Generate cache key with consistent hashing
  generateKey(url, options = {}) {
    const normalized = this.normalizeUrl(url);
    const optionsStr = JSON.stringify(options);
    return btoa(normalized + optionsStr).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  normalizeUrl(url) {
    // Remove query parameters that don't affect caching
    const urlObj = new URL(url, window.location.origin);
    
    // Remove timestamp and other cache-busting parameters
    urlObj.searchParams.delete('_t');
    urlObj.searchParams.delete('timestamp');
    urlObj.searchParams.delete('nocache');
    
    return urlObj.toString();
  }

  // Get cache strategy for a URL
  getStrategy(url) {
    const path = new URL(url, window.location.origin).pathname;
    
    // Find matching strategy
    for (const [pattern, strategy] of Object.entries(this.strategies)) {
      if (path.includes(pattern) || url.includes(pattern)) {
        return strategy;
      }
    }
    
    // Default strategy
    return { ttl: this.defaultTTL, priority: 'medium' };
  }

  // Store data in cache with intelligent placement
  set(key, data, options = {}) {
    const strategy = options.strategy || this.getStrategy(options.url || '');
    const ttl = options.ttl || strategy.ttl;
    const priority = options.priority || strategy.priority;
    
    const cacheItem = {
      data: data,
      timestamp: Date.now(),
      ttl: ttl,
      priority: priority,
      url: options.url || '',
      size: this.calculateSize(data),
      compressed: false,
      hits: 0
    };
    
    // Compress if data is large
    if (cacheItem.size > this.compressionThreshold) {
      try {
        cacheItem.data = this.compress(data);
        cacheItem.compressed = true;
        cacheItem.originalSize = cacheItem.size;
        cacheItem.size = this.calculateSize(cacheItem.data);
        this.stats.compressions++;
        console.log(`🗜️ Compressed cache item ${key}: ${cacheItem.originalSize} -> ${cacheItem.size} bytes`);
      } catch (error) {
        console.warn('Compression failed:', error);
      }
    }
    
    // Store in memory cache
    this.memoryCache.set(key, cacheItem);
    
    // Store in localStorage for persistence (high priority items)
    if (priority === 'high' || priority === 'medium') {
      try {
        const storageItem = {
          ...cacheItem,
          cacheVersion: '1.0'
        };
        localStorage.setItem(this.storagePrefix + key, JSON.stringify(storageItem));
      } catch (error) {
        console.warn('localStorage cache failed:', error);
        // If storage is full, try to clean up
        this.cleanupStorage();
      }
    }
    
    // Enforce memory cache size limit
    if (this.memoryCache.size > this.maxMemorySize) {
      this.evictLRU();
    }
    
    this.stats.sets++;
    this.stats.totalSize += cacheItem.size;
    
    console.log(`📦 Cached ${key} (${cacheItem.size} bytes, TTL: ${ttl}ms, Priority: ${priority})`);
  }

  // Retrieve data from cache
  get(key, options = {}) {
    // Try memory cache first
    let cacheItem = this.memoryCache.get(key);
    
    // If not in memory, try localStorage
    if (!cacheItem) {
      try {
        const stored = localStorage.getItem(this.storagePrefix + key);
        if (stored) {
          const parsed = JSON.parse(stored);
          
          // Validate cache version
          if (parsed.cacheVersion === '1.0') {
            cacheItem = parsed;
            // Put back in memory cache
            this.memoryCache.set(key, cacheItem);
          }
        }
      } catch (error) {
        console.warn('Cache retrieval error:', error);
      }
    }
    
    if (!cacheItem) {
      this.stats.misses++;
      return null;
    }
    
    // Check if expired
    if (Date.now() - cacheItem.timestamp > cacheItem.ttl) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }
    
    // Update hit statistics
    cacheItem.hits++;
    cacheItem.lastAccessed = Date.now();
    this.stats.hits++;
    
    // Decompress if needed
    let data = cacheItem.data;
    if (cacheItem.compressed) {
      try {
        data = this.decompress(cacheItem.data);
      } catch (error) {
        console.error('Decompression failed:', error);
        this.delete(key);
        return null;
      }
    }
    
    console.log(`🎯 Cache hit for ${key} (age: ${Date.now() - cacheItem.timestamp}ms, hits: ${cacheItem.hits})`);
    return data;
  }

  // Delete specific cache item
  delete(key) {
    const deleted = this.memoryCache.delete(key);
    
    try {
      localStorage.removeItem(this.storagePrefix + key);
    } catch (error) {
      console.warn('Cache deletion error:', error);
    }
    
    if (deleted) {
      this.stats.deletes++;
    }
    
    return deleted;
  }

  // Clear cache with optional pattern matching
  clear(pattern = null) {
    if (!pattern) {
      // Clear everything
      this.memoryCache.clear();
      this.clearStorage();
      this.resetStats();
      console.log('🧹 Cache cleared completely');
      return;
    }
    
    // Clear items matching pattern
    const keysToDelete = [];
    
    this.memoryCache.forEach((item, key) => {
      if (item.url && item.url.includes(pattern)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.delete(key));
    
    console.log(`🧹 Cache cleared for pattern: ${pattern} (${keysToDelete.length} items)`);
  }

  // Cache warming for critical data
  async warmCache() {
    console.log('🔥 Warming cache with critical data...');
    
    const criticalEndpoints = [
      { url: '/system/status', priority: 'high' },
      { url: '/voting/active', priority: 'high' },
      { url: '/leaderboard/global', priority: 'medium' }
    ];
    
    for (const endpoint of criticalEndpoints) {
      try {
        if (window.MLGApiClient) {
          // This will cache the response automatically
          await window.MLGApiClient.get(endpoint.url, { cache: true });
        }
      } catch (error) {
        console.warn(`Cache warming failed for ${endpoint.url}:`, error);
      }
    }
  }

  // Intelligent cache refresh
  async refresh(key, fetcher) {
    if (!fetcher || typeof fetcher !== 'function') {
      console.error('Cache refresh requires a fetcher function');
      return null;
    }
    
    try {
      console.log(`🔄 Refreshing cache for ${key}`);
      const newData = await fetcher();
      
      if (newData) {
        this.set(key, newData);
        return newData;
      }
    } catch (error) {
      console.error(`Cache refresh failed for ${key}:`, error);
      
      // Return stale data if available
      const stale = this.getStale(key);
      if (stale) {
        console.log(`📰 Returning stale data for ${key}`);
        return stale;
      }
    }
    
    return null;
  }

  // Get stale data (ignores TTL)
  getStale(key) {
    const cacheItem = this.memoryCache.get(key);
    if (!cacheItem) return null;
    
    return cacheItem.compressed ? this.decompress(cacheItem.data) : cacheItem.data;
  }

  // Compression utilities
  compress(data) {
    try {
      // Simple compression using JSON + gzip-like approach
      const jsonStr = JSON.stringify(data);
      return btoa(unescape(encodeURIComponent(jsonStr)));
    } catch (error) {
      console.warn('Compression failed:', error);
      return data;
    }
  }

  decompress(compressedData) {
    try {
      const jsonStr = decodeURIComponent(escape(atob(compressedData)));
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Decompression failed:', error);
      throw error;
    }
  }

  // Size calculation
  calculateSize(data) {
    return new Blob([JSON.stringify(data)]).size;
  }

  // Least Recently Used eviction
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    this.memoryCache.forEach((item, key) => {
      const accessTime = item.lastAccessed || item.timestamp;
      if (accessTime < oldestTime) {
        oldestTime = accessTime;
        oldestKey = key;
      }
    });
    
    if (oldestKey) {
      this.delete(oldestKey);
      this.stats.evictions++;
      console.log(`🗑️ Evicted LRU cache item: ${oldestKey}`);
    }
  }

  // Cleanup expired items
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];
    
    this.memoryCache.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => this.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 Cleaned up ${expiredKeys.length} expired cache items`);
    }
  }

  // Cleanup storage
  cleanupStorage() {
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.storagePrefix)) {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          if (Date.now() - item.timestamp > item.ttl) {
            keysToRemove.push(key);
          }
        } catch (error) {
          // Invalid item, remove it
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    if (keysToRemove.length > 0) {
      console.log(`🧹 Cleaned up ${keysToRemove.length} expired storage items`);
    }
  }

  clearStorage() {
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.storagePrefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // Setup periodic cleanup
  setupPeriodicCleanup() {
    // Clean up every 5 minutes
    setInterval(() => {
      this.cleanup();
      this.cleanupStorage();
    }, 5 * 60 * 1000);
  }

  // Setup storage synchronization for multi-tab
  setupStorageSync() {
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith(this.storagePrefix)) {
        const cacheKey = e.key.replace(this.storagePrefix, '');
        
        if (e.newValue) {
          // Item was added/updated in another tab
          try {
            const item = JSON.parse(e.newValue);
            this.memoryCache.set(cacheKey, item);
          } catch (error) {
            console.warn('Storage sync error:', error);
          }
        } else {
          // Item was removed in another tab
          this.memoryCache.delete(cacheKey);
        }
      }
    });
  }

  // Cache statistics and analytics
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)
      : 0;
      
    return {
      ...this.stats,
      hitRate: parseFloat(hitRate),
      memoryItems: this.memoryCache.size,
      totalSizeMB: (this.stats.totalSize / 1024 / 1024).toFixed(2)
    };
  }

  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      compressions: 0,
      totalSize: 0
    };
  }

  // Performance monitoring
  getPerformanceReport() {
    const stats = this.getStats();
    const recommendations = [];
    
    if (stats.hitRate < 60) {
      recommendations.push('Consider increasing cache TTL for frequently accessed endpoints');
    }
    
    if (stats.evictions > stats.sets * 0.1) {
      recommendations.push('Consider increasing memory cache size');
    }
    
    if (stats.compressions > 0) {
      recommendations.push(`${stats.compressions} items were compressed, saving storage space`);
    }
    
    return {
      stats,
      recommendations,
      efficiency: stats.hitRate >= 70 ? 'excellent' : stats.hitRate >= 50 ? 'good' : 'poor'
    };
  }

  // Preload critical data
  async preload(urls) {
    console.log(`🚀 Preloading ${urls.length} critical endpoints...`);
    
    const promises = urls.map(async (url) => {
      try {
        if (window.MLGApiClient) {
          await window.MLGApiClient.get(url, { cache: true });
        }
      } catch (error) {
        console.warn(`Preload failed for ${url}:`, error);
      }
    });
    
    await Promise.allSettled(promises);
    console.log('✅ Preload completed');
  }

  // Export cache for debugging
  export() {
    const exported = {
      memory: {},
      storage: {},
      stats: this.getStats()
    };
    
    // Export memory cache
    this.memoryCache.forEach((item, key) => {
      exported.memory[key] = {
        url: item.url,
        timestamp: item.timestamp,
        ttl: item.ttl,
        priority: item.priority,
        size: item.size,
        hits: item.hits,
        compressed: item.compressed
      };
    });
    
    // Export storage cache
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.storagePrefix)) {
        const cacheKey = key.replace(this.storagePrefix, '');
        try {
          const item = JSON.parse(localStorage.getItem(key));
          exported.storage[cacheKey] = {
            url: item.url,
            timestamp: item.timestamp,
            ttl: item.ttl,
            priority: item.priority,
            size: item.size
          };
        } catch (error) {
          console.warn(`Export failed for ${key}:`, error);
        }
      }
    }
    
    return exported;
  }

  // Destroy cache manager
  destroy() {
    this.memoryCache.clear();
    this.clearStorage();
    this.resetStats();
    console.log('🧹 Cache manager destroyed');
  }
}

// Create global instance
window.MLGCacheManager = new MLGCacheManager();

// Export for ES6 modules
export default MLGCacheManager;
export { MLGCacheManager };