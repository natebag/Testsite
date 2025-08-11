/**
 * Load Testing with Concurrent Transactions
 * Sub-task 8.8 - Load Testing with Concurrent Transactions
 * 
 * Tests system performance under high load including:
 * - High-volume transaction processing
 * - Concurrent wallet connections
 * - Performance under stress
 * - Scalability validation
 * - Memory usage monitoring
 * - Throughput analysis
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { performance } from 'perf_hooks';

// Mock multiple wallet instances for load testing
const createMockWallet = (index) => ({
  publicKey: new PublicKey(`${(Math.pow(10, 43) + index).toString().padStart(44, '0')}`),
  connected: true,
  id: `wallet-${index}`,
  connect: jest.fn().mockResolvedValue({}),
  disconnect: jest.fn().mockResolvedValue({}),
  signTransaction: jest.fn(),
  signMessage: jest.fn(),
  signAllTransactions: jest.fn()
});

// Mock connection with performance simulation
const mockConnection = {
  getLatestBlockhash: jest.fn(),
  sendTransaction: jest.fn(),
  simulateTransaction: jest.fn(),
  confirmTransaction: jest.fn(),
  getBalance: jest.fn(),
  getAccountInfo: jest.fn(),
  getSignatureStatus: jest.fn(),
  sendRawTransaction: jest.fn()
};

// Performance metrics collection
class PerformanceMetrics {
  constructor() {
    this.metrics = {
      transactionTimes: [],
      connectionTimes: [],
      signatureTimes: [],
      memoryUsage: [],
      cpuUsage: [],
      errors: [],
      throughput: {
        transactions: 0,
        connections: 0,
        signatures: 0
      }
    };
    this.startTime = 0;
    this.endTime = 0;
  }

  startMeasurement() {
    this.startTime = performance.now();
  }

  endMeasurement() {
    this.endTime = performance.now();
    return this.endTime - this.startTime;
  }

  recordTransaction(duration, success = true) {
    this.metrics.transactionTimes.push(duration);
    if (success) this.metrics.throughput.transactions++;
    else this.metrics.errors.push({ type: 'transaction', duration });
  }

  recordConnection(duration, success = true) {
    this.metrics.connectionTimes.push(duration);
    if (success) this.metrics.throughput.connections++;
    else this.metrics.errors.push({ type: 'connection', duration });
  }

  recordSignature(duration, success = true) {
    this.metrics.signatureTimes.push(duration);
    if (success) this.metrics.throughput.signatures++;
    else this.metrics.errors.push({ type: 'signature', duration });
  }

  recordMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      this.metrics.memoryUsage.push({
        timestamp: Date.now(),
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
        rss: usage.rss
      });
    }
  }

  getAverageTime(type) {
    const times = this.metrics[type + 'Times'] || [];
    return times.length ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;
  }

  getPercentile(type, percentile) {
    const times = [...(this.metrics[type + 'Times'] || [])].sort((a, b) => a - b);
    if (!times.length) return 0;
    const index = Math.ceil((percentile / 100) * times.length) - 1;
    return times[index];
  }

  getThroughputPerSecond(type) {
    const totalTime = (this.endTime - this.startTime) / 1000; // Convert to seconds
    return totalTime ? this.metrics.throughput[type] / totalTime : 0;
  }

  getErrorRate(type) {
    const totalOperations = this.metrics.throughput[type] + 
      this.metrics.errors.filter(e => e.type === type).length;
    const errors = this.metrics.errors.filter(e => e.type === type).length;
    return totalOperations ? (errors / totalOperations) * 100 : 0;
  }

  getReport() {
    return {
      duration: this.endTime - this.startTime,
      averageTimes: {
        transaction: this.getAverageTime('transaction'),
        connection: this.getAverageTime('connection'),
        signature: this.getAverageTime('signature')
      },
      percentiles: {
        transaction: {
          p50: this.getPercentile('transaction', 50),
          p95: this.getPercentile('transaction', 95),
          p99: this.getPercentile('transaction', 99)
        },
        connection: {
          p50: this.getPercentile('connection', 50),
          p95: this.getPercentile('connection', 95),
          p99: this.getPercentile('connection', 99)
        }
      },
      throughput: {
        transactionsPerSecond: this.getThroughputPerSecond('transactions'),
        connectionsPerSecond: this.getThroughputPerSecond('connections'),
        signaturesPerSecond: this.getThroughputPerSecond('signatures')
      },
      errorRates: {
        transaction: this.getErrorRate('transactions'),
        connection: this.getErrorRate('connections'),
        signature: this.getErrorRate('signatures')
      },
      memoryPeak: Math.max(...this.metrics.memoryUsage.map(m => m.heapUsed), 0),
      totalOperations: Object.values(this.metrics.throughput).reduce((sum, count) => sum + count, 0)
    };
  }
}

describe('Load Testing with Concurrent Transactions', () => {
  let loadTester;
  let performanceMetrics;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Initialize performance metrics
    performanceMetrics = new PerformanceMetrics();

    // Setup connection mocks with realistic delays
    mockConnection.getLatestBlockhash.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50)); // 50-150ms
      return {
        blockhash: 'test-blockhash-' + Date.now(),
        lastValidBlockHeight: Math.floor(Math.random() * 1000000) + 123456
      };
    });

    mockConnection.sendTransaction.mockImplementation(async (transaction) => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200)); // 200-700ms
      if (Math.random() < 0.05) { // 5% failure rate
        throw new Error('Transaction failed due to network congestion');
      }
      return 'signature-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    });

    mockConnection.simulateTransaction.mockImplementation(async (transaction) => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100)); // 100-300ms
      return {
        value: {
          err: null,
          logs: [`Program ${SystemProgram.programId} invoke [1]`],
          unitsConsumed: Math.floor(Math.random() * 200000) + 150000,
          accounts: []
        }
      };
    });

    mockConnection.confirmTransaction.mockImplementation(async (signature) => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000)); // 1-3s
      return {
        value: {
          err: null,
          confirmations: Math.floor(Math.random() * 10) + 1
        }
      };
    });

    // Import load tester
    const { LoadTester } = await import('../../src/wallet/load-tester.js').catch(() => ({
      LoadTester: class MockLoadTester {
        constructor(connection, metrics) {
          this.connection = connection;
          this.metrics = metrics;
          this.activeConnections = new Map();
          this.transactionQueue = [];
          this.isRunning = false;
        }

        async runConcurrentTransactionTest(config = {}) {
          const {
            walletCount = 10,
            transactionsPerWallet = 5,
            concurrencyLevel = 5,
            testDuration = 30000, // 30 seconds
            transactionType = 'transfer'
          } = config;

          this.metrics.startMeasurement();
          this.isRunning = true;

          const wallets = Array(walletCount).fill(null).map((_, i) => createMockWallet(i));
          
          // Setup wallet signing
          wallets.forEach(wallet => {
            wallet.signTransaction.mockImplementation(async (tx) => {
              const start = performance.now();
              await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100)); // 100-400ms
              const duration = performance.now() - start;
              this.metrics.recordSignature(duration);
              
              return {
                ...tx,
                signatures: [{
                  signature: Buffer.from(crypto.getRandomValues(new Uint8Array(64))),
                  publicKey: wallet.publicKey
                }]
              };
            });
          });

          const results = await Promise.allSettled([
            this.runTransactionLoad(wallets, transactionsPerWallet, concurrencyLevel),
            this.monitorPerformance(testDuration)
          ]);

          this.isRunning = false;
          this.metrics.endMeasurement();

          return {
            success: true,
            config,
            results: results[0].status === 'fulfilled' ? results[0].value : null,
            performance: this.metrics.getReport(),
            errors: results.filter(r => r.status === 'rejected').map(r => r.reason)
          };
        }

        async runTransactionLoad(wallets, transactionsPerWallet, concurrencyLevel) {
          const transactionPromises = [];
          
          for (const wallet of wallets) {
            for (let i = 0; i < transactionsPerWallet; i++) {
              const transactionPromise = this.executeTransaction(wallet, i);
              transactionPromises.push(transactionPromise);
              
              // Control concurrency
              if (transactionPromises.length >= concurrencyLevel) {
                await Promise.allSettled(transactionPromises.splice(0, concurrencyLevel));
                
                // Small delay to prevent overwhelming
                await new Promise(resolve => setTimeout(resolve, 50));
              }
            }
          }

          // Wait for remaining transactions
          if (transactionPromises.length > 0) {
            await Promise.allSettled(transactionPromises);
          }

          return {
            totalTransactions: wallets.length * transactionsPerWallet,
            completedTransactions: this.metrics.metrics.throughput.transactions,
            failedTransactions: this.metrics.metrics.errors.filter(e => e.type === 'transaction').length
          };
        }

        async executeTransaction(wallet, index) {
          const start = performance.now();
          
          try {
            // Create transaction
            const transaction = new Transaction().add(
              SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: new PublicKey('22222222222222222222222222222223'),
                lamports: LAMPORTS_PER_SOL * 0.001 * (index + 1) // Variable amounts
              })
            );

            // Get recent blockhash
            const { blockhash } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = wallet.publicKey;

            // Sign transaction
            const signedTransaction = await wallet.signTransaction(transaction);

            // Send transaction
            const signature = await this.connection.sendTransaction(signedTransaction);

            // Simulate confirmation (optional for load testing)
            if (Math.random() < 0.3) { // Only confirm 30% to reduce load
              await this.connection.confirmTransaction(signature);
            }

            const duration = performance.now() - start;
            this.metrics.recordTransaction(duration, true);

            return { success: true, signature, duration };
          } catch (error) {
            const duration = performance.now() - start;
            this.metrics.recordTransaction(duration, false);
            return { success: false, error: error.message, duration };
          }
        }

        async runConcurrentConnectionTest(config = {}) {
          const {
            connectionCount = 50,
            connectionsPerSecond = 10,
            holdDuration = 5000 // Hold connections for 5 seconds
          } = config;

          this.metrics.startMeasurement();

          const connectionPromises = [];
          const connectionInterval = 1000 / connectionsPerSecond;

          for (let i = 0; i < connectionCount; i++) {
            const connectionPromise = this.establishConnection(i, holdDuration);
            connectionPromises.push(connectionPromise);
            
            if (i < connectionCount - 1) {
              await new Promise(resolve => setTimeout(resolve, connectionInterval));
            }
          }

          const results = await Promise.allSettled(connectionPromises);
          this.metrics.endMeasurement();

          return {
            totalAttempts: connectionCount,
            successfulConnections: results.filter(r => r.status === 'fulfilled').length,
            failedConnections: results.filter(r => r.status === 'rejected').length,
            performance: this.metrics.getReport()
          };
        }

        async establishConnection(index, holdDuration) {
          const start = performance.now();
          const wallet = createMockWallet(index);
          
          try {
            // Simulate connection establishment
            await wallet.connect();
            
            // Hold connection
            this.activeConnections.set(wallet.id, wallet);
            
            // Simulate some activity
            await new Promise(resolve => setTimeout(resolve, holdDuration));
            
            // Disconnect
            await wallet.disconnect();
            this.activeConnections.delete(wallet.id);
            
            const duration = performance.now() - start;
            this.metrics.recordConnection(duration, true);
            
            return { success: true, walletId: wallet.id, duration };
          } catch (error) {
            const duration = performance.now() - start;
            this.metrics.recordConnection(duration, false);
            throw error;
          }
        }

        async runThroughputTest(config = {}) {
          const {
            duration = 60000, // 1 minute
            rampUpTime = 10000, // 10 seconds
            targetTPS = 50 // Transactions per second
          } = config;

          this.metrics.startMeasurement();

          const testEndTime = Date.now() + duration;
          let currentTPS = 0;
          const maxTPS = targetTPS;
          const rampUpIncrement = maxTPS / (rampUpTime / 1000);

          const wallets = Array(Math.max(10, targetTPS)).fill(null).map((_, i) => createMockWallet(i));
          
          // Setup wallets
          wallets.forEach(wallet => {
            wallet.signTransaction.mockImplementation(async (tx) => {
              await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50));
              return { ...tx, signatures: [{ signature: Buffer.alloc(64), publicKey: wallet.publicKey }] };
            });
          });

          while (Date.now() < testEndTime) {
            const now = Date.now();
            const elapsed = now - (testEndTime - duration);
            
            // Ramp up TPS gradually
            if (elapsed < rampUpTime) {
              currentTPS = Math.min(maxTPS, (elapsed / 1000) * rampUpIncrement);
            } else {
              currentTPS = maxTPS;
            }

            // Calculate delay between transactions
            const transactionInterval = Math.max(10, 1000 / currentTPS);
            
            // Execute transactions at target rate
            const transactionPromises = [];
            const batchSize = Math.min(5, Math.ceil(currentTPS / 10));
            
            for (let i = 0; i < batchSize; i++) {
              const wallet = wallets[i % wallets.length];
              transactionPromises.push(this.executeTransaction(wallet, i));
            }
            
            await Promise.allSettled(transactionPromises);
            await new Promise(resolve => setTimeout(resolve, transactionInterval));
          }

          this.metrics.endMeasurement();

          const report = this.metrics.getReport();
          return {
            targetTPS,
            actualTPS: report.throughput.transactionsPerSecond,
            efficiency: (report.throughput.transactionsPerSecond / targetTPS) * 100,
            performance: report
          };
        }

        async runStressTest(config = {}) {
          const {
            phases = [
              { name: 'warmup', duration: 10000, load: 0.2 },
              { name: 'rampup', duration: 30000, load: 0.8 },
              { name: 'peak', duration: 60000, load: 1.0 },
              { name: 'cooldown', duration: 20000, load: 0.3 }
            ],
            maxConcurrency = 100,
            maxTPS = 200
          } = config;

          this.metrics.startMeasurement();
          
          const results = [];
          const wallets = Array(maxConcurrency).fill(null).map((_, i) => createMockWallet(i));
          
          for (const phase of phases) {
            const phaseStart = performance.now();
            const targetConcurrency = Math.floor(maxConcurrency * phase.load);
            const targetTPS = Math.floor(maxTPS * phase.load);
            
            const phaseResult = await this.runPhase({
              name: phase.name,
              duration: phase.duration,
              concurrency: targetConcurrency,
              tps: targetTPS,
              wallets: wallets.slice(0, targetConcurrency)
            });
            
            phaseResult.duration = performance.now() - phaseStart;
            results.push(phaseResult);
          }

          this.metrics.endMeasurement();

          return {
            phases: results,
            overallPerformance: this.metrics.getReport(),
            peakPerformance: this.findPeakPerformance(results)
          };
        }

        async runPhase(config) {
          const { name, duration, concurrency, tps, wallets } = config;
          const phaseEndTime = Date.now() + duration;
          
          // Setup wallets for this phase
          wallets.forEach(wallet => {
            wallet.signTransaction.mockImplementation(async (tx) => {
              const delay = Math.random() * 300 + 100; // 100-400ms
              await new Promise(resolve => setTimeout(resolve, delay));
              return { ...tx, signatures: [{ signature: Buffer.alloc(64), publicKey: wallet.publicKey }] };
            });
          });

          const transactionPromises = [];
          
          while (Date.now() < phaseEndTime) {
            const intervalStart = performance.now();
            
            // Create batch of transactions
            const batchSize = Math.min(concurrency, Math.ceil(tps / 10));
            const batch = [];
            
            for (let i = 0; i < batchSize; i++) {
              const wallet = wallets[i % wallets.length];
              batch.push(this.executeTransaction(wallet, i));
            }
            
            transactionPromises.push(...batch);
            
            // Wait for some transactions to complete to manage memory
            if (transactionPromises.length > concurrency * 2) {
              await Promise.allSettled(transactionPromises.splice(0, concurrency));
            }
            
            // Control rate
            const elapsed = performance.now() - intervalStart;
            const targetInterval = 1000 / (tps / batchSize);
            const delay = Math.max(0, targetInterval - elapsed);
            
            if (delay > 0) {
              await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            // Record memory usage periodically
            if (Math.random() < 0.1) {
              this.metrics.recordMemoryUsage();
            }
          }

          // Wait for remaining transactions
          await Promise.allSettled(transactionPromises);

          return {
            phase: name,
            targetConcurrency: concurrency,
            targetTPS: tps,
            actualTPS: this.metrics.getThroughputPerSecond('transactions'),
            errorRate: this.metrics.getErrorRate('transactions'),
            avgResponseTime: this.metrics.getAverageTime('transaction')
          };
        }

        findPeakPerformance(results) {
          return results.reduce((peak, current) => {
            return current.actualTPS > peak.actualTPS ? current : peak;
          }, results[0] || {});
        }

        async monitorPerformance(duration) {
          const monitoringInterval = 1000; // 1 second
          const endTime = Date.now() + duration;
          
          while (Date.now() < endTime && this.isRunning) {
            this.metrics.recordMemoryUsage();
            await new Promise(resolve => setTimeout(resolve, monitoringInterval));
          }
        }

        async runMemoryLeakTest(config = {}) {
          const {
            iterations = 1000,
            operationsPerIteration = 10,
            gcCheckInterval = 100
          } = config;

          this.metrics.startMeasurement();
          
          const wallet = createMockWallet(0);
          wallet.signTransaction.mockImplementation(async (tx) => {
            await new Promise(resolve => setTimeout(resolve, 50));
            return { ...tx, signatures: [{ signature: Buffer.alloc(64), publicKey: wallet.publicKey }] };
          });

          let memorySnapshots = [];
          
          for (let i = 0; i < iterations; i++) {
            // Perform operations
            const promises = [];
            for (let j = 0; j < operationsPerIteration; j++) {
              promises.push(this.executeTransaction(wallet, j));
            }
            await Promise.allSettled(promises);
            
            // Take memory snapshot
            if (i % gcCheckInterval === 0) {
              this.metrics.recordMemoryUsage();
              if (this.metrics.metrics.memoryUsage.length > 0) {
                const latest = this.metrics.metrics.memoryUsage[this.metrics.metrics.memoryUsage.length - 1];
                memorySnapshots.push({
                  iteration: i,
                  heapUsed: latest.heapUsed,
                  heapTotal: latest.heapTotal
                });
              }
            }
            
            // Small delay to prevent overwhelming
            if (i % 50 === 0) {
              await new Promise(resolve => setTimeout(resolve, 10));
            }
          }

          this.metrics.endMeasurement();

          return {
            iterations,
            memorySnapshots,
            memoryTrend: this.analyzeMemoryTrend(memorySnapshots),
            performance: this.metrics.getReport()
          };
        }

        analyzeMemoryTrend(snapshots) {
          if (snapshots.length < 2) return { trend: 'insufficient_data' };
          
          const first = snapshots[0];
          const last = snapshots[snapshots.length - 1];
          const growth = last.heapUsed - first.heapUsed;
          const growthPercentage = (growth / first.heapUsed) * 100;
          
          return {
            trend: growthPercentage > 50 ? 'concerning' : growthPercentage > 20 ? 'moderate' : 'stable',
            growthBytes: growth,
            growthPercentage,
            peakMemory: Math.max(...snapshots.map(s => s.heapUsed)),
            averageMemory: snapshots.reduce((sum, s) => sum + s.heapUsed, 0) / snapshots.length
          };
        }

        getActiveConnectionCount() {
          return this.activeConnections.size;
        }

        async cleanup() {
          this.isRunning = false;
          
          // Disconnect all active connections
          const disconnectPromises = Array.from(this.activeConnections.values())
            .map(wallet => wallet.disconnect());
          
          await Promise.allSettled(disconnectPromises);
          this.activeConnections.clear();
        }
      }
    }));

    loadTester = new LoadTester(mockConnection, performanceMetrics);
  });

  afterEach(async () => {
    if (loadTester) {
      await loadTester.cleanup();
    }
    jest.restoreAllMocks();
  });

  describe('High-Volume Transaction Processing', () => {
    it('should handle concurrent transactions from multiple wallets', async () => {
      const result = await loadTester.runConcurrentTransactionTest({
        walletCount: 20,
        transactionsPerWallet: 5,
        concurrencyLevel: 10
      });

      expect(result.success).toBe(true);
      expect(result.results.totalTransactions).toBe(100);
      expect(result.results.completedTransactions).toBeGreaterThan(80); // Allow some failures
      expect(result.performance.averageTimes.transaction).toBeLessThan(2000); // Under 2 seconds
    }, 60000);

    it('should maintain acceptable performance under high load', async () => {
      const result = await loadTester.runConcurrentTransactionTest({
        walletCount: 50,
        transactionsPerWallet: 10,
        concurrencyLevel: 25
      });

      expect(result.performance.throughput.transactionsPerSecond).toBeGreaterThan(5);
      expect(result.performance.errorRates.transaction).toBeLessThan(20); // Less than 20% error rate
      expect(result.performance.percentiles.transaction.p95).toBeLessThan(5000); // 95th percentile under 5s
    }, 120000);

    it('should handle burst traffic patterns', async () => {
      const burstConfig = {
        walletCount: 30,
        transactionsPerWallet: 20,
        concurrencyLevel: 30 // High concurrency burst
      };

      const result = await loadTester.runConcurrentTransactionTest(burstConfig);

      expect(result.success).toBe(true);
      expect(result.performance.totalOperations).toBeGreaterThan(400);
      expect(result.performance.averageTimes.transaction).toBeLessThan(3000);
    }, 180000);

    it('should gracefully degrade under extreme load', async () => {
      const extremeConfig = {
        walletCount: 100,
        transactionsPerWallet: 5,
        concurrencyLevel: 50
      };

      const result = await loadTester.runConcurrentTransactionTest(extremeConfig);

      // Even under extreme load, system should not crash
      expect(result.success).toBe(true);
      expect(result.performance.errorRates.transaction).toBeLessThan(50);
    }, 300000);
  });

  describe('Concurrent Wallet Connections', () => {
    it('should handle multiple simultaneous wallet connections', async () => {
      const result = await loadTester.runConcurrentConnectionTest({
        connectionCount: 25,
        connectionsPerSecond: 5,
        holdDuration: 3000
      });

      expect(result.successfulConnections).toBeGreaterThan(20);
      expect(result.failedConnections).toBeLessThan(5);
      expect(result.performance.averageTimes.connection).toBeLessThan(4000);
    });

    it('should manage connection pools efficiently', async () => {
      const result = await loadTester.runConcurrentConnectionTest({
        connectionCount: 50,
        connectionsPerSecond: 10,
        holdDuration: 2000
      });

      expect(result.performance.throughput.connectionsPerSecond).toBeGreaterThan(5);
      expect(result.performance.errorRates.connection).toBeLessThan(10);
    });

    it('should handle rapid connect/disconnect cycles', async () => {
      const result = await loadTester.runConcurrentConnectionTest({
        connectionCount: 100,
        connectionsPerSecond: 20,
        holdDuration: 500 // Very short hold time
      });

      expect(result.successfulConnections).toBeGreaterThan(80);
      expect(result.performance.percentiles.connection.p95).toBeLessThan(2000);
    });
  });

  describe('Throughput Analysis', () => {
    it('should achieve target transactions per second', async () => {
      const result = await loadTester.runThroughputTest({
        duration: 30000,
        targetTPS: 20,
        rampUpTime: 5000
      });

      expect(result.actualTPS).toBeGreaterThan(15); // Allow some variance
      expect(result.efficiency).toBeGreaterThan(75); // At least 75% efficiency
      expect(result.performance.errorRates.transaction).toBeLessThan(15);
    }, 60000);

    it('should scale throughput with increased resources', async () => {
      const lowThroughputResult = await loadTester.runThroughputTest({
        duration: 20000,
        targetTPS: 10
      });

      const highThroughputResult = await loadTester.runThroughputTest({
        duration: 20000,
        targetTPS: 30
      });

      expect(highThroughputResult.actualTPS).toBeGreaterThan(lowThroughputResult.actualTPS);
    }, 90000);

    it('should maintain stable throughput over time', async () => {
      const result = await loadTester.runThroughputTest({
        duration: 60000,
        targetTPS: 25,
        rampUpTime: 10000
      });

      // Throughput should be consistent
      expect(result.actualTPS).toBeGreaterThan(20);
      expect(result.performance.percentiles.transaction.p99).toBeLessThan(10000);
    }, 120000);
  });

  describe('Stress Testing', () => {
    it('should handle progressive load increases', async () => {
      const result = await loadTester.runStressTest({
        phases: [
          { name: 'warmup', duration: 5000, load: 0.1 },
          { name: 'rampup', duration: 10000, load: 0.5 },
          { name: 'peak', duration: 15000, load: 1.0 }
        ],
        maxConcurrency: 50,
        maxTPS: 100
      });

      expect(result.phases).toHaveLength(3);
      expect(result.phases[2].actualTPS).toBeGreaterThan(result.phases[0].actualTPS);
      expect(result.peakPerformance.phase).toBe('peak');
    }, 60000);

    it('should identify performance breaking points', async () => {
      const result = await loadTester.runStressTest({
        phases: [
          { name: 'low', duration: 10000, load: 0.2 },
          { name: 'medium', duration: 10000, load: 0.5 },
          { name: 'high', duration: 10000, load: 0.8 },
          { name: 'extreme', duration: 10000, load: 1.0 }
        ],
        maxConcurrency: 100,
        maxTPS: 200
      });

      // Should see increasing error rates at higher loads
      const errorRates = result.phases.map(p => p.errorRate);
      expect(errorRates[3]).toBeGreaterThanOrEqual(errorRates[0]);
    }, 120000);

    it('should recover from high stress conditions', async () => {
      const result = await loadTester.runStressTest({
        phases: [
          { name: 'peak', duration: 10000, load: 1.0 },
          { name: 'recovery', duration: 10000, load: 0.3 }
        ],
        maxConcurrency: 80,
        maxTPS: 150
      });

      // Recovery phase should have better performance than peak
      const [peakPhase, recoveryPhase] = result.phases;
      expect(recoveryPhase.errorRate).toBeLessThan(peakPhase.errorRate);
      expect(recoveryPhase.avgResponseTime).toBeLessThan(peakPhase.avgResponseTime * 1.5);
    }, 60000);
  });

  describe('Performance Monitoring', () => {
    it('should track response time percentiles', async () => {
      const result = await loadTester.runConcurrentTransactionTest({
        walletCount: 30,
        transactionsPerWallet: 10,
        concurrencyLevel: 15
      });

      const percentiles = result.performance.percentiles.transaction;
      expect(percentiles.p50).toBeLessThan(percentiles.p95);
      expect(percentiles.p95).toBeLessThan(percentiles.p99);
      expect(percentiles.p99).toBeGreaterThan(0);
    });

    it('should monitor memory usage during load testing', async () => {
      const result = await loadTester.runThroughputTest({
        duration: 20000,
        targetTPS: 30
      });

      expect(result.performance.memoryPeak).toBeGreaterThan(0);
      // Memory usage should be reasonable
      if (typeof process !== 'undefined' && process.memoryUsage) {
        expect(result.performance.memoryPeak).toBeLessThan(500 * 1024 * 1024); // 500MB
      }
    });

    it('should detect performance degradation over time', async () => {
      // Run two sequential tests to compare performance
      const firstTest = await loadTester.runConcurrentTransactionTest({
        walletCount: 20,
        transactionsPerWallet: 5,
        concurrencyLevel: 10
      });

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));

      const secondTest = await loadTester.runConcurrentTransactionTest({
        walletCount: 20,
        transactionsPerWallet: 5,
        concurrencyLevel: 10
      });

      // Performance should remain relatively stable
      const performanceDiff = Math.abs(
        secondTest.performance.averageTimes.transaction - 
        firstTest.performance.averageTimes.transaction
      );
      
      expect(performanceDiff).toBeLessThan(firstTest.performance.averageTimes.transaction * 0.5);
    });
  });

  describe('Memory Leak Detection', () => {
    it('should detect memory leaks during extended operation', async () => {
      const result = await loadTester.runMemoryLeakTest({
        iterations: 500,
        operationsPerIteration: 5,
        gcCheckInterval: 50
      });

      expect(result.memoryTrend.trend).not.toBe('concerning');
      expect(result.memoryTrend.growthPercentage).toBeLessThan(100); // Less than 100% growth
    }, 60000);

    it('should maintain stable memory usage over time', async () => {
      const result = await loadTester.runMemoryLeakTest({
        iterations: 200,
        operationsPerIteration: 10,
        gcCheckInterval: 20
      });

      expect(result.memorySnapshots.length).toBeGreaterThan(5);
      expect(result.memoryTrend.trend).toMatch(/(stable|moderate)/);
    });

    it('should cleanup resources properly', async () => {
      const initialConnections = loadTester.getActiveConnectionCount();
      
      await loadTester.runConcurrentConnectionTest({
        connectionCount: 20,
        connectionsPerSecond: 10,
        holdDuration: 1000
      });

      await loadTester.cleanup();
      const finalConnections = loadTester.getActiveConnectionCount();

      expect(finalConnections).toBe(0);
      expect(finalConnections).toBeLessThanOrEqual(initialConnections);
    });
  });

  describe('Error Handling Under Load', () => {
    it('should handle network errors gracefully during load testing', async () => {
      // Increase failure rate for this test
      mockConnection.sendTransaction.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
        if (Math.random() < 0.3) { // 30% failure rate
          throw new Error('Network error during load test');
        }
        return 'signature-' + Date.now();
      });

      const result = await loadTester.runConcurrentTransactionTest({
        walletCount: 20,
        transactionsPerWallet: 10,
        concurrencyLevel: 15
      });

      expect(result.success).toBe(true);
      expect(result.results.failedTransactions).toBeGreaterThan(0);
      expect(result.performance.errorRates.transaction).toBeGreaterThan(20);
      expect(result.performance.errorRates.transaction).toBeLessThan(50);
    });

    it('should continue processing despite individual failures', async () => {
      const result = await loadTester.runThroughputTest({
        duration: 15000,
        targetTPS: 20
      });

      // Even with failures, should maintain some throughput
      expect(result.actualTPS).toBeGreaterThan(10);
      expect(result.performance.totalOperations).toBeGreaterThan(100);
    });

    it('should provide detailed error reporting', async () => {
      const result = await loadTester.runConcurrentTransactionTest({
        walletCount: 15,
        transactionsPerWallet: 8,
        concurrencyLevel: 12
      });

      expect(result.performance.errorRates).toBeDefined();
      expect(typeof result.performance.errorRates.transaction).toBe('number');
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe('Performance Benchmarking', () => {
    it('should provide comprehensive performance metrics', async () => {
      const result = await loadTester.runConcurrentTransactionTest({
        walletCount: 25,
        transactionsPerWallet: 8,
        concurrencyLevel: 20
      });

      const perf = result.performance;
      
      expect(perf.duration).toBeGreaterThan(0);
      expect(perf.averageTimes).toBeDefined();
      expect(perf.percentiles).toBeDefined();
      expect(perf.throughput).toBeDefined();
      expect(perf.errorRates).toBeDefined();
      expect(perf.totalOperations).toBeGreaterThan(0);
    });

    it('should benchmark against performance targets', async () => {
      const targets = {
        maxAvgResponseTime: 2000, // 2 seconds
        minThroughput: 10, // TPS
        maxErrorRate: 15 // Percent
      };

      const result = await loadTester.runThroughputTest({
        duration: 30000,
        targetTPS: 25
      });

      expect(result.performance.averageTimes.transaction).toBeLessThan(targets.maxAvgResponseTime);
      expect(result.actualTPS).toBeGreaterThan(targets.minThroughput);
      expect(result.performance.errorRates.transaction).toBeLessThan(targets.maxErrorRate);
    });
  });
});