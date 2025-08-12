/**
 * User Routes for MLG.clan API
 * 
 * Routes for user profile management, search, leaderboards,
 * achievements, and activity tracking.
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

import express from 'express';
import { UserController } from '../controllers/user.controller.js';
import { validate, schemas } from '../middleware/validation.middleware.js';
import { authMiddleware, optionalAuthMiddleware, requireSelfOrAdmin } from '../middleware/auth.middleware.js';
import { rateLimiterMiddleware } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

/**
 * GET /api/users/profile
 * Get current authenticated user's profile
 * 
 * @header {string} Authorization - Bearer access token
 * @query {boolean} [includeStats=false] - Include user statistics
 * @query {boolean} [includeAchievements=false] - Include achievements data
 * @query {boolean} [includeRankings=false] - Include ranking information
 * @returns {object} User profile data
 */
router.get('/profile',
  authMiddleware,
  rateLimiterMiddleware('user'),
  UserController.getProfile
);

/**
 * PUT /api/users/profile
 * Update current authenticated user's profile
 * 
 * @header {string} Authorization - Bearer access token
 * @body {object} [userData] - User data to update
 * @body {object} [profileData] - Profile data to update
 * @returns {object} Updated user profile
 */
router.put('/profile',
  authMiddleware,
  rateLimiterMiddleware('user'),
  validate(schemas.user.profile),
  UserController.updateProfile
);

/**
 * GET /api/users/search
 * Search users with filters
 * 
 * @query {string} [query] - Search query string
 * @query {string} [username] - Username filter
 * @query {string} [walletAddress] - Wallet address filter
 * @query {number} [page=1] - Page number
 * @query {number} [limit=20] - Results per page
 * @query {string} [field] - Sort field
 * @query {string} [order=desc] - Sort order
 * @query {boolean} [includeClanInfo=false] - Include clan membership info
 * @returns {object} Search results with pagination
 */
router.get('/search',
  optionalAuthMiddleware,
  rateLimiterMiddleware('search'),
  validate(schemas.user.search, 'query'),
  UserController.searchUsers
);

/**
 * GET /api/users/leaderboard
 * Get user leaderboard
 * 
 * @query {string} [metric=reputation_score] - Ranking metric
 * @query {number} [limit=50] - Number of results
 * @query {number} [offset=0] - Results offset
 * @returns {object} Leaderboard data
 */
router.get('/leaderboard',
  optionalAuthMiddleware,
  rateLimiterMiddleware('user'),
  UserController.getLeaderboard
);

/**
 * GET /api/users/wallet/:walletAddress
 * Get user by wallet address (public info only)
 * 
 * @param {string} walletAddress - Solana wallet address
 * @returns {object} Public user information
 */
router.get('/wallet/:walletAddress',
  optionalAuthMiddleware,
  rateLimiterMiddleware('user'),
  UserController.getUserByWallet
);

/**
 * GET /api/users/:id/dashboard
 * Get user dashboard data
 * 
 * @header {string} Authorization - Bearer access token
 * @param {string} id - User ID
 * @returns {object} Dashboard data with stats and activity
 */
router.get('/:id/dashboard',
  authMiddleware,
  requireSelfOrAdmin('id'),
  rateLimiterMiddleware('user'),
  UserController.getDashboard
);

/**
 * GET /api/users/:id/achievements
 * Get user achievements
 * 
 * @param {string} id - User ID
 * @query {boolean} [includeProgress=true] - Include achievement progress
 * @query {boolean} [includeStats=true] - Include achievement statistics
 * @returns {object} User achievements data
 */
router.get('/:id/achievements',
  optionalAuthMiddleware,
  rateLimiterMiddleware('user'),
  UserController.getAchievements
);

/**
 * POST /api/users/:id/activity
 * Update user activity (internal use or admin)
 * 
 * @header {string} Authorization - Bearer access token
 * @param {string} id - User ID
 * @body {string} activityType - Type of activity
 * @body {object} [activityData={}] - Additional activity data
 * @returns {object} Updated user data
 */
router.post('/:id/activity',
  authMiddleware,
  requireSelfOrAdmin('id'),
  rateLimiterMiddleware('user'),
  validate(schemas.user.activity),
  UserController.updateActivity
);

/**
 * GET /api/users/:id/stats
 * Get user statistics
 * 
 * @param {string} id - User ID
 * @query {string} [period=30d] - Statistics period (7d, 30d, 1y)
 * @returns {object} User statistics and rankings
 */
router.get('/:id/stats',
  optionalAuthMiddleware,
  rateLimiterMiddleware('user'),
  UserController.getUserStats
);

/**
 * GET /api/users/:id/content
 * Get user's content submissions
 * 
 * @param {string} id - User ID
 * @query {number} [page=1] - Page number
 * @query {number} [limit=20] - Results per page
 * @query {string} [status] - Content status filter
 * @query {string} [contentType] - Content type filter
 * @returns {object} User's content with pagination
 */
router.get('/:id/content',
  optionalAuthMiddleware,
  rateLimiterMiddleware('user'),
  UserController.getUserContent
);

/**
 * Additional utility routes
 */

/**
 * GET /api/users/me/clans
 * Get current user's clan memberships
 */
router.get('/me/clans',
  authMiddleware,
  rateLimiterMiddleware('user'),
  async (req, res, next) => {
    try {
      const clanRepository = req.services.clanRepository;
      
      if (!clanRepository) {
        return res.status(500).json({
          error: 'Clan service unavailable',
          code: 'SERVICE_ERROR'
        });
      }
      
      const memberships = await clanRepository.clanDAO.getUserMemberships(req.user.id);
      
      // Get clan details for each membership
      const clansWithDetails = await Promise.all(
        memberships.map(async (membership) => {
          const clan = await clanRepository.clanDAO.findById(membership.clan_id);
          return {
            membership,
            clan: clan ? {
              id: clan.id,
              name: clan.name,
              slug: clan.slug,
              avatarUrl: clan.avatar_url,
              memberCount: clan.member_count || 0,
              reputationScore: clan.reputation_score || 0
            } : null
          };
        })
      );
      
      res.status(200).json({
        success: true,
        data: {
          memberships: clansWithDetails.filter(item => item.clan)
        },
        message: 'User clan memberships retrieved successfully'
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/users/me/notifications
 * Get user notifications (placeholder for future implementation)
 */
router.get('/me/notifications',
  authMiddleware,
  rateLimiterMiddleware('user'),
  async (req, res) => {
    // Placeholder for notification system
    res.status(200).json({
      success: true,
      data: {
        notifications: [],
        unreadCount: 0
      },
      message: 'Notifications retrieved successfully'
    });
  }
);

/**
 * PUT /api/users/me/preferences
 * Update user preferences
 */
router.put('/me/preferences',
  authMiddleware,
  rateLimiterMiddleware('user'),
  async (req, res, next) => {
    try {
      const { notifications, privacy, theme, language } = req.body;
      
      const userRepository = req.services.userRepository;
      
      const preferences = {
        notifications: notifications || {},
        privacy: privacy || 'public',
        theme: theme || 'dark',
        language: language || 'en'
      };
      
      const updatedUser = await userRepository.updateUserProfile(
        req.user.id,
        {},
        { preferences }
      );
      
      res.status(200).json({
        success: true,
        data: {
          preferences: updatedUser.preferences
        },
        message: 'Preferences updated successfully'
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/users/me/activity-feed
 * Get user's activity feed
 */
router.get('/me/activity-feed',
  authMiddleware,
  rateLimiterMiddleware('user'),
  async (req, res, next) => {
    try {
      const { limit = 20, offset = 0 } = req.query;
      
      const userRepository = req.services.userRepository;
      
      // Get user's recent activity
      const activity = await userRepository.userDAO.getUserActivityFeed(req.user.id, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      res.status(200).json({
        success: true,
        data: {
          activity,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: activity.length === parseInt(limit)
          }
        },
        message: 'Activity feed retrieved successfully'
      });
      
    } catch (error) {
      next(error);
    }
  }
);

export default router;