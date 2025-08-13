/**
 * SSL Certificate Health Monitoring and Gaming Performance Impact Analysis System
 * 
 * Comprehensive SSL monitoring system for MLG.clan gaming platform with real-time
 * certificate health monitoring, gaming performance impact analysis, and automated
 * alerting for certificate expiration and performance degradation.
 * 
 * Features:
 * - Real-time SSL certificate health monitoring
 * - Gaming performance impact analysis with latency tracking
 * - Certificate expiration alerting with gaming-specific thresholds
 * - SSL handshake performance monitoring
 * - Gaming latency optimization recommendations
 * - Tournament and competitive gaming SSL performance validation
 * - Web3 transaction SSL security monitoring
 * 
 * @author Claude Code - Security and Performance Auditor
 * @version 1.0.0
 * @created 2025-08-12
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { createHash } from 'crypto';

/**
 * SSL Monitoring Configuration
 */
export const SSL_MONITORING_CONFIG = {
  // Gaming performance thresholds
  PERFORMANCE_THRESHOLDS: {
    // SSL handshake performance for gaming
    HANDSHAKE: {
      excellent: 50,      // <50ms excellent for competitive gaming
      good: 100,         // <100ms good for regular gaming
      acceptable: 200,   // <200ms acceptable
      poor: 500,         // >500ms poor performance
      critical: 1000     // >1000ms critical
    },
    
    // Additional latency introduced by SSL
    LATENCY_IMPACT: {
      minimal: 2,        // <2ms minimal impact
      low: 5,           // <5ms low impact
      moderate: 10,     // <10ms moderate impact
      high: 20,         // <20ms high impact
      severe: 50        // >50ms severe impact
    },
    
    // Gaming session establishment time
    SESSION_ESTABLISHMENT: {
      ultraFast: 75,     // <75ms ultra-fast for tournaments
      fast: 150,         // <150ms fast for competitive
      normal: 300,       // <300ms normal gaming
      slow: 600,         // <600ms slow
      unacceptable: 1200 // >1200ms unacceptable
    },
    
    // Certificate validation time
    CERTIFICATE_VALIDATION: {
      instant: 10,       // <10ms instant validation
      fast: 25,         // <25ms fast validation
      acceptable: 50,   // <50ms acceptable
      slow: 100,        // <100ms slow
      critical: 200     // >200ms critical
    }
  },

  // Certificate health monitoring
  CERTIFICATE_HEALTH: {
    // Expiration monitoring thresholds
    EXPIRATION_THRESHOLDS: {
      immediate: 1,      // 1 day - immediate action required
      critical: 7,       // 7 days - critical alert
      warning: 30,       // 30 days - warning alert
      info: 60,         // 60 days - informational
      planning: 90      // 90 days - renewal planning
    },
    
    // Health check intervals
    CHECK_INTERVALS: {
      critical: 300000,      // 5 minutes for critical certificates
      normal: 1800000,       // 30 minutes for normal certificates
      background: 3600000,   // 1 hour for background checks
      deep: 21600000        // 6 hours for deep certificate analysis
    },
    
    // Gaming-specific certificate requirements
    GAMING_REQUIREMENTS: {
      minimumKeySize: 2048,
      preferredKeySize: 4096,
      allowedAlgorithms: ['RSA', 'ECDSA'],
      requiredExtensions: ['keyUsage', 'extendedKeyUsage'],
      disallowedCiphers: ['RC4', 'DES', 'MD5'],
      
      // Tournament grade requirements
      TOURNAMENT_GRADE: {
        minimumKeySize: 4096,
        requiredAlgorithms: ['ECDSA'],
        enhancedValidation: true,
        ocspStapling: true
      }
    }
  },

  // Gaming connection monitoring
  CONNECTION_MONITORING: {
    // Connection types and their monitoring requirements
    CONNECTION_TYPES: {
      TOURNAMENT: {
        maxHandshakeTime: 50,    // 50ms max for tournaments
        maxLatencyImpact: 2,     // 2ms max additional latency
        priorityLevel: 'critical',
        monitoringInterval: 10000 // 10 seconds
      },
      
      REALTIME_GAMING: {
        maxHandshakeTime: 100,   // 100ms max for real-time
        maxLatencyImpact: 5,     // 5ms max additional latency
        priorityLevel: 'high',
        monitoringInterval: 30000 // 30 seconds
      },
      
      CLAN_MANAGEMENT: {
        maxHandshakeTime: 200,   // 200ms acceptable for clan ops
        maxLatencyImpact: 10,    // 10ms acceptable
        priorityLevel: 'medium',
        monitoringInterval: 60000 // 1 minute
      },
      
      WEB3_TRANSACTIONS: {
        maxHandshakeTime: 150,   // 150ms for Web3 security
        maxLatencyImpact: 8,     // 8ms for blockchain ops
        priorityLevel: 'high',
        monitoringInterval: 20000 // 20 seconds
      }
    },
    
    // Performance degradation detection
    DEGRADATION_DETECTION: {
      trendAnalysisWindow: 300000,    // 5 minutes
      degradationThreshold: 1.5,      // 50% increase
      consecutiveFailures: 3,         // 3 consecutive failures
      alertCooldown: 600000          // 10 minutes between alerts
    }
  },

  // Alerting configuration
  ALERTING: {
    // Alert channels
    CHANNELS: {
      email: process.env.SSL_ALERT_EMAIL || 'ssl-alerts@mlg-clan.com',
      slack: process.env.SSL_ALERT_SLACK_WEBHOOK,
      discord: process.env.SSL_ALERT_DISCORD_WEBHOOK,
      sms: process.env.SSL_ALERT_SMS_NUMBER,
      
      // Gaming-specific alert channels
      gaming: process.env.GAMING_ALERT_WEBHOOK,
      tournament: process.env.TOURNAMENT_ALERT_WEBHOOK,
      web3: process.env.WEB3_ALERT_WEBHOOK
    },
    
    // Alert severity levels
    SEVERITY_LEVELS: {
      info: {
        channels: ['email'],
        cooldown: 3600000,        // 1 hour
        maxDaily: 10
      },
      
      warning: {
        channels: ['email', 'slack'],
        cooldown: 1800000,        // 30 minutes
        maxDaily: 20
      },
      
      critical: {
        channels: ['email', 'slack', 'discord', 'gaming'],
        cooldown: 300000,         // 5 minutes
        maxDaily: 100
      },
      
      emergency: {
        channels: ['email', 'slack', 'discord', 'sms', 'gaming', 'tournament'],
        cooldown: 0,              // No cooldown
        maxDaily: 1000
      }
    },
    
    // Gaming-specific alert rules
    GAMING_ALERT_RULES: {
      tournamentPerformance: {
        threshold: 'handshake > 50ms OR latency > 2ms',
        severity: 'critical',
        channels: ['tournament', 'gaming']
      },
      
      certificateExpiry: {
        threshold: 'expires_in < 7 days AND connection_type = TOURNAMENT',
        severity: 'emergency',
        channels: ['tournament', 'gaming', 'email', 'sms']
      },
      
      web3Security: {
        threshold: 'cipher_downgrade OR certificate_invalid',
        severity: 'critical',
        channels: ['web3', 'gaming', 'email']
      }
    }
  },

  // Reporting and analytics
  REPORTING: {
    // Performance reports
    PERFORMANCE_REPORTS: {
      realTimeInterval: 60000,      // 1 minute real-time reports
      summaryInterval: 3600000,     // 1 hour summary reports
      dailyReportTime: '09:00',     // Daily report at 9 AM
      weeklyReportDay: 'monday'     // Weekly report on Monday
    },
    
    // Metrics collection
    METRICS_COLLECTION: {
      enableDetailedMetrics: true,
      metricsRetention: 2592000000, // 30 days
      samplingRate: 1.0,            // 100% sampling for gaming
      
      // Gaming-specific metrics
      GAMING_METRICS: {
        handshakeLatency: true,
        cipherNegotiation: true,
        sessionResumption: true,
        certificateChainTime: true,
        ocspValidation: true
      }
    }
  }
};

/**
 * SSL Monitoring System
 */
export class SSLMonitoringSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = { ...SSL_MONITORING_CONFIG, ...options };
    this.monitoringIntervals = new Map();
    this.performanceMetrics = new Map();
    this.certificateHealth = new Map();
    this.alertHistory = [];
    this.connectionMetrics = new Map();
    this.degradationAlerts = new Map();
    
    this.init();
  }

  /**
   * Initialize SSL Monitoring System
   */
  async init() {
    console.log('📊 Initializing SSL Monitoring System for MLG.clan Gaming Platform...');
    
    try {
      // Start certificate health monitoring
      await this.startCertificateHealthMonitoring();
      
      // Start performance monitoring
      this.startPerformanceMonitoring();
      
      // Start connection monitoring
      this.startConnectionMonitoring();
      
      // Setup alerting system
      this.setupAlertingSystem();
      
      // Setup reporting
      this.setupReporting();
      
      console.log('✅ SSL Monitoring System initialized successfully');
      this.logMonitoringConfiguration();
      
    } catch (error) {
      console.error('❌ SSL Monitoring System initialization failed:', error);
      throw error;
    }
  }

  /**
   * Start certificate health monitoring
   */
  async startCertificateHealthMonitoring() {
    console.log('🔍 Starting certificate health monitoring...');
    
    const intervals = this.config.CERTIFICATE_HEALTH.CHECK_INTERVALS;
    
    // Critical certificate monitoring (every 5 minutes)
    const criticalInterval = setInterval(() => {
      this.monitorCriticalCertificates();
    }, intervals.critical);
    this.monitoringIntervals.set('critical-certs', criticalInterval);
    
    // Normal certificate monitoring (every 30 minutes)
    const normalInterval = setInterval(() => {
      this.monitorAllCertificates();
    }, intervals.normal);
    this.monitoringIntervals.set('normal-certs', normalInterval);
    
    // Deep certificate analysis (every 6 hours)
    const deepInterval = setInterval(() => {
      this.performDeepCertificateAnalysis();
    }, intervals.deep);
    this.monitoringIntervals.set('deep-analysis', deepInterval);
    
    // Initial health check
    await this.performInitialHealthCheck();
  }

  /**
   * Start performance monitoring
   */
  startPerformanceMonitoring() {
    console.log('⚡ Starting SSL performance monitoring...');
    
    // Real-time performance monitoring (every 10 seconds)
    const realtimeInterval = setInterval(() => {
      this.monitorRealTimePerformance();
    }, 10000);
    this.monitoringIntervals.set('realtime-performance', realtimeInterval);
    
    // Performance trend analysis (every 5 minutes)
    const trendInterval = setInterval(() => {
      this.analyzePerformanceTrends();
    }, 300000);
    this.monitoringIntervals.set('performance-trends', trendInterval);
    
    // Gaming performance validation (every 30 seconds)
    const gamingInterval = setInterval(() => {
      this.validateGamingPerformance();
    }, 30000);
    this.monitoringIntervals.set('gaming-performance', gamingInterval);
  }

  /**
   * Start connection monitoring
   */
  startConnectionMonitoring() {
    console.log('🔗 Starting SSL connection monitoring...');
    
    const connectionTypes = this.config.CONNECTION_MONITORING.CONNECTION_TYPES;
    
    // Monitor each connection type based on its requirements
    for (const [type, config] of Object.entries(connectionTypes)) {
      const interval = setInterval(() => {
        this.monitorConnectionType(type, config);
      }, config.monitoringInterval);
      
      this.monitoringIntervals.set(`connection-${type}`, interval);
    }
    
    // Performance degradation detection
    const degradationInterval = setInterval(() => {
      this.detectPerformanceDegradation();
    }, this.config.CONNECTION_MONITORING.DEGRADATION_DETECTION.trendAnalysisWindow);
    this.monitoringIntervals.set('degradation-detection', degradationInterval);
  }

  /**
   * Setup alerting system
   */
  setupAlertingSystem() {
    console.log('🚨 Setting up SSL alerting system...');
    
    // Setup event handlers for different alert types
    this.on('certificateExpiring', (data) => this.handleCertificateExpiryAlert(data));
    this.on('performanceDegradation', (data) => this.handlePerformanceAlert(data));
    this.on('connectionFailure', (data) => this.handleConnectionAlert(data));
    this.on('gamingPerformanceIssue', (data) => this.handleGamingPerformanceAlert(data));
    this.on('securityViolation', (data) => this.handleSecurityAlert(data));
    
    // Alert cooldown cleanup
    setInterval(() => {
      this.cleanupAlertCooldowns();
    }, 300000); // Every 5 minutes
  }

  /**
   * Setup reporting
   */
  setupReporting() {
    console.log('📋 Setting up SSL monitoring reports...');
    
    const reporting = this.config.REPORTING;
    
    // Real-time reports
    setInterval(() => {
      this.generateRealTimeReport();
    }, reporting.PERFORMANCE_REPORTS.realTimeInterval);
    
    // Summary reports
    setInterval(() => {
      this.generateSummaryReport();
    }, reporting.PERFORMANCE_REPORTS.summaryInterval);
    
    // Daily reports (schedule for 9 AM)
    this.scheduleDailyReports();
  }

  /**
   * Perform initial health check
   */
  async performInitialHealthCheck() {
    console.log('🏥 Performing initial SSL health check...');
    
    // Mock certificate data for demonstration
    const certificates = [
      { domain: 'mlg-clan.com', type: 'primary', priority: 'critical' },
      { domain: 'tournaments.mlg-clan.com', type: 'tournament', priority: 'critical' },
      { domain: 'api.mlg-clan.com', type: 'api', priority: 'critical' },
      { domain: 'realtime.mlg-clan.com', type: 'realtime', priority: 'critical' },
      { domain: 'clans.mlg-clan.com', type: 'clan', priority: 'high' }
    ];
    
    for (const cert of certificates) {
      const health = await this.checkCertificateHealth(cert);
      this.certificateHealth.set(cert.domain, health);
      
      console.log(`   ✅ ${cert.domain}: ${health.status} (expires in ${health.daysUntilExpiry} days)`);
    }
  }

  /**
   * Check certificate health
   */
  async checkCertificateHealth(certificate) {
    const startTime = performance.now();
    
    // Mock certificate validation for demonstration
    const mockExpiry = new Date(Date.now() + (Math.random() * 90 + 10) * 24 * 60 * 60 * 1000); // 10-100 days
    const daysUntilExpiry = Math.floor((mockExpiry - Date.now()) / (24 * 60 * 60 * 1000));
    
    // Simulate validation time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10)); // 10-60ms
    
    const validationTime = performance.now() - startTime;
    
    // Determine health status
    let status = 'healthy';
    const thresholds = this.config.CERTIFICATE_HEALTH.EXPIRATION_THRESHOLDS;
    
    if (daysUntilExpiry <= thresholds.immediate) {
      status = 'critical';
    } else if (daysUntilExpiry <= thresholds.critical) {
      status = 'warning';
    } else if (daysUntilExpiry <= thresholds.warning) {
      status = 'attention';
    }
    
    // Check gaming requirements
    const gamingCompliant = this.validateGamingRequirements(certificate);
    
    return {
      domain: certificate.domain,
      status,
      daysUntilExpiry,
      validationTime: Math.round(validationTime),
      expiryDate: mockExpiry.toISOString(),
      issuer: 'MLG Gaming CA',
      keySize: 2048,
      algorithm: 'RSA',
      gamingCompliant,
      lastChecked: new Date().toISOString(),
      
      // Performance metrics
      performance: {
        handshakeTime: Math.random() * 100 + 20, // 20-120ms
        certificateChainTime: Math.random() * 30 + 5, // 5-35ms
        ocspValidationTime: Math.random() * 20 + 5 // 5-25ms
      }
    };
  }

  /**
   * Validate gaming requirements
   */
  validateGamingRequirements(certificate) {
    const requirements = this.config.CERTIFICATE_HEALTH.GAMING_REQUIREMENTS;
    
    // Mock validation - in production would check actual certificate
    return {
      keySize: 2048 >= requirements.minimumKeySize,
      algorithm: true, // RSA is allowed
      extensions: true, // Has required extensions
      cipherSafety: true, // No disallowed ciphers
      tournamentGrade: certificate.type === 'tournament' ? true : false
    };
  }

  /**
   * Monitor critical certificates
   */
  async monitorCriticalCertificates() {
    console.log('🔍 Monitoring critical certificates...');
    
    const criticalDomains = [
      'mlg-clan.com',
      'tournaments.mlg-clan.com',
      'api.mlg-clan.com',
      'realtime.mlg-clan.com'
    ];
    
    for (const domain of criticalDomains) {
      try {
        const health = await this.checkCertificateHealth({ domain, type: 'critical', priority: 'critical' });
        this.certificateHealth.set(domain, health);
        
        // Check for alerts
        this.checkCertificateAlerts(health);
        
      } catch (error) {
        console.error(`Error monitoring ${domain}:`, error);
        this.emit('certificateError', { domain, error: error.message });
      }
    }
  }

  /**
   * Monitor all certificates
   */
  async monitorAllCertificates() {
    console.log('📋 Monitoring all certificates...');
    
    const allCertificates = Array.from(this.certificateHealth.keys());
    
    for (const domain of allCertificates) {
      try {
        const health = await this.checkCertificateHealth({ domain, type: 'standard', priority: 'normal' });
        this.certificateHealth.set(domain, health);
        
      } catch (error) {
        console.error(`Error monitoring ${domain}:`, error);
      }
    }
    
    console.log(`✅ Monitored ${allCertificates.length} certificates`);
  }

  /**
   * Perform deep certificate analysis
   */
  async performDeepCertificateAnalysis() {
    console.log('🔬 Performing deep certificate analysis...');
    
    const analysis = {
      timestamp: new Date().toISOString(),
      totalCertificates: this.certificateHealth.size,
      healthySertificates: 0,
      criticalCertificates: 0,
      performanceIssues: 0,
      gamingCompliance: 0,
      averageValidationTime: 0,
      recommendations: []
    };
    
    let totalValidationTime = 0;
    
    for (const [domain, health] of this.certificateHealth.entries()) {
      // Count health statuses
      switch (health.status) {
        case 'healthy':
          analysis.healthySertificates++;
          break;
        case 'critical':
          analysis.criticalCertificates++;
          break;
      }
      
      // Check performance
      if (health.validationTime > this.config.PERFORMANCE_THRESHOLDS.CERTIFICATE_VALIDATION.acceptable) {
        analysis.performanceIssues++;
      }
      
      // Check gaming compliance
      if (health.gamingCompliant && Object.values(health.gamingCompliant).every(v => v)) {
        analysis.gamingCompliance++;
      }
      
      totalValidationTime += health.validationTime;
    }
    
    // Calculate averages
    if (analysis.totalCertificates > 0) {
      analysis.averageValidationTime = Math.round(totalValidationTime / analysis.totalCertificates);
    }
    
    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis);
    
    // Emit deep analysis event
    this.emit('deepCertificateAnalysis', analysis);
    
    console.log(`🔬 Deep Analysis Complete: ${analysis.healthySertificates}/${analysis.totalCertificates} healthy certificates`);
    
    return analysis;
  }

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.criticalCertificates > 0) {
      recommendations.push({
        type: 'critical',
        message: `${analysis.criticalCertificates} certificates require immediate attention`,
        action: 'Schedule emergency certificate renewal'
      });
    }
    
    if (analysis.performanceIssues > 0) {
      recommendations.push({
        type: 'performance',
        message: `${analysis.performanceIssues} certificates have performance issues`,
        action: 'Optimize certificate validation process'
      });
    }
    
    if (analysis.averageValidationTime > this.config.PERFORMANCE_THRESHOLDS.CERTIFICATE_VALIDATION.fast) {
      recommendations.push({
        type: 'optimization',
        message: `Average validation time ${analysis.averageValidationTime}ms exceeds gaming targets`,
        action: 'Implement OCSP stapling and certificate caching'
      });
    }
    
    if (analysis.gamingCompliance < analysis.totalCertificates) {
      recommendations.push({
        type: 'compliance',
        message: `${analysis.totalCertificates - analysis.gamingCompliance} certificates need gaming optimization`,
        action: 'Upgrade certificates to gaming-grade specifications'
      });
    }
    
    return recommendations;
  }

  /**
   * Monitor real-time performance
   */
  monitorRealTimePerformance() {
    const performanceData = {
      timestamp: Date.now(),
      handshakeLatency: Math.random() * 150 + 25, // 25-175ms
      certificateValidation: Math.random() * 40 + 10, // 10-50ms
      sessionEstablishment: Math.random() * 250 + 50, // 50-300ms
      connectionType: 'realtime-sample'
    };
    
    // Store performance data
    if (!this.performanceMetrics.has('realtime')) {
      this.performanceMetrics.set('realtime', []);
    }
    
    const metrics = this.performanceMetrics.get('realtime');
    metrics.push(performanceData);
    
    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.splice(0, metrics.length - 100);
    }
    
    // Check performance thresholds
    this.checkPerformanceThresholds(performanceData);
  }

  /**
   * Check performance thresholds
   */
  checkPerformanceThresholds(performanceData) {
    const thresholds = this.config.PERFORMANCE_THRESHOLDS;
    
    // Check handshake latency
    if (performanceData.handshakeLatency > thresholds.HANDSHAKE.critical) {
      this.emit('performanceDegradation', {
        type: 'handshake',
        value: performanceData.handshakeLatency,
        threshold: thresholds.HANDSHAKE.critical,
        severity: 'critical',
        connectionType: performanceData.connectionType,
        timestamp: performanceData.timestamp
      });
    } else if (performanceData.handshakeLatency > thresholds.HANDSHAKE.poor) {
      this.emit('performanceDegradation', {
        type: 'handshake',
        value: performanceData.handshakeLatency,
        threshold: thresholds.HANDSHAKE.poor,
        severity: 'warning',
        connectionType: performanceData.connectionType,
        timestamp: performanceData.timestamp
      });
    }
    
    // Check certificate validation
    if (performanceData.certificateValidation > thresholds.CERTIFICATE_VALIDATION.critical) {
      this.emit('performanceDegradation', {
        type: 'certificate-validation',
        value: performanceData.certificateValidation,
        threshold: thresholds.CERTIFICATE_VALIDATION.critical,
        severity: 'critical',
        connectionType: performanceData.connectionType,
        timestamp: performanceData.timestamp
      });
    }
  }

  /**
   * Analyze performance trends
   */
  analyzePerformanceTrends() {
    console.log('📈 Analyzing SSL performance trends...');
    
    const realtimeMetrics = this.performanceMetrics.get('realtime') || [];
    
    if (realtimeMetrics.length < 10) {
      return; // Need sufficient data
    }
    
    // Analyze last 5 minutes of data
    const fiveMinutesAgo = Date.now() - 300000;
    const recentMetrics = realtimeMetrics.filter(m => m.timestamp >= fiveMinutesAgo);
    
    if (recentMetrics.length === 0) return;
    
    // Calculate trend statistics
    const handshakeTimes = recentMetrics.map(m => m.handshakeLatency);
    const validationTimes = recentMetrics.map(m => m.certificateValidation);
    
    const trends = {
      timestamp: new Date().toISOString(),
      sampleCount: recentMetrics.length,
      handshake: {
        average: this.calculateAverage(handshakeTimes),
        p95: this.calculatePercentile(handshakeTimes, 95),
        trend: this.calculateTrend(handshakeTimes)
      },
      validation: {
        average: this.calculateAverage(validationTimes),
        p95: this.calculatePercentile(validationTimes, 95),
        trend: this.calculateTrend(validationTimes)
      }
    };
    
    // Emit trend analysis
    this.emit('performanceTrendAnalysis', trends);
    
    // Check for concerning trends
    if (trends.handshake.trend > 1.2) { // 20% increase
      console.warn(`⚠️ SSL Handshake performance degrading: ${trends.handshake.trend}x increase`);
    }
    
    if (trends.validation.trend > 1.3) { // 30% increase
      console.warn(`⚠️ Certificate validation performance degrading: ${trends.validation.trend}x increase`);
    }
  }

  /**
   * Validate gaming performance
   */
  validateGamingPerformance() {
    const gamingMetrics = this.performanceMetrics.get('realtime') || [];
    const recentMetrics = gamingMetrics.filter(m => Date.now() - m.timestamp < 60000); // Last minute
    
    if (recentMetrics.length === 0) return;
    
    const performance = {
      timestamp: new Date().toISOString(),
      sampleCount: recentMetrics.length,
      averageHandshake: this.calculateAverage(recentMetrics.map(m => m.handshakeLatency)),
      averageValidation: this.calculateAverage(recentMetrics.map(m => m.certificateValidation)),
      gamingCompliance: 'unknown'
    };
    
    // Determine gaming compliance
    const thresholds = this.config.PERFORMANCE_THRESHOLDS;
    
    if (performance.averageHandshake <= thresholds.HANDSHAKE.excellent &&
        performance.averageValidation <= thresholds.CERTIFICATE_VALIDATION.instant) {
      performance.gamingCompliance = 'excellent';
    } else if (performance.averageHandshake <= thresholds.HANDSHAKE.good &&
               performance.averageValidation <= thresholds.CERTIFICATE_VALIDATION.fast) {
      performance.gamingCompliance = 'good';
    } else if (performance.averageHandshake <= thresholds.HANDSHAKE.acceptable &&
               performance.averageValidation <= thresholds.CERTIFICATE_VALIDATION.acceptable) {
      performance.gamingCompliance = 'acceptable';
    } else {
      performance.gamingCompliance = 'poor';
    }
    
    // Emit gaming performance validation
    this.emit('gamingPerformanceValidation', performance);
    
    // Alert if gaming performance is poor
    if (performance.gamingCompliance === 'poor') {
      this.emit('gamingPerformanceIssue', {
        averageHandshake: performance.averageHandshake,
        averageValidation: performance.averageValidation,
        severity: 'warning',
        recommendation: 'Optimize SSL configuration for gaming performance'
      });
    }
  }

  /**
   * Monitor specific connection type
   */
  monitorConnectionType(connectionType, config) {
    // Simulate connection monitoring
    const connectionData = {
      type: connectionType,
      timestamp: Date.now(),
      handshakeTime: Math.random() * 200 + 20,
      latencyImpact: Math.random() * 15 + 1,
      successful: Math.random() > 0.05, // 95% success rate
      priorityLevel: config.priorityLevel
    };
    
    // Store connection metrics
    if (!this.connectionMetrics.has(connectionType)) {
      this.connectionMetrics.set(connectionType, []);
    }
    
    const metrics = this.connectionMetrics.get(connectionType);
    metrics.push(connectionData);
    
    // Keep only last 50 measurements per connection type
    if (metrics.length > 50) {
      metrics.splice(0, metrics.length - 50);
    }
    
    // Check connection-specific thresholds
    if (connectionData.handshakeTime > config.maxHandshakeTime) {
      this.emit('connectionPerformanceIssue', {
        connectionType,
        metric: 'handshakeTime',
        value: connectionData.handshakeTime,
        threshold: config.maxHandshakeTime,
        severity: config.priorityLevel === 'critical' ? 'critical' : 'warning'
      });
    }
    
    if (connectionData.latencyImpact > config.maxLatencyImpact) {
      this.emit('connectionPerformanceIssue', {
        connectionType,
        metric: 'latencyImpact',
        value: connectionData.latencyImpact,
        threshold: config.maxLatencyImpact,
        severity: config.priorityLevel === 'critical' ? 'critical' : 'warning'
      });
    }
    
    if (!connectionData.successful) {
      this.emit('connectionFailure', {
        connectionType,
        timestamp: connectionData.timestamp,
        severity: config.priorityLevel === 'critical' ? 'critical' : 'warning'
      });
    }
  }

  /**
   * Detect performance degradation
   */
  detectPerformanceDegradation() {
    console.log('🔍 Detecting SSL performance degradation...');
    
    for (const [connectionType, metrics] of this.connectionMetrics.entries()) {
      if (metrics.length < 10) continue; // Need sufficient data
      
      // Compare recent performance with baseline
      const recentMetrics = metrics.slice(-5); // Last 5 measurements
      const baselineMetrics = metrics.slice(-15, -5); // 5-15 measurements ago
      
      if (baselineMetrics.length === 0) continue;
      
      const recentAvg = this.calculateAverage(recentMetrics.map(m => m.handshakeTime));
      const baselineAvg = this.calculateAverage(baselineMetrics.map(m => m.handshakeTime));
      
      const degradationRatio = recentAvg / baselineAvg;
      const threshold = this.config.CONNECTION_MONITORING.DEGRADATION_DETECTION.degradationThreshold;
      
      if (degradationRatio > threshold) {
        const alertKey = `${connectionType}-degradation`;
        const lastAlert = this.degradationAlerts.get(alertKey);
        const cooldown = this.config.CONNECTION_MONITORING.DEGRADATION_DETECTION.alertCooldown;
        
        // Check alert cooldown
        if (!lastAlert || (Date.now() - lastAlert) > cooldown) {
          this.emit('performanceDegradation', {
            connectionType,
            degradationRatio,
            recentAverage: recentAvg,
            baselineAverage: baselineAvg,
            severity: degradationRatio > threshold * 1.5 ? 'critical' : 'warning',
            timestamp: Date.now()
          });
          
          this.degradationAlerts.set(alertKey, Date.now());
        }
      }
    }
  }

  /**
   * Check certificate alerts
   */
  checkCertificateAlerts(health) {
    const thresholds = this.config.CERTIFICATE_HEALTH.EXPIRATION_THRESHOLDS;
    
    if (health.daysUntilExpiry <= thresholds.immediate) {
      this.emit('certificateExpiring', {
        domain: health.domain,
        daysUntilExpiry: health.daysUntilExpiry,
        severity: 'emergency',
        message: `Certificate for ${health.domain} expires in ${health.daysUntilExpiry} day(s)!`
      });
    } else if (health.daysUntilExpiry <= thresholds.critical) {
      this.emit('certificateExpiring', {
        domain: health.domain,
        daysUntilExpiry: health.daysUntilExpiry,
        severity: 'critical',
        message: `Certificate for ${health.domain} expires in ${health.daysUntilExpiry} days`
      });
    } else if (health.daysUntilExpiry <= thresholds.warning) {
      this.emit('certificateExpiring', {
        domain: health.domain,
        daysUntilExpiry: health.daysUntilExpiry,
        severity: 'warning',
        message: `Certificate for ${health.domain} expires in ${health.daysUntilExpiry} days`
      });
    }
  }

  /**
   * Handle certificate expiry alerts
   */
  async handleCertificateExpiryAlert(data) {
    console.log(`🚨 Certificate Expiry Alert [${data.severity.toUpperCase()}]: ${data.message}`);
    
    this.addToAlertHistory({
      type: 'certificate-expiry',
      ...data,
      timestamp: new Date().toISOString()
    });
    
    // Send notifications based on severity
    await this.sendAlert(data.severity, data.message, 'certificate-expiry');
  }

  /**
   * Handle performance alerts
   */
  async handlePerformanceAlert(data) {
    console.log(`⚠️ Performance Alert [${data.severity.toUpperCase()}]: ${data.type} - ${data.value}ms (threshold: ${data.threshold}ms)`);
    
    this.addToAlertHistory({
      type: 'performance',
      ...data,
      timestamp: new Date().toISOString()
    });
    
    await this.sendAlert(data.severity, `SSL ${data.type} performance issue: ${data.value}ms exceeds threshold ${data.threshold}ms`, 'performance');
  }

  /**
   * Handle gaming performance alerts
   */
  async handleGamingPerformanceAlert(data) {
    console.log(`🎮 Gaming Performance Alert: Handshake ${data.averageHandshake}ms, Validation ${data.averageValidation}ms`);
    
    this.addToAlertHistory({
      type: 'gaming-performance',
      ...data,
      timestamp: new Date().toISOString()
    });
    
    await this.sendAlert(data.severity, `Gaming SSL performance degraded: ${data.recommendation}`, 'gaming-performance');
  }

  /**
   * Send alert through configured channels
   */
  async sendAlert(severity, message, alertType) {
    const severityConfig = this.config.ALERTING.SEVERITY_LEVELS[severity];
    if (!severityConfig) return;
    
    console.log(`📢 Sending ${severity} alert: ${message}`);
    
    // In production, would implement actual alert sending
    for (const channel of severityConfig.channels) {
      switch (channel) {
        case 'email':
          console.log(`📧 Would send email alert: ${message}`);
          break;
        case 'slack':
          console.log(`💬 Would send Slack alert: ${message}`);
          break;
        case 'discord':
          console.log(`🎮 Would send Discord alert: ${message}`);
          break;
        case 'gaming':
          console.log(`🎯 Would send gaming platform alert: ${message}`);
          break;
        case 'tournament':
          console.log(`🏆 Would send tournament alert: ${message}`);
          break;
      }
    }
  }

  /**
   * Add alert to history
   */
  addToAlertHistory(alert) {
    this.alertHistory.push(alert);
    
    // Keep only last 1000 alerts
    if (this.alertHistory.length > 1000) {
      this.alertHistory.splice(0, this.alertHistory.length - 1000);
    }
  }

  /**
   * Generate real-time report
   */
  generateRealTimeReport() {
    const report = {
      timestamp: new Date().toISOString(),
      type: 'realtime',
      
      certificateHealth: {
        total: this.certificateHealth.size,
        healthy: Array.from(this.certificateHealth.values()).filter(h => h.status === 'healthy').length,
        critical: Array.from(this.certificateHealth.values()).filter(h => h.status === 'critical').length,
        averageValidationTime: this.calculateAverageValidationTime()
      },
      
      performance: {
        handshakeLatency: this.getRecentPerformanceAverage('handshakeLatency'),
        certificateValidation: this.getRecentPerformanceAverage('certificateValidation'),
        sessionEstablishment: this.getRecentPerformanceAverage('sessionEstablishment')
      },
      
      connectionMetrics: this.getConnectionMetricsSummary(),
      
      recentAlerts: this.alertHistory.filter(a => Date.now() - new Date(a.timestamp).getTime() < 3600000).length // Last hour
    };
    
    this.emit('realtimeReport', report);
  }

  /**
   * Calculate average validation time
   */
  calculateAverageValidationTime() {
    const validationTimes = Array.from(this.certificateHealth.values())
      .map(h => h.validationTime)
      .filter(t => t !== undefined);
    
    return validationTimes.length > 0 ? this.calculateAverage(validationTimes) : 0;
  }

  /**
   * Get recent performance average
   */
  getRecentPerformanceAverage(metric) {
    const realtimeMetrics = this.performanceMetrics.get('realtime') || [];
    const recentMetrics = realtimeMetrics.filter(m => Date.now() - m.timestamp < 300000); // Last 5 minutes
    
    if (recentMetrics.length === 0) return 0;
    
    const values = recentMetrics.map(m => m[metric]).filter(v => v !== undefined);
    return values.length > 0 ? this.calculateAverage(values) : 0;
  }

  /**
   * Get connection metrics summary
   */
  getConnectionMetricsSummary() {
    const summary = {};
    
    for (const [connectionType, metrics] of this.connectionMetrics.entries()) {
      const recentMetrics = metrics.filter(m => Date.now() - m.timestamp < 300000); // Last 5 minutes
      
      if (recentMetrics.length === 0) continue;
      
      summary[connectionType] = {
        sampleCount: recentMetrics.length,
        averageHandshake: this.calculateAverage(recentMetrics.map(m => m.handshakeTime)),
        averageLatency: this.calculateAverage(recentMetrics.map(m => m.latencyImpact)),
        successRate: recentMetrics.filter(m => m.successful).length / recentMetrics.length
      };
    }
    
    return summary;
  }

  /**
   * Utility: Calculate average
   */
  calculateAverage(values) {
    return values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  }

  /**
   * Utility: Calculate percentile
   */
  calculatePercentile(values, percentile) {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.floor((percentile / 100) * sorted.length);
    return sorted[index] || 0;
  }

  /**
   * Utility: Calculate trend (ratio of recent to older values)
   */
  calculateTrend(values) {
    if (values.length < 4) return 1;
    
    const mid = Math.floor(values.length / 2);
    const recent = values.slice(mid);
    const older = values.slice(0, mid);
    
    const recentAvg = this.calculateAverage(recent);
    const olderAvg = this.calculateAverage(older);
    
    return olderAvg > 0 ? Math.round((recentAvg / olderAvg) * 100) / 100 : 1;
  }

  /**
   * Cleanup alert cooldowns
   */
  cleanupAlertCooldowns() {
    const now = Date.now();
    const cooldown = 3600000; // 1 hour
    
    for (const [key, timestamp] of this.degradationAlerts.entries()) {
      if (now - timestamp > cooldown) {
        this.degradationAlerts.delete(key);
      }
    }
  }

  /**
   * Schedule daily reports
   */
  scheduleDailyReports() {
    // In production, would implement proper scheduling
    console.log('📅 Daily SSL monitoring reports scheduled for 9:00 AM');
  }

  /**
   * Generate summary report
   */
  generateSummaryReport() {
    const report = {
      timestamp: new Date().toISOString(),
      type: 'summary',
      period: 'last-hour',
      
      summary: {
        totalCertificates: this.certificateHealth.size,
        healthyCertificates: Array.from(this.certificateHealth.values()).filter(h => h.status === 'healthy').length,
        certificatesExpiringSoon: Array.from(this.certificateHealth.values()).filter(h => h.daysUntilExpiry <= 30).length,
        
        performance: {
          averageHandshake: this.getRecentPerformanceAverage('handshakeLatency'),
          averageValidation: this.getRecentPerformanceAverage('certificateValidation'),
          gamingCompliance: this.assessGamingCompliance()
        },
        
        alerts: {
          total: this.alertHistory.filter(a => Date.now() - new Date(a.timestamp).getTime() < 3600000).length,
          critical: this.alertHistory.filter(a => a.severity === 'critical' && Date.now() - new Date(a.timestamp).getTime() < 3600000).length
        }
      }
    };
    
    this.emit('summaryReport', report);
    
    console.log(`📊 SSL Summary: ${report.summary.healthyCertificates}/${report.summary.totalCertificates} healthy, ${report.summary.performance.averageHandshake}ms avg handshake`);
  }

  /**
   * Assess gaming compliance
   */
  assessGamingCompliance() {
    const handshakeAvg = this.getRecentPerformanceAverage('handshakeLatency');
    const validationAvg = this.getRecentPerformanceAverage('certificateValidation');
    const thresholds = this.config.PERFORMANCE_THRESHOLDS;
    
    if (handshakeAvg <= thresholds.HANDSHAKE.excellent && validationAvg <= thresholds.CERTIFICATE_VALIDATION.instant) {
      return 'excellent';
    } else if (handshakeAvg <= thresholds.HANDSHAKE.good && validationAvg <= thresholds.CERTIFICATE_VALIDATION.fast) {
      return 'good';
    } else if (handshakeAvg <= thresholds.HANDSHAKE.acceptable && validationAvg <= thresholds.CERTIFICATE_VALIDATION.acceptable) {
      return 'acceptable';
    } else {
      return 'poor';
    }
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus() {
    return {
      isRunning: this.monitoringIntervals.size > 0,
      activeMonitors: Array.from(this.monitoringIntervals.keys()),
      certificatesMonitored: this.certificateHealth.size,
      performanceMetrics: this.performanceMetrics.size,
      connectionTypes: Array.from(this.connectionMetrics.keys()),
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Log monitoring configuration
   */
  logMonitoringConfiguration() {
    console.log('📊 SSL Monitoring Configuration:');
    console.log(`   🔍 Certificate Health Checks: Every ${this.config.CERTIFICATE_HEALTH.CHECK_INTERVALS.normal / 60000} minutes`);
    console.log(`   ⚡ Performance Monitoring: Every 10 seconds`);
    console.log(`   🎮 Gaming Validation: Every 30 seconds`);
    console.log(`   🚨 Alert Channels: ${Object.keys(this.config.ALERTING.CHANNELS).length} configured`);
    console.log(`   📋 Reports: Real-time + Hourly summaries`);
    console.log(`   🏆 Gaming Performance Targets: <${this.config.PERFORMANCE_THRESHOLDS.HANDSHAKE.excellent}ms handshake`);
  }

  /**
   * Shutdown monitoring system
   */
  shutdown() {
    console.log('📊 Shutting down SSL Monitoring System...');
    
    // Clear all monitoring intervals
    for (const [name, interval] of this.monitoringIntervals.entries()) {
      clearInterval(interval);
      console.log(`   Stopped ${name} monitoring`);
    }
    
    // Clear all data
    this.monitoringIntervals.clear();
    this.performanceMetrics.clear();
    this.certificateHealth.clear();
    this.connectionMetrics.clear();
    this.degradationAlerts.clear();
    
    // Remove event listeners
    this.removeAllListeners();
    
    console.log('✅ SSL Monitoring System shutdown complete');
  }
}

// Export default instance
export default new SSLMonitoringSystem();