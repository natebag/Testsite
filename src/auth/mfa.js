/**
 * Multi-Factor Authentication (MFA) Service for MLG.clan Platform
 * 
 * Comprehensive MFA implementation with TOTP, backup codes, and
 * device registration for enhanced security.
 * 
 * Features:
 * - TOTP (Time-based One-Time Password) integration
 * - Backup authentication methods for wallet recovery
 * - Device registration and trusted device management
 * - Security notifications for authentication events
 * - Account recovery procedures
 * - Multiple MFA method support
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 */

import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { Pool } from 'pg';
import Redis from 'redis';

/**
 * MFA Configuration
 */
const MFA_CONFIG = {
  // TOTP Configuration
  TOTP_WINDOW: 1, // Allow 1 window before/after for clock skew
  TOTP_STEP: 30, // 30-second intervals
  TOTP_DIGITS: 6, // 6-digit codes
  TOTP_ALGORITHM: 'sha1',
  
  // Backup Codes
  BACKUP_CODE_COUNT: 10,
  BACKUP_CODE_LENGTH: 8,
  BACKUP_CODE_CHARSET: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  
  // Device Management
  TRUSTED_DEVICE_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days
  MAX_TRUSTED_DEVICES: 5,
  DEVICE_VERIFICATION_TIMEOUT: 10 * 60 * 1000, // 10 minutes
  
  // Security Settings
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  
  // Notification Settings
  NOTIFICATION_TYPES: {
    MFA_ENABLED: 'mfa_enabled',
    MFA_DISABLED: 'mfa_disabled',
    BACKUP_CODES_GENERATED: 'backup_codes_generated',
    DEVICE_REGISTERED: 'device_registered',
    SUSPICIOUS_LOGIN: 'suspicious_login',
    RECOVERY_INITIATED: 'recovery_initiated'
  },
  
  // Cache Settings
  CACHE_PREFIX: 'mlg:mfa:',
  CACHE_TTL: 15 * 60, // 15 minutes
  
  // QR Code Settings
  QR_CODE_SIZE: 256,
  QR_CODE_MARGIN: 2,
  QR_CODE_ERROR_LEVEL: 'M'
};

/**
 * MFA Method Types
 */
const MFA_METHODS = {
  TOTP: 'totp',
  BACKUP_CODE: 'backup_code',
  SMS: 'sms', // Future implementation
  EMAIL: 'email', // Future implementation
  HARDWARE_KEY: 'hardware_key' // Future implementation
};

/**
 * Device Trust Levels
 */
const TRUST_LEVELS = {
  UNTRUSTED: 'untrusted',
  PENDING: 'pending',
  TRUSTED: 'trusted',
  SUSPICIOUS: 'suspicious'
};

/**
 * MFA Service Class
 */
class MFAService {
  constructor(options = {}) {
    this.db = options.db || null;
    this.redis = options.redis || null;
    this.logger = options.logger || console;
    this.notificationService = options.notificationService || null;
    
    // Internal caches
    this.attemptCache = new Map();
    this.deviceCache = new Map();
    
    // Initialize
    this.initialize();
  }

  /**
   * Initialize MFA service
   */
  async initialize() {
    try {
      // Connect to database if not provided
      if (!this.db) {
        await this.initializeDatabase();
      }
      
      // Connect to Redis if not provided
      if (!this.redis) {
        await this.initializeRedis();
      }
      
      // Create MFA tables
      await this.createMFATables();
      
      // Start cleanup tasks
      this.startCleanupTasks();
      
      this.logger.info('MFA Service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize MFA Service:', error);
      throw error;
    }
  }

  /**
   * Initialize database connection
   */
  async initializeDatabase() {
    const connectionString = process.env.DATABASE_URL || 
      'postgresql://username:password@localhost:5432/mlg_clan';
    
    this.db = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    await this.db.query('SELECT 1');
    this.logger.info('Database connection established for MFA');
  }

  /**
   * Initialize Redis connection
   */
  async initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.redis = Redis.createClient({ url: redisUrl });
      
      this.redis.on('error', (err) => {
        this.logger.warn('Redis connection error in MFA:', err);
      });
      
      await this.redis.connect();
      this.logger.info('Redis connection established for MFA');
    } catch (error) {
      this.logger.warn('Redis connection failed, using memory cache:', error);
      this.redis = null;
    }
  }

  /**
   * Create MFA database tables
   */
  async createMFATables() {
    // User MFA settings table
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS user_mfa (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        is_enabled BOOLEAN DEFAULT FALSE,
        totp_secret TEXT,
        totp_verified BOOLEAN DEFAULT FALSE,
        backup_codes TEXT[],
        backup_codes_used TEXT[] DEFAULT '{}',
        recovery_email TEXT,
        phone_number TEXT,
        failed_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        UNIQUE(user_id)
      )
    `);
    
    // Trusted devices table
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS trusted_devices (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        device_name VARCHAR(100) NOT NULL,
        device_fingerprint VARCHAR(255) UNIQUE NOT NULL,
        trust_level VARCHAR(20) DEFAULT 'pending',
        verification_token VARCHAR(255),
        ip_address INET,
        user_agent TEXT,
        location JSONB,
        trusted_at TIMESTAMP WITH TIME ZONE,
        expires_at TIMESTAMP WITH TIME ZONE,
        last_used TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        CONSTRAINT valid_trust_level CHECK (
          trust_level IN ('untrusted', 'pending', 'trusted', 'suspicious')
        )
      )
    `);
    
    // MFA authentication logs table
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS mfa_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        method VARCHAR(20) NOT NULL,
        success BOOLEAN NOT NULL,
        ip_address INET,
        user_agent TEXT,
        device_fingerprint VARCHAR(255),
        failure_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        CONSTRAINT valid_method CHECK (
          method IN ('totp', 'backup_code', 'sms', 'email', 'hardware_key')
        )
      )
    `);
    
    // Create indexes
    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_user_mfa_user_id ON user_mfa (user_id);
      CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON trusted_devices (user_id);
      CREATE INDEX IF NOT EXISTS idx_trusted_devices_fingerprint ON trusted_devices (device_fingerprint);
      CREATE INDEX IF NOT EXISTS idx_trusted_devices_trust_level ON trusted_devices (trust_level);
      CREATE INDEX IF NOT EXISTS idx_mfa_logs_user_id ON mfa_logs (user_id);
      CREATE INDEX IF NOT EXISTS idx_mfa_logs_created_at ON mfa_logs (created_at DESC);
    `);
  }

  /**
   * Setup TOTP for user
   * @param {string} userId - User ID
   * @param {Object} options - Setup options
   * @returns {Object} TOTP setup data
   */
  async setupTOTP(userId, options = {}) {
    try {
      const { appName = 'MLG.clan', issuer = 'MLG.clan' } = options;
      
      // Get user data
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `${appName} (${user.username || user.wallet_address})`,
        issuer: issuer,
        length: 32
      });
      
      // Store secret (temporarily, until verified)
      await this.db.query(`
        INSERT INTO user_mfa (user_id, totp_secret, is_enabled)
        VALUES ($1, $2, FALSE)
        ON CONFLICT (user_id)
        DO UPDATE SET 
          totp_secret = EXCLUDED.totp_secret,
          totp_verified = FALSE,
          updated_at = NOW()
      `, [userId, secret.base32]);
      
      // Generate QR code
      const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url, {
        width: MFA_CONFIG.QR_CODE_SIZE,
        margin: MFA_CONFIG.QR_CODE_MARGIN,
        errorCorrectionLevel: MFA_CONFIG.QR_CODE_ERROR_LEVEL
      });
      
      this.logMFAEvent('TOTP_SETUP_INITIATED', {
        userId,
        method: MFA_METHODS.TOTP
      });
      
      return {
        secret: secret.base32,
        qrCode: qrCodeDataURL,
        manualEntryKey: secret.base32,
        instructions: {
          app: 'Install an authenticator app like Google Authenticator or Authy',
          scan: 'Scan the QR code or enter the manual key',
          verify: 'Enter the 6-digit code from your authenticator app to complete setup'
        }
      };
    } catch (error) {
      this.logger.error('Error setting up TOTP:', error);
      throw new Error('Failed to setup TOTP');
    }
  }

  /**
   * Verify TOTP setup
   * @param {string} userId - User ID
   * @param {string} token - TOTP token
   * @returns {Object} Verification result with backup codes
   */
  async verifyTOTPSetup(userId, token) {
    try {
      // Get user MFA data
      const mfaData = await this.getUserMFA(userId);
      if (!mfaData || !mfaData.totp_secret) {
        throw new Error('TOTP setup not initiated');
      }
      
      // Verify token
      const verified = speakeasy.totp.verify({
        secret: mfaData.totp_secret,
        token: token,
        window: MFA_CONFIG.TOTP_WINDOW,
        step: MFA_CONFIG.TOTP_STEP,
        digits: MFA_CONFIG.TOTP_DIGITS,
        algorithm: MFA_CONFIG.TOTP_ALGORITHM
      });
      
      if (!verified) {
        await this.incrementFailedAttempts(userId);
        
        this.logMFAEvent('TOTP_VERIFICATION_FAILED', {
          userId,
          method: MFA_METHODS.TOTP,
          reason: 'Invalid token'
        });
        
        throw new Error('Invalid TOTP token');
      }
      
      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      
      // Enable MFA and store backup codes
      await this.db.query(`
        UPDATE user_mfa 
        SET is_enabled = TRUE, 
            totp_verified = TRUE, 
            backup_codes = $2,
            failed_attempts = 0,
            locked_until = NULL,
            updated_at = NOW()
        WHERE user_id = $1
      `, [userId, backupCodes]);
      
      // Send notification
      await this.sendNotification(userId, MFA_CONFIG.NOTIFICATION_TYPES.MFA_ENABLED);
      
      this.logMFAEvent('TOTP_ENABLED', {
        userId,
        method: MFA_METHODS.TOTP
      });
      
      return {
        success: true,
        backupCodes: backupCodes,
        message: 'TOTP successfully enabled. Save your backup codes in a secure location.'
      };
    } catch (error) {
      this.logger.error('Error verifying TOTP setup:', error);
      throw error;
    }
  }

  /**
   * Verify MFA token
   * @param {string} userId - User ID
   * @param {string} token - MFA token
   * @param {string} method - MFA method
   * @param {Object} context - Verification context
   * @returns {boolean} True if valid
   */
  async verifyMFAToken(userId, token, method = MFA_METHODS.TOTP, context = {}) {
    try {
      // Check if user is locked
      const isLocked = await this.isUserLocked(userId);
      if (isLocked) {
        throw new Error('Account is temporarily locked due to too many failed attempts');
      }
      
      // Get user MFA data
      const mfaData = await this.getUserMFA(userId);
      if (!mfaData || !mfaData.is_enabled) {
        throw new Error('MFA is not enabled for this user');
      }
      
      let verified = false;
      let usedBackupCode = false;
      
      switch (method) {
        case MFA_METHODS.TOTP:
          verified = await this.verifyTOTP(mfaData.totp_secret, token);
          break;
          
        case MFA_METHODS.BACKUP_CODE:
          const result = await this.verifyBackupCode(userId, token, mfaData);
          verified = result.verified;
          usedBackupCode = result.used;
          break;
          
        default:
          throw new Error(`Unsupported MFA method: ${method}`);
      }
      
      if (!verified) {
        await this.incrementFailedAttempts(userId);
        
        this.logMFAEvent('MFA_VERIFICATION_FAILED', {
          userId,
          method,
          reason: 'Invalid token',
          context
        });
        
        return false;
      }
      
      // Reset failed attempts on success
      await this.resetFailedAttempts(userId);
      
      // Mark backup code as used if applicable
      if (usedBackupCode) {
        await this.markBackupCodeAsUsed(userId, token);
      }
      
      this.logMFAEvent('MFA_VERIFICATION_SUCCESS', {
        userId,
        method,
        context
      });
      
      return true;
    } catch (error) {
      this.logger.error('Error verifying MFA token:', error);
      throw error;
    }
  }

  /**
   * Verify TOTP token
   * @param {string} secret - TOTP secret
   * @param {string} token - TOTP token
   * @returns {boolean} True if valid
   */
  async verifyTOTP(secret, token) {
    return speakeasy.totp.verify({
      secret: secret,
      token: token,
      window: MFA_CONFIG.TOTP_WINDOW,
      step: MFA_CONFIG.TOTP_STEP,
      digits: MFA_CONFIG.TOTP_DIGITS,
      algorithm: MFA_CONFIG.TOTP_ALGORITHM
    });
  }

  /**
   * Verify backup code
   * @param {string} userId - User ID
   * @param {string} code - Backup code
   * @param {Object} mfaData - MFA data
   * @returns {Object} Verification result
   */
  async verifyBackupCode(userId, code, mfaData) {
    const backupCodes = mfaData.backup_codes || [];
    const usedCodes = mfaData.backup_codes_used || [];
    
    // Check if code exists and is not used
    const codeExists = backupCodes.includes(code);
    const codeUsed = usedCodes.includes(code);
    
    if (!codeExists || codeUsed) {
      return { verified: false, used: false };
    }
    
    return { verified: true, used: true };
  }

  /**
   * Mark backup code as used
   * @param {string} userId - User ID
   * @param {string} code - Used backup code
   */
  async markBackupCodeAsUsed(userId, code) {
    await this.db.query(`
      UPDATE user_mfa 
      SET backup_codes_used = array_append(backup_codes_used, $2),
          updated_at = NOW()
      WHERE user_id = $1
    `, [userId, code]);
    
    // Check if running low on backup codes
    const mfaData = await this.getUserMFA(userId);
    const remainingCodes = (mfaData.backup_codes?.length || 0) - (mfaData.backup_codes_used?.length || 0);
    
    if (remainingCodes <= 2) {
      await this.sendNotification(userId, 'backup_codes_low', {
        remainingCodes
      });
    }
  }

  /**
   * Generate new backup codes
   * @param {string} userId - User ID
   * @returns {Array} New backup codes
   */
  async generateNewBackupCodes(userId) {
    try {
      const backupCodes = this.generateBackupCodes();
      
      await this.db.query(`
        UPDATE user_mfa 
        SET backup_codes = $2,
            backup_codes_used = '{}',
            updated_at = NOW()
        WHERE user_id = $1
      `, [userId, backupCodes]);
      
      await this.sendNotification(userId, MFA_CONFIG.NOTIFICATION_TYPES.BACKUP_CODES_GENERATED);
      
      this.logMFAEvent('BACKUP_CODES_REGENERATED', {
        userId
      });
      
      return backupCodes;
    } catch (error) {
      this.logger.error('Error generating new backup codes:', error);
      throw new Error('Failed to generate new backup codes');
    }
  }

  /**
   * Generate backup codes
   * @returns {Array} Array of backup codes
   */
  generateBackupCodes() {
    const codes = [];
    const charset = MFA_CONFIG.BACKUP_CODE_CHARSET;
    
    for (let i = 0; i < MFA_CONFIG.BACKUP_CODE_COUNT; i++) {
      let code = '';
      for (let j = 0; j < MFA_CONFIG.BACKUP_CODE_LENGTH; j++) {
        code += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      codes.push(code);
    }
    
    return codes;
  }

  /**
   * Register trusted device
   * @param {string} userId - User ID
   * @param {Object} deviceInfo - Device information
   * @returns {Object} Device registration result
   */
  async registerTrustedDevice(userId, deviceInfo) {
    try {
      const {
        deviceName,
        deviceFingerprint,
        ipAddress,
        userAgent,
        location = {}
      } = deviceInfo;
      
      // Check device limits
      const deviceCount = await this.getUserTrustedDeviceCount(userId);
      if (deviceCount >= MFA_CONFIG.MAX_TRUSTED_DEVICES) {
        throw new Error('Maximum trusted device limit reached');
      }
      
      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + MFA_CONFIG.TRUSTED_DEVICE_DURATION);
      
      // Insert device
      const result = await this.db.query(`
        INSERT INTO trusted_devices (
          user_id, device_name, device_fingerprint, verification_token,
          ip_address, user_agent, location, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (device_fingerprint)
        DO UPDATE SET
          device_name = EXCLUDED.device_name,
          verification_token = EXCLUDED.verification_token,
          ip_address = EXCLUDED.ip_address,
          user_agent = EXCLUDED.user_agent,
          location = EXCLUDED.location,
          expires_at = EXCLUDED.expires_at,
          trust_level = 'pending'
        RETURNING id
      `, [userId, deviceName, deviceFingerprint, verificationToken, ipAddress, userAgent, location, expiresAt]);
      
      const deviceId = result.rows[0].id;
      
      // Send device verification notification
      await this.sendNotification(userId, MFA_CONFIG.NOTIFICATION_TYPES.DEVICE_REGISTERED, {
        deviceName,
        verificationToken,
        expiresAt
      });
      
      this.logMFAEvent('DEVICE_REGISTERED', {
        userId,
        deviceId,
        deviceName,
        deviceFingerprint: deviceFingerprint.substring(0, 8) + '...'
      });
      
      return {
        deviceId,
        verificationToken,
        expiresAt,
        status: 'pending_verification'
      };
    } catch (error) {
      this.logger.error('Error registering trusted device:', error);
      throw new Error('Failed to register trusted device');
    }
  }

  /**
   * Verify trusted device
   * @param {string} verificationToken - Device verification token
   * @returns {boolean} True if successful
   */
  async verifyTrustedDevice(verificationToken) {
    try {
      const result = await this.db.query(`
        UPDATE trusted_devices
        SET trust_level = 'trusted',
            trusted_at = NOW(),
            verification_token = NULL
        WHERE verification_token = $1
          AND trust_level = 'pending'
          AND expires_at > NOW()
        RETURNING id, user_id, device_name
      `, [verificationToken]);
      
      if (result.rows.length === 0) {
        throw new Error('Invalid or expired verification token');
      }
      
      const device = result.rows[0];
      
      this.logMFAEvent('DEVICE_VERIFIED', {
        userId: device.user_id,
        deviceId: device.id,
        deviceName: device.device_name
      });
      
      return true;
    } catch (error) {
      this.logger.error('Error verifying trusted device:', error);
      throw error;
    }
  }

  /**
   * Check if device is trusted
   * @param {string} userId - User ID
   * @param {string} deviceFingerprint - Device fingerprint
   * @returns {boolean} True if device is trusted
   */
  async isDeviceTrusted(userId, deviceFingerprint) {
    try {
      const result = await this.db.query(`
        SELECT trust_level, expires_at
        FROM trusted_devices
        WHERE user_id = $1 
          AND device_fingerprint = $2
          AND trust_level = 'trusted'
          AND expires_at > NOW()
      `, [userId, deviceFingerprint]);
      
      if (result.rows.length > 0) {
        // Update last used timestamp
        await this.db.query(`
          UPDATE trusted_devices
          SET last_used = NOW()
          WHERE user_id = $1 AND device_fingerprint = $2
        `, [userId, deviceFingerprint]);
        
        return true;
      }
      
      return false;
    } catch (error) {
      this.logger.error('Error checking device trust:', error);
      return false;
    }
  }

  /**
   * Disable MFA for user
   * @param {string} userId - User ID
   * @param {string} confirmationToken - Confirmation token (backup code or TOTP)
   * @returns {boolean} True if successful
   */
  async disableMFA(userId, confirmationToken) {
    try {
      // Verify the confirmation token
      const verified = await this.verifyMFAToken(userId, confirmationToken);
      if (!verified) {
        throw new Error('Invalid confirmation token');
      }
      
      // Disable MFA
      await this.db.query(`
        UPDATE user_mfa
        SET is_enabled = FALSE,
            totp_verified = FALSE,
            backup_codes = '{}',
            backup_codes_used = '{}',
            failed_attempts = 0,
            locked_until = NULL,
            updated_at = NOW()
        WHERE user_id = $1
      `, [userId]);
      
      // Remove trusted devices
      await this.db.query(`
        DELETE FROM trusted_devices WHERE user_id = $1
      `, [userId]);
      
      await this.sendNotification(userId, MFA_CONFIG.NOTIFICATION_TYPES.MFA_DISABLED);
      
      this.logMFAEvent('MFA_DISABLED', {
        userId
      });
      
      return true;
    } catch (error) {
      this.logger.error('Error disabling MFA:', error);
      throw error;
    }
  }

  /**
   * Get user MFA data
   * @param {string} userId - User ID
   * @returns {Object} MFA data
   */
  async getUserMFA(userId) {
    try {
      const result = await this.db.query(`
        SELECT * FROM user_mfa WHERE user_id = $1
      `, [userId]);
      
      return result.rows[0] || null;
    } catch (error) {
      this.logger.error('Error getting user MFA data:', error);
      return null;
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Object} User data
   */
  async getUserById(userId) {
    try {
      const result = await this.db.query(`
        SELECT id, username, wallet_address, email FROM users WHERE id = $1
      `, [userId]);
      
      return result.rows[0] || null;
    } catch (error) {
      this.logger.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Get user trusted device count
   * @param {string} userId - User ID
   * @returns {number} Device count
   */
  async getUserTrustedDeviceCount(userId) {
    try {
      const result = await this.db.query(`
        SELECT COUNT(*) FROM trusted_devices 
        WHERE user_id = $1 AND trust_level = 'trusted' AND expires_at > NOW()
      `, [userId]);
      
      return parseInt(result.rows[0].count);
    } catch (error) {
      this.logger.error('Error getting device count:', error);
      return 0;
    }
  }

  /**
   * Check if user is locked due to failed attempts
   * @param {string} userId - User ID
   * @returns {boolean} True if locked
   */
  async isUserLocked(userId) {
    try {
      const result = await this.db.query(`
        SELECT locked_until FROM user_mfa 
        WHERE user_id = $1 AND locked_until > NOW()
      `, [userId]);
      
      return result.rows.length > 0;
    } catch (error) {
      this.logger.error('Error checking user lock status:', error);
      return false;
    }
  }

  /**
   * Increment failed MFA attempts
   * @param {string} userId - User ID
   */
  async incrementFailedAttempts(userId) {
    try {
      const result = await this.db.query(`
        UPDATE user_mfa 
        SET failed_attempts = failed_attempts + 1
        WHERE user_id = $1
        RETURNING failed_attempts
      `, [userId]);
      
      const failedAttempts = result.rows[0]?.failed_attempts || 0;
      
      // Lock account if max attempts reached
      if (failedAttempts >= MFA_CONFIG.MAX_FAILED_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + MFA_CONFIG.LOCKOUT_DURATION);
        
        await this.db.query(`
          UPDATE user_mfa 
          SET locked_until = $2
          WHERE user_id = $1
        `, [userId, lockedUntil]);
        
        await this.sendNotification(userId, 'account_locked', {
          lockedUntil,
          reason: 'too_many_failed_mfa_attempts'
        });
      }
    } catch (error) {
      this.logger.error('Error incrementing failed attempts:', error);
    }
  }

  /**
   * Reset failed MFA attempts
   * @param {string} userId - User ID
   */
  async resetFailedAttempts(userId) {
    try {
      await this.db.query(`
        UPDATE user_mfa 
        SET failed_attempts = 0, locked_until = NULL
        WHERE user_id = $1
      `, [userId]);
    } catch (error) {
      this.logger.error('Error resetting failed attempts:', error);
    }
  }

  /**
   * Send notification
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   */
  async sendNotification(userId, type, data = {}) {
    try {
      if (this.notificationService) {
        await this.notificationService.send(userId, type, data);
      } else {
        // Log notification if service not available
        this.logger.info(`Notification [${type}] for user ${userId}:`, data);
      }
    } catch (error) {
      this.logger.error('Error sending notification:', error);
    }
  }

  /**
   * Log MFA events
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  logMFAEvent(event, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      data: {
        ...data,
        // Sanitize sensitive data
        userId: data.userId ? `${data.userId.substring(0, 8)}...` : undefined
      }
    };
    
    this.logger.info('MFA Event:', logEntry);
    
    // Store in database
    if (data.userId && data.method) {
      this.db.query(`
        INSERT INTO mfa_logs (user_id, method, success, ip_address, user_agent, device_fingerprint)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        data.userId,
        data.method || 'unknown',
        event.includes('SUCCESS') || event.includes('ENABLED'),
        data.context?.ipAddress,
        data.context?.userAgent,
        data.context?.deviceFingerprint
      ]).catch(err => {
        this.logger.warn('Error logging MFA event to database:', err);
      });
    }
  }

  /**
   * Start cleanup tasks
   */
  startCleanupTasks() {
    // Clean expired devices every hour
    setInterval(async () => {
      await this.cleanupExpiredDevices();
    }, 60 * 60 * 1000);
    
    // Clean old MFA logs every day
    setInterval(async () => {
      await this.cleanupOldLogs();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Cleanup expired trusted devices
   */
  async cleanupExpiredDevices() {
    try {
      const result = await this.db.query(`
        DELETE FROM trusted_devices 
        WHERE expires_at < NOW() OR (trust_level = 'pending' AND created_at < NOW() - INTERVAL '1 day')
      `);
      
      if (result.rowCount > 0) {
        this.logger.info(`Cleaned up ${result.rowCount} expired trusted devices`);
      }
    } catch (error) {
      this.logger.error('Error cleaning up expired devices:', error);
    }
  }

  /**
   * Cleanup old MFA logs
   */
  async cleanupOldLogs() {
    try {
      const result = await this.db.query(`
        DELETE FROM mfa_logs 
        WHERE created_at < NOW() - INTERVAL '90 days'
      `);
      
      if (result.rowCount > 0) {
        this.logger.info(`Cleaned up ${result.rowCount} old MFA log entries`);
      }
    } catch (error) {
      this.logger.error('Error cleaning up old MFA logs:', error);
    }
  }

  /**
   * Get MFA metrics
   * @returns {Object} MFA metrics
   */
  async getMetrics() {
    try {
      const enabledUsers = await this.db.query(`
        SELECT COUNT(*) FROM user_mfa WHERE is_enabled = TRUE
      `);
      
      const trustedDevices = await this.db.query(`
        SELECT COUNT(*) FROM trusted_devices WHERE trust_level = 'trusted'
      `);
      
      const recentLogs = await this.db.query(`
        SELECT COUNT(*) FROM mfa_logs WHERE created_at > NOW() - INTERVAL '24 hours'
      `);
      
      return {
        enabledUsers: parseInt(enabledUsers.rows[0].count),
        trustedDevices: parseInt(trustedDevices.rows[0].count),
        recentAuthentications: parseInt(recentLogs.rows[0].count)
      };
    } catch (error) {
      this.logger.error('Error getting MFA metrics:', error);
      return {};
    }
  }

  /**
   * Shutdown MFA service
   */
  async shutdown() {
    try {
      if (this.redis) {
        await this.redis.disconnect();
      }
      
      if (this.db) {
        await this.db.end();
      }
      
      this.attemptCache.clear();
      this.deviceCache.clear();
      
      this.logger.info('MFA Service shutdown complete');
    } catch (error) {
      this.logger.error('Error during MFA shutdown:', error);
    }
  }
}

// Export MFA service and constants
export { MFAService, MFA_CONFIG, MFA_METHODS, TRUST_LEVELS };
export default MFAService;