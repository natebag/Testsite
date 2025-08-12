/**
 * MLG.clan Consolidated Wallet Initialization
 * 
 * Unified wallet initialization and connection management
 * Consolidates duplicate wallet initialization code from all HTML pages
 * 
 * @version 1.0.0 - Consolidated Edition
 */

/**
 * Global wallet initialization system
 * Replaces inline wallet initialization code across all pages
 */
class MLGWalletInitializer {
  constructor() {
    this.initialized = false;
    this.walletManager = null;
    this.votingIntegration = null;
    this.initPromise = null;
  }

  /**
   * Initialize wallet system with comprehensive error handling
   */
  async initialize(options = {}) {
    // Prevent multiple simultaneous initializations
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInitialize(options);
    return this.initPromise;
  }

  async _doInitialize(options = {}) {
    if (this.initialized) {
      console.log('🎮 Wallet system already initialized');
      return this.walletManager;
    }

    try {
      console.log('🚀 Initializing MLG.clan wallet system...');

      // Import wallet modules dynamically
      const { getWalletManager, initializeWallet } = await import('../../../features/wallet/phantom-wallet.js');
      
      // Import voting integration if needed
      let getVotingIntegration, initializeVotingIntegration;
      if (options.enableVoting !== false) {
        try {
          const votingModule = await import('../../../features/voting/mlg-voting-integration.js');
          getVotingIntegration = votingModule.getVotingIntegration;
          initializeVotingIntegration = votingModule.initializeVotingIntegration;
        } catch (error) {
          console.warn('⚠️ Voting integration not available:', error.message);
        }
      }

      // Initialize wallet manager
      console.log('🔗 Setting up wallet manager...');
      const walletManager = getWalletManager();
      await walletManager.initializeConnection();
      
      this.walletManager = walletManager;
      
      // Set up global references
      window.phantomWalletManager = walletManager;
      window.initializeWallet = initializeWallet;
      window.walletSystemReady = true;
      
      // Initialize voting integration if available
      if (getVotingIntegration && initializeVotingIntegration) {
        console.log('🗳️ Setting up voting integration...');
        this.votingIntegration = await initializeVotingIntegration();
        window.MLGVotingIntegration = this.votingIntegration;
        window.getVotingIntegration = getVotingIntegration;
        window.initializeVotingIntegration = initializeVotingIntegration;
      }

      // Attempt auto-reconnection if session exists
      await this.handleAutoReconnection();

      this.initialized = true;
      console.log('✅ MLG.clan wallet system initialized successfully');
      
      return this.walletManager;

    } catch (error) {
      console.error('❌ Wallet system initialization failed:', error);
      
      // Create fallback manager for graceful degradation
      this.createFallbackManager();
      
      throw error;
    }
  }

  /**
   * Handle automatic reconnection for existing sessions
   */
  async handleAutoReconnection() {
    if (!this.walletManager) return;

    try {
      const hasSession = this.walletManager.hasStoredSession();
      if (hasSession) {
        console.log('🔄 Found existing wallet session, attempting auto-reconnect...');
        
        const reconnectResult = await this.walletManager.attemptAutoReconnect();
        if (reconnectResult) {
          console.log('✅ Wallet auto-reconnection successful');
          
          // Dispatch global wallet connected event
          window.dispatchEvent(new CustomEvent('wallet-reconnected', {
            detail: this.walletManager.getConnectionInfo()
          }));
        } else {
          console.log('ℹ️ Auto-reconnection not possible, manual connection required');
        }
      }
    } catch (error) {
      console.warn('⚠️ Auto-reconnection failed:', error);
      // Clear invalid session
      this.walletManager.clearStoredSession();
    }
  }

  /**
   * Create fallback manager for when initialization fails
   */
  createFallbackManager() {
    window.phantomWalletManager = {
      connect: async () => {
        throw new Error('Wallet system not properly initialized. Please refresh the page.');
      },
      disconnect: async () => {},
      getConnectionInfo: () => ({ connected: false }),
      hasStoredSession: () => false,
      clearStoredSession: () => {},
      attemptAutoReconnect: async () => false,
      initializeConnection: async () => {},
      on: () => {},
      off: () => {}
    };

    window.walletSystemReady = false;
    console.warn('⚠️ Fallback wallet manager created');
  }

  /**
   * Connect wallet with unified error handling
   */
  async connect(options = {}) {
    if (!this.walletManager) {
      throw new Error('Wallet system not initialized');
    }

    try {
      console.log('🔗 Connecting to Phantom wallet...');
      
      const connectionResult = await this.walletManager.connect({
        timeout: options.timeout || 30000,
        autoApprove: options.autoApprove || false
      });

      console.log('✅ Phantom wallet connection successful:', connectionResult);
      
      // Dispatch global wallet connected event
      window.dispatchEvent(new CustomEvent('wallet-connected', {
        detail: connectionResult
      }));

      return connectionResult;

    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      
      // Dispatch global wallet error event
      window.dispatchEvent(new CustomEvent('wallet-error', {
        detail: error
      }));

      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnect() {
    if (!this.walletManager) return;

    try {
      await this.walletManager.disconnect();
      
      // Dispatch global wallet disconnected event
      window.dispatchEvent(new CustomEvent('wallet-disconnected'));
      
    } catch (error) {
      console.error('❌ Wallet disconnection failed:', error);
      throw error;
    }
  }

  /**
   * Get current wallet connection info
   */
  getConnectionInfo() {
    if (!this.walletManager) {
      return { connected: false };
    }
    
    return this.walletManager.getConnectionInfo();
  }

  /**
   * Check if wallet is connected
   */
  isConnected() {
    const info = this.getConnectionInfo();
    return info.connected === true;
  }

  /**
   * Set up global event listeners for wallet state changes
   */
  setupGlobalEventListeners() {
    if (!this.walletManager) return;

    // Listen for wallet state changes
    this.walletManager.on('connected', (data) => {
      console.log('🎯 Wallet connected event:', data);
      window.dispatchEvent(new CustomEvent('wallet-state-change', {
        detail: { type: 'connected', data }
      }));
    });

    this.walletManager.on('disconnected', (data) => {
      console.log('🔌 Wallet disconnected event:', data);
      window.dispatchEvent(new CustomEvent('wallet-state-change', {
        detail: { type: 'disconnected', data }
      }));
    });

    this.walletManager.on('error', (error) => {
      console.error('❌ Wallet error event:', error);
      window.dispatchEvent(new CustomEvent('wallet-state-change', {
        detail: { type: 'error', data: error }
      }));
    });

    this.walletManager.on('reconnected', (data) => {
      console.log('🔄 Wallet reconnected event:', data);
      window.dispatchEvent(new CustomEvent('wallet-state-change', {
        detail: { type: 'reconnected', data }
      }));
    });
  }

  /**
   * Get voting integration instance
   */
  getVotingIntegration() {
    return this.votingIntegration;
  }

  /**
   * Check if system is ready
   */
  isReady() {
    return this.initialized && this.walletManager !== null;
  }
}

// Create global instance
const globalWalletInitializer = new MLGWalletInitializer();

// Global initialization function that replaces inline code
window.initializeMLGWallet = async function(options = {}) {
  try {
    const walletManager = await globalWalletInitializer.initialize(options);
    
    // Set up global event listeners
    globalWalletInitializer.setupGlobalEventListeners();
    
    console.log('🎮 MLG.clan wallet system ready for use');
    return walletManager;
    
  } catch (error) {
    console.error('❌ Failed to initialize MLG wallet system:', error);
    throw error;
  }
};

// Export convenience functions
window.connectMLGWallet = (options) => globalWalletInitializer.connect(options);
window.disconnectMLGWallet = () => globalWalletInitializer.disconnect();
window.getMLGWalletInfo = () => globalWalletInitializer.getConnectionInfo();
window.isMLGWalletConnected = () => globalWalletInitializer.isConnected();
window.getMLGVotingIntegration = () => globalWalletInitializer.getVotingIntegration();

// Auto-initialize on DOM ready if auto-init is enabled
document.addEventListener('DOMContentLoaded', async () => {
  const autoInit = document.querySelector('meta[name="mlg-wallet-auto-init"]');
  if (autoInit && autoInit.content !== 'false') {
    try {
      await window.initializeMLGWallet();
    } catch (error) {
      console.warn('⚠️ Auto-initialization failed:', error);
    }
  }
});

// Export for ES6 modules
export { 
  MLGWalletInitializer,
  globalWalletInitializer
};

export default globalWalletInitializer;

console.log('🎮 MLG.clan Consolidated Wallet Initializer loaded');