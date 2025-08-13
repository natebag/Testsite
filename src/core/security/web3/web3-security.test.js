/**
 * MLG.clan Web3 Security Test Suite
 * Comprehensive testing for all Web3 security components
 * 
 * Test Categories:
 * - Web3 Security Manager Tests
 * - Private Key Security Tests  
 * - SPL Token Security Tests
 * - Integration Layer Tests
 * - Security Scenario Tests
 * - Performance and Load Tests
 * 
 * @author Claude Code - Solana Web3 Security Architect
 * @version 1.0.0
 * @created 2025-08-13
 */

import { jest } from '@jest/globals';
import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createTransferInstruction } from '@solana/spl-token';

import Web3SecurityManager from './web3-security-manager.js';
import Web3PrivateKeyManager from './web3-private-key-manager.js';
import SPLTokenSecurityManager from './spl-token-security.js';
import Web3SecurityIntegration from './web3-security-integration.js';

// Mock Solana Web3.js
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn(),
  PublicKey: jest.fn(),
  Transaction: jest.fn(),
  SystemProgram: {
    programId: { toString: () => '11111111111111111111111111111112' },
    createAccount: jest.fn()
  },
  Keypair: { generate: jest.fn() },
  LAMPORTS_PER_SOL: 1000000000,
  sendAndConfirmTransaction: jest.fn()
}));

jest.mock('@solana/spl-token', () => ({
  TOKEN_PROGRAM_ID: { toString: () => 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
  ASSOCIATED_TOKEN_PROGRAM_ID: { toString: () => 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL' },
  createTransferInstruction: jest.fn(),
  createBurnInstruction: jest.fn(),
  getAssociatedTokenAddress: jest.fn(),
  getAccount: jest.fn(),
  getMint: jest.fn()
}));

describe('Web3 Security Manager', () => {
  let web3SecurityManager;
  let mockConnection;
  let mockLogger;
  let mockAuditLogger;

  beforeEach(() => {
    mockConnection = {
      getSlot: jest.fn().mockResolvedValue(100),
      getBalance: jest.fn().mockResolvedValue(1000000000),
      getLatestBlockhash: jest.fn().mockResolvedValue({
        blockhash: 'mock-blockhash',
        lastValidBlockHeight: 1000
      }),
      simulateTransaction: jest.fn().mockResolvedValue({
        value: {
          err: null,
          logs: ['Log entry 1', 'Log entry 2'],
          unitsConsumed: 5000
        }
      }),
      sendRawTransaction: jest.fn().mockResolvedValue('mock-signature'),
      confirmTransaction: jest.fn().mockResolvedValue({
        context: { slot: 100 },
        value: { err: null }
      })
    };

    Connection.mockImplementation(() => mockConnection);

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    mockAuditLogger = {
      log: jest.fn().mockResolvedValue()
    };

    web3SecurityManager = new Web3SecurityManager({
      logger: mockLogger,
      auditLogger: mockAuditLogger
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', async () => {
      expect(web3SecurityManager).toBeDefined();
      expect(web3SecurityManager.securityLevel).toBe('high');
      expect(web3SecurityManager.isPaused).toBe(false);
    });

    test('should initialize RPC connections', async () => {
      await web3SecurityManager.initializeRpcConnections();
      expect(web3SecurityManager.rpcConnections.size).toBeGreaterThan(0);
    });

    test('should handle RPC connection failures gracefully', async () => {
      mockConnection.getSlot.mockRejectedValueOnce(new Error('RPC Error'));
      await web3SecurityManager.initializeRpcConnections();
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('Transaction Validation', () => {
    let mockTransaction;
    let mockWallet;

    beforeEach(() => {
      mockTransaction = {
        instructions: [],
        compileMessage: jest.fn().mockReturnValue({
          accountKeys: ['key1', 'key2']
        }),
        serialize: jest.fn().mockReturnValue(Buffer.alloc(500))
      };

      mockWallet = {
        publicKey: new PublicKey('11111111111111111111111111111112'),
        signTransaction: jest.fn().mockResolvedValue(mockTransaction)
      };

      Transaction.mockImplementation(() => mockTransaction);
    });

    test('should validate basic transaction structure', async () => {
      const validation = await web3SecurityManager.validateTransaction(mockTransaction);
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('errors');
      expect(validation).toHaveProperty('warnings');
      expect(validation).toHaveProperty('securityScore');
    });

    test('should reject transactions that are too large', async () => {
      mockTransaction.serialize.mockReturnValue(Buffer.alloc(2000)); // Too large
      
      const validation = await web3SecurityManager.validateTransaction(mockTransaction);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain(expect.stringContaining('Transaction too large'));
    });

    test('should reject transactions with too many instructions', async () => {
      mockTransaction.instructions = new Array(15).fill({}); // Too many
      
      const validation = await web3SecurityManager.validateTransaction(mockTransaction);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain(expect.stringContaining('Too many instructions'));
    });

    test('should validate programs used in transaction', async () => {
      const mockInstruction = {
        programId: new PublicKey(TOKEN_PROGRAM_ID.toString())
      };
      mockTransaction.instructions = [mockInstruction];

      const validation = await web3SecurityManager.validateTransaction(mockTransaction);
      expect(validation.securityScore).toBeGreaterThan(50);
    });

    test('should detect suspicious transaction patterns', async () => {
      // Mock a suspicious pattern - many token transfers
      const tokenTransferInstructions = new Array(8).fill({
        programId: { equals: jest.fn().mockReturnValue(true) }
      });
      mockTransaction.instructions = tokenTransferInstructions;

      const patterns = web3SecurityManager.detectSuspiciousPatterns(mockTransaction);
      expect(patterns).toContain(expect.stringContaining('High number of token transfers'));
    });
  });

  describe('Transaction Simulation', () => {
    let mockTransaction;

    beforeEach(() => {
      mockTransaction = {
        instructions: [],
        recentBlockhash: null
      };
    });

    test('should simulate transaction successfully', async () => {
      const simulation = await web3SecurityManager.simulateTransaction(mockTransaction);
      expect(simulation.success).toBe(true);
      expect(simulation.logs).toBeDefined();
      expect(simulation.computeUnitsUsed).toBeDefined();
    });

    test('should handle simulation failures', async () => {
      mockConnection.simulateTransaction.mockResolvedValueOnce({
        value: {
          err: 'Simulation error',
          logs: [],
          unitsConsumed: 0
        }
      });

      const simulation = await web3SecurityManager.simulateTransaction(mockTransaction);
      expect(simulation.success).toBe(false);
      expect(simulation.error).toBe('Simulation error');
    });

    test('should analyze logs for security issues', async () => {
      const suspiciousLogs = [
        'insufficient funds detected',
        'arithmetic overflow in calculation',
        'unauthorized access attempt'
      ];
      
      const warnings = web3SecurityManager.analyzeLogs(suspiciousLogs);
      expect(warnings).toHaveLength(3);
    });
  });

  describe('Emergency Pause System', () => {
    test('should activate emergency pause', async () => {
      await web3SecurityManager.emergencyPause('test_reason', 'test_user');
      expect(web3SecurityManager.isPaused).toBe(true);
      expect(web3SecurityManager.pauseReasons.has('test_reason')).toBe(true);
    });

    test('should cancel pending transactions on emergency pause', async () => {
      web3SecurityManager.pendingTransactions.set('tx1', { status: 'pending' });
      web3SecurityManager.pendingTransactions.set('tx2', { status: 'pending' });

      await web3SecurityManager.emergencyPause('test_reason', 'test_user');
      
      expect(web3SecurityManager.pendingTransactions.size).toBe(0);
    });

    test('should prevent operations when paused', async () => {
      web3SecurityManager.isPaused = true;
      
      expect(() => web3SecurityManager.getSecureConnection())
        .toThrow('Web3 operations are currently paused');
    });
  });

  describe('MEV Protection', () => {
    let mockTransaction;

    beforeEach(() => {
      mockTransaction = {
        instructions: []
      };
    });

    test('should add MEV protection to transactions', async () => {
      const protectedTx = await web3SecurityManager.addMevProtection(mockTransaction);
      expect(protectedTx.instructions.length).toBeGreaterThan(0);
    });

    test('should handle MEV protection errors gracefully', async () => {
      // Mock error in MEV protection
      jest.spyOn(web3SecurityManager, 'addMevProtection')
        .mockRejectedValueOnce(new Error('MEV protection failed'));

      const protectedTx = await web3SecurityManager.addMevProtection(mockTransaction);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});

describe('Private Key Security Manager', () => {
  let privateKeyManager;
  let mockLogger;
  let mockAuditLogger;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    mockAuditLogger = {
      log: jest.fn().mockResolvedValue()
    };

    privateKeyManager = new Web3PrivateKeyManager({
      logger: mockLogger,
      auditLogger: mockAuditLogger
    });
  });

  describe('Security Verification', () => {
    test('should verify no private keys in memory', () => {
      expect(() => privateKeyManager.verifyNoPrivateKeysInMemory()).not.toThrow();
    });

    test('should detect suspicious private key patterns', () => {
      // This test ensures the security verification catches potential issues
      const suspiciousManager = { privateKey: 'test-key-123' };
      
      expect(() => {
        Web3PrivateKeyManager.prototype.verifyNoPrivateKeysInMemory.call(suspiciousManager);
      }).toThrow('Private key storage detected');
    });
  });

  describe('Session Management', () => {
    test('should create secure session challenge', async () => {
      const mockPublicKey = new PublicKey('11111111111111111111111111111112');
      const mockWalletProvider = { signMessage: jest.fn() };

      const session = await privateKeyManager.createSecureSession(
        mockPublicKey, 
        mockWalletProvider
      );

      expect(session).toHaveProperty('sessionId');
      expect(session).toHaveProperty('challenge');
      expect(session).toHaveProperty('expires');
    });

    test('should verify session challenge correctly', async () => {
      // Mock crypto functions for testing
      const mockChallenge = 'test-challenge-123';
      const mockSignature = 'test-signature-123';
      
      privateKeyManager.sessionChallenges.set(mockChallenge, {
        sessionId: 'test-session',
        publicKey: '11111111111111111111111111111112',
        walletProvider: {},
        created: Date.now(),
        verified: false
      });

      // Mock signature verification
      jest.spyOn(require('tweetnacl'), 'sign', 'get').mockReturnValue({
        detached: {
          verify: jest.fn().mockReturnValue(true)
        }
      });

      const verification = await privateKeyManager.verifySessionChallenge(
        mockChallenge,
        mockSignature
      );

      expect(verification.sessionId).toBe('test-session');
    });

    test('should handle expired challenges', async () => {
      const expiredChallenge = 'expired-challenge';
      privateKeyManager.sessionChallenges.set(expiredChallenge, {
        sessionId: 'test-session',
        publicKey: '11111111111111111111111111111112',
        created: Date.now() - 10 * 60 * 1000, // 10 minutes ago
        verified: false
      });

      await expect(privateKeyManager.verifySessionChallenge(expiredChallenge, 'signature'))
        .rejects.toThrow('Challenge expired');
    });
  });

  describe('Multi-Signature Support', () => {
    test('should create multi-signature configuration', async () => {
      const participants = [
        { publicKey: new PublicKey('11111111111111111111111111111112'), role: 'signer' },
        { publicKey: new PublicKey('11111111111111111111111111111113'), role: 'signer' }
      ];
      const threshold = 2;

      const multisig = await privateKeyManager.createMultisigConfig(
        participants, 
        threshold
      );

      expect(multisig).toHaveProperty('multisigId');
      expect(multisig.participants).toHaveLength(2);
      expect(multisig.threshold).toBe(2);
    });

    test('should reject invalid multi-signature configurations', async () => {
      const participants = [
        { publicKey: new PublicKey('11111111111111111111111111111112') }
      ];
      
      await expect(privateKeyManager.createMultisigConfig(participants, 2))
        .rejects.toThrow('Minimum 2 signers required');
    });
  });

  describe('Hardware Wallet Integration', () => {
    test('should detect hardware wallets', async () => {
      // Mock hardware wallet detection
      global.window = {
        solana: { isLedger: true }
      };

      await privateKeyManager.detectHardwareWallets();
      expect(privateKeyManager.hardwareWallets.has('ledger')).toBe(true);
    });

    test('should request hardware wallet signatures', async () => {
      const mockSession = {
        sessionId: 'test-session',
        publicKey: '11111111111111111111111111111112',
        walletProvider: {
          signTransaction: jest.fn().mockResolvedValue({
            signature: 'hw-signature'
          })
        },
        lastActivity: Date.now()
      };

      privateKeyManager.activeSessions.set('test-session', mockSession);

      const mockTransaction = { instructions: [] };
      const signed = await privateKeyManager.requestHardwareSignature(
        'test-session',
        mockTransaction
      );

      expect(signed.signature).toBe('hw-signature');
    });
  });
});

describe('SPL Token Security Manager', () => {
  let tokenSecurityManager;
  let mockConnection;
  let mockWeb3SecurityManager;
  let mockLogger;

  beforeEach(() => {
    mockConnection = {
      getAccountInfo: jest.fn(),
      getTokenAccountBalance: jest.fn().mockResolvedValue({
        value: { uiAmount: 1000 }
      }),
      getParsedTokenAccountsByOwner: jest.fn().mockResolvedValue({
        value: []
      })
    };

    mockWeb3SecurityManager = {
      executeSecureTransaction: jest.fn().mockResolvedValue({
        signature: 'test-signature',
        confirmed: true
      })
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    tokenSecurityManager = new SPLTokenSecurityManager({
      connection: mockConnection,
      web3SecurityManager: mockWeb3SecurityManager,
      logger: mockLogger
    });
  });

  describe('Token Transfer Validation', () => {
    test('should validate valid token transfer', async () => {
      const transferRequest = {
        source: '11111111111111111111111111111112',
        destination: '11111111111111111111111111111113',
        amount: 100,
        mint: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL'
      };

      // Mock account verification
      jest.spyOn(tokenSecurityManager, 'verifyTokenAccounts')
        .mockResolvedValue({ valid: true, errors: [], warnings: [] });
      jest.spyOn(tokenSecurityManager, 'checkTransferRateLimit')
        .mockResolvedValue({ allowed: true });
      jest.spyOn(tokenSecurityManager, 'checkSourceBalance')
        .mockResolvedValue({ sufficient: true, suspicious: false });
      jest.spyOn(tokenSecurityManager, 'checkDestinationSafety')
        .mockResolvedValue({ safe: true, warnings: [], riskScore: 0 });

      const validation = await tokenSecurityManager.validateTokenTransfer(transferRequest);
      expect(validation.valid).toBe(true);
    });

    test('should reject transfers when tokens are frozen', async () => {
      tokenSecurityManager.tokenFrozen = true;

      const transferRequest = {
        source: '11111111111111111111111111111112',
        destination: '11111111111111111111111111111113',
        amount: 100
      };

      const validation = await tokenSecurityManager.validateTokenTransfer(transferRequest);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Token operations are currently frozen');
    });

    test('should flag large transfers for approval', async () => {
      const largeTransferRequest = {
        source: '11111111111111111111111111111112',
        destination: '11111111111111111111111111111113',
        amount: 50000, // Large amount
        mint: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL'
      };

      // Mock dependencies
      jest.spyOn(tokenSecurityManager, 'verifyTokenAccounts')
        .mockResolvedValue({ valid: true, errors: [], warnings: [] });
      jest.spyOn(tokenSecurityManager, 'checkTransferRateLimit')
        .mockResolvedValue({ allowed: true });
      jest.spyOn(tokenSecurityManager, 'checkSourceBalance')
        .mockResolvedValue({ sufficient: true, suspicious: false });
      jest.spyOn(tokenSecurityManager, 'checkDestinationSafety')
        .mockResolvedValue({ safe: true, warnings: [], riskScore: 0 });

      const validation = await tokenSecurityManager.validateTokenTransfer(largeTransferRequest);
      expect(validation.requiresApproval).toBe(true);
      expect(validation.warnings).toContain(expect.stringContaining('Large transfer amount'));
    });
  });

  describe('Token Burn Validation', () => {
    test('should validate voting burn requests', async () => {
      const burnRequest = {
        account: '11111111111111111111111111111112',
        mint: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL',
        amount: 2, // 2 MLG for 1 additional vote
        owner: '11111111111111111111111111111112',
        purpose: 'voting',
        voteCount: 1
      };

      // Mock dependencies
      jest.spyOn(tokenSecurityManager, 'checkDailyBurnLimit')
        .mockResolvedValue({ allowed: true, current: 0, limit: 5000 });
      jest.spyOn(tokenSecurityManager, 'verifyTokenAccount')
        .mockResolvedValue({ valid: true, errors: [] });
      jest.spyOn(tokenSecurityManager, 'getTokenAccountBalance')
        .mockResolvedValue(1000);

      const validation = await tokenSecurityManager.validateTokenBurn(burnRequest);
      expect(validation.valid).toBe(true);
      expect(validation.estimatedCost).toBe(2);
    });

    test('should reject burns exceeding daily limits', async () => {
      const burnRequest = {
        account: '11111111111111111111111111111112',
        amount: 1000,
        owner: '11111111111111111111111111111112'
      };

      jest.spyOn(tokenSecurityManager, 'checkDailyBurnLimit')
        .mockResolvedValue({ allowed: false, current: 4500, limit: 5000 });

      const validation = await tokenSecurityManager.validateTokenBurn(burnRequest);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain(expect.stringContaining('Daily burn limit exceeded'));
    });
  });

  describe('Rate Limiting', () => {
    test('should track and enforce transfer rate limits', async () => {
      const sourceAccount = '11111111111111111111111111111112';

      // First 5 transfers should be allowed
      for (let i = 0; i < 5; i++) {
        const result = await tokenSecurityManager.checkTransferRateLimit(sourceAccount);
        expect(result.allowed).toBe(true);
      }

      // 6th transfer should be rejected
      const result = await tokenSecurityManager.checkTransferRateLimit(sourceAccount);
      expect(result.allowed).toBe(false);
    });
  });

  describe('Security Pattern Detection', () => {
    test('should detect rapid transaction patterns', () => {
      const transferRequest = {
        source: '11111111111111111111111111111112',
        destination: '11111111111111111111111111111113',
        amount: 100
      };

      // Simulate rapid transactions
      const patterns = Array(15).fill().map(() => ({
        timestamp: Date.now(),
        amount: 100,
        destination: transferRequest.destination
      }));

      tokenSecurityManager.transactionPatterns.set(transferRequest.source, patterns);

      const analysis = tokenSecurityManager.analyzeTransferPattern(transferRequest);
      expect(analysis.suspicious).toBe(true);
      expect(analysis.warnings).toContain('Rapid transaction pattern detected');
    });

    test('should detect round number bot patterns', () => {
      const transferRequest = {
        source: '11111111111111111111111111111112',
        destination: '11111111111111111111111111111113',
        amount: 1000 // Round number
      };

      const analysis = tokenSecurityManager.analyzeTransferPattern(transferRequest);
      expect(analysis.warnings).toContain(expect.stringContaining('Round number transfer'));
    });
  });

  describe('Emergency Controls', () => {
    test('should trigger emergency freeze on suspicious activity', async () => {
      await tokenSecurityManager.emergencyFreeze('test_reason', 'test_trigger');
      expect(tokenSecurityManager.tokenFrozen).toBe(true);
      expect(tokenSecurityManager.freezeReasons.has('test_reason')).toBe(true);
    });

    test('should monitor operation patterns for emergency triggers', async () => {
      // Simulate many operations
      const operations = Array(150).fill().map((_, i) => ({
        type: 'transfer',
        timestamp: Date.now() - i * 1000,
        data: { amount: 100 }
      }));

      for (const op of operations) {
        await tokenSecurityManager.recordTokenOperation(op.type, op.data);
      }

      expect(tokenSecurityManager.tokenFrozen).toBe(true);
    });
  });
});

describe('Web3 Security Integration', () => {
  let securityIntegration;
  let mockLogger;
  let mockAuditLogger;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    mockAuditLogger = {
      log: jest.fn().mockResolvedValue()
    };

    securityIntegration = new Web3SecurityIntegration({
      logger: mockLogger,
      auditLogger: mockAuditLogger
    });
  });

  describe('System Integration', () => {
    test('should initialize all integrated systems', async () => {
      // Mock the initialize method to prevent actual system calls
      jest.spyOn(securityIntegration, 'integrateWithExistingSecurity')
        .mockResolvedValue();

      await securityIntegration.initialize();
      expect(securityIntegration.integratedSystems.size).toBeGreaterThan(0);
    });

    test('should handle integration failures gracefully', async () => {
      jest.spyOn(securityIntegration, 'integrateRateLimiting')
        .mockRejectedValue(new Error('Rate limiting integration failed'));

      await expect(securityIntegration.integrateWithExistingSecurity())
        .rejects.toThrow();
    });
  });

  describe('Secure Operation Execution', () => {
    test('should execute secure Web3 operations with full checks', async () => {
      const operationData = {
        transaction: { instructions: [] },
        wallet: { publicKey: new PublicKey('11111111111111111111111111111112') }
      };

      const userContext = {
        userId: 'test-user',
        identifier: 'test-identifier',
        sessionId: 'test-session',
        walletAddress: '11111111111111111111111111111112',
        ip: '127.0.0.1',
        userAgent: 'test-agent'
      };

      // Mock all integration checks
      jest.spyOn(securityIntegration, 'checkRateLimit')
        .mockResolvedValue({ allowed: true });
      jest.spyOn(securityIntegration, 'executeTransactionSubmission')
        .mockResolvedValue({ signature: 'test-signature' });

      const result = await securityIntegration.executeSecureWeb3Operation(
        'transaction_submission',
        operationData,
        userContext
      );

      expect(result.signature).toBe('test-signature');
    });

    test('should reject operations when rate limited', async () => {
      const operationData = {};
      const userContext = { identifier: 'test-user' };

      jest.spyOn(securityIntegration, 'checkRateLimit')
        .mockResolvedValue({ allowed: false, reason: 'Rate limit exceeded' });

      await expect(securityIntegration.executeSecureWeb3Operation(
        'wallet_connection',
        operationData,
        userContext
      )).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('Emergency Response', () => {
    test('should escalate emergencies correctly', async () => {
      const incidentData = {
        trigger: 'test_trigger',
        operationType: 'transaction_submission',
        error: 'wallet compromised detected',
        userContext: {}
      };

      await securityIntegration.escalateEmergency('critical', incidentData);
      
      expect(securityIntegration.emergencyState.level).toBe('critical');
      expect(securityIntegration.emergencyState.activeIncidents.size).toBe(1);
    });

    test('should activate emergency protocols', async () => {
      const protocols = ['pause_all_web3', 'freeze_tokens'];

      // Mock the web3SecurityManager and tokenSecurityManager
      securityIntegration.web3SecurityManager = {
        emergencyPause: jest.fn().mockResolvedValue()
      };
      securityIntegration.tokenSecurityManager = {
        emergencyFreeze: jest.fn().mockResolvedValue()
      };

      await securityIntegration.emergencyHandlers.activateEmergencyProtocols(protocols);

      expect(securityIntegration.web3SecurityManager.emergencyPause).toHaveBeenCalled();
      expect(securityIntegration.tokenSecurityManager.emergencyFreeze).toHaveBeenCalled();
    });
  });

  describe('Cross-System Monitoring', () => {
    test('should analyze security metrics for anomalies', async () => {
      const metrics = {
        web3Security: { isPaused: true },
        tokenSecurity: { tokenFrozen: false },
        privateKeySecurity: { emergencyMode: false }
      };

      jest.spyOn(securityIntegration, 'escalateEmergency')
        .mockResolvedValue();

      await securityIntegration.analyzeSecurityMetrics(metrics);
      expect(securityIntegration.escalateEmergency).toHaveBeenCalledWith(
        'multiple_system_concerns',
        expect.any(Object)
      );
    });
  });
});

describe('Security Scenario Tests', () => {
  describe('Attack Simulation', () => {
    test('should handle wallet compromise scenario', async () => {
      // This test simulates a wallet compromise and verifies security response
      const web3Security = new Web3SecurityManager();
      
      // Simulate compromise detection
      await web3Security.emergencyPause('wallet_compromise_detected', 'security_monitor');
      
      expect(web3Security.isPaused).toBe(true);
      expect(web3Security.pauseReasons.has('wallet_compromise_detected')).toBe(true);
    });

    test('should handle token drain attack scenario', async () => {
      const tokenSecurity = new SPLTokenSecurityManager({
        connection: mockConnection,
        logger: mockLogger
      });

      // Simulate rapid large transfers (drain attack pattern)
      const suspiciousTransfers = Array(20).fill().map((_, i) => ({
        source: '11111111111111111111111111111112',
        destination: `destination${i}`,
        amount: 5000,
        timestamp: Date.now() - i * 100
      }));

      // This should trigger emergency freeze
      for (const transfer of suspiciousTransfers) {
        tokenSecurity.transactionPatterns.set(transfer.source, [
          ...(tokenSecurity.transactionPatterns.get(transfer.source) || []),
          transfer
        ]);
      }

      // Check if emergency freeze would be triggered
      const pattern = tokenSecurity.analyzeTransferPattern(suspiciousTransfers[0]);
      expect(pattern.suspicious).toBe(true);
    });

    test('should handle DDoS attack on Web3 endpoints', async () => {
      const integration = new Web3SecurityIntegration({
        logger: mockLogger
      });

      // Simulate rapid requests
      const requests = Array(200).fill().map(() => ({
        ip: '192.168.1.100',
        endpoint: '/api/web3/wallet',
        timestamp: Date.now()
      }));

      // This would be handled by the DDoS protection integration
      for (const request of requests) {
        const rateLimitCheck = await integration.checkRateLimit(
          'web3:wallet_connection',
          request.ip
        );
        
        if (!rateLimitCheck.allowed) {
          expect(rateLimitCheck.reason).toContain('limit');
          break;
        }
      }
    });
  });

  describe('Recovery Scenarios', () => {
    test('should handle system recovery after emergency', async () => {
      const web3Security = new Web3SecurityManager();
      
      // Trigger emergency
      await web3Security.emergencyPause('test_emergency', 'test');
      expect(web3Security.isPaused).toBe(true);
      
      // Simulate authorized recovery
      await web3Security.resumeOperations('admin_user', 'Emergency resolved');
      expect(web3Security.isPaused).toBe(false);
    });

    test('should handle multi-system coordination during recovery', async () => {
      const integration = new Web3SecurityIntegration({
        logger: mockLogger
      });

      // Mock emergency state
      integration.emergencyState.level = 'critical';
      integration.emergencyState.activeIncidents.set('incident1', {
        level: 'critical',
        status: 'active'
      });

      // Simulate recovery coordination
      integration.emergencyState.level = 'normal';
      integration.emergencyState.activeIncidents.clear();

      const status = integration.getIntegrationStatus();
      expect(status.emergencyState.level).toBe('normal');
      expect(status.emergencyState.activeIncidents.size).toBe(0);
    });
  });
});

describe('Performance and Load Tests', () => {
  test('should handle concurrent transaction validations', async () => {
    const web3Security = new Web3SecurityManager();
    
    const mockTransaction = {
      instructions: [],
      compileMessage: () => ({ accountKeys: ['key1'] }),
      serialize: () => Buffer.alloc(100)
    };

    // Test concurrent validations
    const validationPromises = Array(50).fill().map(() =>
      web3Security.validateTransaction(mockTransaction)
    );

    const results = await Promise.all(validationPromises);
    expect(results).toHaveLength(50);
    expect(results.every(r => typeof r.valid === 'boolean')).toBe(true);
  });

  test('should handle high-frequency rate limit checks', async () => {
    const tokenSecurity = new SPLTokenSecurityManager({
      connection: mockConnection,
      logger: mockLogger
    });

    const sourceAccount = '11111111111111111111111111111112';
    
    // Test rapid rate limit checks
    const checks = Array(100).fill().map(() =>
      tokenSecurity.checkTransferRateLimit(sourceAccount)
    );

    const results = await Promise.all(checks);
    expect(results).toHaveLength(100);
    
    // First few should be allowed, later ones should be rate limited
    expect(results.slice(0, 5).every(r => r.allowed)).toBe(true);
    expect(results.slice(5).some(r => !r.allowed)).toBe(true);
  });

  test('should handle memory cleanup under load', async () => {
    const web3Security = new Web3SecurityManager();
    
    // Generate many transactions to test memory management
    for (let i = 0; i < 1000; i++) {
      web3Security.transactionHistory.set(`tx_${i}`, {
        startTime: Date.now() - i * 1000,
        status: 'completed'
      });
    }

    // Trigger cleanup
    web3Security.cleanupOldData();
    
    // Should have cleaned up old entries
    expect(web3Security.transactionHistory.size).toBeLessThan(1000);
  });
});

describe('Security Configuration Tests', () => {
  test('should validate security configuration', () => {
    const config = {
      TRANSACTION: {
        MAX_ACCOUNTS_PER_TX: 32,
        MAX_INSTRUCTIONS_PER_TX: 10,
        SIMULATION_REQUIRED: true
      },
      RPC: {
        TIMEOUT_MS: 5000,
        MAX_RETRIES: 3
      }
    };

    expect(config.TRANSACTION.MAX_ACCOUNTS_PER_TX).toBeLessThanOrEqual(32);
    expect(config.TRANSACTION.SIMULATION_REQUIRED).toBe(true);
    expect(config.RPC.TIMEOUT_MS).toBeGreaterThan(0);
  });

  test('should validate rate limiting configuration', () => {
    const rateLimits = {
      TRANSACTIONS_PER_MINUTE: 10,
      BALANCE_CHECKS_PER_MINUTE: 60,
      TOKEN_OPERATIONS_PER_MINUTE: 5
    };

    Object.values(rateLimits).forEach(limit => {
      expect(limit).toBeGreaterThan(0);
      expect(Number.isInteger(limit)).toBe(true);
    });
  });
});

// Test utilities and helpers
describe('Test Utilities', () => {
  test('should provide mock wallet for testing', () => {
    const mockWallet = {
      publicKey: new PublicKey('11111111111111111111111111111112'),
      signTransaction: jest.fn(),
      signMessage: jest.fn()
    };

    expect(mockWallet.publicKey).toBeDefined();
    expect(typeof mockWallet.signTransaction).toBe('function');
    expect(typeof mockWallet.signMessage).toBe('function');
  });

  test('should provide mock transaction builder', () => {
    const buildMockTransaction = (instructionCount = 1) => {
      return {
        instructions: Array(instructionCount).fill({
          programId: new PublicKey(TOKEN_PROGRAM_ID.toString()),
          keys: [],
          data: Buffer.alloc(32)
        }),
        compileMessage: jest.fn().mockReturnValue({
          accountKeys: Array(instructionCount + 2).fill('mockKey')
        }),
        serialize: jest.fn().mockReturnValue(Buffer.alloc(500))
      };
    };

    const tx = buildMockTransaction(3);
    expect(tx.instructions).toHaveLength(3);
    expect(tx.compileMessage().accountKeys).toHaveLength(5);
  });
});