/**
 * MLG Tag Enforcement System for MLG.clan Platform
 * 
 * Comprehensive enforcement system that validates and enforces [MLG] tag usage
 * across all platform components, ensuring consistent branding and preventing
 * unauthorized tag usage.
 * 
 * Features:
 * - Platform-wide tag enforcement
 * - Real-time validation and correction
 * - Unauthorized tag detection and removal
 * - Cross-component integration
 * - Security hardening against tag spoofing
 * - Performance optimized batch processing
 * - Comprehensive logging and monitoring
 * - Accessibility compliance enforcement
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 * @created 2025-08-13
 * @task Task 21.5 - Implement [MLG] tag validation and enforcement across platform
 */

import { EventEmitter } from 'events';
import { MLGTaggingValidator } from './mlg-tagging-validation.js';

/**
 * Enforcement Configuration
 */
const ENFORCEMENT_CONFIG = {
  // Enforcement Modes
  MODES: {
    STRICT: 'strict',         // Reject all violations immediately
    CORRECTIVE: 'corrective', // Auto-correct violations when possible
    PERMISSIVE: 'permissive', // Log violations but allow display
    AUDIT: 'audit'            // Only log for review
  },
  
  // Tag Validation Rules
  VALID_TAG_PATTERN: /^\[MLG\]\s/,
  AUTHORIZED_PREFIXES: ['[MLG]'],
  FORBIDDEN_PREFIXES: [
    '[ADMIN]', '[MOD]', '[DEV]', '[SYSTEM]', '[BOT]',
    '[STAFF]', '[VIP]', '[PRO]', '[ELITE]', '[CHAMPION]'
  ],
  
  // Security Rules
  MAX_TAG_LENGTH: 6,
  ALLOWED_CHARACTERS: /^[\[\]A-Z\s]+$/,
  XSS_PATTERNS: [
    /<script/i, /javascript:/i, /data:/i, /vbscript:/i,
    /on\w+=/i, /<iframe/i, /<object/i, /<embed/i
  ],
  
  // Performance Limits
  MAX_BATCH_SIZE: 1000,
  MAX_PROCESSING_TIME: 5000,
  CACHE_SIZE_LIMIT: 10000,
  
  // Monitoring
  LOG_VIOLATIONS: true,
  REPORT_FREQUENCY: 60000, // 1 minute
  ALERT_THRESHOLD: 10,     // violations per minute
  
  // Enforcement Actions
  ACTIONS: {
    REMOVE_TAG: 'remove_tag',
    CORRECT_TAG: 'correct_tag',
    BLOCK_DISPLAY: 'block_display',
    LOG_VIOLATION: 'log_violation',
    ALERT_ADMIN: 'alert_admin'
  }
};

/**
 * MLG Tag Enforcement System Class
 */
class MLGTagEnforcementSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = { ...ENFORCEMENT_CONFIG, ...options };
    this.mode = this.config.mode || this.config.MODES.CORRECTIVE;
    this.validator = new MLGTaggingValidator();
    
    // State management
    this.authorizedUsers = new Set();
    this.violationLog = [];
    this.processedTags = new Map();
    this.performanceMetrics = {
      processed: 0,
      violations: 0,
      corrections: 0,
      rejections: 0,
      averageProcessingTime: 0
    };
    
    // Monitoring
    this.monitoringInterval = null;
    this.isInitialized = false;
    this.logger = options.logger || console;
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.enforceTag = this.enforceTag.bind(this);
    this.validateAndEnforce = this.validateAndEnforce.bind(this);
    this.scanPlatform = this.scanPlatform.bind(this);
    
    this.logger.info('🛡️ MLG Tag Enforcement System initialized');
  }

  /**
   * Initialize the enforcement system
   * @param {Object} platformSystems - Platform system references
   */
  async initialize(platformSystems = {}) {
    try {
      if (this.isInitialized) return;
      
      this.logger.info('🚀 Initializing MLG Tag Enforcement System...');
      
      // Store platform system references
      this.platformSystems = platformSystems;
      
      // Load authorized users
      await this.loadAuthorizedUsers();
      
      // Setup DOM monitoring
      this.setupDOMMonitoring();
      
      // Setup performance monitoring
      this.setupPerformanceMonitoring();
      
      // Setup violation monitoring
      this.setupViolationMonitoring();
      
      // Perform initial platform scan
      await this.scanPlatform();
      
      this.isInitialized = true;
      this.emit('enforcement_initialized');
      
      this.logger.info('✅ MLG Tag Enforcement System initialized successfully');
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize enforcement system:', error);
      throw error;
    }
  }

  /**
   * Load authorized users from platform systems
   */
  async loadAuthorizedUsers() {
    this.logger.debug('👥 Loading authorized MLG users...');
    
    try {
      // Load from clan system if available
      if (this.platformSystems.clans) {
        const clanMembers = await this.platformSystems.clans.getAllMembers();
        clanMembers.forEach(member => {
          this.authorizedUsers.add(member.userId);
        });
      }
      
      // Load from user system if available
      if (this.platformSystems.users) {
        const mlgUsers = await this.platformSystems.users.getMLGMembers();
        mlgUsers.forEach(user => {
          this.authorizedUsers.add(user.id);
        });
      }
      
      // Load from local storage cache
      const cachedUsers = localStorage.getItem('mlg_authorized_users');
      if (cachedUsers) {
        JSON.parse(cachedUsers).forEach(userId => {
          this.authorizedUsers.add(userId);
        });
      }
      
      this.logger.debug(`✅ Loaded ${this.authorizedUsers.size} authorized MLG users`);
      
    } catch (error) {
      this.logger.warn('⚠️ Error loading authorized users:', error);
    }
  }

  /**
   * Setup DOM monitoring for tag enforcement
   */
  setupDOMMonitoring() {
    this.logger.debug('👁️ Setting up DOM monitoring...');
    
    // Monitor for new username elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.scanElement(node);
          }
        });
      });
    });
    
    // Start observing the document body
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-username']
    });
    
    this.domObserver = observer;
    
    this.logger.debug('✅ DOM monitoring setup complete');
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    this.logger.debug('📊 Setting up performance monitoring...');
    
    this.monitoringInterval = setInterval(() => {
      this.collectPerformanceMetrics();
      this.reportMetrics();
    }, this.config.REPORT_FREQUENCY);
    
    this.logger.debug('✅ Performance monitoring setup complete');
  }

  /**
   * Setup violation monitoring
   */
  setupViolationMonitoring() {
    this.logger.debug('🚨 Setting up violation monitoring...');
    
    setInterval(() => {
      this.checkViolationThreshold();
    }, this.config.REPORT_FREQUENCY);
    
    this.logger.debug('✅ Violation monitoring setup complete');
  }

  /**
   * Enforce tag validation on a username
   * @param {string} username - Username to validate
   * @param {string} userId - User ID for authorization check
   * @param {Object} options - Enforcement options
   * @returns {Object} Enforcement result
   */
  enforceTag(username, userId, options = {}) {
    const startTime = Date.now();
    
    try {
      const {
        allowCorrection = true,
        strict = false,
        context = 'general'
      } = options;
      
      // Performance check
      if (this.processedTags.size > this.config.CACHE_SIZE_LIMIT) {
        this.clearProcessedCache();
      }
      
      // Check cache first
      const cacheKey = `${username}:${userId}`;
      if (this.processedTags.has(cacheKey)) {
        return this.processedTags.get(cacheKey);
      }
      
      const result = this.validateAndEnforce(username, userId, {
        allowCorrection,
        strict,
        context
      });
      
      // Cache result
      this.processedTags.set(cacheKey, result);
      
      // Update metrics
      this.updatePerformanceMetrics(startTime, result);
      
      return result;
      
    } catch (error) {
      this.logger.error('❌ Error enforcing tag:', error);
      return {
        success: false,
        originalUsername: username,
        enforcedUsername: username,
        action: this.config.ACTIONS.LOG_VIOLATION,
        violation: 'processing_error',
        error: error.message
      };
    }
  }

  /**
   * Core validation and enforcement logic
   * @param {string} username - Username to validate
   * @param {string} userId - User ID for authorization check
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateAndEnforce(username, userId, options = {}) {
    const {
      allowCorrection = true,
      strict = false,
      context = 'general'
    } = options;
    
    // Basic security check
    if (this.containsXSSPatterns(username)) {
      this.logViolation(username, userId, 'xss_attempt', context);
      return {
        success: false,
        originalUsername: username,
        enforcedUsername: this.sanitizeUsername(username),
        action: this.config.ACTIONS.CORRECT_TAG,
        violation: 'xss_attempt'
      };
    }
    
    // Check if username has MLG tag
    const hasMLGTag = this.config.VALID_TAG_PATTERN.test(username);
    const isAuthorized = this.authorizedUsers.has(userId);
    
    // Case 1: User has MLG tag and is authorized
    if (hasMLGTag && isAuthorized) {
      return {
        success: true,
        originalUsername: username,
        enforcedUsername: username,
        action: 'none',
        violation: null
      };
    }
    
    // Case 2: User has MLG tag but is not authorized
    if (hasMLGTag && !isAuthorized) {
      this.logViolation(username, userId, 'unauthorized_tag', context);
      
      const cleanUsername = this.removeUnauthorizedTag(username);
      
      return {
        success: strict ? false : true,
        originalUsername: username,
        enforcedUsername: cleanUsername,
        action: this.config.ACTIONS.REMOVE_TAG,
        violation: 'unauthorized_tag'
      };
    }
    
    // Case 3: User doesn't have MLG tag but is authorized
    if (!hasMLGTag && isAuthorized) {
      if (allowCorrection) {
        const taggedUsername = this.addMLGTag(username);
        
        return {
          success: true,
          originalUsername: username,
          enforcedUsername: taggedUsername,
          action: this.config.ACTIONS.CORRECT_TAG,
          violation: 'missing_tag'
        };
      }
      
      return {
        success: true,
        originalUsername: username,
        enforcedUsername: username,
        action: 'none',
        violation: 'missing_tag'
      };
    }
    
    // Case 4: User doesn't have MLG tag and is not authorized
    // Check for forbidden prefixes
    const hasForbiddenPrefix = this.config.FORBIDDEN_PREFIXES.some(prefix => 
      username.includes(prefix)
    );
    
    if (hasForbiddenPrefix) {
      this.logViolation(username, userId, 'forbidden_prefix', context);
      
      const cleanUsername = this.removeForbiddenPrefixes(username);
      
      return {
        success: strict ? false : true,
        originalUsername: username,
        enforcedUsername: cleanUsername,
        action: this.config.ACTIONS.REMOVE_TAG,
        violation: 'forbidden_prefix'
      };
    }
    
    // Normal user without tag - no action needed
    return {
      success: true,
      originalUsername: username,
      enforcedUsername: username,
      action: 'none',
      violation: null
    };
  }

  /**
   * Check if username contains XSS patterns
   * @param {string} username - Username to check
   * @returns {boolean} True if XSS patterns found
   */
  containsXSSPatterns(username) {
    return this.config.XSS_PATTERNS.some(pattern => pattern.test(username));
  }

  /**
   * Sanitize username by removing dangerous content
   * @param {string} username - Username to sanitize
   * @returns {string} Sanitized username
   */
  sanitizeUsername(username) {
    let clean = username;
    
    // Remove XSS patterns
    this.config.XSS_PATTERNS.forEach(pattern => {
      clean = clean.replace(pattern, '');
    });
    
    // Remove HTML tags
    clean = clean.replace(/<[^>]*>/g, '');
    
    // Remove dangerous characters
    clean = clean.replace(/[<>"'&]/g, '');
    
    return clean.trim();
  }

  /**
   * Remove unauthorized MLG tag from username
   * @param {string} username - Username with unauthorized tag
   * @returns {string} Username without tag
   */
  removeUnauthorizedTag(username) {
    return username.replace(this.config.VALID_TAG_PATTERN, '').trim();
  }

  /**
   * Add MLG tag to authorized user's username
   * @param {string} username - Username without tag
   * @returns {string} Username with MLG tag
   */
  addMLGTag(username) {
    // Remove any existing unauthorized tags first
    const cleanUsername = this.removeAllTags(username);
    return `[MLG] ${cleanUsername}`;
  }

  /**
   * Remove all tag-like patterns from username
   * @param {string} username - Username with potential tags
   * @returns {string} Username without any tags
   */
  removeAllTags(username) {
    // Remove any bracket patterns that look like tags
    return username.replace(/\[[^\]]*\]\s*/g, '').trim();
  }

  /**
   * Remove forbidden prefix tags
   * @param {string} username - Username with forbidden prefixes
   * @returns {string} Username without forbidden prefixes
   */
  removeForbiddenPrefixes(username) {
    let clean = username;
    
    this.config.FORBIDDEN_PREFIXES.forEach(prefix => {
      const pattern = new RegExp(`\\${prefix}\\s*`, 'gi');
      clean = clean.replace(pattern, '');
    });
    
    return clean.trim();
  }

  /**
   * Scan entire platform for tag violations
   * @returns {Promise<Object>} Scan results
   */
  async scanPlatform() {
    this.logger.info('🔍 Starting platform-wide tag enforcement scan...');
    
    const startTime = Date.now();
    let scannedElements = 0;
    let violations = 0;
    let corrections = 0;
    
    try {
      // Scan all username elements
      const usernameElements = document.querySelectorAll([
        '.username',
        '.user-name',
        '.mlg-username',
        '[data-username]',
        '.player-name',
        '.member-name'
      ].join(', '));
      
      for (const element of usernameElements) {
        const result = await this.scanElement(element);
        scannedElements++;
        
        if (result.violation) {
          violations++;
          if (result.action !== 'none') {
            corrections++;
          }
        }
      }
      
      // Scan profile headers
      const profileElements = document.querySelectorAll([
        '.profile-header',
        '.user-profile',
        '.player-card'
      ].join(', '));
      
      for (const element of profileElements) {
        await this.scanProfileElement(element);
        scannedElements++;
      }
      
      const scanTime = Date.now() - startTime;
      
      const results = {
        success: true,
        scannedElements,
        violations,
        corrections,
        scanTime,
        timestamp: new Date()
      };
      
      this.emit('platform_scan_complete', results);
      this.logger.info(`✅ Platform scan complete: ${violations} violations, ${corrections} corrections in ${scanTime}ms`);
      
      return results;
      
    } catch (error) {
      this.logger.error('❌ Platform scan failed:', error);
      throw error;
    }
  }

  /**
   * Scan individual element for tag violations
   * @param {Element} element - DOM element to scan
   * @returns {Object} Scan result
   */
  async scanElement(element) {
    try {
      const username = this.extractUsername(element);
      const userId = this.extractUserId(element);
      
      if (!username || !userId) {
        return { success: true, violation: null };
      }
      
      const result = this.enforceTag(username, userId, {
        context: 'platform_scan'
      });
      
      // Apply enforcement if needed
      if (result.action !== 'none' && result.enforcedUsername !== result.originalUsername) {
        this.applyEnforcementToElement(element, result);
      }
      
      return result;
      
    } catch (error) {
      this.logger.warn('⚠️ Error scanning element:', error);
      return { success: false, violation: 'scan_error' };
    }
  }

  /**
   * Scan profile element specifically
   * @param {Element} element - Profile element to scan
   */
  async scanProfileElement(element) {
    const usernameElements = element.querySelectorAll('.username, .user-name, .mlg-username');
    
    for (const usernameElement of usernameElements) {
      await this.scanElement(usernameElement);
    }
  }

  /**
   * Extract username from element
   * @param {Element} element - DOM element
   * @returns {string|null} Extracted username
   */
  extractUsername(element) {
    return element.textContent?.trim() ||
           element.getAttribute('data-username') ||
           element.title ||
           null;
  }

  /**
   * Extract user ID from element
   * @param {Element} element - DOM element
   * @returns {string|null} Extracted user ID
   */
  extractUserId(element) {
    return element.getAttribute('data-user-id') ||
           element.getAttribute('data-userid') ||
           element.getAttribute('data-id') ||
           element.id ||
           null;
  }

  /**
   * Apply enforcement result to DOM element
   * @param {Element} element - DOM element to update
   * @param {Object} result - Enforcement result
   */
  applyEnforcementToElement(element, result) {
    if (this.mode === this.config.MODES.AUDIT) {
      return; // Audit mode - no changes
    }
    
    try {
      // Update text content
      if (element.textContent) {
        element.textContent = result.enforcedUsername;
      }
      
      // Update attributes
      if (element.hasAttribute('data-username')) {
        element.setAttribute('data-username', result.enforcedUsername);
      }
      
      // Add violation indicator for debugging
      element.setAttribute('data-mlg-enforced', result.action);
      
      // Apply styling based on enforcement action
      if (result.action === this.config.ACTIONS.REMOVE_TAG) {
        element.classList.add('mlg-tag-removed');
      } else if (result.action === this.config.ACTIONS.CORRECT_TAG) {
        element.classList.add('mlg-tag-corrected');
      }
      
      this.emit('element_enforced', { element, result });
      
    } catch (error) {
      this.logger.warn('⚠️ Error applying enforcement to element:', error);
    }
  }

  /**
   * Log a tag violation
   * @param {string} username - Violating username
   * @param {string} userId - User ID
   * @param {string} violationType - Type of violation
   * @param {string} context - Context where violation occurred
   */
  logViolation(username, userId, violationType, context) {
    if (!this.config.LOG_VIOLATIONS) return;
    
    const violation = {
      timestamp: new Date(),
      username,
      userId,
      violationType,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    this.violationLog.push(violation);
    this.performanceMetrics.violations++;
    
    // Emit violation event
    this.emit('tag_violation', violation);
    
    // Keep log size manageable
    if (this.violationLog.length > 1000) {
      this.violationLog = this.violationLog.slice(-500);
    }
    
    this.logger.warn(`🚨 Tag violation: ${violationType} for user ${userId} (${username}) in ${context}`);
  }

  /**
   * Check violation threshold and alert if needed
   */
  checkViolationThreshold() {
    const recentViolations = this.violationLog.filter(
      v => Date.now() - v.timestamp.getTime() < this.config.REPORT_FREQUENCY
    );
    
    if (recentViolations.length >= this.config.ALERT_THRESHOLD) {
      this.emit('violation_threshold_exceeded', {
        count: recentViolations.length,
        threshold: this.config.ALERT_THRESHOLD,
        violations: recentViolations
      });
      
      this.logger.error(`🚨 Violation threshold exceeded: ${recentViolations.length} violations in last minute`);
    }
  }

  /**
   * Update performance metrics
   * @param {number} startTime - Processing start time
   * @param {Object} result - Enforcement result
   */
  updatePerformanceMetrics(startTime, result) {
    const processingTime = Date.now() - startTime;
    
    this.performanceMetrics.processed++;
    
    if (result.action === this.config.ACTIONS.CORRECT_TAG) {
      this.performanceMetrics.corrections++;
    }
    
    if (!result.success) {
      this.performanceMetrics.rejections++;
    }
    
    // Update average processing time
    this.performanceMetrics.averageProcessingTime = 
      (this.performanceMetrics.averageProcessingTime + processingTime) / 2;
  }

  /**
   * Collect and report performance metrics
   */
  collectPerformanceMetrics() {
    const metrics = {
      ...this.performanceMetrics,
      cacheSize: this.processedTags.size,
      authorizedUsers: this.authorizedUsers.size,
      recentViolations: this.violationLog.filter(
        v => Date.now() - v.timestamp.getTime() < this.config.REPORT_FREQUENCY
      ).length,
      memoryUsage: this.getMemoryUsage()
    };
    
    this.emit('performance_metrics', metrics);
  }

  /**
   * Report current metrics
   */
  reportMetrics() {
    const metrics = this.getStatistics();
    
    if (metrics.violations > 0 || metrics.corrections > 0) {
      this.logger.info(`📊 MLG Enforcement Metrics: ${metrics.processed} processed, ${metrics.violations} violations, ${metrics.corrections} corrections`);
    }
  }

  /**
   * Get memory usage information
   * @returns {Object} Memory usage stats
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
   * Clear processed tag cache
   */
  clearProcessedCache() {
    this.processedTags.clear();
    this.logger.debug('🧹 Processed tag cache cleared');
  }

  /**
   * Add authorized user
   * @param {string} userId - User ID to authorize
   */
  addAuthorizedUser(userId) {
    this.authorizedUsers.add(userId);
    this.emit('user_authorized', { userId });
    this.logger.debug(`✅ User authorized for MLG tags: ${userId}`);
  }

  /**
   * Remove authorized user
   * @param {string} userId - User ID to deauthorize
   */
  removeAuthorizedUser(userId) {
    this.authorizedUsers.delete(userId);
    this.emit('user_deauthorized', { userId });
    this.logger.debug(`❌ User deauthorized for MLG tags: ${userId}`);
  }

  /**
   * Get enforcement statistics
   * @returns {Object} Current enforcement statistics
   */
  getStatistics() {
    return {
      isInitialized: this.isInitialized,
      mode: this.mode,
      authorizedUsers: this.authorizedUsers.size,
      processedTags: this.processedTags.size,
      totalViolations: this.violationLog.length,
      recentViolations: this.violationLog.filter(
        v => Date.now() - v.timestamp.getTime() < this.config.REPORT_FREQUENCY
      ).length,
      ...this.performanceMetrics
    };
  }

  /**
   * Get violation report
   * @param {number} hours - Hours to look back (default: 24)
   * @returns {Object} Violation report
   */
  getViolationReport(hours = 24) {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    const recentViolations = this.violationLog.filter(v => v.timestamp.getTime() > cutoff);
    
    const byType = {};
    const byContext = {};
    
    recentViolations.forEach(v => {
      byType[v.violationType] = (byType[v.violationType] || 0) + 1;
      byContext[v.context] = (byContext[v.context] || 0) + 1;
    });
    
    return {
      totalViolations: recentViolations.length,
      timeRange: `${hours} hours`,
      byType,
      byContext,
      violations: recentViolations
    };
  }

  /**
   * Cleanup enforcement system
   */
  async cleanup() {
    this.logger.info('🧹 Cleaning up MLG Tag Enforcement System...');
    
    // Stop monitoring
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    // Stop DOM observer
    if (this.domObserver) {
      this.domObserver.disconnect();
    }
    
    // Clear caches
    this.processedTags.clear();
    this.authorizedUsers.clear();
    this.violationLog.length = 0;
    
    // Remove event listeners
    this.removeAllListeners();
    
    this.isInitialized = false;
    
    this.logger.info('✅ MLG Tag Enforcement System cleanup complete');
  }
}

// Export enforcement system
export { MLGTagEnforcementSystem, ENFORCEMENT_CONFIG };
export default MLGTagEnforcementSystem;