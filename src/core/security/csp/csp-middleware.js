/**
 * Content Security Policy (CSP) Middleware for MLG.clan Gaming Platform
 * 
 * Advanced CSP middleware implementation with gaming-specific security features,
 * Web3 integration support, and comprehensive violation monitoring.
 * 
 * Features:
 * - Dynamic CSP policy generation based on environment and request context
 * - Gaming platform security with tournament and clan protection
 * - Web3 and blockchain integration with Solana/Phantom wallet support
 * - Real-time CSP violation reporting and monitoring
 * - Nonce-based script and style protection
 * - Gaming content security for user-generated content
 * 
 * @author Claude Code - Security & Performance Auditor  
 * @version 1.0.0
 * @created 2025-08-12
 */

import helmet from 'helmet';
import { 
  createGamingCSPConfig, 
  cspNonceManager, 
  categorizeCSPViolation,
  CSP_VIOLATION_CATEGORIES 
} from './csp-config.js';

/**
 * CSP Configuration Options
 */
const CSP_CONFIG = {
  // Environment detection
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // CSP reporting configuration
  REPORTING: {
    enabled: process.env.CSP_REPORTING_ENABLED !== 'false',
    endpoint: process.env.CSP_REPORT_URI || '/api/security/csp-violation',
    maxReports: 1000, // Maximum reports to store in memory
    reportGroupName: 'csp-endpoint'
  },
  
  // Gaming-specific CSP options
  GAMING: {
    allowGameEmbeds: process.env.ALLOW_GAME_EMBEDS !== 'false',
    allowTwitchEmbeds: process.env.ALLOW_TWITCH_EMBEDS !== 'false',
    allowYouTubeEmbeds: process.env.ALLOW_YOUTUBE_EMBEDS !== 'false',
    allowDiscordWidgets: process.env.ALLOW_DISCORD_WIDGETS !== 'false'
  },
  
  // Web3 integration options
  WEB3: {
    allowPhantomWallet: process.env.ALLOW_PHANTOM_WALLET !== 'false',
    allowSolflareWallet: process.env.ALLOW_SOLFLARE_WALLET !== 'false',
    allowBackpackWallet: process.env.ALLOW_BACKPACK_WALLET !== 'false',
    solanaNetwork: process.env.SOLANA_NETWORK || 'mainnet-beta'
  },
  
  // Performance monitoring
  PERFORMANCE: {
    enableMetrics: process.env.CSP_METRICS_ENABLED !== 'false',
    metricsInterval: parseInt(process.env.CSP_METRICS_INTERVAL) || 60000 // 1 minute
  }
};

/**
 * CSP Violation Reporter
 */
class CSPViolationReporter {
  constructor(options = {}) {
    this.options = { ...CSP_CONFIG.REPORTING, ...options };
    this.violations = new Map();
    this.violationCount = 0;
    this.startTime = Date.now();
    
    // Setup periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Cleanup every 5 minutes
  }

  /**
   * Report CSP violation
   */
  reportViolation(violation, req) {
    if (!this.options.enabled) return;

    const timestamp = new Date().toISOString();
    const violationId = this.generateViolationId(violation);
    const category = categorizeCSPViolation(violation);
    
    const enrichedViolation = {
      id: violationId,
      timestamp,
      category,
      violation,
      context: {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        url: req.url,
        method: req.method,
        referer: req.get('Referer'),
        sessionId: req.sessionID,
        userId: req.user?.id || null,
        walletAddress: req.user?.walletAddress || null
      },
      severity: this.calculateSeverity(violation, category),
      count: 1
    };

    // Store or update violation
    if (this.violations.has(violationId)) {
      const existing = this.violations.get(violationId);
      existing.count++;
      existing.lastSeen = timestamp;
    } else {
      this.violations.set(violationId, enrichedViolation);
      this.violationCount++;
    }

    // Log violation based on severity
    this.logViolation(enrichedViolation);
    
    // Trigger alerts for critical violations
    if (enrichedViolation.severity === 'critical') {
      this.triggerCriticalAlert(enrichedViolation);
    }

    // Cleanup if we exceed max reports
    if (this.violations.size > this.options.maxReports) {
      this.cleanup();
    }
  }

  /**
   * Generate unique violation ID
   */
  generateViolationId(violation) {
    const key = `${violation['violated-directive']}-${violation['blocked-uri']}`;
    return require('crypto').createHash('md5').update(key).digest('hex');
  }

  /**
   * Calculate violation severity
   */
  calculateSeverity(violation, category) {
    const blockedUri = violation['blocked-uri'] || '';
    const violatedDirective = violation['violated-directive'] || '';
    
    // Critical: Potential XSS or code injection
    if (violatedDirective.includes('script-src') && 
        (blockedUri.includes('eval') || blockedUri.includes('inline'))) {
      return 'critical';
    }
    
    // High: Web3 wallet security violations
    if (category === CSP_VIOLATION_CATEGORIES.WALLET_INTEGRATION) {
      return 'high';
    }
    
    // High: Gaming platform security violations
    if (category === CSP_VIOLATION_CATEGORIES.GAMING_CONTENT &&
        violatedDirective.includes('script-src')) {
      return 'high';
    }
    
    // Medium: Frame and embed violations
    if (violatedDirective.includes('frame-src') || 
        violatedDirective.includes('frame-ancestors')) {
      return 'medium';
    }
    
    // Low: Style and image violations
    if (violatedDirective.includes('style-src') || 
        violatedDirective.includes('img-src')) {
      return 'low';
    }
    
    return 'medium';
  }

  /**
   * Log violation with appropriate level
   */
  logViolation(violation) {
    const logData = {
      id: violation.id,
      category: violation.category,
      severity: violation.severity,
      directive: violation.violation['violated-directive'],
      blockedUri: violation.violation['blocked-uri'],
      url: violation.context.url,
      userAgent: violation.context.userAgent,
      count: violation.count
    };

    switch (violation.severity) {
      case 'critical':
        console.error('🚨 CRITICAL CSP Violation:', logData);
        break;
      case 'high':
        console.warn('⚠️ HIGH CSP Violation:', logData);
        break;
      case 'medium':
        console.warn('⚡ MEDIUM CSP Violation:', logData);
        break;
      case 'low':
        console.info('ℹ️ LOW CSP Violation:', logData);
        break;
      default:
        console.log('📋 CSP Violation:', logData);
    }
  }

  /**
   * Trigger critical security alert
   */
  triggerCriticalAlert(violation) {
    // In production, this would integrate with alerting systems
    console.error('🚨 CRITICAL SECURITY ALERT - CSP Violation:', {
      id: violation.id,
      category: violation.category,
      violation: violation.violation,
      context: violation.context,
      timestamp: violation.timestamp
    });
    
    // TODO: Integrate with monitoring services (Sentry, DataDog, etc.)
    // TODO: Send to security team notification system
    // TODO: Potentially block/rate-limit the IP if needed
  }

  /**
   * Cleanup old violations
   */
  cleanup() {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    for (const [id, violation] of this.violations.entries()) {
      const violationTime = new Date(violation.timestamp).getTime();
      if (violationTime < cutoffTime) {
        this.violations.delete(id);
      }
    }
  }

  /**
   * Get violation statistics
   */
  getStatistics() {
    const stats = {
      totalViolations: this.violationCount,
      uniqueViolations: this.violations.size,
      byCategory: {},
      bySeverity: {},
      uptime: Date.now() - this.startTime
    };

    for (const violation of this.violations.values()) {
      // Count by category
      stats.byCategory[violation.category] = 
        (stats.byCategory[violation.category] || 0) + violation.count;
      
      // Count by severity
      stats.bySeverity[violation.severity] = 
        (stats.bySeverity[violation.severity] || 0) + violation.count;
    }

    return stats;
  }

  /**
   * Get recent violations
   */
  getRecentViolations(limit = 50) {
    return Array.from(this.violations.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  /**
   * Cleanup on shutdown
   */
  shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Initialize violation reporter
const violationReporter = new CSPViolationReporter();

/**
 * Gaming CSP Middleware
 */
export const gamingCSPMiddleware = (options = {}) => {
  const environment = options.environment || CSP_CONFIG.NODE_ENV;
  const cspConfig = createGamingCSPConfig(environment, options);
  
  return helmet.contentSecurityPolicy({
    directives: cspConfig.directives,
    reportOnly: cspConfig.reportOnly,
    ...(cspConfig.reportUri && {
      reportUriFunction: (req, res) => {
        return cspConfig.reportUri;
      }
    })
  });
};

/**
 * CSP Nonce Injection Middleware
 */
export const cspNonceMiddleware = (req, res, next) => {
  // Generate nonce for this request
  const nonce = cspNonceManager.generateRequestNonce(req);
  
  // Add nonce to response locals for template access
  res.locals.cspNonce = nonce;
  
  // Add nonce to CSP header
  const originalSetHeader = res.setHeader;
  res.setHeader = function(name, value) {
    if (name.toLowerCase() === 'content-security-policy' && value.includes("'self'")) {
      // Add nonce to script-src and style-src
      value = value.replace(
        /(script-src[^;]*)/g, 
        `$1 'nonce-${nonce}'`
      );
      value = value.replace(
        /(style-src[^;]*)/g, 
        `$1 'nonce-${nonce}'`
      );
    }
    return originalSetHeader.call(this, name, value);
  };
  
  next();
};

/**
 * CSP Violation Reporting Endpoint Middleware
 */
export const cspViolationHandler = (req, res, next) => {
  if (req.path === CSP_CONFIG.REPORTING.endpoint && req.method === 'POST') {
    try {
      const violation = req.body;
      
      // Validate violation report
      if (violation && violation['csp-report']) {
        violationReporter.reportViolation(violation['csp-report'], req);
        
        res.status(204).end(); // No content response
        return;
      }
      
      res.status(400).json({ error: 'Invalid CSP violation report' });
    } catch (error) {
      console.error('Error processing CSP violation report:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    next();
  }
};

/**
 * Gaming Platform Security Headers Middleware
 */
export const gamingSecurityHeadersMiddleware = (req, res, next) => {
  // Gaming platform identification
  res.setHeader('X-Gaming-Platform', 'MLG.clan');
  res.setHeader('X-Gaming-Version', '1.0.0');
  
  // Web3 capabilities
  res.setHeader('X-Web3-Enabled', 'true');
  res.setHeader('X-Solana-Network', CSP_CONFIG.WEB3.solanaNetwork);
  res.setHeader('X-Supported-Wallets', 'phantom,solflare,backpack');
  
  // Gaming security features
  res.setHeader('X-Gaming-Security', 'csp-enabled');
  res.setHeader('X-Tournament-Protected', 'true');
  res.setHeader('X-Clan-Verified', 'true');
  
  // CSP reporting
  if (CSP_CONFIG.REPORTING.enabled) {
    res.setHeader('Report-To', JSON.stringify({
      group: CSP_CONFIG.REPORTING.reportGroupName,
      max_age: 86400,
      endpoints: [{ url: CSP_CONFIG.REPORTING.endpoint }]
    }));
  }
  
  next();
};

/**
 * CSP Statistics API Middleware
 */
export const cspStatsMiddleware = (req, res, next) => {
  if (req.path === '/api/security/csp-stats' && req.method === 'GET') {
    // Check if user has admin privileges
    if (!req.user || !req.user.roles?.includes('admin')) {
      return res.status(403).json({ error: 'Insufficient privileges' });
    }
    
    const stats = violationReporter.getStatistics();
    res.json({
      statistics: stats,
      recentViolations: violationReporter.getRecentViolations(10)
    });
    return;
  }
  
  next();
};

/**
 * Environment-Specific CSP Middleware Factory
 */
export const createEnvironmentCSP = (environment) => {
  return [
    gamingSecurityHeadersMiddleware,
    cspNonceMiddleware,
    gamingCSPMiddleware({ environment }),
    cspViolationHandler,
    cspStatsMiddleware
  ];
};

/**
 * Development CSP Middleware (more permissive)
 */
export const developmentCSPMiddleware = createEnvironmentCSP('development');

/**
 * Staging CSP Middleware (moderate security)
 */
export const stagingCSPMiddleware = createEnvironmentCSP('staging');

/**
 * Production CSP Middleware (strict security)
 */
export const productionCSPMiddleware = createEnvironmentCSP('production');

/**
 * Get violation reporter instance
 */
export const getViolationReporter = () => violationReporter;

/**
 * Cleanup function for graceful shutdown
 */
export const cleanup = () => {
  violationReporter.shutdown();
};

export default {
  gamingCSPMiddleware,
  cspNonceMiddleware,
  cspViolationHandler,
  gamingSecurityHeadersMiddleware,
  cspStatsMiddleware,
  createEnvironmentCSP,
  developmentCSPMiddleware,
  stagingCSPMiddleware,
  productionCSPMiddleware,
  getViolationReporter,
  cleanup
};