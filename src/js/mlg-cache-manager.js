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
      try {\n        const storageItem = {\n          ...cacheItem,\n          cacheVersion: '1.0'\n        };\n        localStorage.setItem(this.storagePrefix + key, JSON.stringify(storageItem));\n      } catch (error) {\n        console.warn('localStorage cache failed:', error);\n        // If storage is full, try to clean up\n        this.cleanupStorage();\n      }\n    }\n    \n    // Enforce memory cache size limit\n    if (this.memoryCache.size > this.maxMemorySize) {\n      this.evictLRU();\n    }\n    \n    this.stats.sets++;\n    this.stats.totalSize += cacheItem.size;\n    \n    console.log(`📦 Cached ${key} (${cacheItem.size} bytes, TTL: ${ttl}ms, Priority: ${priority})`);\n  }\n\n  // Retrieve data from cache\n  get(key, options = {}) {\n    // Try memory cache first\n    let cacheItem = this.memoryCache.get(key);\n    \n    // If not in memory, try localStorage\n    if (!cacheItem) {\n      try {\n        const stored = localStorage.getItem(this.storagePrefix + key);\n        if (stored) {\n          const parsed = JSON.parse(stored);\n          \n          // Validate cache version\n          if (parsed.cacheVersion === '1.0') {\n            cacheItem = parsed;\n            // Put back in memory cache\n            this.memoryCache.set(key, cacheItem);\n          }\n        }\n      } catch (error) {\n        console.warn('Cache retrieval error:', error);\n      }\n    }\n    \n    if (!cacheItem) {\n      this.stats.misses++;\n      return null;\n    }\n    \n    // Check if expired\n    if (Date.now() - cacheItem.timestamp > cacheItem.ttl) {\n      this.delete(key);\n      this.stats.misses++;\n      return null;\n    }\n    \n    // Update hit statistics\n    cacheItem.hits++;\n    cacheItem.lastAccessed = Date.now();\n    this.stats.hits++;\n    \n    // Decompress if needed\n    let data = cacheItem.data;\n    if (cacheItem.compressed) {\n      try {\n        data = this.decompress(cacheItem.data);\n      } catch (error) {\n        console.error('Decompression failed:', error);\n        this.delete(key);\n        return null;\n      }\n    }\n    \n    console.log(`🎯 Cache hit for ${key} (age: ${Date.now() - cacheItem.timestamp}ms, hits: ${cacheItem.hits})`);\n    return data;\n  }\n\n  // Delete specific cache item\n  delete(key) {\n    const deleted = this.memoryCache.delete(key);\n    \n    try {\n      localStorage.removeItem(this.storagePrefix + key);\n    } catch (error) {\n      console.warn('Cache deletion error:', error);\n    }\n    \n    if (deleted) {\n      this.stats.deletes++;\n    }\n    \n    return deleted;\n  }\n\n  // Clear cache with optional pattern matching\n  clear(pattern = null) {\n    if (!pattern) {\n      // Clear everything\n      this.memoryCache.clear();\n      this.clearStorage();\n      this.resetStats();\n      console.log('🧹 Cache cleared completely');\n      return;\n    }\n    \n    // Clear items matching pattern\n    const keysToDelete = [];\n    \n    this.memoryCache.forEach((item, key) => {\n      if (item.url && item.url.includes(pattern)) {\n        keysToDelete.push(key);\n      }\n    });\n    \n    keysToDelete.forEach(key => this.delete(key));\n    \n    console.log(`🧹 Cache cleared for pattern: ${pattern} (${keysToDelete.length} items)`);\n  }\n\n  // Cache warming for critical data\n  async warmCache() {\n    console.log('🔥 Warming cache with critical data...');\n    \n    const criticalEndpoints = [\n      { url: '/system/status', priority: 'high' },\n      { url: '/voting/active', priority: 'high' },\n      { url: '/leaderboard/global', priority: 'medium' }\n    ];\n    \n    for (const endpoint of criticalEndpoints) {\n      try {\n        if (window.MLGApiClient) {\n          // This will cache the response automatically\n          await window.MLGApiClient.get(endpoint.url, { cache: true });\n        }\n      } catch (error) {\n        console.warn(`Cache warming failed for ${endpoint.url}:`, error);\n      }\n    }\n  }\n\n  // Intelligent cache refresh\n  async refresh(key, fetcher) {\n    if (!fetcher || typeof fetcher !== 'function') {\n      console.error('Cache refresh requires a fetcher function');\n      return null;\n    }\n    \n    try {\n      console.log(`🔄 Refreshing cache for ${key}`);\n      const newData = await fetcher();\n      \n      if (newData) {\n        this.set(key, newData);\n        return newData;\n      }\n    } catch (error) {\n      console.error(`Cache refresh failed for ${key}:`, error);\n      \n      // Return stale data if available\n      const stale = this.getStale(key);\n      if (stale) {\n        console.log(`📰 Returning stale data for ${key}`);\n        return stale;\n      }\n    }\n    \n    return null;\n  }\n\n  // Get stale data (ignores TTL)\n  getStale(key) {\n    const cacheItem = this.memoryCache.get(key);\n    if (!cacheItem) return null;\n    \n    return cacheItem.compressed ? this.decompress(cacheItem.data) : cacheItem.data;\n  }\n\n  // Compression utilities\n  compress(data) {\n    try {\n      // Simple compression using JSON + gzip-like approach\n      const jsonStr = JSON.stringify(data);\n      return btoa(unescape(encodeURIComponent(jsonStr)));\n    } catch (error) {\n      console.warn('Compression failed:', error);\n      return data;\n    }\n  }\n\n  decompress(compressedData) {\n    try {\n      const jsonStr = decodeURIComponent(escape(atob(compressedData)));\n      return JSON.parse(jsonStr);\n    } catch (error) {\n      console.error('Decompression failed:', error);\n      throw error;\n    }\n  }\n\n  // Size calculation\n  calculateSize(data) {\n    return new Blob([JSON.stringify(data)]).size;\n  }\n\n  // Least Recently Used eviction\n  evictLRU() {\n    let oldestKey = null;\n    let oldestTime = Date.now();\n    \n    this.memoryCache.forEach((item, key) => {\n      const accessTime = item.lastAccessed || item.timestamp;\n      if (accessTime < oldestTime) {\n        oldestTime = accessTime;\n        oldestKey = key;\n      }\n    });\n    \n    if (oldestKey) {\n      this.delete(oldestKey);\n      this.stats.evictions++;\n      console.log(`🗑️ Evicted LRU cache item: ${oldestKey}`);\n    }\n  }\n\n  // Cleanup expired items\n  cleanup() {\n    const now = Date.now();\n    const expiredKeys = [];\n    \n    this.memoryCache.forEach((item, key) => {\n      if (now - item.timestamp > item.ttl) {\n        expiredKeys.push(key);\n      }\n    });\n    \n    expiredKeys.forEach(key => this.delete(key));\n    \n    if (expiredKeys.length > 0) {\n      console.log(`🧹 Cleaned up ${expiredKeys.length} expired cache items`);\n    }\n  }\n\n  // Cleanup storage\n  cleanupStorage() {\n    const keysToRemove = [];\n    \n    for (let i = 0; i < localStorage.length; i++) {\n      const key = localStorage.key(i);\n      if (key && key.startsWith(this.storagePrefix)) {\n        try {\n          const item = JSON.parse(localStorage.getItem(key));\n          if (Date.now() - item.timestamp > item.ttl) {\n            keysToRemove.push(key);\n          }\n        } catch (error) {\n          // Invalid item, remove it\n          keysToRemove.push(key);\n        }\n      }\n    }\n    \n    keysToRemove.forEach(key => localStorage.removeItem(key));\n    \n    if (keysToRemove.length > 0) {\n      console.log(`🧹 Cleaned up ${keysToRemove.length} expired storage items`);\n    }\n  }\n\n  clearStorage() {\n    const keysToRemove = [];\n    \n    for (let i = 0; i < localStorage.length; i++) {\n      const key = localStorage.key(i);\n      if (key && key.startsWith(this.storagePrefix)) {\n        keysToRemove.push(key);\n      }\n    }\n    \n    keysToRemove.forEach(key => localStorage.removeItem(key));\n  }\n\n  // Setup periodic cleanup\n  setupPeriodicCleanup() {\n    // Clean up every 5 minutes\n    setInterval(() => {\n      this.cleanup();\n      this.cleanupStorage();\n    }, 5 * 60 * 1000);\n  }\n\n  // Setup storage synchronization for multi-tab\n  setupStorageSync() {\n    window.addEventListener('storage', (e) => {\n      if (e.key && e.key.startsWith(this.storagePrefix)) {\n        const cacheKey = e.key.replace(this.storagePrefix, '');\n        \n        if (e.newValue) {\n          // Item was added/updated in another tab\n          try {\n            const item = JSON.parse(e.newValue);\n            this.memoryCache.set(cacheKey, item);\n          } catch (error) {\n            console.warn('Storage sync error:', error);\n          }\n        } else {\n          // Item was removed in another tab\n          this.memoryCache.delete(cacheKey);\n        }\n      }\n    });\n  }\n\n  // Cache statistics and analytics\n  getStats() {\n    const hitRate = this.stats.hits + this.stats.misses > 0 \n      ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)\n      : 0;\n      \n    return {\n      ...this.stats,\n      hitRate: parseFloat(hitRate),\n      memoryItems: this.memoryCache.size,\n      totalSizeMB: (this.stats.totalSize / 1024 / 1024).toFixed(2)\n    };\n  }\n\n  resetStats() {\n    this.stats = {\n      hits: 0,\n      misses: 0,\n      sets: 0,\n      deletes: 0,\n      evictions: 0,\n      compressions: 0,\n      totalSize: 0\n    };\n  }\n\n  // Performance monitoring\n  getPerformanceReport() {\n    const stats = this.getStats();\n    const recommendations = [];\n    \n    if (stats.hitRate < 60) {\n      recommendations.push('Consider increasing cache TTL for frequently accessed endpoints');\n    }\n    \n    if (stats.evictions > stats.sets * 0.1) {\n      recommendations.push('Consider increasing memory cache size');\n    }\n    \n    if (stats.compressions > 0) {\n      recommendations.push(`${stats.compressions} items were compressed, saving storage space`);\n    }\n    \n    return {\n      stats,\n      recommendations,\n      efficiency: stats.hitRate >= 70 ? 'excellent' : stats.hitRate >= 50 ? 'good' : 'poor'\n    };\n  }\n\n  // Preload critical data\n  async preload(urls) {\n    console.log(`🚀 Preloading ${urls.length} critical endpoints...`);\n    \n    const promises = urls.map(async (url) => {\n      try {\n        if (window.MLGApiClient) {\n          await window.MLGApiClient.get(url, { cache: true });\n        }\n      } catch (error) {\n        console.warn(`Preload failed for ${url}:`, error);\n      }\n    });\n    \n    await Promise.allSettled(promises);\n    console.log('✅ Preload completed');\n  }\n\n  // Export cache for debugging\n  export() {\n    const exported = {\n      memory: {},\n      storage: {},\n      stats: this.getStats()\n    };\n    \n    // Export memory cache\n    this.memoryCache.forEach((item, key) => {\n      exported.memory[key] = {\n        url: item.url,\n        timestamp: item.timestamp,\n        ttl: item.ttl,\n        priority: item.priority,\n        size: item.size,\n        hits: item.hits,\n        compressed: item.compressed\n      };\n    });\n    \n    // Export storage cache\n    for (let i = 0; i < localStorage.length; i++) {\n      const key = localStorage.key(i);\n      if (key && key.startsWith(this.storagePrefix)) {\n        const cacheKey = key.replace(this.storagePrefix, '');\n        try {\n          const item = JSON.parse(localStorage.getItem(key));\n          exported.storage[cacheKey] = {\n            url: item.url,\n            timestamp: item.timestamp,\n            ttl: item.ttl,\n            priority: item.priority,\n            size: item.size\n          };\n        } catch (error) {\n          console.warn(`Export failed for ${key}:`, error);\n        }\n      }\n    }\n    \n    return exported;\n  }\n\n  // Destroy cache manager\n  destroy() {\n    this.memoryCache.clear();\n    this.clearStorage();\n    this.resetStats();\n    console.log('🧹 Cache manager destroyed');\n  }\n}\n\n// Create global instance\nwindow.MLGCacheManager = new MLGCacheManager();\n\n// Export for ES6 modules\nexport default MLGCacheManager;\nexport { MLGCacheManager };