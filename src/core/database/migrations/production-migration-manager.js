/**
 * Production Database Migration Manager
 * Safe, rollback-capable database migration system for production environment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import environmentManager from '../../config/environment-manager.js';
import productionLogger from '../../logging/production-logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProductionMigrationManager {
  constructor() {
    this.dbConfig = environmentManager.get('database');
    this.migrationsDir = path.join(__dirname);
    this.logger = productionLogger.createChildLogger({ feature: 'database', action: 'migration' });
    this.pool = null;
    this.isProduction = environmentManager.isProduction();
  }

  /**
   * Initialize database connection pool
   */
  async initialize() {
    try {
      this.pool = new pg.Pool({
        connectionString: this.dbConfig.url,
        min: this.dbConfig.poolMin,
        max: this.dbConfig.poolMax,
        connectionTimeoutMillis: this.dbConfig.connectionTimeout,
        statementTimeout: this.dbConfig.statementTimeout,
        ssl: this.dbConfig.sslMode === 'require' ? { rejectUnauthorized: false } : false
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.logger.logInfo('Database connection pool initialized for migrations');
    } catch (error) {
      this.logger.logError(error, { action: 'initialize_connection' });
      throw error;
    }
  }

  /**
   * Create migration tracking table if it doesn't exist
   */
  async createMigrationTable() {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create migration tracking table
      await client.query(`
        CREATE TABLE IF NOT EXISTS migration_history (
          id SERIAL PRIMARY KEY,
          migration_name VARCHAR(255) NOT NULL UNIQUE,
          checksum VARCHAR(64) NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          execution_time_ms INTEGER,
          rollback_sql TEXT,
          status VARCHAR(20) DEFAULT 'completed',
          git_commit VARCHAR(40),
          environment VARCHAR(20),
          executed_by VARCHAR(100)
        );
        
        CREATE INDEX IF NOT EXISTS idx_migration_history_name ON migration_history(migration_name);
        CREATE INDEX IF NOT EXISTS idx_migration_history_executed_at ON migration_history(executed_at);
      `);
      
      // Create migration locks table for concurrent execution protection
      await client.query(`
        CREATE TABLE IF NOT EXISTS migration_locks (
          lock_name VARCHAR(100) PRIMARY KEY,
          locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          locked_by VARCHAR(100),
          process_id INTEGER
        );
      `);
      
      await client.query('COMMIT');
      this.logger.logInfo('Migration tracking tables created');
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.logError(error, { action: 'create_migration_table' });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get pending migrations
   */
  async getPendingMigrations() {
    try {
      // Get all migration files
      const migrationFiles = fs.readdirSync(this.migrationsDir)
        .filter(file => file.match(/^\d{3}_.*\.sql$/))
        .sort();

      // Get executed migrations
      const client = await this.pool.connect();
      const result = await client.query(
        'SELECT migration_name FROM migration_history WHERE status = $1',
        ['completed']
      );
      client.release();

      const executedMigrations = new Set(result.rows.map(row => row.migration_name));
      
      // Filter pending migrations
      const pendingMigrations = migrationFiles.filter(file => {
        const migrationName = path.basename(file, '.sql');
        return !executedMigrations.has(migrationName);
      });

      this.logger.logInfo('Pending migrations identified', {
        total_migrations: migrationFiles.length,
        executed_migrations: executedMigrations.size,
        pending_migrations: pendingMigrations.length,
        pending_list: pendingMigrations
      });

      return pendingMigrations;
    } catch (error) {
      this.logger.logError(error, { action: 'get_pending_migrations' });
      throw error;
    }
  }

  /**
   * Calculate migration checksum
   */
  calculateChecksum(content) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Acquire migration lock
   */
  async acquireLock(lockName = 'migration_execution') {
    const client = await this.pool.connect();
    
    try {
      const processId = process.pid;
      const lockedBy = `${process.env.USER || 'unknown'}@${require('os').hostname()}`;
      
      // Try to acquire lock
      await client.query(`
        INSERT INTO migration_locks (lock_name, locked_by, process_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (lock_name) DO NOTHING
      `, [lockName, lockedBy, processId]);
      
      // Check if we got the lock
      const result = await client.query(
        'SELECT locked_by, process_id FROM migration_locks WHERE lock_name = $1',
        [lockName]
      );
      
      if (result.rows.length === 0 || result.rows[0].process_id !== processId) {
        throw new Error(`Migration lock already held by ${result.rows[0]?.locked_by}`);
      }
      
      this.logger.logInfo('Migration lock acquired', { lock_name: lockName, process_id: processId });
      return lockName;
    } catch (error) {
      this.logger.logError(error, { action: 'acquire_lock', lock_name: lockName });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Release migration lock
   */
  async releaseLock(lockName = 'migration_execution') {
    const client = await this.pool.connect();
    
    try {
      await client.query(
        'DELETE FROM migration_locks WHERE lock_name = $1 AND process_id = $2',
        [lockName, process.pid]
      );
      
      this.logger.logInfo('Migration lock released', { lock_name: lockName });
    } catch (error) {
      this.logger.logError(error, { action: 'release_lock', lock_name: lockName });
    } finally {
      client.release();
    }
  }

  /**
   * Execute a single migration
   */
  async executeMigration(migrationFile) {
    const migrationName = path.basename(migrationFile, '.sql');
    const migrationPath = path.join(this.migrationsDir, migrationFile);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    const checksum = this.calculateChecksum(migrationSql);
    const startTime = Date.now();
    
    this.logger.logInfo('Starting migration execution', {
      migration_name: migrationName,
      checksum: checksum.substring(0, 8)
    });

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create savepoint for rollback capability
      await client.query('SAVEPOINT migration_start');
      
      // Execute migration SQL
      const migrationResult = await client.query(migrationSql);
      
      // Record migration execution
      const executionTime = Date.now() - startTime;
      await client.query(`
        INSERT INTO migration_history (
          migration_name, 
          checksum, 
          execution_time_ms, 
          git_commit, 
          environment, 
          executed_by
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        migrationName,
        checksum,
        executionTime,
        process.env.GIT_COMMIT || 'unknown',
        environmentManager.get('NODE_ENV'),
        process.env.USER || 'unknown'
      ]);
      
      await client.query('COMMIT');
      
      this.logger.logInfo('Migration completed successfully', {
        migration_name: migrationName,
        execution_time_ms: executionTime,
        affected_rows: migrationResult.rowCount
      });

      return {
        name: migrationName,
        success: true,
        executionTime,
        checksum
      };
    } catch (error) {
      await client.query('ROLLBACK TO SAVEPOINT migration_start');
      await client.query('ROLLBACK');
      
      // Record failed migration
      try {
        await client.query(`
          INSERT INTO migration_history (
            migration_name, 
            checksum, 
            execution_time_ms, 
            status, 
            git_commit, 
            environment, 
            executed_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          migrationName,
          checksum,
          Date.now() - startTime,
          'failed',
          process.env.GIT_COMMIT || 'unknown',
          environmentManager.get('NODE_ENV'),
          process.env.USER || 'unknown'
        ]);
      } catch (recordError) {
        this.logger.logError(recordError, { action: 'record_failed_migration' });
      }
      
      this.logger.logError(error, {
        migration_name: migrationName,
        action: 'execute_migration'
      });
      
      throw new Error(`Migration ${migrationName} failed: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(options = {}) {
    const { dryRun = false, targetMigration = null } = options;
    
    try {
      await this.initialize();
      await this.createMigrationTable();
      
      if (!dryRun) {
        await this.acquireLock();
      }
      
      const pendingMigrations = await this.getPendingMigrations();
      
      if (pendingMigrations.length === 0) {
        this.logger.logInfo('No pending migrations found');
        return { success: true, migrationsRun: 0 };
      }

      // Filter migrations if target specified
      let migrationsToRun = pendingMigrations;
      if (targetMigration) {
        const targetIndex = pendingMigrations.findIndex(m => 
          path.basename(m, '.sql') === targetMigration
        );
        if (targetIndex === -1) {
          throw new Error(`Target migration not found: ${targetMigration}`);
        }
        migrationsToRun = pendingMigrations.slice(0, targetIndex + 1);
      }

      this.logger.logInfo('Starting migration batch', {
        total_migrations: migrationsToRun.length,
        dry_run: dryRun,
        target_migration: targetMigration
      });

      if (dryRun) {
        this.logger.logInfo('DRY RUN - The following migrations would be executed:', {
          migrations: migrationsToRun
        });
        return { success: true, migrationsRun: 0, dryRun: true };
      }

      // Execute migrations in order
      const results = [];
      for (const migration of migrationsToRun) {
        try {
          const result = await this.executeMigration(migration);
          results.push(result);
        } catch (error) {
          this.logger.logError(error, {
            action: 'migration_batch_failed',
            failed_migration: migration,
            completed_migrations: results.length
          });
          
          // In production, stop on first failure for safety
          if (this.isProduction) {
            throw error;
          } else {
            results.push({ name: migration, success: false, error: error.message });
          }
        }
      }

      const successfulMigrations = results.filter(r => r.success).length;
      const failedMigrations = results.filter(r => !r.success).length;

      this.logger.logInfo('Migration batch completed', {
        total_attempted: results.length,
        successful: successfulMigrations,
        failed: failedMigrations,
        total_execution_time: results.reduce((sum, r) => sum + (r.executionTime || 0), 0)
      });

      return {
        success: failedMigrations === 0,
        migrationsRun: successfulMigrations,
        results
      };
    } catch (error) {
      this.logger.logError(error, { action: 'run_migrations' });
      throw error;
    } finally {
      if (!dryRun) {
        await this.releaseLock();
      }
    }
  }

  /**
   * Rollback migrations
   */
  async rollbackMigrations(options = {}) {
    const { steps = 1, targetMigration = null } = options;
    
    try {
      await this.initialize();
      await this.acquireLock('migration_rollback');
      
      // Get migration history in reverse order
      const client = await this.pool.connect();
      const result = await client.query(`
        SELECT migration_name, rollback_sql, executed_at
        FROM migration_history 
        WHERE status = 'completed'
        ORDER BY executed_at DESC
        LIMIT $1
      `, [steps]);
      client.release();

      if (result.rows.length === 0) {
        this.logger.logInfo('No migrations to rollback');
        return { success: true, rolledBack: 0 };
      }

      const migrationsToRollback = result.rows;
      
      this.logger.logInfo('Starting migration rollback', {
        migrations_to_rollback: migrationsToRollback.length,
        target_migration: targetMigration
      });

      // Execute rollbacks
      const rollbackResults = [];
      for (const migration of migrationsToRollback) {
        if (!migration.rollback_sql) {
          this.logger.logWarning('No rollback SQL available for migration', {
            migration_name: migration.migration_name
          });
          continue;
        }

        try {
          await this.executeRollback(migration);
          rollbackResults.push({ name: migration.migration_name, success: true });
        } catch (error) {
          this.logger.logError(error, {
            action: 'rollback_failed',
            migration_name: migration.migration_name
          });
          rollbackResults.push({ 
            name: migration.migration_name, 
            success: false, 
            error: error.message 
          });
          
          // Stop on first rollback failure
          break;
        }
      }

      const successfulRollbacks = rollbackResults.filter(r => r.success).length;

      this.logger.logInfo('Migration rollback completed', {
        attempted: rollbackResults.length,
        successful: successfulRollbacks,
        failed: rollbackResults.length - successfulRollbacks
      });

      return {
        success: successfulRollbacks === rollbackResults.length,
        rolledBack: successfulRollbacks,
        results: rollbackResults
      };
    } catch (error) {
      this.logger.logError(error, { action: 'rollback_migrations' });
      throw error;
    } finally {
      await this.releaseLock('migration_rollback');
    }
  }

  /**
   * Execute rollback for a single migration
   */
  async executeRollback(migration) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Execute rollback SQL
      await client.query(migration.rollback_sql);
      
      // Mark migration as rolled back
      await client.query(`
        UPDATE migration_history 
        SET status = 'rolled_back' 
        WHERE migration_name = $1
      `, [migration.migration_name]);
      
      await client.query('COMMIT');
      
      this.logger.logInfo('Migration rolled back successfully', {
        migration_name: migration.migration_name
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus() {
    try {
      await this.initialize();
      
      const client = await this.pool.connect();
      
      // Get migration summary
      const summaryResult = await client.query(`
        SELECT 
          status,
          COUNT(*) as count,
          MIN(executed_at) as first_execution,
          MAX(executed_at) as last_execution
        FROM migration_history 
        GROUP BY status
      `);
      
      // Get recent migrations
      const recentResult = await client.query(`
        SELECT 
          migration_name,
          status,
          executed_at,
          execution_time_ms,
          environment
        FROM migration_history 
        ORDER BY executed_at DESC 
        LIMIT 10
      `);
      
      client.release();
      
      return {
        summary: summaryResult.rows,
        recent_migrations: recentResult.rows,
        database_url: this.dbConfig.url.replace(/\/\/.*@/, '//***@'), // Hide credentials
        environment: environmentManager.get('NODE_ENV')
      };
    } catch (error) {
      this.logger.logError(error, { action: 'get_migration_status' });
      throw error;
    }
  }

  /**
   * Validate migration integrity
   */
  async validateMigrationIntegrity() {
    try {
      const client = await this.pool.connect();
      
      // Get all executed migrations
      const result = await client.query(`
        SELECT migration_name, checksum 
        FROM migration_history 
        WHERE status = 'completed'
        ORDER BY migration_name
      `);
      
      client.release();
      
      const validationResults = [];
      
      for (const row of result.rows) {
        const migrationFile = `${row.migration_name}.sql`;
        const migrationPath = path.join(this.migrationsDir, migrationFile);
        
        if (!fs.existsSync(migrationPath)) {
          validationResults.push({
            migration: row.migration_name,
            status: 'missing_file',
            valid: false
          });
          continue;
        }
        
        const currentContent = fs.readFileSync(migrationPath, 'utf8');
        const currentChecksum = this.calculateChecksum(currentContent);
        
        validationResults.push({
          migration: row.migration_name,
          status: currentChecksum === row.checksum ? 'valid' : 'checksum_mismatch',
          valid: currentChecksum === row.checksum,
          stored_checksum: row.checksum,
          current_checksum: currentChecksum
        });
      }
      
      const validMigrations = validationResults.filter(r => r.valid).length;
      const invalidMigrations = validationResults.filter(r => !r.valid).length;
      
      this.logger.logInfo('Migration integrity validation completed', {
        total_migrations: validationResults.length,
        valid_migrations: validMigrations,
        invalid_migrations: invalidMigrations
      });
      
      return {
        valid: invalidMigrations === 0,
        total: validationResults.length,
        valid_count: validMigrations,
        invalid_count: invalidMigrations,
        results: validationResults
      };
    } catch (error) {
      this.logger.logError(error, { action: 'validate_migration_integrity' });
      throw error;
    }
  }

  /**
   * Close database connections
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.logger.logInfo('Database connection pool closed');
    }
  }
}

export default ProductionMigrationManager;
export { ProductionMigrationManager };