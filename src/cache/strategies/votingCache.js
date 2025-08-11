/**
 * Voting Cache Strategy for MLG.clan Platform
 * 
 * Specialized caching strategy for voting system data including daily vote limits,
 * proposal results, leaderboards, and MLG burn tracking. Optimized for high-frequency
 * voting operations with real-time updates and accurate vote tracking.
 * 
 * Features:
 * - Daily vote limit tracking
 * - Proposal vote counting and results
 * - Voting leaderboards and statistics
 * - MLG burn tracking for votes
 * - Vote weight calculations
 * - Voting session management
 * - Historical voting data
 * - Fraud prevention caching
 * 
 * @author Claude Code - Performance Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { getCacheManager } from '../cache-manager.js';

export class VotingCacheStrategy {
  constructor(options = {}) {
    this.cache = getCacheManager();
    this.namespace = 'voting';
    
    this.config = {
      dailyLimitTTL: options.dailyLimitTTL || 86400,      // 24 hours
      proposalTTL: options.proposalTTL || 1800,           // 30 minutes
      leaderboardTTL: options.leaderboardTTL || 300,      // 5 minutes
      sessionTTL: options.sessionTTL || 3600,             // 1 hour
      resultsTTL: options.resultsTTL || 7200,             // 2 hours
      statisticsTTL: options.statisticsTTL || 1800,       // 30 minutes
      burnTrackingTTL: options.burnTrackingTTL || 43200,  // 12 hours
      
      // Voting limits and thresholds
      defaultDailyVoteLimit: options.defaultDailyVoteLimit || 100,
      maxProposalVotes: options.maxProposalVotes || 10000,
      minMLGBurnAmount: options.minMLGBurnAmount || 0.1,
      
      // Real-time update settings
      enableRealTimeUpdates: options.enableRealTimeUpdates !== false,
      voteUpdateBatchSize: options.voteUpdateBatchSize || 20,
      
      // Anti-fraud settings
      enableFraudPrevention: options.enableFraudPrevention !== false,
      maxVotesPerMinute: options.maxVotesPerMinute || 10,
      suspiciousVoteThreshold: options.suspiciousVoteThreshold || 50,
      
      ...options
    };
    
    this.setupInvalidationPatterns();
  }

  setupInvalidationPatterns() {
    // When votes are cast, invalidate related caches
    this.cache.registerInvalidationPattern('voting:cast', 'voting:leaderboard:*');
    this.cache.registerInvalidationPattern('voting:cast', 'voting:statistics:*');
    
    // When proposals update, invalidate results
    this.cache.registerInvalidationPattern('voting:proposal', 'voting:results:*');
    this.cache.registerInvalidationPattern('voting:proposal', 'voting:trending:*');
    
    // When daily limits reset, invalidate limit caches
    this.cache.registerInvalidationPattern('voting:limit:reset', 'voting:daily:*');
  }

  /**
   * Cache user daily vote limits
   * @param {string} userId - User ID
   * @param {Object} limitData - Vote limit data
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheUserDailyLimits(userId, limitData, options = {}) {
    const ttl = options.ttl || this.config.dailyLimitTTL;
    const today = new Date().toISOString().split('T')[0];
    
    // Cache daily vote count
    await this.cache.set(
      `${this.namespace}:daily:votes`,
      `${userId}:${today}`,
      {
        votes_cast: limitData.votes_cast || 0,
        mlg_burned: limitData.mlg_burned || 0,
        vote_limit: limitData.vote_limit || this.config.defaultDailyVoteLimit,
        last_vote_at: limitData.last_vote_at,
        reset_at: limitData.reset_at
      },
      { ttl }
    );
    
    // Cache remaining votes for quick access
    const remainingVotes = (limitData.vote_limit || this.config.defaultDailyVoteLimit) - (limitData.votes_cast || 0);
    await this.cache.set(
      `${this.namespace}:daily:remaining`,
      `${userId}:${today}`,
      Math.max(0, remainingVotes),
      { ttl }
    );
    
    return true;
  }

  /**
   * Cache proposal vote data
   * @param {string} proposalId - Proposal ID
   * @param {Object} voteData - Proposal vote data
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheProposalVotes(proposalId, voteData, options = {}) {
    const ttl = options.ttl || this.config.proposalTTL;
    
    // Cache proposal vote summary
    await this.cache.set(
      `${this.namespace}:proposal`,
      proposalId,
      {
        total_votes: voteData.total_votes || 0,
        votes_for: voteData.votes_for || 0,
        votes_against: voteData.votes_against || 0,
        total_mlg_burned: voteData.total_mlg_burned || 0,
        vote_weight_for: voteData.vote_weight_for || 0,
        vote_weight_against: voteData.vote_weight_against || 0,
        participation_rate: voteData.participation_rate || 0,
        last_vote_at: voteData.last_vote_at,
        status: voteData.status,
        deadline: voteData.deadline
      },
      { ttl }
    );
    
    // Cache individual voter records for this proposal
    if (voteData.voter_records) {
      const voterPromises = voteData.voter_records.map(record => 
        this.cache.set(
          `${this.namespace}:proposal:vote`,
          `${proposalId}:${record.user_id}`,
          {
            vote_type: record.vote_type,
            mlg_burned: record.mlg_burned,
            vote_weight: record.vote_weight,
            voted_at: record.voted_at,
            transaction_hash: record.transaction_hash
          },
          { ttl }
        )
      );
      
      await Promise.all(voterPromises);
    }
    
    return true;
  }

  /**
   * Cache voting leaderboards
   * @param {string} metric - Leaderboard metric (votes_cast, mlg_burned, etc.)
   * @param {string} timeframe - Time period (daily, weekly, monthly, all_time)
   * @param {Array} leaderboard - Leaderboard data
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheVotingLeaderboard(metric, timeframe, leaderboard, options = {}) {
    const ttl = options.ttl || this.config.leaderboardTTL;
    
    await this.cache.set(
      `${this.namespace}:leaderboard:${metric}`,
      timeframe,
      leaderboard,
      { ttl }
    );
    
    // Cache individual user rankings
    leaderboard.forEach(async (entry, index) => {
      await this.cache.set(
        `${this.namespace}:ranking:${metric}:${timeframe}`,
        entry.user_id,
        {
          rank: index + 1,
          value: entry[metric],
          change_from_previous: entry.change_from_previous || 0
        },
        { ttl }
      );
    });
    
    // Cache top voters for quick access
    const topVoters = leaderboard.slice(0, 10);
    await this.cache.set(
      `${this.namespace}:top:${metric}`,
      timeframe,
      topVoters,
      { ttl }
    );
    
    return true;
  }

  /**
   * Cache MLG burn tracking
   * @param {string} userId - User ID
   * @param {Object} burnData - MLG burn tracking data
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheMLGBurnTracking(userId, burnData, options = {}) {
    const ttl = options.ttl || this.config.burnTrackingTTL;
    
    // Cache user burn statistics
    await this.cache.set(
      `${this.namespace}:burn:user`,
      userId,
      {
        total_burned: burnData.total_burned || 0,
        daily_burned: burnData.daily_burned || 0,
        weekly_burned: burnData.weekly_burned || 0,
        monthly_burned: burnData.monthly_burned || 0,
        avg_burn_per_vote: burnData.avg_burn_per_vote || 0,
        last_burn_at: burnData.last_burn_at,
        burn_streak: burnData.burn_streak || 0
      },
      { ttl }
    );
    
    // Cache recent burn transactions
    if (burnData.recent_burns) {
      await this.cache.set(
        `${this.namespace}:burn:recent`,
        userId,
        burnData.recent_burns,
        { ttl: this.config.sessionTTL }
      );
    }
    
    return true;
  }

  /**
   * Cache voting statistics
   * @param {string} scope - Statistics scope (global, clan, user)
   * @param {string} scopeId - Scope ID (null for global, clan ID, or user ID)
   * @param {Object} stats - Statistics data
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheVotingStatistics(scope, scopeId, stats, options = {}) {
    const ttl = options.ttl || this.config.statisticsTTL;
    
    const cacheKey = scopeId ? `${scope}:${scopeId}` : scope;
    
    await this.cache.set(
      `${this.namespace}:statistics`,
      cacheKey,
      stats,
      { ttl }
    );
    
    // Cache key metrics separately for quick access
    const keyMetrics = {
      total_votes_today: stats.total_votes_today,
      total_mlg_burned_today: stats.total_mlg_burned_today,
      active_voters_today: stats.active_voters_today,
      avg_votes_per_user: stats.avg_votes_per_user,
      top_voting_hour: stats.top_voting_hour
    };
    
    await this.cache.set(
      `${this.namespace}:metrics:${scope}`,
      scopeId || 'global',
      keyMetrics,
      { ttl }
    );
    
    return true;
  }

  /**
   * Cache voting session data
   * @param {string} sessionId - Voting session ID
   * @param {Object} sessionData - Session data
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheVotingSession(sessionId, sessionData, options = {}) {
    const ttl = options.ttl || this.config.sessionTTL;
    
    await this.cache.set(
      `${this.namespace}:session`,
      sessionId,
      {
        user_id: sessionData.user_id,
        votes_in_session: sessionData.votes_in_session || 0,
        mlg_burned_in_session: sessionData.mlg_burned_in_session || 0,
        session_start: sessionData.session_start,
        last_activity: sessionData.last_activity,
        ip_address: sessionData.ip_address,
        user_agent: sessionData.user_agent
      },
      { ttl }
    );
    
    return true;
  }

  /**
   * Cache vote fraud prevention data
   * @param {string} userId - User ID
   * @param {Object} fraudData - Fraud prevention data
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheFraudPrevention(userId, fraudData, options = {}) {
    if (!this.config.enableFraudPrevention) return false;
    
    const ttl = options.ttl || 3600; // 1 hour for fraud data
    
    await this.cache.set(
      `${this.namespace}:fraud:user`,
      userId,
      {
        votes_last_hour: fraudData.votes_last_hour || 0,
        votes_last_minute: fraudData.votes_last_minute || 0,
        suspicious_activity_score: fraudData.suspicious_activity_score || 0,
        last_vote_timestamps: fraudData.last_vote_timestamps || [],
        ip_addresses: fraudData.ip_addresses || [],
        is_flagged: fraudData.is_flagged || false
      },
      { ttl }
    );
    
    return true;
  }

  /**
   * Get methods for cached data
   */
  
  async getUserDailyLimits(userId) {
    const today = new Date().toISOString().split('T')[0];
    return await this.cache.get(`${this.namespace}:daily:votes`, `${userId}:${today}`);
  }
  
  async getUserRemainingVotes(userId) {
    const today = new Date().toISOString().split('T')[0];
    return await this.cache.get(`${this.namespace}:daily:remaining`, `${userId}:${today}`);
  }
  
  async getProposalVotes(proposalId) {
    return await this.cache.get(`${this.namespace}:proposal`, proposalId);
  }
  
  async getUserProposalVote(proposalId, userId) {
    return await this.cache.get(`${this.namespace}:proposal:vote`, `${proposalId}:${userId}`);
  }
  
  async getVotingLeaderboard(metric, timeframe) {
    return await this.cache.get(`${this.namespace}:leaderboard:${metric}`, timeframe);
  }
  
  async getUserVotingRank(userId, metric, timeframe) {
    return await this.cache.get(`${this.namespace}:ranking:${metric}:${timeframe}`, userId);
  }
  
  async getMLGBurnTracking(userId) {
    return await this.cache.get(`${this.namespace}:burn:user`, userId);
  }
  
  async getVotingStatistics(scope, scopeId = null) {
    const cacheKey = scopeId ? `${scope}:${scopeId}` : scope;
    return await this.cache.get(`${this.namespace}:statistics`, cacheKey);
  }

  /**
   * Real-time update methods
   */
  
  async incrementDailyVoteCount(userId, mlgBurned = 0) {
    if (!this.config.enableRealTimeUpdates) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Update daily vote count
      const currentLimits = await this.getUserDailyLimits(userId);
      if (currentLimits) {
        currentLimits.votes_cast += 1;
        currentLimits.mlg_burned += mlgBurned;
        currentLimits.last_vote_at = new Date().toISOString();
        
        await this.cache.set(
          `${this.namespace}:daily:votes`,
          `${userId}:${today}`,
          currentLimits,
          { ttl: this.config.dailyLimitTTL }
        );
        
        // Update remaining votes
        const remainingVotes = Math.max(0, currentLimits.vote_limit - currentLimits.votes_cast);
        await this.cache.set(
          `${this.namespace}:daily:remaining`,
          `${userId}:${today}`,
          remainingVotes,
          { ttl: this.config.dailyLimitTTL }
        );
      }
    } catch (error) {
      // Ignore errors for real-time updates
    }
  }
  
  async updateProposalVoteCount(proposalId, voteType, mlgBurned = 0) {
    if (!this.config.enableRealTimeUpdates) return;
    
    try {
      const currentVotes = await this.getProposalVotes(proposalId);
      if (currentVotes) {
        currentVotes.total_votes += 1;
        
        if (voteType === 'for') {
          currentVotes.votes_for += 1;
          currentVotes.vote_weight_for += mlgBurned;
        } else if (voteType === 'against') {
          currentVotes.votes_against += 1;
          currentVotes.vote_weight_against += mlgBurned;
        }
        
        currentVotes.total_mlg_burned += mlgBurned;
        currentVotes.last_vote_at = new Date().toISOString();
        
        await this.cache.set(
          `${this.namespace}:proposal`,
          proposalId,
          currentVotes,
          { ttl: this.config.proposalTTL }
        );
      }
    } catch (error) {
      // Ignore errors for real-time updates
    }
  }

  /**
   * Anti-fraud methods
   */
  
  async checkVotingRate(userId) {
    if (!this.config.enableFraudPrevention) return { allowed: true };
    
    const fraudData = await this.cache.get(`${this.namespace}:fraud:user`, userId);
    if (!fraudData) return { allowed: true };
    
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Filter recent votes
    const recentVotes = (fraudData.last_vote_timestamps || [])
      .filter(timestamp => timestamp > oneMinuteAgo);
    
    if (recentVotes.length >= this.config.maxVotesPerMinute) {
      return {
        allowed: false,
        reason: 'Rate limit exceeded',
        retryAfter: 60 - Math.floor((now - Math.min(...recentVotes)) / 1000)
      };
    }
    
    return { allowed: true };
  }
  
  async updateFraudTracking(userId, voteData) {
    if (!this.config.enableFraudPrevention) return;
    
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    try {
      const fraudData = await this.cache.get(`${this.namespace}:fraud:user`, userId) || {};
      
      // Update vote timestamps
      fraudData.last_vote_timestamps = (fraudData.last_vote_timestamps || [])
        .filter(timestamp => timestamp > oneHourAgo)
        .concat([now]);
      
      // Count votes in different time windows
      fraudData.votes_last_hour = fraudData.last_vote_timestamps.length;
      fraudData.votes_last_minute = fraudData.last_vote_timestamps
        .filter(timestamp => timestamp > now - 60000).length;
      
      // Track IP addresses
      if (voteData.ip_address) {
        fraudData.ip_addresses = Array.from(new Set(
          (fraudData.ip_addresses || []).concat([voteData.ip_address])
        )).slice(-10); // Keep last 10 IPs
      }
      
      // Calculate suspicious activity score
      fraudData.suspicious_activity_score = this.calculateSuspiciousScore(fraudData);
      fraudData.is_flagged = fraudData.suspicious_activity_score > this.config.suspiciousVoteThreshold;
      
      await this.cacheFraudPrevention(userId, fraudData);
    } catch (error) {
      // Ignore errors for fraud tracking
    }
  }
  
  calculateSuspiciousScore(fraudData) {
    let score = 0;
    
    // High vote frequency
    if (fraudData.votes_last_minute > 5) score += 20;
    if (fraudData.votes_last_hour > 50) score += 30;
    
    // Multiple IP addresses
    if (fraudData.ip_addresses && fraudData.ip_addresses.length > 3) {
      score += fraudData.ip_addresses.length * 5;
    }
    
    // Consistent voting patterns (would need more data)
    // This is a placeholder for more sophisticated pattern detection
    
    return Math.min(100, score);
  }

  /**
   * Batch operations
   */
  
  async batchGetDailyLimits(userIds) {
    const today = new Date().toISOString().split('T')[0];
    const keys = userIds.map(userId => `${userId}:${today}`);
    return await this.cache.getMultiple(`${this.namespace}:daily:votes`, keys);
  }
  
  async batchGetProposalVotes(proposalIds) {
    return await this.cache.getMultiple(`${this.namespace}:proposal`, proposalIds);
  }

  /**
   * Invalidation methods
   */
  
  async invalidateUserVotingCache(userId) {
    const today = new Date().toISOString().split('T')[0];
    
    const patterns = [
      `${this.namespace}:daily:votes:${userId}:${today}`,
      `${this.namespace}:daily:remaining:${userId}:${today}`,
      `${this.namespace}:burn:user:${userId}`,
      `${this.namespace}:burn:recent:${userId}`,
      `${this.namespace}:fraud:user:${userId}`
    ];
    
    let totalInvalidated = 0;
    
    for (const pattern of patterns) {
      const invalidated = await this.cache.invalidatePattern('', pattern);
      totalInvalidated += invalidated;
    }
    
    return totalInvalidated;
  }
  
  async invalidateProposalCache(proposalId) {
    const patterns = [
      `${this.namespace}:proposal:${proposalId}`,
      `${this.namespace}:proposal:vote:${proposalId}:*`
    ];
    
    let totalInvalidated = 0;
    
    for (const pattern of patterns) {
      const invalidated = await this.cache.invalidatePattern('', pattern);
      totalInvalidated += invalidated;
    }
    
    return totalInvalidated;
  }
  
  async invalidateVotingLeaderboards() {
    return await this.cache.invalidatePattern('', `${this.namespace}:leaderboard:*`);
  }

  /**
   * Daily reset operations
   */
  
  async resetDailyLimits() {
    // This would typically be called by a scheduled job
    await this.cache.invalidatePattern('', `${this.namespace}:daily:*`);
    await this.cache.triggerInvalidation(`${this.namespace}:limit:reset`, {});
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      namespace: this.namespace,
      config: this.config
    };
  }
}

// Create singleton instance
let globalVotingCache = null;

export function createVotingCache(options = {}) {
  return new VotingCacheStrategy(options);
}

export function getVotingCache(options = {}) {
  if (!globalVotingCache) {
    globalVotingCache = new VotingCacheStrategy(options);
  }
  return globalVotingCache;
}

export default VotingCacheStrategy;