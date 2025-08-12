/**
 * MLG.clan Touch-First Design Patterns
 * 
 * Comprehensive touch interaction patterns for mobile gaming
 * Implements accessibility-compliant touch targets and gestures
 * 
 * Features:
 * - Touch target size compliance (44px+ minimum)
 * - Gaming-specific touch gestures
 * - Haptic feedback integration
 * - Touch accessibility features
 * - Mobile game controller emulation
 * - Gesture recognition system
 * - Touch animation patterns
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 */

import { 
  generateGamingClasses, 
  getTouchOptimizedClasses,
  deviceUtils,
  touchUtils,
  responsivePatterns
} from './ui/utils.js';

/**
 * Touch Design Configuration
 */
const TOUCH_CONFIG = {
  // Touch target sizes (WCAG AA compliant)
  MIN_TOUCH_TARGET: 44,      // Minimum 44px
  RECOMMENDED_TOUCH_TARGET: 48, // Recommended 48px
  GAMING_TOUCH_TARGET: 56,   // Gaming optimized 56px
  
  // Touch interaction thresholds
  TAP_MAX_DISTANCE: 10,      // Maximum movement for tap
  LONG_PRESS_DURATION: 500,  // Long press detection
  DOUBLE_TAP_INTERVAL: 300,  // Double tap window
  SWIPE_MIN_DISTANCE: 50,    // Minimum swipe distance
  SWIPE_MAX_TIME: 300,       // Maximum swipe duration
  
  // Gaming-specific gestures
  PINCH_THRESHOLD: 0.1,      // Pinch sensitivity
  ROTATE_THRESHOLD: 15,      // Rotation angle threshold
  PINCH_MIN_SCALE: 0.5,      // Minimum pinch scale
  PINCH_MAX_SCALE: 3.0,      // Maximum pinch scale
  
  // Gaming vote gestures
  VOTE_SWIPE_THRESHOLD: 80,  // Swipe distance for voting
  SUPER_VOTE_DURATION: 1000, // Long press for super vote
  PULL_REFRESH_THRESHOLD: 120, // Pull-to-refresh distance
  
  // Haptic feedback patterns
  HAPTIC_LIGHT: 25,          // Light feedback
  HAPTIC_MEDIUM: 50,         // Medium feedback
  HAPTIC_HEAVY: 100,         // Heavy feedback
  
  // Animation timing
  TOUCH_FEEDBACK_DURATION: 150,
  BUTTON_ANIMATION_DURATION: 200,
  GESTURE_ANIMATION_DURATION: 300
};

/**
 * Touch Design Patterns Manager
 * Provides reusable touch interaction patterns
 */
export class TouchDesignPatterns {
  constructor(options = {}) {
    this.options = {
      enableHapticFeedback: true,
      enableGestureRecognition: true,
      enableTouchAnimations: true,
      debugMode: false,
      ...options
    };
    
    this.gestureState = {
      isTracking: false,
      startTime: 0,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      touches: [],
      // Multi-touch state
      isPinching: false,
      initialDistance: 0,
      currentScale: 1,
      initialRotation: 0,
      currentRotation: 0
    };
    
    this.registeredElements = new Map();
    this.activeGestures = new Set();
    this.gamingGestures = new Map(); // Gaming-specific gesture handlers
    this.performanceMonitor = new TouchPerformanceMonitor();
    
    this.init();
  }

  /**
   * Initialize touch patterns system
   */
  init() {
    this.setupGlobalTouchHandlers();
    this.createTouchStyles();
    
    if (this.options.debugMode) {
      this.enableTouchDebugMode();
    }
  }

  /**
   * Setup global touch event handlers
   */
  setupGlobalTouchHandlers() {
    document.addEventListener('touchstart', (e) => {
      this.handleGlobalTouchStart(e);
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      this.handleGlobalTouchMove(e);
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
      this.handleGlobalTouchEnd(e);
    }, { passive: false });

    document.addEventListener('touchcancel', (e) => {
      this.handleGlobalTouchCancel(e);
    }, { passive: false });
  }

  /**
   * Register touch element with specific patterns
   */
  registerTouchElement(element, patterns = {}) {
    const elementId = this.generateElementId(element);
    
    const touchConfig = {
      element,
      patterns: {
        tap: patterns.tap || null,
        longPress: patterns.longPress || null,
        doubleTap: patterns.doubleTap || null,
        swipe: patterns.swipe || null,
        pinch: patterns.pinch || null,
        rotate: patterns.rotate || null,
        ...patterns
      },
      state: {
        isPressed: false,
        pressTimer: null,
        tapCount: 0,
        lastTapTime: 0
      }
    };
    
    this.registeredElements.set(elementId, touchConfig);
    this.applyTouchStyles(element, patterns);
    
    return elementId;
  }

  /**
   * Create gaming button with touch optimizations
   */
  createGamingButton(config = {}) {
    const {
      text = 'Button',
      variant = 'primary',
      size = 'medium',
      icon = null,
      disabled = false,
      loading = false,
      hapticFeedback = 'medium',
      onTap = () => {},
      onLongPress = null,
      className = ''
    } = config;

    const button = document.createElement('button');
    button.className = this.getGamingButtonClasses(variant, size, disabled, className);
    
    // Create button content
    button.innerHTML = `
      ${loading ? this.createLoadingSpinner() : ''}
      ${icon ? `<span class="button-icon">${icon}</span>` : ''}
      <span class="button-text ${loading ? 'hidden' : ''}">${text}</span>
    `;

    // Register touch patterns
    this.registerTouchElement(button, {
      tap: {
        callback: onTap,
        hapticFeedback: hapticFeedback,
        animation: 'scale-down'
      },
      longPress: onLongPress ? {
        callback: onLongPress,
        hapticFeedback: 'heavy',
        animation: 'pulse'
      } : null
    });

    return button;
  }

  /**
   * Create touch-optimized card
   */
  createTouchCard(config = {}) {
    const {
      title = '',
      content = '',
      variant = 'default',
      selectable = false,
      swipeActions = null,
      onTap = null,
      onLongPress = null,
      className = ''
    } = config;

    const card = document.createElement('div');
    card.className = this.getTouchCardClasses(variant, selectable, className);
    
    card.innerHTML = `
      <div class="card-content">
        ${title ? `<h3 class="card-title">${title}</h3>` : ''}
        <div class="card-body">${content}</div>
      </div>
      ${swipeActions ? this.createSwipeActionsIndicator() : ''}
    `;

    // Register touch patterns
    const patterns = {};
    
    if (onTap) {
      patterns.tap = {
        callback: onTap,
        hapticFeedback: 'light',
        animation: 'highlight'
      };
    }
    
    if (onLongPress) {
      patterns.longPress = {
        callback: onLongPress,
        hapticFeedback: 'medium',
        animation: 'lift'
      };
    }
    
    if (swipeActions) {
      patterns.swipe = {
        callback: this.handleCardSwipe.bind(this, swipeActions),
        hapticFeedback: 'light',
        animation: 'swipe'
      };
    }

    this.registerTouchElement(card, patterns);
    
    return card;
  }

  /**
   * Create touch-optimized list item
   */
  createTouchListItem(config = {}) {
    const {
      primaryText = '',
      secondaryText = '',
      icon = null,
      avatar = null,
      actions = [],
      onTap = null,
      onSwipe = null,
      className = ''
    } = config;

    const listItem = document.createElement('div');
    listItem.className = this.getTouchListItemClasses(className);
    
    listItem.innerHTML = `
      <div class="list-item-content">
        ${avatar ? `<div class="list-item-avatar">${avatar}</div>` : ''}
        ${icon ? `<div class="list-item-icon">${icon}</div>` : ''}
        <div class="list-item-text">
          <div class="list-item-primary">${primaryText}</div>
          ${secondaryText ? `<div class="list-item-secondary">${secondaryText}</div>` : ''}
        </div>
        ${actions.length > 0 ? this.createListItemActions(actions) : ''}
      </div>
      ${onSwipe ? this.createSwipeActionsIndicator() : ''}
    `;

    // Register touch patterns
    const patterns = {};
    
    if (onTap) {
      patterns.tap = {
        callback: onTap,
        hapticFeedback: 'light',
        animation: 'highlight'
      };
    }
    
    if (onSwipe) {
      patterns.swipe = {
        callback: onSwipe,
        hapticFeedback: 'light',
        animation: 'swipe'
      };
    }

    this.registerTouchElement(listItem, patterns);
    
    return listItem;
  }

  /**
   * Create swipe-to-vote interface
   */
  createSwipeToVoteInterface(config = {}) {
    const {
      onVoteUp = () => {},
      onVoteDown = () => {},
      onSuperVote = () => {},
      enableHaptic = true,
      className = ''
    } = config;

    const voteInterface = document.createElement('div');
    voteInterface.className = this.getSwipeToVoteClasses(className);
    
    voteInterface.innerHTML = `
      <div class="vote-interface-container">
        <div class="vote-gesture-area" data-vote-area="true">
          <div class="vote-instructions">
            <div class="vote-instruction up">↑ Swipe up to vote</div>
            <div class="vote-instruction down">↓ Swipe down to vote</div>
            <div class="vote-instruction long-press">Hold for Super Vote 🔥</div>
          </div>
          <div class="vote-feedback-area">
            <div class="vote-feedback-indicator"></div>
          </div>
        </div>
      </div>
    `;

    // Register gaming vote gestures
    this.registerTouchElement(voteInterface.querySelector('[data-vote-area]'), {
      swipe: {
        callback: (direction, data) => {
          if (direction === 'up' && Math.abs(data.deltaY) >= TOUCH_CONFIG.VOTE_SWIPE_THRESHOLD) {
            onVoteUp(data);
            this.showVoteFeedback(voteInterface, 'up');
          } else if (direction === 'down' && Math.abs(data.deltaY) >= TOUCH_CONFIG.VOTE_SWIPE_THRESHOLD) {
            onVoteDown(data);
            this.showVoteFeedback(voteInterface, 'down');
          }
        },
        hapticFeedback: enableHaptic ? 'medium' : null,
        animation: 'vote-swipe'
      },
      longPress: {
        callback: () => {
          onSuperVote();
          this.showSuperVoteFeedback(voteInterface);
        },
        duration: TOUCH_CONFIG.SUPER_VOTE_DURATION,
        hapticFeedback: enableHaptic ? 'heavy' : null,
        animation: 'super-vote-charge'
      }
    });

    return voteInterface;
  }

  /**
   * Create pinch-to-zoom container
   */
  createPinchToZoomContainer(config = {}) {
    const {
      content = '',
      minScale = TOUCH_CONFIG.PINCH_MIN_SCALE,
      maxScale = TOUCH_CONFIG.PINCH_MAX_SCALE,
      onScaleChange = () => {},
      className = ''
    } = config;

    const zoomContainer = document.createElement('div');
    zoomContainer.className = this.getPinchZoomClasses(className);
    
    zoomContainer.innerHTML = `
      <div class="zoom-viewport">
        <div class="zoom-content" data-zoom-content="true">
          ${content}
        </div>
      </div>
      <div class="zoom-controls">
        <button class="zoom-btn zoom-out" data-zoom="out">−</button>
        <span class="zoom-indicator">100%</span>
        <button class="zoom-btn zoom-in" data-zoom="in">+</button>
      </div>
    `;

    const zoomContent = zoomContainer.querySelector('[data-zoom-content]');
    let currentScale = 1;

    // Register pinch-to-zoom gestures
    this.registerTouchElement(zoomContent, {
      pinch: {
        callback: (scale, data) => {
          currentScale = Math.max(minScale, Math.min(maxScale, scale));
          zoomContent.style.transform = `scale(${currentScale})`;
          
          const percentage = Math.round(currentScale * 100);
          zoomContainer.querySelector('.zoom-indicator').textContent = `${percentage}%`;
          
          onScaleChange(currentScale, data);
        },
        hapticFeedback: 'light',
        animation: null // Handled by transform
      }
    });

    // Register zoom button controls
    zoomContainer.querySelectorAll('.zoom-btn').forEach(btn => {
      this.registerTouchElement(btn, {
        tap: {
          callback: () => {
            const zoomIn = btn.dataset.zoom === 'in';
            currentScale = zoomIn ? 
              Math.min(maxScale, currentScale * 1.2) : 
              Math.max(minScale, currentScale / 1.2);
            
            zoomContent.style.transform = `scale(${currentScale})`;
            zoomContent.style.transition = 'transform 0.3s ease';
            
            const percentage = Math.round(currentScale * 100);
            zoomContainer.querySelector('.zoom-indicator').textContent = `${percentage}%`;
            
            onScaleChange(currentScale);
            
            setTimeout(() => {
              zoomContent.style.transition = '';
            }, 300);
          },
          hapticFeedback: 'light',
          animation: 'scale-down'
        }
      });
    });

    return zoomContainer;
  }

  /**
   * Create pull-to-refresh container
   */
  createPullToRefreshContainer(config = {}) {
    const {
      content = '',
      onRefresh = () => {},
      refreshThreshold = TOUCH_CONFIG.PULL_REFRESH_THRESHOLD,
      className = ''
    } = config;

    const pullContainer = document.createElement('div');
    pullContainer.className = this.getPullRefreshClasses(className);
    
    pullContainer.innerHTML = `
      <div class="pull-refresh-indicator">
        <div class="pull-refresh-spinner"></div>
        <span class="pull-refresh-text">Pull to refresh gaming data</span>
      </div>
      <div class="pull-refresh-content" data-pull-content="true">
        ${content}
      </div>
    `;

    let isPulling = false;
    let pullDistance = 0;
    const indicator = pullContainer.querySelector('.pull-refresh-indicator');
    const contentArea = pullContainer.querySelector('[data-pull-content]');

    this.registerTouchElement(contentArea, {
      swipe: {
        callback: (direction, data) => {
          if (direction === 'down' && data.deltaY >= refreshThreshold && !isPulling) {
            isPulling = true;
            this.triggerPullRefresh(pullContainer, onRefresh);
          }
        },
        hapticFeedback: 'medium',
        animation: 'pull-refresh'
      }
    });

    return pullContainer;
  }

  /**
   * Create gaming control pad
   */
  createGamingControlPad(config = {}) {
    const {
      onDirectional = () => {},
      onAction = () => {},
      enableHaptic = true,
      className = ''
    } = config;

    const controlPad = document.createElement('div');
    controlPad.className = this.getControlPadClasses(className);
    
    controlPad.innerHTML = `
      <div class="control-pad-container">
        <!-- Directional Pad -->
        <div class="directional-pad">
          <button class="d-pad-btn d-pad-up" data-direction="up">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
            </svg>
          </button>
          <button class="d-pad-btn d-pad-left" data-direction="left">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>
          <div class="d-pad-center"></div>
          <button class="d-pad-btn d-pad-right" data-direction="right">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </button>
          <button class="d-pad-btn d-pad-down" data-direction="down">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>
            </svg>
          </button>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button class="action-btn action-btn-y" data-action="Y">Y</button>
          <button class="action-btn action-btn-x" data-action="X">X</button>
          <button class="action-btn action-btn-b" data-action="B">B</button>
          <button class="action-btn action-btn-a" data-action="A">A</button>
        </div>
      </div>
    `;

    // Register directional buttons
    controlPad.querySelectorAll('.d-pad-btn').forEach(btn => {
      this.registerTouchElement(btn, {
        tap: {
          callback: () => onDirectional(btn.dataset.direction),
          hapticFeedback: enableHaptic ? 'light' : null,
          animation: 'scale-down'
        }
      });
    });

    // Register action buttons
    controlPad.querySelectorAll('.action-btn').forEach(btn => {
      this.registerTouchElement(btn, {
        tap: {
          callback: () => onAction(btn.dataset.action),
          hapticFeedback: enableHaptic ? 'medium' : null,
          animation: 'scale-down'
        }
      });
    });

    return controlPad;
  }

  /**
   * Create swipe gesture overlay
   */
  createSwipeGestureOverlay(element, config = {}) {
    const {
      directions = ['left', 'right'],
      onSwipe = () => {},
      sensitivity = 1,
      showIndicators = true
    } = config;

    const overlay = document.createElement('div');
    overlay.className = 'swipe-gesture-overlay';
    
    if (showIndicators) {
      overlay.innerHTML = `
        <div class="swipe-indicators">
          ${directions.includes('left') ? '<div class="swipe-indicator left">⬅</div>' : ''}
          ${directions.includes('right') ? '<div class="swipe-indicator right">➡</div>' : ''}
          ${directions.includes('up') ? '<div class="swipe-indicator up">⬆</div>' : ''}
          ${directions.includes('down') ? '<div class="swipe-indicator down">⬇</div>' : ''}
        </div>
      `;
    }

    element.style.position = 'relative';
    element.appendChild(overlay);

    this.registerTouchElement(overlay, {
      swipe: {
        callback: onSwipe,
        directions,
        sensitivity,
        hapticFeedback: 'light'
      }
    });

    return overlay;
  }

  /**
   * Handle global touch events with performance optimization
   */
  handleGlobalTouchStart(e) {
    this.performanceMonitor.startFrame();
    
    const target = this.findRegisteredElement(e.target);
    if (!target) return;

    const config = this.registeredElements.get(target.id);
    this.startGestureTracking(e, config);
    
    // Handle multi-touch for pinch gestures
    if (e.touches.length >= 2) {
      this.startMultiTouchTracking(e, config);
    }
  }

  handleGlobalTouchMove(e) {
    if (!this.gestureState.isTracking) return;
    
    this.performanceMonitor.updateFrame();
    this.updateGestureTracking(e);
    
    // Handle multi-touch for pinch/zoom
    if (e.touches.length >= 2) {
      this.updateMultiTouchTracking(e);
    }
    
    // Prevent default for active gestures (use passive listeners where possible)
    if (this.activeGestures.has('swipe') || this.activeGestures.has('pinch')) {
      e.preventDefault();
    }
  }

  handleGlobalTouchEnd(e) {
    if (!this.gestureState.isTracking) return;
    
    this.performanceMonitor.endFrame();
    
    const target = this.findRegisteredElement(e.target);
    if (!target) return;

    const config = this.registeredElements.get(target.id);
    this.processGestureEnd(e, config);
    
    // Handle multi-touch end
    if (e.touches.length < 2 && this.gestureState.isPinching) {
      this.endMultiTouchTracking(config);
    }
    
    this.resetGestureTracking();
  }

  handleGlobalTouchCancel(e) {
    this.resetGestureTracking();
  }

  /**
   * Multi-touch tracking methods
   */
  startMultiTouchTracking(e, config) {
    if (e.touches.length < 2) return;
    
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    
    // Calculate initial distance and angle
    const deltaX = touch2.clientX - touch1.clientX;
    const deltaY = touch2.clientY - touch1.clientY;
    
    this.gestureState.isPinching = true;
    this.gestureState.initialDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    this.gestureState.initialRotation = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
    this.gestureState.currentScale = 1;
    this.gestureState.currentRotation = 0;
    
    this.activeGestures.add('pinch');
  }
  
  updateMultiTouchTracking(e) {
    if (!this.gestureState.isPinching || e.touches.length < 2) return;
    
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    
    // Calculate current distance and angle
    const deltaX = touch2.clientX - touch1.clientX;
    const deltaY = touch2.clientY - touch1.clientY;
    const currentDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const currentRotation = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
    
    // Update scale and rotation
    this.gestureState.currentScale = currentDistance / this.gestureState.initialDistance;
    this.gestureState.currentRotation = currentRotation - this.gestureState.initialRotation;
    
    // Trigger pinch callback
    const target = this.findRegisteredElement(e.target);
    if (target) {
      const config = this.registeredElements.get(target.id);
      if (config.patterns.pinch) {
        const scaleChange = Math.abs(this.gestureState.currentScale - 1);
        if (scaleChange >= TOUCH_CONFIG.PINCH_THRESHOLD) {
          config.patterns.pinch.callback(this.gestureState.currentScale, {
            rotation: this.gestureState.currentRotation,
            centerX: (touch1.clientX + touch2.clientX) / 2,
            centerY: (touch1.clientY + touch2.clientY) / 2
          });
        }
      }
    }
  }
  
  endMultiTouchTracking(config) {
    this.gestureState.isPinching = false;
    this.activeGestures.delete('pinch');
  }

  /**
   * Gesture processing methods
   */
  startGestureTracking(e, config) {
    const touch = e.touches[0];
    
    this.gestureState = {
      isTracking: true,
      startTime: Date.now(),
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      touches: Array.from(e.touches)
    };

    // Start visual feedback
    this.startTouchFeedback(config.element);
    
    // Start long press timer
    if (config.patterns.longPress) {
      config.state.pressTimer = setTimeout(() => {
        this.triggerLongPress(config);
      }, TOUCH_CONFIG.LONG_PRESS_DURATION);
    }
  }

  updateGestureTracking(e) {
    const touch = e.touches[0];
    
    this.gestureState.currentX = touch.clientX;
    this.gestureState.currentY = touch.clientY;
    this.gestureState.touches = Array.from(e.touches);

    // Check for swipe threshold
    const deltaX = Math.abs(this.gestureState.currentX - this.gestureState.startX);
    const deltaY = Math.abs(this.gestureState.currentY - this.gestureState.startY);
    
    if (deltaX > TOUCH_CONFIG.SWIPE_MIN_DISTANCE || deltaY > TOUCH_CONFIG.SWIPE_MIN_DISTANCE) {
      this.activeGestures.add('swipe');
    }

    // Cancel long press if moved too far
    if (deltaX > TOUCH_CONFIG.TAP_MAX_DISTANCE || deltaY > TOUCH_CONFIG.TAP_MAX_DISTANCE) {
      this.cancelPendingGestures();
    }
  }

  processGestureEnd(e, config) {
    const duration = Date.now() - this.gestureState.startTime;
    const deltaX = this.gestureState.currentX - this.gestureState.startX;
    const deltaY = this.gestureState.currentY - this.gestureState.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    this.cancelPendingGestures();

    // Process tap
    if (distance <= TOUCH_CONFIG.TAP_MAX_DISTANCE && duration < TOUCH_CONFIG.LONG_PRESS_DURATION) {
      this.processTap(config);
    }
    
    // Process swipe
    if (distance >= TOUCH_CONFIG.SWIPE_MIN_DISTANCE && duration <= TOUCH_CONFIG.SWIPE_MAX_TIME) {
      this.processSwipe(config, deltaX, deltaY);
    }

    // End visual feedback
    this.endTouchFeedback(config.element);
  }

  processTap(config) {
    const now = Date.now();
    config.state.tapCount++;
    
    // Check for double tap
    if (config.patterns.doubleTap && 
        config.state.tapCount === 2 && 
        now - config.state.lastTapTime <= TOUCH_CONFIG.DOUBLE_TAP_INTERVAL) {
      
      this.triggerDoubleTap(config);
      config.state.tapCount = 0;
    } else {
      // Single tap
      setTimeout(() => {
        if (config.state.tapCount === 1) {
          this.triggerTap(config);
        }
        config.state.tapCount = 0;
      }, TOUCH_CONFIG.DOUBLE_TAP_INTERVAL);
    }
    
    config.state.lastTapTime = now;
  }

  processSwipe(config, deltaX, deltaY) {
    if (!config.patterns.swipe) return;

    let direction;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    this.triggerSwipe(config, direction, { deltaX, deltaY });
  }

  /**
   * Gesture trigger methods
   */
  triggerTap(config) {
    if (!config.patterns.tap) return;
    
    this.playHapticFeedback(config.patterns.tap.hapticFeedback);
    this.playAudioFeedback('vote');
    this.playTouchAnimation(config.element, config.patterns.tap.animation);
    
    if (config.patterns.tap.callback) {
      config.patterns.tap.callback();
    }
  }

  triggerLongPress(config) {
    if (!config.patterns.longPress) return;
    
    this.playHapticFeedback(config.patterns.longPress.hapticFeedback);
    this.playAudioFeedback('superVote');
    this.playTouchAnimation(config.element, config.patterns.longPress.animation);
    
    if (config.patterns.longPress.callback) {
      config.patterns.longPress.callback();
    }
  }

  triggerDoubleTap(config) {
    if (!config.patterns.doubleTap) return;
    
    this.playHapticFeedback(config.patterns.doubleTap.hapticFeedback);
    this.playTouchAnimation(config.element, config.patterns.doubleTap.animation);
    
    if (config.patterns.doubleTap.callback) {
      config.patterns.doubleTap.callback();
    }
  }

  triggerSwipe(config, direction, data) {
    if (!config.patterns.swipe) return;
    
    this.playHapticFeedback(config.patterns.swipe.hapticFeedback);
    this.playTouchAnimation(config.element, config.patterns.swipe.animation);
    
    if (config.patterns.swipe.callback) {
      config.patterns.swipe.callback(direction, data);
    }
  }

  /**
   * Enhanced gaming feedback methods
   */
  showVoteFeedback(container, direction) {
    const indicator = container.querySelector('.vote-feedback-indicator');
    indicator.className = `vote-feedback-indicator active ${direction}`;
    indicator.textContent = direction === 'up' ? '↑ Vote Cast!' : '↓ Vote Cast!';
    
    setTimeout(() => {
      indicator.className = 'vote-feedback-indicator';
      indicator.textContent = '';
    }, 2000);
  }
  
  showSuperVoteFeedback(container) {
    const indicator = container.querySelector('.vote-feedback-indicator');
    indicator.className = 'vote-feedback-indicator super-vote active';
    indicator.textContent = '🔥 SUPER VOTE! MLG Tokens Burned!';
    
    // Create fire effect
    this.createFireEffect(indicator);
    
    setTimeout(() => {
      indicator.className = 'vote-feedback-indicator';
      indicator.textContent = '';
    }, 3000);
  }
  
  triggerPullRefresh(container, onRefresh) {
    const indicator = container.querySelector('.pull-refresh-indicator');
    const spinner = container.querySelector('.pull-refresh-spinner');
    
    indicator.classList.add('active');
    spinner.classList.add('spinning');
    
    onRefresh().then(() => {
      setTimeout(() => {
        indicator.classList.remove('active');
        spinner.classList.remove('spinning');
      }, 500);
    });
  }
  
  createFireEffect(element) {
    const particles = [];
    for (let i = 0; i < 10; i++) {
      const particle = document.createElement('div');
      particle.className = 'fire-particle';
      particle.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        background: radial-gradient(circle, #ff6b35, #f7931e);
        border-radius: 50%;
        pointer-events: none;
        animation: fire-rise 1s ease-out forwards;
        left: ${Math.random() * 100}%;
        animation-delay: ${Math.random() * 0.5}s;
      `;
      element.appendChild(particle);
      particles.push(particle);
    }
    
    setTimeout(() => {
      particles.forEach(p => p.remove());
    }, 1500);
  }

  /**
   * Audio feedback system
   */
  playAudioFeedback(type) {
    if (!this.options.enableAudioFeedback) return;
    
    const audioMap = {
      vote: { frequency: 800, duration: 100 },
      superVote: { frequency: 1200, duration: 300 },
      success: { frequency: 600, duration: 150 },
      error: { frequency: 200, duration: 200 }
    };
    
    const config = audioMap[type];
    if (!config) return;
    
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = config.frequency;
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + config.duration / 1000);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + config.duration / 1000);
    } catch (e) {
      // Fallback to vibration if audio fails
      this.playHapticFeedback('medium');
    }
  }

  /**
   * Feedback and animation methods
   */
  playHapticFeedback(type) {
    if (!this.options.enableHapticFeedback || !navigator.vibrate) return;
    
    const patterns = {
      light: TOUCH_CONFIG.HAPTIC_LIGHT,
      medium: TOUCH_CONFIG.HAPTIC_MEDIUM,
      heavy: TOUCH_CONFIG.HAPTIC_HEAVY
    };
    
    if (patterns[type]) {
      navigator.vibrate(patterns[type]);
    }
  }

  playTouchAnimation(element, animation) {
    if (!this.options.enableTouchAnimations) return;
    
    const animations = {
      'scale-down': () => this.animateScaleDown(element),
      'highlight': () => this.animateHighlight(element),
      'pulse': () => this.animatePulse(element),
      'lift': () => this.animateLift(element),
      'swipe': () => this.animateSwipe(element)
    };
    
    if (animations[animation]) {
      animations[animation]();
    }
  }

  animateScaleDown(element) {
    element.style.transform = 'scale(0.95)';
    element.style.transition = `transform ${TOUCH_CONFIG.BUTTON_ANIMATION_DURATION}ms ease`;
    
    setTimeout(() => {
      element.style.transform = '';
    }, TOUCH_CONFIG.BUTTON_ANIMATION_DURATION);
  }

  animateHighlight(element) {
    element.style.backgroundColor = 'rgba(0, 255, 136, 0.1)';
    element.style.transition = `background-color ${TOUCH_CONFIG.TOUCH_FEEDBACK_DURATION}ms ease`;
    
    setTimeout(() => {
      element.style.backgroundColor = '';
    }, TOUCH_CONFIG.TOUCH_FEEDBACK_DURATION);
  }

  animatePulse(element) {
    element.style.animation = `pulse ${TOUCH_CONFIG.GESTURE_ANIMATION_DURATION}ms ease`;
    
    setTimeout(() => {
      element.style.animation = '';
    }, TOUCH_CONFIG.GESTURE_ANIMATION_DURATION);
  }

  animateLift(element) {
    element.style.transform = 'translateY(-4px)';
    element.style.boxShadow = '0 8px 16px rgba(0, 255, 136, 0.2)';
    element.style.transition = `transform ${TOUCH_CONFIG.GESTURE_ANIMATION_DURATION}ms ease, box-shadow ${TOUCH_CONFIG.GESTURE_ANIMATION_DURATION}ms ease`;
    
    setTimeout(() => {
      element.style.transform = '';
      element.style.boxShadow = '';
    }, TOUCH_CONFIG.GESTURE_ANIMATION_DURATION);
  }

  animateSwipe(element) {
    element.style.transform = 'translateX(10px)';
    element.style.transition = `transform ${TOUCH_CONFIG.GESTURE_ANIMATION_DURATION}ms ease`;
    
    setTimeout(() => {
      element.style.transform = '';
    }, TOUCH_CONFIG.GESTURE_ANIMATION_DURATION);
  }

  /**
   * Visual feedback methods
   */
  startTouchFeedback(element) {
    element.classList.add('touch-active');
  }

  endTouchFeedback(element) {
    element.classList.remove('touch-active');
  }

  /**
   * Utility methods
   */
  generateElementId(element) {
    let id = element.dataset.touchId;
    if (!id) {
      id = `touch-element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      element.dataset.touchId = id;
    }
    return id;
  }

  findRegisteredElement(target) {
    let element = target;
    while (element && element !== document.body) {
      const id = element.dataset.touchId;
      if (id && this.registeredElements.has(id)) {
        return { element, id };
      }
      element = element.parentElement;
    }
    return null;
  }

  cancelPendingGestures() {
    this.registeredElements.forEach(config => {
      if (config.state.pressTimer) {
        clearTimeout(config.state.pressTimer);
        config.state.pressTimer = null;
      }
    });
  }

  resetGestureTracking() {
    this.gestureState.isTracking = false;
    this.activeGestures.clear();
  }

  /**
   * Styling methods
   */
  applyTouchStyles(element, patterns) {
    element.style.touchAction = 'manipulation';
    element.style.userSelect = 'none';
    element.style.webkitUserSelect = 'none';
    element.style.webkitTouchCallout = 'none';
    
    // Ensure minimum touch target size
    const computedStyle = window.getComputedStyle(element);
    const width = parseFloat(computedStyle.width);
    const height = parseFloat(computedStyle.height);
    
    if (width < TOUCH_CONFIG.MIN_TOUCH_TARGET) {
      element.style.minWidth = `${TOUCH_CONFIG.MIN_TOUCH_TARGET}px`;
    }
    
    if (height < TOUCH_CONFIG.MIN_TOUCH_TARGET) {
      element.style.minHeight = `${TOUCH_CONFIG.MIN_TOUCH_TARGET}px`;
    }
  }

  getGamingButtonClasses(variant, size, disabled, className) {
    const baseClasses = getTouchOptimizedClasses(touchUtils.gamingTouchTarget);
    const variantClasses = {
      primary: 'bg-gradient-to-r from-gaming-accent to-xbox-green-light text-black',
      secondary: 'bg-tile-bg-primary border border-gaming-accent text-gaming-accent',
      danger: 'bg-gradient-to-r from-gaming-red to-burn-orange text-white'
    };
    
    const sizeClasses = {
      small: 'px-3 py-2 text-sm',
      medium: 'px-6 py-3 text-base',
      large: 'px-8 py-4 text-lg'
    };
    
    return `
      ${baseClasses}
      ${variantClasses[variant] || variantClasses.primary}
      ${sizeClasses[size] || sizeClasses.medium}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      flex items-center justify-center gap-2 rounded-lg font-semibold
      transition-all duration-200 active:scale-95
      ${className}
    `.trim().replace(/\s+/g, ' ');
  }

  getTouchCardClasses(variant, selectable, className) {
    const baseClasses = getTouchOptimizedClasses('');
    const variantClasses = {
      default: 'bg-tile-bg-primary border border-tile-border',
      gaming: 'bg-gradient-to-br from-tile-bg-primary to-tile-bg-secondary border border-gaming-accent',
      highlighted: 'bg-gaming-accent bg-opacity-10 border border-gaming-accent'
    };
    
    return `
      ${baseClasses}
      ${variantClasses[variant] || variantClasses.default}
      ${selectable ? 'cursor-pointer hover:bg-tile-hover' : ''}
      rounded-lg p-4 transition-all duration-200
      ${className}
    `.trim().replace(/\s+/g, ' ');
  }

  getTouchListItemClasses(className) {
    return `
      ${getTouchOptimizedClasses(touchUtils.touchTarget)}
      flex items-center gap-3 p-3 rounded-lg
      bg-tile-bg-primary border border-tile-border
      transition-all duration-200 active:bg-tile-hover
      ${className}
    `.trim().replace(/\s+/g, ' ');
  }

  getControlPadClasses(className) {
    return `
      touch-control-pad bg-gaming-surface border border-tile-border
      rounded-2xl p-6 select-none
      ${className}
    `.trim().replace(/\s+/g, ' ');
  }

  /**
   * Helper creation methods
   */
  createLoadingSpinner() {
    return `
      <svg class="loading-spinner animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" 
                fill="none" stroke-dasharray="32" stroke-dashoffset="32">
          <animate attributeName="stroke-dashoffset" dur="1s" 
                   values="32;0" repeatCount="indefinite"/>
        </circle>
      </svg>
    `;
  }

  createSwipeActionsIndicator() {
    return `
      <div class="swipe-actions-indicator">
        <div class="swipe-hint">Swipe for actions</div>
      </div>
    `;
  }

  createListItemActions(actions) {
    return `
      <div class="list-item-actions">
        ${actions.map(action => `
          <button class="list-action-btn ${getTouchOptimizedClasses(touchUtils.touchTarget)}"
                  data-action="${action.id}">
            ${action.icon}
          </button>
        `).join('')}
      </div>
    `;
  }

  /**
   * Card swipe handler
   */
  handleCardSwipe(swipeActions, direction, data) {
    const action = swipeActions[direction];
    if (action && action.callback) {
      action.callback(data);
    }
  }

  /**
   * Create enhanced touch styles
   */
  createTouchStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Performance optimized touch styles */
      * {
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
      }
      
      .touch-active {
        background-color: rgba(0, 255, 136, 0.1) !important;
        transform: scale(0.98);
      }
      
      /* Gaming touch interface styles */
      .swipe-to-vote-interface {
        touch-action: pan-y;
        min-height: 200px;
      }
      
      .vote-interface-container {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
      }
      
      .vote-gesture-area {
        width: 100%;
        height: 150px;
        border: 2px dashed var(--gaming-accent);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        transition: all 0.3s ease;
      }
      
      .vote-gesture-area:active {
        border-color: var(--xbox-green);
        background: rgba(0, 255, 136, 0.1);
      }
      
      .vote-instructions {
        text-align: center;
        opacity: 0.7;
        transition: opacity 0.3s ease;
      }
      
      .vote-instruction {
        margin: 4px 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
      
      .vote-instruction.up { color: var(--gaming-accent); }
      .vote-instruction.down { color: var(--gaming-blue); }
      .vote-instruction.long-press { color: var(--burn-orange); }
      
      .vote-feedback-area {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }
      
      .vote-feedback-indicator {
        opacity: 0;
        transform: scale(0.8);
        transition: all 0.3s ease;
        font-weight: 600;
        font-size: 1.125rem;
        text-align: center;
      }
      
      .vote-feedback-indicator.active {
        opacity: 1;
        transform: scale(1);
      }
      
      .vote-feedback-indicator.up {
        color: var(--gaming-accent);
        text-shadow: 0 0 8px var(--gaming-accent);
      }
      
      .vote-feedback-indicator.down {
        color: var(--gaming-blue);
        text-shadow: 0 0 8px var(--gaming-blue);
      }
      
      .vote-feedback-indicator.super-vote {
        color: var(--burn-orange);
        text-shadow: 0 0 12px var(--burn-orange);
        animation: super-vote-pulse 0.5s ease-in-out;
      }
      
      /* Pinch-to-zoom styles */
      .pinch-zoom-container {
        touch-action: none;
      }
      
      .zoom-viewport {
        overflow: hidden;
        position: relative;
        height: 400px;
      }
      
      .zoom-content {
        width: 100%;
        height: 100%;
        transform-origin: center;
        transition: transform 0.1s ease-out;
        will-change: transform;
      }
      
      .zoom-controls {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        padding: 0.75rem;
        background: var(--tile-bg-primary);
        border-top: 1px solid var(--tile-border);
      }
      
      .zoom-btn {
        width: ${TOUCH_CONFIG.MIN_TOUCH_TARGET}px;
        height: ${TOUCH_CONFIG.MIN_TOUCH_TARGET}px;
        border: 2px solid var(--gaming-accent);
        border-radius: 50%;
        background: var(--tile-bg-secondary);
        color: var(--gaming-accent);
        font-size: 1.25rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      
      .zoom-btn:active {
        background: var(--gaming-accent);
        color: black;
        transform: scale(0.9);
      }
      
      .zoom-indicator {
        font-size: 0.875rem;
        color: var(--text-secondary);
        min-width: 3rem;
        text-align: center;
      }
      
      /* Pull-to-refresh styles */
      .pull-refresh-indicator {
        position: absolute;
        top: -60px;
        left: 0;
        right: 0;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        background: var(--gaming-surface);
        color: var(--gaming-accent);
        border-bottom: 1px solid var(--tile-border);
        transition: transform 0.3s ease;
        z-index: 10;
      }
      
      .pull-refresh-indicator.active {
        transform: translateY(60px);
      }
      
      .pull-refresh-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid var(--gaming-accent);
        border-top: 2px solid transparent;
        border-radius: 50%;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .pull-refresh-spinner.spinning {
        opacity: 1;
        animation: spin 1s linear infinite;
      }
      
      /* Fire particle effect */
      @keyframes fire-rise {
        0% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        100% {
          opacity: 0;
          transform: translateY(-30px) scale(0.5);
        }
      }
      
      /* Super vote animation */
      @keyframes super-vote-pulse {
        0%, 100% { transform: scale(1); }
        25% { transform: scale(1.1); }
        50% { transform: scale(1.2); }
        75% { transform: scale(1.1); }
      }
      
      /* Spin animation */
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      .swipe-gesture-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 1;
      }
      
      .swipe-indicators {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        gap: 2rem;
        opacity: 0.5;
      }
      
      .swipe-indicator {
        font-size: 1.5rem;
        color: var(--gaming-accent);
        animation: float 2s ease-in-out infinite alternate;
      }
      
      .control-pad-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        align-items: center;
        justify-items: center;
      }
      
      .directional-pad {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
        gap: 4px;
        width: 120px;
        height: 120px;
      }
      
      .d-pad-btn {
        background: var(--tile-bg-primary);
        border: 2px solid var(--tile-border);
        border-radius: 8px;
        color: var(--gaming-accent);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        min-width: ${TOUCH_CONFIG.MIN_TOUCH_TARGET}px;
        min-height: ${TOUCH_CONFIG.MIN_TOUCH_TARGET}px;
      }
      
      .d-pad-btn:active {
        background: var(--gaming-accent);
        color: black;
        transform: scale(0.9);
      }
      
      .d-pad-up { grid-area: 1 / 2; }
      .d-pad-left { grid-area: 2 / 1; }
      .d-pad-center { 
        grid-area: 2 / 2; 
        background: var(--gaming-surface);
        border-radius: 50%;
      }
      .d-pad-right { grid-area: 2 / 3; }
      .d-pad-down { grid-area: 3 / 2; }
      
      .action-buttons {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: repeat(2, 1fr);
        gap: 8px;
        width: 120px;
        height: 120px;
      }
      
      .action-btn {
        background: var(--tile-bg-primary);
        border: 2px solid var(--tile-border);
        border-radius: 50%;
        color: var(--gaming-accent);
        font-weight: 700;
        font-size: 1.125rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        min-width: ${TOUCH_CONFIG.GAMING_TOUCH_TARGET}px;
        min-height: ${TOUCH_CONFIG.GAMING_TOUCH_TARGET}px;
      }
      
      .action-btn:active {
        background: var(--gaming-accent);
        color: black;
        transform: scale(0.9);
      }
      
      .action-btn-y { grid-area: 1 / 1; border-color: var(--gaming-yellow); color: var(--gaming-yellow); }
      .action-btn-x { grid-area: 1 / 2; border-color: var(--gaming-blue); color: var(--gaming-blue); }
      .action-btn-b { grid-area: 2 / 1; border-color: var(--gaming-red); color: var(--gaming-red); }
      .action-btn-a { grid-area: 2 / 2; border-color: var(--gaming-accent); color: var(--gaming-accent); }
      
      @keyframes float {
        0% { transform: translateY(0px); }
        100% { transform: translateY(-10px); }
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      
      /* Accessibility and performance optimizations */
      @media (prefers-reduced-motion: reduce) {
        .vote-feedback-indicator,
        .zoom-content,
        .pull-refresh-indicator,
        .pull-refresh-spinner {
          animation: none !important;
          transition: none !important;
        }
      }
      
      @media (prefers-contrast: high) {
        .vote-gesture-area {
          border-width: 3px;
        }
        .zoom-btn {
          border-width: 3px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Enable touch debug mode
   */
  enableTouchDebugMode() {
    document.addEventListener('touchstart', (e) => {
      console.log('Touch start:', e.touches.length, 'touches');
    });
    
    document.addEventListener('touchend', (e) => {
      console.log('Touch end:', e.changedTouches.length, 'touches ended');
    });
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    this.registeredElements.clear();
    this.activeGestures.clear();
    this.resetGestureTracking();
  }
}

/**
 * Touch Performance Monitor
 * Monitors touch responsiveness and frame rates
 */
class TouchPerformanceMonitor {
  constructor() {
    this.frameCount = 0;
    this.lastFrameTime = 0;
    this.frameStartTime = 0;
    this.touchLatency = [];
    this.performanceData = {
      averageFPS: 0,
      averageLatency: 0,
      droppedFrames: 0,
      touchResponsiveness: 'excellent'
    };
    
    this.targetFPS = 60;
    this.frameTime = 1000 / this.targetFPS;
  }
  
  startFrame() {
    this.frameStartTime = performance.now();
  }
  
  updateFrame() {
    this.frameCount++;
    
    if (this.frameCount % 60 === 0) {
      this.calculatePerformanceMetrics();
    }
  }
  
  endFrame() {
    const frameEndTime = performance.now();
    const frameDuration = frameEndTime - this.frameStartTime;
    
    this.touchLatency.push(frameDuration);
    
    // Keep only last 100 measurements
    if (this.touchLatency.length > 100) {
      this.touchLatency.shift();
    }
    
    // Detect dropped frames
    if (frameDuration > this.frameTime * 1.5) {
      this.performanceData.droppedFrames++;
    }
  }
  
  calculatePerformanceMetrics() {
    if (this.touchLatency.length === 0) return;
    
    // Calculate average latency
    const totalLatency = this.touchLatency.reduce((sum, latency) => sum + latency, 0);
    this.performanceData.averageLatency = totalLatency / this.touchLatency.length;
    
    // Estimate FPS
    this.performanceData.averageFPS = Math.min(60, 1000 / this.performanceData.averageLatency);
    
    // Determine responsiveness rating
    if (this.performanceData.averageLatency < 16) {
      this.performanceData.touchResponsiveness = 'excellent';
    } else if (this.performanceData.averageLatency < 33) {
      this.performanceData.touchResponsiveness = 'good';
    } else if (this.performanceData.averageLatency < 50) {
      this.performanceData.touchResponsiveness = 'fair';
    } else {
      this.performanceData.touchResponsiveness = 'poor';
    }
  }
  
  getPerformanceData() {
    return { ...this.performanceData };
  }
  
  reset() {
    this.frameCount = 0;
    this.touchLatency = [];
    this.performanceData.droppedFrames = 0;
  }
}

/**
 * Gaming Touch Utilities
 * Additional utility functions for gaming touch interactions
 */
export const GamingTouchUtils = {
  /**
   * Create advanced one-handed navigation helper
   */
  enableOneHandedMode(container, position = 'right') {
    const oneHandedOverlay = document.createElement('div');
    oneHandedOverlay.className = `one-handed-overlay ${position}`;
    
    oneHandedOverlay.innerHTML = `
      <div class="one-handed-nav">
        <button class="nav-btn back" data-action="back">←</button>
        <button class="nav-btn home" data-action="home">⌂</button>
        <button class="nav-btn menu" data-action="menu">☰</button>
      </div>
      <div class="one-handed-actions">
        <button class="action-btn vote-up" data-action="vote-up">👍</button>
        <button class="action-btn vote-down" data-action="vote-down">👎</button>
        <button class="action-btn super-vote" data-action="super-vote">🔥</button>
      </div>
    `;
    
    container.appendChild(oneHandedOverlay);
    
    // Setup gesture interactions for one-handed overlay
    this.setupOneHandedGestures(oneHandedOverlay, position);
    
    // Apply one-handed styles
    const style = document.createElement('style');
    style.textContent = `
      .one-handed-overlay {
        position: fixed;
        bottom: 20px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        opacity: 0.8;
        transition: all 0.3s ease;
        transform: translateX(0);
      }
      
      .one-handed-overlay.collapsed {
        transform: translateX(${position === 'right' ? '80%' : '-80%'});
        opacity: 0.5;
      }
      
      .one-handed-overlay.right {
        right: 20px;
      }
      
      .one-handed-overlay.left {
        left: 20px;
      }
      
      .one-handed-nav,
      .one-handed-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .nav-btn,
      .action-btn {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: 2px solid var(--gaming-accent);
        background: var(--tile-bg-primary);
        color: var(--gaming-accent);
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      
      .nav-btn:active,
      .action-btn:active {
        background: var(--gaming-accent);
        color: black;
        transform: scale(0.9);
      }
      
      .one-handed-toggle {
        position: absolute;
        top: -30px;
        ${position === 'right' ? 'left' : 'right'}: 0;
        width: 30px;
        height: 30px;
        background: var(--gaming-accent);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 14px;
        color: black;
      }
      
      @media (max-width: 768px) {
        .one-handed-overlay {
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    
    return oneHandedOverlay;
  },
  
  /**
   * Setup one-handed gesture interactions
   */
  setupOneHandedGestures(overlay, position) {
    let isCollapsed = false;
    
    // Add toggle button
    const toggleBtn = document.createElement('div');
    toggleBtn.className = 'one-handed-toggle';
    toggleBtn.textContent = position === 'right' ? '◀' : '▶';
    overlay.appendChild(toggleBtn);
    
    // Toggle functionality
    const toggle = () => {
      isCollapsed = !isCollapsed;
      overlay.classList.toggle('collapsed', isCollapsed);
      toggleBtn.textContent = isCollapsed ? 
        (position === 'right' ? '▶' : '◀') : 
        (position === 'right' ? '◀' : '▶');
    };
    
    // Touch toggle
    toggleBtn.addEventListener('touchend', toggle);
    toggleBtn.addEventListener('click', toggle);
    
    // Swipe to show/hide
    let touchStartX = 0;
    
    overlay.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    
    overlay.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const deltaX = touchEndX - touchStartX;
      const threshold = 50;
      
      if (Math.abs(deltaX) > threshold) {
        const shouldCollapse = position === 'right' ? deltaX > 0 : deltaX < 0;
        if (shouldCollapse !== isCollapsed) {
          toggle();
        }
      }
    }, { passive: true });
  },
  
  /**
   * Create floating action button for gaming actions
   */
  createFloatingActionButton(config = {}) {
    const {
      position = { bottom: '80px', right: '20px' },
      actions = [],
      mainIcon = '🎮',
      mainAction = () => {},
      expandOnTouch = true,
      className = ''
    } = config;
    
    const fab = document.createElement('div');
    fab.className = `floating-action-button ${className}`;
    fab.style.cssText = `
      position: fixed;
      bottom: ${position.bottom};
      right: ${position.right};
      width: 56px;
      height: 56px;
      background: linear-gradient(45deg, var(--gaming-accent), var(--xbox-green));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: black;
      box-shadow: 0 4px 12px rgba(0, 255, 136, 0.4);
      cursor: pointer;
      z-index: 1000;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    
    fab.innerHTML = `
      <div class="fab-icon">${mainIcon}</div>
    `;
    
    // Add action menu if actions are provided
    if (actions.length > 0) {
      const actionMenu = document.createElement('div');
      actionMenu.className = 'fab-action-menu';
      actionMenu.style.cssText = `
        position: absolute;
        bottom: 70px;
        right: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
        opacity: 0;
        pointer-events: none;
        transition: all 0.3s ease;
        transform: translateY(20px);
      `;
      
      actions.forEach((action, index) => {
        const actionBtn = document.createElement('div');
        actionBtn.className = 'fab-action-item';
        actionBtn.style.cssText = `
          width: 48px;
          height: 48px;
          background: var(--tile-bg-primary);
          border: 2px solid var(--gaming-accent);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: var(--gaming-accent);
          cursor: pointer;
          transition: all 0.2s ease;
          transform: scale(0);
          animation-delay: ${index * 50}ms;
        `;
        
        actionBtn.innerHTML = action.icon;
        actionBtn.addEventListener('touchend', action.callback);
        actionBtn.addEventListener('click', action.callback);
        
        // Haptic feedback
        actionBtn.addEventListener('touchstart', () => {
          navigator.vibrate && navigator.vibrate(50);
        });
        
        actionMenu.appendChild(actionBtn);
      });
      
      fab.appendChild(actionMenu);
      
      // Expand/collapse functionality
      let isExpanded = false;
      
      const toggleMenu = () => {
        isExpanded = !isExpanded;
        actionMenu.style.opacity = isExpanded ? '1' : '0';
        actionMenu.style.pointerEvents = isExpanded ? 'auto' : 'none';
        actionMenu.style.transform = isExpanded ? 'translateY(0)' : 'translateY(20px)';
        
        actionMenu.querySelectorAll('.fab-action-item').forEach((item, index) => {
          item.style.transform = isExpanded ? 'scale(1)' : 'scale(0)';
          item.style.transitionDelay = isExpanded ? `${index * 50}ms` : '0ms';
        });
        
        fab.style.transform = isExpanded ? 'rotate(45deg)' : 'rotate(0deg)';
      };
      
      if (expandOnTouch) {
        fab.addEventListener('touchend', (e) => {
          e.preventDefault();
          toggleMenu();
        });
        fab.addEventListener('click', toggleMenu);
      } else {
        fab.addEventListener('touchend', mainAction);
        fab.addEventListener('click', mainAction);
      }
      
      // Close menu when touching outside
      document.addEventListener('touchstart', (e) => {
        if (isExpanded && !fab.contains(e.target)) {
          toggleMenu();
        }
      });
    } else {
      // Simple FAB without menu
      fab.addEventListener('touchend', mainAction);
      fab.addEventListener('click', mainAction);
    }
    
    // Touch feedback
    fab.addEventListener('touchstart', () => {
      fab.style.transform = 'scale(0.9)';
      navigator.vibrate && navigator.vibrate(25);
    });
    
    fab.addEventListener('touchend', () => {
      fab.style.transform = 'scale(1)';
    });
    
    document.body.appendChild(fab);
    return fab;
  },
  
  /**
   * Create gaming-specific bottom sheet
   */
  createBottomSheet(config = {}) {
    const {
      title = 'Gaming Actions',
      actions = [],
      onClose = () => {},
      swipeToClose = true,
      className = ''
    } = config;
    
    const bottomSheet = document.createElement('div');
    bottomSheet.className = `gaming-bottom-sheet ${className}`;
    bottomSheet.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--tile-bg-primary);
      border-top: 2px solid var(--gaming-accent);
      border-radius: 20px 20px 0 0;
      z-index: 1000;
      transform: translateY(100%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      max-height: 80vh;
      overflow-y: auto;
    `;
    
    bottomSheet.innerHTML = `
      <div class="bottom-sheet-handle" style="
        width: 40px;
        height: 4px;
        background: var(--text-secondary);
        border-radius: 2px;
        margin: 12px auto 8px;
        cursor: pointer;
      "></div>
      <div class="bottom-sheet-header" style="
        padding: 0 20px 16px;
        border-bottom: 1px solid var(--tile-border);
        display: flex;
        align-items: center;
        justify-content: space-between;
      ">
        <h3 style="
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--gaming-accent);
          margin: 0;
        ">${title}</h3>
        <button class="close-btn" style="
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        ">✕</button>
      </div>
      <div class="bottom-sheet-content" style="padding: 20px;"></div>
    `;
    
    const content = bottomSheet.querySelector('.bottom-sheet-content');
    const handle = bottomSheet.querySelector('.bottom-sheet-handle');
    const closeBtn = bottomSheet.querySelector('.close-btn');
    
    // Add actions
    actions.forEach(action => {
      const actionItem = document.createElement('div');
      actionItem.style.cssText = `
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        border-radius: 12px;
        cursor: pointer;
        transition: background-color 0.2s ease;
        margin-bottom: 8px;
        min-height: 56px;
      `;
      
      actionItem.innerHTML = `
        <div class="action-icon" style="
          width: 40px;
          height: 40px;
          background: var(--gaming-surface);
          border: 2px solid var(--gaming-accent);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: var(--gaming-accent);
        ">${action.icon}</div>
        <div class="action-info" style="flex: 1;">
          <div class="action-title" style="
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 4px;
          ">${action.title}</div>
          <div class="action-description" style="
            font-size: 0.875rem;
            color: var(--text-secondary);
          ">${action.description || ''}</div>
        </div>
      `;
      
      actionItem.addEventListener('touchend', () => {
        action.callback();
        this.closeBottomSheet(bottomSheet);
      });
      
      actionItem.addEventListener('click', () => {
        action.callback();
        this.closeBottomSheet(bottomSheet);
      });
      
      // Touch feedback
      actionItem.addEventListener('touchstart', () => {
        actionItem.style.backgroundColor = 'var(--tile-hover)';
        navigator.vibrate && navigator.vibrate(25);
      });
      
      actionItem.addEventListener('touchend', () => {
        setTimeout(() => {
          actionItem.style.backgroundColor = 'transparent';
        }, 150);
      });
      
      content.appendChild(actionItem);
    });
    
    // Show bottom sheet
    document.body.appendChild(bottomSheet);
    requestAnimationFrame(() => {
      bottomSheet.style.transform = 'translateY(0)';
    });
    
    // Close functionality
    closeBtn.addEventListener('click', () => this.closeBottomSheet(bottomSheet));
    handle.addEventListener('click', () => this.closeBottomSheet(bottomSheet));
    
    // Swipe to close
    if (swipeToClose) {
      this.setupBottomSheetSwipeToClose(bottomSheet);
    }
    
    // Click outside to close
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(backdrop);
    
    requestAnimationFrame(() => {
      backdrop.style.opacity = '1';
    });
    
    backdrop.addEventListener('click', () => this.closeBottomSheet(bottomSheet));
    
    // Store backdrop reference for cleanup
    bottomSheet._backdrop = backdrop;
    
    return bottomSheet;
  },
  
  /**
   * Close bottom sheet
   */
  closeBottomSheet(bottomSheet) {
    bottomSheet.style.transform = 'translateY(100%)';
    
    if (bottomSheet._backdrop) {
      bottomSheet._backdrop.style.opacity = '0';
    }
    
    setTimeout(() => {
      if (bottomSheet.parentNode) {
        bottomSheet.parentNode.removeChild(bottomSheet);
      }
      if (bottomSheet._backdrop && bottomSheet._backdrop.parentNode) {
        bottomSheet._backdrop.parentNode.removeChild(bottomSheet._backdrop);
      }
    }, 300);
  },
  
  /**
   * Setup swipe-to-close for bottom sheet
   */
  setupBottomSheetSwipeToClose(bottomSheet) {
    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    let initialTransform = 0;
    
    bottomSheet.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
      currentY = startY;
      isDragging = true;
      initialTransform = 0;
      bottomSheet.style.transition = 'none';
    }, { passive: true });
    
    bottomSheet.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      
      currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;
      
      if (deltaY > 0) { // Only allow downward drag
        const progress = Math.min(deltaY / 200, 1); // Normalize to 0-1
        const transform = deltaY;
        bottomSheet.style.transform = `translateY(${transform}px)`;
        
        // Reduce opacity as user drags
        if (bottomSheet._backdrop) {
          bottomSheet._backdrop.style.opacity = 1 - progress * 0.5;
        }
      }
    }, { passive: true });
    
    bottomSheet.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      
      isDragging = false;
      bottomSheet.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      
      const deltaY = currentY - startY;
      const velocity = Math.abs(deltaY) / (Date.now() - (e.timeStamp || Date.now()));
      
      // Close if dragged more than 100px or fast swipe
      if (deltaY > 100 || velocity > 0.5) {
        this.closeBottomSheet(bottomSheet);
      } else {
        // Snap back
        bottomSheet.style.transform = 'translateY(0)';
        if (bottomSheet._backdrop) {
          bottomSheet._backdrop.style.opacity = '1';
        }
      }
    }, { passive: true });
  },
  
  /**
   * Create thumb-reachable navigation zones
   */
  createThumbZones(container) {
    const thumbZones = {
      easy: [], // Easy to reach with thumb
      moderate: [], // Moderate reach
      hard: [] // Hard to reach
    };
    
    const screenHeight = window.innerHeight;
    const screenWidth = window.innerWidth;
    
    // Define thumb-reachable areas based on device size
    const isLargeDevice = screenHeight > 700;
    const thumbReach = isLargeDevice ? 120 : 100;
    
    // Easy reach zone (bottom third of screen)
    const easyZone = {
      top: screenHeight - thumbReach * 2,
      bottom: screenHeight,
      left: 0,
      right: screenWidth
    };
    
    // Moderate reach zone (middle third)
    const moderateZone = {
      top: screenHeight - thumbReach * 3,
      bottom: easyZone.top,
      left: 0,
      right: screenWidth
    };
    
    // Hard reach zone (top third)
    const hardZone = {
      top: 0,
      bottom: moderateZone.top,
      left: 0,
      right: screenWidth
    };
    
    // Classify existing elements
    const elements = container.querySelectorAll('[data-touch-interactive], button, [role="button"]');
    
    elements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      
      if (centerY >= easyZone.top) {
        thumbZones.easy.push(element);
        element.classList.add('thumb-zone-easy');
      } else if (centerY >= moderateZone.top) {
        thumbZones.moderate.push(element);
        element.classList.add('thumb-zone-moderate');
      } else {
        thumbZones.hard.push(element);
        element.classList.add('thumb-zone-hard');
      }
    });
    
    // Add visual indicators in debug mode
    if (this.debugMode) {
      this.showThumbZoneOverlay(easyZone, moderateZone, hardZone);
    }
    
    return thumbZones;
  },
  
  /**
   * Show thumb zone overlay for debugging
   */
  showThumbZoneOverlay(easyZone, moderateZone, hardZone) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 9999;
    `;
    
    // Easy zone (green)
    const easyDiv = document.createElement('div');
    easyDiv.style.cssText = `
      position: absolute;
      top: ${easyZone.top}px;
      left: ${easyZone.left}px;
      right: ${easyZone.right}px;
      bottom: ${easyZone.bottom}px;
      background: rgba(0, 255, 0, 0.1);
      border: 2px solid rgba(0, 255, 0, 0.5);
    `;
    
    // Moderate zone (yellow)
    const moderateDiv = document.createElement('div');
    moderateDiv.style.cssText = `
      position: absolute;
      top: ${moderateZone.top}px;
      left: ${moderateZone.left}px;
      right: ${moderateZone.right}px;
      bottom: ${moderateZone.bottom}px;
      background: rgba(255, 255, 0, 0.1);
      border: 2px solid rgba(255, 255, 0, 0.5);
    `;
    
    // Hard zone (red)
    const hardDiv = document.createElement('div');
    hardDiv.style.cssText = `
      position: absolute;
      top: ${hardZone.top}px;
      left: ${hardZone.left}px;
      right: ${hardZone.right}px;
      bottom: ${hardZone.bottom}px;
      background: rgba(255, 0, 0, 0.1);
      border: 2px solid rgba(255, 0, 0, 0.5);
    `;
    
    overlay.appendChild(hardDiv);
    overlay.appendChild(moderateDiv);
    overlay.appendChild(easyDiv);
    
    document.body.appendChild(overlay);
    
    // Remove overlay after 5 seconds
    setTimeout(() => {
      overlay.remove();
    }, 5000);
  },
  
  /**
   * Optimize layout for one-handed use
   */
  optimizeForOneHandedUse(container, hand = 'right') {
    const elements = container.querySelectorAll('[data-touch-interactive], button, [role="button"]');
    
    elements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const centerX = rect.left + rect.width / 2;
      
      // Check if element is in hard-to-reach zone
      if (centerY < window.innerHeight / 2) {
        // Add visual indicator for hard-to-reach elements
        element.style.position = 'relative';
        
        // Add accessibility helper
        const helper = document.createElement('div');
        helper.style.cssText = `
          position: absolute;
          top: -8px;
          ${hand === 'right' ? 'left' : 'right'}: -8px;
          width: 16px;
          height: 16px;
          background: var(--gaming-accent);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: black;
          z-index: 10;
          animation: pulse-indicator 2s infinite;
        `;
        helper.textContent = '!';
        
        element.appendChild(helper);
        
        // Add double-tap to activate for hard-to-reach elements
        this.addDoubleTapActivation(element);
      }
    });
    
    // Add CSS for pulse animation
    if (!document.getElementById('one-handed-styles')) {
      const style = document.createElement('style');
      style.id = 'one-handed-styles';
      style.textContent = `
        @keyframes pulse-indicator {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }
        
        .thumb-zone-easy {
          border: 2px solid rgba(0, 255, 0, 0.3) !important;
        }
        
        .thumb-zone-moderate {
          border: 2px solid rgba(255, 255, 0, 0.3) !important;
        }
        
        .thumb-zone-hard {
          border: 2px solid rgba(255, 0, 0, 0.3) !important;
        }
      `;
      document.head.appendChild(style);
    }
  },
  
  /**
   * Add double-tap activation for hard-to-reach elements
   */
  addDoubleTapActivation(element) {
    let tapCount = 0;
    let lastTapTime = 0;
    
    element.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTapTime < 500) {
        tapCount++;
        if (tapCount === 2) {
          // Double tap detected - provide enhanced feedback
          navigator.vibrate && navigator.vibrate([50, 50, 50]);
          element.style.transform = 'scale(1.1)';
          setTimeout(() => {
            element.style.transform = '';
            element.click();
          }, 150);
          tapCount = 0;
        }
      } else {
        tapCount = 1;
      }
      lastTapTime = now;
    }, { passive: true });
  },
  
  return oneHandedOverlay;
  },
  
  /**
   * Create gesture shortcuts overlay
   */
  createGestureShortcuts(actions = {}) {
    const shortcutsOverlay = document.createElement('div');
    shortcutsOverlay.className = 'gesture-shortcuts-overlay';
    
    const shortcuts = [
      { gesture: 'Swipe Up', action: 'Vote Up', icon: '⬆️' },
      { gesture: 'Swipe Down', action: 'Vote Down', icon: '⬇️' },
      { gesture: 'Long Press', action: 'Super Vote', icon: '🔥' },
      { gesture: 'Pinch Out', action: 'Zoom In', icon: '🔍' },
      { gesture: 'Pull Down', action: 'Refresh', icon: '🔄' }
    ];
    
    shortcutsOverlay.innerHTML = `
      <div class="shortcuts-header">
        <h3>Gaming Gesture Shortcuts</h3>
        <button class="shortcuts-close">×</button>
      </div>
      <div class="shortcuts-list">
        ${shortcuts.map(shortcut => `
          <div class="shortcut-item">
            <span class="shortcut-icon">${shortcut.icon}</span>
            <div class="shortcut-info">
              <div class="shortcut-gesture">${shortcut.gesture}</div>
              <div class="shortcut-action">${shortcut.action}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    return shortcutsOverlay;
  },
  
  /**
   * Test touch device capabilities
   */
  testTouchCapabilities() {
    const capabilities = {
      touchSupport: 'ontouchstart' in window,
      multiTouch: 'TouchEvent' in window && TouchEvent.prototype.hasOwnProperty('touches'),
      hapticFeedback: 'vibrate' in navigator,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      touchAction: 'touch-action' in document.body.style,
      pointerEvents: 'onpointerdown' in window
    };
    
    return capabilities;
  },
  
  /**
   * Create gesture-based navigation system
   */
  createGestureNavigation(container, routes = {}) {
    const gestureMap = {
      'swipe-right': routes.back || (() => history.back()),
      'swipe-left': routes.forward || (() => history.forward()),
      'swipe-up': routes.home || (() => window.location.href = '/'),
      'swipe-down': routes.refresh || (() => window.location.reload()),
      'pinch-out': routes.zoom || (() => document.body.style.zoom = '1.2'),
      'pinch-in': routes.zoomOut || (() => document.body.style.zoom = '1.0')
    };
    
    let touchStart = {};
    let touchEnd = {};
    let initialDistance = 0;
    let currentDistance = 0;
    
    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStart = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now()
        };
      } else if (e.touches.length === 2) {
        initialDistance = this.getTouchDistance(e.touches[0], e.touches[1]);
      }
    }, { passive: true });
    
    container.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        currentDistance = this.getTouchDistance(e.touches[0], e.touches[1]);
      }
    }, { passive: true });
    
    container.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1 && touchStart.x !== undefined) {
        touchEnd = {
          x: e.changedTouches[0].clientX,
          y: e.changedTouches[0].clientY,
          time: Date.now()
        };
        
        const gesture = this.detectGesture(touchStart, touchEnd);
        if (gesture && gestureMap[gesture]) {
          e.preventDefault();
          gestureMap[gesture]();
          this.showGesturefeedback(gesture);
        }
        
        touchStart = {};
        touchEnd = {};
      } else if (e.touches.length === 0 && initialDistance > 0) {
        // Pinch gesture ended
        const scaleRatio = currentDistance / initialDistance;
        if (scaleRatio > 1.2 && gestureMap['pinch-out']) {
          gestureMap['pinch-out']();
          this.showGesturefeedback('pinch-out');
        } else if (scaleRatio < 0.8 && gestureMap['pinch-in']) {
          gestureMap['pinch-in']();
          this.showGestureReedback('pinch-in');
        }
        
        initialDistance = 0;
        currentDistance = 0;
      }
    }, { passive: true });
  },
  
  /**
   * Get distance between two touch points
   */
  getTouchDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  },
  
  /**
   * Detect swipe gestures
   */
  detectGesture(start, end) {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const deltaTime = end.time - start.time;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Must be fast enough and far enough
    if (deltaTime > 1000 || distance < 50) return null;
    
    // Determine direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'swipe-right' : 'swipe-left';
    } else {
      return deltaY > 0 ? 'swipe-down' : 'swipe-up';
    }
  },
  
  /**
   * Show visual feedback for gestures
   */
  showGestureeedback(gesture) {
    const feedback = document.createElement('div');
    feedback.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 255, 136, 0.9);
      color: black;
      padding: 12px 24px;
      border-radius: 24px;
      font-weight: 600;
      z-index: 10000;
      pointer-events: none;
      animation: gesture-feedback 1s ease-out forwards;
    `;
    
    const gestureNames = {
      'swipe-right': 'Back',
      'swipe-left': 'Forward', 
      'swipe-up': 'Home',
      'swipe-down': 'Refresh',
      'pinch-out': 'Zoom In',
      'pinch-in': 'Zoom Out'
    };
    
    feedback.textContent = gestureNames[gesture] || 'Gesture';
    document.body.appendChild(feedback);
    
    // Add animation CSS if not exists
    if (!document.getElementById('gesture-feedback-styles')) {
      const style = document.createElement('style');
      style.id = 'gesture-feedback-styles';
      style.textContent = `
        @keyframes gesture-feedback {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
        }
      `;
      document.head.appendChild(style);
    }
    
    setTimeout(() => feedback.remove(), 1000);
  },
  
  /**
   * Optimize touch performance for gaming
   */
  optimizeForGaming() {
    // Disable context menu on long press
    document.addEventListener('contextmenu', (e) => {
      if (e.target.closest('.touch-gaming-area')) {
        e.preventDefault();
      }
    });
    
    // Optimize touch delay
    const style = document.createElement('style');
    style.textContent = `
      .touch-gaming-area {
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
      }
      
      .fast-touch {
        touch-action: manipulation;
        -ms-touch-action: manipulation;
      }
    `;
    document.head.appendChild(style);
    
    // Set meta tag for touch optimization
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    
    viewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
  },
  
  /**
   * Enable debug mode for touch interactions
   */
  enableDebugMode() {
    this.debugMode = true;
    
    // Show touch points
    document.addEventListener('touchstart', (e) => {
      Array.from(e.touches).forEach((touch, index) => {
        this.createTouchIndicator(touch.clientX, touch.clientY, `touch-${touch.identifier}`);
      });
    });
    
    document.addEventListener('touchend', (e) => {
      Array.from(e.changedTouches).forEach((touch) => {
        const indicator = document.getElementById(`touch-${touch.identifier}`);
        if (indicator) {
          indicator.style.background = 'rgba(255, 0, 0, 0.7)';
          setTimeout(() => indicator.remove(), 300);
        }
      });
    });
  },
  
  /**
   * Create touch point indicator
   */
  createTouchIndicator(x, y, id) {
    const indicator = document.createElement('div');
    indicator.id = id;
    indicator.style.cssText = `
      position: fixed;
      left: ${x - 15}px;
      top: ${y - 15}px;
      width: 30px;
      height: 30px;
      background: rgba(0, 255, 136, 0.7);
      border: 2px solid rgba(0, 255, 136, 1);
      border-radius: 50%;
      pointer-events: none;
      z-index: 10000;
      animation: touch-ripple 0.3s ease-out;
    `;
    
    document.body.appendChild(indicator);
    
    // Add ripple animation if not exists
    if (!document.getElementById('touch-ripple-styles')) {
      const style = document.createElement('style');
      style.id = 'touch-ripple-styles';
      style.textContent = `
        @keyframes touch-ripple {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(1); opacity: 0.7; }
        }
      `;
      document.head.appendChild(style);
    }
  }
};
};

// Export default instance
export default new TouchDesignPatterns();

// Export utilities
export { GamingTouchUtils };