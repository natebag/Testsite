/**
 * Content Cache Strategy for MLG.clan Platform
 * 
 * Specialized caching strategy for content-related data including content metadata,
 * vote counts, trending lists, moderation queues, and content discovery.
 * Optimized for high-throughput content operations with intelligent invalidation.
 * 
 * Features:
 * - Content metadata and details caching
 * - Vote counts and engagement metrics caching
 * - Trending and popular content caching
 * - Content discovery and recommendation caching
 * - Moderation queue and status caching
 * - Tag and category-based caching
 * - Search results and filters caching
 * - Content analytics and reporting caching
 * 
 * @author Claude Code - Performance Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { getCacheManager } from '../cache-manager.js';

export class ContentCacheStrategy {
  constructor(options = {}) {
    this.cache = getCacheManager();
    this.namespace = 'content';
    
    this.config = {
      detailsTTL: options.detailsTTL || 1800,         // 30 minutes
      voteTTL: options.voteTTL || 300,               // 5 minutes
      trendingTTL: options.trendingTTL || 600,       // 10 minutes
      moderationTTL: options.moderationTTL || 900,   // 15 minutes
      searchTTL: options.searchTTL || 1800,          // 30 minutes
      analyticsTTL: options.analyticsTTL || 3600,    // 1 hour
      tagsTTL: options.tagsTTL || 7200,              // 2 hours
      recommendationTTL: options.recommendationTTL || 1800, // 30 minutes
      
      // Content list settings
      maxTrendingItems: options.maxTrendingItems || 100,
      maxSearchResults: options.maxSearchResults || 200,
      maxRecommendations: options.maxRecommendations || 50,
      
      // Real-time update settings
      enableRealTimeVotes: options.enableRealTimeVotes !== false,
      voteUpdateBatchSize: options.voteUpdateBatchSize || 10,
      
      // Content discovery settings
      enableContentDiscovery: options.enableContentDiscovery !== false,
      discoveryAlgorithmVersion: options.discoveryAlgorithmVersion || 'v1',
      
      ...options
    };
    
    this.setupInvalidationPatterns();
  }

  setupInvalidationPatterns() {
    // When content is updated, invalidate related caches
    this.cache.registerInvalidationPattern('content:details', 'content:trending:*');
    this.cache.registerInvalidationPattern('content:details', 'content:search:*');
    this.cache.registerInvalidationPattern('content:details', 'content:tag:*');
    
    // When votes change, invalidate rankings and trending
    this.cache.registerInvalidationPattern('content:votes', 'content:trending:*');
    this.cache.registerInvalidationPattern('content:votes', 'content:leaderboard:*');
    
    // When moderation status changes, invalidate content visibility
    this.cache.registerInvalidationPattern('content:moderation', 'content:approved:*');
    this.cache.registerInvalidationPattern('content:moderation', 'content:trending:*');
  }

  /**
   * Cache content details
   * @param {string} contentId - Content ID
   * @param {Object} contentData - Content data to cache
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheContentDetails(contentId, contentData, options = {}) {
    const ttl = options.ttl || this.config.detailsTTL;
    
    // Cache full content details
    await this.cache.set(
      `${this.namespace}:details`,
      contentId,
      contentData,
      { ttl }
    );
    
    // Cache content summary for listings
    const contentSummary = {
      id: contentId,
      title: contentData.title,
      description: contentData.description?.substring(0, 200),
      content_type: contentData.content_type,
      creator_id: contentData.creator_id,
      creator_username: contentData.creator_username,
      thumbnail_url: contentData.thumbnail_url,
      vote_count: contentData.vote_count || 0,
      view_count: contentData.view_count || 0,
      comment_count: contentData.comment_count || 0,
      created_at: contentData.created_at,
      updated_at: contentData.updated_at,
      status: contentData.status,
      tags: contentData.tags || []
    };
    
    await this.cache.set(
      `${this.namespace}:summary`,
      contentId,
      contentSummary,
      { ttl }
    );
    
    // Cache by creator for quick lookup
    await this.cache.set(
      `${this.namespace}:creator`,
      `${contentData.creator_id}:${contentId}`,
      contentSummary,
      { ttl }
    );
    
    // Cache by content type
    await this.cache.set(
      `${this.namespace}:type:${contentData.content_type}`,
      contentId,
      contentSummary,
      { ttl }
    );
    
    return true;
  }

  /**
   * Cache content vote data
   * @param {string} contentId - Content ID
   * @param {Object} voteData - Vote data including counts and user votes
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheContentVotes(contentId, voteData, options = {}) {
    const ttl = options.ttl || this.config.voteTTL;
    
    // Cache vote summary
    await this.cache.set(
      `${this.namespace}:votes`,
      contentId,
      {
        vote_count: voteData.vote_count,
        upvotes: voteData.upvotes,
        downvotes: voteData.downvotes,
        net_votes: voteData.net_votes,
        vote_ratio: voteData.vote_ratio,
        last_updated: Date.now()
      },
      { ttl }
    );
    
    // Cache individual user votes for quick lookup
    if (voteData.user_votes) {
      const userVotePromises = voteData.user_votes.map(userVote => 
        this.cache.set(
          `${this.namespace}:user:vote`,
          `${userVote.user_id}:${contentId}`,
          {
            vote_type: userVote.vote_type,
            mlg_burned: userVote.mlg_burned,
            voted_at: userVote.voted_at
          },
          { ttl }
        )
      );
      
      await Promise.all(userVotePromises);
    }
    
    return true;
  }

  /**
   * Cache trending content
   * @param {string} timeframe - Trending timeframe (hourly, daily, weekly)
   * @param {Array} trendingContent - Trending content list
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheTrendingContent(timeframe, trendingContent, options = {}) {
    const ttl = options.ttl || this.config.trendingTTL;
    
    // Limit trending content size
    const limitedContent = trendingContent.slice(0, this.config.maxTrendingItems);
    
    await this.cache.set(
      `${this.namespace}:trending`,
      timeframe,
      limitedContent,
      { ttl }
    );
    
    // Cache by content type within trending
    const contentByType = limitedContent.reduce((acc, content) => {
      if (!acc[content.content_type]) {
        acc[content.content_type] = [];
      }
      acc[content.content_type].push(content);
      return acc;
    }, {});
    
    for (const [type, typeContent] of Object.entries(contentByType)) {
      await this.cache.set(
        `${this.namespace}:trending:${type}`,
        timeframe,
        typeContent,
        { ttl }
      );
    }
    
    // Cache trending content IDs for quick checks
    const trendingIds = limitedContent.map(content => content.id);
    await this.cache.set(
      `${this.namespace}:trending:ids`,
      timeframe,
      trendingIds,
      { ttl }
    );
    
    return true;
  }

  /**
   * Cache content by tags
   * @param {string} tag - Content tag
   * @param {Array} taggedContent - Content with this tag
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheContentByTag(tag, taggedContent, options = {}) {
    const ttl = options.ttl || this.config.tagsTTL;
    
    const normalizedTag = tag.toLowerCase();
    
    await this.cache.set(
      `${this.namespace}:tag`,
      normalizedTag,
      taggedContent,
      { ttl }
    );
    
    // Cache tag popularity
    await this.cache.set(
      `${this.namespace}:tag:count`,
      normalizedTag,
      taggedContent.length,
      { ttl }
    );
    
    return true;
  }

  /**
   * Cache popular tags
   * @param {Array} popularTags - List of popular tags with counts
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cachePopularTags(popularTags, options = {}) {
    const ttl = options.ttl || this.config.tagsTTL;
    
    await this.cache.set(
      `${this.namespace}:tags:popular`,
      'global',
      popularTags,
      { ttl }
    );
    
    return true;
  }

  /**
   * Cache content search results
   * @param {string} searchQuery - Search query
   * @param {Object} filters - Search filters
   * @param {Array} results - Search results
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheContentSearch(searchQuery, filters, results, options = {}) {
    const ttl = options.ttl || this.config.searchTTL;
    
    // Create search key from query and filters
    const searchKey = this.generateSearchKey(searchQuery, filters);
    
    // Limit search results
    const limitedResults = results.slice(0, this.config.maxSearchResults);
    
    await this.cache.set(
      `${this.namespace}:search`,
      searchKey,
      {
        results: limitedResults,
        total_count: results.length,
        query: searchQuery,
        filters,
        cached_at: Date.now()
      },
      { ttl }
    );
    
    return true;
  }

  /**
   * Cache content moderation queue
   * @param {string} status - Moderation status (pending, approved, rejected)
   * @param {Array} contentQueue - Content in moderation queue
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheModerationQueue(status, contentQueue, options = {}) {
    const ttl = options.ttl || this.config.moderationTTL;
    
    await this.cache.set(
      `${this.namespace}:moderation`,
      status,
      contentQueue,
      { ttl }
    );
    
    // Cache moderation stats
    const moderationStats = {
      total_pending: status === 'pending' ? contentQueue.length : 0,
      oldest_pending: contentQueue.length > 0 ? 
        Math.min(...contentQueue.map(c => new Date(c.created_at).getTime())) : null,
      avg_processing_time: this.calculateAvgProcessingTime(contentQueue)
    };
    
    await this.cache.set(
      `${this.namespace}:moderation:stats`,
      status,
      moderationStats,
      { ttl }
    );
    
    return true;
  }

  /**
   * Cache content recommendations
   * @param {string} userId - User ID for personalized recommendations
   * @param {Array} recommendations - Recommended content
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheContentRecommendations(userId, recommendations, options = {}) {
    const ttl = options.ttl || this.config.recommendationTTL;
    
    if (!this.config.enableContentDiscovery) {
      return false;
    }
    
    // Limit recommendations
    const limitedRecommendations = recommendations.slice(0, this.config.maxRecommendations);
    
    await this.cache.set(
      `${this.namespace}:recommendations`,
      userId,
      {
        recommendations: limitedRecommendations,
        algorithm_version: this.config.discoveryAlgorithmVersion,
        generated_at: Date.now()
      },
      { ttl }
    );
    
    // Cache generic recommendations (not user-specific)
    await this.cache.set(
      `${this.namespace}:recommendations`,
      'generic',
      limitedRecommendations,
      { ttl }
    );
    
    return true;
  }

  /**
   * Cache content analytics
   * @param {string} contentId - Content ID
   * @param {Object} analytics - Analytics data
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheContentAnalytics(contentId, analytics, options = {}) {
    const ttl = options.ttl || this.config.analyticsTTL;
    
    await this.cache.set(
      `${this.namespace}:analytics`,
      contentId,
      analytics,
      { ttl }
    );
    
    // Cache key metrics separately
    const keyMetrics = {
      views_24h: analytics.views_24h,
      votes_24h: analytics.votes_24h,
      engagement_rate: analytics.engagement_rate,
      trending_score: analytics.trending_score
    };
    
    await this.cache.set(
      `${this.namespace}:metrics`,
      contentId,
      keyMetrics,
      { ttl: this.config.voteTTL } // Shorter TTL for real-time metrics
    );
    
    return true;
  }

  /**
   * Get methods for cached data
   */
  
  async getContentDetails(contentId) {
    return await this.cache.get(`${this.namespace}:details`, contentId);
  }
  
  async getContentSummary(contentId) {
    return await this.cache.get(`${this.namespace}:summary`, contentId);
  }
  
  async getContentVotes(contentId) {
    return await this.cache.get(`${this.namespace}:votes`, contentId);
  }
  
  async getUserVote(userId, contentId) {
    return await this.cache.get(`${this.namespace}:user:vote`, `${userId}:${contentId}`);
  }
  
  async getTrendingContent(timeframe, contentType = null) {
    if (contentType) {
      return await this.cache.get(`${this.namespace}:trending:${contentType}`, timeframe);
    }
    return await this.cache.get(`${this.namespace}:trending`, timeframe);
  }
  
  async getContentByTag(tag) {
    return await this.cache.get(`${this.namespace}:tag`, tag.toLowerCase());
  }
  
  async getPopularTags() {
    return await this.cache.get(`${this.namespace}:tags:popular`, 'global');
  }
  
  async getContentRecommendations(userId) {
    return await this.cache.get(`${this.namespace}:recommendations`, userId);
  }
  
  async getModerationQueue(status) {
    return await this.cache.get(`${this.namespace}:moderation`, status);
  }

  /**
   * Real-time vote updates
   * @param {string} contentId - Content ID
   * @param {number} voteDelta - Vote count change
   * @param {string} voteType - Type of vote (upvote, downvote)
   * @returns {Promise<void>}
   */
  async updateVoteCount(contentId, voteDelta, voteType) {
    if (!this.config.enableRealTimeVotes) return;
    
    try {
      const currentVotes = await this.cache.get(`${this.namespace}:votes`, contentId);
      if (currentVotes) {
        currentVotes.vote_count += voteDelta;
        
        if (voteType === 'upvote') {
          currentVotes.upvotes += voteDelta;
        } else if (voteType === 'downvote') {
          currentVotes.downvotes += voteDelta;
        }
        
        currentVotes.net_votes = currentVotes.upvotes - currentVotes.downvotes;
        currentVotes.vote_ratio = currentVotes.upvotes / Math.max(currentVotes.vote_count, 1);
        currentVotes.last_updated = Date.now();
        
        await this.cache.set(
          `${this.namespace}:votes`,
          contentId,
          currentVotes,
          { ttl: this.config.voteTTL }
        );
      }
    } catch (error) {
      // Ignore errors for real-time updates
    }
  }

  /**
   * Batch operations
   */
  
  async batchGetContentDetails(contentIds) {
    return await this.cache.getMultiple(`${this.namespace}:details`, contentIds);
  }
  
  async batchGetContentSummaries(contentIds) {
    return await this.cache.getMultiple(`${this.namespace}:summary`, contentIds);
  }
  
  async batchGetContentVotes(contentIds) {
    return await this.cache.getMultiple(`${this.namespace}:votes`, contentIds);
  }

  /**
   * Invalidation methods
   */
  
  async invalidateContentCache(contentId) {
    const patterns = [
      `${this.namespace}:details:${contentId}`,
      `${this.namespace}:summary:${contentId}`,
      `${this.namespace}:votes:${contentId}`,
      `${this.namespace}:analytics:${contentId}`,
      `${this.namespace}:metrics:${contentId}`,
      `${this.namespace}:user:vote:*:${contentId}`
    ];
    
    let totalInvalidated = 0;
    
    for (const pattern of patterns) {
      const invalidated = await this.cache.invalidatePattern('', pattern);
      totalInvalidated += invalidated;
    }
    
    // Invalidate trending and search caches
    await this.cache.triggerInvalidation(`${this.namespace}:details`, { contentId });
    
    return totalInvalidated;
  }
  
  async invalidateTrendingCache() {
    return await this.cache.invalidatePattern('', `${this.namespace}:trending:*`);
  }
  
  async invalidateTagCache(tag) {
    const normalizedTag = tag.toLowerCase();
    return await this.cache.delete(`${this.namespace}:tag`, normalizedTag);
  }
  
  async invalidateSearchCache() {
    return await this.cache.invalidatePattern('', `${this.namespace}:search:*`);
  }

  /**
   * Utility methods
   */
  
  generateSearchKey(query, filters) {
    const normalizedQuery = query.toLowerCase().trim();
    const sortedFilters = Object.keys(filters || {})
      .sort()
      .reduce((result, key) => {
        result[key] = filters[key];
        return result;
      }, {});
    
    const combined = `${normalizedQuery}:${JSON.stringify(sortedFilters)}`;
    
    // Hash long search keys
    if (combined.length > 100) {
      const crypto = require('crypto');
      return crypto.createHash('md5').update(combined).digest('hex');
    }
    
    return combined;
  }
  
  calculateAvgProcessingTime(contentQueue) {
    if (contentQueue.length === 0) return 0;
    
    const processed = contentQueue.filter(c => c.processed_at);
    if (processed.length === 0) return 0;
    
    const totalTime = processed.reduce((sum, content) => {
      const created = new Date(content.created_at).getTime();
      const processedAt = new Date(content.processed_at).getTime();
      return sum + (processedAt - created);
    }, 0);
    
    return Math.round(totalTime / processed.length / 1000 / 60); // minutes
  }

  /**
   * Content discovery helpers
   */
  
  async getCachedContentByCreator(creatorId, limit = 10) {
    // This would need to be implemented with a pattern search
    // For now, return empty array
    return [];
  }
  
  async getCachedSimilarContent(contentId, limit = 10) {
    // This would use content similarity algorithms
    // For now, return empty array
    return [];
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
let globalContentCache = null;

export function createContentCache(options = {}) {
  return new ContentCacheStrategy(options);
}

export function getContentCache(options = {}) {
  if (!globalContentCache) {
    globalContentCache = new ContentCacheStrategy(options);
  }
  return globalContentCache;
}

export default ContentCacheStrategy;