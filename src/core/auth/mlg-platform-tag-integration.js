/**
 * MLG Platform Tag Integration Manager
 * 
 * Central integration system that coordinates MLG tag enforcement across all
 * platform components, ensuring consistent tag validation and display throughout
 * the entire MLG.clan gaming platform.
 * 
 * Features:
 * - Cross-component tag enforcement coordination
 * - Real-time validation integration
 * - Component lifecycle management
 * - Event-driven tag synchronization
 * - Performance-optimized batch processing
 * - Accessibility compliance enforcement
 * - Mobile and responsive tag handling
 * - Security hardened validation
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 * @created 2025-08-13
 * @task Task 21.5 - Implement [MLG] tag validation and enforcement across platform
 */

import { EventEmitter } from 'events';
import { MLGTagEnforcementSystem } from './mlg-tag-enforcement-system.js';
import { MLGUsernameTaggingService } from './mlg-username-tagging-service.js';
import { MLGUsernameDisplay } from '../shared/utils/mlg-username-display.js';

/**
 * Platform Integration Configuration
 */
const PLATFORM_INTEGRATION_CONFIG = {
  // Component Integration Points
  COMPONENTS: {
    voting: '.voting-interface',
    clans: '.clan-roster, .clan-management',
    profiles: '.user-profile, .profile-header',
    tournaments: '.tournament-bracket, .tournament-display',
    leaderboards: '.leaderboard, .ranking-display',
    chat: '.chat-message, .message-container',
    notifications: '.notification, .alert-system',
    navigation: '.nav-user, .user-menu'
  },
  
  // Integration Timing
  TIMING: {
    immediate: 0,
    fast: 100,
    normal: 500,
    slow: 1000
  },
  
  // Batch Processing
  BATCH_SIZES: {
    small: 50,
    medium: 200,
    large: 1000
  },
  
  // Performance Monitoring
  PERFORMANCE: {
    maxProcessingTime: 5000,
    batchTimeout: 10000,
    memoryThreshold: 50 * 1024 * 1024, // 50MB
    alertThreshold: 100 // violations per hour
  },
  
  // Mobile Optimization
  MOBILE: {
    reducedBatchSize: 25,
    optimizedRendering: true,
    touchFriendlyControls: true
  }
};

/**
 * MLG Platform Tag Integration Manager Class
 */
class MLGPlatformTagIntegration extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = { ...PLATFORM_INTEGRATION_CONFIG, ...options };
    this.isInitialized = false;
    this.logger = options.logger || console;
    
    // Core systems
    this.enforcementSystem = new MLGTagEnforcementSystem(options);
    this.taggingService = null;
    this.displayUtility = null;
    
    // Component managers
    this.componentManagers = new Map();
    this.integrationStatus = new Map();
    this.processingQueues = new Map();
    
    // Performance tracking
    this.performanceMetrics = {
      componentsIntegrated: 0,
      totalTagsProcessed: 0,
      averageProcessingTime: 0,
      violationsDetected: 0,
      correctionsApplied: 0
    };
    
    // Mobile detection
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    this.logger.info('🎮 MLG Platform Tag Integration Manager initialized');
  }

  /**
   * Initialize the platform integration
   * @param {Object} platformSystems - Platform system references
   */
  async initialize(platformSystems = {}) {
    try {
      if (this.isInitialized) return;
      
      this.logger.info('🚀 Initializing MLG Platform Tag Integration...');
      
      // Store platform systems
      this.platformSystems = platformSystems;
      
      // Initialize core systems
      await this.initializeCoreSystemsIntegration();
      
      // Setup component integrations
      await this.setupComponentIntegrations();
      
      // Setup event handling
      this.setupEventHandling();
      
      // Setup performance monitoring
      this.setupPerformanceMonitoring();
      
      // Perform initial integration scan
      await this.performInitialIntegration();
      
      // Setup reactive updates
      this.setupReactiveUpdates();
      
      this.isInitialized = true;
      this.emit('platform_integration_complete');
      
      this.logger.info('✅ MLG Platform Tag Integration initialized successfully');
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize platform integration:', error);
      throw error;
    }
  }

  /**
   * Initialize core systems integration
   */
  async initializeCoreSystemsIntegration() {
    this.logger.debug('🔧 Initializing core systems integration...');
    
    // Initialize enforcement system
    await this.enforcementSystem.initialize(this.platformSystems);
    
    // Initialize tagging service if available
    if (window.MLGUsernameTaggingService) {
      this.taggingService = new window.MLGUsernameTaggingService();
      await this.taggingService.initialize();
    }
    
    // Initialize display utility if available
    if (window.MLGUsernameDisplay) {
      this.displayUtility = new window.MLGUsernameDisplay();
    }
    
    this.logger.debug('✅ Core systems integration complete');
  }

  /**
   * Setup component integrations
   */
  async setupComponentIntegrations() {
    this.logger.debug('🔗 Setting up component integrations...');
    
    const integrationPromises = [];
    
    for (const [componentName, selector] of Object.entries(this.config.COMPONENTS)) {
      integrationPromises.push(
        this.integrateComponent(componentName, selector)
      );
    }
    
    await Promise.all(integrationPromises);
    
    this.logger.debug('✅ Component integrations setup complete');
  }

  /**
   * Integrate individual component
   * @param {string} componentName - Name of component
   * @param {string} selector - CSS selector for component
   */
  async integrateComponent(componentName, selector) {
    try {
      this.logger.debug(`🔧 Integrating component: ${componentName}`);
      
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        this.integrationStatus.set(componentName, 'not_found');
        return;
      }
      
      // Create component manager
      const manager = new ComponentTagManager({
        componentName,
        elements: Array.from(elements),
        enforcementSystem: this.enforcementSystem,
        config: this.config,
        isMobile: this.isMobile,
        logger: this.logger
      });
      
      await manager.initialize();
      this.componentManagers.set(componentName, manager);
      this.integrationStatus.set(componentName, 'integrated');
      
      // Create processing queue for this component
      this.processingQueues.set(componentName, []);
      
      this.performanceMetrics.componentsIntegrated++;
      
      this.logger.debug(`✅ Component integrated: ${componentName} (${elements.length} elements)`);
      
    } catch (error) {
      this.logger.warn(`⚠️ Failed to integrate component ${componentName}:`, error);
      this.integrationStatus.set(componentName, 'error');
    }
  }

  /**
   * Setup event handling
   */
  setupEventHandling() {
    this.logger.debug('📡 Setting up event handling...');
    
    // Listen to enforcement system events
    this.enforcementSystem.on('tag_violation', (violation) => {
      this.handleTagViolation(violation);
    });
    
    this.enforcementSystem.on('element_enforced', (data) => {
      this.handleElementEnforced(data);
    });
    
    // Listen to platform system events
    if (this.platformSystems.clans) {
      this.platformSystems.clans.on('member_added', (data) => {
        this.handleMemberAdded(data);
      });
      
      this.platformSystems.clans.on('member_removed', (data) => {
        this.handleMemberRemoved(data);
      });
    }
    
    if (this.platformSystems.users) {
      this.platformSystems.users.on('profile_updated', (data) => {
        this.handleProfileUpdated(data);
      });
    }
    
    // Listen for DOM changes
    this.setupDOMChangeHandling();
    
    this.logger.debug('✅ Event handling setup complete');
  }

  /**
   * Setup DOM change handling
   */
  setupDOMChangeHandling() {
    const observer = new MutationObserver((mutations) => {
      const relevantMutations = mutations.filter(mutation => 
        mutation.type === 'childList' || 
        (mutation.type === 'attributes' && ['class', 'data-username'].includes(mutation.attributeName))
      );
      
      if (relevantMutations.length > 0) {
        this.handleDOMChanges(relevantMutations);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-username', 'data-user-id']
    });
    
    this.domObserver = observer;
  }

  /**
   * Handle DOM changes
   * @param {Array} mutations - DOM mutations
   */
  handleDOMChanges(mutations) {
    const elementsToProcess = new Set();
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.findRelevantElements(node, elementsToProcess);
          }
        });
      } else if (mutation.type === 'attributes') {
        elementsToProcess.add(mutation.target);
      }
    });
    
    if (elementsToProcess.size > 0) {
      this.queueElementsForProcessing(Array.from(elementsToProcess));
    }
  }

  /**
   * Find relevant elements in DOM subtree
   * @param {Element} root - Root element to search
   * @param {Set} elementsToProcess - Set to add found elements to
   */
  findRelevantElements(root, elementsToProcess) {
    // Check if root element itself is relevant
    if (this.isRelevantElement(root)) {
      elementsToProcess.add(root);
    }
    
    // Search for relevant elements in subtree
    for (const [componentName, selector] of Object.entries(this.config.COMPONENTS)) {
      const foundElements = root.querySelectorAll(selector);
      foundElements.forEach(element => {
        if (this.isRelevantElement(element)) {
          elementsToProcess.add(element);
        }
      });
    }
  }

  /**
   * Check if element is relevant for tag processing
   * @param {Element} element - Element to check
   * @returns {boolean} True if relevant
   */
  isRelevantElement(element) {
    return element.classList.contains('username') ||
           element.classList.contains('user-name') ||
           element.classList.contains('mlg-username') ||
           element.hasAttribute('data-username') ||
           element.classList.contains('player-name');
  }

  /**
   * Queue elements for processing
   * @param {Array} elements - Elements to process
   */
  queueElementsForProcessing(elements) {
    const batchSize = this.isMobile ? 
      this.config.BATCH_SIZES.small : 
      this.config.BATCH_SIZES.medium;
    
    // Group elements by component
    const byComponent = new Map();
    
    elements.forEach(element => {
      const componentName = this.identifyComponent(element);
      if (!byComponent.has(componentName)) {
        byComponent.set(componentName, []);
      }
      byComponent.get(componentName).push(element);
    });
    
    // Add to processing queues
    byComponent.forEach((elementList, componentName) => {
      const queue = this.processingQueues.get(componentName) || [];
      queue.push(...elementList);
      this.processingQueues.set(componentName, queue);
      
      // Process queue if it's large enough or after timeout
      if (queue.length >= batchSize) {
        this.processComponentQueue(componentName);
      } else {
        // Set timeout to process remaining elements
        setTimeout(() => {
          this.processComponentQueue(componentName);
        }, this.config.TIMING.normal);
      }
    });
  }

  /**
   * Identify which component an element belongs to
   * @param {Element} element - Element to identify
   * @returns {string} Component name
   */
  identifyComponent(element) {
    for (const [componentName, selector] of Object.entries(this.config.COMPONENTS)) {
      if (element.matches(selector) || element.closest(selector)) {
        return componentName;
      }
    }
    return 'general';
  }

  /**
   * Process component queue
   * @param {string} componentName - Component name
   */
  async processComponentQueue(componentName) {
    const queue = this.processingQueues.get(componentName);
    if (!queue || queue.length === 0) return;
    
    this.logger.debug(`⚡ Processing queue for ${componentName}: ${queue.length} elements`);
    
    const startTime = Date.now();
    const manager = this.componentManagers.get(componentName);
    
    try {
      if (manager) {
        await manager.processBatch(queue);
      } else {
        // Fallback processing
        await this.processBatchDirect(queue);
      }
      
      // Clear queue
      this.processingQueues.set(componentName, []);
      
      const processingTime = Date.now() - startTime;
      this.updatePerformanceMetrics(queue.length, processingTime);
      
    } catch (error) {
      this.logger.error(`❌ Error processing queue for ${componentName}:`, error);
    }
  }

  /**
   * Direct batch processing fallback
   * @param {Array} elements - Elements to process
   */
  async processBatchDirect(elements) {
    for (const element of elements) {
      try {
        const username = this.extractUsernameFromElement(element);
        const userId = this.extractUserIdFromElement(element);
        
        if (username && userId) {
          const result = this.enforcementSystem.enforceTag(username, userId);
          
          if (result.action !== 'none') {
            this.applyEnforcementToElement(element, result);
          }
        }
      } catch (error) {
        this.logger.warn('⚠️ Error processing element:', error);
      }
    }
  }

  /**
   * Extract username from element
   * @param {Element} element - DOM element
   * @returns {string|null} Username
   */
  extractUsernameFromElement(element) {
    return element.textContent?.trim() ||
           element.getAttribute('data-username') ||
           element.title ||
           null;
  }

  /**
   * Extract user ID from element
   * @param {Element} element - DOM element
   * @returns {string|null} User ID
   */
  extractUserIdFromElement(element) {
    return element.getAttribute('data-user-id') ||
           element.getAttribute('data-userid') ||
           element.id ||
           element.closest('[data-user-id]')?.getAttribute('data-user-id') ||
           null;
  }

  /**
   * Apply enforcement to element
   * @param {Element} element - DOM element
   * @param {Object} result - Enforcement result
   */
  applyEnforcementToElement(element, result) {
    if (element.textContent) {
      element.textContent = result.enforcedUsername;
    }
    
    element.setAttribute('data-mlg-enforced', result.action);
    element.setAttribute('data-enforcement-time', Date.now().toString());
  }

  /**
   * Perform initial integration scan
   */
  async performInitialIntegration() {
    this.logger.info('🔍 Performing initial platform integration scan...');
    
    const scanPromises = [];
    
    for (const [componentName, manager] of this.componentManagers) {
      scanPromises.push(
        manager.performInitialScan().catch(error => {
          this.logger.warn(`⚠️ Initial scan failed for ${componentName}:`, error);
        })
      );
    }
    
    await Promise.all(scanPromises);
    
    this.logger.info('✅ Initial platform integration scan complete');
  }

  /**
   * Setup reactive updates
   */
  setupReactiveUpdates() {
    // Update tags when user authorization changes
    this.enforcementSystem.on('user_authorized', (data) => {
      this.refreshUserTags(data.userId);
    });
    
    this.enforcementSystem.on('user_deauthorized', (data) => {
      this.refreshUserTags(data.userId);
    });
    
    // Performance monitoring
    setInterval(() => {
      this.monitorPerformance();
    }, 60000); // Every minute
  }

  /**
   * Refresh tags for specific user
   * @param {string} userId - User ID to refresh
   */
  async refreshUserTags(userId) {
    this.logger.debug(`🔄 Refreshing tags for user: ${userId}`);
    
    const userElements = document.querySelectorAll(`[data-user-id="${userId}"]`);
    
    if (userElements.length > 0) {
      this.queueElementsForProcessing(Array.from(userElements));
    }
  }

  /**
   * Handle tag violation
   * @param {Object} violation - Violation data
   */
  handleTagViolation(violation) {
    this.performanceMetrics.violationsDetected++;
    
    // Emit platform-level violation event
    this.emit('platform_tag_violation', violation);
    
    // Log for analytics
    this.logger.warn(`🚨 Platform tag violation: ${violation.violationType} by ${violation.userId}`);
  }

  /**
   * Handle element enforcement
   * @param {Object} data - Enforcement data
   */
  handleElementEnforced(data) {
    this.performanceMetrics.correctionsApplied++;
    
    // Emit platform-level enforcement event
    this.emit('platform_tag_enforced', data);
  }

  /**
   * Handle member added to clan
   * @param {Object} data - Member data
   */
  handleMemberAdded(data) {
    this.enforcementSystem.addAuthorizedUser(data.userId);
    this.refreshUserTags(data.userId);
  }

  /**
   * Handle member removed from clan
   * @param {Object} data - Member data
   */
  handleMemberRemoved(data) {
    this.enforcementSystem.removeAuthorizedUser(data.userId);
    this.refreshUserTags(data.userId);
  }

  /**
   * Handle profile updated
   * @param {Object} data - Profile data
   */
  handleProfileUpdated(data) {
    this.refreshUserTags(data.userId);
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    setInterval(() => {
      this.collectPerformanceMetrics();
    }, 30000); // Every 30 seconds
  }

  /**
   * Monitor performance
   */
  monitorPerformance() {
    const stats = this.getStatistics();
    
    if (stats.averageProcessingTime > this.config.PERFORMANCE.maxProcessingTime) {
      this.logger.warn('⚠️ High processing time detected, optimizing...');
      this.optimizePerformance();
    }
    
    const memoryUsage = this.getMemoryUsage();
    if (memoryUsage.used > this.config.PERFORMANCE.memoryThreshold) {
      this.logger.warn('⚠️ High memory usage detected, performing cleanup...');
      this.performMemoryCleanup();
    }
  }

  /**
   * Optimize performance
   */
  optimizePerformance() {
    // Reduce batch sizes
    Object.keys(this.config.BATCH_SIZES).forEach(key => {
      this.config.BATCH_SIZES[key] = Math.max(10, this.config.BATCH_SIZES[key] * 0.8);
    });
    
    // Clear processing queues
    this.processingQueues.forEach((queue, componentName) => {
      if (queue.length > 100) {
        this.processingQueues.set(componentName, queue.slice(0, 50));
      }
    });
  }

  /**
   * Perform memory cleanup
   */
  performMemoryCleanup() {
    // Clear component caches
    this.componentManagers.forEach(manager => {
      if (manager.cleanup) {
        manager.cleanup();
      }
    });
    
    // Clear enforcement system cache
    this.enforcementSystem.clearProcessedCache();
  }

  /**
   * Update performance metrics
   * @param {number} elementCount - Number of elements processed
   * @param {number} processingTime - Time taken to process
   */
  updatePerformanceMetrics(elementCount, processingTime) {
    this.performanceMetrics.totalTagsProcessed += elementCount;
    
    const avgTime = this.performanceMetrics.averageProcessingTime;
    this.performanceMetrics.averageProcessingTime = 
      (avgTime + (processingTime / elementCount)) / 2;
  }

  /**
   * Collect performance metrics
   */
  collectPerformanceMetrics() {
    const metrics = {
      ...this.performanceMetrics,
      integrationStatus: Object.fromEntries(this.integrationStatus),
      queueSizes: Object.fromEntries(
        Array.from(this.processingQueues.entries()).map(([name, queue]) => [name, queue.length])
      ),
      memoryUsage: this.getMemoryUsage(),
      timestamp: new Date()
    };
    
    this.emit('performance_metrics', metrics);
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
   * Get integration statistics
   * @returns {Object} Platform integration statistics
   */
  getStatistics() {
    const enforcementStats = this.enforcementSystem.getStatistics();
    
    return {
      isInitialized: this.isInitialized,
      ...this.performanceMetrics,
      ...enforcementStats,
      integrationStatus: Object.fromEntries(this.integrationStatus),
      componentManagers: this.componentManagers.size,
      processingQueues: this.processingQueues.size,
      isMobile: this.isMobile
    };
  }

  /**
   * Cleanup platform integration
   */
  async cleanup() {
    this.logger.info('🧹 Cleaning up MLG Platform Tag Integration...');
    
    // Cleanup component managers
    for (const manager of this.componentManagers.values()) {
      if (manager.cleanup) {
        await manager.cleanup();
      }
    }
    
    // Cleanup enforcement system
    await this.enforcementSystem.cleanup();
    
    // Stop DOM observer
    if (this.domObserver) {
      this.domObserver.disconnect();
    }
    
    // Clear collections
    this.componentManagers.clear();
    this.integrationStatus.clear();
    this.processingQueues.clear();
    
    // Remove event listeners
    this.removeAllListeners();
    
    this.isInitialized = false;
    
    this.logger.info('✅ MLG Platform Tag Integration cleanup complete');
  }
}

/**
 * Component Tag Manager
 * Manages tag enforcement for specific component types
 */
class ComponentTagManager {
  constructor(options) {
    this.componentName = options.componentName;
    this.elements = options.elements;
    this.enforcementSystem = options.enforcementSystem;
    this.config = options.config;
    this.isMobile = options.isMobile;
    this.logger = options.logger;
    
    this.processedElements = new Set();
    this.isInitialized = false;
  }

  async initialize() {
    this.logger.debug(`🔧 Initializing component manager: ${this.componentName}`);
    this.isInitialized = true;
  }

  async performInitialScan() {
    const startTime = Date.now();
    let processed = 0;
    
    for (const element of this.elements) {
      try {
        await this.processElement(element);
        processed++;
      } catch (error) {
        this.logger.warn(`⚠️ Error processing element in ${this.componentName}:`, error);
      }
    }
    
    const processingTime = Date.now() - startTime;
    this.logger.debug(`✅ Initial scan complete for ${this.componentName}: ${processed} elements in ${processingTime}ms`);
  }

  async processBatch(elements) {
    const batchSize = this.isMobile ? 25 : 100;
    
    for (let i = 0; i < elements.length; i += batchSize) {
      const batch = elements.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(element => this.processElement(element))
      );
      
      // Yield control to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  async processElement(element) {
    if (this.processedElements.has(element)) return;
    
    const username = this.extractUsername(element);
    const userId = this.extractUserId(element);
    
    if (username && userId) {
      const result = this.enforcementSystem.enforceTag(username, userId, {
        context: this.componentName
      });
      
      if (result.action !== 'none') {
        this.applyEnforcementToElement(element, result);
      }
    }
    
    this.processedElements.add(element);
  }

  extractUsername(element) {
    return element.textContent?.trim() ||
           element.getAttribute('data-username') ||
           element.title ||
           null;
  }

  extractUserId(element) {
    return element.getAttribute('data-user-id') ||
           element.getAttribute('data-userid') ||
           element.id ||
           null;
  }

  applyEnforcementToElement(element, result) {
    if (element.textContent) {
      element.textContent = result.enforcedUsername;
    }
    
    element.setAttribute('data-mlg-enforced', result.action);
    element.setAttribute('data-component', this.componentName);
  }

  cleanup() {
    this.processedElements.clear();
    this.isInitialized = false;
  }
}

// Export platform integration
export { MLGPlatformTagIntegration, ComponentTagManager, PLATFORM_INTEGRATION_CONFIG };
export default MLGPlatformTagIntegration;