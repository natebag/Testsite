/**
 * Example Usage of Phantom Wallet Integration
 * 
 * This file demonstrates how to use the PhantomWalletManager
 * in the MLG.clan platform.
 */

import { getWalletManager, initializeWallet } from './phantom-wallet.js';

/**
 * Example implementation of wallet connection UI
 */
class WalletConnectionExample {
  constructor() {
    this.walletManager = getWalletManager();
    this.setupEventListeners();
    this.updateUI();
  }

  /**
   * Setup wallet event listeners
   */
  setupEventListeners() {
    this.walletManager.on('connecting', () => {
      this.showConnecting();
    });

    this.walletManager.on('connected', (connectionInfo) => {
      this.showConnected(connectionInfo);
    });

    this.walletManager.on('disconnected', () => {
      this.showDisconnected();
    });

    this.walletManager.on('error', (error) => {
      this.showError(error.message);
    });

    this.walletManager.on('accountChanged', (data) => {
      this.showAccountChanged(data);
    });
  }

  /**
   * Connect to Phantom wallet
   */
  async connectWallet() {
    try {
      // Check if Phantom is available
      const status = this.walletManager.getWalletStatus();
      
      if (!status.isAvailable) {
        this.showError('Phantom wallet is not installed. Please install it from phantom.app');
        return;
      }

      // Attempt connection
      const connectionInfo = await this.walletManager.connect({
        timeout: 15000 // 15 second timeout
      });

      console.log('Connected to wallet:', connectionInfo);

      // Fetch and display balance
      const balance = await this.walletManager.getBalance();
      this.displayBalance(balance);

    } catch (error) {
      console.error('Connection failed:', error);
      this.showError(error.message);
    }
  }

  /**
   * Disconnect from wallet
   */
  async disconnectWallet() {
    try {
      await this.walletManager.disconnect();
      console.log('Wallet disconnected');
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  }

  /**
   * Sign a message for authentication
   */
  async authenticateUser() {
    try {
      const timestamp = Date.now();
      const message = `MLG.clan authentication\\nTimestamp: ${timestamp}\\nWallet verification for secure access`;
      
      const signature = await this.walletManager.signMessage(message);
      
      console.log('Authentication signature:', signature);
      
      // Here you would typically send the signature to your backend
      // for verification and session creation
      
      return {
        message,
        signature: Array.from(signature),
        timestamp
      };

    } catch (error) {
      console.error('Authentication failed:', error);
      this.showError('Authentication failed: ' + error.message);
      return null;
    }
  }

  /**
   * Validate current connection
   */
  async validateConnection() {
    const isValid = await this.walletManager.validateConnection();
    
    if (!isValid) {
      this.showError('Wallet connection is no longer valid');
      this.updateUI();
    }
    
    return isValid;
  }

  // UI Update Methods

  /**
   * Update UI based on current wallet status
   */
  updateUI() {
    const status = this.walletManager.getWalletStatus();
    
    if (!status.isAvailable) {
      this.showInstallPrompt();
    } else if (status.isConnected) {
      this.showConnected(this.walletManager.getConnectionInfo());
    } else {
      this.showDisconnected();
    }
  }

  /**
   * Show wallet installation prompt
   */
  showInstallPrompt() {
    console.log('UI: Show install prompt');
    // Update your UI to show installation instructions
  }

  /**
   * Show connecting state
   */
  showConnecting() {
    console.log('UI: Show connecting state');
    // Update your UI to show connecting spinner
  }

  /**
   * Show connected state
   * @param {Object} connectionInfo - Connection information
   */
  showConnected(connectionInfo) {
    console.log('UI: Show connected state', connectionInfo);
    
    // Example UI updates:
    // - Show wallet address (short format)
    // - Enable wallet-dependent features
    // - Display user's SOL balance
    
    console.log(`Connected: ${connectionInfo.shortAddress}`);
    console.log(`Network: ${connectionInfo.network}`);
  }

  /**
   * Show disconnected state
   */
  showDisconnected() {
    console.log('UI: Show disconnected state');
    
    // Example UI updates:
    // - Show connect button
    // - Disable wallet-dependent features
    // - Clear user data
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    console.error('UI Error:', message);
    
    // Example UI updates:
    // - Show error notification
    // - Provide retry options
    // - Show help links
  }

  /**
   * Show account changed notification
   * @param {Object} data - Account change data
   */
  showAccountChanged(data) {
    console.log('UI: Account changed', data);
    
    // Example UI updates:
    // - Show security notification
    // - Force re-authentication
    // - Clear sensitive data
  }

  /**
   * Display wallet balance
   * @param {number} balance - Balance in SOL
   */
  displayBalance(balance) {
    console.log(`Wallet Balance: ${balance.toFixed(4)} SOL`);
    
    // Update your UI to show the balance
  }
}

/**
 * Integration with existing MLG.clan HTML
 * This shows how to integrate with the existing platform
 */
export function integrateWithMLGPlatform() {
  // Initialize wallet manager
  const walletManager = initializeWallet();
  
  // Replace the mock connectWallet function in mlg-clan-complete.html
  window.connectWallet = async function() {
    try {
      const connectionInfo = await walletManager.connect();
      
      // Update existing UI elements
      const connectBtn = document.getElementById('connect-btn');
      const headerWallet = document.getElementById('header-wallet');
      
      if (connectBtn && connectionInfo) {
        connectBtn.textContent = connectionInfo.shortAddress;
        connectBtn.onclick = () => disconnectWallet();
      }
      
      if (headerWallet) {
        headerWallet.textContent = connectionInfo.shortAddress;
      }
      
      // Update global variables to maintain compatibility
      window.currentWallet = connectionInfo.address;
      
      // Trigger existing platform logic
      if (window.updateUI) {
        window.updateUI();
      }
      
    } catch (error) {
      alert(error.message);
    }
  };

  // Replace the mock disconnectWallet function
  window.disconnectWallet = async function() {
    try {
      await walletManager.disconnect();
      
      // Update UI
      const connectBtn = document.getElementById('connect-btn');
      const headerWallet = document.getElementById('header-wallet');
      
      if (connectBtn) {
        connectBtn.textContent = 'Connect Wallet';
        connectBtn.onclick = () => connectWallet();
      }
      
      if (headerWallet) {
        headerWallet.textContent = 'Wallet';
      }
      
      // Clear global variables
      window.currentWallet = null;
      
      // Trigger existing platform logic
      if (window.updateUI) {
        window.updateUI();
      }
      
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  return walletManager;
}

// Example initialization
export function initializeExample() {
  // Create example instance
  const example = new WalletConnectionExample();
  
  // Auto-connect if wallet was previously connected
  const status = example.walletManager.getWalletStatus();
  if (status.publicKey && status.isAvailable) {
    // Attempt to reconnect
    example.connectWallet();
  }
  
  return example;
}

// Export for use in other modules
export { WalletConnectionExample };