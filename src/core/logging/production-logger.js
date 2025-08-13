/**
 * Production Logging System
 * Comprehensive logging for production deployment with security and performance optimization
 */

import winston from 'winston';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import environmentManager from '../config/environment-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProductionLogger {
  constructor() {
    this.logger = null;
    this.config = environmentManager.get('monitoring.logging');
    this.isProduction = environmentManager.isProduction();
    this.setupLogger();
  }

  /**
   * Setup Winston logger with production configuration
   */
  setupLogger() {
    // Ensure log directory exists
    this.ensureLogDirectory();

    // Create custom format for gaming platform
    const gamingFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
      winston.format.printf(this.formatLogMessage.bind(this))
    );

    // Create transports
    const transports = this.createTransports();

    // Create logger instance
    this.logger = winston.createLogger({
      level: this.config.level,
      format: gamingFormat,
      defaultMeta: {
        service: 'mlg-clan-platform',
        environment: environmentManager.get('NODE_ENV'),
        version: '1.0.0'
      },
      transports,
      exitOnError: false,
      rejectionHandlers: [
        new winston.transports.File({ 
          filename: this.config.errorFilePath,
          maxsize: this.config.maxSize,
          maxFiles: this.config.maxFiles
        })
      ],
      exceptionHandlers: [
        new winston.transports.File({ 
          filename: this.config.errorFilePath,
          maxsize: this.config.maxSize,
          maxFiles: this.config.maxFiles
        })
      ]
    });

    // Setup log streaming for debugging in development
    if (!this.isProduction) {
      this.setupDebugStreaming();
    }
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDirectory() {
    try {
      const logDir = path.dirname(this.config.filePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const errorLogDir = path.dirname(this.config.errorFilePath);
      if (!fs.existsSync(errorLogDir)) {
        fs.mkdirSync(errorLogDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  /**
   * Create transport configurations
   */
  createTransports() {
    const transports = [];

    // Console transport for development
    if (!this.isProduction) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      );
    }

    // File transport for application logs
    transports.push(
      new winston.transports.File({
        filename: this.config.filePath,
        maxsize: this.config.maxSize,
        maxFiles: this.config.maxFiles,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      })
    );

    // Separate file transport for error logs
    transports.push(
      new winston.transports.File({
        filename: this.config.errorFilePath,
        level: 'error',
        maxsize: this.config.maxSize,
        maxFiles: this.config.maxFiles,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      })
    );

    // HTTP transport for centralized logging (if configured)
    if (process.env.LOG_HTTP_URL) {
      transports.push(
        new winston.transports.Http({
          host: process.env.LOG_HTTP_HOST,
          port: process.env.LOG_HTTP_PORT,
          path: process.env.LOG_HTTP_PATH
        })
      );
    }

    return transports;
  }

  /**
   * Format log messages for gaming platform
   */
  formatLogMessage(info) {
    const {
      timestamp,
      level,
      message,
      service,
      environment,
      version,
      userId,
      walletAddress,
      clanId,
      sessionId,
      requestId,
      feature,
      action,
      duration,
      error,
      metadata,
      ...rest
    } = info;

    // Create base log structure
    const logEntry = {
      timestamp,
      level,
      message,
      service,
      environment,
      version
    };

    // Add gaming-specific context
    if (userId) logEntry.user_id = userId;
    if (walletAddress) logEntry.wallet = this.sanitizeWalletAddress(walletAddress);
    if (clanId) logEntry.clan_id = clanId;
    if (sessionId) logEntry.session_id = sessionId;
    if (requestId) logEntry.request_id = requestId;
    if (feature) logEntry.gaming_feature = feature;
    if (action) logEntry.gaming_action = action;
    if (duration) logEntry.duration_ms = duration;

    // Add error details
    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: this.isProduction ? undefined : error.stack
      };
    }

    // Add metadata
    if (metadata && Object.keys(metadata).length > 0) {
      logEntry.metadata = this.sanitizeMetadata(metadata);
    }

    // Add any remaining fields
    Object.assign(logEntry, rest);

    return JSON.stringify(logEntry);
  }

  /**
   * Setup debug streaming for development
   */
  setupDebugStreaming() {
    if (this.isProduction) return;

    // Create debug stream for real-time monitoring
    this.debugStream = fs.createWriteStream(
      path.join(process.cwd(), 'logs', 'debug-stream.log'),
      { flags: 'a' }
    );

    this.logger.add(
      new winston.transports.Stream({
        stream: this.debugStream,
        level: 'debug'
      })
    );
  }

  /**
   * Sanitize wallet address for privacy
   */
  sanitizeWalletAddress(walletAddress) {
    if (!walletAddress) return null;
    return `***${walletAddress.slice(-4)}`;
  }

  /**
   * Sanitize metadata to remove sensitive information
   */
  sanitizeMetadata(metadata) {
    const sanitized = { ...metadata };

    // Remove sensitive keys
    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'key',
      'privateKey',
      'mnemonic',
      'seed'
    ];

    const sanitizeObject = (obj) => {
      if (typeof obj !== 'object' || obj === null) return obj;

      if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
      }

      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          result[key] = '***REDACTED***';
        } else {
          result[key] = sanitizeObject(value);
        }
      }
      return result;
    };

    return sanitizeObject(sanitized);
  }

  /**
   * Log gaming action with context
   */
  logGamingAction(action, context = {}) {
    this.logger.info('Gaming action performed', {
      feature: 'gaming',
      action,
      ...context
    });
  }

  /**
   * Log voting activity
   */
  logVotingActivity(voteData, context = {}) {
    this.logger.info('Voting activity', {
      feature: 'voting',
      action: 'vote_cast',
      proposal_id: voteData.proposalId,
      vote_type: voteData.voteType,
      tokens_burned: voteData.tokensBurned,
      voting_power: voteData.votingPower,
      ...context
    });
  }

  /**
   * Log clan activity
   */
  logClanActivity(clanData, context = {}) {
    this.logger.info('Clan activity', {
      feature: 'clans',
      action: clanData.action,
      clan_id: clanData.clanId,
      member_count: clanData.memberCount,
      role: clanData.role,
      ...context
    });
  }

  /**
   * Log Web3 transaction
   */
  logWeb3Transaction(transactionData, context = {}) {
    this.logger.info('Web3 transaction', {
      feature: 'web3',
      action: 'transaction',
      transaction_type: transactionData.type,
      signature: transactionData.signature ? 'present' : 'missing',
      amount: transactionData.amount,
      success: transactionData.success,
      network: transactionData.network,
      ...context
    });
  }

  /**
   * Log authentication event
   */
  logAuthEvent(authData, context = {}) {
    this.logger.info('Authentication event', {
      feature: 'auth',
      action: authData.action,
      user_id: authData.userId,
      wallet_address: this.sanitizeWalletAddress(authData.walletAddress),
      success: authData.success,
      method: authData.method,
      ...context
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance(metricData, context = {}) {
    this.logger.info('Performance metric', {
      feature: 'performance',
      action: 'metric_recorded',
      metric_name: metricData.name,
      metric_value: metricData.value,
      metric_unit: metricData.unit,
      category: metricData.category,
      ...context
    });
  }

  /**
   * Log security event
   */
  logSecurityEvent(securityData, context = {}) {
    this.logger.warn('Security event', {
      feature: 'security',
      action: securityData.action,
      threat_level: securityData.threatLevel,
      source_ip: securityData.sourceIp,
      user_agent: securityData.userAgent,
      blocked: securityData.blocked,
      ...context
    });
  }

  /**
   * Log API request
   */
  logAPIRequest(requestData, context = {}) {
    this.logger.info('API request', {
      feature: 'api',
      action: 'request',
      method: requestData.method,
      path: requestData.path,
      status_code: requestData.statusCode,
      response_time: requestData.responseTime,
      user_id: requestData.userId,
      ...context
    });
  }

  /**
   * Log database operation
   */
  logDatabaseOperation(dbData, context = {}) {
    this.logger.info('Database operation', {
      feature: 'database',
      action: dbData.operation,
      table: dbData.table,
      query_time: dbData.queryTime,
      rows_affected: dbData.rowsAffected,
      ...context
    });
  }

  /**
   * Log error with context
   */
  logError(error, context = {}) {
    this.logger.error('Application error', {
      error: {
        name: error.name,
        message: error.message,
        stack: this.isProduction ? undefined : error.stack
      },
      ...context
    });
  }

  /**
   * Log warning
   */
  logWarning(message, context = {}) {
    this.logger.warn(message, context);
  }

  /**
   * Log info
   */
  logInfo(message, context = {}) {
    this.logger.info(message, context);
  }

  /**
   * Log debug (only in development)
   */
  logDebug(message, context = {}) {
    if (!this.isProduction) {
      this.logger.debug(message, context);
    }
  }

  /**
   * Create child logger with persistent context
   */
  createChildLogger(context = {}) {
    return {
      logGamingAction: (action, additionalContext = {}) => 
        this.logGamingAction(action, { ...context, ...additionalContext }),
      
      logVotingActivity: (voteData, additionalContext = {}) => 
        this.logVotingActivity(voteData, { ...context, ...additionalContext }),
      
      logClanActivity: (clanData, additionalContext = {}) => 
        this.logClanActivity(clanData, { ...context, ...additionalContext }),
      
      logWeb3Transaction: (transactionData, additionalContext = {}) => 
        this.logWeb3Transaction(transactionData, { ...context, ...additionalContext }),
      
      logAuthEvent: (authData, additionalContext = {}) => 
        this.logAuthEvent(authData, { ...context, ...additionalContext }),
      
      logPerformance: (metricData, additionalContext = {}) => 
        this.logPerformance(metricData, { ...context, ...additionalContext }),
      
      logSecurityEvent: (securityData, additionalContext = {}) => 
        this.logSecurityEvent(securityData, { ...context, ...additionalContext }),
      
      logAPIRequest: (requestData, additionalContext = {}) => 
        this.logAPIRequest(requestData, { ...context, ...additionalContext }),
      
      logDatabaseOperation: (dbData, additionalContext = {}) => 
        this.logDatabaseOperation(dbData, { ...context, ...additionalContext }),
      
      logError: (error, additionalContext = {}) => 
        this.logError(error, { ...context, ...additionalContext }),
      
      logWarning: (message, additionalContext = {}) => 
        this.logWarning(message, { ...context, ...additionalContext }),
      
      logInfo: (message, additionalContext = {}) => 
        this.logInfo(message, { ...context, ...additionalContext }),
      
      logDebug: (message, additionalContext = {}) => 
        this.logDebug(message, { ...context, ...additionalContext })
    };
  }

  /**
   * Get log statistics
   */
  getLogStatistics() {
    try {
      const appLogStats = fs.statSync(this.config.filePath);
      const errorLogStats = fs.statSync(this.config.errorFilePath);

      return {
        application_log: {
          size: appLogStats.size,
          created: appLogStats.birthtime,
          modified: appLogStats.mtime
        },
        error_log: {
          size: errorLogStats.size,
          created: errorLogStats.birthtime,
          modified: errorLogStats.mtime
        },
        level: this.config.level,
        production_mode: this.isProduction
      };
    } catch (error) {
      return {
        error: 'Unable to get log statistics',
        message: error.message
      };
    }
  }

  /**
   * Rotate logs manually
   */
  rotateLogs() {
    if (this.logger && this.logger.transports) {
      this.logger.transports.forEach(transport => {
        if (transport.rotate && typeof transport.rotate === 'function') {
          transport.rotate();
        }
      });
    }
  }

  /**
   * Close logger and cleanup resources
   */
  close() {
    if (this.logger) {
      this.logger.close();
    }
    
    if (this.debugStream) {
      this.debugStream.end();
    }
  }

  /**
   * Express middleware for request logging
   */
  requestLogger() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Generate request ID
      req.requestId = req.headers['x-request-id'] || 
                      `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Log request start
      this.logAPIRequest({
        method: req.method,
        path: req.path,
        user_agent: req.headers['user-agent'],
        ip: req.ip,
        request_id: req.requestId,
        stage: 'start'
      });

      // Override res.end to log response
      const originalEnd = res.end;
      res.end = function(...args) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // Log request completion
        this.logAPIRequest({
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          responseTime,
          request_id: req.requestId,
          user_id: req.user?.id,
          stage: 'complete'
        });

        originalEnd.apply(res, args);
      }.bind(this);

      next();
    };
  }
}

// Create singleton instance
const productionLogger = new ProductionLogger();

export default productionLogger;
export { ProductionLogger };