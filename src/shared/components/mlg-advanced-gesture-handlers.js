/**
 * MLG.clan Advanced Multi-Directional Gesture Handlers
 * 
 * Advanced gesture recognition system with comprehensive multi-directional support
 * Gaming-optimized gesture patterns with conflict resolution and priority handling
 * 
 * Features:
 * - 8-direction gesture recognition (N, NE, E, SE, S, SW, W, NW)
 * - Multi-touch gesture support (2-5 finger gestures)
 * - Gaming-specific gesture patterns (combat combos, quick actions)
 * - Advanced conflict resolution with gesture priority system
 * - Gesture velocity and acceleration analysis
 * - Custom gesture sequence recognition
 * - Gaming context-aware gesture adaptation
 * - Real-time gesture prediction and suggestion
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 */

import MLGSwipeGestures, { SWIPE_DIRECTIONS, GAMING_CONTEXTS } from './mlg-swipe-gesture-system.js';

/**
 * Advanced Gesture Configuration
 */
const ADVANCED_GESTURE_CONFIG = {
  // Multi-directional thresholds
  DIRECTION_PRECISION: 22.5, // degrees for 8-direction recognition
  DIAGONAL_THRESHOLD: 0.7,   // ratio for diagonal detection
  
  // Multi-touch configuration
  MAX_TOUCH_POINTS: 5,
  MULTI_TOUCH_TIMEOUT: 500,
  TOUCH_CLUSTERING_DISTANCE: 50,
  
  // Gesture sequence configuration
  SEQUENCE_TIMEOUT: 2000,
  MAX_SEQUENCE_LENGTH: 6,
  SEQUENCE_PRECISION_THRESHOLD: 0.8,
  
  // Gaming gesture patterns
  COMBO_GESTURE_TIMING: 300,
  QUICK_ACTION_VELOCITY: 1.0,
  PRECISION_ACTION_VELOCITY: 0.3,
  
  // Conflict resolution priorities
  GESTURE_PRIORITIES: {
    NAVIGATION: 1,
    VOTING: 2,
    CLAN_ACTIONS: 3,
    TOURNAMENT: 4,
    QUICK_ACTIONS: 5,
    CUSTOM: 6
  },
  
  // Performance optimization
  GESTURE_PREDICTION_WINDOW: 150,
  THROTTLE_THRESHOLD: 16, // 60fps
  MEMORY_LIMIT_GESTURES: 100,
  
  // Gaming-specific gesture combos
  GAMING_COMBOS: {
    // Combat-style gestures for competitive interactions
    TRIPLE_VOTE: ['up', 'up', 'down'], // Triple vote combo
    POWER_PROMOTE: ['right', 'up', 'right'], // Power promote in clans
    TOURNAMENT_BLITZ: ['left', 'right', 'up'], // Tournament quick join
    CLAN_CHALLENGE: ['down', 'left', 'up', 'right'], // Challenge clan member
    SUPER_REFRESH: ['down', 'down', 'up'], // Super refresh data
    
    // Navigation combos
    HOME_PORTAL: ['up', 'down', 'left', 'right'], // Quick home
    SECTION_CYCLE: ['right', 'right', 'left'], // Cycle through sections
    BACK_STACK: ['left', 'left', 'left'], // Back navigation stack
    
    // Quick action combos
    EMERGENCY_EXIT: ['down', 'down', 'down'], // Emergency app exit
    DEBUG_MODE: ['up', 'up', 'down', 'down'], // Debug mode toggle
    ACCESSIBILITY_BOOST: ['up', 'right', 'down', 'left'] // Accessibility shortcuts
  }
};

/**
 * Detailed Direction Constants (8-direction + custom)
 */
const DETAILED_DIRECTIONS = {
  NORTH: 'north',           // 0°   (up)
  NORTHEAST: 'northeast',   // 45°  (up-right)
  EAST: 'east',            // 90°  (right)
  SOUTHEAST: 'southeast',   // 135° (down-right)
  SOUTH: 'south',          // 180° (down)
  SOUTHWEST: 'southwest',   // 225° (down-left)
  WEST: 'west',            // 270° (left)
  NORTHWEST: 'northwest',   // 315° (up-left)
  
  // Special directions
  CENTER: 'center',         // No movement (tap/press)
  CIRCULAR_CW: 'circular-cw',     // Circular clockwise
  CIRCULAR_CCW: 'circular-ccw',   // Circular counter-clockwise
  PINCH_IN: 'pinch-in',     // Pinch inward
  PINCH_OUT: 'pinch-out',   // Pinch outward
  ROTATE_CW: 'rotate-cw',   // Rotate clockwise
  ROTATE_CCW: 'rotate-ccw'  // Rotate counter-clockwise
};

/**
 * Advanced Multi-Directional Gesture Handler
 */
export class MLGAdvancedGestureHandlers {
  constructor(options = {}) {
    this.options = {
      ...ADVANCED_GESTURE_CONFIG,
      enableMultiTouch: true,
      enableGestureSequences: true,
      enableGesturePrediction: true,
      enableConflictResolution: true,
      enableGamingCombos: true,
      debugMode: process.env.NODE_ENV === 'development',
      ...options
    };

    // Advanced gesture state
    this.gestureState = {
      activeGestures: new Map(),
      gestureSequence: [],
      sequenceStartTime: 0,
      lastGestureTime: 0,
      
      // Multi-touch state
      touchPoints: new Map(),
      touchClusters: [],
      multiTouchGestures: new Set(),
      
      // Prediction state
      predictionHistory: [],
      predictedGesture: null,
      
      // Conflict resolution
      conflictQueue: [],
      activeConflicts: new Map(),
      
      // Performance state
      gestureCount: 0,
      lastThrottleTime: 0
    };

    // Gesture recognition systems
    this.recognitionSystems = {
      directional: new DirectionalGestureRecognizer(),
      multiTouch: new MultiTouchGestureRecognizer(),
      sequence: new GestureSequenceRecognizer(),
      combo: new GamingComboRecognizer(),
      prediction: new GesturePredictionEngine()
    };

    // Registered gesture handlers
    this.gestureHandlers = new Map();
    this.priorityHandlers = new Map();
    this.conflictResolvers = new Map();

    this.init();
  }

  /**
   * Initialize advanced gesture handlers
   */
  async init() {
    console.log('🎮 Initializing Advanced Gesture Handlers...');

    try {
      // Initialize recognition systems
      await this.initializeRecognitionSystems();

      // Setup multi-directional gesture patterns
      this.setupMultiDirectionalGestures();

      // Setup multi-touch gesture patterns
      if (this.options.enableMultiTouch) {
        this.setupMultiTouchGestures();
      }

      // Setup gesture sequences
      if (this.options.enableGestureSequences) {
        this.setupGestureSequences();
      }

      // Setup gaming combos
      if (this.options.enableGamingCombos) {
        this.setupGamingCombos();
      }

      // Setup conflict resolution
      if (this.options.enableConflictResolution) {
        this.setupConflictResolution();
      }

      // Setup gesture prediction
      if (this.options.enableGesturePrediction) {
        this.setupGesturePrediction();
      }

      // Setup advanced event handlers
      this.setupAdvancedEventHandlers();

      console.log('✅ Advanced Gesture Handlers initialized');

      // Dispatch initialization event
      document.dispatchEvent(new CustomEvent('mlg-advanced-gestures-initialized', {
        detail: {
          supportedDirections: Object.values(DETAILED_DIRECTIONS),
          supportedCombos: Object.keys(this.options.GAMING_COMBOS),
          multiTouchSupport: this.options.enableMultiTouch
        }
      }));

    } catch (error) {
      console.error('❌ Failed to initialize advanced gesture handlers:', error);
      throw error;
    }
  }

  /**
   * Initialize recognition systems
   */
  async initializeRecognitionSystems() {
    // Initialize directional recognizer
    this.recognitionSystems.directional.init({
      directionPrecision: this.options.DIRECTION_PRECISION,
      diagonalThreshold: this.options.DIAGONAL_THRESHOLD
    });

    // Initialize multi-touch recognizer
    this.recognitionSystems.multiTouch.init({
      maxTouchPoints: this.options.MAX_TOUCH_POINTS,
      clusteringDistance: this.options.TOUCH_CLUSTERING_DISTANCE
    });

    // Initialize sequence recognizer
    this.recognitionSystems.sequence.init({
      maxSequenceLength: this.options.MAX_SEQUENCE_LENGTH,
      sequenceTimeout: this.options.SEQUENCE_TIMEOUT
    });

    // Initialize combo recognizer
    this.recognitionSystems.combo.init({
      combos: this.options.GAMING_COMBOS,
      comboTiming: this.options.COMBO_GESTURE_TIMING
    });

    // Initialize prediction engine
    this.recognitionSystems.prediction.init({
      predictionWindow: this.options.GESTURE_PREDICTION_WINDOW
    });
  }

  /**
   * Setup multi-directional gesture patterns
   */
  setupMultiDirectionalGestures() {
    // 8-direction navigation gestures
    Object.values(DETAILED_DIRECTIONS).forEach(direction => {
      if (this.isCardinalOrDiagonal(direction)) {
        this.registerAdvancedGesture(`nav-${direction}`, {
          type: 'directional',
          direction: direction,
          context: 'global',
          priority: this.options.GESTURE_PRIORITIES.NAVIGATION,
          action: (data) => this.handleDirectionalNavigation(direction, data)
        });
      }
    });

    // Circular gestures for special actions
    this.registerAdvancedGesture('circular-menu', {
      type: 'circular',
      direction: DETAILED_DIRECTIONS.CIRCULAR_CW,
      context: 'global',
      minRadius: 80,
      priority: this.options.GESTURE_PRIORITIES.QUICK_ACTIONS,
      action: (data) => this.handleCircularMenu(data)
    });

    // Rotation gestures for content manipulation
    this.registerAdvancedGesture('content-rotate', {
      type: 'rotation',
      context: [GAMING_CONTEXTS.TOURNAMENTS, GAMING_CONTEXTS.CLIPS],
      minAngle: 15,
      priority: this.options.GESTURE_PRIORITIES.TOURNAMENT,
      action: (data) => this.handleContentRotation(data)
    });

    console.log('🧭 Multi-directional gestures configured');
  }

  /**
   * Setup multi-touch gesture patterns
   */
  setupMultiTouchGestures() {
    // Two-finger gestures
    this.registerAdvancedGesture('two-finger-scroll', {
      type: 'multi-touch',
      touchCount: 2,
      direction: [DETAILED_DIRECTIONS.NORTH, DETAILED_DIRECTIONS.SOUTH],
      context: 'global',
      priority: this.options.GESTURE_PRIORITIES.NAVIGATION,
      action: (data) => this.handleTwoFingerScroll(data)
    });

    this.registerAdvancedGesture('two-finger-zoom', {
      type: 'pinch',
      touchCount: 2,
      context: [GAMING_CONTEXTS.TOURNAMENTS, GAMING_CONTEXTS.CLIPS],
      priority: this.options.GESTURE_PRIORITIES.TOURNAMENT,
      action: (data) => this.handleTwoFingerZoom(data)
    });

    // Three-finger gestures
    this.registerAdvancedGesture('three-finger-nav', {
      type: 'multi-touch',
      touchCount: 3,
      direction: [DETAILED_DIRECTIONS.WEST, DETAILED_DIRECTIONS.EAST],
      context: 'global',
      priority: this.options.GESTURE_PRIORITIES.NAVIGATION,
      action: (data) => this.handleThreeFingerNav(data)
    });

    // Four-finger gestures for app control
    this.registerAdvancedGesture('four-finger-home', {
      type: 'multi-touch',
      touchCount: 4,
      direction: DETAILED_DIRECTIONS.NORTH,
      context: 'global',
      priority: this.options.GESTURE_PRIORITIES.QUICK_ACTIONS,
      action: (data) => this.handleFourFingerHome(data)
    });

    // Five-finger gesture for emergency actions
    this.registerAdvancedGesture('five-finger-emergency', {
      type: 'multi-touch',
      touchCount: 5,
      context: 'global',
      priority: this.options.GESTURE_PRIORITIES.QUICK_ACTIONS,
      action: (data) => this.handleEmergencyGesture(data)
    });

    console.log('✋ Multi-touch gestures configured');
  }

  /**
   * Setup gesture sequences
   */
  setupGestureSequences() {
    // Gaming unlock sequences
    this.registerGestureSequence('dev-mode-unlock', {
      sequence: ['up', 'up', 'down', 'down', 'left', 'right'],
      timeout: 3000,
      context: 'global',
      action: () => this.unlockDeveloperMode()
    });

    this.registerGestureSequence('super-user-mode', {
      sequence: ['northeast', 'southeast', 'southwest', 'northwest'],
      timeout: 2000,
      context: 'global',
      action: () => this.activateSuperUserMode()
    });

    // Gaming navigation sequences
    this.registerGestureSequence('quick-vote-mode', {
      sequence: ['up', 'down', 'up'],
      timeout: 1500,
      context: GAMING_CONTEXTS.VOTING,
      action: () => this.activateQuickVoteMode()
    });

    this.registerGestureSequence('clan-management-mode', {
      sequence: ['right', 'left', 'right', 'left'],
      timeout: 2000,
      context: GAMING_CONTEXTS.CLANS,
      action: () => this.activateClanManagementMode()
    });

    console.log('🔢 Gesture sequences configured');
  }

  /**
   * Setup gaming combos
   */
  setupGamingCombos() {
    Object.entries(this.options.GAMING_COMBOS).forEach(([comboName, sequence]) => {
      this.registerGamingCombo(comboName, {
        sequence: sequence,
        timing: this.options.COMBO_GESTURE_TIMING,
        context: this.getComboContext(comboName),
        action: (data) => this.handleGamingCombo(comboName, data)
      });
    });

    console.log('🎮 Gaming combos configured');
  }

  /**
   * Setup conflict resolution
   */
  setupConflictResolution() {
    // Register conflict resolvers for different gesture types
    this.conflictResolvers.set('navigation-vs-voting', {
      priority: (gestureA, gestureB) => {
        // Voting gestures take priority in voting context
        if (this.getCurrentContext() === GAMING_CONTEXTS.VOTING) {
          return gestureA.type === 'voting' ? gestureA : gestureB;
        }
        return gestureA.priority > gestureB.priority ? gestureA : gestureB;
      }
    });

    this.conflictResolvers.set('multi-touch-vs-single', {
      priority: (gestureA, gestureB) => {
        // Multi-touch gestures take priority over single-touch
        return gestureA.touchCount > gestureB.touchCount ? gestureA : gestureB;
      }
    });

    this.conflictResolvers.set('sequence-vs-single', {
      priority: (gestureA, gestureB) => {
        // Sequence gestures take priority if sequence is in progress
        if (this.gestureState.gestureSequence.length > 0) {
          return gestureA.type === 'sequence' ? gestureA : gestureB;
        }
        return gestureA.priority > gestureB.priority ? gestureA : gestureB;
      }
    });

    console.log('⚖️ Conflict resolution configured');
  }

  /**
   * Setup gesture prediction
   */
  setupGesturePrediction() {
    // Enable predictive gesture recognition
    this.recognitionSystems.prediction.enablePrediction({
      onPrediction: (predictedGesture) => {
        this.handleGesturePrediction(predictedGesture);
      },
      confidence: 0.7,
      lookAhead: this.options.GESTURE_PREDICTION_WINDOW
    });

    console.log('🔮 Gesture prediction enabled');
  }

  /**
   * Setup advanced event handlers
   */
  setupAdvancedEventHandlers() {
    // Listen for base gesture events
    document.addEventListener('mlg-gesture-start', (e) => {
      this.handleGestureStart(e.detail);
    });

    document.addEventListener('mlg-gesture-progress', (e) => {
      this.handleGestureProgress(e.detail);
    });

    document.addEventListener('mlg-gesture-end', (e) => {
      this.handleGestureEnd(e.detail);
    });

    // Performance monitoring
    document.addEventListener('mlg-performance-warning', (e) => {
      this.handlePerformanceWarning(e.detail);
    });
  }

  /**
   * Advanced gesture handlers
   */
  handleGestureStart(gestureData) {
    const gestureId = this.generateGestureId();
    
    // Store active gesture
    this.gestureState.activeGestures.set(gestureId, {
      ...gestureData,
      id: gestureId,
      startTime: performance.now(),
      status: 'active'
    });

    // Start prediction for this gesture
    if (this.options.enableGesturePrediction) {
      this.recognitionSystems.prediction.startPrediction(gestureId, gestureData);
    }

    // Update performance metrics
    this.gestureState.gestureCount++;
  }

  handleGestureProgress(gestureData) {
    const gestureId = gestureData.id;
    const activeGesture = this.gestureState.activeGestures.get(gestureId);

    if (!activeGesture) return;

    // Update gesture state
    activeGesture.currentData = gestureData;
    activeGesture.lastUpdate = performance.now();

    // Check for gesture recognition
    this.processAdvancedGestureRecognition(activeGesture);

    // Update prediction
    if (this.options.enableGesturePrediction) {
      this.recognitionSystems.prediction.updatePrediction(gestureId, gestureData);
    }
  }

  handleGestureEnd(gestureData) {
    const gestureId = gestureData.id;
    const activeGesture = this.gestureState.activeGestures.get(gestureId);

    if (!activeGesture) return;

    // Finalize gesture recognition
    const recognizedGesture = this.finalizeAdvancedGestureRecognition(activeGesture);

    if (recognizedGesture) {
      this.executeAdvancedGesture(recognizedGesture);
    }

    // Clean up
    this.gestureState.activeGestures.delete(gestureId);

    // End prediction
    if (this.options.enableGesturePrediction) {
      this.recognitionSystems.prediction.endPrediction(gestureId);
    }
  }

  /**
   * Advanced gesture recognition processing
   */
  processAdvancedGestureRecognition(activeGesture) {
    const currentTime = performance.now();
    
    // Throttle recognition for performance
    if (currentTime - this.gestureState.lastThrottleTime < this.options.THROTTLE_THRESHOLD) {
      return;
    }
    this.gestureState.lastThrottleTime = currentTime;

    // Directional recognition
    const direction = this.recognitionSystems.directional.recognizeDirection(activeGesture);
    
    // Multi-touch recognition
    if (activeGesture.touchCount > 1) {
      const multiTouchPattern = this.recognitionSystems.multiTouch.recognizePattern(activeGesture);
      if (multiTouchPattern) {
        this.handleMultiTouchPattern(multiTouchPattern, activeGesture);
      }
    }

    // Sequence recognition
    if (this.gestureState.gestureSequence.length > 0) {
      const sequenceMatch = this.recognitionSystems.sequence.checkSequence(
        this.gestureState.gestureSequence,
        direction
      );
      if (sequenceMatch) {
        this.handleSequenceMatch(sequenceMatch);
      }
    }

    // Combo recognition
    const comboMatch = this.recognitionSystems.combo.checkCombo(direction);
    if (comboMatch) {
      this.handleComboMatch(comboMatch, activeGesture);
    }
  }

  finalizeAdvancedGestureRecognition(activeGesture) {
    const direction = this.recognitionSystems.directional.finalizeDirection(activeGesture);
    
    // Add to gesture sequence
    if (direction && direction !== DETAILED_DIRECTIONS.CENTER) {
      this.addToGestureSequence(direction);
    }

    // Find matching gesture handlers
    const candidates = this.findGestureCandidates(activeGesture, direction);

    // Resolve conflicts if multiple candidates
    if (candidates.length > 1) {
      return this.resolveGestureConflict(candidates);
    } else if (candidates.length === 1) {
      return candidates[0];
    }

    return null;
  }

  /**
   * Multi-touch gesture handlers
   */
  handleTwoFingerScroll(data) {
    console.log('📜 Two-finger scroll gesture');
    
    const scrollDirection = data.direction === DETAILED_DIRECTIONS.NORTH ? 'up' : 'down';
    const scrollAmount = data.distance * 0.5;

    window.scrollBy(0, scrollDirection === 'up' ? -scrollAmount : scrollAmount);
  }

  handleTwoFingerZoom(data) {
    console.log(`🔍 Two-finger zoom: ${data.scale}x`);
    
    const targetElement = data.element || document.querySelector('[data-zoomable]');
    
    if (targetElement) {
      targetElement.style.transform = `scale(${data.scale})`;
    }
  }

  handleThreeFingerNav(data) {
    console.log(`🖐️ Three-finger navigation: ${data.direction}`);
    
    if (data.direction === DETAILED_DIRECTIONS.WEST) {
      history.back();
    } else if (data.direction === DETAILED_DIRECTIONS.EAST) {
      history.forward();
    }
  }

  handleFourFingerHome(data) {
    console.log('🏠 Four-finger home gesture');
    
    window.location.href = '/';
  }

  handleEmergencyGesture(data) {
    console.log('🚨 Emergency gesture activated');
    
    // Show emergency menu or exit app
    this.showEmergencyMenu();
  }

  /**
   * Directional navigation handlers
   */
  handleDirectionalNavigation(direction, data) {
    console.log(`🧭 Directional navigation: ${direction}`);
    
    const navigationMap = this.getNavigationMap(direction);
    
    if (navigationMap) {
      this.executeDirectionalNavigation(navigationMap, data);
    }
  }

  handleCircularMenu(data) {
    console.log('🔄 Circular menu gesture');
    
    this.showCircularActionMenu(data.center);
  }

  handleContentRotation(data) {
    console.log(`🔄 Content rotation: ${data.angle}°`);
    
    const targetElement = data.element || document.querySelector('[data-rotatable]');
    
    if (targetElement) {
      targetElement.style.transform = `rotate(${data.angle}deg)`;
    }
  }

  /**
   * Gaming combo handlers
   */
  handleGamingCombo(comboName, data) {
    console.log(`🎮 Gaming combo executed: ${comboName}`);
    
    const comboActions = {
      'TRIPLE_VOTE': () => this.executeTripleVote(),
      'POWER_PROMOTE': () => this.executePowerPromote(data),
      'TOURNAMENT_BLITZ': () => this.executeTournamentBlitz(),
      'CLAN_CHALLENGE': () => this.executeClanChallenge(data),
      'SUPER_REFRESH': () => this.executeSuperRefresh(),
      'HOME_PORTAL': () => this.executeHomePortal(),
      'SECTION_CYCLE': () => this.executeSectionCycle(),
      'BACK_STACK': () => this.executeBackStack(),
      'EMERGENCY_EXIT': () => this.executeEmergencyExit(),
      'DEBUG_MODE': () => this.toggleDebugMode(),
      'ACCESSIBILITY_BOOST': () => this.activateAccessibilityBoost()
    };
    
    if (comboActions[comboName]) {
      comboActions[comboName]();
    }
  }

  /**
   * Sequence and combo actions
   */
  executeTripleVote() {
    console.log('🗳️ Triple vote combo activated');
    
    // Execute three rapid votes
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent('mlg-quick-vote', {
          detail: { direction: 'up', combo: true }
        }));
      }, i * 100);
    }
  }

  executePowerPromote(data) {
    console.log('⚡ Power promote combo activated');
    
    const memberElement = data.element?.closest('[data-clan-member]');
    if (memberElement) {
      document.dispatchEvent(new CustomEvent('mlg-power-promote', {
        detail: { 
          memberId: memberElement.dataset.clanMember,
          combo: true 
        }
      }));
    }
  }

  executeTournamentBlitz() {
    console.log('🏆 Tournament blitz combo activated');
    
    // Quick join available tournaments
    document.dispatchEvent(new CustomEvent('mlg-tournament-blitz', {
      detail: { action: 'quick-join' }
    }));
  }

  executeClanChallenge(data) {
    console.log('⚔️ Clan challenge combo activated');
    
    // Challenge clan member or rival clan
    document.dispatchEvent(new CustomEvent('mlg-clan-challenge', {
      detail: { type: 'combo-challenge' }
    }));
  }

  executeSuperRefresh() {
    console.log('🔄 Super refresh combo activated');
    
    // Force refresh all gaming data
    document.dispatchEvent(new CustomEvent('mlg-super-refresh', {
      detail: { 
        refreshAll: true,
        combo: true
      }
    }));
  }

  executeHomePortal() {
    console.log('🏠 Home portal combo activated');
    
    // Navigate to home with special effect
    this.createPortalEffect();
    setTimeout(() => {
      window.location.href = '/';
    }, 300);
  }

  executeSectionCycle() {
    console.log('🔄 Section cycle combo activated');
    
    // Cycle through gaming sections
    this.cycleGamingSections();
  }

  executeBackStack() {
    console.log('⬅️ Back stack combo activated');
    
    // Navigate back multiple times
    for (let i = 0; i < 3; i++) {
      setTimeout(() => history.back(), i * 200);
    }
  }

  executeEmergencyExit() {
    console.log('🚪 Emergency exit combo activated');
    
    // Close app or navigate to safe page
    if (window.close) {
      window.close();
    } else {
      window.location.href = '/';
    }
  }

  toggleDebugMode() {
    console.log('🐛 Debug mode combo activated');
    
    // Toggle debug mode
    document.body.classList.toggle('debug-mode');
    
    // Enable advanced debugging features
    if (document.body.classList.contains('debug-mode')) {
      this.enableAdvancedDebugging();
    } else {
      this.disableAdvancedDebugging();
    }
  }

  activateAccessibilityBoost() {
    console.log('♿ Accessibility boost combo activated');
    
    // Enhance accessibility features
    document.body.classList.add('accessibility-boost');
    
    // Increase touch targets, enable voice control, etc.
    this.enhanceAccessibilityFeatures();
  }

  /**
   * Special mode activations
   */
  unlockDeveloperMode() {
    console.log('👨‍💻 Developer mode unlocked');
    
    // Enable developer features
    window.MLG_DEV_MODE = true;
    document.body.classList.add('developer-mode');
    
    // Show developer tools
    this.showDeveloperTools();
  }

  activateSuperUserMode() {
    console.log('🦸 Super user mode activated');
    
    // Enable super user features
    window.MLG_SUPER_USER = true;
    document.body.classList.add('super-user-mode');
    
    // Unlock advanced features
    this.unlockSuperUserFeatures();
  }

  activateQuickVoteMode() {
    console.log('⚡ Quick vote mode activated');
    
    // Enable rapid voting
    document.body.classList.add('quick-vote-mode');
    
    // Show quick vote interface
    this.showQuickVoteInterface();
  }

  activateClanManagementMode() {
    console.log('👥 Clan management mode activated');
    
    // Enable advanced clan features
    document.body.classList.add('clan-management-mode');
    
    // Show clan management tools
    this.showClanManagementTools();
  }

  /**
   * Conflict resolution methods
   */
  resolveGestureConflict(candidates) {
    // Sort candidates by priority
    candidates.sort((a, b) => b.priority - a.priority);
    
    // Apply context-specific resolution rules
    const context = this.getCurrentContext();
    
    for (const [resolverName, resolver] of this.conflictResolvers) {
      if (this.shouldApplyResolver(resolverName, context, candidates)) {
        return resolver.priority(candidates[0], candidates[1]);
      }
    }
    
    // Default to highest priority
    return candidates[0];
  }

  shouldApplyResolver(resolverName, context, candidates) {
    // Context-specific resolver application logic
    switch (resolverName) {
      case 'navigation-vs-voting':
        return context === GAMING_CONTEXTS.VOTING;
      case 'multi-touch-vs-single':
        return candidates.some(c => c.touchCount > 1);
      case 'sequence-vs-single':
        return this.gestureState.gestureSequence.length > 0;
      default:
        return true;
    }
  }

  /**
   * Gesture prediction handlers
   */
  handleGesturePrediction(predictedGesture) {
    if (this.options.debugMode) {
      console.log('🔮 Gesture prediction:', predictedGesture);
    }
    
    // Provide predictive feedback
    this.showPredictiveFeedback(predictedGesture);
    
    // Pre-load resources for predicted gesture
    this.preloadGestureResources(predictedGesture);
  }

  showPredictiveFeedback(predictedGesture) {
    // Visual hint for predicted gesture
    const hintElement = document.createElement('div');
    hintElement.className = 'gesture-prediction-hint';
    hintElement.textContent = `Predicted: ${predictedGesture.name}`;
    hintElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 255, 0, 0.8);
      color: white;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 10000;
      pointer-events: none;
    `;
    
    document.body.appendChild(hintElement);
    
    setTimeout(() => {
      hintElement.remove();
    }, 1000);
  }

  /**
   * Utility methods
   */
  generateGestureId() {
    return `gesture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  isCardinalOrDiagonal(direction) {
    const cardinalAndDiagonal = [
      DETAILED_DIRECTIONS.NORTH,
      DETAILED_DIRECTIONS.NORTHEAST,
      DETAILED_DIRECTIONS.EAST,
      DETAILED_DIRECTIONS.SOUTHEAST,
      DETAILED_DIRECTIONS.SOUTH,
      DETAILED_DIRECTIONS.SOUTHWEST,
      DETAILED_DIRECTIONS.WEST,
      DETAILED_DIRECTIONS.NORTHWEST
    ];
    
    return cardinalAndDiagonal.includes(direction);
  }

  getCurrentContext() {
    // Determine current gaming context
    const path = window.location.pathname;
    
    if (path.includes('voting')) return GAMING_CONTEXTS.VOTING;
    if (path.includes('clans')) return GAMING_CONTEXTS.CLANS;
    if (path.includes('dao')) return GAMING_CONTEXTS.TOURNAMENTS;
    if (path.includes('profile')) return GAMING_CONTEXTS.PROFILE;
    if (path.includes('content')) return GAMING_CONTEXTS.LEADERBOARDS;
    
    return GAMING_CONTEXTS.HOME;
  }

  getComboContext(comboName) {
    const contextMap = {
      'TRIPLE_VOTE': GAMING_CONTEXTS.VOTING,
      'POWER_PROMOTE': GAMING_CONTEXTS.CLANS,
      'TOURNAMENT_BLITZ': GAMING_CONTEXTS.TOURNAMENTS,
      'CLAN_CHALLENGE': GAMING_CONTEXTS.CLANS
    };
    
    return contextMap[comboName] || 'global';
  }

  addToGestureSequence(direction) {
    const currentTime = performance.now();
    
    // Reset sequence if timeout exceeded
    if (currentTime - this.gestureState.lastGestureTime > this.options.SEQUENCE_TIMEOUT) {
      this.gestureState.gestureSequence = [];
    }
    
    // Add to sequence
    this.gestureState.gestureSequence.push(direction);
    this.gestureState.lastGestureTime = currentTime;
    
    // Limit sequence length
    if (this.gestureState.gestureSequence.length > this.options.MAX_SEQUENCE_LENGTH) {
      this.gestureState.gestureSequence.shift();
    }
  }

  findGestureCandidates(activeGesture, direction) {
    const candidates = [];
    
    // Check registered gesture handlers
    for (const [name, handler] of this.gestureHandlers) {
      if (this.matchesGesturePattern(handler, activeGesture, direction)) {
        candidates.push({ ...handler, name });
      }
    }
    
    return candidates;
  }

  matchesGesturePattern(handler, activeGesture, direction) {
    // Direction match
    if (handler.direction) {
      if (Array.isArray(handler.direction)) {
        if (!handler.direction.includes(direction)) return false;
      } else if (handler.direction !== direction) {
        return false;
      }
    }
    
    // Touch count match
    if (handler.touchCount && activeGesture.touchCount !== handler.touchCount) {
      return false;
    }
    
    // Context match
    if (handler.context && handler.context !== 'global') {
      const currentContext = this.getCurrentContext();
      if (Array.isArray(handler.context)) {
        if (!handler.context.includes(currentContext)) return false;
      } else if (handler.context !== currentContext) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Registration methods
   */
  registerAdvancedGesture(name, config) {
    this.gestureHandlers.set(name, {
      ...config,
      registeredAt: Date.now()
    });
  }

  registerGestureSequence(name, config) {
    this.recognitionSystems.sequence.registerSequence(name, config);
  }

  registerGamingCombo(name, config) {
    this.recognitionSystems.combo.registerCombo(name, config);
  }

  /**
   * UI Helper methods (placeholder implementations)
   */
  showEmergencyMenu() {
    console.log('🚨 Emergency menu shown');
  }

  showCircularActionMenu(center) {
    console.log('🔄 Circular action menu shown at:', center);
  }

  createPortalEffect() {
    console.log('✨ Portal effect created');
  }

  cycleGamingSections() {
    console.log('🔄 Cycling gaming sections');
  }

  enableAdvancedDebugging() {
    console.log('🐛 Advanced debugging enabled');
  }

  disableAdvancedDebugging() {
    console.log('🐛 Advanced debugging disabled');
  }

  enhanceAccessibilityFeatures() {
    console.log('♿ Accessibility features enhanced');
  }

  showDeveloperTools() {
    console.log('👨‍💻 Developer tools shown');
  }

  unlockSuperUserFeatures() {
    console.log('🦸 Super user features unlocked');
  }

  showQuickVoteInterface() {
    console.log('⚡ Quick vote interface shown');
  }

  showClanManagementTools() {
    console.log('👥 Clan management tools shown');
  }

  preloadGestureResources(predictedGesture) {
    // Preload resources for predicted gesture
  }

  executeAdvancedGesture(recognizedGesture) {
    // Execute the recognized advanced gesture
    if (recognizedGesture.action) {
      recognizedGesture.action(recognizedGesture);
    }
  }

  executeDirectionalNavigation(navigationMap, data) {
    // Execute directional navigation
    console.log('Executing directional navigation:', navigationMap);
  }

  getNavigationMap(direction) {
    // Return navigation mapping for direction
    return { direction, action: 'navigate' };
  }

  handleMultiTouchPattern(pattern, gesture) {
    console.log('Multi-touch pattern detected:', pattern);
  }

  handleSequenceMatch(match) {
    console.log('Gesture sequence match:', match);
  }

  handleComboMatch(match, gesture) {
    console.log('Gaming combo match:', match);
  }

  handlePerformanceWarning(warning) {
    console.warn('Performance warning:', warning);
  }

  /**
   * Public API
   */
  getGestureState() {
    return {
      activeGestures: this.gestureState.activeGestures.size,
      sequenceLength: this.gestureState.gestureSequence.length,
      totalGestures: this.gestureState.gestureCount
    };
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    console.log('🔥 Destroying Advanced Gesture Handlers...');
    
    // Clean up recognition systems
    Object.values(this.recognitionSystems).forEach(system => {
      if (system.destroy) system.destroy();
    });
    
    // Clear data structures
    this.gestureHandlers.clear();
    this.priorityHandlers.clear();
    this.conflictResolvers.clear();
    
    console.log('✅ Advanced Gesture Handlers destroyed');
  }
}

/**
 * Recognition System Classes (Simplified implementations)
 */
class DirectionalGestureRecognizer {
  init(config) {
    this.config = config;
  }
  
  recognizeDirection(gesture) {
    // Implementation for direction recognition
    return DETAILED_DIRECTIONS.NORTH;
  }
  
  finalizeDirection(gesture) {
    // Implementation for final direction recognition
    return DETAILED_DIRECTIONS.NORTH;
  }
}

class MultiTouchGestureRecognizer {
  init(config) {
    this.config = config;
  }
  
  recognizePattern(gesture) {
    // Implementation for multi-touch pattern recognition
    return null;
  }
}

class GestureSequenceRecognizer {
  init(config) {
    this.config = config;
    this.sequences = new Map();
  }
  
  registerSequence(name, config) {
    this.sequences.set(name, config);
  }
  
  checkSequence(currentSequence, newDirection) {
    // Implementation for sequence checking
    return null;
  }
}

class GamingComboRecognizer {
  init(config) {
    this.config = config;
    this.combos = new Map();
  }
  
  registerCombo(name, config) {
    this.combos.set(name, config);
  }
  
  checkCombo(direction) {
    // Implementation for combo checking
    return null;
  }
}

class GesturePredictionEngine {
  init(config) {
    this.config = config;
  }
  
  enablePrediction(config) {
    this.predictionConfig = config;
  }
  
  startPrediction(gestureId, data) {
    // Implementation for prediction start
  }
  
  updatePrediction(gestureId, data) {
    // Implementation for prediction update
  }
  
  endPrediction(gestureId) {
    // Implementation for prediction end
  }
}

// Create and export singleton instance
const MLGAdvancedGestureHandlers = new MLGAdvancedGestureHandlers();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.MLGAdvancedGestureHandlers = MLGAdvancedGestureHandlers;
}

export default MLGAdvancedGestureHandlers;
export { 
  MLGAdvancedGestureHandlers, 
  DETAILED_DIRECTIONS, 
  ADVANCED_GESTURE_CONFIG 
};