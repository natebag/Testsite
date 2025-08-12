/**
 * Network Validation Tests for PhantomWalletManager
 * Tests the comprehensive network validation, RPC endpoint management,
 * and network compatibility features added in sub-task 1.7
 */

import { jest } from '@jest/globals';
import { PhantomWalletManager } from './phantom-wallet.js';
import { SOLANA_NETWORKS, CURRENT_NETWORK } from '../../config/solana-config.js';

// Mock Solana web3 dependencies
const mockConnection = {
  getEpochInfo: jest.fn(),
  getRecentBlockhash: jest.fn(),
  getSlot: jest.fn(),
  getGenesisHash: jest.fn(),
  getBalance: jest.fn()
};

const mockAdapter = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  connected: false,
  publicKey: null,
  on: jest.fn(),
  removeAllListeners: jest.fn(),
  signMessage: jest.fn()
};

// Mock the Solana imports
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn(() => mockConnection),
  PublicKey: jest.fn(),
  Transaction: jest.fn(),
  SystemProgram: {},
  LAMPORTS_PER_SOL: 1000000000
}));

jest.mock('@solana/wallet-adapter-phantom', () => ({
  PhantomWalletAdapter: jest.fn(() => mockAdapter)
}));

// Mock the config
jest.mock('../../config/solana-config.js', () => ({
  createConnection: jest.fn(() => mockConnection),
  CURRENT_NETWORK: 'devnet',
  WALLET_CONFIG: {},
  SOLANA_NETWORKS: {
    DEVNET: 'devnet',
    MAINNET: 'mainnet-beta',
    TESTNET: 'testnet'
  },
  RPC_ENDPOINTS: {
    'devnet': [
      'https://api.devnet.solana.com',
      'https://devnet.genesysgo.net'
    ],
    'mainnet-beta': [
      'https://api.mainnet-beta.solana.com',
      'https://solana-api.projectserum.com'
    ]
  },
  validateNetwork: jest.fn((network) => ['devnet', 'mainnet-beta', 'testnet'].includes(network)),
  getCurrentNetworkEndpoints: jest.fn(() => ['https://api.devnet.solana.com'])
}));

describe('PhantomWalletManager Network Validation', () => {
  let walletManager;
  let mockLocalStorage;
  let mockSessionStorage;

  beforeEach(() => {
    // Mock browser APIs
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };
    
    mockSessionStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };

    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true
    });
    Object.defineProperty(global, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
      configurable: true
    });
    Object.defineProperty(global, 'window', {
      value: {
        solana: { isPhantom: true, connect: jest.fn() },
        navigator: { userAgent: 'test' },
        location: { href: 'http://localhost' },
        crypto: { subtle: {} },
        fetch: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        localStorage: mockLocalStorage,
        sessionStorage: mockSessionStorage
      },
      writable: true,
      configurable: true
    });
    Object.defineProperty(global, 'document', {
      value: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        hidden: false
      },
      writable: true,
      configurable: true
    });

    // Reset mocks
    jest.clearAllMocks();
    
    // Create new instance for each test
    walletManager = new PhantomWalletManager();
  });

  afterEach(() => {
    if (walletManager) {
      walletManager.destroy().catch(() => {});
    }
  });

  describe('Network Configuration Validation', () => {
    test('should validate supported networks', () => {
      expect(walletManager.validateTargetNetwork('devnet')).toBe(true);
      expect(walletManager.validateTargetNetwork('mainnet-beta')).toBe(true);
      expect(walletManager.validateTargetNetwork('invalid-network')).toBe(false);
    });

    test('should validate network configuration', () => {
      const validation = walletManager.validateNetworkConfiguration();
      
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('issues');
      expect(validation).toHaveProperty('warnings');
      expect(validation).toHaveProperty('currentNetwork');
      expect(validation).toHaveProperty('supportedNetworks');
    });

    test('should identify configuration issues', () => {
      // Temporarily set unsupported network
      walletManager.supportedNetworks = ['mainnet-beta'];
      
      const validation = walletManager.validateNetworkConfiguration();
      
      expect(validation.valid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });
  });

  describe('RPC Endpoint Validation', () => {
    test('should test RPC endpoint health', async () => {
      mockConnection.getEpochInfo.mockResolvedValue({ epoch: 100 });
      
      await expect(
        walletManager.testRpcEndpoint(mockConnection, 'https://api.devnet.solana.com')
      ).resolves.not.toThrow();
      
      expect(mockConnection.getEpochInfo).toHaveBeenCalled();
    });

    test('should handle RPC endpoint failures', async () => {
      mockConnection.getEpochInfo.mockRejectedValue(new Error('Network error'));
      
      await expect(
        walletManager.testRpcEndpoint(mockConnection, 'https://failed-endpoint.com')
      ).rejects.toThrow('RPC endpoint test failed');
    });

    test('should validate RPC endpoint after connection', async () => {
      mockConnection.getEpochInfo.mockResolvedValue({ epoch: 100 });
      mockConnection.getRecentBlockhash.mockResolvedValue({ blockhash: 'test' });
      mockConnection.getSlot.mockResolvedValue(12345);
      
      await expect(
        walletManager.validateRpcEndpoint(mockConnection)
      ).resolves.not.toThrow();
      
      expect(mockConnection.getEpochInfo).toHaveBeenCalled();
      expect(mockConnection.getRecentBlockhash).toHaveBeenCalled();
      expect(mockConnection.getSlot).toHaveBeenCalled();
    });
  });

  describe('Network Detection', () => {
    test('should detect network from genesis hash', async () => {
      // Mock devnet genesis hash
      mockConnection.getGenesisHash.mockResolvedValue('EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG');
      
      const detectedNetwork = await walletManager.detectWalletNetwork();
      
      expect(detectedNetwork).toBe('devnet');
      expect(mockConnection.getGenesisHash).toHaveBeenCalled();
    });

    test('should handle network detection failure', async () => {
      mockConnection.getGenesisHash.mockRejectedValue(new Error('Network error'));
      
      const detectedNetwork = await walletManager.detectWalletNetwork();
      
      expect(detectedNetwork).toBeNull();
    });

    test('should fallback to current network for unknown genesis hash', async () => {
      mockConnection.getGenesisHash.mockResolvedValue('unknown-hash');
      
      const detectedNetwork = await walletManager.detectWalletNetwork();
      
      expect(detectedNetwork).toBe(walletManager.currentNetwork);
    });
  });

  describe('Network Compatibility Validation', () => {
    test('should validate compatible networks', async () => {
      mockAdapter.connected = true;
      walletManager.adapter = mockAdapter;
      walletManager.connection = mockConnection;
      
      // Mock same network detection
      mockConnection.getGenesisHash.mockResolvedValue('EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG');
      
      await expect(
        walletManager.validateNetworkCompatibility()
      ).resolves.not.toThrow();
    });

    test('should detect network mismatch', async () => {
      mockAdapter.connected = true;
      walletManager.adapter = mockAdapter;
      walletManager.connection = mockConnection;
      walletManager.currentNetwork = 'devnet';
      
      // Mock different network (mainnet)
      mockConnection.getGenesisHash.mockResolvedValue('5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d');
      
      let networkMismatchEmitted = false;
      walletManager.on('networkMismatch', () => {
        networkMismatchEmitted = true;
      });
      
      if (walletManager.networkValidationEnabled) {
        await expect(
          walletManager.validateNetworkCompatibility()
        ).rejects.toThrow();
      }
      
      expect(networkMismatchEmitted).toBe(true);
    });
  });

  describe('Network Monitoring', () => {
    test('should start network monitoring', () => {
      walletManager.startNetworkMonitoring();
      
      expect(walletManager.networkMonitoringInterval).toBeDefined();
    });

    test('should stop network monitoring', () => {
      walletManager.startNetworkMonitoring();
      walletManager.stopNetworkMonitoring();
      
      expect(walletManager.networkMonitoringInterval).toBeNull();
    });

    test('should perform network health check', async () => {
      mockConnection.getEpochInfo.mockResolvedValue({ epoch: 100 });
      mockConnection.getRecentBlockhash.mockResolvedValue({ blockhash: 'test' });
      mockConnection.getSlot.mockResolvedValue(12345);
      mockConnection.getGenesisHash.mockResolvedValue('EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG');
      
      let healthCheckEmitted = false;
      walletManager.on('networkHealthCheck', () => {
        healthCheckEmitted = true;
      });
      
      await walletManager.performNetworkHealthCheck();
      
      expect(healthCheckEmitted).toBe(true);
    });
  });

  describe('Network Switch Handling', () => {
    test('should handle network change', async () => {
      const oldNetwork = walletManager.currentNetwork;
      const newNetwork = 'mainnet-beta';
      
      let networkChangedEmitted = false;
      walletManager.on('networkChanged', (event) => {
        networkChangedEmitted = true;
        expect(event.previousNetwork).toBe(oldNetwork);
        expect(event.newNetwork).toBe(newNetwork);
      });
      
      // Mock disconnect
      walletManager.disconnect = jest.fn().mockResolvedValue();
      
      await walletManager.handleNetworkChange(newNetwork);
      
      expect(networkChangedEmitted).toBe(true);
      expect(walletManager.currentNetwork).toBe(newNetwork);
    });

    test('should request network switch', async () => {
      let switchRequestEmitted = false;
      walletManager.on('networkSwitchRequested', (event) => {
        switchRequestEmitted = true;
        expect(event.requiresManualSwitch).toBe(true);
      });
      
      const result = await walletManager.requestNetworkSwitch('mainnet-beta');
      
      expect(result).toBe(false); // Manual switch required
      expect(switchRequestEmitted).toBe(true);
    });

    test('should reject invalid network switch', async () => {
      await expect(
        walletManager.requestNetworkSwitch('invalid-network')
      ).rejects.toThrow();
    });
  });

  describe('Network Status', () => {
    test('should provide comprehensive network status', () => {
      const status = walletManager.getNetworkStatus();
      
      expect(status).toHaveProperty('currentNetwork');
      expect(status).toHaveProperty('targetNetwork');
      expect(status).toHaveProperty('networkCompatible');
      expect(status).toHaveProperty('supportedNetworks');
      expect(status).toHaveProperty('networkValidationEnabled');
      expect(status).toHaveProperty('connectionHealthy');
      expect(status).toHaveProperty('rpcHealthStatus');
      expect(status).toHaveProperty('availableEndpoints');
      expect(status).toHaveProperty('canSwitchNetwork');
    });

    test('should update validation settings', () => {
      const newSettings = {
        enabled: false,
        supportedNetworks: ['mainnet-beta'],
        checkInterval: 60000,
        strictValidation: false
      };
      
      let settingsUpdated = false;
      walletManager.on('networkValidationSettingsUpdated', () => {
        settingsUpdated = true;
      });
      
      walletManager.updateNetworkValidationSettings(newSettings);
      
      expect(walletManager.networkValidationEnabled).toBe(false);
      expect(walletManager.supportedNetworks).toEqual(['mainnet-beta']);
      expect(walletManager.networkCheckInterval).toBe(60000);
      expect(settingsUpdated).toBe(true);
    });
  });

  describe('Enhanced Connection with Network Validation', () => {
    test('should validate network during connection', async () => {
      mockAdapter.connect.mockResolvedValue();
      mockAdapter.connected = true;
      mockAdapter.publicKey = { toBase58: () => 'test-key' };
      
      // Mock successful network validation
      mockConnection.getEpochInfo.mockResolvedValue({ epoch: 100 });
      mockConnection.getRecentBlockhash.mockResolvedValue({ blockhash: 'test' });
      mockConnection.getSlot.mockResolvedValue(12345);
      mockConnection.getGenesisHash.mockResolvedValue('EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG');
      
      walletManager.adapter = mockAdapter;
      walletManager.connection = mockConnection;
      
      const result = await walletManager.connect();
      
      expect(result).toHaveProperty('networkCompatible');
      expect(result).toHaveProperty('networkValidationEnabled');
      expect(result).toHaveProperty('rpcEndpointHealthy');
    });

    test('should handle network validation failure during connection', async () => {
      mockAdapter.connect.mockResolvedValue();
      mockAdapter.connected = true;
      
      // Mock network validation failure
      mockConnection.getGenesisHash.mockResolvedValue('5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d'); // mainnet hash
      walletManager.currentNetwork = 'devnet';
      walletManager.networkValidationEnabled = true;
      
      walletManager.adapter = mockAdapter;
      walletManager.connection = mockConnection;
      
      await expect(walletManager.connect()).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should categorize network validation errors', () => {
      const networkError = new Error('network validation failed');
      const categorized = walletManager.categorizeConnectionError(networkError);
      
      expect(categorized.type).toBe('NETWORK_VALIDATION_FAILED');
    });

    test('should categorize network mismatch errors', () => {
      const mismatchError = new Error('network mismatch detected');
      const categorized = walletManager.categorizeConnectionError(mismatchError);
      
      expect(categorized.type).toBe('NETWORK_MISMATCH');
    });

    test('should categorize RPC endpoint errors', () => {
      const rpcError = new Error('all rpc endpoints failed');
      const categorized = walletManager.categorizeConnectionError(rpcError);
      
      expect(categorized.type).toBe('RPC_ENDPOINT_FAILED');
    });

    test('should not retry network mismatch errors', () => {
      const mismatchError = { type: 'NETWORK_MISMATCH' };
      const shouldRetry = walletManager.shouldRetryConnection(mismatchError);
      
      expect(shouldRetry).toBe(false);
    });

    test('should retry RPC endpoint failures', () => {
      const rpcError = { type: 'RPC_ENDPOINT_FAILED' };
      walletManager.retryAttempts = 0; // Reset retry count
      const shouldRetry = walletManager.shouldRetryConnection(rpcError);
      
      expect(shouldRetry).toBe(true);
    });
  });

  describe('Cleanup and Destruction', () => {
    test('should clear network monitoring on destroy', async () => {
      walletManager.startNetworkMonitoring();
      expect(walletManager.networkMonitoringInterval).toBeDefined();
      
      await walletManager.destroy();
      
      expect(walletManager.networkMonitoringInterval).toBeNull();
    });

    test('should preserve network monitoring state during disconnect', async () => {
      walletManager.startNetworkMonitoring();
      const wasMonitoring = !!walletManager.networkMonitoringInterval;
      
      await walletManager.disconnect();
      
      // Network monitoring should be stopped during cleanup
      expect(walletManager.networkMonitoringInterval).toBeNull();
    });
  });
});

describe('Network Validation Integration', () => {
  test('should integrate with existing wallet functionality', () => {
    const walletManager = new PhantomWalletManager();
    
    // Verify network validation properties are initialized
    expect(walletManager.currentNetwork).toBe(CURRENT_NETWORK);
    expect(walletManager.supportedNetworks).toContain('devnet');
    expect(walletManager.supportedNetworks).toContain('mainnet-beta');
    expect(walletManager.networkValidationEnabled).toBe(true);
    expect(walletManager.rpcHealthStatus).toBeInstanceOf(Map);
    
    walletManager.destroy().catch(() => {});
  });

  test('should maintain backward compatibility', () => {
    const walletManager = new PhantomWalletManager();
    
    // Verify existing methods still work
    expect(walletManager.getWalletStatus()).toHaveProperty('network');
    expect(walletManager.getWalletStatus()).toHaveProperty('networkCompatible');
    expect(walletManager.getConnectionInfo).toBeDefined();
    
    walletManager.destroy().catch(() => {});
  });
});