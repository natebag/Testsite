/**
 * User Repository for MLG.clan Platform
 * 
 * Business logic layer for user management, authentication, and profile operations.
 * Orchestrates multiple DAOs and implements complex user workflows.
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

import { BaseRepository } from './BaseRepository.js';

export class UserRepository extends BaseRepository {
  constructor(options = {}) {
    super(options);
    
    this.userDAO = this.daos.user;
    this.achievementDAO = this.daos.achievement;
    this.transactionDAO = this.daos.transaction;
    
    this.setupValidators();
    this.setupBusinessRules();
  }

  setupValidators() {
    this.registerValidator('createUser', this.validateUserCreation.bind(this));
    this.registerValidator('updateProfile', this.validateProfileUpdate.bind(this));
  }

  setupBusinessRules() {
    this.registerBusinessRule('uniqueWallet', this.validateUniqueWallet.bind(this));
    this.registerBusinessRule('uniqueUsername', this.validateUniqueUsername.bind(this));
  }

  async validateUserCreation(context) {
    const { userData } = context;
    
    // Validate unique wallet
    await this.validateBusinessRule('uniqueWallet', userData.wallet_address);
    
    // Validate unique username if provided
    if (userData.username) {
      await this.validateBusinessRule('uniqueUsername', userData.username);
    }
  }

  async validateProfileUpdate(context) {
    const { userId, profileData } = context;
    
    // Validate username uniqueness if changing username
    if (profileData.username) {
      const existingUser = await this.userDAO.findByUsername(profileData.username);
      if (existingUser && existingUser.id !== userId) {
        throw new Error('Username already taken');
      }
    }
  }

  async validateUniqueWallet(walletAddress) {
    const existingUser = await this.userDAO.findByWalletAddress(walletAddress);
    if (existingUser) {
      throw new Error('Wallet address already registered');
    }
    return true;
  }

  async validateUniqueUsername(username) {
    const existingUser = await this.userDAO.findByUsername(username);
    if (existingUser) {
      throw new Error('Username already taken');
    }
    return true;
  }

  /**
   * Create new user with initial setup
   */
  async createUser(userData, profileData = {}) {
    return await this.executeOperation('createUser', async () => {
      return await this.executeTransaction(async (txDAO) => {
        // Create user with profile
        const user = await this.userDAO.createUserWithProfile(userData, profileData);
        
        // Initialize user achievements
        if (this.achievementDAO) {
          await this.initializeUserAchievements(user.id);
        }
        
        // Track user creation event
        if (this.eventEmitter) {
          this.eventEmitter.emit('user:created', {
            user,
            hasProfile: Object.keys(profileData).length > 0
          });
        }
        
        return user;
      });
    }, { userData, profileData });
  }

  /**
   * Initialize achievement tracking for new user
   */
  async initializeUserAchievements(userId) {
    try {
      const achievements = await this.achievementDAO.getActiveAchievements();
      
      // Initialize progress for all active achievements
      for (const achievement of achievements) {
        await this.achievementDAO.updateProgress(userId, achievement.id, {});
      }
    } catch (error) {
      this.logger.warn('Failed to initialize user achievements:', error);
    }
  }

  /**
   * Get comprehensive user profile
   */
  async getUserProfile(userId, options = {}) {
    return await this.executeOperation('getUserProfile', async () => {
      const user = await this.userDAO.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get additional data if requested
      const profile = { ...user };
      
      if (options.includeStats) {
        const activitySummary = await this.userDAO.getUserActivitySummary(userId);
        profile.activity = activitySummary;
      }
      
      if (options.includeAchievements && this.achievementDAO) {
        const achievements = await this.achievementDAO.getUserProgress(userId);
        const achievementStats = await this.achievementDAO.getUserStats(userId);
        profile.achievements = {
          progress: achievements,
          stats: achievementStats
        };
      }
      
      if (options.includeRankings) {
        const rankings = await Promise.all([
          this.userDAO.getUserRanking(userId, 'reputation_score'),
          this.userDAO.getUserRanking(userId, 'total_votes_cast'),
          this.userDAO.getUserRanking(userId, 'total_content_approved')
        ]);
        
        profile.rankings = {
          reputation: rankings[0],
          votes: rankings[1],
          content: rankings[2]
        };
      }
      
      return profile;
    }, { userId, options });
  }

  /**
   * Update user profile with validation
   */
  async updateUserProfile(userId, userData = {}, profileData = {}) {
    return await this.executeOperation('updateProfile', async () => {
      return await this.executeTransaction(async (txDAO) => {
        let updatedUser = null;
        
        // Update user data if provided
        if (Object.keys(userData).length > 0) {
          updatedUser = await this.userDAO.update(userId, userData);
        }
        
        // Update profile data if provided
        if (Object.keys(profileData).length > 0) {
          updatedUser = await this.userDAO.updateProfile(userId, profileData);
        }
        
        // Get final user state
        if (!updatedUser) {
          updatedUser = await this.userDAO.findById(userId);
        }
        
        return updatedUser;
      });
    }, { userId, userData, profileData });
  }

  /**
   * Search users with advanced filtering
   */
  async searchUsers(searchParams, options = {}) {
    return await this.executeOperation('searchUsers', async () => {
      const results = await this.userDAO.searchUsers(searchParams, options);
      
      // Enrich results with additional data if needed
      if (options.includeClanInfo) {
        // Add clan membership info to each user
        // This would require clan DAO integration
      }
      
      return results;
    }, { searchParams, options });
  }

  /**
   * Get user leaderboard
   */
  async getLeaderboard(metric = 'reputation_score', options = {}) {
    return await this.executeOperation('getLeaderboard', async () => {
      const { limit = 50, offset = 0 } = options;
      
      const leaderboard = await this.userDAO.findMany({
        conditions: {
          status: 'active',
          [metric]: { operator: '>', value: 0 }
        },
        orderBy: [[metric, 'DESC']],
        limit,
        offset,
        fields: [
          'id', 'username', 'wallet_address', 'reputation_score',
          'total_votes_cast', 'total_content_approved', 'created_at'
        ]
      });
      
      return leaderboard;
    }, { metric, options });
  }

  /**
   * Update user statistics after activities
   */
  async updateUserActivity(userId, activityType, activityData = {}) {
    return await this.executeOperation('updateActivity', async () => {
      const updates = {};
      
      switch (activityType) {
        case 'vote_cast':
          updates.total_votes_cast = { operator: '+', value: 1 };
          if (activityData.mlgBurned) {
            updates.total_mlg_burned = { operator: '+', value: activityData.mlgBurned };
          }
          break;
          
        case 'content_submitted':
          updates.total_content_submitted = { operator: '+', value: 1 };
          break;
          
        case 'content_approved':
          updates.total_content_approved = { operator: '+', value: 1 };
          updates.reputation_score = { operator: '+', value: 5 };
          break;
          
        case 'achievement_earned':
          if (activityData.reputationReward) {
            updates.reputation_score = { operator: '+', value: activityData.reputationReward };
          }
          break;
          
        default:
          throw new Error(`Unknown activity type: ${activityType}`);
      }
      
      // Convert operators to actual values for the DAO
      const statsUpdate = {};
      for (const [key, value] of Object.entries(updates)) {
        if (typeof value === 'object' && value.operator) {
          // This would need to be handled by a more sophisticated DAO update method
          // For now, we'll just handle basic increments
          if (value.operator === '+') {
            const currentUser = await this.userDAO.findById(userId);
            statsUpdate[key] = (currentUser[key] || 0) + value.value;
          }
        } else {
          statsUpdate[key] = value;
        }
      }
      
      const updatedUser = await this.userDAO.updateUserStats(userId, statsUpdate);
      
      // Check for achievements that might be completed
      if (this.achievementDAO) {
        await this.checkAndUpdateAchievements(userId, activityType, activityData);
      }
      
      return updatedUser;
    }, { userId, activityType, activityData });
  }

  /**
   * Check and update achievements based on activity
   */
  async checkAndUpdateAchievements(userId, activityType, activityData) {
    try {
      const activeAchievements = await this.achievementDAO.getActiveAchievements({
        type: this.getAchievementTypeForActivity(activityType)
      });
      
      for (const achievement of activeAchievements) {
        const progressData = this.calculateAchievementProgress(activityType, activityData);
        if (progressData) {
          await this.achievementDAO.updateProgress(userId, achievement.id, progressData);
        }
      }
    } catch (error) {
      this.logger.warn('Failed to update achievements:', error);
    }
  }

  getAchievementTypeForActivity(activityType) {
    const mapping = {
      'vote_cast': 'voting',
      'content_submitted': 'content',
      'content_approved': 'content',
      'clan_joined': 'clan',
      'friend_added': 'social'
    };
    
    return mapping[activityType] || null;
  }

  calculateAchievementProgress(activityType, activityData) {
    // This would contain logic to map activity to achievement progress
    switch (activityType) {
      case 'vote_cast':
        return { votes_cast: 1 };
      case 'content_submitted':
        return { content_submitted: 1 };
      case 'content_approved':
        return { content_approved: 1 };
      default:
        return null;
    }
  }

  /**
   * Get user dashboard data
   */
  async getUserDashboard(userId) {
    return await this.executeOperation('getUserDashboard', async () => {
      const [
        user,
        activitySummary,
        achievementStats
      ] = await Promise.all([
        this.userDAO.findById(userId),
        this.userDAO.getUserActivitySummary(userId, { days: 7 }),
        this.achievementDAO ? this.achievementDAO.getUserStats(userId) : null
      ]);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return {
        user,
        activity: activitySummary,
        achievements: achievementStats,
        timestamp: new Date()
      };
    }, { userId });
  }

  async updateAnalytics(operationName, result, context) {
    // Track user-specific analytics
    if (this.metrics) {
      this.metrics.recordUserOperation(operationName, context.userId || context.userData?.id);
    }
  }
}

export default UserRepository;