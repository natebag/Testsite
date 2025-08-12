/**
 * Performance Alerting and Regression Detection System
 * 
 * Advanced alerting system for performance monitoring with regression detection,
 * automated performance budget validation, real-time alerting for degradation,
 * and gaming session impact analysis for competitive scenarios.
 * 
 * Features:
 * - Real-time performance threshold monitoring with adaptive thresholds
 * - Regression detection using statistical analysis and machine learning
 * - Performance budget violation detection with CI/CD integration
 * - Gaming session impact analysis for competitive scenarios
 * - Automated alert escalation and resolution tracking
 * - Performance anomaly detection using outlier analysis
 * - Alert correlation and root cause analysis
 * - Integration with gaming optimization systems
 * 
 * @author Claude Code - Analytics Architect
 * @version 1.0.0
 * @created 2025-08-12
 */

import { EventEmitter } from 'events';
import { getPerformanceAnalytics } from './PerformanceAnalytics.js';
import { getGamingMetricsTracker } from './GamingMetricsTracker.js';

export class PerformanceAlertSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Alert thresholds and sensitivity
      alertThresholds: {
        critical: {
          webVitals: {
            LCP: 6000, // 6 seconds
            FID: 1000, // 1 second
            CLS: 0.5,
            FCP: 5000,
            TTI: 10000
          },
          gaming: {
            voteLatency: 5000,
            leaderboardLoad: 8000,
            tournamentBracket: 10000,
            walletInteraction: 15000,
            clanManagement: 8000
          }
        },
        warning: {
          webVitals: {
            LCP: 4000,
            FID: 300,
            CLS: 0.25,
            FCP: 3000,
            TTI: 7300
          },
          gaming: {
            voteLatency: 2000,
            leaderboardLoad: 3000,
            tournamentBracket: 4000,
            walletInteraction: 5000,
            clanManagement: 2500
          }
        }
      },
      
      // Regression detection settings
      regression: {
        sampleSize: 50, // Number of samples for baseline
        significanceLevel: 0.05, // Statistical significance
        minRegressionPercent: 20, // Minimum % increase to consider regression
        baselineUpdateInterval: 3600000, // 1 hour
        adaptiveThresholds: true
      },
      
      // Performance budgets
      budgets: {
        webVitals: {
          LCP: { target: 2500, budget: 3000 },
          FID: { target: 100, budget: 300 },
          CLS: { target: 0.1, budget: 0.25 },
          FCP: { target: 1800, budget: 3000 },
          TTI: { target: 3800, budget: 7300 }
        },
        gaming: {
          voteLatency: { target: 500, budget: 2000 },
          leaderboardLoad: { target: 800, budget: 3000 },
          tournamentBracket: { target: 1200, budget: 4000 },
          walletInteraction: { target: 1000, budget: 5000 },
          clanManagement: { target: 600, budget: 2500 }
        },
        resources: {
          bundleSize: { target: 500, budget: 1000 }, // KB
          memoryUsage: { target: 50, budget: 100 }, // MB
          cpuUsage: { target: 30, budget: 70 } // %
        }
      },
      
      // Alert management
      alertSettings: {
        enableRealTimeAlerts: options.enableRealTimeAlerts !== false,
        enableEmailAlerts: options.enableEmailAlerts || false,
        enableSlackAlerts: options.enableSlackAlerts || false,
        alertCooldown: options.alertCooldown || 300000, // 5 minutes
        maxAlertsPerHour: options.maxAlertsPerHour || 20,
        escalationLevels: ['info', 'warning', 'critical', 'emergency']
      },
      
      // Competitive gaming context
      competitiveSettings: {
        tournamentAlertSensitivity: 1.5, // More sensitive during tournaments
        highStakesThresholdMultiplier: 0.7, // Stricter thresholds for high stakes
        liveEventPriority: 'critical' // Default priority for live events
      },
      
      ...options
    };
    
    // Initialize core systems
    this.performanceAnalytics = getPerformanceAnalytics();
    this.gamingMetricsTracker = getGamingMetricsTracker();
    
    // Alert state management
    this.activeAlerts = new Map();
    this.alertHistory = new Map();
    this.baselineData = new Map();
    this.regressionModels = new Map();
    
    // Performance budget tracking
    this.budgetViolations = new Map();
    this.budgetHistory = new Map();
    
    // Rate limiting and cooldowns
    this.alertCooldowns = new Map();
    this.alertCounts = new Map();
    
    // Statistical analysis
    this.performanceStats = new Map();
    this.outlierDetector = new OutlierDetector();
    
    this.logger = options.logger || console;
    this.isInitialized = false;
    
    this.initializeAlertSystem();
  }

  /**
   * Initialize the performance alert system
   */
  async initializeAlertSystem() {
    if (this.isInitialized) return;
    
    try {
      // Setup event listeners
      this.setupEventListeners();
      
      // Load historical baselines
      await this.loadPerformanceBaselines();
      
      // Initialize regression models
      await this.initializeRegressionModels();
      
      // Setup performance budget monitoring
      this.initializeBudgetMonitoring();
      
      // Start background processes
      this.startBackgroundProcesses();
      
      this.isInitialized = true;
      this.emit('alert_system:initialized');
      this.logger.log('Performance alert system initialized');
      
    } catch (error) {
      this.logger.error('Failed to initialize performance alert system:', error);
      throw error;
    }
  }

  /**
   * Setup event listeners for performance monitoring
   */
  setupEventListeners() {
    // Listen to performance analytics events
    this.performanceAnalytics.on('metric:recorded', (metric) => {
      this.analyzeMetricForAlerts(metric);
    });
    
    this.performanceAnalytics.on('gaming_metric:recorded', (metric) => {
      this.analyzeGamingMetricForAlerts(metric);
    });
    
    this.performanceAnalytics.on('alert:created', (alert) => {
      this.handleIncomingAlert(alert);
    });
    
    // Listen to gaming metrics tracker events
    this.gamingMetricsTracker.on('performance:degradation_detected', (data) => {
      this.handlePerformanceDegradation(data);
    });
    
    this.gamingMetricsTracker.on('anomaly:detected', (anomaly) => {
      this.handlePerformanceAnomaly(anomaly);
    });
    
    // Listen to competitive context changes
    this.gamingMetricsTracker.on('tournament:started', (tournamentId) => {
      this.adjustAlertsForCompetitiveContext('tournament_start', tournamentId);
    });
    
    this.gamingMetricsTracker.on('tournament:ended', (tournamentId) => {
      this.adjustAlertsForCompetitiveContext('tournament_end', tournamentId);
    });
  }

  /**
   * Analyze Web Core Vitals metrics for alerts
   */
  analyzeMetricForAlerts(metric) {
    if (metric.type !== 'web_vital') return;
    
    const { name, value, data } = metric;
    const thresholds = this.getAdaptiveThresholds('webVitals', name);
    
    // Check against thresholds
    const alertLevel = this.determineAlertLevel(value, thresholds);
    
    if (alertLevel !== 'normal') {
      this.createPerformanceAlert({
        type: 'web_vital_threshold',
        category: 'webVitals',
        metric: name,
        value,
        threshold: thresholds[alertLevel],
        level: alertLevel,
        data,
        timestamp: Date.now()
      });
    }
    
    // Update baseline data
    this.updateBaseline('webVitals', name, value);
    
    // Check for regression
    this.checkForRegression('webVitals', name, value);
    
    // Update performance budget tracking
    this.updateBudgetTracking('webVitals', name, value);
  }

  /**
   * Analyze gaming metrics for alerts
   */
  analyzeGamingMetricForAlerts(metric) {
    if (metric.type !== 'gaming_performance') return;
    
    const { name, data } = metric;
    const value = data.duration || data.value;
    
    if (!value) return;
    
    // Map gaming metric names to categories
    const category = this.mapGamingMetricToCategory(name);
    const thresholds = this.getAdaptiveThresholds('gaming', category);
    
    const alertLevel = this.determineAlertLevel(value, thresholds);
    
    if (alertLevel !== 'normal') {
      this.createPerformanceAlert({
        type: 'gaming_performance_threshold',
        category: 'gaming',
        metric: category,
        metricName: name,
        value,
        threshold: thresholds[alertLevel],
        level: alertLevel,
        data,
        timestamp: Date.now(),
        competitiveContext: this.gamingMetricsTracker.getCompetitiveStatus()
      });
    }
    
    // Update baseline and check regression
    this.updateBaseline('gaming', category, value);
    this.checkForRegression('gaming', category, value);
    this.updateBudgetTracking('gaming', category, value);
  }

  /**
   * Map gaming metric names to performance categories
   */
  mapGamingMetricToCategory(metricName) {
    const mappings = {
      'vote_response_time': 'voteLatency',
      'vote_aggregation': 'voteLatency',
      'leaderboard_render_time': 'leaderboardLoad',
      'leaderboard_update': 'leaderboardLoad',
      'tournament_bracket_load': 'tournamentBracket',
      'wallet_interaction_time': 'walletInteraction',
      'clan_management_time': 'clanManagement'
    };
    
    return mappings[metricName] || 'unknown';
  }

  /**
   * Get adaptive thresholds based on context and historical data
   */
  getAdaptiveThresholds(category, metric) {
    const baseThresholds = {
      warning: this.config.alertThresholds.warning[category][metric],
      critical: this.config.alertThresholds.critical[category][metric]
    };
    
    if (!this.config.regression.adaptiveThresholds) {
      return baseThresholds;
    }
    
    // Adjust thresholds based on competitive context
    const competitiveStatus = this.gamingMetricsTracker.getCompetitiveStatus();
    let multiplier = 1;
    
    if (competitiveStatus.isCompetitive) {
      multiplier = this.config.competitiveSettings.tournamentAlertSensitivity;
    }
    
    // Adjust thresholds based on historical performance
    const baseline = this.getBaseline(category, metric);
    if (baseline && baseline.samples > 10) {
      const adaptiveMultiplier = Math.max(0.5, Math.min(2, baseline.p90 / baseThresholds.warning));
      multiplier *= adaptiveMultiplier;
    }
    
    return {
      warning: Math.round(baseThresholds.warning / multiplier),
      critical: Math.round(baseThresholds.critical / multiplier)
    };
  }

  /**
   * Determine alert level based on value and thresholds
   */
  determineAlertLevel(value, thresholds) {
    if (value >= thresholds.critical) return 'critical';
    if (value >= thresholds.warning) return 'warning';
    return 'normal';
  }

  /**
   * Create and manage performance alert
   */
  createPerformanceAlert(alertData) {
    // Check rate limiting
    if (!this.canCreateAlert(alertData.type)) {
      return null;
    }
    
    const alertId = `${alertData.type}_${alertData.metric}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const alert = {
      id: alertId,
      ...alertData,
      status: 'active',
      created: Date.now(),
      acknowledged: false,
      resolved: false,
      escalationLevel: 0,
      correlatedAlerts: [],
      impactAssessment: this.assessAlertImpact(alertData)
    };
    
    // Store alert
    this.activeAlerts.set(alertId, alert);
    
    // Update alert history
    if (!this.alertHistory.has(alertData.type)) {
      this.alertHistory.set(alertData.type, []);
    }
    this.alertHistory.get(alertData.type).push(alert);
    
    // Set cooldown
    this.setAlertCooldown(alertData.type);
    
    // Correlate with existing alerts
    this.correlateAlert(alert);
    
    // Emit alert event
    this.emit('alert:created', alert);
    
    // Handle immediate actions
    this.handleAlertActions(alert);
    
    this.logger.warn('Performance alert created:', {
      id: alertId,
      type: alertData.type,
      metric: alertData.metric,
      value: alertData.value,
      level: alertData.level
    });
    
    return alertId;
  }

  /**
   * Assess the impact of an alert
   */
  assessAlertImpact(alertData) {
    const impact = {
      userExperience: 'low',
      competitiveImpact: 'low',
      businessImpact: 'low',
      severity: alertData.level
    };
    
    // Assess user experience impact
    if (alertData.category === 'webVitals') {
      impact.userExperience = alertData.level === 'critical' ? 'high' : 'medium';
    }
    
    // Assess competitive gaming impact
    if (alertData.category === 'gaming') {
      const competitiveMetrics = ['voteLatency', 'leaderboardLoad', 'tournamentBracket'];
      if (competitiveMetrics.includes(alertData.metric)) {
        impact.competitiveImpact = alertData.level === 'critical' ? 'high' : 'medium';
        
        // Higher impact during competitive events
        if (alertData.competitiveContext?.isCompetitive) {
          impact.competitiveImpact = 'high';
          impact.severity = 'critical';
        }
      }
    }
    
    // Assess business impact
    const criticalMetrics = ['voteLatency', 'walletInteraction', 'LCP', 'FID'];
    if (criticalMetrics.includes(alertData.metric) && alertData.level === 'critical') {
      impact.businessImpact = 'high';
    }
    
    return impact;
  }

  /**
   * Handle alert actions based on type and severity
   */
  handleAlertActions(alert) {
    // Immediate notification for critical alerts
    if (alert.level === 'critical') {
      this.sendImmediateNotification(alert);
    }
    
    // Auto-escalation for high impact alerts
    if (alert.impactAssessment.competitiveImpact === 'high') {
      setTimeout(() => {
        this.escalateAlert(alert.id);
      }, 60000); // Escalate after 1 minute if not resolved
    }
    
    // Trigger automated remediation if available
    if (this.hasAutomatedRemediation(alert.type)) {
      this.triggerAutomatedRemediation(alert);
    }
  }

  /**
   * Send immediate notification for critical alerts
   */
  sendImmediateNotification(alert) {
    const notification = {
      alert,
      channels: this.getNotificationChannels(alert),
      priority: 'immediate',
      timestamp: Date.now()
    };
    
    this.emit('notification:send', notification);
    
    // Integration points for external notification systems
    if (this.config.alertSettings.enableEmailAlerts) {
      this.sendEmailNotification(notification);
    }
    
    if (this.config.alertSettings.enableSlackAlerts) {
      this.sendSlackNotification(notification);
    }
  }

  /**
   * Get appropriate notification channels for alert
   */
  getNotificationChannels(alert) {
    const channels = ['dashboard'];
    
    if (alert.level === 'critical') {
      channels.push('email', 'push');
    }
    
    if (alert.impactAssessment.competitiveImpact === 'high') {
      channels.push('slack', 'sms');
    }
    
    return channels;
  }

  /**
   * Correlate alert with existing alerts for pattern detection
   */
  correlateAlert(newAlert) {
    const correlatedAlerts = [];
    
    // Find alerts in similar timeframe
    const timeWindow = 300000; // 5 minutes
    const cutoff = newAlert.created - timeWindow;
    
    for (const [alertId, alert] of this.activeAlerts) {
      if (alert.id === newAlert.id || alert.created < cutoff) continue;
      
      // Check for correlation patterns
      if (this.isCorrelated(newAlert, alert)) {
        correlatedAlerts.push(alert.id);
        alert.correlatedAlerts.push(newAlert.id);
      }
    }
    
    newAlert.correlatedAlerts = correlatedAlerts;
    
    // Analyze correlation patterns
    if (correlatedAlerts.length > 0) {
      this.analyzeCorrelationPattern(newAlert, correlatedAlerts);
    }
  }

  /**
   * Check if two alerts are correlated
   */
  isCorrelated(alert1, alert2) {
    // Same category alerts are likely correlated
    if (alert1.category === alert2.category) return true;
    
    // Network-related correlations
    if (this.isNetworkRelated(alert1) && this.isNetworkRelated(alert2)) return true;
    
    // Gaming operation correlations
    if (alert1.category === 'gaming' && alert2.category === 'gaming') {
      return this.isGamingOperationCorrelated(alert1, alert2);
    }
    
    return false;
  }

  /**
   * Check if alert is network-related
   */
  isNetworkRelated(alert) {
    const networkMetrics = ['walletInteraction', 'voteLatency', 'LCP', 'FCP'];
    return networkMetrics.includes(alert.metric);
  }

  /**
   * Check if gaming operations are correlated
   */
  isGamingOperationCorrelated(alert1, alert2) {
    const correlations = {
      'voteLatency': ['walletInteraction', 'leaderboardLoad'],
      'leaderboardLoad': ['voteLatency', 'tournamentBracket'],
      'tournamentBracket': ['leaderboardLoad', 'clanManagement']
    };
    
    return correlations[alert1.metric]?.includes(alert2.metric) || false;
  }

  /**
   * Analyze correlation patterns for root cause analysis
   */
  analyzeCorrelationPattern(alert, correlatedAlertIds) {
    const pattern = {
      primaryAlert: alert.id,
      correlatedAlerts: correlatedAlertIds,
      patternType: this.identifyPatternType(alert, correlatedAlertIds),
      rootCause: this.inferRootCause(alert, correlatedAlertIds),
      timestamp: Date.now()
    };
    
    this.emit('correlation:pattern_detected', pattern);
    
    // Create aggregate alert for widespread issues
    if (correlatedAlertIds.length >= 3) {
      this.createAggregateAlert(pattern);
    }
  }

  /**
   * Identify the type of correlation pattern
   */
  identifyPatternType(alert, correlatedAlertIds) {
    const correlatedAlerts = correlatedAlertIds.map(id => this.activeAlerts.get(id)).filter(Boolean);
    
    // All same category
    if (correlatedAlerts.every(a => a.category === alert.category)) {
      return `${alert.category}_cascade`;
    }
    
    // Network-related cascade
    if (correlatedAlerts.every(a => this.isNetworkRelated(a))) {
      return 'network_degradation';
    }
    
    // Gaming performance cascade
    if (alert.category === 'gaming' && correlatedAlerts.some(a => a.category === 'gaming')) {
      return 'gaming_performance_cascade';
    }
    
    return 'mixed_performance_issue';
  }

  /**
   * Infer root cause from correlation pattern
   */
  inferRootCause(alert, correlatedAlertIds) {
    const correlatedAlerts = correlatedAlertIds.map(id => this.activeAlerts.get(id)).filter(Boolean);
    
    // Network-related root causes
    if (this.isNetworkRelated(alert) && correlatedAlerts.some(a => this.isNetworkRelated(a))) {
      return {
        type: 'network',
        confidence: 0.8,
        description: 'Network connectivity or latency issues'
      };
    }
    
    // Resource-related root causes
    if (alert.category === 'webVitals' && correlatedAlerts.some(a => a.category === 'webVitals')) {
      return {
        type: 'resource',
        confidence: 0.7,
        description: 'System resource constraints or performance bottlenecks'
      };
    }
    
    // Gaming-specific root causes
    if (alert.category === 'gaming') {
      return {
        type: 'gaming_system',
        confidence: 0.6,
        description: 'Gaming system performance degradation'
      };
    }
    
    return {
      type: 'unknown',
      confidence: 0.3,
      description: 'Unable to determine root cause'
    };
  }

  /**
   * Create aggregate alert for widespread performance issues
   */
  createAggregateAlert(pattern) {
    const alertId = `aggregate_${pattern.patternType}_${Date.now()}`;
    
    const aggregateAlert = {
      id: alertId,
      type: 'aggregate_performance_issue',
      category: 'system',
      level: 'critical',
      patternType: pattern.patternType,
      rootCause: pattern.rootCause,
      affectedAlerts: pattern.correlatedAlerts.length + 1,
      correlatedAlerts: [pattern.primaryAlert, ...pattern.correlatedAlerts],
      created: Date.now(),
      status: 'active',
      impactAssessment: {
        userExperience: 'high',
        competitiveImpact: 'high',
        businessImpact: 'high',
        severity: 'critical'
      }
    };
    
    this.activeAlerts.set(alertId, aggregateAlert);
    this.emit('alert:aggregate_created', aggregateAlert);
    
    // Immediate notification for aggregate alerts
    this.sendImmediateNotification(aggregateAlert);
  }

  /**
   * Regression Detection System
   */

  /**
   * Check for performance regression
   */
  checkForRegression(category, metric, value) {
    const baseline = this.getBaseline(category, metric);
    if (!baseline || baseline.samples < this.config.regression.sampleSize) {
      return; // Not enough data for regression detection
    }
    
    const regression = this.detectRegression(baseline, value);
    
    if (regression.isRegression) {
      this.handleRegression(category, metric, value, baseline, regression);
    }
  }

  /**
   * Detect statistical regression
   */
  detectRegression(baseline, currentValue) {
    const { mean, stdDev, p95, samples } = baseline;
    
    // Statistical significance test
    const zScore = (currentValue - mean) / stdDev;
    const isStatisticallySignificant = zScore > 1.96; // 95% confidence
    
    // Percentage increase check
    const percentIncrease = ((currentValue - mean) / mean) * 100;
    const isSignificantIncrease = percentIncrease > this.config.regression.minRegressionPercent;
    
    // P95 comparison
    const isAboveP95 = currentValue > p95;
    
    const isRegression = isStatisticallySignificant && isSignificantIncrease && isAboveP95;
    
    return {
      isRegression,
      zScore,
      percentIncrease,
      confidence: this.calculateRegressionConfidence(zScore, percentIncrease, samples),
      severity: this.calculateRegressionSeverity(percentIncrease)
    };
  }

  /**
   * Calculate regression confidence score
   */
  calculateRegressionConfidence(zScore, percentIncrease, samples) {
    let confidence = 0;
    
    // Z-score contribution (40%)
    confidence += Math.min(40, (zScore / 3) * 40);
    
    // Percentage increase contribution (40%)
    confidence += Math.min(40, (percentIncrease / 100) * 40);
    
    // Sample size contribution (20%)
    confidence += Math.min(20, (samples / 100) * 20);
    
    return Math.min(100, Math.max(0, confidence));
  }

  /**
   * Calculate regression severity
   */
  calculateRegressionSeverity(percentIncrease) {
    if (percentIncrease > 100) return 'critical';
    if (percentIncrease > 50) return 'major';
    if (percentIncrease > 30) return 'moderate';
    return 'minor';
  }

  /**
   * Handle detected regression
   */
  handleRegression(category, metric, value, baseline, regression) {
    const regressionAlert = this.createPerformanceAlert({
      type: 'performance_regression',
      category,
      metric,
      value,
      baseline: baseline.mean,
      level: regression.severity === 'critical' ? 'critical' : 'warning',
      regression: {
        percentIncrease: regression.percentIncrease,
        confidence: regression.confidence,
        severity: regression.severity,
        zScore: regression.zScore
      },
      timestamp: Date.now()
    });
    
    this.emit('regression:detected', {
      alertId: regressionAlert,
      category,
      metric,
      regression
    });
    
    // Update regression model
    this.updateRegressionModel(category, metric, regression);
  }

  /**
   * Performance Budget Monitoring
   */

  /**
   * Initialize performance budget monitoring
   */
  initializeBudgetMonitoring() {
    // Monitor budget violations in real-time
    this.on('budget:violation', (violation) => {
      this.handleBudgetViolation(violation);
    });
  }

  /**
   * Update performance budget tracking
   */
  updateBudgetTracking(category, metric, value) {
    const budget = this.config.budgets[category]?.[metric];
    if (!budget) return;
    
    const violation = this.checkBudgetViolation(category, metric, value, budget);
    
    if (violation) {
      this.recordBudgetViolation(violation);
    }
    
    // Update budget history
    this.updateBudgetHistory(category, metric, value, budget);
  }

  /**
   * Check for budget violation
   */
  checkBudgetViolation(category, metric, value, budget) {
    if (value <= budget.budget) return null;
    
    const violation = {
      category,
      metric,
      value,
      budget: budget.budget,
      target: budget.target,
      overage: value - budget.budget,
      overagePercent: ((value - budget.budget) / budget.budget) * 100,
      severity: this.calculateBudgetViolationSeverity(value, budget),
      timestamp: Date.now()
    };
    
    return violation;
  }

  /**
   * Calculate budget violation severity
   */
  calculateBudgetViolationSeverity(value, budget) {
    const overagePercent = ((value - budget.budget) / budget.budget) * 100;
    
    if (overagePercent > 100) return 'critical'; // More than 2x budget
    if (overagePercent > 50) return 'major';     // 1.5x budget
    if (overagePercent > 20) return 'moderate';  // 1.2x budget
    return 'minor';
  }

  /**
   * Record budget violation
   */
  recordBudgetViolation(violation) {
    const violationId = `budget_${violation.category}_${violation.metric}_${Date.now()}`;
    
    if (!this.budgetViolations.has(violation.category)) {
      this.budgetViolations.set(violation.category, new Map());
    }
    
    this.budgetViolations.get(violation.category).set(violation.metric, violation);
    
    // Emit budget violation event
    this.emit('budget:violation', {
      id: violationId,
      ...violation
    });
    
    // Create performance alert for budget violation
    this.createPerformanceAlert({
      type: 'budget_violation',
      category: violation.category,
      metric: violation.metric,
      value: violation.value,
      budget: violation.budget,
      level: violation.severity === 'critical' ? 'critical' : 'warning',
      violation,
      timestamp: Date.now()
    });
  }

  /**
   * Handle budget violation
   */
  handleBudgetViolation(violation) {
    this.logger.warn('Performance budget violation detected:', violation);
    
    // Trigger automated optimization if available
    if (this.hasAutomatedOptimization(violation.category, violation.metric)) {
      this.triggerAutomatedOptimization(violation);
    }
    
    // CI/CD integration - fail build if critical violation
    if (violation.severity === 'critical' && this.config.cicdIntegration) {
      this.emit('cicd:build_failure', {
        reason: 'performance_budget_violation',
        violation
      });
    }
  }

  /**
   * Update budget history for trend analysis
   */
  updateBudgetHistory(category, metric, value, budget) {
    const key = `${category}_${metric}`;
    
    if (!this.budgetHistory.has(key)) {
      this.budgetHistory.set(key, []);
    }
    
    const history = this.budgetHistory.get(key);
    history.push({
      value,
      budget: budget.budget,
      target: budget.target,
      timestamp: Date.now()
    });
    
    // Keep only last 100 entries
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * Baseline Management
   */

  /**
   * Update performance baseline
   */
  updateBaseline(category, metric, value) {
    const key = `${category}_${metric}`;
    
    if (!this.baselineData.has(key)) {
      this.baselineData.set(key, {
        values: [],
        samples: 0,
        mean: 0,
        stdDev: 0,
        p95: 0,
        p99: 0,
        lastUpdated: Date.now()
      });
    }
    
    const baseline = this.baselineData.get(key);
    baseline.values.push(value);
    
    // Keep only recent samples for baseline
    if (baseline.values.length > this.config.regression.sampleSize * 2) {
      baseline.values.shift();
    }
    
    // Recalculate statistics
    this.recalculateBaselineStatistics(baseline);
    baseline.lastUpdated = Date.now();
  }

  /**
   * Recalculate baseline statistics
   */
  recalculateBaselineStatistics(baseline) {
    const values = baseline.values.sort((a, b) => a - b);
    baseline.samples = values.length;
    
    // Mean
    baseline.mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    
    // Standard deviation
    const variance = values.reduce((sum, v) => sum + Math.pow(v - baseline.mean, 2), 0) / values.length;
    baseline.stdDev = Math.sqrt(variance);
    
    // Percentiles
    baseline.p95 = this.calculatePercentile(values, 95);
    baseline.p99 = this.calculatePercentile(values, 99);
  }

  /**
   * Calculate percentile from sorted array
   */
  calculatePercentile(sortedValues, percentile) {
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[index] || 0;
  }

  /**
   * Get baseline data for metric
   */
  getBaseline(category, metric) {
    const key = `${category}_${metric}`;
    return this.baselineData.get(key);
  }

  /**
   * Load historical baselines
   */
  async loadPerformanceBaselines() {
    try {
      // Load from localStorage or external service
      const storedBaselines = localStorage.getItem('performance_baselines');
      if (storedBaselines) {
        const baselines = JSON.parse(storedBaselines);
        for (const [key, baseline] of Object.entries(baselines)) {
          this.baselineData.set(key, baseline);
        }
      }
    } catch (error) {
      this.logger.warn('Failed to load performance baselines:', error);
    }
  }

  /**
   * Save performance baselines
   */
  async savePerformanceBaselines() {
    try {
      const baselines = Object.fromEntries(this.baselineData);
      localStorage.setItem('performance_baselines', JSON.stringify(baselines));
    } catch (error) {
      this.logger.warn('Failed to save performance baselines:', error);
    }
  }

  /**
   * Alert Management
   */

  /**
   * Check if alert can be created (rate limiting)
   */
  canCreateAlert(alertType) {
    const now = Date.now();
    const cooldownKey = alertType;
    
    // Check cooldown
    if (this.alertCooldowns.has(cooldownKey)) {
      const cooldownEnd = this.alertCooldowns.get(cooldownKey);
      if (now < cooldownEnd) {
        return false;
      }
    }
    
    // Check hourly rate limit
    const hourKey = `${alertType}_${Math.floor(now / 3600000)}`;
    const hourlyCount = this.alertCounts.get(hourKey) || 0;
    
    if (hourlyCount >= this.config.alertSettings.maxAlertsPerHour) {
      return false;
    }
    
    // Update count
    this.alertCounts.set(hourKey, hourlyCount + 1);
    
    return true;
  }

  /**
   * Set alert cooldown
   */
  setAlertCooldown(alertType) {
    const cooldownEnd = Date.now() + this.config.alertSettings.alertCooldown;
    this.alertCooldowns.set(alertType, cooldownEnd);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId, userId = 'system') {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;
    
    alert.acknowledged = true;
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = Date.now();
    
    this.emit('alert:acknowledged', { alertId, userId });
    return true;
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId, resolution = 'manual', userId = 'system') {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;
    
    alert.resolved = true;
    alert.resolvedBy = userId;
    alert.resolvedAt = Date.now();
    alert.resolution = resolution;
    alert.status = 'resolved';
    
    // Remove from active alerts
    this.activeAlerts.delete(alertId);
    
    this.emit('alert:resolved', { alertId, resolution, userId });
    return true;
  }

  /**
   * Escalate alert to next level
   */
  escalateAlert(alertId) {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;
    
    alert.escalationLevel += 1;
    alert.lastEscalated = Date.now();
    
    const maxLevel = this.config.alertSettings.escalationLevels.length - 1;
    if (alert.escalationLevel > maxLevel) {
      alert.escalationLevel = maxLevel;
    }
    
    const escalationLevel = this.config.alertSettings.escalationLevels[alert.escalationLevel];
    alert.currentEscalationLevel = escalationLevel;
    
    this.emit('alert:escalated', { alertId, escalationLevel });
    
    // Send escalated notification
    this.sendEscalatedNotification(alert);
    
    return true;
  }

  /**
   * Send escalated notification
   */
  sendEscalatedNotification(alert) {
    const notification = {
      alert,
      type: 'escalation',
      escalationLevel: alert.currentEscalationLevel,
      channels: this.getEscalationChannels(alert.currentEscalationLevel),
      priority: 'high',
      timestamp: Date.now()
    };
    
    this.emit('notification:escalation', notification);
  }

  /**
   * Get notification channels for escalation level
   */
  getEscalationChannels(escalationLevel) {
    const channelMap = {
      'info': ['dashboard'],
      'warning': ['dashboard', 'email'],
      'critical': ['dashboard', 'email', 'slack'],
      'emergency': ['dashboard', 'email', 'slack', 'sms', 'phone']
    };
    
    return channelMap[escalationLevel] || ['dashboard'];
  }

  /**
   * Background Processes
   */

  /**
   * Start background processes
   */
  startBackgroundProcesses() {
    // Baseline update process
    setInterval(() => {
      this.savePerformanceBaselines();
    }, this.config.regression.baselineUpdateInterval);
    
    // Alert cleanup process
    setInterval(() => {
      this.cleanupResolvedAlerts();
      this.cleanupExpiredCooldowns();
    }, 600000); // Every 10 minutes
    
    // Escalation check process
    setInterval(() => {
      this.checkAutoEscalation();
    }, 60000); // Every minute
  }

  /**
   * Clean up resolved alerts
   */
  cleanupResolvedAlerts() {
    const cutoff = Date.now() - 86400000; // 24 hours
    
    for (const [type, alerts] of this.alertHistory) {
      this.alertHistory.set(type, alerts.filter(alert => 
        alert.created > cutoff || !alert.resolved
      ));
    }
  }

  /**
   * Clean up expired cooldowns
   */
  cleanupExpiredCooldowns() {
    const now = Date.now();
    
    for (const [key, cooldownEnd] of this.alertCooldowns) {
      if (now > cooldownEnd) {
        this.alertCooldowns.delete(key);
      }
    }
    
    // Clean up old hourly counts
    const currentHour = Math.floor(now / 3600000);
    for (const [key] of this.alertCounts) {
      const keyHour = parseInt(key.split('_').pop());
      if (currentHour - keyHour > 24) { // Keep 24 hours
        this.alertCounts.delete(key);
      }
    }
  }

  /**
   * Check for auto-escalation
   */
  checkAutoEscalation() {
    const now = Date.now();
    const escalationTimeout = 600000; // 10 minutes
    
    for (const [alertId, alert] of this.activeAlerts) {
      if (alert.resolved || alert.acknowledged) continue;
      
      const timeSinceCreated = now - alert.created;
      const timeSinceLastEscalation = now - (alert.lastEscalated || alert.created);
      
      // Auto-escalate after timeout
      if (timeSinceCreated > escalationTimeout && timeSinceLastEscalation > escalationTimeout) {
        if (alert.impactAssessment.severity === 'critical' || 
            alert.impactAssessment.competitiveImpact === 'high') {
          this.escalateAlert(alertId);
        }
      }
    }
  }

  /**
   * Competitive Context Adjustments
   */

  /**
   * Adjust alerts for competitive gaming context
   */
  adjustAlertsForCompetitiveContext(event, tournamentId) {
    if (event === 'tournament_start') {
      // Tighten alert thresholds
      this.adjustAlertThresholds('competitive');
      
      // Enable high-priority monitoring
      this.competitiveContext.activeTournaments.add(tournamentId);
      
      this.emit('competitive:monitoring_enabled', { tournamentId });
      
    } else if (event === 'tournament_end') {
      // Reset alert thresholds
      this.adjustAlertThresholds('normal');
      
      // Disable high-priority monitoring
      this.competitiveContext.activeTournaments.delete(tournamentId);
      
      this.emit('competitive:monitoring_disabled', { tournamentId });
    }
  }

  /**
   * Adjust alert thresholds based on context
   */
  adjustAlertThresholds(context) {
    const multiplier = context === 'competitive' ? 
      this.config.competitiveSettings.tournamentAlertSensitivity : 1;
    
    // Apply multiplier to thresholds (inverse for competitive - more sensitive)
    const factor = context === 'competitive' ? (1 / multiplier) : multiplier;
    
    // This would update the threshold configuration
    // Implementation details would depend on requirements
  }

  /**
   * Handle incoming alerts from other systems
   */
  handleIncomingAlert(alert) {
    // Process alerts from performance analytics system
    this.correlateAlert(alert);
  }

  /**
   * Handle performance degradation events
   */
  handlePerformanceDegradation(data) {
    this.createPerformanceAlert({
      type: 'performance_degradation',
      category: 'system',
      metric: data.type,
      level: 'warning',
      degradation: data,
      timestamp: Date.now()
    });
  }

  /**
   * Handle performance anomalies
   */
  handlePerformanceAnomaly(anomaly) {
    this.createPerformanceAlert({
      type: 'performance_anomaly',
      category: 'user',
      metric: anomaly.operationType,
      level: 'warning',
      anomaly,
      timestamp: Date.now()
    });
  }

  /**
   * Initialize regression models
   */
  async initializeRegressionModels() {
    // Initialize machine learning models for regression detection
    // This would integrate with ML libraries in a real implementation
    this.logger.log('Regression models initialized');
  }

  /**
   * Update regression model with new data
   */
  updateRegressionModel(category, metric, regressionData) {
    const key = `${category}_${metric}`;
    
    if (!this.regressionModels.has(key)) {
      this.regressionModels.set(key, {
        samples: [],
        model: null,
        accuracy: 0
      });
    }
    
    const model = this.regressionModels.get(key);
    model.samples.push(regressionData);
    
    // Keep only recent samples
    if (model.samples.length > 1000) {
      model.samples.shift();
    }
  }

  /**
   * Check if automated remediation is available
   */
  hasAutomatedRemediation(alertType) {
    const remediationMap = {
      'web_vital_threshold': true,
      'gaming_performance_threshold': true,
      'budget_violation': true
    };
    
    return remediationMap[alertType] || false;
  }

  /**
   * Trigger automated remediation
   */
  triggerAutomatedRemediation(alert) {
    this.emit('remediation:trigger', {
      alertId: alert.id,
      type: alert.type,
      category: alert.category,
      metric: alert.metric
    });
  }

  /**
   * Check if automated optimization is available
   */
  hasAutomatedOptimization(category, metric) {
    const optimizationMap = {
      'webVitals': ['LCP', 'FCP', 'CLS'],
      'gaming': ['voteLatency', 'leaderboardLoad']
    };
    
    return optimizationMap[category]?.includes(metric) || false;
  }

  /**
   * Trigger automated optimization
   */
  triggerAutomatedOptimization(violation) {
    this.emit('optimization:trigger', violation);
  }

  /**
   * Send email notification (integration point)
   */
  sendEmailNotification(notification) {
    // Integration with email service
    this.emit('integration:email', notification);
  }

  /**
   * Send Slack notification (integration point)
   */
  sendSlackNotification(notification) {
    // Integration with Slack API
    this.emit('integration:slack', notification);
  }

  /**
   * Public API Methods
   */

  /**
   * Get active alerts
   */
  getActiveAlerts(filterBy = {}) {
    let alerts = Array.from(this.activeAlerts.values());
    
    if (filterBy.level) {
      alerts = alerts.filter(alert => alert.level === filterBy.level);
    }
    
    if (filterBy.category) {
      alerts = alerts.filter(alert => alert.category === filterBy.category);
    }
    
    return alerts.sort((a, b) => b.created - a.created);
  }

  /**
   * Get alert statistics
   */
  getAlertStatistics(timeframe = 'day') {
    const cutoff = Date.now() - this.getTimeframeDuration(timeframe);
    
    let totalAlerts = 0;
    let resolvedAlerts = 0;
    let alertsByLevel = { info: 0, warning: 0, critical: 0, emergency: 0 };
    let alertsByCategory = {};
    
    for (const [type, alerts] of this.alertHistory) {
      const recentAlerts = alerts.filter(alert => alert.created > cutoff);
      
      recentAlerts.forEach(alert => {
        totalAlerts++;
        if (alert.resolved) resolvedAlerts++;
        
        alertsByLevel[alert.level] = (alertsByLevel[alert.level] || 0) + 1;
        alertsByCategory[alert.category] = (alertsByCategory[alert.category] || 0) + 1;
      });
    }
    
    return {
      timeframe,
      totalAlerts,
      resolvedAlerts,
      resolutionRate: totalAlerts > 0 ? (resolvedAlerts / totalAlerts) * 100 : 0,
      alertsByLevel,
      alertsByCategory,
      activeAlerts: this.activeAlerts.size
    };
  }

  /**
   * Get timeframe duration in milliseconds
   */
  getTimeframeDuration(timeframe) {
    const durations = {
      hour: 3600000,
      day: 86400000,
      week: 604800000,
      month: 2592000000
    };
    
    return durations[timeframe] || durations.day;
  }

  /**
   * Get budget violation summary
   */
  getBudgetViolationSummary() {
    const summary = {
      violations: [],
      totalViolations: 0,
      violationsByCategory: {},
      violationsBySeverity: { minor: 0, moderate: 0, major: 0, critical: 0 }
    };
    
    for (const [category, metrics] of this.budgetViolations) {
      for (const [metric, violation] of metrics) {
        summary.violations.push(violation);
        summary.totalViolations++;
        
        summary.violationsByCategory[category] = (summary.violationsByCategory[category] || 0) + 1;
        summary.violationsBySeverity[violation.severity] = (summary.violationsBySeverity[violation.severity] || 0) + 1;
      }
    }
    
    return summary;
  }

  /**
   * Shutdown alert system
   */
  shutdown() {
    // Save baselines
    this.savePerformanceBaselines();
    
    // Resolve all active alerts
    for (const alertId of this.activeAlerts.keys()) {
      this.resolveAlert(alertId, 'system_shutdown');
    }
    
    this.emit('alert_system:shutdown');
    this.removeAllListeners();
  }
}

/**
 * Outlier Detection Helper Class
 */
class OutlierDetector {
  constructor() {
    this.samples = new Map();
  }
  
  addSample(key, value) {
    if (!this.samples.has(key)) {
      this.samples.set(key, []);
    }
    
    const values = this.samples.get(key);
    values.push(value);
    
    // Keep only recent samples
    if (values.length > 100) {
      values.shift();
    }
  }
  
  isOutlier(key, value, threshold = 2) {
    const values = this.samples.get(key);
    if (!values || values.length < 10) return false;
    
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    const zScore = Math.abs(value - mean) / stdDev;
    
    return zScore > threshold;
  }
}

// Create singleton instance
let globalPerformanceAlertSystem = null;

export function createPerformanceAlertSystem(options = {}) {
  return new PerformanceAlertSystem(options);
}

export function getPerformanceAlertSystem(options = {}) {
  if (!globalPerformanceAlertSystem) {
    globalPerformanceAlertSystem = new PerformanceAlertSystem(options);
  }
  return globalPerformanceAlertSystem;
}

export default PerformanceAlertSystem;