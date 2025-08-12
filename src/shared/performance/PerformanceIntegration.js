/**
 * Performance Monitoring Integration Utilities
 * 
 * Integration utilities to seamlessly add performance monitoring to existing
 * MLG.clan platform components, pages, and gaming operations.
 * 
 * Features:
 * - Easy integration with React components and vanilla JS
 * - Automatic performance tracking for gaming operations
 * - Component-level performance monitoring
 * - Page load and navigation tracking
 * - User interaction performance tracking
 * - Gaming workflow performance monitoring
 * 
 * @author Claude Code - Analytics Architect
 * @version 1.0.0
 * @created 2025-08-12
 */

import { getPerformanceAnalytics } from './PerformanceAnalytics.js';
import { getGamingMetricsTracker } from './GamingMetricsTracker.js';
import { getPerformanceAlertSystem } from './PerformanceAlertSystem.js';
import { getAnalyticsDataPipeline } from './AnalyticsDataPipeline.js';
import { getPerformanceInsightsEngine } from './PerformanceInsightsEngine.js';

/**
 * Performance Integration Manager
 */
export class PerformanceIntegration {
  constructor() {
    this.performanceAnalytics = getPerformanceAnalytics();
    this.gamingMetricsTracker = getGamingMetricsTracker();
    this.alertSystem = getPerformanceAlertSystem();
    this.dataPipeline = getAnalyticsDataPipeline();
    this.insightsEngine = getPerformanceInsightsEngine();
    
    this.isInitialized = false;
    this.activeTrackers = new Map();
  }

  /**
   * Initialize performance monitoring integration
   */
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Initialize all performance systems
      await Promise.all([
        this.performanceAnalytics.initializeAnalytics(),
        this.gamingMetricsTracker.initializeTracking(),
        this.alertSystem.initializeAlertSystem(),
        this.dataPipeline.initializePipeline(),
        this.insightsEngine.initializeEngine()
      ]);
      
      // Setup global event listeners
      this.setupGlobalEventListeners();
      
      // Initialize page load tracking
      this.initializePageLoadTracking();
      
      // Initialize navigation tracking
      this.initializeNavigationTracking();
      
      this.isInitialized = true;
      console.log('Performance monitoring integration initialized');
      
    } catch (error) {
      console.error('Failed to initialize performance monitoring:', error);
      throw error;
    }
  }

  /**
   * Setup global event listeners for automatic tracking
   */
  setupGlobalEventListeners() {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackPageVisibility();
    });
    
    // Track network status changes
    window.addEventListener('online', () => {
      this.trackNetworkStatus('online');
    });
    
    window.addEventListener('offline', () => {
      this.trackNetworkStatus('offline');
    });
    
    // Track window focus/blur for gaming context
    window.addEventListener('focus', () => {
      this.trackWindowFocus('focused');
    });
    
    window.addEventListener('blur', () => {
      this.trackWindowFocus('blurred');
    });
  }

  /**
   * Initialize page load performance tracking
   */
  initializePageLoadTracking() {
    // Track initial page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.trackPageLoad('dom_ready');
      });
      
      window.addEventListener('load', () => {
        this.trackPageLoad('fully_loaded');
      });
    } else {
      // Page already loaded
      this.trackPageLoad('already_loaded');
    }
  }

  /**
   * Initialize navigation performance tracking
   */
  initializeNavigationTracking() {
    // Track hash changes (for SPA routing)
    window.addEventListener('hashchange', (event) => {
      this.trackNavigation(event.oldURL, event.newURL, 'hash');
    });
    
    // Track popstate events (browser back/forward)
    window.addEventListener('popstate', (event) => {
      this.trackNavigation(document.referrer, window.location.href, 'popstate');
    });
  }

  /**
   * Track page load performance
   */
  trackPageLoad(phase) {
    const navigation = performance.getEntriesByType('navigation')[0];
    if (!navigation) return;
    
    this.performanceAnalytics.recordMetric('page_load', {
      phase,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: this.getFirstPaintTime(),
      firstContentfulPaint: this.getFirstContentfulPaintTime(),
      timeToInteractive: this.estimateTimeToInteractive(navigation),
      url: window.location.href,
      timestamp: Date.now()
    });
  }

  /**
   * Track navigation performance
   */
  trackNavigation(fromUrl, toUrl, type) {
    const timingId = this.gamingMetricsTracker.startGamingTimer('navigation', 
      `nav_${Date.now()}`, {
        fromUrl,
        toUrl,
        type
      });
    
    // Complete navigation tracking after a short delay
    setTimeout(() => {
      this.gamingMetricsTracker.endGamingTimer('navigation', timingId);
    }, 100);
  }

  /**
   * Track page visibility changes
   */
  trackPageVisibility() {
    this.performanceAnalytics.recordUXMetric('page_visibility', {
      visible: !document.hidden,
      visibilityState: document.visibilityState,
      timestamp: Date.now()
    });
  }

  /**
   * Track network status changes
   */
  trackNetworkStatus(status) {
    this.performanceAnalytics.recordNetworkMetric('network_status', {
      status,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null,
      timestamp: Date.now()
    });
  }

  /**
   * Track window focus changes for gaming context
   */
  trackWindowFocus(state) {
    this.performanceAnalytics.recordUXMetric('window_focus', {
      state,
      timestamp: Date.now()
    });
  }

  /**
   * Get first paint time
   */
  getFirstPaintTime() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : 0;
  }

  /**
   * Get first contentful paint time
   */
  getFirstContentfulPaintTime() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return firstContentfulPaint ? firstContentfulPaint.startTime : 0;
  }

  /**
   * Estimate time to interactive
   */
  estimateTimeToInteractive(navigation) {
    // Simplified TTI estimation
    return navigation.loadEventEnd;
  }

  /**
   * Component Integration Utilities
   */

  /**
   * Create performance wrapper for React components
   */
  withPerformanceTracking(Component, componentName) {
    return function PerformanceWrappedComponent(props) {
      const [renderStartTime] = React.useState(performance.now());
      
      React.useEffect(() => {
        const renderEndTime = performance.now();
        const renderDuration = renderEndTime - renderStartTime;
        
        this.trackComponentRender(componentName, renderDuration);
      }, []);
      
      React.useEffect(() => {
        return () => {
          // Track component unmount
          this.trackComponentUnmount(componentName);
        };
      }, []);
      
      return React.createElement(Component, props);
    }.bind(this);
  }

  /**
   * Track component render performance
   */
  trackComponentRender(componentName, renderDuration) {
    this.gamingMetricsTracker.recordGamingMetric('component_render', {
      componentName,
      renderDuration,
      timestamp: Date.now()
    });
  }

  /**
   * Track component unmount
   */
  trackComponentUnmount(componentName) {
    this.gamingMetricsTracker.recordGamingMetric('component_unmount', {
      componentName,
      timestamp: Date.now()
    });
  }

  /**
   * Gaming Operation Tracking
   */

  /**
   * Track voting operation performance
   */
  trackVoteOperation(voteData) {
    return this.gamingMetricsTracker.startVoteTracking(voteData);
  }

  /**
   * Track leaderboard operation performance
   */
  trackLeaderboardOperation(leaderboardData) {
    return this.gamingMetricsTracker.startLeaderboardTracking(leaderboardData);
  }

  /**
   * Track tournament operation performance
   */
  trackTournamentOperation(tournamentData) {
    return this.gamingMetricsTracker.startTournamentTracking(tournamentData);
  }

  /**
   * Track wallet operation performance
   */
  trackWalletOperation(walletData) {
    return this.gamingMetricsTracker.startWalletTracking(walletData);
  }

  /**
   * Track clan operation performance
   */
  trackClanOperation(clanData) {
    return this.gamingMetricsTracker.startClanTracking(clanData);
  }

  /**
   * Complete operation tracking
   */
  completeOperationTracking(trackingType, timingId, success = true, error = null) {
    const completeMethods = {
      vote: () => this.gamingMetricsTracker.completeVoteTracking(timingId, success, error),
      leaderboard: () => this.gamingMetricsTracker.completeLeaderboardTracking(timingId, success, error),
      tournament: () => this.gamingMetricsTracker.completeTournamentTracking(timingId, success, error),
      wallet: () => this.gamingMetricsTracker.completeWalletTracking(timingId, success, error),
      clan: () => this.gamingMetricsTracker.completeClanTracking(timingId, success, error)
    };
    
    const completeMethod = completeMethods[trackingType];
    if (completeMethod) {
      return completeMethod();
    }
    
    console.warn(`Unknown tracking type: ${trackingType}`);
    return null;
  }

  /**
   * User Interaction Tracking
   */

  /**
   * Track button click performance
   */
  trackButtonClick(buttonName, action) {
    const startTime = performance.now();
    
    return {
      complete: (success = true, error = null) => {
        const duration = performance.now() - startTime;
        
        this.gamingMetricsTracker.recordGamingMetric('button_click', {
          buttonName,
          action,
          duration,
          success,
          error: error?.message,
          timestamp: Date.now()
        });
      }
    };
  }

  /**
   * Track form submission performance
   */
  trackFormSubmission(formName, formData) {
    const startTime = performance.now();
    
    return {
      complete: (success = true, error = null) => {
        const duration = performance.now() - startTime;
        
        this.gamingMetricsTracker.recordGamingMetric('form_submission', {
          formName,
          fieldCount: Object.keys(formData).length,
          duration,
          success,
          error: error?.message,
          timestamp: Date.now()
        });
      }
    };
  }

  /**
   * Track search operation performance
   */
  trackSearchOperation(searchData) {
    const startTime = performance.now();
    
    return {
      complete: (results, error = null) => {
        const duration = performance.now() - startTime;
        
        this.gamingMetricsTracker.recordGamingMetric('search_operation', {
          query: searchData.query,
          filters: searchData.filters,
          resultCount: results ? results.length : 0,
          duration,
          success: !error,
          error: error?.message,
          timestamp: Date.now()
        });
      }
    };
  }

  /**
   * API Request Tracking
   */

  /**
   * Track API request performance
   */
  trackApiRequest(endpoint, method, requestData) {
    const startTime = performance.now();
    
    return {
      complete: (response, error = null) => {
        const duration = performance.now() - startTime;
        
        this.performanceAnalytics.recordMetric('api_request', {
          endpoint,
          method,
          duration,
          status: response?.status,
          size: this.estimateResponseSize(response),
          success: !error && response?.ok,
          error: error?.message,
          timestamp: Date.now()
        });
      }
    };
  }

  /**
   * Estimate response size
   */
  estimateResponseSize(response) {
    if (!response) return 0;
    
    const contentLength = response.headers?.get('content-length');
    if (contentLength) {
      return parseInt(contentLength, 10);
    }
    
    // Estimate based on response data
    try {
      return JSON.stringify(response.data || {}).length;
    } catch {
      return 0;
    }
  }

  /**
   * Resource Loading Tracking
   */

  /**
   * Track resource loading performance
   */
  trackResourceLoading() {
    const resourceEntries = performance.getEntriesByType('resource');
    
    resourceEntries.forEach(entry => {
      this.performanceAnalytics.recordMetric('resource_loading', {
        name: entry.name,
        type: this.getResourceType(entry.name),
        duration: entry.responseEnd - entry.requestStart,
        size: entry.transferSize,
        cached: entry.transferSize === 0,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Get resource type from URL
   */
  getResourceType(url) {
    if (url.match(/\.(js|mjs)$/)) return 'javascript';
    if (url.match(/\.css$/)) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  /**
   * Memory Usage Tracking
   */

  /**
   * Track memory usage
   */
  trackMemoryUsage() {
    if (performance.memory) {
      this.performanceAnalytics.recordDeviceMetric('memory_usage', {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Error Tracking Integration
   */

  /**
   * Track JavaScript errors
   */
  setupErrorTracking() {
    window.addEventListener('error', (event) => {
      this.trackError('javascript_error', {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now()
      });
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError('unhandled_promise_rejection', {
        reason: event.reason,
        promise: event.promise,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Track error occurrence
   */
  trackError(errorType, errorData) {
    this.performanceAnalytics.recordUXMetric('error_occurrence', {
      errorType,
      ...errorData
    });
    
    // Create performance alert for critical errors
    if (errorType === 'javascript_error' && errorData.message.includes('gaming')) {
      this.alertSystem.createPerformanceAlert({
        type: 'gaming_error',
        category: 'reliability',
        severity: 'high',
        message: `Gaming-related JavaScript error: ${errorData.message}`,
        data: errorData,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Gaming Context Tracking
   */

  /**
   * Set competitive gaming context
   */
  setCompetitiveContext(isCompetitive, context = {}) {
    if (isCompetitive) {
      this.gamingMetricsTracker.emit('session:high_stakes', context.sessionId || 'unknown');
      
      if (context.tournamentId) {
        this.gamingMetricsTracker.emit('tournament:started', context.tournamentId);
      }
    } else {
      if (context.tournamentId) {
        this.gamingMetricsTracker.emit('tournament:ended', context.tournamentId);
      }
    }
  }

  /**
   * Track high-value operations
   */
  trackHighValueOperation(operationType, value, context = {}) {
    this.gamingMetricsTracker.recordGamingMetric('high_value_operation', {
      operationType,
      value,
      ...context,
      timestamp: Date.now()
    });
  }

  /**
   * Utility Methods
   */

  /**
   * Check if performance monitoring is initialized
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Get performance dashboard data
   */
  getPerformanceDashboardData() {
    if (!this.isInitialized) return null;
    
    return {
      webVitals: this.performanceAnalytics.getWebVitalsSnapshot(),
      gaming: this.performanceAnalytics.getGamingPerformanceSnapshot(),
      network: this.performanceAnalytics.getNetworkSnapshot(),
      device: this.performanceAnalytics.getDeviceSnapshot(),
      alerts: this.alertSystem.getActiveAlerts(),
      insights: this.insightsEngine.getCurrentInsights(),
      recommendations: this.insightsEngine.getTopRecommendations()
    };
  }

  /**
   * Manually trigger performance analysis
   */
  triggerPerformanceAnalysis() {
    if (!this.isInitialized) return;
    
    this.insightsEngine.generatePeriodicInsights();
    this.trackMemoryUsage();
    this.trackResourceLoading();
  }

  /**
   * Export performance data
   */
  async exportPerformanceData() {
    if (!this.isInitialized) return null;
    
    return {
      analytics: this.performanceAnalytics.getPerformanceSnapshot(),
      gaming: this.gamingMetricsTracker.getOptimizationStats(),
      alerts: this.alertSystem.getAlertStatistics(),
      insights: this.insightsEngine.getCurrentInsights(),
      exportTimestamp: Date.now()
    };
  }

  /**
   * Clean up performance monitoring
   */
  cleanup() {
    if (!this.isInitialized) return;
    
    // Clear active trackers
    this.activeTrackers.clear();
    
    // Shutdown all systems
    this.insightsEngine.shutdown();
    this.dataPipeline.shutdown();
    this.alertSystem.shutdown();
    this.gamingMetricsTracker.shutdown();
    this.performanceAnalytics.shutdown();
    
    this.isInitialized = false;
  }
}

/**
 * React Hook for Performance Tracking
 */
export function usePerformanceTracking(componentName, dependencies = []) {
  const [renderTime, setRenderTime] = React.useState(0);
  const startTimeRef = React.useRef(performance.now());
  
  React.useEffect(() => {
    const endTime = performance.now();
    const duration = endTime - startTimeRef.current;
    setRenderTime(duration);
    
    // Track component render performance
    performanceIntegration.trackComponentRender(componentName, duration);
  }, dependencies);
  
  React.useEffect(() => {
    return () => {
      // Track component unmount
      performanceIntegration.trackComponentUnmount(componentName);
    };
  }, []);
  
  return { renderTime };
}

/**
 * Higher-Order Component for Performance Tracking
 */
export function withPerformanceTracking(Component, componentName) {
  return function PerformanceWrappedComponent(props) {
    const { renderTime } = usePerformanceTracking(componentName, [props]);
    
    return React.createElement(Component, {
      ...props,
      performanceData: { renderTime }
    });
  };
}

/**
 * Performance Decorator for Functions
 */
export function performanceTrack(operationType, context = {}) {
  return function decorator(target, propertyName, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const startTime = performance.now();
      let result, error;
      
      try {
        result = await originalMethod.apply(this, args);
        return result;
      } catch (err) {
        error = err;
        throw err;
      } finally {
        const duration = performance.now() - startTime;
        
        performanceIntegration.gamingMetricsTracker.recordGamingMetric(operationType, {
          methodName: propertyName,
          duration,
          success: !error,
          error: error?.message,
          context,
          timestamp: Date.now()
        });
      }
    };
    
    return descriptor;
  };
}

/**
 * Async Function Performance Wrapper
 */
export function trackAsyncOperation(operationType, operation, context = {}) {
  return async function(...args) {
    const startTime = performance.now();
    let result, error;
    
    try {
      result = await operation.apply(this, args);
      return result;
    } catch (err) {
      error = err;
      throw err;
    } finally {
      const duration = performance.now() - startTime;
      
      performanceIntegration.gamingMetricsTracker.recordGamingMetric(operationType, {
        duration,
        success: !error,
        error: error?.message,
        context,
        timestamp: Date.now()
      });
    }
  };
}

/**
 * DOM Event Performance Tracking
 */
export function trackDOMEvent(element, eventType, handler, trackingName) {
  const wrappedHandler = function(event) {
    const startTime = performance.now();
    
    try {
      const result = handler.call(this, event);
      
      if (result && typeof result.then === 'function') {
        // Handle async handlers
        return result.finally(() => {
          const duration = performance.now() - startTime;
          performanceIntegration.trackButtonClick(trackingName, eventType).complete();
        });
      } else {
        const duration = performance.now() - startTime;
        performanceIntegration.trackButtonClick(trackingName, eventType).complete();
        return result;
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceIntegration.trackButtonClick(trackingName, eventType).complete(false, error);
      throw error;
    }
  };
  
  element.addEventListener(eventType, wrappedHandler);
  
  return function cleanup() {
    element.removeEventListener(eventType, wrappedHandler);
  };
}

// Create singleton instance
const performanceIntegration = new PerformanceIntegration();

// Export singleton instance
export { performanceIntegration };

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      performanceIntegration.initialize().catch(console.error);
    });
  } else {
    performanceIntegration.initialize().catch(console.error);
  }
}

export default performanceIntegration;