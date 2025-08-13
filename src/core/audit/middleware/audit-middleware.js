/**
 * Gaming Platform Audit Middleware
 * Express.js middleware for seamless audit logging integration
 * 
 * Features:
 * - Automatic audit logging for all HTTP requests
 * - Gaming-specific request context enrichment
 * - Performance-optimized audit processing
 * - Real-time security monitoring
 * - Web3 transaction audit integration
 * - Gaming workflow audit tracking
 * 
 * @author Claude Code - Security and Performance Auditor
 * @version 1.0.0
 * @created 2025-08-13
 */

import AuditIntegrationManager from '../audit-integration-manager.js';
import { performance } from 'perf_hooks';
import crypto from 'crypto';

/**
 * Audit Middleware Configuration
 */
const AUDIT_MIDDLEWARE_CONFIG = {
  // Performance settings
  enabled: true,
  asyncLogging: true,
  batchProcessing: true,
  performanceThreshold: 5, // milliseconds
  
  // Gaming-specific settings
  gamingRoutes: ['/api/tournament', '/api/clan', '/api/voting', '/api/content'],
  web3Routes: ['/api/wallet', '/api/token', '/api/transaction'],
  authRoutes: ['/api/auth', '/api/login', '/api/logout'],
  
  // Audit levels by route pattern
  auditLevels: {
    '/api/auth/*': 'high',
    '/api/tournament/*': 'critical',
    '/api/voting/*': 'critical',
    '/api/clan/*': 'high',
    '/api/wallet/*': 'critical',
    '/api/admin/*': 'critical',
    '/api/*': 'medium'
  },
  
  // Sensitive data patterns to redact
  sensitivePatterns: [
    /password/i,
    /private.*key/i,
    /seed.*phrase/i,
    /mnemonic/i,
    /secret/i
  ],
  
  // Gaming context extraction
  gamingContextExtractors: {
    tournament: (req) => ({
      tournamentId: req.params.tournamentId || req.body.tournamentId,
      action: req.method + '_' + req.route?.path
    }),
    clan: (req) => ({
      clanId: req.params.clanId || req.body.clanId,
      action: req.method + '_' + req.route?.path
    }),
    voting: (req) => ({
      proposalId: req.params.proposalId || req.body.proposalId,
      action: req.method + '_' + req.route?.path
    })
  }
};

/**
 * Gaming Audit Middleware Factory
 */
class GamingAuditMiddleware {
  constructor(auditManager, options = {}) {
    this.auditManager = auditManager;
    this.config = { ...AUDIT_MIDDLEWARE_CONFIG, ...options };
    
    // Performance tracking
    this.performanceMetrics = {
      requestProcessingTime: [],
      auditOverhead: [],
      totalRequests: 0,
      auditedRequests: 0
    };
    
    // Request tracking
    this.activeRequests = new Map();
    this.requestCorrelations = new Map();
    
    this.init();
  }
  
  init() {
    console.log('🎮 Initializing Gaming Audit Middleware...');
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring();
    
    console.log('✅ Gaming Audit Middleware initialized');
  }
  
  /**
   * Main Audit Middleware Function
   */
  createMiddleware() {
    return async (req, res, next) => {
      if (!this.config.enabled) {
        return next();
      }
      
      const startTime = performance.now();
      const requestId = this.generateRequestId();
      
      try {
        // Enrich request with audit context
        req.auditContext = await this.createAuditContext(req, requestId);
        
        // Track active request
        this.activeRequests.set(requestId, {
          requestId,
          startTime: new Date(),
          path: req.path,
          method: req.method,
          userId: req.user?.id
        });
        
        // Setup response audit logging
        this.setupResponseAuditLogging(req, res, requestId, startTime);
        
        // Log request audit (async if enabled)
        if (this.config.asyncLogging) {
          setImmediate(() => this.logRequestAudit(req, 'request_start'));
        } else {
          await this.logRequestAudit(req, 'request_start');
        }
        
        // Track performance
        const auditOverhead = performance.now() - startTime;
        this.performanceMetrics.auditOverhead.push(auditOverhead);
        this.performanceMetrics.totalRequests++;
        
        // Alert if audit overhead is too high for gaming
        if (auditOverhead > this.config.performanceThreshold) {
          this.auditManager.emit('audit_performance_alert', {
            type: 'middleware_overhead',
            overhead: auditOverhead,
            threshold: this.config.performanceThreshold,
            path: req.path
          });
        }
        
        next();
        
      } catch (error) {
        console.error('Audit middleware error:', error);
        // Don't block request on audit failure
        next();
      }
    };
  }
  
  /**
   * Authentication Audit Middleware
   */
  createAuthAuditMiddleware() {
    return async (req, res, next) => {
      try {
        // Extract authentication context
        const authContext = this.extractAuthContext(req);
        
        // Log authentication attempt
        await this.auditManager.logAuthEvent(
          authContext.userId || 'anonymous',
          'auth_attempt',
          {
            method: authContext.method,
            ipAddress: this.getClientIP(req),
            userAgent: req.get('User-Agent'),
            deviceId: req.get('X-Device-ID'),
            walletAddress: authContext.walletAddress,
            timestamp: new Date()
          },
          {
            sessionId: req.sessionID,
            correlationId: req.auditContext?.correlationId
          }
        );
        
        // Setup authentication result logging
        this.setupAuthResultLogging(req, res, authContext);
        
        next();
        
      } catch (error) {
        console.error('Auth audit middleware error:', error);
        next();
      }
    };
  }
  
  /**
   * Gaming Action Audit Middleware
   */
  createGamingActionMiddleware() {
    return async (req, res, next) => {
      try {
        const gamingContext = this.extractGamingContext(req);
        
        if (gamingContext.isGamingAction) {
          // Log gaming action start
          await this.auditManager.logGamingAction(
            gamingContext.action,
            {
              userId: req.user?.id,
              ...gamingContext.data,
              ipAddress: this.getClientIP(req),
              timestamp: new Date()
            },
            {
              sessionId: req.sessionID,
              correlationId: req.auditContext?.correlationId,
              gamingContext: gamingContext.context
            }
          );
          
          // Setup gaming action result logging
          this.setupGamingActionResultLogging(req, res, gamingContext);
        }
        
        next();
        
      } catch (error) {
        console.error('Gaming action audit middleware error:', error);
        next();
      }
    };
  }
  
  /**
   * Web3 Transaction Audit Middleware
   */
  createWeb3AuditMiddleware() {
    return async (req, res, next) => {
      try {
        const web3Context = this.extractWeb3Context(req);
        
        if (web3Context.isWeb3Action) {
          // Log Web3 action
          await this.auditManager.logWeb3Event(
            web3Context.transactionHash || 'pending',
            web3Context.action,
            {
              walletAddress: web3Context.walletAddress,
              networkType: web3Context.networkType,
              ...web3Context.data,
              timestamp: new Date()
            },
            {
              sessionId: req.sessionID,
              correlationId: req.auditContext?.correlationId,
              blockchain: true
            }
          );
          
          // Setup Web3 result logging
          this.setupWeb3ResultLogging(req, res, web3Context);
        }
        
        next();
        
      } catch (error) {
        console.error('Web3 audit middleware error:', error);
        next();
      }
    };
  }
  
  /**
   * Security Audit Middleware
   */
  createSecurityAuditMiddleware() {
    return async (req, res, next) => {
      try {
        const securityContext = await this.assessSecurityContext(req);
        
        // Log security-relevant events
        if (securityContext.requiresAudit) {
          await this.auditManager.logSecurityEvent(
            securityContext.eventType,
            {
              userId: req.user?.id,
              ipAddress: this.getClientIP(req),
              userAgent: req.get('User-Agent'),
              riskScore: securityContext.riskScore,
              threatIndicators: securityContext.threatIndicators,
              ...securityContext.data
            },
            {
              sessionId: req.sessionID,
              correlationId: req.auditContext?.correlationId,
              securityLevel: securityContext.securityLevel
            }
          );
        }
        
        // Setup security monitoring
        this.setupSecurityMonitoring(req, res, securityContext);
        
        next();
        
      } catch (error) {
        console.error('Security audit middleware error:', error);
        next();
      }
    };
  }
  
  /**
   * Context Extraction Methods
   */
  
  async createAuditContext(req, requestId) {
    return {
      requestId,
      correlationId: this.generateCorrelationId(req),
      timestamp: new Date(),
      path: req.path,
      method: req.method,
      userId: req.user?.id,
      sessionId: req.sessionID,
      ipAddress: this.getClientIP(req),
      userAgent: req.get('User-Agent'),
      deviceId: req.get('X-Device-ID'),
      auditLevel: this.determineAuditLevel(req.path),
      gamingContext: this.extractGamingContext(req),
      web3Context: this.extractWeb3Context(req),
      securityContext: await this.assessSecurityContext(req)
    };
  }
  
  extractAuthContext(req) {
    return {
      method: this.determineAuthMethod(req),
      userId: req.body.userId || req.body.email,
      walletAddress: req.body.walletAddress,
      signature: req.body.signature ? '[REDACTED]' : null,
      mfaToken: req.body.mfaToken ? '[REDACTED]' : null,
      sessionId: req.sessionID
    };
  }
  
  extractGamingContext(req) {
    const path = req.path;
    let context = { isGamingAction: false };
    
    // Tournament context
    if (path.includes('/tournament')) {
      context = {
        isGamingAction: true,
        type: 'tournament',
        action: `tournament_${req.method.toLowerCase()}`,
        data: this.sanitizeRequestData(req.body),
        context: this.config.gamingContextExtractors.tournament(req)
      };
    }
    
    // Clan context
    else if (path.includes('/clan')) {
      context = {
        isGamingAction: true,
        type: 'clan',
        action: `clan_${req.method.toLowerCase()}`,
        data: this.sanitizeRequestData(req.body),
        context: this.config.gamingContextExtractors.clan(req)
      };
    }
    
    // Voting context
    else if (path.includes('/voting')) {
      context = {
        isGamingAction: true,
        type: 'voting',
        action: `voting_${req.method.toLowerCase()}`,
        data: this.sanitizeRequestData(req.body),
        context: this.config.gamingContextExtractors.voting(req)
      };
    }
    
    return context;
  }
  
  extractWeb3Context(req) {
    const path = req.path;
    let context = { isWeb3Action: false };
    
    if (this.config.web3Routes.some(route => path.startsWith(route))) {
      context = {
        isWeb3Action: true,
        action: `web3_${req.method.toLowerCase()}`,
        walletAddress: req.body.walletAddress || req.user?.walletAddress,
        networkType: req.body.network || 'solana',
        transactionHash: req.body.transactionHash,
        data: this.sanitizeRequestData(req.body)
      };
    }
    
    return context;
  }
  
  async assessSecurityContext(req) {
    const riskFactors = [];
    let riskScore = 0;
    
    // Check for suspicious patterns
    if (this.isSuspiciousUserAgent(req.get('User-Agent'))) {
      riskFactors.push('suspicious_user_agent');
      riskScore += 25;
    }
    
    // Check rate limiting
    if (req.rateLimit && req.rateLimit.remaining < 5) {
      riskFactors.push('rate_limit_approaching');
      riskScore += 15;
    }
    
    // Check for admin actions
    const isAdminAction = req.path.startsWith('/api/admin');
    if (isAdminAction) {
      riskFactors.push('admin_action');
      riskScore += 20;
    }
    
    return {
      requiresAudit: riskScore > 0 || isAdminAction,
      eventType: isAdminAction ? 'admin_action' : 'security_check',
      riskScore,
      riskLevel: riskScore >= 50 ? 'HIGH' : riskScore >= 25 ? 'MEDIUM' : 'LOW',
      threatIndicators: riskFactors,
      securityLevel: isAdminAction ? 'CRITICAL' : 'MEDIUM',
      data: {
        path: req.path,
        method: req.method,
        isAdminAction
      }
    };
  }
  
  /**
   * Response Audit Logging Setup
   */
  
  setupResponseAuditLogging(req, res, requestId, startTime) {
    const originalSend = res.send;
    const originalJson = res.json;
    
    res.send = function(data) {
      setImmediate(() => {
        this.logResponseAudit(req, res, data, requestId, startTime);
      }.bind(this));
      
      return originalSend.call(res, data);
    }.bind(this);
    
    res.json = function(data) {
      setImmediate(() => {
        this.logResponseAudit(req, res, data, requestId, startTime);
      }.bind(this));
      
      return originalJson.call(res, data);
    }.bind(this);
  }
  
  setupAuthResultLogging(req, res, authContext) {
    const originalSend = res.send;
    const originalJson = res.json;
    
    const logAuthResult = async (data) => {
      const success = res.statusCode >= 200 && res.statusCode < 300;
      
      await this.auditManager.logAuthEvent(
        authContext.userId || 'anonymous',
        success ? 'auth_success' : 'auth_failure',
        {
          ...authContext,
          success,
          statusCode: res.statusCode,
          responseTime: Date.now() - new Date(req.auditContext.timestamp).getTime(),
          failureReason: success ? null : this.extractFailureReason(data)
        },
        {
          sessionId: req.sessionID,
          correlationId: req.auditContext?.correlationId
        }
      );
    };
    
    res.send = function(data) {
      setImmediate(() => logAuthResult(data));
      return originalSend.call(res, data);
    };
    
    res.json = function(data) {
      setImmediate(() => logAuthResult(data));
      return originalJson.call(res, data);
    };
  }
  
  setupGamingActionResultLogging(req, res, gamingContext) {
    const originalSend = res.send;
    const originalJson = res.json;
    
    const logGamingResult = async (data) => {
      const success = res.statusCode >= 200 && res.statusCode < 300;
      
      await this.auditManager.logGamingAction(
        `${gamingContext.action}_complete`,
        {
          userId: req.user?.id,
          success,
          statusCode: res.statusCode,
          responseTime: Date.now() - new Date(req.auditContext.timestamp).getTime(),
          result: success ? this.sanitizeResponseData(data) : null,
          error: success ? null : this.extractErrorDetails(data),
          ...gamingContext.context
        },
        {
          sessionId: req.sessionID,
          correlationId: req.auditContext?.correlationId,
          gamingContext: gamingContext.context
        }
      );
    };
    
    res.send = function(data) {
      setImmediate(() => logGamingResult(data));
      return originalSend.call(res, data);
    };
    
    res.json = function(data) {
      setImmediate(() => logGamingResult(data));
      return originalJson.call(res, data);
    };
  }
  
  setupWeb3ResultLogging(req, res, web3Context) {
    const originalSend = res.send;
    const originalJson = res.json;
    
    const logWeb3Result = async (data) => {
      const success = res.statusCode >= 200 && res.statusCode < 300;
      
      await this.auditManager.logWeb3Event(
        web3Context.transactionHash || 'unknown',
        `${web3Context.action}_complete`,
        {
          success,
          statusCode: res.statusCode,
          responseTime: Date.now() - new Date(req.auditContext.timestamp).getTime(),
          result: success ? this.sanitizeResponseData(data) : null,
          error: success ? null : this.extractErrorDetails(data),
          ...web3Context.data
        },
        {
          sessionId: req.sessionID,
          correlationId: req.auditContext?.correlationId,
          blockchain: true
        }
      );
    };
    
    res.send = function(data) {
      setImmediate(() => logWeb3Result(data));
      return originalSend.call(res, data);
    };
    
    res.json = function(data) {
      setImmediate(() => logWeb3Result(data));
      return originalJson.call(res, data);
    };
  }
  
  setupSecurityMonitoring(req, res, securityContext) {
    if (securityContext.riskScore >= 50) {
      // High-risk requests require additional monitoring
      const originalSend = res.send;
      const originalJson = res.json;
      
      const logSecurityResult = async (data) => {
        await this.auditManager.logSecurityEvent(
          'high_risk_request_complete',
          {
            userId: req.user?.id,
            path: req.path,
            method: req.method,
            statusCode: res.statusCode,
            responseTime: Date.now() - new Date(req.auditContext.timestamp).getTime(),
            riskScore: securityContext.riskScore,
            threatIndicators: securityContext.threatIndicators
          },
          {
            sessionId: req.sessionID,
            correlationId: req.auditContext?.correlationId,
            securityLevel: 'HIGH'
          }
        );
      };
      
      res.send = function(data) {
        setImmediate(() => logSecurityResult(data));
        return originalSend.call(res, data);
      };
      
      res.json = function(data) {
        setImmediate(() => logSecurityResult(data));
        return originalJson.call(res, data);
      };
    }
  }
  
  /**
   * Audit Logging Methods
   */
  
  async logRequestAudit(req, eventType) {
    try {
      await this.auditManager.logAuditEvent(
        eventType,
        {
          path: req.path,
          method: req.method,
          userId: req.user?.id,
          ipAddress: this.getClientIP(req),
          userAgent: req.get('User-Agent'),
          requestData: this.sanitizeRequestData(req.body),
          queryParams: req.query,
          headers: this.sanitizeHeaders(req.headers),
          timestamp: new Date()
        },
        {
          sessionId: req.sessionID,
          correlationId: req.auditContext?.correlationId,
          auditLevel: req.auditContext?.auditLevel
        }
      );
      
      this.performanceMetrics.auditedRequests++;
      
    } catch (error) {
      console.error('Request audit logging failed:', error);
    }
  }
  
  async logResponseAudit(req, res, data, requestId, startTime) {
    try {
      const processingTime = performance.now() - startTime;
      
      // Remove from active requests
      this.activeRequests.delete(requestId);
      
      await this.auditManager.logAuditEvent(
        'request_complete',
        {
          requestId,
          path: req.path,
          method: req.method,
          userId: req.user?.id,
          statusCode: res.statusCode,
          processingTime,
          responseSize: JSON.stringify(data).length,
          success: res.statusCode >= 200 && res.statusCode < 300,
          responseData: this.sanitizeResponseData(data),
          timestamp: new Date()
        },
        {
          sessionId: req.sessionID,
          correlationId: req.auditContext?.correlationId,
          auditLevel: req.auditContext?.auditLevel
        }
      );
      
      // Track performance metrics
      this.performanceMetrics.requestProcessingTime.push(processingTime);
      
    } catch (error) {
      console.error('Response audit logging failed:', error);
    }
  }
  
  /**
   * Utility Methods
   */
  
  generateRequestId() {
    return 'req_' + crypto.randomUUID().replace(/-/g, '');
  }
  
  generateCorrelationId(req) {
    const userId = req.user?.id || 'anonymous';
    const timestamp = Date.now();
    return `corr_${userId}_${timestamp}`;
  }
  
  getClientIP(req) {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null);
  }
  
  determineAuditLevel(path) {
    for (const [pattern, level] of Object.entries(this.config.auditLevels)) {
      if (path.match(pattern.replace('*', '.*'))) {
        return level;
      }
    }
    return 'low';
  }
  
  determineAuthMethod(req) {
    if (req.body.walletAddress || req.body.signature) return 'wallet';
    if (req.body.socialProvider) return 'social';
    if (req.body.email || req.body.username) return 'credentials';
    return 'unknown';
  }
  
  isSuspiciousUserAgent(userAgent) {
    if (!userAgent) return true;
    
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /automated/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }
  
  sanitizeRequestData(data) {
    if (!data || typeof data !== 'object') return data;
    
    const sanitized = { ...data };
    
    // Remove sensitive fields
    this.config.sensitivePatterns.forEach(pattern => {
      Object.keys(sanitized).forEach(key => {
        if (pattern.test(key)) {
          sanitized[key] = '[REDACTED]';
        }
      });
    });
    
    return sanitized;
  }
  
  sanitizeResponseData(data) {
    if (!data || typeof data !== 'object') return data;
    
    // Only include non-sensitive response data for audit
    const sanitized = {};
    
    if (data.success !== undefined) sanitized.success = data.success;
    if (data.message) sanitized.message = data.message;
    if (data.id) sanitized.id = data.id;
    if (data.status) sanitized.status = data.status;
    
    return sanitized;
  }
  
  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    
    // Remove sensitive headers
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized['x-api-key'];
    
    return {
      'user-agent': sanitized['user-agent'],
      'content-type': sanitized['content-type'],
      'x-device-id': sanitized['x-device-id'],
      'x-gaming-client': sanitized['x-gaming-client']
    };
  }
  
  extractFailureReason(data) {
    if (data && typeof data === 'object') {
      return data.error || data.message || 'Unknown error';
    }
    return 'Unknown error';
  }
  
  extractErrorDetails(data) {
    if (data && typeof data === 'object') {
      return {
        error: data.error,
        message: data.message,
        code: data.code
      };
    }
    return null;
  }
  
  /**
   * Performance Monitoring
   */
  
  setupPerformanceMonitoring() {
    this.performanceMonitor = setInterval(() => {
      const metrics = this.calculatePerformanceMetrics();
      
      // Alert if middleware performance degrades
      if (metrics.averageAuditOverhead > this.config.performanceThreshold) {
        this.auditManager.emit('middleware_performance_alert', {
          type: 'audit_overhead_high',
          current: metrics.averageAuditOverhead,
          threshold: this.config.performanceThreshold
        });
      }
      
      // Clean up old metrics
      this.cleanupPerformanceMetrics();
      
    }, 60000); // Every minute
  }
  
  calculatePerformanceMetrics() {
    const { requestProcessingTime, auditOverhead, totalRequests, auditedRequests } = this.performanceMetrics;
    
    return {
      averageRequestProcessingTime: this.calculateAverage(requestProcessingTime),
      averageAuditOverhead: this.calculateAverage(auditOverhead),
      totalRequests,
      auditedRequests,
      auditCoverage: totalRequests > 0 ? (auditedRequests / totalRequests) * 100 : 0,
      activeRequests: this.activeRequests.size
    };
  }
  
  calculateAverage(array) {
    if (array.length === 0) return 0;
    return array.reduce((sum, val) => sum + val, 0) / array.length;
  }
  
  cleanupPerformanceMetrics() {
    const maxMetrics = 1000;
    
    ['requestProcessingTime', 'auditOverhead'].forEach(key => {
      if (this.performanceMetrics[key].length > maxMetrics) {
        this.performanceMetrics[key] = this.performanceMetrics[key].slice(-maxMetrics);
      }
    });
  }
  
  /**
   * Public API Methods
   */
  
  getMiddlewareMetrics() {
    return this.calculatePerformanceMetrics();
  }
  
  destroy() {
    if (this.performanceMonitor) {
      clearInterval(this.performanceMonitor);
    }
    
    this.activeRequests.clear();
    this.requestCorrelations.clear();
    
    console.log('🎮 Gaming Audit Middleware destroyed');
  }
}

export default GamingAuditMiddleware;