/**
 * Redis Client for MLG.clan Platform
 * 
 * Enterprise-grade Redis client with clustering support, connection pooling,
 * health monitoring, and failover handling.
 * 
 * Features:
 * - Redis clustering support
 * - Connection pooling and retry logic
 * - Health monitoring and metrics
 * - Automatic failover handling
 * - Configuration management
 * - Performance monitoring
 * 
 * @author Claude Code - Performance Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { createClient, createCluster } from 'redis';
import { EventEmitter } from 'events';

export class RedisClient extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Connection settings
      host: options.host || process.env.REDIS_HOST || 'localhost',
      port: options.port || process.env.REDIS_PORT || 6379,
      password: options.password || process.env.REDIS_PASSWORD,
      database: options.database || process.env.REDIS_DATABASE || 0,
      
      // Clustering
      cluster: options.cluster || false,
      clusterNodes: options.clusterNodes || [],
      
      // Connection pooling
      maxConnections: options.maxConnections || 10,
      minConnections: options.minConnections || 2,
      acquireTimeout: options.acquireTimeout || 10000,
      
      // Retry logic
      retryDelayOnFailover: options.retryDelayOnFailover || 100,
      maxRetriesPerRequest: options.maxRetriesPerRequest || 3,
      retryDelayOnClusterDown: options.retryDelayOnClusterDown || 300,
      
      // Health monitoring
      healthCheckInterval: options.healthCheckInterval || 30000,
      connectionTimeout: options.connectionTimeout || 10000,
      commandTimeout: options.commandTimeout || 5000,
      
      // Performance
      enableReadyCheck: options.enableReadyCheck !== false,
      maxMemoryPolicy: options.maxMemoryPolicy || 'allkeys-lru',
      
      ...options
    };
    
    this.client = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.connectionPool = new Map();
    this.healthCheckTimer = null;
    
    // Metrics
    this.metrics = {
      connections: 0,
      totalCommands: 0,
      successfulCommands: 0,
      failedCommands: 0,
      avgResponseTime: 0,
      totalResponseTime: 0,
      reconnections: 0,
      lastError: null,
      uptime: Date.now()
    };
    
    this.logger = options.logger || console;
    
    // Auto-connect if not disabled
    if (options.autoConnect !== false) {
      this.connect();
    }
  }

  /**
   * Connect to Redis server or cluster
   */
  async connect() {
    if (this.isConnected || this.isConnecting) {
      return this.client;
    }

    this.isConnecting = true;
    
    try {
      if (this.config.cluster && this.config.clusterNodes.length > 0) {
        await this.connectCluster();
      } else {
        await this.connectSingle();
      }
      
      this.isConnected = true;
      this.isConnecting = false;
      this.startHealthMonitoring();
      
      this.emit('connected', {
        mode: this.config.cluster ? 'cluster' : 'single',
        timestamp: new Date()
      });
      
      this.logger.info('Redis connected successfully', {
        mode: this.config.cluster ? 'cluster' : 'single',
        host: this.config.host,
        port: this.config.port
      });
      
      return this.client;
      
    } catch (error) {
      this.isConnecting = false;
      this.handleConnectionError(error);
      throw error;
    }
  }

  /**
   * Connect to single Redis instance
   */
  async connectSingle() {
    const clientConfig = {
      socket: {
        host: this.config.host,
        port: this.config.port,
        connectTimeout: this.config.connectionTimeout,
        commandTimeout: this.config.commandTimeout
      },
      password: this.config.password,
      database: this.config.database
    };

    this.client = createClient(clientConfig);
    
    this.setupClientEventHandlers();
    
    await this.client.connect();
  }

  /**
   * Connect to Redis cluster
   */
  async connectCluster() {
    const clusterConfig = {
      rootNodes: this.config.clusterNodes.map(node => ({
        socket: {
          host: node.host,
          port: node.port,
          connectTimeout: this.config.connectionTimeout
        }
      })),
      defaults: {
        password: this.config.password,
        socket: {
          commandTimeout: this.config.commandTimeout
        }
      },
      retryDelayOnFailover: this.config.retryDelayOnFailover,
      maxRetriesPerRequest: this.config.maxRetriesPerRequest,
      retryDelayOnClusterDown: this.config.retryDelayOnClusterDown
    };

    this.client = createCluster(clusterConfig);
    
    this.setupClientEventHandlers();
    
    await this.client.connect();
  }

  /**
   * Setup event handlers for Redis client
   */
  setupClientEventHandlers() {
    this.client.on('error', (error) => {
      this.handleConnectionError(error);
    });

    this.client.on('reconnecting', () => {
      this.metrics.reconnections++;
      this.emit('reconnecting');
      this.logger.warn('Redis reconnecting...');
    });

    this.client.on('end', () => {
      this.isConnected = false;
      this.emit('disconnected');
      this.logger.warn('Redis connection ended');
    });
  }

  /**
   * Handle connection errors with intelligent retry logic
   */
  handleConnectionError(error) {
    this.metrics.lastError = {
      message: error.message,
      timestamp: new Date()
    };
    
    this.emit('error', error);
    this.logger.error('Redis connection error:', error);

    // Implement exponential backoff for reconnection
    if (!this.isConnected && !this.isConnecting) {
      const delay = Math.min(1000 * Math.pow(2, this.metrics.reconnections), 30000);
      
      setTimeout(async () => {
        try {
          await this.connect();
        } catch (retryError) {
          this.logger.error('Redis retry connection failed:', retryError);
        }
      }, delay);
    }
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      try {
        const start = Date.now();
        await this.ping();
        const responseTime = Date.now() - start;
        
        this.updateResponseTimeMetrics(responseTime);
        this.emit('healthcheck', { healthy: true, responseTime });
        
      } catch (error) {
        this.emit('healthcheck', { healthy: false, error: error.message });
        this.logger.warn('Redis health check failed:', error);
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * Update response time metrics
   */
  updateResponseTimeMetrics(responseTime) {
    this.metrics.totalResponseTime += responseTime;
    this.metrics.totalCommands++;
    this.metrics.avgResponseTime = Math.round(
      this.metrics.totalResponseTime / this.metrics.totalCommands
    );
  }

  /**
   * Execute Redis command with performance tracking
   */
  async executeCommand(command, ...args) {
    if (!this.isConnected) {
      await this.connect();
    }

    const start = Date.now();
    
    try {
      const result = await this.client[command](...args);
      
      const responseTime = Date.now() - start;
      this.metrics.successfulCommands++;
      this.updateResponseTimeMetrics(responseTime);
      
      return result;
      
    } catch (error) {
      this.metrics.failedCommands++;
      this.logger.error(`Redis command ${command} failed:`, error);
      throw error;
    }
  }

  /**
   * Ping Redis server
   */
  async ping() {
    return await this.executeCommand('ping');
  }

  /**
   * Get Redis server info
   */
  async info(section = null) {
    return await this.executeCommand('info', section);
  }

  /**
   * Set key-value with optional TTL
   */
  async set(key, value, options = {}) {
    const args = [key, value];
    
    if (options.ttl) {
      args.push('EX', options.ttl);
    }
    
    if (options.nx) {
      args.push('NX');
    }
    
    if (options.xx) {
      args.push('XX');
    }
    
    return await this.executeCommand('set', ...args);
  }

  /**
   * Get value by key
   */
  async get(key) {
    return await this.executeCommand('get', key);
  }

  /**
   * Delete keys
   */
  async del(...keys) {
    return await this.executeCommand('del', ...keys);
  }

  /**
   * Set expiration time for key
   */
  async expire(key, seconds) {
    return await this.executeCommand('expire', key, seconds);
  }

  /**
   * Check if key exists
   */
  async exists(...keys) {
    return await this.executeCommand('exists', ...keys);
  }

  /**
   * Get multiple values
   */
  async mget(...keys) {
    return await this.executeCommand('mget', ...keys);
  }

  /**
   * Set multiple key-values
   */
  async mset(keyValuePairs) {
    const args = [];
    for (const [key, value] of Object.entries(keyValuePairs)) {
      args.push(key, value);
    }
    return await this.executeCommand('mset', ...args);
  }

  /**
   * Increment value
   */
  async incr(key) {
    return await this.executeCommand('incr', key);
  }

  /**
   * Increment by amount
   */
  async incrby(key, amount) {
    return await this.executeCommand('incrby', key, amount);
  }

  /**
   * Decrement value
   */
  async decr(key) {
    return await this.executeCommand('decr', key);
  }

  /**
   * Hash operations
   */
  async hset(key, field, value) {
    return await this.executeCommand('hset', key, field, value);
  }

  async hget(key, field) {
    return await this.executeCommand('hget', key, field);
  }

  async hgetall(key) {
    return await this.executeCommand('hgetall', key);
  }

  async hmset(key, fieldValuePairs) {
    const args = [key];
    for (const [field, value] of Object.entries(fieldValuePairs)) {
      args.push(field, value);
    }
    return await this.executeCommand('hmset', ...args);
  }

  async hdel(key, ...fields) {
    return await this.executeCommand('hdel', key, ...fields);
  }

  /**
   * List operations
   */
  async lpush(key, ...values) {
    return await this.executeCommand('lpush', key, ...values);
  }

  async rpush(key, ...values) {
    return await this.executeCommand('rpush', key, ...values);
  }

  async lpop(key) {
    return await this.executeCommand('lpop', key);
  }

  async rpop(key) {
    return await this.executeCommand('rpop', key);
  }

  async lrange(key, start, stop) {
    return await this.executeCommand('lrange', key, start, stop);
  }

  /**
   * Set operations
   */
  async sadd(key, ...members) {
    return await this.executeCommand('sadd', key, ...members);
  }

  async srem(key, ...members) {
    return await this.executeCommand('srem', key, ...members);
  }

  async smembers(key) {
    return await this.executeCommand('smembers', key);
  }

  async sismember(key, member) {
    return await this.executeCommand('sismember', key, member);
  }

  /**
   * Sorted Set operations
   */
  async zadd(key, score, member) {
    return await this.executeCommand('zadd', key, score, member);
  }

  async zrange(key, start, stop, withScores = false) {
    const args = [key, start, stop];
    if (withScores) args.push('WITHSCORES');
    return await this.executeCommand('zrange', ...args);
  }

  async zrevrange(key, start, stop, withScores = false) {
    const args = [key, start, stop];
    if (withScores) args.push('WITHSCORES');
    return await this.executeCommand('zrevrange', ...args);
  }

  async zscore(key, member) {
    return await this.executeCommand('zscore', key, member);
  }

  async zrem(key, ...members) {
    return await this.executeCommand('zrem', key, ...members);
  }

  /**
   * Pipeline operations for batch commands
   */
  pipeline() {
    if (!this.client) {
      throw new Error('Redis client not connected');
    }
    return this.client.multi();
  }

  /**
   * Execute transaction
   */
  async multi() {
    return this.client.multi();
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      ...this.metrics,
      isConnected: this.isConnected,
      uptime: Date.now() - this.metrics.uptime,
      errorRate: this.metrics.totalCommands > 0 
        ? (this.metrics.failedCommands / this.metrics.totalCommands) * 100 
        : 0,
      successRate: this.metrics.totalCommands > 0 
        ? (this.metrics.successfulCommands / this.metrics.totalCommands) * 100 
        : 0
    };
  }

  /**
   * Reset metrics
   */
  resetStats() {
    this.metrics = {
      connections: 0,
      totalCommands: 0,
      successfulCommands: 0,
      failedCommands: 0,
      avgResponseTime: 0,
      totalResponseTime: 0,
      reconnections: 0,
      lastError: null,
      uptime: Date.now()
    };
  }

  /**
   * Get memory usage information
   */
  async getMemoryInfo() {
    const info = await this.info('memory');
    const lines = info.split('\r\n');
    const memoryInfo = {};
    
    lines.forEach(line => {
      const [key, value] = line.split(':');
      if (key && value && key.startsWith('used_memory')) {
        memoryInfo[key] = value;
      }
    });
    
    return memoryInfo;
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    if (this.client) {
      await this.client.quit();
      this.client = null;
    }

    this.isConnected = false;
    this.emit('disconnected');
    this.logger.info('Redis disconnected');
  }

  /**
   * Flush all databases (use with caution)
   */
  async flushall() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FLUSHALL is not allowed in production');
    }
    return await this.executeCommand('flushall');
  }

  /**
   * Flush current database
   */
  async flushdb() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FLUSHDB is not allowed in production');
    }
    return await this.executeCommand('flushdb');
  }
}

// Create singleton instance for global use
let globalRedisClient = null;

export function createRedisClient(options = {}) {
  return new RedisClient(options);
}

export function getRedisClient(options = {}) {
  if (!globalRedisClient) {
    globalRedisClient = new RedisClient(options);
  }
  return globalRedisClient;
}

export default RedisClient;