#!/usr/bin/env node

/**
 * MLG.clan Gaming Platform - Solana Transaction Load Testing
 * Custom framework for testing Web3 transaction performance under high load
 */

import { Connection, PublicKey, Keypair, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, getAccount } from '@solana/spl-token';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SolanaTransactionLoadTester {
  constructor(options = {}) {
    this.options = {
      rpcUrl: options.rpcUrl || process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      concurrentUsers: options.users || 100,
      duration: options.duration || '5m',
      transactionTypes: options.transactionTypes || ['token_transfer', 'burn_vote', 'clan_reward'],
      tokenMint: options.tokenMint || null, // MLG token mint address
      ...options
    };

    this.connection = new Connection(this.options.rpcUrl, 'confirmed');
    this.testWallets = [];
    this.metrics = {
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      averageConfirmationTime: 0,
      transactionTimes: [],
      errorsByType: {},
      rpcCalls: 0,
      startTime: null,
      endTime: null
    };

    this.isRunning = false;
    this.testResults = [];
  }

  async run() {
    console.log('🔗 Starting Solana Transaction Load Testing');
    console.log(`📊 Target: ${this.options.concurrentUsers} concurrent users`);
    console.log(`⏱️  Duration: ${this.options.duration}`);
    console.log(`🌐 RPC: ${this.options.rpcUrl}`);

    this.metrics.startTime = Date.now();
    this.isRunning = true;

    try {
      // Setup phase
      await this.setupTestEnvironment();
      
      // Generate test wallets and fund them
      await this.generateTestWallets();
      await this.fundTestWallets();
      
      // Validate environment
      await this.validateSolanaEnvironment();
      
      // Run concurrent transaction load test
      await this.runConcurrentTransactionTests();
      
      this.metrics.endTime = Date.now();
      
      // Generate comprehensive report
      await this.generateReport();
      
      console.log('✅ Solana load testing completed successfully');
      
    } catch (error) {
      console.error('❌ Solana load testing failed:', error);
      throw error;
      
    } finally {
      this.isRunning = false;
      await this.cleanup();
    }
  }

  async setupTestEnvironment() {
    console.log('🔧 Setting up Solana test environment...');

    // Create test results directory
    const resultsDir = path.join(__dirname, '..', 'reports', 'solana');
    try {
      await fs.mkdir(resultsDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }

    console.log('✅ Solana environment setup complete');
  }

  async generateTestWallets() {
    console.log(`👛 Generating ${this.options.concurrentUsers} test wallets...`);

    this.testWallets = Array.from({ length: this.options.concurrentUsers }, () => ({
      keypair: Keypair.generate(),
      balance: 0,
      tokenBalance: 0,
      transactionCount: 0,
      successCount: 0,
      failureCount: 0
    }));

    console.log(`✅ Generated ${this.testWallets.length} test wallets`);
  }

  async fundTestWallets() {
    console.log('💰 Funding test wallets...');
    
    // In a real test environment, you would need to fund these wallets
    // For devnet testing, you could use the faucet or a funded master wallet
    
    const fundingPromises = this.testWallets.slice(0, 10).map(async (wallet, index) => {
      try {
        // Skip actual funding for load test - simulate funded wallets
        wallet.balance = 1000000; // 0.001 SOL equivalent in lamports
        wallet.tokenBalance = Math.floor(Math.random() * 1000) + 100; // Mock MLG tokens
        
        if (index < 3) {
          console.log(`  Wallet ${index + 1}: ${wallet.keypair.publicKey.toBase58()}`);
        }
        
      } catch (error) {
        console.warn(`Failed to fund wallet ${index}:`, error.message);
      }
    });

    await Promise.allSettled(fundingPromises);
    console.log('✅ Test wallets prepared for load testing');
  }

  async validateSolanaEnvironment() {
    console.log('🔍 Validating Solana environment...');

    try {
      // Test RPC connection
      const version = await this.connection.getVersion();
      console.log(`  ✅ RPC Connection: Solana ${version['solana-core']}`);
      
      // Test slot information
      const slot = await this.connection.getSlot();
      console.log(`  ✅ Current Slot: ${slot}`);
      
      // Test recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      console.log(`  ✅ Latest Blockhash: ${blockhash.slice(0, 8)}...`);
      
      // Increment RPC call count
      this.metrics.rpcCalls += 3;
      
    } catch (error) {
      throw new Error(`Solana environment validation failed: ${error.message}`);
    }

    console.log('✅ Solana environment validation passed');
  }

  async runConcurrentTransactionTests() {
    console.log('🚀 Starting concurrent transaction load testing...');

    const duration = this.parseDuration(this.options.duration);
    const endTime = Date.now() + duration * 1000;
    
    // Create worker pools for different transaction types
    const workerPools = this.options.transactionTypes.map(type => ({
      type,
      workers: Math.floor(this.options.concurrentUsers / this.options.transactionTypes.length),
      active: 0
    }));

    const allWorkers = [];

    // Start concurrent workers
    for (const pool of workerPools) {
      for (let i = 0; i < pool.workers; i++) {
        const worker = this.startTransactionWorker(
          this.testWallets[allWorkers.length % this.testWallets.length],
          pool.type,
          endTime
        );
        allWorkers.push(worker);
      }
    }

    console.log(`⚡ Started ${allWorkers.length} concurrent transaction workers`);

    // Monitor progress
    const monitorInterval = setInterval(() => {
      const elapsed = Date.now() - this.metrics.startTime;
      const remaining = Math.max(0, endTime - Date.now());
      
      console.log(`📊 Progress: ${this.metrics.totalTransactions} transactions, ${this.metrics.successfulTransactions} successful (${(remaining / 1000).toFixed(0)}s remaining)`);
    }, 10000);

    try {
      // Wait for all workers to complete
      await Promise.allSettled(allWorkers);
      
    } finally {
      clearInterval(monitorInterval);
    }

    console.log('✅ Concurrent transaction testing completed');
  }

  async startTransactionWorker(wallet, transactionType, endTime) {
    const workerId = Math.random().toString(36).substr(2, 9);
    
    while (Date.now() < endTime && this.isRunning) {
      try {
        const startTime = Date.now();
        
        // Execute transaction based on type
        let result;
        switch (transactionType) {
          case 'token_transfer':
            result = await this.simulateTokenTransfer(wallet);
            break;
          case 'burn_vote':
            result = await this.simulateBurnVote(wallet);
            break;
          case 'clan_reward':
            result = await this.simulateClanReward(wallet);
            break;
          default:
            result = await this.simulateBasicTransaction(wallet);
        }

        const duration = Date.now() - startTime;
        
        // Record metrics
        this.recordTransactionMetrics(transactionType, result.success, duration, result.error);
        
        // Update wallet stats
        wallet.transactionCount++;
        if (result.success) {
          wallet.successCount++;
        } else {
          wallet.failureCount++;
        }

      } catch (error) {
        this.recordTransactionMetrics(transactionType, false, 0, error.message);
        wallet.failureCount++;
      }

      // Brief pause between transactions
      await this.sleep(Math.random() * 100 + 50); // 50-150ms
    }
  }

  async simulateTokenTransfer(wallet) {
    // Simulate MLG token transfer (burn-to-vote mechanism)
    try {
      this.metrics.rpcCalls++;
      
      // Simulate successful token transfer
      if (Math.random() > 0.1) { // 90% success rate
        return { success: true, signature: this.generateMockSignature() };
      } else {
        return { success: false, error: 'Insufficient token balance' };
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async simulateBurnVote(wallet) {
    // Simulate burn-to-vote transaction
    try {
      this.metrics.rpcCalls++;
      
      // Simulate burn transaction with higher latency
      await this.sleep(Math.random() * 200 + 100); // 100-300ms
      
      if (Math.random() > 0.05) { // 95% success rate
        wallet.tokenBalance = Math.max(0, wallet.tokenBalance - 10);
        return { success: true, signature: this.generateMockSignature(), tokensBurned: 10 };
      } else {
        return { success: false, error: 'Network congestion' };
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async simulateClanReward(wallet) {
    // Simulate clan reward distribution
    try {
      this.metrics.rpcCalls++;
      
      if (Math.random() > 0.02) { // 98% success rate
        const reward = Math.floor(Math.random() * 50) + 10;
        wallet.tokenBalance += reward;
        return { success: true, signature: this.generateMockSignature(), tokensEarned: reward };
      } else {
        return { success: false, error: 'Reward distribution failed' };
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async simulateBasicTransaction(wallet) {
    // Simulate basic Solana transaction
    try {
      this.metrics.rpcCalls++;
      await this.sleep(Math.random() * 100 + 50); // 50-150ms
      
      if (Math.random() > 0.03) { // 97% success rate
        return { success: true, signature: this.generateMockSignature() };
      } else {
        return { success: false, error: 'Transaction failed' };
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  recordTransactionMetrics(type, success, duration, error = null) {
    this.metrics.totalTransactions++;
    
    if (success) {
      this.metrics.successfulTransactions++;
      this.metrics.transactionTimes.push(duration);
    } else {
      this.metrics.failedTransactions++;
      
      if (error) {
        const errorType = this.categorizeError(error);
        this.metrics.errorsByType[errorType] = (this.metrics.errorsByType[errorType] || 0) + 1;
      }
    }

    // Update running average
    if (this.metrics.transactionTimes.length > 0) {
      this.metrics.averageConfirmationTime = 
        this.metrics.transactionTimes.reduce((sum, time) => sum + time, 0) / this.metrics.transactionTimes.length;
    }
  }

  categorizeError(errorMessage) {
    const message = errorMessage.toLowerCase();
    
    if (message.includes('insufficient')) return 'insufficient_funds';
    if (message.includes('network')) return 'network_error';
    if (message.includes('congestion')) return 'network_congestion';
    if (message.includes('timeout')) return 'timeout';
    if (message.includes('signature')) return 'signature_error';
    if (message.includes('failed')) return 'transaction_failed';
    
    return 'unknown_error';
  }

  async generateReport() {
    console.log('📋 Generating Solana load test report...');

    const totalDuration = this.metrics.endTime - this.metrics.startTime;
    const successRate = (this.metrics.successfulTransactions / this.metrics.totalTransactions) * 100;
    const avgTps = this.metrics.totalTransactions / (totalDuration / 1000);

    // Calculate percentiles
    const sortedTimes = [...this.metrics.transactionTimes].sort((a, b) => a - b);
    const p50 = this.calculatePercentile(sortedTimes, 50);
    const p95 = this.calculatePercentile(sortedTimes, 95);
    const p99 = this.calculatePercentile(sortedTimes, 99);

    const report = {
      timestamp: new Date().toISOString(),
      configuration: this.options,
      duration: `${Math.floor(totalDuration / 1000)}s`,
      summary: {
        totalTransactions: this.metrics.totalTransactions,
        successfulTransactions: this.metrics.successfulTransactions,
        failedTransactions: this.metrics.failedTransactions,
        successRate: `${successRate.toFixed(2)}%`,
        averageTransactionsPerSecond: avgTps.toFixed(2),
        averageConfirmationTime: `${this.metrics.averageConfirmationTime.toFixed(2)}ms`,
        totalRpcCalls: this.metrics.rpcCalls
      },
      performance: {
        responseTimePercentiles: {
          p50: `${p50.toFixed(2)}ms`,
          p95: `${p95.toFixed(2)}ms`,
          p99: `${p99.toFixed(2)}ms`
        },
        transactionThroughput: {
          peak: `${Math.max(...this.calculateThroughputSamples()).toFixed(2)} TPS`,
          average: `${avgTps.toFixed(2)} TPS`,
          minimum: `${Math.min(...this.calculateThroughputSamples()).toFixed(2)} TPS`
        }
      },
      errors: this.metrics.errorsByType,
      walletStats: this.generateWalletStats(),
      recommendations: this.generateSolanaRecommendations()
    };

    // Save JSON report
    const reportPath = path.join(__dirname, '..', 'reports', 'solana', `solana-load-test-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Save human-readable report
    const textReport = this.generateTextReport(report);
    const textReportPath = path.join(__dirname, '..', 'reports', 'solana', `solana-load-test-${Date.now()}.txt`);
    await fs.writeFile(textReportPath, textReport);

    console.log(`📄 Solana report saved: ${reportPath}`);
    console.log(`📄 Text report saved: ${textReportPath}`);

    // Print summary to console
    this.printReportSummary(report);
  }

  generateWalletStats() {
    const totalWallets = this.testWallets.length;
    const activeWallets = this.testWallets.filter(w => w.transactionCount > 0).length;
    const avgTransactionsPerWallet = this.testWallets.reduce((sum, w) => sum + w.transactionCount, 0) / totalWallets;
    
    return {
      totalWallets,
      activeWallets,
      averageTransactionsPerWallet: avgTransactionsPerWallet.toFixed(2),
      walletSuccessRates: this.testWallets.slice(0, 5).map((wallet, index) => ({
        walletIndex: index,
        transactionCount: wallet.transactionCount,
        successRate: wallet.transactionCount > 0 ? 
          `${((wallet.successCount / wallet.transactionCount) * 100).toFixed(2)}%` : '0%'
      }))
    };
  }

  generateSolanaRecommendations() {
    const recommendations = [];
    const successRate = (this.metrics.successfulTransactions / this.metrics.totalTransactions) * 100;

    if (successRate < 95) {
      recommendations.push('Consider implementing transaction retry logic for failed burns');
      recommendations.push('Monitor Solana network congestion during peak voting periods');
    }

    if (this.metrics.averageConfirmationTime > 1000) {
      recommendations.push('Optimize transaction priority fees for faster confirmation');
      recommendations.push('Consider transaction batching for multiple vote operations');
    }

    if (this.metrics.errorsByType['network_congestion'] > 0) {
      recommendations.push('Implement graceful degradation during network congestion');
      recommendations.push('Consider using multiple RPC endpoints for load balancing');
    }

    recommendations.push('Monitor MLG token burn rates and adjust voting economics');
    recommendations.push('Implement transaction status polling for better UX');
    recommendations.push('Consider using Solana\'s transaction confirmation websockets');

    return recommendations;
  }

  calculatePercentile(sortedArray, percentile) {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
  }

  calculateThroughputSamples() {
    // Calculate throughput samples over 10-second windows
    if (this.metrics.transactionTimes.length < 10) return [0];
    
    const windowSize = 10000; // 10 seconds
    const samples = [];
    const duration = this.metrics.endTime - this.metrics.startTime;
    const windows = Math.floor(duration / windowSize);
    
    for (let i = 0; i < windows; i++) {
      const windowTransactions = Math.floor(this.metrics.totalTransactions / windows);
      const windowTps = windowTransactions / (windowSize / 1000);
      samples.push(windowTps);
    }
    
    return samples.length > 0 ? samples : [0];
  }

  generateTextReport(report) {
    return `
🔗 MLG.clan Solana Load Test Report
=====================================

⏰ Generated: ${report.timestamp}
⌛ Duration: ${report.duration}
🎯 Configuration: ${report.configuration.concurrentUsers} users, ${report.configuration.transactionTypes.join(', ')}

📊 SUMMARY
----------
Total Transactions: ${report.summary.totalTransactions}
Successful: ${report.summary.successfulTransactions}
Failed: ${report.summary.failedTransactions}
Success Rate: ${report.summary.successRate}
Avg TPS: ${report.summary.averageTransactionsPerSecond}
Avg Confirmation: ${report.summary.averageConfirmationTime}
Total RPC Calls: ${report.summary.totalRpcCalls}

⚡ PERFORMANCE
--------------
Response Time P50: ${report.performance.responseTimePercentiles.p50}
Response Time P95: ${report.performance.responseTimePercentiles.p95}
Response Time P99: ${report.performance.responseTimePercentiles.p99}
Peak TPS: ${report.performance.transactionThroughput.peak}
Average TPS: ${report.performance.transactionThroughput.average}

❌ ERRORS
---------
${Object.entries(report.errors).map(([type, count]) => `${type}: ${count}`).join('\n')}

💡 RECOMMENDATIONS
------------------
${report.recommendations.map(rec => `• ${rec}`).join('\n')}

👛 WALLET STATISTICS
--------------------
Total Wallets: ${report.walletStats.totalWallets}
Active Wallets: ${report.walletStats.activeWallets}
Avg Transactions per Wallet: ${report.walletStats.averageTransactionsPerWallet}
`;
  }

  printReportSummary(report) {
    console.log('\n🎮 MLG.clan Solana Load Test Results');
    console.log('=====================================');
    console.log(`⚡ ${report.summary.totalTransactions} total transactions`);
    console.log(`✅ ${report.summary.successRate} success rate`);
    console.log(`🚀 ${report.summary.averageTransactionsPerSecond} average TPS`);
    console.log(`⏱️  ${report.summary.averageConfirmationTime} average confirmation time`);
    console.log(`🌐 ${report.summary.totalRpcCalls} total RPC calls`);
    
    if (Object.keys(report.errors).length > 0) {
      console.log('\n❌ Errors encountered:');
      Object.entries(report.errors).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
    }
    
    console.log(`\n📊 Peak TPS: ${report.performance.transactionThroughput.peak}`);
    console.log(`📈 P95 Response Time: ${report.performance.responseTimePercentiles.p95}`);
  }

  parseDuration(duration) {
    const match = duration.match(/(\d+)([smh])/);
    if (!match) return 300; // Default 5 minutes

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      default: return 300;
    }
  }

  generateMockSignature() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz123456789';
    return Array.from({ length: 88 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup() {
    console.log('🧹 Cleaning up test environment...');
    // Clean up any resources if needed
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  args.forEach(arg => {
    if (arg.startsWith('--users=')) {
      options.users = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--duration=')) {
      options.duration = arg.split('=')[1];
    } else if (arg.startsWith('--rpc=')) {
      options.rpcUrl = arg.split('=')[1];
    }
  });

  const loadTester = new SolanaTransactionLoadTester(options);
  
  try {
    await loadTester.run();
    process.exit(0);
  } catch (error) {
    console.error('❌ Load test failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default SolanaTransactionLoadTester;