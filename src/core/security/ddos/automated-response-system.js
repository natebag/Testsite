/**
 * Automated DDoS Response and Blocking System for MLG.clan Gaming Platform
 * 
 * Intelligent automated response system that provides:
 * - Real-time threat response with graduated escalation
 * - Dynamic IP blocking and whitelisting management
 * - Gaming-aware response strategies that preserve user experience
 * - Integration with existing security infrastructure
 * - Emergency response protocols with manual override capabilities
 * - Performance-optimized blocking mechanisms
 * 
 * @author Claude Code - Security Performance Auditor
 * @version 1.0.0
 * @created 2025-08-13
 */

import { analyzeAdvancedThreats } from './advanced-threat-algorithms.js';
import { getThreatDetectionEngine } from '../detection/threatDetector.js';

/**
 * Response System Configuration
 */
const RESPONSE_CONFIG = {
  // Response escalation levels
  ESCALATION_LEVELS: {
    MONITOR: {
      level: 1,
      actions: ['LOG', 'TRACK_METRICS'],
      duration: 300000,                    // 5 minutes
      escalate_threshold: 3,               // Escalate after 3 violations
      auto_escalate: true
    },
    RATE_LIMIT: {
      level: 2,
      actions: ['LOG', 'APPLY_RATE_LIMIT', 'TRACK_METRICS'],
      duration: 600000,                    // 10 minutes
      escalate_threshold: 2,
      rate_limit_factor: 0.5,              // Reduce to 50% of normal limits
      auto_escalate: true
    },
    SOFT_BLOCK: {
      level: 3,
      actions: ['LOG', 'CAPTCHA_CHALLENGE', 'ENHANCED_MONITORING'],
      duration: 1800000,                   // 30 minutes
      escalate_threshold: 2,
      auto_escalate: true
    },
    HARD_BLOCK: {
      level: 4,
      actions: ['LOG', 'BLOCK_IP', 'ALERT_SECURITY'],
      duration: 3600000,                   // 1 hour
      escalate_threshold: 1,
      auto_escalate: false,                // Require manual review
      require_manual_review: true
    },
    EMERGENCY_BLOCK: {
      level: 5,
      actions: ['LOG', 'BLOCK_IP', 'ALERT_ADMINS', 'EMERGENCY_PROTOCOLS'],
      duration: 86400000,                  // 24 hours
      escalate_threshold: 0,
      auto_escalate: false,
      require_manual_review: true,
      require_admin_approval: true
    }
  },

  // Gaming-specific response configurations
  GAMING_RESPONSES: {
    // Tournament mode responses (more lenient during active tournaments)
    TOURNAMENT_MODE: {
      enabled: false,
      rate_limit_multiplier: 1.5,         // 50% more lenient
      block_threshold_multiplier: 2.0,     // Double the threshold before blocking
      priority_user_bypass: true,          // Allow priority users through
      manual_review_required: true         // All blocks require manual review
    },
    
    // Critical gaming endpoint protection
    CRITICAL_ENDPOINTS: {
      '/api/voting/votes/cast': {
        max_escalation_level: 'SOFT_BLOCK', // Don't hard block voting
        require_auth: true,
        captcha_threshold: 0.6
      },
      '/api/clans/join': {
        max_escalation_level: 'RATE_LIMIT',
        cooldown_period: 300000             // 5 minute cooldown
      },
      '/api/tournaments/join': {
        max_escalation_level: 'SOFT_BLOCK',
        tournament_protection: true
      },
      '/api/web3/transaction': {
        max_escalation_level: 'EMERGENCY_BLOCK',
        require_wallet_verification: true,
        transaction_limit_factor: 0.1       // Very strict limits
      }
    },
    
    // User type specific responses
    USER_TYPE_RESPONSES: {
      'anonymous': {
        escalation_speed: 1.5,              // Faster escalation
        max_escalation_level: 'HARD_BLOCK'
      },
      'authenticated': {
        escalation_speed: 1.0,              // Normal escalation
        max_escalation_level: 'SOFT_BLOCK',
        require_additional_verification: true
      },
      'premium': {
        escalation_speed: 0.7,              // Slower escalation
        max_escalation_level: 'RATE_LIMIT',
        whitelist_bias: true
      },
      'admin': {
        escalation_speed: 0.5,              // Very slow escalation
        max_escalation_level: 'MONITOR',
        admin_bypass: true
      }
    }
  },

  // Blocking mechanisms
  BLOCKING: {
    // IP blocking strategies
    IP_BLOCKING: {
      TEMPORARY_BLOCK_DURATION: 1800000,   // 30 minutes
      PERMANENT_BLOCK_DURATION: 86400000,  // 24 hours
      ESCALATION_MULTIPLIER: 2,            // Double duration on repeat offenses
      MAX_BLOCK_DURATION: 604800000,       // 7 days maximum
      WHITELIST_OVERRIDE: true,            // Whitelist always overrides blocks
      SUBNET_BLOCKING_THRESHOLD: 10        // Block subnet if 10+ IPs from same /24
    },
    
    // Session blocking
    SESSION_BLOCKING: {
      INVALIDATE_SESSIONS: true,           // Invalidate all sessions from blocked IP
      PREVENT_NEW_SESSIONS: true,          // Prevent new session creation
      SESSION_RECOVERY_DELAY: 300000       // 5 minutes before new sessions allowed
    },
    
    // Geographic blocking
    GEO_BLOCKING: {
      ENABLED: false,                      // Disabled by default for gaming
      EMERGENCY_GEO_BLOCK: true,           // Allow emergency geo blocking
      COUNTRY_BLOCK_THRESHOLD: 100,       // Block country if 100+ attacks
      REGION_ESCALATION: true              // Escalate to region blocking
    }
  },

  // Recovery and redemption
  RECOVERY: {
    AUTOMATIC_RECOVERY: {
      enabled: true,
      good_behavior_period: 3600000,       // 1 hour of good behavior
      recovery_threshold: 0.95,            // 95% good requests
      gradual_recovery: true,              // Gradually restore access
      recovery_steps: 5                    // Number of recovery steps
    },
    
    MANUAL_RECOVERY: {
      admin_unblock: true,                 // Admins can manually unblock
      user_appeal_process: true,           // Users can appeal blocks
      appeal_review_time: 1800000,         // 30 minutes for appeal review
      community_vouching: false            // Disabled for security
    }
  }
};

/**
 * Automated Response Engine
 */
export class AutomatedResponseEngine {
  constructor() {
    this.activeResponses = new Map();       // Currently active responses per IP/user
    this.responseHistory = new Map();       // Historical response data
    this.blockedIPs = new Map();           // Blocked IP addresses with metadata
    this.whitelist = new Set();            // Whitelisted IPs
    this.emergencyMode = false;            // Emergency mode flag
    this.tournamentMode = false;           // Tournament mode flag
    this.escalationQueue = [];             // Queue for manual review items
    
    this.startResponseLoop();
    this.initializeResponseStrategies();
  }

  /**
   * Main response decision and execution
   */
  async executeResponse(threatAnalysis, requestContext) {
    try {
      // Determine response strategy
      const responseStrategy = this.determineResponseStrategy(threatAnalysis, requestContext);
      
      // Check for emergency conditions
      if (this.shouldActivateEmergencyResponse(threatAnalysis)) {
        return await this.executeEmergencyResponse(threatAnalysis, requestContext);
      }
      
      // Execute graduated response
      const response = await this.executeGraduatedResponse(responseStrategy, requestContext);
      
      // Record response for analytics and learning
      this.recordResponse(response, threatAnalysis, requestContext);
      
      // Check for escalation
      if (response.should_escalate) {
        return await this.escalateResponse(response, requestContext);
      }
      
      return response;
      
    } catch (error) {
      console.error('Response execution error:', error);
      return this.createFailsafeResponse(requestContext);
    }
  }

  /**
   * Determine the appropriate response strategy
   */
  determineResponseStrategy(threatAnalysis, requestContext) {
    const ip = requestContext.ip;
    const userId = requestContext.userId;
    const userType = this.getUserType(requestContext);
    const endpoint = requestContext.path;
    
    // Get current response level for this IP/user
    const currentResponse = this.getActiveResponse(ip, userId);
    const responseHistory = this.getResponseHistory(ip, userId);
    
    // Calculate base response level from threat score
    let baseLevel = this.threatScoreToResponseLevel(threatAnalysis.overall_threat_score);
    
    // Apply gaming-specific modifiers
    baseLevel = this.applyGamingModifiers(baseLevel, endpoint, userType);
    
    // Apply escalation rules
    const escalatedLevel = this.applyEscalationRules(baseLevel, currentResponse, responseHistory);
    
    // Apply constraints (max levels, tournament mode, etc.)
    const finalLevel = this.applyResponseConstraints(escalatedLevel, userType, endpoint);
    
    return {
      level: finalLevel,
      base_level: baseLevel,
      escalated_level: escalatedLevel,
      ip,
      userId,
      userType,
      endpoint,
      threat_score: threatAnalysis.overall_threat_score,
      confidence: threatAnalysis.confidence || 0.8,
      reasoning: this.generateResponseReasoning(threatAnalysis, baseLevel, finalLevel)
    };
  }

  /**
   * Execute graduated response based on strategy
   */
  async executeGraduatedResponse(strategy, requestContext) {
    const levelConfig = RESPONSE_CONFIG.ESCALATION_LEVELS[strategy.level];
    const response = {
      strategy,
      level: strategy.level,
      actions_taken: [],
      timestamp: Date.now(),
      duration: levelConfig.duration,
      should_escalate: false,
      blocked: false,
      metadata: {}
    };

    // Execute each action in the response level
    for (const action of levelConfig.actions) {
      try {
        const actionResult = await this.executeAction(action, strategy, requestContext);
        response.actions_taken.push({
          action,
          result: actionResult,
          timestamp: Date.now()
        });
        
        // Track if this action blocks the request
        if (actionResult.blocks_request) {
          response.blocked = true;
        }
        
      } catch (error) {
        console.error(`Failed to execute action ${action}:`, error);
        response.actions_taken.push({
          action,
          result: { success: false, error: error.message },
          timestamp: Date.now()
        });
      }
    }

    // Update active responses
    this.updateActiveResponse(strategy.ip, strategy.userId, response);
    
    // Check if escalation is needed
    if (levelConfig.auto_escalate && this.shouldEscalate(strategy, response)) {
      response.should_escalate = true;
    }

    return response;
  }

  /**
   * Execute individual response actions
   */
  async executeAction(action, strategy, requestContext) {
    switch (action) {
      case 'LOG':
        return this.executeLogging(strategy, requestContext);
        
      case 'TRACK_METRICS':
        return this.executeMetricsTracking(strategy, requestContext);
        
      case 'APPLY_RATE_LIMIT':
        return this.executeRateLimiting(strategy, requestContext);
        
      case 'CAPTCHA_CHALLENGE':
        return this.executeCaptchaChallenge(strategy, requestContext);
        
      case 'ENHANCED_MONITORING':
        return this.executeEnhancedMonitoring(strategy, requestContext);
        
      case 'BLOCK_IP':
        return this.executeIPBlocking(strategy, requestContext);
        
      case 'ALERT_SECURITY':
        return this.executeSecurityAlert(strategy, requestContext);
        
      case 'ALERT_ADMINS':
        return this.executeAdminAlert(strategy, requestContext);
        
      case 'EMERGENCY_PROTOCOLS':
        return this.executeEmergencyProtocols(strategy, requestContext);
        
      default:
        console.warn(`Unknown response action: ${action}`);
        return { success: false, error: 'Unknown action' };
    }
  }

  /**
   * Action implementations
   */
  executeLogging(strategy, requestContext) {
    const logEntry = {
      timestamp: Date.now(),
      level: strategy.level,
      threat_score: strategy.threat_score,
      ip: strategy.ip,
      userId: strategy.userId,
      endpoint: strategy.endpoint,
      reasoning: strategy.reasoning
    };
    
    console.warn('DDoS Response Action:', logEntry);
    
    return { success: true, logged: true };
  }

  executeMetricsTracking(strategy, requestContext) {
    // Track metrics for analytics
    this.updateResponseMetrics(strategy);
    
    return { success: true, metrics_updated: true };
  }

  executeRateLimiting(strategy, requestContext) {
    const levelConfig = RESPONSE_CONFIG.ESCALATION_LEVELS[strategy.level];
    const limitFactor = levelConfig.rate_limit_factor || 0.5;
    
    // Apply rate limiting (integrate with existing rate limiter)
    this.applyDynamicRateLimit(strategy.ip, strategy.userId, limitFactor, levelConfig.duration);
    
    return { 
      success: true, 
      rate_limited: true, 
      factor: limitFactor,
      duration: levelConfig.duration,
      blocks_request: false // Rate limiting doesn't immediately block
    };
  }

  executeCaptchaChallenge(strategy, requestContext) {
    // Check if endpoint supports CAPTCHA
    const endpointConfig = RESPONSE_CONFIG.GAMING_RESPONSES.CRITICAL_ENDPOINTS[strategy.endpoint];
    if (endpointConfig && strategy.threat_score >= (endpointConfig.captcha_threshold || 0.7)) {
      
      // Generate CAPTCHA challenge
      const challengeId = this.generateCaptchaChallenge(strategy.ip, strategy.userId);
      
      return {
        success: true,
        captcha_required: true,
        challenge_id: challengeId,
        blocks_request: true, // CAPTCHA blocks until solved
        challenge_url: `/api/security/captcha/${challengeId}`
      };
    }
    
    return { success: true, captcha_skipped: true };
  }

  executeEnhancedMonitoring(strategy, requestContext) {
    // Add to enhanced monitoring list
    this.addToEnhancedMonitoring(strategy.ip, strategy.userId, {
      reason: 'DDoS response escalation',
      level: strategy.level,
      duration: RESPONSE_CONFIG.ESCALATION_LEVELS[strategy.level].duration
    });
    
    return { success: true, enhanced_monitoring: true };
  }

  executeIPBlocking(strategy, requestContext) {
    const duration = this.calculateBlockDuration(strategy);
    
    // Check if IP is whitelisted
    if (this.whitelist.has(strategy.ip)) {
      console.warn(`Attempted to block whitelisted IP: ${strategy.ip}`);
      return { success: false, reason: 'IP is whitelisted' };
    }
    
    // Apply IP block
    this.blockIP(strategy.ip, duration, {
      reason: 'DDoS protection',
      level: strategy.level,
      threat_score: strategy.threat_score,
      userId: strategy.userId,
      endpoint: strategy.endpoint
    });
    
    return {
      success: true,
      ip_blocked: true,
      duration: duration,
      blocks_request: true
    };
  }

  executeSecurityAlert(strategy, requestContext) {
    const alert = {
      type: 'DDOS_RESPONSE',
      severity: this.levelToSeverity(strategy.level),
      ip: strategy.ip,
      userId: strategy.userId,
      threat_score: strategy.threat_score,
      endpoint: strategy.endpoint,
      timestamp: Date.now()
    };
    
    // Send to security monitoring system
    this.sendSecurityAlert(alert);
    
    return { success: true, alert_sent: true };
  }

  executeAdminAlert(strategy, requestContext) {
    const alert = {
      type: 'CRITICAL_DDOS_EVENT',
      severity: 'HIGH',
      requires_attention: true,
      ip: strategy.ip,
      userId: strategy.userId,
      threat_score: strategy.threat_score,
      endpoint: strategy.endpoint,
      recommended_actions: strategy.reasoning.recommendations,
      timestamp: Date.now()
    };
    
    // Send immediate admin notification
    this.sendAdminAlert(alert);
    
    // Add to escalation queue for manual review
    this.escalationQueue.push({
      ...alert,
      strategy,
      requestContext
    });
    
    return { success: true, admin_alerted: true, queued_for_review: true };
  }

  executeEmergencyProtocols(strategy, requestContext) {
    // Activate emergency protocols
    this.activateEmergencyMode();
    
    // Block IP with maximum duration
    this.blockIP(strategy.ip, RESPONSE_CONFIG.BLOCKING.IP_BLOCKING.MAX_BLOCK_DURATION, {
      reason: 'Emergency DDoS protocol activation',
      emergency: true,
      requires_manual_review: true
    });
    
    // Alert all admins
    this.sendEmergencyAlert({
      type: 'EMERGENCY_DDOS_ACTIVATION',
      ip: strategy.ip,
      threat_score: strategy.threat_score,
      automatic_actions_taken: true
    });
    
    return {
      success: true,
      emergency_activated: true,
      ip_blocked: true,
      blocks_request: true,
      requires_manual_review: true
    };
  }

  /**
   * Emergency response handling
   */
  shouldActivateEmergencyResponse(threatAnalysis) {
    return (
      threatAnalysis.overall_threat_score >= 0.95 ||
      (threatAnalysis.coordination_analysis && threatAnalysis.coordination_analysis.coordinated) ||
      this.detectMassiveAttack(threatAnalysis)
    );
  }

  async executeEmergencyResponse(threatAnalysis, requestContext) {
    console.error('🚨 EMERGENCY DDOS RESPONSE ACTIVATED');
    
    // Immediate actions
    this.activateEmergencyMode();
    
    // Block the IP immediately
    this.blockIP(requestContext.ip, RESPONSE_CONFIG.BLOCKING.IP_BLOCKING.MAX_BLOCK_DURATION, {
      reason: 'Emergency DDoS response',
      threat_score: threatAnalysis.overall_threat_score,
      emergency: true
    });
    
    // Alert administrators immediately
    this.sendEmergencyAlert({
      type: 'CRITICAL_DDOS_ATTACK',
      threat_analysis: threatAnalysis,
      request_context: requestContext,
      immediate_action_required: true
    });
    
    return {
      emergency: true,
      blocked: true,
      level: 'EMERGENCY_BLOCK',
      actions_taken: ['EMERGENCY_IP_BLOCK', 'EMERGENCY_ALERT'],
      requires_immediate_attention: true
    };
  }

  /**
   * Escalation handling
   */
  async escalateResponse(currentResponse, requestContext) {
    const currentLevel = currentResponse.level;
    const nextLevel = this.getNextEscalationLevel(currentLevel);
    
    if (!nextLevel) {
      console.warn('Maximum escalation level reached');
      return currentResponse;
    }
    
    // Check if manual review is required
    const nextLevelConfig = RESPONSE_CONFIG.ESCALATION_LEVELS[nextLevel];
    if (nextLevelConfig.require_manual_review) {
      this.queueForManualReview(currentResponse, requestContext, nextLevel);
      return currentResponse;
    }
    
    // Auto-escalate
    const escalatedStrategy = {
      ...currentResponse.strategy,
      level: nextLevel
    };
    
    console.warn(`Auto-escalating response from ${currentLevel} to ${nextLevel} for IP: ${requestContext.ip}`);
    
    return await this.executeGraduatedResponse(escalatedStrategy, requestContext);
  }

  /**
   * Utility methods
   */
  threatScoreToResponseLevel(threatScore) {
    if (threatScore >= 0.9) return 'EMERGENCY_BLOCK';
    if (threatScore >= 0.8) return 'HARD_BLOCK';
    if (threatScore >= 0.6) return 'SOFT_BLOCK';
    if (threatScore >= 0.4) return 'RATE_LIMIT';
    return 'MONITOR';
  }

  applyGamingModifiers(level, endpoint, userType) {
    // Check if this is a critical gaming endpoint
    const endpointConfig = RESPONSE_CONFIG.GAMING_RESPONSES.CRITICAL_ENDPOINTS[endpoint];
    if (endpointConfig && endpointConfig.max_escalation_level) {
      const maxLevel = endpointConfig.max_escalation_level;
      if (this.levelToNumber(level) > this.levelToNumber(maxLevel)) {
        return maxLevel;
      }
    }
    
    // Apply user type modifiers
    const userConfig = RESPONSE_CONFIG.GAMING_RESPONSES.USER_TYPE_RESPONSES[userType];
    if (userConfig && userConfig.max_escalation_level) {
      const maxLevel = userConfig.max_escalation_level;
      if (this.levelToNumber(level) > this.levelToNumber(maxLevel)) {
        return maxLevel;
      }
    }
    
    // Tournament mode modifiers
    if (this.tournamentMode) {
      const tournamentConfig = RESPONSE_CONFIG.GAMING_RESPONSES.TOURNAMENT_MODE;
      if (tournamentConfig.enabled) {
        // Be more lenient during tournaments
        if (level === 'HARD_BLOCK' || level === 'EMERGENCY_BLOCK') {
          return 'SOFT_BLOCK';
        }
      }
    }
    
    return level;
  }

  applyEscalationRules(baseLevel, currentResponse, responseHistory) {
    if (!currentResponse) return baseLevel;
    
    // Check escalation threshold
    const currentLevelConfig = RESPONSE_CONFIG.ESCALATION_LEVELS[currentResponse.level];
    if (currentResponse.violation_count >= currentLevelConfig.escalate_threshold) {
      return this.getNextEscalationLevel(currentResponse.level) || baseLevel;
    }
    
    return Math.max(this.levelToNumber(baseLevel), this.levelToNumber(currentResponse.level));
  }

  applyResponseConstraints(level, userType, endpoint) {
    // Admin bypass
    const userConfig = RESPONSE_CONFIG.GAMING_RESPONSES.USER_TYPE_RESPONSES[userType];
    if (userConfig && userConfig.admin_bypass && userType === 'admin') {
      return 'MONITOR';
    }
    
    return level;
  }

  generateResponseReasoning(threatAnalysis, baseLevel, finalLevel) {
    return {
      threat_score: threatAnalysis.overall_threat_score,
      base_level: baseLevel,
      final_level: finalLevel,
      key_indicators: threatAnalysis.recommendations.slice(0, 3),
      recommendations: threatAnalysis.recommendations
    };
  }

  levelToNumber(level) {
    const levels = ['MONITOR', 'RATE_LIMIT', 'SOFT_BLOCK', 'HARD_BLOCK', 'EMERGENCY_BLOCK'];
    return levels.indexOf(level) + 1;
  }

  getNextEscalationLevel(currentLevel) {
    const levels = ['MONITOR', 'RATE_LIMIT', 'SOFT_BLOCK', 'HARD_BLOCK', 'EMERGENCY_BLOCK'];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  }

  getUserType(requestContext) {
    if (requestContext.user?.roles?.includes('admin')) return 'admin';
    if (requestContext.user?.subscription === 'premium') return 'premium';
    if (requestContext.userId) return 'authenticated';
    return 'anonymous';
  }

  /**
   * Helper methods (simplified implementations)
   */
  getActiveResponse(ip, userId) { return this.activeResponses.get(ip) || this.activeResponses.get(userId); }
  getResponseHistory(ip, userId) { return this.responseHistory.get(ip) || []; }
  updateActiveResponse(ip, userId, response) { this.activeResponses.set(ip, response); }
  updateResponseMetrics(strategy) { /* Update metrics */ }
  applyDynamicRateLimit(ip, userId, factor, duration) { /* Apply rate limit */ }
  generateCaptchaChallenge(ip, userId) { return Math.random().toString(36).substring(2); }
  addToEnhancedMonitoring(ip, userId, config) { /* Add to monitoring */ }
  calculateBlockDuration(strategy) { return RESPONSE_CONFIG.ESCALATION_LEVELS[strategy.level].duration; }
  blockIP(ip, duration, metadata) { 
    this.blockedIPs.set(ip, { 
      blocked_at: Date.now(), 
      duration, 
      ...metadata 
    }); 
  }
  levelToSeverity(level) { 
    const severities = { MONITOR: 'LOW', RATE_LIMIT: 'MEDIUM', SOFT_BLOCK: 'MEDIUM', HARD_BLOCK: 'HIGH', EMERGENCY_BLOCK: 'CRITICAL' };
    return severities[level] || 'MEDIUM';
  }
  sendSecurityAlert(alert) { console.log('Security Alert:', alert); }
  sendAdminAlert(alert) { console.log('Admin Alert:', alert); }
  sendEmergencyAlert(alert) { console.error('Emergency Alert:', alert); }
  activateEmergencyMode() { this.emergencyMode = true; }
  detectMassiveAttack(threatAnalysis) { return threatAnalysis.overall_threat_score >= 0.9; }
  queueForManualReview(response, context, nextLevel) { this.escalationQueue.push({ response, context, nextLevel }); }
  shouldEscalate(strategy, response) { return response.actions_taken.some(a => a.result.escalation_trigger); }
  
  createFailsafeResponse(requestContext) {
    return {
      emergency: true,
      level: 'MONITOR',
      actions_taken: [{ action: 'LOG', result: { success: true } }],
      blocked: false,
      failsafe: true
    };
  }

  /**
   * Background processing loop
   */
  startResponseLoop() {
    setInterval(() => {
      this.processEscalationQueue();
      this.cleanupExpiredResponses();
      this.processRecoveryRequests();
      this.updateEmergencyStatus();
    }, 60000); // Every minute
  }

  initializeResponseStrategies() {
    // Initialize any required response strategies
    console.log('Automated Response Engine initialized');
  }

  processEscalationQueue() {
    // Process items waiting for manual review
    while (this.escalationQueue.length > 0) {
      const item = this.escalationQueue.shift();
      console.log('Processing escalation queue item:', item);
      // In a real implementation, this would notify administrators
    }
  }

  cleanupExpiredResponses() {
    const now = Date.now();
    
    // Cleanup expired active responses
    for (const [key, response] of this.activeResponses.entries()) {
      if (now - response.timestamp > response.duration) {
        this.activeResponses.delete(key);
      }
    }
    
    // Cleanup expired IP blocks
    for (const [ip, blockInfo] of this.blockedIPs.entries()) {
      if (now - blockInfo.blocked_at > blockInfo.duration) {
        this.blockedIPs.delete(ip);
        console.log(`IP block expired for: ${ip}`);
      }
    }
  }

  processRecoveryRequests() {
    // Process automatic recovery for IPs with good behavior
    if (RESPONSE_CONFIG.RECOVERY.AUTOMATIC_RECOVERY.enabled) {
      // Implementation would check behavior and gradually restore access
    }
  }

  updateEmergencyStatus() {
    // Check if emergency mode should be deactivated
    if (this.emergencyMode) {
      // Implementation would check if threats have subsided
    }
  }

  /**
   * Public interface methods
   */
  isIPBlocked(ip) {
    return this.blockedIPs.has(ip);
  }

  getBlockInfo(ip) {
    return this.blockedIPs.get(ip);
  }

  manualUnblock(ip, adminId, reason) {
    if (this.blockedIPs.has(ip)) {
      this.blockedIPs.delete(ip);
      console.log(`Manual unblock by ${adminId}: ${ip} - ${reason}`);
      return true;
    }
    return false;
  }

  addToWhitelist(ip, reason) {
    this.whitelist.add(ip);
    console.log(`IP added to whitelist: ${ip} - ${reason}`);
  }

  removeFromWhitelist(ip) {
    this.whitelist.delete(ip);
    console.log(`IP removed from whitelist: ${ip}`);
  }

  activateTournamentMode() {
    this.tournamentMode = true;
    console.log('Tournament mode activated - more lenient DDoS responses');
  }

  deactivateTournamentMode() {
    this.tournamentMode = false;
    console.log('Tournament mode deactivated - normal DDoS responses');
  }

  getResponseStatistics() {
    return {
      active_responses: this.activeResponses.size,
      blocked_ips: this.blockedIPs.size,
      whitelisted_ips: this.whitelist.size,
      escalation_queue_size: this.escalationQueue.length,
      emergency_mode: this.emergencyMode,
      tournament_mode: this.tournamentMode
    };
  }
}

// Create singleton instance
export const automatedResponseEngine = new AutomatedResponseEngine();

/**
 * Response middleware for integration with request processing
 */
export const responseMiddleware = async (req, res, next) => {
  // Check if IP is blocked
  if (automatedResponseEngine.isIPBlocked(req.ip)) {
    const blockInfo = automatedResponseEngine.getBlockInfo(req.ip);
    return res.status(429).json({
      error: 'IP address is currently blocked',
      reason: blockInfo.reason,
      duration_remaining: blockInfo.duration - (Date.now() - blockInfo.blocked_at),
      code: 'IP_BLOCKED'
    });
  }
  
  next();
};

/**
 * Response execution function for threat analysis results
 */
export const executeResponseForThreat = async (threatAnalysis, requestContext) => {
  return await automatedResponseEngine.executeResponse(threatAnalysis, requestContext);
};

/**
 * Emergency response activation
 */
export const activateEmergencyResponse = (reason) => {
  automatedResponseEngine.activateEmergencyMode();
  console.error(`🚨 Emergency response activated: ${reason}`);
};

export { AutomatedResponseEngine };
export default automatedResponseEngine;