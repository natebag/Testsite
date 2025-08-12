/**
 * MLG.clan Voting Integration System - Task 15.2
 * 
 * Comprehensive voting system integration that makes all vote buttons functional
 * across the entire platform with real vote counting and burn-to-vote mechanism.
 * 
 * Features:
 * - Real-time vote counting with WebSocket updates
 * - MLG token burn-to-vote functionality
 * - Phantom wallet integration for transactions
 * - Gaming-themed notifications and animations
 * - Cross-platform vote synchronization
 * - Vote persistence via MLGApiClient
 * - Error handling and retry logic
 * - Xbox 360 retro aesthetic maintained
 * 
 * Integration Points:
 * - PhantomWalletManager for wallet connectivity
 * - SolanaVotingSystem for blockchain interactions
 * - MLGApiClient for vote persistence
 * - MLGWebSocketManager for real-time updates
 * 
 * @author Claude Code - UI Production Builder Agent
 * @version 1.0.0
 */

import { getWalletManager } from '../wallet/phantom-wallet.js';
import { SolanaVotingSystem, VOTING_CONFIG } from '../voting/solana-voting-system.js';

/**
 * Voting Integration System Configuration
 */
const VOTING_INTEGRATION_CONFIG = {
  // Vote costs (MLG tokens)
  VOTE_COSTS: {
    'upvote': 1,
    'supervote': 5,
    'downvote': 2,
    'free-vote': 0,
    'custom': 25  // Custom vote amount for vote vault
  },
  
  // Real-time update intervals
  UPDATE_INTERVALS: {
    ACTIVE_VOTING: 2000,  // 2 seconds for active voting
    BACKGROUND: 10000,    // 10 seconds for background
    RETRY_DELAY: 5000     // 5 seconds retry delay
  },
  
  // Animation settings
  ANIMATIONS: {
    VOTE_SUCCESS: 'burn-animation',
    DURATION: 600,
    PULSE_DURATION: 1500
  },
  
  // Notification settings
  NOTIFICATIONS: {
    SUCCESS_DURATION: 4000,
    ERROR_DURATION: 6000,
    WARNING_DURATION: 5000
  }
};

/**
 * Main Voting Integration Manager
 * Coordinates all voting functionality across the platform
 */
export class MLGVotingIntegration {
  constructor() {
    this.walletManager = null;
    this.votingSystem = null;
    this.isInitialized = false;
    this.activeVotes = new Map();
    this.voteCache = new Map();
    this.websocketManager = null;
    this.mlgApiClient = null;
    this.updateIntervals = new Map();
    this.eventListeners = new Map();
    
    // Gaming notification system
    this.notificationSystem = null;
    
    console.log('🎮 MLG Voting Integration System initialized');
  }

  /**
   * Initialize the voting integration system
   */
  async initialize() {
    try {
      console.log('🚀 Initializing MLG Voting Integration...');
      
      // Initialize wallet manager
      this.walletManager = window.phantomWalletManager || getWalletManager();
      if (!this.walletManager) {
        throw new Error('PhantomWalletManager not available');
      }
      
      // Initialize voting system
      this.votingSystem = new SolanaVotingSystem();
      await this.votingSystem.initialize();
      
      // Connect to API client and WebSocket manager
      this.mlgApiClient = window.MLGApiClient || window.mlgApi;
      this.websocketManager = window.MLGWebSocketManager;
      this.notificationSystem = window.mlg || window.MLGNotificationSystem;
      
      // Setup event listeners for vote buttons
      this.setupVoteButtonListeners();
      
      // Setup WebSocket listeners for real-time updates
      this.setupWebSocketListeners();
      
      // Start background vote count updates
      this.startVoteCountUpdates();
      
      this.isInitialized = true;
      console.log('✅ MLG Voting Integration initialized successfully');
      
      return { success: true, message: 'Voting system ready' };
      
    } catch (error) {
      console.error('❌ Failed to initialize voting integration:', error);
      throw error;
    }
  }

  /**
   * Setup vote button event listeners across the platform
   */
  setupVoteButtonListeners() {
    console.log('🔘 Setting up vote button listeners...');
    
    // Delegate event listener for all vote buttons
    document.addEventListener('click', (event) => {
      const target = event.target.closest('[data-action]');
      if (!target) return;
      
      const action = target.getAttribute('data-action');
      if (!this.isVoteAction(action)) return;
      
      event.preventDefault();
      event.stopPropagation();
      
      this.handleVoteButtonClick(target, action);
    });
    
    // Specific listeners for voting.html page
    this.setupVotingPageListeners();
    
    // Setup vote vault specific listeners  
    this.setupVoteVaultListeners();
    
    console.log('✅ Vote button listeners configured');
  }
  
  /**
   * Check if action is a voting action
   */
  isVoteAction(action) {
    return ['upvote', 'downvote', 'supervote', 'burn-vote', 'free-vote', 'vote'].includes(action);
  }

  /**
   * Setup voting page specific listeners
   */
  setupVotingPageListeners() {
    // Vote buttons with data-content-id and data-cost
    document.addEventListener('click', (event) => {
      if (!event.target.classList.contains('vote-btn')) return;
      
      event.preventDefault();
      const contentId = event.target.getAttribute('data-content-id');
      const cost = parseInt(event.target.getAttribute('data-cost')) || 25;
      
      if (contentId) {
        this.executeVote(contentId, 'custom', cost, event.target);
      }
    });
  }

  /**
   * Setup vote vault specific listeners
   */
  setupVoteVaultListeners() {
    // Buy votes button
    const buyVotesBtn = document.getElementById('buy-votes');
    if (buyVotesBtn) {
      buyVotesBtn.addEventListener('click', (event) => {
        event.preventDefault();
        this.handleBuyVotes();
      });
    }
  }

  /**
   * Handle vote button click
   */
  async handleVoteButtonClick(button, action) {
    if (button.disabled || button.classList.contains('voting-in-progress')) {
      return;
    }
    
    const contentId = button.getAttribute('data-content-id') || 
                     button.getAttribute('data-id') || 
                     `content-${Date.now()}`;
    
    const cost = parseInt(button.getAttribute('data-cost')) || 
                VOTING_INTEGRATION_CONFIG.VOTE_COSTS[action] || 1;
    
    console.log(`🗳️ Vote button clicked: ${action} for ${contentId} (cost: ${cost} MLG)`);
    
    await this.executeVote(contentId, action, cost, button);
  }

  /**
   * Execute a vote transaction with comprehensive error handling
   */
  async executeVote(contentId, voteType, cost, buttonElement = null) {
    const startTime = Date.now();
    let transactionAttempt = 0;
    const maxRetries = 3;
    
    try {
      // Validate prerequisites
      const validation = this.validateVotePrerequisites(cost);
      if (!validation.valid) {
        this.showVoteError(validation.error);
        return;
      }
      
      // Update button state
      if (buttonElement) {
        this.updateButtonState(buttonElement, 'voting');
      }
      
      // Show voting confirmation for paid votes
      if (cost > 0) {
        const confirmed = await this.showVoteConfirmation(contentId, voteType, cost);
        if (!confirmed) {
          if (buttonElement) {
            this.updateButtonState(buttonElement, 'idle');
          }
          return;
        }
      }
      
      console.log(`🔥 Executing ${voteType} vote for ${contentId} (${cost} MLG tokens)`);
      
      let result;
      
      // Retry logic for network issues
      while (transactionAttempt < maxRetries) {
        transactionAttempt++;
        
        try {
          if (cost === 0) {
            // Free vote
            result = await this.executeFreeVote(contentId, voteType);
          } else {
            // Burn-to-vote
            result = await this.executeBurnVote(contentId, voteType, cost);
          }
          
          if (result.success) {
            break; // Success, exit retry loop
          } else if (transactionAttempt < maxRetries) {
            console.log(`Retry attempt ${transactionAttempt}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
            continue;
          } else {
            throw new Error(result.error || 'Vote failed after retries');
          }
        } catch (retryError) {
          if (transactionAttempt >= maxRetries) {
            throw retryError;
          }
          console.warn(`Vote attempt ${transactionAttempt} failed, retrying:`, retryError.message);
          await new Promise(resolve => setTimeout(resolve, 1000 * transactionAttempt)); // Exponential backoff
        }
      }
      
      if (result.success) {
        // Update vote counts in real-time
        await this.updateVoteCount(contentId, voteType, result.transactionHash);
        
        // Success animation and notification
        this.showVoteSuccess(buttonElement, voteType, cost);
        
        // Persist vote to backend (non-blocking)
        this.persistVote(contentId, voteType, cost, result.transactionHash).catch(err => {
          console.warn('Vote persistence failed (non-critical):', err);
        });
        
        // Log performance metrics
        const duration = Date.now() - startTime;
        console.log(`✅ Vote successful: ${result.transactionHash} (${duration}ms, ${transactionAttempt} attempts)`);
      } else {
        throw new Error(result.error || 'Vote failed');
      }
      
    } catch (error) {
      console.error('❌ Vote execution failed:', error);
      
      // Reset button state with error indication
      if (buttonElement) {
        this.updateButtonState(buttonElement, 'error');
        setTimeout(() => {
          this.updateButtonState(buttonElement, 'idle');
        }, 2000);
      }
      
      // Show comprehensive error notification
      this.showVoteError(error.message);
      
      // Log error for analytics
      this.logVoteError(contentId, voteType, cost, error, Date.now() - startTime, transactionAttempt);
    }
  }
  
  /**
   * Validate vote prerequisites
   */
  validateVotePrerequisites(cost) {
    // Check if system is initialized
    if (!this.isInitialized) {
      return { valid: false, error: 'Voting system not initialized' };
    }
    
    // Check wallet connection for paid votes
    if (cost > 0 && !this.walletManager?.isConnected()) {
      return { valid: false, error: 'Wallet not connected' };
    }
    
    // Check if voting system is available
    if (!this.votingSystem) {
      return { valid: false, error: 'Voting system not available' };
    }
    
    return { valid: true };
  }
  
  /**
   * Log vote error for analytics and debugging
   */
  logVoteError(contentId, voteType, cost, error, duration, attempts) {
    const errorLog = {
      timestamp: Date.now(),
      contentId,
      voteType,
      cost,
      error: error.message,
      duration,
      attempts,
      userAgent: navigator.userAgent,
      walletConnected: this.walletManager?.isConnected() || false
    };
    
    console.error('📁 Vote Error Log:', errorLog);
    
    // Send to analytics if available
    if (window.MLGAnalytics && window.MLGAnalytics.trackError) {
      window.MLGAnalytics.trackError('vote_error', errorLog);
    }
  }

  /**
   * Execute free vote
   */
  async executeFreeVote(contentId, voteType) {
    try {
      // Check daily free vote allocation
      const allocation = await this.votingSystem.getDailyVoteAllocation();
      
      if (allocation.freeVotesRemaining <= 0) {
        throw new Error('No free votes remaining today');
      }
      
      // Execute free vote (no token burning)
      const result = await this.votingSystem.castFreeVote(contentId, voteType);
      
      return {
        success: true,
        transactionHash: result.signature,
        cost: 0,
        type: 'free'
      };
      
    } catch (error) {
      console.error('Free vote failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute burn-to-vote
   */
  async executeBurnVote(contentId, voteType, tokenAmount) {
    try {
      // Get wallet connection info
      const walletInfo = this.walletManager.getConnectionInfo();
      if (!walletInfo.connected) {
        throw new Error('Wallet not connected');
      }
      
      // Execute burn-to-vote transaction
      const result = await this.votingSystem.burnToVote({
        contentId,
        voteType,
        tokenAmount,
        walletAddress: walletInfo.publicKey
      });
      
      return {
        success: true,
        transactionHash: result.signature,
        cost: tokenAmount,
        type: 'burn',
        tokensRemaining: result.remainingBalance
      };
      
    } catch (error) {
      console.error('Burn vote failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Show vote confirmation dialog
   */
  async showVoteConfirmation(contentId, voteType, cost) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-gaming-surface rounded-xl p-6 max-w-md mx-4 border border-gaming-accent">
          <div class="text-center">
            <div class="text-4xl mb-4">🔥</div>
            <h3 class="text-xl font-bold text-gaming-accent mb-2">Confirm Vote</h3>
            <p class="text-gray-300 mb-4">
              This will burn <span class="text-gaming-accent font-bold">${cost} MLG tokens</span> 
              to cast a ${voteType} vote.
            </p>
            <p class="text-sm text-gray-400 mb-6">
              This action cannot be undone. Tokens will be permanently burned.
            </p>
            <div class="flex gap-3">
              <button id="confirm-vote" class="flex-1 bg-gaming-accent hover:bg-green-400 text-black px-4 py-2 rounded-lg font-bold transition-colors">
                🔥 Burn & Vote
              </button>
              <button id="cancel-vote" class="flex-1 bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg font-bold transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      modal.querySelector('#confirm-vote').onclick = () => {
        document.body.removeChild(modal);
        resolve(true);
      };
      
      modal.querySelector('#cancel-vote').onclick = () => {
        document.body.removeChild(modal);
        resolve(false);
      };
      
      // Close on backdrop click
      modal.onclick = (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
          resolve(false);
        }
      };
    });
  }

  /**
   * Update button visual state
   */
  updateButtonState(button, state) {
    if (!button) return;
    
    const originalText = button.getAttribute('data-original-text') || button.textContent;
    const cost = button.getAttribute('data-cost') || '25';
    
    // Store original text if not already stored
    if (!button.hasAttribute('data-original-text')) {
      button.setAttribute('data-original-text', originalText);
    }
    
    // Remove existing state classes
    button.classList.remove('voting-in-progress', 'vote-success', 'vote-error');
    button.disabled = false;
    
    switch (state) {
      case 'voting':
        button.classList.add('voting-in-progress');
        button.disabled = true;
        button.innerHTML = `
          <div class="flex items-center justify-center space-x-2">
            <div class="loading-spinner gaming-pulse"></div>
            <span>Voting...</span>
          </div>
        `;
        break;
        
      case 'success':
        button.classList.add('vote-success');
        button.innerHTML = `
          <div class="flex items-center justify-center space-x-2">
            <span>🔥</span>
            <span>Vote Cast!</span>
          </div>
        `;
        setTimeout(() => {
          button.classList.remove('vote-success');
          button.innerHTML = originalText;
        }, VOTING_INTEGRATION_CONFIG.ANIMATIONS.DURATION + 1000);
        break;
        
      case 'error':
        button.classList.add('vote-error');
        button.disabled = true;
        button.innerHTML = `
          <div class="flex items-center justify-center space-x-2">
            <span>❌</span>
            <span>Failed</span>
          </div>
        `;
        break;
        
      default: // 'idle'
        button.disabled = false;
        button.innerHTML = originalText;
        break;
    }
  }

  /**
   * Show vote success notification and animation
   */
  showVoteSuccess(buttonElement, voteType, cost) {
    // Button success state
    if (buttonElement) {
      this.updateButtonState(buttonElement, 'success');
      
      // Add burn animation
      buttonElement.classList.add(VOTING_INTEGRATION_CONFIG.ANIMATIONS.VOTE_SUCCESS);
      setTimeout(() => {
        buttonElement.classList.remove(VOTING_INTEGRATION_CONFIG.ANIMATIONS.VOTE_SUCCESS);
      }, VOTING_INTEGRATION_CONFIG.ANIMATIONS.DURATION);
    }
    
    // Success notification
    const message = cost > 0 
      ? `🔥 Vote cast! Burned ${cost} MLG tokens`
      : `✅ Free vote cast successfully!`;
    
    this.showNotification(message, 'success');
    
    // Gaming sound effect (if available)
    this.playVoteSound('success');
  }

  /**
   * Show vote error notification with comprehensive error handling
   */
  showVoteError(errorMessage) {
    let userMessage = '❌ Vote failed. Please try again.';
    let actionable = false;
    let actionText = '';
    let actionCallback = null;
    
    // Comprehensive error message mapping
    if (errorMessage.includes('insufficient') || errorMessage.includes('balance')) {
      userMessage = '💰 Insufficient MLG tokens for this vote.';
      actionable = true;
      actionText = 'Buy MLG Tokens';
      actionCallback = () => this.handleBuyTokens();
    } else if (errorMessage.includes('rejected') || errorMessage.includes('cancelled')) {
      userMessage = '🚫 Transaction was cancelled by user.';
    } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      userMessage = '🌐 Network error. Check your connection.';
      actionable = true;
      actionText = 'Retry';
      actionCallback = () => window.location.reload();
    } else if (errorMessage.includes('wallet') || errorMessage.includes('phantom')) {
      userMessage = '👛 Wallet connection error. Please reconnect.';
      actionable = true;
      actionText = 'Connect Wallet';
      actionCallback = () => this.handleWalletReconnect();
    } else if (errorMessage.includes('not initialized') || errorMessage.includes('system')) {
      userMessage = '⚠️ Voting system not ready. Please refresh the page.';
      actionable = true;
      actionText = 'Refresh Page';
      actionCallback = () => window.location.reload();
    } else if (errorMessage.includes('daily limit') || errorMessage.includes('votes remaining')) {
      userMessage = '🎫 No free votes remaining today. Use MLG tokens to vote.';
      actionable = true;
      actionText = 'Buy Votes';
      actionCallback = () => this.handleBuyVotes();
    } else if (errorMessage.includes('timeout')) {
      userMessage = '⏱️ Transaction timeout. Network may be congested.';
      actionable = true;
      actionText = 'Try Again';
    }
    
    // Enhanced notification with action button if applicable
    if (actionable && actionCallback) {
      this.showActionableNotification(userMessage, 'error', actionText, actionCallback);
    } else {
      this.showNotification(userMessage, 'error');
    }
    
    this.playVoteSound('error');
  }
  
  /**
   * Show actionable notification with button
   */
  showActionableNotification(message, type, actionText, actionCallback) {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-4 rounded-lg text-white font-medium z-50 transition-transform transform translate-x-full shadow-lg border max-w-sm ${
      type === 'error' ? 'bg-red-600 border-red-400' :
      type === 'warning' ? 'bg-yellow-600 text-black border-yellow-400' :
      'bg-blue-600 border-blue-400'
    }`;
    
    notification.innerHTML = `
      <div class="flex items-start space-x-3">
        <div class="flex-1">
          <div class="text-sm">${message}</div>
          <button class="mt-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded text-xs transition-colors" 
                  onclick="this.parentElement.parentElement.parentElement.remove(); (${actionCallback.toString()})()">                  
            ${actionText}
          </button>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-300 transition-colors">
          ×
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 100);
    
    // Auto-dismiss after 8 seconds for error notifications
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }
    }, 8000);
  }
  
  /**
   * Handle wallet reconnection
   */
  async handleWalletReconnect() {
    try {
      if (this.walletManager) {
        await this.walletManager.connect();
        this.showNotification('🔗 Wallet reconnected successfully!', 'success');
      } else {
        this.showNotification('❌ Wallet manager not available', 'error');
      }
    } catch (error) {
      this.showNotification('❌ Failed to reconnect wallet: ' + error.message, 'error');
    }
  }
  
  /**
   * Handle token purchasing
   */
  handleBuyTokens() {
    this.showNotification('💰 MLG token purchasing coming soon!', 'info');
    // TODO: Implement token purchase flow
  }

  /**
   * Update vote count display in real-time
   */
  async updateVoteCount(contentId, voteType, transactionHash) {
    try {
      // Find all vote count elements for this content
      const voteElements = document.querySelectorAll(
        `[data-content-id="${contentId}"] .vote-count, 
         [data-id="${contentId}"] .vote-count,
         .vote-count[data-content-id="${contentId}"]`
      );
      
      voteElements.forEach(element => {
        const currentCount = parseInt(element.textContent) || 0;
        const newCount = currentCount + 1;
        
        // Animate count update
        element.classList.add('count-updating');
        element.textContent = newCount.toLocaleString();
        
        setTimeout(() => {
          element.classList.remove('count-updating');
        }, VOTING_INTEGRATION_CONFIG.ANIMATIONS.DURATION);
      });
      
      // Update cache
      this.voteCache.set(contentId, {
        timestamp: Date.now(),
        lastTransaction: transactionHash,
        count: (parseInt(voteElements[0]?.textContent) || 0)
      });
      
      // Broadcast update via WebSocket
      if (this.websocketManager) {
        this.websocketManager.emit('vote-update', {
          contentId,
          voteType,
          transactionHash,
          newCount: (parseInt(voteElements[0]?.textContent) || 0)
        });
      }
      
      console.log(`✅ Vote count updated for content ${contentId}: +1 vote`);
      
    } catch (error) {
      console.warn('Vote count update failed:', error);
    }
  }

  /**
   * Persist vote to backend API
   */
  async persistVote(contentId, voteType, cost, transactionHash) {
    try {
      if (this.mlgApiClient) {
        await this.mlgApiClient.recordVote({
          contentId,
          voteType,
          tokensBurned: cost,
          transactionHash,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.warn('Vote persistence failed:', error);
    }
  }

  /**
   * Setup WebSocket listeners for real-time vote updates
   */
  setupWebSocketListeners() {
    if (!this.websocketManager) return;
    
    this.websocketManager.on('vote-update', (data) => {
      // Update UI with real-time vote data
      this.handleRealTimeVoteUpdate(data);
    });
    
    this.websocketManager.on('vote-leaderboard-update', (data) => {
      // Update leaderboard displays
      this.updateLeaderboards(data);
    });
  }

  /**
   * Handle real-time vote updates from WebSocket
   */
  handleRealTimeVoteUpdate(voteData) {
    const { contentId, voteType, newCount } = voteData;
    
    // Update vote count displays
    const voteElements = document.querySelectorAll(`[data-content-id="${contentId}"]`);
    voteElements.forEach(element => {
      const countElement = element.querySelector('.vote-count');
      if (countElement) {
        countElement.textContent = newCount;
        countElement.classList.add('real-time-update');
        setTimeout(() => {
          countElement.classList.remove('real-time-update');
        }, 1000);
      }
    });
  }

  /**
   * Start background vote count updates
   */
  startVoteCountUpdates() {
    // Update visible vote counts every 10 seconds
    setInterval(() => {
      this.updateVisibleVoteCounts();
    }, VOTING_INTEGRATION_CONFIG.UPDATE_INTERVALS.BACKGROUND);
  }

  /**
   * Update visible vote counts
   */
  async updateVisibleVoteCounts() {
    const voteElements = document.querySelectorAll('[data-content-id]');
    const contentIds = new Set();
    
    voteElements.forEach(element => {
      const contentId = element.getAttribute('data-content-id');
      if (contentId) contentIds.add(contentId);
    });
    
    // Fetch vote counts from API
    for (const contentId of contentIds) {
      try {
        if (this.mlgApiClient) {
          const voteData = await this.mlgApiClient.getVoteCount(contentId);
          this.updateVoteDisplays(contentId, voteData);
        }
      } catch (error) {
        console.warn(`Failed to update vote count for ${contentId}:`, error);
      }
    }
  }
  
  /**
   * Update vote displays with new data
   */
  updateVoteDisplays(contentId, voteData) {
    if (!voteData || !voteData.success) return;
    
    const voteElements = document.querySelectorAll(
      `[data-content-id="${contentId}"] .vote-count, 
       [data-id="${contentId}"] .vote-count,
       .vote-count[data-content-id="${contentId}"]`
    );
    
    voteElements.forEach(element => {
      const newCount = voteData.count || voteData.votes || 0;
      element.textContent = newCount.toLocaleString();
      
      // Add subtle update animation
      element.classList.add('real-time-update');
      setTimeout(() => {
        element.classList.remove('real-time-update');
      }, 1000);
    });
  }

  /**
   * Handle buy votes functionality
   */
  handleBuyVotes() {
    this.showNotification('💰 MLG token purchasing coming soon!', 'info');
    // TODO: Implement token purchase flow
  }

  /**
   * Play vote sound effect
   */
  playVoteSound(type) {
    try {
      if (window.MLGAudioManager) {
        window.MLGAudioManager.playVoteSound(type);
      }
    } catch (error) {
      // Sound is optional
    }
  }

  /**
   * Show notification using platform notification system
   */
  showNotification(message, type = 'info') {
    // Try multiple notification systems in order of preference
    if (this.notificationSystem && this.notificationSystem.showNotification) {
      this.notificationSystem.showNotification(message, type, {
        duration: VOTING_INTEGRATION_CONFIG.NOTIFICATIONS[type.toUpperCase() + '_DURATION'] || 4000
      });
    } else if (window.MLGErrorHandler && window.MLGErrorHandler.createNotification) {
      window.MLGErrorHandler.createNotification({
        type: type,
        title: type === 'success' ? '🎉 Vote Success' : type === 'error' ? '❌ Vote Error' : '📢 Vote Info',
        message: message,
        icon: type === 'success' ? '🔥' : type === 'error' ? '⚠️' : '🗳️',
        duration: VOTING_INTEGRATION_CONFIG.NOTIFICATIONS[type.toUpperCase() + '_DURATION'] || 4000
      });
    } else if (window.votingPlatform && window.votingPlatform.showNotification) {
      window.votingPlatform.showNotification(message, type);
    } else {
      // Fallback to console log
      console.log(`📢 ${type.toUpperCase()}: ${message}`);
      
      // Create simple fallback notification
      const notification = document.createElement('div');
      notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium z-50 transition-transform transform translate-x-full ${
        type === 'success' ? 'bg-green-600' :
        type === 'error' ? 'bg-red-600' :
        type === 'warning' ? 'bg-yellow-600' : 'bg-blue-600'
      }`;
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.classList.remove('translate-x-full');
      }, 100);
      
      setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }, 4000);
    }
  }

  /**
   * Get voting statistics for user
   */
  async getVotingStats() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      const allocation = await this.votingSystem.getDailyVoteAllocation();
      const walletInfo = this.walletManager.getConnectionInfo();
      
      return {
        freeVotesRemaining: allocation.freeVotesRemaining,
        tokensAvailable: walletInfo.balance?.mlg || 0,
        votesThisSession: this.activeVotes.size,
        connected: walletInfo.connected
      };
      
    } catch (error) {
      console.error('Failed to get voting stats:', error);
      return null;
    }
  }

  /**
   * Cleanup voting integration
   */
  destroy() {
    // Clear intervals
    this.updateIntervals.forEach(interval => clearInterval(interval));
    this.updateIntervals.clear();
    
    // Remove event listeners
    this.eventListeners.forEach((listener, element) => {
      element.removeEventListener('click', listener);
    });
    this.eventListeners.clear();
    
    // Clear caches
    this.voteCache.clear();
    this.activeVotes.clear();
    
    console.log('🧹 MLG Voting Integration cleaned up');
  }
}

/**
 * Global voting integration instance
 */
let votingIntegrationInstance = null;

/**
 * Get or create voting integration instance
 */
export function getVotingIntegration() {
  if (!votingIntegrationInstance) {
    votingIntegrationInstance = new MLGVotingIntegration();
  }
  return votingIntegrationInstance;
}

/**
 * Initialize voting integration (call once at app startup)
 */
export async function initializeVotingIntegration() {
  try {
    const integration = getVotingIntegration();
    await integration.initialize();
    
    // Make available globally
    window.MLGVotingIntegration = integration;
    
    console.log('✅ MLG Voting Integration ready globally');
    return integration;
    
  } catch (error) {
    console.error('❌ Failed to initialize voting integration:', error);
    throw error;
  }
}

// CSS Styles for voting integration
const votingCSS = `
  .voting-in-progress {
    opacity: 0.7;
    pointer-events: none;
  }
  
  .vote-success {
    background: linear-gradient(45deg, #10b981, #34d399) !important;
    transform: scale(1.05);
    transition: all 0.3s ease;
  }
  
  .vote-error {
    background: linear-gradient(45deg, #ef4444, #f87171) !important;
    opacity: 0.8;
  }
  
  .burn-animation {
    animation: burnVote 0.6s ease-in-out;
  }
  
  @keyframes burnVote {
    0% { transform: scale(1); }
    25% { transform: scale(1.1); }
    50% { transform: scale(1.05) rotate(2deg); }
    75% { transform: scale(1.08) rotate(-1deg); }
    100% { transform: scale(1); }
  }
  
  .count-updating {
    animation: countUpdate 0.4s ease-in-out;
  }
  
  @keyframes countUpdate {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); color: #10b981; }
    100% { transform: scale(1); }
  }
  
  .real-time-update {
    animation: realTimeUpdate 1s ease-in-out;
  }
  
  @keyframes realTimeUpdate {
    0% { background: transparent; }
    50% { background: rgba(16, 185, 129, 0.2); }
    100% { background: transparent; }
  }
  
  .loading-spinner.gaming-pulse {
    width: 16px;
    height: 16px;
    border: 2px solid #10b981;
    border-top: 2px solid transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite, pulse 1.5s ease-in-out infinite alternate;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inject CSS styles
const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = votingCSS;
document.head.appendChild(styleSheet);

export default MLGVotingIntegration;