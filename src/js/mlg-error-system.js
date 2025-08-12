/**
 * MLG.clan Error System Integration
 * Main orchestrator for all error handling components
 * 
 * @author Claude Code - Frontend Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

class MLGErrorSystem {
  constructor() {
    this.components = {};
    this.isInitialized = false;
    this.config = {
      enableErrorHandler: true,
      enableApiClient: true,
      enableOfflineManager: true,
      enableConnectionStatus: true,
      enableFallbackSystem: true,
      enableLoadingStates: true,
      enableErrorLogger: true,
      autoInitialize: true,
      gamingTheme: true,
      environment: this.detectEnvironment()
    };
    
    this.initPromise = null;
  }

  detectEnvironment() {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    } else if (hostname.includes('staging') || hostname.includes('test')) {
      return 'staging';
    }
    return 'production';
  }

  async init(customConfig = {}) {
    if (this.isInitialized) return this.components;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.performInit({ ...this.config, ...customConfig });
    return this.initPromise;
  }

  async performInit(config) {
    console.log('🎮 Initializing MLG Error System...');
    
    try {
      // Initialize all components in order
      if (config.enableErrorLogger) {
        await this.initErrorLogger(config);
      }
      
      if (config.enableErrorHandler) {
        await this.initErrorHandler(config);
      }
      
      if (config.enableFallbackSystem) {
        await this.initFallbackSystem(config);
      }
      
      if (config.enableOfflineManager) {
        await this.initOfflineManager(config);
      }
      
      if (config.enableApiClient) {
        await this.initApiClient(config);
      }
      
      if (config.enableLoadingStates) {
        await this.initLoadingStates(config);
      }
      
      if (config.enableConnectionStatus) {
        await this.initConnectionStatus(config);
      }
      
      // Wire up component integrations
      this.setupIntegrations();
      
      // Setup global error boundaries
      this.setupGlobalErrorBoundaries();
      
      this.isInitialized = true;
      
      console.log('✅ MLG Error System fully initialized!');
      
      // Show initialization success notification
      if (this.components.errorHandler && config.gamingTheme) {
        this.components.errorHandler.createNotification({
          type: 'success',
          title: '🎮 MLG.clan Systems Online',
          message: 'All gaming systems initialized and ready for action!',
          icon: '⚡',
          duration: 3000
        });
      }
      
      return this.components;
      
    } catch (error) {
      console.error('❌ Failed to initialize MLG Error System:', error);
      this.handleInitializationError(error);
      throw error;
    }
  }

  async initErrorLogger(config) {
    if (window.MLGErrorLogger) {
      this.components.errorLogger = window.MLGErrorLogger;
      console.log('📝 Error Logger initialized');
    } else {
      console.warn('MLGErrorLogger not found');
    }
  }

  async initErrorHandler(config) {
    if (window.MLGErrorHandler) {
      this.components.errorHandler = window.MLGErrorHandler;
      console.log('🛡️ Error Handler initialized');
    } else {
      console.warn('MLGErrorHandler not found');
    }
  }

  async initFallbackSystem(config) {
    if (window.MLGFallbackSystem) {
      this.components.fallbackSystem = window.MLGFallbackSystem;
      console.log('💾 Fallback System initialized');
    } else {
      console.warn('MLGFallbackSystem not found');
    }
  }

  async initOfflineManager(config) {
    if (window.MLGOfflineManager) {
      this.components.offlineManager = window.MLGOfflineManager;
      console.log('📴 Offline Manager initialized');
    } else {
      console.warn('MLGOfflineManager not found');
    }
  }

  async initApiClient(config) {
    if (window.MLGApiClient) {
      this.components.apiClient = window.MLGApiClient;
      console.log('🌐 API Client initialized');
    } else {
      console.warn('MLGApiClient not found');
    }
  }

  async initLoadingStates(config) {
    if (window.MLGLoadingStates) {
      this.components.loadingStates = window.MLGLoadingStates;
      console.log('⏳ Loading States initialized');
    } else {
      console.warn('MLGLoadingStates not found');
    }
  }

  async initConnectionStatus(config) {
    if (window.MLGConnectionStatus) {
      this.components.connectionStatus = window.MLGConnectionStatus;
      console.log('📊 Connection Status initialized');
    } else {
      console.warn('MLGConnectionStatus not found');
    }
  }

  setupIntegrations() {
    // Integrate Error Handler with API Client
    if (this.components.errorHandler && this.components.apiClient) {
      const originalRequest = this.components.apiClient.request.bind(this.components.apiClient);
      
      this.components.apiClient.request = async (config) => {
        try {
          return await originalRequest(config);
        } catch (error) {
          await this.components.errorHandler.handleError(error, {
            operation: config.url,
            method: config.method,
            apiCall: true
          });
          throw error;
        }
      };
    }

    // Integrate Fallback System with API Client
    if (this.components.fallbackSystem && this.components.apiClient) {
      // Wrap common API methods with fallback support
      const methods = ['getUserProfile', 'getClans', 'getActiveVotes', 'getLeaderboard'];
      
      methods.forEach(method => {
        if (typeof this.components.apiClient[method] === 'function') {
          const original = this.components.apiClient[method].bind(this.components.apiClient);
          
          this.components.apiClient[method] = this.components.fallbackSystem.wrapApiCall(
            original, 
            method.replace('get', '').toLowerCase() + 'Data'
          );
        }
      });
    }

    // Integrate Loading States with API Client
    if (this.components.loadingStates && this.components.apiClient) {
      const originalRequest = this.components.apiClient.request.bind(this.components.apiClient);
      
      this.components.apiClient.request = async (config) => {
        const loadingId = this.components.loadingStates.showSmallLoader(
          document.body,
          { text: 'Loading...', icon: '⏳' }
        );
        
        try {
          const result = await originalRequest(config);
          return result;
        } finally {
          if (loadingId) {
            this.components.loadingStates.hideLoader(loadingId);
          }
        }
      };
    }

    // Integrate Error Logger with all components
    if (this.components.errorLogger) {
      // Log errors from error handler
      if (this.components.errorHandler) {
        const originalHandleError = this.components.errorHandler.handleError.bind(this.components.errorHandler);
        
        this.components.errorHandler.handleError = async (error, context) => {
          // Log the error
          this.components.errorLogger.logError({
            type: 'system_error',
            message: error.message,
            stack: error.stack,
            category: 'system',
            severity: 'medium',
            context
          });
          
          return originalHandleError(error, context);
        };
      }
      
      // Log API errors
      if (this.components.apiClient) {
        this.components.apiClient.addResponseInterceptor(
          (response) => response,
          (error) => {
            this.components.errorLogger.logError({
              type: 'api_error',
              message: error.message,
              stack: error.stack,
              category: 'network',
              severity: 'high',
              context: {
                url: error.config?.url,
                method: error.config?.method
              }
            });
            
            return Promise.reject(error);
          }
        );
      }
    }

    console.log('🔗 Component integrations configured');
  }

  setupGlobalErrorBoundaries() {
    // Enhance existing global error handlers
    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      if (this.components.errorHandler) {
        this.components.errorHandler.handleError(error || new Error(message), {
          source,
          lineno,
          colno,
          type: 'javascript_error'
        });
      }
      
      if (originalOnError) {
        return originalOnError(message, source, lineno, colno, error);
      }
    };

    const originalOnUnhandledRejection = window.onunhandledrejection;
    window.onunhandledrejection = (event) => {
      if (this.components.errorHandler) {
        this.components.errorHandler.handleError(
          new Error(event.reason?.message || event.reason), 
          {
            type: 'unhandled_promise_rejection',
            promise: event.promise
          }
        );
      }
      
      if (originalOnUnhandledRejection) {
        return originalOnUnhandledRejection(event);
      }
    };

    console.log('🛡️ Global error boundaries configured');
  }

  handleInitializationError(error) {
    console.error('System initialization failed:', error);
    
    // Show basic error message if possible
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
      color: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      font-family: system-ui, sans-serif;
      max-width: 300px;
    `;
    
    notification.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">
        ⚠️ System Initialization Failed
      </div>
      <div style="font-size: 14px; opacity: 0.9;">
        Some features may not work correctly. Please refresh the page.
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 8000);
  }

  // Public API methods
  async executeWithErrorHandling(operation, context = {}) {
    if (!this.isInitialized) {
      await this.init();
    }
    
    try {
      return await operation();
    } catch (error) {
      if (this.components.errorHandler) {
        await this.components.errorHandler.handleError(error, context);
      }
      
      if (this.components.errorLogger) {
        this.components.errorLogger.logError({
          type: 'operation_error',
          message: error.message,
          stack: error.stack,
          category: context.category || 'system',
          severity: context.severity || 'medium',
          context
        });
      }
      
      throw error;
    }
  }

  async safeApiCall(apiMethod, fallbackType, options = {}) {
    if (!this.isInitialized) {
      await this.init();
    }
    
    try {
      const result = await apiMethod();
      
      // Update fallback data with successful result
      if (this.components.fallbackSystem && fallbackType) {
        this.components.fallbackSystem.updateFallbackData(fallbackType, result);
      }
      
      return { success: true, data: result, fallback: false };
      
    } catch (error) {
      console.warn(`API call failed, attempting fallback for ${fallbackType}:`, error);
      
      // Try to get fallback data
      if (this.components.fallbackSystem && fallbackType) {
        const fallbackData = this.components.fallbackSystem.getFallbackData(fallbackType, options);
        
        if (fallbackData) {
          return { success: true, data: fallbackData, fallback: true };
        }
      }
      
      // No fallback available, re-throw error
      throw error;
    }
  }

  showNotification(message, type = 'info', options = {}) {
    if (this.components.errorHandler) {
      this.components.errorHandler.createNotification({
        type,
        title: options.title || 'MLG.clan',
        message,
        icon: options.icon || '🎮',
        duration: options.duration || 4000,
        ...options
      });
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  showLoader(type = 'generic', options = {}) {
    if (this.components.loadingStates) {
      return this.components.loadingStates.showLoader(type, options);
    }
    return null;
  }

  hideLoader(loaderId) {
    if (this.components.loadingStates) {
      this.components.loadingStates.hideLoader(loaderId);
    }
  }

  logError(error, context = {}) {
    if (this.components.errorLogger) {
      return this.components.errorLogger.logError({
        type: context.type || 'manual_error',
        message: error.message,
        stack: error.stack,
        category: context.category || 'system',
        severity: context.severity || 'medium',
        context
      });
    }
  }

  getSystemStatus() {
    const status = {
      initialized: this.isInitialized,
      components: {},
      environment: this.config.environment,
      timestamp: new Date().toISOString()
    };

    Object.keys(this.components).forEach(key => {
      const component = this.components[key];
      status.components[key] = {
        available: !!component,
        status: component && typeof component.getStatus === 'function' 
          ? component.getStatus() 
          : 'unknown'
      };
    });

    return status;
  }

  async restart() {
    console.log('🔄 Restarting MLG Error System...');
    
    // Clear existing components
    this.components = {};
    this.isInitialized = false;
    this.initPromise = null;
    
    // Reinitialize
    await this.init();
    
    this.showNotification('System restarted successfully!', 'success', {
      title: '🔄 System Restart',
      icon: '✅'
    });
  }

  // Debugging and maintenance methods
  exportLogs() {
    if (this.components.errorLogger && typeof this.components.errorLogger.exportErrorLogs === 'function') {
      this.components.errorLogger.exportErrorLogs();
    }
  }

  clearCache() {
    if (this.components.apiClient && typeof this.components.apiClient.clearCache === 'function') {
      this.components.apiClient.clearCache();
    }
    
    if (this.components.fallbackSystem && typeof this.components.fallbackSystem.clearFallbackData === 'function') {
      this.components.fallbackSystem.clearFallbackData();
    }
    
    this.showNotification('Cache cleared successfully!', 'info', {
      title: '🧹 Cache Cleared',
      icon: '♻️'
    });
  }

  runHealthCheck() {
    const healthCheck = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      issues: [],
      components: {}
    };

    // Check each component
    Object.keys(this.components).forEach(key => {
      const component = this.components[key];
      
      if (!component) {
        healthCheck.issues.push(`${key} is not initialized`);
        healthCheck.components[key] = 'missing';
      } else if (typeof component.getStatus === 'function') {
        const status = component.getStatus();
        healthCheck.components[key] = status;
        
        if (status && typeof status === 'object' && status.error) {
          healthCheck.issues.push(`${key}: ${status.error}`);
        }
      } else {
        healthCheck.components[key] = 'available';
      }
    });

    if (healthCheck.issues.length > 0) {
      healthCheck.status = 'degraded';
    }

    console.log('🏥 Health Check Results:', healthCheck);
    return healthCheck;
  }
}

// Auto-initialize on DOM ready if not in test environment
if (typeof window !== 'undefined' && !window.MLG_TEST_MODE) {
  // Create global instance
  window.MLGErrorSystem = new MLGErrorSystem();
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.MLGErrorSystem.init();
    });
  } else {
    // DOM is already ready
    window.MLGErrorSystem.init();
  }
}

// Export for ES6 modules
export default MLGErrorSystem;
export { MLGErrorSystem };