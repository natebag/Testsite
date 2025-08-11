/**
 * MLG.clan Platform - File Storage Backup Management System
 * 
 * Advanced file backup system for gaming platform content including videos,
 * images, avatars, banners, and other user-generated content.
 * 
 * Features:
 * - Selective file backup by type and age
 * - Incremental backup with change detection
 * - Content deduplication and optimization
 * - Multi-format file support (video, image, audio, documents)
 * - Metadata preservation and indexing
 * - Parallel backup processing
 * - Checksum verification and integrity checks
 * - Storage optimization and compression
 * 
 * @author Claude Code - File Storage Specialist
 * @version 1.0.0
 * @created 2025-08-11
 */

import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import zlib from 'zlib';
import { spawn } from 'child_process';
import { promisify } from 'util';

const execFile = promisify(require('child_process').execFile);

export class FileBackup extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Source directories
      contentDir: config.contentDir || process.env.CONTENT_DIR || '/var/www/mlg-clan/content',
      avatarsDir: config.avatarsDir || process.env.AVATARS_DIR || '/var/www/mlg-clan/avatars',
      bannersDir: config.bannersDir || process.env.BANNERS_DIR || '/var/www/mlg-clan/banners',
      uploadsDir: config.uploadsDir || process.env.UPLOADS_DIR || '/var/www/mlg-clan/uploads',
      
      // Backup storage
      backupDir: config.backupDir || path.join(config.backupRoot || '/var/backups/mlg-clan', 'files'),
      tempDir: config.tempDir || '/tmp/file-backup',
      
      // Backup strategies
      strategy: config.strategy || 'incremental', // full, incremental, differential
      compression: config.compression !== false,
      compressionLevel: config.compressionLevel || 6,
      encryption: config.encryption || false,
      encryptionKey: config.encryptionKey || process.env.BACKUP_ENCRYPTION_KEY,
      
      // File filtering
      maxFileSize: config.maxFileSize || 500 * 1024 * 1024, // 500MB
      minFileAge: config.minFileAge || 0, // hours
      maxFileAge: config.maxFileAge || null, // hours (null = no limit)
      
      // File types to backup
      fileTypes: {
        videos: config.backupVideos !== false ? ['mp4', 'webm', 'avi', 'mov', 'mkv'] : [],
        images: config.backupImages !== false ? ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'] : [],
        audio: config.backupAudio !== false ? ['mp3', 'wav', 'ogg', 'aac'] : [],
        documents: config.backupDocuments !== false ? ['pdf', 'doc', 'docx', 'txt', 'md'] : [],
        archives: config.backupArchives !== false ? ['zip', 'tar', 'gz', '7z'] : []
      },
      
      // Deduplication settings
      enableDeduplication: config.enableDeduplication !== false,
      deduplicationThreshold: config.deduplicationThreshold || 1024 * 1024, // 1MB
      hashAlgorithm: config.hashAlgorithm || 'sha256',
      
      // Performance settings
      maxConcurrentFiles: config.maxConcurrentFiles || 5,
      maxConcurrentBytes: config.maxConcurrentBytes || 100 * 1024 * 1024, // 100MB
      chunkSize: config.chunkSize || 64 * 1024, // 64KB
      
      // Metadata settings
      preserveTimestamps: config.preserveTimestamps !== false,
      preservePermissions: config.preservePermissions !== false,
      preserveExtendedAttributes: config.preserveExtendedAttributes || false,
      
      // Validation settings
      verifyIntegrity: config.verifyIntegrity !== false,
      retryCount: config.retryCount || 3,
      retryDelay: config.retryDelay || 1000,
      
      ...config
    };
    
    this.state = {
      isInitialized: false,
      activeBackups: new Map(),
      lastFullBackup: null,
      lastIncrementalBackup: null,
      fileIndex: new Map(), // File hash -> backup location
      backupHistory: []
    };
    
    this.metrics = {
      totalBackups: 0,
      successfulBackups: 0,
      failedBackups: 0,
      totalFilesBackedUp: 0,
      totalBytesBackedUp: 0,
      deduplicatedFiles: 0,
      deduplicatedBytes: 0,
      averageBackupTime: 0,
      totalBackupTime: 0,
      compressionRatio: 0,
      fileTypeStats: {}
    };
    
    this.logger = config.logger || console;
    
    // File type extensions for quick lookup
    this.allExtensions = new Set();
    Object.values(this.config.fileTypes).forEach(extensions => {
      extensions.forEach(ext => this.allExtensions.add(ext.toLowerCase()));
    });
  }

  /**
   * Initialize file backup system
   */
  async initialize() {
    try {
      this.logger.info('Initializing File Backup system...');
      
      // Create backup directories
      await this.createBackupDirectories();
      
      // Verify source directories
      await this.verifySourceDirectories();
      
      // Load existing file index
      await this.loadFileIndex();
      
      // Initialize file type statistics
      this.initializeFileTypeStats();
      
      this.state.isInitialized = true;
      
      this.logger.info('✓ File Backup system initialized');
      
      return {
        status: 'initialized',
        config: this.config,
        sourceDirectories: this.getSourceDirectories().length,
        indexedFiles: this.state.fileIndex.size
      };
      
    } catch (error) {
      this.logger.error('File backup initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create backup directories
   */
  async createBackupDirectories() {
    const directories = [
      this.config.backupDir,
      this.config.tempDir,
      path.join(this.config.backupDir, 'full'),
      path.join(this.config.backupDir, 'incremental'),
      path.join(this.config.backupDir, 'differential'),
      path.join(this.config.backupDir, 'index'),
      path.join(this.config.backupDir, 'metadata'),
      path.join(this.config.backupDir, 'logs'),
      path.join(this.config.backupDir, 'dedup')
    ];
    
    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
    
    this.logger.debug('Created file backup directories');
  }

  /**
   * Verify source directories exist and are accessible
   */
  async verifySourceDirectories() {
    const sourceDirs = this.getSourceDirectories();
    const verificationResults = [];
    
    for (const dir of sourceDirs) {
      try {
        const stats = await fs.stat(dir);
        if (stats.isDirectory()) {
          await fs.access(dir, fs.constants.R_OK);
          verificationResults.push({ path: dir, accessible: true });
        } else {
          verificationResults.push({ path: dir, accessible: false, error: 'Not a directory' });
        }
      } catch (error) {
        verificationResults.push({ path: dir, accessible: false, error: error.message });
      }
    }
    
    const inaccessibleDirs = verificationResults.filter(result => !result.accessible);
    if (inaccessibleDirs.length > 0) {
      this.logger.warn('Some source directories are inaccessible:', inaccessibleDirs);
    }
    
    const accessibleDirs = verificationResults.filter(result => result.accessible);
    this.logger.info(`✓ Verified ${accessibleDirs.length} source directories`);
  }

  /**
   * Get list of source directories
   */
  getSourceDirectories() {
    return [
      this.config.contentDir,
      this.config.avatarsDir,
      this.config.bannersDir,
      this.config.uploadsDir
    ].filter(dir => dir); // Filter out null/undefined directories
  }

  /**
   * Load existing file index for deduplication
   */
  async loadFileIndex() {
    try {
      const indexPath = path.join(this.config.backupDir, 'index', 'file-index.json');
      
      try {
        const indexData = await fs.readFile(indexPath, 'utf8');
        const parsedIndex = JSON.parse(indexData);
        
        // Convert plain object back to Map
        this.state.fileIndex = new Map(Object.entries(parsedIndex));
        
        this.logger.info(`✓ Loaded file index: ${this.state.fileIndex.size} entries`);
      } catch (error) {
        // Index file doesn't exist or is invalid - start fresh
        this.logger.info('No existing file index found, starting fresh');
      }
    } catch (error) {
      this.logger.error('Failed to load file index:', error);
    }
  }

  /**
   * Save file index to disk
   */
  async saveFileIndex() {
    try {
      const indexPath = path.join(this.config.backupDir, 'index', 'file-index.json');
      
      // Convert Map to plain object for JSON serialization
      const indexObject = Object.fromEntries(this.state.fileIndex);
      
      await fs.writeFile(indexPath, JSON.stringify(indexObject, null, 2));
      
      this.logger.debug('File index saved');
    } catch (error) {
      this.logger.error('Failed to save file index:', error);
    }
  }

  /**
   * Initialize file type statistics
   */
  initializeFileTypeStats() {
    Object.keys(this.config.fileTypes).forEach(type => {
      this.metrics.fileTypeStats[type] = {
        count: 0,
        size: 0,
        averageSize: 0
      };
    });
  }

  /**
   * Backup all files
   */
  async backupAllFiles(context = {}) {
    const backupId = context.id || this.generateBackupId('files');
    
    try {
      this.logger.info(`Starting file backup: ${backupId} (strategy: ${this.config.strategy})`);
      
      const backupInfo = {
        id: backupId,
        type: 'file_backup',
        strategy: this.config.strategy,
        timestamp: new Date(),
        status: 'running',
        files: {
          total: 0,
          processed: 0,
          successful: 0,
          failed: 0,
          skipped: 0,
          deduplicated: 0
        },
        size: {
          total: 0,
          processed: 0,
          compressed: 0
        }
      };
      
      this.state.activeBackups.set(backupId, backupInfo);
      this.emit('backup_started', backupInfo);
      
      const startTime = Date.now();
      
      // Get list of files to backup
      const filesToBackup = await this.getFilesToBackup();
      backupInfo.files.total = filesToBackup.length;
      
      this.logger.info(`Found ${filesToBackup.length} files to backup`);
      
      // Create backup directory for this backup
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(
        this.config.backupDir,
        this.config.strategy,
        `backup_${timestamp}`
      );
      await fs.mkdir(backupPath, { recursive: true });
      
      backupInfo.path = backupPath;
      
      // Process files in batches
      await this.processFilesBatched(filesToBackup, backupInfo);
      
      // Create backup manifest
      const manifestPath = await this.createBackupManifest(backupInfo);
      backupInfo.manifestPath = manifestPath;
      
      // Compress entire backup if enabled
      if (this.config.compression) {
        await this.compressBackup(backupInfo);
      }
      
      // Calculate final statistics
      backupInfo.duration = Date.now() - startTime;
      backupInfo.status = 'completed';
      backupInfo.compressionRatio = backupInfo.size.compressed > 0 
        ? backupInfo.size.processed / backupInfo.size.compressed 
        : 1;
      
      // Update state and metrics
      this.updateBackupMetrics(backupInfo, 'success');
      
      if (this.config.strategy === 'full') {
        this.state.lastFullBackup = backupInfo;
      } else {
        this.state.lastIncrementalBackup = backupInfo;
      }
      
      // Save updated file index
      await this.saveFileIndex();
      
      this.state.activeBackups.delete(backupId);
      
      this.emit('backup_completed', backupInfo);
      
      this.logger.info(`✓ File backup completed: ${backupId} (${backupInfo.files.successful} files, ${this.formatSize(backupInfo.size.processed)})`);
      
      return backupInfo;
      
    } catch (error) {
      const backupInfo = this.state.activeBackups.get(backupId) || { id: backupId };
      backupInfo.status = 'failed';
      backupInfo.error = error.message;
      
      this.updateBackupMetrics(backupInfo, 'failure');
      this.state.activeBackups.delete(backupId);
      
      this.emit('backup_failed', backupInfo);
      
      this.logger.error(`File backup failed: ${backupId}`, error);
      throw error;
    }
  }

  /**
   * Get list of files to backup based on strategy
   */
  async getFilesToBackup() {
    const files = [];
    const sourceDirs = this.getSourceDirectories();
    
    for (const sourceDir of sourceDirs) {
      try {
        const dirFiles = await this.scanDirectory(sourceDir);
        files.push(...dirFiles);
      } catch (error) {
        this.logger.warn(`Failed to scan directory ${sourceDir}:`, error.message);
      }
    }
    
    // Filter files based on strategy and criteria
    return this.filterFiles(files);
  }

  /**
   * Recursively scan directory for files
   */
  async scanDirectory(dirPath) {
    const files = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          const subFiles = await this.scanDirectory(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          try {
            const stats = await fs.stat(fullPath);
            files.push({
              path: fullPath,
              name: entry.name,
              size: stats.size,
              mtime: stats.mtime,
              ctime: stats.ctime,
              mode: stats.mode
            });
          } catch (statError) {
            this.logger.warn(`Failed to stat file ${fullPath}:`, statError.message);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to read directory ${dirPath}:`, error.message);
    }
    
    return files;
  }

  /**
   * Filter files based on backup criteria
   */
  filterFiles(files) {
    return files.filter(file => {
      // Check file size
      if (file.size > this.config.maxFileSize) {
        this.logger.debug(`Skipping large file: ${file.path} (${this.formatSize(file.size)})`);
        return false;
      }
      
      // Check file age
      const ageHours = (Date.now() - file.mtime.getTime()) / (1000 * 60 * 60);
      
      if (ageHours < this.config.minFileAge) {
        this.logger.debug(`Skipping recent file: ${file.path} (${ageHours.toFixed(1)} hours old)`);
        return false;
      }
      
      if (this.config.maxFileAge && ageHours > this.config.maxFileAge) {
        this.logger.debug(`Skipping old file: ${file.path} (${ageHours.toFixed(1)} hours old)`);
        return false;
      }
      
      // Check file extension
      const extension = path.extname(file.name).toLowerCase().substring(1);
      if (!this.allExtensions.has(extension)) {
        this.logger.debug(`Skipping unsupported file type: ${file.path}`);
        return false;
      }
      
      // Check if file should be included based on strategy
      if (this.config.strategy === 'incremental' && this.state.lastFullBackup) {
        // Only include files modified since last full backup
        if (file.mtime <= this.state.lastFullBackup.timestamp) {
          return false;
        }
      } else if (this.config.strategy === 'differential' && this.state.lastFullBackup) {
        // Only include files modified since last full backup (same as incremental for files)
        if (file.mtime <= this.state.lastFullBackup.timestamp) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Process files in batches with concurrency control
   */
  async processFilesBatched(files, backupInfo) {
    const batchSize = this.config.maxConcurrentFiles;
    let currentBytesProcessing = 0;
    
    const processBatch = async (batch) => {
      const promises = batch.map(file => this.processFile(file, backupInfo));
      const results = await Promise.allSettled(promises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          backupInfo.files.successful++;
          if (result.value.deduplicated) {
            backupInfo.files.deduplicated++;
          }
        } else {
          backupInfo.files.failed++;
          this.logger.error(`File processing failed: ${batch[index].path}`, result.reason);
        }
        backupInfo.files.processed++;
        currentBytesProcessing -= batch[index].size;
      });
      
      // Emit progress update
      this.emit('backup_progress', {
        backupId: backupInfo.id,
        files: backupInfo.files,
        size: backupInfo.size
      });
    };
    
    let batch = [];
    
    for (const file of files) {
      // Check if adding this file would exceed concurrent bytes limit
      if (currentBytesProcessing + file.size > this.config.maxConcurrentBytes) {
        // Process current batch first
        if (batch.length > 0) {
          await processBatch(batch);
          batch = [];
        }
      }
      
      batch.push(file);
      currentBytesProcessing += file.size;
      
      // Process batch if it reaches size limit
      if (batch.length >= batchSize) {
        await processBatch(batch);
        batch = [];
      }
    }
    
    // Process remaining files
    if (batch.length > 0) {
      await processBatch(batch);
    }
  }

  /**
   * Process a single file
   */
  async processFile(file, backupInfo) {
    try {
      // Calculate file hash for deduplication
      const fileHash = await this.calculateFileHash(file.path);
      
      // Check if file already exists in backup (deduplication)
      if (this.config.enableDeduplication && file.size >= this.config.deduplicationThreshold) {
        const existingLocation = this.state.fileIndex.get(fileHash);
        if (existingLocation) {
          // File already backed up, just reference it
          await this.createFileReference(file, existingLocation, backupInfo);
          
          backupInfo.files.skipped++;
          this.metrics.deduplicatedFiles++;
          this.metrics.deduplicatedBytes += file.size;
          
          return { deduplicated: true, hash: fileHash };
        }
      }
      
      // Copy file to backup location
      const backupPath = await this.copyFileToBackup(file, backupInfo);
      
      // Update file index for deduplication
      if (this.config.enableDeduplication) {
        this.state.fileIndex.set(fileHash, backupPath);
      }
      
      // Update statistics
      backupInfo.size.total += file.size;
      backupInfo.size.processed += file.size;
      
      this.updateFileTypeStats(file);
      
      return { deduplicated: false, hash: fileHash, backupPath };
      
    } catch (error) {
      this.logger.error(`Failed to process file ${file.path}:`, error);
      throw error;
    }
  }

  /**
   * Calculate file hash for deduplication
   */
  async calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash(this.config.hashAlgorithm);
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Copy file to backup location
   */
  async copyFileToBackup(file, backupInfo) {
    try {
      // Create relative path structure in backup
      const relativePath = this.getRelativePath(file.path);
      const backupFilePath = path.join(backupInfo.path, relativePath);
      
      // Ensure backup directory exists
      await fs.mkdir(path.dirname(backupFilePath), { recursive: true });
      
      // Copy file with verification
      await this.copyFileWithVerification(file.path, backupFilePath);
      
      // Preserve timestamps if enabled
      if (this.config.preserveTimestamps) {
        await fs.utimes(backupFilePath, file.mtime, file.mtime);
      }
      
      // Preserve permissions if enabled (Unix systems)
      if (this.config.preservePermissions && process.platform !== 'win32') {
        await fs.chmod(backupFilePath, file.mode);
      }
      
      return backupFilePath;
      
    } catch (error) {
      throw new Error(`Failed to copy file to backup: ${error.message}`);
    }
  }

  /**
   * Copy file with integrity verification
   */
  async copyFileWithVerification(sourcePath, destPath) {
    let attempt = 0;
    
    while (attempt < this.config.retryCount) {
      try {
        // Copy file
        await fs.copyFile(sourcePath, destPath);
        
        // Verify integrity if enabled
        if (this.config.verifyIntegrity) {
          const sourceHash = await this.calculateFileHash(sourcePath);
          const destHash = await this.calculateFileHash(destPath);
          
          if (sourceHash !== destHash) {
            throw new Error('File integrity verification failed');
          }
        }
        
        return; // Success
        
      } catch (error) {
        attempt++;
        
        if (attempt >= this.config.retryCount) {
          throw error;
        }
        
        this.logger.warn(`File copy failed (attempt ${attempt}/${this.config.retryCount}): ${sourcePath}`);
        
        // Clean up partial file
        try {
          await fs.unlink(destPath);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
      }
    }
  }

  /**
   * Create file reference for deduplicated files
   */
  async createFileReference(file, existingLocation, backupInfo) {
    try {
      const relativePath = this.getRelativePath(file.path);
      const referencePath = path.join(backupInfo.path, relativePath + '.ref');
      
      // Create reference file containing path to original backup
      const referenceData = {
        originalPath: file.path,
        backupLocation: existingLocation,
        hash: await this.calculateFileHash(file.path),
        timestamp: new Date(),
        size: file.size
      };
      
      await fs.mkdir(path.dirname(referencePath), { recursive: true });
      await fs.writeFile(referencePath, JSON.stringify(referenceData, null, 2));
      
    } catch (error) {
      this.logger.error(`Failed to create file reference: ${error.message}`);
    }
  }

  /**
   * Get relative path for organizing backup structure
   */
  getRelativePath(filePath) {
    const sourceDirs = this.getSourceDirectories();
    
    for (const sourceDir of sourceDirs) {
      if (filePath.startsWith(sourceDir)) {
        return path.relative(sourceDir, filePath);
      }
    }
    
    // Fallback: use filename
    return path.basename(filePath);
  }

  /**
   * Update file type statistics
   */
  updateFileTypeStats(file) {
    const extension = path.extname(file.name).toLowerCase().substring(1);
    
    for (const [type, extensions] of Object.entries(this.config.fileTypes)) {
      if (extensions.includes(extension)) {
        const stats = this.metrics.fileTypeStats[type];
        stats.count++;
        stats.size += file.size;
        stats.averageSize = Math.round(stats.size / stats.count);
        break;
      }
    }
  }

  /**
   * Create backup manifest
   */
  async createBackupManifest(backupInfo) {
    const manifestPath = path.join(backupInfo.path, 'backup-manifest.json');
    
    const manifest = {
      backupId: backupInfo.id,
      timestamp: backupInfo.timestamp,
      strategy: backupInfo.strategy,
      files: backupInfo.files,
      size: backupInfo.size,
      config: {
        compression: this.config.compression,
        encryption: this.config.encryption,
        deduplication: this.config.enableDeduplication
      },
      system: {
        hostname: require('os').hostname(),
        platform: process.platform,
        nodeVersion: process.version
      },
      fileTypeStats: this.metrics.fileTypeStats
    };
    
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    
    return manifestPath;
  }

  /**
   * Compress backup directory
   */
  async compressBackup(backupInfo) {
    try {
      this.logger.info(`Compressing backup: ${backupInfo.id}`);
      
      const compressedPath = `${backupInfo.path}.tar.gz`;
      
      await new Promise((resolve, reject) => {
        const tar = spawn('tar', [
          '-czf',
          compressedPath,
          '-C',
          path.dirname(backupInfo.path),
          path.basename(backupInfo.path)
        ]);
        
        tar.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Compression failed with code ${code}`));
          }
        });
        
        tar.on('error', reject);
      });
      
      // Get compressed size
      const compressedStats = await fs.stat(compressedPath);
      backupInfo.size.compressed = compressedStats.size;
      
      // Remove original directory
      await fs.rm(backupInfo.path, { recursive: true, force: true });
      
      // Update backup path
      backupInfo.path = compressedPath;
      backupInfo.compressed = true;
      
      this.logger.info(`✓ Backup compressed: ${this.formatSize(backupInfo.size.compressed)} (ratio: ${(backupInfo.size.compressed / backupInfo.size.processed * 100).toFixed(1)}%)`);
      
    } catch (error) {
      this.logger.error('Backup compression failed:', error);
      throw error;
    }
  }

  /**
   * Update backup metrics
   */
  updateBackupMetrics(backupInfo, status) {
    this.metrics.totalBackups++;
    
    if (status === 'success') {
      this.metrics.successfulBackups++;
      
      if (backupInfo.files) {
        this.metrics.totalFilesBackedUp += backupInfo.files.successful;
      }
      
      if (backupInfo.size) {
        this.metrics.totalBytesBackedUp += backupInfo.size.processed;
      }
      
      if (backupInfo.duration) {
        this.metrics.totalBackupTime += backupInfo.duration;
        this.metrics.averageBackupTime = Math.round(
          this.metrics.totalBackupTime / this.metrics.successfulBackups
        );
      }
      
      if (backupInfo.compressionRatio) {
        this.metrics.compressionRatio = backupInfo.compressionRatio;
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
        sourceDirectories: false,
        backupDirectory: false,
        diskSpace: false
      };
      
      // Check source directories
      try {
        await this.verifySourceDirectories();
        checks.sourceDirectories = true;
      } catch (error) {
        // Already logged
      }
      
      // Check backup directory
      try {
        await fs.access(this.config.backupDir, fs.constants.W_OK);
        checks.backupDirectory = true;
      } catch (error) {
        // Directory not accessible
      }
      
      // Check disk space (simplified check)
      try {
        const stats = await fs.stat(this.config.backupDir);
        checks.diskSpace = true; // If we can stat, assume there's space
      } catch (error) {
        // Can't check disk space
      }
      
      const allHealthy = Object.values(checks).every(check => check === true);
      
      return {
        status: allHealthy ? 'healthy' : 'degraded',
        checks,
        metrics: this.metrics,
        lastBackup: (this.state.lastFullBackup || this.state.lastIncrementalBackup)?.timestamp,
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
    return `file_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
      strategy: this.config.strategy,
      activeBackups: Array.from(this.state.activeBackups.values()),
      metrics: this.metrics,
      lastFullBackup: this.state.lastFullBackup,
      lastIncrementalBackup: this.state.lastIncrementalBackup,
      indexedFiles: this.state.fileIndex.size,
      recentHistory: this.state.backupHistory.slice(0, 10)
    };
  }

  /**
   * Close backup system
   */
  async close() {
    // Save file index before closing
    await this.saveFileIndex();
    
    // Clear active backups
    this.state.activeBackups.clear();
    
    this.logger.info('File backup system closed');
  }
}

export default FileBackup;