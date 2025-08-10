/**
 * Unit Tests for Phantom Wallet Integration
 * 
 * Tests wallet detection, connection, error handling, and session management
 */

import { PhantomWalletManager, getWalletManager, initializeWallet } from './phantom-wallet.js';

// Mock Solana dependencies
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getBalance: jest.fn().mockResolvedValue(1000000000),
    getRecentBlockhash: jest.fn().mockResolvedValue({ blockhash: 'test' })
  })),
  PublicKey: jest.fn().mockImplementation((key) => ({
    toBase58: () => key,
    equals: (other) => other.toBase58() === key
  })),
  Transaction: jest.fn(),
  SystemProgram: {},
  LAMPORTS_PER_SOL: 1000000000
}));

jest.mock('@solana/wallet-adapter-phantom', () => ({
  PhantomWalletAdapter: jest.fn().mockImplementation(() => ({
    name: 'Phantom',
    connected: false,
    publicKey: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
    signMessage: jest.fn(),
    on: jest.fn(),
    removeAllListeners: jest.fn()
  }))
}));

jest.mock('../../config/solana-config.js', () => ({
  createConnection: jest.fn().mockReturnValue({
    getBalance: jest.fn().mockResolvedValue(1000000000),
    getRecentBlockhash: jest.fn().mockResolvedValue({ blockhash: 'test' })
  }),
  CURRENT_NETWORK: 'devnet',
  WALLET_CONFIG: {
    localStorageKey: 'test_wallet_adapter'
  }
}));

// Setup DOM environment
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn()
  }
});

describe('PhantomWalletManager', () => {
  let walletManager;

  beforeEach(() => {
    jest.clearAllMocks();
    walletManager = new PhantomWalletManager();
  });

  afterEach(() => {
    if (walletManager) {
      walletManager.destroy();
    }
  });

  describe('Wallet Detection', () => {
    test('should detect when Phantom is available', () => {
      // Mock Phantom availability
      Object.defineProperty(window, 'solana', {
        value: {
          isPhantom: true,
          connect: jest.fn()
        },
        configurable: true
      });

      expect(PhantomWalletManager.isPhantomAvailable()).toBe(true);
    });

    test('should detect when Phantom is not available', () => {
      delete window.solana;
      expect(PhantomWalletManager.isPhantomAvailable()).toBe(false);
    });

    test('should return correct wallet status', () => {
      const status = walletManager.getWalletStatus();
      
      expect(status).toHaveProperty('isAvailable');
      expect(status).toHaveProperty('isConnected');
      expect(status).toHaveProperty('network');
      expect(status.network).toBe('devnet');
    });
  });

  describe('Wallet Connection', () => {
    beforeEach(() => {
      // Mock Phantom availability
      Object.defineProperty(window, 'solana', {
        value: {
          isPhantom: true,
          connect: jest.fn()
        },
        configurable: true
      });
    });

    test('should throw error when Phantom is not available', async () => {
      delete window.solana;
      
      await expect(walletManager.connect()).rejects.toThrow(
        'Phantom wallet is not installed or available'
      );
    });

    test('should prevent multiple concurrent connections', async () => {
      walletManager.isConnecting = true;
      
      await expect(walletManager.connect()).rejects.toThrow(
        'Connection already in progress'
      );
    });

    test('should return existing connection if already connected', async () => {
      walletManager.isConnected = true;
      walletManager.publicKey = { toBase58: () => 'test-key' };
      
      const result = await walletManager.connect();
      expect(result).toHaveProperty('isConnected', true);
      expect(result).toHaveProperty('address', 'test-key');
    });

    test('should handle connection timeout', async () => {
      walletManager.adapter.connect = jest.fn(() => 
        new Promise(resolve => setTimeout(resolve, 60000))
      );
      
      await expect(
        walletManager.connect({ timeout: 100 })
      ).rejects.toThrow('Connection timed out. Please try again');
    });
  });

  describe('Wallet Disconnection', () => {
    test('should handle disconnection when not connected', async () => {
      walletManager.isConnected = false;
      
      await expect(walletManager.disconnect()).resolves.not.toThrow();
    });

    test('should clear session on disconnect', async () => {
      walletManager.isConnected = true;
      walletManager.publicKey = { toBase58: () => 'test-key' };
      
      await walletManager.disconnect();
      
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('test_wallet_adapter');
      expect(walletManager.isConnected).toBe(false);
      expect(walletManager.publicKey).toBe(null);
    });

    test('should force disconnect on adapter failure', async () => {
      walletManager.isConnected = true;
      walletManager.adapter.disconnect = jest.fn().mockRejectedValue(new Error('Adapter error'));
      
      await walletManager.disconnect();
      
      expect(walletManager.isConnected).toBe(false);
    });
  });

  describe('Address Formatting', () => {
    test('should format long addresses correctly', () => {
      const longAddress = '1234567890abcdefghijklmnopqrstuvwxyz1234567890';
      const formatted = walletManager.formatShortAddress(longAddress);
      
      expect(formatted).toBe('1234...7890');
    });

    test('should return short addresses unchanged', () => {
      const shortAddress = '1234';
      const formatted = walletManager.formatShortAddress(shortAddress);
      
      expect(formatted).toBe('1234');
    });

    test('should handle null/undefined addresses', () => {
      expect(walletManager.formatShortAddress(null)).toBe(null);
      expect(walletManager.formatShortAddress(undefined)).toBe(undefined);
    });
  });

  describe('Balance Fetching', () => {
    test('should fetch balance when connected', async () => {
      walletManager.isConnected = true;
      walletManager.publicKey = { toBase58: () => 'test-key' };
      
      const balance = await walletManager.getBalance();
      
      expect(balance).toBe(1); // 1000000000 lamports = 1 SOL
    });

    test('should throw error when not connected', async () => {
      walletManager.isConnected = false;
      
      await expect(walletManager.getBalance()).rejects.toThrow(
        'Wallet not connected'
      );
    });
  });

  describe('Message Signing', () => {
    test('should sign message when connected', async () => {
      walletManager.isConnected = true;
      walletManager.adapter.signMessage = jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3]));
      
      const signature = await walletManager.signMessage('test message');
      
      expect(signature).toEqual(new Uint8Array([1, 2, 3]));
      expect(walletManager.adapter.signMessage).toHaveBeenCalled();
    });

    test('should throw error when not connected', async () => {
      walletManager.isConnected = false;
      
      await expect(walletManager.signMessage('test')).rejects.toThrow(
        'Wallet not connected or signing not supported'
      );
    });
  });

  describe('Connection Validation', () => {
    test('should validate successful connection', async () => {
      walletManager.isConnected = true;
      walletManager.publicKey = { toBase58: () => 'test-key' };
      walletManager.adapter.connected = true;
      walletManager.adapter.publicKey = { equals: () => true };
      
      const isValid = await walletManager.validateConnection();
      
      expect(isValid).toBe(true);
    });

    test('should invalidate disconnected wallet', async () => {
      walletManager.isConnected = true;
      walletManager.publicKey = { toBase58: () => 'test-key' };
      walletManager.adapter.connected = false;
      
      const isValid = await walletManager.validateConnection();
      
      expect(isValid).toBe(false);
      expect(walletManager.isConnected).toBe(false);
    });
  });

  describe('Session Management', () => {
    test('should save session when connected', () => {
      walletManager.isConnected = true;
      walletManager.publicKey = { toBase58: () => 'test-key' };
      
      walletManager.saveSession();
      
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'test_wallet_adapter',
        expect.stringContaining('test-key')
      );
    });

    test('should restore valid session', () => {
      const sessionData = {
        publicKey: 'test-key',
        network: 'devnet',
        timestamp: Date.now(),
        walletName: 'Phantom'
      };
      
      window.localStorage.getItem.mockReturnValue(JSON.stringify(sessionData));
      
      const restored = walletManager.restoreSession();
      
      expect(restored).toBe(true);
      expect(walletManager.publicKey).toBeTruthy();
    });

    test('should reject expired session', () => {
      const sessionData = {
        publicKey: 'test-key',
        network: 'devnet',
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
        walletName: 'Phantom'
      };
      
      window.localStorage.getItem.mockReturnValue(JSON.stringify(sessionData));
      
      const restored = walletManager.restoreSession();
      
      expect(restored).toBe(false);
      expect(window.localStorage.removeItem).toHaveBeenCalled();
    });

    test('should clear session', () => {
      walletManager.clearSession();
      
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('test_wallet_adapter');
    });
  });

  describe('Error Handling', () => {
    test('should create user-friendly error for user rejection', () => {
      const error = new Error('User rejected the request');
      const userError = walletManager.createUserFriendlyError(error);
      
      expect(userError.message).toBe('Connection was cancelled by user');
    });

    test('should create user-friendly error for timeout', () => {
      const error = new Error('Connection timeout occurred');
      const userError = walletManager.createUserFriendlyError(error);
      
      expect(userError.message).toBe('Connection timed out. Please try again');
    });

    test('should handle generic errors', () => {
      const error = new Error('Unknown error occurred');
      const userError = walletManager.createUserFriendlyError(error);
      
      expect(userError.message).toBe('Failed to connect to Phantom wallet. Please try again');
    });
  });

  describe('Event System', () => {
    test('should add and emit events', () => {
      const callback = jest.fn();
      walletManager.on('test', callback);
      
      walletManager.emit('test', 'data');
      
      expect(callback).toHaveBeenCalledWith('data');
    });

    test('should remove event listeners', () => {
      const callback = jest.fn();
      walletManager.on('test', callback);
      walletManager.off('test', callback);
      
      walletManager.emit('test', 'data');
      
      expect(callback).not.toHaveBeenCalled();
    });

    test('should handle errors in event listeners', () => {
      const failingCallback = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      
      walletManager.on('test', failingCallback);
      
      expect(() => walletManager.emit('test', 'data')).not.toThrow();
    });
  });
});

describe('Global Wallet Manager', () => {
  test('should return same instance', () => {
    const instance1 = getWalletManager();
    const instance2 = getWalletManager();
    
    expect(instance1).toBe(instance2);
  });

  test('should initialize new instance', () => {
    const instance = initializeWallet();
    
    expect(instance).toBeInstanceOf(PhantomWalletManager);
  });
});