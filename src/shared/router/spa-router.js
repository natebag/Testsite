/**
 * MLG.clan SPA Router
 * Advanced single-page application router with History API, route guards, and state management
 */

class SPARouter {
  constructor(options = {}) {
    this.routes = new Map();
    this.middlewares = [];
    this.currentRoute = null;
    this.currentParams = {};
    this.currentQuery = {};
    this.history = [];
    this.maxHistoryLength = options.maxHistoryLength || 50;
    
    // Configuration options
    this.options = {
      mode: options.mode || 'history', // 'history' or 'hash'
      base: options.base || '/',
      strictTrailingSlash: options.strictTrailingSlash || false,
      caseInsensitive: options.caseInsensitive || true,
      linkActiveClass: options.linkActiveClass || 'router-link-active',
      linkExactActiveClass: options.linkExactActiveClass || 'router-link-exact-active',
      scrollBehavior: options.scrollBehavior || 'auto',
      ...options
    };

    // State management
    this.state = {
      isNavigating: false,
      error: null,
      meta: {},
      breadcrumbs: []
    };

    // Event listeners and lifecycle hooks
    this.hooks = {
      beforeRoute: [],
      afterRoute: [],
      routeError: []
    };

    // Initialize the router
    this.init();
  }

  /**
   * Initialize the router with event listeners
   */
  init() {
    // Listen to browser navigation events
    window.addEventListener('popstate', this.handlePopState.bind(this));
    
    // Handle initial route
    this.handleInitialRoute();
    
    // Set up link click handling
    this.setupLinkHandling();

    console.log('🧭 SPA Router initialized');
  }

  /**
   * Add a route to the router
   * @param {string} path - Route path with optional parameters
   * @param {Object} config - Route configuration
   */
  addRoute(path, config) {
    const route = {
      path: this.normalizePath(path),
      pattern: this.pathToRegex(path),
      component: config.component,
      name: config.name,
      meta: config.meta || {},
      beforeEnter: config.beforeEnter,
      children: config.children || [],
      redirect: config.redirect,
      alias: config.alias,
      props: config.props || false,
      caseSensitive: config.caseSensitive || false
    };

    this.routes.set(path, route);

    // Handle nested routes
    if (route.children.length > 0) {
      route.children.forEach(child => {
        const childPath = this.joinPaths(path, child.path);
        this.addRoute(childPath, {
          ...child,
          parent: route,
          meta: { ...route.meta, ...child.meta }
        });
      });
    }

    return this;
  }

  /**
   * Add multiple routes
   * @param {Array} routes - Array of route objects
   */
  addRoutes(routes) {
    routes.forEach(route => {
      this.addRoute(route.path, route);
    });
    return this;
  }

  /**
   * Add middleware function
   * @param {Function} middleware - Middleware function
   */
  use(middleware) {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Navigate to a specific path
   * @param {string} path - Target path
   * @param {Object} options - Navigation options
   */
  async push(path, options = {}) {
    return this.navigate(path, { ...options, replace: false });
  }

  /**
   * Replace current route
   * @param {string} path - Target path
   * @param {Object} options - Navigation options
   */
  async replace(path, options = {}) {
    return this.navigate(path, { ...options, replace: true });
  }

  /**
   * Go back in history
   * @param {number} delta - Number of steps to go back
   */
  back(delta = -1) {
    window.history.go(delta);
  }

  /**
   * Go forward in history
   * @param {number} delta - Number of steps to go forward
   */
  forward(delta = 1) {
    window.history.go(delta);
  }

  /**
   * Main navigation function
   * @param {string} path - Target path
   * @param {Object} options - Navigation options
   */
  async navigate(path, options = {}) {
    if (this.state.isNavigating && !options.force) {
      console.warn('Navigation already in progress');
      return false;
    }

    this.state.isNavigating = true;
    this.state.error = null;

    try {
      const normalizedPath = this.normalizePath(path);
      const route = this.matchRoute(normalizedPath);
      
      if (!route) {
        throw new Error(`Route not found: ${path}`);
      }

      // Extract parameters and query
      const params = this.extractParams(route, normalizedPath);
      const query = this.extractQuery(path);

      // Create route context
      const context = {
        to: { path: normalizedPath, params, query, route },
        from: { path: this.currentPath, params: this.currentParams, query: this.currentQuery, route: this.currentRoute },
        router: this,
        options
      };

      // Run beforeRoute hooks
      const canProceed = await this.runBeforeHooks(context);
      if (!canProceed) {
        this.state.isNavigating = false;
        return false;
      }

      // Run middlewares
      const middlewareResult = await this.runMiddlewares(context);
      if (!middlewareResult) {
        this.state.isNavigating = false;
        return false;
      }

      // Update browser history
      if (this.options.mode === 'history') {
        const method = options.replace ? 'replaceState' : 'pushState';
        window.history[method]({ path: normalizedPath }, '', normalizedPath);
      } else {
        window.location.hash = normalizedPath;
      }

      // Update internal state
      this.currentRoute = route;
      this.currentParams = params;
      this.currentQuery = query;
      this.currentPath = normalizedPath;

      // Update history
      this.updateHistory(context);

      // Load and render component
      await this.loadRouteComponent(route, context);

      // Update active links
      this.updateActiveLinks();

      // Run afterRoute hooks
      await this.runAfterHooks(context);

      this.state.isNavigating = false;
      return true;

    } catch (error) {
      this.state.error = error;
      this.state.isNavigating = false;
      await this.handleRouteError(error, path);
      return false;
    }
  }

  /**
   * Match a path against registered routes
   * @param {string} path - Path to match
   * @returns {Object|null} - Matched route or null
   */
  matchRoute(path) {
    for (const [routePath, route] of this.routes) {
      const match = path.match(route.pattern);
      if (match) {
        return { ...route, match };
      }
    }
    return null;
  }

  /**
   * Convert path pattern to regex
   * @param {string} path - Path pattern
   * @returns {RegExp} - Regular expression for matching
   */
  pathToRegex(path) {
    const keys = [];
    let pattern = path
      .replace(/\{([^}]+)\}/g, (match, key) => {
        keys.push(key);
        return '([^/]+)';
      })
      .replace(/\*\*\//g, '(.*?/)')
      .replace(/\*/g, '([^/]*)');

    pattern = '^' + pattern + (this.options.strictTrailingSlash ? '' : '/?') + '$';
    
    const flags = this.options.caseInsensitive ? 'i' : '';
    const regex = new RegExp(pattern, flags);
    regex.keys = keys;
    
    return regex;
  }

  /**
   * Extract parameters from matched route
   * @param {Object} route - Matched route
   * @param {string} path - Current path
   * @returns {Object} - Parameters object
   */
  extractParams(route, path) {
    const match = path.match(route.pattern);
    const params = {};
    
    if (match && route.pattern.keys) {
      route.pattern.keys.forEach((key, index) => {
        params[key] = decodeURIComponent(match[index + 1] || '');
      });
    }
    
    return params;
  }

  /**
   * Extract query parameters from path
   * @param {string} path - Full path with query string
   * @returns {Object} - Query parameters object
   */
  extractQuery(path) {
    const queryIndex = path.indexOf('?');
    if (queryIndex === -1) return {};
    
    const queryString = path.substring(queryIndex + 1);
    const params = new URLSearchParams(queryString);
    const query = {};
    
    for (const [key, value] of params) {
      query[key] = value;
    }
    
    return query;
  }

  /**
   * Load and render route component
   * @param {Object} route - Route configuration
   * @param {Object} context - Route context
   */
  async loadRouteComponent(route, context) {
    const container = document.getElementById('router-view') || document.getElementById('dynamic-content');
    
    if (!container) {
      throw new Error('Router view container not found');
    }

    // Show loading state
    this.showLoadingState(container);

    try {
      let component = route.component;
      
      // Handle lazy-loaded components
      if (typeof component === 'function') {
        component = await component();
      }

      // Handle component as a module
      if (component && typeof component.default === 'function') {
        component = component.default;
      }

      // Render component
      if (typeof component === 'function') {
        const html = await component(context);
        container.innerHTML = html;
      } else if (typeof component === 'string') {
        container.innerHTML = component;
      } else if (component && component.template) {
        container.innerHTML = component.template;
      }

      // Initialize any dynamic content
      this.initializeRouteContent(container, context);

    } catch (error) {
      this.showErrorState(container, error);
      throw error;
    }
  }

  /**
   * Show loading state in container
   * @param {HTMLElement} container - Target container
   */
  showLoadingState(container) {
    container.innerHTML = `
      <div class="router-loading-state flex items-center justify-center py-20">
        <div class="text-center">
          <div class="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <div class="text-gaming-accent">Loading...</div>
        </div>
      </div>
    `;
  }

  /**
   * Show error state in container
   * @param {HTMLElement} container - Target container
   * @param {Error} error - Error object
   */
  showErrorState(container, error) {
    container.innerHTML = `
      <div class="router-error-state bg-gaming-surface rounded-lg p-8 text-center">
        <div class="text-gaming-red text-4xl mb-4">⚠️</div>
        <h2 class="text-xl font-bold text-gaming-red mb-2">Route Error</h2>
        <p class="text-gray-400 mb-4">${error.message}</p>
        <button onclick="window.location.reload()" class="bg-gaming-accent text-black px-4 py-2 rounded hover:bg-green-400 transition-colors">
          Reload Page
        </button>
      </div>
    `;
  }

  /**
   * Initialize dynamic content after route load
   * @param {HTMLElement} container - Container element
   * @param {Object} context - Route context
   */
  initializeRouteContent(container, context) {
    // Re-initialize icons if Lucide is available
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    // Update page title and meta tags
    this.updatePageMeta(context.to.route);

    // Emit route change event
    this.emit('routeChanged', context);

    // Handle scroll behavior
    this.handleScrollBehavior(context);
  }

  /**
   * Update page meta information
   * @param {Object} route - Current route
   */
  updatePageMeta(route) {
    if (route.meta.title) {
      document.title = `${route.meta.title} - MLG.clan`;
    }

    if (route.meta.description) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.content = route.meta.description;
      }
    }
  }

  /**
   * Handle browser back/forward navigation
   * @param {PopStateEvent} event - PopState event
   */
  handlePopState(event) {
    const path = this.options.mode === 'history' 
      ? window.location.pathname 
      : window.location.hash.slice(1) || '/';
    
    this.navigate(path, { replace: true, popstate: true });
  }

  /**
   * Handle initial route on page load
   */
  handleInitialRoute() {
    const initialPath = this.options.mode === 'history' 
      ? window.location.pathname + window.location.search
      : window.location.hash.slice(1) || '/';
    
    this.navigate(initialPath, { replace: true, initial: true });
  }

  /**
   * Set up automatic link handling
   */
  setupLinkHandling() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href]');
      
      if (!link || link.target === '_blank' || link.download) {
        return;
      }

      const href = link.getAttribute('href');
      
      if (href.startsWith('http') || href.startsWith('//')) {
        return;
      }

      if (this.options.mode === 'history' && !href.startsWith('#')) {
        event.preventDefault();
        this.push(href);
      } else if (this.options.mode === 'hash' && href.startsWith('#')) {
        event.preventDefault();
        this.push(href.slice(1));
      }
    });
  }

  /**
   * Update active link classes
   */
  updateActiveLinks() {
    const links = document.querySelectorAll('a[href]');
    
    links.forEach(link => {
      const href = link.getAttribute('href');
      const isActive = this.isLinkActive(href);
      const isExactActive = this.isLinkExactActive(href);
      
      link.classList.toggle(this.options.linkActiveClass, isActive);
      link.classList.toggle(this.options.linkExactActiveClass, isExactActive);
    });
  }

  /**
   * Check if link is active
   * @param {string} href - Link href
   * @returns {boolean} - Is active
   */
  isLinkActive(href) {
    const linkPath = this.normalizePath(href);
    return this.currentPath.startsWith(linkPath);
  }

  /**
   * Check if link is exactly active
   * @param {string} href - Link href
   * @returns {boolean} - Is exactly active
   */
  isLinkExactActive(href) {
    const linkPath = this.normalizePath(href);
    return this.currentPath === linkPath;
  }

  /**
   * Handle scroll behavior
   * @param {Object} context - Route context
   */
  handleScrollBehavior(context) {
    if (context.options.popstate) return;

    switch (this.options.scrollBehavior) {
      case 'top':
        window.scrollTo(0, 0);
        break;
      case 'smooth-top':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'preserve':
        // Do nothing
        break;
      default:
        window.scrollTo(0, 0);
    }
  }

  /**
   * Run before route hooks
   * @param {Object} context - Route context
   * @returns {boolean} - Can proceed
   */
  async runBeforeHooks(context) {
    for (const hook of this.hooks.beforeRoute) {
      const result = await hook(context);
      if (result === false) return false;
    }

    if (context.to.route.beforeEnter) {
      const result = await context.to.route.beforeEnter(context);
      if (result === false) return false;
    }

    return true;
  }

  /**
   * Run after route hooks
   * @param {Object} context - Route context
   */
  async runAfterHooks(context) {
    for (const hook of this.hooks.afterRoute) {
      await hook(context);
    }
  }

  /**
   * Run middlewares
   * @param {Object} context - Route context
   * @returns {boolean} - Can proceed
   */
  async runMiddlewares(context) {
    for (const middleware of this.middlewares) {
      const result = await middleware(context);
      if (result === false) return false;
    }
    return true;
  }

  /**
   * Handle route errors
   * @param {Error} error - Error object
   * @param {string} path - Target path
   */
  async handleRouteError(error, path) {
    console.error('Router error:', error);
    
    for (const hook of this.hooks.routeError) {
      await hook(error, path);
    }

    // Try to navigate to 404 route
    const notFoundRoute = this.routes.get('/404') || this.routes.get('*');
    if (notFoundRoute && path !== '/404') {
      await this.replace('/404');
    }
  }

  /**
   * Add lifecycle hook
   * @param {string} type - Hook type
   * @param {Function} callback - Hook callback
   */
  addHook(type, callback) {
    if (this.hooks[type]) {
      this.hooks[type].push(callback);
    }
  }

  /**
   * Update internal history
   * @param {Object} context - Route context
   */
  updateHistory(context) {
    this.history.push({
      path: context.to.path,
      timestamp: Date.now(),
      params: context.to.params,
      query: context.to.query
    });

    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }
  }

  /**
   * Normalize path
   * @param {string} path - Raw path
   * @returns {string} - Normalized path
   */
  normalizePath(path) {
    if (!path || path === '#') return '/';
    
    // Remove hash prefix
    if (path.startsWith('#')) {
      path = path.slice(1);
    }
    
    // Ensure leading slash
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    
    // Remove trailing slash (except root)
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    
    return path;
  }

  /**
   * Join path segments
   * @param {...string} segments - Path segments
   * @returns {string} - Joined path
   */
  joinPaths(...segments) {
    return '/' + segments
      .map(segment => segment.replace(/^\/+|\/+$/g, ''))
      .filter(Boolean)
      .join('/');
  }

  /**
   * Simple event emitter
   * @param {string} event - Event name
   * @param {...any} args - Arguments
   */
  emit(event, ...args) {
    const listeners = this.listeners?.[event] || [];
    listeners.forEach(listener => listener(...args));
  }

  /**
   * Get current route information
   * @returns {Object} - Current route info
   */
  getCurrentRoute() {
    return {
      path: this.currentPath,
      params: { ...this.currentParams },
      query: { ...this.currentQuery },
      route: this.currentRoute,
      meta: this.currentRoute?.meta || {}
    };
  }

  /**
   * Check if router has a specific route
   * @param {string} path - Route path
   * @returns {boolean} - Has route
   */
  hasRoute(path) {
    return this.routes.has(path) || this.matchRoute(this.normalizePath(path)) !== null;
  }

  /**
   * Generate URL for route
   * @param {string} name - Route name
   * @param {Object} params - Route parameters
   * @param {Object} query - Query parameters
   * @returns {string} - Generated URL
   */
  generateUrl(name, params = {}, query = {}) {
    const route = Array.from(this.routes.values()).find(r => r.name === name);
    if (!route) {
      throw new Error(`Route with name "${name}" not found`);
    }

    let path = route.path;
    
    // Replace parameters
    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`{${key}}`, encodeURIComponent(value));
    }

    // Add query parameters
    const queryString = new URLSearchParams(query).toString();
    if (queryString) {
      path += '?' + queryString;
    }

    return path;
  }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SPARouter;
}

// Global export for browser use
if (typeof window !== 'undefined') {
  window.SPARouter = SPARouter;
}