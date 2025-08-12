/**
 * MLG.clan Platform Database Configuration and Connection Management
 * 
 * Centralized database configuration for PostgreSQL and MongoDB connections
 * with connection pooling, health checks, and environment-based settings.
 * 
 * Features:
 * - Environment-based configuration
 * - Connection pooling for both PostgreSQL and MongoDB
 * - Health monitoring and reconnection logic
 * - Transaction management utilities
 * - Database migration support
 * - Performance monitoring and logging
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-10
 */

import pg from 'pg';
import { MongoClient } from 'mongodb';
import { MONGODB_CONFIG, initializeCollections, healthCheck as mongoHealthCheck } from './mongodb-collections.js';

const { Pool } = pg;

/**
 * Environment Configuration
 */
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const IS_DEVELOPMENT = NODE_ENV === 'development';
const IS_TEST = NODE_ENV === 'test';

/**
 * PostgreSQL Configuration
 */
export const POSTGRESQL_CONFIG = {
  // Connection settings
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT) || 5432,
  database: process.env.POSTGRES_DATABASE || 'mlg_clan',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  
  // SSL Configuration
  ssl: IS_PRODUCTION ? {
    rejectUnauthorized: true,
    ca: process.env.POSTGRES_SSL_CA,
    cert: process.env.POSTGRES_SSL_CERT,
    key: process.env.POSTGRES_SSL_KEY
  } : false,
  
  // Connection Pool Settings
  min: parseInt(process.env.POSTGRES_POOL_MIN) || 2,
  max: parseInt(process.env.POSTGRES_POOL_MAX) || 20,
  idle: parseInt(process.env.POSTGRES_POOL_IDLE) || 10000,
  acquire: parseInt(process.env.POSTGRES_POOL_ACQUIRE) || 60000,
  evict: parseInt(process.env.POSTGRES_POOL_EVICT) || 1000,
  
  // Query settings
  statement_timeout: parseInt(process.env.POSTGRES_STATEMENT_TIMEOUT) || 30000,
  query_timeout: parseInt(process.env.POSTGRES_QUERY_TIMEOUT) || 30000,
  connectionTimeoutMillis: parseInt(process.env.POSTGRES_CONNECTION_TIMEOUT) || 5000,
  idleTimeoutMillis: parseInt(process.env.POSTGRES_IDLE_TIMEOUT) || 30000,
  
  // Application name for monitoring
  application_name: process.env.POSTGRES_APP_NAME || 'mlg_clan_platform',
  
  // Performance and debugging
  log_statement: IS_DEVELOPMENT ? 'all' : 'none',
  log_duration: IS_DEVELOPMENT,
  
  // Timezone
  timezone: process.env.TZ || 'UTC'
};

/**
 * MongoDB Configuration (extends from mongodb-collections.js)
 */
export const MONGODB_EXTENDED_CONFIG = {
  ...MONGODB_CONFIG,
  
  // Connection URI
  uri: process.env.MONGODB_URI || 
       process.env.MONGO_CONNECTION_STRING || 
       `mongodb://${process.env.MONGO_HOST || 'localhost'}:${process.env.MONGO_PORT || 27017}/${MONGODB_CONFIG.database}`,
  
  // Authentication
  username: process.env.MONGO_USERNAME,
  password: process.env.MONGO_PASSWORD,
  authSource: process.env.MONGO_AUTH_SOURCE || 'admin',
  
  // Extended options
  options: {
    ...MONGODB_CONFIG.options,
    
    // Connection pool settings
    minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE) || 5,
    maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE) || 50,
    maxIdleTimeMS: parseInt(process.env.MONGO_MAX_IDLE_TIME) || 30000,
    waitQueueTimeoutMS: parseInt(process.env.MONGO_WAIT_QUEUE_TIMEOUT) || 10000,
    
    // Timeout settings
    serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT) || 5000,
    socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT) || 45000,
    connectTimeoutMS: parseInt(process.env.MONGO_CONNECT_TIMEOUT) || 10000,
    
    // Monitoring and logging
    monitorCommands: IS_DEVELOPMENT,
    loggerLevel: IS_DEVELOPMENT ? 'debug' : 'error',
    
    // SSL/TLS
    tls: IS_PRODUCTION,
    tlsCAFile: process.env.MONGO_TLS_CA_FILE,
    tlsCertificateKeyFile: process.env.MONGO_TLS_CERT_KEY_FILE,
    tlsAllowInvalidCertificates: IS_DEVELOPMENT,
    tlsAllowInvalidHostnames: IS_DEVELOPMENT,
    
    // Application name
    appName: process.env.MONGO_APP_NAME || 'mlg_clan_platform'
  }
};

/**
 * Database Connection Classes
 */

/**
 * PostgreSQL Connection Manager
 */
export class PostgreSQLManager {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = parseInt(process.env.POSTGRES_MAX_RETRIES) || 5;
    this.retryDelay = parseInt(process.env.POSTGRES_RETRY_DELAY) || 5000;
    
    // Performance monitoring
    this.queryCount = 0;
    this.errorCount = 0;
    this.totalQueryTime = 0;
    this.lastHealthCheck = null;
  }

  /**
   * Initialize PostgreSQL connection pool
   */
  async connect() {
    try {
      console.log('Initializing PostgreSQL connection pool...');
      
      this.pool = new Pool({
        ...POSTGRESQL_CONFIG,
        
        // Connection event handlers
        log: (msg) => {
          if (IS_DEVELOPMENT) {
            console.log(`[PostgreSQL] ${msg}`);
          }
        }
      });

      // Handle pool events
      this.pool.on('connect', (client) => {
        console.log(`[PostgreSQL] New client connected (total: ${this.pool.totalCount})`);
        
        // Set session variables
        client.query(`
          SET timezone = '${POSTGRESQL_CONFIG.timezone}';
          SET statement_timeout = '${POSTGRESQL_CONFIG.statement_timeout}ms';
        `).catch(err => {
          console.warn('[PostgreSQL] Failed to set session variables:', err.message);
        });
      });

      this.pool.on('acquire', (client) => {
        if (IS_DEVELOPMENT) {
          console.log(`[PostgreSQL] Client acquired (idle: ${this.pool.idleCount}, total: ${this.pool.totalCount})`);
        }
      });

      this.pool.on('error', (err, client) => {
        console.error('[PostgreSQL] Pool error:', err);
        this.errorCount++;
        this.isConnected = false;
      });

      this.pool.on('remove', (client) => {
        console.log(`[PostgreSQL] Client removed (total: ${this.pool.totalCount})`);
      });

      // Test connection
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
      client.release();

      this.isConnected = true;
      this.connectionAttempts = 0;

      console.log('✓ PostgreSQL connected successfully');
      console.log(`✓ Server time: ${result.rows[0].current_time}`);
      console.log(`✓ Version: ${result.rows[0].postgres_version.split(' ')[0]} ${result.rows[0].postgres_version.split(' ')[1]}`);

      return this.pool;

    } catch (error) {
      console.error('PostgreSQL connection failed:', error);
      this.isConnected = false;
      this.connectionAttempts++;

      if (this.connectionAttempts < this.maxRetries) {
        console.log(`Retrying PostgreSQL connection in ${this.retryDelay}ms... (attempt ${this.connectionAttempts}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.connect();
      } else {
        throw new Error(`PostgreSQL connection failed after ${this.maxRetries} attempts: ${error.message}`);
      }
    }
  }

  /**
   * Execute a query with performance monitoring
   */
  async query(text, params = []) {
    const startTime = Date.now();
    
    try {
      if (!this.isConnected) {
        throw new Error('PostgreSQL not connected');
      }

      const result = await this.pool.query(text, params);
      
      // Performance tracking
      const queryTime = Date.now() - startTime;
      this.queryCount++;
      this.totalQueryTime += queryTime;

      if (IS_DEVELOPMENT && queryTime > 1000) {
        console.warn(`[PostgreSQL] Slow query detected (${queryTime}ms):`, text.substring(0, 100));
      }

      return result;

    } catch (error) {
      this.errorCount++;
      console.error('[PostgreSQL] Query error:', error);
      throw error;
    }
  }

  /**
   * Execute a transaction
   */
  async transaction(callback) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      const result = await this.query(`
        SELECT 
          NOW() as current_time,
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
          (SELECT setting FROM pg_settings WHERE name = 'max_connections') as max_connections
      `);
      
      const responseTime = Date.now() - startTime;
      const stats = result.rows[0];
      
      this.lastHealthCheck = {
        timestamp: new Date(),
        status: 'healthy',
        responseTime,
        activeConnections: parseInt(stats.active_connections),
        maxConnections: parseInt(stats.max_connections),
        poolStats: {
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount,
          waitingCount: this.pool.waitingCount
        },
        queryStats: {
          totalQueries: this.queryCount,
          totalErrors: this.errorCount,
          avgQueryTime: this.queryCount > 0 ? Math.round(this.totalQueryTime / this.queryCount) : 0
        }
      };

      return this.lastHealthCheck;

    } catch (error) {
      this.lastHealthCheck = {
        timestamp: new Date(),
        status: 'unhealthy',
        error: error.message
      };
      
      return this.lastHealthCheck;
    }
  }

  /**
   * Close connection pool
   */
  async close() {
    if (this.pool) {
      console.log('Closing PostgreSQL connection pool...');
      await this.pool.end();
      this.isConnected = false;
      console.log('✓ PostgreSQL connection pool closed');
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      connectionAttempts: this.connectionAttempts,
      queryCount: this.queryCount,
      errorCount: this.errorCount,
      avgQueryTime: this.queryCount > 0 ? Math.round(this.totalQueryTime / this.queryCount) : 0,
      lastHealthCheck: this.lastHealthCheck,
      poolStats: this.pool ? {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      } : null
    };
  }
}

/**
 * MongoDB Connection Manager
 */
export class MongoDBManager {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = parseInt(process.env.MONGO_MAX_RETRIES) || 5;
    this.retryDelay = parseInt(process.env.MONGO_RETRY_DELAY) || 5000;
    
    // Performance monitoring
    this.operationCount = 0;
    this.errorCount = 0;
    this.lastHealthCheck = null;
    
    // Collection references
    this.collections = {};
  }

  /**
   * Initialize MongoDB connection
   */
  async connect() {
    try {
      console.log('Initializing MongoDB connection...');
      
      this.client = new MongoClient(MONGODB_EXTENDED_CONFIG.uri, MONGODB_EXTENDED_CONFIG.options);
      
      // Connection event handlers
      this.client.on('serverOpening', () => {
        console.log('[MongoDB] Server connection opening...');
      });

      this.client.on('serverClosed', () => {
        console.log('[MongoDB] Server connection closed');
        this.isConnected = false;
      });

      this.client.on('error', (error) => {
        console.error('[MongoDB] Connection error:', error);
        this.errorCount++;
        this.isConnected = false;
      });

      this.client.on('timeout', () => {
        console.warn('[MongoDB] Connection timeout');
      });

      // Connect to MongoDB
      await this.client.connect();
      this.db = this.client.db(MONGODB_CONFIG.database);

      // Test connection
      const adminDb = this.client.db('admin');
      const result = await adminDb.command({ ping: 1, serverStatus: 1 });

      this.isConnected = true;
      this.connectionAttempts = 0;

      // Initialize collections
      console.log('Initializing MongoDB collections...');
      const collectionResults = await initializeCollections(this.client);
      
      // Store collection references
      Object.keys(collectionResults).forEach(collectionName => {
        this.collections[collectionName] = this.db.collection(collectionName);
      });

      console.log('✓ MongoDB connected successfully');
      console.log(`✓ Database: ${MONGODB_CONFIG.database}`);
      console.log(`✓ Collections initialized: ${Object.keys(collectionResults).length}`);

      return this.client;

    } catch (error) {
      console.error('MongoDB connection failed:', error);
      this.isConnected = false;
      this.connectionAttempts++;

      if (this.connectionAttempts < this.maxRetries) {
        console.log(`Retrying MongoDB connection in ${this.retryDelay}ms... (attempt ${this.connectionAttempts}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.connect();
      } else {
        throw new Error(`MongoDB connection failed after ${this.maxRetries} attempts: ${error.message}`);
      }
    }
  }

  /**
   * Get collection with operation tracking
   */
  collection(name) {
    if (!this.isConnected) {
      throw new Error('MongoDB not connected');
    }

    if (!this.collections[name]) {
      this.collections[name] = this.db.collection(name);
    }

    // Wrap collection operations for monitoring
    const originalCollection = this.collections[name];
    const manager = this;

    return new Proxy(originalCollection, {
      get(target, prop) {
        const original = target[prop];
        
        if (typeof original === 'function' && 
            ['insertOne', 'insertMany', 'findOne', 'find', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'aggregate'].includes(prop)) {
          
          return async function(...args) {
            const startTime = Date.now();
            
            try {
              manager.operationCount++;
              const result = await original.apply(target, args);
              
              if (IS_DEVELOPMENT && Date.now() - startTime > 1000) {
                console.warn(`[MongoDB] Slow operation detected (${Date.now() - startTime}ms): ${prop} on ${name}`);
              }
              
              return result;
            } catch (error) {
              manager.errorCount++;
              console.error(`[MongoDB] Operation error (${prop} on ${name}):`, error);
              throw error;
            }
          };
        }
        
        return original;
      }
    });
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      const health = await mongoHealthCheck(this.client);
      const responseTime = Date.now() - startTime;

      // Get server stats
      const adminDb = this.client.db('admin');
      const serverStatus = await adminDb.command({ serverStatus: 1 });

      this.lastHealthCheck = {
        timestamp: new Date(),
        status: health.status,
        responseTime,
        collections: health.collections,
        totalDocuments: health.totalDocuments,
        serverStats: {
          version: serverStatus.version,
          uptime: serverStatus.uptimeMillis,
          connections: {
            current: serverStatus.connections?.current || 0,
            available: serverStatus.connections?.available || 0
          }
        },
        operationStats: {
          totalOperations: this.operationCount,
          totalErrors: this.errorCount
        }
      };

      return this.lastHealthCheck;

    } catch (error) {
      this.lastHealthCheck = {
        timestamp: new Date(),
        status: 'unhealthy',
        error: error.message
      };
      
      return this.lastHealthCheck;
    }
  }

  /**
   * Close connection
   */
  async close() {
    if (this.client) {
      console.log('Closing MongoDB connection...');
      await this.client.close();
      this.isConnected = false;
      console.log('✓ MongoDB connection closed');
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      connectionAttempts: this.connectionAttempts,
      operationCount: this.operationCount,
      errorCount: this.errorCount,
      lastHealthCheck: this.lastHealthCheck,
      collectionsCount: Object.keys(this.collections).length
    };
  }
}

/**
 * Database Manager - Unified interface for both databases
 */
export class DatabaseManager {
  constructor() {
    this.postgresql = new PostgreSQLManager();
    this.mongodb = new MongoDBManager();
    this.isInitialized = false;
  }

  /**
   * Initialize both database connections
   */
  async initialize() {
    try {
      console.log('Initializing MLG.clan Database Manager...');
      
      // Initialize PostgreSQL
      await this.postgresql.connect();
      
      // Initialize MongoDB
      await this.mongodb.connect();
      
      this.isInitialized = true;
      
      console.log('✓ Database Manager initialized successfully');
      console.log('✓ All database connections established');
      
      // Start health check interval
      this.startHealthCheckInterval();
      
      return {
        postgresql: this.postgresql.getStatus(),
        mongodb: this.mongodb.getStatus()
      };

    } catch (error) {
      console.error('Database Manager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Start periodic health checks
   */
  startHealthCheckInterval() {
    const interval = parseInt(process.env.DB_HEALTH_CHECK_INTERVAL) || 60000; // 1 minute default
    
    setInterval(async () => {
      try {
        const [pgHealth, mongoHealth] = await Promise.all([
          this.postgresql.healthCheck(),
          this.mongodb.healthCheck()
        ]);

        if (pgHealth.status !== 'healthy' || mongoHealth.status !== 'healthy') {
          console.warn('[Database] Health check failed:', {
            postgresql: pgHealth.status,
            mongodb: mongoHealth.status
          });
        }

      } catch (error) {
        console.error('[Database] Health check error:', error);
      }
    }, interval);
  }

  /**
   * Comprehensive health check for both databases
   */
  async healthCheck() {
    if (!this.isInitialized) {
      return {
        status: 'uninitialized',
        error: 'Database manager not initialized'
      };
    }

    try {
      const [pgHealth, mongoHealth] = await Promise.all([
        this.postgresql.healthCheck(),
        this.mongodb.healthCheck()
      ]);

      const overallStatus = pgHealth.status === 'healthy' && mongoHealth.status === 'healthy' 
        ? 'healthy' 
        : 'degraded';

      return {
        status: overallStatus,
        timestamp: new Date(),
        postgresql: pgHealth,
        mongodb: mongoHealth,
        summary: {
          totalConnections: (pgHealth.poolStats?.totalCount || 0) + (mongoHealth.serverStats?.connections?.current || 0),
          totalQueries: (pgHealth.queryStats?.totalQueries || 0) + (mongoHealth.operationStats?.totalOperations || 0),
          totalErrors: (pgHealth.queryStats?.totalErrors || 0) + (mongoHealth.operationStats?.totalErrors || 0)
        }
      };

    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date(),
        error: error.message
      };
    }
  }

  /**
   * Close all database connections
   */
  async close() {
    console.log('Closing all database connections...');
    
    await Promise.all([
      this.postgresql.close(),
      this.mongodb.close()
    ]);
    
    this.isInitialized = false;
    console.log('✓ All database connections closed');
  }

  /**
   * Get comprehensive status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      postgresql: this.postgresql.getStatus(),
      mongodb: this.mongodb.getStatus()
    };
  }

  /**
   * Quick access to database instances
   */
  get pg() {
    return this.postgresql;
  }

  get mongo() {
    return this.mongodb;
  }
}

/**
 * Global database manager instance
 */
export const dbManager = new DatabaseManager();

/**
 * Database utility functions
 */

/**
 * Format database connection string for logging (without sensitive data)
 */
export function formatConnectionString(config, type = 'postgresql') {
  if (type === 'postgresql') {
    return `postgresql://${config.user}@${config.host}:${config.port}/${config.database}`;
  } else if (type === 'mongodb') {
    const uri = config.uri;
    return uri.replace(/\/\/.*:.*@/, '//***:***@');
  }
  return 'unknown';
}

/**
 * Validate environment variables
 */
export function validateEnvironment() {
  const errors = [];
  const warnings = [];

  // Check required PostgreSQL variables
  if (!process.env.POSTGRES_HOST && NODE_ENV === 'production') {
    errors.push('POSTGRES_HOST is required in production');
  }
  
  if (!process.env.POSTGRES_PASSWORD && NODE_ENV === 'production') {
    warnings.push('POSTGRES_PASSWORD not set - using default');
  }

  // Check MongoDB variables
  if (!process.env.MONGODB_URI && !process.env.MONGO_HOST && NODE_ENV === 'production') {
    errors.push('MONGODB_URI or MONGO_HOST is required in production');
  }

  // Check SSL settings in production
  if (NODE_ENV === 'production') {
    if (!process.env.POSTGRES_SSL_CA) {
      warnings.push('PostgreSQL SSL not configured for production');
    }
    if (!process.env.MONGO_TLS_CA_FILE) {
      warnings.push('MongoDB TLS not configured for production');
    }
  }

  return { errors, warnings };
}

/**
 * Export configuration and utility functions
 */
export {
  NODE_ENV,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  IS_TEST,
  POSTGRESQL_CONFIG,
  MONGODB_EXTENDED_CONFIG
};

console.log('MLG.clan Database Configuration loaded successfully');
console.log(`Environment: ${NODE_ENV}`);
console.log(`PostgreSQL: ${formatConnectionString(POSTGRESQL_CONFIG, 'postgresql')}`);
console.log(`MongoDB: ${formatConnectionString(MONGODB_EXTENDED_CONFIG, 'mongodb')}`);

// Validate environment on load
const envValidation = validateEnvironment();
if (envValidation.errors.length > 0) {
  console.error('Environment validation errors:', envValidation.errors);
}
if (envValidation.warnings.length > 0) {
  console.warn('Environment validation warnings:', envValidation.warnings);
}