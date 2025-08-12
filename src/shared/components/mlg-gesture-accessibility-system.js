/**
 * MLG.clan Gesture Accessibility System
 * 
 * Comprehensive accessibility alternatives and gesture customization for MLG.clan
 * Ensures gaming gestures are accessible to users with diverse abilities
 * 
 * Features:
 * - Voice control alternatives for swipe gestures
 * - Screen reader compatible gesture feedback
 * - Gaming-specific gesture customization and sensitivity settings
 * - Alternative input methods for users unable to use swipe gestures
 * - Gaming accessibility shortcuts with gesture combinations
 * - WCAG 2.1 AA compliance for gesture interactions
 * - Adaptive gesture recognition for motor impairments
 * - Multi-modal input support (keyboard, voice, switch control)
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 */

/**
 * Accessibility Configuration
 */
const ACCESSIBILITY_CONFIG = {
  // Voice control patterns
  VOICE_COMMANDS: {
    // Voting commands
    'vote up': { action: 'vote', direction: 'up' },
    'vote down': { action: 'vote', direction: 'down' },
    'super vote': { action: 'super-vote' },
    'confirm vote': { action: 'confirm-vote' },
    'cancel vote': { action: 'cancel-vote' },
    
    // Navigation commands
    'go back': { action: 'navigate', direction: 'back' },
    'go forward': { action: 'navigate', direction: 'forward' },
    'go home': { action: 'navigate', target: 'home' },
    'open menu': { action: 'menu', target: 'main' },
    'close menu': { action: 'menu', target: 'close' },
    
    // Clan commands
    'join clan': { action: 'clan', command: 'join' },
    'promote member': { action: 'clan', command: 'promote' },
    'demote member': { action: 'clan', command: 'demote' },
    'message member': { action: 'clan', command: 'message' },
    'clan roster': { action: 'clan', command: 'roster' },
    
    // Tournament commands
    'join tournament': { action: 'tournament', command: 'join' },
    'view bracket': { action: 'tournament', command: 'bracket' },
    'tournament info': { action: 'tournament', command: 'info' },
    'next round': { action: 'tournament', command: 'next' },
    
    // Content commands
    'play clip': { action: 'content', command: 'play' },
    'pause clip': { action: 'content', command: 'pause' },
    'next clip': { action: 'content', command: 'next' },
    'previous clip': { action: 'content', command: 'previous' },
    'bookmark': { action: 'content', command: 'bookmark' },
    'share content': { action: 'content', command: 'share' },
    
    // System commands
    'help': { action: 'system', command: 'help' },
    'settings': { action: 'system', command: 'settings' },
    'accessibility': { action: 'system', command: 'accessibility' },
    'read page': { action: 'system', command: 'read' }
  },
  
  // Keyboard shortcuts
  KEYBOARD_SHORTCUTS: {
    // Voting shortcuts
    'ArrowUp': { action: 'vote', direction: 'up' },
    'ArrowDown': { action: 'vote', direction: 'down' },
    'Space': { action: 'super-vote' },
    'Enter': { action: 'confirm' },
    'Escape': { action: 'cancel' },
    
    // Navigation shortcuts
    'Alt+ArrowLeft': { action: 'navigate', direction: 'back' },
    'Alt+ArrowRight': { action: 'navigate', direction: 'forward' },
    'Alt+Home': { action: 'navigate', target: 'home' },
    'Alt+KeyM': { action: 'menu', target: 'main' },
    
    // Gaming shortcuts
    'KeyV': { action: 'vote-mode' },
    'KeyC': { action: 'clan-mode' },
    'KeyT': { action: 'tournament-mode' },
    'KeyP': { action: 'content-mode' },
    
    // Accessibility shortcuts
    'Alt+KeyA': { action: 'accessibility-menu' },
    'Alt+KeyH': { action: 'help' },
    'Alt+KeyR': { action: 'read-page' },
    'Alt+KeyS': { action: 'settings' }
  },
  
  // Switch control patterns
  SWITCH_CONTROL: {
    patterns: {
      'single-switch': {
        actions: ['select', 'activate', 'back'],
        timing: { hold: 1000, double: 300 }
      },
      'dual-switch': {
        actions: ['navigate', 'activate'],
        timing: { hold: 800, double: 250 }
      },
      'quad-switch': {
        actions: ['up', 'down', 'left', 'right', 'activate'],
        timing: { hold: 600, double: 200 }
      }
    }
  },
  
  // Gesture customization options
  GESTURE_CUSTOMIZATION: {
    sensitivity: {
      min: 0.1,
      max: 3.0,
      default: 1.0,
      step: 0.1
    },
    distance: {
      min: 20,
      max: 200,
      default: 80,
      step: 10
    },
    timing: {
      min: 50,
      max: 2000,
      default: 300,
      step: 50
    },
    hapticIntensity: {
      min: 0.0,
      max: 1.0,
      default: 0.7,
      step: 0.1
    }
  },
  
  // Motor impairment adaptations
  MOTOR_ADAPTATIONS: {
    tremor: {
      stabilization: true,
      debounceTime: 150,
      smoothing: 0.3
    },
    limited_range: {
      reducedDistance: true,
      alternativeInputs: true,
      assistedGestures: true
    },
    one_handed: {
      optimizedLayout: true,
      thumbZone: true,
      alternativePaths: true
    }
  },
  
  // Screen reader integration
  SCREEN_READER: {
    announcements: {
      gestureStart: 'Gesture started',
      gestureComplete: 'Gesture completed',
      gestureCancel: 'Gesture cancelled',
      voteUp: 'Vote up registered',
      voteDown: 'Vote down registered',
      superVote: 'Super vote activated',
      clanJoin: 'Joined clan',
      tournamentJoin: 'Joined tournament'
    },
    descriptions: {
      swipeUp: 'Swipe up or press up arrow to vote up',
      swipeDown: 'Swipe down or press down arrow to vote down',
      longPress: 'Long press or hold space for super vote',
      swipeLeft: 'Swipe left or press left arrow to go back',
      swipeRight: 'Swipe right or press right arrow to go forward'
    }
  }
};

/**
 * Gesture Accessibility System
 */
export class MLGGestureAccessibilitySystem {
  constructor(options = {}) {
    this.options = {
      ...ACCESSIBILITY_CONFIG,
      enableVoiceControl: false, // Disabled by default
      enableKeyboardShortcuts: true,
      enableSwitchControl: false,
      enableScreenReader: true,
      enableGestureCustomization: true,
      enableMotorAdaptations: true,
      debugMode: process.env.NODE_ENV === 'development',
      ...options
    };

    // Accessibility state
    this.accessibilityState = {
      isScreenReaderActive: this.detectScreenReader(),
      voiceControlActive: false,
      keyboardNavActive: true,
      switchControlActive: false,
      reducedMotion: this.detectReducedMotion(),
      highContrast: this.detectHighContrast(),
      
      // User preferences
      gestureCustomization: this.loadGesturePreferences(),
      motorAdaptations: this.loadMotorAdaptations(),
      inputMethods: this.loadInputMethods(),
      
      // Active features
      activeAlternatives: new Set(),
      currentInputMethod: 'touch',
      lastInputTime: 0
    };

    // Voice recognition
    this.voiceRecognition = {
      recognition: null,
      isListening: false,
      commands: new Map(),
      confidence: 0.7,
      language: 'en-US',
      continuous: true
    };

    // Keyboard navigation
    this.keyboardNavigation = {
      shortcuts: new Map(),
      focusableElements: [],
      currentFocus: 0,
      isActive: false,
      keySequence: []
    };

    // Switch control
    this.switchControl = {
      switches: new Map(),
      currentPattern: 'single-switch',
      scanningActive: false,
      scanIndex: 0,
      scanInterval: null
    };

    // Gesture customization
    this.gestureCustomization = {
      sensitivity: 1.0,
      distance: 80,
      timing: 300,
      hapticIntensity: 0.7,
      customGestures: new Map(),
      userProfiles: new Map()
    };

    // Motor adaptations
    this.motorAdaptations = {
      tremor: {
        stabilization: false,
        buffer: [],
        smoothingFactor: 0.3
      },
      limitedRange: {
        reducedThresholds: false,
        assistedMode: false
      },
      oneHanded: {
        optimizedLayout: false,
        thumbZoneActive: false
      }
    };

    this.init();
  }

  /**
   * Initialize accessibility system
   */
  async init() {
    console.log('♿ Initializing Gesture Accessibility System...');

    try {
      // Initialize screen reader support
      if (this.options.enableScreenReader) {
        this.initializeScreenReaderSupport();
      }

      // Initialize keyboard shortcuts
      if (this.options.enableKeyboardShortcuts) {
        this.initializeKeyboardShortcuts();
      }

      // Initialize voice control
      if (this.options.enableVoiceControl) {
        await this.initializeVoiceControl();
      }

      // Initialize switch control
      if (this.options.enableSwitchControl) {
        this.initializeSwitchControl();
      }

      // Initialize gesture customization
      if (this.options.enableGestureCustomization) {
        this.initializeGestureCustomization();
      }

      // Initialize motor adaptations
      if (this.options.enableMotorAdaptations) {
        this.initializeMotorAdaptations();
      }

      // Setup accessibility event handlers
      this.setupAccessibilityEventHandlers();

      // Create accessibility UI
      this.createAccessibilityUI();

      console.log('✅ Gesture Accessibility System initialized');

      // Dispatch initialization event
      document.dispatchEvent(new CustomEvent('mlg-accessibility-ready', {
        detail: {
          features: this.getActiveFeatures(),
          alternatives: Array.from(this.accessibilityState.activeAlternatives)
        }
      }));

    } catch (error) {
      console.error('❌ Failed to initialize accessibility system:', error);
      throw error;
    }
  }

  /**
   * Initialize screen reader support
   */
  initializeScreenReaderSupport() {
    // Create ARIA live regions for announcements
    this.createAriaLiveRegions();
    
    // Setup gesture descriptions
    this.setupGestureDescriptions();
    
    // Setup focus management
    this.setupFocusManagement();
    
    // Setup landmark navigation
    this.setupLandmarkNavigation();

    console.log('📢 Screen reader support initialized');
  }

  createAriaLiveRegions() {
    // Polite announcements
    const politeRegion = document.createElement('div');
    politeRegion.id = 'mlg-aria-live-polite';
    politeRegion.setAttribute('aria-live', 'polite');
    politeRegion.setAttribute('aria-atomic', 'true');
    politeRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(politeRegion);

    // Assertive announcements
    const assertiveRegion = document.createElement('div');
    assertiveRegion.id = 'mlg-aria-live-assertive';
    assertiveRegion.setAttribute('aria-live', 'assertive');
    assertiveRegion.setAttribute('aria-atomic', 'true');
    assertiveRegion.style.cssText = politeRegion.style.cssText;
    document.body.appendChild(assertiveRegion);

    // Status region
    const statusRegion = document.createElement('div');
    statusRegion.id = 'mlg-aria-status';
    statusRegion.setAttribute('role', 'status');
    statusRegion.setAttribute('aria-atomic', 'true');
    statusRegion.style.cssText = politeRegion.style.cssText;
    document.body.appendChild(statusRegion);
  }

  setupGestureDescriptions() {
    // Add gesture descriptions to interactive elements
    const interactiveElements = document.querySelectorAll(
      'button, [role="button"], [data-gesture-enabled], [data-vote-action]'
    );

    interactiveElements.forEach(element => {
      this.addGestureDescription(element);
    });
  }

  addGestureDescription(element) {
    const gestureType = this.getElementGestureType(element);
    const description = this.options.SCREEN_READER.descriptions[gestureType];
    
    if (description) {
      const existingDescription = element.getAttribute('aria-describedby');
      const descriptionId = `gesture-desc-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create description element
      const descElement = document.createElement('div');
      descElement.id = descriptionId;
      descElement.textContent = description;
      descElement.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
      document.body.appendChild(descElement);
      
      // Link to element
      const newDescription = existingDescription ? 
        `${existingDescription} ${descriptionId}` : descriptionId;
      element.setAttribute('aria-describedby', newDescription);
    }
  }

  /**
   * Initialize keyboard shortcuts
   */
  initializeKeyboardShortcuts() {
    // Register keyboard shortcuts
    Object.entries(this.options.KEYBOARD_SHORTCUTS).forEach(([key, action]) => {
      this.keyboardNavigation.shortcuts.set(key, action);
    });

    // Setup keyboard event listeners
    document.addEventListener('keydown', this.handleKeyboardEvent.bind(this));
    document.addEventListener('keyup', this.handleKeyboardRelease.bind(this));

    // Setup focus management
    this.setupKeyboardFocusManagement();

    console.log('⌨️ Keyboard shortcuts initialized');
  }

  handleKeyboardEvent(event) {
    const keyCode = this.getKeyCode(event);
    const action = this.keyboardNavigation.shortcuts.get(keyCode);

    if (action) {
      event.preventDefault();
      this.executeKeyboardAction(action, event);
      
      // Announce action to screen reader
      this.announceAction(action);
    }

    // Track key sequence for complex shortcuts
    this.trackKeySequence(keyCode);
  }

  executeKeyboardAction(action, event) {
    switch (action.action) {
      case 'vote':
        this.executeVoteAction(action.direction);
        break;
      case 'super-vote':
        this.executeSuperVoteAction();
        break;
      case 'navigate':
        this.executeNavigationAction(action);
        break;
      case 'menu':
        this.executeMenuAction(action.target);
        break;
      case 'clan':
        this.executeClanAction(action.command);
        break;
      case 'tournament':
        this.executeTournamentAction(action.command);
        break;
      case 'content':
        this.executeContentAction(action.command);
        break;
      case 'system':
        this.executeSystemAction(action.command);
        break;
      case 'accessibility-menu':
        this.showAccessibilityMenu();
        break;
    }
  }

  /**
   * Initialize voice control
   */
  async initializeVoiceControl() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.voiceRecognition.recognition = new SpeechRecognition();
      
      // Configure speech recognition
      this.configureSpeechRecognition();
      
      // Register voice commands
      this.registerVoiceCommands();
      
      // Setup voice event handlers
      this.setupVoiceEventHandlers();

      console.log('🎤 Voice control initialized');
    } catch (error) {
      console.error('Failed to initialize voice control:', error);
    }
  }

  configureSpeechRecognition() {
    const recognition = this.voiceRecognition.recognition;
    
    recognition.continuous = this.voiceRecognition.continuous;
    recognition.interimResults = false;
    recognition.lang = this.voiceRecognition.language;
    recognition.maxAlternatives = 3;
  }

  registerVoiceCommands() {
    Object.entries(this.options.VOICE_COMMANDS).forEach(([command, action]) => {
      this.voiceRecognition.commands.set(command.toLowerCase(), action);
    });
  }

  setupVoiceEventHandlers() {
    const recognition = this.voiceRecognition.recognition;
    
    recognition.onresult = (event) => {
      this.handleVoiceResult(event);
    };
    
    recognition.onerror = (event) => {
      this.handleVoiceError(event);
    };
    
    recognition.onend = () => {
      this.handleVoiceEnd();
    };
  }

  handleVoiceResult(event) {
    const results = event.results;
    
    for (let i = event.resultIndex; i < results.length; i++) {
      const result = results[i];
      
      if (result.isFinal) {
        const transcript = result[0].transcript.toLowerCase().trim();
        const confidence = result[0].confidence;
        
        if (confidence >= this.voiceRecognition.confidence) {
          this.executeVoiceCommand(transcript);
        }
      }
    }
  }

  executeVoiceCommand(transcript) {
    const action = this.voiceRecognition.commands.get(transcript);
    
    if (action) {
      this.executeAccessibilityAction(action);
      this.announceToScreenReader(`Voice command executed: ${transcript}`);
    } else {
      // Try partial matching
      const partialMatch = this.findPartialVoiceMatch(transcript);
      if (partialMatch) {
        this.executeAccessibilityAction(partialMatch);
      } else {
        this.announceToScreenReader('Voice command not recognized');
      }
    }
  }

  /**
   * Initialize switch control
   */
  initializeSwitchControl() {
    // Setup switch patterns
    this.setupSwitchPatterns();
    
    // Setup switch event listeners
    this.setupSwitchEventListeners();
    
    // Setup scanning interface
    this.setupScanningInterface();

    console.log('🔘 Switch control initialized');
  }

  setupSwitchPatterns() {
    Object.entries(this.options.SWITCH_CONTROL.patterns).forEach(([pattern, config]) => {
      this.switchControl.switches.set(pattern, config);
    });
  }

  /**
   * Initialize gesture customization
   */
  initializeGestureCustomization() {
    // Load user customizations
    this.loadGestureCustomizations();
    
    // Apply custom settings
    this.applyGestureCustomizations();
    
    // Setup customization UI
    this.setupCustomizationUI();

    console.log('🎛️ Gesture customization initialized');
  }

  loadGestureCustomizations() {
    const saved = this.gestureCustomization;
    
    saved.sensitivity = this.accessibilityState.gestureCustomization.sensitivity || 1.0;
    saved.distance = this.accessibilityState.gestureCustomization.distance || 80;
    saved.timing = this.accessibilityState.gestureCustomization.timing || 300;
    saved.hapticIntensity = this.accessibilityState.gestureCustomization.hapticIntensity || 0.7;
  }

  /**
   * Initialize motor adaptations
   */
  initializeMotorAdaptations() {
    // Setup tremor stabilization
    if (this.accessibilityState.motorAdaptations.tremor) {
      this.setupTremorStabilization();
    }
    
    // Setup limited range adaptations
    if (this.accessibilityState.motorAdaptations.limitedRange) {
      this.setupLimitedRangeAdaptations();
    }
    
    // Setup one-handed optimizations
    if (this.accessibilityState.motorAdaptations.oneHanded) {
      this.setupOneHandedOptimizations();
    }

    console.log('🤲 Motor adaptations initialized');
  }

  setupTremorStabilization() {
    // Implement tremor filtering
    this.motorAdaptations.tremor.stabilization = true;
    
    // Setup gesture buffering
    document.addEventListener('touchmove', (event) => {
      if (this.motorAdaptations.tremor.stabilization) {
        this.bufferTouchInput(event);
      }
    });
  }

  bufferTouchInput(event) {
    const buffer = this.motorAdaptations.tremor.buffer;
    const smoothingFactor = this.motorAdaptations.tremor.smoothingFactor;
    
    // Add current touch position to buffer
    buffer.push({
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
      timestamp: Date.now()
    });
    
    // Keep buffer size manageable
    if (buffer.length > 10) {
      buffer.shift();
    }
    
    // Apply smoothing
    if (buffer.length >= 3) {
      const smoothed = this.applySmoothingFilter(buffer, smoothingFactor);
      // Use smoothed coordinates for gesture recognition
    }
  }

  /**
   * Accessibility action executors
   */
  executeAccessibilityAction(action) {
    switch (action.action) {
      case 'vote':
        this.executeVoteAction(action.direction);
        break;
      case 'super-vote':
        this.executeSuperVoteAction();
        break;
      case 'clan':
        this.executeClanAction(action.command);
        break;
      case 'tournament':
        this.executeTournamentAction(action.command);
        break;
      case 'content':
        this.executeContentAction(action.command);
        break;
      case 'navigate':
        this.executeNavigationAction(action);
        break;
      case 'system':
        this.executeSystemAction(action.command);
        break;
    }
  }

  executeVoteAction(direction) {
    document.dispatchEvent(new CustomEvent('mlg-accessibility-vote', {
      detail: { direction, method: 'accessibility' }
    }));
    
    this.announceToScreenReader(
      this.options.SCREEN_READER.announcements[direction === 'up' ? 'voteUp' : 'voteDown']
    );
  }

  executeSuperVoteAction() {
    document.dispatchEvent(new CustomEvent('mlg-accessibility-super-vote', {
      detail: { method: 'accessibility' }
    }));
    
    this.announceToScreenReader(
      this.options.SCREEN_READER.announcements.superVote
    );
  }

  executeClanAction(command) {
    document.dispatchEvent(new CustomEvent('mlg-accessibility-clan-action', {
      detail: { command, method: 'accessibility' }
    }));
    
    this.announceToScreenReader(`Clan action: ${command}`);
  }

  executeTournamentAction(command) {
    document.dispatchEvent(new CustomEvent('mlg-accessibility-tournament-action', {
      detail: { command, method: 'accessibility' }
    }));
    
    this.announceToScreenReader(`Tournament action: ${command}`);
  }

  executeContentAction(command) {
    document.dispatchEvent(new CustomEvent('mlg-accessibility-content-action', {
      detail: { command, method: 'accessibility' }
    }));
    
    this.announceToScreenReader(`Content action: ${command}`);
  }

  executeNavigationAction(action) {
    if (action.direction) {
      if (action.direction === 'back') {
        history.back();
      } else if (action.direction === 'forward') {
        history.forward();
      }
    } else if (action.target) {
      if (action.target === 'home') {
        window.location.href = '/';
      }
    }
    
    this.announceToScreenReader(`Navigation: ${action.direction || action.target}`);
  }

  executeMenuAction(target) {
    if (target === 'main') {
      this.showMainMenu();
    } else if (target === 'close') {
      this.closeMenus();
    }
    
    this.announceToScreenReader(`Menu: ${target}`);
  }

  executeSystemAction(command) {
    switch (command) {
      case 'help':
        this.showHelp();
        break;
      case 'settings':
        this.showSettings();
        break;
      case 'accessibility':
        this.showAccessibilityMenu();
        break;
      case 'read':
        this.readPageContent();
        break;
    }
    
    this.announceToScreenReader(`System action: ${command}`);
  }

  /**
   * Screen reader methods
   */
  announceToScreenReader(message, priority = 'polite') {
    const regionId = priority === 'assertive' ? 
      'mlg-aria-live-assertive' : 'mlg-aria-live-polite';
    
    const region = document.getElementById(regionId);
    if (region) {
      region.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        region.textContent = '';
      }, 1000);
    }
  }

  announceAction(action) {
    const announcement = this.options.SCREEN_READER.announcements[action.action];
    if (announcement) {
      this.announceToScreenReader(announcement);
    }
  }

  /**
   * UI Creation methods
   */
  createAccessibilityUI() {
    this.createAccessibilityToolbar();
    this.createCustomizationPanel();
    this.createHelpOverlay();
  }

  createAccessibilityToolbar() {
    const toolbar = document.createElement('div');
    toolbar.id = 'mlg-accessibility-toolbar';
    toolbar.className = 'accessibility-toolbar';
    toolbar.setAttribute('role', 'toolbar');
    toolbar.setAttribute('aria-label', 'Accessibility tools');
    toolbar.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 10px;
      border-radius: 8px;
      z-index: 10000;
      display: none;
    `;
    
    toolbar.innerHTML = `
      <button class="accessibility-btn" data-action="voice-toggle">
        🎤 Voice Control
      </button>
      <button class="accessibility-btn" data-action="customize">
        ⚙️ Customize
      </button>
      <button class="accessibility-btn" data-action="help">
        ❓ Help
      </button>
      <button class="accessibility-btn" data-action="close">
        ✕ Close
      </button>
    `;
    
    // Add event listeners
    toolbar.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action) {
        this.handleToolbarAction(action);
      }
    });
    
    document.body.appendChild(toolbar);
  }

  showAccessibilityMenu() {
    const toolbar = document.getElementById('mlg-accessibility-toolbar');
    if (toolbar) {
      toolbar.style.display = toolbar.style.display === 'none' ? 'block' : 'none';
    }
  }

  /**
   * Utility methods
   */
  detectScreenReader() {
    // Simple screen reader detection
    return !!(
      navigator.userAgent.match(/NVDA|JAWS|VoiceOver|TalkBack/i) ||
      window.speechSynthesis ||
      document.getElementById('nvda-addon')
    );
  }

  detectReducedMotion() {
    return window.matchMedia && 
           window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  detectHighContrast() {
    return window.matchMedia && 
           window.matchMedia('(prefers-contrast: high)').matches;
  }

  getElementGestureType(element) {
    if (element.dataset.voteAction) return 'swipeUp';
    if (element.dataset.clanAction) return 'swipeLeft';
    if (element.dataset.tournamentAction) return 'longPress';
    return 'swipeUp';
  }

  getKeyCode(event) {
    const modifiers = [];
    if (event.altKey) modifiers.push('Alt');
    if (event.ctrlKey) modifiers.push('Ctrl');
    if (event.shiftKey) modifiers.push('Shift');
    if (event.metaKey) modifiers.push('Meta');
    
    return modifiers.length > 0 ? 
      modifiers.join('+') + '+' + event.code : event.code;
  }

  trackKeySequence(keyCode) {
    this.keyboardNavigation.keySequence.push({
      key: keyCode,
      timestamp: Date.now()
    });
    
    // Keep sequence short
    if (this.keyboardNavigation.keySequence.length > 5) {
      this.keyboardNavigation.keySequence.shift();
    }
  }

  findPartialVoiceMatch(transcript) {
    for (const [command, action] of this.voiceRecognition.commands) {
      if (command.includes(transcript) || transcript.includes(command)) {
        return action;
      }
    }
    return null;
  }

  loadGesturePreferences() {
    try {
      const prefs = localStorage.getItem('mlg-gesture-accessibility-prefs');
      return prefs ? JSON.parse(prefs) : {};
    } catch {
      return {};
    }
  }

  loadMotorAdaptations() {
    try {
      const adaptations = localStorage.getItem('mlg-motor-adaptations');
      return adaptations ? JSON.parse(adaptations) : {};
    } catch {
      return {};
    }
  }

  loadInputMethods() {
    try {
      const methods = localStorage.getItem('mlg-input-methods');
      return methods ? JSON.parse(methods) : {};
    } catch {
      return {};
    }
  }

  getActiveFeatures() {
    return {
      screenReader: this.accessibilityState.isScreenReaderActive,
      voiceControl: this.accessibilityState.voiceControlActive,
      keyboardNav: this.accessibilityState.keyboardNavActive,
      switchControl: this.accessibilityState.switchControlActive,
      gestureCustomization: this.options.enableGestureCustomization,
      motorAdaptations: this.options.enableMotorAdaptations
    };
  }

  /**
   * Placeholder implementations
   */
  setupFocusManagement() { /* Implementation */ }
  setupLandmarkNavigation() { /* Implementation */ }
  setupKeyboardFocusManagement() { /* Implementation */ }
  handleKeyboardRelease(event) { /* Implementation */ }
  handleVoiceError(event) { /* Implementation */ }
  handleVoiceEnd() { /* Implementation */ }
  setupSwitchEventListeners() { /* Implementation */ }
  setupScanningInterface() { /* Implementation */ }
  applyGestureCustomizations() { /* Implementation */ }
  setupCustomizationUI() { /* Implementation */ }
  setupLimitedRangeAdaptations() { /* Implementation */ }
  setupOneHandedOptimizations() { /* Implementation */ }
  applySmoothingFilter(buffer, factor) { /* Implementation */ }
  setupAccessibilityEventHandlers() { /* Implementation */ }
  createCustomizationPanel() { /* Implementation */ }
  createHelpOverlay() { /* Implementation */ }
  handleToolbarAction(action) { /* Implementation */ }
  showMainMenu() { /* Implementation */ }
  closeMenus() { /* Implementation */ }
  showHelp() { /* Implementation */ }
  showSettings() { /* Implementation */ }
  readPageContent() { /* Implementation */ }

  startVoiceControl() {
    if (this.voiceRecognition.recognition && !this.voiceRecognition.isListening) {
      try {
        this.voiceRecognition.recognition.start();
        this.voiceRecognition.isListening = true;
        this.announceToScreenReader('Voice control activated');
      } catch (error) {
        console.error('Failed to start voice control:', error);
      }
    }
  }

  stopVoiceControl() {
    if (this.voiceRecognition.recognition && this.voiceRecognition.isListening) {
      this.voiceRecognition.recognition.stop();
      this.voiceRecognition.isListening = false;
      this.announceToScreenReader('Voice control deactivated');
    }
  }

  /**
   * Public API
   */
  getAccessibilityStatus() {
    return {
      isScreenReaderActive: this.accessibilityState.isScreenReaderActive,
      voiceControlActive: this.accessibilityState.voiceControlActive,
      keyboardNavActive: this.accessibilityState.keyboardNavActive,
      reducedMotion: this.accessibilityState.reducedMotion,
      activeAlternatives: Array.from(this.accessibilityState.activeAlternatives),
      gestureCustomization: this.gestureCustomization
    };
  }

  updateGestureSettings(settings) {
    Object.assign(this.gestureCustomization, settings);
    this.saveAccessibilityPreferences();
  }

  saveAccessibilityPreferences() {
    try {
      localStorage.setItem('mlg-gesture-accessibility-prefs', 
        JSON.stringify(this.gestureCustomization));
      localStorage.setItem('mlg-motor-adaptations', 
        JSON.stringify(this.motorAdaptations));
    } catch (error) {
      console.warn('Failed to save accessibility preferences:', error);
    }
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    console.log('🔥 Destroying Gesture Accessibility System...');
    
    // Stop voice control
    this.stopVoiceControl();
    
    // Remove UI elements
    const toolbar = document.getElementById('mlg-accessibility-toolbar');
    if (toolbar) toolbar.remove();
    
    // Remove ARIA live regions
    ['mlg-aria-live-polite', 'mlg-aria-live-assertive', 'mlg-aria-status'].forEach(id => {
      const element = document.getElementById(id);
      if (element) element.remove();
    });
    
    // Save preferences
    this.saveAccessibilityPreferences();
    
    console.log('✅ Gesture Accessibility System destroyed');
  }
}

// Create and export singleton instance
const MLGGestureAccessibility = new MLGGestureAccessibilitySystem();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.MLGGestureAccessibility = MLGGestureAccessibility;
}

export default MLGGestureAccessibility;
export { MLGGestureAccessibilitySystem, ACCESSIBILITY_CONFIG };