# Phantom Wallet Integration

This module provides secure Phantom wallet integration for the MLG.clan gaming community platform, built on Solana blockchain with comprehensive security measures and user-friendly error handling.

## Features

### 🔐 Security First
- **Read-only wallet connections** - Never requests or stores private keys
- **SIWS (Sign-In With Signature)** authentication patterns
- **Enhanced session persistence** with secure storage and expiration
- **Auto-reconnection** with exponential backoff and security checks
- **Account change detection** for immediate security disconnect
- **Connection validation** with network checks and periodic refresh
- **Activity tracking** for inactivity timeout management
- **Cross-tab session synchronization** via sessionStorage

### 🚀 Production Ready
- **Comprehensive error handling** with user-friendly messages
- **Connection state management** with proper cleanup
- **Fallback RPC providers** for reliability
- **Extensive unit test coverage** (31 passing tests)
- **TypeScript-compatible** interfaces
- **Event-driven architecture** for UI integration

### ⚡ Developer Experience
- **Simple API** for quick integration
- **Detailed error messages** for debugging
- **Example usage patterns** included
- **Webpack/Babel compatible** build setup
- **Jest test framework** configured

## Quick Start

### Installation

```bash
npm install @solana/web3.js @solana/wallet-adapter-phantom @solana/wallet-adapter-base
```

### Basic Usage

```javascript
import { getWalletManager } from './src/wallet/phantom-wallet.js';

// Get wallet manager instance with enhanced session persistence
const walletManager = getWalletManager();

// Connect to Phantom wallet with session persistence
try {
  const connectionInfo = await walletManager.connect();
  console.log('Connected:', connectionInfo.shortAddress);
  console.log('Session active:', connectionInfo.sessionActive);
} catch (error) {
  console.error('Connection failed:', error.message);
}

// Listen for enhanced events
walletManager.on('connected', (info) => {
  console.log('Wallet connected:', info.address);
});

walletManager.on('disconnected', () => {
  console.log('Wallet disconnected');
});

// Session management events
walletManager.on('sessionExpired', (data) => {
  console.log('Session expired due to:', data.reason);
});

walletManager.on('autoReconnectSuccess', (data) => {
  console.log('Auto-reconnected after attempts:', data.attempts);
});
```

### Advanced Usage with Session Management

```javascript
// Connect with custom options including auto-reconnect
const connectionInfo = await walletManager.connect({
  timeout: 15000,
  onlyIfTrusted: false,
  isAutoReconnect: false
});

// Sign message for authentication
const signature = await walletManager.signMessage('Auth message');

// Get wallet balance
const balance = await walletManager.getBalance(); // Returns SOL

// Validate connection with session refresh
const isValid = await walletManager.validateConnection();

// Get detailed wallet status including session info
const status = walletManager.getWalletStatus();
console.log('Session timeout in:', status.sessionTimeout);
console.log('Auto-reconnect enabled:', status.autoReconnectEnabled);

// Session management methods
const sessionInfo = walletManager.getSessionInfo();
console.log('Time since activity:', sessionInfo.timeSinceActivity);

// Update user preferences
walletManager.updateUserPreferences({
  autoReconnect: true,
  sessionTimeout: 4 * 60 * 60 * 1000, // 4 hours
  notifications: true
});

// Manual reconnection attempt
const reconnected = await walletManager.attemptAutoReconnect();

// Disconnect with preference control
await walletManager.disconnect(false); // Keep auto-reconnect enabled
```

## API Reference

### PhantomWalletManager

#### Static Methods

- `PhantomWalletManager.isPhantomAvailable()` - Check if Phantom is installed
- `getWalletManager()` - Get singleton instance
- `initializeWallet()` - Initialize new instance

#### Instance Methods

**Connection Management:**
- `connect(options?)` - Connect to Phantom wallet with session persistence
- `disconnect(clearPreferences?)` - Disconnect and cleanup with preference control
- `attemptAutoReconnect()` - Manual auto-reconnection attempt
- `validateConnection()` - Validate current connection with session refresh

**Session Management:**
- `getSessionInfo()` - Get comprehensive session information
- `updateActivityTimestamp()` - Update user activity for session management
- `updateUserPreferences(preferences)` - Update user preferences
- `saveSession()` - Manually save session data
- `restoreSession()` - Attempt to restore previous session

**Wallet Operations:**
- `getWalletStatus()` - Get current status with session info
- `getConnectionInfo()` - Get connection details with session data
- `getBalance()` - Get SOL balance
- `signMessage(message)` - Sign message for authentication

**Utilities:**
- `formatShortAddress(address)` - Format address as ABC...XYZ

#### Events

**Connection Events:**
- `connecting` - Connection attempt started
- `connected` - Successfully connected with session data
- `disconnected` - Wallet disconnected

**Session Management Events:**
- `sessionExpired` - Session expired due to inactivity
- `sessionRefreshed` - Session validated and refreshed
- `autoReconnectSuccess` - Auto-reconnection successful
- `autoReconnectFailed` - Auto-reconnection failed after max attempts
- `preferencesUpdated` - User preferences updated

**Security Events:**
- `error` - Connection or operation error
- `accountChanged` - Account switched (triggers security disconnect)

### Connection Options

```javascript
{
  timeout: 30000,        // Connection timeout (ms)
  onlyIfTrusted: false,  // Only auto-connect if trusted
  autoApprove: false,    // Skip approval dialog
  isAutoReconnect: false // Flag for auto-reconnection attempts
}
```

### Enhanced Connection Info Object

```javascript
{
  isConnected: true,
  publicKey: PublicKey,         // Solana PublicKey object
  address: "ABC...XYZ",         // Full base58 address
  shortAddress: "ABC...XYZ",    // Formatted short address
  network: "devnet",            // Current network
  walletName: "Phantom",        // Wallet identifier
  timestamp: 1640995200000,     // Connection timestamp
  
  // Enhanced session information
  sessionActive: true,          // Session persistence status
  lastActivity: 1640995200000,  // Last user activity timestamp
  timeSinceActivity: 30000,     // Milliseconds since last activity
  autoReconnectEnabled: true,   // Auto-reconnect preference
  userPreferences: {            // User preference object
    autoReconnect: true,
    sessionTimeout: 7200000,
    theme: 'auto',
    notifications: true
  }
}
```

### Session Information Object

```javascript
{
  isConnected: true,
  sessionData: {               // Raw session data
    publicKey: "ABC...XYZ",
    network: "devnet",
    timestamp: 1640995200000,
    lastActivity: 1640995200000,
    version: "2.0"
  },
  lastActivity: 1640995200000,
  userPreferences: { ... },
  reconnectionAttempts: 0,
  timeSinceActivity: 30000
}
```

## Session Management Examples

### Complete Session Management Setup

```javascript
import { initializeWalletWithSession } from './src/wallet/session-example.js';

// Initialize wallet with comprehensive session management
const walletManager = initializeWalletWithSession();

// Setup session monitoring
import { startSessionMonitoring } from './src/wallet/session-example.js';
startSessionMonitoring();
```

### User Preferences Management

```javascript
import { createPreferencesPanel } from './src/wallet/session-example.js';

// Create preferences UI configuration
const preferencesConfig = createPreferencesPanel();

// Example: Update timeout preference
walletManager.updateUserPreferences({
  sessionTimeout: 4 * 60 * 60 * 1000  // 4 hours
});

// Example: Disable auto-reconnect
walletManager.updateUserPreferences({
  autoReconnect: false
});
```

### Session Recovery and Validation

```javascript
import { validateSession, attemptReconnection } from './src/wallet/session-example.js';

// Check if current session is valid
const isValid = await validateSession();

if (!isValid && walletManager.sessionData) {
  // Attempt automatic reconnection
  const reconnected = await attemptReconnection();
  
  if (!reconnected) {
    // Show reconnection prompt to user
    console.log('Manual reconnection required');
  }
}
```

## Integration with Existing Platform

For integration with the existing MLG.clan HTML platform:

```javascript
import { integrateWithMLGPlatform } from './src/wallet/example-usage.js';

// Replace mock wallet functions with real Phantom integration
const walletManager = integrateWithMLGPlatform();
```

This will automatically replace the existing `connectWallet()` and `disconnectWallet()` functions with secure Phantom wallet integration including session persistence.

## Security Considerations

### What This Module Does

✅ **Safe Operations:**
- Detects Phantom wallet availability
- Requests read-only connection
- Signs messages for authentication
- Manages connection sessions securely
- Validates wallet state
- Provides user-friendly error handling

### What This Module Never Does

❌ **Never Performed:**
- Request or store private keys
- Access wallet without user consent
- Perform transactions without explicit user approval
- Store sensitive data in plain text
- Auto-connect without user interaction
- Bypass Phantom's security measures

### Enhanced Security Features

- **Configurable Session Expiration:** Auto-disconnects after user-defined inactivity (default 2 hours)
- **Account Change Detection:** Immediate security disconnect if account switches
- **Periodic Connection Validation:** Regular verification of wallet state with automatic refresh
- **Secure Multi-Storage:** Uses localStorage for persistence and sessionStorage for activity tracking
- **Activity Monitoring:** Tracks user interaction to prevent premature timeouts
- **Auto-Reconnection Security:** Validates sessions before attempting reconnection
- **Network Validation:** Ensures connection to correct Solana network with automatic cleanup on mismatch
- **Version-Controlled Sessions:** Session format versioning prevents compatibility issues
- **Cross-Tab Synchronization:** Prevents session conflicts across browser tabs
- **Exponential Backoff:** Prevents spam reconnection attempts with smart retry logic
- **Preference Isolation:** User preferences stored separately from session data for security

## Testing

Run the comprehensive test suite:

```bash
npm test
```

### Comprehensive Test Coverage

**Core Functionality:**
- ✅ Wallet detection and availability
- ✅ Connection and disconnection flows
- ✅ Error handling scenarios
- ✅ Address formatting and utilities
- ✅ Balance fetching operations
- ✅ Message signing functionality
- ✅ Event system and listeners

**Enhanced Session Management:**
- ✅ Session storage and restoration
- ✅ User preferences management
- ✅ Activity tracking and monitoring
- ✅ Auto-reconnection with exponential backoff
- ✅ Session timeout management
- ✅ Connection validation and refresh
- ✅ Cross-tab session synchronization
- ✅ Network mismatch handling
- ✅ Session expiration scenarios
- ✅ Preference isolation and security

**Edge Cases and Security:**
- ✅ Corrupt session data handling
- ✅ Storage quota exceeded scenarios
- ✅ Network failure recovery
- ✅ Concurrent connection attempts
- ✅ Resource cleanup verification
- ✅ Error boundary testing

## Configuration

### Solana Network Configuration

Edit `config/solana-config.js` to customize:

```javascript
// Switch networks
export const CURRENT_NETWORK = SOLANA_NETWORKS.MAINNET;

// Add custom RPC endpoints
export const RPC_ENDPOINTS = {
  [SOLANA_NETWORKS.MAINNET]: [
    'https://your-custom-rpc.com',
    clusterApiUrl('mainnet-beta')
  ]
};
```

### Wallet Configuration

```javascript
export const WALLET_CONFIG = {
  autoConnect: false,
  localStorageKey: 'mlg_clan_wallet_adapter',
  onError: (error) => console.error('Wallet error:', error)
};
```

## Error Handling

The module provides user-friendly error messages:

- **"Phantom wallet is not installed"** - User needs to install Phantom
- **"Connection was cancelled by user"** - User rejected connection
- **"Connection timed out"** - Network or user delay
- **"Wallet not connected"** - Operation requires connection
- **"Connection already in progress"** - Prevents multiple connections

## Performance

- **Lazy loading** - Only loads when needed
- **Connection pooling** - Reuses Solana RPC connections
- **Session persistence** - Avoids repeated connections
- **Event debouncing** - Optimizes UI updates
- **Memory management** - Proper cleanup on disconnect

## Browser Support

- ✅ Chrome/Chromium (recommended)
- ✅ Firefox
- ✅ Safari (with limitations)
- ✅ Edge
- ❌ Internet Explorer (not supported)

## Troubleshooting

### Common Issues

**Phantom not detected:**
- Ensure Phantom extension is installed and enabled
- Check browser developer console for errors
- Verify page is served over HTTPS (required by Phantom)

**Connection timeouts:**
- Check network connectivity
- Verify Solana RPC endpoints are accessible
- Increase timeout in connection options

**Session not persisting:**
- Check localStorage availability
- Verify domain permissions
- Clear browser cache if corrupted

**Network errors:**
- Verify correct network configuration
- Check RPC endpoint status
- Ensure firewall allows connections

## Contributing

When contributing to this module:

1. **Follow security guidelines** - Never request private keys
2. **Add comprehensive tests** - Cover new functionality
3. **Update documentation** - Keep README current
4. **Test thoroughly** - Verify on devnet before mainnet
5. **Handle errors gracefully** - Provide user-friendly messages

## License

MIT License - See project root for full license terms.

---

**⚠️ Security Notice:** This module handles wallet connections. Always review code changes carefully and test thoroughly before deploying to production. Never store private keys or sensitive user data.