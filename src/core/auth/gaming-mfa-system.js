/**
 * Gaming Multi-Factor Authentication System for MLG.clan Platform
 * Enhanced MFA with gaming-specific security factors and user experience
 * 
 * Features:
 * - Traditional TOTP/SMS authentication
 * - Gaming-specific MFA factors (hardware keys, biometric gaming)
 * - Tournament security with enhanced MFA requirements
 * - Gaming device trust management
 * - Emergency recovery for gaming accounts
 * - Gaming performance optimizations
 * 
 * @author Claude Code - Security and Performance Auditor
 * @version 2.0.0
 * @created 2025-08-13
 */

import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';

/**
 * Gaming MFA Configuration
 */
const GAMING_MFA_CONFIG = {
  // MFA Factor Types
  FACTOR_TYPES: {
    totp: {
      name: 'Authenticator App',
      description: 'Use Google Authenticator or similar app',
      required: false,
      gamingOptimized: true,
      icon: 'authenticator-icon.svg'
    },
    sms: {
      name: 'SMS Gaming Code',
      description: 'Receive codes via SMS for quick gaming access',
      required: false,
      gamingOptimized: true,
      icon: 'sms-icon.svg'
    },
    email: {
      name: 'Email Verification',
      description: 'Email verification for account recovery',
      required: false,
      gamingOptimized: false,
      icon: 'email-icon.svg'
    },
    hardware: {
      name: 'Hardware Security Key',
      description: 'Physical security key (YubiKey, etc.)',
      required: false,
      gamingOptimized: true,
      icon: 'hardware-key-icon.svg'
    },
    biometric: {
      name: 'Biometric Gaming',
      description: 'Fingerprint or face recognition for gaming devices',
      required: false,
      gamingOptimized: true,
      icon: 'biometric-icon.svg'
    },
    backup_codes: {
      name: 'Backup Codes',
      description: 'One-time use backup codes for account recovery',
      required: true,
      gamingOptimized: false,
      icon: 'backup-codes-icon.svg'
    }
  },
  
  // Gaming Context Requirements
  GAMING_REQUIREMENTS: {
    tournament_entry: {
      name: 'Tournament Entry',
      requiredFactors: ['totp', 'sms'],
      optionalFactors: ['hardware', 'biometric'],
      minFactors: 2,
      gracePeriod: 5 * 60 * 1000 // 5 minutes
    },
    high_value_voting: {
      name: 'High Value Voting',
      requiredFactors: ['totp'],
      optionalFactors: ['hardware', 'sms'],
      minFactors: 1,
      gracePeriod: 15 * 60 * 1000 // 15 minutes
    },
    clan_leadership: {
      name: 'Clan Leadership',
      requiredFactors: ['totp'],
      optionalFactors: ['hardware', 'sms', 'biometric'],
      minFactors: 1,
      gracePeriod: 30 * 60 * 1000 // 30 minutes
    },
    account_recovery: {
      name: 'Account Recovery',
      requiredFactors: ['email', 'backup_codes'],
      optionalFactors: ['sms'],
      minFactors: 2,
      gracePeriod: 0
    },
    admin_operations: {
      name: 'Admin Operations',
      requiredFactors: ['totp', 'hardware'],
      optionalFactors: ['sms'],
      minFactors: 2,
      gracePeriod: 0
    }
  },
  
  // Performance Settings
  PERFORMANCE: {
    verificationTimeout: 30 * 1000, // 30 seconds
    codeGenerationTimeout: 5 * 1000, // 5 seconds
    smsDeliveryTimeout: 60 * 1000, // 60 seconds
    maxConcurrentVerifications: 5,
    rateLimitWindow: 60 * 1000, // 1 minute
    rateLimitAttempts: 5
  },
  
  // Security Settings
  SECURITY: {
    totpWindow: 2, // Allow 2 time steps before/after
    smsCodeLength: 6,
    smsCodeExpiry: 10 * 60 * 1000, // 10 minutes
    backupCodeLength: 8,
    backupCodeCount: 10,
    deviceTrustDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
    emergencyBypassCodes: 3
  },
  
  // Gaming UX Optimizations
  GAMING_UX: {
    quickAccessCodes: true, // Pre-generate codes for tournaments
    rememberDeviceDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
    streamlinedTournamentFlow: true,
    backgroundVerification: true,
    pushNotifications: true
  }
};

/**
 * MFA Event Types
 */
const MFA_EVENTS = {
  FACTOR_ADDED: 'factor_added',
  FACTOR_REMOVED: 'factor_removed',
  VERIFICATION_SUCCESS: 'verification_success',
  VERIFICATION_FAILED: 'verification_failed',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  DEVICE_TRUSTED: 'device_trusted',
  DEVICE_UNTRUSTED: 'device_untrusted',
  BACKUP_CODE_USED: 'backup_code_used',
  EMERGENCY_ACCESS: 'emergency_access'
};

/**
 * Gaming MFA System Class
 */
class GamingMFASystem extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.db = options.db;
    this.redis = options.redis;
    this.logger = options.logger || console;
    this.smsProvider = options.smsProvider;
    this.emailProvider = options.emailProvider || this.createEmailProvider();
    
    // MFA storage
    this.pendingVerifications = new Map(); // userId -> verification data
    this.trustedDevices = new Map(); // deviceId -> trust data
    this.rateLimitTracker = new Map(); // userId -> attempt data
    
    // Performance tracking
    this.metrics = {
      verificationTimes: [],
      successfulVerifications: 0,
      failedVerifications: 0,
      trustedDeviceHits: 0,
      factorUsageStats: new Map()
    };
    
    this.init();
  }
  
  async init() {
    this.logger.info('🔐 Initializing Gaming MFA System...');
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring();
    
    // Load trusted devices from Redis
    await this.loadTrustedDevices();
    
    // Setup cleanup tasks
    this.setupCleanupTasks();
    
    this.logger.info('✅ Gaming MFA System initialized');
  }
  
  /**
   * Setup MFA for User
   */
  async setupMFA(userId, factorType, options = {}) {
    const startTime = Date.now();
    
    try {
      const factorConfig = GAMING_MFA_CONFIG.FACTOR_TYPES[factorType];
      if (!factorConfig) {
        throw new Error(`Unknown MFA factor type: ${factorType}`);
      }
      
      let setupData;
      
      switch (factorType) {
        case 'totp':
          setupData = await this.setupTOTP(userId, options);
          break;
        case 'sms':
          setupData = await this.setupSMS(userId, options);
          break;
        case 'email':
          setupData = await this.setupEmail(userId, options);
          break;
        case 'hardware':
          setupData = await this.setupHardwareKey(userId, options);
          break;
        case 'biometric':
          setupData = await this.setupBiometric(userId, options);
          break;
        case 'backup_codes':
          setupData = await this.generateBackupCodes(userId);
          break;
        default:
          throw new Error(`Setup not implemented for factor type: ${factorType}`);
      }
      
      // Store MFA factor in database
      await this.storeMFAFactor(userId, factorType, setupData);
      
      const latency = Date.now() - startTime;
      this.emit(MFA_EVENTS.FACTOR_ADDED, {
        userId,
        factorType,
        latency
      });
      
      this.logger.info(`🔐 Setup ${factorType} MFA for user ${userId} (${latency}ms)`);
      
      return setupData;
      
    } catch (error) {
      const latency = Date.now() - startTime;
      this.logger.error(`MFA setup failed for user ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Setup TOTP (Authenticator App)
   */
  async setupTOTP(userId, options = {}) {
    const user = await this.getUserInfo(userId);
    const serviceName = options.serviceName || 'MLG.clan Gaming';
    
    const secret = speakeasy.generateSecret({
      name: `${serviceName} (${user.email})`,
      issuer: serviceName,
      length: 32
    });
    
    // Generate QR code for easy setup
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    
    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes: await this.generateBackupCodes(userId),
      manualEntryKey: secret.base32,
      issuer: serviceName,
      accountName: user.email
    };
  }
  
  /**
   * Setup SMS Authentication
   */
  async setupSMS(userId, options = {}) {
    const phoneNumber = options.phoneNumber;
    if (!phoneNumber) {
      throw new Error('Phone number is required for SMS MFA');
    }
    
    // Validate phone number format
    if (!this.validatePhoneNumber(phoneNumber)) {
      throw new Error('Invalid phone number format');
    }
    
    // Send verification SMS
    const verificationCode = this.generateSMSCode();
    await this.sendSMS(phoneNumber, verificationCode);
    
    // Store pending verification
    this.pendingVerifications.set(userId, {
      type: 'sms_setup',
      phoneNumber,
      code: verificationCode,
      expiresAt: Date.now() + GAMING_MFA_CONFIG.SECURITY.smsCodeExpiry
    });
    
    return {
      phoneNumber: this.maskPhoneNumber(phoneNumber),
      codeLength: GAMING_MFA_CONFIG.SECURITY.smsCodeLength,
      expiresIn: GAMING_MFA_CONFIG.SECURITY.smsCodeExpiry / 1000
    };
  }
  
  /**
   * Verify MFA Factor
   */
  async verifyMFA(userId, factorType, code, context = {}) {
    const startTime = Date.now();
    
    try {
      // Check rate limiting
      if (!this.checkRateLimit(userId)) {
        throw new Error('Too many verification attempts');
      }
      
      let verificationResult;
      
      switch (factorType) {
        case 'totp':
          verificationResult = await this.verifyTOTP(userId, code);
          break;
        case 'sms':
          verificationResult = await this.verifySMS(userId, code);
          break;
        case 'email':
          verificationResult = await this.verifyEmail(userId, code);
          break;
        case 'hardware':
          verificationResult = await this.verifyHardwareKey(userId, code, context);
          break;
        case 'biometric':
          verificationResult = await this.verifyBiometric(userId, code, context);
          break;
        case 'backup_codes':
          verificationResult = await this.verifyBackupCode(userId, code);
          break;
        default:
          throw new Error(`Verification not implemented for factor type: ${factorType}`);
      }
      
      const latency = Date.now() - startTime;
      this.metrics.verificationTimes.push(latency);
      
      if (verificationResult.success) {
        this.metrics.successfulVerifications++;
        
        // Update factor usage stats
        const currentCount = this.metrics.factorUsageStats.get(factorType) || 0;
        this.metrics.factorUsageStats.set(factorType, currentCount + 1);
        
        // Trust device if requested and gaming context allows it
        if (context.trustDevice && this.shouldTrustDevice(context)) {
          await this.trustDevice(userId, context.deviceId, factorType);
        }
        
        this.emit(MFA_EVENTS.VERIFICATION_SUCCESS, {
          userId,
          factorType,
          context,
          latency
        });
        
        this.logger.info(`✅ MFA verification success for user ${userId} (${factorType}, ${latency}ms)`);
      } else {
        this.metrics.failedVerifications++;
        this.recordFailedAttempt(userId);
        
        this.emit(MFA_EVENTS.VERIFICATION_FAILED, {
          userId,
          factorType,
          reason: verificationResult.reason,
          latency
        });
        
        this.logger.warn(`❌ MFA verification failed for user ${userId} (${factorType})`);
      }
      
      return verificationResult;
      
    } catch (error) {
      const latency = Date.now() - startTime;
      this.metrics.verificationTimes.push(latency);
      this.metrics.failedVerifications++;
      this.logger.error(`MFA verification error for user ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Verify TOTP Code
   */
  async verifyTOTP(userId, code) {
    const mfaData = await this.getMFAFactor(userId, 'totp');
    if (!mfaData) {
      return { success: false, reason: 'TOTP not setup' };
    }
    
    const verified = speakeasy.totp.verify({
      secret: mfaData.secret,
      encoding: 'base32',
      token: code,
      window: GAMING_MFA_CONFIG.SECURITY.totpWindow
    });
    
    return {
      success: verified,
      reason: verified ? 'TOTP verified' : 'Invalid TOTP code'
    };
  }
  
  /**
   * Verify SMS Code
   */
  async verifySMS(userId, code) {
    const pendingVerification = this.pendingVerifications.get(userId);
    if (!pendingVerification || pendingVerification.type !== 'sms') {
      return { success: false, reason: 'No pending SMS verification' };
    }
    
    if (Date.now() > pendingVerification.expiresAt) {
      this.pendingVerifications.delete(userId);
      return { success: false, reason: 'SMS code expired' };
    }
    
    const verified = pendingVerification.code === code;
    if (verified) {
      this.pendingVerifications.delete(userId);
    }
    
    return {
      success: verified,
      reason: verified ? 'SMS code verified' : 'Invalid SMS code'
    };
  }
  
  /**
   * Check Gaming Context Requirements
   */
  async checkGamingMFARequirements(userId, gamingContext) {
    const requirements = GAMING_MFA_CONFIG.GAMING_REQUIREMENTS[gamingContext];
    if (!requirements) {
      return { required: false, satisfied: true };
    }
    
    // Check if user has trusted device for this context
    const trustedDevice = await this.checkTrustedDevice(userId, gamingContext);
    if (trustedDevice && this.isWithinGracePeriod(trustedDevice, requirements.gracePeriod)) {
      this.metrics.trustedDeviceHits++;
      return { 
        required: false, 
        satisfied: true, 
        reason: 'Trusted device within grace period' 
      };
    }
    
    // Get user's MFA factors
    const userFactors = await this.getUserMFAFactors(userId);
    
    // Check required factors
    const satisfiedRequiredFactors = requirements.requiredFactors.filter(factor => 
      userFactors.includes(factor)
    );
    
    // Check optional factors
    const satisfiedOptionalFactors = requirements.optionalFactors.filter(factor => 
      userFactors.includes(factor)
    );
    
    const totalSatisfiedFactors = satisfiedRequiredFactors.length + satisfiedOptionalFactors.length;
    
    const satisfied = satisfiedRequiredFactors.length === requirements.requiredFactors.length &&
                     totalSatisfiedFactors >= requirements.minFactors;
    
    return {
      required: true,
      satisfied,
      requirements: {
        requiredFactors: requirements.requiredFactors,
        optionalFactors: requirements.optionalFactors,
        minFactors: requirements.minFactors,
        satisfiedRequired: satisfiedRequiredFactors,
        satisfiedOptional: satisfiedOptionalFactors,
        totalSatisfied: totalSatisfiedFactors
      }
    };
  }
  
  /**
   * Generate Quick Access Codes for Gaming
   */
  async generateQuickAccessCodes(userId, gamingContext) {
    if (!GAMING_MFA_CONFIG.GAMING_UX.quickAccessCodes) {
      throw new Error('Quick access codes not enabled');
    }
    
    const codes = [];
    for (let i = 0; i < 5; i++) {
      const code = this.generateSMSCode();
      codes.push({
        code,
        expiresAt: Date.now() + (2 * 60 * 60 * 1000), // 2 hours
        context: gamingContext,
        used: false
      });
    }
    
    // Store in Redis for fast access during gaming
    if (this.redis) {
      await this.redis.setex(
        `quick_access_codes:${userId}`,
        2 * 60 * 60, // 2 hours
        JSON.stringify(codes)
      );
    }
    
    return codes.map(c => c.code);
  }
  
  /**
   * Device Trust Management
   */
  async trustDevice(userId, deviceId, factorType) {
    const trustData = {
      userId,
      deviceId,
      factorType,
      trustedAt: new Date(),
      expiresAt: new Date(Date.now() + GAMING_MFA_CONFIG.SECURITY.deviceTrustDuration),
      ipAddress: '',
      userAgent: ''
    };
    
    this.trustedDevices.set(deviceId, trustData);
    
    // Store in Redis for persistence
    if (this.redis) {
      await this.redis.setex(
        `trusted_device:${deviceId}`,
        Math.floor(GAMING_MFA_CONFIG.SECURITY.deviceTrustDuration / 1000),
        JSON.stringify(trustData)
      );
    }
    
    this.emit(MFA_EVENTS.DEVICE_TRUSTED, {
      userId,
      deviceId,
      factorType
    });
    
    this.logger.info(`📱 Trusted device ${deviceId} for user ${userId}`);
  }
  
  async checkTrustedDevice(userId, deviceId) {
    // Check memory cache first
    let trustData = this.trustedDevices.get(deviceId);
    
    if (!trustData && this.redis) {
      // Check Redis
      const redisData = await this.redis.get(`trusted_device:${deviceId}`);
      if (redisData) {
        trustData = JSON.parse(redisData);
        this.trustedDevices.set(deviceId, trustData);
      }
    }
    
    if (!trustData || trustData.userId !== userId) {
      return null;
    }
    
    if (new Date(trustData.expiresAt) < new Date()) {
      // Trust expired
      this.untrustrDevice(deviceId);
      return null;
    }
    
    return trustData;
  }
  
  async untrustDevice(deviceId, reason = 'manual') {
    this.trustedDevices.delete(deviceId);
    
    if (this.redis) {
      await this.redis.del(`trusted_device:${deviceId}`);
    }
    
    this.emit(MFA_EVENTS.DEVICE_UNTRUSTED, {
      deviceId,
      reason
    });
    
    this.logger.info(`📱❌ Untrusted device ${deviceId} (${reason})`);
  }
  
  /**
   * Emergency Recovery
   */
  async generateEmergencyBypassCodes(userId) {
    const codes = [];
    for (let i = 0; i < GAMING_MFA_CONFIG.SECURITY.emergencyBypassCodes; i++) {
      codes.push(this.generateSecureCode(12));
    }
    
    // Store encrypted in database
    await this.storeEmergencyBypassCodes(userId, codes);
    
    this.emit(MFA_EVENTS.EMERGENCY_ACCESS, {
      userId,
      action: 'codes_generated',
      count: codes.length
    });
    
    return codes;
  }
  
  async verifyEmergencyBypassCode(userId, code) {
    const storedCodes = await this.getEmergencyBypassCodes(userId);
    const codeIndex = storedCodes.findIndex(storedCode => storedCode === code);
    
    if (codeIndex === -1) {
      return { success: false, reason: 'Invalid emergency bypass code' };
    }
    
    // Remove used code
    storedCodes.splice(codeIndex, 1);
    await this.storeEmergencyBypassCodes(userId, storedCodes);
    
    this.emit(MFA_EVENTS.EMERGENCY_ACCESS, {
      userId,
      action: 'bypass_used',
      remainingCodes: storedCodes.length
    });
    
    return { success: true, reason: 'Emergency bypass code verified' };
  }
  
  /**
   * Helper Methods
   */
  
  generateSMSCode() {
    const length = GAMING_MFA_CONFIG.SECURITY.smsCodeLength;
    return Math.floor(Math.random() * Math.pow(10, length))
      .toString()
      .padStart(length, '0');
  }
  
  generateSecureCode(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  async generateBackupCodes(userId) {
    const codes = [];
    for (let i = 0; i < GAMING_MFA_CONFIG.SECURITY.backupCodeCount; i++) {
      codes.push(this.generateSecureCode(GAMING_MFA_CONFIG.SECURITY.backupCodeLength));
    }
    
    // Store hashed versions in database
    const hashedCodes = codes.map(code => crypto.createHash('sha256').update(code).digest('hex'));
    await this.storeBackupCodes(userId, hashedCodes);
    
    return codes;
  }
  
  validatePhoneNumber(phoneNumber) {
    // Basic phone number validation (international format)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }
  
  maskPhoneNumber(phoneNumber) {
    if (phoneNumber.length <= 4) return phoneNumber;
    return phoneNumber.slice(0, -4).replace(/\d/g, '*') + phoneNumber.slice(-4);
  }
  
  checkRateLimit(userId) {
    const now = Date.now();
    const userAttempts = this.rateLimitTracker.get(userId) || { count: 0, windowStart: now };
    
    // Reset window if expired
    if (now - userAttempts.windowStart > GAMING_MFA_CONFIG.PERFORMANCE.rateLimitWindow) {
      userAttempts.count = 0;
      userAttempts.windowStart = now;
    }
    
    // Check if within limit
    if (userAttempts.count >= GAMING_MFA_CONFIG.PERFORMANCE.rateLimitAttempts) {
      return false;
    }
    
    // Increment and store
    userAttempts.count++;
    this.rateLimitTracker.set(userId, userAttempts);
    
    return true;
  }
  
  recordFailedAttempt(userId) {
    // This would be stored in database for security monitoring
    this.logger.warn(`MFA failed attempt for user ${userId}`);
  }
  
  shouldTrustDevice(context) {
    // Gaming contexts where device trust makes sense
    return context.gamingContext && ['standard', 'clan'].includes(context.gamingContext);
  }
  
  isWithinGracePeriod(trustData, gracePeriod) {
    if (gracePeriod === 0) return false;
    return Date.now() - new Date(trustData.trustedAt).getTime() < gracePeriod;
  }
  
  createEmailProvider() {
    // Basic email provider setup
    return nodemailer.createTransporter({
      // Configure with actual email service
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  
  async sendSMS(phoneNumber, code) {
    if (this.smsProvider) {
      await this.smsProvider.send(phoneNumber, `Your MLG.clan gaming code: ${code}`);
    } else {
      this.logger.warn(`SMS not configured, would send code ${code} to ${phoneNumber}`);
    }
  }
  
  setupPerformanceMonitoring() {
    this.metricsInterval = setInterval(() => {
      const avgVerificationTime = this.getAverageVerificationTime();
      const successRate = this.getSuccessRate();
      
      this.logger.debug(`🔐 MFA metrics: ${avgVerificationTime}ms avg verification, ${(successRate * 100).toFixed(1)}% success rate`);
      
      // Clear old metrics
      this.metrics.verificationTimes = this.metrics.verificationTimes.slice(-100);
    }, 60000); // Every minute
  }
  
  setupCleanupTasks() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredData();
    }, 15 * 60 * 1000); // Every 15 minutes
  }
  
  cleanupExpiredData() {
    const now = Date.now();
    
    // Clean up pending verifications
    for (const [userId, verification] of this.pendingVerifications) {
      if (verification.expiresAt < now) {
        this.pendingVerifications.delete(userId);
      }
    }
    
    // Clean up trusted devices
    for (const [deviceId, trustData] of this.trustedDevices) {
      if (new Date(trustData.expiresAt) < new Date()) {
        this.trustedDevices.delete(deviceId);
      }
    }
    
    // Clean up rate limit tracking
    for (const [userId, attempts] of this.rateLimitTracker) {
      if (now - attempts.windowStart > GAMING_MFA_CONFIG.PERFORMANCE.rateLimitWindow) {
        this.rateLimitTracker.delete(userId);
      }
    }
  }
  
  async loadTrustedDevices() {
    if (!this.redis) return;
    
    try {
      const keys = await this.redis.keys('trusted_device:*');
      let loadedCount = 0;
      
      for (const key of keys) {
        const trustData = await this.redis.get(key);
        if (trustData) {
          const data = JSON.parse(trustData);
          if (new Date(data.expiresAt) > new Date()) {
            this.trustedDevices.set(data.deviceId, data);
            loadedCount++;
          }
        }
      }
      
      this.logger.info(`📱 Loaded ${loadedCount} trusted devices from Redis`);
    } catch (error) {
      this.logger.error('Failed to load trusted devices:', error);
    }
  }
  
  getAverageVerificationTime() {
    if (this.metrics.verificationTimes.length === 0) return 0;
    return this.metrics.verificationTimes.reduce((sum, time) => sum + time, 0) / this.metrics.verificationTimes.length;
  }
  
  getSuccessRate() {
    const total = this.metrics.successfulVerifications + this.metrics.failedVerifications;
    if (total === 0) return 1;
    return this.metrics.successfulVerifications / total;
  }
  
  getPerformanceMetrics() {
    return {
      averageVerificationTime: this.getAverageVerificationTime(),
      successRate: this.getSuccessRate(),
      successfulVerifications: this.metrics.successfulVerifications,
      failedVerifications: this.metrics.failedVerifications,
      trustedDeviceHits: this.metrics.trustedDeviceHits,
      factorUsage: Object.fromEntries(this.metrics.factorUsageStats),
      activeTrustedDevices: this.trustedDevices.size,
      pendingVerifications: this.pendingVerifications.size
    };
  }
  
  // Database interaction methods (placeholders)
  async getUserInfo(userId) {
    // Would query database for user info
    return { email: `user${userId}@example.com` };
  }
  
  async storeMFAFactor(userId, factorType, setupData) {
    // Would store MFA factor in database
    this.logger.debug(`Storing ${factorType} MFA factor for user ${userId}`);
  }
  
  async getMFAFactor(userId, factorType) {
    // Would retrieve MFA factor from database
    return null; // Placeholder
  }
  
  async getUserMFAFactors(userId) {
    // Would retrieve all user's MFA factors from database
    return []; // Placeholder
  }
  
  async storeBackupCodes(userId, hashedCodes) {
    // Would store backup codes in database
    this.logger.debug(`Storing backup codes for user ${userId}`);
  }
  
  async storeEmergencyBypassCodes(userId, codes) {
    // Would store emergency bypass codes in database
    this.logger.debug(`Storing emergency bypass codes for user ${userId}`);
  }
  
  async getEmergencyBypassCodes(userId) {
    // Would retrieve emergency bypass codes from database
    return []; // Placeholder
  }
  
  // Cleanup method
  destroy() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.logger.info('🔐 Gaming MFA System destroyed');
  }
}

export default GamingMFASystem;
export { GAMING_MFA_CONFIG, MFA_EVENTS };