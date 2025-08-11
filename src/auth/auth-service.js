/**
 * Authentication Service for MLG.clan Platform
 * 
 * Provides comprehensive authentication with Phantom wallet integration,
 * JWT token management, and challenge-response authentication.
 * 
 * Features:
 * - Solana wallet signature verification
 * - JWT token generation and validation
 * - Challenge-response authentication
 * - Multi-wallet support preparation
 * - Security event logging
 * - Rate limiting and brute force protection
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { Pool } from 'pg';
import Redis from 'redis';

/**
 * Authentication configuration
 */
const AUTH_CONFIG = {
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  JWT_ALGORITHM: 'HS256',
  ACCESS_TOKEN_EXPIRY: '15m', // 15 minutes
  REFRESH_TOKEN_EXPIRY: '7d', // 7 days
  
  // Challenge Configuration
  CHALLENGE_EXPIRY: 5 * 60 * 1000, // 5 minutes in milliseconds
  CHALLENGE_LENGTH: 32, // bytes
  NONCE_LENGTH: 16, // bytes
  
  // Rate Limiting
  MAX_ATTEMPTS_PER_IP: 5,
  MAX_ATTEMPTS_PER_WALLET: 3,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  
  // Session Configuration
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  ACTIVITY_TIMEOUT: 2 * 60 * 60 * 1000, // 2 hours
  
  // Signature Verification
  SIGNATURE_MESSAGE_PREFIX: 'MLG.clan Authentication - ',
  SUPPORTED_WALLETS: ['phantom', 'solflare', 'metamask'],
  
  // Security Settings
  REQUIRE_HTTPS: process.env.NODE_ENV === 'production',
  SECURE_COOKIES: process.env.NODE_ENV === 'production',
  SAME_SITE_POLICY: 'strict'
};

/**
 * Error types for authentication
 */
const AUTH_ERRORS = {
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  CHALLENGE_EXPIRED: 'CHALLENGE_EXPIRED',
  CHALLENGE_NOT_FOUND: 'CHALLENGE_NOT_FOUND',
  WALLET_NOT_SUPPORTED: 'WALLET_NOT_SUPPORTED',
  RATE_LIMITED: 'RATE_LIMITED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS'
};

/**
 * Main Authentication Service Class
 */
class AuthService {
  constructor(options = {}) {
    this.db = options.db || null;
    this.redis = options.redis || null;
    this.logger = options.logger || console;
    
    // Initialize rate limiting storage
    this.rateLimitStore = new Map();
    this.challengeStore = new Map();
    
    // Bind methods to preserve context
    this.generateChallenge = this.generateChallenge.bind(this);
    this.verifySignature = this.verifySignature.bind(this);
    this.createSession = this.createSession.bind(this);
    this.validateToken = this.validateToken.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
    this.revokeSession = this.revokeSession.bind(this);
    
    // Start cleanup intervals
    this.startCleanupTasks();
  }

  /**
   * Initialize database connection
   */
  async initializeDatabase() {
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
    
    try {
      await this.db.query('SELECT 1');
      this.logger.info('Database connection established');
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      throw new Error('Database connection failed');
    }
  }

  /**
   * Initialize Redis connection
   */
  async initializeRedis() {
    if (!this.redis) {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.redis = Redis.createClient({ url: redisUrl });
      
      this.redis.on('error', (err) => {
        this.logger.error('Redis connection error:', err);
      });
      
      await this.redis.connect();
      this.logger.info('Redis connection established');
    }
  }

  /**
   * Generate authentication challenge for wallet
   * @param {string} walletAddress - Solana wallet address
   * @param {string} walletType - Type of wallet (phantom, solflare, etc.)
   * @param {string} ipAddress - Client IP address
   * @returns {Object} Challenge object with nonce and expiry
   */
  async generateChallenge(walletAddress, walletType = 'phantom', ipAddress = null) {
    try {
      // Validate wallet address format
      if (!this.isValidSolanaAddress(walletAddress)) {
        throw new Error('Invalid wallet address format');
      }

      // Check rate limiting
      await this.checkRateLimit(walletAddress, ipAddress);

      // Generate challenge components
      const nonce = crypto.randomBytes(AUTH_CONFIG.NONCE_LENGTH).toString('hex');
      const challenge = crypto.randomBytes(AUTH_CONFIG.CHALLENGE_LENGTH).toString('hex');
      const timestamp = Date.now();
      const expiresAt = timestamp + AUTH_CONFIG.CHALLENGE_EXPIRY;

      // Create challenge message
      const message = `${AUTH_CONFIG.SIGNATURE_MESSAGE_PREFIX}${nonce}\nWallet: ${walletAddress}\nChallenge: ${challenge}\nTimestamp: ${timestamp}`;

      // Store challenge
      const challengeKey = `challenge:${walletAddress}:${nonce}`;
      const challengeData = {
        walletAddress,
        walletType,
        nonce,
        challenge,
        message,
        timestamp,
        expiresAt,
        ipAddress,
        attempts: 0
      };

      // Store in Redis if available, otherwise use memory
      if (this.redis) {
        await this.redis.setEx(
          challengeKey, 
          Math.ceil(AUTH_CONFIG.CHALLENGE_EXPIRY / 1000), 
          JSON.stringify(challengeData)
        );
      } else {
        this.challengeStore.set(challengeKey, challengeData);
      }

      // Log challenge generation
      this.logSecurityEvent('CHALLENGE_GENERATED', {
        walletAddress,
        walletType,
        nonce,
        ipAddress,
        timestamp
      });

      return {
        nonce,
        message,
        expiresAt,
        walletType
      };
    } catch (error) {
      this.logger.error('Error generating challenge:', error);
      throw new Error(error.message || 'Failed to generate authentication challenge');
    }
  }

  /**
   * Verify wallet signature and create authenticated session
   * @param {string} walletAddress - Solana wallet address
   * @param {string} signature - Signed message signature
   * @param {string} nonce - Challenge nonce
   * @param {string} ipAddress - Client IP address
   * @param {string} userAgent - User agent string
   * @returns {Object} Authentication result with tokens and user data
   */
  async verifySignature(walletAddress, signature, nonce, ipAddress = null, userAgent = null) {
    try {
      // Retrieve and validate challenge
      const challengeKey = `challenge:${walletAddress}:${nonce}`;
      let challengeData;

      if (this.redis) {
        const stored = await this.redis.get(challengeKey);
        challengeData = stored ? JSON.parse(stored) : null;
      } else {
        challengeData = this.challengeStore.get(challengeKey);
      }

      if (!challengeData) {
        throw new Error(AUTH_ERRORS.CHALLENGE_NOT_FOUND);
      }

      if (Date.now() > challengeData.expiresAt) {
        throw new Error(AUTH_ERRORS.CHALLENGE_EXPIRED);
      }

      // Verify signature
      const isValid = await this.validateSolanaSignature(
        challengeData.message,
        signature,
        walletAddress
      );

      if (!isValid) {
        // Increment failed attempts
        challengeData.attempts += 1;
        if (this.redis) {
          await this.redis.setEx(
            challengeKey, 
            Math.ceil((challengeData.expiresAt - Date.now()) / 1000), 
            JSON.stringify(challengeData)
          );
        }

        this.logSecurityEvent('AUTHENTICATION_FAILED', {
          walletAddress,
          nonce,
          ipAddress,
          reason: 'Invalid signature'
        });

        throw new Error(AUTH_ERRORS.INVALID_SIGNATURE);
      }

      // Clean up challenge
      if (this.redis) {
        await this.redis.del(challengeKey);
      } else {
        this.challengeStore.delete(challengeKey);
      }

      // Get or create user
      const user = await this.getOrCreateUser(walletAddress, {
        verificationSignature: signature,
        verificationMessage: challengeData.message,
        verificationTimestamp: new Date(),
        lastLogin: new Date()
      });

      // Create session
      const session = await this.createSession(user, {
        ipAddress,
        userAgent,
        walletSignature: signature,
        messagesSigned: challengeData.message
      });

      // Log successful authentication
      this.logSecurityEvent('AUTHENTICATION_SUCCESS', {
        userId: user.id,
        walletAddress,
        nonce,
        ipAddress,
        sessionId: session.id
      });

      return {
        success: true,
        user,
        session,
        tokens: {
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          expiresAt: session.expiresAt
        }
      };
    } catch (error) {
      this.logger.error('Error verifying signature:', error);
      throw new Error(error.message || 'Authentication verification failed');
    }
  }

  /**
   * Validate Solana wallet signature
   * @param {string} message - Original message that was signed
   * @param {string} signature - Base58 encoded signature
   * @param {string} walletAddress - Solana wallet address
   * @returns {boolean} True if signature is valid
   */
  async validateSolanaSignature(message, signature, walletAddress) {
    try {
      // Decode signature and public key
      const signatureBytes = bs58.decode(signature);
      const publicKey = new PublicKey(walletAddress);
      const messageBytes = new TextEncoder().encode(message);

      // Verify signature using nacl
      const isValid = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKey.toBytes()
      );

      return isValid;
    } catch (error) {
      this.logger.warn('Signature validation error:', error);
      return false;
    }
  }

  /**
   * Create authenticated session
   * @param {Object} user - User object
   * @param {Object} sessionData - Additional session data
   * @returns {Object} Session object with tokens
   */
  async createSession(user, sessionData = {}) {
    try {
      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);
      const sessionToken = crypto.randomBytes(32).toString('hex');

      const expiresAt = new Date(Date.now() + AUTH_CONFIG.SESSION_DURATION);
      const sessionId = crypto.randomUUID();

      // Store session in database
      const sessionRecord = await this.db.query(`
        INSERT INTO user_sessions (
          id, user_id, session_token, wallet_signature, message_signed,
          ip_address, user_agent, device_fingerprint, expires_at, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        sessionId,
        user.id,
        sessionToken,
        sessionData.walletSignature,
        sessionData.messagesSigned,
        sessionData.ipAddress,
        sessionData.userAgent,
        this.generateDeviceFingerprint(sessionData),
        expiresAt,
        true
      ]);

      // Store session in Redis for fast access
      if (this.redis) {
        const redisSessionData = {
          userId: user.id,
          walletAddress: user.wallet_address,
          roles: user.roles || [],
          permissions: user.permissions || [],
          sessionId,
          createdAt: Date.now()
        };

        await this.redis.setEx(
          `session:${sessionToken}`,
          Math.ceil(AUTH_CONFIG.SESSION_DURATION / 1000),
          JSON.stringify(redisSessionData)
        );
      }

      return {
        id: sessionId,
        sessionToken,
        accessToken,
        refreshToken,
        expiresAt,
        user
      };
    } catch (error) {
      this.logger.error('Error creating session:', error);
      throw new Error('Failed to create user session');
    }
  }

  /**
   * Generate JWT access token
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  generateAccessToken(user) {
    const payload = {
      sub: user.id,
      wallet: user.wallet_address,
      roles: user.roles || [],
      permissions: user.permissions || [],
      type: 'access',
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, AUTH_CONFIG.JWT_SECRET, {
      algorithm: AUTH_CONFIG.JWT_ALGORITHM,
      expiresIn: AUTH_CONFIG.ACCESS_TOKEN_EXPIRY
    });
  }

  /**
   * Generate JWT refresh token
   * @param {Object} user - User object
   * @returns {string} JWT refresh token
   */
  generateRefreshToken(user) {
    const payload = {
      sub: user.id,
      wallet: user.wallet_address,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, AUTH_CONFIG.JWT_SECRET, {
      algorithm: AUTH_CONFIG.JWT_ALGORITHM,
      expiresIn: AUTH_CONFIG.REFRESH_TOKEN_EXPIRY
    });
  }

  /**
   * Validate JWT token
   * @param {string} token - JWT token to validate
   * @param {string} type - Token type (access or refresh)
   * @returns {Object} Decoded token payload
   */
  async validateToken(token, type = 'access') {
    try {
      const decoded = jwt.verify(token, AUTH_CONFIG.JWT_SECRET, {
        algorithms: [AUTH_CONFIG.JWT_ALGORITHM]
      });

      if (decoded.type !== type) {
        throw new Error('Invalid token type');
      }

      // Check if session is still valid
      if (type === 'access' && this.redis) {
        const sessionExists = await this.redis.exists(`session:${decoded.jti || 'unknown'}`);
        if (!sessionExists) {
          throw new Error('Session not found or expired');
        }
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error(AUTH_ERRORS.TOKEN_EXPIRED);
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error(AUTH_ERRORS.TOKEN_INVALID);
      }
      throw error;
    }
  }

  /**
   * Refresh authentication tokens
   * @param {string} refreshToken - Valid refresh token
   * @returns {Object} New tokens
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = await this.validateToken(refreshToken, 'refresh');
      
      // Get current user data
      const user = await this.getUserById(decoded.sub);
      if (!user) {
        throw new Error(AUTH_ERRORS.USER_NOT_FOUND);
      }

      // Generate new access token
      const newAccessToken = this.generateAccessToken(user);
      
      return {
        accessToken: newAccessToken,
        refreshToken, // Refresh token remains the same
        expiresAt: new Date(Date.now() + (15 * 60 * 1000)) // 15 minutes
      };
    } catch (error) {
      this.logger.error('Error refreshing token:', error);
      throw error;
    }
  }

  /**
   * Revoke user session
   * @param {string} sessionToken - Session token to revoke
   * @param {string} reason - Reason for revocation
   */
  async revokeSession(sessionToken, reason = 'user_logout') {
    try {
      // Update database
      await this.db.query(`
        UPDATE user_sessions 
        SET is_active = FALSE, revoked_at = NOW(), revoke_reason = $1
        WHERE session_token = $2 AND is_active = TRUE
      `, [reason, sessionToken]);

      // Remove from Redis
      if (this.redis) {
        await this.redis.del(`session:${sessionToken}`);
      }

      this.logSecurityEvent('SESSION_REVOKED', {
        sessionToken: sessionToken.substring(0, 8) + '...',
        reason
      });
    } catch (error) {
      this.logger.error('Error revoking session:', error);
      throw new Error('Failed to revoke session');
    }
  }

  /**
   * Get or create user by wallet address
   * @param {string} walletAddress - Solana wallet address
   * @param {Object} updateData - Additional user data to update
   * @returns {Object} User object
   */
  async getOrCreateUser(walletAddress, updateData = {}) {
    try {
      let user;

      // Try to find existing user
      const existingUser = await this.db.query(`
        SELECT u.*, up.display_name, up.bio, up.avatar_url
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.wallet_address = $1
      `, [walletAddress]);

      if (existingUser.rows.length > 0) {
        user = existingUser.rows[0];
        
        // Update user data if provided
        if (Object.keys(updateData).length > 0) {
          const updateFields = [];
          const updateValues = [];
          let paramIndex = 2;

          for (const [key, value] of Object.entries(updateData)) {
            updateFields.push(`${key} = $${paramIndex}`);
            updateValues.push(value);
            paramIndex++;
          }

          await this.db.query(`
            UPDATE users 
            SET ${updateFields.join(', ')}
            WHERE wallet_address = $1
          `, [walletAddress, ...updateValues]);
        }
      } else {
        // Create new user
        const newUser = await this.db.query(`
          INSERT INTO users (
            wallet_address, wallet_verified, verification_signature, 
            verification_message, verification_timestamp, last_login, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [
          walletAddress,
          true,
          updateData.verificationSignature,
          updateData.verificationMessage,
          updateData.verificationTimestamp,
          updateData.lastLogin,
          'active'
        ]);

        user = newUser.rows[0];

        // Create user profile
        await this.db.query(`
          INSERT INTO user_profiles (user_id) VALUES ($1)
        `, [user.id]);
      }

      return user;
    } catch (error) {
      this.logger.error('Error getting/creating user:', error);
      throw new Error('User management error');
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User UUID
   * @returns {Object} User object
   */
  async getUserById(userId) {
    try {
      const result = await this.db.query(`
        SELECT u.*, up.display_name, up.bio, up.avatar_url
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id = $1 AND u.status = 'active'
      `, [userId]);

      return result.rows[0] || null;
    } catch (error) {
      this.logger.error('Error getting user by ID:', error);
      return null;
    }
  }

  /**
   * Check rate limiting for authentication attempts
   * @param {string} walletAddress - Wallet address
   * @param {string} ipAddress - IP address
   */
  async checkRateLimit(walletAddress, ipAddress) {
    const now = Date.now();
    
    // Check wallet-based rate limit
    const walletKey = `rate_limit:wallet:${walletAddress}`;
    const walletAttempts = await this.getRateLimitAttempts(walletKey);
    
    if (walletAttempts >= AUTH_CONFIG.MAX_ATTEMPTS_PER_WALLET) {
      throw new Error(AUTH_ERRORS.RATE_LIMITED);
    }

    // Check IP-based rate limit if IP is provided
    if (ipAddress) {
      const ipKey = `rate_limit:ip:${ipAddress}`;
      const ipAttempts = await this.getRateLimitAttempts(ipKey);
      
      if (ipAttempts >= AUTH_CONFIG.MAX_ATTEMPTS_PER_IP) {
        throw new Error(AUTH_ERRORS.RATE_LIMITED);
      }
    }

    // Increment attempt counters
    await this.incrementRateLimitAttempts(walletKey);
    if (ipAddress) {
      await this.incrementRateLimitAttempts(`rate_limit:ip:${ipAddress}`);
    }
  }

  /**
   * Get rate limit attempts for a key
   * @param {string} key - Rate limit key
   * @returns {number} Number of attempts
   */
  async getRateLimitAttempts(key) {
    if (this.redis) {
      const attempts = await this.redis.get(key);
      return parseInt(attempts) || 0;
    } else {
      const entry = this.rateLimitStore.get(key);
      if (!entry || Date.now() > entry.expiresAt) {
        return 0;
      }
      return entry.attempts;
    }
  }

  /**
   * Increment rate limit attempts
   * @param {string} key - Rate limit key
   */
  async incrementRateLimitAttempts(key) {
    const ttl = Math.ceil(AUTH_CONFIG.LOCKOUT_DURATION / 1000);
    
    if (this.redis) {
      await this.redis.multi()
        .incr(key)
        .expire(key, ttl)
        .exec();
    } else {
      const entry = this.rateLimitStore.get(key) || { attempts: 0 };
      entry.attempts += 1;
      entry.expiresAt = Date.now() + AUTH_CONFIG.LOCKOUT_DURATION;
      this.rateLimitStore.set(key, entry);
    }
  }

  /**
   * Validate Solana address format
   * @param {string} address - Address to validate
   * @returns {boolean} True if valid
   */
  isValidSolanaAddress(address) {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate device fingerprint
   * @param {Object} sessionData - Session data
   * @returns {string} Device fingerprint
   */
  generateDeviceFingerprint(sessionData) {
    const components = [
      sessionData.userAgent || '',
      sessionData.ipAddress || '',
      Date.now().toString()
    ].join('|');
    
    return crypto.createHash('sha256').update(components).digest('hex');
  }

  /**
   * Log security events
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  logSecurityEvent(event, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      data: {
        ...data,
        // Sanitize sensitive data
        walletAddress: data.walletAddress ? 
          `${data.walletAddress.substring(0, 8)}...${data.walletAddress.substring(-4)}` : 
          undefined
      }
    };

    this.logger.info('Security Event:', logEntry);
    
    // Store in database if needed
    // Implementation depends on requirements
  }

  /**
   * Start cleanup tasks
   */
  startCleanupTasks() {
    // Clean up expired challenges every 5 minutes
    setInterval(() => {
      this.cleanupExpiredChallenges();
    }, 5 * 60 * 1000);

    // Clean up rate limit entries every hour
    setInterval(() => {
      this.cleanupRateLimitEntries();
    }, 60 * 60 * 1000);
  }

  /**
   * Clean up expired challenges
   */
  cleanupExpiredChallenges() {
    const now = Date.now();
    for (const [key, challenge] of this.challengeStore.entries()) {
      if (now > challenge.expiresAt) {
        this.challengeStore.delete(key);
      }
    }
  }

  /**
   * Clean up expired rate limit entries
   */
  cleanupRateLimitEntries() {
    const now = Date.now();
    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (now > entry.expiresAt) {
        this.rateLimitStore.delete(key);
      }
    }
  }

  /**
   * Shutdown cleanup
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

// Export the service and constants
export { AuthService, AUTH_CONFIG, AUTH_ERRORS };
export default AuthService;