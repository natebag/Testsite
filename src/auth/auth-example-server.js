/**
 * Example Express Server with MLG.clan Authentication System
 * 
 * This example demonstrates how to integrate the complete authentication
 * system with an Express.js application, including all features:
 * - Phantom wallet authentication with challenge-response
 * - JWT token management and session handling
 * - Role-based access control (RBAC)
 * - Multi-factor authentication (MFA)
 * - Rate limiting and security middleware
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createRequire } from 'module';

// Import our authentication system
import { AuthService } from './auth-service.js';
import { SessionManager } from './session-manager.js';
import { AuthMiddleware, auth } from './middleware/auth-middleware.js';
import { RBACService } from './rbac.js';
import { MFAService } from './mfa.js';

const require = createRequire(import.meta.url);
const pkg = require('../../package.json');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.mainnet-beta.solana.com", "wss://api.mainnet-beta.solana.com"],
    },
  },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Token']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize authentication services
const authService = new AuthService();
const sessionManager = new SessionManager();
const rbacService = new RBACService();
const mfaService = new MFAService();

// Create middleware instance
const authMiddleware = new AuthMiddleware({
  authService,
  sessionManager,
  rbacService,
  logger: console
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MLG.clan Authentication System',
    version: pkg.version,
    timestamp: new Date().toISOString()
  });
});

// ========================================
// AUTHENTICATION ENDPOINTS
// ========================================

/**
 * Generate authentication challenge for wallet
 */
app.post('/auth/challenge', 
  auth.securityCheck(),
  auth.rateLimit({ limit: 10, window: 60000 }), // 10 requests per minute
  async (req, res) => {
    try {
      const { walletAddress, walletType = 'phantom' } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_WALLET_ADDRESS',
            message: 'Wallet address is required'
          }
        });
      }
      
      const challenge = await authService.generateChallenge(
        walletAddress, 
        walletType, 
        req.ip
      );
      
      res.json({
        success: true,
        data: challenge
      });
    } catch (error) {
      console.error('Challenge generation error:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'CHALLENGE_GENERATION_FAILED',
          message: error.message
        }
      });
    }
  }
);

/**
 * Verify wallet signature and create session
 */
app.post('/auth/verify',
  auth.securityCheck(),
  auth.rateLimit({ limit: 5, window: 60000 }), // 5 attempts per minute
  async (req, res) => {
    try {
      const { walletAddress, signature, nonce } = req.body;
      
      if (!walletAddress || !signature || !nonce) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            message: 'Wallet address, signature, and nonce are required'
          }
        });
      }
      
      const result = await authService.verifySignature(
        walletAddress,
        signature,
        nonce,
        req.ip,
        req.get('user-agent')
      );
      
      // Set secure session cookie
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      };
      
      res.cookie('sessionToken', result.session.sessionToken, cookieOptions);
      
      res.json({
        success: true,
        data: {
          user: {
            id: result.user.id,
            walletAddress: result.user.wallet_address,
            username: result.user.username,
            roles: result.tokens.accessToken ? ['member'] : ['guest']
          },
          tokens: {
            accessToken: result.tokens.accessToken,
            refreshToken: result.tokens.refreshToken,
            expiresAt: result.tokens.expiresAt
          },
          session: {
            id: result.session.id,
            expiresAt: result.session.expiresAt
          }
        }
      });
    } catch (error) {
      console.error('Authentication verification error:', error);
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: error.message
        }
      });
    }
  }
);

/**
 * Refresh JWT access token
 */
app.post('/auth/refresh',
  auth.securityCheck(),
  auth.rateLimit({ limit: 20, window: 60000 }),
  async (req, res) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REFRESH_TOKEN',
            message: 'Refresh token is required'
          }
        });
      }
      
      const tokens = await authService.refreshToken(refreshToken);
      
      res.json({
        success: true,
        data: tokens
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_REFRESH_FAILED',
          message: error.message
        }
      });
    }
  }
);

/**
 * Logout and revoke session
 */
app.post('/auth/logout',
  auth.optional(),
  async (req, res) => {
    try {
      const sessionToken = req.headers['x-session-token'] || req.cookies?.sessionToken;
      
      if (sessionToken) {
        await authService.revokeSession(sessionToken, 'user_logout');
      }
      
      res.clearCookie('sessionToken');
      
      res.json({
        success: true,
        message: 'Successfully logged out'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'LOGOUT_FAILED',
          message: 'Failed to logout'
        }
      });
    }
  }
);

/**
 * Get current user profile with roles and permissions
 */
app.get('/auth/profile',
  auth.required(),
  async (req, res) => {
    try {
      const user = req.user;
      const userRoles = await rbacService.getUserRoles(user.id);
      const userPermissions = await rbacService.getUserPermissions(user.id);
      
      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            walletAddress: user.wallet_address,
            username: user.username,
            email: user.email,
            status: user.status,
            createdAt: user.created_at,
            lastLogin: user.last_login
          },
          roles: userRoles.map(role => ({
            slug: role.role_slug,
            name: role.name,
            level: role.level,
            contextType: role.context_type,
            contextId: role.context_id
          })),
          permissions: userPermissions,
          session: {
            id: req.session?.id,
            createdAt: req.session?.createdAt,
            lastActivity: req.session?.lastActivity,
            deviceName: req.session?.deviceName
          }
        }
      });
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PROFILE_FETCH_FAILED',
          message: 'Failed to fetch user profile'
        }
      });
    }
  }
);

// ========================================
// MULTI-FACTOR AUTHENTICATION ENDPOINTS
// ========================================

/**
 * Setup TOTP MFA for user
 */
app.post('/auth/mfa/setup',
  auth.required(),
  async (req, res) => {
    try {
      const setup = await mfaService.setupTOTP(req.user.id);
      
      res.json({
        success: true,
        data: setup
      });
    } catch (error) {
      console.error('MFA setup error:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'MFA_SETUP_FAILED',
          message: error.message
        }
      });
    }
  }
);

/**
 * Verify TOTP setup and enable MFA
 */
app.post('/auth/mfa/verify-setup',
  auth.required(),
  async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_TOKEN',
            message: 'TOTP token is required'
          }
        });
      }
      
      const result = await mfaService.verifyTOTPSetup(req.user.id, token);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('MFA verification error:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'MFA_VERIFICATION_FAILED',
          message: error.message
        }
      });
    }
  }
);

/**
 * Verify MFA token
 */
app.post('/auth/mfa/verify',
  auth.required(),
  async (req, res) => {
    try {
      const { token, method = 'totp' } = req.body;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_TOKEN',
            message: 'MFA token is required'
          }
        });
      }
      
      const verified = await mfaService.verifyMFAToken(req.user.id, token, method);
      
      res.json({
        success: true,
        data: { verified }
      });
    } catch (error) {
      console.error('MFA token verification error:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'MFA_TOKEN_VERIFICATION_FAILED',
          message: error.message
        }
      });
    }
  }
);

/**
 * Generate new backup codes
 */
app.post('/auth/mfa/backup-codes',
  auth.required(),
  async (req, res) => {
    try {
      const backupCodes = await mfaService.generateNewBackupCodes(req.user.id);
      
      res.json({
        success: true,
        data: { backupCodes }
      });
    } catch (error) {
      console.error('Backup codes generation error:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'BACKUP_CODES_GENERATION_FAILED',
          message: error.message
        }
      });
    }
  }
);

// ========================================
// ROLE-BASED ACCESS CONTROL EXAMPLES
// ========================================

/**
 * Example: Content management (requires content:moderate permission)
 */
app.get('/api/content/moderation-queue',
  auth.requirePermissions(['content:moderate']),
  async (req, res) => {
    res.json({
      success: true,
      data: {
        message: 'Content moderation queue - accessible to moderators',
        userRoles: req.userRoles,
        userPermissions: req.userPermissions
      }
    });
  }
);

/**
 * Example: Admin panel (requires admin role)
 */
app.get('/api/admin/dashboard',
  auth.requireRoles(['admin', 'super_admin']),
  async (req, res) => {
    res.json({
      success: true,
      data: {
        message: 'Admin dashboard - accessible to admins only',
        userRoles: req.userRoles,
        metrics: {
          activeUsers: 1000,
          totalContent: 5000,
          moderationQueue: 25
        }
      }
    });
  }
);

/**
 * Example: Clan management (requires clan context permissions)
 */
app.get('/api/clans/:clanId/manage',
  auth.requirePermissions(['clan:manage'], {
    context: { type: 'clan', getId: (req) => req.params.clanId }
  }),
  async (req, res) => {
    res.json({
      success: true,
      data: {
        message: `Clan management for clan ${req.params.clanId}`,
        clanId: req.params.clanId,
        userRoles: req.userRoles,
        contextPermissions: 'clan:manage confirmed'
      }
    });
  }
);

/**
 * Example: Public content (no authentication required)
 */
app.get('/api/content/public',
  auth.optional(),
  async (req, res) => {
    res.json({
      success: true,
      data: {
        message: 'Public content accessible to all users',
        isAuthenticated: req.isAuthenticated,
        user: req.user ? {
          id: req.user.id,
          username: req.user.username
        } : null
      }
    });
  }
);

// ========================================
// SYSTEM MONITORING ENDPOINTS
// ========================================

/**
 * Authentication system metrics (admin only)
 */
app.get('/api/admin/auth/metrics',
  auth.requireRoles(['admin', 'super_admin']),
  async (req, res) => {
    try {
      const metrics = {
        sessions: await sessionManager.getMetrics(),
        rbac: await rbacService.getMetrics(),
        mfa: await mfaService.getMetrics()
      };
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('Metrics fetch error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'METRICS_FETCH_FAILED',
          message: 'Failed to fetch system metrics'
        }
      });
    }
  }
);

// ========================================
// ERROR HANDLING
// ========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ENDPOINT_NOT_FOUND',
      message: `Endpoint ${req.method} ${req.path} not found`
    }
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An internal error occurred'
        : error.message
    }
  });
});

// ========================================
// SERVER STARTUP
// ========================================

async function startServer() {
  try {
    // Initialize authentication services
    await authService.initializeDatabase();
    await authService.initializeRedis();
    await sessionManager.initialize();
    await rbacService.initialize();
    await mfaService.initialize();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 MLG.clan Authentication Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Authentication endpoints:`);
      console.log(`   POST /auth/challenge - Generate wallet challenge`);
      console.log(`   POST /auth/verify - Verify signature and login`);
      console.log(`   POST /auth/refresh - Refresh access token`);
      console.log(`   POST /auth/logout - Logout user`);
      console.log(`   GET  /auth/profile - Get user profile`);
      console.log(`🛡️  MFA endpoints:`);
      console.log(`   POST /auth/mfa/setup - Setup TOTP MFA`);
      console.log(`   POST /auth/mfa/verify-setup - Verify MFA setup`);
      console.log(`   POST /auth/mfa/verify - Verify MFA token`);
      console.log(`📈 Example protected endpoints:`);
      console.log(`   GET  /api/content/moderation-queue - Moderator only`);
      console.log(`   GET  /api/admin/dashboard - Admin only`);
      console.log(`   GET  /api/clans/:id/manage - Clan context permissions`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Gracefully shutting down...');
  
  try {
    await authService.shutdown();
    await sessionManager.shutdown();
    await rbacService.shutdown();
    await mfaService.shutdown();
    
    console.log('✅ All services shut down successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  
  try {
    await authService.shutdown();
    await sessionManager.shutdown();
    await rbacService.shutdown();
    await mfaService.shutdown();
    
    process.exit(0);
  } catch (error) {
    console.error('Error during SIGTERM shutdown:', error);
    process.exit(1);
  }
});

// Only start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export { app, authService, sessionManager, rbacService, mfaService };
export default app;