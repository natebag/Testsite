/**
 * MLG.clan Mobile Gaming UI Components
 * 
 * Gaming-optimized mobile UI components with comprehensive typography and button system
 * Designed for Xbox 360 dashboard aesthetic with competitive gaming readability
 * 
 * Features:
 * - Context-aware component sizing (tournament, clan, voting modes)
 * - High-contrast gaming typography for competitive scenarios
 * - WCAG compliant touch targets and accessibility
 * - Performance-optimized rendering
 * - Cross-device compatibility
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 */

class MobileGamingUIComponents {
  constructor() {
    this.currentMode = 'default';
    this.initialized = false;
    this.touchFeedbackEnabled = true;
    this.accessibilityMode = false;
    this.performanceMode = false;
    
    this.initialize();
  }

  /**
   * Initialize the mobile gaming UI system
   */
  initialize() {
    if (this.initialized) return;

    this.detectDeviceCapabilities();
    this.setupEventListeners();
    this.loadAccessibilityPreferences();
    this.setupPerformanceMonitoring();
    this.initialized = true;

    console.log('MLG Mobile Gaming UI Components initialized');
  }

  /**
   * Detect device capabilities and optimize accordingly
   */
  detectDeviceCapabilities() {
    // Detect device type
    this.isMobile = window.innerWidth <= 768;
    this.isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
    this.isTouch = 'ontouchstart' in window;
    this.supportsHover = window.matchMedia('(hover: hover)').matches;
    
    // Performance detection
    this.lowEndDevice = navigator.hardwareConcurrency <= 2;
    this.lowBandwidth = navigator.connection?.effectiveType === 'slow-2g' || 
                       navigator.connection?.effectiveType === '2g';
    
    // Battery status
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        this.batteryLevel = battery.level;
        this.charging = battery.charging;
        this.updatePerformanceMode();
      });
    }

    // Set body classes for device-specific optimizations
    document.body.classList.toggle('mobile-device', this.isMobile);
    document.body.classList.toggle('tablet-device', this.isTablet);
    document.body.classList.toggle('touch-device', this.isTouch);
    document.body.classList.toggle('low-end-device', this.lowEndDevice);
  }

  /**
   * Setup event listeners for touch interactions and accessibility
   */
  setupEventListeners() {
    // Touch feedback system
    if (this.isTouch) {
      this.setupTouchFeedback();
    }

    // Keyboard navigation support
    this.setupKeyboardNavigation();

    // Resize handler for responsive adjustments
    window.addEventListener('resize', this.handleResize.bind(this));

    // Orientation change handler
    window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));

    // Visibility change for performance optimization
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  /**
   * Setup touch feedback for gaming interactions
   */
  setupTouchFeedback() {
    document.addEventListener('touchstart', (e) => {
      const target = e.target.closest('.gaming-btn, .gaming-fab, [data-gaming-interactive]');
      if (target && this.touchFeedbackEnabled) {
        this.addTouchFeedback(target);
      }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const target = e.target.closest('.gaming-btn, .gaming-fab, [data-gaming-interactive]');
      if (target) {
        this.removeTouchFeedback(target);
      }
    }, { passive: true });
  }

  /**
   * Add visual touch feedback to interactive elements
   */
  addTouchFeedback(element) {
    element.classList.add('touch-active');
    
    // Add ripple effect if enabled
    if (element.classList.contains('gaming-btn-ripple')) {
      element.classList.add('ripple-active');
      setTimeout(() => element.classList.remove('ripple-active'), 300);
    }

    // Haptic feedback if supported
    if (navigator.vibrate && !this.performanceMode) {
      navigator.vibrate(50);
    }
  }

  /**
   * Remove touch feedback
   */
  removeTouchFeedback(element) {
    setTimeout(() => {
      element.classList.remove('touch-active');
    }, 150);
  }

  /**
   * Setup keyboard navigation for accessibility
   */
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-focused');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-focused');
    });
  }

  /**
   * Load accessibility preferences
   */
  loadAccessibilityPreferences() {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      document.body.classList.add('prefers-reduced-motion');
    }

    // Check for high contrast preference
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    if (prefersHighContrast) {
      document.body.classList.add('high-contrast-mode');
    }

    // Check for dark mode preference
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDarkMode) {
      document.body.classList.add('dark-mode');
    }
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    // Monitor frame rate
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        if (fps < 30 && !this.performanceMode) {
          this.enablePerformanceMode();
        } else if (fps > 50 && this.performanceMode) {
          this.disablePerformanceMode();
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  /**
   * Update performance mode based on battery status
   */
  updatePerformanceMode() {
    if (this.batteryLevel < 0.2 && !this.charging) {
      this.enablePerformanceMode();
      document.body.classList.add('low-battery-mode');
    } else {
      document.body.classList.remove('low-battery-mode');
    }
  }

  /**
   * Enable performance mode to conserve resources
   */
  enablePerformanceMode() {
    this.performanceMode = true;
    document.body.classList.add('performance-mode');
    this.touchFeedbackEnabled = false;
    
    console.log('Performance mode enabled');
  }

  /**
   * Disable performance mode
   */
  disablePerformanceMode() {
    this.performanceMode = false;
    document.body.classList.remove('performance-mode');
    this.touchFeedbackEnabled = true;
    
    console.log('Performance mode disabled');
  }

  /**
   * Set gaming mode context for optimal UI sizing
   */
  setGamingMode(mode) {
    // Remove previous mode classes
    document.body.classList.remove(
      'tournament-mode',
      'clan-mode', 
      'voting-mode',
      'profile-mode',
      'social-mode'
    );

    // Set new mode
    this.currentMode = mode;
    document.body.classList.add(`${mode}-mode`);

    console.log(`Gaming mode set to: ${mode}`);
  }

  /**
   * Handle window resize events
   */
  handleResize() {
    this.detectDeviceCapabilities();
    this.adjustComponentSizing();
  }

  /**
   * Handle orientation change events
   */
  handleOrientationChange() {
    setTimeout(() => {
      this.detectDeviceCapabilities();
      this.adjustComponentSizing();
    }, 100);
  }

  /**
   * Handle visibility change for performance optimization
   */
  handleVisibilityChange() {
    if (document.hidden) {
      this.enablePerformanceMode();
    } else {
      setTimeout(() => {
        if (!this.lowEndDevice && this.batteryLevel > 0.2) {
          this.disablePerformanceMode();
        }
      }, 1000);
    }
  }

  /**
   * Adjust component sizing based on current context
   */
  adjustComponentSizing() {
    // Adjust for one-handed usage on mobile
    if (this.isMobile && window.innerHeight > window.innerWidth) {
      document.body.classList.add('one-handed-mode');
    } else {
      document.body.classList.remove('one-handed-mode');
    }

    // Adjust for thumb reach zones
    this.updateThumbZones();
  }

  /**
   * Update thumb reach zones for one-handed usage
   */
  updateThumbZones() {
    const buttons = document.querySelectorAll('.gaming-btn, .gaming-fab');
    
    buttons.forEach(button => {
      const rect = button.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const screenHeight = window.innerHeight;
      
      // Calculate thumb reach zone
      if (centerY < screenHeight * 0.4) {
        button.classList.add('thumb-zone-hard');
        button.classList.remove('thumb-zone-moderate', 'thumb-zone-easy');
      } else if (centerY < screenHeight * 0.7) {
        button.classList.add('thumb-zone-moderate');
        button.classList.remove('thumb-zone-hard', 'thumb-zone-easy');
      } else {
        button.classList.add('thumb-zone-easy');
        button.classList.remove('thumb-zone-hard', 'thumb-zone-moderate');
      }
    });
  }

  /**
   * Create a gaming button with optimal mobile sizing
   */
  createGamingButton(options = {}) {
    const {
      text = 'Button',
      type = 'primary',
      size = 'standard',
      icon = null,
      onClick = () => {},
      disabled = false,
      ripple = true,
      ariaLabel = text
    } = options;

    const button = document.createElement('button');
    button.className = `gaming-btn gaming-btn-${type} gaming-btn-${size}`;
    
    if (ripple) {
      button.classList.add('gaming-btn-ripple');
    }
    
    if (disabled) {
      button.disabled = true;
    }

    // Accessibility attributes
    button.setAttribute('aria-label', ariaLabel);
    button.setAttribute('role', 'button');
    button.setAttribute('tabindex', disabled ? '-1' : '0');

    // Button content
    const content = document.createElement('span');
    content.className = 'button-content';
    
    if (icon) {
      const iconElement = document.createElement('span');
      iconElement.className = 'button-icon';
      iconElement.innerHTML = icon;
      content.appendChild(iconElement);
    }
    
    const textElement = document.createElement('span');
    textElement.className = 'button-text';
    textElement.textContent = text;
    content.appendChild(textElement);

    button.appendChild(content);

    // Event listeners
    button.addEventListener('click', onClick);
    
    // Screen reader support
    const srText = document.createElement('span');
    srText.className = 'sr-only';
    srText.textContent = `${text} button`;
    button.appendChild(srText);

    return button;
  }

  /**
   * Create a gaming text element with optimal mobile typography
   */
  createGamingText(options = {}) {
    const {
      text = '',
      type = 'body',
      color = 'primary',
      element = 'span',
      className = ''
    } = options;

    const textElement = document.createElement(element);
    textElement.className = `gaming-text-${type} gaming-text-${color} ${className}`.trim();
    textElement.textContent = text;

    return textElement;
  }

  /**
   * Create a tournament bracket text element
   */
  createTournamentBracketText(teamName, score = null) {
    const container = document.createElement('div');
    container.className = 'tournament-bracket-container';

    const nameElement = this.createGamingText({
      text: teamName,
      element: 'div',
      className: 'tournament-team-name'
    });
    container.appendChild(nameElement);

    if (score !== null) {
      const scoreElement = this.createGamingText({
        text: score.toString(),
        element: 'div',
        className: 'tournament-score'
      });
      container.appendChild(scoreElement);
    }

    return container;
  }

  /**
   * Create a leaderboard entry with proper mobile typography
   */
  createLeaderboardEntry(rank, playerName, score, change = 0) {
    const entry = document.createElement('div');
    entry.className = 'leaderboard-entry';

    const rankElement = this.createGamingText({
      text: rank.toString(),
      element: 'div',
      className: 'leaderboard-rank'
    });

    const playerElement = this.createGamingText({
      text: playerName,
      element: 'div',
      className: 'leaderboard-player'
    });

    const scoreElement = this.createGamingText({
      text: score.toString(),
      element: 'div',
      className: 'leaderboard-score'
    });

    const changeElement = this.createGamingText({
      text: change > 0 ? `+${change}` : change.toString(),
      element: 'div',
      className: `leaderboard-change ${change > 0 ? 'up' : change < 0 ? 'down' : 'same'}`
    });

    entry.appendChild(rankElement);
    entry.appendChild(playerElement);
    entry.appendChild(scoreElement);
    entry.appendChild(changeElement);

    return entry;
  }

  /**
   * Create a clan member entry with role-based typography
   */
  createClanMemberEntry(memberName, role, stats = {}) {
    const entry = document.createElement('div');
    entry.className = 'clan-member-entry';

    const nameElement = this.createGamingText({
      text: memberName,
      element: 'div',
      className: 'clan-member-name'
    });

    const roleElement = this.createGamingText({
      text: role,
      element: 'div',
      className: `clan-role-text clan-role-${role.toLowerCase()}`
    });

    const statsContainer = document.createElement('div');
    statsContainer.className = 'clan-member-stats';

    Object.entries(stats).forEach(([key, value]) => {
      const statElement = document.createElement('div');
      statElement.className = 'clan-stat-item';
      
      const labelElement = this.createGamingText({
        text: key,
        element: 'span',
        className: 'gaming-stat-label'
      });
      
      const valueElement = this.createGamingText({
        text: value.toString(),
        element: 'span',
        className: 'gaming-stat-value'
      });

      statElement.appendChild(labelElement);
      statElement.appendChild(valueElement);
      statsContainer.appendChild(statElement);
    });

    entry.appendChild(nameElement);
    entry.appendChild(roleElement);
    entry.appendChild(statsContainer);

    return entry;
  }

  /**
   * Create a voting proposal with optimal mobile readability
   */
  createVotingProposal(title, description, stats = {}) {
    const proposal = document.createElement('div');
    proposal.className = 'voting-proposal';

    const titleElement = this.createGamingText({
      text: title,
      element: 'h3',
      className: 'voting-proposal-title'
    });

    const descriptionElement = this.createGamingText({
      text: description,
      element: 'p',
      className: 'voting-proposal-description'
    });

    const statsContainer = document.createElement('div');
    statsContainer.className = 'voting-proposal-stats';

    Object.entries(stats).forEach(([key, value]) => {
      const statElement = this.createGamingText({
        text: `${key}: ${value}`,
        element: 'div',
        className: 'voting-stats-text'
      });
      statsContainer.appendChild(statElement);
    });

    // Vote buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'gaming-btn-group-horizontal';

    const voteButton = this.createGamingButton({
      text: 'Vote',
      type: 'vote',
      size: 'important',
      onClick: () => this.handleVote('normal'),
      ariaLabel: `Vote for ${title}`
    });

    const superVoteButton = this.createGamingButton({
      text: 'Super Vote',
      type: 'super-vote',
      size: 'important',
      onClick: () => this.handleVote('super'),
      ariaLabel: `Super vote for ${title}`
    });

    buttonContainer.appendChild(voteButton);
    buttonContainer.appendChild(superVoteButton);

    proposal.appendChild(titleElement);
    proposal.appendChild(descriptionElement);
    proposal.appendChild(statsContainer);
    proposal.appendChild(buttonContainer);

    return proposal;
  }

  /**
   * Handle voting actions
   */
  handleVote(type) {
    console.log(`${type} vote cast`);
    // Implement voting logic here
  }

  /**
   * Create a floating action button for quick actions
   */
  createFloatingActionButton(icon, onClick, ariaLabel = 'Quick action') {
    const fab = document.createElement('button');
    fab.className = 'gaming-fab';
    fab.innerHTML = icon;
    fab.setAttribute('aria-label', ariaLabel);
    fab.setAttribute('role', 'button');
    fab.addEventListener('click', onClick);

    return fab;
  }

  /**
   * Get current device and mode information
   */
  getDeviceInfo() {
    return {
      isMobile: this.isMobile,
      isTablet: this.isTablet,
      isTouch: this.isTouch,
      supportsHover: this.supportsHover,
      currentMode: this.currentMode,
      performanceMode: this.performanceMode,
      batteryLevel: this.batteryLevel,
      lowEndDevice: this.lowEndDevice
    };
  }

  /**
   * Cleanup and destroy the component system
   */
  destroy() {
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleOrientationChange);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    // Clear performance monitoring
    this.initialized = false;
    
    console.log('MLG Mobile Gaming UI Components destroyed');
  }
}

// Initialize the global instance
window.MLGMobileUI = new MobileGamingUIComponents();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileGamingUIComponents;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.MLGMobileUI.initialize();
  });
} else {
  window.MLGMobileUI.initialize();
}