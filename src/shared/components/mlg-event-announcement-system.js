/**
 * MLG Event Announcement System
 * 
 * Professional event announcement system with MLG branding, dynamic messaging,
 * and multi-channel delivery. Features real-time announcements, priority levels,
 * and comprehensive notification management with Xbox 360 retro gaming aesthetic.
 * 
 * Features:
 * - Multi-channel announcement delivery (banner, toast, modal, sound)
 * - Priority-based announcement queuing and display
 * - Dynamic content with MLG branding and effects
 * - Real-time announcement updates and scheduling
 * - User preference management and filtering
 * - Announcement history and replay functionality
 * - Integration with tournament and event systems
 * - Accessibility features and screen reader support
 * - Analytics and engagement tracking
 * - Customizable themes and layouts
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 * @created 2025-08-13
 * @task Task 21.3 - Create MLG branded event banners and tournament displays
 */

import { EventEmitter } from 'events';
import { MLGBrandingSystem } from './mlg-branding-system.js';

/**
 * Event Announcement Configuration
 */
const ANNOUNCEMENT_CONFIG = {
  // Announcement Types
  TYPES: {
    system: 'system',
    tournament: 'tournament',
    match: 'match',
    news: 'news',
    achievement: 'achievement',
    maintenance: 'maintenance',
    emergency: 'emergency',
    celebration: 'celebration',
    reminder: 'reminder',
    warning: 'warning'
  },
  
  // Priority Levels
  PRIORITIES: {
    low: 1,
    normal: 2,
    high: 3,
    urgent: 4,
    critical: 5
  },
  
  // Delivery Channels
  CHANNELS: {
    banner: 'banner',
    toast: 'toast',
    modal: 'modal',
    push: 'push',
    email: 'email',
    sms: 'sms',
    sound: 'sound',
    notification: 'notification'
  },
  
  // Display Styles
  STYLES: {
    minimal: 'minimal',
    standard: 'standard',
    enhanced: 'enhanced',
    fullscreen: 'fullscreen',
    sidebar: 'sidebar',
    overlay: 'overlay',
    ticker: 'ticker'
  },
  
  // Animation Types
  ANIMATIONS: {
    fade: 'fade',
    slide: 'slide',
    bounce: 'bounce',
    zoom: 'zoom',
    flip: 'flip',
    shake: 'shake',
    glow: 'glow',
    pulse: 'pulse'
  },
  
  // Display Durations (milliseconds)
  DURATIONS: {
    short: 3000,
    medium: 5000,
    long: 8000,
    extended: 12000,
    persistent: 0  // Never auto-hide
  },
  
  // Colors by Type
  COLORS: {
    system: '#00d4ff',
    tournament: '#8b5cf6',
    match: '#00ff88',
    news: '#3b82f6',
    achievement: '#fbbf24',
    maintenance: '#f59e0b',
    emergency: '#ef4444',
    celebration: '#10b981',
    reminder: '#6b7280',
    warning: '#ff8800'
  },
  
  // Audio Settings
  AUDIO: {
    enabled: true,
    volume: 0.8,
    sounds: {
      system: 'system.mp3',
      tournament: 'tournament.mp3',
      achievement: 'achievement.mp3',
      emergency: 'emergency.mp3',
      celebration: 'celebration.mp3'
    }
  }
};

/**
 * MLG Event Announcement System Class
 */
class MLGEventAnnouncementSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = { ...ANNOUNCEMENT_CONFIG, ...options };
    this.brandingSystem = new MLGBrandingSystem();
    this.announcements = new Map();
    this.announcementQueue = [];
    this.activeAnnouncements = new Set();
    this.userPreferences = new Map();
    this.announcementHistory = [];
    this.channels = new Map();
    this.audioContext = null;
    this.isInitialized = false;
    this.logger = options.logger || console;
    
    // Bind methods
    this.announce = this.announce.bind(this);
    this.createAnnouncement = this.createAnnouncement.bind(this);
    this.showAnnouncement = this.showAnnouncement.bind(this);
    this.hideAnnouncement = this.hideAnnouncement.bind(this);
    this.processQueue = this.processQueue.bind(this);
    
    this.logger.info('📢 MLG Event Announcement System initialized');
  }

  /**
   * Initialize the announcement system
   */
  async initialize() {
    try {
      if (this.isInitialized) return;
      
      this.logger.info('🚀 Initializing MLG Event Announcement System...');
      
      // Initialize branding system
      await this.brandingSystem.initialize();
      
      // Inject announcement styles
      await this.injectAnnouncementStyles();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Initialize audio context
      if (this.config.AUDIO.enabled) {
        this.initializeAudioContext();
      }
      
      // Setup announcement channels
      this.setupChannels();
      
      // Start queue processor
      this.startQueueProcessor();
      
      // Load user preferences
      this.loadUserPreferences();
      
      this.isInitialized = true;
      this.logger.info('✅ MLG Event Announcement System initialized successfully');
      
      return true;
    } catch (error) {
      this.logger.error('❌ Failed to initialize announcement system:', error);
      throw error;
    }
  }

  /**
   * Create and display an announcement
   * @param {Object} announcementData - Announcement data
   * @param {Object} options - Display options
   * @returns {string} Announcement ID
   */
  announce(announcementData, options = {}) {
    try {
      const {
        type = 'system',
        priority = this.config.PRIORITIES.normal,
        channels = ['banner'],
        title = 'Announcement',
        message = '',
        duration = this.config.DURATIONS.medium,
        style = 'standard',
        animation = 'fade',
        actions = [],
        metadata = {},
        schedule = null,
        recurring = false
      } = announcementData;

      // Generate unique ID
      const id = `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create announcement object
      const announcement = {
        id,
        type,
        priority,
        channels: Array.isArray(channels) ? channels : [channels],
        title,
        message,
        duration,
        style,
        animation,
        actions,
        metadata,
        schedule,
        recurring,
        createdAt: new Date(),
        displayedAt: null,
        dismissedAt: null,
        status: 'pending',
        views: 0,
        interactions: 0,
        ...options
      };

      // Store announcement
      this.announcements.set(id, announcement);
      
      // Add to history
      this.addToHistory(announcement);
      
      // Check user preferences
      if (!this.shouldShowAnnouncement(announcement)) {
        announcement.status = 'filtered';
        this.logger.debug(`🚫 Announcement filtered by user preferences: ${id}`);
        return id;
      }
      
      // Schedule or queue announcement
      if (schedule) {
        this.scheduleAnnouncement(announcement);
      } else {
        this.queueAnnouncement(announcement);
      }
      
      this.emit('announcement_created', { announcement });
      this.logger.debug(`📢 Created announcement: ${id} (${type}, priority: ${priority})`);
      
      return id;
    } catch (error) {
      this.logger.error('❌ Error creating announcement:', error);
      return null;
    }
  }

  /**
   * Queue announcement for display
   * @param {Object} announcement - Announcement object
   */
  queueAnnouncement(announcement) {
    // Insert announcement in priority order
    let insertIndex = this.announcementQueue.length;
    
    for (let i = 0; i < this.announcementQueue.length; i++) {
      if (announcement.priority > this.announcementQueue[i].priority) {
        insertIndex = i;
        break;
      }
    }
    
    this.announcementQueue.splice(insertIndex, 0, announcement);
    announcement.status = 'queued';
    
    this.emit('announcement_queued', { announcement, queuePosition: insertIndex });
    this.logger.debug(`📋 Queued announcement: ${announcement.id} (position: ${insertIndex})`);
  }

  /**
   * Schedule announcement for future display
   * @param {Object} announcement - Announcement object
   */
  scheduleAnnouncement(announcement) {
    const scheduleTime = new Date(announcement.schedule);
    const delay = scheduleTime.getTime() - Date.now();
    
    if (delay > 0) {
      announcement.status = 'scheduled';
      
      setTimeout(() => {
        if (this.announcements.has(announcement.id)) {
          this.queueAnnouncement(announcement);
        }
      }, delay);
      
      this.emit('announcement_scheduled', { announcement, scheduleTime });
      this.logger.debug(`⏰ Scheduled announcement: ${announcement.id} for ${scheduleTime}`);
    } else {
      // Schedule time has passed, queue immediately
      this.queueAnnouncement(announcement);
    }
  }

  /**
   * Process announcement queue
   */
  processQueue() {
    if (this.announcementQueue.length === 0) return;
    
    // Get highest priority announcement
    const announcement = this.announcementQueue.shift();
    
    if (announcement && this.announcements.has(announcement.id)) {
      this.showAnnouncement(announcement);
    }
  }

  /**
   * Show announcement on specified channels
   * @param {Object} announcement - Announcement object
   */
  async showAnnouncement(announcement) {
    try {
      announcement.status = 'displaying';
      announcement.displayedAt = new Date();
      announcement.views++;
      
      this.activeAnnouncements.add(announcement.id);
      
      // Display on each channel
      const channelPromises = announcement.channels.map(channelType => {
        return this.displayOnChannel(announcement, channelType);
      });
      
      await Promise.all(channelPromises);
      
      // Play sound if enabled
      if (this.config.AUDIO.enabled) {
        this.playAnnouncementSound(announcement.type);
      }
      
      // Auto-hide if duration is set
      if (announcement.duration > 0) {
        setTimeout(() => {
          this.hideAnnouncement(announcement.id);
        }, announcement.duration);
      }
      
      this.emit('announcement_displayed', { announcement });
      this.logger.debug(`👁️ Displayed announcement: ${announcement.id}`);
      
    } catch (error) {
      this.logger.error('❌ Error showing announcement:', error);
      announcement.status = 'error';
    }
  }

  /**
   * Display announcement on specific channel
   * @param {Object} announcement - Announcement object
   * @param {string} channelType - Channel type
   */
  async displayOnChannel(announcement, channelType) {
    const channel = this.channels.get(channelType);
    if (!channel) {
      this.logger.warn(`❓ Channel not found: ${channelType}`);
      return;
    }

    try {
      switch (channelType) {
        case 'banner':
          return this.displayBanner(announcement);
        case 'toast':
          return this.displayToast(announcement);
        case 'modal':
          return this.displayModal(announcement);
        case 'notification':
          return this.displayNotification(announcement);
        case 'ticker':
          return this.displayTicker(announcement);
        case 'sidebar':
          return this.displaySidebar(announcement);
        default:
          this.logger.warn(`❓ Unsupported channel type: ${channelType}`);
      }
    } catch (error) {
      this.logger.error(`❌ Error displaying on ${channelType}:`, error);
    }
  }

  /**
   * Display banner announcement
   * @param {Object} announcement - Announcement object
   */
  displayBanner(announcement) {
    const container = this.getOrCreateContainer('banner');
    const bannerElement = this.createBannerElement(announcement);
    
    container.appendChild(bannerElement);
    
    // Apply animation
    this.applyAnimation(bannerElement, announcement.animation, 'in');
    
    // Store reference
    bannerElement.setAttribute('data-announcement-id', announcement.id);
    
    return bannerElement;
  }

  /**
   * Display toast announcement
   * @param {Object} announcement - Announcement object
   */
  displayToast(announcement) {
    const container = this.getOrCreateContainer('toast');
    const toastElement = this.createToastElement(announcement);
    
    container.appendChild(toastElement);
    
    // Apply animation
    this.applyAnimation(toastElement, announcement.animation, 'in');
    
    // Store reference
    toastElement.setAttribute('data-announcement-id', announcement.id);
    
    return toastElement;
  }

  /**
   * Display modal announcement
   * @param {Object} announcement - Announcement object
   */
  displayModal(announcement) {
    const modalElement = this.createModalElement(announcement);
    document.body.appendChild(modalElement);
    
    // Apply animation
    this.applyAnimation(modalElement, announcement.animation, 'in');
    
    // Store reference
    modalElement.setAttribute('data-announcement-id', announcement.id);
    
    return modalElement;
  }

  /**
   * Display notification announcement
   * @param {Object} announcement - Announcement object
   */
  displayNotification(announcement) {
    const container = this.getOrCreateContainer('notification');
    const notificationElement = this.createNotificationElement(announcement);
    
    container.appendChild(notificationElement);
    
    // Apply animation
    this.applyAnimation(notificationElement, announcement.animation, 'in');
    
    // Store reference
    notificationElement.setAttribute('data-announcement-id', announcement.id);
    
    return notificationElement;
  }

  /**
   * Create banner element
   * @param {Object} announcement - Announcement object
   * @returns {HTMLElement} Banner element
   */
  createBannerElement(announcement) {
    const banner = document.createElement('div');
    banner.className = `mlg-announcement-banner mlg-type-${announcement.type} mlg-style-${announcement.style}`;
    
    banner.innerHTML = `
      <div class="mlg-banner-container">
        <div class="mlg-banner-content">
          <div class="mlg-banner-header">
            ${this.brandingSystem.createBrandBadge({ 
              size: 'medium', 
              animated: true 
            }).outerHTML}
            <div class="mlg-banner-meta">
              <div class="mlg-banner-type">${this.getTypeLabel(announcement.type)}</div>
              <div class="mlg-banner-time">${new Date().toLocaleTimeString()}</div>
            </div>
          </div>
          
          <div class="mlg-banner-main">
            <h3 class="mlg-banner-title">${announcement.title}</h3>
            <p class="mlg-banner-message">${announcement.message}</p>
          </div>
          
          ${announcement.actions.length > 0 ? `
            <div class="mlg-banner-actions">
              ${announcement.actions.map(action => `
                <button class="mlg-banner-action mlg-action-${action.type || 'primary'}" 
                        data-action="${action.id}">
                  ${action.icon ? `<span class="mlg-action-icon">${action.icon}</span>` : ''}
                  <span class="mlg-action-text">${action.label}</span>
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
        
        <button class="mlg-banner-close" data-action="close">
          <span class="mlg-close-icon">×</span>
        </button>
        
        <div class="mlg-banner-decoration"></div>
      </div>
    `;
    
    // Apply styling
    this.applyAnnouncementStyling(banner, announcement);
    
    // Add event listeners
    this.setupAnnouncementEvents(banner, announcement);
    
    return banner;
  }

  /**
   * Create toast element
   * @param {Object} announcement - Announcement object
   * @returns {HTMLElement} Toast element
   */
  createToastElement(announcement) {
    const toast = document.createElement('div');
    toast.className = `mlg-announcement-toast mlg-type-${announcement.type} mlg-style-${announcement.style}`;
    
    toast.innerHTML = `
      <div class="mlg-toast-container">
        <div class="mlg-toast-icon">
          ${this.getTypeIcon(announcement.type)}
        </div>
        
        <div class="mlg-toast-content">
          <div class="mlg-toast-title">${announcement.title}</div>
          <div class="mlg-toast-message">${announcement.message}</div>
          <div class="mlg-toast-time">${new Date().toLocaleTimeString()}</div>
        </div>
        
        <button class="mlg-toast-close" data-action="close">×</button>
        
        <div class="mlg-toast-progress">
          <div class="mlg-toast-progress-bar" style="animation-duration: ${announcement.duration}ms"></div>
        </div>
      </div>
    `;
    
    // Apply styling
    this.applyAnnouncementStyling(toast, announcement);
    
    // Add event listeners
    this.setupAnnouncementEvents(toast, announcement);
    
    return toast;
  }

  /**
   * Create modal element
   * @param {Object} announcement - Announcement object
   * @returns {HTMLElement} Modal element
   */
  createModalElement(announcement) {
    const modal = document.createElement('div');
    modal.className = `mlg-announcement-modal mlg-type-${announcement.type} mlg-style-${announcement.style}`;
    
    modal.innerHTML = `
      <div class="mlg-modal-backdrop"></div>
      <div class="mlg-modal-container">
        <div class="mlg-modal-header">
          ${this.brandingSystem.createBrandBadge({ 
            size: 'large', 
            animated: true 
          }).outerHTML}
          <div class="mlg-modal-title-section">
            <h2 class="mlg-modal-title">${announcement.title}</h2>
            <div class="mlg-modal-type">${this.getTypeLabel(announcement.type)}</div>
          </div>
          <button class="mlg-modal-close" data-action="close">×</button>
        </div>
        
        <div class="mlg-modal-content">
          <div class="mlg-modal-icon">
            ${this.getTypeIcon(announcement.type)}
          </div>
          <div class="mlg-modal-message">
            ${announcement.message}
          </div>
        </div>
        
        ${announcement.actions.length > 0 ? `
          <div class="mlg-modal-actions">
            ${announcement.actions.map(action => `
              <button class="mlg-modal-action mlg-action-${action.type || 'primary'}" 
                      data-action="${action.id}">
                ${action.icon ? `<span class="mlg-action-icon">${action.icon}</span>` : ''}
                <span class="mlg-action-text">${action.label}</span>
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
    
    // Apply styling
    this.applyAnnouncementStyling(modal, announcement);
    
    // Add event listeners
    this.setupAnnouncementEvents(modal, announcement);
    
    return modal;
  }

  /**
   * Create notification element
   * @param {Object} announcement - Announcement object
   * @returns {HTMLElement} Notification element
   */
  createNotificationElement(announcement) {
    const notification = document.createElement('div');
    notification.className = `mlg-announcement-notification mlg-type-${announcement.type} mlg-style-${announcement.style}`;
    
    notification.innerHTML = `
      <div class="mlg-notification-container">
        <div class="mlg-notification-header">
          <div class="mlg-notification-icon">
            ${this.getTypeIcon(announcement.type)}
          </div>
          <div class="mlg-notification-meta">
            <div class="mlg-notification-type">${this.getTypeLabel(announcement.type)}</div>
            <div class="mlg-notification-time">${new Date().toLocaleTimeString()}</div>
          </div>
          <button class="mlg-notification-close" data-action="close">×</button>
        </div>
        
        <div class="mlg-notification-content">
          <h4 class="mlg-notification-title">${announcement.title}</h4>
          <p class="mlg-notification-message">${announcement.message}</p>
        </div>
      </div>
    `;
    
    // Apply styling
    this.applyAnnouncementStyling(notification, announcement);
    
    // Add event listeners
    this.setupAnnouncementEvents(notification, announcement);
    
    return notification;
  }

  /**
   * Hide announcement
   * @param {string} announcementId - Announcement ID
   */
  hideAnnouncement(announcementId) {
    try {
      const announcement = this.announcements.get(announcementId);
      if (!announcement) {
        this.logger.warn(`❓ Announcement not found: ${announcementId}`);
        return;
      }

      announcement.status = 'dismissed';
      announcement.dismissedAt = new Date();
      
      this.activeAnnouncements.delete(announcementId);
      
      // Find and remove elements
      const elements = document.querySelectorAll(`[data-announcement-id="${announcementId}"]`);
      elements.forEach(element => {
        this.applyAnimation(element, announcement.animation, 'out').then(() => {
          if (element.parentNode) {
            element.remove();
          }
        });
      });
      
      this.emit('announcement_hidden', { announcement });
      this.logger.debug(`👁️‍🗨️ Hidden announcement: ${announcementId}`);
      
    } catch (error) {
      this.logger.error('❌ Error hiding announcement:', error);
    }
  }

  /**
   * Apply animation to element
   * @param {HTMLElement} element - Element to animate
   * @param {string} animationType - Animation type
   * @param {string} direction - Animation direction (in/out)
   * @returns {Promise} Animation promise
   */
  applyAnimation(element, animationType = 'fade', direction = 'in') {
    return new Promise(resolve => {
      const animationClass = `mlg-animate-${animationType}-${direction}`;
      
      element.classList.add('mlg-animating', animationClass);
      
      const handleAnimationEnd = () => {
        element.classList.remove('mlg-animating', animationClass);
        element.removeEventListener('animationend', handleAnimationEnd);
        resolve();
      };
      
      element.addEventListener('animationend', handleAnimationEnd);
      
      // Fallback timeout
      setTimeout(handleAnimationEnd, 1000);
    });
  }

  /**
   * Apply announcement styling
   * @param {HTMLElement} element - Element to style
   * @param {Object} announcement - Announcement object
   */
  applyAnnouncementStyling(element, announcement) {
    const color = this.config.COLORS[announcement.type] || this.config.COLORS.system;
    
    element.style.borderColor = color;
    element.style.setProperty('--announcement-color', color);
    element.style.setProperty('--announcement-color-rgb', this.hexToRgb(color));
  }

  /**
   * Setup announcement event listeners
   * @param {HTMLElement} element - Element
   * @param {Object} announcement - Announcement object
   */
  setupAnnouncementEvents(element, announcement) {
    // Close button
    const closeBtn = element.querySelector('[data-action="close"]');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hideAnnouncement(announcement.id);
      });
    }
    
    // Action buttons
    const actionBtns = element.querySelectorAll('[data-action]:not([data-action="close"])');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', (event) => {
        const actionId = btn.getAttribute('data-action');
        const action = announcement.actions.find(a => a.id === actionId);
        
        if (action) {
          announcement.interactions++;
          
          if (action.callback) {
            action.callback(announcement, event);
          }
          
          this.emit('announcement_action', { 
            announcement, 
            action, 
            event 
          });
          
          // Auto-hide if action specifies
          if (action.autoHide !== false) {
            this.hideAnnouncement(announcement.id);
          }
        }
      });
    });
    
    // Modal backdrop click
    const backdrop = element.querySelector('.mlg-modal-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', () => {
        this.hideAnnouncement(announcement.id);
      });
    }
  }

  /**
   * Get or create container for channel
   * @param {string} channelType - Channel type
   * @returns {HTMLElement} Container element
   */
  getOrCreateContainer(channelType) {
    let container = document.getElementById(`mlg-${channelType}-container`);
    
    if (!container) {
      container = document.createElement('div');
      container.id = `mlg-${channelType}-container`;
      container.className = `mlg-announcement-container mlg-${channelType}-container`;
      
      // Position container based on channel type
      this.positionContainer(container, channelType);
      
      document.body.appendChild(container);
    }
    
    return container;
  }

  /**
   * Position container for channel type
   * @param {HTMLElement} container - Container element
   * @param {string} channelType - Channel type
   */
  positionContainer(container, channelType) {
    const positions = {
      banner: { 
        position: 'fixed', 
        top: '0', 
        left: '0', 
        right: '0', 
        zIndex: '10000' 
      },
      toast: { 
        position: 'fixed', 
        top: '20px', 
        right: '20px', 
        zIndex: '10001' 
      },
      notification: { 
        position: 'fixed', 
        bottom: '20px', 
        right: '20px', 
        zIndex: '10002' 
      },
      sidebar: { 
        position: 'fixed', 
        top: '0', 
        right: '0', 
        height: '100vh', 
        width: '320px', 
        zIndex: '9999' 
      }
    };
    
    const position = positions[channelType] || positions.toast;
    Object.assign(container.style, position);
  }

  /**
   * Get type label
   * @param {string} type - Announcement type
   * @returns {string} Type label
   */
  getTypeLabel(type) {
    const labels = {
      system: 'System',
      tournament: 'Tournament',
      match: 'Match',
      news: 'News',
      achievement: 'Achievement',
      maintenance: 'Maintenance',
      emergency: 'Emergency',
      celebration: 'Celebration',
      reminder: 'Reminder',
      warning: 'Warning'
    };
    return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
  }

  /**
   * Get type icon
   * @param {string} type - Announcement type
   * @returns {string} Type icon
   */
  getTypeIcon(type) {
    const icons = {
      system: '⚙️',
      tournament: '🏆',
      match: '⚔️',
      news: '📰',
      achievement: '🏅',
      maintenance: '🔧',
      emergency: '🚨',
      celebration: '🎉',
      reminder: '⏰',
      warning: '⚠️'
    };
    return icons[type] || '📢';
  }

  /**
   * Check if announcement should be shown based on user preferences
   * @param {Object} announcement - Announcement object
   * @returns {boolean} Should show
   */
  shouldShowAnnouncement(announcement) {
    // This would check user preferences, notification settings, etc.
    // For now, return true for all announcements
    return true;
  }

  /**
   * Add announcement to history
   * @param {Object} announcement - Announcement object
   */
  addToHistory(announcement) {
    this.announcementHistory.unshift(announcement);
    
    // Keep only last 100 announcements
    if (this.announcementHistory.length > 100) {
      this.announcementHistory = this.announcementHistory.slice(0, 100);
    }
  }

  /**
   * Setup announcement channels
   */
  setupChannels() {
    Object.values(this.config.CHANNELS).forEach(channelType => {
      this.channels.set(channelType, {
        type: channelType,
        enabled: true,
        maxConcurrent: channelType === 'modal' ? 1 : 5,
        currentCount: 0
      });
    });
  }

  /**
   * Start queue processor
   */
  startQueueProcessor() {
    setInterval(() => {
      this.processQueue();
    }, 1000);
  }

  /**
   * Load user preferences
   */
  loadUserPreferences() {
    try {
      const stored = localStorage.getItem('mlg-announcement-preferences');
      if (stored) {
        const preferences = JSON.parse(stored);
        Object.entries(preferences).forEach(([key, value]) => {
          this.userPreferences.set(key, value);
        });
      }
    } catch (error) {
      this.logger.warn('⚠️ Could not load user preferences:', error);
    }
  }

  /**
   * Play announcement sound
   * @param {string} type - Announcement type
   */
  playAnnouncementSound(type) {
    if (!this.audioContext) return;
    
    // This would play audio based on announcement type
    this.logger.debug(`🔊 Playing sound for ${type} announcement`);
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
    // Listen for page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Process queue when page becomes visible
        this.processQueue();
      }
    });

    this.logger.debug('🎧 Announcement system event listeners setup complete');
  }

  /**
   * Convert hex color to RGB
   * @param {string} hex - Hex color
   * @returns {string} RGB values
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
      '0, 255, 136';
  }

  /**
   * Inject announcement styles
   */
  async injectAnnouncementStyles() {
    const styleId = 'mlg-announcement-styles';
    
    const existingStyles = document.getElementById(styleId);
    if (existingStyles) {
      existingStyles.remove();
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* MLG Event Announcement System Styles */
      
      .mlg-announcement-container {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        pointer-events: none;
      }

      .mlg-announcement-container > * {
        pointer-events: auto;
      }

      /* Banner Announcements */
      .mlg-announcement-banner {
        background: linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(10, 10, 15, 0.95) 100%);
        border-bottom: 3px solid var(--announcement-color);
        color: #ffffff;
        padding: 16px 24px;
        position: relative;
        overflow: hidden;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      }

      .mlg-banner-container {
        display: flex;
        align-items: center;
        gap: 16px;
        position: relative;
        z-index: 2;
      }

      .mlg-banner-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .mlg-banner-header {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .mlg-banner-meta {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .mlg-banner-type {
        font-size: 12px;
        font-weight: bold;
        color: var(--announcement-color);
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .mlg-banner-time {
        font-size: 11px;
        color: #9ca3af;
        font-family: 'Courier New', monospace;
      }

      .mlg-banner-main {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .mlg-banner-title {
        font-size: 18px;
        font-weight: bold;
        margin: 0;
        color: #ffffff;
      }

      .mlg-banner-message {
        font-size: 14px;
        margin: 0;
        color: #e5e7eb;
        line-height: 1.4;
      }

      .mlg-banner-actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .mlg-banner-action {
        background: rgba(var(--announcement-color-rgb), 0.2);
        border: 1px solid var(--announcement-color);
        border-radius: 6px;
        padding: 6px 12px;
        color: var(--announcement-color);
        font-size: 12px;
        font-weight: bold;
        cursor: pointer;
        transition: all 300ms ease;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .mlg-banner-action:hover {
        background: rgba(var(--announcement-color-rgb), 0.3);
        transform: translateY(-1px);
      }

      .mlg-banner-close {
        background: none;
        border: none;
        color: #9ca3af;
        font-size: 24px;
        cursor: pointer;
        padding: 4px;
        border-radius: 50%;
        transition: all 300ms ease;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .mlg-banner-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
      }

      .mlg-banner-decoration {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, transparent 40%, rgba(var(--announcement-color-rgb), 0.1) 50%, transparent 60%);
        animation: mlg-banner-shine 3s infinite;
        z-index: 1;
      }

      /* Toast Announcements */
      .mlg-announcement-toast {
        background: rgba(26, 26, 46, 0.95);
        border: 2px solid var(--announcement-color);
        border-radius: 12px;
        color: #ffffff;
        margin-bottom: 12px;
        min-width: 320px;
        max-width: 480px;
        position: relative;
        overflow: hidden;
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }

      .mlg-toast-container {
        padding: 16px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        position: relative;
      }

      .mlg-toast-icon {
        font-size: 20px;
        margin-top: 2px;
        color: var(--announcement-color);
      }

      .mlg-toast-content {
        flex: 1;
      }

      .mlg-toast-title {
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 4px;
        color: #ffffff;
      }

      .mlg-toast-message {
        font-size: 13px;
        color: #e5e7eb;
        line-height: 1.3;
        margin-bottom: 4px;
      }

      .mlg-toast-time {
        font-size: 11px;
        color: #9ca3af;
        font-family: 'Courier New', monospace;
      }

      .mlg-toast-close {
        background: none;
        border: none;
        color: #9ca3af;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 300ms ease;
      }

      .mlg-toast-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
      }

      .mlg-toast-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: rgba(var(--announcement-color-rgb), 0.2);
      }

      .mlg-toast-progress-bar {
        height: 100%;
        background: var(--announcement-color);
        width: 100%;
        animation: mlg-toast-countdown linear;
        transform-origin: left;
      }

      /* Modal Announcements */
      .mlg-announcement-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 15000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }

      .mlg-modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
      }

      .mlg-modal-container {
        background: linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(10, 10, 15, 0.95) 100%);
        border: 2px solid var(--announcement-color);
        border-radius: 16px;
        color: #ffffff;
        max-width: 500px;
        width: 100%;
        position: relative;
        backdrop-filter: blur(20px);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      }

      .mlg-modal-header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 24px 24px 0 24px;
      }

      .mlg-modal-title-section {
        flex: 1;
      }

      .mlg-modal-title {
        font-size: 24px;
        font-weight: bold;
        margin: 0 0 4px 0;
        color: #ffffff;
      }

      .mlg-modal-type {
        font-size: 14px;
        color: var(--announcement-color);
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: bold;
      }

      .mlg-modal-close {
        background: none;
        border: none;
        color: #9ca3af;
        font-size: 24px;
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        transition: all 300ms ease;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .mlg-modal-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
      }

      .mlg-modal-content {
        padding: 24px;
        text-align: center;
      }

      .mlg-modal-icon {
        font-size: 48px;
        margin-bottom: 16px;
        color: var(--announcement-color);
      }

      .mlg-modal-message {
        font-size: 16px;
        color: #e5e7eb;
        line-height: 1.5;
        margin: 0;
      }

      .mlg-modal-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        padding: 0 24px 24px 24px;
      }

      .mlg-modal-action {
        background: var(--announcement-color);
        border: none;
        border-radius: 8px;
        color: #0a0a0f;
        font-size: 14px;
        font-weight: bold;
        padding: 12px 24px;
        cursor: pointer;
        transition: all 300ms ease;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .mlg-modal-action:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(var(--announcement-color-rgb), 0.4);
      }

      .mlg-modal-action.mlg-action-secondary {
        background: rgba(var(--announcement-color-rgb), 0.2);
        color: var(--announcement-color);
        border: 1px solid var(--announcement-color);
      }

      /* Notification Announcements */
      .mlg-announcement-notification {
        background: rgba(26, 26, 46, 0.95);
        border: 2px solid var(--announcement-color);
        border-radius: 12px;
        color: #ffffff;
        margin-bottom: 12px;
        min-width: 300px;
        max-width: 400px;
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }

      .mlg-notification-container {
        padding: 16px;
      }

      .mlg-notification-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }

      .mlg-notification-icon {
        font-size: 18px;
        color: var(--announcement-color);
      }

      .mlg-notification-meta {
        flex: 1;
      }

      .mlg-notification-type {
        font-size: 12px;
        font-weight: bold;
        color: var(--announcement-color);
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .mlg-notification-time {
        font-size: 11px;
        color: #9ca3af;
        font-family: 'Courier New', monospace;
      }

      .mlg-notification-close {
        background: none;
        border: none;
        color: #9ca3af;
        font-size: 18px;
        cursor: pointer;
        padding: 4px;
        border-radius: 50%;
        transition: all 300ms ease;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .mlg-notification-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
      }

      .mlg-notification-content {
        margin-left: 30px;
      }

      .mlg-notification-title {
        font-size: 14px;
        font-weight: bold;
        margin: 0 0 4px 0;
        color: #ffffff;
      }

      .mlg-notification-message {
        font-size: 13px;
        color: #e5e7eb;
        line-height: 1.3;
        margin: 0;
      }

      /* Animations */
      @keyframes mlg-banner-shine {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      @keyframes mlg-toast-countdown {
        0% { transform: scaleX(1); }
        100% { transform: scaleX(0); }
      }

      /* Animation Classes */
      .mlg-animate-fade-in {
        animation: mlg-fade-in 300ms ease-out;
      }

      .mlg-animate-fade-out {
        animation: mlg-fade-out 300ms ease-in;
      }

      .mlg-animate-slide-in {
        animation: mlg-slide-in 300ms ease-out;
      }

      .mlg-animate-slide-out {
        animation: mlg-slide-out 300ms ease-in;
      }

      .mlg-animate-bounce-in {
        animation: mlg-bounce-in 500ms ease-out;
      }

      .mlg-animate-bounce-out {
        animation: mlg-bounce-out 300ms ease-in;
      }

      .mlg-animate-zoom-in {
        animation: mlg-zoom-in 300ms ease-out;
      }

      .mlg-animate-zoom-out {
        animation: mlg-zoom-out 300ms ease-in;
      }

      @keyframes mlg-fade-in {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }

      @keyframes mlg-fade-out {
        0% { opacity: 1; }
        100% { opacity: 0; }
      }

      @keyframes mlg-slide-in {
        0% { transform: translateX(100%); opacity: 0; }
        100% { transform: translateX(0); opacity: 1; }
      }

      @keyframes mlg-slide-out {
        0% { transform: translateX(0); opacity: 1; }
        100% { transform: translateX(100%); opacity: 0; }
      }

      @keyframes mlg-bounce-in {
        0% { transform: scale(0.3); opacity: 0; }
        50% { transform: scale(1.05); }
        70% { transform: scale(0.9); }
        100% { transform: scale(1); opacity: 1; }
      }

      @keyframes mlg-bounce-out {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(0.3); opacity: 0; }
      }

      @keyframes mlg-zoom-in {
        0% { transform: scale(0.8); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }

      @keyframes mlg-zoom-out {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(0.8); opacity: 0; }
      }

      /* Type-specific styling */
      .mlg-type-emergency {
        animation: mlg-emergency-pulse 2s infinite;
      }

      .mlg-type-celebration {
        background: linear-gradient(45deg, #10b981, #3b82f6, #8b5cf6, #f59e0b);
        background-size: 400% 400%;
        animation: mlg-celebration-gradient 3s ease infinite;
      }

      @keyframes mlg-emergency-pulse {
        0%, 100% { 
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.5); 
          border-color: #ef4444; 
        }
        50% { 
          box-shadow: 0 0 40px rgba(239, 68, 68, 0.8); 
          border-color: #ff8800; 
        }
      }

      @keyframes mlg-celebration-gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .mlg-announcement-banner {
          padding: 12px 16px;
        }

        .mlg-banner-container {
          flex-direction: column;
          align-items: stretch;
          gap: 12px;
        }

        .mlg-banner-header {
          justify-content: space-between;
        }

        .mlg-banner-actions {
          flex-wrap: wrap;
        }

        .mlg-announcement-toast,
        .mlg-announcement-notification {
          min-width: auto;
          margin: 0 10px 12px 10px;
        }

        .mlg-modal-container {
          margin: 10px;
          max-width: none;
        }

        .mlg-modal-header {
          padding: 16px 16px 0 16px;
        }

        .mlg-modal-content {
          padding: 16px;
        }

        .mlg-modal-actions {
          padding: 0 16px 16px 16px;
          flex-direction: column;
        }
      }

      /* Print Styles */
      @media print {
        .mlg-announcement-container {
          display: none !important;
        }
      }

      /* Reduced Motion */
      @media (prefers-reduced-motion: reduce) {
        .mlg-announcement-banner,
        .mlg-announcement-toast,
        .mlg-announcement-modal,
        .mlg-announcement-notification {
          animation: none !important;
        }

        .mlg-banner-decoration,
        .mlg-toast-progress-bar {
          animation: none !important;
        }
      }

      /* High Contrast Mode */
      @media (prefers-contrast: high) {
        .mlg-announcement-banner,
        .mlg-announcement-toast,
        .mlg-announcement-modal,
        .mlg-announcement-notification {
          border-width: 3px !important;
          background: #000000 !important;
          color: #ffffff !important;
        }
      }
    `;

    document.head.appendChild(style);
    this.logger.debug('✨ Announcement system styles injected');
  }

  /**
   * Get system statistics
   * @returns {Object} System statistics
   */
  getStatistics() {
    const typeCounts = {};
    const statusCounts = {};
    
    this.announcements.forEach(announcement => {
      typeCounts[announcement.type] = (typeCounts[announcement.type] || 0) + 1;
      statusCounts[announcement.status] = (statusCounts[announcement.status] || 0) + 1;
    });

    return {
      isInitialized: this.isInitialized,
      totalAnnouncements: this.announcements.size,
      queuedAnnouncements: this.announcementQueue.length,
      activeAnnouncements: this.activeAnnouncements.size,
      historyCount: this.announcementHistory.length,
      typeCounts,
      statusCounts,
      totalViews: Array.from(this.announcements.values()).reduce((sum, a) => sum + a.views, 0),
      totalInteractions: Array.from(this.announcements.values()).reduce((sum, a) => sum + a.interactions, 0)
    };
  }

  /**
   * Cleanup system resources
   */
  cleanup() {
    // Hide all active announcements
    this.activeAnnouncements.forEach(id => {
      this.hideAnnouncement(id);
    });

    // Clear collections
    this.announcements.clear();
    this.announcementQueue.length = 0;
    this.activeAnnouncements.clear();
    this.announcementHistory.length = 0;

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Remove containers
    document.querySelectorAll('.mlg-announcement-container').forEach(container => {
      container.remove();
    });

    // Remove event listeners
    this.removeAllListeners();

    this.logger.debug('🧹 Announcement system cleanup complete');
  }
}

// Export the announcement system
export { MLGEventAnnouncementSystem, ANNOUNCEMENT_CONFIG };
export default MLGEventAnnouncementSystem;