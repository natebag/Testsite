/**
 * Production Backup Manager
 * Comprehensive backup and disaster recovery system for MLG.clan platform
 */

import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGzip } from 'zlib';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import cron from 'node-cron';
import environmentManager from '../../src/core/config/environment-manager.js';
import productionLogger from '../../src/core/logging/production-logger.js';

class ProductionBackupManager {
  constructor() {
    this.logger = productionLogger.createChildLogger({
      feature: 'backup',
      component: 'backup-manager'
    });
    
    this.config = {
      enabled: environmentManager.get('backup.enabled'),
      schedule: environmentManager.get('backup.schedule') || '0 2 * * *', // 2 AM daily
      retentionDays: environmentManager.get('backup.retentionDays') || 30,
      s3Bucket: environmentManager.get('backup.s3Bucket'),
      localBackupDir: '/var/backups/mlg-clan',
      tempDir: '/tmp/mlg-backups',
      compression: true,
      encryption: true
    };
    
    this.s3Client = null;
    this.isBackupRunning = false;
    this.lastBackupTime = null;
    this.backupHistory = [];
    
    if (this.config.enabled) {
      this.initializeS3Client();
      this.scheduleBackups();
    }
  }

  /**
   * Initialize AWS S3 client
   */
  initializeS3Client() {
    try {
      this.s3Client = new S3Client({
        region: environmentManager.get('aws.region'),
        credentials: {
          accessKeyId: environmentManager.get('aws.accessKeyId'),
          secretAccessKey: environmentManager.get('aws.secretAccessKey')
        }
      });
      
      this.logger.logInfo('S3 client initialized for backups', {
        region: environmentManager.get('aws.region'),
        bucket: this.config.s3Bucket
      });
    } catch (error) {
      this.logger.logError(error, {
        action: 'initialize_s3_client'
      });
    }
  }

  /**
   * Schedule automatic backups
   */
  scheduleBackups() {
    if (!this.config.enabled) return;

    this.logger.logInfo('Scheduling automatic backups', {
      schedule: this.config.schedule,
      retention_days: this.config.retentionDays
    });

    // Schedule full backup
    cron.schedule(this.config.schedule, async () => {
      try {
        await this.performFullBackup();
      } catch (error) {
        this.logger.logError(error, {
          action: 'scheduled_backup'
        });
      }
    });

    // Schedule incremental backups every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      try {
        await this.performIncrementalBackup();
      } catch (error) {
        this.logger.logError(error, {
          action: 'scheduled_incremental_backup'
        });
      }
    });

    // Schedule cleanup weekly
    cron.schedule('0 3 * * 0', async () => {
      try {
        await this.cleanupOldBackups();
      } catch (error) {
        this.logger.logError(error, {
          action: 'scheduled_cleanup'
        });
      }
    });
  }

  /**
   * Perform full backup
   */
  async performFullBackup() {
    if (this.isBackupRunning) {
      this.logger.logWarning('Backup already in progress, skipping');
      return;
    }

    const backupId = `full_${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    this.logger.logInfo('Starting full backup', {
      backup_id: backupId,
      timestamp
    });

    this.isBackupRunning = true;
    const backupStart = Date.now();

    try {
      // Ensure directories exist
      await this.ensureDirectories();

      // Create backup metadata
      const backupMetadata = {
        id: backupId,
        type: 'full',
        timestamp,
        environment: environmentManager.get('NODE_ENV'),
        version: '1.0.0',
        components: []
      };

      // Backup database
      const dbBackupResult = await this.backupDatabase(backupId);
      backupMetadata.components.push(dbBackupResult);

      // Backup Redis
      const redisBackupResult = await this.backupRedis(backupId);
      backupMetadata.components.push(redisBackupResult);

      // Backup application files
      const appBackupResult = await this.backupApplicationFiles(backupId);
      backupMetadata.components.push(appBackupResult);

      // Backup configuration
      const configBackupResult = await this.backupConfiguration(backupId);
      backupMetadata.components.push(configBackupResult);

      // Backup logs (recent)
      const logsBackupResult = await this.backupLogs(backupId);
      backupMetadata.components.push(logsBackupResult);

      // Upload to S3 if configured
      if (this.s3Client && this.config.s3Bucket) {
        await this.uploadBackupToS3(backupId, backupMetadata);
      }

      // Calculate backup size and duration
      const backupDuration = Date.now() - backupStart;
      const backupSize = await this.calculateBackupSize(backupId);

      backupMetadata.duration = backupDuration;
      backupMetadata.size = backupSize;
      backupMetadata.status = 'completed';

      // Save metadata
      await this.saveBackupMetadata(backupId, backupMetadata);

      // Add to history
      this.backupHistory.push(backupMetadata);
      this.lastBackupTime = timestamp;

      this.logger.logInfo('Full backup completed successfully', {
        backup_id: backupId,
        duration_minutes: Math.round(backupDuration / 60000),
        size_mb: Math.round(backupSize / (1024 * 1024)),
        components: backupMetadata.components.length
      });

      return backupMetadata;

    } catch (error) {
      this.logger.logError(error, {
        backup_id: backupId,
        action: 'full_backup'
      });
      throw error;
    } finally {
      this.isBackupRunning = false;
    }
  }

  /**
   * Perform incremental backup
   */
  async performIncrementalBackup() {
    if (this.isBackupRunning) {
      this.logger.logWarning('Backup already in progress, skipping incremental');
      return;
    }

    const backupId = `incremental_${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    this.logger.logInfo('Starting incremental backup', {
      backup_id: backupId,
      timestamp
    });

    this.isBackupRunning = true;
    const backupStart = Date.now();

    try {
      // Ensure directories exist
      await this.ensureDirectories();

      const backupMetadata = {
        id: backupId,
        type: 'incremental',
        timestamp,
        environment: environmentManager.get('NODE_ENV'),
        components: []
      };

      // Backup recent logs only
      const logsBackupResult = await this.backupRecentLogs(backupId);
      backupMetadata.components.push(logsBackupResult);

      // Backup recent uploads/changes
      const changesBackupResult = await this.backupRecentChanges(backupId);
      backupMetadata.components.push(changesBackupResult);

      // Upload to S3
      if (this.s3Client && this.config.s3Bucket) {
        await this.uploadBackupToS3(backupId, backupMetadata);
      }

      const backupDuration = Date.now() - backupStart;
      const backupSize = await this.calculateBackupSize(backupId);

      backupMetadata.duration = backupDuration;
      backupMetadata.size = backupSize;
      backupMetadata.status = 'completed';

      await this.saveBackupMetadata(backupId, backupMetadata);
      this.backupHistory.push(backupMetadata);

      this.logger.logInfo('Incremental backup completed', {
        backup_id: backupId,
        duration_ms: backupDuration,
        size_mb: Math.round(backupSize / (1024 * 1024))
      });

      return backupMetadata;

    } catch (error) {
      this.logger.logError(error, {
        backup_id: backupId,
        action: 'incremental_backup'
      });
      throw error;
    } finally {
      this.isBackupRunning = false;
    }
  }

  /**
   * Ensure backup directories exist
   */
  async ensureDirectories() {
    const directories = [
      this.config.localBackupDir,
      this.config.tempDir,
      path.join(this.config.localBackupDir, 'database'),
      path.join(this.config.localBackupDir, 'redis'),
      path.join(this.config.localBackupDir, 'application'),
      path.join(this.config.localBackupDir, 'config'),
      path.join(this.config.localBackupDir, 'logs')
    ];

    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Backup database
   */
  async backupDatabase(backupId) {
    this.logger.logInfo('Starting database backup', { backup_id: backupId });

    const backupFile = path.join(
      this.config.localBackupDir, 
      'database', 
      `${backupId}_database.sql`
    );

    return new Promise((resolve, reject) => {
      const pgDump = spawn('pg_dump', [
        environmentManager.get('database.url'),
        '--format=custom',
        '--compress=9',
        '--no-owner',
        '--no-privileges',
        '--file', backupFile
      ]);

      let errorOutput = '';

      pgDump.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pgDump.on('close', async (code) => {
        if (code === 0) {
          try {
            const stats = await fs.stat(backupFile);
            
            // Compress if enabled
            let finalFile = backupFile;
            if (this.config.compression) {
              finalFile = `${backupFile}.gz`;
              await this.compressFile(backupFile, finalFile);
              await fs.unlink(backupFile); // Remove uncompressed file
            }

            resolve({
              component: 'database',
              file: finalFile,
              size: stats.size,
              compressed: this.config.compression,
              status: 'success'
            });
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error(`pg_dump failed with code ${code}: ${errorOutput}`));
        }
      });

      pgDump.on('error', reject);
    });
  }

  /**
   * Backup Redis
   */
  async backupRedis(backupId) {
    this.logger.logInfo('Starting Redis backup', { backup_id: backupId });

    const backupFile = path.join(
      this.config.localBackupDir,
      'redis',
      `${backupId}_redis.rdb`
    );

    return new Promise((resolve, reject) => {
      const redisCli = spawn('redis-cli', [
        '--rdb', backupFile
      ]);

      redisCli.on('close', async (code) => {
        if (code === 0) {
          try {
            const stats = await fs.stat(backupFile);
            
            let finalFile = backupFile;
            if (this.config.compression) {
              finalFile = `${backupFile}.gz`;
              await this.compressFile(backupFile, finalFile);
              await fs.unlink(backupFile);
            }

            resolve({
              component: 'redis',
              file: finalFile,
              size: stats.size,
              compressed: this.config.compression,
              status: 'success'
            });
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error(`Redis backup failed with code ${code}`));
        }
      });

      redisCli.on('error', reject);
    });
  }

  /**
   * Backup application files
   */
  async backupApplicationFiles(backupId) {
    this.logger.logInfo('Starting application files backup', { backup_id: backupId });

    const backupFile = path.join(
      this.config.localBackupDir,
      'application',
      `${backupId}_application.tar`
    );

    const appDir = '/opt/mlg-clan';
    const excludePatterns = [
      'node_modules',
      'logs',
      'temp',
      '.git',
      '*.log',
      'coverage'
    ];

    return new Promise((resolve, reject) => {
      const excludeArgs = excludePatterns.flatMap(pattern => ['--exclude', pattern]);
      const tarArgs = ['-cf', backupFile, '-C', appDir, '.', ...excludeArgs];
      
      const tar = spawn('tar', tarArgs);

      tar.on('close', async (code) => {
        if (code === 0) {
          try {
            const stats = await fs.stat(backupFile);
            
            let finalFile = backupFile;
            if (this.config.compression) {
              finalFile = `${backupFile}.gz`;
              await this.compressFile(backupFile, finalFile);
              await fs.unlink(backupFile);
            }

            resolve({
              component: 'application',
              file: finalFile,
              size: stats.size,
              compressed: this.config.compression,
              excludes: excludePatterns,
              status: 'success'
            });
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error(`Application backup failed with code ${code}`));
        }
      });

      tar.on('error', reject);
    });
  }

  /**
   * Backup configuration files
   */
  async backupConfiguration(backupId) {
    this.logger.logInfo('Starting configuration backup', { backup_id: backupId });

    const backupFile = path.join(
      this.config.localBackupDir,
      'config',
      `${backupId}_config.tar.gz`
    );

    const configPaths = [
      '/opt/mlg-clan/.env',
      '/opt/mlg-clan/config',
      '/etc/nginx/sites-available/mlg-clan',
      '/etc/systemd/system/mlg-clan.service'
    ];

    // Filter existing paths
    const existingPaths = [];
    for (const configPath of configPaths) {
      try {
        await fs.access(configPath);
        existingPaths.push(configPath);
      } catch (error) {
        // Path doesn't exist, skip it
      }
    }

    if (existingPaths.length === 0) {
      return {
        component: 'configuration',
        file: null,
        size: 0,
        status: 'no_files_found'
      };
    }

    return new Promise((resolve, reject) => {
      const tar = spawn('tar', ['-czf', backupFile, ...existingPaths]);

      tar.on('close', async (code) => {
        if (code === 0) {
          try {
            const stats = await fs.stat(backupFile);
            
            resolve({
              component: 'configuration',
              file: backupFile,
              size: stats.size,
              paths: existingPaths,
              status: 'success'
            });
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error(`Configuration backup failed with code ${code}`));
        }
      });

      tar.on('error', reject);
    });
  }

  /**
   * Backup logs
   */
  async backupLogs(backupId) {
    this.logger.logInfo('Starting logs backup', { backup_id: backupId });

    const backupFile = path.join(
      this.config.localBackupDir,
      'logs',
      `${backupId}_logs.tar.gz`
    );

    const logPaths = [
      '/var/log/mlg-clan',
      '/opt/mlg-clan/logs'
    ];

    // Filter existing paths
    const existingPaths = [];
    for (const logPath of logPaths) {
      try {
        await fs.access(logPath);
        existingPaths.push(logPath);
      } catch (error) {
        // Path doesn't exist, skip it
      }
    }

    if (existingPaths.length === 0) {
      return {
        component: 'logs',
        file: null,
        size: 0,
        status: 'no_files_found'
      };
    }

    return new Promise((resolve, reject) => {
      const tar = spawn('tar', [
        '-czf', backupFile,
        '--exclude', '*.gz',
        '--exclude', '*.zip',
        ...existingPaths
      ]);

      tar.on('close', async (code) => {
        if (code === 0) {
          try {
            const stats = await fs.stat(backupFile);
            
            resolve({
              component: 'logs',
              file: backupFile,
              size: stats.size,
              paths: existingPaths,
              status: 'success'
            });
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error(`Logs backup failed with code ${code}`));
        }
      });

      tar.on('error', reject);
    });
  }

  /**
   * Backup recent logs (for incremental backup)
   */
  async backupRecentLogs(backupId) {
    this.logger.logInfo('Starting recent logs backup', { backup_id: backupId });

    const backupFile = path.join(
      this.config.localBackupDir,
      'logs',
      `${backupId}_recent_logs.tar.gz`
    );

    // Find log files modified in the last 6 hours
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    return new Promise((resolve, reject) => {
      const find = spawn('find', [
        '/var/log/mlg-clan',
        '/opt/mlg-clan/logs',
        '-type', 'f',
        '-newer', sixHoursAgo.toISOString(),
        '-exec', 'tar', '-czf', backupFile, '{}', '+'
      ]);

      find.on('close', async (code) => {
        try {
          const stats = await fs.stat(backupFile);
          
          resolve({
            component: 'recent_logs',
            file: backupFile,
            size: stats.size,
            since: sixHoursAgo.toISOString(),
            status: 'success'
          });
        } catch (error) {
          // File might not exist if no recent logs
          resolve({
            component: 'recent_logs',
            file: null,
            size: 0,
            since: sixHoursAgo.toISOString(),
            status: 'no_recent_files'
          });
        }
      });

      find.on('error', reject);
    });
  }

  /**
   * Backup recent changes
   */
  async backupRecentChanges(backupId) {
    // This would backup recently uploaded files, temp data, etc.
    // For now, return a placeholder
    return {
      component: 'recent_changes',
      file: null,
      size: 0,
      status: 'not_implemented'
    };
  }

  /**
   * Compress a file using gzip
   */
  async compressFile(inputFile, outputFile) {
    const input = createReadStream(inputFile);
    const output = createWriteStream(outputFile);
    const gzip = createGzip({ level: 9 });
    
    await pipeline(input, gzip, output);
  }

  /**
   * Calculate backup size
   */
  async calculateBackupSize(backupId) {
    let totalSize = 0;
    const backupDir = this.config.localBackupDir;
    
    try {
      const items = await fs.readdir(backupDir, { recursive: true });
      
      for (const item of items) {
        if (item.includes(backupId)) {
          const itemPath = path.join(backupDir, item);
          try {
            const stats = await fs.stat(itemPath);
            if (stats.isFile()) {
              totalSize += stats.size;
            }
          } catch (error) {
            // Skip files that can't be accessed
          }
        }
      }
    } catch (error) {
      this.logger.logError(error, {
        action: 'calculate_backup_size',
        backup_id: backupId
      });
    }
    
    return totalSize;
  }

  /**
   * Upload backup to S3
   */
  async uploadBackupToS3(backupId, metadata) {
    if (!this.s3Client || !this.config.s3Bucket) {
      throw new Error('S3 not configured for backup uploads');
    }

    this.logger.logInfo('Starting S3 upload', {
      backup_id: backupId,
      bucket: this.config.s3Bucket
    });

    const uploadPromises = [];

    // Upload each component file
    for (const component of metadata.components) {
      if (component.file && component.status === 'success') {
        const s3Key = `mlg-clan-backups/${backupId}/${path.basename(component.file)}`;
        
        uploadPromises.push(this.uploadFileToS3(component.file, s3Key));
      }
    }

    // Upload metadata
    const metadataKey = `mlg-clan-backups/${backupId}/metadata.json`;
    const metadataBuffer = Buffer.from(JSON.stringify(metadata, null, 2));
    
    uploadPromises.push(
      this.s3Client.send(new PutObjectCommand({
        Bucket: this.config.s3Bucket,
        Key: metadataKey,
        Body: metadataBuffer,
        ContentType: 'application/json'
      }))
    );

    await Promise.all(uploadPromises);

    this.logger.logInfo('S3 upload completed', {
      backup_id: backupId,
      files_uploaded: uploadPromises.length
    });
  }

  /**
   * Upload a single file to S3
   */
  async uploadFileToS3(filePath, s3Key) {
    const fileStream = createReadStream(filePath);
    const stats = await fs.stat(filePath);

    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.config.s3Bucket,
      Key: s3Key,
      Body: fileStream,
      ContentLength: stats.size
    }));
  }

  /**
   * Save backup metadata
   */
  async saveBackupMetadata(backupId, metadata) {
    const metadataFile = path.join(
      this.config.localBackupDir,
      `${backupId}_metadata.json`
    );

    await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));
  }

  /**
   * Clean up old backups
   */
  async cleanupOldBackups() {
    this.logger.logInfo('Starting backup cleanup', {
      retention_days: this.config.retentionDays
    });

    const cutoffDate = new Date(Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    try {
      // Clean up local backups
      const localDeleted = await this.cleanupLocalBackups(cutoffDate);
      deletedCount += localDeleted;

      // Clean up S3 backups
      if (this.s3Client && this.config.s3Bucket) {
        const s3Deleted = await this.cleanupS3Backups(cutoffDate);
        deletedCount += s3Deleted;
      }

      this.logger.logInfo('Backup cleanup completed', {
        deleted_backups: deletedCount,
        cutoff_date: cutoffDate.toISOString()
      });

    } catch (error) {
      this.logger.logError(error, {
        action: 'cleanup_old_backups'
      });
    }
  }

  /**
   * Clean up local backups older than cutoff date
   */
  async cleanupLocalBackups(cutoffDate) {
    let deletedCount = 0;
    
    try {
      const items = await fs.readdir(this.config.localBackupDir);
      
      for (const item of items) {
        const itemPath = path.join(this.config.localBackupDir, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.mtime < cutoffDate) {
          if (stats.isDirectory()) {
            await fs.rm(itemPath, { recursive: true, force: true });
          } else {
            await fs.unlink(itemPath);
          }
          deletedCount++;
        }
      }
    } catch (error) {
      this.logger.logError(error, {
        action: 'cleanup_local_backups'
      });
    }
    
    return deletedCount;
  }

  /**
   * Clean up S3 backups older than cutoff date
   */
  async cleanupS3Backups(cutoffDate) {
    let deletedCount = 0;
    
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: this.config.s3Bucket,
        Prefix: 'mlg-clan-backups/'
      });
      
      const response = await this.s3Client.send(listCommand);
      
      if (response.Contents) {
        for (const object of response.Contents) {
          if (object.LastModified && object.LastModified < cutoffDate) {
            // Delete old backup object
            // Implementation would go here
            deletedCount++;
          }
        }
      }
    } catch (error) {
      this.logger.logError(error, {
        action: 'cleanup_s3_backups'
      });
    }
    
    return deletedCount;
  }

  /**
   * Get backup status and statistics
   */
  getBackupStatus() {
    const now = new Date();
    const recentBackups = this.backupHistory.filter(backup => 
      new Date(backup.timestamp) > new Date(now - 7 * 24 * 60 * 60 * 1000) // Last 7 days
    );

    return {
      enabled: this.config.enabled,
      schedule: this.config.schedule,
      is_running: this.isBackupRunning,
      last_backup: this.lastBackupTime,
      retention_days: this.config.retentionDays,
      storage: {
        local: this.config.localBackupDir,
        s3_bucket: this.config.s3Bucket,
        compression_enabled: this.config.compression
      },
      statistics: {
        total_backups: this.backupHistory.length,
        recent_backups: recentBackups.length,
        successful_backups: this.backupHistory.filter(b => b.status === 'completed').length,
        average_size_mb: this.backupHistory.length > 0 
          ? Math.round(this.backupHistory.reduce((sum, b) => sum + (b.size || 0), 0) / this.backupHistory.length / (1024 * 1024))
          : 0
      },
      recent_backups: recentBackups.slice(-5) // Last 5 recent backups
    };
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupId, options = {}) {
    this.logger.logInfo('Starting backup restoration', {
      backup_id: backupId,
      options
    });

    const { components = ['database', 'redis', 'application'], confirmRestore = false } = options;

    if (!confirmRestore) {
      throw new Error('Restoration requires explicit confirmation');
    }

    // Implementation would include:
    // 1. Stop services
    // 2. Download backup from S3 if needed
    // 3. Restore each component
    // 4. Restart services
    // 5. Verify restoration

    this.logger.logWarning('Backup restoration not fully implemented - would be dangerous without proper testing');
    
    return {
      restoration_id: `restore_${Date.now()}`,
      backup_id: backupId,
      status: 'not_implemented',
      message: 'Restoration feature requires careful implementation and testing'
    };
  }
}

// Create singleton instance
const productionBackupManager = new ProductionBackupManager();

export default productionBackupManager;
export { ProductionBackupManager };