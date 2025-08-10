/**
 * MLG Token Usage Example
 * 
 * Demonstrates how to use the MLG Token Manager with the real contract address
 * Contract Address: 7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL
 */

import { 
  mlgTokenManager, 
  initializeMLGTokenManager, 
  ensureMLGTokenManagerReady,
  MLGTokenUtils,
  BALANCE_CONFIG,
  BALANCE_EVENTS 
} from './spl-mlg-token.js';

/**
 * Example 1: Initialize MLG Token Manager with real contract
 */
async function initializeExample() {
  console.log('=== MLG Token Manager Initialization ===');
  
  try {
    const result = await initializeMLGTokenManager();
    
    if (result.success) {
      console.log('✅ MLG Token Manager initialized successfully');
      console.log('Token Info:', result.tokenInfo);
      
      // Verify contract deployment
      const verification = await mlgTokenManager.verifyMLGTokenContract();
      console.log('Contract Verification:', verification);
      
      return true;
    } else {
      console.error('❌ Initialization failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Initialization error:', error);
    return false;
  }
}

/**
 * Example 2: Check user's MLG token balance
 */
async function checkBalanceExample(walletAddress) {
  console.log('\n=== Check MLG Token Balance ===');
  
  try {
    // Ensure manager is ready
    const readyCheck = await ensureMLGTokenManagerReady();
    if (!readyCheck.success) {
      throw new Error('Token manager not ready: ' + readyCheck.error);
    }
    
    // Get optimized balance (with connection failover)
    const balance = await mlgTokenManager.getTokenBalanceOptimized(walletAddress);
    
    console.log(`Wallet: ${walletAddress}`);
    console.log(`MLG Balance: ${MLGTokenUtils.formatTokenAmount(balance.balance)} MLG`);
    console.log(`Raw Balance: ${balance.raw}`);
    console.log(`Has Token Account: ${balance.hasAccount}`);
    console.log(`Associated Token Address: ${balance.associatedTokenAddress}`);
    
    return balance;
  } catch (error) {
    console.error('❌ Balance check failed:', error.message);
    return null;
  }
}

/**
 * Example 3: Burn MLG tokens for additional votes
 */
async function burnForVotesExample(walletAddress, wallet, burnAmount) {
  console.log('\n=== Burn MLG Tokens for Votes ===');
  
  try {
    // Ensure manager is ready
    const readyCheck = await ensureMLGTokenManagerReady();
    if (!readyCheck.success) {
      throw new Error('Token manager not ready: ' + readyCheck.error);
    }
    
    // Get current balance
    const balance = await mlgTokenManager.getTokenBalanceOptimized(walletAddress);
    console.log(`Current MLG Balance: ${MLGTokenUtils.formatTokenAmount(balance.balance)} MLG`);
    
    // Validate burn parameters
    const validation = MLGTokenUtils.validateBurnToVote(burnAmount, balance.balance, 0);
    
    if (!validation.isValid) {
      console.error('❌ Burn validation failed:', validation.error);
      return null;
    }
    
    console.log(`✅ Validation passed`);
    console.log(`Votes to purchase: ${validation.votesToPurchase}`);
    console.log(`Actual cost: ${validation.actualCost} MLG`);
    console.log(`Next vote cost: ${validation.nextVoteCost || 'N/A'} MLG`);
    
    // Estimate transaction cost
    const txCost = await mlgTokenManager.estimateTransactionCost('burn');
    console.log(`Estimated SOL cost: ${txCost.sol} SOL (${txCost.lamports} lamports)`);
    
    // Execute burn (this would require actual wallet connection)
    console.log('🔥 Burning tokens...');
    const burnResult = await mlgTokenManager.burnTokens(walletAddress, wallet, burnAmount);
    
    console.log('✅ Tokens burned successfully');
    console.log(`Transaction Signature: ${burnResult.signature}`);
    console.log(`Burned Amount: ${burnResult.burnedAmount} MLG`);
    console.log(`Votes Gained: ${validation.votesToPurchase}`);
    
    return burnResult;
  } catch (error) {
    console.error('❌ Burn transaction failed:', error.message);
    return null;
  }
}

/**
 * Example 4: Get transaction history
 */
async function getTransactionHistoryExample(walletAddress) {
  console.log('\n=== MLG Token Transaction History ===');
  
  try {
    const readyCheck = await ensureMLGTokenManagerReady();
    if (!readyCheck.success) {
      throw new Error('Token manager not ready: ' + readyCheck.error);
    }
    
    const history = await mlgTokenManager.getTokenTransactionHistory(walletAddress, 5);
    
    console.log(`Found ${history.length} recent transactions:`);
    
    history.forEach((tx, index) => {
      console.log(`\n${index + 1}. Transaction ${tx.signature.substring(0, 8)}...`);
      console.log(`   Slot: ${tx.slot}`);
      console.log(`   Status: ${tx.success ? '✅ Success' : '❌ Failed'}`);
      console.log(`   Fee: ${tx.fee} lamports`);
      
      if (tx.tokenBalanceChanges) {
        const change = tx.tokenBalanceChanges.change;
        console.log(`   MLG Change: ${change > 0 ? '+' : ''}${change} MLG`);
      }
      
      if (tx.blockTime) {
        console.log(`   Time: ${new Date(tx.blockTime * 1000).toLocaleString()}`);
      }
    });
    
    return history;
  } catch (error) {
    console.error('❌ Transaction history failed:', error.message);
    return [];
  }
}

/**
 * Example 5: Real-time balance polling
 */
async function realTimeBalanceExample(walletAddress) {
  console.log('\n=== Real-Time Balance Polling ===');
  
  try {
    const readyCheck = await ensureMLGTokenManagerReady();
    if (!readyCheck.success) {
      throw new Error('Token manager not ready: ' + readyCheck.error);
    }
    
    // Set up event listeners for balance changes
    const balanceUpdateListener = mlgTokenManager.onBalanceChange(BALANCE_EVENTS.BALANCE_UPDATED, (data) => {
      console.log(`🔄 Balance updated for ${data.walletAddress}:`);
      console.log(`   New Balance: ${MLGTokenUtils.formatTokenAmount(data.balance.balance)} MLG`);
      console.log(`   Previous: ${data.previousBalance ? MLGTokenUtils.formatTokenAmount(data.previousBalance.balance) : 'N/A'} MLG`);
      console.log(`   Change: ${data.previousBalance ? (data.balance.balance - data.previousBalance.balance > 0 ? '+' : '') + MLGTokenUtils.formatTokenAmount(data.balance.balance - data.previousBalance.balance) : 'Initial'} MLG`);
    });
    
    const errorListener = mlgTokenManager.onBalanceChange(BALANCE_EVENTS.BALANCE_ERROR, (data) => {
      console.log(`❌ Balance polling error for ${data.walletAddress}: ${data.error}`);
      console.log(`   Error count: ${data.errorCount}`);
    });
    
    const pollingStartListener = mlgTokenManager.onBalanceChange(BALANCE_EVENTS.POLLING_STARTED, (data) => {
      console.log(`🚀 Started balance polling for ${data.walletAddress}`);
      console.log(`   Poll interval: ${data.pollInterval}ms`);
      console.log(`   Initial balance: ${MLGTokenUtils.formatTokenAmount(data.initialBalance.balance)} MLG`);
    });
    
    // Start real-time balance polling with fast updates
    console.log('Starting real-time balance polling...');
    const pollingId = await mlgTokenManager.startBalancePolling(walletAddress, {
      pollInterval: BALANCE_CONFIG.FAST_POLL_INTERVAL,
      autoCreateAccount: false,
      emitEvents: true
    });
    
    console.log(`Polling started with ID: ${pollingId}`);
    
    // Set wallet as active for optimized polling
    mlgTokenManager.setWalletActive(walletAddress);
    
    // Get real-time balance with caching
    const realtimeBalance = await mlgTokenManager.getTokenBalanceRealTime(walletAddress, {
      forceRefresh: true,
      useCache: true,
      priority: 'high'
    });
    
    console.log(`\n📊 Real-time balance data:`);
    console.log(`   Address: ${realtimeBalance.walletAddress}`);
    console.log(`   Balance: ${MLGTokenUtils.formatTokenAmount(realtimeBalance.balance)} MLG`);
    console.log(`   Has Account: ${realtimeBalance.hasAccount}`);
    console.log(`   Source: ${realtimeBalance.source}`);
    console.log(`   Connection: ${realtimeBalance.connection}`);
    console.log(`   Cached: ${realtimeBalance.cached}`);
    console.log(`   Timestamp: ${new Date(realtimeBalance.timestamp).toLocaleString()}`);
    
    // Let it poll for a while to demonstrate real-time updates
    console.log('\n⏱️  Polling for 15 seconds to demonstrate real-time updates...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Show polling status
    const pollingStatus = mlgTokenManager.getPollingStatus();
    console.log('\n📈 Current polling status:');
    console.log(`   Total wallets: ${pollingStatus.totalWallets}`);
    console.log(`   Active polling: ${pollingStatus.activePolling}`);
    console.log(`   Active wallets: ${pollingStatus.activeWallets}`);
    console.log(`   Cache size: ${pollingStatus.cacheSize}`);
    console.log(`   Event listeners: ${JSON.stringify(pollingStatus.eventListeners, null, 2)}`);
    
    // Stop polling and clean up
    console.log('\n🛑 Stopping balance polling...');
    await mlgTokenManager.stopBalancePolling(walletAddress);
    
    // Remove event listeners
    mlgTokenManager.offBalanceChange(balanceUpdateListener);
    mlgTokenManager.offBalanceChange(errorListener);
    mlgTokenManager.offBalanceChange(pollingStartListener);
    
    console.log('✅ Real-time balance polling example completed');
    
    return realtimeBalance;
  } catch (error) {
    console.error('❌ Real-time balance example failed:', error.message);
    return null;
  }
}

/**
 * Example 6: Batch balance fetching
 */
async function batchBalanceExample(walletAddresses) {
  console.log('\n=== Batch Balance Fetching ===');
  
  try {
    const readyCheck = await ensureMLGTokenManagerReady();
    if (!readyCheck.success) {
      throw new Error('Token manager not ready: ' + readyCheck.error);
    }
    
    console.log(`Fetching balances for ${walletAddresses.length} wallets...`);
    
    const startTime = Date.now();
    const batchResults = await mlgTokenManager.getBatchBalances(walletAddresses, {
      useCache: true,
      forceRefresh: false,
      maxConcurrent: 5
    });
    const duration = Date.now() - startTime;
    
    console.log(`\n📊 Batch balance results (${duration}ms):`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const [address, result] of batchResults) {
      const shortAddress = `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
      
      if (result.error) {
        console.log(`❌ ${shortAddress}: ${result.error}`);
        errorCount++;
      } else {
        console.log(`✅ ${shortAddress}: ${MLGTokenUtils.formatTokenAmount(result.balance)} MLG ${result.hasAccount ? '(account exists)' : '(no account)'} ${result.cached ? '(cached)' : '(fresh)'}`);
        successCount++;
      }
    }
    
    console.log(`\nSummary: ${successCount} successful, ${errorCount} errors`);
    console.log(`Average time per wallet: ${(duration / walletAddresses.length).toFixed(1)}ms`);
    
    return batchResults;
  } catch (error) {
    console.error('❌ Batch balance example failed:', error.message);
    return new Map();
  }
}

/**
 * Example 7: Wallet connection integration
 */
async function walletIntegrationExample(walletAddress, walletAdapter) {
  console.log('\n=== Wallet Integration with Real-Time Balance ===');
  
  try {
    const readyCheck = await ensureMLGTokenManagerReady();
    if (!readyCheck.success) {
      throw new Error('Token manager not ready: ' + readyCheck.error);
    }
    
    // Simulate wallet connection
    console.log('🔗 Handling wallet connection...');
    const connectionResult = await mlgTokenManager.handleWalletConnection(walletAddress, walletAdapter);
    
    console.log(`Connected wallet balance: ${MLGTokenUtils.formatTokenAmount(connectionResult.balance)} MLG`);
    console.log(`Has token account: ${connectionResult.hasAccount}`);
    
    if (!connectionResult.hasAccount) {
      console.log('\n🏗️  Associated token account needed. In a real app, you would:');
      console.log('   1. Show user the account creation requirement');
      console.log('   2. Explain the one-time SOL cost');
      console.log('   3. Offer to create the account');
      
      // Estimate account creation cost
      const creationCost = await mlgTokenManager.estimateTransactionCost('createAccount');
      console.log(`   Account creation cost: ${creationCost.sol} SOL`);
      
      // In a real implementation, you would create the account here:
      // const signature = await mlgTokenManager.createAssociatedTokenAccountRealTime(
      //   walletAddress, walletAdapter, { startPollingAfterCreation: true }
      // );
    }
    
    // Start monitoring this wallet
    await mlgTokenManager.startBalancePolling(walletAddress, {
      pollInterval: BALANCE_CONFIG.DEFAULT_POLL_INTERVAL,
      autoCreateAccount: false,
      emitEvents: true
    });
    
    // Set as active wallet
    mlgTokenManager.setWalletActive(walletAddress);
    
    console.log('\n✅ Wallet integration completed. Real-time balance monitoring active.');
    
    // Simulate wallet disconnection after some time
    setTimeout(async () => {
      console.log('\n🔌 Simulating wallet disconnection...');
      await mlgTokenManager.handleWalletDisconnection(walletAddress);
      console.log('✅ Wallet disconnected and cleanup completed');
    }, 10000);
    
    return connectionResult;
  } catch (error) {
    console.error('❌ Wallet integration example failed:', error.message);
    return null;
  }
}

/**
 * Example 8: Connection health monitoring
 */
async function connectionHealthExample() {
  console.log('\n=== Connection Health Status ===');
  
  try {
    // Check overall connection health
    const isHealthy = await mlgTokenManager.isConnectionHealthy();
    console.log(`Overall Health: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    
    // Get detailed connection pool status
    const poolStatus = mlgTokenManager.getConnectionPoolStatus();
    
    console.log(`\nConnection Pool Status:`);
    console.log(`Total Connections: ${poolStatus.totalConnections}`);
    console.log(`Healthy Connections: ${poolStatus.healthyConnections}`);
    console.log(`Current Index: ${poolStatus.currentIndex}`);
    console.log(`Last Health Check: ${new Date(poolStatus.lastHealthCheck).toLocaleString()}`);
    
    console.log(`\nIndividual Connection Health:`);
    poolStatus.connectionHealth.forEach(conn => {
      console.log(`  Connection ${conn.index}: ${conn.healthy ? '✅' : '❌'} ${conn.latency ? `(${conn.latency}ms)` : ''}`);
    });
    
    return poolStatus;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return null;
  }
}

/**
 * Example 9: Complete real-time balance system demonstration
 */
async function completeRealTimeExample(walletAddresses) {
  console.log('\n=== Complete Real-Time Balance System ===');
  
  try {
    const readyCheck = await ensureMLGTokenManagerReady();
    if (!readyCheck.success) {
      throw new Error('Token manager not ready: ' + readyCheck.error);
    }
    
    // Set up comprehensive event monitoring
    const events = [];
    
    Object.values(BALANCE_EVENTS).forEach(eventType => {
      mlgTokenManager.onBalanceChange(eventType, (data) => {
        events.push({ type: eventType, data, timestamp: Date.now() });
        console.log(`🔔 Event: ${eventType} for ${data.walletAddress}`);
      });
    });
    
    // Start monitoring multiple wallets
    console.log('🚀 Starting real-time monitoring for multiple wallets...');
    const pollingPromises = walletAddresses.map(async (address, index) => {
      const interval = index % 2 === 0 ? 
        BALANCE_CONFIG.FAST_POLL_INTERVAL : 
        BALANCE_CONFIG.DEFAULT_POLL_INTERVAL;
      
      return await mlgTokenManager.startBalancePolling(address, {
        pollInterval: interval,
        autoCreateAccount: false,
        emitEvents: true
      });
    });
    
    const pollingIds = await Promise.allSettled(pollingPromises);
    console.log(`Started polling for ${pollingIds.filter(p => p.status === 'fulfilled').length} wallets`);
    
    // Set some wallets as active
    walletAddresses.slice(0, 2).forEach(address => {
      mlgTokenManager.setWalletActive(address);
    });
    
    // Demonstrate batch fetching
    console.log('\n📦 Performing batch balance fetch...');
    const batchResults = await mlgTokenManager.getBatchBalances(walletAddresses, {
      useCache: true,
      forceRefresh: false
    });
    
    console.log(`Batch fetch completed for ${batchResults.size} wallets`);
    
    // Monitor for a period
    console.log('\n⏱️  Monitoring for 20 seconds...');
    await new Promise(resolve => setTimeout(resolve, 20000));
    
    // Show final status
    const finalStatus = mlgTokenManager.getPollingStatus();
    console.log('\n📊 Final polling status:');
    console.log(JSON.stringify(finalStatus, null, 2));
    
    console.log(`\n🔔 Total events captured: ${events.length}`);
    events.slice(-5).forEach(event => {
      console.log(`   ${event.type}: ${new Date(event.timestamp).toLocaleTimeString()}`);
    });
    
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    const stoppedCount = await mlgTokenManager.stopAllPolling();
    mlgTokenManager.clearBalanceCache();
    
    console.log(`Stopped ${stoppedCount} polling sessions`);
    console.log('✅ Complete real-time system demonstration finished');
    
    return {
      pollingIds: pollingIds.filter(p => p.status === 'fulfilled').map(p => p.value),
      batchResults,
      events,
      finalStatus
    };
  } catch (error) {
    console.error('❌ Complete real-time example failed:', error.message);
    return null;
  }
}

/**
 * Main example function with real-time features
 */
async function runMLGTokenExamples() {
  console.log('🎮 MLG Token Manager Examples with Real-Time Balance Fetching');
  console.log('Real Contract: 7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL');
  console.log('Network: Solana Mainnet-Beta\n');
  
  // Initialize
  const initialized = await initializeExample();
  if (!initialized) {
    console.log('❌ Cannot proceed without initialization');
    return;
  }
  
  // Example wallet addresses (replace with real addresses for testing)
  const exampleWalletAddresses = [
    'YourWalletAddressHereForTesting1111111111111',
    'AnotherWalletAddressForTesting222222222222',
    'ThirdWalletAddressForTesting3333333333333'
  ];
  const primaryWalletAddress = exampleWalletAddresses[0];
  
  // Check connection health
  await connectionHealthExample();
  
  // Basic balance check (will show error with example address but demonstrates flow)
  await checkBalanceExample(primaryWalletAddress);
  
  // Real-time balance polling demonstration
  console.log('\n🚀 Starting Real-Time Balance Examples...');
  await realTimeBalanceExample(primaryWalletAddress);
  
  // Batch balance fetching
  await batchBalanceExample(exampleWalletAddresses);
  
  // Wallet integration simulation
  const mockWalletAdapter = {
    signTransaction: async (tx) => {
      throw new Error('Mock wallet - use real Phantom wallet for actual transactions');
    },
    publicKey: { toString: () => primaryWalletAddress }
  };
  
  await walletIntegrationExample(primaryWalletAddress, mockWalletAdapter);
  
  // Get transaction history
  await getTransactionHistoryExample(primaryWalletAddress);
  
  // Complete system demonstration (commented out to avoid lengthy execution)
  /*
  console.log('\n🎯 Running complete real-time system demonstration...');
  await completeRealTimeExample(exampleWalletAddresses);
  */
  
  // Example burn transaction (commented out as it requires real wallet)
  /*
  await burnForVotesExample(primaryWalletAddress, mockWalletAdapter, 3); // Burn 3 MLG
  */
  
  console.log('\n✅ MLG Token Manager examples with real-time features completed');
  console.log('\n📝 Summary of Real-Time Features Demonstrated:');
  console.log('   • Real-time balance polling with configurable intervals');
  console.log('   • Balance caching with smart invalidation');
  console.log('   • Event-driven balance change notifications');
  console.log('   • Batch balance fetching for multiple accounts');
  console.log('   • Connection failover and health monitoring');
  console.log('   • Active/inactive wallet optimization');
  console.log('   • Wallet connection/disconnection handling');
  console.log('   • Associated token account management');
  console.log('   • Error handling with exponential backoff');
  console.log('   • Performance monitoring and status reporting');
}

// Export for use in other modules
export {
  initializeExample,
  checkBalanceExample,
  burnForVotesExample,
  getTransactionHistoryExample,
  realTimeBalanceExample,
  batchBalanceExample,
  walletIntegrationExample,
  connectionHealthExample,
  completeRealTimeExample,
  runMLGTokenExamples
};

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMLGTokenExamples().catch(console.error);
}