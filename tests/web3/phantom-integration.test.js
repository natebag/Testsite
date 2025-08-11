/**
 * Comprehensive Phantom Wallet Integration Testing Suite
 * Sub-task 8.1 - Full Phantom Wallet Integration Testing
 * 
 * Tests all aspects of Phantom wallet integration including:
 * - Connection edge cases and error handling
 * - Signature validation testing
 * - Session persistence and recovery
 * - Network switching scenarios
 * - Multi-wallet support and compatibility
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

// Mock implementations for testing
const mockPhantom = {
  isPhantom: true,
  isConnected: false,
  publicKey: null,
  connect: jest.fn(),
  disconnect: jest.fn(),
  signTransaction: jest.fn(),
  signAllTransactions: jest.fn(),
  signMessage: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  request: jest.fn()
};

// Mock Phantom wallet availability
global.window = {
  solana: mockPhantom,
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  sessionStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  location: { reload: jest.fn() },
  navigator: { userAgent: 'Test Browser' }
};

describe('Phantom Wallet Integration Tests', () => {
  let walletManager;
  let mockConnection;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock connection
    mockConnection = {
      getLatestBlockhash: jest.fn().mockResolvedValue({
        blockhash: 'test-blockhash',
        lastValidBlockHeight: 12345
      }),
      sendTransaction: jest.fn().mockResolvedValue('test-signature'),
      confirmTransaction: jest.fn().mockResolvedValue({ value: { err: null } }),
      getAccountInfo: jest.fn().mockResolvedValue(null),
      getBalance: jest.fn().mockResolvedValue(1000000000), // 1 SOL
      getRecentBlockhash: jest.fn().mockResolvedValue({
        blockhash: 'test-blockhash',
        feeCalculator: { lamportsPerSignature: 5000 }
      })
    };

    // Reset phantom mock state
    mockPhantom.isConnected = false;
    mockPhantom.publicKey = null;
    
    // Import wallet manager after mocks are setup
    const { PhantomWalletManager } = await import('../../src/wallet/phantom-wallet.js');
    walletManager = new PhantomWalletManager(mockConnection);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Phantom Wallet Detection and Availability', () => {
    it('should detect Phantom wallet when available', async () => {
      const isAvailable = await walletManager.isPhantomAvailable();
      expect(isAvailable).toBe(true);
      expect(window.solana.isPhantom).toBe(true);
    });

    it('should handle Phantom wallet not installed', async () => {
      // Temporarily remove Phantom
      const originalSolana = window.solana;
      delete window.solana;

      const isAvailable = await walletManager.isPhantomAvailable();
      expect(isAvailable).toBe(false);

      // Restore
      window.solana = originalSolana;
    });

    it('should detect non-Phantom wallets', async () => {
      // Mock a different wallet
      window.solana = { isPhantom: false };

      const isAvailable = await walletManager.isPhantomAvailable();
      expect(isAvailable).toBe(false);

      // Restore
      window.solana = mockPhantom;
    });

    it('should handle wallet detection timeout', async () => {
      // Remove wallet temporarily
      delete window.solana;
      
      const startTime = Date.now();
      const isAvailable = await walletManager.isPhantomAvailable();
      const endTime = Date.now();
      
      expect(isAvailable).toBe(false);
      expect(endTime - startTime).toBeLessThan(5000); // Should timeout quickly
      
      // Restore
      window.solana = mockPhantom;
    });
  });

  describe('Wallet Connection Management', () => {
    it('should connect to Phantom wallet successfully', async () => {
      const testPublicKey = new PublicKey('11111111111111111111111111111112');
      
      mockPhantom.connect.mockResolvedValue({ publicKey: testPublicKey });
      mockPhantom.publicKey = testPublicKey;
      mockPhantom.isConnected = true;

      const result = await walletManager.connect();

      expect(result.success).toBe(true);
      expect(result.publicKey).toEqual(testPublicKey.toString());
      expect(mockPhantom.connect).toHaveBeenCalledWith({ onlyIfTrusted: false });
    });

    it('should handle user rejected connection', async () => {
      const error = new Error('User rejected the request');
      error.code = 4001;
      
      mockPhantom.connect.mockRejectedValue(error);

      const result = await walletManager.connect();

      expect(result.success).toBe(false);
      expect(result.error).toBe('USER_REJECTED');
      expect(result.message).toContain('User rejected');
    });

    it('should handle wallet already connected', async () => {
      const testPublicKey = new PublicKey('11111111111111111111111111111112');
      
      mockPhantom.isConnected = true;
      mockPhantom.publicKey = testPublicKey;

      const result = await walletManager.connect();

      expect(result.success).toBe(true);
      expect(result.publicKey).toEqual(testPublicKey.toString());
      expect(result.alreadyConnected).toBe(true);
    });

    it('should handle connection timeout', async () => {
      // Simulate hanging connection
      mockPhantom.connect.mockImplementation(() => 
        new Promise(() => {}) // Never resolves
      );

      const result = await walletManager.connect({ timeout: 1000 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('CONNECTION_TIMEOUT');
    });

    it('should handle network connection issues', async () => {
      const networkError = new Error('Network request failed');
      networkError.code = 'NETWORK_ERROR';
      
      mockPhantom.connect.mockRejectedValue(networkError);

      const result = await walletManager.connect();

      expect(result.success).toBe(false);
      expect(result.error).toBe('NETWORK_ERROR');
    });
  });

  describe('Wallet Disconnection Scenarios', () => {
    beforeEach(async () => {
      // Setup connected state
      const testPublicKey = new PublicKey('11111111111111111111111111111112');
      mockPhantom.connect.mockResolvedValue({ publicKey: testPublicKey });
      mockPhantom.publicKey = testPublicKey;
      mockPhantom.isConnected = true;
      await walletManager.connect();
    });

    it('should handle standard user disconnect', async () => {
      mockPhantom.disconnect.mockResolvedValue();
      mockPhantom.isConnected = false;
      mockPhantom.publicKey = null;

      const result = await walletManager.disconnectUser();

      expect(result.success).toBe(true);
      expect(result.reason).toBe('user_initiated');
      expect(mockPhantom.disconnect).toHaveBeenCalled();
    });

    it('should handle emergency disconnect', async () => {
      const reason = 'suspicious_activity';
      
      const result = await walletManager.emergencyDisconnect(reason);

      expect(result.success).toBe(true);
      expect(result.reason).toBe(reason);
      expect(result.emergency).toBe(true);
    });

    it('should handle clean disconnect for account switching', async () => {
      const result = await walletManager.cleanDisconnect();

      expect(result.success).toBe(true);
      expect(result.reason).toBe('account_switch');
      expect(result.clearPreferences).toBe(false);
    });

    it('should handle complete reset', async () => {
      const result = await walletManager.resetWallet();

      expect(result.success).toBe(true);
      expect(result.reason).toBe('reset');
      expect(window.localStorage.clear).toHaveBeenCalled();
      expect(window.sessionStorage.clear).toHaveBeenCalled();
    });

    it('should handle disconnect failure', async () => {
      const error = new Error('Disconnect failed');
      mockPhantom.disconnect.mockRejectedValue(error);

      const result = await walletManager.disconnectUser();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Disconnect failed');
    });
  });

  describe('Message Signing and Validation', () => {
    beforeEach(async () => {
      // Setup connected state
      const testPublicKey = new PublicKey('11111111111111111111111111111112');
      mockPhantom.publicKey = testPublicKey;
      mockPhantom.isConnected = true;
    });

    it('should sign messages correctly', async () => {
      const message = 'MLG.clan authentication message';
      const mockSignature = new Uint8Array(64).fill(1);
      
      mockPhantom.signMessage.mockResolvedValue({
        signature: mockSignature,
        publicKey: mockPhantom.publicKey
      });

      const result = await walletManager.signMessage(message);

      expect(result.success).toBe(true);
      expect(result.signature).toEqual(Array.from(mockSignature));
      expect(mockPhantom.signMessage).toHaveBeenCalled();
    });

    it('should handle signature rejection', async () => {
      const message = 'Test message';
      const error = new Error('User rejected signature');
      error.code = 4001;
      
      mockPhantom.signMessage.mockRejectedValue(error);

      const result = await walletManager.signMessage(message);

      expect(result.success).toBe(false);
      expect(result.error).toBe('USER_REJECTED');
    });

    it('should validate message format', async () => {
      const invalidMessage = null;

      const result = await walletManager.signMessage(invalidMessage);

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_MESSAGE');
    });

    it('should handle signing when not connected', async () => {
      mockPhantom.isConnected = false;
      mockPhantom.publicKey = null;

      const result = await walletManager.signMessage('test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('WALLET_NOT_CONNECTED');
    });
  });

  describe('Session Persistence and Recovery', () => {
    it('should save session data correctly', async () => {
      const testPublicKey = new PublicKey('11111111111111111111111111111112');
      const sessionData = {
        publicKey: testPublicKey.toString(),
        connected: true,
        lastActivity: Date.now()
      };

      await walletManager.saveSession(sessionData);

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'mlg_clan_wallet_session',
        JSON.stringify(sessionData)
      );
    });

    it('should load session data correctly', async () => {
      const testPublicKey = new PublicKey('11111111111111111111111111111112');
      const sessionData = {
        publicKey: testPublicKey.toString(),
        connected: true,
        lastActivity: Date.now()
      };

      window.localStorage.getItem.mockReturnValue(JSON.stringify(sessionData));

      const loadedSession = await walletManager.loadSession();

      expect(loadedSession).toEqual(sessionData);
      expect(window.localStorage.getItem).toHaveBeenCalledWith('mlg_clan_wallet_session');
    });

    it('should handle corrupted session data', async () => {
      window.localStorage.getItem.mockReturnValue('invalid-json');

      const loadedSession = await walletManager.loadSession();

      expect(loadedSession).toBeNull();
    });

    it('should auto-reconnect from valid session', async () => {
      const testPublicKey = new PublicKey('11111111111111111111111111111112');
      const sessionData = {
        publicKey: testPublicKey.toString(),
        connected: true,
        lastActivity: Date.now()
      };

      window.localStorage.getItem.mockReturnValue(JSON.stringify(sessionData));
      mockPhantom.publicKey = testPublicKey;
      mockPhantom.isConnected = true;

      const result = await walletManager.autoReconnect();

      expect(result.success).toBe(true);
      expect(result.reconnected).toBe(true);
    });

    it('should handle expired sessions', async () => {
      const expiredSessionData = {
        publicKey: '11111111111111111111111111111112',
        connected: true,
        lastActivity: Date.now() - (3 * 60 * 60 * 1000) // 3 hours ago
      };

      window.localStorage.getItem.mockReturnValue(JSON.stringify(expiredSessionData));

      const result = await walletManager.autoReconnect();

      expect(result.success).toBe(false);
      expect(result.sessionExpired).toBe(true);
    });
  });

  describe('Network Switching Scenarios', () => {
    it('should handle network switch detection', async () => {
      const networkChangeCallback = jest.fn();
      
      await walletManager.onNetworkChange(networkChangeCallback);
      
      // Simulate network change
      const networkChangeHandler = mockPhantom.on.mock.calls
        .find(call => call[0] === 'networkChange')[1];
      
      if (networkChangeHandler) {
        networkChangeHandler('mainnet-beta');
        expect(networkChangeCallback).toHaveBeenCalledWith('mainnet-beta');
      }
    });

    it('should validate network compatibility', async () => {
      const supportedNetworks = ['mainnet-beta', 'devnet'];
      
      const isCompatible = await walletManager.isNetworkSupported('mainnet-beta');
      expect(isCompatible).toBe(true);
      
      const isIncompatible = await walletManager.isNetworkSupported('testnet');
      expect(isIncompatible).toBe(false);
    });

    it('should handle RPC endpoint switching', async () => {
      const originalEndpoint = 'https://api.mainnet-beta.solana.com';
      const fallbackEndpoint = 'https://solana-api.projectserum.com';
      
      // Simulate RPC failure
      mockConnection.getLatestBlockhash.mockRejectedValue(new Error('RPC Error'));
      
      const result = await walletManager.switchRPCEndpoint(fallbackEndpoint);
      
      expect(result.success).toBe(true);
      expect(result.newEndpoint).toBe(fallbackEndpoint);
    });
  });

  describe('Account Change Detection', () => {
    beforeEach(async () => {
      const testPublicKey = new PublicKey('11111111111111111111111111111112');
      mockPhantom.publicKey = testPublicKey;
      mockPhantom.isConnected = true;
    });

    it('should detect account changes', async () => {
      const accountChangeCallback = jest.fn();
      
      await walletManager.onAccountChange(accountChangeCallback);
      
      // Simulate account change
      const accountChangeHandler = mockPhantom.on.mock.calls
        .find(call => call[0] === 'accountChanged')[1];
      
      if (accountChangeHandler) {
        const newPublicKey = new PublicKey('22222222222222222222222222222223');
        accountChangeHandler(newPublicKey);
        expect(accountChangeCallback).toHaveBeenCalledWith(newPublicKey);
      }
    });

    it('should handle account disconnect via account change', async () => {
      const disconnectCallback = jest.fn();
      
      await walletManager.onDisconnect(disconnectCallback);
      
      // Simulate account change to null (disconnect)
      const accountChangeHandler = mockPhantom.on.mock.calls
        .find(call => call[0] === 'accountChanged')[1];
      
      if (accountChangeHandler) {
        accountChangeHandler(null);
        expect(disconnectCallback).toHaveBeenCalled();
      }
    });

    it('should update session on account change', async () => {
      const newPublicKey = new PublicKey('22222222222222222222222222222223');
      
      await walletManager.onAccountChange(async (publicKey) => {
        expect(publicKey).toEqual(newPublicKey);
        // Session should be updated automatically
        expect(window.localStorage.setItem).toHaveBeenCalled();
      });
      
      // Trigger account change
      const accountChangeHandler = mockPhantom.on.mock.calls
        .find(call => call[0] === 'accountChanged')[1];
      
      if (accountChangeHandler) {
        accountChangeHandler(newPublicKey);
      }
    });
  });

  describe('Transaction Handling', () => {
    beforeEach(async () => {
      const testPublicKey = new PublicKey('11111111111111111111111111111112');
      mockPhantom.publicKey = testPublicKey;
      mockPhantom.isConnected = true;
    });

    it('should sign transactions correctly', async () => {
      const testTransaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: mockPhantom.publicKey,
          toPubkey: new PublicKey('22222222222222222222222222222223'),
          lamports: 1000000
        })
      );

      const mockSignedTransaction = { ...testTransaction, signatures: [{ signature: new Uint8Array(64) }] };
      mockPhantom.signTransaction.mockResolvedValue(mockSignedTransaction);

      const result = await walletManager.signTransaction(testTransaction);

      expect(result.success).toBe(true);
      expect(result.signedTransaction).toBeDefined();
      expect(mockPhantom.signTransaction).toHaveBeenCalledWith(testTransaction);
    });

    it('should sign multiple transactions', async () => {
      const transactions = [
        new Transaction().add(SystemProgram.transfer({
          fromPubkey: mockPhantom.publicKey,
          toPubkey: new PublicKey('22222222222222222222222222222223'),
          lamports: 1000000
        })),
        new Transaction().add(SystemProgram.transfer({
          fromPubkey: mockPhantom.publicKey,
          toPubkey: new PublicKey('33333333333333333333333333333334'),
          lamports: 2000000
        }))
      ];

      const mockSignedTransactions = transactions.map(tx => ({ ...tx, signatures: [{ signature: new Uint8Array(64) }] }));
      mockPhantom.signAllTransactions.mockResolvedValue(mockSignedTransactions);

      const result = await walletManager.signAllTransactions(transactions);

      expect(result.success).toBe(true);
      expect(result.signedTransactions).toHaveLength(2);
      expect(mockPhantom.signAllTransactions).toHaveBeenCalledWith(transactions);
    });

    it('should handle transaction signature rejection', async () => {
      const testTransaction = new Transaction();
      const error = new Error('User rejected transaction');
      error.code = 4001;
      
      mockPhantom.signTransaction.mockRejectedValue(error);

      const result = await walletManager.signTransaction(testTransaction);

      expect(result.success).toBe(false);
      expect(result.error).toBe('USER_REJECTED');
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle wallet extension crashes', async () => {
      // Simulate wallet becoming undefined
      window.solana = undefined;
      
      const result = await walletManager.connect();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('WALLET_NOT_AVAILABLE');
      
      // Restore wallet
      window.solana = mockPhantom;
    });

    it('should retry failed operations', async () => {
      let attempts = 0;
      mockPhantom.connect.mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Network error');
        }
        return Promise.resolve({ publicKey: new PublicKey('11111111111111111111111111111112') });
      });

      const result = await walletManager.connect({ retries: 3 });
      
      expect(result.success).toBe(true);
      expect(attempts).toBe(3);
    });

    it('should handle rate limiting gracefully', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.code = 429;
      
      mockPhantom.connect.mockRejectedValue(rateLimitError);

      const result = await walletManager.connect();

      expect(result.success).toBe(false);
      expect(result.error).toBe('RATE_LIMITED');
      expect(result.retryAfter).toBeDefined();
    });

    it('should maintain connection health checks', async () => {
      const healthCheck = await walletManager.checkConnectionHealth();
      
      expect(healthCheck.wallet).toBeDefined();
      expect(healthCheck.rpc).toBeDefined();
      expect(healthCheck.overall).toBeDefined();
    });
  });

  describe('Multi-Wallet Support Preparation', () => {
    it('should detect available wallet types', async () => {
      // Mock multiple wallets
      window.solana = { isPhantom: true };
      window.solflare = { isSolflare: true };
      window.backpack = { isBackpack: true };

      const availableWallets = await walletManager.detectAvailableWallets();

      expect(availableWallets).toContain('phantom');
      expect(availableWallets.length).toBeGreaterThan(0);
    });

    it('should handle wallet switching', async () => {
      const currentWallet = 'phantom';
      const newWallet = 'solflare';
      
      const result = await walletManager.switchWallet(currentWallet, newWallet);
      
      expect(result.success).toBeTruthy();
      expect(result.previousWallet).toBe(currentWallet);
      expect(result.newWallet).toBe(newWallet);
    });

    it('should maintain wallet preference', async () => {
      const preferredWallet = 'phantom';
      
      await walletManager.setPreferredWallet(preferredWallet);
      const preference = await walletManager.getPreferredWallet();
      
      expect(preference).toBe(preferredWallet);
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'mlg_clan_user_preferences',
        expect.stringContaining(preferredWallet)
      );
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle rapid connection attempts', async () => {
      const testPublicKey = new PublicKey('11111111111111111111111111111112');
      mockPhantom.connect.mockResolvedValue({ publicKey: testPublicKey });
      
      const connectionPromises = Array(10).fill().map(() => walletManager.connect());
      const results = await Promise.all(connectionPromises);
      
      expect(results.every(r => r.success)).toBe(true);
      expect(mockPhantom.connect).toHaveBeenCalledTimes(1); // Should be deduplicated
    });

    it('should handle concurrent transaction signing', async () => {
      const transactions = Array(5).fill().map(() => new Transaction());
      mockPhantom.signTransaction.mockImplementation(tx => Promise.resolve({ ...tx, signatures: [] }));
      
      const signingPromises = transactions.map(tx => walletManager.signTransaction(tx));
      const results = await Promise.all(signingPromises);
      
      expect(results.every(r => r.success)).toBe(true);
      expect(mockPhantom.signTransaction).toHaveBeenCalledTimes(5);
    });

    it('should maintain performance under stress', async () => {
      const startTime = Date.now();
      
      // Simulate high-frequency operations
      const operations = Array(100).fill().map(async (_, i) => {
        if (i % 2 === 0) {
          return walletManager.checkConnectionHealth();
        } else {
          return walletManager.getWalletState();
        }
      });
      
      await Promise.all(operations);
      const endTime = Date.now();
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});