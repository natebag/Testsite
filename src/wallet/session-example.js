/**
 * Enhanced Session Persistence Usage Example
 * 
 * This example demonstrates how to use the enhanced PhantomWalletManager
 * with robust session persistence, auto-reconnection, and user preferences.
 */

import { getWalletManager } from './phantom-wallet.js';

/**
 * Initialize wallet with session persistence
 */
export function initializeWalletWithSession() {
  const walletManager = getWalletManager();
  
  // Setup event listeners for session management
  setupSessionEventListeners(walletManager);
  
  // Check wallet status including session information
  const status = walletManager.getWalletStatus();
  console.log('Wallet Status:', status);
  
  return walletManager;
}

/**
 * Setup comprehensive event listeners for session management
 */
function setupSessionEventListeners(walletManager) {
  // Connection events
  walletManager.on('connected', (connectionInfo) => {
    console.log('✅ Wallet connected:', connectionInfo);
    updateUI('connected', connectionInfo);
  });
  
  walletManager.on('disconnected', () => {
    console.log('❌ Wallet disconnected');
    updateUI('disconnected');
  });
  
  // Session management events
  walletManager.on('sessionExpired', (data) => {
    console.log('⏰ Session expired:', data);
    showNotification('Session expired due to inactivity', 'warning');
    updateUI('sessionExpired');
  });
  
  walletManager.on('sessionRefreshed', (data) => {
    console.log('🔄 Session refreshed:', data);
    // Optionally update UI with session activity
  });
  
  // Auto-reconnection events
  walletManager.on('autoReconnectSuccess', (data) => {
    console.log('🔄 Auto-reconnection successful:', data);
    showNotification('Wallet automatically reconnected', 'success');
  });
  
  walletManager.on('autoReconnectFailed', (data) => {
    console.log('❌ Auto-reconnection failed:', data);
    showNotification('Failed to auto-reconnect wallet', 'error');
    updateUI('autoReconnectFailed');
  });
  
  // Preference updates
  walletManager.on('preferencesUpdated', (preferences) => {
    console.log('⚙️ Preferences updated:', preferences);
    saveUIPreferences(preferences);
  });
  
  // Account security
  walletManager.on('accountChanged', (data) => {
    console.log('🔄 Account changed - security disconnect:', data);
    showNotification('Account changed - please reconnect for security', 'warning');
  });
}

/**
 * Connect wallet with session persistence
 */
export async function connectWalletWithSession(options = {}) {
  const walletManager = getWalletManager();
  
  try {
    showConnectingState(true);
    
    const connectionInfo = await walletManager.connect({
      onlyIfTrusted: false,
      timeout: 30000,
      ...options
    });
    
    console.log('Connection successful:', connectionInfo);
    return connectionInfo;
    
  } catch (error) {
    console.error('Connection failed:', error);
    showNotification(error.message, 'error');
    throw error;
  } finally {
    showConnectingState(false);
  }
}

/**
 * Disconnect wallet with preference option
 */
export async function disconnectWallet(clearAutoReconnect = false) {
  const walletManager = getWalletManager();
  
  try {
    await walletManager.disconnect(clearAutoReconnect);
    
    if (clearAutoReconnect) {
      showNotification('Wallet disconnected - auto-reconnect disabled', 'info');
    } else {
      showNotification('Wallet disconnected', 'info');
    }
    
  } catch (error) {
    console.error('Disconnect failed:', error);
    showNotification('Failed to disconnect wallet', 'error');
  }
}

/**
 * Update user preferences
 */
export function updateWalletPreferences(newPreferences) {
  const walletManager = getWalletManager();
  walletManager.updateUserPreferences(newPreferences);
}

/**
 * Get comprehensive session information
 */
export function getSessionInformation() {
  const walletManager = getWalletManager();
  return {
    status: walletManager.getWalletStatus(),
    session: walletManager.getSessionInfo(),
    connection: walletManager.getConnectionInfo()
  };
}

/**
 * Manually trigger reconnection attempt
 */
export async function attemptReconnection() {
  const walletManager = getWalletManager();
  
  try {
    showNotification('Attempting to reconnect...', 'info');
    const result = await walletManager.attemptAutoReconnect();
    
    if (result) {
      showNotification('Reconnection successful', 'success');
    }
    
    return result;
  } catch (error) {
    console.error('Manual reconnection failed:', error);
    showNotification('Reconnection failed', 'error');
    return false;
  }
}

/**
 * Check session validity and refresh if needed
 */
export async function validateSession() {
  const walletManager = getWalletManager();
  
  if (!walletManager.isConnected) {
    return false;
  }
  
  try {
    const isValid = await walletManager.validateConnection();
    
    if (!isValid) {
      showNotification('Session validation failed', 'warning');
      return false;
    }
    
    // Update activity timestamp
    walletManager.updateActivityTimestamp();
    return true;
    
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
}

/**
 * Setup preference management UI
 */
export function createPreferencesPanel() {
  const walletManager = getWalletManager();
  const preferences = walletManager.userPreferences;
  
  return {
    autoReconnect: {
      value: preferences.autoReconnect,
      label: 'Auto-reconnect wallet on page load',
      onChange: (value) => updateWalletPreferences({ autoReconnect: value })
    },
    sessionTimeout: {
      value: preferences.sessionTimeout,
      label: 'Session timeout (minutes)',
      options: [
        { value: 30 * 60 * 1000, label: '30 minutes' },
        { value: 60 * 60 * 1000, label: '1 hour' },
        { value: 2 * 60 * 60 * 1000, label: '2 hours' },
        { value: 4 * 60 * 60 * 1000, label: '4 hours' }
      ],
      onChange: (value) => updateWalletPreferences({ sessionTimeout: value })
    },
    notifications: {
      value: preferences.notifications,
      label: 'Show wallet notifications',
      onChange: (value) => updateWalletPreferences({ notifications: value })
    }
  };
}

/**
 * Monitor session activity and display status
 */
export function startSessionMonitoring() {
  const walletManager = getWalletManager();
  
  setInterval(() => {
    const sessionInfo = walletManager.getSessionInfo();
    
    if (sessionInfo.isConnected) {
      const timeLeft = getTimeUntilTimeout(sessionInfo);
      updateSessionDisplay(timeLeft, sessionInfo.timeSinceActivity);
    }
  }, 60000); // Check every minute
}

// Helper functions for UI integration

function updateUI(state, data = null) {
  // Update your application UI based on wallet state
  console.log(`UI State: ${state}`, data);
  
  // Example implementations:
  switch (state) {
    case 'connected':
      document.body.setAttribute('data-wallet-connected', 'true');
      break;
    case 'disconnected':
    case 'sessionExpired':
    case 'autoReconnectFailed':
      document.body.setAttribute('data-wallet-connected', 'false');
      break;
  }
}

function showNotification(message, type = 'info') {
  // Implement your notification system
  console.log(`[${type.toUpperCase()}] ${message}`);
  
  // Example: Create toast notification
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('wallet-notification', {
      detail: { message, type }
    });
    window.dispatchEvent(event);
  }
}

function showConnectingState(isConnecting) {
  // Update UI to show connecting state
  if (typeof window !== 'undefined') {
    document.body.setAttribute('data-wallet-connecting', isConnecting.toString());
  }
}

function saveUIPreferences(preferences) {
  // Save UI-specific preferences (theme, etc.)
  console.log('Saving UI preferences:', preferences);
}

function getTimeUntilTimeout(sessionInfo) {
  const timeoutDuration = sessionInfo.userPreferences.sessionTimeout;
  const timeSinceActivity = sessionInfo.timeSinceActivity;
  return Math.max(0, timeoutDuration - timeSinceActivity);
}

function updateSessionDisplay(timeLeft, timeSinceActivity) {
  // Update UI with session timeout information
  const minutes = Math.floor(timeLeft / (1000 * 60));
  console.log(`Session expires in ${minutes} minutes`);
}

// Usage example for React/Vue/other frameworks
export const walletSessionHooks = {
  /**
   * React-style hook for wallet session state
   */
  useWalletSession: () => {
    const walletManager = getWalletManager();
    
    return {
      isConnected: walletManager.isConnected,
      isConnecting: walletManager.isConnecting,
      publicKey: walletManager.publicKey,
      sessionInfo: walletManager.getSessionInfo(),
      preferences: walletManager.userPreferences,
      
      connect: connectWalletWithSession,
      disconnect: disconnectWallet,
      updatePreferences: updateWalletPreferences,
      validateSession: validateSession
    };
  }
};

// Export for direct usage
export default {
  initializeWalletWithSession,
  connectWalletWithSession,
  disconnectWallet,
  updateWalletPreferences,
  getSessionInformation,
  attemptReconnection,
  validateSession,
  createPreferencesPanel,
  startSessionMonitoring,
  walletSessionHooks
};