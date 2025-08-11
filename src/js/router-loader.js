/**
 * MLG.clan Router System Loader
 * Handles proper loading of SPA router components with correct dependency order
 */

class RouterLoader {
  constructor() {
    this.moduleLoader = null;
    this.routerComponents = [
      {
        name: 'spa-router',
        src: 'src/router/spa-router.js',
        globalCheck: 'SPARouter',
        critical: true
      },
      {
        name: 'view-manager',
        src: 'src/router/view-manager.js',
        globalCheck: 'ViewManager',
        critical: true
      },
      {
        name: 'transition-manager',
        src: 'src/router/transition-manager.js',
        globalCheck: 'TransitionManager',
        critical: true
      },
      {
        name: 'route-config',
        src: 'src/router/route-config.js',
        globalCheck: () => typeof window.routeConfig !== 'undefined',
        critical: true
      },
      {
        name: 'router-main',
        src: 'src/router/router-main.js',
        globalCheck: () => typeof window.router !== 'undefined',
        critical: true
      }
    ];

    this.isInitialized = false;
    console.log('🧭 Router Loader initialized');
  }

  /**
   * Initialize the router loader with module loader instance
   * @param {ModuleLoader} moduleLoader - Module loader instance
   */
  init(moduleLoader) {
    this.moduleLoader = moduleLoader;
    this._setupDependencies();
    console.log('🧭 Router Loader dependencies configured');
  }

  /**
   * Set up router component dependencies
   */
  _setupDependencies() {
    if (!this.moduleLoader) {
      throw new Error('ModuleLoader instance required');
    }

    // Register dependencies - order matters!
    this.moduleLoader.registerDependencies('spa-router', []);
    this.moduleLoader.registerDependencies('view-manager', ['spa-router']);
    this.moduleLoader.registerDependencies('transition-manager', []);
    this.moduleLoader.registerDependencies('route-config', ['spa-router']);
    this.moduleLoader.registerDependencies('router-main', ['spa-router', 'view-manager', 'transition-manager', 'route-config']);
  }

  /**
   * Load all router components in correct order
   */
  async loadRouter() {
    if (!this.moduleLoader) {
      throw new Error('Router loader not initialized. Call init() first.');
    }

    if (this.isInitialized) {
      console.log('🧭 Router already loaded');
      return;
    }

    try {
      console.log('🧭 Loading router system...');
      
      // Add router-specific error handler
      this.moduleLoader.addErrorHandler(this._handleRouterError.bind(this));

      // Load router components
      const results = await this.moduleLoader.loadModules(this.routerComponents.map(component => ({
        ...component,
        options: {
          globalCheck: component.globalCheck,
          timeout: 15000, // Longer timeout for router components
          async: false // Load synchronously to ensure proper order
        }
      })));

      // Check if all critical components loaded successfully
      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        const criticalFailed = failed.filter(f => 
          this.routerComponents.find(c => c.name === f.module)?.critical
        );
        
        if (criticalFailed.length > 0) {
          throw new Error(`Critical router components failed to load: ${criticalFailed.map(f => f.module).join(', ')}`);
        }
      }

      // Wait for router to fully initialize
      await this._waitForRouterInitialization();

      this.isInitialized = true;
      console.log('✅ Router system loaded successfully');

      // Emit router ready event
      window.dispatchEvent(new CustomEvent('router:ready', {
        detail: { results, timestamp: Date.now() }
      }));

    } catch (error) {
      console.error('❌ Failed to load router system:', error);
      this._showRouterError(error);
      throw error;
    }
  }

  /**
   * Wait for router to be fully initialized
   */
  async _waitForRouterInitialization() {
    const maxAttempts = 50; // 5 seconds max wait
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const checkRouter = () => {
        attempts++;
        
        // Check if main router instance is available and initialized
        if (typeof window.router !== 'undefined' && 
            window.router.routes && 
            window.router.routes.size > 0) {
          resolve();
          return;
        }

        if (attempts >= maxAttempts) {
          reject(new Error('Router initialization timeout'));
          return;
        }

        setTimeout(checkRouter, 100);
      };

      checkRouter();
    });
  }

  /**
   * Handle router-specific loading errors
   * @param {Object} errorInfo - Error information
   */
  _handleRouterError({ error, moduleName, src }) {
    console.error(`🧭 Router module error [${moduleName}]:`, error.message);

    // Attempt to provide fallback functionality
    this._provideFallback(moduleName);
  }

  /**
   * Provide fallback functionality for failed router components
   * @param {string} moduleName - Failed module name
   */
  _provideFallback(moduleName) {
    switch (moduleName) {
      case 'spa-router':
        // Provide basic hash-based routing fallback
        window.SPARouter = class FallbackRouter {
          constructor() {
            console.warn('🧭 Using fallback router - limited functionality');
          }
          push(path) {
            window.location.hash = path;
          }
          back() {
            window.history.back();
          }
        };
        break;

      case 'transition-manager':
        // Provide no-op transition manager
        window.TransitionManager = class FallbackTransitionManager {
          constructor() {
            console.warn('🎬 Using fallback transition manager - no animations');
          }
          async executeTransition(container, content) {
            container.innerHTML = content;
          }
        };
        break;

      case 'view-manager':
        // Provide basic view manager
        window.ViewManager = class FallbackViewManager {
          constructor() {
            console.warn('🖼️ Using fallback view manager - basic functionality');
          }
          async loadView(route, context, container) {
            if (route.component && typeof route.component === 'string') {
              container.innerHTML = route.component;
            }
          }
        };
        break;
    }
  }

  /**
   * Show router error to user
   * @param {Error} error - Error object
   */
  _showRouterError(error) {
    const errorContainer = document.getElementById('dynamic-content') || 
                          document.getElementById('router-view') || 
                          document.body;

    const errorHTML = `
      <div class="router-system-error bg-red-900 border border-red-600 rounded-lg p-6 m-4 text-center">
        <div class="text-red-400 text-4xl mb-4">⚠️</div>
        <h2 class="text-xl font-bold text-red-400 mb-2">Router System Error</h2>
        <p class="text-gray-300 mb-4">Failed to initialize the navigation system</p>
        <p class="text-sm text-gray-400 mb-4">${error.message}</p>
        <div class="space-y-2">
          <button onclick="window.location.reload()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors">
            Reload Page
          </button>
          <div class="text-xs text-gray-500 mt-2">
            Using fallback navigation - some features may be limited
          </div>
        </div>
      </div>
    `;

    // Only show error in main content area, not in small elements
    if (errorContainer === document.body || 
        errorContainer.id === 'dynamic-content' || 
        errorContainer.id === 'router-view') {
      errorContainer.innerHTML = errorHTML;
    }
  }

  /**
   * Check if router is loaded and ready
   */
  isRouterReady() {
    return this.isInitialized && 
           typeof window.router !== 'undefined' &&
           typeof window.router.push === 'function';
  }

  /**
   * Get router loading status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      routerReady: this.isRouterReady(),
      loadedComponents: this.routerComponents.filter(c => 
        this.moduleLoader?.isLoaded(c.name)
      ).map(c => c.name),
      stats: this.moduleLoader?.getStats() || null
    };
  }

  /**
   * Preload router components
   */
  async preloadRouter() {
    if (!this.moduleLoader) {
      throw new Error('Router loader not initialized');
    }

    await this.moduleLoader.preloadModules(this.routerComponents);
    console.log('🚀 Router components preloaded');
  }

  /**
   * Reset router state (for development/testing)
   */
  reset() {
    this.isInitialized = false;
    if (this.moduleLoader) {
      this.moduleLoader.reset();
    }
    
    // Clear router globals
    delete window.router;
    delete window.routeConfig;
    
    console.log('🔄 Router loader reset');
  }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RouterLoader;
}

// Global export for browser use
if (typeof window !== 'undefined') {
  window.RouterLoader = RouterLoader;
}