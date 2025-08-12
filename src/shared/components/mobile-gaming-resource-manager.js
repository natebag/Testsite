/**
 * MLG.clan Mobile Gaming Resource Manager
 * 
 * Advanced resource management system optimized for mobile gaming scenarios:
 * - Intelligent gaming asset caching with context awareness
 * - Smart lazy loading with gaming content prioritization
 * - API request batching and optimization for gaming endpoints
 * - Memory-efficient resource pooling and cleanup
 * - Network-aware resource delivery optimization
 * - Gaming session-specific cache strategies
 * 
 * Resource Categories:
 * 🏆 Tournament Assets: Leaderboards, brackets, live data
 * 🎮 Clan Resources: Member data, clan stats, activity feeds
 * 🗳️ Voting Content: Content queue, thumbnails, metadata
 * 👤 Profile Data: User info, achievements, statistics
 * 🌐 Social Media: Feed content, clips, interactions
 * 
 * @author Claude Code - Security and Performance Auditor
 * @version 1.0.0
 */

/**
 * Gaming Resource Management Configuration
 */
const GAMING_RESOURCE_CONFIG = {
  // Cache Strategies by Gaming Context
  cacheStrategies: {
    tournament: {
      strategy: 'realtime-cache',
      maxAge: 30000,        // 30 seconds
      maxSize: 50 * 1024 * 1024, // 50MB
      compression: 'minimal',
      priority: 'critical',
      networkFirst: true,
      staleWhileRevalidate: false,
      backgroundSync: true
    },
    
    clan: {
      strategy: 'social-cache',
      maxAge: 300000,       // 5 minutes
      maxSize: 30 * 1024 * 1024, // 30MB
      compression: 'balanced',
      priority: 'high',
      networkFirst: false,
      staleWhileRevalidate: true,
      backgroundSync: true
    },
    
    voting: {
      strategy: 'content-cache',
      maxAge: 120000,       // 2 minutes
      maxSize: 40 * 1024 * 1024, // 40MB
      compression: 'optimized',
      priority: 'high',
      networkFirst: true,
      staleWhileRevalidate: true,
      backgroundSync: false
    },
    
    profile: {
      strategy: 'persistent-cache',
      maxAge: 1800000,      // 30 minutes
      maxSize: 15 * 1024 * 1024, // 15MB
      compression: 'maximum',
      priority: 'low',
      networkFirst: false,
      staleWhileRevalidate: true,
      backgroundSync: false
    },
    
    social: {
      strategy: 'media-cache',
      maxAge: 600000,       // 10 minutes
      maxSize: 60 * 1024 * 1024, // 60MB
      compression: 'adaptive',
      priority: 'medium',
      networkFirst: false,
      staleWhileRevalidate: true,
      backgroundSync: true
    }
  },

  // Resource Types and Priorities
  resourceTypes: {
    'tournament-data': {
      priority: 100,
      cacheGroup: 'critical',
      maxAge: 30000,
      preload: true,
      compression: false,
      batch: false
    },
    'leaderboard': {
      priority: 95,
      cacheGroup: 'critical',
      maxAge: 30000,
      preload: true,
      compression: false,
      batch: true
    },
    'clan-data': {
      priority: 85,
      cacheGroup: 'social',
      maxAge: 300000,
      preload: true,
      compression: true,
      batch: true
    },
    'user-avatar': {
      priority: 80,
      cacheGroup: 'media',
      maxAge: 3600000,
      preload: false,
      compression: true,
      batch: false
    },
    'gaming-clip': {
      priority: 70,
      cacheGroup: 'media',
      maxAge: 1800000,
      preload: false,
      compression: true,
      batch: false
    },
    'content-thumbnail': {
      priority: 75,
      cacheGroup: 'content',
      maxAge: 600000,
      preload: true,
      compression: true,
      batch: true
    },
    'achievement-badge': {
      priority: 60,
      cacheGroup: 'static',
      maxAge: 86400000,
      preload: false,
      compression: true,
      batch: true
    },
    'notification': {
      priority: 90,
      cacheGroup: 'realtime',
      maxAge: 60000,
      preload: false,
      compression: false,
      batch: true
    }
  },

  // Lazy Loading Configuration
  lazyLoading: {
    tournament: {
      threshold: '50px',
      preloadCount: 10,
      priority: 'high',
      intersectionRatio: 0.1,
      loadTimeout: 3000
    },
    clan: {
      threshold: '100px',
      preloadCount: 5,
      priority: 'medium',
      intersectionRatio: 0.2,
      loadTimeout: 5000
    },
    voting: {
      threshold: '75px',
      preloadCount: 8,
      priority: 'high',
      intersectionRatio: 0.1,
      loadTimeout: 4000
    },
    profile: {
      threshold: '200px',
      preloadCount: 3,
      priority: 'low',
      intersectionRatio: 0.3,
      loadTimeout: 8000
    },
    social: {
      threshold: '150px',
      preloadCount: 6,
      priority: 'medium',
      intersectionRatio: 0.2,
      loadTimeout: 6000
    }
  },

  // API Batching Configuration
  apiBatching: {
    tournament: {
      enabled: true,
      batchSize: 20,
      maxWaitTime: 100,    // 100ms
      endpoints: ['leaderboard', 'brackets', 'player-stats'],
      compression: 'gzip'
    },
    clan: {
      enabled: true,
      batchSize: 15,
      maxWaitTime: 200,    // 200ms
      endpoints: ['member-list', 'clan-stats', 'activities'],
      compression: 'gzip'
    },
    voting: {
      enabled: true,
      batchSize: 25,
      maxWaitTime: 150,    // 150ms
      endpoints: ['content-queue', 'voting-data', 'metadata'],
      compression: 'gzip'
    },
    profile: {
      enabled: true,
      batchSize: 10,
      maxWaitTime: 500,    // 500ms
      endpoints: ['user-data', 'achievements', 'statistics'],
      compression: 'gzip'
    },
    social: {
      enabled: true,
      batchSize: 12,
      maxWaitTime: 300,    // 300ms
      endpoints: ['feed', 'interactions', 'media-metadata'],
      compression: 'gzip'
    }
  },

  // Memory Management
  memoryManagement: {
    lowMemoryThreshold: 50 * 1024 * 1024,    // 50MB
    criticalMemoryThreshold: 80 * 1024 * 1024, // 80MB
    cleanupIntervalMs: 30000,                  // 30 seconds
    maxCacheSize: 200 * 1024 * 1024,          // 200MB total
    gcTriggerRatio: 0.8,                       // 80% of max size
    resourcePoolSize: 100,                     // Max pooled resources
    imageMemoryLimit: 20 * 1024 * 1024        // 20MB for images
  },

  // Network Optimization
  networkOptimization: {
    'slow-2g': {
      maxConcurrent: 1,
      timeout: 15000,
      retries: 1,
      compression: 'maximum',
      preload: false
    },
    '2g': {
      maxConcurrent: 2,
      timeout: 12000,
      retries: 2,
      compression: 'high',
      preload: false
    },
    '3g': {
      maxConcurrent: 4,
      timeout: 8000,
      retries: 2,
      compression: 'medium',
      preload: true
    },
    '4g': {
      maxConcurrent: 6,
      timeout: 5000,
      retries: 3,
      compression: 'low',
      preload: true
    },
    '5g': {
      maxConcurrent: 8,
      timeout: 3000,
      retries: 3,
      compression: 'minimal',
      preload: true
    }
  }
};

/**
 * Mobile Gaming Resource Manager Class
 */
export class MobileGamingResourceManager {
  constructor(options = {}) {
    this.options = {
      enableSmartCaching: true,
      enableLazyLoading: true,
      enableApiBatching: true,
      enableMemoryManagement: true,
      enableNetworkOptimization: true,
      enablePreloading: true,
      enableCompression: true,
      debugMode: false,
      ...options
    };

    // Current state
    this.state = {
      currentContext: 'general',
      networkType: '4g',
      memoryPressure: false,
      activeRequests: 0,
      cacheHitRate: 0,
      totalBandwidthSaved: 0
    };

    // Cache management
    this.cache = {
      data: new Map(),
      metadata: new Map(),
      size: 0,
      maxSize: GAMING_RESOURCE_CONFIG.memoryManagement.maxCacheSize,
      groups: new Map(),
      priorities: new Map()
    };

    // Resource pools
    this.resourcePools = {
      images: new Map(),
      data: new Map(),
      requests: new Map(),
      workers: []
    };

    // Lazy loading
    this.lazyLoading = {
      observers: new Map(),
      pending: new Set(),
      loaded: new Set(),
      queue: []
    };

    // API batching
    this.apiBatching = {
      batches: new Map(),
      timers: new Map(),
      pending: new Map(),
      endpoints: new Map()
    };

    // Performance tracking
    this.performance = {
      cacheHits: 0,
      cacheMisses: 0,
      networkRequests: 0,
      bytesTransferred: 0,
      bytesCached: 0,
      loadTimes: [],
      errorRates: new Map()
    };

    // Analytics
    this.analytics = {
      resourcesLoaded: 0,
      resourcesCached: 0,
      batchedRequests: 0,
      memoryCleanups: 0,
      bandwidthSaved: 0,
      averageLoadTime: 0,
      cacheEfficiency: 0
    };

    this.init();
  }

  /**
   * Initialize the gaming resource manager
   */
  async init() {
    console.log('📦 Initializing MLG Gaming Resource Manager...');

    try {
      // Initialize cache system
      await this.initializeCacheSystem();

      // Setup lazy loading
      if (this.options.enableLazyLoading) {
        this.initializeLazyLoading();
      }

      // Setup API batching
      if (this.options.enableApiBatching) {
        this.initializeApiBatching();
      }

      // Start memory management
      if (this.options.enableMemoryManagement) {
        this.startMemoryManagement();
      }

      // Setup network optimization
      if (this.options.enableNetworkOptimization) {
        this.initializeNetworkOptimization();
      }

      // Initialize resource pools
      this.initializeResourcePools();

      console.log('✅ Gaming Resource Manager initialized', {
        cacheSize: `${Math.round(this.cache.size / 1024 / 1024)}MB`,
        networkType: this.state.networkType,
        lazyLoadingEnabled: this.options.enableLazyLoading
      });

    } catch (error) {
      console.error('❌ Failed to initialize Resource Manager:', error);
    }
  }

  /**
   * Initialize intelligent cache system
   */
  async initializeCacheSystem() {
    // Initialize cache groups
    for (const [context, strategy] of Object.entries(GAMING_RESOURCE_CONFIG.cacheStrategies)) {
      this.cache.groups.set(context, {
        size: 0,
        maxSize: strategy.maxSize,
        items: new Map(),
        strategy: strategy.strategy,
        lastCleanup: Date.now()
      });
    }

    // Initialize service worker cache if available
    if ('serviceWorker' in navigator && 'caches' in window) {
      try {
        this.serviceWorkerCache = await caches.open('mlg-gaming-cache-v1');
        console.log('💾 Service Worker cache initialized');
      } catch (error) {
        console.warn('Service Worker cache not available:', error);
      }
    }

    // Setup cache event listeners
    this.setupCacheEventListeners();
  }

  /**
   * Initialize lazy loading system
   */
  initializeLazyLoading() {
    // Create intersection observers for different contexts
    for (const [context, config] of Object.entries(GAMING_RESOURCE_CONFIG.lazyLoading)) {
      const observer = new IntersectionObserver(
        (entries) => this.handleIntersection(entries, context),
        {
          rootMargin: config.threshold,
          threshold: config.intersectionRatio
        }
      );

      this.lazyLoading.observers.set(context, observer);
    }

    console.log('👁️ Lazy loading initialized for all contexts');
  }

  /**
   * Initialize API batching system
   */
  initializeApiBatching() {
    // Setup batch endpoints
    for (const [context, config] of Object.entries(GAMING_RESOURCE_CONFIG.apiBatching)) {
      if (config.enabled) {
        for (const endpoint of config.endpoints) {
          this.apiBatching.endpoints.set(endpoint, {
            context,
            config,
            pending: [],
            timer: null
          });
        }
      }
    }

    console.log('🔄 API batching initialized');
  }

  /**
   * Start memory management monitoring
   */
  startMemoryManagement() {
    const checkMemory = () => {
      this.checkMemoryUsage();
      this.cleanupUnusedResources();
    };

    setInterval(checkMemory, GAMING_RESOURCE_CONFIG.memoryManagement.cleanupIntervalMs);
    console.log('🧠 Memory management started');
  }

  /**
   * Initialize network optimization
   */
  initializeNetworkOptimization() {
    // Detect network type
    if ('connection' in navigator) {
      this.state.networkType = navigator.connection.effectiveType || '4g';
      
      navigator.connection.addEventListener('change', () => {
        this.state.networkType = navigator.connection.effectiveType || '4g';
        this.adaptToNetworkConditions();
      });
    }

    this.adaptToNetworkConditions();
    console.log(`📶 Network optimization initialized for ${this.state.networkType}`);
  }

  /**
   * Set gaming context for resource optimization
   */
  setGamingContext(context) {
    if (this.state.currentContext === context) return;

    console.log(`🎯 Switching resource context: ${this.state.currentContext} → ${context}`);
    
    const previousContext = this.state.currentContext;
    this.state.currentContext = context;

    // Apply context-specific optimizations
    this.applyContextResourceOptimizations(context);

    // Update cache strategies
    this.updateCacheStrategy(context);

    // Update lazy loading configuration
    this.updateLazyLoadingConfig(context);

    // Update API batching configuration
    this.updateApiBatchingConfig(context);

    this.dispatchEvent('resource-context-changed', {
      newContext: context,
      previousContext
    });
  }

  /**
   * Smart resource loading with context awareness
   */
  async loadResource(url, options = {}) {
    const {
      type = 'unknown',
      priority = 'normal',
      context = this.state.currentContext,
      useCache = true,
      timeout = 5000,
      retries = 2
    } = options;

    // Check cache first
    if (useCache) {
      const cached = await this.getCachedResource(url, context);
      if (cached) {
        this.performance.cacheHits++;
        this.updateCacheHitRate();
        return cached;
      }
    }

    // Track cache miss
    this.performance.cacheMisses++;
    this.updateCacheHitRate();

    // Load resource with optimization
    try {
      const startTime = performance.now();
      const resource = await this.fetchOptimizedResource(url, {
        type,
        priority,
        context,
        timeout,
        retries
      });

      const loadTime = performance.now() - startTime;
      this.recordLoadTime(loadTime);

      // Cache the resource
      if (useCache && resource) {
        await this.cacheResource(url, resource, type, context);
      }

      this.analytics.resourcesLoaded++;
      return resource;

    } catch (error) {
      this.recordError(url, error);
      throw error;
    }
  }

  /**
   * Fetch resource with network optimizations
   */
  async fetchOptimizedResource(url, options) {
    const { type, priority, context, timeout, retries } = options;
    const networkConfig = GAMING_RESOURCE_CONFIG.networkOptimization[this.state.networkType];

    // Check if we should batch this request
    if (this.shouldBatchRequest(url, type)) {
      return this.addToBatch(url, options);
    }

    // Apply network-specific optimizations
    const fetchOptions = {
      ...this.buildFetchOptions(networkConfig, options),
      signal: AbortSignal.timeout(timeout)
    };

    // Add compression headers if enabled
    if (networkConfig.compression !== 'minimal') {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Accept-Encoding': 'gzip, deflate, br'
      };
    }

    // Perform request with retries
    return this.fetchWithRetries(url, fetchOptions, retries);
  }

  /**
   * Check if request should be batched
   */
  shouldBatchRequest(url, type) {
    const resourceConfig = GAMING_RESOURCE_CONFIG.resourceTypes[type];
    return resourceConfig?.batch && this.options.enableApiBatching;
  }

  /**
   * Add request to batch
   */
  async addToBatch(url, options) {
    const endpoint = this.extractEndpoint(url);
    const batchConfig = this.apiBatching.endpoints.get(endpoint);

    if (!batchConfig) {
      // Fallback to regular request
      return this.fetchOptimizedResource(url, { ...options, batch: false });
    }

    return new Promise((resolve, reject) => {
      // Add to pending batch
      batchConfig.pending.push({
        url,
        options,
        resolve,
        reject,
        timestamp: Date.now()
      });

      // Set batch timer if not already set
      if (!batchConfig.timer) {
        batchConfig.timer = setTimeout(() => {
          this.processBatch(endpoint, batchConfig);
        }, batchConfig.config.maxWaitTime);
      }

      // Process batch immediately if size limit reached
      if (batchConfig.pending.length >= batchConfig.config.batchSize) {
        clearTimeout(batchConfig.timer);
        this.processBatch(endpoint, batchConfig);
      }
    });
  }

  /**
   * Process batch of API requests
   */
  async processBatch(endpoint, batchConfig) {
    if (batchConfig.pending.length === 0) return;

    console.log(`🔄 Processing batch for ${endpoint}: ${batchConfig.pending.length} requests`);

    const batch = batchConfig.pending.splice(0);
    batchConfig.timer = null;

    try {
      // Build batch request
      const batchRequest = this.buildBatchRequest(batch, batchConfig.config);
      
      // Execute batch request
      const batchResponse = await this.executeBatchRequest(batchRequest);
      
      // Distribute responses
      this.distributeBatchResponse(batch, batchResponse);
      
      this.analytics.batchedRequests += batch.length;

    } catch (error) {
      // Handle batch error - retry individually
      console.warn('Batch request failed, retrying individually:', error);
      this.retryBatchIndividually(batch);
    }
  }

  /**
   * Smart lazy loading with gaming priorities
   */
  observeForLazyLoading(element, options = {}) {
    const {
      type = 'image',
      priority = 'normal',
      context = this.state.currentContext,
      preload = false
    } = options;

    // Get appropriate observer for context
    const observer = this.lazyLoading.observers.get(context) || 
                    this.lazyLoading.observers.get('social'); // fallback

    if (!observer) {
      console.warn(`No lazy loading observer for context: ${context}`);
      return;
    }

    // Add metadata to element
    element.dataset.lazyType = type;
    element.dataset.lazyPriority = priority;
    element.dataset.lazyContext = context;

    // Start observing
    observer.observe(element);
    this.lazyLoading.pending.add(element);

    // Preload if high priority
    if (preload || priority === 'critical') {
      this.preloadElement(element);
    }
  }

  /**
   * Handle intersection for lazy loading
   */
  handleIntersection(entries, context) {
    const config = GAMING_RESOURCE_CONFIG.lazyLoading[context];

    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadLazyElement(entry.target, config);
      }
    });
  }

  /**
   * Load lazy element with context optimization
   */
  async loadLazyElement(element, config) {
    if (this.lazyLoading.loaded.has(element)) return;

    this.lazyLoading.pending.delete(element);
    this.lazyLoading.loaded.add(element);

    const src = element.dataset.src || element.dataset.lazySource;
    if (!src) return;

    try {
      // Apply timeout from config
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Lazy load timeout')), config.loadTimeout);
      });

      const loadPromise = this.loadResource(src, {
        type: element.dataset.lazyType,
        priority: element.dataset.lazyPriority,
        context: element.dataset.lazyContext
      });

      const resource = await Promise.race([loadPromise, timeoutPromise]);

      // Apply resource to element
      this.applyResourceToElement(element, resource);

      // Trigger load event
      element.dispatchEvent(new Event('lazyloaded'));

    } catch (error) {
      console.error('Lazy loading failed:', error);
      element.dispatchEvent(new Event('lazyerror'));
    }
  }

  /**
   * Cache resource with intelligent strategy
   */
  async cacheResource(url, resource, type, context) {
    const strategy = GAMING_RESOURCE_CONFIG.cacheStrategies[context];
    if (!strategy) return;

    const cacheGroup = this.cache.groups.get(context);
    if (!cacheGroup) return;

    // Check if we have space
    const resourceSize = this.calculateResourceSize(resource);
    if (cacheGroup.size + resourceSize > cacheGroup.maxSize) {
      await this.evictFromCache(context, resourceSize);
    }

    // Create cache entry
    const cacheEntry = {
      data: resource,
      metadata: {
        url,
        type,
        size: resourceSize,
        timestamp: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 0,
        priority: GAMING_RESOURCE_CONFIG.resourceTypes[type]?.priority || 50
      }
    };

    // Store in cache
    const cacheKey = this.generateCacheKey(url, type);
    this.cache.data.set(cacheKey, cacheEntry);
    cacheGroup.items.set(cacheKey, cacheEntry);
    
    // Update sizes
    cacheGroup.size += resourceSize;
    this.cache.size += resourceSize;

    // Store in service worker cache if available
    if (this.serviceWorkerCache && this.shouldPersistToServiceWorker(type)) {
      try {
        await this.serviceWorkerCache.put(url, new Response(resource));
      } catch (error) {
        console.warn('Failed to cache in service worker:', error);
      }
    }

    this.analytics.resourcesCached++;
  }

  /**
   * Get cached resource
   */
  async getCachedResource(url, context) {
    const cacheKey = this.generateCacheKey(url);
    const cacheEntry = this.cache.data.get(cacheKey);

    if (!cacheEntry) {
      // Try service worker cache
      if (this.serviceWorkerCache) {
        try {
          const response = await this.serviceWorkerCache.match(url);
          if (response) {
            return await response.blob();
          }
        } catch (error) {
          console.warn('Service worker cache access failed:', error);
        }
      }
      return null;
    }

    // Check if cache entry is still valid
    const strategy = GAMING_RESOURCE_CONFIG.cacheStrategies[context];
    const age = Date.now() - cacheEntry.metadata.timestamp;
    
    if (age > strategy.maxAge) {
      // Cache expired
      this.removeFromCache(cacheKey);
      return null;
    }

    // Update access metadata
    cacheEntry.metadata.lastAccessed = Date.now();
    cacheEntry.metadata.accessCount++;

    return cacheEntry.data;
  }

  /**
   * Memory pressure management
   */
  checkMemoryUsage() {
    const memoryConfig = GAMING_RESOURCE_CONFIG.memoryManagement;

    // Check if we're approaching memory limits
    if (this.cache.size > memoryConfig.lowMemoryThreshold) {
      this.state.memoryPressure = true;
      
      if (this.cache.size > memoryConfig.criticalMemoryThreshold) {
        this.emergencyMemoryCleanup();
      } else {
        this.gradualMemoryCleanup();
      }
    } else {
      this.state.memoryPressure = false;
    }
  }

  /**
   * Emergency memory cleanup
   */
  emergencyMemoryCleanup() {
    console.warn('🚨 Emergency memory cleanup triggered');

    // Clear non-essential caches first
    const contexts = ['profile', 'social', 'clan', 'voting'];
    
    for (const context of contexts) {
      if (this.cache.size < GAMING_RESOURCE_CONFIG.memoryManagement.lowMemoryThreshold) {
        break;
      }
      this.clearContextCache(context, 0.8); // Clear 80% of context cache
    }

    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }

    this.analytics.memoryCleanups++;
  }

  /**
   * Create resource management dashboard
   */
  createResourceDashboard() {
    const dashboard = document.createElement('div');
    dashboard.className = 'gaming-resource-dashboard';
    dashboard.innerHTML = `
      <div class="resource-header">
        <h3>📦 Resource Manager</h3>
        <div class="resource-status">
          <span class="cache-size">${Math.round(this.cache.size / 1024 / 1024)}MB</span>
          <span class="hit-rate">${Math.round(this.state.cacheHitRate * 100)}%</span>
          <span class="network-type">${this.state.networkType.toUpperCase()}</span>
        </div>
      </div>
      
      <div class="resource-metrics">
        <div class="metric-card">
          <label>Cache Hit Rate</label>
          <span class="metric-value">${Math.round(this.state.cacheHitRate * 100)}%</span>
          <div class="metric-bar">
            <div class="metric-fill" style="width: ${this.state.cacheHitRate * 100}%"></div>
          </div>
        </div>
        
        <div class="metric-card">
          <label>Memory Usage</label>
          <span class="metric-value">${Math.round(this.cache.size / 1024 / 1024)}MB</span>
          <div class="metric-bar">
            <div class="metric-fill" style="width: ${(this.cache.size / this.cache.maxSize) * 100}%"></div>
          </div>
        </div>
        
        <div class="metric-card">
          <label>Active Requests</label>
          <span class="metric-value">${this.state.activeRequests}</span>
        </div>
        
        <div class="metric-card">
          <label>Bandwidth Saved</label>
          <span class="metric-value">${Math.round(this.analytics.bandwidthSaved / 1024 / 1024)}MB</span>
        </div>
      </div>
      
      <div class="resource-controls">
        <button class="clear-cache-button" data-action="clear-cache">
          🗑️ Clear Cache
        </button>
        <button class="optimize-button" data-action="optimize">
          🚀 Optimize Resources
        </button>
        <button class="preload-button" data-action="preload">
          ⚡ Preload Critical
        </button>
      </div>
      
      <div class="resource-analytics">
        <h4>📊 Analytics</h4>
        <div class="analytics-grid">
          <div class="analytics-item">
            <label>Resources Loaded</label>
            <span>${this.analytics.resourcesLoaded}</span>
          </div>
          <div class="analytics-item">
            <label>Resources Cached</label>
            <span>${this.analytics.resourcesCached}</span>
          </div>
          <div class="analytics-item">
            <label>Batched Requests</label>
            <span>${this.analytics.batchedRequests}</span>
          </div>
          <div class="analytics-item">
            <label>Avg Load Time</label>
            <span>${Math.round(this.analytics.averageLoadTime)}ms</span>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    dashboard.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action) {
        this.handleDashboardAction(action);
      }
    });

    // Update dashboard periodically
    setInterval(() => {
      this.updateResourceDashboard(dashboard);
    }, 2000);

    return dashboard;
  }

  /**
   * Handle dashboard actions
   */
  async handleDashboardAction(action) {
    switch (action) {
      case 'clear-cache':
        await this.clearAllCaches();
        break;
      case 'optimize':
        await this.optimizeResources();
        break;
      case 'preload':
        await this.preloadCriticalResources();
        break;
    }
  }

  /**
   * Get comprehensive resource analytics
   */
  getResourceAnalytics() {
    return {
      cache: {
        size: this.cache.size,
        hitRate: this.state.cacheHitRate,
        items: this.cache.data.size
      },
      performance: {
        ...this.performance,
        averageLoadTime: this.calculateAverageLoadTime()
      },
      analytics: { ...this.analytics },
      state: { ...this.state },
      memory: {
        pressure: this.state.memoryPressure,
        usage: this.cache.size,
        limit: this.cache.maxSize
      }
    };
  }

  /**
   * Helper methods
   */
  generateCacheKey(url, type = '') {
    return `${type}:${url}`;
  }

  calculateResourceSize(resource) {
    if (typeof resource === 'string') {
      return new Blob([resource]).size;
    }
    if (resource instanceof Blob) {
      return resource.size;
    }
    if (resource instanceof ArrayBuffer) {
      return resource.byteLength;
    }
    return JSON.stringify(resource).length * 2; // Rough estimate
  }

  updateCacheHitRate() {
    const total = this.performance.cacheHits + this.performance.cacheMisses;
    this.state.cacheHitRate = total > 0 ? this.performance.cacheHits / total : 0;
  }

  recordLoadTime(time) {
    this.performance.loadTimes.push(time);
    if (this.performance.loadTimes.length > 100) {
      this.performance.loadTimes.shift();
    }
    this.analytics.averageLoadTime = this.calculateAverageLoadTime();
  }

  calculateAverageLoadTime() {
    if (this.performance.loadTimes.length === 0) return 0;
    const sum = this.performance.loadTimes.reduce((a, b) => a + b, 0);
    return sum / this.performance.loadTimes.length;
  }

  dispatchEvent(eventName, detail) {
    const event = new CustomEvent(`mlg-resource-${eventName}`, { detail });
    document.dispatchEvent(event);
  }

  /**
   * Cleanup and shutdown
   */
  destroy() {
    console.log('🔥 Destroying Gaming Resource Manager...');

    // Clear all caches
    this.cache.data.clear();
    this.cache.groups.clear();

    // Disconnect observers
    this.lazyLoading.observers.forEach(observer => observer.disconnect());

    // Clear timers
    this.apiBatching.timers.forEach(timer => clearTimeout(timer));

    console.log('✅ Gaming Resource Manager destroyed');
  }
}

export default MobileGamingResourceManager;