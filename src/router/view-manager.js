/**
 * MLG.clan View State Manager
 * Manages view state, component lifecycle, and lazy loading for the SPA router
 */

class ViewManager {
  constructor(router) {
    this.router = router;
    this.viewCache = new Map();
    this.componentCache = new Map();
    this.viewStateStack = [];
    this.maxCacheSize = 50;
    this.transitionDuration = 300;
    
    // View lifecycle hooks
    this.hooks = {
      beforeMount: [],
      mounted: [],
      beforeUnmount: [],
      unmounted: [],
      error: []
    };

    // Transition states
    this.transitionState = {
      isTransitioning: false,
      from: null,
      to: null,
      progress: 0
    };

    this.init();
  }

  /**
   * Initialize the view manager
   */
  init() {
    // Set up intersection observer for view visibility tracking
    this.setupViewObserver();
    
    // Set up performance monitoring
    this.setupPerformanceTracking();
    
    console.log('🖼️ View Manager initialized');
  }

  /**
   * Load and render a view component
   * @param {Object} route - Route configuration
   * @param {Object} context - Route context
   * @param {HTMLElement} container - Target container
   */
  async loadView(route, context, container) {
    const viewKey = this.generateViewKey(route, context);
    
    try {
      // Check if view is cached
      let viewInstance = this.viewCache.get(viewKey);
      
      if (!viewInstance || !this.shouldUseCache(route)) {
        viewInstance = await this.createViewInstance(route, context);
        
        // Cache the view if appropriate
        if (this.shouldCacheView(route)) {
          this.cacheView(viewKey, viewInstance);
        }
      } else {
        // Update cached view with new context
        await this.updateViewInstance(viewInstance, context);
      }

      // Render the view with transition
      await this.renderViewWithTransition(viewInstance, container, context);
      
      // Track view state
      this.trackViewState(viewKey, route, context);
      
      return viewInstance;
      
    } catch (error) {
      console.error('View loading error:', error);
      await this.handleViewError(error, route, context, container);
      throw error;
    }
  }

  /**
   * Create a new view instance
   * @param {Object} route - Route configuration
   * @param {Object} context - Route context
   */
  async createViewInstance(route, context) {
    const startTime = performance.now();
    
    // Run before mount hooks
    await this.runHooks('beforeMount', { route, context });
    
    let component = route.component;
    
    // Handle lazy loading
    if (typeof component === 'function') {
      component = await this.loadComponent(component, route.name);
    }

    // Handle different component types
    let html = '';
    if (typeof component === 'string') {
      html = component;
    } else if (typeof component === 'function') {
      html = await component(context);
    } else if (component && component.template) {
      html = await this.processTemplate(component.template, context);
    } else if (component && component.render) {
      html = await component.render(context);
    }

    const viewInstance = {
      id: this.generateViewId(),
      route,
      context,
      html,
      state: {},
      lifecycle: {
        created: Date.now(),
        mounted: null,
        updated: null,
        loadTime: performance.now() - startTime
      },
      cleanup: []
    };

    // Run mounted hooks
    await this.runHooks('mounted', { viewInstance, route, context });
    
    return viewInstance;
  }

  /**
   * Load component with caching and error handling
   * @param {Function} loader - Component loader function
   * @param {string} componentName - Component name for caching
   */
  async loadComponent(loader, componentName) {
    // Check component cache first
    if (this.componentCache.has(componentName)) {
      return this.componentCache.get(componentName);
    }

    try {
      const startTime = performance.now();
      const component = await loader();
      const loadTime = performance.now() - startTime;

      // Log performance
      console.log(`📦 Component '${componentName}' loaded in ${loadTime.toFixed(2)}ms`);
      
      // Cache the component
      this.componentCache.set(componentName, component);
      
      return component;
      
    } catch (error) {
      console.error(`Failed to load component '${componentName}':`, error);
      
      // Return fallback component
      return (context) => `
        <div class="component-error bg-gaming-surface rounded-lg p-6 text-center">
          <div class="text-gaming-red text-2xl mb-4">⚠️</div>
          <h3 class="text-lg font-bold text-gaming-red mb-2">Component Load Error</h3>
          <p class="text-gray-400 mb-4">Failed to load component: ${componentName}</p>
          <button onclick="window.location.reload()" class="bg-gaming-accent text-black px-4 py-2 rounded hover:bg-green-400 transition-colors">
            Reload Page
          </button>
        </div>
      `;
    }
  }

  /**
   * Render view with smooth transitions
   * @param {Object} viewInstance - View instance
   * @param {HTMLElement} container - Target container
   * @param {Object} context - Route context
   */
  async renderViewWithTransition(viewInstance, container, context) {
    if (this.transitionState.isTransitioning) {
      await this.waitForTransition();
    }

    this.transitionState.isTransitioning = true;
    this.transitionState.from = container.innerHTML;
    this.transitionState.to = viewInstance.html;

    try {
      // Apply exit animation to current content
      await this.animateExit(container);
      
      // Update content
      container.innerHTML = viewInstance.html;
      viewInstance.lifecycle.mounted = Date.now();
      
      // Initialize view content
      await this.initializeViewContent(container, viewInstance, context);
      
      // Apply enter animation
      await this.animateEnter(container);
      
      // Mark view as visible
      this.markViewVisible(viewInstance);
      
    } finally {
      this.transitionState.isTransitioning = false;
      this.transitionState.from = null;
      this.transitionState.to = null;
    }
  }

  /**
   * Animate view exit
   * @param {HTMLElement} container - Container element
   */
  async animateExit(container) {
    return new Promise(resolve => {
      container.style.opacity = '1';
      container.style.transform = 'translateX(0)';
      container.style.transition = `all ${this.transitionDuration}ms ease-out`;
      
      // Trigger animation
      requestAnimationFrame(() => {
        container.style.opacity = '0';
        container.style.transform = 'translateX(-20px)';
        
        setTimeout(resolve, this.transitionDuration);
      });
    });
  }

  /**
   * Animate view enter
   * @param {HTMLElement} container - Container element
   */
  async animateEnter(container) {
    return new Promise(resolve => {
      container.style.opacity = '0';
      container.style.transform = 'translateX(20px)';
      container.style.transition = `all ${this.transitionDuration}ms ease-out`;
      
      requestAnimationFrame(() => {
        container.style.opacity = '1';
        container.style.transform = 'translateX(0)';
        
        setTimeout(() => {
          // Reset transition styles
          container.style.transition = '';
          container.style.transform = '';
          resolve();
        }, this.transitionDuration);
      });
    });
  }

  /**
   * Initialize view content after rendering
   * @param {HTMLElement} container - Container element
   * @param {Object} viewInstance - View instance
   * @param {Object} context - Route context
   */
  async initializeViewContent(container, viewInstance, context) {
    // Re-initialize icons if Lucide is available
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    // Set up event listeners
    this.setupViewEventListeners(container, viewInstance);
    
    // Process dynamic content
    this.processDynamicContent(container, context);
    
    // Update meta tags
    this.updatePageMeta(viewInstance.route);
    
    // Emit view ready event
    this.emitViewEvent('viewReady', { viewInstance, container, context });
  }

  /**
   * Set up event listeners for the view
   * @param {HTMLElement} container - Container element
   * @param {Object} viewInstance - View instance
   */
  setupViewEventListeners(container, viewInstance) {
    // Handle click events for router navigation
    const handleClick = (event) => {
      const target = event.target.closest('[data-router-link]');
      if (target) {
        event.preventDefault();
        const path = target.getAttribute('data-router-link');
        this.router.push(path);
      }
    };

    container.addEventListener('click', handleClick);
    
    // Store cleanup function
    viewInstance.cleanup.push(() => {
      container.removeEventListener('click', handleClick);
    });
  }

  /**
   * Process dynamic content within the view
   * @param {HTMLElement} container - Container element
   * @param {Object} context - Route context
   */
  processDynamicContent(container, context) {
    // Process template variables
    const templateElements = container.querySelectorAll('[data-template]');
    templateElements.forEach(element => {
      const template = element.getAttribute('data-template');
      const value = this.resolveTemplate(template, context);
      element.textContent = value;
    });

    // Process conditional rendering
    const conditionalElements = container.querySelectorAll('[data-if]');
    conditionalElements.forEach(element => {
      const condition = element.getAttribute('data-if');
      const shouldShow = this.evaluateCondition(condition, context);
      element.style.display = shouldShow ? '' : 'none';
    });
  }

  /**
   * Update view instance with new context
   * @param {Object} viewInstance - Cached view instance
   * @param {Object} context - New route context
   */
  async updateViewInstance(viewInstance, context) {
    const startTime = performance.now();
    
    // Update context
    viewInstance.context = context;
    viewInstance.lifecycle.updated = Date.now();
    
    // Re-render if component has dynamic content
    if (viewInstance.route.component && typeof viewInstance.route.component === 'function') {
      viewInstance.html = await viewInstance.route.component(context);
    }
    
    const updateTime = performance.now() - startTime;
    console.log(`🔄 View updated in ${updateTime.toFixed(2)}ms`);
  }

  /**
   * Cache a view instance
   * @param {string} viewKey - View cache key
   * @param {Object} viewInstance - View instance to cache
   */
  cacheView(viewKey, viewInstance) {
    // Implement LRU cache logic
    if (this.viewCache.size >= this.maxCacheSize) {
      const firstKey = this.viewCache.keys().next().value;
      const oldInstance = this.viewCache.get(firstKey);
      
      // Run cleanup for old instance
      this.cleanupViewInstance(oldInstance);
      this.viewCache.delete(firstKey);
    }
    
    this.viewCache.set(viewKey, viewInstance);
    console.log(`💾 View cached: ${viewKey}`);
  }

  /**
   * Clean up a view instance
   * @param {Object} viewInstance - View instance to clean up
   */
  async cleanupViewInstance(viewInstance) {
    // Run before unmount hooks
    await this.runHooks('beforeUnmount', { viewInstance });
    
    // Execute cleanup functions
    viewInstance.cleanup.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    });
    
    // Run unmounted hooks
    await this.runHooks('unmounted', { viewInstance });
  }

  /**
   * Track view state in history
   * @param {string} viewKey - View key
   * @param {Object} route - Route configuration
   * @param {Object} context - Route context
   */
  trackViewState(viewKey, route, context) {
    this.viewStateStack.push({
      key: viewKey,
      route: route.name,
      path: context.to.path,
      timestamp: Date.now(),
      params: { ...context.to.params },
      query: { ...context.to.query }
    });

    // Limit stack size
    if (this.viewStateStack.length > 100) {
      this.viewStateStack.shift();
    }
  }

  /**
   * Generate view cache key
   * @param {Object} route - Route configuration
   * @param {Object} context - Route context
   */
  generateViewKey(route, context) {
    const paramString = JSON.stringify(context.to.params);
    const queryString = JSON.stringify(context.to.query);
    return `${route.name}:${paramString}:${queryString}`;
  }

  /**
   * Generate unique view ID
   */
  generateViewId() {
    return `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if view should be cached
   * @param {Object} route - Route configuration
   */
  shouldCacheView(route) {
    return route.meta?.cache !== false && !route.meta?.dynamic;
  }

  /**
   * Check if cached view should be used
   * @param {Object} route - Route configuration
   */
  shouldUseCache(route) {
    return route.meta?.cache !== false;
  }

  /**
   * Handle view loading errors
   * @param {Error} error - Error object
   * @param {Object} route - Route configuration
   * @param {Object} context - Route context
   * @param {HTMLElement} container - Target container
   */
  async handleViewError(error, route, context, container) {
    console.error('View error:', error);
    
    // Run error hooks
    await this.runHooks('error', { error, route, context });
    
    // Show error UI
    container.innerHTML = `
      <div class="view-error bg-gaming-surface rounded-lg p-8 text-center">
        <div class="text-gaming-red text-4xl mb-4">⚠️</div>
        <h2 class="text-xl font-bold text-gaming-red mb-2">View Loading Error</h2>
        <p class="text-gray-400 mb-4">${error.message}</p>
        <div class="space-y-2">
          <button onclick="router.back()" class="bg-gaming-blue hover:bg-blue-600 px-4 py-2 rounded transition-colors">
            Go Back
          </button>
          <button onclick="window.location.reload()" class="bg-gaming-accent text-black px-4 py-2 rounded hover:bg-green-400 transition-colors">
            Reload Page
          </button>
        </div>
      </div>
    `;

    // Re-initialize icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  /**
   * Set up intersection observer for view visibility tracking
   */
  setupViewObserver() {
    this.viewObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.handleViewVisible(entry.target);
          } else {
            this.handleViewHidden(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
  }

  /**
   * Mark view as visible
   * @param {Object} viewInstance - View instance
   */
  markViewVisible(viewInstance) {
    viewInstance.state.visible = true;
    viewInstance.state.lastVisible = Date.now();
    this.emitViewEvent('viewVisible', { viewInstance });
  }

  /**
   * Handle view becoming visible
   * @param {HTMLElement} element - View element
   */
  handleViewVisible(element) {
    element.classList.add('view-visible');
    this.emitViewEvent('elementVisible', { element });
  }

  /**
   * Handle view becoming hidden
   * @param {HTMLElement} element - View element
   */
  handleViewHidden(element) {
    element.classList.remove('view-visible');
    this.emitViewEvent('elementHidden', { element });
  }

  /**
   * Set up performance tracking
   */
  setupPerformanceTracking() {
    // Track view performance metrics
    this.performanceMetrics = {
      totalViews: 0,
      averageLoadTime: 0,
      cacheHitRate: 0,
      errorRate: 0
    };
  }

  /**
   * Process template string with context variables
   * @param {string} template - Template string
   * @param {Object} context - Template context
   */
  async processTemplate(template, context) {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      return this.resolveTemplate(expression.trim(), context);
    });
  }

  /**
   * Resolve template expression
   * @param {string} expression - Template expression
   * @param {Object} context - Template context
   */
  resolveTemplate(expression, context) {
    try {
      // Simple expression resolver
      const func = new Function('context', `with(context) { return ${expression}; }`);
      return func(context);
    } catch (error) {
      console.warn('Template resolution error:', error);
      return '';
    }
  }

  /**
   * Evaluate conditional expression
   * @param {string} condition - Condition expression
   * @param {Object} context - Evaluation context
   */
  evaluateCondition(condition, context) {
    try {
      const func = new Function('context', `with(context) { return !!(${condition}); }`);
      return func(context);
    } catch (error) {
      console.warn('Condition evaluation error:', error);
      return false;
    }
  }

  /**
   * Update page meta information
   * @param {Object} route - Route configuration
   */
  updatePageMeta(route) {
    if (route.meta?.title) {
      document.title = `${route.meta.title} - MLG.clan`;
    }

    if (route.meta?.description) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.content = route.meta.description;
      }
    }

    // Update canonical URL
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.href = window.location.href;
    }
  }

  /**
   * Wait for current transition to complete
   */
  async waitForTransition() {
    return new Promise(resolve => {
      const checkTransition = () => {
        if (!this.transitionState.isTransitioning) {
          resolve();
        } else {
          setTimeout(checkTransition, 50);
        }
      };
      checkTransition();
    });
  }

  /**
   * Run lifecycle hooks
   * @param {string} hookName - Hook name
   * @param {Object} data - Hook data
   */
  async runHooks(hookName, data) {
    const hooks = this.hooks[hookName] || [];
    for (const hook of hooks) {
      try {
        await hook(data);
      } catch (error) {
        console.error(`Hook error (${hookName}):`, error);
      }
    }
  }

  /**
   * Add lifecycle hook
   * @param {string} hookName - Hook name
   * @param {Function} callback - Hook callback
   */
  addHook(hookName, callback) {
    if (this.hooks[hookName]) {
      this.hooks[hookName].push(callback);
    }
  }

  /**
   * Emit view event
   * @param {string} eventName - Event name
   * @param {Object} data - Event data
   */
  emitViewEvent(eventName, data) {
    const event = new CustomEvent(`view:${eventName}`, { detail: data });
    window.dispatchEvent(event);
  }

  /**
   * Clear view cache
   */
  clearCache() {
    this.viewCache.forEach(viewInstance => {
      this.cleanupViewInstance(viewInstance);
    });
    
    this.viewCache.clear();
    this.componentCache.clear();
    
    console.log('🗑️ View cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      viewCacheSize: this.viewCache.size,
      componentCacheSize: this.componentCache.size,
      viewStateStackSize: this.viewStateStack.length,
      performance: this.performanceMetrics
    };
  }

  /**
   * Preload view components
   * @param {Array} routes - Routes to preload
   */
  async preloadViews(routes) {
    const preloadPromises = routes.map(async route => {
      try {
        if (typeof route.component === 'function') {
          await this.loadComponent(route.component, route.name);
        }
      } catch (error) {
        console.warn(`Failed to preload route ${route.name}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
    console.log(`📦 Preloaded ${routes.length} view components`);
  }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ViewManager;
}

// Global export for browser use
if (typeof window !== 'undefined') {
  window.ViewManager = ViewManager;
}