/**
 * MLG.clan Gaming-Specific Swipe Navigation
 * 
 * Implements swipe navigation between gaming sections with context awareness
 * Optimized for gaming workflows and Xbox 360-inspired navigation patterns
 * 
 * Features:
 * - Section-to-section swipe navigation (voting, leaderboards, clans, tournaments)
 * - Gaming context-aware swipe behaviors
 * - Swipe-to-vote gestures with haptic feedback
 * - Tournament bracket navigation with pinch and swipe
 * - Clan member management with contextual swipe actions
 * - Smooth page transitions with Xbox 360 aesthetic
 * - Performance optimization for gaming scenarios
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 */

import MLGSwipeGestures, { SWIPE_DIRECTIONS, GAMING_CONTEXTS } from './mlg-swipe-gesture-system.js';

/**
 * Gaming Navigation Configuration
 */
const GAMING_NAV_CONFIG = {
  // Section navigation
  SECTION_SWIPE_THRESHOLD: 100,
  QUICK_NAV_THRESHOLD: 80,
  
  // Page transition timing
  TRANSITION_DURATION: 300,
  XBOX_TRANSITION_DURATION: 250,
  
  // Navigation paths
  NAVIGATION_PATHS: {
    [GAMING_CONTEXTS.HOME]: {
      left: GAMING_CONTEXTS.PROFILE,
      right: GAMING_CONTEXTS.VOTING,
      up: GAMING_CONTEXTS.LEADERBOARDS,
      down: GAMING_CONTEXTS.CLANS
    },
    [GAMING_CONTEXTS.VOTING]: {
      left: GAMING_CONTEXTS.HOME,
      right: GAMING_CONTEXTS.TOURNAMENTS,
      up: GAMING_CONTEXTS.LEADERBOARDS,
      down: GAMING_CONTEXTS.CLANS
    },
    [GAMING_CONTEXTS.LEADERBOARDS]: {
      left: GAMING_CONTEXTS.CLANS,
      right: GAMING_CONTEXTS.TOURNAMENTS,
      up: GAMING_CONTEXTS.CLIPS,
      down: GAMING_CONTEXTS.HOME
    },
    [GAMING_CONTEXTS.CLANS]: {
      left: GAMING_CONTEXTS.VOTING,
      right: GAMING_CONTEXTS.PROFILE,
      up: GAMING_CONTEXTS.HOME,
      down: GAMING_CONTEXTS.TOURNAMENTS
    },
    [GAMING_CONTEXTS.TOURNAMENTS]: {
      left: GAMING_CONTEXTS.LEADERBOARDS,
      right: GAMING_CONTEXTS.CLIPS,
      up: GAMING_CONTEXTS.VOTING,
      down: GAMING_CONTEXTS.PROFILE
    },
    [GAMING_CONTEXTS.PROFILE]: {
      left: GAMING_CONTEXTS.TOURNAMENTS,
      right: GAMING_CONTEXTS.HOME,
      up: GAMING_CONTEXTS.CLIPS,
      down: GAMING_CONTEXTS.CLANS
    },
    [GAMING_CONTEXTS.CLIPS]: {
      left: GAMING_CONTEXTS.PROFILE,
      right: GAMING_CONTEXTS.LEADERBOARDS,
      up: null, // No navigation up from clips
      down: GAMING_CONTEXTS.TOURNAMENTS
    }
  },
  
  // Section URLs
  SECTION_URLS: {
    [GAMING_CONTEXTS.HOME]: '/',
    [GAMING_CONTEXTS.VOTING]: '/voting.html',
    [GAMING_CONTEXTS.LEADERBOARDS]: '/content.html',
    [GAMING_CONTEXTS.CLANS]: '/clans.html',
    [GAMING_CONTEXTS.TOURNAMENTS]: '/dao.html',
    [GAMING_CONTEXTS.PROFILE]: '/profile.html',
    [GAMING_CONTEXTS.CLIPS]: '/content.html#clips'
  },
  
  // Haptic patterns
  NAVIGATION_HAPTICS: {
    SECTION_CHANGE: [30, 20, 30],
    QUICK_NAV: [20],
    BLOCKED_NAV: [50, 100, 50],
    VOTE_CONFIRM: [25, 50, 25],
    CLAN_ACTION: [40, 30, 40]
  }
};

/**
 * Gaming Swipe Navigation Manager
 */
export class MLGGamingSwipeNavigation {
  constructor(options = {}) {
    this.options = {
      ...GAMING_NAV_CONFIG,
      enableSectionNavigation: true,
      enableVotingGestures: true,
      enableClanGestures: true,
      enableTournamentGestures: true,
      enableQuickActions: true,
      enableHapticFeedback: true,
      debugMode: process.env.NODE_ENV === 'development',
      ...options
    };

    // Navigation state
    this.navigationState = {
      currentSection: this.getCurrentSection(),
      isNavigating: false,
      navigationHistory: [],
      quickActionsEnabled: true,
      gestureRecognitionActive: true
    };

    // Gaming interaction state
    this.gamingState = {
      activeVotingSession: null,
      activeClanContext: null,
      activeTournamentContext: null,
      quickActionMode: false
    };

    // Performance tracking
    this.performanceMetrics = {
      navigationLatency: 0,
      gestureAccuracy: 0,
      userSatisfaction: 1.0
    };

    this.init();
  }

  /**
   * Initialize gaming swipe navigation
   */
  async init() {
    console.log('🎮 Initializing Gaming Swipe Navigation...');

    try {
      // Setup section navigation gestures
      if (this.options.enableSectionNavigation) {
        this.setupSectionNavigation();
      }

      // Setup voting gestures
      if (this.options.enableVotingGestures) {
        this.setupVotingGestures();
      }

      // Setup clan management gestures
      if (this.options.enableClanGestures) {
        this.setupClanGestures();
      }

      // Setup tournament navigation gestures
      if (this.options.enableTournamentGestures) {
        this.setupTournamentGestures();
      }

      // Setup quick action gestures
      if (this.options.enableQuickActions) {
        this.setupQuickActionGestures();
      }

      // Setup navigation indicators
      this.setupNavigationIndicators();

      // Setup page transition handlers
      this.setupPageTransitions();

      console.log('✅ Gaming Swipe Navigation initialized');

      // Dispatch initialization event
      document.dispatchEvent(new CustomEvent('mlg-swipe-nav-initialized', {
        detail: {
          currentSection: this.navigationState.currentSection,
          availableGestures: this.getAvailableGestures()
        }
      }));

    } catch (error) {
      console.error('❌ Failed to initialize gaming swipe navigation:', error);
      throw error;
    }
  }

  /**
   * Setup section-to-section navigation
   */
  setupSectionNavigation() {
    const currentSection = this.navigationState.currentSection;
    const availablePaths = this.options.NAVIGATION_PATHS[currentSection];

    if (!availablePaths) {
      console.warn(`No navigation paths defined for section: ${currentSection}`);
      return;
    }

    // Register global section navigation gestures
    Object.entries(availablePaths).forEach(([direction, targetSection]) => {
      if (targetSection) {
        MLGSwipeGestures.registerGamingGesture(`nav-${direction}-${targetSection}`, {
          direction: this.directionToSwipeDirection(direction),
          context: 'global',
          minDistance: this.options.SECTION_SWIPE_THRESHOLD,
          hapticPattern: this.options.NAVIGATION_HAPTICS.SECTION_CHANGE,
          action: (data) => this.handleSectionNavigation(targetSection, direction, data)
        });
      }
    });

    console.log(`🧭 Section navigation setup for: ${currentSection}`);
  }

  /**
   * Setup voting-specific gestures
   */
  setupVotingGestures() {
    // Swipe up to vote up
    MLGSwipeGestures.registerGamingGesture('vote-up-swipe', {
      direction: SWIPE_DIRECTIONS.UP,
      context: GAMING_CONTEXTS.VOTING,
      minDistance: 60,
      maxDistance: 150,
      hapticPattern: this.options.NAVIGATION_HAPTICS.VOTE_CONFIRM,
      action: (data) => this.handleVoteSwipe('up', data)
    });

    // Swipe down to vote down
    MLGSwipeGestures.registerGamingGesture('vote-down-swipe', {
      direction: SWIPE_DIRECTIONS.DOWN,
      context: GAMING_CONTEXTS.VOTING,
      minDistance: 60,
      maxDistance: 150,
      hapticPattern: this.options.NAVIGATION_HAPTICS.VOTE_CONFIRM,
      action: (data) => this.handleVoteSwipe('down', data)
    });

    // Long press for super vote
    MLGSwipeGestures.registerGamingGesture('super-vote-longpress', {
      type: 'long-press',
      context: GAMING_CONTEXTS.VOTING,
      minDuration: 800,
      hapticPattern: [50, 100, 50, 100, 50],
      action: (data) => this.handleSuperVoteGesture(data)
    });

    // Quick double-tap for favorite
    MLGSwipeGestures.registerGamingGesture('vote-favorite', {
      type: 'double-tap',
      context: GAMING_CONTEXTS.VOTING,
      maxInterval: 300,
      hapticPattern: [25, 25, 25],
      action: (data) => this.handleFavoriteGesture(data)
    });

    console.log('🗳️ Voting gestures configured');
  }

  /**
   * Setup clan management gestures
   */
  setupClanGestures() {
    // Swipe left on clan member for actions
    MLGSwipeGestures.registerGamingGesture('clan-member-actions', {
      direction: SWIPE_DIRECTIONS.LEFT,
      context: GAMING_CONTEXTS.CLANS,
      minDistance: 80,
      selector: '[data-clan-member]',
      hapticPattern: this.options.NAVIGATION_HAPTICS.CLAN_ACTION,
      action: (data) => this.handleClanMemberSwipe(data)
    });

    // Swipe right on clan member for quick promote
    MLGSwipeGestures.registerGamingGesture('clan-member-promote', {
      direction: SWIPE_DIRECTIONS.RIGHT,
      context: GAMING_CONTEXTS.CLANS,
      minDistance: 80,
      selector: '[data-clan-member]',
      hapticPattern: [30, 50, 30],
      action: (data) => this.handleClanMemberPromote(data)
    });

    // Swipe down on clan card for clan details
    MLGSwipeGestures.registerGamingGesture('clan-details', {
      direction: SWIPE_DIRECTIONS.DOWN,
      context: GAMING_CONTEXTS.CLANS,
      minDistance: 70,
      selector: '[data-clan-card]',
      hapticPattern: [40],
      action: (data) => this.handleClanDetailsSwipe(data)
    });

    // Pull down for clan refresh
    MLGSwipeGestures.registerGamingGesture('clan-refresh', {
      direction: SWIPE_DIRECTIONS.DOWN,
      context: GAMING_CONTEXTS.CLANS,
      minDistance: 120,
      fromTop: true,
      hapticPattern: [30, 60, 30],
      action: (data) => this.handleClanRefresh(data)
    });

    console.log('👥 Clan gestures configured');
  }

  /**
   * Setup tournament navigation gestures
   */
  setupTournamentGestures() {
    // Swipe left/right for tournament bracket navigation
    MLGSwipeGestures.registerGamingGesture('tournament-navigate', {
      direction: [SWIPE_DIRECTIONS.LEFT, SWIPE_DIRECTIONS.RIGHT],
      context: GAMING_CONTEXTS.TOURNAMENTS,
      minDistance: 70,
      selector: '[data-tournament-bracket]',
      hapticPattern: [25, 25],
      action: (data) => this.handleTournamentNavigation(data)
    });

    // Pinch to zoom tournament bracket
    MLGSwipeGestures.registerGamingGesture('tournament-zoom', {
      type: 'pinch',
      context: GAMING_CONTEXTS.TOURNAMENTS,
      selector: '[data-tournament-bracket]',
      action: (data) => this.handleTournamentZoom(data)
    });

    // Swipe up on tournament card to join
    MLGSwipeGestures.registerGamingGesture('tournament-join', {
      direction: SWIPE_DIRECTIONS.UP,
      context: GAMING_CONTEXTS.TOURNAMENTS,
      minDistance: 60,
      selector: '[data-tournament-card]',
      hapticPattern: [50, 25, 50],
      action: (data) => this.handleTournamentJoin(data)
    });

    // Long press on tournament for details
    MLGSwipeGestures.registerGamingGesture('tournament-details', {
      type: 'long-press',
      context: GAMING_CONTEXTS.TOURNAMENTS,
      minDuration: 600,
      selector: '[data-tournament-card]',
      hapticPattern: [40, 80, 40],
      action: (data) => this.handleTournamentDetails(data)
    });

    console.log('🏆 Tournament gestures configured');
  }

  /**
   * Setup quick action gestures
   */
  setupQuickActionGestures() {
    // Two-finger swipe down for quick menu
    MLGSwipeGestures.registerGamingGesture('quick-menu', {
      direction: SWIPE_DIRECTIONS.DOWN,
      context: 'global',
      minDistance: 80,
      multiTouch: true,
      touchCount: 2,
      hapticPattern: [30, 60, 30],
      action: (data) => this.handleQuickMenu(data)
    });

    // Three-finger swipe left for back navigation
    MLGSwipeGestures.registerGamingGesture('quick-back', {
      direction: SWIPE_DIRECTIONS.LEFT,
      context: 'global',
      minDistance: 60,
      multiTouch: true,
      touchCount: 3,
      hapticPattern: [20, 20, 20],
      action: (data) => this.handleQuickBack(data)
    });

    // Edge swipe from bottom for gaming toolbar
    MLGSwipeGestures.registerGamingGesture('gaming-toolbar', {
      direction: SWIPE_DIRECTIONS.UP,
      context: 'global',
      minDistance: 50,
      fromEdge: 'bottom',
      hapticPattern: [40, 20, 40],
      action: (data) => this.handleGamingToolbar(data)
    });

    console.log('⚡ Quick action gestures configured');
  }

  /**
   * Navigation handlers
   */
  handleSectionNavigation(targetSection, direction, data) {
    if (this.navigationState.isNavigating) {
      console.log('Navigation already in progress, ignoring gesture');
      return;
    }

    console.log(`🧭 Navigating from ${this.navigationState.currentSection} to ${targetSection} (${direction})`);

    this.navigationState.isNavigating = true;
    
    // Record navigation in history
    this.navigationState.navigationHistory.push({
      from: this.navigationState.currentSection,
      to: targetSection,
      direction,
      timestamp: Date.now(),
      gestureData: data
    });

    // Start navigation with Xbox-style transition
    this.executePageTransition(targetSection, direction);
  }

  async executePageTransition(targetSection, direction) {
    const startTime = performance.now();
    const targetUrl = this.options.SECTION_URLS[targetSection];

    try {
      // Create Xbox-style transition effect
      await this.createXboxTransition(direction);

      // Navigate to target section
      if (targetUrl) {
        window.location.href = targetUrl;
      }

      // Update state
      this.navigationState.currentSection = targetSection;
      
      // Calculate navigation latency
      this.performanceMetrics.navigationLatency = performance.now() - startTime;

      console.log(`✅ Navigation completed to ${targetSection} in ${this.performanceMetrics.navigationLatency.toFixed(2)}ms`);

    } catch (error) {
      console.error('❌ Navigation failed:', error);
      
      // Provide error haptic feedback
      if (this.options.enableHapticFeedback && navigator.vibrate) {
        navigator.vibrate(this.options.NAVIGATION_HAPTICS.BLOCKED_NAV);
      }
    } finally {
      this.navigationState.isNavigating = false;
    }
  }

  async createXboxTransition(direction) {
    // Create Xbox 360-style slide transition
    const transitionOverlay = document.createElement('div');
    transitionOverlay.className = 'xbox-transition-overlay';
    transitionOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
      z-index: 9999;
      opacity: 0;
      transition: opacity ${this.options.XBOX_TRANSITION_DURATION}ms ease-out;
      pointer-events: none;
    `;

    document.body.appendChild(transitionOverlay);

    // Animate transition
    requestAnimationFrame(() => {
      transitionOverlay.style.opacity = '1';
    });

    // Wait for transition
    await new Promise(resolve => {
      setTimeout(resolve, this.options.XBOX_TRANSITION_DURATION);
    });

    // Clean up
    setTimeout(() => {
      if (transitionOverlay.parentNode) {
        transitionOverlay.parentNode.removeChild(transitionOverlay);
      }
    }, 100);
  }

  /**
   * Voting gesture handlers
   */
  handleVoteSwipe(direction, data) {
    const voteElement = this.findVoteElementFromGesture(data);
    
    if (!voteElement) {
      console.warn('No vote element found for gesture');
      return;
    }

    console.log(`🗳️ Vote ${direction} gesture detected`);

    // Determine if it's a super vote based on gesture characteristics
    const isQuickVote = data.duration < 200 && data.velocity.y > 0.5;
    const isForceVote = data.distance > 120;

    this.executeVote(direction, {
      isQuick: isQuickVote,
      isForce: isForceVote,
      element: voteElement,
      gestureData: data
    });
  }

  handleSuperVoteGesture(data) {
    console.log('🔥 Super vote gesture detected');
    
    const voteElement = this.findVoteElementFromGesture(data);
    
    if (voteElement) {
      this.showSuperVoteConfirmation(voteElement, data);
    }
  }

  handleFavoriteGesture(data) {
    console.log('⭐ Favorite gesture detected');
    
    const contentElement = this.findContentElementFromGesture(data);
    
    if (contentElement) {
      this.toggleFavorite(contentElement);
    }
  }

  executeVote(direction, options) {
    // Dispatch vote event
    document.dispatchEvent(new CustomEvent('mlg-swipe-vote', {
      detail: {
        direction,
        ...options
      }
    }));

    // Show visual feedback
    this.showVoteFeedback(options.element, direction, options.isQuick);
  }

  showSuperVoteConfirmation(element, data) {
    // Show super vote confirmation modal
    document.dispatchEvent(new CustomEvent('mlg-super-vote-confirm', {
      detail: {
        element,
        gestureData: data
      }
    }));
  }

  /**
   * Clan gesture handlers
   */
  handleClanMemberSwipe(data) {
    const memberElement = data.element;
    const memberId = memberElement?.dataset?.clanMember;

    if (!memberId) {
      console.warn('No clan member ID found');
      return;
    }

    console.log(`👥 Clan member swipe: ${memberId}`);

    // Show clan member action sheet
    this.showClanMemberActions(memberId, memberElement);
  }

  handleClanMemberPromote(data) {
    const memberElement = data.element;
    const memberId = memberElement?.dataset?.clanMember;

    if (!memberId) return;

    console.log(`⬆️ Quick promote clan member: ${memberId}`);

    // Dispatch clan promotion event
    document.dispatchEvent(new CustomEvent('mlg-clan-promote', {
      detail: {
        memberId,
        quick: true,
        gestureData: data
      }
    }));
  }

  handleClanDetailsSwipe(data) {
    const clanElement = data.element;
    const clanId = clanElement?.dataset?.clanCard;

    if (!clanId) return;

    console.log(`📊 Show clan details: ${clanId}`);

    // Navigate to clan details
    window.location.href = `/clans.html#${clanId}`;
  }

  handleClanRefresh(data) {
    console.log('🔄 Refreshing clan data...');

    // Dispatch clan refresh event
    document.dispatchEvent(new CustomEvent('mlg-clan-refresh', {
      detail: { gestureData: data }
    }));
  }

  showClanMemberActions(memberId, element) {
    // Create action sheet for clan member
    const actionSheet = document.createElement('div');
    actionSheet.className = 'gaming-action-sheet clan-member-actions';
    actionSheet.innerHTML = `
      <div class="action-sheet-header">
        <h3>Member Actions</h3>
        <button class="close-action-sheet">×</button>
      </div>
      <div class="action-sheet-content">
        <button class="action-item" data-action="message">
          💬 Message Member
        </button>
        <button class="action-item" data-action="promote">
          ⬆️ Promote to Officer
        </button>
        <button class="action-item" data-action="demote">
          ⬇️ Demote Rank
        </button>
        <button class="action-item" data-action="kick">
          🚪 Remove from Clan
        </button>
        <button class="action-item" data-action="profile">
          👤 View Profile
        </button>
      </div>
    `;

    // Add event listeners
    actionSheet.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action) {
        this.handleClanMemberAction(memberId, action);
        this.closeActionSheet(actionSheet);
      } else if (e.target.classList.contains('close-action-sheet')) {
        this.closeActionSheet(actionSheet);
      }
    });

    // Show action sheet
    document.body.appendChild(actionSheet);
    this.animateActionSheetIn(actionSheet);
  }

  /**
   * Tournament gesture handlers
   */
  handleTournamentNavigation(data) {
    const direction = data.direction;
    const bracketElement = data.element;

    console.log(`🏆 Tournament navigation: ${direction}`);

    if (direction === SWIPE_DIRECTIONS.LEFT) {
      this.navigateTournamentBracket('previous', bracketElement);
    } else if (direction === SWIPE_DIRECTIONS.RIGHT) {
      this.navigateTournamentBracket('next', bracketElement);
    }
  }

  handleTournamentZoom(data) {
    const scale = data.scale;
    const bracketElement = data.element;

    console.log(`🔍 Tournament zoom: ${scale}x`);

    // Apply zoom to tournament bracket
    bracketElement.style.transform = `scale(${scale})`;
  }

  handleTournamentJoin(data) {
    const tournamentElement = data.element;
    const tournamentId = tournamentElement?.dataset?.tournamentCard;

    if (!tournamentId) return;

    console.log(`🎮 Join tournament: ${tournamentId}`);

    // Dispatch tournament join event
    document.dispatchEvent(new CustomEvent('mlg-tournament-join', {
      detail: {
        tournamentId,
        gestureData: data
      }
    }));
  }

  handleTournamentDetails(data) {
    const tournamentElement = data.element;
    const tournamentId = tournamentElement?.dataset?.tournamentCard;

    if (!tournamentId) return;

    console.log(`📊 Tournament details: ${tournamentId}`);

    // Show tournament details
    window.location.href = `/tournaments.html#${tournamentId}`;
  }

  /**
   * Quick action handlers
   */
  handleQuickMenu(data) {
    console.log('⚡ Quick menu gesture');

    // Show quick action menu
    this.showQuickActionMenu();
  }

  handleQuickBack(data) {
    console.log('⬅️ Quick back gesture');

    // Navigate back
    history.back();
  }

  handleGamingToolbar(data) {
    console.log('🎮 Gaming toolbar gesture');

    // Show gaming toolbar
    this.showGamingToolbar();
  }

  /**
   * UI Helper methods
   */
  showQuickActionMenu() {
    const quickMenu = document.createElement('div');
    quickMenu.className = 'gaming-quick-menu';
    quickMenu.innerHTML = `
      <div class="quick-menu-content">
        <div class="quick-actions">
          <button class="quick-action" data-action="vote">🗳️ Vote</button>
          <button class="quick-action" data-action="clans">👥 Clans</button>
          <button class="quick-action" data-action="tournaments">🏆 Tournaments</button>
          <button class="quick-action" data-action="profile">👤 Profile</button>
        </div>
        <button class="close-quick-menu">Close</button>
      </div>
    `;

    // Add event listeners
    quickMenu.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action) {
        this.handleQuickAction(action);
        this.closeQuickMenu(quickMenu);
      } else if (e.target.classList.contains('close-quick-menu')) {
        this.closeQuickMenu(quickMenu);
      }
    });

    document.body.appendChild(quickMenu);
    this.animateQuickMenuIn(quickMenu);
  }

  showGamingToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'gaming-toolbar';
    toolbar.innerHTML = `
      <div class="toolbar-content">
        <button class="toolbar-action" data-action="refresh">🔄</button>
        <button class="toolbar-action" data-action="settings">⚙️</button>
        <button class="toolbar-action" data-action="help">❓</button>
        <button class="toolbar-action" data-action="feedback">💬</button>
      </div>
    `;

    // Add event listeners
    toolbar.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action) {
        this.handleToolbarAction(action);
      }
    });

    document.body.appendChild(toolbar);
    this.animateToolbarIn(toolbar);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.hideGamingToolbar(toolbar);
    }, 3000);
  }

  /**
   * Utility methods
   */
  getCurrentSection() {
    const path = window.location.pathname;
    
    if (path.includes('voting')) return GAMING_CONTEXTS.VOTING;
    if (path.includes('content')) return GAMING_CONTEXTS.LEADERBOARDS;
    if (path.includes('clans')) return GAMING_CONTEXTS.CLANS;
    if (path.includes('dao')) return GAMING_CONTEXTS.TOURNAMENTS;
    if (path.includes('profile')) return GAMING_CONTEXTS.PROFILE;
    
    return GAMING_CONTEXTS.HOME;
  }

  directionToSwipeDirection(direction) {
    const directionMap = {
      'up': SWIPE_DIRECTIONS.UP,
      'down': SWIPE_DIRECTIONS.DOWN,
      'left': SWIPE_DIRECTIONS.LEFT,
      'right': SWIPE_DIRECTIONS.RIGHT
    };
    
    return directionMap[direction] || SWIPE_DIRECTIONS.NONE;
  }

  findVoteElementFromGesture(data) {
    let element = data.element;
    
    // Traverse up the DOM to find vote element
    while (element && !element.hasAttribute('data-vote-action')) {
      element = element.parentElement;
    }
    
    return element;
  }

  findContentElementFromGesture(data) {
    let element = data.element;
    
    // Traverse up the DOM to find content element
    while (element && !element.hasAttribute('data-content-id')) {
      element = element.parentElement;
    }
    
    return element;
  }

  getAvailableGestures() {
    const currentSection = this.navigationState.currentSection;
    const availablePaths = this.options.NAVIGATION_PATHS[currentSection];
    
    return {
      navigation: availablePaths || {},
      contextual: this.getContextualGestures(currentSection),
      quickActions: ['quick-menu', 'quick-back', 'gaming-toolbar']
    };
  }

  getContextualGestures(section) {
    switch (section) {
      case GAMING_CONTEXTS.VOTING:
        return ['vote-up', 'vote-down', 'super-vote', 'favorite'];
      case GAMING_CONTEXTS.CLANS:
        return ['clan-member-actions', 'clan-promote', 'clan-details', 'clan-refresh'];
      case GAMING_CONTEXTS.TOURNAMENTS:
        return ['tournament-nav', 'tournament-zoom', 'tournament-join', 'tournament-details'];
      default:
        return [];
    }
  }

  /**
   * Animation methods
   */
  animateActionSheetIn(element) {
    element.style.cssText += `
      transform: translateY(100%);
      transition: transform 300ms ease-out;
    `;
    
    requestAnimationFrame(() => {
      element.style.transform = 'translateY(0)';
    });
  }

  animateQuickMenuIn(element) {
    element.style.cssText += `
      opacity: 0;
      transform: scale(0.8);
      transition: opacity 200ms ease-out, transform 200ms ease-out;
    `;
    
    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'scale(1)';
    });
  }

  animateToolbarIn(element) {
    element.style.cssText += `
      transform: translateY(100%);
      transition: transform 250ms ease-out;
    `;
    
    requestAnimationFrame(() => {
      element.style.transform = 'translateY(0)';
    });
  }

  closeActionSheet(element) {
    element.style.transform = 'translateY(100%)';
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }, 300);
  }

  closeQuickMenu(element) {
    element.style.opacity = '0';
    element.style.transform = 'scale(0.8)';
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }, 200);
  }

  hideGamingToolbar(element) {
    element.style.transform = 'translateY(100%)';
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }, 250);
  }

  /**
   * Event handlers for actions
   */
  handleClanMemberAction(memberId, action) {
    document.dispatchEvent(new CustomEvent('mlg-clan-member-action', {
      detail: { memberId, action }
    }));
  }

  handleQuickAction(action) {
    const actionMap = {
      'vote': () => window.location.href = '/voting.html',
      'clans': () => window.location.href = '/clans.html',
      'tournaments': () => window.location.href = '/dao.html',
      'profile': () => window.location.href = '/profile.html'
    };
    
    if (actionMap[action]) {
      actionMap[action]();
    }
  }

  handleToolbarAction(action) {
    const actionMap = {
      'refresh': () => window.location.reload(),
      'settings': () => this.showSettings(),
      'help': () => this.showHelp(),
      'feedback': () => this.showFeedback()
    };
    
    if (actionMap[action]) {
      actionMap[action]();
    }
  }

  navigateTournamentBracket(direction, element) {
    // Implementation for tournament bracket navigation
    console.log(`Tournament bracket navigation: ${direction}`);
  }

  toggleFavorite(element) {
    // Implementation for favoriting content
    console.log('Toggling favorite for content');
  }

  showVoteFeedback(element, direction, isQuick) {
    // Show visual voting feedback
    console.log(`Vote feedback: ${direction} ${isQuick ? '(quick)' : ''}`);
  }

  showSettings() {
    console.log('Showing settings');
  }

  showHelp() {
    console.log('Showing help');
  }

  showFeedback() {
    console.log('Showing feedback form');
  }

  /**
   * Public API
   */
  getNavigationState() {
    return { ...this.navigationState };
  }

  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    console.log('🔥 Destroying Gaming Swipe Navigation...');
    
    // Remove any active UI elements
    const elements = document.querySelectorAll('.gaming-action-sheet, .gaming-quick-menu, .gaming-toolbar');
    elements.forEach(el => el.remove());

    console.log('✅ Gaming Swipe Navigation destroyed');
  }
}

// Create and export singleton instance
const MLGGamingSwipeNav = new MLGGamingSwipeNavigation();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.MLGGamingSwipeNav = MLGGamingSwipeNav;
}

export default MLGGamingSwipeNav;
export { MLGGamingSwipeNavigation, GAMING_NAV_CONFIG };