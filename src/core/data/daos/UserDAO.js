/**
 * User Data Access Object (DAO) for MLG.clan Platform
 * 
 * Handles all database operations related to users, profiles, sessions,
 * and wallet management with comprehensive validation and caching.
 * 
 * Features:
 * - User CRUD operations with wallet integration
 * - Profile management and customization
 * - Session tracking and management
 * - Authentication data handling
 * - Performance statistics and reputation
 * - Privacy and visibility controls
 * - Social features and connections
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

import Joi from 'joi';
import { BaseDAO } from './BaseDAO.js';
import { MLGUsernameTaggingService } from '../../auth/mlg-username-tagging-service.js';

/**
 * Validation schemas for user operations
 */
const USER_SCHEMAS = {
  create: Joi.object({
    wallet_address: Joi.string().length(44).pattern(/^[A-Za-z0-9]+$/).required(),
    username: Joi.string().min(3).max(32).pattern(/^[a-zA-Z0-9_-]+$/).optional(),
    email: Joi.string().email().optional(),
    verification_signature: Joi.string().required(),
    verification_message: Joi.string().required(),
    status: Joi.string().valid('active', 'inactive', 'banned', 'suspended').default('active')
  }),

  update: Joi.object({
    username: Joi.string().min(3).max(32).pattern(/^[a-zA-Z0-9_-]+$/).optional(),
    email: Joi.string().email().optional(),
    email_notifications: Joi.boolean().optional(),
    profile_visibility: Joi.string().valid('public', 'friends', 'private').optional(),
    status: Joi.string().valid('active', 'inactive', 'banned', 'suspended').optional(),
    last_login: Joi.date().optional()
  }),

  profile: Joi.object({
    display_name: Joi.string().min(1).max(50).optional(),
    bio: Joi.string().max(500).optional(),
    avatar_url: Joi.string().uri().optional(),
    banner_url: Joi.string().uri().optional(),
    location: Joi.string().max(100).optional(),
    website_url: Joi.string().uri().optional(),
    social_links: Joi.object().optional(),
    gaming_stats: Joi.object().optional()
  })
};

/**
 * User DAO class extending BaseDAO
 */
export class UserDAO extends BaseDAO {
  constructor(options = {}) {
    super({
      tableName: 'users',
      primaryKey: 'id',
      createSchema: USER_SCHEMAS.create,
      updateSchema: USER_SCHEMAS.update,
      cacheEnabled: true,
      cacheTTL: 600, // 10 minutes for user data
      cacheKeyPrefix: 'user',
      ...options
    });

    this.profileSchema = USER_SCHEMAS.profile;
    
    // Initialize MLG tagging service
    this.mlgTaggingService = new MLGUsernameTaggingService({
      db: this.db,
      cache: this.redis,
      logger: this.logger
    });
    
    // Initialize tagging service
    this.initializeMLGTagging();
  }

  /**
   * Initialize MLG tagging service
   */
  async initializeMLGTagging() {
    try {
      await this.mlgTaggingService.initialize();
      this.logger.info('🏷️ MLG tagging service integrated with UserDAO');
    } catch (error) {
      this.logger.error('❌ Failed to initialize MLG tagging service:', error);
    }
  }

  /**
   * Get display username with MLG tagging
   * @param {string} userId - User ID
   * @param {string} username - Original username
   * @param {Object} options - Display options
   * @returns {Promise<string>} Display username with MLG tag if applicable
   */
  async getDisplayUsername(userId, username, options = {}) {
    try {
      return await this.mlgTaggingService.getDisplayUsername(userId, username, options);
    } catch (error) {
      this.logger.error('❌ Error getting display username:', error);
      return username;
    }
  }

  /**
   * Find user by wallet address
   * @param {string} walletAddress - Solana wallet address
   * @param {Object} options - Query options
   * @returns {Promise<Object>} User record with profile
   */
  async findByWalletAddress(walletAddress, options = {}) {
    const startTime = Date.now();
    const cacheKey = `${this.cacheKeyPrefix}:wallet:${walletAddress}`;
    
    try {
      // Check cache first
      if (this.cacheEnabled && this.redis) {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          this.cacheHits++;
          return JSON.parse(cached);
        }
        this.cacheMisses++;
      }

      const query = `
        SELECT 
          u.*,
          up.display_name,
          up.bio,
          up.avatar_url,
          up.banner_url,
          up.location,
          up.website_url,
          up.social_links,
          up.gaming_stats,
          up.updated_at as profile_updated_at
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.wallet_address = $1
          ${options.includeInactive ? '' : "AND u.status = 'active'"}
      `;

      const result = await this.executeQuery(query, [walletAddress]);
      const user = result.rows[0] || null;

      // Cache the result
      if (user && this.cacheEnabled && this.redis) {
        await this.redis.setEx(cacheKey, this.cacheTTL, JSON.stringify(user));
      }

      this.trackQueryPerformance(startTime, 'findByWalletAddress');
      return user;

    } catch (error) {
      this.handleError('findByWalletAddress', error, { walletAddress, options });
      throw error;
    }
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @param {Object} options - Query options
   * @returns {Promise<Object>} User record
   */
  async findByUsername(username, options = {}) {
    const startTime = Date.now();
    
    try {
      const query = `
        SELECT 
          u.*,
          up.display_name,
          up.bio,
          up.avatar_url,
          up.banner_url
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE LOWER(u.username) = LOWER($1)
          ${options.includeInactive ? '' : "AND u.status = 'active'"}
      `;

      const result = await this.executeQuery(query, [username]);
      const user = result.rows[0] || null;

      this.trackQueryPerformance(startTime, 'findByUsername');
      return user;

    } catch (error) {
      this.handleError('findByUsername', error, { username, options });
      throw error;
    }
  }

  /**
   * Create new user with profile
   * @param {Object} userData - User data
   * @param {Object} profileData - Profile data
   * @returns {Promise<Object>} Created user with profile
   */
  async createUserWithProfile(userData, profileData = {}) {
    const startTime = Date.now();
    
    try {
      return await this.executeTransaction(async (txDAO) => {
        // Create user record
        const user = await txDAO.create(userData);
        
        // Create user profile
        const profileCreateData = {
          user_id: user.id,
          ...profileData
        };
        
        // Validate profile data
        if (this.profileSchema) {
          const { error, value } = this.profileSchema.validate(profileData);
          if (error) {
            throw new Error(`Profile validation error: ${error.message}`);
          }
          Object.assign(profileCreateData, value);
        }

        const profileQuery = `
          INSERT INTO user_profiles (
            user_id, display_name, bio, avatar_url, banner_url, 
            location, website_url, social_links, gaming_stats
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `;
        
        const profileValues = [
          user.id,
          profileCreateData.display_name || null,
          profileCreateData.bio || null,
          profileCreateData.avatar_url || null,
          profileCreateData.banner_url || null,
          profileCreateData.location || null,
          profileCreateData.website_url || null,
          JSON.stringify(profileCreateData.social_links || {}),
          JSON.stringify(profileCreateData.gaming_stats || {})
        ];

        const profileResult = await txDAO.executeQuery(profileQuery, profileValues);
        const profile = profileResult.rows[0];

        // Combine user and profile data
        const userWithProfile = {
          ...user,
          display_name: profile.display_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          banner_url: profile.banner_url,
          location: profile.location,
          website_url: profile.website_url,
          social_links: profile.social_links,
          gaming_stats: profile.gaming_stats,
          profile_updated_at: profile.updated_at
        };

        // Cache the created user
        if (this.cacheEnabled && this.redis) {
          const cacheKey = `${this.cacheKeyPrefix}:${user.id}`;
          const walletCacheKey = `${this.cacheKeyPrefix}:wallet:${user.wallet_address}`;
          
          await Promise.all([
            this.redis.setEx(cacheKey, this.cacheTTL, JSON.stringify(userWithProfile)),
            this.redis.setEx(walletCacheKey, this.cacheTTL, JSON.stringify(userWithProfile))
          ]);
        }

        this.trackQueryPerformance(startTime, 'createUserWithProfile');
        this.emitEvent('user_created', userWithProfile);
        
        return userWithProfile;
      });

    } catch (error) {
      this.handleError('createUserWithProfile', error, { userData, profileData });
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated user with profile
   */
  async updateProfile(userId, profileData) {
    const startTime = Date.now();
    
    try {
      // Validate profile data
      if (this.profileSchema) {
        const { error, value } = this.profileSchema.validate(profileData);
        if (error) {
          throw new Error(`Profile validation error: ${error.message}`);
        }
        profileData = value;
      }

      // Build update query for user_profiles
      const fields = Object.keys(profileData);
      if (fields.length === 0) {
        throw new Error('No profile data provided to update');
      }

      // Handle JSON fields
      const processedData = { ...profileData };
      if (processedData.social_links && typeof processedData.social_links === 'object') {
        processedData.social_links = JSON.stringify(processedData.social_links);
      }
      if (processedData.gaming_stats && typeof processedData.gaming_stats === 'object') {
        processedData.gaming_stats = JSON.stringify(processedData.gaming_stats);
      }

      const values = Object.values(processedData);
      const setClause = fields.map((field, index) => 
        `${field} = $${index + 1}`
      ).join(', ');

      const query = `
        UPDATE user_profiles 
        SET ${setClause}, updated_at = NOW()
        WHERE user_id = $${fields.length + 1}
        RETURNING *
      `;

      const result = await this.executeQuery(query, [...values, userId]);
      
      if (result.rows.length === 0) {
        throw new Error(`Profile for user ${userId} not found`);
      }

      // Get updated user with profile
      const userWithProfile = await this.findById(userId);

      // Update cache
      if (this.cacheEnabled && this.redis && userWithProfile) {
        const cacheKey = `${this.cacheKeyPrefix}:${userId}`;
        const walletCacheKey = `${this.cacheKeyPrefix}:wallet:${userWithProfile.wallet_address}`;
        
        await Promise.all([
          this.redis.setEx(cacheKey, this.cacheTTL, JSON.stringify(userWithProfile)),
          this.redis.setEx(walletCacheKey, this.cacheTTL, JSON.stringify(userWithProfile))
        ]);
      }

      this.trackQueryPerformance(startTime, 'updateProfile');
      this.emitEvent('profile_updated', userWithProfile, profileData);
      
      return userWithProfile;

    } catch (error) {
      this.handleError('updateProfile', error, { userId, profileData });
      throw error;
    }
  }

  /**
   * Update user statistics and counters
   * @param {string} userId - User ID
   * @param {Object} stats - Statistics to update
   * @returns {Promise<Object>} Updated user
   */
  async updateUserStats(userId, stats) {
    const startTime = Date.now();
    
    try {
      const validStats = [
        'total_votes_cast', 'total_mlg_burned', 'reputation_score',
        'total_content_submitted', 'total_content_approved',
        'consecutive_days_voted', 'daily_vote_count'
      ];

      const updateFields = {};
      for (const [key, value] of Object.entries(stats)) {
        if (validStats.includes(key) && typeof value === 'number') {
          updateFields[key] = value;
        }
      }

      if (Object.keys(updateFields).length === 0) {
        throw new Error('No valid statistics provided to update');
      }

      const fields = Object.keys(updateFields);
      const values = Object.values(updateFields);
      const setClause = fields.map((field, index) => 
        `${field} = $${index + 1}`
      ).join(', ');

      const query = `
        UPDATE users 
        SET ${setClause}, updated_at = NOW()
        WHERE id = $${fields.length + 1} AND status = 'active'
        RETURNING *
      `;

      const result = await this.executeQuery(query, [...values, userId]);
      
      if (result.rows.length === 0) {
        throw new Error(`User ${userId} not found or inactive`);
      }

      const user = result.rows[0];

      // Invalidate cache
      if (this.cacheEnabled && this.redis) {
        await this.invalidateCache(userId);
        await this.redis.del(`${this.cacheKeyPrefix}:wallet:${user.wallet_address}`);
      }

      this.trackQueryPerformance(startTime, 'updateUserStats');
      this.emitEvent('stats_updated', user, updateFields);
      
      return user;

    } catch (error) {
      this.handleError('updateUserStats', error, { userId, stats });
      throw error;
    }
  }

  /**
   * Get user activity summary
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Activity summary
   */
  async getUserActivitySummary(userId, options = {}) {
    const startTime = Date.now();
    const { days = 30 } = options;
    
    try {
      const query = `
        SELECT 
          u.id,
          u.wallet_address,
          u.username,
          u.total_votes_cast,
          u.total_mlg_burned,
          u.reputation_score,
          u.total_content_submitted,
          u.total_content_approved,
          u.consecutive_days_voted,
          u.created_at as joined_date,
          u.last_login,
          
          -- Recent activity counts
          (SELECT COUNT(*) FROM content_votes cv WHERE cv.user_id = u.id 
           AND cv.created_at > NOW() - INTERVAL '${days} days') as recent_votes,
          
          (SELECT COUNT(*) FROM content_submissions cs WHERE cs.user_id = u.id 
           AND cs.created_at > NOW() - INTERVAL '${days} days') as recent_submissions,
          
          (SELECT COUNT(*) FROM clan_members cm WHERE cm.user_id = u.id 
           AND cm.is_active = true) as active_clan_memberships,
          
          (SELECT COUNT(*) FROM achievement_progress ap WHERE ap.user_id = u.id 
           AND ap.is_completed = true) as achievements_earned,
          
          -- Latest activity
          (SELECT MAX(created_at) FROM content_votes cv WHERE cv.user_id = u.id) as last_vote,
          (SELECT MAX(created_at) FROM content_submissions cs WHERE cs.user_id = u.id) as last_submission
          
        FROM users u
        WHERE u.id = $1 AND u.status = 'active'
      `;

      const result = await this.executeQuery(query, [userId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const activity = result.rows[0];
      
      // Convert counts to numbers
      activity.recent_votes = parseInt(activity.recent_votes) || 0;
      activity.recent_submissions = parseInt(activity.recent_submissions) || 0;
      activity.active_clan_memberships = parseInt(activity.active_clan_memberships) || 0;
      activity.achievements_earned = parseInt(activity.achievements_earned) || 0;

      this.trackQueryPerformance(startTime, 'getUserActivitySummary');
      return activity;

    } catch (error) {
      this.handleError('getUserActivitySummary', error, { userId, options });
      throw error;
    }
  }

  /**
   * Find users with similar interests
   * @param {string} userId - User ID
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Similar users
   */
  async findSimilarUsers(userId, options = {}) {
    const startTime = Date.now();
    const { limit = 10, minSharedClans = 1 } = options;
    
    try {
      const query = `
        WITH user_clans AS (
          SELECT clan_id FROM clan_members 
          WHERE user_id = $1 AND is_active = true
        ),
        similar_users AS (
          SELECT 
            u.id,
            u.username,
            up.display_name,
            up.avatar_url,
            u.reputation_score,
            COUNT(DISTINCT cm.clan_id) as shared_clans,
            CASE 
              WHEN u.total_votes_cast > 0 THEN 
                ABS(u.total_votes_cast - (SELECT total_votes_cast FROM users WHERE id = $1)) 
              ELSE 999999 
            END as vote_similarity
          FROM users u
          LEFT JOIN user_profiles up ON u.id = up.user_id
          JOIN clan_members cm ON u.id = cm.user_id AND cm.is_active = true
          JOIN user_clans uc ON cm.clan_id = uc.clan_id
          WHERE u.id != $1 
            AND u.status = 'active'
            AND u.profile_visibility = 'public'
          GROUP BY u.id, u.username, up.display_name, up.avatar_url, u.reputation_score, u.total_votes_cast
          HAVING COUNT(DISTINCT cm.clan_id) >= $3
        )
        SELECT *
        FROM similar_users
        ORDER BY shared_clans DESC, vote_similarity ASC
        LIMIT $2
      `;

      const result = await this.executeQuery(query, [userId, limit, minSharedClans]);

      this.trackQueryPerformance(startTime, 'findSimilarUsers');
      return result.rows;

    } catch (error) {
      this.handleError('findSimilarUsers', error, { userId, options });
      throw error;
    }
  }

  /**
   * Get user leaderboard position
   * @param {string} userId - User ID
   * @param {string} metric - Metric to rank by
   * @returns {Promise<Object>} Ranking information
   */
  async getUserRanking(userId, metric = 'reputation_score') {
    const startTime = Date.now();
    
    try {
      const validMetrics = [
        'reputation_score', 'total_votes_cast', 'total_mlg_burned',
        'total_content_approved'
      ];
      
      if (!validMetrics.includes(metric)) {
        throw new Error(`Invalid ranking metric: ${metric}`);
      }

      const query = `
        WITH ranked_users AS (
          SELECT 
            id,
            ${metric},
            ROW_NUMBER() OVER (ORDER BY ${metric} DESC, created_at ASC) as rank
          FROM users
          WHERE status = 'active' AND ${metric} > 0
        )
        SELECT 
          rank,
          ${metric} as score,
          (SELECT COUNT(*) FROM users WHERE status = 'active' AND ${metric} > 0) as total_users
        FROM ranked_users
        WHERE id = $1
      `;

      const result = await this.executeQuery(query, [userId]);
      
      if (result.rows.length === 0) {
        return { rank: null, score: 0, total_users: 0, percentile: 0 };
      }

      const ranking = result.rows[0];
      ranking.rank = parseInt(ranking.rank);
      ranking.total_users = parseInt(ranking.total_users);
      ranking.percentile = ranking.total_users > 0 
        ? ((ranking.total_users - ranking.rank + 1) / ranking.total_users) * 100 
        : 0;

      this.trackQueryPerformance(startTime, 'getUserRanking');
      return ranking;

    } catch (error) {
      this.handleError('getUserRanking', error, { userId, metric });
      throw error;
    }
  }

  /**
   * Search users by various criteria
   * @param {Object} searchParams - Search parameters
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Search results
   */
  async searchUsers(searchParams, options = {}) {
    const startTime = Date.now();
    const { limit = 25, offset = 0 } = options;
    
    try {
      let whereConditions = ["u.status = 'active'"];
      const params = [];
      let paramIndex = 1;

      // Username search
      if (searchParams.username) {
        whereConditions.push(`u.username ILIKE $${paramIndex}`);
        params.push(`%${searchParams.username}%`);
        paramIndex++;
      }

      // Display name search
      if (searchParams.displayName) {
        whereConditions.push(`up.display_name ILIKE $${paramIndex}`);
        params.push(`%${searchParams.displayName}%`);
        paramIndex++;
      }

      // Reputation range
      if (searchParams.minReputation) {
        whereConditions.push(`u.reputation_score >= $${paramIndex}`);
        params.push(searchParams.minReputation);
        paramIndex++;
      }

      // Location search
      if (searchParams.location) {
        whereConditions.push(`up.location ILIKE $${paramIndex}`);
        params.push(`%${searchParams.location}%`);
        paramIndex++;
      }

      // Only public profiles
      if (!searchParams.includePrivate) {
        whereConditions.push(`u.profile_visibility = 'public'`);
      }

      const query = `
        SELECT 
          u.id,
          u.wallet_address,
          u.username,
          u.reputation_score,
          u.total_votes_cast,
          u.total_content_approved,
          u.created_at,
          up.display_name,
          up.avatar_url,
          up.location,
          up.bio,
          (SELECT COUNT(*) FROM clan_members cm WHERE cm.user_id = u.id AND cm.is_active = true) as clan_count
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY u.reputation_score DESC, u.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      const result = await this.executeQuery(query, params);

      // Apply MLG tagging to search results
      if (this.mlgTaggingService) {
        for (const user of result.rows) {
          const displayUsername = await this.getDisplayUsername(
            user.id, 
            user.display_name || user.username, 
            { source: 'search_results' }
          );
          user.mlg_display_name = displayUsername;
          user.is_clan_member = displayUsername !== (user.display_name || user.username);
        }
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE ${whereConditions.join(' AND ')}
      `;

      const countResult = await this.executeQuery(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      this.trackQueryPerformance(startTime, 'searchUsers');

      return {
        users: result.rows,
        pagination: {
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit),
          currentPage: Math.floor(offset / limit) + 1
        }
      };

    } catch (error) {
      this.handleError('searchUsers', error, { searchParams, options });
      throw error;
    }
  }

  /**
   * Override findById to include profile data
   */
  async findById(id, options = {}) {
    const startTime = Date.now();
    const cacheKey = `${this.cacheKeyPrefix}:${id}`;
    
    try {
      // Check cache first
      if (this.cacheEnabled && this.redis) {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          this.cacheHits++;
          return JSON.parse(cached);
        }
        this.cacheMisses++;
      }

      const query = `
        SELECT 
          u.*,
          up.display_name,
          up.bio,
          up.avatar_url,
          up.banner_url,
          up.location,
          up.website_url,
          up.social_links,
          up.gaming_stats,
          up.updated_at as profile_updated_at
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id = $1
          ${options.includeInactive ? '' : "AND u.status = 'active'"}
      `;

      const result = await this.executeQuery(query, [id]);
      let user = result.rows[0] || null;

      // Apply MLG tagging to display name if user exists
      if (user && this.mlgTaggingService) {
        const displayUsername = await this.getDisplayUsername(
          user.id, 
          user.display_name || user.username, 
          { source: 'profile_lookup' }
        );
        user.mlg_display_name = displayUsername;
        user.is_clan_member = displayUsername !== (user.display_name || user.username);
      }

      // Cache the result
      if (user && this.cacheEnabled && this.redis) {
        await this.redis.setEx(cacheKey, this.cacheTTL, JSON.stringify(user));
      }

      this.trackQueryPerformance(startTime, 'findById');
      return user;

    } catch (error) {
      this.handleError('findById', error, { id, options });
      throw error;
    }
  }

  /**
   * Invalidate user cache including wallet address cache
   */
  async invalidateCache(id) {
    if (!this.redis) return;
    
    try {
      // Get user data first to clear wallet cache
      const user = await super.findById(id, { includeInactive: true });
      
      const cacheKeys = [
        `${this.cacheKeyPrefix}:${id}`
      ];
      
      if (user && user.wallet_address) {
        cacheKeys.push(`${this.cacheKeyPrefix}:wallet:${user.wallet_address}`);
      }
      
      if (user && user.username) {
        cacheKeys.push(`${this.cacheKeyPrefix}:username:${user.username}`);
      }
      
      await this.redis.del(...cacheKeys);
      
    } catch (error) {
      this.logger.warn('Failed to invalidate user cache:', error);
    }
  }
}

export default UserDAO;