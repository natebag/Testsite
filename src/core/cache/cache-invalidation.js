/**
 * Cache Invalidation and Purging Mechanisms
 * Implements intelligent cache invalidation strategies to ensure
 * data freshness and optimal cache management
 */

/**
 * Invalidation strategies and their configurations
 */
export const INVALIDATION_STRATEGIES = {
  // Time-based invalidation
  TTL: {
    name: 'Time To Live',
    type: 'time-based',
    automatic: true,
    granular: false
  },
  
  // Event-driven invalidation
  EVENT_DRIVEN: {
    name: 'Event Driven',
    type: 'event-based',
    automatic: true,
    granular: true
  },
  
  // Version-based invalidation
  VERSION_BASED: {
    name: 'Version Based',
    type: 'version-based',
    automatic: true,
    granular: true
  },
  
  // Manual invalidation
  MANUAL: {
    name: 'Manual',
    type: 'manual',
    automatic: false,
    granular: true
  },
  
  // Dependency-based invalidation
  DEPENDENCY: {
    name: 'Dependency Based',
    type: 'dependency-based',
    automatic: true,
    granular: true
  }
};

/**
 * Cache invalidation events and their associated cache keys
 */
export const INVALIDATION_EVENTS = {
  // User-related events
  USER_LOGIN: {
    patterns: [/user:.*/, /profile:.*/, /auth:.*/],
    propagate: ['session', 'preferences']
  },
  
  USER_LOGOUT: {
    patterns: [/user:.*/, /profile:.*/, /auth:.*/, /session:.*/],
    propagate: ['all-user-data']
  },
  
  USER_PROFILE_UPDATE: {
    patterns: [/user:profile:.*/, /user:settings:.*/],
    propagate: ['user-ui', 'navigation']
  },
  
  // Gaming-related events
  WALLET_CONNECT: {
    patterns: [/wallet:.*/, /balance:.*/, /transaction:.*/],
    propagate: ['user-state', 'gaming-ui']
  },
  
  TOKEN_BALANCE_UPDATE: {
    patterns: [/balance:.*/, /token:.*/, /wallet:balance:.*/],
    propagate: ['ui-components', 'dashboards']
  },
  
  CLAN_JOIN: {
    patterns: [/clan:members:.*/, /user:clans:.*/, /leaderboard:.*/],
    propagate: ['clan-ui', 'user-profile']
  },
  
  CLAN_LEAVE: {
    patterns: [/clan:members:.*/, /user:clans:.*/, /leaderboard:.*/],
    propagate: ['clan-ui', 'user-profile']
  },
  
  VOTING_COMPLETE: {
    patterns: [/vote:.*/, /proposal:.*/, /dao:.*/],
    propagate: ['voting-ui', 'dao-stats']
  },
  
  // Content events
  CONTENT_PUBLISH: {
    patterns: [/content:.*/, /feed:.*/, /recommendations:.*/],
    propagate: ['content-lists', 'user-feeds']
  },
  
  CONTENT_DELETE: {
    patterns: [/content:.*/, /feed:.*/, /cache:content:.*/],
    propagate: ['content-lists', 'user-feeds']
  },
  
  // System events
  DEPLOYMENT: {
    patterns: [/static:.*/, /assets:.*/, /version:.*/],
    propagate: ['all-assets', 'service-worker']
  },
  
  MAINTENANCE_MODE: {
    patterns: [/.*/], // All cache entries
    propagate: ['complete-cache']
  }
};

/**
 * Cache Invalidation Manager
 * Handles intelligent cache invalidation and purging
 */
export class CacheInvalidationManager {
  constructor(options = {}) {
    this.options = {
      enableEventDriven: true,
      enableTimeBasedTTL: true,
      enableVersionInvalidation: true,
      enableDependencyTracking: true,
      maxInvalidationBatch: 100,
      invalidationDelay: 50, // ms between invalidations
      retryAttempts: 3,
      retryDelay: 1000,
      enableLogging: true,
      enableMetrics: true,
      ...options
    };
    
    this.cacheStores = new Map(); // Different cache store instances
    this.dependencyGraph = new Map(); // Cache key dependencies
    this.eventListeners = new Map(); // Event-based invalidation listeners
    this.invalidationQueue = [];
    this.isProcessing = false;
    this.metrics = {
      invalidations: 0,
      purges: 0,
      errors: 0,
      averageTime: 0
    };
    
    this.init();
  }

  /**
   * Initialize cache invalidation system
   */
  init() {
    try {
      // Register cache stores
      this.registerCacheStores();
      
      // Set up event-driven invalidation
      if (this.options.enableEventDriven) {
        this.setupEventInvalidation();
      }
      
      // Set up TTL-based cleanup
      if (this.options.enableTimeBasedTTL) {
        this.setupTTLCleanup();
      }
      
      // Set up version-based invalidation
      if (this.options.enableVersionInvalidation) {
        this.setupVersionInvalidation();
      }
      
      console.log('[CacheInvalidation] Invalidation system initialized');
    } catch (error) {
      console.error('[CacheInvalidation] Initialization failed:', error);
    }
  }

  /**
   * Register different cache store instances
   */
  registerCacheStores() {
    // Browser storage APIs
    if (typeof window !== 'undefined') {
      this.cacheStores.set('localStorage', {
        get: (key) => {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : null;
        },
        delete: (key) => localStorage.removeItem(key),
        keys: () => Object.keys(localStorage),
        clear: () => localStorage.clear()
      });
      
      this.cacheStores.set('sessionStorage', {
        get: (key) => {
          const item = sessionStorage.getItem(key);
          return item ? JSON.parse(item) : null;
        },
        delete: (key) => sessionStorage.removeItem(key),
        keys: () => Object.keys(sessionStorage),
        clear: () => sessionStorage.clear()
      });
    }
    
    // Service Worker Cache API
    if ('caches' in window) {
      this.cacheStores.set('cacheAPI', {
        get: async (key) => {
          const cacheNames = await caches.keys();
          for (const name of cacheNames) {
            const cache = await caches.open(name);
            const response = await cache.match(key);
            if (response) return response;
          }
          return null;
        },
        delete: async (key) => {
          const cacheNames = await caches.keys();
          let deleted = false;
          for (const name of cacheNames) {
            const cache = await caches.open(name);
            if (await cache.delete(key)) {
              deleted = true;
            }
          }
          return deleted;
        },
        keys: async () => {
          const cacheNames = await caches.keys();
          const allKeys = [];
          for (const name of cacheNames) {
            const cache = await caches.open(name);
            const requests = await cache.keys();
            allKeys.push(...requests.map(req => req.url));
          }
          return allKeys;
        },
        clear: async () => {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
      });
    }
    
    // IndexedDB (placeholder for complex implementation)
    this.cacheStores.set('indexedDB', {
      get: async (key) => {
        // Would implement IndexedDB operations
        return null;
      },
      delete: async (key) => {
        // Would implement IndexedDB deletion
        return true;
      },
      keys: async () => {
        // Would implement IndexedDB key enumeration
        return [];
      },
      clear: async () => {
        // Would implement IndexedDB clearing
      }
    });
  }

  /**
   * Set up event-driven invalidation
   */
  setupEventInvalidation() {
    // Create event bus for cache invalidation
    this.eventBus = new EventTarget();
    
    // Set up listeners for each invalidation event
    for (const [eventName, config] of Object.entries(INVALIDATION_EVENTS)) {
      this.addEventListener(eventName, (detail) => {
        this.handleEventInvalidation(eventName, config, detail);
      });
    }
    
    // Listen for global events
    if (typeof window !== 'undefined') {
      // Storage events from other tabs
      window.addEventListener('storage', (event) => {
        if (event.key && event.key.includes('invalidate:')) {
          const invalidationData = JSON.parse(event.newValue || '{}');
          this.processInvalidation(invalidationData);
        }
      });
      
      // Custom application events
      window.addEventListener('mlg:cache:invalidate', (event) => {
        this.processInvalidation(event.detail);
      });
    }
  }

  /**
   * Set up TTL-based cleanup
   */
  setupTTLCleanup() {
    // Run cleanup every 5 minutes
    setInterval(() => {
      this.performTTLCleanup();
    }, 300000);
    
    // Initial cleanup after 30 seconds
    setTimeout(() => {
      this.performTTLCleanup();
    }, 30000);
  }

  /**
   * Set up version-based invalidation
   */
  setupVersionInvalidation() {
    // Check for version changes
    this.currentVersion = this.getCurrentVersion();
    
    // Listen for version updates
    if (typeof window !== 'undefined') {
      window.addEventListener('mlg:version:update', (event) => {
        const newVersion = event.detail.version;
        this.handleVersionChange(this.currentVersion, newVersion);
        this.currentVersion = newVersion;
      });
    }
  }

  /**
   * Add event listener for cache invalidation
   */
  addEventListener(eventName, handler) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName).push(handler);
  }

  /**
   * Emit cache invalidation event
   */
  emit(eventName, detail = {}) {
    const handlers = this.eventListeners.get(eventName);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(detail);
        } catch (error) {
          console.error(`[CacheInvalidation] Event handler error for ${eventName}:`, error);
        }
      });
    }
    
    // Also emit to event bus
    if (this.eventBus) {
      this.eventBus.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
  }

  /**
   * Handle event-driven invalidation
   */
  async handleEventInvalidation(eventName, config, detail) {
    const startTime = Date.now();
    
    try {
      this.log(`Handling invalidation event: ${eventName}`);
      
      // Find matching cache keys
      const keysToInvalidate = await this.findMatchingKeys(config.patterns);
      
      // Add to invalidation queue
      for (const key of keysToInvalidate) {
        this.queueInvalidation({
          key,
          reason: `event:${eventName}`,
          timestamp: Date.now(),
          metadata: detail
        });
      }
      
      // Handle propagation
      if (config.propagate) {
        for (const propagationType of config.propagate) {
          await this.handlePropagation(propagationType, detail);
        }
      }
      
      // Process invalidation queue
      this.processInvalidationQueue();
      
      this.metrics.invalidations++;
      const duration = Date.now() - startTime;
      this.updateMetrics('invalidation', duration);
      
    } catch (error) {
      this.metrics.errors++;
      console.error(`[CacheInvalidation] Failed to handle event ${eventName}:`, error);
    }
  }

  /**
   * Find cache keys matching patterns
   */
  async findMatchingKeys(patterns) {
    const matchingKeys = new Set();
    
    for (const [storeName, store] of this.cacheStores) {
      try {
        const keys = await store.keys();
        
        for (const key of keys) {
          for (const pattern of patterns) {
            if (pattern.test && pattern.test(key)) {
              matchingKeys.add({ store: storeName, key });
            } else if (typeof pattern === 'string' && key.includes(pattern)) {
              matchingKeys.add({ store: storeName, key });
            }
          }
        }
      } catch (error) {
        console.warn(`[CacheInvalidation] Failed to get keys from ${storeName}:`, error);
      }
    }
    
    return Array.from(matchingKeys);
  }

  /**
   * Handle invalidation propagation
   */
  async handlePropagation(propagationType, detail) {
    switch (propagationType) {
      case 'all-user-data':
        await this.invalidateByPattern(/user:.*|profile:.*|session:.*/);
        break;
      
      case 'user-ui':
        await this.invalidateByPattern(/ui:user.*|component:profile.*/);
        break;
      
      case 'clan-ui':
        await this.invalidateByPattern(/ui:clan.*|component:clan.*/);
        break;
      
      case 'voting-ui':
        await this.invalidateByPattern(/ui:voting.*|component:vote.*/);
        break;
      
      case 'all-assets':
        await this.invalidateStaticAssets();
        break;
      
      case 'service-worker':
        await this.invalidateServiceWorker();
        break;
      
      case 'complete-cache':
        await this.purgeAllCaches();
        break;
      
      default:
        this.log(`Unknown propagation type: ${propagationType}`);
    }
  }

  /**
   * Queue invalidation for processing
   */
  queueInvalidation(invalidation) {
    this.invalidationQueue.push(invalidation);
    
    // Limit queue size
    if (this.invalidationQueue.length > 1000) {
      this.invalidationQueue = this.invalidationQueue.slice(-1000);
    }
  }

  /**
   * Process invalidation queue
   */
  async processInvalidationQueue() {
    if (this.isProcessing || this.invalidationQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      // Process in batches
      while (this.invalidationQueue.length > 0) {
        const batch = this.invalidationQueue.splice(0, this.options.maxInvalidationBatch);
        
        await Promise.all(
          batch.map(invalidation => this.executeInvalidation(invalidation))
        );
        
        // Small delay between batches
        if (this.invalidationQueue.length > 0 && this.options.invalidationDelay > 0) {
          await this.delay(this.options.invalidationDelay);
        }
      }
    } catch (error) {
      console.error('[CacheInvalidation] Failed to process invalidation queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute individual cache invalidation
   */
  async executeInvalidation(invalidation) {
    const { store, key } = invalidation.key;
    const cacheStore = this.cacheStores.get(store);
    
    if (!cacheStore) {
      console.warn(`[CacheInvalidation] Unknown cache store: ${store}`);
      return;
    }
    
    let attempts = 0;
    
    while (attempts < this.options.retryAttempts) {
      try {
        await cacheStore.delete(key);
        
        this.log(`Invalidated cache key: ${key} from ${store}`);
        
        // Handle dependencies
        if (this.options.enableDependencyTracking) {
          await this.invalidateDependencies(key);
        }
        
        return;
      } catch (error) {
        attempts++;
        
        if (attempts >= this.options.retryAttempts) {
          console.error(`[CacheInvalidation] Failed to invalidate ${key} after ${attempts} attempts:`, error);
          this.metrics.errors++;
        } else {
          await this.delay(this.options.retryDelay);
        }
      }
    }
  }

  /**
   * Invalidate cache keys by pattern
   */
  async invalidateByPattern(pattern) {
    const matchingKeys = await this.findMatchingKeys([pattern]);
    
    for (const key of matchingKeys) {
      this.queueInvalidation({
        key,
        reason: 'pattern-match',
        timestamp: Date.now()
      });
    }
    
    this.processInvalidationQueue();
  }

  /**
   * Perform TTL-based cleanup
   */
  async performTTLCleanup() {
    this.log('Starting TTL cleanup');
    
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [storeName, store] of this.cacheStores) {
      try {
        const keys = await store.keys();
        
        for (const key of keys) {
          const item = await store.get(key);
          
          if (item && item.timestamp && item.ttl) {
            if (now - item.timestamp > item.ttl) {
              await store.delete(key);
              cleanedCount++;
              this.log(`TTL expired: ${key} from ${storeName}`);
            }
          }
        }
      } catch (error) {
        console.warn(`[CacheInvalidation] TTL cleanup failed for ${storeName}:`, error);
      }
    }
    
    this.log(`TTL cleanup completed: ${cleanedCount} items removed`);
  }

  /**
   * Handle version change invalidation
   */
  async handleVersionChange(oldVersion, newVersion) {
    this.log(`Version change detected: ${oldVersion} -> ${newVersion}`);
    
    // Invalidate version-dependent caches
    await this.invalidateByPattern(/static:.*|assets:.*|build:.*/);
    
    // Force service worker update
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
        
        // Send message to service worker about version change
        if (registration.active) {
          registration.active.postMessage({
            type: 'VERSION_UPDATE',
            oldVersion,
            newVersion
          });
        }
      } catch (error) {
        console.warn('[CacheInvalidation] Failed to update service worker:', error);
      }
    }
    
    this.emit('VERSION_INVALIDATION', { oldVersion, newVersion });
  }

  /**
   * Invalidate static assets
   */
  async invalidateStaticAssets() {
    // Clear Cache API
    if (this.cacheStores.has('cacheAPI')) {
      const cacheStore = this.cacheStores.get('cacheAPI');
      
      try {
        const keys = await cacheStore.keys();
        const staticAssets = keys.filter(key => 
          key.includes('.js') || 
          key.includes('.css') || 
          key.includes('.png') || 
          key.includes('.jpg') || 
          key.includes('.svg')
        );
        
        for (const key of staticAssets) {
          await cacheStore.delete(key);
        }
        
        this.log(`Invalidated ${staticAssets.length} static assets`);
      } catch (error) {
        console.error('[CacheInvalidation] Failed to invalidate static assets:', error);
      }
    }
  }

  /**
   * Invalidate service worker
   */
  async invalidateServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        
        for (const registration of registrations) {
          await registration.unregister();
        }
        
        // Reload to get new service worker
        window.location.reload();
      } catch (error) {
        console.error('[CacheInvalidation] Failed to invalidate service worker:', error);
      }
    }
  }

  /**
   * Purge all caches
   */
  async purgeAllCaches() {
    this.log('Purging all caches');
    
    let purgedCount = 0;
    
    for (const [storeName, store] of this.cacheStores) {
      try {
        const keys = await store.keys();
        purgedCount += keys.length;
        await store.clear();
        this.log(`Purged ${storeName}: ${keys.length} items`);
      } catch (error) {
        console.error(`[CacheInvalidation] Failed to purge ${storeName}:`, error);
      }
    }
    
    this.metrics.purges++;
    this.log(`Total items purged: ${purgedCount}`);
    
    this.emit('CACHE_PURGED', { count: purgedCount });
  }

  /**
   * Register cache dependency
   */
  registerDependency(parentKey, dependentKey) {
    if (!this.dependencyGraph.has(parentKey)) {
      this.dependencyGraph.set(parentKey, new Set());
    }
    
    this.dependencyGraph.get(parentKey).add(dependentKey);
  }

  /**
   * Invalidate cache dependencies
   */
  async invalidateDependencies(key) {
    const dependencies = this.dependencyGraph.get(key);
    
    if (dependencies) {
      for (const dependentKey of dependencies) {
        this.queueInvalidation({
          key: dependentKey,
          reason: `dependency:${key}`,
          timestamp: Date.now()
        });
      }
    }
  }

  /**
   * Get current application version
   */
  getCurrentVersion() {
    // Try to get version from various sources
    if (typeof window !== 'undefined') {
      return window.__APP_VERSION__ || 
             document.querySelector('meta[name="version"]')?.content ||
             localStorage.getItem('app-version') ||
             '1.0.0';
    }
    return '1.0.0';
  }

  /**
   * Process manual invalidation
   */
  async invalidate(keys, reason = 'manual') {
    if (typeof keys === 'string') {
      keys = [keys];
    }
    
    for (const key of keys) {
      // If key is a pattern, find matching keys
      if (key instanceof RegExp || key.includes('*')) {
        await this.invalidateByPattern(key);
      } else {
        // Find the key in all stores
        const matchingKeys = await this.findKeysInStores(key);
        
        for (const matchingKey of matchingKeys) {
          this.queueInvalidation({
            key: matchingKey,
            reason,
            timestamp: Date.now()
          });
        }
      }
    }
    
    this.processInvalidationQueue();
  }

  /**
   * Find key in all cache stores
   */
  async findKeysInStores(searchKey) {
    const foundKeys = [];
    
    for (const [storeName, store] of this.cacheStores) {
      try {
        const keys = await store.keys();
        
        for (const key of keys) {
          if (key === searchKey || key.includes(searchKey)) {
            foundKeys.push({ store: storeName, key });
          }
        }
      } catch (error) {
        console.warn(`[CacheInvalidation] Failed to search in ${storeName}:`, error);
      }
    }
    
    return foundKeys;
  }

  /**
   * Update performance metrics
   */
  updateMetrics(operation, duration) {
    if (operation === 'invalidation') {
      this.metrics.averageTime = (this.metrics.averageTime + duration) / 2;
    }
  }

  /**
   * Get invalidation metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      queueSize: this.invalidationQueue.length,
      isProcessing: this.isProcessing,
      storeCount: this.cacheStores.size,
      dependencyCount: this.dependencyGraph.size
    };
  }

  /**
   * Log function
   */
  log(message) {
    if (this.options.enableLogging) {
      console.log(`[CacheInvalidation] ${message}`);
    }
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.eventListeners.clear();
    this.dependencyGraph.clear();
    this.invalidationQueue = [];
    this.isProcessing = false;
    
    this.log('Cache invalidation system destroyed');
  }
}

/**
 * Global cache invalidation instance
 */
let globalInvalidationManager = null;

/**
 * Factory function to create or get global invalidation manager
 */
export function getInvalidationManager(options) {
  if (!globalInvalidationManager) {
    globalInvalidationManager = new CacheInvalidationManager(options);
  }
  return globalInvalidationManager;
}

/**
 * Convenience function for manual cache invalidation
 */
export async function invalidateCache(keys, reason = 'manual') {
  const manager = getInvalidationManager();
  await manager.invalidate(keys, reason);
}

/**
 * Convenience function for cache purging
 */
export async function purgeCache(type = 'all') {
  const manager = getInvalidationManager();
  
  switch (type) {
    case 'all':
      await manager.purgeAllCaches();
      break;
    case 'static':
      await manager.invalidateStaticAssets();
      break;
    case 'user':
      await manager.invalidateByPattern(/user:.*|profile:.*/);
      break;
    default:
      await manager.invalidateByPattern(new RegExp(type));
  }
}

/**
 * Emit cache invalidation event
 */
export function emitCacheEvent(eventName, detail) {
  const manager = getInvalidationManager();
  manager.emit(eventName, detail);
}

export default CacheInvalidationManager;