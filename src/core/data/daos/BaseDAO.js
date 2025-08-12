/**
 * Base Data Access Object (DAO) for MLG.clan Platform
 * 
 * Provides common database operations, query building, validation,
 * and performance monitoring for all data access objects.
 * 
 * Features:
 * - Generic CRUD operations
 * - Query building utilities
 * - Performance monitoring
 * - Error handling and logging
 * - Cache integration
 * - Transaction support
 * - Pagination utilities
 * - Data validation
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';

/**
 * Base DAO class providing common database operations
 */
export class BaseDAO {
  constructor(options = {}) {
    this.tableName = options.tableName;
    this.primaryKey = options.primaryKey || 'id';
    this.schema = options.schema;
    this.db = options.db; // PostgreSQL connection
    this.redis = options.redis; // Redis cache
    this.logger = options.logger || console;
    
    // Performance monitoring
    this.queryCount = 0;
    this.errorCount = 0;
    this.totalQueryTime = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    
    // Validation schemas
    this.createSchema = options.createSchema;
    this.updateSchema = options.updateSchema;
    
    // Cache settings
    this.cacheEnabled = options.cacheEnabled || false;
    this.cacheTTL = options.cacheTTL || 300; // 5 minutes default
    this.cacheKeyPrefix = options.cacheKeyPrefix || this.tableName;
  }

  /**
   * Generic find by ID operation
   * @param {string} id - Record ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Record or null
   */
  async findById(id, options = {}) {
    const startTime = Date.now();
    const cacheKey = `${this.cacheKeyPrefix}:${id}`;
    
    try {
      // Check cache first
      if (this.cacheEnabled && this.redis) {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          this.cacheHits++;
          return JSON.parse(cached);
        }
        this.cacheMisses++;
      }

      // Build query
      const selectFields = options.fields ? options.fields.join(', ') : '*';
      const includeDeleted = options.includeDeleted || false;
      
      let query = `SELECT ${selectFields} FROM ${this.tableName} WHERE ${this.primaryKey} = $1`;
      const params = [id];
      
      // Add soft delete filter
      if (!includeDeleted && this.hasSoftDelete()) {
        query += ' AND deleted_at IS NULL';
      }
      
      // Add custom conditions
      if (options.conditions) {
        const { clause, values } = this.buildWhereClause(options.conditions, 2);
        query += ` AND ${clause}`;
        params.push(...values);
      }

      const result = await this.executeQuery(query, params);
      const record = result.rows[0] || null;

      // Cache the result
      if (record && this.cacheEnabled && this.redis) {
        await this.redis.setEx(cacheKey, this.cacheTTL, JSON.stringify(record));
      }

      this.trackQueryPerformance(startTime, 'findById');
      return record;

    } catch (error) {
      this.handleError('findById', error, { id, options });
      throw error;
    }
  }

  /**
   * Generic find many operation with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Results with pagination info
   */
  async findMany(options = {}) {
    const startTime = Date.now();
    
    try {
      const {
        fields = ['*'],
        conditions = {},
        orderBy = [[this.primaryKey, 'DESC']],
        limit = 50,
        offset = 0,
        includeDeleted = false
      } = options;

      // Build SELECT clause
      const selectFields = Array.isArray(fields) ? fields.join(', ') : fields;
      
      // Build base query
      let query = `SELECT ${selectFields} FROM ${this.tableName}`;
      const params = [];
      let paramIndex = 1;

      // Build WHERE clause
      const whereConditions = [];
      
      // Soft delete filter
      if (!includeDeleted && this.hasSoftDelete()) {
        whereConditions.push('deleted_at IS NULL');
      }
      
      // Custom conditions
      if (Object.keys(conditions).length > 0) {
        const { clause, values } = this.buildWhereClause(conditions, paramIndex);
        whereConditions.push(clause);
        params.push(...values);
        paramIndex += values.length;
      }
      
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      // Build ORDER BY clause
      if (orderBy.length > 0) {
        const orderClauses = orderBy.map(([field, direction]) => 
          `${field} ${direction.toUpperCase()}`
        );
        query += ` ORDER BY ${orderClauses.join(', ')}`;
      }

      // Add pagination
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      // Execute main query
      const result = await this.executeQuery(query, params);
      
      // Get total count for pagination
      let countQuery = `SELECT COUNT(*) as total FROM ${this.tableName}`;
      const countParams = [];
      let countParamIndex = 1;
      
      const countWhereConditions = [];
      if (!includeDeleted && this.hasSoftDelete()) {
        countWhereConditions.push('deleted_at IS NULL');
      }
      
      if (Object.keys(conditions).length > 0) {
        const { clause, values } = this.buildWhereClause(conditions, countParamIndex);
        countWhereConditions.push(clause);
        countParams.push(...values);
      }
      
      if (countWhereConditions.length > 0) {
        countQuery += ` WHERE ${countWhereConditions.join(' AND ')}`;
      }

      const countResult = await this.executeQuery(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      this.trackQueryPerformance(startTime, 'findMany');
      
      return {
        data: result.rows,
        pagination: {
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit),
          currentPage: Math.floor(offset / limit) + 1,
          hasNext: offset + limit < total,
          hasPrev: offset > 0
        }
      };

    } catch (error) {
      this.handleError('findMany', error, options);
      throw error;
    }
  }

  /**
   * Generic create operation
   * @param {Object} data - Data to insert
   * @param {Object} options - Create options
   * @returns {Promise<Object>} Created record
   */
  async create(data, options = {}) {
    const startTime = Date.now();
    
    try {
      // Validate data
      if (this.createSchema) {
        const { error, value } = this.createSchema.validate(data);
        if (error) {
          throw new Error(`Validation error: ${error.message}`);
        }
        data = value;
      }

      // Add system fields
      const now = new Date();
      const createData = {
        ...data,
        id: data.id || uuidv4(),
        created_at: now,
        updated_at: now
      };

      // Build INSERT query
      const fields = Object.keys(createData);
      const values = Object.values(createData);
      const placeholders = values.map((_, index) => `$${index + 1}`);
      
      const query = `
        INSERT INTO ${this.tableName} (${fields.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `;

      const result = await this.executeQuery(query, values);
      const record = result.rows[0];

      // Invalidate cache
      if (this.cacheEnabled && this.redis) {
        await this.invalidateCache(record[this.primaryKey]);
      }

      this.trackQueryPerformance(startTime, 'create');
      
      // Emit event
      this.emitEvent('created', record);
      
      return record;

    } catch (error) {
      this.handleError('create', error, { data, options });
      throw error;
    }
  }

  /**
   * Generic update operation
   * @param {string} id - Record ID
   * @param {Object} data - Data to update
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated record
   */
  async update(id, data, options = {}) {
    const startTime = Date.now();
    
    try {
      // Validate data
      if (this.updateSchema) {
        const { error, value } = this.updateSchema.validate(data);
        if (error) {
          throw new Error(`Validation error: ${error.message}`);
        }
        data = value;
      }

      // Add updated_at timestamp
      const updateData = {
        ...data,
        updated_at: new Date()
      };

      // Build UPDATE query
      const fields = Object.keys(updateData);
      const values = Object.values(updateData);
      const setClause = fields.map((field, index) => 
        `${field} = $${index + 1}`
      ).join(', ');

      let query = `
        UPDATE ${this.tableName} 
        SET ${setClause}
        WHERE ${this.primaryKey} = $${fields.length + 1}
      `;
      
      const params = [...values, id];
      
      // Add soft delete filter
      if (!options.includeDeleted && this.hasSoftDelete()) {
        query += ' AND deleted_at IS NULL';
      }
      
      query += ' RETURNING *';

      const result = await this.executeQuery(query, params);
      
      if (result.rows.length === 0) {
        throw new Error(`Record with ${this.primaryKey} ${id} not found`);
      }
      
      const record = result.rows[0];

      // Update cache
      if (this.cacheEnabled && this.redis) {
        const cacheKey = `${this.cacheKeyPrefix}:${id}`;
        await this.redis.setEx(cacheKey, this.cacheTTL, JSON.stringify(record));
      }

      this.trackQueryPerformance(startTime, 'update');
      
      // Emit event
      this.emitEvent('updated', record, data);
      
      return record;

    } catch (error) {
      this.handleError('update', error, { id, data, options });
      throw error;
    }
  }

  /**
   * Generic delete operation (soft or hard delete)
   * @param {string} id - Record ID
   * @param {Object} options - Delete options
   * @returns {Promise<boolean>} Success status
   */
  async delete(id, options = {}) {
    const startTime = Date.now();
    
    try {
      const { soft = true } = options;

      let query;
      let params;

      if (soft && this.hasSoftDelete()) {
        // Soft delete
        query = `
          UPDATE ${this.tableName} 
          SET deleted_at = NOW(), updated_at = NOW()
          WHERE ${this.primaryKey} = $1 AND deleted_at IS NULL
          RETURNING *
        `;
        params = [id];
      } else {
        // Hard delete
        query = `
          DELETE FROM ${this.tableName} 
          WHERE ${this.primaryKey} = $1
          RETURNING *
        `;
        params = [id];
      }

      const result = await this.executeQuery(query, params);
      
      if (result.rows.length === 0) {
        throw new Error(`Record with ${this.primaryKey} ${id} not found`);
      }
      
      const record = result.rows[0];

      // Remove from cache
      if (this.cacheEnabled && this.redis) {
        await this.invalidateCache(id);
      }

      this.trackQueryPerformance(startTime, 'delete');
      
      // Emit event
      this.emitEvent('deleted', record, { soft });
      
      return true;

    } catch (error) {
      this.handleError('delete', error, { id, options });
      throw error;
    }
  }

  /**
   * Execute a raw query with performance tracking
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Query result
   */
  async executeQuery(query, params = []) {
    const startTime = Date.now();
    
    try {
      this.queryCount++;
      
      if (!this.db) {
        throw new Error('Database connection not available');
      }

      const result = await this.db.query(query, params);
      
      const queryTime = Date.now() - startTime;
      this.totalQueryTime += queryTime;
      
      // Log slow queries
      if (queryTime > 1000) {
        this.logger.warn(`Slow query detected (${queryTime}ms):`, {
          query: query.substring(0, 100) + '...',
          params: params.length > 0 ? '[PARAMS]' : [],
          table: this.tableName
        });
      }
      
      return result;
      
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  /**
   * Execute operation within a transaction
   * @param {Function} callback - Transaction callback
   * @returns {Promise<any>} Transaction result
   */
  async executeTransaction(callback) {
    if (!this.db || !this.db.connect) {
      throw new Error('Transaction support requires PostgreSQL pool');
    }

    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create a temporary DAO instance with the transaction client
      const txDAO = Object.create(this);
      txDAO.db = client;
      
      const result = await callback(txDAO);
      
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
   * Build WHERE clause from conditions object
   * @param {Object} conditions - Conditions object
   * @param {number} startIndex - Parameter start index
   * @returns {Object} Clause and values
   */
  buildWhereClause(conditions, startIndex = 1) {
    const clauses = [];
    const values = [];
    let paramIndex = startIndex;

    for (const [key, value] of Object.entries(conditions)) {
      if (value === null) {
        clauses.push(`${key} IS NULL`);
      } else if (value === undefined) {
        continue;
      } else if (Array.isArray(value)) {
        if (value.length === 0) continue;
        const placeholders = value.map(() => `$${paramIndex++}`);
        clauses.push(`${key} IN (${placeholders.join(', ')})`);
        values.push(...value);
      } else if (typeof value === 'object' && value.operator) {
        // Handle complex operators like { operator: 'LIKE', value: '%test%' }
        clauses.push(`${key} ${value.operator} $${paramIndex++}`);
        values.push(value.value);
      } else {
        clauses.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    }

    return {
      clause: clauses.join(' AND '),
      values
    };
  }

  /**
   * Check if table supports soft delete
   * @returns {boolean} True if soft delete is supported
   */
  hasSoftDelete() {
    // Override in subclasses or configure via options
    return false;
  }

  /**
   * Invalidate cache for a record
   * @param {string} id - Record ID
   */
  async invalidateCache(id) {
    if (!this.redis) return;
    
    const cacheKey = `${this.cacheKeyPrefix}:${id}`;
    await this.redis.del(cacheKey);
    
    // Also invalidate any related cache patterns
    const pattern = `${this.cacheKeyPrefix}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  /**
   * Track query performance
   * @param {number} startTime - Query start time
   * @param {string} operation - Operation name
   */
  trackQueryPerformance(startTime, operation) {
    const duration = Date.now() - startTime;
    
    if (this.logger && duration > 500) {
      this.logger.debug(`DAO Performance: ${this.tableName}.${operation} took ${duration}ms`);
    }
  }

  /**
   * Handle and log errors
   * @param {string} operation - Operation name
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   */
  handleError(operation, error, context = {}) {
    this.errorCount++;
    
    this.logger.error(`DAO Error in ${this.tableName}.${operation}:`, {
      error: error.message,
      stack: error.stack,
      context,
      tableName: this.tableName,
      operation
    });
  }

  /**
   * Emit data events (override in subclasses for event handling)
   * @param {string} event - Event type
   * @param {Object} record - Record data
   * @param {Object} metadata - Additional metadata
   */
  emitEvent(event, record, metadata = {}) {
    // Base implementation - override in subclasses
    if (this.logger) {
      this.logger.debug(`DAO Event: ${this.tableName}.${event}`, {
        recordId: record[this.primaryKey],
        metadata
      });
    }
  }

  /**
   * Get performance statistics
   * @returns {Object} Performance stats
   */
  getStats() {
    return {
      tableName: this.tableName,
      queryCount: this.queryCount,
      errorCount: this.errorCount,
      avgQueryTime: this.queryCount > 0 ? Math.round(this.totalQueryTime / this.queryCount) : 0,
      totalQueryTime: this.totalQueryTime,
      errorRate: this.queryCount > 0 ? (this.errorCount / this.queryCount) * 100 : 0,
      cache: {
        enabled: this.cacheEnabled,
        hits: this.cacheHits,
        misses: this.cacheMisses,
        hitRate: (this.cacheHits + this.cacheMisses) > 0 
          ? (this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100 
          : 0
      }
    };
  }

  /**
   * Reset performance counters
   */
  resetStats() {
    this.queryCount = 0;
    this.errorCount = 0;
    this.totalQueryTime = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}

/**
 * DAO Factory for creating DAO instances
 */
export class DAOFactory {
  constructor(dbManager, redisClient, logger) {
    this.dbManager = dbManager;
    this.redisClient = redisClient;
    this.logger = logger;
    this.daos = new Map();
  }

  /**
   * Create or get DAO instance
   * @param {string} name - DAO name
   * @param {Object} options - DAO options
   * @returns {BaseDAO} DAO instance
   */
  getDAO(name, options = {}) {
    if (!this.daos.has(name)) {
      const dao = new BaseDAO({
        ...options,
        db: this.dbManager.postgresql.pool,
        redis: this.redisClient,
        logger: this.logger
      });
      
      this.daos.set(name, dao);
    }
    
    return this.daos.get(name);
  }

  /**
   * Get all DAO performance statistics
   * @returns {Object} Combined stats
   */
  getAllStats() {
    const stats = {};
    
    for (const [name, dao] of this.daos) {
      stats[name] = dao.getStats();
    }
    
    return stats;
  }

  /**
   * Reset all DAO statistics
   */
  resetAllStats() {
    for (const dao of this.daos.values()) {
      dao.resetStats();
    }
  }
}

export default BaseDAO;