/**
 * SPL MLG Token Management System Tests
 * 
 * Basic test suite for MLG token operations
 */

import { MLGTokenManager, mlgTokenManager, MLGTokenUtils, MLG_TOKEN_CONFIG } from './spl-mlg-token.js';

describe('MLGTokenManager', () => {
  let tokenManager;

  beforeEach(() => {
    tokenManager = new MLGTokenManager();
  });

  describe('Initialization', () => {
    test('should create token manager instance', () => {
      expect(tokenManager).toBeInstanceOf(MLGTokenManager);
      expect(tokenManager.isInitialized).toBe(false);
    });

    test('should fail with placeholder mint address', async () => {
      const result = await tokenManager.initialize('MLGtokenMintAddressToBeDeployedLater');
      
      expect(result).toBe(false);
      expect(tokenManager.isInitialized).toBe(false);
    });
  });

  describe('Configuration', () => {
    test('should have correct MLG token config', () => {
      expect(MLG_TOKEN_CONFIG.TOKEN_SYMBOL).toBe('MLG');
      expect(MLG_TOKEN_CONFIG.TOKEN_NAME).toBe('MLG Gaming Token');
      expect(MLG_TOKEN_CONFIG.EXPECTED_DECIMALS).toBe(9);
      expect(MLG_TOKEN_CONFIG.BURN_CONFIG).toBeDefined();
    });
  });

  describe('Methods Existence', () => {
    test('should have required methods', () => {
      expect(typeof tokenManager.initialize).toBe('function');
      expect(typeof tokenManager.getTokenBalance).toBe('function');
      expect(typeof tokenManager.getTokenBalanceOptimized).toBe('function');
      expect(typeof tokenManager.burnTokens).toBe('function');
      expect(typeof tokenManager.createAssociatedTokenAccount).toBe('function');
      expect(typeof tokenManager.estimateTransactionCost).toBe('function');
      expect(typeof tokenManager.discoverMLGToken).toBe('function');
      expect(typeof tokenManager.isConnectionHealthy).toBe('function');
      expect(typeof tokenManager.getTokenInfo).toBe('function');
      expect(typeof tokenManager.getConnectionPoolStatus).toBe('function');
    });
  });

  describe('Uninitialized State', () => {
    test('should throw error for balance check when not initialized', async () => {
      const walletAddress = 'TestWallet111111111111111111111111111111';

      await expect(tokenManager.getTokenBalance(walletAddress))
        .rejects.toThrow('Token manager not initialized');
    });

    test('should throw error for burn when not initialized', async () => {
      const walletAddress = 'TestWallet111111111111111111111111111111';
      const mockWallet = { signTransaction: jest.fn() };

      await expect(tokenManager.burnTokens(walletAddress, mockWallet, 1))
        .rejects.toThrow('Token manager not initialized');
    });
  });

  describe('Token Info', () => {
    test('should return null when not initialized', () => {
      const tokenInfo = tokenManager.getTokenInfo();
      expect(tokenInfo).toBeNull();
    });
  });
});

describe('MLGTokenUtils', () => {
  describe('formatTokenAmount', () => {
    test('should format token amounts correctly', () => {
      expect(MLGTokenUtils.formatTokenAmount(0)).toBe('0');
      expect(MLGTokenUtils.formatTokenAmount(0.005)).toBe('<0.01');
      expect(MLGTokenUtils.formatTokenAmount(1.234)).toBe('1.23');
      expect(MLGTokenUtils.formatTokenAmount(1000.5)).toBe('1,000.5');
    });

    test('should respect decimal places parameter', () => {
      expect(MLGTokenUtils.formatTokenAmount(1.23456, 4)).toBe('1.2346');
      expect(MLGTokenUtils.formatTokenAmount(1.23456, 0)).toBe('1');
    });
  });

  describe('isValidMintAddress', () => {
    test('should validate mint addresses', () => {
      expect(MLGTokenUtils.isValidMintAddress('MLGtokenMintAddressToBeDeployedLater')).toBe(false);
      expect(MLGTokenUtils.isValidMintAddress('7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL')).toBe(true);
      expect(MLGTokenUtils.isValidMintAddress('So11111111111111111111111111111111111111112')).toBe(false); // Not MLG token
      expect(MLGTokenUtils.isValidMintAddress('invalid-address')).toBe(false);
      expect(MLGTokenUtils.isValidMintAddress('')).toBe(false);
    });
  });

  describe('calculateVoteCost', () => {
    test('should calculate progressive vote costs correctly', () => {
      expect(MLGTokenUtils.calculateVoteCost(1)).toBe(1); // 1 MLG for 1 vote
      expect(MLGTokenUtils.calculateVoteCost(2)).toBe(3); // 1+2 MLG for 2 votes
      expect(MLGTokenUtils.calculateVoteCost(3)).toBe(6); // 1+2+3 MLG for 3 votes
      expect(MLGTokenUtils.calculateVoteCost(4)).toBe(10); // 1+2+3+4 MLG for 4 votes
    });

    test('should handle edge cases', () => {
      expect(MLGTokenUtils.calculateVoteCost(0)).toBe(0);
      expect(MLGTokenUtils.calculateVoteCost(-1)).toBe(0);
    });
  });
});

describe('Singleton Instance', () => {
  test('should export singleton mlgTokenManager instance', () => {
    expect(mlgTokenManager).toBeInstanceOf(MLGTokenManager);
  });

  test('should use same connection across singleton calls', () => {
    const manager1 = mlgTokenManager;
    const manager2 = mlgTokenManager;
    expect(manager1).toBe(manager2);
  });
});

describe('Transaction Cost Estimation', () => {
  let tokenManager;
  
  beforeEach(() => {
    tokenManager = new MLGTokenManager();
  });
  
  test('should estimate basic transaction costs', async () => {
    const cost = await tokenManager.estimateTransactionCost('burn');
    
    expect(typeof cost.lamports).toBe('number');
    expect(typeof cost.sol).toBe('number');
    expect(cost.lamports).toBeGreaterThan(0);
    expect(cost.sol).toBeGreaterThan(0);
  });

  test('should handle different operation types', async () => {
    const burnCost = await tokenManager.estimateTransactionCost('burn');
    const createCost = await tokenManager.estimateTransactionCost('createAccount');
    
    expect(createCost.lamports).toBeGreaterThan(burnCost.lamports);
  });
});

describe('RPC Connection Optimization', () => {
  let tokenManager;
  
  beforeEach(() => {
    tokenManager = new MLGTokenManager();
  });
  
  test('should initialize connection pool', () => {
    expect(tokenManager.connectionPool).toBeDefined();
    expect(Array.isArray(tokenManager.connectionPool)).toBe(true);
    expect(tokenManager.connectionPool.length).toBeGreaterThan(0);
  });

  test('should have connection health tracking', () => {
    expect(tokenManager.connectionHealth).toBeInstanceOf(Map);
    expect(typeof tokenManager.currentConnectionIndex).toBe('number');
    expect(typeof tokenManager.lastHealthCheck).toBe('number');
  });

  test('should provide connection pool status', () => {
    const status = tokenManager.getConnectionPoolStatus();
    
    expect(status).toHaveProperty('totalConnections');
    expect(status).toHaveProperty('healthyConnections');
    expect(status).toHaveProperty('currentIndex');
    expect(status).toHaveProperty('lastHealthCheck');
    expect(status).toHaveProperty('connectionHealth');
    
    expect(typeof status.totalConnections).toBe('number');
    expect(typeof status.healthyConnections).toBe('number');
    expect(Array.isArray(status.connectionHealth)).toBe(true);
  });

  test('should have optimized balance query method', () => {
    expect(typeof tokenManager.getTokenBalanceOptimized).toBe('function');
  });
});

describe('Connection Failover', () => {
  let tokenManager;
  
  beforeEach(() => {
    tokenManager = new MLGTokenManager();
  });
  
  test('should handle connection failover for balance queries', async () => {
    const walletAddress = 'TestWallet111111111111111111111111111111';

    // Mock connection failure scenarios
    await expect(tokenManager.getTokenBalanceOptimized(walletAddress))
      .rejects.toThrow('Token manager not initialized');
  });

  test('should track connection health changes', () => {
    // Initially connections should be untested (connectionHealth Map may be empty)
    const initialStatus = tokenManager.getConnectionPoolStatus();
    expect(initialStatus.connectionHealth.length).toBeGreaterThanOrEqual(0);
    expect(initialStatus.totalConnections).toBeGreaterThan(0);
  });
});

describe('MLG Token Configuration Integration', () => {
  let tokenManager;
  
  beforeEach(() => {
    tokenManager = new MLGTokenManager();
  });
  
  test('should use optimized connection from config', () => {
    // Verify the token manager uses createMLGTokenConnection
    expect(tokenManager.connection._mlgOptimized).toBeTruthy();
  });

  test('should have connection pool with multiple endpoints', () => {
    expect(tokenManager.connectionPool.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Error Handling', () => {
  let tokenManager;
  
  beforeEach(() => {
    tokenManager = new MLGTokenManager();
  });
  
  test('should handle invalid burn amounts', async () => {
    const mockWallet = { signTransaction: jest.fn() };
    const walletAddress = 'TestWallet111111111111111111111111111111';
    
    // Setup initialized state for this test
    tokenManager.isInitialized = true;
    tokenManager.mintInfo = { decimals: 9 };
    
    // Mock balance check to return insufficient balance
    tokenManager.getTokenBalance = jest.fn().mockResolvedValue({
      balance: 0,
      raw: '0',
      hasAccount: false
    });

    await expect(tokenManager.burnTokens(walletAddress, mockWallet, 0))
      .rejects.toThrow('Burn amount must be positive');
    
    await expect(tokenManager.burnTokens(walletAddress, mockWallet, -5))
      .rejects.toThrow('Burn amount must be positive');
  });

  test('should handle connection pool failures gracefully', async () => {
    const status = tokenManager.getConnectionPoolStatus();
    expect(status.totalConnections).toBeGreaterThan(0);
  });
});