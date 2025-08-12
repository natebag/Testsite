/**
 * @fileoverview CDN Integration System - Main Entry Point
 * Provides unified interface for all CDN functionality
 */

import { CDNManager, cdnManager, getCDNUrl, cdnMiddleware } from './cdn-manager.js';
import { CDNFailoverManager, cdnFailoverManager } from './cdn-failover.js';
import { MediaOptimizer, mediaOptimizer, mediaOptimizationMiddleware } from './media-optimizer.js';
import { GeoDistributionManager, geoDistributionManager, geoRoutingMiddleware } from './geo-distribution.js';
import { CacheInvalidationManager, cacheInvalidationManager, cacheInvalidationMiddleware } from './cache-invalidation.js';
import { CDNSecurityManager, cdnSecurityManager, cdnSecurityMiddleware } from './cdn-security.js';
import { CDNMonitoringManager, cdnMonitoringManager, cdnMonitoringMiddleware } from './cdn-monitoring.js';
import { IntelligentRoutingManager, intelligentRoutingManager, intelligentRoutingMiddleware } from './intelligent-routing.js';
import { GamingMediaHandler, gamingMediaHandler, gamingMediaMiddleware } from './gaming-media-handler.js';

import { 
  CDN_CONFIGS, 
  CONTENT_TYPE_MAPPING, 
  GEO_ROUTING_CONFIG, 
  CACHE_STRATEGIES,
  SECURITY_CONFIG,
  PERFORMANCE_CONFIG,
  MONITORING_CONFIG
} from './cdn-config.js';

/**
 * Main CDN Integration Class
 */
export class CDNIntegration {
  constructor(config = {}) {
    this.config = {
      environment: config.environment || process.env.NODE_ENV || 'development',
      enableFailover: config.enableFailover !== false,
      enableSecurity: config.enableSecurity !== false,
      enableMonitoring: config.enableMonitoring !== false,
      enableIntelligentRouting: config.enableIntelligentRouting !== false,
      enableGamingMedia: config.enableGamingMedia !== false,
      ...config
    };
    
    this.managers = {
      cdn: null,
      failover: null,
      mediaOptimizer: null,
      geoDistribution: null,
      cacheInvalidation: null,
      security: null,
      monitoring: null,
      intelligentRouting: null,
      gamingMedia: null
    };
    
    this.isInitialized = false;
    this.middlewareStack = [];
  }

  /**
   * Initialize the complete CDN system
   * @param {Object} options - Initialization options
   * @returns {Promise<void>}
   */
  async initialize(options = {}) {
    if (this.isInitialized) {
      console.warn('CDN system already initialized');
      return;
    }
    
    console.log('🚀 Initializing MLG CDN System...');
    
    try {
      // Initialize core CDN manager
      this.managers.cdn = cdnManager;
      console.log('✅ CDN Manager initialized');
      
      // Initialize failover system
      if (this.config.enableFailover) {
        this.managers.failover = cdnFailoverManager;
        this.registerCDNProviders();
        console.log('✅ CDN Failover system initialized');
      }
      
      // Initialize media optimizer
      this.managers.mediaOptimizer = mediaOptimizer;
      console.log('✅ Media Optimizer initialized');
      
      // Initialize geo distribution
      this.managers.geoDistribution = geoDistributionManager;
      console.log('✅ Geographic Distribution initialized');
      
      // Initialize cache invalidation
      this.managers.cacheInvalidation = cacheInvalidationManager;
      this.registerInvalidationProviders();
      console.log('✅ Cache Invalidation system initialized');
      
      // Initialize security
      if (this.config.enableSecurity) {
        this.managers.security = cdnSecurityManager;
        console.log('✅ CDN Security system initialized');
      }
      
      // Initialize monitoring
      if (this.config.enableMonitoring) {
        this.managers.monitoring = cdnMonitoringManager;
        console.log('✅ CDN Monitoring system initialized');
      }
      
      // Initialize intelligent routing
      if (this.config.enableIntelligentRouting) {
        this.managers.intelligentRouting = intelligentRoutingManager;
        console.log('✅ Intelligent Routing system initialized');
      }
      
      // Initialize gaming media handler
      if (this.config.enableGamingMedia) {
        this.managers.gamingMedia = gamingMediaHandler;
        console.log('✅ Gaming Media Handler initialized');
      }
      
      // Build middleware stack
      this.buildMiddlewareStack();
      
      this.isInitialized = true;
      console.log('🎉 MLG CDN System fully initialized!');
      
    } catch (error) {
      console.error('❌ CDN system initialization failed:', error);
      throw error;
    }
  }

  /**
   * Register CDN providers with failover manager
   */
  registerCDNProviders() {
    const config = CDN_CONFIGS[this.config.environment];
    
    if (config.primary) {
      this.managers.failover.registerProvider('primary', {
        ...config.primary,
        priority: 1
      });
    }
    
    if (config.fallback) {
      this.managers.failover.registerProvider('fallback', {
        ...config.fallback,
        priority: 2
      });
    }
  }

  /**
   * Register cache invalidation providers
   */
  registerInvalidationProviders() {
    const config = CDN_CONFIGS[this.config.environment];
    
    // Register Cloudflare provider
    if (config.primary?.provider === 'cloudflare') {
      this.managers.cacheInvalidation.registerProvider('cloudflare', {
        type: 'cloudflare',
        apiKey: process.env.CLOUDFLARE_API_TOKEN,
        zoneId: process.env.CLOUDFLARE_ZONE_ID,
        baseUrl: config.primary.baseUrl
      });
    }
    
    // Register AWS CloudFront provider
    if (config.fallback?.provider === 'aws_cloudfront') {
      this.managers.cacheInvalidation.registerProvider('cloudfront', {
        type: 'aws_cloudfront',
        distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
        apiKey: process.env.AWS_ACCESS_KEY_ID,
        apiSecret: process.env.AWS_SECRET_ACCESS_KEY
      });
    }
  }

  /**
   * Build middleware stack in correct order
   */
  buildMiddlewareStack() {
    this.middlewareStack = [];
    
    // 1. Security (first - protect against attacks)
    if (this.managers.security) {
      this.middlewareStack.push(cdnSecurityMiddleware());
    }
    
    // 2. Monitoring (early - track all requests)
    if (this.managers.monitoring) {
      this.middlewareStack.push(cdnMonitoringMiddleware());
    }
    
    // 3. Geographic routing (determine optimal region)
    this.middlewareStack.push(geoRoutingMiddleware());
    
    // 4. Intelligent routing (advanced routing decisions)
    if (this.managers.intelligentRouting) {
      this.middlewareStack.push(intelligentRoutingMiddleware());
    }
    
    // 5. Gaming media handling (specialized gaming content)
    if (this.managers.gamingMedia) {
      this.middlewareStack.push(gamingMediaMiddleware());
    }
    
    // 6. Media optimization (optimize content)
    this.middlewareStack.push(mediaOptimizationMiddleware());
    
    // 7. Cache invalidation (automatic invalidation)
    this.middlewareStack.push(cacheInvalidationMiddleware());
    
    // 8. CDN URL injection (final - add CDN helpers)
    this.middlewareStack.push(cdnMiddleware);
    
    console.log(`📦 Built middleware stack with ${this.middlewareStack.length} layers`);
  }

  /**
   * Get Express middleware stack
   * @returns {Array} - Array of middleware functions
   */
  getExpressMiddleware() {
    if (!this.isInitialized) {
      throw new Error('CDN system not initialized. Call initialize() first.');
    }
    
    return this.middlewareStack;
  }

  /**
   * Get CDN URL for asset
   * @param {string} assetPath - Asset path
   * @param {Object} options - CDN options
   * @returns {string} - CDN URL
   */
  getCDNUrl(assetPath, options = {}) {
    if (!this.isInitialized) {
      console.warn('CDN system not initialized, returning original path');
      return assetPath;
    }
    
    return getCDNUrl(assetPath, options);
  }

  /**
   * Optimize media asset
   * @param {string|Buffer} input - Input asset
   * @param {Object} options - Optimization options
   * @returns {Promise<Object>} - Optimization result
   */
  async optimizeMedia(input, options = {}) {
    if (!this.managers.mediaOptimizer) {
      throw new Error('Media optimizer not available');
    }
    
    const { type } = options;
    
    switch (type) {
      case 'image':
        return await this.managers.mediaOptimizer.optimizeImage(input, options);
      case 'video':
        return await this.managers.mediaOptimizer.optimizeVideo(input, options);
      case 'audio':
        return await this.managers.mediaOptimizer.optimizeAudio(input, options);
      case 'gaming':
        return await this.managers.mediaOptimizer.processGamingAsset(input, options);
      default:
        throw new Error(`Unsupported media type: ${type}`);
    }
  }

  /**
   * Invalidate cached content
   * @param {string|Array} paths - Paths to invalidate
   * @param {Object} options - Invalidation options
   * @returns {Promise<Object>} - Invalidation result
   */
  async invalidateCache(paths, options = {}) {
    if (!this.managers.cacheInvalidation) {
      throw new Error('Cache invalidation not available');
    }
    
    return await this.managers.cacheInvalidation.invalidatePaths(paths, options);
  }

  /**
   * Invalidate cache by tags
   * @param {string|Array} tags - Tags to invalidate
   * @param {Object} options - Invalidation options
   * @returns {Promise<Object>} - Invalidation result
   */
  async invalidateCacheByTags(tags, options = {}) {
    if (!this.managers.cacheInvalidation) {
      throw new Error('Cache invalidation not available');
    }
    
    return await this.managers.cacheInvalidation.invalidateByTags(tags, options);
  }

  /**
   * Get comprehensive system status
   * @returns {Object} - System status
   */
  getSystemStatus() {
    const status = {
      initialized: this.isInitialized,
      environment: this.config.environment,
      timestamp: new Date().toISOString(),
      managers: {}
    };
    
    // CDN Manager status
    if (this.managers.cdn) {
      status.managers.cdn = {
        active: true,
        performanceMetrics: this.managers.cdn.getPerformanceMetrics()
      };
    }
    
    // Failover status
    if (this.managers.failover) {
      status.managers.failover = this.managers.failover.getStatusReport();
    }
    
    // Security status
    if (this.managers.security) {
      status.managers.security = this.managers.security.getSecurityStatistics();
    }
    
    // Monitoring status
    if (this.managers.monitoring) {
      status.managers.monitoring = {
        realTimeMetrics: this.managers.monitoring.getRealTimeMetrics(),
        alerts: this.managers.monitoring.getActiveAlerts()
      };
    }
    
    // Intelligent routing status
    if (this.managers.intelligentRouting) {
      status.managers.intelligentRouting = this.managers.intelligentRouting.getRoutingStatistics();
    }
    
    // Gaming media status
    if (this.managers.gamingMedia) {
      status.managers.gamingMedia = this.managers.gamingMedia.getStatistics();
    }
    
    // Geo distribution status
    if (this.managers.geoDistribution) {
      status.managers.geoDistribution = this.managers.geoDistribution.getDistributionStats();
    }
    
    return status;
  }

  /**
   * Get performance report
   * @param {Object} timeRange - Time range for report
   * @returns {Object} - Performance report
   */
  getPerformanceReport(timeRange = {}) {
    if (!this.managers.monitoring) {
      return { error: 'Monitoring not enabled' };
    }
    
    return {
      summary: this.managers.monitoring.getPerformanceSummary(timeRange),
      realTime: this.managers.monitoring.getRealTimeMetrics(),
      historical: this.managers.monitoring.getHistoricalMetrics(timeRange),
      alerts: this.managers.monitoring.getActiveAlerts()
    };
  }

  /**
   * Get cost analysis
   * @param {Object} filters - Cost filters
   * @returns {Object} - Cost analysis
   */
  getCostAnalysis(filters = {}) {
    if (!this.managers.monitoring) {
      return { error: 'Monitoring not enabled' };
    }
    
    return this.managers.monitoring.getCostBreakdown(filters);
  }

  /**
   * Shutdown CDN system gracefully
   * @returns {Promise<void>}
   */
  async shutdown() {
    if (!this.isInitialized) {
      return;
    }
    
    console.log('🔄 Shutting down CDN system...');
    
    // Shutdown all managers
    const shutdownPromises = Object.values(this.managers)
      .filter(manager => manager && typeof manager.shutdown === 'function')
      .map(manager => manager.shutdown());
    
    await Promise.allSettled(shutdownPromises);
    
    this.isInitialized = false;
    console.log('✅ CDN system shutdown complete');
  }

  /**
   * Health check endpoint
   * @returns {Object} - Health status
   */
  healthCheck() {
    return {
      status: this.isInitialized ? 'healthy' : 'initializing',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      components: {
        cdn: !!this.managers.cdn,
        failover: !!this.managers.failover,
        security: !!this.managers.security,
        monitoring: !!this.managers.monitoring,
        intelligentRouting: !!this.managers.intelligentRouting,
        gamingMedia: !!this.managers.gamingMedia
      }
    };
  }
}

/**
 * Create default CDN integration instance
 */
export const cdnIntegration = new CDNIntegration();

/**
 * Initialize CDN system with environment-based configuration
 * @param {Object} config - Configuration overrides
 * @returns {Promise<CDNIntegration>} - Initialized CDN system
 */
export async function initializeCDN(config = {}) {
  const integration = new CDNIntegration(config);
  await integration.initialize();
  return integration;
}

/**
 * Express application integration helper
 * @param {Object} app - Express application
 * @param {Object} config - CDN configuration
 * @returns {Promise<void>}
 */
export async function integrateCDNWithExpress(app, config = {}) {
  const integration = new CDNIntegration(config);
  await integration.initialize();
  
  // Add CDN middleware to Express app
  const middlewareStack = integration.getExpressMiddleware();
  middlewareStack.forEach(middleware => {
    app.use(middleware);
  });
  
  // Add CDN API endpoints
  app.get('/cdn/status', (req, res) => {
    res.json(integration.getSystemStatus());
  });
  
  app.get('/cdn/health', (req, res) => {
    res.json(integration.healthCheck());
  });
  
  app.get('/cdn/performance', (req, res) => {
    const timeRange = {
      startTime: req.query.start ? parseInt(req.query.start) : undefined,
      endTime: req.query.end ? parseInt(req.query.end) : undefined
    };
    res.json(integration.getPerformanceReport(timeRange));
  });
  
  app.get('/cdn/costs', (req, res) => {
    const filters = {
      provider: req.query.provider,
      region: req.query.region
    };
    res.json(integration.getCostAnalysis(filters));
  });
  
  // Add invalidation endpoint
  app.post('/cdn/invalidate', async (req, res) => {
    try {
      const { paths, tags, options } = req.body;
      
      let result;
      if (paths) {
        result = await integration.invalidateCache(paths, options);
      } else if (tags) {
        result = await integration.invalidateCacheByTags(tags, options);
      } else {
        return res.status(400).json({ error: 'Must specify paths or tags to invalidate' });
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  console.log('🔗 CDN integrated with Express application');
}

// Export all managers and configurations for direct access
export {
  // Managers
  CDNManager,
  CDNFailoverManager,
  MediaOptimizer,
  GeoDistributionManager,
  CacheInvalidationManager,
  CDNSecurityManager,
  CDNMonitoringManager,
  IntelligentRoutingManager,
  GamingMediaHandler,
  
  // Manager instances
  cdnManager,
  cdnFailoverManager,
  mediaOptimizer,
  geoDistributionManager,
  cacheInvalidationManager,
  cdnSecurityManager,
  cdnMonitoringManager,
  intelligentRoutingManager,
  gamingMediaHandler,
  
  // Middleware
  cdnMiddleware,
  mediaOptimizationMiddleware,
  geoRoutingMiddleware,
  cacheInvalidationMiddleware,
  cdnSecurityMiddleware,
  cdnMonitoringMiddleware,
  intelligentRoutingMiddleware,
  gamingMediaMiddleware,
  
  // Configurations
  CDN_CONFIGS,
  CONTENT_TYPE_MAPPING,
  GEO_ROUTING_CONFIG,
  CACHE_STRATEGIES,
  SECURITY_CONFIG,
  PERFORMANCE_CONFIG,
  MONITORING_CONFIG,
  
  // Utilities
  getCDNUrl
};