/**
 * MLG.clan Clan Leaderboard System - Sub-task 5.5
 * 
 * Comprehensive clan leaderboard system that calculates collective clan scores 
 * based on member voting contributions, token burns, and governance participation.
 * Implements competitive ranking across multiple categories with time-based rankings,
 * achievement systems, and transparent blockchain-verified scoring.
 * 
 * Core Features:
 * - Multi-category leaderboards (Overall Power, Content Curation, Governance, etc.)
 * - Time-based rankings (All-time, Seasonal, Monthly, Weekly, Daily)
 * - Tier promotion systems based on collective performance
 * - Achievement tracking for milestone voting goals
 * - Streak tracking for consistent participation
 * - Rivalry systems between competing clans
 * - Real-time leaderboard updates with WebSocket integration
 * - Anti-gaming measures and transparent scoring algorithms
 * 
 * Leaderboard Categories:
 * - Overall Power: Combined voting activity and token burns
 * - Content Curation: Content-related voting participation
 * - Governance Leadership: Governance proposal participation  
 * - Community Engagement: General voting activity
 * - Token Economics: MLG token burn contributions
 * - Alliance Building: Alliance-related voting
 * 
 * Integration Points:
 * - clan-management.js: Core clan data and member information
 * - clan-voting.js: Voting metrics and participation data
 * - solana-voting-system.js: Base voting system integration
 * - MLG Token Contract: Token burn verification and scoring
 * - Solana Blockchain: Transparent and verifiable scoring
 * 
 * @author Claude Code - Solana Web3 Security Architect
 * @version 1.0.0
 * @integration MLG Token: 7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL
 */

import {
Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';

import {
TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getAccount
} from '@solana/spl-token';

import { 
  createConnection, 
  createMLGTokenConnection,
  MLG_TOKEN_CONFIG,
  TOKEN_PROGRAMS,
  CURRENT_NETWORK
} from '../../../config/environment/solana-config.js';

import { CLAN_TIER_CONFIG, CLAN_ROLES } from './clan-management.js';
import { CLAN_VOTING_CONFIG } from './clan-voting.js';
import SolanaVotingSystem from '../voting/solana-voting-system.js';
import crypto from 'crypto';

/**
 * Clan Leaderboard Configuration
 * Defines scoring algorithms, time periods, and competitive mechanics
 */
export const CLAN_LEADERBOARD_CONFIG = {
  // Leaderboard Categories with scoring weights and calculations
  CATEGORIES: {
    OVERALL_POWER: {
      id: 'overall_power',
      name: 'Overall Power',
      description: 'Combined voting activity and token burns across all categories',
      icon: '⚡',
      color: '#FFD700',
      weight: 1.0,
      formula: 'voting_activity * 0.4 + token_burns * 0.3 + governance_participation * 0.2 + consistency * 0.1',
      components: {
        voting_activity: 0.4,
        token_burns: 0.3,
        governance_participation: 0.2,
        consistency: 0.1
      },
      minParticipants: 3, // Minimum clan members for ranking eligibility
      tierMultipliers: {
        diamond: 2.0,
        gold: 1.5,
        silver: 1.2,
        bronze: 1.0
      }
    },
    CONTENT_CURATION: {
      id: 'content_curation',
      name: 'Content Curation',
      description: 'Content-related voting participation and quality contributions',
      icon: '📝',
      color: '#8B5CF6',
      weight: 1.0,
      formula: 'content_votes * 0.5 + quality_scores * 0.3 + moderation_activity * 0.2',
      components: {
        content_votes: 0.5,
        quality_scores: 0.3,
        moderation_activity: 0.2
      },
      minParticipants: 2,
      tierMultipliers: {
        diamond: 1.8,
        gold: 1.4,
        silver: 1.2,
        bronze: 1.0
      }
    },
    GOVERNANCE_LEADERSHIP: {
      id: 'governance_leadership',
      name: 'Governance Leadership',
      description: 'Governance proposal participation and decision-making influence',
      icon: '⚖️',
      color: '#4F46E5',
      weight: 1.0,
      formula: 'governance_votes * 0.4 + proposal_creation * 0.3 + voting_power_used * 0.2 + delegation_received * 0.1',
      components: {
        governance_votes: 0.4,
        proposal_creation: 0.3,
        voting_power_used: 0.2,
        delegation_received: 0.1
      },
      minParticipants: 3,
      tierMultipliers: {
        diamond: 2.2,
        gold: 1.6,
        silver: 1.3,
        bronze: 1.0
      }
    },
    COMMUNITY_ENGAGEMENT: {
      id: 'community_engagement',
      name: 'Community Engagement',
      description: 'General voting activity and member participation rates',
      icon: '👥',
      color: '#059669',
      weight: 1.0,
      formula: 'participation_rate * 0.4 + vote_frequency * 0.3 + member_retention * 0.2 + cross_clan_activity * 0.1',
      components: {
        participation_rate: 0.4,
        vote_frequency: 0.3,
        member_retention: 0.2,
        cross_clan_activity: 0.1
      },
      minParticipants: 5,
      tierMultipliers: {
        diamond: 1.6,
        gold: 1.3,
        silver: 1.1,
        bronze: 1.0
      }
    },
    TOKEN_ECONOMICS: {
      id: 'token_economics',
      name: 'Token Economics',
      description: 'MLG token burn contributions and economic participation',
      icon: '🔥',
      color: '#DC2626',
      weight: 1.0,
      formula: 'total_burns * 0.6 + burn_frequency * 0.2 + burn_efficiency * 0.2',
      components: {
        total_burns: 0.6,
        burn_frequency: 0.2,
        burn_efficiency: 0.2
      },
      minParticipants: 2,
      tierMultipliers: {
        diamond: 2.5,
        gold: 1.8,
        silver: 1.4,
        bronze: 1.0
      }
    },
    ALLIANCE_BUILDING: {
      id: 'alliance_building',
      name: 'Alliance Building',
      description: 'Alliance-related voting and diplomatic engagement',
      icon: '🤝',
      color: '#0891B2',
      weight: 1.0,
      formula: 'alliance_votes * 0.5 + diplomatic_activity * 0.3 + partnership_success * 0.2',
      components: {
        alliance_votes: 0.5,
        diplomatic_activity: 0.3,
        partnership_success: 0.2
      },
      minParticipants: 2,
      tierMultipliers: {
        diamond: 1.9,
        gold: 1.5,
        silver: 1.2,
        bronze: 1.0
      }
    }
  },

  // Time-based ranking periods
  TIME_PERIODS: {
    ALL_TIME: {
      id: 'all_time',
      name: 'All-Time',
      description: 'Historical performance since clan creation',
      duration: null, // No time limit
      icon: '♾️',
      weight: 1.0,
      cacheHours: 24 // Update daily
    },
    SEASONAL: {
      id: 'seasonal',
      name: 'Seasonal',
      description: 'Quarterly performance rankings',
      duration: 90 * 24 * 60 * 60 * 1000, // 90 days in milliseconds
      icon: '🗓️',
      weight: 1.2, // Slightly higher weight for seasonal achievements
      cacheHours: 6 // Update every 6 hours
    },
    MONTHLY: {
      id: 'monthly',
      name: 'Monthly',
      description: 'Monthly performance rankings',
      duration: 30 * 24 * 60 * 60 * 1000, // 30 days
      icon: '📅',
      weight: 1.1,
      cacheHours: 2 // Update every 2 hours
    },
    WEEKLY: {
      id: 'weekly',
      name: 'Weekly',
      description: 'Weekly performance rankings',
      duration: 7 * 24 * 60 * 60 * 1000, // 7 days
      icon: '📊',
      weight: 1.0,
      cacheHours: 1 // Update hourly
    },
    DAILY: {
      id: 'daily',
      name: 'Daily',
      description: 'Daily activity rankings',
      duration: 24 * 60 * 60 * 1000, // 24 hours
      icon: '⭐',
      weight: 0.8, // Lower weight for short-term rankings
      cacheHours: 0.25 // Update every 15 minutes
    }
  },

  // Achievement System Configuration
  ACHIEVEMENTS: {
    VOTING_MILESTONES: {
      FIRST_VOTE: { threshold: 1, reward: 'First Vote', icon: '🗳️', points: 10 },
      VOTING_VETERAN: { threshold: 100, reward: 'Voting Veteran', icon: '🎖️', points: 100 },
      DEMOCRACY_CHAMPION: { threshold: 500, reward: 'Democracy Champion', icon: '🏆', points: 500 },
      GOVERNANCE_LEGEND: { threshold: 1000, reward: 'Governance Legend', icon: '👑', points: 1000 }
    },
    BURN_MILESTONES: {
      FIRST_BURN: { threshold: 1, reward: 'Token Burner', icon: '🔥', points: 25 },
      BIG_SPENDER: { threshold: 100, reward: 'Big Spender', icon: '💰', points: 250 },
      WHALE: { threshold: 1000, reward: 'Token Whale', icon: '🐋', points: 1000 },
      LEGENDARY_BURNER: { threshold: 10000, reward: 'Legendary Burner', icon: '🌋', points: 5000 }
    },
    STREAK_MILESTONES: {
      WEEK_STREAK: { threshold: 7, reward: 'Weekly Warrior', icon: '⚡', points: 50 },
      MONTH_STREAK: { threshold: 30, reward: 'Monthly Master', icon: '🔥', points: 200 },
      QUARTER_STREAK: { threshold: 90, reward: 'Quarterly Champion', icon: '💎', points: 500 },
      YEAR_STREAK: { threshold: 365, reward: 'Annual Legend', icon: '👑', points: 2000 }
    }
  },

  // Streak Tracking Configuration
  STREAK_CONFIG: {
    MIN_DAILY_ACTIVITY: 1, // Minimum votes/day to maintain streak
    GRACE_PERIOD_HOURS: 36, // Grace period for streak continuation
    RESET_ON_MISS: true, // Reset streak on missed days
    BONUS_MULTIPLIERS: {
      7: 1.1,   // 10% bonus after 7-day streak
      30: 1.25, // 25% bonus after 30-day streak
      90: 1.5,  // 50% bonus after 90-day streak
      365: 2.0  // 100% bonus after 365-day streak
    }
  },

  // Rivalry System Configuration
  RIVALRY_CONFIG: {
    ENABLED: true,
    MAX_RIVALRIES_PER_CLAN: 5,
    RIVALRY_THRESHOLD_DIFFERENCE: 0.1, // 10% score difference to trigger rivalry
    RIVALRY_BONUS_MULTIPLIER: 1.2, // 20% bonus when competing with rivals
    RIVALRY_COOLDOWN_DAYS: 30, // Cooldown after rivalry ends
    RIVALRY_TYPES: {
      SCORE_BASED: 'Similar performance levels',
      TIER_BASED: 'Same tier competition',
      ALLIANCE_BASED: 'Alliance conflicts',
      HISTORICAL: 'Past competitive history'
    }
  },

  // Anti-Gaming Security Measures
  SECURITY: {
    MAX_DAILY_VOTES_PER_MEMBER: 50, // Prevent vote spam
    MIN_VOTE_INTERVAL_SECONDS: 30, // Minimum time between votes
    BURN_VERIFICATION_REQUIRED: true, // Verify all token burns
    SCORE_AUDIT_FREQUENCY_HOURS: 24, // Regular score audits
    SUSPICIOUS_ACTIVITY_THRESHOLD: 5.0, // Score multiplier that triggers review
    CLAN_SIZE_NORMALIZATION: true, // Normalize scores by clan size
    BLOCKCHAIN_VERIFICATION: true, // Verify all transactions on-chain
    RATE_LIMITING: {
      SCORE_UPDATES_PER_HOUR: 100,
      LEADERBOARD_QUERIES_PER_MINUTE: 60
    }
  },

  // Real-time Update Configuration
  REALTIME: {
    WEBSOCKET_ENABLED: true,
    UPDATE_INTERVALS: {
      SCORE_CALCULATION: 300000, // 5 minutes
      LEADERBOARD_REFRESH: 60000, // 1 minute
      ACHIEVEMENT_CHECK: 600000, // 10 minutes
      STREAK_UPDATE: 3600000 // 1 hour
    },
    BATCH_SIZE: 50, // Process clans in batches
    CONCURRENT_UPDATES: 5 // Maximum concurrent score updates
  }
};

/**
 * Clan Leaderboard System
 * Main class for calculating and managing clan rankings across multiple categories
 */
export class ClanLeaderboardSystem {
  constructor(options = {}) {
    this.connection = null;
    this.mlgTokenConnection = null;
    this.baseVotingSystem = null;
    
    // Data storage and caching
    this.clanScores = new Map(); // clan_id -> category_scores
    this.leaderboards = new Map(); // category_period -> rankings
    this.achievements = new Map(); // clan_id -> achievements
    this.streaks = new Map(); // clan_id -> streak_data
    this.rivalries = new Map(); // clan_id -> rival_relationships
    
    // Analytics and tracking
    this.scoreHistory = new Map(); // clan_id -> historical_scores
    this.participationMetrics = new Map(); // clan_id -> participation_data
    this.burnAnalytics = new Map(); // clan_id -> burn_statistics
    
    // Performance optimization
    this.scoreCache = new Map();
    this.lastUpdate = new Map();
    this.updateQueue = new Set();
    
    // Initialize system components
    this.initializeConnections();
    this.startRealTimeUpdates();
  }

  /**
   * Initialize Solana connections and base systems
   */
  async initializeConnections() {
    try {
      this.connection = await createConnection();
      this.mlgTokenConnection = await createMLGTokenConnection();
      this.baseVotingSystem = new SolanaVotingSystem();
      
      console.log('ClanLeaderboardSystem: Connections initialized successfully');
      return true;
    } catch (error) {
      console.error('ClanLeaderboardSystem: Connection initialization failed:', error);
      throw error;
    }
  }

  /**
   * Calculate comprehensive clan score for a specific category
   * @param {string} clanId - Clan identifier
   * @param {string} category - Leaderboard category
   * @param {string} period - Time period for calculation
   * @returns {Promise<Object>} Detailed score breakdown
   */
  async calculateClanScore(clanId, category, period = 'all_time') {
    try {
      const categoryConfig = CLAN_LEADERBOARD_CONFIG.CATEGORIES[category.toUpperCase()];
      const periodConfig = CLAN_LEADERBOARD_CONFIG.TIME_PERIODS[period.toUpperCase()];
      
      if (!categoryConfig || !periodConfig) {
        throw new Error(`Invalid category "${category}" or period "${period}"`);
      }

      // Get clan data and validate eligibility
      const clanData = await this.getClanData(clanId);
      if (!clanData) {
        throw new Error(`Clan not found: ${clanId}`);
      }

      // Check minimum participation requirements
      if (clanData.memberCount < categoryConfig.minParticipants) {
        return {
          clanId,
          category,
          period,
          score: 0,
          eligible: false,
          reason: `Minimum ${categoryConfig.minParticipants} participants required`,
          breakdown: {}
        };
      }

      // Calculate time window for period-based scores
      const timeWindow = this.calculateTimeWindow(periodConfig);
      
      // Get category-specific metrics
      const metrics = await this.getClanMetrics(clanId, category, timeWindow);
      
      // Calculate component scores based on category formula
      const componentScores = await this.calculateComponentScores(
        metrics, 
        categoryConfig.components,
        clanData
      );

      // Apply tier multipliers
      const tierMultiplier = categoryConfig.tierMultipliers[clanData.tier] || 1.0;
      
      // Apply streak bonuses
      const streakMultiplier = await this.calculateStreakMultiplier(clanId, category);
      
      // Apply rivalry bonuses
      const rivalryMultiplier = await this.calculateRivalryMultiplier(clanId, category);
      
      // Calculate base score
      let baseScore = 0;
      const breakdown = {};
      
      for (const [component, weight] of Object.entries(categoryConfig.components)) {
        const componentScore = componentScores[component] || 0;
        const weightedScore = componentScore * weight;
        baseScore += weightedScore;
        
        breakdown[component] = {
          raw: componentScore,
          weighted: weightedScore,
          weight: weight
        };
      }

      // Apply all multipliers
      const finalScore = baseScore * tierMultiplier * streakMultiplier * rivalryMultiplier;

      // Anti-gaming validation
      const securityCheck = await this.validateScore(clanId, finalScore, metrics);
      
      const scoreData = {
        clanId,
        category,
        period,
        score: securityCheck.validated ? finalScore : 0,
        baseScore: baseScore,
        eligible: true,
        multipliers: {
          tier: tierMultiplier,
          streak: streakMultiplier,
          rivalry: rivalryMultiplier,
          total: tierMultiplier * streakMultiplier * rivalryMultiplier
        },
        breakdown,
        metrics,
        timestamp: new Date().toISOString(),
        securityCheck,
        clanData: {
          name: clanData.name,
          tier: clanData.tier,
          memberCount: clanData.memberCount
        }
      };

      // Update score cache
      this.updateScoreCache(clanId, category, period, scoreData);
      
      return scoreData;

    } catch (error) {
      console.error('ClanLeaderboardSystem: Score calculation failed:', error);
      throw error;
    }
  }

  /**
   * Get clan metrics for specific category and time window
   * @param {string} clanId - Clan identifier
   * @param {string} category - Category to calculate metrics for
   * @param {Object} timeWindow - Time window for calculations
   * @returns {Promise<Object>} Clan metrics data
   */
  async getClanMetrics(clanId, category, timeWindow) {
    try {
      const metrics = {
        voting_activity: 0,
        token_burns: 0,
        governance_participation: 0,
        consistency: 0,
        content_votes: 0,
        quality_scores: 0,
        moderation_activity: 0,
        governance_votes: 0,
        proposal_creation: 0,
        voting_power_used: 0,
        delegation_received: 0,
        participation_rate: 0,
        vote_frequency: 0,
        member_retention: 0,
        cross_clan_activity: 0,
        total_burns: 0,
        burn_frequency: 0,
        burn_efficiency: 0,
        alliance_votes: 0,
        diplomatic_activity: 0,
        partnership_success: 0
      };

      // Get clan members and their activity
      const clanMembers = await this.getClanMembers(clanId);
      const memberActivities = await Promise.all(
        clanMembers.map(member => this.getMemberActivity(member.address, timeWindow))
      );

      // Aggregate voting activity
      for (const activity of memberActivities) {
        metrics.voting_activity += activity.totalVotes;
        metrics.token_burns += activity.burnedTokens;
        metrics.governance_participation += activity.governanceVotes;
        metrics.content_votes += activity.contentVotes;
        metrics.governance_votes += activity.governanceVotes;
        metrics.proposal_creation += activity.proposalsCreated;
        metrics.voting_power_used += activity.votingPowerUsed;
        metrics.alliance_votes += activity.allianceVotes;
      }

      // Calculate derived metrics
      const activeDays = timeWindow.days || 1;
      const totalMembers = clanMembers.length;
      const activeMembers = memberActivities.filter(a => a.totalVotes > 0).length;

      metrics.participation_rate = totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0;
      metrics.vote_frequency = metrics.voting_activity / Math.max(activeDays, 1);
      metrics.burn_frequency = metrics.token_burns > 0 ? metrics.voting_activity / metrics.token_burns : 0;
      metrics.burn_efficiency = this.calculateBurnEfficiency(memberActivities);
      
      // Calculate consistency score (participation spread over time)
      metrics.consistency = await this.calculateConsistencyScore(clanId, timeWindow);
      
      // Calculate quality scores from content voting
      metrics.quality_scores = await this.calculateQualityScores(clanId, timeWindow);
      
      // Calculate moderation activity
      metrics.moderation_activity = await this.calculateModerationActivity(clanId, timeWindow);
      
      // Calculate member retention
      metrics.member_retention = await this.calculateMemberRetention(clanId, timeWindow);
      
      // Calculate diplomatic and alliance metrics
      const diplomaticData = await this.calculateDiplomaticMetrics(clanId, timeWindow);
      metrics.diplomatic_activity = diplomaticData.activity;
      metrics.partnership_success = diplomaticData.successRate;

      return metrics;

    } catch (error) {
      console.error('ClanLeaderboardSystem: Metrics calculation failed:', error);
      return {};
    }
  }

  /**
   * Calculate component scores based on metrics and weights
   * @param {Object} metrics - Raw clan metrics
   * @param {Object} components - Component weights
   * @param {Object} clanData - Clan data for normalization
   * @returns {Promise<Object>} Component scores
   */
  async calculateComponentScores(metrics, components, clanData) {
    const scores = {};
    
    for (const [component, weight] of Object.entries(components)) {
      let rawScore = metrics[component] || 0;
      
      // Normalize scores based on clan size and tier
      if (CLAN_LEADERBOARD_CONFIG.SECURITY.CLAN_SIZE_NORMALIZATION) {
        rawScore = this.normalizeByClanSize(rawScore, clanData.memberCount);
      }
      
      // Apply component-specific scaling
      scores[component] = this.scaleComponentScore(component, rawScore, clanData);
    }
    
    return scores;
  }

  /**
   * Generate leaderboard for specific category and period
   * @param {string} category - Leaderboard category
   * @param {string} period - Time period
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Generated leaderboard
   */
  async generateLeaderboard(category, period = 'all_time', options = {}) {
    try {
      const limit = options.limit || 100;
      const offset = options.offset || 0;
      
      // Get all eligible clans
      const allClans = await this.getAllClans();
      const eligibleClans = allClans.filter(clan => 
        clan.status === 'active' && 
        clan.memberCount >= CLAN_LEADERBOARD_CONFIG.CATEGORIES[category.toUpperCase()]?.minParticipants
      );

      // Calculate scores for all clans
      const clanScores = await Promise.all(
        eligibleClans.map(async (clan) => {
          try {
            return await this.calculateClanScore(clan.id, category, period);
          } catch (error) {
            console.warn(`Failed to calculate score for clan ${clan.id}:`, error);
            return null;
          }
        })
      );

      // Filter out failed calculations and sort by score
      const validScores = clanScores
        .filter(score => score && score.eligible && score.score > 0)
        .sort((a, b) => b.score - a.score);

      // Apply pagination
      const paginatedScores = validScores.slice(offset, offset + limit);

      // Calculate rankings and add position data
      const leaderboard = paginatedScores.map((scoreData, index) => ({
        ...scoreData,
        rank: offset + index + 1,
        percentile: ((validScores.length - (offset + index)) / validScores.length) * 100,
        badge: this.calculateRankBadge(offset + index + 1, validScores.length)
      }));

      // Calculate leaderboard statistics
      const stats = {
        totalClans: validScores.length,
        averageScore: validScores.reduce((sum, s) => sum + s.score, 0) / validScores.length,
        highestScore: validScores.length > 0 ? validScores[0].score : 0,
        lowestScore: validScores.length > 0 ? validScores[validScores.length - 1].score : 0,
        participationRate: (validScores.length / allClans.length) * 100
      };

      const leaderboardData = {
        category,
        period,
        rankings: leaderboard,
        statistics: stats,
        metadata: {
          generated: new Date().toISOString(),
          totalEntries: validScores.length,
          displayedEntries: leaderboard.length,
          pagination: {
            limit,
            offset,
            hasMore: offset + limit < validScores.length
          }
        }
      };

      // Cache the leaderboard
      this.cacheLeaderboard(category, period, leaderboardData);

      console.log(`Generated leaderboard for ${category}/${period}: ${leaderboard.length} entries`);
      return leaderboardData;

    } catch (error) {
      console.error('ClanLeaderboardSystem: Leaderboard generation failed:', error);
      throw error;
    }
  }

  /**
   * Track and update clan achievements
   * @param {string} clanId - Clan identifier
   * @returns {Promise<Object>} Updated achievement data
   */
  async updateClanAchievements(clanId) {
    try {
      const clanData = await this.getClanData(clanId);
      if (!clanData) {
        throw new Error(`Clan not found: ${clanId}`);
      }

      const currentAchievements = this.achievements.get(clanId) || {
        voting: [],
        burns: [],
        streaks: [],
        milestones: [],
        totalPoints: 0
      };

      let newAchievements = [];
      let pointsEarned = 0;

      // Check voting milestones
      const totalVotes = await this.getTotalClanVotes(clanId);
      for (const [key, achievement] of Object.entries(CLAN_LEADERBOARD_CONFIG.ACHIEVEMENTS.VOTING_MILESTONES)) {
        if (totalVotes >= achievement.threshold && 
            !currentAchievements.voting.some(a => a.key === key)) {
          newAchievements.push({
            key,
            category: 'voting',
            ...achievement,
            earned: new Date().toISOString(),
            clanId
          });
          pointsEarned += achievement.points;
        }
      }

      // Check burn milestones
      const totalBurns = await this.getTotalClanBurns(clanId);
      for (const [key, achievement] of Object.entries(CLAN_LEADERBOARD_CONFIG.ACHIEVEMENTS.BURN_MILESTONES)) {
        if (totalBurns >= achievement.threshold && 
            !currentAchievements.burns.some(a => a.key === key)) {
          newAchievements.push({
            key,
            category: 'burns',
            ...achievement,
            earned: new Date().toISOString(),
            clanId
          });
          pointsEarned += achievement.points;
        }
      }

      // Check streak milestones
      const currentStreak = await this.getClanStreak(clanId);
      for (const [key, achievement] of Object.entries(CLAN_LEADERBOARD_CONFIG.ACHIEVEMENTS.STREAK_MILESTONES)) {
        if (currentStreak.days >= achievement.threshold && 
            !currentAchievements.streaks.some(a => a.key === key)) {
          newAchievements.push({
            key,
            category: 'streaks',
            ...achievement,
            earned: new Date().toISOString(),
            clanId
          });
          pointsEarned += achievement.points;
        }
      }

      // Update achievements if any new ones were earned
      if (newAchievements.length > 0) {
        currentAchievements.voting.push(...newAchievements.filter(a => a.category === 'voting'));
        currentAchievements.burns.push(...newAchievements.filter(a => a.category === 'burns'));
        currentAchievements.streaks.push(...newAchievements.filter(a => a.category === 'streaks'));
        currentAchievements.totalPoints += pointsEarned;
        
        this.achievements.set(clanId, currentAchievements);
        
        // Record achievements on blockchain for transparency
        await this.recordAchievementsOnChain(clanId, newAchievements);
        
        console.log(`Clan ${clanId} earned ${newAchievements.length} new achievements (${pointsEarned} points)`);
      }

      return {
        clanId,
        achievements: currentAchievements,
        newAchievements,
        pointsEarned,
        totalPoints: currentAchievements.totalPoints
      };

    } catch (error) {
      console.error('ClanLeaderboardSystem: Achievement update failed:', error);
      throw error;
    }
  }

  /**
   * Track and update clan voting streaks
   * @param {string} clanId - Clan identifier
   * @returns {Promise<Object>} Updated streak data
   */
  async updateClanStreak(clanId) {
    try {
      const currentStreak = this.streaks.get(clanId) || {
        current: 0,
        longest: 0,
        lastActivity: null,
        multiplier: 1.0,
        active: false
      };

      // Get today's clan activity
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const todayActivity = await this.getClanActivityInPeriod(clanId, todayStart, todayEnd);
      const hasActivityToday = todayActivity.totalVotes >= CLAN_LEADERBOARD_CONFIG.STREAK_CONFIG.MIN_DAILY_ACTIVITY;

      // Calculate time since last activity
      const lastActivityTime = currentStreak.lastActivity ? new Date(currentStreak.lastActivity) : null;
      const hoursSinceLastActivity = lastActivityTime ? 
        (Date.now() - lastActivityTime.getTime()) / (1000 * 60 * 60) : 
        Infinity;

      // Determine streak status
      const gracePeriod = CLAN_LEADERBOARD_CONFIG.STREAK_CONFIG.GRACE_PERIOD_HOURS;
      const withinGracePeriod = hoursSinceLastActivity <= gracePeriod;

      if (hasActivityToday) {
        // Continue or start streak
        if (currentStreak.active && withinGracePeriod) {
          currentStreak.current += 1;
        } else {
          currentStreak.current = 1;
        }
        
        currentStreak.active = true;
        currentStreak.lastActivity = new Date().toISOString();
        
        // Update longest streak record
        if (currentStreak.current > currentStreak.longest) {
          currentStreak.longest = currentStreak.current;
        }
        
        // Calculate streak multiplier
        currentStreak.multiplier = this.calculateStreakBonus(currentStreak.current);
        
      } else if (!withinGracePeriod && CLAN_LEADERBOARD_CONFIG.STREAK_CONFIG.RESET_ON_MISS) {
        // Reset streak if outside grace period
        currentStreak.current = 0;
        currentStreak.active = false;
        currentStreak.multiplier = 1.0;
      }

      // Update streak data
      this.streaks.set(clanId, {
        ...currentStreak,
        updatedAt: new Date().toISOString(),
        days: currentStreak.current,
        status: currentStreak.active ? 'active' : 'broken'
      });

      return this.streaks.get(clanId);

    } catch (error) {
      console.error('ClanLeaderboardSystem: Streak update failed:', error);
      throw error;
    }
  }

  /**
   * Manage clan rivalries and competitive relationships
   * @param {string} clanId - Clan identifier
   * @returns {Promise<Object>} Updated rivalry data
   */
  async updateClanRivalries(clanId) {
    try {
      if (!CLAN_LEADERBOARD_CONFIG.RIVALRY_CONFIG.ENABLED) {
        return { clanId, rivalries: [], message: 'Rivalry system disabled' };
      }

      const currentRivalries = this.rivalries.get(clanId) || [];
      const clanScore = await this.calculateClanScore(clanId, 'overall_power');
      
      if (!clanScore || !clanScore.eligible) {
        return { clanId, rivalries: currentRivalries, message: 'Clan not eligible for rivalries' };
      }

      // Get potential rival clans
      const allClans = await this.getAllClans();
      const potentialRivals = [];

      for (const otherClan of allClans) {
        if (otherClan.id === clanId) continue;
        
        const otherScore = await this.calculateClanScore(otherClan.id, 'overall_power');
        if (!otherScore || !otherScore.eligible) continue;

        // Calculate score difference
        const scoreDifference = Math.abs(clanScore.score - otherScore.score) / Math.max(clanScore.score, otherScore.score);
        
        // Check rivalry criteria
        if (scoreDifference <= CLAN_LEADERBOARD_CONFIG.RIVALRY_CONFIG.RIVALRY_THRESHOLD_DIFFERENCE) {
          potentialRivals.push({
            clanId: otherClan.id,
            clanName: otherClan.name,
            score: otherScore.score,
            scoreDifference: scoreDifference,
            tier: otherClan.tier,
            type: this.determineRivalryType(clanScore, otherScore, otherClan)
          });
        }
      }

      // Sort potential rivals by score similarity
      potentialRivals.sort((a, b) => a.scoreDifference - b.scoreDifference);

      // Update rivalries (max limit enforced)
      const maxRivalries = CLAN_LEADERBOARD_CONFIG.RIVALRY_CONFIG.MAX_RIVALRIES_PER_CLAN;
      const newRivalries = potentialRivals.slice(0, maxRivalries).map(rival => ({
        ...rival,
        established: new Date().toISOString(),
        status: 'active',
        competitionHistory: [],
        bonusMultiplier: CLAN_LEADERBOARD_CONFIG.RIVALRY_CONFIG.RIVALRY_BONUS_MULTIPLIER
      }));

      this.rivalries.set(clanId, newRivalries);

      console.log(`Updated rivalries for clan ${clanId}: ${newRivalries.length} rivals`);
      return {
        clanId,
        rivalries: newRivalries,
        potentialRivals: potentialRivals.length,
        message: `Found ${newRivalries.length} active rivalries`
      };

    } catch (error) {
      console.error('ClanLeaderboardSystem: Rivalry update failed:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive leaderboard analytics
   * @param {Object} options - Analytics options
   * @returns {Promise<Object>} Leaderboard analytics data
   */
  async getLeaderboardAnalytics(options = {}) {
    try {
      const categories = options.categories || Object.keys(CLAN_LEADERBOARD_CONFIG.CATEGORIES);
      const periods = options.periods || Object.keys(CLAN_LEADERBOARD_CONFIG.TIME_PERIODS);
      
      const analytics = {
        overview: {
          totalClans: 0,
          activeClans: 0,
          totalAchievements: 0,
          totalTokensBurned: 0,
          totalVotesCast: 0,
          averageParticipation: 0
        },
        categoryAnalytics: {},
        periodAnalytics: {},
        tierDistribution: {},
        achievementDistribution: {},
        streakAnalytics: {
          activeStreaks: 0,
          longestStreak: 0,
          averageStreak: 0
        },
        rivalryAnalytics: {
          totalRivalries: 0,
          averageRivalriesPerClan: 0,
          rivalryTypes: {}
        },
        trends: {
          scoreGrowth: [],
          participationTrends: [],
          burnTrends: []
        }
      };

      // Get all clans for overview
      const allClans = await this.getAllClans();
      analytics.overview.totalClans = allClans.length;
      analytics.overview.activeClans = allClans.filter(c => c.status === 'active').length;

      // Calculate category analytics
      for (const category of categories) {
        const leaderboard = await this.generateLeaderboard(category, 'all_time', { limit: 1000 });
        
        analytics.categoryAnalytics[category] = {
          participants: leaderboard.rankings.length,
          averageScore: leaderboard.statistics.averageScore,
          highestScore: leaderboard.statistics.highestScore,
          participationRate: leaderboard.statistics.participationRate,
          topTier: leaderboard.rankings.length > 0 ? leaderboard.rankings[0].clanData.tier : null
        };
      }

      // Calculate period analytics
      for (const period of periods) {
        const periodLeaderboard = await this.generateLeaderboard('overall_power', period, { limit: 100 });
        
        analytics.periodAnalytics[period] = {
          participants: periodLeaderboard.rankings.length,
          averageScore: periodLeaderboard.statistics.averageScore,
          competitiveness: this.calculateCompetitiveness(periodLeaderboard.rankings)
        };
      }

      // Tier distribution analysis
      const tierCounts = allClans.reduce((acc, clan) => {
        acc[clan.tier] = (acc[clan.tier] || 0) + 1;
        return acc;
      }, {});
      analytics.tierDistribution = tierCounts;

      // Achievement analytics
      let totalAchievements = 0;
      const achievementTypes = {};
      
      for (const [clanId, achievements] of this.achievements.entries()) {
        totalAchievements += achievements.voting.length + achievements.burns.length + achievements.streaks.length;
        
        achievements.voting.forEach(a => {
          achievementTypes[a.key] = (achievementTypes[a.key] || 0) + 1;
        });
        achievements.burns.forEach(a => {
          achievementTypes[a.key] = (achievementTypes[a.key] || 0) + 1;
        });
        achievements.streaks.forEach(a => {
          achievementTypes[a.key] = (achievementTypes[a.key] || 0) + 1;
        });
      }
      
      analytics.overview.totalAchievements = totalAchievements;
      analytics.achievementDistribution = achievementTypes;

      // Streak analytics
      const streakValues = Array.from(this.streaks.values());
      analytics.streakAnalytics.activeStreaks = streakValues.filter(s => s.active).length;
      analytics.streakAnalytics.longestStreak = Math.max(...streakValues.map(s => s.longest), 0);
      analytics.streakAnalytics.averageStreak = streakValues.length > 0 ? 
        streakValues.reduce((sum, s) => sum + s.current, 0) / streakValues.length : 0;

      // Rivalry analytics
      let totalRivalries = 0;
      const rivalryTypeCounts = {};
      
      for (const rivalries of this.rivalries.values()) {
        totalRivalries += rivalries.length;
        rivalries.forEach(r => {
          rivalryTypeCounts[r.type] = (rivalryTypeCounts[r.type] || 0) + 1;
        });
      }
      
      analytics.rivalryAnalytics.totalRivalries = totalRivalries;
      analytics.rivalryAnalytics.averageRivalriesPerClan = this.rivalries.size > 0 ? 
        totalRivalries / this.rivalries.size : 0;
      analytics.rivalryAnalytics.rivalryTypes = rivalryTypeCounts;

      return analytics;

    } catch (error) {
      console.error('ClanLeaderboardSystem: Analytics calculation failed:', error);
      throw error;
    }
  }

  /**
   * Start real-time leaderboard updates
   */
  startRealTimeUpdates() {
    if (!CLAN_LEADERBOARD_CONFIG.REALTIME.WEBSOCKET_ENABLED) {
      console.log('Real-time updates disabled');
      return;
    }

    // Score calculation interval
    setInterval(() => {
      this.processScoreUpdates();
    }, CLAN_LEADERBOARD_CONFIG.REALTIME.UPDATE_INTERVALS.SCORE_CALCULATION);

    // Leaderboard refresh interval
    setInterval(() => {
      this.refreshCachedLeaderboards();
    }, CLAN_LEADERBOARD_CONFIG.REALTIME.UPDATE_INTERVALS.LEADERBOARD_REFRESH);

    // Achievement check interval
    setInterval(() => {
      this.processAchievementUpdates();
    }, CLAN_LEADERBOARD_CONFIG.REALTIME.UPDATE_INTERVALS.ACHIEVEMENT_CHECK);

    // Streak update interval
    setInterval(() => {
      this.processStreakUpdates();
    }, CLAN_LEADERBOARD_CONFIG.REALTIME.UPDATE_INTERVALS.STREAK_UPDATE);

    console.log('ClanLeaderboardSystem: Real-time updates started');
  }

  /**
   * Process queued score updates
   */
  async processScoreUpdates() {
    try {
      if (this.updateQueue.size === 0) return;

      const batch = Array.from(this.updateQueue).slice(0, CLAN_LEADERBOARD_CONFIG.REALTIME.BATCH_SIZE);
      const updatePromises = batch.map(clanId => this.updateClanAllScores(clanId));
      
      await Promise.all(updatePromises);
      
      batch.forEach(clanId => this.updateQueue.delete(clanId));
      
      console.log(`Processed ${batch.length} score updates`);
    } catch (error) {
      console.error('Score update processing failed:', error);
    }
  }

  /**
   * Update all scores for a clan across categories and periods
   * @param {string} clanId - Clan identifier
   */
  async updateClanAllScores(clanId) {
    try {
      const categories = Object.keys(CLAN_LEADERBOARD_CONFIG.CATEGORIES);
      const periods = Object.keys(CLAN_LEADERBOARD_CONFIG.TIME_PERIODS);
      
      for (const category of categories) {
        for (const period of periods) {
          await this.calculateClanScore(clanId, category, period);
        }
      }
      
      // Update achievements and streaks
      await this.updateClanAchievements(clanId);
      await this.updateClanStreak(clanId);
      await this.updateClanRivalries(clanId);
      
    } catch (error) {
      console.error(`Failed to update all scores for clan ${clanId}:`, error);
    }
  }

  /**
   * Helper Methods
   */

  calculateTimeWindow(periodConfig) {
    if (!periodConfig.duration) {
      return { start: null, end: new Date(), days: null }; // All-time
    }
    
    const end = new Date();
    const start = new Date(end.getTime() - periodConfig.duration);
    const days = Math.ceil(periodConfig.duration / (24 * 60 * 60 * 1000));
    
    return { start, end, days };
  }

  async calculateStreakMultiplier(clanId, category) {
    const streak = this.streaks.get(clanId);
    if (!streak || !streak.active) return 1.0;
    
    return streak.multiplier || 1.0;
  }

  async calculateRivalryMultiplier(clanId, category) {
    if (!CLAN_LEADERBOARD_CONFIG.RIVALRY_CONFIG.ENABLED) return 1.0;
    
    const rivalries = this.rivalries.get(clanId);
    if (!rivalries || rivalries.length === 0) return 1.0;
    
    return CLAN_LEADERBOARD_CONFIG.RIVALRY_CONFIG.RIVALRY_BONUS_MULTIPLIER;
  }

  calculateStreakBonus(days) {
    const bonuses = CLAN_LEADERBOARD_CONFIG.STREAK_CONFIG.BONUS_MULTIPLIERS;
    
    if (days >= 365) return bonuses[365];
    if (days >= 90) return bonuses[90];
    if (days >= 30) return bonuses[30];
    if (days >= 7) return bonuses[7];
    
    return 1.0;
  }

  normalizeByClanSize(score, memberCount) {
    // Normalize by square root of member count to balance individual vs collective performance
    return score / Math.sqrt(Math.max(memberCount, 1));
  }

  scaleComponentScore(component, rawScore, clanData) {
    // Apply component-specific scaling based on clan tier and size
    const tierScaling = {
      diamond: 1.0,
      gold: 1.1,
      silver: 1.2,
      bronze: 1.3
    };
    
    const scaling = tierScaling[clanData.tier] || 1.0;
    return rawScore * scaling;
  }

  calculateRankBadge(rank, totalClans) {
    const percentage = (rank / totalClans) * 100;
    
    if (percentage <= 1) return '🏆'; // Top 1%
    if (percentage <= 5) return '🥇'; // Top 5%
    if (percentage <= 10) return '🥈'; // Top 10%
    if (percentage <= 25) return '🥉'; // Top 25%
    if (percentage <= 50) return '🎖️'; // Top 50%
    
    return '📊'; // Below 50%
  }

  determineRivalryType(clanScore, otherScore, otherClan) {
    if (clanScore.clanData.tier === otherClan.tier) {
      return CLAN_LEADERBOARD_CONFIG.RIVALRY_CONFIG.RIVALRY_TYPES.TIER_BASED;
    }
    
    return CLAN_LEADERBOARD_CONFIG.RIVALRY_CONFIG.RIVALRY_TYPES.SCORE_BASED;
  }

  calculateCompetitiveness(rankings) {
    if (rankings.length < 2) return 0;
    
    const scores = rankings.map(r => r.score);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    
    if (maxScore === 0) return 0;
    
    return 1 - ((maxScore - minScore) / maxScore);
  }

  async validateScore(clanId, score, metrics) {
    // Implement anti-gaming validation
    const suspiciousMultiplier = score / (metrics.voting_activity + metrics.token_burns + 1);
    
    return {
      validated: suspiciousMultiplier <= CLAN_LEADERBOARD_CONFIG.SECURITY.SUSPICIOUS_ACTIVITY_THRESHOLD,
      suspiciousActivity: suspiciousMultiplier > CLAN_LEADERBOARD_CONFIG.SECURITY.SUSPICIOUS_ACTIVITY_THRESHOLD,
      multiplier: suspiciousMultiplier,
      reason: suspiciousMultiplier > CLAN_LEADERBOARD_CONFIG.SECURITY.SUSPICIOUS_ACTIVITY_THRESHOLD ? 
        'Suspicious scoring pattern detected' : 'Score validated'
    };
  }

  updateScoreCache(clanId, category, period, scoreData) {
    const cacheKey = `${clanId}_${category}_${period}`;
    this.scoreCache.set(cacheKey, {
      ...scoreData,
      cached: Date.now()
    });
  }

  cacheLeaderboard(category, period, leaderboardData) {
    const cacheKey = `leaderboard_${category}_${period}`;
    this.leaderboards.set(cacheKey, {
      ...leaderboardData,
      cached: Date.now()
    });
  }

  async refreshCachedLeaderboards() {
    console.log('Refreshing cached leaderboards...');
    // Implementation for refreshing cached leaderboards
  }

  async processAchievementUpdates() {
    console.log('Processing achievement updates...');
    // Implementation for batch achievement updates
  }

  async processStreakUpdates() {
    console.log('Processing streak updates...');
    // Implementation for batch streak updates
  }

  // Mock implementations - would integrate with actual data sources
  async getClanData(clanId) {
    return {
      id: clanId,
      name: `Clan ${clanId}`,
      tier: 'gold',
      memberCount: 15,
      status: 'active'
    };
  }

  async getAllClans() {
    return [
      { id: 'clan1', name: 'Elite Gamers', tier: 'diamond', memberCount: 25, status: 'active' },
      { id: 'clan2', name: 'Pro Squad', tier: 'gold', memberCount: 18, status: 'active' },
      { id: 'clan3', name: 'Rising Stars', tier: 'silver', memberCount: 12, status: 'active' }
    ];
  }

  async getClanMembers(clanId) {
    return [
      { address: 'member1', role: 'owner' },
      { address: 'member2', role: 'admin' },
      { address: 'member3', role: 'member' }
    ];
  }

  async getMemberActivity(memberAddress, timeWindow) {
    return {
      totalVotes: 15,
      burnedTokens: 50,
      governanceVotes: 8,
      contentVotes: 7,
      proposalsCreated: 2,
      votingPowerUsed: 45,
      allianceVotes: 3
    };
  }

  async calculateConsistencyScore(clanId, timeWindow) {
    return 0.85; // 85% consistency
  }

  async calculateQualityScores(clanId, timeWindow) {
    return 78.5; // Quality score out of 100
  }

  async calculateModerationActivity(clanId, timeWindow) {
    return 12; // Moderation actions
  }

  async calculateMemberRetention(clanId, timeWindow) {
    return 0.92; // 92% retention rate
  }

  async calculateDiplomaticMetrics(clanId, timeWindow) {
    return {
      activity: 8,
      successRate: 0.75
    };
  }

  calculateBurnEfficiency(memberActivities) {
    const totalBurns = memberActivities.reduce((sum, a) => sum + a.burnedTokens, 0);
    const totalVotes = memberActivities.reduce((sum, a) => sum + a.totalVotes, 0);
    
    return totalVotes > 0 ? totalBurns / totalVotes : 0;
  }

  async getTotalClanVotes(clanId) {
    return 500; // Mock total votes
  }

  async getTotalClanBurns(clanId) {
    return 1250; // Mock total burns
  }

  async getClanStreak(clanId) {
    return this.streaks.get(clanId) || { days: 0, active: false };
  }

  async getClanActivityInPeriod(clanId, start, end) {
    return { totalVotes: 5, burnedTokens: 15 }; // Mock activity
  }

  async recordAchievementsOnChain(clanId, achievements) {
    // Mock blockchain recording
    console.log(`Recording ${achievements.length} achievements for clan ${clanId}`);
  }
}

/**
 * Clan Leaderboard UI Component
 * React component for displaying comprehensive leaderboard interface
 */
export class ClanLeaderboardUI {
  constructor(options = {}) {
    this.leaderboardSystem = new ClanLeaderboardSystem(options);
    this.currentCategory = 'overall_power';
    this.currentPeriod = 'all_time';
    this.refreshInterval = 60000; // 1 minute
  }

  /**
   * Render comprehensive leaderboard interface
   * @returns {string} HTML for leaderboard UI
   */
  render() {
    return `
      <div class="clan-leaderboard-container">
        <!-- Header with category selection -->
        <div class="leaderboard-header">
          <h1 class="leaderboard-title">
            <span class="title-icon">🏆</span>
            MLG.clan Leaderboards
          </h1>
          <div class="leaderboard-subtitle">
            Competitive rankings across multiple categories with real-time updates
          </div>
        </div>

        <!-- Category and Period Selection -->
        <div class="leaderboard-controls">
          <div class="category-selector">
            <label>Category:</label>
            <div class="category-tabs">
              <button class="category-tab active" data-category="overall_power">
                ⚡ Overall Power
              </button>
              <button class="category-tab" data-category="content_curation">
                📝 Content Curation
              </button>
              <button class="category-tab" data-category="governance_leadership">
                ⚖️ Governance
              </button>
              <button class="category-tab" data-category="community_engagement">
                👥 Community
              </button>
              <button class="category-tab" data-category="token_economics">
                🔥 Token Economics
              </button>
              <button class="category-tab" data-category="alliance_building">
                🤝 Alliances
              </button>
            </div>
          </div>

          <div class="period-selector">
            <label>Time Period:</label>
            <select id="period-select" class="period-dropdown">
              <option value="all_time" selected>♾️ All-Time</option>
              <option value="seasonal">🗓️ Seasonal (90 days)</option>
              <option value="monthly">📅 Monthly</option>
              <option value="weekly">📊 Weekly</option>
              <option value="daily">⭐ Daily</option>
            </select>
          </div>

          <div class="leaderboard-actions">
            <button class="action-btn refresh-btn" onclick="refreshLeaderboard()">
              🔄 Refresh
            </button>
            <button class="action-btn analytics-btn" onclick="showAnalytics()">
              📊 Analytics
            </button>
            <button class="action-btn achievements-btn" onclick="showAchievements()">
              🏅 Achievements
            </button>
          </div>
        </div>

        <!-- Leaderboard Statistics -->
        <div class="leaderboard-stats">
          <div class="stat-card">
            <div class="stat-value" id="total-clans">-</div>
            <div class="stat-label">Total Clans</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="average-score">-</div>
            <div class="stat-label">Average Score</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="participation-rate">-</div>
            <div class="stat-label">Participation</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="last-updated">-</div>
            <div class="stat-label">Last Updated</div>
          </div>
        </div>

        <!-- Main Leaderboard Table -->
        <div class="leaderboard-content">
          <div class="leaderboard-table-container">
            <table class="leaderboard-table">
              <thead>
                <tr>
                  <th class="rank-col">Rank</th>
                  <th class="clan-col">Clan</th>
                  <th class="tier-col">Tier</th>
                  <th class="score-col">Score</th>
                  <th class="members-col">Members</th>
                  <th class="achievements-col">Achievements</th>
                  <th class="streak-col">Streak</th>
                  <th class="trend-col">Trend</th>
                </tr>
              </thead>
              <tbody id="leaderboard-entries">
                <!-- Leaderboard entries will be populated here -->
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="leaderboard-pagination">
            <button class="page-btn prev-btn" onclick="previousPage()" disabled>
              ← Previous
            </button>
            <div class="page-info">
              <span id="current-page">1</span> of <span id="total-pages">1</span>
            </div>
            <button class="page-btn next-btn" onclick="nextPage()">
              Next →
            </button>
          </div>
        </div>

        <!-- Detailed View Modal -->
        <div id="clan-details-modal" class="modal">
          <div class="modal-content">
            <div class="modal-header">
              <h3 id="modal-clan-name">Clan Details</h3>
              <button class="close-btn" onclick="closeClanDetails()">&times;</button>
            </div>
            <div class="modal-body">
              <div id="clan-details-content">
                <!-- Detailed clan information will be loaded here -->
              </div>
            </div>
          </div>
        </div>

        <!-- Analytics Dashboard Modal -->
        <div id="analytics-modal" class="modal">
          <div class="modal-content wide">
            <div class="modal-header">
              <h3>Leaderboard Analytics</h3>
              <button class="close-btn" onclick="closeAnalytics()">&times;</button>
            </div>
            <div class="modal-body">
              <div id="analytics-content">
                <!-- Analytics charts and data will be loaded here -->
              </div>
            </div>
          </div>
        </div>

        <!-- Achievements Gallery Modal -->
        <div id="achievements-modal" class="modal">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Achievement Gallery</h3>
              <button class="close-btn" onclick="closeAchievements()">&times;</button>
            </div>
            <div class="modal-body">
              <div id="achievements-content">
                <!-- Achievement gallery will be loaded here -->
              </div>
            </div>
          </div>
        </div>

        <!-- Loading Overlay -->
        <div id="loading-overlay" class="loading-overlay">
          <div class="loading-spinner">
            <div class="spinner"></div>
            <div class="loading-text">Loading leaderboard data...</div>
          </div>
        </div>
      </div>

      <style>
        .clan-leaderboard-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Segoe UI', 'Xbox 360 Console', monospace;
          background: linear-gradient(135deg, #0c1618 0%, #1a2327 100%);
          color: #ffffff;
          min-height: 100vh;
        }

        .leaderboard-header {
          text-align: center;
          margin-bottom: 40px;
          padding: 30px;
          background: linear-gradient(135deg, #2d5a27 0%, #4a8c3c 100%);
          border-radius: 15px;
          border: 2px solid #6ab04c;
          box-shadow: 0 8px 32px rgba(106, 176, 76, 0.3);
        }

        .leaderboard-title {
          font-size: 3.5em;
          font-weight: bold;
          margin: 0;
          text-shadow: 0 0 20px rgba(106, 176, 76, 0.8);
          letter-spacing: 2px;
        }

        .title-icon {
          font-size: 1.2em;
          margin-right: 15px;
          filter: drop-shadow(0 0 10px #ffd700);
        }

        .leaderboard-subtitle {
          font-size: 1.2em;
          margin-top: 10px;
          opacity: 0.9;
          color: #b8e6b8;
        }

        .leaderboard-controls {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
          padding: 25px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(106, 176, 76, 0.3);
        }

        .category-selector label,
        .period-selector label {
          display: block;
          font-weight: 600;
          margin-bottom: 10px;
          color: #6ab04c;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .category-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .category-tab {
          padding: 12px 18px;
          border: 2px solid #4a4a4a;
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
          font-size: 0.9em;
        }

        .category-tab:hover {
          border-color: #6ab04c;
          background: rgba(106, 176, 76, 0.2);
          transform: translateY(-2px);
        }

        .category-tab.active {
          background: linear-gradient(135deg, #6ab04c 0%, #4a8c3c 100%);
          border-color: #6ab04c;
          color: #ffffff;
          box-shadow: 0 4px 15px rgba(106, 176, 76, 0.4);
        }

        .period-dropdown {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid #4a4a4a;
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border-radius: 8px;
          font-size: 1em;
          transition: all 0.3s ease;
        }

        .period-dropdown:focus {
          border-color: #6ab04c;
          outline: none;
          box-shadow: 0 0 0 3px rgba(106, 176, 76, 0.2);
        }

        .leaderboard-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .action-btn {
          padding: 12px 20px;
          border: 2px solid #6ab04c;
          background: linear-gradient(135deg, rgba(106, 176, 76, 0.2) 0%, rgba(74, 140, 60, 0.2) 100%);
          color: #ffffff;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .action-btn:hover {
          background: linear-gradient(135deg, #6ab04c 0%, #4a8c3c 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(106, 176, 76, 0.4);
        }

        .leaderboard-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          padding: 25px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
          border-radius: 12px;
          border: 1px solid rgba(106, 176, 76, 0.3);
          text-align: center;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(106, 176, 76, 0.2);
        }

        .stat-value {
          font-size: 2.5em;
          font-weight: bold;
          color: #6ab04c;
          text-shadow: 0 0 10px rgba(106, 176, 76, 0.5);
        }

        .stat-label {
          font-size: 1.1em;
          margin-top: 8px;
          opacity: 0.8;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .leaderboard-content {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 15px;
          border: 1px solid rgba(106, 176, 76, 0.3);
          overflow: hidden;
        }

        .leaderboard-table-container {
          overflow-x: auto;
        }

        .leaderboard-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 1em;
        }

        .leaderboard-table th {
          background: linear-gradient(135deg, #2d5a27 0%, #4a8c3c 100%);
          color: #ffffff;
          padding: 20px 15px;
          text-align: left;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 2px solid #6ab04c;
        }

        .leaderboard-table td {
          padding: 18px 15px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .leaderboard-table tbody tr:hover {
          background: rgba(106, 176, 76, 0.1);
          cursor: pointer;
        }

        .rank-col {
          width: 80px;
          text-align: center;
        }

        .clan-col {
          min-width: 200px;
        }

        .tier-col,
        .score-col,
        .members-col,
        .achievements-col,
        .streak-col,
        .trend-col {
          width: 120px;
          text-align: center;
        }

        .clan-name {
          font-weight: bold;
          font-size: 1.1em;
          color: #6ab04c;
        }

        .clan-tier {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.9em;
          font-weight: 600;
          text-transform: uppercase;
        }

        .tier-diamond {
          background: linear-gradient(135deg, #b9f2ff 0%, #74c0fc 100%);
          color: #1c7ed6;
        }

        .tier-gold {
          background: linear-gradient(135deg, #ffd700 0%, #ffc500 100%);
          color: #8b6914;
        }

        .tier-silver {
          background: linear-gradient(135deg, #c0c0c0 0%, #a0a0a0 100%);
          color: #4a4a4a;
        }

        .tier-bronze {
          background: linear-gradient(135deg, #cd7f32 0%, #b8722c 100%);
          color: #ffffff;
        }

        .score-value {
          font-size: 1.3em;
          font-weight: bold;
          color: #6ab04c;
        }

        .achievement-count {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 8px;
          background: rgba(255, 215, 0, 0.2);
          border-radius: 12px;
          color: #ffd700;
          font-weight: 600;
        }

        .streak-indicator {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 600;
        }

        .streak-active {
          background: rgba(255, 69, 0, 0.2);
          color: #ff4500;
        }

        .streak-inactive {
          background: rgba(128, 128, 128, 0.2);
          color: #808080;
        }

        .trend-indicator {
          font-size: 1.5em;
          filter: drop-shadow(0 0 5px currentColor);
        }

        .trend-up { color: #00ff00; }
        .trend-down { color: #ff0000; }
        .trend-stable { color: #ffff00; }

        .leaderboard-pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
          padding: 25px;
          background: rgba(255, 255, 255, 0.05);
          border-top: 1px solid rgba(106, 176, 76, 0.3);
        }

        .page-btn {
          padding: 12px 24px;
          border: 2px solid #6ab04c;
          background: linear-gradient(135deg, rgba(106, 176, 76, 0.2) 0%, rgba(74, 140, 60, 0.2) 100%);
          color: #ffffff;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .page-btn:not(:disabled):hover {
          background: linear-gradient(135deg, #6ab04c 0%, #4a8c3c 100%);
          transform: translateY(-2px);
        }

        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-info {
          font-size: 1.1em;
          font-weight: 600;
          color: #6ab04c;
        }

        .modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          z-index: 1000;
          backdrop-filter: blur(5px);
        }

        .modal-content {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(135deg, #1a2327 0%, #2d3748 100%);
          padding: 30px;
          border-radius: 15px;
          border: 2px solid #6ab04c;
          width: 90%;
          max-width: 800px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .modal-content.wide {
          max-width: 1200px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 2px solid #6ab04c;
        }

        .modal-header h3 {
          color: #6ab04c;
          font-size: 1.8em;
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 2em;
          color: #6ab04c;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .close-btn:hover {
          color: #ffffff;
          transform: scale(1.2);
        }

        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: none;
          justify-content: center;
          align-items: center;
          z-index: 2000;
          backdrop-filter: blur(10px);
        }

        .loading-spinner {
          text-align: center;
          color: #6ab04c;
        }

        .spinner {
          border: 4px solid rgba(106, 176, 76, 0.3);
          border-top: 4px solid #6ab04c;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        .loading-text {
          font-size: 1.3em;
          font-weight: 600;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 1200px) {
          .leaderboard-controls {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          
          .category-tabs {
            justify-content: center;
          }
          
          .leaderboard-actions {
            flex-direction: row;
            justify-content: center;
          }
        }

        @media (max-width: 768px) {
          .clan-leaderboard-container {
            padding: 10px;
          }
          
          .leaderboard-title {
            font-size: 2.5em;
          }
          
          .category-tabs {
            flex-direction: column;
          }
          
          .category-tab {
            text-align: center;
          }
          
          .leaderboard-stats {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .leaderboard-table {
            font-size: 0.9em;
          }
          
          .leaderboard-table th,
          .leaderboard-table td {
            padding: 12px 8px;
          }
          
          .modal-content {
            width: 95%;
            padding: 20px;
          }
        }
      </style>
    `;
  }

  /**
   * Initialize leaderboard UI functionality
   */
  async initialize() {
    try {
      await this.leaderboardSystem.initializeConnections();
      await this.loadInitialData();
      this.bindEventListeners();
      this.startAutoRefresh();
      
      console.log('ClanLeaderboardUI: Initialized successfully');
    } catch (error) {
      console.error('ClanLeaderboardUI: Initialization failed:', error);
      throw error;
    }
  }

  async loadInitialData() {
    this.showLoading();
    
    try {
      // Load initial leaderboard data
      await this.updateLeaderboard();
      await this.updateStatistics();
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      this.hideLoading();
    }
  }

  async updateLeaderboard() {
    const leaderboard = await this.leaderboardSystem.generateLeaderboard(
      this.currentCategory,
      this.currentPeriod,
      { limit: 50, offset: 0 }
    );

    this.renderLeaderboardEntries(leaderboard.rankings);
    this.updatePagination(leaderboard.metadata.pagination);
  }

  renderLeaderboardEntries(rankings) {
    const tbody = document.getElementById('leaderboard-entries');
    if (!tbody) return;

    tbody.innerHTML = rankings.map(entry => `
      <tr onclick="showClanDetails('${entry.clanId}')">
        <td class="rank-col">
          <div style="display: flex; align-items: center; justify-content: center; gap: 5px;">
            ${entry.badge}
            <span style="font-weight: bold; font-size: 1.2em;">#${entry.rank}</span>
          </div>
        </td>
        <td class="clan-col">
          <div class="clan-name">${entry.clanData.name}</div>
        </td>
        <td class="tier-col">
          <span class="clan-tier tier-${entry.clanData.tier}">
            ${CLAN_TIER_CONFIG[entry.clanData.tier.toUpperCase()]?.icon || '🏅'}
            ${entry.clanData.tier}
          </span>
        </td>
        <td class="score-col">
          <div class="score-value">${Math.round(entry.score).toLocaleString()}</div>
        </td>
        <td class="members-col">
          ${entry.clanData.memberCount}
        </td>
        <td class="achievements-col">
          <span class="achievement-count">
            🏅 ${entry.achievements || 0}
          </span>
        </td>
        <td class="streak-col">
          <span class="streak-indicator ${entry.streak?.active ? 'streak-active' : 'streak-inactive'}">
            ${entry.streak?.active ? '🔥' : '❄️'} ${entry.streak?.days || 0}d
          </span>
        </td>
        <td class="trend-col">
          <span class="trend-indicator ${entry.trend || 'trend-stable'}">
            ${entry.trend === 'up' ? '↗️' : entry.trend === 'down' ? '↘️' : '➡️'}
          </span>
        </td>
      </tr>
    `).join('');
  }

  bindEventListeners() {
    // Category tab switching
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('category-tab')) {
        this.switchCategory(e.target.dataset.category);
      }
    });

    // Period selection
    const periodSelect = document.getElementById('period-select');
    if (periodSelect) {
      periodSelect.addEventListener('change', (e) => {
        this.switchPeriod(e.target.value);
      });
    }
  }

  async switchCategory(category) {
    this.currentCategory = category;
    
    // Update active tab
    document.querySelectorAll('.category-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.category === category);
    });
    
    await this.updateLeaderboard();
  }

  async switchPeriod(period) {
    this.currentPeriod = period;
    await this.updateLeaderboard();
  }

  startAutoRefresh() {
    setInterval(() => {
      this.updateLeaderboard();
      this.updateStatistics();
    }, this.refreshInterval);
  }

  showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
    }
  }

  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  async updateStatistics() {
    const analytics = await this.leaderboardSystem.getLeaderboardAnalytics();
    
    document.getElementById('total-clans').textContent = analytics.overview.totalClans;
    document.getElementById('average-score').textContent = Math.round(analytics.overview.averageScore || 0).toLocaleString();
    document.getElementById('participation-rate').textContent = `${Math.round(analytics.overview.averageParticipation * 100)}%`;
    document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
  }
}

// Global functions for UI interaction
window.refreshLeaderboard = async function() {
  if (window.clanLeaderboardUI) {
    await window.clanLeaderboardUI.updateLeaderboard();
  }
};

window.showAnalytics = function() {
  document.getElementById('analytics-modal').style.display = 'block';
};

window.closeAnalytics = function() {
  document.getElementById('analytics-modal').style.display = 'none';
};

window.showAchievements = function() {
  document.getElementById('achievements-modal').style.display = 'block';
};

window.closeAchievements = function() {
  document.getElementById('achievements-modal').style.display = 'none';
};

window.showClanDetails = function(clanId) {
  document.getElementById('clan-details-modal').style.display = 'block';
  // Load clan details
};

window.closeClanDetails = function() {
  document.getElementById('clan-details-modal').style.display = 'none';
};

// Export main classes
export default ClanLeaderboardSystem;

console.log('MLG.clan Leaderboard System loaded successfully');
console.log('Features: Multi-category rankings, achievements, streaks, rivalries, real-time updates');
console.log('Categories: Overall Power, Content Curation, Governance, Community, Token Economics, Alliances');
console.log('Time Periods: All-time, Seasonal, Monthly, Weekly, Daily');
console.log('Integration: clan-management.js, clan-voting.js, MLG Token: 7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL');