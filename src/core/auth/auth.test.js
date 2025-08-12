/**
 * Comprehensive Test Suite for MLG.clan Authentication System
 * 
 * Tests all authentication components including:
 * - AuthService (wallet authentication, JWT tokens)
 * - SessionManager (Redis sessions, activity tracking)
 * - AuthMiddleware (Express middleware, RBAC)
 * - RBACService (roles, permissions, context-aware access)
 * - MFAService (TOTP, backup codes, device trust)
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 */

import { jest } from '@jest/globals';
import { AuthService } from './auth-service.js';
import { SessionManager } from './session-manager.js';
import { AuthMiddleware } from './middleware/auth-middleware.js';
import { RBACService } from './rbac.js';
import { MFAService } from './mfa.js';

// Mock dependencies
const mockDb = {
  query: jest.fn(),
  end: jest.fn()
};

const mockRedis = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  keys: jest.fn(),
  sAdd: jest.fn(),
  sMembers: jest.fn(),
  sRem: jest.fn(),
  multi: jest.fn(() => ({
    incr: jest.fn(() => ({ exec: jest.fn() })),
    expire: jest.fn(() => ({ exec: jest.fn() })),
    exec: jest.fn()
  }))
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

describe('Authentication System Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AuthService', () => {
    let authService;

    beforeEach(() => {
      authService = new AuthService({
        db: mockDb,
        redis: mockRedis,
        logger: mockLogger
      });
    });

    describe('Challenge Generation', () => {
      test('should generate valid authentication challenge', async () => {
        const walletAddress = '4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM';
        
        const challenge = await authService.generateChallenge(walletAddress);
        
        expect(challenge).toHaveProperty('nonce');
        expect(challenge).toHaveProperty('message');
        expect(challenge).toHaveProperty('expiresAt');
        expect(challenge).toHaveProperty('walletType', 'phantom');
        expect(challenge.message).toContain(walletAddress);
        expect(challenge.expiresAt).toBeGreaterThan(Date.now());
      });

      test('should reject invalid wallet address', async () => {
        const invalidAddress = 'invalid-wallet-address';
        
        await expect(authService.generateChallenge(invalidAddress))
          .rejects.toThrow('Invalid wallet address format');
      });

      test('should enforce rate limiting', async () => {
        const walletAddress = '4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM';
        
        // Mock rate limit check to return exceeded limit
        mockRedis.get.mockResolvedValue('5'); // MAX_ATTEMPTS_PER_WALLET exceeded
        
        await expect(authService.generateChallenge(walletAddress))
          .rejects.toThrow();
      });
    });

    describe('Signature Verification', () => {
      test('should verify valid Solana signature', async () => {
        const walletAddress = '4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM';
        const message = 'MLG.clan Authentication - test123\nWallet: ' + walletAddress;
        const signature = 'mockSignature123';
        const nonce = 'test123';
        
        // Mock challenge data
        mockRedis.get.mockResolvedValue(JSON.stringify({
          walletAddress,
          message,
          nonce,
          expiresAt: Date.now() + 300000,
          attempts: 0
        }));
        
        // Mock user creation
        mockDb.query.mockResolvedValueOnce({ rows: [] }) // No existing user
          .mockResolvedValueOnce({ rows: [{ id: 'user-123', wallet_address: walletAddress }] }) // New user
          .mockResolvedValueOnce({ rows: [] }) // Create profile
          .mockResolvedValueOnce({ rows: [{ id: 'session-123', session_token: 'token-123' }] }); // Session
        
        // Mock signature validation (would normally use Solana cryptography)
        const originalMethod = authService.validateSolanaSignature;
        authService.validateSolanaSignature = jest.fn().mockResolvedValue(true);
        
        const result = await authService.verifySignature(walletAddress, signature, nonce);
        
        expect(result.success).toBe(true);
        expect(result.user).toBeDefined();
        expect(result.session).toBeDefined();
        expect(result.tokens).toBeDefined();
        
        // Restore original method
        authService.validateSolanaSignature = originalMethod;
      });

      test('should reject invalid signature', async () => {
        const walletAddress = '4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM';
        const signature = 'invalidSignature';
        const nonce = 'test123';
        
        // Mock challenge data
        mockRedis.get.mockResolvedValue(JSON.stringify({
          walletAddress,
          message: 'test message',
          nonce,
          expiresAt: Date.now() + 300000,
          attempts: 0
        }));
        
        // Mock invalid signature
        authService.validateSolanaSignature = jest.fn().mockResolvedValue(false);
        
        await expect(authService.verifySignature(walletAddress, signature, nonce))
          .rejects.toThrow();
      });

      test('should reject expired challenge', async () => {
        const walletAddress = '4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM';
        const signature = 'validSignature';
        const nonce = 'test123';
        
        // Mock expired challenge
        mockRedis.get.mockResolvedValue(JSON.stringify({
          walletAddress,
          message: 'test message',
          nonce,
          expiresAt: Date.now() - 1000, // Expired
          attempts: 0
        }));
        
        await expect(authService.verifySignature(walletAddress, signature, nonce))
          .rejects.toThrow('CHALLENGE_EXPIRED');
      });
    });

    describe('JWT Token Management', () => {
      test('should generate valid access token', () => {
        const user = {
          id: 'user-123',
          wallet_address: '4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM',
          roles: ['member'],
          permissions: ['content:view']
        };
        
        const token = authService.generateAccessToken(user);
        
        expect(typeof token).toBe('string');
        expect(token.split('.')).toHaveLength(3); // JWT format
      });

      test('should validate access token', async () => {
        const user = {
          id: 'user-123',
          wallet_address: '4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM',
          roles: ['member'],
          permissions: ['content:view']
        };
        
        const token = authService.generateAccessToken(user);
        const decoded = await authService.validateToken(token, 'access');
        
        expect(decoded.sub).toBe(user.id);
        expect(decoded.wallet).toBe(user.wallet_address);
        expect(decoded.type).toBe('access');
      });

      test('should refresh tokens', async () => {
        const user = {
          id: 'user-123',
          wallet_address: '4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM'
        };
        
        // Mock user retrieval
        mockDb.query.mockResolvedValueOnce({
          rows: [user]
        });
        
        const refreshToken = authService.generateRefreshToken(user);
        const result = await authService.refreshToken(refreshToken);
        
        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBe(refreshToken);
        expect(result.expiresAt).toBeInstanceOf(Date);
      });
    });
  });

  describe('SessionManager', () => {
    let sessionManager;

    beforeEach(() => {
      sessionManager = new SessionManager({
        redis: mockRedis,
        logger: mockLogger
      });
    });

    describe('Session Creation', () => {
      test('should create new session', async () => {
        const sessionData = {
          userId: 'user-123',
          walletAddress: '4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM',
          roles: ['member'],
          permissions: ['content:view'],
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          walletSignature: 'signature123'
        };
        
        mockRedis.setEx.mockResolvedValue('OK');
        mockRedis.sAdd.mockResolvedValue(1);
        mockRedis.expire.mockResolvedValue(1);
        mockRedis.sMembers.mockResolvedValue([]);
        
        const session = await sessionManager.createSession(sessionData);
        
        expect(session.id).toBeDefined();
        expect(session.userId).toBe(sessionData.userId);
        expect(session.walletAddress).toBe(sessionData.walletAddress);
        expect(session.state).toBe('active');
        expect(session.isActive).toBe(true);
      });

      test('should enforce session limits', async () => {
        const sessionData = {
          userId: 'user-123',
          walletAddress: '4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM'
        };
        
        // Mock existing sessions exceeding limit
        mockRedis.sMembers.mockResolvedValue([
          'session-1', 'session-2', 'session-3', 'session-4', 'session-5', 'session-6'
        ]);
        
        // Mock session retrieval for cleanup
        mockRedis.get.mockResolvedValue(JSON.stringify({
          encrypted: 'mockEncrypted',
          iv: 'mockIv',
          tag: 'mockTag'
        }));
        
        await sessionManager.createSession(sessionData);
        
        // Should attempt to remove excess sessions
        expect(mockRedis.del).toHaveBeenCalled();
      });
    });

    describe('Session Management', () => {
      test('should retrieve existing session', async () => {
        const sessionId = 'session-123';
        const mockSession = {
          id: sessionId,
          userId: 'user-123',
          state: 'active',
          expiresAt: Date.now() + 86400000 // 24 hours from now
        };
        
        // Mock encrypted session data
        mockRedis.get.mockResolvedValue(JSON.stringify({
          plaintext: mockSession // Using fallback for testing
        }));
        
        const session = await sessionManager.getSession(sessionId);
        
        expect(session).toBeDefined();
        expect(session.id).toBe(sessionId);
      });

      test('should return null for expired session', async () => {
        const sessionId = 'session-123';
        const mockSession = {
          id: sessionId,
          userId: 'user-123',
          state: 'active',
          expiresAt: Date.now() - 1000 // Expired
        };
        
        mockRedis.get.mockResolvedValue(JSON.stringify({
          plaintext: mockSession
        }));
        
        const session = await sessionManager.getSession(sessionId);
        
        expect(session).toBeNull();
      });

      test('should update session activity', async () => {
        const sessionId = 'session-123';
        const mockSession = {
          id: sessionId,
          userId: 'user-123',
          state: 'active',
          lastActivity: Date.now() - 30000,
          expiresAt: Date.now() + 86400000
        };
        
        mockRedis.get.mockResolvedValue(JSON.stringify({
          plaintext: mockSession
        }));
        mockRedis.setEx.mockResolvedValue('OK');
        
        const result = await sessionManager.updateActivity(sessionId, {
          lastPath: '/api/content'
        });
        
        expect(result).toBe(true);
        expect(mockRedis.setEx).toHaveBeenCalled();
      });

      test('should revoke session', async () => {
        const sessionId = 'session-123';
        const mockSession = {
          id: sessionId,
          userId: 'user-123',
          state: 'active'
        };
        
        mockRedis.get.mockResolvedValue(JSON.stringify({
          plaintext: mockSession
        }));
        mockRedis.del.mockResolvedValue(1);
        mockRedis.sRem.mockResolvedValue(1);
        
        const result = await sessionManager.revokeSession(sessionId, 'user_logout');
        
        expect(result).toBe(true);
        expect(mockRedis.del).toHaveBeenCalled();
      });
    });
  });

  describe('AuthMiddleware', () => {
    let authMiddleware;
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
      authMiddleware = new AuthMiddleware({
        authService: new AuthService({ db: mockDb, redis: mockRedis, logger: mockLogger }),
        sessionManager: new SessionManager({ redis: mockRedis, logger: mockLogger }),
        logger: mockLogger
      });

      mockReq = {
        headers: {
          'authorization': 'Bearer valid-token-123',
          'user-agent': 'Mozilla/5.0...',
          'x-session-token': 'session-123'
        },
        ip: '192.168.1.1',
        path: '/api/content',
        method: 'GET',
        get: jest.fn((header) => mockReq.headers[header.toLowerCase()])
      };

      mockRes = {
        status: jest.fn(() => mockRes),
        json: jest.fn(),
        set: jest.fn()
      };

      mockNext = jest.fn();
    });

    describe('Authentication Middleware', () => {
      test('should authenticate valid token', async () => {
        const mockUser = {
          id: 'user-123',
          wallet_address: '4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM',
          status: 'active'
        };

        const mockSession = {
          id: 'session-123',
          userId: 'user-123',
          isActive: true
        };

        // Mock auth service methods
        authMiddleware.authService.validateToken = jest.fn().mockResolvedValue({
          sub: 'user-123',
          wallet: mockUser.wallet_address,
          roles: ['member'],
          permissions: ['content:view']
        });

        authMiddleware.authService.getUserById = jest.fn().mockResolvedValue(mockUser);
        authMiddleware.sessionManager.getSession = jest.fn().mockResolvedValue(mockSession);

        const middleware = authMiddleware.authenticate();
        await middleware(mockReq, mockRes, mockNext);

        expect(mockReq.user).toEqual(mockUser);
        expect(mockReq.session).toEqual(mockSession);
        expect(mockReq.isAuthenticated).toBe(true);
        expect(mockNext).toHaveBeenCalled();
      });

      test('should reject missing token when required', async () => {
        delete mockReq.headers.authorization;

        const middleware = authMiddleware.requireAuth();
        await middleware(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              code: 'NO_TOKEN_PROVIDED'
            })
          })
        );
        expect(mockNext).not.toHaveBeenCalled();
      });

      test('should allow optional authentication', async () => {
        delete mockReq.headers.authorization;

        const middleware = authMiddleware.authenticate({ required: false });
        await middleware(mockReq, mockRes, mockNext);

        expect(mockReq.user).toBeNull();
        expect(mockReq.isAuthenticated).toBe(false);
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('Rate Limiting', () => {
      test('should enforce rate limits', async () => {
        // Simulate rate limit exceeded
        authMiddleware.rateLimitStore.set('ip:192.168.1.1', {
          requests: new Array(101).fill(Date.now()),
          windowStart: Date.now() - 30000
        });

        const middleware = authMiddleware.rateLimit({ limit: 100 });
        await middleware(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(429);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              code: 'RATE_LIMITED'
            })
          })
        );
      });

      test('should allow requests within rate limit', async () => {
        const middleware = authMiddleware.rateLimit({ limit: 100 });
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.set).toHaveBeenCalledWith(
          expect.objectContaining({
            'X-RateLimit-Limit': '100'
          })
        );
      });
    });

    describe('Security Checks', () => {
      test('should pass valid security check', async () => {
        const middleware = authMiddleware.securityCheck();
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });

      test('should reject blocked user agents', async () => {
        mockReq.headers['user-agent'] = 'googlebot/2.1';

        const middleware = authMiddleware.securityCheck();
        await middleware(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });
  });

  describe('RBACService', () => {
    let rbacService;

    beforeEach(() => {
      rbacService = new RBACService({
        db: mockDb,
        redis: mockRedis,
        logger: mockLogger
      });
    });

    describe('Permission Checking', () => {
      test('should check user permissions correctly', async () => {
        const userId = 'user-123';
        const permissions = ['content:view', 'clan:join'];

        // Mock user roles
        mockDb.query.mockResolvedValueOnce({
          rows: [{
            role_slug: 'member',
            permissions: ['content:view:all', 'clan:join', 'clan:leave:own']
          }]
        });

        // Mock role permissions
        mockDb.query.mockResolvedValueOnce({
          rows: [{
            permissions: ['content:view:all', 'clan:join', 'clan:leave:own'],
            inherits_from: null
          }]
        });

        const hasPermission = await rbacService.checkPermissions(userId, permissions);

        expect(hasPermission).toBe(true);
      });

      test('should deny insufficient permissions', async () => {
        const userId = 'user-123';
        const permissions = ['admin:delete:users'];

        // Mock user roles (basic member)
        mockDb.query.mockResolvedValueOnce({
          rows: [{
            role_slug: 'member',
            permissions: ['content:view', 'clan:join']
          }]
        });

        mockDb.query.mockResolvedValueOnce({
          rows: [{
            permissions: ['content:view', 'clan:join'],
            inherits_from: null
          }]
        });

        const hasPermission = await rbacService.checkPermissions(userId, permissions);

        expect(hasPermission).toBe(false);
      });

      test('should handle role inheritance', async () => {
        const userId = 'user-123';
        const permissions = ['content:moderate'];

        // Mock moderator role with inheritance
        mockDb.query.mockResolvedValueOnce({
          rows: [{
            role_slug: 'moderator',
            permissions: ['*member', 'content:moderate']
          }]
        });

        // Mock moderator permissions
        mockDb.query.mockResolvedValueOnce({
          rows: [{
            permissions: ['*member', 'content:moderate'],
            inherits_from: 'member'
          }]
        });

        // Mock inherited member permissions
        mockDb.query.mockResolvedValueOnce({
          rows: [{
            permissions: ['content:view', 'clan:join'],
            inherits_from: null
          }]
        });

        const hasPermission = await rbacService.checkPermissions(userId, permissions);

        expect(hasPermission).toBe(true);
      });
    });

    describe('Role Management', () => {
      test('should assign role to user', async () => {
        const userId = 'user-123';
        const roleSlug = 'moderator';

        // Mock role existence check
        mockDb.query.mockResolvedValueOnce({
          rows: [{ id: 'role-123' }]
        });

        // Mock role assignment
        mockDb.query.mockResolvedValueOnce({
          rows: []
        });

        const result = await rbacService.assignRole(userId, roleSlug);

        expect(result).toBe(true);
        expect(mockDb.query).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO user_roles'),
          expect.arrayContaining([userId, roleSlug])
        );
      });

      test('should revoke role from user', async () => {
        const userId = 'user-123';
        const roleSlug = 'moderator';

        mockDb.query.mockResolvedValueOnce({ rows: [] });

        const result = await rbacService.revokeRole(userId, roleSlug);

        expect(result).toBe(true);
        expect(mockDb.query).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE user_roles'),
          expect.arrayContaining([userId, roleSlug])
        );
      });
    });
  });

  describe('MFAService', () => {
    let mfaService;

    beforeEach(() => {
      mfaService = new MFAService({
        db: mockDb,
        redis: mockRedis,
        logger: mockLogger
      });
    });

    describe('TOTP Setup', () => {
      test('should setup TOTP for user', async () => {
        const userId = 'user-123';
        const mockUser = {
          id: userId,
          username: 'testuser',
          wallet_address: '4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM'
        };

        // Mock user retrieval
        mockDb.query.mockResolvedValueOnce({
          rows: [mockUser]
        });

        // Mock TOTP secret storage
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        const setup = await mfaService.setupTOTP(userId);

        expect(setup.secret).toBeDefined();
        expect(setup.qrCode).toBeDefined();
        expect(setup.qrCode).toContain('data:image/png;base64');
        expect(setup.manualEntryKey).toBeDefined();
      });

      test('should verify TOTP setup', async () => {
        const userId = 'user-123';
        const token = '123456';

        // Mock MFA data
        mockDb.query.mockResolvedValueOnce({
          rows: [{
            totp_secret: 'TESTSECRET123',
            is_enabled: false
          }]
        });

        // Mock TOTP verification
        mfaService.verifyTOTP = jest.fn().mockResolvedValue(true);

        // Mock MFA enablement
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        const result = await mfaService.verifyTOTPSetup(userId, token);

        expect(result.success).toBe(true);
        expect(result.backupCodes).toBeDefined();
        expect(Array.isArray(result.backupCodes)).toBe(true);
        expect(result.backupCodes).toHaveLength(10);
      });
    });

    describe('MFA Verification', () => {
      test('should verify valid TOTP token', async () => {
        const userId = 'user-123';
        const token = '123456';

        // Mock user not locked
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        // Mock MFA data
        mockDb.query.mockResolvedValueOnce({
          rows: [{
            totp_secret: 'TESTSECRET123',
            is_enabled: true,
            backup_codes: ['CODE1', 'CODE2'],
            backup_codes_used: []
          }]
        });

        // Mock TOTP verification
        mfaService.verifyTOTP = jest.fn().mockResolvedValue(true);

        // Mock reset failed attempts
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        const verified = await mfaService.verifyMFAToken(userId, token, 'totp');

        expect(verified).toBe(true);
      });

      test('should verify backup code', async () => {
        const userId = 'user-123';
        const backupCode = 'BACKUP123';

        // Mock user not locked
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        // Mock MFA data
        mockDb.query.mockResolvedValueOnce({
          rows: [{
            totp_secret: 'TESTSECRET123',
            is_enabled: true,
            backup_codes: ['BACKUP123', 'BACKUP456'],
            backup_codes_used: []
          }]
        });

        // Mock reset failed attempts and mark backup code used
        mockDb.query.mockResolvedValueOnce({ rows: [] }); // Reset attempts
        mockDb.query.mockResolvedValueOnce({ rows: [] }); // Mark code used
        mockDb.query.mockResolvedValueOnce({ // Get updated MFA data
          rows: [{
            backup_codes: ['BACKUP123', 'BACKUP456'],
            backup_codes_used: ['BACKUP123']
          }]
        });

        const verified = await mfaService.verifyMFAToken(userId, backupCode, 'backup_code');

        expect(verified).toBe(true);
      });

      test('should reject invalid MFA token', async () => {
        const userId = 'user-123';
        const token = '000000';

        // Mock user not locked
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        // Mock MFA data
        mockDb.query.mockResolvedValueOnce({
          rows: [{
            totp_secret: 'TESTSECRET123',
            is_enabled: true
          }]
        });

        // Mock failed TOTP verification
        mfaService.verifyTOTP = jest.fn().mockResolvedValue(false);

        // Mock increment failed attempts
        mockDb.query.mockResolvedValueOnce({
          rows: [{ failed_attempts: 1 }]
        });

        const verified = await mfaService.verifyMFAToken(userId, token, 'totp');

        expect(verified).toBe(false);
      });
    });

    describe('Trusted Device Management', () => {
      test('should register trusted device', async () => {
        const userId = 'user-123';
        const deviceInfo = {
          deviceName: 'My iPhone',
          deviceFingerprint: 'device-123-fingerprint',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          location: { country: 'US', city: 'San Francisco' }
        };

        // Mock device count check
        mockDb.query.mockResolvedValueOnce({
          rows: [{ count: '2' }]
        });

        // Mock device registration
        mockDb.query.mockResolvedValueOnce({
          rows: [{ id: 'device-123' }]
        });

        const result = await mfaService.registerTrustedDevice(userId, deviceInfo);

        expect(result.deviceId).toBe('device-123');
        expect(result.verificationToken).toBeDefined();
        expect(result.status).toBe('pending_verification');
      });

      test('should verify trusted device', async () => {
        const verificationToken = 'token-123';

        // Mock device verification
        mockDb.query.mockResolvedValueOnce({
          rows: [{
            id: 'device-123',
            user_id: 'user-123',
            device_name: 'My iPhone'
          }]
        });

        const result = await mfaService.verifyTrustedDevice(verificationToken);

        expect(result).toBe(true);
      });

      test('should check device trust status', async () => {
        const userId = 'user-123';
        const deviceFingerprint = 'device-123-fingerprint';

        // Mock trusted device check
        mockDb.query.mockResolvedValueOnce({
          rows: [{
            trust_level: 'trusted',
            expires_at: new Date(Date.now() + 86400000)
          }]
        });

        // Mock last used update
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        const isTrusted = await mfaService.isDeviceTrusted(userId, deviceFingerprint);

        expect(isTrusted).toBe(true);
      });
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete authentication flow', async () => {
      const authService = new AuthService({
        db: mockDb,
        redis: mockRedis,
        logger: mockLogger
      });

      const sessionManager = new SessionManager({
        redis: mockRedis,
        logger: mockLogger
      });

      const walletAddress = '4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM';

      // Step 1: Generate challenge
      const challenge = await authService.generateChallenge(walletAddress);
      expect(challenge.nonce).toBeDefined();

      // Step 2: Mock signature verification
      mockRedis.get.mockResolvedValue(JSON.stringify({
        walletAddress,
        message: challenge.message,
        nonce: challenge.nonce,
        expiresAt: Date.now() + 300000
      }));

      // Mock user and session creation
      mockDb.query.mockResolvedValueOnce({ rows: [] }) // No existing user
        .mockResolvedValueOnce({ rows: [{ id: 'user-123', wallet_address: walletAddress }] })
        .mockResolvedValueOnce({ rows: [] }) // Create profile
        .mockResolvedValueOnce({ rows: [{ id: 'session-123' }] }); // Create session

      mockRedis.setEx.mockResolvedValue('OK');
      mockRedis.sAdd.mockResolvedValue(1);
      mockRedis.sMembers.mockResolvedValue([]);

      authService.validateSolanaSignature = jest.fn().mockResolvedValue(true);

      // Step 3: Verify signature and create session
      const authResult = await authService.verifySignature(
        walletAddress,
        'mockSignature',
        challenge.nonce
      );

      expect(authResult.success).toBe(true);
      expect(authResult.user).toBeDefined();
      expect(authResult.tokens).toBeDefined();
    });

    test('should handle RBAC with MFA requirement', async () => {
      const rbacService = new RBACService({
        db: mockDb,
        redis: mockRedis,
        logger: mockLogger
      });

      const mfaService = new MFAService({
        db: mockDb,
        redis: mockRedis,
        logger: mockLogger
      });

      const userId = 'user-123';

      // Mock admin role with MFA requirement
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          role_slug: 'admin',
          permissions: ['admin:*']
        }]
      });

      mockDb.query.mockResolvedValueOnce({
        rows: [{
          permissions: ['admin:*'],
          inherits_from: null
        }]
      });

      const hasAdminPermission = await rbacService.checkPermissions(userId, ['admin:users:manage']);
      expect(hasAdminPermission).toBe(true);

      // Check if MFA is required for admin actions
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          is_enabled: true,
          totp_verified: true
        }]
      });

      const mfaData = await mfaService.getUserMFA(userId);
      expect(mfaData.is_enabled).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors gracefully', async () => {
      const authService = new AuthService({
        db: {
          query: jest.fn().mockRejectedValue(new Error('Database connection failed')),
          end: jest.fn()
        },
        logger: mockLogger
      });

      await expect(authService.generateChallenge('valid-wallet-address'))
        .rejects.toThrow();
    });

    test('should handle Redis connection errors gracefully', async () => {
      const sessionManager = new SessionManager({
        redis: {
          connect: jest.fn().mockRejectedValue(new Error('Redis connection failed')),
          get: jest.fn().mockRejectedValue(new Error('Redis error')),
          set: jest.fn().mockRejectedValue(new Error('Redis error'))
        },
        logger: mockLogger
      });

      const sessionData = {
        userId: 'user-123',
        walletAddress: '4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM'
      };

      // Should fall back to memory storage
      const session = await sessionManager.createSession(sessionData);
      expect(session).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    test('should handle concurrent authentication requests', async () => {
      const authService = new AuthService({
        db: mockDb,
        redis: mockRedis,
        logger: mockLogger
      });

      const walletAddresses = Array.from({ length: 10 }, (_, i) => 
        `4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziof${i}`
      );

      const challengePromises = walletAddresses.map(address =>
        authService.generateChallenge(address)
      );

      const challenges = await Promise.all(challengePromises);

      expect(challenges).toHaveLength(10);
      challenges.forEach(challenge => {
        expect(challenge.nonce).toBeDefined();
        expect(challenge.message).toBeDefined();
      });
    });

    test('should cache RBAC permissions effectively', async () => {
      const rbacService = new RBACService({
        db: mockDb,
        redis: mockRedis,
        logger: mockLogger
      });

      const userId = 'user-123';

      // First call - should query database
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          role_slug: 'member',
          permissions: ['content:view']
        }]
      }).mockResolvedValueOnce({
        rows: [{
          permissions: ['content:view'],
          inherits_from: null
        }]
      });

      mockRedis.get.mockResolvedValueOnce(null); // No cache
      mockRedis.setEx.mockResolvedValue('OK'); // Cache set

      await rbacService.checkPermissions(userId, ['content:view']);

      // Second call - should use cache
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(['content:view'])); // Cached

      await rbacService.checkPermissions(userId, ['content:view']);

      // Database should only be called once
      expect(mockDb.query).toHaveBeenCalledTimes(2); // Initial queries only
    });
  });
});

/**
 * Test utilities and helpers
 */
export const AuthTestUtils = {
  /**
   * Generate mock wallet address
   */
  generateMockWalletAddress: () => {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 44; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * Generate mock signature
   */
  generateMockSignature: () => {
    return Buffer.from('mock-signature-data').toString('base64');
  },

  /**
   * Create mock request object
   */
  createMockRequest: (overrides = {}) => ({
    headers: {
      'authorization': 'Bearer token-123',
      'user-agent': 'Mozilla/5.0...',
      'x-session-token': 'session-123',
      ...overrides.headers
    },
    ip: '192.168.1.1',
    path: '/api/test',
    method: 'GET',
    get: jest.fn((header) => overrides.headers?.[header.toLowerCase()]),
    ...overrides
  }),

  /**
   * Create mock response object
   */
  createMockResponse: () => ({
    status: jest.fn(function() { return this; }),
    json: jest.fn(),
    set: jest.fn()
  }),

  /**
   * Create mock next function
   */
  createMockNext: () => jest.fn()
};