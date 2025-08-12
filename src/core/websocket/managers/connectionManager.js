/**
 * Connection Manager for WebSocket Server
 * 
 * Manages WebSocket connection lifecycle, health monitoring, and resource allocation
 * for the MLG.clan platform. Provides connection tracking, cleanup, and optimization
 * for thousands of concurrent connections.
 * 
 * Features:
 * - Connection lifecycle management
 * - Health monitoring and heartbeat tracking
 * - Resource allocation and connection limits
 * - Connection pooling and cleanup
 * - Session persistence and recovery
 * - Performance monitoring and metrics
 * 
 * @author Claude Code - Connection Management Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { EventEmitter } from 'events';

/**
 * Connection Manager Configuration
 */
const CONNECTION_CONFIG = {
  maxConnections: 10000,
  connectionTimeout: 30000, // 30 seconds
  heartbeatInterval: 25000, // 25 seconds
  heartbeatTimeout: 5000, // 5 seconds
  cleanupInterval: 60000, // 1 minute
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  reconnectGracePeriod: 5 * 60 * 1000, // 5 minutes
  
  // Connection health thresholds
  healthThresholds: {
    responseTime: 1000, // 1 second
    missedHeartbeats: 3,
    errorRate: 0.1 // 10%
  }
};

/**
 * Connection Manager Class
 */
export class ConnectionManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = { ...CONNECTION_CONFIG, ...options };
    this.logger = options.logger || console;
    
    // Connection tracking
    this.connections = new Map(); // socketId -> connection info
    this.userConnections = new Map(); // userId -> Set of socketIds
    this.connectionsByRoom = new Map(); // roomId -> Set of socketIds
    
    // Health monitoring
    this.healthStats = {
      totalConnections: 0,
      activeConnections: 0,
      healthyConnections: 0,
      unhealthyConnections: 0,
      averageResponseTime: 0,
      totalResponseTime: 0,
      responseTimeCount: 0
    };
    
    // Cleanup timers
    this.cleanupTimer = null;
    this.healthCheckTimer = null;
    
    this.startCleanupTimer();
    this.startHealthMonitoring();
    
    this.logger.info('Connection Manager initialized');
  }

  /**
   * Add a new connection
   */
  async addConnection(socket) {
    try {
      // Check connection limits
      if (this.connections.size >= this.config.maxConnections) {
        throw new Error('Maximum connections reached');
      }
      
      const connectionInfo = {
        id: socket.id,
        userId: socket.userId,
        walletAddress: socket.walletAddress,
        ipAddress: this.getClientIP(socket),
        userAgent: socket.handshake.headers['user-agent'] || 'unknown',
        connectedAt: new Date(),
        lastActivity: new Date(),
        lastHeartbeat: new Date(),
        isHealthy: true,
        heartbeatCount: 0,
        missedHeartbeats: 0,
        responseTime: 0,
        totalRequests: 0,
        errorCount: 0,
        rooms: new Set(),
        metadata: {
          network: socket.network,
          roles: socket.roles || [],
          permissions: socket.permissions || [],
          clanId: socket.clanId
        }
      };
      
      // Store connection info
      this.connections.set(socket.id, connectionInfo);
      
      // Track user connections
      if (socket.userId) {
        if (!this.userConnections.has(socket.userId)) {
          this.userConnections.set(socket.userId, new Set());
        }
        this.userConnections.get(socket.userId).add(socket.id);
      }
      
      // Setup connection event handlers
      this.setupConnectionHandlers(socket, connectionInfo);
      
      // Update statistics
      this.healthStats.totalConnections++;
      this.healthStats.activeConnections++;
      
      // Emit connection event
      this.emit('connection_added', { socket, connectionInfo });
      
      this.logger.info(`Connection added: ${socket.id} - User: ${socket.userId}`);
      
    } catch (error) {
      this.logger.error(`Failed to add connection ${socket.id}:`, error);
      throw error;
    }
  }

  /**
   * Remove a connection
   */
  async removeConnection(socket) {
    try {
      const connectionInfo = this.connections.get(socket.id);
      
      if (!connectionInfo) {
        this.logger.warn(`Connection not found for removal: ${socket.id}`);
        return;
      }
      
      // Remove from user connections
      if (connectionInfo.userId && this.userConnections.has(connectionInfo.userId)) {
        const userConnections = this.userConnections.get(connectionInfo.userId);
        userConnections.delete(socket.id);
        
        if (userConnections.size === 0) {
          this.userConnections.delete(connectionInfo.userId);
        }
      }
      
      // Remove from room connections
      connectionInfo.rooms.forEach(roomId => {
        if (this.connectionsByRoom.has(roomId)) {
          this.connectionsByRoom.get(roomId).delete(socket.id);
          if (this.connectionsByRoom.get(roomId).size === 0) {
            this.connectionsByRoom.delete(roomId);
          }
        }
      });
      
      // Calculate session duration
      const sessionDuration = new Date() - connectionInfo.connectedAt;
      
      // Remove connection info
      this.connections.delete(socket.id);
      
      // Update statistics
      this.healthStats.activeConnections--;
      if (connectionInfo.isHealthy) {
        this.healthStats.healthyConnections--;
      } else {
        this.healthStats.unhealthyConnections--;
      }
      
      // Emit disconnection event
      this.emit('connection_removed', { 
        socket, 
        connectionInfo, 
        sessionDuration 
      });
      
      this.logger.info(`Connection removed: ${socket.id} - Duration: ${sessionDuration}ms`);
      
    } catch (error) {
      this.logger.error(`Failed to remove connection ${socket.id}:`, error);
    }
  }

  /**
   * Setup event handlers for connection
   */
  setupConnectionHandlers(socket, connectionInfo) {
    // Track heartbeat
    socket.on('heartbeat', (callback) => {
      this.handleHeartbeat(socket, connectionInfo, callback);
    });
    
    // Track activity
    const originalEmit = socket.emit.bind(socket);
    const originalOn = socket.on.bind(socket);
    
    socket.emit = (...args) => {
      this.updateActivity(connectionInfo);
      return originalEmit(...args);
    };
    
    socket.on = (event, handler) => {
      const wrappedHandler = (...args) => {
        this.updateActivity(connectionInfo);
        connectionInfo.totalRequests++;
        return handler(...args);
      };
      return originalOn(event, wrappedHandler);
    };
    
    // Handle errors
    socket.on('error', (error) => {
      this.handleConnectionError(socket, connectionInfo, error);
    });
    
    // Setup heartbeat timer
    this.setupHeartbeatTimer(socket, connectionInfo);
  }

  /**
   * Handle heartbeat from client
   */
  handleHeartbeat(socket, connectionInfo, callback) {
    const now = new Date();
    const responseTime = now - connectionInfo.lastActivity;
    
    connectionInfo.lastHeartbeat = now;
    connectionInfo.heartbeatCount++;
    connectionInfo.missedHeartbeats = 0;
    connectionInfo.responseTime = responseTime;
    
    // Update response time statistics
    this.updateResponseTimeStats(responseTime);
    
    // Check connection health
    this.checkConnectionHealth(connectionInfo);
    
    // Send heartbeat response
    if (callback) {
      callback({
        timestamp: now.toISOString(),
        responseTime,
        isHealthy: connectionInfo.isHealthy
      });
    }
    
    this.logger.debug(`Heartbeat received from ${socket.id} - Response time: ${responseTime}ms`);
  }

  /**
   * Setup heartbeat timer for connection
   */
  setupHeartbeatTimer(socket, connectionInfo) {
    const heartbeatTimer = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - connectionInfo.lastHeartbeat;
      
      if (timeSinceLastHeartbeat > this.config.heartbeatInterval + this.config.heartbeatTimeout) {
        connectionInfo.missedHeartbeats++;
        
        if (connectionInfo.missedHeartbeats >= this.config.healthThresholds.missedHeartbeats) {
          this.logger.warn(`Connection ${socket.id} missed too many heartbeats, marking as unhealthy`);
          this.markConnectionUnhealthy(connectionInfo);
          
          // Disconnect unhealthy connection
          socket.disconnect(true);
        }
      }
    }, this.config.heartbeatInterval);
    
    // Store timer reference
    connectionInfo.heartbeatTimer = heartbeatTimer;
    
    // Clean up timer on disconnect
    socket.on('disconnect', () => {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
      }
    });
  }

  /**
   * Handle connection error
   */
  handleConnectionError(socket, connectionInfo, error) {
    connectionInfo.errorCount++;
    connectionInfo.lastError = {
      message: error.message,
      timestamp: new Date()
    };
    
    // Check if error rate is too high
    const errorRate = connectionInfo.errorCount / connectionInfo.totalRequests;
    if (errorRate > this.config.healthThresholds.errorRate) {
      this.markConnectionUnhealthy(connectionInfo);
    }
    
    this.emit('connection_error', { socket, connectionInfo, error });
    this.logger.error(`Connection error for ${socket.id}:`, error);
  }

  /**
   * Update connection activity timestamp
   */
  updateActivity(connectionInfo) {
    connectionInfo.lastActivity = new Date();
  }

  /**
   * Check connection health based on thresholds
   */
  checkConnectionHealth(connectionInfo) {
    const wasHealthy = connectionInfo.isHealthy;
    
    // Check response time
    const responseTimeOk = connectionInfo.responseTime < this.config.healthThresholds.responseTime;
    
    // Check missed heartbeats
    const heartbeatOk = connectionInfo.missedHeartbeats < this.config.healthThresholds.missedHeartbeats;
    
    // Check error rate
    const errorRate = connectionInfo.totalRequests > 0 
      ? connectionInfo.errorCount / connectionInfo.totalRequests 
      : 0;
    const errorRateOk = errorRate < this.config.healthThresholds.errorRate;
    
    connectionInfo.isHealthy = responseTimeOk && heartbeatOk && errorRateOk;
    
    // Update health statistics
    if (wasHealthy && !connectionInfo.isHealthy) {
      this.healthStats.healthyConnections--;
      this.healthStats.unhealthyConnections++;
    } else if (!wasHealthy && connectionInfo.isHealthy) {
      this.healthStats.unhealthyConnections--;
      this.healthStats.healthyConnections++;
    }
  }

  /**
   * Mark connection as unhealthy
   */
  markConnectionUnhealthy(connectionInfo) {
    if (connectionInfo.isHealthy) {
      connectionInfo.isHealthy = false;
      this.healthStats.healthyConnections--;
      this.healthStats.unhealthyConnections++;
    }
  }

  /**
   * Update response time statistics
   */
  updateResponseTimeStats(responseTime) {
    this.healthStats.totalResponseTime += responseTime;
    this.healthStats.responseTimeCount++;
    this.healthStats.averageResponseTime = Math.round(
      this.healthStats.totalResponseTime / this.healthStats.responseTimeCount
    );
  }

  /**
   * Get client IP address
   */
  getClientIP(socket) {
    const forwarded = socket.handshake.headers['x-forwarded-for'];
    const realIp = socket.handshake.headers['x-real-ip'];
    const clientIp = socket.handshake.address;
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIp) {
      return realIp;
    }
    
    return clientIp || 'unknown';
  }

  /**
   * Add connection to room
   */
  addToRoom(socketId, roomId) {
    const connectionInfo = this.connections.get(socketId);
    if (!connectionInfo) {
      return false;
    }
    
    connectionInfo.rooms.add(roomId);
    
    if (!this.connectionsByRoom.has(roomId)) {
      this.connectionsByRoom.set(roomId, new Set());
    }
    this.connectionsByRoom.get(roomId).add(socketId);
    
    return true;
  }

  /**
   * Remove connection from room
   */
  removeFromRoom(socketId, roomId) {
    const connectionInfo = this.connections.get(socketId);
    if (!connectionInfo) {
      return false;
    }
    
    connectionInfo.rooms.delete(roomId);
    
    if (this.connectionsByRoom.has(roomId)) {
      this.connectionsByRoom.get(roomId).delete(socketId);
      if (this.connectionsByRoom.get(roomId).size === 0) {
        this.connectionsByRoom.delete(roomId);
      }
    }
    
    return true;
  }

  /**
   * Get all connections for a user
   */
  getUserConnections(userId) {
    const socketIds = this.userConnections.get(userId);
    if (!socketIds) {
      return [];
    }
    
    return Array.from(socketIds)
      .map(socketId => this.connections.get(socketId))
      .filter(Boolean);
  }

  /**
   * Get all connections in a room
   */
  getRoomConnections(roomId) {
    const socketIds = this.connectionsByRoom.get(roomId);
    if (!socketIds) {
      return [];
    }
    
    return Array.from(socketIds)
      .map(socketId => this.connections.get(socketId))
      .filter(Boolean);
  }

  /**
   * Get connection information
   */
  getConnection(socketId) {
    return this.connections.get(socketId);
  }

  /**
   * Get connection statistics
   */
  getStats() {
    const unhealthyConnections = Array.from(this.connections.values())
      .filter(conn => !conn.isHealthy);
    
    return {
      ...this.healthStats,
      connectionsByUser: this.userConnections.size,
      activeRooms: this.connectionsByRoom.size,
      unhealthyConnections: unhealthyConnections.map(conn => ({
        id: conn.id,
        userId: conn.userId,
        missedHeartbeats: conn.missedHeartbeats,
        responseTime: conn.responseTime,
        errorCount: conn.errorCount
      }))
    };
  }

  /**
   * Start cleanup timer
   */
  startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);
    
    this.logger.info('Connection cleanup timer started');
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Every 30 seconds
    
    this.logger.info('Connection health monitoring started');
  }

  /**
   * Perform connection cleanup
   */
  performCleanup() {
    const now = Date.now();
    const connectionsToRemove = [];
    
    for (const [socketId, connectionInfo] of this.connections) {
      const timeSinceActivity = now - connectionInfo.lastActivity;
      const timeSinceConnection = now - connectionInfo.connectedAt;
      
      // Remove stale connections
      if (timeSinceActivity > this.config.connectionTimeout ||
          timeSinceConnection > this.config.sessionTimeout) {
        connectionsToRemove.push(socketId);
      }
    }
    
    if (connectionsToRemove.length > 0) {
      this.logger.info(`Cleaning up ${connectionsToRemove.length} stale connections`);
      
      connectionsToRemove.forEach(socketId => {
        const connectionInfo = this.connections.get(socketId);
        if (connectionInfo) {
          this.connections.delete(socketId);
          this.emit('connection_cleanup', { socketId, connectionInfo });
        }
      });
    }
  }

  /**
   * Perform health check
   */
  performHealthCheck() {
    const healthyCount = Array.from(this.connections.values())
      .filter(conn => conn.isHealthy).length;
    
    this.healthStats.healthyConnections = healthyCount;
    this.healthStats.unhealthyConnections = this.connections.size - healthyCount;
    
    this.emit('health_check', this.healthStats);
    
    this.logger.debug('Connection health check completed:', {
      total: this.connections.size,
      healthy: healthyCount,
      unhealthy: this.healthStats.unhealthyConnections
    });
  }

  /**
   * Shutdown connection manager
   */
  async shutdown() {
    this.logger.info('Shutting down Connection Manager...');
    
    // Clear timers
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    // Clear all connection timers
    for (const connectionInfo of this.connections.values()) {
      if (connectionInfo.heartbeatTimer) {
        clearInterval(connectionInfo.heartbeatTimer);
      }
    }
    
    // Clear data structures
    this.connections.clear();
    this.userConnections.clear();
    this.connectionsByRoom.clear();
    
    this.logger.info('Connection Manager shutdown completed');
  }
}

export default ConnectionManager;