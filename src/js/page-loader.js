/**
 * MLG.clan Page Loader
 * Standardized loading system for all pages with dependency management
 */

class PageLoader {
  constructor(pageConfig = {}) {
    this.pageConfig = {
      enableRouter: true,
      showLoadingScreen: true,
      autoInitialize: true,
      ...pageConfig
    };
    
    this.loadingSteps = [];
    this.currentStep = 0;
    this.isLoading = false;
    this.moduleLoader = null;
    this.routerLoader = null;
    
    console.log(`📄 Page Loader initialized for ${document.title}`);
  }

  /**
   * Initialize the page loading process
   */
  async init() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    
    try {
      // Show loading screen if enabled
      if (this.pageConfig.showLoadingScreen) {
        this.showLoadingScreen();
      }

      // Define loading steps
      this.loadingSteps = [
        { name: 'Shared Config', action: () => this.loadSharedConfig() },
        { name: 'External Dependencies', action: () => this.loadExternalDependencies() },
        { name: 'Module System', action: () => this.initializeModuleSystem() }
      ];

      // Add router step if enabled
      if (this.pageConfig.enableRouter) {
        this.loadingSteps.push({ 
          name: 'SPA Router', 
          action: () => this.initializeRouter() 
        });
      }

      // Add page-specific initialization
      this.loadingSteps.push({ 
        name: 'Page Content', 
        action: () => this.initializePageContent() 
      });

      // Execute loading steps
      for (let i = 0; i < this.loadingSteps.length; i++) {
        this.currentStep = i;
        const step = this.loadingSteps[i];
        
        this.updateLoadingMessage(`Loading ${step.name}...`);
        await step.action();
        this.updateLoadingProgress((i + 1) / this.loadingSteps.length * 100);
      }

      // Hide loading screen
      this.hideLoadingScreen();
      
      // Show success notification
      this.showNotification('✅ Page loaded successfully!', 'success');
      
      this.isLoading = false;
      
      // Emit page ready event
      window.dispatchEvent(new CustomEvent('page:ready', {
        detail: { pageConfig: this.pageConfig, loadTime: Date.now() }
      }));

    } catch (error) {
      console.error('❌ Page loading failed:', error);
      this.handleLoadingError(error);
      this.isLoading = false;
    }
  }

  /**
   * Load shared configuration
   */
  async loadSharedConfig() {
    return new Promise((resolve, reject) => {
      if (typeof window.MLGConfig !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'src/js/shared-config.js';
      script.onload = () => {
        if (typeof window.MLGConfig !== 'undefined') {
          console.log('📋 Shared configuration loaded');
          resolve();
        } else {
          reject(new Error('Shared configuration failed to load'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load shared configuration'));
      document.head.appendChild(script);
    });
  }

  /**
   * Load external dependencies using module loader
   */
  async loadExternalDependencies() {
    if (!window.MLGConfig?.externalDependencies) {
      throw new Error('Shared configuration not available');
    }

    // Ensure we have ModuleLoader
    if (typeof ModuleLoader === 'undefined') {
      await this.loadModuleLoader();
    }

    this.moduleLoader = new ModuleLoader();
    
    // Load external dependencies
    const results = await this.moduleLoader.loadModules(
      window.MLGConfig.externalDependencies
    );

    // Check for critical failures
    const criticalFailures = results.filter(r => 
      !r.success && window.MLGConfig.externalDependencies.find(d => 
        d.name === r.module
      )?.critical
    );

    if (criticalFailures.length > 0) {
      throw new Error(`Critical dependencies failed: ${criticalFailures.map(f => f.module).join(', ')}`);
    }

    console.log('📦 External dependencies loaded:', results);
  }

  /**
   * Load module loader if not available
   */
  loadModuleLoader() {
    return new Promise((resolve, reject) => {
      if (typeof ModuleLoader !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'src/js/module-loader.js';
      script.onload = () => {
        if (typeof ModuleLoader !== 'undefined') {
          resolve();
        } else {
          reject(new Error('ModuleLoader failed to initialize'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load ModuleLoader'));
      document.head.appendChild(script);
    });
  }

  /**
   * Initialize module system
   */
  async initializeModuleSystem() {
    if (!this.moduleLoader) {
      throw new Error('ModuleLoader not available');
    }

    // Add error handlers
    this.moduleLoader.addErrorHandler(({ error, moduleName, src }) => {
      const isDev = window.MLGConfig?.development?.showErrors;
      if (isDev) {
        this.showNotification(`Module error: ${moduleName}`, 'error');
      }
      console.error(`Module error [${moduleName}]:`, error);
    });

    console.log('🔧 Module system initialized');
  }

  /**
   * Initialize SPA router system
   */
  async initializeRouter() {
    if (!this.pageConfig.enableRouter) return;

    try {
      // Load RouterLoader if not available
      if (typeof RouterLoader === 'undefined') {
        await this.loadRouterLoader();
      }

      this.routerLoader = new RouterLoader();
      this.routerLoader.init(this.moduleLoader);
      
      await this.routerLoader.loadRouter();
      console.log('🧭 SPA Router system loaded');

    } catch (error) {
      console.warn('⚠️ Router failed to load, using fallback:', error);
      this.setupFallbackRouter();
    }
  }

  /**
   * Load router loader if not available
   */
  loadRouterLoader() {
    return new Promise((resolve, reject) => {
      if (typeof RouterLoader !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'src/js/router-loader.js';
      script.onload = () => {
        if (typeof RouterLoader !== 'undefined') {
          resolve();
        } else {
          reject(new Error('RouterLoader failed to initialize'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load RouterLoader'));
      document.head.appendChild(script);
    });
  }

  /**
   * Setup fallback router for navigation
   */
  setupFallbackRouter() {
    window.router = {
      push: (path) => {
        // Simple hash-based navigation
        window.location.hash = path.startsWith('/') ? path.slice(1) : path;
      },
      back: () => window.history.back(),
      forward: () => window.history.forward(),
      replace: (path) => window.router.push(path)
    };

    console.log('🔄 Fallback router active');
  }

  /**
   * Initialize page-specific content
   */
  async initializePageContent() {
    // Initialize Lucide icons if available
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    // Initialize any page-specific logic
    if (typeof window.initializePage === 'function') {
      await window.initializePage();
    }

    // Set up global error handling
    this.setupErrorHandling();

    console.log('📄 Page content initialized');
  }

  /**
   * Show loading screen
   */
  showLoadingScreen() {
    const loadingHTML = `
      <div id="page-loader" class="fixed inset-0 bg-gaming-bg z-50 flex items-center justify-center">
        <div class="text-center">
          <div class="pixel-art-container mb-6">
            <div class="pixel-art-loader inline-grid grid-cols-4 gap-1">
              <div class="pixel bg-gaming-accent w-3 h-3 animate-pulse"></div>
              <div class="pixel bg-gaming-blue w-3 h-3 animate-pulse" style="animation-delay: 0.2s"></div>
              <div class="pixel bg-gaming-purple w-3 h-3 animate-pulse" style="animation-delay: 0.4s"></div>
              <div class="pixel bg-gaming-yellow w-3 h-3 animate-pulse" style="animation-delay: 0.6s"></div>
              <div class="pixel bg-gaming-accent w-3 h-3 animate-pulse" style="animation-delay: 0.8s"></div>
              <div class="pixel bg-gaming-blue w-3 h-3 animate-pulse" style="animation-delay: 1.0s"></div>
              <div class="pixel bg-gaming-purple w-3 h-3 animate-pulse" style="animation-delay: 1.2s"></div>
              <div class="pixel bg-gaming-yellow w-3 h-3 animate-pulse" style="animation-delay: 1.4s"></div>
            </div>
          </div>
          
          <div id="loading-title" class="text-gaming-accent font-bold text-2xl mb-4">
            🎮 ${document.title.split(' | ')[0] || 'MLG.clan'}
          </div>
          
          <div id="loading-message" class="text-gray-400 text-sm mb-6">
            Initializing page systems...
          </div>
          
          <div class="loading-progress-container mb-4">
            <div class="w-64 bg-gaming-surface rounded-full h-2">
              <div id="loading-progress" class="bg-gaming-accent rounded-full h-2 transition-all duration-300" style="width: 0%"></div>
            </div>
          </div>
          
          <div class="loading-dots">
            <span class="inline-block animate-ping text-gaming-accent">•</span>
            <span class="inline-block animate-ping text-gaming-blue mx-1" style="animation-delay: 0.2s">•</span>
            <span class="inline-block animate-ping text-gaming-purple" style="animation-delay: 0.4s">•</span>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('afterbegin', loadingHTML);
  }

  /**
   * Update loading message
   */
  updateLoadingMessage(message) {
    const messageEl = document.getElementById('loading-message');
    if (messageEl) {
      messageEl.textContent = message;
    }
  }

  /**
   * Update loading progress
   */
  updateLoadingProgress(percentage) {
    const progressEl = document.getElementById('loading-progress');
    if (progressEl) {
      progressEl.style.width = `${percentage}%`;
    }
  }

  /**
   * Hide loading screen
   */
  hideLoadingScreen() {
    const loader = document.getElementById('page-loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => {
        if (loader.parentNode) {
          loader.parentNode.removeChild(loader);
        }
      }, 300);
    }
  }

  /**
   * Handle loading errors
   */
  handleLoadingError(error) {
    console.error('Page loading error:', error);
    
    // Hide loading screen
    this.hideLoadingScreen();
    
    // Show error message
    const errorHTML = `
      <div class="fixed inset-0 bg-gaming-bg z-50 flex items-center justify-center">
        <div class="bg-gaming-surface rounded-lg p-8 text-center max-w-md">
          <div class="text-gaming-red text-5xl mb-4">⚠️</div>
          <h2 class="text-xl font-bold text-gaming-red mb-2">Page Loading Error</h2>
          <p class="text-gray-400 mb-6">${error.message}</p>
          <div class="space-y-3">
            <button onclick="window.location.reload()" class="w-full bg-gaming-accent hover:bg-green-400 text-black px-6 py-2 rounded-lg font-bold transition-colors">
              Reload Page
            </button>
            <button onclick="window.history.back()" class="w-full bg-gaming-surface hover:bg-gray-700 px-6 py-2 rounded-lg font-medium transition-colors">
              Go Back
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('afterbegin', errorHTML);
    
    // Show notification
    this.showNotification('❌ Failed to load page', 'error');
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // Enhanced error handling with user feedback
    window.addEventListener('error', (event) => {
      console.error('JavaScript error:', event.error);
      
      if (window.MLGConfig?.development?.showErrors) {
        this.showNotification(`Script error: ${event.filename}:${event.lineno}`, 'error');
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      if (window.MLGConfig?.development?.showErrors) {
        this.showNotification(`Promise error: ${event.reason}`, 'error');
      }
      
      event.preventDefault();
    });
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    const container = document.getElementById('notifications-container') || this.createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `notification px-6 py-3 rounded-lg text-white font-medium ${
      type === 'success' ? 'bg-gaming-accent text-black' :
      type === 'error' ? 'bg-gaming-red' :
      type === 'warning' ? 'bg-gaming-yellow text-black' :
      'bg-gaming-blue'
    }`;
    
    notification.textContent = message;
    container.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (container.contains(notification)) {
          container.removeChild(notification);
        }
      }, 300);
    }, 4000);
  }

  /**
   * Create notification container if it doesn't exist
   */
  createNotificationContainer() {
    let container = document.getElementById('notifications-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notifications-container';
      container.style.cssText = 'position: fixed; top: 1rem; right: 1rem; z-index: 1000; pointer-events: none;';
      document.body.appendChild(container);
    }
    return container;
  }

  /**
   * Get loading statistics
   */
  getStats() {
    return {
      isLoading: this.isLoading,
      currentStep: this.currentStep,
      totalSteps: this.loadingSteps.length,
      pageConfig: this.pageConfig,
      moduleLoader: this.moduleLoader?.getStats() || null,
      routerLoader: this.routerLoader?.getStatus() || null
    };
  }
}

// Auto-initialize if enabled
document.addEventListener('DOMContentLoaded', () => {
  if (!window.pageLoader && window.MLGConfig?.features?.enableSPARouter !== false) {
    window.pageLoader = new PageLoader();
    
    if (window.pageLoader.pageConfig.autoInitialize) {
      window.pageLoader.init();
    }
  }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PageLoader;
}

// Global export for browser use
if (typeof window !== 'undefined') {
  window.PageLoader = PageLoader;
}