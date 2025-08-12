/**
 * MLG.clan Mobile Navigation Performance Manager
 * 
 * Performance optimization system for mobile navigation with battery management
 * Ensures 60fps animations while conserving device resources
 * 
 * Features:
 * - Frame rate monitoring and optimization
 * - Battery-aware performance scaling
 * - Memory management for mobile devices
 * - Touch interaction optimization
 * - Scroll performance enhancement
 * - Animation quality adjustment
 * - Network-aware resource loading
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 */

/**
 * Performance Configuration
 */
const PERFORMANCE_CONFIG = {
  // Frame rate targets
  TARGET_FPS: 60,
  MIN_FPS: 30,
  FRAME_BUDGET_MS: 16.67, // 1000ms / 60fps
  
  // Performance thresholds
  HIGH_PERFORMANCE_THRESHOLD: 0.9,
  MEDIUM_PERFORMANCE_THRESHOLD: 0.6,
  LOW_PERFORMANCE_THRESHOLD: 0.3,
  
  // Battery thresholds
  CRITICAL_BATTERY: 0.15,
  LOW_BATTERY: 0.30,
  MEDIUM_BATTERY: 0.60,
  
  // Memory thresholds (MB)
  MEMORY_WARNING_THRESHOLD: 50,
  MEMORY_CRITICAL_THRESHOLD: 100,
  
  // Touch optimization
  TOUCH_DEBOUNCE_MS: 16,
  SCROLL_DEBOUNCE_MS: 10,
  GESTURE_BUFFER_SIZE: 10,
  
  // Animation settings
  REDUCED_MOTION_THRESHOLD: 0.5,
  ANIMATION_QUALITY_LEVELS: ['high', 'medium', 'low', 'minimal'],
  
  // Monitoring intervals
  PERFORMANCE_CHECK_INTERVAL: 1000,
  BATTERY_CHECK_INTERVAL: 30000,
  MEMORY_CHECK_INTERVAL: 5000
};

/**
 * Mobile Navigation Performance Manager
 */
export class MobileNavPerformance {
  constructor(navigationDrawer) {
    this.drawer = navigationDrawer;
    
    // Performance metrics
    this.metrics = {
      fps: 0,
      averageFPS: 0,
      frameTime: 0,
      droppedFrames: 0,
      totalFrames: 0,
      lastFrameTime: 0,
      performanceScore: 1.0
    };
    
    // Battery status
    this.battery = {
      level: 1.0,
      charging: false,
      chargingTime: Infinity,
      dischargingTime: Infinity,
      lastUpdate: 0
    };
    
    // Memory usage
    this.memory = {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
      estimatedUsage: 0
    };
    
    // Device capabilities
    this.device = {
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      deviceMemory: navigator.deviceMemory || 4,
      connection: null,
      pixelRatio: window.devicePixelRatio || 1,
      isLowEndDevice: false,
      supportLevel: 'high' // high, medium, low
    };
    
    // Performance state
    this.state = {
      isMonitoring: false,
      currentQuality: 'high',
      isOptimizing: false,
      shouldReduceMotion: false,
      batteryOptimized: false,
      memoryPressure: false
    };
    
    // Timing and monitoring
    this.timers = {
      performanceMonitor: null,
      batteryMonitor: null,
      memoryMonitor: null,
      frameCounter: null
    };
    
    // Event handlers
    this.eventHandlers = new Map();
    
    this.init();
  }

  /**
   * Initialize performance manager
   */
  async init() {
    console.log('⚡ Initializing Mobile Navigation Performance Manager...');
    
    try {
      // Detect device capabilities
      await this.detectDeviceCapabilities();
      
      // Setup performance monitoring
      this.setupPerformanceMonitoring();
      
      // Setup battery monitoring
      await this.setupBatteryMonitoring();
      
      // Setup memory monitoring
      this.setupMemoryMonitoring();
      
      // Setup touch optimization
      this.setupTouchOptimization();
      
      // Setup network monitoring
      this.setupNetworkMonitoring();
      
      // Apply initial optimizations
      this.applyInitialOptimizations();
      
      // Start monitoring
      this.startMonitoring();
      
      console.log('✅ Mobile Navigation Performance Manager initialized', {
        deviceSupport: this.device.supportLevel,
        isLowEndDevice: this.device.isLowEndDevice,
        initialQuality: this.state.currentQuality
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize Performance Manager:', error);
      
      // Fallback to safe defaults
      this.state.currentQuality = 'low';
      this.applyPerformanceLevel('low');
    }
  }

  /**
   * Detect device capabilities
   */
  async detectDeviceCapabilities() {
    // Hardware detection
    this.device.hardwareConcurrency = navigator.hardwareConcurrency || 4;
    this.device.deviceMemory = navigator.deviceMemory || 4;
    this.device.pixelRatio = window.devicePixelRatio || 1;
    
    // Connection detection
    if ('connection' in navigator) {
      this.device.connection = navigator.connection;
    }
    
    // Low-end device detection
    this.device.isLowEndDevice = this.detectLowEndDevice();
    
    // Determine support level
    this.device.supportLevel = this.determineSupportLevel();
    
    // GPU detection
    if (this.isWebGLSupported()) {
      this.device.gpuTier = await this.detectGPUTier();
    }
    
    console.log('📱 Device capabilities detected:', this.device);
  }

  /**
   * Detect if device is low-end
   */
  detectLowEndDevice() {
    const indicators = [
      this.device.hardwareConcurrency <= 2,
      this.device.deviceMemory <= 2,
      this.device.pixelRatio <= 1,
      !window.requestIdleCallback,
      !window.IntersectionObserver,
      navigator.userAgent.includes('Android') && navigator.userAgent.includes('Chrome/') && 
        parseInt(navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] || '0') < 80
    ];
    
    const lowEndScore = indicators.filter(Boolean).length;
    return lowEndScore >= 3;
  }

  /**
   * Determine device support level
   */
  determineSupportLevel() {
    if (this.device.isLowEndDevice) {
      return 'low';
    }
    
    if (this.device.hardwareConcurrency >= 8 && this.device.deviceMemory >= 8) {
      return 'high';
    }
    
    return 'medium';
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    let frameCount = 0;
    let lastTime = performance.now();
    let lastSecond = Math.floor(lastTime / 1000);
    
    const measureFrame = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - this.metrics.lastFrameTime;
      
      this.metrics.frameTime = deltaTime;
      this.metrics.lastFrameTime = currentTime;
      this.metrics.totalFrames++;
      
      // Count frames per second
      frameCount++;
      const currentSecond = Math.floor(currentTime / 1000);
      
      if (currentSecond !== lastSecond) {
        this.metrics.fps = frameCount;
        this.updateAverageFPS();
        frameCount = 0;
        lastSecond = currentSecond;
        
        // Check if frame was dropped
        if (deltaTime > PERFORMANCE_CONFIG.FRAME_BUDGET_MS * 1.5) {
          this.metrics.droppedFrames++;
        }
        
        // Update performance score
        this.updatePerformanceScore();
      }
      
      if (this.state.isMonitoring) {
        this.timers.frameCounter = requestAnimationFrame(measureFrame);
      }
    };
    
    this.timers.frameCounter = requestAnimationFrame(measureFrame);
  }

  /**
   * Setup battery monitoring
   */
  async setupBatteryMonitoring() {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        
        this.updateBatteryStatus(battery);
        
        // Listen for battery events
        battery.addEventListener('chargingchange', () => this.updateBatteryStatus(battery));
        battery.addEventListener('levelchange', () => this.updateBatteryStatus(battery));
        battery.addEventListener('chargingtimechange', () => this.updateBatteryStatus(battery));
        battery.addEventListener('dischargingtimechange', () => this.updateBatteryStatus(battery));
        
        // Periodic battery monitoring
        this.timers.batteryMonitor = setInterval(() => {
          this.updateBatteryStatus(battery);
          this.adjustForBatteryLevel();
        }, PERFORMANCE_CONFIG.BATTERY_CHECK_INTERVAL);
        
      } catch (error) {
        console.warn('Battery API not available:', error);
      }
    }
  }

  /**
   * Setup memory monitoring
   */
  setupMemoryMonitoring() {
    if ('memory' in performance) {
      this.timers.memoryMonitor = setInterval(() => {
        this.updateMemoryUsage();
        this.checkMemoryPressure();
      }, PERFORMANCE_CONFIG.MEMORY_CHECK_INTERVAL);
    }
  }

  /**
   * Setup touch optimization
   */
  setupTouchOptimization() {
    // Debounced touch handling
    let touchDebounceTimer;
    
    const optimizedTouchHandler = (event) => {
      clearTimeout(touchDebounceTimer);
      touchDebounceTimer = setTimeout(() => {
        this.handleOptimizedTouch(event);
      }, PERFORMANCE_CONFIG.TOUCH_DEBOUNCE_MS);
    };
    
    // Scroll optimization
    let scrollDebounceTimer;
    let isScrolling = false;
    
    const optimizedScrollHandler = (event) => {
      if (!isScrolling) {
        isScrolling = true;
        this.onScrollStart();
      }
      
      clearTimeout(scrollDebounceTimer);
      scrollDebounceTimer = setTimeout(() => {
        isScrolling = false;
        this.onScrollEnd();
      }, PERFORMANCE_CONFIG.SCROLL_DEBOUNCE_MS);
    };
    
    // Apply to drawer elements
    if (this.drawer.elements.drawer) {
      this.drawer.elements.drawer.addEventListener('touchstart', optimizedTouchHandler, { passive: true });
      this.drawer.elements.drawer.addEventListener('scroll', optimizedScrollHandler, { passive: true });
    }
  }

  /**
   * Setup network monitoring
   */
  setupNetworkMonitoring() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      const updateConnection = () => {
        this.device.connection = {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        };
        
        this.adjustForNetworkConditions();
      };
      
      connection.addEventListener('change', updateConnection);
      updateConnection();
    }
  }

  /**
   * Performance monitoring methods
   */
  updateAverageFPS() {
    const alpha = 0.1; // Smoothing factor
    this.metrics.averageFPS = this.metrics.averageFPS * (1 - alpha) + this.metrics.fps * alpha;
  }

  updatePerformanceScore() {
    const fpsRatio = Math.min(this.metrics.averageFPS / PERFORMANCE_CONFIG.TARGET_FPS, 1);
    const frameTimeRatio = Math.max(1 - (this.metrics.frameTime / (PERFORMANCE_CONFIG.FRAME_BUDGET_MS * 2)), 0);
    
    this.metrics.performanceScore = (fpsRatio * 0.7 + frameTimeRatio * 0.3);
    
    // Auto-adjust quality based on performance
    this.autoAdjustQuality();
  }

  updateBatteryStatus(battery) {
    this.battery = {
      level: battery.level,
      charging: battery.charging,
      chargingTime: battery.chargingTime,
      dischargingTime: battery.dischargingTime,
      lastUpdate: Date.now()
    };
  }

  updateMemoryUsage() {
    if ('memory' in performance) {
      const memory = performance.memory;
      this.memory = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        estimatedUsage: (memory.usedJSHeapSize / 1024 / 1024) // MB
      };
    }
  }

  /**
   * Performance adjustment methods
   */
  autoAdjustQuality() {
    const score = this.metrics.performanceScore;
    let targetQuality = this.state.currentQuality;
    
    if (score < PERFORMANCE_CONFIG.LOW_PERFORMANCE_THRESHOLD) {
      targetQuality = 'low';
    } else if (score < PERFORMANCE_CONFIG.MEDIUM_PERFORMANCE_THRESHOLD) {
      targetQuality = 'medium';
    } else if (score > PERFORMANCE_CONFIG.HIGH_PERFORMANCE_THRESHOLD) {
      targetQuality = 'high';
    }
    
    if (targetQuality !== this.state.currentQuality) {
      this.applyPerformanceLevel(targetQuality);
    }
  }

  adjustForBatteryLevel() {
    const level = this.battery.level;
    const isCharging = this.battery.charging;
    
    if (!isCharging) {
      if (level <= PERFORMANCE_CONFIG.CRITICAL_BATTERY) {
        this.applyPerformanceLevel('minimal');
        this.state.batteryOptimized = true;
      } else if (level <= PERFORMANCE_CONFIG.LOW_BATTERY) {
        this.applyPerformanceLevel('low');
        this.state.batteryOptimized = true;
      } else if (level <= PERFORMANCE_CONFIG.MEDIUM_BATTERY && this.state.batteryOptimized) {
        this.applyPerformanceLevel('medium');
      } else if (level > PERFORMANCE_CONFIG.MEDIUM_BATTERY && this.state.batteryOptimized) {
        this.state.batteryOptimized = false;
        this.autoAdjustQuality();
      }
    } else if (this.state.batteryOptimized) {
      // Restore normal performance when charging
      this.state.batteryOptimized = false;
      this.autoAdjustQuality();
    }
  }

  checkMemoryPressure() {
    const usage = this.memory.estimatedUsage;
    const previousPressure = this.state.memoryPressure;
    
    if (usage > PERFORMANCE_CONFIG.MEMORY_CRITICAL_THRESHOLD) {
      this.state.memoryPressure = true;
      this.applyMemoryOptimizations();
    } else if (usage < PERFORMANCE_CONFIG.MEMORY_WARNING_THRESHOLD && previousPressure) {
      this.state.memoryPressure = false;
      this.removeMemoryOptimizations();
    }
  }

  adjustForNetworkConditions() {
    if (!this.device.connection) return;
    
    const { effectiveType, saveData } = this.device.connection;
    
    if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
      this.applyDataSavingMode();
    } else if (effectiveType === '3g') {
      this.applyMediumDataMode();
    } else {
      this.applyHighDataMode();
    }
  }

  /**
   * Performance level application
   */
  applyPerformanceLevel(level) {
    console.log(`🎯 Applying performance level: ${level}`);
    
    this.state.currentQuality = level;
    
    const drawer = this.drawer.elements.drawer;
    if (!drawer) return;
    
    // Remove all quality classes
    PERFORMANCE_CONFIG.ANIMATION_QUALITY_LEVELS.forEach(q => {
      drawer.classList.remove(`quality-${q}`);
    });
    
    // Apply new quality class
    drawer.classList.add(`quality-${level}`);
    
    switch (level) {
      case 'high':
        this.applyHighPerformanceSettings();
        break;
      case 'medium':
        this.applyMediumPerformanceSettings();
        break;
      case 'low':
        this.applyLowPerformanceSettings();
        break;
      case 'minimal':
        this.applyMinimalPerformanceSettings();
        break;
    }
    
    // Dispatch performance change event
    this.drawer.dispatchEvent('performance-level-changed', {
      level,
      metrics: this.metrics,
      battery: this.battery
    });
  }

  applyHighPerformanceSettings() {
    const drawer = this.drawer.elements.drawer;
    
    // Enable all animations
    drawer.style.setProperty('--animation-duration', '300ms');
    drawer.classList.remove('reduced-motion');
    
    // Enable hardware acceleration
    drawer.style.willChange = 'transform, opacity';
    
    // Enable advanced effects
    this.enableAdvancedEffects();
  }

  applyMediumPerformanceSettings() {
    const drawer = this.drawer.elements.drawer;
    
    // Reduce animation duration
    drawer.style.setProperty('--animation-duration', '200ms');
    
    // Selective hardware acceleration
    drawer.style.willChange = 'transform';
    
    // Disable some effects
    this.disableNonEssentialEffects();
  }

  applyLowPerformanceSettings() {
    const drawer = this.drawer.elements.drawer;
    
    // Further reduce animations
    drawer.style.setProperty('--animation-duration', '150ms');
    drawer.classList.add('reduced-motion');
    
    // Disable hardware acceleration for some elements
    drawer.style.willChange = 'auto';
    
    // Disable most effects
    this.disableMostEffects();
  }

  applyMinimalPerformanceSettings() {
    const drawer = this.drawer.elements.drawer;
    
    // Minimal animations
    drawer.style.setProperty('--animation-duration', '100ms');
    drawer.classList.add('reduced-motion', 'minimal-animations');
    
    // No hardware acceleration
    drawer.style.willChange = 'auto';
    
    // Disable all non-essential effects
    this.disableAllEffects();
  }

  /**
   * Effect management
   */
  enableAdvancedEffects() {
    const drawer = this.drawer.elements.drawer;
    
    // Enable blur effects
    drawer.classList.add('enable-blur');
    
    // Enable shadows
    drawer.classList.add('enable-shadows');
    
    // Enable transforms
    drawer.classList.add('enable-transforms');
  }

  disableNonEssentialEffects() {
    const drawer = this.drawer.elements.drawer;
    
    // Reduce blur effects
    drawer.classList.remove('enable-blur');
    
    // Keep basic shadows
    drawer.classList.add('enable-shadows');
    
    // Keep transforms
    drawer.classList.add('enable-transforms');
  }

  disableMostEffects() {
    const drawer = this.drawer.elements.drawer;
    
    // Disable all blur effects
    drawer.classList.remove('enable-blur');
    
    // Disable shadows
    drawer.classList.remove('enable-shadows');
    
    // Keep minimal transforms
    drawer.classList.add('enable-transforms');
  }

  disableAllEffects() {
    const drawer = this.drawer.elements.drawer;
    
    // Disable everything
    drawer.classList.remove('enable-blur', 'enable-shadows', 'enable-transforms');
  }

  /**
   * Memory optimization
   */
  applyMemoryOptimizations() {
    console.log('🧠 Applying memory optimizations');
    
    // Limit animation frames
    this.limitAnimationFrames();
    
    // Clear caches
    this.clearPerformanceCaches();
    
    // Reduce concurrent animations
    this.limitConcurrentAnimations();
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }

  removeMemoryOptimizations() {
    console.log('🧠 Removing memory optimizations');
    
    // Restore normal animation frames
    this.restoreAnimationFrames();
    
    // Allow concurrent animations
    this.allowConcurrentAnimations();
  }

  /**
   * Data saving modes
   */
  applyDataSavingMode() {
    this.state.dataSavingMode = true;
    
    // Disable non-essential features
    this.disableNonEssentialFeatures();
    
    // Reduce update frequency
    this.reduceUpdateFrequency();
  }

  applyMediumDataMode() {
    this.state.dataSavingMode = false;
    
    // Enable most features
    this.enableMostFeatures();
    
    // Normal update frequency
    this.normalUpdateFrequency();
  }

  applyHighDataMode() {
    this.state.dataSavingMode = false;
    
    // Enable all features
    this.enableAllFeatures();
    
    // High update frequency
    this.highUpdateFrequency();
  }

  /**
   * Touch handling optimization
   */
  handleOptimizedTouch(event) {
    // Optimized touch event handling
    if (this.state.memoryPressure) {
      // Skip non-essential touch processing
      return;
    }
    
    // Process touch event efficiently
    this.processTouchEvent(event);
  }

  processTouchEvent(event) {
    // Efficient touch event processing
    const touch = event.touches?.[0];
    if (!touch) return;
    
    // Update touch metrics
    this.updateTouchMetrics(touch);
  }

  updateTouchMetrics(touch) {
    // Track touch performance
    const now = performance.now();
    
    if (this.lastTouchTime) {
      const touchLatency = now - this.lastTouchTime;
      this.metrics.touchLatency = touchLatency;
    }
    
    this.lastTouchTime = now;
  }

  onScrollStart() {
    // Optimize for scrolling
    if (this.state.currentQuality === 'high') {
      this.temporaryPerformanceReduction();
    }
  }

  onScrollEnd() {
    // Restore performance after scrolling
    if (this.temporaryReductionActive) {
      this.restorePerformanceLevel();
    }
  }

  /**
   * GPU detection and optimization
   */
  isWebGLSupported() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
    } catch (e) {
      return false;
    }
  }

  async detectGPUTier() {
    // Basic GPU tier detection
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      
      if (!gl) return 'low';
      
      const renderer = gl.getParameter(gl.RENDERER);
      const vendor = gl.getParameter(gl.VENDOR);
      
      // Simple heuristics for GPU classification
      if (renderer.includes('Mali') || renderer.includes('Adreno 3')) {
        return 'low';
      } else if (renderer.includes('Adreno 5') || renderer.includes('PowerVR')) {
        return 'medium';
      } else {
        return 'high';
      }
    } catch (error) {
      return 'low';
    }
  }

  /**
   * Utility methods for optimization
   */
  limitAnimationFrames() {
    // Reduce animation frame rate for memory conservation
    this.maxConcurrentAnimations = 3;
  }

  restoreAnimationFrames() {
    // Restore normal animation frame rate
    this.maxConcurrentAnimations = Infinity;
  }

  limitConcurrentAnimations() {
    // Limit the number of concurrent animations
    const animations = document.getAnimations();
    if (animations.length > this.maxConcurrentAnimations) {
      animations.slice(this.maxConcurrentAnimations).forEach(anim => anim.pause());
    }
  }

  allowConcurrentAnimations() {
    // Allow all animations to run
    this.maxConcurrentAnimations = Infinity;
  }

  clearPerformanceCaches() {
    // Clear various performance caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('performance') || name.includes('temp')) {
            caches.delete(name);
          }
        });
      });
    }
  }

  temporaryPerformanceReduction() {
    // Temporarily reduce performance during intensive operations
    this.previousQuality = this.state.currentQuality;
    this.temporaryReductionActive = true;
    
    const reducedQuality = this.state.currentQuality === 'high' ? 'medium' : 'low';
    this.applyPerformanceLevel(reducedQuality);
  }

  restorePerformanceLevel() {
    // Restore previous performance level
    if (this.temporaryReductionActive && this.previousQuality) {
      this.applyPerformanceLevel(this.previousQuality);
      this.temporaryReductionActive = false;
    }
  }

  /**
   * Feature management
   */
  disableNonEssentialFeatures() {
    // Disable features that consume resources
    this.drawer.options.enableNotifications = false;
    this.drawer.options.enableVoiceControl = false;
  }

  enableMostFeatures() {
    // Enable most features
    this.drawer.options.enableNotifications = true;
  }

  enableAllFeatures() {
    // Enable all features
    this.drawer.options.enableNotifications = true;
    this.drawer.options.enableVoiceControl = true;
  }

  reduceUpdateFrequency() {
    // Reduce update frequency to save bandwidth and battery
    clearInterval(this.timers.performanceMonitor);
    this.timers.performanceMonitor = setInterval(() => {
      this.checkPerformance();
    }, PERFORMANCE_CONFIG.PERFORMANCE_CHECK_INTERVAL * 2);
  }

  normalUpdateFrequency() {
    // Normal update frequency
    clearInterval(this.timers.performanceMonitor);
    this.timers.performanceMonitor = setInterval(() => {
      this.checkPerformance();
    }, PERFORMANCE_CONFIG.PERFORMANCE_CHECK_INTERVAL);
  }

  highUpdateFrequency() {
    // High update frequency for better responsiveness
    clearInterval(this.timers.performanceMonitor);
    this.timers.performanceMonitor = setInterval(() => {
      this.checkPerformance();
    }, PERFORMANCE_CONFIG.PERFORMANCE_CHECK_INTERVAL / 2);
  }

  /**
   * Initial optimizations
   */
  applyInitialOptimizations() {
    // Apply optimizations based on device capabilities
    if (this.device.isLowEndDevice) {
      this.applyPerformanceLevel('low');
    } else if (this.device.supportLevel === 'medium') {
      this.applyPerformanceLevel('medium');
    } else {
      this.applyPerformanceLevel('high');
    }
    
    // Apply CSS custom properties for performance
    this.applyCSSOptimizations();
  }

  applyCSSOptimizations() {
    const root = document.documentElement;
    
    // Set performance-based CSS variables
    root.style.setProperty('--device-performance', this.device.supportLevel);
    root.style.setProperty('--animation-quality', this.state.currentQuality);
    
    if (this.device.isLowEndDevice) {
      root.classList.add('low-end-device');
    }
  }

  /**
   * Monitoring control
   */
  startMonitoring() {
    this.state.isMonitoring = true;
    
    // Start general performance monitoring
    this.timers.performanceMonitor = setInterval(() => {
      this.checkPerformance();
    }, PERFORMANCE_CONFIG.PERFORMANCE_CHECK_INTERVAL);
  }

  stopMonitoring() {
    this.state.isMonitoring = false;
    
    // Clear all timers
    Object.values(this.timers).forEach(timer => {
      if (timer) {
        clearInterval(timer);
        cancelAnimationFrame(timer);
      }
    });
  }

  checkPerformance() {
    // Comprehensive performance check
    this.updatePerformanceScore();
    
    if (this.metrics.performanceScore < PERFORMANCE_CONFIG.LOW_PERFORMANCE_THRESHOLD) {
      console.warn('⚠️ Low performance detected', this.metrics);
    }
  }

  /**
   * Public API
   */
  getMetrics() {
    return {
      ...this.metrics,
      battery: this.battery,
      memory: this.memory,
      device: this.device,
      state: this.state
    };
  }

  getCurrentQuality() {
    return this.state.currentQuality;
  }

  forceQuality(level) {
    if (PERFORMANCE_CONFIG.ANIMATION_QUALITY_LEVELS.includes(level)) {
      this.applyPerformanceLevel(level);
      this.state.isOptimizing = false; // Disable auto-optimization
    }
  }

  enableAutoOptimization() {
    this.state.isOptimizing = true;
  }

  disableAutoOptimization() {
    this.state.isOptimizing = false;
  }

  /**
   * Cleanup
   */
  destroy() {
    console.log('🔥 Destroying Mobile Navigation Performance Manager...');
    
    this.stopMonitoring();
    
    // Clear all event handlers
    this.eventHandlers.forEach((handler, element) => {
      element.removeEventListener('touchstart', handler);
      element.removeEventListener('scroll', handler);
    });
    
    // Reset state
    this.metrics = {};
    this.battery = {};
    this.memory = {};
    this.device = {};
    this.state = {};
    
    console.log('✅ Mobile Navigation Performance Manager destroyed');
  }
}

export default MobileNavPerformance;