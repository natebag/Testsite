/**
 * MLG Live Tournament Status Indicators
 * 
 * Professional live status indicators for tournaments, matches, and events
 * with real-time updates, MLG branding, and dynamic visual effects.
 * Provides comprehensive status tracking with Xbox 360 retro gaming aesthetic.
 * 
 * Features:
 * - Real-time live status indicators
 * - Dynamic status animations and effects
 * - Multiple indicator types and sizes
 * - Professional MLG branding and styling
 * - Customizable status levels and themes
 * - Audio and visual alerts
 * - Status change notifications
 * - Integration with WebSocket updates
 * - Responsive design for all devices
 * - Accessibility features for screen readers
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 * @created 2025-08-13
 * @task Task 21.3 - Create MLG branded event banners and tournament displays
 */

import { EventEmitter } from 'events';
import { MLGBrandingSystem } from './mlg-branding-system.js';

/**
 * Live Status Configuration
 */
const LIVE_STATUS_CONFIG = {
  // Status Types
  STATUS_TYPES: {
    offline: 'offline',
    idle: 'idle',
    scheduled: 'scheduled',
    starting: 'starting',
    live: 'live',
    paused: 'paused',
    intermission: 'intermission',
    ending: 'ending',
    completed: 'completed',
    cancelled: 'cancelled',
    postponed: 'postponed',
    delayed: 'delayed',
    maintenance: 'maintenance',
    error: 'error'
  },
  
  // Priority Levels
  PRIORITY_LEVELS: {
    low: 1,
    normal: 2,
    high: 3,
    critical: 4,
    emergency: 5
  },
  
  // Indicator Styles
  INDICATOR_STYLES: {
    dot: 'dot',
    pill: 'pill',
    badge: 'badge',
    banner: 'banner',
    overlay: 'overlay',
    tooltip: 'tooltip',
    notification: 'notification'
  },
  
  // Indicator Sizes
  SIZES: {
    xs: 'xs',
    sm: 'sm',
    md: 'md',
    lg: 'lg',
    xl: 'xl'
  },
  
  // Status Colors
  COLORS: {
    offline: '#6b7280',
    idle: '#9ca3af',
    scheduled: '#00d4ff',
    starting: '#fbbf24',
    live: '#ef4444',
    paused: '#ff8800',
    intermission: '#8b5cf6',
    ending: '#00ff88',
    completed: '#10b981',
    cancelled: '#dc2626',
    postponed: '#d97706',
    delayed: '#f59e0b',
    maintenance: '#7c3aed',
    error: '#991b1b'
  },
  
  // Animation Settings
  ANIMATIONS: {
    duration: '300ms',
    easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
    pulse: '2s infinite',
    blink: '1s infinite',
    glow: '2s infinite alternate',
    bounce: '0.6s ease-in-out infinite alternate'
  },
  
  // Update Intervals
  INTERVALS: {
    heartbeat: 1000,      // 1 second
    statusCheck: 5000,    // 5 seconds
    refresh: 30000        // 30 seconds
  },
  
  // Audio Settings
  AUDIO: {
    enabled: true,
    volume: 0.7,
    statusChange: true,
    alerts: true
  }
};

/**
 * MLG Live Status Indicators Class
 */
class MLGLiveStatusIndicators extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = { ...LIVE_STATUS_CONFIG, ...options };
    this.brandingSystem = new MLGBrandingSystem();
    this.indicators = new Map();
    this.statusHistory = new Map();
    this.intervals = new Map();
    this.audioContext = null;
    this.isInitialized = false;
    this.logger = options.logger || console;
    
    // Bind methods
    this.createIndicator = this.createIndicator.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
    this.removeIndicator = this.removeIndicator.bind(this);
    this.startHeartbeat = this.startHeartbeat.bind(this);
    this.stopHeartbeat = this.stopHeartbeat.bind(this);
    
    this.logger.info('🚨 MLG Live Status Indicators initialized');
  }

  /**
   * Initialize the live status system
   */
  async initialize() {
    try {
      if (this.isInitialized) return;
      
      this.logger.info('🚀 Initializing MLG Live Status Indicators...');
      
      // Initialize branding system
      await this.brandingSystem.initialize();
      
      // Inject status styles
      await this.injectStatusStyles();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Initialize audio context if enabled
      if (this.config.AUDIO.enabled) {
        this.initializeAudioContext();
      }
      
      // Start global heartbeat
      this.startGlobalHeartbeat();
      
      this.isInitialized = true;
      this.logger.info('✅ MLG Live Status Indicators initialized successfully');
      
      return true;
    } catch (error) {
      this.logger.error('❌ Failed to initialize live status indicators:', error);
      throw error;
    }
  }

  /**
   * Create a live status indicator
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Indicator options
   * @returns {Object} Indicator instance
   */
  createIndicator(container, options = {}) {
    try {
      const {
        id = `indicator-${Date.now()}`,
        style = 'dot',
        size = 'md',
        status = 'offline',
        position = 'top-right',
        showText = true,
        showIcon = true,
        showTime = false,
        updateInterval = this.config.INTERVALS.statusCheck,
        priority = this.config.PRIORITY_LEVELS.normal,
        autoHide = false,
        onClick = null,
        onStatusChange = null
      } = options;

      if (!container) {
        throw new Error('Container element is required');
      }

      // Create indicator element
      const indicatorElement = this.createIndicatorElement(style, size, status, options);
      
      // Position indicator
      this.positionIndicator(container, indicatorElement, position);
      
      // Create indicator instance
      const indicator = {
        id,
        element: indicatorElement,
        container,
        style,
        size,
        status,
        position,
        options,
        priority,
        createdAt: new Date(),
        lastUpdate: new Date(),
        updateCount: 0
      };

      // Store indicator
      this.indicators.set(id, indicator);
      
      // Initialize status history
      this.statusHistory.set(id, [{ status, timestamp: new Date() }]);
      
      // Setup update interval if specified
      if (updateInterval > 0) {
        const interval = setInterval(() => {
          this.checkIndicatorStatus(id);
        }, updateInterval);
        this.intervals.set(id, interval);
      }
      
      // Add event listeners
      this.setupIndicatorEvents(indicator, onClick, onStatusChange);
      
      this.emit('indicator_created', { indicator });
      this.logger.debug(`🎯 Created ${style} status indicator: ${id}`);
      
      return indicator;
    } catch (error) {
      this.logger.error('❌ Error creating status indicator:', error);
      return null;
    }
  }

  /**
   * Create indicator element
   * @param {string} style - Indicator style
   * @param {string} size - Indicator size
   * @param {string} status - Initial status
   * @param {Object} options - Options
   * @returns {HTMLElement} Indicator element
   */
  createIndicatorElement(style, size, status, options) {
    const {
      showText = true,
      showIcon = true,
      showTime = false,
      text = this.getStatusLabel(status),
      icon = this.getStatusIcon(status),
      className = ''
    } = options;

    const element = document.createElement('div');
    element.className = `mlg-status-indicator mlg-style-${style} mlg-size-${size} mlg-status-${status} ${className}`;
    element.setAttribute('data-status', status);
    element.setAttribute('data-style', style);
    element.setAttribute('data-size', size);

    switch (style) {
      case 'dot':
        element.innerHTML = this.createDotIndicator(status, showIcon);
        break;
      case 'pill':
        element.innerHTML = this.createPillIndicator(status, text, showIcon, showText);
        break;
      case 'badge':
        element.innerHTML = this.createBadgeIndicator(status, text, showIcon, showText);
        break;
      case 'banner':
        element.innerHTML = this.createBannerIndicator(status, text, showIcon, showText, showTime);
        break;
      case 'overlay':
        element.innerHTML = this.createOverlayIndicator(status, text, showIcon, showText);
        break;
      case 'tooltip':
        element.innerHTML = this.createTooltipIndicator(status, text, showIcon);
        break;
      case 'notification':
        element.innerHTML = this.createNotificationIndicator(status, text, showIcon, showText);
        break;
      default:
        element.innerHTML = this.createDotIndicator(status, showIcon);
    }

    // Apply styling
    this.applyIndicatorStyling(element, style, size, status);
    
    return element;
  }

  /**
   * Create dot indicator
   * @param {string} status - Status
   * @param {boolean} showIcon - Show icon
   * @returns {string} HTML content
   */
  createDotIndicator(status, showIcon) {
    const icon = showIcon ? this.getStatusIcon(status) : '';
    
    return `
      <div class="mlg-dot-container">
        <div class="mlg-dot-core"></div>
        <div class="mlg-dot-pulse"></div>
        ${icon ? `<div class="mlg-dot-icon">${icon}</div>` : ''}
      </div>
    `;
  }

  /**
   * Create pill indicator
   * @param {string} status - Status
   * @param {string} text - Status text
   * @param {boolean} showIcon - Show icon
   * @param {boolean} showText - Show text
   * @returns {string} HTML content
   */
  createPillIndicator(status, text, showIcon, showText) {
    const icon = showIcon ? this.getStatusIcon(status) : '';
    
    return `
      <div class="mlg-pill-container">
        <div class="mlg-pill-content">
          ${icon ? `<span class="mlg-pill-icon">${icon}</span>` : ''}
          ${showText ? `<span class="mlg-pill-text">${text}</span>` : ''}
        </div>
        <div class="mlg-pill-glow"></div>
      </div>
    `;
  }

  /**
   * Create badge indicator
   * @param {string} status - Status
   * @param {string} text - Status text
   * @param {boolean} showIcon - Show icon
   * @param {boolean} showText - Show text
   * @returns {string} HTML content
   */
  createBadgeIndicator(status, text, showIcon, showText) {
    const icon = showIcon ? this.getStatusIcon(status) : '';
    
    return `
      <div class="mlg-badge-container">
        ${this.brandingSystem.createBrandBadge({ 
          size: 'small', 
          animated: status === 'live' 
        }).outerHTML}
        <div class="mlg-badge-status">
          ${icon ? `<span class="mlg-badge-icon">${icon}</span>` : ''}
          ${showText ? `<span class="mlg-badge-text">${text}</span>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Create banner indicator
   * @param {string} status - Status
   * @param {string} text - Status text
   * @param {boolean} showIcon - Show icon
   * @param {boolean} showText - Show text
   * @param {boolean} showTime - Show time
   * @returns {string} HTML content
   */
  createBannerIndicator(status, text, showIcon, showText, showTime) {
    const icon = showIcon ? this.getStatusIcon(status) : '';
    const time = showTime ? new Date().toLocaleTimeString() : '';
    
    return `
      <div class="mlg-banner-container">
        <div class="mlg-banner-content">
          <div class="mlg-banner-main">
            ${icon ? `<span class="mlg-banner-icon">${icon}</span>` : ''}
            ${showText ? `<span class="mlg-banner-text">${text}</span>` : ''}
          </div>
          ${showTime ? `<div class="mlg-banner-time">${time}</div>` : ''}
        </div>
        <div class="mlg-banner-decoration"></div>
      </div>
    `;
  }

  /**
   * Create overlay indicator
   * @param {string} status - Status
   * @param {string} text - Status text
   * @param {boolean} showIcon - Show icon
   * @param {boolean} showText - Show text
   * @returns {string} HTML content
   */
  createOverlayIndicator(status, text, showIcon, showText) {
    const icon = showIcon ? this.getStatusIcon(status) : '';
    
    return `
      <div class="mlg-overlay-container">
        <div class="mlg-overlay-backdrop"></div>
        <div class="mlg-overlay-content">
          ${icon ? `<div class="mlg-overlay-icon">${icon}</div>` : ''}
          ${showText ? `<div class="mlg-overlay-text">${text}</div>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Create tooltip indicator
   * @param {string} status - Status
   * @param {string} text - Status text
   * @param {boolean} showIcon - Show icon
   * @returns {string} HTML content
   */
  createTooltipIndicator(status, text, showIcon) {
    const icon = showIcon ? this.getStatusIcon(status) : '';
    
    return `
      <div class="mlg-tooltip-container">
        <div class="mlg-tooltip-trigger">
          ${icon ? `<span class="mlg-tooltip-icon">${icon}</span>` : '⚡'}
        </div>
        <div class="mlg-tooltip-content">
          <div class="mlg-tooltip-text">${text}</div>
          <div class="mlg-tooltip-arrow"></div>
        </div>
      </div>
    `;
  }

  /**
   * Create notification indicator
   * @param {string} status - Status
   * @param {string} text - Status text
   * @param {boolean} showIcon - Show icon
   * @param {boolean} showText - Show text
   * @returns {string} HTML content
   */
  createNotificationIndicator(status, text, showIcon, showText) {
    const icon = showIcon ? this.getStatusIcon(status) : '';
    
    return `
      <div class="mlg-notification-container">
        <div class="mlg-notification-content">
          ${icon ? `<div class="mlg-notification-icon">${icon}</div>` : ''}
          <div class="mlg-notification-body">
            ${showText ? `<div class="mlg-notification-text">${text}</div>` : ''}
            <div class="mlg-notification-time">${new Date().toLocaleTimeString()}</div>
          </div>
        </div>
        <button class="mlg-notification-close">×</button>
      </div>
    `;
  }

  /**
   * Position indicator within container
   * @param {HTMLElement} container - Container element
   * @param {HTMLElement} indicator - Indicator element
   * @param {string} position - Position
   */
  positionIndicator(container, indicator, position) {
    container.style.position = 'relative';
    indicator.style.position = 'absolute';
    indicator.style.zIndex = '1000';
    
    const positions = {
      'top-left': { top: '8px', left: '8px' },
      'top-right': { top: '8px', right: '8px' },
      'top-center': { top: '8px', left: '50%', transform: 'translateX(-50%)' },
      'bottom-left': { bottom: '8px', left: '8px' },
      'bottom-right': { bottom: '8px', right: '8px' },
      'bottom-center': { bottom: '8px', left: '50%', transform: 'translateX(-50%)' },
      'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
      'center-left': { top: '50%', left: '8px', transform: 'translateY(-50%)' },
      'center-right': { top: '50%', right: '8px', transform: 'translateY(-50%)' }
    };
    
    const pos = positions[position] || positions['top-right'];
    Object.assign(indicator.style, pos);
    
    container.appendChild(indicator);
  }

  /**
   * Update indicator status
   * @param {string} indicatorId - Indicator ID
   * @param {string} newStatus - New status
   * @param {Object} options - Update options
   */
  updateStatus(indicatorId, newStatus, options = {}) {
    try {
      const indicator = this.indicators.get(indicatorId);
      if (!indicator) {
        this.logger.warn(`❓ Indicator not found: ${indicatorId}`);
        return;
      }

      const oldStatus = indicator.status;
      if (oldStatus === newStatus) return;

      // Update indicator data
      indicator.status = newStatus;
      indicator.lastUpdate = new Date();
      indicator.updateCount++;

      // Update status history
      const history = this.statusHistory.get(indicatorId) || [];
      history.push({ status: newStatus, timestamp: new Date() });
      if (history.length > 50) history.shift(); // Keep last 50 entries
      this.statusHistory.set(indicatorId, history);

      // Update visual state
      this.updateIndicatorVisual(indicator, newStatus, oldStatus);

      // Play status change sound
      if (this.config.AUDIO.statusChange) {
        this.playStatusChangeSound(newStatus, oldStatus);
      }

      // Emit events
      this.emit('status_changed', { 
        indicatorId, 
        oldStatus, 
        newStatus, 
        indicator,
        options 
      });

      // Call custom callback if provided
      if (indicator.options.onStatusChange) {
        indicator.options.onStatusChange(newStatus, oldStatus, indicator);
      }

      this.logger.debug(`🔄 Updated status: ${indicatorId} (${oldStatus} → ${newStatus})`);
    } catch (error) {
      this.logger.error('❌ Error updating status:', error);
    }
  }

  /**
   * Update indicator visual representation
   * @param {Object} indicator - Indicator instance
   * @param {string} newStatus - New status
   * @param {string} oldStatus - Old status
   */
  updateIndicatorVisual(indicator, newStatus, oldStatus) {
    const { element, style, size } = indicator;
    
    // Update status class
    element.className = element.className.replace(/mlg-status-\w+/, `mlg-status-${newStatus}`);
    element.setAttribute('data-status', newStatus);
    
    // Update content based on style
    const text = this.getStatusLabel(newStatus);
    const icon = this.getStatusIcon(newStatus);
    
    // Update text content
    const textElement = element.querySelector('.mlg-pill-text, .mlg-badge-text, .mlg-banner-text, .mlg-overlay-text, .mlg-tooltip-text, .mlg-notification-text');
    if (textElement) {
      textElement.textContent = text;
    }
    
    // Update icon content
    const iconElement = element.querySelector('.mlg-dot-icon, .mlg-pill-icon, .mlg-badge-icon, .mlg-banner-icon, .mlg-overlay-icon, .mlg-tooltip-icon, .mlg-notification-icon');
    if (iconElement) {
      iconElement.textContent = icon;
    }
    
    // Update time if applicable
    const timeElement = element.querySelector('.mlg-banner-time, .mlg-notification-time');
    if (timeElement) {
      timeElement.textContent = new Date().toLocaleTimeString();
    }
    
    // Apply new styling
    this.applyIndicatorStyling(element, style, size, newStatus);
    
    // Add transition effect
    element.classList.add('mlg-status-transition');
    setTimeout(() => {
      element.classList.remove('mlg-status-transition');
    }, 300);
  }

  /**
   * Remove indicator
   * @param {string} indicatorId - Indicator ID
   */
  removeIndicator(indicatorId) {
    try {
      const indicator = this.indicators.get(indicatorId);
      if (!indicator) {
        this.logger.warn(`❓ Indicator not found: ${indicatorId}`);
        return;
      }

      // Clear interval if exists
      const interval = this.intervals.get(indicatorId);
      if (interval) {
        clearInterval(interval);
        this.intervals.delete(indicatorId);
      }

      // Remove element from DOM
      if (indicator.element && indicator.element.parentNode) {
        indicator.element.remove();
      }

      // Clear from collections
      this.indicators.delete(indicatorId);
      this.statusHistory.delete(indicatorId);

      this.emit('indicator_removed', { indicatorId, indicator });
      this.logger.debug(`🗑️ Removed indicator: ${indicatorId}`);
    } catch (error) {
      this.logger.error('❌ Error removing indicator:', error);
    }
  }

  /**
   * Get status label
   * @param {string} status - Status
   * @returns {string} Status label
   */
  getStatusLabel(status) {
    const labels = {
      offline: 'Offline',
      idle: 'Idle',
      scheduled: 'Scheduled',
      starting: 'Starting',
      live: 'LIVE',
      paused: 'Paused',
      intermission: 'Intermission',
      ending: 'Ending',
      completed: 'Completed',
      cancelled: 'Cancelled',
      postponed: 'Postponed',
      delayed: 'Delayed',
      maintenance: 'Maintenance',
      error: 'Error'
    };
    return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
  }

  /**
   * Get status icon
   * @param {string} status - Status
   * @returns {string} Status icon
   */
  getStatusIcon(status) {
    const icons = {
      offline: '⚫',
      idle: '⚪',
      scheduled: '📅',
      starting: '🟡',
      live: '🔴',
      paused: '⏸️',
      intermission: '⏳',
      ending: '🟠',
      completed: '✅',
      cancelled: '❌',
      postponed: '⏰',
      delayed: '⚠️',
      maintenance: '🔧',
      error: '❗'
    };
    return icons[status] || '⚡';
  }

  /**
   * Apply indicator styling
   * @param {HTMLElement} element - Indicator element
   * @param {string} style - Style type
   * @param {string} size - Size
   * @param {string} status - Status
   */
  applyIndicatorStyling(element, style, size, status) {
    const color = this.config.COLORS[status] || this.config.COLORS.offline;
    
    // Base styling
    element.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    element.style.transition = `all ${this.config.ANIMATIONS.duration} ${this.config.ANIMATIONS.easing}`;
    
    // Apply status-specific animations
    if (status === 'live') {
      element.style.animation = this.config.ANIMATIONS.pulse;
    } else if (status === 'starting') {
      element.style.animation = this.config.ANIMATIONS.blink;
    } else if (status === 'error') {
      element.style.animation = this.config.ANIMATIONS.bounce;
    } else {
      element.style.animation = 'none';
    }
    
    // Apply style-specific styling
    switch (style) {
      case 'dot':
        this.applyDotStyling(element, size, color);
        break;
      case 'pill':
        this.applyPillStyling(element, size, color);
        break;
      case 'badge':
        this.applyBadgeStyling(element, size, color);
        break;
      case 'banner':
        this.applyBannerStyling(element, size, color);
        break;
      case 'overlay':
        this.applyOverlayStyling(element, size, color);
        break;
      case 'tooltip':
        this.applyTooltipStyling(element, size, color);
        break;
      case 'notification':
        this.applyNotificationStyling(element, size, color);
        break;
    }
  }

  /**
   * Apply dot styling
   * @param {HTMLElement} element - Element
   * @param {string} size - Size
   * @param {string} color - Color
   */
  applyDotStyling(element, size, color) {
    const sizes = {
      xs: { width: '8px', height: '8px' },
      sm: { width: '12px', height: '12px' },
      md: { width: '16px', height: '16px' },
      lg: { width: '20px', height: '20px' },
      xl: { width: '24px', height: '24px' }
    };
    
    const sizeStyle = sizes[size] || sizes.md;
    Object.assign(element.style, sizeStyle);
    
    const core = element.querySelector('.mlg-dot-core');
    if (core) {
      core.style.cssText = `
        width: 100%;
        height: 100%;
        background: ${color};
        border-radius: 50%;
        box-shadow: 0 0 8px ${color}40;
      `;
    }
  }

  /**
   * Apply pill styling
   * @param {HTMLElement} element - Element
   * @param {string} size - Size
   * @param {string} color - Color
   */
  applyPillStyling(element, size, color) {
    const sizes = {
      xs: { padding: '2px 6px', fontSize: '10px' },
      sm: { padding: '4px 8px', fontSize: '12px' },
      md: { padding: '6px 12px', fontSize: '14px' },
      lg: { padding: '8px 16px', fontSize: '16px' },
      xl: { padding: '10px 20px', fontSize: '18px' }
    };
    
    const sizeStyle = sizes[size] || sizes.md;
    
    element.style.cssText = `
      background: ${color}20;
      border: 1px solid ${color};
      border-radius: 12px;
      padding: ${sizeStyle.padding};
      font-size: ${sizeStyle.fontSize};
      color: #ffffff;
      font-weight: bold;
      backdrop-filter: blur(10px);
    `;
  }

  /**
   * Apply badge styling
   * @param {HTMLElement} element - Element
   * @param {string} size - Size
   * @param {string} color - Color
   */
  applyBadgeStyling(element, size, color) {
    element.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      background: ${color}20;
      border: 1px solid ${color};
      border-radius: 8px;
      padding: 8px 12px;
      color: #ffffff;
      font-weight: bold;
      backdrop-filter: blur(10px);
    `;
  }

  /**
   * Apply banner styling
   * @param {HTMLElement} element - Element
   * @param {string} size - Size
   * @param {string} color - Color
   */
  applyBannerStyling(element, size, color) {
    element.style.cssText = `
      background: linear-gradient(135deg, ${color}20 0%, ${color}10 100%);
      border: 2px solid ${color};
      border-radius: 8px;
      padding: 12px 16px;
      color: #ffffff;
      font-weight: bold;
      backdrop-filter: blur(10px);
      position: relative;
      overflow: hidden;
    `;
  }

  /**
   * Apply overlay styling
   * @param {HTMLElement} element - Element
   * @param {string} size - Size
   * @param {string} color - Color
   */
  applyOverlayStyling(element, size, color) {
    element.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    const backdrop = element.querySelector('.mlg-overlay-backdrop');
    if (backdrop) {
      backdrop.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
      `;
    }
    
    const content = element.querySelector('.mlg-overlay-content');
    if (content) {
      content.style.cssText = `
        background: ${color}20;
        border: 2px solid ${color};
        border-radius: 16px;
        padding: 32px;
        text-align: center;
        color: #ffffff;
        font-size: 24px;
        font-weight: bold;
        z-index: 1;
      `;
    }
  }

  /**
   * Apply tooltip styling
   * @param {HTMLElement} element - Element
   * @param {string} size - Size
   * @param {string} color - Color
   */
  applyTooltipStyling(element, size, color) {
    element.style.position = 'relative';
    element.style.display = 'inline-block';
    
    const trigger = element.querySelector('.mlg-tooltip-trigger');
    if (trigger) {
      trigger.style.cssText = `
        cursor: help;
        color: ${color};
        font-size: 16px;
      `;
    }
    
    const content = element.querySelector('.mlg-tooltip-content');
    if (content) {
      content.style.cssText = `
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: ${color};
        color: #ffffff;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        white-space: nowrap;
        opacity: 0;
        visibility: hidden;
        transition: all 300ms ease;
        z-index: 1000;
        margin-bottom: 8px;
      `;
    }
  }

  /**
   * Apply notification styling
   * @param {HTMLElement} element - Element
   * @param {string} size - Size
   * @param {string} color - Color
   */
  applyNotificationStyling(element, size, color) {
    element.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(26, 26, 46, 0.95);
      border: 2px solid ${color};
      border-radius: 12px;
      padding: 16px;
      color: #ffffff;
      min-width: 300px;
      max-width: 400px;
      z-index: 10000;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `;
  }

  /**
   * Check indicator status
   * @param {string} indicatorId - Indicator ID
   */
  checkIndicatorStatus(indicatorId) {
    // This would typically make an API call to check status
    // For now, it's a placeholder for status checking logic
    this.emit('status_check_requested', { indicatorId });
  }

  /**
   * Start global heartbeat
   */
  startGlobalHeartbeat() {
    const heartbeatInterval = setInterval(() => {
      this.emit('heartbeat', { 
        timestamp: new Date(),
        activeIndicators: this.indicators.size,
        totalUpdates: Array.from(this.indicators.values()).reduce((sum, ind) => sum + ind.updateCount, 0)
      });
    }, this.config.INTERVALS.heartbeat);
    
    this.intervals.set('global-heartbeat', heartbeatInterval);
  }

  /**
   * Setup indicator events
   * @param {Object} indicator - Indicator instance
   * @param {Function} onClick - Click handler
   * @param {Function} onStatusChange - Status change handler
   */
  setupIndicatorEvents(indicator, onClick, onStatusChange) {
    const { element } = indicator;
    
    // Click handler
    if (onClick) {
      element.addEventListener('click', (event) => {
        onClick(indicator, event);
      });
      element.style.cursor = 'pointer';
    }
    
    // Tooltip hover effects
    if (indicator.style === 'tooltip') {
      const content = element.querySelector('.mlg-tooltip-content');
      if (content) {
        element.addEventListener('mouseenter', () => {
          content.style.opacity = '1';
          content.style.visibility = 'visible';
        });
        
        element.addEventListener('mouseleave', () => {
          content.style.opacity = '0';
          content.style.visibility = 'hidden';
        });
      }
    }
    
    // Notification close button
    if (indicator.style === 'notification') {
      const closeBtn = element.querySelector('.mlg-notification-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.removeIndicator(indicator.id);
        });
      }
    }
  }

  /**
   * Play status change sound
   * @param {string} newStatus - New status
   * @param {string} oldStatus - Old status
   */
  playStatusChangeSound(newStatus, oldStatus) {
    if (!this.audioContext) return;
    
    // This would play different sounds based on status changes
    this.logger.debug(`🔊 Playing sound for status change: ${oldStatus} → ${newStatus}`);
  }

  /**
   * Initialize audio context
   */
  initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.logger.debug('🔊 Audio context initialized');
    } catch (error) {
      this.logger.warn('⚠️ Audio context not available:', error);
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.emit('page_hidden');
      } else {
        this.emit('page_visible');
        // Refresh all indicators when page becomes visible
        this.refreshAllIndicators();
      }
    });

    this.logger.debug('🎧 Status indicator event listeners setup complete');
  }

  /**
   * Refresh all indicators
   */
  refreshAllIndicators() {
    this.indicators.forEach((indicator, id) => {
      this.checkIndicatorStatus(id);
    });
  }

  /**
   * Inject status styles
   */
  async injectStatusStyles() {
    const styleId = 'mlg-live-status-styles';
    
    const existingStyles = document.getElementById(styleId);
    if (existingStyles) {
      existingStyles.remove();
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* MLG Live Status Indicators Styles */
      
      .mlg-status-indicator {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        transition: all 300ms cubic-bezier(0.4, 0, 0.6, 1);
        user-select: none;
      }

      /* Dot Indicators */
      .mlg-style-dot {
        display: inline-block;
        position: relative;
      }

      .mlg-dot-container {
        position: relative;
        width: 100%;
        height: 100%;
      }

      .mlg-dot-core {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        position: relative;
        z-index: 2;
      }

      .mlg-dot-pulse {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: inherit;
        opacity: 0.5;
        animation: mlg-dot-pulse 2s infinite;
        z-index: 1;
      }

      .mlg-dot-icon {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 8px;
        z-index: 3;
      }

      /* Pill Indicators */
      .mlg-style-pill {
        display: inline-flex;
        align-items: center;
        border-radius: 12px;
        backdrop-filter: blur(10px);
        position: relative;
        overflow: hidden;
      }

      .mlg-pill-container {
        position: relative;
        width: 100%;
        height: 100%;
      }

      .mlg-pill-content {
        display: flex;
        align-items: center;
        gap: 6px;
        position: relative;
        z-index: 2;
      }

      .mlg-pill-icon {
        font-size: 12px;
      }

      .mlg-pill-text {
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-size: inherit;
      }

      .mlg-pill-glow {
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: inherit;
        border-radius: 14px;
        opacity: 0.3;
        z-index: 1;
        animation: mlg-pill-glow 2s infinite alternate;
      }

      /* Badge Indicators */
      .mlg-style-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 8px;
        backdrop-filter: blur(10px);
      }

      .mlg-badge-container {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .mlg-badge-status {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .mlg-badge-icon {
        font-size: 14px;
      }

      .mlg-badge-text {
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      /* Banner Indicators */
      .mlg-style-banner {
        display: block;
        border-radius: 8px;
        backdrop-filter: blur(10px);
        position: relative;
        overflow: hidden;
      }

      .mlg-banner-container {
        position: relative;
        width: 100%;
        height: 100%;
      }

      .mlg-banner-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
        z-index: 2;
      }

      .mlg-banner-main {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .mlg-banner-icon {
        font-size: 16px;
      }

      .mlg-banner-text {
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .mlg-banner-time {
        font-size: 12px;
        opacity: 0.8;
        font-family: 'Courier New', monospace;
      }

      .mlg-banner-decoration {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, transparent 40%, rgba(255, 255, 255, 0.1) 50%, transparent 60%);
        animation: mlg-banner-shine 3s infinite;
        z-index: 1;
      }

      /* Overlay Indicators */
      .mlg-style-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .mlg-overlay-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
      }

      .mlg-overlay-content {
        position: relative;
        z-index: 1;
        text-align: center;
        animation: mlg-overlay-entrance 500ms ease-out;
      }

      .mlg-overlay-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      .mlg-overlay-text {
        font-size: 24px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 2px;
      }

      /* Tooltip Indicators */
      .mlg-style-tooltip {
        position: relative;
        display: inline-block;
      }

      .mlg-tooltip-trigger {
        cursor: help;
        font-size: 16px;
      }

      .mlg-tooltip-content {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        margin-bottom: 8px;
        opacity: 0;
        visibility: hidden;
        transition: all 300ms ease;
        z-index: 1000;
      }

      .mlg-tooltip-text {
        background: rgba(26, 26, 46, 0.95);
        color: #ffffff;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        white-space: nowrap;
        backdrop-filter: blur(10px);
      }

      .mlg-tooltip-arrow {
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 4px solid rgba(26, 26, 46, 0.95);
      }

      /* Notification Indicators */
      .mlg-style-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        animation: mlg-notification-entrance 500ms ease-out;
      }

      .mlg-notification-container {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }

      .mlg-notification-content {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        flex: 1;
      }

      .mlg-notification-icon {
        font-size: 20px;
        margin-top: 2px;
      }

      .mlg-notification-body {
        flex: 1;
      }

      .mlg-notification-text {
        font-weight: bold;
        margin-bottom: 4px;
      }

      .mlg-notification-time {
        font-size: 12px;
        opacity: 0.7;
        font-family: 'Courier New', monospace;
      }

      .mlg-notification-close {
        background: none;
        border: none;
        color: #ffffff;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 300ms ease;
      }

      .mlg-notification-close:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      /* Status-specific styles */
      .mlg-status-live {
        animation: mlg-live-pulse 2s infinite;
      }

      .mlg-status-starting {
        animation: mlg-starting-blink 1s infinite;
      }

      .mlg-status-error {
        animation: mlg-error-bounce 0.6s ease-in-out infinite alternate;
      }

      /* Transition effects */
      .mlg-status-transition {
        transform: scale(1.1);
        filter: brightness(1.2);
      }

      /* Size variations */
      .mlg-size-xs { font-size: 10px; }
      .mlg-size-sm { font-size: 12px; }
      .mlg-size-md { font-size: 14px; }
      .mlg-size-lg { font-size: 16px; }
      .mlg-size-xl { font-size: 18px; }

      /* Animations */
      @keyframes mlg-dot-pulse {
        0% { transform: scale(1); opacity: 0.5; }
        100% { transform: scale(1.5); opacity: 0; }
      }

      @keyframes mlg-pill-glow {
        0% { box-shadow: 0 0 10px currentColor; }
        100% { box-shadow: 0 0 20px currentColor, 0 0 30px currentColor; }
      }

      @keyframes mlg-banner-shine {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      @keyframes mlg-overlay-entrance {
        0% { opacity: 0; transform: scale(0.8); }
        100% { opacity: 1; transform: scale(1); }
      }

      @keyframes mlg-notification-entrance {
        0% { 
          opacity: 0; 
          transform: translateX(100%); 
        }
        100% { 
          opacity: 1; 
          transform: translateX(0); 
        }
      }

      @keyframes mlg-live-pulse {
        0%, 100% { 
          box-shadow: 0 0 10px currentColor; 
          opacity: 1; 
        }
        50% { 
          box-shadow: 0 0 20px currentColor, 0 0 30px currentColor; 
          opacity: 0.8; 
        }
      }

      @keyframes mlg-starting-blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0.5; }
      }

      @keyframes mlg-error-bounce {
        0% { transform: translateY(0); }
        100% { transform: translateY(-4px); }
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .mlg-style-notification {
          top: 10px;
          right: 10px;
          left: 10px;
        }

        .mlg-notification-container {
          min-width: auto;
        }

        .mlg-style-banner {
          padding: 8px 12px;
        }

        .mlg-banner-content {
          flex-direction: column;
          gap: 8px;
          align-items: flex-start;
        }
      }

      /* High Contrast Mode */
      @media (prefers-contrast: high) {
        .mlg-status-indicator {
          border-width: 2px !important;
          font-weight: bold !important;
        }
      }

      /* Reduced Motion */
      @media (prefers-reduced-motion: reduce) {
        .mlg-status-indicator,
        .mlg-dot-pulse,
        .mlg-pill-glow,
        .mlg-banner-decoration {
          animation: none !important;
        }
      }

      /* Print Styles */
      @media print {
        .mlg-style-overlay,
        .mlg-style-notification {
          display: none !important;
        }

        .mlg-status-indicator {
          color: black !important;
          background: white !important;
          border: 1px solid black !important;
        }
      }
    `;

    document.head.appendChild(style);
    this.logger.debug('✨ Live status indicator styles injected');
  }

  /**
   * Get system statistics
   * @returns {Object} System statistics
   */
  getStatistics() {
    const statusCounts = {};
    this.indicators.forEach(indicator => {
      statusCounts[indicator.status] = (statusCounts[indicator.status] || 0) + 1;
    });

    return {
      isInitialized: this.isInitialized,
      totalIndicators: this.indicators.size,
      activeIntervals: this.intervals.size,
      statusCounts,
      audioEnabled: !!this.audioContext,
      totalStatusChanges: Array.from(this.statusHistory.values()).reduce((sum, history) => sum + history.length, 0)
    };
  }

  /**
   * Cleanup system resources
   */
  cleanup() {
    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();

    // Remove all indicators
    this.indicators.forEach((indicator, id) => {
      this.removeIndicator(id);
    });

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Clear collections
    this.indicators.clear();
    this.statusHistory.clear();

    // Remove event listeners
    this.removeAllListeners();

    this.logger.debug('🧹 Live status indicators cleanup complete');
  }
}

// Export the live status system
export { MLGLiveStatusIndicators, LIVE_STATUS_CONFIG };
export default MLGLiveStatusIndicators;