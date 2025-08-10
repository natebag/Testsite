/**
 * Phantom Wallet + MLG Token Real-Time Balance Integration Example
 * 
 * This example demonstrates how to integrate the PhantomWalletManager
 * with the real-time MLG token balance system for a complete Web3 experience.
 */

import { PhantomWalletManager } from '../wallet/phantom-wallet.js';
import { 
  mlgTokenManager, 
  initializeMLGTokenManager,
  BALANCE_EVENTS,
  BALANCE_CONFIG 
} from './spl-mlg-token.js';

/**
 * Complete Wallet + Token Integration Class
 */
export class MLGWalletIntegration {
  constructor() {
    this.walletManager = new PhantomWalletManager();
    this.tokenManager = mlgTokenManager;
    this.isInitialized = false;
    this.currentWallet = null;
    this.balanceListeners = new Map();
    
    // Bind methods
    this.handleWalletConnect = this.handleWalletConnect.bind(this);
    this.handleWalletDisconnect = this.handleWalletDisconnect.bind(this);
    this.handleBalanceUpdate = this.handleBalanceUpdate.bind(this);
  }

  /**
   * Initialize the complete integration system
   */
  async initialize() {
    try {
      console.log('🚀 Initializing MLG Wallet Integration...');
      
      // Initialize token manager first
      const tokenResult = await initializeMLGTokenManager();
      if (!tokenResult.success) {
        throw new Error('Failed to initialize token manager: ' + tokenResult.error);
      }
      
      console.log('✅ MLG Token Manager initialized');
      console.log('Token Info:', tokenResult.tokenInfo);
      
      // Set up wallet event listeners
      this.walletManager.addEventListener('connect', this.handleWalletConnect);
      this.walletManager.addEventListener('disconnect', this.handleWalletDisconnect);
      this.walletManager.addEventListener('accountChanged', this.handleAccountChange.bind(this));
      
      // Set up balance event listeners
      this.setupBalanceEventListeners();
      
      this.isInitialized = true;
      console.log('✅ MLG Wallet Integration ready');
      
      return true;
    } catch (error) {
      console.error('❌ Integration initialization failed:', error);
      return false;
    }
  }

  /**
   * Connect wallet with real-time balance monitoring
   */
  async connectWallet() {
    try {
      if (!this.isInitialized) {
        throw new Error('Integration not initialized. Call initialize() first.');
      }

      console.log('🔗 Connecting wallet...');
      
      // Connect to Phantom wallet
      const connection = await this.walletManager.connect();
      if (!connection.success) {
        throw new Error('Wallet connection failed: ' + connection.error);
      }
      
      this.currentWallet = connection.publicKey;
      console.log(`✅ Wallet connected: ${this.currentWallet}`);
      
      return {
        success: true,
        walletAddress: this.currentWallet,
        balance: connection.balance
      };
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle wallet connection event
   */
  async handleWalletConnect(event) {
    try {
      const walletAddress = event.detail.publicKey;
      console.log(`🎯 Wallet connected: ${walletAddress}`);
      
      // Initialize token account monitoring
      const tokenResult = await this.tokenManager.handleWalletConnection(
        walletAddress, 
        this.walletManager.adapter
      );
      
      console.log(`💰 Initial MLG balance: ${tokenResult.balance} MLG`);
      console.log(`🏦 Token account exists: ${tokenResult.hasAccount}`);
      
      // Start real-time balance monitoring
      await this.startBalanceMonitoring(walletAddress);
      
      // If no token account exists, offer to create one
      if (!tokenResult.hasAccount) {
        await this.handleMissingTokenAccount(walletAddress);
      }
      
    } catch (error) {
      console.error('❌ Error handling wallet connection:', error);
    }
  }

  /**
   * Handle wallet disconnection event
   */
  async handleWalletDisconnect(event) {
    try {
      const walletAddress = event.detail?.publicKey || this.currentWallet;
      console.log(`🔌 Wallet disconnected: ${walletAddress}`);
      
      // Stop balance monitoring
      if (walletAddress) {
        await this.stopBalanceMonitoring(walletAddress);
        await this.tokenManager.handleWalletDisconnection(walletAddress);
      }
      
      this.currentWallet = null;
      console.log('✅ Cleanup completed');
      
    } catch (error) {
      console.error('❌ Error handling wallet disconnection:', error);
    }
  }

  /**
   * Handle account change (user switches accounts in wallet)
   */
  async handleAccountChange(event) {
    try {
      const newWalletAddress = event.detail.publicKey;
      const oldWalletAddress = this.currentWallet;
      
      console.log(`🔄 Account changed: ${oldWalletAddress} -> ${newWalletAddress}`);
      
      // Stop monitoring old account
      if (oldWalletAddress) {
        await this.stopBalanceMonitoring(oldWalletAddress);
        await this.tokenManager.handleWalletDisconnection(oldWalletAddress);
      }
      
      // Start monitoring new account
      this.currentWallet = newWalletAddress;
      await this.handleWalletConnect({ detail: { publicKey: newWalletAddress } });
      
    } catch (error) {
      console.error('❌ Error handling account change:', error);
    }
  }

  /**
   * Start real-time balance monitoring for a wallet
   */
  async startBalanceMonitoring(walletAddress) {
    try {
      console.log(`📊 Starting balance monitoring for ${walletAddress}`);
      
      // Start polling with optimized settings
      const pollingId = await this.tokenManager.startBalancePolling(walletAddress, {
        pollInterval: BALANCE_CONFIG.FAST_POLL_INTERVAL, // 2 seconds for active users
        autoCreateAccount: false, // Let user decide
        emitEvents: true
      });
      
      // Mark as active for faster polling
      this.tokenManager.setWalletActive(walletAddress);
      
      console.log(`✅ Balance monitoring started (ID: ${pollingId})`);
      return pollingId;
      
    } catch (error) {
      console.error('❌ Failed to start balance monitoring:', error);
      throw error;
    }
  }

  /**
   * Stop balance monitoring for a wallet
   */
  async stopBalanceMonitoring(walletAddress) {
    try {
      console.log(`⏹️ Stopping balance monitoring for ${walletAddress}`);
      
      const stopped = await this.tokenManager.stopBalancePolling(walletAddress);
      if (stopped) {
        console.log('✅ Balance monitoring stopped');
      }
      
      return stopped;
    } catch (error) {
      console.error('❌ Failed to stop balance monitoring:', error);
      return false;
    }
  }

  /**
   * Handle missing token account scenario
   */
  async handleMissingTokenAccount(walletAddress) {
    console.log('🏗️ No MLG token account found for this wallet');
    console.log('ℹ️  To receive MLG tokens, you need an Associated Token Account');
    
    try {
      // Estimate account creation cost
      const cost = await this.tokenManager.estimateTransactionCost('createAccount');
      console.log(`💸 Account creation cost: ${cost.sol} SOL (~$${(cost.sol * 100).toFixed(2)} USD estimate)`);
      
      // In a real application, you would show a UI prompt here
      console.log('📝 In a real app, show user prompt:');
      console.log('   "Create MLG Token Account?"');
      console.log('   - Required to receive MLG tokens');
      console.log(`   - One-time cost: ${cost.sol} SOL`);
      console.log('   - [Create Account] [Skip]');
      
      // For demo purposes, we'll simulate user approval
      const userApproved = await this.simulateUserApproval('create_token_account');
      
      if (userApproved) {
        await this.createTokenAccount(walletAddress);
      } else {
        console.log('ℹ️  User declined token account creation');
      }
      
    } catch (error) {
      console.error('❌ Error handling missing token account:', error);
    }
  }

  /**
   * Create associated token account for user
   */
  async createTokenAccount(walletAddress) {
    try {
      console.log('🏗️ Creating MLG token account...');
      
      const signature = await this.tokenManager.createAssociatedTokenAccountRealTime(
        walletAddress,
        this.walletManager.adapter,
        {
          startPollingAfterCreation: true,
          pollInterval: BALANCE_CONFIG.FAST_POLL_INTERVAL
        }
      );
      
      console.log('✅ Token account created!');
      console.log(`🧾 Transaction: ${signature}`);
      console.log('🎯 You can now receive MLG tokens');
      
      return signature;
    } catch (error) {
      console.error('❌ Token account creation failed:', error);
      console.log('💡 Possible reasons:');
      console.log('   - Insufficient SOL for transaction fee');
      console.log('   - User rejected transaction');
      console.log('   - Network connection issues');
      throw error;
    }
  }

  /**
   * Perform burn-to-vote transaction
   */
  async burnTokensForVotes(burnAmount, expectedVotes) {
    try {
      if (!this.currentWallet) {
        throw new Error('No wallet connected');
      }
      
      console.log(`🔥 Burning ${burnAmount} MLG tokens for ${expectedVotes} extra votes...`);
      
      // Get current balance
      const balance = await this.tokenManager.getTokenBalanceRealTime(this.currentWallet);
      console.log(`💰 Current balance: ${balance.balance} MLG`);
      
      // Validate burn transaction
      const validation = this.validateBurnTransaction(burnAmount, balance.balance);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      
      console.log(`✅ Validation passed - will get ${validation.votesToPurchase} votes`);
      
      // Execute burn
      const result = await this.tokenManager.burnTokens(
        this.currentWallet,
        this.walletManager.adapter,
        burnAmount
      );
      
      console.log('✅ Burn transaction successful!');
      console.log(`🧾 Transaction: ${result.signature}`);
      console.log(`🔥 Burned: ${result.burnedAmount} MLG`);
      console.log(`🗳️ Extra votes gained: ${validation.votesToPurchase}`);
      
      return result;
    } catch (error) {
      console.error('❌ Burn transaction failed:', error);
      throw error;
    }
  }

  /**
   * Set up balance event listeners
   */
  setupBalanceEventListeners() {
    // Balance update notifications
    this.tokenManager.onBalanceChange(BALANCE_EVENTS.BALANCE_UPDATED, this.handleBalanceUpdate);
    
    // Account creation notifications
    this.tokenManager.onBalanceChange(BALANCE_EVENTS.ACCOUNT_CREATED, (data) => {
      console.log(`🏦 Token account created for ${data.walletAddress}`);
      console.log(`🧾 Transaction: ${data.signature}`);
    });
    
    // Error notifications
    this.tokenManager.onBalanceChange(BALANCE_EVENTS.BALANCE_ERROR, (data) => {
      console.log(`⚠️ Balance polling error for ${data.walletAddress}: ${data.error}`);
      
      // In a real app, you might show a subtle notification to the user
      if (data.errorCount >= 3) {
        console.log('🔄 Consider refreshing the page if balance issues persist');
      }
    });
    
    // Polling status changes
    this.tokenManager.onBalanceChange(BALANCE_EVENTS.POLLING_STARTED, (data) => {
      console.log(`📊 Started real-time balance monitoring for ${data.walletAddress}`);
    });
    
    this.tokenManager.onBalanceChange(BALANCE_EVENTS.POLLING_STOPPED, (data) => {
      console.log(`⏹️ Stopped balance monitoring for ${data.walletAddress}`);
    });
  }

  /**
   * Handle balance update events
   */
  handleBalanceUpdate(data) {
    const { walletAddress, balance, previousBalance } = data;
    
    console.log(`💰 Balance updated for ${walletAddress}:`);
    console.log(`   Current: ${balance.balance} MLG`);
    
    if (previousBalance) {
      const change = balance.balance - previousBalance.balance;
      const changeStr = change > 0 ? `+${change}` : `${change}`;
      console.log(`   Change: ${changeStr} MLG`);
      
      // In a real app, you might show a toast notification
      if (change > 0) {
        console.log('🎉 MLG tokens received!');
      } else if (change < 0) {
        console.log('📤 MLG tokens sent/burned');
      }
    }
    
    // Update UI elements (in a real app)
    this.updateBalanceDisplay(walletAddress, balance);
  }

  /**
   * Update balance display (placeholder for UI integration)
   */
  updateBalanceDisplay(walletAddress, balance) {
    // In a real application, this would update DOM elements
    console.log(`🔄 UI Update: ${walletAddress} balance = ${balance.balance} MLG`);
    
    // Example of what this might look like:
    /*
    const balanceElement = document.querySelector('#mlg-balance');
    if (balanceElement) {
      balanceElement.textContent = `${balance.balance.toFixed(2)} MLG`;
      balanceElement.className = balance.hasAccount ? 'balance-active' : 'balance-inactive';
    }
    
    const statusElement = document.querySelector('#account-status');
    if (statusElement) {
      statusElement.textContent = balance.hasAccount ? 'Account Active' : 'No Token Account';
    }
    */
  }

  /**
   * Get current wallet status and balance
   */
  async getWalletStatus() {
    try {
      if (!this.currentWallet) {
        return { connected: false };
      }
      
      const walletStatus = this.walletManager.getConnectionStatus();
      const balance = await this.tokenManager.getTokenBalanceRealTime(this.currentWallet);
      const pollingStatus = this.tokenManager.getPollingStatus();
      
      return {
        connected: true,
        walletAddress: this.currentWallet,
        solBalance: walletStatus.balance,
        mlgBalance: balance.balance,
        hasTokenAccount: balance.hasAccount,
        isPolling: pollingStatus.pollingWallets.some(w => w.address === this.currentWallet),
        lastUpdate: balance.timestamp
      };
    } catch (error) {
      console.error('❌ Failed to get wallet status:', error);
      return { connected: false, error: error.message };
    }
  }

  /**
   * Disconnect wallet and cleanup
   */
  async disconnect() {
    try {
      console.log('🔌 Disconnecting wallet...');
      
      if (this.currentWallet) {
        await this.stopBalanceMonitoring(this.currentWallet);
      }
      
      const result = await this.walletManager.disconnect();
      this.currentWallet = null;
      
      console.log('✅ Wallet disconnected and cleaned up');
      return result;
    } catch (error) {
      console.error('❌ Error during disconnect:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate burn transaction parameters
   */
  validateBurnTransaction(burnAmount, currentBalance) {
    // Use the utility function from MLGTokenUtils
    const { MLGTokenUtils } = require('./spl-mlg-token.js');
    return MLGTokenUtils.validateBurnToVote(burnAmount, currentBalance, 0);
  }

  /**
   * Simulate user approval for demo purposes
   */
  async simulateUserApproval(action) {
    console.log(`🤔 Simulating user decision for: ${action}`);
    
    // In a real app, this would show a modal/dialog
    // For demo, we'll randomly approve/deny
    const approved = Math.random() > 0.3; // 70% approval rate
    
    console.log(`👤 User ${approved ? 'approved' : 'declined'} ${action}`);
    return approved;
  }

  /**
   * Get integration statistics
   */
  getStats() {
    const tokenStats = this.tokenManager.getPollingStatus();
    const walletStats = this.walletManager.getConnectionStatus();
    
    return {
      tokenManager: {
        activePolling: tokenStats.activePolling,
        totalWallets: tokenStats.totalWallets,
        cacheSize: tokenStats.cacheSize,
        eventListeners: tokenStats.eventListeners
      },
      walletManager: {
        isConnected: walletStats.isConnected,
        network: walletStats.network,
        balance: walletStats.balance
      },
      integration: {
        isInitialized: this.isInitialized,
        currentWallet: this.currentWallet,
        hasActiveMonitoring: this.currentWallet && tokenStats.pollingWallets.some(w => w.address === this.currentWallet)
      }
    };
  }
}

/**
 * Example usage demonstration
 */
export async function demonstrateIntegration() {
  console.log('🎮 MLG Wallet Integration Demonstration');
  console.log('=====================================\n');
  
  const integration = new MLGWalletIntegration();
  
  try {
    // Initialize the integration
    await integration.initialize();
    
    // Simulate wallet connection (in real app, user clicks connect button)
    console.log('\n👤 User clicks "Connect Wallet" button...');
    const connectionResult = await integration.connectWallet();
    
    if (connectionResult.success) {
      console.log(`✅ Connection successful!`);
      console.log(`💰 SOL Balance: ${connectionResult.balance} SOL`);
      
      // Wait for balance monitoring to start
      console.log('\n⏳ Waiting for real-time balance system to initialize...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Show current status
      const status = await integration.getWalletStatus();
      console.log('\n📊 Current Status:');
      console.log(`   Wallet: ${status.walletAddress}`);
      console.log(`   SOL Balance: ${status.solBalance} SOL`);
      console.log(`   MLG Balance: ${status.mlgBalance} MLG`);
      console.log(`   Token Account: ${status.hasTokenAccount ? 'Active' : 'Not Created'}`);
      console.log(`   Real-time Monitoring: ${status.isPolling ? 'Active' : 'Inactive'}`);
      
      // Simulate burn transaction (if user has tokens)
      if (status.mlgBalance > 0) {
        console.log('\n🔥 User wants to burn tokens for extra votes...');
        try {
          await integration.burnTokensForVotes(2, 2); // Burn 2 MLG for 2 extra votes
        } catch (error) {
          console.log('💡 Burn simulation completed (would require real tokens)');
        }
      }
      
      // Show final statistics
      console.log('\n📈 Integration Statistics:');
      const stats = integration.getStats();
      console.log(JSON.stringify(stats, null, 2));
      
      // Cleanup
      console.log('\n🧹 Cleaning up...');
      await integration.disconnect();
      
    } else {
      console.log('❌ Connection failed:', connectionResult.error);
    }
    
  } catch (error) {
    console.error('❌ Demonstration failed:', error);
  }
  
  console.log('\n✅ MLG Wallet Integration demonstration completed');
}

// Export for use in other modules
export { MLGWalletIntegration };

// Run demonstration if this file is executed directly
if (typeof window === 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  demonstrateIntegration().catch(console.error);
}