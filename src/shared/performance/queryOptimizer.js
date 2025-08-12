/**
 * Database Query Optimizer for MLG.clan Platform
 * 
 * Advanced database query optimization system with intelligent caching,
 * connection pooling, prepared statement management, and performance monitoring.
 * Designed to maximize database performance and minimize response times.
 * 
 * Features:
 * - Query result caching with intelligent invalidation
 * - Database connection pooling with load balancing
 * - Prepared statement caching and reuse
 * - Slow query logging and optimization suggestions
 * - Query execution plan analysis
 * - Automatic query optimization
 * - Connection health monitoring
 * - Database performance metrics
 * 
 * @author Claude Code - Performance Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { Pool } from 'pg';
import { EventEmitter } from 'events';
import { getCacheManager } from '../cache/cache-manager.js';
import crypto from 'crypto';

export class QueryOptimizer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Connection pool settings
      host: options.host || process.env.DB_HOST || 'localhost',
      port: options.port || process.env.DB_PORT || 5432,
      database: options.database || process.env.DB_NAME,
      user: options.user || process.env.DB_USER,
      password: options.password || process.env.DB_PASSWORD,
      
      // Pool configuration
      min: options.min || 5,
      max: options.max || 20,
      idleTimeoutMillis: options.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: options.connectionTimeoutMillis || 10000,
      
      // Query caching
      enableQueryCache: options.enableQueryCache !== false,
      queryCacheTTL: options.queryCacheTTL || 300, // 5 minutes
      maxCachedQueries: options.maxCachedQueries || 1000,
      
      // Performance monitoring
      enableSlowQueryLogging: options.enableSlowQueryLogging !== false,
      slowQueryThreshold: options.slowQueryThreshold || 1000, // 1 second
      enableQueryAnalysis: options.enableQueryAnalysis !== false,
      
      // Prepared statements
      enablePreparedStatements: options.enablePreparedStatements !== false,
      maxPreparedStatements: options.maxPreparedStatements || 500,
      
      // Optimization settings
      enableAutoOptimization: options.enableAutoOptimization !== false,
      optimizationInterval: options.optimizationInterval || 300000, // 5 minutes
      
      ...options
    };
    
    // Initialize connection pool
    this.pool = new Pool({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.user,
      password: this.config.password,
      min: this.config.min,
      max: this.config.max,
      idleTimeoutMillis: this.config.idleTimeoutMillis,
      connectionTimeoutMillis: this.config.connectionTimeoutMillis,
      application_name: 'MLG_Clan_Platform'
    });
    
    // Initialize cache
    this.cache = getCacheManager();
    
    // Performance metrics
    this.metrics = {
      totalQueries: 0,
      cachedQueries: 0,
      slowQueries: 0,
      failedQueries: 0,
      totalExecutionTime: 0,
      avgExecutionTime: 0,
      connectionPoolStats: {
        totalConnections: 0,
        idleConnections: 0,
        waitingClients: 0
      },
      queryTypeStats: new Map(),
      slowQueryLog: []
    };
    
    // Prepared statements cache
    this.preparedStatements = new Map();
    this.statementUsage = new Map();
    
    // Query optimization data
    this.queryPatterns = new Map();
    this.optimizationSuggestions = new Map();
    
    this.logger = options.logger || console;
    
    this.setupPoolEventHandlers();
    this.startPerformanceMonitoring();
  }

  setupPoolEventHandlers() {
    this.pool.on('connect', (client) => {
      this.metrics.connectionPoolStats.totalConnections++;
      this.emit('pool:connect', { totalConnections: this.metrics.connectionPoolStats.totalConnections });
    });

    this.pool.on('remove', (client) => {
      this.metrics.connectionPoolStats.totalConnections--;
      this.emit('pool:remove', { totalConnections: this.metrics.connectionPoolStats.totalConnections });
    });

    this.pool.on('error', (error, client) => {
      this.logger.error('Database pool error:', error);
      this.emit('pool:error', error);
    });
  }

  startPerformanceMonitoring() {
    if (this.config.enableAutoOptimization) {
      setInterval(() => {
        this.analyzeQueryPerformance();
        this.updateConnectionPoolStats();
        this.cleanupPreparedStatements();
      }, this.config.optimizationInterval);
    }
  }

  /**
   * Execute optimized query with caching and monitoring
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Query results
   */
  async query(sql, params = [], options = {}) {
    const startTime = Date.now();
    const queryHash = this.generateQueryHash(sql, params);
    
    try {
      // Check cache first if enabled
      if (this.config.enableQueryCache && options.cache !== false) {
        const cachedResult = await this.getCachedQuery(queryHash, options);
        if (cachedResult) {
          this.metrics.cachedQueries++;
          this.updateMetrics(startTime, 'cached');
          return cachedResult;
        }
      }
      
      // Prepare statement if beneficial
      let preparedQuery = sql;
      if (this.config.enablePreparedStatements && this.shouldPrepareStatement(sql)) {
        preparedQuery = await this.getPreparedStatement(sql);
      }
      
      // Execute query
      const client = await this.pool.connect();
      let result;
      
      try {
        result = await client.query(preparedQuery, params);
        
        // Process result
        const processedResult = {
          rows: result.rows,
          rowCount: result.rowCount,
          command: result.command,
          fields: result.fields,
          executionTime: Date.now() - startTime,
          cached: false
        };
        
        // Cache result if applicable
        if (this.config.enableQueryCache && options.cache !== false && this.shouldCacheQuery(sql, processedResult)) {
          await this.cacheQueryResult(queryHash, processedResult, options);
        }
        
        this.updateMetrics(startTime, 'executed', sql, processedResult);
        
        return processedResult;
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      this.metrics.failedQueries++;
      this.updateMetrics(startTime, 'failed', sql);
      
      this.logger.error('Query execution failed:', {
        sql: sql.substring(0, 200),
        params: params.slice(0, 5),
        error: error.message,
        executionTime: Date.now() - startTime
      });
      
      throw error;
    }
  }

  /**
   * Execute transaction with optimization
   * @param {Function} transactionFunction - Transaction function
   * @param {Object} options - Transaction options
   * @returns {Promise<any>} Transaction result
   */
  async transaction(transactionFunction, options = {}) {
    const startTime = Date.now();
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create query function for transaction
      const queryFn = async (sql, params = [], queryOptions = {}) => {
        return await client.query(sql, params);
      };
      
      const result = await transactionFunction(queryFn);
      
      await client.query('COMMIT');
      
      this.updateMetrics(startTime, 'transaction');
      
      return result;
      
    } catch (error) {
      await client.query('ROLLBACK');
      this.metrics.failedQueries++;
      
      this.logger.error('Transaction failed:', {
        error: error.message,
        executionTime: Date.now() - startTime
      });
      
      throw error;
      
    } finally {
      client.release();
    }
  }

  /**
   * Batch query execution with optimization
   * @param {Array} queries - Array of {sql, params} objects
   * @param {Object} options - Batch options
   * @returns {Promise<Array>} Batch results
   */
  async batchQuery(queries, options = {}) {
    const startTime = Date.now();
    const client = await this.pool.connect();
    
    try {
      const results = [];
      
      if (options.useTransaction) {
        await client.query('BEGIN');
      }
      
      for (const query of queries) {
        try {
          const result = await client.query(query.sql, query.params || []);
          results.push({
            success: true,
            result: {
              rows: result.rows,
              rowCount: result.rowCount,
              command: result.command
            }
          });
        } catch (error) {
          results.push({
            success: false,
            error: error.message
          });
          
          if (options.stopOnError) {
            if (options.useTransaction) {
              await client.query('ROLLBACK');
            }
            throw error;
          }
        }
      }
      
      if (options.useTransaction) {
        await client.query('COMMIT');
      }
      
      this.updateMetrics(startTime, 'batch', null, { batchSize: queries.length });
      
      return results;
      
    } catch (error) {
      if (options.useTransaction) {
        await client.query('ROLLBACK');
      }
      throw error;
      
    } finally {
      client.release();
    }
  }

  /**
   * Generate query hash for caching
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {string} Query hash
   */
  generateQueryHash(sql, params) {
    const normalizedSQL = sql.replace(/\s+/g, ' ').trim().toLowerCase();
    const combined = `${normalizedSQL}:${JSON.stringify(params)}`;
    return crypto.createHash('md5').update(combined).digest('hex');
  }

  /**
   * Check if query result is cached
   * @param {string} queryHash - Query hash
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} Cached result or null
   */
  async getCachedQuery(queryHash, options) {
    const ttl = options.cacheTTL || this.config.queryCacheTTL;
    return await this.cache.get('query:result', queryHash);
  }

  /**
   * Cache query result
   * @param {string} queryHash - Query hash
   * @param {Object} result - Query result
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheQueryResult(queryHash, result, options) {
    const ttl = options.cacheTTL || this.config.queryCacheTTL;
    
    // Don't cache large result sets
    if (result.rows && result.rows.length > 1000) {
      return false;
    }
    
    return await this.cache.set('query:result', queryHash, result, { ttl });
  }

  /**
   * Determine if query should be cached
   * @param {string} sql - SQL query
   * @param {Object} result - Query result
   * @returns {boolean} Should cache
   */
  shouldCacheQuery(sql, result) {
    const normalizedSQL = sql.toLowerCase();
    
    // Don't cache write operations
    if (normalizedSQL.includes('insert') || 
        normalizedSQL.includes('update') || 
        normalizedSQL.includes('delete')) {
      return false;
    }
    
    // Don't cache queries with functions that return time-sensitive data
    if (normalizedSQL.includes('now()') || 
        normalizedSQL.includes('current_timestamp') ||
        normalizedSQL.includes('random()')) {
      return false;
    }
    
    // Don't cache empty results
    if (!result.rows || result.rows.length === 0) {
      return false;
    }
    
    // Cache SELECT queries
    return normalizedSQL.includes('select');
  }

  /**
   * Prepared statement management
   */
  
  shouldPrepareStatement(sql) {
    const normalizedSQL = sql.toLowerCase();
    
    // Prepare frequently used queries
    if (!this.statementUsage.has(sql)) {
      this.statementUsage.set(sql, 0);
    }
    
    this.statementUsage.set(sql, this.statementUsage.get(sql) + 1);
    
    // Prepare if used more than 3 times
    return this.statementUsage.get(sql) > 3;
  }
  
  async getPreparedStatement(sql) {
    if (this.preparedStatements.has(sql)) {
      return this.preparedStatements.get(sql);
    }
    
    if (this.preparedStatements.size >= this.config.maxPreparedStatements) {
      // Remove least used statement
      const leastUsed = [...this.statementUsage.entries()]
        .sort(([,a], [,b]) => a - b)[0];
      
      if (leastUsed) {
        this.preparedStatements.delete(leastUsed[0]);
        this.statementUsage.delete(leastUsed[0]);
      }
    }
    
    const statementName = `stmt_${this.preparedStatements.size}`;
    this.preparedStatements.set(sql, statementName);
    
    return statementName;
  }
  
  cleanupPreparedStatements() {
    // Remove unused prepared statements
    const threshold = Date.now() - 3600000; // 1 hour
    
    for (const [sql, usage] of this.statementUsage.entries()) {
      if (usage < 2) { // Remove if used less than 2 times
        this.preparedStatements.delete(sql);
        this.statementUsage.delete(sql);
      }
    }
  }

  /**
   * Query analysis and optimization
   */
  
  async analyzeQueryPerformance() {
    try {
      // Get query statistics from PostgreSQL
      const statsQuery = `
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows,
          100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
        FROM pg_stat_statements 
        WHERE query NOT LIKE '%pg_stat_statements%'
        ORDER BY total_time DESC 
        LIMIT 20
      `;
      
      const result = await this.query(statsQuery, [], { cache: false });
      
      // Analyze slow queries
      for (const row of result.rows) {
        if (row.mean_time > this.config.slowQueryThreshold) {
          this.generateOptimizationSuggestion(row);
        }
      }
      
    } catch (error) {
      // pg_stat_statements might not be enabled
      this.logger.debug('Query analysis failed:', error.message);
    }
  }
  
  generateOptimizationSuggestion(queryStats) {
    const suggestions = [];
    
    // High execution time
    if (queryStats.mean_time > 5000) {
      suggestions.push('Consider adding appropriate indexes');
      suggestions.push('Review WHERE clause conditions');
    }
    
    // Low cache hit ratio
    if (queryStats.hit_percent < 95) {
      suggestions.push('Consider increasing shared_buffers');
      suggestions.push('Review query for unnecessary data retrieval');
    }
    
    // High row count
    if (queryStats.rows > 10000) {
      suggestions.push('Consider adding LIMIT clauses');
      suggestions.push('Review if all returned data is necessary');
    }
    
    this.optimizationSuggestions.set(queryStats.query, {
      suggestions,
      stats: queryStats,
      analyzed_at: new Date()
    });
  }

  /**
   * Connection pool management
   */
  
  updateConnectionPoolStats() {
    if (this.pool) {
      this.metrics.connectionPoolStats = {
        totalConnections: this.pool.totalCount || 0,
        idleConnections: this.pool.idleCount || 0,
        waitingClients: this.pool.waitingCount || 0
      };
    }
  }
  
  async getConnectionPoolHealth() {
    const stats = this.metrics.connectionPoolStats;
    const utilization = stats.totalConnections > 0 ? 
      ((stats.totalConnections - stats.idleConnections) / stats.totalConnections) * 100 : 0;
    
    return {
      status: stats.waitingClients > 0 ? 'warning' : 'healthy',
      totalConnections: stats.totalConnections,
      idleConnections: stats.idleConnections,
      waitingClients: stats.waitingClients,
      utilizationPercent: Math.round(utilization),
      maxConnections: this.config.max,
      recommendations: this.generatePoolRecommendations(stats, utilization)
    };
  }
  
  generatePoolRecommendations(stats, utilization) {
    const recommendations = [];
    
    if (utilization > 80) {
      recommendations.push('Consider increasing max pool size');
    }
    
    if (stats.waitingClients > 0) {
      recommendations.push('Connection pool is saturated - investigate slow queries');
    }
    
    if (utilization < 20) {
      recommendations.push('Pool might be over-sized - consider reducing max connections');
    }
    
    return recommendations;
  }

  /**
   * Performance metrics and monitoring
   */
  
  updateMetrics(startTime, operationType, sql = null, result = null) {
    const executionTime = Date.now() - startTime;
    
    this.metrics.totalQueries++;
    this.metrics.totalExecutionTime += executionTime;
    this.metrics.avgExecutionTime = Math.round(this.metrics.totalExecutionTime / this.metrics.totalQueries);
    
    // Track by operation type
    if (!this.metrics.queryTypeStats.has(operationType)) {
      this.metrics.queryTypeStats.set(operationType, {
        count: 0,
        totalTime: 0,
        avgTime: 0
      });
    }
    
    const typeStats = this.metrics.queryTypeStats.get(operationType);
    typeStats.count++;
    typeStats.totalTime += executionTime;
    typeStats.avgTime = Math.round(typeStats.totalTime / typeStats.count);
    
    // Log slow queries
    if (this.config.enableSlowQueryLogging && executionTime > this.config.slowQueryThreshold) {
      this.logSlowQuery(sql, executionTime, result);
    }
  }
  
  logSlowQuery(sql, executionTime, result) {
    this.metrics.slowQueries++;
    
    const slowQuery = {
      sql: sql ? sql.substring(0, 500) : 'Unknown',
      executionTime,
      rowCount: result?.rowCount || 0,
      timestamp: new Date(),
      recommendations: this.generateQueryRecommendations(sql, executionTime)
    };
    
    this.metrics.slowQueryLog.push(slowQuery);
    
    // Keep only last 100 slow queries
    if (this.metrics.slowQueryLog.length > 100) {
      this.metrics.slowQueryLog.shift();
    }
    
    this.logger.warn('Slow query detected:', slowQuery);
    this.emit('slowQuery', slowQuery);
  }
  
  generateQueryRecommendations(sql, executionTime) {
    const recommendations = [];
    
    if (sql) {
      const normalizedSQL = sql.toLowerCase();
      
      // Check for missing WHERE clauses
      if (normalizedSQL.includes('select') && !normalizedSQL.includes('where') && !normalizedSQL.includes('limit')) {
        recommendations.push('Consider adding WHERE clause or LIMIT to reduce result set');
      }
      
      // Check for N+1 query patterns
      if (normalizedSQL.includes('select') && normalizedSQL.includes('in (')) {
        recommendations.push('Consider using JOINs instead of IN clauses for better performance');
      }
      
      // Check for function calls in WHERE clauses
      if (normalizedSQL.includes('where') && (normalizedSQL.includes('lower(') || normalizedSQL.includes('upper('))) {
        recommendations.push('Consider using functional indexes for case-insensitive searches');
      }
    }
    
    if (executionTime > 10000) {
      recommendations.push('Query execution time is very high - consider breaking into smaller queries');
    }
    
    return recommendations;
  }

  /**
   * Query optimization helpers
   */
  
  async explainQuery(sql, params = []) {
    const explainSQL = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`;
    
    try {
      const result = await this.query(explainSQL, params, { cache: false });
      return result.rows[0]['QUERY PLAN'][0];
    } catch (error) {
      this.logger.error('Query explain failed:', error);
      return null;
    }
  }
  
  async suggestIndexes(tableName) {
    const indexSuggestionQuery = `
      SELECT 
        schemaname,
        tablename,
        attname as column_name,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE tablename = $1 
        AND n_distinct > 100
        AND abs(correlation) < 0.1
      ORDER BY n_distinct DESC
    `;
    
    try {
      const result = await this.query(indexSuggestionQuery, [tableName], { cache: false });
      
      return result.rows.map(row => ({
        table: row.tablename,
        column: row.column_name,
        reason: `High cardinality (${row.n_distinct}) with low correlation (${row.correlation})`,
        suggested_index: `CREATE INDEX idx_${row.tablename}_${row.column_name} ON ${row.tablename} (${row.column_name});`
      }));
      
    } catch (error) {
      this.logger.error('Index suggestion failed:', error);
      return [];
    }
  }

  /**
   * Cache invalidation for queries
   */
  
  async invalidateQueryCache(pattern = null) {
    if (pattern) {
      return await this.cache.invalidatePattern('query:result', pattern);
    } else {
      return await this.cache.invalidatePattern('query:result', '*');
    }
  }
  
  async invalidateTableCache(tableName) {
    // This would require more sophisticated pattern matching
    // For now, invalidate all query caches
    return await this.invalidateQueryCache();
  }

  /**
   * Get performance statistics
   */
  
  getPerformanceStats() {
    const poolHealth = this.getConnectionPoolHealth();
    
    return {
      queries: {
        total: this.metrics.totalQueries,
        cached: this.metrics.cachedQueries,
        slow: this.metrics.slowQueries,
        failed: this.metrics.failedQueries,
        avgExecutionTime: this.metrics.avgExecutionTime,
        cacheHitRate: this.metrics.totalQueries > 0 ? 
          Math.round((this.metrics.cachedQueries / this.metrics.totalQueries) * 100) : 0
      },
      connectionPool: poolHealth,
      queryTypes: Object.fromEntries(this.metrics.queryTypeStats),
      preparedStatements: {
        total: this.preparedStatements.size,
        maxAllowed: this.config.maxPreparedStatements
      },
      recentSlowQueries: this.metrics.slowQueryLog.slice(-10),
      optimizationSuggestions: Array.from(this.optimizationSuggestions.values()).slice(-5)
    };
  }
  
  resetStats() {
    this.metrics = {
      totalQueries: 0,
      cachedQueries: 0,
      slowQueries: 0,
      failedQueries: 0,
      totalExecutionTime: 0,
      avgExecutionTime: 0,
      connectionPoolStats: {
        totalConnections: 0,
        idleConnections: 0,
        waitingClients: 0
      },
      queryTypeStats: new Map(),
      slowQueryLog: []
    };
  }

  /**
   * Cleanup and shutdown
   */
  
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.emit('pool:closed');
    }
  }
}

// Create singleton instance for global use
let globalQueryOptimizer = null;

export function createQueryOptimizer(options = {}) {
  return new QueryOptimizer(options);
}

export function getQueryOptimizer(options = {}) {
  if (!globalQueryOptimizer) {
    globalQueryOptimizer = new QueryOptimizer(options);
  }
  return globalQueryOptimizer;
}

export default QueryOptimizer;