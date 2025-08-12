/**
 * MLG.clan Mobile-Optimized Voting Interface
 * 
 * Touch-first voting interface designed for mobile gaming
 * Optimized for thumb navigation and competitive gaming workflows
 * 
 * Features:
 * - Mobile-first responsive design
 * - Touch-friendly button sizes (44px+ minimum)
 * - Thumb navigation zones
 * - Swipe gestures for voting
 * - Haptic feedback simulation
 * - Mobile-optimized burn-to-vote workflow
 * - Real-time vote updates
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
 * Mobile Voting Interface Configuration
 */
const MOBILE_VOTING_CONFIG = {
  // Touch zones optimized for thumb reach
  THUMB_ZONE_HEIGHT: '60px',
  BUTTON_MIN_SIZE: '44px',
  LARGE_BUTTON_SIZE: '56px',
  
  // Mobile-specific animations
  ANIMATION_DURATION: 200,
  HAPTIC_DURATION: 50,
  
  // Swipe gesture thresholds
  SWIPE_THRESHOLD: 50,
  SWIPE_VELOCITY_THRESHOLD: 0.3,
  
  // Mobile voting flow
  MOBILE_CONFIRMATION_DELAY: 1500,
  QUICK_VOTE_TIMEOUT: 3000
};

/**
 * Mobile Voting Interface Component
 * Provides touch-optimized voting experience for mobile devices
 */
export class MobileVotingInterface {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      contentId: null,
      onVote: () => {},
      onCancel: () => {},
      enableSwipeGestures: true,
      enableHapticFeedback: true,
      showQuickVote: true,
      ...options
    };
    
    this.state = {
      isVoting: false,
      selectedOption: null,
      burnAmount: 0,
      confirmationStep: 0,
      showQuickVote: false
    };
    
    this.touchState = {
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      isDragging: false
    };
    
    this.init();
  }

  /**
   * Initialize mobile voting interface
   */
  init() {
    this.createMobileLayout();
    this.setupTouchHandlers();
    this.setupMobileAnimations();
    
    if (deviceUtils.isTouchDevice()) {
      this.enableMobileOptimizations();
    }
  }

  /**
   * Create mobile-optimized voting layout
   */
  createMobileLayout() {
    const isMobile = deviceUtils.getCurrentBreakpoint() === 'base' || 
                    deviceUtils.getCurrentBreakpoint() === 'sm';
    
    this.container.innerHTML = `
      <div class="mobile-voting-container ${generateGamingClasses('voting')}">
        <!-- Mobile Header -->
        <div class="mobile-voting-header ${this.getHeaderClasses()}">
          <button class="mobile-back-btn ${this.getBackButtonClasses()}" 
                  data-action="cancel">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
            <span>Back</span>
          </button>
          
          <div class="mobile-voting-title">
            <h2 class="${generateGamingClasses('gamingHeader')}">Vote to Rank</h2>
            <p class="text-sm text-gray-400">Burn MLG tokens to vote</p>
          </div>
        </div>

        <!-- Mobile Voting Options -->
        <div class="mobile-voting-options ${this.getVotingOptionsClasses()}">
          <div class="vote-option-mobile" data-option="upvote">
            <div class="vote-icon-container">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" class="vote-icon upvote">
                <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
              </svg>
            </div>
            <div class="vote-option-content">
              <h3>Upvote</h3>
              <p>Support this content</p>
            </div>
            <div class="vote-option-action">
              <div class="quick-vote-indicator"></div>
            </div>
          </div>

          <div class="vote-option-mobile" data-option="downvote">
            <div class="vote-icon-container">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" class="vote-icon downvote">
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>
              </svg>
            </div>
            <div class="vote-option-content">
              <h3>Downvote</h3>
              <p>Flag inappropriate content</p>
            </div>
            <div class="vote-option-action">
              <div class="quick-vote-indicator"></div>
            </div>
          </div>
        </div>

        <!-- Mobile Burn Amount Selection -->
        <div class="mobile-burn-selection ${this.getBurnSelectionClasses()}">
          <div class="burn-header">
            <h3>Select Burn Amount</h3>
            <div class="balance-display">
              Balance: <span class="token-balance">--</span> MLG
            </div>
          </div>
          
          <div class="burn-presets-mobile">
            <button class="burn-preset-btn" data-amount="1">
              <span class="amount">1</span>
              <span class="label">Quick</span>
            </button>
            <button class="burn-preset-btn" data-amount="5">
              <span class="amount">5</span>
              <span class="label">Standard</span>
            </button>
            <button class="burn-preset-btn" data-amount="10">
              <span class="amount">10</span>
              <span class="label">Strong</span>
            </button>
            <button class="burn-preset-btn" data-amount="25">
              <span class="amount">25</span>
              <span class="label">Power</span>
            </button>
          </div>

          <div class="burn-custom-input">
            <input type="number" 
                   class="mobile-burn-input" 
                   placeholder="Custom amount"
                   min="1"
                   max="1000">
            <button class="max-btn">MAX</button>
          </div>
        </div>

        <!-- Mobile Confirmation Area -->
        <div class="mobile-confirmation ${this.getConfirmationClasses()}">
          <div class="confirmation-summary">
            <div class="summary-row">
              <span>Action:</span>
              <span class="action-type">--</span>
            </div>
            <div class="summary-row">
              <span>Burn Amount:</span>
              <span class="burn-amount">-- MLG</span>
            </div>
            <div class="summary-row">
              <span>Vote Weight:</span>
              <span class="vote-weight">--</span>
            </div>
          </div>

          <div class="mobile-action-buttons">
            <button class="cancel-btn-mobile ${this.getCancelButtonClasses()}"
                    data-action="cancel">
              Cancel
            </button>
            <button class="confirm-vote-btn-mobile ${this.getConfirmButtonClasses()}"
                    data-action="confirm"
                    disabled>
              <span class="btn-text">Confirm Vote</span>
              <span class="btn-loading hidden">
                <svg class="loading-spinner" width="20" height="20" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" 
                          fill="none" stroke-dasharray="32" stroke-dashoffset="32">
                    <animate attributeName="stroke-dashoffset" dur="1s" 
                             values="32;0" repeatCount="indefinite"/>
                  </circle>
                </svg>
                Voting...
              </span>
            </button>
          </div>
        </div>

        <!-- Mobile Quick Vote Overlay -->
        ${this.options.showQuickVote ? this.createQuickVoteOverlay() : ''}

        <!-- Mobile Swipe Indicators -->
        ${this.options.enableSwipeGestures ? this.createSwipeIndicators() : ''}
      </div>
    `;

    this.bindMobileEvents();
  }

  /**
   * Create quick vote overlay for rapid voting
   */
  createQuickVoteOverlay() {
    return `
      <div class="quick-vote-overlay hidden">
        <div class="quick-vote-content">
          <div class="quick-vote-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
            </svg>
          </div>
          <h3>Quick Vote Cast!</h3>
          <p>1 MLG burned for upvote</p>
        </div>
      </div>
    `;
  }

  /**
   * Create swipe gesture indicators
   */
  createSwipeIndicators() {
    return `
      <div class="swipe-indicators">
        <div class="swipe-indicator left">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
          <span>Swipe left to downvote</span>
        </div>
        <div class="swipe-indicator right">
          <span>Swipe right to upvote</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
        </div>
      </div>
    `;
  }

  /**
   * Get responsive CSS classes for components
   */
  getHeaderClasses() {
    return generateGamingClasses('gamingHeader', {
      base: 'flex items-center justify-between p-4 bg-gaming-surface border-b border-tile-border',
      sm: 'p-6'
    });
  }

  getBackButtonClasses() {
    return getTouchOptimizedClasses(
      `${touchUtils.touchTargetLarge} flex items-center gap-2 text-gaming-accent bg-tile-bg-primary border border-tile-border rounded-lg px-4 py-2 transition-all duration-200 hover:bg-tile-hover active:scale-95`
    );
  }

  getVotingOptionsClasses() {
    return generateGamingClasses('voting', {
      base: 'space-y-4 p-4',
      sm: 'space-y-6 p-6'
    });
  }

  getBurnSelectionClasses() {
    return generateGamingClasses('gamingCard', {
      base: 'bg-tile-bg-primary border border-tile-border rounded-lg p-4 space-y-4',
      sm: 'p-6 space-y-6'
    });
  }

  getConfirmationClasses() {
    return generateGamingClasses('gamingCard', {
      base: 'bg-gaming-surface border border-gaming-accent rounded-lg p-4 space-y-4',
      sm: 'p-6 space-y-6'
    });
  }

  getCancelButtonClasses() {
    return getTouchOptimizedClasses(
      `${touchUtils.gamingTouchTarget} flex items-center justify-center px-6 py-3 bg-tile-bg-primary border border-gray-600 text-gray-300 rounded-lg transition-all duration-200 active:scale-95 hover:bg-gray-700`
    );
  }

  getConfirmButtonClasses() {
    return getTouchOptimizedClasses(
      `${touchUtils.gamingTouchTarget} flex items-center justify-center px-6 py-3 bg-gradient-to-r from-gaming-accent to-xbox-green-light text-black font-semibold rounded-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`
    );
  }

  /**
   * Setup touch event handlers
   */
  setupTouchHandlers() {
    if (!this.options.enableSwipeGestures) return;

    const votingOptions = this.container.querySelector('.mobile-voting-options');
    
    votingOptions.addEventListener('touchstart', (e) => {
      this.handleTouchStart(e);
    }, { passive: false });

    votingOptions.addEventListener('touchmove', (e) => {
      this.handleTouchMove(e);
    }, { passive: false });

    votingOptions.addEventListener('touchend', (e) => {
      this.handleTouchEnd(e);
    }, { passive: false });
  }

  /**
   * Handle touch start for swipe gestures
   */
  handleTouchStart(e) {
    const touch = e.touches[0];
    this.touchState.startX = touch.clientX;
    this.touchState.startY = touch.clientY;
    this.touchState.currentX = touch.clientX;
    this.touchState.currentY = touch.clientY;
    this.touchState.isDragging = false;
  }

  /**
   * Handle touch move for swipe feedback
   */
  handleTouchMove(e) {
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    this.touchState.currentX = touch.clientX;
    this.touchState.currentY = touch.clientY;

    const deltaX = this.touchState.currentX - this.touchState.startX;
    const deltaY = Math.abs(this.touchState.currentY - this.touchState.startY);

    // Check if horizontal swipe
    if (Math.abs(deltaX) > 10 && deltaY < 50) {
      this.touchState.isDragging = true;
      e.preventDefault();
      
      // Provide visual feedback
      this.updateSwipeFeedback(deltaX);
    }
  }

  /**
   * Handle touch end for swipe completion
   */
  handleTouchEnd(e) {
    if (!this.touchState.isDragging) return;

    const deltaX = this.touchState.currentX - this.touchState.startX;
    const deltaY = Math.abs(this.touchState.currentY - this.touchState.startY);

    // Reset swipe feedback
    this.clearSwipeFeedback();

    // Check for valid swipe
    if (Math.abs(deltaX) > MOBILE_VOTING_CONFIG.SWIPE_THRESHOLD && deltaY < 100) {
      if (deltaX > 0) {
        this.handleQuickVote('upvote');
      } else {
        this.handleQuickVote('downvote');
      }
      
      // Haptic feedback
      this.triggerHapticFeedback();
    }

    this.touchState.isDragging = false;
  }

  /**
   * Update visual feedback during swipe
   */
  updateSwipeFeedback(deltaX) {
    const options = this.container.querySelectorAll('.vote-option-mobile');
    const upvoteOption = options[0];
    const downvoteOption = options[1];

    if (deltaX > 0) {
      // Upvote feedback
      upvoteOption.style.transform = `translateX(${Math.min(deltaX * 0.3, 30)}px)`;
      upvoteOption.style.backgroundColor = 'rgba(0, 255, 136, 0.1)';
      downvoteOption.style.transform = '';
      downvoteOption.style.backgroundColor = '';
    } else {
      // Downvote feedback
      downvoteOption.style.transform = `translateX(${Math.max(deltaX * 0.3, -30)}px)`;
      downvoteOption.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
      upvoteOption.style.transform = '';
      upvoteOption.style.backgroundColor = '';
    }
  }

  /**
   * Clear swipe visual feedback
   */
  clearSwipeFeedback() {
    const options = this.container.querySelectorAll('.vote-option-mobile');
    options.forEach(option => {
      option.style.transform = '';
      option.style.backgroundColor = '';
    });
  }

  /**
   * Handle quick vote action
   */
  handleQuickVote(voteType) {
    if (this.state.isVoting) return;

    this.state.selectedOption = voteType;
    this.state.burnAmount = 1; // Default quick vote amount

    // Show quick vote overlay
    this.showQuickVoteOverlay(voteType);

    // Execute vote after delay
    setTimeout(() => {
      this.executeVote();
    }, MOBILE_VOTING_CONFIG.MOBILE_CONFIRMATION_DELAY);
  }

  /**
   * Show quick vote overlay
   */
  showQuickVoteOverlay(voteType) {
    const overlay = this.container.querySelector('.quick-vote-overlay');
    if (!overlay) return;

    const icon = overlay.querySelector('.quick-vote-icon svg');
    const title = overlay.querySelector('h3');
    const description = overlay.querySelector('p');

    if (voteType === 'upvote') {
      icon.innerHTML = '<path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>';
      icon.className = 'text-gaming-accent';
      title.textContent = 'Quick Upvote!';
      description.textContent = '1 MLG burned for upvote';
    } else {
      icon.innerHTML = '<path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>';
      icon.className = 'text-gaming-red';
      title.textContent = 'Quick Downvote!';
      description.textContent = '1 MLG burned for downvote';
    }

    overlay.classList.remove('hidden');
    overlay.classList.add('animate-scale-in');

    // Hide after timeout
    setTimeout(() => {
      overlay.classList.add('hidden');
      overlay.classList.remove('animate-scale-in');
    }, MOBILE_VOTING_CONFIG.QUICK_VOTE_TIMEOUT);
  }

  /**
   * Bind mobile-specific events
   */
  bindMobileEvents() {
    // Burn preset buttons
    this.container.querySelectorAll('.burn-preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const amount = parseInt(e.currentTarget.dataset.amount);
        this.selectBurnAmount(amount);
      });
    });

    // Vote option buttons
    this.container.querySelectorAll('.vote-option-mobile').forEach(option => {
      option.addEventListener('click', (e) => {
        const voteType = e.currentTarget.dataset.option;
        this.selectVoteOption(voteType);
      });
    });

    // Action buttons
    this.container.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action) {
        this.handleAction(action);
      }
    });

    // Custom burn input
    const burnInput = this.container.querySelector('.mobile-burn-input');
    burnInput?.addEventListener('input', (e) => {
      const amount = parseFloat(e.target.value) || 0;
      this.updateBurnAmount(amount);
    });
  }

  /**
   * Setup mobile-specific animations
   */
  setupMobileAnimations() {
    // Add CSS animations for mobile
    const style = document.createElement('style');
    style.textContent = `
      .mobile-voting-container .vote-option-mobile {
        transition: all ${MOBILE_VOTING_CONFIG.ANIMATION_DURATION}ms ease;
      }
      
      .mobile-voting-container .vote-option-mobile:active {
        transform: scale(0.95);
        background-color: rgba(0, 255, 136, 0.05);
      }
      
      .mobile-voting-container .burn-preset-btn {
        transition: all ${MOBILE_VOTING_CONFIG.ANIMATION_DURATION}ms ease;
      }
      
      .mobile-voting-container .burn-preset-btn:active {
        transform: scale(0.9);
      }
      
      .quick-vote-overlay {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(26, 26, 46, 0.95);
        border: 1px solid rgba(0, 255, 136, 0.3);
        border-radius: 12px;
        padding: 2rem;
        text-align: center;
        z-index: 1000;
        backdrop-filter: blur(10px);
      }
      
      .animate-scale-in {
        animation: scaleIn 0.3s ease-out;
      }
      
      @keyframes scaleIn {
        0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Enable mobile-specific optimizations
   */
  enableMobileOptimizations() {
    // Disable text selection on voting elements
    this.container.style.userSelect = 'none';
    this.container.style.webkitUserSelect = 'none';
    
    // Optimize touch targets
    this.container.style.touchAction = 'manipulation';
    
    // Prevent bounce scrolling during voting
    document.body.style.overscrollBehavior = 'none';
  }

  /**
   * Trigger haptic feedback (vibration)
   */
  triggerHapticFeedback() {
    if (!this.options.enableHapticFeedback) return;
    
    if ('vibrate' in navigator) {
      navigator.vibrate(MOBILE_VOTING_CONFIG.HAPTIC_DURATION);
    }
  }

  /**
   * Select vote option
   */
  selectVoteOption(voteType) {
    this.state.selectedOption = voteType;
    
    // Update UI
    this.container.querySelectorAll('.vote-option-mobile').forEach(option => {
      option.classList.toggle('selected', option.dataset.option === voteType);
    });
    
    this.updateConfirmationSummary();
    this.triggerHapticFeedback();
  }

  /**
   * Select burn amount
   */
  selectBurnAmount(amount) {
    this.state.burnAmount = amount;
    
    // Update UI
    this.container.querySelectorAll('.burn-preset-btn').forEach(btn => {
      btn.classList.toggle('selected', parseInt(btn.dataset.amount) === amount);
    });
    
    const customInput = this.container.querySelector('.mobile-burn-input');
    customInput.value = amount;
    
    this.updateConfirmationSummary();
    this.triggerHapticFeedback();
  }

  /**
   * Update burn amount
   */
  updateBurnAmount(amount) {
    this.state.burnAmount = amount;
    this.updateConfirmationSummary();
  }

  /**
   * Update confirmation summary
   */
  updateConfirmationSummary() {
    const actionType = this.container.querySelector('.action-type');
    const burnAmount = this.container.querySelector('.burn-amount');
    const voteWeight = this.container.querySelector('.vote-weight');
    const confirmBtn = this.container.querySelector('.confirm-vote-btn-mobile');

    if (actionType) {
      actionType.textContent = this.state.selectedOption || '--';
    }
    
    if (burnAmount) {
      burnAmount.textContent = this.state.burnAmount > 0 ? `${this.state.burnAmount} MLG` : '-- MLG';
    }
    
    if (voteWeight) {
      voteWeight.textContent = this.state.burnAmount > 0 ? this.state.burnAmount.toString() : '--';
    }

    // Enable/disable confirm button
    const canConfirm = this.state.selectedOption && this.state.burnAmount > 0;
    confirmBtn.disabled = !canConfirm;
  }

  /**
   * Handle action buttons
   */
  handleAction(action) {
    switch (action) {
      case 'cancel':
        this.options.onCancel();
        break;
      case 'confirm':
        this.executeVote();
        break;
    }
  }

  /**
   * Execute vote transaction
   */
  async executeVote() {
    if (this.state.isVoting) return;
    
    this.state.isVoting = true;
    
    const confirmBtn = this.container.querySelector('.confirm-vote-btn-mobile');
    const btnText = confirmBtn.querySelector('.btn-text');
    const btnLoading = confirmBtn.querySelector('.btn-loading');
    
    // Show loading state
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');
    confirmBtn.disabled = true;
    
    try {
      // Execute vote through callback
      await this.options.onVote({
        contentId: this.options.contentId,
        voteType: this.state.selectedOption,
        burnAmount: this.state.burnAmount
      });
      
      // Success feedback
      this.triggerHapticFeedback();
      
    } catch (error) {
      console.error('Mobile voting error:', error);
      // Show error state
      
    } finally {
      this.state.isVoting = false;
      
      // Reset loading state
      btnText.classList.remove('hidden');
      btnLoading.classList.add('hidden');
      confirmBtn.disabled = false;
    }
  }

  /**
   * Destroy component and cleanup
   */
  destroy() {
    // Remove event listeners
    document.body.style.overscrollBehavior = '';
    
    // Clear any timeouts
    // Clean up component
    this.container.innerHTML = '';
  }
}

/**
 * Mobile Voting Interface Styles
 * Responsive CSS classes for mobile-optimized voting
 */
export const mobileVotingStyles = `
  .mobile-voting-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--gaming-bg);
    color: white;
    overflow-y: auto;
  }

  .vote-option-mobile {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--tile-bg-primary);
    border: 1px solid var(--tile-border);
    border-radius: 8px;
    cursor: pointer;
    min-height: 64px;
    position: relative;
  }

  .vote-option-mobile.selected {
    border-color: var(--gaming-accent);
    background: rgba(0, 255, 136, 0.1);
  }

  .vote-icon-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--gaming-surface);
  }

  .vote-icon.upvote {
    color: var(--gaming-accent);
  }

  .vote-icon.downvote {
    color: var(--gaming-red);
  }

  .vote-option-content {
    flex: 1;
  }

  .vote-option-content h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
  }

  .vote-option-content p {
    margin: 0;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .burn-presets-mobile {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
  }

  .burn-preset-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1rem 0.5rem;
    background: var(--tile-bg-primary);
    border: 1px solid var(--tile-border);
    border-radius: 8px;
    color: white;
    cursor: pointer;
    min-height: 72px;
  }

  .burn-preset-btn.selected {
    border-color: var(--gaming-accent);
    background: rgba(0, 255, 136, 0.1);
  }

  .burn-preset-btn .amount {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--gaming-accent);
  }

  .burn-preset-btn .label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .burn-custom-input {
    display: flex;
    gap: 0.5rem;
  }

  .mobile-burn-input {
    flex: 1;
    padding: 0.75rem;
    background: var(--gaming-surface);
    border: 1px solid var(--tile-border);
    border-radius: 8px;
    color: white;
    font-size: 1rem;
    min-height: 44px;
  }

  .max-btn {
    padding: 0.75rem 1rem;
    background: var(--gaming-accent);
    color: black;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    min-height: 44px;
    min-width: 60px;
  }

  .mobile-action-buttons {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 1rem;
    margin-top: 1rem;
  }

  .swipe-indicators {
    position: fixed;
    bottom: 100px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    padding: 0 2rem;
    pointer-events: none;
    opacity: 0.6;
  }

  .swipe-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.7);
  }

  @media (max-width: 640px) {
    .mobile-voting-header {
      padding: 1rem;
    }
    
    .mobile-voting-options {
      padding: 1rem;
    }
    
    .burn-presets-mobile {
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    
    .burn-preset-btn {
      min-height: 80px;
    }
  }
`;

// Export default for easy importing
export default MobileVotingInterface;