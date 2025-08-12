/**
 * Comprehensive Static Asset Caching System
 * Main integration module for all caching components
 */

// Core caching components
export { 
  HTTPCacheManager, 
  createCacheManager,
  getCacheHeaders,
  CACHE_POLICIES 
} from './http-cache-headers.js';

export { 
  AssetVersionManager,
  CacheBustingUtils,
  cacheBustingMiddleware,
  VERSIONING_CONFIG 
} from './cache-busting.js';

export { 
  AssetCachingStrategyManager,
  createAssetCachingStrategy,
  ASSET_CACHING_STRATEGIES 
} from './asset-caching-strategies.js';

export { 
  ConditionalRequestManager,
  createConditionalRequestManager,
  apiConditionalCaching,
  ETAG_STRATEGIES 
} from './conditional-requests.js';

export { 
  BrowserCacheManager,
  createBrowserCacheManager,
  STORAGE_LIMITS,
  CACHE_PRIORITIES 
} from './browser-cache-optimization.js';

export { 
  CacheWarmingManager,
  createCacheWarmingManager,
  warmCriticalAssets,
  WARMING_STRATEGIES,
  CRITICAL_ASSETS 
} from './cache-warming.js';

export { 
  CacheInvalidationManager,
  getInvalidationManager,
  invalidateCache,
  purgeCache,
  emitCacheEvent,
  INVALIDATION_STRATEGIES,
  INVALIDATION_EVENTS 
} from './cache-invalidation.js';

export { 
  CacheSecurityManager,
  createCacheSecurityManager,
  generateSRI,
  validateIntegrity,
  SECURITY_POLICIES 
} from './security-cache.js';

export { 
  CachePerformanceMonitor,
  getCacheMonitor,
  recordCacheHit,
  recordCacheMiss,
  getPerformanceReport,
  getCacheHitRate,
  PERFORMANCE_THRESHOLDS 
} from './cache-monitoring.js';

/**
 * Comprehensive Cache System Manager
 * Integrates all caching components into a unified system
 */
export class ComprehensiveCacheSystem {
  constructor(options = {}) {
    this.options = {
      // HTTP caching options
      enableHTTPCaching: true,
      enableETag: true,
      enableLastModified: true,
      
      // Asset versioning options
      enableVersioning: true,
      enableCacheBusting: true,
      
      // Browser caching options
      enableBrowserCaching: true,
      enableCompression: true,
      
      // Cache warming options
      enableCacheWarming: true,
      enablePredictiveWarming: true,
      
      // Invalidation options
      enableInvalidation: true,
      enableEventDriven: true,
      
      // Security options
      enableSecurity: true,
      enableSRI: true,
      enableCSP: true,
      
      // Monitoring options
      enableMonitoring: true,
      enableAnalytics: true,
      
      ...options
    };
    
    this.components = {};
    this.initialized = false;
  }

  /**
   * Initialize the comprehensive caching system
   */
  async init() {
    try {
      console.log('[CacheSystem] Initializing comprehensive cache system...');
      
      // Initialize HTTP cache manager
      if (this.options.enableHTTPCaching) {
        this.components.httpCache = createCacheManager({
          enableETag: this.options.enableETag,
          enableLastModified: this.options.enableLastModified
        });
      }
      
      // Initialize asset versioning
      if (this.options.enableVersioning) {
        this.components.assetVersion = new AssetVersionManager();
      }
      
      // Initialize asset caching strategies
      this.components.assetStrategy = createAssetCachingStrategy({
        enableCompression: this.options.enableCompression,
        enableSRI: this.options.enableSRI,
        enablePreloading: this.options.enableCacheWarming
      });
      
      // Initialize conditional requests
      this.components.conditionalRequests = createConditionalRequestManager({
        enableETag: this.options.enableETag,
        enableLastModified: this.options.enableLastModified
      });
      
      // Initialize browser cache optimization
      if (this.options.enableBrowserCaching) {
        this.components.browserCache = createBrowserCacheManager({
          enableCompression: this.options.enableCompression
        });
      }
      
      // Initialize cache warming
      if (this.options.enableCacheWarming) {
        this.components.cacheWarming = createCacheWarmingManager({
          enablePredictiveWarming: this.options.enablePredictiveWarming
        });
      }
      
      // Initialize cache invalidation
      if (this.options.enableInvalidation) {
        this.components.invalidation = getInvalidationManager({
          enableEventDriven: this.options.enableEventDriven
        });
      }
      
      // Initialize security manager
      if (this.options.enableSecurity) {
        this.components.security = createCacheSecurityManager({
          enableSRIGeneration: this.options.enableSRI,
          enableCSPGeneration: this.options.enableCSP
        });
      }
      
      // Initialize performance monitor
      if (this.options.enableMonitoring) {
        this.components.monitor = getCacheMonitor({
          enableAnalytics: this.options.enableAnalytics
        });
      }
      
      this.initialized = true;
      console.log('[CacheSystem] Comprehensive cache system initialized successfully');
      
      return this.getSystemStatus();
    } catch (error) {
      console.error('[CacheSystem] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get Express middleware stack for all caching components
   */
  getMiddleware() {
    if (!this.initialized) {
      throw new Error('Cache system not initialized. Call init() first.');
    }
    
    const middlewares = [];
    
    // Add monitoring middleware first (for request tracking)
    if (this.components.monitor) {
      middlewares.push(this.wrapMiddleware('monitor', (req, res, next) => {
        res.locals.cacheMonitor = this.components.monitor;
        next();
      }));
    }
    
    // Add security middleware
    if (this.components.security) {
      middlewares.push(this.wrapMiddleware('security', this.components.security.middleware()));
    }
    
    // Add HTTP cache middleware
    if (this.components.httpCache) {
      middlewares.push(this.wrapMiddleware('httpCache', this.components.httpCache.middleware()));
    }
    
    // Add conditional requests middleware
    if (this.components.conditionalRequests) {
      middlewares.push(this.wrapMiddleware('conditionalRequests', this.components.conditionalRequests.middleware()));
    }
    
    // Add asset strategy middleware
    if (this.components.assetStrategy) {
      middlewares.push(this.wrapMiddleware('assetStrategy', this.components.assetStrategy.middleware()));
    }
    
    return middlewares;
  }

  /**
   * Wrap middleware with error handling and metrics
   */
  wrapMiddleware(name, middleware) {
    return (req, res, next) => {
      const startTime = Date.now();
      
      try {
        middleware(req, res, (error) => {
          const duration = Date.now() - startTime;
          
          if (this.components.monitor) {
            this.components.monitor.recordEvent({
              type: 'middleware_execution',
              name,
              duration,
              success: !error,
              timestamp: Date.now()
            });
          }
          
          if (error) {
            console.error(`[CacheSystem] Middleware ${name} error:`, error);
          }
          
          next(error);
        });
      } catch (error) {
        console.error(`[CacheSystem] Middleware ${name} threw error:`, error);
        next(error);
      }
    };
  }

  /**
   * Perform comprehensive cache warming
   */
  async warmCaches() {
    if (!this.components.cacheWarming) {
      console.warn('[CacheSystem] Cache warming not enabled');
      return;
    }
    
    console.log('[CacheSystem] Starting comprehensive cache warming...');
    
    try {
      // Warm critical assets
      await this.components.cacheWarming.warmAssetsManually(CRITICAL_ASSETS.CORE.assets);
      await this.components.cacheWarming.warmAssetsManually(CRITICAL_ASSETS.UI_CORE.assets);
      await this.components.cacheWarming.warmAssetsManually(CRITICAL_ASSETS.FONTS.assets);
      
      console.log('[CacheSystem] Cache warming completed successfully');
      return true;
    } catch (error) {
      console.error('[CacheSystem] Cache warming failed:', error);
      return false;
    }
  }

  /**
   * Perform build-time optimization
   */
  async optimizeForBuild(sourceDir, outputDir) {
    console.log('[CacheSystem] Starting build-time optimization...');
    
    const results = {
      versioning: null,
      security: null,
      assets: null,
      success: true
    };
    
    try {
      // Generate asset versions and cache busting
      if (this.components.assetVersion) {
        results.versioning = await this.components.assetVersion.buildVersionedAssets(sourceDir, outputDir);
      }
      
      // Optimize security (SRI, CSP)
      if (this.components.security) {
        results.security = await this.components.security.optimizeSecurityForBuild(sourceDir, outputDir);
      }
      
      // Optimize assets
      if (this.components.assetStrategy) {
        results.assets = await this.components.assetStrategy.optimizeAssets(sourceDir, outputDir);
      }
      
      console.log('[CacheSystem] Build optimization completed:', results);
      return results;
    } catch (error) {
      console.error('[CacheSystem] Build optimization failed:', error);
      results.success = false;
      results.error = error.message;
      return results;
    }
  }

  /**
   * Get comprehensive performance report
   */
  getPerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      system: this.getSystemStatus(),
      performance: null,
      security: null,
      recommendations: []
    };
    
    // Get performance metrics
    if (this.components.monitor) {
      report.performance = this.components.monitor.getPerformanceReport();
    }
    
    // Get security report
    if (this.components.security) {
      report.security = this.components.security.generateSecurityReport();
    }
    
    // Generate system recommendations
    report.recommendations = this.generateSystemRecommendations(report);
    
    return report;
  }

  /**
   * Generate system-wide recommendations
   */
  generateSystemRecommendations(report) {
    const recommendations = [];
    
    // Performance recommendations
    if (report.performance) {
      const hitRate = report.performance.summary.hitRate;
      
      if (hitRate < 0.7) {
        recommendations.push({
          type: 'critical',
          category: 'performance',
          message: `System cache hit rate is ${(hitRate * 100).toFixed(1)}%`,
          action: 'Enable more aggressive caching and implement cache warming',
          impact: 'high'
        });
      }
      
      const avgResponseTime = parseFloat(report.performance.summary.averageResponseTime);
      if (avgResponseTime > 100) {
        recommendations.push({
          type: 'warning',
          category: 'performance',
          message: `Average response time is ${avgResponseTime.toFixed(1)}ms`,
          action: 'Optimize cache retrieval mechanisms and enable compression',
          impact: 'medium'
        });
      }
    }
    
    // Security recommendations
    if (report.security) {
      const securityLevel = report.security.securityLevel;
      
      if (securityLevel === 'Critical' || securityLevel === 'Low') {
        recommendations.push({
          type: 'critical',
          category: 'security',
          message: `Security level is ${securityLevel}`,
          action: 'Enable SRI for all critical assets and implement comprehensive CSP',
          impact: 'high'
        });
      }
    }
    
    // System recommendations
    if (!this.components.cacheWarming) {
      recommendations.push({
        type: 'info',
        category: 'optimization',
        message: 'Cache warming is disabled',
        action: 'Enable cache warming to improve initial load performance',
        impact: 'medium'
      });
    }
    
    if (!this.components.browserCache) {
      recommendations.push({
        type: 'info',
        category: 'optimization',
        message: 'Browser cache optimization is disabled',
        action: 'Enable browser cache optimization for better client-side performance',
        impact: 'medium'
      });
    }
    
    return recommendations;
  }

  /**
   * Get system status
   */
  getSystemStatus() {
    const status = {
      initialized: this.initialized,
      components: {},
      health: 'healthy'
    };
    
    // Check each component
    Object.entries(this.components).forEach(([name, component]) => {
      status.components[name] = {
        enabled: !!component,
        healthy: true // Could add health checks here
      };
    });
    
    // Overall health assessment
    const enabledComponents = Object.values(status.components).filter(c => c.enabled).length;
    if (enabledComponents === 0) {
      status.health = 'critical';
    } else if (enabledComponents < 5) {
      status.health = 'degraded';
    }
    
    return status;
  }

  /**
   * Handle cache invalidation event
   */
  async handleCacheEvent(eventName, data) {
    if (this.components.invalidation) {
      this.components.invalidation.emit(eventName, data);
    }
    
    if (this.components.monitor) {
      this.components.monitor.recordEvent({
        type: 'cache_event',
        eventName,
        data,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Perform emergency cache purge
   */
  async emergencyPurge(reason = 'manual') {
    console.warn(`[CacheSystem] Performing emergency cache purge: ${reason}`);
    
    const results = [];
    
    // Purge HTTP caches
    if (this.components.invalidation) {
      try {
        await this.components.invalidation.purgeAllCaches();
        results.push({ component: 'invalidation', success: true });
      } catch (error) {
        results.push({ component: 'invalidation', success: false, error: error.message });
      }
    }
    
    // Clear browser caches
    if (this.components.browserCache) {
      try {
        await this.components.browserCache.clearAll();
        results.push({ component: 'browserCache', success: true });
      } catch (error) {
        results.push({ component: 'browserCache', success: false, error: error.message });
      }
    }
    
    // Record the purge event
    if (this.components.monitor) {
      this.components.monitor.recordEvent({
        type: 'emergency_purge',
        reason,
        results,
        timestamp: Date.now()
      });
    }
    
    return results;
  }

  /**
   * Export system configuration and data
   */
  exportSystemData(includeMetrics = true) {
    const exportData = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      configuration: this.options,
      status: this.getSystemStatus(),
      performance: null,
      security: null
    };
    
    if (includeMetrics) {
      // Export performance data
      if (this.components.monitor) {
        exportData.performance = this.components.monitor.exportData();
      }
      
      // Export security data
      if (this.components.security) {
        exportData.security = this.components.security.generateSecurityReport();
      }
    }
    
    return exportData;
  }

  /**
   * Cleanup and destroy the cache system
   */
  async destroy() {
    console.log('[CacheSystem] Destroying comprehensive cache system...');
    
    // Cleanup each component
    Object.entries(this.components).forEach(([name, component]) => {
      try {
        if (component && typeof component.destroy === 'function') {
          component.destroy();
        }
      } catch (error) {
        console.warn(`[CacheSystem] Failed to destroy ${name}:`, error);
      }
    });
    
    this.components = {};
    this.initialized = false;
    
    console.log('[CacheSystem] Cache system destroyed');
  }
}

/**
 * Factory function to create a comprehensive cache system
 */
export function createComprehensiveCacheSystem(options = {}) {
  return new ComprehensiveCacheSystem(options);
}

/**
 * Quick setup function for common configurations
 */
export function setupCache(preset = 'production') {
  const presets = {
    development: {
      enableHTTPCaching: true,
      enableVersioning: false,
      enableSecurity: false,
      enableMonitoring: true,
      enableAnalytics: false
    },
    
    production: {
      enableHTTPCaching: true,
      enableVersioning: true,
      enableSecurity: true,
      enableMonitoring: true,
      enableAnalytics: true,
      enableCacheWarming: true,
      enableBrowserCaching: true
    },
    
    performance: {
      enableHTTPCaching: true,
      enableVersioning: true,
      enableCacheWarming: true,
      enablePredictiveWarming: true,
      enableBrowserCaching: true,
      enableCompression: true,
      enableMonitoring: true
    },
    
    security: {
      enableHTTPCaching: true,
      enableSecurity: true,
      enableSRI: true,
      enableCSP: true,
      enableMonitoring: true
    }
  };
  
  const config = presets[preset] || presets.production;
  return createComprehensiveCacheSystem(config);
}

// Default export
export default ComprehensiveCacheSystem;