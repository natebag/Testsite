/**
 * MLG.clan Content Ranking Algorithm - Sub-task 4.4
 * 
 * Sophisticated multi-factor ranking system for the MLG.clan gaming platform
 * that calculates content scores based on votes, engagement, and platform-specific metrics.
 * Integrates with the MLG token voting system (burn-to-vote) and gaming community behavior.
 * 
 * Features:
 * - Multi-factor ranking calculation (votes, engagement, time decay, gaming factors)
 * - MLG token vote weighting with progressive pricing support (1,2,3,4 MLG tokens)
 * - Different ranking modes (trending, hot, top, new, controversial)
 * - Gaming-specific scoring (skill level, competitive relevance, game popularity)
 * - User reputation influence (clan status, achievement level)
 * - Performance optimization with caching and batch processing
 * - Real-time score updates and A/B testing support
 * - Gaming platform cross-referencing and esports content boost
 * 
 * @author Claude Code - Production General Purpose Agent
 * @version 1.0.0
 */

/**
 * Content Ranking Configuration
 */
export const RANKING_CONFIG = {
  // Base scoring weights
  SCORING_WEIGHTS: {
    // Vote-based scoring (50% of total score)
    VOTES: {
      UPVOTE: 1.0,
      DOWNVOTE: -0.5,
      SUPER_VOTE: 3.0, // MLG token super votes have higher impact
      MLG_TOKEN_MULTIPLIER: {
        1: 1.0,  // 1 MLG token vote
        2: 1.5,  // 2 MLG token vote (50% bonus)
        3: 2.0,  // 3 MLG token vote (100% bonus)
        4: 2.5   // 4 MLG token vote (150% bonus)
      },
      VOTE_VELOCITY_BONUS: 0.3, // Bonus for rapid voting
      VOTE_DIVERSITY_BONUS: 0.2  // Bonus for votes from diverse users
    },
    
    // Engagement metrics (30% of total score)
    ENGAGEMENT: {
      VIEWS: 0.1,
      LIKES: 1.0,
      COMMENTS: 2.0,
      SHARES: 3.0,
      BOOKMARKS: 1.5,
      CLICK_THROUGH_RATE: 5.0,
      WATCH_TIME_RATIO: 4.0, // For video content
      COMPLETION_RATE: 3.0
    },
    
    // Time decay factors (10% of total score)
    TIME_DECAY: {
      TRENDING_HALFLIFE_HOURS: 6,   // Content loses 50% trending power every 6 hours
      HOT_HALFLIFE_HOURS: 12,       // Content loses 50% hot power every 12 hours
      FRESHNESS_BONUS_HOURS: 2,     // New content gets bonus in first 2 hours
      EVERGREEN_THRESHOLD_DAYS: 7   // Content older than 7 days uses evergreen scoring
    },
    
    // Gaming-specific factors (10% of total score)
    GAMING_FACTORS: {
      SKILL_LEVEL: {
        'beginner': 0.8,
        'intermediate': 1.0,
        'advanced': 1.3,
        'expert': 1.5,
        'professional': 2.0
      },
      COMPETITIVE_RELEVANCE: {
        'casual': 0.9,
        'ranked': 1.2,
        'tournament': 1.5,
        'esports': 2.0
      },
      GAME_POPULARITY: {
        // Multipliers based on current game popularity
        'fortnite': 1.3,
        'call-of-duty': 1.2,
        'valorant': 1.2,
        'apex-legends': 1.1,
        'league-of-legends': 1.1,
        'counter-strike': 1.0,
        'overwatch': 1.0,
        'rocket-league': 0.9
      },
      CONTENT_TYPE: {
        'tournament': 1.5,
        'highlights': 1.2,
        'tutorials': 1.1,
        'reviews': 1.0,
        'funny': 0.9
      }
    }
  },
  
  // Ranking mode configurations
  RANKING_MODES: {
    TRENDING: {
      timeWeight: 0.6,
      engagementWeight: 0.3,
      voteWeight: 0.1,
      timeWindowHours: 24,
      description: 'Content with high recent engagement and velocity'
    },
    HOT: {
      timeWeight: 0.4,
      engagementWeight: 0.4,
      voteWeight: 0.2,
      timeWindowHours: 48,
      description: 'Content with sustained high engagement recently'
    },
    TOP: {
      timeWeight: 0.1,
      engagementWeight: 0.4,
      voteWeight: 0.5,
      timeWindowHours: null, // All time
      description: 'Highest quality content of all time'
    },
    NEW: {
      timeWeight: 0.8,
      engagementWeight: 0.1,
      voteWeight: 0.1,
      timeWindowHours: 72,
      qualityThreshold: 0.3, // Minimum quality score to appear
      description: 'Recent content with basic quality filter'
    },
    CONTROVERSIAL: {
      timeWeight: 0.2,
      engagementWeight: 0.3,
      voteWeight: 0.5,
      controversyWeight: 0.4, // Special factor for controversial content
      timeWindowHours: 168, // 1 week
      description: 'Content with high engagement but mixed voting sentiment'
    }
  },
  
  // User reputation factors
  USER_REPUTATION: {
    CLAN_STATUS: {
      'member': 1.0,
      'officer': 1.1,
      'leader': 1.2,
      'founder': 1.3,
      'verified': 1.5
    },
    ACHIEVEMENT_LEVEL: {
      'bronze': 1.0,
      'silver': 1.05,
      'gold': 1.1,
      'platinum': 1.15,
      'diamond': 1.2,
      'master': 1.25,
      'grandmaster': 1.3
    },
    GAMERSCORE_MULTIPLIER: {
      threshold: 1000,
      maxMultiplier: 1.5,
      scalingFactor: 0.0001 // Logarithmic scaling
    }
  },
  
  // Caching configuration
  CACHE: {
    SCORE_TTL_SECONDS: 300,        // Cache scores for 5 minutes
    BATCH_SIZE: 100,               // Process in batches of 100
    REAL_TIME_THRESHOLD: 10000,    // Real-time updates for content with >10k views
    BACKGROUND_UPDATE_INTERVAL: 60 // Update scores every minute in background
  },
  
  // A/B testing configuration
  AB_TESTING: {
    ENABLED: true,
    TEST_GROUPS: ['control', 'variant_a', 'variant_b'],
    WEIGHT_VARIATIONS: {
      control: { votes: 1.0, engagement: 1.0, time: 1.0 },
      variant_a: { votes: 1.2, engagement: 0.9, time: 0.9 },
      variant_b: { votes: 0.9, engagement: 1.2, time: 0.9 }
    }
  }
};

/**
 * Main Content Ranking Algorithm Class
 */
export class ContentRankingAlgorithm {
  constructor(config = {}) {
    this.config = { ...RANKING_CONFIG, ...config };
    this.scoreCache = new Map();
    this.batchQueue = [];
    this.isProcessingBatch = false;
    
    // Performance monitoring
    this.metrics = {
      calculationsPerformed: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageCalculationTime: 0,
      lastUpdateTime: null
    };
    
    // Start background processing
    if (typeof setInterval !== 'undefined') {
      this.startBackgroundProcessing();
    }
  }
  
  /**
   * Calculate comprehensive content score
   * @param {Object} content - Content object with all metadata
   * @param {Object} options - Calculation options
   * @returns {Object} Detailed scoring result
   */
  calculateContentScore(content, options = {}) {
    const startTime = performance.now();
    
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(content, options);
      if (this.scoreCache.has(cacheKey) && !options.forceRecalculate) {
        this.metrics.cacheHits++;
        return this.scoreCache.get(cacheKey);
      }
      
      this.metrics.cacheMisses++;
      
      // Calculate individual score components
      const voteScore = this.calculateVoteScore(content);
      const engagementScore = this.calculateEngagementScore(content);
      const timeScore = this.calculateTimeScore(content, options.mode);
      const gamingScore = this.calculateGamingScore(content);
      const userReputationScore = this.calculateUserReputationScore(content);
      const controversyScore = this.calculateControversyScore(content);
      
      // Apply mode-specific weighting
      const modeWeights = this.getModeWeights(options.mode || 'hot');
      
      // Calculate final composite score
      const compositeScore = this.calculateCompositeScore({
        voteScore,
        engagementScore,
        timeScore,
        gamingScore,
        userReputationScore,
        controversyScore
      }, modeWeights, options);
      
      // Generate detailed result
      const result = {
        contentId: content.id,
        compositeScore: Math.max(0, compositeScore), // Ensure non-negative
        normalizedScore: this.normalizeScore(compositeScore), // 0-100 scale
        components: {
          votes: voteScore,
          engagement: engagementScore,
          time: timeScore,
          gaming: gamingScore,
          reputation: userReputationScore,
          controversy: controversyScore
        },
        metadata: {
          mode: options.mode || 'hot',
          calculatedAt: new Date().toISOString(),
          version: '1.0.0',
          abTestGroup: this.getABTestGroup(content)
        },
        insights: this.generateScoreInsights(content, {
          voteScore, engagementScore, timeScore, 
          gamingScore, userReputationScore, controversyScore
        })
      };
      
      // Cache the result
      this.scoreCache.set(cacheKey, result);
      setTimeout(() => this.scoreCache.delete(cacheKey), 
        this.config.CACHE.SCORE_TTL_SECONDS * 1000);
      
      // Update metrics
      const calculationTime = performance.now() - startTime;
      this.updateMetrics(calculationTime);
      
      return result;
      
    } catch (error) {
      console.error('Content scoring error:', error);
      return this.getDefaultScore(content);
    }
  }
  
  /**
   * Calculate vote-based score with MLG token weighting
   * @param {Object} content - Content object
   * @returns {number} Vote score
   */
  calculateVoteScore(content) {
    const votes = content.mlgVotes || {};
    const weights = this.config.SCORING_WEIGHTS.VOTES;
    
    // Base vote score
    let voteScore = 0;
    voteScore += (votes.upvotes || 0) * weights.UPVOTE;
    voteScore += (votes.downvotes || 0) * weights.DOWNVOTE;
    voteScore += (votes.superVotes || 0) * weights.SUPER_VOTE;
    
    // MLG token weighting based on progressive pricing
    const tokensBurned = votes.totalTokensBurned || 0;
    if (tokensBurned > 0) {
      // Calculate token multiplier based on burned amount
      const avgTokensPerVote = tokensBurned / Math.max(1, 
        (votes.upvotes || 0) + (votes.downvotes || 0) + (votes.superVotes || 0));
      
      // Apply progressive token multiplier
      let tokenMultiplier = 1.0;
      if (avgTokensPerVote >= 4) tokenMultiplier = weights.MLG_TOKEN_MULTIPLIER[4];
      else if (avgTokensPerVote >= 3) tokenMultiplier = weights.MLG_TOKEN_MULTIPLIER[3];
      else if (avgTokensPerVote >= 2) tokenMultiplier = weights.MLG_TOKEN_MULTIPLIER[2];
      else tokenMultiplier = weights.MLG_TOKEN_MULTIPLIER[1];
      
      voteScore *= tokenMultiplier;
    }
    
    // Vote velocity bonus (votes received in short time period)
    const voteVelocity = this.calculateVoteVelocity(content);
    if (voteVelocity > 5) { // More than 5 votes per hour
      voteScore *= (1 + weights.VOTE_VELOCITY_BONUS);
    }
    
    // Vote diversity bonus (votes from different types of users)
    const voteDiversity = this.calculateVoteDiversity(content);
    voteScore *= (1 + (voteDiversity * weights.VOTE_DIVERSITY_BONUS));
    
    return Math.max(0, voteScore);
  }
  
  /**
   * Calculate engagement-based score
   * @param {Object} content - Content object
   * @returns {number} Engagement score
   */
  calculateEngagementScore(content) {
    const weights = this.config.SCORING_WEIGHTS.ENGAGEMENT;
    const analytics = content.analytics || {};
    
    let engagementScore = 0;
    
    // Basic engagement metrics
    engagementScore += (content.views || 0) * weights.VIEWS;
    engagementScore += (content.likes || 0) * weights.LIKES;
    engagementScore += (content.comments || 0) * weights.COMMENTS;
    engagementScore += (content.shares || 0) * weights.SHARES;
    
    // Advanced engagement metrics
    if (analytics.clickThroughRate) {
      engagementScore += analytics.clickThroughRate * weights.CLICK_THROUGH_RATE;
    }
    
    // Video-specific engagement
    if (content.contentType === 'video_clip' && analytics.watchTime && analytics.totalViews) {
      const watchTimeRatio = analytics.watchTime / (analytics.totalViews * (content.duration || 1));
      engagementScore += watchTimeRatio * weights.WATCH_TIME_RATIO * 1000;
      
      if (analytics.completionRate) {
        engagementScore += analytics.completionRate * weights.COMPLETION_RATE;
      }
    }
    
    // Engagement rate normalization
    const totalViews = content.views || 1;
    const engagementRate = ((content.likes || 0) + (content.comments || 0) + (content.shares || 0)) / totalViews;
    engagementScore *= (1 + engagementRate);
    
    return Math.max(0, engagementScore);
  }
  
  /**
   * Calculate time-based score with decay factors
   * @param {Object} content - Content object
   * @param {string} mode - Ranking mode
   * @returns {number} Time score
   */
  calculateTimeScore(content, mode = 'hot') {
    const now = new Date();
    const createdAt = new Date(content.createdAt);
    const ageHours = (now - createdAt) / (1000 * 60 * 60);
    const ageDays = ageHours / 24;
    
    const timeConfig = this.config.SCORING_WEIGHTS.TIME_DECAY;
    const modeConfig = this.config.RANKING_MODES[mode?.toUpperCase()] || this.config.RANKING_MODES.HOT;
    
    let timeScore = 1.0;
    
    // Apply mode-specific time decay
    if (mode === 'trending') {
      // Trending content decays rapidly
      timeScore = Math.exp(-ageHours / timeConfig.TRENDING_HALFLIFE_HOURS);
    } else if (mode === 'hot') {
      // Hot content decays more slowly
      timeScore = Math.exp(-ageHours / timeConfig.HOT_HALFLIFE_HOURS);
    } else if (mode === 'new') {
      // New content prioritizes recency
      timeScore = Math.max(0, 1 - (ageHours / 72)); // Linear decay over 3 days
    } else if (mode === 'top' || ageDays > timeConfig.EVERGREEN_THRESHOLD_DAYS) {
      // Top/evergreen content has minimal time penalty
      timeScore = Math.max(0.1, 1 - (ageDays / 365)); // Slow decay over a year
    }
    
    // Freshness bonus for very new content
    if (ageHours < timeConfig.FRESHNESS_BONUS_HOURS) {
      timeScore *= 1.5; // 50% bonus for content less than 2 hours old
    }
    
    return Math.max(0.01, timeScore); // Minimum score to prevent division by zero
  }
  
  /**
   * Calculate gaming-specific score factors
   * @param {Object} content - Content object
   * @returns {number} Gaming score
   */
  calculateGamingScore(content) {
    const gamingWeights = this.config.SCORING_WEIGHTS.GAMING_FACTORS;
    let gamingScore = 1.0;
    
    // Ensure content exists
    if (!content) return 1.0;
    
    // Game popularity multiplier
    const game = content.game?.toLowerCase();
    if (game && gamingWeights.GAME_POPULARITY[game]) {
      gamingScore *= gamingWeights.GAME_POPULARITY[game];
    }
    
    // Content type multiplier
    const category = content.category?.toLowerCase();
    if (category && gamingWeights.CONTENT_TYPE[category]) {
      gamingScore *= gamingWeights.CONTENT_TYPE[category];
    }
    
    // Skill level multiplier
    const skillLevel = content.difficulty?.toLowerCase();
    if (skillLevel && gamingWeights.SKILL_LEVEL[skillLevel]) {
      gamingScore *= gamingWeights.SKILL_LEVEL[skillLevel];
    }
    
    // Competitive relevance multiplier
    const gameMode = content.gameMode?.toLowerCase();
    if (gameMode && gamingWeights.COMPETITIVE_RELEVANCE[gameMode]) {
      gamingScore *= gamingWeights.COMPETITIVE_RELEVANCE[gameMode];
    }
    
    // Esports/tournament content boost
    if (content.tags?.some(tag => 
      ['esports', 'tournament', 'championship', 'competitive'].includes(tag.toLowerCase()))) {
      gamingScore *= 1.3;
    }
    
    // Platform cross-referencing boost
    if (content.platform && this.isPlatformTrending(content.platform, content.game)) {
      gamingScore *= 1.2;
    }
    
    return Math.max(0.5, gamingScore);
  }
  
  /**
   * Calculate user reputation score influence
   * @param {Object} content - Content object
   * @returns {number} Reputation multiplier
   */
  calculateUserReputationScore(content) {
    const reputationWeights = this.config.USER_REPUTATION;
    let reputationScore = 1.0;
    
    // Clan status multiplier
    const clanStatus = content.creator?.clanStatus?.toLowerCase();
    if (reputationWeights.CLAN_STATUS[clanStatus]) {
      reputationScore *= reputationWeights.CLAN_STATUS[clanStatus];
    }
    
    // Achievement level multiplier
    const achievementLevel = content.creator?.achievementLevel?.toLowerCase();
    if (reputationWeights.ACHIEVEMENT_LEVEL[achievementLevel]) {
      reputationScore *= reputationWeights.ACHIEVEMENT_LEVEL[achievementLevel];
    }
    
    // Gamerscore multiplier (logarithmic scaling)
    const gamerscore = content.creator?.gamerscore || 0;
    if (gamerscore > reputationWeights.GAMERSCORE_MULTIPLIER.threshold) {
      const scoreBonus = Math.min(
        reputationWeights.GAMERSCORE_MULTIPLIER.maxMultiplier - 1.0,
        gamerscore * reputationWeights.GAMERSCORE_MULTIPLIER.scalingFactor
      );
      reputationScore *= (1.0 + scoreBonus);
    }
    
    // Verified creator boost
    if (content.creator?.verified) {
      reputationScore *= 1.2;
    }
    
    return reputationScore;
  }
  
  /**
   * Calculate controversy score for mixed sentiment content
   * @param {Object} content - Content object
   * @returns {number} Controversy score
   */
  calculateControversyScore(content) {
    const votes = content.mlgVotes || {};
    const upvotes = votes.upvotes || 0;
    const downvotes = votes.downvotes || 0;
    const totalVotes = upvotes + downvotes;
    
    if (totalVotes < 5) return 0; // Need minimum votes for controversy
    
    // Calculate vote ratio balance (closer to 50/50 = more controversial)
    const upvoteRatio = upvotes / totalVotes;
    const balance = 1 - Math.abs(upvoteRatio - 0.5) * 2; // 0-1 scale
    
    // Scale by total engagement
    const engagementFactor = Math.log(totalVotes + 1);
    
    return balance * engagementFactor;
  }
  
  /**
   * Calculate composite score from all components
   * @param {Object} components - Score components
   * @param {Object} weights - Mode weights
   * @param {Object} options - Calculation options
   * @returns {number} Composite score
   */
  calculateCompositeScore(components, weights, options) {
    // Ensure all components have default values
    const safeComponents = {
      voteScore: components.voteScore || 0,
      engagementScore: components.engagementScore || 0,
      timeScore: components.timeScore || 1,
      gamingScore: components.gamingScore || 1,
      userReputationScore: components.userReputationScore || 1,
      controversyScore: components.controversyScore || 0
    };
    
    // Base composite calculation
    let compositeScore = (
      (safeComponents.voteScore * (weights.voteWeight || 0.5)) +
      (safeComponents.engagementScore * (weights.engagementWeight || 0.3)) +
      (safeComponents.timeScore * (weights.timeWeight || 0.2)) +
      (safeComponents.gamingScore * 0.1) // Gaming factors are always 10%
    ) * safeComponents.userReputationScore; // Reputation acts as multiplier
    
    // Add controversy bonus for controversial mode
    if (options.mode === 'controversial') {
      compositeScore += (safeComponents.controversyScore * (weights.controversyWeight || 0));
    }
    
    // Apply A/B testing variations
    if (this.config.AB_TESTING.ENABLED && options.abTestGroup) {
      const variations = this.config.AB_TESTING.WEIGHT_VARIATIONS[options.abTestGroup];
      if (variations) {
        const totalWeight = (weights.voteWeight || 0.5) + (weights.engagementWeight || 0.3) + (weights.timeWeight || 0.2);
        const adjustmentFactor = (variations.votes * (weights.voteWeight || 0.5) + 
                          variations.engagement * (weights.engagementWeight || 0.3) + 
                          variations.time * (weights.timeWeight || 0.2)) / totalWeight;
        compositeScore *= adjustmentFactor;
      }
    }
    
    return Math.max(0, compositeScore); // Ensure non-negative
  }
  
  /**
   * Rank multiple content items
   * @param {Array} contentList - Array of content objects
   * @param {Object} options - Ranking options
   * @returns {Array} Ranked content with scores
   */
  rankContent(contentList, options = {}) {
    const mode = options.mode || 'hot';
    const limit = options.limit || 50;
    const timeWindowHours = options.timeWindowHours;
    
    // Filter by time window if specified
    let filteredContent = contentList;
    if (timeWindowHours) {
      const cutoffTime = new Date(Date.now() - (timeWindowHours * 60 * 60 * 1000));
      filteredContent = contentList.filter(content => 
        new Date(content.createdAt) >= cutoffTime);
    }
    
    // Apply quality threshold for 'new' mode
    if (mode === 'new' && this.config.RANKING_MODES.NEW.qualityThreshold) {
      const threshold = this.config.RANKING_MODES.NEW.qualityThreshold;
      filteredContent = filteredContent.filter(content => 
        (content.qualityScore || 0) >= threshold);
    }
    
    // Calculate scores for all content
    const scoredContent = filteredContent.map(content => {
      const scoreResult = this.calculateContentScore(content, { ...options, mode });
      return {
        ...content,
        rankingScore: scoreResult.compositeScore,
        normalizedScore: scoreResult.normalizedScore,
        scoreComponents: scoreResult.components,
        scoreInsights: scoreResult.insights
      };
    });
    
    // Sort by score (descending)
    scoredContent.sort((a, b) => b.rankingScore - a.rankingScore);
    
    // Apply limit
    const rankedContent = scoredContent.slice(0, limit);
    
    // Add ranking metadata
    rankedContent.forEach((content, index) => {
      content.rank = index + 1;
      content.rankingMetadata = {
        mode,
        rankedAt: new Date().toISOString(),
        totalCandidates: filteredContent.length,
        scorePercentile: ((filteredContent.length - index) / filteredContent.length) * 100
      };
    });
    
    return rankedContent;
  }
  
  /**
   * Get game-specific trending content
   * @param {string} game - Game identifier
   * @param {Object} options - Options
   * @returns {Array} Game-specific trending content
   */
  getGameTrending(game, options = {}) {
    // This would typically query a database
    // For now, return mock implementation
    return this.rankContent([], { 
      ...options, 
      mode: 'trending',
      gameFilter: game.toLowerCase(),
      timeWindowHours: 24 
    });
  }
  
  /**
   * Batch process multiple content scores
   * @param {Array} contentList - Content to process
   * @param {Object} options - Processing options
   * @returns {Promise<Array>} Processed results
   */
  async batchCalculateScores(contentList, options = {}) {
    const batchSize = options.batchSize || this.config.CACHE.BATCH_SIZE;
    const results = [];
    
    for (let i = 0; i < contentList.length; i += batchSize) {
      const batch = contentList.slice(i, i + batchSize);
      const batchResults = batch.map(content => 
        this.calculateContentScore(content, options));
      results.push(...batchResults);
      
      // Small delay between batches to prevent blocking
      if (i + batchSize < contentList.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    return results;
  }
  
  /**
   * Get real-time score updates for high-traffic content
   * @param {Array} contentIds - Content IDs to monitor
   * @returns {Promise<Object>} Real-time scores
   */
  async getRealTimeScores(contentIds) {
    const threshold = this.config.CACHE.REAL_TIME_THRESHOLD;
    const realTimeContent = contentIds.filter(id => {
      // Check if content meets real-time threshold
      return this.isHighTrafficContent(id, threshold);
    });
    
    // Calculate fresh scores for high-traffic content
    const scores = {};
    for (const contentId of realTimeContent) {
      const content = await this.getContentById(contentId);
      if (content) {
        scores[contentId] = this.calculateContentScore(content, { forceRecalculate: true });
      }
    }
    
    return scores;
  }
  
  /**
   * Generate insights about content score
   * @param {Object} content - Content object
   * @param {Object} components - Score components
   * @returns {Array} Score insights
   */
  generateScoreInsights(content, components) {
    const insights = [];
    
    // Vote analysis
    if (components.voteScore > 50) {
      insights.push({
        type: 'positive',
        category: 'votes',
        message: 'Strong community voting support',
        impact: 'high'
      });
    }
    
    // Engagement analysis
    const engagementRate = ((content.likes || 0) + (content.comments || 0)) / Math.max(1, content.views || 1);
    if (engagementRate > 0.1) {
      insights.push({
        type: 'positive',
        category: 'engagement',
        message: 'High engagement rate indicates quality content',
        impact: 'medium'
      });
    }
    
    // Time analysis
    const ageHours = (new Date() - new Date(content.createdAt)) / (1000 * 60 * 60);
    if (ageHours < 2 && components.voteScore > 10) {
      insights.push({
        type: 'trending',
        category: 'time',
        message: 'Rapidly gaining traction',
        impact: 'high'
      });
    }
    
    // Gaming-specific insights
    if (components.gamingScore > 1.5) {
      insights.push({
        type: 'positive',
        category: 'gaming',
        message: 'High relevance for competitive gaming community',
        impact: 'medium'
      });
    }
    
    return insights;
  }
  
  /**
   * Helper methods
   */
  
  generateCacheKey(content, options) {
    return `score:${content.id}:${options.mode || 'hot'}:${Date.now() / (5 * 60 * 1000) | 0}`;
  }
  
  getModeWeights(mode) {
    return this.config.RANKING_MODES[mode.toUpperCase()] || this.config.RANKING_MODES.HOT;
  }
  
  normalizeScore(score) {
    // Normalize to 0-100 scale using logarithmic scaling
    return Math.min(100, Math.max(0, Math.log(score + 1) * 20));
  }
  
  getDefaultScore(content) {
    return {
      contentId: content.id,
      compositeScore: 0,
      normalizedScore: 0,
      components: {},
      metadata: { error: true },
      insights: []
    };
  }
  
  calculateVoteVelocity(content) {
    // Mock implementation - would calculate votes per hour
    const totalVotes = (content.mlgVotes?.upvotes || 0) + (content.mlgVotes?.downvotes || 0);
    const ageHours = (new Date() - new Date(content.createdAt)) / (1000 * 60 * 60);
    return totalVotes / Math.max(1, ageHours);
  }
  
  calculateVoteDiversity(content) {
    // Mock implementation - would analyze voter diversity
    return 0.5; // 50% diversity score
  }
  
  isPlatformTrending(platform, game) {
    // Mock implementation - would check trending data
    return false;
  }
  
  getABTestGroup(content) {
    // Simple hash-based A/B testing
    const groups = this.config.AB_TESTING.TEST_GROUPS;
    const hash = this.simpleHash(content.id);
    return groups[hash % groups.length];
  }
  
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  updateMetrics(calculationTime) {
    this.metrics.calculationsPerformed++;
    this.metrics.averageCalculationTime = 
      (this.metrics.averageCalculationTime * (this.metrics.calculationsPerformed - 1) + calculationTime) 
      / this.metrics.calculationsPerformed;
    this.metrics.lastUpdateTime = new Date().toISOString();
  }
  
  isHighTrafficContent(contentId, threshold) {
    // Mock implementation - would check content views/engagement
    return false;
  }
  
  async getContentById(contentId) {
    // Mock implementation - would fetch from database
    return null;
  }
  
  startBackgroundProcessing() {
    setInterval(() => {
      if (!this.isProcessingBatch && this.batchQueue.length > 0) {
        this.processBatchQueue();
      }
    }, this.config.CACHE.BACKGROUND_UPDATE_INTERVAL * 1000);
  }
  
  async processBatchQueue() {
    this.isProcessingBatch = true;
    try {
      const batch = this.batchQueue.splice(0, this.config.CACHE.BATCH_SIZE);
      await this.batchCalculateScores(batch);
    } finally {
      this.isProcessingBatch = false;
    }
  }
  
  /**
   * Get algorithm performance metrics
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.scoreCache.size,
      cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses),
      queueSize: this.batchQueue.length
    };
  }
  
  /**
   * Update algorithm configuration
   * @param {Object} newConfig - Configuration updates
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.scoreCache.clear(); // Clear cache after config change
  }
  
  /**
   * Export ranking data for analysis
   * @param {Array} contentList - Content to analyze
   * @returns {Object} Analysis data
   */
  exportRankingAnalysis(contentList) {
    const analysis = {
      summary: {
        totalContent: contentList.length,
        averageScore: 0,
        scoreDistribution: {},
        topPerformingCategories: {},
        timestamp: new Date().toISOString()
      },
      detailed: contentList.map(content => ({
        id: content.id,
        score: this.calculateContentScore(content),
        category: content.category,
        game: content.game,
        ageHours: (new Date() - new Date(content.createdAt)) / (1000 * 60 * 60)
      }))
    };
    
    // Calculate summary statistics
    const scores = analysis.detailed.map(item => item.score.normalizedScore);
    analysis.summary.averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    return analysis;
  }
}

/**
 * Specialized ranking modes implementation
 */
export class RankingModes {
  constructor(algorithm) {
    this.algorithm = algorithm;
  }
  
  /**
   * Get trending content with velocity-based scoring
   * @param {Array} contentList - Content to rank
   * @param {Object} options - Trending options
   * @returns {Array} Trending content
   */
  getTrending(contentList, options = {}) {
    return this.algorithm.rankContent(contentList, {
      ...options,
      mode: 'trending',
      timeWindowHours: options.timeWindowHours || 24
    });
  }
  
  /**
   * Get hot content with balanced scoring
   * @param {Array} contentList - Content to rank
   * @param {Object} options - Hot options
   * @returns {Array} Hot content
   */
  getHot(contentList, options = {}) {
    return this.algorithm.rankContent(contentList, {
      ...options,
      mode: 'hot',
      timeWindowHours: options.timeWindowHours || 48
    });
  }
  
  /**
   * Get top content of all time
   * @param {Array} contentList - Content to rank
   * @param {Object} options - Top options
   * @returns {Array} Top content
   */
  getTop(contentList, options = {}) {
    return this.algorithm.rankContent(contentList, {
      ...options,
      mode: 'top',
      timeWindowHours: null // All time
    });
  }
  
  /**
   * Get new content with quality filtering
   * @param {Array} contentList - Content to rank
   * @param {Object} options - New options
   * @returns {Array} New content
   */
  getNew(contentList, options = {}) {
    return this.algorithm.rankContent(contentList, {
      ...options,
      mode: 'new',
      timeWindowHours: options.timeWindowHours || 72
    });
  }
  
  /**
   * Get controversial content with mixed sentiment
   * @param {Array} contentList - Content to rank
   * @param {Object} options - Controversial options
   * @returns {Array} Controversial content
   */
  getControversial(contentList, options = {}) {
    return this.algorithm.rankContent(contentList, {
      ...options,
      mode: 'controversial',
      timeWindowHours: options.timeWindowHours || 168
    });
  }
}

/**
 * Gaming-specific ranking utilities
 */
export class GamingRankingUtils {
  static getGameSpecificTrending(contentList, game, options = {}) {
    const gameContent = contentList.filter(content => 
      content.game.toLowerCase() === game.toLowerCase());
    
    const algorithm = new ContentRankingAlgorithm();
    return algorithm.rankContent(gameContent, {
      ...options,
      mode: 'trending',
      timeWindowHours: 24
    });
  }
  
  static getCompetitiveContent(contentList, options = {}) {
    const competitiveContent = contentList.filter(content =>
      content.gameMode && ['ranked', 'competitive', 'tournament'].includes(content.gameMode.toLowerCase()) ||
      content.tags && content.tags.some(tag => 
        ['esports', 'tournament', 'competitive', 'ranked'].includes(tag.toLowerCase()))
    );
    
    const algorithm = new ContentRankingAlgorithm();
    return algorithm.rankContent(competitiveContent, {
      ...options,
      mode: 'hot'
    });
  }
  
  static getCasualContent(contentList, options = {}) {
    const casualContent = contentList.filter(content =>
      !content.gameMode || ['casual', 'fun', 'creative'].includes(content.gameMode.toLowerCase()) ||
      content.tags && content.tags.some(tag =>
        ['funny', 'casual', 'creative', 'meme'].includes(tag.toLowerCase()))
    );
    
    const algorithm = new ContentRankingAlgorithm();
    return algorithm.rankContent(casualContent, {
      ...options,
      mode: 'hot'
    });
  }
}

/**
 * Content discovery recommendations
 */
export class ContentRecommendations {
  constructor(algorithm) {
    this.algorithm = algorithm;
  }
  
  /**
   * Get personalized content recommendations
   * @param {Object} user - User profile
   * @param {Array} contentList - Available content
   * @param {Object} options - Recommendation options
   * @returns {Array} Recommended content
   */
  getPersonalizedRecommendations(user, contentList, options = {}) {
    // Filter by user preferences
    let filteredContent = contentList.filter(content => {
      // Filter by preferred games
      if (user.preferredGames && user.preferredGames.length > 0) {
        return user.preferredGames.includes(content.game.toLowerCase());
      }
      
      // Filter by preferred platforms
      if (user.preferredPlatforms && user.preferredPlatforms.length > 0) {
        return user.preferredPlatforms.includes(content.platform.toLowerCase());
      }
      
      return true;
    });
    
    // Apply user-specific scoring modifiers
    const modifiedConfig = { ...this.algorithm.config };
    if (user.preferences?.contentTypes) {
      // Boost preferred content types
      for (const [contentType, preference] of Object.entries(user.preferences.contentTypes)) {
        if (modifiedConfig.SCORING_WEIGHTS.GAMING_FACTORS.CONTENT_TYPE[contentType]) {
          modifiedConfig.SCORING_WEIGHTS.GAMING_FACTORS.CONTENT_TYPE[contentType] *= preference;
        }
      }
    }
    
    // Create algorithm instance with modified config
    const personalizedAlgorithm = new ContentRankingAlgorithm(modifiedConfig);
    
    return personalizedAlgorithm.rankContent(filteredContent, {
      ...options,
      mode: options.mode || 'hot',
      limit: options.limit || 20
    });
  }
  
  /**
   * Get similar content recommendations
   * @param {Object} baseContent - Content to find similar items for
   * @param {Array} contentList - Available content
   * @param {Object} options - Options
   * @returns {Array} Similar content
   */
  getSimilarContent(baseContent, contentList, options = {}) {
    // Calculate similarity scores
    const similarContent = contentList
      .filter(content => content.id !== baseContent.id)
      .map(content => ({
        ...content,
        similarityScore: this.calculateContentSimilarity(baseContent, content)
      }))
      .filter(content => content.similarityScore > 0.3) // Minimum similarity threshold
      .sort((a, b) => b.similarityScore - a.similarityScore);
    
    return similarContent.slice(0, options.limit || 10);
  }
  
  calculateContentSimilarity(content1, content2) {
    let similarity = 0;
    
    // Game similarity (high weight)
    if (content1.game === content2.game) similarity += 0.4;
    
    // Platform similarity
    if (content1.platform === content2.platform) similarity += 0.2;
    
    // Category similarity
    if (content1.category === content2.category) similarity += 0.2;
    
    // Tag similarity
    const commonTags = (content1.tags || []).filter(tag => 
      (content2.tags || []).includes(tag)).length;
    const totalTags = new Set([...(content1.tags || []), ...(content2.tags || [])]).size;
    similarity += (commonTags / Math.max(totalTags, 1)) * 0.2;
    
    return similarity;
  }
}

// Export default algorithm instance
export default new ContentRankingAlgorithm();

// Export ranking modes instance
export const rankingModes = new RankingModes(new ContentRankingAlgorithm());

// Export gaming utilities
export const gamingRanking = GamingRankingUtils;

// Export recommendations engine
export const recommendations = new ContentRecommendations(new ContentRankingAlgorithm());