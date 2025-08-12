/**
 * Solana Transaction Confirmation UI - Sub-task 3.9
 * 
 * Production-ready transaction confirmation system for MLG.clan burn votes with comprehensive
 * Solana transaction state management and Xbox 360 retro aesthetic.
 * 
 * Features:
 * - Real-time transaction signature tracking and confirmation status
 * - Progressive loading states with Xbox-style animations  
 * - Comprehensive error handling for all Solana transaction states
 * - Timeout detection and retry mechanisms
 * - Solana Explorer integration for transaction verification
 * - Mobile-responsive design with accessibility compliance
 * - Analytics tracking for transaction success/failure rates
 * - Integration with existing burn vote confirmation system
 * 
 * Transaction States Handled:
 * - PENDING: Transaction submitted, awaiting network confirmation
 * - CONFIRMING: Transaction found on network, accumulating confirmations
 * - CONFIRMED: Transaction successfully confirmed and finalized
 * - FAILED: Transaction rejected or failed on network
 * - TIMEOUT: Transaction not found within timeout period
 * - ERROR: Network or system errors during processing
 * 
 * @author Claude Code - Production Frontend Engineer
 * @version 1.0.0
 */

import { Connection, PublicKey } from '@solana/web3.js';

/**
 * Transaction Confirmation Configuration
 */
const TRANSACTION_CONFIRMATION_CONFIG = {
  // MLG Token contract address
  MLG_TOKEN_ADDRESS: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL',
  
  // Confirmation timing
  CONFIRMATION_TIMEOUT_MS: 60000, // 60 seconds
  CONFIRMATION_POLL_INTERVAL_MS: 2000, // 2 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 5000, // 5 seconds
  
  // Network endpoints
  SOLANA_EXPLORER_BASE_URL: 'https://explorer.solana.com/tx',
  SOLANA_FM_BASE_URL: 'https://solana.fm/tx',
  SOLSCAN_BASE_URL: 'https://solscan.io/tx',
  
  // Animation timings
  LOADING_ANIMATION_DURATION: 2000,
  SUCCESS_CELEBRATION_DURATION: 3000,
  ERROR_PULSE_DURATION: 1500,
  PROGRESS_UPDATE_INTERVAL: 100,
  
  // Confirmation levels
  CONFIRMATION_REQUIREMENTS: {
    STANDARD: 1, // Single confirmation
    HIGH_VALUE: 2, // Double confirmation
    LEGENDARY: 3   // Triple confirmation
  },
  
  // UI constants
  MOBILE_BREAKPOINT: 768,
  MIN_TOUCH_TARGET: 44,
  FOCUS_OUTLINE_WIDTH: 2,
  
  // Analytics events
  ANALYTICS_EVENTS: {
    TRANSACTION_STARTED: 'transaction_confirmation_started',
    TRANSACTION_CONFIRMED: 'transaction_confirmation_success',
    TRANSACTION_FAILED: 'transaction_confirmation_failed',
    TRANSACTION_TIMEOUT: 'transaction_confirmation_timeout',
    RETRY_ATTEMPTED: 'transaction_retry_attempted',
    EXPLORER_OPENED: 'transaction_explorer_opened'
  }
};

/**
 * Transaction states for UI display and logic
 */
export const TransactionState = {
  PENDING: 'pending',
  CONFIRMING: 'confirming', 
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
  ERROR: 'error'
};

/**
 * Transaction error types
 */
export const TransactionError = {
  NETWORK_ERROR: 'network_error',
  TIMEOUT: 'timeout',
  TRANSACTION_FAILED: 'transaction_failed',
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  SIGNATURE_NOT_FOUND: 'signature_not_found',
  CONFIRMATION_FAILED: 'confirmation_failed',
  UNKNOWN_ERROR: 'unknown_error'
};

/**
 * Main Transaction Confirmation System
 * Manages real-time transaction tracking and user feedback
 */
export class TransactionConfirmationSystem {
  constructor(options = {}) {
    this.connection = options.connection || null;
    this.wallet = options.wallet || null;
    this.votingSystem = options.votingSystem || null;
    this.burnConfirmationSystem = options.burnConfirmationSystem || null;
    
    // Transaction tracking
    this.activeTransactions = new Map();
    this.confirmationPollers = new Map();
    this.retryAttempts = new Map();
    
    // UI registry
    this.activeModals = new Map();
    this.progressUpdaters = new Map();
    
    // Event callbacks
    this.onTransactionConfirmed = options.onTransactionConfirmed || null;
    this.onTransactionFailed = options.onTransactionFailed || null;
    this.onTransactionTimeout = options.onTransactionTimeout || null;
    this.onRetryAttempted = options.onRetryAttempted || null;
    
    // Analytics
    this.analytics = options.analytics || null;
    
    // Initialize CSS and setup
    this.initializeCSS();
    this.setupNetworkDetection();
    
    console.log('Transaction Confirmation System initialized');
  }

  /**
   * Initialize CSS styles for transaction confirmation UI
   */
  initializeCSS() {
    const cssId = 'transaction-confirmation-styles';
    if (document.getElementById(cssId)) return;

    const css = `
      <style id="${cssId}">
        /* Transaction Confirmation CSS Design Tokens */
        :root {
          /* Xbox Colors */
          --xbox-green: #10b981;
          --xbox-green-hover: #059669;
          --xbox-green-light: #34d399;
          --xbox-green-glow: rgba(16, 185, 129, 0.4);
          
          /* Transaction State Colors */
          --pending-color: #3b82f6;
          --confirming-color: #f59e0b;
          --confirmed-color: #10b981;
          --failed-color: #ef4444;
          --timeout-color: #8b5cf6;
          --error-color: #dc2626;
          
          /* Progress Colors */
          --progress-bg: rgba(55, 65, 81, 0.5);
          --progress-fill: linear-gradient(90deg, #10b981, #059669);
          --progress-glow: rgba(16, 185, 129, 0.6);
          
          /* Surface Colors */
          --transaction-modal-bg: rgba(0, 0, 0, 0.85);
          --transaction-card-bg: rgba(31, 41, 55, 0.95);
          --transaction-border: rgba(16, 185, 129, 0.3);
          --transaction-hover: rgba(16, 185, 129, 0.1);
          
          /* Animation Timings */
          --transaction-fast: 0.2s ease-out;
          --transaction-medium: 0.4s ease;
          --transaction-slow: 0.6s ease;
          --transaction-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
          
          /* Spacing */
          --tx-spacing-xs: 4px;
          --tx-spacing-sm: 8px;
          --tx-spacing-md: 16px;
          --tx-spacing-lg: 24px;
          --tx-spacing-xl: 32px;
        }

        /* Keyframe Animations */
        @keyframes xbox-loading-pulse {
          0%, 100% { 
            opacity: 0.6; 
            transform: scale(1); 
          }
          50% { 
            opacity: 1; 
            transform: scale(1.05); 
          }
        }

        @keyframes signature-scan {
          0%, 100% { 
            background-position: 0% 50%; 
          }
          50% { 
            background-position: 100% 50%; 
          }
        }

        @keyframes confirmation-counter {
          0% { 
            transform: scale(1); 
            color: var(--confirming-color); 
          }
          50% { 
            transform: scale(1.1); 
            color: var(--xbox-green-light); 
          }
          100% { 
            transform: scale(1); 
            color: var(--confirmed-color); 
          }
        }

        @keyframes progress-fill {
          0% { 
            width: 0%; 
          }
          100% { 
            width: var(--progress-width, 100%); 
          }
        }

        @keyframes success-burst {
          0% { 
            transform: scale(0.8) rotate(0deg); 
            opacity: 0; 
          }
          50% { 
            transform: scale(1.2) rotate(180deg); 
            opacity: 1; 
          }
          100% { 
            transform: scale(1) rotate(360deg); 
            opacity: 1; 
          }
        }

        @keyframes error-shake {
          0%, 100% { 
            transform: translateX(0); 
          }
          10%, 30%, 50%, 70%, 90% { 
            transform: translateX(-4px); 
          }
          20%, 40%, 60%, 80% { 
            transform: translateX(4px); 
          }
        }

        @keyframes timeout-fade {
          0%, 100% { 
            opacity: 1; 
          }
          50% { 
            opacity: 0.3; 
          }
        }

        /* Transaction Modal Overlay */
        .transaction-confirmation-overlay {
          position: fixed;
          inset: 0;
          background: var(--transaction-modal-bg);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--tx-spacing-md);
          z-index: 2100;
          opacity: 0;
          transition: opacity var(--transaction-medium);
        }

        .transaction-confirmation-overlay.show {
          opacity: 1;
        }

        /* Transaction Card */
        .transaction-confirmation-card {
          background: var(--transaction-card-bg);
          border: 2px solid var(--transaction-border);
          border-radius: var(--tx-spacing-md);
          box-shadow: 0 0 24px var(--xbox-green-glow);
          max-width: 520px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          padding: var(--tx-spacing-lg);
          transform: scale(0.95) translateY(-20px);
          transition: transform var(--transaction-medium) var(--transaction-bounce);
        }

        .transaction-confirmation-overlay.show .transaction-confirmation-card {
          transform: scale(1) translateY(0);
        }

        /* Transaction Header */
        .transaction-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--tx-spacing-lg);
          padding-bottom: var(--tx-spacing-md);
          border-bottom: 1px solid rgba(156, 163, 175, 0.2);
        }

        .transaction-title {
          color: var(--xbox-green-light);
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
          display: flex;
          align-items: center;
          gap: var(--tx-spacing-sm);
        }

        .transaction-close {
          background: none;
          border: none;
          color: #9ca3af;
          font-size: 1.5rem;
          cursor: pointer;
          padding: var(--tx-spacing-xs);
          border-radius: 4px;
          transition: var(--transaction-fast);
          min-width: 36px;
          min-height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .transaction-close:hover {
          color: white;
          background: rgba(156, 163, 175, 0.1);
        }

        .transaction-close:focus {
          outline: var(--focus-outline-width) solid var(--xbox-green);
          outline-offset: 2px;
        }

        /* Transaction Status Display */
        .transaction-status {
          text-align: center;
          margin-bottom: var(--tx-spacing-lg);
          padding: var(--tx-spacing-lg);
          border-radius: var(--tx-spacing-sm);
          background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .transaction-status.pending {
          border-color: var(--pending-color);
          animation: xbox-loading-pulse 2s infinite;
        }

        .transaction-status.confirming {
          border-color: var(--confirming-color);
        }

        .transaction-status.confirmed {
          border-color: var(--confirmed-color);
          background: linear-gradient(135deg, #065f46 0%, #047857 100%);
        }

        .transaction-status.failed {
          border-color: var(--failed-color);
          background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%);
          animation: error-shake 0.5s ease-in-out;
        }

        .transaction-status.timeout {
          border-color: var(--timeout-color);
          animation: timeout-fade 2s infinite;
        }

        .transaction-status.error {
          border-color: var(--error-color);
        }

        .status-icon {
          font-size: 3rem;
          margin-bottom: var(--tx-spacing-md);
        }

        .status-icon.pending {
          color: var(--pending-color);
          animation: xbox-loading-pulse 1.5s infinite;
        }

        .status-icon.confirming {
          color: var(--confirming-color);
        }

        .status-icon.confirmed {
          color: var(--confirmed-color);
          animation: success-burst var(--success-celebration-duration) var(--transaction-bounce);
        }

        .status-icon.failed {
          color: var(--failed-color);
        }

        .status-icon.timeout {
          color: var(--timeout-color);
        }

        .status-icon.error {
          color: var(--error-color);
        }

        .status-message {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: var(--tx-spacing-sm);
        }

        .status-message.pending {
          color: var(--pending-color);
        }

        .status-message.confirming {
          color: var(--confirming-color);
        }

        .status-message.confirmed {
          color: var(--confirmed-color);
        }

        .status-message.failed {
          color: var(--failed-color);
        }

        .status-message.timeout {
          color: var(--timeout-color);
        }

        .status-message.error {
          color: var(--error-color);
        }

        .status-description {
          color: #d1d5db;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        /* Progress Indicators */
        .transaction-progress {
          margin-bottom: var(--tx-spacing-lg);
        }

        .progress-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--tx-spacing-sm);
          font-size: 0.875rem;
          color: #d1d5db;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: var(--progress-bg);
          border-radius: 4px;
          overflow: hidden;
          position: relative;
        }

        .progress-fill {
          height: 100%;
          background: var(--progress-fill);
          border-radius: 4px;
          transition: width var(--transaction-fast);
          position: relative;
        }

        .progress-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          animation: signature-scan 2s infinite;
        }

        .progress-fill.confirmed::after {
          animation: none;
          background: none;
        }

        /* Confirmation Counter */
        .confirmation-counter {
          display: flex;
          justify-content: center;
          gap: var(--tx-spacing-md);
          margin-bottom: var(--tx-spacing-lg);
        }

        .confirmation-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--tx-spacing-sm);
          border-radius: var(--tx-spacing-sm);
          background: rgba(31, 41, 55, 0.5);
          border: 1px solid transparent;
          transition: all var(--transaction-fast);
          min-width: 80px;
        }

        .confirmation-step.active {
          border-color: var(--xbox-green);
          background: rgba(16, 185, 129, 0.1);
        }

        .confirmation-step.completed {
          border-color: var(--confirmed-color);
          background: rgba(16, 185, 129, 0.2);
          animation: confirmation-counter 0.5s ease-out;
        }

        .confirmation-number {
          font-size: 1.125rem;
          font-weight: 700;
          color: #9ca3af;
          margin-bottom: var(--tx-spacing-xs);
        }

        .confirmation-step.active .confirmation-number {
          color: var(--xbox-green-light);
        }

        .confirmation-step.completed .confirmation-number {
          color: var(--confirmed-color);
        }

        .confirmation-label {
          font-size: 0.75rem;
          color: #6b7280;
          text-align: center;
        }

        .confirmation-step.active .confirmation-label {
          color: #d1d5db;
        }

        .confirmation-step.completed .confirmation-label {
          color: var(--xbox-green-light);
        }

        /* Transaction Details */
        .transaction-details {
          background: rgba(17, 24, 39, 0.5);
          border: 1px solid rgba(75, 85, 99, 0.3);
          border-radius: var(--tx-spacing-sm);
          padding: var(--tx-spacing-md);
          margin-bottom: var(--tx-spacing-lg);
        }

        .details-title {
          color: var(--xbox-green-light);
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: var(--tx-spacing-md);
          display: flex;
          align-items: center;
          gap: var(--tx-spacing-sm);
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--tx-spacing-xs) 0;
          font-size: 0.875rem;
          border-bottom: 1px solid rgba(75, 85, 99, 0.2);
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-label {
          color: #9ca3af;
        }

        .detail-value {
          color: #d1d5db;
          font-weight: 500;
        }

        .detail-value.signature {
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.75rem;
          word-break: break-all;
        }

        /* Explorer Links */
        .explorer-links {
          display: flex;
          flex-wrap: wrap;
          gap: var(--tx-spacing-sm);
          margin-bottom: var(--tx-spacing-lg);
        }

        .explorer-link {
          display: flex;
          align-items: center;
          gap: var(--tx-spacing-xs);
          padding: var(--tx-spacing-sm) var(--tx-spacing-md);
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: var(--tx-spacing-sm);
          color: #60a5fa;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          transition: var(--transaction-fast);
          min-height: var(--min-touch-target);
        }

        .explorer-link:hover {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.5);
          color: #93c5fd;
          transform: translateY(-1px);
        }

        .explorer-link:focus {
          outline: var(--focus-outline-width) solid var(--xbox-green);
          outline-offset: 2px;
        }

        /* Action Buttons */
        .transaction-actions {
          display: flex;
          gap: var(--tx-spacing-md);
          justify-content: flex-end;
        }

        .btn-transaction {
          padding: var(--tx-spacing-sm) var(--tx-spacing-lg);
          border-radius: var(--tx-spacing-sm);
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all var(--transaction-fast);
          min-height: var(--min-touch-target);
          min-width: 100px;
          border: none;
          outline: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--tx-spacing-xs);
        }

        .btn-transaction:focus {
          outline: var(--focus-outline-width) solid var(--xbox-green);
          outline-offset: 2px;
        }

        .btn-secondary {
          background: rgba(156, 163, 175, 0.1);
          color: #9ca3af;
          border: 1px solid rgba(156, 163, 175, 0.3);
        }

        .btn-secondary:hover {
          background: rgba(156, 163, 175, 0.2);
          color: white;
          transform: translateY(-1px);
        }

        .btn-primary {
          background: linear-gradient(45deg, var(--xbox-green), var(--xbox-green-hover));
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: linear-gradient(45deg, var(--xbox-green-hover), var(--xbox-green));
          transform: translateY(-1px);
          box-shadow: 0 4px 12px var(--xbox-green-glow);
        }

        .btn-danger {
          background: linear-gradient(45deg, var(--failed-color), #dc2626);
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background: linear-gradient(45deg, #dc2626, #b91c1c);
          transform: translateY(-1px);
        }

        .btn-transaction:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* Loading Spinner */
        .loading-spinner {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Error Display */
        .error-details {
          background: rgba(127, 29, 29, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--tx-spacing-sm);
          padding: var(--tx-spacing-md);
          margin-top: var(--tx-spacing-md);
        }

        .error-title {
          color: var(--failed-color);
          font-weight: 600;
          margin-bottom: var(--tx-spacing-sm);
        }

        .error-message {
          color: #fca5a5;
          font-size: 0.875rem;
          line-height: 1.5;
          margin-bottom: var(--tx-spacing-sm);
        }

        .error-code {
          color: #9ca3af;
          font-size: 0.75rem;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .transaction-confirmation-card {
            margin: var(--tx-spacing-xs);
            padding: var(--tx-spacing-md);
            max-height: 95vh;
          }
          
          .transaction-actions {
            flex-direction: column;
            gap: var(--tx-spacing-sm);
          }
          
          .btn-transaction {
            width: 100%;
            min-height: var(--min-touch-target);
          }
          
          .explorer-links {
            flex-direction: column;
          }
          
          .explorer-link {
            justify-content: center;
            min-height: var(--min-touch-target);
          }
          
          .confirmation-counter {
            flex-wrap: wrap;
            gap: var(--tx-spacing-sm);
          }
          
          .confirmation-step {
            min-width: 60px;
          }
          
          .detail-row {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--tx-spacing-xs);
            padding: var(--tx-spacing-sm) 0;
          }
        }

        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .transaction-confirmation-card {
            transition: none;
            transform: none;
          }
          
          .status-icon.pending {
            animation: none;
          }
          
          .transaction-status.pending {
            animation: none;
          }
          
          .status-icon.confirmed {
            animation: none;
          }
          
          .confirmation-step.completed {
            animation: none;
          }
          
          .progress-fill::after {
            animation: none;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .transaction-confirmation-card {
            border-width: 3px;
          }
          
          .transaction-status {
            border-width: 2px;
          }
          
          .explorer-link {
            border-width: 2px;
          }
        }

        /* Screen reader only content */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', css);
  }

  /**
   * Setup network detection for better error handling
   */
  setupNetworkDetection() {
    if (typeof window !== 'undefined' && 'navigator' in window) {
      window.addEventListener('online', () => {
        console.log('Network connection restored');
        this.handleNetworkReconnection();
      });

      window.addEventListener('offline', () => {
        console.log('Network connection lost');
        this.handleNetworkDisconnection();
      });
    }
  }

  /**
   * Show transaction confirmation UI
   */
  async showTransactionConfirmation(transactionSignature, options = {}) {
    const {
      transactionType = 'burn_vote',
      mlgAmount = 0,
      voteWeight = 0,
      contentId = '',
      contentTitle = 'Content',
      onConfirmed = null,
      onFailed = null,
      onTimeout = null,
      onRetry = null
    } = options;

    try {
      // Validate parameters
      if (!transactionSignature) {
        throw new Error('Transaction signature is required');
      }

      if (!this.connection) {
        throw new Error('Solana connection not available');
      }

      // Check if modal already exists
      if (this.activeModals.has(transactionSignature)) {
        return;
      }

      // Track transaction
      const transactionData = {
        signature: transactionSignature,
        type: transactionType,
        mlgAmount,
        voteWeight,
        contentId,
        contentTitle,
        state: TransactionState.PENDING,
        confirmations: 0,
        requiredConfirmations: this.getRequiredConfirmations(mlgAmount),
        startTime: Date.now(),
        lastUpdate: Date.now(),
        retryCount: 0,
        callbacks: {
          onConfirmed: onConfirmed || this.onTransactionConfirmed,
          onFailed: onFailed || this.onTransactionFailed,
          onTimeout: onTimeout || this.onTransactionTimeout,
          onRetry: onRetry || this.onRetryAttempted
        }
      };

      this.activeTransactions.set(transactionSignature, transactionData);

      // Create and show modal
      const modal = this.createTransactionModal(transactionData);
      document.body.appendChild(modal);
      
      // Trigger show animation
      requestAnimationFrame(() => {
        modal.classList.add('show');
      });

      // Setup focus management
      this.setupFocusManagement(modal);
      
      // Store reference
      this.activeModals.set(transactionSignature, modal);

      // Start confirmation polling
      this.startConfirmationPolling(transactionSignature);

      // Track analytics
      this.trackAnalyticsEvent(TRANSACTION_CONFIRMATION_CONFIG.ANALYTICS_EVENTS.TRANSACTION_STARTED, {
        signature: transactionSignature,
        type: transactionType,
        mlgAmount,
        voteWeight
      });

      console.log(`Transaction confirmation shown for ${transactionSignature}`);

    } catch (error) {
      console.error('Error showing transaction confirmation:', error);
      this.handleTransactionError(transactionSignature, error);
    }
  }

  /**
   * Create transaction confirmation modal
   */
  createTransactionModal(transactionData) {
    const { signature, type, mlgAmount, voteWeight, contentTitle, state } = transactionData;
    
    const modalId = `transaction-modal-${signature.slice(0, 8)}`;
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'transaction-confirmation-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', `transaction-title-${signature.slice(0, 8)}`);
    modal.setAttribute('aria-describedby', `transaction-description-${signature.slice(0, 8)}`);

    modal.innerHTML = this.getTransactionModalHTML(transactionData);

    // Setup event listeners
    this.setupModalEventListeners(modal, transactionData);

    return modal;
  }

  /**
   * Generate transaction modal HTML
   */
  getTransactionModalHTML(transactionData) {
    const { 
      signature, 
      type, 
      mlgAmount, 
      voteWeight, 
      contentTitle, 
      state,
      confirmations,
      requiredConfirmations 
    } = transactionData;

    const shortSignature = signature.slice(0, 8) + '...' + signature.slice(-8);
    const stateInfo = this.getStateInfo(state);
    const progressPercentage = Math.min((confirmations / requiredConfirmations) * 100, 100);

    return `
      <div class="transaction-confirmation-card">
        <header class="transaction-header">
          <h2 id="transaction-title-${signature.slice(0, 8)}" class="transaction-title">
            <span>⚡</span>
            Transaction Status
          </h2>
          <button class="transaction-close" aria-label="Close transaction status" data-action="close">×</button>
        </header>
        
        <main class="transaction-content">
          <p id="transaction-description-${signature.slice(0, 8)}" class="sr-only">
            Tracking confirmation status for your ${type.replace('_', ' ')} transaction
          </p>
          
          <!-- Transaction Status Display -->
          <section class="transaction-status ${state}" aria-label="Current transaction status">
            <div class="status-icon ${state}">${stateInfo.icon}</div>
            <div class="status-message ${state}">${stateInfo.title}</div>
            <div class="status-description">${stateInfo.description}</div>
          </section>
          
          <!-- Progress Indicators -->
          ${this.getProgressHTML(transactionData)}
          
          <!-- Confirmation Counter -->
          ${this.getConfirmationCounterHTML(transactionData)}
          
          <!-- Transaction Details -->
          <section class="transaction-details" aria-label="Transaction details">
            <div class="details-title">
              <span>📋</span>
              Transaction Details
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Transaction Type:</span>
              <span class="detail-value">${type.replace('_', ' ').toUpperCase()}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Content:</span>
              <span class="detail-value">${contentTitle}</span>
            </div>
            
            ${mlgAmount > 0 ? `
              <div class="detail-row">
                <span class="detail-label">MLG Burned:</span>
                <span class="detail-value">${mlgAmount} MLG</span>
              </div>
            ` : ''}
            
            ${voteWeight > 0 ? `
              <div class="detail-row">
                <span class="detail-label">Vote Weight:</span>
                <span class="detail-value">${voteWeight}x</span>
              </div>
            ` : ''}
            
            <div class="detail-row">
              <span class="detail-label">Signature:</span>
              <span class="detail-value signature">${shortSignature}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value">${stateInfo.title}</span>
            </div>
          </section>
          
          <!-- Explorer Links -->
          ${state !== TransactionState.PENDING ? this.getExplorerLinksHTML(signature) : ''}
          
          <!-- Error Details (if applicable) -->
          <div class="error-container" style="display: none;"></div>
        </main>
        
        <!-- Actions -->
        <footer class="transaction-actions">
          ${this.getActionButtonsHTML(state, transactionData)}
        </footer>
      </div>
    `;
  }

  /**
   * Get progress HTML for transaction tracking
   */
  getProgressHTML(transactionData) {
    const { state, confirmations, requiredConfirmations } = transactionData;
    
    if (state === TransactionState.CONFIRMED || state === TransactionState.FAILED) {
      return '';
    }

    const progressPercentage = state === TransactionState.PENDING ? 10 : 
                              Math.min((confirmations / requiredConfirmations) * 100, 95);

    return `
      <section class="transaction-progress" aria-label="Transaction progress">
        <div class="progress-label">
          <span>Confirmation Progress</span>
          <span>${confirmations}/${requiredConfirmations} confirmations</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${state === TransactionState.CONFIRMED ? 'confirmed' : ''}" 
               style="--progress-width: ${progressPercentage}%; width: ${progressPercentage}%"></div>
        </div>
      </section>
    `;
  }

  /**
   * Get confirmation counter HTML
   */
  getConfirmationCounterHTML(transactionData) {
    const { confirmations, requiredConfirmations } = transactionData;
    
    let steps = [];
    for (let i = 1; i <= requiredConfirmations; i++) {
      let stepClass = 'confirmation-step';
      if (i <= confirmations) {
        stepClass += ' completed';
      } else if (i === confirmations + 1) {
        stepClass += ' active';
      }

      steps.push(`
        <div class="${stepClass}">
          <div class="confirmation-number">${i}</div>
          <div class="confirmation-label">
            ${i === 1 ? 'Network' : i === 2 ? 'Verified' : 'Finalized'}
          </div>
        </div>
      `);
    }

    return `
      <section class="confirmation-counter" aria-label="Confirmation progress">
        ${steps.join('')}
      </section>
    `;
  }

  /**
   * Get explorer links HTML
   */
  getExplorerLinksHTML(signature) {
    const network = this.connection?.rpcEndpoint?.includes('devnet') ? '?cluster=devnet' : '';
    
    return `
      <section class="explorer-links" aria-label="View on blockchain explorers">
        <a href="${TRANSACTION_CONFIRMATION_CONFIG.SOLANA_EXPLORER_BASE_URL}/${signature}${network}" 
           target="_blank" 
           rel="noopener noreferrer" 
           class="explorer-link"
           data-explorer="solana">
          <span>🔍</span>
          Solana Explorer
        </a>
        <a href="${TRANSACTION_CONFIRMATION_CONFIG.SOLSCAN_BASE_URL}/${signature}${network}" 
           target="_blank" 
           rel="noopener noreferrer" 
           class="explorer-link"
           data-explorer="solscan">
          <span>📊</span>
          Solscan
        </a>
        <a href="${TRANSACTION_CONFIRMATION_CONFIG.SOLANA_FM_BASE_URL}/${signature}${network}" 
           target="_blank" 
           rel="noopener noreferrer" 
           class="explorer-link"
           data-explorer="solanafm">
          <span>🌐</span>
          Solana.fm
        </a>
      </section>
    `;
  }

  /**
   * Get action buttons HTML based on transaction state
   */
  getActionButtonsHTML(state, transactionData) {
    const { retryCount } = transactionData;
    
    switch (state) {
      case TransactionState.PENDING:
      case TransactionState.CONFIRMING:
        return `
          <button class="btn-transaction btn-secondary" data-action="close">
            Keep Waiting
          </button>
        `;
      
      case TransactionState.CONFIRMED:
        return `
          <button class="btn-transaction btn-primary" data-action="close">
            Awesome!
          </button>
        `;
      
      case TransactionState.FAILED:
      case TransactionState.ERROR:
        return `
          <button class="btn-transaction btn-secondary" data-action="close">
            Close
          </button>
          ${retryCount < TRANSACTION_CONFIRMATION_CONFIG.RETRY_ATTEMPTS ? `
            <button class="btn-transaction btn-danger" data-action="retry">
              <span class="loading-spinner" style="display: none;"></span>
              Retry Transaction
            </button>
          ` : ''}
        `;
      
      case TransactionState.TIMEOUT:
        return `
          <button class="btn-transaction btn-secondary" data-action="close">
            Close
          </button>
          <button class="btn-transaction btn-primary" data-action="check-again">
            <span class="loading-spinner" style="display: none;"></span>
            Check Again
          </button>
        `;
      
      default:
        return `
          <button class="btn-transaction btn-secondary" data-action="close">
            Close
          </button>
        `;
    }
  }

  /**
   * Setup modal event listeners
   */
  setupModalEventListeners(modal, transactionData) {
    const { signature } = transactionData;

    // Close button
    modal.querySelector('[data-action="close"]')?.addEventListener('click', () => {
      this.hideTransactionModal(signature);
    });

    // Retry button
    modal.querySelector('[data-action="retry"]')?.addEventListener('click', async (e) => {
      await this.handleRetryTransaction(signature, e.target);
    });

    // Check again button
    modal.querySelector('[data-action="check-again"]')?.addEventListener('click', async (e) => {
      await this.handleCheckAgain(signature, e.target);
    });

    // Explorer links
    modal.querySelectorAll('.explorer-link').forEach(link => {
      link.addEventListener('click', () => {
        const explorer = link.dataset.explorer;
        this.trackAnalyticsEvent(TRANSACTION_CONFIRMATION_CONFIG.ANALYTICS_EVENTS.EXPLORER_OPENED, {
          signature,
          explorer
        });
      });
    });

    // Overlay click to close (optional)
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hideTransactionModal(signature);
      }
    });

    // Keyboard events
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideTransactionModal(signature);
      }
    });
  }

  /**
   * Start confirmation polling for transaction
   */
  startConfirmationPolling(signature) {
    if (this.confirmationPollers.has(signature)) {
      return; // Already polling
    }

    console.log(`Starting confirmation polling for ${signature}`);
    
    const startTime = Date.now();
    const maxTimeout = TRANSACTION_CONFIRMATION_CONFIG.CONFIRMATION_TIMEOUT_MS;
    
    const pollInterval = setInterval(async () => {
      try {
        const elapsed = Date.now() - startTime;
        
        // Check for timeout
        if (elapsed > maxTimeout) {
          clearInterval(pollInterval);
          this.confirmationPollers.delete(signature);
          await this.handleTransactionTimeout(signature);
          return;
        }

        // Poll transaction status
        await this.pollTransactionStatus(signature);
        
        // Check if transaction is finalized
        const transactionData = this.activeTransactions.get(signature);
        if (transactionData && 
           (transactionData.state === TransactionState.CONFIRMED || 
            transactionData.state === TransactionState.FAILED)) {
          clearInterval(pollInterval);
          this.confirmationPollers.delete(signature);
        }

      } catch (error) {
        console.error(`Error polling transaction ${signature}:`, error);
        clearInterval(pollInterval);
        this.confirmationPollers.delete(signature);
        await this.handleTransactionError(signature, error);
      }
    }, TRANSACTION_CONFIRMATION_CONFIG.CONFIRMATION_POLL_INTERVAL_MS);

    this.confirmationPollers.set(signature, pollInterval);
  }

  /**
   * Poll transaction status from Solana network
   */
  async pollTransactionStatus(signature) {
    try {
      // Get signature status
      const statusResponse = await this.connection.getSignatureStatus(signature, {
        searchTransactionHistory: true
      });

      const transactionData = this.activeTransactions.get(signature);
      if (!transactionData) return;

      const status = statusResponse.value;
      
      if (status === null) {
        // Transaction not found yet - keep waiting if still within timeout
        transactionData.state = TransactionState.PENDING;
      } else if (status.err) {
        // Transaction failed
        transactionData.state = TransactionState.FAILED;
        transactionData.error = status.err;
        await this.handleTransactionFailed(signature, status.err);
      } else {
        // Transaction succeeded - check confirmation level
        const confirmationLevel = status.confirmationStatus;
        
        if (confirmationLevel === 'processed') {
          transactionData.state = TransactionState.CONFIRMING;
          transactionData.confirmations = 1;
        } else if (confirmationLevel === 'confirmed') {
          transactionData.state = TransactionState.CONFIRMING;
          transactionData.confirmations = 2;
        } else if (confirmationLevel === 'finalized') {
          transactionData.state = TransactionState.CONFIRMED;
          transactionData.confirmations = transactionData.requiredConfirmations;
          await this.handleTransactionConfirmed(signature);
        }
      }

      transactionData.lastUpdate = Date.now();
      this.updateTransactionUI(signature);

    } catch (error) {
      console.error(`Error polling transaction status for ${signature}:`, error);
      throw error;
    }
  }

  /**
   * Update transaction UI with current state
   */
  updateTransactionUI(signature) {
    const modal = this.activeModals.get(signature);
    const transactionData = this.activeTransactions.get(signature);
    
    if (!modal || !transactionData) return;

    const { state, confirmations, requiredConfirmations, error } = transactionData;
    const stateInfo = this.getStateInfo(state);

    // Update status section
    const statusSection = modal.querySelector('.transaction-status');
    if (statusSection) {
      statusSection.className = `transaction-status ${state}`;
      statusSection.querySelector('.status-icon').className = `status-icon ${state}`;
      statusSection.querySelector('.status-icon').textContent = stateInfo.icon;
      statusSection.querySelector('.status-message').className = `status-message ${state}`;
      statusSection.querySelector('.status-message').textContent = stateInfo.title;
      statusSection.querySelector('.status-description').textContent = stateInfo.description;
    }

    // Update progress bar
    const progressFill = modal.querySelector('.progress-fill');
    if (progressFill && state !== TransactionState.CONFIRMED && state !== TransactionState.FAILED) {
      const progressPercentage = state === TransactionState.PENDING ? 10 : 
                                Math.min((confirmations / requiredConfirmations) * 100, 95);
      progressFill.style.width = `${progressPercentage}%`;
    }

    // Update confirmation counter
    const confirmationSteps = modal.querySelectorAll('.confirmation-step');
    confirmationSteps.forEach((step, index) => {
      const stepNumber = index + 1;
      step.className = 'confirmation-step';
      
      if (stepNumber <= confirmations) {
        step.classList.add('completed');
      } else if (stepNumber === confirmations + 1 && state === TransactionState.CONFIRMING) {
        step.classList.add('active');
      }
    });

    // Update progress label
    const progressLabel = modal.querySelector('.progress-label span:last-child');
    if (progressLabel) {
      progressLabel.textContent = `${confirmations}/${requiredConfirmations} confirmations`;
    }

    // Update action buttons
    const actionsFooter = modal.querySelector('.transaction-actions');
    if (actionsFooter) {
      actionsFooter.innerHTML = this.getActionButtonsHTML(state, transactionData);
      // Re-setup event listeners for new buttons
      this.setupActionButtons(modal, transactionData);
    }

    // Show explorer links if transaction is visible on network
    if ((state === TransactionState.CONFIRMING || 
         state === TransactionState.CONFIRMED || 
         state === TransactionState.FAILED) && 
        !modal.querySelector('.explorer-links')) {
      
      const detailsSection = modal.querySelector('.transaction-details');
      if (detailsSection) {
        detailsSection.insertAdjacentHTML('afterend', this.getExplorerLinksHTML(signature));
        
        // Setup explorer link analytics
        modal.querySelectorAll('.explorer-link').forEach(link => {
          link.addEventListener('click', () => {
            const explorer = link.dataset.explorer;
            this.trackAnalyticsEvent(TRANSACTION_CONFIRMATION_CONFIG.ANALYTICS_EVENTS.EXPLORER_OPENED, {
              signature,
              explorer
            });
          });
        });
      }
    }

    // Show error details if transaction failed
    if (state === TransactionState.FAILED && error) {
      this.showErrorDetails(modal, error);
    }

    console.log(`Transaction UI updated for ${signature}: ${state} (${confirmations}/${requiredConfirmations})`);
  }

  /**
   * Setup action buttons event listeners
   */
  setupActionButtons(modal, transactionData) {
    const { signature } = transactionData;

    // Close button
    modal.querySelector('[data-action="close"]')?.addEventListener('click', () => {
      this.hideTransactionModal(signature);
    });

    // Retry button
    modal.querySelector('[data-action="retry"]')?.addEventListener('click', async (e) => {
      await this.handleRetryTransaction(signature, e.target);
    });

    // Check again button
    modal.querySelector('[data-action="check-again"]')?.addEventListener('click', async (e) => {
      await this.handleCheckAgain(signature, e.target);
    });
  }

  /**
   * Handle transaction confirmed
   */
  async handleTransactionConfirmed(signature) {
    const transactionData = this.activeTransactions.get(signature);
    if (!transactionData) return;

    console.log(`Transaction confirmed: ${signature}`);

    // Track analytics
    this.trackAnalyticsEvent(TRANSACTION_CONFIRMATION_CONFIG.ANALYTICS_EVENTS.TRANSACTION_CONFIRMED, {
      signature,
      type: transactionData.type,
      mlgAmount: transactionData.mlgAmount,
      confirmationTime: Date.now() - transactionData.startTime
    });

    // Call callback
    if (transactionData.callbacks.onConfirmed) {
      try {
        await transactionData.callbacks.onConfirmed({
          signature,
          ...transactionData
        });
      } catch (error) {
        console.error('Error in confirmed callback:', error);
      }
    }

    // Auto-close after delay
    setTimeout(() => {
      if (this.activeModals.has(signature)) {
        this.hideTransactionModal(signature);
      }
    }, TRANSACTION_CONFIRMATION_CONFIG.SUCCESS_CELEBRATION_DURATION);
  }

  /**
   * Handle transaction failed
   */
  async handleTransactionFailed(signature, error) {
    const transactionData = this.activeTransactions.get(signature);
    if (!transactionData) return;

    console.error(`Transaction failed: ${signature}`, error);

    transactionData.error = error;

    // Track analytics
    this.trackAnalyticsEvent(TRANSACTION_CONFIRMATION_CONFIG.ANALYTICS_EVENTS.TRANSACTION_FAILED, {
      signature,
      type: transactionData.type,
      error: error?.toString() || 'Unknown error',
      duration: Date.now() - transactionData.startTime
    });

    // Call callback
    if (transactionData.callbacks.onFailed) {
      try {
        await transactionData.callbacks.onFailed({
          signature,
          error,
          ...transactionData
        });
      } catch (callbackError) {
        console.error('Error in failed callback:', callbackError);
      }
    }
  }

  /**
   * Handle transaction timeout
   */
  async handleTransactionTimeout(signature) {
    const transactionData = this.activeTransactions.get(signature);
    if (!transactionData) return;

    console.warn(`Transaction timeout: ${signature}`);

    transactionData.state = TransactionState.TIMEOUT;
    this.updateTransactionUI(signature);

    // Track analytics
    this.trackAnalyticsEvent(TRANSACTION_CONFIRMATION_CONFIG.ANALYTICS_EVENTS.TRANSACTION_TIMEOUT, {
      signature,
      type: transactionData.type,
      duration: Date.now() - transactionData.startTime
    });

    // Call callback
    if (transactionData.callbacks.onTimeout) {
      try {
        await transactionData.callbacks.onTimeout({
          signature,
          ...transactionData
        });
      } catch (error) {
        console.error('Error in timeout callback:', error);
      }
    }
  }

  /**
   * Handle transaction error
   */
  async handleTransactionError(signature, error) {
    const transactionData = this.activeTransactions.get(signature);
    if (transactionData) {
      transactionData.state = TransactionState.ERROR;
      transactionData.error = error;
      this.updateTransactionUI(signature);
    }

    console.error(`Transaction error: ${signature}`, error);

    // Show error modal if no transaction UI exists
    if (!this.activeModals.has(signature)) {
      this.showErrorModal(signature, error);
    }
  }

  /**
   * Handle retry transaction
   */
  async handleRetryTransaction(signature, buttonElement) {
    const transactionData = this.activeTransactions.get(signature);
    if (!transactionData) return;

    console.log(`Retrying transaction: ${signature}`);

    // Show loading state
    const spinner = buttonElement.querySelector('.loading-spinner');
    if (spinner) spinner.style.display = 'inline-block';
    buttonElement.disabled = true;

    try {
      transactionData.retryCount += 1;
      transactionData.state = TransactionState.PENDING;
      transactionData.startTime = Date.now();
      
      // Update UI
      this.updateTransactionUI(signature);
      
      // Start polling again
      this.startConfirmationPolling(signature);

      // Track analytics
      this.trackAnalyticsEvent(TRANSACTION_CONFIRMATION_CONFIG.ANALYTICS_EVENTS.RETRY_ATTEMPTED, {
        signature,
        retryCount: transactionData.retryCount
      });

      // Call callback
      if (transactionData.callbacks.onRetry) {
        await transactionData.callbacks.onRetry({
          signature,
          retryCount: transactionData.retryCount,
          ...transactionData
        });
      }

    } catch (error) {
      console.error('Error retrying transaction:', error);
      await this.handleTransactionError(signature, error);
    } finally {
      // Hide loading state
      if (spinner) spinner.style.display = 'none';
      buttonElement.disabled = false;
    }
  }

  /**
   * Handle check again action
   */
  async handleCheckAgain(signature, buttonElement) {
    console.log(`Checking transaction again: ${signature}`);

    // Show loading state
    const spinner = buttonElement.querySelector('.loading-spinner');
    if (spinner) spinner.style.display = 'inline-block';
    buttonElement.disabled = true;

    try {
      // Reset state and start polling
      const transactionData = this.activeTransactions.get(signature);
      if (transactionData) {
        transactionData.state = TransactionState.PENDING;
        transactionData.confirmations = 0;
        transactionData.startTime = Date.now();
        
        this.updateTransactionUI(signature);
        this.startConfirmationPolling(signature);
      }

    } catch (error) {
      console.error('Error checking transaction again:', error);
      await this.handleTransactionError(signature, error);
    } finally {
      // Hide loading state
      if (spinner) spinner.style.display = 'none';
      buttonElement.disabled = false;
    }
  }

  /**
   * Show error details in modal
   */
  showErrorDetails(modal, error) {
    const errorContainer = modal.querySelector('.error-container');
    if (!errorContainer) return;

    const errorType = this.classifyError(error);
    const errorConfig = this.getErrorConfig(errorType);
    
    errorContainer.innerHTML = `
      <div class="error-details">
        <div class="error-title">${errorConfig.title}</div>
        <div class="error-message">${errorConfig.description}</div>
        ${error.toString ? `<div class="error-code">Error: ${error.toString()}</div>` : ''}
      </div>
    `;
    
    errorContainer.style.display = 'block';
  }

  /**
   * Show error modal for transactions without UI
   */
  showErrorModal(signature, error) {
    // Implementation would create a simple error modal
    console.error(`Error modal for ${signature}:`, error);
    
    // For now, just log the error
    // In a real implementation, this would show a user-friendly error dialog
  }

  /**
   * Get state information for UI display
   */
  getStateInfo(state) {
    const stateConfigs = {
      [TransactionState.PENDING]: {
        icon: '⏳',
        title: 'Transaction Pending',
        description: 'Your transaction has been submitted to the Solana network and is waiting for confirmation.'
      },
      [TransactionState.CONFIRMING]: {
        icon: '⚡',
        title: 'Confirming Transaction',
        description: 'Your transaction is being confirmed by the network. This usually takes 5-15 seconds.'
      },
      [TransactionState.CONFIRMED]: {
        icon: '🎉',
        title: 'Transaction Confirmed!',
        description: 'Your transaction has been successfully confirmed and is now final on the blockchain.'
      },
      [TransactionState.FAILED]: {
        icon: '❌',
        title: 'Transaction Failed',
        description: 'Your transaction was rejected by the network. Please check the details and try again.'
      },
      [TransactionState.TIMEOUT]: {
        icon: '⏰',
        title: 'Transaction Timeout',
        description: 'Your transaction is taking longer than expected. It may still succeed - check again or retry.'
      },
      [TransactionState.ERROR]: {
        icon: '⚠️',
        title: 'Transaction Error',
        description: 'There was an error processing your transaction. Please check your connection and try again.'
      }
    };

    return stateConfigs[state] || stateConfigs[TransactionState.ERROR];
  }

  /**
   * Classify error type
   */
  classifyError(error) {
    if (!error) return TransactionError.UNKNOWN_ERROR;
    
    const errorString = error.toString().toLowerCase();
    
    if (errorString.includes('timeout')) return TransactionError.TIMEOUT;
    if (errorString.includes('network')) return TransactionError.NETWORK_ERROR;
    if (errorString.includes('insufficient')) return TransactionError.INSUFFICIENT_FUNDS;
    if (errorString.includes('signature')) return TransactionError.SIGNATURE_NOT_FOUND;
    if (errorString.includes('confirm')) return TransactionError.CONFIRMATION_FAILED;
    
    return TransactionError.UNKNOWN_ERROR;
  }

  /**
   * Get error configuration
   */
  getErrorConfig(errorType) {
    const configs = {
      [TransactionError.NETWORK_ERROR]: {
        title: 'Network Error',
        description: 'Unable to connect to the Solana network. Please check your internet connection and try again.'
      },
      [TransactionError.TIMEOUT]: {
        title: 'Transaction Timeout',
        description: 'The transaction is taking longer than expected. It may still complete successfully.'
      },
      [TransactionError.TRANSACTION_FAILED]: {
        title: 'Transaction Failed',
        description: 'The transaction was rejected by the network. Please check your balance and try again.'
      },
      [TransactionError.INSUFFICIENT_FUNDS]: {
        title: 'Insufficient Funds',
        description: 'You don\'t have enough SOL or tokens to complete this transaction.'
      },
      [TransactionError.SIGNATURE_NOT_FOUND]: {
        title: 'Transaction Not Found',
        description: 'The transaction signature could not be found on the network.'
      },
      [TransactionError.CONFIRMATION_FAILED]: {
        title: 'Confirmation Failed',
        description: 'The transaction could not be confirmed by the network.'
      },
      [TransactionError.UNKNOWN_ERROR]: {
        title: 'Unknown Error',
        description: 'An unexpected error occurred. Please try again or contact support if the problem persists.'
      }
    };

    return configs[errorType] || configs[TransactionError.UNKNOWN_ERROR];
  }

  /**
   * Get required confirmations based on MLG amount
   */
  getRequiredConfirmations(mlgAmount) {
    if (mlgAmount >= 11) return TRANSACTION_CONFIRMATION_CONFIG.CONFIRMATION_REQUIREMENTS.LEGENDARY;
    if (mlgAmount >= 4) return TRANSACTION_CONFIRMATION_CONFIG.CONFIRMATION_REQUIREMENTS.HIGH_VALUE;
    return TRANSACTION_CONFIRMATION_CONFIG.CONFIRMATION_REQUIREMENTS.STANDARD;
  }

  /**
   * Handle network reconnection
   */
  handleNetworkReconnection() {
    // Resume polling for any pending transactions
    for (const [signature, transactionData] of this.activeTransactions.entries()) {
      if ((transactionData.state === TransactionState.PENDING || 
           transactionData.state === TransactionState.CONFIRMING) &&
          !this.confirmationPollers.has(signature)) {
        
        console.log(`Resuming polling for ${signature} after network reconnection`);
        this.startConfirmationPolling(signature);
      }
    }
  }

  /**
   * Handle network disconnection
   */
  handleNetworkDisconnection() {
    // Pause polling for all transactions
    for (const [signature, pollInterval] of this.confirmationPollers.entries()) {
      clearInterval(pollInterval);
      this.confirmationPollers.delete(signature);
    }
    
    console.log('Paused all transaction polling due to network disconnection');
  }

  /**
   * Setup focus management for accessibility
   */
  setupFocusManagement(modal) {
    const focusableElements = modal.querySelectorAll(
      'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
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
   * Hide transaction modal
   */
  hideTransactionModal(signature) {
    const modal = this.activeModals.get(signature);
    if (!modal) return;

    // Stop polling
    const pollInterval = this.confirmationPollers.get(signature);
    if (pollInterval) {
      clearInterval(pollInterval);
      this.confirmationPollers.delete(signature);
    }

    // Add exit animation
    modal.classList.remove('show');

    // Remove modal after animation
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
      this.activeModals.delete(signature);
      this.activeTransactions.delete(signature);
      this.retryAttempts.delete(signature);
    }, 300);

    console.log(`Transaction modal closed for ${signature}`);
  }

  /**
   * Track analytics event
   */
  trackAnalyticsEvent(eventName, eventData) {
    if (this.analytics && typeof this.analytics.track === 'function') {
      this.analytics.track(eventName, {
        timestamp: new Date().toISOString(),
        source: 'transaction_confirmation_ui',
        ...eventData
      });
    }
    
    console.log(`Analytics event: ${eventName}`, eventData);
  }

  /**
   * Get transaction status for external queries
   */
  getTransactionStatus(signature) {
    const transactionData = this.activeTransactions.get(signature);
    if (!transactionData) {
      return null;
    }

    return {
      signature,
      state: transactionData.state,
      confirmations: transactionData.confirmations,
      requiredConfirmations: transactionData.requiredConfirmations,
      error: transactionData.error,
      retryCount: transactionData.retryCount,
      startTime: transactionData.startTime,
      lastUpdate: transactionData.lastUpdate
    };
  }

  /**
   * Destroy the transaction confirmation system
   */
  destroy() {
    // Clear all pollers
    for (const [signature, pollInterval] of this.confirmationPollers.entries()) {
      clearInterval(pollInterval);
    }
    this.confirmationPollers.clear();

    // Close all active modals
    for (const [signature, modal] of this.activeModals.entries()) {
      this.hideTransactionModal(signature);
    }

    // Clear all references
    this.activeTransactions.clear();
    this.activeModals.clear();
    this.retryAttempts.clear();
    
    console.log('Transaction Confirmation System destroyed');
  }
}

/**
 * Integration function with burn vote confirmation system
 */
export function integrateBurnVoteConfirmation(transactionConfirmationSystem, burnVoteConfirmationSystem) {
  if (!transactionConfirmationSystem || !burnVoteConfirmationSystem) {
    console.error('Both systems must be provided for integration');
    return;
  }

  // Override the burn vote execution to show transaction confirmation
  const originalExecuteBurnVote = burnVoteConfirmationSystem.executeBurnVote;
  
  burnVoteConfirmationSystem.executeBurnVote = async function(contentId, mlgCost, voteWeight) {
    try {
      // Execute the original burn vote logic to get signature
      const result = await originalExecuteBurnVote.call(this, contentId, mlgCost, voteWeight);
      
      if (result.success && result.transactionId) {
        // Show transaction confirmation UI
        await transactionConfirmationSystem.showTransactionConfirmation(result.transactionId, {
          transactionType: 'burn_vote',
          mlgAmount: mlgCost,
          voteWeight: voteWeight,
          contentId: contentId,
          contentTitle: `Content ${contentId}`,
          onConfirmed: (transactionData) => {
            console.log('Burn vote transaction confirmed:', transactionData);
          },
          onFailed: (transactionData) => {
            console.error('Burn vote transaction failed:', transactionData);
          }
        });
      }
      
      return result;
      
    } catch (error) {
      console.error('Error in integrated burn vote execution:', error);
      throw error;
    }
  };

  console.log('Transaction confirmation system integrated with burn vote confirmation');
}

/**
 * Export default system
 */
export default TransactionConfirmationSystem;