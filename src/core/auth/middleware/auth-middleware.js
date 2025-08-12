/**
 * Authentication Middleware for MLG.clan Platform
 * 
 * Comprehensive Express.js middleware for request authentication,
 * authorization, rate limiting, and security enforcement.
 * 
 * Features:
 * - JWT token validation and session verification
 * - Role-based access control (RBAC) integration
 * - Rate limiting and abuse protection
 * - Request security validation
 * - Activity tracking and session updates
 * - Error handling and security logging
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 */

import jwt from 'jsonwebtoken';
import { AuthService } from '../auth-service.js';
import { SessionManager } from '../session-manager.js';
import { RBACService } from '../rbac.js';

/**
 * Middleware Configuration
 */
const MIDDLEWARE_CONFIG = {
  // Token Configuration
  TOKEN_HEADER: 'authorization',
  TOKEN_PREFIX: 'Bearer ',
  SESSION_HEADER: 'x-session-token',
  
  // Rate Limiting
  DEFAULT_RATE_LIMIT: 100, // requests per minute
  AUTH_RATE_LIMIT: 10, // auth requests per minute
  BURST_LIMIT: 20, // burst requests allowed
  
  // Security Headers
  REQUIRED_HEADERS: ['user-agent'],
  BLOCKED_USER_AGENTS: [
    'bot', 'crawler', 'spider', 'scraper'
  ],
  
  // Request Validation
  MAX_REQUEST_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_HEADER_SIZE: 8192, // 8KB
  
  // Session Configuration
  UPDATE_ACTIVITY_THRESHOLD: 30 * 1000, // 30 seconds
  SESSION_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes
  
  // Security Options
  REQUIRE_HTTPS: process.env.NODE_ENV === 'production',
  STRICT_ORIGIN: process.env.NODE_ENV === 'production',
  ENABLE_CSRF_PROTECTION: true
};

/**
 * Error Types
 */
const MIDDLEWARE_ERRORS = {
  NO_TOKEN: 'NO_TOKEN_PROVIDED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  EXPIRED_TOKEN: 'EXPIRED_TOKEN',
  NO_SESSION: 'NO_SESSION_FOUND',
  INVALID_SESSION: 'INVALID_SESSION',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  RATE_LIMITED: 'RATE_LIMITED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  SECURITY_VIOLATION: 'SECURITY_VIOLATION'
};

/**
 * Authentication Middleware Factory
 */
class AuthMiddleware {
  constructor(options = {}) {
    this.authService = options.authService || new AuthService(options);
    this.sessionManager = options.sessionManager || new SessionManager(options);
    this.rbacService = options.rbacService || new RBACService(options);
    this.logger = options.logger || console;
    
    // Rate limiting storage
    this.rateLimitStore = new Map();
    this.securityLog = new Map();
    
    // Bind methods
    this.authenticate = this.authenticate.bind(this);
    this.requireAuth = this.requireAuth.bind(this);
    this.requirePermissions = this.requirePermissions.bind(this);
    this.requireRoles = this.requireRoles.bind(this);
    this.rateLimit = this.rateLimit.bind(this);
    this.securityCheck = this.securityCheck.bind(this);
    
    // Start cleanup
    this.startCleanupTasks();
  }

  /**
   * Main authentication middleware
   * Validates JWT tokens and establishes user context
   */
  authenticate(options = {}) {
    return async (req, res, next) => {
      try {
        // Security check first
        const securityCheck = this.performSecurityCheck(req);
        if (!securityCheck.valid) {
          return this.sendSecurityError(res, securityCheck.reason);
        }
        
        // Extract token
        const token = this.extractToken(req);
        if (!token && options.required !== false) {
          return this.sendAuthError(res, MIDDLEWARE_ERRORS.NO_TOKEN, 401);
        }
        
        // If no token and optional auth, continue without user
        if (!token && options.required === false) {
          req.user = null;
          req.session = null;
          req.isAuthenticated = false;
          return next();
        }
        
        // Validate token
        const tokenPayload = await this.authService.validateToken(token, 'access');
        if (!tokenPayload) {
          return this.sendAuthError(res, MIDDLEWARE_ERRORS.INVALID_TOKEN, 401);
        }
        
        // Get session if session token is provided
        let session = null;
        const sessionToken = req.headers[MIDDLEWARE_CONFIG.SESSION_HEADER];
        if (sessionToken) {
          session = await this.sessionManager.getSession(sessionToken);
          if (!session) {
            return this.sendAuthError(res, MIDDLEWARE_ERRORS.NO_SESSION, 401);
          }
        }
        
        // Get user data
        const user = await this.authService.getUserById(tokenPayload.sub);
        if (!user) {
          return this.sendAuthError(res, 'USER_NOT_FOUND', 401);
        }
        
        // Check user status
        if (user.status !== 'active') {
          return this.sendAuthError(res, 'ACCOUNT_INACTIVE', 403);
        }
        
        // Update activity if session exists
        if (session) {
          await this.updateSessionActivity(session.id, req);
        }
        
        // Set request context
        req.user = user;
        req.session = session;
        req.tokenPayload = tokenPayload;
        req.isAuthenticated = true;
        
        // Add user permissions and roles
        req.userRoles = tokenPayload.roles || [];
        req.userPermissions = tokenPayload.permissions || [];
        
        // Log successful authentication
        this.logSecurityEvent('AUTH_SUCCESS', {
          userId: user.id,
          walletAddress: user.wallet_address,
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        });
        
        next();
      } catch (error) {
        this.logger.error('Authentication middleware error:', error);
        
        // Handle specific JWT errors
        if (error.message === 'TOKEN_EXPIRED') {
          return this.sendAuthError(res, MIDDLEWARE_ERRORS.EXPIRED_TOKEN, 401);
        } else if (error.message === 'TOKEN_INVALID') {
          return this.sendAuthError(res, MIDDLEWARE_ERRORS.INVALID_TOKEN, 401);
        }
        
        return this.sendAuthError(res, 'AUTHENTICATION_ERROR', 500);
      }
    };
  }

  /**
   * Require authentication middleware
   * Ensures user is authenticated before proceeding
   */
  requireAuth() {
    return this.authenticate({ required: true });
  }

  /**
   * Require specific permissions middleware
   * @param {Array|string} permissions - Required permissions
   * @param {Object} options - Options
   */
  requirePermissions(permissions, options = {}) {
    const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
    
    return async (req, res, next) => {
      try {
        // Ensure user is authenticated
        if (!req.isAuthenticated || !req.user) {
          return this.sendAuthError(res, MIDDLEWARE_ERRORS.NO_TOKEN, 401);
        }
        
        // Check permissions
        const hasPermission = await this.rbacService.checkPermissions(
          req.user.id,
          permissionArray,
          { 
            requireAll: options.requireAll || false,
            context: options.context || {}
          }
        );
        
        if (!hasPermission) {
          this.logSecurityEvent('PERMISSION_DENIED', {
            userId: req.user.id,
            requiredPermissions: permissionArray,
            userPermissions: req.userPermissions,
            path: req.path,
            method: req.method
          });
          
          return this.sendAuthError(res, MIDDLEWARE_ERRORS.INSUFFICIENT_PERMISSIONS, 403);
        }
        
        next();
      } catch (error) {
        this.logger.error('Permission check error:', error);
        return this.sendAuthError(res, 'PERMISSION_CHECK_ERROR', 500);
      }
    };
  }

  /**
   * Require specific roles middleware
   * @param {Array|string} roles - Required roles
   * @param {Object} options - Options
   */
  requireRoles(roles, options = {}) {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    
    return async (req, res, next) => {
      try {
        // Ensure user is authenticated
        if (!req.isAuthenticated || !req.user) {
          return this.sendAuthError(res, MIDDLEWARE_ERRORS.NO_TOKEN, 401);
        }
        
        // Check roles
        const hasRole = await this.rbacService.checkRoles(
          req.user.id,
          roleArray,
          {
            requireAll: options.requireAll || false,
            context: options.context || {}
          }
        );
        
        if (!hasRole) {
          this.logSecurityEvent('ROLE_DENIED', {
            userId: req.user.id,
            requiredRoles: roleArray,
            userRoles: req.userRoles,
            path: req.path,
            method: req.method
          });
          
          return this.sendAuthError(res, MIDDLEWARE_ERRORS.INSUFFICIENT_PERMISSIONS, 403);
        }
        
        next();
      } catch (error) {
        this.logger.error('Role check error:', error);
        return this.sendAuthError(res, 'ROLE_CHECK_ERROR', 500);
      }
    };
  }

  /**
   * Rate limiting middleware
   * @param {Object} options - Rate limiting options
   */
  rateLimit(options = {}) {
    const limit = options.limit || MIDDLEWARE_CONFIG.DEFAULT_RATE_LIMIT;
    const window = options.window || 60 * 1000; // 1 minute
    const burstLimit = options.burstLimit || MIDDLEWARE_CONFIG.BURST_LIMIT;
    
    return (req, res, next) => {
      try {
        const identifier = this.getRateLimitIdentifier(req, options);
        const now = Date.now();
        const windowStart = now - window;
        
        // Get or create rate limit entry
        if (!this.rateLimitStore.has(identifier)) {
          this.rateLimitStore.set(identifier, {
            requests: [],
            burstRequests: 0,
            windowStart: now
          });
        }
        
        const rateLimitData = this.rateLimitStore.get(identifier);
        
        // Clean old requests
        rateLimitData.requests = rateLimitData.requests.filter(
          timestamp => timestamp > windowStart
        );
        
        // Check rate limit
        if (rateLimitData.requests.length >= limit) {
          this.logSecurityEvent('RATE_LIMITED', {
            identifier,
            requestCount: rateLimitData.requests.length,
            limit,
            path: req.path,
            method: req.method
          });
          
          return this.sendRateLimitError(res, {
            limit,
            remaining: 0,
            resetTime: windowStart + window
          });
        }
        
        // Check burst limit
        const recentRequests = rateLimitData.requests.filter(
          timestamp => timestamp > (now - 10000) // Last 10 seconds
        ).length;
        
        if (recentRequests >= burstLimit) {
          return this.sendRateLimitError(res, {
            limit: burstLimit,
            remaining: 0,
            resetTime: now + 10000,
            type: 'burst'
          });
        }
        
        // Record request
        rateLimitData.requests.push(now);
        
        // Set rate limit headers
        res.set({
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': (limit - rateLimitData.requests.length).toString(),
          'X-RateLimit-Reset': Math.ceil((windowStart + window) / 1000).toString()
        });
        
        next();
      } catch (error) {
        this.logger.error('Rate limiting error:', error);
        next(); // Continue on error
      }
    };
  }

  /**
   * Security check middleware
   */
  securityCheck() {
    return (req, res, next) => {
      const check = this.performSecurityCheck(req);
      
      if (!check.valid) {
        return this.sendSecurityError(res, check.reason);
      }
      
      next();
    };
  }

  /**
   * Extract token from request
   * @param {Object} req - Express request object
   * @returns {string|null} JWT token
   */
  extractToken(req) {
    const authHeader = req.headers[MIDDLEWARE_CONFIG.TOKEN_HEADER];
    
    if (authHeader && authHeader.startsWith(MIDDLEWARE_CONFIG.TOKEN_PREFIX)) {
      return authHeader.substring(MIDDLEWARE_CONFIG.TOKEN_PREFIX.length);
    }
    
    // Also check query parameter for WebSocket connections
    if (req.query && req.query.token) {
      return req.query.token;
    }
    
    return null;
  }

  /**
   * Perform security checks on request
   * @param {Object} req - Express request object
   * @returns {Object} Security check result
   */
  performSecurityCheck(req) {
    // Check HTTPS requirement
    if (MIDDLEWARE_CONFIG.REQUIRE_HTTPS && !req.secure && req.get('x-forwarded-proto') !== 'https') {
      return { valid: false, reason: 'HTTPS_REQUIRED' };
    }
    
    // Check required headers
    for (const header of MIDDLEWARE_CONFIG.REQUIRED_HEADERS) {
      if (!req.get(header)) {
        return { valid: false, reason: `MISSING_HEADER_${header.toUpperCase()}` };
      }
    }
    
    // Check user agent
    const userAgent = req.get('user-agent') || '';
    for (const blockedAgent of MIDDLEWARE_CONFIG.BLOCKED_USER_AGENTS) {
      if (userAgent.toLowerCase().includes(blockedAgent)) {
        return { valid: false, reason: 'BLOCKED_USER_AGENT' };
      }
    }
    
    // Check request size
    const contentLength = parseInt(req.get('content-length') || '0');
    if (contentLength > MIDDLEWARE_CONFIG.MAX_REQUEST_SIZE) {
      return { valid: false, reason: 'REQUEST_TOO_LARGE' };
    }
    
    // Check header size
    const headerSize = JSON.stringify(req.headers).length;
    if (headerSize > MIDDLEWARE_CONFIG.MAX_HEADER_SIZE) {
      return { valid: false, reason: 'HEADERS_TOO_LARGE' };
    }
    
    return { valid: true };
  }

  /**
   * Get rate limit identifier
   * @param {Object} req - Express request object
   * @param {Object} options - Options
   * @returns {string} Identifier for rate limiting
   */
  getRateLimitIdentifier(req, options = {}) {
    if (options.byUser && req.user) {
      return `user:${req.user.id}`;
    }
    
    if (options.byWallet && req.user) {
      return `wallet:${req.user.wallet_address}`;
    }
    
    // Default to IP-based
    return `ip:${req.ip}`;
  }

  /**
   * Update session activity
   * @param {string} sessionId - Session ID
   * @param {Object} req - Express request object
   */
  async updateSessionActivity(sessionId, req) {
    try {
      const activityData = {
        lastPath: req.path,
        lastMethod: req.method,
        userAgent: req.get('user-agent'),
        ipAddress: req.ip
      };
      
      await this.sessionManager.updateActivity(sessionId, activityData);
    } catch (error) {
      // Don't fail request on activity update error
      this.logger.warn('Failed to update session activity:', error);
    }
  }

  /**
   * Send authentication error response
   * @param {Object} res - Express response object
   * @param {string} error - Error code
   * @param {number} statusCode - HTTP status code
   */
  sendAuthError(res, error, statusCode = 401) {
    return res.status(statusCode).json({
      success: false,
      error: {
        code: error,
        message: this.getErrorMessage(error),
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Send security error response
   * @param {Object} res - Express response object
   * @param {string} reason - Security violation reason
   */
  sendSecurityError(res, reason) {
    this.logSecurityEvent('SECURITY_VIOLATION', { reason });
    
    return res.status(400).json({
      success: false,
      error: {
        code: MIDDLEWARE_ERRORS.SECURITY_VIOLATION,
        message: 'Security requirements not met',
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Send rate limit error response
   * @param {Object} res - Express response object
   * @param {Object} limitInfo - Rate limit information
   */
  sendRateLimitError(res, limitInfo) {
    res.set({
      'X-RateLimit-Limit': limitInfo.limit.toString(),
      'X-RateLimit-Remaining': limitInfo.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(limitInfo.resetTime / 1000).toString(),
      'Retry-After': Math.ceil((limitInfo.resetTime - Date.now()) / 1000).toString()
    });
    
    return res.status(429).json({
      success: false,
      error: {
        code: MIDDLEWARE_ERRORS.RATE_LIMITED,
        message: limitInfo.type === 'burst' ? 'Burst limit exceeded' : 'Rate limit exceeded',
        retryAfter: Math.ceil((limitInfo.resetTime - Date.now()) / 1000),
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Get human-readable error message
   * @param {string} errorCode - Error code
   * @returns {string} Error message
   */
  getErrorMessage(errorCode) {
    const messages = {
      [MIDDLEWARE_ERRORS.NO_TOKEN]: 'Authentication token required',
      [MIDDLEWARE_ERRORS.INVALID_TOKEN]: 'Invalid authentication token',
      [MIDDLEWARE_ERRORS.EXPIRED_TOKEN]: 'Authentication token expired',
      [MIDDLEWARE_ERRORS.NO_SESSION]: 'Session not found or expired',
      [MIDDLEWARE_ERRORS.INVALID_SESSION]: 'Invalid session',
      [MIDDLEWARE_ERRORS.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',
      [MIDDLEWARE_ERRORS.RATE_LIMITED]: 'Rate limit exceeded',
      [MIDDLEWARE_ERRORS.INVALID_REQUEST]: 'Invalid request',
      [MIDDLEWARE_ERRORS.SECURITY_VIOLATION]: 'Security requirements not met'
    };
    
    return messages[errorCode] || 'Authentication error';
  }

  /**
   * Log security events
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  logSecurityEvent(event, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      data: {
        ...data,
        // Sanitize sensitive data
        userId: data.userId ? `${data.userId.substring(0, 8)}...` : undefined,
        walletAddress: data.walletAddress ? 
          `${data.walletAddress.substring(0, 8)}...${data.walletAddress.substring(-4)}` : 
          undefined
      }
    };
    
    this.logger.info('Security Event:', logEntry);
  }

  /**
   * Start cleanup tasks
   */
  startCleanupTasks() {
    // Clean rate limit store every 5 minutes
    setInterval(() => {
      this.cleanupRateLimitStore();
    }, 5 * 60 * 1000);
  }

  /**
   * Clean up rate limit store
   */
  cleanupRateLimitStore() {
    const now = Date.now();
    const cutoff = now - (60 * 60 * 1000); // 1 hour ago
    
    for (const [identifier, data] of this.rateLimitStore.entries()) {
      // Remove entries with no recent requests
      if (data.requests.length === 0 || Math.max(...data.requests) < cutoff) {
        this.rateLimitStore.delete(identifier);
      }
    }
  }
}

/**
 * Factory function to create middleware instances
 */
export function createAuthMiddleware(options = {}) {
  return new AuthMiddleware(options);
}

/**
 * Convenience functions for common middleware patterns
 */
export const auth = {
  /**
   * Basic authentication middleware
   */
  required: (options) => {
    const middleware = new AuthMiddleware(options);
    return middleware.requireAuth();
  },

  /**
   * Optional authentication middleware
   */
  optional: (options) => {
    const middleware = new AuthMiddleware(options);
    return middleware.authenticate({ required: false });
  },

  /**
   * Role-based access control
   */
  requireRoles: (roles, options) => {
    const middleware = new AuthMiddleware(options);
    return [
      middleware.requireAuth(),
      middleware.requireRoles(roles, options)
    ];
  },

  /**
   * Permission-based access control
   */
  requirePermissions: (permissions, options) => {
    const middleware = new AuthMiddleware(options);
    return [
      middleware.requireAuth(),
      middleware.requirePermissions(permissions, options)
    ];
  },

  /**
   * Rate limiting middleware
   */
  rateLimit: (options) => {
    const middleware = new AuthMiddleware(options);
    return middleware.rateLimit(options);
  },

  /**
   * Security check middleware
   */
  securityCheck: (options) => {
    const middleware = new AuthMiddleware(options);
    return middleware.securityCheck();
  }
};

// Export middleware class and utilities
export { AuthMiddleware, MIDDLEWARE_CONFIG, MIDDLEWARE_ERRORS };
export default AuthMiddleware;