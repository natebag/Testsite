/**
 * Database Replica Manager for MLG.clan Platform
 * 
 * Advanced database clustering and read replica management system with
 * automatic failover, load balancing, and gaming-specific optimizations.
 * 
 * Features:
 * - Multi-region read replica management
 * - Automatic failover and recovery
 * - Intelligent load balancing with health monitoring
 * - Gaming-specific read/write splitting
 * - Real-time replica lag monitoring
 * - Connection pooling per replica
 * - Geographic routing optimization
 * - Disaster recovery automation
 * 
 * @author Claude Code - Database Clustering Architect
 * @version 1.0.0
 * @created 2025-08-12
 */

import { EventEmitter } from 'events';
import { Pool } from 'pg';
import { performance } from 'perf_hooks';

export class ReplicaManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Primary database configuration
      primary: {
        host: options.primary?.host || process.env.DB_PRIMARY_HOST || 'localhost',
        port: options.primary?.port || process.env.DB_PRIMARY_PORT || 5432,
        database: options.primary?.database || process.env.DB_NAME || 'mlg_clan',
        user: options.primary?.user || process.env.DB_USER || 'postgres',
        password: options.primary?.password || process.env.DB_PASSWORD || 'password',
        pool: {
          min: options.primary?.pool?.min || 5,
          max: options.primary?.pool?.max || 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        }
      },
      
      // Read replica configurations
      replicas: options.replicas || [
        {
          id: 'replica-us-east',
          host: process.env.DB_REPLICA1_HOST || 'localhost',
          port: process.env.DB_REPLICA1_PORT || 5433,
          region: 'us-east-1',
          priority: 1, // Higher priority for closer/better replicas
          pool: { min: 3, max: 15 }
        },
        {
          id: 'replica-us-west',
          host: process.env.DB_REPLICA2_HOST || 'localhost',
          port: process.env.DB_REPLICA2_PORT || 5434,
          region: 'us-west-2',
          priority: 2,
          pool: { min: 3, max: 15 }
        },
        {
          id: 'replica-eu-central',
          host: process.env.DB_REPLICA3_HOST || 'localhost',
          port: process.env.DB_REPLICA3_PORT || 5435,
          region: 'eu-central-1',
          priority: 3,
          pool: { min: 2, max: 10 }
        }
      ],
      
      // Health monitoring
      enableHealthMonitoring: options.enableHealthMonitoring !== false,
      healthCheckInterval: options.healthCheckInterval || 10000, // 10 seconds
      healthCheckTimeout: options.healthCheckTimeout || 5000,   // 5 seconds
      maxConsecutiveFailures: options.maxConsecutiveFailures || 3,
      
      // Lag monitoring
      enableLagMonitoring: options.enableLagMonitoring !== false,
      lagCheckInterval: options.lagCheckInterval || 30000,     // 30 seconds
      maxAllowedLag: options.maxAllowedLag || 5000,           // 5 seconds
      warningLagThreshold: options.warningLagThreshold || 2000, // 2 seconds
      
      // Load balancing
      loadBalancingStrategy: options.loadBalancingStrategy || 'weighted-round-robin',
      enableGeographicRouting: options.enableGeographicRouting !== false,
      maxConnectionsPerReplica: options.maxConnectionsPerReplica || 15,
      
      // Failover settings
      enableAutoFailover: options.enableAutoFailover !== false,
      failoverTimeout: options.failoverTimeout || 30000,      // 30 seconds
      recoveryCheckInterval: options.recoveryCheckInterval || 60000, // 1 minute
      
      // Gaming-specific settings
      enableGamingOptimizations: options.enableGamingOptimizations !== false,
      votingReadPreference: options.votingReadPreference || 'primary', // Always primary for voting
      leaderboardReadPreference: options.leaderboardReadPreference || 'replica-nearest',
      
      ...options
    };
    
    // Connection pools
    this.primaryPool = null;
    this.replicaPools = new Map();
    
    // Health tracking
    this.replicaHealth = new Map();
    this.lagMetrics = new Map();
    
    // Load balancing state
    this.currentReplicaIndex = 0;
    this.connectionCounts = new Map();
    
    // Failover state
    this.failedReplicas = new Set();
    this.failoverInProgress = false;
    
    // Performance metrics
    this.metrics = {
      primaryQueries: 0,
      replicaQueries: 0,
      failovers: 0,
      avgPrimaryResponseTime: 0,
      avgReplicaResponseTime: 0,
      totalPrimaryTime: 0,
      totalReplicaTime: 0,
      healthCheckFailures: 0,
      lagWarnings: 0,
      geographicRoutings: 0,
      connectionErrors: 0,
      lastMetricsReset: Date.now()
    };
    
    // Regional mapping for geographic routing
    this.regionMapping = {
      'us-east-1': ['us-east-1a', 'us-east-1b', 'us-east-1c'],
      'us-west-2': ['us-west-2a', 'us-west-2b', 'us-west-2c'],
      'eu-central-1': ['eu-central-1a', 'eu-central-1b', 'eu-central-1c']
    };
    
    this.logger = options.logger || console;
  }

  /**
   * Initialize replica manager
   */
  async initialize() {
    try {
      this.logger.info('Initializing Replica Manager...');
      
      // Initialize primary connection
      await this.initializePrimary();
      
      // Initialize replica connections
      await this.initializeReplicas();
      
      // Start health monitoring
      if (this.config.enableHealthMonitoring) {
        this.startHealthMonitoring();
      }
      
      // Start lag monitoring
      if (this.config.enableLagMonitoring) {
        this.startLagMonitoring();
      }
      
      // Start recovery monitoring
      this.startRecoveryMonitoring();
      
      this.logger.info('✓ Replica Manager initialized successfully');
      this.emit('manager:initialized', this.getStatus());
      
    } catch (error) {
      this.logger.error('Replica Manager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize primary database connection
   */
  async initializePrimary() {
    this.primaryPool = new Pool({
      host: this.config.primary.host,
      port: this.config.primary.port,
      database: this.config.primary.database,
      user: this.config.primary.user,
      password: this.config.primary.password,
      min: this.config.primary.pool.min,
      max: this.config.primary.pool.max,
      idleTimeoutMillis: this.config.primary.pool.idleTimeoutMillis,
      connectionTimeoutMillis: this.config.primary.pool.connectionTimeoutMillis,
      application_name: 'MLG_Clan_Primary'
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
    
    // Test primary connection
    const testClient = await this.primaryPool.connect();
    await testClient.query('SELECT 1');
    testClient.release();
    
    this.logger.info('✓ Primary database connection established');
  }

  /**
   * Initialize replica connections
   */
  async initializeReplicas() {
    for (const replicaConfig of this.config.replicas) {
      try {
        await this.initializeReplica(replicaConfig);
      } catch (error) {
        this.logger.warn(`Failed to initialize replica ${replicaConfig.id}:`, error);
        this.markReplicaAsFailed(replicaConfig.id, error);
      }
    }
  }

  /**
   * Initialize individual replica
   */
  async initializeReplica(replicaConfig) {
    const pool = new Pool({
      host: replicaConfig.host,
      port: replicaConfig.port,
      database: this.config.primary.database,
      user: this.config.primary.user,
      password: this.config.primary.password,
      min: replicaConfig.pool.min,
      max: replicaConfig.pool.max,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      application_name: `MLG_Clan_${replicaConfig.id}`
    });
    
    // Setup event handlers
    pool.on('connect', (client) => {
      this.logger.debug(`[${replicaConfig.id}] Client connected (total: ${pool.totalCount})`);
      this.emit('pool:connect', { 
        type: 'replica', 
        replicaId: replicaConfig.id, 
        totalCount: pool.totalCount 
      });
    });
    
    pool.on('error', (err, client) => {
      this.logger.error(`[${replicaConfig.id}] Pool error:`, err);
      this.metrics.connectionErrors++;
      this.markReplicaAsFailed(replicaConfig.id, err);
      this.emit('pool:error', { 
        type: 'replica', 
        replicaId: replicaConfig.id, 
        error: err 
      });
    });
    
    // Test replica connection
    const testClient = await pool.connect();
    await testClient.query('SELECT 1');
    testClient.release();
    
    // Store replica pool and initialize health status
    this.replicaPools.set(replicaConfig.id, pool);
    this.replicaHealth.set(replicaConfig.id, {
      healthy: true,
      consecutiveFailures: 0,
      lastHealthCheck: Date.now(),
      responseTime: 0,
      region: replicaConfig.region,
      priority: replicaConfig.priority
    });
    
    this.connectionCounts.set(replicaConfig.id, 0);
    this.lagMetrics.set(replicaConfig.id, {
      lag: 0,
      lastLagCheck: Date.now(),
      lagHistory: []
    });
    
    this.logger.info(`✓ Replica ${replicaConfig.id} (${replicaConfig.region}) initialized`);
  }

  /**
   * Execute query with intelligent routing
   */
  async query(sql, params = [], options = {}) {
    const startTime = performance.now();
    
    try {
      const pool = await this.selectPool(sql, options);
      const result = await this.executeQuery(pool, sql, params, options);
      
      // Update metrics
      const responseTime = performance.now() - startTime;
      this.updateQueryMetrics(pool === this.primaryPool ? 'primary' : 'replica', responseTime);
      
      return result;
      
    } catch (error) {
      // Attempt failover for read queries
      if (this.isReadQuery(sql) && !options.noFailover) {
        return await this.attemptFailover(sql, params, options);
      }
      
      throw error;
    }
  }

  /**
   * Select optimal pool for query execution
   */
  async selectPool(sql, options = {}) {
    // Always use primary for write operations
    if (!this.isReadQuery(sql) || options.forcePrimary) {
      return this.primaryPool;
    }
    
    // Gaming-specific routing
    if (this.config.enableGamingOptimizations) {
      const gamingPool = this.getGamingOptimizedPool(sql, options);
      if (gamingPool) {
        return gamingPool;
      }
    }
    
    // Geographic routing
    if (this.config.enableGeographicRouting && options.userRegion) {
      const geoPool = this.getGeographicOptimizedPool(options.userRegion);
      if (geoPool) {
        this.metrics.geographicRoutings++;
        return geoPool;
      }
    }
    
    // Standard load balancing
    return this.getLoadBalancedPool();
  }

  /**
   * Get gaming-optimized pool
   */
  getGamingOptimizedPool(sql, options) {
    const normalizedSQL = sql.toLowerCase();
    
    // Voting queries - use primary for consistency
    if (normalizedSQL.includes('votes') || normalizedSQL.includes('voting')) {
      if (this.config.votingReadPreference === 'primary') {
        return this.primaryPool;
      }
    }
    
    // Leaderboard queries - use nearest replica
    if (normalizedSQL.includes('leaderboard') || normalizedSQL.includes('ranking')) {
      if (this.config.leaderboardReadPreference === 'replica-nearest') {
        return this.getNearestHealthyReplica(options.userRegion);
      }
    }
    
    return null;
  }

  /**
   * Get geographically optimized pool
   */
  getGeographicOptimizedPool(userRegion) {
    if (!userRegion) return null;
    
    // Find replica in same region
    for (const [replicaId, pool] of this.replicaPools) {
      const health = this.replicaHealth.get(replicaId);
      if (health?.healthy && health.region === userRegion) {
        return pool;
      }
    }
    
    // Find replica in nearest region
    return this.getNearestHealthyReplica(userRegion);
  }

  /**
   * Get nearest healthy replica
   */
  getNearestHealthyReplica(userRegion) {
    let nearestReplica = null;
    let highestPriority = 0;
    
    for (const [replicaId, pool] of this.replicaPools) {
      const health = this.replicaHealth.get(replicaId);
      
      if (health?.healthy && health.priority > highestPriority) {
        nearestReplica = pool;
        highestPriority = health.priority;
      }
    }
    
    return nearestReplica || this.primaryPool;
  }

  /**
   * Get load-balanced pool
   */
  getLoadBalancedPool() {
    const healthyReplicas = this.getHealthyReplicas();
    
    if (healthyReplicas.length === 0) {
      return this.primaryPool;
    }
    
    switch (this.config.loadBalancingStrategy) {
      case 'round-robin':
        return this.getRoundRobinReplica(healthyReplicas);
      
      case 'weighted-round-robin':
        return this.getWeightedRoundRobinReplica(healthyReplicas);
      
      case 'least-connections':
        return this.getLeastConnectionsReplica(healthyReplicas);
      
      case 'response-time':
        return this.getFastestReplica(healthyReplicas);
      
      default:
        return this.getRoundRobinReplica(healthyReplicas);
    }
  }

  /**
   * Get healthy replicas
   */
  getHealthyReplicas() {
    const healthy = [];
    
    for (const [replicaId, pool] of this.replicaPools) {
      const health = this.replicaHealth.get(replicaId);
      const lagMetric = this.lagMetrics.get(replicaId);
      
      if (health?.healthy && 
          !this.failedReplicas.has(replicaId) &&
          (!lagMetric || lagMetric.lag < this.config.maxAllowedLag)) {
        healthy.push({ replicaId, pool, health });
      }
    }
    
    return healthy;
  }

  /**
   * Round-robin replica selection
   */
  getRoundRobinReplica(healthyReplicas) {
    if (healthyReplicas.length === 0) return this.primaryPool;
    
    const replica = healthyReplicas[this.currentReplicaIndex % healthyReplicas.length];
    this.currentReplicaIndex++;
    
    return replica.pool;
  }

  /**
   * Weighted round-robin replica selection
   */
  getWeightedRoundRobinReplica(healthyReplicas) {
    if (healthyReplicas.length === 0) return this.primaryPool;
    
    // Sort by priority (weight)
    const sortedReplicas = healthyReplicas.sort((a, b) => b.health.priority - a.health.priority);
    
    // Select based on weighted distribution
    const totalWeight = sortedReplicas.reduce((sum, replica) => sum + replica.health.priority, 0);
    let randomWeight = Math.random() * totalWeight;
    
    for (const replica of sortedReplicas) {
      randomWeight -= replica.health.priority;
      if (randomWeight <= 0) {
        return replica.pool;
      }
    }
    
    return sortedReplicas[0].pool;
  }

  /**
   * Least connections replica selection
   */
  getLeastConnectionsReplica(healthyReplicas) {
    if (healthyReplicas.length === 0) return this.primaryPool;
    
    let leastConnections = Infinity;
    let selectedReplica = null;
    
    for (const replica of healthyReplicas) {
      const connections = replica.pool.totalCount - replica.pool.idleCount;
      if (connections < leastConnections) {
        leastConnections = connections;
        selectedReplica = replica;
      }
    }
    
    return selectedReplica?.pool || healthyReplicas[0].pool;
  }

  /**
   * Fastest response time replica selection
   */
  getFastestReplica(healthyReplicas) {
    if (healthyReplicas.length === 0) return this.primaryPool;
    
    let fastestResponseTime = Infinity;
    let selectedReplica = null;
    
    for (const replica of healthyReplicas) {
      if (replica.health.responseTime < fastestResponseTime) {
        fastestResponseTime = replica.health.responseTime;
        selectedReplica = replica;
      }
    }
    
    return selectedReplica?.pool || healthyReplicas[0].pool;
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
   * Attempt failover for failed queries
   */
  async attemptFailover(sql, params, options) {
    this.metrics.failovers++;
    
    try {
      // Try primary pool as fallback
      this.logger.warn('Attempting failover to primary pool');
      const result = await this.executeQuery(this.primaryPool, sql, params, { 
        ...options, 
        noFailover: true 
      });
      
      this.emit('failover:success', { query: sql.substring(0, 100) });
      return result;
      
    } catch (error) {
      this.emit('failover:failed', { 
        query: sql.substring(0, 100), 
        error: error.message 
      });
      throw error;
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
   * Perform health checks on all replicas
   */
  async performHealthChecks() {
    const healthPromises = [];
    
    for (const [replicaId, pool] of this.replicaPools) {
      healthPromises.push(this.checkReplicaHealth(replicaId, pool));
    }
    
    await Promise.allSettled(healthPromises);
  }

  /**
   * Check individual replica health
   */
  async checkReplicaHealth(replicaId, pool) {
    const startTime = performance.now();
    const health = this.replicaHealth.get(replicaId);
    
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      
      const responseTime = performance.now() - startTime;
      
      // Update health status
      health.healthy = true;
      health.consecutiveFailures = 0;
      health.lastHealthCheck = Date.now();
      health.responseTime = responseTime;
      
      // Remove from failed replicas if it was there
      if (this.failedReplicas.has(replicaId)) {
        this.failedReplicas.delete(replicaId);
        this.logger.info(`Replica ${replicaId} recovered`);
        this.emit('replica:recovered', { replicaId, responseTime });
      }
      
    } catch (error) {
      health.healthy = false;
      health.consecutiveFailures++;
      health.lastHealthCheck = Date.now();
      
      this.metrics.healthCheckFailures++;
      
      if (health.consecutiveFailures >= this.config.maxConsecutiveFailures) {
        this.markReplicaAsFailed(replicaId, error);
      }
      
      this.logger.warn(`Health check failed for replica ${replicaId}:`, error.message);
    }
  }

  /**
   * Lag monitoring
   */
  startLagMonitoring() {
    setInterval(async () => {
      await this.checkReplicationLag();
    }, this.config.lagCheckInterval);
    
    this.logger.info('Lag monitoring started');
  }

  /**
   * Check replication lag for all replicas
   */
  async checkReplicationLag() {
    for (const [replicaId, pool] of this.replicaPools) {
      if (!this.replicaHealth.get(replicaId)?.healthy) {
        continue; // Skip unhealthy replicas
      }
      
      try {
        const lag = await this.measureReplicationLag(pool);
        const lagMetric = this.lagMetrics.get(replicaId);
        
        lagMetric.lag = lag;
        lagMetric.lastLagCheck = Date.now();
        lagMetric.lagHistory.push({ lag, timestamp: Date.now() });
        
        // Keep only last 100 lag measurements
        if (lagMetric.lagHistory.length > 100) {
          lagMetric.lagHistory.shift();
        }
        
        // Check for lag warnings
        if (lag > this.config.warningLagThreshold) {
          this.metrics.lagWarnings++;
          
          this.emit('replica:lag:warning', {
            replicaId,
            lag,
            threshold: this.config.warningLagThreshold
          });
          
          // Mark as failed if lag exceeds maximum allowed
          if (lag > this.config.maxAllowedLag) {
            this.markReplicaAsFailed(replicaId, new Error(`Replication lag too high: ${lag}ms`));
          }
        }
        
      } catch (error) {
        this.logger.error(`Failed to check lag for replica ${replicaId}:`, error);
      }
    }
  }

  /**
   * Measure replication lag for a replica
   */
  async measureReplicationLag(replicaPool) {
    const client = await replicaPool.connect();
    
    try {
      // Get current LSN from replica
      const result = await client.query(`
        SELECT 
          EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) * 1000 as lag_ms
      `);
      
      return result.rows[0]?.lag_ms || 0;
      
    } catch (error) {
      // If lag query fails, assume high lag
      return this.config.maxAllowedLag;
    } finally {
      client.release();
    }
  }

  /**
   * Mark replica as failed
   */
  markReplicaAsFailed(replicaId, error) {
    if (!this.failedReplicas.has(replicaId)) {
      this.failedReplicas.add(replicaId);
      
      this.logger.error(`Replica ${replicaId} marked as failed:`, error.message);
      
      this.emit('replica:failed', {
        replicaId,
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Recovery monitoring
   */
  startRecoveryMonitoring() {
    setInterval(async () => {
      await this.attemptRecovery();
    }, this.config.recoveryCheckInterval);
    
    this.logger.info('Recovery monitoring started');
  }

  /**
   * Attempt to recover failed replicas
   */
  async attemptRecovery() {
    for (const replicaId of this.failedReplicas) {
      const pool = this.replicaPools.get(replicaId);
      if (pool) {
        await this.checkReplicaHealth(replicaId, pool);
      }
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

  updateQueryMetrics(poolType, responseTime) {
    if (poolType === 'primary') {
      this.metrics.primaryQueries++;
      this.metrics.totalPrimaryTime += responseTime;
      this.metrics.avgPrimaryResponseTime = this.metrics.totalPrimaryTime / this.metrics.primaryQueries;
    } else {
      this.metrics.replicaQueries++;
      this.metrics.totalReplicaTime += responseTime;
      this.metrics.avgReplicaResponseTime = this.metrics.totalReplicaTime / this.metrics.replicaQueries;
    }
  }

  /**
   * Get comprehensive status
   */
  getStatus() {
    const replicaStatuses = {};
    
    for (const [replicaId, pool] of this.replicaPools) {
      const health = this.replicaHealth.get(replicaId);
      const lagMetric = this.lagMetrics.get(replicaId);
      
      replicaStatuses[replicaId] = {
        healthy: health?.healthy || false,
        region: health?.region,
        priority: health?.priority,
        responseTime: health?.responseTime || 0,
        consecutiveFailures: health?.consecutiveFailures || 0,
        lag: lagMetric?.lag || 0,
        connections: {
          total: pool.totalCount,
          idle: pool.idleCount,
          waiting: pool.waitingCount
        },
        failed: this.failedReplicas.has(replicaId)
      };
    }
    
    return {
      primary: {
        healthy: this.primaryPool !== null,
        connections: this.primaryPool ? {
          total: this.primaryPool.totalCount,
          idle: this.primaryPool.idleCount,
          waiting: this.primaryPool.waitingCount
        } : null
      },
      replicas: replicaStatuses,
      metrics: this.metrics,
      failedReplicaCount: this.failedReplicas.size,
      healthyReplicaCount: this.getHealthyReplicas().length,
      config: {
        loadBalancingStrategy: this.config.loadBalancingStrategy,
        enableGeographicRouting: this.config.enableGeographicRouting,
        enableGamingOptimizations: this.config.enableGamingOptimizations
      }
    };
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    const uptime = Date.now() - this.metrics.lastMetricsReset;
    const totalQueries = this.metrics.primaryQueries + this.metrics.replicaQueries;
    
    return {
      uptime,
      totalQueries,
      queriesPerSecond: totalQueries / (uptime / 1000),
      primaryRatio: totalQueries > 0 ? (this.metrics.primaryQueries / totalQueries) * 100 : 0,
      replicaRatio: totalQueries > 0 ? (this.metrics.replicaQueries / totalQueries) * 100 : 0,
      avgResponseTime: {
        primary: this.metrics.avgPrimaryResponseTime,
        replica: this.metrics.avgReplicaResponseTime
      },
      failoverCount: this.metrics.failovers,
      healthFailures: this.metrics.healthCheckFailures,
      lagWarnings: this.metrics.lagWarnings,
      geographicRoutings: this.metrics.geographicRoutings
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      primaryQueries: 0,
      replicaQueries: 0,
      failovers: 0,
      avgPrimaryResponseTime: 0,
      avgReplicaResponseTime: 0,
      totalPrimaryTime: 0,
      totalReplicaTime: 0,
      healthCheckFailures: 0,
      lagWarnings: 0,
      geographicRoutings: 0,
      connectionErrors: 0,
      lastMetricsReset: Date.now()
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    this.logger.info('Shutting down Replica Manager...');
    
    const shutdownPromises = [];
    
    // Close primary pool
    if (this.primaryPool) {
      shutdownPromises.push(this.primaryPool.end());
    }
    
    // Close replica pools
    for (const [replicaId, pool] of this.replicaPools) {
      shutdownPromises.push(pool.end());
    }
    
    await Promise.all(shutdownPromises);
    
    this.logger.info('✓ Replica Manager shutdown complete');
    this.emit('manager:shutdown');
  }
}

// Create singleton instance
let globalReplicaManager = null;

export function createReplicaManager(options = {}) {
  return new ReplicaManager(options);
}

export function getReplicaManager(options = {}) {
  if (!globalReplicaManager) {
    globalReplicaManager = new ReplicaManager(options);
  }
  return globalReplicaManager;
}

export default ReplicaManager;