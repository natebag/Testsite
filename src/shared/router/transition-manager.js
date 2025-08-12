/**
 * MLG.clan Transition Manager
 * Advanced route transitions with animations, loading states, and smooth user experience
 */

class TransitionManager {
  constructor(options = {}) {
    this.options = {
      defaultTransition: 'slide',
      transitionDuration: 300,
      loadingTimeout: 5000,
      enableParallax: true,
      enablePreloader: true,
      ...options
    };

    // Transition types
    this.transitions = {
      slide: this.slideTransition.bind(this),
      fade: this.fadeTransition.bind(this),
      zoom: this.zoomTransition.bind(this),
      flip: this.flipTransition.bind(this),
      parallax: this.parallaxTransition.bind(this),
      gaming: this.gamingTransition.bind(this)
    };

    // Loading states
    this.loadingStates = {
      skeleton: this.createSkeletonLoader.bind(this),
      spinner: this.createSpinnerLoader.bind(this),
      progress: this.createProgressLoader.bind(this),
      gaming: this.createGamingLoader.bind(this)
    };

    // State management
    this.state = {
      isTransitioning: false,
      currentTransition: null,
      loadingState: null,
      progress: 0
    };

    this.init();
  }

  /**
   * Initialize the transition manager
   */
  init() {
    this.injectTransitionCSS();
    this.setupPerformanceMonitoring();
    console.log('🎬 Transition Manager initialized');
  }

  /**
   * Execute route transition
   * @param {HTMLElement} container - Target container
   * @param {string} newContent - New content to display
   * @param {Object} options - Transition options
   */
  async executeTransition(container, newContent, options = {}) {
    const transitionType = options.transition || this.options.defaultTransition;
    const duration = options.duration || this.options.transitionDuration;
    
    if (this.state.isTransitioning && !options.force) {
      await this.waitForTransition();
    }

    this.state.isTransitioning = true;
    this.state.currentTransition = transitionType;

    try {
      const transition = this.transitions[transitionType] || this.transitions.slide;
      await transition(container, newContent, { ...options, duration });
    } catch (error) {
      console.error('Transition error:', error);
      // Fallback to immediate content replacement
      container.innerHTML = newContent;
    } finally {
      this.state.isTransitioning = false;
      this.state.currentTransition = null;
    }
  }

  /**
   * Show loading state
   * @param {HTMLElement} container - Target container
   * @param {Object} options - Loading options
   */
  showLoadingState(container, options = {}) {
    const loaderType = options.type || 'gaming';
    const loader = this.loadingStates[loaderType];
    
    if (loader) {
      const loadingHTML = loader(options);
      container.innerHTML = loadingHTML;
      
      // Set up loading timeout
      if (options.timeout !== false) {
        const timeout = options.timeout || this.options.loadingTimeout;
        setTimeout(() => {
          if (this.state.loadingState) {
            this.showErrorState(container, new Error('Loading timeout'));
          }
        }, timeout);
      }
      
      this.state.loadingState = { type: loaderType, startTime: Date.now() };
    }
  }

  /**
   * Update loading progress
   * @param {number} progress - Progress percentage (0-100)
   * @param {string} message - Optional message
   */
  updateLoadingProgress(progress, message = '') {
    this.state.progress = Math.max(0, Math.min(100, progress));
    
    const progressElement = document.querySelector('.loading-progress-bar');
    const messageElement = document.querySelector('.loading-message');
    
    if (progressElement) {
      progressElement.style.width = `${this.state.progress}%`;
    }
    
    if (messageElement && message) {
      messageElement.textContent = message;
    }
  }

  /**
   * Hide loading state
   */
  hideLoadingState() {
    this.state.loadingState = null;
    this.state.progress = 0;
  }

  /**
   * Show error state
   * @param {HTMLElement} container - Target container
   * @param {Error} error - Error object
   */
  showErrorState(container, error) {
    container.innerHTML = `
      <div class="route-error-state fade-in">
        <div class="bg-gaming-surface rounded-lg p-8 text-center max-w-md mx-auto">
          <div class="text-gaming-red text-5xl mb-4 animate-bounce">⚠️</div>
          <h2 class="text-xl font-bold text-gaming-red mb-2">Route Loading Error</h2>
          <p class="text-gray-400 mb-6">${error.message}</p>
          
          <div class="space-y-3">
            <button onclick="window.history.back()" class="w-full bg-gaming-blue hover:bg-blue-600 px-6 py-2 rounded-lg font-bold transition-colors">
              <i class="lucide-arrow-left mr-2"></i>Go Back
            </button>
            <button onclick="window.location.reload()" class="w-full bg-gaming-accent hover:bg-green-400 text-black px-6 py-2 rounded-lg font-bold transition-colors">
              <i class="lucide-refresh-cw mr-2"></i>Reload Page
            </button>
            <button onclick="router.push('/dashboard')" class="w-full bg-gaming-surface hover:bg-gray-700 px-6 py-2 rounded-lg font-medium transition-colors">
              <i class="lucide-home mr-2"></i>Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Re-initialize icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // =============================================================================
  // TRANSITION IMPLEMENTATIONS
  // =============================================================================

  /**
   * Slide transition
   */
  async slideTransition(container, newContent, options) {
    const direction = options.direction || 'right';
    const duration = options.duration || this.options.transitionDuration;
    
    // Create transition wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'transition-wrapper';
    wrapper.style.position = 'relative';
    wrapper.style.overflow = 'hidden';
    
    // Current content
    const currentContent = container.innerHTML;
    const currentDiv = document.createElement('div');
    currentDiv.innerHTML = currentContent;
    currentDiv.className = 'transition-current';
    
    // New content
    const newDiv = document.createElement('div');
    newDiv.innerHTML = newContent;
    newDiv.className = 'transition-new';
    
    // Set initial positions
    const slideDistance = direction === 'left' ? '-100%' : '100%';
    newDiv.style.transform = `translateX(${slideDistance})`;
    
    // Add to wrapper
    wrapper.appendChild(currentDiv);
    wrapper.appendChild(newDiv);
    container.innerHTML = '';
    container.appendChild(wrapper);
    
    // Animate
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        currentDiv.style.transition = `transform ${duration}ms ease-out`;
        newDiv.style.transition = `transform ${duration}ms ease-out`;
        
        currentDiv.style.transform = direction === 'left' ? 'translateX(100%)' : 'translateX(-100%)';
        newDiv.style.transform = 'translateX(0)';
        
        setTimeout(() => {
          container.innerHTML = newContent;
          resolve();
        }, duration);
      });
    });
  }

  /**
   * Fade transition
   */
  async fadeTransition(container, newContent, options) {
    const duration = options.duration || this.options.transitionDuration;
    
    return new Promise(resolve => {
      container.style.transition = `opacity ${duration}ms ease-out`;
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
   * Zoom transition
   */
  async zoomTransition(container, newContent, options) {
    const duration = options.duration || this.options.transitionDuration;
    const scale = options.scale || 0.8;
    
    return new Promise(resolve => {
      container.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
      container.style.transform = `scale(${scale})`;
      container.style.opacity = '0';
      
      setTimeout(() => {
        container.innerHTML = newContent;
        container.style.transform = 'scale(1)';
        container.style.opacity = '1';
        
        setTimeout(() => {
          container.style.transition = '';
          container.style.transform = '';
          resolve();
        }, duration);
      }, duration / 2);
    });
  }

  /**
   * Flip transition
   */
  async flipTransition(container, newContent, options) {
    const duration = options.duration || this.options.transitionDuration;
    const axis = options.axis || 'Y';
    
    return new Promise(resolve => {
      container.style.transition = `transform ${duration}ms ease-out`;
      container.style.transform = `rotate${axis}(90deg)`;
      
      setTimeout(() => {
        container.innerHTML = newContent;
        container.style.transform = `rotate${axis}(-90deg)`;
        
        requestAnimationFrame(() => {
          container.style.transform = `rotate${axis}(0deg)`;
          
          setTimeout(() => {
            container.style.transition = '';
            container.style.transform = '';
            resolve();
          }, duration);
        });
      }, duration / 2);
    });
  }

  /**
   * Parallax transition
   */
  async parallaxTransition(container, newContent, options) {
    const duration = options.duration || this.options.transitionDuration;
    
    // Create parallax layers
    const background = document.createElement('div');
    background.className = 'parallax-background';
    background.style.position = 'absolute';
    background.style.top = '0';
    background.style.left = '0';
    background.style.width = '100%';
    background.style.height = '100%';
    background.style.background = 'linear-gradient(135deg, rgba(26,26,46,0.8), rgba(10,10,15,0.9))';
    background.style.transform = 'translateX(100%)';
    
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    container.appendChild(background);
    
    return new Promise(resolve => {
      // Animate background
      background.style.transition = `transform ${duration}ms ease-out`;
      background.style.transform = 'translateX(0)';
      
      setTimeout(() => {
        container.innerHTML = newContent;
        resolve();
      }, duration);
    });
  }

  /**
   * Gaming-themed transition
   */
  async gamingTransition(container, newContent, options) {
    const duration = options.duration || this.options.transitionDuration;
    
    // Create gaming effect overlay
    const overlay = document.createElement('div');
    overlay.className = 'gaming-transition-overlay';
    overlay.innerHTML = `
      <div class="gaming-transition-content">
        <div class="gaming-loader">
          <div class="pixel-art-loader">
            <div class="pixel"></div>
            <div class="pixel"></div>
            <div class="pixel"></div>
            <div class="pixel"></div>
          </div>
          <div class="loading-text">LOADING...</div>
        </div>
      </div>
    `;
    
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'linear-gradient(45deg, rgba(0,255,136,0.1), rgba(139,92,246,0.1))';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.opacity = '0';
    overlay.style.transition = `opacity ${duration/2}ms ease-out`;
    
    container.style.position = 'relative';
    container.appendChild(overlay);
    
    return new Promise(resolve => {
      // Show overlay
      overlay.style.opacity = '1';
      
      setTimeout(() => {
        container.innerHTML = newContent;
        resolve();
      }, duration);
    });
  }

  // =============================================================================
  // LOADING STATE IMPLEMENTATIONS
  // =============================================================================

  /**
   * Create skeleton loader
   */
  createSkeletonLoader(options) {
    const lines = options.lines || 5;
    let skeletonHTML = '<div class="skeleton-loader">';
    
    for (let i = 0; i < lines; i++) {
      const width = 60 + Math.random() * 40; // Random width between 60-100%
      skeletonHTML += `<div class="skeleton-line" style="width: ${width}%"></div>`;
    }
    
    skeletonHTML += '</div>';
    return skeletonHTML;
  }

  /**
   * Create spinner loader
   */
  createSpinnerLoader(options) {
    const message = options.message || 'Loading...';
    
    return `
      <div class="spinner-loader text-center py-20">
        <div class="loading-spinner w-12 h-12 mx-auto mb-4"></div>
        <div class="text-gaming-accent font-medium">${message}</div>
      </div>
    `;
  }

  /**
   * Create progress loader
   */
  createProgressLoader(options) {
    const message = options.message || 'Loading content...';
    
    return `
      <div class="progress-loader text-center py-20">
        <div class="max-w-md mx-auto">
          <div class="text-gaming-accent text-2xl mb-4">🎮</div>
          <div class="loading-progress-container mb-4">
            <div class="loading-progress-track bg-gaming-surface rounded-full h-2">
              <div class="loading-progress-bar bg-gaming-accent rounded-full h-2 transition-all duration-300" style="width: 0%"></div>
            </div>
          </div>
          <div class="loading-message text-gaming-accent font-medium">${message}</div>
          <div class="loading-percentage text-sm text-gray-400 mt-2">0%</div>
        </div>
      </div>
    `;
  }

  /**
   * Create gaming-themed loader
   */
  createGamingLoader(options) {
    const message = options.message || 'Entering the gaming zone...';
    
    return `
      <div class="gaming-loader text-center py-20">
        <div class="max-w-md mx-auto">
          <div class="pixel-art-container mb-6">
            <div class="pixel-art-loader">
              <div class="pixel bg-gaming-accent"></div>
              <div class="pixel bg-gaming-blue"></div>
              <div class="pixel bg-gaming-purple"></div>
              <div class="pixel bg-gaming-yellow"></div>
              <div class="pixel bg-gaming-accent"></div>
              <div class="pixel bg-gaming-blue"></div>
              <div class="pixel bg-gaming-purple"></div>
              <div class="pixel bg-gaming-yellow"></div>
            </div>
          </div>
          
          <div class="loading-text text-gaming-accent font-bold text-lg mb-2 animate-pulse">
            LOADING
          </div>
          
          <div class="loading-message text-gray-400 text-sm mb-4">
            ${message}
          </div>
          
          <div class="loading-dots">
            <span class="dot animate-ping">•</span>
            <span class="dot animate-ping" style="animation-delay: 0.2s">•</span>
            <span class="dot animate-ping" style="animation-delay: 0.4s">•</span>
          </div>
        </div>
      </div>
    `;
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Wait for current transition to complete
   */
  async waitForTransition() {
    return new Promise(resolve => {
      const checkTransition = () => {
        if (!this.state.isTransitioning) {
          resolve();
        } else {
          setTimeout(checkTransition, 50);
        }
      };
      checkTransition();
    });
  }

  /**
   * Inject transition CSS styles
   */
  injectTransitionCSS() {
    const style = document.createElement('style');
    style.textContent = `
      /* Route Transition Styles */
      .transition-wrapper {
        position: relative;
        overflow: hidden;
      }
      
      .transition-current,
      .transition-new {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        min-height: 100%;
      }
      
      .fade-in {
        animation: fadeIn 0.3s ease-out;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      /* Loading Spinner */
      .loading-spinner {
        border: 2px solid rgba(0, 255, 136, 0.1);
        border-left: 2px solid var(--neon-green);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      /* Skeleton Loader */
      .skeleton-loader {
        padding: 2rem;
      }
      
      .skeleton-line {
        height: 1rem;
        background: linear-gradient(90deg, 
          rgba(26,26,46,0.5) 25%, 
          rgba(0,255,136,0.1) 50%, 
          rgba(26,26,46,0.5) 75%
        );
        background-size: 200% 100%;
        border-radius: 0.25rem;
        margin-bottom: 0.75rem;
        animation: skeletonShimmer 2s infinite;
      }
      
      @keyframes skeletonShimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      
      /* Pixel Art Loader */
      .pixel-art-loader {
        display: grid;
        grid-template-columns: repeat(4, 8px);
        grid-gap: 2px;
        justify-content: center;
        margin: 0 auto;
      }
      
      .pixel {
        width: 8px;
        height: 8px;
        animation: pixelBlink 1.5s infinite;
      }
      
      .pixel:nth-child(1) { animation-delay: 0s; }
      .pixel:nth-child(2) { animation-delay: 0.2s; }
      .pixel:nth-child(3) { animation-delay: 0.4s; }
      .pixel:nth-child(4) { animation-delay: 0.6s; }
      .pixel:nth-child(5) { animation-delay: 0.8s; }
      .pixel:nth-child(6) { animation-delay: 1s; }
      .pixel:nth-child(7) { animation-delay: 1.2s; }
      .pixel:nth-child(8) { animation-delay: 1.4s; }
      
      @keyframes pixelBlink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0.3; }
      }
      
      /* Loading Dots */
      .loading-dots .dot {
        display: inline-block;
        margin: 0 2px;
        color: var(--neon-green);
      }
      
      /* Gaming Transition Overlay */
      .gaming-transition-overlay {
        backdrop-filter: blur(10px);
        z-index: 1000;
      }
      
      .gaming-transition-content {
        text-align: center;
        color: white;
      }
      
      .route-error-state {
        padding: 2rem;
        min-height: 400px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Set up performance monitoring
   */
  setupPerformanceMonitoring() {
    this.performanceMetrics = {
      transitionCount: 0,
      averageTransitionTime: 0,
      loadingStateCount: 0,
      errorCount: 0
    };

    // Monitor transition performance
    this.originalExecuteTransition = this.executeTransition;
    this.executeTransition = async (...args) => {
      const startTime = performance.now();
      
      try {
        await this.originalExecuteTransition.apply(this, args);
        
        const duration = performance.now() - startTime;
        this.performanceMetrics.transitionCount++;
        this.performanceMetrics.averageTransitionTime = 
          (this.performanceMetrics.averageTransitionTime + duration) / 2;
          
      } catch (error) {
        this.performanceMetrics.errorCount++;
        throw error;
      }
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      currentState: this.state
    };
  }

  /**
   * Preload transition assets
   */
  async preloadAssets() {
    // Preload any transition-related assets
    console.log('🎬 Transition assets preloaded');
  }

  /**
   * Set transition options
   * @param {Object} options - New options
   */
  setOptions(options) {
    this.options = { ...this.options, ...options };
  }

  /**
   * Register custom transition
   * @param {string} name - Transition name
   * @param {Function} transitionFn - Transition function
   */
  registerTransition(name, transitionFn) {
    this.transitions[name] = transitionFn;
  }

  /**
   * Register custom loading state
   * @param {string} name - Loading state name
   * @param {Function} loaderFn - Loader function
   */
  registerLoader(name, loaderFn) {
    this.loadingStates[name] = loaderFn;
  }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TransitionManager;
}

// Global export for browser use
if (typeof window !== 'undefined') {
  window.TransitionManager = TransitionManager;
}