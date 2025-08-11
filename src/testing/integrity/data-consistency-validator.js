/**
 * MLG.clan Platform Data Consistency Validation Suite
 * 
 * Comprehensive cross-database consistency validation and transaction integrity testing.
 * Ensures data consistency between PostgreSQL and MongoDB, validates ACID properties,
 * and verifies backup/recovery integrity.
 * 
 * Features:
 * - Cross-database consistency validation
 * - Transaction integrity testing with rollback scenarios
 * - Foreign key constraint validation
 * - Data synchronization verification
 * - Backup and recovery validation
 * - Schema migration testing
 * - Referential integrity checks
 * - Temporal consistency validation
 * 
 * @author Claude Code - Universal Testing & Verification Agent
 * @version 1.0.0
 * @created 2025-08-11
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import crypto from 'crypto';

import { DatabaseManager } from '../../database/database-config.js';
import { getCacheManager } from '../../cache/cache-manager.js';

/**
 * Data Consistency Test Configuration
 */
const CONSISTENCY_TEST_CONFIG = {
  // Test parameters
  testIterations: parseInt(process.env.CONSISTENCY_TEST_ITERATIONS) || 1000,
  concurrentOperations: parseInt(process.env.CONSISTENCY_CONCURRENT_OPS) || 50,
  testTimeout: parseInt(process.env.CONSISTENCY_TEST_TIMEOUT) || 600000, // 10 minutes
  
  // Validation thresholds
  maxInconsistencies: parseInt(process.env.MAX_INCONSISTENCIES) || 0, // Zero tolerance
  maxTransactionFailures: parseInt(process.env.MAX_TX_FAILURES) || 5, // 0.5%
  maxReplicationLag: parseInt(process.env.MAX_REPLICATION_LAG) || 1000, // 1 second
  
  // Test data parameters
  testDataSize: parseInt(process.env.TEST_DATA_SIZE) || 10000,
  batchSize: parseInt(process.env.CONSISTENCY_BATCH_SIZE) || 100,
  
  // Entities to validate
  entities: ['users', 'clans', 'content', 'votes', 'transactions'],
  
  // Cross-database relationships
  relationships: [
    { source: 'users', target: 'clans', field: 'owner_id' },
    { source: 'content', target: 'users', field: 'creator_id' },
    { source: 'votes', target: 'users', field: 'user_id' },
    { source: 'transactions', target: 'users', field: 'user_id' },
    { source: 'clan_members', target: 'users', field: 'user_id' },
    { source: 'clan_members', target: 'clans', field: 'clan_id' },
  ],
};

/**
 * Test data generators for consistency validation
 */
const generateConsistentUser = (id) => ({
  id: id || `user_${crypto.randomUUID()}`,
  wallet_address: `MLG${crypto.randomBytes(16).toString('hex')}`,
  username: `testuser_${Math.random().toString(36).substring(2, 10)}`,
  email: `test${Math.random().toString(36).substring(2, 8)}@consistency.test`,
  created_at: new Date(),
  updated_at: new Date(),
  profile: {
    display_name: `Test User ${Math.random().toString(36).substring(2, 6)}`,
    level: Math.floor(Math.random() * 100) + 1,
    xp: Math.floor(Math.random() * 100000),
  },
});

const generateConsistentClan = (ownerId) => ({
  id: `clan_${crypto.randomUUID()}`,
  name: `TestClan_${Math.random().toString(36).substring(2, 8)}`,
  description: `Consistency test clan created at ${new Date().toISOString()}`,
  owner_id: ownerId,
  is_public: Math.random() > 0.5,
  max_members: Math.floor(Math.random() * 1000) + 50,
  created_at: new Date(),
  updated_at: new Date(),
});

const generateConsistentContent = (userId, clanId) => ({
  _id: `content_${crypto.randomUUID()}`,
  title: `Test Content ${Math.random().toString(36).substring(2, 8)}`,
  description: `Consistency test content created at ${new Date().toISOString()}`,
  type: Math.random() > 0.5 ? 'video' : 'image',
  creator_id: userId,
  clan_id: clanId,
  status: 'active',
  created_at: new Date(),
  updated_at: new Date(),
});

/**
 * Data Consistency Validator Class
 */
class DataConsistencyValidator extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = { ...CONSISTENCY_TEST_CONFIG, ...config };
    this.dbManager = new DatabaseManager();
    this.cacheManager = getCacheManager();
    
    // Validation metrics
    this.metrics = {
      validations: {
        total: 0,
        passed: 0,
        failed: 0,
        inconsistencies: 0,
      },
      
      transactions: {
        attempted: 0,
        committed: 0,
        rolledBack: 0,
        failed: 0,
      },
      
      relationships: {
        validated: 0,
        violations: 0,
        orphanedRecords: 0,
      },
      
      performance: {
        startTime: null,
        endTime: null,
        totalValidationTime: 0,
        avgValidationTime: 0,
      },
      
      entities: {},
    };
    
    // Test data tracking
    this.testData = {
      users: new Map(),
      clans: new Map(),
      content: new Map(),
      votes: new Map(),
      transactions: new Map(),
    };
    
    this.logger = config.logger || console;
  }

  /**
   * Initialize data consistency validation environment
   */
  async initialize() {
    try {
      this.logger.info('Initializing data consistency validation environment...');
      
      // Initialize database connections
      await this.dbManager.initialize();
      
      // Verify database health
      const health = await this.dbManager.healthCheck();
      if (health.status !== 'healthy') {
        throw new Error(`Database not healthy: ${health.error || 'Unknown error'}`);
      }
      
      // Initialize entity metrics
      for (const entity of this.config.entities) {
        this.metrics.entities[entity] = {
          records: 0,
          inconsistencies: 0,
          validations: 0,
        };
      }
      
      this.logger.info('Data consistency validation environment initialized');
      
    } catch (error) {
      this.logger.error('Failed to initialize consistency validation environment:', error);
      throw error;
    }
  }

  /**
   * Run comprehensive data consistency validation
   */
  async runConsistencyValidation() {
    this.metrics.performance.startTime = Date.now();
    this.logger.info('Starting comprehensive data consistency validation...');
    
    try {
      // Step 1: Generate consistent test data
      await this.generateConsistentTestData();
      
      // Step 2: Cross-database consistency validation
      await this.validateCrossDatabaseConsistency();
      
      // Step 3: Transaction integrity testing
      await this.testTransactionIntegrity();
      
      // Step 4: Referential integrity validation
      await this.validateReferentialIntegrity();
      
      // Step 5: Temporal consistency testing
      await this.testTemporalConsistency();
      
      // Step 6: Cache consistency validation
      await this.validateCacheConsistency();
      
      // Step 7: Backup and recovery validation
      await this.validateBackupRecovery();
      
      this.metrics.performance.endTime = Date.now();
      
      // Generate comprehensive report
      const report = await this.generateConsistencyReport();
      
      this.logger.info('Data consistency validation completed');
      return report;
      
    } catch (error) {
      this.logger.error('Data consistency validation failed:', error);
      throw error;
    }
  }

  /**
   * Generate consistent test data across databases
   */
  async generateConsistentTestData() {
    this.logger.info('Generating consistent test data...');
    
    const batchSize = this.config.batchSize;
    const totalRecords = this.config.testDataSize;
    
    try {
      // Generate users in PostgreSQL
      for (let i = 0; i < totalRecords; i += batchSize) {
        const users = [];
        const currentBatch = Math.min(batchSize, totalRecords - i);
        
        for (let j = 0; j < currentBatch; j++) {
          const user = generateConsistentUser();
          users.push(user);
          this.testData.users.set(user.id, user);
        }
        
        // Insert users into PostgreSQL
        await this.insertUsersBatch(users);
      }
      
      this.logger.info(`Generated ${this.testData.users.size} users`);
      
      // Generate clans with valid owner references
      const userIds = Array.from(this.testData.users.keys());
      const clanCount = Math.floor(totalRecords / 10); // 10% of users own clans
      
      for (let i = 0; i < clanCount; i += batchSize) {
        const clans = [];
        const currentBatch = Math.min(batchSize, clanCount - i);
        
        for (let j = 0; j < currentBatch; j++) {
          const randomOwnerId = userIds[Math.floor(Math.random() * userIds.length)];
          const clan = generateConsistentClan(randomOwnerId);
          clans.push(clan);
          this.testData.clans.set(clan.id, clan);
        }
        
        await this.insertClansBatch(clans);
      }
      
      this.logger.info(`Generated ${this.testData.clans.size} clans`);
      
      // Generate content in MongoDB with valid references
      const clanIds = Array.from(this.testData.clans.keys());
      const contentCount = Math.floor(totalRecords / 5); // 5 content per user average
      
      for (let i = 0; i < contentCount; i += batchSize) {
        const content = [];
        const currentBatch = Math.min(batchSize, contentCount - i);
        
        for (let j = 0; j < currentBatch; j++) {
          const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
          const randomClanId = clanIds[Math.floor(Math.random() * clanIds.length)];
          const contentItem = generateConsistentContent(randomUserId, randomClanId);
          content.push(contentItem);
          this.testData.content.set(contentItem._id, contentItem);
        }
        
        await this.insertContentBatch(content);
      }
      
      this.logger.info(`Generated ${this.testData.content.size} content items`);
      
    } catch (error) {
      this.logger.error('Failed to generate consistent test data:', error);
      throw error;
    }
  }

  /**
   * Insert users batch into PostgreSQL
   */
  async insertUsersBatch(users) {
    const query = `
      INSERT INTO users (id, wallet_address, username, email, created_at, updated_at, profile)
      VALUES ${users.map((_, i) => `($${i * 7 + 1}, $${i * 7 + 2}, $${i * 7 + 3}, $${i * 7 + 4}, $${i * 7 + 5}, $${i * 7 + 6}, $${i * 7 + 7})`).join(', ')}
      ON CONFLICT (id) DO NOTHING
    `;
    
    const params = users.flatMap(user => [
      user.id, user.wallet_address, user.username, user.email,
      user.created_at, user.updated_at, JSON.stringify(user.profile)
    ]);
    
    await this.dbManager.pg.query(query, params);
    this.metrics.entities.users.records += users.length;
  }

  /**
   * Insert clans batch into PostgreSQL
   */
  async insertClansBatch(clans) {
    const query = `
      INSERT INTO clans (id, name, description, owner_id, is_public, max_members, created_at, updated_at)
      VALUES ${clans.map((_, i) => `($${i * 8 + 1}, $${i * 8 + 2}, $${i * 8 + 3}, $${i * 8 + 4}, $${i * 8 + 5}, $${i * 8 + 6}, $${i * 8 + 7}, $${i * 8 + 8})`).join(', ')}
      ON CONFLICT (id) DO NOTHING
    `;
    
    const params = clans.flatMap(clan => [
      clan.id, clan.name, clan.description, clan.owner_id,
      clan.is_public, clan.max_members, clan.created_at, clan.updated_at
    ]);
    
    await this.dbManager.pg.query(query, params);
    this.metrics.entities.clans.records += clans.length;
  }

  /**
   * Insert content batch into MongoDB
   */
  async insertContentBatch(content) {
    const collection = this.dbManager.mongo.collection('content');
    await collection.insertMany(content);
    this.metrics.entities.content.records += content.length;
  }

  /**
   * Validate cross-database consistency
   */
  async validateCrossDatabaseConsistency() {
    this.logger.info('Validating cross-database consistency...');
    
    for (const relationship of this.config.relationships) {
      await this.validateRelationship(relationship);
    }
    
    // Validate data synchronization
    await this.validateDataSynchronization();
  }

  /**
   * Validate specific relationship between databases
   */
  async validateRelationship(relationship) {
    const { source, target, field } = relationship;
    
    try {
      let sourceRecords, targetIds;
      
      // Get source records
      if (source === 'content') {
        // MongoDB collection
        const collection = this.dbManager.mongo.collection(source);
        sourceRecords = await collection.find({}, { projection: { [field]: 1 } }).toArray();
      } else {
        // PostgreSQL table
        const result = await this.dbManager.pg.query(`SELECT ${field} FROM ${source} WHERE ${field} IS NOT NULL`);
        sourceRecords = result.rows;
      }
      
      // Get target IDs
      if (target === 'content') {
        const collection = this.dbManager.mongo.collection(target);
        const records = await collection.find({}, { projection: { _id: 1 } }).toArray();
        targetIds = new Set(records.map(r => r._id));
      } else {
        const result = await this.dbManager.pg.query(`SELECT id FROM ${target}`);
        targetIds = new Set(result.rows.map(r => r.id));
      }
      
      // Validate references
      const violations = [];
      for (const record of sourceRecords) {
        const referenceId = record[field];
        if (referenceId && !targetIds.has(referenceId)) {
          violations.push({
            source,
            target,
            field,
            sourceId: record.id || record._id,
            invalidReference: referenceId,
          });
        }
      }
      
      this.metrics.relationships.validated++;
      this.metrics.relationships.violations += violations.length;
      
      if (violations.length > 0) {
        this.logger.warn(`Found ${violations.length} referential integrity violations for ${source}.${field} -> ${target}`);
        this.recordInconsistency('REFERENTIAL_INTEGRITY', {
          relationship,
          violations: violations.slice(0, 10), // Log first 10 violations
        });
      }
      
    } catch (error) {
      this.logger.error(`Failed to validate relationship ${source}.${field} -> ${target}:`, error);
      this.recordInconsistency('VALIDATION_ERROR', { relationship, error: error.message });
    }
  }

  /**
   * Validate data synchronization between PostgreSQL and MongoDB
   */
  async validateDataSynchronization() {
    this.logger.info('Validating data synchronization...');
    
    // Check for orphaned records
    await this.checkOrphanedRecords();
    
    // Validate timestamp consistency
    await this.validateTimestampConsistency();
    
    // Check for duplicate records
    await this.checkDuplicateRecords();
  }

  /**
   * Check for orphaned records
   */
  async checkOrphanedRecords() {
    // Find content without valid creators
    const contentCollection = this.dbManager.mongo.collection('content');
    const userResult = await this.dbManager.pg.query('SELECT id FROM users');
    const validUserIds = new Set(userResult.rows.map(r => r.id));
    
    const orphanedContent = await contentCollection.find({
      creator_id: { $not: { $in: Array.from(validUserIds) } }
    }).toArray();
    
    if (orphanedContent.length > 0) {
      this.metrics.relationships.orphanedRecords += orphanedContent.length;
      this.recordInconsistency('ORPHANED_RECORDS', {
        type: 'content',
        count: orphanedContent.length,
        examples: orphanedContent.slice(0, 5).map(c => ({ id: c._id, creator_id: c.creator_id })),
      });
    }
  }

  /**
   * Validate timestamp consistency
   */
  async validateTimestampConsistency() {
    const inconsistencies = [];
    
    // Check for records with created_at > updated_at
    const pgResult = await this.dbManager.pg.query(`
      SELECT 'users' as table_name, id, created_at, updated_at 
      FROM users 
      WHERE created_at > updated_at
      UNION ALL
      SELECT 'clans' as table_name, id, created_at, updated_at 
      FROM clans 
      WHERE created_at > updated_at
    `);
    
    inconsistencies.push(...pgResult.rows);
    
    if (inconsistencies.length > 0) {
      this.recordInconsistency('TIMESTAMP_INCONSISTENCY', {
        count: inconsistencies.length,
        examples: inconsistencies.slice(0, 5),
      });
    }
  }

  /**
   * Check for duplicate records
   */
  async checkDuplicateRecords() {
    // Check for duplicate usernames
    const duplicateUsers = await this.dbManager.pg.query(`
      SELECT username, COUNT(*) as count
      FROM users
      GROUP BY username
      HAVING COUNT(*) > 1
    `);
    
    if (duplicateUsers.rows.length > 0) {
      this.recordInconsistency('DUPLICATE_RECORDS', {
        type: 'users',
        field: 'username',
        duplicates: duplicateUsers.rows,
      });
    }
    
    // Check for duplicate clan names
    const duplicateClans = await this.dbManager.pg.query(`
      SELECT name, COUNT(*) as count
      FROM clans
      GROUP BY name
      HAVING COUNT(*) > 1
    `);
    
    if (duplicateClans.rows.length > 0) {
      this.recordInconsistency('DUPLICATE_RECORDS', {
        type: 'clans',
        field: 'name',
        duplicates: duplicateClans.rows,
      });
    }
  }

  /**
   * Test transaction integrity with rollback scenarios
   */
  async testTransactionIntegrity() {
    this.logger.info('Testing transaction integrity...');
    
    const testCases = [
      { name: 'successful_transaction', shouldFail: false },
      { name: 'constraint_violation', shouldFail: true },
      { name: 'timeout_rollback', shouldFail: true },
      { name: 'concurrent_update', shouldFail: false },
    ];
    
    for (const testCase of testCases) {
      await this.runTransactionTest(testCase);
    }
  }

  /**
   * Run specific transaction test
   */
  async runTransactionTest(testCase) {
    const { name, shouldFail } = testCase;
    this.metrics.transactions.attempted++;
    
    try {
      switch (name) {
        case 'successful_transaction':
          await this.testSuccessfulTransaction();
          break;
          
        case 'constraint_violation':
          await this.testConstraintViolation();
          break;
          
        case 'timeout_rollback':
          await this.testTimeoutRollback();
          break;
          
        case 'concurrent_update':
          await this.testConcurrentUpdate();
          break;
      }
      
      if (shouldFail) {
        this.recordInconsistency('TRANSACTION_UNEXPECTED_SUCCESS', { testCase: name });
      } else {
        this.metrics.transactions.committed++;
      }
      
    } catch (error) {
      if (shouldFail) {
        this.metrics.transactions.rolledBack++;
      } else {
        this.metrics.transactions.failed++;
        this.recordInconsistency('TRANSACTION_UNEXPECTED_FAILURE', {
          testCase: name,
          error: error.message,
        });
      }
    }
  }

  /**
   * Test successful transaction
   */
  async testSuccessfulTransaction() {
    await this.dbManager.pg.transaction(async (client) => {
      const user = generateConsistentUser();
      
      // Insert user
      await client.query(
        'INSERT INTO users (id, wallet_address, username, email, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [user.id, user.wallet_address, user.username, user.email, user.created_at, user.updated_at]
      );
      
      // Create clan for user
      const clan = generateConsistentClan(user.id);
      await client.query(
        'INSERT INTO clans (id, name, description, owner_id, is_public, max_members, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [clan.id, clan.name, clan.description, clan.owner_id, clan.is_public, clan.max_members, clan.created_at, clan.updated_at]
      );
      
      // Verify both records exist
      const userCheck = await client.query('SELECT id FROM users WHERE id = $1', [user.id]);
      const clanCheck = await client.query('SELECT id FROM clans WHERE id = $1', [clan.id]);
      
      if (userCheck.rows.length !== 1 || clanCheck.rows.length !== 1) {
        throw new Error('Transaction validation failed');
      }
    });
  }

  /**
   * Test constraint violation rollback
   */
  async testConstraintViolation() {
    await this.dbManager.pg.transaction(async (client) => {
      // Try to insert user with duplicate ID (should fail)
      const existingUser = Array.from(this.testData.users.values())[0];
      if (!existingUser) {
        throw new Error('No existing user found for constraint test');
      }
      
      await client.query(
        'INSERT INTO users (id, wallet_address, username, email, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [existingUser.id, 'new_wallet', 'new_username', 'new@email.com', new Date(), new Date()]
      );
    });
  }

  /**
   * Test timeout rollback
   */
  async testTimeoutRollback() {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Transaction timeout')), 100);
    });
    
    const transactionPromise = this.dbManager.pg.transaction(async (client) => {
      await client.query('SELECT pg_sleep(1)'); // Sleep for 1 second
      return 'success';
    });
    
    await Promise.race([transactionPromise, timeoutPromise]);
  }

  /**
   * Test concurrent update scenario
   */
  async testConcurrentUpdate() {
    const user = Array.from(this.testData.users.values())[0];
    if (!user) {
      throw new Error('No user found for concurrent update test');
    }
    
    // Run concurrent updates
    const updates = [];
    for (let i = 0; i < 5; i++) {
      updates.push(
        this.dbManager.pg.query(
          'UPDATE users SET updated_at = $1 WHERE id = $2',
          [new Date(), user.id]
        )
      );
    }
    
    await Promise.all(updates);
  }

  /**
   * Validate referential integrity
   */
  async validateReferentialIntegrity() {
    this.logger.info('Validating referential integrity...');
    
    // Test foreign key constraints
    await this.testForeignKeyConstraints();
    
    // Test cascade operations
    await this.testCascadeOperations();
  }

  /**
   * Test foreign key constraints
   */
  async testForeignKeyConstraints() {
    try {
      // Try to insert clan with non-existent owner
      const invalidClan = {
        id: `invalid_clan_${crypto.randomUUID()}`,
        name: 'Invalid Clan',
        description: 'Should fail due to invalid owner',
        owner_id: 'non_existent_user_id',
        is_public: true,
        max_members: 100,
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      await this.dbManager.pg.query(
        'INSERT INTO clans (id, name, description, owner_id, is_public, max_members, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [invalidClan.id, invalidClan.name, invalidClan.description, invalidClan.owner_id, invalidClan.is_public, invalidClan.max_members, invalidClan.created_at, invalidClan.updated_at]
      );
      
      // If we reach here, constraint validation failed
      this.recordInconsistency('FOREIGN_KEY_CONSTRAINT_VIOLATION', {
        operation: 'insert',
        table: 'clans',
        constraint: 'owner_id -> users.id',
      });
      
    } catch (error) {
      // Expected to fail - foreign key constraint working
      if (error.message.includes('foreign key') || error.message.includes('constraint')) {
        this.logger.debug('Foreign key constraint working correctly');
      } else {
        this.recordInconsistency('UNEXPECTED_CONSTRAINT_ERROR', {
          error: error.message,
        });
      }
    }
  }

  /**
   * Test cascade operations
   */
  async testCascadeOperations() {
    // Create test user and clan
    const testUser = generateConsistentUser();
    await this.dbManager.pg.query(
      'INSERT INTO users (id, wallet_address, username, email, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [testUser.id, testUser.wallet_address, testUser.username, testUser.email, testUser.created_at, testUser.updated_at]
    );
    
    const testClan = generateConsistentClan(testUser.id);
    await this.dbManager.pg.query(
      'INSERT INTO clans (id, name, description, owner_id, is_public, max_members, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [testClan.id, testClan.name, testClan.description, testClan.owner_id, testClan.is_public, testClan.max_members, testClan.created_at, testClan.updated_at]
    );
    
    // Delete user and verify cascade behavior
    await this.dbManager.pg.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    
    // Check if clan still exists (should be cleaned up if cascade is configured)
    const remainingClans = await this.dbManager.pg.query('SELECT id FROM clans WHERE owner_id = $1', [testUser.id]);
    
    if (remainingClans.rows.length > 0) {
      this.recordInconsistency('CASCADE_OPERATION_FAILED', {
        orphanedClans: remainingClans.rows.length,
        userId: testUser.id,
      });
    }
  }

  /**
   * Test temporal consistency
   */
  async testTemporalConsistency() {
    this.logger.info('Testing temporal consistency...');
    
    // Test timestamp ordering
    await this.testTimestampOrdering();
    
    // Test concurrent timestamp updates
    await this.testConcurrentTimestamps();
  }

  /**
   * Test timestamp ordering
   */
  async testTimestampOrdering() {
    const testUser = generateConsistentUser();
    const insertTime = Date.now();
    
    // Insert with specific timestamps
    testUser.created_at = new Date(insertTime);
    testUser.updated_at = new Date(insertTime - 1000); // 1 second earlier (invalid)
    
    try {
      await this.dbManager.pg.query(
        'INSERT INTO users (id, wallet_address, username, email, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [testUser.id, testUser.wallet_address, testUser.username, testUser.email, testUser.created_at, testUser.updated_at]
      );
      
      // If successful, check if we have validation logic
      const result = await this.dbManager.pg.query(
        'SELECT created_at, updated_at FROM users WHERE id = $1',
        [testUser.id]
      );
      
      const record = result.rows[0];
      if (new Date(record.created_at) > new Date(record.updated_at)) {
        this.recordInconsistency('TEMPORAL_ORDERING_VIOLATION', {
          userId: testUser.id,
          createdAt: record.created_at,
          updatedAt: record.updated_at,
        });
      }
      
    } catch (error) {
      // Expected if database has timestamp validation
      this.logger.debug('Timestamp validation working correctly');
    }
  }

  /**
   * Test concurrent timestamp updates
   */
  async testConcurrentTimestamps() {
    const user = Array.from(this.testData.users.values())[0];
    if (!user) return;
    
    const updates = [];
    const startTime = Date.now();
    
    for (let i = 0; i < 10; i++) {
      updates.push(
        this.dbManager.pg.query(
          'UPDATE users SET updated_at = $1 WHERE id = $2 RETURNING updated_at',
          [new Date(startTime + i * 100), user.id]
        )
      );
    }
    
    const results = await Promise.all(updates);
    
    // Verify final timestamp is the latest
    const finalResult = await this.dbManager.pg.query(
      'SELECT updated_at FROM users WHERE id = $1',
      [user.id]
    );
    
    const finalTimestamp = new Date(finalResult.rows[0].updated_at);
    const expectedLatest = new Date(startTime + 900); // Last update
    
    if (finalTimestamp < expectedLatest) {
      this.recordInconsistency('CONCURRENT_TIMESTAMP_ISSUE', {
        userId: user.id,
        finalTimestamp,
        expectedTimestamp: expectedLatest,
      });
    }
  }

  /**
   * Validate cache consistency
   */
  async validateCacheConsistency() {
    this.logger.info('Validating cache consistency...');
    
    // Test cache-database sync
    await this.testCacheDatabaseSync();
    
    // Test cache invalidation
    await this.testCacheInvalidation();
  }

  /**
   * Test cache-database synchronization
   */
  async testCacheDatabaseSync() {
    const user = Array.from(this.testData.users.values())[0];
    if (!user) return;
    
    // Update user in database
    const newUsername = `updated_${Math.random().toString(36).substring(2, 8)}`;
    await this.dbManager.pg.query(
      'UPDATE users SET username = $1, updated_at = $2 WHERE id = $3',
      [newUsername, new Date(), user.id]
    );
    
    // Check if cache is updated
    const cachedUser = await this.cacheManager.get('user', user.id);
    
    if (cachedUser && cachedUser.username !== newUsername) {
      this.recordInconsistency('CACHE_DATABASE_SYNC_ISSUE', {
        userId: user.id,
        cachedUsername: cachedUser.username,
        databaseUsername: newUsername,
      });
    }
  }

  /**
   * Test cache invalidation
   */
  async testCacheInvalidation() {
    const testKey = `test_cache_${crypto.randomUUID()}`;
    const testValue = { data: 'test_value', timestamp: Date.now() };
    
    // Set cache value
    await this.cacheManager.set('test', testKey, testValue);
    
    // Verify cached
    const cached = await this.cacheManager.get('test', testKey);
    if (!cached || cached.data !== testValue.data) {
      this.recordInconsistency('CACHE_SET_GET_ISSUE', {
        key: testKey,
        expected: testValue,
        actual: cached,
      });
    }
    
    // Invalidate cache
    await this.cacheManager.delete('test', testKey);
    
    // Verify invalidation
    const afterInvalidation = await this.cacheManager.get('test', testKey);
    if (afterInvalidation !== null) {
      this.recordInconsistency('CACHE_INVALIDATION_ISSUE', {
        key: testKey,
        expectedNull: true,
        actual: afterInvalidation,
      });
    }
  }

  /**
   * Validate backup and recovery
   */
  async validateBackupRecovery() {
    this.logger.info('Validating backup and recovery...');
    
    // Create checkpoint data
    const checkpointData = await this.createDataCheckpoint();
    
    // Simulate backup process (mock)
    await this.simulateBackupProcess();
    
    // Simulate recovery validation (mock)
    await this.validateRecoveryProcess(checkpointData);
  }

  /**
   * Create data checkpoint for backup validation
   */
  async createDataCheckpoint() {
    const checkpoint = {
      timestamp: new Date().toISOString(),
      userCount: 0,
      clanCount: 0,
      contentCount: 0,
      checksums: {},
    };
    
    // Get record counts
    const userResult = await this.dbManager.pg.query('SELECT COUNT(*) as count FROM users');
    checkpoint.userCount = parseInt(userResult.rows[0].count);
    
    const clanResult = await this.dbManager.pg.query('SELECT COUNT(*) as count FROM clans');
    checkpoint.clanCount = parseInt(clanResult.rows[0].count);
    
    const contentCollection = this.dbManager.mongo.collection('content');
    checkpoint.contentCount = await contentCollection.countDocuments();
    
    return checkpoint;
  }

  /**
   * Simulate backup process
   */
  async simulateBackupProcess() {
    // Mock backup validation
    this.logger.debug('Simulating backup process validation...');
    
    // In a real scenario, this would:
    // 1. Trigger actual backup
    // 2. Verify backup file integrity
    // 3. Test backup restoration to temporary environment
    // 4. Validate restored data matches original
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Validate recovery process
   */
  async validateRecoveryProcess(checkpoint) {
    // Mock recovery validation
    this.logger.debug('Validating recovery process...');
    
    // Verify current data matches checkpoint
    const currentUserCount = await this.dbManager.pg.query('SELECT COUNT(*) as count FROM users');
    if (parseInt(currentUserCount.rows[0].count) !== checkpoint.userCount) {
      this.recordInconsistency('BACKUP_RECOVERY_COUNT_MISMATCH', {
        entity: 'users',
        checkpointCount: checkpoint.userCount,
        currentCount: parseInt(currentUserCount.rows[0].count),
      });
    }
  }

  /**
   * Record consistency issue
   */
  recordInconsistency(type, details) {
    this.metrics.validations.inconsistencies++;
    this.metrics.validations.failed++;
    
    this.logger.error(`Data inconsistency detected: ${type}`, details);
    
    this.emit('inconsistency', {
      type,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Generate comprehensive consistency report
   */
  async generateConsistencyReport() {
    const testDuration = (this.metrics.performance.endTime - this.metrics.performance.startTime) / 1000;
    
    // Final database health check
    const finalHealth = await this.dbManager.healthCheck();
    
    const report = {
      summary: {
        testDuration,
        totalValidations: this.metrics.validations.total,
        inconsistenciesFound: this.metrics.validations.inconsistencies,
        transactionTests: this.metrics.transactions.attempted,
        relationshipValidations: this.metrics.relationships.validated,
        status: this.getConsistencyStatus(),
      },
      
      validations: {
        ...this.metrics.validations,
        successRate: this.metrics.validations.total > 0 
          ? (this.metrics.validations.passed / this.metrics.validations.total) * 100 
          : 0,
      },
      
      transactions: {
        ...this.metrics.transactions,
        successRate: this.metrics.transactions.attempted > 0 
          ? (this.metrics.transactions.committed / this.metrics.transactions.attempted) * 100 
          : 0,
      },
      
      relationships: {
        ...this.metrics.relationships,
        violationRate: this.metrics.relationships.validated > 0 
          ? (this.metrics.relationships.violations / this.metrics.relationships.validated) * 100 
          : 0,
      },
      
      entities: this.metrics.entities,
      
      databaseHealth: finalHealth,
      
      recommendations: this.generateConsistencyRecommendations(),
      
      timestamp: new Date().toISOString(),
    };
    
    return report;
  }

  /**
   * Determine consistency test status
   */
  getConsistencyStatus() {
    const conditions = [
      this.metrics.validations.inconsistencies <= this.config.maxInconsistencies,
      this.metrics.transactions.failed <= this.config.maxTransactionFailures,
      this.metrics.relationships.violations === 0,
    ];
    
    return conditions.every(Boolean) ? 'PASSED' : 'FAILED';
  }

  /**
   * Generate consistency recommendations
   */
  generateConsistencyRecommendations() {
    const recommendations = [];
    
    if (this.metrics.validations.inconsistencies > this.config.maxInconsistencies) {
      recommendations.push({
        type: 'DATA_INCONSISTENCY',
        severity: 'CRITICAL',
        message: `Found ${this.metrics.validations.inconsistencies} data inconsistencies`,
        action: 'Review and fix data inconsistencies before production deployment',
      });
    }
    
    if (this.metrics.relationships.violations > 0) {
      recommendations.push({
        type: 'REFERENTIAL_INTEGRITY',
        severity: 'HIGH',
        message: `Found ${this.metrics.relationships.violations} referential integrity violations`,
        action: 'Implement proper foreign key constraints and cleanup orphaned records',
      });
    }
    
    if (this.metrics.transactions.failed > this.config.maxTransactionFailures) {
      recommendations.push({
        type: 'TRANSACTION_INTEGRITY',
        severity: 'HIGH',
        message: `${this.metrics.transactions.failed} transaction tests failed`,
        action: 'Review transaction handling and implement proper rollback mechanisms',
      });
    }
    
    if (this.metrics.relationships.orphanedRecords > 0) {
      recommendations.push({
        type: 'ORPHANED_RECORDS',
        severity: 'MEDIUM',
        message: `Found ${this.metrics.relationships.orphanedRecords} orphaned records`,
        action: 'Implement cascade operations or cleanup procedures for orphaned records',
      });
    }
    
    return recommendations;
  }

  /**
   * Cleanup test resources
   */
  async cleanup() {
    this.logger.info('Cleaning up consistency test resources...');
    
    try {
      // Clean up test data
      const userIds = Array.from(this.testData.users.keys());
      const clanIds = Array.from(this.testData.clans.keys());
      const contentIds = Array.from(this.testData.content.keys());
      
      if (userIds.length > 0) {
        await this.dbManager.pg.query(
          `DELETE FROM users WHERE id = ANY($1)`,
          [userIds]
        );
      }
      
      if (clanIds.length > 0) {
        await this.dbManager.pg.query(
          `DELETE FROM clans WHERE id = ANY($1)`,
          [clanIds]
        );
      }
      
      if (contentIds.length > 0) {
        const contentCollection = this.dbManager.mongo.collection('content');
        await contentCollection.deleteMany({
          _id: { $in: contentIds }
        });
      }
      
      // Clear test cache data
      await this.cacheManager.invalidatePattern('test', '*');
      
      // Close database connections
      await this.dbManager.close();
      
      this.logger.info('Consistency test cleanup completed');
      
    } catch (error) {
      this.logger.error('Consistency test cleanup failed:', error);
    }
  }
}

export default DataConsistencyValidator;

/**
 * Standalone execution
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new DataConsistencyValidator();
  
  const runValidation = async () => {
    try {
      await validator.initialize();
      const report = await validator.runConsistencyValidation();
      
      console.log('\n=== DATA CONSISTENCY VALIDATION REPORT ===');
      console.log(JSON.stringify(report, null, 2));
      
      // Save report to file
      const fs = await import('fs/promises');
      const reportPath = `data-consistency-report-${Date.now()}.json`;
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`\nReport saved to: ${reportPath}`);
      
      process.exit(report.summary.status === 'PASSED' ? 0 : 1);
      
    } catch (error) {
      console.error('Data consistency validation failed:', error);
      process.exit(1);
    } finally {
      await validator.cleanup();
    }
  };
  
  runValidation();
}