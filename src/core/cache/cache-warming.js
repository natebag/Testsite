/**
 * Cache Warming Strategies for Critical Assets
 * Implements proactive caching strategies to preload critical resources
 * and optimize initial page load performance
 */

/**
 * Critical asset types and their warming strategies
 */
export const WARMING_STRATEGIES = {
  // Immediate - loaded during initial page load
  IMMEDIATE: {
    priority: 1,
    timing: 'immediate',
    method: 'preload'
  },
  
  // Early - loaded after critical path
  EARLY: {
    priority: 2,
    timing: 'early',
    method: 'prefetch'
  },
  
  // Lazy - loaded when likely to be needed
  LAZY: {
    priority: 3,
    timing: 'idle',
    method: 'background'
  },
  
  // Predictive - loaded based on user behavior
  PREDICTIVE: {
    priority: 4,
    timing: 'predictive',
    method: 'intelligent'
  }
};

/**
 * Critical asset definitions for MLG platform
 */
export const CRITICAL_ASSETS = {
  // Core application assets
  CORE: {
    strategy: WARMING_STRATEGIES.IMMEDIATE,
    assets: [
      '/src/main.js',
      '/src/styles/main.css',
      '/src/js/mlg-api-client-consolidated.js',
      '/src/js/mlg-wallet-init-consolidated.js'
    ]
  },
  
  // Essential UI components
  UI_CORE: {
    strategy: WARMING_STRATEGIES.IMMEDIATE,
    assets: [
      '/src/shared/components/ui/Button.js',
      '/src/shared/components/ui/LoadingSpinner.js',
      '/src/shared/components/ui/Modal.js',
      '/src/shared/components/wallet-ui.js'
    ]
  },
  
  // Gaming-specific functionality
  GAMING: {
    strategy: WARMING_STRATEGIES.EARLY,
    assets: [
      '/src/features/wallet/phantom-wallet.js',
      '/src/features/tokens/spl-mlg-token.js',
      '/src/shared/utils/cache/mlg-cache-manager.js'
    ]
  },
  
  // Navigation and routing
  NAVIGATION: {
    strategy: WARMING_STRATEGIES.EARLY,
    assets: [
      '/src/shared/router/spa-router.js',
      '/src/shared/router/navigation-manager.js',
      '/pages/index.html',
      '/pages/clans.html',
      '/pages/voting.html'
    ]
  },
  
  // Fonts and icons
  FONTS: {
    strategy: WARMING_STRATEGIES.IMMEDIATE,
    assets: [
      '/assets/fonts/main.woff2',
      '/assets/icons/icon-192x192.png',
      '/assets/icons/icon-512x512.png'
    ]
  },
  
  // User-specific content (loaded based on auth state)
  USER_CONTENT: {
    strategy: WARMING_STRATEGIES.PREDICTIVE,
    assets: [
      '/pages/profile.html',
      '/pages/dao.html',
      '/src/features/clans/clan-management.js'
    ]
  }
};

/**
 * Cache Warming Manager
 * Orchestrates proactive loading of critical assets
 */
export class CacheWarmingManager {
  constructor(options = {}) {
    this.options = {
      enableServiceWorker: true,
      enablePrefetch: true,
      enablePreload: true,
      enableIntelligentPrefetch: true,
      maxConcurrentRequests: 6,
      warmingDelay: 100, // ms delay between requests
      idleThreshold: 50, // ms idle time threshold
      predictiveThreshold: 0.7, // confidence threshold for predictions
      ...options
    };
    
    this.loadedAssets = new Set();
    this.warmingQueue = [];
    this.isWarming = false;
    this.userBehavior = {
      pageViews: new Map(),
      interactions: new Map(),
      timeSpent: new Map(),
      sequences: []
    };
    
    this.init();
  }

  /**
   * Initialize cache warming system
   */
  init() {
    try {
      // Set up service worker communication
      if (this.options.enableServiceWorker && 'serviceWorker' in navigator) {
        this.setupServiceWorkerWarming();
      }
      
      // Set up resource hints
      this.setupResourceHints();
      
      // Set up user behavior tracking
      this.setupBehaviorTracking();
      
      // Start initial warming process
      this.startInitialWarming();
      
      console.log('[CacheWarming] Cache warming system initialized');
    } catch (error) {
      console.error('[CacheWarming] Initialization failed:', error);
    }
  }

  /**
   * Set up service worker communication for cache warming
   */
  setupServiceWorkerWarming() {
    navigator.serviceWorker.ready.then(registration => {
      this.serviceWorker = registration.active;
      
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', event => {
        const { type, payload } = event.data;
        
        if (type === 'CACHE_WARMED') {
          this.handleAssetCached(payload);
        } else if (type === 'CACHE_MISS') {
          this.handleCacheMiss(payload);
        }
      });
    });
  }

  /**
   * Set up resource hints in HTML head
   */
  setupResourceHints() {
    const head = document.head;
    
    // DNS prefetch for external domains
    this.addResourceHint('dns-prefetch', '//api.mainnet-beta.solana.com');
    this.addResourceHint('dns-prefetch', '//fonts.googleapis.com');
    this.addResourceHint('dns-prefetch', '//fonts.gstatic.com');
    
    // Preconnect for critical external resources
    this.addResourceHint('preconnect', 'https://api.mainnet-beta.solana.com', { crossorigin: true });
    this.addResourceHint('preconnect', 'https://fonts.gstatic.com', { crossorigin: true });
  }

  /**
   * Add resource hint to HTML head
   */
  addResourceHint(rel, href, attributes = {}) {
    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    
    Object.entries(attributes).forEach(([key, value]) => {
      if (value === true) {
        link.setAttribute(key, '');
      } else if (value) {
        link.setAttribute(key, value);
      }
    });
    
    document.head.appendChild(link);
  }

  /**
   * Set up user behavior tracking for predictive caching
   */
  setupBehaviorTracking() {
    // Track page views
    this.trackPageView(window.location.pathname);
    
    // Track navigation
    window.addEventListener('popstate', () => {
      this.trackPageView(window.location.pathname);
    });
    
    // Track interactions
    document.addEventListener('click', (event) => {
      if (event.target.tagName === 'A') {
        this.trackInteraction('navigation', event.target.href);
      } else if (event.target.closest('button')) {
        this.trackInteraction('button', event.target.closest('button').textContent);
      }
    });
    
    // Track time on page
    this.pageStartTime = Date.now();
    window.addEventListener('beforeunload', () => {
      const timeSpent = Date.now() - this.pageStartTime;
      this.trackTimeSpent(window.location.pathname, timeSpent);
    });
  }

  /**
   * Track page view for predictive analysis
   */
  trackPageView(path) {
    const count = this.userBehavior.pageViews.get(path) || 0;
    this.userBehavior.pageViews.set(path, count + 1);
    
    // Record navigation sequence
    this.userBehavior.sequences.push({
      type: 'pageview',
      path: path,
      timestamp: Date.now()
    });
    
    // Keep only last 50 sequences
    if (this.userBehavior.sequences.length > 50) {
      this.userBehavior.sequences = this.userBehavior.sequences.slice(-50);
    }
  }

  /**
   * Track user interaction
   */
  trackInteraction(type, target) {
    const key = `${type}:${target}`;
    const count = this.userBehavior.interactions.get(key) || 0;
    this.userBehavior.interactions.set(key, count + 1);
    
    this.userBehavior.sequences.push({
      type: 'interaction',
      interactionType: type,
      target: target,
      timestamp: Date.now()
    });
  }

  /**
   * Track time spent on page
   */
  trackTimeSpent(path, duration) {
    const existing = this.userBehavior.timeSpent.get(path) || { total: 0, visits: 0 };
    this.userBehavior.timeSpent.set(path, {
      total: existing.total + duration,
      visits: existing.visits + 1,
      average: (existing.total + duration) / (existing.visits + 1)
    });
  }

  /**
   * Start initial cache warming process
   */
  async startInitialWarming() {
    // Warm immediate assets first
    await this.warmAssetGroup(CRITICAL_ASSETS.CORE);
    await this.warmAssetGroup(CRITICAL_ASSETS.UI_CORE);
    await this.warmAssetGroup(CRITICAL_ASSETS.FONTS);
    
    // Schedule early assets
    requestIdleCallback(() => {
      this.warmAssetGroup(CRITICAL_ASSETS.GAMING);
      this.warmAssetGroup(CRITICAL_ASSETS.NAVIGATION);
    }, { timeout: 1000 });
    
    // Schedule predictive warming
    setTimeout(() => {
      this.startPredictiveWarming();
    }, 2000);
  }

  /**
   * Warm a group of assets
   */
  async warmAssetGroup(assetGroup) {
    const { strategy, assets } = assetGroup;
    
    for (const asset of assets) {
      if (!this.loadedAssets.has(asset)) {
        await this.warmAsset(asset, strategy);
        
        // Add delay between requests to avoid overwhelming
        if (this.options.warmingDelay > 0) {
          await this.delay(this.options.warmingDelay);
        }
      }
    }
  }

  /**
   * Warm individual asset
   */
  async warmAsset(assetPath, strategy) {
    try {
      switch (strategy.method) {
        case 'preload':
          await this.preloadAsset(assetPath, strategy);
          break;
        
        case 'prefetch':
          await this.prefetchAsset(assetPath, strategy);
          break;
        
        case 'background':
          await this.backgroundLoadAsset(assetPath, strategy);
          break;
        
        case 'intelligent':
          await this.intelligentPrefetch(assetPath, strategy);
          break;
        
        default:
          await this.preloadAsset(assetPath, strategy);
      }
      
      this.loadedAssets.add(assetPath);
      console.log(`[CacheWarming] Warmed asset: ${assetPath}`);
    } catch (error) {
      console.warn(`[CacheWarming] Failed to warm asset ${assetPath}:`, error.message);
    }
  }

  /**
   * Preload asset using link rel="preload"
   */
  async preloadAsset(assetPath, strategy) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = assetPath;
      link.as = this.getAssetType(assetPath);
      
      if (this.isCrossOrigin(assetPath)) {
        link.crossOrigin = 'anonymous';
      }
      
      link.onload = () => {
        this.recordWarmingSuccess(assetPath, 'preload');
        resolve();
      };
      
      link.onerror = () => {
        this.recordWarmingError(assetPath, 'preload');
        reject(new Error(`Failed to preload ${assetPath}`));
      };
      
      // Add to head with timeout
      document.head.appendChild(link);
      
      setTimeout(() => {
        if (link.parentNode) {
          reject(new Error(`Preload timeout for ${assetPath}`));
        }
      }, 10000);
    });
  }

  /**
   * Prefetch asset using link rel="prefetch"
   */
  async prefetchAsset(assetPath, strategy) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = assetPath;
      
      if (this.isCrossOrigin(assetPath)) {
        link.crossOrigin = 'anonymous';
      }
      
      link.onload = () => {
        this.recordWarmingSuccess(assetPath, 'prefetch');
        resolve();
      };
      
      link.onerror = () => {
        this.recordWarmingError(assetPath, 'prefetch');
        reject(new Error(`Failed to prefetch ${assetPath}`));
      };
      
      document.head.appendChild(link);
      
      setTimeout(() => {
        if (link.parentNode) {
          reject(new Error(`Prefetch timeout for ${assetPath}`));
        }
      }, 15000);
    });
  }

  /**
   * Background load asset using fetch
   */
  async backgroundLoadAsset(assetPath, strategy) {
    try {
      const response = await fetch(assetPath, {
        mode: 'cors',
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Store in cache if service worker is available
      if (this.serviceWorker) {
        this.serviceWorker.postMessage({
          type: 'CACHE_ASSET',
          payload: { url: assetPath, response: response.clone() }
        });
      }
      
      this.recordWarmingSuccess(assetPath, 'background');
    } catch (error) {
      this.recordWarmingError(assetPath, 'background');
      throw error;
    }
  }

  /**
   * Intelligent prefetch based on user behavior prediction
   */
  async intelligentPrefetch(assetPath, strategy) {
    const confidence = this.calculatePrefetchConfidence(assetPath);
    
    if (confidence >= this.options.predictiveThreshold) {
      await this.prefetchAsset(assetPath, strategy);
      console.log(`[CacheWarming] Intelligent prefetch: ${assetPath} (confidence: ${confidence})`);
    } else {
      console.log(`[CacheWarming] Skipped intelligent prefetch: ${assetPath} (confidence: ${confidence})`);
    }
  }

  /**
   * Calculate prefetch confidence based on user behavior
   */
  calculatePrefetchConfidence(assetPath) {
    let confidence = 0;
    
    // Base confidence from page views
    const pathViews = this.userBehavior.pageViews.get(this.getAssetPath(assetPath)) || 0;
    const totalViews = Array.from(this.userBehavior.pageViews.values()).reduce((a, b) => a + b, 0);
    
    if (totalViews > 0) {
      confidence += (pathViews / totalViews) * 0.4; // 40% weight
    }
    
    // Factor in time spent
    const timeData = this.userBehavior.timeSpent.get(this.getAssetPath(assetPath));
    if (timeData && timeData.average > 5000) { // More than 5 seconds
      confidence += 0.3; // 30% weight
    }
    
    // Factor in recent interactions
    const recentInteractions = this.userBehavior.sequences
      .filter(seq => Date.now() - seq.timestamp < 300000) // Last 5 minutes
      .filter(seq => seq.path && seq.path.includes(this.getAssetPath(assetPath)))
      .length;
    
    if (recentInteractions > 0) {
      confidence += Math.min(recentInteractions * 0.1, 0.3); // Up to 30% weight
    }
    
    return Math.min(confidence, 1); // Cap at 1.0
  }

  /**
   * Start predictive warming based on user behavior
   */
  startPredictiveWarming() {
    // Analyze navigation patterns
    const patterns = this.analyzeNavigationPatterns();
    
    // Predict likely next pages
    const predictions = this.generatePredictions(patterns);
    
    // Warm predicted assets
    predictions.forEach(prediction => {
      if (prediction.confidence >= this.options.predictiveThreshold) {
        this.scheduleAssetWarming(prediction.asset, WARMING_STRATEGIES.PREDICTIVE);
      }
    });
    
    // Schedule periodic prediction updates
    setInterval(() => {
      this.updatePredictions();
    }, 60000); // Every minute
  }

  /**
   * Analyze navigation patterns from user behavior
   */
  analyzeNavigationPatterns() {
    const patterns = new Map();
    const sequences = this.userBehavior.sequences.filter(s => s.type === 'pageview');
    
    for (let i = 0; i < sequences.length - 1; i++) {
      const current = sequences[i].path;
      const next = sequences[i + 1].path;
      const pattern = `${current} -> ${next}`;
      
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    }
    
    return patterns;
  }

  /**
   * Generate predictions based on patterns
   */
  generatePredictions(patterns) {
    const currentPath = window.location.pathname;
    const predictions = [];
    
    for (const [pattern, count] of patterns) {
      const [from, to] = pattern.split(' -> ');
      
      if (from === currentPath) {
        const assets = this.getAssetsForPath(to);
        const confidence = count / Array.from(patterns.values()).reduce((a, b) => a + b, 0);
        
        assets.forEach(asset => {
          predictions.push({ asset, confidence });
        });
      }
    }
    
    return predictions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get assets associated with a path
   */
  getAssetsForPath(path) {
    const assets = [];
    
    // Map paths to their associated assets
    const pathAssetMap = {
      '/pages/clans.html': [
        '/src/features/clans/clan-management.js',
        '/src/shared/components/clan-management-ui.jsx'
      ],
      '/pages/voting.html': [
        '/src/features/voting/solana-voting-system.js',
        '/src/shared/components/voting-interface-ui.js'
      ],
      '/pages/profile.html': [
        '/src/shared/components/wallet-ui.js',
        '/src/features/wallet/phantom-wallet.js'
      ]
    };
    
    return pathAssetMap[path] || [];
  }

  /**
   * Schedule asset warming
   */
  scheduleAssetWarming(assetPath, strategy) {
    this.warmingQueue.push({ assetPath, strategy });
    
    if (!this.isWarming) {
      this.processWarmingQueue();
    }
  }

  /**
   * Process warming queue
   */
  async processWarmingQueue() {
    if (this.isWarming || this.warmingQueue.length === 0) {
      return;
    }
    
    this.isWarming = true;
    
    while (this.warmingQueue.length > 0) {
      const { assetPath, strategy } = this.warmingQueue.shift();
      
      if (!this.loadedAssets.has(assetPath)) {
        await this.warmAsset(assetPath, strategy);
      }
      
      // Respect concurrency limits
      if (this.warmingQueue.length > 0) {
        await this.delay(this.options.warmingDelay);
      }
    }
    
    this.isWarming = false;
  }

  /**
   * Update predictions periodically
   */
  updatePredictions() {
    const patterns = this.analyzeNavigationPatterns();
    const predictions = this.generatePredictions(patterns);
    
    predictions.slice(0, 3).forEach(prediction => { // Top 3 predictions
      if (prediction.confidence >= this.options.predictiveThreshold) {
        this.scheduleAssetWarming(prediction.asset, WARMING_STRATEGIES.PREDICTIVE);
      }
    });
  }

  /**
   * Get asset type for preload 'as' attribute
   */
  getAssetType(assetPath) {
    const ext = assetPath.split('.').pop().toLowerCase();
    
    const typeMap = {
      'js': 'script',
      'mjs': 'script',
      'jsx': 'script',
      'css': 'style',
      'png': 'image',
      'jpg': 'image',
      'jpeg': 'image',
      'gif': 'image',
      'svg': 'image',
      'webp': 'image',
      'woff': 'font',
      'woff2': 'font',
      'ttf': 'font',
      'eot': 'font',
      'mp4': 'video',
      'webm': 'video',
      'mp3': 'audio',
      'wav': 'audio'
    };
    
    return typeMap[ext] || 'fetch';
  }

  /**
   * Check if asset is cross-origin
   */
  isCrossOrigin(assetPath) {
    try {
      const url = new URL(assetPath, window.location.origin);
      return url.origin !== window.location.origin;
    } catch {
      return false;
    }
  }

  /**
   * Get path component from asset path
   */
  getAssetPath(assetPath) {
    return assetPath.split('/').slice(0, -1).join('/') || '/';
  }

  /**
   * Record warming success
   */
  recordWarmingSuccess(assetPath, method) {
    console.log(`[CacheWarming] Successfully warmed ${assetPath} using ${method}`);
    
    // Could be expanded to send analytics
    if (this.options.enableAnalytics) {
      this.sendAnalytics('cache_warming_success', {
        asset: assetPath,
        method: method,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Record warming error
   */
  recordWarmingError(assetPath, method) {
    console.warn(`[CacheWarming] Failed to warm ${assetPath} using ${method}`);
    
    if (this.options.enableAnalytics) {
      this.sendAnalytics('cache_warming_error', {
        asset: assetPath,
        method: method,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Send analytics data
   */
  sendAnalytics(event, data) {
    // Placeholder for analytics implementation
    // Could integrate with Google Analytics, custom analytics, etc.
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get warming statistics
   */
  getStats() {
    return {
      loadedAssets: this.loadedAssets.size,
      queueLength: this.warmingQueue.length,
      isWarming: this.isWarming,
      userBehavior: {
        pageViews: this.userBehavior.pageViews.size,
        interactions: this.userBehavior.interactions.size,
        sequences: this.userBehavior.sequences.length
      }
    };
  }

  /**
   * Manual asset warming
   */
  async warmAssetsManually(assetPaths, strategy = WARMING_STRATEGIES.EARLY) {
    for (const assetPath of assetPaths) {
      await this.warmAsset(assetPath, strategy);
    }
  }

  /**
   * Clear warming state
   */
  clearWarmingState() {
    this.loadedAssets.clear();
    this.warmingQueue = [];
    this.userBehavior = {
      pageViews: new Map(),
      interactions: new Map(),
      timeSpent: new Map(),
      sequences: []
    };
  }
}

/**
 * Factory function to create cache warming manager
 */
export function createCacheWarmingManager(options) {
  return new CacheWarmingManager(options);
}

/**
 * Simple cache warming for specific assets
 */
export async function warmCriticalAssets(assets, options = {}) {
  const manager = new CacheWarmingManager(options);
  await manager.warmAssetsManually(assets, WARMING_STRATEGIES.IMMEDIATE);
  return manager;
}

export default CacheWarmingManager;