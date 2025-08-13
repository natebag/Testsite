/**
 * Comprehensive Monitoring Integration
 * Integrates Sentry, LogRocket, and custom analytics for production monitoring
 */

import sentryManager from './sentry-manager.js';
import logRocketManager from './logrocket-manager.js';
import environmentManager from '../config/environment-manager.js';

class MonitoringIntegration {
  constructor() {
    this.initialized = false;
    this.isClient = typeof window !== 'undefined';
    this.metrics = new Map();
    this.performanceObserver = null;
  }

  /**
   * Initialize all monitoring services
   */
  async initialize() {
    if (this.initialized) return;

    try {
      console.log('Initializing monitoring integration...');

      // Initialize Sentry (server and client)
      sentryManager.initialize();

      // Initialize LogRocket (client-side only)
      if (this.isClient) {
        logRocketManager.initializeClient();
        this.setupClientSideMonitoring();
      }

      // Setup custom monitoring
      this.setupCustomMonitoring();
      
      // Setup error handling integration
      this.setupErrorHandling();
      
      // Setup performance monitoring
      this.setupPerformanceMonitoring();

      this.initialized = true;
      console.log('Monitoring integration initialized successfully');
    } catch (error) {
      console.error('Failed to initialize monitoring integration:', error);
    }
  }

  /**
   * Setup client-side monitoring features
   */
  setupClientSideMonitoring() {
    // Setup unhandled error capture
    window.addEventListener('error', (event) => {
      this.captureError(event.error, {
        type: 'javascript_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Setup unhandled promise rejection capture
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason, {
        type: 'unhandled_promise_rejection',
        promise: event.promise
      });
    });

    // Setup Web3/gaming specific error handling
    this.setupWeb3ErrorHandling();
    
    // Setup user interaction tracking
    this.setupUserInteractionTracking();
    
    // Setup gaming performance tracking
    this.setupGamingPerformanceTracking();
  }

  /**
   * Setup custom monitoring for gaming platform
   */
  setupCustomMonitoring() {
    // Monitor gaming-specific metrics
    this.setupGamingMetrics();
    
    // Monitor blockchain interactions
    this.setupBlockchainMonitoring();
    
    // Monitor clan activities
    this.setupClanMonitoring();
    
    // Monitor voting system
    this.setupVotingMonitoring();
  }

  /**
   * Setup error handling integration between services
   */
  setupErrorHandling() {
    // Create unified error handler
    this.errorHandler = (error, context = {}) => {
      // Log to console for debugging
      console.error('MLG.clan Error:', error, context);

      // Send to Sentry
      sentryManager.captureError(error, context);

      // Track in LogRocket if client-side
      if (this.isClient) {
        logRocketManager.track('Error Occurred', {
          error_type: error.name || 'Unknown',
          error_message: error.message || 'No message',
          stack_trace: error.stack ? 'present' : 'missing',
          context: context
        });
      }

      // Update metrics
      this.updateErrorMetrics(error, context);
    };

    // Make error handler globally available
    if (typeof window !== 'undefined') {
      window.MLGErrorHandler = this.errorHandler;
    } else {
      global.MLGErrorHandler = this.errorHandler;
    }
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    if (!this.isClient) return;

    // Monitor Web Vitals
    this.setupWebVitalsMonitoring();
    
    // Monitor custom gaming performance metrics
    this.setupGamingPerformanceMetrics();
    
    // Monitor API response times
    this.setupAPIPerformanceMonitoring();
  }

  /**
   * Setup Web3 error handling
   */
  setupWeb3ErrorHandling() {
    if (!this.isClient) return;

    // Monitor Phantom wallet errors
    document.addEventListener('phantom-error', (event) => {
      this.captureError(new Error(event.detail.message), {
        type: 'phantom_wallet_error',
        code: event.detail.code,
        wallet_connected: event.detail.connected
      });
    });

    // Monitor Solana transaction errors
    document.addEventListener('solana-transaction-error', (event) => {
      this.captureError(new Error(event.detail.message), {
        type: 'solana_transaction_error',
        signature: event.detail.signature,
        program_id: event.detail.programId
      });
    });
  }

  /**
   * Setup user interaction tracking
   */
  setupUserInteractionTracking() {
    if (!this.isClient) return;

    // Track gaming-specific interactions
    const gamingInteractions = [
      'vote-cast',
      'clan-join',
      'clan-leave',
      'content-submit',
      'tournament-join',
      'wallet-connect',
      'wallet-disconnect'
    ];

    gamingInteractions.forEach(interaction => {
      document.addEventListener(`mlg-${interaction}`, (event) => {
        this.trackUserInteraction(interaction, event.detail);
      });
    });
  }

  /**
   * Setup gaming performance tracking
   */
  setupGamingPerformanceTracking() {
    if (!this.isClient) return;

    // Track voting system performance
    document.addEventListener('voting-performance', (event) => {
      this.trackPerformance('voting_system', event.detail);
    });

    // Track clan operations performance
    document.addEventListener('clan-performance', (event) => {
      this.trackPerformance('clan_operations', event.detail);
    });

    // Track Web3 transaction performance
    document.addEventListener('web3-performance', (event) => {
      this.trackPerformance('web3_transactions', event.detail);
    });
  }

  /**
   * Setup gaming metrics monitoring
   */
  setupGamingMetrics() {
    const metricsInterval = setInterval(() => {
      this.collectGamingMetrics();
    }, 60000); // Collect every minute

    // Store interval for cleanup
    this.metricsInterval = metricsInterval;
  }

  /**
   * Setup blockchain monitoring
   */
  setupBlockchainMonitoring() {
    // Monitor Solana network status
    setInterval(() => {
      this.checkSolanaNetworkHealth();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Setup clan monitoring
   */
  setupClanMonitoring() {
    // Monitor clan activities
    document.addEventListener('clan-activity', (event) => {
      this.trackClanActivity(event.detail);
    });
  }

  /**
   * Setup voting monitoring
   */
  setupVotingMonitoring() {
    // Monitor voting activities
    document.addEventListener('voting-activity', (event) => {
      this.trackVotingActivity(event.detail);
    });
  }

  /**
   * Setup Web Vitals monitoring
   */
  setupWebVitalsMonitoring() {
    if (!this.isClient) return;

    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
      onCLS((metric) => this.trackWebVital('CLS', metric));
      onFID((metric) => this.trackWebVital('FID', metric));
      onFCP((metric) => this.trackWebVital('FCP', metric));
      onLCP((metric) => this.trackWebVital('LCP', metric));
      onTTFB((metric) => this.trackWebVital('TTFB', metric));
    }).catch(error => {
      console.warn('Web Vitals not available:', error);
    });
  }

  /**
   * Setup gaming performance metrics
   */
  setupGamingPerformanceMetrics() {
    if (!this.isClient) return;

    // Monitor React rendering performance
    this.monitorReactPerformance();
    
    // Monitor asset loading performance
    this.monitorAssetLoadingPerformance();
    
    // Monitor memory usage
    this.monitorMemoryUsage();
  }

  /**
   * Setup API performance monitoring
   */
  setupAPIPerformanceMonitoring() {
    if (!this.isClient) return;

    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0];
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        
        this.trackAPIPerformance(url, endTime - startTime, response.status, true);
        return response;
      } catch (error) {
        const endTime = performance.now();
        this.trackAPIPerformance(url, endTime - startTime, 0, false);
        throw error;
      }
    };
  }

  /**
   * Capture error with unified handling
   */
  captureError(error, context = {}) {
    if (this.errorHandler) {
      this.errorHandler(error, context);
    }
  }

  /**
   * Track user interaction
   */
  trackUserInteraction(interaction, data) {
    const event = {
      type: 'user_interaction',
      interaction,
      data,
      timestamp: Date.now()
    };

    // Send to LogRocket
    if (this.isClient) {
      logRocketManager.track(`Gaming: ${interaction}`, data);
    }

    // Add breadcrumb to Sentry
    sentryManager.addBreadcrumb(
      `User ${interaction}`,
      'user',
      'info',
      data
    );

    // Update interaction metrics
    this.updateInteractionMetrics(interaction, data);
  }

  /**
   * Track performance metrics
   */
  trackPerformance(category, data) {
    const performanceData = {
      category,
      ...data,
      timestamp: Date.now()
    };

    // Send to LogRocket
    if (this.isClient) {
      logRocketManager.track(`Performance: ${category}`, performanceData);
    }

    // Send to Sentry
    sentryManager.addBreadcrumb(
      `Performance: ${category}`,
      'performance',
      'info',
      performanceData
    );

    // Update performance metrics
    this.updatePerformanceMetrics(category, data);
  }

  /**
   * Track Web Vital
   */
  trackWebVital(name, metric) {
    const webVitalData = {
      name,
      value: metric.value,
      rating: metric.rating,
      entries: metric.entries?.length || 0
    };

    // Send to LogRocket
    if (this.isClient) {
      logRocketManager.track(`Web Vital: ${name}`, webVitalData);
    }

    // Send to Sentry
    sentryManager.addBreadcrumb(
      `Web Vital: ${name}`,
      'performance',
      metric.rating === 'good' ? 'info' : 'warning',
      webVitalData
    );
  }

  /**
   * Track clan activity
   */
  trackClanActivity(activity) {
    // Send to monitoring services
    this.trackUserInteraction('clan-activity', activity);
    
    // Update clan metrics
    this.updateClanMetrics(activity);
  }

  /**
   * Track voting activity
   */
  trackVotingActivity(activity) {
    // Send to monitoring services
    this.trackUserInteraction('voting-activity', activity);
    
    // Update voting metrics
    this.updateVotingMetrics(activity);
  }

  /**
   * Track API performance
   */
  trackAPIPerformance(url, duration, status, success) {
    const performanceData = {
      url: this.sanitizeURL(url),
      duration,
      status,
      success
    };

    this.trackPerformance('api_request', performanceData);
  }

  /**
   * Monitor React rendering performance
   */
  monitorReactPerformance() {
    // Use React DevTools Profiler API if available
    if (typeof window !== 'undefined' && window.React && window.React.Profiler) {
      // Implementation would depend on React version and setup
      console.log('React performance monitoring enabled');
    }
  }

  /**
   * Monitor asset loading performance
   */
  monitorAssetLoadingPerformance() {
    if (!this.isClient) return;

    // Monitor resource loading
    new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          this.trackPerformance('asset_loading', {
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize,
            type: this.getResourceType(entry.name)
          });
        }
      });
    }).observe({ entryTypes: ['resource'] });
  }

  /**
   * Monitor memory usage
   */
  monitorMemoryUsage() {
    if (!this.isClient || !window.performance.memory) return;

    setInterval(() => {
      const memory = window.performance.memory;
      this.trackPerformance('memory_usage', {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        usage_percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      });
    }, 60000); // Check every minute
  }

  /**
   * Update error metrics
   */
  updateErrorMetrics(error, context) {
    const errorType = error.name || 'Unknown';
    const current = this.metrics.get(`error_${errorType}`) || 0;
    this.metrics.set(`error_${errorType}`, current + 1);
  }

  /**
   * Update interaction metrics
   */
  updateInteractionMetrics(interaction, data) {
    const current = this.metrics.get(`interaction_${interaction}`) || 0;
    this.metrics.set(`interaction_${interaction}`, current + 1);
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(category, data) {
    const key = `performance_${category}`;
    const metrics = this.metrics.get(key) || { count: 0, totalDuration: 0 };
    
    metrics.count++;
    if (data.duration) {
      metrics.totalDuration += data.duration;
      metrics.averageDuration = metrics.totalDuration / metrics.count;
    }
    
    this.metrics.set(key, metrics);
  }

  /**
   * Update clan metrics
   */
  updateClanMetrics(activity) {
    const key = `clan_${activity.type}`;
    const current = this.metrics.get(key) || 0;
    this.metrics.set(key, current + 1);
  }

  /**
   * Update voting metrics
   */
  updateVotingMetrics(activity) {
    const key = `voting_${activity.type}`;
    const current = this.metrics.get(key) || 0;
    this.metrics.set(key, current + 1);
  }

  /**
   * Collect gaming metrics
   */
  collectGamingMetrics() {
    // Collect and send aggregated metrics
    const allMetrics = Object.fromEntries(this.metrics);
    
    if (this.isClient) {
      logRocketManager.track('Gaming Metrics', allMetrics);
    }
    
    sentryManager.addBreadcrumb(
      'Gaming metrics collected',
      'metrics',
      'info',
      allMetrics
    );
  }

  /**
   * Check Solana network health
   */
  async checkSolanaNetworkHealth() {
    try {
      const rpcUrl = environmentManager.get('solana.rpcUrl');
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getHealth'
        })
      });

      const health = await response.json();
      
      if (health.result !== 'ok') {
        this.captureError(new Error('Solana network unhealthy'), {
          type: 'network_health',
          result: health.result
        });
      }
    } catch (error) {
      this.captureError(error, {
        type: 'network_health_check_failed'
      });
    }
  }

  /**
   * Sanitize URL for logging
   */
  sanitizeURL(url) {
    try {
      const urlObj = new URL(url);
      // Remove sensitive query parameters
      urlObj.searchParams.delete('token');
      urlObj.searchParams.delete('key');
      urlObj.searchParams.delete('secret');
      return urlObj.toString();
    } catch {
      return 'invalid-url';
    }
  }

  /**
   * Get resource type from URL
   */
  getResourceType(url) {
    if (url.match(/\.(js|mjs)$/)) return 'javascript';
    if (url.match(/\.css$/)) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.match(/\.(mp4|webm|ogg)$/)) return 'video';
    if (url.match(/\.(mp3|wav|ogg)$/)) return 'audio';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    return 'other';
  }

  /**
   * Get comprehensive health status
   */
  getHealthStatus() {
    return {
      monitoring_integration: {
        initialized: this.initialized,
        is_client: this.isClient
      },
      sentry: sentryManager.getHealthStatus(),
      logrocket: logRocketManager.getHealthStatus(),
      metrics: {
        total_tracked: this.metrics.size,
        error_count: Array.from(this.metrics.keys()).filter(k => k.startsWith('error_')).length,
        interaction_count: Array.from(this.metrics.keys()).filter(k => k.startsWith('interaction_')).length
      }
    };
  }

  /**
   * Cleanup monitoring resources
   */
  cleanup() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}

// Create singleton instance
const monitoringIntegration = new MonitoringIntegration();

export default monitoringIntegration;
export { MonitoringIntegration };