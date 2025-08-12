/**
 * MLG.clan Error Handling System
 * Xbox 360 Gaming-themed Error Management with Comprehensive Recovery
 * 
 * Features:
 * - Xbox 360-style error codes and messages
 * - Exponential backoff retry mechanisms
 * - Offline detection and graceful degradation
 * - Gaming-themed user feedback
 * - Network status monitoring
 * - Fallback data systems
 * - Achievement-style recovery notifications
 * 
 * @author Claude Code - Frontend Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

class MLGErrorHandler {
  constructor() {
    this.errors = new Map();
    this.retryAttempts = new Map();
    this.circuitBreakers = new Map();
    this.networkStatus = 'online';
    this.listeners = new Set();
    this.fallbackData = new Map();
    this.errorLog = [];
    this.isInitialized = false;
    
    // Xbox 360-style error codes (E74, 0102, etc.)
    this.ERROR_CODES = {
      // Network errors (E-series like Xbox 360 Red Ring of Death)
      NETWORK_TIMEOUT: 'E74',
      CONNECTION_FAILED: 'E68',
      RPC_ERROR: 'E64',
      API_UNAVAILABLE: 'E71',
      RATE_LIMITED: 'E65',
      
      // Wallet errors (0-series like Xbox error codes)
      WALLET_DISCONNECTED: '0102',
      WALLET_NOT_INSTALLED: '0101',
      TRANSACTION_REJECTED: '0103',
      INSUFFICIENT_FUNDS: '0104',
      INVALID_SIGNATURE: '0105',
      
      // Data errors (D-series)
      DATA_NOT_FOUND: 'D01',
      INVALID_DATA: 'D02',
      CACHE_MISS: 'D03',
      SYNC_FAILED: 'D04',
      
      // Security errors (S-series)
      UNAUTHORIZED: 'S01',
      FORBIDDEN: 'S02',
      TOKEN_EXPIRED: 'S03',
      INVALID_AUTH: 'S04',
      
      // System errors (X-series tribute to Xbox)
      UNKNOWN_ERROR: 'X01',
      SYSTEM_OVERLOAD: 'X02',
      MAINTENANCE_MODE: 'X03'
    };

    // Gaming-themed error messages with achievement style
    this.ERROR_MESSAGES = {
      E74: {
        title: '🔴 Network Down - Red Ring Detected',
        message: 'Connection timed out like an overheated Xbox 360. Attempting recovery...',
        icon: '🎮',
        category: 'network'
      },
      E68: {
        title: '📡 Connection Failed - Offline Mode',
        message: 'Network connection lost. Switching to offline gaming mode.',
        icon: '📶',
        category: 'network'
      },
      E64: {
        title: '🛠️ RPC Server Down - Maintenance Required',
        message: 'Game servers are experiencing technical difficulties.',
        icon: '⚠️',
        category: 'network'
      },
      E71: {
        title: '🎯 API Service Unavailable',
        message: 'Game service is temporarily offline for updates.',
        icon: '🔧',
        category: 'network'
      },
      E65: {
        title: '⏳ Rate Limited - Slow Down Gamer',
        message: 'Too many requests! Cool down period active.',
        icon: '🚦',
        category: 'network'
      },
      '0102': {
        title: '🎮 Controller Disconnected',
        message: 'Your wallet has been disconnected. Reconnect to continue gaming.',
        icon: '🔌',
        category: 'wallet'
      },
      '0101': {
        title: '❌ Controller Not Found',
        message: 'Phantom wallet not detected. Install your gaming controller first.',
        icon: '🎮',
        category: 'wallet'
      },
      '0103': {
        title: '🛑 Transaction Cancelled',
        message: 'Player cancelled the action. Game state preserved.',
        icon: '⭕',
        category: 'wallet'
      },
      '0104': {
        title: '💰 Insufficient Game Currency',
        message: 'Not enough SOL to complete transaction. Visit the bank!',
        icon: '🪙',
        category: 'wallet'
      },
      '0105': {
        title: '✍️ Invalid Signature',
        message: 'Signature verification failed. Please sign again, gamer.',
        icon: '📝',
        category: 'wallet'
      },
      D01: {
        title: '🔍 Data Not Found - 404 Achievement',
        message: 'The requested data has vanished like a glitched save file.',
        icon: '❓',
        category: 'data'
      },
      D02: {
        title: '🗂️ Invalid Data Format',
        message: 'Corrupted data detected. Running integrity check...',
        icon: '⚠️',
        category: 'data'
      },
      D03: {
        title: '💾 Cache Miss - Reload Required',
        message: 'Cache expired. Reloading fresh game data...',
        icon: '🔄',
        category: 'data'
      },
      D04: {
        title: '🔄 Sync Failed - Cloud Save Error',
        message: 'Failed to sync with cloud servers. Retrying...',
        icon: '☁️',
        category: 'data'
      },
      S01: {
        title: '🚫 Access Denied - Authentication Required',
        message: 'Login required to access this gaming area.',
        icon: '🔐',
        category: 'security'
      },
      S02: {
        title: '⛔ Forbidden Access - Insufficient Permissions',
        message: 'You don\'t have the required clan rank for this action.',
        icon: '🛡️',
        category: 'security'
      },
      S03: {
        title: '⏰ Session Expired - Timeout',
        message: 'Your gaming session has expired. Please login again.',
        icon: '🕐',
        category: 'security'
      },
      S04: {
        title: '🔑 Invalid Authentication',
        message: 'Authentication failed. Check your credentials.',
        icon: '❌',
        category: 'security'
      },
      X01: {
        title: '❓ Unknown Error - System Glitch',
        message: 'An unexpected error occurred. The gaming gods are displeased.',
        icon: '🎰',
        category: 'system'
      },
      X02: {
        title: '🔥 System Overload - Too Many Players',
        message: 'Servers are at capacity. Queue position assigned.',
        icon: '🔥',
        category: 'system'
      },
      X03: {
        title: '🛠️ Maintenance Mode - System Update',
        message: 'Planned maintenance in progress. Game will resume shortly.',
        icon: '⚙️',
        category: 'system'
      }
    };

    // Recovery strategies with achievement-style messages
    this.RECOVERY_STRATEGIES = {
      network: {
        maxRetries: 3,
        baseDelay: 1000,
        backoffMultiplier: 2,
        successMessage: '🏆 Network Connection Restored - Achievement Unlocked!'
      },
      wallet: {
        maxRetries: 2,
        baseDelay: 500,
        backoffMultiplier: 1.5,
        successMessage: '🎮 Wallet Reconnected - Ready Player One!'
      },
      data: {
        maxRetries: 3,
        baseDelay: 800,
        backoffMultiplier: 2,
        successMessage: '💾 Data Recovered - Save Game Complete!'
      },
      security: {
        maxRetries: 1,
        baseDelay: 1000,
        backoffMultiplier: 1,
        successMessage: '🔐 Authentication Restored - Access Granted!'
      },
      system: {
        maxRetries: 5,
        baseDelay: 2000,
        backoffMultiplier: 1.8,
        successMessage: '⚡ System Recovery Complete - Level Up!'
      }
    };

    this.init();
  }

  async init() {
    if (this.isInitialized) return;

    // Initialize network monitoring
    this.initNetworkMonitoring();
    
    // Initialize fallback data
    this.initFallbackData();
    
    // Setup global error handlers
    this.setupGlobalErrorHandlers();
    
    // Initialize circuit breakers
    this.initCircuitBreakers();

    this.isInitialized = true;
    console.log('🎮 MLG Error Handler initialized - Ready for gaming!');
  }

  initNetworkMonitoring() {
    // Online/offline detection
    window.addEventListener('online', () => {
      this.networkStatus = 'online';
      this.notifyNetworkChange('online');
      this.showRecoveryNotification('🌐 Back Online - Connection Restored!');
    });

    window.addEventListener('offline', () => {
      this.networkStatus = 'offline';
      this.notifyNetworkChange('offline');
      this.showErrorNotification('📴 Offline Mode Activated', 'Connection lost. Using cached data.');
    });

    // Connection quality monitoring
    if (navigator.connection) {
      const updateConnectionInfo = () => {
        const connection = navigator.connection;
        const quality = this.assessConnectionQuality(connection);
        this.notifyConnectionQuality(quality);
      };

      navigator.connection.addEventListener('change', updateConnectionInfo);
      updateConnectionInfo(); // Initial check
    }
  }

  initFallbackData() {
    // Set up fallback data for critical operations
    this.fallbackData.set('userProfile', {
      gamertag: 'Anonymous_Gamer',
      level: 1,
      xp: 0,
      clan: null,
      avatar: '👤'
    });

    this.fallbackData.set('clanData', {
      clans: [],
      totalMembers: 0,
      activeClans: 0
    });

    this.fallbackData.set('votingData', {
      activeVotes: [],
      userVotes: 0,
      totalVotes: 0
    });

    this.fallbackData.set('leaderboard', {
      users: [],
      clans: [],
      lastUpdated: new Date().toISOString()
    });
  }

  setupGlobalErrorHandlers() {
    // Catch unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(new Error(event.error?.message || 'JavaScript Error'), {
        type: 'javascript',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new Error(event.reason), {
        type: 'promise_rejection',
        promise: event.promise
      });
    });

    // Intercept fetch requests to add error handling
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
      } catch (error) {
        return this.handleFetchError(error, args[0]);
      }
    };
  }

  initCircuitBreakers() {
    // Initialize circuit breakers for different service types
    const services = ['api', 'wallet', 'rpc', 'cache'];
    
    services.forEach(service => {
      this.circuitBreakers.set(service, {
        state: 'closed', // closed, open, half-open
        failures: 0,
        lastFailure: null,
        threshold: 5,
        timeout: 30000 // 30 seconds
      });
    });
  }

  async handleError(error, context = {}) {
    const errorCode = this.categorizeError(error, context);
    const errorInfo = this.ERROR_MESSAGES[errorCode];
    
    // Log error for debugging
    this.logError(error, errorCode, context);
    
    // Check circuit breaker
    if (await this.checkCircuitBreaker(errorInfo.category)) {
      return this.handleCircuitBreakerOpen(errorCode);
    }
    
    // Attempt recovery
    const recoveryResult = await this.attemptRecovery(error, errorCode, context);
    
    // Show appropriate user feedback
    if (recoveryResult.success) {
      this.showRecoveryNotification(recoveryResult.message);
    } else {
      this.showErrorNotification(errorInfo.title, errorInfo.message, errorInfo.icon);
    }
    
    return recoveryResult;
  }

  categorizeError(error, context = {}) {
    const message = error.message.toLowerCase();
    
    // Network-related errors
    if (message.includes('timeout') || message.includes('network')) return 'E74';
    if (message.includes('connection') || message.includes('fetch')) return 'E68';
    if (message.includes('rpc') || message.includes('502') || message.includes('503')) return 'E64';
    if (message.includes('429') || message.includes('rate limit')) return 'E65';
    if (message.includes('404') || message.includes('not found')) return 'D01';
    if (message.includes('500') || message.includes('internal server')) return 'X02';
    
    // Wallet-related errors
    if (message.includes('wallet') && message.includes('not found')) return '0101';
    if (message.includes('wallet') && message.includes('disconnect')) return '0102';
    if (message.includes('rejected') || message.includes('cancelled')) return '0103';
    if (message.includes('insufficient') || message.includes('balance')) return '0104';
    if (message.includes('signature') || message.includes('sign')) return '0105';
    
    // Security errors
    if (message.includes('401') || message.includes('unauthorized')) return 'S01';
    if (message.includes('403') || message.includes('forbidden')) return 'S02';
    if (message.includes('token') && message.includes('expired')) return 'S03';
    if (message.includes('authentication') || message.includes('auth')) return 'S04';
    
    // Data errors
    if (message.includes('invalid') || message.includes('malformed')) return 'D02';
    if (message.includes('cache') || message.includes('stale')) return 'D03';
    if (message.includes('sync') || message.includes('conflict')) return 'D04';
    
    // System errors
    if (message.includes('maintenance') || message.includes('updating')) return 'X03';
    if (message.includes('overload') || message.includes('capacity')) return 'X02';
    
    // Default to unknown error
    return 'X01';
  }

  async attemptRecovery(error, errorCode, context) {
    const errorInfo = this.ERROR_MESSAGES[errorCode];
    const strategy = this.RECOVERY_STRATEGIES[errorInfo.category];
    
    if (!strategy) {
      return { success: false, message: 'No recovery strategy available' };
    }
    
    const retryKey = `${errorCode}-${context.operation || 'unknown'}`;
    const attempts = this.retryAttempts.get(retryKey) || 0;
    
    if (attempts >= strategy.maxRetries) {
      return { 
        success: false, 
        message: `Max recovery attempts exceeded (${attempts})`,
        fallback: await this.getFallbackData(context)
      };
    }
    
    // Update retry counter
    this.retryAttempts.set(retryKey, attempts + 1);
    
    // Calculate backoff delay
    const delay = strategy.baseDelay * Math.pow(strategy.backoffMultiplier, attempts);
    
    // Show recovery attempt notification
    this.showRecoveryAttempt(errorInfo.title, attempts + 1, strategy.maxRetries);
    
    // Wait for backoff period
    await this.sleep(delay);
    
    try {
      // Attempt the original operation
      const result = await this.retryOperation(context);
      
      // Recovery successful
      this.retryAttempts.delete(retryKey);
      this.updateCircuitBreaker(errorInfo.category, true);
      
      return {
        success: true,
        message: strategy.successMessage,
        result
      };
    } catch (retryError) {
      // Recovery failed
      this.updateCircuitBreaker(errorInfo.category, false);
      
      return {
        success: false,
        message: `Recovery attempt ${attempts + 1} failed: ${retryError.message}`,
        fallback: await this.getFallbackData(context)
      };
    }
  }

  async retryOperation(context) {
    if (context.operation && context.operationFn) {
      return await context.operationFn();
    }
    
    if (context.url && context.options) {
      const response = await fetch(context.url, context.options);
      return await response.json();
    }
    
    throw new Error('No retry operation defined');
  }

  async getFallbackData(context) {
    const { operation, dataType } = context;
    
    // Return cached or default fallback data
    if (this.fallbackData.has(dataType)) {
      return {
        data: this.fallbackData.get(dataType),
        fallback: true,
        timestamp: new Date().toISOString()
      };
    }
    
    // Generate minimal fallback based on operation
    switch (operation) {
      case 'getUserProfile':
        return { data: this.fallbackData.get('userProfile'), fallback: true };
      case 'getClans':
        return { data: this.fallbackData.get('clanData'), fallback: true };
      case 'getVotes':
        return { data: this.fallbackData.get('votingData'), fallback: true };
      default:
        return { data: null, fallback: true, error: 'No fallback available' };
    }
  }

  async handleFetchError(error, url) {
    const context = {
      type: 'fetch',
      url: typeof url === 'string' ? url : url.href,
      operation: this.extractOperationFromUrl(url)
    };
    
    const recoveryResult = await this.handleError(error, context);
    
    if (recoveryResult.fallback) {
      // Return a Response-like object with fallback data
      return {
        ok: true,
        status: 200,
        statusText: 'OK (Fallback)',
        json: async () => recoveryResult.fallback.data,
        text: async () => JSON.stringify(recoveryResult.fallback.data)
      };
    }
    
    throw error; // Re-throw if no fallback available
  }

  extractOperationFromUrl(url) {
    const urlStr = typeof url === 'string' ? url : url.href;
    
    if (urlStr.includes('/api/users/profile')) return 'getUserProfile';
    if (urlStr.includes('/api/clans')) return 'getClans';
    if (urlStr.includes('/api/votes')) return 'getVotes';
    if (urlStr.includes('/api/leaderboard')) return 'getLeaderboard';
    
    return 'api_call';
  }

  assessConnectionQuality(connection) {
    const { effectiveType, downlink, rtt } = connection;
    
    if (effectiveType === '4g' && downlink > 10 && rtt < 100) return 'excellent';
    if (effectiveType === '4g' && downlink > 5 && rtt < 200) return 'good';
    if (effectiveType === '3g' || (downlink > 1 && rtt < 500)) return 'fair';
    return 'poor';
  }

  async checkCircuitBreaker(category) {
    const breaker = this.circuitBreakers.get(category);
    if (!breaker) return false;
    
    if (breaker.state === 'open') {
      const timeSinceFailure = Date.now() - breaker.lastFailure;
      if (timeSinceFailure > breaker.timeout) {
        breaker.state = 'half-open';
        return false;
      }
      return true; // Circuit is open
    }
    
    return false;
  }

  updateCircuitBreaker(category, success) {
    const breaker = this.circuitBreakers.get(category);
    if (!breaker) return;
    
    if (success) {
      breaker.failures = 0;
      breaker.state = 'closed';
    } else {
      breaker.failures++;
      breaker.lastFailure = Date.now();
      
      if (breaker.failures >= breaker.threshold) {
        breaker.state = 'open';
        this.showErrorNotification(
          '⚠️ Service Protection Activated',
          `${category} service temporarily disabled due to repeated failures`
        );
      }
    }
  }

  handleCircuitBreakerOpen(errorCode) {
    const errorInfo = this.ERROR_MESSAGES[errorCode];
    
    this.showErrorNotification(
      '🛡️ Service Protection Active',
      `${errorInfo.category} service is temporarily disabled for protection`
    );
    
    return {
      success: false,
      message: 'Circuit breaker is open',
      circuitBreaker: true
    };
  }

  showErrorNotification(title, message, icon = '⚠️') {
    this.createNotification({
      type: 'error',
      title,
      message,
      icon,
      duration: 6000,
      actions: ['retry', 'dismiss']
    });
  }

  showRecoveryNotification(message) {
    this.createNotification({
      type: 'success',
      title: '🎉 Recovery Successful',
      message,
      icon: '🏆',
      duration: 4000
    });
  }

  showRecoveryAttempt(title, attempt, maxAttempts) {
    this.createNotification({
      type: 'info',
      title: `🔄 Recovery Attempt ${attempt}/${maxAttempts}`,
      message: `${title} - Attempting automatic recovery...`,
      icon: '🎮',
      duration: 3000
    });
  }

  createNotification({ type, title, message, icon, duration = 4000, actions = [] }) {
    // Use existing MLG notification system or fallback to custom implementation
    if (window.mlg && typeof window.mlg.showNotification === 'function') {
      window.mlg.showNotification(`${icon} ${title}: ${message}`, type);
      return;
    }
    
    // Custom notification implementation
    const container = this.getOrCreateNotificationContainer();
    const notification = this.createNotificationElement({
      type, title, message, icon, duration, actions
    });
    
    container.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
      notification.classList.add('show');
    });
    
    // Auto remove
    setTimeout(() => {
      this.removeNotification(notification);
    }, duration);
  }

  getOrCreateNotificationContainer() {
    let container = document.getElementById('mlg-error-notifications');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'mlg-error-notifications';
      container.className = 'mlg-notification-container';
      container.innerHTML = `
        <style>
          .mlg-notification-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
          }
          
          .mlg-notification {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 2px solid #00ff88;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            color: white;
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 8px 32px rgba(0, 255, 136, 0.3);
            transform: translateX(420px);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          .mlg-notification.show {
            transform: translateX(0);
            opacity: 1;
          }
          
          .mlg-notification.error {
            border-color: #ff0040;
            box-shadow: 0 8px 32px rgba(255, 0, 64, 0.3);
          }
          
          .mlg-notification.success {
            border-color: #00ff88;
            box-shadow: 0 8px 32px rgba(0, 255, 136, 0.3);
          }
          
          .mlg-notification.info {
            border-color: #0099ff;
            box-shadow: 0 8px 32px rgba(0, 153, 255, 0.3);
          }
          
          .mlg-notification-header {
            display: flex;
            align-items: center;
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 14px;
          }
          
          .mlg-notification-icon {
            margin-right: 8px;
            font-size: 16px;
          }
          
          .mlg-notification-message {
            font-size: 13px;
            line-height: 1.4;
            opacity: 0.9;
          }
          
          .mlg-notification-actions {
            display: flex;
            gap: 8px;
            margin-top: 12px;
          }
          
          .mlg-notification-btn {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            transition: background 0.2s;
          }
          
          .mlg-notification-btn:hover {
            background: rgba(255, 255, 255, 0.2);
          }
          
          @media (max-width: 768px) {
            .mlg-notification-container {
              top: 10px;
              right: 10px;
              left: 10px;
              max-width: none;
            }
            
            .mlg-notification {
              transform: translateY(-100px);
            }
            
            .mlg-notification.show {
              transform: translateY(0);
            }
          }
        </style>
      `;
      
      document.body.appendChild(container);
    }
    
    return container;
  }

  createNotificationElement({ type, title, message, icon, duration, actions }) {
    const notification = document.createElement('div');
    notification.className = `mlg-notification ${type}`;
    
    let actionsHtml = '';
    if (actions.length > 0) {
      actionsHtml = `
        <div class="mlg-notification-actions">
          ${actions.map(action => 
            `<button class="mlg-notification-btn" data-action="${action}">
              ${action.charAt(0).toUpperCase() + action.slice(1)}
            </button>`
          ).join('')}
        </div>
      `;
    }
    
    notification.innerHTML = `
      <div class="mlg-notification-header">
        <span class="mlg-notification-icon">${icon}</span>
        <span>${title}</span>
      </div>
      <div class="mlg-notification-message">${message}</div>
      ${actionsHtml}
    `;
    
    // Add click handlers for action buttons
    notification.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action) {
        this.handleNotificationAction(action, notification);
      }
    });
    
    return notification;
  }

  handleNotificationAction(action, notification) {
    switch (action) {
      case 'retry':
        this.removeNotification(notification);
        // Implement retry logic here
        break;
      case 'dismiss':
        this.removeNotification(notification);
        break;
      default:
        console.warn('Unknown notification action:', action);
    }
  }

  removeNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }

  logError(error, errorCode, context) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      errorCode,
      message: error.message,
      stack: error.stack,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      networkStatus: this.networkStatus
    };
    
    this.errorLog.push(logEntry);
    
    // Keep only last 1000 errors
    if (this.errorLog.length > 1000) {
      this.errorLog = this.errorLog.slice(-1000);
    }
    
    // Log to console in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.group(`🎮 MLG Error [${errorCode}]`);
      console.error('Error:', error);
      console.info('Context:', context);
      console.info('Network Status:', this.networkStatus);
      console.groupEnd();
    }
  }

  notifyNetworkChange(status) {
    this.listeners.forEach(listener => {
      if (listener.type === 'network') {
        listener.callback(status);
      }
    });
  }

  notifyConnectionQuality(quality) {
    this.listeners.forEach(listener => {
      if (listener.type === 'connection') {
        listener.callback(quality);
      }
    });
  }

  addEventListener(type, callback) {
    const listener = { type, callback };
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getErrorStats() {
    const stats = {
      totalErrors: this.errorLog.length,
      errorsByCode: {},
      errorsByCategory: {},
      recentErrors: this.errorLog.slice(-10),
      networkStatus: this.networkStatus,
      circuitBreakers: Object.fromEntries(this.circuitBreakers)
    };
    
    this.errorLog.forEach(entry => {
      const code = entry.errorCode;
      const category = this.ERROR_MESSAGES[code]?.category || 'unknown';
      
      stats.errorsByCode[code] = (stats.errorsByCode[code] || 0) + 1;
      stats.errorsByCategory[category] = (stats.errorsByCategory[category] || 0) + 1;
    });
    
    return stats;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public API methods
  async executeWithErrorHandling(operation, context = {}) {
    try {
      const result = await operation();
      return { success: true, data: result };
    } catch (error) {
      const recovery = await this.handleError(error, context);
      return { success: recovery.success, data: recovery.fallback?.data, error };
    }
  }

  setFallbackData(key, data) {
    this.fallbackData.set(key, data);
  }

  clearErrorLog() {
    this.errorLog = [];
  }

  getNetworkStatus() {
    return this.networkStatus;
  }
}

// Create global instance
window.MLGErrorHandler = new MLGErrorHandler();

// Export for ES6 modules
export default MLGErrorHandler;
export { MLGErrorHandler };