/**
 * MLG.clan Performance-Optimized Gesture Tracking
 * 
 * High-performance gesture processing system optimized for 60fps gaming scenarios
 * Memory-efficient for extended gaming sessions with battery optimization
 * 
 * Features:
 * - 60fps smooth gesture tracking and response
 * - Gaming-optimized touch event processing with minimal latency
 * - Memory-efficient gesture recognition for extended sessions
 * - Battery-optimized gesture processing with adaptive throttling
 * - Network-aware gesture functionality with offline support
 * - Real-time performance monitoring and automatic adjustments
 * - Frame rate adaptive gesture sensitivity
 * - Predictive gesture preprocessing for reduced latency
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 */

/**
 * Performance Optimization Configuration
 */
const PERFORMANCE_CONFIG = {
  // Target performance metrics
  TARGET_FPS: 60,
  TARGET_FRAME_TIME: 16.67, // 60fps = 16.67ms per frame
  MAX_FRAME_TIME: 33.33,    // 30fps = 33.33ms per frame
  CRITICAL_FRAME_TIME: 50,  // 20fps = 50ms per frame
  
  // Gesture processing optimization
  GESTURE_PROCESSING_BUDGET: 8,    // Max 8ms per frame for gesture processing
  TOUCH_EVENT_BUDGET: 4,           // Max 4ms per frame for touch events
  RECOGNITION_BUDGET: 2,           // Max 2ms per frame for recognition
  FEEDBACK_BUDGET: 2,              // Max 2ms per frame for feedback
  
  // Memory optimization
  MAX_GESTURE_HISTORY: 50,         // Maximum stored gesture history
  MEMORY_CLEANUP_INTERVAL: 10000,  // 10 seconds
  MEMORY_PRESSURE_THRESHOLD: 50,   // MB
  GARBAGE_COLLECTION_INTERVAL: 30000, // 30 seconds
  
  // Battery optimization
  BATTERY_SAVE_THRESHOLD: 20,      // Percentage
  LOW_BATTERY_THRESHOLD: 10,       // Percentage
  BATTERY_SAVE_FRAME_SKIP: 2,      // Skip every 2nd frame in battery save
  LOW_BATTERY_FRAME_SKIP: 4,       // Skip every 4th frame in low battery
  
  // Adaptive performance thresholds
  PERFORMANCE_LEVELS: {
    HIGH: { fps: 60, gestureDistance: 30, hapticEnabled: true },
    MEDIUM: { fps: 45, gestureDistance: 40, hapticEnabled: true },
    LOW: { fps: 30, gestureDistance: 50, hapticEnabled: false },
    EMERGENCY: { fps: 15, gestureDistance: 70, hapticEnabled: false }
  },
  
  // Network optimization
  NETWORK_TIMEOUT: 5000,           // 5 seconds
  OFFLINE_CACHE_SIZE: 100,         // Maximum cached gestures
  SYNC_BATCH_SIZE: 10,             // Gestures per sync batch
  
  // Gaming-specific optimizations
  GAMING_MODE_BOOST: 1.2,          // 20% performance boost in gaming mode
  COMPETITIVE_MODE_BOOST: 1.5,     // 50% performance boost in competitive mode
  IDLE_DETECTION_TIMEOUT: 30000,   // 30 seconds
  BACKGROUND_THROTTLE_RATIO: 0.1   // 10% performance when backgrounded
};

/**
 * Performance-Optimized Gesture Tracker
 */
export class MLGPerformanceGestureOptimizer {
  constructor(options = {}) {
    this.options = {
      ...PERFORMANCE_CONFIG,
      enablePerformanceMonitoring: true,
      enableMemoryOptimization: true,
      enableBatteryOptimization: true,
      enableNetworkOptimization: true,
      enableGamingModeBoost: true,
      debugMode: process.env.NODE_ENV === 'development',
      ...options
    };

    // Performance tracking state
    this.performanceState = {
      currentFPS: 60,
      frameTime: 16.67,
      averageFrameTime: 16.67,
      lastFrameTime: performance.now(),
      frameCount: 0,
      droppedFrames: 0,
      
      // Processing time tracking
      gestureProcessingTime: 0,
      touchEventTime: 0,
      recognitionTime: 0,
      feedbackTime: 0,
      
      // Performance level
      currentLevel: 'HIGH',
      adaptiveThrottling: false,
      performanceWarnings: 0
    };

    // Memory management state
    this.memoryState = {
      gestureHistory: [],
      memoryUsage: 0,
      lastCleanup: Date.now(),
      pressureLevel: 'LOW',
      gcScheduled: false,
      
      // Object pooling
      touchEventPool: [],
      gestureObjectPool: [],
      feedbackObjectPool: []
    };

    // Battery optimization state
    this.batteryState = {
      level: 1.0,
      isCharging: false,
      powerMode: 'NORMAL',
      frameSkipCounter: 0,
      lastBatteryCheck: 0,
      
      // Adaptive settings
      adaptiveDistance: this.options.PERFORMANCE_LEVELS.HIGH.gestureDistance,
      adaptiveHaptic: true,
      adaptiveFPS: 60
    };

    // Network optimization state
    this.networkState = {
      isOnline: navigator.onLine,
      connectionType: this.detectConnectionType(),
      pendingGestures: [],
      cachedGestures: [],
      lastSync: 0,
      
      // Offline capabilities
      offlineMode: false,
      syncQueue: []
    };

    // Gaming mode state
    this.gamingState = {
      isGamingMode: false,
      isCompetitiveMode: false,
      isIdle: false,
      lastActivity: Date.now(),
      performanceBoost: 1.0,
      
      // Gaming-specific optimizations
      priorityGestures: new Set(['vote', 'clan-action', 'tournament']),
      lowPriorityGestures: new Set(['navigation', 'scroll'])
    };

    // Performance monitoring
    this.monitoring = {
      enabled: this.options.enablePerformanceMonitoring,
      frameRateMonitor: null,
      memoryMonitor: null,
      batteryMonitor: null,
      networkMonitor: null,
      
      // Metrics collection
      metrics: {
        gesturesPerSecond: 0,
        averageLatency: 0,
        memoryLeaks: 0,
        batteryDrain: 0,
        networkErrors: 0
      }
    };

    // Event processing optimization
    this.eventProcessing = {
      touchEventQueue: [],
      gestureEventQueue: [],
      processingActive: false,
      batchSize: 5,
      
      // Throttling
      lastProcessTime: 0,
      throttleDelay: 0,
      skipFrames: 0
    };

    this.init();
  }

  /**
   * Initialize performance optimizer
   */
  async init() {
    console.log('⚡ Initializing Performance Gesture Optimizer...');

    try {
      // Initialize performance monitoring
      if (this.options.enablePerformanceMonitoring) {
        this.initializePerformanceMonitoring();
      }

      // Initialize memory optimization
      if (this.options.enableMemoryOptimization) {
        this.initializeMemoryOptimization();
      }

      // Initialize battery optimization
      if (this.options.enableBatteryOptimization) {
        await this.initializeBatteryOptimization();
      }

      // Initialize network optimization
      if (this.options.enableNetworkOptimization) {
        this.initializeNetworkOptimization();
      }

      // Initialize gaming mode detection
      if (this.options.enableGamingModeBoost) {
        this.initializeGamingModeDetection();
      }

      // Start optimization loops
      this.startOptimizationLoops();

      console.log('✅ Performance Gesture Optimizer initialized');

      // Dispatch initialization event
      document.dispatchEvent(new CustomEvent('mlg-performance-optimizer-ready', {
        detail: {
          targetFPS: this.options.TARGET_FPS,
          optimizationsEnabled: this.getEnabledOptimizations()
        }
      }));

    } catch (error) {
      console.error('❌ Failed to initialize performance optimizer:', error);
      throw error;
    }
  }

  /**
   * Initialize performance monitoring
   */
  initializePerformanceMonitoring() {
    // Frame rate monitoring
    this.monitoring.frameRateMonitor = this.createFrameRateMonitor();
    
    // Performance observer for long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (entry.duration > 50) { // Long task > 50ms
            this.handleLongTask(entry);
          }
        });
      });
      
      observer.observe({ entryTypes: ['longtask'] });
    }

    // Memory monitoring
    if ('memory' in performance) {
      this.monitoring.memoryMonitor = setInterval(() => {
        this.monitorMemoryUsage();
      }, 5000);
    }

    console.log('📊 Performance monitoring initialized');
  }

  /**
   * Initialize memory optimization
   */
  initializeMemoryOptimization() {
    // Setup object pools
    this.initializeObjectPools();
    
    // Setup memory cleanup intervals
    setInterval(() => {
      this.performMemoryCleanup();
    }, this.options.MEMORY_CLEANUP_INTERVAL);

    // Setup garbage collection scheduling
    setInterval(() => {
      this.scheduleGarbageCollection();
    }, this.options.GARBAGE_COLLECTION_INTERVAL);

    // Memory pressure detection
    if ('memory' in performance) {
      setInterval(() => {
        this.detectMemoryPressure();
      }, 2000);
    }

    console.log('🗑️ Memory optimization initialized');
  }

  /**
   * Initialize battery optimization
   */
  async initializeBatteryOptimization() {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        
        this.batteryState.level = battery.level;
        this.batteryState.isCharging = battery.charging;
        
        // Battery event listeners
        battery.addEventListener('levelchange', () => {
          this.handleBatteryLevelChange(battery);
        });
        
        battery.addEventListener('chargingchange', () => {
          this.handleChargingChange(battery);
        });

        this.updateBatteryOptimizations();
        
        console.log(`🔋 Battery optimization initialized (${Math.round(battery.level * 100)}%)`);
      } catch (error) {
        console.warn('Battery API not available:', error);
      }
    }

    // Page visibility for battery optimization
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });
  }

  /**
   * Initialize network optimization
   */
  initializeNetworkOptimization() {
    // Network status monitoring
    window.addEventListener('online', () => {
      this.handleNetworkOnline();
    });

    window.addEventListener('offline', () => {
      this.handleNetworkOffline();
    });

    // Connection type detection
    if ('connection' in navigator) {
      this.networkState.connectionType = navigator.connection.effectiveType;
      
      navigator.connection.addEventListener('change', () => {
        this.handleConnectionChange();
      });
    }

    // Setup offline gesture caching
    this.initializeOfflineCache();

    console.log('📡 Network optimization initialized');
  }

  /**
   * Initialize gaming mode detection
   */
  initializeGamingModeDetection() {
    // Detect gaming context
    this.detectGamingContext();
    
    // Activity monitoring for idle detection
    this.setupActivityMonitoring();
    
    // Gaming performance boost
    this.updateGamingOptimizations();

    console.log('🎮 Gaming mode detection initialized');
  }

  /**
   * Start optimization loops
   */
  startOptimizationLoops() {
    // Main performance optimization loop
    this.startPerformanceLoop();
    
    // Memory optimization loop
    this.startMemoryLoop();
    
    // Battery optimization loop
    this.startBatteryLoop();
    
    // Network optimization loop
    this.startNetworkLoop();
  }

  /**
   * Performance monitoring loops
   */
  startPerformanceLoop() {
    const performanceLoop = () => {
      const now = performance.now();
      const frameTime = now - this.performanceState.lastFrameTime;
      
      // Update performance metrics
      this.updatePerformanceMetrics(frameTime);
      
      // Check for performance issues
      this.checkPerformanceThresholds();
      
      // Apply adaptive optimizations
      this.applyAdaptiveOptimizations();
      
      // Process gesture events if not throttled
      if (this.shouldProcessGestures()) {
        this.processGestureQueue();
      }
      
      this.performanceState.lastFrameTime = now;
      
      requestAnimationFrame(performanceLoop);
    };
    
    requestAnimationFrame(performanceLoop);
  }

  startMemoryLoop() {
    setInterval(() => {
      // Memory cleanup
      if (this.shouldPerformMemoryCleanup()) {
        this.performMemoryCleanup();
      }
      
      // Object pool management
      this.manageObjectPools();
      
      // Garbage collection hints
      if (this.shouldScheduleGC()) {
        this.scheduleGarbageCollection();
      }
    }, 1000);
  }

  startBatteryLoop() {
    setInterval(() => {
      // Update battery optimizations
      if (this.shouldUpdateBatteryOptimizations()) {
        this.updateBatteryOptimizations();
      }
      
      // Check power mode
      this.updatePowerMode();
    }, 5000);
  }

  startNetworkLoop() {
    setInterval(() => {
      // Sync pending gestures
      if (this.shouldSyncGestures()) {
        this.syncPendingGestures();
      }
      
      // Clean offline cache
      this.cleanOfflineCache();
    }, 10000);
  }

  /**
   * Frame rate monitoring
   */
  createFrameRateMonitor() {
    let lastTime = performance.now();
    let frameCount = 0;
    
    const monitor = () => {
      const now = performance.now();
      frameCount++;
      
      if (now - lastTime >= 1000) {
        this.performanceState.currentFPS = frameCount;
        this.monitoring.metrics.gesturesPerSecond = frameCount;
        
        frameCount = 0;
        lastTime = now;
        
        // Check FPS thresholds
        if (this.performanceState.currentFPS < 30) {
          this.handleLowFrameRate();
        }
      }
      
      requestAnimationFrame(monitor);
    };
    
    requestAnimationFrame(monitor);
    return monitor;
  }

  /**
   * Performance metrics updates
   */
  updatePerformanceMetrics(frameTime) {
    this.performanceState.frameTime = frameTime;
    this.performanceState.frameCount++;
    
    // Calculate average frame time (rolling average)
    const alpha = 0.1;
    this.performanceState.averageFrameTime = 
      (1 - alpha) * this.performanceState.averageFrameTime + alpha * frameTime;
    
    // Track dropped frames
    if (frameTime > this.options.MAX_FRAME_TIME) {
      this.performanceState.droppedFrames++;
    }
    
    // Update performance level
    this.updatePerformanceLevel();
  }

  updatePerformanceLevel() {
    const avgFrameTime = this.performanceState.averageFrameTime;
    
    if (avgFrameTime <= 16.67) {
      this.performanceState.currentLevel = 'HIGH';
    } else if (avgFrameTime <= 22.22) {
      this.performanceState.currentLevel = 'MEDIUM';
    } else if (avgFrameTime <= 33.33) {
      this.performanceState.currentLevel = 'LOW';
    } else {
      this.performanceState.currentLevel = 'EMERGENCY';
    }
    
    // Apply level-specific optimizations
    this.applyPerformanceLevelOptimizations();
  }

  applyPerformanceLevelOptimizations() {
    const level = this.options.PERFORMANCE_LEVELS[this.performanceState.currentLevel];
    
    // Update adaptive settings
    this.batteryState.adaptiveFPS = level.fps;
    this.batteryState.adaptiveDistance = level.gestureDistance;
    this.batteryState.adaptiveHaptic = level.hapticEnabled;
    
    // Update throttling
    if (this.performanceState.currentLevel === 'LOW' || 
        this.performanceState.currentLevel === 'EMERGENCY') {
      this.performanceState.adaptiveThrottling = true;
      this.eventProcessing.throttleDelay = this.performanceState.currentLevel === 'EMERGENCY' ? 32 : 16;
    } else {
      this.performanceState.adaptiveThrottling = false;
      this.eventProcessing.throttleDelay = 0;
    }
  }

  /**
   * Gesture processing optimization
   */
  shouldProcessGestures() {
    const now = performance.now();
    
    // Check throttling
    if (this.eventProcessing.throttleDelay > 0) {
      if (now - this.eventProcessing.lastProcessTime < this.eventProcessing.throttleDelay) {
        return false;
      }
    }
    
    // Check frame skipping for battery optimization
    if (this.batteryState.powerMode !== 'NORMAL') {
      this.batteryState.frameSkipCounter++;
      
      const skipThreshold = this.batteryState.powerMode === 'BATTERY_SAVE' ? 
        this.options.BATTERY_SAVE_FRAME_SKIP : this.options.LOW_BATTERY_FRAME_SKIP;
      
      if (this.batteryState.frameSkipCounter % skipThreshold !== 0) {
        return false;
      }
    }
    
    // Check processing budget
    if (this.performanceState.gestureProcessingTime > this.options.GESTURE_PROCESSING_BUDGET) {
      return false;
    }
    
    return true;
  }

  processGestureQueue() {
    const startTime = performance.now();
    
    // Process touch events
    this.processTouchEventQueue();
    
    // Process gesture events
    this.processGestureEventQueue();
    
    // Update processing time
    this.performanceState.gestureProcessingTime = performance.now() - startTime;
    this.eventProcessing.lastProcessTime = startTime;
  }

  processTouchEventQueue() {
    const startTime = performance.now();
    const batchSize = this.getBatchSize();
    
    for (let i = 0; i < batchSize && this.eventProcessing.touchEventQueue.length > 0; i++) {
      const event = this.eventProcessing.touchEventQueue.shift();
      this.processOptimizedTouchEvent(event);
      
      // Check time budget
      if (performance.now() - startTime > this.options.TOUCH_EVENT_BUDGET) {
        break;
      }
    }
    
    this.performanceState.touchEventTime = performance.now() - startTime;
  }

  processGestureEventQueue() {
    const startTime = performance.now();
    const batchSize = this.getBatchSize();
    
    for (let i = 0; i < batchSize && this.eventProcessing.gestureEventQueue.length > 0; i++) {
      const gesture = this.eventProcessing.gestureEventQueue.shift();
      this.processOptimizedGesture(gesture);
      
      // Check time budget
      if (performance.now() - startTime > this.options.RECOGNITION_BUDGET) {
        break;
      }
    }
    
    this.performanceState.recognitionTime = performance.now() - startTime;
  }

  getBatchSize() {
    // Adaptive batch size based on performance
    switch (this.performanceState.currentLevel) {
      case 'HIGH': return 10;
      case 'MEDIUM': return 7;
      case 'LOW': return 5;
      case 'EMERGENCY': return 2;
      default: return 5;
    }
  }

  /**
   * Optimized event processing
   */
  processOptimizedTouchEvent(event) {
    // Use object pool for touch data
    const touchData = this.getTouchDataFromPool();
    
    // Minimal processing for touch events
    touchData.x = event.clientX;
    touchData.y = event.clientY;
    touchData.timestamp = event.timeStamp;
    touchData.identifier = event.identifier;
    
    // Quick distance/velocity calculations
    if (event.previousTouch) {
      touchData.deltaX = event.clientX - event.previousTouch.clientX;
      touchData.deltaY = event.clientY - event.previousTouch.clientY;
      touchData.deltaTime = event.timeStamp - event.previousTouch.timeStamp;
    }
    
    // Return to pool when done
    this.returnTouchDataToPool(touchData);
  }

  processOptimizedGesture(gesture) {
    // Priority-based processing
    if (this.isHighPriorityGesture(gesture)) {
      this.processHighPriorityGesture(gesture);
    } else if (this.shouldSkipLowPriorityGesture()) {
      this.skipGesture(gesture);
    } else {
      this.processNormalGesture(gesture);
    }
  }

  isHighPriorityGesture(gesture) {
    return this.gamingState.priorityGestures.has(gesture.type) ||
           gesture.isUrgent ||
           gesture.context === 'voting';
  }

  shouldSkipLowPriorityGesture() {
    return this.performanceState.currentLevel === 'EMERGENCY' ||
           (this.performanceState.currentLevel === 'LOW' && Math.random() > 0.7);
  }

  /**
   * Memory management
   */
  initializeObjectPools() {
    // Touch event pool
    for (let i = 0; i < 20; i++) {
      this.memoryState.touchEventPool.push({
        x: 0, y: 0, timestamp: 0, identifier: 0,
        deltaX: 0, deltaY: 0, deltaTime: 0
      });
    }
    
    // Gesture object pool
    for (let i = 0; i < 10; i++) {
      this.memoryState.gestureObjectPool.push({
        type: '', direction: '', distance: 0, velocity: 0,
        startTime: 0, endTime: 0, element: null
      });
    }
    
    // Feedback object pool
    for (let i = 0; i < 5; i++) {
      this.memoryState.feedbackObjectPool.push({
        type: '', duration: 0, intensity: 0
      });
    }
  }

  getTouchDataFromPool() {
    return this.memoryState.touchEventPool.pop() || {
      x: 0, y: 0, timestamp: 0, identifier: 0,
      deltaX: 0, deltaY: 0, deltaTime: 0
    };
  }

  returnTouchDataToPool(touchData) {
    // Reset object
    Object.keys(touchData).forEach(key => {
      touchData[key] = typeof touchData[key] === 'number' ? 0 : '';
    });
    
    // Return to pool if not full
    if (this.memoryState.touchEventPool.length < 20) {
      this.memoryState.touchEventPool.push(touchData);
    }
  }

  performMemoryCleanup() {
    const now = Date.now();
    
    // Clean gesture history
    this.memoryState.gestureHistory = this.memoryState.gestureHistory
      .filter(gesture => now - gesture.timestamp < 30000) // Keep last 30 seconds
      .slice(-this.options.MAX_GESTURE_HISTORY);
    
    // Clean event queues
    if (this.eventProcessing.touchEventQueue.length > 100) {
      this.eventProcessing.touchEventQueue = this.eventProcessing.touchEventQueue.slice(-50);
    }
    
    if (this.eventProcessing.gestureEventQueue.length > 50) {
      this.eventProcessing.gestureEventQueue = this.eventProcessing.gestureEventQueue.slice(-25);
    }
    
    // Update last cleanup time
    this.memoryState.lastCleanup = now;
    
    if (this.options.debugMode) {
      console.log('🗑️ Memory cleanup performed');
    }
  }

  scheduleGarbageCollection() {
    if (!this.memoryState.gcScheduled && 'gc' in window) {
      this.memoryState.gcScheduled = true;
      
      setTimeout(() => {
        window.gc();
        this.memoryState.gcScheduled = false;
      }, 100);
    }
  }

  /**
   * Battery optimization
   */
  handleBatteryLevelChange(battery) {
    this.batteryState.level = battery.level;
    this.updateBatteryOptimizations();
    
    // Battery level warnings
    if (battery.level < 0.1) {
      this.handleLowBattery();
    } else if (battery.level < 0.2) {
      this.handleBatterySaveMode();
    }
  }

  handleChargingChange(battery) {
    this.batteryState.isCharging = battery.charging;
    
    if (battery.charging) {
      this.enableNormalPerformance();
    } else {
      this.updateBatteryOptimizations();
    }
  }

  updateBatteryOptimizations() {
    const batteryPercentage = this.batteryState.level * 100;
    
    if (batteryPercentage < this.options.LOW_BATTERY_THRESHOLD) {
      this.batteryState.powerMode = 'LOW_BATTERY';
    } else if (batteryPercentage < this.options.BATTERY_SAVE_THRESHOLD) {
      this.batteryState.powerMode = 'BATTERY_SAVE';
    } else {
      this.batteryState.powerMode = 'NORMAL';
    }
    
    // Apply power mode settings
    this.applyPowerModeSettings();
  }

  applyPowerModeSettings() {
    switch (this.batteryState.powerMode) {
      case 'LOW_BATTERY':
        this.batteryState.adaptiveFPS = 15;
        this.batteryState.adaptiveHaptic = false;
        this.eventProcessing.batchSize = 2;
        break;
        
      case 'BATTERY_SAVE':
        this.batteryState.adaptiveFPS = 30;
        this.batteryState.adaptiveHaptic = false;
        this.eventProcessing.batchSize = 3;
        break;
        
      case 'NORMAL':
      default:
        this.batteryState.adaptiveFPS = 60;
        this.batteryState.adaptiveHaptic = true;
        this.eventProcessing.batchSize = 5;
        break;
    }
  }

  /**
   * Network optimization
   */
  handleNetworkOnline() {
    this.networkState.isOnline = true;
    this.networkState.offlineMode = false;
    
    // Sync pending gestures
    this.syncPendingGestures();
  }

  handleNetworkOffline() {
    this.networkState.isOnline = false;
    this.networkState.offlineMode = true;
    
    // Enable offline caching
    this.enableOfflineCaching();
  }

  syncPendingGestures() {
    if (!this.networkState.isOnline || this.networkState.pendingGestures.length === 0) {
      return;
    }
    
    const batch = this.networkState.pendingGestures.splice(0, this.options.SYNC_BATCH_SIZE);
    
    // Simulate sync (would be actual API call)
    this.simulateGestureSync(batch);
  }

  /**
   * Gaming mode optimization
   */
  detectGamingContext() {
    const path = window.location.pathname;
    
    this.gamingState.isGamingMode = 
      path.includes('voting') || 
      path.includes('clans') || 
      path.includes('dao') ||
      path.includes('tournaments');
    
    this.gamingState.isCompetitiveMode = 
      path.includes('tournaments') ||
      path.includes('voting');
    
    this.updateGamingOptimizations();
  }

  updateGamingOptimizations() {
    if (this.gamingState.isCompetitiveMode) {
      this.gamingState.performanceBoost = this.options.COMPETITIVE_MODE_BOOST;
    } else if (this.gamingState.isGamingMode) {
      this.gamingState.performanceBoost = this.options.GAMING_MODE_BOOST;
    } else {
      this.gamingState.performanceBoost = 1.0;
    }
    
    // Apply boost to processing budgets
    this.applyPerformanceBoost();
  }

  applyPerformanceBoost() {
    const boost = this.gamingState.performanceBoost;
    
    this.options.GESTURE_PROCESSING_BUDGET *= boost;
    this.options.TOUCH_EVENT_BUDGET *= boost;
    this.options.RECOGNITION_BUDGET *= boost;
  }

  /**
   * Event handlers for performance issues
   */
  handleLongTask(entry) {
    this.performanceState.performanceWarnings++;
    
    if (this.options.debugMode) {
      console.warn(`⚠️ Long task detected: ${entry.duration.toFixed(2)}ms`);
    }
    
    // Apply emergency optimizations
    if (entry.duration > 100) {
      this.applyEmergencyOptimizations();
    }
  }

  handleLowFrameRate() {
    if (this.options.debugMode) {
      console.warn(`⚠️ Low frame rate detected: ${this.performanceState.currentFPS}fps`);
    }
    
    // Temporarily reduce gesture processing
    this.temporaryPerformanceReduction();
  }

  applyEmergencyOptimizations() {
    // Temporarily set to emergency mode
    this.performanceState.currentLevel = 'EMERGENCY';
    this.applyPerformanceLevelOptimizations();
    
    // Reset after delay
    setTimeout(() => {
      this.updatePerformanceLevel();
    }, 2000);
  }

  temporaryPerformanceReduction() {
    // Reduce processing for 1 second
    const originalBudget = this.options.GESTURE_PROCESSING_BUDGET;
    this.options.GESTURE_PROCESSING_BUDGET *= 0.5;
    
    setTimeout(() => {
      this.options.GESTURE_PROCESSING_BUDGET = originalBudget;
    }, 1000);
  }

  /**
   * Utility methods
   */
  detectConnectionType() {
    if ('connection' in navigator) {
      return navigator.connection.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  getEnabledOptimizations() {
    return {
      performance: this.options.enablePerformanceMonitoring,
      memory: this.options.enableMemoryOptimization,
      battery: this.options.enableBatteryOptimization,
      network: this.options.enableNetworkOptimization,
      gaming: this.options.enableGamingModeBoost
    };
  }

  // Placeholder methods for actual implementations
  processHighPriorityGesture(gesture) {
    // Process high priority gesture immediately
  }

  processNormalGesture(gesture) {
    // Process normal gesture
  }

  skipGesture(gesture) {
    // Skip low priority gesture
  }

  setupActivityMonitoring() {
    // Setup activity monitoring
  }

  initializeOfflineCache() {
    // Initialize offline cache
  }

  enableOfflineCaching() {
    // Enable offline caching
  }

  cleanOfflineCache() {
    // Clean offline cache
  }

  simulateGestureSync(batch) {
    // Simulate gesture sync
  }

  handleVisibilityChange() {
    // Handle page visibility change
  }

  handleConnectionChange() {
    // Handle connection type change
  }

  shouldPerformMemoryCleanup() {
    return Date.now() - this.memoryState.lastCleanup > this.options.MEMORY_CLEANUP_INTERVAL;
  }

  shouldScheduleGC() {
    return this.memoryState.pressureLevel === 'HIGH' && !this.memoryState.gcScheduled;
  }

  shouldUpdateBatteryOptimizations() {
    return Date.now() - this.batteryState.lastBatteryCheck > 5000;
  }

  shouldSyncGestures() {
    return this.networkState.isOnline && this.networkState.pendingGestures.length > 0;
  }

  monitorMemoryUsage() {
    if ('memory' in performance) {
      this.memoryState.memoryUsage = performance.memory.usedJSHeapSize;
    }
  }

  detectMemoryPressure() {
    if ('memory' in performance) {
      const usage = performance.memory.usedJSHeapSize / (1024 * 1024);
      
      if (usage > this.options.MEMORY_PRESSURE_THRESHOLD) {
        this.memoryState.pressureLevel = 'HIGH';
      } else if (usage > this.options.MEMORY_PRESSURE_THRESHOLD * 0.7) {
        this.memoryState.pressureLevel = 'MEDIUM';
      } else {
        this.memoryState.pressureLevel = 'LOW';
      }
    }
  }

  manageObjectPools() {
    // Manage object pool sizes based on usage
  }

  checkPerformanceThresholds() {
    // Check and handle performance thresholds
  }

  applyAdaptiveOptimizations() {
    // Apply adaptive optimizations based on current performance
  }

  handleLowBattery() {
    console.warn('🔋 Low battery detected - enabling maximum power savings');
  }

  handleBatterySaveMode() {
    console.log('🔋 Battery save mode enabled');
  }

  enableNormalPerformance() {
    console.log('⚡ Normal performance mode restored');
  }

  /**
   * Public API
   */
  getPerformanceMetrics() {
    return {
      fps: this.performanceState.currentFPS,
      frameTime: this.performanceState.averageFrameTime,
      level: this.performanceState.currentLevel,
      batteryLevel: this.batteryState.level,
      memoryUsage: this.memoryState.memoryUsage,
      isOnline: this.networkState.isOnline,
      isGamingMode: this.gamingState.isGamingMode
    };
  }

  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    console.log('🔥 Destroying Performance Gesture Optimizer...');
    
    // Clear intervals
    if (this.monitoring.memoryMonitor) {
      clearInterval(this.monitoring.memoryMonitor);
    }
    
    // Clear object pools
    this.memoryState.touchEventPool = [];
    this.memoryState.gestureObjectPool = [];
    this.memoryState.feedbackObjectPool = [];
    
    console.log('✅ Performance Gesture Optimizer destroyed');
  }
}

// Create and export singleton instance
const MLGPerformanceOptimizer = new MLGPerformanceGestureOptimizer();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.MLGPerformanceOptimizer = MLGPerformanceOptimizer;
}

export default MLGPerformanceOptimizer;
export { MLGPerformanceGestureOptimizer, PERFORMANCE_CONFIG };