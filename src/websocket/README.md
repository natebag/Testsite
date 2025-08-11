# MLG.clan Real-Time WebSocket System

A comprehensive real-time data synchronization system built with Socket.IO for the MLG.clan gaming platform. Provides instant updates for voting, clan activities, content moderation, and user interactions.

## Features

### Core Features
- **WebSocket Server Architecture**: Enterprise-grade Socket.IO server with Redis clustering
- **Authentication & Security**: Wallet-based authentication with JWT tokens and signature verification
- **Connection Management**: Advanced connection lifecycle management with health monitoring
- **Real-Time Events**: Comprehensive event system for all gaming platform features
- **Rate Limiting**: Intelligent rate limiting with role-based permissions
- **Performance Monitoring**: Real-time metrics collection and performance analysis
- **Repository Integration**: Automatic WebSocket event emission from repository operations
- **Cache Synchronization**: Real-time cache invalidation and warming coordination
- **Client Library**: Frontend JavaScript client with auto-reconnection and offline support

### Gaming-Specific Features
- **Live Voting**: Real-time vote counting with MLG token burn tracking
- **Clan Management**: Member activities, leaderboards, and governance events
- **Content Moderation**: Live moderation status updates and trending notifications
- **User Progression**: Achievement unlocks, reputation changes, and level-ups
- **Tournament Management**: Real-time tournament updates and notifications

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │◄──►│  WebSocket      │◄──►│   Repository    │
│                 │    │     Server      │    │   Integration   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │      Redis      │              │
         │              │   (Clustering)  │              │
         │              └─────────────────┘              │
         │                                                │
         ▼                                                ▼
┌─────────────────┐                              ┌─────────────────┐
│     Cache       │                              │   Performance   │
│ Synchronization │                              │   Monitoring    │
└─────────────────┘                              └─────────────────┘
```

## Installation

### Server Dependencies
```bash
npm install socket.io @socket.io/redis-adapter
npm install rate-limiter-flexible tweetnacl bs58
npm install @solana/web3.js jsonwebtoken
```

### Client Dependencies
```bash
npm install socket.io-client
```

## Quick Start

### 1. Server Setup

```javascript
// server.js
import { RealTimeSyncServer } from './src/websocket/realtime-sync.js';
import { createServer } from 'http';
import express from 'express';

const app = express();
const server = createServer(app);

// Initialize WebSocket server
const realtimeServer = new RealTimeSyncServer(server, {
  logger: console,
  redisAdapter: {
    enabled: true
  }
});

await realtimeServer.initialize();

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### 2. Client Setup

```javascript
// client.js
import { createWebSocketClient } from './src/websocket/clients/websocketClient.js';

// Create client instance
const client = createWebSocketClient('ws://localhost:3000', {
  autoConnect: true,
  debug: true
});

// Handle connection events
client.addEventListener('connect', () => {
  console.log('Connected to MLG.clan real-time server');
});

// Authenticate with wallet
client.addEventListener('connect', async () => {
  const authToken = await getAuthToken(); // Your auth logic
  client.authenticate(authToken);
});

// Subscribe to events
client.addEventListener('authenticated', () => {
  // Subscribe to user updates
  client.subscribe('user', userId);
  
  // Subscribe to clan events
  client.subscribe('clan', clanId);
  
  // Subscribe to voting updates
  client.subscribe('voting', contentId);
});
```

### 3. Repository Integration

```javascript
// repository-setup.js
import { RepositoryEventEmitter } from './src/integrations/repositoryEventEmitter.js';
import UserRepository from './src/data/repositories/UserRepository.js';

const eventEmitter = new RepositoryEventEmitter({
  realTimeServer: realtimeServer
});

// Register repositories
const userRepo = new UserRepository();
eventEmitter.registerRepository('user', userRepo);

// Now all repository operations automatically emit WebSocket events
await userRepo.updateProfile(userId, profileData); // Triggers 'user:profile_updated'
```

## Event System

### System Events
- `system:connection` - Connection established
- `system:authentication` - Authentication status
- `system:server_status` - Server status updates
- `system:maintenance` - Maintenance notifications
- `system:alert` - System alerts

### User Events
```javascript
// Listen for user events
client.on('user:profile_updated', (data) => {
  console.log('Profile updated:', data);
});

client.on('user:achievement_unlocked', (data) => {
  showAchievementNotification(data.achievementName);
});

client.on('user:balance_updated', (data) => {
  updateBalanceDisplay(data.newBalance);
});
```

### Clan Events
```javascript
// Listen for clan events
client.on('clan:member_joined', (data) => {
  addMemberToList(data.username);
});

client.on('clan:leaderboard_updated', (data) => {
  refreshLeaderboard(data.leaderboard);
});

client.on('clan:proposal_created', (data) => {
  showGovernanceNotification(data.title);
});
```

### Voting Events
```javascript
// Listen for voting events
client.on('vote:count_updated', (data) => {
  updateVoteCount(data.contentId, data.newCount);
});

client.on('vote:mlg_burned', (data) => {
  showBurnConfirmation(data.tokensBurned);
});

client.on('vote:daily_limit_warning', (data) => {
  showLimitWarning(data.remainingVotes);
});
```

### Content Events
```javascript
// Listen for content events
client.on('content:approved', (data) => {
  showApprovalNotification(data.title);
});

client.on('content:trending_updated', (data) => {
  updateTrendingList(data.trending);
});

client.on('content:engagement', (data) => {
  updateEngagementStats(data.contentId, data.type);
});
```

## Authentication

### Wallet-Based Authentication
```javascript
// Phantom wallet integration
async function authenticateWithPhantom() {
  const { solana } = window;
  
  if (solana && solana.isPhantom) {
    // Connect to wallet
    await solana.connect();
    
    // Create authentication message
    const message = `MLG.clan authentication: ${Date.now()}`;
    const encodedMessage = new TextEncoder().encode(message);
    
    // Sign message
    const signedMessage = await solana.signMessage(encodedMessage);
    
    // Create JWT token (server-side)
    const authResponse = await fetch('/api/auth/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey: solana.publicKey.toString(),
        signature: bs58.encode(signedMessage.signature),
        message: message
      })
    });
    
    const { token } = await authResponse.json();
    
    // Authenticate WebSocket
    client.authenticate(token, bs58.encode(signedMessage.signature), message);
  }
}
```

## Room Management

### Joining Rooms
```javascript
// Join user-specific room (automatic)
client.subscribe('user', userId);

// Join clan room
client.subscribe('clan', clanId);

// Join content-specific room
client.subscribe('content', contentId);

// Join custom room
client.subscribe('room', 'custom_room_id');
```

### Room Events
```javascript
client.on('room_joined', (data) => {
  console.log(`Joined room: ${data.roomId}`);
});

client.on('room_left', (data) => {
  console.log(`Left room: ${data.roomId}`);
});
```

## Performance Optimization

### Bandwidth Management
```javascript
// Set bandwidth mode based on connection
const connection = navigator.connection;
if (connection && connection.effectiveType === '2g') {
  client.setBandwidthMode('lowBandwidth');
} else if (connection && connection.effectiveType === '4g') {
  client.setBandwidthMode('highBandwidth');
}
```

### Event Filtering
```javascript
// Update event preferences
client.updatePreferences({
  achievements: true,
  reputation: true,
  balance: true,
  social: false, // Disable social notifications
  trending: false // Disable trending updates
});
```

## Error Handling

### Connection Errors
```javascript
client.addEventListener('connect_error', (error) => {
  console.error('Connection failed:', error);
  showConnectionError();
});

client.addEventListener('reconnect_failed', () => {
  showOfflineMode();
});
```

### Authentication Errors
```javascript
client.addEventListener('authentication_failed', (data) => {
  console.error('Authentication failed:', data.error);
  redirectToLogin();
});
```

### Rate Limiting
```javascript
client.addEventListener('rate_limited', (data) => {
  console.warn(`Rate limited: ${data.message}`);
  showRateLimitWarning(data.retryAfter);
});
```

## Monitoring & Analytics

### Client Metrics
```javascript
// Get performance metrics
const metrics = client.getMetrics();
console.log('Performance:', {
  uptime: metrics.uptime,
  messagesReceived: metrics.messagesReceived,
  reconnectCount: metrics.reconnectCount,
  isOnline: metrics.isOnline
});
```

### Server Monitoring
```javascript
// Listen for server status
client.on('system:server_status', (status) => {
  console.log('Server health:', {
    connections: status.connections,
    memory: status.memory,
    uptime: status.uptime
  });
});
```

## Development & Testing

### Debug Mode
```javascript
const client = createWebSocketClient('ws://localhost:3000', {
  debug: true, // Enable debug logging
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});
```

### Event Testing
```javascript
// Emit test events (development only)
if (process.env.NODE_ENV === 'development') {
  client.send('test:event', { message: 'Test data' });
}
```

## Production Deployment

### Environment Configuration
```javascript
// Production settings
const productionConfig = {
  url: process.env.WEBSOCKET_URL,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
  timeout: 20000,
  transports: ['websocket'],
  debug: false
};
```

### Load Balancing
```javascript
// Multiple server support
const servers = [
  'wss://ws1.mlg.clan',
  'wss://ws2.mlg.clan',
  'wss://ws3.mlg.clan'
];

const client = createWebSocketClient(servers[0], {
  // Failover to other servers on connection failure
  reconnectionAttempts: 3
});
```

### SSL/TLS Configuration
```javascript
// Secure WebSocket connection
const client = createWebSocketClient('wss://secure.mlg.clan', {
  secure: true,
  rejectUnauthorized: true,
  transports: ['websocket']
});
```

## File Structure

```
src/websocket/
├── realtime-sync.js              # Main WebSocket server
├── events/
│   ├── systemEvents.js           # System-level events
│   ├── userEvents.js             # User-specific events
│   ├── clanEvents.js             # Clan activity events
│   ├── votingEvents.js           # Voting system events
│   └── contentEvents.js          # Content lifecycle events
├── middleware/
│   ├── auth.middleware.js        # Authentication middleware
│   ├── rateLimiter.middleware.js # Rate limiting
│   └── eventFilter.middleware.js # Event filtering
├── managers/
│   ├── connectionManager.js      # Connection lifecycle
│   ├── roomManager.js            # Room management
│   └── eventAggregator.js        # Event optimization
├── monitoring/
│   ├── websocketMetrics.js       # Metrics collection
│   └── performanceMonitor.js     # Performance analysis
├── clients/
│   └── websocketClient.js        # Frontend client library
└── README.md                     # This documentation

src/integrations/
├── repositoryEventEmitter.js     # Repository integration
└── cacheEventSync.js             # Cache synchronization
```

## Performance Benchmarks

### Expected Performance
- **Connections**: 10,000+ concurrent connections per server
- **Throughput**: 50,000+ events per second
- **Latency**: <100ms average response time
- **Memory**: <2GB RAM usage under normal load
- **Reconnection**: <5 seconds average reconnection time

### Scaling Recommendations
- Use Redis clustering for >50,000 connections
- Implement horizontal scaling with load balancers
- Enable event aggregation for high-frequency updates
- Use CDN for client library distribution

## Contributing

See the main project contributing guidelines. For WebSocket-specific contributions:

1. Test with multiple concurrent connections
2. Verify performance impact of changes
3. Test offline/online scenarios
4. Include integration tests with repositories
5. Update documentation for API changes

## License

Part of the MLG.clan platform - see main project license.