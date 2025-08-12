/**
 * MLG.clan Touch-Optimized Modal System
 * 
 * Gaming-focused modal interactions with touch optimization
 * Implements swipe gestures, touch-friendly controls, and mobile-first design
 * 
 * Features:
 * - Touch-friendly modal controls
 * - Swipe-to-dismiss gestures
 * - Gaming-themed modal templates
 * - Accessibility-compliant interactions
 * - Performance-optimized animations
 * - One-handed operation support
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 */

import TouchDesignPatterns from './touch-design-patterns.js';
import { getTouchOptimizedClasses, touchUtils, deviceUtils } from './ui/utils.js';

/**
 * Touch Modal Configuration
 */
const MODAL_CONFIG = {
  // Animation timing
  SHOW_DURATION: 300,
  HIDE_DURATION: 250,
  BACKDROP_FADE: 200,
  
  // Touch interaction thresholds
  SWIPE_DISMISS_THRESHOLD: 100,
  TAP_OUTSIDE_DISMISS: true,
  
  // Modal sizes
  SIZES: {
    small: 'max-w-sm',
    medium: 'max-w-md', 
    large: 'max-w-lg',
    xlarge: 'max-w-xl',
    fullscreen: 'w-full h-full'
  },
  
  // Gaming modal types
  TYPES: {
    vote: 'vote-modal',
    clan: 'clan-modal', 
    tournament: 'tournament-modal',
    achievement: 'achievement-modal',
    burn: 'burn-modal',
    profile: 'profile-modal'
  }
};

/**
 * Touch-Optimized Modal System
 */
export class TouchModalSystem {
  constructor(options = {}) {
    this.options = {
      enableSwipeGestures: true,
      enableTouchAnimations: true,
      enableHapticFeedback: true,
      autoFocusManagement: true,
      trapFocus: true,
      closeOnEscape: true,
      closeOnBackdrop: true,
      ...options
    };
    
    this.activeModals = new Map();
    this.modalStack = [];
    this.touchPatterns = TouchDesignPatterns;
    this.backdropElement = null;
    
    this.init();
  }

  /**
   * Initialize modal system
   */
  init() {
    this.createBackdrop();
    this.setupGlobalEventHandlers();
    this.injectModalStyles();
  }

  /**
   * Create gaming-themed vote confirmation modal
   */
  createVoteConfirmationModal(config = {}) {
    const {
      voteType = 'up',
      tokenCost = 0,
      isSuper = false,
      onConfirm = () => {},
      onCancel = () => {},
      ...modalOptions
    } = config;

    const modalContent = `
      <div class="vote-modal-header">
        <div class="vote-icon ${voteType}">
          ${voteType === 'up' ? '⬆️' : voteType === 'down' ? '⬇️' : '🔥'}
        </div>
        <h2 class="vote-title">
          ${isSuper ? 'Super Vote' : 'Confirm Vote'}
        </h2>
        ${tokenCost > 0 ? `
          <div class="token-cost">
            <span class="cost-label">Cost:</span>
            <span class="cost-amount">${tokenCost} MLG</span>
          </div>
        ` : ''}
      </div>
      
      <div class="vote-modal-content">
        <p class="vote-description">
          ${isSuper ? 
            'This Super Vote will burn MLG tokens and carry more weight!' :
            'Cast your vote to influence the community ranking.'
          }
        </p>
        
        ${isSuper ? `
          <div class="super-vote-warning">
            ⚠️ This action cannot be undone and will burn your MLG tokens
          </div>
        ` : ''}
      </div>
      
      <div class="vote-modal-actions">
        <button class="modal-btn cancel" data-action="cancel">
          Cancel
        </button>
        <button class="modal-btn confirm ${isSuper ? 'super' : voteType}" data-action="confirm">
          ${isSuper ? '🔥 Super Vote' : voteType === 'up' ? '👍 Vote Up' : '👎 Vote Down'}
        </button>
      </div>
    `;

    return this.showModal({
      type: 'vote',
      size: 'medium',
      content: modalContent,
      swipeToConfirm: isSuper,
      onAction: (action) => {
        if (action === 'confirm') onConfirm();
        else if (action === 'cancel') onCancel();
      },
      ...modalOptions
    });
  }

  /**
   * Create clan management modal
   */
  createClanManagementModal(config = {}) {
    const {
      clan = {},
      member = {},
      action = 'invite',
      onAction = () => {},
      ...modalOptions
    } = config;

    const modalContent = `
      <div class="clan-modal-header">
        <div class="clan-avatar">
          ${clan.avatar || '🎮'}
        </div>
        <div class="clan-info">
          <h2 class="clan-name">${clan.name || 'MLG Clan'}</h2>
          <p class="clan-tag">[${clan.tag || 'MLG'}]</p>
        </div>
      </div>
      
      <div class="clan-modal-content">
        ${this.getClanActionContent(action, member)}
      </div>
      
      <div class="clan-modal-actions">
        <button class="modal-btn secondary" data-action="cancel">
          Cancel
        </button>
        <button class="modal-btn primary" data-action="${action}">
          ${this.getClanActionLabel(action)}
        </button>
      </div>
    `;

    return this.showModal({
      type: 'clan',
      size: 'medium',
      content: modalContent,
      onAction,
      ...modalOptions
    });
  }

  /**
   * Create achievement unlock modal
   */
  createAchievementModal(config = {}) {
    const {
      achievement = {},
      onClose = () => {},
      ...modalOptions
    } = config;

    const modalContent = `
      <div class="achievement-modal-header">
        <div class="achievement-celebration">🎉</div>
        <h2 class="achievement-title">Achievement Unlocked!</h2>
      </div>
      
      <div class="achievement-modal-content">
        <div class="achievement-icon">
          ${achievement.icon || '🏆'}
        </div>
        <h3 class="achievement-name">${achievement.name || 'Gaming Legend'}</h3>
        <p class="achievement-description">
          ${achievement.description || 'You have achieved gaming greatness!'}
        </p>
        
        <div class="achievement-rewards">
          <div class="reward-item">
            <span class="reward-icon">💰</span>
            <span class="reward-text">${achievement.tokenReward || 100} MLG Tokens</span>
          </div>
          <div class="reward-item">
            <span class="reward-icon">⭐</span>
            <span class="reward-text">${achievement.xpReward || 50} XP</span>
          </div>
        </div>
      </div>
      
      <div class="achievement-modal-actions">
        <button class="modal-btn primary full-width" data-action="claim">
          🎁 Claim Rewards
        </button>
      </div>
    `;

    return this.showModal({
      type: 'achievement',
      size: 'medium',
      content: modalContent,
      celebratory: true,
      autoClose: 5000,
      onAction: onClose,
      ...modalOptions
    });
  }

  /**
   * Create tournament bracket modal
   */
  createTournamentModal(config = {}) {
    const {
      tournament = {},
      bracket = [],
      onJoin = () => {},
      ...modalOptions
    } = config;

    const modalContent = `
      <div class="tournament-modal-header">
        <div class="tournament-badge">🏆</div>
        <h2 class="tournament-title">${tournament.name || 'Gaming Tournament'}</h2>
        <div class="tournament-status ${tournament.status || 'upcoming'}">
          ${tournament.status || 'upcoming'}
        </div>
      </div>
      
      <div class="tournament-modal-content">
        <div class="tournament-info">
          <div class="info-item">
            <span class="info-label">Prize Pool:</span>
            <span class="info-value">${tournament.prizePool || '1000'} MLG</span>
          </div>
          <div class="info-item">
            <span class="info-label">Entry Fee:</span>
            <span class="info-value">${tournament.entryFee || '50'} MLG</span>
          </div>
          <div class="info-item">
            <span class="info-label">Participants:</span>
            <span class="info-value">${tournament.participants || '16'}/32</span>
          </div>
        </div>
        
        <div class="tournament-bracket">
          ${this.renderTournamentBracket(bracket)}
        </div>
      </div>
      
      <div class="tournament-modal-actions">
        <button class="modal-btn secondary" data-action="view-rules">
          📋 Rules
        </button>
        <button class="modal-btn primary" data-action="join">
          🎮 Join Tournament
        </button>
      </div>
    `;

    return this.showModal({
      type: 'tournament',
      size: 'xlarge',
      content: modalContent,
      onAction: onJoin,
      ...modalOptions
    });
  }

  /**
   * Show modal with touch optimizations
   */
  showModal(config = {}) {
    const {
      type = 'default',
      size = 'medium',
      content = '',
      title = '',
      onAction = () => {},
      onShow = () => {},
      onHide = () => {},
      swipeToConfirm = false,
      celebratory = false,
      autoClose = 0,
      ...options
    } = config;

    const modalId = this.generateModalId();
    
    // Create modal element
    const modal = this.createModalElement({
      id: modalId,
      type,
      size,
      content,
      title,
      celebratory
    });

    // Register touch interactions
    this.registerModalTouchEvents(modal, {
      swipeToConfirm,
      onAction,
      onHide
    });

    // Add to active modals
    this.activeModals.set(modalId, {
      element: modal,
      config: { onAction, onShow, onHide, autoClose },
      type
    });

    // Show modal
    this.displayModal(modal, { celebratory, autoClose });
    
    // Trigger onShow callback
    onShow(modal);

    return modalId;
  }

  /**
   * Create modal DOM element
   */
  createModalElement(config) {
    const { id, type, size, content, title, celebratory } = config;
    
    const modal = document.createElement('div');
    modal.className = this.getModalClasses(type, size, celebratory);
    modal.id = id;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    if (title) modal.setAttribute('aria-labelledby', `${id}-title`);

    modal.innerHTML = `
      <div class="modal-container" data-modal-container="true">
        <div class="modal-header">
          ${title ? `<h2 id="${id}-title" class="modal-title">${title}</h2>` : ''}
          <button class="modal-close" data-action="close" aria-label="Close modal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        <div class="modal-content">
          ${content}
        </div>
      </div>
    `;

    return modal;
  }

  /**
   * Register touch events for modal
   */
  registerModalTouchEvents(modal, config) {
    const { swipeToConfirm, onAction, onHide } = config;
    const container = modal.querySelector('[data-modal-container]');

    // Register swipe gestures
    if (this.options.enableSwipeGestures) {
      this.touchPatterns.registerTouchElement(container, {
        swipe: {
          callback: (direction, data) => {
            if (direction === 'down' && Math.abs(data.deltaY) >= MODAL_CONFIG.SWIPE_DISMISS_THRESHOLD) {
              this.hideModal(modal.id);
            } else if (swipeToConfirm && direction === 'right' && Math.abs(data.deltaX) >= MODAL_CONFIG.SWIPE_DISMISS_THRESHOLD) {
              onAction('confirm');
              this.hideModal(modal.id);
            }
          },
          hapticFeedback: 'light',
          animation: 'swipe'
        }
      });
    }

    // Register button interactions
    modal.querySelectorAll('[data-action]').forEach(button => {
      this.touchPatterns.registerTouchElement(button, {
        tap: {
          callback: () => {
            const action = button.dataset.action;
            if (action === 'close') {
              this.hideModal(modal.id);
              onHide(modal.id);
            } else {
              onAction(action);
              if (action === 'confirm' || action === 'cancel') {
                this.hideModal(modal.id);
              }
            }
          },
          hapticFeedback: 'medium',
          animation: 'scale-down'
        }
      });
    });

    // Close on backdrop tap
    if (this.options.closeOnBackdrop) {
      this.backdropElement.addEventListener('touchend', (e) => {
        if (e.target === this.backdropElement) {
          this.hideModal(modal.id);
          onHide(modal.id);
        }
      });
    }
  }

  /**
   * Display modal with animations
   */
  displayModal(modal, options = {}) {
    const { celebratory, autoClose } = options;

    // Show backdrop
    this.backdropElement.classList.add('active');
    
    // Add modal to DOM
    document.body.appendChild(modal);
    this.modalStack.push(modal.id);

    // Trigger entrance animation
    requestAnimationFrame(() => {
      modal.classList.add('active');
      
      if (celebratory) {
        modal.classList.add('celebratory');
        this.triggerCelebrationEffects(modal);
      }
    });

    // Auto close if specified
    if (autoClose > 0) {
      setTimeout(() => {
        this.hideModal(modal.id);
      }, autoClose);
    }

    // Focus management
    if (this.options.autoFocusManagement) {
      this.setInitialFocus(modal);
    }
  }

  /**
   * Hide modal
   */
  hideModal(modalId) {
    const modalData = this.activeModals.get(modalId);
    if (!modalData) return;

    const { element: modal, config } = modalData;

    // Remove from stack
    this.modalStack = this.modalStack.filter(id => id !== modalId);

    // Trigger exit animation
    modal.classList.remove('active');
    modal.classList.add('hiding');

    // Hide backdrop if no more modals
    if (this.modalStack.length === 0) {
      this.backdropElement.classList.remove('active');
    }

    // Remove from DOM after animation
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
      this.activeModals.delete(modalId);
      
      // Trigger onHide callback
      config.onHide(modalId);
    }, MODAL_CONFIG.HIDE_DURATION);
  }

  /**
   * Close all modals
   */
  closeAll() {
    const modalIds = [...this.activeModals.keys()];
    modalIds.forEach(id => this.hideModal(id));
  }

  /**
   * Utility methods
   */
  generateModalId() {
    return `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getModalClasses(type, size, celebratory) {
    const baseClasses = 'touch-modal fixed inset-0 z-50 flex items-center justify-center p-4';
    const sizeClass = MODAL_CONFIG.SIZES[size] || MODAL_CONFIG.SIZES.medium;
    const typeClass = MODAL_CONFIG.TYPES[type] || '';
    const celebratoryClass = celebratory ? 'celebratory' : '';
    
    return `${baseClasses} ${sizeClass} ${typeClass} ${celebratoryClass}`.trim();
  }

  getClanActionContent(action, member) {
    const actions = {
      invite: `
        <p>Invite <strong>${member.name}</strong> to join your clan?</p>
        <div class="member-stats">
          <div class="stat-item">
            <span class="stat-label">Level:</span>
            <span class="stat-value">${member.level || 1}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Win Rate:</span>
            <span class="stat-value">${member.winRate || '0%'}</span>
          </div>
        </div>
      `,
      kick: `
        <p>Remove <strong>${member.name}</strong> from the clan?</p>
        <div class="warning-notice">
          This action cannot be undone. The member will need a new invitation to rejoin.
        </div>
      `,
      promote: `
        <p>Promote <strong>${member.name}</strong> to officer?</p>
        <div class="promotion-info">
          Officers can invite members and manage clan activities.
        </div>
      `
    };

    return actions[action] || '<p>Perform clan action?</p>';
  }

  getClanActionLabel(action) {
    const labels = {
      invite: '📧 Send Invite',
      kick: '❌ Remove Member',
      promote: '⬆️ Promote'
    };

    return labels[action] || 'Confirm';
  }

  renderTournamentBracket(bracket) {
    if (!bracket.length) {
      return '<div class="bracket-placeholder">Tournament bracket will appear here</div>';
    }

    return `
      <div class="bracket-container">
        ${bracket.map((round, index) => `
          <div class="bracket-round">
            <h4 class="round-title">Round ${index + 1}</h4>
            ${round.matches.map(match => `
              <div class="bracket-match">
                <div class="match-player ${match.player1?.winner ? 'winner' : ''}">
                  ${match.player1?.name || 'TBD'}
                </div>
                <div class="match-vs">vs</div>
                <div class="match-player ${match.player2?.winner ? 'winner' : ''}">
                  ${match.player2?.name || 'TBD'}
                </div>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>
    `;
  }

  triggerCelebrationEffects(modal) {
    // Create confetti effect
    const confetti = document.createElement('div');
    confetti.className = 'celebration-confetti';
    modal.appendChild(confetti);

    // Create confetti particles
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti-particle';
      particle.style.cssText = `
        position: absolute;
        width: 6px;
        height: 6px;
        background: hsl(${Math.random() * 360}, 70%, 60%);
        border-radius: 50%;
        animation: confetti-fall ${2 + Math.random() * 2}s linear forwards;
        left: ${Math.random() * 100}%;
        animation-delay: ${Math.random() * 2}s;
      `;
      confetti.appendChild(particle);
    }

    // Remove confetti after animation
    setTimeout(() => {
      confetti.remove();
    }, 4000);
  }

  setInitialFocus(modal) {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }

  createBackdrop() {
    this.backdropElement = document.createElement('div');
    this.backdropElement.className = 'modal-backdrop fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300';
    document.body.appendChild(this.backdropElement);
  }

  setupGlobalEventHandlers() {
    // Escape key handler
    if (this.options.closeOnEscape) {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.modalStack.length > 0) {
          const topModalId = this.modalStack[this.modalStack.length - 1];
          this.hideModal(topModalId);
        }
      });
    }
  }

  injectModalStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .modal-backdrop {
        opacity: 0;
        pointer-events: none;
      }
      
      .modal-backdrop.active {
        opacity: 1;
        pointer-events: auto;
      }
      
      .touch-modal {
        opacity: 0;
        transform: translateY(100px) scale(0.9);
        transition: all ${MODAL_CONFIG.SHOW_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .touch-modal.active {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      
      .touch-modal.hiding {
        opacity: 0;
        transform: translateY(50px) scale(0.95);
        transition: all ${MODAL_CONFIG.HIDE_DURATION}ms ease-in;
      }
      
      .modal-container {
        background: var(--tile-bg-primary);
        border: 2px solid var(--gaming-accent);
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        max-height: 90vh;
        overflow-y: auto;
        width: 100%;
        position: relative;
      }
      
      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.5rem;
        border-bottom: 1px solid var(--tile-border);
        background: var(--gaming-surface);
      }
      
      .modal-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--gaming-accent);
        margin: 0;
      }
      
      .modal-close {
        width: ${touchUtils.touchTarget}px;
        height: ${touchUtils.touchTarget}px;
        border: none;
        background: transparent;
        color: var(--text-secondary);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      
      .modal-close:active {
        background: var(--tile-hover);
        color: var(--gaming-accent);
        transform: scale(0.9);
      }
      
      .modal-content {
        padding: 1.5rem;
      }
      
      .modal-btn {
        ${getTouchOptimizedClasses(touchUtils.touchTarget)}
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        font-size: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        transition: all 0.2s ease;
        border: 2px solid transparent;
      }
      
      .modal-btn.primary {
        background: var(--gaming-accent);
        color: black;
      }
      
      .modal-btn.secondary {
        background: var(--tile-bg-secondary);
        color: var(--gaming-accent);
        border-color: var(--gaming-accent);
      }
      
      .modal-btn.cancel {
        background: var(--tile-bg-secondary);
        color: var(--text-secondary);
        border-color: var(--tile-border);
      }
      
      .modal-btn.confirm {
        background: var(--gaming-accent);
        color: black;
      }
      
      .modal-btn.super {
        background: linear-gradient(45deg, var(--burn-orange), var(--gaming-red));
        color: white;
        box-shadow: 0 0 20px rgba(247, 147, 30, 0.4);
      }
      
      .modal-btn:active {
        transform: scale(0.95);
      }
      
      .modal-btn.full-width {
        width: 100%;
      }
      
      /* Vote Modal Styles */
      .vote-modal-header {
        text-align: center;
        margin-bottom: 1rem;
      }
      
      .vote-icon {
        font-size: 3rem;
        margin-bottom: 0.5rem;
      }
      
      .vote-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--gaming-accent);
        margin-bottom: 0.5rem;
      }
      
      .token-cost {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        color: var(--burn-orange);
        font-weight: 600;
      }
      
      .super-vote-warning {
        background: rgba(247, 147, 30, 0.1);
        border: 1px solid var(--burn-orange);
        border-radius: 8px;
        padding: 0.75rem;
        margin-top: 1rem;
        color: var(--burn-orange);
        font-size: 0.875rem;
      }
      
      .vote-modal-actions {
        display: flex;
        gap: 1rem;
        margin-top: 1.5rem;
      }
      
      /* Clan Modal Styles */
      .clan-modal-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      
      .clan-avatar {
        width: 64px;
        height: 64px;
        background: var(--gaming-surface);
        border: 2px solid var(--gaming-accent);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
      }
      
      .clan-name {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--gaming-accent);
        margin: 0;
      }
      
      .clan-tag {
        color: var(--text-secondary);
        margin: 0;
        font-size: 0.875rem;
      }
      
      .member-stats {
        display: flex;
        gap: 2rem;
        margin-top: 1rem;
      }
      
      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
      }
      
      .stat-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
        text-transform: uppercase;
      }
      
      .stat-value {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--gaming-accent);
      }
      
      /* Achievement Modal Styles */
      .achievement-modal-header {
        text-align: center;
        margin-bottom: 1.5rem;
      }
      
      .achievement-celebration {
        font-size: 4rem;
        animation: bounce 1s ease-in-out infinite alternate;
      }
      
      .achievement-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--gaming-accent);
        margin: 0.5rem 0;
      }
      
      .achievement-icon {
        font-size: 4rem;
        margin: 1rem 0;
      }
      
      .achievement-name {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--gaming-accent);
        margin-bottom: 0.5rem;
      }
      
      .achievement-rewards {
        display: flex;
        gap: 1rem;
        margin-top: 1.5rem;
        justify-content: center;
      }
      
      .reward-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--tile-bg-secondary);
        border: 1px solid var(--tile-border);
        border-radius: 8px;
        padding: 0.5rem 1rem;
      }
      
      /* Tournament Modal Styles */
      .tournament-modal-header {
        text-align: center;
        margin-bottom: 1.5rem;
      }
      
      .tournament-badge {
        font-size: 3rem;
        margin-bottom: 0.5rem;
      }
      
      .tournament-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--gaming-accent);
        margin-bottom: 0.5rem;
      }
      
      .tournament-status {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        background: var(--gaming-accent);
        color: black;
      }
      
      .tournament-info {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      
      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        background: var(--tile-bg-secondary);
        border-radius: 6px;
      }
      
      .info-label {
        color: var(--text-secondary);
        font-size: 0.875rem;
      }
      
      .info-value {
        color: var(--gaming-accent);
        font-weight: 600;
      }
      
      /* Celebration Effects */
      .touch-modal.celebratory .modal-container {
        animation: celebration-entrance 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      
      @keyframes celebration-entrance {
        0% {
          transform: scale(0) rotate(-180deg);
          opacity: 0;
        }
        50% {
          transform: scale(1.1) rotate(-90deg);
          opacity: 0.8;
        }
        100% {
          transform: scale(1) rotate(0deg);
          opacity: 1;
        }
      }
      
      @keyframes bounce {
        from { transform: translateY(0px); }
        to { transform: translateY(-10px); }
      }
      
      @keyframes confetti-fall {
        0% {
          opacity: 1;
          transform: translateY(-100vh) rotate(0deg);
        }
        100% {
          opacity: 0;
          transform: translateY(100vh) rotate(360deg);
        }
      }
      
      /* Responsive adjustments */
      @media (max-width: 768px) {
        .modal-container {
          margin: 1rem;
          max-height: calc(100vh - 2rem);
        }
        
        .modal-header,
        .modal-content {
          padding: 1rem;
        }
        
        .vote-modal-actions {
          flex-direction: column;
        }
        
        .tournament-info {
          grid-template-columns: 1fr;
        }
      }
      
      /* Accessibility */
      @media (prefers-reduced-motion: reduce) {
        .touch-modal,
        .achievement-celebration,
        .modal-btn {
          animation: none !important;
          transition: none !important;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    this.closeAll();
    if (this.backdropElement) {
      this.backdropElement.remove();
    }
  }
}

// Export default instance
export default new TouchModalSystem();