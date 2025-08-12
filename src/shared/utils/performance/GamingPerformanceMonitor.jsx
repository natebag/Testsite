/**
 * Gaming Performance Monitor
 * 
 * Real-time performance monitoring for gaming applications
 * Tracks code splitting effectiveness, route loading times, and user experience metrics
 */

import React, { useEffect, useState, useRef } from 'react';

class GamingPerformanceMonitor {
  constructor() {
    this.metrics = {
      routeLoadTimes: new Map(),
      chunkLoadTimes: new Map(),
      webVitals: {},
      userInteractions: [],
      networkCondition: null,
      deviceInfo: null
    };
    
    this.observers = new Map();
    this.performanceEntries = [];
    this.isMonitoring = false;
    
    // Performance thresholds for gaming
    this.thresholds = {
      routeLoadTime: 2000, // 2 seconds
      chunkLoadTime: 1000, // 1 second
      fcp: 1500,           // First Contentful Paint
      lcp: 2500,           // Largest Contentful Paint
      fid: 100,            // First Input Delay
      cls: 0.1             // Cumulative Layout Shift
    };
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    
    console.log('🎮 Starting Gaming Performance Monitoring...');
    this.isMonitoring = true;
    
    // Initialize performance observers
    this.initializeWebVitalsTracking();
    this.initializeResourceTracking();
    this.initializeNavigationTracking();
    this.initializeUserInteractionTracking();
    this.detectNetworkConditions();
    this.detectDeviceCapabilities();
    
    // Start periodic reporting
    this.startPeriodicReporting();
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    console.log('🛑 Stopping Gaming Performance Monitoring...');
    this.isMonitoring = false;
    
    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    // Final performance report
    this.generateFinalReport();
  }

  initializeWebVitalsTracking() {
    // First Contentful Paint (FCP)
    this.observePerformanceEntry('paint', (entry) => {
      if (entry.name === 'first-contentful-paint') {
        this.metrics.webVitals.fcp = entry.startTime;
        this.trackPerformanceMetric('FCP', entry.startTime, this.thresholds.fcp);
      }
    });

    // Largest Contentful Paint (LCP)
    this.observePerformanceEntry('largest-contentful-paint', (entry) => {
      this.metrics.webVitals.lcp = entry.startTime;
      this.trackPerformanceMetric('LCP', entry.startTime, this.thresholds.lcp);
    });

    // First Input Delay (FID) - using PerformanceEventTiming
    this.observePerformanceEntry('first-input', (entry) => {
      const fid = entry.processingStart - entry.startTime;
      this.metrics.webVitals.fid = fid;
      this.trackPerformanceMetric('FID', fid, this.thresholds.fid);
    });

    // Cumulative Layout Shift (CLS)
    this.observePerformanceEntry('layout-shift', (entry) => {
      if (!entry.hadRecentInput) {
        this.metrics.webVitals.cls = (this.metrics.webVitals.cls || 0) + entry.value;
        this.trackPerformanceMetric('CLS', this.metrics.webVitals.cls, this.thresholds.cls);
      }
    });
  }

  initializeResourceTracking() {
    // Track resource loading (chunks, images, etc.)
    this.observePerformanceEntry('resource', (entry) => {
      // Track chunk loading times
      if (entry.name.includes('.js') && entry.name.includes('-')) {
        const chunkName = this.extractChunkName(entry.name);
        const loadTime = entry.responseEnd - entry.startTime;
        
        this.metrics.chunkLoadTimes.set(chunkName, {
          loadTime,
          size: entry.transferSize,
          cached: entry.transferSize === 0,
          timestamp: Date.now()
        });

        if (loadTime > this.thresholds.chunkLoadTime) {
          this.trackSlowChunk(chunkName, loadTime);
        }
      }

      // Track critical gaming assets
      if (this.isCriticalGamingAsset(entry.name)) {
        this.trackCriticalAssetLoad(entry);
      }
    });
  }

  initializeNavigationTracking() {
    // Track route navigation performance
    let currentRoute = this.getCurrentRoute();
    
    // Monitor route changes (for SPA navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    const trackNavigation = (newRoute) => {
      const navigationStart = performance.now();
      
      // Wait for route to load
      requestIdleCallback(() => {
        const navigationEnd = performance.now();
        const routeLoadTime = navigationEnd - navigationStart;
        
        this.metrics.routeLoadTimes.set(newRoute, {
          loadTime: routeLoadTime,
          timestamp: Date.now(),
          fromRoute: currentRoute
        });
        
        if (routeLoadTime > this.thresholds.routeLoadTime) {
          this.trackSlowRoute(newRoute, routeLoadTime);
        }
        
        currentRoute = newRoute;
      });
    };

    history.pushState = function(...args) {
      const newRoute = args[2] || window.location.pathname;
      trackNavigation(newRoute);
      return originalPushState.apply(this, args);
    };

    history.replaceState = function(...args) {
      const newRoute = args[2] || window.location.pathname;
      trackNavigation(newRoute);
      return originalReplaceState.apply(this, args);
    };
  }

  initializeUserInteractionTracking() {
    // Track gaming-specific interactions
    const gamingInteractions = [
      'vote-button-click',
      'wallet-connect-click', 
      'clan-join-click',
      'content-submit-click',
      'leaderboard-view'
    ];

    gamingInteractions.forEach(interactionType => {
      document.addEventListener(interactionType, (event) => {
        const interactionStart = performance.now();
        
        // Track interaction response time
        requestAnimationFrame(() => {
          const interactionEnd = performance.now();
          const responseTime = interactionEnd - interactionStart;
          
          this.metrics.userInteractions.push({
            type: interactionType,
            responseTime,
            timestamp: Date.now(),
            target: event.target?.tagName || 'unknown'
          });

          // Alert on slow interactions
          if (responseTime > 300) { // 300ms threshold for gaming
            console.warn(`🐌 Slow gaming interaction: ${interactionType} (${responseTime.toFixed(2)}ms)`);
          }
        });
      });
    });
  }

  detectNetworkConditions() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      this.metrics.networkCondition = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };

      connection.addEventListener('change', () => {
        this.metrics.networkCondition = {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
          timestamp: Date.now()
        };
        
        // Adjust performance expectations based on network
        this.adjustThresholdsForNetwork();
      });
    }
  }

  detectDeviceCapabilities() {
    this.metrics.deviceInfo = {
      memory: navigator.deviceMemory || 'unknown',
      cores: navigator.hardwareConcurrency || 'unknown',
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }

  observePerformanceEntry(entryType, callback) {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(callback);
      });
      
      observer.observe({ entryTypes: [entryType] });
      this.observers.set(entryType, observer);
    } catch (error) {
      console.warn(`Failed to observe ${entryType}:`, error);
    }
  }

  trackPerformanceMetric(metric, value, threshold) {
    const status = value <= threshold ? 'good' : 'poor';
    const data = {
      metric,
      value,
      threshold,
      status,
      timestamp: Date.now()
    };

    // Store performance entry
    this.performanceEntries.push(data);

    // Real-time alerts for gaming performance
    if (status === 'poor') {
      console.warn(`🎮 Gaming Performance Alert: ${metric} = ${value.toFixed(2)}ms (threshold: ${threshold}ms)`);
      
      // Trigger performance optimization hints
      this.triggerOptimizationHints(metric, value);
    }

    // Send to analytics
    if (window.MLGAnalytics) {
      window.MLGAnalytics.trackPerformance(metric, data);
    }
  }

  trackSlowChunk(chunkName, loadTime) {
    console.warn(`🐌 Slow chunk load: ${chunkName} (${loadTime.toFixed(2)}ms)`);
    
    // Track slow chunk for optimization
    const slowChunkData = {
      chunkName,
      loadTime,
      timestamp: Date.now(),
      networkCondition: this.metrics.networkCondition
    };

    // Store for later analysis
    const existingSlowChunks = JSON.parse(localStorage.getItem('mlg_slow_chunks') || '[]');
    existingSlowChunks.push(slowChunkData);
    
    // Keep only last 50 entries
    if (existingSlowChunks.length > 50) {
      existingSlowChunks.splice(0, existingSlowChunks.length - 50);
    }
    
    localStorage.setItem('mlg_slow_chunks', JSON.stringify(existingSlowChunks));
  }

  trackSlowRoute(route, loadTime) {
    console.warn(`🐌 Slow route load: ${route} (${loadTime.toFixed(2)}ms)`);
    
    // Gaming-specific route optimization hints
    const optimizationHints = {
      '/voting': 'Consider preloading wallet components',
      '/clans': 'Lazy load clan leaderboards',
      '/content': 'Implement virtual scrolling for content lists',
      '/analytics': 'Load charts on-demand',
      '/dao': 'Split governance components'
    };

    const hint = optimizationHints[route];
    if (hint) {
      console.log(`💡 Optimization hint for ${route}: ${hint}`);
    }
  }

  trackCriticalAssetLoad(entry) {
    const assetName = entry.name.split('/').pop();
    const loadTime = entry.responseEnd - entry.startTime;
    
    console.log(`🎯 Critical gaming asset loaded: ${assetName} (${loadTime.toFixed(2)}ms)`);
  }

  adjustThresholdsForNetwork() {
    const { effectiveType, saveData } = this.metrics.networkCondition;
    
    // Adjust thresholds based on network conditions
    switch (effectiveType) {
      case 'slow-2g':
        this.thresholds.routeLoadTime = 8000;
        this.thresholds.chunkLoadTime = 4000;
        break;
      case '2g':
        this.thresholds.routeLoadTime = 6000;
        this.thresholds.chunkLoadTime = 3000;
        break;
      case '3g':
        this.thresholds.routeLoadTime = 4000;
        this.thresholds.chunkLoadTime = 2000;
        break;
      case '4g':
        this.thresholds.routeLoadTime = 2000;
        this.thresholds.chunkLoadTime = 1000;
        break;
    }

    if (saveData) {
      // Increase thresholds if user is on data saver mode
      Object.keys(this.thresholds).forEach(key => {
        this.thresholds[key] *= 1.5;
      });
    }
  }

  triggerOptimizationHints(metric, value) {
    const hints = {
      'FCP': 'Consider preloading critical CSS and fonts',
      'LCP': 'Optimize largest content element (images, text blocks)',
      'FID': 'Reduce JavaScript execution time during load',
      'CLS': 'Add size attributes to images and reserve space for dynamic content'
    };

    const hint = hints[metric];
    if (hint) {
      console.log(`💡 Gaming Performance Hint for ${metric}: ${hint}`);
    }
  }

  extractChunkName(url) {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.replace(/\.[^.]+$/, ''); // Remove file extension
  }

  isCriticalGamingAsset(url) {
    const criticalAssets = [
      'voting',
      'wallet',
      'phantom',
      'critical-',
      'main',
      'index'
    ];
    
    return criticalAssets.some(asset => url.includes(asset));
  }

  getCurrentRoute() {
    return window.location.pathname;
  }

  startPeriodicReporting() {
    // Report performance metrics every 30 seconds
    setInterval(() => {
      if (this.isMonitoring) {
        this.generatePerformanceReport();
      }
    }, 30000);
  }

  generatePerformanceReport() {
    const report = {
      timestamp: Date.now(),
      webVitals: this.metrics.webVitals,
      routePerformance: Object.fromEntries(this.metrics.routeLoadTimes),
      chunkPerformance: Object.fromEntries(this.metrics.chunkLoadTimes),
      recentInteractions: this.metrics.userInteractions.slice(-10),
      networkCondition: this.metrics.networkCondition,
      deviceInfo: this.metrics.deviceInfo,
      performanceScore: this.calculateGamingPerformanceScore()
    };

    // Store locally for analysis
    localStorage.setItem('mlg_performance_report', JSON.stringify(report));
    
    return report;
  }

  generateFinalReport() {
    const finalReport = this.generatePerformanceReport();
    
    console.log('🎮 Gaming Performance Final Report:', finalReport);
    
    // Save to localStorage with timestamp
    const reportKey = `mlg_final_report_${Date.now()}`;
    localStorage.setItem(reportKey, JSON.stringify(finalReport));
    
    return finalReport;
  }

  calculateGamingPerformanceScore() {
    let score = 100;
    const vitals = this.metrics.webVitals;

    // Deduct points based on Web Vitals
    if (vitals.fcp > this.thresholds.fcp) {
      score -= Math.min(20, (vitals.fcp - this.thresholds.fcp) / 100);
    }
    
    if (vitals.lcp > this.thresholds.lcp) {
      score -= Math.min(25, (vitals.lcp - this.thresholds.lcp) / 100);
    }
    
    if (vitals.fid > this.thresholds.fid) {
      score -= Math.min(20, (vitals.fid - this.thresholds.fid) / 10);
    }
    
    if (vitals.cls > this.thresholds.cls) {
      score -= Math.min(15, (vitals.cls - this.thresholds.cls) * 100);
    }

    // Deduct points for slow routes
    const slowRoutes = Array.from(this.metrics.routeLoadTimes.values())
      .filter(route => route.loadTime > this.thresholds.routeLoadTime);
    score -= slowRoutes.length * 5;

    // Deduct points for slow chunks
    const slowChunks = Array.from(this.metrics.chunkLoadTimes.values())
      .filter(chunk => chunk.loadTime > this.thresholds.chunkLoadTime);
    score -= slowChunks.length * 3;

    return Math.max(0, Math.round(score));
  }

  // Public API methods
  getMetrics() {
    return { ...this.metrics };
  }

  getPerformanceScore() {
    return this.calculateGamingPerformanceScore();
  }

  getSlowRoutes() {
    return Array.from(this.metrics.routeLoadTimes.entries())
      .filter(([route, data]) => data.loadTime > this.thresholds.routeLoadTime)
      .map(([route, data]) => ({ route, ...data }));
  }

  getSlowChunks() {
    return Array.from(this.metrics.chunkLoadTimes.entries())
      .filter(([chunk, data]) => data.loadTime > this.thresholds.chunkLoadTime)
      .map(([chunk, data]) => ({ chunk, ...data }));
  }
}

// React component for performance monitoring UI
const GamingPerformancePanel = ({ monitor }) => {
  const [metrics, setMetrics] = useState(monitor.getMetrics());
  const [score, setScore] = useState(monitor.getPerformanceScore());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(monitor.getMetrics());
      setScore(monitor.getPerformanceScore());
    }, 1000);

    return () => clearInterval(interval);
  }, [monitor]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#00ff9d',
          border: 'none',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          cursor: 'pointer',
          zIndex: 9999,
          fontSize: '24px'
        }}
      >
        📊
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: '#1a1a2e',
      color: 'white',
      padding: '1rem',
      borderRadius: '8px',
      maxWidth: '400px',
      zIndex: 9999,
      fontSize: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ margin: 0 }}>🎮 Gaming Performance</h4>
        <button onClick={() => setIsVisible(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '16px', cursor: 'pointer' }}>×</button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: score >= 80 ? '#00ff9d' : score >= 60 ? '#ffa500' : '#ff4444' }}>
          {score}/100
        </div>
        <small>Performance Score</small>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '11px' }}>
        <div>
          <strong>FCP:</strong> {metrics.webVitals.fcp ? `${metrics.webVitals.fcp.toFixed(0)}ms` : 'N/A'}
        </div>
        <div>
          <strong>LCP:</strong> {metrics.webVitals.lcp ? `${metrics.webVitals.lcp.toFixed(0)}ms` : 'N/A'}
        </div>
        <div>
          <strong>FID:</strong> {metrics.webVitals.fid ? `${metrics.webVitals.fid.toFixed(0)}ms` : 'N/A'}
        </div>
        <div>
          <strong>CLS:</strong> {metrics.webVitals.cls ? metrics.webVitals.cls.toFixed(3) : 'N/A'}
        </div>
      </div>

      <div style={{ marginTop: '1rem', fontSize: '11px' }}>
        <div><strong>Routes Loaded:</strong> {metrics.routeLoadTimes.size}</div>
        <div><strong>Chunks Loaded:</strong> {metrics.chunkLoadTimes.size}</div>
        <div><strong>Network:</strong> {metrics.networkCondition?.effectiveType || 'Unknown'}</div>
      </div>
    </div>
  );
};

// Global performance monitor instance
const gamingPerformanceMonitor = new GamingPerformanceMonitor();

// Auto-start monitoring in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  gamingPerformanceMonitor.startMonitoring();
}

export { 
  GamingPerformanceMonitor, 
  GamingPerformancePanel, 
  gamingPerformanceMonitor 
};

export default GamingPerformanceMonitor;