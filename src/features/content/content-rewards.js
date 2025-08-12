/**
 * MLG.clan Content Reward System - Sub-task 4.7
 * 
 * Comprehensive content reward system using MLG token distribution
 * Integrates with existing content ranking algorithm and voting systems
 * Implements automated reward distribution based on content performance metrics
 * 
 * Features:
 * - Performance-based rewards (vote scores, engagement metrics, viral content)
 * - Time-based rewards (daily, weekly, monthly top performers)
 * - Achievement-based rewards (milestones, streaks, community impact)
 * - Creator tier bonuses (verified creators, established community members)
 * - Automated reward pool management and distribution
 * - Progressive reward scaling based on content quality and engagement
 * - Integration with MLG token contract: 7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL
 * - Solana transaction processing for reward payouts
 * - Community-adjustable reward parameters
 * - Transparent reward distribution history
 * - Anti-gaming measures to prevent reward exploitation
 * - Appeals process for reward disputes
 * - Creator earnings dashboard and analytics
 * - Reward prediction and estimation tools
 * - Historical reward data and trends
 * - Community reward pool health monitoring
 * 
 * @author Claude Code - Solana Web3 Security Architect
 * @version 1.0.0
 */

import {
Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  Keypair,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';

import {
TOKEN_PROGRAM_ID,
  createTransferInstruction,
  getAssociatedTokenAddress,
  getAccount,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token';

import { 
  createConnection, 
  createMLGTokenConnection,
  MLG_TOKEN_CONFIG,
  CURRENT_NETWORK
} from '../../../config/environment/solana-config.js';

import { ContentRankingAlgorithm } from './content-ranking-algorithm.js';

/**
 * Content Reward System Configuration
 */
export const REWARD_CONFIG = {
  // MLG Token Contract
  MLG_TOKEN_ADDRESS: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL',
  
  // Reward Pool Configuration
  REWARD_POOLS: {
    DAILY: {
      TOTAL_ALLOCATION: 10000,  // 10,000 MLG tokens per day
      DISTRIBUTION_PERIODS: 24,  // Distribute every hour
      MINIMUM_THRESHOLD: 100,   // Minimum content score to qualify
      TOP_PERCENTAGE: 0.1       // Top 10% get rewards
    },
    WEEKLY: {
      TOTAL_ALLOCATION: 50000,  // 50,000 MLG tokens per week
      DISTRIBUTION_DAY: 0,      // Sunday (0 = Sunday, 6 = Saturday)
      TOP_PERCENTAGE: 0.05      // Top 5% get rewards
    },
    MONTHLY: {
      TOTAL_ALLOCATION: 200000, // 200,000 MLG tokens per month
      DISTRIBUTION_DATE: 1,     // 1st of each month
      TOP_PERCENTAGE: 0.02      // Top 2% get rewards
    }
  },
  
  // Performance-Based Rewards
  PERFORMANCE_REWARDS: {
    // Vote score thresholds and rewards
    VOTE_SCORE: {
      EXCELLENT: { threshold: 100, multiplier: 2.0, baseReward: 500 },
      GREAT: { threshold: 50, multiplier: 1.5, baseReward: 250 },
      GOOD: { threshold: 20, multiplier: 1.2, baseReward: 100 },
      DECENT: { threshold: 10, multiplier: 1.0, baseReward: 50 }
    },
    
    // Engagement metrics rewards
    ENGAGEMENT: {
      VIRAL_THRESHOLD: 10000,     // 10k+ views considered viral
      VIRAL_BONUS: 1000,          // 1000 MLG bonus for viral content
      ENGAGEMENT_RATE_BONUS: {
        HIGH: { threshold: 0.15, bonus: 500 },    // 15%+ engagement rate
        MEDIUM: { threshold: 0.08, bonus: 200 },  // 8%+ engagement rate
        LOW: { threshold: 0.03, bonus: 50 }       // 3%+ engagement rate
      },
      COMPLETION_RATE_BONUS: {
        EXCELLENT: { threshold: 0.8, bonus: 300 }, // 80%+ completion
        GOOD: { threshold: 0.6, bonus: 150 },      // 60%+ completion
        DECENT: { threshold: 0.4, bonus: 75 }      // 40%+ completion
      }
    },
    
    // Time-based velocity rewards
    VELOCITY_REWARDS: {
      TRENDING_BONUS: 750,        // Bonus for trending content
      RAPID_GROWTH_MULTIPLIER: 1.5, // Multiplier for rapid growth
      SUSTAINED_PERFORMANCE: {
        threshold_hours: 48,      // Must maintain performance for 48 hours
        bonus: 500
      }
    }
  },
  
  // Achievement-Based Rewards
  ACHIEVEMENT_REWARDS: {
    // Content milestones
    CONTENT_MILESTONES: {
      FIRST_VIRAL: { reward: 2000, description: 'First viral content (10k+ views)' },
      TOP_10_DAILY: { reward: 1500, description: 'First time in top 10 daily' },
      COMMUNITY_FAVORITE: { reward: 1000, description: '100+ likes milestone' },
      ENGAGEMENT_MASTER: { reward: 800, description: '20%+ engagement rate' },
      CONSISTENCY_STREAK: { reward: 600, description: '7 days consecutive content' }
    },
    
    // Community impact achievements
    COMMUNITY_IMPACT: {
      HELPFUL_CREATOR: { reward: 1200, description: '50+ helpful votes' },
      TREND_SETTER: { reward: 1000, description: 'Started 3+ trending topics' },
      MENTOR: { reward: 800, description: 'Helped 10+ new creators' },
      COMMUNITY_BUILDER: { reward: 1500, description: 'Built gaming community' }
    },
    
    // Gaming achievements
    GAMING_ACHIEVEMENTS: {
      ESPORTS_LEGEND: { reward: 2500, description: 'Tournament content creator' },
      SKILL_MASTER: { reward: 1500, description: 'Expert-level content streak' },
      MULTI_GAME_CREATOR: { reward: 1000, description: 'Create content for 5+ games' },
      COMPETITIVE_EXPERT: { reward: 800, description: 'Ranked gameplay specialist' }
    }
  },
  
  // Creator Tier Bonuses
  CREATOR_TIERS: {
    VERIFIED: {
      multiplier: 1.5,
      baseBonus: 200,
      description: 'Verified gaming creator'
    },
    CLAN_LEADER: {
      multiplier: 1.3,
      baseBonus: 150,
      description: 'Clan leader or officer'
    },
    ESTABLISHED: {
      multiplier: 1.2,
      baseBonus: 100,
      description: 'Established community member (90+ days)'
    },
    RISING_STAR: {
      multiplier: 1.1,
      baseBonus: 50,
      description: 'Rising star (consistent quality content)'
    }
  },
  
  // Anti-Gaming Measures
  ANTI_GAMING: {
    MINIMUM_ACCOUNT_AGE_DAYS: 7,     // Account must be 7 days old
    MINIMUM_CONTENT_QUALITY: 0.3,    // Minimum quality score
    SUSPICIOUS_ACTIVITY_THRESHOLD: 5, // Flag after 5 suspicious activities
    REWARD_COOLING_PERIOD_HOURS: 24, // 24-hour cooling period between rewards
    MAXIMUM_DAILY_REWARDS: 3,        // Max 3 rewards per creator per day
    VOTE_PATTERN_ANALYSIS: true,     // Analyze voting patterns for gaming
    CONTENT_SIMILARITY_CHECK: true   // Check for duplicate/similar content
  },
  
  // Reward Distribution Settings
  DISTRIBUTION: {
    GAS_ESTIMATION_MULTIPLIER: 1.2,  // Add 20% buffer for gas
    BATCH_SIZE: 50,                  // Process 50 rewards per batch
    RETRY_ATTEMPTS: 3,               // Retry failed transactions 3 times
    CONFIRMATION_TIMEOUT: 60000,     // 60 second timeout for confirmations
    MINIMUM_PAYOUT: 10,              // Minimum 10 MLG tokens to payout
    TREASURY_RESERVE_PERCENTAGE: 0.05 // Keep 5% in treasury reserve
  },
  
  // Appeal and Dispute System
  APPEALS: {
    ENABLED: true,
    APPEAL_WINDOW_HOURS: 168,        // 7 days to appeal
    EVIDENCE_REQUIRED: true,         // Require evidence for appeals
    COMMUNITY_VOTING_THRESHOLD: 0.6, // 60% community approval needed
    AUTO_REINSTATE_THRESHOLD: 0.8   // 80% approval = auto reinstatement
  }
};

/**
 * Main Content Reward System Class
 */
export class ContentRewardSystem {
  constructor(connection = null, options = {}) {
    this.connection = connection || createConnection();
    this.mlgTokenConnection = createMLGTokenConnection();
    this.rankingAlgorithm = new ContentRankingAlgorithm();
    this.config = { ...REWARD_CONFIG, ...options };
    
    // State management
    this.rewardPools = new Map();
    this.distributionQueue = [];
    this.pendingTransactions = new Map();
    this.rewardHistory = [];
    this.creatorStats = new Map();
    this.appealsCases = new Map();
    
    // Performance metrics
    this.metrics = {
      totalRewardsDistributed: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      averageRewardAmount: 0,
      uniqueRecipients: new Set(),
      lastDistributionTime: null,
      poolHealthStatus: 'healthy'
    };
    
    // Anti-gaming tracking
    this.antiGamingTracker = {
      suspiciousAccounts: new Set(),
      votingPatterns: new Map(),
      contentSimilarityCache: new Map(),
      recentRewards: new Map()
    };
    
    this.initializeRewardPools();
    this.startBackgroundProcessing();
  }
  
  /**
   * Initialize reward pools with current balances
   */
  async initializeRewardPools() {
    try {
      const treasuryBalance = await this.getTreasuryBalance();
      
      const dailyAllocation = this.config?.REWARD_POOLS?.DAILY?.TOTAL_ALLOCATION || 10000;
      const weeklyAllocation = this.config?.REWARD_POOLS?.WEEKLY?.TOTAL_ALLOCATION || 50000;
      const monthlyAllocation = this.config?.REWARD_POOLS?.MONTHLY?.TOTAL_ALLOCATION || 200000;
      
      this.rewardPools.set('daily', {
        allocated: dailyAllocation,
        distributed: 0,
        remaining: dailyAllocation,
        lastDistribution: null,
        nextDistribution: this.calculateNextDistribution('daily')
      });
      
      this.rewardPools.set('weekly', {
        allocated: weeklyAllocation,
        distributed: 0,
        remaining: weeklyAllocation,
        lastDistribution: null,
        nextDistribution: this.calculateNextDistribution('weekly')
      });
      
      this.rewardPools.set('monthly', {
        allocated: monthlyAllocation,
        distributed: 0,
        remaining: monthlyAllocation,
        lastDistribution: null,
        nextDistribution: this.calculateNextDistribution('monthly')
      });
      
      console.log('Reward pools initialized:', {
        treasuryBalance,
        pools: Object.fromEntries(this.rewardPools)
      });
      
    } catch (error) {
      console.error('Failed to initialize reward pools:', error);
      throw new Error(`Reward system initialization failed: ${error.message}`);
    }
  }
  
  /**
   * Calculate performance-based rewards for content
   * @param {Object} content - Content object with performance metrics
   * @param {Object} options - Calculation options
   * @returns {Object} Reward calculation result
   */
  async calculateContentReward(content, options = {}) {
    try {
      // Validate content and creator eligibility
      const eligibilityCheck = await this.checkRewardEligibility(content);
      if (!eligibilityCheck.eligible) {
        return {
          eligible: false,
          reason: eligibilityCheck.reason,
          suggestedActions: eligibilityCheck.suggestions
        };
      }
      
      // Get content ranking score
      const rankingResult = this.rankingAlgorithm.calculateContentScore(content);
      const contentScore = rankingResult.normalizedScore;
      
      // Calculate base reward from performance tiers
      let baseReward = this.calculateBasePerformanceReward(contentScore, rankingResult);
      
      // Add engagement bonuses
      const engagementBonus = this.calculateEngagementBonus(content);
      
      // Add velocity and trending bonuses
      const velocityBonus = this.calculateVelocityBonus(content, rankingResult);
      
      // Apply creator tier multipliers
      const creatorMultiplier = this.getCreatorTierMultiplier(content.creator);
      
      // Calculate total reward before multipliers
      let totalReward = (baseReward + engagementBonus + velocityBonus) * creatorMultiplier.multiplier;
      
      // Add tier-specific base bonus
      totalReward += creatorMultiplier.baseBonus;
      
      // Apply anti-gaming penalties if detected
      const antiGamingResult = await this.checkAntiGamingMeasures(content);
      if (antiGamingResult.suspicious) {
        totalReward *= antiGamingResult.penaltyMultiplier;
      }
      
      // Ensure minimum payout threshold
      if (totalReward < this.config.DISTRIBUTION.MINIMUM_PAYOUT) {
        totalReward = 0;
      }
      
      return {
        eligible: true,
        totalReward: Math.floor(totalReward),
        breakdown: {
          baseReward,
          engagementBonus,
          velocityBonus,
          creatorMultiplier: creatorMultiplier.multiplier,
          creatorBonus: creatorMultiplier.baseBonus,
          antiGamingPenalty: antiGamingResult.suspicious ? (1 - antiGamingResult.penaltyMultiplier) : 0
        },
        metrics: {
          contentScore,
          rankingComponents: rankingResult.components,
          creatorTier: creatorMultiplier.tier
        },
        recommendations: this.generateRewardRecommendations(content, totalReward)
      };
      
    } catch (error) {
      console.error('Reward calculation error:', error);
      return {
        eligible: false,
        reason: 'calculation_error',
        error: error.message
      };
    }
  }
  
  /**
   * Calculate base performance reward based on content score
   * @param {number} contentScore - Normalized content score (0-100)
   * @param {Object} rankingResult - Full ranking result
   * @returns {number} Base reward amount
   */
  calculateBasePerformanceReward(contentScore, rankingResult) {
    const voteScore = rankingResult.components.votes || 0;
    const performanceRewards = this.config.PERFORMANCE_REWARDS.VOTE_SCORE;
    
    // Find appropriate reward tier
    if (voteScore >= performanceRewards.EXCELLENT.threshold) {
      return performanceRewards.EXCELLENT.baseReward * performanceRewards.EXCELLENT.multiplier;
    } else if (voteScore >= performanceRewards.GREAT.threshold) {
      return performanceRewards.GREAT.baseReward * performanceRewards.GREAT.multiplier;
    } else if (voteScore >= performanceRewards.GOOD.threshold) {
      return performanceRewards.GOOD.baseReward * performanceRewards.GOOD.multiplier;
    } else if (voteScore >= performanceRewards.DECENT.threshold) {
      return performanceRewards.DECENT.baseReward * performanceRewards.DECENT.multiplier;
    }
    
    // Scale reward based on content score for lower tiers
    const scalingFactor = contentScore / 100;
    return Math.floor(25 * scalingFactor); // Minimum base reward scaled by quality
  }
  
  /**
   * Calculate engagement-based bonus rewards
   * @param {Object} content - Content with analytics
   * @returns {number} Engagement bonus amount
   */
  calculateEngagementBonus(content) {
    let bonus = 0;
    const analytics = content.analytics || {};
    const views = content.views || 0;
    
    // Viral content bonus
    if (views >= this.config.PERFORMANCE_REWARDS.ENGAGEMENT.VIRAL_THRESHOLD) {
      bonus += this.config.PERFORMANCE_REWARDS.ENGAGEMENT.VIRAL_BONUS;
    }
    
    // Engagement rate bonus
    const totalEngagement = (content.likes || 0) + (content.comments || 0) + (content.shares || 0);
    const engagementRate = views > 0 ? totalEngagement / views : 0;
    
    const engagementBonuses = this.config.PERFORMANCE_REWARDS.ENGAGEMENT.ENGAGEMENT_RATE_BONUS;
    if (engagementRate >= engagementBonuses.HIGH.threshold) {
      bonus += engagementBonuses.HIGH.bonus;
    } else if (engagementRate >= engagementBonuses.MEDIUM.threshold) {
      bonus += engagementBonuses.MEDIUM.bonus;
    } else if (engagementRate >= engagementBonuses.LOW.threshold) {
      bonus += engagementBonuses.LOW.bonus;
    }
    
    // Completion rate bonus (for video content)
    if (content.contentType === 'video_clip' && analytics.completionRate) {
      const completionBonuses = this.config.PERFORMANCE_REWARDS.ENGAGEMENT.COMPLETION_RATE_BONUS;
      if (analytics.completionRate >= completionBonuses.EXCELLENT.threshold) {
        bonus += completionBonuses.EXCELLENT.bonus;
      } else if (analytics.completionRate >= completionBonuses.GOOD.threshold) {
        bonus += completionBonuses.GOOD.bonus;
      } else if (analytics.completionRate >= completionBonuses.DECENT.threshold) {
        bonus += completionBonuses.DECENT.bonus;
      }
    }
    
    return bonus;
  }
  
  /**
   * Calculate velocity and trending bonuses
   * @param {Object} content - Content object
   * @param {Object} rankingResult - Ranking algorithm result
   * @returns {number} Velocity bonus amount
   */
  calculateVelocityBonus(content, rankingResult) {
    let bonus = 0;
    const insights = rankingResult.insights || [];
    
    // Trending bonus
    const isTrending = insights.some(insight => insight.type === 'trending');
    if (isTrending) {
      bonus += this.config.PERFORMANCE_REWARDS.VELOCITY_REWARDS.TRENDING_BONUS;
    }
    
    // Rapid growth multiplier
    const hasRapidGrowth = insights.some(insight => 
      insight.message && insight.message.includes('traction'));
    if (hasRapidGrowth) {
      bonus *= this.config.PERFORMANCE_REWARDS.VELOCITY_REWARDS.RAPID_GROWTH_MULTIPLIER;
    }
    
    // Sustained performance bonus
    const ageHours = (new Date() - new Date(content.createdAt)) / (1000 * 60 * 60);
    const sustainedConfig = this.config.PERFORMANCE_REWARDS.VELOCITY_REWARDS.SUSTAINED_PERFORMANCE;
    if (ageHours >= sustainedConfig.threshold_hours && rankingResult.normalizedScore > 70) {
      bonus += sustainedConfig.bonus;
    }
    
    return bonus;
  }
  
  /**
   * Get creator tier multiplier and bonuses
   * @param {Object} creator - Creator profile
   * @returns {Object} Tier information with multiplier and bonus
   */
  getCreatorTierMultiplier(creator) {
    const tiers = this.config.CREATOR_TIERS;
    
    // Check for verified status
    if (creator?.verified) {
      return {
        tier: 'verified',
        multiplier: tiers.VERIFIED.multiplier,
        baseBonus: tiers.VERIFIED.baseBonus,
        description: tiers.VERIFIED.description
      };
    }
    
    // Check for clan leadership
    if (creator?.clanStatus && ['leader', 'officer'].includes(creator.clanStatus.toLowerCase())) {
      return {
        tier: 'clan_leader',
        multiplier: tiers.CLAN_LEADER.multiplier,
        baseBonus: tiers.CLAN_LEADER.baseBonus,
        description: tiers.CLAN_LEADER.description
      };
    }
    
    // Check for established member status (90+ days)
    const accountAge = creator?.accountCreatedAt ? 
      (new Date() - new Date(creator.accountCreatedAt)) / (1000 * 60 * 60 * 24) : 0;
    if (accountAge >= 90) {
      return {
        tier: 'established',
        multiplier: tiers.ESTABLISHED.multiplier,
        baseBonus: tiers.ESTABLISHED.baseBonus,
        description: tiers.ESTABLISHED.description
      };
    }
    
    // Check for rising star status (consistent quality)
    const stats = this.creatorStats.get(creator?.id);
    if (stats && stats.averageContentScore > 60 && stats.totalContent >= 10) {
      return {
        tier: 'rising_star',
        multiplier: tiers.RISING_STAR.multiplier,
        baseBonus: tiers.RISING_STAR.baseBonus,
        description: tiers.RISING_STAR.description
      };
    }
    
    // Default tier
    return {
      tier: 'standard',
      multiplier: 1.0,
      baseBonus: 0,
      description: 'Standard creator'
    };
  }
  
  /**
   * Check reward eligibility and anti-gaming measures
   * @param {Object} content - Content to check
   * @returns {Object} Eligibility result
   */
  async checkRewardEligibility(content) {
    const checks = [];
    
    // Account age check
    const creator = content.creator;
    if (creator?.accountCreatedAt) {
      const accountAge = (new Date() - new Date(creator.accountCreatedAt)) / (1000 * 60 * 60 * 24);
      if (accountAge < this.config.ANTI_GAMING.MINIMUM_ACCOUNT_AGE_DAYS) {
        checks.push({
          passed: false,
          check: 'account_age',
          message: `Account must be at least ${this.config.ANTI_GAMING.MINIMUM_ACCOUNT_AGE_DAYS} days old`
        });
      }
    }
    
    // Content quality threshold
    const rankingResult = this.rankingAlgorithm.calculateContentScore(content);
    if (rankingResult.normalizedScore < this.config.ANTI_GAMING.MINIMUM_CONTENT_QUALITY * 100) {
      checks.push({
        passed: false,
        check: 'content_quality',
        message: 'Content does not meet minimum quality threshold'
      });
    }
    
    // Daily reward limit check
    const creatorId = creator?.id;
    const todayRewards = this.getTodayRewardsCount(creatorId);
    if (todayRewards >= this.config.ANTI_GAMING.MAXIMUM_DAILY_REWARDS) {
      checks.push({
        passed: false,
        check: 'daily_limit',
        message: 'Daily reward limit reached'
      });
    }
    
    // Cooling period check
    const lastRewardTime = this.getLastRewardTime(creatorId);
    if (lastRewardTime) {
      const hoursSinceLastReward = (new Date() - lastRewardTime) / (1000 * 60 * 60);
      if (hoursSinceLastReward < this.config.ANTI_GAMING.REWARD_COOLING_PERIOD_HOURS) {
        checks.push({
          passed: false,
          check: 'cooling_period',
          message: `Must wait ${this.config.ANTI_GAMING.REWARD_COOLING_PERIOD_HOURS} hours between rewards`
        });
      }
    }
    
    const failedChecks = checks.filter(check => !check.passed);
    
    return {
      eligible: failedChecks.length === 0,
      reason: failedChecks.length > 0 ? failedChecks[0].check : null,
      allChecks: checks,
      suggestions: failedChecks.map(check => check.message)
    };
  }
  
  /**
   * Check for anti-gaming measures and suspicious activity
   * @param {Object} content - Content to analyze
   * @returns {Object} Anti-gaming analysis result
   */
  async checkAntiGamingMeasures(content) {
    const suspiciousIndicators = [];
    let penaltyMultiplier = 1.0;
    
    // Check voting patterns
    if (this.config.ANTI_GAMING.VOTE_PATTERN_ANALYSIS) {
      const votingPatternResult = this.analyzeVotingPatterns(content);
      if (votingPatternResult.suspicious) {
        suspiciousIndicators.push('unusual_voting_pattern');
        penaltyMultiplier *= 0.7; // 30% penalty
      }
    }
    
    // Check content similarity
    if (this.config.ANTI_GAMING.CONTENT_SIMILARITY_CHECK) {
      const similarityResult = await this.checkContentSimilarity(content);
      if (similarityResult.suspicious) {
        suspiciousIndicators.push('content_similarity');
        penaltyMultiplier *= 0.5; // 50% penalty
      }
    }
    
    // Check creator behavior patterns
    const behaviorResult = this.analyzeBehaviorPatterns(content.creator);
    if (behaviorResult.suspicious) {
      suspiciousIndicators.push('behavior_pattern');
      penaltyMultiplier *= 0.8; // 20% penalty
    }
    
    // Update suspicious account tracking
    if (suspiciousIndicators.length > 0) {
      const creatorId = content.creator?.id;
      const currentCount = this.antiGamingTracker.suspiciousAccounts.get(creatorId) || 0;
      this.antiGamingTracker.suspiciousAccounts.set(creatorId, currentCount + suspiciousIndicators.length);
    }
    
    return {
      suspicious: suspiciousIndicators.length > 0,
      indicators: suspiciousIndicators,
      penaltyMultiplier,
      riskLevel: this.calculateRiskLevel(suspiciousIndicators.length)
    };
  }
  
  /**
   * Distribute rewards to content creators via Solana blockchain
   * @param {Array} rewardsList - List of rewards to distribute
   * @param {Object} options - Distribution options
   * @returns {Object} Distribution result
   */
  async distributeRewards(rewardsList, options = {}) {
    const batchSize = options.batchSize || this.config.DISTRIBUTION.BATCH_SIZE;
    const results = {
      successful: [],
      failed: [],
      totalAmount: 0,
      totalRecipients: 0,
      transactionIds: []
    };
    
    try {
      // Validate treasury balance
      const treasuryBalance = await this.getTreasuryBalance();
      const totalRewardAmount = rewardsList.reduce((sum, reward) => sum + reward.amount, 0);
      
      if (treasuryBalance < totalRewardAmount) {
        throw new Error(`Insufficient treasury balance: ${treasuryBalance} MLG, required: ${totalRewardAmount} MLG`);
      }
      
      // Process rewards in batches
      for (let i = 0; i < rewardsList.length; i += batchSize) {
        const batch = rewardsList.slice(i, i + batchSize);
        const batchResult = await this.processBatchRewards(batch, options);
        
        results.successful.push(...batchResult.successful);
        results.failed.push(...batchResult.failed);
        results.transactionIds.push(...batchResult.transactionIds);
      }
      
      // Update metrics and history
      results.totalAmount = results.successful.reduce((sum, reward) => sum + reward.amount, 0);
      results.totalRecipients = new Set(results.successful.map(r => r.recipient)).size;
      
      await this.updateRewardMetrics(results);
      await this.recordRewardHistory(results);
      
      console.log('Reward distribution completed:', {
        successful: results.successful.length,
        failed: results.failed.length,
        totalAmount: results.totalAmount,
        uniqueRecipients: results.totalRecipients
      });
      
      return results;
      
    } catch (error) {
      console.error('Reward distribution failed:', error);
      return {
        ...results,
        error: error.message,
        success: false
      };
    }
  }
  
  /**
   * Process a batch of reward transactions
   * @param {Array} batch - Batch of rewards to process
   * @param {Object} options - Processing options
   * @returns {Object} Batch processing result
   */
  async processBatchRewards(batch, options = {}) {
    const results = {
      successful: [],
      failed: [],
      transactionIds: []
    };
    
    for (const reward of batch) {
      try {
        // Validate recipient wallet
        const recipientPubkey = new PublicKey(reward.recipient);
        
        // Get associated token account for recipient
        const recipientTokenAccount = await getAssociatedTokenAddress(
          new PublicKey(this.config.MLG_TOKEN_ADDRESS),
          recipientPubkey
        );
        
        // Check if token account exists, create if needed
        let createAccountInstruction = null;
        try {
          await getAccount(this.connection, recipientTokenAccount);
        } catch (error) {
          // Account doesn't exist, create it
          createAccountInstruction = createAssociatedTokenAccountInstruction(
            recipientPubkey, // payer (recipient pays for their own account)
            recipientTokenAccount,
            recipientPubkey,
            new PublicKey(this.config.MLG_TOKEN_ADDRESS)
          );
        }
        
        // Create transfer instruction
        const transferAmount = reward.amount * Math.pow(10, MLG_TOKEN_CONFIG.DECIMALS); // Convert to token units
        const transferInstruction = createTransferInstruction(
          await this.getTreasuryTokenAccount(), // source
          recipientTokenAccount, // destination
          await this.getTreasuryAuthority(), // authority
          transferAmount
        );
        
        // Build and send transaction
        const transaction = new Transaction();
        if (createAccountInstruction) {
          transaction.add(createAccountInstruction);
        }
        transaction.add(transferInstruction);
        
        // Simulate transaction first
        const simulationResult = await this.connection.simulateTransaction(transaction);
        if (simulationResult.value.err) {
          throw new Error(`Transaction simulation failed: ${JSON.stringify(simulationResult.value.err)}`);
        }
        
        // Send and confirm transaction
        const signature = await sendAndConfirmTransaction(
          this.connection,
          transaction,
          [await this.getTreasuryKeypair()],
          {
            commitment: 'confirmed',
            preflightCommitment: 'confirmed'
          }
        );
        
        results.successful.push({
          ...reward,
          transactionId: signature,
          timestamp: new Date().toISOString(),
          status: 'completed'
        });
        
        results.transactionIds.push(signature);
        
        // Update creator stats
        this.updateCreatorStats(reward.recipient, reward.amount);
        
        console.log(`Reward distributed: ${reward.amount} MLG to ${reward.recipient} (${signature})`);
        
      } catch (error) {
        console.error(`Failed to distribute reward to ${reward.recipient}:`, error);
        
        results.failed.push({
          ...reward,
          error: error.message,
          timestamp: new Date().toISOString(),
          status: 'failed'
        });
      }
    }
    
    return results;
  }
  
  /**
   * Calculate achievement-based rewards for milestones
   * @param {Object} creator - Creator profile
   * @param {string} achievementType - Type of achievement
   * @param {Object} context - Achievement context data
   * @returns {Object} Achievement reward result
   */
  async calculateAchievementReward(creator, achievementType, context = {}) {
    const achievements = this.config.ACHIEVEMENT_REWARDS;
    let reward = null;
    
    // Check content milestones
    if (achievements.CONTENT_MILESTONES[achievementType]) {
      const milestone = achievements.CONTENT_MILESTONES[achievementType];
      reward = {
        type: 'content_milestone',
        achievementType,
        amount: milestone.reward,
        description: milestone.description,
        context
      };
    }
    
    // Check community impact achievements
    else if (achievements.COMMUNITY_IMPACT[achievementType]) {
      const impact = achievements.COMMUNITY_IMPACT[achievementType];
      reward = {
        type: 'community_impact',
        achievementType,
        amount: impact.reward,
        description: impact.description,
        context
      };
    }
    
    // Check gaming achievements
    else if (achievements.GAMING_ACHIEVEMENTS[achievementType]) {
      const gaming = achievements.GAMING_ACHIEVEMENTS[achievementType];
      reward = {
        type: 'gaming_achievement',
        achievementType,
        amount: gaming.reward,
        description: gaming.description,
        context
      };
    }
    
    if (reward) {
      // Apply creator tier multiplier to achievement rewards
      const tierInfo = this.getCreatorTierMultiplier(creator);
      reward.amount = Math.floor(reward.amount * tierInfo.multiplier);
      reward.tierMultiplier = tierInfo.multiplier;
      reward.creatorTier = tierInfo.tier;
      
      // Record achievement
      await this.recordAchievement(creator.id, reward);
    }
    
    return reward;
  }
  
  /**
   * Generate creator earnings dashboard data
   * @param {string} creatorId - Creator ID
   * @param {Object} options - Dashboard options
   * @returns {Object} Creator earnings dashboard data
   */
  async getCreatorDashboard(creatorId, options = {}) {
    const timeFrame = options.timeFrame || 'all'; // all, month, week, day
    const creatorStats = this.creatorStats.get(creatorId) || {};
    
    // Get reward history for creator
    const rewardHistory = this.getCreatorRewardHistory(creatorId, timeFrame);
    
    // Calculate earnings metrics
    const totalEarnings = rewardHistory.reduce((sum, reward) => sum + reward.amount, 0);
    const averageReward = rewardHistory.length > 0 ? totalEarnings / rewardHistory.length : 0;
    const bestReward = Math.max(...rewardHistory.map(r => r.amount), 0);
    
    // Get content performance
    const contentPerformance = await this.getCreatorContentPerformance(creatorId, timeFrame);
    
    // Calculate ranking and percentiles
    const allCreatorEarnings = Array.from(this.creatorStats.values()).map(s => s.totalEarnings || 0);
    allCreatorEarnings.sort((a, b) => b - a);
    const creatorRank = allCreatorEarnings.indexOf(totalEarnings) + 1;
    const percentile = ((allCreatorEarnings.length - creatorRank + 1) / allCreatorEarnings.length) * 100;
    
    // Predict next rewards
    const rewardPredictions = await this.predictCreatorRewards(creatorId);
    
    return {
      creatorId,
      timeFrame,
      earnings: {
        total: totalEarnings,
        average: averageReward,
        best: bestReward,
        rewardsCount: rewardHistory.length,
        rank: creatorRank,
        percentile: Math.round(percentile)
      },
      performance: contentPerformance,
      achievements: creatorStats.achievements || [],
      tier: this.getCreatorTierMultiplier({ id: creatorId }).tier,
      predictions: rewardPredictions,
      history: rewardHistory.slice(-50), // Last 50 rewards
      trends: this.calculateEarningsTrends(rewardHistory),
      recommendations: this.generateEarningsRecommendations(creatorStats, contentPerformance)
    };
  }
  
  /**
   * Get reward pool health and monitoring data
   * @returns {Object} Pool health monitoring data
   */
  async getRewardPoolHealth() {
    const treasuryBalance = await this.getTreasuryBalance();
    const poolData = Object.fromEntries(this.rewardPools);
    
    // Calculate pool utilization rates
    const dailyUtilization = (poolData.daily.distributed / poolData.daily.allocated) * 100;
    const weeklyUtilization = (poolData.weekly.distributed / poolData.weekly.allocated) * 100;
    const monthlyUtilization = (poolData.monthly.distributed / poolData.monthly.allocated) * 100;
    
    // Estimate remaining runway
    const dailyBurnRate = this.calculateDailyBurnRate();
    const estimatedRunwayDays = dailyBurnRate > 0 ? treasuryBalance / dailyBurnRate : Infinity;
    
    // Health status assessment
    let healthStatus = 'healthy';
    if (dailyUtilization > 90 || treasuryBalance < dailyBurnRate * 7) {
      healthStatus = 'critical';
    } else if (dailyUtilization > 75 || treasuryBalance < dailyBurnRate * 30) {
      healthStatus = 'warning';
    }
    
    return {
      treasuryBalance,
      pools: poolData,
      utilization: {
        daily: dailyUtilization,
        weekly: weeklyUtilization,
        monthly: monthlyUtilization,
        overall: ((dailyUtilization + weeklyUtilization + monthlyUtilization) / 3)
      },
      runway: {
        estimatedDays: Math.floor(estimatedRunwayDays),
        dailyBurnRate,
        status: healthStatus
      },
      metrics: this.metrics,
      lastUpdate: new Date().toISOString(),
      recommendations: this.generatePoolHealthRecommendations(healthStatus, dailyUtilization)
    };
  }
  
  /**
   * Submit appeal for reward dispute
   * @param {Object} appealData - Appeal information
   * @returns {Object} Appeal submission result
   */
  async submitRewardAppeal(appealData) {
    if (!this.config.APPEALS.ENABLED) {
      return {
        success: false,
        reason: 'Appeals system is currently disabled'
      };
    }
    
    const appealId = this.generateAppealId();
    const appeal = {
      id: appealId,
      creatorId: appealData.creatorId,
      rewardId: appealData.rewardId,
      appealType: appealData.appealType, // 'denied_reward', 'incorrect_amount', 'technical_error'
      description: appealData.description,
      evidence: appealData.evidence || [],
      submittedAt: new Date().toISOString(),
      status: 'pending',
      communityVotes: { support: 0, oppose: 0 },
      reviewDeadline: new Date(Date.now() + (this.config.APPEALS.APPEAL_WINDOW_HOURS * 60 * 60 * 1000)).toISOString()
    };
    
    this.appealsCases.set(appealId, appeal);
    
    console.log(`Reward appeal submitted: ${appealId} by creator ${appealData.creatorId}`);
    
    return {
      success: true,
      appealId,
      status: appeal.status,
      reviewDeadline: appeal.reviewDeadline
    };
  }
  
  /**
   * Helper Methods
   */
  
  async getTreasuryBalance() {
    // Mock implementation - would connect to actual treasury
    return 1000000; // 1M MLG tokens
  }
  
  async getTreasuryTokenAccount() {
    // Mock implementation - would return actual treasury token account
    return new PublicKey('11111111111111111111111111111111');
  }
  
  async getTreasuryAuthority() {
    // Mock implementation - would return actual treasury authority
    return new PublicKey('11111111111111111111111111111111');
  }
  
  async getTreasuryKeypair() {
    // Mock implementation - would return actual treasury keypair
    return Keypair.generate();
  }
  
  calculateNextDistribution(poolType) {
    const now = new Date();
    let nextDistribution;
    
    switch (poolType) {
      case 'daily':
        nextDistribution = new Date(now);
        nextDistribution.setUTCHours(nextDistribution.getUTCHours() + 1, 0, 0, 0);
        break;
      case 'weekly':
        nextDistribution = new Date(now);
        nextDistribution.setUTCDate(nextDistribution.getUTCDate() + (7 - nextDistribution.getUTCDay()));
        nextDistribution.setUTCHours(0, 0, 0, 0);
        break;
      case 'monthly':
        nextDistribution = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
        break;
      default:
        nextDistribution = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
    
    return nextDistribution.toISOString();
  }
  
  getTodayRewardsCount(creatorId) {
    const today = new Date().toDateString();
    return this.rewardHistory.filter(reward => 
      reward.recipient === creatorId && 
      new Date(reward.timestamp).toDateString() === today
    ).length;
  }
  
  getLastRewardTime(creatorId) {
    const creatorRewards = this.rewardHistory.filter(r => r.recipient === creatorId);
    if (creatorRewards.length === 0) return null;
    
    creatorRewards.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return new Date(creatorRewards[0].timestamp);
  }
  
  analyzeVotingPatterns(content) {
    // Simplified analysis - would implement more sophisticated pattern detection
    const votes = content.mlgVotes || {};
    const totalVotes = (votes.upvotes || 0) + (votes.downvotes || 0);
    
    // Check for unusual voting velocity
    const ageHours = (new Date() - new Date(content.createdAt)) / (1000 * 60 * 60);
    const votesPerHour = totalVotes / Math.max(ageHours, 1);
    
    return {
      suspicious: votesPerHour > 50, // More than 50 votes per hour is suspicious
      patterns: ['high_velocity'],
      confidence: votesPerHour > 50 ? 0.8 : 0.2
    };
  }
  
  async checkContentSimilarity(content) {
    // Simplified similarity check - would implement more sophisticated comparison
    const cacheKey = `similarity_${content.id}`;
    
    if (this.antiGamingTracker.contentSimilarityCache.has(cacheKey)) {
      return this.antiGamingTracker.contentSimilarityCache.get(cacheKey);
    }
    
    const result = {
      suspicious: false,
      similarityScore: 0.1, // Low similarity score
      matchedContent: []
    };
    
    this.antiGamingTracker.contentSimilarityCache.set(cacheKey, result);
    return result;
  }
  
  analyzeBehaviorPatterns(creator) {
    // Simplified behavior analysis - would implement more sophisticated detection
    const creatorStats = this.creatorStats.get(creator?.id) || {};
    
    return {
      suspicious: false,
      patterns: [],
      confidence: 0.1
    };
  }
  
  calculateRiskLevel(suspiciousCount) {
    if (suspiciousCount >= 3) return 'high';
    if (suspiciousCount >= 2) return 'medium';
    if (suspiciousCount >= 1) return 'low';
    return 'none';
  }
  
  updateCreatorStats(creatorId, rewardAmount) {
    const stats = this.creatorStats.get(creatorId) || {
      totalEarnings: 0,
      rewardCount: 0,
      averageReward: 0,
      lastRewardTime: null
    };
    
    stats.totalEarnings += rewardAmount;
    stats.rewardCount += 1;
    stats.averageReward = stats.totalEarnings / stats.rewardCount;
    stats.lastRewardTime = new Date().toISOString();
    
    this.creatorStats.set(creatorId, stats);
    this.metrics.uniqueRecipients.add(creatorId);
  }
  
  async updateRewardMetrics(results) {
    this.metrics.totalRewardsDistributed += results.totalAmount;
    this.metrics.successfulTransactions += results.successful.length;
    this.metrics.failedTransactions += results.failed.length;
    this.metrics.lastDistributionTime = new Date().toISOString();
    
    if (results.successful.length > 0) {
      const totalAmount = results.successful.reduce((sum, r) => sum + r.amount, 0);
      this.metrics.averageRewardAmount = 
        (this.metrics.averageRewardAmount * (this.metrics.successfulTransactions - results.successful.length) + totalAmount) / 
        this.metrics.successfulTransactions;
    }
  }
  
  async recordRewardHistory(results) {
    const historyEntries = results.successful.concat(results.failed).map(reward => ({
      ...reward,
      distributionBatch: new Date().toISOString(),
      poolType: 'performance' // Could be 'daily', 'weekly', 'monthly', 'achievement', etc.
    }));
    
    this.rewardHistory.push(...historyEntries);
    
    // Keep only last 10,000 entries to prevent memory issues
    if (this.rewardHistory.length > 10000) {
      this.rewardHistory = this.rewardHistory.slice(-10000);
    }
  }
  
  async recordAchievement(creatorId, achievement) {
    const stats = this.creatorStats.get(creatorId) || {};
    if (!stats.achievements) stats.achievements = [];
    
    stats.achievements.push({
      ...achievement,
      earnedAt: new Date().toISOString()
    });
    
    this.creatorStats.set(creatorId, stats);
  }
  
  getCreatorRewardHistory(creatorId, timeFrame) {
    let cutoffTime;
    const now = new Date();
    
    switch (timeFrame) {
      case 'day':
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffTime = new Date(0); // All time
    }
    
    return this.rewardHistory.filter(reward => 
      reward.recipient === creatorId && 
      new Date(reward.timestamp) >= cutoffTime
    );
  }
  
  async getCreatorContentPerformance(creatorId, timeFrame) {
    // Mock implementation - would query actual content database
    return {
      totalContent: 25,
      averageScore: 65.5,
      topContent: 3,
      totalViews: 50000,
      totalEngagement: 5500,
      averageEngagementRate: 0.11
    };
  }
  
  async predictCreatorRewards(creatorId) {
    const stats = this.creatorStats.get(creatorId) || {};
    const averageReward = stats.averageReward || 0;
    
    return {
      nextReward: {
        estimated: Math.floor(averageReward * 1.1),
        confidence: 0.7,
        timeframe: '24-48 hours'
      },
      weeklyEstimate: Math.floor(averageReward * 5),
      monthlyEstimate: Math.floor(averageReward * 20),
      growthPotential: 'medium' // low, medium, high
    };
  }
  
  calculateEarningsTrends(rewardHistory) {
    if (rewardHistory.length < 2) return { trend: 'neutral', change: 0 };
    
    const recent = rewardHistory.slice(-7); // Last 7 rewards
    const older = rewardHistory.slice(-14, -7); // Previous 7 rewards
    
    const recentAvg = recent.reduce((sum, r) => sum + r.amount, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, r) => sum + r.amount, 0) / older.length : recentAvg;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    let trend = 'neutral';
    if (change > 10) trend = 'increasing';
    else if (change < -10) trend = 'decreasing';
    
    return { trend, change: Math.round(change) };
  }
  
  generateEarningsRecommendations(creatorStats, contentPerformance) {
    const recommendations = [];
    
    if (contentPerformance.averageEngagementRate < 0.05) {
      recommendations.push({
        type: 'engagement',
        message: 'Focus on creating more engaging content to boost rewards',
        impact: 'high'
      });
    }
    
    if (creatorStats.averageReward < 100) {
      recommendations.push({
        type: 'quality',
        message: 'Improve content quality to qualify for higher reward tiers',
        impact: 'medium'
      });
    }
    
    if (contentPerformance.totalContent < 10) {
      recommendations.push({
        type: 'consistency',
        message: 'Post consistently to build audience and increase reward potential',
        impact: 'medium'
      });
    }
    
    return recommendations;
  }
  
  calculateDailyBurnRate() {
    const recentRewards = this.rewardHistory.filter(reward => 
      new Date(reward.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    
    if (recentRewards.length === 0) return 0;
    
    const totalAmount = recentRewards.reduce((sum, r) => sum + r.amount, 0);
    return totalAmount / 7; // Daily average
  }
  
  generatePoolHealthRecommendations(healthStatus, utilization) {
    const recommendations = [];
    
    if (healthStatus === 'critical') {
      recommendations.push({
        priority: 'urgent',
        action: 'Increase treasury funding immediately',
        description: 'Treasury balance critically low'
      });
    }
    
    if (utilization > 80) {
      recommendations.push({
        priority: 'high',
        action: 'Consider increasing reward pool allocation',
        description: 'High utilization rate may limit reward opportunities'
      });
    }
    
    if (utilization < 30) {
      recommendations.push({
        priority: 'medium',
        action: 'Consider promoting reward opportunities to creators',
        description: 'Low utilization suggests untapped reward potential'
      });
    }
    
    return recommendations;
  }
  
  generateRewardRecommendations(content, rewardAmount) {
    const recommendations = [];
    
    if (rewardAmount === 0) {
      recommendations.push({
        type: 'improvement',
        message: 'Focus on increasing engagement and content quality to qualify for rewards'
      });
    } else if (rewardAmount < 100) {
      recommendations.push({
        type: 'growth',
        message: 'Continue improving content to reach higher reward tiers'
      });
    } else {
      recommendations.push({
        type: 'maintenance',
        message: 'Great work! Maintain this quality to continue earning top rewards'
      });
    }
    
    return recommendations;
  }
  
  generateAppealId() {
    return `appeal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  startBackgroundProcessing() {
    // Process reward queue every minute
    if (typeof setInterval !== 'undefined') {
      setInterval(() => {
        this.processScheduledRewards();
      }, 60000);
      
      // Update pool health every 5 minutes
      setInterval(() => {
        this.updatePoolHealth();
      }, 300000);
    }
  }
  
  async processScheduledRewards() {
    if (this.distributionQueue.length > 0) {
      const batch = this.distributionQueue.splice(0, this.config.DISTRIBUTION.BATCH_SIZE);
      await this.distributeRewards(batch);
    }
  }
  
  async updatePoolHealth() {
    const health = await this.getRewardPoolHealth();
    this.metrics.poolHealthStatus = health.runway.status;
  }
}

/**
 * Reward Analytics and Reporting System
 */
export class RewardAnalytics {
  constructor(rewardSystem) {
    this.rewardSystem = rewardSystem;
  }
  
  /**
   * Generate comprehensive reward analytics report
   * @param {Object} options - Report options
   * @returns {Object} Analytics report
   */
  generateAnalyticsReport(options = {}) {
    const timeframe = options.timeframe || 'month';
    const history = this.rewardSystem.rewardHistory;
    
    // Filter by timeframe
    let cutoffTime;
    const now = new Date();
    switch (timeframe) {
      case 'day':
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffTime = new Date(0);
    }
    
    const filteredRewards = history.filter(r => new Date(r.timestamp) >= cutoffTime);
    
    return {
      timeframe,
      summary: {
        totalRewards: filteredRewards.length,
        totalAmount: filteredRewards.reduce((sum, r) => sum + r.amount, 0),
        uniqueCreators: new Set(filteredRewards.map(r => r.recipient)).size,
        averageReward: filteredRewards.length > 0 ? 
          filteredRewards.reduce((sum, r) => sum + r.amount, 0) / filteredRewards.length : 0
      },
      distribution: this.analyzeRewardDistribution(filteredRewards),
      topPerformers: this.getTopPerformers(filteredRewards),
      trends: this.analyzeRewardTrends(filteredRewards),
      poolUtilization: this.analyzePoolUtilization()
    };
  }
  
  analyzeRewardDistribution(rewards) {
    const tiers = {
      high: rewards.filter(r => r.amount >= 500).length,
      medium: rewards.filter(r => r.amount >= 100 && r.amount < 500).length,
      low: rewards.filter(r => r.amount < 100).length
    };
    
    const types = rewards.reduce((acc, reward) => {
      acc[reward.type || 'performance'] = (acc[reward.type || 'performance'] || 0) + 1;
      return acc;
    }, {});
    
    return { tiers, types };
  }
  
  getTopPerformers(rewards, limit = 10) {
    const creatorTotals = rewards.reduce((acc, reward) => {
      acc[reward.recipient] = (acc[reward.recipient] || 0) + reward.amount;
      return acc;
    }, {});
    
    return Object.entries(creatorTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([creatorId, totalEarnings]) => ({ creatorId, totalEarnings }));
  }
  
  analyzeRewardTrends(rewards) {
    // Group by day
    const dailyTotals = rewards.reduce((acc, reward) => {
      const day = new Date(reward.timestamp).toDateString();
      acc[day] = (acc[day] || 0) + reward.amount;
      return acc;
    }, {});
    
    const dates = Object.keys(dailyTotals).sort();
    const values = dates.map(date => dailyTotals[date]);
    
    // Calculate trend
    let trend = 'stable';
    if (values.length >= 2) {
      const recent = values.slice(-3).reduce((sum, val) => sum + val, 0) / 3;
      const older = values.slice(-6, -3).reduce((sum, val) => sum + val, 0) / 3;
      
      if (recent > older * 1.1) trend = 'increasing';
      else if (recent < older * 0.9) trend = 'decreasing';
    }
    
    return {
      trend,
      dailyData: dates.map(date => ({ date, amount: dailyTotals[date] }))
    };
  }
  
  analyzePoolUtilization() {
    const pools = Object.fromEntries(this.rewardSystem.rewardPools);
    
    return Object.entries(pools).reduce((acc, [poolName, poolData]) => {
      acc[poolName] = {
        utilization: (poolData.distributed / poolData.allocated) * 100,
        remaining: poolData.remaining,
        nextDistribution: poolData.nextDistribution
      };
      return acc;
    }, {});
  }
}

/**
 * Reward UI Component Integration
 */
export class RewardUIComponents {
  constructor(rewardSystem) {
    this.rewardSystem = rewardSystem;
  }
  
  /**
   * Generate creator earnings widget
   * @param {string} creatorId - Creator ID
   * @returns {Object} Widget data
   */
  async generateEarningsWidget(creatorId) {
    const dashboard = await this.rewardSystem.getCreatorDashboard(creatorId);
    
    return {
      type: 'earnings_widget',
      data: {
        totalEarnings: dashboard.earnings.total,
        rank: dashboard.earnings.rank,
        percentile: dashboard.earnings.percentile,
        nextReward: dashboard.predictions.nextReward,
        trend: dashboard.trends.trend,
        tier: dashboard.tier
      },
      visualizations: {
        earningsChart: this.generateEarningsChartData(dashboard.history),
        progressBar: {
          current: dashboard.earnings.total,
          nextTier: this.calculateNextTierThreshold(dashboard.tier)
        }
      }
    };
  }
  
  /**
   * Generate reward pool status widget
   * @returns {Object} Pool status widget data
   */
  async generatePoolStatusWidget() {
    const poolHealth = await this.rewardSystem.getRewardPoolHealth();
    
    return {
      type: 'pool_status_widget',
      data: {
        healthStatus: poolHealth.runway.status,
        treasuryBalance: poolHealth.treasuryBalance,
        dailyBurnRate: poolHealth.runway.dailyBurnRate,
        estimatedRunway: poolHealth.runway.estimatedDays,
        utilization: poolHealth.utilization
      },
      alerts: this.generatePoolAlerts(poolHealth)
    };
  }
  
  generateEarningsChartData(history) {
    return history.slice(-30).map(reward => ({
      date: new Date(reward.timestamp).toLocaleDateString(),
      amount: reward.amount,
      type: reward.type
    }));
  }
  
  calculateNextTierThreshold(currentTier) {
    const thresholds = {
      standard: 1000,
      rising_star: 5000,
      established: 10000,
      clan_leader: 25000,
      verified: 50000
    };
    
    const tierOrder = ['standard', 'rising_star', 'established', 'clan_leader', 'verified'];
    const currentIndex = tierOrder.indexOf(currentTier);
    const nextTier = tierOrder[currentIndex + 1];
    
    return nextTier ? thresholds[nextTier] : null;
  }
  
  generatePoolAlerts(poolHealth) {
    const alerts = [];
    
    if (poolHealth.runway.status === 'critical') {
      alerts.push({
        type: 'error',
        message: 'Critical: Treasury balance critically low',
        action: 'immediate_attention'
      });
    }
    
    if (poolHealth.utilization.overall > 85) {
      alerts.push({
        type: 'warning',
        message: 'High pool utilization detected',
        action: 'monitor_closely'
      });
    }
    
    return alerts;
  }
}

// Export default instance
export default ContentRewardSystem;

// Export analytics engine
export const rewardAnalytics = RewardAnalytics;

// Export UI components
export const rewardUIComponents = RewardUIComponents;

// Configuration already exported above with the class