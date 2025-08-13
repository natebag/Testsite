/**
 * Gaming Session Manager for MLG.clan Platform
 * Enhanced session management with gaming-specific features and cross-device sync
 * 
 * Features:
 * - Gaming session persistence across devices
 * - Tournament mode enhanced session security
 * - Clan management session controls
 * - Real-time gaming session tracking
 * - Gaming activity-based session expiration
 * - Cross-device session synchronization
 * - Gaming performance optimizations
 * 
 * @author Claude Code - Security and Performance Auditor
 * @version 2.0.0
 * @created 2025-08-13
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';

/**
 * Gaming Session Configuration
 */
const GAMING_SESSION_CONFIG = {
  // Session Types and Durations
  SESSION_TYPES: {
    standard: {
      name: 'Standard Gaming',
      duration: 4 * 60 * 60 * 1000, // 4 hours
      activityTimeout: 30 * 60 * 1000, // 30 minutes
      maxDevices: 3,
      allowConcurrent: true
    },
    tournament: {
      name: 'Tournament Mode',
      duration: 8 * 60 * 60 * 1000, // 8 hours
      activityTimeout: 60 * 60 * 1000, // 1 hour
      maxDevices: 2,
      allowConcurrent: false,
      requireMFA: true
    },
    clan: {
      name: 'Clan Management',
      duration: 24 * 60 * 60 * 1000, // 24 hours
      activityTimeout: 2 * 60 * 60 * 1000, // 2 hours
      maxDevices: 5,
      allowConcurrent: true
    },
    voting: {
      name: 'Voting Session',
      duration: 60 * 60 * 1000, // 1 hour
      activityTimeout: 15 * 60 * 1000, // 15 minutes
      maxDevices: 1,
      allowConcurrent: false,
      requireWallet: true
    },
    admin: {
      name: 'Admin Session',
      duration: 2 * 60 * 60 * 1000, // 2 hours
      activityTimeout: 30 * 60 * 1000, // 30 minutes
      maxDevices: 2,
      allowConcurrent: false,
      requireMFA: true
    }
  },
  
  // Security Settings
  SECURITY: {
    sessionEncryption: true,
    deviceFingerprinting: true,
    ipValidation: true,
    userAgentValidation: false, // Can change during updates
    sessionRotation: 24 * 60 * 60 * 1000, // 24 hours
    suspiciousActivityThreshold: 5,
    geoLocationValidation: false // Optional feature
  },
  
  // Performance Settings
  PERFORMANCE: {
    sessionLookupTarget: 50, // milliseconds
    cacheHitTarget: 0.9, // 90%
    cleanupInterval: 15 * 60 * 1000, // 15 minutes
    metricsInterval: 30 * 1000, // 30 seconds
    batchSize: 100 // For bulk operations
  },
  
  // Cross-device Synchronization
  SYNC: {
    enabled: true,
    conflictResolution: 'latest_wins',
    syncInterval: 30 * 1000, // 30 seconds
    maxSyncRetries: 3,
    syncTimeout: 5000 // 5 seconds
  }
};

/**
 * Session Event Types
 */
const SESSION_EVENTS = {
  CREATED: 'session_created',
  UPDATED: 'session_updated',
  EXPIRED: 'session_expired',
  REVOKED: 'session_revoked',
  DEVICE_ADDED: 'device_added',
  DEVICE_REMOVED: 'device_removed',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  SYNC_CONFLICT: 'sync_conflict',
  PERFORMANCE_WARNING: 'performance_warning'
};

/**
 * Gaming Session Manager Class
 */
class GamingSessionManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.db = options.db;
    this.redis = options.redis;
    this.logger = options.logger || console;
    this.encryptionKey = options.encryptionKey || this.generateEncryptionKey();
    
    // Session storage
    this.activeSessions = new Map(); // Memory cache
    this.sessionMetrics = new Map(); // Performance metrics
    this.deviceSessions = new Map(); // Device to session mapping
    this.userSessions = new Map(); // User to sessions mapping
    
    // Performance monitoring
    this.metrics = {
      lookupTimes: [],
      cacheHits: 0,
      cacheMisses: 0,
      activeSessionCount: 0,
      sessionCreations: 0,
      sessionRevocations: 0
    };
    
    this.init();
  }
  
  async init() {
    this.logger.info('🎮 Initializing Gaming Session Manager...');
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring();
    
    // Setup session cleanup
    this.setupSessionCleanup();
    
    // Setup cross-device synchronization
    if (GAMING_SESSION_CONFIG.SYNC.enabled) {
      this.setupCrossDeviceSync();
    }
    
    // Load existing sessions from Redis
    await this.loadExistingSessions();
    
    this.logger.info('✅ Gaming Session Manager initialized');
  }
  
  /**
   * Create Gaming Session
   */
  async createSession(userId, sessionType = 'standard', options = {}) {
    const startTime = Date.now();
    
    try {
      const sessionConfig = GAMING_SESSION_CONFIG.SESSION_TYPES[sessionType];
      if (!sessionConfig) {
        throw new Error(`Unknown session type: ${sessionType}`);
      }
      
      const sessionId = uuidv4();
      const deviceId = options.deviceId || this.generateDeviceId(options);
      
      // Check existing sessions for the user
      await this.enforceSessionLimits(userId, sessionType, deviceId);
      
      // Create session data
      const sessionData = {
        sessionId,
        userId,
        sessionType,
        deviceId,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + sessionConfig.duration),
        lastActivity: new Date(),
        lastSyncAt: new Date(),
        
        // Security data
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        deviceFingerprint: this.generateDeviceFingerprint(options),
        
        // Gaming context
        gameContext: {
          tournamentId: options.tournamentId,
          clanId: options.clanId,
          votingProposalId: options.votingProposalId,
          gameMode: options.gameMode
        },
        
        // Session state
        active: true,
        authenticated: true,
        mfaVerified: options.mfaVerified || false,
        walletConnected: options.walletConnected || false,
        
        // Activity tracking
        activityCount: 1,
        lastActivityType: 'session_created',
        suspiciousActivityCount: 0,
        
        // Device information
        deviceInfo: {
          platform: options.platform,
          browser: options.browser,
          version: options.version,
          mobile: options.mobile || false
        }
      };
      
      // Encrypt sensitive data if enabled
      if (GAMING_SESSION_CONFIG.SECURITY.sessionEncryption) {
        sessionData.encrypted = this.encryptSessionData(sessionData);
      }
      
      // Store in memory cache
      this.activeSessions.set(sessionId, sessionData);
      
      // Store in Redis for persistence
      if (this.redis) {
        await this.redis.setex(
          `gaming_session:${sessionId}`,
          Math.floor(sessionConfig.duration / 1000),
          JSON.stringify(sessionData)
        );
      }
      
      // Update mappings
      this.updateSessionMappings(userId, sessionId, deviceId, sessionData);
      
      // Generate session token
      const sessionToken = this.generateSessionToken(sessionData);
      
      // Update metrics
      this.metrics.sessionCreations++;
      this.metrics.activeSessionCount = this.activeSessions.size;
      
      // Record performance
      const latency = Date.now() - startTime;
      this.metrics.lookupTimes.push(latency);
      
      // Emit event
      this.emit(SESSION_EVENTS.CREATED, {
        sessionId,
        userId,
        sessionType,
        deviceId,
        latency
      });
      
      this.logger.info(`🎮 Created ${sessionType} session for user ${userId} (${latency}ms)`);
      
      return {
        sessionId,
        sessionToken,
        expiresAt: sessionData.expiresAt,
        sessionType,
        deviceId
      };
      
    } catch (error) {
      const latency = Date.now() - startTime;
      this.metrics.lookupTimes.push(latency);
      this.logger.error('Session creation failed:', error);
      throw error;
    }
  }
  
  /**
   * Validate Gaming Session
   */
  async validateSession(sessionToken, options = {}) {
    const startTime = Date.now();
    
    try {
      // Decode session token
      const tokenData = this.decodeSessionToken(sessionToken);
      if (!tokenData || !tokenData.sessionId) {
        throw new Error('Invalid session token');
      }
      
      const sessionId = tokenData.sessionId;
      
      // Try memory cache first
      let sessionData = this.activeSessions.get(sessionId);
      let fromCache = true;
      
      if (!sessionData) {
        // Try Redis
        if (this.redis) {
          const redisData = await this.redis.get(`gaming_session:${sessionId}`);
          if (redisData) {
            sessionData = JSON.parse(redisData);
            this.activeSessions.set(sessionId, sessionData); // Cache in memory
            fromCache = false;
          }
        }
      }
      
      if (!sessionData) {
        this.metrics.cacheMisses++;
        throw new Error('Session not found');
      }
      
      if (fromCache) {
        this.metrics.cacheHits++;
      } else {
        this.metrics.cacheMisses++;
      }
      
      // Validate session
      if (!sessionData.active) {
        throw new Error('Session is inactive');
      }
      
      if (new Date(sessionData.expiresAt) < new Date()) {
        await this.revokeSession(sessionId, 'expired');
        throw new Error('Session expired');
      }
      
      // Check activity timeout
      const sessionConfig = GAMING_SESSION_CONFIG.SESSION_TYPES[sessionData.sessionType];
      const inactiveTime = Date.now() - new Date(sessionData.lastActivity).getTime();
      
      if (inactiveTime > sessionConfig.activityTimeout) {
        await this.revokeSession(sessionId, 'inactive');
        throw new Error('Session timeout due to inactivity');
      }
      
      // Validate device fingerprint if enabled
      if (GAMING_SESSION_CONFIG.SECURITY.deviceFingerprinting && options.deviceFingerprint) {
        if (sessionData.deviceFingerprint !== options.deviceFingerprint) {
          this.recordSuspiciousActivity(sessionId, 'device_fingerprint_mismatch');
        }
      }
      
      // Validate IP address if enabled
      if (GAMING_SESSION_CONFIG.SECURITY.ipValidation && options.ipAddress) {
        if (sessionData.ipAddress !== options.ipAddress) {
          this.recordSuspiciousActivity(sessionId, 'ip_address_changed');
        }
      }
      
      // Update activity
      await this.updateSessionActivity(sessionId, options.activityType || 'validation');
      
      const latency = Date.now() - startTime;
      this.metrics.lookupTimes.push(latency);
      
      // Check performance target
      if (latency > GAMING_SESSION_CONFIG.PERFORMANCE.sessionLookupTarget) {
        this.emit(SESSION_EVENTS.PERFORMANCE_WARNING, {
          type: 'slow_lookup',
          sessionId,
          latency,
          target: GAMING_SESSION_CONFIG.PERFORMANCE.sessionLookupTarget
        });
      }
      
      return {
        valid: true,
        session: sessionData,
        latency
      };
      
    } catch (error) {
      const latency = Date.now() - startTime;
      this.metrics.lookupTimes.push(latency);
      throw error;
    }
  }
  
  /**
   * Update Session Activity
   */
  async updateSessionActivity(sessionId, activityType = 'general', context = {}) {
    const sessionData = this.activeSessions.get(sessionId);
    if (!sessionData) {
      return false;
    }
    
    // Update activity data
    sessionData.lastActivity = new Date();
    sessionData.lastActivityType = activityType;
    sessionData.activityCount++;
    
    // Update game context if provided
    if (context.tournamentId) {
      sessionData.gameContext.tournamentId = context.tournamentId;
    }
    if (context.clanId) {
      sessionData.gameContext.clanId = context.clanId;
    }
    if (context.gameMode) {
      sessionData.gameContext.gameMode = context.gameMode;
    }
    
    // Sync to Redis
    if (this.redis) {
      const sessionConfig = GAMING_SESSION_CONFIG.SESSION_TYPES[sessionData.sessionType];
      await this.redis.setex(
        `gaming_session:${sessionId}`,
        Math.floor(sessionConfig.duration / 1000),
        JSON.stringify(sessionData)
      );
    }
    
    // Emit update event
    this.emit(SESSION_EVENTS.UPDATED, {
      sessionId,
      activityType,
      context
    });
    
    return true;
  }
  
  /**
   * Revoke Gaming Session
   */
  async revokeSession(sessionId, reason = 'manual') {
    const sessionData = this.activeSessions.get(sessionId);
    if (!sessionData) {
      return false;
    }
    
    // Mark as inactive
    sessionData.active = false;
    sessionData.revokedAt = new Date();
    sessionData.revocationReason = reason;
    
    // Remove from memory cache
    this.activeSessions.delete(sessionId);
    
    // Remove from Redis
    if (this.redis) {
      await this.redis.del(`gaming_session:${sessionId}`);
    }
    
    // Update mappings
    this.removeSessionMappings(sessionData.userId, sessionId, sessionData.deviceId);
    
    // Update metrics
    this.metrics.sessionRevocations++;
    this.metrics.activeSessionCount = this.activeSessions.size;
    
    // Emit event
    this.emit(SESSION_EVENTS.REVOKED, {
      sessionId,
      userId: sessionData.userId,
      reason
    });
    
    this.logger.info(`❌ Revoked session ${sessionId} for user ${sessionData.userId} (${reason})`);
    
    return true;
  }
  
  /**
   * Revoke All User Sessions
   */
  async revokeAllUserSessions(userId, reason = 'security') {
    const userSessions = this.userSessions.get(userId) || new Set();
    const revokedCount = userSessions.size;
    
    for (const sessionId of userSessions) {
      await this.revokeSession(sessionId, reason);
    }
    
    this.logger.info(`🔒 Revoked ${revokedCount} sessions for user ${userId}`);
    return revokedCount;
  }
  
  /**
   * Cross-Device Session Management
   */
  async syncSessionAcrossDevices(userId, sessionId, syncData) {
    if (!GAMING_SESSION_CONFIG.SYNC.enabled) {
      return false;
    }
    
    const userSessions = this.userSessions.get(userId) || new Set();
    
    for (const otherSessionId of userSessions) {
      if (otherSessionId !== sessionId) {
        const otherSession = this.activeSessions.get(otherSessionId);
        if (otherSession && otherSession.active) {
          // Apply sync data
          if (syncData.gameContext) {
            Object.assign(otherSession.gameContext, syncData.gameContext);
          }
          
          otherSession.lastSyncAt = new Date();
          
          // Update in Redis
          if (this.redis) {
            const sessionConfig = GAMING_SESSION_CONFIG.SESSION_TYPES[otherSession.sessionType];
            await this.redis.setex(
              `gaming_session:${otherSessionId}`,
              Math.floor(sessionConfig.duration / 1000),
              JSON.stringify(otherSession)
            );
          }
        }
      }
    }
    
    return true;
  }
  
  /**
   * Get User Sessions
   */
  getUserSessions(userId) {
    const userSessions = this.userSessions.get(userId) || new Set();
    const sessions = [];
    
    for (const sessionId of userSessions) {
      const sessionData = this.activeSessions.get(sessionId);
      if (sessionData && sessionData.active) {
        sessions.push({
          sessionId,
          sessionType: sessionData.sessionType,
          deviceId: sessionData.deviceId,
          createdAt: sessionData.createdAt,
          lastActivity: sessionData.lastActivity,
          deviceInfo: sessionData.deviceInfo
        });
      }
    }
    
    return sessions;
  }
  
  /**
   * Helper Methods
   */
  
  generateDeviceId(options = {}) {
    const deviceInfo = [
      options.userAgent || '',
      options.platform || '',
      options.ipAddress || '',
      Date.now().toString()
    ].join('|');
    
    return crypto.createHash('sha256').update(deviceInfo).digest('hex').slice(0, 16);
  }
  
  generateDeviceFingerprint(options = {}) {
    if (!GAMING_SESSION_CONFIG.SECURITY.deviceFingerprinting) {
      return null;
    }
    
    const fingerprintData = [
      options.userAgent || '',
      options.platform || '',
      options.screenResolution || '',
      options.timezone || '',
      options.language || ''
    ].join('|');
    
    return crypto.createHash('md5').update(fingerprintData).digest('hex');
  }
  
  generateSessionToken(sessionData) {
    const tokenPayload = {
      sessionId: sessionData.sessionId,
      userId: sessionData.userId,
      sessionType: sessionData.sessionType,
      deviceId: sessionData.deviceId,
      createdAt: sessionData.createdAt,
      expiresAt: sessionData.expiresAt
    };
    
    return jwt.sign(tokenPayload, this.encryptionKey, {
      algorithm: 'HS256',
      expiresIn: Math.floor((sessionData.expiresAt - Date.now()) / 1000)
    });
  }
  
  decodeSessionToken(sessionToken) {
    try {
      return jwt.verify(sessionToken, this.encryptionKey);
    } catch (error) {
      return null;
    }
  }
  
  encryptSessionData(sessionData) {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, this.encryptionKey);
    
    let encrypted = cipher.update(JSON.stringify(sessionData), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      algorithm
    };
  }
  
  generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
  }
  
  updateSessionMappings(userId, sessionId, deviceId, sessionData) {
    // User to sessions mapping
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId).add(sessionId);
    
    // Device to session mapping
    this.deviceSessions.set(deviceId, sessionId);
  }
  
  removeSessionMappings(userId, sessionId, deviceId) {
    // Remove from user sessions
    if (this.userSessions.has(userId)) {
      this.userSessions.get(userId).delete(sessionId);
      if (this.userSessions.get(userId).size === 0) {
        this.userSessions.delete(userId);
      }
    }
    
    // Remove from device sessions
    this.deviceSessions.delete(deviceId);
  }
  
  async enforceSessionLimits(userId, sessionType, deviceId) {
    const sessionConfig = GAMING_SESSION_CONFIG.SESSION_TYPES[sessionType];
    const userSessions = this.userSessions.get(userId) || new Set();
    
    // Check concurrent sessions for tournament/voting types
    if (!sessionConfig.allowConcurrent) {
      for (const sessionId of userSessions) {
        const session = this.activeSessions.get(sessionId);
        if (session && session.active && session.sessionType === sessionType) {
          throw new Error(`Only one ${sessionType} session allowed at a time`);
        }
      }
    }
    
    // Check device limit
    const activeSessionsForType = Array.from(userSessions)
      .map(id => this.activeSessions.get(id))
      .filter(session => session && session.active && session.sessionType === sessionType);
    
    if (activeSessionsForType.length >= sessionConfig.maxDevices) {
      // Remove oldest session
      const oldestSession = activeSessionsForType
        .sort((a, b) => new Date(a.lastActivity) - new Date(b.lastActivity))[0];
      
      await this.revokeSession(oldestSession.sessionId, 'device_limit_exceeded');
    }
  }
  
  recordSuspiciousActivity(sessionId, activityType) {
    const sessionData = this.activeSessions.get(sessionId);
    if (!sessionData) return;
    
    sessionData.suspiciousActivityCount++;
    
    if (sessionData.suspiciousActivityCount >= GAMING_SESSION_CONFIG.SECURITY.suspiciousActivityThreshold) {
      this.emit(SESSION_EVENTS.SUSPICIOUS_ACTIVITY, {
        sessionId,
        userId: sessionData.userId,
        activityType,
        count: sessionData.suspiciousActivityCount
      });
      
      // Auto-revoke for repeated suspicious activity
      this.revokeSession(sessionId, 'suspicious_activity');
    }
  }
  
  setupPerformanceMonitoring() {
    this.metricsInterval = setInterval(() => {
      const avgLookupTime = this.getAverageLookupTime();
      const cacheHitRate = this.getCacheHitRate();
      
      // Check performance targets
      if (avgLookupTime > GAMING_SESSION_CONFIG.PERFORMANCE.sessionLookupTarget) {
        this.emit(SESSION_EVENTS.PERFORMANCE_WARNING, {
          type: 'slow_average_lookup',
          avgLookupTime,
          target: GAMING_SESSION_CONFIG.PERFORMANCE.sessionLookupTarget
        });
      }
      
      if (cacheHitRate < GAMING_SESSION_CONFIG.PERFORMANCE.cacheHitTarget) {
        this.emit(SESSION_EVENTS.PERFORMANCE_WARNING, {
          type: 'low_cache_hit_rate',
          cacheHitRate,
          target: GAMING_SESSION_CONFIG.PERFORMANCE.cacheHitTarget
        });
      }
      
      // Clear old metrics
      this.metrics.lookupTimes = this.metrics.lookupTimes.slice(-100);
      
      this.logger.debug(`📊 Session metrics: ${this.metrics.activeSessionCount} active, ${avgLookupTime}ms avg lookup, ${(cacheHitRate * 100).toFixed(1)}% cache hit rate`);
      
    }, GAMING_SESSION_CONFIG.PERFORMANCE.metricsInterval);
  }
  
  setupSessionCleanup() {
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupExpiredSessions();
    }, GAMING_SESSION_CONFIG.PERFORMANCE.cleanupInterval);
  }
  
  async cleanupExpiredSessions() {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [sessionId, sessionData] of this.activeSessions) {
      if (sessionData.expiresAt < now) {
        await this.revokeSession(sessionId, 'expired');
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.logger.info(`🧹 Cleaned up ${cleanedCount} expired gaming sessions`);
    }
  }
  
  setupCrossDeviceSync() {
    // This would implement WebSocket or Server-Sent Events for real-time sync
    this.logger.info('🔄 Cross-device synchronization enabled');
  }
  
  async loadExistingSessions() {
    if (!this.redis) return;
    
    try {
      const keys = await this.redis.keys('gaming_session:*');
      let loadedCount = 0;
      
      for (const key of keys) {
        const sessionData = await this.redis.get(key);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          if (session.active && new Date(session.expiresAt) > new Date()) {
            this.activeSessions.set(session.sessionId, session);
            this.updateSessionMappings(session.userId, session.sessionId, session.deviceId, session);
            loadedCount++;
          }
        }
      }
      
      this.metrics.activeSessionCount = this.activeSessions.size;
      this.logger.info(`🔄 Loaded ${loadedCount} existing sessions from Redis`);
      
    } catch (error) {
      this.logger.error('Failed to load existing sessions:', error);
    }
  }
  
  getAverageLookupTime() {
    if (this.metrics.lookupTimes.length === 0) return 0;
    return this.metrics.lookupTimes.reduce((sum, time) => sum + time, 0) / this.metrics.lookupTimes.length;
  }
  
  getCacheHitRate() {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    if (total === 0) return 1;
    return this.metrics.cacheHits / total;
  }
  
  getPerformanceMetrics() {
    return {
      activeSessions: this.metrics.activeSessionCount,
      averageLookupTime: this.getAverageLookupTime(),
      cacheHitRate: this.getCacheHitRate(),
      sessionCreations: this.metrics.sessionCreations,
      sessionRevocations: this.metrics.sessionRevocations,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 // MB
    };
  }
  
  // Cleanup method
  destroy() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Revoke all active sessions
    for (const sessionId of this.activeSessions.keys()) {
      this.revokeSession(sessionId, 'service_shutdown');
    }
    
    this.logger.info('🎮 Gaming Session Manager destroyed');
  }
}

export default GamingSessionManager;
export { GAMING_SESSION_CONFIG, SESSION_EVENTS };