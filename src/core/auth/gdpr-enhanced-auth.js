/**
 * GDPR-Enhanced Authentication Service
 * 
 * Extends the existing authentication service with GDPR compliance including:
 * - Consent tracking during authentication
 * - Privacy-aware session management
 * - Data processing transparency
 * - Audit logging for authentication events
 * 
 * @author Claude Code - Security & Privacy Architect
 * @version 1.0.0
 * @created 2025-08-13
 */

import AuthService from './auth-service.js';
import GDPRComplianceService from '../privacy/gdpr-compliance-service.js';

/**
 * GDPR-Enhanced Authentication Service
 */
export class GDPREnhancedAuthService extends AuthService {
  constructor(options = {}) {
    super(options);
    
    this.gdprService = options.gdprService || new GDPRComplianceService(options);
    this.requireConsentForAuth = options.requireConsentForAuth !== false; // Default true
    
    // Bind enhanced methods
    this.generateChallenge = this.generateChallenge.bind(this);
    this.verifySignature = this.verifySignature.bind(this);
    this.createSession = this.createSession.bind(this);
  }

  /**
   * Initialize both auth and GDPR services
   */
  async initialize() {
    await super.initializeDatabase();
    await super.initializeRedis();
    await this.gdprService.initialize();
    
    this.logger.info('GDPR-Enhanced Authentication Service initialized');
  }

  /**
   * Enhanced challenge generation with GDPR consent check
   */
  async generateChallenge(walletAddress, walletType = 'phantom', ipAddress = null, options = {}) {
    try {
      // Generate standard challenge
      const challenge = await super.generateChallenge(walletAddress, walletType, ipAddress);
      
      // Check if user exists and has required consents
      const existingUser = await this.getUserByWalletAddress(walletAddress);
      let consentStatus = null;
      
      if (existingUser && this.requireConsentForAuth) {
        consentStatus = await this.checkAuthenticationConsents(existingUser.id);
      }

      // Log challenge generation with GDPR context
      await this.gdprService.logGDPREvent(
        existingUser?.id || null,
        'AUTH_CHALLENGE_GENERATED',
        {
          walletAddress: `${walletAddress.substring(0, 8)}...${walletAddress.slice(-4)}`,
          walletType,
          hasExistingUser: !!existingUser,
          consentStatus,
          requiresConsent: this.requireConsentForAuth
        },
        ipAddress,
        options.userAgent
      );

      return {
        ...challenge,
        gdprContext: {
          isNewUser: !existingUser,
          requiresConsent: this.requireConsentForAuth && !consentStatus?.hasRequiredConsents,
          consentStatus
        }
      };
    } catch (error) {
      this.logger.error('Error generating GDPR-enhanced challenge:', error);
      throw error;
    }
  }

  /**
   * Enhanced signature verification with consent validation
   */
  async verifySignature(
    walletAddress, 
    signature, 
    nonce, 
    ipAddress = null, 
    userAgent = null, 
    consentData = null
  ) {
    try {
      // Perform standard signature verification
      const authResult = await super.verifySignature(
        walletAddress, 
        signature, 
        nonce, 
        ipAddress, 
        userAgent
      );

      if (!authResult.success) {
        return authResult;
      }

      const { user, session } = authResult;

      // Process consent data if provided (for new users or consent updates)
      if (consentData) {
        await this.processAuthenticationConsent(
          user.id,
          consentData,
          ipAddress,
          userAgent
        );
      }

      // Check required consents for existing users
      if (this.requireConsentForAuth) {
        const consentStatus = await this.checkAuthenticationConsents(user.id);
        
        if (!consentStatus.hasRequiredConsents) {
          // Log consent requirement
          await this.gdprService.logGDPREvent(
            user.id,
            'AUTH_CONSENT_REQUIRED',
            {
              missingConsents: consentStatus.missingRequiredConsents,
              sessionId: session.id
            },
            ipAddress,
            userAgent
          );

          return {
            success: false,
            requiresConsent: true,
            consentStatus,
            user: {
              id: user.id,
              wallet_address: user.wallet_address,
              username: user.username
            },
            message: 'Additional consent required to complete authentication'
          };
        }
      }

      // Enhanced session with GDPR context
      const enhancedSession = await this.enhanceSessionWithGDPR(
        session,
        user,
        ipAddress,
        userAgent
      );

      // Log successful GDPR-compliant authentication
      await this.gdprService.logGDPREvent(
        user.id,
        'GDPR_COMPLIANT_AUTH_SUCCESS',
        {
          sessionId: session.id,
          hasRequiredConsents: true,
          walletAddress: `${walletAddress.substring(0, 8)}...${walletAddress.slice(-4)}`
        },
        ipAddress,
        userAgent
      );

      return {
        ...authResult,
        session: enhancedSession,
        gdprCompliant: true
      };
    } catch (error) {
      this.logger.error('Error in GDPR-enhanced signature verification:', error);
      throw error;
    }
  }

  /**
   * Enhanced session creation with GDPR tracking
   */
  async createSession(user, sessionData = {}) {
    try {
      // Create standard session
      const session = await super.createSession(user, sessionData);

      // Record session creation as a data processing activity
      await this.gdprService.logGDPREvent(
        user.id,
        'SESSION_CREATED',
        {
          sessionId: session.id,
          sessionDuration: process.env.SESSION_DURATION || '24h',
          dataProcessed: {
            authentication: true,
            sessionManagement: true,
            securityMonitoring: true
          }
        },
        sessionData.ipAddress,
        sessionData.userAgent
      );

      return session;
    } catch (error) {
      this.logger.error('Error creating GDPR-enhanced session:', error);
      throw error;
    }
  }

  /**
   * Check authentication-related consents
   */
  async checkAuthenticationConsents(userId) {
    try {
      const requiredPurposes = ['AUTHENTICATION', 'PROFILE_MANAGEMENT'];
      const consentChecks = await Promise.all(
        requiredPurposes.map(purpose => 
          this.gdprService.checkConsent(userId, purpose)
        )
      );

      const consentMap = {};
      const missingRequired = [];

      requiredPurposes.forEach((purpose, index) => {
        const consent = consentChecks[index];
        consentMap[purpose] = consent;
        
        if (!consent.hasValidConsent && consent.consentRequired) {
          missingRequired.push(purpose);
        }
      });

      return {
        hasRequiredConsents: missingRequired.length === 0,
        missingRequiredConsents: missingRequired,
        allConsents: consentMap
      };
    } catch (error) {
      this.logger.error('Error checking authentication consents:', error);
      return {
        hasRequiredConsents: false,
        missingRequiredConsents: ['AUTHENTICATION'],
        allConsents: {}
      };
    }
  }

  /**
   * Process consent data during authentication
   */
  async processAuthenticationConsent(userId, consentData, ipAddress, userAgent) {
    try {
      const { purposes = {}, cookies = {} } = consentData;

      // Record purpose consents
      for (const [purpose, granted] of Object.entries(purposes)) {
        await this.gdprService.recordConsent(
          userId,
          purpose,
          granted,
          {
            ipAddress,
            userAgent,
            source: 'authentication',
            timestamp: new Date().toISOString()
          }
        );
      }

      // Record cookie consents if provided
      if (Object.keys(cookies).length > 0) {
        await this.recordCookieConsent(userId, cookies, ipAddress, userAgent);
      }

      this.logger.info(`Processed authentication consent for user ${userId}`);
    } catch (error) {
      this.logger.error('Error processing authentication consent:', error);
      throw error;
    }
  }

  /**
   * Record cookie consent during authentication
   */
  async recordCookieConsent(userId, cookieConsents, ipAddress, userAgent) {
    try {
      const query = `
        INSERT INTO cookie_consents (
          user_id, cookie_categories, ip_address, user_agent, 
          expiry_date, consent_date
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          cookie_categories = $2,
          ip_address = $3,
          user_agent = $4,
          expiry_date = $5,
          consent_date = NOW()
        RETURNING *
      `;

      const expiryDate = new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)); // 1 year

      await this.gdprService.db.query(query, [
        userId,
        JSON.stringify(cookieConsents),
        ipAddress,
        userAgent,
        expiryDate
      ]);

      await this.gdprService.logGDPREvent(
        userId,
        'COOKIE_CONSENT_AUTH',
        {
          cookieConsents,
          source: 'authentication'
        },
        ipAddress,
        userAgent
      );
    } catch (error) {
      this.logger.error('Error recording cookie consent:', error);
      throw error;
    }
  }

  /**
   * Enhance session with GDPR context
   */
  async enhanceSessionWithGDPR(session, user, ipAddress, userAgent) {
    try {
      // Get user's current consents
      const consentStatus = await this.checkAuthenticationConsents(user.id);
      
      // Get privacy settings
      const privacySettings = await this.gdprService.getUserPrivacySettings(user.id);

      return {
        ...session,
        gdprContext: {
          consentStatus,
          privacySettings,
          dataProcessingNotice: {
            purposes: ['authentication', 'session_management', 'security'],
            legalBasis: 'contract',
            retention: '2 years after last login',
            rights: ['access', 'rectification', 'erasure', 'portability', 'object']
          },
          lastConsentUpdate: consentStatus.allConsents.AUTHENTICATION?.lastConsentDate || null
        }
      };
    } catch (error) {
      this.logger.error('Error enhancing session with GDPR context:', error);
      return session; // Return basic session if GDPR enhancement fails
    }
  }

  /**
   * Enhanced user creation with GDPR compliance
   */
  async getOrCreateUser(walletAddress, updateData = {}, consentData = null) {
    try {
      // Create/update user using parent method
      const user = await super.getOrCreateUser(walletAddress, updateData);

      // If this is a new user and consent data is provided
      if (consentData && user) {
        await this.processAuthenticationConsent(
          user.id,
          consentData,
          updateData.ipAddress,
          updateData.userAgent
        );

        // Record initial data processing activity
        await this.gdprService.logGDPREvent(
          user.id,
          'USER_ACCOUNT_CREATED',
          {
            walletAddress: `${walletAddress.substring(0, 8)}...${walletAddress.slice(-4)}`,
            initialConsents: consentData.purposes || {},
            dataCategories: ['IDENTITY', 'TECHNICAL', 'AUTHENTICATION']
          },
          updateData.ipAddress,
          updateData.userAgent
        );
      }

      return user;
    } catch (error) {
      this.logger.error('Error in GDPR-compliant user creation:', error);
      throw error;
    }
  }

  /**
   * Get user by wallet address with GDPR context
   */
  async getUserByWalletAddress(walletAddress) {
    try {
      const query = `
        SELECT u.*, up.display_name, up.bio, up.avatar_url
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.wallet_address = $1
      `;

      const result = await this.db.query(query, [walletAddress]);
      return result.rows[0] || null;
    } catch (error) {
      this.logger.error('Error getting user by wallet address:', error);
      return null;
    }
  }

  /**
   * Enhanced session revocation with GDPR logging
   */
  async revokeSession(sessionToken, reason = 'user_logout', userId = null) {
    try {
      await super.revokeSession(sessionToken, reason);

      if (userId) {
        await this.gdprService.logGDPREvent(
          userId,
          'SESSION_REVOKED',
          {
            reason,
            sessionToken: sessionToken.substring(0, 8) + '...',
            dataRetention: 'Session data will be purged according to retention policy'
          }
        );
      }
    } catch (error) {
      this.logger.error('Error revoking GDPR-enhanced session:', error);
      throw error;
    }
  }

  /**
   * Get authentication data for GDPR export
   */
  async getAuthDataForExport(userId) {
    try {
      const [sessions, authEvents, consents] = await Promise.all([
        this.db.query(
          'SELECT * FROM user_sessions WHERE user_id = $1 ORDER BY created_at DESC',
          [userId]
        ),
        this.db.query(
          'SELECT * FROM gdpr_audit_log WHERE user_id = $1 AND event_type LIKE \'AUTH_%\' ORDER BY timestamp DESC',
          [userId]
        ),
        this.gdprService.getUserConsentHistory(userId)
      ]);

      return {
        sessions: sessions.rows.map(session => ({
          id: session.id,
          created_at: session.created_at,
          expires_at: session.expires_at,
          ip_address: session.ip_address,
          user_agent: session.user_agent,
          is_active: session.is_active,
          revoked_at: session.revoked_at,
          revoke_reason: session.revoke_reason
        })),
        authenticationEvents: authEvents.rows,
        consents: consents
      };
    } catch (error) {
      this.logger.error('Error getting auth data for export:', error);
      return {
        sessions: [],
        authenticationEvents: [],
        consents: []
      };
    }
  }

  /**
   * Delete authentication data for user
   */
  async deleteAuthDataForUser(userId) {
    try {
      const deletionResults = {};

      // Delete sessions
      const sessionResult = await this.db.query(
        'DELETE FROM user_sessions WHERE user_id = $1',
        [userId]
      );
      deletionResults.sessions = sessionResult.rowCount;

      // Delete auth-related audit logs (keep GDPR audit logs for compliance)
      const auditResult = await this.db.query(
        'DELETE FROM gdpr_audit_log WHERE user_id = $1 AND event_type LIKE \'AUTH_%\'',
        [userId]
      );
      deletionResults.authAuditLogs = auditResult.rowCount;

      return deletionResults;
    } catch (error) {
      this.logger.error('Error deleting auth data for user:', error);
      throw error;
    }
  }

  /**
   * Shutdown enhanced auth service
   */
  async shutdown() {
    await super.shutdown();
    await this.gdprService.shutdown();
  }
}

export default GDPREnhancedAuthService;