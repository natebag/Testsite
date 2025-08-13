/**
 * Gaming Authentication Security Monitor for MLG.clan Platform
 * Advanced security monitoring and rate limiting for gaming authentication
 * 
 * Features:
 * - Real-time authentication analytics and threat detection
 * - Gaming-optimized rate limiting with burst allowances
 * - Adaptive security based on gaming context
 * - Anomaly detection for suspicious gaming behavior
 * - Geographic and device-based security analysis
 * - Tournament security lockdown modes
 * 
 * @author Claude Code - Security and Performance Auditor
 * @version 2.0.0
 * @created 2025-08-13
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

/**
 * Gaming Auth Security Configuration
 */
const GAMING_AUTH_SECURITY_CONFIG = {
  // Rate Limiting Configuration
  RATE_LIMITS: {
    authentication: {
      standard: { requests: 10, window: 60000, burst: 5 }, // 10 per minute, 5 burst
      tournament: { requests: 20, window: 60000, burst: 10 }, // Higher limits for tournaments
      voting: { requests: 5, window: 300000, burst: 2 }, // 5 per 5 minutes for voting
      admin: { requests: 50, window: 60000, burst: 20 } // Higher limits for admin
    },
    wallet_operations: {
      connection: { requests: 15, window: 60000, burst: 5 },
      signing: { requests: 30, window: 60000, burst: 10 },
      transaction: { requests: 10, window: 300000, burst: 3 }
    },
    clan_operations: {
      join_requests: { requests: 3, window: 3600000, burst: 1 }, // 3 per hour
      role_changes: { requests: 5, window: 3600000, burst: 2 },
      invitations: { requests: 10, window: 3600000, burst: 3 }
    },
    chat_operations: {
      messages: { requests: 60, window: 60000, burst: 20 }, // 60 per minute
      moderation: { requests: 20, window: 60000, burst: 5 }
    }
  },
  
  // Threat Detection
  THREAT_DETECTION: {
    enabled: true,
    suspiciousPatterns: {
      rapidFireAuth: { threshold: 50, window: 30000 }, // 50 attempts in 30 seconds
      multipleFailures: { threshold: 10, window: 300000 }, // 10 failures in 5 minutes
      unusualGeoLocation: { enabled: true, allowVPN: false },
      deviceFingerprinting: { enabled: true, changeThreshold: 3 },
      tournamentBotDetection: { enabled: true, behaviorAnalysis: true }
    },
    autoActions: {
      temporaryLock: { duration: 900000 }, // 15 minutes
      requireMFA: { duration: 3600000 }, // 1 hour
      escalateToAdmin: { threshold: 3 }, // After 3 incidents
      emergencyLockdown: { enabled: true }
    }
  },
  
  // Gaming Context Security
  GAMING_SECURITY: {
    tournamentMode: {
      enhanced: true,
      strictDeviceValidation: true,
      sessionIsolation: true,
      antiCheatIntegration: true,
      realTimeMonitoring: true
    },
    votingMode: {
      walletValidation: true,
      transactionMonitoring: true,
      duplicateVoteDetection: true,
      coordinatedAttackDetection: true
    },
    clanMode: {
      hierarchyValidation: true,
      roleEscalationDetection: true,
      bulkOperationLimits: true
    }
  },
  
  // Performance and Monitoring
  MONITORING: {
    realTimeAlerts: true,
    metricsCollection: true,
    performanceThresholds: {
      authLatency: 200, // milliseconds
      rateLimitLatency: 10, // milliseconds
      threatDetectionLatency: 50 // milliseconds
    },
    retentionPeriods: {
      metrics: 30 * 24 * 60 * 60 * 1000, // 30 days
      incidents: 90 * 24 * 60 * 60 * 1000, // 90 days
      analytics: 365 * 24 * 60 * 60 * 1000 // 1 year
    }
  }
};

/**
 * Security Event Types
 */
const SECURITY_EVENTS = {
  RATE_LIMIT_HIT: 'rate_limit_hit',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  THREAT_DETECTED: 'threat_detected',
  SECURITY_INCIDENT: 'security_incident',
  ACCOUNT_LOCKED: 'account_locked',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  GEOGRAPHIC_ANOMALY: 'geographic_anomaly',
  DEVICE_ANOMALY: 'device_anomaly',
  TOURNAMENT_SECURITY: 'tournament_security',
  EMERGENCY_LOCKDOWN: 'emergency_lockdown'
};

/**
 * Gaming Authentication Security Monitor Class
 */
class GamingAuthSecurityMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.db = options.db;
    this.redis = options.redis;
    this.logger = options.logger || console;
    this.geoIP = options.geoIP; // Optional GeoIP service
    
    // Rate limiting storage
    this.rateLimitStore = new Map();
    this.rateLimitBuckets = new Map();
    
    // Security tracking
    this.securityIncidents = new Map();
    this.lockedAccounts = new Map();
    this.threatScores = new Map();
    this.deviceFingerprints = new Map();
    
    // Performance metrics
    this.metrics = {
      rateLimitChecks: [],
      threatDetections: [],
      securityIncidents: 0,
      accountLockouts: 0,
      falsePositives: 0,
      blockedRequests: 0,
      allowedRequests: 0
    };
    
    // Gaming context tracking
    this.activeTournaments = new Map();
    this.votingSessions = new Map();
    this.clanOperations = new Map();
    
    this.init();
  }
  
  async init() {
    this.logger.info('🛡️ Initializing Gaming Auth Security Monitor...');
    
    // Setup rate limiting cleanup
    this.setupRateLimitCleanup();
    
    // Setup security monitoring
    this.setupSecurityMonitoring();
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring();
    
    // Load security data from Redis
    await this.loadSecurityData();
    
    this.logger.info('✅ Gaming Auth Security Monitor initialized');
  }
  
  /**
   * Rate Limiting with Gaming Context
   */
  async checkRateLimit(identifier, operation, context = {}) {
    const startTime = Date.now();
    
    try {
      // Determine rate limit configuration based on context
      const rateLimitConfig = this.getRateLimitConfig(operation, context);
      
      // Create unique key for rate limiting
      const key = this.createRateLimitKey(identifier, operation, context);
      
      // Get current bucket state
      let bucket = this.rateLimitBuckets.get(key) || this.createNewBucket(rateLimitConfig);
      
      // Refill bucket based on time elapsed
      bucket = this.refillBucket(bucket, rateLimitConfig);
      
      // Check if request is allowed
      const allowed = this.isRequestAllowed(bucket, rateLimitConfig, context);
      
      if (allowed) {
        // Consume token from bucket
        bucket.tokens--;
        bucket.lastRequest = Date.now();
        this.metrics.allowedRequests++;
      } else {
        // Rate limit exceeded
        this.metrics.blockedRequests++;
        
        // Record rate limit hit
        await this.recordRateLimitHit(identifier, operation, context);
        
        this.emit(SECURITY_EVENTS.RATE_LIMIT_EXCEEDED, {
          identifier,
          operation,
          context,
          bucket: { ...bucket }
        });
      }
      
      // Update bucket
      this.rateLimitBuckets.set(key, bucket);
      
      const latency = Date.now() - startTime;
      this.metrics.rateLimitChecks.push(latency);
      
      return {
        allowed,
        remaining: bucket.tokens,
        resetTime: bucket.nextRefill,
        retryAfter: allowed ? null : this.calculateRetryAfter(bucket, rateLimitConfig)
      };
      
    } catch (error) {
      const latency = Date.now() - startTime;
      this.metrics.rateLimitChecks.push(latency);
      this.logger.error('Rate limit check failed:', error);
      
      // Fail open for performance, but log the error
      return { allowed: true, remaining: 1, resetTime: Date.now() + 60000 };
    }
  }
  
  /**
   * Threat Detection and Analysis
   */
  async detectThreats(userId, operation, context = {}) {
    const startTime = Date.now();
    
    try {
      const threats = [];
      
      // Get user threat score
      let threatScore = this.threatScores.get(userId) || 0;
      
      // Rapid fire authentication detection
      if (this.detectRapidFireAuth(userId, operation)) {
        threats.push({
          type: 'rapid_fire_auth',
          severity: 'medium',
          score: 25,
          description: 'Unusually high authentication frequency'
        });
      }
      
      // Multiple failure detection
      if (await this.detectMultipleFailures(userId)) {
        threats.push({
          type: 'multiple_failures',
          severity: 'high',
          score: 50,
          description: 'Multiple authentication failures'
        });
      }
      
      // Geographic anomaly detection
      if (context.ipAddress && await this.detectGeographicAnomaly(userId, context.ipAddress)) {
        threats.push({
          type: 'geographic_anomaly',
          severity: 'medium',
          score: 30,
          description: 'Unusual geographic location'
        });
      }
      
      // Device fingerprint anomaly
      if (context.deviceFingerprint && this.detectDeviceAnomaly(userId, context.deviceFingerprint)) {
        threats.push({
          type: 'device_anomaly',
          severity: 'high',
          score: 40,
          description: 'Unusual device fingerprint change'
        });
      }
      
      // Tournament bot detection
      if (context.tournament && this.detectTournamentBot(userId, context)) {
        threats.push({
          type: 'tournament_bot',
          severity: 'high',
          score: 60,
          description: 'Bot-like behavior in tournament'
        });
      }
      
      // Coordinated attack detection
      if (await this.detectCoordinatedAttack(userId, operation, context)) {
        threats.push({
          type: 'coordinated_attack',
          severity: 'critical',
          score: 80,
          description: 'Coordinated attack pattern detected'
        });
      }
      
      // Calculate new threat score
      const newThreats = threats.reduce((sum, threat) => sum + threat.score, 0);
      threatScore = Math.min(100, threatScore + newThreats);
      
      // Apply threat score decay
      threatScore = this.applyThreatScoreDecay(userId, threatScore);
      
      // Store updated threat score
      this.threatScores.set(userId, threatScore);
      
      // Determine if action is needed
      const actionRequired = await this.determineSecurityAction(userId, threatScore, threats);
      
      const latency = Date.now() - startTime;
      this.metrics.threatDetections.push(latency);
      
      return {
        threats,
        threatScore,
        actionRequired,
        latency
      };
      
    } catch (error) {
      const latency = Date.now() - startTime;
      this.metrics.threatDetections.push(latency);
      this.logger.error('Threat detection failed:', error);
      
      return {
        threats: [],
        threatScore: 0,
        actionRequired: null,
        latency
      };
    }
  }
  
  /**
   * Gaming Context Security Enforcement
   */
  async enforceGamingContextSecurity(userId, context) {
    try {
      if (context.tournament) {
        return await this.enforceTournamentSecurity(userId, context);
      }
      
      if (context.voting) {
        return await this.enforceVotingSecurity(userId, context);
      }
      
      if (context.clan) {
        return await this.enforceClanSecurity(userId, context);
      }
      
      return { allowed: true, checks: [] };
      
    } catch (error) {
      this.logger.error('Gaming context security enforcement failed:', error);
      return { allowed: false, reason: 'Security check failed' };
    }
  }
  
  async enforceTournamentSecurity(userId, context) {
    const config = GAMING_AUTH_SECURITY_CONFIG.GAMING_SECURITY.tournamentMode;
    const checks = [];
    
    // Enhanced device validation
    if (config.strictDeviceValidation) {
      const deviceValid = await this.validateTournamentDevice(userId, context);
      checks.push({ type: 'device_validation', passed: deviceValid });
      
      if (!deviceValid) {
        return { allowed: false, reason: 'Device validation failed', checks };
      }
    }
    
    // Session isolation check
    if (config.sessionIsolation) {
      const sessionIsolated = await this.checkSessionIsolation(userId, context);
      checks.push({ type: 'session_isolation', passed: sessionIsolated });
      
      if (!sessionIsolated) {
        return { allowed: false, reason: 'Session isolation required', checks };
      }
    }
    
    // Anti-cheat integration
    if (config.antiCheatIntegration) {
      const antiCheatPassed = await this.checkAntiCheat(userId, context);
      checks.push({ type: 'anti_cheat', passed: antiCheatPassed });
      
      if (!antiCheatPassed) {
        return { allowed: false, reason: 'Anti-cheat check failed', checks };
      }
    }
    
    return { allowed: true, checks };
  }
  
  async enforceVotingSecurity(userId, context) {
    const config = GAMING_AUTH_SECURITY_CONFIG.GAMING_SECURITY.votingMode;
    const checks = [];
    
    // Wallet validation
    if (config.walletValidation) {
      const walletValid = await this.validateVotingWallet(userId, context);
      checks.push({ type: 'wallet_validation', passed: walletValid });
      
      if (!walletValid) {
        return { allowed: false, reason: 'Wallet validation failed', checks };
      }
    }
    
    // Duplicate vote detection
    if (config.duplicateVoteDetection) {
      const isDuplicate = await this.checkDuplicateVote(userId, context);
      checks.push({ type: 'duplicate_vote', passed: !isDuplicate });
      
      if (isDuplicate) {
        return { allowed: false, reason: 'Duplicate vote detected', checks };
      }
    }
    
    // Coordinated attack detection for voting
    if (config.coordinatedAttackDetection) {
      const isCoordinated = await this.checkCoordinatedVoting(userId, context);
      checks.push({ type: 'coordinated_attack', passed: !isCoordinated });
      
      if (isCoordinated) {
        return { allowed: false, reason: 'Coordinated voting attack detected', checks };
      }
    }
    
    return { allowed: true, checks };
  }
  
  async enforceClanSecurity(userId, context) {
    const config = GAMING_AUTH_SECURITY_CONFIG.GAMING_SECURITY.clanMode;
    const checks = [];
    
    // Hierarchy validation
    if (config.hierarchyValidation) {
      const hierarchyValid = await this.validateClanHierarchy(userId, context);
      checks.push({ type: 'hierarchy_validation', passed: hierarchyValid });
      
      if (!hierarchyValid) {
        return { allowed: false, reason: 'Clan hierarchy validation failed', checks };
      }
    }
    
    // Role escalation detection
    if (config.roleEscalationDetection) {
      const isEscalation = await this.detectRoleEscalation(userId, context);
      checks.push({ type: 'role_escalation', passed: !isEscalation });
      
      if (isEscalation) {
        return { allowed: false, reason: 'Unauthorized role escalation detected', checks };
      }
    }
    
    // Bulk operation limits
    if (config.bulkOperationLimits && context.bulkOperation) {
      const bulkAllowed = await this.checkBulkOperationLimits(userId, context);
      checks.push({ type: 'bulk_operation', passed: bulkAllowed });
      
      if (!bulkAllowed) {
        return { allowed: false, reason: 'Bulk operation limit exceeded', checks };
      }
    }
    
    return { allowed: true, checks };
  }
  
  /**
   * Security Actions and Responses
   */
  async takeSecurityAction(userId, actionType, context = {}) {
    try {
      switch (actionType) {
        case 'temporary_lock':
          await this.temporarilyLockAccount(userId, context);
          break;
        case 'require_mfa':
          await this.requireMFA(userId, context);
          break;
        case 'escalate_to_admin':
          await this.escalateToAdmin(userId, context);
          break;
        case 'emergency_lockdown':
          await this.emergencyLockdown(userId, context);
          break;
        default:
          this.logger.warn(`Unknown security action: ${actionType}`);
      }
      
      this.emit(SECURITY_EVENTS.SECURITY_INCIDENT, {
        userId,
        actionType,
        context,
        timestamp: new Date()
      });
      
    } catch (error) {
      this.logger.error(`Security action failed: ${actionType}`, error);
    }
  }
  
  async temporarilyLockAccount(userId, context) {
    const duration = GAMING_AUTH_SECURITY_CONFIG.THREAT_DETECTION.autoActions.temporaryLock.duration;
    const lockData = {
      userId,
      lockedAt: new Date(),
      expiresAt: new Date(Date.now() + duration),
      reason: 'Temporary security lock due to suspicious activity',
      context
    };
    
    this.lockedAccounts.set(userId, lockData);
    
    // Store in Redis for persistence
    if (this.redis) {
      await this.redis.setex(
        `security_lock:${userId}`,
        Math.floor(duration / 1000),
        JSON.stringify(lockData)
      );
    }
    
    this.metrics.accountLockouts++;
    
    this.emit(SECURITY_EVENTS.ACCOUNT_LOCKED, {
      userId,
      duration,
      reason: lockData.reason
    });
    
    this.logger.warn(`🔒 Temporarily locked account ${userId} for ${duration}ms`);
  }
  
  async isAccountLocked(userId) {
    // Check memory first
    let lockData = this.lockedAccounts.get(userId);
    
    if (!lockData && this.redis) {
      // Check Redis
      const redisData = await this.redis.get(`security_lock:${userId}`);
      if (redisData) {
        lockData = JSON.parse(redisData);
        this.lockedAccounts.set(userId, lockData);
      }
    }
    
    if (!lockData) {
      return { locked: false };
    }
    
    // Check if lock has expired
    if (new Date(lockData.expiresAt) < new Date()) {
      this.lockedAccounts.delete(userId);
      if (this.redis) {
        await this.redis.del(`security_lock:${userId}`);
      }
      return { locked: false };
    }
    
    return {
      locked: true,
      reason: lockData.reason,
      expiresAt: lockData.expiresAt,
      remainingTime: new Date(lockData.expiresAt) - new Date()
    };
  }
  
  /**
   * Helper Methods
   */
  
  getRateLimitConfig(operation, context) {
    // Determine which rate limit config to use based on operation and context
    if (context.tournament) {
      return GAMING_AUTH_SECURITY_CONFIG.RATE_LIMITS.authentication.tournament;
    }
    
    if (context.voting) {
      return GAMING_AUTH_SECURITY_CONFIG.RATE_LIMITS.authentication.voting;
    }
    
    if (context.admin) {
      return GAMING_AUTH_SECURITY_CONFIG.RATE_LIMITS.authentication.admin;
    }
    
    // Look for specific operation configs
    for (const [category, operations] of Object.entries(GAMING_AUTH_SECURITY_CONFIG.RATE_LIMITS)) {
      if (operations[operation]) {
        return operations[operation];
      }
    }
    
    // Default to standard authentication limits
    return GAMING_AUTH_SECURITY_CONFIG.RATE_LIMITS.authentication.standard;
  }
  
  createRateLimitKey(identifier, operation, context) {
    const contextKeys = [];
    
    if (context.tournament) contextKeys.push(`t:${context.tournamentId}`);
    if (context.clan) contextKeys.push(`c:${context.clanId}`);
    if (context.voting) contextKeys.push(`v:${context.proposalId}`);
    
    return `rate_limit:${identifier}:${operation}:${contextKeys.join(':')}`;
  }
  
  createNewBucket(config) {
    return {
      tokens: config.requests,
      maxTokens: config.requests,
      refillRate: config.requests / (config.window / 1000), // tokens per second
      lastRefill: Date.now(),
      nextRefill: Date.now() + config.window,
      burst: config.burst || 0,
      lastRequest: 0
    };
  }
  
  refillBucket(bucket, config) {
    const now = Date.now();
    const timeSinceRefill = now - bucket.lastRefill;
    
    if (timeSinceRefill > 0) {
      const tokensToAdd = Math.floor((timeSinceRefill / 1000) * bucket.refillRate);
      bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
      
      // Update next refill time
      if (bucket.tokens < bucket.maxTokens) {
        const timeToFull = ((bucket.maxTokens - bucket.tokens) / bucket.refillRate) * 1000;
        bucket.nextRefill = now + timeToFull;
      } else {
        bucket.nextRefill = now + config.window;
      }
    }
    
    return bucket;
  }
  
  isRequestAllowed(bucket, config, context) {
    // Check if we have tokens
    if (bucket.tokens > 0) {
      return true;
    }
    
    // Check burst allowance for gaming contexts
    if (context.gaming && bucket.burst > 0) {
      const timeSinceLastRequest = Date.now() - bucket.lastRequest;
      if (timeSinceLastRequest < 1000) { // Within 1 second
        bucket.burst--;
        return true;
      }
    }
    
    return false;
  }
  
  calculateRetryAfter(bucket, config) {
    if (bucket.tokens > 0) return 0;
    
    const timeToNextToken = ((1 / bucket.refillRate) * 1000);
    return Math.ceil(timeToNextToken);
  }
  
  detectRapidFireAuth(userId, operation) {
    // Implementation for rapid fire detection
    const threshold = GAMING_AUTH_SECURITY_CONFIG.THREAT_DETECTION.suspiciousPatterns.rapidFireAuth;
    // Would check recent authentication attempts
    return false; // Placeholder
  }
  
  async detectMultipleFailures(userId) {
    // Implementation for multiple failure detection
    const threshold = GAMING_AUTH_SECURITY_CONFIG.THREAT_DETECTION.suspiciousPatterns.multipleFailures;
    // Would check recent failed attempts
    return false; // Placeholder
  }
  
  async detectGeographicAnomaly(userId, ipAddress) {
    if (!this.geoIP) return false;
    
    try {
      // Get location for IP
      const location = await this.geoIP.lookup(ipAddress);
      
      // Compare with user's typical locations
      const userLocations = await this.getUserTypicalLocations(userId);
      
      // Check if this is an unusual location
      return this.isUnusualLocation(location, userLocations);
    } catch (error) {
      this.logger.error('Geographic anomaly detection failed:', error);
      return false;
    }
  }
  
  detectDeviceAnomaly(userId, deviceFingerprint) {
    const userFingerprints = this.deviceFingerprints.get(userId) || [];
    
    // Check if this fingerprint is significantly different
    const threshold = GAMING_AUTH_SECURITY_CONFIG.THREAT_DETECTION.suspiciousPatterns.deviceFingerprinting.changeThreshold;
    
    if (userFingerprints.length === 0) {
      // First time seeing this user, store the fingerprint
      this.deviceFingerprints.set(userId, [deviceFingerprint]);
      return false;
    }
    
    // Check similarity with known fingerprints
    const similarity = this.calculateFingerprintSimilarity(deviceFingerprint, userFingerprints);
    
    if (similarity < threshold) {
      // Add new fingerprint if it's legitimate
      userFingerprints.push(deviceFingerprint);
      this.deviceFingerprints.set(userId, userFingerprints.slice(-5)); // Keep last 5
      return true;
    }
    
    return false;
  }
  
  applyThreatScoreDecay(userId, currentScore) {
    // Apply time-based decay to threat scores
    const decayRate = 0.1; // 10% decay per check
    return Math.max(0, currentScore - decayRate);
  }
  
  async determineSecurityAction(userId, threatScore, threats) {
    const config = GAMING_AUTH_SECURITY_CONFIG.THREAT_DETECTION.autoActions;
    
    if (threatScore >= 80) {
      return { action: 'emergency_lockdown', reason: 'Critical threat score' };
    } else if (threatScore >= 60) {
      return { action: 'escalate_to_admin', reason: 'High threat score' };
    } else if (threatScore >= 40) {
      return { action: 'require_mfa', reason: 'Elevated threat score' };
    } else if (threatScore >= 25) {
      return { action: 'temporary_lock', reason: 'Moderate threat score' };
    }
    
    return null;
  }
  
  setupRateLimitCleanup() {
    this.rateLimitCleanupInterval = setInterval(() => {
      const now = Date.now();
      
      for (const [key, bucket] of this.rateLimitBuckets) {
        // Remove buckets that haven't been used recently
        if (now - bucket.lastRequest > 3600000) { // 1 hour
          this.rateLimitBuckets.delete(key);
        }
      }
    }, 300000); // Every 5 minutes
  }
  
  setupSecurityMonitoring() {
    this.securityMonitoringInterval = setInterval(() => {
      this.performSecurityAnalysis();
    }, 60000); // Every minute
  }
  
  setupPerformanceMonitoring() {
    this.performanceInterval = setInterval(() => {
      const avgRateLimit = this.getAverageLatency(this.metrics.rateLimitChecks);
      const avgThreatDetection = this.getAverageLatency(this.metrics.threatDetections);
      
      this.logger.debug(`🛡️ Security metrics: ${avgRateLimit}ms rate limit, ${avgThreatDetection}ms threat detection`);
      
      // Clear old metrics
      this.metrics.rateLimitChecks = this.metrics.rateLimitChecks.slice(-100);
      this.metrics.threatDetections = this.metrics.threatDetections.slice(-100);
    }, 30000); // Every 30 seconds
  }
  
  performSecurityAnalysis() {
    // Analyze security metrics and trends
    const activeThreats = Array.from(this.threatScores.values()).filter(score => score > 25).length;
    const activeLocks = this.lockedAccounts.size;
    
    if (activeThreats > 10) {
      this.emit(SECURITY_EVENTS.EMERGENCY_LOCKDOWN, {
        reason: 'High number of active threats',
        activeThreats,
        activeLocks
      });
    }
  }
  
  async loadSecurityData() {
    if (!this.redis) return;
    
    try {
      // Load locked accounts
      const lockKeys = await this.redis.keys('security_lock:*');
      for (const key of lockKeys) {
        const lockData = await this.redis.get(key);
        if (lockData) {
          const data = JSON.parse(lockData);
          this.lockedAccounts.set(data.userId, data);
        }
      }
      
      this.logger.info(`🔒 Loaded ${lockKeys.length} security locks from Redis`);
    } catch (error) {
      this.logger.error('Failed to load security data:', error);
    }
  }
  
  getAverageLatency(metrics) {
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, latency) => sum + latency, 0) / metrics.length;
  }
  
  getSecurityMetrics() {
    return {
      averageRateLimitLatency: this.getAverageLatency(this.metrics.rateLimitChecks),
      averageThreatDetectionLatency: this.getAverageLatency(this.metrics.threatDetections),
      activeThreats: Array.from(this.threatScores.values()).filter(score => score > 25).length,
      activeLocks: this.lockedAccounts.size,
      securityIncidents: this.metrics.securityIncidents,
      accountLockouts: this.metrics.accountLockouts,
      blockedRequests: this.metrics.blockedRequests,
      allowedRequests: this.metrics.allowedRequests,
      rateLimitBuckets: this.rateLimitBuckets.size
    };
  }
  
  // Cleanup method
  destroy() {
    if (this.rateLimitCleanupInterval) {
      clearInterval(this.rateLimitCleanupInterval);
    }
    
    if (this.securityMonitoringInterval) {
      clearInterval(this.securityMonitoringInterval);
    }
    
    if (this.performanceInterval) {
      clearInterval(this.performanceInterval);
    }
    
    this.logger.info('🛡️ Gaming Auth Security Monitor destroyed');
  }
}

export default GamingAuthSecurityMonitor;
export { GAMING_AUTH_SECURITY_CONFIG, SECURITY_EVENTS };