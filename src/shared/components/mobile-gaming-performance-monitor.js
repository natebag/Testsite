/**
 * MLG.clan Mobile Gaming Performance Monitor
 * 
 * Advanced real-time performance monitoring and analytics system for gaming:
 * - Real-time FPS, memory, and battery monitoring
 * - Gaming context-aware performance tracking
 * - Predictive performance analysis and alerts
 * - User experience quality scoring
 * - Performance regression detection
 * - Gaming session optimization recommendations
 * - Comprehensive analytics dashboard
 * 
 * Key Metrics:
 * 🎯 Gaming Performance Score (GPS)
 * ⚡ Frame Rate Consistency
 * 🧠 Memory Efficiency
 * 🔋 Battery Consumption Rate
 * 📶 Network Performance
 * 👆 Input Responsiveness
 * 🎮 Gaming Experience Quality
 * 
 * @author Claude Code - Security and Performance Auditor
 * @version 1.0.0
 */

/**
 * Gaming Performance Monitoring Configuration
 */
const GAMING_MONITOR_CONFIG = {
  // Monitoring Intervals (ms)
  intervals: {
    fps: 1000,              // Check FPS every second
    memory: 5000,           // Check memory every 5 seconds
    battery: 30000,         // Check battery every 30 seconds
    network: 10000,         // Check network every 10 seconds
    input: 100,             // Check input latency every 100ms
    thermal: 15000,         // Check thermal every 15 seconds
    overall: 2000,          // Update overall score every 2 seconds
    analytics: 60000        // Update analytics every minute
  },

  // Performance Thresholds by Gaming Context
  thresholds: {
    tournament: {
      fps: { excellent: 58, good: 50, acceptable: 45, poor: 35 },
      memory: { excellent: 30, good: 50, acceptable: 70, poor: 85 },
      battery: { excellent: 5, good: 10, acceptable: 15, poor: 25 },
      latency: { excellent: 16, good: 25, acceptable: 50, poor: 100 },
      thermal: { excellent: 30, good: 35, acceptable: 40, poor: 45 }
    },
    clan: {
      fps: { excellent: 45, good: 35, acceptable: 30, poor: 20 },
      memory: { excellent: 40, good: 60, acceptable: 75, poor: 90 },
      battery: { excellent: 8, good: 15, acceptable: 20, poor: 30 },
      latency: { excellent: 25, good: 40, acceptable: 75, poor: 150 },
      thermal: { excellent: 32, good: 38, acceptable: 42, poor: 47 }
    },
    voting: {
      fps: { excellent: 45, good: 35, acceptable: 25, poor: 20 },
      memory: { excellent: 35, good: 55, acceptable: 70, poor: 85 },
      battery: { excellent: 6, good: 12, acceptable: 18, poor: 25 },
      latency: { excellent: 20, good: 35, acceptable: 60, poor: 120 },
      thermal: { excellent: 31, good: 37, acceptable: 41, poor: 46 }
    },
    profile: {
      fps: { excellent: 30, good: 25, acceptable: 20, poor: 15 },
      memory: { excellent: 25, good: 40, acceptable: 60, poor: 80 },
      battery: { excellent: 3, good: 6, acceptable: 10, poor: 15 },
      latency: { excellent: 50, good: 75, acceptable: 100, poor: 200 },
      thermal: { excellent: 28, good: 33, acceptable: 38, poor: 43 }
    },
    social: {
      fps: { excellent: 45, good: 35, acceptable: 25, poor: 20 },
      memory: { excellent: 35, good: 55, acceptable: 70, poor: 85 },
      battery: { excellent: 7, good: 13, acceptable: 18, poor: 25 },
      latency: { excellent: 30, good: 50, acceptable: 80, poor: 150 },
      thermal: { excellent: 30, good: 36, acceptable: 40, poor: 45 }
    }
  },

  // Gaming Performance Score Weights
  scoreWeights: {
    fps: 0.25,              // 25% - Frame rate consistency
    memory: 0.20,           // 20% - Memory efficiency
    battery: 0.15,          // 15% - Battery consumption
    latency: 0.20,          // 20% - Input responsiveness
    network: 0.10,          // 10% - Network performance
    thermal: 0.10           // 10% - Thermal management
  },

  // Alert Thresholds
  alerts: {
    performanceDrop: 0.3,   // 30% performance drop
    memorySpike: 2.0,       // 2x memory increase
    batteryDrain: 0.25,     // 25% battery drain per hour
    thermalLimit: 42,       // 42°C thermal threshold
    latencySpike: 3.0,      // 3x latency increase
    fpsDropFrames: 10       // 10 consecutive dropped frames
  },

  // Data Collection Settings
  dataCollection: {
    maxHistoryPoints: 1000, // Maximum data points to keep
    aggregationWindow: 60,  // Aggregate data every 60 seconds
    anomalyDetection: true, // Enable anomaly detection
    predictiveAnalysis: true, // Enable predictive analysis
    sessionTracking: true   // Track gaming sessions
  },

  // Analytics Categories
  analyticsCategories: {
    performance: ['fps', 'memory', 'battery', 'latency', 'thermal'],
    user: ['session_length', 'context_switches', 'interactions'],
    system: ['device_info', 'network_type', 'optimization_level'],
    gaming: ['context_performance', 'feature_usage', 'satisfaction']
  }
};

/**
 * Mobile Gaming Performance Monitor Class
 */
export class MobileGamingPerformanceMonitor {
  constructor(options = {}) {
    this.options = {
      enableRealTimeMonitoring: true,
      enablePredictiveAnalysis: true,
      enableAnomalyDetection: true,
      enablePerformanceAlerts: true,
      enableSessionTracking: true,
      enableAnalyticsDashboard: true,
      enableDataExport: true,
      debugMode: false,
      ...options
    };

    // Current monitoring state
    this.state = {
      isMonitoring: false,
      currentContext: 'general',
      sessionId: this.generateSessionId(),
      sessionStart: Date.now(),
      monitoringPaused: false,
      alertsEnabled: true
    };

    // Real-time metrics
    this.metrics = {
      fps: {
        current: 60,
        average: 60,
        min: 60,
        max: 60,
        drops: 0,
        consistency: 1.0
      },
      memory: {
        current: 0,
        peak: 0,
        average: 0,
        pressure: false,
        leaks: 0
      },
      battery: {
        level: 1.0,
        drainRate: 0,
        estimatedTime: Infinity,
        isCharging: false,
        consumption: 0
      },
      network: {
        type: '4g',
        latency: 0,
        bandwidth: 0,
        quality: 1.0,
        errors: 0
      },
      input: {
        latency: 0,
        responsiveness: 1.0,
        interactions: 0,
        satisfaction: 1.0
      },
      thermal: {
        temperature: 25,
        throttling: false,
        events: 0
      }
    };

    // Performance history
    this.history = {
      fps: [],
      memory: [],
      battery: [],
      network: [],
      input: [],
      thermal: [],
      scores: []
    };

    // Gaming Performance Score components
    this.gps = {
      overall: 1.0,
      components: {
        fps: 1.0,
        memory: 1.0,
        battery: 1.0,
        latency: 1.0,
        network: 1.0,
        thermal: 1.0
      },
      trend: 'stable',
      prediction: 1.0
    };

    // Analytics and insights
    this.analytics = {
      sessionsTracked: 0,
      totalMonitoringTime: 0,
      performanceAlerts: 0,
      optimizationsSuggested: 0,
      userSatisfactionScore: 0,
      contextPerformance: new Map(),
      devicePerformance: {},
      trends: {
        performance: 'stable',
        battery: 'stable',
        memory: 'stable'
      }
    };

    // Performance alerts
    this.alerts = {
      active: [],
      history: [],
      suppressedUntil: {},
      handlers: new Map()
    };

    // Monitoring timers
    this.timers = new Map();

    // Event listeners
    this.eventListeners = new Map();

    this.init();
  }

  /**
   * Initialize the gaming performance monitor
   */
  async init() {
    console.log('📊 Initializing MLG Gaming Performance Monitor...');

    try {
      // Initialize device monitoring
      await this.initializeDeviceMonitoring();

      // Setup performance tracking
      this.setupPerformanceTracking();

      // Initialize analytics
      this.initializeAnalytics();

      // Setup event listeners
      this.setupEventListeners();

      // Start monitoring if enabled
      if (this.options.enableRealTimeMonitoring) {
        this.startMonitoring();
      }

      console.log('✅ Gaming Performance Monitor initialized', {
        sessionId: this.state.sessionId,
        monitoring: this.state.isMonitoring,
        context: this.state.currentContext
      });

    } catch (error) {
      console.error('❌ Failed to initialize Performance Monitor:', error);
    }
  }

  /**
   * Initialize device-specific monitoring
   */
  async initializeDeviceMonitoring() {
    // Initialize FPS monitoring
    this.initializeFPSMonitoring();

    // Initialize memory monitoring
    if ('memory' in performance) {
      this.initializeMemoryMonitoring();
    }

    // Initialize battery monitoring
    if ('getBattery' in navigator) {
      await this.initializeBatteryMonitoring();
    }

    // Initialize network monitoring
    if ('connection' in navigator) {
      this.initializeNetworkMonitoring();
    }

    // Initialize input monitoring
    this.initializeInputMonitoring();

    // Initialize thermal monitoring (simulated)
    this.initializeThermalMonitoring();
  }

  /**
   * Initialize FPS monitoring
   */
  initializeFPSMonitoring() {
    let frameCount = 0;
    let lastTime = performance.now();
    let lastSecond = Math.floor(lastTime / 1000);
    let droppedFrames = 0;
    let frameTimeHistory = [];

    const measureFrame = (currentTime) => {
      frameCount++;
      const frameTime = currentTime - lastTime;
      frameTimeHistory.push(frameTime);

      // Keep only recent frame times
      if (frameTimeHistory.length > 60) {
        frameTimeHistory.shift();
      }

      // Detect dropped frames
      if (frameTime > 33.33) { // > 30fps threshold
        droppedFrames++;
      }

      const currentSecond = Math.floor(currentTime / 1000);
      if (currentSecond !== lastSecond) {
        // Update FPS metrics
        this.updateFPSMetrics(frameCount, droppedFrames, frameTimeHistory);
        
        frameCount = 0;
        droppedFrames = 0;
        lastSecond = currentSecond;
      }

      lastTime = currentTime;

      if (this.state.isMonitoring) {
        requestAnimationFrame(measureFrame);
      }
    };

    this.fpsMonitor = measureFrame;
  }

  /**
   * Initialize memory monitoring
   */
  initializeMemoryMonitoring() {
    this.memoryBaseline = performance.memory.usedJSHeapSize;
    
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = performance.memory;
        const currentUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
        const heapLimit = memory.jsHeapSizeLimit / 1024 / 1024; // MB
        const pressure = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) > 0.8;

        this.updateMemoryMetrics(currentUsage, heapLimit, pressure);
      }
    };

    this.timers.set('memory', setInterval(checkMemory, GAMING_MONITOR_CONFIG.intervals.memory));
  }

  /**
   * Initialize battery monitoring
   */
  async initializeBatteryMonitoring() {
    try {
      this.battery = await navigator.getBattery();
      
      const updateBattery = () => {
        this.updateBatteryMetrics(
          this.battery.level,
          this.battery.charging,
          this.battery.dischargingTime
        );
      };

      // Setup battery event listeners
      this.battery.addEventListener('levelchange', updateBattery);
      this.battery.addEventListener('chargingchange', updateBattery);
      
      // Initial update
      updateBattery();

      this.timers.set('battery', setInterval(updateBattery, GAMING_MONITOR_CONFIG.intervals.battery));

    } catch (error) {
      console.warn('Battery API not available:', error);
      this.simulateBatteryMonitoring();
    }
  }

  /**
   * Initialize input monitoring
   */
  initializeInputMonitoring() {
    let interactionStart = 0;
    let totalInteractions = 0;
    let responsivenessSamples = [];

    const startInteraction = () => {
      interactionStart = performance.now();
    };

    const endInteraction = () => {
      if (interactionStart) {
        const latency = performance.now() - interactionStart;
        responsivenessSamples.push(latency);
        totalInteractions++;
        
        // Keep only recent samples
        if (responsivenessSamples.length > 50) {
          responsivenessSamples.shift();
        }

        this.updateInputMetrics(latency, responsivenessSamples, totalInteractions);
        interactionStart = 0;
      }
    };

    // Add event listeners
    document.addEventListener('touchstart', startInteraction, { passive: true });
    document.addEventListener('mousedown', startInteraction);
    document.addEventListener('touchend', endInteraction, { passive: true });
    document.addEventListener('mouseup', endInteraction);
    document.addEventListener('click', endInteraction);

    this.timers.set('input', setInterval(() => {
      this.analyzeInputPerformance(responsivenessSamples);
    }, GAMING_MONITOR_CONFIG.intervals.input));
  }

  /**
   * Start real-time monitoring
   */
  startMonitoring() {
    if (this.state.isMonitoring) return;

    console.log('📊 Starting real-time gaming performance monitoring...');
    
    this.state.isMonitoring = true;
    this.state.sessionStart = Date.now();

    // Start FPS monitoring
    requestAnimationFrame(this.fpsMonitor);

    // Start overall performance scoring
    this.timers.set('overall', setInterval(() => {
      this.updateOverallPerformanceScore();
    }, GAMING_MONITOR_CONFIG.intervals.overall));

    // Start analytics updates
    this.timers.set('analytics', setInterval(() => {
      this.updateAnalytics();
    }, GAMING_MONITOR_CONFIG.intervals.analytics));

    // Start predictive analysis
    if (this.options.enablePredictiveAnalysis) {
      this.startPredictiveAnalysis();
    }

    this.dispatchEvent('monitoring-started', {
      sessionId: this.state.sessionId,
      context: this.state.currentContext
    });
  }

  /**
   * Update FPS metrics
   */
  updateFPSMetrics(frameCount, droppedFrames, frameTimeHistory) {
    this.metrics.fps.current = frameCount;
    this.metrics.fps.drops += droppedFrames;

    // Update average
    this.history.fps.push({
      timestamp: Date.now(),
      fps: frameCount,
      drops: droppedFrames
    });

    // Calculate consistency
    if (frameTimeHistory.length > 10) {
      const avgFrameTime = frameTimeHistory.reduce((a, b) => a + b) / frameTimeHistory.length;
      const variance = frameTimeHistory.reduce((sum, time) => sum + Math.pow(time - avgFrameTime, 2), 0) / frameTimeHistory.length;
      this.metrics.fps.consistency = Math.max(0, 1 - (variance / 100));
    }

    this.updateFPSScore();
  }

  /**
   * Update memory metrics
   */
  updateMemoryMetrics(currentUsage, heapLimit, pressure) {
    this.metrics.memory.current = currentUsage;
    this.metrics.memory.peak = Math.max(this.metrics.memory.peak, currentUsage);
    this.metrics.memory.pressure = pressure;

    // Calculate average
    this.history.memory.push({
      timestamp: Date.now(),
      usage: currentUsage,
      pressure: pressure
    });

    // Detect memory leaks
    if (this.detectMemoryLeak()) {
      this.metrics.memory.leaks++;
      this.triggerAlert('memory-leak', {
        currentUsage,
        baseline: this.memoryBaseline / 1024 / 1024
      });
    }

    this.updateMemoryScore();
  }

  /**
   * Update battery metrics
   */
  updateBatteryMetrics(level, charging, dischargingTime) {
    const previousLevel = this.metrics.battery.level;
    this.metrics.battery.level = level;
    this.metrics.battery.isCharging = charging;

    if (!charging && previousLevel) {
      // Calculate drain rate (%/hour)
      const timeDelta = Date.now() - (this.history.battery[this.history.battery.length - 1]?.timestamp || Date.now());
      const levelDelta = previousLevel - level;
      
      if (timeDelta > 0 && levelDelta > 0) {
        this.metrics.battery.drainRate = (levelDelta / (timeDelta / 3600000)) * 100;
        this.metrics.battery.estimatedTime = (level / this.metrics.battery.drainRate) * 60; // minutes
      }
    }

    this.history.battery.push({
      timestamp: Date.now(),
      level: level,
      charging: charging,
      drainRate: this.metrics.battery.drainRate
    });

    this.updateBatteryScore();
  }

  /**
   * Update input metrics
   */
  updateInputMetrics(latency, samples, totalInteractions) {
    this.metrics.input.latency = latency;
    this.metrics.input.interactions = totalInteractions;

    if (samples.length > 0) {
      const avgLatency = samples.reduce((a, b) => a + b) / samples.length;
      const responsiveness = Math.max(0, 1 - (avgLatency / 200)); // 200ms = 0 responsiveness
      this.metrics.input.responsiveness = responsiveness;
    }

    this.history.input.push({
      timestamp: Date.now(),
      latency: latency,
      responsiveness: this.metrics.input.responsiveness
    });

    this.updateInputScore();
  }

  /**
   * Update overall performance score
   */
  updateOverallPerformanceScore() {
    const weights = GAMING_MONITOR_CONFIG.scoreWeights;
    
    // Calculate component scores
    this.gps.components.fps = this.calculateFPSScore();
    this.gps.components.memory = this.calculateMemoryScore();
    this.gps.components.battery = this.calculateBatteryScore();
    this.gps.components.latency = this.calculateLatencyScore();
    this.gps.components.network = this.calculateNetworkScore();
    this.gps.components.thermal = this.calculateThermalScore();

    // Calculate weighted overall score
    this.gps.overall = (
      this.gps.components.fps * weights.fps +
      this.gps.components.memory * weights.memory +
      this.gps.components.battery * weights.battery +
      this.gps.components.latency * weights.latency +
      this.gps.components.network * weights.network +
      this.gps.components.thermal * weights.thermal
    );

    // Update performance trend
    this.updatePerformanceTrend();

    // Record score history
    this.history.scores.push({
      timestamp: Date.now(),
      overall: this.gps.overall,
      components: { ...this.gps.components }
    });

    // Limit history size
    this.limitHistorySize();

    // Check for performance alerts
    this.checkPerformanceAlerts();

    this.dispatchEvent('performance-updated', {
      score: this.gps.overall,
      components: this.gps.components,
      trend: this.gps.trend
    });
  }

  /**
   * Calculate context-specific score for FPS
   */
  calculateFPSScore() {
    const thresholds = this.getContextThresholds().fps;
    const fps = this.metrics.fps.current;
    const consistency = this.metrics.fps.consistency;

    let baseScore = 0;
    if (fps >= thresholds.excellent) baseScore = 1.0;
    else if (fps >= thresholds.good) baseScore = 0.8;
    else if (fps >= thresholds.acceptable) baseScore = 0.6;
    else if (fps >= thresholds.poor) baseScore = 0.4;
    else baseScore = 0.2;

    // Apply consistency penalty
    return baseScore * consistency;
  }

  /**
   * Calculate memory efficiency score
   */
  calculateMemoryScore() {
    const thresholds = this.getContextThresholds().memory;
    const usage = this.metrics.memory.current;

    if (usage <= thresholds.excellent) return 1.0;
    if (usage <= thresholds.good) return 0.8;
    if (usage <= thresholds.acceptable) return 0.6;
    if (usage <= thresholds.poor) return 0.4;
    return 0.2;
  }

  /**
   * Calculate battery efficiency score
   */
  calculateBatteryScore() {
    if (this.metrics.battery.isCharging) return 1.0;

    const thresholds = this.getContextThresholds().battery;
    const drainRate = this.metrics.battery.drainRate;

    if (drainRate <= thresholds.excellent) return 1.0;
    if (drainRate <= thresholds.good) return 0.8;
    if (drainRate <= thresholds.acceptable) return 0.6;
    if (drainRate <= thresholds.poor) return 0.4;
    return 0.2;
  }

  /**
   * Calculate input latency score
   */
  calculateLatencyScore() {
    const thresholds = this.getContextThresholds().latency;
    const latency = this.metrics.input.latency;

    if (latency <= thresholds.excellent) return 1.0;
    if (latency <= thresholds.good) return 0.8;
    if (latency <= thresholds.acceptable) return 0.6;
    if (latency <= thresholds.poor) return 0.4;
    return 0.2;
  }

  /**
   * Set gaming context for performance monitoring
   */
  setGamingContext(context) {
    if (this.state.currentContext === context) return;

    console.log(`📊 Performance monitoring context: ${this.state.currentContext} → ${context}`);
    
    const previousContext = this.state.currentContext;
    this.state.currentContext = context;

    // Update context-specific monitoring
    this.updateContextMonitoring(context);

    // Record context performance data
    this.recordContextPerformance(previousContext);

    this.dispatchEvent('context-changed', {
      newContext: context,
      previousContext: previousContext
    });
  }

  /**
   * Create comprehensive performance dashboard
   */
  createPerformanceDashboard() {
    const dashboard = document.createElement('div');
    dashboard.className = 'gaming-performance-dashboard';
    dashboard.innerHTML = `
      <div class="dashboard-header">
        <h3>📊 Gaming Performance Monitor</h3>
        <div class="performance-score">
          <div class="score-circle" data-score="${Math.round(this.gps.overall * 100)}">
            <span class="score-value">${Math.round(this.gps.overall * 100)}</span>
            <span class="score-label">GPS</span>
          </div>
          <div class="score-trend ${this.gps.trend}">
            ${this.getTrendIcon(this.gps.trend)} ${this.gps.trend}
          </div>
        </div>
      </div>
      
      <div class="performance-metrics">
        <div class="metric-row">
          <div class="metric-card fps">
            <label>FPS</label>
            <span class="metric-value">${Math.round(this.metrics.fps.current)}</span>
            <div class="metric-bar">
              <div class="metric-fill" style="width: ${(this.gps.components.fps * 100)}%"></div>
            </div>
            <span class="metric-score">${Math.round(this.gps.components.fps * 100)}%</span>
          </div>
          
          <div class="metric-card memory">
            <label>Memory</label>
            <span class="metric-value">${Math.round(this.metrics.memory.current)}MB</span>
            <div class="metric-bar">
              <div class="metric-fill" style="width: ${(this.gps.components.memory * 100)}%"></div>
            </div>
            <span class="metric-score">${Math.round(this.gps.components.memory * 100)}%</span>
          </div>
        </div>
        
        <div class="metric-row">
          <div class="metric-card battery">
            <label>Battery</label>
            <span class="metric-value">${Math.round(this.metrics.battery.level * 100)}%</span>
            <div class="metric-bar">
              <div class="metric-fill" style="width: ${(this.gps.components.battery * 100)}%"></div>
            </div>
            <span class="metric-score">${Math.round(this.gps.components.battery * 100)}%</span>
          </div>
          
          <div class="metric-card latency">
            <label>Latency</label>
            <span class="metric-value">${Math.round(this.metrics.input.latency)}ms</span>
            <div class="metric-bar">
              <div class="metric-fill" style="width: ${(this.gps.components.latency * 100)}%"></div>
            </div>
            <span class="metric-score">${Math.round(this.gps.components.latency * 100)}%</span>
          </div>
        </div>
      </div>
      
      <div class="performance-alerts" data-section="alerts">
        <!-- Alerts will be populated dynamically -->
      </div>
      
      <div class="performance-controls">
        <button class="control-button" data-action="toggle-monitoring">
          ${this.state.isMonitoring ? '⏸️ Pause' : '▶️ Resume'} Monitoring
        </button>
        <button class="control-button" data-action="export-data">
          📊 Export Data
        </button>
        <button class="control-button" data-action="reset-session">
          🔄 Reset Session
        </button>
      </div>
      
      <div class="performance-recommendations" data-section="recommendations">
        <!-- Recommendations will be populated dynamically -->
      </div>
    `;

    // Add event listeners
    dashboard.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action) {
        this.handleDashboardAction(action);
      }
    });

    // Update dashboard periodically
    setInterval(() => {
      this.updatePerformanceDashboard(dashboard);
    }, 1000);

    return dashboard;
  }

  /**
   * Get comprehensive performance analytics
   */
  getPerformanceAnalytics() {
    return {
      session: {
        id: this.state.sessionId,
        duration: Date.now() - this.state.sessionStart,
        context: this.state.currentContext,
        monitoring: this.state.isMonitoring
      },
      metrics: { ...this.metrics },
      gps: { ...this.gps },
      analytics: { ...this.analytics },
      alerts: {
        active: this.alerts.active.length,
        total: this.alerts.history.length
      },
      recommendations: this.generatePerformanceRecommendations(),
      trends: this.analyzeTrends(),
      contextPerformance: Object.fromEntries(this.analytics.contextPerformance)
    };
  }

  /**
   * Export performance data
   */
  exportPerformanceData() {
    const data = {
      metadata: {
        exportTime: new Date().toISOString(),
        sessionId: this.state.sessionId,
        sessionDuration: Date.now() - this.state.sessionStart,
        context: this.state.currentContext,
        deviceInfo: this.getDeviceInfo()
      },
      analytics: this.getPerformanceAnalytics(),
      history: {
        fps: this.history.fps.slice(-100),      // Last 100 points
        memory: this.history.memory.slice(-100),
        battery: this.history.battery.slice(-100),
        scores: this.history.scores.slice(-100)
      },
      recommendations: this.generatePerformanceRecommendations(),
      summary: this.generatePerformanceSummary()
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Helper methods
   */
  getContextThresholds() {
    return GAMING_MONITOR_CONFIG.thresholds[this.state.currentContext] || 
           GAMING_MONITOR_CONFIG.thresholds.social;
  }

  generateSessionId() {
    return `gaming-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getTrendIcon(trend) {
    const icons = {
      improving: '📈',
      stable: '➡️',
      declining: '📉'
    };
    return icons[trend] || '➡️';
  }

  limitHistorySize() {
    const maxPoints = GAMING_MONITOR_CONFIG.dataCollection.maxHistoryPoints;
    
    Object.keys(this.history).forEach(key => {
      if (this.history[key].length > maxPoints) {
        this.history[key] = this.history[key].slice(-maxPoints);
      }
    });
  }

  dispatchEvent(eventName, detail) {
    const event = new CustomEvent(`mlg-performance-${eventName}`, { detail });
    document.dispatchEvent(event);
  }

  /**
   * Cleanup and shutdown
   */
  destroy() {
    console.log('🔥 Destroying Gaming Performance Monitor...');

    // Stop monitoring
    this.stopMonitoring();

    // Clear all timers
    this.timers.forEach((timer, name) => {
      clearInterval(timer);
    });
    this.timers.clear();

    // Clear history
    Object.keys(this.history).forEach(key => {
      this.history[key] = [];
    });

    console.log('✅ Gaming Performance Monitor destroyed');
  }

  stopMonitoring() {
    this.state.isMonitoring = false;
    
    // Clear monitoring timers
    ['overall', 'analytics'].forEach(name => {
      const timer = this.timers.get(name);
      if (timer) {
        clearInterval(timer);
        this.timers.delete(name);
      }
    });
  }
}

export default MobileGamingPerformanceMonitor;