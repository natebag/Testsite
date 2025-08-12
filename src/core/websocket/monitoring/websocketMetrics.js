/**
 * WebSocket Metrics Collector
 * 
 * Comprehensive metrics collection system for WebSocket server performance monitoring.
 * Tracks connection statistics, event throughput, error rates, and resource usage
 * for the MLG.clan platform real-time infrastructure.
 * 
 * Features:
 * - Connection and session metrics
 * - Event throughput and latency tracking
 * - Error rate and failure analysis
 * - Resource utilization monitoring
 * - Performance trend analysis
 * - Redis-backed metric persistence
 * 
 * @author Claude Code - Performance Monitoring Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { EventEmitter } from 'events';

/**
 * WebSocket Metrics Configuration
 */
const METRICS_CONFIG = {
  // Collection intervals
  collectionInterval: 10000, // 10 seconds
  persistenceInterval: 60000, // 1 minute
  cleanupInterval: 300000, // 5 minutes
  
  // Retention periods
  realTimeRetention: 3600, // 1 hour for real-time metrics
  historicalRetention: 86400 * 30, // 30 days for historical data
  
  // Performance thresholds
  thresholds: {
    connectionLatency: 1000, // 1 second
    eventLatency: 500, // 500ms
    errorRate: 0.05, // 5%
    memoryUsage: 0.8, // 80%
    cpuUsage: 0.8 // 80%
  },
  
  // Redis settings
  redis: {
    keyPrefix: 'ws_metrics',
    enablePersistence: true
  }
};

/**
 * WebSocket Metrics Collector
 */
export class WebSocketMetrics extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = { ...METRICS_CONFIG, ...options };
    this.redisClient = options.redisClient;
    this.logger = options.logger || console;
    
    // Current metrics
    this.metrics = this.initializeMetrics();
    
    // Historical data
    this.historicalData = {
      connections: [],
      events: [],
      errors: [],
      performance: []
    };
    
    // Timers
    this.collectionTimer = null;
    this.persistenceTimer = null;
    this.cleanupTimer = null;
    
    this.startCollection();
    
    this.logger.info('WebSocket Metrics initialized');
  }

  /**
   * Initialize metrics structure
   */
  initializeMetrics() {
    return {
      timestamp: Date.now(),
      
      // Connection metrics
      connections: {
        total: 0,
        active: 0,
        authenticated: 0,
        anonymous: 0,
        healthy: 0,
        unhealthy: 0,
        byRole: {},
        byClan: {},
        byNetwork: {},
        averageSessionDuration: 0
      },
      
      // Event metrics
      events: {
        totalSent: 0,
        totalReceived: 0,
        byType: {},
        byRoom: {},
        averageLatency: 0,
        throughputPerSecond: 0,
        aggregatedEvents: 0,
        batchesSent: 0
      },
      
      // Error metrics
      errors: {
        connectionErrors: 0,
        authenticationErrors: 0,
        rateLimitErrors: 0,
        broadcastErrors: 0,
        systemErrors: 0,
        errorRate: 0,
        byType: {}
      },
      
      // Performance metrics
      performance: {
        cpuUsage: 0,
        memoryUsage: 0,
        memoryHeapUsed: 0,
        memoryHeapTotal: 0,
        memoryExternal: 0,
        uptime: 0,
        eventLoop: {
          lag: 0,
          utilization: 0
        }
      },
      
      // Room metrics
      rooms: {
        total: 0,
        active: 0,
        byType: {},
        averageOccupancy: 0,
        mostPopular: []
      },
      
      // Network metrics
      network: {
        bytesIn: 0,
        bytesOut: 0,
        messagesIn: 0,
        messagesOut: 0,
        bandwidth: {
          incoming: 0,
          outgoing: 0
        }
      }
    };
  }

  /**
   * Start metrics collection
   */
  startCollection() {
    // Collection timer
    this.collectionTimer = setInterval(() => {
      this.collectMetrics();
    }, this.config.collectionInterval);
    
    // Persistence timer
    if (this.redisClient && this.config.redis.enablePersistence) {
      this.persistenceTimer = setInterval(() => {
        this.persistMetrics();
      }, this.config.persistenceInterval);
    }
    
    // Cleanup timer
    this.cleanupTimer = setInterval(() => {
      this.cleanupHistoricalData();
    }, this.config.cleanupInterval);
    
    this.logger.info('Metrics collection started');
  }

  /**
   * Collect current metrics
   */
  collectMetrics() {
    try {
      const timestamp = Date.now();
      
      // Update performance metrics
      this.updatePerformanceMetrics();
      
      // Update timestamp
      this.metrics.timestamp = timestamp;
      
      // Store in historical data
      this.storeHistoricalSnapshot();
      
      // Check thresholds and emit alerts
      this.checkThresholds();
      
      // Emit metrics update
      this.emit('metrics_collected', this.metrics);
      
    } catch (error) {
      this.logger.error('Error collecting metrics:', error);
    }
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.metrics.performance = {
      cpuUsage: this.calculateCpuUsage(cpuUsage),
      memoryUsage: memUsage.heapUsed / memUsage.heapTotal,
      memoryHeapUsed: memUsage.heapUsed,
      memoryHeapTotal: memUsage.heapTotal,
      memoryExternal: memUsage.external,
      uptime: process.uptime(),
      eventLoop: {
        lag: this.measureEventLoopLag(),
        utilization: this.calculateEventLoopUtilization()
      }
    };
  }

  /**
   * Calculate CPU usage
   */
  calculateCpuUsage(cpuUsage) {
    if (!this.lastCpuUsage) {
      this.lastCpuUsage = cpuUsage;
      return 0;
    }
    
    const userDiff = cpuUsage.user - this.lastCpuUsage.user;
    const systemDiff = cpuUsage.system - this.lastCpuUsage.system;
    const totalDiff = userDiff + systemDiff;
    
    this.lastCpuUsage = cpuUsage;
    
    // Convert to percentage (rough approximation)
    return totalDiff / 1000000; // Convert microseconds to percentage
  }

  /**
   * Measure event loop lag
   */
  measureEventLoopLag() {
    const start = process.hrtime();
    
    setImmediate(() => {
      const lag = process.hrtime(start);
      this.eventLoopLag = (lag[0] * 1000) + (lag[1] * 1e-6); // Convert to milliseconds
    });
    
    return this.eventLoopLag || 0;
  }

  /**
   * Calculate event loop utilization
   */
  calculateEventLoopUtilization() {
    // Simplified calculation - in production, use more sophisticated methods
    const lag = this.eventLoopLag || 0;
    return Math.min(lag / 100, 1); // Normalize to 0-1 range
  }

  /**
   * Record connection event
   */
  recordConnection(socket) {
    this.metrics.connections.total++;
    this.metrics.connections.active++;
    
    if (socket.userId) {
      this.metrics.connections.authenticated++;
    } else {
      this.metrics.connections.anonymous++;
    }
    
    // Track by role
    if (socket.roles && socket.roles.length > 0) {
      socket.roles.forEach(role => {
        this.metrics.connections.byRole[role] = (this.metrics.connections.byRole[role] || 0) + 1;
      });
    }
    
    // Track by clan
    if (socket.clanId) {
      this.metrics.connections.byClan[socket.clanId] = (this.metrics.connections.byClan[socket.clanId] || 0) + 1;
    }
    
    // Track by network
    if (socket.network) {
      this.metrics.connections.byNetwork[socket.network] = (this.metrics.connections.byNetwork[socket.network] || 0) + 1;
    }
  }

  /**
   * Record disconnection event
   */
  recordDisconnection(socket) {
    this.metrics.connections.active--;
    
    if (socket.userId) {
      this.metrics.connections.authenticated--;
    } else {
      this.metrics.connections.anonymous--;
    }
    
    // Update session duration
    if (socket.authenticatedAt) {
      const sessionDuration = Date.now() - socket.authenticatedAt.getTime();
      this.updateAverageSessionDuration(sessionDuration);
    }
    
    // Update by role
    if (socket.roles && socket.roles.length > 0) {
      socket.roles.forEach(role => {
        if (this.metrics.connections.byRole[role] > 0) {
          this.metrics.connections.byRole[role]--;
        }
      });
    }
    
    // Update by clan
    if (socket.clanId && this.metrics.connections.byClan[socket.clanId] > 0) {
      this.metrics.connections.byClan[socket.clanId]--;
    }
    
    // Update by network
    if (socket.network && this.metrics.connections.byNetwork[socket.network] > 0) {
      this.metrics.connections.byNetwork[socket.network]--;
    }
  }

  /**
   * Record connection error
   */
  recordConnectionError(error) {
    this.metrics.errors.connectionErrors++;
    this.updateErrorsByType('connection', error);
  }

  /**
   * Record event broadcast
   */
  recordEventBroadcast(room, event) {
    this.metrics.events.totalSent++;
    
    // Track by event type
    this.metrics.events.byType[event] = (this.metrics.events.byType[event] || 0) + 1;
    
    // Track by room
    this.metrics.events.byRoom[room] = (this.metrics.events.byRoom[room] || 0) + 1;
    
    // Update throughput (simplified)
    this.updateThroughput();
  }

  /**
   * Record room join
   */
  recordRoomJoin(data) {
    const { roomId } = data;
    
    if (!this.roomMetrics) {
      this.roomMetrics = {};
    }
    
    if (!this.roomMetrics[roomId]) {
      this.roomMetrics[roomId] = {
        occupancy: 0,
        joins: 0,
        leaves: 0
      };
    }
    
    this.roomMetrics[roomId].occupancy++;
    this.roomMetrics[roomId].joins++;
    
    this.updateRoomStats();
  }

  /**
   * Record room leave
   */
  recordRoomLeave(data) {
    const { roomId } = data;
    
    if (this.roomMetrics && this.roomMetrics[roomId]) {
      this.roomMetrics[roomId].occupancy = Math.max(0, this.roomMetrics[roomId].occupancy - 1);
      this.roomMetrics[roomId].leaves++;
    }
    
    this.updateRoomStats();
  }

  /**
   * Update average session duration
   */
  updateAverageSessionDuration(newDuration) {
    if (!this.sessionDurationTotal) {
      this.sessionDurationTotal = 0;
      this.sessionCount = 0;
    }
    
    this.sessionDurationTotal += newDuration;
    this.sessionCount++;
    
    this.metrics.connections.averageSessionDuration = Math.round(
      this.sessionDurationTotal / this.sessionCount
    );
  }

  /**
   * Update throughput calculation
   */
  updateThroughput() {
    const now = Date.now();
    
    if (!this.throughputWindow) {
      this.throughputWindow = {
        start: now,
        events: 0
      };
    }
    
    this.throughputWindow.events++;
    
    // Calculate throughput every 10 seconds
    if (now - this.throughputWindow.start >= 10000) {
      const duration = (now - this.throughputWindow.start) / 1000; // Convert to seconds
      this.metrics.events.throughputPerSecond = Math.round(this.throughputWindow.events / duration);
      
      // Reset window
      this.throughputWindow = {
        start: now,
        events: 0
      };
    }
  }

  /**
   * Update errors by type
   */
  updateErrorsByType(type, error) {
    if (!this.metrics.errors.byType[type]) {
      this.metrics.errors.byType[type] = 0;
    }
    
    this.metrics.errors.byType[type]++;
    
    // Calculate error rate
    const totalEvents = this.metrics.events.totalSent + this.metrics.events.totalReceived;
    const totalErrors = Object.values(this.metrics.errors.byType).reduce((sum, count) => sum + count, 0);
    
    this.metrics.errors.errorRate = totalEvents > 0 ? totalErrors / totalEvents : 0;
  }

  /**
   * Update room statistics
   */
  updateRoomStats() {
    if (!this.roomMetrics) return;
    
    const rooms = Object.keys(this.roomMetrics);
    this.metrics.rooms.total = rooms.length;
    this.metrics.rooms.active = rooms.filter(roomId => this.roomMetrics[roomId].occupancy > 0).length;
    
    // Calculate average occupancy
    const totalOccupancy = Object.values(this.roomMetrics).reduce((sum, room) => sum + room.occupancy, 0);
    this.metrics.rooms.averageOccupancy = this.metrics.rooms.active > 0 
      ? Math.round(totalOccupancy / this.metrics.rooms.active) 
      : 0;
    
    // Find most popular rooms
    this.metrics.rooms.mostPopular = Object.entries(this.roomMetrics)
      .sort(([, a], [, b]) => b.occupancy - a.occupancy)
      .slice(0, 10)
      .map(([roomId, stats]) => ({
        roomId,
        occupancy: stats.occupancy
      }));
    
    // Update by room type
    this.metrics.rooms.byType = {};
    Object.keys(this.roomMetrics).forEach(roomId => {
      const type = this.getRoomType(roomId);
      this.metrics.rooms.byType[type] = (this.metrics.rooms.byType[type] || 0) + 1;
    });
  }

  /**
   * Get room type from room ID
   */
  getRoomType(roomId) {
    if (roomId.startsWith('user:')) return 'user';
    if (roomId.startsWith('clan:')) return 'clan';
    if (roomId.startsWith('content:')) return 'content';
    if (roomId.startsWith('voting:')) return 'voting';
    if (roomId.startsWith('admin:')) return 'admin';
    return 'other';
  }

  /**
   * Store historical snapshot
   */
  storeHistoricalSnapshot() {
    const snapshot = {
      timestamp: this.metrics.timestamp,
      connections: this.metrics.connections.active,
      events: this.metrics.events.throughputPerSecond,
      errors: this.metrics.errors.errorRate,
      memory: this.metrics.performance.memoryUsage,
      cpu: this.metrics.performance.cpuUsage
    };
    
    // Add to historical data
    this.historicalData.connections.push({
      timestamp: snapshot.timestamp,
      count: snapshot.connections
    });
    
    this.historicalData.events.push({
      timestamp: snapshot.timestamp,
      throughput: snapshot.events
    });
    
    this.historicalData.errors.push({
      timestamp: snapshot.timestamp,
      rate: snapshot.errors
    });
    
    this.historicalData.performance.push({
      timestamp: snapshot.timestamp,
      memory: snapshot.memory,
      cpu: snapshot.cpu
    });
    
    // Keep only recent data in memory
    const cutoff = Date.now() - this.config.realTimeRetention * 1000;
    Object.keys(this.historicalData).forEach(key => {
      this.historicalData[key] = this.historicalData[key].filter(
        item => item.timestamp > cutoff
      );
    });
  }

  /**
   * Check performance thresholds
   */
  checkThresholds() {
    const alerts = [];
    
    // Check memory usage
    if (this.metrics.performance.memoryUsage > this.config.thresholds.memoryUsage) {
      alerts.push({
        type: 'memory_high',
        value: this.metrics.performance.memoryUsage,
        threshold: this.config.thresholds.memoryUsage,
        severity: 'warning'
      });
    }
    
    // Check CPU usage
    if (this.metrics.performance.cpuUsage > this.config.thresholds.cpuUsage) {
      alerts.push({
        type: 'cpu_high',
        value: this.metrics.performance.cpuUsage,
        threshold: this.config.thresholds.cpuUsage,
        severity: 'warning'
      });
    }
    
    // Check error rate
    if (this.metrics.errors.errorRate > this.config.thresholds.errorRate) {
      alerts.push({
        type: 'error_rate_high',
        value: this.metrics.errors.errorRate,
        threshold: this.config.thresholds.errorRate,
        severity: 'critical'
      });
    }
    
    // Check event loop lag
    if (this.metrics.performance.eventLoop.lag > this.config.thresholds.eventLatency) {
      alerts.push({
        type: 'event_loop_lag',
        value: this.metrics.performance.eventLoop.lag,
        threshold: this.config.thresholds.eventLatency,
        severity: 'warning'
      });
    }
    
    // Emit alerts
    alerts.forEach(alert => {
      this.emit('threshold_exceeded', alert);
    });
  }

  /**
   * Persist metrics to Redis
   */
  async persistMetrics() {
    if (!this.redisClient) return;
    
    try {
      const key = `${this.config.redis.keyPrefix}:${Date.now()}`;
      const data = JSON.stringify(this.metrics);
      
      await this.redisClient.set(key, data, { ttl: this.config.historicalRetention });
      
      this.logger.debug('Metrics persisted to Redis');
      
    } catch (error) {
      this.logger.error('Failed to persist metrics to Redis:', error);
    }
  }

  /**
   * Clean up historical data
   */
  cleanupHistoricalData() {
    const cutoff = Date.now() - this.config.realTimeRetention * 1000;
    
    Object.keys(this.historicalData).forEach(key => {
      const initialCount = this.historicalData[key].length;
      this.historicalData[key] = this.historicalData[key].filter(
        item => item.timestamp > cutoff
      );
      
      const removedCount = initialCount - this.historicalData[key].length;
      if (removedCount > 0) {
        this.logger.debug(`Cleaned up ${removedCount} ${key} historical entries`);
      }
    });
  }

  /**
   * Get current metrics
   */
  getStats() {
    return {
      ...this.metrics,
      historical: {
        connections: this.historicalData.connections,
        events: this.historicalData.events,
        errors: this.historicalData.errors,
        performance: this.historicalData.performance
      }
    };
  }

  /**
   * Get metrics summary
   */
  getSummary() {
    return {
      timestamp: this.metrics.timestamp,
      connections: {
        active: this.metrics.connections.active,
        healthy: this.metrics.connections.healthy,
        authenticated: this.metrics.connections.authenticated
      },
      events: {
        throughput: this.metrics.events.throughputPerSecond,
        total: this.metrics.events.totalSent
      },
      errors: {
        rate: this.metrics.errors.errorRate,
        total: Object.values(this.metrics.errors.byType).reduce((sum, count) => sum + count, 0)
      },
      performance: {
        memory: Math.round(this.metrics.performance.memoryUsage * 100),
        cpu: Math.round(this.metrics.performance.cpuUsage * 100),
        uptime: Math.round(this.metrics.performance.uptime)
      },
      rooms: {
        active: this.metrics.rooms.active,
        averageOccupancy: this.metrics.rooms.averageOccupancy
      }
    };
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = this.initializeMetrics();
    this.historicalData = {
      connections: [],
      events: [],
      errors: [],
      performance: []
    };
    
    this.roomMetrics = {};
    this.sessionDurationTotal = 0;
    this.sessionCount = 0;
    
    this.logger.info('Metrics reset');
  }

  /**
   * Shutdown metrics collection
   */
  shutdown() {
    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
    }
    
    if (this.persistenceTimer) {
      clearInterval(this.persistenceTimer);
    }
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.logger.info('WebSocket Metrics shutdown completed');
  }
}

export default WebSocketMetrics;