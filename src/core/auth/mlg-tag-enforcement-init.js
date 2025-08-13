/**
 * MLG Tag Enforcement System Initialization
 * 
 * Central initialization and coordination system for MLG tag validation and
 * enforcement across the entire MLG.clan platform. Integrates all enforcement
 * components and ensures seamless operation.
 * 
 * Features:
 * - Automatic system initialization and integration
 * - Platform-wide enforcement coordination
 * - Real-time monitoring and reporting
 * - Error handling and fallback mechanisms
 * - Performance optimization and monitoring
 * - Mobile and responsive optimization
 * - Comprehensive testing integration
 * - Analytics and metrics collection
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 * @created 2025-08-13
 * @task Task 21.5 - Implement [MLG] tag validation and enforcement across platform
 */

import { MLGTagEnforcementSystem } from './mlg-tag-enforcement-system.js';
import { MLGPlatformTagIntegration } from './mlg-platform-tag-integration.js';
import { MLGTagEnforcementTestSuite } from './mlg-tag-enforcement-test-suite.js';
import { MLGTaggingValidator } from './mlg-tagging-validation.js';

/**
 * Initialization Configuration
 */
const INIT_CONFIG = {
  // Initialization Modes
  MODES: {
    PRODUCTION: 'production',
    DEVELOPMENT: 'development',
    TESTING: 'testing',
    DEBUG: 'debug'
  },
  
  // Feature Flags
  FEATURES: {
    ENFORCEMENT: true,
    VALIDATION: true,
    MONITORING: true,
    TESTING: false,
    ANALYTICS: true,
    DEBUGGING: false
  },
  
  // Performance Settings
  PERFORMANCE: {
    LAZY_LOADING: true,
    BATCH_PROCESSING: true,
    CACHE_ENABLED: true,
    ASYNC_INIT: true
  },
  
  // Error Handling
  ERROR_HANDLING: {
    CONTINUE_ON_ERROR: true,
    LOG_ERRORS: true,
    REPORT_ERRORS: true,
    FALLBACK_MODE: true
  },
  
  // Monitoring Settings
  MONITORING: {
    ENABLED: true,
    INTERVAL: 60000,        // 1 minute
    METRICS_RETENTION: 24,  // 24 hours
    ALERT_THRESHOLD: 10     // violations per hour
  }
};

/**
 * MLG Tag Enforcement Initialization Manager
 */
class MLGTagEnforcementInit {
  constructor(options = {}) {
    this.config = { ...INIT_CONFIG, ...options };
    this.mode = this.config.mode || this.config.MODES.PRODUCTION;
    this.logger = options.logger || console;
    
    // System instances
    this.enforcementSystem = null;
    this.platformIntegration = null;
    this.testSuite = null;
    this.validator = null;
    
    // Initialization state
    this.isInitialized = false;
    this.initializationStep = 'pending';
    this.errors = [];
    this.warnings = [];
    
    // Performance tracking
    this.initStartTime = null;
    this.metrics = {
      initializationTime: 0,
      systemsLoaded: 0,
      errorsOccurred: 0,
      warningsIssued: 0
    };
    
    // Feature detection
    this.browserCapabilities = this.detectBrowserCapabilities();
    this.platformFeatures = this.detectPlatformFeatures();
    
    this.logger.info('🚀 MLG Tag Enforcement Initialization Manager created');
  }

  /**
   * Initialize complete enforcement system
   * @param {Object} platformSystems - Platform system references
   * @returns {Promise<Object>} Initialization result
   */
  async initialize(platformSystems = {}) {
    try {
      if (this.isInitialized) {
        this.logger.warn('⚠️ Enforcement system already initialized');
        return this.getInitializationResult();
      }
      
      this.initStartTime = Date.now();
      this.logger.info('🚀 Starting MLG tag enforcement system initialization...');
      
      // Step 1: Environment check
      this.initializationStep = 'environment_check';
      await this.performEnvironmentCheck();
      
      // Step 2: Initialize core systems
      this.initializationStep = 'core_systems';
      await this.initializeCoreSystems(platformSystems);
      
      // Step 3: Setup platform integration
      this.initializationStep = 'platform_integration';
      await this.setupPlatformIntegration(platformSystems);
      
      // Step 4: Initialize monitoring
      this.initializationStep = 'monitoring';
      await this.initializeMonitoring();
      
      // Step 5: Run validation tests (if enabled)
      this.initializationStep = 'validation';
      await this.runInitialValidation();
      
      // Step 6: Setup event handling
      this.initializationStep = 'event_handling';
      this.setupEventHandling();
      
      // Step 7: Final system check
      this.initializationStep = 'final_check';
      await this.performFinalCheck();
      
      this.isInitialized = true;
      this.initializationStep = 'complete';
      this.metrics.initializationTime = Date.now() - this.initStartTime;
      
      const result = this.getInitializationResult();
      
      this.logger.info(`✅ MLG tag enforcement system initialized successfully in ${this.metrics.initializationTime}ms`);
      this.emitInitializationComplete(result);
      
      return result;
      
    } catch (error) {
      this.handleInitializationError(error);
      throw error;
    }
  }

  /**
   * Perform environment compatibility check
   */
  async performEnvironmentCheck() {
    this.logger.debug('🔍 Performing environment check...');
    
    // Check browser support
    if (!this.browserCapabilities.supported) {
      const warning = 'Browser may have limited support for some features';
      this.warnings.push(warning);
      this.logger.warn(`⚠️ ${warning}`);
    }
    
    // Check required APIs
    const requiredAPIs = ['MutationObserver', 'Promise', 'Map', 'Set'];
    const missingAPIs = requiredAPIs.filter(api => !(api in window));
    
    if (missingAPIs.length > 0) {
      const error = `Missing required APIs: ${missingAPIs.join(', ')}`;
      this.errors.push(error);
      throw new Error(error);
    }
    
    // Check DOM readiness
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }
    
    this.logger.debug('✅ Environment check passed');
  }

  /**
   * Initialize core enforcement systems
   * @param {Object} platformSystems - Platform system references
   */
  async initializeCoreSystems(platformSystems) {
    this.logger.debug('🔧 Initializing core systems...');
    
    try {
      // Initialize enforcement system
      this.enforcementSystem = new MLGTagEnforcementSystem({
        mode: this.mode === this.config.MODES.PRODUCTION ? 'corrective' : 'strict',
        logger: this.logger,
        ...this.config.ENFORCEMENT_CONFIG
      });
      
      await this.enforcementSystem.initialize(platformSystems);
      this.metrics.systemsLoaded++;
      
      // Initialize validator
      this.validator = new MLGTaggingValidator();
      this.metrics.systemsLoaded++;
      
      // Initialize test suite (if in development/testing mode)
      if (this.config.FEATURES.TESTING || this.mode === this.config.MODES.TESTING) {
        this.testSuite = new MLGTagEnforcementTestSuite({
          logger: this.logger
        });
        this.metrics.systemsLoaded++;
      }
      
      this.logger.debug('✅ Core systems initialized');
      
    } catch (error) {
      this.errors.push(`Core system initialization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Setup platform integration
   * @param {Object} platformSystems - Platform system references
   */
  async setupPlatformIntegration(platformSystems) {
    this.logger.debug('🔗 Setting up platform integration...');
    
    try {
      this.platformIntegration = new MLGPlatformTagIntegration({
        logger: this.logger,
        enforcementSystem: this.enforcementSystem,
        ...this.config.INTEGRATION_CONFIG
      });
      
      await this.platformIntegration.initialize(platformSystems);
      this.metrics.systemsLoaded++;
      
      this.logger.debug('✅ Platform integration setup complete');
      
    } catch (error) {
      this.errors.push(`Platform integration setup failed: ${error.message}`);
      
      if (this.config.ERROR_HANDLING.CONTINUE_ON_ERROR) {
        this.logger.warn(`⚠️ Platform integration failed, continuing without integration: ${error.message}`);
        this.warnings.push('Platform integration not available');
      } else {
        throw error;
      }
    }
  }

  /**
   * Initialize monitoring and metrics
   */
  async initializeMonitoring() {
    if (!this.config.FEATURES.MONITORING) {
      this.logger.debug('📊 Monitoring disabled, skipping...');
      return;
    }
    
    this.logger.debug('📊 Initializing monitoring...');
    
    try {
      // Setup performance monitoring
      this.setupPerformanceMonitoring();
      
      // Setup violation monitoring
      this.setupViolationMonitoring();
      
      // Setup system health monitoring
      this.setupHealthMonitoring();
      
      this.logger.debug('✅ Monitoring initialized');
      
    } catch (error) {
      this.warnings.push(`Monitoring initialization failed: ${error.message}`);
      this.logger.warn(`⚠️ Monitoring initialization failed: ${error.message}`);
    }
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    if (!this.enforcementSystem) return;
    
    this.enforcementSystem.on('performance_metrics', (metrics) => {
      this.handlePerformanceMetrics(metrics);
    });
    
    if (this.platformIntegration) {
      this.platformIntegration.on('performance_metrics', (metrics) => {
        this.handlePerformanceMetrics(metrics);
      });
    }
  }

  /**
   * Setup violation monitoring
   */
  setupViolationMonitoring() {
    if (!this.enforcementSystem) return;
    
    this.enforcementSystem.on('tag_violation', (violation) => {
      this.handleViolation(violation);
    });
    
    this.enforcementSystem.on('violation_threshold_exceeded', (data) => {
      this.handleViolationThresholdExceeded(data);
    });
  }

  /**
   * Setup system health monitoring
   */
  setupHealthMonitoring() {
    setInterval(() => {
      this.performHealthCheck();
    }, this.config.MONITORING.INTERVAL);
  }

  /**
   * Run initial validation tests
   */
  async runInitialValidation() {
    if (!this.config.FEATURES.VALIDATION) {
      this.logger.debug('✅ Validation disabled, skipping...');
      return;
    }
    
    this.logger.debug('🔍 Running initial validation...');
    
    try {
      // Quick validation check
      const quickResult = await this.performQuickValidation();
      
      if (!quickResult.success) {
        this.warnings.push(`Initial validation warnings: ${quickResult.warnings.length} issues found`);
      }
      
      // Full test suite (if in testing mode)
      if (this.testSuite && this.mode === this.config.MODES.TESTING) {
        const testResult = await this.testSuite.runCompleteTestSuite({
          enforcementSystem: this.enforcementSystem,
          platformIntegration: this.platformIntegration
        });
        
        if (testResult.summary.failedTests > 0) {
          this.warnings.push(`Test suite found ${testResult.summary.failedTests} failing tests`);
        }
      }
      
      this.logger.debug('✅ Initial validation complete');
      
    } catch (error) {
      this.warnings.push(`Initial validation failed: ${error.message}`);
      this.logger.warn(`⚠️ Initial validation failed: ${error.message}`);
    }
  }

  /**
   * Perform quick validation
   * @returns {Promise<Object>} Validation result
   */
  async performQuickValidation() {
    const mockTaggingService = {
      tagUsername: (username) => `[MLG] ${username}`,
      validateUsername: (username) => {
        if (!username || username.length < 3) throw new Error('Invalid username');
        return true;
      },
      getStatistics: () => ({ taggedUsernamesCached: 0 })
    };
    
    const mockDisplayUtility = {
      createUsernameElement: (username, displayName) => {
        const element = document.createElement('span');
        element.textContent = displayName;
        element.classList.add('mlg-username');
        return element;
      }
    };
    
    return await this.validator.validateComplete(mockTaggingService, mockDisplayUtility);
  }

  /**
   * Setup event handling
   */
  setupEventHandling() {
    this.logger.debug('📡 Setting up event handling...');
    
    // Window events
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
    
    // Document events
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseNonEssentialOperations();
      } else {
        this.resumeOperations();
      }
    });
    
    this.logger.debug('✅ Event handling setup complete');
  }

  /**
   * Perform final system check
   */
  async performFinalCheck() {
    this.logger.debug('🔍 Performing final system check...');
    
    const checks = [
      this.checkEnforcementSystem(),
      this.checkPlatformIntegration(),
      this.checkMonitoring()
    ];
    
    const results = await Promise.all(checks);
    const failedChecks = results.filter(r => !r.success);
    
    if (failedChecks.length > 0) {
      this.warnings.push(`${failedChecks.length} system checks failed`);
      failedChecks.forEach(check => {
        this.logger.warn(`⚠️ System check failed: ${check.name} - ${check.error}`);
      });
    }
    
    this.logger.debug('✅ Final system check complete');
  }

  /**
   * Check enforcement system
   * @returns {Object} Check result
   */
  checkEnforcementSystem() {
    try {
      if (!this.enforcementSystem || !this.enforcementSystem.isInitialized) {
        return { success: false, name: 'Enforcement System', error: 'Not initialized' };
      }
      
      // Test basic functionality
      const testResult = this.enforcementSystem.enforceTag('TestUser', 'test_user_123');
      
      if (!testResult || typeof testResult.success === 'undefined') {
        return { success: false, name: 'Enforcement System', error: 'Invalid response' };
      }
      
      return { success: true, name: 'Enforcement System' };
    } catch (error) {
      return { success: false, name: 'Enforcement System', error: error.message };
    }
  }

  /**
   * Check platform integration
   * @returns {Object} Check result
   */
  checkPlatformIntegration() {
    try {
      if (!this.platformIntegration) {
        return { success: false, name: 'Platform Integration', error: 'Not available' };
      }
      
      if (!this.platformIntegration.isInitialized) {
        return { success: false, name: 'Platform Integration', error: 'Not initialized' };
      }
      
      const stats = this.platformIntegration.getStatistics();
      
      if (!stats || typeof stats.isInitialized === 'undefined') {
        return { success: false, name: 'Platform Integration', error: 'Invalid statistics' };
      }
      
      return { success: true, name: 'Platform Integration' };
    } catch (error) {
      return { success: false, name: 'Platform Integration', error: error.message };
    }
  }

  /**
   * Check monitoring
   * @returns {Object} Check result
   */
  checkMonitoring() {
    try {
      if (!this.config.FEATURES.MONITORING) {
        return { success: true, name: 'Monitoring', note: 'Disabled' };
      }
      
      // Basic monitoring check - verify metrics are being collected
      const hasMetrics = this.enforcementSystem && 
                        typeof this.enforcementSystem.getStatistics === 'function';
      
      if (!hasMetrics) {
        return { success: false, name: 'Monitoring', error: 'Metrics not available' };
      }
      
      return { success: true, name: 'Monitoring' };
    } catch (error) {
      return { success: false, name: 'Monitoring', error: error.message };
    }
  }

  /**
   * Handle performance metrics
   * @param {Object} metrics - Performance metrics
   */
  handlePerformanceMetrics(metrics) {
    if (this.config.FEATURES.ANALYTICS) {
      // Store metrics for analytics
      this.storeMetrics('performance', metrics);
    }
    
    // Check for performance issues
    if (metrics.averageProcessingTime > 100) {
      this.logger.warn('⚠️ High processing time detected:', metrics.averageProcessingTime);
    }
  }

  /**
   * Handle violation
   * @param {Object} violation - Violation data
   */
  handleViolation(violation) {
    if (this.config.FEATURES.ANALYTICS) {
      this.storeMetrics('violation', violation);
    }
    
    this.logger.warn(`🚨 Tag violation detected: ${violation.violationType} by ${violation.userId}`);
  }

  /**
   * Handle violation threshold exceeded
   * @param {Object} data - Threshold data
   */
  handleViolationThresholdExceeded(data) {
    this.logger.error(`🚨 Violation threshold exceeded: ${data.count} violations`);
    
    // Emit alert event
    this.emitAlert('violation_threshold_exceeded', data);
  }

  /**
   * Perform health check
   */
  performHealthCheck() {
    const health = {
      timestamp: new Date(),
      enforcementSystem: this.enforcementSystem ? this.enforcementSystem.getStatistics() : null,
      platformIntegration: this.platformIntegration ? this.platformIntegration.getStatistics() : null,
      memory: this.getMemoryUsage(),
      errors: this.errors.length,
      warnings: this.warnings.length
    };
    
    this.storeMetrics('health', health);
    
    // Check for issues
    if (health.memory.used > 50 * 1024 * 1024) { // 50MB
      this.logger.warn('⚠️ High memory usage detected');
    }
  }

  /**
   * Store metrics
   * @param {string} type - Metric type
   * @param {Object} data - Metric data
   */
  storeMetrics(type, data) {
    // Simple in-memory storage - in production, this would send to analytics service
    const key = `mlg_enforcement_${type}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    
    existing.push({
      ...data,
      timestamp: new Date()
    });
    
    // Keep only recent data
    const cutoff = Date.now() - (this.config.MONITORING.METRICS_RETENTION * 60 * 60 * 1000);
    const filtered = existing.filter(item => new Date(item.timestamp).getTime() > cutoff);
    
    localStorage.setItem(key, JSON.stringify(filtered));
  }

  /**
   * Detect browser capabilities
   * @returns {Object} Browser capabilities
   */
  detectBrowserCapabilities() {
    return {
      supported: true,
      mutationObserver: 'MutationObserver' in window,
      promises: 'Promise' in window,
      es6: 'Map' in window && 'Set' in window,
      performance: 'performance' in window,
      localStorage: 'localStorage' in window,
      mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    };
  }

  /**
   * Detect platform features
   * @returns {Object} Platform features
   */
  detectPlatformFeatures() {
    return {
      hasVotingSystem: !!document.querySelector('.voting-interface'),
      hasClanSystem: !!document.querySelector('.clan-roster'),
      hasUserProfiles: !!document.querySelector('.user-profile'),
      hasTournaments: !!document.querySelector('.tournament-bracket'),
      hasWalletIntegration: !!document.querySelector('.wallet-connection')
    };
  }

  /**
   * Get memory usage
   * @returns {Object} Memory usage information
   */
  getMemoryUsage() {
    if (window.performance?.memory) {
      return {
        used: window.performance.memory.usedJSHeapSize,
        total: window.performance.memory.totalJSHeapSize,
        limit: window.performance.memory.jsHeapSizeLimit
      };
    }
    return { used: 0, total: 0, limit: 0 };
  }

  /**
   * Pause non-essential operations
   */
  pauseNonEssentialOperations() {
    this.logger.debug('⏸️ Pausing non-essential operations...');
    
    if (this.platformIntegration) {
      // Reduce monitoring frequency when page is hidden
      this.platformIntegration.optimizeForBackground();
    }
  }

  /**
   * Resume operations
   */
  resumeOperations() {
    this.logger.debug('▶️ Resuming operations...');
    
    if (this.platformIntegration) {
      this.platformIntegration.resumeNormalOperation();
    }
  }

  /**
   * Handle initialization error
   * @param {Error} error - Initialization error
   */
  handleInitializationError(error) {
    this.errors.push(`Initialization failed at step ${this.initializationStep}: ${error.message}`);
    this.metrics.errorsOccurred++;
    
    this.logger.error(`❌ Initialization failed at step ${this.initializationStep}:`, error);
    
    if (this.config.ERROR_HANDLING.FALLBACK_MODE) {
      this.logger.warn('⚠️ Entering fallback mode...');
      this.initializeFallbackMode();
    }
  }

  /**
   * Initialize fallback mode
   */
  initializeFallbackMode() {
    // Basic enforcement without advanced features
    try {
      this.enforcementSystem = new MLGTagEnforcementSystem({
        mode: 'permissive',
        logger: this.logger
      });
      
      this.logger.info('✅ Fallback mode initialized');
    } catch (error) {
      this.logger.error('❌ Fallback mode initialization failed:', error);
    }
  }

  /**
   * Get initialization result
   * @returns {Object} Initialization result
   */
  getInitializationResult() {
    return {
      success: this.isInitialized && this.errors.length === 0,
      initialized: this.isInitialized,
      step: this.initializationStep,
      metrics: this.metrics,
      errors: this.errors,
      warnings: this.warnings,
      capabilities: this.browserCapabilities,
      features: this.platformFeatures,
      systems: {
        enforcementSystem: !!this.enforcementSystem,
        platformIntegration: !!this.platformIntegration,
        testSuite: !!this.testSuite,
        validator: !!this.validator
      }
    };
  }

  /**
   * Emit initialization complete event
   * @param {Object} result - Initialization result
   */
  emitInitializationComplete(result) {
    const event = new CustomEvent('mlg-enforcement-initialized', {
      detail: result
    });
    
    document.dispatchEvent(event);
  }

  /**
   * Emit alert event
   * @param {string} type - Alert type
   * @param {Object} data - Alert data
   */
  emitAlert(type, data) {
    const event = new CustomEvent('mlg-enforcement-alert', {
      detail: { type, data }
    });
    
    document.dispatchEvent(event);
  }

  /**
   * Get current status
   * @returns {Object} Current system status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      step: this.initializationStep,
      mode: this.mode,
      uptime: this.initStartTime ? Date.now() - this.initStartTime : 0,
      systems: {
        enforcement: this.enforcementSystem?.getStatistics() || null,
        integration: this.platformIntegration?.getStatistics() || null
      },
      metrics: this.metrics,
      health: {
        errors: this.errors.length,
        warnings: this.warnings.length,
        memory: this.getMemoryUsage()
      }
    };
  }

  /**
   * Cleanup enforcement systems
   */
  async cleanup() {
    this.logger.info('🧹 Cleaning up MLG tag enforcement systems...');
    
    try {
      if (this.platformIntegration) {
        await this.platformIntegration.cleanup();
      }
      
      if (this.enforcementSystem) {
        await this.enforcementSystem.cleanup();
      }
      
      if (this.testSuite) {
        await this.testSuite.cleanup();
      }
      
      this.isInitialized = false;
      
      this.logger.info('✅ MLG tag enforcement cleanup complete');
    } catch (error) {
      this.logger.error('❌ Error during cleanup:', error);
    }
  }
}

/**
 * Global initialization function
 * @param {Object} options - Initialization options
 * @returns {Promise<Object>} Initialization result
 */
async function initializeMLGTagEnforcement(options = {}) {
  // Create global instance
  if (!window.MLGTagEnforcementInit) {
    window.MLGTagEnforcementInit = new MLGTagEnforcementInit(options);
  }
  
  // Get platform systems
  const platformSystems = {
    clans: window.clanSystem || null,
    users: window.userSystem || null,
    voting: window.votingSystem || null,
    wallet: window.walletSystem || null,
    content: window.contentSystem || null
  };
  
  // Initialize systems
  return await window.MLGTagEnforcementInit.initialize(platformSystems);
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Auto-initialize with default settings
      initializeMLGTagEnforcement().catch(error => {
        console.error('❌ Auto-initialization failed:', error);
      });
    });
  } else {
    // DOM is already ready
    initializeMLGTagEnforcement().catch(error => {
      console.error('❌ Auto-initialization failed:', error);
    });
  }
}

// Export for manual initialization
export { MLGTagEnforcementInit, initializeMLGTagEnforcement, INIT_CONFIG };
export default initializeMLGTagEnforcement;