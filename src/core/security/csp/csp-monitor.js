/**
 * CSP Violation Monitoring and Analytics System for MLG.clan Gaming Platform
 * 
 * Advanced CSP violation monitoring, reporting, and analytics system designed
 * for gaming platforms with real-time threat detection and automated response.
 * 
 * Features:
 * - Real-time CSP violation monitoring and alerting
 * - Gaming-specific violation pattern detection
 * - Web3 and blockchain security incident analysis
 * - Automated threat response and rate limiting
 * - Performance impact monitoring
 * - Security analytics dashboard data
 * 
 * @author Claude Code - Security & Performance Auditor
 * @version 1.0.0
 * @created 2025-08-12
 */

import { EventEmitter } from 'events';
import { categorizeCSPViolation, CSP_VIOLATION_CATEGORIES } from './csp-config.js';

/**
 * CSP Monitoring Configuration
 */
const MONITOR_CONFIG = {
  // Violation thresholds
  THRESHOLDS: {
    criticalViolationsPerMinute: 10,
    highViolationsPerMinute: 50,
    mediumViolationsPerMinute: 100,
    uniqueViolationsPerHour: 25,
    suspiciousPatternThreshold: 5
  },
  
  // Alert configuration
  ALERTS: {
    enableRealTime: process.env.CSP_REAL_TIME_ALERTS !== 'false',
    enableEmail: process.env.CSP_EMAIL_ALERTS === 'true',
    enableSlack: process.env.CSP_SLACK_ALERTS === 'true',
    enableSentry: process.env.CSP_SENTRY_ALERTS === 'true'
  },
  
  // Rate limiting for violation reporting
  RATE_LIMITING: {
    maxViolationsPerIP: 100,
    maxViolationsPerSession: 50,
    timeWindow: 60 * 1000, // 1 minute
    blockDuration: 5 * 60 * 1000 // 5 minutes
  },
  
  // Data retention
  DATA_RETENTION: {
    violationHistory: 7 * 24 * 60 * 60 * 1000, // 7 days
    analyticsData: 30 * 24 * 60 * 60 * 1000, // 30 days
    alertHistory: 24 * 60 * 60 * 1000 // 24 hours
  },
  
  // Performance monitoring
  PERFORMANCE: {
    enableMetrics: true,
    metricsInterval: 60 * 1000, // 1 minute
    maxMemoryUsage: 100 * 1024 * 1024 // 100MB
  }
};

/**
 * Gaming-Specific Violation Patterns
 */
const GAMING_VIOLATION_PATTERNS = {
  // Potential gaming exploit attempts
  EXPLOIT_PATTERNS: [
    /eval\(.*gaming/i,
    /script.*cheat/i,
    /console\.log.*hack/i,
    /document\.write.*exploit/i,
    /window\.open.*bot/i
  ],
  
  // Web3/Wallet attack patterns
  WEB3_ATTACK_PATTERNS: [
    /phantom.*steal/i,
    /solana.*drain/i,
    /wallet.*private.*key/i,
    /seed.*phrase.*capture/i,
    /transaction.*intercept/i
  ],
  
  // Gaming content injection patterns
  CONTENT_INJECTION_PATTERNS: [
    /clan.*<script/i,
    /tournament.*javascript:/i,
    /leaderboard.*onload=/i,
    /vote.*onclick=/i,
    /profile.*onerror=/i
  ],
  
  // Bot detection patterns
  BOT_PATTERNS: [
    /automated.*request/i,
    /headless.*browser/i,
    /selenium.*driver/i,
    /phantom.*js/i, // PhantomJS, not Phantom wallet
    /scraper.*bot/i
  ]
};

/**
 * CSP Violation Monitor Class
 */
class CSPViolationMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = { ...MONITOR_CONFIG, ...options };
    this.violations = new Map();
    this.analytics = new Map();
    this.alerts = new Map();
    this.rateLimits = new Map();
    this.blockedIPs = new Set();
    this.metrics = {
      totalViolations: 0,
      violationsByCategory: new Map(),
      violationsBySeverity: new Map(),
      violationsByHour: new Map(),
      performance: {
        memoryUsage: 0,
        processingTime: 0,
        queueSize: 0
      }
    };
    
    this.startTime = Date.now();
    this.setupPeriodicTasks();
  }

  /**
   * Process CSP violation report
   */
  async processViolation(violationReport, context = {}) {
    const startTime = Date.now();
    
    try {
      // Rate limiting check
      if (this.isRateLimited(context.ip, context.sessionId)) {
        this.emit('rateLimitExceeded', { ip: context.ip, sessionId: context.sessionId });
        return false;
      }
      
      // Create enriched violation object
      const violation = this.enrichViolation(violationReport, context);
      
      // Store violation
      this.storeViolation(violation);
      
      // Update analytics
      this.updateAnalytics(violation);
      
      // Check for suspicious patterns
      this.checkSuspiciousPatterns(violation);
      
      // Update rate limiting
      this.updateRateLimit(context.ip, context.sessionId);
      
      // Trigger alerts if necessary
      await this.checkAlertThresholds(violation);
      
      // Emit events for real-time processing
      this.emit('violationProcessed', violation);
      
      // Update performance metrics
      this.metrics.performance.processingTime = Date.now() - startTime;
      
      return true;
      
    } catch (error) {
      console.error('Error processing CSP violation:', error);
      this.emit('processingError', { error, violationReport, context });
      return false;
    }
  }

  /**
   * Enrich violation with additional context
   */
  enrichViolation(violationReport, context) {
    const timestamp = new Date().toISOString();
    const violationId = this.generateViolationId(violationReport);
    const category = categorizeCSPViolation(violationReport);
    const severity = this.calculateSeverity(violationReport, category);
    
    return {
      id: violationId,
      timestamp,
      category,
      severity,
      violation: violationReport,
      context: {
        ip: context.ip,
        userAgent: context.userAgent,
        url: context.url,
        method: context.method,
        referer: context.referer,
        sessionId: context.sessionId,
        userId: context.userId,
        walletAddress: context.walletAddress,
        clanId: context.clanId,
        tournamentId: context.tournamentId
      },
      patterns: this.detectPatterns(violationReport),
      risk: this.calculateRiskScore(violationReport, context),
      location: this.getLocationInfo(context.ip),
      count: 1,
      firstSeen: timestamp,
      lastSeen: timestamp
    };
  }

  /**
   * Generate unique violation ID
   */
  generateViolationId(violation) {
    const key = JSON.stringify({
      directive: violation['violated-directive'],
      blockedUri: violation['blocked-uri'],
      sourceFile: violation['source-file'],
      lineNumber: violation['line-number']
    });
    
    return require('crypto').createHash('sha256').update(key).digest('hex').substring(0, 16);
  }

  /**
   * Calculate violation severity
   */
  calculateSeverity(violation, category) {
    const blockedUri = violation['blocked-uri'] || '';
    const violatedDirective = violation['violated-directive'] || '';
    const sourceFile = violation['source-file'] || '';
    
    // Critical: Potential code injection or XSS
    if (violatedDirective.includes('script-src') && 
        (blockedUri.includes('eval') || 
         blockedUri.includes('javascript:') ||
         blockedUri.includes('data:text/javascript'))) {
      return 'critical';
    }
    
    // Critical: Gaming exploit patterns
    if (this.hasGamingExploitPattern(blockedUri + sourceFile)) {
      return 'critical';
    }
    
    // High: Web3 wallet security violations
    if (category === CSP_VIOLATION_CATEGORIES.WALLET_INTEGRATION ||
        this.hasWeb3AttackPattern(blockedUri + sourceFile)) {
      return 'high';
    }
    
    // High: Gaming platform security violations
    if (category === CSP_VIOLATION_CATEGORIES.GAMING_CONTENT &&
        violatedDirective.includes('script-src')) {
      return 'high';
    }
    
    // Medium: Frame and content violations
    if (violatedDirective.includes('frame-src') || 
        violatedDirective.includes('frame-ancestors') ||
        category === CSP_VIOLATION_CATEGORIES.GAMING_EMBED) {
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
   * Detect suspicious patterns in violations
   */
  detectPatterns(violation) {
    const content = JSON.stringify(violation).toLowerCase();
    const patterns = [];
    
    // Check gaming exploit patterns
    GAMING_VIOLATION_PATTERNS.EXPLOIT_PATTERNS.forEach((pattern, index) => {
      if (pattern.test(content)) {
        patterns.push(`gaming_exploit_${index}`);
      }
    });
    
    // Check Web3 attack patterns
    GAMING_VIOLATION_PATTERNS.WEB3_ATTACK_PATTERNS.forEach((pattern, index) => {
      if (pattern.test(content)) {
        patterns.push(`web3_attack_${index}`);
      }
    });
    
    // Check content injection patterns
    GAMING_VIOLATION_PATTERNS.CONTENT_INJECTION_PATTERNS.forEach((pattern, index) => {
      if (pattern.test(content)) {
        patterns.push(`content_injection_${index}`);
      }
    });
    
    // Check bot patterns
    GAMING_VIOLATION_PATTERNS.BOT_PATTERNS.forEach((pattern, index) => {
      if (pattern.test(content)) {
        patterns.push(`bot_pattern_${index}`);
      }
    });
    
    return patterns;
  }

  /**
   * Calculate risk score (0-100)
   */
  calculateRiskScore(violation, context) {
    let score = 0;
    
    // Base score by directive
    const directive = violation['violated-directive'] || '';
    if (directive.includes('script-src')) score += 30;
    else if (directive.includes('frame-src')) score += 20;
    else if (directive.includes('connect-src')) score += 15;
    else score += 10;
    
    // Risk by blocked URI
    const blockedUri = violation['blocked-uri'] || '';
    if (blockedUri.includes('eval')) score += 25;
    if (blockedUri.includes('javascript:')) score += 25;
    if (blockedUri.includes('data:')) score += 15;
    if (blockedUri.includes('blob:')) score += 10;
    
    // Context-based risk
    if (!context.userId) score += 10; // Anonymous user
    if (context.userAgent && context.userAgent.includes('bot')) score += 20;
    
    // Gaming-specific risks
    if (context.clanId && !context.userId) score += 15; // Clan access without auth
    if (context.tournamentId) score += 10; // Tournament context is higher risk
    
    return Math.min(score, 100);
  }

  /**
   * Check for gaming exploit patterns
   */
  hasGamingExploitPattern(content) {
    return GAMING_VIOLATION_PATTERNS.EXPLOIT_PATTERNS.some(pattern => pattern.test(content));
  }

  /**
   * Check for Web3 attack patterns
   */
  hasWeb3AttackPattern(content) {
    return GAMING_VIOLATION_PATTERNS.WEB3_ATTACK_PATTERNS.some(pattern => pattern.test(content));
  }

  /**
   * Get location information for IP
   */
  getLocationInfo(ip) {
    // In production, this would integrate with GeoIP service
    // For now, return basic info
    return {
      ip,
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
      isKnownVPN: false,
      isTor: false
    };
  }

  /**
   * Store violation in memory store
   */
  storeViolation(violation) {
    const existingViolation = this.violations.get(violation.id);
    
    if (existingViolation) {
      existingViolation.count++;
      existingViolation.lastSeen = violation.timestamp;
    } else {
      this.violations.set(violation.id, violation);
    }
    
    this.metrics.totalViolations++;
  }

  /**
   * Update analytics data
   */
  updateAnalytics(violation) {
    // Update category metrics
    const categoryCount = this.metrics.violationsByCategory.get(violation.category) || 0;
    this.metrics.violationsByCategory.set(violation.category, categoryCount + 1);
    
    // Update severity metrics
    const severityCount = this.metrics.violationsBySeverity.get(violation.severity) || 0;
    this.metrics.violationsBySeverity.set(violation.severity, severityCount + 1);
    
    // Update hourly metrics
    const hour = new Date().getHours();
    const hourlyCount = this.metrics.violationsByHour.get(hour) || 0;
    this.metrics.violationsByHour.set(hour, hourlyCount + 1);
  }

  /**
   * Check for suspicious patterns across violations
   */
  checkSuspiciousPatterns(violation) {
    const suspiciousIndicators = [];
    
    // Check for rapid violations from same IP
    const recentViolations = this.getRecentViolationsByIP(violation.context.ip, 60000); // 1 minute
    if (recentViolations.length > this.config.THRESHOLDS.suspiciousPatternThreshold) {
      suspiciousIndicators.push('rapid_violations_same_ip');
    }
    
    // Check for identical violations
    const identicalViolations = this.getIdenticalViolations(violation.id, 300000); // 5 minutes
    if (identicalViolations.length > 3) {
      suspiciousIndicators.push('repeated_identical_violations');
    }
    
    // Check for gaming exploit patterns
    if (violation.patterns.some(p => p.startsWith('gaming_exploit'))) {
      suspiciousIndicators.push('gaming_exploit_detected');
    }
    
    // Check for Web3 attack patterns
    if (violation.patterns.some(p => p.startsWith('web3_attack'))) {
      suspiciousIndicators.push('web3_attack_detected');
    }
    
    if (suspiciousIndicators.length > 0) {
      this.emit('suspiciousActivity', {
        violation,
        indicators: suspiciousIndicators,
        riskScore: violation.risk
      });
      
      // Auto-block high-risk IPs
      if (violation.risk > 80) {
        this.blockIP(violation.context.ip, 'High risk CSP violations');
      }
    }
  }

  /**
   * Get recent violations by IP
   */
  getRecentViolationsByIP(ip, timeWindow) {
    const cutoff = Date.now() - timeWindow;
    return Array.from(this.violations.values()).filter(v => 
      v.context.ip === ip && 
      new Date(v.lastSeen).getTime() > cutoff
    );
  }

  /**
   * Get identical violations within time window
   */
  getIdenticalViolations(violationId, timeWindow) {
    const cutoff = Date.now() - timeWindow;
    return Array.from(this.violations.values()).filter(v => 
      v.id === violationId && 
      new Date(v.lastSeen).getTime() > cutoff
    );
  }

  /**
   * Check if IP/session is rate limited
   */
  isRateLimited(ip, sessionId) {
    const now = Date.now();
    const window = this.config.RATE_LIMITING.timeWindow;
    
    // Check if IP is blocked
    if (this.blockedIPs.has(ip)) {
      return true;
    }
    
    // Check IP rate limit
    const ipKey = `ip:${ip}`;
    const ipLimit = this.rateLimits.get(ipKey) || { count: 0, windowStart: now };
    
    if (now - ipLimit.windowStart > window) {
      ipLimit.count = 0;
      ipLimit.windowStart = now;
    }
    
    if (ipLimit.count >= this.config.RATE_LIMITING.maxViolationsPerIP) {
      return true;
    }
    
    // Check session rate limit
    const sessionKey = `session:${sessionId}`;
    const sessionLimit = this.rateLimits.get(sessionKey) || { count: 0, windowStart: now };
    
    if (now - sessionLimit.windowStart > window) {
      sessionLimit.count = 0;
      sessionLimit.windowStart = now;
    }
    
    return sessionLimit.count >= this.config.RATE_LIMITING.maxViolationsPerSession;
  }

  /**
   * Update rate limiting counters
   */
  updateRateLimit(ip, sessionId) {
    const now = Date.now();
    
    // Update IP counter
    const ipKey = `ip:${ip}`;
    const ipLimit = this.rateLimits.get(ipKey) || { count: 0, windowStart: now };
    ipLimit.count++;
    this.rateLimits.set(ipKey, ipLimit);
    
    // Update session counter
    const sessionKey = `session:${sessionId}`;
    const sessionLimit = this.rateLimits.get(sessionKey) || { count: 0, windowStart: now };
    sessionLimit.count++;
    this.rateLimits.set(sessionKey, sessionLimit);
  }

  /**
   * Block IP address
   */
  blockIP(ip, reason) {
    this.blockedIPs.add(ip);
    
    console.warn(`🚫 Blocked IP ${ip}: ${reason}`);
    
    this.emit('ipBlocked', { ip, reason, timestamp: new Date().toISOString() });
    
    // Auto-unblock after block duration
    setTimeout(() => {
      this.blockedIPs.delete(ip);
      console.info(`✅ Unblocked IP ${ip}`);
    }, this.config.RATE_LIMITING.blockDuration);
  }

  /**
   * Check alert thresholds and trigger alerts
   */
  async checkAlertThresholds(violation) {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;
    
    // Count recent violations by severity
    const recentViolations = Array.from(this.violations.values()).filter(v => 
      new Date(v.lastSeen).getTime() > oneMinuteAgo
    );
    
    const criticalCount = recentViolations.filter(v => v.severity === 'critical').length;
    const highCount = recentViolations.filter(v => v.severity === 'high').length;
    const mediumCount = recentViolations.filter(v => v.severity === 'medium').length;
    
    // Check thresholds
    if (criticalCount >= this.config.THRESHOLDS.criticalViolationsPerMinute) {
      await this.triggerAlert('critical_threshold_exceeded', {
        count: criticalCount,
        threshold: this.config.THRESHOLDS.criticalViolationsPerMinute,
        timeWindow: '1 minute'
      });
    }
    
    if (highCount >= this.config.THRESHOLDS.highViolationsPerMinute) {
      await this.triggerAlert('high_threshold_exceeded', {
        count: highCount,
        threshold: this.config.THRESHOLDS.highViolationsPerMinute,
        timeWindow: '1 minute'
      });
    }
    
    // Check unique violations per hour
    const uniqueViolationsLastHour = new Set(
      Array.from(this.violations.values())
        .filter(v => new Date(v.firstSeen).getTime() > oneHourAgo)
        .map(v => v.id)
    ).size;
    
    if (uniqueViolationsLastHour >= this.config.THRESHOLDS.uniqueViolationsPerHour) {
      await this.triggerAlert('unique_violations_threshold_exceeded', {
        count: uniqueViolationsLastHour,
        threshold: this.config.THRESHOLDS.uniqueViolationsPerHour,
        timeWindow: '1 hour'
      });
    }
  }

  /**
   * Trigger security alert
   */
  async triggerAlert(type, data) {
    const alert = {
      id: require('crypto').randomUUID(),
      type,
      timestamp: new Date().toISOString(),
      data,
      severity: this.getAlertSeverity(type)
    };
    
    this.alerts.set(alert.id, alert);
    
    console.warn(`🚨 CSP Security Alert [${alert.severity.toUpperCase()}]: ${type}`, data);
    
    this.emit('alertTriggered', alert);
    
    // Send to external alerting systems
    if (this.config.ALERTS.enableEmail) {
      await this.sendEmailAlert(alert);
    }
    
    if (this.config.ALERTS.enableSlack) {
      await this.sendSlackAlert(alert);
    }
    
    if (this.config.ALERTS.enableSentry) {
      await this.sendSentryAlert(alert);
    }
  }

  /**
   * Get alert severity
   */
  getAlertSeverity(type) {
    const criticalAlerts = ['critical_threshold_exceeded', 'gaming_exploit_detected', 'web3_attack_detected'];
    const highAlerts = ['high_threshold_exceeded', 'unique_violations_threshold_exceeded'];
    
    if (criticalAlerts.includes(type)) return 'critical';
    if (highAlerts.includes(type)) return 'high';
    return 'medium';
  }

  /**
   * Send email alert (placeholder)
   */
  async sendEmailAlert(alert) {
    // TODO: Implement email alerting
    console.log('📧 Email alert:', alert);
  }

  /**
   * Send Slack alert (placeholder)
   */
  async sendSlackAlert(alert) {
    // TODO: Implement Slack alerting
    console.log('💬 Slack alert:', alert);
  }

  /**
   * Send Sentry alert (placeholder)
   */
  async sendSentryAlert(alert) {
    // TODO: Implement Sentry alerting
    console.log('🔍 Sentry alert:', alert);
  }

  /**
   * Get monitoring statistics
   */
  getStatistics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.startTime,
      violationStore: {
        totalStored: this.violations.size,
        memoryUsage: JSON.stringify(Array.from(this.violations.values())).length
      },
      rateLimiting: {
        trackedIPs: this.rateLimits.size,
        blockedIPs: this.blockedIPs.size
      },
      alerts: {
        totalAlerts: this.alerts.size,
        recentAlerts: Array.from(this.alerts.values())
          .filter(a => Date.now() - new Date(a.timestamp).getTime() < 3600000)
          .length
      }
    };
  }

  /**
   * Setup periodic maintenance tasks
   */
  setupPeriodicTasks() {
    // Cleanup expired data every 5 minutes
    setInterval(() => {
      this.cleanupExpiredData();
      this.updatePerformanceMetrics();
    }, 5 * 60 * 1000);
    
    // Generate hourly reports
    setInterval(() => {
      this.generateHourlyReport();
    }, 60 * 60 * 1000);
  }

  /**
   * Cleanup expired violations and data
   */
  cleanupExpiredData() {
    const now = Date.now();
    
    // Cleanup violations
    for (const [id, violation] of this.violations.entries()) {
      if (now - new Date(violation.firstSeen).getTime() > this.config.DATA_RETENTION.violationHistory) {
        this.violations.delete(id);
      }
    }
    
    // Cleanup alerts
    for (const [id, alert] of this.alerts.entries()) {
      if (now - new Date(alert.timestamp).getTime() > this.config.DATA_RETENTION.alertHistory) {
        this.alerts.delete(id);
      }
    }
    
    // Cleanup rate limits
    for (const [key, limit] of this.rateLimits.entries()) {
      if (now - limit.windowStart > this.config.RATE_LIMITING.timeWindow * 2) {
        this.rateLimits.delete(key);
      }
    }
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics() {
    const memUsage = process.memoryUsage();
    this.metrics.performance.memoryUsage = memUsage.heapUsed;
    this.metrics.performance.queueSize = this.violations.size;
    
    // Check memory usage
    if (memUsage.heapUsed > this.config.PERFORMANCE.maxMemoryUsage) {
      console.warn('⚠️ High memory usage detected in CSP monitor:', memUsage);
      this.emit('highMemoryUsage', memUsage);
    }
  }

  /**
   * Generate hourly security report
   */
  generateHourlyReport() {
    const stats = this.getStatistics();
    const report = {
      timestamp: new Date().toISOString(),
      period: 'hourly',
      statistics: stats,
      topViolations: this.getTopViolations(10),
      topIPs: this.getTopViolatingIPs(10),
      securityEvents: this.getRecentSecurityEvents()
    };
    
    console.info('📊 Hourly CSP Security Report:', report);
    this.emit('hourlyReport', report);
  }

  /**
   * Get top violations by frequency
   */
  getTopViolations(limit = 10) {
    return Array.from(this.violations.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(v => ({
        id: v.id,
        category: v.category,
        severity: v.severity,
        count: v.count,
        violatedDirective: v.violation['violated-directive'],
        blockedUri: v.violation['blocked-uri']
      }));
  }

  /**
   * Get top violating IPs
   */
  getTopViolatingIPs(limit = 10) {
    const ipCounts = new Map();
    
    for (const violation of this.violations.values()) {
      const ip = violation.context.ip;
      ipCounts.set(ip, (ipCounts.get(ip) || 0) + violation.count);
    }
    
    return Array.from(ipCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([ip, count]) => ({ ip, count }));
  }

  /**
   * Get recent security events
   */
  getRecentSecurityEvents() {
    const oneHourAgo = Date.now() - 3600000;
    
    return Array.from(this.violations.values())
      .filter(v => 
        v.severity === 'critical' || 
        v.risk > 70 ||
        v.patterns.length > 0
      )
      .filter(v => new Date(v.lastSeen).getTime() > oneHourAgo)
      .map(v => ({
        id: v.id,
        timestamp: v.lastSeen,
        severity: v.severity,
        risk: v.risk,
        patterns: v.patterns,
        ip: v.context.ip
      }));
  }

  /**
   * Shutdown monitor
   */
  shutdown() {
    this.removeAllListeners();
  }
}

export { CSPViolationMonitor, MONITOR_CONFIG, GAMING_VIOLATION_PATTERNS };
export default CSPViolationMonitor;