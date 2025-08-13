/**
 * Security Headers and CSRF Protection Middleware for MLG.clan Platform
 * 
 * Comprehensive security headers implementation with CSRF protection, 
 * Content Security Policy, and gaming platform specific security measures.
 * 
 * Features:
 * - Comprehensive security headers (HSTS, CSP, etc.)
 * - CSRF token generation and validation
 * - Bot protection headers
 * - Gaming platform specific security policies
 * - Phantom wallet integration security
 * 
 * @author Claude Code - Security Auditor
 * @version 2.0.0
 * @created 2025-08-11
 */

import helmet from 'helmet';
import { createHash, randomBytes } from 'crypto';
import { 
  gamingCSPMiddleware, 
  cspNonceMiddleware, 
  cspViolationHandler,
  gamingSecurityHeadersMiddleware,
  createEnvironmentCSP 
} from '../csp/csp-middleware.js';
import { web3CSPMiddleware } from '../csp/web3-csp.js';
import CSPViolationMonitor from '../csp/csp-monitor.js';

/**
 * Security Headers Configuration
 */
const SECURITY_HEADERS_CONFIG = {
  // Content Security Policy
  CSP: {
    // Gaming platform domains
    GAMING_DOMAINS: [
      'twitch.tv',
      'youtube.com',
      'discord.com',
      'steam.com',
      'epic.com'
    ],
    
    // Solana/Web3 domains
    WEB3_DOMAINS: [
      'phantom.app',
      'solana.com',
      'solflare.com',
      'solanart.io'
    ],
    
    // CDN and analytics domains
    CDN_DOMAINS: [
      'cdnjs.cloudflare.com',
      'unpkg.com',
      'fonts.googleapis.com',
      'fonts.gstatic.com'
    ],
    
    // Analytics and monitoring
    ANALYTICS_DOMAINS: [
      'google-analytics.com',
      'googletagmanager.com',
      'hotjar.com'
    ]
  },

  // Security headers configuration
  HEADERS: {
    // Strict Transport Security (HSTS)
    HSTS: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    
    // X-Frame-Options
    FRAME_OPTIONS: 'DENY',
    
    // X-Content-Type-Options
    CONTENT_TYPE_OPTIONS: 'nosniff',
    
    // X-XSS-Protection
    XSS_PROTECTION: '1; mode=block',
    
    // Referrer Policy
    REFERRER_POLICY: 'strict-origin-when-cross-origin',
    
    // Permissions Policy
    PERMISSIONS_POLICY: [
      'geolocation=()',
      'microphone=()',
      'camera=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()'
    ].join(', ')
  },

  // CSRF Configuration
  CSRF: {
    TOKEN_LENGTH: 32,
    TOKEN_LIFETIME: 60 * 60 * 1000, // 1 hour
    HEADER_NAME: 'x-csrf-token',
    COOKIE_NAME: 'mlg_csrf_token',
    COOKIE_OPTIONS: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000 // 1 hour
    }
  }
};

/**
 * CSRF Token Manager
 */
class CSRFTokenManager {
  constructor() {
    this.tokenStore = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000); // Cleanup every 5 minutes
  }

  /**
   * Generate a new CSRF token
   */
  generateToken(sessionId) {
    const token = randomBytes(SECURITY_HEADERS_CONFIG.CSRF.TOKEN_LENGTH).toString('hex');
    const expires = Date.now() + SECURITY_HEADERS_CONFIG.CSRF.TOKEN_LIFETIME;
    
    this.tokenStore.set(token, {
      sessionId,
      expires,
      used: false
    });

    return token;
  }

  /**
   * Validate CSRF token
   */
  validateToken(token, sessionId) {
    const tokenData = this.tokenStore.get(token);
    
    if (!tokenData) {
      return { valid: false, reason: 'Token not found' };
    }

    if (tokenData.expires < Date.now()) {
      this.tokenStore.delete(token);
      return { valid: false, reason: 'Token expired' };
    }

    if (tokenData.sessionId !== sessionId) {
      return { valid: false, reason: 'Session mismatch' };
    }

    if (tokenData.used) {
      return { valid: false, reason: 'Token already used' };
    }

    // Mark token as used for one-time use
    tokenData.used = true;
    
    return { valid: true };
  }

  /**
   * Cleanup expired tokens
   */
  cleanup() {
    const now = Date.now();
    for (const [token, data] of this.tokenStore.entries()) {
      if (data.expires < now) {
        this.tokenStore.delete(token);
      }
    }
  }

  /**
   * Get token count (for monitoring)
   */
  getTokenCount() {
    return this.tokenStore.size;
  }
}

// Initialize CSRF token manager
const csrfTokenManager = new CSRFTokenManager();

// Initialize CSP violation monitor
const cspMonitor = new CSPViolationMonitor({
  ALERTS: {
    enableRealTime: process.env.CSP_REAL_TIME_ALERTS !== 'false',
    enableEmail: process.env.CSP_EMAIL_ALERTS === 'true'
  }
});

// Setup monitoring event handlers
cspMonitor.on('alertTriggered', (alert) => {
  console.warn('🚨 CSP Security Alert:', alert);
});

cspMonitor.on('suspiciousActivity', (activity) => {
  console.warn('🔍 Suspicious CSP Activity Detected:', activity);
});

/**
 * Create Content Security Policy
 */
function createContentSecurityPolicy() {
  const config = SECURITY_HEADERS_CONFIG.CSP;
  
  // Combine all allowed domains
  const allDomains = [
    ...config.GAMING_DOMAINS,
    ...config.WEB3_DOMAINS,
    ...config.CDN_DOMAINS,
    ...config.ANALYTICS_DOMAINS
  ];

  const cspDirectives = {
    defaultSrc: ["'self'"],
    
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Required for some gaming integrations
      ...config.CDN_DOMAINS.map(domain => `https://${domain}`),
      ...config.ANALYTICS_DOMAINS.map(domain => `https://${domain}`)
    ],
    
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Required for dynamic gaming UI
      ...config.CDN_DOMAINS.map(domain => `https://${domain}`)
    ],
    
    imgSrc: [
      "'self'",
      'data:',
      'blob:',
      ...allDomains.map(domain => `https://${domain}`)
    ],
    
    connectSrc: [
      "'self'",
      'ws:',
      'wss:',
      ...config.WEB3_DOMAINS.map(domain => `https://${domain}`),
      ...config.ANALYTICS_DOMAINS.map(domain => `https://${domain}`)
    ],
    
    frameSrc: [
      "'self'",
      ...config.GAMING_DOMAINS.map(domain => `https://${domain}`)
    ],
    
    mediaSrc: [
      "'self'",
      'blob:',
      ...config.GAMING_DOMAINS.map(domain => `https://${domain}`)
    ],
    
    fontSrc: [
      "'self'",
      ...config.CDN_DOMAINS.map(domain => `https://${domain}`)
    ],
    
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: []
  };

  return cspDirectives;
}

/**
 * Enhanced Security Headers Middleware with Gaming and Web3 CSP
 */
export const securityHeadersMiddleware = [
  // Web3 and blockchain security headers
  web3CSPMiddleware({
    network: process.env.SOLANA_NETWORK || 'mainnet-beta',
    enabledWallets: ['phantom', 'solflare', 'backpack'],
    enableDeFi: true,
    enableNFTs: true,
    enableGamingProtocols: true
  }),
  
  // CSP nonce generation
  cspNonceMiddleware,
  
  // Gaming-specific security headers
  gamingSecurityHeadersMiddleware,
  
  // Environment-specific CSP
  gamingCSPMiddleware({
    environment: process.env.NODE_ENV || 'development'
  }),
  
  // CSP violation handling
  cspViolationHandler,
  
  // Traditional Helmet security headers (without CSP)
  helmet({
    // Disable CSP here since we handle it above
    contentSecurityPolicy: false,

    // HTTP Strict Transport Security
    hsts: SECURITY_HEADERS_CONFIG.HEADERS.HSTS,

    // X-Frame-Options
    frameguard: {
      action: 'deny'
    },

    // X-Content-Type-Options
    noSniff: true,

    // X-XSS-Protection
    xssFilter: true,

    // Referrer Policy
    referrerPolicy: {
      policy: SECURITY_HEADERS_CONFIG.HEADERS.REFERRER_POLICY
    },

    // Remove X-Powered-By header
    hidePoweredBy: true,

    // DNS Prefetch Control
    dnsPrefetchControl: {
      allow: false
    },

    // Expect-CT (deprecated but still useful for older browsers)
    expectCt: {
      enforce: true,
      maxAge: 86400 // 24 hours
    }
  })
];

/**
 * Gaming-specific security headers middleware
 */
export const gamingSecurityHeaders = (req, res, next) => {
  // Gaming platform specific headers
  res.setHeader('X-Gaming-Platform', 'MLG.clan');
  res.setHeader('X-Web3-Enabled', 'true');
  res.setHeader('X-Phantom-Compatible', 'true');
  
  // Bot protection headers
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  
  // Gaming performance headers
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for real-time gaming
  
  // Permissions Policy for gaming features
  res.setHeader('Permissions-Policy', SECURITY_HEADERS_CONFIG.HEADERS.PERMISSIONS_POLICY);
  
  // Additional security headers for gaming
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('X-Download-Options', 'noopen');
  
  next();
};

/**
 * CSRF Token Generation Middleware
 */
export const generateCSRFToken = (req, res, next) => {
  // Generate session ID if not exists
  if (!req.session) {
    req.session = {};
  }
  
  if (!req.session.id) {
    req.session.id = createHash('sha256')
      .update(req.ip + Date.now() + Math.random())
      .digest('hex');
  }

  // Generate CSRF token
  const csrfToken = csrfTokenManager.generateToken(req.session.id);
  
  // Set token in cookie
  res.cookie(
    SECURITY_HEADERS_CONFIG.CSRF.COOKIE_NAME,
    csrfToken,
    SECURITY_HEADERS_CONFIG.CSRF.COOKIE_OPTIONS
  );
  
  // Add token to response locals for templates
  res.locals.csrfToken = csrfToken;
  
  // Add token to response header for AJAX requests
  res.setHeader('X-CSRF-Token', csrfToken);
  
  next();
};

/**
 * CSRF Token Validation Middleware
 */
export const validateCSRFToken = (req, res, next) => {
  // Skip validation for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip validation for API health checks
  if (req.path === '/api/health' || req.path === '/api/status') {
    return next();
  }

  // Get session ID
  const sessionId = req.session?.id;
  if (!sessionId) {
    return res.status(403).json({
      error: 'CSRF validation failed',
      code: 'NO_SESSION',
      message: 'Session not found'
    });
  }

  // Get CSRF token from header or body
  const csrfToken = req.headers[SECURITY_HEADERS_CONFIG.CSRF.HEADER_NAME] || 
                   req.body._csrfToken ||
                   req.cookies[SECURITY_HEADERS_CONFIG.CSRF.COOKIE_NAME];

  if (!csrfToken) {
    return res.status(403).json({
      error: 'CSRF validation failed',
      code: 'NO_CSRF_TOKEN',
      message: 'CSRF token is required'
    });
  }

  // Validate token
  const validation = csrfTokenManager.validateToken(csrfToken, sessionId);
  
  if (!validation.valid) {
    return res.status(403).json({
      error: 'CSRF validation failed',
      code: 'INVALID_CSRF_TOKEN',
      message: `CSRF token validation failed: ${validation.reason}`
    });
  }

  next();
};

/**
 * Anti-bot protection middleware
 */
export const botProtectionMiddleware = (req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const suspiciousBotPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /automation/i,
    /headless/i,
    /phantom/i // Not Phantom Wallet, but PhantomJS
  ];

  // Check for suspicious bot patterns
  const isSuspiciousBot = suspiciousBotPatterns.some(pattern => pattern.test(userAgent));
  
  if (isSuspiciousBot) {
    // Add bot detection headers
    res.setHeader('X-Bot-Detected', 'true');
    res.setHeader('X-Bot-Challenge', 'required');
    
    // Log suspicious bot activity
    console.warn('Suspicious bot detected:', {
      ip: req.ip,
      userAgent,
      path: req.path,
      timestamp: new Date().toISOString()
    });

    // For gaming endpoints, block suspicious bots
    if (req.path.includes('/api/voting') || 
        req.path.includes('/api/content') ||
        req.path.includes('/api/clan')) {
      
      return res.status(429).json({
        error: 'Bot protection active',
        code: 'BOT_PROTECTION',
        message: 'Automated requests are not allowed for this endpoint'
      });
    }
  }

  // Add challenge header for verification
  res.setHeader('X-Challenge-Required', 'false');
  
  next();
};

/**
 * Security monitoring middleware
 */
export const securityMonitoringMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Track security-related request data
  const securityData = {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    method: req.method,
    path: req.path,
    hasCSRFToken: !!req.headers[SECURITY_HEADERS_CONFIG.CSRF.HEADER_NAME],
    hasSession: !!req.session?.id,
    isAuthenticated: !!req.user,
    userRoles: req.user?.roles || []
  };

  // Monitor response
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    
    // Log security events
    if (res.statusCode === 403 || res.statusCode === 401) {
      console.warn('Security event:', {
        ...securityData,
        statusCode: res.statusCode,
        responseTime
      });
    }

    // Monitor CSRF token usage
    if (securityData.hasCSRFToken && res.statusCode === 200) {
      console.debug('CSRF token validated successfully:', {
        ip: req.ip,
        path: req.path,
        responseTime
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Web3/Phantom wallet security headers
 */
export const web3SecurityHeaders = (req, res, next) => {
  // Phantom wallet specific headers
  res.setHeader('X-Phantom-Compatible', 'true');
  res.setHeader('X-Solana-Network', process.env.SOLANA_NETWORK || 'mainnet-beta');
  
  // Web3 security headers
  res.setHeader('X-Web3-Security', 'enabled');
  res.setHeader('X-Wallet-Connect-Allowed', 'phantom,solflare,backpack');
  
  // Additional CORS headers for Web3
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Wallet-Address');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  }
  
  next();
};

/**
 * Get CSRF token manager instance (for testing/management)
 */
export const getCSRFTokenManager = () => csrfTokenManager;

/**
 * Get CSP violation monitor instance
 */
export const getCSPMonitor = () => cspMonitor;

/**
 * Enhanced cleanup function for graceful shutdown
 */
export const cleanup = () => {
  if (csrfTokenManager.cleanupInterval) {
    clearInterval(csrfTokenManager.cleanupInterval);
  }
  
  // Cleanup CSP monitor
  if (cspMonitor) {
    cspMonitor.shutdown();
  }
};

export default {
  securityHeadersMiddleware,
  gamingSecurityHeaders,
  generateCSRFToken,
  validateCSRFToken,
  botProtectionMiddleware,
  securityMonitoringMiddleware,
  web3SecurityHeaders,
  getCSRFTokenManager,
  getCSPMonitor,
  cleanup,
  // New CSP system exports
  gamingCSPMiddleware,
  cspNonceMiddleware,
  cspViolationHandler,
  gamingSecurityHeadersMiddleware,
  createEnvironmentCSP,
  web3CSPMiddleware
};