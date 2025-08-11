/**
 * Authentication Routes for MLG.clan API
 * 
 * Routes for wallet-based authentication, session management,
 * and token operations.
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

import express from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validate, schemas } from '../middleware/validation.middleware.js';
import { authMiddleware, requireRole } from '../middleware/auth.middleware.js';
import { rateLimiterMiddleware } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

/**
 * POST /api/auth/challenge
 * Generate authentication challenge for wallet signature
 * 
 * @body {string} walletAddress - Solana wallet address
 * @body {string} [walletType=phantom] - Wallet type (phantom, solflare, etc.)
 * @returns {object} Challenge data with nonce and message
 */
router.post('/challenge',
  rateLimiterMiddleware('auth'),
  validate(schemas.auth.challenge),
  AuthController.generateChallenge
);

/**
 * POST /api/auth/verify
 * Verify wallet signature and create authenticated session
 * 
 * @body {string} walletAddress - Solana wallet address
 * @body {string} signature - Signed challenge message
 * @body {string} nonce - Challenge nonce
 * @returns {object} User data, tokens, and session information
 */
router.post('/verify',
  rateLimiterMiddleware('auth'),
  validate(schemas.auth.verify),
  AuthController.verifySignature
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 * 
 * @body {string} [refreshToken] - Refresh token (can also be from cookie)
 * @returns {object} New access token and expiration
 */
router.post('/refresh',
  rateLimiterMiddleware('auth'),
  validate(schemas.auth.refresh),
  AuthController.refreshToken
);

/**
 * POST /api/auth/logout
 * Logout user and revoke session
 * 
 * @header {string} Authorization - Bearer access token
 * @returns {object} Logout confirmation
 */
router.post('/logout',
  authMiddleware,
  AuthController.logout
);

/**
 * GET /api/auth/session
 * Get current session information and user data
 * 
 * @header {string} Authorization - Bearer access token
 * @returns {object} User data, session info, and permissions
 */
router.get('/session',
  authMiddleware,
  AuthController.getSession
);

/**
 * POST /api/auth/validate
 * Validate token (for external services integration)
 * 
 * @body {string} token - JWT token to validate
 * @returns {object} Token validation result
 */
router.post('/validate',
  rateLimiterMiddleware('auth'),
  validate(schemas.auth.refresh), // Reuse refresh schema for token validation
  AuthController.validateToken
);

/**
 * GET /api/auth/stats
 * Get authentication statistics (admin only)
 * 
 * @header {string} Authorization - Bearer access token
 * @requires admin role
 * @returns {object} Authentication and user statistics
 */
router.get('/stats',
  authMiddleware,
  requireRole('admin'),
  AuthController.getAuthStats
);

/**
 * Additional routes for enhanced authentication features
 */

/**
 * POST /api/auth/revoke-all
 * Revoke all user sessions (security feature)
 */
router.post('/revoke-all',
  authMiddleware,
  async (req, res, next) => {
    try {
      const authService = req.services.auth;
      
      // Get all active sessions for user
      const sessions = await authService.db.query(`
        SELECT session_token FROM user_sessions
        WHERE user_id = $1 AND is_active = true AND expires_at > NOW()
      `, [req.user.id]);
      
      // Revoke all sessions
      for (const session of sessions.rows) {
        await authService.revokeSession(session.session_token, 'user_revoke_all');
      }
      
      res.status(200).json({
        success: true,
        data: {
          revokedSessions: sessions.rows.length
        },
        message: 'All sessions revoked successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/auth/sessions
 * Get all active sessions for current user
 */
router.get('/sessions',
  authMiddleware,
  async (req, res, next) => {
    try {
      const authService = req.services.auth;
      
      const sessions = await authService.db.query(`
        SELECT 
          id,
          created_at,
          expires_at,
          ip_address,
          user_agent,
          last_activity,
          CASE WHEN session_token = $2 THEN true ELSE false END as is_current
        FROM user_sessions
        WHERE user_id = $1 AND is_active = true AND expires_at > NOW()
        ORDER BY created_at DESC
      `, [req.user.id, req.sessionToken]);
      
      res.status(200).json({
        success: true,
        data: {
          sessions: sessions.rows.map(session => ({
            id: session.id,
            createdAt: session.created_at,
            expiresAt: session.expires_at,
            ipAddress: session.ip_address,
            userAgent: session.user_agent,
            lastActivity: session.last_activity,
            isCurrent: session.is_current,
            // Mask IP for privacy
            ipAddressMasked: session.ip_address ? 
              session.ip_address.split('.').slice(0, 2).join('.') + '.***' : null
          }))
        },
        message: 'Active sessions retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/auth/sessions/:sessionId
 * Revoke specific session
 */
router.delete('/sessions/:sessionId',
  authMiddleware,
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const authService = req.services.auth;
      
      // Verify session belongs to user
      const session = await authService.db.query(`
        SELECT session_token FROM user_sessions
        WHERE id = $1 AND user_id = $2 AND is_active = true
      `, [sessionId, req.user.id]);
      
      if (session.rows.length === 0) {
        return res.status(404).json({
          error: 'Session not found',
          code: 'SESSION_NOT_FOUND',
          message: 'The specified session was not found or does not belong to you'
        });
      }
      
      await authService.revokeSession(session.rows[0].session_token, 'user_revoke_specific');
      
      res.status(200).json({
        success: true,
        message: 'Session revoked successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;