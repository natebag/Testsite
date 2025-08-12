/**
 * MLG.clan Advanced Haptic Feedback System
 * 
 * Comprehensive haptic feedback integration for gaming gesture confirmations
 * Xbox 360-inspired tactile feedback patterns with gaming-specific responses
 * 
 * Features:
 * - Gaming-specific haptic patterns (vote confirmations, clan actions, tournaments)
 * - Xbox 360-inspired vibration patterns with variable intensity
 * - Context-aware haptic responses based on gaming scenarios
 * - Advanced haptic sequencing for complex gaming interactions
 * - Adaptive haptic intensity based on device capabilities
 * - Battery-optimized haptic feedback with power management
 * - Accessibility-compliant haptic alternatives
 * - Custom haptic pattern creation and management
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 */

/**
 * Haptic Feedback Configuration
 */
const HAPTIC_CONFIG = {
  // Gaming-specific haptic patterns
  GAMING_PATTERNS: {
    // Voting haptics
    VOTE_UP: [30, 20, 50],
    VOTE_DOWN: [50, 20, 30],
    SUPER_VOTE: [25, 25, 100, 25, 25, 100, 25, 25, 100],
    VOTE_CONFIRM: [40, 30, 40],
    VOTE_COMBO: [20, 10, 20, 10, 20, 10, 80],
    RAPID_VOTE: [15, 5, 15],
    
    // Clan haptics
    CLAN_JOIN: [50, 100, 50, 100, 200],
    CLAN_PROMOTE: [30, 40, 50, 60, 100],
    CLAN_DEMOTE: [100, 50, 25],
    CLAN_KICK: [200, 100, 200],
    CLAN_MESSAGE: [25, 25, 25],
    CLAN_INVITE: [40, 20, 40, 20, 80],
    
    // Tournament haptics
    TOURNAMENT_JOIN: [50, 30, 50, 30, 150],
    TOURNAMENT_WIN: [100, 50, 100, 50, 100, 50, 300],
    TOURNAMENT_LOSE: [300, 100, 100],
    BRACKET_NAV: [20, 10, 20],
    TOURNAMENT_START: [25, 25, 25, 25, 200],
    
    // Navigation haptics
    NAV_TRANSITION: [25],
    NAV_SECTION_CHANGE: [30, 20, 30],
    NAV_BACK: [20, 15],
    NAV_FORWARD: [15, 20],
    NAV_HOME: [40, 20, 40, 20, 60],
    
    // Content haptics
    CONTENT_LIKE: [30, 20, 40],
    CONTENT_SHARE: [25, 25, 50],
    CONTENT_BOOKMARK: [40, 40],
    CLIP_SCRUB: [5],
    CONTENT_NAVIGATE: [20],
    
    // System haptics
    SUCCESS: [50, 25, 50],
    ERROR: [200, 100, 200],
    WARNING: [100, 50, 100],
    NOTIFICATION: [40, 20, 40],
    ACHIEVEMENT: [25, 25, 25, 25, 25, 200],
    
    // Gaming feedback
    COMBO_TRIGGER: [15, 15, 15, 15, 15, 150],
    POWER_UP: [30, 30, 30, 30, 200],
    LEVEL_UP: [50, 50, 50, 50, 50, 300],
    CRITICAL_HIT: [100, 25, 100],
    BONUS_POINTS: [25, 25, 25, 100],
    
    // Xbox 360 inspired patterns
    XBOX_BUTTON_PRESS: [25],
    XBOX_MENU_NAV: [15, 10],
    XBOX_SELECTION: [30, 20],
    XBOX_CONFIRM: [40, 30, 40],
    XBOX_CANCEL: [60, 40],
    XBOX_BLADE_TRANSITION: [20, 15, 20],
    XBOX_ACHIEVEMENT: [50, 25, 50, 25, 150]
  },
  
  // Haptic intensity levels
  INTENSITY_LEVELS: {
    SUBTLE: 0.3,
    LIGHT: 0.5,
    MEDIUM: 0.7,
    STRONG: 0.9,
    MAXIMUM: 1.0
  },
  
  // Context-aware settings
  CONTEXT_SETTINGS: {
    voting: {
      intensity: 0.7,
      enabled: true,
      priority: 'high'
    },
    clans: {
      intensity: 0.6,
      enabled: true,
      priority: 'medium'
    },
    tournaments: {
      intensity: 0.8,
      enabled: true,
      priority: 'high'
    },
    navigation: {
      intensity: 0.4,
      enabled: true,
      priority: 'low'
    },
    content: {
      intensity: 0.5,
      enabled: true,
      priority: 'medium'
    }
  },
  
  // Performance optimization
  PERFORMANCE_SETTINGS: {
    MAX_QUEUE_SIZE: 10,
    PATTERN_CACHE_SIZE: 50,
    BATTERY_SAVE_INTENSITY: 0.3,
    LOW_BATTERY_INTENSITY: 0.1,
    PATTERN_TIMEOUT: 5000,
    DEBOUNCE_INTERVAL: 50
  },
  
  // Device compatibility
  DEVICE_SETTINGS: {
    mobile: {
      intensityMultiplier: 1.0,
      patternSupport: true,
      maxDuration: 5000
    },
    tablet: {
      intensityMultiplier: 0.8,
      patternSupport: true,
      maxDuration: 3000
    },
    desktop: {
      intensityMultiplier: 0.0, // No haptic on desktop
      patternSupport: false,
      maxDuration: 0
    }
  }
};

/**
 * Gaming Haptic Feedback System
 */
export class MLGHapticFeedbackSystem {
  constructor(options = {}) {
    this.options = {
      ...HAPTIC_CONFIG,
      enableHapticFeedback: true,
      enableContextualFeedback: true,
      enableBatteryOptimization: true,
      enableAccessibilityFeatures: true,
      enableCustomPatterns: true,
      debugMode: process.env.NODE_ENV === 'development',
      ...options
    };

    // Haptic system state
    this.hapticState = {
      isSupported: this.checkHapticSupport(),
      isEnabled: true,
      currentIntensity: 0.7,
      currentContext: 'home',
      globalEnabled: true,
      
      // Queue management
      patternQueue: [],
      isPlaying: false,
      currentPattern: null,
      lastFeedbackTime: 0,
      
      // Performance tracking
      patternCount: 0,
      totalDuration: 0,
      averageLatency: 0,
      droppedPatterns: 0
    };

    // Device capabilities
    this.deviceCapabilities = {
      hasVibration: 'vibrate' in navigator,
      deviceType: this.detectDeviceType(),
      maxIntensity: 1.0,
      patternSupport: true,
      batteryLevel: 1.0,
      isCharging: false
    };

    // Context management
    this.contextManager = {
      currentContext: 'home',
      contextHistory: [],
      contextSettings: new Map(),
      adaptiveSettings: true
    };

    // Pattern management
    this.patternManager = {
      customPatterns: new Map(),
      patternCache: new Map(),
      preloadedPatterns: new Set(),
      patternAnalytics: new Map()
    };

    // Accessibility features
    this.accessibilityManager = {
      alternativeFeedback: new Map(),
      reducedMotion: false,
      highContrast: false,
      customIntensity: 1.0,
      userPreferences: this.loadUserPreferences()
    };

    this.init();
  }

  /**
   * Initialize haptic feedback system
   */
  async init() {
    console.log('🎮 Initializing Haptic Feedback System...');

    try {
      // Check device capabilities
      await this.initializeDeviceCapabilities();

      // Setup context-aware feedback
      if (this.options.enableContextualFeedback) {
        this.initializeContextualFeedback();
      }

      // Setup battery optimization
      if (this.options.enableBatteryOptimization) {
        await this.initializeBatteryOptimization();
      }

      // Setup accessibility features
      if (this.options.enableAccessibilityFeatures) {
        this.initializeAccessibilityFeatures();
      }

      // Setup custom patterns
      if (this.options.enableCustomPatterns) {
        this.initializeCustomPatterns();
      }

      // Preload gaming patterns
      this.preloadGamingPatterns();

      // Setup event listeners
      this.setupEventListeners();

      console.log('✅ Haptic Feedback System initialized');

      // Dispatch initialization event
      document.dispatchEvent(new CustomEvent('mlg-haptic-system-ready', {
        detail: {
          supported: this.hapticState.isSupported,
          deviceType: this.deviceCapabilities.deviceType,
          availablePatterns: Object.keys(this.options.GAMING_PATTERNS)
        }
      }));

    } catch (error) {
      console.error('❌ Failed to initialize haptic feedback system:', error);
      throw error;
    }
  }

  /**
   * Initialize device capabilities
   */
  async initializeDeviceCapabilities() {
    // Check vibration API support
    this.deviceCapabilities.hasVibration = 'vibrate' in navigator;
    
    // Detect device type
    this.deviceCapabilities.deviceType = this.detectDeviceType();
    
    // Get device settings
    const deviceSettings = this.options.DEVICE_SETTINGS[this.deviceCapabilities.deviceType];
    if (deviceSettings) {
      this.deviceCapabilities.maxIntensity = deviceSettings.intensityMultiplier;
      this.deviceCapabilities.patternSupport = deviceSettings.patternSupport;
    }

    // Check battery level
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        this.deviceCapabilities.batteryLevel = battery.level;
        this.deviceCapabilities.isCharging = battery.charging;
        
        // Setup battery event listeners
        battery.addEventListener('levelchange', () => {
          this.handleBatteryLevelChange(battery);
        });
        
        battery.addEventListener('chargingchange', () => {
          this.handleChargingChange(battery);
        });
      } catch (error) {
        console.warn('Battery API not available:', error);
      }
    }

    // Test haptic capability
    if (this.deviceCapabilities.hasVibration) {
      this.testHapticCapability();
    }

    console.log('📱 Device capabilities initialized:', this.deviceCapabilities);
  }

  /**
   * Initialize contextual feedback
   */
  initializeContextualFeedback() {
    // Setup context detection
    this.detectCurrentContext();
    
    // Setup context-specific settings
    Object.entries(this.options.CONTEXT_SETTINGS).forEach(([context, settings]) => {
      this.contextManager.contextSettings.set(context, settings);
    });

    // Listen for context changes
    document.addEventListener('mlg-context-change', (e) => {
      this.handleContextChange(e.detail.context);
    });

    console.log('🎯 Contextual feedback initialized');
  }

  /**
   * Initialize battery optimization
   */
  async initializeBatteryOptimization() {
    // Apply initial battery optimizations
    this.applyBatteryOptimizations();
    
    // Setup power mode monitoring
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });

    console.log('🔋 Battery optimization initialized');
  }

  /**
   * Initialize accessibility features
   */
  initializeAccessibilityFeatures() {
    // Check for reduced motion preference
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.accessibilityManager.reducedMotion = true;
      this.adjustForReducedMotion();
    }

    // Check for high contrast mode
    if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
      this.accessibilityManager.highContrast = true;
    }

    // Setup alternative feedback for users who can't feel haptics
    this.setupAlternativeFeedback();

    // Apply user preferences
    this.applyUserPreferences();

    console.log('♿ Accessibility features initialized');
  }

  /**
   * Initialize custom patterns
   */
  initializeCustomPatterns() {
    // Load saved custom patterns
    this.loadCustomPatterns();
    
    // Setup pattern creation API
    this.setupPatternCreationAPI();

    console.log('🎨 Custom patterns initialized');
  }

  /**
   * Preload gaming patterns for better performance
   */
  preloadGamingPatterns() {
    const highPriorityPatterns = [
      'VOTE_UP', 'VOTE_DOWN', 'VOTE_CONFIRM',
      'NAV_TRANSITION', 'SUCCESS', 'ERROR',
      'XBOX_BUTTON_PRESS', 'XBOX_CONFIRM'
    ];

    highPriorityPatterns.forEach(patternName => {
      const pattern = this.options.GAMING_PATTERNS[patternName];
      if (pattern) {
        this.patternManager.preloadedPatterns.add(patternName);
        this.patternManager.patternCache.set(patternName, this.optimizePattern(pattern));
      }
    });

    console.log('⚡ Gaming patterns preloaded');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for gaming gesture events
    document.addEventListener('mlg-gesture-executed', (e) => {
      this.handleGestureHaptic(e.detail);
    });

    // Listen for gaming action events
    document.addEventListener('mlg-vote-cast', (e) => {
      this.handleVoteHaptic(e.detail);
    });

    document.addEventListener('mlg-clan-action', (e) => {
      this.handleClanHaptic(e.detail);
    });

    document.addEventListener('mlg-tournament-action', (e) => {
      this.handleTournamentHaptic(e.detail);
    });

    // Listen for system events
    document.addEventListener('mlg-achievement-unlocked', (e) => {
      this.playGamingPattern('ACHIEVEMENT');
    });

    document.addEventListener('mlg-level-up', (e) => {
      this.playGamingPattern('LEVEL_UP');
    });
  }

  /**
   * Main haptic feedback methods
   */
  playGamingPattern(patternName, options = {}) {
    if (!this.canPlayHaptic()) {
      return false;
    }

    const pattern = this.getPattern(patternName);
    if (!pattern) {
      console.warn(`Haptic pattern not found: ${patternName}`);
      return false;
    }

    // Apply context and options
    const contextualPattern = this.applyContextualSettings(pattern, options);
    
    // Queue or play immediately
    if (this.hapticState.isPlaying && options.priority !== 'high') {
      return this.queuePattern(contextualPattern, options);
    } else {
      return this.playPattern(contextualPattern, options);
    }
  }

  playPattern(pattern, options = {}) {
    if (!this.deviceCapabilities.hasVibration) {
      this.playAlternativeFeedback(pattern, options);
      return false;
    }

    const startTime = performance.now();
    
    try {
      // Apply intensity adjustments
      const adjustedPattern = this.applyIntensityAdjustments(pattern, options);
      
      // Play haptic pattern
      navigator.vibrate(adjustedPattern);
      
      // Update state
      this.hapticState.isPlaying = true;
      this.hapticState.currentPattern = pattern;
      this.hapticState.patternCount++;
      
      // Calculate pattern duration
      const patternDuration = this.calculatePatternDuration(adjustedPattern);
      this.hapticState.totalDuration += patternDuration;
      
      // Clear playing state after pattern completes
      setTimeout(() => {
        this.hapticState.isPlaying = false;
        this.hapticState.currentPattern = null;
        this.processPatternQueue();
      }, patternDuration);
      
      // Track performance
      const latency = performance.now() - startTime;
      this.updatePerformanceMetrics(latency);
      
      if (this.options.debugMode) {
        console.log(`🎮 Haptic pattern played: ${JSON.stringify(adjustedPattern)}`);
      }
      
      return true;
    } catch (error) {
      console.warn('Haptic playback failed:', error);
      this.hapticState.droppedPatterns++;
      return false;
    }
  }

  queuePattern(pattern, options = {}) {
    if (this.hapticState.patternQueue.length >= this.options.PERFORMANCE_SETTINGS.MAX_QUEUE_SIZE) {
      // Remove oldest pattern if queue is full
      this.hapticState.patternQueue.shift();
      this.hapticState.droppedPatterns++;
    }

    this.hapticState.patternQueue.push({
      pattern,
      options,
      timestamp: Date.now(),
      priority: options.priority || 'normal'
    });

    return true;
  }

  processPatternQueue() {
    if (this.hapticState.patternQueue.length === 0 || this.hapticState.isPlaying) {
      return;
    }

    // Sort queue by priority
    this.hapticState.patternQueue.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
    });

    // Play next pattern
    const nextItem = this.hapticState.patternQueue.shift();
    if (nextItem) {
      this.playPattern(nextItem.pattern, nextItem.options);
    }
  }

  /**
   * Gaming-specific haptic handlers
   */
  handleGestureHaptic(gestureDetail) {
    const { gestureType, context, success } = gestureDetail;
    
    let patternName;
    
    if (success) {
      switch (gestureType) {
        case 'swipe':
          patternName = context === 'voting' ? 'VOTE_CONFIRM' : 'NAV_TRANSITION';
          break;
        case 'long-press':
          patternName = 'XBOX_SELECTION';
          break;
        case 'pinch':
          patternName = 'XBOX_BUTTON_PRESS';
          break;
        default:
          patternName = 'XBOX_BUTTON_PRESS';
      }
    } else {
      patternName = 'ERROR';
    }
    
    this.playGamingPattern(patternName, { context });
  }

  handleVoteHaptic(voteDetail) {
    const { direction, isSuper, isQuick, isCombo } = voteDetail;
    
    let patternName;
    
    if (isSuper) {
      patternName = 'SUPER_VOTE';
    } else if (isCombo) {
      patternName = 'VOTE_COMBO';
    } else if (isQuick) {
      patternName = 'RAPID_VOTE';
    } else {
      patternName = direction === 'up' ? 'VOTE_UP' : 'VOTE_DOWN';
    }
    
    this.playGamingPattern(patternName, { 
      context: 'voting',
      priority: isSuper ? 'high' : 'normal'
    });
  }

  handleClanHaptic(clanDetail) {
    const { action, memberId, success } = clanDetail;
    
    if (!success) {
      this.playGamingPattern('ERROR', { context: 'clans' });
      return;
    }
    
    const actionPatternMap = {
      'join': 'CLAN_JOIN',
      'promote': 'CLAN_PROMOTE',
      'demote': 'CLAN_DEMOTE',
      'kick': 'CLAN_KICK',
      'message': 'CLAN_MESSAGE',
      'invite': 'CLAN_INVITE'
    };
    
    const patternName = actionPatternMap[action] || 'SUCCESS';
    this.playGamingPattern(patternName, { context: 'clans' });
  }

  handleTournamentHaptic(tournamentDetail) {
    const { action, result, tournamentId } = tournamentDetail;
    
    const actionPatternMap = {
      'join': 'TOURNAMENT_JOIN',
      'win': 'TOURNAMENT_WIN',
      'lose': 'TOURNAMENT_LOSE',
      'navigate': 'BRACKET_NAV',
      'start': 'TOURNAMENT_START'
    };
    
    const patternName = actionPatternMap[action] || 'SUCCESS';
    this.playGamingPattern(patternName, { 
      context: 'tournaments',
      priority: result === 'win' ? 'high' : 'normal'
    });
  }

  /**
   * Pattern processing methods
   */
  getPattern(patternName) {
    // Check cache first
    if (this.patternManager.patternCache.has(patternName)) {
      return this.patternManager.patternCache.get(patternName);
    }
    
    // Check built-in patterns
    const pattern = this.options.GAMING_PATTERNS[patternName];
    if (pattern) {
      const optimized = this.optimizePattern(pattern);
      this.patternManager.patternCache.set(patternName, optimized);
      return optimized;
    }
    
    // Check custom patterns
    return this.patternManager.customPatterns.get(patternName);
  }

  optimizePattern(pattern) {
    if (!Array.isArray(pattern)) {
      return [pattern];
    }
    
    // Remove very short vibrations that might not be felt
    return pattern.filter(duration => duration >= 5);
  }

  applyContextualSettings(pattern, options = {}) {
    const context = options.context || this.contextManager.currentContext;
    const contextSettings = this.contextManager.contextSettings.get(context);
    
    if (!contextSettings || !contextSettings.enabled) {
      return pattern;
    }
    
    // Apply context intensity
    return this.adjustPatternIntensity(pattern, contextSettings.intensity);
  }

  applyIntensityAdjustments(pattern, options = {}) {
    let intensity = options.intensity || this.hapticState.currentIntensity;
    
    // Apply device-specific adjustments
    intensity *= this.deviceCapabilities.maxIntensity;
    
    // Apply accessibility adjustments
    intensity *= this.accessibilityManager.customIntensity;
    
    // Apply battery optimizations
    if (this.deviceCapabilities.batteryLevel < 0.2) {
      intensity *= this.options.PERFORMANCE_SETTINGS.LOW_BATTERY_INTENSITY;
    } else if (this.deviceCapabilities.batteryLevel < 0.5) {
      intensity *= this.options.PERFORMANCE_SETTINGS.BATTERY_SAVE_INTENSITY;
    }
    
    return this.adjustPatternIntensity(pattern, intensity);
  }

  adjustPatternIntensity(pattern, intensity) {
    if (!Array.isArray(pattern)) {
      return Math.round(pattern * intensity);
    }
    
    return pattern.map(duration => Math.round(duration * intensity));
  }

  calculatePatternDuration(pattern) {
    if (!Array.isArray(pattern)) {
      return pattern;
    }
    
    return pattern.reduce((total, duration) => total + duration, 0);
  }

  /**
   * Device and context management
   */
  detectDeviceType() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/tablet|ipad/.test(userAgent)) {
      return 'tablet';
    } else if (/mobile|android|iphone/.test(userAgent)) {
      return 'mobile';
    } else {
      return 'desktop';
    }
  }

  detectCurrentContext() {
    const path = window.location.pathname;
    
    if (path.includes('voting')) {
      this.contextManager.currentContext = 'voting';
    } else if (path.includes('clans')) {
      this.contextManager.currentContext = 'clans';
    } else if (path.includes('dao') || path.includes('tournament')) {
      this.contextManager.currentContext = 'tournaments';
    } else if (path.includes('content')) {
      this.contextManager.currentContext = 'content';
    } else {
      this.contextManager.currentContext = 'navigation';
    }
  }

  handleContextChange(newContext) {
    this.contextManager.contextHistory.push({
      previous: this.contextManager.currentContext,
      new: newContext,
      timestamp: Date.now()
    });
    
    this.contextManager.currentContext = newContext;
    
    // Apply context-specific settings
    this.applyContextSettings(newContext);
  }

  applyContextSettings(context) {
    const settings = this.contextManager.contextSettings.get(context);
    if (settings) {
      this.hapticState.currentIntensity = settings.intensity;
    }
  }

  /**
   * Battery and performance optimization
   */
  handleBatteryLevelChange(battery) {
    this.deviceCapabilities.batteryLevel = battery.level;
    this.applyBatteryOptimizations();
  }

  handleChargingChange(battery) {
    this.deviceCapabilities.isCharging = battery.charging;
    
    if (battery.charging) {
      // Restore normal haptic intensity when charging
      this.restoreNormalIntensity();
    } else {
      this.applyBatteryOptimizations();
    }
  }

  applyBatteryOptimizations() {
    const batteryPercent = this.deviceCapabilities.batteryLevel * 100;
    
    if (batteryPercent < 10) {
      // Severe battery saving
      this.hapticState.globalEnabled = false;
    } else if (batteryPercent < 20) {
      // Aggressive battery saving
      this.hapticState.globalEnabled = true;
      this.hapticState.currentIntensity = this.options.PERFORMANCE_SETTINGS.LOW_BATTERY_INTENSITY;
    } else if (batteryPercent < 50) {
      // Moderate battery saving
      this.hapticState.currentIntensity = this.options.PERFORMANCE_SETTINGS.BATTERY_SAVE_INTENSITY;
    }
  }

  restoreNormalIntensity() {
    this.hapticState.globalEnabled = true;
    this.hapticState.currentIntensity = 0.7; // Default intensity
  }

  handleVisibilityChange() {
    if (document.hidden) {
      // Disable haptics when page is not visible
      this.hapticState.globalEnabled = false;
    } else {
      // Re-enable haptics when page becomes visible
      this.hapticState.globalEnabled = true;
    }
  }

  /**
   * Accessibility methods
   */
  adjustForReducedMotion() {
    // Reduce haptic intensity for users with motion sensitivity
    this.accessibilityManager.customIntensity = 0.3;
    
    // Use simpler patterns
    Object.keys(this.options.GAMING_PATTERNS).forEach(patternName => {
      const pattern = this.options.GAMING_PATTERNS[patternName];
      if (Array.isArray(pattern) && pattern.length > 3) {
        // Simplify complex patterns
        this.options.GAMING_PATTERNS[patternName] = [pattern[0]];
      }
    });
  }

  setupAlternativeFeedback() {
    // Visual feedback for users who can't feel haptics
    this.accessibilityManager.alternativeFeedback.set('visual', (pattern, options) => {
      this.showVisualFeedback(pattern, options);
    });
    
    // Audio feedback
    this.accessibilityManager.alternativeFeedback.set('audio', (pattern, options) => {
      this.playAudioFeedback(pattern, options);
    });
  }

  playAlternativeFeedback(pattern, options = {}) {
    // Play visual feedback if haptics not available
    this.showVisualFeedback(pattern, options);
    
    // Announce to screen readers
    if (options.context) {
      const message = this.getAccessibilityMessage(options.context);
      this.announceToScreenReader(message);
    }
  }

  showVisualFeedback(pattern, options = {}) {
    const feedback = document.createElement('div');
    feedback.className = 'haptic-visual-feedback';
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: rgba(0, 255, 0, 0.8);
      border-radius: 50%;
      z-index: 10000;
      pointer-events: none;
      animation: hapticPulse 0.3s ease-out;
    `;
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
      feedback.remove();
    }, 300);
  }

  playAudioFeedback(pattern, options = {}) {
    // Create subtle audio feedback for haptic patterns
    if (window.AudioContext || window.webkitAudioContext) {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
      } catch (error) {
        console.warn('Audio feedback failed:', error);
      }
    }
  }

  announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      announcement.remove();
    }, 1000);
  }

  getAccessibilityMessage(context) {
    const messages = {
      'voting': 'Vote registered',
      'clans': 'Clan action completed',
      'tournaments': 'Tournament action completed',
      'navigation': 'Navigation updated',
      'content': 'Content action completed'
    };
    
    return messages[context] || 'Action completed';
  }

  /**
   * Utility methods
   */
  checkHapticSupport() {
    return 'vibrate' in navigator && this.deviceCapabilities.deviceType !== 'desktop';
  }

  canPlayHaptic() {
    return this.hapticState.isSupported && 
           this.hapticState.isEnabled && 
           this.hapticState.globalEnabled &&
           this.options.enableHapticFeedback;
  }

  testHapticCapability() {
    try {
      navigator.vibrate(50);
      return true;
    } catch (error) {
      console.warn('Haptic test failed:', error);
      return false;
    }
  }

  updatePerformanceMetrics(latency) {
    // Update average latency
    this.hapticState.averageLatency = 
      (this.hapticState.averageLatency * 0.9) + (latency * 0.1);
  }

  loadUserPreferences() {
    try {
      const prefs = localStorage.getItem('mlg-haptic-preferences');
      return prefs ? JSON.parse(prefs) : {};
    } catch {
      return {};
    }
  }

  applyUserPreferences() {
    const prefs = this.accessibilityManager.userPreferences;
    
    if (prefs.intensity !== undefined) {
      this.accessibilityManager.customIntensity = prefs.intensity;
    }
    
    if (prefs.enabled !== undefined) {
      this.hapticState.isEnabled = prefs.enabled;
    }
  }

  saveUserPreferences() {
    const prefs = {
      intensity: this.accessibilityManager.customIntensity,
      enabled: this.hapticState.isEnabled,
      contextSettings: Object.fromEntries(this.contextManager.contextSettings)
    };
    
    try {
      localStorage.setItem('mlg-haptic-preferences', JSON.stringify(prefs));
    } catch (error) {
      console.warn('Failed to save haptic preferences:', error);
    }
  }

  /**
   * Custom pattern methods (placeholder implementations)
   */
  loadCustomPatterns() {
    // Load custom patterns from storage
  }

  setupPatternCreationAPI() {
    // Setup API for creating custom patterns
  }

  /**
   * Public API
   */
  setGlobalIntensity(intensity) {
    this.hapticState.currentIntensity = Math.max(0, Math.min(1, intensity));
    this.saveUserPreferences();
  }

  setContextEnabled(context, enabled) {
    const settings = this.contextManager.contextSettings.get(context);
    if (settings) {
      settings.enabled = enabled;
    }
    this.saveUserPreferences();
  }

  getHapticState() {
    return {
      supported: this.hapticState.isSupported,
      enabled: this.hapticState.isEnabled,
      intensity: this.hapticState.currentIntensity,
      context: this.contextManager.currentContext,
      queueSize: this.hapticState.patternQueue.length,
      patternCount: this.hapticState.patternCount
    };
  }

  getPerformanceMetrics() {
    return {
      patternCount: this.hapticState.patternCount,
      averageLatency: this.hapticState.averageLatency,
      droppedPatterns: this.hapticState.droppedPatterns,
      totalDuration: this.hapticState.totalDuration
    };
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    console.log('🔥 Destroying Haptic Feedback System...');
    
    // Stop any playing patterns
    if (navigator.vibrate) {
      navigator.vibrate(0);
    }
    
    // Clear queues
    this.hapticState.patternQueue = [];
    
    // Clear caches
    this.patternManager.patternCache.clear();
    this.patternManager.customPatterns.clear();
    
    // Save preferences
    this.saveUserPreferences();
    
    console.log('✅ Haptic Feedback System destroyed');
  }
}

// Create and export singleton instance
const MLGHapticFeedback = new MLGHapticFeedbackSystem();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.MLGHapticFeedback = MLGHapticFeedback;
}

export default MLGHapticFeedback;
export { MLGHapticFeedbackSystem, HAPTIC_CONFIG };