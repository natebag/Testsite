/**
 * User Controller for MLG.clan API
 * 
 * Handles user profile management, search, leaderboards, and activity tracking
 * using the UserRepository.
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

import { asyncHandler } from '../middleware/error.middleware.js';
import { APIErrors } from '../middleware/error.middleware.js';

/**
 * User Controller Class
 */
export class UserController {
  /**
   * Get current user profile
   * GET /api/users/profile
   */
  static getProfile = asyncHandler(async (req, res) => {
    const { includeStats, includeAchievements, includeRankings } = req.query;
    
    const userRepository = req.services.userRepository;
    if (!userRepository) {
      throw APIErrors.INTERNAL_ERROR('User service unavailable');
    }
    
    try {
      const options = {
        includeStats: includeStats === 'true',
        includeAchievements: includeAchievements === 'true',
        includeRankings: includeRankings === 'true'
      };
      
      const profile = await userRepository.getUserProfile(req.user.id, options);
      
      res.status(200).json({
        success: true,
        data: {
          user: profile
        },
        message: 'Profile retrieved successfully'
      });
      
    } catch (error) {
      if (error.message.includes('not found')) {
        throw APIErrors.RESOURCE_NOT_FOUND('User', req.user.id);
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Update current user profile
   * PUT /api/users/profile
   */
  static updateProfile = asyncHandler(async (req, res) => {
    const { userData = {}, profileData = {} } = req.body;
    
    const userRepository = req.services.userRepository;
    if (!userRepository) {
      throw APIErrors.INTERNAL_ERROR('User service unavailable');
    }
    
    try {
      const updatedUser = await userRepository.updateUserProfile(
        req.user.id,
        userData,
        profileData
      );
      
      // Emit profile update event via Socket.IO
      if (req.io) {
        req.io.to(`user:${req.user.id}`).emit('profile_updated', {
          userId: req.user.id,
          updates: { ...userData, ...profileData }
        });
      }
      
      res.status(200).json({
        success: true,
        data: {
          user: updatedUser
        },
        message: 'Profile updated successfully'
      });
      
    } catch (error) {
      if (error.message.includes('Username already taken')) {
        throw APIErrors.RESOURCE_CONFLICT('Username', 'already exists');
      }
      
      if (error.message.includes('not found')) {
        throw APIErrors.RESOURCE_NOT_FOUND('User', req.user.id);
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Search users
   * GET /api/users/search
   */
  static searchUsers = asyncHandler(async (req, res) => {
    const searchParams = {
      query: req.query.query,
      username: req.query.username,
      walletAddress: req.query.walletAddress
    };
    
    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      offset: req.query.offset,
      includeClanInfo: req.query.includeClanInfo === 'true',
      orderBy: req.query.field ? [[req.query.field, req.query.order || 'desc']] : undefined
    };
    
    const userRepository = req.services.userRepository;
    if (!userRepository) {
      throw APIErrors.INTERNAL_ERROR('User service unavailable');
    }
    
    try {
      const results = await userRepository.searchUsers(searchParams, options);
      
      res.status(200).json({
        success: true,
        data: {
          users: results.users || results,
          pagination: {
            page: options.page,
            limit: options.limit,
            total: results.total,
            totalPages: Math.ceil((results.total || 0) / options.limit)
          }
        },
        message: 'User search completed successfully'
      });
      
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Get user leaderboard
   * GET /api/users/leaderboard
   */
  static getLeaderboard = asyncHandler(async (req, res) => {
    const { metric = 'reputation_score', limit = 50, offset = 0 } = req.query;
    
    const userRepository = req.services.userRepository;
    if (!userRepository) {
      throw APIErrors.INTERNAL_ERROR('User service unavailable');
    }
    
    try {
      const leaderboard = await userRepository.getLeaderboard(metric, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      // Add rank numbers to the results
      const rankedLeaderboard = leaderboard.map((user, index) => ({
        ...user,
        rank: parseInt(offset) + index + 1
      }));
      
      res.status(200).json({
        success: true,
        data: {
          leaderboard: rankedLeaderboard,
          metric,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: rankedLeaderboard.length
          }
        },
        message: 'Leaderboard retrieved successfully'
      });
      
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Get user dashboard data
   * GET /api/users/:id/dashboard
   */
  static getDashboard = asyncHandler(async (req, res) => {
    const { id: userId } = req.params;
    
    // Check if user can access this dashboard
    if (userId !== req.user.id && !req.user.roles?.includes('admin')) {
      throw APIErrors.INSUFFICIENT_PERMISSIONS(['admin'], req.user.roles || []);
    }
    
    const userRepository = req.services.userRepository;
    if (!userRepository) {
      throw APIErrors.INTERNAL_ERROR('User service unavailable');
    }
    
    try {
      const dashboard = await userRepository.getUserDashboard(userId);
      
      res.status(200).json({
        success: true,
        data: dashboard,
        message: 'Dashboard data retrieved successfully'
      });
      
    } catch (error) {
      if (error.message.includes('not found')) {
        throw APIErrors.RESOURCE_NOT_FOUND('User', userId);
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Get user achievements
   * GET /api/users/:id/achievements
   */
  static getAchievements = asyncHandler(async (req, res) => {
    const { id: userId } = req.params;
    const { includeProgress = 'true', includeStats = 'true' } = req.query;
    
    const userRepository = req.services.userRepository;
    if (!userRepository || !userRepository.achievementDAO) {
      throw APIErrors.INTERNAL_ERROR('Achievement service unavailable');
    }
    
    try {
      const achievementsData = {};
      
      if (includeProgress === 'true') {
        achievementsData.progress = await userRepository.achievementDAO.getUserProgress(userId);
      }
      
      if (includeStats === 'true') {
        achievementsData.stats = await userRepository.achievementDAO.getUserStats(userId);
      }
      
      // Get completed achievements
      const completedAchievements = await userRepository.achievementDAO.getCompletedAchievements(userId);
      achievementsData.completed = completedAchievements;
      
      res.status(200).json({
        success: true,
        data: {
          achievements: achievementsData
        },
        message: 'Achievements retrieved successfully'
      });
      
    } catch (error) {
      if (error.message.includes('not found')) {
        throw APIErrors.RESOURCE_NOT_FOUND('User', userId);
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Update user activity
   * POST /api/users/:id/activity
   */
  static updateActivity = asyncHandler(async (req, res) => {
    const { id: userId } = req.params;
    const { activityType, activityData } = req.body;
    
    // Check if user can update activity for this user
    if (userId !== req.user.id && !req.user.roles?.includes('admin')) {
      throw APIErrors.INSUFFICIENT_PERMISSIONS(['admin'], req.user.roles || []);
    }
    
    const userRepository = req.services.userRepository;
    if (!userRepository) {
      throw APIErrors.INTERNAL_ERROR('User service unavailable');
    }
    
    try {
      const updatedUser = await userRepository.updateUserActivity(
        userId,
        activityType,
        activityData
      );
      
      // Emit activity update via Socket.IO
      if (req.io) {
        req.io.to(`user:${userId}`).emit('activity_updated', {
          userId,
          activityType,
          activityData
        });
        
        // If it's an achievement, emit to user's clan members too
        if (activityType === 'achievement_earned' && activityData.clanId) {
          req.io.to(`clan:${activityData.clanId}`).emit('member_achievement', {
            userId,
            achievement: activityData.achievement
          });
        }
      }
      
      res.status(200).json({
        success: true,
        data: {
          user: updatedUser
        },
        message: 'Activity updated successfully'
      });
      
    } catch (error) {
      if (error.message.includes('Unknown activity type')) {
        throw APIErrors.VALIDATION_FAILED([{
          field: 'activityType',
          message: 'Invalid activity type',
          value: activityType
        }]);
      }
      
      if (error.message.includes('not found')) {
        throw APIErrors.RESOURCE_NOT_FOUND('User', userId);
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Get user statistics
   * GET /api/users/:id/stats
   */
  static getUserStats = asyncHandler(async (req, res) => {
    const { id: userId } = req.params;
    const { period = '30d' } = req.query;
    
    const userRepository = req.services.userRepository;
    if (!userRepository) {
      throw APIErrors.INTERNAL_ERROR('User service unavailable');
    }
    
    try {
      // Get basic user stats
      const userStats = await userRepository.userDAO.getUserStats(userId);
      
      // Get activity summary for the requested period
      const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 365;
      const activitySummary = await userRepository.userDAO.getUserActivitySummary(userId, {
        days: periodDays
      });
      
      // Get user rankings
      const rankings = await Promise.all([
        userRepository.userDAO.getUserRanking(userId, 'reputation_score'),
        userRepository.userDAO.getUserRanking(userId, 'total_votes_cast'),
        userRepository.userDAO.getUserRanking(userId, 'total_content_approved')
      ]);
      
      res.status(200).json({
        success: true,
        data: {
          stats: userStats,
          activity: activitySummary,
          rankings: {
            reputation: rankings[0],
            votes: rankings[1],
            content: rankings[2]
          },
          period
        },
        message: 'User statistics retrieved successfully'
      });
      
    } catch (error) {
      if (error.message.includes('not found')) {
        throw APIErrors.RESOURCE_NOT_FOUND('User', userId);
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Get user by wallet address
   * GET /api/users/wallet/:walletAddress
   */
  static getUserByWallet = asyncHandler(async (req, res) => {
    const { walletAddress } = req.params;
    
    const userRepository = req.services.userRepository;
    if (!userRepository) {
      throw APIErrors.INTERNAL_ERROR('User service unavailable');
    }
    
    try {
      const user = await userRepository.userDAO.findByWalletAddress(walletAddress);
      
      if (!user) {
        throw APIErrors.RESOURCE_NOT_FOUND('User', walletAddress);
      }
      
      // Return limited public information
      const publicUser = {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        reputationScore: user.reputation_score,
        createdAt: user.created_at,
        walletVerified: user.wallet_verified
      };
      
      res.status(200).json({
        success: true,
        data: {
          user: publicUser
        },
        message: 'User retrieved successfully'
      });
      
    } catch (error) {
      if (error.message.includes('not found')) {
        throw APIErrors.RESOURCE_NOT_FOUND('User', walletAddress);
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Get user's content activity
   * GET /api/users/:id/content
   */
  static getUserContent = asyncHandler(async (req, res) => {
    const { id: userId } = req.params;
    const { page = 1, limit = 20, status, contentType } = req.query;
    
    const userRepository = req.services.userRepository;
    const contentRepository = req.services.contentRepository;
    
    if (!userRepository || !contentRepository) {
      throw APIErrors.INTERNAL_ERROR('Required services unavailable');
    }
    
    try {
      const searchParams = {
        userId,
        status,
        contentType
      };
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        orderBy: [['created_at', 'desc']]
      };
      
      const content = await contentRepository.searchContent(searchParams, options);
      
      res.status(200).json({
        success: true,
        data: {
          content: content.content || content,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: content.total || 0,
            totalPages: Math.ceil((content.total || 0) / parseInt(limit))
          }
        },
        message: 'User content retrieved successfully'
      });
      
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
}

export default UserController;