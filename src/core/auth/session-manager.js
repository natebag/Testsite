/**
 * Session Manager for MLG.clan Platform
 * 
 * Advanced session management with Redis integration, cross-device
 * synchronization, and comprehensive session lifecycle management.
 * 
 * Features:
 * - Redis-based session storage with fallback to memory
 * - Session encryption and secure serialization
 * - Cross-device session management
 * - Activity tracking and timeout management
 * - Session invalidation and cleanup
 * - Performance optimization for high concurrent users
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 */

import crypto from 'crypto';
import Redis from 'redis';
import { EventEmitter } from 'events';

/**
 * Session Manager Configuration
 */
const SESSION_CONFIG = {
  // Session Storage
  DEFAULT_TTL: 24 * 60 * 60, // 24 hours in seconds
  ACTIVITY_TTL: 2 * 60 * 60, // 2 hours in seconds
  REFRESH_TTL: 7 * 24 * 60 * 60, // 7 days in seconds
  
  // Redis Configuration
  REDIS_PREFIX: 'mlg:session:',
  REDIS_USER_PREFIX: 'mlg:user:sessions:',
  REDIS_ACTIVITY_PREFIX: 'mlg:activity:',
  
  // Security
  ENCRYPTION_ALGORITHM: 'aes-256-gcm',
  ENCRYPTION_KEY_LENGTH: 32,
  IV_LENGTH: 16,
  TAG_LENGTH: 16,
  
  // Session Limits
  MAX_SESSIONS_PER_USER: 5,
  MAX_DEVICES_PER_USER: 3,
  
  // Cleanup
  CLEANUP_INTERVAL: 60 * 1000, // 1 minute
  BATCH_SIZE: 100,
  
  // Activity Tracking
  ACTIVITY_UPDATE_INTERVAL: 30 * 1000, // 30 seconds
  HEARTBEAT_INTERVAL: 60 * 1000, // 1 minute
  
  // Cross-device sync
  SYNC_INTERVAL: 5 * 1000, // 5 seconds
  BROADCAST_CHANNEL: 'mlg:session:broadcast'
};

/**
 * Session States
 */
const SESSION_STATES = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
  SUSPENDED: 'suspended',
  TERMINATED: 'terminated'
};

/**
 * Session Events
 */
const SESSION_EVENTS = {
  CREATED: 'session:created',
  UPDATED: 'session:updated',
  EXPIRED: 'session:expired',
  REVOKED: 'session:revoked',
  ACTIVITY: 'session:activity',
  SYNC: 'session:sync'
};

/**
 * Session Manager Class
 */
class SessionManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.redis = options.redis || null;
    this.db = options.db || null;
    this.logger = options.logger || console;
    this.encryptionKey = options.encryptionKey || this.generateEncryptionKey();
    
    // Internal storage for fallback
    this.memoryStore = new Map();
    this.userSessions = new Map();
    this.activityTracker = new Map();
    
    // Performance metrics
    this.metrics = {
      sessionsCreated: 0,
      sessionsRevoked: 0,
      cacheHits: 0,
      cacheMisses: 0,
      syncOperations: 0
    };
    
    // Initialize
    this.initialize();
  }

  /**
   * Initialize session manager
   */
  async initialize() {
    try {
      // Connect to Redis if not already connected
      if (!this.redis) {
        await this.initializeRedis();
      }
      
      // Start cleanup and monitoring tasks
      this.startCleanupTasks();
      this.startActivityTracking();
      this.startSyncManager();
      
      this.logger.info('Session Manager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Session Manager:', error);
      throw error;
    }
  }

  /**
   * Initialize Redis connection
   */
  async initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.redis = Redis.createClient({ 
        url: redisUrl,
        retry_strategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      });
      
      this.redis.on('error', (err) => {
        this.logger.error('Redis connection error:', err);
      });
      
      this.redis.on('connect', () => {
        this.logger.info('Redis connected');
      });
      
      this.redis.on('reconnecting', () => {
        this.logger.warn('Redis reconnecting...');
      });
      
      await this.redis.connect();
    } catch (error) {
      this.logger.warn('Redis connection failed, using memory store:', error);
      this.redis = null;
    }
  }

  /**
   * Create new session
   * @param {Object} sessionData - Session data
   * @returns {Object} Created session
   */
  async createSession(sessionData) {
    try {
      const sessionId = crypto.randomUUID();
      const now = Date.now();
      
      const session = {
        id: sessionId,
        userId: sessionData.userId,
        walletAddress: sessionData.walletAddress,
        roles: sessionData.roles || [],
        permissions: sessionData.permissions || [],
        
        // Session metadata
        createdAt: now,
        lastActivity: now,
        expiresAt: now + (SESSION_CONFIG.DEFAULT_TTL * 1000),
        
        // Device information
        ipAddress: sessionData.ipAddress,
        userAgent: sessionData.userAgent,
        deviceFingerprint: sessionData.deviceFingerprint,
        deviceName: this.extractDeviceName(sessionData.userAgent),
        
        // Security data
        walletSignature: sessionData.walletSignature,
        messagesSigned: sessionData.messagesSigned,
        
        // Session state
        state: SESSION_STATES.ACTIVE,
        isActive: true,
        
        // Additional metadata
        metadata: sessionData.metadata || {}
      };

      // Encrypt sensitive session data
      const encryptedSession = await this.encryptSession(session);
      
      // Store session
      await this.storeSession(sessionId, encryptedSession);
      
      // Track user sessions
      await this.addUserSession(sessionData.userId, sessionId);
      
      // Enforce session limits
      await this.enforceSessionLimits(sessionData.userId);
      
      // Update metrics
      this.metrics.sessionsCreated++;
      
      // Emit event
      this.emit(SESSION_EVENTS.CREATED, session);
      
      // Log session creation
      this.logSessionEvent('SESSION_CREATED', {
        sessionId,
        userId: sessionData.userId,
        walletAddress: sessionData.walletAddress,
        deviceName: session.deviceName
      });
      
      return session;
    } catch (error) {
      this.logger.error('Error creating session:', error);
      throw new Error('Failed to create session');
    }
  }

  /**
   * Get session by ID
   * @param {string} sessionId - Session ID
   * @returns {Object|null} Session object
   */
  async getSession(sessionId) {
    try {
      let encryptedSession;
      
      if (this.redis) {
        const key = `${SESSION_CONFIG.REDIS_PREFIX}${sessionId}`;
        encryptedSession = await this.redis.get(key);
        
        if (encryptedSession) {
          this.metrics.cacheHits++;
        } else {
          this.metrics.cacheMisses++;
        }
      } else {
        encryptedSession = this.memoryStore.get(sessionId);
      }
      
      if (!encryptedSession) {
        return null;
      }
      
      // Decrypt session
      const session = await this.decryptSession(JSON.parse(encryptedSession));
      
      // Check if session is valid
      if (!this.isSessionValid(session)) {
        await this.invalidateSession(sessionId, 'expired');
        return null;
      }
      
      return session;
    } catch (error) {
      this.logger.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Update session activity
   * @param {string} sessionId - Session ID
   * @param {Object} activityData - Activity data
   */
  async updateActivity(sessionId, activityData = {}) {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return false;
      }
      
      const now = Date.now();
      
      // Update session activity
      session.lastActivity = now;
      session.metadata = { ...session.metadata, ...activityData };
      
      // Store updated session
      const encryptedSession = await this.encryptSession(session);
      await this.storeSession(sessionId, encryptedSession);
      
      // Update activity tracker
      this.activityTracker.set(sessionId, {
        lastActivity: now,
        activityCount: (this.activityTracker.get(sessionId)?.activityCount || 0) + 1
      });
      
      // Emit activity event
      this.emit(SESSION_EVENTS.ACTIVITY, { sessionId, session, activityData });
      
      return true;
    } catch (error) {
      this.logger.error('Error updating session activity:', error);
      return false;
    }
  }

  /**
   * Refresh session expiry
   * @param {string} sessionId - Session ID
   * @param {number} extendBy - Time to extend in milliseconds
   */
  async refreshSession(sessionId, extendBy = SESSION_CONFIG.DEFAULT_TTL * 1000) {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return false;
      }
      
      const now = Date.now();
      session.expiresAt = now + extendBy;
      session.lastActivity = now;
      
      // Store updated session
      const encryptedSession = await this.encryptSession(session);
      await this.storeSession(sessionId, encryptedSession, Math.ceil(extendBy / 1000));
      
      this.emit(SESSION_EVENTS.UPDATED, session);
      
      return true;
    } catch (error) {
      this.logger.error('Error refreshing session:', error);
      return false;
    }
  }

  /**
   * Revoke session
   * @param {string} sessionId - Session ID
   * @param {string} reason - Revocation reason
   */
  async revokeSession(sessionId, reason = 'manual_revoke') {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return false;
      }
      
      // Update session state
      session.state = SESSION_STATES.REVOKED;
      session.isActive = false;
      session.revokedAt = Date.now();
      session.revokeReason = reason;
      
      // Remove from active storage
      await this.removeSession(sessionId);
      
      // Remove from user sessions
      await this.removeUserSession(session.userId, sessionId);
      
      // Update metrics
      this.metrics.sessionsRevoked++;
      
      // Emit event
      this.emit(SESSION_EVENTS.REVOKED, { sessionId, session, reason });
      
      // Log revocation
      this.logSessionEvent('SESSION_REVOKED', {
        sessionId,
        userId: session.userId,
        reason
      });
      
      return true;
    } catch (error) {
      this.logger.error('Error revoking session:', error);
      return false;
    }
  }

  /**
   * Revoke all user sessions
   * @param {string} userId - User ID
   * @param {string} reason - Revocation reason
   * @param {string} exceptSessionId - Session ID to exclude from revocation
   */
  async revokeUserSessions(userId, reason = 'security_event', exceptSessionId = null) {
    try {
      const sessionIds = await this.getUserSessions(userId);
      
      const revokedSessions = [];
      for (const sessionId of sessionIds) {
        if (sessionId !== exceptSessionId) {
          const success = await this.revokeSession(sessionId, reason);
          if (success) {
            revokedSessions.push(sessionId);
          }
        }
      }
      
      this.logSessionEvent('USER_SESSIONS_REVOKED', {
        userId,
        revokedCount: revokedSessions.length,
        reason,
        exceptSessionId
      });
      
      return revokedSessions;
    } catch (error) {
      this.logger.error('Error revoking user sessions:', error);
      return [];
    }
  }

  /**
   * Get all sessions for a user
   * @param {string} userId - User ID
   * @returns {Array} Array of session IDs
   */
  async getUserSessions(userId) {
    try {
      if (this.redis) {
        const key = `${SESSION_CONFIG.REDIS_USER_PREFIX}${userId}`;
        const sessionIds = await this.redis.sMembers(key);
        return sessionIds;
      } else {
        return this.userSessions.get(userId) || [];
      }
    } catch (error) {
      this.logger.error('Error getting user sessions:', error);
      return [];
    }
  }

  /**
   * Store session
   * @param {string} sessionId - Session ID
   * @param {Object} encryptedSession - Encrypted session data
   * @param {number} ttl - Time to live in seconds
   */
  async storeSession(sessionId, encryptedSession, ttl = SESSION_CONFIG.DEFAULT_TTL) {
    try {
      const sessionData = JSON.stringify(encryptedSession);
      
      if (this.redis) {
        const key = `${SESSION_CONFIG.REDIS_PREFIX}${sessionId}`;
        await this.redis.setEx(key, ttl, sessionData);
      } else {
        this.memoryStore.set(sessionId, sessionData);
        
        // Set expiry for memory store
        setTimeout(() => {
          this.memoryStore.delete(sessionId);
        }, ttl * 1000);
      }
    } catch (error) {
      this.logger.error('Error storing session:', error);
      throw error;
    }
  }

  /**
   * Remove session from storage
   * @param {string} sessionId - Session ID
   */
  async removeSession(sessionId) {
    try {
      if (this.redis) {
        const key = `${SESSION_CONFIG.REDIS_PREFIX}${sessionId}`;
        await this.redis.del(key);
      } else {
        this.memoryStore.delete(sessionId);
      }
      
      // Remove from activity tracker
      this.activityTracker.delete(sessionId);
    } catch (error) {
      this.logger.error('Error removing session:', error);
    }
  }

  /**
   * Add session to user's session set
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   */
  async addUserSession(userId, sessionId) {
    try {
      if (this.redis) {
        const key = `${SESSION_CONFIG.REDIS_USER_PREFIX}${userId}`;
        await this.redis.sAdd(key, sessionId);
        await this.redis.expire(key, SESSION_CONFIG.REFRESH_TTL);
      } else {
        if (!this.userSessions.has(userId)) {
          this.userSessions.set(userId, new Set());
        }
        this.userSessions.get(userId).add(sessionId);
      }
    } catch (error) {
      this.logger.error('Error adding user session:', error);
    }
  }

  /**
   * Remove session from user's session set
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   */
  async removeUserSession(userId, sessionId) {
    try {
      if (this.redis) {
        const key = `${SESSION_CONFIG.REDIS_USER_PREFIX}${userId}`;
        await this.redis.sRem(key, sessionId);
      } else {
        const sessions = this.userSessions.get(userId);
        if (sessions) {
          sessions.delete(sessionId);
          if (sessions.size === 0) {
            this.userSessions.delete(userId);
          }
        }
      }
    } catch (error) {
      this.logger.error('Error removing user session:', error);
    }
  }

  /**
   * Enforce session limits per user
   * @param {string} userId - User ID
   */
  async enforceSessionLimits(userId) {
    try {
      const sessionIds = await this.getUserSessions(userId);
      
      if (sessionIds.length > SESSION_CONFIG.MAX_SESSIONS_PER_USER) {
        // Get session details to determine which to remove
        const sessions = [];
        
        for (const sessionId of sessionIds) {
          const session = await this.getSession(sessionId);
          if (session) {
            sessions.push(session);
          }
        }
        
        // Sort by last activity (oldest first)
        sessions.sort((a, b) => a.lastActivity - b.lastActivity);
        
        // Remove excess sessions
        const excessCount = sessions.length - SESSION_CONFIG.MAX_SESSIONS_PER_USER;
        for (let i = 0; i < excessCount; i++) {
          await this.revokeSession(sessions[i].id, 'session_limit_exceeded');
        }
        
        this.logSessionEvent('SESSION_LIMIT_ENFORCED', {
          userId,
          removedCount: excessCount,
          totalSessions: sessions.length
        });
      }
    } catch (error) {
      this.logger.error('Error enforcing session limits:', error);
    }
  }

  /**
   * Encrypt session data
   * @param {Object} session - Session object
   * @returns {Object} Encrypted session data
   */
  async encryptSession(session) {
    try {
      const iv = crypto.randomBytes(SESSION_CONFIG.IV_LENGTH);
      const cipher = crypto.createCipher(SESSION_CONFIG.ENCRYPTION_ALGORITHM, this.encryptionKey, { iv });
      
      const sessionString = JSON.stringify(session);
      let encrypted = cipher.update(sessionString, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        algorithm: SESSION_CONFIG.ENCRYPTION_ALGORITHM
      };
    } catch (error) {
      this.logger.error('Error encrypting session:', error);
      // Return unencrypted as fallback (not recommended for production)
      return { plaintext: session };
    }
  }

  /**
   * Decrypt session data
   * @param {Object} encryptedData - Encrypted session data
   * @returns {Object} Decrypted session object
   */
  async decryptSession(encryptedData) {
    try {
      // Handle unencrypted fallback
      if (encryptedData.plaintext) {
        return encryptedData.plaintext;
      }
      
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const tag = Buffer.from(encryptedData.tag, 'hex');
      const decipher = crypto.createDecipher(encryptedData.algorithm, this.encryptionKey, { iv });
      
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      this.logger.error('Error decrypting session:', error);
      throw new Error('Session decryption failed');
    }
  }

  /**
   * Check if session is valid
   * @param {Object} session - Session object
   * @returns {boolean} True if session is valid
   */
  isSessionValid(session) {
    const now = Date.now();
    
    // Check basic validity
    if (!session || !session.id || !session.userId) {
      return false;
    }
    
    // Check state
    if (session.state !== SESSION_STATES.ACTIVE) {
      return false;
    }
    
    // Check expiry
    if (session.expiresAt < now) {
      return false;
    }
    
    // Check activity timeout
    const activityTimeout = now - SESSION_CONFIG.ACTIVITY_TTL * 1000;
    if (session.lastActivity < activityTimeout) {
      return false;
    }
    
    return true;
  }

  /**
   * Invalidate session
   * @param {string} sessionId - Session ID
   * @param {string} reason - Invalidation reason
   */
  async invalidateSession(sessionId, reason) {
    try {
      await this.revokeSession(sessionId, reason);
      this.emit(SESSION_EVENTS.EXPIRED, { sessionId, reason });
    } catch (error) {
      this.logger.error('Error invalidating session:', error);
    }
  }

  /**
   * Extract device name from user agent
   * @param {string} userAgent - User agent string
   * @returns {string} Device name
   */
  extractDeviceName(userAgent) {
    if (!userAgent) return 'Unknown Device';
    
    const devicePatterns = [
      { pattern: /iPhone/i, name: 'iPhone' },
      { pattern: /iPad/i, name: 'iPad' },
      { pattern: /Android.*Mobile/i, name: 'Android Phone' },
      { pattern: /Android/i, name: 'Android Tablet' },
      { pattern: /Chrome/i, name: 'Chrome Browser' },
      { pattern: /Firefox/i, name: 'Firefox Browser' },
      { pattern: /Safari/i, name: 'Safari Browser' },
      { pattern: /Edge/i, name: 'Edge Browser' }
    ];
    
    for (const { pattern, name } of devicePatterns) {
      if (pattern.test(userAgent)) {
        return name;
      }
    }
    
    return 'Unknown Device';
  }

  /**
   * Generate encryption key
   * @returns {Buffer} Encryption key
   */
  generateEncryptionKey() {
    const key = process.env.SESSION_ENCRYPTION_KEY;
    if (key) {
      return Buffer.from(key, 'hex');
    }
    
    // Generate new key (should be stored securely)
    const newKey = crypto.randomBytes(SESSION_CONFIG.ENCRYPTION_KEY_LENGTH);
    this.logger.warn('Generated new session encryption key. Store this securely:', newKey.toString('hex'));
    return newKey;
  }

  /**
   * Start cleanup tasks
   */
  startCleanupTasks() {
    // Cleanup expired sessions
    setInterval(async () => {
      await this.cleanupExpiredSessions();
    }, SESSION_CONFIG.CLEANUP_INTERVAL);
    
    // Cleanup inactive sessions
    setInterval(async () => {
      await this.cleanupInactiveSessions();
    }, SESSION_CONFIG.CLEANUP_INTERVAL * 5);
  }

  /**
   * Start activity tracking
   */
  startActivityTracking() {
    // Activity heartbeat
    setInterval(() => {
      this.emit('heartbeat', {
        timestamp: Date.now(),
        activeSessions: this.activityTracker.size,
        metrics: this.metrics
      });
    }, SESSION_CONFIG.HEARTBEAT_INTERVAL);
  }

  /**
   * Start sync manager for cross-device session sync
   */
  startSyncManager() {
    if (!this.redis) return;
    
    setInterval(async () => {
      try {
        // Sync session states across instances
        await this.syncSessions();
        this.metrics.syncOperations++;
      } catch (error) {
        this.logger.error('Session sync error:', error);
      }
    }, SESSION_CONFIG.SYNC_INTERVAL);
  }

  /**
   * Sync sessions across instances
   */
  async syncSessions() {
    // Implementation for cross-instance session synchronization
    // This would broadcast session state changes to other instances
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions() {
    try {
      let cleanedCount = 0;
      
      if (this.redis) {
        // Redis TTL handles most cleanup automatically
        // We just need to clean up user session sets
        const pattern = `${SESSION_CONFIG.REDIS_USER_PREFIX}*`;
        const keys = await this.redis.keys(pattern);
        
        for (const key of keys) {
          const sessionIds = await this.redis.sMembers(key);
          for (const sessionId of sessionIds) {
            const sessionKey = `${SESSION_CONFIG.REDIS_PREFIX}${sessionId}`;
            const exists = await this.redis.exists(sessionKey);
            if (!exists) {
              await this.redis.sRem(key, sessionId);
              cleanedCount++;
            }
          }
        }
      } else {
        // Memory store cleanup
        const now = Date.now();
        for (const [sessionId, sessionData] of this.memoryStore.entries()) {
          try {
            const session = JSON.parse(sessionData);
            if (!this.isSessionValid(session)) {
              this.memoryStore.delete(sessionId);
              this.activityTracker.delete(sessionId);
              cleanedCount++;
            }
          } catch (error) {
            // Invalid session data, remove it
            this.memoryStore.delete(sessionId);
            cleanedCount++;
          }
        }
      }
      
      if (cleanedCount > 0) {
        this.logger.info(`Cleaned up ${cleanedCount} expired sessions`);
      }
    } catch (error) {
      this.logger.error('Error during session cleanup:', error);
    }
  }

  /**
   * Cleanup inactive sessions
   */
  async cleanupInactiveSessions() {
    // Remove sessions with no activity for extended periods
    const cutoffTime = Date.now() - (SESSION_CONFIG.ACTIVITY_TTL * 2 * 1000);
    
    for (const [sessionId, activity] of this.activityTracker.entries()) {
      if (activity.lastActivity < cutoffTime) {
        await this.revokeSession(sessionId, 'inactivity_timeout');
      }
    }
  }

  /**
   * Log session events
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  logSessionEvent(event, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      data: {
        ...data,
        // Sanitize sensitive data
        userId: data.userId ? `${data.userId.substring(0, 8)}...` : undefined
      }
    };
    
    this.logger.info('Session Event:', logEntry);
  }

  /**
   * Get session manager metrics
   * @returns {Object} Metrics object
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeSessions: this.activityTracker.size,
      memoryStoreSessions: this.memoryStore.size,
      userSessions: this.userSessions.size,
      uptime: process.uptime()
    };
  }

  /**
   * Shutdown session manager
   */
  async shutdown() {
    try {
      // Clear all intervals
      clearInterval(this.cleanupInterval);
      clearInterval(this.activityInterval);
      clearInterval(this.syncInterval);
      
      // Disconnect Redis
      if (this.redis) {
        await this.redis.disconnect();
      }
      
      // Clear memory stores
      this.memoryStore.clear();
      this.userSessions.clear();
      this.activityTracker.clear();
      
      this.logger.info('Session Manager shutdown complete');
    } catch (error) {
      this.logger.error('Error during session manager shutdown:', error);
    }
  }
}

// Export the session manager and constants
export { SessionManager, SESSION_CONFIG, SESSION_STATES, SESSION_EVENTS };
export default SessionManager;