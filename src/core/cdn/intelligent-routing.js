/**
 * @fileoverview Intelligent CDN Routing System
 * Provides adaptive routing based on user location, device, performance, and content type
 */

import { EventEmitter } from 'events';

/**
 * Intelligent CDN Routing Manager
 */
export class IntelligentRoutingManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Routing algorithms
      algorithm: config.algorithm || 'adaptive', // 'latency', 'geo', 'load', 'adaptive'
      adaptiveLearning: config.adaptiveLearning !== false,
      
      // Performance thresholds
      thresholds: {
        latency: config.thresholds?.latency || 200,
        errorRate: config.thresholds?.errorRate || 5,
        loadFactor: config.thresholds?.loadFactor || 0.8,
        ...config.thresholds
      },
      
      // Learning parameters
      learning: {
        enabled: config.learning?.enabled !== false,
        windowSize: config.learning?.windowSize || 100,
        decayFactor: config.learning?.decayFactor || 0.95,
        explorationRate: config.learning?.explorationRate || 0.1,
        ...config.learning
      },
      
      // Device-specific routing
      deviceOptimization: {
        enabled: config.deviceOptimization?.enabled !== false,
        mobileThreshold: config.deviceOptimization?.mobileThreshold || 3, // Mbps
        desktopThreshold: config.deviceOptimization?.desktopThreshold || 10, // Mbps
        ...config.deviceOptimization
      },
      
      ...config
    };
    
    // Routing data
    this.routingTable = new Map();
    this.performanceHistory = new Map();
    this.userContextCache = new Map();
    this.routingMetrics = new Map();
    this.learningModel = new Map();
    
    // Device detection patterns
    this.devicePatterns = {
      mobile: /Mobile|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i,
      tablet: /iPad|Android.*Tablet|Kindle|PlayBook/i,
      desktop: /Windows|Macintosh|Linux/i,
      gameConsole: /PlayStation|Xbox|Nintendo/i,
      smartTV: /SmartTV|Tizen|WebOS/i,
      bot: /bot|crawler|spider|scraper/i
    };
    
    this.initializeRouting();
  }

  /**
   * Initialize intelligent routing system
   */
  initializeRouting() {
    this.loadRoutingConfiguration();
    this.startPerformanceLearning();
    this.setupRoutingOptimization();
  }

  /**
   * Route request to optimal CDN endpoint
   * @param {Object} request - Request context
   * @returns {Object} - Routing decision
   */
  routeRequest(request) {
    const {
      userContext,
      contentInfo,
      currentTime = Date.now()
    } = request;
    
    try {
      // Analyze user context
      const enrichedContext = this.enrichUserContext(userContext);
      
      // Get candidate endpoints
      const candidates = this.getCandidateEndpoints(enrichedContext, contentInfo);
      
      if (candidates.length === 0) {
        throw new Error('No available CDN endpoints');
      }
      
      // Apply routing algorithm
      const selectedEndpoint = this.selectOptimalEndpoint(
        candidates, 
        enrichedContext, 
        contentInfo
      );
      
      // Record routing decision for learning
      this.recordRoutingDecision(selectedEndpoint, enrichedContext, contentInfo);
      
      // Update routing metrics
      this.updateRoutingMetrics(selectedEndpoint, enrichedContext);
      
      return {
        endpoint: selectedEndpoint,
        reason: selectedEndpoint.selectionReason,
        confidence: selectedEndpoint.confidence,
        alternatives: candidates.filter(c => c.id !== selectedEndpoint.id).slice(0, 2),
        timestamp: currentTime
      };
    } catch (error) {
      console.error('Intelligent routing failed:', error);
      return this.getFallbackRouting(userContext);
    }
  }

  /**
   * Enrich user context with additional data
   * @param {Object} userContext - Basic user context
   * @returns {Object} - Enriched user context
   */
  enrichUserContext(userContext) {
    const {
      ip,
      userAgent,
      acceptLanguage,
      location,
      connectionSpeed,
      deviceMemory,
      hardwareConcurrency
    } = userContext;
    
    // Detect device type
    const deviceType = this.detectDeviceType(userAgent);
    
    // Estimate connection quality
    const connectionQuality = this.estimateConnectionQuality({
      connectionSpeed,
      deviceMemory,
      hardwareConcurrency,
      deviceType
    });
    
    // Get or estimate location
    const geoLocation = location || this.estimateLocationFromIP(ip);
    
    // Calculate user preference score based on history
    const userPreferences = this.getUserPreferences(ip, userAgent);
    
    return {
      ...userContext,
      deviceType,
      connectionQuality,
      geoLocation,
      userPreferences,
      capabilities: {
        webp: this.supportsWebP(userAgent),
        avif: this.supportsAVIF(userAgent),
        http2: this.supportsHTTP2(userAgent),
        brotli: this.supportsBrotli(userAgent)
      },
      enrichedAt: Date.now()
    };
  }

  /**
   * Detect device type from user agent
   * @param {string} userAgent - User agent string
   * @returns {string} - Device type
   */
  detectDeviceType(userAgent) {
    if (!userAgent) return 'unknown';
    
    for (const [type, pattern] of Object.entries(this.devicePatterns)) {
      if (pattern.test(userAgent)) {
        return type;
      }
    }
    
    return 'desktop'; // default
  }

  /**
   * Estimate connection quality
   * @param {Object} context - Connection context
   * @returns {Object} - Connection quality metrics
   */
  estimateConnectionQuality(context) {
    const {
      connectionSpeed,
      deviceMemory,
      hardwareConcurrency,
      deviceType
    } = context;
    
    let quality = 'medium';
    let bandwidth = 5; // Default 5 Mbps
    
    // Use actual connection speed if available
    if (connectionSpeed) {
      bandwidth = connectionSpeed;
      if (connectionSpeed > 10) {
        quality = 'high';
      } else if (connectionSpeed < 2) {
        quality = 'low';
      }
    } else {
      // Estimate based on device type
      switch (deviceType) {
        case 'mobile':
          bandwidth = Math.random() * 8 + 2; // 2-10 Mbps
          quality = bandwidth > 5 ? 'medium' : 'low';
          break;
        case 'tablet':
          bandwidth = Math.random() * 15 + 5; // 5-20 Mbps
          quality = 'medium';
          break;
        case 'desktop':
          bandwidth = Math.random() * 45 + 10; // 10-55 Mbps
          quality = 'high';
          break;
        case 'gameConsole':
          bandwidth = Math.random() * 25 + 15; // 15-40 Mbps
          quality = 'high';
          break;
      }
    }
    
    return {
      quality,
      estimatedBandwidth: bandwidth,
      deviceMemory: deviceMemory || this.estimateDeviceMemory(deviceType),
      processingPower: hardwareConcurrency || this.estimateProcessingPower(deviceType)
    };
  }

  /**
   * Estimate device memory based on device type
   * @param {string} deviceType - Device type
   * @returns {number} - Estimated memory in GB
   */
  estimateDeviceMemory(deviceType) {
    const memoryEstimates = {
      mobile: 4,
      tablet: 6,
      desktop: 8,
      gameConsole: 16,
      smartTV: 2,
      unknown: 4
    };
    
    return memoryEstimates[deviceType] || 4;
  }

  /**
   * Estimate processing power based on device type
   * @param {string} deviceType - Device type
   * @returns {number} - Estimated CPU cores
   */
  estimateProcessingPower(deviceType) {
    const powerEstimates = {
      mobile: 4,
      tablet: 6,
      desktop: 8,
      gameConsole: 8,
      smartTV: 4,
      unknown: 4
    };
    
    return powerEstimates[deviceType] || 4;
  }

  /**
   * Get candidate endpoints for routing
   * @param {Object} userContext - Enriched user context
   * @param {Object} contentInfo - Content information
   * @returns {Array} - Array of candidate endpoints
   */
  getCandidateEndpoints(userContext, contentInfo) {
    const candidates = [];
    
    // Get all available endpoints from routing table
    for (const [endpointId, endpoint] of this.routingTable) {
      // Check if endpoint supports required capabilities
      if (!this.endpointSupportsContent(endpoint, contentInfo)) {
        continue;
      }
      
      // Check geographic compatibility
      if (!this.isGeographicallyCompatible(endpoint, userContext.geoLocation)) {
        continue;
      }
      
      // Calculate routing score
      const score = this.calculateRoutingScore(endpoint, userContext, contentInfo);
      
      candidates.push({
        ...endpoint,
        score,
        estimatedLatency: this.estimateLatency(endpoint, userContext),
        loadFactor: this.getEndpointLoad(endpointId),
        compatibility: this.calculateCompatibility(endpoint, userContext)
      });
    }
    
    // Sort by score (descending)
    return candidates.sort((a, b) => b.score - a.score);
  }

  /**
   * Check if endpoint supports content requirements
   * @param {Object} endpoint - CDN endpoint
   * @param {Object} contentInfo - Content information
   * @returns {boolean} - Supports content
   */
  endpointSupportsContent(endpoint, contentInfo) {
    if (!contentInfo.type) return true;
    
    const requiredCapabilities = this.getRequiredCapabilities(contentInfo);
    
    return requiredCapabilities.every(capability => 
      endpoint.capabilities && endpoint.capabilities.includes(capability)
    );
  }

  /**
   * Get required capabilities for content type
   * @param {Object} contentInfo - Content information
   * @returns {Array} - Required capabilities
   */
  getRequiredCapabilities(contentInfo) {
    const capabilityMap = {
      video: ['streaming', 'transcoding'],
      image: ['optimization', 'format_conversion'],
      gaming: ['low_latency', 'high_throughput'],
      audio: ['streaming', 'compression'],
      static: ['compression']
    };
    
    return capabilityMap[contentInfo.type] || [];
  }

  /**
   * Check geographic compatibility
   * @param {Object} endpoint - CDN endpoint
   * @param {Object} location - User location
   * @returns {boolean} - Is compatible
   */
  isGeographicallyCompatible(endpoint, location) {
    if (!location || !endpoint.regions) return true;
    
    // Check if user's region is in endpoint's service area
    return endpoint.regions.includes(location.region) ||
           endpoint.regions.includes('global');
  }

  /**
   * Calculate routing score for endpoint
   * @param {Object} endpoint - CDN endpoint
   * @param {Object} userContext - User context
   * @param {Object} contentInfo - Content information
   * @returns {number} - Routing score
   */
  calculateRoutingScore(endpoint, userContext, contentInfo) {
    let score = 0;
    
    // Performance score (40% weight)
    const performanceScore = this.calculatePerformanceScore(endpoint, userContext);
    score += performanceScore * 0.4;
    
    // Geographic score (25% weight)
    const geoScore = this.calculateGeographicScore(endpoint, userContext);
    score += geoScore * 0.25;
    
    // Load balancing score (20% weight)
    const loadScore = this.calculateLoadScore(endpoint);
    score += loadScore * 0.2;
    
    // Content optimization score (15% weight)
    const contentScore = this.calculateContentScore(endpoint, contentInfo);
    score += contentScore * 0.15;
    
    return score;
  }

  /**
   * Calculate performance score
   * @param {Object} endpoint - CDN endpoint
   * @param {Object} userContext - User context
   * @returns {number} - Performance score (0-100)
   */
  calculatePerformanceScore(endpoint, userContext) {
    const history = this.performanceHistory.get(endpoint.id);
    if (!history) return 50; // Default score for new endpoints
    
    // Consider latency, availability, and error rate
    const latencyScore = Math.max(0, 100 - (history.avgLatency / 10));
    const availabilityScore = history.availability;
    const errorScore = Math.max(0, 100 - history.errorRate * 10);
    
    return (latencyScore + availabilityScore + errorScore) / 3;
  }

  /**
   * Calculate geographic score
   * @param {Object} endpoint - CDN endpoint
   * @param {Object} userContext - User context
   * @returns {number} - Geographic score (0-100)
   */
  calculateGeographicScore(endpoint, userContext) {
    if (!userContext.geoLocation || !endpoint.location) return 50;
    
    const distance = this.calculateDistance(
      userContext.geoLocation.latitude,
      userContext.geoLocation.longitude,
      endpoint.location.latitude,
      endpoint.location.longitude
    );
    
    // Closer is better (exponential decay)
    return Math.max(0, 100 * Math.exp(-distance / 5000)); // 5000km reference
  }

  /**
   * Calculate geographic distance between two points
   * @param {number} lat1 - First latitude
   * @param {number} lon1 - First longitude
   * @param {number} lat2 - Second latitude
   * @param {number} lon2 - Second longitude
   * @returns {number} - Distance in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
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
   * Calculate load score
   * @param {Object} endpoint - CDN endpoint
   * @returns {number} - Load score (0-100)
   */
  calculateLoadScore(endpoint) {
    const currentLoad = this.getEndpointLoad(endpoint.id);
    const capacity = endpoint.capacity || 100;
    
    const loadPercentage = (currentLoad / capacity) * 100;
    return Math.max(0, 100 - loadPercentage);
  }

  /**
   * Calculate content optimization score
   * @param {Object} endpoint - CDN endpoint
   * @param {Object} contentInfo - Content information
   * @returns {number} - Content score (0-100)
   */
  calculateContentScore(endpoint, contentInfo) {
    if (!contentInfo.type) return 50;
    
    const optimizations = endpoint.optimizations || [];
    const contentOptimizations = this.getContentOptimizations(contentInfo.type);
    
    const matchCount = contentOptimizations.filter(opt => 
      optimizations.includes(opt)
    ).length;
    
    return contentOptimizations.length > 0 ? 
      (matchCount / contentOptimizations.length) * 100 : 50;
  }

  /**
   * Get content-specific optimizations
   * @param {string} contentType - Content type
   * @returns {Array} - Optimization features
   */
  getContentOptimizations(contentType) {
    const optimizationMap = {
      video: ['adaptive_streaming', 'transcoding', 'compression'],
      image: ['webp_conversion', 'resizing', 'compression'],
      gaming: ['low_latency', 'high_bandwidth', 'edge_compute'],
      audio: ['compression', 'format_conversion'],
      static: ['gzip', 'brotli', 'minification']
    };
    
    return optimizationMap[contentType] || [];
  }

  /**
   * Select optimal endpoint using configured algorithm
   * @param {Array} candidates - Candidate endpoints
   * @param {Object} userContext - User context
   * @param {Object} contentInfo - Content information
   * @returns {Object} - Selected endpoint
   */
  selectOptimalEndpoint(candidates, userContext, contentInfo) {
    if (candidates.length === 0) {
      throw new Error('No candidate endpoints available');
    }
    
    let selected;
    
    switch (this.config.algorithm) {
      case 'latency':
        selected = this.selectByLatency(candidates);
        break;
      
      case 'geo':
        selected = this.selectByGeography(candidates, userContext);
        break;
      
      case 'load':
        selected = this.selectByLoad(candidates);
        break;
      
      case 'adaptive':
        selected = this.selectAdaptive(candidates, userContext, contentInfo);
        break;
      
      default:
        selected = candidates[0]; // Highest scored
        selected.selectionReason = 'highest_score';
    }
    
    // Add confidence score
    selected.confidence = this.calculateSelectionConfidence(selected, candidates);
    
    return selected;
  }

  /**
   * Select endpoint by lowest latency
   * @param {Array} candidates - Candidate endpoints
   * @returns {Object} - Selected endpoint
   */
  selectByLatency(candidates) {
    const selected = candidates.reduce((best, current) => 
      current.estimatedLatency < best.estimatedLatency ? current : best
    );
    selected.selectionReason = 'lowest_latency';
    return selected;
  }

  /**
   * Select endpoint by geography
   * @param {Array} candidates - Candidate endpoints
   * @param {Object} userContext - User context
   * @returns {Object} - Selected endpoint
   */
  selectByGeography(candidates, userContext) {
    // Prefer endpoints in same region
    const regionalCandidates = candidates.filter(c => 
      c.regions && userContext.geoLocation && 
      c.regions.includes(userContext.geoLocation.region)
    );
    
    const selected = regionalCandidates.length > 0 ? 
      regionalCandidates[0] : candidates[0];
    
    selected.selectionReason = 'geographic_proximity';
    return selected;
  }

  /**
   * Select endpoint by load balancing
   * @param {Array} candidates - Candidate endpoints
   * @returns {Object} - Selected endpoint
   */
  selectByLoad(candidates) {
    const selected = candidates.reduce((best, current) => 
      current.loadFactor < best.loadFactor ? current : best
    );
    selected.selectionReason = 'load_balancing';
    return selected;
  }

  /**
   * Adaptive selection using machine learning
   * @param {Array} candidates - Candidate endpoints
   * @param {Object} userContext - User context
   * @param {Object} contentInfo - Content information
   * @returns {Object} - Selected endpoint
   */
  selectAdaptive(candidates, userContext, contentInfo) {
    if (!this.config.learning.enabled) {
      return candidates[0];
    }
    
    // Use learned preferences with exploration
    const explorationRate = this.config.learning.explorationRate;
    
    if (Math.random() < explorationRate) {
      // Explore: select randomly from top candidates
      const topCandidates = candidates.slice(0, Math.min(3, candidates.length));
      const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];
      selected.selectionReason = 'exploration';
      return selected;
    } else {
      // Exploit: select based on learned model
      const selected = this.selectBasedOnLearning(candidates, userContext, contentInfo);
      selected.selectionReason = 'adaptive_learning';
      return selected;
    }
  }

  /**
   * Select based on learned model
   * @param {Array} candidates - Candidate endpoints
   * @param {Object} userContext - User context
   * @param {Object} contentInfo - Content information
   * @returns {Object} - Selected endpoint
   */
  selectBasedOnLearning(candidates, userContext, contentInfo) {
    // Create context key for learning model
    const contextKey = this.createContextKey(userContext, contentInfo);
    const learningData = this.learningModel.get(contextKey);
    
    if (!learningData) {
      return candidates[0]; // No learned data, use highest score
    }
    
    // Calculate expected performance for each candidate
    const candidatesWithExpectation = candidates.map(candidate => ({
      ...candidate,
      expectedPerformance: this.calculateExpectedPerformance(
        candidate, 
        learningData
      )
    }));
    
    // Select candidate with best expected performance
    return candidatesWithExpectation.reduce((best, current) => 
      current.expectedPerformance > best.expectedPerformance ? current : best
    );
  }

  /**
   * Create context key for learning model
   * @param {Object} userContext - User context
   * @param {Object} contentInfo - Content information
   * @returns {string} - Context key
   */
  createContextKey(userContext, contentInfo) {
    const key = [
      userContext.deviceType,
      userContext.connectionQuality.quality,
      userContext.geoLocation?.region || 'unknown',
      contentInfo.type || 'static'
    ].join('|');
    
    return key;
  }

  /**
   * Calculate expected performance based on learning data
   * @param {Object} candidate - Candidate endpoint
   * @param {Object} learningData - Historical learning data
   * @returns {number} - Expected performance score
   */
  calculateExpectedPerformance(candidate, learningData) {
    const endpointHistory = learningData[candidate.id];
    if (!endpointHistory) {
      return candidate.score; // No history, use current score
    }
    
    // Weighted average of historical performance
    const weights = endpointHistory.performances.map((_, i) => 
      Math.pow(this.config.learning.decayFactor, endpointHistory.performances.length - i - 1)
    );
    
    const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
    const weightedPerformance = endpointHistory.performances.reduce(
      (sum, perf, i) => sum + (perf * weights[i]), 0
    ) / weightSum;
    
    return weightedPerformance;
  }

  /**
   * Calculate selection confidence
   * @param {Object} selected - Selected endpoint
   * @param {Array} candidates - All candidates
   * @returns {number} - Confidence score (0-100)
   */
  calculateSelectionConfidence(selected, candidates) {
    if (candidates.length === 1) return 100;
    
    // Calculate confidence based on score gap
    const scores = candidates.map(c => c.score).sort((a, b) => b - a);
    const topScore = scores[0];
    const secondScore = scores[1] || 0;
    
    const scoreGap = topScore - secondScore;
    const maxPossibleGap = 100;
    
    return Math.min(100, (scoreGap / maxPossibleGap) * 100 + 50);
  }

  /**
   * Record routing decision for learning
   * @param {Object} endpoint - Selected endpoint
   * @param {Object} userContext - User context
   * @param {Object} contentInfo - Content information
   */
  recordRoutingDecision(endpoint, userContext, contentInfo) {
    if (!this.config.learning.enabled) return;
    
    const contextKey = this.createContextKey(userContext, contentInfo);
    
    if (!this.learningModel.has(contextKey)) {
      this.learningModel.set(contextKey, {});
    }
    
    const contextData = this.learningModel.get(contextKey);
    
    if (!contextData[endpoint.id]) {
      contextData[endpoint.id] = {
        selections: 0,
        performances: []
      };
    }
    
    contextData[endpoint.id].selections++;
  }

  /**
   * Update routing metrics
   * @param {Object} endpoint - Selected endpoint
   * @param {Object} userContext - User context
   */
  updateRoutingMetrics(endpoint, userContext) {
    const key = `${endpoint.id}_${userContext.deviceType}`;
    
    if (!this.routingMetrics.has(key)) {
      this.routingMetrics.set(key, {
        selections: 0,
        totalResponseTime: 0,
        successfulRequests: 0,
        failedRequests: 0
      });
    }
    
    const metrics = this.routingMetrics.get(key);
    metrics.selections++;
  }

  /**
   * Start performance learning system
   */
  startPerformanceLearning() {
    if (!this.config.learning.enabled) return;
    
    // Periodically update learning model
    setInterval(() => {
      this.updateLearningModel();
    }, 300000); // Every 5 minutes
  }

  /**
   * Update learning model based on performance feedback
   */
  updateLearningModel() {
    // This would typically analyze recent performance data
    // and update the learning model accordingly
    console.log('Updating intelligent routing learning model...');
  }

  /**
   * Setup routing optimization
   */
  setupRoutingOptimization() {
    // Periodically optimize routing table
    setInterval(() => {
      this.optimizeRoutingTable();
    }, 600000); // Every 10 minutes
  }

  /**
   * Optimize routing table based on performance data
   */
  optimizeRoutingTable() {
    console.log('Optimizing CDN routing table...');
    
    // Remove underperforming endpoints
    for (const [endpointId, endpoint] of this.routingTable) {
      const performance = this.performanceHistory.get(endpointId);
      
      if (performance && 
          (performance.errorRate > this.config.thresholds.errorRate ||
           performance.avgLatency > this.config.thresholds.latency * 2)) {
        
        console.warn(`Temporarily removing underperforming endpoint: ${endpointId}`);
        endpoint.disabled = true;
      }
    }
  }

  /**
   * Load routing configuration
   */
  loadRoutingConfiguration() {
    // Mock routing table - in production this would load from configuration
    this.routingTable.set('cdn-us-east-1', {
      id: 'cdn-us-east-1',
      provider: 'cloudflare',
      region: 'us-east',
      url: 'https://us-east-1.mlg.clan',
      location: { latitude: 39.0458, longitude: -76.6413 },
      regions: ['us-east', 'us-central'],
      capabilities: ['streaming', 'optimization', 'low_latency'],
      optimizations: ['webp_conversion', 'gzip', 'brotli'],
      capacity: 1000
    });
    
    this.routingTable.set('cdn-us-west-1', {
      id: 'cdn-us-west-1',
      provider: 'cloudflare',
      region: 'us-west',
      url: 'https://us-west-1.mlg.clan',
      location: { latitude: 37.7749, longitude: -122.4194 },
      regions: ['us-west', 'us-central'],
      capabilities: ['streaming', 'optimization', 'transcoding'],
      optimizations: ['webp_conversion', 'adaptive_streaming'],
      capacity: 1000
    });
    
    this.routingTable.set('cdn-eu-central-1', {
      id: 'cdn-eu-central-1',
      provider: 'cloudflare',
      region: 'europe',
      url: 'https://eu-central-1.mlg.clan',
      location: { latitude: 50.1109, longitude: 8.6821 },
      regions: ['europe'],
      capabilities: ['streaming', 'optimization', 'compression'],
      optimizations: ['avif_conversion', 'brotli'],
      capacity: 800
    });
    
    console.log(`Loaded ${this.routingTable.size} CDN endpoints for routing`);
  }

  /**
   * Helper methods for capability detection
   */
  supportsWebP(userAgent) {
    if (!userAgent) return false;
    // Chrome 23+, Firefox 65+, Safari 14+, Edge 18+
    return /Chrome\/([2-9]\d|[1-9]\d{2,})|Firefox\/([6-9]\d|\d{3,})|Safari.*Version\/(1[4-9]|[2-9]\d)|Edge\/([1-9]\d|[2-9]\d)/.test(userAgent);
  }

  supportsAVIF(userAgent) {
    if (!userAgent) return false;
    // Chrome 85+, Firefox 93+
    return /Chrome\/(8[5-9]|9\d|\d{3,})|Firefox\/(9[3-9]|\d{3,})/.test(userAgent);
  }

  supportsHTTP2(userAgent) {
    if (!userAgent) return false;
    // Most modern browsers support HTTP/2
    return !/MSIE|Trident|Edge\/([1-9]|1[0-5])\b/.test(userAgent);
  }

  supportsBrotli(userAgent) {
    if (!userAgent) return false;
    // Chrome 50+, Firefox 44+, Safari 12+, Edge 15+
    return /Chrome\/([5-9]\d|\d{3,})|Firefox\/(4[4-9]|[5-9]\d|\d{3,})|Safari.*Version\/(1[2-9]|[2-9]\d)|Edge\/(1[5-9]|[2-9]\d)/.test(userAgent);
  }

  /**
   * Estimate location from IP address (mock implementation)
   * @param {string} ip - IP address
   * @returns {Object} - Estimated location
   */
  estimateLocationFromIP(ip) {
    // Mock implementation - would use GeoIP service in production
    const regions = ['us-east', 'us-west', 'europe', 'asia-pacific'];
    const region = regions[Math.floor(Math.random() * regions.length)];
    
    const locationMap = {
      'us-east': { latitude: 39.0458, longitude: -76.6413, region: 'us-east' },
      'us-west': { latitude: 37.7749, longitude: -122.4194, region: 'us-west' },
      'europe': { latitude: 50.1109, longitude: 8.6821, region: 'europe' },
      'asia-pacific': { latitude: 1.3521, longitude: 103.8198, region: 'asia-pacific' }
    };
    
    return locationMap[region];
  }

  /**
   * Get user preferences from history
   * @param {string} ip - IP address
   * @param {string} userAgent - User agent
   * @returns {Object} - User preferences
   */
  getUserPreferences(ip, userAgent) {
    // Mock implementation - would load from user history database
    return {
      preferredQuality: 'high',
      acceptsModernFormats: this.supportsWebP(userAgent),
      bandwidthPreference: 'balanced'
    };
  }

  /**
   * Estimate latency to endpoint
   * @param {Object} endpoint - CDN endpoint
   * @param {Object} userContext - User context
   * @returns {number} - Estimated latency in ms
   */
  estimateLatency(endpoint, userContext) {
    if (!userContext.geoLocation || !endpoint.location) {
      return 200; // Default estimate
    }
    
    const distance = this.calculateDistance(
      userContext.geoLocation.latitude,
      userContext.geoLocation.longitude,
      endpoint.location.latitude,
      endpoint.location.longitude
    );
    
    // Rough estimate: ~50ms base + 1ms per 100km
    return 50 + Math.round(distance / 100);
  }

  /**
   * Get current endpoint load
   * @param {string} endpointId - Endpoint ID
   * @returns {number} - Current load
   */
  getEndpointLoad(endpointId) {
    // Mock implementation - would get from monitoring system
    return Math.floor(Math.random() * 100);
  }

  /**
   * Calculate compatibility between endpoint and user
   * @param {Object} endpoint - CDN endpoint
   * @param {Object} userContext - User context
   * @returns {number} - Compatibility score (0-100)
   */
  calculateCompatibility(endpoint, userContext) {
    let score = 50; // Base score
    
    // Device-specific compatibility
    if (userContext.deviceType === 'mobile' && 
        endpoint.optimizations.includes('mobile_optimization')) {
      score += 20;
    }
    
    // Format support compatibility
    if (userContext.capabilities.webp && 
        endpoint.optimizations.includes('webp_conversion')) {
      score += 15;
    }
    
    if (userContext.capabilities.avif && 
        endpoint.optimizations.includes('avif_conversion')) {
      score += 15;
    }
    
    return Math.min(100, score);
  }

  /**
   * Get fallback routing when main system fails
   * @param {Object} userContext - User context
   * @returns {Object} - Fallback routing decision
   */
  getFallbackRouting(userContext) {
    // Simple geographic fallback
    const region = userContext.geoLocation?.region || 'us-east';
    const fallbackEndpoints = {
      'us-east': 'https://us-east.mlg.clan',
      'us-west': 'https://us-west.mlg.clan',
      'europe': 'https://eu.mlg.clan',
      'asia-pacific': 'https://ap.mlg.clan'
    };
    
    return {
      endpoint: {
        id: `fallback-${region}`,
        url: fallbackEndpoints[region] || fallbackEndpoints['us-east'],
        region: region
      },
      reason: 'fallback_routing',
      confidence: 30,
      alternatives: [],
      timestamp: Date.now()
    };
  }

  /**
   * Get routing statistics
   * @returns {Object} - Routing statistics
   */
  getRoutingStatistics() {
    return {
      endpoints: {
        total: this.routingTable.size,
        active: Array.from(this.routingTable.values()).filter(e => !e.disabled).length,
        disabled: Array.from(this.routingTable.values()).filter(e => e.disabled).length
      },
      routing: {
        totalDecisions: Array.from(this.routingMetrics.values())
          .reduce((sum, m) => sum + m.selections, 0),
        algorithmDistribution: this.getAlgorithmDistribution(),
        deviceTypeDistribution: this.getDeviceTypeDistribution()
      },
      learning: {
        enabled: this.config.learning.enabled,
        contextKeys: this.learningModel.size,
        explorationRate: this.config.learning.explorationRate
      }
    };
  }

  /**
   * Get algorithm distribution from routing metrics
   * @returns {Object} - Algorithm distribution
   */
  getAlgorithmDistribution() {
    // Mock implementation
    return {
      adaptive: 60,
      latency: 25,
      geo: 10,
      load: 5
    };
  }

  /**
   * Get device type distribution
   * @returns {Object} - Device type distribution
   */
  getDeviceTypeDistribution() {
    // Mock implementation based on routing metrics
    return {
      mobile: 45,
      desktop: 35,
      tablet: 15,
      gameConsole: 3,
      smartTV: 2
    };
  }
}

/**
 * Create and export default intelligent routing manager
 */
export const intelligentRoutingManager = new IntelligentRoutingManager();

/**
 * Express middleware for intelligent CDN routing
 * @param {Object} options - Middleware options
 * @returns {Function} - Express middleware function
 */
export function intelligentRoutingMiddleware(options = {}) {
  return (req, res, next) => {
    // Extract user context
    const userContext = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      acceptLanguage: req.get('accept-language'),
      location: req.get('x-user-location') ? 
        JSON.parse(req.get('x-user-location')) : null,
      connectionSpeed: req.get('x-connection-speed') ? 
        parseFloat(req.get('x-connection-speed')) : null,
      deviceMemory: req.get('x-device-memory') ? 
        parseFloat(req.get('x-device-memory')) : null,
      hardwareConcurrency: req.get('x-hardware-concurrency') ? 
        parseInt(req.get('x-hardware-concurrency')) : null
    };
    
    // Determine content info from request
    const contentInfo = {
      type: options.contentType || 'static',
      size: req.get('content-length') ? 
        parseInt(req.get('content-length')) : null
    };
    
    // Route request
    const routing = intelligentRoutingManager.routeRequest({
      userContext,
      contentInfo,
      currentTime: Date.now()
    });
    
    // Add routing info to request
    req.cdnRouting = routing;
    req.cdnProvider = routing.endpoint.provider;
    req.cdnRegion = routing.endpoint.region;
    
    // Add CDN URL helper to response locals
    res.locals.getIntelligentCDNUrl = (assetPath) => {
      return `${routing.endpoint.url}${assetPath.startsWith('/') ? '' : '/'}${assetPath}`;
    };
    
    next();
  };
}