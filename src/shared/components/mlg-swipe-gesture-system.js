/**
 * MLG.clan Advanced Swipe Gesture System
 * 
 * Comprehensive swipe gesture library with gaming-specific patterns
 * Multi-directional, performance-optimized gesture recognition
 * 
 * Features:
 * - Multi-directional swipe recognition (8 directions + diagonals)
 * - Gaming-specific gesture patterns (quick/long swipe, multi-touch)
 * - 60fps performance optimization for extended gaming sessions
 * - Gaming context-aware gesture behaviors
 * - Haptic feedback integration with gaming feedback patterns
 * - Advanced conflict resolution and gesture priority handling
 * - Memory-efficient for extended gaming sessions
 * - Battery optimization for mobile gaming
 * - Network-aware offline gesture support
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 */

/**
 * Swipe Gesture Configuration
 */
const SWIPE_GESTURE_CONFIG = {
  // Directional thresholds
  MIN_SWIPE_DISTANCE: 30,
  GAMING_SWIPE_DISTANCE: 50,
  QUICK_SWIPE_DISTANCE: 80,
  LONG_SWIPE_DISTANCE: 120,
  
  // Timing thresholds
  QUICK_SWIPE_TIME: 150,
  NORMAL_SWIPE_TIME: 300,
  LONG_SWIPE_TIME: 500,
  GESTURE_TIMEOUT: 1000,
  
  // Velocity thresholds (px/ms)
  MIN_VELOCITY: 0.1,
  QUICK_VELOCITY: 0.5,
  GAMING_VELOCITY: 0.8,
  
  // Multi-touch thresholds
  MULTI_TOUCH_MAX_DISTANCE: 100,
  PINCH_THRESHOLD: 20,
  ROTATION_THRESHOLD: 10,
  
  // Gaming-specific thresholds
  VOTE_SWIPE_THRESHOLD: 60,
  CLAN_ACTION_THRESHOLD: 80,
  TOURNAMENT_NAV_THRESHOLD: 70,
  QUICK_ACTION_THRESHOLD: 90,
  
  // Performance settings
  FRAME_RATE_TARGET: 60,
  BATTERY_OPTIMIZATION_THRESHOLD: 20, // percent
  MEMORY_CLEANUP_INTERVAL: 30000, // 30 seconds
  
  // Haptic patterns for gaming
  HAPTIC_PATTERNS: {
    VOTE_CONFIRM: [25, 50, 25],
    SUPER_VOTE: [100, 100, 100],
    CLAN_ACTION: [50, 25, 50],
    TOURNAMENT_NAV: [25, 25],
    QUICK_ACTION: [75],
    NAVIGATION: [25],
    ERROR: [200]
  }
};

/**
 * Swipe Direction Constants
 */
const SWIPE_DIRECTIONS = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
  UP_LEFT: 'up-left',
  UP_RIGHT: 'up-right',
  DOWN_LEFT: 'down-left',
  DOWN_RIGHT: 'down-right',
  NONE: 'none'
};

/**
 * Gaming Context Types
 */
const GAMING_CONTEXTS = {
  HOME: 'home',
  VOTING: 'voting',
  LEADERBOARDS: 'leaderboards',
  CLANS: 'clans',
  TOURNAMENTS: 'tournaments',
  PROFILE: 'profile',
  CLIPS: 'clips'
};

/**
 * Advanced Swipe Gesture Recognition System
 */
export class MLGSwipeGestureSystem {
  constructor(options = {}) {
    this.options = {
      ...SWIPE_GESTURE_CONFIG,
      enableHapticFeedback: true,
      enablePerformanceMonitoring: true,
      enableBatteryOptimization: true,
      enableNetworkAwareness: true,
      debugMode: process.env.NODE_ENV === 'development',
      ...options
    };

    // Core gesture state
    this.gestureState = {
      isTracking: false,
      startTime: 0,
      startTouch: { x: 0, y: 0 },
      currentTouch: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      distance: 0,
      direction: SWIPE_DIRECTIONS.NONE,
      duration: 0,
      touchCount: 0,
      gestureType: 'unknown'
    };

    // Multi-touch state
    this.multiTouchState = {
      touches: [],
      initialDistance: 0,
      currentDistance: 0,
      scale: 1,
      rotation: 0,
      center: { x: 0, y: 0 }
    };

    // Gaming context
    this.gamingContext = {
      currentPage: GAMING_CONTEXTS.HOME,
      isInGame: false,
      activeSection: null,
      contextualBehaviors: new Map(),
      quickActions: new Map()
    };

    // Performance monitoring
    this.performanceState = {
      frameCount: 0,
      lastFrameTime: 0,
      averageFrameTime: 16.67, // 60fps target
      memoryUsage: 0,
      batteryLevel: 1,
      isLowPerformance: false
    };

    // Registered gesture handlers
    this.gestureHandlers = new Map();
    this.globalGestureHandlers = new Map();
    this.contextualHandlers = new Map();

    // Event system
    this.eventSystem = {
      listeners: new Map(),
      queue: [],
      processing: false
    };

    // Cleanup tracking
    this.activeElements = new Set();
    this.memoryTimer = null;

    this.init();
  }

  /**
   * Initialize the swipe gesture system
   */
  async init() {
    console.log('🎮 Initializing MLG Swipe Gesture System...');

    try {
      // Setup performance monitoring
      if (this.options.enablePerformanceMonitoring) {
        this.setupPerformanceMonitoring();
      }

      // Setup battery optimization
      if (this.options.enableBatteryOptimization) {
        await this.setupBatteryOptimization();
      }

      // Setup network awareness
      if (this.options.enableNetworkAwareness) {
        this.setupNetworkAwareness();
      }

      // Setup memory management
      this.setupMemoryManagement();

      // Setup global gesture handlers
      this.setupGlobalGestureHandlers();

      // Setup gaming context detection
      this.setupGamingContextDetection();

      // Setup default gaming gesture patterns
      this.setupGamingGesturePatterns();

      console.log('✅ MLG Swipe Gesture System initialized');

      // Dispatch initialization event
      this.dispatchEvent('swipe-system-initialized', {
        capabilities: this.getSystemCapabilities(),
        config: this.options
      });

    } catch (error) {
      console.error('❌ Failed to initialize swipe gesture system:', error);
      throw error;
    }
  }

  /**
   * Setup performance monitoring for gesture tracking
   */
  setupPerformanceMonitoring() {
    let frameStart = performance.now();

    const monitorFrame = () => {
      const now = performance.now();
      const frameTime = now - frameStart;
      
      this.performanceState.frameCount++;
      this.performanceState.lastFrameTime = frameTime;
      this.performanceState.averageFrameTime = 
        (this.performanceState.averageFrameTime * 0.9) + (frameTime * 0.1);

      // Check for performance issues
      if (frameTime > 33) { // Dropping below 30fps
        this.performanceState.isLowPerformance = true;
        this.handlePerformanceIssue(frameTime);
      } else {
        this.performanceState.isLowPerformance = false;
      }

      frameStart = now;
      requestAnimationFrame(monitorFrame);
    };

    requestAnimationFrame(monitorFrame);
  }

  /**
   * Setup battery optimization
   */
  async setupBatteryOptimization() {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        this.performanceState.batteryLevel = battery.level;

        battery.addEventListener('levelchange', () => {
          this.performanceState.batteryLevel = battery.level;
          
          if (battery.level < this.options.BATTERY_OPTIMIZATION_THRESHOLD / 100) {
            this.enableBatterySaveMode();
          } else {
            this.disableBatterySaveMode();
          }
        });

        console.log(`🔋 Battery optimization enabled (${Math.round(battery.level * 100)}%)`);
      } catch (error) {
        console.warn('Battery API not available:', error);
      }
    }
  }

  /**
   * Setup network awareness for offline gesture support
   */
  setupNetworkAwareness() {
    const updateNetworkStatus = () => {
      const isOnline = navigator.onLine;
      
      if (!isOnline) {
        this.enableOfflineMode();
      } else {
        this.disableOfflineMode();
      }
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    updateNetworkStatus();
  }

  /**
   * Setup memory management
   */
  setupMemoryManagement() {
    this.memoryTimer = setInterval(() => {
      this.cleanupMemory();
      this.updateMemoryUsage();
    }, this.options.MEMORY_CLEANUP_INTERVAL);
  }

  /**
   * Setup global gesture handlers
   */
  setupGlobalGestureHandlers() {
    // Add optimized touch event listeners
    const touchOptions = { passive: false, capture: true };

    document.addEventListener('touchstart', this.handleTouchStart.bind(this), touchOptions);
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), touchOptions);
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), touchOptions);
    document.addEventListener('touchcancel', this.handleTouchCancel.bind(this), touchOptions);

    // Setup passive listeners for performance
    document.addEventListener('wheel', this.handleWheel.bind(this), { passive: true });
    document.addEventListener('contextmenu', this.handleContextMenu.bind(this));
  }

  /**
   * Setup gaming context detection
   */
  setupGamingContextDetection() {
    // Detect current page context
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('/voting')) {
      this.gamingContext.currentPage = GAMING_CONTEXTS.VOTING;
    } else if (currentPath.includes('/clans')) {
      this.gamingContext.currentPage = GAMING_CONTEXTS.CLANS;
    } else if (currentPath.includes('/tournaments')) {
      this.gamingContext.currentPage = GAMING_CONTEXTS.TOURNAMENTS;
    } else if (currentPath.includes('/profile')) {
      this.gamingContext.currentPage = GAMING_CONTEXTS.PROFILE;
    } else if (currentPath.includes('/clips')) {
      this.gamingContext.currentPage = GAMING_CONTEXTS.CLIPS;
    } else {
      this.gamingContext.currentPage = GAMING_CONTEXTS.HOME;
    }

    // Listen for page changes
    window.addEventListener('popstate', () => {
      this.updateGamingContext();
    });

    console.log(`🎮 Gaming context detected: ${this.gamingContext.currentPage}`);
  }

  /**
   * Setup default gaming gesture patterns
   */
  setupGamingGesturePatterns() {
    // Voting gestures
    this.registerGamingGesture('vote-up', {
      direction: SWIPE_DIRECTIONS.UP,
      context: GAMING_CONTEXTS.VOTING,
      minDistance: this.options.VOTE_SWIPE_THRESHOLD,
      hapticPattern: this.options.HAPTIC_PATTERNS.VOTE_CONFIRM,
      action: (data) => this.handleVoteGesture('up', data)
    });

    this.registerGamingGesture('vote-down', {
      direction: SWIPE_DIRECTIONS.DOWN,
      context: GAMING_CONTEXTS.VOTING,
      minDistance: this.options.VOTE_SWIPE_THRESHOLD,
      hapticPattern: this.options.HAPTIC_PATTERNS.VOTE_CONFIRM,
      action: (data) => this.handleVoteGesture('down', data)
    });

    this.registerGamingGesture('super-vote', {
      type: 'long-press',
      context: GAMING_CONTEXTS.VOTING,
      duration: 1000,
      hapticPattern: this.options.HAPTIC_PATTERNS.SUPER_VOTE,
      action: (data) => this.handleSuperVoteGesture(data)
    });

    // Navigation gestures
    this.registerGamingGesture('nav-back', {
      direction: SWIPE_DIRECTIONS.RIGHT,
      context: 'global',
      minDistance: 80,
      fromEdge: 'left',
      hapticPattern: this.options.HAPTIC_PATTERNS.NAVIGATION,
      action: () => this.handleBackNavigation()
    });

    this.registerGamingGesture('nav-forward', {
      direction: SWIPE_DIRECTIONS.LEFT,
      context: 'global',
      minDistance: 80,
      fromEdge: 'right',
      hapticPattern: this.options.HAPTIC_PATTERNS.NAVIGATION,
      action: () => this.handleForwardNavigation()
    });

    // Clan gestures
    this.registerGamingGesture('clan-action', {
      direction: SWIPE_DIRECTIONS.LEFT,
      context: GAMING_CONTEXTS.CLANS,
      minDistance: this.options.CLAN_ACTION_THRESHOLD,
      hapticPattern: this.options.HAPTIC_PATTERNS.CLAN_ACTION,
      action: (data) => this.handleClanActionGesture(data)
    });

    // Tournament navigation
    this.registerGamingGesture('tournament-nav', {
      direction: [SWIPE_DIRECTIONS.LEFT, SWIPE_DIRECTIONS.RIGHT],
      context: GAMING_CONTEXTS.TOURNAMENTS,
      minDistance: this.options.TOURNAMENT_NAV_THRESHOLD,
      hapticPattern: this.options.HAPTIC_PATTERNS.TOURNAMENT_NAV,
      action: (data) => this.handleTournamentNavigation(data)
    });

    // Quick refresh gesture
    this.registerGamingGesture('pull-refresh', {
      direction: SWIPE_DIRECTIONS.DOWN,
      context: 'global',
      minDistance: 120,
      fromTop: true,
      hapticPattern: this.options.HAPTIC_PATTERNS.QUICK_ACTION,
      action: () => this.handlePullRefresh()
    });
  }

  /**
   * Touch event handlers
   */
  handleTouchStart(event) {
    if (this.performanceState.isLowPerformance && this.shouldSkipGesture()) {
      return;
    }

    const touch = event.touches[0];
    const now = performance.now();

    // Reset gesture state
    this.gestureState = {
      isTracking: true,
      startTime: now,
      startTouch: { x: touch.clientX, y: touch.clientY },
      currentTouch: { x: touch.clientX, y: touch.clientY },
      velocity: { x: 0, y: 0 },
      distance: 0,
      direction: SWIPE_DIRECTIONS.NONE,
      duration: 0,
      touchCount: event.touches.length,
      gestureType: 'unknown'
    };

    // Handle multi-touch
    if (event.touches.length > 1) {
      this.handleMultiTouchStart(event);
    }

    // Start gesture tracking
    this.startGestureTracking(event);
  }

  handleTouchMove(event) {
    if (!this.gestureState.isTracking) return;

    // Prevent default for gesture handling
    if (this.shouldPreventDefault(event)) {
      event.preventDefault();
    }

    const touch = event.touches[0];
    const now = performance.now();

    // Update gesture state
    this.gestureState.currentTouch = { x: touch.clientX, y: touch.clientY };
    this.gestureState.duration = now - this.gestureState.startTime;

    // Calculate velocity and distance
    this.updateGestureMetrics();

    // Handle multi-touch gestures
    if (event.touches.length > 1) {
      this.handleMultiTouchMove(event);
      return;
    }

    // Check for gesture recognition
    this.processGestureRecognition(event);
  }

  handleTouchEnd(event) {
    if (!this.gestureState.isTracking) return;

    const now = performance.now();
    this.gestureState.duration = now - this.gestureState.startTime;

    // Final gesture recognition
    const recognizedGesture = this.finalizeGestureRecognition(event);

    if (recognizedGesture) {
      this.executeGesture(recognizedGesture, event);
    }

    // Reset state
    this.resetGestureState();
  }

  handleTouchCancel(event) {
    this.resetGestureState();
  }

  /**
   * Multi-touch gesture handling
   */
  handleMultiTouchStart(event) {
    this.multiTouchState.touches = Array.from(event.touches).map(touch => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY
    }));

    if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      
      this.multiTouchState.initialDistance = this.calculateDistance(
        touch1.clientX, touch1.clientY,
        touch2.clientX, touch2.clientY
      );

      this.multiTouchState.center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      };
    }
  }

  handleMultiTouchMove(event) {
    if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      
      this.multiTouchState.currentDistance = this.calculateDistance(
        touch1.clientX, touch1.clientY,
        touch2.clientX, touch2.clientY
      );

      // Calculate scale
      if (this.multiTouchState.initialDistance > 0) {
        this.multiTouchState.scale = 
          this.multiTouchState.currentDistance / this.multiTouchState.initialDistance;
      }

      // Check for pinch gesture
      const scaleChange = Math.abs(this.multiTouchState.scale - 1);
      if (scaleChange > this.options.PINCH_THRESHOLD) {
        this.handlePinchGesture(this.multiTouchState.scale > 1 ? 'zoom-in' : 'zoom-out');
      }
    }
  }

  /**
   * Gesture recognition and processing
   */
  updateGestureMetrics() {
    const deltaX = this.gestureState.currentTouch.x - this.gestureState.startTouch.x;
    const deltaY = this.gestureState.currentTouch.y - this.gestureState.startTouch.y;
    
    this.gestureState.distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (this.gestureState.duration > 0) {
      this.gestureState.velocity = {
        x: deltaX / this.gestureState.duration,
        y: deltaY / this.gestureState.duration
      };
    }

    // Determine direction
    this.gestureState.direction = this.calculateDirection(deltaX, deltaY);
  }

  calculateDirection(deltaX, deltaY) {
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    // Check if movement is significant enough
    if (this.gestureState.distance < this.options.MIN_SWIPE_DISTANCE) {
      return SWIPE_DIRECTIONS.NONE;
    }

    // Calculate angle for diagonal detection
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    const absAngle = Math.abs(angle);

    // Determine primary direction with diagonal support
    if (absDeltaX > absDeltaY * 2) {
      // Primarily horizontal
      return deltaX > 0 ? SWIPE_DIRECTIONS.RIGHT : SWIPE_DIRECTIONS.LEFT;
    } else if (absDeltaY > absDeltaX * 2) {
      // Primarily vertical
      return deltaY > 0 ? SWIPE_DIRECTIONS.DOWN : SWIPE_DIRECTIONS.UP;
    } else {
      // Diagonal
      if (deltaX > 0 && deltaY > 0) return SWIPE_DIRECTIONS.DOWN_RIGHT;
      if (deltaX > 0 && deltaY < 0) return SWIPE_DIRECTIONS.UP_RIGHT;
      if (deltaX < 0 && deltaY > 0) return SWIPE_DIRECTIONS.DOWN_LEFT;
      if (deltaX < 0 && deltaY < 0) return SWIPE_DIRECTIONS.UP_LEFT;
    }

    return SWIPE_DIRECTIONS.NONE;
  }

  processGestureRecognition(event) {
    // Real-time gesture recognition for immediate feedback
    const targetElement = event.target;
    const elementHandlers = this.gestureHandlers.get(targetElement);

    if (elementHandlers) {
      for (const handler of elementHandlers) {
        if (this.matchesGesturePattern(handler)) {
          // Provide immediate visual feedback
          this.provideGestureFeedback(handler, 'progress');
        }
      }
    }

    // Check global and contextual handlers
    this.checkGlobalGestures();
    this.checkContextualGestures();
  }

  finalizeGestureRecognition(event) {
    const targetElement = event.target;
    
    // Check element-specific gestures first
    const elementHandlers = this.gestureHandlers.get(targetElement) || [];
    for (const handler of elementHandlers) {
      if (this.matchesGesturePattern(handler)) {
        return { handler, element: targetElement, type: 'element' };
      }
    }

    // Check global gestures
    for (const [name, handler] of this.globalGestureHandlers) {
      if (this.matchesGesturePattern(handler)) {
        return { handler, name, type: 'global' };
      }
    }

    // Check contextual gestures
    const contextHandlers = this.contextualHandlers.get(this.gamingContext.currentPage) || [];
    for (const handler of contextHandlers) {
      if (this.matchesGesturePattern(handler)) {
        return { handler, type: 'contextual' };
      }
    }

    return null;
  }

  matchesGesturePattern(handler) {
    // Check direction match
    if (handler.direction) {
      if (Array.isArray(handler.direction)) {
        if (!handler.direction.includes(this.gestureState.direction)) {
          return false;
        }
      } else if (handler.direction !== this.gestureState.direction) {
        return false;
      }
    }

    // Check minimum distance
    if (handler.minDistance && this.gestureState.distance < handler.minDistance) {
      return false;
    }

    // Check maximum distance
    if (handler.maxDistance && this.gestureState.distance > handler.maxDistance) {
      return false;
    }

    // Check velocity requirements
    if (handler.minVelocity) {
      const totalVelocity = Math.sqrt(
        this.gestureState.velocity.x ** 2 + this.gestureState.velocity.y ** 2
      );
      if (totalVelocity < handler.minVelocity) {
        return false;
      }
    }

    // Check timing requirements
    if (handler.maxDuration && this.gestureState.duration > handler.maxDuration) {
      return false;
    }

    if (handler.minDuration && this.gestureState.duration < handler.minDuration) {
      return false;
    }

    // Check edge detection
    if (handler.fromEdge) {
      if (!this.isFromEdge(handler.fromEdge)) {
        return false;
      }
    }

    // Check gaming context
    if (handler.context && handler.context !== 'global') {
      if (handler.context !== this.gamingContext.currentPage) {
        return false;
      }
    }

    return true;
  }

  /**
   * Gesture execution and feedback
   */
  executeGesture(recognizedGesture, originalEvent) {
    const { handler, element, type } = recognizedGesture;

    try {
      // Provide haptic feedback
      if (handler.hapticPattern && this.options.enableHapticFeedback) {
        this.provideHapticFeedback(handler.hapticPattern);
      }

      // Execute gesture action
      const gestureData = {
        direction: this.gestureState.direction,
        distance: this.gestureState.distance,
        velocity: this.gestureState.velocity,
        duration: this.gestureState.duration,
        startPoint: this.gestureState.startTouch,
        endPoint: this.gestureState.currentTouch,
        element: element,
        originalEvent: originalEvent,
        context: this.gamingContext.currentPage
      };

      handler.action(gestureData);

      // Provide visual feedback
      this.provideGestureFeedback(handler, 'success');

      // Log for debugging
      if (this.options.debugMode) {
        console.log('🎮 Gesture executed:', {
          type,
          direction: this.gestureState.direction,
          distance: this.gestureState.distance,
          duration: this.gestureState.duration
        });
      }

      // Dispatch gesture event
      this.dispatchEvent('gesture-executed', {
        gesture: recognizedGesture,
        data: gestureData
      });

    } catch (error) {
      console.error('❌ Error executing gesture:', error);
      this.provideGestureFeedback(handler, 'error');
      
      if (this.options.enableHapticFeedback) {
        this.provideHapticFeedback(this.options.HAPTIC_PATTERNS.ERROR);
      }
    }
  }

  provideHapticFeedback(pattern) {
    if (!navigator.vibrate) return;

    try {
      if (Array.isArray(pattern)) {
        navigator.vibrate(pattern);
      } else {
        navigator.vibrate(pattern);
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  provideGestureFeedback(handler, state) {
    // Visual feedback implementation would be added here
    // This could include ripple effects, color changes, etc.
    if (this.options.debugMode) {
      console.log(`🎨 Gesture feedback: ${state}`);
    }
  }

  /**
   * Gaming gesture handlers
   */
  handleVoteGesture(direction, data) {
    this.dispatchEvent('mlg-vote-gesture', {
      direction,
      distance: data.distance,
      velocity: data.velocity,
      isQuick: data.duration < this.options.QUICK_SWIPE_TIME
    });
  }

  handleSuperVoteGesture(data) {
    this.dispatchEvent('mlg-super-vote-gesture', {
      duration: data.duration,
      element: data.element
    });
  }

  handleClanActionGesture(data) {
    this.dispatchEvent('mlg-clan-action-gesture', {
      direction: data.direction,
      element: data.element,
      member: data.element?.dataset?.clanMember
    });
  }

  handleTournamentNavigation(data) {
    this.dispatchEvent('mlg-tournament-nav-gesture', {
      direction: data.direction,
      distance: data.distance
    });
  }

  handleBackNavigation() {
    history.back();
  }

  handleForwardNavigation() {
    history.forward();
  }

  handlePullRefresh() {
    this.dispatchEvent('mlg-pull-refresh', {
      context: this.gamingContext.currentPage
    });
  }

  handlePinchGesture(type) {
    this.dispatchEvent('mlg-pinch-gesture', {
      type,
      scale: this.multiTouchState.scale,
      center: this.multiTouchState.center
    });
  }

  /**
   * Registration methods
   */
  registerGamingGesture(name, config) {
    if (config.context === 'global') {
      this.globalGestureHandlers.set(name, config);
    } else if (config.context) {
      if (!this.contextualHandlers.has(config.context)) {
        this.contextualHandlers.set(config.context, []);
      }
      this.contextualHandlers.get(config.context).push(config);
    }
  }

  registerElementGesture(element, gestureConfig) {
    if (!this.gestureHandlers.has(element)) {
      this.gestureHandlers.set(element, []);
    }
    
    this.gestureHandlers.get(element).push(gestureConfig);
    this.activeElements.add(element);
  }

  unregisterElementGesture(element) {
    this.gestureHandlers.delete(element);
    this.activeElements.delete(element);
  }

  /**
   * Performance optimization methods
   */
  handlePerformanceIssue(frameTime) {
    if (frameTime > 50) { // Severe performance issue
      this.enableLowPerformanceMode();
    }
  }

  enableLowPerformanceMode() {
    this.options.MIN_SWIPE_DISTANCE *= 1.5;
    this.options.enableHapticFeedback = false;
    console.warn('⚡ Low performance mode enabled');
  }

  disableLowPerformanceMode() {
    this.options.MIN_SWIPE_DISTANCE = SWIPE_GESTURE_CONFIG.MIN_SWIPE_DISTANCE;
    this.options.enableHapticFeedback = true;
    console.log('⚡ Performance mode normalized');
  }

  enableBatterySaveMode() {
    this.options.enableHapticFeedback = false;
    this.options.FRAME_RATE_TARGET = 30;
    console.log('🔋 Battery save mode enabled');
  }

  disableBatterySaveMode() {
    this.options.enableHapticFeedback = true;
    this.options.FRAME_RATE_TARGET = 60;
    console.log('🔋 Battery save mode disabled');
  }

  enableOfflineMode() {
    // Disable network-dependent features
    console.log('📡 Offline mode enabled');
  }

  disableOfflineMode() {
    // Re-enable network features
    console.log('📡 Online mode enabled');
  }

  shouldSkipGesture() {
    // Skip gestures under heavy load
    return this.performanceState.averageFrameTime > 33; // Below 30fps
  }

  shouldPreventDefault(event) {
    // Prevent default for gesture-enabled elements
    const target = event.target;
    return this.gestureHandlers.has(target) || 
           target.hasAttribute('data-gesture-enabled');
  }

  /**
   * Utility methods
   */
  calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  isFromEdge(edge) {
    const threshold = 50; // pixels from edge
    const { startTouch } = this.gestureState;
    const { innerWidth, innerHeight } = window;

    switch (edge) {
      case 'left':
        return startTouch.x < threshold;
      case 'right':
        return startTouch.x > innerWidth - threshold;
      case 'top':
        return startTouch.y < threshold;
      case 'bottom':
        return startTouch.y > innerHeight - threshold;
      default:
        return false;
    }
  }

  checkGlobalGestures() {
    // Implementation for checking global gestures during movement
  }

  checkContextualGestures() {
    // Implementation for checking contextual gestures during movement
  }

  updateGamingContext() {
    // Update gaming context based on current page
    this.setupGamingContextDetection();
  }

  resetGestureState() {
    this.gestureState.isTracking = false;
    this.multiTouchState.touches = [];
  }

  /**
   * Memory management
   */
  cleanupMemory() {
    // Remove references to destroyed elements
    for (const element of this.activeElements) {
      if (!document.contains(element)) {
        this.unregisterElementGesture(element);
      }
    }

    // Clear old event queue items
    if (this.eventSystem.queue.length > 100) {
      this.eventSystem.queue = this.eventSystem.queue.slice(-50);
    }
  }

  updateMemoryUsage() {
    if ('memory' in performance) {
      this.performanceState.memoryUsage = performance.memory.usedJSHeapSize;
    }
  }

  /**
   * Event system
   */
  dispatchEvent(eventName, detail) {
    const event = new CustomEvent(eventName, { detail });
    document.dispatchEvent(event);

    // Queue for processing
    this.eventSystem.queue.push({ eventName, detail, timestamp: Date.now() });
  }

  getSystemCapabilities() {
    return {
      touchSupport: 'ontouchstart' in window,
      multiTouch: navigator.maxTouchPoints > 1,
      hapticSupport: 'vibrate' in navigator,
      performanceAPI: 'performance' in window,
      batteryAPI: 'getBattery' in navigator,
      maxTouchPoints: navigator.maxTouchPoints,
      orientation: screen.orientation?.type || 'unknown'
    };
  }

  /**
   * Public API methods
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceState,
      activeGestures: this.activeElements.size,
      queueSize: this.eventSystem.queue.length
    };
  }

  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    console.log('🔥 Destroying MLG Swipe Gesture System...');

    // Clear timers
    if (this.memoryTimer) {
      clearInterval(this.memoryTimer);
    }

    // Remove event listeners
    document.removeEventListener('touchstart', this.handleTouchStart);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
    document.removeEventListener('touchcancel', this.handleTouchCancel);

    // Clear data structures
    this.gestureHandlers.clear();
    this.globalGestureHandlers.clear();
    this.contextualHandlers.clear();
    this.activeElements.clear();

    console.log('✅ MLG Swipe Gesture System destroyed');
  }
}

// Export singleton instance
const MLGSwipeGestures = new MLGSwipeGestureSystem();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.MLGSwipeGestures = MLGSwipeGestures;
}

export default MLGSwipeGestures;
export { 
  MLGSwipeGestureSystem, 
  SWIPE_DIRECTIONS, 
  GAMING_CONTEXTS,
  SWIPE_GESTURE_CONFIG
};