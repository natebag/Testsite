/**
 * Comprehensive Request Logging and Monitoring System for MLG.clan Platform
 * 
 * Advanced logging system with real-time monitoring, security event tracking,
 * performance metrics, and gaming-specific analytics for the MLG.clan platform.
 * 
 * Features:
 * - Structured security event logging
 * - Real-time threat monitoring
 * - Performance metrics collection
 * - Gaming-specific analytics
 * - PII-safe logging with data anonymization
 * - Alert system for security incidents
 * 
 * @author Claude Code - Security Auditor
 * @version 2.0.0
 * @created 2025-08-11
 */

import winston from 'winston';
import { createHash } from 'crypto';
import path from 'path';
import fs from 'fs';

/**
 * Monitoring Configuration
 */
const MONITORING_CONFIG = {
  // Log levels and retention
  LOGGING: {
    LEVELS: {
      emergency: 0,   // System unusable
      alert: 1,       // Immediate action required
      critical: 2,    // Critical conditions
      error: 3,       // Error conditions
      warning: 4,     // Warning conditions
      notice: 5,      // Normal but significant
      info: 6,        // Informational
      debug: 7        // Debug messages
    },
    RETENTION_DAYS: 30,
    MAX_FILE_SIZE: '20m',
    MAX_FILES: 5
  },

  // Security monitoring thresholds
  SECURITY: {
    FAILED_AUTH_THRESHOLD: 5,      // Failed attempts per minute
    SUSPICIOUS_IP_THRESHOLD: 100,   // Requests per hour from single IP
    ERROR_RATE_THRESHOLD: 0.1,      // 10% error rate
    RESPONSE_TIME_THRESHOLD: 5000,  // 5 seconds
    PII_DETECTION_PATTERNS: [
      /\b\d{3}-\d{2}-\d{4}\b/g,      // SSN pattern
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
      /\b\d{16}\b/g,                  // Credit card pattern
      /\b(?:\d{1,3}\.){3}\d{1,3}\b/g  // IP addresses
    ]
  },

  // Gaming metrics
  GAMING: {
    VOTE_ANALYTICS: true,
    CLAN_ANALYTICS: true,
    TOKEN_TRANSACTION_TRACKING: true,
    PERFORMANCE_TRACKING: true,
    USER_BEHAVIOR_ANALYSIS: true
  },

  // Real-time monitoring
  REALTIME: {
    ALERT_COOLDOWN: 300000,        // 5 minutes between similar alerts
    BATCH_SIZE: 100,               // Events per batch
    FLUSH_INTERVAL: 10000,         // 10 seconds
    MEMORY_THRESHOLD: 1000         // Max events in memory
  }
};

/**
 * Advanced Security Logger
 */
class SecurityLogger {
  constructor() {
    this.initializeWinstonLogger();
    this.securityEvents = new Map();
    this.performanceMetrics = [];
    this.alertCooldowns = new Map();
    this.realtimeBuffer = [];
    
    this.startRealtimeProcessor();
  }

  /**
   * Initialize Winston logger with multiple transports
   */
  initializeWinstonLogger() {
    // Ensure logs directory exists
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Custom log format
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return JSON.stringify({
          timestamp,
          level: level.toUpperCase(),
          message: this.sanitizePII(message),
          ...this.sanitizeMetadata(meta)
        });
      })
    );

    this.logger = winston.createLogger({
      levels: MONITORING_CONFIG.LOGGING.LEVELS,
      format: logFormat,
      transports: [
        // Console transport for development
        new winston.transports.Console({
          level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),

        // Security events file
        new winston.transports.File({
          filename: path.join(logsDir, 'security.log'),
          level: 'warning',
          maxsize: MONITORING_CONFIG.LOGGING.MAX_FILE_SIZE,
          maxFiles: MONITORING_CONFIG.LOGGING.MAX_FILES,
          tailable: true
        }),

        // General application logs
        new winston.transports.File({
          filename: path.join(logsDir, 'app.log'),
          level: 'info',
          maxsize: MONITORING_CONFIG.LOGGING.MAX_FILE_SIZE,
          maxFiles: MONITORING_CONFIG.LOGGING.MAX_FILES,
          tailable: true
        }),

        // Error logs
        new winston.transports.File({
          filename: path.join(logsDir, 'error.log'),
          level: 'error',
          maxsize: MONITORING_CONFIG.LOGGING.MAX_FILE_SIZE,
          maxFiles: MONITORING_CONFIG.LOGGING.MAX_FILES,
          tailable: true
        }),

        // Gaming-specific logs
        new winston.transports.File({
          filename: path.join(logsDir, 'gaming.log'),
          level: 'info',
          maxsize: MONITORING_CONFIG.LOGGING.MAX_FILE_SIZE,
          maxFiles: MONITORING_CONFIG.LOGGING.MAX_FILES,
          tailable: true,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message, gaming, ...meta }) => {
              if (gaming) {
                return JSON.stringify({
                  timestamp,
                  level: level.toUpperCase(),
                  gaming,
                  message: this.sanitizePII(message),
                  ...this.sanitizeMetadata(meta)
                });
              }
              return null;
            }),
            winston.format((info) => info.gaming ? info : false)()
          )
        })
      ]
    });
  }

  /**
   * Sanitize PII from log messages
   */
  sanitizePII(message) {
    if (typeof message !== 'string') return message;

    let sanitized = message;
    MONITORING_CONFIG.SECURITY.PII_DETECTION_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });

    return sanitized;
  }

  /**
   * Sanitize metadata to remove PII
   */
  sanitizeMetadata(meta) {
    const sanitized = { ...meta };
    
    // Remove or hash sensitive fields
    const sensitiveFields = ['password', 'token', 'key', 'secret', 'signature'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    // Hash IP addresses for privacy while maintaining uniqueness
    if (sanitized.ip) {
      sanitized.ipHash = this.hashIP(sanitized.ip);
      delete sanitized.ip;
    }

    // Hash user IDs for privacy
    if (sanitized.userId) {
      sanitized.userHash = this.hashUserId(sanitized.userId);
      delete sanitized.userId;
    }

    // Hash wallet addresses
    if (sanitized.walletAddress) {
      sanitized.walletHash = this.hashWallet(sanitized.walletAddress);
      delete sanitized.walletAddress;
    }

    return sanitized;
  }

  /**
   * Hash IP address for privacy
   */
  hashIP(ip) {
    return createHash('sha256')
      .update(ip + (process.env.LOG_SALT || 'mlg-clan-salt'))
      .digest('hex')
      .substring(0, 12);
  }

  /**
   * Hash user ID for privacy
   */
  hashUserId(userId) {
    return createHash('sha256')
      .update(userId.toString() + (process.env.LOG_SALT || 'mlg-clan-salt'))
      .digest('hex')
      .substring(0, 12);
  }

  /**
   * Hash wallet address for privacy
   */
  hashWallet(walletAddress) {
    return createHash('sha256')
      .update(walletAddress + (process.env.LOG_SALT || 'mlg-clan-salt'))
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Log security event
   */
  logSecurityEvent(level, message, metadata = {}) {
    const event = {
      timestamp: new Date().toISOString(),
      level,
      message,
      type: 'security',
      ...metadata
    };

    this.logger.log(level, message, event);
    this.trackSecurityEvent(event);
    this.addToRealtimeBuffer(event);
  }

  /**
   * Log gaming event
   */
  logGamingEvent(message, gamingData, metadata = {}) {
    const event = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      gaming: gamingData,
      type: 'gaming',
      ...metadata
    };

    this.logger.info(message, event);
    this.addToRealtimeBuffer(event);
  }

  /**
   * Log performance metrics
   */
  logPerformanceMetric(metric, value, metadata = {}) {
    const performanceEvent = {
      timestamp: new Date().toISOString(),
      metric,
      value,
      type: 'performance',
      ...metadata
    };

    this.performanceMetrics.push(performanceEvent);
    
    // Keep only recent metrics
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics.splice(0, 500);
    }

    this.logger.info(`Performance metric: ${metric} = ${value}`, performanceEvent);
  }

  /**
   * Track security events for analysis
   */
  trackSecurityEvent(event) {
    const key = `${event.type || 'unknown'}:${event.level}`;
    
    if (!this.securityEvents.has(key)) {
      this.securityEvents.set(key, {
        count: 0,
        firstSeen: event.timestamp,
        lastSeen: event.timestamp,
        samples: []
      });
    }

    const eventData = this.securityEvents.get(key);
    eventData.count++;
    eventData.lastSeen = event.timestamp;
    
    // Keep sample events for analysis
    eventData.samples.push(event);
    if (eventData.samples.length > 10) {
      eventData.samples.shift();
    }

    this.checkAlertThresholds(key, eventData);
  }

  /**
   * Check if alerts should be triggered
   */
  checkAlertThresholds(eventKey, eventData) {
    const now = Date.now();
    const lastAlert = this.alertCooldowns.get(eventKey);
    
    // Check cooldown
    if (lastAlert && now - lastAlert < MONITORING_CONFIG.REALTIME.ALERT_COOLDOWN) {
      return;
    }

    // Check various thresholds
    if (eventKey.includes('critical') || eventKey.includes('emergency')) {
      this.triggerAlert('CRITICAL_EVENT', `Critical security event detected: ${eventKey}`, {
        eventKey,
        count: eventData.count,
        recentSamples: eventData.samples.slice(-3)
      });
    }

    // Check rate-based alerts
    const recentEvents = eventData.samples.filter(sample => 
      new Date(sample.timestamp).getTime() > now - 60000 // Last minute
    );

    if (recentEvents.length >= MONITORING_CONFIG.SECURITY.FAILED_AUTH_THRESHOLD) {
      this.triggerAlert('HIGH_FREQUENCY_EVENT', `High frequency security events: ${eventKey}`, {
        eventKey,
        recentCount: recentEvents.length,
        timeWindow: '1 minute'
      });
    }
  }

  /**
   * Trigger security alert
   */
  triggerAlert(alertType, message, data) {
    const alert = {
      type: alertType,
      message,
      timestamp: new Date().toISOString(),
      severity: this.determineAlertSeverity(alertType),
      data
    };

    this.logger.alert(`SECURITY ALERT: ${message}`, alert);
    
    // Mark cooldown
    this.alertCooldowns.set(data.eventKey || alertType, Date.now());

    // In production, this would trigger notifications, emails, etc.
    console.error('🚨 SECURITY ALERT:', alert);
  }

  /**
   * Determine alert severity
   */
  determineAlertSeverity(alertType) {
    const severityMap = {
      'CRITICAL_EVENT': 'high',
      'HIGH_FREQUENCY_EVENT': 'medium',
      'PERFORMANCE_DEGRADATION': 'low',
      'SUSPICIOUS_ACTIVITY': 'medium',
      'SYSTEM_ERROR': 'high'
    };

    return severityMap[alertType] || 'low';
  }

  /**
   * Add event to real-time buffer
   */
  addToRealtimeBuffer(event) {
    this.realtimeBuffer.push(event);
    
    if (this.realtimeBuffer.length >= MONITORING_CONFIG.REALTIME.MEMORY_THRESHOLD) {
      this.processRealtimeBuffer();
    }
  }

  /**
   * Start real-time processor
   */
  startRealtimeProcessor() {
    setInterval(() => {
      this.processRealtimeBuffer();
      this.performPeriodicAnalysis();
    }, MONITORING_CONFIG.REALTIME.FLUSH_INTERVAL);
  }

  /**
   * Process real-time buffer
   */
  processRealtimeBuffer() {
    if (this.realtimeBuffer.length === 0) return;

    const batch = this.realtimeBuffer.splice(0, MONITORING_CONFIG.REALTIME.BATCH_SIZE);
    
    // Analyze patterns in real-time
    this.analyzeRealtimePatterns(batch);
    
    // Store in persistent storage (if configured)
    if (process.env.ENABLE_REALTIME_STORAGE) {
      this.storeRealtimeBatch(batch);
    }
  }

  /**
   * Analyze real-time patterns
   */
  analyzeRealtimePatterns(batch) {
    // Group by IP hash for analysis
    const ipGroups = batch.reduce((groups, event) => {
      const ip = event.ipHash || 'unknown';
      if (!groups[ip]) groups[ip] = [];
      groups[ip].push(event);
      return groups;
    }, {});

    // Check for suspicious IP activity
    for (const [ipHash, events] of Object.entries(ipGroups)) {
      if (events.length >= MONITORING_CONFIG.SECURITY.SUSPICIOUS_IP_THRESHOLD / 360) { // Per 10 seconds
        this.triggerAlert('SUSPICIOUS_ACTIVITY', `High activity from IP: ${ipHash}`, {
          ipHash,
          eventCount: events.length,
          timeWindow: '10 seconds',
          eventTypes: [...new Set(events.map(e => e.type))]
        });
      }
    }

    // Check error rates
    const errors = batch.filter(event => 
      event.level === 'error' || event.level === 'critical'
    );
    
    const errorRate = errors.length / batch.length;
    if (errorRate > MONITORING_CONFIG.SECURITY.ERROR_RATE_THRESHOLD) {
      this.triggerAlert('HIGH_ERROR_RATE', `High error rate detected: ${(errorRate * 100).toFixed(1)}%`, {
        errorRate,
        totalEvents: batch.length,
        errorEvents: errors.length
      });
    }
  }

  /**
   * Perform periodic analysis
   */
  performPeriodicAnalysis() {
    // Analyze performance metrics
    if (this.performanceMetrics.length > 0) {
      const recentMetrics = this.performanceMetrics.filter(metric => 
        new Date(metric.timestamp).getTime() > Date.now() - 300000 // Last 5 minutes
      );

      const avgResponseTime = this.calculateAverageResponseTime(recentMetrics);
      if (avgResponseTime > MONITORING_CONFIG.SECURITY.RESPONSE_TIME_THRESHOLD) {
        this.triggerAlert('PERFORMANCE_DEGRADATION', `High response time: ${avgResponseTime}ms`, {
          averageResponseTime: avgResponseTime,
          sampleSize: recentMetrics.length
        });
      }
    }

    // Clean up old data
    this.cleanupOldData();
  }

  /**
   * Calculate average response time
   */
  calculateAverageResponseTime(metrics) {
    const responseTimes = metrics
      .filter(metric => metric.metric === 'response_time')
      .map(metric => metric.value);
    
    if (responseTimes.length === 0) return 0;
    
    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  }

  /**
   * Store real-time batch (placeholder for external storage)
   */
  storeRealtimeBatch(batch) {
    // This would integrate with external logging systems like:
    // - Elasticsearch
    // - Splunk
    // - AWS CloudWatch
    // - DataDog
    
    // For now, we'll just log to file
    const batchLog = {
      timestamp: new Date().toISOString(),
      batchSize: batch.length,
      events: batch
    };
    
    this.logger.info('Real-time batch processed', batchLog);
  }

  /**
   * Clean up old data
   */
  cleanupOldData() {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    // Clean up alert cooldowns
    for (const [key, timestamp] of this.alertCooldowns.entries()) {
      if (now - timestamp > MONITORING_CONFIG.REALTIME.ALERT_COOLDOWN * 2) {
        this.alertCooldowns.delete(key);
      }
    }

    // Clean up performance metrics
    this.performanceMetrics = this.performanceMetrics.filter(metric => 
      new Date(metric.timestamp).getTime() > now - maxAge
    );
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats() {
    const now = Date.now();
    const lastHour = now - 60 * 60 * 1000;
    
    const recentPerformanceMetrics = this.performanceMetrics.filter(metric => 
      new Date(metric.timestamp).getTime() > lastHour
    );

    return {
      securityEvents: {
        total: Array.from(this.securityEvents.values()).reduce((sum, event) => sum + event.count, 0),
        types: Array.from(this.securityEvents.keys()),
        recent: Array.from(this.securityEvents.values())
          .filter(event => new Date(event.lastSeen).getTime() > lastHour)
          .length
      },
      performance: {
        metricsCollected: this.performanceMetrics.length,
        recentMetrics: recentPerformanceMetrics.length,
        averageResponseTime: this.calculateAverageResponseTime(recentPerformanceMetrics)
      },
      alerts: {
        activeCooldowns: this.alertCooldowns.size,
        recentAlerts: Array.from(this.alertCooldowns.values())
          .filter(timestamp => now - timestamp < 60 * 60 * 1000).length
      },
      realtime: {
        bufferSize: this.realtimeBuffer.length,
        memoryUsage: process.memoryUsage()
      }
    };
  }
}

// Initialize security logger
const securityLogger = new SecurityLogger();

/**
 * Request logging middleware
 */
export const requestLoggingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Generate request ID for tracing
  const requestId = createHash('sha256')
    .update(req.ip + Date.now() + Math.random())
    .digest('hex')
    .substring(0, 12);
  
  req.requestId = requestId;

  // Log request start
  const requestData = {
    requestId,
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
    walletAddress: req.user?.walletAddress,
    contentLength: req.get('Content-Length'),
    referer: req.get('Referer')
  };

  securityLogger.logger.info('Request started', {
    type: 'request',
    ...requestData
  });

  // Override res.send to capture response
  const originalSend = res.send;
  res.send = function(data) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Log response
    const responseData = {
      requestId,
      statusCode: res.statusCode,
      responseTime,
      contentLength: data ? data.length : 0,
      success: res.statusCode < 400
    };

    // Log performance metric
    securityLogger.logPerformanceMetric('response_time', responseTime, {
      path: req.path,
      method: req.method,
      statusCode: res.statusCode
    });

    // Log based on status code
    if (res.statusCode >= 500) {
      securityLogger.logSecurityEvent('error', 'Server error response', {
        ...requestData,
        ...responseData,
        error: data
      });
    } else if (res.statusCode >= 400) {
      securityLogger.logSecurityEvent('warning', 'Client error response', {
        ...requestData,
        ...responseData
      });
    } else {
      securityLogger.logger.info('Request completed', {
        type: 'response',
        ...requestData,
        ...responseData
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Security event logging middleware
 */
export const securityEventMiddleware = (req, res, next) => {
  // Add security logging methods to request
  req.logSecurityEvent = (level, message, metadata = {}) => {
    securityLogger.logSecurityEvent(level, message, {
      requestId: req.requestId,
      ip: req.ip,
      userId: req.user?.id,
      walletAddress: req.user?.walletAddress,
      path: req.path,
      method: req.method,
      ...metadata
    });
  };

  req.logGamingEvent = (message, gamingData, metadata = {}) => {
    securityLogger.logGamingEvent(message, gamingData, {
      requestId: req.requestId,
      ip: req.ip,
      userId: req.user?.id,
      walletAddress: req.user?.walletAddress,
      path: req.path,
      method: req.method,
      ...metadata
    });
  };

  next();
};

/**
 * Gaming analytics middleware
 */
export const gamingAnalyticsMiddleware = (req, res, next) => {
  if (!MONITORING_CONFIG.GAMING) {
    return next();
  }

  // Track gaming-specific events
  const originalSend = res.send;
  res.send = function(data) {
    const gamingData = {};

    // Track voting events
    if (req.path.includes('/voting') && MONITORING_CONFIG.GAMING.VOTE_ANALYTICS) {
      gamingData.vote = {
        contentId: req.body?.contentId,
        voteType: req.body?.voteType,
        mlgAmount: req.body?.mlgAmount,
        analysis: req.voteAnalysis
      };
    }

    // Track clan events
    if (req.path.includes('/clan') && MONITORING_CONFIG.GAMING.CLAN_ANALYTICS) {
      gamingData.clan = {
        clanId: req.body?.clanId || req.params?.clanId,
        action: req.method,
        analysis: req.clanAnalysis || req.invitationAnalysis || req.roleChangeAnalysis || req.joinAnalysis
      };
    }

    // Track token transactions
    if (req.path.includes('/token') && MONITORING_CONFIG.GAMING.TOKEN_TRANSACTION_TRACKING) {
      gamingData.token = {
        amount: req.body?.amount,
        operation: req.body?.operation,
        walletAddress: req.user?.walletAddress
      };
    }

    // Log gaming event if data exists
    if (Object.keys(gamingData).length > 0) {
      securityLogger.logGamingEvent('Gaming event tracked', gamingData, {
        requestId: req.requestId,
        statusCode: res.statusCode
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Error logging middleware
 */
export const errorLoggingMiddleware = (error, req, res, next) => {
  // Log the error
  securityLogger.logSecurityEvent('error', 'Unhandled application error', {
    requestId: req.requestId,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    ip: req.ip,
    userId: req.user?.id,
    path: req.path,
    method: req.method
  });

  // Continue to next error handler
  next(error);
};

/**
 * Get security logger instance
 */
export const getSecurityLogger = () => securityLogger;

/**
 * Get monitoring statistics endpoint
 */
export const getMonitoringStats = (req, res) => {
  if (!req.user?.roles?.includes('admin')) {
    return res.status(403).json({
      error: 'Insufficient permissions',
      code: 'ADMIN_REQUIRED'
    });
  }

  const stats = securityLogger.getMonitoringStats();
  res.json({
    success: true,
    stats,
    timestamp: new Date().toISOString()
  });
};

/**
 * Cleanup function for graceful shutdown
 */
export const cleanup = () => {
  securityLogger.logger.end();
};

export default {
  requestLoggingMiddleware,
  securityEventMiddleware,
  gamingAnalyticsMiddleware,
  errorLoggingMiddleware,
  getSecurityLogger,
  getMonitoringStats,
  cleanup
};