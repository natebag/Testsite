/**
 * Authentication Controller for MLG.clan API
 * 
 * Handles wallet-based authentication, session management, and token operations
 * using the existing AuthService.
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

import { asyncHandler } from '../middleware/error.middleware.js';
import { APIErrors } from '../middleware/error.middleware.js';

/**
 * Authentication Controller Class
 */
export class AuthController {
  /**
   * Generate authentication challenge
   * POST /api/auth/challenge
   */
  static generateChallenge = asyncHandler(async (req, res) => {
    const { walletAddress, walletType } = req.body;
    const ipAddress = req.ip;
    
    const authService = req.services.auth;
    if (!authService) {
      throw APIErrors.INTERNAL_ERROR('Authentication service unavailable');
    }
    
    try {
      const challenge = await authService.generateChallenge(
        walletAddress,
        walletType,
        ipAddress
      );
      
      res.status(200).json({
        success: true,
        data: challenge,
        message: 'Challenge generated successfully'
      });
      
    } catch (error) {
      if (error.message.includes('rate limit') || error.message.includes('RATE_LIMITED')) {
        throw APIErrors.RATE_LIMITED(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
      }
      
      if (error.message.includes('Invalid wallet address')) {
        throw APIErrors.VALIDATION_FAILED([{
          field: 'walletAddress',
          message: 'Invalid Solana wallet address format',
          value: walletAddress
        }]);
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Verify wallet signature and authenticate
   * POST /api/auth/verify
   */
  static verifySignature = asyncHandler(async (req, res) => {
    const { walletAddress, signature, nonce } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');
    
    const authService = req.services.auth;
    if (!authService) {
      throw APIErrors.INTERNAL_ERROR('Authentication service unavailable');
    }
    
    try {
      const authResult = await authService.verifySignature(
        walletAddress,
        signature,
        nonce,
        ipAddress,
        userAgent
      );
      
      if (!authResult.success) {
        throw APIErrors.AUTHENTICATION_REQUIRED();
      }
      
      // Set secure HTTP-only cookie with refresh token
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      };
      
      res.cookie('mlg_refresh_token', authResult.tokens.refreshToken, cookieOptions);
      
      res.status(200).json({
        success: true,
        data: {
          user: {
            id: authResult.user.id,
            walletAddress: authResult.user.wallet_address,
            username: authResult.user.username,
            displayName: authResult.user.display_name,
            avatarUrl: authResult.user.avatar_url,
            roles: authResult.user.roles || [],
            reputationScore: authResult.user.reputation_score || 0,
            createdAt: authResult.user.created_at,
            lastLogin: authResult.user.last_login
          },
          tokens: {
            accessToken: authResult.tokens.accessToken,
            expiresAt: authResult.tokens.expiresAt,
            tokenType: 'Bearer'
          },
          session: {
            id: authResult.session.id,
            expiresAt: authResult.session.expiresAt
          }
        },
        message: 'Authentication successful'
      });
      
    } catch (error) {
      if (error.message.includes('CHALLENGE_NOT_FOUND')) {
        throw APIErrors.VALIDATION_FAILED([{
          field: 'nonce',
          message: 'Invalid or expired challenge nonce',
          value: nonce
        }]);
      }
      
      if (error.message.includes('CHALLENGE_EXPIRED')) {
        throw APIErrors.VALIDATION_FAILED([{
          field: 'nonce',
          message: 'Challenge has expired, please request a new one',
          value: nonce
        }]);
      }
      
      if (error.message.includes('INVALID_SIGNATURE')) {
        throw APIErrors.VALIDATION_FAILED([{
          field: 'signature',
          message: 'Invalid wallet signature',
          value: 'hidden'
        }]);
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  static refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken: bodyRefreshToken } = req.body;
    const cookieRefreshToken = req.cookies?.mlg_refresh_token;
    
    const refreshToken = bodyRefreshToken || cookieRefreshToken;
    
    if (!refreshToken) {
      throw APIErrors.VALIDATION_FAILED([{
        field: 'refreshToken',
        message: 'Refresh token is required',
        value: null
      }]);
    }
    
    const authService = req.services.auth;
    if (!authService) {
      throw APIErrors.INTERNAL_ERROR('Authentication service unavailable');
    }
    
    try {
      const tokens = await authService.refreshToken(refreshToken);
      
      res.status(200).json({
        success: true,
        data: {
          tokens: {
            accessToken: tokens.accessToken,
            expiresAt: tokens.expiresAt,
            tokenType: 'Bearer'
          }
        },
        message: 'Token refreshed successfully'
      });
      
    } catch (error) {
      // Clear invalid refresh token cookie
      res.clearCookie('mlg_refresh_token');
      
      if (error.message.includes('TOKEN_EXPIRED') || error.message.includes('TOKEN_INVALID')) {
        throw APIErrors.INVALID_TOKEN();
      }
      
      if (error.message.includes('USER_NOT_FOUND')) {
        throw APIErrors.RESOURCE_NOT_FOUND('User', 'token');
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Logout and revoke session
   * POST /api/auth/logout
   */
  static logout = asyncHandler(async (req, res) => {
    const authService = req.services.auth;
    if (!authService) {
      throw APIErrors.INTERNAL_ERROR('Authentication service unavailable');
    }
    
    // Extract session token from request (would need to be added to auth middleware)
    const sessionToken = req.user?.sessionToken || req.headers['x-session-token'];
    
    if (sessionToken) {
      try {
        await authService.revokeSession(sessionToken, 'user_logout');
      } catch (error) {
        // Log error but don't fail logout
        console.warn('Failed to revoke session:', error);
      }
    }
    
    // Clear cookies
    res.clearCookie('mlg_refresh_token');
    res.clearCookie('mlg_auth_token');
    
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  });
  
  /**
   * Get current session information
   * GET /api/auth/session
   */
  static getSession = asyncHandler(async (req, res) => {
    if (!req.user) {
      throw APIErrors.AUTHENTICATION_REQUIRED();
    }
    
    const authService = req.services.auth;
    const userRepository = req.services.userRepository;
    
    if (!authService || !userRepository) {
      throw APIErrors.INTERNAL_ERROR('Required services unavailable');
    }
    
    try {
      // Get fresh user data
      const user = await authService.getUserById(req.user.id);
      
      if (!user) {
        throw APIErrors.RESOURCE_NOT_FOUND('User', req.user.id);
      }
      
      // Get user statistics
      const userStats = await userRepository.userDAO.getUserStats(req.user.id);
      
      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            walletAddress: user.wallet_address,
            username: user.username,
            displayName: user.display_name,
            avatarUrl: user.avatar_url,
            bio: user.bio,
            roles: user.roles || [],
            permissions: user.permissions || [],
            reputationScore: user.reputation_score || 0,
            stats: userStats,
            createdAt: user.created_at,
            lastLogin: user.last_login,
            walletVerified: user.wallet_verified
          },
          session: {
            issuedAt: new Date(req.user.iat * 1000),
            expiresAt: new Date(req.user.exp * 1000),
            remainingTime: (req.user.exp * 1000) - Date.now()
          },
          permissions: {
            canCreateClan: true, // Could be based on user level/reputation
            canModerate: req.user.roles?.includes('moderator') || req.user.roles?.includes('admin'),
            canAdminister: req.user.roles?.includes('admin') || req.user.roles?.includes('owner')
          }
        },
        message: 'Session retrieved successfully'
      });
      
    } catch (error) {
      if (error.message.includes('not found')) {
        throw APIErrors.RESOURCE_NOT_FOUND('User', req.user.id);
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Validate token (for external services)
   * POST /api/auth/validate
   */
  static validateToken = asyncHandler(async (req, res) => {
    const { token } = req.body;
    
    if (!token) {
      throw APIErrors.VALIDATION_FAILED([{
        field: 'token',
        message: 'Token is required for validation',
        value: null
      }]);
    }
    
    const authService = req.services.auth;
    if (!authService) {
      throw APIErrors.INTERNAL_ERROR('Authentication service unavailable');
    }
    
    try {
      const decoded = await authService.validateToken(token, 'access');
      
      res.status(200).json({
        success: true,
        data: {
          valid: true,
          userId: decoded.sub,
          walletAddress: decoded.wallet,
          roles: decoded.roles || [],
          permissions: decoded.permissions || [],
          issuedAt: new Date(decoded.iat * 1000),
          expiresAt: new Date(decoded.exp * 1000)
        },
        message: 'Token is valid'
      });
      
    } catch (error) {
      res.status(200).json({
        success: true,
        data: {
          valid: false,
          reason: error.message
        },
        message: 'Token validation completed'
      });
    }
  });
  
  /**
   * Get authentication statistics (admin only)
   * GET /api/auth/stats
   */
  static getAuthStats = asyncHandler(async (req, res) => {
    // This would require admin role check
    if (!req.user?.roles?.includes('admin')) {
      throw APIErrors.INSUFFICIENT_PERMISSIONS(['admin'], req.user?.roles || []);
    }
    
    const authService = req.services.auth;
    if (!authService) {
      throw APIErrors.INTERNAL_ERROR('Authentication service unavailable');
    }
    
    try {
      // Get basic authentication statistics from database
      const stats = await authService.db.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN wallet_verified = true THEN 1 END) as verified_users,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as new_users_24h,
          COUNT(CASE WHEN last_login > NOW() - INTERVAL '24 hours' THEN 1 END) as active_users_24h,
          COUNT(CASE WHEN last_login > NOW() - INTERVAL '7 days' THEN 1 END) as active_users_7d
        FROM users
        WHERE status = 'active'
      `);
      
      const sessionStats = await authService.db.query(`
        SELECT 
          COUNT(*) as active_sessions,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as recent_sessions
        FROM user_sessions
        WHERE is_active = true AND expires_at > NOW()
      `);
      
      res.status(200).json({
        success: true,
        data: {
          users: stats.rows[0],
          sessions: sessionStats.rows[0],
          timestamp: new Date().toISOString()
        },
        message: 'Authentication statistics retrieved successfully'
      });
      
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
}

export default AuthController;