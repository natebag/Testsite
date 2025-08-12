/**
 * Content Ranking Algorithm Integration Examples - Sub-task 4.4
 * 
 * Integration examples showing how to use the MLG.clan content ranking algorithm
 * with the existing content API contracts, voting system, and platform components.
 * Demonstrates real-world usage patterns for the gaming community platform.
 * 
 * @author Claude Code - Production General Purpose Agent
 * @version 1.0.0
 */

import { 
  ContentRankingAlgorithm, 
  RankingModes, 
  GamingRankingUtils,
  ContentRecommendations,
  rankingModes,
  gamingRanking,
  recommendations
} from './content-ranking-algorithm.js';

import { ContentAPIClient } from '../api/content-api.contracts.js';
import { ContentValidator } from './content-validator.js';

/**
 * Content Discovery Service
 * Integrates ranking algorithm with content API for content discovery
 */
export class ContentDiscoveryService {
  constructor() {
    this.rankingAlgorithm = new ContentRankingAlgorithm();
    this.apiClient = new ContentAPIClient();
    this.validator = new ContentValidator();
    this.cache = new Map();
  }

  /**
   * Get trending content for MLG.clan homepage
   * @param {Object} options - Discovery options
   * @returns {Promise<Object>} Trending content response
   */
  async getTrendingContent(options = {}) {
    try {
      const {
        game = null,
        timeWindow = 24,
        limit = 20,
        platform = null,
        category = null
      } = options;

      // Fetch raw content from API
      const contentResponse = await this.apiClient.getContentList({
        limit: limit * 3, // Get more to rank and filter
        sortBy: 'created_at',
        sortOrder: 'desc',
        game,
        platform,
        category,
        status: 'published'
      });

      if (!contentResponse.success) {
        throw new Error('Failed to fetch content');
      }

      // Rank content using trending algorithm
      const rankedContent = this.rankingAlgorithm.rankContent(
        contentResponse.data.content, 
        {
          mode: 'trending',
          timeWindowHours: timeWindow,
          limit
        }
      );

      return {
        success: true,
        data: {
          trending: rankedContent,
          metadata: {
            timeWindow,
            totalCandidates: contentResponse.data.content.length,
            algorithm: 'MLG.clan Trending v1.0',
            generatedAt: new Date().toISOString()
          }
        }
      };

    } catch (error) {
      console.error('Trending content error:', error);
      return {
        success: false,
        error: 'DISCOVERY_001',
        message: 'Failed to get trending content'
      };
    }
  }

  /**
   * Get personalized content feed for user
   * @param {string} userId - User ID
   * @param {Object} userProfile - User preferences and history
   * @param {Object} options - Feed options
   * @returns {Promise<Object>} Personalized feed
   */
  async getPersonalizedFeed(userId, userProfile, options = {}) {
    try {
      const cacheKey = `feed:${userId}:${JSON.stringify(options)}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      // Get content based on user's preferred games and platforms
      const contentFilters = {
        limit: 100,
        game: userProfile.preferredGames?.join(','),
        platform: userProfile.preferredPlatforms?.join(','),
        status: 'published'
      };

      const contentResponse = await this.apiClient.getContentList(contentFilters);
      if (!contentResponse.success) {
        throw new Error('Failed to fetch content for personalization');
      }

      // Get personalized recommendations
      const personalizedContent = recommendations.getPersonalizedRecommendations(
        userProfile,
        contentResponse.data.content,
        { ...options, limit: options.limit || 20 }
      );

      const result = {
        success: true,
        data: {
          personalizedFeed: personalizedContent,
          userProfile: {
            preferredGames: userProfile.preferredGames,
            preferredPlatforms: userProfile.preferredPlatforms,
            contentTypes: userProfile.preferences?.contentTypes
          },
          metadata: {
            algorithm: 'MLG.clan Personalization v1.0',
            generatedAt: new Date().toISOString(),
            basedOn: 'User preferences and behavior'
          }
        }
      };

      // Cache for 5 minutes
      this.cache.set(cacheKey, result);
      setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000);

      return result;

    } catch (error) {
      console.error('Personalized feed error:', error);
      return {
        success: false,
        error: 'DISCOVERY_002',
        message: 'Failed to generate personalized feed'
      };
    }
  }

  /**
   * Get game-specific leaderboard
   * @param {string} game - Game identifier
   * @param {Object} options - Leaderboard options
   * @returns {Promise<Object>} Game leaderboard
   */
  async getGameLeaderboard(game, options = {}) {
    try {
      const {
        timeframe = 'week', // day, week, month, all
        limit = 50,
        category = null
      } = options;

      // Calculate time window
      let timeWindowHours;
      switch (timeframe) {
        case 'day': timeWindowHours = 24; break;
        case 'week': timeWindowHours = 168; break;
        case 'month': timeWindowHours = 720; break;
        default: timeWindowHours = null; // all time
      }

      // Get game-specific content
      const contentResponse = await this.apiClient.getContentList({
        game,
        category,
        limit: limit * 2,
        status: 'published'
      });

      if (!contentResponse.success) {
        throw new Error('Failed to fetch game content');
      }

      // Rank content for the game
      const rankedContent = gamingRanking.getGameSpecificTrending(
        contentResponse.data.content,
        game,
        { timeWindowHours, limit }
      );

      // Calculate creator leaderboard
      const creatorStats = this.calculateCreatorLeaderboard(rankedContent);

      return {
        success: true,
        data: {
          game,
          timeframe,
          topContent: rankedContent,
          topCreators: creatorStats,
          metadata: {
            totalContent: contentResponse.data.content.length,
            algorithm: 'MLG.clan Game Leaderboard v1.0',
            generatedAt: new Date().toISOString()
          }
        }
      };

    } catch (error) {
      console.error('Game leaderboard error:', error);
      return {
        success: false,
        error: 'DISCOVERY_003',
        message: 'Failed to generate game leaderboard'
      };
    }
  }

  /**
   * Get competitive esports content
   * @param {Object} options - Esports options
   * @returns {Promise<Object>} Competitive content
   */
  async getCompetitiveContent(options = {}) {
    try {
      const {
        game = null,
        tournament = null,
        limit = 30
      } = options;

      // Get content with competitive tags
      const contentResponse = await this.apiClient.getContentList({
        game,
        category: 'tournament',
        tags: 'esports,competitive,tournament,championship',
        limit: limit * 2,
        status: 'published',
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      if (!contentResponse.success) {
        throw new Error('Failed to fetch competitive content');
      }

      // Use competitive ranking
      const rankedContent = gamingRanking.getCompetitiveContent(
        contentResponse.data.content,
        { limit }
      );

      return {
        success: true,
        data: {
          competitiveContent: rankedContent,
          metadata: {
            contentType: 'competitive',
            totalCandidates: contentResponse.data.content.length,
            algorithm: 'MLG.clan Competitive Ranking v1.0',
            generatedAt: new Date().toISOString()
          }
        }
      };

    } catch (error) {
      console.error('Competitive content error:', error);
      return {
        success: false,
        error: 'DISCOVERY_004',
        message: 'Failed to get competitive content'
      };
    }
  }

  /**
   * Calculate creator leaderboard from ranked content
   * @param {Array} rankedContent - Ranked content list
   * @returns {Array} Creator statistics
   */
  calculateCreatorLeaderboard(rankedContent) {
    const creatorStats = {};

    rankedContent.forEach((content, index) => {
      const creatorId = content.userId;
      if (!creatorStats[creatorId]) {
        creatorStats[creatorId] = {
          userId: creatorId,
          creator: content.creator,
          totalScore: 0,
          contentCount: 0,
          averageRank: 0,
          bestRank: Infinity,
          totalViews: 0,
          totalLikes: 0,
          totalMLGTokens: 0
        };
      }

      const stats = creatorStats[creatorId];
      stats.totalScore += content.rankingScore || 0;
      stats.contentCount += 1;
      stats.averageRank = ((stats.averageRank * (stats.contentCount - 1)) + (index + 1)) / stats.contentCount;
      stats.bestRank = Math.min(stats.bestRank, index + 1);
      stats.totalViews += content.views || 0;
      stats.totalLikes += content.likes || 0;
      stats.totalMLGTokens += content.mlgVotes?.totalTokensBurned || 0;
    });

    // Convert to array and sort by total score
    return Object.values(creatorStats)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 10); // Top 10 creators
  }
}

/**
 * Real-time Content Scoring Service
 * Handles real-time score updates for high-traffic content
 */
export class RealTimeContentScoring {
  constructor() {
    this.rankingAlgorithm = new ContentRankingAlgorithm();
    this.activeContentIds = new Set();
    this.scoreUpdateInterval = null;
    this.subscribers = new Map();
  }

  /**
   * Start real-time scoring for high-traffic content
   * @param {Array} contentIds - Content IDs to monitor
   */
  startRealTimeScoring(contentIds) {
    contentIds.forEach(id => this.activeContentIds.add(id));

    if (!this.scoreUpdateInterval) {
      this.scoreUpdateInterval = setInterval(
        () => this.updateRealTimeScores(),
        60000 // Update every minute
      );
    }
  }

  /**
   * Subscribe to real-time score updates
   * @param {string} contentId - Content ID to subscribe to
   * @param {Function} callback - Callback function for updates
   */
  subscribeToScoreUpdates(contentId, callback) {
    if (!this.subscribers.has(contentId)) {
      this.subscribers.set(contentId, new Set());
    }
    this.subscribers.get(contentId).add(callback);
  }

  /**
   * Update real-time scores for active content
   */
  async updateRealTimeScores() {
    try {
      const contentIds = Array.from(this.activeContentIds);
      if (contentIds.length === 0) return;

      const scores = await this.rankingAlgorithm.getRealTimeScores(contentIds);

      // Notify subscribers of score updates
      for (const [contentId, scoreResult] of Object.entries(scores)) {
        const subscribers = this.subscribers.get(contentId);
        if (subscribers) {
          subscribers.forEach(callback => {
            try {
              callback(scoreResult);
            } catch (error) {
              console.error('Real-time score callback error:', error);
            }
          });
        }
      }

    } catch (error) {
      console.error('Real-time scoring error:', error);
    }
  }

  /**
   * Stop real-time scoring
   */
  stopRealTimeScoring() {
    if (this.scoreUpdateInterval) {
      clearInterval(this.scoreUpdateInterval);
      this.scoreUpdateInterval = null;
    }
    this.activeContentIds.clear();
    this.subscribers.clear();
  }
}

/**
 * MLG Token Voting Integration
 * Integrates ranking algorithm with MLG token voting system
 */
export class MLGVotingRankingIntegration {
  constructor() {
    this.rankingAlgorithm = new ContentRankingAlgorithm();
    this.apiClient = new ContentAPIClient();
  }

  /**
   * Handle new vote and update content ranking
   * @param {string} contentId - Content ID that received vote
   * @param {Object} voteData - Vote data from MLG token transaction
   * @returns {Promise<Object>} Updated ranking information
   */
  async handleNewVote(contentId, voteData) {
    try {
      // Submit vote through API
      const voteResponse = await this.apiClient.submitVote(contentId, voteData);
      if (!voteResponse.success) {
        throw new Error('Failed to submit vote');
      }

      // Get updated content data
      const contentResponse = await this.apiClient.getContentList({
        contentId,
        includeAnalytics: true
      });

      if (!contentResponse.success || contentResponse.data.content.length === 0) {
        throw new Error('Failed to fetch updated content');
      }

      const updatedContent = contentResponse.data.content[0];

      // Recalculate ranking score with fresh data
      const scoreResult = this.rankingAlgorithm.calculateContentScore(
        updatedContent,
        { forceRecalculate: true }
      );

      // Check if content should be promoted to trending
      const shouldTrend = this.shouldPromoteToTrending(scoreResult, voteData);

      return {
        success: true,
        data: {
          contentId,
          newScore: scoreResult,
          voteData: voteResponse.data.vote,
          shouldTrend,
          rankingChange: this.calculateRankingChange(contentId, scoreResult)
        }
      };

    } catch (error) {
      console.error('Vote ranking integration error:', error);
      return {
        success: false,
        error: 'VOTE_RANKING_001',
        message: 'Failed to update content ranking after vote'
      };
    }
  }

  /**
   * Get vote impact analysis
   * @param {string} contentId - Content ID
   * @param {Object} voteData - Vote data
   * @returns {Object} Vote impact analysis
   */
  getVoteImpactAnalysis(contentId, voteData) {
    const tokensBurned = voteData.tokenAmount || 0;
    const voteType = voteData.voteType;

    // Calculate expected score impact
    const expectedImpact = this.calculateExpectedScoreImpact(tokensBurned, voteType);

    return {
      tokensBurned,
      voteType,
      expectedScoreImpact: expectedImpact,
      communityImpact: this.assessCommunityImpact(tokensBurned),
      rankingImpact: this.assessRankingImpact(expectedImpact)
    };
  }

  /**
   * Determine if content should be promoted to trending
   * @param {Object} scoreResult - Ranking score result
   * @param {Object} voteData - Vote data
   * @returns {boolean} Whether content should trend
   */
  shouldPromoteToTrending(scoreResult, voteData) {
    const { compositeScore, components } = scoreResult;

    // High score threshold
    if (compositeScore > 80) return true;

    // Recent high-token vote activity
    if (voteData.tokenAmount >= 3 && components.time > 0.8) return true;

    // High engagement velocity
    if (components.votes > 50 && components.engagement > 30) return true;

    return false;
  }

  /**
   * Calculate expected score impact from vote
   * @param {number} tokensBurned - MLG tokens burned
   * @param {string} voteType - Vote type
   * @returns {number} Expected score impact
   */
  calculateExpectedScoreImpact(tokensBurned, voteType) {
    const baseImpact = voteType === 'upvote' ? 1.0 : (voteType === 'downvote' ? -0.5 : 3.0);
    
    // Apply token multiplier
    let tokenMultiplier = 1.0;
    if (tokensBurned >= 4) tokenMultiplier = 2.5;
    else if (tokensBurned >= 3) tokenMultiplier = 2.0;
    else if (tokensBurned >= 2) tokenMultiplier = 1.5;
    
    return baseImpact * tokenMultiplier;
  }

  /**
   * Assess community impact of vote
   * @param {number} tokensBurned - Tokens burned
   * @returns {string} Impact level
   */
  assessCommunityImpact(tokensBurned) {
    if (tokensBurned >= 4) return 'high';
    if (tokensBurned >= 2) return 'medium';
    return 'low';
  }

  /**
   * Assess ranking impact
   * @param {number} expectedImpact - Expected score impact
   * @returns {string} Ranking impact level
   */
  assessRankingImpact(expectedImpact) {
    if (Math.abs(expectedImpact) >= 5) return 'significant';
    if (Math.abs(expectedImpact) >= 2) return 'moderate';
    return 'minimal';
  }

  /**
   * Calculate ranking change (mock implementation)
   * @param {string} contentId - Content ID
   * @param {Object} scoreResult - New score result
   * @returns {Object} Ranking change info
   */
  calculateRankingChange(contentId, scoreResult) {
    // In a real implementation, this would compare with previous rankings
    return {
      previousRank: null,
      newRank: null,
      change: 0,
      direction: 'stable'
    };
  }
}

/**
 * Content Analytics Dashboard Integration
 * Provides analytics data using ranking algorithm insights
 */
export class ContentAnalyticsDashboard {
  constructor() {
    this.rankingAlgorithm = new ContentRankingAlgorithm();
    this.discoveryService = new ContentDiscoveryService();
  }

  /**
   * Get comprehensive content analytics
   * @param {string} contentId - Content ID
   * @returns {Promise<Object>} Analytics dashboard data
   */
  async getContentAnalytics(contentId) {
    try {
      // Get content data with analytics
      const apiClient = new ContentAPIClient();
      const contentResponse = await apiClient.getContentList({
        contentId,
        includeAnalytics: true,
        includeComments: true
      });

      if (!contentResponse.success) {
        throw new Error('Failed to fetch content analytics');
      }

      const content = contentResponse.data.content[0];
      if (!content) {
        throw new Error('Content not found');
      }

      // Calculate current ranking score
      const scoreResult = this.rankingAlgorithm.calculateContentScore(content, {
        mode: 'hot'
      });

      // Get performance across different ranking modes
      const performanceAcrossModes = await this.getPerformanceAcrossModes(content);

      // Get similar content performance
      const similarContentAnalysis = await this.getSimilarContentAnalysis(content);

      return {
        success: true,
        data: {
          content,
          currentScore: scoreResult,
          performanceAcrossModes,
          similarContentAnalysis,
          optimizationSuggestions: this.generateOptimizationSuggestions(scoreResult),
          trendingPotential: this.assessTrendingPotential(content, scoreResult),
          communityEngagement: this.analyzeEngagementPatterns(content),
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Content analytics error:', error);
      return {
        success: false,
        error: 'ANALYTICS_001',
        message: 'Failed to generate content analytics'
      };
    }
  }

  /**
   * Get content performance across different ranking modes
   * @param {Object} content - Content object
   * @returns {Promise<Object>} Performance across modes
   */
  async getPerformanceAcrossModes(content) {
    const modes = ['trending', 'hot', 'top', 'new'];
    const performance = {};

    for (const mode of modes) {
      const scoreResult = this.rankingAlgorithm.calculateContentScore(content, { mode });
      performance[mode] = {
        score: scoreResult.compositeScore,
        normalizedScore: scoreResult.normalizedScore,
        rank: null, // Would calculate actual rank in real implementation
        insights: scoreResult.insights
      };
    }

    return performance;
  }

  /**
   * Analyze similar content performance
   * @param {Object} content - Content object
   * @returns {Promise<Object>} Similar content analysis
   */
  async getSimilarContentAnalysis(content) {
    // Mock implementation - would fetch similar content
    return {
      averageScore: 45.2,
      percentileRank: 78,
      comparisonInsights: [
        'Performing better than 78% of similar content',
        'Strong engagement rate for this content category',
        'Potential for trending based on similar content patterns'
      ]
    };
  }

  /**
   * Generate optimization suggestions
   * @param {Object} scoreResult - Score result object
   * @returns {Array} Optimization suggestions
   */
  generateOptimizationSuggestions(scoreResult) {
    const suggestions = [];
    const { components } = scoreResult;

    if (components.engagement < 20) {
      suggestions.push({
        category: 'engagement',
        priority: 'high',
        suggestion: 'Improve engagement by adding compelling thumbnails and descriptions',
        expectedImpact: 'medium'
      });
    }

    if (components.votes < 10) {
      suggestions.push({
        category: 'votes',
        priority: 'high',
        suggestion: 'Encourage community voting by engaging with comments and sharing on social media',
        expectedImpact: 'high'
      });
    }

    if (components.gaming < 1.2) {
      suggestions.push({
        category: 'gaming',
        priority: 'medium',
        suggestion: 'Add more gaming-specific tags and improve competitive relevance',
        expectedImpact: 'medium'
      });
    }

    return suggestions;
  }

  /**
   * Assess trending potential
   * @param {Object} content - Content object
   * @param {Object} scoreResult - Score result
   * @returns {Object} Trending potential assessment
   */
  assessTrendingPotential(content, scoreResult) {
    const ageHours = (new Date() - new Date(content.createdAt)) / (1000 * 60 * 60);
    const { compositeScore, components } = scoreResult;

    let potential = 'low';
    let reasoning = [];

    if (ageHours < 6 && compositeScore > 50) {
      potential = 'high';
      reasoning.push('Recent content with strong initial performance');
    } else if (components.votes > 30 && components.engagement > 25) {
      potential = 'medium';
      reasoning.push('Good community engagement indicators');
    }

    if (components.gaming > 1.5) {
      reasoning.push('High gaming community relevance');
    }

    return {
      potential,
      confidence: potential === 'high' ? 0.85 : (potential === 'medium' ? 0.65 : 0.3),
      reasoning,
      timeToTrend: potential === 'high' ? '2-4 hours' : (potential === 'medium' ? '6-12 hours' : 'unlikely')
    };
  }

  /**
   * Analyze engagement patterns
   * @param {Object} content - Content object
   * @returns {Object} Engagement analysis
   */
  analyzeEngagementPatterns(content) {
    const totalViews = content.views || 0;
    const totalLikes = content.likes || 0;
    const totalComments = content.comments || 0;
    const totalShares = content.shares || 0;

    const engagementRate = totalViews > 0 ? 
      (totalLikes + totalComments + totalShares) / totalViews : 0;

    let pattern = 'low';
    if (engagementRate > 0.15) pattern = 'viral';
    else if (engagementRate > 0.08) pattern = 'high';
    else if (engagementRate > 0.04) pattern = 'moderate';

    return {
      pattern,
      engagementRate: Math.round(engagementRate * 10000) / 100, // Percentage
      breakdown: {
        likeRate: totalViews > 0 ? (totalLikes / totalViews) * 100 : 0,
        commentRate: totalViews > 0 ? (totalComments / totalViews) * 100 : 0,
        shareRate: totalViews > 0 ? (totalShares / totalViews) * 100 : 0
      },
      mlgTokenEngagement: {
        averageTokensPerVote: content.mlgVotes?.totalTokensBurned ? 
          content.mlgVotes.totalTokensBurned / 
          ((content.mlgVotes.upvotes || 0) + (content.mlgVotes.downvotes || 0) + (content.mlgVotes.superVotes || 0)) : 0,
        tokenEngagementLevel: this.assessTokenEngagement(content.mlgVotes)
      }
    };
  }

  /**
   * Assess MLG token engagement level
   * @param {Object} mlgVotes - MLG vote data
   * @returns {string} Token engagement level
   */
  assessTokenEngagement(mlgVotes) {
    if (!mlgVotes) return 'none';
    
    const totalTokens = mlgVotes.totalTokensBurned || 0;
    const totalVotes = (mlgVotes.upvotes || 0) + (mlgVotes.downvotes || 0) + (mlgVotes.superVotes || 0);
    
    if (totalTokens === 0) return 'none';
    
    const avgTokensPerVote = totalTokens / totalVotes;
    
    if (avgTokensPerVote >= 3) return 'high';
    if (avgTokensPerVote >= 2) return 'medium';
    return 'low';
  }

  /**
   * Export analytics data for external use
   * @param {Array} contentIds - Content IDs to analyze
   * @returns {Promise<Object>} Exported analytics data
   */
  async exportAnalyticsData(contentIds) {
    const results = [];

    for (const contentId of contentIds) {
      const analytics = await this.getContentAnalytics(contentId);
      if (analytics.success) {
        results.push({
          contentId,
          ...analytics.data
        });
      }
    }

    return {
      success: true,
      data: {
        analytics: results,
        summary: this.generateAnalyticsSummary(results),
        exportedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Generate summary of analytics data
   * @param {Array} analyticsResults - Analytics results
   * @returns {Object} Analytics summary
   */
  generateAnalyticsSummary(analyticsResults) {
    if (analyticsResults.length === 0) {
      return { totalContent: 0 };
    }

    const totalContent = analyticsResults.length;
    const averageScore = analyticsResults.reduce((sum, result) => 
      sum + result.currentScore.normalizedScore, 0) / totalContent;

    const trendingPotential = analyticsResults.filter(result => 
      result.trendingPotential.potential === 'high').length;

    const highEngagement = analyticsResults.filter(result => 
      result.communityEngagement.pattern === 'high' || 
      result.communityEngagement.pattern === 'viral').length;

    return {
      totalContent,
      averageScore: Math.round(averageScore * 100) / 100,
      trendingCandidates: trendingPotential,
      highEngagementContent: highEngagement,
      performanceTrends: 'stable' // Would calculate actual trends
    };
  }
}

/**
 * Usage Examples and Demo Functions
 */
export class RankingUsageExamples {
  /**
   * Example: Get trending gaming content for homepage
   */
  static async getTrendingForHomepage() {
    const discoveryService = new ContentDiscoveryService();
    
    const trending = await discoveryService.getTrendingContent({
      timeWindow: 24,
      limit: 10,
      game: null // All games
    });

    console.log('Trending Content:', trending);
    return trending;
  }

  /**
   * Example: Get personalized feed for user
   */
  static async getPersonalizedFeedExample() {
    const discoveryService = new ContentDiscoveryService();
    
    const userProfile = {
      preferredGames: ['fortnite', 'valorant', 'apex-legends'],
      preferredPlatforms: ['pc', 'xbox'],
      preferences: {
        contentTypes: {
          'highlights': 1.2,
          'tutorials': 1.1,
          'funny': 0.9
        }
      }
    };

    const feed = await discoveryService.getPersonalizedFeed(
      'user-123', 
      userProfile, 
      { limit: 20 }
    );

    console.log('Personalized Feed:', feed);
    return feed;
  }

  /**
   * Example: Handle MLG token vote and update rankings
   */
  static async handleVoteExample() {
    const votingIntegration = new MLGVotingRankingIntegration();
    
    const voteData = {
      userId: 'user-456',
      voteType: 'upvote',
      tokenAmount: 3,
      transactionSignature: '5J8QvU7snqjBxNqVQhGjPFzQFzQYU7snqjBxNqVQhGjPFzQFzQY',
      walletSignature: {
        signature: 'vote-signature',
        message: 'MLG.clan Vote Verification',
        publicKey: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL'
      }
    };

    const result = await votingIntegration.handleNewVote('content-123', voteData);
    
    console.log('Vote Impact:', result);
    return result;
  }

  /**
   * Example: Get content analytics dashboard
   */
  static async getAnalyticsExample() {
    const analyticsService = new ContentAnalyticsDashboard();
    
    const analytics = await analyticsService.getContentAnalytics('content-123');
    
    console.log('Content Analytics:', analytics);
    return analytics;
  }

  /**
   * Example: Real-time scoring setup
   */
  static setupRealTimeScoring() {
    const realTimeScoring = new RealTimeContentScoring();
    
    // Start monitoring high-traffic content
    realTimeScoring.startRealTimeScoring(['content-viral-1', 'content-viral-2']);
    
    // Subscribe to score updates
    realTimeScoring.subscribeToScoreUpdates('content-viral-1', (scoreResult) => {
      console.log('Real-time score update:', scoreResult);
      // Update UI or trigger notifications
    });
    
    console.log('Real-time scoring started');
    return realTimeScoring;
  }
}

// Export all integration services
export {
  ContentDiscoveryService,
  RealTimeContentScoring,
  MLGVotingRankingIntegration,
  ContentAnalyticsDashboard,
  RankingUsageExamples
};

// Export default discovery service instance
export default new ContentDiscoveryService();