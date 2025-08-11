/**
 * Real-Time Data Synchronization Server for MLG.clan Platform
 * 
 * Enterprise-grade WebSocket server providing real-time updates for gaming platform
 * activities including voting, clan management, content moderation, and user interactions.
 * 
 * Features:
 * - Socket.IO integration with Redis adapter for clustering
 * - Wallet-based authentication with JWT tokens
 * - Room-based event broadcasting with permission filtering
 * - Comprehensive event system for all gaming features
 * - Rate limiting and spam prevention
 * - Connection monitoring and health checks
 * - Performance metrics and analytics
 * 
 * @author Claude Code - WebSocket Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { EventEmitter } from 'events';
import jwt from 'jsonwebtoken';
import { getRedisClient } from '../cache/redis-client.js';

// Import event handlers and middleware
import { SystemEventHandler } from './events/systemEvents.js';
import { UserEventHandler } from './events/userEvents.js';
import { ClanEventHandler } from './events/clanEvents.js';
import { VotingEventHandler } from './events/votingEvents.js';
import { ContentEventHandler } from './events/contentEvents.js';

import { authMiddleware } from './middleware/auth.middleware.js';
import { rateLimiterMiddleware } from './middleware/rateLimiter.middleware.js';
import { eventFilterMiddleware } from './middleware/eventFilter.middleware.js';

import { ConnectionManager } from './managers/connectionManager.js';
import { RoomManager } from './managers/roomManager.js';
import { EventAggregator } from './managers/eventAggregator.js';

import { WebSocketMetrics } from './monitoring/websocketMetrics.js';
import { PerformanceMonitor } from './monitoring/performanceMonitor.js';

/**
 * Real-Time Sync Server Configuration
 */
const REALTIME_CONFIG = {
  // Connection settings
  maxConnections: parseInt(process.env.WS_MAX_CONNECTIONS) || 10000,
  connectionTimeout: parseInt(process.env.WS_CONNECTION_TIMEOUT) || 30000,
  heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL) || 25000,
  heartbeatTimeout: parseInt(process.env.WS_HEARTBEAT_TIMEOUT) || 5000,
  
  // Rate limiting
  globalRateLimit: {
    points: 100, // Number of events
    duration: 60, // Per 60 seconds
    blockDuration: 300 // Block for 5 minutes
  },
  
  userRateLimit: {
    points: 50, // Number of events per user
    duration: 60, // Per 60 seconds
    blockDuration: 60 // Block for 1 minute
  },
  
  // Event aggregation
  aggregationWindow: 1000, // 1 second window for batching events
  maxEventsPerBatch: 50,
  
  // Redis adapter settings
  redisAdapter: {
    enabled: process.env.WS_REDIS_ADAPTER_ENABLED === 'true',
    pubClient: null,
    subClient: null
  },
  
  // CORS settings
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  
  // Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'mlg-clan-secret-key',
    jwtExpiration: '24h'
  }
};

/**
 * Real-Time Synchronization Server
 */
export class RealTimeSyncServer extends EventEmitter {
  constructor(server, options = {}) {
    super();
    
    this.config = { ...REALTIME_CONFIG, ...options };
    this.server = server;
    this.io = null;
    
    // Core managers
    this.connectionManager = null;
    this.roomManager = null;
    this.eventAggregator = null;
    
    // Event handlers
    this.systemEvents = null;
    this.userEvents = null;
    this.clanEvents = null;
    this.votingEvents = null;
    this.contentEvents = null;
    
    // Monitoring
    this.metrics = null;
    this.performanceMonitor = null;
    
    // Redis clients for clustering
    this.redisClient = null;
    this.pubClient = null;
    this.subClient = null;
    
    // Connection tracking
    this.activeConnections = new Map();
    this.roomSubscriptions = new Map();
    
    this.logger = options.logger || console;
    this.isInitialized = false;
  }

  /**
   * Initialize the WebSocket server
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize Redis clients
      await this.initializeRedis();
      
      // Create Socket.IO server
      this.createSocketServer();
      
      // Setup Redis adapter for clustering
      await this.setupRedisAdapter();
      
      // Initialize managers
      this.initializeManagers();
      
      // Initialize event handlers
      this.initializeEventHandlers();
      
      // Setup middleware
      this.setupMiddleware();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Initialize monitoring
      this.initializeMonitoring();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      this.isInitialized = true;
      this.logger.info('Real-time sync server initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize real-time sync server:', error);
      throw error;
    }
  }

  /**
   * Initialize Redis clients for clustering
   */
  async initializeRedis() {
    if (!this.config.redisAdapter.enabled) {
      this.logger.info('Redis adapter disabled, running in single-server mode');
      return;
    }

    try {
      this.redisClient = getRedisClient();
      
      // Create separate pub/sub clients for Socket.IO adapter
      this.pubClient = getRedisClient();
      this.subClient = getRedisClient();
      
      await Promise.all([
        this.redisClient.connect(),
        this.pubClient.connect(),
        this.subClient.connect()
      ]);
      
      this.logger.info('Redis clients initialized for WebSocket clustering');
      
    } catch (error) {
      this.logger.error('Failed to initialize Redis clients:', error);
      throw error;
    }
  }

  /**
   * Create Socket.IO server instance
   */
  createSocketServer() {
    this.io = new SocketIOServer(this.server, {
      cors: this.config.cors,
      transports: ['websocket', 'polling'],
      pingTimeout: this.config.heartbeatTimeout,
      pingInterval: this.config.heartbeatInterval,
      maxHttpBufferSize: 1e6, // 1MB
      allowEIO3: true
    });

    this.logger.info('Socket.IO server created');
  }

  /**
   * Setup Redis adapter for horizontal scaling
   */
  async setupRedisAdapter() {
    if (!this.config.redisAdapter.enabled || !this.pubClient || !this.subClient) {
      return;
    }

    try {
      const adapter = createAdapter(this.pubClient, this.subClient);
      this.io.adapter(adapter);
      
      this.logger.info('Redis adapter configured for Socket.IO clustering');
      
    } catch (error) {
      this.logger.error('Failed to setup Redis adapter:', error);
      throw error;
    }
  }

  /**
   * Initialize core managers
   */
  initializeManagers() {
    this.connectionManager = new ConnectionManager({
      maxConnections: this.config.maxConnections,
      connectionTimeout: this.config.connectionTimeout,
      logger: this.logger
    });

    this.roomManager = new RoomManager({
      redisClient: this.redisClient,
      logger: this.logger
    });

    this.eventAggregator = new EventAggregator({
      aggregationWindow: this.config.aggregationWindow,
      maxEventsPerBatch: this.config.maxEventsPerBatch,
      logger: this.logger
    });

    this.logger.info('Core managers initialized');
  }

  /**
   * Initialize event handlers
   */
  initializeEventHandlers() {
    this.systemEvents = new SystemEventHandler(this.io, {
      connectionManager: this.connectionManager,
      logger: this.logger
    });

    this.userEvents = new UserEventHandler(this.io, {
      roomManager: this.roomManager,
      logger: this.logger
    });

    this.clanEvents = new ClanEventHandler(this.io, {
      roomManager: this.roomManager,
      logger: this.logger
    });

    this.votingEvents = new VotingEventHandler(this.io, {
      roomManager: this.roomManager,
      eventAggregator: this.eventAggregator,
      logger: this.logger
    });

    this.contentEvents = new ContentEventHandler(this.io, {
      roomManager: this.roomManager,
      logger: this.logger
    });

    this.logger.info('Event handlers initialized');
  }

  /**
   * Setup middleware for authentication, rate limiting, and filtering
   */
  setupMiddleware() {
    // Authentication middleware
    this.io.use(authMiddleware({
      jwtSecret: this.config.auth.jwtSecret,
      logger: this.logger
    }));

    // Rate limiting middleware
    this.io.use(rateLimiterMiddleware({
      globalRateLimit: this.config.globalRateLimit,
      userRateLimit: this.config.userRateLimit,
      redisClient: this.redisClient,
      logger: this.logger
    }));

    // Event filtering middleware
    this.io.use(eventFilterMiddleware({
      logger: this.logger
    }));

    this.logger.info('WebSocket middleware configured');
  }

  /**
   * Setup main Socket.IO event listeners
   */
  setupEventListeners() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    this.logger.info('Socket.IO event listeners configured');
  }

  /**
   * Handle new socket connection
   */
  async handleConnection(socket) {
    try {
      // Register connection with manager
      await this.connectionManager.addConnection(socket);
      
      // Setup socket event handlers
      this.setupSocketEvents(socket);
      
      // Emit system connection event
      this.systemEvents.handleConnection(socket);
      
      this.logger.info(`Socket connected: ${socket.id} - User: ${socket.userId}`);
      
    } catch (error) {
      this.logger.error(`Failed to handle connection ${socket.id}:`, error);
      socket.disconnect(true);
    }
  }

  /**
   * Setup event handlers for individual socket
   */
  setupSocketEvents(socket) {
    // Heartbeat for connection health
    socket.on('heartbeat', (callback) => {
      this.systemEvents.handleHeartbeat(socket, callback);
    });

    // Room management
    socket.on('join_room', (data) => {
      this.roomManager.joinRoom(socket, data);
    });

    socket.on('leave_room', (data) => {
      this.roomManager.leaveRoom(socket, data);
    });

    // User events
    socket.on('user:subscribe_updates', (data) => {
      this.userEvents.subscribeToUpdates(socket, data);
    });

    // Clan events
    socket.on('clan:join', (data) => {
      this.clanEvents.handleClanJoin(socket, data);
    });

    socket.on('clan:subscribe', (data) => {
      this.clanEvents.subscribeToClan(socket, data);
    });

    // Voting events
    socket.on('voting:subscribe', (data) => {
      this.votingEvents.subscribeToVoting(socket, data);
    });

    // Content events
    socket.on('content:subscribe', (data) => {
      this.contentEvents.subscribeToContent(socket, data);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });

    // Error handling
    socket.on('error', (error) => {
      this.logger.error(`Socket ${socket.id} error:`, error);
    });
  }

  /**
   * Handle socket disconnection
   */
  async handleDisconnection(socket, reason) {
    try {
      // Remove from connection manager
      await this.connectionManager.removeConnection(socket);
      
      // Clean up room subscriptions
      await this.roomManager.cleanupSocket(socket);
      
      // Emit system disconnection event
      this.systemEvents.handleDisconnection(socket, reason);
      
      this.logger.info(`Socket disconnected: ${socket.id} - Reason: ${reason}`);
      
    } catch (error) {
      this.logger.error(`Error handling disconnection for ${socket.id}:`, error);
    }
  }

  /**
   * Initialize monitoring systems
   */
  initializeMonitoring() {
    this.metrics = new WebSocketMetrics({
      redisClient: this.redisClient,
      logger: this.logger
    });

    this.performanceMonitor = new PerformanceMonitor({
      io: this.io,
      metrics: this.metrics,
      logger: this.logger
    });

    // Setup metrics collection
    this.setupMetricsCollection();
    
    this.logger.info('WebSocket monitoring initialized');
  }

  /**
   * Setup metrics collection events
   */
  setupMetricsCollection() {
    this.io.engine.on('connection_error', (err) => {
      this.metrics.recordConnectionError(err);
    });

    this.connectionManager.on('connection_added', (socket) => {
      this.metrics.recordConnection(socket);
    });

    this.connectionManager.on('connection_removed', (socket) => {
      this.metrics.recordDisconnection(socket);
    });

    // Track room events
    this.roomManager.on('room_joined', (data) => {
      this.metrics.recordRoomJoin(data);
    });

    this.roomManager.on('room_left', (data) => {
      this.metrics.recordRoomLeave(data);
    });
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Every 30 seconds

    this.logger.info('Health monitoring started');
  }

  /**
   * Perform health check
   */
  async performHealthCheck() {
    try {
      const health = {
        timestamp: new Date(),
        connections: this.io.engine.clientsCount,
        rooms: this.io.sockets.adapter.rooms.size,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      };

      // Check Redis connectivity
      if (this.redisClient) {
        try {
          await this.redisClient.ping();
          health.redis = 'connected';
        } catch (error) {
          health.redis = 'disconnected';
          this.logger.warn('Redis health check failed:', error.message);
        }
      }

      this.emit('health_check', health);
      this.logger.debug('Health check completed:', health);
      
    } catch (error) {
      this.logger.error('Health check failed:', error);
    }
  }

  /**
   * Broadcast event to specific room
   */
  broadcastToRoom(room, event, data) {
    try {
      this.io.to(room).emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
        server_id: process.env.SERVER_ID || 'default'
      });

      this.metrics.recordEventBroadcast(room, event);
      
    } catch (error) {
      this.logger.error(`Failed to broadcast ${event} to room ${room}:`, error);
    }
  }

  /**
   * Broadcast event to specific user
   */
  broadcastToUser(userId, event, data) {
    try {
      this.io.to(`user:${userId}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
        server_id: process.env.SERVER_ID || 'default'
      });

      this.metrics.recordEventBroadcast(`user:${userId}`, event);
      
    } catch (error) {
      this.logger.error(`Failed to broadcast ${event} to user ${userId}:`, error);
    }
  }

  /**
   * Broadcast event globally
   */
  broadcastGlobal(event, data) {
    try {
      this.io.emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
        server_id: process.env.SERVER_ID || 'default'
      });

      this.metrics.recordEventBroadcast('global', event);
      
    } catch (error) {
      this.logger.error(`Failed to broadcast global event ${event}:`, error);
    }
  }

  /**
   * Get server statistics
   */
  getStats() {
    return {
      connections: this.io.engine.clientsCount,
      rooms: this.io.sockets.adapter.rooms.size,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      metrics: this.metrics ? this.metrics.getStats() : null,
      performance: this.performanceMonitor ? this.performanceMonitor.getStats() : null
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      this.logger.info('Shutting down real-time sync server...');
      
      // Close all socket connections
      this.io.close();
      
      // Cleanup managers
      if (this.connectionManager) {
        await this.connectionManager.shutdown();
      }
      
      if (this.roomManager) {
        await this.roomManager.shutdown();
      }
      
      // Close Redis connections
      if (this.redisClient) {
        await this.redisClient.disconnect();
      }
      
      if (this.pubClient) {
        await this.pubClient.disconnect();
      }
      
      if (this.subClient) {
        await this.subClient.disconnect();
      }
      
      this.logger.info('Real-time sync server shutdown completed');
      
    } catch (error) {
      this.logger.error('Error during real-time sync server shutdown:', error);
      throw error;
    }
  }
}

export default RealTimeSyncServer;