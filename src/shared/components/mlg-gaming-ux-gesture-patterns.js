/**
 * MLG.clan Gaming UX Gesture Patterns
 * 
 * Comprehensive gaming UX gesture patterns specifically designed for MLG.clan workflows
 * Optimized for voting, tournaments, clans, and gaming content interactions
 * 
 * Features:
 * - Swipe-to-refresh for real-time gaming data (leaderboards, tournaments)
 * - Swipe navigation through gaming content (clips, achievements, stats)
 * - Gaming modal gestures (swipe to close, swipe to confirm)
 * - Gaming card interactions (swipe to vote, swipe to join, swipe to share)
 * - Gaming workflow gestures (swipe through clan roster, swipe through tournaments)
 * - Xbox 360-inspired gesture feedback and animations
 * - Context-aware gesture behaviors per gaming section
 * - Competitive gaming gesture shortcuts
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 */

import MLGSwipeGestures from './mlg-swipe-gesture-system.js';
import MLGGamingSwipeNav from './mlg-gaming-swipe-navigation.js';

/**
 * Gaming UX Gesture Configuration
 */
const GAMING_UX_CONFIG = {
  // Voting gesture patterns
  VOTING_PATTERNS: {
    QUICK_VOTE_DISTANCE: 60,
    SUPER_VOTE_DURATION: 800,
    VOTE_CONFIRMATION_THRESHOLD: 100,
    RAPID_VOTE_INTERVAL: 150,
    VOTE_COMBO_WINDOW: 500
  },
  
  // Tournament gesture patterns
  TOURNAMENT_PATTERNS: {
    BRACKET_SWIPE_THRESHOLD: 80,
    JOIN_TOURNAMENT_DISTANCE: 70,
    TOURNAMENT_INFO_DURATION: 600,
    BRACKET_ZOOM_SENSITIVITY: 0.1,
    TOURNAMENT_NAV_VELOCITY: 0.5
  },
  
  // Clan gesture patterns
  CLAN_PATTERNS: {
    MEMBER_ACTION_DISTANCE: 75,
    CLAN_JOIN_DISTANCE: 90,
    PROMOTE_DEMOTE_THRESHOLD: 85,
    CLAN_CHAT_DURATION: 500,
    ROSTER_SCROLL_VELOCITY: 0.3
  },
  
  // Content gesture patterns
  CONTENT_PATTERNS: {
    CONTENT_SWIPE_THRESHOLD: 70,
    CLIP_SCRUB_SENSITIVITY: 2.0,
    SHARE_GESTURE_DISTANCE: 80,
    BOOKMARK_DURATION: 600,
    CONTENT_NAV_VELOCITY: 0.4
  },
  
  // Modal gesture patterns
  MODAL_PATTERNS: {
    CLOSE_SWIPE_DISTANCE: 100,
    CONFIRM_SWIPE_DISTANCE: 120,
    MODAL_DISMISS_VELOCITY: 0.8,
    SHEET_DRAG_THRESHOLD: 50,
    OVERLAY_TAP_CLOSE: true
  },
  
  // Gaming workflow patterns
  WORKFLOW_PATTERNS: {
    STEP_NAVIGATION_DISTANCE: 65,
    WORKFLOW_COMPLETION_GESTURE: 'up-swipe',
    QUICK_ACTION_DISTANCE: 55,
    BATCH_ACTION_COUNT: 3,
    WORKFLOW_TIMEOUT: 30000
  },
  
  // Xbox 360 aesthetic timings
  XBOX_TIMINGS: {
    BLADE_TRANSITION: 250,
    SELECTION_FEEDBACK: 150,
    HOVER_EFFECT: 100,
    GLOW_ANIMATION: 300,
    PANEL_SLIDE: 200
  }
};

/**
 * Gaming UX Gesture Pattern Manager
 */
export class MLGGamingUXGesturePatterns {
  constructor(options = {}) {
    this.options = {
      ...GAMING_UX_CONFIG,
      enableVotingPatterns: true,
      enableTournamentPatterns: true,
      enableClanPatterns: true,
      enableContentPatterns: true,
      enableModalPatterns: true,
      enableWorkflowPatterns: true,
      enableXboxAesthetics: true,
      debugMode: process.env.NODE_ENV === 'development',
      ...options
    };

    // Pattern state management
    this.patternState = {
      activePatterns: new Set(),
      patternHistory: [],
      contextualPatterns: new Map(),
      userPreferences: this.loadUserPreferences(),
      
      // Voting state
      votingSession: {
        active: false,
        rapidVoteCount: 0,
        lastVoteTime: 0,
        comboActive: false
      },
      
      // Tournament state
      tournamentSession: {
        activeBracket: null,
        currentRound: 0,
        zoomLevel: 1.0,
        navigationHistory: []
      },
      
      // Clan state
      clanSession: {
        activeRoster: null,
        selectedMembers: new Set(),
        batchActions: [],
        managementMode: false
      },
      
      // Content state
      contentSession: {
        currentClip: null,
        playbackPosition: 0,
        bookmarks: new Set(),
        shareQueue: []
      },
      
      // Workflow state
      workflowSession: {
        activeWorkflow: null,
        currentStep: 0,
        completedSteps: new Set(),
        workflowData: {}
      }
    };

    // Gesture pattern registry
    this.gesturePatterns = new Map();
    this.contextualHandlers = new Map();
    this.xboxAnimations = new Map();

    this.init();
  }

  /**
   * Initialize gaming UX gesture patterns
   */
  async init() {
    console.log('🎮 Initializing Gaming UX Gesture Patterns...');

    try {
      // Initialize pattern categories
      if (this.options.enableVotingPatterns) {
        this.initializeVotingPatterns();
      }

      if (this.options.enableTournamentPatterns) {
        this.initializeTournamentPatterns();
      }

      if (this.options.enableClanPatterns) {
        this.initializeClanPatterns();
      }

      if (this.options.enableContentPatterns) {
        this.initializeContentPatterns();
      }

      if (this.options.enableModalPatterns) {
        this.initializeModalPatterns();
      }

      if (this.options.enableWorkflowPatterns) {
        this.initializeWorkflowPatterns();
      }

      // Initialize Xbox aesthetics
      if (this.options.enableXboxAesthetics) {
        this.initializeXboxAesthetics();
      }

      // Setup contextual pattern switching
      this.setupContextualPatterns();

      // Setup pattern analytics
      this.setupPatternAnalytics();

      console.log('✅ Gaming UX Gesture Patterns initialized');

      // Dispatch initialization event
      document.dispatchEvent(new CustomEvent('mlg-gaming-patterns-ready', {
        detail: {
          availablePatterns: Array.from(this.gesturePatterns.keys()),
          activeContext: this.getCurrentGamingContext()
        }
      }));

    } catch (error) {
      console.error('❌ Failed to initialize gaming UX patterns:', error);
      throw error;
    }
  }

  /**
   * Initialize voting gesture patterns
   */
  initializeVotingPatterns() {
    // Quick upvote swipe
    this.registerGesturePattern('vote-up-quick', {
      gesture: 'swipe-up',
      distance: this.options.VOTING_PATTERNS.QUICK_VOTE_DISTANCE,
      velocity: 0.5,
      context: 'voting',
      feedback: 'haptic-light',
      animation: 'xbox-glow-green',
      action: (data) => this.handleQuickVote('up', data)
    });

    // Quick downvote swipe
    this.registerGesturePattern('vote-down-quick', {
      gesture: 'swipe-down',
      distance: this.options.VOTING_PATTERNS.QUICK_VOTE_DISTANCE,
      velocity: 0.5,
      context: 'voting',
      feedback: 'haptic-light',
      animation: 'xbox-glow-red',
      action: (data) => this.handleQuickVote('down', data)
    });

    // Super vote long press
    this.registerGesturePattern('super-vote', {
      gesture: 'long-press',
      duration: this.options.VOTING_PATTERNS.SUPER_VOTE_DURATION,
      context: 'voting',
      feedback: 'haptic-strong',
      animation: 'xbox-super-glow',
      confirmation: true,
      action: (data) => this.handleSuperVote(data)
    });

    // Vote confirmation swipe
    this.registerGesturePattern('vote-confirm', {
      gesture: 'swipe-right',
      distance: this.options.VOTING_PATTERNS.VOTE_CONFIRMATION_THRESHOLD,
      context: 'voting-confirmation',
      feedback: 'haptic-success',
      animation: 'xbox-confirm-slide',
      action: (data) => this.handleVoteConfirmation(data)
    });

    // Rapid vote combo
    this.registerGesturePattern('rapid-vote-combo', {
      gesture: 'rapid-swipe-sequence',
      pattern: ['up', 'up', 'down'],
      timeWindow: this.options.VOTING_PATTERNS.VOTE_COMBO_WINDOW,
      context: 'voting',
      feedback: 'haptic-combo',
      animation: 'xbox-combo-burst',
      action: (data) => this.handleRapidVoteCombo(data)
    });

    console.log('🗳️ Voting gesture patterns initialized');
  }

  /**
   * Initialize tournament gesture patterns
   */
  initializeTournamentPatterns() {
    // Tournament bracket navigation
    this.registerGesturePattern('bracket-navigate', {
      gesture: 'swipe-horizontal',
      distance: this.options.TOURNAMENT_PATTERNS.BRACKET_SWIPE_THRESHOLD,
      context: 'tournament-bracket',
      feedback: 'haptic-light',
      animation: 'xbox-blade-slide',
      action: (data) => this.handleBracketNavigation(data)
    });

    // Join tournament swipe
    this.registerGesturePattern('tournament-join', {
      gesture: 'swipe-up',
      distance: this.options.TOURNAMENT_PATTERNS.JOIN_TOURNAMENT_DISTANCE,
      context: 'tournament-card',
      feedback: 'haptic-medium',
      animation: 'xbox-join-effect',
      confirmation: true,
      action: (data) => this.handleTournamentJoin(data)
    });

    // Tournament info long press
    this.registerGesturePattern('tournament-info', {
      gesture: 'long-press',
      duration: this.options.TOURNAMENT_PATTERNS.TOURNAMENT_INFO_DURATION,
      context: 'tournament-card',
      feedback: 'haptic-light',
      animation: 'xbox-info-expand',
      action: (data) => this.handleTournamentInfo(data)
    });

    // Bracket zoom pinch
    this.registerGesturePattern('bracket-zoom', {
      gesture: 'pinch',
      sensitivity: this.options.TOURNAMENT_PATTERNS.BRACKET_ZOOM_SENSITIVITY,
      context: 'tournament-bracket',
      feedback: 'haptic-subtle',
      animation: 'xbox-zoom-effect',
      action: (data) => this.handleBracketZoom(data)
    });

    // Tournament quick actions
    this.registerGesturePattern('tournament-quick-actions', {
      gesture: 'two-finger-tap',
      context: 'tournament-card',
      feedback: 'haptic-medium',
      animation: 'xbox-quick-menu',
      action: (data) => this.handleTournamentQuickActions(data)
    });

    console.log('🏆 Tournament gesture patterns initialized');
  }

  /**
   * Initialize clan gesture patterns
   */
  initializeClanPatterns() {
    // Clan member actions swipe
    this.registerGesturePattern('clan-member-actions', {
      gesture: 'swipe-left',
      distance: this.options.CLAN_PATTERNS.MEMBER_ACTION_DISTANCE,
      context: 'clan-member-card',
      feedback: 'haptic-light',
      animation: 'xbox-action-reveal',
      action: (data) => this.handleClanMemberActions(data)
    });

    // Quick promote swipe
    this.registerGesturePattern('clan-member-promote', {
      gesture: 'swipe-up',
      distance: this.options.CLAN_PATTERNS.PROMOTE_DEMOTE_THRESHOLD,
      context: 'clan-member-card',
      feedback: 'haptic-success',
      animation: 'xbox-promote-glow',
      confirmation: true,
      action: (data) => this.handleMemberPromotion(data)
    });

    // Quick demote swipe
    this.registerGesturePattern('clan-member-demote', {
      gesture: 'swipe-down',
      distance: this.options.CLAN_PATTERNS.PROMOTE_DEMOTE_THRESHOLD,
      context: 'clan-member-card',
      feedback: 'haptic-warning',
      animation: 'xbox-demote-fade',
      confirmation: true,
      action: (data) => this.handleMemberDemotion(data)
    });

    // Clan join swipe
    this.registerGesturePattern('clan-join', {
      gesture: 'swipe-right',
      distance: this.options.CLAN_PATTERNS.CLAN_JOIN_DISTANCE,
      context: 'clan-card',
      feedback: 'haptic-strong',
      animation: 'xbox-join-clan',
      confirmation: true,
      action: (data) => this.handleClanJoin(data)
    });

    // Clan chat long press
    this.registerGesturePattern('clan-chat', {
      gesture: 'long-press',
      duration: this.options.CLAN_PATTERNS.CLAN_CHAT_DURATION,
      context: 'clan-card',
      feedback: 'haptic-medium',
      animation: 'xbox-chat-bubble',
      action: (data) => this.handleClanChat(data)
    });

    // Batch selection multi-tap
    this.registerGesturePattern('clan-batch-select', {
      gesture: 'multi-tap',
      tapCount: 2,
      context: 'clan-member-card',
      feedback: 'haptic-light',
      animation: 'xbox-selection-highlight',
      action: (data) => this.handleBatchSelection(data)
    });

    console.log('👥 Clan gesture patterns initialized');
  }

  /**
   * Initialize content gesture patterns
   */
  initializeContentPatterns() {
    // Content navigation swipe
    this.registerGesturePattern('content-navigate', {
      gesture: 'swipe-horizontal',
      distance: this.options.CONTENT_PATTERNS.CONTENT_SWIPE_THRESHOLD,
      context: 'content-card',
      feedback: 'haptic-light',
      animation: 'xbox-content-slide',
      action: (data) => this.handleContentNavigation(data)
    });

    // Clip scrubbing gesture
    this.registerGesturePattern('clip-scrub', {
      gesture: 'horizontal-drag',
      sensitivity: this.options.CONTENT_PATTERNS.CLIP_SCRUB_SENSITIVITY,
      context: 'video-player',
      feedback: 'haptic-subtle',
      animation: 'xbox-scrub-indicator',
      realtime: true,
      action: (data) => this.handleClipScrubbing(data)
    });

    // Share content swipe
    this.registerGesturePattern('content-share', {
      gesture: 'swipe-up-right',
      distance: this.options.CONTENT_PATTERNS.SHARE_GESTURE_DISTANCE,
      context: 'content-card',
      feedback: 'haptic-medium',
      animation: 'xbox-share-burst',
      action: (data) => this.handleContentShare(data)
    });

    // Bookmark long press
    this.registerGesturePattern('content-bookmark', {
      gesture: 'long-press',
      duration: this.options.CONTENT_PATTERNS.BOOKMARK_DURATION,
      context: 'content-card',
      feedback: 'haptic-success',
      animation: 'xbox-bookmark-star',
      action: (data) => this.handleContentBookmark(data)
    });

    // Content details double tap
    this.registerGesturePattern('content-details', {
      gesture: 'double-tap',
      maxInterval: 300,
      context: 'content-card',
      feedback: 'haptic-light',
      animation: 'xbox-details-expand',
      action: (data) => this.handleContentDetails(data)
    });

    console.log('📹 Content gesture patterns initialized');
  }

  /**
   * Initialize modal gesture patterns
   */
  initializeModalPatterns() {
    // Modal close swipe down
    this.registerGesturePattern('modal-close', {
      gesture: 'swipe-down',
      distance: this.options.MODAL_PATTERNS.CLOSE_SWIPE_DISTANCE,
      context: 'modal',
      feedback: 'haptic-light',
      animation: 'xbox-modal-dismiss',
      action: (data) => this.handleModalClose(data)
    });

    // Modal confirm swipe right
    this.registerGesturePattern('modal-confirm', {
      gesture: 'swipe-right',
      distance: this.options.MODAL_PATTERNS.CONFIRM_SWIPE_DISTANCE,
      context: 'modal-confirm',
      feedback: 'haptic-success',
      animation: 'xbox-confirm-sweep',
      action: (data) => this.handleModalConfirm(data)
    });

    // Bottom sheet drag
    this.registerGesturePattern('sheet-drag', {
      gesture: 'vertical-drag',
      threshold: this.options.MODAL_PATTERNS.SHEET_DRAG_THRESHOLD,
      context: 'bottom-sheet',
      feedback: 'haptic-subtle',
      animation: 'xbox-sheet-follow',
      realtime: true,
      action: (data) => this.handleSheetDrag(data)
    });

    // Overlay tap close
    if (this.options.MODAL_PATTERNS.OVERLAY_TAP_CLOSE) {
      this.registerGesturePattern('overlay-close', {
        gesture: 'tap',
        context: 'modal-overlay',
        feedback: 'haptic-light',
        animation: 'xbox-overlay-fade',
        action: (data) => this.handleOverlayClose(data)
      });
    }

    console.log('📱 Modal gesture patterns initialized');
  }

  /**
   * Initialize workflow gesture patterns
   */
  initializeWorkflowPatterns() {
    // Workflow step navigation
    this.registerGesturePattern('workflow-next-step', {
      gesture: 'swipe-right',
      distance: this.options.WORKFLOW_PATTERNS.STEP_NAVIGATION_DISTANCE,
      context: 'workflow',
      feedback: 'haptic-light',
      animation: 'xbox-step-advance',
      action: (data) => this.handleWorkflowNext(data)
    });

    this.registerGesturePattern('workflow-prev-step', {
      gesture: 'swipe-left',
      distance: this.options.WORKFLOW_PATTERNS.STEP_NAVIGATION_DISTANCE,
      context: 'workflow',
      feedback: 'haptic-light',
      animation: 'xbox-step-retreat',
      action: (data) => this.handleWorkflowPrev(data)
    });

    // Workflow completion gesture
    this.registerGesturePattern('workflow-complete', {
      gesture: 'swipe-up',
      distance: 100,
      context: 'workflow-final-step',
      feedback: 'haptic-strong',
      animation: 'xbox-completion-burst',
      confirmation: true,
      action: (data) => this.handleWorkflowComplete(data)
    });

    // Quick action gesture
    this.registerGesturePattern('workflow-quick-action', {
      gesture: 'double-swipe-up',
      distance: this.options.WORKFLOW_PATTERNS.QUICK_ACTION_DISTANCE,
      context: 'workflow',
      feedback: 'haptic-medium',
      animation: 'xbox-quick-action',
      action: (data) => this.handleWorkflowQuickAction(data)
    });

    console.log('⚡ Workflow gesture patterns initialized');
  }

  /**
   * Initialize Xbox 360 aesthetic animations
   */
  initializeXboxAesthetics() {
    // Xbox-style glow effects
    this.xboxAnimations.set('xbox-glow-green', {
      css: `
        @keyframes xboxGlowGreen {
          0% { box-shadow: 0 0 0 rgba(0, 255, 0, 0); }
          50% { box-shadow: 0 0 20px rgba(0, 255, 0, 0.8); }
          100% { box-shadow: 0 0 0 rgba(0, 255, 0, 0); }
        }
      `,
      duration: this.options.XBOX_TIMINGS.GLOW_ANIMATION
    });

    this.xboxAnimations.set('xbox-glow-red', {
      css: `
        @keyframes xboxGlowRed {
          0% { box-shadow: 0 0 0 rgba(255, 0, 0, 0); }
          50% { box-shadow: 0 0 20px rgba(255, 0, 0, 0.8); }
          100% { box-shadow: 0 0 0 rgba(255, 0, 0, 0); }
        }
      `,
      duration: this.options.XBOX_TIMINGS.GLOW_ANIMATION
    });

    // Xbox blade transitions
    this.xboxAnimations.set('xbox-blade-slide', {
      css: `
        @keyframes xboxBladeSlide {
          0% { transform: translateX(-100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
      `,
      duration: this.options.XBOX_TIMINGS.BLADE_TRANSITION
    });

    // Xbox selection feedback
    this.xboxAnimations.set('xbox-selection-highlight', {
      css: `
        @keyframes xboxSelectionHighlight {
          0% { background: rgba(255, 255, 255, 0); }
          50% { background: rgba(255, 255, 255, 0.2); }
          100% { background: rgba(255, 255, 255, 0.1); }
        }
      `,
      duration: this.options.XBOX_TIMINGS.SELECTION_FEEDBACK
    });

    // Inject CSS animations
    this.injectXboxAnimationCSS();

    console.log('🎨 Xbox 360 aesthetics initialized');
  }

  /**
   * Gesture pattern handlers
   */
  handleQuickVote(direction, data) {
    console.log(`🗳️ Quick vote ${direction}:`, data);

    // Update voting session state
    this.patternState.votingSession.rapidVoteCount++;
    this.patternState.votingSession.lastVoteTime = Date.now();

    // Check for rapid vote combo
    if (this.patternState.votingSession.rapidVoteCount >= 3) {
      this.triggerRapidVoteCombo();
    }

    // Apply Xbox animation
    this.applyXboxAnimation(data.element, direction === 'up' ? 'xbox-glow-green' : 'xbox-glow-red');

    // Dispatch vote event
    document.dispatchEvent(new CustomEvent('mlg-quick-vote', {
      detail: {
        direction,
        rapid: this.patternState.votingSession.rapidVoteCount > 1,
        gestureData: data
      }
    }));
  }

  handleSuperVote(data) {
    console.log('🔥 Super vote activated:', data);

    // Apply super glow animation
    this.applyXboxAnimation(data.element, 'xbox-super-glow');

    // Show confirmation modal
    this.showSuperVoteConfirmation(data);
  }

  handleBracketNavigation(data) {
    console.log('🏆 Tournament bracket navigation:', data);

    const direction = data.direction;
    this.patternState.tournamentSession.navigationHistory.push({
      direction,
      timestamp: Date.now()
    });

    // Apply blade slide animation
    this.applyXboxAnimation(data.element, 'xbox-blade-slide');

    // Navigate bracket
    this.navigateTournamentBracket(direction);
  }

  handleTournamentJoin(data) {
    console.log('🎮 Tournament join:', data);

    // Show join confirmation
    this.showTournamentJoinConfirmation(data);
  }

  handleClanMemberActions(data) {
    console.log('👥 Clan member actions:', data);

    const memberId = data.element?.dataset?.clanMember;
    
    // Apply action reveal animation
    this.applyXboxAnimation(data.element, 'xbox-action-reveal');

    // Show member action menu
    this.showClanMemberActionMenu(memberId, data.element);
  }

  handleMemberPromotion(data) {
    console.log('⬆️ Member promotion:', data);

    const memberId = data.element?.dataset?.clanMember;
    
    // Show promotion confirmation
    this.showPromotionConfirmation(memberId, data);
  }

  handleContentNavigation(data) {
    console.log('📹 Content navigation:', data);

    const direction = data.direction;
    
    // Apply content slide animation
    this.applyXboxAnimation(data.element, 'xbox-content-slide');

    // Navigate content
    this.navigateContent(direction);
  }

  handleClipScrubbing(data) {
    const position = this.calculateScrubPosition(data);
    
    // Update playback position
    this.patternState.contentSession.playbackPosition = position;

    // Update scrub indicator
    this.updateScrubIndicator(position);
  }

  handleModalClose(data) {
    console.log('❌ Modal close:', data);

    // Apply dismiss animation
    this.applyXboxAnimation(data.element, 'xbox-modal-dismiss');

    // Close modal after animation
    setTimeout(() => {
      this.closeModal(data.element);
    }, this.options.XBOX_TIMINGS.GLOW_ANIMATION);
  }

  handleWorkflowNext(data) {
    console.log('➡️ Workflow next step:', data);

    const currentStep = this.patternState.workflowSession.currentStep;
    
    // Apply step advance animation
    this.applyXboxAnimation(data.element, 'xbox-step-advance');

    // Advance workflow
    this.advanceWorkflowStep(currentStep + 1);
  }

  /**
   * Xbox animation system
   */
  applyXboxAnimation(element, animationName) {
    if (!element || !this.options.enableXboxAesthetics) return;

    const animation = this.xboxAnimations.get(animationName);
    if (!animation) return;

    // Apply animation class
    element.classList.add(`xbox-anim-${animationName}`);

    // Remove class after animation
    setTimeout(() => {
      element.classList.remove(`xbox-anim-${animationName}`);
    }, animation.duration);
  }

  injectXboxAnimationCSS() {
    const styleElement = document.createElement('style');
    styleElement.id = 'mlg-xbox-animations';
    
    let css = '';
    for (const [name, animation] of this.xboxAnimations) {
      css += animation.css;
      css += `
        .xbox-anim-${name} {
          animation: ${name.replace('xbox-', '')} ${animation.duration}ms ease-out;
        }
      `;
    }
    
    styleElement.textContent = css;
    document.head.appendChild(styleElement);
  }

  /**
   * Gaming workflow methods
   */
  triggerRapidVoteCombo() {
    console.log('🔥 Rapid vote combo triggered!');
    
    this.patternState.votingSession.comboActive = true;
    
    // Show combo effect
    this.showComboEffect();
    
    // Reset combo after timeout
    setTimeout(() => {
      this.patternState.votingSession.comboActive = false;
      this.patternState.votingSession.rapidVoteCount = 0;
    }, this.options.VOTING_PATTERNS.VOTE_COMBO_WINDOW);
  }

  showSuperVoteConfirmation(data) {
    const modal = document.createElement('div');
    modal.className = 'mlg-super-vote-modal xbox-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="super-vote-icon">🔥</div>
        <h2>Super Vote</h2>
        <p>Burn 100 MLG tokens for a super vote?</p>
        <div class="modal-actions">
          <button class="confirm-btn xbox-btn-primary" data-action="confirm">
            Confirm (Swipe Right)
          </button>
          <button class="cancel-btn xbox-btn-secondary" data-action="cancel">
            Cancel
          </button>
        </div>
      </div>
      <div class="modal-overlay"></div>
    `;

    // Add gesture handlers to modal
    this.addModalGestureHandlers(modal, data);
    
    document.body.appendChild(modal);
    this.applyXboxAnimation(modal.querySelector('.modal-content'), 'xbox-modal-enter');
  }

  showTournamentJoinConfirmation(data) {
    const tournamentId = data.element?.dataset?.tournamentId;
    
    // Implementation for tournament join confirmation
    console.log(`Showing tournament join confirmation for: ${tournamentId}`);
  }

  showClanMemberActionMenu(memberId, element) {
    const actionMenu = document.createElement('div');
    actionMenu.className = 'clan-member-action-menu xbox-action-menu';
    actionMenu.innerHTML = `
      <div class="action-items">
        <button class="action-item" data-action="message">💬 Message</button>
        <button class="action-item" data-action="promote">⬆️ Promote</button>
        <button class="action-item" data-action="demote">⬇️ Demote</button>
        <button class="action-item" data-action="kick">🚪 Remove</button>
      </div>
    `;

    // Position menu near element
    this.positionActionMenu(actionMenu, element);
    
    // Add click handlers
    actionMenu.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action) {
        this.executeClanMemberAction(memberId, action);
        actionMenu.remove();
      }
    });

    document.body.appendChild(actionMenu);
    this.applyXboxAnimation(actionMenu, 'xbox-action-reveal');
  }

  /**
   * Utility methods
   */
  registerGesturePattern(name, config) {
    this.gesturePatterns.set(name, {
      ...config,
      registeredAt: Date.now()
    });

    // Register with base gesture system
    if (config.context) {
      MLGSwipeGestures.registerGamingGesture(name, {
        ...config,
        action: (data) => {
          // Apply feedback and animation before action
          if (config.feedback) {
            this.provideFeedback(config.feedback);
          }
          
          if (config.animation) {
            this.applyXboxAnimation(data.element, config.animation);
          }
          
          // Execute pattern action
          config.action(data);
        }
      });
    }
  }

  setupContextualPatterns() {
    // Listen for context changes
    document.addEventListener('mlg-context-change', (e) => {
      this.handleContextChange(e.detail.context);
    });
  }

  setupPatternAnalytics() {
    // Track pattern usage
    document.addEventListener('mlg-pattern-executed', (e) => {
      this.trackPatternUsage(e.detail);
    });
  }

  getCurrentGamingContext() {
    const path = window.location.pathname;
    
    if (path.includes('voting')) return 'voting';
    if (path.includes('clans')) return 'clans';
    if (path.includes('dao') || path.includes('tournament')) return 'tournament';
    if (path.includes('content')) return 'content';
    
    return 'home';
  }

  provideFeedback(feedbackType) {
    const feedbackMap = {
      'haptic-light': [25],
      'haptic-medium': [50],
      'haptic-strong': [100],
      'haptic-success': [25, 25, 50],
      'haptic-warning': [100, 50, 100],
      'haptic-combo': [25, 25, 25, 100],
      'haptic-subtle': [15]
    };

    const pattern = feedbackMap[feedbackType];
    if (pattern && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  loadUserPreferences() {
    try {
      const prefs = localStorage.getItem('mlg-gesture-preferences');
      return prefs ? JSON.parse(prefs) : {};
    } catch {
      return {};
    }
  }

  saveUserPreferences() {
    try {
      localStorage.setItem('mlg-gesture-preferences', 
        JSON.stringify(this.patternState.userPreferences));
    } catch (error) {
      console.warn('Failed to save gesture preferences:', error);
    }
  }

  /**
   * Pattern execution helpers (placeholder implementations)
   */
  navigateTournamentBracket(direction) {
    console.log(`Navigating tournament bracket: ${direction}`);
  }

  navigateContent(direction) {
    console.log(`Navigating content: ${direction}`);
  }

  calculateScrubPosition(data) {
    // Calculate scrub position based on gesture data
    return Math.max(0, Math.min(1, data.deltaX / data.element.offsetWidth));
  }

  updateScrubIndicator(position) {
    console.log(`Updating scrub position: ${position}`);
  }

  closeModal(element) {
    element.remove();
  }

  advanceWorkflowStep(step) {
    this.patternState.workflowSession.currentStep = step;
    console.log(`Advanced to workflow step: ${step}`);
  }

  showComboEffect() {
    console.log('🎆 Showing combo effect');
  }

  addModalGestureHandlers(modal, data) {
    // Add gesture handlers for modal
  }

  positionActionMenu(menu, element) {
    // Position action menu relative to element
    const rect = element.getBoundingClientRect();
    menu.style.position = 'absolute';
    menu.style.top = `${rect.bottom + 10}px`;
    menu.style.left = `${rect.left}px`;
  }

  executeClanMemberAction(memberId, action) {
    console.log(`Executing clan action: ${action} for member: ${memberId}`);
    
    document.dispatchEvent(new CustomEvent('mlg-clan-member-action', {
      detail: { memberId, action }
    }));
  }

  handleContextChange(context) {
    console.log(`Context changed to: ${context}`);
    // Update active patterns based on context
  }

  trackPatternUsage(patternData) {
    // Track pattern usage for analytics
    this.patternState.patternHistory.push({
      ...patternData,
      timestamp: Date.now()
    });

    // Keep history limited
    if (this.patternState.patternHistory.length > 100) {
      this.patternState.patternHistory = this.patternState.patternHistory.slice(-50);
    }
  }

  showPromotionConfirmation(memberId, data) {
    console.log(`Showing promotion confirmation for member: ${memberId}`);
  }

  /**
   * Public API
   */
  getPatternState() {
    return {
      activePatterns: Array.from(this.patternState.activePatterns),
      votingSession: this.patternState.votingSession,
      tournamentSession: this.patternState.tournamentSession,
      clanSession: this.patternState.clanSession
    };
  }

  updatePatternOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    console.log('🔥 Destroying Gaming UX Gesture Patterns...');
    
    // Remove Xbox animations CSS
    const styleElement = document.getElementById('mlg-xbox-animations');
    if (styleElement) {
      styleElement.remove();
    }
    
    // Clear pattern registry
    this.gesturePatterns.clear();
    this.contextualHandlers.clear();
    this.xboxAnimations.clear();
    
    // Save user preferences
    this.saveUserPreferences();
    
    console.log('✅ Gaming UX Gesture Patterns destroyed');
  }
}

// Create and export singleton instance
const MLGGamingUXPatterns = new MLGGamingUXGesturePatterns();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.MLGGamingUXPatterns = MLGGamingUXPatterns;
}

export default MLGGamingUXPatterns;
export { MLGGamingUXGesturePatterns, GAMING_UX_CONFIG };