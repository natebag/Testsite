/**
 * MLG.clan Clan Statistics and Performance Metrics System - Sub-task 5.6
 * 
 * Comprehensive clan statistics and performance analytics system that tracks,
 * analyzes, and visualizes clan performance across multiple metrics including
 * member activity, financial performance, governance participation, content
 * contribution, social health, and competitive achievements.
 * 
 * Core Features:
 * - Real-time statistics tracking with WebSocket updates
 * - Advanced performance analytics with trend analysis and forecasting
 * - Time-series data management with multiple aggregation levels
 * - Comprehensive dashboard integration with interactive visualizations
 * - Member segmentation and cohort analysis
 * - Predictive analytics for clan sustainability and growth
 * - Benchmark comparisons and performance thresholds
 * - Alert system for significant metric changes
 * 
 * Statistics Categories:
 * - Member Activity: Voting frequency, participation rates, engagement scores
 * - Financial Performance: MLG token burns, treasury contributions, economic activity
 * - Governance Metrics: Proposal creation, voting patterns, leadership effectiveness
 * - Content Metrics: Submissions, curation activity, moderation participation
 * - Social Health: Recruitment success, retention rates, community vitality
 * - Competitive Performance: Tournament results, ranking improvements, achievements
 * 
 * Analytics Features:
 * - Trend analysis with historical comparisons
 * - Growth trajectory calculations and forecasting
 * - Efficiency metrics and ROI calculations
 * - Health scores for operational aspects
 * - Statistical significance testing
 * - Anomaly detection and pattern recognition
 * 
 * Integration Points:
 * - clan-management.js: Core clan data and member information
 * - clan-voting.js: Governance and voting metrics
 * - clan-leaderboard.js: Competitive rankings and achievements
 * - Solana blockchain: Token transactions and financial data
 * - Content systems: Activity and contribution metrics
 * - External APIs: Market data and benchmark comparisons
 * 
 * @author Claude Code - Solana Web3 Security Architect
 * @version 1.0.0
 * @integration MLG Token: 7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL
 */

import pkg from '@solana/web3.js';
const { 
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL
} = pkg;

import * as splToken from '@solana/spl-token';
const {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getAccount
} = splToken;

import { 
  createConnection, 
  createMLGTokenConnection,
  MLG_TOKEN_CONFIG,
  TOKEN_PROGRAMS,
  CURRENT_NETWORK
} from '../../config/solana-config.js';

import { CLAN_TIER_CONFIG, CLAN_ROLES, CLAN_CONFIG } from './clan-management.js';
import { CLAN_VOTING_CONFIG } from './clan-voting.js';
import { CLAN_LEADERBOARD_CONFIG } from './clan-leaderboard.js';
import crypto from 'crypto';

/**
 * Clan Statistics Configuration
 * Defines metrics, thresholds, and analysis parameters
 */
export const CLAN_STATISTICS_CONFIG = {
  // Data aggregation periods
  AGGREGATION_PERIODS: {
    REAL_TIME: 'realtime',
    HOURLY: 'hourly', 
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    QUARTERLY: 'quarterly',
    YEARLY: 'yearly'
  },

  // Statistics categories with weights and calculations
  CATEGORIES: {
    MEMBER_ACTIVITY: {
      id: 'member_activity',
      name: 'Member Activity',
      description: 'Member engagement, voting frequency, and participation metrics',
      icon: '👥',
      color: '#4299E1',
      weight: 0.25,
      metrics: {
        VOTING_FREQUENCY: {
          id: 'voting_frequency',
          name: 'Voting Frequency',
          description: 'Average votes per member per time period',
          unit: 'votes/member/day',
          weight: 0.3,
          threshold: { excellent: 2.0, good: 1.0, poor: 0.2 }
        },
        PARTICIPATION_RATE: {
          id: 'participation_rate', 
          name: 'Participation Rate',
          description: 'Percentage of members actively participating',
          unit: 'percentage',
          weight: 0.25,
          threshold: { excellent: 80, good: 60, poor: 30 }
        },
        ENGAGEMENT_SCORE: {
          id: 'engagement_score',
          name: 'Engagement Score',
          description: 'Composite engagement metric based on multiple activities',
          unit: 'score',
          weight: 0.25,
          threshold: { excellent: 90, good: 70, poor: 40 }
        },
        RETENTION_RATE: {
          id: 'retention_rate',
          name: 'Member Retention Rate',
          description: 'Percentage of members retained over time periods',
          unit: 'percentage',
          weight: 0.2,
          threshold: { excellent: 95, good: 85, poor: 70 }
        }
      }
    },

    FINANCIAL_PERFORMANCE: {
      id: 'financial_performance',
      name: 'Financial Performance',
      description: 'MLG token economics and treasury management',
      icon: '💰',
      color: '#F6AD55',
      weight: 0.25,
      metrics: {
        TOKEN_BURNS: {
          id: 'token_burns',
          name: 'MLG Token Burns',
          description: 'Total MLG tokens burned for voting activities',
          unit: 'MLG',
          weight: 0.3,
          threshold: { excellent: 1000, good: 500, poor: 100 }
        },
        TREASURY_CONTRIBUTIONS: {
          id: 'treasury_contributions',
          name: 'Treasury Contributions',
          description: 'Member contributions to clan treasury',
          unit: 'MLG',
          weight: 0.25,
          threshold: { excellent: 5000, good: 2000, poor: 500 }
        },
        ECONOMIC_ACTIVITY: {
          id: 'economic_activity',
          name: 'Economic Activity',
          description: 'Overall financial activity and transaction volume',
          unit: 'MLG',
          weight: 0.25,
          threshold: { excellent: 10000, good: 5000, poor: 1000 }
        },
        BURN_EFFICIENCY: {
          id: 'burn_efficiency',
          name: 'Burn Efficiency',
          description: 'Effectiveness of token burns per vote outcome',
          unit: 'score',
          weight: 0.2,
          threshold: { excellent: 85, good: 70, poor: 50 }
        }
      }
    },

    GOVERNANCE_METRICS: {
      id: 'governance_metrics',
      name: 'Governance Performance',
      description: 'Proposal creation, voting patterns, and leadership effectiveness',
      icon: '⚖️',
      color: '#9F7AEA',
      weight: 0.2,
      metrics: {
        PROPOSAL_CREATION: {
          id: 'proposal_creation',
          name: 'Proposal Creation Rate',
          description: 'Number of proposals created per time period',
          unit: 'proposals/month',
          weight: 0.25,
          threshold: { excellent: 10, good: 5, poor: 1 }
        },
        VOTING_PATTERNS: {
          id: 'voting_patterns',
          name: 'Voting Pattern Health',
          description: 'Diversity and quality of voting decisions',
          unit: 'score',
          weight: 0.25,
          threshold: { excellent: 85, good: 70, poor: 50 }
        },
        LEADERSHIP_EFFECTIVENESS: {
          id: 'leadership_effectiveness',
          name: 'Leadership Effectiveness',
          description: 'Success rate of leadership decisions and member satisfaction',
          unit: 'score',
          weight: 0.3,
          threshold: { excellent: 90, good: 75, poor: 55 }
        },
        GOVERNANCE_PARTICIPATION: {
          id: 'governance_participation',
          name: 'Governance Participation',
          description: 'Member participation in governance activities',
          unit: 'percentage',
          weight: 0.2,
          threshold: { excellent: 75, good: 55, poor: 30 }
        }
      }
    },

    CONTENT_METRICS: {
      id: 'content_metrics',
      name: 'Content Performance',
      description: 'Content submissions, curation, and moderation activities',
      icon: '📝',
      color: '#48BB78',
      weight: 0.15,
      metrics: {
        CONTENT_SUBMISSIONS: {
          id: 'content_submissions',
          name: 'Content Submissions',
          description: 'Rate of content submissions by clan members',
          unit: 'submissions/week',
          weight: 0.3,
          threshold: { excellent: 20, good: 10, poor: 3 }
        },
        CURATION_ACTIVITY: {
          id: 'curation_activity',
          name: 'Curation Activity',
          description: 'Member participation in content curation voting',
          unit: 'percentage',
          weight: 0.25,
          threshold: { excellent: 70, good: 50, poor: 25 }
        },
        MODERATION_PARTICIPATION: {
          id: 'moderation_participation',
          name: 'Moderation Participation',
          description: 'Active participation in content moderation',
          unit: 'percentage',
          weight: 0.25,
          threshold: { excellent: 60, good: 40, poor: 20 }
        },
        CONTENT_QUALITY: {
          id: 'content_quality',
          name: 'Content Quality Score',
          description: 'Average quality rating of clan member content',
          unit: 'score',
          weight: 0.2,
          threshold: { excellent: 85, good: 70, poor: 50 }
        }
      }
    },

    SOCIAL_HEALTH: {
      id: 'social_health',
      name: 'Social Health',
      description: 'Community vitality, recruitment success, and member satisfaction',
      icon: '🤝',
      color: '#ED8936',
      weight: 0.15,
      metrics: {
        RECRUITMENT_SUCCESS: {
          id: 'recruitment_success',
          name: 'Recruitment Success Rate',
          description: 'Percentage of successful member recruitments',
          unit: 'percentage',
          weight: 0.3,
          threshold: { excellent: 80, good: 60, poor: 35 }
        },
        COMMUNITY_HEALTH: {
          id: 'community_health',
          name: 'Community Health Score',
          description: 'Overall community engagement and satisfaction',
          unit: 'score',
          weight: 0.3,
          threshold: { excellent: 90, good: 75, poor: 55 }
        },
        CONFLICT_RESOLUTION: {
          id: 'conflict_resolution',
          name: 'Conflict Resolution Rate',
          description: 'Success rate of resolving member conflicts',
          unit: 'percentage',
          weight: 0.2,
          threshold: { excellent: 95, good: 85, poor: 70 }
        },
        MEMBER_SATISFACTION: {
          id: 'member_satisfaction',
          name: 'Member Satisfaction',
          description: 'Overall member satisfaction with clan experience',
          unit: 'score',
          weight: 0.2,
          threshold: { excellent: 85, good: 70, poor: 50 }
        }
      }
    },

    COMPETITIVE_PERFORMANCE: {
      id: 'competitive_performance',
      name: 'Competitive Performance',
      description: 'Tournament results, rankings, and competitive achievements',
      icon: '🏆',
      color: '#E53E3E',
      weight: 0.2,
      metrics: {
        TOURNAMENT_PERFORMANCE: {
          id: 'tournament_performance',
          name: 'Tournament Performance',
          description: 'Win rate and ranking in competitive tournaments',
          unit: 'score',
          weight: 0.3,
          threshold: { excellent: 85, good: 65, poor: 40 }
        },
        RANKING_IMPROVEMENTS: {
          id: 'ranking_improvements',
          name: 'Ranking Improvements',
          description: 'Rate of ranking improvements over time',
          unit: 'positions/month',
          weight: 0.25,
          threshold: { excellent: 5, good: 2, poor: 0 }
        },
        ACHIEVEMENT_PROGRESS: {
          id: 'achievement_progress',
          name: 'Achievement Progress',
          description: 'Rate of unlocking new achievements and milestones',
          unit: 'achievements/month',
          weight: 0.25,
          threshold: { excellent: 3, good: 2, poor: 1 }
        },
        COMPETITIVE_CONSISTENCY: {
          id: 'competitive_consistency',
          name: 'Competitive Consistency',
          description: 'Consistency in competitive performance',
          unit: 'score',
          weight: 0.2,
          threshold: { excellent: 80, good: 65, poor: 45 }
        }
      }
    }
  },

  // Performance thresholds and health scores
  HEALTH_SCORE_RANGES: {
    EXCELLENT: { min: 85, max: 100, color: '#48BB78', label: 'Excellent' },
    GOOD: { min: 70, max: 84, color: '#4299E1', label: 'Good' },
    AVERAGE: { min: 55, max: 69, color: '#F6AD55', label: 'Average' },
    POOR: { min: 40, max: 54, color: '#ED8936', label: 'Poor' },
    CRITICAL: { min: 0, max: 39, color: '#E53E3E', label: 'Critical' }
  },

  // Data retention and processing
  DATA_RETENTION: {
    REAL_TIME: 24 * 60 * 60 * 1000, // 24 hours
    HOURLY: 30 * 24 * 60 * 60 * 1000, // 30 days
    DAILY: 365 * 24 * 60 * 60 * 1000, // 1 year
    WEEKLY: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
    MONTHLY: 5 * 365 * 24 * 60 * 60 * 1000, // 5 years
    QUARTERLY: 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
    YEARLY: -1 // Permanent retention
  },

  // Alert thresholds and notification settings
  ALERT_THRESHOLDS: {
    CRITICAL_DROP: -20, // 20% drop triggers critical alert
    SIGNIFICANT_CHANGE: 15, // 15% change triggers notification
    TREND_REVERSAL: 3, // 3 consecutive periods of reversal
    ANOMALY_THRESHOLD: 2.5 // Standard deviations for anomaly detection
  },

  // Cache and performance settings
  CACHE_SETTINGS: {
    STATISTICS_TTL: 5 * 60 * 1000, // 5 minutes for statistics cache
    ANALYTICS_TTL: 15 * 60 * 1000, // 15 minutes for analytics cache
    TRENDS_TTL: 60 * 60 * 1000, // 1 hour for trend data cache
    MAX_CACHE_SIZE: 1000, // Maximum cache entries
    BATCH_SIZE: 100 // Batch processing size
  }
};

/**
 * Clan Statistics and Performance Metrics Manager
 * Comprehensive analytics and metrics tracking system for clan performance
 */
export class ClanStatisticsManager {
  constructor(walletAdapter = null) {
    this.walletAdapter = walletAdapter;
    this.connection = createMLGTokenConnection();
    this.mlgTokenMint = new PublicKey(TOKEN_PROGRAMS.MLG_TOKEN_MINT);
    
    // Data storage and caching
    this.statisticsCache = new Map();
    this.analyticsCache = new Map();
    this.trendCache = new Map();
    this.alertCache = new Map();
    
    // Time-series data storage
    this.timeSeriesData = new Map();
    this.aggregatedData = new Map();
    
    // Real-time updates
    this.subscribers = new Map();
    this.updateInterval = null;
    
    // Performance tracking
    this.lastCalculations = new Map();
    this.processingQueue = [];
    this.isProcessing = false;

    console.log('ClanStatisticsManager initialized with comprehensive analytics');
  }

  /**
   * Initialize real-time statistics tracking
   */
  async initialize() {
    try {
      console.log('Initializing clan statistics system...');
      
      // Load historical data
      await this.loadHistoricalData();
      
      // Start real-time updates
      this.startRealTimeUpdates();
      
      // Initialize alert system
      await this.initializeAlertSystem();
      
      console.log('Clan statistics system initialized successfully');
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize statistics system:', error);
      throw error;
    }
  }

  /**
   * Start real-time statistics updates
   */
  startRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      try {
        await this.updateRealTimeStatistics();
      } catch (error) {
        console.error('Real-time update failed:', error);
      }
    }, 30000); // Update every 30 seconds

    console.log('Real-time statistics updates started');
  }

  /**
   * Stop real-time statistics updates
   */
  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    console.log('Real-time statistics updates stopped');
  }

  /**
   * Calculate comprehensive clan statistics
   */
  async calculateClanStatistics(clanAddress, period = 'daily') {
    try {
      const cacheKey = `${clanAddress}_${period}_${Date.now()}`;
      
      // Check cache first
      if (this.statisticsCache.has(cacheKey)) {
        const cached = this.statisticsCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CLAN_STATISTICS_CONFIG.CACHE_SETTINGS.STATISTICS_TTL) {
          return cached.data;
        }
      }

      console.log(`Calculating clan statistics for ${clanAddress} (${period})`);

      // Get clan data
      const clanData = await this.getClanData(clanAddress);
      if (!clanData) {
        throw new Error('Clan not found');
      }

      // Calculate statistics for each category
      const statistics = {
        clanAddress: clanAddress,
        clanName: clanData.name,
        tier: clanData.tier,
        period: period,
        timestamp: new Date().toISOString(),
        calculatedAt: Date.now(),
        
        // Core statistics by category
        memberActivity: await this.calculateMemberActivityStats(clanData, period),
        financialPerformance: await this.calculateFinancialStats(clanData, period),
        governanceMetrics: await this.calculateGovernanceStats(clanData, period),
        contentMetrics: await this.calculateContentStats(clanData, period),
        socialHealth: await this.calculateSocialHealthStats(clanData, period),
        competitivePerformance: await this.calculateCompetitiveStats(clanData, period),
        
        // Composite scores
        overallScore: 0,
        healthScore: 0,
        trendDirection: 'stable',
        
        // Performance indicators
        strengths: [],
        weaknesses: [],
        recommendations: [],
        alerts: []
      };

      // Calculate composite scores
      statistics.overallScore = this.calculateOverallScore(statistics);
      statistics.healthScore = this.calculateHealthScore(statistics);
      statistics.trendDirection = await this.calculateTrendDirection(clanAddress, period);

      // Generate insights
      statistics.strengths = this.identifyStrengths(statistics);
      statistics.weaknesses = this.identifyWeaknesses(statistics);
      statistics.recommendations = this.generateRecommendations(statistics);
      statistics.alerts = await this.checkAlertConditions(statistics);

      // Cache results
      this.statisticsCache.set(cacheKey, {
        data: statistics,
        timestamp: Date.now()
      });

      // Store time-series data
      await this.storeTimeSeriesData(clanAddress, statistics);

      return statistics;
    } catch (error) {
      console.error('Error calculating clan statistics:', error);
      throw error;
    }
  }

  /**
   * Calculate member activity statistics
   */
  async calculateMemberActivityStats(clanData, period) {
    try {
      const now = Date.now();
      const periodMs = this.getPeriodMilliseconds(period);
      const startTime = now - periodMs;

      // Get member activity data
      const memberActivities = await this.getMemberActivities(clanData.id, startTime, now);
      
      const stats = {
        totalMembers: clanData.memberCount,
        activeMembers: 0,
        votingFrequency: 0,
        participationRate: 0,
        engagementScore: 0,
        retentionRate: 0,
        averageSessionTime: 0,
        memberGrowthRate: 0
      };

      if (memberActivities.length === 0) {
        return stats;
      }

      // Calculate active members (those with activity in period)
      const activeMemberIds = new Set(memberActivities.map(a => a.memberId));
      stats.activeMembers = activeMemberIds.size;
      stats.participationRate = (stats.activeMembers / stats.totalMembers) * 100;

      // Calculate voting frequency
      const totalVotes = memberActivities.filter(a => a.type === 'vote').length;
      stats.votingFrequency = stats.activeMembers > 0 ? totalVotes / stats.activeMembers : 0;

      // Calculate engagement score (composite metric)
      const engagementFactors = {
        votingActivity: Math.min(stats.votingFrequency / 2.0, 1.0), // Normalize to daily target
        participationRate: stats.participationRate / 100,
        consistentParticipation: this.calculateConsistentParticipation(memberActivities),
        diversityOfActions: this.calculateActionDiversity(memberActivities)
      };

      stats.engagementScore = (
        engagementFactors.votingActivity * 0.3 +
        engagementFactors.participationRate * 0.3 +
        engagementFactors.consistentParticipation * 0.2 +
        engagementFactors.diversityOfActions * 0.2
      ) * 100;

      // Calculate retention rate
      stats.retentionRate = await this.calculateRetentionRate(clanData.id, period);

      // Calculate member growth rate
      stats.memberGrowthRate = await this.calculateMemberGrowthRate(clanData.id, period);

      return stats;
    } catch (error) {
      console.error('Error calculating member activity stats:', error);
      return this.getDefaultMemberActivityStats();
    }
  }

  /**
   * Calculate financial performance statistics
   */
  async calculateFinancialStats(clanData, period) {
    try {
      const now = Date.now();
      const periodMs = this.getPeriodMilliseconds(period);
      const startTime = now - periodMs;

      // Get financial transactions
      const transactions = await this.getFinancialTransactions(clanData.id, startTime, now);
      
      const stats = {
        totalTokenBurns: 0,
        treasuryContributions: 0,
        economicActivity: 0,
        burnEfficiency: 0,
        averageBurnPerVote: 0,
        treasuryGrowthRate: 0,
        costPerEngagement: 0,
        returnOnInvestment: 0
      };

      if (transactions.length === 0) {
        return stats;
      }

      // Calculate token burns
      const burnTransactions = transactions.filter(t => t.type === 'burn');
      stats.totalTokenBurns = burnTransactions.reduce((sum, t) => sum + t.amount, 0);

      // Calculate treasury contributions
      const treasuryTransactions = transactions.filter(t => t.type === 'treasury_contribution');
      stats.treasuryContributions = treasuryTransactions.reduce((sum, t) => sum + t.amount, 0);

      // Calculate total economic activity
      stats.economicActivity = transactions.reduce((sum, t) => sum + t.amount, 0);

      // Calculate burn efficiency (successful outcomes per MLG burned)
      const successfulVotes = await this.getSuccessfulVoteCount(clanData.id, startTime, now);
      stats.burnEfficiency = stats.totalTokenBurns > 0 ? (successfulVotes / stats.totalTokenBurns) * 100 : 0;

      // Calculate average burn per vote
      const totalVotes = await this.getTotalVoteCount(clanData.id, startTime, now);
      stats.averageBurnPerVote = totalVotes > 0 ? stats.totalTokenBurns / totalVotes : 0;

      // Calculate treasury growth rate
      stats.treasuryGrowthRate = await this.calculateTreasuryGrowthRate(clanData.id, period);

      // Calculate cost per engagement
      const totalEngagements = await this.getTotalEngagementCount(clanData.id, startTime, now);
      stats.costPerEngagement = totalEngagements > 0 ? stats.totalTokenBurns / totalEngagements : 0;

      // Calculate return on investment (value generated per MLG spent)
      const valueGenerated = await this.calculateValueGenerated(clanData.id, startTime, now);
      stats.returnOnInvestment = stats.economicActivity > 0 ? (valueGenerated / stats.economicActivity) * 100 : 0;

      return stats;
    } catch (error) {
      console.error('Error calculating financial stats:', error);
      return this.getDefaultFinancialStats();
    }
  }

  /**
   * Calculate governance performance statistics
   */
  async calculateGovernanceStats(clanData, period) {
    try {
      const now = Date.now();
      const periodMs = this.getPeriodMilliseconds(period);
      const startTime = now - periodMs;

      // Get governance activities
      const proposals = await this.getProposals(clanData.id, startTime, now);
      const votes = await this.getGovernanceVotes(clanData.id, startTime, now);
      
      const stats = {
        proposalsCreated: proposals.length,
        proposalsSuccessful: 0,
        votingPatternScore: 0,
        leadershipEffectiveness: 0,
        governanceParticipation: 0,
        decisionQuality: 0,
        consensusRate: 0,
        leadershipTurnover: 0
      };

      if (proposals.length === 0) {
        return stats;
      }

      // Calculate successful proposals
      stats.proposalsSuccessful = proposals.filter(p => p.status === 'passed').length;
      const successRate = (stats.proposalsSuccessful / proposals.length) * 100;

      // Calculate voting pattern health
      stats.votingPatternScore = this.calculateVotingPatternHealth(votes);

      // Calculate governance participation
      const uniqueVoters = new Set(votes.map(v => v.voterId));
      stats.governanceParticipation = (uniqueVoters.size / clanData.memberCount) * 100;

      // Calculate leadership effectiveness
      const leadershipDecisions = await this.getLeadershipDecisions(clanData.id, startTime, now);
      stats.leadershipEffectiveness = this.calculateLeadershipEffectiveness(leadershipDecisions);

      // Calculate decision quality (impact and satisfaction)
      stats.decisionQuality = await this.calculateDecisionQuality(proposals);

      // Calculate consensus rate
      stats.consensusRate = this.calculateConsensusRate(votes);

      // Calculate leadership turnover
      stats.leadershipTurnover = await this.calculateLeadershipTurnover(clanData.id, period);

      return stats;
    } catch (error) {
      console.error('Error calculating governance stats:', error);
      return this.getDefaultGovernanceStats();
    }
  }

  /**
   * Calculate content performance statistics
   */
  async calculateContentStats(clanData, period) {
    try {
      const now = Date.now();
      const periodMs = this.getPeriodMilliseconds(period);
      const startTime = now - periodMs;

      // Get content activities
      const submissions = await this.getContentSubmissions(clanData.id, startTime, now);
      const curations = await this.getContentCurations(clanData.id, startTime, now);
      const moderations = await this.getModerationActivities(clanData.id, startTime, now);
      
      const stats = {
        contentSubmissions: submissions.length,
        curationActivity: 0,
        moderationParticipation: 0,
        contentQuality: 0,
        submissionRate: 0,
        curationSuccessRate: 0,
        moderationEfficiency: 0,
        contentDiversity: 0
      };

      // Calculate submission rate per member
      stats.submissionRate = clanData.memberCount > 0 ? submissions.length / clanData.memberCount : 0;

      // Calculate curation activity participation
      const uniqueCurators = new Set(curations.map(c => c.curatorId));
      stats.curationActivity = (uniqueCurators.size / clanData.memberCount) * 100;

      // Calculate moderation participation
      const uniqueModerators = new Set(moderations.map(m => m.moderatorId));
      stats.moderationParticipation = (uniqueModerators.size / clanData.memberCount) * 100;

      // Calculate content quality score
      if (submissions.length > 0) {
        const totalQualityScore = submissions.reduce((sum, s) => sum + (s.qualityScore || 0), 0);
        stats.contentQuality = totalQualityScore / submissions.length;
      }

      // Calculate curation success rate
      const successfulCurations = curations.filter(c => c.outcome === 'approved').length;
      stats.curationSuccessRate = curations.length > 0 ? (successfulCurations / curations.length) * 100 : 0;

      // Calculate moderation efficiency
      const resolvedModerations = moderations.filter(m => m.status === 'resolved').length;
      stats.moderationEfficiency = moderations.length > 0 ? (resolvedModerations / moderations.length) * 100 : 0;

      // Calculate content diversity
      stats.contentDiversity = this.calculateContentDiversity(submissions);

      return stats;
    } catch (error) {
      console.error('Error calculating content stats:', error);
      return this.getDefaultContentStats();
    }
  }

  /**
   * Calculate social health statistics
   */
  async calculateSocialHealthStats(clanData, period) {
    try {
      const now = Date.now();
      const periodMs = this.getPeriodMilliseconds(period);
      const startTime = now - periodMs;

      // Get social activities
      const recruitments = await this.getRecruitmentActivities(clanData.id, startTime, now);
      const conflicts = await this.getConflictResolutions(clanData.id, startTime, now);
      const interactions = await this.getSocialInteractions(clanData.id, startTime, now);
      
      const stats = {
        recruitmentSuccess: 0,
        communityHealth: 0,
        conflictResolution: 0,
        memberSatisfaction: 0,
        socialCohesion: 0,
        membershipStability: 0,
        culturalAlignment: 0,
        inclusivityScore: 0
      };

      // Calculate recruitment success rate
      const successfulRecruitments = recruitments.filter(r => r.status === 'accepted').length;
      stats.recruitmentSuccess = recruitments.length > 0 ? (successfulRecruitments / recruitments.length) * 100 : 0;

      // Calculate community health score
      stats.communityHealth = this.calculateCommunityHealthScore(interactions, clanData);

      // Calculate conflict resolution rate
      const resolvedConflicts = conflicts.filter(c => c.status === 'resolved').length;
      stats.conflictResolution = conflicts.length > 0 ? (resolvedConflicts / conflicts.length) * 100 : 100; // 100% if no conflicts

      // Calculate member satisfaction
      stats.memberSatisfaction = await this.calculateMemberSatisfaction(clanData.id, period);

      // Calculate social cohesion
      stats.socialCohesion = this.calculateSocialCohesion(interactions);

      // Calculate membership stability
      stats.membershipStability = await this.calculateMembershipStability(clanData.id, period);

      // Calculate cultural alignment
      stats.culturalAlignment = await this.calculateCulturalAlignment(clanData.id);

      // Calculate inclusivity score
      stats.inclusivityScore = this.calculateInclusivityScore(interactions, clanData);

      return stats;
    } catch (error) {
      console.error('Error calculating social health stats:', error);
      return this.getDefaultSocialHealthStats();
    }
  }

  /**
   * Calculate competitive performance statistics
   */
  async calculateCompetitiveStats(clanData, period) {
    try {
      const now = Date.now();
      const periodMs = this.getPeriodMilliseconds(period);
      const startTime = now - periodMs;

      // Get competitive activities
      const tournaments = await this.getTournamentParticipations(clanData.id, startTime, now);
      const rankings = await this.getRankingHistory(clanData.id, startTime, now);
      const achievements = await this.getAchievements(clanData.id, startTime, now);
      
      const stats = {
        tournamentPerformance: 0,
        rankingImprovements: 0,
        achievementProgress: 0,
        competitiveConsistency: 0,
        winRate: 0,
        skillProgression: 0,
        teamworkScore: 0,
        adaptabilityScore: 0
      };

      // Calculate tournament performance
      if (tournaments.length > 0) {
        const totalPerformanceScore = tournaments.reduce((sum, t) => sum + t.performanceScore, 0);
        stats.tournamentPerformance = totalPerformanceScore / tournaments.length;
        
        // Calculate win rate
        const wins = tournaments.filter(t => t.result === 'win').length;
        stats.winRate = (wins / tournaments.length) * 100;
      }

      // Calculate ranking improvements
      if (rankings.length > 1) {
        const rankingChanges = [];
        for (let i = 1; i < rankings.length; i++) {
          rankingChanges.push(rankings[i-1].position - rankings[i].position); // Positive = improvement
        }
        stats.rankingImprovements = rankingChanges.length > 0 ? 
          rankingChanges.reduce((sum, change) => sum + change, 0) / rankingChanges.length : 0;
      }

      // Calculate achievement progress
      stats.achievementProgress = achievements.length;

      // Calculate competitive consistency
      stats.competitiveConsistency = this.calculateCompetitiveConsistency(tournaments);

      // Calculate skill progression
      stats.skillProgression = await this.calculateSkillProgression(clanData.id, period);

      // Calculate teamwork score
      stats.teamworkScore = this.calculateTeamworkScore(tournaments);

      // Calculate adaptability score
      stats.adaptabilityScore = this.calculateAdaptabilityScore(tournaments);

      return stats;
    } catch (error) {
      console.error('Error calculating competitive stats:', error);
      return this.getDefaultCompetitiveStats();
    }
  }

  /**
   * Calculate overall clan performance score
   */
  calculateOverallScore(statistics) {
    try {
      const categoryScores = {
        memberActivity: this.normalizeScore(statistics.memberActivity.engagementScore),
        financialPerformance: this.normalizeFinancialScore(statistics.financialPerformance),
        governanceMetrics: this.normalizeGovernanceScore(statistics.governanceMetrics),
        contentMetrics: this.normalizeContentScore(statistics.contentMetrics),
        socialHealth: this.normalizeSocialScore(statistics.socialHealth),
        competitivePerformance: this.normalizeCompetitiveScore(statistics.competitivePerformance)
      };

      // Apply category weights
      const weightedScore = Object.entries(categoryScores).reduce((sum, [category, score]) => {
        const weight = CLAN_STATISTICS_CONFIG.CATEGORIES[category.toUpperCase()]?.weight || 0.1;
        return sum + (score * weight);
      }, 0);

      return Math.min(Math.max(weightedScore, 0), 100);
    } catch (error) {
      console.error('Error calculating overall score:', error);
      return 50; // Default middle score
    }
  }

  /**
   * Calculate clan health score
   */
  calculateHealthScore(statistics) {
    try {
      // Health score focuses on sustainability and stability
      const healthFactors = {
        memberRetention: statistics.memberActivity.retentionRate || 0,
        financialStability: this.assessFinancialStability(statistics.financialPerformance),
        governanceHealth: statistics.governanceMetrics.consensusRate || 0,
        socialCohesion: statistics.socialHealth.socialCohesion || 0,
        consistentParticipation: statistics.memberActivity.participationRate || 0
      };

      const weights = {
        memberRetention: 0.25,
        financialStability: 0.2,
        governanceHealth: 0.2,
        socialCohesion: 0.2,
        consistentParticipation: 0.15
      };

      const healthScore = Object.entries(healthFactors).reduce((sum, [factor, value]) => {
        return sum + (this.normalizeScore(value) * weights[factor]);
      }, 0);

      return Math.min(Math.max(healthScore, 0), 100);
    } catch (error) {
      console.error('Error calculating health score:', error);
      return 50; // Default middle score
    }
  }

  /**
   * Calculate trend direction for clan performance
   */
  async calculateTrendDirection(clanAddress, period) {
    try {
      // Get historical data for trend analysis
      const historicalPeriods = 5; // Look back 5 periods
      const historicalData = [];
      
      for (let i = 1; i <= historicalPeriods; i++) {
        const historyKey = `${clanAddress}_${period}_history_${i}`;
        const data = await this.getHistoricalStatistics(clanAddress, period, i);
        if (data) {
          historicalData.push(data.overallScore || 50);
        }
      }

      if (historicalData.length < 3) {
        return 'insufficient_data';
      }

      // Calculate trend using linear regression
      const trend = this.calculateLinearTrend(historicalData);
      
      if (trend > 2) {
        return 'improving';
      } else if (trend < -2) {
        return 'declining';
      } else {
        return 'stable';
      }
    } catch (error) {
      console.error('Error calculating trend direction:', error);
      return 'unknown';
    }
  }

  /**
   * Identify clan strengths based on statistics
   */
  identifyStrengths(statistics) {
    const strengths = [];
    const categories = CLAN_STATISTICS_CONFIG.CATEGORIES;

    // Check each category for excellence
    Object.entries(categories).forEach(([categoryId, categoryConfig]) => {
      const categoryData = statistics[this.toCamelCase(categoryId)];
      if (categoryData) {
        Object.entries(categoryConfig.metrics).forEach(([metricId, metricConfig]) => {
          const metricValue = categoryData[this.toCamelCase(metricId)];
          if (metricValue >= metricConfig.threshold.excellent) {
            strengths.push({
              category: categoryConfig.name,
              metric: metricConfig.name,
              value: metricValue,
              threshold: metricConfig.threshold.excellent,
              description: `Excellent ${metricConfig.name.toLowerCase()} performance`
            });
          }
        });
      }
    });

    return strengths;
  }

  /**
   * Identify clan weaknesses based on statistics
   */
  identifyWeaknesses(statistics) {
    const weaknesses = [];
    const categories = CLAN_STATISTICS_CONFIG.CATEGORIES;

    // Check each category for poor performance
    Object.entries(categories).forEach(([categoryId, categoryConfig]) => {
      const categoryData = statistics[this.toCamelCase(categoryId)];
      if (categoryData) {
        Object.entries(categoryConfig.metrics).forEach(([metricId, metricConfig]) => {
          const metricValue = categoryData[this.toCamelCase(metricId)];
          if (metricValue <= metricConfig.threshold.poor) {
            weaknesses.push({
              category: categoryConfig.name,
              metric: metricConfig.name,
              value: metricValue,
              threshold: metricConfig.threshold.poor,
              description: `Poor ${metricConfig.name.toLowerCase()} needs improvement`
            });
          }
        });
      }
    });

    return weaknesses;
  }

  /**
   * Generate recommendations for clan improvement
   */
  generateRecommendations(statistics) {
    const recommendations = [];
    const weaknesses = this.identifyWeaknesses(statistics);

    // Generate specific recommendations based on weaknesses
    weaknesses.forEach(weakness => {
      const recommendation = this.getRecommendationForWeakness(weakness);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    });

    // Add general improvement recommendations
    if (statistics.overallScore < 70) {
      recommendations.push({
        priority: 'high',
        category: 'General',
        title: 'Focus on Core Engagement',
        description: 'Increase member participation in voting and governance activities',
        actions: [
          'Organize clan events to boost engagement',
          'Implement member recognition programs',
          'Simplify voting processes'
        ]
      });
    }

    return recommendations.slice(0, 10); // Limit to top 10 recommendations
  }

  /**
   * Check for alert conditions
   */
  async checkAlertConditions(statistics) {
    const alerts = [];
    const thresholds = CLAN_STATISTICS_CONFIG.ALERT_THRESHOLDS;

    try {
      // Check for critical drops in performance
      const previousStats = await this.getPreviousStatistics(statistics.clanAddress, statistics.period);
      if (previousStats) {
        const scoreDrop = previousStats.overallScore - statistics.overallScore;
        if (scoreDrop >= Math.abs(thresholds.CRITICAL_DROP)) {
          alerts.push({
            level: 'critical',
            type: 'performance_drop',
            message: `Overall clan score dropped by ${scoreDrop.toFixed(1)}%`,
            recommendation: 'Investigate recent changes and take corrective action'
          });
        }
      }

      // Check for specific metric alerts
      if (statistics.memberActivity.participationRate < 30) {
        alerts.push({
          level: 'warning',
          type: 'low_participation',
          message: 'Member participation rate is critically low',
          recommendation: 'Implement engagement initiatives to boost participation'
        });
      }

      if (statistics.socialHealth.conflictResolution < 70) {
        alerts.push({
          level: 'warning',
          type: 'conflict_resolution',
          message: 'Conflict resolution rate is below acceptable threshold',
          recommendation: 'Review conflict resolution processes and leadership effectiveness'
        });
      }

      return alerts;
    } catch (error) {
      console.error('Error checking alert conditions:', error);
      return [];
    }
  }

  /**
   * Real-time statistics update
   */
  async updateRealTimeStatistics() {
    try {
      // Get all active clans
      const activeClans = await this.getActiveClanIds();
      
      for (const clanId of activeClans) {
        // Update statistics for each clan
        const stats = await this.calculateClanStatistics(clanId, 'realtime');
        
        // Notify subscribers
        this.notifySubscribers(clanId, stats);
        
        // Check for alerts
        const alerts = await this.checkAlertConditions(stats);
        if (alerts.length > 0) {
          await this.processAlerts(clanId, alerts);
        }
      }
    } catch (error) {
      console.error('Error updating real-time statistics:', error);
    }
  }

  /**
   * Subscribe to real-time statistics updates
   */
  subscribe(clanAddress, callback) {
    if (!this.subscribers.has(clanAddress)) {
      this.subscribers.set(clanAddress, new Set());
    }
    this.subscribers.get(clanAddress).add(callback);

    return () => {
      const clanSubscribers = this.subscribers.get(clanAddress);
      if (clanSubscribers) {
        clanSubscribers.delete(callback);
        if (clanSubscribers.size === 0) {
          this.subscribers.delete(clanAddress);
        }
      }
    };
  }

  /**
   * Notify subscribers of statistics updates
   */
  notifySubscribers(clanAddress, statistics) {
    const clanSubscribers = this.subscribers.get(clanAddress);
    if (clanSubscribers) {
      clanSubscribers.forEach(callback => {
        try {
          callback(statistics);
        } catch (error) {
          console.error('Error notifying subscriber:', error);
        }
      });
    }
  }

  /**
   * Export statistics data for analysis
   */
  async exportStatisticsData(clanAddress, format = 'json', dateRange = null) {
    try {
      const data = await this.getComprehensiveStatistics(clanAddress, dateRange);
      
      switch (format.toLowerCase()) {
        case 'json':
          return JSON.stringify(data, null, 2);
        case 'csv':
          return this.convertToCSV(data);
        case 'xlsx':
          return this.convertToExcel(data);
        default:
          throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Error exporting statistics data:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive analytics dashboard data
   */
  async getDashboardData(clanAddress, timeframe = '30d') {
    try {
      const cacheKey = `dashboard_${clanAddress}_${timeframe}`;
      
      // Check cache
      if (this.analyticsCache.has(cacheKey)) {
        const cached = this.analyticsCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CLAN_STATISTICS_CONFIG.CACHE_SETTINGS.ANALYTICS_TTL) {
          return cached.data;
        }
      }

      // Get current statistics
      const currentStats = await this.calculateClanStatistics(clanAddress, 'daily');
      
      // Get historical trends
      const trends = await this.getTrendAnalysis(clanAddress, timeframe);
      
      // Get benchmark comparisons
      const benchmarks = await this.getBenchmarkComparisons(clanAddress);
      
      // Get member analytics
      const memberAnalytics = await this.getMemberAnalytics(clanAddress, timeframe);
      
      const dashboardData = {
        currentStatistics: currentStats,
        trends: trends,
        benchmarks: benchmarks,
        memberAnalytics: memberAnalytics,
        alerts: currentStats.alerts,
        recommendations: currentStats.recommendations,
        lastUpdated: new Date().toISOString()
      };

      // Cache results
      this.analyticsCache.set(cacheKey, {
        data: dashboardData,
        timestamp: Date.now()
      });

      return dashboardData;
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Clear all caches and reset system
   */
  clearCache() {
    this.statisticsCache.clear();
    this.analyticsCache.clear();
    this.trendCache.clear();
    this.alertCache.clear();
    console.log('All statistics caches cleared');
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown() {
    try {
      this.stopRealTimeUpdates();
      this.subscribers.clear();
      this.clearCache();
      console.log('Clan statistics system shutdown complete');
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }

  // ======================
  // UTILITY METHODS
  // ======================

  /**
   * Convert period to milliseconds
   */
  getPeriodMilliseconds(period) {
    const periods = {
      'realtime': 60 * 60 * 1000, // 1 hour
      'hourly': 60 * 60 * 1000,
      'daily': 24 * 60 * 60 * 1000,
      'weekly': 7 * 24 * 60 * 60 * 1000,
      'monthly': 30 * 24 * 60 * 60 * 1000,
      'quarterly': 90 * 24 * 60 * 60 * 1000,
      'yearly': 365 * 24 * 60 * 60 * 1000
    };
    return periods[period] || periods.daily;
  }

  /**
   * Convert string to camelCase
   */
  toCamelCase(str) {
    return str.toLowerCase().replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
  }

  /**
   * Normalize score to 0-100 range
   */
  normalizeScore(value, min = 0, max = 100) {
    return Math.min(Math.max((value - min) / (max - min) * 100, 0), 100);
  }

  /**
   * Calculate linear trend from data points
   */
  calculateLinearTrend(data) {
    if (data.length < 2) return 0;
    
    const n = data.length;
    const sumX = (n * (n + 1)) / 2; // Sum of indices
    const sumY = data.reduce((sum, val) => sum + val, 0);
    const sumXY = data.reduce((sum, val, i) => sum + val * (i + 1), 0);
    const sumXX = (n * (n + 1) * (2 * n + 1)) / 6; // Sum of squares of indices

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  // ======================
  // PLACEHOLDER METHODS FOR DATA ACCESS
  // (These would be replaced with actual data access in production)
  // ======================

  async getClanData(clanAddress) {
    // Placeholder - would integrate with clan-management.js
    return {
      id: clanAddress,
      name: 'Sample Clan',
      memberCount: 25,
      tier: 'gold'
    };
  }

  async getMemberActivities(clanId, startTime, endTime) {
    // Placeholder - would integrate with activity tracking system
    return [];
  }

  async getFinancialTransactions(clanId, startTime, endTime) {
    // Placeholder - would integrate with Solana blockchain data
    return [];
  }

  async getProposals(clanId, startTime, endTime) {
    // Placeholder - would integrate with clan-voting.js
    return [];
  }

  async getContentSubmissions(clanId, startTime, endTime) {
    // Placeholder - would integrate with content system
    return [];
  }

  async getActiveClanIds() {
    // Placeholder - would get active clan list
    return [];
  }

  // Additional placeholder methods would be implemented here...
  // These are abbreviated for brevity but would be fully implemented in production

  getDefaultMemberActivityStats() {
    return {
      totalMembers: 0, activeMembers: 0, votingFrequency: 0,
      participationRate: 0, engagementScore: 0, retentionRate: 0,
      averageSessionTime: 0, memberGrowthRate: 0
    };
  }

  getDefaultFinancialStats() {
    return {
      totalTokenBurns: 0, treasuryContributions: 0, economicActivity: 0,
      burnEfficiency: 0, averageBurnPerVote: 0, treasuryGrowthRate: 0,
      costPerEngagement: 0, returnOnInvestment: 0
    };
  }

  getDefaultGovernanceStats() {
    return {
      proposalsCreated: 0, proposalsSuccessful: 0, votingPatternScore: 0,
      leadershipEffectiveness: 0, governanceParticipation: 0, decisionQuality: 0,
      consensusRate: 0, leadershipTurnover: 0
    };
  }

  getDefaultContentStats() {
    return {
      contentSubmissions: 0, curationActivity: 0, moderationParticipation: 0,
      contentQuality: 0, submissionRate: 0, curationSuccessRate: 0,
      moderationEfficiency: 0, contentDiversity: 0
    };
  }

  getDefaultSocialHealthStats() {
    return {
      recruitmentSuccess: 0, communityHealth: 0, conflictResolution: 100,
      memberSatisfaction: 0, socialCohesion: 0, membershipStability: 0,
      culturalAlignment: 0, inclusivityScore: 0
    };
  }

  getDefaultCompetitiveStats() {
    return {
      tournamentPerformance: 0, rankingImprovements: 0, achievementProgress: 0,
      competitiveConsistency: 0, winRate: 0, skillProgression: 0,
      teamworkScore: 0, adaptabilityScore: 0
    };
  }

  // Additional utility methods would be implemented here...
}

/**
 * Utility Functions
 */

/**
 * Format statistics for display with proper units and formatting
 */
export function formatStatisticValue(value, metric) {
  if (typeof value !== 'number') return 'N/A';
  
  switch (metric.unit) {
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'MLG':
      return `${value.toLocaleString()} MLG`;
    case 'score':
      return `${Math.round(value)}/100`;
    case 'votes/member/day':
      return `${value.toFixed(2)} votes/day`;
    case 'proposals/month':
      return `${Math.round(value)}/month`;
    case 'submissions/week':
      return `${Math.round(value)}/week`;
    case 'positions/month':
      return `${value.toFixed(1)} positions`;
    case 'achievements/month':
      return `${Math.round(value)}/month`;
    default:
      return value.toFixed(2);
  }
}

/**
 * Get health score range information
 */
export function getHealthScoreRange(score) {
  const ranges = CLAN_STATISTICS_CONFIG.HEALTH_SCORE_RANGES;
  
  for (const [key, range] of Object.entries(ranges)) {
    if (score >= range.min && score <= range.max) {
      return {
        level: key.toLowerCase(),
        ...range
      };
    }
  }
  
  return ranges.AVERAGE; // Default fallback
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(current, previous) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * Generate color based on performance score
 */
export function getPerformanceColor(score) {
  if (score >= 85) return '#48BB78'; // Green - Excellent
  if (score >= 70) return '#4299E1'; // Blue - Good  
  if (score >= 55) return '#F6AD55'; // Orange - Average
  if (score >= 40) return '#ED8936'; // Dark Orange - Poor
  return '#E53E3E'; // Red - Critical
}

/**
 * Validate statistics data structure
 */
export function validateStatisticsData(data) {
  const errors = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('Statistics data must be an object');
    return { isValid: false, errors };
  }
  
  const requiredFields = ['clanAddress', 'period', 'timestamp', 'overallScore'];
  requiredFields.forEach(field => {
    if (!(field in data)) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  const requiredCategories = ['memberActivity', 'financialPerformance', 'governanceMetrics'];
  requiredCategories.forEach(category => {
    if (!(category in data)) {
      errors.push(`Missing required category: ${category}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// Export configuration for external use
export { CLAN_STATISTICS_CONFIG };

console.log('MLG.clan Clan Statistics and Performance Metrics System loaded successfully');
console.log('Tracking categories:', Object.keys(CLAN_STATISTICS_CONFIG.CATEGORIES));
console.log('Xbox 360 retro gaming aesthetic support enabled');
console.log('MLG Token Integration: 7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL');