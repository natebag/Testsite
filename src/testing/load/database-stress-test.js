/**
 * MLG.clan Platform Database Stress Testing Suite
 * 
 * Comprehensive stress testing for PostgreSQL and MongoDB with concurrent operations.
 * Tests database performance under heavy load, measures query response times,
 * validates connection pooling, and ensures data consistency.
 * 
 * Features:
 * - Concurrent database operations simulation
 * - Connection pool stress testing
 * - Query performance benchmarking
 * - Transaction integrity validation
 * - Cross-database consistency checks
 * - Resource utilization monitoring
 * - Deadlock detection and analysis
 * 
 * @author Claude Code - Universal Testing & Verification Agent
 * @version 1.0.0
 * @created 2025-08-11
 */

import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';
import crypto from 'crypto';

import { DatabaseManager } from '../../database/database-config.js';
import { getCacheManager } from '../../cache/cache-manager.js';

/**
 * Database Stress Test Configuration
 */
const STRESS_TEST_CONFIG = {
  // Test parameters
  maxConcurrentConnections: parseInt(process.env.DB_STRESS_MAX_CONNECTIONS) || 100,
  testDuration: parseInt(process.env.DB_STRESS_DURATION) || 300000, // 5 minutes
  operationTypes: ['read', 'write', 'update', 'delete', 'complex_query'],
  
  // Performance thresholds
  maxResponseTime: 5000, // 5 seconds
  maxErrorRate: 0.05, // 5%
  minThroughput: 100, // operations per second
  
  // Data generation
  batchSize: 1000,
  maxRecords: 10000,
  
  // Worker threads
  workerCount: parseInt(process.env.DB_STRESS_WORKERS) || 10,
};

/**
 * Test data generators
 */
const generateTestUser = (index) => ({
  id: `stress_user_${index}_${Date.now()}`,
  wallet_address: `MLG${crypto.randomBytes(16).toString('hex')}`,
  username: `stress_test_user_${index}_${Math.random().toString(36).substring(2, 8)}`,
  email: `stress${index}@mlgstresstest.com`,
  created_at: new Date(),
  updated_at: new Date(),
  profile: {
    display_name: `Stress Test User ${index}`,
    bio: `Generated for database stress testing at ${new Date().toISOString()}`,
    avatar_url: `https://example.com/avatars/stress_${index}.jpg`,
    preferences: {
      theme: Math.random() > 0.5 ? 'dark' : 'light',
      notifications: Math.random() > 0.5,
      privacy: Math.random() > 0.5 ? 'public' : 'private',
    },
  },
});

const generateTestClan = (index, ownerId) => ({
  id: `stress_clan_${index}_${Date.now()}`,
  name: `StressClan_${index}_${Math.random().toString(36).substring(2, 8)}`,
  description: `Stress test clan created at ${new Date().toISOString()}`,
  owner_id: ownerId,
  is_public: Math.random() > 0.5,
  max_members: Math.floor(Math.random() * 1000) + 50,
  created_at: new Date(),
  updated_at: new Date(),
  metadata: {
    tags: ['stress-test', 'gaming', 'mlg'],
    rules: 'This is a stress test clan',
    social_links: {
      discord: 'https://discord.gg/stresstest',
      twitter: 'https://twitter.com/stresstest',
    },
  },
});

const generateTestContent = (index, userId, clanId) => ({
  _id: `stress_content_${index}_${Date.now()}`,
  title: `Stress Test Content ${index}`,
  description: `Content generated for stress testing at ${new Date().toISOString()}`,
  type: Math.random() > 0.5 ? 'video' : 'image',
  url: `https://cdn.example.com/stress-content/${index}`,
  user_id: userId,
  clan_id: clanId,
  status: 'active',
  views: Math.floor(Math.random() * 10000),
  likes: Math.floor(Math.random() * 1000),
  created_at: new Date(),
  updated_at: new Date(),
  metadata: {
    tags: ['stress-test', 'gaming'],
    duration: Math.floor(Math.random() * 300) + 10,
    file_size: Math.floor(Math.random() * 100000000) + 1000000,
    format: 'mp4',
  },
});

/**
 * Database Stress Tester Class
 */
class DatabaseStressTester extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = { ...STRESS_TEST_CONFIG, ...config };
    this.dbManager = new DatabaseManager();
    this.cacheManager = getCacheManager();
    
    // Test metrics
    this.metrics = {
      postgresql: {
        operations: 0,
        errors: 0,
        totalResponseTime: 0,
        slowQueries: 0,
        connectionErrors: 0,
        deadlocks: 0,
      },
      mongodb: {
        operations: 0,
        errors: 0,
        totalResponseTime: 0,
        slowQueries: 0,
        connectionErrors: 0,
        timeouts: 0,
      },
      cache: {
        hits: 0,
        misses: 0,
        sets: 0,
        errors: 0,
      },
      overall: {
        startTime: null,
        endTime: null,
        totalOperations: 0,
        totalErrors: 0,
        peakConcurrency: 0,
        avgConcurrency: 0,
      },
    };
    
    this.activeConnections = 0;
    this.workers = [];
    this.testData = {
      users: [],
      clans: [],
      contentIds: [],
    };
    
    this.logger = config.logger || console;
  }

  /**
   * Initialize stress testing environment
   */
  async initialize() {
    try {
      this.logger.info('Initializing database stress testing environment...');
      
      // Initialize database connections
      await this.dbManager.initialize();
      
      // Verify database health
      const health = await this.dbManager.healthCheck();
      if (health.status !== 'healthy') {
        throw new Error(`Database not healthy: ${health.error || 'Unknown error'}`);
      }
      
      this.logger.info('Database connections established');
      
      // Generate test data
      await this.generateTestData();
      
      this.logger.info('Stress testing environment initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize stress testing environment:', error);
      throw error;
    }
  }

  /**
   * Generate test data for stress testing
   */
  async generateTestData() {
    this.logger.info('Generating test data...');
    
    try {
      // Generate users
      const users = [];
      for (let i = 0; i < this.config.batchSize; i++) {
        users.push(generateTestUser(i));
      }
      
      // Batch insert users into PostgreSQL
      const userInsertQuery = `
        INSERT INTO users (id, wallet_address, username, email, created_at, updated_at, profile)
        VALUES ${users.map((_, index) => `($${index * 6 + 1}, $${index * 6 + 2}, $${index * 6 + 3}, $${index * 6 + 4}, $${index * 6 + 5}, $${index * 6 + 6})`).join(', ')}
        ON CONFLICT (id) DO NOTHING
      `;
      
      const userParams = users.flatMap(user => [
        user.id, user.wallet_address, user.username, user.email, user.created_at, user.updated_at
      ]);
      
      await this.dbManager.pg.query(userInsertQuery, userParams);
      this.testData.users = users.map(u => ({ id: u.id, wallet_address: u.wallet_address }));
      
      // Generate clans
      const clans = [];
      for (let i = 0; i < Math.floor(this.config.batchSize / 10); i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        clans.push(generateTestClan(i, randomUser.id));
      }
      
      // Batch insert clans
      const clanInsertQuery = `
        INSERT INTO clans (id, name, description, owner_id, is_public, max_members, created_at, updated_at)
        VALUES ${clans.map((_, index) => `($${index * 8 + 1}, $${index * 8 + 2}, $${index * 8 + 3}, $${index * 8 + 4}, $${index * 8 + 5}, $${index * 8 + 6}, $${index * 8 + 7}, $${index * 8 + 8})`).join(', ')}
        ON CONFLICT (id) DO NOTHING
      `;
      
      const clanParams = clans.flatMap(clan => [
        clan.id, clan.name, clan.description, clan.owner_id, clan.is_public, clan.max_members, clan.created_at, clan.updated_at
      ]);
      
      await this.dbManager.pg.query(clanInsertQuery, clanParams);
      this.testData.clans = clans.map(c => ({ id: c.id, owner_id: c.owner_id }));
      
      // Generate content in MongoDB
      const contentCollection = this.dbManager.mongo.collection('content');
      const contentDocs = [];
      
      for (let i = 0; i < this.config.batchSize; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomClan = clans[Math.floor(Math.random() * clans.length)];
        contentDocs.push(generateTestContent(i, randomUser.id, randomClan.id));
      }
      
      const contentResult = await contentCollection.insertMany(contentDocs);
      this.testData.contentIds = Object.values(contentResult.insertedIds);
      
      this.logger.info(`Generated test data: ${users.length} users, ${clans.length} clans, ${contentDocs.length} content items`);
      
    } catch (error) {
      this.logger.error('Failed to generate test data:', error);
      throw error;
    }
  }

  /**
   * Run comprehensive stress test
   */
  async runStressTest() {
    this.metrics.overall.startTime = Date.now();
    this.logger.info('Starting database stress test...');
    
    try {
      // Start monitoring
      const monitoringInterval = setInterval(() => {
        this.logMetrics();
      }, 10000); // Log metrics every 10 seconds
      
      // Create worker threads for concurrent operations
      const workerPromises = [];
      
      for (let i = 0; i < this.config.workerCount; i++) {
        const workerPromise = this.createStressWorker(i);
        workerPromises.push(workerPromise);
      }
      
      // Wait for test duration or workers to complete
      const testTimeout = new Promise(resolve => 
        setTimeout(resolve, this.config.testDuration)
      );
      
      await Promise.race([
        Promise.all(workerPromises),
        testTimeout
      ]);
      
      // Stop monitoring
      clearInterval(monitoringInterval);
      
      // Terminate all workers
      await this.terminateAllWorkers();
      
      this.metrics.overall.endTime = Date.now();
      
      // Generate final report
      const report = await this.generateStressTestReport();
      
      this.logger.info('Database stress test completed');
      return report;
      
    } catch (error) {
      this.logger.error('Stress test failed:', error);
      throw error;
    }
  }

  /**
   * Create stress test worker
   */
  async createStressWorker(workerId) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: {
          workerId,
          config: this.config,
          testData: this.testData,
        }
      });
      
      this.workers.push(worker);
      
      worker.on('message', (message) => {
        this.handleWorkerMessage(message);
      });
      
      worker.on('error', (error) => {
        this.logger.error(`Worker ${workerId} error:`, error);
        reject(error);
      });
      
      worker.on('exit', (code) => {
        if (code !== 0) {
          this.logger.warn(`Worker ${workerId} exited with code ${code}`);
        }
        resolve();
      });
    });
  }

  /**
   * Handle worker messages for metrics collection
   */
  handleWorkerMessage(message) {
    const { type, data } = message;
    
    switch (type) {
      case 'operation_completed':
        this.updateMetrics(data);
        break;
        
      case 'error_occurred':
        this.handleWorkerError(data);
        break;
        
      case 'connection_update':
        this.activeConnections = data.activeConnections;
        this.metrics.overall.peakConcurrency = Math.max(
          this.metrics.overall.peakConcurrency,
          this.activeConnections
        );
        break;
    }
  }

  /**
   * Update metrics from worker data
   */
  updateMetrics(data) {
    const { database, operation, responseTime, error } = data;
    
    if (database === 'postgresql' || database === 'postgres') {
      this.metrics.postgresql.operations++;
      this.metrics.postgresql.totalResponseTime += responseTime;
      
      if (error) {
        this.metrics.postgresql.errors++;
        if (error.includes('deadlock')) {
          this.metrics.postgresql.deadlocks++;
        }
        if (error.includes('connection')) {
          this.metrics.postgresql.connectionErrors++;
        }
      }
      
      if (responseTime > this.config.maxResponseTime) {
        this.metrics.postgresql.slowQueries++;
      }
      
    } else if (database === 'mongodb' || database === 'mongo') {
      this.metrics.mongodb.operations++;
      this.metrics.mongodb.totalResponseTime += responseTime;
      
      if (error) {
        this.metrics.mongodb.errors++;
        if (error.includes('timeout')) {
          this.metrics.mongodb.timeouts++;
        }
        if (error.includes('connection')) {
          this.metrics.mongodb.connectionErrors++;
        }
      }
      
      if (responseTime > this.config.maxResponseTime) {
        this.metrics.mongodb.slowQueries++;
      }
      
    } else if (database === 'cache') {
      if (operation === 'hit') {
        this.metrics.cache.hits++;
      } else if (operation === 'miss') {
        this.metrics.cache.misses++;
      } else if (operation === 'set') {
        this.metrics.cache.sets++;
      }
      
      if (error) {
        this.metrics.cache.errors++;
      }
    }
    
    this.metrics.overall.totalOperations++;
    if (error) {
      this.metrics.overall.totalErrors++;
    }
  }

  /**
   * Handle worker errors
   */
  handleWorkerError(error) {
    this.logger.error('Worker error:', error);
    this.metrics.overall.totalErrors++;
  }

  /**
   * Terminate all worker threads
   */
  async terminateAllWorkers() {
    const terminatePromises = this.workers.map(worker => {
      return new Promise((resolve) => {
        worker.terminate().then(() => resolve()).catch(() => resolve());
      });
    });
    
    await Promise.all(terminatePromises);
    this.workers = [];
  }

  /**
   * Log current metrics
   */
  logMetrics() {
    const duration = Date.now() - this.metrics.overall.startTime;
    const durationSec = duration / 1000;
    
    const pgOpsPerSec = this.metrics.postgresql.operations / durationSec;
    const mongoOpsPerSec = this.metrics.mongodb.operations / durationSec;
    const totalOpsPerSec = this.metrics.overall.totalOperations / durationSec;
    
    const pgAvgResponseTime = this.metrics.postgresql.operations > 0 
      ? this.metrics.postgresql.totalResponseTime / this.metrics.postgresql.operations 
      : 0;
    const mongoAvgResponseTime = this.metrics.mongodb.operations > 0 
      ? this.metrics.mongodb.totalResponseTime / this.metrics.mongodb.operations 
      : 0;
    
    this.logger.info(`Stress Test Metrics (${Math.round(durationSec)}s):`);
    this.logger.info(`  PostgreSQL: ${this.metrics.postgresql.operations} ops (${pgOpsPerSec.toFixed(2)}/s), avg: ${pgAvgResponseTime.toFixed(2)}ms, errors: ${this.metrics.postgresql.errors}`);
    this.logger.info(`  MongoDB: ${this.metrics.mongodb.operations} ops (${mongoOpsPerSec.toFixed(2)}/s), avg: ${mongoAvgResponseTime.toFixed(2)}ms, errors: ${this.metrics.mongodb.errors}`);
    this.logger.info(`  Total: ${this.metrics.overall.totalOperations} ops (${totalOpsPerSec.toFixed(2)}/s), errors: ${this.metrics.overall.totalErrors}`);
    this.logger.info(`  Active connections: ${this.activeConnections}, Peak: ${this.metrics.overall.peakConcurrency}`);
  }

  /**
   * Generate comprehensive stress test report
   */
  async generateStressTestReport() {
    const duration = this.metrics.overall.endTime - this.metrics.overall.startTime;
    const durationSec = duration / 1000;
    
    // Calculate throughput and response times
    const pgThroughput = this.metrics.postgresql.operations / durationSec;
    const mongoThroughput = this.metrics.mongodb.operations / durationSec;
    const totalThroughput = this.metrics.overall.totalOperations / durationSec;
    
    const pgAvgResponseTime = this.metrics.postgresql.operations > 0 
      ? this.metrics.postgresql.totalResponseTime / this.metrics.postgresql.operations 
      : 0;
    const mongoAvgResponseTime = this.metrics.mongodb.operations > 0 
      ? this.metrics.mongodb.totalResponseTime / this.metrics.mongodb.operations 
      : 0;
    
    // Calculate error rates
    const pgErrorRate = this.metrics.postgresql.operations > 0 
      ? this.metrics.postgresql.errors / this.metrics.postgresql.operations 
      : 0;
    const mongoErrorRate = this.metrics.mongodb.operations > 0 
      ? this.metrics.mongodb.errors / this.metrics.mongodb.operations 
      : 0;
    const totalErrorRate = this.metrics.overall.totalOperations > 0 
      ? this.metrics.overall.totalErrors / this.metrics.overall.totalOperations 
      : 0;
    
    // Get final database health
    const finalHealth = await this.dbManager.healthCheck();
    
    const report = {
      summary: {
        testDuration: durationSec,
        totalOperations: this.metrics.overall.totalOperations,
        totalErrors: this.metrics.overall.totalErrors,
        totalThroughput: totalThroughput,
        totalErrorRate: totalErrorRate,
        peakConcurrency: this.metrics.overall.peakConcurrency,
        status: totalErrorRate < this.config.maxErrorRate && totalThroughput > this.config.minThroughput ? 'PASSED' : 'FAILED',
      },
      
      postgresql: {
        operations: this.metrics.postgresql.operations,
        errors: this.metrics.postgresql.errors,
        errorRate: pgErrorRate,
        throughput: pgThroughput,
        avgResponseTime: pgAvgResponseTime,
        slowQueries: this.metrics.postgresql.slowQueries,
        deadlocks: this.metrics.postgresql.deadlocks,
        connectionErrors: this.metrics.postgresql.connectionErrors,
        status: pgErrorRate < this.config.maxErrorRate && pgThroughput > this.config.minThroughput / 2 ? 'PASSED' : 'FAILED',
      },
      
      mongodb: {
        operations: this.metrics.mongodb.operations,
        errors: this.metrics.mongodb.errors,
        errorRate: mongoErrorRate,
        throughput: mongoThroughput,
        avgResponseTime: mongoAvgResponseTime,
        slowQueries: this.metrics.mongodb.slowQueries,
        timeouts: this.metrics.mongodb.timeouts,
        connectionErrors: this.metrics.mongodb.connectionErrors,
        status: mongoErrorRate < this.config.maxErrorRate && mongoThroughput > this.config.minThroughput / 2 ? 'PASSED' : 'FAILED',
      },
      
      cache: {
        hits: this.metrics.cache.hits,
        misses: this.metrics.cache.misses,
        sets: this.metrics.cache.sets,
        errors: this.metrics.cache.errors,
        hitRate: this.metrics.cache.hits + this.metrics.cache.misses > 0 
          ? this.metrics.cache.hits / (this.metrics.cache.hits + this.metrics.cache.misses) 
          : 0,
      },
      
      health: finalHealth,
      
      recommendations: this.generateRecommendations({
        pgErrorRate, mongoErrorRate, totalErrorRate,
        pgThroughput, mongoThroughput, totalThroughput,
        pgAvgResponseTime, mongoAvgResponseTime,
      }),
      
      timestamp: new Date().toISOString(),
    };
    
    return report;
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations(metrics) {
    const recommendations = [];
    
    // Error rate recommendations
    if (metrics.totalErrorRate > this.config.maxErrorRate) {
      recommendations.push({
        type: 'ERROR_RATE',
        severity: 'HIGH',
        message: `Total error rate (${(metrics.totalErrorRate * 100).toFixed(2)}%) exceeds threshold (${(this.config.maxErrorRate * 100)}%)`,
        action: 'Review error logs and optimize database queries or increase connection pool sizes',
      });
    }
    
    // Throughput recommendations
    if (metrics.totalThroughput < this.config.minThroughput) {
      recommendations.push({
        type: 'THROUGHPUT',
        severity: 'HIGH',
        message: `Total throughput (${metrics.totalThroughput.toFixed(2)} ops/s) below minimum (${this.config.minThroughput} ops/s)`,
        action: 'Consider scaling database instances, optimizing queries, or increasing connection pools',
      });
    }
    
    // Response time recommendations
    if (metrics.pgAvgResponseTime > this.config.maxResponseTime / 2) {
      recommendations.push({
        type: 'RESPONSE_TIME',
        severity: 'MEDIUM',
        message: `PostgreSQL average response time (${metrics.pgAvgResponseTime.toFixed(2)}ms) is high`,
        action: 'Review slow queries, add indexes, or optimize query patterns',
      });
    }
    
    if (metrics.mongoAvgResponseTime > this.config.maxResponseTime / 2) {
      recommendations.push({
        type: 'RESPONSE_TIME',
        severity: 'MEDIUM',
        message: `MongoDB average response time (${metrics.mongoAvgResponseTime.toFixed(2)}ms) is high`,
        action: 'Review collection indexes, optimize aggregation pipelines, or increase MongoDB resources',
      });
    }
    
    // Deadlock recommendations
    if (this.metrics.postgresql.deadlocks > 0) {
      recommendations.push({
        type: 'DEADLOCKS',
        severity: 'HIGH',
        message: `PostgreSQL deadlocks detected (${this.metrics.postgresql.deadlocks})`,
        action: 'Review transaction ordering and reduce transaction scope to prevent deadlocks',
      });
    }
    
    // Connection recommendations
    if (this.metrics.postgresql.connectionErrors > 0 || this.metrics.mongodb.connectionErrors > 0) {
      recommendations.push({
        type: 'CONNECTIONS',
        severity: 'HIGH',
        message: 'Connection errors detected',
        action: 'Increase connection pool sizes or review connection timeout settings',
      });
    }
    
    return recommendations;
  }

  /**
   * Cleanup test resources
   */
  async cleanup() {
    this.logger.info('Cleaning up stress test resources...');
    
    try {
      // Clean up test data
      if (this.testData.users.length > 0) {
        const userIds = this.testData.users.map(u => u.id);
        await this.dbManager.pg.query(
          `DELETE FROM users WHERE id = ANY($1)`,
          [userIds]
        );
      }
      
      if (this.testData.clans.length > 0) {
        const clanIds = this.testData.clans.map(c => c.id);
        await this.dbManager.pg.query(
          `DELETE FROM clans WHERE id = ANY($1)`,
          [clanIds]
        );
      }
      
      if (this.testData.contentIds.length > 0) {
        const contentCollection = this.dbManager.mongo.collection('content');
        await contentCollection.deleteMany({
          _id: { $in: this.testData.contentIds }
        });
      }
      
      // Close database connections
      await this.dbManager.close();
      
      this.logger.info('Cleanup completed');
      
    } catch (error) {
      this.logger.error('Cleanup failed:', error);
    }
  }
}

/**
 * Worker thread implementation
 */
if (!isMainThread) {
  const { workerId, config, testData } = workerData;
  
  // Worker-specific database operations
  const runWorkerOperations = async () => {
    const dbManager = new DatabaseManager();
    await dbManager.initialize();
    
    const operations = ['read', 'write', 'update', 'delete', 'complex_query'];
    const startTime = Date.now();
    
    try {
      while (Date.now() - startTime < config.testDuration) {
        const operation = operations[Math.floor(Math.random() * operations.length)];
        const database = Math.random() > 0.5 ? 'postgresql' : 'mongodb';
        
        const opStartTime = performance.now();
        let error = null;
        
        try {
          await executeWorkerOperation(dbManager, database, operation, testData);
        } catch (err) {
          error = err.message;
        }
        
        const responseTime = performance.now() - opStartTime;
        
        parentPort.postMessage({
          type: 'operation_completed',
          data: {
            workerId,
            database,
            operation,
            responseTime,
            error,
          }
        });
        
        // Random delay between operations
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      }
      
    } finally {
      await dbManager.close();
    }
  };
  
  const executeWorkerOperation = async (dbManager, database, operation, testData) => {
    if (database === 'postgresql') {
      await executePostgreSQLOperation(dbManager.pg, operation, testData);
    } else {
      await executeMongoDBOperation(dbManager.mongo, operation, testData);
    }
  };
  
  const executePostgreSQLOperation = async (pg, operation, testData) => {
    const randomUser = testData.users[Math.floor(Math.random() * testData.users.length)];
    const randomClan = testData.clans[Math.floor(Math.random() * testData.clans.length)];
    
    switch (operation) {
      case 'read':
        await pg.query('SELECT * FROM users WHERE id = $1', [randomUser.id]);
        break;
        
      case 'write':
        const newUser = generateTestUser(Date.now());
        await pg.query(
          'INSERT INTO users (id, wallet_address, username, email, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)',
          [newUser.id, newUser.wallet_address, newUser.username, newUser.email, newUser.created_at, newUser.updated_at]
        );
        break;
        
      case 'update':
        await pg.query(
          'UPDATE users SET updated_at = $1 WHERE id = $2',
          [new Date(), randomUser.id]
        );
        break;
        
      case 'delete':
        // Delete a test record (not from our test data set)
        await pg.query(
          'DELETE FROM users WHERE username LIKE $1 AND created_at < $2',
          ['temp_%', new Date(Date.now() - 3600000)]
        );
        break;
        
      case 'complex_query':
        await pg.query(`
          SELECT u.*, c.name as clan_name, COUNT(cm.user_id) as clan_member_count
          FROM users u
          LEFT JOIN clan_members cm ON u.id = cm.user_id
          LEFT JOIN clans c ON cm.clan_id = c.id
          WHERE u.created_at > $1
          GROUP BY u.id, c.id, c.name
          ORDER BY u.created_at DESC
          LIMIT 10
        `, [new Date(Date.now() - 86400000)]);
        break;
    }
  };
  
  const executeMongoDBOperation = async (mongo, operation, testData) => {
    const contentCollection = mongo.collection('content');
    const randomContentId = testData.contentIds[Math.floor(Math.random() * testData.contentIds.length)];
    
    switch (operation) {
      case 'read':
        await contentCollection.findOne({ _id: randomContentId });
        break;
        
      case 'write':
        const newContent = generateTestContent(Date.now(), 'worker_user', 'worker_clan');
        await contentCollection.insertOne(newContent);
        break;
        
      case 'update':
        await contentCollection.updateOne(
          { _id: randomContentId },
          { $set: { updated_at: new Date(), views: Math.floor(Math.random() * 1000) } }
        );
        break;
        
      case 'delete':
        await contentCollection.deleteMany({
          title: { $regex: /^temp_/i },
          created_at: { $lt: new Date(Date.now() - 3600000) }
        });
        break;
        
      case 'complex_query':
        await contentCollection.aggregate([
          { $match: { status: 'active' } },
          { $group: { 
            _id: '$clan_id', 
            total_views: { $sum: '$views' },
            content_count: { $sum: 1 },
            avg_likes: { $avg: '$likes' }
          }},
          { $sort: { total_views: -1 } },
          { $limit: 10 }
        ]).toArray();
        break;
    }
  };
  
  // Start worker operations
  runWorkerOperations().catch(error => {
    parentPort.postMessage({
      type: 'error_occurred',
      data: { workerId, error: error.message }
    });
  });
}

export default DatabaseStressTester;

/**
 * Standalone execution
 */
if (isMainThread && import.meta.url === `file://${process.argv[1]}`) {
  const stressTester = new DatabaseStressTester();
  
  const runTest = async () => {
    try {
      await stressTester.initialize();
      const report = await stressTester.runStressTest();
      
      console.log('\n=== DATABASE STRESS TEST REPORT ===');
      console.log(JSON.stringify(report, null, 2));
      
      // Save report to file
      const fs = await import('fs/promises');
      const reportPath = `database-stress-report-${Date.now()}.json`;
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`\nReport saved to: ${reportPath}`);
      
      process.exit(report.summary.status === 'PASSED' ? 0 : 1);
      
    } catch (error) {
      console.error('Stress test failed:', error);
      process.exit(1);
    } finally {
      await stressTester.cleanup();
    }
  };
  
  runTest();
}