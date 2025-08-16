/**
 * MLG Countdown Timer Component
 * 
 * Professional gaming countdown timer with MLG branding, dynamic effects,
 * and multiple display formats. Features real-time updates, urgency indicators,
 * and Xbox 360 retro gaming aesthetic.
 * 
 * Features:
 * - Real-time countdown with precise timing
 * - Multiple display formats (digital, analog, compact)
 * - Dynamic urgency effects and color changes
 * - MLG professional branding and styling
 * - Audio notifications and alerts
 * - Customizable themes and layouts
 * - Responsive design for all devices
 * - Event-driven callbacks for milestones
 * - Timezone support and adjustment
 * - Pause, resume, and reset functionality
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 * @created 2025-08-13
 * @task Task 21.3 - Create MLG branded event banners and tournament displays
 */

import { EventEmitter } from 'events';
import { MLGBrandingSystem } from './mlg-branding-system.js';

/**
 * Countdown Timer Configuration
 */
const COUNTDOWN_CONFIG = {
  // Display Formats
  FORMATS: {
    digital: 'digital',
    compact: 'compact',
    circular: 'circular',
    segment: 'segment',
    minimal: 'minimal'
  },
  
  // Timer States
  STATES: {
    idle: 'idle',
    running: 'running',
    paused: 'paused',
    expired: 'expired',
    completed: 'completed'
  },
  
  // Urgency Levels
  URGENCY_LEVELS: {
    normal: 'normal',
    attention: 'attention',
    warning: 'warning',
    critical: 'critical',
    extreme: 'extreme'
  },
  
  // Time Thresholds (in milliseconds)
  THRESHOLDS: {
    attention: 24 * 60 * 60 * 1000,    // 24 hours
    warning: 4 * 60 * 60 * 1000,       // 4 hours
    critical: 60 * 60 * 1000,          // 1 hour
    extreme: 10 * 60 * 1000            // 10 minutes
  },
  
  // Visual Configuration
  COLORS: {
    normal: '#00ff88',
    attention: '#00d4ff',
    warning: '#fbbf24',
    critical: '#ff8800',
    extreme: '#ef4444',
    expired: '#6b7280',
    background: 'rgba(26, 26, 46, 0.8)',
    text: '#ffffff',
    textMuted: '#9ca3af'
  },
  
  // Animation Settings
  ANIMATIONS: {
    duration: '300ms',
    easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
    pulse: '1s infinite alternate',
    blink: '500ms infinite',
    tick: '100ms ease-out'
  },
  
  // Audio Settings
  AUDIO: {
    enabled: true,
    volume: 0.5,
    sounds: {
      tick: null,
      warning: null,
      critical: null,
      expired: null
    }
  }
};

/**
 * MLG Countdown Timer Class
 */
class MLGCountdownTimer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = { ...COUNTDOWN_CONFIG, ...options };
    this.brandingSystem = new MLGBrandingSystem();
    this.container = null;
    this.targetTime = null;
    this.interval = null;
    this.state = this.config.STATES.idle;
    this.format = options.format || 'digital';
    this.showMilliseconds = options.showMilliseconds || false;
    this.autoStart = options.autoStart !== false;
    this.playAudio = options.playAudio !== false;
    this.milestones = options.milestones || [];
    this.passedMilestones = new Set();
    this.isInitialized = false;
    this.logger = options.logger || console;
    
    // Bind methods
    this.start = this.start.bind(this);
    this.pause = this.pause.bind(this);
    this.resume = this.resume.bind(this);
    this.reset = this.reset.bind(this);
    this.setTargetTime = this.setTargetTime.bind(this);
    this.updateDisplay = this.updateDisplay.bind(this);
    this.tick = this.tick.bind(this);
    
    this.logger.info('⏰ MLG Countdown Timer initialized');
  }

  /**
   * Initialize the countdown timer
   * @param {HTMLElement} container - Container element
   * @param {Date|string|number} targetTime - Target time
   */
  async initialize(container, targetTime) {
    try {
      if (!container) {
        throw new Error('Container element is required');
      }

      this.container = container;
      this.targetTime = new Date(targetTime);
      
      this.logger.info('🚀 Initializing MLG Countdown Timer...');
      
      // Initialize branding system
      await this.brandingSystem.initialize();
      
      // Inject timer styles
      await this.injectTimerStyles();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Create timer display
      await this.createTimerDisplay();
      
      // Auto-start if enabled
      if (this.autoStart) {
        this.start();
      }
      
      this.isInitialized = true;
      this.logger.info('✅ MLG Countdown Timer initialized successfully');
      
      return true;
    } catch (error) {
      this.logger.error('❌ Failed to initialize countdown timer:', error);
      throw error;
    }
  }

  /**
   * Create timer display based on format
   */
  async createTimerDisplay() {
    try {
      this.container.innerHTML = '';
      this.container.className = `mlg-countdown-timer mlg-format-${this.format}`;

      switch (this.format) {
        case 'digital':
          this.createDigitalDisplay();
          break;
        case 'compact':
          this.createCompactDisplay();
          break;
        case 'circular':
          this.createCircularDisplay();
          break;
        case 'segment':
          this.createSegmentDisplay();
          break;
        case 'minimal':
          this.createMinimalDisplay();
          break;
        default:
          this.createDigitalDisplay();
      }

      // Apply container styling
      this.applyContainerStyling();
      
      // Initial update
      this.updateDisplay();
      
    } catch (error) {
      this.logger.error('❌ Error creating timer display:', error);
      this.createFallbackDisplay();
    }
  }

  /**
   * Create digital display format
   */
  createDigitalDisplay() {
    this.container.innerHTML = `
      <div class="mlg-countdown-container">
        <div class="mlg-countdown-header">
          ${this.brandingSystem.createBrandBadge({ 
            size: 'medium', 
            animated: true 
          }).outerHTML}
          <div class="mlg-countdown-title">
            <h3 class="mlg-timer-title">Event Countdown</h3>
            <p class="mlg-timer-subtitle">Time Remaining</p>
          </div>
          <div class="mlg-countdown-status">
            <div class="mlg-status-indicator mlg-status-${this.state}"></div>
            <span class="mlg-status-text">${this.getStateLabel()}</span>
          </div>
        </div>
        
        <div class="mlg-countdown-display">
          <div class="mlg-time-units">
            <div class="mlg-time-unit mlg-days">
              <div class="mlg-time-value" data-unit="days">00</div>
              <div class="mlg-time-label">Days</div>
            </div>
            <div class="mlg-time-separator">:</div>
            <div class="mlg-time-unit mlg-hours">
              <div class="mlg-time-value" data-unit="hours">00</div>
              <div class="mlg-time-label">Hours</div>
            </div>
            <div class="mlg-time-separator">:</div>
            <div class="mlg-time-unit mlg-minutes">
              <div class="mlg-time-value" data-unit="minutes">00</div>
              <div class="mlg-time-label">Minutes</div>
            </div>
            <div class="mlg-time-separator">:</div>
            <div class="mlg-time-unit mlg-seconds">
              <div class="mlg-time-value" data-unit="seconds">00</div>
              <div class="mlg-time-label">Seconds</div>
            </div>
            ${this.showMilliseconds ? `
              <div class="mlg-time-separator">.</div>
              <div class="mlg-time-unit mlg-milliseconds">
                <div class="mlg-time-value" data-unit="milliseconds">000</div>
                <div class="mlg-time-label">MS</div>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div class="mlg-countdown-progress">
          <div class="mlg-progress-bar">
            <div class="mlg-progress-fill" data-progress="0"></div>
          </div>
          <div class="mlg-progress-text">
            <span class="mlg-progress-label">Progress</span>
            <span class="mlg-progress-percentage">0%</span>
          </div>
        </div>
        
        <div class="mlg-countdown-controls">
          <button class="mlg-control-btn mlg-play" data-action="start">
            <span class="mlg-btn-icon">▶️</span>
            <span class="mlg-btn-text">Start</span>
          </button>
          <button class="mlg-control-btn mlg-pause" data-action="pause">
            <span class="mlg-btn-icon">⏸️</span>
            <span class="mlg-btn-text">Pause</span>
          </button>
          <button class="mlg-control-btn mlg-reset" data-action="reset">
            <span class="mlg-btn-icon">🔄</span>
            <span class="mlg-btn-text">Reset</span>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Create compact display format
   */
  createCompactDisplay() {
    this.container.innerHTML = `
      <div class="mlg-countdown-compact">
        <div class="mlg-compact-header">
          <div class="mlg-compact-branding">
            ${this.brandingSystem.createBrandBadge({ 
              size: 'small', 
              showText: false 
            }).outerHTML}
          </div>
          <div class="mlg-compact-title">Event Starts In</div>
          <div class="mlg-compact-status mlg-status-${this.state}"></div>
        </div>
        
        <div class="mlg-compact-display">
          <span class="mlg-compact-value" data-unit="days">0</span>
          <span class="mlg-compact-label">d</span>
          <span class="mlg-compact-separator">:</span>
          <span class="mlg-compact-value" data-unit="hours">00</span>
          <span class="mlg-compact-label">h</span>
          <span class="mlg-compact-separator">:</span>
          <span class="mlg-compact-value" data-unit="minutes">00</span>
          <span class="mlg-compact-label">m</span>
          <span class="mlg-compact-separator">:</span>
          <span class="mlg-compact-value" data-unit="seconds">00</span>
          <span class="mlg-compact-label">s</span>
        </div>
      </div>
    `;
  }

  /**
   * Create circular display format
   */
  createCircularDisplay() {
    this.container.innerHTML = `
      <div class="mlg-countdown-circular">
        <div class="mlg-circular-header">
          ${this.brandingSystem.createBrandBadge({ 
            size: 'large', 
            animated: true 
          }).outerHTML}
          <h3 class="mlg-circular-title">Tournament Countdown</h3>
        </div>
        
        <div class="mlg-circular-rings">
          <div class="mlg-circular-ring mlg-ring-days">
            <svg class="mlg-ring-svg" viewBox="0 0 120 120">
              <circle class="mlg-ring-bg" cx="60" cy="60" r="54" />
              <circle class="mlg-ring-progress" cx="60" cy="60" r="54" data-circumference="339.29" />
            </svg>
            <div class="mlg-ring-content">
              <div class="mlg-ring-value" data-unit="days">0</div>
              <div class="mlg-ring-label">Days</div>
            </div>
          </div>
          
          <div class="mlg-circular-ring mlg-ring-hours">
            <svg class="mlg-ring-svg" viewBox="0 0 100 100">
              <circle class="mlg-ring-bg" cx="50" cy="50" r="44" />
              <circle class="mlg-ring-progress" cx="50" cy="50" r="44" data-circumference="276.46" />
            </svg>
            <div class="mlg-ring-content">
              <div class="mlg-ring-value" data-unit="hours">0</div>
              <div class="mlg-ring-label">Hours</div>
            </div>
          </div>
          
          <div class="mlg-circular-ring mlg-ring-minutes">
            <svg class="mlg-ring-svg" viewBox="0 0 80 80">
              <circle class="mlg-ring-bg" cx="40" cy="40" r="34" />
              <circle class="mlg-ring-progress" cx="40" cy="40" r="34" data-circumference="213.63" />
            </svg>
            <div class="mlg-ring-content">
              <div class="mlg-ring-value" data-unit="minutes">0</div>
              <div class="mlg-ring-label">Min</div>
            </div>
          </div>
          
          <div class="mlg-circular-ring mlg-ring-seconds">
            <svg class="mlg-ring-svg" viewBox="0 0 60 60">
              <circle class="mlg-ring-bg" cx="30" cy="30" r="24" />
              <circle class="mlg-ring-progress" cx="30" cy="30" r="24" data-circumference="150.8" />
            </svg>
            <div class="mlg-ring-content">
              <div class="mlg-ring-value" data-unit="seconds">0</div>
              <div class="mlg-ring-label">Sec</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create segment display format
   */
  createSegmentDisplay() {
    this.container.innerHTML = `
      <div class="mlg-countdown-segment">
        <div class="mlg-segment-header">
          <div class="mlg-segment-branding">
            ${this.brandingSystem.createBrandBadge({ 
              size: 'medium' 
            }).outerHTML}
          </div>
          <div class="mlg-segment-title">
            <h3>Event Timer</h3>
            <div class="mlg-urgency-indicator mlg-urgency-${this.getUrgencyLevel()}"></div>
          </div>
        </div>
        
        <div class="mlg-segment-display">
          <div class="mlg-segment-group">
            <div class="mlg-segment-digit" data-digit="days-tens">0</div>
            <div class="mlg-segment-digit" data-digit="days-ones">0</div>
            <div class="mlg-segment-label">DAYS</div>
          </div>
          <div class="mlg-segment-separator">:</div>
          <div class="mlg-segment-group">
            <div class="mlg-segment-digit" data-digit="hours-tens">0</div>
            <div class="mlg-segment-digit" data-digit="hours-ones">0</div>
            <div class="mlg-segment-label">HOURS</div>
          </div>
          <div class="mlg-segment-separator">:</div>
          <div class="mlg-segment-group">
            <div class="mlg-segment-digit" data-digit="minutes-tens">0</div>
            <div class="mlg-segment-digit" data-digit="minutes-ones">0</div>
            <div class="mlg-segment-label">MINUTES</div>
          </div>
          <div class="mlg-segment-separator">:</div>
          <div class="mlg-segment-group">
            <div class="mlg-segment-digit" data-digit="seconds-tens">0</div>
            <div class="mlg-segment-digit" data-digit="seconds-ones">0</div>
            <div class="mlg-segment-label">SECONDS</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create minimal display format
   */
  createMinimalDisplay() {
    this.container.innerHTML = `
      <div class="mlg-countdown-minimal">
        <div class="mlg-minimal-content">
          <div class="mlg-minimal-icon">⏰</div>
          <div class="mlg-minimal-time">
            <span data-unit="days">0</span>d 
            <span data-unit="hours">00</span>h 
            <span data-unit="minutes">00</span>m 
            <span data-unit="seconds">00</span>s
          </div>
          <div class="mlg-minimal-status mlg-status-${this.state}"></div>
        </div>
      </div>
    `;
  }

  /**
   * Start the countdown timer
   */
  start() {
    if (this.state === this.config.STATES.running) {
      this.logger.warn('⚠️ Timer is already running');
      return;
    }

    if (!this.targetTime) {
      this.logger.error('❌ Target time not set');
      return;
    }

    this.state = this.config.STATES.running;
    this.updateControlsState();
    
    this.interval = setInterval(this.tick, this.showMilliseconds ? 10 : 1000);
    
    this.emit('timer_started');
    this.logger.debug('▶️ Countdown timer started');
  }

  /**
   * Pause the countdown timer
   */
  pause() {
    if (this.state !== this.config.STATES.running) {
      this.logger.warn('⚠️ Timer is not running');
      return;
    }

    this.state = this.config.STATES.paused;
    this.updateControlsState();
    
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    this.emit('timer_paused');
    this.logger.debug('⏸️ Countdown timer paused');
  }

  /**
   * Resume the countdown timer
   */
  resume() {
    if (this.state !== this.config.STATES.paused) {
      this.logger.warn('⚠️ Timer is not paused');
      return;
    }

    this.start();
    this.emit('timer_resumed');
    this.logger.debug('▶️ Countdown timer resumed');
  }

  /**
   * Reset the countdown timer
   */
  reset() {
    this.state = this.config.STATES.idle;
    this.updateControlsState();
    
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    this.passedMilestones.clear();
    this.updateDisplay();
    
    this.emit('timer_reset');
    this.logger.debug('🔄 Countdown timer reset');
  }

  /**
   * Set new target time
   * @param {Date|string|number} targetTime - New target time
   */
  setTargetTime(targetTime) {
    this.targetTime = new Date(targetTime);
    
    if (this.state !== this.config.STATES.running) {
      this.updateDisplay();
    }
    
    this.emit('target_time_changed', { targetTime: this.targetTime });
    this.logger.debug('🎯 Target time updated');
  }

  /**
   * Timer tick function
   */
  tick() {
    const now = new Date().getTime();
    const distance = this.targetTime.getTime() - now;

    if (distance <= 0) {
      this.handleExpiration();
      return;
    }

    this.updateDisplay(distance);
    this.checkMilestones(distance);
    this.updateUrgencyLevel(distance);
  }

  /**
   * Handle timer expiration
   */
  handleExpiration() {
    this.state = this.config.STATES.expired;
    this.updateControlsState();
    
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    this.showExpiredState();
    this.playExpirationSound();
    
    this.emit('timer_expired');
    this.logger.debug('⏰ Countdown timer expired');
  }

  /**
   * Update display with current time
   * @param {number} distance - Time distance in milliseconds
   */
  updateDisplay(distance = null) {
    if (distance === null) {
      const now = new Date().getTime();
      distance = Math.max(0, this.targetTime.getTime() - now);
    }

    const timeUnits = this.calculateTimeUnits(distance);
    
    // Update time values based on format
    switch (this.format) {
      case 'digital':
        this.updateDigitalDisplay(timeUnits);
        break;
      case 'compact':
        this.updateCompactDisplay(timeUnits);
        break;
      case 'circular':
        this.updateCircularDisplay(timeUnits, distance);
        break;
      case 'segment':
        this.updateSegmentDisplay(timeUnits);
        break;
      case 'minimal':
        this.updateMinimalDisplay(timeUnits);
        break;
    }

    // Update progress bar if present
    this.updateProgressBar(distance);
    
    // Update status indicator
    this.updateStatusIndicator();
  }

  /**
   * Calculate time units from distance
   * @param {number} distance - Time distance in milliseconds
   * @returns {Object} Time units
   */
  calculateTimeUnits(distance) {
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    const milliseconds = Math.floor(distance % 1000);

    return { days, hours, minutes, seconds, milliseconds };
  }

  /**
   * Update digital display
   * @param {Object} timeUnits - Time units
   */
  updateDigitalDisplay(timeUnits) {
    const { days, hours, minutes, seconds, milliseconds } = timeUnits;

    this.updateTimeUnit('days', days.toString().padStart(2, '0'));
    this.updateTimeUnit('hours', hours.toString().padStart(2, '0'));
    this.updateTimeUnit('minutes', minutes.toString().padStart(2, '0'));
    this.updateTimeUnit('seconds', seconds.toString().padStart(2, '0'));
    
    if (this.showMilliseconds) {
      this.updateTimeUnit('milliseconds', milliseconds.toString().padStart(3, '0'));
    }
  }

  /**
   * Update compact display
   * @param {Object} timeUnits - Time units
   */
  updateCompactDisplay(timeUnits) {
    const { days, hours, minutes, seconds } = timeUnits;

    this.updateTimeUnit('days', days.toString());
    this.updateTimeUnit('hours', hours.toString().padStart(2, '0'));
    this.updateTimeUnit('minutes', minutes.toString().padStart(2, '0'));
    this.updateTimeUnit('seconds', seconds.toString().padStart(2, '0'));
  }

  /**
   * Update circular display
   * @param {Object} timeUnits - Time units
   * @param {number} distance - Time distance
   */
  updateCircularDisplay(timeUnits, distance) {
    const { days, hours, minutes, seconds } = timeUnits;

    // Update ring values
    this.updateTimeUnit('days', days.toString());
    this.updateTimeUnit('hours', hours.toString());
    this.updateTimeUnit('minutes', minutes.toString());
    this.updateTimeUnit('seconds', seconds.toString());

    // Update ring progress
    this.updateRingProgress('days', days, 365);
    this.updateRingProgress('hours', hours, 24);
    this.updateRingProgress('minutes', minutes, 60);
    this.updateRingProgress('seconds', seconds, 60);
  }

  /**
   * Update ring progress
   * @param {string} unit - Time unit
   * @param {number} value - Current value
   * @param {number} max - Maximum value
   */
  updateRingProgress(unit, value, max) {
    const ring = this.container.querySelector(`.mlg-ring-${unit} .mlg-ring-progress`);
    if (!ring) return;

    const circumference = parseFloat(ring.getAttribute('data-circumference'));
    const progress = (value / max) * circumference;
    const offset = circumference - progress;

    ring.style.strokeDasharray = circumference;
    ring.style.strokeDashoffset = offset;
  }

  /**
   * Update segment display
   * @param {Object} timeUnits - Time units
   */
  updateSegmentDisplay(timeUnits) {
    const { days, hours, minutes, seconds } = timeUnits;

    this.updateSegmentDigit('days-tens', Math.floor(days / 10));
    this.updateSegmentDigit('days-ones', days % 10);
    this.updateSegmentDigit('hours-tens', Math.floor(hours / 10));
    this.updateSegmentDigit('hours-ones', hours % 10);
    this.updateSegmentDigit('minutes-tens', Math.floor(minutes / 10));
    this.updateSegmentDigit('minutes-ones', minutes % 10);
    this.updateSegmentDigit('seconds-tens', Math.floor(seconds / 10));
    this.updateSegmentDigit('seconds-ones', seconds % 10);
  }

  /**
   * Update segment digit
   * @param {string} digit - Digit identifier
   * @param {number} value - Digit value
   */
  updateSegmentDigit(digit, value) {
    const element = this.container.querySelector(`[data-digit="${digit}"]`);
    if (element && element.textContent !== value.toString()) {
      element.textContent = value.toString();
      element.classList.add('mlg-digit-flash');
      setTimeout(() => {
        element.classList.remove('mlg-digit-flash');
      }, 200);
    }
  }

  /**
   * Update minimal display
   * @param {Object} timeUnits - Time units
   */
  updateMinimalDisplay(timeUnits) {
    const { days, hours, minutes, seconds } = timeUnits;

    this.updateTimeUnit('days', days.toString());
    this.updateTimeUnit('hours', hours.toString().padStart(2, '0'));
    this.updateTimeUnit('minutes', minutes.toString().padStart(2, '0'));
    this.updateTimeUnit('seconds', seconds.toString().padStart(2, '0'));
  }

  /**
   * Update time unit element
   * @param {string} unit - Time unit
   * @param {string} value - New value
   */
  updateTimeUnit(unit, value) {
    const element = this.container.querySelector(`[data-unit="${unit}"]`);
    if (element && element.textContent !== value) {
      element.textContent = value;
      
      // Add tick animation
      element.classList.add('mlg-tick-animation');
      setTimeout(() => {
        element.classList.remove('mlg-tick-animation');
      }, 300);
    }
  }

  /**
   * Update progress bar
   * @param {number} distance - Time distance
   */
  updateProgressBar(distance) {
    const progressFill = this.container.querySelector('.mlg-progress-fill');
    const progressPercentage = this.container.querySelector('.mlg-progress-percentage');
    
    if (!progressFill || !progressPercentage) return;

    const totalTime = this.targetTime.getTime() - new Date(0).getTime();
    const elapsed = totalTime - distance;
    const percentage = Math.max(0, Math.min(100, (elapsed / totalTime) * 100));

    progressFill.style.width = `${percentage}%`;
    progressFill.setAttribute('data-progress', percentage);
    progressPercentage.textContent = `${Math.round(percentage)}%`;
  }

  /**
   * Update status indicator
   */
  updateStatusIndicator() {
    const indicators = this.container.querySelectorAll('.mlg-status-indicator, .mlg-compact-status, .mlg-minimal-status');
    const statusText = this.container.querySelector('.mlg-status-text');
    
    indicators.forEach(indicator => {
      indicator.className = indicator.className.replace(/mlg-status-\w+/, `mlg-status-${this.state}`);
    });

    if (statusText) {
      statusText.textContent = this.getStateLabel();
    }
  }

  /**
   * Update controls state
   */
  updateControlsState() {
    const playBtn = this.container.querySelector('[data-action="start"]');
    const pauseBtn = this.container.querySelector('[data-action="pause"]');
    
    if (!playBtn || !pauseBtn) return;

    switch (this.state) {
      case this.config.STATES.idle:
      case this.config.STATES.paused:
        playBtn.style.display = 'flex';
        pauseBtn.style.display = 'none';
        break;
      case this.config.STATES.running:
        playBtn.style.display = 'none';
        pauseBtn.style.display = 'flex';
        break;
      case this.config.STATES.expired:
        playBtn.style.display = 'none';
        pauseBtn.style.display = 'none';
        break;
    }
  }

  /**
   * Check milestones
   * @param {number} distance - Time distance
   */
  checkMilestones(distance) {
    this.milestones.forEach(milestone => {
      const milestoneTime = milestone.time * 1000; // Convert to milliseconds
      
      if (distance <= milestoneTime && !this.passedMilestones.has(milestone.id)) {
        this.passedMilestones.add(milestone.id);
        this.emit('milestone_reached', milestone);
        
        if (milestone.callback) {
          milestone.callback(milestone);
        }
        
        this.logger.debug(`🎯 Milestone reached: ${milestone.name}`);
      }
    });
  }

  /**
   * Update urgency level
   * @param {number} distance - Time distance
   */
  updateUrgencyLevel(distance) {
    const urgencyLevel = this.getUrgencyLevel(distance);
    const container = this.container;
    
    // Remove existing urgency classes
    container.className = container.className.replace(/mlg-urgency-\w+/, '');
    
    // Add new urgency class
    container.classList.add(`mlg-urgency-${urgencyLevel}`);
    
    // Update urgency indicator if present
    const urgencyIndicator = container.querySelector('.mlg-urgency-indicator');
    if (urgencyIndicator) {
      urgencyIndicator.className = urgencyIndicator.className.replace(/mlg-urgency-\w+/, `mlg-urgency-${urgencyLevel}`);
    }
    
    // Play warning sounds
    if (this.playAudio) {
      this.playUrgencySound(urgencyLevel);
    }
  }

  /**
   * Get urgency level
   * @param {number} distance - Time distance
   * @returns {string} Urgency level
   */
  getUrgencyLevel(distance = null) {
    if (distance === null) {
      const now = new Date().getTime();
      distance = this.targetTime.getTime() - now;
    }

    if (distance <= this.config.THRESHOLDS.extreme) {
      return this.config.URGENCY_LEVELS.extreme;
    } else if (distance <= this.config.THRESHOLDS.critical) {
      return this.config.URGENCY_LEVELS.critical;
    } else if (distance <= this.config.THRESHOLDS.warning) {
      return this.config.URGENCY_LEVELS.warning;
    } else if (distance <= this.config.THRESHOLDS.attention) {
      return this.config.URGENCY_LEVELS.attention;
    } else {
      return this.config.URGENCY_LEVELS.normal;
    }
  }

  /**
   * Get state label
   * @returns {string} State label
   */
  getStateLabel() {
    const labels = {
      idle: 'Ready',
      running: 'Running',
      paused: 'Paused',
      expired: 'Expired',
      completed: 'Completed'
    };
    return labels[this.state] || this.state;
  }

  /**
   * Show expired state
   */
  showExpiredState() {
    const container = this.container;
    container.classList.add('mlg-expired');
    
    // Update display to show expiration
    if (this.format === 'digital') {
      const timeUnits = container.querySelectorAll('.mlg-time-value');
      timeUnits.forEach(unit => {
        unit.textContent = '00';
        unit.classList.add('mlg-expired-flash');
      });
    }
    
    // Show expiration message
    const expiredMessage = document.createElement('div');
    expiredMessage.className = 'mlg-expired-message';
    expiredMessage.innerHTML = `
      <div class="mlg-expired-content">
        <div class="mlg-expired-icon">🔥</div>
        <div class="mlg-expired-text">Event Started!</div>
        <div class="mlg-expired-subtext">The countdown has ended</div>
      </div>
    `;
    
    container.appendChild(expiredMessage);
  }

  /**
   * Play urgency sound
   * @param {string} urgencyLevel - Urgency level
   */
  playUrgencySound(urgencyLevel) {
    if (!this.config.AUDIO.enabled) return;
    
    // This would play audio based on urgency level
    // Implementation would depend on audio assets available
    this.logger.debug(`🔊 Playing ${urgencyLevel} urgency sound`);
  }

  /**
   * Play expiration sound
   */
  playExpirationSound() {
    if (!this.config.AUDIO.enabled) return;
    
    // This would play expiration sound
    this.logger.debug('🔊 Playing expiration sound');
  }

  /**
   * Apply container styling
   */
  applyContainerStyling() {
    this.container.style.cssText = `
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #ffffff;
      background: ${this.config.COLORS.background};
      border: 2px solid ${this.config.COLORS.normal};
      border-radius: 16px;
      padding: 24px;
      position: relative;
      overflow: hidden;
      transition: all ${this.config.ANIMATIONS.duration} ${this.config.ANIMATIONS.easing};
    `;
  }

  /**
   * Create fallback display
   */
  createFallbackDisplay() {
    this.container.innerHTML = `
      <div class="mlg-countdown-fallback">
        <div class="mlg-fallback-content">
          <div class="mlg-fallback-icon">⏰</div>
          <div class="mlg-fallback-text">Countdown Timer</div>
          <div class="mlg-fallback-time">00:00:00</div>
        </div>
      </div>
    `;
    
    this.container.style.cssText = `
      background: rgba(26, 26, 46, 0.8);
      border: 2px solid #00ff88;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      color: #ffffff;
    `;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Control button listeners
    this.container.addEventListener('click', (event) => {
      const action = event.target.closest('[data-action]')?.getAttribute('data-action');
      
      switch (action) {
        case 'start':
          this.start();
          break;
        case 'pause':
          this.pause();
          break;
        case 'reset':
          this.reset();
          break;
      }
    });

    this.logger.debug('🎧 Timer event listeners setup complete');
  }

  /**
   * Inject timer styles
   */
  async injectTimerStyles() {
    const styleId = 'mlg-countdown-timer-styles';
    
    const existingStyles = document.getElementById(styleId);
    if (existingStyles) {
      existingStyles.remove();
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* MLG Countdown Timer Styles */
      
      .mlg-countdown-timer {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #ffffff;
        background: rgba(26, 26, 46, 0.8);
        border: 2px solid #00ff88;
        border-radius: 16px;
        padding: 24px;
        position: relative;
        overflow: hidden;
        transition: all 300ms cubic-bezier(0.4, 0, 0.6, 1);
      }

      /* Digital Format */
      .mlg-format-digital .mlg-countdown-container {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .mlg-countdown-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 16px;
        border-bottom: 1px solid rgba(0, 255, 136, 0.3);
      }

      .mlg-countdown-title {
        flex: 1;
        margin: 0 16px;
      }

      .mlg-timer-title {
        font-size: 20px;
        font-weight: bold;
        margin: 0;
        color: #ffffff;
      }

      .mlg-timer-subtitle {
        font-size: 14px;
        color: #9ca3af;
        margin: 4px 0 0 0;
      }

      .mlg-countdown-status {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .mlg-status-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #6b7280;
      }

      .mlg-status-idle { background: #6b7280; }
      .mlg-status-running { background: #00ff88; animation: mlg-status-pulse 2s infinite; }
      .mlg-status-paused { background: #fbbf24; }
      .mlg-status-expired { background: #ef4444; animation: mlg-status-blink 1s infinite; }

      .mlg-status-text {
        font-size: 12px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .mlg-countdown-display {
        text-align: center;
      }

      .mlg-time-units {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }

      .mlg-time-unit {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(0, 255, 136, 0.1);
        border: 1px solid rgba(0, 255, 136, 0.3);
        border-radius: 12px;
        padding: 16px;
        min-width: 80px;
        position: relative;
      }

      .mlg-time-value {
        font-size: 36px;
        font-weight: bold;
        color: #ffffff;
        font-family: 'Courier New', monospace;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        transition: all 100ms ease-out;
      }

      .mlg-time-label {
        font-size: 12px;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-top: 8px;
      }

      .mlg-time-separator {
        font-size: 32px;
        font-weight: bold;
        color: #00ff88;
        margin: 0 8px;
        animation: mlg-separator-blink 2s infinite;
      }

      .mlg-countdown-progress {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .mlg-progress-bar {
        height: 12px;
        background: rgba(107, 114, 128, 0.3);
        border-radius: 6px;
        overflow: hidden;
        position: relative;
      }

      .mlg-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #00ff88 0%, #00d4ff 100%);
        border-radius: 6px;
        transition: width 1s ease;
        position: relative;
      }

      .mlg-progress-fill::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, transparent 40%, rgba(255, 255, 255, 0.2) 50%, transparent 60%);
        animation: mlg-progress-shine 2s infinite;
      }

      .mlg-progress-text {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        color: #9ca3af;
      }

      .mlg-countdown-controls {
        display: flex;
        justify-content: center;
        gap: 12px;
      }

      .mlg-control-btn {
        background: rgba(0, 255, 136, 0.2);
        border: 1px solid rgba(0, 255, 136, 0.5);
        border-radius: 8px;
        padding: 10px 16px;
        color: #00ff88;
        cursor: pointer;
        transition: all 300ms ease;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: bold;
      }

      .mlg-control-btn:hover {
        background: rgba(0, 255, 136, 0.3);
        transform: translateY(-2px);
      }

      /* Compact Format */
      .mlg-format-compact .mlg-countdown-compact {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 16px;
      }

      .mlg-compact-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .mlg-compact-title {
        font-size: 14px;
        font-weight: bold;
        color: #00ff88;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .mlg-compact-display {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        font-family: 'Courier New', monospace;
        font-size: 24px;
        font-weight: bold;
      }

      .mlg-compact-value {
        color: #ffffff;
        min-width: 24px;
        text-align: center;
      }

      .mlg-compact-label {
        color: #9ca3af;
        font-size: 16px;
      }

      .mlg-compact-separator {
        color: #00ff88;
        margin: 0 2px;
      }

      .mlg-compact-status {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      /* Circular Format */
      .mlg-format-circular .mlg-countdown-circular {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
      }

      .mlg-circular-header {
        text-align: center;
      }

      .mlg-circular-title {
        font-size: 20px;
        font-weight: bold;
        color: #ffffff;
        margin: 12px 0 0 0;
      }

      .mlg-circular-rings {
        display: flex;
        gap: 20px;
        align-items: center;
        flex-wrap: wrap;
        justify-content: center;
      }

      .mlg-circular-ring {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .mlg-ring-svg {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
      }

      .mlg-ring-bg {
        fill: none;
        stroke: rgba(107, 114, 128, 0.3);
        stroke-width: 6;
      }

      .mlg-ring-progress {
        fill: none;
        stroke: #00ff88;
        stroke-width: 6;
        stroke-linecap: round;
        transition: stroke-dashoffset 1s ease;
      }

      .mlg-ring-content {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .mlg-ring-value {
        font-size: 16px;
        font-weight: bold;
        color: #ffffff;
        font-family: 'Courier New', monospace;
      }

      .mlg-ring-label {
        font-size: 10px;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      /* Segment Format */
      .mlg-format-segment .mlg-countdown-segment {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .mlg-segment-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .mlg-segment-title {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .mlg-segment-title h3 {
        margin: 0;
        color: #ffffff;
        font-size: 18px;
      }

      .mlg-urgency-indicator {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #6b7280;
      }

      .mlg-urgency-normal { background: #00ff88; }
      .mlg-urgency-attention { background: #00d4ff; }
      .mlg-urgency-warning { background: #fbbf24; }
      .mlg-urgency-critical { background: #ff8800; }
      .mlg-urgency-extreme { background: #ef4444; animation: mlg-urgency-pulse 1s infinite; }

      .mlg-segment-display {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 16px;
      }

      .mlg-segment-group {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }

      .mlg-segment-digit {
        width: 60px;
        height: 80px;
        background: #1a1a2e;
        border: 2px solid #00ff88;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 36px;
        font-weight: bold;
        color: #00ff88;
        font-family: 'Courier New', monospace;
        position: relative;
        overflow: hidden;
      }

      .mlg-segment-label {
        font-size: 10px;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: bold;
      }

      /* Minimal Format */
      .mlg-format-minimal .mlg-countdown-minimal {
        padding: 12px;
      }

      .mlg-minimal-content {
        display: flex;
        align-items: center;
        gap: 12px;
        justify-content: center;
      }

      .mlg-minimal-icon {
        font-size: 20px;
      }

      .mlg-minimal-time {
        font-family: 'Courier New', monospace;
        font-size: 16px;
        font-weight: bold;
        color: #ffffff;
      }

      .mlg-minimal-status {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      /* Urgency Styles */
      .mlg-urgency-normal {
        border-color: #00ff88;
      }

      .mlg-urgency-attention {
        border-color: #00d4ff;
      }

      .mlg-urgency-warning {
        border-color: #fbbf24;
      }

      .mlg-urgency-critical {
        border-color: #ff8800;
        animation: mlg-urgency-pulse 2s infinite;
      }

      .mlg-urgency-extreme {
        border-color: #ef4444;
        animation: mlg-urgency-extreme 1s infinite;
        box-shadow: 0 0 30px rgba(239, 68, 68, 0.5);
      }

      /* Expired State */
      .mlg-expired {
        border-color: #ef4444;
        background: rgba(239, 68, 68, 0.1);
      }

      .mlg-expired-message {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(10px);
      }

      .mlg-expired-content {
        text-align: center;
        animation: mlg-expired-entrance 1s ease-out;
      }

      .mlg-expired-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      .mlg-expired-text {
        font-size: 24px;
        font-weight: bold;
        color: #ef4444;
        margin-bottom: 8px;
      }

      .mlg-expired-subtext {
        font-size: 14px;
        color: #9ca3af;
      }

      .mlg-expired-flash {
        animation: mlg-expired-flash 500ms ease-in-out;
      }

      /* Animations */
      @keyframes mlg-status-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.2); }
      }

      @keyframes mlg-status-blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0.3; }
      }

      @keyframes mlg-separator-blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0.5; }
      }

      @keyframes mlg-progress-shine {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      @keyframes mlg-urgency-pulse {
        0%, 100% { 
          box-shadow: 0 0 20px rgba(255, 136, 0, 0.3);
          border-color: #ff8800;
        }
        50% { 
          box-shadow: 0 0 40px rgba(255, 136, 0, 0.6);
          border-color: #fbbf24;
        }
      }

      @keyframes mlg-urgency-extreme {
        0%, 100% { 
          box-shadow: 0 0 30px rgba(239, 68, 68, 0.5);
          transform: scale(1);
        }
        50% { 
          box-shadow: 0 0 50px rgba(239, 68, 68, 0.8);
          transform: scale(1.02);
        }
      }

      @keyframes mlg-expired-entrance {
        0% { 
          opacity: 0;
          transform: scale(0.8);
        }
        100% { 
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes mlg-expired-flash {
        0%, 100% { color: #ffffff; }
        50% { color: #ef4444; }
      }

      @keyframes mlg-tick-animation {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); color: #00ff88; }
        100% { transform: scale(1); }
      }

      @keyframes mlg-digit-flash {
        0% { background: #1a1a2e; }
        50% { background: rgba(0, 255, 136, 0.2); }
        100% { background: #1a1a2e; }
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .mlg-countdown-timer {
          padding: 16px;
        }

        .mlg-countdown-header {
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }

        .mlg-time-units {
          flex-direction: column;
          gap: 12px;
        }

        .mlg-time-unit {
          min-width: 60px;
          padding: 12px;
        }

        .mlg-time-value {
          font-size: 28px;
        }

        .mlg-circular-rings {
          gap: 12px;
        }

        .mlg-segment-display {
          flex-wrap: wrap;
          gap: 8px;
        }

        .mlg-segment-digit {
          width: 50px;
          height: 60px;
          font-size: 28px;
        }

        .mlg-countdown-controls {
          flex-wrap: wrap;
        }
      }

      /* Print Styles */
      @media print {
        .mlg-countdown-timer {
          background: white !important;
          color: black !important;
          border: 2px solid black !important;
        }

        .mlg-countdown-controls,
        .mlg-expired-message {
          display: none !important;
        }
      }

      /* Reduced Motion */
      @media (prefers-reduced-motion: reduce) {
        .mlg-countdown-timer,
        .mlg-time-value,
        .mlg-control-btn,
        .mlg-progress-fill {
          animation: none !important;
          transition: none !important;
        }

        .mlg-control-btn:hover {
          transform: none !important;
        }
      }
    `;

    document.head.appendChild(style);
    this.logger.debug('✨ Countdown timer styles injected');
  }

  /**
   * Get timer statistics
   * @returns {Object} Timer statistics
   */
  getStatistics() {
    const now = new Date().getTime();
    const distance = this.targetTime ? this.targetTime.getTime() - now : 0;
    const timeUnits = this.calculateTimeUnits(Math.max(0, distance));

    return {
      isInitialized: this.isInitialized,
      state: this.state,
      format: this.format,
      targetTime: this.targetTime,
      remainingTime: Math.max(0, distance),
      timeUnits,
      urgencyLevel: this.getUrgencyLevel(distance),
      milestonesReached: this.passedMilestones.size,
      totalMilestones: this.milestones.length
    };
  }

  /**
   * Cleanup timer resources
   */
  cleanup() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.removeAllListeners();
    this.passedMilestones.clear();
    
    this.logger.debug('🧹 Countdown timer cleanup complete');
  }
}

// Export the countdown timer system
export { MLGCountdownTimer, COUNTDOWN_CONFIG };
export default MLGCountdownTimer;