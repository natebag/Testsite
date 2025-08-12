/**
 * MLG.clan PWA Performance Monitor
 * Monitors and reports on PWA performance metrics, Core Web Vitals, and gaming-specific performance
 */

class PWAPerformanceMonitor {
  constructor() {
    this.metrics = {
      coreWebVitals: {},
      pwaMetrics: {},
      gamingMetrics: {},
      cacheMetrics: {},
      resourceMetrics: {}
    };
    
    this.observers = new Map();
    this.performanceBudgets = {
      LCP: 2500, // Largest Contentful Paint
      FID: 100,  // First Input Delay
      CLS: 0.1,  // Cumulative Layout Shift
      FCP: 1800, // First Contentful Paint
      TTFB: 800, // Time to First Byte
      cacheHitRate: 80, // Minimum cache hit rate %
      offlineReadyTime: 3000, // Time to be offline ready
      swActivationTime: 1000, // Service worker activation time
      backgroundSyncTime: 5000 // Background sync completion time
    };
    
    this.gamingBudgets = {
      frameRate: 60,
      inputLatency: 50,
      assetLoadTime: 2000,
      stateUpdateTime: 16.67 // 60fps = 16.67ms per frame
    };
    
    this.reportingEnabled = true;
    this.reportingInterval = 30000; // 30 seconds
    this.performanceEntries = [];
    
    this.init();
  }

  /**
   * Initialize performance monitoring
   */
  async init() {
    try {
      // Setup Core Web Vitals monitoring
      await this.setupCoreWebVitalsMonitoring();
      
      // Setup PWA-specific monitoring
      await this.setupPWAMonitoring();
      
      // Setup gaming performance monitoring
      await this.setupGamingPerformanceMonitoring();
      
      // Setup cache performance monitoring
      await this.setupCacheMonitoring();
      
      // Setup resource monitoring
      await this.setupResourceMonitoring();
      
      // Start periodic reporting
      this.startPeriodicReporting();
      
      console.log('[PWA Performance] Monitor initialized successfully');
    } catch (error) {
      console.error('[PWA Performance] Monitor initialization failed:', error);
    }
  }

  /**
   * Setup Core Web Vitals monitoring
   */
  async setupCoreWebVitalsMonitoring() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      this.observeMetric('largest-contentful-paint', (entries) => {
        const entry = entries[entries.length - 1];
        this.metrics.coreWebVitals.LCP = entry.startTime;
        this.checkBudget('LCP', entry.startTime);
      });

      // First Input Delay (FID)
      this.observeMetric('first-input', (entries) => {
        const entry = entries[0];
        this.metrics.coreWebVitals.FID = entry.processingStart - entry.startTime;
        this.checkBudget('FID', this.metrics.coreWebVitals.FID);
      });

      // Cumulative Layout Shift (CLS)
      this.observeMetric('layout-shift', (entries) => {
        let clsValue = 0;
        for (const entry of entries) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.metrics.coreWebVitals.CLS = clsValue;
        this.checkBudget('CLS', clsValue);
      });

      // First Contentful Paint (FCP)
      this.observeMetric('paint', (entries) => {
        for (const entry of entries) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.coreWebVitals.FCP = entry.startTime;
            this.checkBudget('FCP', entry.startTime);
          }
        }
      });
    }

    // Navigation timing for TTFB
    this.measureNavigationTiming();
  }

  /**
   * Setup PWA-specific monitoring
   */
  async setupPWAMonitoring() {
    // Service Worker activation time
    if ('serviceWorker' in navigator) {
      const startTime = performance.now();
      
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const activationTime = performance.now() - startTime;
          this.metrics.pwaMetrics.swActivationTime = activationTime;
          this.checkBudget('swActivationTime', activationTime);
        }
      } catch (error) {
        console.error('[PWA Performance] SW activation monitoring failed:', error);
      }
    }

    // App install prompt metrics
    this.monitorInstallPrompt();

    // Offline readiness time
    this.measureOfflineReadiness();

    // Background sync performance
    this.monitorBackgroundSync();

    // Cache performance
    this.monitorCachePerformance();
  }

  /**
   * Setup gaming performance monitoring
   */
  async setupGamingPerformanceMonitoring() {
    // Frame rate monitoring
    this.monitorFrameRate();

    // Input latency monitoring
    this.monitorInputLatency();

    // Asset loading performance
    this.monitorAssetLoading();

    // State update performance
    this.monitorStateUpdates();

    // Gaming-specific resource usage
    this.monitorGamingResources();
  }

  /**
   * Setup cache monitoring
   */
  async setupCacheMonitoring() {
    // Cache hit/miss rates
    this.originalFetch = window.fetch;
    window.fetch = this.instrumentedFetch.bind(this);

    // Cache storage usage
    this.monitorCacheStorage();

    // Cache effectiveness
    this.measureCacheEffectiveness();
  }

  /**
   * Setup resource monitoring
   */
  async setupResourceMonitoring() {
    // Resource loading times
    if ('PerformanceObserver' in window) {
      this.observeMetric('resource', (entries) => {
        for (const entry of entries) {
          this.processResourceEntry(entry);
        }
      });
    }

    // Memory usage monitoring
    this.monitorMemoryUsage();

    // Network information
    this.monitorNetworkConditions();
  }

  /**
   * Observe performance metrics
   */
  observeMetric(type, callback) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      
      observer.observe({ type, buffered: true });
      this.observers.set(type, observer);
    } catch (error) {
      console.error(`[PWA Performance] Failed to observe ${type}:`, error);
    }
  }

  /**
   * Measure navigation timing
   */
  measureNavigationTiming() {
    if (performance.getEntriesByType) {
      const navigationEntries = performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const entry = navigationEntries[0];
        
        // Time to First Byte
        this.metrics.coreWebVitals.TTFB = entry.responseStart - entry.requestStart;
        this.checkBudget('TTFB', this.metrics.coreWebVitals.TTFB);
        
        // Additional navigation metrics
        this.metrics.pwaMetrics.domInteractive = entry.domInteractive;
        this.metrics.pwaMetrics.domComplete = entry.domComplete;
        this.metrics.pwaMetrics.loadComplete = entry.loadEventEnd;
      }
    }
  }

  /**
   * Monitor install prompt
   */
  monitorInstallPrompt() {
    let promptStartTime = 0;
    
    window.addEventListener('beforeinstallprompt', () => {
      promptStartTime = performance.now();
    });

    window.addEventListener('appinstalled', () => {
      if (promptStartTime > 0) {
        const installTime = performance.now() - promptStartTime;
        this.metrics.pwaMetrics.installTime = installTime;
        console.log('[PWA Performance] App install time:', installTime);
      }
    });
  }

  /**
   * Measure offline readiness
   */
  measureOfflineReadiness() {
    const startTime = performance.now();
    
    // Check when critical resources are cached
    const checkOfflineReadiness = async () => {
      try {
        const cache = await caches.open('mlg-clan-static-v1.0.0');
        const keys = await cache.keys();
        
        if (keys.length > 0) {
          const readinessTime = performance.now() - startTime;
          this.metrics.pwaMetrics.offlineReadyTime = readinessTime;
          this.checkBudget('offlineReadyTime', readinessTime);
        }
      } catch (error) {
        console.error('[PWA Performance] Offline readiness check failed:', error);
      }
    };

    // Check periodically until ready
    const checkInterval = setInterval(() => {
      checkOfflineReadiness().then(() => {
        if (this.metrics.pwaMetrics.offlineReadyTime) {
          clearInterval(checkInterval);
        }
      });
    }, 500);

    // Stop checking after 10 seconds
    setTimeout(() => clearInterval(checkInterval), 10000);
  }

  /**
   * Monitor background sync
   */
  monitorBackgroundSync() {
    // Track sync registration time
    const originalSync = navigator.serviceWorker?.ready.then(registration => {
      if (registration.sync) {
        const originalRegister = registration.sync.register.bind(registration.sync);
        
        registration.sync.register = function(tag) {
          const startTime = performance.now();
          
          return originalRegister(tag).then(result => {
            const syncTime = performance.now() - startTime;
            this.metrics.pwaMetrics.backgroundSyncTime = syncTime;
            this.checkBudget('backgroundSyncTime', syncTime);
            return result;
          });
        }.bind(this);
      }
    });
  }

  /**
   * Monitor cache performance
   */
  monitorCachePerformance() {
    this.cacheStats = {
      hits: 0,
      misses: 0,
      totalRequests: 0
    };
  }

  /**
   * Monitor frame rate
   */
  monitorFrameRate() {
    let frameCount = 0;
    let lastTime = performance.now();
    let fps = 0;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        this.metrics.gamingMetrics.frameRate = fps;
        this.checkGamingBudget('frameRate', fps);
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  /**
   * Monitor input latency
   */
  monitorInputLatency() {
    const inputTypes = ['click', 'keydown', 'touchstart'];
    
    inputTypes.forEach(type => {
      document.addEventListener(type, (event) => {
        const inputTime = performance.now();
        
        requestAnimationFrame(() => {
          const latency = performance.now() - inputTime;
          this.metrics.gamingMetrics.inputLatency = latency;
          this.checkGamingBudget('inputLatency', latency);
        });
      });
    });
  }

  /**
   * Monitor asset loading
   */
  monitorAssetLoading() {
    // Track gaming-specific asset loading
    const gamingAssetTypes = ['image', 'script', 'stylesheet'];
    
    if ('PerformanceObserver' in window) {
      this.observeMetric('resource', (entries) => {
        for (const entry of entries) {
          if (gamingAssetTypes.includes(entry.initiatorType) && 
              (entry.name.includes('gaming') || entry.name.includes('mlg'))) {
            
            const loadTime = entry.responseEnd - entry.startTime;
            this.metrics.gamingMetrics.assetLoadTime = Math.max(
              this.metrics.gamingMetrics.assetLoadTime || 0, 
              loadTime
            );
            
            this.checkGamingBudget('assetLoadTime', loadTime);
          }
        }
      });
    }
  }

  /**
   * Monitor state updates
   */
  monitorStateUpdates() {
    // Hook into state management updates
    if (window.stateManager) {
      const originalDispatch = window.stateManager.dispatch?.bind(window.stateManager);
      
      if (originalDispatch) {
        window.stateManager.dispatch = (action) => {
          const startTime = performance.now();
          
          const result = originalDispatch(action);
          
          const updateTime = performance.now() - startTime;
          this.metrics.gamingMetrics.stateUpdateTime = updateTime;
          this.checkGamingBudget('stateUpdateTime', updateTime);
          
          return result;
        };
      }
    }
  }

  /**
   * Monitor gaming resources
   */
  monitorGamingResources() {
    // Monitor WebGL context if available
    if (window.WebGLRenderingContext) {
      this.monitorWebGLPerformance();
    }

    // Monitor WebSocket performance for real-time features
    this.monitorWebSocketPerformance();

    // Monitor local storage usage
    this.monitorStorageUsage();
  }

  /**
   * Monitor WebGL performance
   */
  monitorWebGLPerformance() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (gl) {
      const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
      if (ext) {
        // GPU timing queries if supported
        this.metrics.gamingMetrics.webglSupported = true;
      }
    }
  }

  /**
   * Monitor WebSocket performance
   */
  monitorWebSocketPerformance() {
    const originalWebSocket = window.WebSocket;
    
    window.WebSocket = function(url, protocols) {
      const ws = new originalWebSocket(url, protocols);
      const startTime = performance.now();
      
      ws.addEventListener('open', () => {
        const connectionTime = performance.now() - startTime;
        this.metrics.gamingMetrics.websocketConnectionTime = connectionTime;
      });
      
      return ws;
    }.bind(this);
  }

  /**
   * Monitor storage usage
   */
  monitorStorageUsage() {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(estimate => {
        this.metrics.resourceMetrics.storageUsed = estimate.usage;
        this.metrics.resourceMetrics.storageQuota = estimate.quota;
        this.metrics.resourceMetrics.storageUsagePercent = 
          (estimate.usage / estimate.quota * 100).toFixed(2);
      });
    }
  }

  /**
   * Instrumented fetch for cache monitoring
   */
  async instrumentedFetch(resource, options) {
    const startTime = performance.now();
    this.cacheStats.totalRequests++;
    
    try {
      const response = await this.originalFetch(resource, options);
      const loadTime = performance.now() - startTime;
      
      // Check if response came from cache
      if (response.headers.get('cache-control') || 
          response.headers.get('age') ||
          loadTime < 10) { // Very fast response likely from cache
        this.cacheStats.hits++;
      } else {
        this.cacheStats.misses++;
      }
      
      // Calculate cache hit rate
      const hitRate = (this.cacheStats.hits / this.cacheStats.totalRequests) * 100;
      this.metrics.cacheMetrics.hitRate = hitRate;
      this.checkBudget('cacheHitRate', hitRate);
      
      return response;
    } catch (error) {
      this.cacheStats.misses++;
      throw error;
    }
  }

  /**
   * Monitor cache storage
   */
  async monitorCacheStorage() {
    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        totalSize += keys.length;
      }
      
      this.metrics.cacheMetrics.totalCaches = cacheNames.length;
      this.metrics.cacheMetrics.totalCachedItems = totalSize;
    } catch (error) {
      console.error('[PWA Performance] Cache storage monitoring failed:', error);
    }
  }

  /**
   * Measure cache effectiveness
   */
  measureCacheEffectiveness() {
    // Monitor cache effectiveness over time
    setInterval(() => {
      this.monitorCacheStorage();
    }, 60000); // Every minute
  }

  /**
   * Process resource entry
   */
  processResourceEntry(entry) {
    const resourceType = entry.initiatorType;
    const loadTime = entry.responseEnd - entry.startTime;
    
    if (!this.metrics.resourceMetrics[resourceType]) {
      this.metrics.resourceMetrics[resourceType] = {
        count: 0,
        totalTime: 0,
        averageTime: 0
      };
    }
    
    const typeMetrics = this.metrics.resourceMetrics[resourceType];
    typeMetrics.count++;
    typeMetrics.totalTime += loadTime;
    typeMetrics.averageTime = typeMetrics.totalTime / typeMetrics.count;
  }

  /**
   * Monitor memory usage
   */
  monitorMemoryUsage() {
    if (performance.memory) {
      this.metrics.resourceMetrics.memoryUsed = performance.memory.usedJSHeapSize;
      this.metrics.resourceMetrics.memoryLimit = performance.memory.jsHeapSizeLimit;
      this.metrics.resourceMetrics.memoryUsagePercent = 
        (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100).toFixed(2);
    }
  }

  /**
   * Monitor network conditions
   */
  monitorNetworkConditions() {
    if (navigator.connection) {
      this.metrics.resourceMetrics.networkType = navigator.connection.effectiveType;
      this.metrics.resourceMetrics.downlink = navigator.connection.downlink;
      this.metrics.resourceMetrics.rtt = navigator.connection.rtt;
      
      navigator.connection.addEventListener('change', () => {
        this.metrics.resourceMetrics.networkType = navigator.connection.effectiveType;
        this.metrics.resourceMetrics.downlink = navigator.connection.downlink;
        this.metrics.resourceMetrics.rtt = navigator.connection.rtt;
      });
    }
  }

  /**
   * Check performance budget
   */
  checkBudget(metric, value) {
    const budget = this.performanceBudgets[metric];
    if (budget && value > budget) {
      console.warn(`[PWA Performance] Budget exceeded for ${metric}: ${value} > ${budget}`);
      this.reportBudgetViolation(metric, value, budget);
    }
  }

  /**
   * Check gaming budget
   */
  checkGamingBudget(metric, value) {
    const budget = this.gamingBudgets[metric];
    if (budget) {
      const exceeded = metric === 'frameRate' ? value < budget : value > budget;
      
      if (exceeded) {
        console.warn(`[PWA Performance] Gaming budget exceeded for ${metric}: ${value} vs ${budget}`);
        this.reportBudgetViolation(`gaming_${metric}`, value, budget);
      }
    }
  }

  /**
   * Report budget violation
   */
  reportBudgetViolation(metric, actual, budget) {
    const violation = {
      metric,
      actual,
      budget,
      timestamp: Date.now(),
      url: location.href,
      userAgent: navigator.userAgent
    };
    
    // Send to analytics if available
    if (window.gtag) {
      window.gtag('event', 'performance_budget_violation', {
        event_category: 'Performance',
        event_label: metric,
        value: Math.round(actual)
      });
    }
    
    // Store for reporting
    this.performanceEntries.push(violation);
  }

  /**
   * Start periodic reporting
   */
  startPeriodicReporting() {
    if (!this.reportingEnabled) return;
    
    setInterval(() => {
      this.generatePerformanceReport();
    }, this.reportingInterval);
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport() {
    const report = {
      timestamp: Date.now(),
      url: location.href,
      userAgent: navigator.userAgent,
      ...this.metrics,
      budgetViolations: this.performanceEntries.slice(-10), // Last 10 violations
      scores: this.calculatePerformanceScores()
    };
    
    console.log('[PWA Performance] Report generated:', report);
    
    // Send to monitoring endpoint
    this.sendReport(report);
    
    return report;
  }

  /**
   * Calculate performance scores
   */
  calculatePerformanceScores() {
    const scores = {};
    
    // Core Web Vitals score
    const cwvScores = {
      LCP: this.scoreMetric(this.metrics.coreWebVitals.LCP, 2500, 4000),
      FID: this.scoreMetric(this.metrics.coreWebVitals.FID, 100, 300),
      CLS: this.scoreMetric(this.metrics.coreWebVitals.CLS, 0.1, 0.25, true),
      FCP: this.scoreMetric(this.metrics.coreWebVitals.FCP, 1800, 3000),
      TTFB: this.scoreMetric(this.metrics.coreWebVitals.TTFB, 800, 1800)
    };
    
    scores.coreWebVitals = Object.values(cwvScores).reduce((sum, score) => sum + score, 0) / Object.keys(cwvScores).length;
    
    // PWA score
    scores.pwa = this.calculatePWAScore();
    
    // Gaming performance score
    scores.gaming = this.calculateGamingScore();
    
    // Overall score
    scores.overall = Math.round((scores.coreWebVitals + scores.pwa + scores.gaming) / 3);
    
    return scores;
  }

  /**
   * Score individual metric
   */
  scoreMetric(value, good, poor, reverse = false) {
    if (value === undefined) return 0;
    
    if (reverse) {
      if (value <= good) return 100;
      if (value >= poor) return 0;
      return Math.round(100 - ((value - good) / (poor - good)) * 100);
    } else {
      if (value <= good) return 100;
      if (value >= poor) return 0;
      return Math.round(100 - ((value - good) / (poor - good)) * 100);
    }
  }

  /**
   * Calculate PWA score
   */
  calculatePWAScore() {
    const pwaMetrics = this.metrics.pwaMetrics;
    let score = 0;
    let count = 0;
    
    if (pwaMetrics.swActivationTime) {
      score += this.scoreMetric(pwaMetrics.swActivationTime, 1000, 3000);
      count++;
    }
    
    if (pwaMetrics.offlineReadyTime) {
      score += this.scoreMetric(pwaMetrics.offlineReadyTime, 3000, 10000);
      count++;
    }
    
    if (this.metrics.cacheMetrics.hitRate) {
      score += Math.round(this.metrics.cacheMetrics.hitRate);
      count++;
    }
    
    return count > 0 ? Math.round(score / count) : 0;
  }

  /**
   * Calculate gaming score
   */
  calculateGamingScore() {
    const gamingMetrics = this.metrics.gamingMetrics;
    let score = 0;
    let count = 0;
    
    if (gamingMetrics.frameRate) {
      score += Math.min(100, Math.round((gamingMetrics.frameRate / 60) * 100));
      count++;
    }
    
    if (gamingMetrics.inputLatency) {
      score += this.scoreMetric(gamingMetrics.inputLatency, 50, 200);
      count++;
    }
    
    if (gamingMetrics.assetLoadTime) {
      score += this.scoreMetric(gamingMetrics.assetLoadTime, 2000, 5000);
      count++;
    }
    
    return count > 0 ? Math.round(score / count) : 0;
  }

  /**
   * Send report to monitoring endpoint
   */
  async sendReport(report) {
    try {
      if (navigator.onLine) {
        await fetch('/api/performance/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report)
        });
      }
    } catch (error) {
      console.error('[PWA Performance] Failed to send report:', error);
    }
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics() {
    return { ...this.metrics };
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const scores = this.calculatePerformanceScores();
    
    return {
      scores,
      metrics: this.metrics,
      budgetViolations: this.performanceEntries.length,
      recommendations: this.generateRecommendations(scores)
    };
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(scores) {
    const recommendations = [];
    
    if (scores.coreWebVitals < 75) {
      recommendations.push('Optimize Core Web Vitals - Consider image optimization and code splitting');
    }
    
    if (scores.pwa < 75) {
      recommendations.push('Improve PWA performance - Optimize service worker and caching strategy');
    }
    
    if (scores.gaming < 75) {
      recommendations.push('Enhance gaming performance - Optimize frame rate and reduce input latency');
    }
    
    if (this.metrics.cacheMetrics.hitRate < 80) {
      recommendations.push('Improve cache effectiveness - Review caching strategy for better hit rates');
    }
    
    if (this.performanceEntries.length > 5) {
      recommendations.push('Address performance budget violations - Multiple metrics exceeding targets');
    }
    
    return recommendations;
  }

  /**
   * Show performance dashboard
   */
  showPerformanceDashboard() {
    const summary = this.getPerformanceSummary();
    
    console.group('[PWA Performance] Dashboard');
    console.log('Overall Score:', summary.scores.overall);
    console.log('Core Web Vitals Score:', summary.scores.coreWebVitals);
    console.log('PWA Score:', summary.scores.pwa);
    console.log('Gaming Score:', summary.scores.gaming);
    console.log('Budget Violations:', summary.budgetViolations);
    console.log('Recommendations:', summary.recommendations);
    console.log('Full Metrics:', summary.metrics);
    console.groupEnd();
    
    return summary;
  }

  /**
   * Cleanup observers
   */
  cleanup() {
    // Disconnect all performance observers
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
    
    // Restore original fetch
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
    }
    
    console.log('[PWA Performance] Monitor cleaned up');
  }
}

// Initialize global PWA performance monitor
window.pwaPerformanceMonitor = new PWAPerformanceMonitor();

export { PWAPerformanceMonitor };
export default PWAPerformanceMonitor;