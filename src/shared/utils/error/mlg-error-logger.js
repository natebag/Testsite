/**
 * MLG.clan Error Logging and Reporting System
 * Comprehensive error tracking, analytics, and debugging support
 * 
 * @author Claude Code - Frontend Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

class MLGErrorLogger {
  constructor(options = {}) {
    this.config = {
      maxLogSize: options.maxLogSize || 1000,
      enableConsoleLog: options.enableConsoleLog !== false,
      enableRemoteLogging: options.enableRemoteLogging !== false,
      remoteEndpoint: options.remoteEndpoint || '/api/errors',
      enableLocalStorage: options.enableLocalStorage !== false,
      enableAnalytics: options.enableAnalytics !== false,
      environment: options.environment || 'development',
      userId: options.userId || null,
      sessionId: this.generateSessionId(),
      ...options
    };

    this.errorLog = [];
    this.sessionErrors = new Map();
    this.errorPatterns = new Map();
    this.userActions = [];
    this.performanceMarks = [];
    this.isInitialized = false;
    
    // Error severity levels
    this.SEVERITY = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };
    
    // Error categories with gaming context
    this.CATEGORIES = {
      NETWORK: 'network',
      WALLET: 'wallet',
      TRANSACTION: 'transaction',
      GAME_DATA: 'game_data',
      CLAN: 'clan',
      VOTING: 'voting',
      CONTENT: 'content',
      AUTHENTICATION: 'authentication',
      PERFORMANCE: 'performance',
      UI: 'ui',
      SYSTEM: 'system'
    };

    // Gaming-themed error analytics
    this.analyticsEvents = {
      ERROR_ENCOUNTERED: 'gaming_error_encountered',
      ERROR_RECOVERED: 'gaming_error_recovered',
      ERROR_PATTERN_DETECTED: 'gaming_error_pattern',
      PERFORMANCE_ISSUE: 'gaming_performance_issue',
      USER_FRUSTRATED: 'gaming_user_frustrated'
    };

    this.init();
  }

  init() {
    if (this.isInitialized) return;

    // Load existing logs from storage
    this.loadStoredLogs();
    
    // Setup global error handlers
    this.setupGlobalHandlers();
    
    // Initialize performance monitoring
    this.initPerformanceMonitoring();
    
    // Setup periodic reporting
    this.setupPeriodicReporting();
    
    // Initialize user action tracking
    this.initUserActionTracking();
    
    this.isInitialized = true;
    console.log('🎮 MLG Error Logger initialized');
  }

  generateSessionId() {
    return `mlg_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setupGlobalHandlers() {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'javascript_error',
        message: event.error?.message || event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        category: this.CATEGORIES.SYSTEM,
        severity: this.SEVERITY.HIGH,
        context: {
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        }
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'unhandled_promise_rejection',
        message: event.reason?.message || event.reason,
        stack: event.reason?.stack,
        category: this.CATEGORIES.SYSTEM,
        severity: this.SEVERITY.HIGH,
        context: {
          promise: 'unhandled_rejection',
          url: window.location.href,
          timestamp: new Date().toISOString()
        }
      });
    });

    // Network errors
    if (window.fetch) {
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        try {
          const response = await originalFetch(...args);
          
          // Log failed HTTP requests
          if (!response.ok) {
            this.logError({
              type: 'http_error',
              message: `HTTP ${response.status}: ${response.statusText}`,
              category: this.CATEGORIES.NETWORK,
              severity: response.status >= 500 ? this.SEVERITY.HIGH : this.SEVERITY.MEDIUM,
              context: {
                url: args[0],
                status: response.status,
                statusText: response.statusText,
                method: args[1]?.method || 'GET',
                timestamp: new Date().toISOString()
              }
            });
          }
          
          return response;
        } catch (error) {
          this.logError({
            type: 'fetch_error',
            message: error.message,
            stack: error.stack,
            category: this.CATEGORIES.NETWORK,
            severity: this.SEVERITY.HIGH,
            context: {
              url: args[0],
              method: args[1]?.method || 'GET',
              timestamp: new Date().toISOString()
            }
          });
          throw error;
        }
      };
    }
  }

  initPerformanceMonitoring() {
    // Monitor page load performance
    if (window.performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0];
          if (navigation) {
            const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
            const totalTime = navigation.loadEventEnd - navigation.fetchStart;
            
            if (totalTime > 5000) { // Log slow page loads
              this.logError({
                type: 'slow_page_load',
                message: `Slow page load detected: ${totalTime}ms`,
                category: this.CATEGORIES.PERFORMANCE,
                severity: totalTime > 10000 ? this.SEVERITY.HIGH : this.SEVERITY.MEDIUM,
                context: {
                  loadTime,
                  totalTime,
                  domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                  timestamp: new Date().toISOString()
                }
              });
            }
          }
        }, 1000);
      });

      // Monitor memory usage
      setInterval(() => {
        if (performance.memory) {
          const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize;
          
          if (memoryUsage > 0.9) { // Log high memory usage
            this.logError({
              type: 'high_memory_usage',
              message: `High memory usage: ${Math.round(memoryUsage * 100)}%`,
              category: this.CATEGORIES.PERFORMANCE,
              severity: this.SEVERITY.MEDIUM,
              context: {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                percentage: Math.round(memoryUsage * 100),
                timestamp: new Date().toISOString()
              }
            });
          }
        }
      }, 30000); // Check every 30 seconds
    }

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Log tasks taking more than 50ms
              this.logError({
                type: 'long_task',
                message: `Long task detected: ${entry.duration}ms`,
                category: this.CATEGORIES.PERFORMANCE,
                severity: entry.duration > 100 ? this.SEVERITY.MEDIUM : this.SEVERITY.LOW,
                context: {
                  duration: entry.duration,
                  startTime: entry.startTime,
                  name: entry.name,
                  timestamp: new Date().toISOString()
                }
              });
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('Long task observer not supported:', error);
      }
    }
  }

  initUserActionTracking() {
    // Track user interactions to provide context for errors
    const trackUserAction = (action, element) => {
      this.userActions.push({
        action,
        element: element?.tagName || 'unknown',
        className: element?.className || '',
        id: element?.id || '',
        timestamp: Date.now(),
        url: window.location.href
      });
      
      // Keep only last 20 actions
      if (this.userActions.length > 20) {
        this.userActions = this.userActions.slice(-20);
      }
    };

    // Track clicks
    document.addEventListener('click', (e) => {
      trackUserAction('click', e.target);
    });

    // Track form submissions
    document.addEventListener('submit', (e) => {
      trackUserAction('form_submit', e.target);
    });

    // Track navigation
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      trackUserAction('navigation', null);
      return originalPushState.apply(this, args);
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function(...args) {
      trackUserAction('navigation', null);
      return originalReplaceState.apply(this, args);
    };
  }

  setupPeriodicReporting() {
    // Send logs to server periodically
    if (this.config.enableRemoteLogging) {
      setInterval(() => {
        this.sendLogsToServer();
      }, 60000); // Every minute
    }

    // Generate analytics reports
    if (this.config.enableAnalytics) {
      setInterval(() => {
        this.generateAnalyticsReport();
      }, 300000); // Every 5 minutes
    }
  }

  logError(errorData) {
    const error = {
      id: this.generateErrorId(),
      ...errorData,
      sessionId: this.config.sessionId,
      userId: this.config.userId,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      environment: this.config.environment,
      userActions: [...this.userActions],
      browserInfo: this.getBrowserInfo(),
      gameContext: this.getGameContext()
    };

    // Add error to log
    this.errorLog.push(error);
    this.enforceLogSize();

    // Track error patterns
    this.trackErrorPattern(error);

    // Console logging
    if (this.config.enableConsoleLog) {
      this.consoleLog(error);
    }

    // Store in localStorage
    if (this.config.enableLocalStorage) {
      this.saveToLocalStorage();
    }

    // Send analytics event
    if (this.config.enableAnalytics) {
      this.sendAnalyticsEvent(this.analyticsEvents.ERROR_ENCOUNTERED, error);
    }

    // Check for critical errors
    if (error.severity === this.SEVERITY.CRITICAL) {
      this.handleCriticalError(error);
    }

    // Pattern detection
    this.detectErrorPatterns();

    console.log('📝 Error logged:', error.id);
    return error.id;
  }

  generateErrorId() {
    return `mlg_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  trackErrorPattern(error) {
    const pattern = `${error.type}_${error.category}`;
    const existing = this.errorPatterns.get(pattern) || {
      count: 0,
      firstSeen: error.timestamp,
      lastSeen: error.timestamp,
      examples: []
    };

    existing.count++;
    existing.lastSeen = error.timestamp;
    existing.examples.push({
      id: error.id,
      message: error.message,
      timestamp: error.timestamp
    });

    // Keep only last 5 examples
    if (existing.examples.length > 5) {
      existing.examples = existing.examples.slice(-5);
    }

    this.errorPatterns.set(pattern, existing);
  }

  detectErrorPatterns() {
    this.errorPatterns.forEach((pattern, key) => {
      // Detect frequent errors (more than 5 in last hour)
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      const recentCount = pattern.examples.filter(e => e.timestamp > oneHourAgo).length;
      
      if (recentCount >= 5 && !pattern.reported) {
        pattern.reported = true;
        
        this.logError({
          type: 'error_pattern_detected',
          message: `Frequent error pattern: ${key} (${recentCount} occurrences)`,
          category: this.CATEGORIES.SYSTEM,
          severity: this.SEVERITY.HIGH,
          context: {
            pattern: key,
            count: pattern.count,
            recentCount,
            firstSeen: pattern.firstSeen,
            lastSeen: pattern.lastSeen,
            examples: pattern.examples
          }
        });

        if (this.config.enableAnalytics) {
          this.sendAnalyticsEvent(this.analyticsEvents.ERROR_PATTERN_DETECTED, {
            pattern: key,
            count: pattern.count,
            recentCount
          });
        }
      }
    });
  }

  consoleLog(error) {
    const style = this.getConsoleStyle(error.severity);
    
    console.group(`%c🎮 MLG Error [${error.severity.toUpperCase()}] - ${error.id}`, style);
    console.error(`%c${error.type}: ${error.message}`, 'color: #ff6b6b; font-weight: bold;');
    console.info('Category:', error.category);
    console.info('Context:', error.context);
    console.info('User Actions:', error.userActions);
    console.info('Game Context:', error.gameContext);
    
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    
    console.groupEnd();
  }

  getConsoleStyle(severity) {
    const styles = {
      [this.SEVERITY.LOW]: 'color: #4CAF50; background: #E8F5E8; padding: 2px 8px; border-radius: 3px;',
      [this.SEVERITY.MEDIUM]: 'color: #FF9800; background: #FFF3E0; padding: 2px 8px; border-radius: 3px;',
      [this.SEVERITY.HIGH]: 'color: #F44336; background: #FFEBEE; padding: 2px 8px; border-radius: 3px;',
      [this.SEVERITY.CRITICAL]: 'color: #FFFFFF; background: #D32F2F; padding: 2px 8px; border-radius: 3px; font-weight: bold;'
    };
    
    return styles[severity] || styles[this.SEVERITY.MEDIUM];
  }

  getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      doNotTrack: navigator.doNotTrack,
      hardwareConcurrency: navigator.hardwareConcurrency,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      } : null,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      performance: window.performance ? {
        memory: performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        } : null,
        timing: performance.timing ? {
          navigationStart: performance.timing.navigationStart,
          loadEventEnd: performance.timing.loadEventEnd
        } : null
      } : null
    };
  }

  getGameContext() {
    // Extract gaming-specific context
    const context = {
      page: this.getCurrentPage(),
      features: [],
      walletConnected: false,
      userAuthenticated: false,
      clan: null,
      activeFeatures: []
    };

    // Check for gaming features
    if (window.MLGApiClient) {
      context.features.push('api_client');
      context.walletConnected = window.MLGApiClient.isAuthenticated();
    }

    if (window.MLGOfflineManager) {
      context.features.push('offline_manager');
      context.activeFeatures = window.MLGOfflineManager.getAvailableFeatures();
    }

    if (window.MLGErrorHandler) {
      context.features.push('error_handler');
    }

    // Check local storage for gaming data
    try {
      const authToken = localStorage.getItem('mlg_auth_token');
      context.userAuthenticated = !!authToken;
      
      const userData = localStorage.getItem('mlg_user_data');
      if (userData) {
        const user = JSON.parse(userData);
        context.clan = user.clan;
      }
    } catch (error) {
      // Ignore localStorage errors
    }

    return context;
  }

  getCurrentPage() {
    const path = window.location.pathname;
    const pages = {
      '/': 'home',
      '/index.html': 'home',
      '/clans.html': 'clans',
      '/voting.html': 'voting',
      '/profile.html': 'profile',
      '/content.html': 'content',
      '/dao.html': 'dao',
      '/analytics.html': 'analytics'
    };
    
    return pages[path] || 'unknown';
  }

  handleCriticalError(error) {
    // Show user notification for critical errors
    if (window.MLGErrorHandler) {
      window.MLGErrorHandler.createNotification({
        type: 'error',
        title: '🚨 Critical System Error',
        message: 'A critical error has occurred. Our team has been notified.',
        icon: '⚠️',
        duration: 10000
      });
    }

    // Immediate remote logging for critical errors
    if (this.config.enableRemoteLogging) {
      this.sendErrorToServer(error, true);
    }

    // Analytics event
    if (this.config.enableAnalytics) {
      this.sendAnalyticsEvent('gaming_critical_error', {
        errorId: error.id,
        type: error.type,
        category: error.category
      });
    }
  }

  async sendLogsToServer() {
    if (!this.config.enableRemoteLogging || this.errorLog.length === 0) return;

    const unsent = this.errorLog.filter(error => !error.sent);
    if (unsent.length === 0) return;

    try {
      const response = await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: this.config.sessionId,
          errors: unsent,
          browserInfo: this.getBrowserInfo(),
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        // Mark errors as sent
        unsent.forEach(error => error.sent = true);
        console.log(`📤 Sent ${unsent.length} errors to server`);
      }
    } catch (error) {
      console.warn('Failed to send error logs to server:', error);
    }
  }

  async sendErrorToServer(error, immediate = false) {
    if (!this.config.enableRemoteLogging) return;

    try {
      const response = await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Priority': immediate ? 'high' : 'normal'
        },
        body: JSON.stringify({
          sessionId: this.config.sessionId,
          error,
          browserInfo: this.getBrowserInfo(),
          timestamp: new Date().toISOString(),
          immediate
        })
      });

      if (response.ok) {
        error.sent = true;
      }
    } catch (sendError) {
      console.warn('Failed to send error to server:', sendError);
    }
  }

  sendAnalyticsEvent(event, data) {
    // Integration with analytics services (GA, Mixpanel, etc.)
    if (typeof gtag !== 'undefined') {
      gtag('event', event, {
        custom_parameter: data,
        session_id: this.config.sessionId
      });
    }

    if (typeof mixpanel !== 'undefined') {
      mixpanel.track(event, {
        ...data,
        session_id: this.config.sessionId
      });
    }

    // Custom analytics hook
    if (window.MLGAnalytics && typeof window.MLGAnalytics.track === 'function') {
      window.MLGAnalytics.track(event, data);
    }
  }

  generateAnalyticsReport() {
    const report = {
      sessionId: this.config.sessionId,
      timestamp: new Date().toISOString(),
      period: '5m',
      totalErrors: this.errorLog.length,
      errorsByCategory: {},
      errorsBySeverity: {},
      topErrors: {},
      patterns: Object.fromEntries(this.errorPatterns),
      performance: {
        averagePageLoad: this.calculateAveragePageLoad(),
        memoryUsage: this.getCurrentMemoryUsage(),
        errorRate: this.calculateErrorRate()
      },
      browserInfo: this.getBrowserInfo(),
      gameContext: this.getGameContext()
    };

    // Categorize errors
    this.errorLog.forEach(error => {
      report.errorsByCategory[error.category] = (report.errorsByCategory[error.category] || 0) + 1;
      report.errorsBySeverity[error.severity] = (report.errorsBySeverity[error.severity] || 0) + 1;
      report.topErrors[error.type] = (report.topErrors[error.type] || 0) + 1;
    });

    console.log('📊 Analytics Report:', report);

    // Send analytics report
    this.sendAnalyticsEvent('gaming_error_report', report);

    return report;
  }

  calculateAveragePageLoad() {
    if (!window.performance || !performance.timing) return null;
    
    return performance.timing.loadEventEnd - performance.timing.navigationStart;
  }

  getCurrentMemoryUsage() {
    if (!window.performance || !performance.memory) return null;
    
    return {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      percentage: Math.round((performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize) * 100)
    };
  }

  calculateErrorRate() {
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    const recentErrors = this.errorLog.filter(error => 
      new Date(error.timestamp).getTime() > fiveMinutesAgo
    );
    
    return recentErrors.length / 5; // errors per minute
  }

  // Storage management
  saveToLocalStorage() {
    try {
      const data = {
        errors: this.errorLog.slice(-100), // Keep last 100 errors
        sessionId: this.config.sessionId,
        lastUpdate: new Date().toISOString()
      };
      localStorage.setItem('mlg_error_logs', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save error logs to localStorage:', error);
    }
  }

  loadStoredLogs() {
    try {
      const data = localStorage.getItem('mlg_error_logs');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.errors && Array.isArray(parsed.errors)) {
          this.errorLog = parsed.errors;
          console.log(`📂 Loaded ${this.errorLog.length} stored error logs`);
        }
      }
    } catch (error) {
      console.warn('Failed to load stored error logs:', error);
    }
  }

  enforceLogSize() {
    if (this.errorLog.length > this.config.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.config.maxLogSize);
    }
  }

  // Public API methods
  getErrorLogs(filter = {}) {
    let logs = [...this.errorLog];
    
    if (filter.category) {
      logs = logs.filter(log => log.category === filter.category);
    }
    
    if (filter.severity) {
      logs = logs.filter(log => log.severity === filter.severity);
    }
    
    if (filter.timeRange) {
      const cutoff = new Date(Date.now() - filter.timeRange).toISOString();
      logs = logs.filter(log => log.timestamp > cutoff);
    }
    
    if (filter.limit) {
      logs = logs.slice(-filter.limit);
    }
    
    return logs;
  }

  getErrorStats() {
    const stats = {
      totalErrors: this.errorLog.length,
      byCategory: {},
      bySeverity: {},
      byType: {},
      patterns: this.errorPatterns.size,
      sessionId: this.config.sessionId,
      timeRange: {
        earliest: this.errorLog[0]?.timestamp,
        latest: this.errorLog[this.errorLog.length - 1]?.timestamp
      }
    };

    this.errorLog.forEach(error => {
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
    });

    return stats;
  }

  clearErrorLogs() {
    this.errorLog = [];
    this.errorPatterns.clear();
    this.userActions = [];
    localStorage.removeItem('mlg_error_logs');
    console.log('🧹 Error logs cleared');
  }

  exportErrorLogs() {
    const exportData = {
      metadata: {
        sessionId: this.config.sessionId,
        exportTime: new Date().toISOString(),
        totalErrors: this.errorLog.length,
        environment: this.config.environment
      },
      errors: this.errorLog,
      patterns: Object.fromEntries(this.errorPatterns),
      stats: this.getErrorStats(),
      browserInfo: this.getBrowserInfo(),
      gameContext: this.getGameContext()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mlg-error-logs-${this.config.sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);

    console.log('📥 Error logs exported');
  }

  // Gaming-specific error logging methods
  logWalletError(error, context = {}) {
    return this.logError({
      type: 'wallet_error',
      message: error.message,
      stack: error.stack,
      category: this.CATEGORIES.WALLET,
      severity: this.SEVERITY.HIGH,
      context: {
        operation: context.operation,
        walletType: context.walletType || 'phantom',
        ...context
      }
    });
  }

  logTransactionError(error, transaction, context = {}) {
    return this.logError({
      type: 'transaction_error',
      message: error.message,
      stack: error.stack,
      category: this.CATEGORIES.TRANSACTION,
      severity: this.SEVERITY.HIGH,
      context: {
        transaction: {
          type: transaction.type,
          amount: transaction.amount,
          recipient: transaction.recipient
        },
        ...context
      }
    });
  }

  logClanError(error, clanId, context = {}) {
    return this.logError({
      type: 'clan_error',
      message: error.message,
      stack: error.stack,
      category: this.CATEGORIES.CLAN,
      severity: this.SEVERITY.MEDIUM,
      context: {
        clanId,
        operation: context.operation,
        ...context
      }
    });
  }

  logVotingError(error, voteId, context = {}) {
    return this.logError({
      type: 'voting_error',
      message: error.message,
      stack: error.stack,
      category: this.CATEGORIES.VOTING,
      severity: this.SEVERITY.MEDIUM,
      context: {
        voteId,
        operation: context.operation,
        ...context
      }
    });
  }

  // User feedback integration
  requestUserFeedback(errorId) {
    const error = this.errorLog.find(e => e.id === errorId);
    if (!error) return;

    if (window.MLGErrorHandler) {
      window.MLGErrorHandler.createNotification({
        type: 'info',
        title: '🤝 Help Us Improve',
        message: 'We detected an issue. Your feedback helps us fix it faster!',
        icon: '💭',
        duration: 8000,
        actions: ['feedback', 'dismiss']
      });
    }
  }
}

// Create global instance
window.MLGErrorLogger = new MLGErrorLogger();

// Export for ES6 modules
export default MLGErrorLogger;
export { MLGErrorLogger };