/**
 * Cached User Repository for MLG.clan Platform
 * 
 * Enhanced user repository with comprehensive caching integration.
 * Extends the base UserRepository with intelligent caching strategies,
 * real-time cache invalidation, and performance optimization.
 * 
 * Features:
 * - Seamless cache integration with existing repository methods
 * - Intelligent cache warming and invalidation
 * - Real-time user data updates
 * - Performance monitoring and optimization
 * - Fallback mechanisms for cache failures
 * - User-specific cache strategies
 * 
 * @author Claude Code - Performance Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { UserRepository } from './UserRepository.js';
import { getUserCache } from '../cache/strategies/userCache.js';
import { getQueryOptimizer } from '../performance/queryOptimizer.js';

export class CachedUserRepository extends UserRepository {
  constructor(options = {}) {
    super(options);
    
    this.userCache = getUserCache(options.cacheConfig);
    this.queryOptimizer = getQueryOptimizer(options.dbConfig);
    
    this.cacheConfig = {
      enableCaching: options.enableCaching !== false,
      enableWriteThrough: options.enableWriteThrough !== false,
      enableCacheWarming: options.enableCacheWarming !== false,
      warmingBatchSize: options.warmingBatchSize || 50,
      
      // Cache TTL overrides
      profileTTL: options.profileTTL || 3600,
      statsTTL: options.statsTTL || 1800,
      sessionTTL: options.sessionTTL || 3600,
      
      ...options.cacheConfig
    };
    
    this.setupCacheEventHandlers();
  }

  setupCacheEventHandlers() {
    // Listen for user events to invalidate cache
    if (this.eventEmitter) {
      this.eventEmitter.on('user:created', async (data) => {
        await this.handleUserCreated(data);
      });
      
      this.eventEmitter.on('user:updated', async (data) => {
        await this.handleUserUpdated(data);
      });
      
      this.eventEmitter.on('user:deleted', async (data) => {
        await this.handleUserDeleted(data);
      });
    }
  }

  /**
   * Create new user with cache integration
   */
  async createUser(userData, profileData = {}) {
    return await this.executeOperation('createUser', async () => {
      // Use parent method for creation
      const user = await super.createUser(userData, profileData);
      
      // Cache the new user immediately if write-through enabled
      if (this.cacheConfig.enableWriteThrough) {
        await this.cacheUserData(user);
      }
      
      return user;
    }, { userData, profileData });
  }

  /**
   * Get comprehensive user profile with caching
   */
  async getUserProfile(userId, options = {}) {
    return await this.executeOperation('getUserProfile', async () => {
      // Try cache first if enabled
      if (this.cacheConfig.enableCaching && !options.skipCache) {
        const cachedProfile = await this.userCache.getUserProfile(userId);
        if (cachedProfile) {
          return this.enrichCachedProfile(cachedProfile, options);
        }
      }
      
      // Cache miss - get from database with optimized query
      const profile = await super.getUserProfile(userId, options);
      
      if (profile && this.cacheConfig.enableCaching) {
        // Cache the profile
        await this.userCache.cacheUserProfile(userId, profile);
        
        // Cache additional data if requested
        if (options.includeStats && profile.activity) {
          await this.userCache.cacheUserStats(userId, profile.activity);
        }
        
        if (options.includeAchievements && profile.achievements) {
          await this.userCache.cacheUserAchievements(userId, profile.achievements);
        }
      }
      
      return profile;
    }, { userId, options });
  }

  /**
   * Update user profile with cache invalidation
   */
  async updateUserProfile(userId, userData = {}, profileData = {}) {
    return await this.executeOperation('updateProfile', async () => {
      // Update in database first
      const updatedUser = await super.updateUserProfile(userId, userData, profileData);
      
      if (updatedUser) {
        // Invalidate existing cache
        await this.userCache.invalidateUserCache(userId);
        
        // Cache updated data if write-through enabled
        if (this.cacheConfig.enableWriteThrough) {
          await this.cacheUserData(updatedUser);
        }
        
        // Handle username/wallet changes for search cache
        if (userData.username || userData.wallet_address) {
          await this.handleSearchCacheInvalidation(userId, userData);
        }
      }
      
      return updatedUser;
    }, { userId, userData, profileData });
  }

  /**
   * Search users with intelligent caching
   */
  async searchUsers(searchParams, options = {}) {
    return await this.executeOperation('searchUsers', async () => {
      const cacheKey = this.generateSearchCacheKey(searchParams, options);
      
      // Try cache first for stable searches
      if (this.cacheConfig.enableCaching && !options.skipCache && this.isSearchCacheable(searchParams)) {
        const cachedResults = await this.userCache.batchGetUserSummaries([]); // Would need search results cache
        // Search cache implementation would go here
      }
      
      // Use optimized query
      const results = await super.searchUsers(searchParams, options);
      
      // Cache individual user summaries from search results
      if (results && results.length > 0 && this.cacheConfig.enableCaching) {
        await this.cacheSearchResults(results);
      }
      
      return results;
    }, { searchParams, options });
  }

  /**
   * Get user leaderboard with caching
   */
  async getLeaderboard(metric = 'reputation_score', options = {}) {
    return await this.executeOperation('getLeaderboard', async () => {
      // Check cache first
      if (this.cacheConfig.enableCaching && !options.skipCache) {
        const cachedLeaderboard = await this.userCache.batchGetUserSummaries([]); // Leaderboard cache
        // Implementation would check leaderboard cache
      }
      
      // Use optimized query for leaderboard
      const leaderboard = await this.getOptimizedLeaderboard(metric, options);
      
      // Cache leaderboard results
      if (leaderboard && this.cacheConfig.enableCaching) {
        await this.userCache.cacheLeaderboard(metric, leaderboard);
      }
      
      return leaderboard;
    }, { metric, options });
  }

  /**
   * Update user activity with real-time cache updates
   */
  async updateUserActivity(userId, activityType, activityData = {}) {
    return await this.executeOperation('updateActivity', async () => {
      // Update in database
      const updatedUser = await super.updateUserActivity(userId, activityType, activityData);
      
      if (updatedUser) {
        // Update cache in real-time for frequently changing stats
        await this.updateUserStatsCache(userId, activityType, activityData);
        
        // Invalidate leaderboard cache if this affects rankings
        if (this.affectsRankings(activityType)) {
          await this.invalidateRankingCaches(userId);
        }
      }
      
      return updatedUser;
    }, { userId, activityType, activityData });
  }

  /**
   * Get user dashboard with cache optimization
   */
  async getUserDashboard(userId) {
    return await this.executeOperation('getUserDashboard', async () => {
      // Try to get components from cache
      const cachedComponents = await this.getCachedDashboardComponents(userId);
      
      if (this.isDashboardCacheComplete(cachedComponents)) {
        return this.buildDashboardFromCache(cachedComponents);
      }
      
      // Partial or no cache - get missing data
      const dashboard = await this.buildDashboardWithCache(userId, cachedComponents);
      
      return dashboard;
    }, { userId });
  }

  /**
   * Batch operations with caching
   */
  
  async batchGetUserProfiles(userIds, options = {}) {
    return await this.executeOperation('batchGetUserProfiles', async () => {
      const results = {};
      const uncachedIds = [];
      
      if (this.cacheConfig.enableCaching && !options.skipCache) {
        // Get cached profiles
        const cachedProfiles = await this.userCache.batchGetUserProfiles(userIds);
        
        for (const userId of userIds) {
          if (cachedProfiles[userId]) {
            results[userId] = cachedProfiles[userId];
          } else {
            uncachedIds.push(userId);
          }
        }
      } else {
        uncachedIds.push(...userIds);
      }
      
      // Get uncached profiles from database
      if (uncachedIds.length > 0) {
        const dbProfiles = await this.batchQueryUserProfiles(uncachedIds);
        
        // Cache the new profiles
        const cachePromises = Object.entries(dbProfiles).map(([userId, profile]) => 
          this.userCache.cacheUserProfile(userId, profile)
        );
        
        await Promise.allSettled(cachePromises);
        
        // Merge with cached results
        Object.assign(results, dbProfiles);
      }
      
      return results;
    }, { userIds, options });
  }

  /**
   * Cache warming operations
   */
  
  async warmUserCache(userIds = null) {
    if (!this.cacheConfig.enableCacheWarming) {
      return 0;
    }
    
    try {
      let targetUserIds;
      
      if (userIds) {
        targetUserIds = userIds;
      } else {
        // Get active users for warming
        targetUserIds = await this.getActiveUserIds(this.cacheConfig.warmingBatchSize);
      }
      
      // Warm user profiles
      const profiles = await this.batchQueryUserProfiles(targetUserIds);
      const warmingPromises = Object.entries(profiles).map(([userId, profile]) => 
        this.userCache.cacheUserProfile(userId, profile)
      );
      
      await Promise.allSettled(warmingPromises);
      
      return targetUserIds.length;
      
    } catch (error) {
      this.logger.error('User cache warming failed:', error);
      return 0;
    }
  }

  /**
   * Helper methods
   */
  
  async enrichCachedProfile(cachedProfile, options) {
    // Add additional data that might not be cached
    if (options.includeRankings && !cachedProfile.rankings) {
      const rankings = await Promise.all([
        this.userCache.getUserStats(cachedProfile.id, ['reputation_score']),
        this.userCache.getUserStats(cachedProfile.id, ['total_votes_cast']),
        this.userCache.getUserStats(cachedProfile.id, ['total_content_approved'])
      ]);
      
      cachedProfile.rankings = {
        reputation: rankings[0],
        votes: rankings[1],
        content: rankings[2]
      };
    }
    
    return cachedProfile;
  }

  async cacheUserData(user) {
    const cachePromises = [
      this.userCache.cacheUserProfile(user.id, user)
    ];
    
    if (user.stats) {
      cachePromises.push(this.userCache.cacheUserStats(user.id, user.stats));
    }
    
    if (user.achievements) {
      cachePromises.push(this.userCache.cacheUserAchievements(user.id, user.achievements));
    }
    
    await Promise.allSettled(cachePromises);
  }

  async handleSearchCacheInvalidation(userId, userData) {
    // Invalidate old search cache entries
    if (userData.username) {
      const oldUser = await this.userDAO.findById(userId);
      if (oldUser && oldUser.username !== userData.username) {
        await this.userCache.invalidateUserSearch('username', oldUser.username, userData.username);
      }
    }
    
    if (userData.wallet_address) {
      const oldUser = await this.userDAO.findById(userId);
      if (oldUser && oldUser.wallet_address !== userData.wallet_address) {
        await this.userCache.invalidateUserSearch('wallet_address', oldUser.wallet_address, userData.wallet_address);
      }
    }
  }

  async updateUserStatsCache(userId, activityType, activityData) {
    try {
      const currentStats = await this.userCache.getUserStats(userId);
      if (currentStats) {
        // Update specific stats based on activity type
        const updatedStats = this.calculateStatUpdates(currentStats, activityType, activityData);
        await this.userCache.cacheUserStats(userId, updatedStats);
      }
    } catch (error) {
      // Don't fail the operation if cache update fails
      this.logger.warn('Failed to update user stats cache:', error);
    }
  }

  calculateStatUpdates(currentStats, activityType, activityData) {
    const updatedStats = { ...currentStats };
    
    switch (activityType) {
      case 'vote_cast':
        updatedStats.total_votes_cast = (updatedStats.total_votes_cast || 0) + 1;
        if (activityData.mlgBurned) {
          updatedStats.total_mlg_burned = (updatedStats.total_mlg_burned || 0) + activityData.mlgBurned;
        }
        break;
        
      case 'content_submitted':
        updatedStats.total_content_submitted = (updatedStats.total_content_submitted || 0) + 1;
        break;
        
      case 'content_approved':
        updatedStats.total_content_approved = (updatedStats.total_content_approved || 0) + 1;
        updatedStats.reputation_score = (updatedStats.reputation_score || 0) + 5;
        break;
    }
    
    return updatedStats;
  }

  affectsRankings(activityType) {
    return ['vote_cast', 'content_approved', 'achievement_earned'].includes(activityType);
  }

  async invalidateRankingCaches(userId) {
    // Invalidate leaderboard caches
    const rankingTypes = ['reputation_score', 'total_votes_cast', 'total_content_approved'];
    
    for (const type of rankingTypes) {
      await this.userCache.invalidateUserCache(`ranking:${type}:${userId}`);
    }
  }

  async getCachedDashboardComponents(userId) {
    const [profile, stats, achievements, activity] = await Promise.allSettled([
      this.userCache.getUserProfile(userId),
      this.userCache.getUserStats(userId),
      this.userCache.getUserProfile(userId), // achievements would be part of profile
      this.userCache.getUserActivity ? this.userCache.getUserActivity(userId) : null
    ]);
    
    return {
      profile: profile.status === 'fulfilled' ? profile.value : null,
      stats: stats.status === 'fulfilled' ? stats.value : null,
      achievements: achievements.status === 'fulfilled' ? achievements.value?.achievements : null,
      activity: activity.status === 'fulfilled' ? activity.value : null
    };
  }

  isDashboardCacheComplete(components) {
    return components.profile && components.stats;
  }

  async buildDashboardFromCache(components) {
    return {
      user: components.profile,
      activity: components.stats,
      achievements: components.achievements,
      timestamp: new Date()
    };
  }

  async buildDashboardWithCache(userId, cachedComponents) {
    // Get missing components from database
    const promises = [];
    
    if (!cachedComponents.profile) {
      promises.push(this.userDAO.findById(userId));
    }
    
    if (!cachedComponents.stats) {
      promises.push(this.userDAO.getUserActivitySummary(userId, { days: 7 }));
    }
    
    const results = await Promise.allSettled(promises);
    
    // Build dashboard with mix of cached and fresh data
    const dashboard = {
      user: cachedComponents.profile || results[0]?.value,
      activity: cachedComponents.stats || results[1]?.value,
      achievements: cachedComponents.achievements,
      timestamp: new Date()
    };
    
    // Cache the fresh data
    if (results[0]?.value) {
      await this.userCache.cacheUserProfile(userId, results[0].value);
    }
    
    if (results[1]?.value) {
      await this.userCache.cacheUserStats(userId, results[1].value);
    }
    
    return dashboard;
  }

  generateSearchCacheKey(searchParams, options) {
    const keyParts = ['search'];
    keyParts.push(JSON.stringify(searchParams));
    keyParts.push(JSON.stringify(options));
    return keyParts.join(':');
  }

  isSearchCacheable(searchParams) {
    // Cache stable searches (no date ranges, no user-specific filters)
    return !searchParams.created_after && !searchParams.created_before && 
           !searchParams.last_active_after;
  }

  async cacheSearchResults(results) {
    const cachePromises = results.map(user => 
      this.userCache.cacheUserProfile(user.id, user)
    );
    
    await Promise.allSettled(cachePromises);
  }

  async getOptimizedLeaderboard(metric, options) {
    const { limit = 50, offset = 0 } = options;
    
    // Use query optimizer for better performance
    const query = `
      SELECT 
        id, username, wallet_address, reputation_score,
        total_votes_cast, total_content_approved, created_at,
        RANK() OVER (ORDER BY ${metric} DESC) as rank
      FROM users 
      WHERE status = 'active' AND ${metric} > 0
      ORDER BY ${metric} DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await this.queryOptimizer.query(query, [limit, offset], {
      cache: true,
      cacheTTL: 300 // 5 minutes
    });
    
    return result.rows;
  }

  async batchQueryUserProfiles(userIds) {
    if (userIds.length === 0) return {};
    
    const placeholders = userIds.map((_, index) => `$${index + 1}`).join(',');
    const query = `
      SELECT * FROM users 
      WHERE id IN (${placeholders})
      AND status = 'active'
    `;
    
    const result = await this.queryOptimizer.query(query, userIds, {
      cache: true,
      cacheTTL: this.cacheConfig.profileTTL
    });
    
    return result.rows.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});
  }

  async getActiveUserIds(limit) {
    const query = `
      SELECT id FROM users 
      WHERE status = 'active' 
        AND last_login_at > NOW() - INTERVAL '7 days'
      ORDER BY last_login_at DESC
      LIMIT $1
    `;
    
    const result = await this.queryOptimizer.query(query, [limit]);
    return result.rows.map(row => row.id);
  }

  /**
   * Event handlers
   */
  
  async handleUserCreated(data) {
    if (this.cacheConfig.enableWriteThrough && data.user) {
      await this.cacheUserData(data.user);
    }
  }

  async handleUserUpdated(data) {
    if (data.userId) {
      await this.userCache.invalidateUserCache(data.userId);
    }
  }

  async handleUserDeleted(data) {
    if (data.userId) {
      await this.userCache.invalidateUserCache(data.userId);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      ...this.userCache.getCacheStats(),
      repository: {
        cacheEnabled: this.cacheConfig.enableCaching,
        writeThroughEnabled: this.cacheConfig.enableWriteThrough,
        warmingEnabled: this.cacheConfig.enableCacheWarming
      }
    };
  }
}

export default CachedUserRepository;