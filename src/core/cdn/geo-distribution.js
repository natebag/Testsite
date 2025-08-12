/**
 * @fileoverview Geographic Content Distribution System
 * Handles intelligent geographic routing and edge server management
 */

import { GEO_ROUTING_CONFIG } from './cdn-config.js';

/**
 * Geographic Distribution Manager
 */
export class GeoDistributionManager {
  constructor(config = {}) {
    this.config = {
      latencyThreshold: config.latencyThreshold || 200, // milliseconds
      healthCheckInterval: config.healthCheckInterval || 60000, // 1 minute
      routingStrategy: config.routingStrategy || 'latency', // 'latency', 'proximity', 'load'
      fallbackStrategy: config.fallbackStrategy || 'cascade', // 'cascade', 'random', 'round_robin'
      enableDynamicRouting: config.enableDynamicRouting !== false,
      ...config
    };
    
    this.edgeServers = new Map();
    this.regionHealth = new Map();
    this.latencyMetrics = new Map();
    this.loadBalancingData = new Map();
    this.userLocationCache = new Map();
    
    this.initializeEdgeServers();
    this.startHealthMonitoring();
  }

  /**
   * Initialize edge servers for all regions
   */
  initializeEdgeServers() {
    const regions = GEO_ROUTING_CONFIG.regions;
    
    Object.entries(regions).forEach(([regionName, regionConfig]) => {
      this.edgeServers.set(regionName, {
        primary: {
          endpoint: `https://${regionConfig.primary}.mlg.clan`,
          location: regionConfig.primary,
          capacity: 1000, // requests per second
          currentLoad: 0,
          status: 'healthy'
        },
        fallbacks: regionConfig.fallback.map((fallbackRegion, index) => ({
          endpoint: `https://${fallbackRegion}.mlg.clan`,
          location: fallbackRegion,
          capacity: 800,
          currentLoad: 0,
          status: 'healthy',
          priority: index + 1
        }))
      });
      
      this.regionHealth.set(regionName, {
        isHealthy: true,
        lastCheck: Date.now(),
        avgLatency: regionConfig.latency_threshold * 0.7,
        successRate: 100,
        activeConnections: 0
      });
      
      this.latencyMetrics.set(regionName, {
        samples: [],
        average: regionConfig.latency_threshold * 0.7,
        p95: regionConfig.latency_threshold,
        p99: regionConfig.latency_threshold * 1.2,
        lastUpdated: Date.now()
      });
      
      this.loadBalancingData.set(regionName, {
        totalRequests: 0,
        activeRequests: 0,
        queuedRequests: 0,
        rejectedRequests: 0,
        lastBalancingAction: Date.now()
      });
    });
    
    console.log(`Initialized ${this.edgeServers.size} edge server regions`);
  }

  /**
   * Determine optimal edge server for user request
   * @param {Object} userContext - User context including location, device, etc.
   * @param {Object} contentInfo - Information about requested content
   * @returns {Object} - Optimal edge server configuration
   */
  selectOptimalEdgeServer(userContext = {}, contentInfo = {}) {
    try {
      // Get user's geographic region
      const userRegion = this.getUserRegion(userContext);
      
      // Apply routing strategy
      const candidates = this.getCandidateServers(userRegion, contentInfo);
      
      if (candidates.length === 0) {
        throw new Error('No healthy edge servers available');
      }
      
      // Select best candidate based on strategy
      const selectedServer = this.applyRoutingStrategy(candidates, userContext, contentInfo);
      
      // Update load balancing metrics
      this.updateLoadMetrics(selectedServer.region, selectedServer);
      
      return {
        endpoint: selectedServer.endpoint,
        region: selectedServer.region,
        location: selectedServer.location,
        latency: selectedServer.estimatedLatency,
        loadFactor: selectedServer.loadFactor,
        contentOptimizations: this.getContentOptimizations(selectedServer, contentInfo)
      };
    } catch (error) {
      console.error('Edge server selection failed:', error);
      return this.getFallbackServer(userContext);
    }
  }

  /**
   * Get user's geographic region from context
   * @param {Object} userContext - User context
   * @returns {string} - User's region
   */
  getUserRegion(userContext) {
    // Check cache first
    if (userContext.ip && this.userLocationCache.has(userContext.ip)) {
      const cachedLocation = this.userLocationCache.get(userContext.ip);
      return this.determineRegionFromLocation(cachedLocation);
    }
    
    // Extract location from various sources
    let location = null;
    
    if (userContext.coordinates) {
      location = {
        latitude: userContext.coordinates.lat,
        longitude: userContext.coordinates.lon,
        country: userContext.country
      };
    } else if (userContext.country) {
      location = { country: userContext.country };
    } else if (userContext.ip) {
      location = this.geolocateIP(userContext.ip);
    }
    
    if (!location) {
      return GEO_ROUTING_CONFIG.default_region;
    }
    
    // Cache the location
    if (userContext.ip) {
      this.userLocationCache.set(userContext.ip, location);
    }
    
    return this.determineRegionFromLocation(location);
  }

  /**
   * Determine region from location data
   * @param {Object} location - Location data
   * @returns {string} - Region name
   */
  determineRegionFromLocation(location) {
    if (!location.country) {
      return GEO_ROUTING_CONFIG.default_region;
    }
    
    // Find region by country code
    for (const [regionName, regionConfig] of Object.entries(GEO_ROUTING_CONFIG.regions)) {
      if (regionConfig.countries.includes(location.country) ||
          regionConfig.countries.some(country => country.startsWith(location.country))) {
        return regionName;
      }
    }
    
    // Fallback to proximity-based matching if coordinates available
    if (location.latitude && location.longitude) {
      return this.findNearestRegionByProximity(location.latitude, location.longitude);
    }
    
    return GEO_ROUTING_CONFIG.default_region;
  }

  /**
   * Find nearest region by geographic proximity
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {string} - Nearest region name
   */
  findNearestRegionByProximity(lat, lon) {
    const regionCenters = {
      'us-east': { lat: 39.0458, lon: -76.6413 },
      'us-west': { lat: 37.7749, lon: -122.4194 },
      'europe': { lat: 50.1109, lon: 8.6821 },
      'asia-pacific': { lat: 1.3521, lon: 103.8198 }
    };
    
    let nearestRegion = GEO_ROUTING_CONFIG.default_region;
    let shortestDistance = Infinity;
    
    for (const [region, center] of Object.entries(regionCenters)) {
      const distance = this.calculateDistance(lat, lon, center.lat, center.lon);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestRegion = region;
      }
    }
    
    return nearestRegion;
  }

  /**
   * Calculate distance between two points using Haversine formula
   * @param {number} lat1 - First point latitude
   * @param {number} lon1 - First point longitude  
   * @param {number} lat2 - Second point latitude
   * @param {number} lon2 - Second point longitude
   * @returns {number} - Distance in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get candidate edge servers for a region
   * @param {string} userRegion - User's region
   * @param {Object} contentInfo - Content information
   * @returns {Array} - Array of candidate servers
   */
  getCandidateServers(userRegion, contentInfo = {}) {
    const candidates = [];
    const regionalServers = this.edgeServers.get(userRegion);
    const regionHealth = this.regionHealth.get(userRegion);
    
    if (!regionalServers || !regionHealth) {
      // Fallback to other regions
      return this.getAllHealthyServers();
    }
    
    // Add primary server if healthy
    if (regionHealth.isHealthy && regionalServers.primary.status === 'healthy') {
      candidates.push({
        ...regionalServers.primary,
        region: userRegion,
        type: 'primary',
        estimatedLatency: regionHealth.avgLatency,
        loadFactor: regionalServers.primary.currentLoad / regionalServers.primary.capacity
      });
    }
    
    // Add healthy fallback servers
    regionalServers.fallbacks
      .filter(server => server.status === 'healthy')
      .forEach(server => {
        candidates.push({
          ...server,
          region: userRegion,
          type: 'fallback',
          estimatedLatency: regionHealth.avgLatency * (1 + server.priority * 0.1),
          loadFactor: server.currentLoad / server.capacity
        });
      });
    
    // Add servers from nearby regions if enabled
    if (this.config.enableDynamicRouting) {
      const nearbyRegionServers = this.getNearbyRegionServers(userRegion, contentInfo);
      candidates.push(...nearbyRegionServers);
    }
    
    return candidates.filter(server => 
      server.loadFactor < 0.9 && // Not overloaded
      server.estimatedLatency < this.config.latencyThreshold
    );
  }

  /**
   * Get servers from nearby regions
   * @param {string} userRegion - User's primary region
   * @param {Object} contentInfo - Content information
   * @returns {Array} - Nearby region servers
   */
  getNearbyRegionServers(userRegion, contentInfo) {
    const nearbyServers = [];
    const userRegionConfig = GEO_ROUTING_CONFIG.regions[userRegion];
    
    if (!userRegionConfig) return nearbyServers;
    
    // Consider fallback regions as nearby
    userRegionConfig.fallback.forEach(nearbyRegion => {
      const nearbyRegionName = this.findRegionByPrimary(nearbyRegion);
      if (nearbyRegionName) {
        const servers = this.edgeServers.get(nearbyRegionName);
        const health = this.regionHealth.get(nearbyRegionName);
        
        if (servers && health && health.isHealthy && servers.primary.status === 'healthy') {
          nearbyServers.push({
            ...servers.primary,
            region: nearbyRegionName,
            type: 'nearby',
            estimatedLatency: health.avgLatency * 1.3, // Penalty for cross-region
            loadFactor: servers.primary.currentLoad / servers.primary.capacity
          });
        }
      }
    });
    
    return nearbyServers;
  }

  /**
   * Find region name by primary server identifier
   * @param {string} primaryIdentifier - Primary server identifier
   * @returns {string|null} - Region name
   */
  findRegionByPrimary(primaryIdentifier) {
    for (const [regionName, regionConfig] of Object.entries(GEO_ROUTING_CONFIG.regions)) {
      if (regionConfig.primary === primaryIdentifier) {
        return regionName;
      }
    }
    return null;
  }

  /**
   * Get all healthy servers across regions
   * @returns {Array} - All healthy servers
   */
  getAllHealthyServers() {
    const healthyServers = [];
    
    for (const [region, servers] of this.edgeServers) {
      const health = this.regionHealth.get(region);
      if (!health || !health.isHealthy) continue;
      
      if (servers.primary.status === 'healthy') {
        healthyServers.push({
          ...servers.primary,
          region,
          type: 'cross-region',
          estimatedLatency: health.avgLatency * 1.5,
          loadFactor: servers.primary.currentLoad / servers.primary.capacity
        });
      }
      
      servers.fallbacks
        .filter(server => server.status === 'healthy')
        .forEach(server => {
          healthyServers.push({
            ...server,
            region,
            type: 'cross-region-fallback',
            estimatedLatency: health.avgLatency * (1.5 + server.priority * 0.1),
            loadFactor: server.currentLoad / server.capacity
          });
        });
    }
    
    return healthyServers;
  }

  /**
   * Apply routing strategy to select best server
   * @param {Array} candidates - Candidate servers
   * @param {Object} userContext - User context
   * @param {Object} contentInfo - Content information
   * @returns {Object} - Selected server
   */
  applyRoutingStrategy(candidates, userContext, contentInfo) {
    switch (this.config.routingStrategy) {
      case 'latency':
        return this.selectByLatency(candidates);
      
      case 'proximity':
        return this.selectByProximity(candidates, userContext);
      
      case 'load':
        return this.selectByLoad(candidates);
      
      case 'hybrid':
        return this.selectByHybrid(candidates, userContext, contentInfo);
      
      default:
        return candidates[0]; // First available
    }
  }

  /**
   * Select server by lowest latency
   * @param {Array} candidates - Candidate servers
   * @returns {Object} - Server with lowest latency
   */
  selectByLatency(candidates) {
    return candidates.reduce((best, current) => 
      current.estimatedLatency < best.estimatedLatency ? current : best
    );
  }

  /**
   * Select server by proximity (geographic distance)
   * @param {Array} candidates - Candidate servers
   * @param {Object} userContext - User context
   * @returns {Object} - Server with best proximity score
   */
  selectByProximity(candidates, userContext) {
    // Prioritize servers in user's region
    const regionalServers = candidates.filter(server => server.type === 'primary' || server.type === 'fallback');
    if (regionalServers.length > 0) {
      return this.selectByLatency(regionalServers);
    }
    
    return this.selectByLatency(candidates);
  }

  /**
   * Select server by load balancing
   * @param {Array} candidates - Candidate servers
   * @returns {Object} - Server with lowest load
   */
  selectByLoad(candidates) {
    return candidates.reduce((best, current) => 
      current.loadFactor < best.loadFactor ? current : best
    );
  }

  /**
   * Select server using hybrid approach
   * @param {Array} candidates - Candidate servers
   * @param {Object} userContext - User context
   * @param {Object} contentInfo - Content information
   * @returns {Object} - Server with best hybrid score
   */
  selectByHybrid(candidates, userContext, contentInfo) {
    const scoredCandidates = candidates.map(server => ({
      ...server,
      score: this.calculateHybridScore(server, userContext, contentInfo)
    }));
    
    return scoredCandidates.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  }

  /**
   * Calculate hybrid score for server selection
   * @param {Object} server - Server candidate
   * @param {Object} userContext - User context
   * @param {Object} contentInfo - Content information
   * @returns {number} - Hybrid score (higher is better)
   */
  calculateHybridScore(server, userContext, contentInfo) {
    // Latency score (lower latency = higher score)
    const latencyScore = Math.max(0, (this.config.latencyThreshold - server.estimatedLatency) / this.config.latencyThreshold);
    
    // Load score (lower load = higher score)
    const loadScore = Math.max(0, 1 - server.loadFactor);
    
    // Region preference score
    const regionScore = server.type === 'primary' ? 1.0 : 
                       server.type === 'fallback' ? 0.8 :
                       server.type === 'nearby' ? 0.6 : 0.4;
    
    // Content optimization score
    const contentScore = this.getContentOptimizationScore(server, contentInfo);
    
    // Weighted hybrid score
    return (latencyScore * 0.4) + 
           (loadScore * 0.3) + 
           (regionScore * 0.2) + 
           (contentScore * 0.1);
  }

  /**
   * Get content optimization score for server
   * @param {Object} server - Server candidate
   * @param {Object} contentInfo - Content information
   * @returns {number} - Content optimization score
   */
  getContentOptimizationScore(server, contentInfo) {
    if (!contentInfo.type) return 1.0;
    
    // Mock scoring based on content type and server capabilities
    const capabilities = server.capabilities || [];
    
    if (contentInfo.type === 'video' && capabilities.includes('video_transcoding')) {
      return 1.0;
    } else if (contentInfo.type === 'image' && capabilities.includes('image_optimization')) {
      return 1.0;
    } else if (contentInfo.type === 'gaming' && capabilities.includes('gaming_assets')) {
      return 1.0;
    }
    
    return 0.8; // Default score
  }

  /**
   * Get fallback server when selection fails
   * @param {Object} userContext - User context
   * @returns {Object} - Fallback server configuration
   */
  getFallbackServer(userContext) {
    console.warn('Using fallback server due to edge server selection failure');
    
    const defaultRegion = GEO_ROUTING_CONFIG.default_region;
    const defaultServers = this.edgeServers.get(defaultRegion);
    
    if (defaultServers && defaultServers.primary) {
      return {
        endpoint: defaultServers.primary.endpoint,
        region: defaultRegion,
        location: defaultServers.primary.location,
        latency: 200, // Conservative estimate
        loadFactor: 0.5,
        contentOptimizations: {}
      };
    }
    
    // Ultimate fallback
    return {
      endpoint: 'https://origin.mlg.clan',
      region: 'origin',
      location: 'origin',
      latency: 300,
      loadFactor: 0.8,
      contentOptimizations: {}
    };
  }

  /**
   * Update load balancing metrics
   * @param {string} region - Region name
   * @param {Object} server - Selected server
   */
  updateLoadMetrics(region, server) {
    const loadData = this.loadBalancingData.get(region);
    if (loadData) {
      loadData.totalRequests++;
      loadData.activeRequests++;
      loadData.lastBalancingAction = Date.now();
    }
    
    // Update server load
    const servers = this.edgeServers.get(region);
    if (servers) {
      if (servers.primary.endpoint === server.endpoint) {
        servers.primary.currentLoad++;
      } else {
        const fallbackServer = servers.fallbacks.find(s => s.endpoint === server.endpoint);
        if (fallbackServer) {
          fallbackServer.currentLoad++;
        }
      }
    }
  }

  /**
   * Get content optimizations for selected server
   * @param {Object} server - Selected server
   * @param {Object} contentInfo - Content information
   * @returns {Object} - Content optimizations
   */
  getContentOptimizations(server, contentInfo) {
    const optimizations = {};
    
    if (contentInfo.type === 'image') {
      optimizations.formats = ['webp', 'avif'];
      optimizations.compression = true;
      optimizations.responsive = true;
    } else if (contentInfo.type === 'video') {
      optimizations.streaming = true;
      optimizations.adaptive_bitrate = true;
      optimizations.formats = ['mp4', 'webm'];
    } else if (contentInfo.type === 'gaming') {
      optimizations.compression = true;
      optimizations.preloading = true;
      optimizations.caching = 'aggressive';
    }
    
    return optimizations;
  }

  /**
   * Start health monitoring for all regions
   */
  startHealthMonitoring() {
    setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health checks on all regions
   */
  async performHealthChecks() {
    const regions = Array.from(this.edgeServers.keys());
    const healthPromises = regions.map(region => this.checkRegionHealth(region));
    
    await Promise.allSettled(healthPromises);
  }

  /**
   * Check health of a specific region
   * @param {string} region - Region to check
   */
  async checkRegionHealth(region) {
    const servers = this.edgeServers.get(region);
    const health = this.regionHealth.get(region);
    
    if (!servers || !health) return;
    
    try {
      // Check primary server
      const primaryLatency = await this.measureLatency(servers.primary.endpoint);
      
      // Check fallback servers
      const fallbackPromises = servers.fallbacks.map(async (server) => {
        try {
          const latency = await this.measureLatency(server.endpoint);
          server.status = 'healthy';
          return latency;
        } catch (error) {
          server.status = 'unhealthy';
          return null;
        }
      });
      
      const fallbackLatencies = await Promise.all(fallbackPromises);
      const healthyFallbacks = fallbackLatencies.filter(l => l !== null);
      
      // Update region health
      health.lastCheck = Date.now();
      health.avgLatency = primaryLatency;
      health.isHealthy = primaryLatency < this.config.latencyThreshold;
      servers.primary.status = health.isHealthy ? 'healthy' : 'unhealthy';
      
      // Update latency metrics
      this.updateLatencyMetrics(region, primaryLatency);
      
    } catch (error) {
      console.error(`Health check failed for region ${region}:`, error);
      health.isHealthy = false;
      health.lastCheck = Date.now();
      servers.primary.status = 'unhealthy';
    }
  }

  /**
   * Measure latency to an endpoint
   * @param {string} endpoint - Endpoint URL
   * @returns {Promise<number>} - Latency in milliseconds
   */
  async measureLatency(endpoint) {
    const start = Date.now();
    
    try {
      const response = await fetch(`${endpoint}/ping`, {
        method: 'HEAD',
        timeout: 5000
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return Date.now() - start;
    } catch (error) {
      throw new Error(`Latency measurement failed: ${error.message}`);
    }
  }

  /**
   * Update latency metrics for a region
   * @param {string} region - Region name
   * @param {number} latency - Measured latency
   */
  updateLatencyMetrics(region, latency) {
    const metrics = this.latencyMetrics.get(region);
    if (!metrics) return;
    
    // Add to samples (keep last 100)
    metrics.samples.push({
      timestamp: Date.now(),
      latency: latency
    });
    
    if (metrics.samples.length > 100) {
      metrics.samples.shift();
    }
    
    // Calculate statistics
    const latencies = metrics.samples.map(s => s.latency).sort((a, b) => a - b);
    metrics.average = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
    metrics.p95 = latencies[Math.floor(latencies.length * 0.95)];
    metrics.p99 = latencies[Math.floor(latencies.length * 0.99)];
    metrics.lastUpdated = Date.now();
  }

  /**
   * Simple IP geolocation (mock implementation)
   * @param {string} ip - IP address
   * @returns {Object} - Location data
   */
  geolocateIP(ip) {
    // This would integrate with a real GeoIP service in production
    // For now, return mock data based on IP patterns
    
    const ipParts = ip.split('.').map(Number);
    if (ipParts.length !== 4) return null;
    
    const region = ipParts[0] % 4;
    const mockData = [
      { country: 'US', latitude: 39.0458, longitude: -76.6413 },
      { country: 'US', latitude: 37.7749, longitude: -122.4194 },
      { country: 'DE', latitude: 50.1109, longitude: 8.6821 },
      { country: 'SG', latitude: 1.3521, longitude: 103.8198 }
    ];
    
    return mockData[region];
  }

  /**
   * Get distribution statistics
   * @returns {Object} - Distribution statistics
   */
  getDistributionStats() {
    const stats = {
      regions: {},
      global: {
        totalServers: 0,
        healthyServers: 0,
        avgLatency: 0,
        totalLoad: 0
      }
    };
    
    for (const [region, servers] of this.edgeServers) {
      const health = this.regionHealth.get(region);
      const metrics = this.latencyMetrics.get(region);
      const loadData = this.loadBalancingData.get(region);
      
      stats.regions[region] = {
        servers: {
          primary: servers.primary,
          fallbacks: servers.fallbacks.length
        },
        health: health,
        latency: metrics,
        load: loadData
      };
      
      // Update global stats
      stats.global.totalServers += 1 + servers.fallbacks.length;
      if (health.isHealthy) {
        stats.global.healthyServers += 1;
      }
      stats.global.avgLatency += health.avgLatency;
      stats.global.totalLoad += loadData.activeRequests;
    }
    
    stats.global.avgLatency /= this.edgeServers.size;
    
    return stats;
  }
}

/**
 * Create and export default geo distribution manager
 */
export const geoDistributionManager = new GeoDistributionManager();

/**
 * Express middleware for geographic routing
 * @param {Object} options - Middleware options
 * @returns {Function} - Express middleware function
 */
export function geoRoutingMiddleware(options = {}) {
  return (req, res, next) => {
    // Extract user context
    const userContext = {
      ip: req.ip || req.connection.remoteAddress,
      country: req.get('cf-ipcountry') || req.get('x-country-code'),
      coordinates: req.get('x-coordinates') ? 
        JSON.parse(req.get('x-coordinates')) : null,
      userAgent: req.get('user-agent')
    };
    
    // Select optimal edge server
    const optimalServer = geoDistributionManager.selectOptimalEdgeServer(
      userContext,
      { type: 'static' }
    );
    
    // Add server info to request
    req.edgeServer = optimalServer;
    
    // Add helper function to response locals
    res.locals.getOptimalCDNUrl = (contentPath, contentInfo = {}) => {
      const server = geoDistributionManager.selectOptimalEdgeServer(
        userContext,
        contentInfo
      );
      return `${server.endpoint}${contentPath.startsWith('/') ? '' : '/'}${contentPath}`;
    };
    
    next();
  };
}