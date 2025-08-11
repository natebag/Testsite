/**
 * MLG.clan WebSocket Integration Example
 * 
 * Comprehensive example demonstrating how to integrate the real-time WebSocket
 * system with the MLG.clan platform. Shows server setup, repository integration,
 * cache synchronization, and client usage.
 * 
 * @author Claude Code - Integration Example
 * @version 1.0.0
 * @created 2025-08-11
 */

// ================================
// SERVER SETUP EXAMPLE
// ================================

import { createServer } from 'http';
import express from 'express';
import { RealTimeSyncServer } from './realtime-sync.js';
import { RepositoryEventEmitter } from '../integrations/repositoryEventEmitter.js';
import { CacheEventSync } from '../integrations/cacheEventSync.js';
import { getRedisClient } from '../cache/redis-client.js';

// Import repositories
import UserRepository from '../data/repositories/UserRepository.js';
import ClanRepository from '../data/repositories/ClanRepository.js';
import VotingRepository from '../data/repositories/VotingRepository.js';
import ContentRepository from '../data/repositories/ContentRepository.js';

// Import cache manager
import CacheManager from '../cache/cache-manager.js';

/**
 * Complete Server Integration Setup
 */
export class MLGRealtimeIntegration {
  constructor(options = {}) {
    this.options = {
      port: 3000,
      redisUrl: 'redis://localhost:6379',
      enableClustering: true,
      enableMetrics: true,
      ...options
    };
    
    this.app = express();
    this.server = createServer(this.app);
    this.logger = console;
    
    // Core components
    this.realtimeServer = null;
    this.repositoryEmitter = null;
    this.cacheSync = null;
    this.repositories = {};
    this.redisClient = null;
    this.cacheManager = null;
  }

  /**
   * Initialize complete integration
   */
  async initialize() {
    try {
      // 1. Initialize Redis
      await this.initializeRedis();
      
      // 2. Initialize Cache Manager
      await this.initializeCacheManager();
      
      // 3. Initialize WebSocket Server
      await this.initializeWebSocketServer();
      
      // 4. Initialize Repositories
      await this.initializeRepositories();
      
      // 5. Setup Repository Event Integration
      await this.setupRepositoryIntegration();
      
      // 6. Setup Cache Event Synchronization
      await this.setupCacheSync();
      
      // 7. Setup Express Routes (for demo)
      this.setupExpressRoutes();
      
      this.logger.info('MLG Real-time Integration initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize integration:', error);
      throw error;
    }
  }

  /**
   * Initialize Redis connection
   */
  async initializeRedis() {
    this.redisClient = getRedisClient({
      host: 'localhost',
      port: 6379,
      cluster: this.options.enableClustering,
      logger: this.logger
    });
    
    await this.redisClient.connect();
    this.logger.info('Redis connection established');
  }

  /**
   * Initialize Cache Manager
   */
  async initializeCacheManager() {
    this.cacheManager = new CacheManager({
      redisClient: this.redisClient,
      logger: this.logger
    });
    
    this.logger.info('Cache Manager initialized');
  }

  /**
   * Initialize WebSocket Server
   */
  async initializeWebSocketServer() {
    this.realtimeServer = new RealTimeSyncServer(this.server, {
      logger: this.logger,
      redisAdapter: {
        enabled: this.options.enableClustering,
        pubClient: this.redisClient,
        subClient: this.redisClient
      },
      maxConnections: 10000,
      enableMetrics: this.options.enableMetrics
    });
    
    await this.realtimeServer.initialize();
    this.logger.info('WebSocket server initialized');
  }

  /**
   * Initialize repositories
   */
  async initializeRepositories() {
    const repositoryOptions = {
      cacheManager: this.cacheManager,
      logger: this.logger
    };
    
    this.repositories = {
      user: new UserRepository(repositoryOptions),
      clan: new ClanRepository(repositoryOptions),
      voting: new VotingRepository(repositoryOptions),
      content: new ContentRepository(repositoryOptions)
    };
    
    this.logger.info('Repositories initialized');
  }

  /**
   * Setup repository event integration
   */
  async setupRepositoryIntegration() {
    this.repositoryEmitter = new RepositoryEventEmitter({
      realTimeServer: this.realtimeServer,
      logger: this.logger
    });
    
    // Register all repositories
    Object.entries(this.repositories).forEach(([name, repository]) => {
      this.repositoryEmitter.registerRepository(name, repository);
    });
    
    this.logger.info('Repository event integration configured');
  }

  /**
   * Setup cache event synchronization
   */
  async setupCacheSync() {
    this.cacheSync = new CacheEventSync({
      cacheManager: this.cacheManager,
      realTimeServer: this.realtimeServer,
      redisClient: this.redisClient,
      logger: this.logger
    });
    
    this.logger.info('Cache event synchronization configured');
  }

  /**
   * Setup Express routes for demo
   */
  setupExpressRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        websocket: {
          connections: this.realtimeServer.getStats().connections,
          rooms: this.realtimeServer.getStats().rooms
        },
        cache: this.cacheManager.getStats(),
        timestamp: new Date().toISOString()
      });
    });
    
    // WebSocket metrics
    this.app.get('/metrics/websocket', (req, res) => {
      res.json(this.realtimeServer.getStats());
    });
    
    // Demo API endpoints
    this.app.post('/api/demo/user/update', async (req, res) => {
      try {
        const { userId, profileData } = req.body;
        
        // This will automatically trigger WebSocket events
        const result = await this.repositories.user.updateProfile(userId, profileData);
        
        res.json({ success: true, result });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    this.app.post('/api/demo/clan/member/add', async (req, res) => {
      try {
        const { clanId, userId, memberData } = req.body;
        
        // This will automatically trigger WebSocket events
        const result = await this.repositories.clan.addMember(clanId, userId, memberData);
        
        res.json({ success: true, result });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    this.app.post('/api/demo/vote/cast', async (req, res) => {
      try {
        const { voteData } = req.body;
        
        // This will automatically trigger WebSocket events
        const result = await this.repositories.voting.castVote(voteData);
        
        res.json({ success: true, result });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  /**
   * Start the server
   */
  async start() {
    this.server.listen(this.options.port, () => {
      this.logger.info(`MLG Real-time server running on port ${this.options.port}`);
      this.logger.info(`WebSocket endpoint: ws://localhost:${this.options.port}`);
      this.logger.info(`Health check: http://localhost:${this.options.port}/health`);
    });
  }

  /**
   * Stop the server
   */
  async stop() {
    if (this.realtimeServer) {
      await this.realtimeServer.shutdown();
    }
    
    if (this.repositoryEmitter) {
      await this.repositoryEmitter.shutdown();
    }
    
    if (this.cacheSync) {
      await this.cacheSync.shutdown();
    }
    
    if (this.redisClient) {
      await this.redisClient.disconnect();
    }
    
    this.server.close();
    this.logger.info('MLG Real-time server stopped');
  }
}

// ================================
// CLIENT INTEGRATION EXAMPLE
// ================================

import { createWebSocketClient } from './clients/websocketClient.js';

/**
 * Complete Client Integration Example
 */
export class MLGRealtimeClient {
  constructor(options = {}) {
    this.options = {
      url: 'ws://localhost:3000',
      autoConnect: true,
      debug: true,
      ...options
    };
    
    this.client = null;
    this.isAuthenticated = false;
    this.userId = null;
    this.clanId = null;
    
    // Event handlers
    this.eventHandlers = new Map();
    
    this.initialize();
  }

  /**
   * Initialize client
   */
  initialize() {
    // Create WebSocket client
    this.client = createWebSocketClient(this.options.url, {
      autoConnect: this.options.autoConnect,
      debug: this.options.debug,
      auth: {
        autoAuthenticate: true,
        tokenRefreshThreshold: 300000 // 5 minutes
      }
    });
    
    // Setup basic event handlers
    this.setupBasicHandlers();
    
    // Setup gaming event handlers
    this.setupGamingHandlers();
  }

  /**
   * Setup basic connection and authentication handlers
   */
  setupBasicHandlers() {
    // Connection events
    this.client.addEventListener('connect', () => {
      console.log('🎮 Connected to MLG.clan real-time server');
      this.onConnected();
    });
    
    this.client.addEventListener('disconnect', (data) => {
      console.log('❌ Disconnected from server:', data.reason);
      this.onDisconnected(data);
    });
    
    this.client.addEventListener('reconnect', (data) => {
      console.log('🔄 Reconnected after', data.attemptNumber, 'attempts');
      this.onReconnected(data);
    });
    
    // Authentication events
    this.client.addEventListener('authenticated', (data) => {
      console.log('✅ Authenticated successfully');
      this.isAuthenticated = true;
      this.userId = data.userId;
      this.onAuthenticated(data);
    });
    
    this.client.addEventListener('authentication_failed', (data) => {
      console.error('🚫 Authentication failed:', data.error);
      this.onAuthenticationFailed(data);
    });
    
    // System events
    this.client.addEventListener('system:alert', (data) => {
      this.showSystemAlert(data);
    });
    
    this.client.addEventListener('system:maintenance', (data) => {
      this.showMaintenanceNotice(data);
    });
  }

  /**
   * Setup gaming-specific event handlers
   */
  setupGamingHandlers() {
    // User events
    this.client.on('user:achievement_unlocked', (data) => {
      this.showAchievementNotification(data);
    });
    
    this.client.on('user:balance_updated', (data) => {
      this.updateBalanceDisplay(data);
    });
    
    this.client.on('user:reputation_changed', (data) => {
      this.updateReputationDisplay(data);
    });
    
    // Clan events
    this.client.on('clan:member_joined', (data) => {
      this.showClanNotification(`${data.username} joined the clan!`);
      this.updateClanMemberList();
    });
    
    this.client.on('clan:leaderboard_updated', (data) => {
      this.updateClanLeaderboard(data.leaderboard);
    });
    
    this.client.on('clan:proposal_created', (data) => {
      this.showGovernanceNotification(data);
    });
    
    // Voting events
    this.client.on('vote:count_updated', (data) => {
      this.updateVoteDisplay(data);
    });
    
    this.client.on('vote:mlg_burned', (data) => {
      this.showBurnConfirmation(data);
    });
    
    this.client.on('vote:daily_limit_warning', (data) => {
      this.showDailyLimitWarning(data);
    });
    
    // Content events
    this.client.on('content:approved', (data) => {
      this.showContentApproval(data);
    });
    
    this.client.on('content:trending_updated', (data) => {
      this.updateTrendingContent(data);
    });
    
    this.client.on('content:engagement', (data) => {
      this.updateEngagementStats(data);
    });
  }

  /**
   * Authenticate with server
   */
  async authenticate(authToken, walletSignature = null, message = null) {
    if (walletSignature && message) {
      this.client.authenticate(authToken, walletSignature, message);
    } else {
      this.client.authenticate(authToken);
    }
  }

  /**
   * Subscribe to user-specific events
   */
  subscribeToUserEvents(userId) {
    this.userId = userId;
    this.client.subscribe('user', userId, {
      achievements: true,
      reputation: true,
      balance: true,
      notifications: true
    });
  }

  /**
   * Subscribe to clan events
   */
  subscribeToClanEvents(clanId) {
    this.clanId = clanId;
    this.client.subscribe('clan', clanId, {
      memberUpdates: true,
      leaderboard: true,
      governance: true,
      achievements: true
    });
  }

  /**
   * Subscribe to content events
   */
  subscribeToContentEvents(contentIds = [], categories = []) {
    this.client.subscribe('content', null, {
      contentIds,
      categories,
      trending: true,
      moderation: true
    });
  }

  /**
   * Subscribe to voting events
   */
  subscribeToVotingEvents(contentIds = []) {
    this.client.subscribe('voting', null, {
      contentIds,
      liveUpdates: true,
      burnNotifications: true
    });
  }

  /**
   * Event handler implementations
   */
  onConnected() {
    // Update UI to show connected state
    document.querySelector('.connection-status')?.classList.add('connected');
  }

  onDisconnected(data) {
    // Update UI to show disconnected state
    document.querySelector('.connection-status')?.classList.remove('connected');
  }

  onReconnected(data) {
    // Re-subscribe to events after reconnection
    if (this.userId) {
      this.subscribeToUserEvents(this.userId);
    }
    if (this.clanId) {
      this.subscribeToClanEvents(this.clanId);
    }
  }

  onAuthenticated(data) {
    this.userId = data.userId;
    this.walletAddress = data.walletAddress;
    
    // Auto-subscribe to user events
    this.subscribeToUserEvents(this.userId);
    
    // Subscribe to clan events if user has a clan
    if (data.clanId) {
      this.subscribeToClanEvents(data.clanId);
    }
  }

  onAuthenticationFailed(data) {
    // Redirect to login or show auth modal
    console.error('Authentication failed, redirecting to login');
  }

  /**
   * UI Update Methods
   */
  showAchievementNotification(data) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
      <div class="achievement-icon">🏆</div>
      <div class="achievement-text">
        <h3>Achievement Unlocked!</h3>
        <p>${data.achievementName}</p>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => notification.remove(), 5000);
  }

  updateBalanceDisplay(data) {
    const balanceElement = document.querySelector('.mlg-balance');
    if (balanceElement) {
      balanceElement.textContent = `${data.newBalance} MLG`;
      balanceElement.classList.add('updated');
      setTimeout(() => balanceElement.classList.remove('updated'), 2000);
    }
  }

  updateVoteDisplay(data) {
    const voteElement = document.querySelector(`[data-content-id="${data.contentId}"] .vote-count`);
    if (voteElement) {
      voteElement.textContent = data.newCount;
      voteElement.classList.add('updated');
      setTimeout(() => voteElement.classList.remove('updated'), 1000);
    }
  }

  showSystemAlert(data) {
    alert(`System Alert: ${data.message}`);
  }

  showMaintenanceNotice(data) {
    const notice = document.createElement('div');
    notice.className = 'maintenance-notice';
    notice.innerHTML = `
      <h3>🔧 Maintenance Notice</h3>
      <p>${data.message}</p>
      <p>Start: ${new Date(data.startTime).toLocaleString()}</p>
    `;
    
    document.body.appendChild(notice);
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.client.isConnected,
      isAuthenticated: this.isAuthenticated,
      userId: this.userId,
      clanId: this.clanId,
      metrics: this.client.getMetrics()
    };
  }

  /**
   * Disconnect client
   */
  disconnect() {
    this.client.disconnect();
  }
}

// ================================
// USAGE EXAMPLE
// ================================

/**
 * Complete usage example
 */
async function runCompleteExample() {
  // 1. Initialize and start server
  console.log('🚀 Starting MLG Real-time Integration...');
  
  const integration = new MLGRealtimeIntegration({
    port: 3000,
    enableClustering: true,
    enableMetrics: true
  });
  
  await integration.initialize();
  await integration.start();
  
  // 2. Initialize client (in browser/frontend)
  console.log('🎮 Initializing client...');
  
  const client = new MLGRealtimeClient({
    url: 'ws://localhost:3000',
    autoConnect: true,
    debug: true
  });
  
  // 3. Simulate authentication
  setTimeout(async () => {
    console.log('🔐 Authenticating...');
    
    // In real app, get token from your auth system
    const mockAuthToken = 'mock_jwt_token_here';
    await client.authenticate(mockAuthToken);
  }, 1000);
  
  // 4. Simulate some events
  setTimeout(async () => {
    console.log('🎯 Simulating events...');
    
    // Simulate user profile update
    await fetch('http://localhost:3000/api/demo/user/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user123',
        profileData: { username: 'GamerPro', level: 15 }
      })
    });
    
    // Simulate clan member addition
    await fetch('http://localhost:3000/api/demo/clan/member/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clanId: 'clan456',
        userId: 'user789',
        memberData: { role: 'member', joinedAt: new Date() }
      })
    });
    
    // Simulate vote casting
    await fetch('http://localhost:3000/api/demo/vote/cast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voteData: {
          userId: 'user123',
          contentId: 'content789',
          voteType: 'upvote',
          mlgTokensUsed: 10
        }
      })
    });
  }, 3000);
  
  // 5. Cleanup after demo
  setTimeout(async () => {
    console.log('🛑 Stopping demo...');
    
    client.disconnect();
    await integration.stop();
    
    process.exit(0);
  }, 10000);
}

// Run example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCompleteExample().catch(console.error);
}

export { MLGRealtimeIntegration, MLGRealtimeClient };