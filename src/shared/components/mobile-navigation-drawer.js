/**
 * MLG.clan Mobile Navigation Drawer
 * 
 * Xbox 360 dashboard-inspired mobile navigation system with gaming tiles and gesture controls
 * Optimized for mobile gaming workflows with touch-friendly interactions
 * 
 * Features:
 * - Xbox 360 dashboard aesthetic with gaming tiles
 * - Gesture-controlled drawer with swipe and edge detection
 * - Quick access to voting, leaderboards, clan management
 * - Gaming achievement and notification badges
 * - Collapsible sections for gaming categories
 * - Performance-optimized with 60fps animations
 * - Battery optimization and memory management
 * - Accessibility compliance with screen reader support
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
 * Mobile Navigation Configuration
 */
const MOBILE_NAV_CONFIG = {
  // Drawer dimensions
  DRAWER_WIDTH: '320px',
  DRAWER_WIDTH_SMALL: '280px',
  EDGE_DETECTION_ZONE: 20, // px from edge to detect swipe
  
  // Gesture settings
  SWIPE_THRESHOLD: 50,
  SWIPE_VELOCITY_THRESHOLD: 0.3,
  LONG_PRESS_DURATION: 300,
  
  // Animation settings
  ANIMATION_DURATION: 300,
  SPRING_TENSION: 0.8,
  
  // Performance settings
  USE_TRANSFORM: true,
  USE_WILL_CHANGE: true,
  FRAME_BUDGET: 16.67, // 60fps
  
  // Gaming tile settings
  TILE_SIZE: '80px',
  TILE_GAP: '12px',
  NOTIFICATION_LIMIT: 99,
  
  // Touch targets
  MIN_TOUCH_SIZE: 48,
  PREFERRED_TOUCH_SIZE: 56
};

/**
 * Gaming Navigation Sections
 */
const NAV_SECTIONS = {
  CORE: {
    id: 'core',
    title: 'Gaming Hub',
    icon: 'gamepad-2',
    expanded: true,
    items: [
      { id: 'dashboard', title: 'Dashboard', icon: 'layout-dashboard', page: 'index.html', badge: null },
      { id: 'voting', title: 'Vote Vault', icon: 'vote', page: 'voting.html', badge: '🔥' },
      { id: 'clans', title: 'Clan Hub', icon: 'users', page: 'clans.html', badge: '3' },
      { id: 'content', title: 'Content Hub', icon: 'play-circle', page: 'content.html', badge: null },
      { id: 'tournaments', title: 'Tournaments', icon: 'trophy', page: 'tournaments.html', badge: 'NEW' }
    ]
  },
  GOVERNANCE: {
    id: 'governance',
    title: 'DAO Governance',
    icon: 'crown',
    expanded: false,
    items: [
      { id: 'dao', title: 'DAO Control', icon: 'settings', page: 'dao.html', badge: null },
      { id: 'proposals', title: 'Proposals', icon: 'file-text', page: 'proposals.html', badge: '2' },
      { id: 'treasury', title: 'Treasury', icon: 'piggy-bank', page: 'treasury.html', badge: null }
    ]
  },
  SOCIAL: {
    id: 'social',
    title: 'Social & Stats',
    icon: 'users-2',
    expanded: false,
    items: [
      { id: 'leaderboards', title: 'Leaderboards', icon: 'bar-chart-3', page: 'leaderboards.html', badge: null },
      { id: 'achievements', title: 'Achievements', icon: 'award', page: 'achievements.html', badge: '5' },
      { id: 'friends', title: 'Friends', icon: 'user-plus', page: 'friends.html', badge: '12' },
      { id: 'chat', title: 'Gaming Chat', icon: 'message-circle', page: 'chat.html', badge: '99+' }
    ]
  },
  TOOLS: {
    id: 'tools',
    title: 'Gaming Tools',
    icon: 'wrench',
    expanded: false,
    items: [
      { id: 'analytics', title: 'Analytics', icon: 'trending-up', page: 'analytics.html', badge: null },
      { id: 'performance', title: 'Performance', icon: 'zap', page: 'performance.html', badge: null },
      { id: 'profile', title: 'Profile', icon: 'user', page: 'profile.html', badge: null },
      { id: 'settings', title: 'Settings', icon: 'cog', page: 'settings.html', badge: null }
    ]
  }
};

/**
 * Mobile Navigation Drawer Class
 */
export class MobileNavigationDrawer {
  constructor(options = {}) {
    this.options = {
      container: document.body,
      autoInit: true,
      enableGestures: true,
      enableEdgeSwipe: true,
      enableQuickActions: true,
      enableNotifications: true,
      enableVoiceControl: false,
      position: 'left', // left, right
      theme: 'xbox', // xbox, minimal
      ...options
    };
    
    // Component state
    this.state = {
      isOpen: false,
      isAnimating: false,
      lastOpenTime: 0,
      expandedSections: new Set(['core']),
      currentPage: this.getCurrentPage(),
      notificationCount: 0,
      quickActionsOpen: false
    };
    
    // Touch and gesture state
    this.gestureState = {
      startX: 0,
      startY: 0,
      currentX: 0,
      velocity: 0,
      isTracking: false,
      startTime: 0,
      longPressTimer: null
    };
    
    // Performance tracking
    this.performance = {
      frameStart: 0,
      lastFrameTime: 0,
      animationFrameId: 0,
      isOptimized: false
    };
    
    // DOM references
    this.elements = {
      drawer: null,
      overlay: null,
      content: null,
      bottomNav: null,
      fab: null
    };
    
    // Event listeners
    this.eventListeners = new Map();
    
    if (this.options.autoInit) {
      this.init();
    }
  }

  /**
   * Initialize mobile navigation drawer
   */
  async init() {
    console.log('🎮 Initializing MLG Mobile Navigation Drawer...');
    
    try {
      // Create drawer structure
      this.createDrawerStructure();
      
      // Setup gesture handlers
      if (this.options.enableGestures) {
        this.setupGestureHandlers();
      }
      
      // Setup edge swipe detection
      if (this.options.enableEdgeSwipe) {
        this.setupEdgeSwipeDetection();
      }
      
      // Setup performance optimization
      this.setupPerformanceOptimization();
      
      // Setup accessibility features
      this.setupAccessibilityFeatures();
      
      // Setup keyboard shortcuts
      this.setupKeyboardShortcuts();
      
      // Connect to navigation manager
      this.connectToNavigationManager();
      
      // Load user preferences
      await this.loadUserPreferences();
      
      console.log('✅ Mobile Navigation Drawer initialized successfully');
      
      // Dispatch initialization event
      this.dispatchEvent('drawer-initialized', {
        config: this.options,
        state: this.state
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize Mobile Navigation Drawer:', error);
      throw error;
    }
  }

  /**
   * Create drawer DOM structure
   */
  createDrawerStructure() {
    // Create main drawer container
    this.elements.drawer = this.createElement('div', {
      id: 'mlg-mobile-drawer',
      className: this.getDrawerClasses(),
      'data-drawer': 'mobile-nav',
      'aria-label': 'Gaming Navigation Menu',
      'aria-hidden': 'true',
      role: 'navigation'
    });

    // Create overlay
    this.elements.overlay = this.createElement('div', {
      className: 'drawer-overlay',
      'data-action': 'close-drawer',
      'aria-hidden': 'true'
    });

    // Create drawer content
    this.elements.content = this.createElement('div', {
      className: 'drawer-content',
      role: 'menu'
    });

    // Build drawer content
    this.elements.content.innerHTML = this.buildDrawerContent();

    // Append elements
    this.elements.drawer.appendChild(this.elements.overlay);
    this.elements.drawer.appendChild(this.elements.content);
    this.options.container.appendChild(this.elements.drawer);

    // Create bottom navigation
    this.createBottomNavigation();

    // Create floating action button
    this.createFloatingActionButton();

    // Bind events
    this.bindDrawerEvents();
  }

  /**
   * Build drawer content HTML
   */
  buildDrawerContent() {
    return `
      <!-- Drawer Header -->
      <div class="drawer-header ${this.getHeaderClasses()}">
        <div class="gaming-brand">
          <div class="brand-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div class="brand-text">
            <h1 class="brand-title">MLG.clan</h1>
            <p class="brand-subtitle">Gaming Hub</p>
          </div>
        </div>
        
        <div class="header-actions">
          ${this.createNotificationBadge()}
          <button class="close-btn ${getTouchOptimizedClasses(touchUtils.touchTarget)}"
                  data-action="close-drawer"
                  aria-label="Close navigation menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Quick Actions Bar -->
      ${this.createQuickActionsBar()}

      <!-- Navigation Sections -->
      <div class="drawer-sections">
        ${Object.values(NAV_SECTIONS).map(section => this.createNavigationSection(section)).join('')}
      </div>

      <!-- Gaming Stats Footer -->
      ${this.createGamingStatsFooter()}
    `;
  }

  /**
   * Create navigation section
   */
  createNavigationSection(section) {
    const isExpanded = this.state.expandedSections.has(section.id);
    
    return `
      <div class="nav-section ${isExpanded ? 'expanded' : ''}" data-section="${section.id}">
        <button class="section-header ${getTouchOptimizedClasses(touchUtils.touchTarget)}"
                data-action="toggle-section"
                data-section="${section.id}"
                aria-expanded="${isExpanded}"
                aria-controls="section-${section.id}-content">
          <div class="section-icon">
            <svg width="20" height="20" data-lucide="${section.icon}"></svg>
          </div>
          <span class="section-title">${section.title}</span>
          <div class="section-toggle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="chevron">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </div>
        </button>
        
        <div class="section-content" id="section-${section.id}-content" role="group">
          <div class="nav-tiles">
            ${section.items.map(item => this.createNavigationTile(item)).join('')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create navigation tile
   */
  createNavigationTile(item) {
    const isActive = this.isCurrentPage(item.page);
    const badge = this.formatBadge(item.badge);
    
    return `
      <button class="nav-tile ${isActive ? 'active' : ''} ${getTouchOptimizedClasses(touchUtils.touchTargetLarge)}"
              data-action="navigate"
              data-page="${item.page}"
              data-nav-id="${item.id}"
              aria-label="${item.title}${badge ? ` (${badge} notifications)` : ''}"
              ${isActive ? 'aria-current="page"' : ''}>
        <div class="tile-icon">
          <svg width="24" height="24" data-lucide="${item.icon}"></svg>
          ${badge ? `<span class="tile-badge" aria-label="${badge} notifications">${badge}</span>` : ''}
        </div>
        <span class="tile-label">${item.title}</span>
        ${isActive ? '<div class="active-indicator"></div>' : ''}
      </button>
    `;
  }

  /**
   * Create quick actions bar
   */
  createQuickActionsBar() {
    if (!this.options.enableQuickActions) return '';
    
    return `
      <div class="quick-actions-bar">
        <button class="quick-action ${getTouchOptimizedClasses(touchUtils.touchTarget)}"
                data-action="quick-vote-up"
                aria-label="Quick vote up">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 14l5-5 5 5z"/>
          </svg>
          <span class="action-label">Vote Up</span>
        </button>
        
        <button class="quick-action ${getTouchOptimizedClasses(touchUtils.touchTarget)}"
                data-action="quick-super-vote"
                aria-label="Quick super vote">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span class="action-label">Super Vote</span>
        </button>
        
        <button class="quick-action ${getTouchOptimizedClasses(touchUtils.touchTarget)}"
                data-action="quick-clan"
                aria-label="Quick clan actions">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 7c0 2.21-1.79 4-4 4s-4-1.79-4-4 1.79-4 4-4 4 1.79 4 4zM12 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
          </svg>
          <span class="action-label">Clan</span>
        </button>
        
        <button class="quick-action ${getTouchOptimizedClasses(touchUtils.touchTarget)}"
                data-action="toggle-voice"
                aria-label="Toggle voice control">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span class="action-label">Voice</span>
        </button>
      </div>
    `;
  }

  /**
   * Create notification badge
   */
  createNotificationBadge() {
    if (!this.options.enableNotifications || this.state.notificationCount === 0) {
      return '';
    }
    
    const count = this.state.notificationCount;
    const displayCount = count > MOBILE_NAV_CONFIG.NOTIFICATION_LIMIT ? 
      `${MOBILE_NAV_CONFIG.NOTIFICATION_LIMIT}+` : count.toString();
    
    return `
      <button class="notification-btn ${getTouchOptimizedClasses(touchUtils.touchTarget)}"
              data-action="show-notifications"
              aria-label="${count} notifications">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
        </svg>
        <span class="notification-count">${displayCount}</span>
      </button>
    `;
  }

  /**
   * Create gaming stats footer
   */
  createGamingStatsFooter() {
    return `
      <div class="drawer-footer">
        <div class="gaming-stats">
          <div class="stat-item">
            <span class="stat-icon">🏆</span>
            <div class="stat-content">
              <span class="stat-value">1,247</span>
              <span class="stat-label">MLG Score</span>
            </div>
          </div>
          
          <div class="stat-item">
            <span class="stat-icon">🔥</span>
            <div class="stat-content">
              <span class="stat-value">42</span>
              <span class="stat-label">Streak</span>
            </div>
          </div>
          
          <div class="stat-item">
            <span class="stat-icon">⚡</span>
            <div class="stat-content">
              <span class="stat-value">Level 15</span>
              <span class="stat-label">Gaming</span>
            </div>
          </div>
        </div>
        
        <div class="footer-actions">
          <button class="footer-btn ${getTouchOptimizedClasses(touchUtils.touchTarget)}"
                  data-action="gaming-mode"
                  aria-label="Toggle gaming mode">
            <svg width="16" height="16" data-lucide="gamepad-2"></svg>
            <span>Gaming Mode</span>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Create bottom navigation
   */
  createBottomNavigation() {
    if (!deviceUtils.isMobile()) return;
    
    this.elements.bottomNav = this.createElement('div', {
      className: 'mobile-bottom-nav',
      role: 'tablist',
      'aria-label': 'Main navigation'
    });

    const bottomNavItems = [
      { id: 'home', icon: 'home', label: 'Home', page: 'index.html' },
      { id: 'vote', icon: 'chevron-up', label: 'Vote', page: 'voting.html', badge: '🔥' },
      { id: 'clans', icon: 'users', label: 'Clans', page: 'clans.html', badge: '3' },
      { id: 'content', icon: 'play', label: 'Content', page: 'content.html' },
      { id: 'menu', icon: 'menu', label: 'Menu', action: 'open-drawer' }
    ];

    this.elements.bottomNav.innerHTML = `
      <div class="bottom-nav-container">
        ${bottomNavItems.map((item, index) => this.createBottomNavItem(item, index)).join('')}
      </div>
    `;

    this.options.container.appendChild(this.elements.bottomNav);
  }

  /**
   * Create bottom navigation item
   */
  createBottomNavItem(item, index) {
    const isActive = item.page ? this.isCurrentPage(item.page) : false;
    const badge = item.badge ? `<span class="nav-badge">${item.badge}</span>` : '';
    
    return `
      <button class="bottom-nav-item ${isActive ? 'active' : ''} ${getTouchOptimizedClasses(touchUtils.touchTargetLarge)}"
              data-action="${item.action || 'navigate'}"
              ${item.page ? `data-page="${item.page}"` : ''}
              data-nav-id="${item.id}"
              role="tab"
              aria-selected="${isActive}"
              aria-label="${item.label}${item.badge ? ` (${item.badge})` : ''}">
        <div class="nav-icon">
          <svg width="20" height="20" data-lucide="${item.icon}"></svg>
          ${badge}
        </div>
        <span class="nav-label">${item.label}</span>
      </button>
    `;
  }

  /**
   * Create floating action button
   */
  createFloatingActionButton() {
    if (!this.options.enableQuickActions || !deviceUtils.isMobile()) return;
    
    this.elements.fab = this.createElement('div', {
      className: 'floating-action-container',
      'data-fab': 'quick-actions'
    });

    this.elements.fab.innerHTML = `
      <button class="floating-action-btn ${getTouchOptimizedClasses(touchUtils.touchTargetLarge)}"
              data-action="toggle-quick-actions"
              aria-label="Quick gaming actions"
              aria-expanded="false">
        <svg width="24" height="24" data-lucide="zap"></svg>
      </button>
      
      <div class="quick-actions-menu hidden">
        <button class="quick-fab-action vote-up"
                data-action="quick-vote-up"
                aria-label="Quick vote up">
          <svg width="20" height="20" data-lucide="chevron-up"></svg>
        </button>
        
        <button class="quick-fab-action super-vote"
                data-action="quick-super-vote"
                aria-label="Super vote">
          <svg width="20" height="20" data-lucide="star"></svg>
        </button>
        
        <button class="quick-fab-action clan-action"
                data-action="quick-clan"
                aria-label="Clan actions">
          <svg width="20" height="20" data-lucide="users"></svg>
        </button>
      </div>
    `;

    this.options.container.appendChild(this.elements.fab);
  }

  /**
   * Get responsive CSS classes
   */
  getDrawerClasses() {
    const baseClasses = [
      'mobile-drawer',
      `drawer-${this.options.position}`,
      `theme-${this.options.theme}`,
      'fixed', 'inset-0', 'z-50'
    ];
    
    if (this.state.isOpen) {
      baseClasses.push('open');
    }
    
    return baseClasses.join(' ');
  }

  getHeaderClasses() {
    return generateGamingClasses('gamingCard', {
      base: 'bg-gaming-surface border-b border-gaming-accent/20 p-4',
      sm: 'p-6'
    });
  }

  /**
   * Setup gesture handlers
   */
  setupGestureHandlers() {
    // Touch start
    this.addEventListener(this.elements.drawer, 'touchstart', (e) => {
      this.handleTouchStart(e);
    }, { passive: false });

    // Touch move
    this.addEventListener(this.elements.drawer, 'touchmove', (e) => {
      this.handleTouchMove(e);
    }, { passive: false });

    // Touch end
    this.addEventListener(this.elements.drawer, 'touchend', (e) => {
      this.handleTouchEnd(e);
    }, { passive: false });
  }

  /**
   * Setup edge swipe detection
   */
  setupEdgeSwipeDetection() {
    const edgeZone = MOBILE_NAV_CONFIG.EDGE_DETECTION_ZONE;
    
    this.addEventListener(this.options.container, 'touchstart', (e) => {
      if (this.state.isOpen) return;
      
      const touch = e.touches[0];
      const isLeftEdge = this.options.position === 'left' && touch.clientX <= edgeZone;
      const isRightEdge = this.options.position === 'right' && 
        touch.clientX >= window.innerWidth - edgeZone;
      
      if (isLeftEdge || isRightEdge) {
        this.startEdgeSwipe(e);
      }
    }, { passive: false });
  }

  /**
   * Touch event handlers
   */
  handleTouchStart(e) {
    const touch = e.touches[0];
    
    this.gestureState = {
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      velocity: 0,
      isTracking: true,
      startTime: performance.now(),
      longPressTimer: null
    };

    // Setup long press for additional options
    this.gestureState.longPressTimer = setTimeout(() => {
      this.handleLongPress(e);
    }, MOBILE_NAV_CONFIG.LONG_PRESS_DURATION);
  }

  handleTouchMove(e) {
    if (!this.gestureState.isTracking) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - this.gestureState.startX;
    const deltaY = Math.abs(touch.clientY - this.gestureState.startY);
    
    // Clear long press if moved
    if (Math.abs(deltaX) > 10 || deltaY > 10) {
      clearTimeout(this.gestureState.longPressTimer);
    }
    
    // Update velocity
    const currentTime = performance.now();
    const timeDelta = currentTime - this.gestureState.startTime;
    this.gestureState.velocity = deltaX / timeDelta;
    this.gestureState.currentX = touch.clientX;
    
    // Handle swipe feedback if drawer is open
    if (this.state.isOpen && Math.abs(deltaX) > 10) {
      this.updateSwipeFeedback(deltaX);
      e.preventDefault();
    }
  }

  handleTouchEnd(e) {
    if (!this.gestureState.isTracking) return;
    
    clearTimeout(this.gestureState.longPressTimer);
    
    const deltaX = this.gestureState.currentX - this.gestureState.startX;
    const velocity = Math.abs(this.gestureState.velocity);
    
    // Determine if swipe should close/open drawer
    if (Math.abs(deltaX) > MOBILE_NAV_CONFIG.SWIPE_THRESHOLD || 
        velocity > MOBILE_NAV_CONFIG.SWIPE_VELOCITY_THRESHOLD) {
      
      if (this.options.position === 'left') {
        if (deltaX < 0 && this.state.isOpen) {
          this.close();
        } else if (deltaX > 0 && !this.state.isOpen) {
          this.open();
        }
      } else {
        if (deltaX > 0 && this.state.isOpen) {
          this.close();
        } else if (deltaX < 0 && !this.state.isOpen) {
          this.open();
        }
      }
    }
    
    this.resetGestureState();
  }

  startEdgeSwipe(e) {
    this.handleTouchStart(e);
    e.preventDefault();
  }

  handleLongPress(e) {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // Show additional options or context menu
    this.dispatchEvent('drawer-long-press', {
      position: { x: e.touches[0].clientX, y: e.touches[0].clientY }
    });
  }

  updateSwipeFeedback(deltaX) {
    if (!this.elements.content) return;
    
    const maxTranslate = 100;
    const translate = Math.max(-maxTranslate, Math.min(maxTranslate, deltaX * 0.3));
    
    if (MOBILE_NAV_CONFIG.USE_TRANSFORM) {
      this.elements.content.style.transform = `translateX(${translate}px)`;
    }
  }

  resetGestureState() {
    this.gestureState = {
      startX: 0,
      startY: 0,
      currentX: 0,
      velocity: 0,
      isTracking: false,
      startTime: 0,
      longPressTimer: null
    };
    
    // Reset visual feedback
    if (this.elements.content) {
      this.elements.content.style.transform = '';
    }
  }

  /**
   * Setup performance optimization
   */
  setupPerformanceOptimization() {
    // Use will-change for smooth animations
    if (MOBILE_NAV_CONFIG.USE_WILL_CHANGE) {
      this.elements.drawer.style.willChange = 'transform, opacity';
    }
    
    // Monitor frame rate during animations
    this.performance.isOptimized = deviceUtils.isHighPerformanceDevice();
    
    // Adjust animation settings for low-end devices
    if (!this.performance.isOptimized) {
      this.elements.drawer.classList.add('reduced-motion');
    }
  }

  /**
   * Bind drawer events
   */
  bindDrawerEvents() {
    // Click handlers
    this.addEventListener(this.elements.drawer, 'click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action) {
        this.handleAction(action, e);
      }
    });

    // Keyboard navigation
    this.addEventListener(this.elements.drawer, 'keydown', (e) => {
      this.handleKeyboardNavigation(e);
    });

    // Focus management
    this.addEventListener(this.elements.drawer, 'focusin', (e) => {
      this.handleFocusIn(e);
    });
  }

  /**
   * Handle various actions
   */
  handleAction(action, event) {
    const element = event.target.closest(`[data-action="${action}"]`);
    
    switch (action) {
      case 'close-drawer':
        this.close();
        break;
        
      case 'open-drawer':
        this.open();
        break;
        
      case 'navigate':
        const page = element.dataset.page;
        if (page) {
          this.navigate(page);
        }
        break;
        
      case 'toggle-section':
        const sectionId = element.dataset.section;
        this.toggleSection(sectionId);
        break;
        
      case 'quick-vote-up':
        this.dispatchEvent('quick-vote', { direction: 'up' });
        break;
        
      case 'quick-super-vote':
        this.dispatchEvent('quick-super-vote', { type: 'super' });
        break;
        
      case 'quick-clan':
        this.dispatchEvent('quick-clan-action', { type: 'quick' });
        break;
        
      case 'toggle-quick-actions':
        this.toggleQuickActions();
        break;
        
      case 'toggle-voice':
        this.toggleVoiceControl();
        break;
        
      case 'show-notifications':
        this.showNotifications();
        break;
        
      case 'gaming-mode':
        this.toggleGamingMode();
        break;
        
      default:
        console.log('Unhandled drawer action:', action);
    }
  }

  /**
   * Navigation methods
   */
  open() {
    if (this.state.isOpen || this.state.isAnimating) return;
    
    this.state.isAnimating = true;
    this.state.lastOpenTime = Date.now();
    
    // Update ARIA attributes
    this.elements.drawer.setAttribute('aria-hidden', 'false');
    
    // Add open class with animation
    this.elements.drawer.classList.add('opening');
    
    requestAnimationFrame(() => {
      this.elements.drawer.classList.add('open');
      
      setTimeout(() => {
        this.elements.drawer.classList.remove('opening');
        this.state.isAnimating = false;
        this.state.isOpen = true;
        
        // Focus management
        this.focusFirstMenuItem();
        
        // Dispatch event
        this.dispatchEvent('drawer-opened');
        
      }, MOBILE_NAV_CONFIG.ANIMATION_DURATION);
    });
  }

  close() {
    if (!this.state.isOpen || this.state.isAnimating) return;
    
    this.state.isAnimating = true;
    
    // Add closing class
    this.elements.drawer.classList.add('closing');
    this.elements.drawer.classList.remove('open');
    
    setTimeout(() => {
      this.elements.drawer.classList.remove('closing');
      this.elements.drawer.setAttribute('aria-hidden', 'true');
      
      this.state.isAnimating = false;
      this.state.isOpen = false;
      
      // Close quick actions if open
      if (this.state.quickActionsOpen) {
        this.closeQuickActions();
      }
      
      // Dispatch event
      this.dispatchEvent('drawer-closed');
      
    }, MOBILE_NAV_CONFIG.ANIMATION_DURATION);
  }

  toggle() {
    if (this.state.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  navigate(page) {
    // Close drawer first
    this.close();
    
    // Use navigation manager if available
    if (window.navigationManager) {
      window.navigationManager.navigateToPage(page);
    } else {
      window.location.href = page;
    }
    
    // Update current page
    setTimeout(() => {
      this.state.currentPage = page;
      this.updateActiveStates();
    }, 100);
  }

  toggleSection(sectionId) {
    if (this.state.expandedSections.has(sectionId)) {
      this.state.expandedSections.delete(sectionId);
    } else {
      this.state.expandedSections.add(sectionId);
    }
    
    this.updateSectionStates();
    this.saveUserPreferences();
  }

  /**
   * Quick actions management
   */
  toggleQuickActions() {
    if (this.state.quickActionsOpen) {
      this.closeQuickActions();
    } else {
      this.openQuickActions();
    }
  }

  openQuickActions() {
    if (!this.elements.fab) return;
    
    const menu = this.elements.fab.querySelector('.quick-actions-menu');
    const btn = this.elements.fab.querySelector('.floating-action-btn');
    
    menu.classList.remove('hidden');
    btn.setAttribute('aria-expanded', 'true');
    this.state.quickActionsOpen = true;
    
    // Auto-close after 5 seconds
    setTimeout(() => {
      if (this.state.quickActionsOpen) {
        this.closeQuickActions();
      }
    }, 5000);
  }

  closeQuickActions() {
    if (!this.elements.fab) return;
    
    const menu = this.elements.fab.querySelector('.quick-actions-menu');
    const btn = this.elements.fab.querySelector('.floating-action-btn');
    
    menu.classList.add('hidden');
    btn.setAttribute('aria-expanded', 'false');
    this.state.quickActionsOpen = false;
  }

  /**
   * Update UI states
   */
  updateActiveStates() {
    // Update drawer navigation tiles
    this.elements.drawer.querySelectorAll('.nav-tile').forEach(tile => {
      const page = tile.dataset.page;
      const isActive = this.isCurrentPage(page);
      
      tile.classList.toggle('active', isActive);
      tile.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
    
    // Update bottom navigation
    if (this.elements.bottomNav) {
      this.elements.bottomNav.querySelectorAll('.bottom-nav-item').forEach(item => {
        const page = item.dataset.page;
        const isActive = page && this.isCurrentPage(page);
        
        item.classList.toggle('active', isActive);
        item.setAttribute('aria-selected', isActive.toString());
      });
    }
  }

  updateSectionStates() {
    this.elements.drawer.querySelectorAll('.nav-section').forEach(section => {
      const sectionId = section.dataset.section;
      const isExpanded = this.state.expandedSections.has(sectionId);
      
      section.classList.toggle('expanded', isExpanded);
      
      const header = section.querySelector('.section-header');
      if (header) {
        header.setAttribute('aria-expanded', isExpanded.toString());
      }
    });
  }

  /**
   * Utility methods
   */
  getCurrentPage() {
    const path = window.location.pathname;
    return path.substring(path.lastIndexOf('/') + 1) || 'index.html';
  }

  isCurrentPage(page) {
    return this.state.currentPage === page;
  }

  formatBadge(badge) {
    if (!badge) return null;
    return badge.toString();
  }

  createElement(tag, attributes = {}) {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    
    return element;
  }

  addEventListener(element, event, handler, options = {}) {
    element.addEventListener(event, handler, options);
    this.eventListeners.set(`${event}-${Math.random()}`, { element, event, handler });
  }

  dispatchEvent(eventName, detail = {}) {
    const event = new CustomEvent(`mlg-drawer-${eventName}`, {
      detail: { ...detail, drawer: this }
    });
    
    document.dispatchEvent(event);
  }

  /**
   * Focus management
   */
  focusFirstMenuItem() {
    const firstMenuItem = this.elements.drawer.querySelector('.nav-tile:not([aria-current="page"])');
    if (firstMenuItem) {
      firstMenuItem.focus();
    }
  }

  handleKeyboardNavigation(e) {
    switch (e.key) {
      case 'Escape':
        this.close();
        break;
        
      case 'Tab':
        // Let default tab behavior handle focus management
        break;
        
      case 'ArrowDown':
      case 'ArrowUp':
        this.handleArrowNavigation(e);
        break;
    }
  }

  handleArrowNavigation(e) {
    e.preventDefault();
    
    const focusableElements = this.elements.drawer.querySelectorAll(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);
    let nextIndex;
    
    if (e.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % focusableElements.length;
    } else {
      nextIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length;
    }
    
    focusableElements[nextIndex]?.focus();
  }

  handleFocusIn(e) {
    // Ensure focused element is visible
    e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Accessibility features
   */
  setupAccessibilityFeatures() {
    // Screen reader announcements
    this.announcementRegion = this.createElement('div', {
      'aria-live': 'polite',
      'aria-atomic': 'true',
      'class': 'sr-only'
    });
    
    document.body.appendChild(this.announcementRegion);
    
    // High contrast mode detection
    if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
      this.elements.drawer.classList.add('high-contrast');
    }
    
    // Reduced motion detection
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.elements.drawer.classList.add('reduced-motion');
    }
  }

  announceToScreenReader(message) {
    if (this.announcementRegion) {
      this.announcementRegion.textContent = message;
    }
  }

  /**
   * Keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    this.addEventListener(document, 'keydown', (e) => {
      // Only handle shortcuts when drawer is closed or as global shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'm':
            e.preventDefault();
            this.toggle();
            this.announceToScreenReader(
              this.state.isOpen ? 'Navigation menu opened' : 'Navigation menu closed'
            );
            break;
            
          case 'h':
            e.preventDefault();
            this.navigate('index.html');
            break;
            
          case 'v':
            e.preventDefault();
            this.navigate('voting.html');
            break;
            
          case 'c':
            e.preventDefault();
            this.navigate('clans.html');
            break;
        }
      }
    });
  }

  /**
   * Connect to navigation manager
   */
  connectToNavigationManager() {
    if (window.navigationManager) {
      // Listen for navigation events
      window.addEventListener('router:navigate', (e) => {
        if (e.detail && e.detail.to) {
          const pageName = e.detail.to.replace('/', '').replace('dashboard', 'index') + '.html';
          this.state.currentPage = pageName;
          this.updateActiveStates();
        }
      });
    }
  }

  /**
   * User preferences
   */
  async loadUserPreferences() {
    try {
      const stored = localStorage.getItem('mlg-mobile-nav-preferences');
      if (stored) {
        const preferences = JSON.parse(stored);
        
        // Restore expanded sections
        if (preferences.expandedSections) {
          this.state.expandedSections = new Set(preferences.expandedSections);
        }
        
        // Restore notification count
        if (preferences.notificationCount) {
          this.state.notificationCount = preferences.notificationCount;
        }
        
        // Update UI
        this.updateSectionStates();
        this.updateNotificationDisplay();
      }
    } catch (error) {
      console.warn('Failed to load navigation preferences:', error);
    }
  }

  saveUserPreferences() {
    try {
      const preferences = {
        expandedSections: Array.from(this.state.expandedSections),
        notificationCount: this.state.notificationCount,
        lastSaved: Date.now()
      };
      
      localStorage.setItem('mlg-mobile-nav-preferences', JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save navigation preferences:', error);
    }
  }

  /**
   * Notification management
   */
  updateNotificationCount(count) {
    this.state.notificationCount = Math.max(0, count);
    this.updateNotificationDisplay();
    this.saveUserPreferences();
  }

  updateNotificationDisplay() {
    const badge = this.elements.drawer.querySelector('.notification-count');
    const bottomNavBadges = this.elements.bottomNav?.querySelectorAll('.nav-badge');
    
    if (badge) {
      const count = this.state.notificationCount;
      const displayCount = count > MOBILE_NAV_CONFIG.NOTIFICATION_LIMIT ? 
        `${MOBILE_NAV_CONFIG.NOTIFICATION_LIMIT}+` : count.toString();
      
      badge.textContent = displayCount;
      badge.parentElement.style.display = count > 0 ? '' : 'none';
    }
    
    // Update bottom navigation badges
    if (bottomNavBadges) {
      bottomNavBadges.forEach(badge => {
        // Update specific badges based on content
        const navItem = badge.closest('.bottom-nav-item');
        const navId = navItem?.dataset.navId;
        
        if (navId === 'vote' && this.state.notificationCount > 0) {
          badge.textContent = '🔥';
        }
      });
    }
  }

  /**
   * Feature toggles
   */
  toggleVoiceControl() {
    this.options.enableVoiceControl = !this.options.enableVoiceControl;
    
    this.dispatchEvent('voice-control-toggled', {
      enabled: this.options.enableVoiceControl
    });
    
    this.announceToScreenReader(
      `Voice control ${this.options.enableVoiceControl ? 'enabled' : 'disabled'}`
    );
  }

  toggleGamingMode() {
    document.body.classList.toggle('gaming-mode-active');
    
    const isActive = document.body.classList.contains('gaming-mode-active');
    
    this.dispatchEvent('gaming-mode-toggled', { enabled: isActive });
    
    this.announceToScreenReader(
      `Gaming mode ${isActive ? 'activated' : 'deactivated'}`
    );
  }

  showNotifications() {
    this.dispatchEvent('show-notifications');
    this.close();
  }

  /**
   * Public API methods
   */
  isOpen() {
    return this.state.isOpen;
  }

  getState() {
    return { ...this.state };
  }

  updateConfig(newConfig) {
    this.options = { ...this.options, ...newConfig };
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    console.log('🔥 Destroying Mobile Navigation Drawer...');
    
    // Clear timers
    clearTimeout(this.gestureState.longPressTimer);
    
    // Remove event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners.clear();
    
    // Remove DOM elements
    if (this.elements.drawer) {
      this.elements.drawer.remove();
    }
    
    if (this.elements.bottomNav) {
      this.elements.bottomNav.remove();
    }
    
    if (this.elements.fab) {
      this.elements.fab.remove();
    }
    
    if (this.announcementRegion) {
      this.announcementRegion.remove();
    }
    
    // Clear references
    this.elements = {};
    this.state = {};
    this.gestureState = {};
    this.performance = {};
    
    console.log('✅ Mobile Navigation Drawer destroyed');
  }
}

// Auto-initialize for mobile devices
if (typeof window !== 'undefined' && deviceUtils.isMobile()) {
  document.addEventListener('DOMContentLoaded', () => {
    const drawer = new MobileNavigationDrawer({
      enableGestures: true,
      enableEdgeSwipe: true,
      enableQuickActions: true,
      enableNotifications: true
    });
    
    // Make globally available
    window.mobileNavDrawer = drawer;
    
    console.log('📱 Mobile Navigation Drawer auto-initialized');
  });
}

export default MobileNavigationDrawer;