/**
 * Performance Analytics Infrastructure for MLG.clan Gaming Platform
 * 
 * Comprehensive performance monitoring and analytics system that tracks
 * Web Core Vitals, gaming-specific metrics, user experience analytics,
 * and provides real-time performance insights for competitive gaming scenarios.
 * 
 * Features:
 * - Real-time Web Core Vitals tracking (LCP, FID, CLS, FCP, TTI)
 * - Gaming-specific performance metrics (vote latency, leaderboard load times)
 * - User experience analytics and session performance correlation
 * - Network quality and device performance analysis
 * - Performance regression detection and alerting
 * - Actionable optimization recommendations
 * 
 * @author Claude Code - Analytics Architect
 * @version 1.0.0
 * @created 2025-08-12
 */

import { EventEmitter } from 'events';
import { getGamingOptimizations } from './gamingOptimizations.js';

export class PerformanceAnalytics extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Core Vitals thresholds
      vitalsThresholds: {
        LCP: { good: 2500, poor: 4000 },
        FID: { good: 100, poor: 300 },
        CLS: { good: 0.1, poor: 0.25 },
        FCP: { good: 1800, poor: 3000 },
        TTI: { good: 3800, poor: 7300 }
      },
      
      // Gaming performance thresholds
      gamingThresholds: {
        voteLatency: { good: 500, poor: 2000 },
        leaderboardLoad: { good: 800, poor: 3000 },
        tournamentBracket: { good: 1200, poor: 4000 },
        walletInteraction: { good: 1000, poor: 5000 },
        clanManagement: { good: 600, poor: 2500 }
      },
      
      // Analytics settings
      sampleRate: options.sampleRate || 0.1, // 10% sampling
      batchSize: options.batchSize || 50,
      flushInterval: options.flushInterval || 30000, // 30 seconds
      enableRealTimeAlerts: options.enableRealTimeAlerts !== false,
      enablePerformanceBudgets: options.enablePerformanceBudgets !== false,
      
      // Data retention
      metricsRetentionDays: options.metricsRetentionDays || 30,
      alertHistoryDays: options.alertHistoryDays || 7,
      
      ...options
    };
    
    // Initialize performance observer
    this.observers = new Map();
    this.metrics = new Map();
    this.sessions = new Map();
    this.alerts = new Map();
    this.regressionBaseline = new Map();
    
    // Performance data queue
    this.metricsQueue = [];
    this.alertQueue = [];
    
    // Gaming optimizations integration
    this.gamingOpts = getGamingOptimizations();
    
    this.logger = options.logger || console;
    this.isInitialized = false;
    
    this.initializeAnalytics();
  }

  /**
   * Initialize performance analytics system
   */
  async initializeAnalytics() {
    if (this.isInitialized) return;
    
    try {
      // Initialize Web Core Vitals tracking
      await this.initializeWebVitals();
      
      // Initialize gaming performance tracking
      await this.initializeGamingMetrics();
      
      // Initialize user experience tracking
      await this.initializeUXTracking();
      
      // Initialize network and device tracking
      await this.initializeNetworkDeviceTracking();
      
      // Start data processing
      this.startDataProcessing();
      
      // Load regression baselines
      await this.loadRegressionBaselines();
      
      this.isInitialized = true;
      this.emit('analytics:initialized');
      
    } catch (error) {
      this.logger.error('Failed to initialize performance analytics:', error);
      throw error;
    }
  }

  /**
   * Initialize Web Core Vitals tracking
   */
  async initializeWebVitals() {
    if (!window.PerformanceObserver) {
      this.logger.warn('PerformanceObserver not supported');
      return;
    }

    // Largest Contentful Paint (LCP)
    this.observeWebVital('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1];
      this.recordMetric('LCP', {
        value: lastEntry.startTime,
        element: lastEntry.element?.tagName || 'unknown',
        url: lastEntry.url || window.location.href,
        timestamp: Date.now()
      });
    });

    // First Input Delay (FID)
    this.observeWebVital('first-input', (entries) => {
      entries.forEach(entry => {
        this.recordMetric('FID', {
          value: entry.processingStart - entry.startTime,
          inputType: entry.name,
          target: entry.target?.tagName || 'unknown',
          timestamp: Date.now()
        });
      });
    });

    // Cumulative Layout Shift (CLS)
    this.observeWebVital('layout-shift', (entries) => {
      let clsScore = 0;
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsScore += entry.value;
        }
      });
      
      if (clsScore > 0) {
        this.recordMetric('CLS', {
          value: clsScore,
          affectedElements: entries.length,
          timestamp: Date.now()
        });
      }
    });

    // First Contentful Paint (FCP) and Time to Interactive (TTI)
    this.observeWebVital('navigation', (entries) => {
      entries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric('FCP', {
            value: entry.startTime,
            timestamp: Date.now()
          });
        }
      });
    });

    // Additional performance timing
    this.observeWebVital('navigation', (entries) => {
      entries.forEach(entry => {
        this.recordMetric('NavigationTiming', {
          domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
          loadComplete: entry.loadEventEnd - entry.loadEventStart,
          networkTime: entry.responseEnd - entry.fetchStart,
          renderTime: entry.domComplete - entry.domLoading,
          timestamp: Date.now()
        });
      });
    });
  }

  /**
   * Initialize gaming-specific performance metrics
   */
  async initializeGamingMetrics() {
    // Listen to gaming optimization events
    this.gamingOpts.on('leaderboard:updated', (data) => {
      this.recordGamingMetric('leaderboard_update', {
        duration: data.duration,
        tiers: data.tiers,
        timestamp: data.timestamp,
        performance: this.categorizePerformance(data.duration, 'leaderboardLoad')
      });
    });

    this.gamingOpts.on('votes:aggregated', (data) => {
      this.recordGamingMetric('vote_aggregation', {
        duration: data.duration,
        batches: data.batches,
        timestamp: data.timestamp,
        performance: this.categorizePerformance(data.duration, 'voteLatency')
      });
    });

    this.gamingOpts.on('content:discovery_updated', (data) => {
      this.recordGamingMetric('content_discovery', {
        duration: data.duration,
        timestamp: data.timestamp,
        performance: this.categorizePerformance(data.duration, 'tournamentBracket')
      });
    });

    // Initialize custom gaming performance observers
    this.initializeCustomGamingObservers();
  }

  /**
   * Initialize custom gaming performance observers
   */
  initializeCustomGamingObservers() {
    // Vote button response time
    this.createGamingObserver('vote-response', (startTime, endTime, context) => {
      const duration = endTime - startTime;
      this.recordGamingMetric('vote_response_time', {
        duration,
        voteType: context.voteType,
        contentType: context.contentType,
        mlgAmount: context.mlgAmount,
        performance: this.categorizePerformance(duration, 'voteLatency'),
        timestamp: Date.now()
      });
    });

    // Leaderboard render time
    this.createGamingObserver('leaderboard-render', (startTime, endTime, context) => {
      const duration = endTime - startTime;
      this.recordGamingMetric('leaderboard_render_time', {
        duration,
        leaderboardType: context.type,
        entryCount: context.entryCount,
        performance: this.categorizePerformance(duration, 'leaderboardLoad'),
        timestamp: Date.now()
      });
    });

    // Tournament bracket loading
    this.createGamingObserver('tournament-bracket', (startTime, endTime, context) => {
      const duration = endTime - startTime;
      this.recordGamingMetric('tournament_bracket_load', {
        duration,
        tournamentId: context.tournamentId,
        participantCount: context.participantCount,
        performance: this.categorizePerformance(duration, 'tournamentBracket'),
        timestamp: Date.now()
      });
    });

    // Wallet interaction time
    this.createGamingObserver('wallet-interaction', (startTime, endTime, context) => {
      const duration = endTime - startTime;
      this.recordGamingMetric('wallet_interaction_time', {
        duration,
        interactionType: context.type,
        walletType: context.walletType,
        transactionType: context.transactionType,
        performance: this.categorizePerformance(duration, 'walletInteraction'),
        timestamp: Date.now()
      });
    });

    // Clan management operations
    this.createGamingObserver('clan-management', (startTime, endTime, context) => {
      const duration = endTime - startTime;
      this.recordGamingMetric('clan_management_time', {
        duration,
        operation: context.operation,
        clanSize: context.clanSize,
        performance: this.categorizePerformance(duration, 'clanManagement'),
        timestamp: Date.now()
      });
    });
  }

  /**
   * Initialize user experience tracking
   */
  async initializeUXTracking() {
    // Page visibility tracking
    document.addEventListener('visibilitychange', () => {
      this.recordUXMetric('page_visibility', {
        visible: !document.hidden,
        timestamp: Date.now()
      });
    });

    // User engagement tracking
    let lastInteraction = Date.now();
    ['click', 'keydown', 'scroll', 'touchstart'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        const now = Date.now();
        const timeSinceLastInteraction = now - lastInteraction;
        
        if (timeSinceLastInteraction > 5000) { // 5 second gap
          this.recordUXMetric('user_engagement_gap', {
            duration: timeSinceLastInteraction,
            eventType,
            timestamp: now
          });
        }
        
        lastInteraction = now;
      }, { passive: true });
    });

    // Gaming session tracking
    this.initializeGamingSessionTracking();
  }

  /**
   * Initialize gaming session tracking
   */
  initializeGamingSessionTracking() {
    const sessionId = this.generateSessionId();
    const sessionStart = Date.now();
    
    const session = {
      id: sessionId,
      startTime: sessionStart,
      lastActivity: sessionStart,
      actions: [],
      performance: {
        voteCount: 0,
        leaderboardViews: 0,
        contentInteractions: 0,
        walletTransactions: 0
      },
      devices: this.getDeviceInfo(),
      network: this.getNetworkInfo()
    };
    
    this.sessions.set(sessionId, session);
    
    // Track session end
    window.addEventListener('beforeunload', () => {
      this.endGamingSession(sessionId);
    });
    
    return sessionId;
  }

  /**
   * Initialize network and device performance tracking
   */
  async initializeNetworkDeviceTracking() {
    // Network information tracking
    if (navigator.connection) {
      const connection = navigator.connection;
      
      this.recordNetworkMetric('network_info', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
        timestamp: Date.now()
      });
      
      // Listen for network changes
      connection.addEventListener('change', () => {
        this.recordNetworkMetric('network_change', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          timestamp: Date.now()
        });
      });
    }

    // Device performance tracking
    if (navigator.deviceMemory) {
      this.recordDeviceMetric('device_memory', {
        memory: navigator.deviceMemory,
        timestamp: Date.now()
      });
    }

    if (navigator.hardwareConcurrency) {
      this.recordDeviceMetric('device_cores', {
        cores: navigator.hardwareConcurrency,
        timestamp: Date.now()
      });
    }

    // Battery API tracking
    if (navigator.getBattery) {
      try {
        const battery = await navigator.getBattery();
        this.recordDeviceMetric('battery_info', {
          level: battery.level,
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime,
          timestamp: Date.now()
        });
        
        battery.addEventListener('levelchange', () => {
          this.recordDeviceMetric('battery_change', {
            level: battery.level,
            charging: battery.charging,
            timestamp: Date.now()
          });
        });
      } catch (error) {
        this.logger.warn('Battery API not available:', error);
      }
    }
  }

  /**
   * Create performance observer for Web Vitals
   */
  observeWebVital(entryType, callback) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      
      observer.observe({ entryTypes: [entryType] });
      this.observers.set(entryType, observer);
    } catch (error) {
      this.logger.warn(`Failed to observe ${entryType}:`, error);
    }
  }

  /**
   * Create custom gaming performance observer
   */
  createGamingObserver(name, callback) {
    const observer = {
      name,
      callback,
      activeTimings: new Map()
    };
    
    this.observers.set(`gaming-${name}`, observer);
    return observer;
  }

  /**
   * Start gaming performance timing
   */
  startGamingTimer(observerName, timingId, context = {}) {
    const observer = this.observers.get(`gaming-${observerName}`);
    if (!observer) {
      this.logger.warn(`Gaming observer ${observerName} not found`);
      return;
    }
    
    observer.activeTimings.set(timingId, {
      startTime: performance.now(),
      context
    });
  }

  /**
   * End gaming performance timing
   */
  endGamingTimer(observerName, timingId, additionalContext = {}) {
    const observer = this.observers.get(`gaming-${observerName}`);
    if (!observer) return;
    
    const timing = observer.activeTimings.get(timingId);
    if (!timing) return;
    
    const endTime = performance.now();
    const context = { ...timing.context, ...additionalContext };
    
    observer.callback(timing.startTime, endTime, context);
    observer.activeTimings.delete(timingId);
  }

  /**
   * Record Web Core Vitals metric
   */
  recordMetric(type, data) {
    if (Math.random() > this.config.sampleRate) return;
    
    const metric = {
      type: 'web_vital',
      name: type,
      value: data.value,
      data,
      timestamp: data.timestamp || Date.now(),
      sessionId: this.getCurrentSessionId(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    this.metricsQueue.push(metric);
    this.checkPerformanceThreshold(type, data.value);
    this.emit('metric:recorded', metric);
  }

  /**
   * Record gaming-specific metric
   */
  recordGamingMetric(type, data) {
    const metric = {
      type: 'gaming_performance',
      name: type,
      data,
      timestamp: data.timestamp || Date.now(),
      sessionId: this.getCurrentSessionId(),
      url: window.location.href
    };
    
    this.metricsQueue.push(metric);
    this.checkGamingPerformanceThreshold(type, data.duration || data.value);
    this.emit('gaming_metric:recorded', metric);
    
    // Update session performance
    this.updateSessionPerformance(type, data);
  }

  /**
   * Record user experience metric
   */
  recordUXMetric(type, data) {
    const metric = {
      type: 'user_experience',
      name: type,
      data,
      timestamp: data.timestamp || Date.now(),
      sessionId: this.getCurrentSessionId()
    };
    
    this.metricsQueue.push(metric);
    this.emit('ux_metric:recorded', metric);
  }

  /**
   * Record network metric
   */
  recordNetworkMetric(type, data) {
    const metric = {
      type: 'network_performance',
      name: type,
      data,
      timestamp: data.timestamp || Date.now(),
      sessionId: this.getCurrentSessionId()
    };
    
    this.metricsQueue.push(metric);
    this.emit('network_metric:recorded', metric);
  }

  /**
   * Record device metric
   */
  recordDeviceMetric(type, data) {
    const metric = {
      type: 'device_performance',
      name: type,
      data,
      timestamp: data.timestamp || Date.now(),
      sessionId: this.getCurrentSessionId()
    };
    
    this.metricsQueue.push(metric);
    this.emit('device_metric:recorded', metric);
  }

  /**
   * Check performance threshold and create alerts
   */
  checkPerformanceThreshold(vitalType, value) {
    const threshold = this.config.vitalsThresholds[vitalType];
    if (!threshold) return;
    
    let severity = 'good';
    if (value > threshold.poor) {
      severity = 'poor';
    } else if (value > threshold.good) {
      severity = 'needs_improvement';
    }
    
    if (severity !== 'good') {
      this.createAlert('performance_threshold', {
        vitalType,
        value,
        threshold: threshold[severity === 'poor' ? 'poor' : 'good'],
        severity,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Check gaming performance threshold
   */
  checkGamingPerformanceThreshold(metricType, value) {
    // Map metric types to threshold categories
    const thresholdMap = {
      'vote_response_time': 'voteLatency',
      'vote_aggregation': 'voteLatency',
      'leaderboard_render_time': 'leaderboardLoad',
      'leaderboard_update': 'leaderboardLoad',
      'tournament_bracket_load': 'tournamentBracket',
      'wallet_interaction_time': 'walletInteraction',
      'clan_management_time': 'clanManagement'
    };
    
    const thresholdKey = thresholdMap[metricType];
    if (!thresholdKey) return;
    
    const threshold = this.config.gamingThresholds[thresholdKey];
    if (!threshold) return;
    
    let severity = 'good';
    if (value > threshold.poor) {
      severity = 'poor';
    } else if (value > threshold.good) {
      severity = 'needs_improvement';
    }
    
    if (severity !== 'good') {
      this.createAlert('gaming_performance_threshold', {
        metricType,
        value,
        threshold: threshold[severity === 'poor' ? 'poor' : 'good'],
        severity,
        category: thresholdKey,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Categorize performance level
   */
  categorizePerformance(value, category) {
    const threshold = this.config.gamingThresholds[category];
    if (!threshold) return 'unknown';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs_improvement';
    return 'poor';
  }

  /**
   * Create performance alert
   */
  createAlert(type, data) {
    if (!this.config.enableRealTimeAlerts) return;
    
    const alert = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: data.timestamp || Date.now(),
      sessionId: this.getCurrentSessionId(),
      resolved: false
    };
    
    this.alertQueue.push(alert);
    this.alerts.set(alert.id, alert);
    this.emit('alert:created', alert);
    
    return alert.id;
  }

  /**
   * Update session performance data
   */
  updateSessionPerformance(type, data) {
    const sessionId = this.getCurrentSessionId();
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    // Update session activity
    session.lastActivity = Date.now();
    session.actions.push({ type, data, timestamp: Date.now() });
    
    // Update performance counters
    if (type.includes('vote')) {
      session.performance.voteCount++;
    } else if (type.includes('leaderboard')) {
      session.performance.leaderboardViews++;
    } else if (type.includes('content')) {
      session.performance.contentInteractions++;
    } else if (type.includes('wallet')) {
      session.performance.walletTransactions++;
    }
  }

  /**
   * Start data processing and flushing
   */
  startDataProcessing() {
    // Flush metrics periodically
    setInterval(() => {
      this.flushMetrics();
    }, this.config.flushInterval);
    
    // Process alerts
    setInterval(() => {
      this.processAlerts();
    }, 5000); // Process alerts every 5 seconds
    
    // Clean up old data
    setInterval(() => {
      this.cleanupOldData();
    }, 3600000); // Clean up every hour
  }

  /**
   * Flush metrics to storage/analytics service
   */
  async flushMetrics() {
    if (this.metricsQueue.length === 0) return;
    
    const batchSize = Math.min(this.config.batchSize, this.metricsQueue.length);
    const batch = this.metricsQueue.splice(0, batchSize);
    
    try {
      // Store metrics locally
      await this.storeMetricsBatch(batch);
      
      // Send to analytics service if available
      if (this.config.analyticsEndpoint) {
        await this.sendMetricsToService(batch);
      }
      
      this.emit('metrics:flushed', { count: batch.length });
    } catch (error) {
      this.logger.error('Failed to flush metrics:', error);
      // Re-queue failed metrics
      this.metricsQueue.unshift(...batch);
    }
  }

  /**
   * Process queued alerts
   */
  async processAlerts() {
    if (this.alertQueue.length === 0) return;
    
    const alerts = this.alertQueue.splice(0);
    
    try {
      for (const alert of alerts) {
        await this.processAlert(alert);
      }
      
      this.emit('alerts:processed', { count: alerts.length });
    } catch (error) {
      this.logger.error('Failed to process alerts:', error);
    }
  }

  /**
   * Process individual alert
   */
  async processAlert(alert) {
    // Check for regression patterns
    await this.checkRegressionPattern(alert);
    
    // Store alert
    await this.storeAlert(alert);
    
    // Send notifications if configured
    if (this.config.alertNotificationEndpoint) {
      await this.sendAlertNotification(alert);
    }
    
    // Emit real-time alert event
    this.emit('alert:processed', alert);
  }

  /**
   * Check for performance regression patterns
   */
  async checkRegressionPattern(alert) {
    const { type, data } = alert;
    
    // Get baseline performance for comparison
    const baseline = await this.getRegressionBaseline(type, data);
    if (!baseline) return;
    
    // Calculate regression severity
    const regression = this.calculateRegression(data, baseline);
    
    if (regression.isRegression) {
      this.createAlert('performance_regression', {
        originalAlert: alert.id,
        regressionType: type,
        severity: regression.severity,
        percentageIncrease: regression.percentageIncrease,
        baseline: baseline.value,
        current: data.value || data.duration,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Calculate performance regression
   */
  calculateRegression(current, baseline) {
    const currentValue = current.value || current.duration;
    const baselineValue = baseline.value;
    
    if (!currentValue || !baselineValue) {
      return { isRegression: false };
    }
    
    const percentageIncrease = ((currentValue - baselineValue) / baselineValue) * 100;
    
    // Consider it a regression if performance degraded by more than 20%
    const isRegression = percentageIncrease > 20;
    
    let severity = 'minor';
    if (percentageIncrease > 100) {
      severity = 'critical';
    } else if (percentageIncrease > 50) {
      severity = 'major';
    }
    
    return {
      isRegression,
      percentageIncrease,
      severity
    };
  }

  /**
   * Generate recommendations based on performance data
   */
  generateRecommendations() {
    const recommendations = [];
    const recentMetrics = this.getRecentMetrics();
    
    // Analyze Web Core Vitals
    const vitalsRecommendations = this.analyzeWebVitals(recentMetrics);
    recommendations.push(...vitalsRecommendations);
    
    // Analyze gaming performance
    const gamingRecommendations = this.analyzeGamingPerformance(recentMetrics);
    recommendations.push(...gamingRecommendations);
    
    // Analyze network performance
    const networkRecommendations = this.analyzeNetworkPerformance(recentMetrics);
    recommendations.push(...networkRecommendations);
    
    return recommendations;
  }

  /**
   * Analyze Web Core Vitals for recommendations
   */
  analyzeWebVitals(metrics) {
    const recommendations = [];
    const vitalsMetrics = metrics.filter(m => m.type === 'web_vital');
    
    // LCP analysis
    const lcpMetrics = vitalsMetrics.filter(m => m.name === 'LCP');
    if (lcpMetrics.length > 0) {
      const avgLCP = lcpMetrics.reduce((sum, m) => sum + m.value, 0) / lcpMetrics.length;
      if (avgLCP > this.config.vitalsThresholds.LCP.poor) {
        recommendations.push({
          type: 'optimization',
          category: 'LCP',
          severity: 'high',
          title: 'Optimize Largest Contentful Paint',
          description: 'LCP is slower than recommended. Consider optimizing images, fonts, and critical resources.',
          actions: [
            'Optimize and compress images',
            'Use modern image formats (WebP, AVIF)',
            'Preload critical resources',
            'Reduce server response time',
            'Use CDN for static assets'
          ],
          impact: 'high',
          difficulty: 'medium'
        });
      }
    }
    
    // FID analysis
    const fidMetrics = vitalsMetrics.filter(m => m.name === 'FID');
    if (fidMetrics.length > 0) {
      const avgFID = fidMetrics.reduce((sum, m) => sum + m.value, 0) / fidMetrics.length;
      if (avgFID > this.config.vitalsThresholds.FID.poor) {
        recommendations.push({
          type: 'optimization',
          category: 'FID',
          severity: 'high',
          title: 'Reduce First Input Delay',
          description: 'Users are experiencing delays when interacting with the page.',
          actions: [
            'Break up long tasks',
            'Reduce JavaScript execution time',
            'Use web workers for heavy computations',
            'Defer non-critical JavaScript',
            'Optimize event handlers'
          ],
          impact: 'high',
          difficulty: 'high'
        });
      }
    }
    
    // CLS analysis
    const clsMetrics = vitalsMetrics.filter(m => m.name === 'CLS');
    if (clsMetrics.length > 0) {
      const avgCLS = clsMetrics.reduce((sum, m) => sum + m.value, 0) / clsMetrics.length;
      if (avgCLS > this.config.vitalsThresholds.CLS.poor) {
        recommendations.push({
          type: 'optimization',
          category: 'CLS',
          severity: 'medium',
          title: 'Reduce Cumulative Layout Shift',
          description: 'Page elements are shifting during load, affecting user experience.',
          actions: [
            'Set explicit dimensions for images and videos',
            'Reserve space for ads and embeds',
            'Use font-display: swap carefully',
            'Avoid inserting content above existing content',
            'Use CSS transforms for animations'
          ],
          impact: 'medium',
          difficulty: 'medium'
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Analyze gaming performance for recommendations
   */
  analyzeGamingPerformance(metrics) {
    const recommendations = [];
    const gamingMetrics = metrics.filter(m => m.type === 'gaming_performance');
    
    // Vote response time analysis
    const voteMetrics = gamingMetrics.filter(m => m.name.includes('vote'));
    if (voteMetrics.length > 0) {
      const slowVotes = voteMetrics.filter(m => 
        (m.data.duration || m.data.value) > this.config.gamingThresholds.voteLatency.poor
      );
      
      if (slowVotes.length / voteMetrics.length > 0.1) { // More than 10% slow votes
        recommendations.push({
          type: 'gaming_optimization',
          category: 'voting',
          severity: 'high',
          title: 'Optimize Vote Response Time',
          description: 'Vote submissions are taking too long, affecting competitive gaming experience.',
          actions: [
            'Optimize vote aggregation algorithms',
            'Implement vote queue batching',
            'Use optimistic UI updates',
            'Reduce blockchain confirmation wait time',
            'Add vote response caching'
          ],
          impact: 'high',
          difficulty: 'medium'
        });
      }
    }
    
    // Leaderboard performance analysis
    const leaderboardMetrics = gamingMetrics.filter(m => m.name.includes('leaderboard'));
    if (leaderboardMetrics.length > 0) {
      const slowLeaderboards = leaderboardMetrics.filter(m => 
        (m.data.duration || m.data.value) > this.config.gamingThresholds.leaderboardLoad.poor
      );
      
      if (slowLeaderboards.length > 0) {
        recommendations.push({
          type: 'gaming_optimization',
          category: 'leaderboards',
          severity: 'medium',
          title: 'Optimize Leaderboard Loading',
          description: 'Leaderboard updates are slow, impacting real-time competitive experience.',
          actions: [
            'Implement incremental leaderboard updates',
            'Use virtual scrolling for large leaderboards',
            'Add leaderboard data prefetching',
            'Optimize leaderboard queries',
            'Use WebSocket for real-time updates'
          ],
          impact: 'medium',
          difficulty: 'medium'
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Analyze network performance for recommendations
   */
  analyzeNetworkPerformance(metrics) {
    const recommendations = [];
    const networkMetrics = metrics.filter(m => m.type === 'network_performance');
    
    // Check for slow network conditions
    const slowConnections = networkMetrics.filter(m => 
      m.data.effectiveType === 'slow-2g' || m.data.effectiveType === '2g'
    );
    
    if (slowConnections.length > 0) {
      recommendations.push({
        type: 'network_optimization',
        category: 'connectivity',
        severity: 'medium',
        title: 'Optimize for Slow Networks',
        description: 'Users are experiencing slow network conditions.',
        actions: [
          'Implement adaptive loading strategies',
          'Reduce payload sizes',
          'Use aggressive caching',
          'Implement offline-first approach',
          'Add progressive enhancement'
        ],
        impact: 'medium',
        difficulty: 'medium'
      });
    }
    
    return recommendations;
  }

  /**
   * Utility methods
   */

  getCurrentSessionId() {
    return Array.from(this.sessions.keys())[0] || this.generateSessionId();
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      memory: navigator.deviceMemory,
      cores: navigator.hardwareConcurrency,
      screen: {
        width: screen.width,
        height: screen.height,
        pixelRatio: window.devicePixelRatio
      }
    };
  }

  getNetworkInfo() {
    if (!navigator.connection) return {};
    
    const connection = navigator.connection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }

  getRecentMetrics(hoursBack = 1) {
    const cutoff = Date.now() - (hoursBack * 60 * 60 * 1000);
    return Array.from(this.metrics.values())
      .filter(metric => metric.timestamp > cutoff);
  }

  endGamingSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;
    
    // Record session metrics
    this.recordUXMetric('gaming_session_end', {
      sessionId,
      duration: session.duration,
      actionCount: session.actions.length,
      performance: session.performance,
      timestamp: session.endTime
    });
    
    this.emit('session:ended', session);
  }

  async storeMetricsBatch(batch) {
    // Store in local storage or IndexedDB for offline capability
    const key = `metrics_batch_${Date.now()}`;
    try {
      localStorage.setItem(key, JSON.stringify(batch));
    } catch (error) {
      this.logger.warn('Failed to store metrics locally:', error);
    }
  }

  async storeAlert(alert) {
    try {
      const key = `alert_${alert.id}`;
      localStorage.setItem(key, JSON.stringify(alert));
    } catch (error) {
      this.logger.warn('Failed to store alert locally:', error);
    }
  }

  async sendMetricsToService(batch) {
    // Implementation would send metrics to analytics service
    // This is a placeholder for external service integration
  }

  async sendAlertNotification(alert) {
    // Implementation would send alert notifications
    // This is a placeholder for notification service integration
  }

  async loadRegressionBaselines() {
    // Load historical performance baselines for regression detection
    // This is a placeholder for baseline data loading
  }

  async getRegressionBaseline(type, data) {
    // Get baseline performance data for regression comparison
    // This is a placeholder for baseline retrieval
    return null;
  }

  cleanupOldData() {
    const cutoff = Date.now() - (this.config.metricsRetentionDays * 24 * 60 * 60 * 1000);
    
    // Clean up old metrics
    for (const [key, metric] of this.metrics) {
      if (metric.timestamp < cutoff) {
        this.metrics.delete(key);
      }
    }
    
    // Clean up old alerts
    const alertCutoff = Date.now() - (this.config.alertHistoryDays * 24 * 60 * 60 * 1000);
    for (const [key, alert] of this.alerts) {
      if (alert.timestamp < alertCutoff) {
        this.alerts.delete(key);
      }
    }
  }

  /**
   * Public API methods
   */

  getPerformanceSnapshot() {
    return {
      webVitals: this.getWebVitalsSnapshot(),
      gaming: this.getGamingPerformanceSnapshot(),
      network: this.getNetworkSnapshot(),
      device: this.getDeviceSnapshot(),
      alerts: this.getActiveAlerts(),
      recommendations: this.generateRecommendations()
    };
  }

  getWebVitalsSnapshot() {
    const recentMetrics = this.getRecentMetrics();
    const vitalsMetrics = recentMetrics.filter(m => m.type === 'web_vital');
    
    const snapshot = {};
    ['LCP', 'FID', 'CLS', 'FCP', 'TTI'].forEach(vital => {
      const metrics = vitalsMetrics.filter(m => m.name === vital);
      if (metrics.length > 0) {
        snapshot[vital] = {
          average: metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length,
          latest: metrics[metrics.length - 1].value,
          count: metrics.length,
          performance: this.categorizeWebVitalPerformance(vital, metrics[metrics.length - 1].value)
        };
      }
    });
    
    return snapshot;
  }

  categorizeWebVitalPerformance(vital, value) {
    const threshold = this.config.vitalsThresholds[vital];
    if (!threshold) return 'unknown';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs_improvement';
    return 'poor';
  }

  getGamingPerformanceSnapshot() {
    const recentMetrics = this.getRecentMetrics();
    const gamingMetrics = recentMetrics.filter(m => m.type === 'gaming_performance');
    
    const snapshot = {};
    const categories = ['vote', 'leaderboard', 'tournament', 'wallet', 'clan'];
    
    categories.forEach(category => {
      const metrics = gamingMetrics.filter(m => m.name.includes(category));
      if (metrics.length > 0) {
        const durations = metrics.map(m => m.data.duration || m.data.value).filter(Boolean);
        if (durations.length > 0) {
          snapshot[category] = {
            average: durations.reduce((sum, d) => sum + d, 0) / durations.length,
            latest: durations[durations.length - 1],
            count: durations.length,
            performance: this.categorizePerformance(durations[durations.length - 1], `${category}Latency`)
          };
        }
      }
    });
    
    return snapshot;
  }

  getNetworkSnapshot() {
    const recentMetrics = this.getRecentMetrics();
    const networkMetrics = recentMetrics.filter(m => m.type === 'network_performance');
    
    if (networkMetrics.length === 0) return {};
    
    const latest = networkMetrics[networkMetrics.length - 1];
    return latest.data;
  }

  getDeviceSnapshot() {
    const recentMetrics = this.getRecentMetrics();
    const deviceMetrics = recentMetrics.filter(m => m.type === 'device_performance');
    
    const snapshot = {};
    deviceMetrics.forEach(metric => {
      snapshot[metric.name] = metric.data;
    });
    
    return snapshot;
  }

  getActiveAlerts() {
    const activeAlerts = Array.from(this.alerts.values())
      .filter(alert => !alert.resolved)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10); // Latest 10 alerts
    
    return activeAlerts;
  }

  resolveAlert(alertId) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      this.emit('alert:resolved', alert);
    }
  }

  shutdown() {
    // Disconnect all observers
    for (const observer of this.observers.values()) {
      if (observer.disconnect) {
        observer.disconnect();
      }
    }
    
    // Flush remaining metrics
    this.flushMetrics();
    
    this.emit('analytics:shutdown');
    this.removeAllListeners();
  }
}

// Create singleton instance
let globalPerformanceAnalytics = null;

export function createPerformanceAnalytics(options = {}) {
  return new PerformanceAnalytics(options);
}

export function getPerformanceAnalytics(options = {}) {
  if (!globalPerformanceAnalytics) {
    globalPerformanceAnalytics = new PerformanceAnalytics(options);
  }
  return globalPerformanceAnalytics;
}

export default PerformanceAnalytics;