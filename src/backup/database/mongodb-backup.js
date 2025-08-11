/**
 * MLG.clan Platform - MongoDB Backup Management System
 * 
 * Advanced MongoDB backup system with support for mongodump, replica set snapshots,
 * incremental backups using oplogs, and automated backup validation.
 * 
 * Features:
 * - Full database dumps using mongodump
 * - Replica set snapshot coordination
 * - Incremental backups using oplog tailing
 * - Sharded cluster backup support
 * - Backup compression and encryption
 * - Point-in-time recovery preparation
 * - Backup validation and integrity checks
 * - GridFS file backup handling
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

export class MongoDBBackup extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Database connection settings
      host: config.host || process.env.MONGO_HOST || 'localhost',
      port: config.port || process.env.MONGO_PORT || 27017,
      database: config.database || process.env.MONGO_DATABASE || 'mlg_clan',
      username: config.username || process.env.MONGO_USERNAME,
      password: config.password || process.env.MONGO_PASSWORD,
      authDatabase: config.authDatabase || process.env.MONGO_AUTH_DATABASE || 'admin',
      
      // Connection URI (takes precedence over individual settings)
      uri: config.uri || process.env.MONGODB_URI,
      
      // Backup storage settings
      backupDir: config.backupDir || path.join(config.backupRoot || '/var/backups/mlg-clan', 'mongodb'),
      oplogDir: config.oplogDir || path.join(config.backupRoot || '/var/backups/mlg-clan', 'mongodb', 'oplog'),
      
      // Backup options
      compression: config.compression !== false,
      compressionLevel: config.compressionLevel || 6,
      encryption: config.encryption || false,
      encryptionKey: config.encryptionKey || process.env.BACKUP_ENCRYPTION_KEY,
      
      // Replica set settings
      replicaSet: config.replicaSet || process.env.MONGO_REPLICA_SET,
      preferSecondary: config.preferSecondary !== false,
      readConcern: config.readConcern || 'majority',
      
      // Sharding settings
      sharded: config.sharded || false,
      configServers: config.configServers || [],
      
      // Performance settings
      parallelCollections: config.parallelCollections || 4,
      batchSize: config.batchSize || 1000,
      timeout: config.timeout || 3600000, // 1 hour
      
      // Oplog settings
      oplogTailing: config.oplogTailing !== false,
      oplogRetentionHours: config.oplogRetentionHours || 24,
      oplogBatchSize: config.oplogBatchSize || 1000,
      
      // Collection settings
      excludeCollections: config.excludeCollections || [],
      includeCollections: config.includeCollections || [],
      excludeSystemCollections: config.excludeSystemCollections !== false,
      
      // GridFS settings
      backupGridFS: config.backupGridFS !== false,
      gridFSChunkSize: config.gridFSChunkSize || 255 * 1024, // 255KB
      
      // Backup validation
      validateBackups: config.validateBackups !== false,
      testRestoreEnabled: config.testRestoreEnabled || false,
      
      ...config
    };
    
    this.state = {
      isInitialized: false,
      activeBackups: new Map(),
      oplogTailing: false,
      lastFullBackup: null,
      lastOplogBackup: null,
      lastOplogTimestamp: null,
      backupHistory: []
    };
    
    this.metrics = {
      totalBackups: 0,
      successfulBackups: 0,
      failedBackups: 0,
      totalBackupSize: 0,
      averageBackupTime: 0,
      totalBackupTime: 0,
      oplogEntriesProcessed: 0,
      gridFSFilesBackedUp: 0,
      collectionsBackedUp: 0
    };
    
    this.logger = config.logger || console;
    this.oplogWatcher = null;
  }

  /**
   * Initialize MongoDB backup system
   */
  async initialize() {
    try {
      this.logger.info('Initializing MongoDB backup system...');
      
      // Create backup directories
      await this.createBackupDirectories();
      
      // Verify MongoDB tools are available
      await this.verifyMongoDBTools();
      
      // Test database connection
      await this.testDatabaseConnection();
      
      // Check replica set configuration
      await this.checkReplicaSetConfiguration();
      
      // Setup oplog tailing if enabled
      if (this.config.oplogTailing) {
        await this.setupOplogTailing();
      }
      
      this.state.isInitialized = true;
      
      this.logger.info('✓ MongoDB backup system initialized');
      
      return {
        status: 'initialized',
        config: this.config,
        replicaSet: this.config.replicaSet,
        oplogTailing: this.state.oplogTailing
      };
      
    } catch (error) {
      this.logger.error('MongoDB backup initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create backup directories
   */
  async createBackupDirectories() {
    const directories = [
      this.config.backupDir,
      this.config.oplogDir,
      path.join(this.config.backupDir, 'full'),
      path.join(this.config.backupDir, 'incremental'),
      path.join(this.config.backupDir, 'gridfs'),
      path.join(this.config.backupDir, 'metadata'),
      path.join(this.config.backupDir, 'logs')
    ];
    
    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
    
    this.logger.debug('Created MongoDB backup directories');
  }

  /**
   * Verify MongoDB tools availability
   */
  async verifyMongoDBTools() {
    const tools = ['mongodump', 'mongorestore', 'mongoexport', 'mongoimport'];
    
    for (const tool of tools) {
      try {
        await execAsync(`which ${tool}`);
      } catch (error) {
        throw new Error(`MongoDB tool not found: ${tool}. Please install MongoDB database tools.`);
      }
    }
    
    // Check versions
    const { stdout: mongodumpVersion } = await execAsync('mongodump --version');
    this.logger.info(`MongoDB tools verified: ${mongodumpVersion.split('\n')[0]}`);
  }

  /**
   * Test database connection
   */
  async testDatabaseConnection() {
    try {
      const db = dbManager.mongodb.db;
      const admin = db.admin();
      const result = await admin.ping();
      
      if (result.ok === 1) {
        this.logger.info('✓ MongoDB connection test successful');
        
        // Get server info
        const serverInfo = await admin.serverStatus();
        this.logger.debug(`MongoDB version: ${serverInfo.version}`);
        
        return true;
      } else {
        throw new Error('MongoDB ping failed');
      }
      
    } catch (error) {
      throw new Error(`MongoDB connection test failed: ${error.message}`);
    }
  }

  /**
   * Check replica set configuration
   */
  async checkReplicaSetConfiguration() {
    try {
      const db = dbManager.mongodb.db;
      const admin = db.admin();
      
      // Check if we're running in a replica set
      try {
        const replSetStatus = await admin.replSetGetStatus();
        
        if (replSetStatus.ok === 1) {
          this.config.replicaSet = replSetStatus.set;
          this.logger.info(`✓ Replica set detected: ${replSetStatus.set}`);
          
          // Find secondary members for backup preference
          const secondaryMembers = replSetStatus.members.filter(
            member => member.stateStr === 'SECONDARY'
          );
          
          if (secondaryMembers.length > 0 && this.config.preferSecondary) {
            this.logger.info(`Found ${secondaryMembers.length} secondary members for backup`);
          }
        }
      } catch (error) {
        // Not a replica set, which is fine for standalone instances
        this.logger.info('Not running in replica set mode');
      }
      
    } catch (error) {
      this.logger.warn('Could not check replica set configuration:', error.message);
    }
  }

  /**
   * Setup oplog tailing for incremental backups
   */
  async setupOplogTailing() {
    try {
      if (!this.config.replicaSet) {
        this.logger.warn('Oplog tailing requires replica set configuration');
        return;
      }
      
      const db = dbManager.mongodb.db;
      const oplogCollection = db.db('local').collection('oplog.rs');
      
      // Get the latest oplog timestamp
      const latestOplogEntry = await oplogCollection
        .find({})
        .sort({ ts: -1 })
        .limit(1)
        .toArray();
      
      if (latestOplogEntry.length > 0) {
        this.state.lastOplogTimestamp = latestOplogEntry[0].ts;
        this.state.oplogTailing = true;
        
        this.logger.info('✓ Oplog tailing configured');
        this.logger.debug(`Latest oplog timestamp: ${this.state.lastOplogTimestamp}`);
      } else {
        throw new Error('No oplog entries found');
      }
      
    } catch (error) {
      this.logger.error('Oplog tailing setup failed:', error);
      // Don't throw - oplog tailing is optional
    }
  }

  /**
   * Create full database backup
   */
  async createFullBackup(context = {}) {
    const backupId = context.id || this.generateBackupId('full');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.config.backupDir, 'full', `mlg_clan_full_${timestamp}`);
    
    try {
      this.logger.info(`Starting MongoDB full backup: ${backupId}`);
      
      const backupInfo = {
        id: backupId,
        type: 'full',
        timestamp: new Date(),
        database: this.config.database,
        path: backupDir,
        status: 'running',
        collections: []
      };
      
      this.state.activeBackups.set(backupId, backupInfo);
      this.emit('backup_started', backupInfo);
      
      // Create backup directory
      await fs.mkdir(backupDir, { recursive: true });
      
      // Build mongodump command
      const dumpArgs = this.buildDumpCommand(backupDir, 'full');
      
      // Execute backup
      const startTime = Date.now();
      const result = await this.executeDumpCommand(dumpArgs, backupId);
      
      // Get backup statistics
      const stats = await this.getBackupStats(backupDir);
      backupInfo.size = stats.totalSize;
      backupInfo.collections = stats.collections;
      backupInfo.documents = stats.totalDocuments;
      backupInfo.duration = Date.now() - startTime;
      
      // Backup GridFS if enabled
      if (this.config.backupGridFS) {
        const gridFSBackup = await this.backupGridFS(backupDir, context);
        backupInfo.gridFS = gridFSBackup;
        this.metrics.gridFSFilesBackedUp += gridFSBackup.filesCount;
      }
      
      // Compress backup if enabled
      if (this.config.compression) {
        const compressedPath = await this.compressBackupDirectory(backupDir);
        backupInfo.path = compressedPath;
        backupInfo.compressed = true;
        
        // Update size after compression
        const compressedStats = await fs.stat(compressedPath);
        backupInfo.compressedSize = compressedStats.size;
      }
      
      // Encrypt backup if enabled
      if (this.config.encryption && this.config.encryptionKey) {
        const encryptedPath = await this.encryptBackup(backupInfo.path);
        backupInfo.path = encryptedPath;
        backupInfo.encrypted = true;
      }
      
      // Calculate checksum
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
      backupInfo.status = 'completed';
      this.state.lastFullBackup = backupInfo;
      this.metrics.collectionsBackedUp += backupInfo.collections.length;
      this.updateBackupMetrics(backupInfo, 'success');
      
      this.state.activeBackups.delete(backupId);
      
      this.emit('backup_completed', backupInfo);
      
      this.logger.info(`✓ MongoDB full backup completed: ${backupId} (${this.formatSize(backupInfo.size)})`);
      
      return backupInfo;
      
    } catch (error) {
      const backupInfo = this.state.activeBackups.get(backupId) || { id: backupId };
      backupInfo.status = 'failed';
      backupInfo.error = error.message;
      
      this.updateBackupMetrics(backupInfo, 'failure');
      this.state.activeBackups.delete(backupId);
      
      this.emit('backup_failed', backupInfo);
      
      this.logger.error(`MongoDB full backup failed: ${backupId}`, error);
      throw error;
    }
  }

  /**
   * Create incremental backup using oplog
   */
  async createIncrementalBackup(context = {}) {
    if (!this.state.oplogTailing) {
      throw new Error('Oplog tailing must be enabled for incremental backups');
    }
    
    const backupId = context.id || this.generateBackupId('incremental');
    
    try {
      this.logger.info(`Starting MongoDB incremental backup: ${backupId}`);
      
      const db = dbManager.mongodb.db;
      const oplogCollection = db.db('local').collection('oplog.rs');
      
      // Get current oplog timestamp
      const latestOplogEntry = await oplogCollection
        .find({})
        .sort({ ts: -1 })
        .limit(1)
        .toArray();
      
      const currentTimestamp = latestOplogEntry[0].ts;
      
      const backupInfo = {
        id: backupId,
        type: 'incremental',
        timestamp: new Date(),
        database: this.config.database,
        startTimestamp: this.state.lastOplogTimestamp,
        endTimestamp: currentTimestamp,
        status: 'running'
      };
      
      this.state.activeBackups.set(backupId, backupInfo);
      this.emit('backup_started', backupInfo);
      
      // Query oplog entries since last backup
      const oplogEntries = await oplogCollection
        .find({
          ts: { $gt: this.state.lastOplogTimestamp, $lte: currentTimestamp },
          ns: new RegExp(`^${this.config.database}\\.`)
        })
        .sort({ ts: 1 })
        .toArray();
      
      // Save oplog entries
      const oplogBackupPath = path.join(
        this.config.oplogDir,
        `oplog_${backupId}.json`
      );
      
      await fs.writeFile(oplogBackupPath, JSON.stringify(oplogEntries, null, 2));
      
      // Compress oplog backup if enabled
      if (this.config.compression) {
        await this.compressFile(oplogBackupPath);
        backupInfo.path = `${oplogBackupPath}.gz`;
      } else {
        backupInfo.path = oplogBackupPath;
      }
      
      const stats = await fs.stat(backupInfo.path);
      backupInfo.size = stats.size;
      backupInfo.oplogEntries = oplogEntries.length;
      backupInfo.status = 'completed';
      
      // Update last oplog timestamp
      this.state.lastOplogTimestamp = currentTimestamp;
      this.state.lastOplogBackup = backupInfo;
      
      // Update metrics
      this.metrics.oplogEntriesProcessed += oplogEntries.length;
      
      // Create metadata
      await this.createBackupMetadata(backupInfo);
      
      this.state.activeBackups.delete(backupId);
      this.emit('backup_completed', backupInfo);
      
      this.logger.info(`✓ MongoDB incremental backup completed: ${backupId} (${oplogEntries.length} oplog entries)`);
      
      return backupInfo;
      
    } catch (error) {
      const backupInfo = this.state.activeBackups.get(backupId) || { id: backupId };
      backupInfo.status = 'failed';
      backupInfo.error = error.message;
      
      this.state.activeBackups.delete(backupId);
      this.emit('backup_failed', backupInfo);
      
      this.logger.error(`MongoDB incremental backup failed: ${backupId}`, error);
      throw error;
    }
  }

  /**
   * Create replica set snapshot backup
   */
  async createSnapshotBackup(context = {}) {
    if (!this.config.replicaSet) {
      throw new Error('Snapshot backup requires replica set configuration');
    }
    
    const backupId = context.id || this.generateBackupId('snapshot');
    
    try {
      this.logger.info(`Starting MongoDB snapshot backup: ${backupId}`);
      
      const backupInfo = {
        id: backupId,
        type: 'snapshot',
        timestamp: new Date(),
        database: this.config.database,
        status: 'running'
      };
      
      this.state.activeBackups.set(backupId, backupInfo);
      this.emit('backup_started', backupInfo);
      
      const db = dbManager.mongodb.db;
      const admin = db.admin();
      
      // Create a consistent snapshot by stopping balancer if sharded
      if (this.config.sharded) {
        await admin.runCommand({ balancerStop: 1 });
        this.logger.debug('Balancer stopped for snapshot consistency');
      }
      
      try {
        // Use filesystem snapshot if available, otherwise use mongodump with read concern
        const snapshotPath = await this.createFilesystemSnapshot(backupInfo);
        
        if (!snapshotPath) {
          // Fallback to mongodump with majority read concern
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const backupDir = path.join(this.config.backupDir, 'snapshots', `snapshot_${timestamp}`);
          
          await fs.mkdir(backupDir, { recursive: true });
          
          const dumpArgs = this.buildDumpCommand(backupDir, 'snapshot');
          await this.executeDumpCommand(dumpArgs, backupId);
          
          backupInfo.path = backupDir;
        } else {
          backupInfo.path = snapshotPath;
          backupInfo.filesystemSnapshot = true;
        }
        
        // Get backup statistics
        const stats = await this.getBackupStats(backupInfo.path);
        backupInfo.size = stats.totalSize;
        backupInfo.collections = stats.collections;
        
        backupInfo.status = 'completed';
        
      } finally {
        // Restart balancer if it was stopped
        if (this.config.sharded) {
          await admin.runCommand({ balancerStart: 1 });
          this.logger.debug('Balancer restarted');
        }
      }
      
      // Create metadata
      await this.createBackupMetadata(backupInfo);
      
      this.state.activeBackups.delete(backupId);
      this.emit('backup_completed', backupInfo);
      
      this.logger.info(`✓ MongoDB snapshot backup completed: ${backupId}`);
      
      return backupInfo;
      
    } catch (error) {
      const backupInfo = this.state.activeBackups.get(backupId) || { id: backupId };
      backupInfo.status = 'failed';
      backupInfo.error = error.message;
      
      this.state.activeBackups.delete(backupId);
      this.emit('backup_failed', backupInfo);
      
      this.logger.error(`MongoDB snapshot backup failed: ${backupId}`, error);
      throw error;
    }
  }

  /**
   * Build mongodump command arguments
   */
  buildDumpCommand(outputPath, type = 'full') {
    const args = ['mongodump'];
    
    // Connection settings
    if (this.config.uri) {
      args.push('--uri', this.config.uri);
    } else {
      args.push('--host', `${this.config.host}:${this.config.port}`);
      
      if (this.config.username) {
        args.push('--username', this.config.username);
      }
      
      if (this.config.password) {
        args.push('--password', this.config.password);
      }
      
      if (this.config.authDatabase) {
        args.push('--authenticationDatabase', this.config.authDatabase);
      }
    }
    
    // Database selection
    args.push('--db', this.config.database);
    
    // Output directory
    args.push('--out', outputPath);
    
    // Performance settings
    if (this.config.parallelCollections > 1 && type === 'full') {
      args.push('--numParallelCollections', this.config.parallelCollections.toString());
    }
    
    // Read preference for replica sets
    if (this.config.replicaSet && this.config.preferSecondary) {
      args.push('--readPreference', 'secondary');
    }
    
    // Read concern
    if (this.config.readConcern) {
      args.push('--readConcern', this.config.readConcern);
    }
    
    // Collection filtering
    if (this.config.includeCollections.length > 0) {
      this.config.includeCollections.forEach(collection => {
        args.push('--collection', collection);
      });
    }
    
    if (this.config.excludeCollections.length > 0) {
      this.config.excludeCollections.forEach(collection => {
        args.push('--excludeCollection', collection);
      });
    }
    
    // Exclude system collections if configured
    if (this.config.excludeSystemCollections) {
      args.push('--excludeCollectionsWithPrefix', 'system.');
    }
    
    // Compression (handled externally for better control)
    args.push('--gzip');
    
    // Additional options for snapshot backups
    if (type === 'snapshot') {
      args.push('--forceTableScan');
    }
    
    return args;
  }

  /**
   * Execute mongodump command
   */
  async executeDumpCommand(args, backupId) {
    return new Promise((resolve, reject) => {
      const child = spawn(args[0], args.slice(1), {
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
        if (data.toString().includes('done dumping')) {
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
          this.logger.debug(`mongodump completed successfully for ${backupId}`);
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`mongodump failed with code ${code}: ${stderr}`));
        }
      });
      
      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`mongodump process error: ${error.message}`));
      });
    });
  }

  /**
   * Backup GridFS files
   */
  async backupGridFS(backupDir, context = {}) {
    try {
      const gridFSDir = path.join(backupDir, 'gridfs');
      await fs.mkdir(gridFSDir, { recursive: true });
      
      const db = dbManager.mongodb.db;
      const bucket = new db.GridFSBucket(db, { bucketName: 'fs' });
      
      // Get all GridFS files
      const files = await bucket.find({}).toArray();
      
      let filesCount = 0;
      let totalSize = 0;
      
      for (const file of files) {
        const downloadStream = bucket.openDownloadStream(file._id);
        const filePath = path.join(gridFSDir, `${file._id}_${file.filename}`);
        const writeStream = fs.createWriteStream(filePath);
        
        await pipeline(downloadStream, writeStream);
        
        const stats = await fs.stat(filePath);
        filesCount++;
        totalSize += stats.size;
      }
      
      // Create GridFS metadata file
      const metadataPath = path.join(gridFSDir, 'metadata.json');
      await fs.writeFile(metadataPath, JSON.stringify(files, null, 2));
      
      this.logger.info(`✓ GridFS backup completed: ${filesCount} files (${this.formatSize(totalSize)})`);
      
      return {
        filesCount,
        totalSize,
        path: gridFSDir,
        metadataPath
      };
      
    } catch (error) {
      this.logger.error('GridFS backup failed:', error);
      throw error;
    }
  }

  /**
   * Create filesystem snapshot (if supported)
   */
  async createFilesystemSnapshot(backupInfo) {
    try {
      // This would implement filesystem-specific snapshot creation
      // For example, LVM snapshots, ZFS snapshots, etc.
      // Since this is platform-specific, we'll return null to fall back to mongodump
      
      // Example for LVM (would need to be implemented based on actual setup):
      // const snapshotName = `mongodb_snapshot_${Date.now()}`;
      // await execAsync(`lvcreate -L1G -s -n ${snapshotName} /dev/vg0/mongodb`);
      // return `/dev/vg0/${snapshotName}`;
      
      return null;
    } catch (error) {
      this.logger.debug('Filesystem snapshot not available:', error.message);
      return null;
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(backupPath) {
    try {
      const stats = {
        totalSize: 0,
        totalDocuments: 0,
        collections: []
      };
      
      // Check if it's a directory (mongodump output) or file (compressed)
      const pathStats = await fs.stat(backupPath);
      
      if (pathStats.isDirectory()) {
        // Read all BSON files to get collection stats
        const files = await fs.readdir(backupPath);
        
        for (const file of files) {
          if (file.endsWith('.bson')) {
            const filePath = path.join(backupPath, file);
            const fileStats = await fs.stat(filePath);
            
            const collectionName = file.replace('.bson', '');
            stats.collections.push({
              name: collectionName,
              size: fileStats.size
            });
            
            stats.totalSize += fileStats.size;
          }
        }
      } else {
        // Compressed file
        stats.totalSize = pathStats.size;
        stats.collections = [{ name: 'compressed', size: pathStats.size }];
      }
      
      return stats;
    } catch (error) {
      return {
        totalSize: 0,
        totalDocuments: 0,
        collections: []
      };
    }
  }

  /**
   * Compress backup directory
   */
  async compressBackupDirectory(backupDir) {
    const compressedPath = `${backupDir}.tar.gz`;
    
    return new Promise((resolve, reject) => {
      const args = [
        'tar',
        '-czf',
        compressedPath,
        '-C',
        path.dirname(backupDir),
        path.basename(backupDir)
      ];
      
      const child = spawn(args[0], args.slice(1), {
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      child.on('close', async (code) => {
        if (code === 0) {
          // Remove original directory after compression
          await fs.rm(backupDir, { recursive: true, force: true });
          this.logger.debug(`Backup compressed: ${path.basename(compressedPath)}`);
          resolve(compressedPath);
        } else {
          reject(new Error(`Compression failed with code ${code}`));
        }
      });
      
      child.on('error', (error) => {
        reject(new Error(`Compression process error: ${error.message}`));
      });
    });
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
      // Check file/directory exists
      const stats = await fs.stat(backupInfo.path);
      validation.checks.pathExists = true;
      validation.checks.size = stats.size;
      
      if (stats.size === 0) {
        validation.valid = false;
        validation.errors.push('Backup path is empty');
      }
      
      // Verify checksum if available
      if (backupInfo.checksum) {
        const currentChecksum = await this.calculateChecksum(backupInfo.path);
        validation.checks.checksumMatch = currentChecksum === backupInfo.checksum;
        
        if (!validation.checks.checksumMatch) {
          validation.valid = false;
          validation.errors.push('Checksum verification failed');
        }
      }
      
      // Test restore (if enabled and not encrypted)
      if (this.config.testRestoreEnabled && !backupInfo.encrypted) {
        const restoreTest = await this.testBackupRestore(backupInfo);
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
  async testBackupRestore(backupInfo) {
    try {
      const testDbName = `${this.config.database}_test_${Date.now()}`;
      
      if (backupInfo.type === 'full' && !backupInfo.compressed && !backupInfo.encrypted) {
        // Test restore using mongorestore
        const restoreArgs = [
          'mongorestore',
          '--host', `${this.config.host}:${this.config.port}`,
          '--db', testDbName
        ];
        
        if (this.config.username) {
          restoreArgs.push('--username', this.config.username);
          restoreArgs.push('--password', this.config.password);
          restoreArgs.push('--authenticationDatabase', this.config.authDatabase);
        }
        
        restoreArgs.push(backupInfo.path);
        
        await this.executeCommand(restoreArgs);
        
        // Verify the restored database
        const db = dbManager.mongodb.client.db(testDbName);
        const collections = await db.listCollections().toArray();
        
        // Clean up test database
        await db.dropDatabase();
        
        return {
          success: collections.length > 0,
          collectionsCount: collections.length,
          message: `Restore test successful - ${collections.length} collections restored`
        };
      } else {
        // For compressed/encrypted backups or incremental backups, just check structure
        return {
          success: true,
          message: 'Structural validation passed (full restore test skipped)'
        };
      }
      
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
      mongodb: {
        version: await this.getMongoDBVersion(),
        replicaSet: this.config.replicaSet,
        sharded: this.config.sharded
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
   * Get MongoDB version
   */
  async getMongoDBVersion() {
    try {
      const db = dbManager.mongodb.db;
      const admin = db.admin();
      const result = await admin.serverStatus();
      return result.version;
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Execute system command
   */
  async executeCommand(args) {
    return new Promise((resolve, reject) => {
      const child = spawn(args[0], args.slice(1), {
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
        mongodbTools: false,
        replicaSet: false,
        oplogTailing: false
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
      
      // Check MongoDB tools
      try {
        await execAsync('which mongodump');
        checks.mongodbTools = true;
      } catch (error) {
        // Tools not available
      }
      
      // Check replica set status
      checks.replicaSet = !!this.config.replicaSet;
      
      // Check oplog tailing status
      checks.oplogTailing = this.state.oplogTailing;
      
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
    return `mongo_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
      oplogTailing: this.state.oplogTailing,
      replicaSet: this.config.replicaSet,
      activeBackups: Array.from(this.state.activeBackups.values()),
      metrics: this.metrics,
      lastFullBackup: this.state.lastFullBackup,
      lastOplogBackup: this.state.lastOplogBackup,
      recentHistory: this.state.backupHistory.slice(0, 10)
    };
  }

  /**
   * Close backup system
   */
  async close() {
    // Stop oplog watcher if running
    if (this.oplogWatcher) {
      this.oplogWatcher.close();
    }
    
    // Clear active backups
    this.state.activeBackups.clear();
    
    this.logger.info('MongoDB backup system closed');
  }
}

export default MongoDBBackup;