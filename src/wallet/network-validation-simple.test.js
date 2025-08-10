/**
 * Simple Network Validation Tests
 * Basic validation of network validation functionality without complex mocking
 */

import { jest } from '@jest/globals';

// Simple test environment setup
global.console = { 
  log: jest.fn(), 
  error: jest.fn(), 
  warn: jest.fn(), 
  info: jest.fn() 
};

// Mock storage
const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};

Object.defineProperty(global, 'localStorage', {
  value: mockStorage,
  configurable: true
});

Object.defineProperty(global, 'sessionStorage', {
  value: mockStorage,
  configurable: true
});

// Mock window object
Object.defineProperty(global, 'window', {
  value: {
    localStorage: mockStorage,
    sessionStorage: mockStorage,
    navigator: { userAgent: 'test-agent' },
    location: { href: 'http://localhost:3000' },
    crypto: { subtle: {} },
    fetch: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  },
  configurable: true
});

Object.defineProperty(global, 'document', {
  value: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    hidden: false
  },
  configurable: true
});

// Mock Solana dependencies
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn(() => ({
    getEpochInfo: jest.fn().mockResolvedValue({ epoch: 100 }),
    getRecentBlockhash: jest.fn().mockResolvedValue({ blockhash: 'test' }),
    getSlot: jest.fn().mockResolvedValue(12345),
    getGenesisHash: jest.fn().mockResolvedValue('EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG'),
    getBalance: jest.fn().mockResolvedValue(1000000000)
  })),
  PublicKey: jest.fn((key) => ({ toBase58: () => key })),
  Transaction: jest.fn(),
  SystemProgram: {},
  LAMPORTS_PER_SOL: 1000000000
}));

jest.mock('@solana/wallet-adapter-phantom', () => ({
  PhantomWalletAdapter: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(),
    disconnect: jest.fn().mockResolvedValue(),
    connected: false,
    publicKey: null,
    on: jest.fn(),
    removeAllListeners: jest.fn(),
    signMessage: jest.fn()
  }))
}));

jest.mock('../../config/solana-config.js', () => ({
  createConnection: jest.fn(() => ({
    getEpochInfo: jest.fn().mockResolvedValue({ epoch: 100 }),
    getRecentBlockhash: jest.fn().mockResolvedValue({ blockhash: 'test' }),
    getSlot: jest.fn().mockResolvedValue(12345),
    getGenesisHash: jest.fn().mockResolvedValue('EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG')
  })),
  CURRENT_NETWORK: 'devnet',
  WALLET_CONFIG: {},
  SOLANA_NETWORKS: {
    DEVNET: 'devnet',
    MAINNET: 'mainnet-beta',
    TESTNET: 'testnet'
  },
  RPC_ENDPOINTS: {
    'devnet': ['https://api.devnet.solana.com'],
    'mainnet-beta': ['https://api.mainnet-beta.solana.com']
  },
  validateNetwork: jest.fn((network) => ['devnet', 'mainnet-beta', 'testnet'].includes(network)),
  getCurrentNetworkEndpoints: jest.fn(() => ['https://api.devnet.solana.com'])
}));

describe('Network Validation Core Functions', () => {
  let PhantomWalletManager;
  
  beforeAll(async () => {
    // Import after mocks are set up
    const module = await import('./phantom-wallet.js');
    PhantomWalletManager = module.PhantomWalletManager;
  });

  test('should create wallet manager with network validation properties', () => {
    const walletManager = new PhantomWalletManager();
    
    expect(walletManager.currentNetwork).toBeDefined();
    expect(walletManager.supportedNetworks).toBeDefined();
    expect(walletManager.networkValidationEnabled).toBe(true);
    expect(walletManager.rpcHealthStatus).toBeInstanceOf(Map);
    
    walletManager.destroy().catch(() => {});
  });

  test('should validate target networks correctly', () => {
    const walletManager = new PhantomWalletManager();
    
    expect(walletManager.validateTargetNetwork('devnet')).toBe(true);
    expect(walletManager.validateTargetNetwork('mainnet-beta')).toBe(true);
    expect(walletManager.validateTargetNetwork('invalid')).toBe(false);
    
    walletManager.destroy().catch(() => {});
  });

  test('should provide network status information', () => {
    const walletManager = new PhantomWalletManager();
    
    const status = walletManager.getNetworkStatus();
    
    expect(status).toHaveProperty('currentNetwork');
    expect(status).toHaveProperty('targetNetwork');
    expect(status).toHaveProperty('networkCompatible');
    expect(status).toHaveProperty('supportedNetworks');
    expect(status).toHaveProperty('networkValidationEnabled');
    expect(status).toHaveProperty('connectionHealthy');
    
    walletManager.destroy().catch(() => {});
  });

  test('should validate network configuration', () => {
    const walletManager = new PhantomWalletManager();
    
    const validation = walletManager.validateNetworkConfiguration();
    
    expect(validation).toHaveProperty('valid');
    expect(validation).toHaveProperty('issues');
    expect(validation).toHaveProperty('warnings');
    expect(validation).toHaveProperty('currentNetwork');
    
    walletManager.destroy().catch(() => {});
  });

  test('should update network validation settings', () => {
    const walletManager = new PhantomWalletManager();
    
    let settingsUpdated = false;
    walletManager.on('networkValidationSettingsUpdated', () => {
      settingsUpdated = true;
    });
    
    walletManager.updateNetworkValidationSettings({
      enabled: false,
      checkInterval: 60000
    });
    
    expect(walletManager.networkValidationEnabled).toBe(false);
    expect(walletManager.networkCheckInterval).toBe(60000);
    expect(settingsUpdated).toBe(true);
    
    walletManager.destroy().catch(() => {});
  });

  test('should handle network switch requests', async () => {
    const walletManager = new PhantomWalletManager();
    
    let switchRequested = false;
    walletManager.on('networkSwitchRequested', () => {
      switchRequested = true;
    });
    
    const result = await walletManager.requestNetworkSwitch('mainnet-beta');
    
    expect(result).toBe(false); // Manual switch required
    expect(switchRequested).toBe(true);
    
    walletManager.destroy().catch(() => {});
  });

  test('should categorize network errors correctly', () => {
    const walletManager = new PhantomWalletManager();
    
    const networkError = new Error('network mismatch detected');
    const categorized = walletManager.categorizeConnectionError(networkError);
    
    expect(categorized.type).toBe('NETWORK_MISMATCH');
    
    walletManager.destroy().catch(() => {});
  });

  test('should not retry network mismatch errors', () => {
    const walletManager = new PhantomWalletManager();
    
    const error = { type: 'NETWORK_MISMATCH' };
    const shouldRetry = walletManager.shouldRetryConnection(error);
    
    expect(shouldRetry).toBe(false);
    
    walletManager.destroy().catch(() => {});
  });

  test('should retry network validation failures', () => {
    const walletManager = new PhantomWalletManager();
    walletManager.retryAttempts = 0; // Reset retry count
    
    const error = { type: 'NETWORK_VALIDATION_FAILED' };
    const shouldRetry = walletManager.shouldRetryConnection(error);
    
    expect(shouldRetry).toBe(true);
    
    walletManager.destroy().catch(() => {});
  });

  test('should include network info in wallet status', () => {
    const walletManager = new PhantomWalletManager();
    
    const status = walletManager.getWalletStatus();
    
    expect(status).toHaveProperty('network');
    expect(status).toHaveProperty('targetNetwork');
    expect(status).toHaveProperty('networkCompatible');
    expect(status).toHaveProperty('networkValidationEnabled');
    expect(status).toHaveProperty('supportedNetworks');
    expect(status).toHaveProperty('rpcEndpointHealthy');
    
    walletManager.destroy().catch(() => {});
  });

  test('should check network switching capability', () => {
    const walletManager = new PhantomWalletManager();
    
    // Currently should return false for Solana wallets
    expect(walletManager.canSwitchNetwork()).toBe(false);
    
    walletManager.destroy().catch(() => {});
  });
});

describe('Network Error Types', () => {
  let PhantomWalletManager;
  
  beforeAll(async () => {
    const module = await import('./phantom-wallet.js');
    PhantomWalletManager = module.PhantomWalletManager;
  });

  test('should have network-specific error types defined', async () => {
    const module = await import('./phantom-wallet.js');
    
    // Check that we have the new error types (indirectly through error messages)
    const walletManager = new PhantomWalletManager();
    
    const networkError = new Error('network mismatch detected');
    const categorized = walletManager.categorizeConnectionError(networkError);
    expect(categorized.type).toBe('NETWORK_MISMATCH');
    
    const rpcError = new Error('all rpc endpoints failed');
    const categorizedRpc = walletManager.categorizeConnectionError(rpcError);
    expect(categorizedRpc.type).toBe('RPC_ENDPOINT_FAILED');
    
    walletManager.destroy().catch(() => {});
  });
});

describe('Network Monitoring', () => {
  let PhantomWalletManager;
  
  beforeAll(async () => {
    const module = await import('./phantom-wallet.js');
    PhantomWalletManager = module.PhantomWalletManager;
  });

  test('should start and stop network monitoring', () => {
    const walletManager = new PhantomWalletManager();
    
    // Start monitoring
    walletManager.startNetworkMonitoring();
    expect(walletManager.networkMonitoringInterval).toBeDefined();
    
    // Stop monitoring
    walletManager.stopNetworkMonitoring();
    expect(walletManager.networkMonitoringInterval).toBeNull();
    
    walletManager.destroy().catch(() => {});
  });

  test('should cleanup network monitoring on destroy', async () => {
    const walletManager = new PhantomWalletManager();
    
    walletManager.startNetworkMonitoring();
    const wasMonitoring = !!walletManager.networkMonitoringInterval;
    
    await walletManager.destroy();
    
    expect(wasMonitoring).toBe(true);
    expect(walletManager.networkMonitoringInterval).toBeNull();
  });
});

describe('Integration with existing features', () => {
  let PhantomWalletManager;
  
  beforeAll(async () => {
    const module = await import('./phantom-wallet.js');
    PhantomWalletManager = module.PhantomWalletManager;
  });

  test('should maintain backward compatibility with getConnectionInfo', () => {
    const walletManager = new PhantomWalletManager();
    
    // Should not throw and should have network properties
    const info = walletManager.getConnectionInfo();
    
    if (info) {
      expect(info).toHaveProperty('network');
      expect(info).toHaveProperty('networkValidationEnabled');
    } else {
      // If not connected, should return null (expected behavior)
      expect(info).toBeNull();
    }
    
    walletManager.destroy().catch(() => {});
  });

  test('should maintain backward compatibility with existing events', () => {
    const walletManager = new PhantomWalletManager();
    
    let eventReceived = false;
    walletManager.on('connected', () => {
      eventReceived = true;
    });
    
    // Emit test event
    walletManager.emit('connected', { test: true });
    
    expect(eventReceived).toBe(true);
    
    walletManager.destroy().catch(() => {});
  });
});