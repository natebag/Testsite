/**
 * MLG.clan Module Loader
 * Handles proper loading order and error handling for all JavaScript modules
 */

class ModuleLoader {
  constructor() {
    this.loadedModules = new Set();
    this.loadingPromises = new Map();
    this.dependencies = new Map();
    this.errorHandlers = [];
    this.retryAttempts = 3;
    this.retryDelay = 1000;
    
    console.log('📦 Module Loader initialized');
  }

  /**
   * Register module dependencies
   * @param {string} moduleName - Module name
   * @param {Array} deps - Array of dependency module names
   */
  registerDependencies(moduleName, deps = []) {
    this.dependencies.set(moduleName, deps);
  }

  /**
   * Load a JavaScript module with error handling and retries
   * @param {string} src - Script source URL
   * @param {string} moduleName - Module identifier
   * @param {Object} options - Loading options
   */
  async loadModule(src, moduleName, options = {}) {
    // Return existing loading promise if already in progress
    if (this.loadingPromises.has(moduleName)) {
      return this.loadingPromises.get(moduleName);
    }

    // Return immediately if already loaded
    if (this.loadedModules.has(moduleName)) {
      return Promise.resolve();
    }

    // Create loading promise
    const loadingPromise = this._loadModuleWithRetry(src, moduleName, options);
    this.loadingPromises.set(moduleName, loadingPromise);

    try {
      await loadingPromise;
      this.loadedModules.add(moduleName);
      this.loadingPromises.delete(moduleName);
      console.log(`✅ Module loaded: ${moduleName}`);
    } catch (error) {
      this.loadingPromises.delete(moduleName);
      this._handleModuleError(error, moduleName, src);
      throw error;
    }

    return loadingPromise;
  }

  /**
   * Load module with retry logic
   * @param {string} src - Script source URL
   * @param {string} moduleName - Module identifier
   * @param {Object} options - Loading options
   * @param {number} attempt - Current attempt number
   */
  async _loadModuleWithRetry(src, moduleName, options = {}, attempt = 1) {
    try {
      return await this._loadScript(src, moduleName, options);
    } catch (error) {
      if (attempt < this.retryAttempts) {
        console.warn(`⚠️ Module load failed (attempt ${attempt}/${this.retryAttempts}): ${moduleName}`, error.message);
        await this._delay(this.retryDelay * attempt);
        return this._loadModuleWithRetry(src, moduleName, options, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Load script element with promise
   * @param {string} src - Script source URL
   * @param {string} moduleName - Module identifier
   * @param {Object} options - Loading options
   */
  _loadScript(src, moduleName, options = {}) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      
      // Configure script element
      script.src = src;
      script.type = options.type || 'text/javascript';
      script.async = options.async !== false;
      script.defer = options.defer || false;
      
      if (options.crossOrigin) {
        script.crossOrigin = options.crossOrigin;
      }
      
      if (options.integrity) {
        script.integrity = options.integrity;
      }

      // Set up event handlers
      script.onload = () => {
        this._verifyModuleLoaded(moduleName, options.globalCheck)
          .then(resolve)
          .catch(reject);
      };

      script.onerror = () => {
        reject(new Error(`Failed to load script: ${src}`));
      };

      script.onabort = () => {
        reject(new Error(`Script loading aborted: ${src}`));
      };

      // Add timeout handling
      const timeout = options.timeout || 10000;
      const timeoutId = setTimeout(() => {
        script.onload = null;
        script.onerror = null;
        reject(new Error(`Script loading timeout: ${src}`));
      }, timeout);

      script.onload = ((originalOnload) => {
        return () => {
          clearTimeout(timeoutId);
          originalOnload();
        };
      })(script.onload);

      script.onerror = ((originalOnerror) => {
        return () => {
          clearTimeout(timeoutId);
          originalOnerror();
        };
      })(script.onerror);

      // Append to head
      document.head.appendChild(script);
    });
  }

  /**
   * Verify that module was loaded correctly
   * @param {string} moduleName - Module name
   * @param {string|Function} globalCheck - Global variable name or check function
   */
  async _verifyModuleLoaded(moduleName, globalCheck) {
    if (!globalCheck) return;

    // Wait a bit for module to initialize
    await this._delay(100);

    if (typeof globalCheck === 'string') {
      if (typeof window[globalCheck] === 'undefined') {
        throw new Error(`Module ${moduleName} did not expose global: ${globalCheck}`);
      }
    } else if (typeof globalCheck === 'function') {
      const isLoaded = await globalCheck();
      if (!isLoaded) {
        throw new Error(`Module ${moduleName} failed verification check`);
      }
    }
  }

  /**
   * Load multiple modules with dependency resolution
   * @param {Array} moduleConfigs - Array of module configurations
   */
  async loadModules(moduleConfigs) {
    const loadOrder = this._resolveDependencyOrder(moduleConfigs);
    const results = [];

    for (const config of loadOrder) {
      try {
        await this.loadModule(config.src, config.name, config.options || {});
        results.push({ success: true, module: config.name });
      } catch (error) {
        results.push({ success: false, module: config.name, error: error.message });
        
        // Stop loading if this is a critical dependency
        if (config.critical) {
          throw new Error(`Critical module failed to load: ${config.name}`);
        }
      }
    }

    return results;
  }

  /**
   * Resolve dependency loading order
   * @param {Array} moduleConfigs - Module configurations
   */
  _resolveDependencyOrder(moduleConfigs) {
    const visited = new Set();
    const visiting = new Set();
    const sorted = [];
    const moduleMap = new Map(moduleConfigs.map(config => [config.name, config]));

    const visit = (moduleName) => {
      if (visited.has(moduleName)) return;
      if (visiting.has(moduleName)) {
        throw new Error(`Circular dependency detected: ${moduleName}`);
      }

      visiting.add(moduleName);
      
      const deps = this.dependencies.get(moduleName) || [];
      for (const dep of deps) {
        visit(dep);
      }

      visiting.delete(moduleName);
      visited.add(moduleName);
      
      const module = moduleMap.get(moduleName);
      if (module) {
        sorted.push(module);
      }
    };

    // Visit all modules
    for (const config of moduleConfigs) {
      visit(config.name);
    }

    return sorted;
  }

  /**
   * Handle module loading errors
   * @param {Error} error - Error object
   * @param {string} moduleName - Module name
   * @param {string} src - Script source
   */
  _handleModuleError(error, moduleName, src) {
    console.error(`❌ Failed to load module: ${moduleName}`, error);
    
    // Run registered error handlers
    this.errorHandlers.forEach(handler => {
      try {
        handler({ error, moduleName, src });
      } catch (handlerError) {
        console.error('Error in module error handler:', handlerError);
      }
    });

    // Show user-friendly error if in development
    if (this._isDevelopment()) {
      this._showDevelopmentError(error, moduleName);
    }
  }

  /**
   * Add error handler
   * @param {Function} handler - Error handler function
   */
  addErrorHandler(handler) {
    this.errorHandlers.push(handler);
  }

  /**
   * Check if in development mode
   */
  _isDevelopment() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  }

  /**
   * Show development error notification
   * @param {Error} error - Error object
   * @param {string} moduleName - Module name
   */
  _showDevelopmentError(error, moduleName) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc2626;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 14px;
      max-width: 400px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    errorDiv.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 4px;">Module Load Error</div>
      <div>Module: ${moduleName}</div>
      <div style="margin-top: 8px; font-size: 12px; opacity: 0.9;">${error.message}</div>
      <button onclick="this.parentElement.remove()" style="
        position: absolute;
        top: 4px;
        right: 8px;
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 16px;
      ">×</button>
    `;

    document.body.appendChild(errorDiv);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (errorDiv.parentElement) {
        errorDiv.remove();
      }
    }, 10000);
  }

  /**
   * Utility delay function
   * @param {number} ms - Milliseconds to delay
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if module is loaded
   * @param {string} moduleName - Module name
   */
  isLoaded(moduleName) {
    return this.loadedModules.has(moduleName);
  }

  /**
   * Get loading statistics
   */
  getStats() {
    return {
      loadedModules: Array.from(this.loadedModules),
      loadingInProgress: Array.from(this.loadingPromises.keys()),
      totalLoaded: this.loadedModules.size,
      dependencies: Object.fromEntries(this.dependencies)
    };
  }

  /**
   * Preload modules without executing
   * @param {Array} moduleConfigs - Module configurations
   */
  async preloadModules(moduleConfigs) {
    const preloadPromises = moduleConfigs.map(async (config) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'script';
      link.href = config.src;
      link.crossOrigin = config.options?.crossOrigin || 'anonymous';
      document.head.appendChild(link);
    });

    await Promise.allSettled(preloadPromises);
    console.log(`🚀 Preloaded ${moduleConfigs.length} modules`);
  }

  /**
   * Clear all loaded modules (for testing)
   */
  reset() {
    this.loadedModules.clear();
    this.loadingPromises.clear();
    console.log('🔄 Module loader reset');
  }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModuleLoader;
}

// Global export for browser use
if (typeof window !== 'undefined') {
  window.ModuleLoader = ModuleLoader;
}