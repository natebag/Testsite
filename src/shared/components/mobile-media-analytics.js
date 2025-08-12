/**
 * Mobile Media Analytics Dashboard for MLG.clan
 * 
 * Comprehensive analytics system for mobile media optimization:
 * - Real-time bandwidth usage monitoring
 * - Image loading performance metrics
 * - Context-aware optimization tracking
 * - User behavior pattern analysis
 * - Gaming session optimization insights
 * - Network-aware adaptation analytics
 * 
 * Features:
 * - Core Web Vitals tracking for mobile
 * - Gaming-specific performance metrics
 * - Battery usage impact analysis
 * - Data saver mode effectiveness
 * - Smart preloading success rates
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 */

/**
 * Mobile Media Analytics Configuration
 */
const ANALYTICS_CONFIG = {
  // Sampling rates for different metrics
  sampling: {
    imageLoading: 1.0,      // Track all image loads
    bandwidthUsage: 1.0,    // Track all bandwidth usage
    userInteractions: 0.8,  // Sample 80% of interactions
    performanceMetrics: 1.0, // Track all performance metrics
    errorTracking: 1.0      // Track all errors
  },

  // Performance thresholds
  thresholds: {
    loadTimeGood: 1000,     // < 1s is good
    loadTimeNeedsWork: 3000, // < 3s needs improvement
    bandwidthBudget: 5 * 1024 * 1024, // 5MB per session
    batteryImpactLow: 0.05,  // < 5% battery drain per hour
    cacheHitRateGood: 0.7,   // > 70% cache hit rate
    errorRateAcceptable: 0.05 // < 5% error rate
  },

  // Data retention periods
  retention: {
    realTime: 300,          // 5 minutes of real-time data
    session: 86400,         // 24 hours of session data
    historical: 604800      // 7 days of historical data
  }
};

/**
 * Mobile Media Analytics Class
 */
export class MobileMediaAnalytics {
  constructor(options = {}) {
    this.options = {
      enableRealTimeTracking: true,
      enablePerformanceObserver: true,
      enableBatteryTracking: true,
      enableNetworkTracking: true,
      autoSendReports: false,
      debugMode: false,
      ...options
    };

    // Analytics data stores
    this.metrics = {
      images: {
        totalLoaded: 0,
        totalFailed: 0,
        totalBytes: 0,
        avgLoadTime: 0,
        cacheHits: 0,
        cacheMisses: 0,
        formatBreakdown: new Map(),
        sizeBreakdown: new Map(),
        contextBreakdown: new Map()
      },
      bandwidth: {
        totalUsed: 0,
        sessionBudget: ANALYTICS_CONFIG.thresholds.bandwidthBudget,
        peakUsage: 0,
        averageSpeed: 0,
        dataSaverSavings: 0,
        compressionSavings: 0
      },
      performance: {
        lcp: [],
        fid: [],
        cls: [],
        ttfb: [],
        sessionStartTime: Date.now(),
        contextSwitchTimes: []
      },
      battery: {
        initialLevel: 1,
        currentLevel: 1,
        estimatedDrain: 0,
        lowPowerModeActivations: 0
      },
      network: {
        connectionType: 'unknown',
        connectionChanges: 0,
        adaptations: 0,
        downgrades: 0,
        upgrades: 0
      },
      userBehavior: {
        contentViewed: new Map(),
        interactionPatterns: [],
        preferredContexts: new Map(),
        sessionDuration: 0
      },
      gaming: {
        clipsViewed: 0,
        screenshotsViewed: 0,
        tournamentsAccessed: 0,
        leaderboardViews: 0,
        socialInteractions: 0
      }
    };

    // Real-time data buffers
    this.realTimeBuffers = {
      loadTimes: [],
      bandwidthUsage: [],
      errorEvents: [],
      userActions: []
    };

    // Analytics state
    this.isTracking = false;
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    
    this.init();
  }

  /**
   * Initialize analytics system
   */
  async init() {
    try {
      await this.initializePerformanceObserver();
      await this.initializeBatteryTracking();
      await this.initializeNetworkTracking();
      
      this.startRealTimeTracking();
      this.setupEventListeners();
      
      if (this.options.debugMode) {
        this.enableDebugDashboard();
      }

      this.isTracking = true;
      console.log('📊 Mobile Media Analytics initialized');
      
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  /**
   * Track image loading performance
   */
  trackImageLoad(imageData) {
    if (!this.shouldSample('imageLoading')) return;

    const {
      src,
      loadTime,
      fileSize,
      format,
      context,
      fromCache,
      error
    } = imageData;

    if (error) {
      this.metrics.images.totalFailed++;
      this.trackError('image_load_failed', { src, error: error.message });
      return;
    }

    // Update basic metrics
    this.metrics.images.totalLoaded++;
    this.metrics.images.totalBytes += fileSize;
    
    // Update average load time
    const totalImages = this.metrics.images.totalLoaded;
    this.metrics.images.avgLoadTime = 
      (this.metrics.images.avgLoadTime * (totalImages - 1) + loadTime) / totalImages;

    // Track cache performance
    if (fromCache) {
      this.metrics.images.cacheHits++;
    } else {
      this.metrics.images.cacheMisses++;
    }

    // Track format breakdown
    this.updateMapCounter(this.metrics.images.formatBreakdown, format);
    
    // Track size breakdown
    const sizeCategory = this.categorizeSizeByBytes(fileSize);
    this.updateMapCounter(this.metrics.images.sizeBreakdown, sizeCategory);
    
    // Track context breakdown
    this.updateMapCounter(this.metrics.images.contextBreakdown, context);

    // Add to real-time buffer
    this.realTimeBuffers.loadTimes.push({
      timestamp: Date.now(),
      loadTime,
      fileSize,
      format,
      context
    });

    // Trim buffer to maintain size
    if (this.realTimeBuffers.loadTimes.length > 100) {
      this.realTimeBuffers.loadTimes.shift();
    }

    // Check for performance issues
    this.checkPerformanceThresholds('image_load', { loadTime, fileSize });
  }

  /**
   * Track bandwidth usage
   */
  trackBandwidthUsage(bytes, context = 'unknown') {
    if (!this.shouldSample('bandwidthUsage')) return;

    this.metrics.bandwidth.totalUsed += bytes;
    
    // Track peak usage
    const currentUsage = this.getCurrentBandwidthUsage();
    if (currentUsage > this.metrics.bandwidth.peakUsage) {
      this.metrics.bandwidth.peakUsage = currentUsage;
    }

    // Add to real-time buffer
    this.realTimeBuffers.bandwidthUsage.push({
      timestamp: Date.now(),
      bytes,
      context,
      cumulative: this.metrics.bandwidth.totalUsed
    });

    // Check budget limits
    this.checkBandwidthBudget();
  }

  /**
   * Track gaming-specific interactions
   */
  trackGamingInteraction(type, data = {}) {
    switch (type) {
      case 'clip_viewed':
        this.metrics.gaming.clipsViewed++;
        break;
      case 'screenshot_viewed':
        this.metrics.gaming.screenshotsViewed++;
        break;
      case 'tournament_accessed':
        this.metrics.gaming.tournamentsAccessed++;
        break;
      case 'leaderboard_viewed':
        this.metrics.gaming.leaderboardViews++;
        break;
      case 'social_interaction':
        this.metrics.gaming.socialInteractions++;
        break;
    }

    // Track user behavior patterns
    const interaction = {
      timestamp: Date.now(),
      type,
      data,
      context: data.context || 'unknown'
    };

    this.metrics.userBehavior.interactionPatterns.push(interaction);
    
    // Update content view tracking
    if (data.contentId) {
      const viewCount = this.metrics.userBehavior.contentViewed.get(data.contentId) || 0;
      this.metrics.userBehavior.contentViewed.set(data.contentId, viewCount + 1);
    }

    // Update preferred contexts
    if (data.context) {
      this.updateMapCounter(this.metrics.userBehavior.preferredContexts, data.context);
    }
  }

  /**
   * Track context switching performance
   */
  trackContextSwitch(fromContext, toContext, switchTime) {
    this.metrics.performance.contextSwitchTimes.push({
      timestamp: Date.now(),
      fromContext,
      toContext,
      switchTime
    });

    // Analyze context switch patterns
    this.analyzeContextSwitchPattern(fromContext, toContext, switchTime);
  }

  /**
   * Track Core Web Vitals for mobile
   */
  trackWebVital(metric, value) {
    switch (metric) {
      case 'LCP':
        this.metrics.performance.lcp.push({
          timestamp: Date.now(),
          value
        });
        break;
      case 'FID':
        this.metrics.performance.fid.push({
          timestamp: Date.now(),
          value
        });
        break;
      case 'CLS':
        this.metrics.performance.cls.push({
          timestamp: Date.now(),
          value
        });
        break;
      case 'TTFB':
        this.metrics.performance.ttfb.push({
          timestamp: Date.now(),
          value
        });
        break;
    }

    // Check against thresholds and provide recommendations
    this.analyzeWebVitalPerformance(metric, value);
  }

  /**
   * Track data saver mode effectiveness
   */
  trackDataSaverSavings(originalSize, compressedSize) {
    const savings = originalSize - compressedSize;
    this.metrics.bandwidth.dataSaverSavings += savings;
    
    console.log(`💾 Data saver saved ${this.formatBytes(savings)} on this request`);
  }

  /**
   * Track compression effectiveness
   */
  trackCompressionSavings(originalSize, compressedSize) {
    const savings = originalSize - compressedSize;
    this.metrics.bandwidth.compressionSavings += savings;
  }

  /**
   * Get real-time performance dashboard data
   */
  getRealTimeDashboard() {
    const sessionDuration = Date.now() - this.startTime;
    
    return {
      session: {
        id: this.sessionId,
        duration: this.formatDuration(sessionDuration),
        isActive: this.isTracking
      },
      
      images: {
        loaded: this.metrics.images.totalLoaded,
        failed: this.metrics.images.totalFailed,
        successRate: this.calculateSuccessRate(
          this.metrics.images.totalLoaded,
          this.metrics.images.totalFailed
        ),
        avgLoadTime: Math.round(this.metrics.images.avgLoadTime) + 'ms',
        cacheHitRate: this.calculateCacheHitRate(),
        totalSize: this.formatBytes(this.metrics.images.totalBytes)
      },
      
      bandwidth: {
        totalUsed: this.formatBytes(this.metrics.bandwidth.totalUsed),
        budgetUsed: (this.metrics.bandwidth.totalUsed / this.metrics.bandwidth.sessionBudget * 100).toFixed(1) + '%',
        peakUsage: this.formatBytes(this.metrics.bandwidth.peakUsage),
        dataSaverSavings: this.formatBytes(this.metrics.bandwidth.dataSaverSavings),
        compressionSavings: this.formatBytes(this.metrics.bandwidth.compressionSavings)
      },
      
      performance: {
        lcp: this.getLatestWebVital('lcp'),
        fid: this.getLatestWebVital('fid'),
        cls: this.getLatestWebVital('cls'),
        ttfb: this.getLatestWebVital('ttfb')
      },
      
      battery: {
        level: (this.metrics.battery.currentLevel * 100).toFixed(0) + '%',
        estimatedDrain: (this.metrics.battery.estimatedDrain * 100).toFixed(2) + '%/hour',
        lowPowerActivations: this.metrics.battery.lowPowerModeActivations
      },
      
      network: {
        type: this.metrics.network.connectionType,
        changes: this.metrics.network.connectionChanges,
        adaptations: this.metrics.network.adaptations
      },
      
      gaming: {
        clipsViewed: this.metrics.gaming.clipsViewed,
        screenshotsViewed: this.metrics.gaming.screenshotsViewed,
        tournamentsAccessed: this.metrics.gaming.tournamentsAccessed,
        socialInteractions: this.metrics.gaming.socialInteractions
      }
    };
  }

  /**
   * Get performance insights and recommendations
   */
  getPerformanceInsights() {
    const insights = [];
    const warnings = [];
    const recommendations = [];

    // Image performance analysis
    const avgLoadTime = this.metrics.images.avgLoadTime;
    if (avgLoadTime > ANALYTICS_CONFIG.thresholds.loadTimeNeedsWork) {
      warnings.push(`Average image load time (${Math.round(avgLoadTime)}ms) exceeds threshold`);
      recommendations.push('Consider reducing image quality or implementing more aggressive compression');
    } else if (avgLoadTime < ANALYTICS_CONFIG.thresholds.loadTimeGood) {
      insights.push('Image loading performance is excellent');
    }

    // Cache performance analysis
    const cacheHitRate = this.calculateCacheHitRate();
    if (cacheHitRate < ANALYTICS_CONFIG.thresholds.cacheHitRateGood) {
      warnings.push(`Cache hit rate (${(cacheHitRate * 100).toFixed(1)}%) is below optimal`);
      recommendations.push('Review cache strategies and consider longer TTL for static assets');
    } else {
      insights.push('Cache performance is good');
    }

    // Bandwidth usage analysis
    const bandwidthUsage = this.metrics.bandwidth.totalUsed / this.metrics.bandwidth.sessionBudget;
    if (bandwidthUsage > 0.8) {
      warnings.push('Session bandwidth usage is approaching limit');
      recommendations.push('Enable data saver mode or reduce concurrent loading');
    }

    // Battery impact analysis
    if (this.metrics.battery.estimatedDrain > ANALYTICS_CONFIG.thresholds.batteryImpactLow) {
      warnings.push('High estimated battery impact from media processing');
      recommendations.push('Reduce animation complexity or enable battery optimization mode');
    }

    // Context switching analysis
    const avgContextSwitchTime = this.calculateAverageContextSwitchTime();
    if (avgContextSwitchTime > 500) {
      warnings.push('Context switching is slow');
      recommendations.push('Optimize preloading strategies for anticipated context switches');
    }

    return {
      insights,
      warnings,
      recommendations,
      overallScore: this.calculateOverallPerformanceScore()
    };
  }

  /**
   * Export analytics data for external analysis
   */
  exportAnalyticsData(format = 'json') {
    const exportData = {
      session: {
        id: this.sessionId,
        startTime: this.startTime,
        duration: Date.now() - this.startTime
      },
      metrics: this.metrics,
      realTimeBuffers: this.realTimeBuffers,
      timestamp: new Date().toISOString()
    };

    switch (format) {
      case 'json':
        return JSON.stringify(exportData, null, 2);
      case 'csv':
        return this.convertToCSV(exportData);
      default:
        return exportData;
    }
  }

  /**
   * Initialize performance observer for Web Vitals
   */
  async initializePerformanceObserver() {
    if (!this.options.enablePerformanceObserver || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.trackWebVital('LCP', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          this.trackWebVital('FID', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            this.trackWebVital('CLS', entry.value);
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

    } catch (error) {
      console.warn('Performance Observer setup failed:', error);
    }
  }

  /**
   * Initialize battery tracking
   */
  async initializeBatteryTracking() {
    if (!this.options.enableBatteryTracking) return;

    try {
      if ('getBattery' in navigator) {
        const battery = await navigator.getBattery();
        
        this.metrics.battery.initialLevel = battery.level;
        this.metrics.battery.currentLevel = battery.level;

        battery.addEventListener('levelchange', () => {
          this.metrics.battery.currentLevel = battery.level;
          this.updateBatteryDrainEstimate();
        });
      }
    } catch (error) {
      console.warn('Battery tracking setup failed:', error);
    }
  }

  /**
   * Initialize network tracking
   */
  async initializeNetworkTracking() {
    if (!this.options.enableNetworkTracking) return;

    try {
      if ('connection' in navigator) {
        const connection = navigator.connection;
        this.metrics.network.connectionType = connection.effectiveType || 'unknown';

        connection.addEventListener('change', () => {
          const newType = connection.effectiveType || 'unknown';
          if (newType !== this.metrics.network.connectionType) {
            this.metrics.network.connectionChanges++;
            this.trackNetworkChange(this.metrics.network.connectionType, newType);
            this.metrics.network.connectionType = newType;
          }
        });
      }
    } catch (error) {
      console.warn('Network tracking setup failed:', error);
    }
  }

  /**
   * Helper methods
   */

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  shouldSample(metricType) {
    return Math.random() < ANALYTICS_CONFIG.sampling[metricType];
  }

  updateMapCounter(map, key) {
    const count = map.get(key) || 0;
    map.set(key, count + 1);
  }

  categorizeSizeByBytes(bytes) {
    if (bytes < 10 * 1024) return 'small'; // < 10KB
    if (bytes < 100 * 1024) return 'medium'; // < 100KB
    if (bytes < 1024 * 1024) return 'large'; // < 1MB
    return 'xlarge'; // >= 1MB
  }

  calculateSuccessRate(success, failure) {
    const total = success + failure;
    return total > 0 ? ((success / total) * 100).toFixed(1) + '%' : '0%';
  }

  calculateCacheHitRate() {
    const total = this.metrics.images.cacheHits + this.metrics.images.cacheMisses;
    return total > 0 ? this.metrics.images.cacheHits / total : 0;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Enable debug dashboard overlay
   */
  enableDebugDashboard() {
    const dashboard = document.createElement('div');
    dashboard.id = 'mobile-media-analytics-debug';
    dashboard.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 300px;
      background: rgba(0, 0, 0, 0.9);
      color: #00ff88;
      padding: 1rem;
      border-radius: 8px;
      font-size: 12px;
      font-family: monospace;
      z-index: 10000;
      max-height: 400px;
      overflow-y: auto;
      border: 1px solid rgba(0, 255, 136, 0.3);
    `;

    document.body.appendChild(dashboard);

    // Update dashboard every 2 seconds
    setInterval(() => {
      const data = this.getRealTimeDashboard();
      dashboard.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px;">📊 Mobile Media Analytics</div>
        <div><strong>Session:</strong> ${data.session.duration}</div>
        <div><strong>Images:</strong> ${data.images.loaded} loaded (${data.images.successRate} success)</div>
        <div><strong>Avg Load:</strong> ${data.images.avgLoadTime}</div>
        <div><strong>Cache Hit:</strong> ${(this.calculateCacheHitRate() * 100).toFixed(1)}%</div>
        <div><strong>Bandwidth:</strong> ${data.bandwidth.totalUsed} (${data.bandwidth.budgetUsed})</div>
        <div><strong>Battery:</strong> ${data.battery.level}</div>
        <div><strong>Network:</strong> ${data.network.type}</div>
        <div><strong>Gaming:</strong> ${data.gaming.clipsViewed}C ${data.gaming.screenshotsViewed}S</div>
      `;
    }, 2000);
  }

  /**
   * Cleanup and destroy analytics
   */
  destroy() {
    this.isTracking = false;
    
    // Clean up debug dashboard
    const dashboard = document.getElementById('mobile-media-analytics-debug');
    if (dashboard) {
      dashboard.remove();
    }
    
    console.log('🗑️ Mobile Media Analytics destroyed');
  }
}

// Create and export default instance
export default new MobileMediaAnalytics();