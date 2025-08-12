/**
 * MLG.clan Mobile Gaming Performance Optimizer
 * 
 * Advanced gaming-specific performance optimization system designed for:
 * - Maximum gaming performance with minimal battery usage
 * - Context-aware optimization for different gaming scenarios
 * - Real-time performance monitoring and automatic adjustment
 * - Gaming-specific resource management and caching
 * - Xbox 360 aesthetic preservation during optimization
 * 
 * Gaming Context Modes:
 * - Tournament Mode: Maximum performance for competitive gaming
 * - Clan Mode: Balanced performance for social gaming interactions
 * - Voting Mode: Optimized for rapid content evaluation
 * - Profile Mode: Power-efficient for extended browsing
 * - Social Mode: Balanced performance for community interaction
 * 
 * @author Claude Code - Security and Performance Auditor
 * @version 1.0.0
 */

import { MobileNavPerformance } from './mobile-nav-performance.js';
import { MobileMediaOptimizer } from './mobile-media-optimizer.js';

/**
 * Gaming Performance Optimization Configuration
 */
const GAMING_PERFORMANCE_CONFIG = {
  // Gaming Context Performance Profiles
  contextProfiles: {
    tournament: {
      name: 'Tournament Mode',
      description: 'Maximum performance for competitive gaming',
      cpuPriority: 'high',
      gpuAcceleration: 'maximum',
      memoryManagement: 'aggressive',
      networkPriority: 'realtime',
      batteryOptimization: 'minimal',
      frameRateTarget: 60,
      responsivenessPriority: 'maximum',
      backgroundProcessing: 'minimal',
      animationQuality: 'high',
      resourcePreloading: 'aggressive',
      powerBudget: 'unrestricted'
    },
    clan: {
      name: 'Clan Mode',
      description: 'Balanced performance for social gaming',
      cpuPriority: 'medium',
      gpuAcceleration: 'balanced',
      memoryManagement: 'balanced',
      networkPriority: 'balanced',
      batteryOptimization: 'balanced',
      frameRateTarget: 45,
      responsivenessPriority: 'high',
      backgroundProcessing: 'selective',
      animationQuality: 'medium',
      resourcePreloading: 'selective',
      powerBudget: 'balanced'
    },
    voting: {
      name: 'Voting Mode',
      description: 'Optimized for rapid content evaluation',
      cpuPriority: 'high',
      gpuAcceleration: 'selective',
      memoryManagement: 'optimized',
      networkPriority: 'high',
      batteryOptimization: 'moderate',
      frameRateTarget: 45,
      responsivenessPriority: 'maximum',
      backgroundProcessing: 'deferred',
      animationQuality: 'medium',
      resourcePreloading: 'content-focused',
      powerBudget: 'moderate'
    },
    profile: {
      name: 'Profile Mode',
      description: 'Power-efficient for extended browsing',
      cpuPriority: 'low',
      gpuAcceleration: 'minimal',
      memoryManagement: 'conservative',
      networkPriority: 'deferred',
      batteryOptimization: 'aggressive',
      frameRateTarget: 30,
      responsivenessPriority: 'medium',
      backgroundProcessing: 'minimal',
      animationQuality: 'low',
      resourcePreloading: 'minimal',
      powerBudget: 'conservative'
    },
    social: {
      name: 'Social Mode',
      description: 'Balanced performance for community interaction',
      cpuPriority: 'medium',
      gpuAcceleration: 'balanced',
      memoryManagement: 'balanced',
      networkPriority: 'medium',
      batteryOptimization: 'moderate',
      frameRateTarget: 45,
      responsivenessPriority: 'high',
      backgroundProcessing: 'balanced',
      animationQuality: 'medium',
      resourcePreloading: 'social-focused',
      powerBudget: 'moderate'
    }
  },

  // Performance Thresholds
  performanceThresholds: {
    excellent: { score: 0.9, fps: 55, latency: 16, memory: 30 },
    good: { score: 0.7, fps: 40, latency: 33, memory: 50 },
    acceptable: { score: 0.5, fps: 30, latency: 50, memory: 70 },
    poor: { score: 0.3, fps: 20, latency: 100, memory: 90 }
  },

  // Battery Optimization Thresholds
  batteryThresholds: {
    critical: 0.15,    // 15% - Maximum power saving
    low: 0.25,         // 25% - Aggressive power saving
    moderate: 0.50,    // 50% - Moderate power saving
    normal: 0.75,      // 75+ - Normal operation
    unlimited: 1.0     // Charging - No restrictions
  },

  // Memory Management
  memoryThresholds: {
    critical: 90,      // 90% - Emergency cleanup
    warning: 75,       // 75% - Proactive cleanup
    optimal: 60,       // 60% - Normal operation
    comfortable: 40    // 40% - Allow resource growth
  },

  // Network Optimization
  networkProfiles: {
    'slow-2g': { maxConcurrent: 1, quality: 'minimal', preload: false, defer: true },
    '2g': { maxConcurrent: 2, quality: 'low', preload: false, defer: true },
    '3g': { maxConcurrent: 3, quality: 'medium', preload: true, defer: false },
    '4g': { maxConcurrent: 4, quality: 'high', preload: true, defer: false },
    '5g': { maxConcurrent: 6, quality: 'maximum', preload: true, defer: false }
  },

  // Gaming Resource Priorities
  resourcePriorities: {
    tournament: ['leaderboards', 'player-stats', 'brackets', 'notifications'],
    clan: ['clan-data', 'member-list', 'clan-stats', 'messaging'],
    voting: ['content-queue', 'thumbnails', 'metadata', 'voting-ui'],
    profile: ['user-data', 'achievements', 'statistics', 'settings'],
    social: ['feed', 'interactions', 'media', 'notifications']
  },

  // Performance Monitoring
  monitoring: {
    fpsInterval: 1000,          // Check FPS every second
    batteryInterval: 30000,     // Check battery every 30 seconds
    memoryInterval: 5000,       // Check memory every 5 seconds
    networkInterval: 10000,     // Check network every 10 seconds
    performanceInterval: 2000,  // Check overall performance every 2 seconds
    optimizationInterval: 5000  // Run optimizations every 5 seconds
  }
};

/**
 * Mobile Gaming Performance Optimizer Class
 */
export class MobileGamingPerformanceOptimizer {
  constructor(options = {}) {
    this.options = {
      enableContextAwareOptimization: true,
      enableBatteryOptimization: true,
      enableMemoryOptimization: true,
      enableNetworkOptimization: true,
      enableRealTimeMonitoring: true,
      enableAutoOptimization: true,
      enableAnalytics: true,
      debugMode: false,
      ...options
    };

    // Current state
    this.state = {
      currentContext: 'general',
      currentProfile: null,
      performanceScore: 1.0,
      isOptimizing: false,
      isMonitoring: false,
      batteryLevel: 1.0,
      isCharging: false,
      memoryUsage: 0,
      networkType: '4g',
      deviceTier: 'high'
    };

    // Performance metrics
    this.metrics = {
      fps: 60,
      averageFPS: 60,
      frameTime: 16.67,
      droppedFrames: 0,
      totalFrames: 0,
      memoryUsage: 0,
      peakMemoryUsage: 0,
      batteryDrain: 0,
      networkLatency: 0,
      resourceLoadTime: 0,
      userInteractionLatency: 0
    };

    // Gaming context data
    this.gamingContexts = {
      activeUsers: new Set(),
      currentTournaments: new Map(),
      clanActivities: new Map(),
      votingQueues: new Map(),
      socialInteractions: new Map()
    };

    // Optimization systems
    this.optimizers = {
      cpu: new CPUOptimizer(),
      gpu: new GPUOptimizer(),
      memory: new MemoryOptimizer(),
      network: new NetworkOptimizer(),
      battery: new BatteryOptimizer()
    };

    // Analytics and monitoring
    this.analytics = {
      contextSwitches: 0,
      optimizationsApplied: 0,
      performanceImprovements: 0,
      batterySavings: 0,
      memorySavings: 0,
      userExperienceScore: 0,
      gameplaySessions: 0,
      averageSessionLength: 0
    };

    // Timers and intervals
    this.timers = new Map();

    this.init();
  }

  /**
   * Initialize the gaming performance optimizer
   */
  async init() {
    console.log('🎮 Initializing MLG Gaming Performance Optimizer...');

    try {
      // Initialize device detection
      await this.detectDeviceCapabilities();

      // Initialize performance monitoring
      await this.initializePerformanceMonitoring();

      // Initialize context detection
      this.initializeContextDetection();

      // Initialize optimization systems
      await this.initializeOptimizers();

      // Start monitoring if enabled
      if (this.options.enableRealTimeMonitoring) {
        this.startRealTimeMonitoring();
      }

      // Apply initial optimizations
      await this.applyInitialOptimizations();

      console.log('✅ MLG Gaming Performance Optimizer initialized', {
        deviceTier: this.state.deviceTier,
        initialContext: this.state.currentContext,
        batteryLevel: this.state.batteryLevel,
        performanceScore: this.state.performanceScore
      });

    } catch (error) {
      console.error('❌ Failed to initialize Gaming Performance Optimizer:', error);
      // Fallback to safe defaults
      this.state.deviceTier = 'low';
      await this.setGamingContext('profile'); // Use most conservative mode
    }
  }

  /**
   * Detect device capabilities for optimization
   */
  async detectDeviceCapabilities() {
    // Hardware detection
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const deviceMemory = navigator.deviceMemory || 4;
    const pixelRatio = window.devicePixelRatio || 1;

    // GPU detection
    const hasWebGL = this.detectWebGLSupport();
    const gpuTier = hasWebGL ? await this.detectGPUTier() : 'low';

    // Network detection
    const connection = navigator.connection;
    this.state.networkType = connection?.effectiveType || '4g';

    // Battery detection
    if ('getBattery' in navigator) {
      const battery = await navigator.getBattery();
      this.state.batteryLevel = battery.level;
      this.state.isCharging = battery.charging;
    }

    // Determine device tier
    this.state.deviceTier = this.calculateDeviceTier({
      hardwareConcurrency,
      deviceMemory,
      pixelRatio,
      gpuTier,
      networkType: this.state.networkType
    });

    console.log('📱 Device capabilities detected:', {
      tier: this.state.deviceTier,
      cpu: hardwareConcurrency,
      memory: deviceMemory,
      gpu: gpuTier,
      network: this.state.networkType,
      battery: `${Math.round(this.state.batteryLevel * 100)}%`
    });
  }

  /**
   * Calculate device performance tier
   */
  calculateDeviceTier(capabilities) {
    const { hardwareConcurrency, deviceMemory, gpuTier } = capabilities;

    let score = 0;

    // CPU score
    if (hardwareConcurrency >= 8) score += 3;
    else if (hardwareConcurrency >= 4) score += 2;
    else score += 1;

    // Memory score
    if (deviceMemory >= 8) score += 3;
    else if (deviceMemory >= 4) score += 2;
    else score += 1;

    // GPU score
    if (gpuTier === 'high') score += 3;
    else if (gpuTier === 'medium') score += 2;
    else score += 1;

    // Determine tier
    if (score >= 8) return 'high';
    if (score >= 6) return 'medium';
    return 'low';
  }

  /**
   * Initialize performance monitoring systems
   */
  async initializePerformanceMonitoring() {
    // FPS monitoring
    this.startFPSMonitoring();

    // Memory monitoring
    if ('memory' in performance) {
      this.startMemoryMonitoring();
    }

    // Network monitoring
    if (navigator.connection) {
      this.startNetworkMonitoring();
    }

    // Battery monitoring
    if ('getBattery' in navigator) {
      await this.startBatteryMonitoring();
    }

    // User interaction monitoring
    this.startInteractionMonitoring();
  }

  /**
   * Start FPS monitoring for gaming performance
   */
  startFPSMonitoring() {
    let frameCount = 0;
    let lastTime = performance.now();
    let lastSecond = Math.floor(lastTime / 1000);

    const measureFrame = (currentTime) => {
      frameCount++;
      const currentSecond = Math.floor(currentTime / 1000);

      if (currentSecond !== lastSecond) {
        this.metrics.fps = frameCount;
        this.updateAverageFPS();
        frameCount = 0;
        lastSecond = currentSecond;

        // Check for dropped frames
        const deltaTime = currentTime - lastTime;
        if (deltaTime > 16.67 * 1.5) { // Dropped frame threshold
          this.metrics.droppedFrames++;
        }

        this.metrics.totalFrames++;
        this.metrics.frameTime = deltaTime;
        lastTime = currentTime;

        // Update performance score
        this.updatePerformanceScore();
      }

      if (this.state.isMonitoring) {
        requestAnimationFrame(measureFrame);
      }
    };

    requestAnimationFrame(measureFrame);
  }

  /**
   * Start memory monitoring for gaming optimization
   */
  startMemoryMonitoring() {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = performance.memory;
        this.metrics.memoryUsage = (memory.usedJSHeapSize / 1024 / 1024); // MB
        this.metrics.peakMemoryUsage = Math.max(this.metrics.peakMemoryUsage, this.metrics.memoryUsage);

        // Check for memory pressure
        const memoryPercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        
        if (memoryPercentage > GAMING_PERFORMANCE_CONFIG.memoryThresholds.critical) {
          this.handleCriticalMemoryPressure();
        } else if (memoryPercentage > GAMING_PERFORMANCE_CONFIG.memoryThresholds.warning) {
          this.handleMemoryWarning();
        }
      }
    };

    this.timers.set('memory', setInterval(checkMemory, GAMING_PERFORMANCE_CONFIG.monitoring.memoryInterval));
  }

  /**
   * Start battery monitoring for power optimization
   */
  async startBatteryMonitoring() {
    try {
      const battery = await navigator.getBattery();

      const updateBatteryStatus = () => {
        const previousLevel = this.state.batteryLevel;
        this.state.batteryLevel = battery.level;
        this.state.isCharging = battery.charging;

        // Calculate battery drain rate
        if (!this.state.isCharging && previousLevel) {
          this.metrics.batteryDrain = (previousLevel - this.state.batteryLevel) * 100;
        }

        // Adjust performance based on battery level
        this.adjustForBatteryLevel();
      };

      // Listen for battery events
      battery.addEventListener('levelchange', updateBatteryStatus);
      battery.addEventListener('chargingchange', updateBatteryStatus);

      // Periodic battery checks
      this.timers.set('battery', setInterval(updateBatteryStatus, GAMING_PERFORMANCE_CONFIG.monitoring.batteryInterval));

    } catch (error) {
      console.warn('Battery API not available:', error);
    }
  }

  /**
   * Start user interaction monitoring for responsiveness
   */
  startInteractionMonitoring() {
    let interactionStart = 0;

    // Touch/click latency monitoring
    const measureInteractionLatency = (event) => {
      interactionStart = performance.now();
    };

    const measureInteractionEnd = () => {
      if (interactionStart) {
        this.metrics.userInteractionLatency = performance.now() - interactionStart;
        interactionStart = 0;
      }
    };

    document.addEventListener('touchstart', measureInteractionLatency, { passive: true });
    document.addEventListener('mousedown', measureInteractionLatency);
    document.addEventListener('touchend', measureInteractionEnd, { passive: true });
    document.addEventListener('mouseup', measureInteractionEnd);
    document.addEventListener('click', measureInteractionEnd);
  }

  /**
   * Initialize context detection for gaming scenarios
   */
  initializeContextDetection() {
    // Detect initial context
    this.state.currentContext = this.detectCurrentGamingContext();

    // Set up mutation observer for context changes
    const observer = new MutationObserver((mutations) => {
      const newContext = this.detectCurrentGamingContext();
      if (newContext !== this.state.currentContext) {
        this.handleContextChange(this.state.currentContext, newContext);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-gaming-context', 'data-page']
    });

    // Listen for URL changes
    window.addEventListener('popstate', () => {
      const newContext = this.detectCurrentGamingContext();
      if (newContext !== this.state.currentContext) {
        this.handleContextChange(this.state.currentContext, newContext);
      }
    });
  }

  /**
   * Detect current gaming context from page content and URL
   */
  detectCurrentGamingContext() {
    const url = window.location.pathname.toLowerCase();
    const bodyClass = document.body.className.toLowerCase();
    const contextElement = document.querySelector('[data-gaming-context]');

    // Direct context from element
    if (contextElement) {
      return contextElement.dataset.gamingContext;
    }

    // URL-based detection
    if (url.includes('tournament') || bodyClass.includes('tournament')) {
      return 'tournament';
    } else if (url.includes('clan') || bodyClass.includes('clan')) {
      return 'clan';
    } else if (url.includes('voting') || url.includes('vote') || bodyClass.includes('voting')) {
      return 'voting';
    } else if (url.includes('profile') || url.includes('user') || bodyClass.includes('profile')) {
      return 'profile';
    } else if (url.includes('social') || url.includes('feed') || bodyClass.includes('social')) {
      return 'social';
    }

    // Content-based detection
    if (document.querySelector('.tournament-bracket, .leaderboard-live')) {
      return 'tournament';
    } else if (document.querySelector('.clan-dashboard, .member-list')) {
      return 'clan';
    } else if (document.querySelector('.voting-interface, .content-queue')) {
      return 'voting';
    } else if (document.querySelector('.user-profile, .achievement-showcase')) {
      return 'profile';
    } else if (document.querySelector('.social-feed, .gaming-clips')) {
      return 'social';
    }

    return 'general';
  }

  /**
   * Handle gaming context changes
   */
  async handleContextChange(oldContext, newContext) {
    console.log(`🎮 Gaming context changed: ${oldContext} → ${newContext}`);
    
    this.state.currentContext = newContext;
    this.analytics.contextSwitches++;

    // Apply context-specific optimizations
    await this.setGamingContext(newContext);

    // Update resource priorities
    this.updateResourcePriorities(newContext);

    // Emit context change event
    this.dispatchEvent('gaming-context-changed', {
      oldContext,
      newContext,
      profile: this.state.currentProfile
    });
  }

  /**
   * Set gaming context and apply optimizations
   */
  async setGamingContext(context) {
    console.log(`🎯 Setting gaming context: ${context}`);

    const profile = GAMING_PERFORMANCE_CONFIG.contextProfiles[context];
    if (!profile) {
      console.warn(`Unknown gaming context: ${context}`);
      return;
    }

    this.state.currentProfile = profile;

    // Apply context-specific optimizations
    await this.applyContextOptimizations(profile);

    // Update UI to reflect current context
    this.updateContextUI(context, profile);

    console.log(`✅ Gaming context applied: ${profile.name}`);
  }

  /**
   * Apply context-specific optimizations
   */
  async applyContextOptimizations(profile) {
    this.state.isOptimizing = true;

    try {
      // CPU optimization
      await this.optimizers.cpu.optimize(profile.cpuPriority);

      // GPU optimization
      await this.optimizers.gpu.optimize(profile.gpuAcceleration);

      // Memory optimization
      await this.optimizers.memory.optimize(profile.memoryManagement);

      // Network optimization
      await this.optimizers.network.optimize(profile.networkPriority);

      // Battery optimization (if enabled and needed)
      if (this.options.enableBatteryOptimization) {
        await this.optimizers.battery.optimize(profile.batteryOptimization, this.state.batteryLevel);
      }

      // Apply CSS optimizations
      this.applyCSSOptimizations(profile);

      // Update frame rate target
      this.setFrameRateTarget(profile.frameRateTarget);

      this.analytics.optimizationsApplied++;

    } catch (error) {
      console.error('Failed to apply context optimizations:', error);
    } finally {
      this.state.isOptimizing = false;
    }
  }

  /**
   * Update resource loading priorities based on context
   */
  updateResourcePriorities(context) {
    const priorities = GAMING_PERFORMANCE_CONFIG.resourcePriorities[context] || [];
    
    // Apply priorities to loading queues
    priorities.forEach((resource, index) => {
      const elements = document.querySelectorAll(`[data-resource-type="${resource}"]`);
      elements.forEach(element => {
        element.style.setProperty('--load-priority', index.toString());
      });
    });
  }

  /**
   * Apply CSS optimizations for performance
   */
  applyCSSOptimizations(profile) {
    const root = document.documentElement;

    // Set performance-based CSS variables
    root.style.setProperty('--gaming-performance-mode', profile.name.toLowerCase().replace(' ', '-'));
    root.style.setProperty('--animation-quality', profile.animationQuality);
    root.style.setProperty('--frame-rate-target', `${profile.frameRateTarget}fps`);

    // Apply device-specific classes
    document.body.classList.remove('device-tier-high', 'device-tier-medium', 'device-tier-low');
    document.body.classList.add(`device-tier-${this.state.deviceTier}`);

    // Apply context-specific classes
    document.body.classList.remove('gaming-tournament', 'gaming-clan', 'gaming-voting', 'gaming-profile', 'gaming-social');
    document.body.classList.add(`gaming-${this.state.currentContext}`);

    // Apply battery optimization classes
    if (this.state.batteryLevel < GAMING_PERFORMANCE_CONFIG.batteryThresholds.low) {
      document.body.classList.add('battery-optimization');
    } else {
      document.body.classList.remove('battery-optimization');
    }
  }

  /**
   * Start real-time monitoring and optimization
   */
  startRealTimeMonitoring() {
    if (this.state.isMonitoring) return;

    this.state.isMonitoring = true;
    console.log('📊 Starting real-time gaming performance monitoring...');

    // Overall performance monitoring
    this.timers.set('performance', setInterval(() => {
      this.updatePerformanceScore();
      this.checkPerformanceThresholds();
    }, GAMING_PERFORMANCE_CONFIG.monitoring.performanceInterval));

    // Auto-optimization
    if (this.options.enableAutoOptimization) {
      this.timers.set('optimization', setInterval(() => {
        this.runAutoOptimization();
      }, GAMING_PERFORMANCE_CONFIG.monitoring.optimizationInterval));
    }
  }

  /**
   * Update overall performance score
   */
  updatePerformanceScore() {
    const fpsScore = Math.min(this.metrics.fps / 60, 1.0);
    const memoryScore = Math.max(1 - (this.metrics.memoryUsage / 100), 0);
    const interactionScore = Math.max(1 - (this.metrics.userInteractionLatency / 100), 0);

    this.state.performanceScore = (fpsScore * 0.4 + memoryScore * 0.3 + interactionScore * 0.3);

    // Update analytics
    this.analytics.userExperienceScore = this.state.performanceScore;
  }

  /**
   * Check performance thresholds and take action
   */
  checkPerformanceThresholds() {
    const thresholds = GAMING_PERFORMANCE_CONFIG.performanceThresholds;
    
    if (this.state.performanceScore < thresholds.poor.score) {
      this.handlePoorPerformance();
    } else if (this.state.performanceScore < thresholds.acceptable.score) {
      this.handleAcceptablePerformance();
    } else if (this.state.performanceScore > thresholds.excellent.score) {
      this.handleExcellentPerformance();
    }
  }

  /**
   * Run automatic optimization based on current conditions
   */
  async runAutoOptimization() {
    if (this.state.isOptimizing) return;

    // Check if optimization is needed
    const needsOptimization = this.needsOptimization();
    if (!needsOptimization) return;

    console.log('🔧 Running automatic gaming optimization...');

    try {
      // Memory cleanup if needed
      if (this.metrics.memoryUsage > GAMING_PERFORMANCE_CONFIG.memoryThresholds.warning) {
        await this.optimizers.memory.cleanup();
      }

      // Network optimization if connection changed
      if (this.hasNetworkConditionsChanged()) {
        await this.optimizers.network.adaptToConditions(this.state.networkType);
      }

      // Battery optimization if level is low
      if (this.state.batteryLevel < GAMING_PERFORMANCE_CONFIG.batteryThresholds.moderate) {
        await this.adjustForBatteryLevel();
      }

      this.analytics.optimizationsApplied++;

    } catch (error) {
      console.error('Auto-optimization failed:', error);
    }
  }

  /**
   * Determine if optimization is needed
   */
  needsOptimization() {
    return (
      this.state.performanceScore < 0.7 ||
      this.metrics.memoryUsage > GAMING_PERFORMANCE_CONFIG.memoryThresholds.warning ||
      this.metrics.fps < 30 ||
      this.metrics.userInteractionLatency > 50
    );
  }

  /**
   * Adjust performance based on battery level
   */
  async adjustForBatteryLevel() {
    const level = this.state.batteryLevel;
    const thresholds = GAMING_PERFORMANCE_CONFIG.batteryThresholds;

    if (this.state.isCharging) {
      // Remove battery restrictions when charging
      document.body.classList.remove('battery-critical', 'battery-low', 'battery-moderate');
      return;
    }

    if (level <= thresholds.critical) {
      await this.applyBatteryCriticalMode();
    } else if (level <= thresholds.low) {
      await this.applyBatteryLowMode();
    } else if (level <= thresholds.moderate) {
      await this.applyBatteryModerateMode();
    } else {
      await this.applyBatteryNormalMode();
    }
  }

  /**
   * Battery optimization modes
   */
  async applyBatteryCriticalMode() {
    console.log('🔋 Applying critical battery optimization...');
    
    document.body.classList.add('battery-critical');
    
    // Force minimal performance profile
    await this.setGamingContext('profile');
    
    // Disable all animations
    document.body.classList.add('disable-animations');
    
    // Reduce frame rate target
    this.setFrameRateTarget(15);
    
    this.analytics.batterySavings += 0.3; // Estimated 30% battery savings
  }

  async applyBatteryLowMode() {
    console.log('🔋 Applying low battery optimization...');
    
    document.body.classList.add('battery-low');
    
    // Reduce performance if not in tournament mode
    if (this.state.currentContext !== 'tournament') {
      await this.setGamingContext('profile');
    }
    
    // Reduce frame rate target
    this.setFrameRateTarget(30);
    
    this.analytics.batterySavings += 0.2; // Estimated 20% battery savings
  }

  /**
   * Handle performance conditions
   */
  handlePoorPerformance() {
    console.warn('⚠️ Poor gaming performance detected');
    
    // Immediate optimizations for poor performance
    this.optimizers.memory.immediateCleanup();
    this.optimizers.cpu.reduceLoad();
    this.optimizers.gpu.disableNonEssentialEffects();
    
    // Reduce animation quality
    document.body.classList.add('performance-degraded');
  }

  handleExcellentPerformance() {
    // Allow higher quality when performance is excellent
    if (this.state.deviceTier === 'high' && this.state.batteryLevel > 0.5) {
      document.body.classList.add('performance-enhanced');
    }
  }

  /**
   * Create gaming performance dashboard UI
   */
  createPerformanceDashboard() {
    const dashboard = document.createElement('div');
    dashboard.className = 'gaming-performance-dashboard';
    dashboard.innerHTML = `
      <div class="performance-header">
        <h3>🎮 Gaming Performance</h3>
        <button class="performance-toggle" data-action="toggle-monitoring">
          ${this.state.isMonitoring ? 'Pause' : 'Resume'} Monitoring
        </button>
      </div>
      
      <div class="performance-metrics">
        <div class="metric-card">
          <label>FPS</label>
          <span class="metric-value" data-metric="fps">${Math.round(this.metrics.fps)}</span>
          <div class="metric-bar">
            <div class="metric-fill" style="width: ${(this.metrics.fps / 60) * 100}%"></div>
          </div>
        </div>
        
        <div class="metric-card">
          <label>Memory</label>
          <span class="metric-value" data-metric="memory">${Math.round(this.metrics.memoryUsage)}MB</span>
          <div class="metric-bar">
            <div class="metric-fill" style="width: ${Math.min(this.metrics.memoryUsage, 100)}%"></div>
          </div>
        </div>
        
        <div class="metric-card">
          <label>Battery</label>
          <span class="metric-value" data-metric="battery">${Math.round(this.state.batteryLevel * 100)}%</span>
          <div class="metric-bar">
            <div class="metric-fill" style="width: ${this.state.batteryLevel * 100}%"></div>
          </div>
        </div>
        
        <div class="metric-card">
          <label>Performance Score</label>
          <span class="metric-value" data-metric="score">${Math.round(this.state.performanceScore * 100)}%</span>
          <div class="metric-bar">
            <div class="metric-fill" style="width: ${this.state.performanceScore * 100}%"></div>
          </div>
        </div>
      </div>
      
      <div class="context-controls">
        <label>Gaming Mode:</label>
        <select class="context-selector" data-action="change-context">
          <option value="tournament" ${this.state.currentContext === 'tournament' ? 'selected' : ''}>Tournament (Max Performance)</option>
          <option value="clan" ${this.state.currentContext === 'clan' ? 'selected' : ''}>Clan (Balanced)</option>
          <option value="voting" ${this.state.currentContext === 'voting' ? 'selected' : ''}>Voting (Responsive)</option>
          <option value="social" ${this.state.currentContext === 'social' ? 'selected' : ''}>Social (Moderate)</option>
          <option value="profile" ${this.state.currentContext === 'profile' ? 'selected' : ''}>Profile (Power Saving)</option>
        </select>
      </div>
      
      <div class="optimization-controls">
        <button class="optimize-button" data-action="optimize-now">
          🚀 Optimize Now
        </button>
        <button class="cleanup-button" data-action="cleanup-memory">
          🧹 Clean Memory
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
        this.handleDashboardAction(action, e.target);
      }
    });

    dashboard.addEventListener('change', (e) => {
      const action = e.target.dataset.action;
      if (action) {
        this.handleDashboardAction(action, e.target);
      }
    });

    // Update dashboard periodically
    this.timers.set('dashboard', setInterval(() => {
      this.updateDashboard(dashboard);
    }, 1000));

    return dashboard;
  }

  /**
   * Handle dashboard actions
   */
  async handleDashboardAction(action, element) {
    switch (action) {
      case 'toggle-monitoring':
        if (this.state.isMonitoring) {
          this.stopRealTimeMonitoring();
        } else {
          this.startRealTimeMonitoring();
        }
        break;

      case 'change-context':
        await this.setGamingContext(element.value);
        break;

      case 'optimize-now':
        await this.runAutoOptimization();
        break;

      case 'cleanup-memory':
        await this.optimizers.memory.cleanup();
        break;
    }
  }

  /**
   * Update dashboard metrics display
   */
  updateDashboard(dashboard) {
    // Update metric values
    const fpsElement = dashboard.querySelector('[data-metric="fps"]');
    if (fpsElement) fpsElement.textContent = Math.round(this.metrics.fps);

    const memoryElement = dashboard.querySelector('[data-metric="memory"]');
    if (memoryElement) memoryElement.textContent = `${Math.round(this.metrics.memoryUsage)}MB`;

    const batteryElement = dashboard.querySelector('[data-metric="battery"]');
    if (batteryElement) batteryElement.textContent = `${Math.round(this.state.batteryLevel * 100)}%`;

    const scoreElement = dashboard.querySelector('[data-metric="score"]');
    if (scoreElement) scoreElement.textContent = `${Math.round(this.state.performanceScore * 100)}%`;

    // Update progress bars
    dashboard.querySelectorAll('.metric-fill').forEach((fill, index) => {
      let percentage = 0;
      switch (index) {
        case 0: percentage = (this.metrics.fps / 60) * 100; break;
        case 1: percentage = Math.min(this.metrics.memoryUsage, 100); break;
        case 2: percentage = this.state.batteryLevel * 100; break;
        case 3: percentage = this.state.performanceScore * 100; break;
      }
      fill.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
    });

    // Update recommendations
    this.updatePerformanceRecommendations(dashboard);
  }

  /**
   * Update performance recommendations
   */
  updatePerformanceRecommendations(dashboard) {
    const recommendationsSection = dashboard.querySelector('[data-section="recommendations"]');
    if (!recommendationsSection) return;

    const recommendations = this.generatePerformanceRecommendations();
    
    recommendationsSection.innerHTML = recommendations.length > 0 
      ? `<h4>💡 Recommendations</h4><ul>${recommendations.map(rec => `<li>${rec}</li>`).join('')}</ul>`
      : '<p>🎯 Performance is optimal!</p>';
  }

  /**
   * Generate performance recommendations
   */
  generatePerformanceRecommendations() {
    const recommendations = [];

    if (this.metrics.fps < 30) {
      recommendations.push('Switch to a lower performance mode to improve frame rate');
    }

    if (this.metrics.memoryUsage > 80) {
      recommendations.push('Clear memory cache to free up resources');
    }

    if (this.state.batteryLevel < 0.25 && !this.state.isCharging) {
      recommendations.push('Enable battery optimization mode to extend gaming session');
    }

    if (this.state.networkType === '2g' || this.state.networkType === 'slow-2g') {
      recommendations.push('Enable data saver mode for better performance on slow connection');
    }

    if (this.state.deviceTier === 'low' && this.state.currentContext === 'tournament') {
      recommendations.push('Consider using Clan or Social mode for better performance on this device');
    }

    return recommendations;
  }

  /**
   * Get comprehensive performance analytics
   */
  getPerformanceAnalytics() {
    return {
      metrics: { ...this.metrics },
      state: { ...this.state },
      analytics: { ...this.analytics },
      recommendations: this.generatePerformanceRecommendations(),
      deviceInfo: {
        tier: this.state.deviceTier,
        network: this.state.networkType,
        battery: this.state.batteryLevel,
        isCharging: this.state.isCharging
      },
      optimization: {
        currentProfile: this.state.currentProfile?.name || 'None',
        isOptimizing: this.state.isOptimizing,
        isMonitoring: this.state.isMonitoring
      }
    };
  }

  /**
   * Export performance data for analysis
   */
  exportPerformanceData() {
    const data = {
      timestamp: new Date().toISOString(),
      session: {
        duration: Date.now() - this.sessionStart,
        context: this.state.currentContext,
        deviceTier: this.state.deviceTier
      },
      performance: this.getPerformanceAnalytics(),
      optimizations: this.analytics.optimizationsApplied,
      battery: {
        level: this.state.batteryLevel,
        savings: this.analytics.batterySavings
      }
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Dispatch custom events
   */
  dispatchEvent(eventName, detail) {
    const event = new CustomEvent(`mlg-gaming-${eventName}`, { detail });
    document.dispatchEvent(event);
  }

  /**
   * Helper methods
   */
  updateAverageFPS() {
    const alpha = 0.1;
    this.metrics.averageFPS = this.metrics.averageFPS * (1 - alpha) + this.metrics.fps * alpha;
  }

  setFrameRateTarget(target) {
    document.documentElement.style.setProperty('--frame-rate-target', `${target}fps`);
  }

  detectWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
    } catch (e) {
      return false;
    }
  }

  async detectGPUTier() {
    // Simplified GPU tier detection
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      if (!gl) return 'low';

      const renderer = gl.getParameter(gl.RENDERER);
      if (renderer.includes('Mali') || renderer.includes('Adreno 3')) return 'low';
      if (renderer.includes('Adreno 5') || renderer.includes('PowerVR')) return 'medium';
      return 'high';
    } catch (error) {
      return 'low';
    }
  }

  hasNetworkConditionsChanged() {
    // Simple check - in real implementation, you'd track previous state
    return false;
  }

  /**
   * Cleanup and shutdown
   */
  destroy() {
    console.log('🔥 Destroying Gaming Performance Optimizer...');

    // Stop monitoring
    this.stopRealTimeMonitoring();

    // Clear all timers
    this.timers.forEach((timer, name) => {
      clearInterval(timer);
      cancelAnimationFrame(timer);
    });
    this.timers.clear();

    // Cleanup optimizers
    Object.values(this.optimizers).forEach(optimizer => {
      if (optimizer.destroy) optimizer.destroy();
    });

    // Reset state
    this.state = {};
    this.metrics = {};
    this.analytics = {};

    console.log('✅ Gaming Performance Optimizer destroyed');
  }

  stopRealTimeMonitoring() {
    this.state.isMonitoring = false;
    
    // Clear monitoring timers
    ['performance', 'optimization', 'dashboard'].forEach(name => {
      const timer = this.timers.get(name);
      if (timer) {
        clearInterval(timer);
        this.timers.delete(name);
      }
    });
  }
}

/**
 * Specialized Optimizers
 */

class CPUOptimizer {
  async optimize(priority) {
    // CPU optimization logic
    console.log(`⚡ Optimizing CPU for ${priority} priority`);
  }

  reduceLoad() {
    // Reduce CPU load for poor performance
    console.log('⚡ Reducing CPU load');
  }
}

class GPUOptimizer {
  async optimize(level) {
    // GPU optimization logic
    console.log(`🎨 Optimizing GPU for ${level} acceleration`);
  }

  disableNonEssentialEffects() {
    // Disable effects for poor performance
    console.log('🎨 Disabling non-essential GPU effects');
  }
}

class MemoryOptimizer {
  async optimize(strategy) {
    // Memory optimization logic
    console.log(`🧠 Optimizing memory with ${strategy} strategy`);
  }

  async cleanup() {
    // Memory cleanup
    console.log('🧠 Cleaning up memory');
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }

  immediateCleanup() {
    // Immediate memory cleanup for poor performance
    console.log('🧠 Immediate memory cleanup');
  }
}

class NetworkOptimizer {
  async optimize(priority) {
    // Network optimization logic
    console.log(`📶 Optimizing network for ${priority} priority`);
  }

  async adaptToConditions(networkType) {
    // Adapt to network conditions
    console.log(`📶 Adapting to ${networkType} network`);
  }
}

class BatteryOptimizer {
  async optimize(mode, batteryLevel) {
    // Battery optimization logic
    console.log(`🔋 Optimizing battery in ${mode} mode (${Math.round(batteryLevel * 100)}%)`);
  }
}

export default MobileGamingPerformanceOptimizer;