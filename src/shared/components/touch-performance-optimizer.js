/**
 * MLG.clan Touch Performance Optimizer
 * 
 * High-performance touch handling system optimized for 60fps gaming interactions
 * Implements passive event listeners, frame-based throttling, and battery-efficient processing
 * 
 * Features:
 * - 60fps touch tracking with minimal overhead
 * - Passive event listeners for scroll performance
 * - Intelligent gesture debouncing and throttling
 * - Battery-efficient processing for mobile gaming
 * - Performance monitoring and optimization suggestions
 * - Memory-efficient touch point management
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 */

/**
 * Performance Configuration
 */
const PERFORMANCE_CONFIG = {
  // Frame timing
  TARGET_FPS: 60,
  FRAME_TIME: 16.67, // 1000ms / 60fps
  THROTTLE_THRESHOLD: 5, // Throttle after 5 consecutive frames
  
  // Memory management
  MAX_TOUCH_HISTORY: 50,
  MAX_GESTURE_CACHE: 100,
  CLEANUP_INTERVAL: 30000, // 30 seconds
  
  // Battery optimization
  IDLE_DETECTION_TIME: 5000, // 5 seconds
  REDUCED_PRECISION_THRESHOLD: 100, // Reduce precision after 100 events
  
  // Performance thresholds
  GOOD_FRAME_TIME: 16.67,
  FAIR_FRAME_TIME: 33.33,
  POOR_FRAME_TIME: 50,
  
  // Touch precision levels
  HIGH_PRECISION: 1,
  MEDIUM_PRECISION: 2,
  LOW_PRECISION: 4
};

/**
 * Touch Performance Optimizer Class
 */
export class TouchPerformanceOptimizer {
  constructor(options = {}) {
    this.options = {
      enablePassiveListeners: true,
      enableFrameThrottling: true,
      enableBatteryOptimization: true,
      enablePerformanceMonitoring: true,
      debugMode: false,
      ...options
    };
    
    // Performance tracking
    this.frameData = {
      count: 0,
      startTime: 0,
      lastFrameTime: 0,
      frameIntervals: [],
      droppedFrames: 0,
      averageFPS: 60
    };
    
    // Touch event management
    this.touchEventQueue = new Map();
    this.activeGestures = new Set();
    this.touchHistory = [];
    this.gestureCache = new Map();
    
    // Battery optimization state
    this.batteryState = {
      isCharging: true,
      level: 1,
      chargingTime: Infinity,
      dischargingTime: Infinity,
      precision: PERFORMANCE_CONFIG.HIGH_PRECISION,
      idleStartTime: 0,
      isIdle: false
    };
    
    // Performance monitoring
    this.performanceMetrics = {
      touchLatency: [],
      gestureProcessingTime: [],
      memoryUsage: [],
      batteryImpact: 'minimal'
    };
    
    // RAF management
    this.rafId = null;
    this.frameCallbacks = new Set();
    this.lastRafTime = 0;
    
    this.init();
  }

  /**
   * Initialize performance optimizer
   */
  init() {
    this.setupBatteryMonitoring();
    this.setupPerformanceObserver();
    this.setupPassiveListeners();
    this.startFrameLoop();
    this.scheduleCleanup();
    
    if (this.options.debugMode) {
      this.enableDebugMode();
    }
  }

  /**
   * Setup battery monitoring for optimization
   */
  async setupBatteryMonitoring() {
    if (!this.options.enableBatteryOptimization) return;
    
    try {
      if ('getBattery' in navigator) {
        const battery = await navigator.getBattery();
        
        this.batteryState = {
          isCharging: battery.charging,
          level: battery.level,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime,
          precision: this.calculateOptimalPrecision(battery),
          idleStartTime: 0,
          isIdle: false
        };
        
        // Monitor battery changes
        battery.addEventListener('chargingchange', () => {
          this.batteryState.isCharging = battery.charging;
          this.adjustPerformanceForBattery();
        });
        
        battery.addEventListener('levelchange', () => {
          this.batteryState.level = battery.level;
          this.adjustPerformanceForBattery();
        });
      }
    } catch (error) {
      console.warn('Battery API not available:', error);
    }
  }

  /**
   * Setup performance observer for monitoring
   */
  setupPerformanceObserver() {
    if (!this.options.enablePerformanceMonitoring) return;
    
    try {
      // Observe long tasks
      if ('PerformanceObserver' in window) {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > PERFORMANCE_CONFIG.POOR_FRAME_TIME) {
              this.handleLongTask(entry);
            }
          }
        });
        
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        
        // Observe frame timing
        const frameObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordFrameTiming(entry);
          }
        });
        
        frameObserver.observe({ entryTypes: ['measure'] });
      }
    } catch (error) {
      console.warn('PerformanceObserver not available:', error);
    }
  }

  /**
   * Setup passive event listeners for better scroll performance
   */
  setupPassiveListeners() {
    if (!this.options.enablePassiveListeners) return;
    
    const passiveOptions = { passive: true };
    const activeOptions = { passive: false };
    
    // Use passive listeners for non-blocking events
    document.addEventListener('touchstart', (e) => {
      this.handleTouchStart(e);
    }, this.shouldUsePassive(e) ? passiveOptions : activeOptions);
    
    document.addEventListener('touchmove', (e) => {
      this.handleTouchMove(e);
    }, this.shouldUsePassive(e) ? passiveOptions : activeOptions);
    
    document.addEventListener('touchend', (e) => {
      this.handleTouchEnd(e);
    }, passiveOptions);
    
    document.addEventListener('touchcancel', (e) => {
      this.handleTouchCancel(e);
    }, passiveOptions);
  }

  /**
   * Determine if passive listeners should be used
   */
  shouldUsePassive(event) {
    // Use passive for scrolling areas, active for interactive elements
    const target = event.target;
    const interactiveElements = ['button', 'input', 'select', 'textarea'];
    const hasInteractiveClass = target.classList.contains('touch-interactive') ||
                               target.closest('.touch-interactive');
    
    return !interactiveElements.includes(target.tagName.toLowerCase()) && !hasInteractiveClass;
  }

  /**
   * High-performance touch event handlers
   */
  handleTouchStart(event) {
    const startTime = performance.now();
    
    // Create optimized touch data
    const touchData = this.createOptimizedTouchData(event);
    
    // Queue event for frame processing
    this.queueTouchEvent('start', touchData, startTime);
    
    // Reset idle timer
    this.resetIdleTimer();
    
    // Record latency
    this.recordTouchLatency(startTime);
  }

  handleTouchMove(event) {
    const startTime = performance.now();
    
    // Throttle move events based on frame rate
    if (this.shouldThrottleEvent('move')) {
      return;
    }
    
    const touchData = this.createOptimizedTouchData(event);
    this.queueTouchEvent('move', touchData, startTime);
    
    this.recordTouchLatency(startTime);
  }

  handleTouchEnd(event) {
    const startTime = performance.now();
    
    const touchData = this.createOptimizedTouchData(event);
    this.queueTouchEvent('end', touchData, startTime);
    
    // Start idle timer if no active touches
    if (event.touches.length === 0) {
      this.startIdleTimer();
    }
    
    this.recordTouchLatency(startTime);
  }

  handleTouchCancel(event) {
    const startTime = performance.now();
    
    const touchData = this.createOptimizedTouchData(event);
    this.queueTouchEvent('cancel', touchData, startTime);
    
    this.recordTouchLatency(startTime);
  }

  /**
   * Create memory-efficient touch data
   */
  createOptimizedTouchData(event) {
    const precision = this.batteryState.precision;
    
    // Reduce coordinate precision based on battery/performance state
    const roundToPrecision = (value) => {
      return Math.round(value / precision) * precision;
    };
    
    const touches = Array.from(event.touches || event.changedTouches || []).map(touch => ({
      id: touch.identifier,
      x: roundToPrecision(touch.clientX),
      y: roundToPrecision(touch.clientY),
      force: touch.force || 1,
      radiusX: touch.radiusX || 20,
      radiusY: touch.radiusY || 20,
      timestamp: performance.now()
    }));
    
    return {
      type: event.type,
      touches,
      target: event.target,
      timestamp: performance.now()
    };
  }

  /**
   * Queue touch events for frame-based processing
   */
  queueTouchEvent(type, touchData, timestamp) {
    const eventId = `${type}-${timestamp}`;
    
    this.touchEventQueue.set(eventId, {
      type,
      data: touchData,
      timestamp,
      processed: false
    });
    
    // Limit queue size for memory efficiency
    if (this.touchEventQueue.size > 100) {
      const oldestKey = this.touchEventQueue.keys().next().value;
      this.touchEventQueue.delete(oldestKey);
    }
  }

  /**
   * Frame-based event processing loop
   */
  startFrameLoop() {
    const processFrame = (currentTime) => {
      this.lastRafTime = currentTime;
      
      // Calculate frame timing
      const frameInterval = currentTime - this.frameData.lastFrameTime;
      this.frameData.lastFrameTime = currentTime;
      this.frameData.count++;
      
      // Record frame data
      this.frameData.frameIntervals.push(frameInterval);
      if (this.frameData.frameIntervals.length > 60) {
        this.frameData.frameIntervals.shift();
      }
      
      // Check for dropped frames
      if (frameInterval > PERFORMANCE_CONFIG.FRAME_TIME * 2) {
        this.frameData.droppedFrames++;
      }
      
      // Process queued touch events
      this.processQueuedEvents(currentTime);
      
      // Execute frame callbacks
      this.executeFrameCallbacks(currentTime);
      
      // Update performance metrics
      if (this.frameData.count % 60 === 0) {
        this.updatePerformanceMetrics();
      }
      
      // Continue loop
      this.rafId = requestAnimationFrame(processFrame);
    };
    
    this.frameData.startTime = performance.now();
    this.rafId = requestAnimationFrame(processFrame);
  }

  /**
   * Process queued touch events within frame budget
   */
  processQueuedEvents(currentTime) {
    const frameStartTime = performance.now();
    const maxProcessingTime = PERFORMANCE_CONFIG.FRAME_TIME * 0.8; // Use 80% of frame time
    
    let processedCount = 0;
    const maxEventsPerFrame = this.batteryState.isIdle ? 1 : 5;
    
    for (const [eventId, eventData] of this.touchEventQueue) {
      if (eventData.processed) continue;
      
      // Check frame budget
      const processingTime = performance.now() - frameStartTime;
      if (processingTime > maxProcessingTime || processedCount >= maxEventsPerFrame) {
        break;
      }
      
      // Process the event
      this.processTouchEvent(eventData);
      eventData.processed = true;
      processedCount++;
    }
    
    // Clean up processed events
    this.cleanupProcessedEvents();
  }

  /**
   * Process individual touch event
   */
  processTouchEvent(eventData) {
    const { type, data, timestamp } = eventData;
    
    // Add to touch history for gesture recognition
    this.touchHistory.push({
      type,
      touches: data.touches,
      timestamp
    });
    
    // Limit history size
    if (this.touchHistory.length > PERFORMANCE_CONFIG.MAX_TOUCH_HISTORY) {
      this.touchHistory.shift();
    }
    
    // Emit optimized touch event
    this.emitOptimizedTouchEvent(type, data, timestamp);
  }

  /**
   * Emit optimized touch events to listeners
   */
  emitOptimizedTouchEvent(type, data, timestamp) {
    const event = new CustomEvent(`optimized-${type}`, {
      detail: {
        touches: data.touches,
        target: data.target,
        timestamp,
        performance: this.getPerformanceSnapshot()
      }
    });
    
    document.dispatchEvent(event);
  }

  /**
   * Register frame callback for smooth animations
   */
  registerFrameCallback(callback, priority = 0) {
    const callbackData = {
      callback,
      priority,
      id: Math.random().toString(36).substr(2, 9)
    };
    
    this.frameCallbacks.add(callbackData);
    return callbackData.id;
  }

  /**
   * Unregister frame callback
   */
  unregisterFrameCallback(id) {
    for (const callbackData of this.frameCallbacks) {
      if (callbackData.id === id) {
        this.frameCallbacks.delete(callbackData);
        break;
      }
    }
  }

  /**
   * Execute frame callbacks in priority order
   */
  executeFrameCallbacks(currentTime) {
    const sortedCallbacks = Array.from(this.frameCallbacks).sort((a, b) => b.priority - a.priority);
    const frameStartTime = performance.now();
    const maxExecutionTime = PERFORMANCE_CONFIG.FRAME_TIME * 0.6; // Use 60% of frame time
    
    for (const callbackData of sortedCallbacks) {
      const executionTime = performance.now() - frameStartTime;
      if (executionTime > maxExecutionTime) {
        break; // Preserve frame timing
      }
      
      try {
        callbackData.callback(currentTime, executionTime);
      } catch (error) {
        console.error('Frame callback error:', error);
        this.frameCallbacks.delete(callbackData);
      }
    }
  }

  /**
   * Intelligent event throttling
   */
  shouldThrottleEvent(type) {
    if (!this.options.enableFrameThrottling) return false;
    
    const now = performance.now();
    const lastEventTime = this.lastEventTimes?.get(type) || 0;
    const timeSinceLastEvent = now - lastEventTime;
    
    // Different throttling for different event types
    const throttleThresholds = {
      move: this.batteryState.isIdle ? 33 : 16, // 30fps when idle, 60fps when active
      scroll: 16,
      resize: 100
    };
    
    const threshold = throttleThresholds[type] || 16;
    
    if (timeSinceLastEvent < threshold) {
      return true; // Throttle
    }
    
    // Update last event time
    if (!this.lastEventTimes) {
      this.lastEventTimes = new Map();
    }
    this.lastEventTimes.set(type, now);
    
    return false; // Don't throttle
  }

  /**
   * Battery-based performance adjustment
   */
  adjustPerformanceForBattery() {
    const { isCharging, level } = this.batteryState;
    
    // Adjust precision based on battery state
    if (isCharging || level > 0.5) {
      this.batteryState.precision = PERFORMANCE_CONFIG.HIGH_PRECISION;
    } else if (level > 0.2) {
      this.batteryState.precision = PERFORMANCE_CONFIG.MEDIUM_PRECISION;
    } else {
      this.batteryState.precision = PERFORMANCE_CONFIG.LOW_PRECISION;
    }
    
    // Adjust frame processing limits
    this.maxEventsPerFrame = isCharging ? 10 : (level > 0.3 ? 5 : 2);
    
    // Update performance metrics
    this.performanceMetrics.batteryImpact = this.calculateBatteryImpact();
  }

  /**
   * Calculate optimal precision based on battery state
   */
  calculateOptimalPrecision(battery) {
    if (battery.charging || battery.level > 0.5) {
      return PERFORMANCE_CONFIG.HIGH_PRECISION;
    } else if (battery.level > 0.2) {
      return PERFORMANCE_CONFIG.MEDIUM_PRECISION;
    } else {
      return PERFORMANCE_CONFIG.LOW_PRECISION;
    }
  }

  /**
   * Idle state management
   */
  startIdleTimer() {
    this.batteryState.idleStartTime = performance.now();
    
    setTimeout(() => {
      if (performance.now() - this.batteryState.idleStartTime >= PERFORMANCE_CONFIG.IDLE_DETECTION_TIME) {
        this.batteryState.isIdle = true;
        this.adjustPerformanceForIdle();
      }
    }, PERFORMANCE_CONFIG.IDLE_DETECTION_TIME);
  }

  resetIdleTimer() {
    this.batteryState.idleStartTime = 0;
    if (this.batteryState.isIdle) {
      this.batteryState.isIdle = false;
      this.adjustPerformanceForActive();
    }
  }

  adjustPerformanceForIdle() {
    // Reduce frame rate and precision when idle
    this.batteryState.precision = Math.max(
      this.batteryState.precision,
      PERFORMANCE_CONFIG.MEDIUM_PRECISION
    );
  }

  adjustPerformanceForActive() {
    // Restore full performance when active
    this.adjustPerformanceForBattery();
  }

  /**
   * Performance monitoring and metrics
   */
  recordTouchLatency(startTime) {
    const latency = performance.now() - startTime;
    this.performanceMetrics.touchLatency.push(latency);
    
    // Keep only recent measurements
    if (this.performanceMetrics.touchLatency.length > 100) {
      this.performanceMetrics.touchLatency.shift();
    }
  }

  recordFrameTiming(entry) {
    if (entry.duration > PERFORMANCE_CONFIG.POOR_FRAME_TIME) {
      console.warn('Slow frame detected:', entry.duration + 'ms');
    }
  }

  handleLongTask(entry) {
    console.warn('Long task detected:', entry.duration + 'ms', entry);
    
    // Automatically adjust performance if long tasks are frequent
    if (this.longTaskCount > 5) {
      this.batteryState.precision = Math.min(
        PERFORMANCE_CONFIG.LOW_PRECISION,
        this.batteryState.precision * 2
      );
    }
    
    this.longTaskCount = (this.longTaskCount || 0) + 1;
  }

  updatePerformanceMetrics() {
    // Calculate average FPS
    const intervals = this.frameData.frameIntervals;
    if (intervals.length > 0) {
      const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      this.frameData.averageFPS = Math.min(60, 1000 / avgInterval);
    }
    
    // Calculate touch latency
    const latencies = this.performanceMetrics.touchLatency;
    if (latencies.length > 0) {
      const avgLatency = latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length;
      this.performanceMetrics.averageTouchLatency = avgLatency;
    }
    
    // Memory usage estimation
    this.performanceMetrics.memoryUsage.push({
      touchEventQueue: this.touchEventQueue.size,
      touchHistory: this.touchHistory.length,
      gestureCache: this.gestureCache.size,
      frameCallbacks: this.frameCallbacks.size,
      timestamp: performance.now()
    });
    
    // Limit memory usage tracking
    if (this.performanceMetrics.memoryUsage.length > 50) {
      this.performanceMetrics.memoryUsage.shift();
    }
  }

  calculateBatteryImpact() {
    const { averageFPS, droppedFrames } = this.frameData;
    const { averageTouchLatency } = this.performanceMetrics;
    
    if (averageFPS >= 55 && averageTouchLatency < 20 && droppedFrames < 5) {
      return 'minimal';
    } else if (averageFPS >= 45 && averageTouchLatency < 35 && droppedFrames < 15) {
      return 'moderate';
    } else {
      return 'significant';
    }
  }

  /**
   * Get performance snapshot
   */
  getPerformanceSnapshot() {
    return {
      averageFPS: this.frameData.averageFPS,
      droppedFrames: this.frameData.droppedFrames,
      averageTouchLatency: this.performanceMetrics.averageTouchLatency || 0,
      batteryLevel: this.batteryState.level,
      isCharging: this.batteryState.isCharging,
      isIdle: this.batteryState.isIdle,
      batteryImpact: this.performanceMetrics.batteryImpact,
      precision: this.batteryState.precision,
      queueSize: this.touchEventQueue.size
    };
  }

  /**
   * Get optimization suggestions
   */
  getOptimizationSuggestions() {
    const suggestions = [];
    const snapshot = this.getPerformanceSnapshot();
    
    if (snapshot.averageFPS < 30) {
      suggestions.push({
        type: 'critical',
        message: 'Frame rate is critically low. Consider reducing visual complexity.',
        action: 'reduce_complexity'
      });
    }
    
    if (snapshot.averageTouchLatency > 50) {
      suggestions.push({
        type: 'warning',
        message: 'Touch latency is high. Enable passive listeners for better performance.',
        action: 'enable_passive_listeners'
      });
    }
    
    if (snapshot.droppedFrames > 30) {
      suggestions.push({
        type: 'warning',
        message: 'Many frames are being dropped. Consider frame throttling.',
        action: 'enable_frame_throttling'
      });
    }
    
    if (snapshot.queueSize > 50) {
      suggestions.push({
        type: 'info',
        message: 'Touch event queue is large. Performance may be impacted.',
        action: 'optimize_event_processing'
      });
    }
    
    if (!snapshot.isCharging && snapshot.batteryLevel < 0.2) {
      suggestions.push({
        type: 'info',
        message: 'Low battery detected. Reducing performance to save power.',
        action: 'battery_optimization_active'
      });
    }
    
    return suggestions;
  }

  /**
   * Cleanup and memory management
   */
  cleanupProcessedEvents() {
    const cutoffTime = performance.now() - 1000; // Remove events older than 1 second
    
    for (const [eventId, eventData] of this.touchEventQueue) {
      if (eventData.processed && eventData.timestamp < cutoffTime) {
        this.touchEventQueue.delete(eventId);
      }
    }
  }

  scheduleCleanup() {
    setInterval(() => {
      this.performCleanup();
    }, PERFORMANCE_CONFIG.CLEANUP_INTERVAL);
  }

  performCleanup() {
    // Clean up old touch history
    const cutoffTime = performance.now() - 10000; // 10 seconds
    this.touchHistory = this.touchHistory.filter(entry => entry.timestamp > cutoffTime);
    
    // Clean up gesture cache
    if (this.gestureCache.size > PERFORMANCE_CONFIG.MAX_GESTURE_CACHE) {
      const entries = Array.from(this.gestureCache.entries());
      const toRemove = entries.slice(0, entries.length - PERFORMANCE_CONFIG.MAX_GESTURE_CACHE);
      toRemove.forEach(([key]) => this.gestureCache.delete(key));
    }
    
    // Clean up performance metrics
    const metricsLimit = 100;
    ['touchLatency', 'gestureProcessingTime', 'memoryUsage'].forEach(metric => {
      const data = this.performanceMetrics[metric];
      if (data && data.length > metricsLimit) {
        this.performanceMetrics[metric] = data.slice(-metricsLimit);
      }
    });
    
    if (this.options.debugMode) {
      console.log('Performance cleanup completed', this.getPerformanceSnapshot());
    }
  }

  /**
   * Debug mode
   */
  enableDebugMode() {
    // Create performance overlay
    const overlay = document.createElement('div');
    overlay.id = 'touch-performance-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #00ff88;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 4px;
      z-index: 10000;
      pointer-events: none;
      min-width: 200px;
    `;
    document.body.appendChild(overlay);
    
    // Update overlay every second
    setInterval(() => {
      const snapshot = this.getPerformanceSnapshot();
      overlay.innerHTML = `
        <div>FPS: ${snapshot.averageFPS.toFixed(1)}</div>
        <div>Latency: ${snapshot.averageTouchLatency.toFixed(1)}ms</div>
        <div>Dropped: ${snapshot.droppedFrames}</div>
        <div>Queue: ${snapshot.queueSize}</div>
        <div>Battery: ${(snapshot.batteryLevel * 100).toFixed(0)}%</div>
        <div>Charging: ${snapshot.isCharging ? 'Yes' : 'No'}</div>
        <div>Impact: ${snapshot.batteryImpact}</div>
        <div>Precision: ${snapshot.precision}px</div>
      `;
    }, 1000);
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    
    this.touchEventQueue.clear();
    this.frameCallbacks.clear();
    this.touchHistory.length = 0;
    this.gestureCache.clear();
    
    const overlay = document.getElementById('touch-performance-overlay');
    if (overlay) {
      overlay.remove();
    }
  }
}

/**
 * Performance utilities for touch optimization
 */
export const TouchPerformanceUtils = {
  /**
   * Create optimized touch listener
   */
  createOptimizedListener(element, eventType, handler, options = {}) {
    const {
      passive = true,
      throttle = 16,
      debounce = 0
    } = options;
    
    let lastCall = 0;
    let timeoutId = null;
    
    const optimizedHandler = (event) => {
      const now = performance.now();
      
      if (debounce > 0) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => handler(event), debounce);
        return;
      }
      
      if (throttle > 0 && now - lastCall < throttle) {
        return;
      }
      
      lastCall = now;
      handler(event);
    };
    
    element.addEventListener(eventType, optimizedHandler, { passive });
    
    return () => {
      element.removeEventListener(eventType, optimizedHandler);
      if (timeoutId) clearTimeout(timeoutId);
    };
  },
  
  /**
   * Batch DOM updates for performance
   */
  batchDOMUpdates(updates) {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        updates.forEach(update => update());
        resolve();
      });
    });
  },
  
  /**
   * Measure touch performance
   */
  measureTouchPerformance(element, duration = 5000) {
    const measurements = {
      touchCount: 0,
      averageLatency: 0,
      maxLatency: 0,
      frameDrops: 0
    };
    
    const startTime = performance.now();
    const latencies = [];
    
    const measureTouch = (event) => {
      const latency = performance.now() - event.timeStamp;
      latencies.push(latency);
      measurements.touchCount++;
      measurements.maxLatency = Math.max(measurements.maxLatency, latency);
    };
    
    element.addEventListener('touchstart', measureTouch, { passive: true });
    element.addEventListener('touchmove', measureTouch, { passive: true });
    
    return new Promise((resolve) => {
      setTimeout(() => {
        element.removeEventListener('touchstart', measureTouch);
        element.removeEventListener('touchmove', measureTouch);
        
        measurements.averageLatency = latencies.length > 0 ? 
          latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length : 0;
        
        resolve(measurements);
      }, duration);
    });
  }
};

// Export default instance
export default new TouchPerformanceOptimizer();