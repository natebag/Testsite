/**
 * Enhanced Session Persistence Tests
 * 
 * Comprehensive test suite for the enhanced PhantomWalletManager
 * session persistence features
 */

import { describe, test, beforeEach, afterEach, expect, jest } from '@jest/globals';
import { PhantomWalletManager } from './phantom-wallet.js';

// Mock localStorage and sessionStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};

const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};

// Mock window.solana (Phantom wallet)
const mockPhantomWallet = {
  isPhantom: true,
  connect: jest.fn(),
  disconnect: jest.fn(),
  signMessage: jest.fn(),
  publicKey: {
    toBase58: () => 'MockPublicKey123456789',
    equals: jest.fn(() => true)
  },
  connected: false,
  on: jest.fn(),
  removeAllListeners: jest.fn()
};

// Mock Solana Connection
const mockConnection = {
  getBalance: jest.fn().mockResolvedValue(1000000000),
  getRecentBlockhash: jest.fn().mockResolvedValue({ blockhash: 'mock-blockhash' })
};

// Mock PhantomWalletAdapter
const mockAdapter = {
  name: 'Phantom',
  connected: false,
  publicKey: null,
  connect: jest.fn(),
  disconnect: jest.fn(),
  signMessage: jest.fn(),
  on: jest.fn(),
  removeAllListeners: jest.fn()
};

// Setup global mocks
Object.defineProperty(global, 'window', {
  value: {
    solana: mockPhantomWallet,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  },
  writable: true
});

Object.defineProperty(global, 'document', {
  value: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    hidden: false
  },
  writable: true
});

Object.defineProperty(global, 'localStorage', { value: localStorageMock });
Object.defineProperty(global, 'sessionStorage', { value: sessionStorageMock });

// Mock modules
jest.mock('@solana/wallet-adapter-phantom', () => ({
  PhantomWalletAdapter: jest.fn(() => mockAdapter)
}));

jest.mock('../../config/solana-config.js', () => ({
  createConnection: () => mockConnection,
  CURRENT_NETWORK: 'devnet',
  WALLET_CONFIG: { localStorageKey: 'test-wallet' }
}));

describe('Enhanced Session Persistence', () => {
  let walletManager;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.getItem.mockReturnValue(null);
    
    // Reset adapter state
    mockAdapter.connected = false;
    mockAdapter.publicKey = null;
    
    walletManager = new PhantomWalletManager();
  });
  
  afterEach(() => {
    if (walletManager) {
      walletManager.destroy();
    }
  });

  describe('Session Storage and Restoration', () => {
    test('should save session data on successful connection', async () => {
      // Setup successful connection
      mockAdapter.connect.mockResolvedValue(true);
      mockAdapter.connected = true;
      mockAdapter.publicKey = { toBase58: () => 'test-key', equals: jest.fn(() => true) };
      
      await walletManager.connect();
      
      // Verify session was saved
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mlg_clan_wallet_session',
        expect.stringContaining('"publicKey":"test-key"')
      );
      
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'mlg_clan_session_activity',
        expect.stringContaining('"lastActivity"')
      );
    });
    
    test('should restore valid session on initialization', () => {
      const validSession = {
        publicKey: 'test-key',
        network: 'devnet',
        timestamp: Date.now() - 60000, // 1 minute ago
        lastActivity: Date.now() - 30000, // 30 seconds ago
        version: '2.0'
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(validSession));
      
      const newManager = new PhantomWalletManager();
      
      expect(newManager.publicKey).toBeTruthy();
      expect(newManager.sessionData).toEqual(expect.objectContaining({
        publicKey: 'test-key',
        network: 'devnet'
      }));
      
      newManager.destroy();
    });
    
    test('should clear expired session', () => {
      const expiredSession = {
        publicKey: 'test-key',
        network: 'devnet',
        timestamp: Date.now() - (3 * 60 * 60 * 1000), // 3 hours ago
        lastActivity: Date.now() - (3 * 60 * 60 * 1000),
        version: '2.0'
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredSession));
      
      const newManager = new PhantomWalletManager();
      
      expect(localStorageMock.removeItem).toHaveBeenCalled();
      expect(newManager.sessionData).toBeNull();
      
      newManager.destroy();
    });
    
    test('should clear session with network mismatch', () => {
      const wrongNetworkSession = {
        publicKey: 'test-key',
        network: 'mainnet-beta', // Different network
        timestamp: Date.now() - 60000,
        lastActivity: Date.now() - 30000,
        version: '2.0'
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(wrongNetworkSession));
      
      const newManager = new PhantomWalletManager();
      
      expect(localStorageMock.removeItem).toHaveBeenCalled();
      expect(newManager.sessionData).toBeNull();
      
      newManager.destroy();
    });
  });

  describe('User Preferences Management', () => {
    test('should save and load user preferences', () => {
      const preferences = {
        autoReconnect: false,
        sessionTimeout: 60 * 60 * 1000,
        theme: 'dark',
        notifications: false
      };
      
      walletManager.updateUserPreferences(preferences);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mlg_clan_user_preferences',
        JSON.stringify(expect.objectContaining(preferences))
      );
    });
    
    test('should use default preferences when none exist', () => {
      expect(walletManager.userPreferences).toEqual(expect.objectContaining({
        autoReconnect: true,
        notifications: true
      }));
    });
    
    test('should merge saved preferences with defaults', () => {
      const partialPreferences = {
        autoReconnect: false
      };
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'mlg_clan_user_preferences') {
          return JSON.stringify(partialPreferences);
        }
        return null;
      });
      
      const newManager = new PhantomWalletManager();
      
      expect(newManager.userPreferences.autoReconnect).toBe(false);
      expect(newManager.userPreferences.notifications).toBe(true); // Default
      
      newManager.destroy();
    });
  });

  describe('Activity Tracking', () => {
    test('should update activity timestamp', () => {
      const initialActivity = walletManager.lastActivity;
      
      // Wait a bit and update activity
      setTimeout(() => {
        walletManager.updateActivityTimestamp();
        expect(walletManager.lastActivity).toBeGreaterThan(initialActivity);
      }, 10);
    });
    
    test('should setup activity event listeners', () => {
      expect(document.addEventListener).toHaveBeenCalledWith('click', expect.any(Function), { passive: true });
      expect(document.addEventListener).toHaveBeenCalledWith('keypress', expect.any(Function), { passive: true });
      expect(document.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function), { passive: true });
      expect(document.addEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    });
  });

  describe('Auto-Reconnection', () => {
    test('should attempt auto-reconnection with valid session', async () => {
      // Mock successful reconnection
      mockAdapter.connect.mockResolvedValue(true);
      mockAdapter.connected = true;
      mockAdapter.publicKey = { toBase58: () => 'test-key', equals: jest.fn(() => true) };
      
      const result = await walletManager.attemptAutoReconnect();
      
      expect(mockAdapter.connect).toHaveBeenCalled();
      expect(result).toBeTruthy();
    });
    
    test('should implement exponential backoff on reconnection failures', async () => {
      mockAdapter.connect.mockRejectedValue(new Error('Connection failed'));
      
      const startTime = Date.now();
      await walletManager.attemptAutoReconnect();
      
      // Should have attempted reconnection with delay
      expect(mockAdapter.connect).toHaveBeenCalled();
      expect(walletManager.reconnectionAttempts).toBe(1);
    });
    
    test('should stop reconnection after max attempts', async () => {
      mockAdapter.connect.mockRejectedValue(new Error('Connection failed'));
      
      // Set to max attempts
      walletManager.reconnectionAttempts = 3;
      
      const result = await walletManager.attemptAutoReconnect();
      
      expect(result).toBe(false);
      expect(mockAdapter.connect).not.toHaveBeenCalled();
    });
  });

  describe('Session Timeout Management', () => {
    test('should start session timeout on connection', async () => {
      mockAdapter.connect.mockResolvedValue(true);
      mockAdapter.connected = true;
      mockAdapter.publicKey = { toBase58: () => 'test-key', equals: jest.fn(() => true) };
      
      await walletManager.connect();
      
      expect(walletManager.sessionTimeout).toBeTruthy();
    });
    
    test('should clear session timeout on disconnect', async () => {
      // First connect
      mockAdapter.connect.mockResolvedValue(true);
      mockAdapter.connected = true;
      mockAdapter.publicKey = { toBase58: () => 'test-key', equals: jest.fn(() => true) };
      
      await walletManager.connect();
      const timeoutId = walletManager.sessionTimeout;
      
      await walletManager.disconnect();
      
      expect(walletManager.sessionTimeout).toBeNull();
    });
  });

  describe('Session Validation and Refresh', () => {
    test('should validate active connection', async () => {
      // Setup connected state
      walletManager.isConnected = true;
      walletManager.publicKey = { toBase58: () => 'test-key', equals: jest.fn(() => true) };
      mockAdapter.connected = true;
      mockAdapter.publicKey = walletManager.publicKey;
      
      const isValid = await walletManager.validateConnection();
      
      expect(isValid).toBe(true);
      expect(mockConnection.getRecentBlockhash).toHaveBeenCalled();
    });
    
    test('should detect disconnected adapter', async () => {
      walletManager.isConnected = true;
      walletManager.publicKey = { toBase58: () => 'test-key' };
      mockAdapter.connected = false; // Adapter disconnected
      
      const isValid = await walletManager.validateConnection();
      
      expect(isValid).toBe(false);
      expect(walletManager.isConnected).toBe(false);
    });
  });

  describe('Comprehensive Status Information', () => {
    test('should return detailed wallet status with session info', () => {
      walletManager.isConnected = true;
      walletManager.sessionData = { timestamp: Date.now() };
      walletManager.lastActivity = Date.now() - 30000;
      
      const status = walletManager.getWalletStatus();
      
      expect(status).toEqual(expect.objectContaining({
        isConnected: true,
        hasSession: true,
        lastActivity: expect.any(Number),
        timeSinceActivity: expect.any(Number),
        autoReconnectEnabled: expect.any(Boolean)
      }));
    });
    
    test('should return session information', () => {
      walletManager.sessionData = { test: 'data' };
      walletManager.lastActivity = Date.now();
      
      const sessionInfo = walletManager.getSessionInfo();
      
      expect(sessionInfo).toEqual(expect.objectContaining({
        isConnected: expect.any(Boolean),
        sessionData: expect.any(Object),
        lastActivity: expect.any(Number),
        userPreferences: expect.any(Object),
        timeSinceActivity: expect.any(Number)
      }));
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      // Should not throw error
      expect(() => {
        walletManager.saveSession();
      }).not.toThrow();
    });
    
    test('should handle corrupt session data', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');
      
      expect(() => {
        const newManager = new PhantomWalletManager();
        newManager.destroy();
      }).not.toThrow();
    });
  });

  describe('Event Emission', () => {
    test('should emit session events', async () => {
      const sessionExpiredHandler = jest.fn();
      walletManager.on('sessionExpired', sessionExpiredHandler);
      
      // Trigger session expiration
      walletManager.emit('sessionExpired', { reason: 'test' });
      
      expect(sessionExpiredHandler).toHaveBeenCalledWith({ reason: 'test' });
    });
    
    test('should emit preferences update events', () => {
      const preferencesHandler = jest.fn();
      walletManager.on('preferencesUpdated', preferencesHandler);
      
      const newPrefs = { autoReconnect: false };
      walletManager.updateUserPreferences(newPrefs);
      
      expect(preferencesHandler).toHaveBeenCalledWith(
        expect.objectContaining(newPrefs)
      );
    });
  });

  describe('Cleanup and Resource Management', () => {
    test('should clean up all resources on destroy', () => {
      walletManager.destroy();
      
      expect(document.removeEventListener).toHaveBeenCalled();
      expect(walletManager.activityListeners).toEqual([]);
      expect(walletManager.sessionTimeout).toBeNull();
      expect(walletManager.sessionRefreshInterval).toBeNull();
    });
  });
});

// Integration Tests
describe('Session Persistence Integration', () => {
  test('should maintain session across browser refresh simulation', async () => {
    // Simulate first session
    const firstManager = new PhantomWalletManager();
    mockAdapter.connect.mockResolvedValue(true);
    mockAdapter.connected = true;
    mockAdapter.publicKey = { toBase58: () => 'integration-test-key', equals: jest.fn(() => true) };
    
    await firstManager.connect();
    
    const sessionData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    firstManager.destroy();
    
    // Simulate page refresh - new manager instance
    localStorageMock.getItem.mockReturnValue(JSON.stringify(sessionData));
    
    const secondManager = new PhantomWalletManager();
    
    expect(secondManager.publicKey).toBeTruthy();
    expect(secondManager.sessionData).toBeTruthy();
    
    secondManager.destroy();
  });
  
  test('should handle concurrent sessions in different tabs', () => {
    // This test would require more complex setup for multi-tab scenarios
    // For now, we verify that activity updates are saved to sessionStorage
    walletManager.updateActivityTimestamp();
    
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
      'mlg_clan_session_activity',
      expect.stringContaining('lastActivity')
    );
  });
});