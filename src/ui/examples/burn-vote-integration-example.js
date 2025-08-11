/**
 * Burn Vote Confirmation Integration Example
 * 
 * Comprehensive example showing how to integrate the burn vote confirmation system
 * with the existing MLG.clan voting infrastructure, wallet management, and token systems.
 * 
 * This example demonstrates:
 * - Integration with Solana voting system
 * - Wallet connectivity and balance checking
 * - Real transaction simulation and execution
 * - Error handling and recovery flows
 * - Analytics event tracking
 * - Mobile-responsive implementation
 */

import { BurnVoteConfirmationSystem, BurnVoteError } from '../components/burn-vote-confirmation-ui.js';
import { SolanaVotingSystem } from '../../voting/solana-voting-system.js';
import { MLGTokenManager } from '../../tokens/spl-mlg-token.js';
import { PhantomWalletManager } from '../../wallet/phantom-wallet.js';

/**
 * MLG Burn Vote Integration Manager
 * Orchestrates all components for seamless burn vote functionality
 */
export class BurnVoteIntegrationManager {
  constructor(options = {}) {
    // Core systems
    this.votingSystem = null;
    this.tokenManager = null;
    this.walletManager = null;
    this.confirmationSystem = null;
    
    // Configuration
    this.config = {
      mlgTokenAddress: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL',
      networkEndpoint: options.networkEndpoint || 'https://api.mainnet-beta.solana.com',
      enableAnalytics: options.enableAnalytics !== false,
      debugMode: options.debugMode || false,
      autoRetryFailedTransactions: options.autoRetryFailedTransactions !== false,
      maxRetryAttempts: options.maxRetryAttempts || 3,
      ...options.config
    };
    
    // State management
    this.state = {
      initialized: false,
      walletConnected: false,
      userBalance: 0,
      networkStatus: 'connecting',
      activeConfirmations: new Map(),
      analytics: {
        confirmationsShown: 0,
        confirmationsCompleted: 0,
        confirmationsCancelled: 0,
        averageConfirmationTime: 0
      }
    };
    
    // Event callbacks
    this.eventCallbacks = {
      onWalletConnected: options.onWalletConnected || null,
      onWalletDisconnected: options.onWalletDisconnected || null,
      onBalanceUpdated: options.onBalanceUpdated || null,
      onVoteConfirmed: options.onVoteConfirmed || null,
      onVoteCancelled: options.onVoteCancelled || null,
      onError: options.onError || null,
      onNetworkStatusChanged: options.onNetworkStatusChanged || null
    };
    
    this.log('Integration manager initialized');
  }

  /**
   * Initialize all systems and establish connections
   */
  async initialize() {
    try {
      this.log('Initializing burn vote integration...');
      
      // Initialize wallet manager
      this.walletManager = new PhantomWalletManager({
        onConnect: (wallet) => this.handleWalletConnect(wallet),
        onDisconnect: () => this.handleWalletDisconnect(),
        onAccountChange: (account) => this.handleAccountChange(account)
      });

      // Initialize token manager
      this.tokenManager = new MLGTokenManager({
        tokenAddress: this.config.mlgTokenAddress,
        networkEndpoint: this.config.networkEndpoint
      });

      // Initialize voting system
      this.votingSystem = new SolanaVotingSystem({
        networkEndpoint: this.config.networkEndpoint,
        walletManager: this.walletManager,
        tokenManager: this.tokenManager
      });

      // Initialize confirmation system
      this.confirmationSystem = new BurnVoteConfirmationSystem({
        votingSystem: this.votingSystem,
        wallet: this.walletManager,
        onConfirm: (result) => this.handleVoteConfirmation(result),
        onCancel: () => this.handleVoteCancellation(),
        onError: (error) => this.handleConfirmationError(error)
      });

      // Attempt to connect to existing wallet session
      await this.walletManager.initialize();
      
      // Update network status
      await this.updateNetworkStatus();
      
      this.state.initialized = true;
      this.log('Integration initialization complete');
      
      return {
        success: true,
        message: 'Burn vote integration initialized successfully'
      };

    } catch (error) {
      this.logError('Integration initialization failed:', error);
      throw new Error(`Failed to initialize burn vote integration: ${error.message}`);
    }
  }

  /**
   * Show burn vote confirmation for specific content
   */
  async showBurnVoteConfirmation(contentId, contentData, voteOptions = {}) {
    try {
      // Validate prerequisites
      this.validatePrerequisites();
      
      // Track analytics
      this.trackAnalyticsEvent('burn_confirmation_shown', {
        contentId,
        mlgCost: voteOptions.mlgCost,
        userBalance: this.state.userBalance
      });
      
      // Get current user balance
      const currentBalance = await this.getCurrentMLGBalance();
      
      // Prepare confirmation options
      const confirmationOptions = {
        mlgCost: voteOptions.mlgCost || this.calculateMLGCost(voteOptions),
        voteWeight: this.calculateVoteWeight(voteOptions),
        userBalance: currentBalance,
        burnVotesUsed: await this.getBurnVotesUsed(),
        contentTitle: contentData.title || 'Untitled Content',
        contentType: contentData.type || 'clip',
        contentDescription: contentData.description,
        contentCreator: contentData.creator,
        onConfirm: (result) => this.processVoteConfirmation(contentId, result),
        onCancel: () => this.processVoteCancellation(contentId)
      };
      
      // Show confirmation dialog
      const confirmationStartTime = Date.now();
      this.state.activeConfirmations.set(contentId, {
        startTime: confirmationStartTime,
        options: confirmationOptions
      });
      
      await this.confirmationSystem.showBurnVoteConfirmation(contentId, confirmationOptions);
      
      this.state.analytics.confirmationsShown++;
      this.log(`Burn vote confirmation shown for ${contentId}`);
      
      return {
        success: true,
        message: 'Confirmation dialog displayed',
        confirmationId: contentId
      };

    } catch (error) {
      this.logError('Failed to show burn vote confirmation:', error);
      this.trackAnalyticsEvent('burn_confirmation_error', {
        contentId,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Process successful vote confirmation
   */
  async processVoteConfirmation(contentId, result) {
    try {
      const confirmationData = this.state.activeConfirmations.get(contentId);
      if (!confirmationData) {
        throw new Error('Confirmation data not found');
      }

      // Calculate confirmation time
      const confirmationTime = Date.now() - confirmationData.startTime;
      this.updateAnalytics('confirmationCompleted', confirmationTime);

      // Execute the actual burn vote transaction
      const transactionResult = await this.executeBurnVoteTransaction(contentId, result);
      
      // Update local state
      await this.updateUserBalance();
      await this.updateBurnVotesUsed();
      
      // Track analytics
      this.trackAnalyticsEvent('burn_vote_completed', {
        contentId,
        mlgBurned: result.mlgBurned,
        voteWeight: result.voteWeight,
        transactionId: transactionResult.signature,
        confirmationTime
      });
      
      // Notify callbacks
      if (this.eventCallbacks.onVoteConfirmed) {
        this.eventCallbacks.onVoteConfirmed({
          contentId,
          result,
          transactionResult,
          confirmationTime
        });
      }
      
      // Clean up
      this.state.activeConfirmations.delete(contentId);
      
      this.log(`Burn vote confirmed for ${contentId}: ${result.mlgBurned} MLG burned`);
      
      return transactionResult;

    } catch (error) {
      this.logError('Vote confirmation processing failed:', error);
      this.handleConfirmationError(error);
      throw error;
    }
  }

  /**
   * Process vote cancellation
   */
  processVoteCancellation(contentId) {
    const confirmationData = this.state.activeConfirmations.get(contentId);
    if (confirmationData) {
      const confirmationTime = Date.now() - confirmationData.startTime;
      this.updateAnalytics('confirmationCancelled', confirmationTime);
    }

    // Track analytics
    this.trackAnalyticsEvent('burn_vote_cancelled', {
      contentId,
      timeToCancel: confirmationData ? Date.now() - confirmationData.startTime : 0
    });

    // Notify callbacks
    if (this.eventCallbacks.onVoteCancelled) {
      this.eventCallbacks.onVoteCancelled({ contentId });
    }

    // Clean up
    this.state.activeConfirmations.delete(contentId);
    
    this.log(`Burn vote cancelled for ${contentId}`);
  }

  /**
   * Execute the actual burn vote transaction on Solana
   */
  async executeBurnVoteTransaction(contentId, confirmationResult) {
    try {
      this.log('Executing burn vote transaction...');
      
      // Prepare transaction parameters
      const transactionParams = {
        contentId,
        mlgAmount: confirmationResult.mlgBurned,
        voteWeight: confirmationResult.voteWeight,
        voterPublicKey: this.walletManager.getPublicKey(),
        timestamp: Date.now()
      };
      
      // Create and sign transaction
      const transaction = await this.votingSystem.createBurnVoteTransaction(transactionParams);
      const signedTransaction = await this.walletManager.signTransaction(transaction);
      
      // Send transaction to network
      const signature = await this.votingSystem.sendTransaction(signedTransaction);
      
      // Confirm transaction
      const confirmation = await this.votingSystem.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.err) {
        throw new Error(`Transaction failed: ${confirmation.err}`);
      }
      
      this.log(`Burn vote transaction confirmed: ${signature}`);
      
      return {
        signature,
        confirmationStatus: 'confirmed',
        mlgBurned: confirmationResult.mlgBurned,
        voteWeight: confirmationResult.voteWeight,
        blockTime: confirmation.blockTime,
        slot: confirmation.slot
      };

    } catch (error) {
      this.logError('Burn vote transaction failed:', error);
      
      // Attempt retry if configured
      if (this.config.autoRetryFailedTransactions) {
        return this.retryBurnVoteTransaction(contentId, confirmationResult, error);
      }
      
      throw error;
    }
  }

  /**
   * Retry failed burn vote transaction
   */
  async retryBurnVoteTransaction(contentId, confirmationResult, originalError, attempt = 1) {
    if (attempt > this.config.maxRetryAttempts) {
      throw new Error(`Transaction failed after ${this.config.maxRetryAttempts} attempts: ${originalError.message}`);
    }

    try {
      this.log(`Retrying burn vote transaction (attempt ${attempt}/${this.config.maxRetryAttempts})...`);
      
      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry transaction
      return await this.executeBurnVoteTransaction(contentId, confirmationResult);

    } catch (error) {
      this.logError(`Retry attempt ${attempt} failed:`, error);
      return this.retryBurnVoteTransaction(contentId, confirmationResult, error, attempt + 1);
    }
  }

  /**
   * Handle wallet connection
   */
  async handleWalletConnect(wallet) {
    try {
      this.state.walletConnected = true;
      this.log('Wallet connected:', wallet.publicKey.toString());
      
      // Update user balance
      await this.updateUserBalance();
      
      // Notify callback
      if (this.eventCallbacks.onWalletConnected) {
        this.eventCallbacks.onWalletConnected(wallet);
      }
      
      this.trackAnalyticsEvent('wallet_connected', {
        publicKey: wallet.publicKey.toString()
      });

    } catch (error) {
      this.logError('Wallet connection handling failed:', error);
    }
  }

  /**
   * Handle wallet disconnection
   */
  handleWalletDisconnect() {
    this.state.walletConnected = false;
    this.state.userBalance = 0;
    
    // Cancel any active confirmations
    this.state.activeConfirmations.forEach((_, contentId) => {
      this.confirmationSystem.hideBurnVoteModal(contentId);
    });
    this.state.activeConfirmations.clear();
    
    this.log('Wallet disconnected');
    
    // Notify callback
    if (this.eventCallbacks.onWalletDisconnected) {
      this.eventCallbacks.onWalletDisconnected();
    }
    
    this.trackAnalyticsEvent('wallet_disconnected');
  }

  /**
   * Handle account change
   */
  async handleAccountChange(newAccount) {
    this.log('Account changed:', newAccount);
    await this.updateUserBalance();
    
    this.trackAnalyticsEvent('account_changed', {
      newAccount: newAccount.toString()
    });
  }

  /**
   * Handle confirmation errors
   */
  handleConfirmationError(error) {
    this.logError('Confirmation error:', error);
    
    // Notify callback
    if (this.eventCallbacks.onError) {
      this.eventCallbacks.onError(error);
    }
    
    this.trackAnalyticsEvent('confirmation_error', {
      errorType: error.type || 'unknown',
      errorMessage: error.message
    });
  }

  /**
   * Get current MLG token balance
   */
  async getCurrentMLGBalance() {
    try {
      if (!this.state.walletConnected) {
        return 0;
      }
      
      const balance = await this.tokenManager.getBalance(this.walletManager.getPublicKey());
      return balance;

    } catch (error) {
      this.logError('Failed to get MLG balance:', error);
      return 0;
    }
  }

  /**
   * Update user balance from blockchain
   */
  async updateUserBalance() {
    try {
      const newBalance = await this.getCurrentMLGBalance();
      const previousBalance = this.state.userBalance;
      
      this.state.userBalance = newBalance;
      
      if (newBalance !== previousBalance) {
        this.log(`MLG balance updated: ${previousBalance} → ${newBalance}`);
        
        if (this.eventCallbacks.onBalanceUpdated) {
          this.eventCallbacks.onBalanceUpdated({
            previousBalance,
            newBalance,
            difference: newBalance - previousBalance
          });
        }
      }

    } catch (error) {
      this.logError('Failed to update user balance:', error);
    }
  }

  /**
   * Get number of burn votes used today
   */
  async getBurnVotesUsed() {
    try {
      if (!this.state.walletConnected) {
        return 0;
      }
      
      return await this.votingSystem.getBurnVotesUsed(this.walletManager.getPublicKey());

    } catch (error) {
      this.logError('Failed to get burn votes used:', error);
      return 0;
    }
  }

  /**
   * Update burn votes used count
   */
  async updateBurnVotesUsed() {
    try {
      // This would typically refresh from the blockchain
      // For now, we'll increment locally
      const currentUsed = await this.getBurnVotesUsed();
      this.log(`Burn votes used: ${currentUsed}`);

    } catch (error) {
      this.logError('Failed to update burn votes used:', error);
    }
  }

  /**
   * Calculate MLG cost for a vote based on current state
   */
  calculateMLGCost(voteOptions) {
    const burnVotesUsed = voteOptions.burnVotesUsed || 0;
    const progressivePricing = [1, 2, 3, 4]; // 1st, 2nd, 3rd, 4th burn vote
    
    return progressivePricing[burnVotesUsed] || progressivePricing[progressivePricing.length - 1];
  }

  /**
   * Calculate vote weight based on MLG cost and user reputation
   */
  calculateVoteWeight(voteOptions) {
    const baseCost = voteOptions.mlgCost || 1;
    const reputationMultiplier = voteOptions.reputationMultiplier || 1;
    
    return baseCost * reputationMultiplier;
  }

  /**
   * Update network status
   */
  async updateNetworkStatus() {
    try {
      const status = await this.votingSystem.getNetworkStatus();
      const previousStatus = this.state.networkStatus;
      
      this.state.networkStatus = status;
      
      if (status !== previousStatus) {
        this.log(`Network status changed: ${previousStatus} → ${status}`);
        
        if (this.eventCallbacks.onNetworkStatusChanged) {
          this.eventCallbacks.onNetworkStatusChanged({ previousStatus, status });
        }
      }

    } catch (error) {
      this.logError('Failed to update network status:', error);
      this.state.networkStatus = 'error';
    }
  }

  /**
   * Validate prerequisites for burn vote
   */
  validatePrerequisites() {
    if (!this.state.initialized) {
      throw new Error('Integration not initialized');
    }
    
    if (!this.state.walletConnected) {
      throw new BurnVoteConfirmationError(
        BurnVoteError.WALLET_NOT_CONNECTED,
        'Wallet not connected'
      );
    }
    
    if (this.state.networkStatus === 'error') {
      throw new BurnVoteConfirmationError(
        BurnVoteError.NETWORK_ERROR,
        'Network connection error'
      );
    }
  }

  /**
   * Track analytics event
   */
  trackAnalyticsEvent(eventName, eventData = {}) {
    if (!this.config.enableAnalytics) {
      return;
    }

    try {
      // In a real implementation, this would send to your analytics service
      const analyticsData = {
        timestamp: Date.now(),
        event: eventName,
        data: {
          ...eventData,
          sessionId: this.getSessionId(),
          userAgent: navigator.userAgent,
          walletConnected: this.state.walletConnected,
          networkStatus: this.state.networkStatus
        }
      };
      
      this.log('Analytics event:', analyticsData);
      
      // Example: Send to analytics service
      // analytics.track(eventName, analyticsData);

    } catch (error) {
      this.logError('Analytics tracking failed:', error);
    }
  }

  /**
   * Update analytics metrics
   */
  updateAnalytics(metric, value) {
    switch (metric) {
      case 'confirmationCompleted':
        this.state.analytics.confirmationsCompleted++;
        this.updateAverageConfirmationTime(value);
        break;
      case 'confirmationCancelled':
        this.state.analytics.confirmationsCancelled++;
        break;
    }
  }

  /**
   * Update average confirmation time
   */
  updateAverageConfirmationTime(newTime) {
    const { confirmationsCompleted, averageConfirmationTime } = this.state.analytics;
    const totalTime = averageConfirmationTime * (confirmationsCompleted - 1) + newTime;
    this.state.analytics.averageConfirmationTime = totalTime / confirmationsCompleted;
  }

  /**
   * Get session ID for analytics
   */
  getSessionId() {
    if (!this.sessionId) {
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.sessionId;
  }

  /**
   * Get integration status and metrics
   */
  getStatus() {
    return {
      initialized: this.state.initialized,
      walletConnected: this.state.walletConnected,
      userBalance: this.state.userBalance,
      networkStatus: this.state.networkStatus,
      activeConfirmations: this.state.activeConfirmations.size,
      analytics: { ...this.state.analytics }
    };
  }

  /**
   * Cleanup and destroy integration
   */
  async destroy() {
    try {
      this.log('Destroying burn vote integration...');
      
      // Cancel active confirmations
      this.state.activeConfirmations.forEach((_, contentId) => {
        this.confirmationSystem.hideBurnVoteModal(contentId);
      });
      this.state.activeConfirmations.clear();
      
      // Destroy systems
      if (this.confirmationSystem) {
        this.confirmationSystem.destroy();
      }
      
      if (this.walletManager) {
        await this.walletManager.disconnect();
      }
      
      // Reset state
      this.state = {
        initialized: false,
        walletConnected: false,
        userBalance: 0,
        networkStatus: 'disconnected',
        activeConfirmations: new Map(),
        analytics: {
          confirmationsShown: 0,
          confirmationsCompleted: 0,
          confirmationsCancelled: 0,
          averageConfirmationTime: 0
        }
      };
      
      this.log('Integration destroyed');

    } catch (error) {
      this.logError('Error during integration destruction:', error);
    }
  }

  /**
   * Logging utility
   */
  log(message, ...args) {
    if (this.config.debugMode) {
      console.log(`[BurnVoteIntegration] ${message}`, ...args);
    }
  }

  /**
   * Error logging utility
   */
  logError(message, error) {
    console.error(`[BurnVoteIntegration] ${message}`, error);
  }
}

/**
 * Factory function to create and initialize integration manager
 */
export async function createBurnVoteIntegration(options = {}) {
  const manager = new BurnVoteIntegrationManager(options);
  await manager.initialize();
  return manager;
}

/**
 * Example usage and testing
 */
export async function runIntegrationExample() {
  try {
    console.log('🔥 Running Burn Vote Integration Example');
    
    // Create integration manager
    const integration = await createBurnVoteIntegration({
      enableAnalytics: true,
      debugMode: true,
      onVoteConfirmed: (result) => {
        console.log('✅ Vote confirmed:', result);
      },
      onVoteCancelled: (result) => {
        console.log('❌ Vote cancelled:', result);
      },
      onError: (error) => {
        console.error('🔥 Error:', error);
      }
    });
    
    // Example content data
    const exampleContent = {
      id: 'clip_12345',
      title: 'Epic Gaming Moment',
      type: 'clip',
      description: 'Incredible clutch play that saved the match',
      creator: 'ProGamer123',
      duration: 30,
      views: 1250,
      currentVotes: 145
    };
    
    // Example vote options
    const voteOptions = {
      mlgCost: 2, // Will be calculated based on user's burn votes used
      reputationMultiplier: 1.2 // Based on user's reputation level
    };
    
    // Show burn vote confirmation
    await integration.showBurnVoteConfirmation(
      exampleContent.id,
      exampleContent,
      voteOptions
    );
    
    // Get status
    const status = integration.getStatus();
    console.log('📊 Integration Status:', status);
    
    return integration;

  } catch (error) {
    console.error('❌ Integration example failed:', error);
    throw error;
  }
}

// Export for use in other modules
export default BurnVoteIntegrationManager;