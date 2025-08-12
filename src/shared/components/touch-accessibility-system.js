/**
 * MLG.clan Touch Accessibility System
 * 
 * Comprehensive accessibility system for touch interactions
 * Implements WCAG 2.1 AA compliance with gaming-specific enhancements
 * 
 * Features:
 * - WCAG 2.1 AA compliant touch targets (48px+ minimum)
 * - Screen reader optimized touch interactions
 * - High contrast and reduced motion support
 * - Keyboard navigation fallbacks
 * - Voice control integration
 * - Custom accessibility announcements for gaming actions
 * - Touch sensitivity customization
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 */

/**
 * Accessibility Configuration
 */
const ACCESSIBILITY_CONFIG = {
  // Touch target sizes (WCAG 2.1 AA)
  MIN_TOUCH_TARGET: 44,  // WCAG minimum
  RECOMMENDED_TOUCH_TARGET: 48, // Recommended size
  GAMING_TOUCH_TARGET: 56, // Gaming optimized
  
  // Spacing requirements
  MIN_TARGET_SPACING: 8,
  RECOMMENDED_SPACING: 16,
  
  // Timing requirements
  MIN_TIMEOUT_DURATION: 20000, // 20 seconds minimum for timed actions
  DOUBLE_TAP_MAX_INTERVAL: 500, // Maximum for double tap recognition
  LONG_PRESS_MIN_DURATION: 500, // Minimum for long press
  
  // Motion and animation
  REDUCED_MOTION_DURATION: 100, // Reduced animation time
  NO_MOTION_DURATION: 0, // No animation for extreme cases
  
  // Contrast ratios
  MIN_CONTRAST_RATIO: 4.5, // WCAG AA normal text
  ENHANCED_CONTRAST_RATIO: 7, // WCAG AAA
  
  // Sensitivity levels
  SENSITIVITY_LEVELS: {
    LOW: { multiplier: 0.5, threshold: 20 },
    NORMAL: { multiplier: 1, threshold: 10 },
    HIGH: { multiplier: 2, threshold: 5 }
  }
};

/**
 * Touch Accessibility System Class
 */
export class TouchAccessibilitySystem {
  constructor(options = {}) {
    this.options = {
      enableScreenReaderSupport: true,
      enableVoiceControl: true,
      enableHighContrast: false,
      enableReducedMotion: false,
      touchSensitivity: 'NORMAL',
      announceGamingActions: true,
      enableKeyboardFallbacks: true,
      customAnnouncements: true,
      ...options
    };
    
    // Accessibility state
    this.accessibilityState = {
      isScreenReaderActive: false,
      isHighContrastEnabled: false,
      isReducedMotionEnabled: false,
      currentSensitivity: 'NORMAL',
      voiceControlActive: false,
      touchTargetSize: ACCESSIBILITY_CONFIG.RECOMMENDED_TOUCH_TARGET
    };
    
    // Screen reader announcements
    this.announcer = null;
    this.announcementQueue = [];
    
    // Touch targets registry
    this.touchTargets = new Map();
    this.focusableElements = new Set();
    
    // Keyboard navigation state
    this.keyboardNavigation = {
      currentIndex: -1,
      focusableElements: [],
      isActive: false
    };
    
    // Voice control
    this.speechRecognition = null;
    this.voiceCommands = new Map();
    
    this.init();
  }

  /**
   * Initialize accessibility system
   */
  init() {
    this.detectAccessibilityPreferences();
    this.setupScreenReaderSupport();
    this.setupKeyboardNavigation();
    this.setupVoiceControl();
    this.injectAccessibilityStyles();
    this.setupEventHandlers();
    
    // Apply initial accessibility settings
    this.applyAccessibilitySettings();
  }

  /**
   * Detect user accessibility preferences
   */
  detectAccessibilityPreferences() {
    // Detect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.accessibilityState.isReducedMotionEnabled = true;
      this.options.enableReducedMotion = true;
    }
    
    // Detect high contrast preference
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.accessibilityState.isHighContrastEnabled = true;
      this.options.enableHighContrast = true;
    }
    
    // Detect screen reader (heuristic)
    this.detectScreenReader();
    
    // Listen for preference changes
    this.setupPreferenceListeners();
  }

  /**
   * Detect screen reader usage
   */
  detectScreenReader() {
    // Multiple heuristics to detect screen reader usage
    const indicators = [
      // Check for NVDA, JAWS, etc.
      navigator.userAgent.includes('NVDA') || 
      navigator.userAgent.includes('JAWS') ||
      window.speechSynthesis?.getVoices().some(voice => voice.name.includes('NVDA')),
      
      // Check for high contrast mode (Windows)
      window.matchMedia('(-ms-high-contrast: active)').matches ||
      window.matchMedia('(-ms-high-contrast: black-on-white)').matches,
      
      // Check for VoiceOver (macOS/iOS)
      /Mac|iPhone|iPad/.test(navigator.platform) && 'speechSynthesis' in window,
      
      // Check for TalkBack (Android)
      /Android/.test(navigator.userAgent) && 'speechSynthesis' in window
    ];
    
    this.accessibilityState.isScreenReaderActive = indicators.some(indicator => indicator);
    
    if (this.accessibilityState.isScreenReaderActive) {
      this.accessibilityState.touchTargetSize = ACCESSIBILITY_CONFIG.GAMING_TOUCH_TARGET;
      this.options.announceGamingActions = true;
    }
  }

  /**
   * Setup screen reader support
   */
  setupScreenReaderSupport() {
    if (!this.options.enableScreenReaderSupport) return;
    
    // Create announcement region
    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.className = 'sr-only touch-announcer';
    this.announcer.style.cssText = `
      position: absolute;
      left: -10000px;
      top: auto;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(this.announcer);
    
    // Create urgent announcement region
    this.urgentAnnouncer = document.createElement('div');
    this.urgentAnnouncer.setAttribute('aria-live', 'assertive');
    this.urgentAnnouncer.setAttribute('aria-atomic', 'true');
    this.urgentAnnouncer.className = 'sr-only touch-urgent-announcer';
    this.urgentAnnouncer.style.cssText = this.announcer.style.cssText;
    document.body.appendChild(this.urgentAnnouncer);
  }

  /**
   * Setup keyboard navigation as touch fallback
   */
  setupKeyboardNavigation() {
    if (!this.options.enableKeyboardFallbacks) return;
    
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardNavigation(e);
    });
    
    // Focus management
    document.addEventListener('focusin', (e) => {
      this.handleFocusIn(e);
    });
    
    document.addEventListener('focusout', (e) => {
      this.handleFocusOut(e);
    });
  }

  /**
   * Setup voice control integration
   */
  setupVoiceControl() {
    if (!this.options.enableVoiceControl || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.speechRecognition = new SpeechRecognition();
    
    this.speechRecognition.continuous = true;
    this.speechRecognition.interimResults = false;
    this.speechRecognition.lang = 'en-US';
    
    // Setup voice commands
    this.setupVoiceCommands();
    
    this.speechRecognition.onresult = (event) => {
      const command = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
      this.processVoiceCommand(command);
    };
    
    this.speechRecognition.onerror = (event) => {
      console.warn('Voice recognition error:', event.error);
    };
  }

  /**
   * Register accessible touch element
   */
  registerAccessibleTouchElement(element, config = {}) {
    const {
      role = 'button',
      label = '',
      description = '',
      actions = {},
      voiceCommands = [],
      keyboardShortcuts = {},
      touchTargetSize = this.accessibilityState.touchTargetSize,
      ...touchConfig
    } = config;
    
    const elementId = this.generateElementId(element);
    
    // Apply accessibility attributes
    this.applyAccessibilityAttributes(element, {
      role,
      label,
      description
    });
    
    // Ensure proper touch target size
    this.enforceAccessibleTouchTarget(element, touchTargetSize);
    
    // Register touch interactions
    this.registerTouchInteractions(element, actions);
    
    // Register keyboard shortcuts
    this.registerKeyboardShortcuts(element, keyboardShortcuts);
    
    // Register voice commands
    this.registerVoiceCommands(element, voiceCommands);
    
    // Store in registry
    this.touchTargets.set(elementId, {
      element,
      config: { role, label, description, actions, voiceCommands, keyboardShortcuts },
      touchConfig
    });
    
    this.focusableElements.add(element);
    this.updateFocusableElements();
    
    return elementId;
  }

  /**
   * Apply accessibility attributes
   */
  applyAccessibilityAttributes(element, config) {
    const { role, label, description } = config;
    
    // Set ARIA role
    element.setAttribute('role', role);
    
    // Set accessible name
    if (label) {
      element.setAttribute('aria-label', label);
    }
    
    // Set description
    if (description) {
      const descId = `desc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const descElement = document.createElement('div');
      descElement.id = descId;
      descElement.className = 'sr-only';
      descElement.textContent = description;
      document.body.appendChild(descElement);
      element.setAttribute('aria-describedby', descId);
    }
    
    // Make focusable if not already
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '0');
    }
    
    // Add touch interaction hint
    const touchHint = this.getTouchInteractionHint(role);
    if (touchHint) {
      const existingLabel = element.getAttribute('aria-label') || '';
      element.setAttribute('aria-label', `${existingLabel} ${touchHint}`.trim());
    }
  }

  /**
   * Enforce accessible touch target sizing
   */
  enforceAccessibleTouchTarget(element, minSize) {
    const computedStyle = window.getComputedStyle(element);
    const currentWidth = parseFloat(computedStyle.width);
    const currentHeight = parseFloat(computedStyle.height);
    
    // Ensure minimum size
    if (currentWidth < minSize) {
      element.style.minWidth = `${minSize}px`;
    }
    
    if (currentHeight < minSize) {
      element.style.minHeight = `${minSize}px`;
    }
    
    // Ensure adequate spacing
    const spacing = ACCESSIBILITY_CONFIG.RECOMMENDED_SPACING;
    element.style.margin = element.style.margin || `${spacing / 2}px`;
    
    // Add visual feedback for focus
    element.style.outline = 'none'; // We'll provide custom focus styles
    element.classList.add('accessible-touch-target');
  }

  /**
   * Register touch interactions with accessibility enhancements
   */
  registerTouchInteractions(element, actions) {
    const {
      onTap = null,
      onLongPress = null,
      onSwipe = null,
      onDoubleTap = null
    } = actions;
    
    // Wrap actions with accessibility announcements
    if (onTap) {
      element.addEventListener('click', (e) => {
        const result = onTap(e);
        this.announceAction('tap', element, result);
      });
      
      // Touch event for mobile
      let touchStartTime = 0;
      element.addEventListener('touchstart', (e) => {
        touchStartTime = Date.now();
        this.announceTouchStart(element);
      }, { passive: true });
      
      element.addEventListener('touchend', (e) => {
        const touchDuration = Date.now() - touchStartTime;
        if (touchDuration < 500) { // Short tap
          const result = onTap(e);
          this.announceAction('tap', element, result);
        }
      }, { passive: true });
    }
    
    if (onLongPress) {
      let longPressTimer = null;
      
      element.addEventListener('touchstart', (e) => {
        longPressTimer = setTimeout(() => {
          navigator.vibrate && navigator.vibrate(200); // Haptic feedback
          const result = onLongPress(e);
          this.announceAction('longpress', element, result);
        }, ACCESSIBILITY_CONFIG.LONG_PRESS_MIN_DURATION);
      }, { passive: true });
      
      element.addEventListener('touchend', () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
      }, { passive: true });
      
      element.addEventListener('touchmove', () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
      }, { passive: true });
    }
    
    if (onDoubleTap) {
      let lastTapTime = 0;
      let tapCount = 0;
      
      element.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTapTime <= ACCESSIBILITY_CONFIG.DOUBLE_TAP_MAX_INTERVAL) {
          tapCount++;
          if (tapCount === 2) {
            const result = onDoubleTap(e);
            this.announceAction('doubletap', element, result);
            tapCount = 0;
          }
        } else {
          tapCount = 1;
        }
        lastTapTime = now;
      }, { passive: true });
    }
    
    // Swipe gestures with accessibility
    if (onSwipe) {
      this.registerAccessibleSwipe(element, onSwipe);
    }
  }

  /**
   * Register accessible swipe gestures
   */
  registerAccessibleSwipe(element, onSwipe) {
    let touchStart = null;
    let touchEnd = null;
    
    element.addEventListener('touchstart', (e) => {
      touchStart = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      };
    }, { passive: true });
    
    element.addEventListener('touchend', (e) => {
      if (!touchStart) return;
      
      touchEnd = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
        time: Date.now()
      };
      
      const deltaX = touchEnd.x - touchStart.x;
      const deltaY = touchEnd.y - touchStart.y;
      const deltaTime = touchEnd.time - touchStart.time;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Apply sensitivity adjustment
      const sensitivity = ACCESSIBILITY_CONFIG.SENSITIVITY_LEVELS[this.accessibilityState.currentSensitivity];
      const threshold = sensitivity.threshold * sensitivity.multiplier;
      
      if (distance >= threshold && deltaTime < 1000) {
        let direction;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }
        
        const result = onSwipe(direction, { deltaX, deltaY, distance, deltaTime });
        this.announceAction('swipe', element, result, direction);
      }
      
      touchStart = null;
      touchEnd = null;
    }, { passive: true });
  }

  /**
   * Register keyboard shortcuts
   */
  registerKeyboardShortcuts(element, shortcuts) {
    Object.entries(shortcuts).forEach(([key, action]) => {
      element.addEventListener('keydown', (e) => {
        if (this.matchesKeyboardShortcut(e, key)) {
          e.preventDefault();
          const result = action(e);
          this.announceAction('keyboard', element, result, key);
        }
      });
    });
  }

  /**
   * Register voice commands
   */
  registerVoiceCommands(element, commands) {
    commands.forEach(command => {
      this.voiceCommands.set(command.toLowerCase(), {
        element,
        action: command.action || (() => element.click()),
        description: command.description || `Activate ${element.getAttribute('aria-label') || 'element'}`
      });
    });
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyboardNavigation(event) {
    const { key, shiftKey, ctrlKey, altKey } = event;
    
    // Tab navigation
    if (key === 'Tab') {
      this.keyboardNavigation.isActive = true;
      this.updateFocusableElements();
      return;
    }
    
    // Arrow key navigation for gaming
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      event.preventDefault();
      this.navigateWithArrows(key);
      return;
    }
    
    // Enter/Space activation
    if (key === 'Enter' || key === ' ') {
      const focusedElement = document.activeElement;
      if (this.focusableElements.has(focusedElement)) {
        event.preventDefault();
        focusedElement.click();
      }
      return;
    }
    
    // Escape key
    if (key === 'Escape') {
      this.handleEscape();
      return;
    }
    
    // Gaming shortcuts
    this.handleGamingKeyboardShortcuts(event);
  }

  /**
   * Navigate with arrow keys
   */
  navigateWithArrows(direction) {
    const elements = Array.from(this.focusableElements).filter(el => {
      return el.offsetParent !== null && !el.disabled;
    });
    
    if (elements.length === 0) return;
    
    const currentIndex = elements.indexOf(document.activeElement);
    let nextIndex;
    
    switch (direction) {
      case 'ArrowUp':
        nextIndex = currentIndex > 0 ? currentIndex - 1 : elements.length - 1;
        break;
      case 'ArrowDown':
        nextIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'ArrowLeft':
        nextIndex = this.findElementToLeft(elements, currentIndex);
        break;
      case 'ArrowRight':
        nextIndex = this.findElementToRight(elements, currentIndex);
        break;
    }
    
    if (nextIndex !== undefined && nextIndex !== currentIndex) {
      elements[nextIndex].focus();
      this.announceNavigation(elements[nextIndex], direction);
    }
  }

  /**
   * Voice command processing
   */
  processVoiceCommand(command) {
    // Gaming-specific voice commands
    const gamingCommands = {
      'vote up': () => this.executeVoiceAction('vote-up'),
      'vote down': () => this.executeVoiceAction('vote-down'),
      'super vote': () => this.executeVoiceAction('super-vote'),
      'join clan': () => this.executeVoiceAction('join-clan'),
      'open menu': () => this.executeVoiceAction('open-menu'),
      'close modal': () => this.executeVoiceAction('close-modal'),
      'refresh': () => this.executeVoiceAction('refresh'),
      'go back': () => this.executeVoiceAction('go-back'),
      'help': () => this.announceHelp()
    };
    
    // Check gaming commands first
    if (gamingCommands[command]) {
      gamingCommands[command]();
      return;
    }
    
    // Check registered voice commands
    if (this.voiceCommands.has(command)) {
      const commandData = this.voiceCommands.get(command);
      commandData.action();
      this.announce(`Voice command executed: ${commandData.description}`);
      return;
    }
    
    // Fuzzy matching for voice commands
    const bestMatch = this.findBestVoiceCommandMatch(command);
    if (bestMatch) {
      const commandData = this.voiceCommands.get(bestMatch);
      commandData.action();
      this.announce(`Voice command executed: ${commandData.description}`);
    } else {
      this.announce('Voice command not recognized. Say \"help\" for available commands.');
    }
  }

  /**
   * Accessibility announcements
   */
  announce(message, urgent = false) {
    if (!this.options.enableScreenReaderSupport) return;
    
    const announcer = urgent ? this.urgentAnnouncer : this.announcer;
    
    // Queue announcement to avoid conflicts
    this.announcementQueue.push({ message, urgent });
    
    if (this.announcementQueue.length === 1) {
      this.processAnnouncementQueue();
    }
  }

  processAnnouncementQueue() {
    if (this.announcementQueue.length === 0) return;
    
    const { message, urgent } = this.announcementQueue.shift();
    const announcer = urgent ? this.urgentAnnouncer : this.announcer;
    
    // Clear previous announcement
    announcer.textContent = '';
    
    // Add new announcement
    setTimeout(() => {
      announcer.textContent = message;
      
      // Process next announcement
      setTimeout(() => {
        this.processAnnouncementQueue();
      }, 1000);
    }, 100);
  }

  announceAction(actionType, element, result, extra = '') {
    if (!this.options.announceGamingActions) return;
    
    const label = element.getAttribute('aria-label') || element.textContent || 'element';
    
    const actionMessages = {
      tap: `${label} activated`,
      longpress: `${label} long pressed`,
      doubletap: `${label} double tapped`,
      swipe: `${label} swiped ${extra}`,
      keyboard: `${label} activated with ${extra}`,
      voice: `${label} activated by voice`
    };
    
    let message = actionMessages[actionType] || `${label} interacted`;
    
    // Add result information if available
    if (result && typeof result === 'object' && result.message) {
      message += `. ${result.message}`;
    }
    
    this.announce(message);
  }

  announceTouchStart(element) {
    if (!this.accessibilityState.isScreenReaderActive) return;
    
    const label = element.getAttribute('aria-label') || element.textContent || 'element';
    this.announce(`Touching ${label}`, false);
  }

  announceNavigation(element, direction) {
    const label = element.getAttribute('aria-label') || element.textContent || 'element';
    this.announce(`Focused ${label}`);
  }

  announceHelp() {
    const commands = Array.from(this.voiceCommands.keys()).slice(0, 5);
    const helpMessage = `Available voice commands: ${commands.join(', ')}. Touch elements can be activated by tap, long press, or voice commands.`;
    this.announce(helpMessage, true);
  }

  /**
   * Touch sensitivity adjustment
   */
  adjustTouchSensitivity(level) {
    if (!(level in ACCESSIBILITY_CONFIG.SENSITIVITY_LEVELS)) return;
    
    this.accessibilityState.currentSensitivity = level;
    this.announce(`Touch sensitivity set to ${level.toLowerCase()}`);
  }

  /**
   * High contrast mode
   */
  toggleHighContrast() {
    this.accessibilityState.isHighContrastEnabled = !this.accessibilityState.isHighContrastEnabled;
    this.applyHighContrast();
    this.announce(`High contrast mode ${this.accessibilityState.isHighContrastEnabled ? 'enabled' : 'disabled'}`);
  }

  applyHighContrast() {
    document.body.classList.toggle('high-contrast', this.accessibilityState.isHighContrastEnabled);
  }

  /**
   * Reduced motion mode
   */
  toggleReducedMotion() {
    this.accessibilityState.isReducedMotionEnabled = !this.accessibilityState.isReducedMotionEnabled;
    this.applyReducedMotion();
    this.announce(`Reduced motion ${this.accessibilityState.isReducedMotionEnabled ? 'enabled' : 'disabled'}`);
  }

  applyReducedMotion() {
    document.body.classList.toggle('reduce-motion', this.accessibilityState.isReducedMotionEnabled);
  }

  /**
   * Apply all accessibility settings
   */
  applyAccessibilitySettings() {
    this.applyHighContrast();
    this.applyReducedMotion();
    
    // Apply touch target sizing
    document.documentElement.style.setProperty('--touch-target-size', `${this.accessibilityState.touchTargetSize}px`);
  }

  /**
   * Utility methods
   */
  generateElementId(element) {
    let id = element.dataset.accessibilityId;
    if (!id) {
      id = `accessible-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      element.dataset.accessibilityId = id;
    }
    return id;
  }

  getTouchInteractionHint(role) {
    const hints = {
      button: 'button',
      link: 'link',
      menuitem: 'menu item',
      tab: 'tab',
      checkbox: 'checkbox',
      radio: 'radio button'
    };
    
    return hints[role];
  }

  matchesKeyboardShortcut(event, shortcut) {
    // Parse shortcut string like "ctrl+shift+v"
    const parts = shortcut.toLowerCase().split('+');
    const key = parts.pop();
    
    return event.key.toLowerCase() === key &&
           event.ctrlKey === parts.includes('ctrl') &&
           event.shiftKey === parts.includes('shift') &&
           event.altKey === parts.includes('alt');
  }

  updateFocusableElements() {
    this.keyboardNavigation.focusableElements = Array.from(this.focusableElements)
      .filter(el => el.offsetParent !== null && !el.disabled);
  }

  findElementToLeft(elements, currentIndex) {
    // Find element visually to the left
    if (currentIndex === -1) return 0;
    
    const current = elements[currentIndex];
    const currentRect = current.getBoundingClientRect();
    
    let bestIndex = currentIndex;
    let bestDistance = Infinity;
    
    elements.forEach((el, index) => {
      if (index === currentIndex) return;
      
      const rect = el.getBoundingClientRect();
      if (rect.right <= currentRect.left && Math.abs(rect.top - currentRect.top) < currentRect.height) {
        const distance = currentRect.left - rect.right;
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      }
    });
    
    return bestIndex;
  }

  findElementToRight(elements, currentIndex) {
    // Find element visually to the right
    if (currentIndex === -1) return 0;
    
    const current = elements[currentIndex];
    const currentRect = current.getBoundingClientRect();
    
    let bestIndex = currentIndex;
    let bestDistance = Infinity;
    
    elements.forEach((el, index) => {
      if (index === currentIndex) return;
      
      const rect = el.getBoundingClientRect();
      if (rect.left >= currentRect.right && Math.abs(rect.top - currentRect.top) < currentRect.height) {
        const distance = rect.left - currentRect.right;
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      }
    });
    
    return bestIndex;
  }

  findBestVoiceCommandMatch(command) {
    // Simple fuzzy matching for voice commands
    const commands = Array.from(this.voiceCommands.keys());
    let bestMatch = null;
    let bestScore = 0;
    
    commands.forEach(cmd => {
      const score = this.calculateSimilarity(command, cmd);
      if (score > bestScore && score > 0.7) {
        bestScore = score;
        bestMatch = cmd;
      }
    });
    
    return bestMatch;
  }

  calculateSimilarity(str1, str2) {
    // Simple similarity calculation
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  setupPreferenceListeners() {
    // Listen for preference changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.accessibilityState.isReducedMotionEnabled = e.matches;
      this.applyReducedMotion();
    });
    
    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      this.accessibilityState.isHighContrastEnabled = e.matches;
      this.applyHighContrast();
    });
  }

  handleFocusIn(event) {
    const element = event.target;
    if (this.focusableElements.has(element)) {
      element.classList.add('keyboard-focused');
    }
  }

  handleFocusOut(event) {
    const element = event.target;
    element.classList.remove('keyboard-focused');
  }

  handleEscape() {
    // Close modals, menus, etc.
    document.dispatchEvent(new CustomEvent('accessibility-escape'));
  }

  handleGamingKeyboardShortcuts(event) {
    const shortcuts = {
      'v': () => this.executeAction('vote'),
      's': () => this.executeAction('super-vote'),
      'c': () => this.executeAction('clan'),
      'm': () => this.executeAction('menu'),
      'r': () => this.executeAction('refresh'),
      '?': () => this.announceHelp()
    };
    
    if (shortcuts[event.key] && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      shortcuts[event.key]();
    }
  }

  executeAction(action) {
    document.dispatchEvent(new CustomEvent('accessibility-action', {
      detail: { action }
    }));
  }

  executeVoiceAction(action) {
    document.dispatchEvent(new CustomEvent('voice-action', {
      detail: { action }
    }));
    this.announce(`Voice action: ${action.replace('-', ' ')}`);
  }

  /**
   * Inject accessibility styles
   */
  injectAccessibilityStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Screen reader only content */
      .sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }
      
      /* Accessible touch targets */
      .accessible-touch-target {
        min-width: var(--touch-target-size, ${ACCESSIBILITY_CONFIG.RECOMMENDED_TOUCH_TARGET}px);
        min-height: var(--touch-target-size, ${ACCESSIBILITY_CONFIG.RECOMMENDED_TOUCH_TARGET}px);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-align: center;
      }
      
      /* Keyboard focus styles */
      .keyboard-focused {
        outline: 3px solid var(--gaming-accent, #00ff88) !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 1px rgba(0, 255, 136, 0.5) !important;
      }
      
      /* High contrast mode */
      .high-contrast {
        --background-color: #000000;
        --text-color: #ffffff;
        --accent-color: #ffff00;
        --border-color: #ffffff;
      }
      
      .high-contrast * {
        background-color: var(--background-color) !important;
        color: var(--text-color) !important;
        border-color: var(--border-color) !important;
      }
      
      .high-contrast .accessible-touch-target {
        border: 2px solid var(--accent-color) !important;
        background-color: var(--background-color) !important;
      }
      
      .high-contrast .accessible-touch-target:hover,
      .high-contrast .accessible-touch-target:focus {
        background-color: var(--accent-color) !important;
        color: var(--background-color) !important;
      }
      
      /* Reduced motion */
      .reduce-motion *,
      .reduce-motion *::before,
      .reduce-motion *::after {
        animation-duration: ${ACCESSIBILITY_CONFIG.REDUCED_MOTION_DURATION}ms !important;
        animation-delay: 0ms !important;
        transition-duration: ${ACCESSIBILITY_CONFIG.REDUCED_MOTION_DURATION}ms !important;
        transition-delay: 0ms !important;
      }
      
      /* Touch feedback */
      .accessible-touch-target:active {
        transform: scale(0.95);
        background-color: rgba(0, 255, 136, 0.2);
      }
      
      .reduce-motion .accessible-touch-target:active {
        transform: none;
      }
      
      /* Voice control indicator */
      .voice-control-active::after {
        content: '🎤';
        position: absolute;
        top: -10px;
        right: -10px;
        background: var(--gaming-accent, #00ff88);
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
      }
      
      /* Mobile accessibility improvements */
      @media (max-width: 768px) {
        .accessible-touch-target {
          min-width: ${ACCESSIBILITY_CONFIG.GAMING_TOUCH_TARGET}px;
          min-height: ${ACCESSIBILITY_CONFIG.GAMING_TOUCH_TARGET}px;
          margin: ${ACCESSIBILITY_CONFIG.RECOMMENDED_SPACING / 2}px;
        }
      }
      
      /* Focus visible for better keyboard navigation */
      .accessible-touch-target:focus-visible {
        outline: 3px solid var(--gaming-accent, #00ff88);
        outline-offset: 2px;
      }
      
      /* Ensure sufficient color contrast */
      .accessible-touch-target {
        color: contrast(var(--background-color, #000), #000, #fff);
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Start voice control
   */
  startVoiceControl() {
    if (!this.speechRecognition) return;
    
    this.accessibilityState.voiceControlActive = true;
    this.speechRecognition.start();
    this.announce('Voice control activated. You can now use voice commands.', true);
  }

  /**
   * Stop voice control
   */
  stopVoiceControl() {
    if (!this.speechRecognition) return;
    
    this.accessibilityState.voiceControlActive = false;
    this.speechRecognition.stop();
    this.announce('Voice control deactivated.');
  }

  /**
   * Get accessibility status
   */
  getAccessibilityStatus() {
    return {
      ...this.accessibilityState,
      registeredElements: this.touchTargets.size,
      focusableElements: this.focusableElements.size,
      voiceCommands: this.voiceCommands.size
    };
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    if (this.announcer) {
      this.announcer.remove();
    }
    
    if (this.urgentAnnouncer) {
      this.urgentAnnouncer.remove();
    }
    
    if (this.speechRecognition) {
      this.speechRecognition.stop();
    }
    
    this.touchTargets.clear();
    this.focusableElements.clear();
    this.voiceCommands.clear();
    this.announcementQueue.length = 0;
  }
}

// Export default instance
export default new TouchAccessibilitySystem();