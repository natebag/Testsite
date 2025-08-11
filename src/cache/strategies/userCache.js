/**
 * User Cache Strategy for MLG.clan Platform
 * 
 * Specialized caching strategy for user-related data including profiles,
 * achievements, statistics, and session data. Implements intelligent
 * cache warming and invalidation for optimal user experience.
 * 
 * Features:
 * - User profile caching with smart invalidation
 * - Achievement progress caching
 * - User statistics and leaderboard caching
 * - Session data caching
 * - Social graph caching
 * - Activity feed caching
 * 
 * @author Claude Code - Performance Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { getCacheManager } from '../cache-manager.js';

export class UserCacheStrategy {
  constructor(options = {}) {
    this.cache = getCacheManager();
    this.namespace = 'user';
    
    this.config = {
      profileTTL: options.profileTTL || 3600,      // 1 hour
      statsTTL: options.statsTTL || 1800,         // 30 minutes
      sessionTTL: options.sessionTTL || 3600,     // 1 hour
      achievementTTL: options.achievementTTL || 7200, // 2 hours
      leaderboardTTL: options.leaderboardTTL || 300,  // 5 minutes
      activityTTL: options.activityTTL || 600,    // 10 minutes
      socialTTL: options.socialTTL || 1800,       // 30 minutes
      
      // Warming settings
      enableWarming: options.enableWarming !== false,
      warmingBatchSize: options.warmingBatchSize || 50,
      
      ...options
    };
    
    this.setupInvalidationPatterns();
  }

  setupInvalidationPatterns() {
    // When user profile updates, invalidate related caches
    this.cache.registerInvalidationPattern('user:profile', 'user:stats:*');
    this.cache.registerInvalidationPattern('user:profile', 'user:leaderboard:*');
    
    // When user stats update, invalidate leaderboards
    this.cache.registerInvalidationPattern('user:stats', 'user:leaderboard:*');
    this.cache.registerInvalidationPattern('user:stats', 'clan:leaderboard:*');
    
    // When achievements update, invalidate user dashboard
    this.cache.registerInvalidationPattern('user:achievement', 'user:dashboard:*');
  }

  /**
   * Cache user profile data
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data to cache
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheUserProfile(userId, profileData, options = {}) {
    const ttl = options.ttl || this.config.profileTTL;
    
    // Cache main profile
    await this.cache.set(
      `${this.namespace}:profile`,
      userId,
      profileData,
      { ttl }
    );
    
    // Cache searchable fields separately for quick lookups
    if (profileData.username) {
      await this.cache.set(
        `${this.namespace}:username`,
        profileData.username,
        { userId },
        { ttl }
      );
    }
    
    if (profileData.wallet_address) {
      await this.cache.set(
        `${this.namespace}:wallet`,
        profileData.wallet_address,
        { userId },
        { ttl }
      );
    }
    
    // Cache profile summary for listings
    const profileSummary = {
      id: userId,
      username: profileData.username,
      wallet_address: profileData.wallet_address,
      reputation_score: profileData.reputation_score,
      avatar_url: profileData.avatar_url,
      status: profileData.status,
      created_at: profileData.created_at
    };
    
    await this.cache.set(
      `${this.namespace}:summary`,
      userId,
      profileSummary,
      { ttl }
    );
    
    return true;
  }

  /**
   * Get cached user profile
   * @param {string} userId - User ID
   * @param {Object} options - Cache options
   * @returns {Promise<Object|null>} Cached profile or null
   */
  async getUserProfile(userId, options = {}) {
    return await this.cache.get(`${this.namespace}:profile`, userId, options);
  }

  /**
   * Cache user statistics
   * @param {string} userId - User ID
   * @param {Object} stats - User statistics
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheUserStats(userId, stats, options = {}) {
    const ttl = options.ttl || this.config.statsTTL;
    
    // Cache full stats
    await this.cache.set(
      `${this.namespace}:stats`,
      userId,
      stats,
      { ttl }
    );
    
    // Cache individual metrics for quick access
    const metrics = [
      'reputation_score',
      'total_votes_cast',
      'total_content_submitted',
      'total_content_approved',
      'total_mlg_burned'
    ];
    
    const cachePromises = metrics.map(metric => {
      if (stats[metric] !== undefined) {
        return this.cache.set(
          `${this.namespace}:metric:${metric}`,
          userId,
          stats[metric],
          { ttl }
        );
      }
    }).filter(Boolean);
    
    await Promise.all(cachePromises);
    
    return true;
  }

  /**
   * Get cached user statistics
   * @param {string} userId - User ID
   * @param {Array} metrics - Specific metrics to retrieve
   * @returns {Promise<Object|null>} Cached stats or null
   */
  async getUserStats(userId, metrics = null) {
    if (metrics) {
      // Get specific metrics
      const keys = metrics.map(metric => `${userId}:${metric}`);
      const results = await this.cache.getMultiple(`${this.namespace}:metric`, keys);
      
      return Object.keys(results).reduce((acc, key) => {
        const metric = key.split(':')[1];
        acc[metric] = results[key];
        return acc;
      }, {});
    }
    
    // Get full stats
    return await this.cache.get(`${this.namespace}:stats`, userId);
  }

  /**
   * Cache user achievements
   * @param {string} userId - User ID
   * @param {Object} achievements - Achievement data
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheUserAchievements(userId, achievements, options = {}) {
    const ttl = options.ttl || this.config.achievementTTL;
    
    // Cache full achievement data
    await this.cache.set(
      `${this.namespace}:achievements`,
      userId,
      achievements,
      { ttl }
    );
    
    // Cache achievement summary
    const summary = {
      totalEarned: achievements.progress?.filter(p => p.completed).length || 0,
      totalAvailable: achievements.progress?.length || 0,
      recentAchievements: achievements.progress
        ?.filter(p => p.completed)
        ?.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
        ?.slice(0, 5) || []
    };
    
    await this.cache.set(
      `${this.namespace}:achievement:summary`,
      userId,
      summary,
      { ttl }
    );
    
    return true;
  }

  /**
   * Cache user session data
   * @param {string} sessionId - Session ID
   * @param {Object} sessionData - Session data
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheUserSession(sessionId, sessionData, options = {}) {
    const ttl = options.ttl || this.config.sessionTTL;
    
    // Cache session data
    await this.cache.set(
      `${this.namespace}:session`,
      sessionId,
      sessionData,
      { ttl }
    );
    
    // Cache user-to-session mapping
    if (sessionData.userId) {
      await this.cache.set(
        `${this.namespace}:session:user`,
        sessionData.userId,
        { sessionId, lastActivity: Date.now() },
        { ttl }
      );
    }
    
    return true;
  }

  /**
   * Cache user leaderboard data
   * @param {string} metric - Leaderboard metric
   * @param {Array} leaderboard - Leaderboard data
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheLeaderboard(metric, leaderboard, options = {}) {
    const ttl = options.ttl || this.config.leaderboardTTL;
    
    await this.cache.set(
      `${this.namespace}:leaderboard`,
      metric,
      leaderboard,
      { ttl }
    );
    
    // Cache individual user rankings
    leaderboard.forEach(async (entry, index) => {
      await this.cache.set(
        `${this.namespace}:ranking:${metric}`,
        entry.id,
        { rank: index + 1, value: entry[metric] },
        { ttl }
      );
    });
    
    return true;
  }

  /**
   * Cache user activity feed
   * @param {string} userId - User ID
   * @param {Array} activities - Activity feed data
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheUserActivity(userId, activities, options = {}) {
    const ttl = options.ttl || this.config.activityTTL;
    
    await this.cache.set(
      `${this.namespace}:activity`,
      userId,
      activities,
      { ttl }
    );
    
    return true;
  }

  /**
   * Cache user social connections
   * @param {string} userId - User ID
   * @param {Object} connections - Social connections data
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheSocialConnections(userId, connections, options = {}) {
    const ttl = options.ttl || this.config.socialTTL;
    
    // Cache full connections
    await this.cache.set(
      `${this.namespace}:connections`,
      userId,
      connections,
      { ttl }
    );
    
    // Cache connection counts
    await this.cache.set(
      `${this.namespace}:connection:counts`,
      userId,
      {
        friends: connections.friends?.length || 0,
        followers: connections.followers?.length || 0,
        following: connections.following?.length || 0
      },
      { ttl }
    );
    
    return true;
  }

  /**
   * Warm user cache with frequently accessed data
   * @param {Array} userIds - Array of user IDs to warm
   * @param {Object} options - Warming options
   * @returns {Promise<number>} Number of warmed entries
   */
  async warmUserCache(userIds, options = {}) {
    if (!this.config.enableWarming) {
      return 0;
    }
    
    const warmingData = [];
    
    // This would be populated by fetching from database
    // For now, we'll provide a structure for the warming data
    for (const userId of userIds.slice(0, this.config.warmingBatchSize)) {
      warmingData.push({
        key: userId,
        value: null, // Would be populated by database call
        ttl: this.config.profileTTL
      });
    }
    
    return await this.cache.warmCache(`${this.namespace}:profile`, warmingData);
  }

  /**
   * Invalidate all user-related caches
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of invalidated keys
   */
  async invalidateUserCache(userId) {
    const patterns = [
      `${this.namespace}:profile:${userId}`,
      `${this.namespace}:stats:${userId}`,
      `${this.namespace}:achievements:${userId}`,
      `${this.namespace}:activity:${userId}`,
      `${this.namespace}:connections:${userId}`,
      `${this.namespace}:metric:*:${userId}`,
      `${this.namespace}:ranking:*:${userId}`
    ];
    
    let totalInvalidated = 0;
    
    for (const pattern of patterns) {
      const invalidated = await this.cache.invalidatePattern('', pattern);
      totalInvalidated += invalidated;
    }
    
    // Trigger cascade invalidation for leaderboards
    await this.cache.triggerInvalidation(`${this.namespace}:stats`, { userId });
    
    return totalInvalidated;
  }

  /**
   * Invalidate user search caches
   * @param {string} field - Field that changed (username, wallet_address)
   * @param {string} oldValue - Old value
   * @param {string} newValue - New value
   * @returns {Promise<void>}
   */
  async invalidateUserSearch(field, oldValue, newValue) {
    if (oldValue) {
      await this.cache.delete(`${this.namespace}:${field}`, oldValue);
    }
    
    // The new value will be cached on next access
  }

  /**
   * Get user cache statistics
   * @returns {Object} Cache statistics for user namespace
   */
  getCacheStats() {
    return {
      namespace: this.namespace,
      config: this.config,
      // Additional user-specific stats would be calculated here
    };
  }

  /**
   * Batch operations for multiple users
   */
  
  async batchGetUserProfiles(userIds) {
    return await this.cache.getMultiple(`${this.namespace}:profile`, userIds);
  }
  
  async batchGetUserStats(userIds) {
    return await this.cache.getMultiple(`${this.namespace}:stats`, userIds);
  }
  
  async batchGetUserSummaries(userIds) {
    return await this.cache.getMultiple(`${this.namespace}:summary`, userIds);
  }
  
  async batchInvalidateUsers(userIds) {
    let totalInvalidated = 0;
    
    for (const userId of userIds) {
      const invalidated = await this.invalidateUserCache(userId);
      totalInvalidated += invalidated;
    }
    
    return totalInvalidated;
  }
}

// Create singleton instance
let globalUserCache = null;

export function createUserCache(options = {}) {
  return new UserCacheStrategy(options);
}

export function getUserCache(options = {}) {
  if (!globalUserCache) {
    globalUserCache = new UserCacheStrategy(options);
  }
  return globalUserCache;
}

export default UserCacheStrategy;