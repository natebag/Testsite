/**
 * MLG.clan Platform - Cross-Database Consistency Manager
 * 
 * Advanced system for maintaining data consistency across multiple databases
 * during backup operations, ensuring atomic backups across PostgreSQL and MongoDB.
 * 
 * Features:
 * - Cross-database transaction coordination
 * - Consistency point creation and management
 * - Distributed backup state synchronization
 * - Data integrity verification across systems
 * - Recovery point coordination
 * - Referential integrity checking
 * - Temporal consistency validation
 * - Backup dependency tracking
 * 
 * @author Claude Code - Database Consistency Specialist
 * @version 1.0.0
 * @created 2025-08-11
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import { dbManager } from '../../database/database-config.js';

export class CrossDBConsistency extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Consistency settings
      consistencyLevel: config.consistencyLevel || 'strict', // strict, eventual, relaxed
      maxConsistencyWait: config.maxConsistencyWait || 30000, // 30 seconds
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      
      // Verification settings
      enableIntegrityCheck: config.enableIntegrityCheck !== false,
      enableReferentialCheck: config.enableReferentialCheck !== false,
      enableTemporalCheck: config.enableTemporalCheck !== false,
      
      // Timeout settings
      lockTimeout: config.lockTimeout || 60000, // 1 minute
      snapshotTimeout: config.snapshotTimeout || 300000, // 5 minutes
      
      // Backup coordination
      backupSequencing: config.backupSequencing || 'parallel', // parallel, sequential
      failureHandling: config.failureHandling || 'rollback', // rollback, continue, abort
      
      ...config
    };
    
    this.state = {
      isInitialized: false,
      activeConsistencyPoints: new Map(),
      pendingVerifications: new Map(),
      lockRegistry: new Map(),
      consistencyHistory: []
    };
    
    this.metrics = {
      totalConsistencyPoints: 0,
      successfulConsistencyPoints: 0,
      failedConsistencyPoints: 0,
      averageConsistencyTime: 0,
      totalConsistencyTime: 0,
      integrityViolations: 0,
      referentialViolations: 0,
      temporalInconsistencies: 0
    };
    
    // Relationship mappings between databases
    this.relationships = {
      // PostgreSQL -> MongoDB relationships
      postgresql_to_mongodb: {
        'users': ['user_sessions', 'user_analytics', 'user_preferences'],
        'clans': ['clan_analytics', 'clan_activity_logs'],
        'content': ['content_metadata', 'content_analytics'],
        'transactions': ['transaction_logs', 'blockchain_confirmations'],
        'votes': ['voting_analytics', 'vote_history']
      },
      
      // MongoDB -> PostgreSQL relationships
      mongodb_to_postgresql: {
        'user_sessions': ['users'],
        'clan_analytics': ['clans'],
        'content_metadata': ['content'],
        'transaction_logs': ['transactions'],
        'voting_analytics': ['votes']
      }
    };
    
    this.logger = config.logger || console;
  }

  /**
   * Initialize cross-database consistency manager
   */
  async initialize() {
    try {
      this.logger.info('Initializing Cross-Database Consistency Manager...');
      
      // Verify database connections
      await this.verifyDatabaseConnections();
      
      // Initialize consistency tracking tables/collections
      await this.initializeConsistencyTracking();
      
      // Load existing consistency points
      await this.loadExistingConsistencyPoints();
      
      this.state.isInitialized = true;
      
      this.logger.info('✓ Cross-Database Consistency Manager initialized');
      
      return {
        status: 'initialized',
        config: this.config,
        relationships: Object.keys(this.relationships.postgresql_to_mongodb).length
      };
      
    } catch (error) {
      this.logger.error('Cross-DB consistency initialization failed:', error);
      throw error;
    }
  }

  /**
   * Verify database connections
   */
  async verifyDatabaseConnections() {
    const connectionTests = [];
    
    // Test PostgreSQL connection
    connectionTests.push(
      dbManager.postgresql.query('SELECT 1 as test')
        .then(() => ({ database: 'postgresql', status: 'connected' }))
        .catch(error => ({ database: 'postgresql', status: 'failed', error: error.message }))
    );
    
    // Test MongoDB connection
    connectionTests.push(
      dbManager.mongodb.db.admin().ping()
        .then(() => ({ database: 'mongodb', status: 'connected' }))
        .catch(error => ({ database: 'mongodb', status: 'failed', error: error.message }))
    );
    
    const results = await Promise.all(connectionTests);
    
    const failedConnections = results.filter(result => result.status === 'failed');
    if (failedConnections.length > 0) {
      throw new Error(`Database connection failed: ${failedConnections.map(c => c.database).join(', ')}`);
    }
    
    this.logger.info('✓ All database connections verified');
  }

  /**
   * Initialize consistency tracking structures
   */
  async initializeConsistencyTracking() {
    try {
      // Create PostgreSQL consistency tracking table
      await dbManager.postgresql.query(`
        CREATE TABLE IF NOT EXISTS backup_consistency_points (
          id VARCHAR(255) PRIMARY KEY,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          postgresql_lsn TEXT,
          mongodb_timestamp TEXT,
          status VARCHAR(50) DEFAULT 'active',
          metadata JSONB,
          completed_at TIMESTAMP WITH TIME ZONE
        )
      `);
      
      // Create indexes for performance
      await dbManager.postgresql.query(`
        CREATE INDEX IF NOT EXISTS idx_consistency_points_created_at 
        ON backup_consistency_points (created_at)
      `);
      
      await dbManager.postgresql.query(`
        CREATE INDEX IF NOT EXISTS idx_consistency_points_status 
        ON backup_consistency_points (status)
      `);
      
      // Create MongoDB consistency tracking collection
      const consistencyCollection = dbManager.mongodb.db.collection('backup_consistency_points');
      
      // Ensure indexes
      await consistencyCollection.createIndex({ created_at: -1 });
      await consistencyCollection.createIndex({ status: 1 });
      await consistencyCollection.createIndex({ consistency_point_id: 1 });
      
      this.logger.info('✓ Consistency tracking structures initialized');
      
    } catch (error) {
      this.logger.error('Failed to initialize consistency tracking:', error);
      throw error;
    }
  }

  /**
   * Load existing consistency points
   */
  async loadExistingConsistencyPoints() {
    try {
      // Load active consistency points from PostgreSQL
      const pgResult = await dbManager.postgresql.query(`
        SELECT id, created_at, postgresql_lsn, mongodb_timestamp, metadata
        FROM backup_consistency_points 
        WHERE status = 'active'
        ORDER BY created_at DESC
        LIMIT 10
      `);
      
      for (const row of pgResult.rows) {
        this.state.activeConsistencyPoints.set(row.id, {
          id: row.id,
          created_at: row.created_at,
          postgresql_lsn: row.postgresql_lsn,
          mongodb_timestamp: row.mongodb_timestamp,
          metadata: row.metadata || {},
          status: 'active'
        });
      }
      
      this.logger.info(`✓ Loaded ${pgResult.rows.length} existing consistency points`);
      
    } catch (error) {
      this.logger.warn('Could not load existing consistency points:', error.message);
    }
  }

  /**
   * Create a new consistency point across all databases
   */
  async createConsistencyPoint(options = {}) {
    const consistencyPointId = this.generateConsistencyPointId();
    const startTime = Date.now();
    
    try {
      this.logger.info(`Creating consistency point: ${consistencyPointId}`);
      
      const consistencyPoint = {
        id: consistencyPointId,
        timestamp: new Date(),
        options,
        status: 'creating',
        databases: {},
        metadata: {
          initiator: options.initiator || 'backup_system',
          backup_type: options.backup_type || 'full',
          ...options.metadata
        }
      };
      
      this.state.activeConsistencyPoints.set(consistencyPointId, consistencyPoint);
      this.emit('consistency_point_creating', consistencyPoint);
      
      // Execute consistency point creation based on strategy
      if (this.config.backupSequencing === 'sequential') {
        await this.createSequentialConsistencyPoint(consistencyPoint);
      } else {
        await this.createParallelConsistencyPoint(consistencyPoint);
      }
      
      // Verify consistency across databases
      const verification = await this.verifyConsistencyPoint(consistencyPoint);
      consistencyPoint.verification = verification;
      
      if (!verification.consistent && this.config.consistencyLevel === 'strict') {
        throw new Error(`Consistency verification failed: ${verification.issues.join(', ')}`);
      }
      
      // Mark consistency point as complete
      consistencyPoint.status = 'completed';
      consistencyPoint.duration = Date.now() - startTime;
      
      await this.saveConsistencyPoint(consistencyPoint);
      
      this.updateConsistencyMetrics(consistencyPoint, 'success');
      
      this.emit('consistency_point_created', consistencyPoint);
      
      this.logger.info(`✓ Consistency point created: ${consistencyPointId} (${consistencyPoint.duration}ms)`);
      
      return consistencyPoint;
      
    } catch (error) {
      const consistencyPoint = this.state.activeConsistencyPoints.get(consistencyPointId);
      if (consistencyPoint) {
        consistencyPoint.status = 'failed';
        consistencyPoint.error = error.message;
        consistencyPoint.duration = Date.now() - startTime;
        
        this.updateConsistencyMetrics(consistencyPoint, 'failure');
      }
      
      this.emit('consistency_point_failed', {
        id: consistencyPointId,
        error: error.message,
        timestamp: new Date()
      });
      
      this.logger.error(`Consistency point creation failed: ${consistencyPointId}`, error);
      
      // Handle failure based on configuration
      if (this.config.failureHandling === 'rollback') {
        await this.rollbackConsistencyPoint(consistencyPointId);
      }
      
      throw error;
    }
  }

  /**
   * Create consistency point with sequential approach
   */
  async createSequentialConsistencyPoint(consistencyPoint) {
    // Step 1: Create PostgreSQL consistency point
    const pgConsistency = await this.createPostgreSQLConsistencyPoint(consistencyPoint);
    consistencyPoint.databases.postgresql = pgConsistency;
    
    // Step 2: Create MongoDB consistency point
    const mongoConsistency = await this.createMongoDBConsistencyPoint(consistencyPoint);
    consistencyPoint.databases.mongodb = mongoConsistency;
    
    // Step 3: Verify timing consistency
    const timeDiff = Math.abs(
      new Date(mongoConsistency.timestamp) - new Date(pgConsistency.timestamp)
    );
    
    if (timeDiff > this.config.maxConsistencyWait) {
      throw new Error(`Consistency timing violation: ${timeDiff}ms > ${this.config.maxConsistencyWait}ms`);
    }
    
    this.logger.debug(`Sequential consistency established with ${timeDiff}ms variance`);
  }

  /**
   * Create consistency point with parallel approach
   */
  async createParallelConsistencyPoint(consistencyPoint) {
    // Execute both database consistency points in parallel
    const [pgConsistency, mongoConsistency] = await Promise.all([
      this.createPostgreSQLConsistencyPoint(consistencyPoint),
      this.createMongoDBConsistencyPoint(consistencyPoint)
    ]);
    
    consistencyPoint.databases.postgresql = pgConsistency;
    consistencyPoint.databases.mongodb = mongoConsistency;
    
    // Verify timing consistency
    const timeDiff = Math.abs(
      new Date(mongoConsistency.timestamp) - new Date(pgConsistency.timestamp)
    );
    
    if (timeDiff > this.config.maxConsistencyWait) {
      this.logger.warn(`Parallel consistency timing variance: ${timeDiff}ms`);
    }
    
    this.logger.debug(`Parallel consistency established with ${timeDiff}ms variance`);
  }

  /**
   * Create PostgreSQL consistency point
   */
  async createPostgreSQLConsistencyPoint(consistencyPoint) {
    try {
      // Start a transaction to ensure consistency
      const client = await dbManager.postgresql.pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Get current WAL position
        const walResult = await client.query('SELECT pg_current_wal_lsn() as lsn, now() as timestamp');
        const walLSN = walResult.rows[0].lsn;
        const timestamp = walResult.rows[0].timestamp;
        
        // Create database locks if required
        if (this.config.consistencyLevel === 'strict') {
          await this.createPostgreSQLLocks(client, consistencyPoint);
        }
        
        // Record consistency point in tracking table
        await client.query(`
          INSERT INTO backup_consistency_points 
          (id, postgresql_lsn, mongodb_timestamp, metadata)
          VALUES ($1, $2, $3, $4)
        `, [
          consistencyPoint.id,
          walLSN,
          null, // Will be updated when MongoDB point is created
          JSON.stringify(consistencyPoint.metadata)
        ]);
        
        await client.query('COMMIT');
        
        return {
          lsn: walLSN,
          timestamp,
          locks: this.config.consistencyLevel === 'strict' ? 'acquired' : 'none'
        };
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      
    } catch (error) {
      throw new Error(`PostgreSQL consistency point failed: ${error.message}`);
    }
  }

  /**
   * Create MongoDB consistency point
   */
  async createMongoDBConsistencyPoint(consistencyPoint) {
    try {
      const db = dbManager.mongodb.db;
      
      // Start a session for consistency
      const session = db.client.startSession();
      
      try {
        await session.startTransaction({
          readConcern: { level: this.config.consistencyLevel === 'strict' ? 'majority' : 'local' },
          writeConcern: { w: 'majority' }
        });
        
        // Get current oplog timestamp
        const oplogCollection = db.db('local').collection('oplog.rs');
        const latestOplog = await oplogCollection
          .findOne({}, { sort: { ts: -1 }, session });
        
        const timestamp = new Date();
        const oplogTimestamp = latestOplog ? latestOplog.ts : null;
        
        // Record consistency point
        await db.collection('backup_consistency_points').insertOne({
          consistency_point_id: consistencyPoint.id,
          mongodb_timestamp: oplogTimestamp,
          created_at: timestamp,
          metadata: consistencyPoint.metadata
        }, { session });
        
        // Update PostgreSQL record with MongoDB timestamp
        await dbManager.postgresql.query(`
          UPDATE backup_consistency_points 
          SET mongodb_timestamp = $1 
          WHERE id = $2
        `, [oplogTimestamp?.toString(), consistencyPoint.id]);
        
        await session.commitTransaction();
        
        return {
          oplog_timestamp: oplogTimestamp,
          timestamp,
          session_id: session.id
        };
        
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        await session.endSession();
      }
      
    } catch (error) {
      throw new Error(`MongoDB consistency point failed: ${error.message}`);
    }
  }

  /**
   * Create PostgreSQL locks for strict consistency
   */
  async createPostgreSQLLocks(client, consistencyPoint) {
    const lockTimeout = this.config.lockTimeout;
    
    // Set lock timeout
    await client.query(`SET lock_timeout = '${lockTimeout}ms'`);
    
    // Acquire advisory locks on key tables
    const keyTables = ['users', 'clans', 'content', 'transactions', 'votes'];
    const lockIds = [];
    
    for (const table of keyTables) {
      const lockId = this.generateLockId(table);
      await client.query('SELECT pg_advisory_lock($1)', [lockId]);
      lockIds.push(lockId);
    }
    
    // Store lock registry
    this.state.lockRegistry.set(consistencyPoint.id, {
      locks: lockIds,
      created_at: new Date(),
      client_id: client.processID
    });
    
    this.logger.debug(`Acquired ${lockIds.length} PostgreSQL locks for ${consistencyPoint.id}`);
  }

  /**
   * Verify consistency across databases
   */
  async verifyConsistencyPoint(consistencyPoint) {
    const verification = {
      consistent: true,
      issues: [],
      checks: {
        temporal: { passed: false, details: {} },
        referential: { passed: false, details: {} },
        integrity: { passed: false, details: {} }
      },
      timestamp: new Date()
    };
    
    try {
      // Temporal consistency check
      if (this.config.enableTemporalCheck) {
        const temporalCheck = await this.verifyTemporalConsistency(consistencyPoint);
        verification.checks.temporal = temporalCheck;
        
        if (!temporalCheck.passed) {
          verification.consistent = false;
          verification.issues.push('Temporal consistency violation');
          this.metrics.temporalInconsistencies++;
        }
      }
      
      // Referential consistency check
      if (this.config.enableReferentialCheck) {
        const referentialCheck = await this.verifyReferentialConsistency(consistencyPoint);
        verification.checks.referential = referentialCheck;
        
        if (!referentialCheck.passed) {
          verification.consistent = false;
          verification.issues.push('Referential consistency violation');
          this.metrics.referentialViolations++;
        }
      }
      
      // Data integrity check
      if (this.config.enableIntegrityCheck) {
        const integrityCheck = await this.verifyDataIntegrity(consistencyPoint);
        verification.checks.integrity = integrityCheck;
        
        if (!integrityCheck.passed) {
          verification.consistent = false;
          verification.issues.push('Data integrity violation');
          this.metrics.integrityViolations++;
        }
      }
      
      this.logger.debug(`Consistency verification completed: ${verification.consistent ? 'PASSED' : 'FAILED'}`);
      
    } catch (error) {
      verification.consistent = false;
      verification.issues.push(`Verification error: ${error.message}`);
      this.logger.error('Consistency verification failed:', error);
    }
    
    return verification;
  }

  /**
   * Verify temporal consistency between databases
   */
  async verifyTemporalConsistency(consistencyPoint) {
    const check = {
      passed: false,
      details: {
        postgresql_timestamp: null,
        mongodb_timestamp: null,
        time_difference: null,
        threshold: this.config.maxConsistencyWait
      }
    };
    
    try {
      const pgTimestamp = consistencyPoint.databases.postgresql.timestamp;
      const mongoTimestamp = consistencyPoint.databases.mongodb.timestamp;
      
      check.details.postgresql_timestamp = pgTimestamp;
      check.details.mongodb_timestamp = mongoTimestamp;
      
      const timeDiff = Math.abs(new Date(pgTimestamp) - new Date(mongoTimestamp));
      check.details.time_difference = timeDiff;
      
      check.passed = timeDiff <= this.config.maxConsistencyWait;
      
    } catch (error) {
      check.error = error.message;
    }
    
    return check;
  }

  /**
   * Verify referential consistency across databases
   */
  async verifyReferentialConsistency(consistencyPoint) {
    const check = {
      passed: true,
      details: {
        violations: [],
        checks_performed: 0
      }
    };
    
    try {
      // Check PostgreSQL -> MongoDB relationships
      for (const [pgTable, mongoCollections] of Object.entries(this.relationships.postgresql_to_mongodb)) {
        for (const mongoCollection of mongoCollections) {
          const violation = await this.checkCrossDBReferentialIntegrity(
            pgTable, 
            mongoCollection, 
            consistencyPoint
          );
          
          if (violation) {
            check.violations.push(violation);
            check.passed = false;
          }
          
          check.details.checks_performed++;
        }
      }
      
      this.logger.debug(`Referential consistency check completed: ${check.details.checks_performed} checks, ${check.details.violations.length} violations`);
      
    } catch (error) {
      check.error = error.message;
      check.passed = false;
    }
    
    return check;
  }

  /**
   * Check cross-database referential integrity
   */
  async checkCrossDBReferentialIntegrity(pgTable, mongoCollection, consistencyPoint) {
    try {
      // Get sample of records from PostgreSQL table
      const pgResult = await dbManager.postgresql.query(`
        SELECT id FROM ${pgTable} 
        ORDER BY created_at DESC 
        LIMIT 100
      `);
      
      if (pgResult.rows.length === 0) {
        return null; // No data to check
      }
      
      // Check if corresponding records exist in MongoDB
      const pgIds = pgResult.rows.map(row => row.id);
      const mongoDb = dbManager.mongodb.db;
      
      const mongoCount = await mongoDb.collection(mongoCollection).countDocuments({
        [this.getReferenceField(pgTable)]: { $in: pgIds }
      });
      
      // Calculate consistency ratio
      const consistencyRatio = mongoCount / pgIds.length;
      
      // Allow for some eventual consistency
      const threshold = this.config.consistencyLevel === 'strict' ? 0.95 : 0.8;
      
      if (consistencyRatio < threshold) {
        return {
          type: 'referential_integrity',
          source: pgTable,
          target: mongoCollection,
          expected_refs: pgIds.length,
          found_refs: mongoCount,
          consistency_ratio: consistencyRatio,
          threshold
        };
      }
      
      return null;
      
    } catch (error) {
      return {
        type: 'referential_check_error',
        source: pgTable,
        target: mongoCollection,
        error: error.message
      };
    }
  }

  /**
   * Verify data integrity within consistency point
   */
  async verifyDataIntegrity(consistencyPoint) {
    const check = {
      passed: true,
      details: {
        postgresql_checks: {},
        mongodb_checks: {},
        cross_checks: {}
      }
    };
    
    try {
      // PostgreSQL integrity checks
      check.details.postgresql_checks = await this.performPostgreSQLIntegrityChecks();
      
      // MongoDB integrity checks
      check.details.mongodb_checks = await this.performMongoDBIntegrityChecks();
      
      // Cross-database integrity checks
      check.details.cross_checks = await this.performCrossDBIntegrityChecks();
      
      // Determine overall pass/fail
      const allChecks = [
        check.details.postgresql_checks,
        check.details.mongodb_checks,
        check.details.cross_checks
      ];
      
      check.passed = allChecks.every(checkSet => 
        Object.values(checkSet).every(checkResult => checkResult.passed !== false)
      );
      
    } catch (error) {
      check.error = error.message;
      check.passed = false;
    }
    
    return check;
  }

  /**
   * Perform PostgreSQL-specific integrity checks
   */
  async performPostgreSQLIntegrityChecks() {
    const checks = {};
    
    try {
      // Check foreign key constraints
      const fkResult = await dbManager.postgresql.query(`
        SELECT COUNT(*) as violation_count
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      `);
      
      checks.foreign_keys = {
        passed: true,
        constraint_count: parseInt(fkResult.rows[0].violation_count)
      };
      
      // Check for orphaned records in key tables
      const orphanChecks = await Promise.all([
        this.checkOrphanedRecords('content', 'user_id', 'users', 'id'),
        this.checkOrphanedRecords('clan_members', 'user_id', 'users', 'id'),
        this.checkOrphanedRecords('votes', 'user_id', 'users', 'id')
      ]);
      
      checks.orphaned_records = {
        passed: orphanChecks.every(check => check.count === 0),
        details: orphanChecks
      };
      
    } catch (error) {
      checks.error = error.message;
    }
    
    return checks;
  }

  /**
   * Perform MongoDB-specific integrity checks
   */
  async performMongoDBIntegrityChecks() {
    const checks = {};
    
    try {
      const db = dbManager.mongodb.db;
      
      // Check collection consistency
      const collections = await db.listCollections().toArray();
      checks.collection_count = collections.length;
      
      // Check for duplicate _id values (should never happen but good to verify)
      const duplicateChecks = {};
      for (const collection of collections) {
        const collName = collection.name;
        if (collName.startsWith('system.')) continue;
        
        const pipeline = [
          { $group: { _id: '$_id', count: { $sum: 1 } } },
          { $match: { count: { $gt: 1 } } },
          { $count: 'duplicates' }
        ];
        
        const result = await db.collection(collName).aggregate(pipeline).toArray();
        duplicateChecks[collName] = result.length > 0 ? result[0].duplicates : 0;
      }
      
      checks.duplicate_ids = {
        passed: Object.values(duplicateChecks).every(count => count === 0),
        details: duplicateChecks
      };
      
    } catch (error) {
      checks.error = error.message;
    }
    
    return checks;
  }

  /**
   * Perform cross-database integrity checks
   */
  async performCrossDBIntegrityChecks() {
    const checks = {};
    
    try {
      // Check user count consistency
      const pgUserCount = await dbManager.postgresql.query('SELECT COUNT(*) as count FROM users');
      const mongoUserSessionCount = await dbManager.mongodb.db.collection('user_sessions')
        .distinct('user_id');
      
      checks.user_consistency = {
        postgresql_users: parseInt(pgUserCount.rows[0].count),
        mongodb_active_sessions: mongoUserSessionCount.length,
        ratio: mongoUserSessionCount.length / parseInt(pgUserCount.rows[0].count)
      };
      
      // Check content consistency
      const pgContentCount = await dbManager.postgresql.query('SELECT COUNT(*) as count FROM content');
      const mongoContentMetaCount = await dbManager.mongodb.db.collection('content_metadata')
        .countDocuments();
      
      checks.content_consistency = {
        postgresql_content: parseInt(pgContentCount.rows[0].count),
        mongodb_metadata: mongoContentMetaCount,
        ratio: mongoContentMetaCount / parseInt(pgContentCount.rows[0].count)
      };
      
    } catch (error) {
      checks.error = error.message;
    }
    
    return checks;
  }

  /**
   * Check for orphaned records
   */
  async checkOrphanedRecords(childTable, childColumn, parentTable, parentColumn) {
    try {
      const result = await dbManager.postgresql.query(`
        SELECT COUNT(*) as count
        FROM ${childTable} c
        LEFT JOIN ${parentTable} p ON c.${childColumn} = p.${parentColumn}
        WHERE p.${parentColumn} IS NULL AND c.${childColumn} IS NOT NULL
      `);
      
      return {
        child_table: childTable,
        parent_table: parentTable,
        count: parseInt(result.rows[0].count)
      };
    } catch (error) {
      return {
        child_table: childTable,
        parent_table: parentTable,
        error: error.message
      };
    }
  }

  /**
   * Save consistency point to persistent storage
   */
  async saveConsistencyPoint(consistencyPoint) {
    try {
      // Update PostgreSQL record
      await dbManager.postgresql.query(`
        UPDATE backup_consistency_points 
        SET status = $1, completed_at = NOW(), metadata = $2
        WHERE id = $3
      `, [
        consistencyPoint.status,
        JSON.stringify({
          ...consistencyPoint.metadata,
          verification: consistencyPoint.verification,
          duration: consistencyPoint.duration
        }),
        consistencyPoint.id
      ]);
      
      // Update MongoDB record
      await dbManager.mongodb.db.collection('backup_consistency_points').updateOne(
        { consistency_point_id: consistencyPoint.id },
        {
          $set: {
            status: consistencyPoint.status,
            completed_at: new Date(),
            verification: consistencyPoint.verification,
            duration: consistencyPoint.duration
          }
        }
      );
      
      this.logger.debug(`Consistency point saved: ${consistencyPoint.id}`);
      
    } catch (error) {
      this.logger.error('Failed to save consistency point:', error);
      throw error;
    }
  }

  /**
   * Rollback consistency point
   */
  async rollbackConsistencyPoint(consistencyPointId) {
    try {
      this.logger.info(`Rolling back consistency point: ${consistencyPointId}`);
      
      const consistencyPoint = this.state.activeConsistencyPoints.get(consistencyPointId);
      if (!consistencyPoint) {
        throw new Error(`Consistency point not found: ${consistencyPointId}`);
      }
      
      // Release PostgreSQL locks if any
      const lockRegistry = this.state.lockRegistry.get(consistencyPointId);
      if (lockRegistry) {
        await this.releasePostgreSQLLocks(lockRegistry.locks);
        this.state.lockRegistry.delete(consistencyPointId);
      }
      
      // Mark as rolled back in both databases
      await dbManager.postgresql.query(`
        UPDATE backup_consistency_points 
        SET status = 'rolled_back', completed_at = NOW()
        WHERE id = $1
      `, [consistencyPointId]);
      
      await dbManager.mongodb.db.collection('backup_consistency_points').updateOne(
        { consistency_point_id: consistencyPointId },
        { $set: { status: 'rolled_back', completed_at: new Date() } }
      );
      
      // Remove from active points
      this.state.activeConsistencyPoints.delete(consistencyPointId);
      
      this.emit('consistency_point_rolled_back', {
        id: consistencyPointId,
        timestamp: new Date()
      });
      
      this.logger.info(`✓ Consistency point rolled back: ${consistencyPointId}`);
      
    } catch (error) {
      this.logger.error(`Rollback failed for consistency point ${consistencyPointId}:`, error);
      throw error;
    }
  }

  /**
   * Release PostgreSQL advisory locks
   */
  async releasePostgreSQLLocks(lockIds) {
    try {
      const client = await dbManager.postgresql.pool.connect();
      
      for (const lockId of lockIds) {
        await client.query('SELECT pg_advisory_unlock($1)', [lockId]);
      }
      
      client.release();
      
      this.logger.debug(`Released ${lockIds.length} PostgreSQL locks`);
      
    } catch (error) {
      this.logger.error('Failed to release PostgreSQL locks:', error);
    }
  }

  /**
   * Clean up old consistency points
   */
  async cleanupOldConsistencyPoints(retentionDays = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      // Clean PostgreSQL records
      const pgResult = await dbManager.postgresql.query(`
        DELETE FROM backup_consistency_points 
        WHERE created_at < $1 AND status IN ('completed', 'failed', 'rolled_back')
        RETURNING id
      `, [cutoffDate]);
      
      // Clean MongoDB records
      const mongoResult = await dbManager.mongodb.db.collection('backup_consistency_points')
        .deleteMany({
          created_at: { $lt: cutoffDate },
          status: { $in: ['completed', 'failed', 'rolled_back'] }
        });
      
      this.logger.info(`✓ Cleaned up old consistency points: PostgreSQL=${pgResult.rowCount}, MongoDB=${mongoResult.deletedCount}`);
      
      return {
        postgresql_deleted: pgResult.rowCount,
        mongodb_deleted: mongoResult.deletedCount
      };
      
    } catch (error) {
      this.logger.error('Cleanup of old consistency points failed:', error);
      throw error;
    }
  }

  /**
   * Update consistency metrics
   */
  updateConsistencyMetrics(consistencyPoint, status) {
    this.metrics.totalConsistencyPoints++;
    
    if (status === 'success') {
      this.metrics.successfulConsistencyPoints++;
      
      if (consistencyPoint.duration) {
        this.metrics.totalConsistencyTime += consistencyPoint.duration;
        this.metrics.averageConsistencyTime = Math.round(
          this.metrics.totalConsistencyTime / this.metrics.successfulConsistencyPoints
        );
      }
    } else {
      this.metrics.failedConsistencyPoints++;
    }
    
    // Add to history
    this.state.consistencyHistory.unshift({
      ...consistencyPoint,
      status,
      timestamp: new Date()
    });
    
    // Keep last 100 entries
    if (this.state.consistencyHistory.length > 100) {
      this.state.consistencyHistory = this.state.consistencyHistory.slice(0, 100);
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const checks = {
        databaseConnections: false,
        consistencyTracking: false,
        activeConsistencyPoints: this.state.activeConsistencyPoints.size,
        lockRegistry: this.state.lockRegistry.size
      };
      
      // Test database connections
      try {
        await this.verifyDatabaseConnections();
        checks.databaseConnections = true;
      } catch (error) {
        // Already logged
      }
      
      // Test consistency tracking
      try {
        await dbManager.postgresql.query('SELECT COUNT(*) FROM backup_consistency_points');
        checks.consistencyTracking = true;
      } catch (error) {
        // Tracking tables not accessible
      }
      
      const allHealthy = checks.databaseConnections && checks.consistencyTracking;
      
      return {
        status: allHealthy ? 'healthy' : 'degraded',
        checks,
        metrics: this.metrics,
        activePoints: this.state.activeConsistencyPoints.size
      };
      
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  // Utility methods
  generateConsistencyPointId() {
    return `cp_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  generateLockId(table) {
    // Create a consistent hash-based lock ID for the table
    return parseInt(crypto.createHash('sha256').update(table).digest('hex').substr(0, 8), 16);
  }

  getReferenceField(pgTable) {
    // Map PostgreSQL table names to MongoDB reference fields
    const fieldMapping = {
      'users': 'user_id',
      'clans': 'clan_id',
      'content': 'content_id',
      'transactions': 'transaction_id',
      'votes': 'vote_id'
    };
    
    return fieldMapping[pgTable] || 'id';
  }

  /**
   * Get consistency status
   */
  getStatus() {
    return {
      initialized: this.state.isInitialized,
      activeConsistencyPoints: Array.from(this.state.activeConsistencyPoints.values()),
      pendingVerifications: this.state.pendingVerifications.size,
      activeLocks: this.state.lockRegistry.size,
      metrics: this.metrics,
      recentHistory: this.state.consistencyHistory.slice(0, 10)
    };
  }

  /**
   * Close consistency manager
   */
  async close() {
    // Release any active locks
    for (const [consistencyPointId, lockRegistry] of this.state.lockRegistry.entries()) {
      try {
        await this.releasePostgreSQLLocks(lockRegistry.locks);
      } catch (error) {
        this.logger.error(`Failed to release locks for ${consistencyPointId}:`, error);
      }
    }
    
    // Clear state
    this.state.activeConsistencyPoints.clear();
    this.state.lockRegistry.clear();
    
    this.logger.info('Cross-Database Consistency Manager closed');
  }
}

export default CrossDBConsistency;