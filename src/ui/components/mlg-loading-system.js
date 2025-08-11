/**
 * MLG.clan Complete Loading System
 * Master integration component that provides a unified API for all loading states and transitions
 */

class MLGLoadingSystem {
  constructor(options = {}) {
    this.options = {
      // Gaming theme colors
      primaryColor: '#00ff88',
      secondaryColor: '#8b5cf6', 
      accentColor: '#3b82f6',
      warningColor: '#fbbf24',
      errorColor: '#ef4444',
      successColor: '#10b981',
      burnColor: '#ef4444',
      fireColor: '#f97316',
      emberColor: '#fbbf24',
      darkBg: '#0a0a0f',
      surfaceBg: '#1a1a2e',
      securityColor: '#10b981',
      
      // Performance settings
      enablePerformanceMode: false,
      maxConcurrentAnimations: 5,
      animationFrameLimit: 60,
      enableDebugMode: false,
      
      // Feature toggles
      enableSoundEffects: false,
      enableHapticFeedback: false,
      enableAnalytics: true,
      
      ...options
    };
    
    // Component instances
    this.components = {};
    this.activeLoaders = new Map();
    this.loadingQueue = [];
    this.performanceMetrics = {
      totalLoaders: 0,
      activeAnimations: 0,
      averageLoadTime: 0,
      memoryUsage: 0
    };
    
    this.init();
  }

  async init() {
    try {
      console.log('🎮 Initializing MLG Loading System...');
      
      // Initialize all component classes
      await this.initializeComponents();
      
      // Set up global event listeners
      this.setupGlobalListeners();
      
      // Initialize performance monitoring
      if (this.options.enablePerformanceMode) {
        this.initializePerformanceMonitoring();
      }
      
      // Set up analytics
      if (this.options.enableAnalytics) {
        this.setupAnalytics();
      }
      
      // Inject master styles
      this.injectMasterStyles();
      
      // Register global keyboard shortcuts
      this.setupKeyboardShortcuts();
      
      console.log('✅ MLG Loading System ready!');
      this.showSystemNotification('MLG Loading System Online', 'success');
      
    } catch (error) {
      console.error('❌ MLG Loading System initialization failed:', error);
      this.showSystemNotification('Loading System Error', 'error');
    }
  }

  async initializeComponents() {
    // Initialize all loading component classes
    if (typeof GamingLoadingStates !== 'undefined') {
      this.components.gaming = new GamingLoadingStates(this.options);
    }
    
    if (typeof XboxPageTransitions !== 'undefined') {
      this.components.transitions = new XboxPageTransitions(this.options);
    }
    
    if (typeof WalletLoadingStates !== 'undefined') {
      this.components.wallet = new WalletLoadingStates(this.options);
    }
    
    if (typeof VoteBurnLoading !== 'undefined') {
      this.components.voting = new VoteBurnLoading(this.options);
    }
    
    if (typeof GamingUploadProgress !== 'undefined') {
      this.components.upload = new GamingUploadProgress(this.options);
    }
    
    // Fallback for missing components
    Object.keys(this.components).forEach(key => {
      if (!this.components[key]) {
        console.warn(`⚠️ Component ${key} not available`);
      }
    });
  }

  // ================================================================================
  // UNIFIED API METHODS
  // ================================================================================

  /**
   * Show loading state with automatic type detection
   * @param {HTMLElement} container - Target container
   * @param {Object} options - Loading options
   */
  show(container, options = {}) {
    const loaderId = this.generateId();
    const type = this.detectLoadingType(options);
    
    try {
      let componentResult;
      
      switch (type) {
        case 'dashboard':
          componentResult = this.components.gaming?.showDashboardLoader(container, options);
          break;
          
        case 'skeleton':
          componentResult = this.components.gaming?.showSkeletonLoader(container, options);
          break;
          
        case 'spinner':
          componentResult = this.components.gaming?.showSpinnerLoader(container, options);
          break;
          
        case 'progress':
          componentResult = this.components.gaming?.showProgressLoader(container, options);
          break;
          
        case 'pulse':
          componentResult = this.components.gaming?.showPulseLoader(container, options);
          break;
          
        case 'wallet-phantom':
          componentResult = this.components.wallet?.showPhantomConnection(container, options);
          break;
          
        case 'wallet-transaction':
          componentResult = this.components.wallet?.showTransactionSigning(container, options);
          break;
          
        case 'wallet-balance':
          componentResult = this.components.wallet?.showBalanceLoading(container, options);
          break;
          
        case 'wallet-network':
          componentResult = this.components.wallet?.showNetworkConnection(container, options);
          break;
          
        case 'vote-burn':
          componentResult = this.components.voting?.showTokenBurn(container, options);
          break;
          
        case 'vote-confirmation':
          componentResult = this.components.voting?.showVoteConfirmation(container, options);
          break;
          
        case 'vote-limit':
          componentResult = this.components.voting?.showVoteLimitReached(container, options);
          break;
          
        case 'upload-single':
          componentResult = this.components.upload?.showFileUpload(container, options);
          break;
          
        case 'upload-queue':
          componentResult = this.components.upload?.showUploadQueue(container, options);
          break;
          
        case 'upload-complete':
          componentResult = this.components.upload?.showUploadComplete(container, options);
          break;
          
        default:
          // Fallback to basic gaming loader
          componentResult = this.components.gaming?.showSpinnerLoader(container, { 
            ...options, 
            message: 'Loading...' 
          });
      }
      
      // Track the loader
      this.activeLoaders.set(loaderId, {
        type,
        container,
        componentResult,
        startTime: Date.now(),
        options
      });
      
      // Update metrics
      this.performanceMetrics.totalLoaders++;
      this.performanceMetrics.activeAnimations++;
      
      // Analytics
      if (this.options.enableAnalytics) {
        this.trackAnalytics('loader_shown', { type, loaderId });
      }
      
      return componentResult || loaderId;
      
    } catch (error) {
      console.error('Loading error:', error);
      return this.showErrorFallback(container, error);
    }
  }

  /**
   * Execute page transition
   * @param {string} transitionType - Type of transition
   * @param {HTMLElement} container - Target container
   * @param {string} newContent - New content
   * @param {Object} options - Transition options
   */
  async transition(transitionType, container, newContent, options = {}) {
    try {
      if (!this.components.transitions) {
        throw new Error('Transitions component not available');
      }
      
      const startTime = Date.now();
      let result;
      
      switch (transitionType) {
        case 'blade':
          result = await this.components.transitions.blade(
            options.direction || 'right',
            container,
            newContent,
            options
          );
          break;
          
        case 'guide':
          result = await this.components.transitions.guide(container, newContent, options);
          break;
          
        case 'particle':
          result = await this.components.transitions.particle(container, newContent, options);
          break;
          
        case 'holographic':
          result = await this.components.transitions.holographic(container, newContent, options);
          break;
          
        default:
          // Fallback to basic fade
          result = await this.basicTransition(container, newContent, options);
      }
      
      // Analytics
      if (this.options.enableAnalytics) {
        this.trackAnalytics('transition_completed', {
          type: transitionType,
          duration: Date.now() - startTime
        });
      }
      
      return result;
      
    } catch (error) {
      console.error('Transition error:', error);
      // Fallback to direct content replacement
      container.innerHTML = newContent;
    }
  }

  /**
   * Update progress for active loaders
   * @param {string} loaderId - Loader ID
   * @param {number} progress - Progress percentage (0-100)
   * @param {string} status - Optional status message
   * @param {Object} additionalData - Additional data for specific loader types
   */
  updateProgress(loaderId, progress, status = null, additionalData = {}) {
    const loader = this.activeLoaders.get(loaderId);
    if (!loader) return;
    
    try {
      // Route to appropriate component
      switch (loader.type) {
        case 'progress':
        case 'dashboard':
          if (this.components.gaming && this.components.gaming.updateProgress) {
            this.components.gaming.updateProgress(loaderId, progress, status, additionalData.currentStep);
          }
          break;
          
        case 'wallet-phantom':
        case 'wallet-network':
          if (this.components.wallet && this.components.wallet.updateProgress) {
            this.components.wallet.updateProgress(loaderId, progress, status);
          }
          break;
          
        case 'upload-single':
        case 'upload-queue':
          // Upload components handle their own progress simulation
          break;
          
        default:
          // Generic progress update
          const progressElement = document.querySelector(`#${loaderId} .progress-fill`);
          if (progressElement) {
            progressElement.style.width = `${progress}%`;
          }
      }
      
      // Update loader tracking
      loader.progress = progress;
      loader.lastUpdate = Date.now();
      
    } catch (error) {
      console.error('Progress update error:', error);
    }
  }

  /**
   * Hide loader
   * @param {string} loaderId - Loader ID
   * @param {Object} options - Hide options
   */
  hide(loaderId, options = {}) {
    const loader = this.activeLoaders.get(loaderId);
    if (!loader) return;
    
    try {
      // Route to appropriate component
      const component = this.getComponentForType(loader.type);
      if (component && component.hideLoader) {
        component.hideLoader(loaderId, options);
      } else {
        // Generic hide
        const element = document.getElementById(loaderId);
        if (element) {
          element.classList.add('fade-out');
          setTimeout(() => {
            if (element.parentNode) {
              element.parentNode.removeChild(element);
            }
          }, 300);
        }
      }
      
      // Update metrics
      this.performanceMetrics.activeAnimations--;
      
      // Calculate average load time
      const duration = Date.now() - loader.startTime;
      this.performanceMetrics.averageLoadTime = 
        (this.performanceMetrics.averageLoadTime + duration) / 2;
      
      // Clean up
      this.activeLoaders.delete(loaderId);
      
      // Analytics
      if (this.options.enableAnalytics) {
        this.trackAnalytics('loader_hidden', {
          type: loader.type,
          duration,
          loaderId
        });
      }
      
    } catch (error) {
      console.error('Hide loader error:', error);
    }
  }

  /**
   * Show error state with retry functionality
   * @param {HTMLElement} container - Target container
   * @param {Error|string} error - Error object or message
   * @param {Object} options - Error options
   */
  showError(container, error, options = {}) {
    const errorId = this.generateId();
    const errorMessage = error instanceof Error ? error.message : error;
    
    try {
      if (this.components.gaming && this.components.gaming.showErrorState) {
        return this.components.gaming.showErrorState(container, {
          title: options.title || 'Loading Error',
          message: errorMessage,
          retry: options.retry !== false,
          onRetry: options.onRetry,
          support: options.support !== false
        });
      } else {
        return this.showErrorFallback(container, error);
      }
    } catch (fallbackError) {
      console.error('Error display failed:', fallbackError);
      container.innerHTML = `
        <div class="mlg-error-fallback">
          <div class="error-icon">⚠️</div>
          <div class="error-message">${errorMessage}</div>
          <button onclick="window.location.reload()">Reload Page</button>
        </div>
      `;
    }
  }

  // ================================================================================
  // REAL-TIME EFFECTS AND LIVE DATA
  // ================================================================================

  /**
   * Start real-time pulsing effect for live data
   * @param {HTMLElement} element - Target element
   * @param {Object} options - Pulse options
   */
  startPulseEffect(element, options = {}) {
    const pulseId = this.generateId();
    const intensity = options.intensity || 'medium';
    const color = options.color || this.options.primaryColor;
    const duration = options.duration || 2000;
    
    element.classList.add('mlg-pulse-effect');
    element.style.setProperty('--pulse-color', color);
    element.style.setProperty('--pulse-duration', `${duration}ms`);
    element.style.setProperty('--pulse-intensity', intensity);
    
    // Track for cleanup
    element.dataset.pulseId = pulseId;
    
    return pulseId;
  }

  /**
   * Stop pulsing effect
   * @param {HTMLElement} element - Target element
   */
  stopPulseEffect(element) {
    element.classList.remove('mlg-pulse-effect');
    delete element.dataset.pulseId;
  }

  /**
   * Create live data ticker effect
   * @param {HTMLElement} element - Target element
   * @param {Function} dataProvider - Function that returns new data
   * @param {Object} options - Ticker options
   */
  startLiveDataTicker(element, dataProvider, options = {}) {
    const tickerId = this.generateId();
    const interval = options.interval || 3000;
    const animation = options.animation || 'fade';
    
    const updateTicker = () => {
      try {
        const newData = dataProvider();
        if (newData !== element.textContent) {
          this.animateDataChange(element, newData, animation);
        }
      } catch (error) {
        console.error('Ticker data error:', error);
      }
    };
    
    // Start immediately and then on interval
    updateTicker();
    const intervalId = setInterval(updateTicker, interval);
    
    // Store for cleanup
    element.dataset.tickerId = tickerId;
    element.dataset.intervalId = intervalId;
    
    return tickerId;
  }

  /**
   * Stop live data ticker
   * @param {HTMLElement} element - Target element
   */
  stopLiveDataTicker(element) {
    const intervalId = element.dataset.intervalId;
    if (intervalId) {
      clearInterval(parseInt(intervalId));
      delete element.dataset.intervalId;
      delete element.dataset.tickerId;
    }
  }

  /**
   * Animate data changes with gaming effects
   * @param {HTMLElement} element - Target element
   * @param {string} newData - New data to display
   * @param {string} animation - Animation type
   */
  animateDataChange(element, newData, animation = 'fade') {
    const originalData = element.textContent;
    
    switch (animation) {
      case 'fade':
        element.style.transition = 'opacity 0.3s ease';
        element.style.opacity = '0';
        setTimeout(() => {
          element.textContent = newData;
          element.style.opacity = '1';
        }, 150);
        break;
        
      case 'slide':
        element.style.transition = 'transform 0.3s ease';
        element.style.transform = 'translateY(-10px)';
        element.style.opacity = '0.5';
        setTimeout(() => {
          element.textContent = newData;
          element.style.transform = 'translateY(0)';
          element.style.opacity = '1';
        }, 150);
        break;
        
      case 'glow':
        element.style.transition = 'text-shadow 0.5s ease';
        element.style.textShadow = `0 0 20px ${this.options.primaryColor}`;
        setTimeout(() => {
          element.textContent = newData;
          setTimeout(() => {
            element.style.textShadow = '';
          }, 200);
        }, 100);
        break;
        
      default:
        element.textContent = newData;
    }
  }

  // ================================================================================
  // UTILITY AND HELPER METHODS
  // ================================================================================

  /**
   * Detect loading type from options
   * @param {Object} options - Loading options
   */
  detectLoadingType(options) {
    // Explicit type
    if (options.type) return options.type;
    
    // Auto-detect based on options
    if (options.wallet) return 'wallet-phantom';
    if (options.vote) return 'vote-burn';
    if (options.upload) return 'upload-single';
    if (options.skeleton) return 'skeleton';
    if (options.progress) return 'progress';
    if (options.pulse) return 'pulse';
    
    // Default
    return options.dashboard ? 'dashboard' : 'spinner';
  }

  /**
   * Get component instance for loader type
   * @param {string} type - Loader type
   */
  getComponentForType(type) {
    if (type.startsWith('wallet')) return this.components.wallet;
    if (type.startsWith('vote')) return this.components.voting;
    if (type.startsWith('upload')) return this.components.upload;
    if (type.startsWith('transition')) return this.components.transitions;
    return this.components.gaming;
  }

  /**
   * Basic transition fallback
   * @param {HTMLElement} container - Target container
   * @param {string} newContent - New content
   * @param {Object} options - Transition options
   */
  async basicTransition(container, newContent, options = {}) {
    const duration = options.duration || 300;
    
    return new Promise(resolve => {
      container.style.transition = `opacity ${duration}ms ease`;
      container.style.opacity = '0';
      
      setTimeout(() => {
        container.innerHTML = newContent;
        container.style.opacity = '1';
        
        setTimeout(() => {
          container.style.transition = '';
          resolve();
        }, duration);
      }, duration);
    });
  }

  /**
   * Show error fallback
   * @param {HTMLElement} container - Target container
   * @param {Error} error - Error object
   */
  showErrorFallback(container, error) {
    const errorId = this.generateId();
    container.innerHTML = `
      <div id="${errorId}" class="mlg-error-fallback fade-in">
        <div class="error-icon">⚠️</div>
        <h3 class="error-title">Loading Error</h3>
        <p class="error-message">${error.message || 'Something went wrong'}</p>
        <div class="error-actions">
          <button onclick="window.history.back()">Go Back</button>
          <button onclick="window.location.reload()">Reload</button>
        </div>
      </div>
    `;
    return errorId;
  }

  /**
   * Show system notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type
   */
  showSystemNotification(message, type = 'info') {
    if (!this.options.enableDebugMode && type !== 'error') return;
    
    const notification = document.createElement('div');
    notification.className = `mlg-system-notification ${type}`;
    notification.textContent = `[MLG] ${message}`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return 'mlg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  // ================================================================================
  // PERFORMANCE AND ANALYTICS
  // ================================================================================

  /**
   * Initialize performance monitoring
   */
  initializePerformanceMonitoring() {
    // Monitor memory usage
    if (performance.memory) {
      setInterval(() => {
        this.performanceMetrics.memoryUsage = performance.memory.usedJSHeapSize;
      }, 5000);
    }
    
    // Monitor animation performance
    this.setupFrameRateMonitoring();
  }

  /**
   * Set up frame rate monitoring
   */
  setupFrameRateMonitoring() {
    let lastFrameTime = performance.now();
    let frameCount = 0;
    
    const measureFrameRate = () => {
      const currentTime = performance.now();
      frameCount++;
      
      if (currentTime - lastFrameTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastFrameTime));
        this.performanceMetrics.currentFPS = fps;
        
        // Warn if FPS drops below threshold
        if (fps < 30 && this.performanceMetrics.activeAnimations > 0) {
          console.warn('⚠️ Low FPS detected:', fps);
        }
        
        frameCount = 0;
        lastFrameTime = currentTime;
      }
      
      requestAnimationFrame(measureFrameRate);
    };
    
    requestAnimationFrame(measureFrameRate);
  }

  /**
   * Set up analytics tracking
   */
  setupAnalytics() {
    // Track user interactions with loaders
    document.addEventListener('click', (event) => {
      if (event.target.closest('[id^="mlg-"]')) {
        this.trackAnalytics('loader_interaction', {
          element: event.target.tagName,
          action: 'click'
        });
      }
    });
    
    // Track page visibility for performance optimization
    document.addEventListener('visibilitychange', () => {
      this.trackAnalytics('page_visibility', {
        hidden: document.hidden,
        activeLoaders: this.activeLoaders.size
      });
    });
  }

  /**
   * Track analytics event
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  trackAnalytics(event, data = {}) {
    if (!this.options.enableAnalytics) return;
    
    try {
      // Send to analytics service (implement as needed)
      console.log('📊 Analytics:', event, data);
      
      // Could integrate with Google Analytics, Mixpanel, etc.
      // gtag?.('event', event, data);
      // mixpanel?.track(event, data);
      
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  /**
   * Set up global event listeners
   */
  setupGlobalListeners() {
    // Handle window resize for responsive adjustments
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Handle network status changes
    window.addEventListener('online', () => {
      this.showSystemNotification('Network connection restored', 'success');
    });
    
    window.addEventListener('offline', () => {
      this.showSystemNotification('Network connection lost', 'warning');
    });
    
    // Handle unhandled errors
    window.addEventListener('error', (event) => {
      if (this.options.enableDebugMode) {
        console.error('Global error:', event.error);
      }
    });
  }

  /**
   * Handle window resize
   */
  handleResize() {
    // Update responsive styles for active loaders
    this.activeLoaders.forEach((loader, loaderId) => {
      const element = document.getElementById(loaderId);
      if (element) {
        // Re-trigger responsive CSS
        element.classList.add('responsive-update');
        setTimeout(() => {
          element.classList.remove('responsive-update');
        }, 100);
      }
    });
  }

  /**
   * Set up keyboard shortcuts for development
   */
  setupKeyboardShortcuts() {
    if (!this.options.enableDebugMode) return;
    
    document.addEventListener('keydown', (event) => {
      // Ctrl+Alt+L: Show debug info
      if (event.ctrlKey && event.altKey && event.key === 'l') {
        console.log('MLG Loading System Debug:', {
          activeLoaders: Array.from(this.activeLoaders.keys()),
          performance: this.performanceMetrics,
          components: Object.keys(this.components)
        });
      }
      
      // Ctrl+Alt+H: Hide all loaders
      if (event.ctrlKey && event.altKey && event.key === 'h') {
        this.hideAll();
      }
    });
  }

  // ================================================================================
  // PUBLIC API METHODS
  // ================================================================================

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  /**
   * Get active loaders
   */
  getActiveLoaders() {
    return Array.from(this.activeLoaders.entries()).map(([id, data]) => ({
      id,
      type: data.type,
      duration: Date.now() - data.startTime
    }));
  }

  /**
   * Hide all active loaders
   */
  hideAll() {
    const loaderIds = Array.from(this.activeLoaders.keys());
    loaderIds.forEach(id => this.hide(id));
  }

  /**
   * Enable/disable performance mode
   * @param {boolean} enabled - Whether to enable performance mode
   */
  setPerformanceMode(enabled) {
    this.options.enablePerformanceMode = enabled;
    
    if (enabled) {
      this.initializePerformanceMonitoring();
    }
  }

  /**
   * Update theme colors
   * @param {Object} colors - New color scheme
   */
  updateTheme(colors) {
    this.options = { ...this.options, ...colors };
    
    // Update component themes
    Object.values(this.components).forEach(component => {
      if (component.updateTheme) {
        component.updateTheme(colors);
      }
    });
    
    // Re-inject styles with new colors
    this.injectMasterStyles();
  }

  /**
   * Inject master styles
   */
  injectMasterStyles() {
    const styles = `
      <style id="mlg-master-styles">
        /* Global MLG Loading System Styles */
        .fade-in {
          animation: mlgFadeIn 0.4s ease-out forwards;
        }
        
        .fade-out {
          animation: mlgFadeOut 0.3s ease-in forwards;
        }
        
        @keyframes mlgFadeIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        @keyframes mlgFadeOut {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.98); }
        }
        
        /* Pulse Effect */
        .mlg-pulse-effect {
          animation: mlgPulseEffect var(--pulse-duration, 2s) ease-in-out infinite;
        }
        
        @keyframes mlgPulseEffect {
          0%, 100% { 
            opacity: 0.8; 
            box-shadow: 0 0 0 0 var(--pulse-color, ${this.options.primaryColor})40;
          }
          50% { 
            opacity: 1; 
            box-shadow: 0 0 0 10px var(--pulse-color, ${this.options.primaryColor})20;
          }
        }
        
        /* Error Fallback */
        .mlg-error-fallback {
          text-align: center;
          padding: 2rem;
          background: ${this.options.surfaceBg}90;
          border-radius: 12px;
          border: 1px solid ${this.options.errorColor}30;
        }
        
        .mlg-error-fallback .error-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        
        .mlg-error-fallback .error-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: ${this.options.errorColor};
          margin-bottom: 1rem;
        }
        
        .mlg-error-fallback .error-message {
          font-size: 1rem;
          color: #d1d5db;
          margin-bottom: 2rem;
          line-height: 1.6;
        }
        
        .mlg-error-fallback .error-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }
        
        .mlg-error-fallback button {
          background: ${this.options.primaryColor};
          color: ${this.options.darkBg};
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.3s ease;
        }
        
        .mlg-error-fallback button:hover {
          background: ${this.options.primaryColor}dd;
        }
        
        /* System Notifications */
        .mlg-system-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          z-index: 10000;
          transform: translateX(100%);
          transition: transform 0.3s ease;
          max-width: 300px;
        }
        
        .mlg-system-notification.show {
          transform: translateX(0);
        }
        
        .mlg-system-notification.info {
          background: ${this.options.accentColor};
          color: white;
        }
        
        .mlg-system-notification.success {
          background: ${this.options.successColor};
          color: white;
        }
        
        .mlg-system-notification.warning {
          background: ${this.options.warningColor};
          color: ${this.options.darkBg};
        }
        
        .mlg-system-notification.error {
          background: ${this.options.errorColor};
          color: white;
        }
        
        /* Responsive adjustments */
        .responsive-update {
          transition: all 0.1s ease;
        }
        
        @media (max-width: 768px) {
          .mlg-system-notification {
            top: 10px;
            right: 10px;
            left: 10px;
            max-width: none;
          }
          
          .mlg-error-fallback {
            padding: 1rem;
          }
          
          .mlg-error-fallback .error-actions {
            flex-direction: column;
          }
        }
        
        /* High contrast support */
        @media (prefers-contrast: high) {
          .mlg-error-fallback,
          .mlg-system-notification {
            border: 2px solid currentColor;
          }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .fade-in,
          .fade-out,
          .mlg-pulse-effect {
            animation: none;
          }
          
          .mlg-system-notification {
            transition: none;
          }
        }
      </style>
    `;
    
    // Remove existing master styles
    const existingStyles = document.getElementById('mlg-master-styles');
    if (existingStyles) {
      existingStyles.remove();
    }
    
    document.head.insertAdjacentHTML('beforeend', styles);
  }
}

// ================================================================================
// GLOBAL INITIALIZATION
// ================================================================================

// Initialize the MLG Loading System when DOM is ready
if (typeof window !== 'undefined') {
  let mlgLoadingSystem = null;
  
  const initializeMLGSystem = () => {
    try {
      mlgLoadingSystem = new MLGLoadingSystem({
        enableDebugMode: window.location.hostname === 'localhost',
        enablePerformanceMode: true,
        enableAnalytics: true
      });
      
      // Make globally available
      window.MLG = mlgLoadingSystem;
      window.mlgLoading = mlgLoadingSystem;
      
      // Dispatch ready event
      window.dispatchEvent(new CustomEvent('mlg:ready', {
        detail: mlgLoadingSystem
      }));
      
    } catch (error) {
      console.error('Failed to initialize MLG Loading System:', error);
    }
  };
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMLGSystem);
  } else {
    initializeMLGSystem();
  }
  
  // Export for ES6 modules
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MLGLoadingSystem;
  }
  
  console.log('🎮 MLG Loading System script loaded');
}

// ================================================================================
// USAGE EXAMPLES AND DOCUMENTATION
// ================================================================================

/*
// Example Usage:

// 1. Basic loading state
const loaderId = MLG.show(container, {
  type: 'dashboard',
  message: 'Loading game data...'
});

// 2. Wallet connection
MLG.show(container, {
  type: 'wallet-phantom',
  estimatedTime: '5-10 seconds'
});

// 3. Vote submission with burn effect
MLG.show(container, {
  type: 'vote-burn',
  amount: 25,
  symbol: 'MLG',
  contentTitle: 'Epic Gaming Clip'
});

// 4. File upload progress
MLG.show(container, {
  type: 'upload-single',
  fileName: 'gameplay.mp4',
  fileSize: '15.4 MB'
});

// 5. Page transition
await MLG.transition('blade', container, newContent, {
  direction: 'right',
  duration: 600
});

// 6. Progress updates
MLG.updateProgress(loaderId, 75, 'Processing data...');

// 7. Live data effects
MLG.startPulseEffect(element, {
  intensity: 'high',
  color: '#00ff88'
});

MLG.startLiveDataTicker(element, () => {
  return Math.floor(Math.random() * 1000);
}, { interval: 2000 });

// 8. Error handling
MLG.showError(container, new Error('Network timeout'), {
  title: 'Connection Error',
  onRetry: () => location.reload()
});

// 9. Hide loader
MLG.hide(loaderId);

// 10. Performance monitoring
const metrics = MLG.getPerformanceMetrics();
console.log('Active loaders:', metrics.activeAnimations);
*/