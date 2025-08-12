/**
 * Enhanced Database Connection Pool Manager for MLG.clan Platform
 * 
 * Advanced connection pool management with load balancing, read/write splitting,
 * adaptive pool sizing, health monitoring, and gaming-specific optimizations.
 * 
 * Features:
 * - Dynamic connection pool sizing based on load
 * - Read/write replica support with automatic failover
 * - Connection health monitoring and recovery
 * - Gaming-optimized connection strategies
 * - Query routing and load balancing
 * - Performance metrics and alerting
 * - Graceful degradation under high load
 * - Connection warming and preloading
 * 
 * @author Claude Code - Database Performance Architect
 * @version 1.0.0
 * @created 2025-08-12
 */

import { Pool } from 'pg';
import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';

export class EnhancedPoolManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Primary database (write operations)
      primary: {
        host: options.primary?.host || process.env.DB_PRIMARY_HOST || 'localhost',
        port: options.primary?.port || process.env.DB_PRIMARY_PORT || 5432,
        database: options.primary?.database || process.env.DB_NAME || 'mlg_clan',
        user: options.primary?.user || process.env.DB_USER || 'postgres',
        password: options.primary?.password || process.env.DB_PASSWORD || 'password',
        
        // Pool settings for primary
        min: options.primary?.min || 5,
        max: options.primary?.max || 20,
        idleTimeoutMillis: options.primary?.idleTimeoutMillis || 30000,
        connectionTimeoutMillis: options.primary?.connectionTimeoutMillis || 10000,
        acquireTimeoutMillis: options.primary?.acquireTimeoutMillis || 60000,
      },
      
      // Read replicas (read operations)
      replicas: options.replicas || [
        {
          host: process.env.DB_REPLICA1_HOST || 'localhost',
          port: process.env.DB_REPLICA1_PORT || 5433,
          database: process.env.DB_NAME || 'mlg_clan',
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'password',
          min: 3,
          max: 15,
          priority: 1 // Higher priority for closer/faster replicas
        }
      ],
      
      // Pool management
      enableReadReplicas: options.enableReadReplicas !== false,
      replicaFailoverTimeout: options.replicaFailoverTimeout || 5000,
      
      // Adaptive sizing
      enableAdaptivePooling: options.enableAdaptivePooling !== false,
      adaptiveCheckInterval: options.adaptiveCheckInterval || 60000, // 1 minute
      targetUtilization: options.targetUtilization || 0.7, // 70%
      
      // Health monitoring
      enableHealthMonitoring: options.enableHealthMonitoring !== false,
      healthCheckInterval: options.healthCheckInterval || 30000, // 30 seconds
      unhealthyThreshold: options.unhealthyThreshold || 3, // 3 consecutive failures
      
      // Gaming-specific optimizations
      enableGamingOptimizations: options.enableGamingOptimizations !== false,
      votingQueryTimeout: options.votingQueryTimeout || 1000,    // 1 second for voting
      leaderboardTimeout: options.leaderboardTimeout || 2000,   // 2 seconds for leaderboards
      generalQueryTimeout: options.generalQueryTimeout || 30000, // 30 seconds general
      
      // Performance settings
      enableQueryRouting: options.enableQueryRouting !== false,
      enableConnectionPreloading: options.enableConnectionPreloading !== false,
      preloadConnections: options.preloadConnections || 3,
      
      ...options
    };
    
    // Initialize pools
    this.primaryPool = null;
    this.replicaPools = [];
    this.isInitialized = false;
    
    // Health tracking
    this.healthStatus = {
      primary: { healthy: true, consecutiveFailures: 0, lastCheck: null },
      replicas: []
    };
    
    // Performance metrics
    this.metrics = {
      // Connection metrics
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingClients: 0,
      
      // Query metrics
      totalQueries: 0,
      readQueries: 0,
      writeQueries: 0,
      avgQueryTime: 0,
      slowQueries: 0,
      failedQueries: 0,
      
      // Pool metrics
      poolAdaptations: 0,
      failovers: 0,
      connectionErrors: 0,
      
      // Gaming-specific metrics
      votingQueries: 0,
      leaderboardQueries: 0,
      tournamentQueries: 0,
      
      // Timing metrics
      totalQueryTime: 0,
      connectionAcquisitionTime: 0,
      lastMetricsReset: Date.now()
    };
    
    // Load balancing
    this.currentReplicaIndex = 0;
    this.replicaWeights = [];
    
    // Connection warming
    this.warmingInProgress = false;
    
    this.logger = options.logger || console;
  }

  /**
   * Initialize all database pools
   */
  async initialize() {
    try {
      this.logger.info('Initializing Enhanced Pool Manager...');
      
      // Initialize primary pool
      await this.initializePrimaryPool();
      
      // Initialize replica pools if enabled
      if (this.config.enableReadReplicas && this.config.replicas.length > 0) {
        await this.initializeReplicaPools();
      }
      
      // Start health monitoring
      if (this.config.enableHealthMonitoring) {
        this.startHealthMonitoring();
      }
      
      // Start adaptive pool management
      if (this.config.enableAdaptivePooling) {
        this.startAdaptivePooling();
      }
      
      // Preload connections
      if (this.config.enableConnectionPreloading) {
        await this.preloadConnections();
      }
      
      this.isInitialized = true;
      
      this.logger.info('✓ Enhanced Pool Manager initialized successfully');
      this.emit('manager:initialized', this.getStatus());
      
    } catch (error) {
      this.logger.error('Pool Manager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize primary database pool
   */
  async initializePrimaryPool() {
    this.primaryPool = new Pool({
      ...this.config.primary,
      application_name: 'MLG_Clan_Primary',
      max: this.config.primary.max,
      min: this.config.primary.min
    });
    
    // Setup event handlers
    this.primaryPool.on('connect', (client) => {
      this.logger.debug(`[Primary] Client connected (total: ${this.primaryPool.totalCount})`);
      this.emit('pool:connect', { type: 'primary', totalCount: this.primaryPool.totalCount });
    });
    
    this.primaryPool.on('error', (err, client) => {
      this.logger.error('[Primary] Pool error:', err);
      this.metrics.connectionErrors++;
      this.emit('pool:error', { type: 'primary', error: err });
    });
    
    this.primaryPool.on('remove', (client) => {
      this.logger.debug(`[Primary] Client removed (total: ${this.primaryPool.totalCount})`);
    });
    
    // Test primary connection
    const testClient = await this.primaryPool.connect();
    await testClient.query('SELECT 1');
    testClient.release();
    
    this.logger.info('✓ Primary pool initialized');
  }

  /**
   * Initialize replica pools
   */
  async initializeReplicaPools() {
    for (let i = 0; i < this.config.replicas.length; i++) {
      const replicaConfig = this.config.replicas[i];
      
      try {
        const pool = new Pool({
          ...replicaConfig,
          application_name: `MLG_Clan_Replica_${i + 1}`,
          max: replicaConfig.max || 15,
          min: replicaConfig.min || 3
        });
        
        // Setup event handlers
        pool.on('connect', (client) => {
          this.logger.debug(`[Replica ${i + 1}] Client connected (total: ${pool.totalCount})`);
          this.emit('pool:connect', { type: 'replica', index: i, totalCount: pool.totalCount });
        });
        
        pool.on('error', (err, client) => {
          this.logger.error(`[Replica ${i + 1}] Pool error:`, err);
          this.metrics.connectionErrors++;
          this.healthStatus.replicas[i] = { 
            healthy: false, 
            consecutiveFailures: (this.healthStatus.replicas[i]?.consecutiveFailures || 0) + 1,
            lastCheck: Date.now(),
            error: err.message
          };
          this.emit('pool:error', { type: 'replica', index: i, error: err });
        });
        
        // Test replica connection
        const testClient = await pool.connect();
        await testClient.query('SELECT 1');
        testClient.release();
        
        this.replicaPools.push(pool);
        this.healthStatus.replicas.push({ 
          healthy: true, 
          consecutiveFailures: 0, 
          lastCheck: Date.now() 
        });
        this.replicaWeights.push(replicaConfig.priority || 1);
        
        this.logger.info(`✓ Replica ${i + 1} pool initialized`);
        
      } catch (error) {
        this.logger.warn(`Failed to initialize replica ${i + 1}:`, error);
        this.healthStatus.replicas.push({ 
          healthy: false, 
          consecutiveFailures: 1, 
          lastCheck: Date.now(),
          error: error.message 
        });
      }
    }
  }

  /**
   * Execute query with intelligent routing
   */
  async query(sql, params = [], options = {}) {
    const startTime = performance.now();
    this.metrics.totalQueries++;
    
    try {
      // Determine query type and routing
      const queryType = this.analyzeQuery(sql, options);
      const pool = await this.selectPool(queryType, options);
      
      // Set appropriate timeout based on query type
      const timeout = this.getQueryTimeout(queryType, options);
      
      // Execute query
      const result = await this.executeQuery(pool, sql, params, { ...options, timeout });
      
      // Update metrics
      this.updateQueryMetrics(queryType, performance.now() - startTime, true);
      
      return result;
      
    } catch (error) {
      this.metrics.failedQueries++;
      this.updateQueryMetrics('failed', performance.now() - startTime, false);
      
      // Attempt failover for read queries
      if (this.isReadQuery(sql) && this.config.enableReadReplicas && !options.noFailover) {
        return await this.attemptFailover(sql, params, options);
      }
      
      throw error;
    }
  }

  /**
   * Analyze query to determine optimal routing
   */
  analyzeQuery(sql, options = {}) {
    const normalizedSQL = sql.toLowerCase().trim();
    
    // Gaming-specific query classification
    if (options.queryType) {
      return options.queryType;
    }
    
    if (normalizedSQL.includes('votes') || normalizedSQL.includes('voting')) {
      this.metrics.votingQueries++;
      return 'voting';
    }
    
    if (normalizedSQL.includes('leaderboard') || 
        (normalizedSQL.includes('order by') && normalizedSQL.includes('desc'))) {
      this.metrics.leaderboardQueries++;
      return 'leaderboard';
    }
    
    if (normalizedSQL.includes('tournament')) {
      this.metrics.tournamentQueries++;
      return 'tournament';
    }
    
    // Standard classification
    if (normalizedSQL.startsWith('select') || 
        normalizedSQL.startsWith('with')) {
      this.metrics.readQueries++;
      return 'read';
    }
    
    if (normalizedSQL.startsWith('insert') || 
        normalizedSQL.startsWith('update') || 
        normalizedSQL.startsWith('delete')) {
      this.metrics.writeQueries++;
      return 'write';
    }
    
    return 'unknown';
  }

  /**
   * Select optimal pool for query
   */
  async selectPool(queryType, options = {}) {
    // Force primary pool for writes or when replicas disabled
    if (queryType === 'write' || 
        !this.config.enableReadReplicas || 
        options.forcePrimary) {
      return this.primaryPool;
    }
    
    // Use replica for read queries
    if (queryType === 'read' || 
        queryType === 'voting' || 
        queryType === 'leaderboard' || 
        queryType === 'tournament') {
      
      const replica = await this.selectHealthyReplica();
      if (replica) {
        return replica;
      }
      
      // Fallback to primary if no healthy replicas
      this.logger.warn('No healthy replicas available, using primary for read query');
      return this.primaryPool;
    }
    
    // Default to primary
    return this.primaryPool;
  }

  /**
   * Select healthy replica using weighted round-robin
   */
  async selectHealthyReplica() {
    if (this.replicaPools.length === 0) {
      return null;
    }
    
    // Find healthy replicas
    const healthyReplicas = this.replicaPools
      .map((pool, index) => ({
        pool,
        index,
        healthy: this.healthStatus.replicas[index]?.healthy || false,
        weight: this.replicaWeights[index] || 1
      }))
      .filter(replica => replica.healthy);
    
    if (healthyReplicas.length === 0) {
      return null;
    }
    
    // Weighted round-robin selection
    let totalWeight = healthyReplicas.reduce((sum, replica) => sum + replica.weight, 0);
    let randomWeight = Math.random() * totalWeight;
    
    for (const replica of healthyReplicas) {
      randomWeight -= replica.weight;
      if (randomWeight <= 0) {
        return replica.pool;
      }
    }
    
    // Fallback to first healthy replica
    return healthyReplicas[0].pool;
  }

  /**
   * Execute query with timeout and error handling
   */
  async executeQuery(pool, sql, params, options = {}) {
    const client = await pool.connect();
    
    try {
      // Set query timeout if specified
      if (options.timeout) {
        await client.query(`SET statement_timeout = '${options.timeout}ms'`);
      }
      
      const result = await client.query(sql, params);
      return result;
      
    } finally {
      // Reset timeout and release client
      if (options.timeout) {
        try {
          await client.query('SET statement_timeout = DEFAULT');
        } catch (error) {
          // Ignore timeout reset errors
        }
      }
      client.release();
    }
  }

  /**
   * Get query timeout based on type
   */
  getQueryTimeout(queryType, options = {}) {
    if (options.timeout) {
      return options.timeout;
    }
    
    switch (queryType) {
      case 'voting':
        return this.config.votingQueryTimeout;
      case 'leaderboard':
        return this.config.leaderboardTimeout;
      case 'tournament':
        return this.config.leaderboardTimeout;
      default:
        return this.config.generalQueryTimeout;
    }
  }

  /**
   * Attempt failover for failed read queries
   */
  async attemptFailover(sql, params, options) {
    this.metrics.failovers++;
    
    try {
      // Try primary pool as fallback
      this.logger.warn('Attempting failover to primary pool');
      const pool = this.primaryPool;
      const result = await this.executeQuery(pool, sql, params, { ...options, noFailover: true });
      
      this.emit('failover:success', { query: sql.substring(0, 100) });
      return result;
      
    } catch (error) {
      this.emit('failover:failed', { query: sql.substring(0, 100), error: error.message });
      throw error;
    }
  }

  /**
   * Execute transaction with optimal pool selection
   */
  async transaction(callback, options = {}) {
    // Transactions always use primary pool
    const client = await this.primaryPool.connect();
    
    try {
      await client.query('BEGIN');
      
      const result = await callback(client);
      
      await client.query('COMMIT');
      return result;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
      
    } finally {
      client.release();
    }
  }

  /**
   * Health monitoring
   */
  startHealthMonitoring() {
    setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckInterval);
    
    this.logger.info('Health monitoring started');
  }

  /**
   * Perform health checks on all pools
   */
  async performHealthChecks() {
    // Check primary pool
    await this.checkPoolHealth(this.primaryPool, 'primary');
    
    // Check replica pools
    for (let i = 0; i < this.replicaPools.length; i++) {
      await this.checkPoolHealth(this.replicaPools[i], 'replica', i);
    }
  }

  /**
   * Check health of individual pool
   */
  async checkPoolHealth(pool, type, index = null) {
    try {
      const startTime = performance.now();
      const client = await pool.connect();
      
      await client.query('SELECT 1');
      client.release();
      
      const responseTime = performance.now() - startTime;
      
      // Update health status
      const statusKey = type === 'primary' ? 'primary' : `replicas.${index}`;
      if (type === 'primary') {
        this.healthStatus.primary = {
          healthy: true,
          consecutiveFailures: 0,
          lastCheck: Date.now(),
          responseTime
        };
      } else {
        this.healthStatus.replicas[index] = {
          healthy: true,
          consecutiveFailures: 0,
          lastCheck: Date.now(),
          responseTime
        };
      }
      
      this.emit('health:check', {
        type,
        index,
        healthy: true,
        responseTime
      });
      
    } catch (error) {
      // Update health status for failure
      let statusObj;
      if (type === 'primary') {
        this.healthStatus.primary.healthy = false;
        this.healthStatus.primary.consecutiveFailures++;
        this.healthStatus.primary.lastCheck = Date.now();
        this.healthStatus.primary.error = error.message;
        statusObj = this.healthStatus.primary;
      } else {
        if (!this.healthStatus.replicas[index]) {
          this.healthStatus.replicas[index] = {};
        }
        this.healthStatus.replicas[index].healthy = false;
        this.healthStatus.replicas[index].consecutiveFailures = 
          (this.healthStatus.replicas[index].consecutiveFailures || 0) + 1;
        this.healthStatus.replicas[index].lastCheck = Date.now();
        this.healthStatus.replicas[index].error = error.message;
        statusObj = this.healthStatus.replicas[index];
      }
      
      this.logger.warn(`[${type}${index !== null ? ` ${index + 1}` : ''}] Health check failed:`, error.message);
      
      this.emit('health:check', {
        type,
        index,
        healthy: false,
        error: error.message,
        consecutiveFailures: statusObj.consecutiveFailures
      });
      
      // Alert if threshold exceeded
      if (statusObj.consecutiveFailures >= this.config.unhealthyThreshold) {
        this.emit('health:critical', {
          type,
          index,
          consecutiveFailures: statusObj.consecutiveFailures
        });
      }
    }
  }

  /**
   * Adaptive pool sizing
   */
  startAdaptivePooling() {
    setInterval(() => {
      this.adaptPoolSizes();
    }, this.config.adaptiveCheckInterval);
    
    this.logger.info('Adaptive pool sizing started');
  }

  /**
   * Adapt pool sizes based on utilization
   */
  adaptPoolSizes() {
    if (!this.config.enableAdaptivePooling) {
      return;
    }
    
    // Adapt primary pool
    this.adaptSinglePool(this.primaryPool, 'primary');
    
    // Adapt replica pools
    this.replicaPools.forEach((pool, index) => {
      this.adaptSinglePool(pool, `replica-${index}`);
    });
  }

  /**
   * Adapt single pool size
   */
  adaptSinglePool(pool, poolName) {
    const utilization = pool.totalCount > 0 ? 
      (pool.totalCount - pool.idleCount) / pool.totalCount : 0;
    
    const currentMax = pool.options.max;
    let newMax = currentMax;
    
    if (utilization > this.config.targetUtilization + 0.1) {
      // High utilization - increase pool size
      newMax = Math.min(currentMax + 2, currentMax * 1.5);
    } else if (utilization < this.config.targetUtilization - 0.2) {
      // Low utilization - decrease pool size
      newMax = Math.max(currentMax - 1, pool.options.min);
    }
    
    if (newMax !== currentMax) {
      pool.options.max = Math.floor(newMax);
      this.metrics.poolAdaptations++;
      
      this.logger.info(
        `[${poolName}] Pool size adapted: ${currentMax} -> ${pool.options.max} ` +
        `(utilization: ${Math.round(utilization * 100)}%)`
      );
      
      this.emit('pool:adapted', {
        poolName,
        oldSize: currentMax,
        newSize: pool.options.max,
        utilization
      });
    }
  }

  /**
   * Connection preloading
   */
  async preloadConnections() {
    if (this.warmingInProgress) {
      return;
    }
    
    this.warmingInProgress = true;
    
    try {
      this.logger.info('Preloading database connections...');
      
      // Preload primary connections
      const primaryClients = [];
      for (let i = 0; i < this.config.preloadConnections; i++) {
        const client = await this.primaryPool.connect();
        primaryClients.push(client);
      }
      
      // Release primary connections
      primaryClients.forEach(client => client.release());
      
      // Preload replica connections
      for (const pool of this.replicaPools) {
        const replicaClients = [];
        for (let i = 0; i < this.config.preloadConnections; i++) {
          const client = await pool.connect();
          replicaClients.push(client);
        }
        replicaClients.forEach(client => client.release());
      }
      
      this.logger.info('✓ Connection preloading completed');
      
    } catch (error) {
      this.logger.warn('Connection preloading failed:', error);
    } finally {
      this.warmingInProgress = false;
    }
  }

  /**
   * Utility methods
   */
  
  isReadQuery(sql) {
    const normalized = sql.toLowerCase().trim();
    return normalized.startsWith('select') || 
           normalized.startsWith('with') ||
           normalized.includes(' select ');
  }

  updateQueryMetrics(queryType, duration, success) {
    this.metrics.totalQueryTime += duration;
    this.metrics.avgQueryTime = this.metrics.totalQueryTime / this.metrics.totalQueries;
    
    if (duration > 1000) { // Slow query threshold: 1 second
      this.metrics.slowQueries++;
    }
  }

  /**
   * Get comprehensive status
   */
  getStatus() {
    const primaryStats = this.primaryPool ? {
      totalCount: this.primaryPool.totalCount,
      idleCount: this.primaryPool.idleCount,
      waitingCount: this.primaryPool.waitingCount,
      max: this.primaryPool.options.max,
      min: this.primaryPool.options.min
    } : null;
    
    const replicaStats = this.replicaPools.map((pool, index) => ({
      index,
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
      max: pool.options.max,
      min: pool.options.min,
      healthy: this.healthStatus.replicas[index]?.healthy || false
    }));
    
    return {
      initialized: this.isInitialized,
      primary: {
        stats: primaryStats,
        health: this.healthStatus.primary
      },
      replicas: {
        count: this.replicaPools.length,
        stats: replicaStats,
        health: this.healthStatus.replicas
      },
      metrics: this.metrics,
      config: {
        enableReadReplicas: this.config.enableReadReplicas,
        enableAdaptivePooling: this.config.enableAdaptivePooling,
        enableHealthMonitoring: this.config.enableHealthMonitoring
      }
    };
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    const uptime = Date.now() - this.metrics.lastMetricsReset;
    const qps = this.metrics.totalQueries / (uptime / 1000); // Queries per second
    
    return {
      uptime,
      queriesPerSecond: Math.round(qps * 100) / 100,
      avgQueryTime: Math.round(this.metrics.avgQueryTime * 100) / 100,
      readWriteRatio: this.metrics.writeQueries > 0 ? 
        Math.round((this.metrics.readQueries / this.metrics.writeQueries) * 100) / 100 : 
        Infinity,
      errorRate: this.metrics.totalQueries > 0 ? 
        Math.round((this.metrics.failedQueries / this.metrics.totalQueries) * 100 * 100) / 100 : 0,
      slowQueryRate: this.metrics.totalQueries > 0 ?
        Math.round((this.metrics.slowQueries / this.metrics.totalQueries) * 100 * 100) / 100 : 0,
      failoverCount: this.metrics.failovers,
      adaptationCount: this.metrics.poolAdaptations
    };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics() {
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingClients: 0,
      totalQueries: 0,
      readQueries: 0,
      writeQueries: 0,
      avgQueryTime: 0,
      slowQueries: 0,
      failedQueries: 0,
      poolAdaptations: 0,
      failovers: 0,
      connectionErrors: 0,
      votingQueries: 0,
      leaderboardQueries: 0,
      tournamentQueries: 0,
      totalQueryTime: 0,
      connectionAcquisitionTime: 0,
      lastMetricsReset: Date.now()
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    this.logger.info('Shutting down Enhanced Pool Manager...');
    
    const shutdownPromises = [];
    
    if (this.primaryPool) {
      shutdownPromises.push(this.primaryPool.end());
    }
    
    this.replicaPools.forEach(pool => {
      shutdownPromises.push(pool.end());
    });
    
    await Promise.all(shutdownPromises);
    
    this.logger.info('✓ Enhanced Pool Manager shutdown complete');
    this.emit('manager:shutdown');
  }
}

// Create singleton instance
let globalPoolManager = null;

export function createEnhancedPoolManager(options = {}) {
  return new EnhancedPoolManager(options);
}

export function getEnhancedPoolManager(options = {}) {
  if (!globalPoolManager) {
    globalPoolManager = new EnhancedPoolManager(options);
  }
  return globalPoolManager;
}

export default EnhancedPoolManager;