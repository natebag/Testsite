/**
 * @fileoverview CDN Manager for MLG Gaming Platform
 * Handles intelligent routing, failover, and content delivery optimization
 */

import { 
  CDN_CONFIGS, 
  CONTENT_TYPE_MAPPING, 
  GEO_ROUTING_CONFIG, 
  CACHE_STRATEGIES,
  SECURITY_CONFIG,
  PERFORMANCE_CONFIG 
} from './cdn-config.js';

/**
 * Main CDN Manager class for handling content delivery
 */
export class CDNManager {
  constructor(environment = 'production', options = {}) {
    this.environment = environment;
    this.config = CDN_CONFIGS[environment];
    this.options = { ...options };
    
    this.healthStatus = new Map();
    this.performanceMetrics = new Map();
    this.failoverActive = false;
    this.userLocationCache = new Map();
    
    // Initialize health monitoring
    this.initializeHealthMonitoring();
  }

  /**
   * Get CDN URL for a given asset
   * @param {string} assetPath - Path to the asset
   * @param {string} contentType - MIME type of the content
   * @param {Object} options - Additional options
   * @returns {string} - CDN URL
   */
  getCDNUrl(assetPath, contentType = null, options = {}) {
    try {
      // Determine content zone
      const zone = this.getContentZone(assetPath, contentType);
      
      // Get user location for geo-routing
      const userLocation = options.userLocation || this.getUserLocation(options.userIP);
      
      // Select optimal CDN endpoint
      const endpoint = this.selectOptimalEndpoint(zone, userLocation);
      
      // Apply security and optimization parameters
      const url = this.buildSecureUrl(endpoint, assetPath, options);
      
      // Track request for analytics
      this.trackRequest(zone, endpoint, contentType);
      
      return url;
    } catch (error) {
      console.error('CDN URL generation failed:', error);
      return this.getFallbackUrl(assetPath);
    }
  }

  /**
   * Determine content zone based on asset path and type
   * @param {string} assetPath - Asset path
   * @param {string} contentType - Content MIME type
   * @returns {string} - Zone name
   */
  getContentZone(assetPath, contentType) {
    // Check content type mapping first
    if (contentType && CONTENT_TYPE_MAPPING[contentType]) {
      return CONTENT_TYPE_MAPPING[contentType];
    }
    
    // Fallback to path-based detection
    const pathSegments = assetPath.toLowerCase().split('/');
    
    if (pathSegments.includes('textures') || assetPath.includes('.texture')) {
      return 'textures';
    }
    if (pathSegments.includes('audio') || /\.(mp3|wav|ogg|m4a)$/i.test(assetPath)) {
      return 'audio';
    }
    if (pathSegments.includes('video') || /\.(mp4|webm|mov|avi)$/i.test(assetPath)) {
      return 'video';
    }
    if (pathSegments.includes('gaming') || /\.(unity3d|pak|asset)$/i.test(assetPath)) {
      return 'gaming';
    }
    if (/\.(css|js|json|woff|woff2|ttf)$/i.test(assetPath)) {
      return 'static';
    }
    if (/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(assetPath)) {
      return 'media';
    }
    
    return 'static'; // default
  }

  /**
   * Select optimal CDN endpoint based on location and health
   * @param {string} zone - Content zone
   * @param {Object} userLocation - User location data
   * @returns {string} - CDN endpoint URL
   */
  selectOptimalEndpoint(zone, userLocation) {
    const config = this.config.primary;
    
    // Check if primary CDN is healthy
    if (!this.failoverActive && this.isEndpointHealthy(config.baseUrl)) {
      const zoneUrl = config.zones[zone] || config.zones.static || config.baseUrl;
      return this.applyGeoRouting(zoneUrl, userLocation);
    }
    
    // Fallback to secondary CDN
    if (this.config.fallback) {
      const fallbackConfig = this.config.fallback;
      const zoneUrl = fallbackConfig.zones[zone] || fallbackConfig.zones.static || fallbackConfig.baseUrl;
      return this.applyGeoRouting(zoneUrl, userLocation);
    }
    
    // Ultimate fallback to primary without health check
    return config.zones[zone] || config.baseUrl;
  }

  /**
   * Apply geographic routing to CDN URL
   * @param {string} baseUrl - Base CDN URL
   * @param {Object} userLocation - User location data
   * @returns {string} - Geo-optimized URL
   */
  applyGeoRouting(baseUrl, userLocation) {
    if (!userLocation || this.environment === 'development') {
      return baseUrl;
    }
    
    const region = this.getUserRegion(userLocation);
    const regionConfig = GEO_ROUTING_CONFIG.regions[region];
    
    if (regionConfig) {
      // Apply regional subdomain if available
      const regionalUrl = baseUrl.replace('://', `://${regionConfig.primary}.`);
      return regionalUrl;
    }
    
    return baseUrl;
  }

  /**
   * Build secure URL with authentication and optimization parameters
   * @param {string} endpoint - CDN endpoint
   * @param {string} assetPath - Asset path
   * @param {Object} options - URL options
   * @returns {string} - Secure CDN URL
   */
  buildSecureUrl(endpoint, assetPath, options = {}) {
    let url = `${endpoint}/${assetPath.replace(/^\//, '')}`;
    const params = new URLSearchParams();
    
    // Add versioning
    if (options.version) {
      params.append('v', options.version);
    }
    
    // Add optimization parameters
    if (options.optimize !== false) {
      this.addOptimizationParams(params, assetPath, options);
    }
    
    // Add authentication if required
    if (options.requireAuth || this.requiresAuthentication(assetPath)) {
      this.addAuthenticationParams(params, assetPath, options);
    }
    
    // Add cache busting if needed
    if (options.cacheBust) {
      params.append('cb', Date.now().toString());
    }
    
    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  /**
   * Add optimization parameters to URL
   * @param {URLSearchParams} params - URL parameters
   * @param {string} assetPath - Asset path
   * @param {Object} options - Optimization options
   */
  addOptimizationParams(params, assetPath, options) {
    // Image optimization
    if (this.isImageAsset(assetPath)) {
      if (options.width) params.append('w', options.width);
      if (options.height) params.append('h', options.height);
      if (options.quality) params.append('q', options.quality);
      if (options.format) params.append('f', options.format);
      
      // Auto format selection
      if (PERFORMANCE_CONFIG.image_optimization.auto_webp) {
        params.append('auto', 'webp');
      }
      if (PERFORMANCE_CONFIG.image_optimization.auto_avif) {
        params.append('auto', 'avif');
      }
    }
    
    // Video optimization
    if (this.isVideoAsset(assetPath)) {
      if (options.bitrate) params.append('br', options.bitrate);
      if (options.resolution) params.append('res', options.resolution);
    }
    
    // Compression
    if (PERFORMANCE_CONFIG.compression.gzip.enabled) {
      params.append('compress', 'gzip');
    }
  }

  /**
   * Add authentication parameters to URL
   * @param {URLSearchParams} params - URL parameters
   * @param {string} assetPath - Asset path
   * @param {Object} options - Authentication options
   */
  addAuthenticationParams(params, assetPath, options) {
    const secConfig = SECURITY_CONFIG.authentication;
    
    if (secConfig.signed_urls.enabled) {
      const expiry = Math.floor(Date.now() / 1000) + secConfig.signed_urls.expiry;
      const signature = this.generateSignature(assetPath, expiry, options.apiKey);
      
      params.append('expires', expiry.toString());
      params.append('signature', signature);
    }
    
    if (options.apiKey) {
      params.append('key', options.apiKey);
    }
  }

  /**
   * Generate URL signature for authentication
   * @param {string} assetPath - Asset path
   * @param {number} expiry - Expiry timestamp
   * @param {string} apiKey - API key
   * @returns {string} - Generated signature
   */
  generateSignature(assetPath, expiry, apiKey) {
    const crypto = require('crypto');
    const data = `${assetPath}:${expiry}:${apiKey}`;
    return crypto.createHmac('sha256', process.env.CDN_SECRET_KEY || 'default-secret')
                 .update(data)
                 .digest('hex');
  }

  /**
   * Get user location from IP address
   * @param {string} userIP - User's IP address
   * @returns {Object} - Location data
   */
  getUserLocation(userIP) {
    if (!userIP || userIP === '127.0.0.1' || userIP.startsWith('192.168.')) {
      return null;
    }
    
    // Check cache first
    if (this.userLocationCache.has(userIP)) {
      return this.userLocationCache.get(userIP);
    }
    
    // In production, this would integrate with a GeoIP service
    // For now, return mock data based on common patterns
    const location = this.mockGeoLocation(userIP);
    
    // Cache the result
    this.userLocationCache.set(userIP, location);
    
    // Clean cache periodically
    if (this.userLocationCache.size > 10000) {
      this.cleanLocationCache();
    }
    
    return location;
  }

  /**
   * Mock geo-location for development (replace with real service in production)
   * @param {string} userIP - User's IP address
   * @returns {Object} - Mock location data
   */
  mockGeoLocation(userIP) {
    // Simple mock based on IP patterns - replace with real GeoIP service
    const ipParts = userIP.split('.').map(Number);
    const region = ipParts[0] % 4;
    
    const regions = ['us-east', 'us-west', 'europe', 'asia-pacific'];
    const countries = ['US', 'US', 'DE', 'SG'];
    
    return {
      country: countries[region],
      region: regions[region],
      latitude: 37.7749 + (region * 10),
      longitude: -122.4194 + (region * 20)
    };
  }

  /**
   * Get user's region based on location data
   * @param {Object} location - Location data
   * @returns {string} - Region name
   */
  getUserRegion(location) {
    if (!location) return GEO_ROUTING_CONFIG.default_region;
    
    // Find matching region based on country
    for (const [regionName, config] of Object.entries(GEO_ROUTING_CONFIG.regions)) {
      if (config.countries.includes(location.country)) {
        return regionName;
      }
    }
    
    return GEO_ROUTING_CONFIG.default_region;
  }

  /**
   * Check if endpoint is healthy
   * @param {string} endpoint - CDN endpoint URL
   * @returns {boolean} - Health status
   */
  isEndpointHealthy(endpoint) {
    const status = this.healthStatus.get(endpoint);
    if (!status) return true; // Assume healthy if no data
    
    return status.healthy && (Date.now() - status.lastCheck) < 300000; // 5 minutes
  }

  /**
   * Initialize health monitoring for CDN endpoints
   */
  initializeHealthMonitoring() {
    const endpoints = [
      this.config.primary.baseUrl,
      ...(this.config.fallback ? [this.config.fallback.baseUrl] : [])
    ];
    
    endpoints.forEach(endpoint => {
      this.healthStatus.set(endpoint, {
        healthy: true,
        lastCheck: Date.now(),
        responseTime: 0,
        errorCount: 0
      });
    });
    
    // Start periodic health checks
    this.startHealthChecks();
  }

  /**
   * Start periodic health checks for CDN endpoints
   */
  startHealthChecks() {
    setInterval(() => {
      this.performHealthChecks();
    }, 60000); // Check every minute
  }

  /**
   * Perform health checks on all CDN endpoints
   */
  async performHealthChecks() {
    const endpoints = Array.from(this.healthStatus.keys());
    
    const healthChecks = endpoints.map(async (endpoint) => {
      try {
        const start = Date.now();
        const response = await fetch(`${endpoint}/health`, {
          method: 'HEAD',
          timeout: 5000
        });
        
        const responseTime = Date.now() - start;
        const healthy = response.ok && responseTime < 2000;
        
        this.healthStatus.set(endpoint, {
          healthy,
          lastCheck: Date.now(),
          responseTime,
          errorCount: healthy ? 0 : this.healthStatus.get(endpoint).errorCount + 1
        });
        
        // Trigger failover if primary is unhealthy
        if (endpoint === this.config.primary.baseUrl && !healthy) {
          this.handleFailover();
        }
      } catch (error) {
        const status = this.healthStatus.get(endpoint);
        this.healthStatus.set(endpoint, {
          ...status,
          healthy: false,
          lastCheck: Date.now(),
          errorCount: status.errorCount + 1
        });
      }
    });
    
    await Promise.all(healthChecks);
  }

  /**
   * Handle CDN failover
   */
  handleFailover() {
    if (!this.failoverActive) {
      console.warn('CDN failover activated - switching to backup provider');
      this.failoverActive = true;
      
      // Schedule recovery check
      setTimeout(() => {
        this.checkFailoverRecovery();
      }, 300000); // Check recovery after 5 minutes
    }
  }

  /**
   * Check if primary CDN has recovered
   */
  checkFailoverRecovery() {
    const primaryHealth = this.healthStatus.get(this.config.primary.baseUrl);
    if (primaryHealth && primaryHealth.healthy) {
      console.log('CDN primary provider recovered - switching back');
      this.failoverActive = false;
    } else {
      // Schedule another recovery check
      setTimeout(() => {
        this.checkFailoverRecovery();
      }, 300000);
    }
  }

  /**
   * Get fallback URL for failed CDN requests
   * @param {string} assetPath - Asset path
   * @returns {string} - Fallback URL
   */
  getFallbackUrl(assetPath) {
    if (this.environment === 'development') {
      return `http://localhost:8080${assetPath.startsWith('/') ? '' : '/'}${assetPath}`;
    }
    
    // Use origin server as ultimate fallback
    return `https://origin.mlg.clan${assetPath.startsWith('/') ? '' : '/'}${assetPath}`;
  }

  /**
   * Track CDN request for analytics
   * @param {string} zone - Content zone
   * @param {string} endpoint - CDN endpoint
   * @param {string} contentType - Content type
   */
  trackRequest(zone, endpoint, contentType) {
    const key = `${zone}:${endpoint}`;
    const current = this.performanceMetrics.get(key) || {
      requests: 0,
      bytes: 0,
      errors: 0,
      avgResponseTime: 0
    };
    
    current.requests++;
    this.performanceMetrics.set(key, current);
  }

  /**
   * Helper methods for asset type detection
   */
  isImageAsset(assetPath) {
    return /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(assetPath);
  }

  isVideoAsset(assetPath) {
    return /\.(mp4|webm|mov|avi|mkv)$/i.test(assetPath);
  }

  isAudioAsset(assetPath) {
    return /\.(mp3|wav|ogg|m4a|flac)$/i.test(assetPath);
  }

  requiresAuthentication(assetPath) {
    // Define paths that require authentication
    const protectedPaths = ['/private/', '/user/', '/clan/private/'];
    return protectedPaths.some(path => assetPath.includes(path));
  }

  /**
   * Clean location cache to prevent memory leaks
   */
  cleanLocationCache() {
    // Remove oldest 50% of entries
    const entries = Array.from(this.userLocationCache.entries());
    const toRemove = Math.floor(entries.length / 2);
    
    for (let i = 0; i < toRemove; i++) {
      this.userLocationCache.delete(entries[i][0]);
    }
  }

  /**
   * Get performance metrics
   * @returns {Object} - Current performance metrics
   */
  getPerformanceMetrics() {
    return {
      healthStatus: Object.fromEntries(this.healthStatus),
      performanceMetrics: Object.fromEntries(this.performanceMetrics),
      failoverActive: this.failoverActive,
      cacheSize: this.userLocationCache.size
    };
  }

  /**
   * Invalidate cached content
   * @param {string|Array} paths - Paths to invalidate
   * @returns {Promise} - Invalidation promise
   */
  async invalidateCache(paths) {
    const pathArray = Array.isArray(paths) ? paths : [paths];
    
    // This would integrate with actual CDN APIs in production
    console.log('Cache invalidation requested for paths:', pathArray);
    
    // Mock invalidation result
    return {
      success: true,
      invalidated: pathArray,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Global CDN manager instance
 */
export const cdnManager = new CDNManager(process.env.NODE_ENV || 'development');

/**
 * Helper function to get CDN URL for assets
 * @param {string} assetPath - Asset path
 * @param {Object} options - Options
 * @returns {string} - CDN URL
 */
export function getCDNUrl(assetPath, options = {}) {
  return cdnManager.getCDNUrl(assetPath, null, options);
}

/**
 * Express middleware for CDN URL injection
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Next middleware
 */
export function cdnMiddleware(req, res, next) {
  // Add CDN helper to response locals
  res.locals.cdnUrl = (assetPath, options = {}) => {
    return cdnManager.getCDNUrl(assetPath, null, {
      ...options,
      userIP: req.ip,
      userAgent: req.get('user-agent')
    });
  };
  
  next();
}