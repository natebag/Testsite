/**
 * System Events Handler for WebSocket Server
 * 
 * Handles system-level events for the MLG.clan platform including connection management,
 * health monitoring, authentication events, and server status updates.
 * 
 * Features:
 * - Connection lifecycle events
 * - Authentication and security events
 * - Health monitoring and diagnostics
 * - System alerts and notifications
 * - Server status and maintenance events
 * 
 * @author Claude Code - System Events Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { EventEmitter } from 'events';

/**
 * System Events Handler
 */
export class SystemEventHandler extends EventEmitter {
  constructor(io, options = {}) {
    super();
    
    this.io = io;
    this.connectionManager = options.connectionManager;
    this.logger = options.logger || console;
    
    // System event types
    this.eventTypes = {
      CONNECTION: 'system:connection',
      DISCONNECTION: 'system:disconnection',
      AUTHENTICATION: 'system:authentication',
      AUTH_FAILED: 'system:auth_failed',
      HEARTBEAT: 'system:heartbeat',
      SERVER_STATUS: 'system:server_status',
      MAINTENANCE: 'system:maintenance',
      ALERT: 'system:alert',
      ERROR: 'system:error',
      RATE_LIMITED: 'system:rate_limited'
    };
    
    // Event statistics
    this.stats = {
      connections: 0,
      disconnections: 0,
      authentications: 0,
      authFailures: 0,
      heartbeats: 0,
      alerts: 0,
      errors: 0
    };
    
    this.logger.info('System Events Handler initialized');
  }

  /**
   * Handle new connection
   */
  handleConnection(socket) {
    try {
      const connectionData = {
        socketId: socket.id,
        userId: socket.userId,
        walletAddress: socket.walletAddress,
        ipAddress: this.getClientIP(socket),
        userAgent: socket.handshake.headers['user-agent'],
        timestamp: new Date().toISOString(),
        network: socket.network
      };
      
      // Update statistics
      this.stats.connections++;
      
      // Emit connection event to user
      socket.emit(this.eventTypes.CONNECTION, {
        message: 'Connected to MLG.clan real-time server',
        ...connectionData,
        serverInfo: {
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          serverId: process.env.SERVER_ID || 'default'
        }
      });
      
      // Broadcast to admin channels if configured
      if (socket.roles && socket.roles.includes('admin')) {
        socket.join('admin:system_events');
      }
      
      // Log connection
      this.logger.info(`System event - Connection: ${socket.id}`, connectionData);
      
      // Emit internal event
      this.emit('connection', connectionData);
      
    } catch (error) {
      this.logger.error(`Error handling connection event for ${socket.id}:`, error);
    }
  }

  /**
   * Handle disconnection
   */
  handleDisconnection(socket, reason) {
    try {
      const disconnectionData = {
        socketId: socket.id,
        userId: socket.userId,
        reason,
        timestamp: new Date().toISOString(),
        sessionDuration: socket.authenticatedAt 
          ? Date.now() - socket.authenticatedAt.getTime()
          : null
      };
      
      // Update statistics
      this.stats.disconnections++;
      
      // Log disconnection
      this.logger.info(`System event - Disconnection: ${socket.id}`, disconnectionData);
      
      // Emit internal event
      this.emit('disconnection', disconnectionData);
      
    } catch (error) {
      this.logger.error(`Error handling disconnection event for ${socket.id}:`, error);
    }
  }

  /**
   * Handle authentication success
   */
  handleAuthentication(socket, authData) {
    try {
      const eventData = {
        socketId: socket.id,
        userId: socket.userId,
        walletAddress: socket.walletAddress,
        roles: socket.roles,
        permissions: socket.permissions,
        timestamp: new Date().toISOString(),
        network: socket.network
      };
      
      // Update statistics
      this.stats.authentications++;
      
      // Emit authentication success to user
      socket.emit(this.eventTypes.AUTHENTICATION, {
        message: 'Authentication successful',
        ...eventData
      });
      
      // Log authentication
      this.logger.info(`System event - Authentication success: ${socket.id}`, eventData);
      
      // Emit internal event
      this.emit('authentication', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling authentication event for ${socket.id}:`, error);
    }
  }

  /**
   * Handle authentication failure
   */
  handleAuthenticationFailure(socket, error) {
    try {
      const eventData = {
        socketId: socket.id,
        error: error.message,
        timestamp: new Date().toISOString(),
        ipAddress: this.getClientIP(socket)
      };
      
      // Update statistics
      this.stats.authFailures++;
      
      // Emit authentication failure to user
      socket.emit(this.eventTypes.AUTH_FAILED, {
        message: 'Authentication failed',
        error: error.message,
        timestamp: eventData.timestamp
      });
      
      // Log authentication failure
      this.logger.warn(`System event - Authentication failure: ${socket.id}`, eventData);
      
      // Emit internal event for security monitoring
      this.emit('auth_failed', eventData);
      
    } catch (err) {
      this.logger.error(`Error handling authentication failure for ${socket.id}:`, err);
    }
  }

  /**
   * Handle heartbeat
   */
  handleHeartbeat(socket, callback) {
    try {
      const heartbeatData = {
        socketId: socket.id,
        userId: socket.userId,
        timestamp: new Date().toISOString(),
        serverTime: Date.now(),
        isHealthy: true
      };
      
      // Update statistics
      this.stats.heartbeats++;
      
      // Update connection activity if connection manager available
      if (this.connectionManager) {
        const connection = this.connectionManager.getConnection(socket.id);
        if (connection) {
          connection.lastActivity = new Date();
        }
      }
      
      // Send heartbeat response
      if (callback) {
        callback({
          ...heartbeatData,
          message: 'Heartbeat acknowledged',
          serverStatus: 'healthy'
        });
      }
      
      // Log debug heartbeat
      this.logger.debug(`System event - Heartbeat: ${socket.id}`);
      
      // Emit internal event
      this.emit('heartbeat', heartbeatData);
      
    } catch (error) {
      this.logger.error(`Error handling heartbeat for ${socket.id}:`, error);
      
      if (callback) {
        callback({
          error: 'Heartbeat processing failed',
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Broadcast server status update
   */
  broadcastServerStatus(status) {
    try {
      const statusData = {
        status: status.status || 'unknown',
        timestamp: new Date().toISOString(),
        serverId: process.env.SERVER_ID || 'default',
        connections: this.io.engine.clientsCount,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        ...status
      };
      
      // Broadcast to all connected clients
      this.io.emit(this.eventTypes.SERVER_STATUS, statusData);
      
      // Log status update
      this.logger.info('System event - Server status broadcast:', statusData);
      
      // Emit internal event
      this.emit('server_status', statusData);
      
    } catch (error) {
      this.logger.error('Error broadcasting server status:', error);
    }
  }

  /**
   * Broadcast maintenance notification
   */
  broadcastMaintenance(maintenanceInfo) {
    try {
      const maintenanceData = {
        type: maintenanceInfo.type || 'scheduled',
        message: maintenanceInfo.message,
        startTime: maintenanceInfo.startTime,
        estimatedDuration: maintenanceInfo.estimatedDuration,
        affectedServices: maintenanceInfo.affectedServices || [],
        timestamp: new Date().toISOString(),
        priority: maintenanceInfo.priority || 'medium'
      };
      
      // Broadcast to all connected clients
      this.io.emit(this.eventTypes.MAINTENANCE, maintenanceData);
      
      // Log maintenance notification
      this.logger.info('System event - Maintenance notification:', maintenanceData);
      
      // Emit internal event
      this.emit('maintenance', maintenanceData);
      
    } catch (error) {
      this.logger.error('Error broadcasting maintenance notification:', error);
    }
  }

  /**
   * Broadcast system alert
   */
  broadcastAlert(alertInfo) {
    try {
      const alertData = {
        id: alertInfo.id || this.generateAlertId(),
        type: alertInfo.type || 'info',
        severity: alertInfo.severity || 'medium',
        title: alertInfo.title,
        message: alertInfo.message,
        timestamp: new Date().toISOString(),
        expiresAt: alertInfo.expiresAt,
        actions: alertInfo.actions || [],
        targetRoles: alertInfo.targetRoles || ['all']
      };
      
      // Update statistics
      this.stats.alerts++;
      
      // Broadcast based on target roles
      if (alertData.targetRoles.includes('all')) {
        this.io.emit(this.eventTypes.ALERT, alertData);
      } else {
        alertData.targetRoles.forEach(role => {
          this.io.to(`role:${role}`).emit(this.eventTypes.ALERT, alertData);
        });
      }
      
      // Log alert
      this.logger.info('System event - Alert broadcast:', alertData);
      
      // Emit internal event
      this.emit('alert', alertData);
      
    } catch (error) {
      this.logger.error('Error broadcasting system alert:', error);
    }
  }

  /**
   * Handle system error
   */
  handleSystemError(errorInfo) {
    try {
      const errorData = {
        id: this.generateErrorId(),
        type: errorInfo.type || 'system_error',
        message: errorInfo.message,
        stack: errorInfo.stack,
        timestamp: new Date().toISOString(),
        severity: errorInfo.severity || 'error',
        component: errorInfo.component || 'websocket',
        userId: errorInfo.userId,
        socketId: errorInfo.socketId
      };
      
      // Update statistics
      this.stats.errors++;
      
      // Send error to affected user if applicable
      if (errorData.socketId) {
        this.io.to(errorData.socketId).emit(this.eventTypes.ERROR, {
          message: 'A system error occurred',
          errorId: errorData.id,
          timestamp: errorData.timestamp
        });
      }
      
      // Send to admin channels for monitoring
      this.io.to('admin:system_events').emit(this.eventTypes.ERROR, errorData);
      
      // Log error
      this.logger.error('System event - Error:', errorData);
      
      // Emit internal event
      this.emit('error', errorData);
      
    } catch (error) {
      this.logger.error('Error handling system error:', error);
    }
  }

  /**
   * Handle rate limiting event
   */
  handleRateLimit(socket, limitInfo) {
    try {
      const rateLimitData = {
        socketId: socket.id,
        userId: socket.userId,
        limitType: limitInfo.type || 'general',
        retryAfter: limitInfo.retryAfter,
        totalHits: limitInfo.totalHits,
        remainingPoints: limitInfo.remainingPoints,
        timestamp: new Date().toISOString()
      };
      
      // Emit rate limit notification to user
      socket.emit(this.eventTypes.RATE_LIMITED, {
        message: 'Rate limit exceeded',
        ...rateLimitData
      });
      
      // Log rate limit event
      this.logger.warn('System event - Rate limit:', rateLimitData);
      
      // Emit internal event
      this.emit('rate_limited', rateLimitData);
      
    } catch (error) {
      this.logger.error(`Error handling rate limit event for ${socket.id}:`, error);
    }
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
   * Generate unique alert ID
   */
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique error ID
   */
  generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get system event statistics
   */
  getStats() {
    return {
      ...this.stats,
      connectedClients: this.io.engine.clientsCount,
      serverUptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      eventTypes: Object.values(this.eventTypes)
    };
  }

  /**
   * Reset event statistics
   */
  resetStats() {
    this.stats = {
      connections: 0,
      disconnections: 0,
      authentications: 0,
      authFailures: 0,
      heartbeats: 0,
      alerts: 0,
      errors: 0
    };
    
    this.logger.info('System event statistics reset');
  }
}

export default SystemEventHandler;