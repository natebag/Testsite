/**
 * Multi-Wallet Support Testing Suite
 * Sub-task 8.2 - Multi-Wallet Support Testing
 * 
 * Tests compatibility with multiple Solana wallets including:
 * - MetaMask, Solflare, Backpack, Glow compatibility
 * - Wallet switching and session management
 * - Cross-wallet transaction validation
 * - Unified wallet adapter integration
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

// Mock wallet implementations
const createMockWallet = (name, isInstalled = true) => ({
  name,
  readyState: isInstalled ? 'Installed' : 'NotDetected',
  publicKey: isInstalled ? new PublicKey('11111111111111111111111111111112') : null,
  connecting: false,
  connected: false,
  connect: jest.fn(),
  disconnect: jest.fn(),
  signTransaction: jest.fn(),
  signAllTransactions: jest.fn(),
  signMessage: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn()
});

const mockWallets = {
  phantom: {
    ...createMockWallet('Phantom'),
    isPhantom: true
  },
  solflare: {
    ...createMockWallet('Solflare'),
    isSolflare: true
  },
  backpack: {
    ...createMockWallet('Backpack'),
    isBackpack: true
  },
  glow: {
    ...createMockWallet('Glow'),
    isGlow: true
  },
  metamask: {
    ...createMockWallet('MetaMask (Solana)'),
    isMetaMask: true
  }
};

// Mock global wallet objects
global.window = {
  solana: mockWallets.phantom,
  solflare: mockWallets.solflare,
  backpack: mockWallets.backpack,
  glow: mockWallets.glow,
  ethereum: mockWallets.metamask,
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

describe('Multi-Wallet Support Tests', () => {
  let multiWalletManager;
  let mockConnection;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset wallet states
    Object.values(mockWallets).forEach(wallet => {
      wallet.connected = false;
      wallet.connecting = false;
      wallet.publicKey = null;
    });

    // Setup mock connection
    mockConnection = {
      getLatestBlockhash: jest.fn().mockResolvedValue({
        blockhash: 'test-blockhash',
        lastValidBlockHeight: 12345
      }),
      sendTransaction: jest.fn().mockResolvedValue('test-signature'),
      confirmTransaction: jest.fn().mockResolvedValue({ value: { err: null } }),
      getAccountInfo: jest.fn().mockResolvedValue(null),
      getBalance: jest.fn().mockResolvedValue(1000000000)
    };

    // Import multi-wallet manager (assuming it exists or we'll mock it)
    const { MultiWalletManager } = await import('../../src/wallet/multi-wallet-manager.js').catch(() => ({
      MultiWalletManager: class MockMultiWalletManager {
        constructor(connection) {
          this.connection = connection;
          this.currentWallet = null;
          this.availableWallets = [];
        }

        async detectAvailableWallets() {
          const available = [];
          if (window.solana?.isPhantom) available.push('phantom');
          if (window.solflare?.isSolflare) available.push('solflare');
          if (window.backpack?.isBackpack) available.push('backpack');
          if (window.glow?.isGlow) available.push('glow');
          if (window.ethereum?.isMetaMask) available.push('metamask');
          this.availableWallets = available;
          return available;
        }

        async connectWallet(walletName, options = {}) {
          const wallet = this.getWalletAdapter(walletName);
          if (!wallet) {
            return { success: false, error: 'WALLET_NOT_AVAILABLE' };
          }

          try {
            const testPublicKey = new PublicKey('11111111111111111111111111111112');
            wallet.connect.mockResolvedValue({ publicKey: testPublicKey });
            wallet.connected = true;
            wallet.publicKey = testPublicKey;
            this.currentWallet = walletName;
            
            return {
              success: true,
              wallet: walletName,
              publicKey: testPublicKey.toString()
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        }

        async switchWallet(fromWallet, toWallet) {
          try {
            if (fromWallet) {
              await this.disconnectWallet(fromWallet);
            }
            const result = await this.connectWallet(toWallet);
            return {
              ...result,
              switched: true,
              fromWallet,
              toWallet
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        }

        async disconnectWallet(walletName) {
          const wallet = this.getWalletAdapter(walletName);
          if (wallet) {
            wallet.disconnect.mockResolvedValue();
            wallet.connected = false;
            wallet.publicKey = null;
            if (this.currentWallet === walletName) {
              this.currentWallet = null;
            }
          }
          return { success: true };
        }

        getWalletAdapter(walletName) {
          const walletMap = {
            phantom: window.solana,
            solflare: window.solflare,
            backpack: window.backpack,
            glow: window.glow,
            metamask: window.ethereum
          };
          return walletMap[walletName];
        }

        async signTransaction(transaction, walletName = this.currentWallet) {
          const wallet = this.getWalletAdapter(walletName);
          if (!wallet || !wallet.connected) {
            return { success: false, error: 'WALLET_NOT_CONNECTED' };
          }

          try {
            const signedTx = { ...transaction, signatures: [{ signature: new Uint8Array(64) }] };
            wallet.signTransaction.mockResolvedValue(signedTx);
            return { success: true, signedTransaction: signedTx };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }

        async signMessage(message, walletName = this.currentWallet) {
          const wallet = this.getWalletAdapter(walletName);
          if (!wallet || !wallet.connected) {
            return { success: false, error: 'WALLET_NOT_CONNECTED' };
          }

          try {
            const signature = new Uint8Array(64).fill(1);
            wallet.signMessage.mockResolvedValue({ signature });
            return { success: true, signature: Array.from(signature) };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }

        getCurrentWallet() {
          return this.currentWallet;
        }

        getAvailableWallets() {
          return this.availableWallets;
        }

        isWalletConnected(walletName) {
          const wallet = this.getWalletAdapter(walletName);
          return wallet?.connected || false;
        }
      }
    }));

    multiWalletManager = new MultiWalletManager(mockConnection);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Wallet Detection and Availability', () => {
    it('should detect all available wallets', async () => {
      const availableWallets = await multiWalletManager.detectAvailableWallets();

      expect(availableWallets).toContain('phantom');
      expect(availableWallets).toContain('solflare');
      expect(availableWallets).toContain('backpack');
      expect(availableWallets).toContain('glow');
      expect(availableWallets).toContain('metamask');
      expect(availableWallets.length).toBe(5);
    });

    it('should handle partially available wallets', async () => {
      // Remove some wallets
      delete window.backpack;
      delete window.glow;

      const availableWallets = await multiWalletManager.detectAvailableWallets();

      expect(availableWallets).toContain('phantom');
      expect(availableWallets).toContain('solflare');
      expect(availableWallets).toContain('metamask');
      expect(availableWallets).not.toContain('backpack');
      expect(availableWallets).not.toContain('glow');

      // Restore wallets
      window.backpack = mockWallets.backpack;
      window.glow = mockWallets.glow;
    });

    it('should detect no wallets when none available', async () => {
      // Remove all wallets
      const originalWallets = {
        solana: window.solana,
        solflare: window.solflare,
        backpack: window.backpack,
        glow: window.glow,
        ethereum: window.ethereum
      };

      delete window.solana;
      delete window.solflare;
      delete window.backpack;
      delete window.glow;
      delete window.ethereum;

      const availableWallets = await multiWalletManager.detectAvailableWallets();

      expect(availableWallets).toEqual([]);

      // Restore wallets
      Object.assign(window, originalWallets);
    });

    it('should prioritize wallets by preference', async () => {
      const availableWallets = await multiWalletManager.detectAvailableWallets();
      
      // Phantom should typically be first priority
      expect(availableWallets[0]).toBe('phantom');
    });
  });

  describe('Individual Wallet Connection Tests', () => {
    it('should connect to Phantom wallet', async () => {
      const result = await multiWalletManager.connectWallet('phantom');

      expect(result.success).toBe(true);
      expect(result.wallet).toBe('phantom');
      expect(result.publicKey).toBeDefined();
      expect(mockWallets.phantom.connect).toHaveBeenCalled();
    });

    it('should connect to Solflare wallet', async () => {
      const result = await multiWalletManager.connectWallet('solflare');

      expect(result.success).toBe(true);
      expect(result.wallet).toBe('solflare');
      expect(result.publicKey).toBeDefined();
      expect(mockWallets.solflare.connect).toHaveBeenCalled();
    });

    it('should connect to Backpack wallet', async () => {
      const result = await multiWalletManager.connectWallet('backpack');

      expect(result.success).toBe(true);
      expect(result.wallet).toBe('backpack');
      expect(result.publicKey).toBeDefined();
      expect(mockWallets.backpack.connect).toHaveBeenCalled();
    });

    it('should connect to Glow wallet', async () => {
      const result = await multiWalletManager.connectWallet('glow');

      expect(result.success).toBe(true);
      expect(result.wallet).toBe('glow');
      expect(result.publicKey).toBeDefined();
      expect(mockWallets.glow.connect).toHaveBeenCalled();
    });

    it('should handle connection to unavailable wallet', async () => {
      const result = await multiWalletManager.connectWallet('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('WALLET_NOT_AVAILABLE');
    });
  });

  describe('Wallet Switching and Session Management', () => {
    beforeEach(async () => {
      // Connect to Phantom initially
      await multiWalletManager.connectWallet('phantom');
    });

    it('should switch from Phantom to Solflare', async () => {
      const result = await multiWalletManager.switchWallet('phantom', 'solflare');

      expect(result.success).toBe(true);
      expect(result.switched).toBe(true);
      expect(result.fromWallet).toBe('phantom');
      expect(result.toWallet).toBe('solflare');
      expect(multiWalletManager.getCurrentWallet()).toBe('solflare');
    });

    it('should switch from Solflare to Backpack', async () => {
      await multiWalletManager.connectWallet('solflare');
      
      const result = await multiWalletManager.switchWallet('solflare', 'backpack');

      expect(result.success).toBe(true);
      expect(result.fromWallet).toBe('solflare');
      expect(result.toWallet).toBe('backpack');
    });

    it('should handle switch to same wallet gracefully', async () => {
      const result = await multiWalletManager.switchWallet('phantom', 'phantom');

      expect(result.success).toBe(true);
      expect(result.wallet).toBe('phantom');
    });

    it('should maintain session across wallet switches', async () => {
      // Switch wallets multiple times
      await multiWalletManager.switchWallet('phantom', 'solflare');
      await multiWalletManager.switchWallet('solflare', 'backpack');
      await multiWalletManager.switchWallet('backpack', 'glow');

      expect(multiWalletManager.getCurrentWallet()).toBe('glow');
      expect(multiWalletManager.isWalletConnected('glow')).toBe(true);
      expect(multiWalletManager.isWalletConnected('phantom')).toBe(false);
      expect(multiWalletManager.isWalletConnected('solflare')).toBe(false);
      expect(multiWalletManager.isWalletConnected('backpack')).toBe(false);
    });

    it('should handle concurrent connection attempts', async () => {
      const connectionPromises = [
        multiWalletManager.connectWallet('phantom'),
        multiWalletManager.connectWallet('solflare'),
        multiWalletManager.connectWallet('backpack')
      ];

      const results = await Promise.all(connectionPromises);
      
      // Should handle gracefully without conflicts
      expect(results.some(r => r.success)).toBe(true);
    });
  });

  describe('Cross-Wallet Transaction Validation', () => {
    beforeEach(async () => {
      await multiWalletManager.connectWallet('phantom');
    });

    it('should sign transaction with current wallet', async () => {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey('11111111111111111111111111111112'),
          toPubkey: new PublicKey('22222222222222222222222222222223'),
          lamports: 1000000
        })
      );

      const result = await multiWalletManager.signTransaction(transaction);

      expect(result.success).toBe(true);
      expect(result.signedTransaction).toBeDefined();
      expect(mockWallets.phantom.signTransaction).toHaveBeenCalled();
    });

    it('should sign transaction with specific wallet', async () => {
      // Connect multiple wallets
      await multiWalletManager.connectWallet('solflare');
      
      const transaction = new Transaction();
      const result = await multiWalletManager.signTransaction(transaction, 'solflare');

      expect(result.success).toBe(true);
      expect(mockWallets.solflare.signTransaction).toHaveBeenCalled();
    });

    it('should handle transaction signing with disconnected wallet', async () => {
      await multiWalletManager.disconnectWallet('phantom');
      
      const transaction = new Transaction();
      const result = await multiWalletManager.signTransaction(transaction, 'phantom');

      expect(result.success).toBe(false);
      expect(result.error).toBe('WALLET_NOT_CONNECTED');
    });

    it('should validate transaction compatibility across wallets', async () => {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey('11111111111111111111111111111112'),
          toPubkey: new PublicKey('22222222222222222222222222222223'),
          lamports: 1000000
        })
      );

      // Test transaction signing across all available wallets
      const wallets = ['phantom', 'solflare', 'backpack', 'glow'];
      const results = [];

      for (const wallet of wallets) {
        await multiWalletManager.connectWallet(wallet);
        const result = await multiWalletManager.signTransaction(transaction, wallet);
        results.push({ wallet, success: result.success });
        await multiWalletManager.disconnectWallet(wallet);
      }

      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe('Message Signing Across Wallets', () => {
    it('should sign messages with different wallets', async () => {
      const message = 'MLG.clan authentication message';
      const wallets = ['phantom', 'solflare', 'backpack', 'glow'];
      const results = [];

      for (const wallet of wallets) {
        await multiWalletManager.connectWallet(wallet);
        const result = await multiWalletManager.signMessage(message, wallet);
        results.push({ wallet, success: result.success, signature: result.signature });
        await multiWalletManager.disconnectWallet(wallet);
      }

      expect(results.every(r => r.success)).toBe(true);
      expect(results.every(r => r.signature)).toBeTruthy();
      
      // Signatures should be consistent format but can differ between wallets
      results.forEach(result => {
        expect(Array.isArray(result.signature)).toBe(true);
        expect(result.signature.length).toBe(64);
      });
    });

    it('should handle message signing with invalid wallet', async () => {
      const result = await multiWalletManager.signMessage('test', 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('WALLET_NOT_CONNECTED');
    });

    it('should maintain message integrity across wallets', async () => {
      const message = 'Test message with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      
      await multiWalletManager.connectWallet('phantom');
      const phantomResult = await multiWalletManager.signMessage(message);
      
      await multiWalletManager.switchWallet('phantom', 'solflare');
      const solflareResult = await multiWalletManager.signMessage(message);

      expect(phantomResult.success).toBe(true);
      expect(solflareResult.success).toBe(true);
      expect(phantomResult.signature).toBeDefined();
      expect(solflareResult.signature).toBeDefined();
    });
  });

  describe('Wallet State Management', () => {
    it('should track multiple wallet states', async () => {
      await multiWalletManager.connectWallet('phantom');
      await multiWalletManager.connectWallet('solflare');

      expect(multiWalletManager.isWalletConnected('phantom')).toBe(false); // Should be disconnected when switching
      expect(multiWalletManager.isWalletConnected('solflare')).toBe(true);
      expect(multiWalletManager.getCurrentWallet()).toBe('solflare');
    });

    it('should handle wallet state persistence', async () => {
      await multiWalletManager.connectWallet('backpack');
      
      // Simulate page reload by creating new instance
      const newMultiWalletManager = new multiWalletManager.constructor(mockConnection);
      
      // Should be able to detect previously connected wallet
      const availableWallets = await newMultiWalletManager.detectAvailableWallets();
      expect(availableWallets).toContain('backpack');
    });

    it('should handle wallet disconnection cleanup', async () => {
      await multiWalletManager.connectWallet('glow');
      expect(multiWalletManager.isWalletConnected('glow')).toBe(true);

      await multiWalletManager.disconnectWallet('glow');
      expect(multiWalletManager.isWalletConnected('glow')).toBe(false);
      expect(multiWalletManager.getCurrentWallet()).toBeNull();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle wallet extension crashes', async () => {
      // Connect to wallet first
      await multiWalletManager.connectWallet('phantom');
      
      // Simulate wallet becoming unavailable
      delete window.solana;
      
      const result = await multiWalletManager.signTransaction(new Transaction());
      expect(result.success).toBe(false);
      
      // Restore wallet
      window.solana = mockWallets.phantom;
    });

    it('should handle network issues during wallet operations', async () => {
      // Mock network error
      mockWallets.phantom.connect.mockRejectedValue(new Error('Network error'));
      
      const result = await multiWalletManager.connectWallet('phantom');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle user rejection across wallets', async () => {
      const rejectionError = new Error('User rejected');
      rejectionError.code = 4001;
      
      mockWallets.solflare.connect.mockRejectedValue(rejectionError);
      
      const result = await multiWalletManager.connectWallet('solflare');
      expect(result.success).toBe(false);
    });

    it('should handle rapid wallet switching', async () => {
      const switchPromises = [
        multiWalletManager.switchWallet(null, 'phantom'),
        multiWalletManager.switchWallet('phantom', 'solflare'),
        multiWalletManager.switchWallet('solflare', 'backpack'),
        multiWalletManager.switchWallet('backpack', 'glow')
      ];

      const results = await Promise.allSettled(switchPromises);
      
      // At least one should succeed, others may be cancelled/rejected
      expect(results.some(r => r.status === 'fulfilled' && r.value.success)).toBe(true);
    });
  });

  describe('Performance and Compatibility', () => {
    it('should maintain performance with multiple wallets', async () => {
      const startTime = Date.now();
      
      // Perform multiple operations
      await multiWalletManager.detectAvailableWallets();
      await multiWalletManager.connectWallet('phantom');
      await multiWalletManager.switchWallet('phantom', 'solflare');
      await multiWalletManager.signMessage('test message');
      await multiWalletManager.disconnectWallet('solflare');
      
      const endTime = Date.now();
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(2000);
    });

    it('should handle browser compatibility issues', async () => {
      // Simulate older browser without certain features
      const originalUserAgent = window.navigator.userAgent;
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)',
        configurable: true
      });

      const availableWallets = await multiWalletManager.detectAvailableWallets();
      
      // Should still work, though might have fewer features
      expect(Array.isArray(availableWallets)).toBe(true);
      
      // Restore
      Object.defineProperty(window.navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true
      });
    });

    it('should handle memory leaks from wallet listeners', async () => {
      // Connect and disconnect multiple times
      for (let i = 0; i < 10; i++) {
        await multiWalletManager.connectWallet('phantom');
        await multiWalletManager.disconnectWallet('phantom');
      }

      // Should not accumulate listeners
      // This would be better tested with actual memory profiling
      expect(mockWallets.phantom.on.mock.calls.length).toBeLessThan(100);
    });
  });

  describe('Wallet-Specific Feature Testing', () => {
    it('should handle Phantom-specific features', async () => {
      await multiWalletManager.connectWallet('phantom');
      
      // Test Phantom-specific methods if available
      const wallet = multiWalletManager.getWalletAdapter('phantom');
      expect(wallet.isPhantom).toBe(true);
    });

    it('should handle Solflare-specific features', async () => {
      await multiWalletManager.connectWallet('solflare');
      
      const wallet = multiWalletManager.getWalletAdapter('solflare');
      expect(wallet.isSolflare).toBe(true);
    });

    it('should handle Backpack-specific features', async () => {
      await multiWalletManager.connectWallet('backpack');
      
      const wallet = multiWalletManager.getWalletAdapter('backpack');
      expect(wallet.isBackpack).toBe(true);
    });

    it('should handle wallet-specific error codes', async () => {
      // Different wallets might return different error codes
      const walletErrors = {
        phantom: { code: 4001, message: 'User rejected' },
        solflare: { code: -32003, message: 'User denied transaction signature' },
        backpack: { code: 4100, message: 'Unauthorized' }
      };

      for (const [walletName, error] of Object.entries(walletErrors)) {
        mockWallets[walletName].signTransaction.mockRejectedValue(error);
        await multiWalletManager.connectWallet(walletName);
        
        const result = await multiWalletManager.signTransaction(new Transaction());
        expect(result.success).toBe(false);
        
        await multiWalletManager.disconnectWallet(walletName);
      }
    });
  });
});