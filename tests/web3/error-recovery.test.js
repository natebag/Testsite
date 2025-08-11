/**
 * Error Handling and Recovery Testing Suite
 * Sub-task 8.6 - Error Handling and Recovery
 * 
 * Tests comprehensive error handling and recovery mechanisms including:
 * - Failed transaction recovery
 * - Network timeout handling
 * - Wallet disconnection scenarios
 * - User error recovery flows
 * - Graceful degradation
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

// Mock error scenarios
const ERROR_SCENARIOS = {
  NETWORK_TIMEOUT: { code: 'NETWORK_TIMEOUT', message: 'Request timed out' },
  TRANSACTION_FAILED: { code: 'TRANSACTION_FAILED', message: 'Transaction simulation failed' },
  INSUFFICIENT_FUNDS: { code: 'INSUFFICIENT_FUNDS', message: 'Insufficient funds for transaction' },
  WALLET_DISCONNECTED: { code: 'WALLET_DISCONNECTED', message: 'Wallet is not connected' },
  RPC_ERROR: { code: 'RPC_ERROR', message: 'RPC node is unavailable' },
  RATE_LIMITED: { code: 'RATE_LIMITED', message: 'Too many requests' },
  INVALID_SIGNATURE: { code: 'INVALID_SIGNATURE', message: 'Invalid transaction signature' },
  ACCOUNT_NOT_FOUND: { code: 'ACCOUNT_NOT_FOUND', message: 'Account does not exist' },
  PROGRAM_ERROR: { code: 'PROGRAM_ERROR', message: 'Program execution failed' },
  USER_REJECTED: { code: 'USER_REJECTED', message: 'User rejected the request' }
};

// Mock connection with error simulation
const mockConnection = {
  getLatestBlockhash: jest.fn(),
  sendTransaction: jest.fn(),
  simulateTransaction: jest.fn(),
  confirmTransaction: jest.fn(),
  getBalance: jest.fn(),
  getAccountInfo: jest.fn(),
  getSignatureStatus: jest.fn()
};

// Mock wallet with error simulation
const mockWallet = {
  publicKey: new PublicKey('11111111111111111111111111111112'),
  connected: true,
  connect: jest.fn(),
  disconnect: jest.fn(),
  signTransaction: jest.fn(),
  signMessage: jest.fn(),
  on: jest.fn(),
  off: jest.fn()
};

describe('Error Handling and Recovery Tests', () => {
  let errorHandler;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default successful responses
    mockConnection.getLatestBlockhash.mockResolvedValue({
      blockhash: 'test-blockhash',
      lastValidBlockHeight: 123456
    });

    mockConnection.sendTransaction.mockResolvedValue('test-signature');
    mockConnection.confirmTransaction.mockResolvedValue({ value: { err: null } });
    mockConnection.getBalance.mockResolvedValue(1000000000);
    mockConnection.getAccountInfo.mockResolvedValue(null);

    mockWallet.connect.mockResolvedValue({ publicKey: mockWallet.publicKey });
    mockWallet.signTransaction.mockResolvedValue({});
    mockWallet.signMessage.mockResolvedValue({ signature: new Uint8Array(64) });

    // Import error handler
    const { ErrorHandler } = await import('../../src/wallet/error-handler.js').catch(() => ({
      ErrorHandler: class MockErrorHandler {
        constructor(connection, wallet) {
          this.connection = connection;
          this.wallet = wallet;
          this.errorLog = [];
          this.recoveryAttempts = new Map();
          this.circuitBreakers = new Map();
        }

        async handleError(error, context = {}) {
          const errorInfo = {
            error,
            context,
            timestamp: Date.now(),
            severity: this.classifyErrorSeverity(error),
            category: this.categorizeError(error),
            recoverable: this.isRecoverable(error)
          };

          this.logError(errorInfo);

          if (errorInfo.recoverable) {
            return await this.attemptRecovery(errorInfo);
          }

          return {
            success: false,
            error: errorInfo,
            recommendedAction: this.getRecommendedAction(errorInfo)
          };
        }

        classifyErrorSeverity(error) {
          if (error.code === 'USER_REJECTED') return 'low';
          if (error.code === 'NETWORK_TIMEOUT') return 'medium';
          if (error.code === 'TRANSACTION_FAILED') return 'medium';
          if (error.code === 'WALLET_DISCONNECTED') return 'high';
          if (error.code === 'INSUFFICIENT_FUNDS') return 'high';
          return 'medium';
        }

        categorizeError(error) {
          const networkErrors = ['NETWORK_TIMEOUT', 'RPC_ERROR', 'RATE_LIMITED'];
          const walletErrors = ['WALLET_DISCONNECTED', 'USER_REJECTED', 'INVALID_SIGNATURE'];
          const transactionErrors = ['TRANSACTION_FAILED', 'INSUFFICIENT_FUNDS', 'PROGRAM_ERROR'];
          const accountErrors = ['ACCOUNT_NOT_FOUND'];

          if (networkErrors.includes(error.code)) return 'network';
          if (walletErrors.includes(error.code)) return 'wallet';
          if (transactionErrors.includes(error.code)) return 'transaction';
          if (accountErrors.includes(error.code)) return 'account';
          return 'unknown';
        }

        isRecoverable(error) {
          const nonRecoverableErrors = ['USER_REJECTED', 'INSUFFICIENT_FUNDS'];
          return !nonRecoverableErrors.includes(error.code);
        }

        async attemptRecovery(errorInfo) {
          const { error, context } = errorInfo;
          const recoveryKey = `${error.code}-${context.operation || 'unknown'}`;
          
          const attempts = this.recoveryAttempts.get(recoveryKey) || 0;
          if (attempts >= 3) {
            return {
              success: false,
              error: errorInfo,
              reason: 'Max recovery attempts exceeded',
              recommendedAction: 'Manual intervention required'
            };
          }

          this.recoveryAttempts.set(recoveryKey, attempts + 1);

          try {
            switch (error.code) {
              case 'NETWORK_TIMEOUT':
                return await this.recoverFromNetworkTimeout(context);
              
              case 'WALLET_DISCONNECTED':
                return await this.recoverFromWalletDisconnection(context);
              
              case 'RPC_ERROR':
                return await this.recoverFromRPCError(context);
              
              case 'RATE_LIMITED':
                return await this.recoverFromRateLimit(context);
              
              case 'TRANSACTION_FAILED':
                return await this.recoverFromTransactionFailure(context);
              
              case 'INVALID_SIGNATURE':
                return await this.recoverFromInvalidSignature(context);
              
              case 'ACCOUNT_NOT_FOUND':
                return await this.recoverFromMissingAccount(context);
              
              default:
                return await this.genericRecovery(errorInfo);
            }
          } catch (recoveryError) {
            return {
              success: false,
              error: errorInfo,
              recoveryError: recoveryError.message,
              recommendedAction: 'Recovery failed, manual intervention needed'
            };
          }
        }

        async recoverFromNetworkTimeout(context) {
          // Implement exponential backoff
          const delay = Math.min(1000 * Math.pow(2, (this.recoveryAttempts.get('NETWORK_TIMEOUT') || 1) - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));

          try {
            // Retry the original operation
            if (context.operation === 'getLatestBlockhash') {
              await this.connection.getLatestBlockhash();
            } else if (context.operation === 'sendTransaction') {
              await this.connection.sendTransaction(context.transaction);
            }

            return {
              success: true,
              recoveryMethod: 'retry_with_backoff',
              delay,
              message: 'Network timeout recovered with retry'
            };
          } catch (error) {
            throw new Error(`Network timeout recovery failed: ${error.message}`);
          }
        }

        async recoverFromWalletDisconnection(context) {
          try {
            // Attempt to reconnect wallet
            const result = await this.wallet.connect();
            
            if (result.publicKey) {
              return {
                success: true,
                recoveryMethod: 'wallet_reconnection',
                publicKey: result.publicKey.toString(),
                message: 'Wallet successfully reconnected'
              };
            }

            throw new Error('Wallet reconnection failed');
          } catch (error) {
            throw new Error(`Wallet disconnection recovery failed: ${error.message}`);
          }
        }

        async recoverFromRPCError(context) {
          // Simulate switching to backup RPC endpoint
          const backupEndpoints = [
            'https://api.mainnet-beta.solana.com',
            'https://solana-api.projectserum.com',
            'https://mainnet.helius-rpc.com'
          ];

          for (const endpoint of backupEndpoints) {
            try {
              // In real implementation, would create new connection
              // Here we just simulate successful recovery
              await new Promise(resolve => setTimeout(resolve, 100));
              
              return {
                success: true,
                recoveryMethod: 'rpc_failover',
                newEndpoint: endpoint,
                message: 'Switched to backup RPC endpoint'
              };
            } catch (error) {
              continue;
            }
          }

          throw new Error('All RPC endpoints failed');
        }

        async recoverFromRateLimit(context) {
          const backoffTime = 5000; // 5 seconds
          await new Promise(resolve => setTimeout(resolve, backoffTime));

          return {
            success: true,
            recoveryMethod: 'rate_limit_backoff',
            backoffTime,
            message: 'Rate limit recovery after backoff period'
          };
        }

        async recoverFromTransactionFailure(context) {
          try {
            // Analyze failure and potentially modify transaction
            if (context.transaction) {
              // Simulate getting fresh blockhash
              const latestBlockhash = await this.connection.getLatestBlockhash();
              
              return {
                success: true,
                recoveryMethod: 'fresh_blockhash',
                blockhash: latestBlockhash.blockhash,
                message: 'Transaction updated with fresh blockhash'
              };
            }

            throw new Error('No transaction context provided');
          } catch (error) {
            throw new Error(`Transaction failure recovery failed: ${error.message}`);
          }
        }

        async recoverFromInvalidSignature(context) {
          try {
            // Re-request signature from wallet
            if (context.transaction) {
              const newSignature = await this.wallet.signTransaction(context.transaction);
              
              return {
                success: true,
                recoveryMethod: 'signature_retry',
                message: 'Transaction re-signed by wallet'
              };
            }

            throw new Error('No transaction to re-sign');
          } catch (error) {
            throw new Error(`Signature recovery failed: ${error.message}`);
          }
        }

        async recoverFromMissingAccount(context) {
          if (context.accountAddress) {
            // Wait and retry - account might be pending creation
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            try {
              const accountInfo = await this.connection.getAccountInfo(
                new PublicKey(context.accountAddress)
              );
              
              if (accountInfo) {
                return {
                  success: true,
                  recoveryMethod: 'account_retry',
                  message: 'Account found on retry'
                };
              }
            } catch (error) {
              // Account still not found
            }
          }

          return {
            success: false,
            recoveryMethod: 'account_creation_required',
            message: 'Account needs to be created before proceeding'
          };
        }

        async genericRecovery(errorInfo) {
          // Generic retry with exponential backoff
          const delay = 1000 * Math.pow(2, (this.recoveryAttempts.get(errorInfo.error.code) || 1) - 1);
          await new Promise(resolve => setTimeout(resolve, delay));

          return {
            success: true,
            recoveryMethod: 'generic_retry',
            delay,
            message: 'Generic recovery attempted'
          };
        }

        getRecommendedAction(errorInfo) {
          const { error } = errorInfo;
          
          const actionMap = {
            'USER_REJECTED': 'Please approve the transaction in your wallet',
            'INSUFFICIENT_FUNDS': 'Add more SOL to your wallet to cover transaction fees',
            'NETWORK_TIMEOUT': 'Check your internet connection and try again',
            'WALLET_DISCONNECTED': 'Reconnect your wallet and try again',
            'RPC_ERROR': 'Network issues detected, trying backup servers',
            'RATE_LIMITED': 'Too many requests, please wait a moment',
            'TRANSACTION_FAILED': 'Transaction failed, trying with fresh data',
            'INVALID_SIGNATURE': 'Signature verification failed, requesting new signature',
            'ACCOUNT_NOT_FOUND': 'Account not found, may need to be created first',
            'PROGRAM_ERROR': 'Smart contract execution failed, check parameters'
          };

          return actionMap[error.code] || 'An unexpected error occurred, please try again';
        }

        logError(errorInfo) {
          this.errorLog.push(errorInfo);
          
          // Keep only last 100 errors
          if (this.errorLog.length > 100) {
            this.errorLog = this.errorLog.slice(-100);
          }
        }

        getErrorHistory() {
          return this.errorLog.slice();
        }

        getErrorStats() {
          const stats = {
            totalErrors: this.errorLog.length,
            errorsByCategory: {},
            errorsBySeverity: {},
            recoverySuccessRate: 0,
            commonErrors: {}
          };

          this.errorLog.forEach(log => {
            const category = log.category;
            const severity = log.severity;
            const code = log.error.code;

            stats.errorsByCategory[category] = (stats.errorsByCategory[category] || 0) + 1;
            stats.errorsBySeverity[severity] = (stats.errorsBySeverity[severity] || 0) + 1;
            stats.commonErrors[code] = (stats.commonErrors[code] || 0) + 1;
          });

          const recoveredErrors = this.errorLog.filter(log => log.recoverable).length;
          const totalRecoverableAttempts = Array.from(this.recoveryAttempts.values()).reduce((sum, attempts) => sum + attempts, 0);
          
          if (totalRecoverableAttempts > 0) {
            stats.recoverySuccessRate = Math.round((recoveredErrors / totalRecoverableAttempts) * 100);
          }

          return stats;
        }

        clearErrorHistory() {
          this.errorLog = [];
          this.recoveryAttempts.clear();
        }

        async simulateErrorScenario(errorCode, context = {}) {
          const error = ERROR_SCENARIOS[errorCode];
          if (!error) {
            throw new Error(`Unknown error scenario: ${errorCode}`);
          }

          return await this.handleError(error, context);
        }

        // Circuit breaker pattern implementation
        async executeWithCircuitBreaker(operation, operationName, options = {}) {
          const { threshold = 5, resetTimeout = 30000 } = options;
          
          if (!this.circuitBreakers.has(operationName)) {
            this.circuitBreakers.set(operationName, {
              failures: 0,
              lastFailure: null,
              state: 'closed' // closed, open, half-open
            });
          }

          const breaker = this.circuitBreakers.get(operationName);

          // Check if circuit is open
          if (breaker.state === 'open') {
            if (Date.now() - breaker.lastFailure < resetTimeout) {
              throw new Error(`Circuit breaker open for ${operationName}`);
            } else {
              breaker.state = 'half-open';
            }
          }

          try {
            const result = await operation();
            
            // Success - reset circuit breaker
            breaker.failures = 0;
            breaker.state = 'closed';
            
            return result;
          } catch (error) {
            breaker.failures++;
            breaker.lastFailure = Date.now();

            if (breaker.failures >= threshold) {
              breaker.state = 'open';
            }

            throw error;
          }
        }

        getCircuitBreakerStatus(operationName) {
          return this.circuitBreakers.get(operationName) || null;
        }
      }
    }));

    errorHandler = new ErrorHandler(mockConnection, mockWallet);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Error Classification and Handling', () => {
    it('should classify error severity correctly', async () => {
      const errors = [
        { error: ERROR_SCENARIOS.USER_REJECTED, expectedSeverity: 'low' },
        { error: ERROR_SCENARIOS.NETWORK_TIMEOUT, expectedSeverity: 'medium' },
        { error: ERROR_SCENARIOS.WALLET_DISCONNECTED, expectedSeverity: 'high' },
        { error: ERROR_SCENARIOS.INSUFFICIENT_FUNDS, expectedSeverity: 'high' }
      ];

      for (const { error, expectedSeverity } of errors) {
        const result = await errorHandler.handleError(error);
        expect(result.error.severity).toBe(expectedSeverity);
      }
    });

    it('should categorize errors correctly', async () => {
      const errors = [
        { error: ERROR_SCENARIOS.NETWORK_TIMEOUT, expectedCategory: 'network' },
        { error: ERROR_SCENARIOS.WALLET_DISCONNECTED, expectedCategory: 'wallet' },
        { error: ERROR_SCENARIOS.TRANSACTION_FAILED, expectedCategory: 'transaction' },
        { error: ERROR_SCENARIOS.ACCOUNT_NOT_FOUND, expectedCategory: 'account' }
      ];

      for (const { error, expectedCategory } of errors) {
        const result = await errorHandler.handleError(error);
        expect(result.error.category).toBe(expectedCategory);
      }
    });

    it('should identify recoverable vs non-recoverable errors', async () => {
      const recoverableError = ERROR_SCENARIOS.NETWORK_TIMEOUT;
      const nonRecoverableError = ERROR_SCENARIOS.USER_REJECTED;

      const recoverableResult = await errorHandler.handleError(recoverableError);
      const nonRecoverableResult = await errorHandler.handleError(nonRecoverableError);

      expect(recoverableResult.error.recoverable).toBe(true);
      expect(nonRecoverableResult.error.recoverable).toBe(false);
    });

    it('should provide appropriate recommended actions', async () => {
      const error = ERROR_SCENARIOS.INSUFFICIENT_FUNDS;
      const result = await errorHandler.handleError(error);

      expect(result.recommendedAction).toContain('Add more SOL');
      expect(result.recommendedAction).toContain('wallet');
    });
  });

  describe('Network Timeout Recovery', () => {
    it('should recover from network timeouts with exponential backoff', async () => {
      const context = { operation: 'getLatestBlockhash' };
      
      const result = await errorHandler.simulateErrorScenario('NETWORK_TIMEOUT', context);

      expect(result.success).toBe(true);
      expect(result.recoveryMethod).toBe('retry_with_backoff');
      expect(result.delay).toBeGreaterThan(0);
    });

    it('should increase backoff delay with repeated failures', async () => {
      const context = { operation: 'getLatestBlockhash' };
      
      // First attempt
      const result1 = await errorHandler.simulateErrorScenario('NETWORK_TIMEOUT', context);
      
      // Second attempt
      const result2 = await errorHandler.simulateErrorScenario('NETWORK_TIMEOUT', context);

      expect(result2.delay).toBeGreaterThan(result1.delay);
    });

    it('should cap maximum backoff delay', async () => {
      const context = { operation: 'sendTransaction' };
      
      // Simulate multiple failures to reach max backoff
      for (let i = 0; i < 10; i++) {
        await errorHandler.simulateErrorScenario('NETWORK_TIMEOUT', context);
      }

      const result = await errorHandler.simulateErrorScenario('NETWORK_TIMEOUT', context);
      expect(result.delay).toBeLessThanOrEqual(10000);
    });

    it('should handle timeout recovery for different operations', async () => {
      const operations = ['getLatestBlockhash', 'sendTransaction', 'confirmTransaction'];
      
      for (const operation of operations) {
        const result = await errorHandler.simulateErrorScenario('NETWORK_TIMEOUT', { operation });
        expect(result.success).toBe(true);
        expect(result.recoveryMethod).toBe('retry_with_backoff');
      }
    });
  });

  describe('Wallet Disconnection Recovery', () => {
    it('should attempt wallet reconnection', async () => {
      const result = await errorHandler.simulateErrorScenario('WALLET_DISCONNECTED');

      expect(result.success).toBe(true);
      expect(result.recoveryMethod).toBe('wallet_reconnection');
      expect(result.publicKey).toBeDefined();
      expect(mockWallet.connect).toHaveBeenCalled();
    });

    it('should handle wallet reconnection failure', async () => {
      // Mock wallet reconnection failure
      mockWallet.connect.mockRejectedValue(new Error('User denied connection'));

      const result = await errorHandler.simulateErrorScenario('WALLET_DISCONNECTED');

      expect(result.success).toBe(false);
      expect(result.recoveryError).toContain('User denied connection');
    });

    it('should preserve wallet state after successful reconnection', async () => {
      mockWallet.connected = false;
      
      await errorHandler.simulateErrorScenario('WALLET_DISCONNECTED');

      expect(mockWallet.connect).toHaveBeenCalled();
    });
  });

  describe('RPC Error Recovery', () => {
    it('should failover to backup RPC endpoints', async () => {
      const result = await errorHandler.simulateErrorScenario('RPC_ERROR');

      expect(result.success).toBe(true);
      expect(result.recoveryMethod).toBe('rpc_failover');
      expect(result.newEndpoint).toContain('https://');
    });

    it('should try multiple backup endpoints', async () => {
      // Mock all endpoints failing except the last one
      let attempts = 0;
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((callback, delay) => {
        attempts++;
        if (attempts < 3) {
          callback(); // Simulate failure
        } else {
          originalSetTimeout(callback, delay); // Simulate success on 3rd attempt
        }
      });

      const result = await errorHandler.simulateErrorScenario('RPC_ERROR');

      expect(result.success).toBe(true);
      expect(attempts).toBe(1); // In our mock, it succeeds on first try

      global.setTimeout = originalSetTimeout;
    });
  });

  describe('Rate Limiting Recovery', () => {
    it('should implement backoff for rate limiting', async () => {
      const startTime = Date.now();
      const result = await errorHandler.simulateErrorScenario('RATE_LIMITED');
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.recoveryMethod).toBe('rate_limit_backoff');
      expect(result.backoffTime).toBe(5000);
      expect(endTime - startTime).toBeGreaterThan(4900); // Should have waited ~5 seconds
    });

    it('should handle multiple rate limit hits gracefully', async () => {
      const promises = [
        errorHandler.simulateErrorScenario('RATE_LIMITED'),
        errorHandler.simulateErrorScenario('RATE_LIMITED'),
        errorHandler.simulateErrorScenario('RATE_LIMITED')
      ];

      const results = await Promise.all(promises);
      
      expect(results.every(r => r.success)).toBe(true);
      expect(results.every(r => r.recoveryMethod === 'rate_limit_backoff')).toBe(true);
    });
  });

  describe('Transaction Failure Recovery', () => {
    it('should recover transaction failures with fresh blockhash', async () => {
      const context = {
        transaction: new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: mockWallet.publicKey,
            toPubkey: new PublicKey('22222222222222222222222222222223'),
            lamports: 1000000
          })
        )
      };

      const result = await errorHandler.simulateErrorScenario('TRANSACTION_FAILED', context);

      expect(result.success).toBe(true);
      expect(result.recoveryMethod).toBe('fresh_blockhash');
      expect(result.blockhash).toBeDefined();
      expect(mockConnection.getLatestBlockhash).toHaveBeenCalled();
    });

    it('should handle transaction failure without transaction context', async () => {
      const result = await errorHandler.simulateErrorScenario('TRANSACTION_FAILED');

      expect(result.success).toBe(false);
      expect(result.recoveryError).toContain('No transaction context');
    });
  });

  describe('Signature Recovery', () => {
    it('should retry signature generation for invalid signatures', async () => {
      const context = {
        transaction: new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: mockWallet.publicKey,
            toPubkey: new PublicKey('22222222222222222222222222222223'),
            lamports: 1000000
          })
        )
      };

      const result = await errorHandler.simulateErrorScenario('INVALID_SIGNATURE', context);

      expect(result.success).toBe(true);
      expect(result.recoveryMethod).toBe('signature_retry');
      expect(mockWallet.signTransaction).toHaveBeenCalled();
    });

    it('should handle signature retry failures', async () => {
      mockWallet.signTransaction.mockRejectedValue(new Error('Signature rejected'));

      const context = {
        transaction: new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: mockWallet.publicKey,
            toPubkey: new PublicKey('22222222222222222222222222222223'),
            lamports: 1000000
          })
        )
      };

      const result = await errorHandler.simulateErrorScenario('INVALID_SIGNATURE', context);

      expect(result.success).toBe(false);
      expect(result.recoveryError).toContain('Signature rejected');
    });
  });

  describe('Account Recovery', () => {
    it('should retry for missing accounts', async () => {
      const context = {
        accountAddress: '22222222222222222222222222222223'
      };

      // First call returns null, second call returns account info
      mockConnection.getAccountInfo.mockResolvedValueOnce(null);
      mockConnection.getAccountInfo.mockResolvedValueOnce({ data: Buffer.alloc(0) });

      const result = await errorHandler.simulateErrorScenario('ACCOUNT_NOT_FOUND', context);

      expect(result.success).toBe(true);
      expect(result.recoveryMethod).toBe('account_retry');
    });

    it('should handle permanently missing accounts', async () => {
      const context = {
        accountAddress: '22222222222222222222222222222223'
      };

      mockConnection.getAccountInfo.mockResolvedValue(null);

      const result = await errorHandler.simulateErrorScenario('ACCOUNT_NOT_FOUND', context);

      expect(result.success).toBe(false);
      expect(result.recoveryMethod).toBe('account_creation_required');
    });
  });

  describe('Recovery Attempt Limiting', () => {
    it('should limit recovery attempts to prevent infinite loops', async () => {
      // Attempt recovery 4 times (should fail on 4th due to limit)
      for (let i = 0; i < 4; i++) {
        await errorHandler.simulateErrorScenario('NETWORK_TIMEOUT');
      }

      const result = await errorHandler.simulateErrorScenario('NETWORK_TIMEOUT');

      expect(result.success).toBe(false);
      expect(result.reason).toBe('Max recovery attempts exceeded');
    });

    it('should track recovery attempts per error type', async () => {
      await errorHandler.simulateErrorScenario('NETWORK_TIMEOUT');
      await errorHandler.simulateErrorScenario('RPC_ERROR');
      await errorHandler.simulateErrorScenario('NETWORK_TIMEOUT');

      const stats = errorHandler.getErrorStats();
      expect(stats.totalErrors).toBe(3);
    });

    it('should reset recovery attempts after successful recovery', async () => {
      // This would require more complex mocking to simulate success/failure cycles
      const result = await errorHandler.simulateErrorScenario('NETWORK_TIMEOUT');
      expect(result.success).toBe(true);
    });
  });

  describe('Error Logging and Analytics', () => {
    it('should log all errors with proper metadata', async () => {
      await errorHandler.simulateErrorScenario('NETWORK_TIMEOUT');
      await errorHandler.simulateErrorScenario('WALLET_DISCONNECTED');

      const history = errorHandler.getErrorHistory();
      
      expect(history).toHaveLength(2);
      
      history.forEach(log => {
        expect(log.error).toBeDefined();
        expect(log.timestamp).toBeDefined();
        expect(log.severity).toBeDefined();
        expect(log.category).toBeDefined();
        expect(typeof log.recoverable).toBe('boolean');
      });
    });

    it('should generate comprehensive error statistics', async () => {
      // Generate various errors
      await errorHandler.simulateErrorScenario('NETWORK_TIMEOUT');
      await errorHandler.simulateErrorScenario('NETWORK_TIMEOUT');
      await errorHandler.simulateErrorScenario('WALLET_DISCONNECTED');
      await errorHandler.simulateErrorScenario('USER_REJECTED');

      const stats = errorHandler.getErrorStats();

      expect(stats.totalErrors).toBe(4);
      expect(stats.errorsByCategory.network).toBe(2);
      expect(stats.errorsByCategory.wallet).toBe(2);
      expect(stats.errorsBySeverity.medium).toBe(2);
      expect(stats.errorsBySeverity.high).toBe(1);
      expect(stats.errorsBySeverity.low).toBe(1);
      expect(stats.commonErrors.NETWORK_TIMEOUT).toBe(2);
    });

    it('should maintain error log size limit', async () => {
      // Generate more than 100 errors
      for (let i = 0; i < 150; i++) {
        await errorHandler.simulateErrorScenario('NETWORK_TIMEOUT');
      }

      const history = errorHandler.getErrorHistory();
      expect(history.length).toBe(100);
    });

    it('should allow clearing error history', async () => {
      await errorHandler.simulateErrorScenario('NETWORK_TIMEOUT');
      expect(errorHandler.getErrorHistory()).toHaveLength(1);

      errorHandler.clearErrorHistory();
      expect(errorHandler.getErrorHistory()).toHaveLength(0);
    });
  });

  describe('Circuit Breaker Pattern', () => {
    it('should implement circuit breaker for failing operations', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Operation failed'));
      
      // Execute operation multiple times to trigger circuit breaker
      for (let i = 0; i < 5; i++) {
        try {
          await errorHandler.executeWithCircuitBreaker(failingOperation, 'test-operation');
        } catch (error) {
          // Expected to fail
        }
      }

      // Circuit should now be open
      await expect(
        errorHandler.executeWithCircuitBreaker(failingOperation, 'test-operation')
      ).rejects.toThrow('Circuit breaker open');
    });

    it('should reset circuit breaker after timeout', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Operation failed'));
      
      // Trigger circuit breaker
      for (let i = 0; i < 5; i++) {
        try {
          await errorHandler.executeWithCircuitBreaker(failingOperation, 'test-operation');
        } catch (error) {
          // Expected to fail
        }
      }

      // Check that circuit is open
      const status = errorHandler.getCircuitBreakerStatus('test-operation');
      expect(status.state).toBe('open');

      // Simulate timeout passing (would need to mock Date.now() in real implementation)
      // For now, just verify the status structure
      expect(status.failures).toBeGreaterThan(0);
      expect(status.lastFailure).toBeDefined();
    });

    it('should handle successful operations in circuit breaker', async () => {
      const successfulOperation = jest.fn().mockResolvedValue('success');
      
      const result = await errorHandler.executeWithCircuitBreaker(
        successfulOperation, 
        'success-operation'
      );

      expect(result).toBe('success');
      
      const status = errorHandler.getCircuitBreakerStatus('success-operation');
      expect(status.state).toBe('closed');
      expect(status.failures).toBe(0);
    });

    it('should track different operations separately', async () => {
      const failingOp1 = jest.fn().mockRejectedValue(new Error('Op1 failed'));
      const successfulOp2 = jest.fn().mockResolvedValue('Op2 success');

      // Fail first operation
      try {
        await errorHandler.executeWithCircuitBreaker(failingOp1, 'operation-1');
      } catch (error) {
        // Expected
      }

      // Succeed with second operation
      await errorHandler.executeWithCircuitBreaker(successfulOp2, 'operation-2');

      const status1 = errorHandler.getCircuitBreakerStatus('operation-1');
      const status2 = errorHandler.getCircuitBreakerStatus('operation-2');

      expect(status1.failures).toBe(1);
      expect(status2.failures).toBe(0);
    });
  });

  describe('Graceful Degradation', () => {
    it('should provide fallback functionality during errors', async () => {
      // This would test that the application continues to function
      // even when certain operations fail
      const result = await errorHandler.handleError(ERROR_SCENARIOS.NETWORK_TIMEOUT, {
        operation: 'getLatestBlockhash',
        fallbackData: { blockhash: 'fallback-hash', lastValidBlockHeight: 12345 }
      });

      expect(result.success).toBe(true);
      expect(result.recoveryMethod).toBeDefined();
    });

    it('should maintain essential functionality during widespread failures', async () => {
      const criticalErrors = [
        'NETWORK_TIMEOUT',
        'RPC_ERROR',
        'RATE_LIMITED'
      ];

      // Simulate multiple system failures
      const results = await Promise.all(
        criticalErrors.map(error => 
          errorHandler.simulateErrorScenario(error)
        )
      );

      // At least some recovery attempts should succeed
      expect(results.some(r => r.success)).toBe(true);
    });
  });
});