/**
 * Gaming Audit Compression Worker
 * High-performance compression for gaming audit data
 * 
 * @author Claude Code - Security and Performance Auditor
 * @version 1.0.0
 * @created 2025-08-13
 */

import { parentPort } from 'worker_threads';
import zlib from 'zlib';
import crypto from 'crypto';
import { performance } from 'perf_hooks';

/**
 * Compression Worker for Gaming Audit Data
 */
class GamingAuditCompressionWorker {
  constructor() {
    this.compressionLevel = 6; // Balanced performance/compression
    this.encryptionKey = process.env.AUDIT_ENCRYPTION_KEY || 'default-audit-key-change-in-production';
    
    // Performance tracking
    this.performanceMetrics = {
      compressionRatio: [],
      processingTime: [],
      encryptionTime: []
    };
    
    this.setupMessageHandling();
  }
  
  setupMessageHandling() {
    if (parentPort) {
      parentPort.on('message', async (message) => {
        try {
          const result = await this.processCompressionTask(message);
          parentPort.postMessage({
            success: true,
            taskId: message.taskId,
            result
          });
        } catch (error) {
          parentPort.postMessage({
            success: false,
            taskId: message.taskId,
            error: error.message
          });
        }
      });
    }
  }
  
  async processCompressionTask(task) {
    const startTime = performance.now();
    
    const { type, data, options = {} } = task;
    
    switch (type) {
      case 'compress_batch':
        return await this.compressBatch(data, options);
      case 'compress_single':
        return await this.compressSingle(data, options);
      case 'decompress_batch':
        return await this.decompressBatch(data, options);
      case 'encrypt_audit':
        return await this.encryptAudit(data, options);
      default:
        throw new Error(`Unknown compression task type: ${type}`);
    }
  }
  
  async compressBatch(auditBatch, options) {
    const startTime = performance.now();
    
    try {
      // Convert batch to JSON string
      const jsonData = JSON.stringify(auditBatch);
      const originalSize = Buffer.byteLength(jsonData, 'utf8');
      
      // Apply gaming-optimized compression
      const compressed = await this.compressData(jsonData, options);
      const compressedSize = compressed.length;
      
      // Calculate compression metrics
      const compressionRatio = originalSize / compressedSize;
      const processingTime = performance.now() - startTime;
      
      // Track performance
      this.performanceMetrics.compressionRatio.push(compressionRatio);
      this.performanceMetrics.processingTime.push(processingTime);
      
      return {
        compressed,
        originalSize,
        compressedSize,
        compressionRatio,
        processingTime,
        algorithm: 'gzip',
        level: this.compressionLevel
      };
      
    } catch (error) {
      throw new Error(`Batch compression failed: ${error.message}`);
    }
  }
  
  async compressSingle(auditEntry, options) {
    const startTime = performance.now();
    
    try {
      const jsonData = JSON.stringify(auditEntry);
      const originalSize = Buffer.byteLength(jsonData, 'utf8');
      
      const compressed = await this.compressData(jsonData, options);
      const compressedSize = compressed.length;
      
      const compressionRatio = originalSize / compressedSize;
      const processingTime = performance.now() - startTime;
      
      return {
        compressed,
        originalSize,
        compressedSize,
        compressionRatio,
        processingTime
      };
      
    } catch (error) {
      throw new Error(`Single compression failed: ${error.message}`);
    }
  }
  
  async decompressBatch(compressedData, options) {
    const startTime = performance.now();
    
    try {
      const decompressed = await this.decompressData(compressedData, options);
      const auditBatch = JSON.parse(decompressed);
      
      const processingTime = performance.now() - startTime;
      
      return {
        auditBatch,
        processingTime,
        entryCount: Array.isArray(auditBatch) ? auditBatch.length : 1
      };
      
    } catch (error) {
      throw new Error(`Batch decompression failed: ${error.message}`);
    }
  }
  
  async encryptAudit(auditData, options) {
    const startTime = performance.now();
    
    try {
      const jsonData = JSON.stringify(auditData);
      
      // Generate random IV for encryption
      const iv = crypto.randomBytes(16);
      
      // Create cipher with AES-256-CBC
      const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
      cipher.setAutoPadding(true);
      
      // Encrypt the data
      let encrypted = cipher.update(jsonData, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const encryptionTime = performance.now() - startTime;
      this.performanceMetrics.encryptionTime.push(encryptionTime);
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        algorithm: 'aes-256-cbc',
        encryptionTime
      };
      
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }
  
  async compressData(data, options) {
    return new Promise((resolve, reject) => {
      const compressionOptions = {
        level: options.level || this.compressionLevel,
        memLevel: options.memLevel || 8
      };
      
      zlib.gzip(data, compressionOptions, (error, compressed) => {
        if (error) {
          reject(error);
        } else {
          resolve(compressed);
        }
      });
    });
  }
  
  async decompressData(compressedData, options) {
    return new Promise((resolve, reject) => {
      zlib.gunzip(compressedData, (error, decompressed) => {
        if (error) {
          reject(error);
        } else {
          resolve(decompressed.toString('utf8'));
        }
      });
    });
  }
  
  getPerformanceMetrics() {
    const { compressionRatio, processingTime, encryptionTime } = this.performanceMetrics;
    
    return {
      averageCompressionRatio: this.calculateAverage(compressionRatio),
      averageProcessingTime: this.calculateAverage(processingTime),
      averageEncryptionTime: this.calculateAverage(encryptionTime),
      totalTasks: compressionRatio.length
    };
  }
  
  calculateAverage(array) {
    if (array.length === 0) return 0;
    return array.reduce((sum, val) => sum + val, 0) / array.length;
  }
}

// Initialize the compression worker
const compressionWorker = new GamingAuditCompressionWorker();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Gaming audit compression worker shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Gaming audit compression worker shutting down...');
  process.exit(0);
});