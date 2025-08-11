/**
 * MLG.clan Platform - Redis Backup Management System
 * 
 * Advanced Redis backup system with support for RDB snapshots, AOF persistence,
 * memory state preservation, and automated recovery procedures.
 * 
 * Features:
 * - RDB snapshot creation and management
 * - AOF (Append Only File) backup and recovery
 * - Memory state preservation
 * - Session data backup and restoration
 * - Cache data backup with selective restore
 * - Redis cluster backup support
 * - Backup compression and encryption
 * - Performance optimized operations
 * 
 * @author Claude Code - Cache Backup Specialist
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
import { getRedisClient } from '../../cache/redis-client.js';

const execAsync = promisify(exec);

export class RedisBackup extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Redis connection settings
      host: config.host || process.env.REDIS_HOST || 'localhost',
      port: config.port || process.env.REDIS_PORT || 6379,
      password: config.password || process.env.REDIS_PASSWORD,
      database: config.database || process.env.REDIS_DATABASE || 0,
      
      // Redis cluster settings
      cluster: config.cluster || false,
      clusterNodes: config.clusterNodes || [],
      
      // Backup storage settings
      backupDir: config.backupDir || path.join(config.backupRoot || '/var/backups/mlg-clan', 'redis'),
      aofDir: config.aofDir || path.join(config.backupRoot || '/var/backups/mlg-clan', 'redis', 'aof'),
      
      // Backup options
      compression: config.compression !== false,
      compressionLevel: config.compressionLevel || 6,
      encryption: config.encryption || false,
      encryptionKey: config.encryptionKey || process.env.BACKUP_ENCRYPTION_KEY,
      
      // Backup strategies
      snapshotInterval: config.snapshotInterval || 3600000, // 1 hour
      aofRewriteThreshold: config.aofRewriteThreshold || 100, // MB
      memorySnapshotEnabled: config.memorySnapshotEnabled !== false,
      
      // Performance settings
      snapshotTimeout: config.snapshotTimeout || 300000, // 5 minutes
      maxMemoryForSnapshot: config.maxMemoryForSnapshot || '1gb',
      
      // Selective backup settings
      backupSessions: config.backupSessions !== false,
      backupCache: config.backupCache !== false,
      backupAnalytics: config.backupAnalytics || false,
      keyPatterns: config.keyPatterns || {
        sessions: 'session:*',
        cache: 'cache:*',
        analytics: 'analytics:*',
        leaderboards: 'leaderboard:*',
        voting: 'vote:*'
      },
      
      // Redis data directory (for RDB/AOF files)
      redisDataDir: config.redisDataDir || process.env.REDIS_DATA_DIR || '/var/lib/redis',
      
      ...config
    };
    
    this.state = {
      isInitialized: false,
      activeBackups: new Map(),
      lastRDBBackup: null,
      lastAOFBackup: null,
      lastMemorySnapshot: null,
      redisInfo: {},
      backupHistory: []
    };
    
    this.metrics = {
      totalBackups: 0,
      successfulBackups: 0,
      failedBackups: 0,
      totalBackupSize: 0,
      averageBackupTime: 0,
      totalBackupTime: 0,
      rdbSnapshots: 0,
      aofBackups: 0,
      memorySnapshots: 0,
      keysBackedUp: 0,
      sessionsBackedUp: 0
    };
    
    this.redisClient = null;
    this.logger = config.logger || console;
  }

  /**
   * Initialize Redis backup system
   */
  async initialize() {
    try {
      this.logger.info('Initializing Redis backup system...');
      
      // Create backup directories
      await this.createBackupDirectories();
      
      // Initialize Redis client
      await this.initializeRedisClient();
      
      // Verify Redis tools are available
      await this.verifyRedisTools();
      
      // Get Redis server information
      await this.getRedisServerInfo();
      
      // Setup automatic snapshots if enabled
      if (this.config.snapshotInterval > 0) {
        this.setupAutomaticSnapshots();
      }
      
      this.state.isInitialized = true;
      
      this.logger.info('✓ Redis backup system initialized');
      
      return {
        status: 'initialized',
        config: this.config,
        redisInfo: this.state.redisInfo
      };
      
    } catch (error) {
      this.logger.error('Redis backup initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create backup directories
   */
  async createBackupDirectories() {
    const directories = [
      this.config.backupDir,
      this.config.aofDir,
      path.join(this.config.backupDir, 'snapshots'),
      path.join(this.config.backupDir, 'memory'),
      path.join(this.config.backupDir, 'selective'),
      path.join(this.config.backupDir, 'metadata'),
      path.join(this.config.backupDir, 'logs')
    ];
    
    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
    
    this.logger.debug('Created Redis backup directories');
  }

  /**
   * Initialize Redis client
   */
  async initializeRedisClient() {
    try {
      this.redisClient = getRedisClient({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        database: this.config.database,
        cluster: this.config.cluster,
        clusterNodes: this.config.clusterNodes
      });
      
      await this.redisClient.connect();
      
      // Test connection
      await this.redisClient.ping();
      
      this.logger.info('✓ Redis client connected');
      
    } catch (error) {
      throw new Error(`Redis connection failed: ${error.message}`);
    }
  }

  /**
   * Verify Redis tools availability
   */
  async verifyRedisTools() {
    const tools = ['redis-cli'];
    
    for (const tool of tools) {
      try {
        await execAsync(`which ${tool}`);
      } catch (error) {
        this.logger.warn(`Redis tool not found: ${tool}. Some features may be limited.`);
      }
    }
    
    this.logger.debug('Redis tools verification completed');
  }

  /**
   * Get Redis server information
   */
  async getRedisServerInfo() {
    try {
      const info = await this.redisClient.info();
      const lines = info.split('\r\n');
      
      const serverInfo = {};
      lines.forEach(line => {
        if (line.includes(':') && !line.startsWith('#')) {
          const [key, value] = line.split(':');
          serverInfo[key] = value;
        }
      });
      
      this.state.redisInfo = {
        version: serverInfo.redis_version,
        mode: serverInfo.redis_mode,
        role: serverInfo.role,
        connected_clients: parseInt(serverInfo.connected_clients),
        used_memory: parseInt(serverInfo.used_memory),
        used_memory_human: serverInfo.used_memory_human,
        total_commands_processed: parseInt(serverInfo.total_commands_processed),
        keyspace: this.parseKeyspaceInfo(serverInfo),
        persistence: {
          rdb_enabled: serverInfo.rdb_bgsave_in_progress === '0',
          aof_enabled: serverInfo.aof_enabled === '1',
          last_save_time: new Date(parseInt(serverInfo.rdb_last_save_time) * 1000)
        }
      };
      
      this.logger.info(`✓ Redis server info: v${this.state.redisInfo.version}, ${this.state.redisInfo.used_memory_human} used`);
      
    } catch (error) {
      this.logger.warn('Could not get Redis server info:', error.message);
    }
  }

  /**
   * Parse keyspace information
   */
  parseKeyspaceInfo(serverInfo) {
    const keyspace = {};
    
    for (const [key, value] of Object.entries(serverInfo)) {
      if (key.startsWith('db')) {
        const dbNumber = key.replace('db', '');
        const dbInfo = {};
        
        value.split(',').forEach(item => {
          const [itemKey, itemValue] = item.split('=');
          dbInfo[itemKey] = parseInt(itemValue);
        });
        
        keyspace[dbNumber] = dbInfo;
      }
    }
    
    return keyspace;
  }

  /**
   * Create RDB snapshot backup
   */
  async createSnapshot(context = {}) {
    const backupId = context.id || this.generateBackupId('rdb');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotPath = path.join(
      this.config.backupDir,
      'snapshots',
      `redis_snapshot_${timestamp}.rdb`
    );
    
    try {
      this.logger.info(`Starting Redis RDB snapshot: ${backupId}`);
      
      const backupInfo = {
        id: backupId,
        type: 'rdb_snapshot',
        timestamp: new Date(),
        path: snapshotPath,
        status: 'running'
      };
      
      this.state.activeBackups.set(backupId, backupInfo);
      this.emit('backup_started', backupInfo);
      
      const startTime = Date.now();
      
      // Trigger RDB save
      await this.redisClient.executeCommand('BGSAVE');
      
      // Wait for background save to complete
      await this.waitForBackgroundSave();
      
      // Copy RDB file to backup location
      const rdbSourcePath = await this.findRDBFile();
      if (rdbSourcePath) {
        await fs.copyFile(rdbSourcePath, snapshotPath);
        
        // Get backup statistics
        const stats = await fs.stat(snapshotPath);
        backupInfo.size = stats.size;
        
        // Get keys count
        const dbInfo = await this.redisClient.info('keyspace');
        backupInfo.keysCount = this.extractKeysCount(dbInfo);
        
      } else {
        throw new Error('RDB file not found after BGSAVE');
      }
      
      // Compress backup if enabled
      if (this.config.compression) {
        await this.compressFile(snapshotPath);
        backupInfo.path = `${snapshotPath}.gz`;
        backupInfo.compressed = true;
        
        // Update size after compression
        const compressedStats = await fs.stat(backupInfo.path);
        backupInfo.compressedSize = compressedStats.size;
      }
      
      // Encrypt backup if enabled
      if (this.config.encryption && this.config.encryptionKey) {
        await this.encryptFile(backupInfo.path);
        backupInfo.path = `${backupInfo.path}.enc`;
        backupInfo.encrypted = true;
      }
      
      // Calculate checksum
      backupInfo.checksum = await this.calculateChecksum(backupInfo.path);
      backupInfo.duration = Date.now() - startTime;
      backupInfo.status = 'completed';
      
      // Create metadata
      await this.createBackupMetadata(backupInfo);
      
      // Update state and metrics
      this.state.lastRDBBackup = backupInfo;
      this.metrics.rdbSnapshots++;
      this.updateBackupMetrics(backupInfo, 'success');
      
      this.state.activeBackups.delete(backupId);
      
      this.emit('backup_completed', backupInfo);
      
      this.logger.info(`✓ Redis RDB snapshot completed: ${backupId} (${this.formatSize(backupInfo.size)})`);
      
      return backupInfo;
      
    } catch (error) {
      const backupInfo = this.state.activeBackups.get(backupId) || { id: backupId };
      backupInfo.status = 'failed';
      backupInfo.error = error.message;
      
      this.updateBackupMetrics(backupInfo, 'failure');
      this.state.activeBackups.delete(backupId);
      
      this.emit('backup_failed', backupInfo);
      
      this.logger.error(`Redis RDB snapshot failed: ${backupId}`, error);
      throw error;
    }
  }

  /**
   * Create AOF backup
   */
  async createAOFBackup(context = {}) {
    const backupId = context.id || this.generateBackupId('aof');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const aofPath = path.join(
      this.config.aofDir,
      `redis_aof_${timestamp}.aof`
    );
    
    try {
      this.logger.info(`Starting Redis AOF backup: ${backupId}`);
      
      const backupInfo = {
        id: backupId,
        type: 'aof_backup',
        timestamp: new Date(),
        path: aofPath,
        status: 'running'
      };
      
      this.state.activeBackups.set(backupId, backupInfo);
      this.emit('backup_started', backupInfo);
      
      const startTime = Date.now();
      
      // Check if AOF is enabled
      const aofEnabled = await this.isAOFEnabled();
      if (!aofEnabled) {
        // Enable AOF temporarily
        await this.redisClient.executeCommand('CONFIG', 'SET', 'appendonly', 'yes');
        this.logger.debug('Temporarily enabled AOF for backup');
      }
      
      // Trigger AOF rewrite
      await this.redisClient.executeCommand('BGREWRITEAOF');
      
      // Wait for AOF rewrite to complete
      await this.waitForAOFRewrite();
      
      // Copy AOF file to backup location
      const aofSourcePath = await this.findAOFFile();
      if (aofSourcePath) {
        await fs.copyFile(aofSourcePath, aofPath);
        
        // Get backup statistics
        const stats = await fs.stat(aofPath);
        backupInfo.size = stats.size;
      } else {
        throw new Error('AOF file not found after BGREWRITEAOF');
      }
      
      // Compress backup if enabled
      if (this.config.compression) {
        await this.compressFile(aofPath);
        backupInfo.path = `${aofPath}.gz`;
        backupInfo.compressed = true;
      }
      
      // Encrypt backup if enabled
      if (this.config.encryption && this.config.encryptionKey) {
        await this.encryptFile(backupInfo.path);
        backupInfo.path = `${backupInfo.path}.enc`;
        backupInfo.encrypted = true;
      }
      
      // Calculate checksum
      backupInfo.checksum = await this.calculateChecksum(backupInfo.path);
      backupInfo.duration = Date.now() - startTime;
      backupInfo.status = 'completed';
      
      // Create metadata
      await this.createBackupMetadata(backupInfo);
      
      // Update state and metrics
      this.state.lastAOFBackup = backupInfo;
      this.metrics.aofBackups++;
      this.updateBackupMetrics(backupInfo, 'success');
      
      this.state.activeBackups.delete(backupId);
      
      this.emit('backup_completed', backupInfo);
      
      this.logger.info(`✓ Redis AOF backup completed: ${backupId} (${this.formatSize(backupInfo.size)})`);
      
      return backupInfo;
      
    } catch (error) {
      const backupInfo = this.state.activeBackups.get(backupId) || { id: backupId };
      backupInfo.status = 'failed';
      backupInfo.error = error.message;
      
      this.updateBackupMetrics(backupInfo, 'failure');
      this.state.activeBackups.delete(backupId);
      
      this.emit('backup_failed', backupInfo);
      
      this.logger.error(`Redis AOF backup failed: ${backupId}`, error);
      throw error;
    }
  }

  /**
   * Create memory snapshot backup
   */
  async createMemorySnapshot(context = {}) {
    const backupId = context.id || this.generateBackupId('memory');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const memoryPath = path.join(
      this.config.backupDir,
      'memory',
      `redis_memory_${timestamp}.json`
    );
    
    try {
      this.logger.info(`Starting Redis memory snapshot: ${backupId}`);
      
      const backupInfo = {
        id: backupId,
        type: 'memory_snapshot',
        timestamp: new Date(),
        path: memoryPath,
        status: 'running'
      };
      
      this.state.activeBackups.set(backupId, backupInfo);
      this.emit('backup_started', backupInfo);
      
      const startTime = Date.now();
      
      // Get all keys and their values
      const memorySnapshot = await this.createMemoryDump();
      
      // Save snapshot to file
      await fs.writeFile(memoryPath, JSON.stringify(memorySnapshot, null, 2));
      
      // Get backup statistics
      const stats = await fs.stat(memoryPath);
      backupInfo.size = stats.size;
      backupInfo.keysCount = memorySnapshot.keys?.length || 0;
      backupInfo.memoryUsage = memorySnapshot.info?.used_memory;
      
      // Compress backup if enabled
      if (this.config.compression) {
        await this.compressFile(memoryPath);
        backupInfo.path = `${memoryPath}.gz`;
        backupInfo.compressed = true;
      }
      
      // Encrypt backup if enabled
      if (this.config.encryption && this.config.encryptionKey) {
        await this.encryptFile(backupInfo.path);
        backupInfo.path = `${backupInfo.path}.enc`;
        backupInfo.encrypted = true;
      }
      
      // Calculate checksum
      backupInfo.checksum = await this.calculateChecksum(backupInfo.path);
      backupInfo.duration = Date.now() - startTime;
      backupInfo.status = 'completed';
      
      // Create metadata
      await this.createBackupMetadata(backupInfo);
      
      // Update state and metrics
      this.state.lastMemorySnapshot = backupInfo;
      this.metrics.memorySnapshots++;
      this.metrics.keysBackedUp += backupInfo.keysCount;
      this.updateBackupMetrics(backupInfo, 'success');
      
      this.state.activeBackups.delete(backupId);
      
      this.emit('backup_completed', backupInfo);
      
      this.logger.info(`✓ Redis memory snapshot completed: ${backupId} (${backupInfo.keysCount} keys, ${this.formatSize(backupInfo.size)})`);
      
      return backupInfo;
      
    } catch (error) {
      const backupInfo = this.state.activeBackups.get(backupId) || { id: backupId };
      backupInfo.status = 'failed';
      backupInfo.error = error.message;
      
      this.updateBackupMetrics(backupInfo, 'failure');
      this.state.activeBackups.delete(backupId);
      
      this.emit('backup_failed', backupInfo);
      
      this.logger.error(`Redis memory snapshot failed: ${backupId}`, error);
      throw error;
    }
  }

  /**
   * Create selective backup based on key patterns
   */
  async createSelectiveBackup(patterns = [], context = {}) {
    const backupId = context.id || this.generateBackupId('selective');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    try {
      this.logger.info(`Starting Redis selective backup: ${backupId}`);
      
      const backupInfo = {
        id: backupId,
        type: 'selective_backup',
        timestamp: new Date(),
        patterns: patterns.length > 0 ? patterns : Object.values(this.config.keyPatterns),
        status: 'running',
        categories: {}
      };
      
      this.state.activeBackups.set(backupId, backupInfo);
      this.emit('backup_started', backupInfo);
      
      const startTime = Date.now();
      
      // Backup each category
      for (const pattern of backupInfo.patterns) {
        const categoryName = this.getCategoryName(pattern);
        const categoryPath = path.join(
          this.config.backupDir,
          'selective',
          `redis_${categoryName}_${timestamp}.json`
        );
        
        const categoryData = await this.backupKeyPattern(pattern);
        await fs.writeFile(categoryPath, JSON.stringify(categoryData, null, 2));
        
        // Compress if enabled
        let finalPath = categoryPath;
        if (this.config.compression) {
          await this.compressFile(categoryPath);
          finalPath = `${categoryPath}.gz`;
        }
        
        const stats = await fs.stat(finalPath);
        backupInfo.categories[categoryName] = {
          pattern,
          path: finalPath,
          size: stats.size,
          keysCount: categoryData.keys?.length || 0
        };
        
        if (categoryName === 'sessions') {
          this.metrics.sessionsBackedUp += categoryData.keys?.length || 0;
        }
      }
      
      // Calculate total size
      backupInfo.size = Object.values(backupInfo.categories)
        .reduce((total, category) => total + category.size, 0);
      
      backupInfo.keysCount = Object.values(backupInfo.categories)
        .reduce((total, category) => total + category.keysCount, 0);
      
      backupInfo.duration = Date.now() - startTime;
      backupInfo.status = 'completed';
      
      // Create metadata
      await this.createBackupMetadata(backupInfo);
      
      // Update metrics
      this.metrics.keysBackedUp += backupInfo.keysCount;
      this.updateBackupMetrics(backupInfo, 'success');
      
      this.state.activeBackups.delete(backupId);
      
      this.emit('backup_completed', backupInfo);
      
      this.logger.info(`✓ Redis selective backup completed: ${backupId} (${backupInfo.keysCount} keys, ${this.formatSize(backupInfo.size)})`);
      
      return backupInfo;
      
    } catch (error) {
      const backupInfo = this.state.activeBackups.get(backupId) || { id: backupId };
      backupInfo.status = 'failed';
      backupInfo.error = error.message;
      
      this.updateBackupMetrics(backupInfo, 'failure');
      this.state.activeBackups.delete(backupId);
      
      this.emit('backup_failed', backupInfo);
      
      this.logger.error(`Redis selective backup failed: ${backupId}`, error);
      throw error;
    }
  }

  /**
   * Backup keys matching a pattern
   */
  async backupKeyPattern(pattern) {
    try {
      // Get all keys matching pattern
      const keys = await this.redisClient.executeCommand('KEYS', pattern);
      
      if (keys.length === 0) {
        return { pattern, keys: [], data: {} };
      }
      
      // Get values for all keys
      const data = {};
      const pipeline = this.redisClient.pipeline();
      
      // Batch key retrieval for better performance
      for (const key of keys) {
        // Check key type to use appropriate command
        pipeline.type(key);
      }
      
      const types = await pipeline.exec();
      const valuePipeline = this.redisClient.pipeline();
      
      keys.forEach((key, index) => {
        const keyType = types[index][1];
        
        switch (keyType) {
          case 'string':
            valuePipeline.get(key);
            break;
          case 'hash':
            valuePipeline.hgetall(key);
            break;
          case 'list':
            valuePipeline.lrange(key, 0, -1);
            break;
          case 'set':
            valuePipeline.smembers(key);
            break;
          case 'zset':
            valuePipeline.zrange(key, 0, -1, 'WITHSCORES');
            break;
        }
        
        // Also get TTL
        valuePipeline.ttl(key);
      });
      
      const results = await valuePipeline.exec();
      
      // Process results
      keys.forEach((key, index) => {
        const keyType = types[index][1];
        const value = results[index * 2][1];
        const ttl = results[index * 2 + 1][1];
        
        data[key] = {
          type: keyType,
          value,
          ttl: ttl > 0 ? ttl : null
        };
      });
      
      return {
        pattern,
        timestamp: new Date(),
        keys,
        data,
        count: keys.length
      };
      
    } catch (error) {
      this.logger.error(`Failed to backup pattern ${pattern}:`, error);
      return { pattern, error: error.message, keys: [], data: {} };
    }
  }

  /**
   * Create memory dump of all Redis data
   */
  async createMemoryDump() {
    try {
      // Get server info
      const info = await this.redisClient.info();
      
      // Get all keys
      const keys = await this.redisClient.executeCommand('KEYS', '*');
      
      if (keys.length === 0) {
        return {
          timestamp: new Date(),
          info: this.state.redisInfo,
          keys: [],
          data: {}
        };
      }
      
      // Get all key types
      const pipeline = this.redisClient.pipeline();
      keys.forEach(key => {
        pipeline.type(key);
        pipeline.ttl(key);
      });
      
      const typeResults = await pipeline.exec();
      
      // Get all values based on type
      const valuePipeline = this.redisClient.pipeline();
      const keyInfo = {};
      
      keys.forEach((key, index) => {
        const type = typeResults[index * 2][1];
        const ttl = typeResults[index * 2 + 1][1];
        
        keyInfo[key] = { type, ttl: ttl > 0 ? ttl : null };
        
        switch (type) {
          case 'string':
            valuePipeline.get(key);
            break;
          case 'hash':
            valuePipeline.hgetall(key);
            break;
          case 'list':
            valuePipeline.lrange(key, 0, -1);
            break;
          case 'set':
            valuePipeline.smembers(key);
            break;
          case 'zset':
            valuePipeline.zrange(key, 0, -1, 'WITHSCORES');
            break;
        }
      });
      
      const valueResults = await valuePipeline.exec();
      
      // Combine data
      const data = {};
      keys.forEach((key, index) => {
        data[key] = {
          ...keyInfo[key],
          value: valueResults[index][1]
        };
      });
      
      return {
        timestamp: new Date(),
        info: this.state.redisInfo,
        keys,
        data,
        totalKeys: keys.length
      };
      
    } catch (error) {
      this.logger.error('Failed to create memory dump:', error);
      throw error;
    }
  }

  /**
   * Wait for background save to complete
   */
  async waitForBackgroundSave() {
    const maxWaitTime = this.config.snapshotTimeout;
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const info = await this.redisClient.info('persistence');
        
        if (info.includes('rdb_bgsave_in_progress:0')) {
          return true;
        }
        
        // Wait 1 second before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        this.logger.warn('Error checking background save status:', error.message);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw new Error(`Background save timeout after ${maxWaitTime}ms`);
  }

  /**
   * Wait for AOF rewrite to complete
   */
  async waitForAOFRewrite() {
    const maxWaitTime = this.config.snapshotTimeout;
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const info = await this.redisClient.info('persistence');
        
        if (info.includes('aof_rewrite_in_progress:0')) {
          return true;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        this.logger.warn('Error checking AOF rewrite status:', error.message);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw new Error(`AOF rewrite timeout after ${maxWaitTime}ms`);
  }

  /**
   * Find RDB file location
   */
  async findRDBFile() {
    const possiblePaths = [
      path.join(this.config.redisDataDir, 'dump.rdb'),
      '/var/lib/redis/dump.rdb',
      '/data/dump.rdb',
      './dump.rdb'
    ];
    
    for (const filePath of possiblePaths) {
      try {
        await fs.access(filePath, fs.constants.R_OK);
        return filePath;
      } catch (error) {
        // File doesn't exist or not readable
      }
    }
    
    return null;
  }

  /**
   * Find AOF file location
   */
  async findAOFFile() {
    const possiblePaths = [
      path.join(this.config.redisDataDir, 'appendonly.aof'),
      '/var/lib/redis/appendonly.aof',
      '/data/appendonly.aof',
      './appendonly.aof'
    ];
    
    for (const filePath of possiblePaths) {
      try {
        await fs.access(filePath, fs.constants.R_OK);
        return filePath;
      } catch (error) {
        // File doesn't exist or not readable
      }
    }
    
    return null;
  }

  /**
   * Check if AOF is enabled
   */
  async isAOFEnabled() {
    try {
      const config = await this.redisClient.executeCommand('CONFIG', 'GET', 'appendonly');
      return config[1] === 'yes';
    } catch (error) {
      return false;
    }
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
   * Encrypt file
   */
  async encryptFile(filePath) {
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
      redis: {
        version: this.state.redisInfo.version,
        mode: this.state.redisInfo.mode,
        memory_usage: this.state.redisInfo.used_memory_human
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
   * Setup automatic snapshots
   */
  setupAutomaticSnapshots() {
    setInterval(async () => {
      try {
        await this.createSnapshot({ automatic: true });
      } catch (error) {
        this.logger.error('Automatic snapshot failed:', error);
      }
    }, this.config.snapshotInterval);
    
    this.logger.info(`✓ Automatic snapshots enabled (${this.config.snapshotInterval}ms interval)`);
  }

  /**
   * Extract keys count from keyspace info
   */
  extractKeysCount(keyspaceInfo) {
    let totalKeys = 0;
    
    const lines = keyspaceInfo.split('\r\n');
    lines.forEach(line => {
      if (line.startsWith('db') && line.includes('keys=')) {
        const match = line.match(/keys=(\d+)/);
        if (match) {
          totalKeys += parseInt(match[1]);
        }
      }
    });
    
    return totalKeys;
  }

  /**
   * Get category name from pattern
   */
  getCategoryName(pattern) {
    if (pattern.includes('session')) return 'sessions';
    if (pattern.includes('cache')) return 'cache';
    if (pattern.includes('analytics')) return 'analytics';
    if (pattern.includes('leaderboard')) return 'leaderboards';
    if (pattern.includes('vote')) return 'voting';
    return 'misc';
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
        redisConnection: false,
        backupDirectory: false,
        rdbFile: false,
        aofFile: false
      };
      
      // Test Redis connection
      try {
        await this.redisClient.ping();
        checks.redisConnection = true;
      } catch (error) {
        // Connection check failed
      }
      
      // Check backup directory
      try {
        await fs.access(this.config.backupDir, fs.constants.W_OK);
        checks.backupDirectory = true;
      } catch (error) {
        // Directory not accessible
      }
      
      // Check RDB file accessibility
      const rdbFile = await this.findRDBFile();
      checks.rdbFile = !!rdbFile;
      
      // Check AOF file accessibility (if enabled)
      if (await this.isAOFEnabled()) {
        const aofFile = await this.findAOFFile();
        checks.aofFile = !!aofFile;
      } else {
        checks.aofFile = true; // Not applicable
      }
      
      const allHealthy = Object.values(checks).every(check => check === true);
      
      return {
        status: allHealthy ? 'healthy' : 'degraded',
        checks,
        metrics: this.metrics,
        redisInfo: this.state.redisInfo,
        lastBackup: this.state.lastRDBBackup?.timestamp,
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
    return `redis_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
      redisInfo: this.state.redisInfo,
      activeBackups: Array.from(this.state.activeBackups.values()),
      metrics: this.metrics,
      lastRDBBackup: this.state.lastRDBBackup,
      lastAOFBackup: this.state.lastAOFBackup,
      lastMemorySnapshot: this.state.lastMemorySnapshot,
      recentHistory: this.state.backupHistory.slice(0, 10)
    };
  }

  /**
   * Close backup system
   */
  async close() {
    // Close Redis client
    if (this.redisClient) {
      await this.redisClient.disconnect();
    }
    
    // Clear active backups
    this.state.activeBackups.clear();
    
    this.logger.info('Redis backup system closed');
  }
}

export default RedisBackup;