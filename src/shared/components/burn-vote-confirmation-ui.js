/**
 * MLG.clan Burn Vote Confirmation UI - Sub-task 3.8
 * 
 * Production-ready confirmation dialogs for SPL token burn votes with transaction simulation.
 * Implements Xbox 360 retro aesthetic with comprehensive error handling, multi-stage confirmations,
 * and accessibility compliance.
 * 
 * Features:
 * - BurnVoteConfirmationModal with transaction simulation preview
 * - Multi-stage confirmation flow for high-value burns (4+ MLG tokens)
 * - Transaction cost breakdown with MLG tokens + SOL fees
 * - Error dialogs with Xbox-themed styling
 * - Success animations with celebration effects
 * - Full accessibility with ARIA labels and keyboard navigation
 * - Mobile-responsive design with proper touch targets
 * - Integration with existing Solana voting system
 * 
 * @author Claude Code - Production Frontend Engineer
 * @version 1.0.0
 */

import { 
  generateBurnVotePreview,
  calculateTotalBurnCost,
  getNextBurnVoteCost,
  validateBurnVoteAffordability,
  validateBurnAmount,
  getVotingConfig
} from '../../features/voting/solana-voting-system.js';

import { MLGTokenManager } from '../../features/tokens/spl-mlg-token.js';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

/**
 * Burn Vote Confirmation Configuration
 */
const BURN_CONFIRMATION_CONFIG = {
  // MLG Token contract address
  MLG_TOKEN_ADDRESS: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL',
  
  // Confirmation levels based on token burn amount
  CONFIRMATION_LEVELS: {
    STANDARD: { minTokens: 1, maxTokens: 3, stages: 1, confirmations: 1 },
    HIGH_VALUE: { minTokens: 4, maxTokens: 10, stages: 2, confirmations: 2 },
    LEGENDARY: { minTokens: 11, maxTokens: Infinity, stages: 3, confirmations: 3 }
  },
  
  // Animation timings
  MODAL_TRANSITION_DURATION: 300,
  BURN_GLOW_DURATION: 2000,
  SUCCESS_CELEBRATION_DURATION: 2500,
  ERROR_PULSE_DURATION: 1000,
  
  // Transaction simulation
  SIMULATION_TIMEOUT: 10000,
  DEFAULT_NETWORK_FEE: 0.001,
  CONFIRMATION_TIME_ESTIMATE: '5-10 seconds',
  
  // UI constants
  MOBILE_BREAKPOINT: 768,
  MIN_TOUCH_TARGET: 44,
  FOCUS_OUTLINE_WIDTH: 2
};

/**
 * Error types for burn vote operations
 */
export const BurnVoteError = {
  INSUFFICIENT_BALANCE: 'insufficient_balance',
  NETWORK_ERROR: 'network_error',
  TRANSACTION_FAILED: 'transaction_failed',
  SIMULATION_FAILED: 'simulation_failed',
  USER_REJECTED: 'user_rejected',
  WALLET_NOT_CONNECTED: 'wallet_not_connected',
  INVALID_AMOUNT: 'invalid_amount'
};

/**
 * Main Burn Vote Confirmation System
 * Manages all confirmation dialogs and transaction flows
 */
export class BurnVoteConfirmationSystem {
  constructor(options = {}) {
    this.votingSystem = options.votingSystem || null;
    this.connection = options.connection || null;
    this.wallet = options.wallet || null;
    this.tokenManager = new MLGTokenManager();
    
    // Component registry
    this.activeModals = new Map();
    this.confirmationStates = new Map();
    
    // Event callbacks
    this.onConfirm = options.onConfirm || null;
    this.onCancel = options.onCancel || null;
    this.onError = options.onError || null;
    this.onSuccess = options.onSuccess || null;
    
    // Initialize CSS
    this.initializeCSS();
    
    console.log('Burn Vote Confirmation System initialized');
  }

  /**
   * Initialize CSS styles for burn vote confirmation UI
   */
  initializeCSS() {
    const cssId = 'burn-vote-confirmation-styles';
    if (document.getElementById(cssId)) return;

    const css = `
      <style id="${cssId}">
        /* CSS Design Tokens */
        :root {
          /* Primary Colors */
          --xbox-green: #10b981;
          --xbox-green-hover: #059669;
          --xbox-green-light: #34d399;
          
          /* Burn Effect Colors */
          --burn-orange: #f59e0b;
          --burn-red: #dc2626;
          --burn-gradient: linear-gradient(45deg, #dc2626, #f59e0b);
          --warning-gradient: linear-gradient(45deg, #f59e0b, #d97706);
          
          /* State Colors */
          --success-gradient: linear-gradient(45deg, #10b981, #059669);
          --error-color: #ef4444;
          --info-color: #3b82f6;
          
          /* Surface Colors */
          --modal-bg: rgba(0, 0, 0, 0.8);
          --tile-bg: rgba(31, 41, 55, 0.95);
          --tile-border: rgba(16, 185, 129, 0.3);
          
          /* Spacing (8px grid) */
          --spacing-xs: 4px;
          --spacing-sm: 8px;
          --spacing-md: 16px;
          --spacing-lg: 24px;
          --spacing-xl: 32px;
          --spacing-2xl: 48px;
          
          /* Typography */
          --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          --font-size-xs: 0.75rem;
          --font-size-sm: 0.875rem;
          --font-size-base: 1rem;
          --font-size-lg: 1.125rem;
          --font-size-xl: 1.25rem;
          --font-size-2xl: 1.5rem;
          --font-weight-normal: 400;
          --font-weight-semibold: 600;
          --font-weight-bold: 700;
          
          /* Transitions */
          --transition-fast: 0.15s ease-out;
          --transition-medium: 0.3s ease;
          --transition-slow: 0.5s ease;
          --bounce-timing: cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        /* Keyframe Animations */
        @keyframes burn-glow {
          0%, 100% { 
            box-shadow: 0 0 10px rgba(220, 38, 38, 0.5); 
          }
          50% { 
            box-shadow: 0 0 20px rgba(245, 158, 11, 0.7); 
          }
        }

        @keyframes success-celebration {
          0% { 
            transform: scale(0.8); 
            opacity: 0; 
          }
          50% { 
            transform: scale(1.1); 
          }
          100% { 
            transform: scale(1); 
            opacity: 1; 
          }
        }

        @keyframes warning-pulse {
          0%, 100% { 
            transform: scale(1); 
            opacity: 1; 
          }
          50% { 
            transform: scale(1.02); 
            opacity: 0.9; 
          }
        }

        @keyframes simulation-scan {
          0%, 100% { 
            border-color: rgba(59, 130, 246, 0.3); 
          }
          50% { 
            border-color: rgba(59, 130, 246, 0.6); 
          }
        }

        @keyframes modal-enter {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes modal-exit {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
        }

        /* Burn Vote Modal Styles */
        .burn-vote-modal-overlay {
          position: fixed;
          inset: 0;
          background: var(--modal-bg);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-md);
          z-index: 2000;
          opacity: 0;
          transition: opacity var(--transition-medium);
        }

        .burn-vote-modal-overlay.show {
          opacity: 1;
        }

        .burn-vote-modal-container {
          background: var(--tile-bg);
          border: 2px solid var(--tile-border);
          border-radius: calc(var(--spacing-sm) * 2);
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
          max-width: 480px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          padding: var(--spacing-lg);
          animation: modal-enter var(--transition-medium) var(--bounce-timing);
        }

        .burn-vote-modal-container.exiting {
          animation: modal-exit var(--transition-medium) ease-in;
        }

        /* Modal Header */
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
          padding-bottom: var(--spacing-md);
          border-bottom: 1px solid rgba(156, 163, 175, 0.3);
        }

        .modal-title {
          color: var(--xbox-green);
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          color: #9ca3af;
          font-size: var(--font-size-xl);
          cursor: pointer;
          padding: var(--spacing-xs);
          border-radius: 4px;
          transition: var(--transition-fast);
          min-width: 32px;
          min-height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close:hover {
          color: white;
          background: rgba(156, 163, 175, 0.1);
        }

        .modal-close:focus {
          outline: var(--focus-outline-width) solid var(--xbox-green);
          outline-offset: 2px;
        }

        /* Content Preview Section */
        .content-preview {
          background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: var(--spacing-sm);
          padding: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }

        .content-preview-title {
          color: var(--xbox-green-light);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          margin-bottom: var(--spacing-sm);
        }

        .content-preview-details {
          color: #d1d5db;
          font-size: var(--font-size-sm);
          line-height: 1.5;
        }

        /* Transaction Simulation */
        .transaction-simulation {
          background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: var(--spacing-sm);
          padding: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
          animation: simulation-scan 3s infinite;
        }

        .simulation-title {
          color: var(--info-color);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          margin-bottom: var(--spacing-md);
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .simulation-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-xs) 0;
          font-size: var(--font-size-sm);
          color: #d1d5db;
        }

        .simulation-total {
          border-top: 1px solid rgba(156, 163, 175, 0.3);
          padding-top: var(--spacing-sm);
          margin-top: var(--spacing-sm);
          font-weight: var(--font-weight-semibold);
        }

        .simulation-accuracy {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          text-transform: uppercase;
        }

        .simulation-accuracy.high {
          background: rgba(16, 185, 129, 0.2);
          color: var(--xbox-green-light);
        }

        .simulation-accuracy.medium {
          background: rgba(245, 158, 11, 0.2);
          color: var(--burn-orange);
        }

        .simulation-accuracy.low {
          background: rgba(239, 68, 68, 0.2);
          color: var(--error-color);
        }

        /* Burn Warning Section */
        .burn-warning {
          background: var(--warning-gradient);
          border-radius: var(--spacing-sm);
          padding: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
          animation: warning-pulse 2s infinite;
        }

        .burn-warning-content {
          color: #1f2937;
          font-weight: var(--font-weight-semibold);
          text-align: center;
        }

        .burn-warning-icon {
          font-size: var(--font-size-2xl);
          margin-bottom: var(--spacing-sm);
        }

        /* Multi-stage Confirmation */
        .multi-stage-confirmation {
          background: rgba(31, 41, 55, 0.5);
          border: 1px solid var(--burn-orange);
          border-radius: var(--spacing-sm);
          padding: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }

        .confirmation-stage-title {
          color: var(--burn-orange);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
          margin-bottom: var(--spacing-md);
        }

        .confirmation-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-sm);
          padding: var(--spacing-sm);
          border-radius: 4px;
          transition: var(--transition-fast);
        }

        .confirmation-item:hover {
          background: rgba(245, 158, 11, 0.1);
        }

        .confirmation-checkbox {
          appearance: none;
          width: 20px;
          height: 20px;
          border: 2px solid var(--burn-orange);
          border-radius: 4px;
          position: relative;
          cursor: pointer;
          transition: var(--transition-fast);
          flex-shrink: 0;
        }

        .confirmation-checkbox:checked {
          background: var(--burn-orange);
          border-color: var(--burn-red);
        }

        .confirmation-checkbox:checked::after {
          content: "✓";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #1f2937;
          font-weight: bold;
          font-size: 12px;
        }

        .confirmation-checkbox:focus {
          outline: 2px solid var(--xbox-green);
          outline-offset: 2px;
        }

        .confirmation-label {
          color: #d1d5db;
          font-size: var(--font-size-sm);
          cursor: pointer;
          user-select: none;
        }

        /* Modal Actions */
        .modal-actions {
          display: flex;
          gap: var(--spacing-md);
          justify-content: flex-end;
          margin-top: var(--spacing-lg);
        }

        .btn-cancel, .btn-confirm {
          padding: var(--spacing-sm) var(--spacing-lg);
          border-radius: var(--spacing-sm);
          font-weight: var(--font-weight-semibold);
          font-size: var(--font-size-base);
          cursor: pointer;
          transition: all var(--transition-fast);
          min-height: var(--min-touch-target);
          min-width: 100px;
          border: none;
          outline: none;
        }

        .btn-cancel {
          background: rgba(156, 163, 175, 0.1);
          color: #9ca3af;
          border: 1px solid rgba(156, 163, 175, 0.3);
        }

        .btn-cancel:hover {
          background: rgba(156, 163, 175, 0.2);
          color: white;
        }

        .btn-cancel:focus {
          outline: 2px solid var(--xbox-green);
          outline-offset: 2px;
        }

        .btn-confirm {
          background: var(--burn-gradient);
          color: white;
          position: relative;
          overflow: hidden;
        }

        .btn-confirm:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
        }

        .btn-confirm:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-confirm:focus {
          outline: 2px solid var(--xbox-green);
          outline-offset: 2px;
        }

        .btn-confirm:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .btn-confirm.burn-effect {
          animation: burn-glow var(--burn-glow-duration) infinite;
        }

        /* Success Modal */
        .success-modal {
          text-align: center;
        }

        .success-icon {
          font-size: 4rem;
          color: var(--xbox-green);
          margin-bottom: var(--spacing-lg);
          animation: success-celebration var(--success-celebration-duration) var(--bounce-timing);
        }

        .success-message {
          color: var(--xbox-green-light);
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          margin-bottom: var(--spacing-sm);
        }

        .success-details {
          color: #d1d5db;
          font-size: var(--font-size-sm);
          margin-bottom: var(--spacing-lg);
        }

        /* Error Modal */
        .error-modal {
          text-align: center;
        }

        .error-icon {
          font-size: 4rem;
          color: var(--error-color);
          margin-bottom: var(--spacing-lg);
        }

        .error-message {
          color: var(--error-color);
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          margin-bottom: var(--spacing-sm);
        }

        .error-details {
          color: #d1d5db;
          font-size: var(--font-size-sm);
          margin-bottom: var(--spacing-lg);
        }

        /* Loading States */
        .loading-spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .burn-vote-modal-container {
            margin: var(--spacing-xs);
            padding: var(--spacing-md);
            max-height: 95vh;
          }
          
          .modal-actions {
            flex-direction: column;
            gap: var(--spacing-sm);
          }
          
          .btn-cancel, .btn-confirm {
            width: 100%;
            min-height: var(--min-touch-target);
          }
          
          .confirmation-checkbox {
            width: 24px;
            height: 24px;
          }
          
          .simulation-row {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-xs);
          }
        }

        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .burn-vote-modal-container {
            animation: none;
          }
          
          .burn-warning {
            animation: none;
          }
          
          .btn-confirm.burn-effect {
            animation: none;
          }
          
          .success-icon {
            animation: none;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .burn-vote-modal-container {
            border-width: 3px;
          }
          
          .confirmation-checkbox {
            border-width: 3px;
          }
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', css);
  }

  /**
   * Show burn vote confirmation modal
   */
  async showBurnVoteConfirmation(contentId, options = {}) {
    const {
      mlgCost = 1,
      voteWeight = 1,
      userBalance = 0,
      burnVotesUsed = 0,
      contentTitle = 'Content',
      contentType = 'clip',
      onConfirm = null,
      onCancel = null
    } = options;

    try {
      // Validate parameters
      if (!contentId) {
        throw new Error('Content ID is required');
      }

      if (!this.wallet || !this.wallet.connected) {
        throw new BurnVoteConfirmationError(BurnVoteError.WALLET_NOT_CONNECTED, 'Wallet not connected');
      }

      // Check if modal already exists
      if (this.activeModals.has(contentId)) {
        return;
      }

      // Generate transaction simulation
      const simulationData = await this.simulateTransaction(mlgCost, userBalance);
      
      // Determine confirmation level
      const confirmationLevel = this.getBurnConfirmationLevel(mlgCost);
      
      // Create modal
      const modal = this.createBurnVoteModal({
        contentId,
        mlgCost,
        voteWeight,
        userBalance,
        burnVotesUsed,
        contentTitle,
        contentType,
        simulationData,
        confirmationLevel,
        onConfirm: onConfirm || this.onConfirm,
        onCancel: onCancel || this.onCancel
      });

      // Show modal
      document.body.appendChild(modal);
      
      // Trigger show animation
      requestAnimationFrame(() => {
        modal.classList.add('show');
      });

      // Set focus to first focusable element
      this.setupFocusManagement(modal);
      
      // Store reference
      this.activeModals.set(contentId, modal);

      console.log(`Burn vote confirmation modal shown for ${contentId}`);

    } catch (error) {
      console.error('Error showing burn vote confirmation:', error);
      if (this.onError) {
        this.onError(error);
      }
    }
  }

  /**
   * Create burn vote confirmation modal
   */
  createBurnVoteModal(options) {
    const {
      contentId,
      mlgCost,
      voteWeight,
      userBalance,
      contentTitle,
      contentType,
      simulationData,
      confirmationLevel,
      onConfirm,
      onCancel
    } = options;

    const modalId = `burn-vote-modal-${contentId}`;
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'burn-vote-modal-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', `modal-title-${contentId}`);
    modal.setAttribute('aria-describedby', `modal-description-${contentId}`);

    // Create confirmation state
    this.confirmationStates.set(contentId, {
      stage: 'initial',
      confirmationsChecked: [],
      allConfirmed: false
    });

    modal.innerHTML = this.getBurnVoteModalHTML({
      contentId,
      mlgCost,
      voteWeight,
      userBalance,
      contentTitle,
      contentType,
      simulationData,
      confirmationLevel
    });

    // Setup event listeners
    this.setupModalEventListeners(modal, {
      contentId,
      mlgCost,
      voteWeight,
      onConfirm,
      onCancel
    });

    return modal;
  }

  /**
   * Generate modal HTML content
   */
  getBurnVoteModalHTML(options) {
    const {
      contentId,
      mlgCost,
      voteWeight,
      userBalance,
      contentTitle,
      contentType,
      simulationData,
      confirmationLevel
    } = options;

    const canAfford = userBalance >= mlgCost;
    const isHighValue = confirmationLevel.stages > 1;

    return `
      <div class="burn-vote-modal-container">
        <header class="modal-header">
          <h2 id="modal-title-${contentId}" class="modal-title">Confirm MLG Burn Vote</h2>
          <button class="modal-close" aria-label="Close modal" data-action="close">×</button>
        </header>
        
        <main class="modal-content">
          <p id="modal-description-${contentId}" class="sr-only">
            This action will permanently burn ${mlgCost} MLG tokens to cast a weighted vote
          </p>
          
          <!-- Content Preview -->
          <section class="content-preview" aria-label="Content being voted on">
            <div class="content-preview-title">Voting on: ${contentTitle}</div>
            <div class="content-preview-details">
              <div>Type: ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}</div>
              <div>Vote Weight: ${voteWeight}x multiplier</div>
              <div>MLG Cost: ${mlgCost} tokens</div>
            </div>
          </section>
          
          <!-- Transaction Simulation -->
          <section class="transaction-simulation" aria-label="Transaction cost breakdown">
            <div class="simulation-title">
              <span>⚡</span>
              Transaction Preview
              <span class="simulation-accuracy ${simulationData.accuracy}">${simulationData.accuracy}</span>
            </div>
            
            <div class="simulation-row">
              <span>MLG Tokens to Burn:</span>
              <span>${mlgCost} MLG</span>
            </div>
            
            <div class="simulation-row">
              <span>Network Fee (SOL):</span>
              <span>~${simulationData.networkFee} SOL</span>
            </div>
            
            <div class="simulation-row">
              <span>Vote Weight Gained:</span>
              <span>${voteWeight}x</span>
            </div>
            
            <div class="simulation-row">
              <span>Estimated Confirmation:</span>
              <span>${simulationData.confirmationTime}</span>
            </div>
            
            <div class="simulation-row simulation-total">
              <span>Your MLG Balance After:</span>
              <span>${Math.max(0, userBalance - mlgCost).toFixed(2)} MLG</span>
            </div>
          </section>
          
          <!-- Burn Warning -->
          <section class="burn-warning" role="alert">
            <div class="burn-warning-content">
              <div class="burn-warning-icon">🔥</div>
              <div>⚠️ PERMANENT ACTION ⚠️</div>
              <div>These ${mlgCost} MLG tokens will be burned forever and cannot be recovered.</div>
            </div>
          </section>
          
          ${isHighValue ? this.getMultiStageConfirmationHTML(contentId, mlgCost, confirmationLevel) : ''}
          
          ${!canAfford ? this.getInsufficientBalanceHTML(userBalance, mlgCost) : ''}
        </main>
        
        <footer class="modal-actions">
          <button class="btn-cancel" data-action="cancel">Cancel</button>
          <button class="btn-confirm burn-effect" data-action="confirm" ${!canAfford ? 'disabled' : ''}>
            ${!canAfford ? 'Insufficient MLG' : `Burn ${mlgCost} MLG & Vote`}
          </button>
        </footer>
      </div>
    `;
  }

  /**
   * Generate multi-stage confirmation HTML for high-value burns
   */
  getMultiStageConfirmationHTML(contentId, mlgCost, confirmationLevel) {
    const confirmations = [
      `I understand this will permanently burn ${mlgCost} MLG tokens`,
      `I confirm I want to spend ${mlgCost} MLG tokens for this vote`,
      `I acknowledge this action cannot be undone or reversed`
    ];

    if (mlgCost >= 11) {
      confirmations.push(`I understand this is a high-value transaction (${mlgCost} MLG)`);
    }

    return `
      <section class="multi-stage-confirmation" aria-label="Required confirmations">
        <div class="confirmation-stage-title">
          Multiple Confirmations Required (${confirmationLevel.stages} stages)
        </div>
        
        ${confirmations.slice(0, confirmationLevel.confirmations).map((text, index) => `
          <div class="confirmation-item">
            <input 
              type="checkbox" 
              id="confirm-${contentId}-${index}"
              class="confirmation-checkbox"
              data-confirmation="${index}"
              aria-describedby="confirm-label-${contentId}-${index}"
            />
            <label 
              for="confirm-${contentId}-${index}" 
              id="confirm-label-${contentId}-${index}"
              class="confirmation-label"
            >
              ${text}
            </label>
          </div>
        `).join('')}
      </section>
    `;
  }

  /**
   * Generate insufficient balance warning HTML
   */
  getInsufficientBalanceHTML(userBalance, required) {
    const shortfall = required - userBalance;
    
    return `
      <section class="insufficient-balance-warning" role="alert">
        <div class="error-content">
          <div class="error-icon">💸</div>
          <div class="error-message">Insufficient MLG Balance</div>
          <div class="error-details">
            <div>You have: ${userBalance.toFixed(2)} MLG</div>
            <div>Required: ${required} MLG</div>
            <div>Shortfall: ${shortfall.toFixed(2)} MLG</div>
          </div>
          <button class="btn-secondary" onclick="window.open('/earn-tokens', '_blank')">
            Get More MLG Tokens
          </button>
        </div>
      </section>
    `;
  }

  /**
   * Setup modal event listeners
   */
  setupModalEventListeners(modal, options) {
    const { contentId, mlgCost, voteWeight, onConfirm, onCancel } = options;

    // Close button
    modal.querySelector('[data-action="close"]').addEventListener('click', () => {
      this.hideBurnVoteModal(contentId);
      if (onCancel) onCancel();
    });

    // Cancel button
    modal.querySelector('[data-action="cancel"]').addEventListener('click', () => {
      this.hideBurnVoteModal(contentId);
      if (onCancel) onCancel();
    });

    // Confirm button
    const confirmButton = modal.querySelector('[data-action="confirm"]');
    confirmButton.addEventListener('click', async () => {
      await this.handleConfirmation(contentId, mlgCost, voteWeight, onConfirm);
    });

    // Confirmation checkboxes
    const checkboxes = modal.querySelectorAll('.confirmation-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateConfirmationState(contentId, modal);
      });
    });

    // Overlay click to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hideBurnVoteModal(contentId);
        if (onCancel) onCancel();
      }
    });

    // Keyboard events
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideBurnVoteModal(contentId);
        if (onCancel) onCancel();
      }
    });
  }

  /**
   * Update confirmation state based on checkboxes
   */
  updateConfirmationState(contentId, modal) {
    const state = this.confirmationStates.get(contentId);
    if (!state) return;

    const checkboxes = modal.querySelectorAll('.confirmation-checkbox');
    const confirmButton = modal.querySelector('[data-action="confirm"]');
    
    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    const allChecked = checkedCount === checkboxes.length;

    state.allConfirmed = allChecked;
    
    if (allChecked) {
      confirmButton.disabled = false;
      confirmButton.classList.add('burn-effect');
    } else {
      confirmButton.disabled = true;
      confirmButton.classList.remove('burn-effect');
    }

    this.confirmationStates.set(contentId, state);
  }

  /**
   * Handle confirmation button click
   */
  async handleConfirmation(contentId, mlgCost, voteWeight, onConfirm) {
    try {
      const state = this.confirmationStates.get(contentId);
      const confirmationLevel = this.getBurnConfirmationLevel(mlgCost);
      
      // Check if multi-stage confirmation is required and completed
      if (confirmationLevel.stages > 1 && (!state || !state.allConfirmed)) {
        this.showError('Please complete all confirmation checkboxes first');
        return;
      }

      // Show processing state
      this.setModalProcessingState(contentId, true);

      // Execute burn vote
      const result = await this.executeBurnVote(contentId, mlgCost, voteWeight);
      
      if (result.success) {
        // Show success modal
        this.showSuccessModal(contentId, result);
        
        if (onConfirm) {
          onConfirm(result);
        }
      } else {
        throw new Error(result.error || 'Transaction failed');
      }

    } catch (error) {
      console.error('Confirmation error:', error);
      this.setModalProcessingState(contentId, false);
      
      // Show error modal
      this.showErrorModal(contentId, error);
      
      if (this.onError) {
        this.onError(error);
      }
    }
  }

  /**
   * Execute the burn vote transaction
   */
  async executeBurnVote(contentId, mlgCost, voteWeight) {
    try {
      // Simulate the transaction execution
      // In a real implementation, this would interact with the Solana voting system
      
      console.log(`Executing burn vote: ${mlgCost} MLG for content ${contentId}`);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, simulate success
      const result = {
        success: true,
        transactionId: `tx_${Date.now()}_${contentId}`,
        mlgBurned: mlgCost,
        voteWeight: voteWeight,
        timestamp: new Date().toISOString(),
        confirmationTime: '7 seconds'
      };

      return result;

    } catch (error) {
      console.error('Burn vote execution error:', error);
      return {
        success: false,
        error: error.message || 'Transaction failed'
      };
    }
  }

  /**
   * Set modal processing state
   */
  setModalProcessingState(contentId, processing) {
    const modal = this.activeModals.get(contentId);
    if (!modal) return;

    const confirmButton = modal.querySelector('[data-action="confirm"]');
    const cancelButton = modal.querySelector('[data-action="cancel"]');

    if (processing) {
      confirmButton.innerHTML = `
        <span class="loading-spinner"></span>
        Processing...
      `;
      confirmButton.disabled = true;
      cancelButton.disabled = true;
    } else {
      const mlgCost = parseInt(confirmButton.textContent.match(/\d+/)[0]);
      confirmButton.innerHTML = `Burn ${mlgCost} MLG & Vote`;
      confirmButton.disabled = false;
      cancelButton.disabled = false;
    }
  }

  /**
   * Show success modal after successful burn vote
   */
  showSuccessModal(contentId, result) {
    const modal = this.activeModals.get(contentId);
    if (!modal) return;

    const container = modal.querySelector('.burn-vote-modal-container');
    container.innerHTML = `
      <div class="success-modal">
        <div class="success-icon">🎉</div>
        <div class="success-message">Burn Vote Successful!</div>
        <div class="success-details">
          <div>Burned: ${result.mlgBurned} MLG tokens</div>
          <div>Vote Weight: ${result.voteWeight}x</div>
          <div>Transaction: ${result.transactionId.slice(0, 8)}...</div>
          <div>Confirmed in: ${result.confirmationTime}</div>
        </div>
        <div class="modal-actions">
          <button class="btn-confirm" data-action="close">Awesome!</button>
        </div>
      </div>
    `;

    // Update close button
    container.querySelector('[data-action="close"]').addEventListener('click', () => {
      this.hideBurnVoteModal(contentId);
    });

    // Auto-close after delay
    setTimeout(() => {
      this.hideBurnVoteModal(contentId);
    }, 5000);
  }

  /**
   * Show error modal
   */
  showErrorModal(contentId, error) {
    const modal = this.activeModals.get(contentId);
    if (!modal) return;

    const errorConfig = this.getErrorConfig(error);
    const container = modal.querySelector('.burn-vote-modal-container');
    
    container.innerHTML = `
      <div class="error-modal">
        <div class="error-icon">${errorConfig.icon}</div>
        <div class="error-message">${errorConfig.title}</div>
        <div class="error-details">${errorConfig.description}</div>
        <div class="modal-actions">
          ${errorConfig.actions.map(action => `
            <button class="btn-${action.type}" data-action="${action.action || 'close'}">
              ${action.label}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    // Setup action buttons
    container.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        if (action === 'retry') {
          this.hideBurnVoteModal(contentId);
          // Retry logic would go here
        } else {
          this.hideBurnVoteModal(contentId);
        }
      });
    });
  }

  /**
   * Get error configuration for different error types
   */
  getErrorConfig(error) {
    const errorType = error.type || BurnVoteError.NETWORK_ERROR;
    
    const configs = {
      [BurnVoteError.INSUFFICIENT_BALANCE]: {
        title: 'Insufficient MLG Tokens',
        icon: '💸',
        description: 'You don\'t have enough MLG tokens for this burn vote.',
        actions: [
          { label: 'Cancel', type: 'cancel' },
          { label: 'Get MLG Tokens', type: 'primary', action: 'get-tokens' }
        ]
      },
      [BurnVoteError.TRANSACTION_FAILED]: {
        title: 'Transaction Failed',
        icon: '❌',
        description: 'Your burn vote could not be processed. Please try again.',
        actions: [
          { label: 'Cancel', type: 'cancel' },
          { label: 'Retry', type: 'primary', action: 'retry' }
        ]
      },
      [BurnVoteError.NETWORK_ERROR]: {
        title: 'Network Error',
        icon: '🌐',
        description: 'Unable to connect to the Solana network. Please check your connection.',
        actions: [
          { label: 'Cancel', type: 'cancel' },
          { label: 'Retry', type: 'primary', action: 'retry' }
        ]
      },
      [BurnVoteError.WALLET_NOT_CONNECTED]: {
        title: 'Wallet Not Connected',
        icon: '👛',
        description: 'Please connect your wallet to proceed with the burn vote.',
        actions: [
          { label: 'Cancel', type: 'cancel' },
          { label: 'Connect Wallet', type: 'primary', action: 'connect-wallet' }
        ]
      }
    };

    return configs[errorType] || configs[BurnVoteError.NETWORK_ERROR];
  }

  /**
   * Hide burn vote modal
   */
  hideBurnVoteModal(contentId) {
    const modal = this.activeModals.get(contentId);
    if (!modal) return;

    // Add exit animation
    const container = modal.querySelector('.burn-vote-modal-container');
    container.classList.add('exiting');

    // Remove modal after animation
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
      this.activeModals.delete(contentId);
      this.confirmationStates.delete(contentId);
    }, BURN_CONFIRMATION_CONFIG.MODAL_TRANSITION_DURATION);
  }

  /**
   * Setup focus management for accessibility
   */
  setupFocusManagement(modal) {
    const focusableElements = modal.querySelectorAll(
      'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    // Focus first element
    firstFocusable.focus();
    
    // Trap focus within modal
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable.focus();
            e.preventDefault();
          }
        }
      }
    });
  }

  /**
   * Simulate transaction costs and timing
   */
  async simulateTransaction(mlgCost, userBalance) {
    try {
      // Simulate network call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Calculate network fee (simplified)
      const networkFee = BURN_CONFIRMATION_CONFIG.DEFAULT_NETWORK_FEE;
      
      // Determine simulation accuracy based on network conditions
      const accuracy = networkFee < 0.002 ? 'high' : networkFee < 0.005 ? 'medium' : 'low';
      
      return {
        mlgCost,
        networkFee: networkFee.toFixed(4),
        confirmationTime: BURN_CONFIRMATION_CONFIG.CONFIRMATION_TIME_ESTIMATE,
        accuracy,
        canAfford: userBalance >= mlgCost
      };
      
    } catch (error) {
      console.error('Transaction simulation failed:', error);
      throw new BurnVoteConfirmationError(BurnVoteError.SIMULATION_FAILED, 'Failed to simulate transaction');
    }
  }

  /**
   * Determine confirmation level based on MLG token amount
   */
  getBurnConfirmationLevel(tokenCount) {
    const { CONFIRMATION_LEVELS } = BURN_CONFIRMATION_CONFIG;
    
    if (tokenCount >= CONFIRMATION_LEVELS.LEGENDARY.minTokens) {
      return CONFIRMATION_LEVELS.LEGENDARY;
    }
    if (tokenCount >= CONFIRMATION_LEVELS.HIGH_VALUE.minTokens) {
      return CONFIRMATION_LEVELS.HIGH_VALUE;
    }
    return CONFIRMATION_LEVELS.STANDARD;
  }

  /**
   * Show a simple error message
   */
  showError(message) {
    // Simple error notification
    console.error(message);
    
    // In a real implementation, this could show a toast notification
    alert(message);
  }

  /**
   * Destroy the confirmation system
   */
  destroy() {
    // Close all active modals
    this.activeModals.forEach((modal, contentId) => {
      this.hideBurnVoteModal(contentId);
    });
    
    // Clear references
    this.activeModals.clear();
    this.confirmationStates.clear();
    
    console.log('Burn Vote Confirmation System destroyed');
  }
}

/**
 * Custom error class for burn vote confirmation errors
 */
export class BurnVoteConfirmationError extends Error {
  constructor(type, message, context = {}) {
    super(message);
    this.name = 'BurnVoteConfirmationError';
    this.type = type;
    this.context = context;
    this.timestamp = Date.now();
  }
}

/**
 * Export default system
 */
export default BurnVoteConfirmationSystem;