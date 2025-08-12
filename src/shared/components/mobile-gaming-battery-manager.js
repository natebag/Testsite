/**
 * MLG.clan Mobile Gaming Battery Manager
 * 
 * Advanced battery management system specifically designed for gaming scenarios:
 * - Gaming context-aware power optimization
 * - Smart power allocation based on gaming activity
 * - Battery usage analytics and predictions
 * - Gaming session extension strategies
 * - Xbox 360 aesthetic power indicators
 * 
 * Power Management Modes:
 * - Tournament Mode: Maximum power allocation for competitive gaming
 * - Extended Session Mode: Optimized for long gaming sessions
 * - Power Saver Mode: Extreme battery conservation
 * - Adaptive Mode: Dynamic adjustment based on usage patterns
 * 
 * @author Claude Code - Security and Performance Auditor
 * @version 1.0.0
 */

/**
 * Gaming Battery Management Configuration
 */
const GAMING_BATTERY_CONFIG = {
  // Power Management Profiles
  powerProfiles: {
    tournament: {
      name: 'Tournament Mode',
      description: 'Maximum performance for competitive gaming',
      screenBrightness: 1.0,
      refreshRate: 'maximum',
      cpuThrottling: 'disabled',
      gpuBoost: 'enabled',
      networkMode: 'performance',
      backgroundProcessing: 'minimal',
      vibration: 'enabled',
      notifications: 'priority-only',
      powerBudget: 'unlimited',
      estimatedDuration: 2.5 // hours at full charge
    },
    
    extended: {
      name: 'Extended Session',
      description: 'Optimized for long gaming sessions',
      screenBrightness: 0.8,
      refreshRate: 'adaptive',
      cpuThrottling: 'mild',
      gpuBoost: 'adaptive',
      networkMode: 'balanced',
      backgroundProcessing: 'selective',
      vibration: 'reduced',
      notifications: 'gaming-only',
      powerBudget: 'managed',
      estimatedDuration: 4.5 // hours at full charge
    },
    
    powerSaver: {
      name: 'Power Saver',
      description: 'Maximum battery conservation',
      screenBrightness: 0.6,
      refreshRate: 'reduced',
      cpuThrottling: 'aggressive',
      gpuBoost: 'disabled',
      networkMode: 'efficient',
      backgroundProcessing: 'disabled',
      vibration: 'disabled',
      notifications: 'essential-only',
      powerBudget: 'restricted',
      estimatedDuration: 8.0 // hours at full charge
    },
    
    adaptive: {
      name: 'Adaptive Mode',
      description: 'Dynamic adjustment based on usage',
      screenBrightness: 'auto',
      refreshRate: 'adaptive',
      cpuThrottling: 'dynamic',
      gpuBoost: 'contextual',
      networkMode: 'adaptive',
      backgroundProcessing: 'smart',
      vibration: 'contextual',
      notifications: 'intelligent',
      powerBudget: 'dynamic',
      estimatedDuration: 6.0 // hours at full charge (average)
    }
  },

  // Battery Level Thresholds
  batteryThresholds: {
    critical: { level: 0.05, actions: ['emergency-mode', 'data-save', 'minimal-ui'] },
    veryLow: { level: 0.15, actions: ['power-saver', 'background-suspend', 'notification-limit'] },
    low: { level: 0.25, actions: ['efficiency-mode', 'brightness-reduce', 'refresh-limit'] },
    moderate: { level: 0.50, actions: ['balanced-mode', 'adaptive-quality'] },
    good: { level: 0.75, actions: ['normal-mode'] },
    excellent: { level: 0.90, actions: ['performance-mode'] }
  },

  // Gaming Activity Power Costs (relative power consumption)
  activityPowerCosts: {
    tournament: { cpu: 1.0, gpu: 1.0, network: 0.9, screen: 1.0, total: 1.0 },
    clan: { cpu: 0.7, gpu: 0.6, network: 0.6, screen: 0.8, total: 0.7 },
    voting: { cpu: 0.5, gpu: 0.3, network: 0.8, screen: 0.7, total: 0.6 },
    profile: { cpu: 0.3, gpu: 0.2, network: 0.3, screen: 0.6, total: 0.4 },
    social: { cpu: 0.6, gpu: 0.4, network: 0.7, screen: 0.7, total: 0.6 }
  },

  // Power Optimization Settings
  optimization: {
    screenTimeout: {
      tournament: 300000,    // 5 minutes
      extended: 180000,      // 3 minutes
      powerSaver: 60000,     // 1 minute
      adaptive: 120000       // 2 minutes
    },
    
    backgroundSync: {
      tournament: 30000,     // 30 seconds
      extended: 60000,       // 1 minute
      powerSaver: 300000,    // 5 minutes
      adaptive: 120000       // 2 minutes
    },
    
    networkPolling: {
      tournament: 1000,      // 1 second
      extended: 5000,        // 5 seconds
      powerSaver: 30000,     // 30 seconds
      adaptive: 10000        // 10 seconds
    }
  },

  // Monitoring and Analytics
  monitoring: {
    batteryCheckInterval: 5000,     // 5 seconds
    powerUsageInterval: 10000,      // 10 seconds
    drainAnalysisInterval: 60000,   // 1 minute
    predictionUpdateInterval: 30000, // 30 seconds
    thermalCheckInterval: 15000     // 15 seconds
  },

  // Gaming UI Power Indicators
  uiIndicators: {
    batteryColors: {
      excellent: '#00ff88',    // Xbox green
      good: '#88ff00',         // Light green
      moderate: '#ffaa00',     // Orange
      low: '#ff6600',          // Red-orange
      veryLow: '#ff3300',      // Red
      critical: '#ff0066'      // Danger red
    },
    
    powerModeIcons: {
      tournament: '🏆',
      extended: '⏱️',
      powerSaver: '🔋',
      adaptive: '🎯'
    }
  }
};

/**
 * Mobile Gaming Battery Manager Class
 */
export class MobileGamingBatteryManager {
  constructor(options = {}) {
    this.options = {
      enableSmartOptimization: true,
      enablePredictiveManagement: true,
      enableThermalMonitoring: true,
      enableUsageAnalytics: true,
      enableUserNotifications: true,
      enableEmergencyMode: true,
      debugMode: false,
      ...options
    };

    // Battery state
    this.batteryState = {
      level: 1.0,
      charging: false,
      chargingTime: Infinity,
      dischargingTime: Infinity,
      temperature: null,
      health: 1.0,
      lastUpdate: Date.now()
    };

    // Power management
    this.powerManagement = {
      currentProfile: 'adaptive',
      targetProfile: 'adaptive',
      isOptimizing: false,
      emergencyMode: false,
      thermalThrottling: false,
      powerSavingActive: false
    };

    // Gaming context tracking
    this.gamingContext = {
      current: 'general',
      previous: 'general',
      sessionStart: Date.now(),
      sessionDuration: 0,
      activityHistory: [],
      powerConsumption: {}
    };

    // Battery analytics
    this.analytics = {
      sessionPowerUsage: 0,
      averageDrainRate: 0,
      predictedDuration: 0,
      powerEfficiencyScore: 1.0,
      optimizationsSaved: 0,
      sessionExtensionTime: 0,
      thermalEvents: 0,
      emergencyActivations: 0
    };

    // Performance tracking
    this.performance = {
      drainHistory: [],
      powerHistory: [],
      temperatureHistory: [],
      sessionMetrics: {},
      predictions: {}
    };

    // Timers and intervals
    this.timers = new Map();

    // User interface elements
    this.uiElements = {
      batteryIndicator: null,
      powerModeSelector: null,
      optimizationPanel: null,
      analyticsDisplay: null
    };

    this.init();
  }

  /**
   * Initialize the gaming battery manager
   */
  async init() {
    console.log('🔋 Initializing MLG Gaming Battery Manager...');

    try {
      // Initialize battery API
      await this.initializeBatteryAPI();

      // Start monitoring systems
      this.startBatteryMonitoring();
      this.startPowerAnalytics();
      
      if (this.options.enableThermalMonitoring) {
        this.startThermalMonitoring();
      }

      // Initialize power management
      await this.initializePowerManagement();

      // Create UI elements
      this.initializeUI();

      // Start predictive management
      if (this.options.enablePredictiveManagement) {
        this.startPredictiveManagement();
      }

      console.log('✅ Gaming Battery Manager initialized', {
        batteryLevel: `${Math.round(this.batteryState.level * 100)}%`,
        charging: this.batteryState.charging,
        powerProfile: this.powerManagement.currentProfile
      });

    } catch (error) {
      console.error('❌ Failed to initialize Gaming Battery Manager:', error);
      // Fallback to power saver mode
      await this.setPowerProfile('powerSaver');
    }
  }

  /**
   * Initialize Battery API connection
   */
  async initializeBatteryAPI() {
    if ('getBattery' in navigator) {
      try {
        this.battery = await navigator.getBattery();
        
        // Update initial state
        this.updateBatteryState();

        // Set up event listeners
        this.battery.addEventListener('levelchange', () => this.onBatteryLevelChange());
        this.battery.addEventListener('chargingchange', () => this.onChargingStateChange());
        this.battery.addEventListener('chargingtimechange', () => this.onChargingTimeChange());
        this.battery.addEventListener('dischargingtimechange', () => this.onDischargingTimeChange());

        console.log('🔌 Battery API connected successfully');
      } catch (error) {
        console.warn('Battery API not available:', error);
        this.simulateBatteryData();
      }
    } else {
      console.warn('Battery API not supported');
      this.simulateBatteryData();
    }
  }

  /**
   * Update battery state from API
   */
  updateBatteryState() {
    if (this.battery) {
      this.batteryState = {
        level: this.battery.level,
        charging: this.battery.charging,
        chargingTime: this.battery.chargingTime,
        dischargingTime: this.battery.dischargingTime,
        temperature: this.estimateTemperature(),
        health: this.estimateBatteryHealth(),
        lastUpdate: Date.now()
      };
    }
  }

  /**
   * Start comprehensive battery monitoring
   */
  startBatteryMonitoring() {
    // Regular battery status checks
    this.timers.set('batteryCheck', setInterval(() => {
      this.updateBatteryState();
      this.checkBatteryThresholds();
      this.updateUI();
    }, GAMING_BATTERY_CONFIG.monitoring.batteryCheckInterval));

    // Power usage analysis
    this.timers.set('powerAnalysis', setInterval(() => {
      this.analyzePowerUsage();
      this.updatePowerPredictions();
    }, GAMING_BATTERY_CONFIG.monitoring.powerUsageInterval));

    // Drain rate analysis
    this.timers.set('drainAnalysis', setInterval(() => {
      this.analyzeDrainRate();
    }, GAMING_BATTERY_CONFIG.monitoring.drainAnalysisInterval));
  }

  /**
   * Handle battery level changes
   */
  onBatteryLevelChange() {
    const previousLevel = this.batteryState.level;
    this.updateBatteryState();
    
    const currentLevel = this.batteryState.level;
    const levelChange = currentLevel - previousLevel;

    // Track drain rate
    if (levelChange < 0 && !this.batteryState.charging) {
      this.recordDrainEvent(Math.abs(levelChange));
    }

    // Check for critical thresholds
    this.checkBatteryThresholds();

    // Update power predictions
    this.updatePowerPredictions();

    // Emit event
    this.dispatchEvent('battery-level-changed', {
      level: currentLevel,
      change: levelChange,
      charging: this.batteryState.charging
    });
  }

  /**
   * Handle charging state changes
   */
  onChargingStateChange() {
    const wasCharging = this.batteryState.charging;
    this.updateBatteryState();
    
    if (this.batteryState.charging && !wasCharging) {
      // Started charging
      this.onChargingStarted();
    } else if (!this.batteryState.charging && wasCharging) {
      // Stopped charging
      this.onChargingStopped();
    }
  }

  /**
   * Handle charging started
   */
  onChargingStarted() {
    console.log('🔌 Charging started - enabling performance mode');
    
    // Disable power restrictions when charging
    this.powerManagement.powerSavingActive = false;
    
    // Switch to performance profile if in power saver mode
    if (this.powerManagement.currentProfile === 'powerSaver') {
      this.setPowerProfile('adaptive');
    }

    // Update UI
    this.updateChargingUI(true);

    this.dispatchEvent('charging-started', {
      batteryLevel: this.batteryState.level,
      chargingTime: this.batteryState.chargingTime
    });
  }

  /**
   * Handle charging stopped
   */
  onChargingStopped() {
    console.log('🔋 Charging stopped - resuming battery optimization');
    
    // Re-enable appropriate power management
    this.checkBatteryThresholds();
    
    // Update UI
    this.updateChargingUI(false);

    this.dispatchEvent('charging-stopped', {
      batteryLevel: this.batteryState.level,
      dischargingTime: this.batteryState.dischargingTime
    });
  }

  /**
   * Check battery thresholds and apply optimizations
   */
  checkBatteryThresholds() {
    const level = this.batteryState.level;
    const thresholds = GAMING_BATTERY_CONFIG.batteryThresholds;

    // Don't apply power saving when charging
    if (this.batteryState.charging) {
      return;
    }

    // Find appropriate threshold
    let activeThreshold = null;
    for (const [name, threshold] of Object.entries(thresholds)) {
      if (level <= threshold.level) {
        activeThreshold = { name, ...threshold };
        break;
      }
    }

    if (activeThreshold) {
      this.applyThresholdActions(activeThreshold);
    }
  }

  /**
   * Apply actions based on battery threshold
   */
  async applyThresholdActions(threshold) {
    console.log(`🔋 Battery at ${threshold.name} level (${Math.round(this.batteryState.level * 100)}%) - applying optimizations`);

    for (const action of threshold.actions) {
      await this.executeThresholdAction(action);
    }

    // Update analytics
    this.analytics.optimizationsSaved++;

    // Notify user if enabled
    if (this.options.enableUserNotifications) {
      this.showBatteryNotification(threshold);
    }
  }

  /**
   * Execute specific threshold action
   */
  async executeThresholdAction(action) {
    switch (action) {
      case 'emergency-mode':
        await this.activateEmergencyMode();
        break;
      
      case 'power-saver':
        await this.setPowerProfile('powerSaver');
        break;
      
      case 'efficiency-mode':
        await this.enableEfficiencyMode();
        break;
      
      case 'balanced-mode':
        await this.setPowerProfile('adaptive');
        break;
      
      case 'data-save':
        this.enableDataSaveMode();
        break;
      
      case 'background-suspend':
        this.suspendBackgroundProcesses();
        break;
      
      case 'brightness-reduce':
        this.reduceScreenBrightness();
        break;
      
      case 'refresh-limit':
        this.limitRefreshRate();
        break;
      
      case 'notification-limit':
        this.limitNotifications();
        break;
      
      case 'minimal-ui':
        this.enableMinimalUI();
        break;
    }
  }

  /**
   * Set power management profile
   */
  async setPowerProfile(profileName) {
    const profile = GAMING_BATTERY_CONFIG.powerProfiles[profileName];
    if (!profile) {
      console.warn(`Unknown power profile: ${profileName}`);
      return;
    }

    console.log(`⚡ Switching to ${profile.name} power profile`);
    
    this.powerManagement.currentProfile = profileName;
    this.powerManagement.isOptimizing = true;

    try {
      // Apply profile settings
      await this.applyPowerProfile(profile);

      // Update UI
      this.updatePowerProfileUI(profileName, profile);

      // Calculate power savings
      this.calculatePowerSavings(profileName);

      console.log(`✅ ${profile.name} activated`);

    } catch (error) {
      console.error('Failed to apply power profile:', error);
    } finally {
      this.powerManagement.isOptimizing = false;
    }

    this.dispatchEvent('power-profile-changed', {
      profile: profileName,
      settings: profile
    });
  }

  /**
   * Apply power profile settings
   */
  async applyPowerProfile(profile) {
    // Apply CSS classes for visual optimizations
    this.applyCSSPowerOptimizations(profile);

    // Configure system settings
    this.configureSystemSettings(profile);

    // Update gaming context optimizations
    this.updateGamingOptimizations(profile);

    // Apply network optimizations
    this.applyNetworkOptimizations(profile);
  }

  /**
   * Apply CSS power optimizations
   */
  applyCSSPowerOptimizations(profile) {
    const root = document.documentElement;
    const body = document.body;

    // Remove existing power classes
    body.classList.remove('power-tournament', 'power-extended', 'power-saver', 'power-adaptive');
    
    // Add current power class
    body.classList.add(`power-${this.powerManagement.currentProfile}`);

    // Set CSS variables for optimization
    root.style.setProperty('--battery-level', this.batteryState.level.toString());
    root.style.setProperty('--power-mode', this.powerManagement.currentProfile);
    root.style.setProperty('--screen-brightness', profile.screenBrightness.toString());

    // Apply animation optimizations based on profile
    if (profile.name.includes('Saver') || this.batteryState.level < 0.2) {
      body.classList.add('reduced-animations', 'power-efficient');
    } else {
      body.classList.remove('reduced-animations', 'power-efficient');
    }
  }

  /**
   * Configure system-level settings
   */
  configureSystemSettings(profile) {
    // Screen timeout
    if ('screen' in navigator && 'wakeLock' in navigator) {
      this.configureScreenTimeout(profile);
    }

    // Background sync intervals
    this.configureBackgroundSync(profile);

    // Network polling intervals
    this.configureNetworkPolling(profile);
  }

  /**
   * Update gaming-specific optimizations
   */
  updateGamingOptimizations(profile) {
    const context = this.gamingContext.current;
    const activityCosts = GAMING_BATTERY_CONFIG.activityPowerCosts[context];

    if (activityCosts) {
      // Adjust gaming performance based on profile and activity
      this.optimizeGamingPerformance(profile, activityCosts);
    }
  }

  /**
   * Optimize gaming performance for power efficiency
   */
  optimizeGamingPerformance(profile, activityCosts) {
    const optimizations = {
      frameRateLimit: this.calculateOptimalFrameRate(profile, activityCosts),
      animationQuality: this.calculateAnimationQuality(profile),
      renderQuality: this.calculateRenderQuality(profile, activityCosts),
      backgroundProcessing: this.calculateBackgroundProcessing(profile)
    };

    // Apply optimizations
    this.applyGamingOptimizations(optimizations);
  }

  /**
   * Activate emergency battery mode
   */
  async activateEmergencyMode() {
    if (this.powerManagement.emergencyMode) return;

    console.log('🚨 Activating emergency battery mode');
    
    this.powerManagement.emergencyMode = true;
    this.analytics.emergencyActivations++;

    // Apply extreme power saving measures
    document.body.classList.add('emergency-mode');
    
    // Disable all non-essential features
    this.disableNonEssentialFeatures();
    
    // Minimize refresh rate
    this.setMinimalRefreshRate();
    
    // Disable animations completely
    document.body.classList.add('no-animations');
    
    // Show emergency notification
    this.showEmergencyNotification();

    this.dispatchEvent('emergency-mode-activated', {
      batteryLevel: this.batteryState.level,
      estimatedTime: this.analytics.predictedDuration
    });
  }

  /**
   * Analyze power usage patterns
   */
  analyzePowerUsage() {
    const now = Date.now();
    const timeDelta = now - this.batteryState.lastUpdate;
    
    if (timeDelta > 0 && !this.batteryState.charging) {
      // Calculate current power usage
      const levelDelta = this.performance.powerHistory.length > 0 
        ? this.batteryState.level - this.performance.powerHistory[this.performance.powerHistory.length - 1].level
        : 0;

      const powerUsage = Math.abs(levelDelta) / (timeDelta / 3600000); // %/hour

      // Record power usage
      this.performance.powerHistory.push({
        timestamp: now,
        level: this.batteryState.level,
        usage: powerUsage,
        context: this.gamingContext.current,
        profile: this.powerManagement.currentProfile
      });

      // Keep only recent history (last hour)
      this.performance.powerHistory = this.performance.powerHistory.filter(
        entry => now - entry.timestamp <= 3600000
      );

      // Update analytics
      this.updatePowerAnalytics();
    }
  }

  /**
   * Update power analytics and predictions
   */
  updatePowerAnalytics() {
    if (this.performance.powerHistory.length < 2) return;

    // Calculate average drain rate
    const recentUsage = this.performance.powerHistory.slice(-10);
    this.analytics.averageDrainRate = recentUsage.reduce((sum, entry) => sum + entry.usage, 0) / recentUsage.length;

    // Predict remaining time
    if (this.analytics.averageDrainRate > 0) {
      this.analytics.predictedDuration = (this.batteryState.level / this.analytics.averageDrainRate) * 60; // minutes
    }

    // Calculate efficiency score
    this.calculateEfficiencyScore();
  }

  /**
   * Calculate power efficiency score
   */
  calculateEfficiencyScore() {
    const baselineUsage = 10; // %/hour baseline
    const actualUsage = this.analytics.averageDrainRate;
    
    this.analytics.powerEfficiencyScore = Math.max(0, Math.min(1, baselineUsage / actualUsage));
  }

  /**
   * Start thermal monitoring
   */
  startThermalMonitoring() {
    // Simulate thermal monitoring (real implementation would use device APIs)
    this.timers.set('thermal', setInterval(() => {
      this.checkThermalState();
    }, GAMING_BATTERY_CONFIG.monitoring.thermalCheckInterval));
  }

  /**
   * Check thermal state and apply throttling if needed
   */
  checkThermalState() {
    const temperature = this.estimateTemperature();
    this.batteryState.temperature = temperature;

    // Apply thermal throttling if temperature is high
    if (temperature > 35 && !this.powerManagement.thermalThrottling) {
      this.activateThermalThrottling();
    } else if (temperature < 30 && this.powerManagement.thermalThrottling) {
      this.deactivateThermalThrottling();
    }
  }

  /**
   * Activate thermal throttling
   */
  activateThermalThrottling() {
    console.log('🌡️ High temperature detected - activating thermal throttling');
    
    this.powerManagement.thermalThrottling = true;
    this.analytics.thermalEvents++;

    // Apply thermal optimizations
    document.body.classList.add('thermal-throttling');
    
    // Reduce performance temporarily
    this.applyThermalOptimizations();

    this.dispatchEvent('thermal-throttling-activated', {
      temperature: this.batteryState.temperature,
      batteryLevel: this.batteryState.level
    });
  }

  /**
   * Create gaming battery UI components
   */
  initializeUI() {
    // Create battery indicator
    this.uiElements.batteryIndicator = this.createBatteryIndicator();
    
    // Create power mode selector
    this.uiElements.powerModeSelector = this.createPowerModeSelector();
    
    // Create optimization panel
    this.uiElements.optimizationPanel = this.createOptimizationPanel();
    
    // Create analytics display
    this.uiElements.analyticsDisplay = this.createAnalyticsDisplay();
  }

  /**
   * Create Xbox-styled battery indicator
   */
  createBatteryIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'gaming-battery-indicator';
    indicator.innerHTML = `
      <div class="battery-icon">
        <div class="battery-level" data-level="${Math.round(this.batteryState.level * 100)}"></div>
        <div class="battery-percentage">${Math.round(this.batteryState.level * 100)}%</div>
        ${this.batteryState.charging ? '<div class="charging-indicator">⚡</div>' : ''}
      </div>
      <div class="battery-status">
        <span class="power-mode">${GAMING_BATTERY_CONFIG.powerProfiles[this.powerManagement.currentProfile].name}</span>
        <span class="estimated-time">${this.formatDuration(this.analytics.predictedDuration)}</span>
      </div>
    `;

    return indicator;
  }

  /**
   * Create power mode selector
   */
  createPowerModeSelector() {
    const selector = document.createElement('div');
    selector.className = 'gaming-power-mode-selector';
    
    const options = Object.entries(GAMING_BATTERY_CONFIG.powerProfiles).map(([key, profile]) => {
      const icon = GAMING_BATTERY_CONFIG.uiIndicators.powerModeIcons[key];
      return `
        <button class="power-mode-option ${key === this.powerManagement.currentProfile ? 'active' : ''}" 
                data-profile="${key}">
          <span class="mode-icon">${icon}</span>
          <span class="mode-name">${profile.name}</span>
          <span class="mode-duration">~${profile.estimatedDuration}h</span>
        </button>
      `;
    }).join('');

    selector.innerHTML = `
      <h4>🔋 Power Management</h4>
      <div class="power-mode-options">
        ${options}
      </div>
    `;

    // Add event listeners
    selector.addEventListener('click', (e) => {
      const profileButton = e.target.closest('[data-profile]');
      if (profileButton) {
        this.setPowerProfile(profileButton.dataset.profile);
      }
    });

    return selector;
  }

  /**
   * Create optimization panel
   */
  createOptimizationPanel() {
    const panel = document.createElement('div');
    panel.className = 'gaming-battery-optimization-panel';
    panel.innerHTML = `
      <h4>⚡ Battery Optimization</h4>
      
      <div class="optimization-metrics">
        <div class="metric">
          <label>Efficiency Score</label>
          <span class="metric-value">${Math.round(this.analytics.powerEfficiencyScore * 100)}%</span>
        </div>
        <div class="metric">
          <label>Power Saved</label>
          <span class="metric-value">${this.analytics.optimizationsSaved}</span>
        </div>
        <div class="metric">
          <label>Session Extended</label>
          <span class="metric-value">${this.formatDuration(this.analytics.sessionExtensionTime)}</span>
        </div>
      </div>
      
      <div class="optimization-controls">
        <button class="optimize-button" data-action="optimize-now">
          🚀 Optimize Now
        </button>
        <button class="emergency-button" data-action="emergency-mode">
          🚨 Emergency Mode
        </button>
      </div>
      
      <div class="optimization-recommendations">
        <!-- Recommendations will be populated dynamically -->
      </div>
    `;

    // Add event listeners
    panel.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action) {
        this.handleOptimizationAction(action);
      }
    });

    return panel;
  }

  /**
   * Update UI elements
   */
  updateUI() {
    this.updateBatteryIndicator();
    this.updatePowerModeSelector();
    this.updateOptimizationPanel();
    this.updateAnalyticsDisplay();
  }

  /**
   * Update battery indicator
   */
  updateBatteryIndicator() {
    if (!this.uiElements.batteryIndicator) return;

    const level = Math.round(this.batteryState.level * 100);
    const color = this.getBatteryColor(this.batteryState.level);
    
    const levelElement = this.uiElements.batteryIndicator.querySelector('.battery-level');
    if (levelElement) {
      levelElement.dataset.level = level;
      levelElement.style.background = color;
    }

    const percentageElement = this.uiElements.batteryIndicator.querySelector('.battery-percentage');
    if (percentageElement) {
      percentageElement.textContent = `${level}%`;
      percentageElement.style.color = color;
    }

    const statusElement = this.uiElements.batteryIndicator.querySelector('.estimated-time');
    if (statusElement) {
      statusElement.textContent = this.formatDuration(this.analytics.predictedDuration);
    }
  }

  /**
   * Get battery level color
   */
  getBatteryColor(level) {
    const colors = GAMING_BATTERY_CONFIG.uiIndicators.batteryColors;
    
    if (level >= 0.90) return colors.excellent;
    if (level >= 0.75) return colors.good;
    if (level >= 0.50) return colors.moderate;
    if (level >= 0.25) return colors.low;
    if (level >= 0.15) return colors.veryLow;
    return colors.critical;
  }

  /**
   * Format duration in minutes to human readable
   */
  formatDuration(minutes) {
    if (!minutes || minutes === Infinity) return '--';
    
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  /**
   * Show battery notification
   */
  showBatteryNotification(threshold) {
    const notification = document.createElement('div');
    notification.className = 'gaming-battery-notification';
    notification.innerHTML = `
      <div class="notification-icon">🔋</div>
      <div class="notification-content">
        <div class="notification-title">Battery ${threshold.name}</div>
        <div class="notification-message">
          ${Math.round(this.batteryState.level * 100)}% remaining - Power optimizations applied
        </div>
      </div>
    `;

    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  /**
   * Dispatch custom events
   */
  dispatchEvent(eventName, detail) {
    const event = new CustomEvent(`mlg-battery-${eventName}`, { detail });
    document.dispatchEvent(event);
  }

  /**
   * Get comprehensive battery analytics
   */
  getBatteryAnalytics() {
    return {
      battery: { ...this.batteryState },
      power: { ...this.powerManagement },
      analytics: { ...this.analytics },
      performance: {
        drainRate: this.analytics.averageDrainRate,
        efficiency: this.analytics.powerEfficiencyScore,
        predictions: this.performance.predictions
      },
      session: {
        duration: Date.now() - this.gamingContext.sessionStart,
        context: this.gamingContext.current,
        powerSaved: this.analytics.optimizationsSaved
      }
    };
  }

  /**
   * Helper methods for simulation and estimation
   */
  simulateBatteryData() {
    this.batteryState = {
      level: 0.75,
      charging: false,
      chargingTime: Infinity,
      dischargingTime: 14400000, // 4 hours
      temperature: 25,
      health: 0.95,
      lastUpdate: Date.now()
    };
  }

  estimateTemperature() {
    // Simulate temperature based on usage
    const baseTemp = 25;
    const usageTemp = this.analytics.averageDrainRate * 0.5;
    return baseTemp + usageTemp + (Math.random() * 2 - 1);
  }

  estimateBatteryHealth() {
    // Simulate battery health
    return 0.95 - (Math.random() * 0.1);
  }

  recordDrainEvent(drainAmount) {
    this.performance.drainHistory.push({
      timestamp: Date.now(),
      amount: drainAmount,
      context: this.gamingContext.current,
      profile: this.powerManagement.currentProfile
    });

    // Keep only recent history
    const oneHourAgo = Date.now() - 3600000;
    this.performance.drainHistory = this.performance.drainHistory.filter(
      event => event.timestamp > oneHourAgo
    );
  }

  /**
   * Cleanup and shutdown
   */
  destroy() {
    console.log('🔥 Destroying Gaming Battery Manager...');

    // Clear all timers
    this.timers.forEach((timer, name) => {
      clearInterval(timer);
    });
    this.timers.clear();

    // Remove UI elements
    Object.values(this.uiElements).forEach(element => {
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });

    // Reset state
    this.batteryState = {};
    this.powerManagement = {};
    this.analytics = {};

    console.log('✅ Gaming Battery Manager destroyed');
  }
}

export default MobileGamingBatteryManager;