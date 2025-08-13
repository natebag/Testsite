/**
 * GDPR Compliance Service for MLG.clan Platform
 * 
 * Provides comprehensive GDPR compliance including:
 * - User consent management
 * - Data portability (export user data)
 * - Right to be forgotten (data deletion)
 * - Audit logging for GDPR requests
 * - Privacy settings management
 * - Cookie consent tracking
 * 
 * @author Claude Code - Security & Privacy Architect
 * @version 1.0.0
 * @created 2025-08-13
 */

import crypto from 'crypto';
import { Pool } from 'pg';
import Redis from 'redis';

/**
 * GDPR data processing purposes and legal bases
 */
const GDPR_PURPOSES = {
  AUTHENTICATION: {
    purpose: 'User authentication and session management',
    legalBasis: 'contract',
    retention: '2 years after last login',
    required: true
  },
  PROFILE_MANAGEMENT: {
    purpose: 'User profile and gaming data management',
    legalBasis: 'contract',
    retention: 'Account duration + 1 year',
    required: false
  },
  VOTING_PARTICIPATION: {
    purpose: 'Community voting and governance participation',
    legalBasis: 'contract',
    retention: 'Account duration + 3 years',
    required: false
  },
  CLAN_ACTIVITIES: {
    purpose: 'Clan membership and social features',
    legalBasis: 'contract',
    retention: 'Account duration + 1 year',
    required: false
  },
  ANALYTICS: {
    purpose: 'Platform improvement and analytics',
    legalBasis: 'legitimate_interest',
    retention: '2 years',
    required: false
  },
  MARKETING: {
    purpose: 'Marketing communications and updates',
    legalBasis: 'consent',
    retention: 'Until consent withdrawn',
    required: false
  },
  PERFORMANCE_TRACKING: {
    purpose: 'Gaming performance and achievement tracking',
    legalBasis: 'contract',
    retention: 'Account duration + 2 years',
    required: false
  }
};

/**
 * Data categories for GDPR compliance
 */
const DATA_CATEGORIES = {
  IDENTITY: {
    tables: ['users', 'user_profiles'],
    fields: ['username', 'display_name', 'email', 'wallet_address'],
    purpose: ['AUTHENTICATION', 'PROFILE_MANAGEMENT'],
    sensitive: false
  },
  CONTACT: {
    tables: ['users', 'user_profiles'],
    fields: ['email', 'location', 'website_url', 'social_links'],
    purpose: ['PROFILE_MANAGEMENT', 'MARKETING'],
    sensitive: false
  },
  TECHNICAL: {
    tables: ['user_sessions', 'security_events'],
    fields: ['ip_address', 'user_agent', 'device_fingerprint'],
    purpose: ['AUTHENTICATION', 'ANALYTICS'],
    sensitive: false
  },
  BEHAVIORAL: {
    tables: ['content_votes', 'content_submissions', 'clan_members'],
    fields: ['vote_type', 'vote_power', 'content_data', 'activity_logs'],
    purpose: ['VOTING_PARTICIPATION', 'CLAN_ACTIVITIES', 'ANALYTICS'],
    sensitive: false
  },
  FINANCIAL: {
    tables: ['transactions', 'staking_records'],
    fields: ['amount', 'transaction_id', 'wallet_signature'],
    purpose: ['AUTHENTICATION', 'VOTING_PARTICIPATION'],
    sensitive: true
  },
  PERFORMANCE: {
    tables: ['users', 'achievement_progress'],
    fields: ['reputation_score', 'total_votes_cast', 'gaming_stats'],
    purpose: ['PERFORMANCE_TRACKING', 'ANALYTICS'],
    sensitive: false
  }
};

/**
 * GDPR Compliance Service Class
 */
export class GDPRComplianceService {
  constructor(options = {}) {
    this.db = options.db || null;
    this.redis = options.redis || null;
    this.logger = options.logger || console;
    this.auditLogger = options.auditLogger || console;
    
    // GDPR configuration
    this.config = {
      DATA_RETENTION_DAYS: 2555, // 7 years default
      EXPORT_FORMAT: 'json',
      DELETION_VERIFICATION_PERIOD: 30, // days
      CONSENT_REFRESH_PERIOD: 365, // days
      ...options.config
    };
    
    // Initialize audit tracking
    this.auditEvents = new Map();
    
    // Bind methods
    this.recordConsent = this.recordConsent.bind(this);
    this.checkConsent = this.checkConsent.bind(this);
    this.exportUserData = this.exportUserData.bind(this);
    this.requestDataDeletion = this.requestDataDeletion.bind(this);
    this.processDataDeletion = this.processDataDeletion.bind(this);
  }

  /**
   * Initialize database connection
   */
  async initialize() {
    if (!this.db) {
      const connectionString = process.env.DATABASE_URL || 
        'postgresql://username:password@localhost:5432/mlg_clan';
      
      this.db = new Pool({
        connectionString,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    }

    if (!this.redis) {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.redis = Redis.createClient({ url: redisUrl });
      await this.redis.connect();
    }

    // Ensure GDPR tables exist
    await this.createGDPRTables();
    
    this.logger.info('GDPR Compliance Service initialized');
  }

  /**
   * Create necessary GDPR compliance tables
   */
  async createGDPRTables() {
    const queries = [
      // User consent records
      `CREATE TABLE IF NOT EXISTS user_consents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        purpose VARCHAR(50) NOT NULL,
        legal_basis VARCHAR(30) NOT NULL,
        consent_given BOOLEAN NOT NULL DEFAULT false,
        consent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expiry_date TIMESTAMP WITH TIME ZONE,
        withdrawal_date TIMESTAMP WITH TIME ZONE,
        consent_version VARCHAR(10) NOT NULL DEFAULT '1.0',
        ip_address INET,
        user_agent TEXT,
        consent_method VARCHAR(50) DEFAULT 'explicit',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, purpose, consent_version)
      )`,
      
      // Data processing activities log
      `CREATE TABLE IF NOT EXISTS data_processing_activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        activity_type VARCHAR(50) NOT NULL,
        purpose VARCHAR(50) NOT NULL,
        data_categories TEXT[] NOT NULL,
        legal_basis VARCHAR(30) NOT NULL,
        retention_period VARCHAR(100),
        third_parties TEXT[],
        automated_processing BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'
      )`,
      
      // Data export requests
      `CREATE TABLE IF NOT EXISTS data_export_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status VARCHAR(20) DEFAULT 'pending',
        export_format VARCHAR(10) DEFAULT 'json',
        data_categories TEXT[],
        export_url TEXT,
        expiry_date TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        download_count INTEGER DEFAULT 0,
        last_downloaded TIMESTAMP WITH TIME ZONE,
        ip_address INET,
        user_agent TEXT,
        metadata JSONB DEFAULT '{}'
      )`,
      
      // Data deletion requests  
      `CREATE TABLE IF NOT EXISTS data_deletion_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        verification_date TIMESTAMP WITH TIME ZONE,
        status VARCHAR(20) DEFAULT 'pending',
        deletion_type VARCHAR(20) DEFAULT 'full',
        data_categories TEXT[],
        retention_exceptions TEXT[],
        verification_token VARCHAR(255),
        scheduled_deletion TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        ip_address INET,
        user_agent TEXT,
        reason TEXT,
        metadata JSONB DEFAULT '{}'
      )`,
      
      // Cookie consent tracking
      `CREATE TABLE IF NOT EXISTS cookie_consents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        session_id VARCHAR(255),
        cookie_categories JSONB NOT NULL,
        consent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expiry_date TIMESTAMP WITH TIME ZONE,
        ip_address INET,
        user_agent TEXT,
        consent_string TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // GDPR audit log
      `CREATE TABLE IF NOT EXISTS gdpr_audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        event_type VARCHAR(50) NOT NULL,
        event_data JSONB NOT NULL,
        ip_address INET,
        user_agent TEXT,
        session_id VARCHAR(255),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        compliance_officer_id UUID REFERENCES users(id) ON DELETE SET NULL
      )`
    ];

    for (const query of queries) {
      try {
        await this.db.query(query);
      } catch (error) {
        this.logger.error('Error creating GDPR table:', error);
        throw error;
      }
    }

    // Create indexes for performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_user_consents_user_purpose ON user_consents(user_id, purpose)',
      'CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_status ON data_export_requests(user_id, status)',
      'CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user_status ON data_deletion_requests(user_id, status)',
      'CREATE INDEX IF NOT EXISTS idx_cookie_consents_user_session ON cookie_consents(user_id, session_id)',
      'CREATE INDEX IF NOT EXISTS idx_gdpr_audit_log_user_event ON gdpr_audit_log(user_id, event_type, timestamp)'
    ];

    for (const indexQuery of indexes) {
      try {
        await this.db.query(indexQuery);
      } catch (error) {
        this.logger.warn('Index creation warning:', error.message);
      }
    }
  }

  /**
   * Record user consent for specific purpose
   * @param {string} userId - User ID
   * @param {string} purpose - Processing purpose
   * @param {boolean} consentGiven - Whether consent was given
   * @param {Object} metadata - Additional consent metadata
   * @returns {Object} Consent record
   */
  async recordConsent(userId, purpose, consentGiven, metadata = {}) {
    try {
      if (!GDPR_PURPOSES[purpose]) {
        throw new Error(`Invalid processing purpose: ${purpose}`);
      }

      const purposeConfig = GDPR_PURPOSES[purpose];
      const expiryDate = purposeConfig.legalBasis === 'consent' 
        ? new Date(Date.now() + (this.config.CONSENT_REFRESH_PERIOD * 24 * 60 * 60 * 1000))
        : null;

      const query = `
        INSERT INTO user_consents (
          user_id, purpose, legal_basis, consent_given, 
          expiry_date, ip_address, user_agent, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (user_id, purpose, consent_version) 
        DO UPDATE SET 
          consent_given = $4,
          consent_date = NOW(),
          expiry_date = $5,
          withdrawal_date = CASE WHEN $4 = false THEN NOW() ELSE NULL END,
          ip_address = $6,
          user_agent = $7,
          metadata = $8,
          updated_at = NOW()
        RETURNING *
      `;

      const result = await this.db.query(query, [
        userId,
        purpose,
        purposeConfig.legalBasis,
        consentGiven,
        expiryDate,
        metadata.ipAddress || null,
        metadata.userAgent || null,
        JSON.stringify({
          ...metadata,
          purpose_description: purposeConfig.purpose,
          retention_period: purposeConfig.retention
        })
      ]);

      const consent = result.rows[0];

      // Log the consent event
      await this.logGDPREvent(userId, 'CONSENT_RECORDED', {
        purpose,
        consentGiven,
        legalBasis: purposeConfig.legalBasis,
        expiryDate,
        metadata
      }, metadata.ipAddress, metadata.userAgent);

      // Update cache
      if (this.redis) {
        const cacheKey = `gdpr:consent:${userId}:${purpose}`;
        await this.redis.setEx(cacheKey, 3600, JSON.stringify(consent));
      }

      return consent;
    } catch (error) {
      this.logger.error('Error recording consent:', error);
      throw new Error(`Failed to record consent: ${error.message}`);
    }
  }

  /**
   * Check if user has valid consent for purpose
   * @param {string} userId - User ID
   * @param {string} purpose - Processing purpose
   * @returns {Object} Consent status and details
   */
  async checkConsent(userId, purpose) {
    try {
      // Check cache first
      if (this.redis) {
        const cacheKey = `gdpr:consent:${userId}:${purpose}`;
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          const consent = JSON.parse(cached);
          return this.validateConsent(consent);
        }
      }

      const query = `
        SELECT * FROM user_consents 
        WHERE user_id = $1 AND purpose = $2 
        ORDER BY consent_date DESC 
        LIMIT 1
      `;

      const result = await this.db.query(query, [userId, purpose]);
      
      if (result.rows.length === 0) {
        const purposeConfig = GDPR_PURPOSES[purpose];
        return {
          hasValidConsent: purposeConfig?.required === false,
          consentRequired: purposeConfig?.required === true,
          legalBasis: purposeConfig?.legalBasis || 'not_specified',
          purpose: purposeConfig?.purpose || purpose,
          lastConsentDate: null,
          expiryDate: null
        };
      }

      const consent = result.rows[0];
      const validation = this.validateConsent(consent);

      // Update cache
      if (this.redis) {
        const cacheKey = `gdpr:consent:${userId}:${purpose}`;
        await this.redis.setEx(cacheKey, 3600, JSON.stringify(consent));
      }

      return validation;
    } catch (error) {
      this.logger.error('Error checking consent:', error);
      throw new Error(`Failed to check consent: ${error.message}`);
    }
  }

  /**
   * Validate consent record
   * @param {Object} consent - Consent record
   * @returns {Object} Validation result
   */
  validateConsent(consent) {
    const now = new Date();
    const isExpired = consent.expiry_date && new Date(consent.expiry_date) < now;
    const isWithdrawn = consent.withdrawal_date !== null;

    return {
      hasValidConsent: consent.consent_given && !isExpired && !isWithdrawn,
      consentGiven: consent.consent_given,
      isExpired,
      isWithdrawn,
      legalBasis: consent.legal_basis,
      lastConsentDate: consent.consent_date,
      expiryDate: consent.expiry_date,
      withdrawalDate: consent.withdrawal_date,
      consentVersion: consent.consent_version
    };
  }

  /**
   * Export all user data for GDPR compliance
   * @param {string} userId - User ID
   * @param {Object} options - Export options
   * @returns {Object} Export request details
   */
  async exportUserData(userId, options = {}) {
    try {
      const {
        format = 'json',
        categories = Object.keys(DATA_CATEGORIES),
        ipAddress,
        userAgent
      } = options;

      // Create export request record
      const requestQuery = `
        INSERT INTO data_export_requests (
          user_id, export_format, data_categories, 
          ip_address, user_agent, expiry_date
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const expiryDate = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 days
      const requestResult = await this.db.query(requestQuery, [
        userId,
        format,
        categories,
        ipAddress,
        userAgent,
        expiryDate
      ]);

      const exportRequest = requestResult.rows[0];

      // Log the export request
      await this.logGDPREvent(userId, 'DATA_EXPORT_REQUESTED', {
        requestId: exportRequest.id,
        format,
        categories,
        expiryDate
      }, ipAddress, userAgent);

      // Process export asynchronously
      setImmediate(() => this.processDataExport(exportRequest.id));

      return {
        requestId: exportRequest.id,
        status: 'processing',
        estimatedCompletion: new Date(Date.now() + (30 * 60 * 1000)), // 30 minutes
        expiryDate,
        format,
        categories
      };
    } catch (error) {
      this.logger.error('Error creating export request:', error);
      throw new Error(`Failed to create export request: ${error.message}`);
    }
  }

  /**
   * Process data export request
   * @param {string} requestId - Export request ID
   */
  async processDataExport(requestId) {
    try {
      // Get export request details
      const requestQuery = 'SELECT * FROM data_export_requests WHERE id = $1';
      const requestResult = await this.db.query(requestQuery, [requestId]);
      
      if (requestResult.rows.length === 0) {
        throw new Error('Export request not found');
      }

      const request = requestResult.rows[0];
      const { user_id: userId, data_categories: categories, export_format: format } = request;

      // Collect user data from all relevant tables
      const userData = await this.collectUserData(userId, categories);

      // Generate export file
      const exportData = {
        exportInfo: {
          requestId,
          userId,
          exportDate: new Date().toISOString(),
          format,
          dataCategories: categories,
          version: '1.0'
        },
        userData,
        consentHistory: await this.getUserConsentHistory(userId),
        processingActivities: await this.getUserProcessingActivities(userId),
        privacySettings: await this.getUserPrivacySettings(userId)
      };

      // Store export data (in production, this would be stored in secure file storage)
      const exportUrl = await this.storeExportData(requestId, exportData, format);

      // Update export request
      await this.db.query(
        'UPDATE data_export_requests SET status = $1, export_url = $2, completed_at = NOW() WHERE id = $3',
        ['completed', exportUrl, requestId]
      );

      // Log completion
      await this.logGDPREvent(userId, 'DATA_EXPORT_COMPLETED', {
        requestId,
        exportUrl,
        dataSize: JSON.stringify(exportData).length
      });

      this.logger.info(`Data export completed for user ${userId}, request ${requestId}`);
    } catch (error) {
      this.logger.error('Error processing data export:', error);
      
      // Update request status to failed
      await this.db.query(
        'UPDATE data_export_requests SET status = $1 WHERE id = $2',
        ['failed', requestId]
      );
    }
  }

  /**
   * Collect user data from all relevant tables
   * @param {string} userId - User ID
   * @param {Array} categories - Data categories to include
   * @returns {Object} Collected user data
   */
  async collectUserData(userId, categories) {
    const userData = {};

    for (const category of categories) {
      if (!DATA_CATEGORIES[category]) continue;

      const categoryConfig = DATA_CATEGORIES[category];
      userData[category] = {};

      for (const table of categoryConfig.tables) {
        try {
          const query = `SELECT * FROM ${table} WHERE user_id = $1`;
          const result = await this.db.query(query, [userId]);
          userData[category][table] = result.rows;
        } catch (error) {
          this.logger.warn(`Error collecting data from table ${table}:`, error.message);
          userData[category][table] = [];
        }
      }
    }

    return userData;
  }

  /**
   * Request data deletion (Right to be Forgotten)
   * @param {string} userId - User ID
   * @param {Object} options - Deletion options
   * @returns {Object} Deletion request details
   */
  async requestDataDeletion(userId, options = {}) {
    try {
      const {
        deletionType = 'full',
        categories = Object.keys(DATA_CATEGORIES),
        reason = '',
        ipAddress,
        userAgent
      } = options;

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // Create deletion request
      const query = `
        INSERT INTO data_deletion_requests (
          user_id, deletion_type, data_categories, 
          verification_token, reason, ip_address, user_agent,
          scheduled_deletion
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const scheduledDeletion = new Date(Date.now() + (this.config.DELETION_VERIFICATION_PERIOD * 24 * 60 * 60 * 1000));
      
      const result = await this.db.query(query, [
        userId,
        deletionType,
        categories,
        verificationToken,
        reason,
        ipAddress,
        userAgent,
        scheduledDeletion
      ]);

      const deletionRequest = result.rows[0];

      // Log the deletion request
      await this.logGDPREvent(userId, 'DATA_DELETION_REQUESTED', {
        requestId: deletionRequest.id,
        deletionType,
        categories,
        verificationPeriod: this.config.DELETION_VERIFICATION_PERIOD,
        scheduledDeletion
      }, ipAddress, userAgent);

      return {
        requestId: deletionRequest.id,
        verificationToken,
        status: 'pending_verification',
        verificationPeriod: this.config.DELETION_VERIFICATION_PERIOD,
        scheduledDeletion,
        deletionType,
        categories
      };
    } catch (error) {
      this.logger.error('Error creating deletion request:', error);
      throw new Error(`Failed to create deletion request: ${error.message}`);
    }
  }

  /**
   * Verify and process data deletion
   * @param {string} requestId - Deletion request ID
   * @param {string} verificationToken - Verification token
   * @returns {Object} Deletion result
   */
  async verifyAndProcessDeletion(requestId, verificationToken) {
    try {
      // Get deletion request
      const query = `
        SELECT * FROM data_deletion_requests 
        WHERE id = $1 AND verification_token = $2 AND status = 'pending_verification'
      `;
      
      const result = await this.db.query(query, [requestId, verificationToken]);
      
      if (result.rows.length === 0) {
        throw new Error('Invalid deletion request or verification token');
      }

      const deletionRequest = result.rows[0];
      
      // Update request status
      await this.db.query(
        'UPDATE data_deletion_requests SET status = $1, verification_date = NOW() WHERE id = $2',
        ['verified', requestId]
      );

      // Process deletion immediately
      const deletionResult = await this.processDataDeletion(requestId);

      return deletionResult;
    } catch (error) {
      this.logger.error('Error verifying deletion request:', error);
      throw new Error(`Failed to verify deletion request: ${error.message}`);
    }
  }

  /**
   * Process data deletion
   * @param {string} requestId - Deletion request ID
   * @returns {Object} Deletion result
   */
  async processDataDeletion(requestId) {
    try {
      // Get deletion request details
      const requestQuery = 'SELECT * FROM data_deletion_requests WHERE id = $1';
      const requestResult = await this.db.query(requestQuery, [requestId]);
      
      if (requestResult.rows.length === 0) {
        throw new Error('Deletion request not found');
      }

      const request = requestResult.rows[0];
      const { user_id: userId, data_categories: categories, deletion_type: deletionType } = request;

      const deletionResults = {};

      // Begin transaction for atomic deletion
      const client = await this.db.connect();
      
      try {
        await client.query('BEGIN');

        if (deletionType === 'full') {
          // Full account deletion
          await this.performFullAccountDeletion(client, userId);
          deletionResults.accountDeleted = true;
        } else {
          // Selective data deletion
          for (const category of categories) {
            if (DATA_CATEGORIES[category]) {
              const result = await this.deleteCategoryData(client, userId, category);
              deletionResults[category] = result;
            }
          }
        }

        // Update deletion request
        await client.query(
          'UPDATE data_deletion_requests SET status = $1, completed_at = NOW() WHERE id = $2',
          ['completed', requestId]
        );

        await client.query('COMMIT');

        // Log completion
        await this.logGDPREvent(userId, 'DATA_DELETION_COMPLETED', {
          requestId,
          deletionType,
          categories,
          results: deletionResults
        });

        return {
          requestId,
          status: 'completed',
          deletionType,
          results: deletionResults,
          completedAt: new Date()
        };

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      this.logger.error('Error processing data deletion:', error);
      
      // Update request status to failed
      await this.db.query(
        'UPDATE data_deletion_requests SET status = $1 WHERE id = $2',
        ['failed', requestId]
      );
      
      throw new Error(`Failed to process data deletion: ${error.message}`);
    }
  }

  /**
   * Perform full account deletion
   * @param {Object} client - Database client
   * @param {string} userId - User ID
   */
  async performFullAccountDeletion(client, userId) {
    // Tables to delete from (in order due to foreign key constraints)
    const deletionOrder = [
      'user_sessions',
      'user_consents', 
      'data_export_requests',
      'data_deletion_requests',
      'cookie_consents',
      'content_votes',
      'content_submissions',
      'clan_members',
      'achievement_progress',
      'transactions',
      'user_profiles',
      'users'
    ];

    for (const table of deletionOrder) {
      try {
        const result = await client.query(`DELETE FROM ${table} WHERE user_id = $1`, [userId]);
        this.logger.info(`Deleted ${result.rowCount} records from ${table} for user ${userId}`);
      } catch (error) {
        this.logger.warn(`Error deleting from ${table}: ${error.message}`);
      }
    }
  }

  /**
   * Delete data for specific category
   * @param {Object} client - Database client
   * @param {string} userId - User ID
   * @param {string} category - Data category
   * @returns {Object} Deletion result
   */
  async deleteCategoryData(client, userId, category) {
    const categoryConfig = DATA_CATEGORIES[category];
    const results = {};

    for (const table of categoryConfig.tables) {
      try {
        // For non-sensitive data, we might anonymize instead of delete
        if (!categoryConfig.sensitive) {
          const result = await client.query(
            `UPDATE ${table} SET user_id = NULL WHERE user_id = $1`,
            [userId]
          );
          results[table] = { anonymized: result.rowCount };
        } else {
          const result = await client.query(
            `DELETE FROM ${table} WHERE user_id = $1`,
            [userId]
          );
          results[table] = { deleted: result.rowCount };
        }
      } catch (error) {
        this.logger.warn(`Error processing ${table} for category ${category}: ${error.message}`);
        results[table] = { error: error.message };
      }
    }

    return results;
  }

  /**
   * Get user consent history
   * @param {string} userId - User ID
   * @returns {Array} Consent history
   */
  async getUserConsentHistory(userId) {
    const query = `
      SELECT purpose, legal_basis, consent_given, consent_date, 
             withdrawal_date, consent_version, metadata
      FROM user_consents 
      WHERE user_id = $1 
      ORDER BY consent_date DESC
    `;
    
    const result = await this.db.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get user processing activities
   * @param {string} userId - User ID
   * @returns {Array} Processing activities
   */
  async getUserProcessingActivities(userId) {
    const query = `
      SELECT activity_type, purpose, data_categories, legal_basis,
             retention_period, third_parties, created_at
      FROM data_processing_activities 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    
    const result = await this.db.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get user privacy settings
   * @param {string} userId - User ID
   * @returns {Object} Privacy settings
   */
  async getUserPrivacySettings(userId) {
    const query = `
      SELECT profile_visibility, email_notifications, data_sharing_consent,
             marketing_consent, analytics_consent
      FROM users 
      WHERE id = $1
    `;
    
    const result = await this.db.query(query, [userId]);
    return result.rows[0] || {};
  }

  /**
   * Store export data securely
   * @param {string} requestId - Request ID
   * @param {Object} data - Export data
   * @param {string} format - Export format
   * @returns {string} Export URL
   */
  async storeExportData(requestId, data, format) {
    // In production, this would use secure cloud storage (S3, etc.)
    // For now, we'll simulate with a URL
    const exportUrl = `/api/privacy/exports/${requestId}/download`;
    
    // Store in Redis temporarily (in production, use proper file storage)
    if (this.redis) {
      const key = `gdpr:export:${requestId}`;
      await this.redis.setEx(key, 7 * 24 * 60 * 60, JSON.stringify(data)); // 7 days
    }
    
    return exportUrl;
  }

  /**
   * Log GDPR-related events for audit trail
   * @param {string} userId - User ID
   * @param {string} eventType - Event type
   * @param {Object} eventData - Event data
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent
   */
  async logGDPREvent(userId, eventType, eventData, ipAddress = null, userAgent = null) {
    try {
      const query = `
        INSERT INTO gdpr_audit_log (
          user_id, event_type, event_data, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5)
      `;

      await this.db.query(query, [
        userId,
        eventType,
        JSON.stringify(eventData),
        ipAddress,
        userAgent
      ]);

      // Also log to audit logger
      this.auditLogger.info('GDPR Event:', {
        userId,
        eventType,
        eventData,
        timestamp: new Date().toISOString(),
        ipAddress,
        userAgent
      });
    } catch (error) {
      this.logger.error('Error logging GDPR event:', error);
    }
  }

  /**
   * Get GDPR compliance dashboard data
   * @param {string} userId - User ID
   * @returns {Object} Compliance dashboard data
   */
  async getComplianceDashboard(userId) {
    try {
      const [consents, exportRequests, deletionRequests, processingActivities] = await Promise.all([
        this.getUserConsentHistory(userId),
        this.db.query('SELECT * FROM data_export_requests WHERE user_id = $1 ORDER BY request_date DESC LIMIT 10', [userId]),
        this.db.query('SELECT * FROM data_deletion_requests WHERE user_id = $1 ORDER BY request_date DESC LIMIT 10', [userId]),
        this.getUserProcessingActivities(userId)
      ]);

      return {
        consents: consents.map(c => ({
          purpose: c.purpose,
          consentGiven: c.consent_given,
          date: c.consent_date,
          status: this.validateConsent(c).hasValidConsent ? 'active' : 'expired'
        })),
        dataExports: exportRequests.rows,
        deletionRequests: deletionRequests.rows,
        processingActivities: processingActivities.slice(0, 10),
        dataCategories: Object.keys(DATA_CATEGORIES),
        purposes: Object.keys(GDPR_PURPOSES)
      };
    } catch (error) {
      this.logger.error('Error getting compliance dashboard:', error);
      throw new Error(`Failed to get compliance dashboard: ${error.message}`);
    }
  }

  /**
   * Cleanup expired data and requests
   */
  async cleanupExpiredData() {
    try {
      // Clean up expired export requests
      await this.db.query(
        'DELETE FROM data_export_requests WHERE expiry_date < NOW() AND status = $1',
        ['completed']
      );

      // Clean up old audit logs (keep for 7 years for compliance)
      const sevenYearsAgo = new Date(Date.now() - (7 * 365 * 24 * 60 * 60 * 1000));
      await this.db.query(
        'DELETE FROM gdpr_audit_log WHERE timestamp < $1',
        [sevenYearsAgo]
      );

      this.logger.info('GDPR cleanup completed');
    } catch (error) {
      this.logger.error('Error during GDPR cleanup:', error);
    }
  }

  /**
   * Shutdown service
   */
  async shutdown() {
    if (this.redis) {
      await this.redis.disconnect();
    }
    if (this.db) {
      await this.db.end();
    }
  }
}

export { GDPR_PURPOSES, DATA_CATEGORIES };
export default GDPRComplianceService;