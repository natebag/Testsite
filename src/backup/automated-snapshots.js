/**
 * MLG.clan Platform - Automated Backup and Recovery System
 * Main Backup Orchestrator
 * 
 * Comprehensive backup orchestration system that coordinates automated snapshots
 * across all platform data sources including databases, cache, and file storage.
 * 
 * Features:
 * - Multi-database backup coordination
 * - Automated scheduling with flexible policies
 * - Backup validation and integrity checks
 * - Cross-system consistency verification
 * - Disaster recovery orchestration
 * - Multi-region backup distribution
 * - Monitoring and alerting integration
 * - Recovery time optimization
 * 
 * @author Claude Code - Backup Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

import { EventEmitter } from 'events';
import cron from 'node-cron';
import fs from 'fs/promises';
import path from 'path';
import { PostgreSQLBackup } from './database/postgresql-backup.js';
import { MongoDBBackup } from './database/mongodb-backup.js';
import { CrossDBConsistency } from './database/cross-db-consistency.js';
import { RedisBackup } from './redis/redis-backup.js';
import { FileBackup } from './storage/file-backup.js';
import { CDNSync } from './storage/cdn-sync.js';
import { SnapshotScheduler } from './snapshots/snapshot-scheduler.js';
import { SnapshotValidator } from './snapshots/snapshot-validator.js';
import { RetentionManager } from './snapshots/retention-manager.js';
import { DisasterRecovery } from './recovery/disaster-recovery.js';
import { BackupMonitor } from './monitoring/backup-monitor.js';

export class AutomatedBackupSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Backup storage configuration
      backupRoot: options.backupRoot || process.env.BACKUP_ROOT || '/var/backups/mlg-clan',
      tempDir: options.tempDir || process.env.BACKUP_TEMP || '/tmp/mlg-backups',
      
      // Backup policies
      schedules: {
        hourly: {
          pattern: '0 * * * *', // Every hour
          retention: {
            count: 24,
            duration: '24h'
          },
          types: ['redis', 'postgresql-wal'],
          priority: 'high'
        },
        daily: {
          pattern: '0 2 * * *', // 2 AM daily
          retention: {
            count: 30,
            duration: '30d'
          },
          types: ['postgresql', 'mongodb', 'files'],
          priority: 'critical',
          consistency: true
        },
        weekly: {
          pattern: '0 1 * * 0', // 1 AM every Sunday
          retention: {
            count: 12,
            duration: '90d'
          },
          types: ['full-system'],
          priority: 'critical',
          consistency: true,
          multiRegion: true
        }
      },
      
      // System configuration
      maxConcurrentBackups: options.maxConcurrentBackups || 3,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 5000,
      healthCheckInterval: options.healthCheckInterval || 300000, // 5 minutes
      
      // Performance settings
      compression: options.compression !== false,
      compressionLevel: options.compressionLevel || 6,
      encryption: options.encryption !== false,
      encryptionKey: options.encryptionKey || process.env.BACKUP_ENCRYPTION_KEY,
      
      // Multi-region settings
      regions: options.regions || ['primary', 'secondary'],
      primaryRegion: options.primaryRegion || 'primary',
      
      // Notification settings
      notifications: {
        enabled: options.notifications !== false,
        channels: options.notificationChannels || ['email', 'slack'],
        onSuccess: options.notifyOnSuccess || false,
        onFailure: options.notifyOnFailure !== false,
        onWarning: options.notifyOnWarning !== false
      },
      
      ...options
    };
    
    // Component initialization
    this.components = {
      postgresql: new PostgreSQLBackup(this.config),
      mongodb: new MongoDBBackup(this.config),
      crossDbConsistency: new CrossDBConsistency(this.config),
      redis: new RedisBackup(this.config),
      fileBackup: new FileBackup(this.config),
      cdnSync: new CDNSync(this.config),
      scheduler: new SnapshotScheduler(this.config),
      validator: new SnapshotValidator(this.config),
      retentionManager: new RetentionManager(this.config),
      disasterRecovery: new DisasterRecovery(this.config),
      monitor: new BackupMonitor(this.config)
    };
    
    // State management
    this.state = {
      isInitialized: false,
      isRunning: false,
      activeBackups: new Map(),
      scheduledJobs: new Map(),
      lastFullBackup: null,
      nextScheduledBackup: null,
      systemHealth: 'unknown',
      totalBackupSize: 0,
      backupHistory: []
    };
    
    // Metrics and monitoring
    this.metrics = {
      totalBackups: 0,
      successfulBackups: 0,
      failedBackups: 0,
      averageBackupTime: 0,
      totalBackupTime: 0,
      largestBackupSize: 0,
      smallestBackupSize: 0,
      lastBackupDuration: 0,
      recoveryTestsPassed: 0,
      recoveryTestsFailed: 0
    };
    
    this.logger = options.logger || console;
    
    // Setup component event handlers
    this.setupComponentEventHandlers();
  }

  /**
   * Initialize the backup system
   */
  async initialize() {
    try {
      this.logger.info('Initializing MLG.clan Automated Backup System...');
      
      // Create backup directories
      await this.createBackupDirectories();
      
      // Initialize all components
      await this.initializeComponents();
      
      // Setup backup schedules
      await this.setupBackupSchedules();
      
      // Start monitoring
      await this.startMonitoring();
      
      this.state.isInitialized = true;
      this.state.isRunning = true;
      
      this.emit('initialized', {
        timestamp: new Date(),
        config: this.config,
        components: Object.keys(this.components)
      });
      
      this.logger.info('✓ Automated Backup System initialized successfully');
      
      // Perform initial health check
      const health = await this.performHealthCheck();
      this.logger.info(`✓ System health: ${health.status}`);
      
      return {
        status: 'initialized',
        components: Object.keys(this.components).length,
        schedules: Object.keys(this.config.schedules).length,
        health: health.status
      };
      
    } catch (error) {
      this.logger.error('Failed to initialize backup system:', error);
      this.emit('error', {
        type: 'initialization_failed',
        error: error.message,
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Create backup directory structure
   */
  async createBackupDirectories() {
    const directories = [
      this.config.backupRoot,
      this.config.tempDir,
      path.join(this.config.backupRoot, 'postgresql'),
      path.join(this.config.backupRoot, 'mongodb'),
      path.join(this.config.backupRoot, 'redis'),
      path.join(this.config.backupRoot, 'files'),
      path.join(this.config.backupRoot, 'logs'),
      path.join(this.config.backupRoot, 'metadata'),
      path.join(this.config.backupRoot, 'recovery-tests')
    ];
    
    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
        this.logger.debug(`Created backup directory: ${dir}`);
      } catch (error) {
        if (error.code !== 'EEXIST') {
          throw new Error(`Failed to create backup directory ${dir}: ${error.message}`);
        }
      }
    }
    
    // Set appropriate permissions (Unix systems)
    if (process.platform !== 'win32') {
      try {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        await execAsync(`chmod 750 ${this.config.backupRoot}`);
        await execAsync(`chmod 700 ${this.config.tempDir}`);
      } catch (error) {
        this.logger.warn('Could not set directory permissions:', error.message);
      }
    }
  }

  /**
   * Initialize all backup components
   */
  async initializeComponents() {
    const initPromises = Object.entries(this.components).map(async ([name, component]) => {
      try {
        if (typeof component.initialize === 'function') {
          await component.initialize();
          this.logger.info(`✓ ${name} component initialized`);
        }
      } catch (error) {
        this.logger.error(`Failed to initialize ${name} component:`, error);
        throw new Error(`Component initialization failed: ${name}`);
      }
    });
    
    await Promise.all(initPromises);
  }

  /**
   * Setup automated backup schedules
   */
  async setupBackupSchedules() {
    Object.entries(this.config.schedules).forEach(([scheduleName, schedule]) => {
      const job = cron.schedule(schedule.pattern, async () => {
        await this.executeScheduledBackup(scheduleName, schedule);
      }, {
        scheduled: false,
        timezone: process.env.TZ || 'UTC'
      });
      
      this.state.scheduledJobs.set(scheduleName, job);
      job.start();
      
      this.logger.info(`✓ Scheduled ${scheduleName} backup: ${schedule.pattern}`);
    });
    
    // Calculate next backup time
    this.updateNextBackupTime();
  }

  /**
   * Setup component event handlers
   */
  setupComponentEventHandlers() {
    Object.entries(this.components).forEach(([name, component]) => {
      if (component instanceof EventEmitter) {
        component.on('backup_started', (data) => {
          this.emit('backup_started', { component: name, ...data });
        });
        
        component.on('backup_completed', (data) => {
          this.emit('backup_completed', { component: name, ...data });
          this.updateMetrics('success', data);
        });
        
        component.on('backup_failed', (data) => {
          this.emit('backup_failed', { component: name, ...data });
          this.updateMetrics('failure', data);
        });
        
        component.on('error', (error) => {
          this.emit('component_error', { component: name, error });
        });
      }
    });
  }

  /**
   * Execute a scheduled backup
   */
  async executeScheduledBackup(scheduleName, schedule) {
    const backupId = this.generateBackupId(scheduleName);
    
    try {
      this.logger.info(`Starting ${scheduleName} backup (ID: ${backupId})`);
      
      const backupContext = {
        id: backupId,
        schedule: scheduleName,
        types: schedule.types,
        priority: schedule.priority,
        consistency: schedule.consistency,
        multiRegion: schedule.multiRegion,
        timestamp: new Date(),
        metadata: {
          version: '1.0.0',
          platform: process.platform,
          nodeVersion: process.version,
          systemLoad: await this.getSystemLoad()
        }
      };
      
      // Add to active backups
      this.state.activeBackups.set(backupId, backupContext);
      
      // Execute backup based on types
      const results = await this.executeBackupTypes(schedule.types, backupContext);
      
      // Validate backups if required
      if (schedule.consistency) {
        await this.validateBackupConsistency(results, backupContext);
      }
      
      // Handle multi-region distribution
      if (schedule.multiRegion) {
        await this.distributeToMultipleRegions(results, backupContext);
      }
      
      // Update backup history and metrics
      this.updateBackupHistory(backupContext, results, 'success');
      
      // Clean up old backups based on retention policy
      await this.components.retentionManager.enforceRetention(scheduleName, schedule.retention);
      
      this.state.activeBackups.delete(backupId);
      
      this.emit('scheduled_backup_completed', {
        backupId,
        scheduleName,
        results,
        duration: Date.now() - backupContext.timestamp.getTime()
      });
      
      this.logger.info(`✓ ${scheduleName} backup completed successfully (ID: ${backupId})`);
      
    } catch (error) {
      this.state.activeBackups.delete(backupId);
      
      this.logger.error(`${scheduleName} backup failed (ID: ${backupId}):`, error);
      
      this.emit('scheduled_backup_failed', {
        backupId,
        scheduleName,
        error: error.message,
        timestamp: new Date()
      });
      
      // Send failure notification
      if (this.config.notifications.onFailure) {
        await this.sendNotification('backup_failed', {
          backupId,
          scheduleName,
          error: error.message
        });
      }
    }
  }

  /**
   * Execute backup for specific types
   */
  async executeBackupTypes(types, context) {
    const results = {};
    
    for (const type of types) {
      try {
        this.logger.info(`Executing ${type} backup...`);
        
        switch (type) {
          case 'postgresql':
            results.postgresql = await this.components.postgresql.createFullBackup(context);
            break;
            
          case 'postgresql-wal':
            results.postgresqlWal = await this.components.postgresql.createWALBackup(context);
            break;
            
          case 'mongodb':
            results.mongodb = await this.components.mongodb.createFullBackup(context);
            break;
            
          case 'redis':
            results.redis = await this.components.redis.createSnapshot(context);
            break;
            
          case 'files':
            results.files = await this.components.fileBackup.backupAllFiles(context);
            break;
            
          case 'full-system':
            results = await this.executeFullSystemBackup(context);
            break;
            
          default:
            this.logger.warn(`Unknown backup type: ${type}`);
        }
        
        this.logger.info(`✓ ${type} backup completed`);
        
      } catch (error) {
        this.logger.error(`${type} backup failed:`, error);
        results[type] = { error: error.message };
      }
    }
    
    return results;
  }

  /**
   * Execute full system backup with consistency
   */
  async executeFullSystemBackup(context) {
    const results = {};
    
    try {
      // Create consistency point
      const consistencyPoint = await this.components.crossDbConsistency.createConsistencyPoint();
      
      // Execute all backup types in parallel for speed
      const [postgresql, mongodb, redis, files] = await Promise.all([
        this.components.postgresql.createFullBackup({
          ...context,
          consistencyPoint
        }),
        this.components.mongodb.createFullBackup({
          ...context,
          consistencyPoint
        }),
        this.components.redis.createSnapshot({
          ...context,
          consistencyPoint
        }),
        this.components.fileBackup.backupAllFiles({
          ...context,
          consistencyPoint
        })
      ]);
      
      results.postgresql = postgresql;
      results.mongodb = mongodb;
      results.redis = redis;
      results.files = files;
      results.consistencyPoint = consistencyPoint;
      
      // Verify cross-database consistency
      const consistencyCheck = await this.components.crossDbConsistency.verifyConsistency(
        consistencyPoint,
        results
      );
      
      results.consistencyVerification = consistencyCheck;
      
      if (!consistencyCheck.consistent) {
        throw new Error(`Consistency verification failed: ${consistencyCheck.issues.join(', ')}`);
      }
      
      return results;
      
    } catch (error) {
      this.logger.error('Full system backup failed:', error);
      throw error;
    }
  }

  /**
   * Validate backup consistency
   */
  async validateBackupConsistency(results, context) {
    try {
      const validation = await this.components.validator.validateBackupSet(results, context);
      
      if (!validation.valid) {
        throw new Error(`Backup validation failed: ${validation.issues.join(', ')}`);
      }
      
      this.logger.info('✓ Backup consistency validation passed');
      return validation;
      
    } catch (error) {
      this.logger.error('Backup validation failed:', error);
      throw error;
    }
  }

  /**
   * Distribute backups to multiple regions
   */
  async distributeToMultipleRegions(results, context) {
    try {
      const distributionTasks = this.config.regions.map(async (region) => {
        if (region !== this.config.primaryRegion) {
          return await this.components.cdnSync.syncToRegion(results, region);
        }
      }).filter(Boolean);
      
      const distributionResults = await Promise.all(distributionTasks);
      
      this.logger.info(`✓ Backup distributed to ${distributionResults.length} regions`);
      
      return distributionResults;
      
    } catch (error) {
      this.logger.error('Multi-region distribution failed:', error);
      throw error;
    }
  }

  /**
   * Perform manual backup
   */
  async createManualBackup(types = ['full-system'], options = {}) {
    const backupId = this.generateBackupId('manual');
    
    try {
      this.logger.info(`Starting manual backup (ID: ${backupId})`);
      
      const backupContext = {
        id: backupId,
        schedule: 'manual',
        types,
        priority: options.priority || 'high',
        consistency: options.consistency !== false,
        multiRegion: options.multiRegion || false,
        timestamp: new Date(),
        metadata: {
          initiatedBy: options.user || 'system',
          reason: options.reason || 'manual_backup',
          ...options.metadata
        }
      };
      
      this.state.activeBackups.set(backupId, backupContext);
      
      const results = await this.executeBackupTypes(types, backupContext);
      
      if (backupContext.consistency) {
        await this.validateBackupConsistency(results, backupContext);
      }
      
      if (backupContext.multiRegion) {
        await this.distributeToMultipleRegions(results, backupContext);
      }
      
      this.state.activeBackups.delete(backupId);
      
      this.emit('manual_backup_completed', {
        backupId,
        results,
        duration: Date.now() - backupContext.timestamp.getTime()
      });
      
      this.logger.info(`✓ Manual backup completed successfully (ID: ${backupId})`);
      
      return {
        backupId,
        results,
        status: 'success',
        timestamp: new Date(),
        duration: Date.now() - backupContext.timestamp.getTime()
      };
      
    } catch (error) {
      this.state.activeBackups.delete(backupId);
      
      this.logger.error(`Manual backup failed (ID: ${backupId}):`, error);
      
      this.emit('manual_backup_failed', {
        backupId,
        error: error.message,
        timestamp: new Date()
      });
      
      throw error;
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupId, options = {}) {
    try {
      this.logger.info(`Starting restore from backup: ${backupId}`);
      
      const restoreContext = {
        backupId,
        timestamp: new Date(),
        options,
        pointInTime: options.pointInTime,
        targetSystems: options.systems || ['all'],
        verifyOnly: options.verifyOnly || false
      };
      
      const result = await this.components.disasterRecovery.restoreFromBackup(
        backupId,
        restoreContext
      );
      
      this.emit('restore_completed', {
        backupId,
        result,
        duration: Date.now() - restoreContext.timestamp.getTime()
      });
      
      this.logger.info(`✓ Restore completed successfully from backup: ${backupId}`);
      
      return result;
      
    } catch (error) {
      this.logger.error(`Restore failed from backup ${backupId}:`, error);
      
      this.emit('restore_failed', {
        backupId,
        error: error.message,
        timestamp: new Date()
      });
      
      throw error;
    }
  }

  /**
   * Test backup recovery
   */
  async testBackupRecovery(backupId, options = {}) {
    try {
      const testResult = await this.components.disasterRecovery.testRecovery(backupId, {
        ...options,
        dryRun: true
      });
      
      if (testResult.success) {
        this.metrics.recoveryTestsPassed++;
      } else {
        this.metrics.recoveryTestsFailed++;
      }
      
      this.emit('recovery_test_completed', {
        backupId,
        result: testResult,
        timestamp: new Date()
      });
      
      return testResult;
      
    } catch (error) {
      this.metrics.recoveryTestsFailed++;
      this.logger.error(`Recovery test failed for backup ${backupId}:`, error);
      throw error;
    }
  }

  /**
   * Perform system health check
   */
  async performHealthCheck() {
    try {
      const healthChecks = await Promise.all([
        this.components.monitor.checkSystemHealth(),
        this.checkBackupStorage(),
        this.checkScheduleHealth(),
        this.checkComponentHealth()
      ]);
      
      const overallHealth = {
        status: 'healthy',
        timestamp: new Date(),
        checks: {
          system: healthChecks[0],
          storage: healthChecks[1],
          schedules: healthChecks[2],
          components: healthChecks[3]
        },
        metrics: this.getMetrics()
      };
      
      // Determine overall status
      const hasErrors = healthChecks.some(check => check.status === 'error');
      const hasWarnings = healthChecks.some(check => check.status === 'warning');
      
      if (hasErrors) {
        overallHealth.status = 'error';
      } else if (hasWarnings) {
        overallHealth.status = 'warning';
      }
      
      this.state.systemHealth = overallHealth.status;
      
      this.emit('health_check_completed', overallHealth);
      
      return overallHealth;
      
    } catch (error) {
      const healthError = {
        status: 'error',
        timestamp: new Date(),
        error: error.message
      };
      
      this.state.systemHealth = 'error';
      this.emit('health_check_failed', healthError);
      
      return healthError;
    }
  }

  /**
   * Check backup storage health
   */
  async checkBackupStorage() {
    try {
      const stats = await fs.stat(this.config.backupRoot);
      
      // Check available space (simplified - would use statvfs in production)
      const usage = {
        total: 0,
        used: 0,
        available: 0
      };
      
      return {
        status: 'healthy',
        storage: {
          path: this.config.backupRoot,
          accessible: true,
          usage,
          lastModified: stats.mtime
        }
      };
      
    } catch (error) {
      return {
        status: 'error',
        error: `Storage check failed: ${error.message}`
      };
    }
  }

  /**
   * Check schedule health
   */
  async checkScheduleHealth() {
    const scheduleStatus = Array.from(this.state.scheduledJobs.entries()).map(([name, job]) => ({
      name,
      running: job.getStatus() === 'scheduled',
      nextRun: this.getNextRunTime(name)
    }));
    
    const allSchedulesRunning = scheduleStatus.every(s => s.running);
    
    return {
      status: allSchedulesRunning ? 'healthy' : 'warning',
      schedules: scheduleStatus,
      activeBackups: this.state.activeBackups.size
    };
  }

  /**
   * Check component health
   */
  async checkComponentHealth() {
    const componentHealth = {};
    
    for (const [name, component] of Object.entries(this.components)) {
      try {
        if (typeof component.healthCheck === 'function') {
          componentHealth[name] = await component.healthCheck();
        } else {
          componentHealth[name] = { status: 'unknown' };
        }
      } catch (error) {
        componentHealth[name] = {
          status: 'error',
          error: error.message
        };
      }
    }
    
    const hasErrors = Object.values(componentHealth).some(h => h.status === 'error');
    const hasWarnings = Object.values(componentHealth).some(h => h.status === 'warning');
    
    return {
      status: hasErrors ? 'error' : hasWarnings ? 'warning' : 'healthy',
      components: componentHealth
    };
  }

  /**
   * Start system monitoring
   */
  async startMonitoring() {
    // Start periodic health checks
    setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        this.logger.error('Health check failed:', error);
      }
    }, this.config.healthCheckInterval);
    
    // Start backup monitoring
    await this.components.monitor.startMonitoring();
    
    this.logger.info('✓ Backup system monitoring started');
  }

  /**
   * Stop the backup system
   */
  async stop() {
    try {
      this.logger.info('Stopping automated backup system...');
      
      // Stop all scheduled jobs
      for (const [name, job] of this.state.scheduledJobs.entries()) {
        job.stop();
        this.logger.info(`✓ Stopped ${name} schedule`);
      }
      
      // Wait for active backups to complete
      if (this.state.activeBackups.size > 0) {
        this.logger.info(`Waiting for ${this.state.activeBackups.size} active backups to complete...`);
        
        // Wait up to 10 minutes for active backups
        const timeout = 600000;
        const start = Date.now();
        
        while (this.state.activeBackups.size > 0 && Date.now() - start < timeout) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Stop monitoring
      await this.components.monitor.stopMonitoring();
      
      // Close component connections
      await this.closeComponents();
      
      this.state.isRunning = false;
      
      this.emit('stopped', {
        timestamp: new Date(),
        graceful: true
      });
      
      this.logger.info('✓ Automated backup system stopped');
      
    } catch (error) {
      this.logger.error('Error stopping backup system:', error);
      throw error;
    }
  }

  /**
   * Close all components
   */
  async closeComponents() {
    const closePromises = Object.entries(this.components).map(async ([name, component]) => {
      try {
        if (typeof component.close === 'function') {
          await component.close();
          this.logger.debug(`✓ ${name} component closed`);
        }
      } catch (error) {
        this.logger.error(`Error closing ${name} component:`, error);
      }
    });
    
    await Promise.all(closePromises);
  }

  // Utility methods
  generateBackupId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  updateNextBackupTime() {
    // Implementation would calculate next backup time based on cron schedules
    this.state.nextScheduledBackup = new Date(Date.now() + 3600000); // Placeholder
  }

  updateMetrics(type, data) {
    this.metrics.totalBackups++;
    
    if (type === 'success') {
      this.metrics.successfulBackups++;
    } else {
      this.metrics.failedBackups++;
    }
    
    if (data.duration) {
      this.metrics.totalBackupTime += data.duration;
      this.metrics.averageBackupTime = Math.round(this.metrics.totalBackupTime / this.metrics.totalBackups);
      this.metrics.lastBackupDuration = data.duration;
    }
    
    if (data.size) {
      this.state.totalBackupSize += data.size;
      
      if (data.size > this.metrics.largestBackupSize) {
        this.metrics.largestBackupSize = data.size;
      }
      
      if (this.metrics.smallestBackupSize === 0 || data.size < this.metrics.smallestBackupSize) {
        this.metrics.smallestBackupSize = data.size;
      }
    }
  }

  updateBackupHistory(context, results, status) {
    const historyEntry = {
      id: context.id,
      schedule: context.schedule,
      timestamp: context.timestamp,
      status,
      types: context.types,
      results: Object.keys(results),
      duration: Date.now() - context.timestamp.getTime(),
      size: this.calculateTotalSize(results)
    };
    
    this.state.backupHistory.unshift(historyEntry);
    
    // Keep last 100 entries
    if (this.state.backupHistory.length > 100) {
      this.state.backupHistory = this.state.backupHistory.slice(0, 100);
    }
  }

  calculateTotalSize(results) {
    return Object.values(results).reduce((total, result) => {
      return total + (result.size || 0);
    }, 0);
  }

  async getSystemLoad() {
    try {
      const { loadavg } = await import('os');
      return loadavg();
    } catch (error) {
      return [0, 0, 0];
    }
  }

  getNextRunTime(scheduleName) {
    // Simplified - would use cron-parser in production
    return new Date(Date.now() + 3600000);
  }

  async sendNotification(type, data) {
    try {
      // Implementation would integrate with notification services
      this.logger.info(`Notification: ${type}`, data);
    } catch (error) {
      this.logger.error('Failed to send notification:', error);
    }
  }

  /**
   * Get system metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeBackups: this.state.activeBackups.size,
      scheduledJobs: this.state.scheduledJobs.size,
      totalBackupSize: this.state.totalBackupSize,
      systemHealth: this.state.systemHealth,
      uptime: this.state.isInitialized ? Date.now() - this.state.uptime : 0
    };
  }

  /**
   * Get current system status
   */
  getStatus() {
    return {
      ...this.state,
      metrics: this.getMetrics(),
      components: Object.keys(this.components),
      nextBackup: this.state.nextScheduledBackup,
      recentBackups: this.state.backupHistory.slice(0, 10)
    };
  }
}

// Factory function for creating backup system
export function createBackupSystem(options = {}) {
  return new AutomatedBackupSystem(options);
}

export default AutomatedBackupSystem;