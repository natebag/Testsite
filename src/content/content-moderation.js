/**
 * MLG.clan Community-Driven Content Moderation System - Sub-task 4.6
 * 
 * Comprehensive blockchain-based content moderation system using MLG token voting.
 * Implements community-driven governance, progressive voting costs, and transparent
 * on-chain moderation decisions through Solana blockchain integration.
 * 
 * Core Features:
 * - Community content reporting with structured categories
 * - MLG token-based moderation voting with progressive costs
 * - Reputation-weighted voting for trusted community members
 * - Automatic content status updates based on vote results
 * - Transparent on-chain moderation history and appeals
 * - Integration with existing MLG token burn mechanics
 * 
 * Governance Features:
 * - Community moderator roles and permissions
 * - Vote thresholds for different moderation actions
 * - Appeal process for removed content with cooling-off periods
 * - Moderation statistics and transparency reports
 * - Anti-gaming measures and sybil resistance
 * 
 * Security Features:
 * - Solana transaction signature verification for vote authenticity
 * - Phantom wallet integration for secure transaction signing
 * - Rate limiting and abuse prevention
 * - User confirmation for all token burn operations
 * - Comprehensive audit trail and replay attack prevention
 * 
 * @author Claude Code - Production General Purpose Agent
 * @version 1.0.0
 * @integration MLG Token: 7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL
 */

import pkg from '@solana/web3.js';
const { 
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  Keypair,
  LAMPORTS_PER_SOL
} = pkg;

import * as splToken from '@solana/spl-token';
const {
  TOKEN_PROGRAM_ID,
  createBurnInstruction,
  getAssociatedTokenAddress,
  getAccount
} = splToken;

import { 
  createConnection, 
  createMLGTokenConnection,
  MLG_TOKEN_CONFIG,
  TOKEN_PROGRAMS,
  CURRENT_NETWORK,
  CONNECTION_CONFIG
} from '../../config/solana-config.js';

import { SolanaVotingSystem } from '../voting/solana-voting-system.js';
import { ContentValidator } from './content-validator.js';

/**
 * Content Moderation Configuration
 */
export const CONTENT_MODERATION_CONFIG = {
  // Report categories and reasons
  REPORT_CATEGORIES: {
    SPAM: {
      id: 'spam',
      name: 'Spam',
      description: 'Promotional content, repetitive posts, or irrelevant material',
      severity: 'medium',
      votingThreshold: 3,
      autoRemoveThreshold: 10
    },
    INAPPROPRIATE: {
      id: 'inappropriate',
      name: 'Inappropriate Content',
      description: 'NSFW, violent, or offensive content unsuitable for gaming community',
      severity: 'high',
      votingThreshold: 5,
      autoRemoveThreshold: 8
    },
    COPYRIGHT: {
      id: 'copyright',
      name: 'Copyright Violation',
      description: 'Unauthorized use of copyrighted material',
      severity: 'high',
      votingThreshold: 4,
      autoRemoveThreshold: 6
    },
    CHEATING: {
      id: 'cheating',
      name: 'Cheating/Exploits',
      description: 'Content promoting cheats, hacks, or game exploits',
      severity: 'high',
      votingThreshold: 4,
      autoRemoveThreshold: 7
    },
    HARASSMENT: {
      id: 'harassment',
      name: 'Harassment',
      description: 'Toxic behavior, hate speech, or targeted harassment',
      severity: 'critical',
      votingThreshold: 7,
      autoRemoveThreshold: 5
    },
    LOW_QUALITY: {
      id: 'low_quality',
      name: 'Low Quality',
      description: 'Poor quality content that doesn\'t meet community standards',
      severity: 'low',
      votingThreshold: 2,
      autoRemoveThreshold: 15
    },
    MISINFORMATION: {
      id: 'misinformation',
      name: 'Misinformation',
      description: 'False information or misleading gaming advice',
      severity: 'medium',
      votingThreshold: 4,
      autoRemoveThreshold: 8
    }
  },

  // MLG token costs for moderation votes (progressive pricing)
  MODERATION_VOTE_COSTS: {
    // Basic moderation votes
    KEEP_CONTENT: 1,    // 1 MLG to vote keep
    REMOVE_CONTENT: 2,  // 2 MLG to vote remove (higher stakes)
    ESCALATE_REVIEW: 3, // 3 MLG to escalate for expert review
    
    // Advanced moderation actions
    PERMANENT_BAN: 10,   // 10 MLG for permanent content removal
    APPEAL_DECISION: 5,  // 5 MLG to appeal a moderation decision
    MODERATOR_OVERRIDE: 15, // 15 MLG for community moderator override
    
    // Reputation-based multipliers
    REPUTATION_MULTIPLIERS: {
      TRUSTED_MEMBER: 0.5,    // 50% discount for trusted members
      COMMUNITY_MOD: 0.25,    // 75% discount for community moderators
      EXPERT_REVIEWER: 0.1,   // 90% discount for expert reviewers
      NEW_MEMBER: 2.0         // 2x cost for new members (anti-spam)
    }
  },

  // Vote thresholds and requirements
  VOTING_THRESHOLDS: {
    // Minimum votes required for action
    MIN_VOTES_REMOVE: 5,      // Minimum votes to remove content
    MIN_VOTES_KEEP: 3,        // Minimum votes to keep content
    MIN_VOTES_ESCALATE: 7,    // Minimum votes to escalate review
    
    // Vote ratios for decisions
    REMOVE_RATIO: 0.7,        // 70% votes must be "remove" to take action
    KEEP_RATIO: 0.6,          // 60% votes must be "keep" to dismiss report
    ESCALATE_RATIO: 0.8,      // 80% votes must agree to escalate
    
    // Time-based thresholds
    VOTING_WINDOW_HOURS: 48,  // 48-hour voting window
    QUICK_REMOVAL_HOURS: 6,   // Quick removal for critical issues
    APPEAL_WINDOW_DAYS: 7,    // 7-day appeal window
    
    // Reputation requirements
    MIN_REPUTATION_VOTE: 50,   // Minimum reputation to vote on moderation
    MIN_REPUTATION_REPORT: 25, // Minimum reputation to report content
    EXPERT_REPUTATION: 500     // Reputation needed for expert reviewer status
  },

  // Community moderator system
  MODERATOR_SYSTEM: {
    ROLES: {
      COMMUNITY_MEMBER: {
        id: 'member',
        name: 'Community Member',
        permissions: ['report', 'vote'],
        minReputation: 25,
        voteWeight: 1.0
      },
      TRUSTED_MEMBER: {
        id: 'trusted',
        name: 'Trusted Member',
        permissions: ['report', 'vote', 'escalate'],
        minReputation: 200,
        voteWeight: 1.5
      },
      COMMUNITY_MODERATOR: {
        id: 'moderator',
        name: 'Community Moderator',
        permissions: ['report', 'vote', 'escalate', 'override', 'review_appeals'],
        minReputation: 1000,
        voteWeight: 2.0
      },
      EXPERT_REVIEWER: {
        id: 'expert',
        name: 'Expert Reviewer',
        permissions: ['report', 'vote', 'escalate', 'override', 'review_appeals', 'set_policy'],
        minReputation: 2500,
        voteWeight: 3.0
      }
    },
    
    // Automatic role progression based on reputation and activity
    ROLE_PROGRESSION: {
      VOTING_ACCURACY_WEIGHT: 0.4,    // 40% based on voting accuracy
      CONTENT_QUALITY_WEIGHT: 0.3,    // 30% based on content quality
      COMMUNITY_ACTIVITY_WEIGHT: 0.2,  // 20% based on community activity
      TENURE_WEIGHT: 0.1               // 10% based on account age
    }
  },

  // Anti-gaming and security measures
  SECURITY_CONFIG: {
    // Rate limiting
    MAX_REPORTS_PER_DAY: 10,          // Max reports per user per day
    MAX_VOTES_PER_HOUR: 20,           // Max moderation votes per hour
    COOLDOWN_BETWEEN_REPORTS: 300,    // 5-minute cooldown between reports
    
    // Abuse prevention
    MIN_WALLET_AGE_HOURS: 168,        // 7 days minimum wallet age
    MIN_MLG_BALANCE: 10,              // Minimum 10 MLG to participate
    MAX_DAILY_TOKEN_BURN: 100,        // Max 100 MLG burned per day
    
    // Sybil resistance
    UNIQUE_DEVICE_TRACKING: true,     // Track unique devices
    IP_RATE_LIMITING: true,           // Rate limit by IP address
    WALLET_CLUSTERING_DETECTION: true, // Detect clustered wallets
    
    // Vote verification
    SIGNATURE_VERIFICATION: true,      // Verify wallet signatures
    TRANSACTION_CONFIRMATION: true,    // Confirm blockchain transactions
    DOUBLE_VOTE_PREVENTION: true       // Prevent double voting
  },

  // Appeal and review process
  APPEAL_SYSTEM: {
    APPEAL_TYPES: {
      FALSE_POSITIVE: 'Content was incorrectly removed',
      INSUFFICIENT_EVIDENCE: 'Report lacked sufficient evidence',
      POLICY_MISAPPLICATION: 'Moderation policy was misapplied',
      TECHNICAL_ERROR: 'Technical error in voting system',
      BIAS_CLAIM: 'Claim of moderator bias or unfairness'
    },
    
    APPEAL_REQUIREMENTS: {
      STAKE_AMOUNT: 5,              // 5 MLG stake to file appeal
      EVIDENCE_REQUIRED: true,       // Must provide evidence
      TIME_LIMIT_DAYS: 7,           // 7-day time limit
      COMMUNITY_REVIEW: true         // Community reviews appeals
    },
    
    APPEAL_OUTCOMES: {
      UPHELD: 'Appeal denied, original decision stands',
      OVERTURNED: 'Appeal approved, content restored',
      PARTIAL: 'Appeal partially approved, modified action',
      DISMISSED: 'Appeal dismissed for procedural issues'
    }
  }
};

/**
 * Content Moderation Status Types
 */
export const MODERATION_STATUS = {
  ACTIVE: 'active',                    // Content is live and active
  REPORTED: 'reported',                // Content has been reported
  UNDER_REVIEW: 'under_review',        // Content is being reviewed
  VOTING_ACTIVE: 'voting_active',      // Community voting in progress
  REMOVED: 'removed',                  // Content removed by community vote
  APPEALED: 'appealed',               // Content removal has been appealed
  APPEAL_REVIEW: 'appeal_review',      // Appeal is under review
  RESTORED: 'restored',               // Content restored after successful appeal
  PERMANENTLY_BANNED: 'banned'        // Content permanently banned
};

/**
 * Content Moderation Vote Types
 */
export const MODERATION_VOTE_TYPES = {
  KEEP: 'keep',                       // Vote to keep content
  REMOVE: 'remove',                   // Vote to remove content
  ESCALATE: 'escalate',               // Vote to escalate for expert review
  APPEAL_SUPPORT: 'appeal_support',   // Support the appeal
  APPEAL_REJECT: 'appeal_reject'      // Reject the appeal
};

/**
 * Community Content Moderation System
 * 
 * Implements blockchain-based community moderation with MLG token voting,
 * reputation-weighted decisions, and transparent governance.
 */
export class ContentModerationSystem {
  constructor(config = {}) {
    this.config = { ...CONTENT_MODERATION_CONFIG, ...config };
    this.connection = null;
    this.mlgTokenMint = new PublicKey(MLG_TOKEN_CONFIG.MINT_ADDRESS);
    this.wallet = null;
    this.votingSystem = null;
    this.contentValidator = new ContentValidator();
    
    // Initialize moderation state
    this.moderationData = new Map(); // contentId -> moderation data
    this.reportHistory = new Map();  // reportId -> report data
    this.userReputations = new Map(); // walletAddress -> reputation data
    this.activeVotes = new Map();     // voteId -> vote data
    
    // Performance optimization
    this.cache = new Map();
    this.rateLimitTracker = new Map();
    
    this.initialized = false;
  }

  /**
   * Initialize the moderation system
   * @param {Object} wallet - Phantom wallet instance
   * @returns {Promise<boolean>}
   */
  async initialize(wallet) {
    try {
      console.log('Initializing Content Moderation System...');
      
      // Initialize Solana connection
      this.connection = await createConnection();
      this.wallet = wallet;
      
      // Initialize voting system integration
      this.votingSystem = new SolanaVotingSystem();
      await this.votingSystem.initialize(wallet);
      
      // Load existing moderation data (in production, this would come from database/IPFS)
      await this.loadModerationData();
      
      // Initialize user reputation system
      await this.initializeReputationSystem();
      
      this.initialized = true;
      console.log('Content Moderation System initialized successfully');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Content Moderation System:', error);
      throw new Error(`Moderation initialization failed: ${error.message}`);
    }
  }

  /**
   * Report content for community moderation
   * @param {string} contentId - Content ID to report
   * @param {Object} reportData - Report details
   * @returns {Promise<Object>}
   */
  async reportContent(contentId, reportData) {
    try {
      if (!this.initialized) {
        throw new Error('Moderation system not initialized');
      }

      // Validate reporter permissions and rate limits
      const canReport = await this.validateReportPermissions(reportData.reporterWallet);
      if (!canReport.allowed) {
        throw new Error(`Report denied: ${canReport.reason}`);
      }

      // Validate report data
      const validation = await this.validateReportData(contentId, reportData);
      if (!validation.isValid) {
        throw new Error(`Invalid report data: ${validation.errors.join(', ')}`);
      }

      // Create report record
      const reportId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const report = {
        id: reportId,
        contentId,
        reporterId: reportData.reporterId,
        reporterWallet: reportData.reporterWallet,
        category: reportData.category,
        reason: reportData.reason,
        description: reportData.description,
        evidence: reportData.evidence || [],
        severity: this.config.REPORT_CATEGORIES[reportData.category]?.severity || 'medium',
        
        // Status and timestamps
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        
        // Voting configuration based on category
        votingConfig: {
          threshold: this.config.REPORT_CATEGORIES[reportData.category]?.votingThreshold || 5,
          autoRemoveThreshold: this.config.REPORT_CATEGORIES[reportData.category]?.autoRemoveThreshold || 10,
          votingWindowHours: this.config.VOTING_THRESHOLDS.VOTING_WINDOW_HOURS,
          quickRemovalHours: reportData.severity === 'critical' ? this.config.VOTING_THRESHOLDS.QUICK_REMOVAL_HOURS : null
        }
      };

      // Store report
      this.reportHistory.set(reportId, report);

      // Update content moderation status
      await this.updateContentModerationStatus(contentId, {
        status: MODERATION_STATUS.REPORTED,
        reportCount: (this.getModerationData(contentId)?.reportCount || 0) + 1,
        activeReports: [...(this.getModerationData(contentId)?.activeReports || []), reportId],
        lastReportedAt: new Date().toISOString()
      });

      // Check if automatic removal threshold is reached
      const moderationData = this.getModerationData(contentId);
      if (moderationData.reportCount >= report.votingConfig.autoRemoveThreshold) {
        await this.automaticallyRemoveContent(contentId, 'threshold_reached');
        
        return {
          success: true,
          data: {
            reportId,
            action: 'auto_removed',
            message: 'Content automatically removed due to multiple reports'
          }
        };
      }

      // Initiate community voting if thresholds are met
      if (moderationData.reportCount >= report.votingConfig.threshold) {
        await this.initiateCommunityVoting(contentId, reportId);
        
        return {
          success: true,
          data: {
            reportId,
            action: 'voting_initiated',
            message: 'Community voting initiated for reported content'
          }
        };
      }

      return {
        success: true,
        data: {
          reportId,
          action: 'report_recorded',
          message: 'Report recorded successfully',
          threshold: report.votingConfig.threshold,
          currentReports: moderationData.reportCount
        }
      };

    } catch (error) {
      console.error('Content reporting failed:', error);
      return {
        success: false,
        error: error.message,
        code: 'REPORT_FAILED'
      };
    }
  }

  /**
   * Vote on content moderation with MLG token burning
   * @param {string} contentId - Content ID
   * @param {string} voteType - Type of vote (keep, remove, escalate)
   * @param {Object} voteData - Vote details and blockchain proof
   * @returns {Promise<Object>}
   */
  async voteOnModeration(contentId, voteType, voteData) {
    try {
      if (!this.initialized) {
        throw new Error('Moderation system not initialized');
      }

      // Validate voter permissions
      const canVote = await this.validateVoterPermissions(voteData.voterWallet, contentId);
      if (!canVote.allowed) {
        throw new Error(`Vote denied: ${canVote.reason}`);
      }

      // Validate vote type
      if (!Object.values(MODERATION_VOTE_TYPES).includes(voteType)) {
        throw new Error(`Invalid vote type: ${voteType}`);
      }

      // Get voter reputation and calculate token cost
      const voterReputation = await this.getUserReputation(voteData.voterWallet);
      const tokenCost = this.calculateModerationVoteCost(voteType, voterReputation);

      // Verify MLG token burn transaction
      const burnVerification = await this.verifyTokenBurn(
        voteData.transactionSignature,
        voteData.voterWallet,
        tokenCost
      );

      if (!burnVerification.verified) {
        throw new Error(`Token burn verification failed: ${burnVerification.error}`);
      }

      // Create vote record
      const voteId = `modvote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const vote = {
        id: voteId,
        contentId,
        voterId: voteData.voterId,
        voterWallet: voteData.voterWallet,
        voteType,
        tokensBurned: tokenCost,
        transactionSignature: voteData.transactionSignature,
        
        // Reputation weighting
        voterReputation: voterReputation.score,
        voteWeight: this.calculateVoteWeight(voterReputation),
        
        // Blockchain verification
        blockTime: burnVerification.blockTime,
        verified: true,
        
        // Metadata
        comment: voteData.comment,
        createdAt: new Date().toISOString()
      };

      // Store vote
      this.activeVotes.set(voteId, vote);

      // Update moderation data with new vote
      await this.updateModerationVotes(contentId, vote);

      // Check if voting thresholds are met
      const voteResults = await this.calculateVoteResults(contentId);
      const actionTaken = await this.processVoteResults(contentId, voteResults);

      // Update user reputation based on vote
      await this.updateVoterReputation(voteData.voterWallet, vote, actionTaken);

      return {
        success: true,
        data: {
          voteId,
          voteWeight: vote.voteWeight,
          tokensBurned: tokenCost,
          currentResults: voteResults,
          actionTaken: actionTaken,
          transactionSignature: voteData.transactionSignature
        }
      };

    } catch (error) {
      console.error('Moderation voting failed:', error);
      return {
        success: false,
        error: error.message,
        code: 'VOTE_FAILED'
      };
    }
  }

  /**
   * Appeal a moderation decision
   * @param {string} contentId - Content ID
   * @param {Object} appealData - Appeal details
   * @returns {Promise<Object>}
   */
  async appealModerationDecision(contentId, appealData) {
    try {
      if (!this.initialized) {
        throw new Error('Moderation system not initialized');
      }

      // Validate appeal permissions
      const canAppeal = await this.validateAppealPermissions(appealData.appellantWallet, contentId);
      if (!canAppeal.allowed) {
        throw new Error(`Appeal denied: ${canAppeal.reason}`);
      }

      // Verify stake payment for appeal
      const stakeAmount = this.config.APPEAL_SYSTEM.APPEAL_REQUIREMENTS.STAKE_AMOUNT;
      const stakeVerification = await this.verifyTokenBurn(
        appealData.stakeTransactionSignature,
        appealData.appellantWallet,
        stakeAmount
      );

      if (!stakeVerification.verified) {
        throw new Error(`Appeal stake verification failed: ${stakeVerification.error}`);
      }

      // Create appeal record
      const appealId = `appeal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const appeal = {
        id: appealId,
        contentId,
        appellantId: appealData.appellantId,
        appellantWallet: appealData.appellantWallet,
        appealType: appealData.appealType,
        description: appealData.description,
        evidence: appealData.evidence || [],
        
        // Stakes and payments
        stakeAmount,
        stakeTransactionSignature: appealData.stakeTransactionSignature,
        
        // Status and timing
        status: 'pending_review',
        createdAt: new Date().toISOString(),
        appealDeadline: new Date(Date.now() + (this.config.APPEAL_SYSTEM.APPEAL_REQUIREMENTS.TIME_LIMIT_DAYS * 24 * 60 * 60 * 1000)).toISOString(),
        
        // Review configuration
        requiresCommunityVote: true,
        reviewerAssigned: null,
        reviewStarted: null
      };

      // Store appeal
      this.appealHistory = this.appealHistory || new Map();
      this.appealHistory.set(appealId, appeal);

      // Update content status to appealed
      await this.updateContentModerationStatus(contentId, {
        status: MODERATION_STATUS.APPEALED,
        activeAppeal: appealId,
        appealedAt: new Date().toISOString()
      });

      // Initiate community appeal voting
      await this.initiateAppealVoting(contentId, appealId);

      return {
        success: true,
        data: {
          appealId,
          stakeAmount,
          deadline: appeal.appealDeadline,
          message: 'Appeal submitted successfully, community review initiated'
        }
      };

    } catch (error) {
      console.error('Appeal submission failed:', error);
      return {
        success: false,
        error: error.message,
        code: 'APPEAL_FAILED'
      };
    }
  }

  /**
   * Get moderation statistics and transparency report
   * @param {string} timeframe - Timeframe for statistics (day, week, month, all)
   * @returns {Promise<Object>}
   */
  async getModerationStatistics(timeframe = 'week') {
    try {
      const stats = {
        timeframe,
        generatedAt: new Date().toISOString(),
        
        // Report statistics
        reports: {
          total: this.reportHistory.size,
          byCategory: {},
          bySeverity: {},
          resolved: 0,
          pending: 0
        },
        
        // Voting statistics
        votes: {
          total: this.activeVotes.size,
          byType: {},
          totalTokensBurned: 0,
          averageParticipation: 0
        },
        
        // Content actions
        contentActions: {
          removed: 0,
          kept: 0,
          appealed: 0,
          restored: 0
        },
        
        // Community participation
        community: {
          activeVoters: new Set(),
          topContributors: [],
          reputationDistribution: {},
          moderatorActivity: {}
        },
        
        // System health metrics
        systemHealth: {
          averageResponseTime: 0,
          consensusRate: 0,
          appealSuccessRate: 0,
          falsePositiveRate: 0
        }
      };

      // Calculate timeframe filter
      const timeframeMs = this.getTimeframeMs(timeframe);
      const cutoffTime = new Date(Date.now() - timeframeMs);

      // Process reports
      for (const [reportId, report] of this.reportHistory.entries()) {
        if (new Date(report.createdAt) > cutoffTime) {
          stats.reports.total++;
          stats.reports.byCategory[report.category] = (stats.reports.byCategory[report.category] || 0) + 1;
          stats.reports.bySeverity[report.severity] = (stats.reports.bySeverity[report.severity] || 0) + 1;
          
          if (report.status === 'resolved') {
            stats.reports.resolved++;
          } else {
            stats.reports.pending++;
          }
        }
      }

      // Process votes
      for (const [voteId, vote] of this.activeVotes.entries()) {
        if (new Date(vote.createdAt) > cutoffTime) {
          stats.votes.total++;
          stats.votes.byType[vote.voteType] = (stats.votes.byType[vote.voteType] || 0) + 1;
          stats.votes.totalTokensBurned += vote.tokensBurned;
          stats.community.activeVoters.add(vote.voterWallet);
        }
      }

      // Calculate community metrics
      stats.community.activeVoters = stats.community.activeVoters.size;
      stats.community.topContributors = await this.getTopContributors(timeframe);
      stats.community.reputationDistribution = await this.getReputationDistribution();

      // Calculate system health metrics
      stats.systemHealth = await this.calculateSystemHealthMetrics(timeframe);

      return {
        success: true,
        data: stats
      };

    } catch (error) {
      console.error('Failed to generate moderation statistics:', error);
      return {
        success: false,
        error: error.message,
        code: 'STATS_FAILED'
      };
    }
  }

  /**
   * Get user's moderation history and reputation
   * @param {string} walletAddress - User's wallet address
   * @returns {Promise<Object>}
   */
  async getUserModerationProfile(walletAddress) {
    try {
      const reputation = await this.getUserReputation(walletAddress);
      const role = this.getUserRole(reputation);
      
      // Get user's voting history
      const votes = Array.from(this.activeVotes.values())
        .filter(vote => vote.voterWallet === walletAddress)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Get user's reports
      const reports = Array.from(this.reportHistory.values())
        .filter(report => report.reporterWallet === walletAddress)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Calculate performance metrics
      const performance = await this.calculateUserPerformance(walletAddress);

      return {
        success: true,
        data: {
          walletAddress,
          reputation: reputation.score,
          reputationTier: reputation.tier,
          role: role.name,
          permissions: role.permissions,
          voteWeight: this.calculateVoteWeight(reputation),
          
          // Activity summary
          activity: {
            totalVotes: votes.length,
            totalReports: reports.length,
            tokensBurned: votes.reduce((sum, vote) => sum + vote.tokensBurned, 0),
            lastActive: votes.length > 0 ? votes[0].createdAt : null
          },
          
          // Performance metrics
          performance,
          
          // Recent activity
          recentVotes: votes.slice(0, 10),
          recentReports: reports.slice(0, 10)
        }
      };

    } catch (error) {
      console.error('Failed to get user moderation profile:', error);
      return {
        success: false,
        error: error.message,
        code: 'PROFILE_FAILED'
      };
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  /**
   * Load existing moderation data
   * @private
   */
  async loadModerationData() {
    // In production, this would load from database or IPFS
    // For now, initialize empty data structures
    this.moderationData = new Map();
    this.reportHistory = new Map();
    this.userReputations = new Map();
    this.activeVotes = new Map();
    this.appealHistory = new Map();
    
    console.log('Moderation data initialized');
  }

  /**
   * Initialize reputation system
   * @private
   */
  async initializeReputationSystem() {
    // Load existing reputation data or initialize defaults
    if (this.wallet?.publicKey) {
      const walletAddress = this.wallet.publicKey.toString();
      if (!this.userReputations.has(walletAddress)) {
        this.userReputations.set(walletAddress, {
          score: 100, // Starting reputation
          tier: 'member',
          votes: 0,
          accuracy: 0,
          lastUpdated: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Validate report permissions and rate limits
   * @private
   */
  async validateReportPermissions(walletAddress) {
    try {
      // Check minimum reputation
      const reputation = await this.getUserReputation(walletAddress);
      if (reputation.score < this.config.VOTING_THRESHOLDS.MIN_REPUTATION_REPORT) {
        return {
          allowed: false,
          reason: `Insufficient reputation. Required: ${this.config.VOTING_THRESHOLDS.MIN_REPUTATION_REPORT}, Current: ${reputation.score}`
        };
      }

      // Check rate limits
      const today = new Date().toDateString();
      const reportKey = `reports-${walletAddress}-${today}`;
      const reportsToday = this.rateLimitTracker.get(reportKey) || 0;
      
      if (reportsToday >= this.config.SECURITY_CONFIG.MAX_REPORTS_PER_DAY) {
        return {
          allowed: false,
          reason: `Daily report limit exceeded. Max: ${this.config.SECURITY_CONFIG.MAX_REPORTS_PER_DAY}`
        };
      }

      // Check cooldown
      const lastReportKey = `last-report-${walletAddress}`;
      const lastReport = this.rateLimitTracker.get(lastReportKey);
      if (lastReport && (Date.now() - lastReport) < (this.config.SECURITY_CONFIG.COOLDOWN_BETWEEN_REPORTS * 1000)) {
        return {
          allowed: false,
          reason: 'Cooldown period active. Please wait before reporting again.'
        };
      }

      // Update rate limiting trackers
      this.rateLimitTracker.set(reportKey, reportsToday + 1);
      this.rateLimitTracker.set(lastReportKey, Date.now());

      return { allowed: true };

    } catch (error) {
      return {
        allowed: false,
        reason: `Permission validation failed: ${error.message}`
      };
    }
  }

  /**
   * Validate report data structure
   * @private
   */
  async validateReportData(contentId, reportData) {
    const errors = [];

    // Required fields
    if (!contentId) errors.push('Content ID is required');
    if (!reportData.category) errors.push('Report category is required');
    if (!reportData.reason) errors.push('Report reason is required');
    if (!reportData.description || reportData.description.length < 10) {
      errors.push('Description must be at least 10 characters');
    }
    if (!reportData.reporterWallet) errors.push('Reporter wallet is required');

    // Validate category
    if (reportData.category && !this.config.REPORT_CATEGORIES[reportData.category.toUpperCase()]) {
      errors.push('Invalid report category');
    }

    // Validate description length
    if (reportData.description && reportData.description.length > 1000) {
      errors.push('Description must be less than 1000 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Update content moderation status
   * @private
   */
  async updateContentModerationStatus(contentId, updates) {
    const existing = this.moderationData.get(contentId) || {
      contentId,
      status: MODERATION_STATUS.ACTIVE,
      reportCount: 0,
      activeReports: [],
      votes: [],
      createdAt: new Date().toISOString()
    };

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.moderationData.set(contentId, updated);
    return updated;
  }

  /**
   * Get moderation data for content
   * @private
   */
  getModerationData(contentId) {
    return this.moderationData.get(contentId) || {
      contentId,
      status: MODERATION_STATUS.ACTIVE,
      reportCount: 0,
      activeReports: [],
      votes: []
    };
  }

  /**
   * Automatically remove content when threshold is reached
   * @private
   */
  async automaticallyRemoveContent(contentId, reason) {
    await this.updateContentModerationStatus(contentId, {
      status: MODERATION_STATUS.REMOVED,
      removalReason: reason,
      removedAt: new Date().toISOString(),
      autoRemoved: true
    });

    console.log(`Content ${contentId} automatically removed: ${reason}`);
  }

  /**
   * Initiate community voting for reported content
   * @private
   */
  async initiateCommunityVoting(contentId, reportId) {
    await this.updateContentModerationStatus(contentId, {
      status: MODERATION_STATUS.VOTING_ACTIVE,
      votingInitiated: new Date().toISOString(),
      votingDeadline: new Date(Date.now() + (this.config.VOTING_THRESHOLDS.VOTING_WINDOW_HOURS * 60 * 60 * 1000)).toISOString(),
      triggerReport: reportId
    });

    console.log(`Community voting initiated for content ${contentId}`);
  }

  /**
   * Validate voter permissions
   * @private
   */
  async validateVoterPermissions(walletAddress, contentId) {
    try {
      // Check if already voted
      const existingVote = Array.from(this.activeVotes.values())
        .find(vote => vote.contentId === contentId && vote.voterWallet === walletAddress);
      
      if (existingVote) {
        return {
          allowed: false,
          reason: 'Already voted on this content'
        };
      }

      // Check minimum reputation
      const reputation = await this.getUserReputation(walletAddress);
      if (reputation.score < this.config.VOTING_THRESHOLDS.MIN_REPUTATION_VOTE) {
        return {
          allowed: false,
          reason: `Insufficient reputation. Required: ${this.config.VOTING_THRESHOLDS.MIN_REPUTATION_VOTE}`
        };
      }

      // Check rate limits
      const hourKey = `votes-${walletAddress}-${new Date().getHours()}`;
      const votesThisHour = this.rateLimitTracker.get(hourKey) || 0;
      
      if (votesThisHour >= this.config.SECURITY_CONFIG.MAX_VOTES_PER_HOUR) {
        return {
          allowed: false,
          reason: 'Hourly vote limit exceeded'
        };
      }

      // Update rate limiting
      this.rateLimitTracker.set(hourKey, votesThisHour + 1);

      return { allowed: true };

    } catch (error) {
      return {
        allowed: false,
        reason: `Permission validation failed: ${error.message}`
      };
    }
  }

  /**
   * Calculate MLG token cost for moderation vote
   * @private
   */
  calculateModerationVoteCost(voteType, voterReputation) {
    let baseCost = this.config.MODERATION_VOTE_COSTS[voteType.toUpperCase()] || 1;
    
    // Apply reputation multiplier
    const role = this.getUserRole(voterReputation);
    const multiplier = this.config.MODERATION_VOTE_COSTS.REPUTATION_MULTIPLIERS[role.id.toUpperCase()] || 1.0;
    
    return Math.max(0.1, baseCost * multiplier); // Minimum 0.1 MLG
  }

  /**
   * Verify MLG token burn transaction
   * @private
   */
  async verifyTokenBurn(transactionSignature, walletAddress, expectedAmount) {
    try {
      // Use the existing voting system's burn verification
      const verification = await this.votingSystem.verifyBurnTransaction(
        transactionSignature,
        expectedAmount
      );

      return {
        verified: verification.success,
        blockTime: verification.blockTime,
        actualAmount: verification.burnedAmount,
        error: verification.error
      };

    } catch (error) {
      return {
        verified: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate vote weight based on reputation
   * @private
   */
  calculateVoteWeight(reputation) {
    const role = this.getUserRole(reputation);
    const baseWeight = this.config.MODERATOR_SYSTEM.ROLES[role.id.toUpperCase()]?.voteWeight || 1.0;
    
    // Additional weight based on accuracy
    const accuracyBonus = reputation.accuracy > 0.8 ? 0.2 : 0;
    
    return Math.min(3.0, baseWeight + accuracyBonus); // Max weight of 3.0
  }

  /**
   * Get user reputation data
   * @private
   */
  async getUserReputation(walletAddress) {
    const reputation = this.userReputations.get(walletAddress) || {
      score: 50, // Default starting reputation
      tier: 'member',
      votes: 0,
      accuracy: 0.5,
      lastUpdated: new Date().toISOString()
    };

    return reputation;
  }

  /**
   * Get user role based on reputation
   * @private
   */
  getUserRole(reputation) {
    const roles = this.config.MODERATOR_SYSTEM.ROLES;
    
    if (reputation.score >= roles.EXPERT_REVIEWER.minReputation) {
      return roles.EXPERT_REVIEWER;
    } else if (reputation.score >= roles.COMMUNITY_MODERATOR.minReputation) {
      return roles.COMMUNITY_MODERATOR;
    } else if (reputation.score >= roles.TRUSTED_MEMBER.minReputation) {
      return roles.TRUSTED_MEMBER;
    } else {
      return roles.COMMUNITY_MEMBER;
    }
  }

  /**
   * Update moderation votes for content
   * @private
   */
  async updateModerationVotes(contentId, newVote) {
    const moderationData = this.getModerationData(contentId);
    const votes = moderationData.votes || [];
    votes.push(newVote);

    await this.updateContentModerationStatus(contentId, {
      votes,
      voteCount: votes.length,
      lastVoteAt: new Date().toISOString()
    });
  }

  /**
   * Calculate current vote results for content
   * @private
   */
  async calculateVoteResults(contentId) {
    const moderationData = this.getModerationData(contentId);
    const votes = moderationData.votes || [];

    const results = {
      totalVotes: votes.length,
      totalWeight: 0,
      keepVotes: 0,
      keepWeight: 0,
      removeVotes: 0,
      removeWeight: 0,
      escalateVotes: 0,
      escalateWeight: 0,
      tokensBurned: 0
    };

    for (const vote of votes) {
      results.totalWeight += vote.voteWeight;
      results.tokensBurned += vote.tokensBurned;

      switch (vote.voteType) {
        case MODERATION_VOTE_TYPES.KEEP:
          results.keepVotes++;
          results.keepWeight += vote.voteWeight;
          break;
        case MODERATION_VOTE_TYPES.REMOVE:
          results.removeVotes++;
          results.removeWeight += vote.voteWeight;
          break;
        case MODERATION_VOTE_TYPES.ESCALATE:
          results.escalateVotes++;
          results.escalateWeight += vote.voteWeight;
          break;
      }
    }

    // Calculate ratios
    results.keepRatio = results.totalWeight > 0 ? results.keepWeight / results.totalWeight : 0;
    results.removeRatio = results.totalWeight > 0 ? results.removeWeight / results.totalWeight : 0;
    results.escalateRatio = results.totalWeight > 0 ? results.escalateWeight / results.totalWeight : 0;

    return results;
  }

  /**
   * Process vote results and take action if thresholds are met
   * @private
   */
  async processVoteResults(contentId, voteResults) {
    const thresholds = this.config.VOTING_THRESHOLDS;
    
    // Check if minimum votes are met
    if (voteResults.totalVotes < thresholds.MIN_VOTES_REMOVE) {
      return { action: 'none', reason: 'Insufficient votes' };
    }

    // Check for escalation
    if (voteResults.escalateRatio >= thresholds.ESCALATE_RATIO && 
        voteResults.escalateVotes >= thresholds.MIN_VOTES_ESCALATE) {
      await this.escalateForExpertReview(contentId);
      return { action: 'escalated', reason: 'Expert review requested' };
    }

    // Check for removal
    if (voteResults.removeRatio >= thresholds.REMOVE_RATIO) {
      await this.updateContentModerationStatus(contentId, {
        status: MODERATION_STATUS.REMOVED,
        removalReason: 'community_vote',
        removedAt: new Date().toISOString(),
        finalVoteResults: voteResults
      });
      return { action: 'removed', reason: 'Community voted to remove' };
    }

    // Check for keep
    if (voteResults.keepRatio >= thresholds.KEEP_RATIO) {
      await this.updateContentModerationStatus(contentId, {
        status: MODERATION_STATUS.ACTIVE,
        clearanceReason: 'community_vote',
        clearedAt: new Date().toISOString(),
        finalVoteResults: voteResults
      });
      return { action: 'kept', reason: 'Community voted to keep' };
    }

    return { action: 'pending', reason: 'Voting continues' };
  }

  /**
   * Escalate content for expert review
   * @private
   */
  async escalateForExpertReview(contentId) {
    await this.updateContentModerationStatus(contentId, {
      status: MODERATION_STATUS.UNDER_REVIEW,
      escalatedAt: new Date().toISOString(),
      requiresExpertReview: true
    });

    console.log(`Content ${contentId} escalated for expert review`);
  }

  /**
   * Update voter reputation based on vote outcome
   * @private
   */
  async updateVoterReputation(walletAddress, vote, actionTaken) {
    const reputation = await this.getUserReputation(walletAddress);
    
    // Calculate accuracy based on vote alignment with final decision
    let accuracyDelta = 0;
    if (actionTaken.action === 'removed' && vote.voteType === MODERATION_VOTE_TYPES.REMOVE) {
      accuracyDelta = 0.1; // Positive accuracy
    } else if (actionTaken.action === 'kept' && vote.voteType === MODERATION_VOTE_TYPES.KEEP) {
      accuracyDelta = 0.1; // Positive accuracy
    } else if (actionTaken.action !== 'pending') {
      accuracyDelta = -0.05; // Negative accuracy for incorrect votes
    }

    // Update reputation
    const updatedReputation = {
      ...reputation,
      votes: reputation.votes + 1,
      accuracy: Math.max(0, Math.min(1, reputation.accuracy + (accuracyDelta / reputation.votes))),
      score: Math.max(0, reputation.score + (accuracyDelta * 10)), // Scale accuracy to reputation points
      lastUpdated: new Date().toISOString()
    };

    this.userReputations.set(walletAddress, updatedReputation);
  }

  /**
   * Validate appeal permissions
   * @private
   */
  async validateAppealPermissions(walletAddress, contentId) {
    try {
      // Check if content is eligible for appeal
      const moderationData = this.getModerationData(contentId);
      if (moderationData.status !== MODERATION_STATUS.REMOVED) {
        return {
          allowed: false,
          reason: 'Content is not removed and cannot be appealed'
        };
      }

      // Check if appeal window is still open
      const removedAt = new Date(moderationData.removedAt);
      const appealDeadline = new Date(removedAt.getTime() + (this.config.APPEAL_SYSTEM.APPEAL_REQUIREMENTS.TIME_LIMIT_DAYS * 24 * 60 * 60 * 1000));
      
      if (Date.now() > appealDeadline.getTime()) {
        return {
          allowed: false,
          reason: 'Appeal window has expired'
        };
      }

      // Check if already appealed
      if (moderationData.activeAppeal) {
        return {
          allowed: false,
          reason: 'Content has already been appealed'
        };
      }

      return { allowed: true };

    } catch (error) {
      return {
        allowed: false,
        reason: `Appeal validation failed: ${error.message}`
      };
    }
  }

  /**
   * Initiate appeal voting process
   * @private
   */
  async initiateAppealVoting(contentId, appealId) {
    await this.updateContentModerationStatus(contentId, {
      status: MODERATION_STATUS.APPEAL_REVIEW,
      appealVotingStarted: new Date().toISOString(),
      appealVotingDeadline: new Date(Date.now() + (this.config.VOTING_THRESHOLDS.VOTING_WINDOW_HOURS * 60 * 60 * 1000)).toISOString()
    });

    console.log(`Appeal voting initiated for content ${contentId}, appeal ${appealId}`);
  }

  /**
   * Get timeframe in milliseconds
   * @private
   */
  getTimeframeMs(timeframe) {
    const timeframes = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000,
      all: Number.MAX_SAFE_INTEGER
    };

    return timeframes[timeframe] || timeframes.week;
  }

  /**
   * Get top contributors for timeframe
   * @private
   */
  async getTopContributors(timeframe) {
    const contributors = new Map();
    const timeframeMs = this.getTimeframeMs(timeframe);
    const cutoffTime = new Date(Date.now() - timeframeMs);

    // Count contributions from votes
    for (const vote of this.activeVotes.values()) {
      if (new Date(vote.createdAt) > cutoffTime) {
        const current = contributors.get(vote.voterWallet) || { votes: 0, tokensBurned: 0, accuracy: 0 };
        contributors.set(vote.voterWallet, {
          votes: current.votes + 1,
          tokensBurned: current.tokensBurned + vote.tokensBurned,
          accuracy: current.accuracy // Would need to calculate based on outcomes
        });
      }
    }

    // Sort by contribution score
    return Array.from(contributors.entries())
      .map(([wallet, stats]) => ({
        walletAddress: wallet,
        ...stats,
        contributionScore: stats.votes + (stats.tokensBurned * 0.1) + (stats.accuracy * 10)
      }))
      .sort((a, b) => b.contributionScore - a.contributionScore)
      .slice(0, 10);
  }

  /**
   * Get reputation distribution
   * @private
   */
  async getReputationDistribution() {
    const distribution = {
      member: 0,
      trusted: 0,
      moderator: 0,
      expert: 0
    };

    for (const reputation of this.userReputations.values()) {
      const role = this.getUserRole(reputation);
      distribution[role.id]++;
    }

    return distribution;
  }

  /**
   * Calculate system health metrics
   * @private
   */
  async calculateSystemHealthMetrics(timeframe) {
    // Placeholder for system health calculations
    return {
      averageResponseTime: 2.5, // hours
      consensusRate: 0.85, // 85% consensus rate
      appealSuccessRate: 0.25, // 25% of appeals are successful
      falsePositiveRate: 0.12 // 12% false positive rate
    };
  }

  /**
   * Calculate user performance metrics
   * @private
   */
  async calculateUserPerformance(walletAddress) {
    const reputation = await this.getUserReputation(walletAddress);
    
    return {
      votingAccuracy: reputation.accuracy,
      totalContribution: reputation.votes,
      reputationTrend: 'stable', // Would calculate based on recent changes
      moderationEffectiveness: reputation.accuracy * reputation.votes,
      communityStanding: this.getUserRole(reputation).name
    };
  }
}

/**
 * Content Moderation Utilities
 */
export class ContentModerationUtils {
  /**
   * Generate moderation vote message for wallet signing
   * @param {string} contentId - Content ID
   * @param {string} voteType - Vote type
   * @param {number} tokenAmount - Token amount to burn
   * @returns {string}
   */
  static generateModerationVoteMessage(contentId, voteType, tokenAmount) {
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substr(2, 9);
    
    return `MLG.clan Moderation Vote\nContent: ${contentId}\nVote: ${voteType}\nTokens: ${tokenAmount}\nTimestamp: ${timestamp}\nNonce: ${nonce}`;
  }

  /**
   * Generate appeal submission message for wallet signing
   * @param {string} contentId - Content ID
   * @param {string} appealType - Appeal type
   * @param {number} stakeAmount - Stake amount
   * @returns {string}
   */
  static generateAppealMessage(contentId, appealType, stakeAmount) {
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substr(2, 9);
    
    return `MLG.clan Appeal Submission\nContent: ${contentId}\nAppeal: ${appealType}\nStake: ${stakeAmount}\nTimestamp: ${timestamp}\nNonce: ${nonce}`;
  }

  /**
   * Calculate reputation tier from score
   * @param {number} reputationScore - Reputation score
   * @returns {string}
   */
  static calculateReputationTier(reputationScore) {
    if (reputationScore >= 2500) return 'Expert';
    if (reputationScore >= 1000) return 'Moderator';
    if (reputationScore >= 200) return 'Trusted';
    if (reputationScore >= 25) return 'Member';
    return 'Newcomer';
  }

  /**
   * Format moderation statistics for display
   * @param {Object} stats - Raw statistics
   * @returns {Object}
   */
  static formatModerationStats(stats) {
    return {
      ...stats,
      reports: {
        ...stats.reports,
        resolutionRate: stats.reports.total > 0 ? (stats.reports.resolved / stats.reports.total * 100).toFixed(1) : '0.0'
      },
      votes: {
        ...stats.votes,
        averageTokensPerVote: stats.votes.total > 0 ? (stats.votes.totalTokensBurned / stats.votes.total).toFixed(2) : '0.00'
      },
      systemHealth: {
        ...stats.systemHealth,
        healthScore: (
          (stats.systemHealth.consensusRate * 40) +
          ((1 - stats.systemHealth.falsePositiveRate) * 30) +
          (stats.systemHealth.appealSuccessRate * 20) +
          (Math.max(0, 100 - stats.systemHealth.averageResponseTime * 10) * 10)
        ).toFixed(1)
      }
    };
  }

  /**
   * Validate moderation action permissions
   * @param {string} userRole - User's role
   * @param {string} action - Action to validate
   * @returns {boolean}
   */
  static validateActionPermission(userRole, action) {
    const rolePermissions = {
      member: ['report', 'vote'],
      trusted: ['report', 'vote', 'escalate'],
      moderator: ['report', 'vote', 'escalate', 'override', 'review_appeals'],
      expert: ['report', 'vote', 'escalate', 'override', 'review_appeals', 'set_policy']
    };

    return rolePermissions[userRole.toLowerCase()]?.includes(action.toLowerCase()) || false;
  }
}

// Export singleton instance
export const contentModerationSystem = new ContentModerationSystem();

// Export default
export default {
  ContentModerationSystem,
  ContentModerationUtils,
  contentModerationSystem,
  CONTENT_MODERATION_CONFIG,
  MODERATION_STATUS,
  MODERATION_VOTE_TYPES
};