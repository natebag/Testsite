/**
 * MLG.clan Platform - PostgreSQL Backup Management System
 * 
 * Advanced PostgreSQL backup system with support for full dumps, incremental backups,
 * WAL archiving, point-in-time recovery, and automated backup validation.
 * 
 * Features:
 * - Full database dumps using pg_dump
 * - Write-Ahead Logging (WAL) archiving for PITR
 * - Incremental backup strategies
 * - Backup compression and encryption
 * - Parallel backup processing
 * - Backup validation and integrity checks
 * - Custom backup retention policies
 * - Performance optimized operations
 * 
 * @author Claude Code - Database Backup Specialist
 * @version 1.0.0
 * @created 2025-08-11
 */

import { EventEmitter } from 'events';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import zlib from 'zlib';
import { pipeline } from 'stream/promises';
import { dbManager } from '../../database/database-config.js';

const execAsync = promisify(exec);

export class PostgreSQLBackup extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Database connection settings (from database config)
      host: config.host || process.env.POSTGRES_HOST || 'localhost',
      port: config.port || process.env.POSTGRES_PORT || 5432,
      database: config.database || process.env.POSTGRES_DATABASE || 'mlg_clan',
      username: config.username || process.env.POSTGRES_USER || 'postgres',
      password: config.password || process.env.POSTGRES_PASSWORD,
      
      // Backup storage settings
      backupDir: config.backupDir || path.join(config.backupRoot || '/var/backups/mlg-clan', 'postgresql'),
      walArchiveDir: config.walArchiveDir || path.join(config.backupRoot || '/var/backups/mlg-clan', 'postgresql', 'wal'),
      
      // Backup options
      compression: config.compression !== false,
      compressionLevel: config.compressionLevel || 6,
      encryption: config.encryption || false,
      encryptionKey: config.encryptionKey || process.env.BACKUP_ENCRYPTION_KEY,
      
      // Performance settings
      parallelJobs: config.parallelJobs || 4,
      maxConnections: config.maxConnections || 10,
      timeout: config.timeout || 3600000, // 1 hour
      
      // WAL settings
      walSegmentSize: config.walSegmentSize || 16777216, // 16MB
      walKeepSegments: config.walKeepSegments || 100,
      walRetentionDays: config.walRetentionDays || 7,
      
      // Backup validation
      validateBackups: config.validateBackups !== false,
      testRestoreEnabled: config.testRestoreEnabled || false,
      
      // Custom settings
      customDumpOptions: config.customDumpOptions || [],
      excludeTables: config.excludeTables || [],
      includeTables: config.includeTables || [],
      
      ...config
    };
    
    this.state = {
      isInitialized: false,
      activeBackups: new Map(),
      walArchiving: false,
      lastFullBackup: null,
      lastWALArchive: null,
      backupHistory: []
    };
    
    this.metrics = {
      totalBackups: 0,
      successfulBackups: 0,
      failedBackups: 0,
      totalBackupSize: 0,
      averageBackupTime: 0,
      totalBackupTime: 0,
      walArchiveCount: 0,
      walArchiveErrors: 0
    };
    
    this.logger = config.logger || console;
  }

  /**
   * Initialize PostgreSQL backup system
   */
  async initialize() {
    try {
      this.logger.info('Initializing PostgreSQL backup system...');
      
      // Create backup directories
      await this.createBackupDirectories();
      
      // Verify PostgreSQL tools are available
      await this.verifyPostgreSQLTools();
      
      // Test database connection
      await this.testDatabaseConnection();
      
      // Setup WAL archiving if enabled
      if (this.config.walArchiving) {
        await this.setupWALArchiving();
      }
      
      this.state.isInitialized = true;
      
      this.logger.info('✓ PostgreSQL backup system initialized');
      
      return {
        status: 'initialized',
        config: this.config,
        walArchiving: this.state.walArchiving
      };
      
    } catch (error) {
      this.logger.error('PostgreSQL backup initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create backup directories
   */
  async createBackupDirectories() {
    const directories = [
      this.config.backupDir,
      this.config.walArchiveDir,
      path.join(this.config.backupDir, 'full'),
      path.join(this.config.backupDir, 'incremental'),
      path.join(this.config.backupDir, 'metadata'),
      path.join(this.config.backupDir, 'logs')
    ];
    
    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
    
    this.logger.debug('Created PostgreSQL backup directories');
  }

  /**
   * Verify PostgreSQL tools availability
   */
  async verifyPostgreSQLTools() {
    const tools = ['pg_dump', 'pg_basebackup', 'pg_receivewal'];
    
    for (const tool of tools) {
      try {
        await execAsync(`which ${tool}`);
      } catch (error) {
        throw new Error(`PostgreSQL tool not found: ${tool}. Please install PostgreSQL client tools.`);
      }
    }
    
    // Check versions
    const { stdout: pgDumpVersion } = await execAsync('pg_dump --version');
    this.logger.info(`PostgreSQL tools verified: ${pgDumpVersion.trim()}`);
  }

  /**
   * Test database connection
   */
  async testDatabaseConnection() {
    try {
      const client = await dbManager.postgresql.pool.connect();
      const result = await client.query('SELECT version(), now() as current_time');
      client.release();
      
      this.logger.info('✓ PostgreSQL connection test successful');
      this.logger.debug(`Database version: ${result.rows[0].version.split(' ')[1]}`);
      
      return true;
      
    } catch (error) {
      throw new Error(`PostgreSQL connection test failed: ${error.message}`);
    }
  }

  /**
   * Setup WAL archiving
   */
  async setupWALArchiving() {
    try {
      // Check if WAL archiving is already configured
      const client = await dbManager.postgresql.pool.connect();
      const result = await client.query(`
        SELECT name, setting, context 
        FROM pg_settings 
        WHERE name IN ('archive_mode', 'archive_command', 'wal_level')
      `);
      client.release();
      
      const settings = {};
      result.rows.forEach(row => {
        settings[row.name] = row.setting;
      });
      
      // Validate WAL configuration
      if (settings.archive_mode !== 'on') {
        this.logger.warn('WAL archiving not enabled in PostgreSQL configuration');
        return;
      }
      
      if (settings.wal_level === 'minimal') {
        this.logger.warn('WAL level is minimal - streaming replication and archiving may not work');
        return;
      }
      
      this.state.walArchiving = true;
      this.logger.info('✓ WAL archiving is configured and enabled');
      
      // Start WAL streaming if configured
      if (this.config.walStreaming) {
        await this.startWALStreaming();
      }
      
    } catch (error) {
      this.logger.error('WAL archiving setup failed:', error);
      // Don't throw - WAL archiving is optional
    }
  }

  /**
   * Create full database backup
   */
  async createFullBackup(context = {}) {
    const backupId = context.id || this.generateBackupId('full');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `mlg_clan_full_${timestamp}.sql`;
    const backupPath = path.join(this.config.backupDir, 'full', backupFilename);
    
    try {
      this.logger.info(`Starting PostgreSQL full backup: ${backupId}`);
      
      const backupInfo = {
        id: backupId,
        type: 'full',
        timestamp: new Date(),
        database: this.config.database,
        path: backupPath,
        status: 'running'
      };
      
      this.state.activeBackups.set(backupId, backupInfo);
      this.emit('backup_started', backupInfo);
      
      // Build pg_dump command
      const dumpArgs = this.buildDumpCommand(backupPath, 'full');
      
      // Execute backup
      const startTime = Date.now();
      await this.executeDumpCommand(dumpArgs, backupId);
      
      // Compress backup if enabled
      if (this.config.compression) {
        await this.compressBackup(backupPath);
        backupInfo.path = `${backupPath}.gz`;
        backupInfo.compressed = true;
      }
      
      // Encrypt backup if enabled
      if (this.config.encryption && this.config.encryptionKey) {
        await this.encryptBackup(backupInfo.path);
        backupInfo.path = `${backupInfo.path}.enc`;
        backupInfo.encrypted = true;
      }
      
      // Get backup statistics
      const stats = await fs.stat(backupInfo.path);
      backupInfo.size = stats.size;
      backupInfo.duration = Date.now() - startTime;
      backupInfo.status = 'completed';
      backupInfo.checksum = await this.calculateChecksum(backupInfo.path);
      
      // Validate backup if enabled
      if (this.config.validateBackups) {
        const validation = await this.validateBackup(backupInfo);
        backupInfo.validation = validation;
        
        if (!validation.valid) {
          throw new Error(`Backup validation failed: ${validation.errors.join(', ')}`);
        }
      }
      
      // Create metadata file
      await this.createBackupMetadata(backupInfo);
      
      // Update state and metrics
      this.state.lastFullBackup = backupInfo;
      this.updateBackupMetrics(backupInfo, 'success');
      
      this.state.activeBackups.delete(backupId);
      
      this.emit('backup_completed', backupInfo);
      
      this.logger.info(`✓ PostgreSQL full backup completed: ${backupId} (${this.formatSize(backupInfo.size)})`);
      
      return backupInfo;
      
    } catch (error) {
      const backupInfo = this.state.activeBackups.get(backupId) || { id: backupId };
      backupInfo.status = 'failed';
      backupInfo.error = error.message;
      
      this.updateBackupMetrics(backupInfo, 'failure');
      this.state.activeBackups.delete(backupId);
      
      this.emit('backup_failed', backupInfo);
      
      this.logger.error(`PostgreSQL full backup failed: ${backupId}`, error);
      throw error;
    }
  }

  /**
   * Create incremental backup (using WAL files)
   */
  async createIncrementalBackup(context = {}) {
    if (!this.state.walArchiving) {
      throw new Error('WAL archiving must be enabled for incremental backups');
    }
    
    const backupId = context.id || this.generateBackupId('incremental');
    
    try {
      this.logger.info(`Starting PostgreSQL incremental backup: ${backupId}`);
      
      // Get current WAL position
      const client = await dbManager.postgresql.pool.connect();
      const result = await client.query('SELECT pg_current_wal_lsn() as current_lsn');
      const currentLSN = result.rows[0].current_lsn;
      client.release();
      
      const backupInfo = {
        id: backupId,
        type: 'incremental',
        timestamp: new Date(),
        database: this.config.database,
        startLSN: this.getLastBackupLSN(),
        endLSN: currentLSN,
        status: 'running'
      };
      
      this.state.activeBackups.set(backupId, backupInfo);
      this.emit('backup_started', backupInfo);
      
      // Archive WAL files since last backup
      const walFiles = await this.archiveWALFilesSince(backupInfo.startLSN);
      
      backupInfo.walFiles = walFiles;
      backupInfo.status = 'completed';
      backupInfo.size = walFiles.reduce((total, file) => total + file.size, 0);
      
      // Create metadata
      await this.createBackupMetadata(backupInfo);
      
      this.state.activeBackups.delete(backupId);
      this.emit('backup_completed', backupInfo);
      
      this.logger.info(`✓ PostgreSQL incremental backup completed: ${backupId} (${walFiles.length} WAL files)`);
      
      return backupInfo;
      
    } catch (error) {
      const backupInfo = this.state.activeBackups.get(backupId) || { id: backupId };
      backupInfo.status = 'failed';
      backupInfo.error = error.message;
      
      this.state.activeBackups.delete(backupId);
      this.emit('backup_failed', backupInfo);
      
      this.logger.error(`PostgreSQL incremental backup failed: ${backupId}`, error);
      throw error;
    }
  }

  /**
   * Create WAL backup
   */
  async createWALBackup(context = {}) {
    const backupId = context.id || this.generateBackupId('wal');
    
    try {
      this.logger.info(`Starting PostgreSQL WAL backup: ${backupId}`);
      
      // Force WAL segment switch
      const client = await dbManager.postgresql.pool.connect();
      const result = await client.query('SELECT pg_switch_wal()');
      const walLocation = result.rows[0].pg_switch_wal;
      client.release();
      
      const backupInfo = {
        id: backupId,
        type: 'wal',
        timestamp: new Date(),
        walLocation,
        status: 'running'
      };
      
      this.state.activeBackups.set(backupId, backupInfo);
      this.emit('backup_started', backupInfo);
      
      // Archive current WAL files
      const archivedFiles = await this.archiveCurrentWALFiles();
      
      backupInfo.archivedFiles = archivedFiles;
      backupInfo.status = 'completed';
      backupInfo.size = archivedFiles.reduce((total, file) => total + file.size, 0);
      
      this.state.lastWALArchive = backupInfo;
      this.metrics.walArchiveCount += archivedFiles.length;
      
      this.state.activeBackups.delete(backupId);
      this.emit('backup_completed', backupInfo);
      
      this.logger.info(`✓ PostgreSQL WAL backup completed: ${backupId} (${archivedFiles.length} files)`);
      
      return backupInfo;
      
    } catch (error) {
      const backupInfo = this.state.activeBackups.get(backupId) || { id: backupId };
      backupInfo.status = 'failed';
      backupInfo.error = error.message;
      
      this.metrics.walArchiveErrors++;
      this.state.activeBackups.delete(backupId);
      this.emit('backup_failed', backupInfo);
      
      this.logger.error(`PostgreSQL WAL backup failed: ${backupId}`, error);
      throw error;
    }
  }

  /**
   * Build pg_dump command arguments
   */
  buildDumpCommand(outputPath, type = 'full') {
    const args = [
      'pg_dump',
      '--host', this.config.host,
      '--port', this.config.port.toString(),
      '--username', this.config.username,
      '--dbname', this.config.database,
      '--verbose',
      '--no-password',
      '--format=custom',
      '--compress', this.config.compressionLevel.toString(),
      '--file', outputPath
    ];
    
    // Add parallel jobs for better performance
    if (this.config.parallelJobs > 1 && type === 'full') {
      args.push('--jobs', this.config.parallelJobs.toString());
    }
    
    // Exclude tables if specified
    if (this.config.excludeTables.length > 0) {
      this.config.excludeTables.forEach(table => {
        args.push('--exclude-table', table);
      });
    }
    
    // Include specific tables if specified
    if (this.config.includeTables.length > 0) {
      this.config.includeTables.forEach(table => {
        args.push('--table', table);
      });
    }
    
    // Add custom options
    if (this.config.customDumpOptions.length > 0) {
      args.push(...this.config.customDumpOptions);
    }
    
    return args;
  }

  /**
   * Execute pg_dump command
   */
  async executeDumpCommand(args, backupId) {
    return new Promise((resolve, reject) => {
      const env = {
        ...process.env,
        PGPASSWORD: this.config.password
      };
      
      const child = spawn(args[0], args.slice(1), {
        env,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
        
        // Log progress information
        if (data.toString().includes('dumping')) {
          this.logger.debug(`[${backupId}] ${data.toString().trim()}`);
        }
      });
      
      // Timeout handling
      const timeout = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error(`Backup timeout after ${this.config.timeout}ms`));
      }, this.config.timeout);
      
      child.on('close', (code) => {
        clearTimeout(timeout);
        
        if (code === 0) {
          this.logger.debug(`pg_dump completed successfully for ${backupId}`);
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`pg_dump failed with code ${code}: ${stderr}`));
        }
      });
      
      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`pg_dump process error: ${error.message}`));
      });
    });
  }

  /**
   * Compress backup file
   */
  async compressBackup(filePath) {
    const compressedPath = `${filePath}.gz`;
    
    return pipeline(
      fs.createReadStream(filePath),
      zlib.createGzip({ level: this.config.compressionLevel }),
      fs.createWriteStream(compressedPath)
    ).then(async () => {
      // Remove original file after compression
      await fs.unlink(filePath);
      this.logger.debug(`Backup compressed: ${path.basename(compressedPath)}`);
      return compressedPath;
    });
  }

  /**
   * Encrypt backup file
   */
  async encryptBackup(filePath) {
    if (!this.config.encryptionKey) {
      throw new Error('Encryption key not provided');
    }
    
    const encryptedPath = `${filePath}.enc`;
    const cipher = crypto.createCipher('aes-256-cbc', this.config.encryptionKey);
    
    return pipeline(
      fs.createReadStream(filePath),
      cipher,
      fs.createWriteStream(encryptedPath)
    ).then(async () => {
      // Remove original file after encryption
      await fs.unlink(filePath);
      this.logger.debug(`Backup encrypted: ${path.basename(encryptedPath)}`);
      return encryptedPath;
    });
  }

  /**
   * Calculate file checksum
   */
  async calculateChecksum(filePath) {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    return new Promise((resolve, reject) => {
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Validate backup integrity
   */
  async validateBackup(backupInfo) {
    const validation = {
      valid: true,
      errors: [],
      checks: {}
    };
    
    try {
      // Check file exists and size
      const stats = await fs.stat(backupInfo.path);
      validation.checks.fileExists = true;
      validation.checks.fileSize = stats.size;
      
      if (stats.size === 0) {
        validation.valid = false;
        validation.errors.push('Backup file is empty');
      }
      
      // Verify checksum
      if (backupInfo.checksum) {
        const currentChecksum = await this.calculateChecksum(backupInfo.path);
        validation.checks.checksumMatch = currentChecksum === backupInfo.checksum;
        
        if (!validation.checks.checksumMatch) {
          validation.valid = false;
          validation.errors.push('Checksum verification failed');
        }
      }
      
      // Test backup restore (if enabled and not encrypted)
      if (this.config.testRestoreEnabled && !backupInfo.encrypted) {
        const restoreTest = await this.testBackupRestore(backupInfo.path);
        validation.checks.restoreTest = restoreTest.success;
        
        if (!restoreTest.success) {
          validation.valid = false;
          validation.errors.push(`Restore test failed: ${restoreTest.error}`);
        }
      }
      
    } catch (error) {
      validation.valid = false;
      validation.errors.push(`Validation error: ${error.message}`);
    }
    
    return validation;
  }

  /**
   * Test backup restore to verify integrity
   */
  async testBackupRestore(backupPath) {
    try {
      // Create temporary database for testing
      const testDbName = `mlg_clan_test_${Date.now()}`;
      
      const client = await dbManager.postgresql.pool.connect();
      await client.query(`CREATE DATABASE "${testDbName}"`);
      client.release();
      
      // Restore backup to test database
      const restoreArgs = [
        'pg_restore',
        '--host', this.config.host,
        '--port', this.config.port.toString(),
        '--username', this.config.username,
        '--dbname', testDbName,
        '--verbose',
        '--no-password',
        '--single-transaction',
        backupPath
      ];
      
      await this.executeCommand(restoreArgs);
      
      // Verify some basic table structures
      const testClient = await dbManager.postgresql.pool.connect();
      const result = await testClient.query(`
        SELECT count(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      testClient.release();
      
      const tableCount = parseInt(result.rows[0].table_count);
      
      // Clean up test database
      const cleanupClient = await dbManager.postgresql.pool.connect();
      await cleanupClient.query(`DROP DATABASE "${testDbName}"`);
      cleanupClient.release();
      
      return {
        success: tableCount > 0,
        tableCount,
        message: `Restore test successful - ${tableCount} tables restored`
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create backup metadata file
   */
  async createBackupMetadata(backupInfo) {
    const metadataPath = path.join(
      this.config.backupDir,
      'metadata',
      `${backupInfo.id}.json`
    );
    
    const metadata = {
      ...backupInfo,
      created: new Date().toISOString(),
      postgresql: {
        version: await this.getPostgreSQLVersion(),
        settings: await this.getBackupRelevantSettings()
      },
      system: {
        hostname: require('os').hostname(),
        platform: process.platform,
        nodeVersion: process.version
      }
    };
    
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    return metadataPath;
  }

  /**
   * Get PostgreSQL version
   */
  async getPostgreSQLVersion() {
    try {
      const client = await dbManager.postgresql.pool.connect();
      const result = await client.query('SELECT version()');
      client.release();
      return result.rows[0].version;
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get backup-relevant PostgreSQL settings
   */
  async getBackupRelevantSettings() {
    try {
      const client = await dbManager.postgresql.pool.connect();
      const result = await client.query(`
        SELECT name, setting, unit, context 
        FROM pg_settings 
        WHERE name IN (
          'archive_mode', 'archive_command', 'wal_level',
          'max_wal_size', 'checkpoint_segments', 'shared_buffers'
        )
      `);
      client.release();
      
      const settings = {};
      result.rows.forEach(row => {
        settings[row.name] = {
          value: row.setting,
          unit: row.unit,
          context: row.context
        };
      });
      
      return settings;
    } catch (error) {
      return {};
    }
  }

  /**
   * Archive WAL files since last backup
   */
  async archiveWALFilesSince(startLSN) {
    try {
      // Get list of WAL files since startLSN
      const walFiles = await this.getWALFilesSince(startLSN);
      const archivedFiles = [];
      
      for (const walFile of walFiles) {
        const sourcePath = path.join(this.getWALDirectory(), walFile);
        const destPath = path.join(this.config.walArchiveDir, walFile);
        
        // Copy WAL file to archive
        await fs.copyFile(sourcePath, destPath);
        
        // Compress if enabled
        if (this.config.compression) {
          await this.compressFile(destPath);
        }
        
        const stats = await fs.stat(this.config.compression ? `${destPath}.gz` : destPath);
        archivedFiles.push({
          filename: walFile,
          path: this.config.compression ? `${destPath}.gz` : destPath,
          size: stats.size,
          timestamp: new Date()
        });
      }
      
      return archivedFiles;
    } catch (error) {
      throw new Error(`WAL archiving failed: ${error.message}`);
    }
  }

  /**
   * Archive current WAL files
   */
  async archiveCurrentWALFiles() {
    try {
      // Get current WAL files
      const walFiles = await this.getCurrentWALFiles();
      const archivedFiles = [];
      
      for (const walFile of walFiles) {
        const sourcePath = path.join(this.getWALDirectory(), walFile);
        const destPath = path.join(this.config.walArchiveDir, walFile);
        
        await fs.copyFile(sourcePath, destPath);
        
        if (this.config.compression) {
          await this.compressFile(destPath);
        }
        
        const stats = await fs.stat(this.config.compression ? `${destPath}.gz` : destPath);
        archivedFiles.push({
          filename: walFile,
          path: this.config.compression ? `${destPath}.gz` : destPath,
          size: stats.size,
          timestamp: new Date()
        });
      }
      
      return archivedFiles;
    } catch (error) {
      throw new Error(`Current WAL archiving failed: ${error.message}`);
    }
  }

  /**
   * Get WAL files since specific LSN
   */
  async getWALFilesSince(startLSN) {
    try {
      const client = await dbManager.postgresql.pool.connect();
      const result = await client.query(`
        SELECT pg_walfile_name(lsn) as wal_filename
        FROM pg_ls_waldir() w,
             LATERAL (SELECT ('x' || lpad(split_part(w.name, '.', 1), 8, '0'))::bit(32)::bigint * 16777216 +
                             ('x' || split_part(w.name, '.', 2))::bit(32)::bigint as lsn) calc
        WHERE calc.lsn >= pg_lsn(${startLSN})
        ORDER BY calc.lsn
      `);
      client.release();
      
      return result.rows.map(row => row.wal_filename);
    } catch (error) {
      // Fallback to file system scan
      return await this.scanWALDirectory();
    }
  }

  /**
   * Get current WAL files
   */
  async getCurrentWALFiles() {
    return await this.scanWALDirectory();
  }

  /**
   * Scan WAL directory for files
   */
  async scanWALDirectory() {
    try {
      const walDir = this.getWALDirectory();
      const files = await fs.readdir(walDir);
      
      // Filter for WAL files (24 character hex filenames)
      return files.filter(file => /^[0-9A-F]{24}$/.test(file));
    } catch (error) {
      return [];
    }
  }

  /**
   * Get WAL directory path
   */
  getWALDirectory() {
    // Default PostgreSQL WAL directory - would need to be configured based on actual setup
    return process.env.POSTGRES_WAL_DIR || '/var/lib/postgresql/data/pg_wal';
  }

  /**
   * Get last backup LSN
   */
  getLastBackupLSN() {
    return this.state.lastFullBackup?.endLSN || '0/0';
  }

  /**
   * Compress file using gzip
   */
  async compressFile(filePath) {
    const compressedPath = `${filePath}.gz`;
    
    return pipeline(
      fs.createReadStream(filePath),
      zlib.createGzip({ level: this.config.compressionLevel }),
      fs.createWriteStream(compressedPath)
    ).then(async () => {
      await fs.unlink(filePath);
      return compressedPath;
    });
  }

  /**
   * Execute system command
   */
  async executeCommand(args) {
    return new Promise((resolve, reject) => {
      const env = {
        ...process.env,
        PGPASSWORD: this.config.password
      };
      
      const child = spawn(args[0], args.slice(1), {
        env,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });
      
      child.on('error', (error) => {
        reject(new Error(`Command process error: ${error.message}`));
      });
    });
  }

  /**
   * Update backup metrics
   */
  updateBackupMetrics(backupInfo, status) {
    this.metrics.totalBackups++;
    
    if (status === 'success') {
      this.metrics.successfulBackups++;
      
      if (backupInfo.size) {
        this.metrics.totalBackupSize += backupInfo.size;
      }
      
      if (backupInfo.duration) {
        this.metrics.totalBackupTime += backupInfo.duration;
        this.metrics.averageBackupTime = Math.round(
          this.metrics.totalBackupTime / this.metrics.successfulBackups
        );
      }
    } else {
      this.metrics.failedBackups++;
    }
    
    // Add to history
    this.state.backupHistory.unshift({
      ...backupInfo,
      status,
      timestamp: new Date()
    });
    
    // Keep last 50 entries
    if (this.state.backupHistory.length > 50) {
      this.state.backupHistory = this.state.backupHistory.slice(0, 50);
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const checks = {
        databaseConnection: false,
        backupDirectory: false,
        postgresqlTools: false,
        walArchiving: false
      };
      
      // Test database connection
      try {
        await this.testDatabaseConnection();
        checks.databaseConnection = true;
      } catch (error) {
        // Connection check already logs error
      }
      
      // Check backup directory
      try {
        await fs.access(this.config.backupDir, fs.constants.W_OK);
        checks.backupDirectory = true;
      } catch (error) {
        // Directory not accessible
      }
      
      // Check PostgreSQL tools
      try {
        await execAsync('which pg_dump');
        checks.postgresqlTools = true;
      } catch (error) {
        // Tools not available
      }
      
      // Check WAL archiving status
      checks.walArchiving = this.state.walArchiving;
      
      const allHealthy = Object.values(checks).every(check => check === true);
      
      return {
        status: allHealthy ? 'healthy' : 'degraded',
        checks,
        metrics: this.metrics,
        lastBackup: this.state.lastFullBackup?.timestamp,
        activeBackups: this.state.activeBackups.size
      };
      
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  // Utility methods
  generateBackupId(type) {
    return `pg_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  formatSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get backup status
   */
  getStatus() {
    return {
      initialized: this.state.isInitialized,
      walArchiving: this.state.walArchiving,
      activeBackups: Array.from(this.state.activeBackups.values()),
      metrics: this.metrics,
      lastFullBackup: this.state.lastFullBackup,
      lastWALArchive: this.state.lastWALArchive,
      recentHistory: this.state.backupHistory.slice(0, 10)
    };
  }

  /**
   * Close backup system
   */
  async close() {
    // Stop any running backup processes
    this.state.activeBackups.clear();
    this.logger.info('PostgreSQL backup system closed');
  }
}

export default PostgreSQLBackup;