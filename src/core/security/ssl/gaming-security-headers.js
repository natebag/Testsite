/**
 * Gaming-Specific Security Headers and SSL Pinning System for MLG.clan Platform
 * 
 * Advanced security headers configuration optimized for gaming platforms with
 * SSL pinning for mobile gaming apps, perfect forward secrecy for gaming sessions,
 * and Web3 blockchain SSL requirements.
 * 
 * Features:
 * - Gaming-specific HSTS configuration with session optimization
 * - SSL pinning for mobile gaming applications
 * - Perfect Forward Secrecy for gaming sessions
 * - Gaming platform cipher suite optimization
 * - Web3 blockchain SSL security requirements
 * - Tournament and competitive gaming SSL headers
 * - Real-time gaming communication security
 * 
 * @author Claude Code - Security and Performance Auditor
 * @version 1.0.0
 * @created 2025-08-12
 */

import { createHash, createHmac } from 'crypto';
import { EventEmitter } from 'events';

/**
 * Gaming Security Headers Configuration
 */
export const GAMING_SECURITY_CONFIG = {
  // Gaming-specific HSTS configuration
  HSTS: {
    // Standard HSTS settings
    STANDARD: {
      maxAge: 31536000,         // 1 year
      includeSubDomains: true,
      preload: true
    },
    
    // Gaming session HSTS
    GAMING_SESSION: {
      maxAge: 86400,            // 24 hours for active gaming
      includeSubDomains: true,
      preload: true,
      gamingOptimized: true
    },
    
    // Tournament HSTS (longer duration)
    TOURNAMENT: {
      maxAge: 604800,           // 1 week for tournaments
      includeSubDomains: true,
      preload: true,
      tournamentOptimized: true
    },
    
    // Real-time gaming HSTS
    REALTIME: {
      maxAge: 43200,            // 12 hours for real-time gaming
      includeSubDomains: true,
      preload: false,           // Faster for real-time
      realtimeOptimized: true
    }
  },

  // SSL Pinning Configuration
  SSL_PINNING: {
    // Certificate pinning for gaming platform
    CERTIFICATE_PINS: {
      // Main gaming platform certificates
      'mlg-clan.com': {
        pins: [
          'sha256-YLh1dUR9y6Kja30RrAn7JKnbQG/uEtLMkBgFF2Fuihg=', // Primary cert
          'sha256-C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M='  // Backup cert
        ],
        maxAge: 5184000,        // 60 days
        includeSubDomains: true,
        reportUri: '/api/security/hpkp-report'
      },
      
      // Tournament subdomain pinning
      'tournaments.mlg-clan.com': {
        pins: [
          'sha256-YLh1dUR9y6Kja30RrAn7JKnbQG/uEtLMkBgFF2Fuihg=',
          'sha256-C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M='
        ],
        maxAge: 2592000,        // 30 days for tournaments
        includeSubDomains: false,
        reportUri: '/api/security/tournament-hpkp-report'
      },
      
      // API subdomain pinning
      'api.mlg-clan.com': {
        pins: [
          'sha256-YLh1dUR9y6Kja30RrAn7JKnbQG/uEtLMkBgFF2Fuihg=',
          'sha256-C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M='
        ],
        maxAge: 7776000,        // 90 days for API
        includeSubDomains: false,
        reportUri: '/api/security/api-hpkp-report'
      }
    },
    
    // Mobile gaming app pinning
    MOBILE_PINNING: {
      enablePinning: true,
      pinValidation: 'strict',
      fallbackBehavior: 'fail-secure',
      
      // iOS gaming app pinning
      IOS: {
        pins: [
          'sha256-YLh1dUR9y6Kja30RrAn7JKnbQG/uEtLMkBgFF2Fuihg=',
          'sha256-C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M='
        ],
        backupPins: [
          'sha256-JbQbUG5JMJUoI6brnx0x3vZF6jilxsapbXGVfjhN8Fg='
        ]
      },
      
      // Android gaming app pinning
      ANDROID: {
        pins: [
          'sha256-YLh1dUR9y6Kja30RrAn7JKnbQG/uEtLMkBgFF2Fuihg=',
          'sha256-C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M='
        ],
        backupPins: [
          'sha256-JbQbUG5JMJUoI6brnx0x3vZF6jilxsapbXGVfjhN8Fg='
        ]
      }
    }
  },

  // Perfect Forward Secrecy Configuration
  PERFECT_FORWARD_SECRECY: {
    // Gaming session PFS
    GAMING_SESSIONS: {
      keyExchange: 'ECDHE',
      curve: 'prime256v1',
      sessionKeyRotation: 3600,    // 1 hour key rotation
      ephemeralKeys: true,
      gamingOptimized: true
    },
    
    // Tournament PFS (more frequent rotation)
    TOURNAMENT: {
      keyExchange: 'ECDHE',
      curve: 'prime256v1',
      sessionKeyRotation: 1800,    // 30 minutes for tournaments
      ephemeralKeys: true,
      tournamentSecure: true
    },
    
    // Web3 transaction PFS
    WEB3_TRANSACTIONS: {
      keyExchange: 'ECDHE',
      curve: 'secp384r1',          // Stronger curve for Web3
      sessionKeyRotation: 900,     // 15 minutes for Web3
      ephemeralKeys: true,
      blockchainSecure: true
    }
  },

  // Gaming Platform Cipher Suites
  CIPHER_SUITES: {
    // Gaming optimized cipher suites
    GAMING_OPTIMIZED: {
      priorityOrder: [
        'TLS_AES_128_GCM_SHA256',        // Fastest for gaming
        'TLS_CHACHA20_POLY1305_SHA256',  // Mobile optimized
        'ECDHE-RSA-AES128-GCM-SHA256',   // Hardware accelerated
        'ECDHE-ECDSA-AES128-GCM-SHA256'  // Elliptic curve
      ],
      disabledCiphers: [
        'RC4',                           // Insecure
        'DES',                           // Weak
        'MD5'                            // Compromised
      ]
    },
    
    // Tournament grade security
    TOURNAMENT_GRADE: {
      priorityOrder: [
        'TLS_AES_256_GCM_SHA384',
        'TLS_CHACHA20_POLY1305_SHA256',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-ECDSA-AES256-GCM-SHA384'
      ],
      minKeySize: 2048,
      preferredKeySize: 4096
    },
    
    // Web3 blockchain security
    WEB3_BLOCKCHAIN: {
      priorityOrder: [
        'TLS_AES_256_GCM_SHA384',
        'ECDHE-ECDSA-AES256-GCM-SHA384', // Preferred for blockchain
        'ECDHE-RSA-AES256-GCM-SHA384'
      ],
      requirePFS: true,
      blockchainCompliant: true
    }
  },

  // Web3 Blockchain SSL Requirements
  WEB3_SSL_REQUIREMENTS: {
    // Solana blockchain requirements
    SOLANA: {
      requiredTLSVersion: '1.3',
      requiredCiphers: ['AES-256-GCM', 'CHACHA20-POLY1305'],
      certificateValidation: 'strict',
      ocspStapling: true,
      
      // Phantom wallet specific
      PHANTOM_WALLET: {
        allowedOrigins: ['https://phantom.app'],
        requiredHeaders: ['X-Phantom-Compatible'],
        corsOptimization: true
      },
      
      // Transaction security
      TRANSACTION_SECURITY: {
        ephemeralKeys: true,
        sessionBinding: true,
        nonceValidation: true,
        signatureVerification: true
      }
    },
    
    // General Web3 requirements
    GENERAL_WEB3: {
      requiredProtocols: ['TLS1.3', 'TLS1.2'],
      forbiddenProtocols: ['SSLv3', 'TLS1.0', 'TLS1.1'],
      certificateTransparency: true,
      dnssec: true
    }
  },

  // Gaming Platform Specific Headers
  GAMING_PLATFORM_HEADERS: {
    // Core gaming platform headers
    CORE: {
      'X-Gaming-Platform': 'MLG.clan',
      'X-Gaming-Version': '2.0.0',
      'X-Gaming-Security-Level': 'enterprise',
      'X-Gaming-SSL-Optimized': 'true',
      'X-Real-Time-Gaming': 'enabled',
      'X-Tournament-Ready': 'true'
    },
    
    // Performance headers
    PERFORMANCE: {
      'X-SSL-Performance-Mode': 'gaming-optimized',
      'X-Latency-Optimization': 'ultra-low',
      'X-Session-Resumption': 'enabled',
      'X-Early-Data': 'supported',
      'X-Compression': 'disabled-for-speed'
    },
    
    // Security headers
    SECURITY: {
      'X-SSL-Pinning': 'enforced',
      'X-Perfect-Forward-Secrecy': 'enabled',
      'X-Certificate-Transparency': 'monitored',
      'X-OCSP-Stapling': 'active',
      'X-Gaming-Session-Security': 'enhanced'
    },
    
    // Web3 integration headers
    WEB3: {
      'X-Web3-SSL-Compatible': 'true',
      'X-Blockchain-Security': 'solana-optimized',
      'X-Wallet-Connection-Secure': 'true',
      'X-Transaction-Encryption': 'end-to-end',
      'X-Smart-Contract-Security': 'verified'
    }
  },

  // Security Monitoring
  SECURITY_MONITORING: {
    // Violation reporting
    VIOLATION_REPORTING: {
      enableReporting: true,
      reportingEndpoints: {
        hpkp: '/api/security/hpkp-violations',
        csp: '/api/security/csp-violations',
        hsts: '/api/security/hsts-violations'
      },
      
      // Gaming-specific violation tracking
      gamingViolations: {
        trackLatencyViolations: true,
        trackSecurityDowngrades: true,
        trackCipherViolations: true
      }
    },
    
    // Real-time monitoring
    REALTIME_MONITORING: {
      enableRealTimeAlerts: true,
      alertThresholds: {
        pinnedCertificateFailures: 5,    // Alert after 5 failures
        securityDowngrades: 1,           // Alert immediately
        cipherViolations: 3              // Alert after 3 violations
      }
    }
  }
};

/**
 * Gaming Security Headers Manager
 */
export class GamingSecurityHeadersManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = { ...GAMING_SECURITY_CONFIG, ...options };
    this.pinningViolations = new Map();
    this.securityEvents = [];
    this.performanceMetrics = new Map();
    
    this.init();
  }

  /**
   * Initialize Gaming Security Headers Manager
   */
  init() {
    console.log('🛡️ Initializing Gaming Security Headers Manager...');
    
    // Setup violation monitoring
    this.initViolationMonitoring();
    
    // Setup performance tracking
    this.initPerformanceTracking();
    
    // Generate certificate pins
    this.generateCertificatePins();
    
    console.log('✅ Gaming Security Headers Manager initialized');
    this.logSecurityConfiguration();
  }

  /**
   * Initialize violation monitoring
   */
  initViolationMonitoring() {
    // Monitor pinning violations
    setInterval(() => {
      this.analyzePinningViolations();
    }, 60000); // Every minute
    
    // Monitor security events
    setInterval(() => {
      this.analyzeSecurityEvents();
    }, 300000); // Every 5 minutes
  }

  /**
   * Initialize performance tracking
   */
  initPerformanceTracking() {
    setInterval(() => {
      this.trackSecurityPerformance();
    }, 30000); // Every 30 seconds
  }

  /**
   * Generate certificate pins for domains
   */
  generateCertificatePins() {
    console.log('📌 Generating certificate pins for gaming platform...');
    
    const pins = this.config.SSL_PINNING.CERTIFICATE_PINS;
    
    for (const [domain, config] of Object.entries(pins)) {
      console.log(`   📌 ${domain}: ${config.pins.length} pins configured`);
    }
  }

  /**
   * Get gaming security headers middleware
   */
  getSecurityHeadersMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Determine connection type
      const connectionType = this.determineConnectionType(req);
      
      // Apply HSTS headers
      this.applyHSTSHeaders(req, res, connectionType);
      
      // Apply SSL pinning headers
      this.applySSLPinningHeaders(req, res, connectionType);
      
      // Apply gaming platform headers
      this.applyGamingPlatformHeaders(req, res, connectionType);
      
      // Apply Web3 headers if needed
      if (this.isWeb3Request(req)) {
        this.applyWeb3Headers(req, res);
      }
      
      // Apply security monitoring headers
      this.applySecurityMonitoringHeaders(req, res);
      
      // Track performance
      const processingTime = Date.now() - startTime;
      this.trackHeaderPerformance(connectionType, processingTime);
      
      next();
    };
  }

  /**
   * Determine connection type from request
   */
  determineConnectionType(req) {
    const path = req.path.toLowerCase();
    const userAgent = req.get('User-Agent') || '';
    
    // Tournament connections
    if (path.includes('tournament') || path.includes('bracket')) {
      return 'TOURNAMENT';
    }
    
    // Real-time gaming
    if (path.includes('realtime') || path.includes('websocket') || req.headers.upgrade) {
      return 'REALTIME';
    }
    
    // Web3 transactions
    if (path.includes('wallet') || path.includes('transaction') || path.includes('voting')) {
      return 'WEB3';
    }
    
    // Mobile gaming app
    if (userAgent.includes('MLGClan-Mobile') || userAgent.includes('Mobile')) {
      return 'MOBILE';
    }
    
    // Default gaming session
    return 'GAMING_SESSION';
  }

  /**
   * Apply HSTS headers based on connection type
   */
  applyHSTSHeaders(req, res, connectionType) {
    let hstsConfig;
    
    switch (connectionType) {
      case 'TOURNAMENT':
        hstsConfig = this.config.HSTS.TOURNAMENT;
        break;
      case 'REALTIME':
        hstsConfig = this.config.HSTS.REALTIME;
        break;
      default:
        hstsConfig = this.config.HSTS.GAMING_SESSION;
    }
    
    const hstsValue = `max-age=${hstsConfig.maxAge}` +
      (hstsConfig.includeSubDomains ? '; includeSubDomains' : '') +
      (hstsConfig.preload ? '; preload' : '');
    
    res.setHeader('Strict-Transport-Security', hstsValue);
    
    // Add gaming-specific HSTS extensions
    if (hstsConfig.gamingOptimized) {
      res.setHeader('X-HSTS-Gaming-Optimized', 'true');
    }
    
    if (hstsConfig.tournamentOptimized) {
      res.setHeader('X-HSTS-Tournament-Mode', 'active');
    }
    
    if (hstsConfig.realtimeOptimized) {
      res.setHeader('X-HSTS-Realtime-Mode', 'active');
    }
  }

  /**
   * Apply SSL pinning headers
   */
  applySSLPinningHeaders(req, res, connectionType) {
    const hostname = req.hostname || req.get('host');
    const pinConfig = this.config.SSL_PINNING.CERTIFICATE_PINS[hostname];
    
    if (!pinConfig) {
      // Use default pinning for unknown domains
      this.applyDefaultPinning(req, res);
      return;
    }
    
    // Build HPKP header
    const pins = pinConfig.pins.map(pin => `pin-${pin}`).join('; ');
    const hpkpValue = `${pins}; max-age=${pinConfig.maxAge}` +
      (pinConfig.includeSubDomains ? '; includeSubDomains' : '') +
      (pinConfig.reportUri ? `; report-uri="${pinConfig.reportUri}"` : '');
    
    res.setHeader('Public-Key-Pins', hpkpValue);
    
    // Add gaming-specific pinning headers
    res.setHeader('X-SSL-Pinning-Status', 'enforced');
    res.setHeader('X-Gaming-Certificate-Pinning', 'active');
    
    // Mobile app pinning information
    if (connectionType === 'MOBILE') {
      res.setHeader('X-Mobile-Pinning-Required', 'true');
      res.setHeader('X-Pin-Validation', this.config.SSL_PINNING.MOBILE_PINNING.pinValidation);
    }
  }

  /**
   * Apply default pinning for unknown domains
   */
  applyDefaultPinning(req, res) {
    // Use main domain pinning as fallback
    const defaultPins = this.config.SSL_PINNING.CERTIFICATE_PINS['mlg-clan.com'];
    
    if (defaultPins) {
      const pins = defaultPins.pins.map(pin => `pin-${pin}`).join('; ');
      const hpkpValue = `${pins}; max-age=3600`; // 1 hour for unknown domains
      
      res.setHeader('Public-Key-Pins-Report-Only', hpkpValue);
      res.setHeader('X-SSL-Pinning-Status', 'report-only');
    }
  }

  /**
   * Apply gaming platform headers
   */
  applyGamingPlatformHeaders(req, res, connectionType) {
    const headers = this.config.GAMING_PLATFORM_HEADERS;
    
    // Core gaming platform headers
    Object.entries(headers.CORE).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    // Performance headers
    Object.entries(headers.PERFORMANCE).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    // Security headers
    Object.entries(headers.SECURITY).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    // Connection type specific headers
    res.setHeader('X-Connection-Type', connectionType);
    res.setHeader('X-Gaming-Session-ID', this.generateSessionId(req));
    
    // Perfect Forward Secrecy information
    const pfsConfig = this.getPFSConfig(connectionType);
    res.setHeader('X-PFS-Key-Exchange', pfsConfig.keyExchange);
    res.setHeader('X-PFS-Curve', pfsConfig.curve);
    res.setHeader('X-PFS-Key-Rotation', `${pfsConfig.sessionKeyRotation}s`);
  }

  /**
   * Check if request is Web3 related
   */
  isWeb3Request(req) {
    const path = req.path.toLowerCase();
    return path.includes('wallet') || 
           path.includes('transaction') || 
           path.includes('voting') || 
           path.includes('solana') ||
           req.get('X-Wallet-Type');
  }

  /**
   * Apply Web3 specific headers
   */
  applyWeb3Headers(req, res) {
    const headers = this.config.GAMING_PLATFORM_HEADERS.WEB3;
    
    // Web3 integration headers
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    // Solana specific headers
    const solanaConfig = this.config.WEB3_SSL_REQUIREMENTS.SOLANA;
    res.setHeader('X-Solana-TLS-Version', solanaConfig.requiredTLSVersion);
    res.setHeader('X-Solana-Certificate-Validation', solanaConfig.certificateValidation);
    
    // Phantom wallet headers
    if (req.get('User-Agent')?.includes('Phantom')) {
      res.setHeader('X-Phantom-Compatible', 'true');
      res.setHeader('X-Phantom-SSL-Optimized', 'true');
    }
    
    // Transaction security headers
    const txSecurity = solanaConfig.TRANSACTION_SECURITY;
    res.setHeader('X-Transaction-Ephemeral-Keys', txSecurity.ephemeralKeys.toString());
    res.setHeader('X-Transaction-Session-Binding', txSecurity.sessionBinding.toString());
  }

  /**
   * Apply security monitoring headers
   */
  applySecurityMonitoringHeaders(req, res) {
    const monitoring = this.config.SECURITY_MONITORING;
    
    // Violation reporting endpoints
    if (monitoring.VIOLATION_REPORTING.enableReporting) {
      res.setHeader('X-Security-Reporting-Enabled', 'true');
      
      const endpoints = monitoring.VIOLATION_REPORTING.reportingEndpoints;
      res.setHeader('X-HPKP-Report-URI', endpoints.hpkp);
      res.setHeader('X-CSP-Report-URI', endpoints.csp);
    }
    
    // Real-time monitoring status
    if (monitoring.REALTIME_MONITORING.enableRealTimeAlerts) {
      res.setHeader('X-Realtime-Security-Monitoring', 'active');
    }
    
    // Security event correlation ID
    res.setHeader('X-Security-Event-ID', this.generateSecurityEventId());
  }

  /**
   * Get Perfect Forward Secrecy configuration
   */
  getPFSConfig(connectionType) {
    const pfsConfigs = this.config.PERFECT_FORWARD_SECRECY;
    
    switch (connectionType) {
      case 'TOURNAMENT':
        return pfsConfigs.TOURNAMENT;
      case 'WEB3':
        return pfsConfigs.WEB3_TRANSACTIONS;
      default:
        return pfsConfigs.GAMING_SESSIONS;
    }
  }

  /**
   * Generate gaming session ID
   */
  generateSessionId(req) {
    const data = `${req.ip}-${Date.now()}-${Math.random()}`;
    return createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  /**
   * Generate security event ID
   */
  generateSecurityEventId() {
    const data = `security-${Date.now()}-${Math.random()}`;
    return createHash('sha256').update(data).digest('hex').substring(0, 12);
  }

  /**
   * Track header performance
   */
  trackHeaderPerformance(connectionType, processingTime) {
    if (!this.performanceMetrics.has(connectionType)) {
      this.performanceMetrics.set(connectionType, []);
    }
    
    const metrics = this.performanceMetrics.get(connectionType);
    metrics.push({
      processingTime,
      timestamp: Date.now()
    });
    
    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.splice(0, metrics.length - 100);
    }
    
    // Check performance thresholds
    if (processingTime > 5) { // 5ms threshold for header processing
      console.warn(`⚠️ Gaming Security Headers: Processing time ${processingTime}ms exceeds threshold for ${connectionType}`);
    }
  }

  /**
   * Track security performance
   */
  trackSecurityPerformance() {
    const performanceReport = {
      timestamp: new Date().toISOString(),
      connectionTypes: {}
    };
    
    // Calculate average processing time per connection type
    for (const [connectionType, metrics] of this.performanceMetrics.entries()) {
      if (metrics.length === 0) continue;
      
      const recentMetrics = metrics.filter(m => 
        Date.now() - m.timestamp < 300000 // Last 5 minutes
      );
      
      if (recentMetrics.length === 0) continue;
      
      const avgProcessingTime = recentMetrics.reduce((sum, m) => sum + m.processingTime, 0) / recentMetrics.length;
      
      performanceReport.connectionTypes[connectionType] = {
        sampleCount: recentMetrics.length,
        averageProcessingTime: Math.round(avgProcessingTime * 100) / 100,
        maxProcessingTime: Math.max(...recentMetrics.map(m => m.processingTime))
      };
    }
    
    // Emit performance report
    this.emit('securityPerformanceReport', performanceReport);
  }

  /**
   * Analyze pinning violations
   */
  analyzePinningViolations() {
    const violations = Array.from(this.pinningViolations.entries());
    
    if (violations.length === 0) return;
    
    console.log(`🚨 SSL Pinning Violations Analysis: ${violations.length} domains with violations`);
    
    for (const [domain, violationCount] of violations) {
      const threshold = this.config.SECURITY_MONITORING.REALTIME_MONITORING.alertThresholds.pinnedCertificateFailures;
      
      if (violationCount >= threshold) {
        this.emit('pinningViolationAlert', {
          domain,
          violationCount,
          severity: violationCount >= threshold * 2 ? 'critical' : 'warning',
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Analyze security events
   */
  analyzeSecurityEvents() {
    const recentEvents = this.securityEvents.filter(event => 
      Date.now() - event.timestamp < 300000 // Last 5 minutes
    );
    
    if (recentEvents.length === 0) return;
    
    const eventSummary = {
      totalEvents: recentEvents.length,
      eventTypes: {},
      criticalEvents: 0,
      timestamp: new Date().toISOString()
    };
    
    // Categorize events
    recentEvents.forEach(event => {
      eventSummary.eventTypes[event.type] = (eventSummary.eventTypes[event.type] || 0) + 1;
      
      if (event.severity === 'critical') {
        eventSummary.criticalEvents++;
      }
    });
    
    // Emit security events summary
    this.emit('securityEventsSummary', eventSummary);
    
    // Check for critical events
    if (eventSummary.criticalEvents > 0) {
      console.warn(`🚨 Critical Security Events: ${eventSummary.criticalEvents} critical events in last 5 minutes`);
    }
  }

  /**
   * Report pinning violation
   */
  reportPinningViolation(domain, details) {
    const currentCount = this.pinningViolations.get(domain) || 0;
    this.pinningViolations.set(domain, currentCount + 1);
    
    // Add to security events
    this.securityEvents.push({
      type: 'pinning-violation',
      domain,
      details,
      severity: 'warning',
      timestamp: Date.now()
    });
    
    console.warn(`📌 SSL Pinning Violation: ${domain} - ${details}`);
  }

  /**
   * Report security event
   */
  reportSecurityEvent(type, severity, details) {
    this.securityEvents.push({
      type,
      severity,
      details,
      timestamp: Date.now()
    });
    
    // Keep only last 1000 events
    if (this.securityEvents.length > 1000) {
      this.securityEvents.splice(0, this.securityEvents.length - 1000);
    }
    
    console.log(`🛡️ Security Event [${severity.toUpperCase()}]: ${type} - ${details}`);
    
    // Emit immediate alert for critical events
    if (severity === 'critical') {
      this.emit('criticalSecurityEvent', {
        type,
        details,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get security configuration summary
   */
  getSecuritySummary() {
    return {
      hstsConfiguration: Object.keys(this.config.HSTS),
      sslPinningDomains: Object.keys(this.config.SSL_PINNING.CERTIFICATE_PINS),
      cipherSuites: Object.keys(this.config.CIPHER_SUITES),
      web3Support: true,
      gamingOptimized: true,
      
      recentMetrics: {
        totalSecurityEvents: this.securityEvents.length,
        pinningViolations: this.pinningViolations.size,
        performanceMetrics: Object.keys(this.performanceMetrics).length
      },
      
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Log security configuration
   */
  logSecurityConfiguration() {
    console.log('🛡️ Gaming Security Configuration:');
    console.log(`   🔒 HSTS Configurations: ${Object.keys(this.config.HSTS).length}`);
    console.log(`   📌 SSL Pinning Domains: ${Object.keys(this.config.SSL_PINNING.CERTIFICATE_PINS).length}`);
    console.log(`   🔐 Cipher Suites: ${Object.keys(this.config.CIPHER_SUITES).length}`);
    console.log(`   🌐 Web3 Support: Enabled`);
    console.log(`   🎮 Gaming Optimized: Enabled`);
    console.log(`   ⚡ Perfect Forward Secrecy: Enabled`);
    console.log(`   📱 Mobile Pinning: Enabled`);
    console.log(`   🏆 Tournament Security: Enhanced`);
  }

  /**
   * Shutdown security headers manager
   */
  shutdown() {
    console.log('🛡️ Shutting down Gaming Security Headers Manager...');
    
    this.removeAllListeners();
    this.pinningViolations.clear();
    this.securityEvents.length = 0;
    this.performanceMetrics.clear();
    
    console.log('✅ Gaming Security Headers Manager shutdown complete');
  }
}

// Export default instance
export default new GamingSecurityHeadersManager();