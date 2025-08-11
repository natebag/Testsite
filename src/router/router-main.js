/**
 * MLG.clan Main Router Integration
 * Complete SPA router system with all modules integrated
 */

// Import all router modules (in browser environment, these would be script tags)
// For now, we'll assume they're available globally

class MLGRouter {
  constructor(options = {}) {
    this.options = {
      mode: 'history', // Use History API instead of hash
      base: '/',
      container: '#router-view',
      fallbackContainer: '#dynamic-content',
      enableTransitions: true,
      enableViewCaching: true,
      enableDeepLinking: true,
      enableSEO: true,
      transitionType: 'gaming',
      loadingType: 'gaming',
      errorBoundary: true,
      ...options
    };

    // Initialize core components
    this.coreRouter = null;
    this.viewManager = null;
    this.transitionManager = null;
    
    // State management
    this.state = {
      initialized: false,
      currentRoute: null,
      isNavigating: false,
      error: null,
      history: []
    };

    // Event listeners
    this.listeners = {
      routeChanged: [],
      navigationStart: [],
      navigationEnd: [],
      error: []
    };

    this.init();
  }

  /**
   * Initialize the complete router system
   */
  async init() {
    try {
      console.log('🧭 Initializing MLG Router System...');
      
      // Initialize core router
      this.initializeCoreRouter();
      
      // Initialize view manager
      this.initializeViewManager();
      
      // Initialize transition manager
      this.initializeTransitionManager();
      
      // Set up route configuration
      await this.setupRoutes();
      
      // Set up error boundaries
      this.setupErrorBoundaries();
      
      // Set up deep linking
      this.setupDeepLinking();
      
      // Set up SEO enhancements
      this.setupSEOEnhancements();
      
      // Set up navigation guards
      this.setupNavigationGuards();
      
      // Mark as initialized
      this.state.initialized = true;
      
      console.log('✅ MLG Router System initialized successfully!');
      
      // Navigate to initial route
      await this.handleInitialNavigation();
      
    } catch (error) {
      console.error('❌ Router initialization failed:', error);
      this.handleInitializationError(error);
    }
  }

  /**
   * Initialize core router
   */
  initializeCoreRouter() {
    if (typeof SPARouter === 'undefined') {
      throw new Error('SPARouter not available. Please include spa-router.js');
    }

    this.coreRouter = new SPARouter({
      mode: this.options.mode,
      base: this.options.base
    });

    // Hook into router events
    this.coreRouter.addHook('beforeRoute', this.onBeforeRoute.bind(this));
    this.coreRouter.addHook('afterRoute', this.onAfterRoute.bind(this));
    this.coreRouter.addHook('routeError', this.onRouteError.bind(this));
  }

  /**
   * Initialize view manager
   */
  initializeViewManager() {
    if (typeof ViewManager === 'undefined') {
      throw new Error('ViewManager not available. Please include view-manager.js');
    }

    this.viewManager = new ViewManager(this.coreRouter);
    
    if (this.options.enableViewCaching) {
      this.viewManager.addHook('mounted', this.onViewMounted.bind(this));
      this.viewManager.addHook('unmounted', this.onViewUnmounted.bind(this));
    }
  }

  /**
   * Initialize transition manager
   */
  initializeTransitionManager() {
    if (typeof TransitionManager === 'undefined') {
      throw new Error('TransitionManager not available. Please include transition-manager.js');
    }

    this.transitionManager = new TransitionManager({
      defaultTransition: this.options.transitionType,
      enableParallax: true,
      enablePreloader: true
    });
  }

  /**
   * Set up route configuration
   */
  async setupRoutes() {
    // Import route configuration
    if (typeof routeConfig === 'undefined') {
      console.warn('Route configuration not found, using fallback routes');
      this.setupFallbackRoutes();
      return;
    }

    // Add all configured routes
    routeConfig.forEach(route => {
      if (route.redirect) {
        // Handle redirects
        this.coreRouter.addRoute(route.path, {
          ...route,
          component: async (context) => {
            await this.push(route.redirect);
            return '';
          }
        });
      } else {
        this.coreRouter.addRoute(route.path, route);
      }
    });

    console.log(`📍 Registered ${routeConfig.length} routes`);
  }

  /**
   * Set up fallback routes if configuration is not available
   */
  setupFallbackRoutes() {
    const fallbackRoutes = [
      {
        path: '/',
        redirect: '/dashboard'
      },
      {
        path: '/dashboard',
        name: 'dashboard',
        component: () => `
          <div class="dashboard-fallback text-center py-20">
            <h2 class="text-2xl font-bold mb-4 text-gaming-accent">🎮 MLG.clan Dashboard</h2>
            <p class="text-gray-400">Router system active - route configuration loading...</p>
          </div>
        `,
        meta: { title: 'Dashboard' }
      },
      {
        path: '*',
        component: () => `
          <div class="not-found-fallback text-center py-20">
            <h2 class="text-2xl font-bold mb-4 text-gaming-red">404 - Page Not Found</h2>
            <p class="text-gray-400 mb-6">The requested page could not be found.</p>
            <button onclick="router.push('/dashboard')" class="bg-gaming-accent text-black px-6 py-2 rounded font-bold">
              Go to Dashboard
            </button>
          </div>
        `,
        meta: { title: 'Page Not Found' }
      }
    ];

    fallbackRoutes.forEach(route => {
      this.coreRouter.addRoute(route.path, route);
    });
  }

  /**
   * Set up error boundaries
   */
  setupErrorBoundaries() {
    if (!this.options.errorBoundary) return;

    // Global error handler
    window.addEventListener('error', this.handleGlobalError.bind(this));
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));

    // Router-specific error handling
    this.coreRouter.addHook('routeError', this.handleRouteError.bind(this));
  }

  /**
   * Set up deep linking support
   */
  setupDeepLinking() {
    if (!this.options.enableDeepLinking) return;

    // Enhance URL structure for better deep linking
    this.coreRouter.addHook('beforeRoute', (context) => {
      // Add state to history for better back/forward navigation
      if (context.to.route.meta?.state) {
        window.history.replaceState({
          ...window.history.state,
          routeState: context.to.route.meta.state
        }, '', context.to.path);
      }
    });

    // Handle external links properly
    document.addEventListener('click', this.handleExternalLinks.bind(this));
  }

  /**
   * Set up SEO enhancements
   */
  setupSEOEnhancements() {
    if (!this.options.enableSEO) return;

    this.coreRouter.addHook('afterRoute', (context) => {
      // Update meta tags
      this.updateMetaTags(context.to.route);
      
      // Update structured data
      this.updateStructuredData(context);
      
      // Handle canonical URLs
      this.updateCanonicalURL(context.to.path);
      
      // Update Open Graph tags
      this.updateOpenGraphTags(context.to.route);
    });
  }

  /**
   * Set up navigation guards
   */
  setupNavigationGuards() {
    // Add global navigation guard for analytics
    this.coreRouter.use(async (context) => {
      // Track page view
      this.trackPageView(context.to.path, context.to.route.name);
      
      // Check if user has required permissions
      if (context.to.route.meta?.requiresAuth && !this.isAuthenticated()) {
        this.showAuthenticationRequired();
        return false;
      }
      
      return true;
    });
  }

  /**
   * Handle initial navigation on app start
   */
  async handleInitialNavigation() {
    const currentPath = this.getCurrentPath();
    
    try {
      await this.push(currentPath, { initial: true });
    } catch (error) {
      console.error('Initial navigation failed:', error);
      // Fallback to dashboard
      await this.push('/dashboard', { initial: true });
    }
  }

  // =============================================================================
  // PUBLIC API METHODS
  // =============================================================================

  /**
   * Navigate to a route
   * @param {string} path - Target path
   * @param {Object} options - Navigation options
   */
  async push(path, options = {}) {
    if (!this.state.initialized) {
      console.warn('Router not initialized yet');
      return false;
    }

    this.state.isNavigating = true;
    this.emit('navigationStart', { path, options });

    try {
      const container = this.getContainer();
      
      if (this.options.enableTransitions && !options.noTransition) {
        this.transitionManager.showLoadingState(container, {
          type: this.options.loadingType,
          message: 'Loading page...'
        });
      }

      const success = await this.coreRouter.push(path, options);
      
      if (success) {
        this.state.currentRoute = this.coreRouter.getCurrentRoute();
        this.updateNavigationHistory(path);
      }

      return success;

    } catch (error) {
      await this.handleNavigationError(error, path);
      return false;
    } finally {
      this.state.isNavigating = false;
      this.emit('navigationEnd', { path, options });
    }
  }

  /**
   * Replace current route
   * @param {string} path - Target path
   * @param {Object} options - Navigation options
   */
  async replace(path, options = {}) {
    return this.push(path, { ...options, replace: true });
  }

  /**
   * Go back in history
   * @param {number} steps - Number of steps to go back
   */
  back(steps = 1) {
    if (this.state.history.length > steps) {
      this.coreRouter.back(steps);
    } else {
      // Fallback to dashboard if no history
      this.push('/dashboard');
    }
  }

  /**
   * Go forward in history
   * @param {number} steps - Number of steps to go forward
   */
  forward(steps = 1) {
    this.coreRouter.forward(steps);
  }

  /**
   * Get current route information
   */
  getCurrentRoute() {
    return this.coreRouter?.getCurrentRoute() || null;
  }

  /**
   * Check if a route exists
   * @param {string} path - Route path
   */
  hasRoute(path) {
    return this.coreRouter?.hasRoute(path) || false;
  }

  /**
   * Generate URL for named route
   * @param {string} name - Route name
   * @param {Object} params - Route parameters
   * @param {Object} query - Query parameters
   */
  generateURL(name, params = {}, query = {}) {
    return this.coreRouter?.generateUrl(name, params, query) || '#';
  }

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  /**
   * Handle before route navigation
   */
  async onBeforeRoute(context) {
    // Show loading state
    if (this.options.enableTransitions) {
      const container = this.getContainer();
      this.transitionManager.showLoadingState(container);
    }

    // Emit navigation start event
    this.emit('navigationStart', context);
  }

  /**
   * Handle after route navigation
   */
  async onAfterRoute(context) {
    // Load view with transitions
    const container = this.getContainer();
    
    try {
      if (this.options.enableViewCaching) {
        await this.viewManager.loadView(context.to.route, context, container);
      } else {
        await this.loadRouteDirectly(context.to.route, context, container);
      }
      
      // Hide loading state
      if (this.options.enableTransitions) {
        this.transitionManager.hideLoadingState();
      }

      // Emit navigation end event
      this.emit('navigationEnd', context);
      
    } catch (error) {
      await this.handleViewLoadError(error, context, container);
    }
  }

  /**
   * Handle route errors
   */
  async onRouteError(error, path) {
    console.error('Route error:', error);
    
    const container = this.getContainer();
    
    // Show error state
    this.transitionManager.showErrorState(container, error);
    
    // Emit error event
    this.emit('error', { error, path, type: 'route' });
  }

  /**
   * Handle view mounted
   */
  onViewMounted(data) {
    console.log('📄 View mounted:', data.viewInstance.route.name);
  }

  /**
   * Handle view unmounted
   */
  onViewUnmounted(data) {
    console.log('📄 View unmounted:', data.viewInstance.route.name);
  }

  // =============================================================================
  // ERROR HANDLING
  // =============================================================================

  /**
   * Handle global JavaScript errors
   */
  handleGlobalError(event) {
    console.error('Global error:', event.error);
    this.emit('error', { error: event.error, type: 'global' });
  }

  /**
   * Handle unhandled promise rejections
   */
  handleUnhandledRejection(event) {
    console.error('Unhandled rejection:', event.reason);
    this.emit('error', { error: event.reason, type: 'promise' });
  }

  /**
   * Handle route-specific errors
   */
  async handleRouteError(error, path) {
    const container = this.getContainer();
    
    // Try to navigate to 404 page
    if (path !== '/404' && this.hasRoute('/404')) {
      await this.replace('/404');
    } else {
      // Show inline error
      this.transitionManager.showErrorState(container, error);
    }
  }

  /**
   * Handle navigation errors
   */
  async handleNavigationError(error, path) {
    console.error('Navigation error:', error);
    
    // Try fallback navigation
    if (path !== '/dashboard') {
      try {
        await this.replace('/dashboard');
        if (window.mlg?.showNotification) {
          window.mlg.showNotification('Navigation failed, redirected to dashboard', 'warning');
        }
      } catch (fallbackError) {
        console.error('Fallback navigation also failed:', fallbackError);
        const container = this.getContainer();
        this.transitionManager.showErrorState(container, error);
      }
    }
  }

  /**
   * Handle view loading errors
   */
  async handleViewLoadError(error, context, container) {
    console.error('View load error:', error);
    
    // Show error state in container
    this.transitionManager.showErrorState(container, error);
    
    // Emit error event
    this.emit('error', { error, context, type: 'view' });
  }

  /**
   * Handle router initialization errors
   */
  handleInitializationError(error) {
    console.error('Router initialization error:', error);
    
    // Show basic error message
    const container = this.getContainer();
    if (container) {
      container.innerHTML = `
        <div class="router-init-error text-center py-20">
          <div class="text-gaming-red text-4xl mb-4">⚠️</div>
          <h2 class="text-xl font-bold text-gaming-red mb-2">Router Initialization Failed</h2>
          <p class="text-gray-400 mb-4">${error.message}</p>
          <button onclick="window.location.reload()" class="bg-gaming-accent text-black px-6 py-2 rounded font-bold">
            Reload Application
          </button>
        </div>
      `;
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Get the router container element
   */
  getContainer() {
    let container = document.querySelector(this.options.container);
    
    if (!container) {
      container = document.querySelector(this.options.fallbackContainer);
    }
    
    if (!container) {
      console.warn('No router container found, creating one...');
      container = document.createElement('div');
      container.id = 'router-view';
      document.body.appendChild(container);
    }
    
    return container;
  }

  /**
   * Get current path from URL
   */
  getCurrentPath() {
    if (this.options.mode === 'history') {
      return window.location.pathname + window.location.search;
    } else {
      return window.location.hash.slice(1) || '/';
    }
  }

  /**
   * Load route directly without view manager
   */
  async loadRouteDirectly(route, context, container) {
    let component = route.component;
    
    if (typeof component === 'function') {
      const html = await component(context);
      
      if (this.options.enableTransitions) {
        await this.transitionManager.executeTransition(container, html, {
          transition: this.options.transitionType
        });
      } else {
        container.innerHTML = html;
      }
    }
    
    // Re-initialize icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  /**
   * Update navigation history
   */
  updateNavigationHistory(path) {
    this.state.history.push({
      path,
      timestamp: Date.now()
    });
    
    // Keep history size manageable
    if (this.state.history.length > 50) {
      this.state.history.shift();
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return window.mlg?.wallet?.connected || false;
  }

  /**
   * Show authentication required message
   */
  showAuthenticationRequired() {
    if (window.mlg?.showNotification) {
      window.mlg.showNotification('Please connect your wallet to access this feature', 'warning');
    }
  }

  /**
   * Track page view for analytics
   */
  trackPageView(path, routeName) {
    // Integration point for analytics
    if (window.gtag) {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: path,
        page_title: routeName
      });
    }
    
    console.log('📊 Page view:', { path, routeName });
  }

  /**
   * Update meta tags for SEO
   */
  updateMetaTags(route) {
    if (route.meta?.title) {
      document.title = `${route.meta.title} - MLG.clan`;
    }
    
    if (route.meta?.description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = route.meta.description;
    }
  }

  /**
   * Update canonical URL
   */
  updateCanonicalURL(path) {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.origin + path;
  }

  /**
   * Update Open Graph tags
   */
  updateOpenGraphTags(route) {
    const ogTags = {
      'og:title': route.meta?.title || 'MLG.clan',
      'og:description': route.meta?.description || 'Complete gaming platform',
      'og:url': window.location.href,
      'og:type': 'website'
    };
    
    Object.entries(ogTags).forEach(([property, content]) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.property = property;
        document.head.appendChild(tag);
      }
      tag.content = content;
    });
  }

  /**
   * Update structured data
   */
  updateStructuredData(context) {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'MLG.clan',
      'url': window.location.href,
      'applicationCategory': 'GameApplication',
      'operatingSystem': 'Web Browser'
    };
    
    let script = document.querySelector('#structured-data');
    if (!script) {
      script = document.createElement('script');
      script.id = 'structured-data';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    
    script.textContent = JSON.stringify(structuredData);
  }

  /**
   * Handle external links
   */
  handleExternalLinks(event) {
    const link = event.target.closest('a[href]');
    if (!link) return;
    
    const href = link.getAttribute('href');
    
    // Check if it's an external link
    if (href.startsWith('http') && !href.includes(window.location.origin)) {
      // Let external links work normally
      return;
    }
    
    // Check if it's a download link
    if (link.hasAttribute('download')) {
      return;
    }
    
    // Check if it's a target="_blank" link
    if (link.target === '_blank') {
      return;
    }
  }

  // =============================================================================
  // EVENT SYSTEM
  // =============================================================================

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  off(event, callback) {
    if (this.listeners[event]) {
      const index = this.listeners[event].indexOf(callback);
      if (index > -1) {
        this.listeners[event].splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Event listener error (${event}):`, error);
        }
      });
    }
  }

  /**
   * Get router statistics
   */
  getStats() {
    return {
      initialized: this.state.initialized,
      currentRoute: this.state.currentRoute,
      isNavigating: this.state.isNavigating,
      historyLength: this.state.history.length,
      viewManagerStats: this.viewManager?.getCacheStats(),
      transitionManagerStats: this.transitionManager?.getPerformanceMetrics()
    };
  }

  /**
   * Destroy the router
   */
  destroy() {
    // Clean up event listeners
    this.listeners = {};
    
    // Clean up managers
    if (this.viewManager) {
      this.viewManager.clearCache();
    }
    
    // Reset state
    this.state = {
      initialized: false,
      currentRoute: null,
      isNavigating: false,
      error: null,
      history: []
    };
    
    console.log('🧭 MLG Router destroyed');
  }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MLGRouter;
}

// Global export for browser use
if (typeof window !== 'undefined') {
  window.MLGRouter = MLGRouter;
}