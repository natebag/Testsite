# MLG Token Real-Time Balance System

## Overview

The MLG Token Real-Time Balance System provides comprehensive real-time monitoring of SPL token balances with advanced features including polling, caching, event notifications, and seamless wallet integration.

## Key Features

### ✅ Completed Features (Sub-task 2.2)

- **Real-time Balance Fetching**: Optimized balance queries using @solana/spl-token
- **Configurable Polling**: Multiple polling intervals (fast, normal, slow)
- **Smart Caching**: Efficient cache management with automatic invalidation
- **Event System**: Comprehensive event notifications for balance changes
- **Connection Failover**: Multiple RPC endpoints with health monitoring
- **Batch Processing**: Efficient fetching for multiple wallet addresses
- **Associated Token Account Management**: Automatic detection and creation
- **Error Handling**: Robust error handling with exponential backoff
- **Phantom Wallet Integration**: Seamless integration with PhantomWalletManager
- **Performance Monitoring**: Real-time status and performance metrics

## Quick Start

### 1. Basic Setup

```javascript
import { 
  mlgTokenManager, 
  initializeMLGTokenManager,
  BALANCE_EVENTS,
  BALANCE_CONFIG 
} from './spl-mlg-token.js';

// Initialize the token manager
const result = await initializeMLGTokenManager();
if (result.success) {
  console.log('✅ MLG Token Manager ready');
}
```

### 2. Real-Time Balance Monitoring

```javascript
// Start monitoring a wallet
const pollingId = await mlgTokenManager.startBalancePolling(walletAddress, {
  pollInterval: BALANCE_CONFIG.FAST_POLL_INTERVAL, // 2 seconds
  autoCreateAccount: false,
  emitEvents: true
});

// Listen for balance changes
mlgTokenManager.onBalanceChange(BALANCE_EVENTS.BALANCE_UPDATED, (data) => {
  console.log(`Balance updated: ${data.balance.balance} MLG`);
  updateUI(data);
});
```

### 3. Phantom Wallet Integration

```javascript
import { MLGWalletIntegration } from './phantom-integration-example.js';

const integration = new MLGWalletIntegration();
await integration.initialize();

// Connect wallet with automatic balance monitoring
const result = await integration.connectWallet();
if (result.success) {
  console.log(`Connected: ${result.walletAddress}`);
  // Real-time monitoring starts automatically
}
```

## API Reference

### MLGTokenManager Methods

#### Real-Time Balance Fetching

```javascript
// Get real-time balance with options
const balance = await mlgTokenManager.getTokenBalanceRealTime(walletAddress, {
  forceRefresh: false,    // Skip cache if true
  useCache: true,         // Use cached data if available
  createIfMissing: false, // Auto-create token account
  priority: 'normal'      // 'high' uses optimized connection
});
```

#### Polling Management

```javascript
// Start polling
const pollingId = await mlgTokenManager.startBalancePolling(walletAddress, {
  pollInterval: 5000,     // Poll every 5 seconds
  autoCreateAccount: true,
  emitEvents: true
});

// Stop polling
await mlgTokenManager.stopBalancePolling(walletAddress);

// Stop all polling
const stoppedCount = await mlgTokenManager.stopAllPolling();
```

#### Batch Operations

```javascript
// Fetch multiple balances efficiently
const wallets = ['wallet1...', 'wallet2...', 'wallet3...'];
const results = await mlgTokenManager.getBatchBalances(wallets, {
  useCache: true,
  maxConcurrent: 5
});

// Process results
for (const [address, balance] of results) {
  if (balance.error) {
    console.log(`Error for ${address}: ${balance.error}`);
  } else {
    console.log(`${address}: ${balance.balance} MLG`);
  }
}
```

#### Event Management

```javascript
// Listen for events
const listenerId = mlgTokenManager.onBalanceChange(BALANCE_EVENTS.BALANCE_UPDATED, (data) => {
  // Handle balance update
});

// Remove listener
mlgTokenManager.offBalanceChange(listenerId);

// Available events
BALANCE_EVENTS.BALANCE_UPDATED    // Balance changed
BALANCE_EVENTS.BALANCE_ERROR      // Polling error
BALANCE_EVENTS.ACCOUNT_CREATED    // Token account created
BALANCE_EVENTS.POLLING_STARTED    // Monitoring started
BALANCE_EVENTS.POLLING_STOPPED    // Monitoring stopped
BALANCE_EVENTS.CONNECTION_CHANGED // Wallet connect/disconnect
```

#### Performance Optimization

```javascript
// Set wallet as active (faster polling)
mlgTokenManager.setWalletActive(walletAddress);

// Set as inactive (slower polling)
mlgTokenManager.setWalletInactive(walletAddress);

// Get performance status
const status = mlgTokenManager.getPollingStatus();
console.log(`Active polling: ${status.activePolling}`);
console.log(`Cache size: ${status.cacheSize}`);
```

### Configuration

```javascript
// Polling intervals
BALANCE_CONFIG.DEFAULT_POLL_INTERVAL  // 5 seconds
BALANCE_CONFIG.FAST_POLL_INTERVAL     // 2 seconds (active users)
BALANCE_CONFIG.SLOW_POLL_INTERVAL     // 15 seconds (inactive users)

// Cache settings
BALANCE_CONFIG.CACHE_DURATION         // 3 seconds
BALANCE_CONFIG.MAX_CACHE_ENTRIES      // 100 entries

// Batch processing
BALANCE_CONFIG.BATCH_SIZE             // 10 concurrent requests
BALANCE_CONFIG.BATCH_TIMEOUT          // 1 second delay

// Error handling
BALANCE_CONFIG.MAX_POLLING_ERRORS     // 5 errors before stopping
BALANCE_CONFIG.ERROR_BACKOFF_MULTIPLIER // 2x backoff
```

## Integration Patterns

### 1. React Component Integration

```javascript
import { useEffect, useState } from 'react';
import { mlgTokenManager, BALANCE_EVENTS } from './spl-mlg-token.js';

function MLGBalanceDisplay({ walletAddress }) {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!walletAddress) return;
    
    // Start monitoring
    const startMonitoring = async () => {
      await mlgTokenManager.startBalancePolling(walletAddress);
      const initialBalance = await mlgTokenManager.getTokenBalanceRealTime(walletAddress);
      setBalance(initialBalance);
      setLoading(false);
    };
    
    // Listen for updates
    const listenerId = mlgTokenManager.onBalanceChange(
      BALANCE_EVENTS.BALANCE_UPDATED,
      (data) => {
        if (data.walletAddress === walletAddress) {
          setBalance(data.balance);
        }
      }
    );
    
    startMonitoring();
    
    // Cleanup
    return () => {
      mlgTokenManager.stopBalancePolling(walletAddress);
      mlgTokenManager.offBalanceChange(listenerId);
    };
  }, [walletAddress]);
  
  if (loading) return <div>Loading balance...</div>;
  
  return (
    <div className="mlg-balance">
      <span className="balance-amount">{balance?.balance?.toFixed(2) || 0}</span>
      <span className="balance-symbol">MLG</span>
      {!balance?.hasAccount && (
        <div className="no-account-warning">
          No token account - cannot receive MLG
        </div>
      )}
    </div>
  );
}
```

### 2. Vanilla JavaScript Integration

```javascript
// Initialize integration
const integration = new MLGWalletIntegration();
await integration.initialize();

// Set up UI event handlers
document.getElementById('connect-wallet').addEventListener('click', async () => {
  const result = await integration.connectWallet();
  if (result.success) {
    document.getElementById('wallet-address').textContent = result.walletAddress;
    document.getElementById('wallet-status').style.display = 'block';
  }
});

document.getElementById('burn-tokens').addEventListener('click', async () => {
  const amount = parseFloat(document.getElementById('burn-amount').value);
  try {
    const result = await integration.burnTokensForVotes(amount, Math.floor(amount));
    alert(`Burned ${result.burnedAmount} MLG tokens successfully!`);
  } catch (error) {
    alert(`Burn failed: ${error.message}`);
  }
});

// Update balance display when it changes
integration.tokenManager.onBalanceChange(BALANCE_EVENTS.BALANCE_UPDATED, (data) => {
  document.getElementById('mlg-balance').textContent = `${data.balance.balance.toFixed(2)} MLG`;
});
```

### 3. Vue.js Integration

```javascript
// Vue component
export default {
  data() {
    return {
      walletAddress: null,
      balance: null,
      isMonitoring: false
    };
  },
  
  async mounted() {
    await this.initializeTokenManager();
    this.setupEventListeners();
  },
  
  methods: {
    async initializeTokenManager() {
      const result = await initializeMLGTokenManager();
      if (!result.success) {
        console.error('Token manager init failed:', result.error);
      }
    },
    
    setupEventListeners() {
      mlgTokenManager.onBalanceChange(BALANCE_EVENTS.BALANCE_UPDATED, (data) => {
        if (data.walletAddress === this.walletAddress) {
          this.balance = data.balance;
        }
      });
    },
    
    async startMonitoring(walletAddress) {
      this.walletAddress = walletAddress;
      await mlgTokenManager.startBalancePolling(walletAddress);
      this.balance = await mlgTokenManager.getTokenBalanceRealTime(walletAddress);
      this.isMonitoring = true;
    },
    
    async stopMonitoring() {
      if (this.walletAddress) {
        await mlgTokenManager.stopBalancePolling(this.walletAddress);
        this.isMonitoring = false;
      }
    }
  },
  
  beforeUnmount() {
    this.stopMonitoring();
  }
};
```

## Error Handling

### Common Error Scenarios

```javascript
try {
  const balance = await mlgTokenManager.getTokenBalanceRealTime(walletAddress);
} catch (error) {
  switch (error.message) {
    case 'Token manager not initialized':
      // Initialize first
      await initializeMLGTokenManager();
      break;
      
    case 'Invalid wallet address':
      // Validate address format
      break;
      
    case 'Network connection failed':
      // Show offline message, retry later
      break;
      
    default:
      console.error('Unexpected error:', error);
  }
}
```

### Error Event Handling

```javascript
mlgTokenManager.onBalanceChange(BALANCE_EVENTS.BALANCE_ERROR, (data) => {
  console.log(`Balance error for ${data.walletAddress}: ${data.error}`);
  
  if (data.errorCount >= 3) {
    // Show user notification about connection issues
    showNotification('Connection issues detected. Balance updates may be delayed.', 'warning');
  }
  
  if (data.errorCount >= BALANCE_CONFIG.MAX_POLLING_ERRORS) {
    // Polling has stopped due to too many errors
    showNotification('Balance monitoring stopped due to connection errors.', 'error');
  }
});
```

## Performance Optimization

### Best Practices

1. **Use Appropriate Polling Intervals**
   ```javascript
   // For active trading/gaming users
   await mlgTokenManager.startBalancePolling(address, {
     pollInterval: BALANCE_CONFIG.FAST_POLL_INTERVAL
   });
   
   // For background monitoring
   await mlgTokenManager.startBalancePolling(address, {
     pollInterval: BALANCE_CONFIG.SLOW_POLL_INTERVAL
   });
   ```

2. **Leverage Caching**
   ```javascript
   // Use cache for non-critical updates
   const balance = await mlgTokenManager.getTokenBalanceRealTime(address, {
     useCache: true,
     forceRefresh: false
   });
   ```

3. **Batch Operations**
   ```javascript
   // Instead of individual calls
   const results = await mlgTokenManager.getBatchBalances(walletAddresses);
   ```

4. **Clean Up Resources**
   ```javascript
   // Always stop polling when done
   await mlgTokenManager.stopBalancePolling(address);
   
   // Remove event listeners
   mlgTokenManager.offBalanceChange(listenerId);
   ```

### Performance Monitoring

```javascript
// Get current performance metrics
const status = mlgTokenManager.getPollingStatus();
console.log('Performance Metrics:', {
  activePolling: status.activePolling,
  cacheSize: status.cacheSize,
  averageLatency: status.pollingWallets.reduce((sum, w) => sum + (w.latency || 0), 0) / status.pollingWallets.length
});

// Monitor connection health
const health = mlgTokenManager.getConnectionPoolStatus();
console.log(`Healthy connections: ${health.healthyConnections}/${health.totalConnections}`);
```

## Troubleshooting

### Common Issues

1. **Balance Not Updating**
   - Check if polling is active: `mlgTokenManager.getPollingStatus()`
   - Verify wallet address is correct
   - Check network connection health

2. **High CPU Usage**
   - Reduce polling frequency for inactive users
   - Use `setWalletInactive()` for background wallets
   - Check for memory leaks in event listeners

3. **Network Errors**
   - System automatically handles connection failover
   - Check `getConnectionPoolStatus()` for health
   - Consider adjusting `BALANCE_CONFIG.MAX_POLLING_ERRORS`

4. **Cache Issues**
   - Clear cache: `mlgTokenManager.clearBalanceCache()`
   - Disable cache temporarily: `useCache: false`
   - Check cache size limits

### Debug Mode

```javascript
// Enable verbose logging
console.log('Token Manager Status:', mlgTokenManager.getPollingStatus());
console.log('Connection Health:', mlgTokenManager.getConnectionPoolStatus());

// Monitor all events
Object.values(BALANCE_EVENTS).forEach(event => {
  mlgTokenManager.onBalanceChange(event, (data) => {
    console.log(`DEBUG: ${event}`, data);
  });
});
```

## Security Considerations

### Safe Practices

1. **Never Store Private Keys**
   - System only uses public keys and read-only operations
   - All signing operations go through wallet adapters

2. **Validate Addresses**
   ```javascript
   import { PublicKey } from '@solana/web3.js';
   
   function isValidAddress(address) {
     try {
       new PublicKey(address);
       return true;
     } catch {
       return false;
     }
   }
   ```

3. **Handle User Rejections**
   ```javascript
   try {
     await mlgTokenManager.burnTokens(address, wallet, amount);
   } catch (error) {
     if (error.message.includes('User rejected')) {
       // Handle gracefully - don't retry automatically
     }
   }
   ```

4. **Rate Limiting**
   - System includes built-in rate limiting
   - Respect RPC provider limits
   - Use batch operations for multiple queries

## Migration Guide

### From Basic Balance Queries

**Before:**
```javascript
const balance = await mlgTokenManager.getTokenBalance(walletAddress);
```

**After:**
```javascript
// For one-time queries
const balance = await mlgTokenManager.getTokenBalanceRealTime(walletAddress);

// For continuous monitoring
await mlgTokenManager.startBalancePolling(walletAddress);
mlgTokenManager.onBalanceChange(BALANCE_EVENTS.BALANCE_UPDATED, updateUI);
```

### Adding Event Handling

```javascript
// Add event listeners for better UX
mlgTokenManager.onBalanceChange(BALANCE_EVENTS.BALANCE_UPDATED, (data) => {
  // Update UI immediately when balance changes
  updateBalanceDisplay(data.balance);
});

mlgTokenManager.onBalanceChange(BALANCE_EVENTS.BALANCE_ERROR, (data) => {
  // Show user-friendly error messages
  showErrorNotification(`Connection issue: ${data.error}`);
});
```

## Examples

See the following files for complete examples:

- **`phantom-integration-example.js`** - Complete wallet integration
- **`mlg-token-usage-example.js`** - Updated usage examples with real-time features  
- **`spl-mlg-token-realtime.test.js`** - Comprehensive test suite

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review test files for usage patterns
3. Monitor console logs for error details
4. Verify network connectivity and RPC health

The real-time balance system is designed to be robust and self-healing, with automatic error recovery and connection failover built-in.