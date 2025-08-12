/**
 * @fileoverview CDN Security System
 * Handles authentication, rate limiting, and security protection for CDN endpoints
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

/**
 * CDN Security Manager
 */
export class CDNSecurityManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Authentication
      enableSignedUrls: config.enableSignedUrls !== false,
      urlSigningSecret: config.urlSigningSecret || process.env.CDN_SIGNING_SECRET || 'default-secret',
      defaultUrlTtl: config.defaultUrlTtl || 3600, // 1 hour
      
      // Rate Limiting
      rateLimiting: {
        enabled: config.rateLimiting?.enabled !== false,
        windowMs: config.rateLimiting?.windowMs || 60000, // 1 minute
        maxRequests: config.rateLimiting?.maxRequests || 1000,
        skipSuccessfulRequests: config.rateLimiting?.skipSuccessfulRequests || false,
        skipFailedRequests: config.rateLimiting?.skipFailedRequests || false,
        ...config.rateLimiting
      },
      
      // DDoS Protection
      ddosProtection: {
        enabled: config.ddosProtection?.enabled !== false,
        threshold: config.ddosProtection?.threshold || 10000,
        windowMs: config.ddosProtection?.windowMs || 60000,
        blockDuration: config.ddosProtection?.blockDuration || 3600000, // 1 hour
        ...config.ddosProtection
      },
      
      // Bot Protection
      botProtection: {
        enabled: config.botProtection?.enabled !== false,
        challengeMode: config.botProtection?.challengeMode || 'javascript',
        whitelist: config.botProtection?.whitelist || [],
        blacklist: config.botProtection?.blacklist || [],
        ...config.botProtection
      },
      
      // CORS
      cors: {
        enabled: config.cors?.enabled !== false,
        allowedOrigins: config.cors?.allowedOrigins || ['https://mlg.clan'],
        allowedMethods: config.cors?.allowedMethods || ['GET', 'HEAD', 'OPTIONS'],
        maxAge: config.cors?.maxAge || 86400,
        ...config.cors
      },
      
      ...config
    };
    
    this.rateLimitStore = new Map();
    this.ddosStore = new Map();
    this.blockedIPs = new Set();
    this.whitelistedIPs = new Set();
    this.apiKeys = new Map();
    this.securityEvents = [];
    
    this.initializeSecurity();
  }

  /**
   * Initialize security system
   */
  initializeSecurity() {
    this.startCleanupTasks();
    this.setupEventHandlers();
    this.loadSecurityConfiguration();
  }

  /**
   * Generate signed URL for protected content
   * @param {string} url - Original URL
   * @param {Object} options - Signing options
   * @returns {string} - Signed URL
   */
  generateSignedUrl(url, options = {}) {
    if (!this.config.enableSignedUrls) {
      return url;
    }
    
    const {
      expires = Math.floor(Date.now() / 1000) + this.config.defaultUrlTtl,
      apiKey = null,
      userAgent = null,
      referer = null,
      ipAddress = null
    } = options;
    
    const urlParts = new URL(url);
    const path = urlParts.pathname + urlParts.search;
    
    // Create signature payload
    const signatureData = {
      path,
      expires,
      apiKey,
      userAgent,
      referer,
      ipAddress
    };
    
    // Generate signature
    const signature = this.createSignature(signatureData);
    
    // Add signature parameters
    urlParts.searchParams.set('expires', expires.toString());
    urlParts.searchParams.set('signature', signature);
    
    if (apiKey) {
      urlParts.searchParams.set('key', apiKey);
    }
    
    return urlParts.toString();
  }

  /**
   * Verify signed URL
   * @param {string} url - Signed URL
   * @param {Object} context - Request context
   * @returns {Object} - Verification result
   */
  verifySignedUrl(url, context = {}) {
    if (!this.config.enableSignedUrls) {
      return { valid: true, reason: 'Signed URLs disabled' };
    }
    
    try {
      const urlParts = new URL(url);
      const signature = urlParts.searchParams.get('signature');
      const expires = parseInt(urlParts.searchParams.get('expires') || '0');
      const apiKey = urlParts.searchParams.get('key');
      
      if (!signature || !expires) {
        return { valid: false, reason: 'Missing signature or expiration' };
      }
      
      // Check expiration
      if (expires < Math.floor(Date.now() / 1000)) {
        return { valid: false, reason: 'URL expired' };
      }
      
      // Remove signature parameters for verification
      urlParts.searchParams.delete('signature');
      urlParts.searchParams.delete('expires');
      urlParts.searchParams.delete('key');
      
      const path = urlParts.pathname + urlParts.search;
      
      // Create expected signature
      const signatureData = {
        path,
        expires,
        apiKey,
        userAgent: context.userAgent,
        referer: context.referer,
        ipAddress: context.ipAddress
      };
      
      const expectedSignature = this.createSignature(signatureData);
      
      if (signature !== expectedSignature) {
        return { valid: false, reason: 'Invalid signature' };
      }
      
      return { 
        valid: true, 
        expires: new Date(expires * 1000),
        apiKey 
      };
    } catch (error) {
      return { valid: false, reason: `Verification error: ${error.message}` };
    }
  }

  /**
   * Create cryptographic signature
   * @param {Object} data - Data to sign
   * @returns {string} - Signature
   */
  createSignature(data) {
    const payload = Object.entries(data)
      .filter(([key, value]) => value !== null && value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    return crypto
      .createHmac('sha256', this.config.urlSigningSecret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Check rate limiting for IP address
   * @param {string} ipAddress - Client IP address
   * @param {Object} options - Rate limit options
   * @returns {Object} - Rate limit check result
   */
  checkRateLimit(ipAddress, options = {}) {
    if (!this.config.rateLimiting.enabled) {
      return { allowed: true, reason: 'Rate limiting disabled' };
    }
    
    const {
      windowMs = this.config.rateLimiting.windowMs,
      maxRequests = this.config.rateLimiting.maxRequests
    } = options;
    
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get or create rate limit data for IP
    if (!this.rateLimitStore.has(ipAddress)) {
      this.rateLimitStore.set(ipAddress, []);
    }
    
    const requests = this.rateLimitStore.get(ipAddress);
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      this.recordSecurityEvent('rate_limit_exceeded', {
        ipAddress,
        requestCount: recentRequests.length,
        limit: maxRequests,
        windowMs
      });
      
      return {
        allowed: false,
        reason: 'Rate limit exceeded',
        resetTime: new Date(Math.min(...recentRequests) + windowMs),
        retryAfter: Math.ceil((Math.min(...recentRequests) + windowMs - now) / 1000)
      };
    }
    
    // Add current request
    recentRequests.push(now);
    this.rateLimitStore.set(ipAddress, recentRequests);
    
    return {
      allowed: true,
      remaining: maxRequests - recentRequests.length,
      resetTime: new Date(now + windowMs)
    };
  }

  /**
   * Check DDoS protection
   * @param {string} ipAddress - Client IP address
   * @param {Object} context - Request context
   * @returns {Object} - DDoS check result
   */
  checkDDoSProtection(ipAddress, context = {}) {
    if (!this.config.ddosProtection.enabled) {
      return { allowed: true, reason: 'DDoS protection disabled' };
    }
    
    // Check if IP is already blocked
    if (this.blockedIPs.has(ipAddress)) {
      return {
        allowed: false,
        reason: 'IP address blocked due to DDoS',
        blockDuration: this.config.ddosProtection.blockDuration
      };
    }
    
    // Check whitelisted IPs
    if (this.whitelistedIPs.has(ipAddress)) {
      return { allowed: true, reason: 'IP whitelisted' };
    }
    
    const now = Date.now();
    const windowStart = now - this.config.ddosProtection.windowMs;
    
    // Get or create DDoS data for IP
    if (!this.ddosStore.has(ipAddress)) {
      this.ddosStore.set(ipAddress, {
        requests: [],
        suspiciousActivity: 0,
        lastBlocked: null
      });
    }
    
    const ddosData = this.ddosStore.get(ipAddress);
    
    // Remove old requests
    ddosData.requests = ddosData.requests.filter(req => req.timestamp > windowStart);
    
    // Add current request
    ddosData.requests.push({
      timestamp: now,
      userAgent: context.userAgent,
      path: context.path,
      method: context.method
    });
    
    // Analyze request patterns for suspicious activity
    const suspicionScore = this.calculateSuspicionScore(ddosData.requests, context);
    
    if (suspicionScore > 0.8 || ddosData.requests.length > this.config.ddosProtection.threshold) {
      // Block IP address
      this.blockedIPs.add(ipAddress);
      ddosData.lastBlocked = now;
      
      // Schedule unblock
      setTimeout(() => {
        this.blockedIPs.delete(ipAddress);
      }, this.config.ddosProtection.blockDuration);
      
      this.recordSecurityEvent('ddos_block', {
        ipAddress,
        requestCount: ddosData.requests.length,
        suspicionScore,
        threshold: this.config.ddosProtection.threshold
      });
      
      return {
        allowed: false,
        reason: 'Blocked due to suspicious activity',
        suspicionScore,
        blockDuration: this.config.ddosProtection.blockDuration
      };
    }
    
    return {
      allowed: true,
      requestCount: ddosData.requests.length,
      suspicionScore
    };
  }

  /**
   * Calculate suspicion score based on request patterns
   * @param {Array} requests - Recent requests
   * @param {Object} context - Current request context
   * @returns {number} - Suspicion score (0-1)
   */
  calculateSuspicionScore(requests, context) {
    let score = 0;
    
    if (requests.length === 0) return 0;
    
    // High frequency requests
    if (requests.length > 100) {
      score += 0.3;
    }
    
    // Lack of user agent diversity (bot-like behavior)
    const userAgents = new Set(requests.map(r => r.userAgent).filter(ua => ua));
    if (userAgents.size === 1 && requests.length > 20) {
      score += 0.4;
    }
    
    // Repetitive path patterns
    const paths = requests.map(r => r.path);
    const uniquePaths = new Set(paths);
    if (uniquePaths.size < paths.length * 0.1 && requests.length > 50) {
      score += 0.3;
    }
    
    // Very short intervals between requests
    const intervals = requests.slice(1).map((req, i) => req.timestamp - requests[i].timestamp);
    const avgInterval = intervals.reduce((sum, int) => sum + int, 0) / intervals.length;
    if (avgInterval < 100 && requests.length > 10) { // Less than 100ms average
      score += 0.4;
    }
    
    return Math.min(score, 1);
  }

  /**
   * Check bot protection
   * @param {Object} context - Request context
   * @returns {Object} - Bot protection result
   */
  checkBotProtection(context) {
    if (!this.config.botProtection.enabled) {
      return { allowed: true, reason: 'Bot protection disabled' };
    }
    
    const { userAgent, ipAddress } = context;
    
    // Check whitelist
    if (this.isWhitelistedBot(userAgent)) {
      return { allowed: true, reason: 'Whitelisted bot' };
    }
    
    // Check blacklist
    if (this.isBlacklistedBot(userAgent, ipAddress)) {
      return { allowed: false, reason: 'Blacklisted bot or IP' };
    }
    
    // Analyze user agent for bot patterns
    const botScore = this.analyzeBotSignatures(userAgent);
    
    if (botScore > 0.7) {
      // Require challenge
      const challenge = this.generateBotChallenge(context);
      
      return {
        allowed: false,
        reason: 'Bot challenge required',
        challenge: challenge,
        botScore: botScore
      };
    }
    
    return {
      allowed: true,
      botScore: botScore
    };
  }

  /**
   * Check if user agent is whitelisted bot
   * @param {string} userAgent - User agent string
   * @returns {boolean} - Is whitelisted
   */
  isWhitelistedBot(userAgent) {
    if (!userAgent) return false;
    
    const whitelist = this.config.botProtection.whitelist;
    return whitelist.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(userAgent);
      }
      return userAgent.toLowerCase().includes(pattern.toLowerCase());
    });
  }

  /**
   * Check if user agent or IP is blacklisted
   * @param {string} userAgent - User agent string
   * @param {string} ipAddress - IP address
   * @returns {boolean} - Is blacklisted
   */
  isBlacklistedBot(userAgent, ipAddress) {
    const blacklist = this.config.botProtection.blacklist;
    
    // Check user agent blacklist
    if (userAgent) {
      const isBlacklisted = blacklist.some(pattern => {
        if (pattern instanceof RegExp) {
          return pattern.test(userAgent);
        }
        return userAgent.toLowerCase().includes(pattern.toLowerCase());
      });
      
      if (isBlacklisted) return true;
    }
    
    // Check IP blacklist (could be loaded from external service)
    // For now, just basic checks
    return false;
  }

  /**
   * Analyze user agent for bot signatures
   * @param {string} userAgent - User agent string
   * @returns {number} - Bot score (0-1)
   */
  analyzeBotSignatures(userAgent) {
    if (!userAgent) return 0.8; // No user agent is suspicious
    
    let score = 0;
    const ua = userAgent.toLowerCase();
    
    // Known bot keywords
    const botKeywords = ['bot', 'crawler', 'spider', 'scraper', 'parser', 'indexer'];
    if (botKeywords.some(keyword => ua.includes(keyword))) {
      score += 0.6;
    }
    
    // Programming language user agents
    const progLangPatterns = ['python', 'java', 'php', 'perl', 'ruby', 'curl', 'wget'];
    if (progLangPatterns.some(lang => ua.includes(lang))) {
      score += 0.4;
    }
    
    // Very short user agents
    if (userAgent.length < 20) {
      score += 0.3;
    }
    
    // Unusual version patterns
    if (!/mozilla|webkit|gecko|chrome|firefox|safari|edge/i.test(userAgent)) {
      score += 0.3;
    }
    
    return Math.min(score, 1);
  }

  /**
   * Generate bot challenge
   * @param {Object} context - Request context
   * @returns {Object} - Challenge data
   */
  generateBotChallenge(context) {
    const challengeId = crypto.randomBytes(16).toString('hex');
    
    switch (this.config.botProtection.challengeMode) {
      case 'javascript':
        return {
          type: 'javascript',
          id: challengeId,
          script: this.generateJavaScriptChallenge(),
          timeout: 30000
        };
      
      case 'captcha':
        return {
          type: 'captcha',
          id: challengeId,
          imageUrl: `/captcha/${challengeId}`,
          timeout: 300000
        };
      
      case 'proof_of_work':
        return {
          type: 'proof_of_work',
          id: challengeId,
          difficulty: 4,
          nonce: crypto.randomBytes(8).toString('hex'),
          timeout: 60000
        };
      
      default:
        return {
          type: 'delay',
          id: challengeId,
          delay: 5000
        };
    }
  }

  /**
   * Generate JavaScript challenge
   * @returns {string} - JavaScript challenge code
   */
  generateJavaScriptChallenge() {
    const a = Math.floor(Math.random() * 100) + 1;
    const b = Math.floor(Math.random() * 100) + 1;
    const expected = a + b;
    
    return `
      (function() {
        var result = ${a} + ${b};
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/cdn/challenge-response', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({
          challengeId: '${crypto.randomBytes(16).toString('hex')}',
          result: result,
          timestamp: Date.now()
        }));
      })();
    `;
  }

  /**
   * Verify CORS request
   * @param {Object} context - Request context
   * @returns {Object} - CORS verification result
   */
  verifyCORS(context) {
    if (!this.config.cors.enabled) {
      return { allowed: true, headers: {} };
    }
    
    const { origin, method } = context;
    const allowedOrigins = this.config.cors.allowedOrigins;
    const allowedMethods = this.config.cors.allowedMethods;
    
    // Check origin
    let originAllowed = false;
    if (allowedOrigins.includes('*')) {
      originAllowed = true;
    } else if (origin) {
      originAllowed = allowedOrigins.some(allowed => {
        if (allowed.includes('*')) {
          // Wildcard subdomain matching
          const pattern = allowed.replace('*', '.*');
          return new RegExp(pattern).test(origin);
        }
        return origin === allowed;
      });
    }
    
    // Check method
    const methodAllowed = allowedMethods.includes(method);
    
    if (!originAllowed || !methodAllowed) {
      return {
        allowed: false,
        reason: `CORS: ${!originAllowed ? 'Origin' : 'Method'} not allowed`,
        headers: {}
      };
    }
    
    return {
      allowed: true,
      headers: {
        'Access-Control-Allow-Origin': origin || allowedOrigins[0],
        'Access-Control-Allow-Methods': allowedMethods.join(', '),
        'Access-Control-Max-Age': this.config.cors.maxAge.toString(),
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'false'
      }
    };
  }

  /**
   * Validate API key
   * @param {string} apiKey - API key to validate
   * @param {Object} context - Request context
   * @returns {Object} - Validation result
   */
  validateApiKey(apiKey, context = {}) {
    if (!apiKey) {
      return { valid: false, reason: 'API key required' };
    }
    
    const keyData = this.apiKeys.get(apiKey);
    if (!keyData) {
      return { valid: false, reason: 'Invalid API key' };
    }
    
    // Check if key is active
    if (!keyData.active) {
      return { valid: false, reason: 'API key deactivated' };
    }
    
    // Check expiration
    if (keyData.expiresAt && keyData.expiresAt < Date.now()) {
      return { valid: false, reason: 'API key expired' };
    }
    
    // Check rate limits for this key
    if (keyData.rateLimit) {
      const rateLimitResult = this.checkApiKeyRateLimit(apiKey, keyData.rateLimit);
      if (!rateLimitResult.allowed) {
        return { valid: false, reason: 'API key rate limit exceeded' };
      }
    }
    
    // Check allowed origins/IPs
    if (keyData.allowedOrigins && keyData.allowedOrigins.length > 0) {
      const origin = context.origin || context.referer;
      if (origin && !keyData.allowedOrigins.includes(origin)) {
        return { valid: false, reason: 'Origin not allowed for this API key' };
      }
    }
    
    return {
      valid: true,
      keyData: {
        id: keyData.id,
        name: keyData.name,
        permissions: keyData.permissions,
        usage: keyData.usage
      }
    };
  }

  /**
   * Check API key rate limit
   * @param {string} apiKey - API key
   * @param {Object} rateLimit - Rate limit configuration
   * @returns {Object} - Rate limit result
   */
  checkApiKeyRateLimit(apiKey, rateLimit) {
    const key = `api_key_${apiKey}`;
    return this.checkRateLimit(key, {
      windowMs: rateLimit.windowMs || 60000,
      maxRequests: rateLimit.maxRequests || 1000
    });
  }

  /**
   * Record security event
   * @param {string} type - Event type
   * @param {Object} data - Event data
   */
  recordSecurityEvent(type, data) {
    const event = {
      type,
      timestamp: Date.now(),
      ...data
    };
    
    this.securityEvents.push(event);
    
    // Keep only last 10000 events
    if (this.securityEvents.length > 10000) {
      this.securityEvents.shift();
    }
    
    this.emit('securityEvent', event);
  }

  /**
   * Load security configuration
   */
  loadSecurityConfiguration() {
    // Load API keys (in production, this would come from database)
    this.apiKeys.set('mlg_prod_1234567890', {
      id: 'mlg_prod_1234567890',
      name: 'MLG Production Key',
      active: true,
      permissions: ['content', 'user', 'clan'],
      rateLimit: { windowMs: 60000, maxRequests: 5000 },
      allowedOrigins: ['https://mlg.clan', 'https://app.mlg.clan'],
      usage: { requests: 0, lastUsed: null },
      createdAt: Date.now(),
      expiresAt: null
    });
    
    // Load whitelisted IPs
    this.whitelistedIPs.add('127.0.0.1');
    this.whitelistedIPs.add('::1');
  }

  /**
   * Start cleanup tasks
   */
  startCleanupTasks() {
    // Clean up expired rate limit data
    setInterval(() => {
      const cutoff = Date.now() - this.config.rateLimiting.windowMs * 2;
      
      for (const [ip, requests] of this.rateLimitStore) {
        const validRequests = requests.filter(timestamp => timestamp > cutoff);
        if (validRequests.length === 0) {
          this.rateLimitStore.delete(ip);
        } else {
          this.rateLimitStore.set(ip, validRequests);
        }
      }
    }, 300000); // Every 5 minutes
    
    // Clean up DDoS data
    setInterval(() => {
      const cutoff = Date.now() - this.config.ddosProtection.windowMs * 2;
      
      for (const [ip, data] of this.ddosStore) {
        data.requests = data.requests.filter(req => req.timestamp > cutoff);
        if (data.requests.length === 0 && !data.lastBlocked) {
          this.ddosStore.delete(ip);
        }
      }
    }, 600000); // Every 10 minutes
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.on('securityEvent', (event) => {
      console.log(`🔒 Security Event: ${event.type}`, {
        ip: event.ipAddress,
        timestamp: new Date(event.timestamp).toISOString()
      });
    });
  }

  /**
   * Get security statistics
   * @returns {Object} - Security statistics
   */
  getSecurityStatistics() {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    const recentEvents = this.securityEvents.filter(e => e.timestamp >= last24h);
    
    return {
      rateLimiting: {
        activeIPs: this.rateLimitStore.size,
        totalRequests: Array.from(this.rateLimitStore.values())
          .reduce((sum, requests) => sum + requests.length, 0)
      },
      ddosProtection: {
        monitoredIPs: this.ddosStore.size,
        blockedIPs: this.blockedIPs.size,
        suspiciousActivity: recentEvents.filter(e => e.type === 'ddos_block').length
      },
      securityEvents: {
        last24h: recentEvents.length,
        byType: recentEvents.reduce((acc, event) => {
          acc[event.type] = (acc[event.type] || 0) + 1;
          return acc;
        }, {})
      },
      apiKeys: {
        total: this.apiKeys.size,
        active: Array.from(this.apiKeys.values()).filter(key => key.active).length
      }
    };
  }

  /**
   * Shutdown security system
   */
  shutdown() {
    this.removeAllListeners();
    console.log('CDN security system shutdown');
  }
}

/**
 * Create and export default CDN security manager
 */
export const cdnSecurityManager = new CDNSecurityManager();

/**
 * Express middleware for CDN security
 * @param {Object} options - Middleware options
 * @returns {Function} - Express middleware function
 */
export function cdnSecurityMiddleware(options = {}) {
  return async (req, res, next) => {
    const context = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      origin: req.get('origin'),
      referer: req.get('referer'),
      method: req.method,
      path: req.path
    };
    
    try {
      // Check DDoS protection
      const ddosResult = cdnSecurityManager.checkDDoSProtection(context.ipAddress, context);
      if (!ddosResult.allowed) {
        return res.status(429).json({
          error: 'Too Many Requests',
          reason: ddosResult.reason,
          retryAfter: Math.ceil(ddosResult.blockDuration / 1000)
        });
      }
      
      // Check rate limiting
      const rateLimitResult = cdnSecurityManager.checkRateLimit(context.ipAddress);
      if (!rateLimitResult.allowed) {
        res.set({
          'X-RateLimit-Limit': cdnSecurityManager.config.rateLimiting.maxRequests,
          'X-RateLimit-Remaining': 0,
          'X-RateLimit-Reset': rateLimitResult.resetTime.toISOString(),
          'Retry-After': rateLimitResult.retryAfter
        });
        
        return res.status(429).json({
          error: 'Rate Limit Exceeded',
          retryAfter: rateLimitResult.retryAfter
        });
      }
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': cdnSecurityManager.config.rateLimiting.maxRequests,
        'X-RateLimit-Remaining': rateLimitResult.remaining,
        'X-RateLimit-Reset': rateLimitResult.resetTime.toISOString()
      });
      
      // Check bot protection
      const botResult = cdnSecurityManager.checkBotProtection(context);
      if (!botResult.allowed && botResult.challenge) {
        return res.status(403).json({
          error: 'Bot Challenge Required',
          challenge: botResult.challenge
        });
      }
      
      // Verify CORS
      if (req.method === 'OPTIONS' || context.origin) {
        const corsResult = cdnSecurityManager.verifyCORS(context);
        if (!corsResult.allowed) {
          return res.status(403).json({
            error: 'CORS Not Allowed',
            reason: corsResult.reason
          });
        }
        
        // Set CORS headers
        res.set(corsResult.headers);
        
        if (req.method === 'OPTIONS') {
          return res.status(204).end();
        }
      }
      
      // Check API key if provided
      const apiKey = req.get('x-api-key') || req.query.api_key;
      if (apiKey) {
        const keyValidation = cdnSecurityManager.validateApiKey(apiKey, context);
        if (!keyValidation.valid) {
          return res.status(401).json({
            error: 'Invalid API Key',
            reason: keyValidation.reason
          });
        }
        
        req.apiKey = keyValidation.keyData;
      }
      
      // Add security context to request
      req.security = {
        ddos: ddosResult,
        rateLimit: rateLimitResult,
        bot: botResult,
        context
      };
      
      next();
    } catch (error) {
      console.error('CDN security middleware error:', error);
      res.status(500).json({ error: 'Internal Security Error' });
    }
  };
}