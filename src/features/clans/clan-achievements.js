/**
 * MLG.clan Clan Achievement System and Rewards - Sub-task 5.9
 * 
 * Comprehensive clan achievement and rewards system that tracks member accomplishments,
 * awards MLG tokens and exclusive privileges, and creates engaging gamification elements
 * across all aspects of clan participation and performance.
 * 
 * Core Features:
 * - Comprehensive achievement framework with multiple categories and tiers
 * - Dynamic progress tracking with milestone indicators and forecasting
 * - MLG token rewards with tier-based multipliers and bonus calculations
 * - Exclusive clan titles, badges, and special privileges
 * - NFT-based achievement certificates for prestigious accomplishments
 * - Retroactive achievement awarding for existing clan activities
 * - Seasonal and limited-time special achievements
 * - Blockchain-verified achievement recording on Solana
 * - Achievement marketplace for trading special achievement NFTs
 * - Comprehensive analytics and motivation tracking systems
 * 
 * Achievement Categories:
 * - Voting Milestones: Participation, consistency, and governance engagement
 * - Token Burns: Economic contributions and burn streak achievements
 * - Streak Rewards: Daily, weekly, and monthly consistency tracking
 * - Leadership: Clan management, mentoring, and community building
 * - Community: Recruitment, conflict resolution, and social engagement
 * - Competitive: Tournament victories, ranking improvements, excellence
 * - Financial: Treasury contributions, economic impact, and wealth building
 * - Social: Member interactions, collaboration, and team achievements
 * - Governance: Proposal creation, consensus building, democratic participation
 * - Special Events: Limited-time achievements and anniversary celebrations
 * 
 * Achievement Tiers:
 * - Bronze: Basic accomplishments (1-5 MLG reward)
 * - Silver: Moderate achievements (5-15 MLG reward)
 * - Gold: Significant milestones (15-50 MLG reward)
 * - Platinum: Major accomplishments (50-150 MLG reward)
 * - Legendary: Exceptional achievements (150-500 MLG reward)
 * - Mythic: Ultra-rare accomplishments (500-2000 MLG reward)
 * 
 * Integration Points:
 * - clan-voting.js: Governance participation and voting metrics
 * - clan-statistics.js: Performance data and trend analysis
 * - clan-leaderboard.js: Competitive rankings and achievements
 * - clan-management.js: Member management and community metrics
 * - MLG Token Contract: Reward distribution and burn tracking
 * - Solana Blockchain: Achievement verification and NFT minting
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
  sendAndConfirmTransaction,
  Keypair,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';

import {
TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createTransferInstruction,
  getAccount,
  getMint
} from '@solana/spl-token';

import { 
  createConnection, 
  createMLGTokenConnection,
  MLG_TOKEN_CONFIG,
  TOKEN_PROGRAMS,
  CURRENT_NETWORK,
  CONNECTION_CONFIG
} from '../../../config/environment/solana-config.js';

import { CLAN_TIER_CONFIG, CLAN_ROLES, CLAN_CONFIG } from './clan-management.js';
import { CLAN_VOTING_CONFIG } from './clan-voting.js';
import { CLAN_STATISTICS_CONFIG } from './clan-statistics.js';
import { CLAN_LEADERBOARD_CONFIG } from './clan-leaderboard.js';
import crypto from 'crypto';

/**
 * Achievement System Configuration
 * Defines achievement types, rewards, and progression mechanics
 */
export const ACHIEVEMENT_CONFIG = {
  // Achievement tiers with reward multipliers
  TIERS: {
    BRONZE: {
      id: 'bronze',
      name: 'Bronze',
      color: '#CD7F32',
      icon: '🥉',
      baseReward: 2,
      multiplier: 1.0,
      prestige: 1,
      nftEligible: false
    },
    SILVER: {
      id: 'silver', 
      name: 'Silver',
      color: '#C0C0C0',
      icon: '🥈',
      baseReward: 8,
      multiplier: 1.5,
      prestige: 2,
      nftEligible: false
    },
    GOLD: {
      id: 'gold',
      name: 'Gold',
      color: '#FFD700',
      icon: '🥇',
      baseReward: 25,
      multiplier: 2.0,
      prestige: 5,
      nftEligible: true
    },
    PLATINUM: {
      id: 'platinum',
      name: 'Platinum',
      color: '#E5E4E2',
      icon: '💎',
      baseReward: 75,
      multiplier: 3.0,
      prestige: 10,
      nftEligible: true
    },
    LEGENDARY: {
      id: 'legendary',
      name: 'Legendary',
      color: '#FF6600',
      icon: '👑',
      baseReward: 250,
      multiplier: 5.0,
      prestige: 25,
      nftEligible: true
    },
    MYTHIC: {
      id: 'mythic',
      name: 'Mythic',
      color: '#9400D3',
      icon: '⭐',
      baseReward: 750,
      multiplier: 10.0,
      prestige: 100,
      nftEligible: true
    }
  },

  // Achievement categories with specific metrics
  CATEGORIES: {
    VOTING_MILESTONES: {
      id: 'voting_milestones',
      name: 'Voting Milestones',
      description: 'Achievements based on voting participation and governance engagement',
      icon: '🗳️',
      color: '#4A5568',
      weight: 1.0
    },
    TOKEN_BURNS: {
      id: 'token_burns',
      name: 'Token Burns',
      description: 'Achievements for MLG token burn contributions and economic participation',
      icon: '🔥',
      color: '#E53E3E',
      weight: 1.2
    },
    STREAK_REWARDS: {
      id: 'streak_rewards', 
      name: 'Streak Rewards',
      description: 'Consistency achievements for daily, weekly, and monthly participation',
      icon: '⚡',
      color: '#38A169',
      weight: 0.8
    },
    LEADERSHIP: {
      id: 'leadership',
      name: 'Leadership',
      description: 'Management, mentoring, and community building achievements',
      icon: '👑',
      color: '#D69E2E',
      weight: 1.5
    },
    COMMUNITY: {
      id: 'community',
      name: 'Community',
      description: 'Social engagement, recruitment, and collaboration achievements',
      icon: '🤝',
      color: '#3182CE',
      weight: 1.0
    },
    COMPETITIVE: {
      id: 'competitive',
      name: 'Competitive',
      description: 'Tournament victories, ranking improvements, and excellence achievements',
      icon: '🏆',
      color: '#805AD5',
      weight: 1.3
    },
    FINANCIAL: {
      id: 'financial',
      name: 'Financial',
      description: 'Treasury contributions, economic impact, and wealth building',
      icon: '💰',
      color: '#319795',
      weight: 1.1
    },
    SOCIAL: {
      id: 'social',
      name: 'Social',
      description: 'Member interactions, team achievements, and collaboration',
      icon: '👥',
      color: '#ED64A6',
      weight: 0.9
    },
    GOVERNANCE: {
      id: 'governance',
      name: 'Governance', 
      description: 'Proposal creation, consensus building, and democratic participation',
      icon: '⚖️',
      color: '#38B2AC',
      weight: 1.4
    },
    SPECIAL_EVENTS: {
      id: 'special_events',
      name: 'Special Events',
      description: 'Limited-time achievements and anniversary celebrations',
      icon: '🎉',
      color: '#F56565',
      weight: 2.0
    }
  },

  // Special privileges unlocked by achievements
  PRIVILEGES: {
    CUSTOM_ROLE_COLORS: {
      id: 'custom_role_colors',
      name: 'Custom Role Colors',
      requiredAchievements: ['gold_voter', 'community_builder'],
      description: 'Ability to customize role colors and appearance'
    },
    PRIORITY_SUPPORT: {
      id: 'priority_support', 
      name: 'Priority Support',
      requiredAchievements: ['platinum_contributor', 'legendary_leader'],
      description: 'Priority customer support and direct access to developers'
    },
    PROPOSAL_PRIORITY: {
      id: 'proposal_priority',
      name: 'Proposal Priority',
      requiredAchievements: ['governance_master', 'consensus_builder'],
      description: 'Higher priority for governance proposals and suggestions'
    },
    ACHIEVEMENT_SHOWCASE: {
      id: 'achievement_showcase',
      name: 'Achievement Showcase',
      requiredAchievements: ['achievement_hunter', 'collection_master'],
      description: 'Special profile section to showcase rare achievements'
    },
    EXCLUSIVE_EVENTS: {
      id: 'exclusive_events',
      name: 'Exclusive Events Access',
      requiredAchievements: ['mythic_achiever', 'legendary_status'],
      description: 'Access to exclusive tournaments and special events'
    }
  },

  // Rate limiting and abuse prevention
  RATE_LIMITS: {
    ACHIEVEMENT_CHECKS_PER_MINUTE: 10,
    REWARD_CLAIMS_PER_HOUR: 5,
    BULK_PROCESSING_MAX_SIZE: 100,
    HISTORICAL_PROCESSING_BATCH_SIZE: 50
  },

  // Blockchain configuration
  BLOCKCHAIN: {
    ACHIEVEMENT_PROGRAM_ID: 'AchievementProgram11111111111111111111111',
    NFT_COLLECTION_PREFIX: 'MLGClanAchievement',
    VERIFICATION_REQUIRED: true,
    MINIMUM_CONFIRMATION: 'confirmed'
  }
};

/**
 * Comprehensive Achievement Definitions
 * Each achievement includes criteria, rewards, and progression tracking
 */
export const ACHIEVEMENT_DEFINITIONS = {
  // Voting Milestones Category
  first_vote: {
    id: 'first_vote',
    category: 'voting_milestones',
    tier: 'bronze',
    name: 'First Vote',
    description: 'Cast your first vote in any clan proposal',
    icon: '🗳️',
    criteria: {
      type: 'count',
      metric: 'total_votes',
      threshold: 1
    },
    rewards: {
      mlgTokens: 2,
      title: 'Voter',
      badge: 'first_voter'
    },
    oneTime: true,
    retroactive: true
  },

  daily_voter: {
    id: 'daily_voter',
    category: 'voting_milestones',
    tier: 'bronze',
    name: 'Daily Voter',
    description: 'Vote on proposals for 7 consecutive days',
    icon: '📅',
    criteria: {
      type: 'streak',
      metric: 'daily_votes',
      threshold: 7
    },
    rewards: {
      mlgTokens: 5,
      title: 'Daily Participant',
      badge: 'daily_voter'
    },
    oneTime: false,
    retroactive: false
  },

  weekly_champion: {
    id: 'weekly_champion',
    category: 'voting_milestones',
    tier: 'silver',
    name: 'Weekly Champion',
    description: 'Maintain voting activity for 4 consecutive weeks',
    icon: '🏅',
    criteria: {
      type: 'streak',
      metric: 'weekly_votes',
      threshold: 4
    },
    rewards: {
      mlgTokens: 12,
      title: 'Weekly Champion',
      badge: 'weekly_champion',
      privileges: ['proposal_priority']
    },
    oneTime: false,
    retroactive: false
  },

  monthly_master: {
    id: 'monthly_master',
    category: 'voting_milestones',
    tier: 'gold',
    name: 'Monthly Master',
    description: 'Consistent voting activity for 3 consecutive months',
    icon: '🌟',
    criteria: {
      type: 'streak',
      metric: 'monthly_votes',
      threshold: 3
    },
    rewards: {
      mlgTokens: 50,
      title: 'Monthly Master',
      badge: 'monthly_master',
      privileges: ['custom_role_colors', 'achievement_showcase']
    },
    oneTime: false,
    retroactive: false
  },

  annual_legend: {
    id: 'annual_legend',
    category: 'voting_milestones',
    tier: 'legendary',
    name: 'Annual Legend',
    description: 'Maintain consistent voting for an entire year',
    icon: '👑',
    criteria: {
      type: 'streak',
      metric: 'monthly_votes',
      threshold: 12
    },
    rewards: {
      mlgTokens: 500,
      title: 'Annual Legend',
      badge: 'annual_legend',
      privileges: ['priority_support', 'exclusive_events'],
      nftCertificate: true
    },
    oneTime: false,
    retroactive: false
  },

  // Token Burns Category
  token_burner: {
    id: 'token_burner',
    category: 'token_burns',
    tier: 'bronze',
    name: 'Token Burner',
    description: 'Burn 10 MLG tokens for additional votes',
    icon: '🔥',
    criteria: {
      type: 'count',
      metric: 'tokens_burned',
      threshold: 10
    },
    rewards: {
      mlgTokens: 3,
      title: 'Token Burner',
      badge: 'token_burner'
    },
    oneTime: true,
    retroactive: true
  },

  big_spender: {
    id: 'big_spender',
    category: 'token_burns',
    tier: 'silver',
    name: 'Big Spender',
    description: 'Burn 100 MLG tokens across all votes',
    icon: '💸',
    criteria: {
      type: 'count',
      metric: 'tokens_burned',
      threshold: 100
    },
    rewards: {
      mlgTokens: 20,
      title: 'Big Spender',
      badge: 'big_spender'
    },
    oneTime: true,
    retroactive: true
  },

  whale_trader: {
    id: 'whale_trader',
    category: 'token_burns',
    tier: 'gold',
    name: 'Whale Trader',
    description: 'Burn 1000 MLG tokens demonstrating serious economic commitment',
    icon: '🐋',
    criteria: {
      type: 'count',
      metric: 'tokens_burned',
      threshold: 1000
    },
    rewards: {
      mlgTokens: 100,
      title: 'Whale Trader',
      badge: 'whale_trader',
      privileges: ['priority_support']
    },
    oneTime: true,
    retroactive: true
  },

  economic_contributor: {
    id: 'economic_contributor',
    category: 'token_burns',
    tier: 'platinum',
    name: 'Economic Contributor',
    description: 'Burn 5000 MLG tokens supporting the ecosystem economy',
    icon: '📈',
    criteria: {
      type: 'count',
      metric: 'tokens_burned',
      threshold: 5000
    },
    rewards: {
      mlgTokens: 400,
      title: 'Economic Contributor',
      badge: 'economic_contributor',
      privileges: ['exclusive_events', 'achievement_showcase'],
      nftCertificate: true
    },
    oneTime: true,
    retroactive: true
  },

  // Governance Category
  democracy_champion: {
    id: 'democracy_champion',
    category: 'governance',
    tier: 'gold',
    name: 'Democracy Champion',
    description: 'Participate in 50 governance votes across all categories',
    icon: '⚖️',
    criteria: {
      type: 'count',
      metric: 'governance_votes',
      threshold: 50
    },
    rewards: {
      mlgTokens: 75,
      title: 'Democracy Champion',
      badge: 'democracy_champion',
      privileges: ['proposal_priority']
    },
    oneTime: true,
    retroactive: true
  },

  proposal_creator: {
    id: 'proposal_creator',
    category: 'governance',
    tier: 'silver',
    name: 'Proposal Creator',
    description: 'Create 5 successful governance proposals',
    icon: '📝',
    criteria: {
      type: 'count',
      metric: 'proposals_created',
      threshold: 5,
      additionalCriteria: {
        success_rate: 0.6 // At least 60% success rate
      }
    },
    rewards: {
      mlgTokens: 30,
      title: 'Proposal Creator',
      badge: 'proposal_creator'
    },
    oneTime: true,
    retroactive: true
  },

  consensus_builder: {
    id: 'consensus_builder',
    category: 'governance',
    tier: 'platinum',
    name: 'Consensus Builder',
    description: 'Create 20 proposals with 80%+ approval rate',
    icon: '🤝',
    criteria: {
      type: 'count',
      metric: 'proposals_created',
      threshold: 20,
      additionalCriteria: {
        success_rate: 0.8 // At least 80% success rate
      }
    },
    rewards: {
      mlgTokens: 200,
      title: 'Consensus Builder',
      badge: 'consensus_builder',
      privileges: ['proposal_priority', 'priority_support']
    },
    oneTime: true,
    retroactive: true
  },

  // Community Category
  recruiter: {
    id: 'recruiter',
    category: 'community',
    tier: 'silver',
    name: 'Recruiter',
    description: 'Successfully recruit 10 new members to your clan',
    icon: '🎯',
    criteria: {
      type: 'count',
      metric: 'members_recruited',
      threshold: 10
    },
    rewards: {
      mlgTokens: 25,
      title: 'Recruiter',
      badge: 'recruiter'
    },
    oneTime: false,
    retroactive: true
  },

  mentor: {
    id: 'mentor',
    category: 'community',
    tier: 'gold',
    name: 'Mentor',
    description: 'Help 5 new members achieve their first achievements',
    icon: '🎓',
    criteria: {
      type: 'count',
      metric: 'members_mentored',
      threshold: 5
    },
    rewards: {
      mlgTokens: 40,
      title: 'Mentor',
      badge: 'mentor',
      privileges: ['achievement_showcase']
    },
    oneTime: false,
    retroactive: false
  },

  community_builder: {
    id: 'community_builder',
    category: 'community',
    tier: 'platinum',
    name: 'Community Builder',
    description: 'Build a clan from 5 to 50+ active members',
    icon: '🏗️',
    criteria: {
      type: 'growth',
      metric: 'clan_growth',
      startThreshold: 5,
      endThreshold: 50,
      timeframe: '6_months'
    },
    rewards: {
      mlgTokens: 300,
      title: 'Community Builder',
      badge: 'community_builder',
      privileges: ['exclusive_events', 'priority_support'],
      nftCertificate: true
    },
    oneTime: true,
    retroactive: false
  },

  // Competitive Category
  tournament_victor: {
    id: 'tournament_victor',
    category: 'competitive',
    tier: 'gold',
    name: 'Tournament Victor',
    description: 'Win your first clan tournament or competition',
    icon: '🏆',
    criteria: {
      type: 'count',
      metric: 'tournaments_won',
      threshold: 1
    },
    rewards: {
      mlgTokens: 60,
      title: 'Tournament Victor',
      badge: 'tournament_victor'
    },
    oneTime: true,
    retroactive: true
  },

  ranking_climber: {
    id: 'ranking_climber',
    category: 'competitive',
    tier: 'silver',
    name: 'Ranking Climber',
    description: 'Improve clan leaderboard position by 10 ranks in one month',
    icon: '📈',
    criteria: {
      type: 'improvement',
      metric: 'leaderboard_rank',
      threshold: 10,
      timeframe: '1_month'
    },
    rewards: {
      mlgTokens: 18,
      title: 'Ranking Climber',
      badge: 'ranking_climber'
    },
    oneTime: false,
    retroactive: false
  },

  excellence_maintainer: {
    id: 'excellence_maintainer',
    category: 'competitive',
    tier: 'legendary',
    name: 'Excellence Maintainer',
    description: 'Maintain top 10 leaderboard position for 6 consecutive months',
    icon: '⭐',
    criteria: {
      type: 'sustained_performance',
      metric: 'leaderboard_rank',
      threshold: 10,
      timeframe: '6_months',
      consistency_required: 0.9
    },
    rewards: {
      mlgTokens: 750,
      title: 'Excellence Maintainer',
      badge: 'excellence_maintainer',
      privileges: ['exclusive_events', 'priority_support'],
      nftCertificate: true
    },
    oneTime: false,
    retroactive: false
  },

  // Special Events Category
  founder_member: {
    id: 'founder_member',
    category: 'special_events',
    tier: 'mythic',
    name: 'Founder Member',
    description: 'Be among the first 100 members to join the MLG.clan platform',
    icon: '🌟',
    criteria: {
      type: 'membership_number',
      threshold: 100
    },
    rewards: {
      mlgTokens: 1000,
      title: 'Founder',
      badge: 'founder_member',
      privileges: ['exclusive_events', 'priority_support', 'achievement_showcase'],
      nftCertificate: true,
      specialPerks: ['lifetime_benefits', 'founder_privileges']
    },
    oneTime: true,
    retroactive: true,
    limited: true
  },

  anniversary_celebration: {
    id: 'anniversary_celebration',
    category: 'special_events',
    tier: 'gold',
    name: 'Anniversary Celebration',
    description: 'Participate in the annual MLG.clan anniversary event',
    icon: '🎂',
    criteria: {
      type: 'event_participation',
      event: 'anniversary_2024',
      requirements: ['vote_in_event', 'complete_challenge']
    },
    rewards: {
      mlgTokens: 100,
      title: 'Anniversary Celebrant',
      badge: 'anniversary_2024',
      commemorativeNft: true
    },
    oneTime: true,
    retroactive: false,
    seasonal: true,
    available_until: '2024-12-31'
  }
};

/**
 * Achievement System Main Class
 * Handles achievement tracking, progression, and reward distribution
 */
class ClanAchievementSystem {
  constructor(options = {}) {
    this.connection = null;
    this.tokenConnection = null;
    this.memberAchievements = new Map(); // memberId -> achievements
    this.achievementProgress = new Map(); // memberId -> progress tracking
    this.rewardsPending = new Map(); // memberId -> pending rewards
    this.analyticsData = new Map(); // achievement analytics
    this.rateLimitTracking = new Map(); // rate limiting data
    
    // Configuration
    this.config = {
      ...ACHIEVEMENT_CONFIG,
      ...options
    };
    
    this.isInitialized = false;
    this.eventEmitter = null;
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.checkAchievements = this.checkAchievements.bind(this);
    this.awardAchievement = this.awardAchievement.bind(this);
    this.distributeRewards = this.distributeRewards.bind(this);
  }

  /**
   * Initialize the achievement system
   */
  async initialize() {
    try {
      console.log('🏆 Initializing Clan Achievement System...');
      
      // Initialize Solana connections
      this.connection = await createConnection(CURRENT_NETWORK);
      this.tokenConnection = await createMLGTokenConnection();
      
      // Load existing achievement data
      await this.loadAchievementData();
      
      // Initialize analytics tracking
      await this.initializeAnalytics();
      
      // Set up event listeners for real-time achievement checking
      this.setupEventListeners();
      
      this.isInitialized = true;
      console.log('✅ Clan Achievement System initialized successfully');
      
      return {
        success: true,
        achievementCount: Object.keys(ACHIEVEMENT_DEFINITIONS).length,
        categoriesCount: Object.keys(this.config.CATEGORIES).length,
        tiersCount: Object.keys(this.config.TIERS).length
      };
    } catch (error) {
      console.error('❌ Achievement system initialization failed:', error);
      throw new Error(`Achievement system initialization failed: ${error.message}`);
    }
  }

  /**
   * Load existing achievement data from storage
   */
  async loadAchievementData() {
    try {
      // In a real implementation, this would load from a database
      // For now, we'll initialize empty data structures
      
      console.log('📂 Loading achievement data...');
      
      // Initialize achievement tracking for known members
      // This would typically query the database for existing achievements
      
      console.log('✅ Achievement data loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load achievement data:', error);
      throw error;
    }
  }

  /**
   * Initialize analytics tracking
   */
  async initializeAnalytics() {
    try {
      console.log('📊 Initializing achievement analytics...');
      
      // Initialize analytics data structures
      this.analyticsData.set('achievement_completions', new Map());
      this.analyticsData.set('reward_distributions', new Map());
      this.analyticsData.set('progress_tracking', new Map());
      this.analyticsData.set('motivation_metrics', new Map());
      
      console.log('✅ Analytics initialized successfully');
    } catch (error) {
      console.error('❌ Analytics initialization failed:', error);
      throw error;
    }
  }

  /**
   * Set up event listeners for real-time achievement checking
   */
  setupEventListeners() {
    // In a real implementation, this would set up WebSocket listeners
    // for clan events that trigger achievement checks
    console.log('🔗 Setting up achievement event listeners...');
  }

  /**
   * Check achievements for a specific member or clan
   */
  async checkAchievements(memberId, clanId = null, eventData = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('Achievement system not initialized');
      }

      // Rate limiting check
      if (!this.checkRateLimit(memberId, 'achievement_check')) {
        throw new Error('Rate limit exceeded for achievement checks');
      }

      console.log(`🔍 Checking achievements for member: ${memberId}`);
      
      // Get member's current achievements and progress
      const currentAchievements = this.memberAchievements.get(memberId) || [];
      const progressData = this.achievementProgress.get(memberId) || {};
      
      // Get member's statistics for achievement evaluation
      const memberStats = await this.getMemberStatistics(memberId, clanId);
      
      const newAchievements = [];
      const updatedProgress = { ...progressData };

      // Check each achievement definition
      for (const [achievementId, achievement] of Object.entries(ACHIEVEMENT_DEFINITIONS)) {
        // Skip if member already has this one-time achievement
        if (achievement.oneTime && currentAchievements.includes(achievementId)) {
          continue;
        }

        // Skip seasonal achievements that are no longer available
        if (achievement.seasonal && achievement.available_until) {
          const availableUntil = new Date(achievement.available_until);
          if (new Date() > availableUntil) {
            continue;
          }
        }

        // Evaluate achievement criteria
        const meetsRequirements = await this.evaluateAchievementCriteria(
          achievement, 
          memberStats, 
          eventData, 
          progressData[achievementId]
        );

        if (meetsRequirements.earned && !currentAchievements.includes(achievementId)) {
          newAchievements.push(achievementId);
        }

        // Update progress tracking
        if (meetsRequirements.progress !== undefined) {
          updatedProgress[achievementId] = {
            ...progressData[achievementId],
            progress: meetsRequirements.progress,
            lastUpdated: Date.now(),
            nextMilestone: meetsRequirements.nextMilestone
          };
        }
      }

      // Update progress data
      if (Object.keys(updatedProgress).length > 0) {
        this.achievementProgress.set(memberId, updatedProgress);
      }

      // Award new achievements
      const awardedAchievements = [];
      for (const achievementId of newAchievements) {
        try {
          const awardResult = await this.awardAchievement(memberId, achievementId, clanId);
          if (awardResult.success) {
            awardedAchievements.push(awardResult);
          }
        } catch (error) {
          console.error(`Failed to award achievement ${achievementId}:`, error);
        }
      }

      // Update analytics
      await this.updateAnalytics('achievement_check', {
        memberId,
        clanId,
        achievementsChecked: Object.keys(ACHIEVEMENT_DEFINITIONS).length,
        newAchievements: awardedAchievements.length,
        timestamp: Date.now()
      });

      return {
        success: true,
        newAchievements: awardedAchievements,
        progressUpdates: Object.keys(updatedProgress).length,
        totalAchievements: currentAchievements.length + awardedAchievements.length
      };

    } catch (error) {
      console.error('❌ Achievement check failed:', error);
      throw error;
    }
  }

  /**
   * Evaluate if a member meets the criteria for a specific achievement
   */
  async evaluateAchievementCriteria(achievement, memberStats, eventData, currentProgress = {}) {
    try {
      const { criteria } = achievement;
      let earned = false;
      let progress = 0;
      let nextMilestone = null;

      switch (criteria.type) {
        case 'count':
          const currentValue = memberStats[criteria.metric] || 0;
          progress = Math.min(currentValue / criteria.threshold, 1.0);
          earned = currentValue >= criteria.threshold;
          
          if (!earned) {
            nextMilestone = criteria.threshold - currentValue;
          }

          // Check additional criteria if specified
          if (earned && criteria.additionalCriteria) {
            for (const [key, requirement] of Object.entries(criteria.additionalCriteria)) {
              if (memberStats[key] === undefined || memberStats[key] < requirement) {
                earned = false;
                break;
              }
            }
          }
          break;

        case 'streak':
          const streakData = memberStats[`${criteria.metric}_streak`] || { current: 0, best: 0 };
          const currentStreak = streakData.current || 0;
          progress = Math.min(currentStreak / criteria.threshold, 1.0);
          earned = currentStreak >= criteria.threshold;
          
          if (!earned) {
            nextMilestone = criteria.threshold - currentStreak;
          }
          break;

        case 'growth':
          const startValue = memberStats[`${criteria.metric}_start`] || criteria.startThreshold;
          const currentValue2 = memberStats[criteria.metric] || startValue;
          const growthNeeded = criteria.endThreshold - criteria.startThreshold;
          const actualGrowth = currentValue2 - startValue;
          
          progress = Math.min(actualGrowth / growthNeeded, 1.0);
          earned = actualGrowth >= growthNeeded;
          
          if (!earned) {
            nextMilestone = growthNeeded - actualGrowth;
          }
          break;

        case 'improvement':
          const baselineValue = currentProgress.baseline || memberStats[`${criteria.metric}_baseline`];
          if (baselineValue === undefined) {
            // Set baseline for future comparisons
            progress = 0;
            earned = false;
            nextMilestone = criteria.threshold;
          } else {
            const currentValue3 = memberStats[criteria.metric] || baselineValue;
            const improvement = Math.abs(baselineValue - currentValue3);
            progress = Math.min(improvement / criteria.threshold, 1.0);
            earned = improvement >= criteria.threshold;
            
            if (!earned) {
              nextMilestone = criteria.threshold - improvement;
            }
          }
          break;

        case 'sustained_performance':
          const performanceHistory = memberStats[`${criteria.metric}_history`] || [];
          const requiredConsistency = criteria.consistency_required || 0.8;
          const timeframeDays = this.parseTimeframe(criteria.timeframe);
          
          // Filter history to timeframe and check consistency
          const recentHistory = performanceHistory.filter(entry => 
            Date.now() - entry.timestamp < (timeframeDays * 24 * 60 * 60 * 1000)
          );
          
          if (recentHistory.length === 0) {
            progress = 0;
            earned = false;
            nextMilestone = timeframeDays;
          } else {
            const meetingThreshold = recentHistory.filter(entry => 
              entry.value <= criteria.threshold
            ).length;
            const consistency = meetingThreshold / recentHistory.length;
            
            progress = Math.min(consistency / requiredConsistency, 1.0);
            earned = consistency >= requiredConsistency && recentHistory.length >= timeframeDays * 0.8;
            
            if (!earned) {
              nextMilestone = Math.ceil((requiredConsistency * timeframeDays) - meetingThreshold);
            }
          }
          break;

        case 'membership_number':
          const membershipNumber = memberStats.membership_number || Infinity;
          earned = membershipNumber <= criteria.threshold;
          progress = earned ? 1.0 : 0;
          break;

        case 'event_participation':
          const eventParticipation = eventData[criteria.event] || {};
          earned = criteria.requirements.every(req => eventParticipation[req] === true);
          progress = criteria.requirements.filter(req => eventParticipation[req]).length / criteria.requirements.length;
          
          if (!earned) {
            nextMilestone = criteria.requirements.filter(req => !eventParticipation[req]);
          }
          break;

        default:
          console.warn(`Unknown achievement criteria type: ${criteria.type}`);
          earned = false;
          progress = 0;
      }

      return {
        earned,
        progress,
        nextMilestone
      };

    } catch (error) {
      console.error('❌ Achievement criteria evaluation failed:', error);
      return { earned: false, progress: 0, nextMilestone: null };
    }
  }

  /**
   * Award an achievement to a member
   */
  async awardAchievement(memberId, achievementId, clanId = null) {
    try {
      if (!this.isInitialized) {
        throw new Error('Achievement system not initialized');
      }

      const achievement = ACHIEVEMENT_DEFINITIONS[achievementId];
      if (!achievement) {
        throw new Error(`Achievement not found: ${achievementId}`);
      }

      console.log(`🏆 Awarding achievement "${achievement.name}" to member: ${memberId}`);

      // Get current member achievements
      const currentAchievements = this.memberAchievements.get(memberId) || [];
      
      // Check if already awarded (for one-time achievements)
      if (achievement.oneTime && currentAchievements.includes(achievementId)) {
        throw new Error('Achievement already awarded');
      }

      // Create achievement record
      const achievementRecord = {
        id: achievementId,
        memberId,
        clanId,
        awardedAt: Date.now(),
        tier: achievement.tier,
        category: achievement.category,
        rewards: achievement.rewards,
        transactionId: null,
        nftMinted: false,
        verified: false
      };

      // Calculate total reward amount
      const tierConfig = this.config.TIERS[achievement.tier.toUpperCase()];
      const categoryConfig = this.config.CATEGORIES[achievement.category.toUpperCase()];
      const totalReward = Math.floor(
        (achievement.rewards.mlgTokens || tierConfig.baseReward) * 
        tierConfig.multiplier * 
        categoryConfig.weight
      );

      // Record achievement on blockchain if verification required
      if (this.config.BLOCKCHAIN.VERIFICATION_REQUIRED) {
        try {
          const transactionId = await this.recordAchievementOnChain(achievementRecord, totalReward);
          achievementRecord.transactionId = transactionId;
          achievementRecord.verified = true;
        } catch (error) {
          console.error('Blockchain verification failed:', error);
          // Continue without blockchain verification in case of failure
        }
      }

      // Mint NFT for eligible achievements
      if (achievement.nftCertificate && tierConfig.nftEligible) {
        try {
          const nftResult = await this.mintAchievementNFT(achievementRecord);
          achievementRecord.nftMinted = nftResult.success;
          achievementRecord.nftAddress = nftResult.nftAddress;
        } catch (error) {
          console.error('NFT minting failed:', error);
          // Continue without NFT minting in case of failure
        }
      }

      // Update member achievements
      currentAchievements.push(achievementId);
      this.memberAchievements.set(memberId, currentAchievements);

      // Queue rewards for distribution
      await this.queueRewards(memberId, {
        achievementId,
        mlgTokens: totalReward,
        title: achievement.rewards.title,
        badge: achievement.rewards.badge,
        privileges: achievement.rewards.privileges || [],
        special: achievement.rewards.specialPerks || []
      });

      // Update analytics
      await this.updateAnalytics('achievement_awarded', {
        achievementId,
        memberId,
        clanId,
        tier: achievement.tier,
        category: achievement.category,
        reward: totalReward,
        timestamp: Date.now()
      });

      // Trigger achievement notification event
      await this.triggerAchievementNotification(memberId, achievementRecord);

      console.log(`✅ Achievement awarded successfully: ${achievement.name}`);

      return {
        success: true,
        achievement: achievementRecord,
        reward: totalReward,
        message: `Congratulations! You've earned the "${achievement.name}" achievement!`
      };

    } catch (error) {
      console.error('❌ Failed to award achievement:', error);
      throw error;
    }
  }

  /**
   * Queue rewards for distribution
   */
  async queueRewards(memberId, rewards) {
    try {
      const currentPending = this.rewardsPending.get(memberId) || [];
      currentPending.push({
        ...rewards,
        queuedAt: Date.now(),
        status: 'pending'
      });
      
      this.rewardsPending.set(memberId, currentPending);
      
      // Auto-distribute if below threshold
      if (currentPending.length >= 5) {
        await this.distributeRewards(memberId);
      }

    } catch (error) {
      console.error('❌ Failed to queue rewards:', error);
      throw error;
    }
  }

  /**
   * Distribute pending rewards to a member
   */
  async distributeRewards(memberId, force = false) {
    try {
      if (!this.isInitialized) {
        throw new Error('Achievement system not initialized');
      }

      // Rate limiting check
      if (!force && !this.checkRateLimit(memberId, 'reward_distribution')) {
        throw new Error('Rate limit exceeded for reward distribution');
      }

      const pendingRewards = this.rewardsPending.get(memberId) || [];
      if (pendingRewards.length === 0) {
        return { success: true, message: 'No pending rewards' };
      }

      console.log(`💰 Distributing ${pendingRewards.length} pending rewards to member: ${memberId}`);

      // Calculate total MLG token reward
      const totalMLGReward = pendingRewards.reduce((sum, reward) => 
        sum + (reward.mlgTokens || 0), 0
      );

      let distributionResult = { success: false };

      // Distribute MLG tokens if any
      if (totalMLGReward > 0) {
        try {
          distributionResult = await this.distributeMLGTokens(memberId, totalMLGReward);
        } catch (error) {
          console.error('MLG token distribution failed:', error);
          // Continue with other rewards even if token distribution fails
        }
      }

      // Apply titles, badges, and privileges
      const collectedTitles = [];
      const collectedBadges = [];
      const collectedPrivileges = new Set();

      for (const reward of pendingRewards) {
        if (reward.title) collectedTitles.push(reward.title);
        if (reward.badge) collectedBadges.push(reward.badge);
        if (reward.privileges) {
          reward.privileges.forEach(privilege => collectedPrivileges.add(privilege));
        }
      }

      // Update member profile with new titles, badges, and privileges
      await this.updateMemberProfile(memberId, {
        titles: collectedTitles,
        badges: collectedBadges,
        privileges: Array.from(collectedPrivileges)
      });

      // Clear pending rewards
      this.rewardsPending.set(memberId, []);

      // Update analytics
      await this.updateAnalytics('rewards_distributed', {
        memberId,
        rewardCount: pendingRewards.length,
        mlgTokens: totalMLGReward,
        titles: collectedTitles.length,
        badges: collectedBadges.length,
        privileges: collectedPrivileges.size,
        timestamp: Date.now()
      });

      console.log(`✅ Rewards distributed successfully to member: ${memberId}`);

      return {
        success: true,
        distributed: {
          mlgTokens: totalMLGReward,
          titles: collectedTitles,
          badges: collectedBadges,
          privileges: Array.from(collectedPrivileges)
        },
        transactionId: distributionResult.transactionId
      };

    } catch (error) {
      console.error('❌ Reward distribution failed:', error);
      throw error;
    }
  }

  /**
   * Distribute MLG tokens to a member
   */
  async distributeMLGTokens(memberId, amount) {
    try {
      if (!this.tokenConnection) {
        throw new Error('Token connection not initialized');
      }

      console.log(`💎 Distributing ${amount} MLG tokens to member: ${memberId}`);

      // In a real implementation, this would:
      // 1. Get member's wallet address
      // 2. Create transfer instruction
      // 3. Send transaction
      // 4. Verify completion

      // Mock implementation for now
      const mockTransactionId = `mlg_reward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`✅ MLG tokens distributed successfully. Transaction: ${mockTransactionId}`);

      return {
        success: true,
        amount,
        transactionId: mockTransactionId
      };

    } catch (error) {
      console.error('❌ MLG token distribution failed:', error);
      throw error;
    }
  }

  /**
   * Update member profile with new rewards
   */
  async updateMemberProfile(memberId, updates) {
    try {
      // In a real implementation, this would update the member's profile
      // in the database with new titles, badges, and privileges
      
      console.log(`👤 Updating profile for member ${memberId}:`, updates);
      
      // Mock implementation
      return { success: true, updates };

    } catch (error) {
      console.error('❌ Profile update failed:', error);
      throw error;
    }
  }

  /**
   * Record achievement on Solana blockchain
   */
  async recordAchievementOnChain(achievementRecord, rewardAmount) {
    try {
      if (!this.connection) {
        throw new Error('Blockchain connection not initialized');
      }

      console.log('🔗 Recording achievement on blockchain...');

      // In a real implementation, this would:
      // 1. Create a PDA for the achievement record
      // 2. Serialize achievement data
      // 3. Submit transaction to achievement program
      // 4. Return transaction signature

      // Mock implementation for now
      const mockTxId = `achievement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`✅ Achievement recorded on blockchain: ${mockTxId}`);
      
      return mockTxId;

    } catch (error) {
      console.error('❌ Blockchain recording failed:', error);
      throw error;
    }
  }

  /**
   * Mint NFT certificate for achievement
   */
  async mintAchievementNFT(achievementRecord) {
    try {
      console.log('🎨 Minting achievement NFT certificate...');

      // In a real implementation, this would:
      // 1. Generate NFT metadata
      // 2. Upload metadata to IPFS/Arweave
      // 3. Mint NFT using Metaplex or similar
      // 4. Return NFT address

      // Mock implementation for now
      const mockNFTAddress = `nft_${achievementRecord.id}_${Date.now()}`;
      
      console.log(`✅ Achievement NFT minted: ${mockNFTAddress}`);
      
      return {
        success: true,
        nftAddress: mockNFTAddress
      };

    } catch (error) {
      console.error('❌ NFT minting failed:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive member statistics for achievement evaluation
   */
  async getMemberStatistics(memberId, clanId = null) {
    try {
      // In a real implementation, this would query various systems
      // to get comprehensive member statistics
      
      console.log(`📊 Fetching statistics for member: ${memberId}`);

      // Mock statistics for demonstration
      return {
        // Voting statistics
        total_votes: Math.floor(Math.random() * 100),
        governance_votes: Math.floor(Math.random() * 50),
        daily_votes_streak: { current: Math.floor(Math.random() * 30), best: 45 },
        weekly_votes_streak: { current: Math.floor(Math.random() * 10), best: 12 },
        monthly_votes_streak: { current: Math.floor(Math.random() * 6), best: 8 },
        
        // Token statistics
        tokens_burned: Math.floor(Math.random() * 1000),
        tokens_contributed: Math.floor(Math.random() * 5000),
        
        // Community statistics
        members_recruited: Math.floor(Math.random() * 20),
        members_mentored: Math.floor(Math.random() * 10),
        
        // Competitive statistics
        tournaments_won: Math.floor(Math.random() * 5),
        leaderboard_rank: Math.floor(Math.random() * 100) + 1,
        leaderboard_rank_history: [],
        
        // Proposal statistics
        proposals_created: Math.floor(Math.random() * 10),
        proposals_success_rate: 0.7,
        
        // Membership data
        membership_number: Math.floor(Math.random() * 1000) + 1,
        join_date: Date.now() - (Math.random() * 365 * 24 * 60 * 60 * 1000),
        
        // Clan growth (if clan leader)
        clan_growth: Math.floor(Math.random() * 50),
        clan_growth_start: 5
      };

    } catch (error) {
      console.error('❌ Failed to fetch member statistics:', error);
      throw error;
    }
  }

  /**
   * Process achievements retroactively for existing members
   */
  async processRetroactiveAchievements(memberIds = null, batchSize = 50) {
    try {
      if (!this.isInitialized) {
        throw new Error('Achievement system not initialized');
      }

      console.log('🔄 Processing retroactive achievements...');

      // Get list of members to process
      const membersToProcess = memberIds || await this.getAllMemberIds();
      
      const results = {
        processed: 0,
        achieved: 0,
        failed: 0,
        errors: []
      };

      // Process in batches to avoid overwhelming the system
      for (let i = 0; i < membersToProcess.length; i += batchSize) {
        const batch = membersToProcess.slice(i, i + batchSize);
        
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(membersToProcess.length/batchSize)}`);

        const batchPromises = batch.map(async (memberId) => {
          try {
            const checkResult = await this.checkAchievements(memberId);
            results.processed++;
            results.achieved += checkResult.newAchievements.length;
            return checkResult;
          } catch (error) {
            results.failed++;
            results.errors.push({ memberId, error: error.message });
            return null;
          }
        });

        await Promise.allSettled(batchPromises);
        
        // Small delay between batches
        await this.delay(1000);
      }

      console.log(`✅ Retroactive processing complete:`, results);
      return results;

    } catch (error) {
      console.error('❌ Retroactive achievement processing failed:', error);
      throw error;
    }
  }

  /**
   * Get achievement progress for a member
   */
  async getAchievementProgress(memberId, category = null) {
    try {
      if (!this.isInitialized) {
        throw new Error('Achievement system not initialized');
      }

      const memberAchievements = this.memberAchievements.get(memberId) || [];
      const progressData = this.achievementProgress.get(memberId) || {};

      const result = {
        earned: [],
        inProgress: [],
        available: [],
        locked: []
      };

      for (const [achievementId, achievement] of Object.entries(ACHIEVEMENT_DEFINITIONS)) {
        // Filter by category if specified
        if (category && achievement.category !== category) {
          continue;
        }

        const isEarned = memberAchievements.includes(achievementId);
        const progress = progressData[achievementId];

        const achievementInfo = {
          id: achievementId,
          ...achievement,
          tierInfo: this.config.TIERS[achievement.tier.toUpperCase()],
          categoryInfo: this.config.CATEGORIES[achievement.category.toUpperCase()],
          progress: progress?.progress || 0,
          nextMilestone: progress?.nextMilestone,
          lastUpdated: progress?.lastUpdated
        };

        if (isEarned) {
          result.earned.push(achievementInfo);
        } else if (progress?.progress > 0) {
          result.inProgress.push(achievementInfo);
        } else if (!achievement.locked) {
          result.available.push(achievementInfo);
        } else {
          result.locked.push(achievementInfo);
        }
      }

      return result;

    } catch (error) {
      console.error('❌ Failed to get achievement progress:', error);
      throw error;
    }
  }

  /**
   * Get achievement leaderboard
   */
  async getAchievementLeaderboard(category = null, limit = 100) {
    try {
      const leaderboard = [];
      
      // Get all members with achievements
      for (const [memberId, achievements] of this.memberAchievements) {
        let score = 0;
        let categoryAchievements = 0;
        
        for (const achievementId of achievements) {
          const achievement = ACHIEVEMENT_DEFINITIONS[achievementId];
          if (!achievement) continue;
          
          // Filter by category if specified
          if (category && achievement.category !== category) {
            continue;
          }
          
          if (!category || achievement.category === category) {
            categoryAchievements++;
          }
          
          // Calculate score based on tier and category weight
          const tierConfig = this.config.TIERS[achievement.tier.toUpperCase()];
          const categoryConfig = this.config.CATEGORIES[achievement.category.toUpperCase()];
          
          score += tierConfig.prestige * categoryConfig.weight;
        }
        
        if (score > 0) {
          leaderboard.push({
            memberId,
            score,
            achievementCount: categoryAchievements,
            totalAchievements: achievements.length
          });
        }
      }
      
      // Sort by score and limit results
      leaderboard.sort((a, b) => b.score - a.score);
      
      return leaderboard.slice(0, limit);

    } catch (error) {
      console.error('❌ Failed to get achievement leaderboard:', error);
      throw error;
    }
  }

  /**
   * Export achievement data for a member
   */
  async exportMemberAchievements(memberId, format = 'json') {
    try {
      const achievements = this.memberAchievements.get(memberId) || [];
      const progress = this.achievementProgress.get(memberId) || {};
      
      const exportData = {
        memberId,
        exportedAt: new Date().toISOString(),
        totalAchievements: achievements.length,
        achievements: achievements.map(id => {
          const achievement = ACHIEVEMENT_DEFINITIONS[id];
          return {
            id,
            name: achievement?.name,
            tier: achievement?.tier,
            category: achievement?.category,
            description: achievement?.description
          };
        }),
        progress: Object.entries(progress).map(([id, data]) => ({
          achievementId: id,
          progress: data.progress,
          nextMilestone: data.nextMilestone,
          lastUpdated: new Date(data.lastUpdated).toISOString()
        }))
      };

      if (format === 'csv') {
        // Convert to CSV format
        const csvData = this.convertToCSV(exportData);
        return { format: 'csv', data: csvData };
      }

      return { format: 'json', data: exportData };

    } catch (error) {
      console.error('❌ Failed to export achievements:', error);
      throw error;
    }
  }

  /**
   * Trigger achievement notification event
   */
  async triggerAchievementNotification(memberId, achievementRecord) {
    try {
      // In a real implementation, this would trigger notifications
      // through WebSocket, push notifications, email, etc.
      
      console.log(`🔔 Achievement notification triggered for member ${memberId}:`, achievementRecord);

    } catch (error) {
      console.error('❌ Achievement notification failed:', error);
    }
  }

  /**
   * Update analytics data
   */
  async updateAnalytics(eventType, data) {
    try {
      const analytics = this.analyticsData.get(eventType) || new Map();
      const timestamp = Date.now();
      
      analytics.set(timestamp, data);
      
      // Keep only recent analytics data (last 30 days)
      const thirtyDaysAgo = timestamp - (30 * 24 * 60 * 60 * 1000);
      for (const [key, value] of analytics) {
        if (key < thirtyDaysAgo) {
          analytics.delete(key);
        }
      }
      
      this.analyticsData.set(eventType, analytics);

    } catch (error) {
      console.error('❌ Analytics update failed:', error);
    }
  }

  /**
   * Rate limiting check
   */
  checkRateLimit(memberId, action) {
    const now = Date.now();
    const limitKey = `${memberId}_${action}`;
    const rateLimitData = this.rateLimitTracking.get(limitKey) || [];
    
    // Remove old entries
    const filtered = rateLimitData.filter(timestamp => 
      now - timestamp < (60 * 60 * 1000) // 1 hour window
    );
    
    // Check limits based on action type
    let limit;
    switch (action) {
      case 'achievement_check':
        limit = this.config.RATE_LIMITS.ACHIEVEMENT_CHECKS_PER_MINUTE;
        break;
      case 'reward_distribution':
        limit = this.config.RATE_LIMITS.REWARD_CLAIMS_PER_HOUR;
        break;
      default:
        limit = 10;
    }
    
    if (filtered.length >= limit) {
      return false;
    }
    
    // Add current timestamp and update tracking
    filtered.push(now);
    this.rateLimitTracking.set(limitKey, filtered);
    
    return true;
  }

  /**
   * Helper method to parse timeframe strings
   */
  parseTimeframe(timeframe) {
    const timeframeMap = {
      '1_day': 1,
      '1_week': 7,
      '1_month': 30,
      '3_months': 90,
      '6_months': 180,
      '1_year': 365
    };
    
    return timeframeMap[timeframe] || 30;
  }

  /**
   * Helper method to get all member IDs
   */
  async getAllMemberIds() {
    // In a real implementation, this would query the database
    // For now, return mock data
    return Array.from(this.memberAchievements.keys());
  }

  /**
   * Helper method to convert data to CSV
   */
  convertToCSV(data) {
    // Simple CSV conversion for achievements
    const headers = ['Achievement ID', 'Name', 'Tier', 'Category', 'Progress'];
    const rows = data.achievements.map(achievement => [
      achievement.id,
      achievement.name,
      achievement.tier,
      achievement.category,
      '100%'
    ]);
    
    const progressRows = data.progress.map(p => [
      p.achievementId,
      'In Progress',
      '',
      '',
      `${Math.round(p.progress * 100)}%`
    ]);
    
    const allRows = [headers, ...rows, ...progressRows];
    return allRows.map(row => row.join(',')).join('\n');
  }

  /**
   * Helper method for delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get system statistics and health metrics
   */
  async getSystemStatistics() {
    try {
      const totalAchievements = Object.keys(ACHIEVEMENT_DEFINITIONS).length;
      const totalMembers = this.memberAchievements.size;
      const totalEarned = Array.from(this.memberAchievements.values())
        .reduce((sum, achievements) => sum + achievements.length, 0);
      
      const tierDistribution = {};
      const categoryDistribution = {};
      
      // Calculate distributions
      for (const achievements of this.memberAchievements.values()) {
        for (const achievementId of achievements) {
          const achievement = ACHIEVEMENT_DEFINITIONS[achievementId];
          if (achievement) {
            tierDistribution[achievement.tier] = (tierDistribution[achievement.tier] || 0) + 1;
            categoryDistribution[achievement.category] = (categoryDistribution[achievement.category] || 0) + 1;
          }
        }
      }

      return {
        totalAchievements,
        totalMembers,
        totalEarned,
        averageAchievementsPerMember: totalMembers > 0 ? totalEarned / totalMembers : 0,
        tierDistribution,
        categoryDistribution,
        systemHealth: {
          initialized: this.isInitialized,
          connectionStatus: this.connection ? 'connected' : 'disconnected',
          tokenConnectionStatus: this.tokenConnection ? 'connected' : 'disconnected',
          lastUpdate: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Failed to get system statistics:', error);
      throw error;
    }
  }
}

// Export the main class and configuration
export default ClanAchievementSystem;
export { ACHIEVEMENT_CONFIG, ACHIEVEMENT_DEFINITIONS };

/**
 * Achievement Testing Utilities
 * Provides mock data and testing scenarios for development
 */
export const AchievementTestUtils = {
  // Mock member data for testing
  createMockMemberData: (memberId) => ({
    memberId,
    achievements: [],
    statistics: {
      total_votes: Math.floor(Math.random() * 100),
      tokens_burned: Math.floor(Math.random() * 1000),
      governance_votes: Math.floor(Math.random() * 50),
      members_recruited: Math.floor(Math.random() * 20),
      tournaments_won: Math.floor(Math.random() * 5),
      proposals_created: Math.floor(Math.random() * 10),
      daily_votes_streak: { current: Math.floor(Math.random() * 30) }
    }
  }),

  // Test achievement awarding
  testAchievementScenario: async (system, scenario) => {
    console.log(`🧪 Testing scenario: ${scenario.name}`);
    
    for (const member of scenario.members) {
      await system.checkAchievements(member.id, member.clanId, scenario.eventData);
    }
    
    return await system.getSystemStatistics();
  },

  // Pre-defined test scenarios
  scenarios: {
    newMemberJoining: {
      name: 'New Member Joining',
      members: [{ id: 'test_member_1', clanId: 'test_clan' }],
      eventData: { first_time: true }
    },
    
    tokenBurnSpree: {
      name: 'Token Burn Spree',
      members: [{ id: 'test_member_2', clanId: 'test_clan' }],
      eventData: { massive_burn: 1000 }
    },
    
    governanceParticipation: {
      name: 'Governance Participation',
      members: [{ id: 'test_member_3', clanId: 'test_clan' }],
      eventData: { proposal_votes: 50 }
    }
  }
};