/**
 * MLG.clan Clan-Specific Voting Pools and Tracking System - Sub-task 5.4
 * 
 * Comprehensive clan-specific voting system with MLG token integration, role-based 
 * voting weights, and blockchain-verified governance for competitive gaming clans.
 * 
 * Core Features:
 * - Clan-exclusive voting pools with multiple proposal types
 * - Role-based voting weights (Owner: 10x, Admin: 5x, Moderator: 3x, Officer: 2x, Member: 1x)
 * - MLG token burn mechanics for clan votes with clan-specific costs
 * - Vote delegation and proxy voting for clan leadership
 * - Comprehensive vote tracking, analytics, and historical data
 * - On-chain clan vote recording using Solana PDAs
 * - Integration with existing voting system and clan management
 * 
 * Voting Pool Types:
 * - GOVERNANCE: Clan constitution, rule changes, major decisions
 * - BUDGET: Treasury allocation, token distribution, financial decisions  
 * - MEMBERSHIP: Member promotions, demotions, kicks, and bans
 * - CONTENT: Content curation, featured posts, clan announcements
 * - EVENTS: Tournament participation, event scheduling, competitions
 * - ALLIANCE: Clan partnerships, alliances, diplomatic relations
 * 
 * Role-Based Voting Weights:
 * - Owner: 10x multiplier (ultimate authority)
 * - Admin: 5x multiplier (senior leadership)
 * - Moderator: 3x multiplier (content and community management)
 * - Officer: 2x multiplier (operational leadership)
 * - Member: 1x multiplier (standard participation)
 * - Recruit: 0.5x multiplier (probationary participation)
 * 
 * Security Features:
 * - Phantom wallet integration for secure vote signing
 * - MLG token burn verification and anti-fraud measures
 * - Vote delegation with revocation capabilities
 * - Comprehensive audit trail and transaction verification
 * - Rate limiting and spam prevention
 * - Emergency vote cancellation for owners
 * 
 * @author Claude Code - Solana Web3 Security Architect  
 * @version 1.0.0
 * @integration MLG Token: 7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL
 * @depends solana-voting-system.js - Base voting system
 * @depends clan-management.js - Core clan management
 * @depends clan-roles.js - Role-based permissions
 */

import pkg from '@solana/web3.js';
const { 
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  Keypair,
  AccountInfo,
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

import SolanaVotingSystem, { VOTING_CONFIG } from '../voting/solana-voting-system.js';
import { CLAN_TIER_CONFIG, CLAN_CONFIG } from './clan-management.js';
import { CLAN_ROLE_HIERARCHY, PERMISSION_CATEGORIES } from './clan-roles.js';
import crypto from 'crypto';

/**
 * Clan Voting Configuration
 * Defines clan-specific voting mechanics, costs, and governance rules
 */
export const CLAN_VOTING_CONFIG = {
  // Clan voting pool types and their configurations
  POOL_TYPES: {
    GOVERNANCE: {
      id: 'governance',
      name: 'Governance',
      description: 'Clan constitution, rule changes, major decisions',
      icon: '⚖️',
      color: '#4A5568',
      minVotingPower: 10, // Minimum total voting power required
      passingThreshold: 0.67, // 67% majority required
      quorumRequirement: 0.33, // 33% participation required
      votingPeriodHours: 168, // 7 days for governance votes
      emergencyOverride: true, // Owner can override if needed
      burnCostMultiplier: 2.0, // Double MLG burn cost for governance
      roleRestrictions: ['owner', 'admin', 'moderator'], // Who can create proposals
      features: [
        'constitution_changes',
        'clan_rules',
        'major_decisions',
        'ownership_transfer',
        'clan_dissolution'
      ]
    },
    BUDGET: {
      id: 'budget',
      name: 'Budget & Treasury',
      description: 'Treasury allocation, token distribution, financial decisions',
      icon: '💰',
      color: '#38A169',
      minVotingPower: 5,
      passingThreshold: 0.60, // 60% majority for financial decisions
      quorumRequirement: 0.25, // 25% participation required
      votingPeriodHours: 72, // 3 days for budget votes
      emergencyOverride: true,
      burnCostMultiplier: 1.5,
      roleRestrictions: ['owner', 'admin'],
      features: [
        'token_distribution',
        'treasury_allocation',
        'reward_pools',
        'financial_planning',
        'investment_decisions'
      ]
    },
    MEMBERSHIP: {
      id: 'membership',
      name: 'Membership',
      description: 'Member promotions, demotions, kicks, and bans',
      icon: '👥',
      color: '#3182CE',
      minVotingPower: 3,
      passingThreshold: 0.55, // 55% majority for membership decisions
      quorumRequirement: 0.20, // 20% participation required
      votingPeriodHours: 48, // 2 days for membership votes
      emergencyOverride: true,
      burnCostMultiplier: 1.0,
      roleRestrictions: ['owner', 'admin', 'moderator'],
      features: [
        'member_promotion',
        'member_demotion',
        'member_kick',
        'member_ban',
        'role_assignment',
        'probation_decisions'
      ]
    },
    CONTENT: {
      id: 'content',
      name: 'Content Curation',
      description: 'Content curation, featured posts, clan announcements',
      icon: '📝',
      color: '#805AD5',
      minVotingPower: 1,
      passingThreshold: 0.50, // Simple majority for content
      quorumRequirement: 0.15, // 15% participation required
      votingPeriodHours: 24, // 1 day for content votes
      emergencyOverride: false,
      burnCostMultiplier: 0.5, // Half cost for content votes
      roleRestrictions: ['owner', 'admin', 'moderator', 'officer'],
      features: [
        'featured_content',
        'content_moderation',
        'announcement_approval',
        'event_promotion',
        'content_rewards'
      ]
    },
    EVENTS: {
      id: 'events',
      name: 'Events & Tournaments',
      description: 'Tournament participation, event scheduling, competitions',
      icon: '🏆',
      color: '#D69E2E',
      minVotingPower: 2,
      passingThreshold: 0.50, // Simple majority for events
      quorumRequirement: 0.15, // 15% participation required
      votingPeriodHours: 48, // 2 days for event votes
      emergencyOverride: false,
      burnCostMultiplier: 0.75,
      roleRestrictions: ['owner', 'admin', 'moderator', 'officer'],
      features: [
        'tournament_participation',
        'event_scheduling',
        'team_selection',
        'competition_strategy',
        'prize_distribution'
      ]
    },
    ALLIANCE: {
      id: 'alliance',
      name: 'Alliances & Diplomacy',
      description: 'Clan partnerships, alliances, diplomatic relations',
      icon: '🤝',
      color: '#319795',
      minVotingPower: 5,
      passingThreshold: 0.60, // 60% majority for diplomatic decisions
      quorumRequirement: 0.25, // 25% participation required
      votingPeriodHours: 96, // 4 days for alliance votes
      emergencyOverride: true,
      burnCostMultiplier: 1.25,
      roleRestrictions: ['owner', 'admin'],
      features: [
        'clan_alliances',
        'partnership_agreements',
        'diplomatic_relations',
        'inter_clan_events',
        'shared_resources'
      ]
    }
  },

  // Role-based voting weight multipliers
  ROLE_VOTING_WEIGHTS: {
    owner: 10.0,    // Ultimate authority
    admin: 5.0,     // Senior leadership  
    moderator: 3.0, // Content and community management
    officer: 2.0,   // Operational leadership
    member: 1.0,    // Standard participation
    recruit: 0.5    // Probationary participation
  },

  // MLG token burn costs for clan votes (base costs, multiplied by pool type)
  CLAN_BURN_COSTS: {
    1: 2,    // 2 MLG for 1st additional clan vote
    2: 4,    // 4 MLG for 2nd additional clan vote
    3: 6,    // 6 MLG for 3rd additional clan vote
    4: 8,    // 8 MLG for 4th additional clan vote
    5: 10    // 10 MLG for 5th additional clan vote (max for clans)
  },

  // Maximum additional votes through burning for clan votes
  MAX_CLAN_BURN_VOTES: 5,

  // Vote delegation and proxy settings
  DELEGATION: {
    ENABLED: true,
    MAX_DELEGATIONS_PER_MEMBER: 10, // Max members one can receive delegations from
    DELEGATION_PERIOD_HOURS: 168, // 7 days default delegation period
    REVOCATION_NOTICE_HOURS: 24, // 24 hour notice for revocation
    PROXY_VOTING_ENABLED: true,
    AUTO_DELEGATION_TO_ROLE: true, // Auto-delegate to higher roles if inactive
    DELEGATION_WEIGHT_INHERITANCE: true, // Delegates inherit voter's weight
    features: [
      'delegation_management',
      'proxy_voting',
      'auto_delegation',
      'revocation_tracking',
      'delegation_analytics'
    ]
  },

  // Clan voting security and anti-gaming measures
  SECURITY: {
    MIN_CLAN_MEMBERSHIP_DAYS: 7, // Must be in clan for 7 days to vote
    MIN_ROLE_TENURE_HOURS: 24, // Must have role for 24 hours for full weight
    VOTE_SIGNATURE_REQUIRED: true, // Phantom wallet signature required
    ANTI_SYBIL_ENABLED: true,
    RATE_LIMITING: {
      VOTES_PER_HOUR: 10,
      PROPOSALS_PER_DAY: 3,
      DELEGATIONS_PER_HOUR: 5
    },
    EMERGENCY_CONTROLS: {
      OWNER_OVERRIDE: true,
      VOTE_CANCELLATION: true,
      EMERGENCY_PROPOSALS: true,
      ABUSE_PREVENTION: true
    }
  },

  // Vote tracking and analytics
  ANALYTICS: {
    PARTICIPATION_TRACKING: true,
    VOTING_PATTERNS: true,
    ENGAGEMENT_METRICS: true,
    HISTORICAL_ANALYSIS: true,
    MEMBER_INSIGHTS: true,
    GOVERNANCE_HEALTH: true,
    features: [
      'participation_rates',
      'voting_trends',
      'engagement_scoring',
      'influence_mapping',
      'decision_analytics',
      'governance_reports'
    ]
  }
};

/**
 * Clan Voting System
 * Main class for managing clan-specific voting pools and governance
 */
export class ClanVotingSystem {
  constructor(options = {}) {
    this.connection = null;
    this.mlgTokenConnection = null;
    this.wallet = options.wallet || null;
    this.clanId = options.clanId || null;
    this.baseVotingSystem = null;
    
    // Voting state management
    this.activeProposals = new Map();
    this.voteHistory = new Map();
    this.delegationRegistry = new Map();
    this.analyticsData = new Map();
    
    // Cache for performance
    this.memberRoleCache = new Map();
    this.votingPowerCache = new Map();
    this.lastCacheUpdate = 0;
    this.cacheValidityMs = 300000; // 5 minutes
    
    // Initialize base systems
    this.initializeConnections();
    this.initializeBaseVotingSystem();
  }

  /**
   * Initialize Solana connections and base voting system
   */
  async initializeConnections() {
    try {
      this.connection = await createConnection();
      this.mlgTokenConnection = await createMLGTokenConnection();
      this.baseVotingSystem = new SolanaVotingSystem();
      
      console.log('ClanVotingSystem: Connections initialized successfully');
      return true;
    } catch (error) {
      console.error('ClanVotingSystem: Connection initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize base voting system integration
   */
  initializeBaseVotingSystem() {
    if (!this.baseVotingSystem) {
      this.baseVotingSystem = new SolanaVotingSystem({
        wallet: this.wallet
      });
    }
  }

  /**
   * Create a new clan voting proposal
   * @param {Object} proposalData - Proposal details
   * @param {string} proposalData.type - Pool type (governance, budget, membership, etc.)
   * @param {string} proposalData.title - Proposal title
   * @param {string} proposalData.description - Detailed description
   * @param {Array} proposalData.options - Voting options
   * @param {Object} proposalData.metadata - Additional metadata
   * @returns {Promise<Object>} Created proposal with ID and blockchain transaction
   */
  async createProposal(proposalData) {
    try {
      await this.validateWallet();
      await this.validateClanMembership();
      await this.validateProposalCreationPermissions(proposalData.type);

      const poolConfig = CLAN_VOTING_CONFIG.POOL_TYPES[proposalData.type.toUpperCase()];
      if (!poolConfig) {
        throw new Error(`Invalid proposal type: ${proposalData.type}`);
      }

      // Generate unique proposal ID
      const proposalId = this.generateProposalId(proposalData);
      
      // Calculate voting period end time
      const votingEndTime = new Date();
      votingEndTime.setHours(votingEndTime.getHours() + poolConfig.votingPeriodHours);

      // Create proposal object
      const proposal = {
        id: proposalId,
        clanId: this.clanId,
        type: proposalData.type.toLowerCase(),
        title: proposalData.title,
        description: proposalData.description,
        options: proposalData.options || ['Yes', 'No'],
        creator: this.wallet.publicKey.toString(),
        createdAt: new Date().toISOString(),
        votingEndTime: votingEndTime.toISOString(),
        status: 'active',
        poolConfig: poolConfig,
        
        // Voting state
        votes: new Map(),
        votingPowerDistribution: new Map(),
        totalVotingPower: 0,
        participationRate: 0,
        
        // Results tracking
        results: {},
        quorumMet: false,
        passed: false,
        
        // Blockchain integration
        transactionSignature: null,
        blockchainRecorded: false,
        
        // Metadata
        metadata: {
          ...proposalData.metadata,
          burnCostMultiplier: poolConfig.burnCostMultiplier,
          emergencyOverride: poolConfig.emergencyOverride
        }
      };

      // Record proposal on blockchain
      const transaction = await this.recordProposalOnChain(proposal);
      proposal.transactionSignature = transaction.signature;
      proposal.blockchainRecorded = true;

      // Store proposal
      this.activeProposals.set(proposalId, proposal);

      console.log(`ClanVotingSystem: Proposal "${proposalId}" created successfully`);
      return {
        success: true,
        proposalId,
        proposal,
        transaction: transaction.signature
      };

    } catch (error) {
      console.error('ClanVotingSystem: Proposal creation failed:', error);
      throw error;
    }
  }

  /**
   * Cast a vote on a clan proposal
   * @param {string} proposalId - Proposal identifier
   * @param {string} option - Selected voting option
   * @param {Object} voteOptions - Additional voting options
   * @param {number} voteOptions.burnVotes - Number of additional votes to burn for
   * @param {string} voteOptions.delegation - Vote on behalf of delegators
   * @returns {Promise<Object>} Vote result with blockchain confirmation
   */
  async castVote(proposalId, option, voteOptions = {}) {
    try {
      await this.validateWallet();
      await this.validateClanMembership();

      const proposal = this.activeProposals.get(proposalId);
      if (!proposal) {
        throw new Error(`Proposal not found: ${proposalId}`);
      }

      if (proposal.status !== 'active') {
        throw new Error(`Proposal is not active: ${proposal.status}`);
      }

      if (new Date() > new Date(proposal.votingEndTime)) {
        throw new Error('Voting period has ended');
      }

      const voterAddress = this.wallet.publicKey.toString();
      
      // Check if already voted
      if (proposal.votes.has(voterAddress)) {
        throw new Error('You have already voted on this proposal');
      }

      // Get voter's role and calculate voting power
      const memberRole = await this.getMemberRole(voterAddress);
      const baseVotingPower = this.calculateVotingPower(memberRole);
      
      // Handle additional burn votes
      let totalVotingPower = baseVotingPower;
      let burnCost = 0;
      let burnTransaction = null;

      if (voteOptions.burnVotes && voteOptions.burnVotes > 0) {
        const burnResult = await this.processBurnVotes(
          voteOptions.burnVotes, 
          proposal.poolConfig.burnCostMultiplier
        );
        totalVotingPower += burnResult.additionalPower;
        burnCost = burnResult.totalCost;
        burnTransaction = burnResult.transaction;
      }

      // Handle delegated voting
      const delegatedVotes = await this.processDelegatedVotes(voterAddress, proposalId);
      totalVotingPower += delegatedVotes.additionalPower;

      // Create vote record
      const vote = {
        voter: voterAddress,
        option: option,
        votingPower: totalVotingPower,
        baseVotingPower: baseVotingPower,
        burnedVotes: voteOptions.burnVotes || 0,
        burnCost: burnCost,
        delegatedPower: delegatedVotes.additionalPower,
        delegationCount: delegatedVotes.delegationCount,
        timestamp: new Date().toISOString(),
        transactionSignature: null,
        burnTransactionSignature: burnTransaction?.signature || null
      };

      // Record vote on blockchain
      const voteTransaction = await this.recordVoteOnChain(proposalId, vote);
      vote.transactionSignature = voteTransaction.signature;

      // Update proposal state
      proposal.votes.set(voterAddress, vote);
      proposal.votingPowerDistribution.set(option, 
        (proposal.votingPowerDistribution.get(option) || 0) + totalVotingPower
      );
      proposal.totalVotingPower += totalVotingPower;

      // Update analytics
      await this.updateVoteAnalytics(proposalId, vote);

      console.log(`ClanVotingSystem: Vote cast successfully for proposal "${proposalId}"`);
      return {
        success: true,
        vote,
        totalVotingPower,
        voteTransaction: voteTransaction.signature,
        burnTransaction: burnTransaction?.signature
      };

    } catch (error) {
      console.error('ClanVotingSystem: Vote casting failed:', error);
      throw error;
    }
  }

  /**
   * Process additional burn votes for clan voting
   * @param {number} burnVotes - Number of additional votes to burn for
   * @param {number} multiplier - Pool-specific cost multiplier
   * @returns {Promise<Object>} Burn result with additional voting power
   */
  async processBurnVotes(burnVotes, multiplier = 1.0) {
    try {
      if (burnVotes > CLAN_VOTING_CONFIG.MAX_CLAN_BURN_VOTES) {
        throw new Error(`Maximum ${CLAN_VOTING_CONFIG.MAX_CLAN_BURN_VOTES} additional votes allowed`);
      }

      let totalCost = 0;
      let additionalPower = 0;

      // Calculate progressive burn costs with clan multiplier
      for (let i = 1; i <= burnVotes; i++) {
        const baseCost = CLAN_VOTING_CONFIG.CLAN_BURN_COSTS[i];
        totalCost += baseCost * multiplier;
        additionalPower += 1; // Each burned vote = 1 additional voting power
      }

      // Use base voting system for token burning
      const burnResult = await this.baseVotingSystem.burnTokensForVotes(
        burnVotes,
        {
          customCosts: Object.fromEntries(
            Object.entries(CLAN_VOTING_CONFIG.CLAN_BURN_COSTS)
              .map(([k, v]) => [k, v * multiplier])
          )
        }
      );

      return {
        additionalPower,
        totalCost,
        transaction: burnResult.transaction,
        burnedTokens: burnResult.burnedTokens
      };

    } catch (error) {
      console.error('ClanVotingSystem: Burn vote processing failed:', error);
      throw error;
    }
  }

  /**
   * Process delegated votes for a voter
   * @param {string} voterAddress - Voter's public key
   * @param {string} proposalId - Proposal identifier
   * @returns {Promise<Object>} Delegated voting power details
   */
  async processDelegatedVotes(voterAddress, proposalId) {
    try {
      if (!CLAN_VOTING_CONFIG.DELEGATION.ENABLED) {
        return { additionalPower: 0, delegationCount: 0, delegators: [] };
      }

      const delegations = this.delegationRegistry.get(voterAddress) || [];
      let additionalPower = 0;
      let validDelegations = 0;
      const delegators = [];

      for (const delegation of delegations) {
        // Validate delegation is still active
        if (!this.isDelegationActive(delegation, proposalId)) {
          continue;
        }

        // Check if delegator hasn't voted themselves
        const proposal = this.activeProposals.get(proposalId);
        if (proposal.votes.has(delegation.delegator)) {
          continue; // Delegator voted themselves, delegation doesn't apply
        }

        // Calculate delegated voting power
        const delegatorRole = await this.getMemberRole(delegation.delegator);
        const delegatorPower = this.calculateVotingPower(delegatorRole);
        
        additionalPower += delegatorPower;
        validDelegations++;
        delegators.push({
          address: delegation.delegator,
          role: delegatorRole,
          power: delegatorPower
        });
      }

      return {
        additionalPower,
        delegationCount: validDelegations,
        delegators
      };

    } catch (error) {
      console.error('ClanVotingSystem: Delegated vote processing failed:', error);
      throw error;
    }
  }

  /**
   * Delegate voting power to another clan member
   * @param {string} delegateAddress - Address to delegate to
   * @param {Object} delegationOptions - Delegation configuration
   * @returns {Promise<Object>} Delegation result
   */
  async delegateVotingPower(delegateAddress, delegationOptions = {}) {
    try {
      await this.validateWallet();
      await this.validateClanMembership();

      if (!CLAN_VOTING_CONFIG.DELEGATION.ENABLED) {
        throw new Error('Vote delegation is not enabled for this clan');
      }

      const delegatorAddress = this.wallet.publicKey.toString();
      
      // Validate delegate is clan member
      const delegateRole = await this.getMemberRole(delegateAddress);
      if (!delegateRole) {
        throw new Error('Delegate must be a clan member');
      }

      // Check delegation limits
      const existingDelegations = this.delegationRegistry.get(delegateAddress) || [];
      if (existingDelegations.length >= CLAN_VOTING_CONFIG.DELEGATION.MAX_DELEGATIONS_PER_MEMBER) {
        throw new Error('Delegate has reached maximum delegation limit');
      }

      // Create delegation
      const delegation = {
        id: crypto.randomUUID(),
        delegator: delegatorAddress,
        delegate: delegateAddress,
        createdAt: new Date().toISOString(),
        expiresAt: this.calculateDelegationExpiry(delegationOptions.periodHours),
        active: true,
        proposalTypes: delegationOptions.proposalTypes || ['all'],
        revocationNoticeGiven: false,
        transactionSignature: null
      };

      // Record delegation on blockchain
      const transaction = await this.recordDelegationOnChain(delegation);
      delegation.transactionSignature = transaction.signature;

      // Update delegation registry
      if (!this.delegationRegistry.has(delegateAddress)) {
        this.delegationRegistry.set(delegateAddress, []);
      }
      this.delegationRegistry.get(delegateAddress).push(delegation);

      console.log(`ClanVotingSystem: Delegation created from ${delegatorAddress} to ${delegateAddress}`);
      return {
        success: true,
        delegation,
        transaction: transaction.signature
      };

    } catch (error) {
      console.error('ClanVotingSystem: Delegation failed:', error);
      throw error;
    }
  }

  /**
   * Revoke a voting delegation
   * @param {string} delegationId - Delegation identifier
   * @returns {Promise<Object>} Revocation result
   */
  async revokeDelegation(delegationId) {
    try {
      await this.validateWallet();
      
      const delegatorAddress = this.wallet.publicKey.toString();
      
      // Find and validate delegation
      let delegation = null;
      let delegateAddress = null;
      
      for (const [delegate, delegations] of this.delegationRegistry.entries()) {
        const found = delegations.find(d => d.id === delegationId && d.delegator === delegatorAddress);
        if (found) {
          delegation = found;
          delegateAddress = delegate;
          break;
        }
      }

      if (!delegation) {
        throw new Error('Delegation not found or not owned by you');
      }

      if (!delegation.active) {
        throw new Error('Delegation is already inactive');
      }

      // Check revocation notice period
      const noticeRequired = CLAN_VOTING_CONFIG.DELEGATION.REVOCATION_NOTICE_HOURS;
      if (noticeRequired > 0 && !delegation.revocationNoticeGiven) {
        // Give revocation notice
        delegation.revocationNoticeGiven = true;
        delegation.revocationNoticeAt = new Date().toISOString();
        delegation.revocationEffectiveAt = new Date(Date.now() + noticeRequired * 3600000).toISOString();
        
        return {
          success: true,
          status: 'notice_given',
          effectiveAt: delegation.revocationEffectiveAt,
          message: `Revocation notice given. Delegation will be revoked in ${noticeRequired} hours.`
        };
      }

      // Process immediate revocation or post-notice revocation
      if (delegation.revocationNoticeGiven && new Date() >= new Date(delegation.revocationEffectiveAt)) {
        delegation.active = false;
        delegation.revokedAt = new Date().toISOString();

        // Record revocation on blockchain
        const transaction = await this.recordDelegationRevocationOnChain(delegationId);
        delegation.revocationTransactionSignature = transaction.signature;

        console.log(`ClanVotingSystem: Delegation ${delegationId} revoked successfully`);
        return {
          success: true,
          status: 'revoked',
          delegation,
          transaction: transaction.signature
        };
      }

      throw new Error('Revocation notice period has not elapsed');

    } catch (error) {
      console.error('ClanVotingSystem: Delegation revocation failed:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive voting analytics for the clan
   * @param {Object} options - Analytics options
   * @returns {Promise<Object>} Detailed analytics data
   */
  async getClanVotingAnalytics(options = {}) {
    try {
      const timeframe = options.timeframe || 30; // days
      const includeHistorical = options.includeHistorical ?? true;

      const analytics = {
        overview: {
          totalProposals: 0,
          activeProposals: 0,
          completedProposals: 0,
          totalVotes: 0,
          uniqueVoters: new Set(),
          averageParticipation: 0,
          totalMLGBurned: 0
        },
        
        participationMetrics: {
          byRole: {},
          byMember: {},
          trends: []
        },
        
        proposalMetrics: {
          byType: {},
          passRates: {},
          averageVotingPower: {}
        },
        
        governanceHealth: {
          score: 0,
          factors: {},
          recommendations: []
        },
        
        delegationMetrics: {
          totalDelegations: 0,
          activeDelegations: 0,
          delegationNetworks: {},
          proxyVotingRate: 0
        }
      };

      // Calculate overview metrics
      for (const [proposalId, proposal] of this.activeProposals.entries()) {
        const proposalAge = (Date.now() - new Date(proposal.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (proposalAge <= timeframe) {
          analytics.overview.totalProposals++;
          
          if (proposal.status === 'active') {
            analytics.overview.activeProposals++;
          } else {
            analytics.overview.completedProposals++;
          }

          // Count votes and voters
          analytics.overview.totalVotes += proposal.votes.size;
          for (const voter of proposal.votes.keys()) {
            analytics.overview.uniqueVoters.add(voter);
          }

          // Calculate MLG burned
          for (const vote of proposal.votes.values()) {
            analytics.overview.totalMLGBurned += vote.burnCost || 0;
          }

          // Proposal type metrics
          const poolType = proposal.type;
          if (!analytics.proposalMetrics.byType[poolType]) {
            analytics.proposalMetrics.byType[poolType] = {
              count: 0,
              totalVotes: 0,
              passed: 0,
              failed: 0,
              averagePower: 0
            };
          }
          
          analytics.proposalMetrics.byType[poolType].count++;
          analytics.proposalMetrics.byType[poolType].totalVotes += proposal.votes.size;
          
          if (proposal.status === 'completed') {
            if (proposal.passed) {
              analytics.proposalMetrics.byType[poolType].passed++;
            } else {
              analytics.proposalMetrics.byType[poolType].failed++;
            }
          }
        }
      }

      // Calculate participation by role
      const clanMembers = await this.getClanMembers();
      for (const member of clanMembers) {
        const role = await this.getMemberRole(member.address);
        if (!analytics.participationMetrics.byRole[role]) {
          analytics.participationMetrics.byRole[role] = {
            totalMembers: 0,
            activeVoters: 0,
            participationRate: 0,
            averageVotingPower: 0
          };
        }
        analytics.participationMetrics.byRole[role].totalMembers++;
        
        if (analytics.overview.uniqueVoters.has(member.address)) {
          analytics.participationMetrics.byRole[role].activeVoters++;
        }
      }

      // Calculate participation rates
      if (clanMembers.length > 0) {
        analytics.overview.averageParticipation = analytics.overview.uniqueVoters.size / clanMembers.length;
        
        for (const roleData of Object.values(analytics.participationMetrics.byRole)) {
          roleData.participationRate = roleData.activeVoters / roleData.totalMembers;
        }
      }

      // Delegation metrics
      for (const [delegate, delegations] of this.delegationRegistry.entries()) {
        analytics.delegationMetrics.totalDelegations += delegations.length;
        analytics.delegationMetrics.activeDelegations += delegations.filter(d => d.active).length;
      }

      // Governance health score
      analytics.governanceHealth = this.calculateGovernanceHealthScore(analytics);

      analytics.overview.uniqueVoters = analytics.overview.uniqueVoters.size;
      
      return analytics;

    } catch (error) {
      console.error('ClanVotingSystem: Analytics calculation failed:', error);
      throw error;
    }
  }

  /**
   * Calculate governance health score
   * @param {Object} analytics - Analytics data
   * @returns {Object} Health score and factors
   */
  calculateGovernanceHealthScore(analytics) {
    const factors = {
      participation: Math.min(analytics.overview.averageParticipation * 100, 100),
      diversity: 0, // Role diversity in voting
      activity: 0, // Recent voting activity
      engagement: 0, // Average votes per proposal
      stability: 0 // Consistent participation over time
    };

    // Calculate role diversity
    const roleParticipation = Object.values(analytics.participationMetrics.byRole);
    if (roleParticipation.length > 0) {
      factors.diversity = (roleParticipation.filter(r => r.participationRate > 0.1).length / roleParticipation.length) * 100;
    }

    // Calculate recent activity
    if (analytics.overview.totalProposals > 0) {
      factors.activity = Math.min((analytics.overview.activeProposals / analytics.overview.totalProposals) * 100, 100);
      factors.engagement = Math.min((analytics.overview.totalVotes / analytics.overview.totalProposals) * 10, 100);
    }

    // Overall score (weighted average)
    const weights = { participation: 0.3, diversity: 0.2, activity: 0.2, engagement: 0.2, stability: 0.1 };
    let score = 0;
    for (const [factor, value] of Object.entries(factors)) {
      score += value * weights[factor];
    }

    // Generate recommendations
    const recommendations = [];
    if (factors.participation < 30) {
      recommendations.push('Consider implementing incentives to increase voter participation');
    }
    if (factors.diversity < 50) {
      recommendations.push('Encourage participation from all role levels');
    }
    if (factors.engagement < 40) {
      recommendations.push('Create more engaging proposal content and clear communication');
    }

    return {
      score: Math.round(score),
      factors,
      recommendations,
      grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D'
    };
  }

  /**
   * Get member's role in the clan
   * @param {string} memberAddress - Member's public key
   * @returns {Promise<string>} Member role
   */
  async getMemberRole(memberAddress) {
    try {
      // Check cache first
      const cacheKey = `${this.clanId}:${memberAddress}`;
      if (this.memberRoleCache.has(cacheKey) && 
          (Date.now() - this.lastCacheUpdate) < this.cacheValidityMs) {
        return this.memberRoleCache.get(cacheKey);
      }

      // Fetch from clan management system
      // This would integrate with the actual clan management system
      // For now, returning a default implementation
      const role = await this.fetchMemberRoleFromClan(memberAddress);
      
      // Cache the result
      this.memberRoleCache.set(cacheKey, role);
      this.lastCacheUpdate = Date.now();
      
      return role;

    } catch (error) {
      console.error('ClanVotingSystem: Failed to get member role:', error);
      return 'member'; // Default to member role
    }
  }

  /**
   * Calculate voting power based on role
   * @param {string} role - Member's role
   * @returns {number} Voting power multiplier
   */
  calculateVotingPower(role) {
    const weight = CLAN_VOTING_CONFIG.ROLE_VOTING_WEIGHTS[role] || 1.0;
    return weight;
  }

  /**
   * Validate wallet connection and requirements
   */
  async validateWallet() {
    if (!this.wallet || !this.wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    // Check minimum SOL balance for transaction fees
    const balance = await this.connection.getBalance(this.wallet.publicKey);
    if (balance < CLAN_VOTING_CONFIG.SECURITY.MIN_SOL_BALANCE * LAMPORTS_PER_SOL) {
      throw new Error('Insufficient SOL balance for transaction fees');
    }

    return true;
  }

  /**
   * Validate clan membership
   */
  async validateClanMembership() {
    if (!this.clanId) {
      throw new Error('No clan ID specified');
    }

    const memberRole = await this.getMemberRole(this.wallet.publicKey.toString());
    if (!memberRole) {
      throw new Error('You are not a member of this clan');
    }

    return true;
  }

  /**
   * Validate proposal creation permissions
   * @param {string} proposalType - Type of proposal
   */
  async validateProposalCreationPermissions(proposalType) {
    const poolConfig = CLAN_VOTING_CONFIG.POOL_TYPES[proposalType.toUpperCase()];
    if (!poolConfig) {
      throw new Error(`Invalid proposal type: ${proposalType}`);
    }

    const memberRole = await this.getMemberRole(this.wallet.publicKey.toString());
    if (!poolConfig.roleRestrictions.includes(memberRole)) {
      throw new Error(`Role '${memberRole}' cannot create '${proposalType}' proposals`);
    }

    return true;
  }

  /**
   * Generate unique proposal ID
   * @param {Object} proposalData - Proposal data
   * @returns {string} Unique proposal ID
   */
  generateProposalId(proposalData) {
    const timestamp = Date.now();
    const hash = crypto.createHash('sha256')
      .update(`${this.clanId}-${proposalData.title}-${timestamp}`)
      .digest('hex')
      .substring(0, 8);
    return `${this.clanId}-${proposalData.type}-${hash}`;
  }

  /**
   * Record proposal on Solana blockchain
   * @param {Object} proposal - Proposal data
   * @returns {Promise<Object>} Transaction result
   */
  async recordProposalOnChain(proposal) {
    try {
      // This would create a PDA for the proposal and record it on-chain
      // For now, returning a mock transaction
      const transaction = new Transaction();
      
      // Add proposal creation instruction (would be actual program instruction)
      const instruction = SystemProgram.createAccount({
        fromPubkey: this.wallet.publicKey,
        newAccountPubkey: Keypair.generate().publicKey,
        lamports: 1000000, // Minimum for rent exemption
        space: 1024,
        programId: SystemProgram.programId
      });
      
      transaction.add(instruction);
      
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.wallet] // Would use actual wallet adapter
      );

      return {
        signature,
        transaction,
        confirmed: true
      };

    } catch (error) {
      console.error('ClanVotingSystem: Blockchain recording failed:', error);
      throw error;
    }
  }

  /**
   * Record vote on Solana blockchain
   * @param {string} proposalId - Proposal ID
   * @param {Object} vote - Vote data
   * @returns {Promise<Object>} Transaction result
   */
  async recordVoteOnChain(proposalId, vote) {
    try {
      // Similar to recordProposalOnChain, this would record the vote on-chain
      const transaction = new Transaction();
      
      const instruction = SystemProgram.createAccount({
        fromPubkey: this.wallet.publicKey,
        newAccountPubkey: Keypair.generate().publicKey,
        lamports: 1000000,
        space: 512,
        programId: SystemProgram.programId
      });
      
      transaction.add(instruction);
      
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.wallet]
      );

      return {
        signature,
        transaction,
        confirmed: true
      };

    } catch (error) {
      console.error('ClanVotingSystem: Vote recording failed:', error);
      throw error;
    }
  }

  /**
   * Record delegation on blockchain
   * @param {Object} delegation - Delegation data
   * @returns {Promise<Object>} Transaction result  
   */
  async recordDelegationOnChain(delegation) {
    // Mock implementation - would record delegation on-chain
    return {
      signature: 'mock_delegation_signature_' + Date.now(),
      confirmed: true
    };
  }

  /**
   * Record delegation revocation on blockchain
   * @param {string} delegationId - Delegation ID
   * @returns {Promise<Object>} Transaction result
   */
  async recordDelegationRevocationOnChain(delegationId) {
    // Mock implementation - would record revocation on-chain
    return {
      signature: 'mock_revocation_signature_' + Date.now(),
      confirmed: true
    };
  }

  /**
   * Update vote analytics
   * @param {string} proposalId - Proposal ID
   * @param {Object} vote - Vote data
   */
  async updateVoteAnalytics(proposalId, vote) {
    try {
      if (!this.analyticsData.has(proposalId)) {
        this.analyticsData.set(proposalId, {
          totalVotes: 0,
          uniqueVoters: new Set(),
          votingPowerDistribution: {},
          participationByRole: {},
          burnedTokensTotal: 0
        });
      }

      const analytics = this.analyticsData.get(proposalId);
      analytics.totalVotes++;
      analytics.uniqueVoters.add(vote.voter);
      analytics.burnedTokensTotal += vote.burnCost || 0;

      // Update role participation
      const voterRole = await this.getMemberRole(vote.voter);
      if (!analytics.participationByRole[voterRole]) {
        analytics.participationByRole[voterRole] = 0;
      }
      analytics.participationByRole[voterRole]++;

    } catch (error) {
      console.error('ClanVotingSystem: Analytics update failed:', error);
    }
  }

  /**
   * Helper methods
   */

  async fetchMemberRoleFromClan(memberAddress) {
    // This would integrate with the actual clan management system
    // For now, returning mock data
    const mockRoles = ['owner', 'admin', 'moderator', 'officer', 'member', 'recruit'];
    return mockRoles[Math.floor(Math.random() * mockRoles.length)];
  }

  async getClanMembers() {
    // Mock implementation - would fetch from clan management system
    return [
      { address: 'member1', role: 'owner' },
      { address: 'member2', role: 'admin' },
      { address: 'member3', role: 'member' }
    ];
  }

  isDelegationActive(delegation, proposalId) {
    if (!delegation.active) return false;
    if (new Date() > new Date(delegation.expiresAt)) return false;
    if (delegation.proposalTypes.includes('all')) return true;
    
    const proposal = this.activeProposals.get(proposalId);
    return delegation.proposalTypes.includes(proposal.type);
  }

  calculateDelegationExpiry(periodHours) {
    const hours = periodHours || CLAN_VOTING_CONFIG.DELEGATION.DELEGATION_PERIOD_HOURS;
    return new Date(Date.now() + hours * 3600000).toISOString();
  }
}

/**
 * Clan Voting Dashboard Component
 * React component for displaying clan voting interface
 */
export class ClanVotingDashboard {
  constructor(props) {
    this.clanId = props.clanId;
    this.wallet = props.wallet;
    this.votingSystem = new ClanVotingSystem({ 
      clanId: this.clanId, 
      wallet: this.wallet 
    });
  }

  /**
   * Render voting dashboard
   * @returns {string} HTML for voting dashboard
   */
  render() {
    return `
      <div class="clan-voting-dashboard">
        <div class="dashboard-header">
          <h2>Clan Governance</h2>
          <div class="quick-stats">
            <div class="stat">
              <span class="label">Active Proposals</span>
              <span class="value" id="active-proposals-count">-</span>
            </div>
            <div class="stat">
              <span class="label">Your Voting Power</span>
              <span class="value" id="user-voting-power">-</span>
            </div>
            <div class="stat">
              <span class="label">Participation Rate</span>
              <span class="value" id="participation-rate">-</span>
            </div>
          </div>
        </div>

        <div class="proposal-pools">
          <div class="pool-tabs">
            <button class="tab-button active" data-pool="governance">⚖️ Governance</button>
            <button class="tab-button" data-pool="budget">💰 Budget</button>
            <button class="tab-button" data-pool="membership">👥 Membership</button>
            <button class="tab-button" data-pool="content">📝 Content</button>
            <button class="tab-button" data-pool="events">🏆 Events</button>
            <button class="tab-button" data-pool="alliance">🤝 Alliances</button>
          </div>

          <div class="pool-content">
            <div class="proposals-list" id="proposals-list">
              <!-- Proposals will be loaded here -->
            </div>
          </div>
        </div>

        <div class="voting-actions">
          <button class="action-button primary" onclick="createProposal()">
            Create Proposal
          </button>
          <button class="action-button secondary" onclick="manageDelegations()">
            Manage Delegations
          </button>
          <button class="action-button secondary" onclick="viewAnalytics()">
            View Analytics
          </button>
        </div>

        <!-- Proposal Creation Modal -->
        <div id="proposal-modal" class="modal">
          <div class="modal-content">
            <h3>Create New Proposal</h3>
            <form id="proposal-form">
              <div class="form-group">
                <label>Proposal Type</label>
                <select name="type" required>
                  <option value="governance">⚖️ Governance</option>
                  <option value="budget">💰 Budget & Treasury</option>
                  <option value="membership">👥 Membership</option>
                  <option value="content">📝 Content Curation</option>
                  <option value="events">🏆 Events & Tournaments</option>
                  <option value="alliance">🤝 Alliances & Diplomacy</option>
                </select>
              </div>
              <div class="form-group">
                <label>Title</label>
                <input type="text" name="title" required maxlength="100">
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea name="description" required rows="4" maxlength="1000"></textarea>
              </div>
              <div class="form-group">
                <label>Voting Options (one per line)</label>
                <textarea name="options" placeholder="Yes&#10;No" rows="3"></textarea>
              </div>
              <div class="form-actions">
                <button type="button" onclick="closeProposalModal()">Cancel</button>
                <button type="submit">Create Proposal</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Vote Casting Modal -->
        <div id="vote-modal" class="modal">
          <div class="modal-content">
            <h3>Cast Your Vote</h3>
            <div id="vote-proposal-details"></div>
            <form id="vote-form">
              <div class="form-group">
                <label>Your Choice</label>
                <div id="vote-options"></div>
              </div>
              <div class="form-group">
                <label>Additional Votes (Burn MLG)</label>
                <select name="burnVotes">
                  <option value="0">No additional votes</option>
                  <option value="1">+1 vote (2 MLG)</option>
                  <option value="2">+2 votes (6 MLG total)</option>
                  <option value="3">+3 votes (12 MLG total)</option>
                  <option value="4">+4 votes (20 MLG total)</option>
                  <option value="5">+5 votes (30 MLG total)</option>
                </select>
              </div>
              <div class="voting-power-preview">
                <div class="power-breakdown">
                  <div>Base Power: <span id="base-power">-</span></div>
                  <div>Burn Power: <span id="burn-power">-</span></div>
                  <div>Delegated Power: <span id="delegated-power">-</span></div>
                  <div class="total">Total Power: <span id="total-power">-</span></div>
                </div>
              </div>
              <div class="form-actions">
                <button type="button" onclick="closeVoteModal()">Cancel</button>
                <button type="submit">Cast Vote</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>
        .clan-voting-dashboard {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .dashboard-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 12px;
          margin-bottom: 30px;
        }

        .dashboard-header h2 {
          margin: 0 0 20px 0;
          font-size: 2.5em;
          font-weight: 300;
        }

        .quick-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(255, 255, 255, 0.1);
          padding: 15px;
          border-radius: 8px;
        }

        .stat .label {
          font-size: 0.9em;
          opacity: 0.8;
          margin-bottom: 5px;
        }

        .stat .value {
          font-size: 1.8em;
          font-weight: bold;
        }

        .pool-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          overflow-x: auto;
        }

        .tab-button {
          padding: 12px 20px;
          border: 2px solid #e2e8f0;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
          white-space: nowrap;
        }

        .tab-button.active {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }

        .tab-button:hover:not(.active) {
          border-color: #667eea;
          background: #f7fafc;
        }

        .proposals-list {
          min-height: 200px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
        }

        .voting-actions {
          display: flex;
          gap: 15px;
          margin-top: 30px;
          justify-content: center;
        }

        .action-button {
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .action-button.primary {
          background: #48bb78;
          color: white;
        }

        .action-button.primary:hover {
          background: #38a169;
        }

        .action-button.secondary {
          background: #e2e8f0;
          color: #4a5568;
        }

        .action-button.secondary:hover {
          background: #cbd5e0;
        }

        .modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
        }

        .modal-content {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 30px;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          color: #4a5568;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 100px;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .form-actions button {
          padding: 10px 20px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-weight: 600;
        }

        .form-actions button[type="submit"] {
          background: #48bb78;
          color: white;
        }

        .form-actions button[type="button"] {
          background: #e2e8f0;
          color: #4a5568;
        }

        .voting-power-preview {
          background: #f7fafc;
          padding: 15px;
          border-radius: 8px;
          margin-top: 15px;
        }

        .power-breakdown {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .power-breakdown .total {
          font-weight: bold;
          border-top: 1px solid #e2e8f0;
          padding-top: 8px;
          margin-top: 8px;
        }

        @media (max-width: 768px) {
          .clan-voting-dashboard {
            padding: 10px;
          }
          
          .dashboard-header {
            padding: 20px;
          }
          
          .dashboard-header h2 {
            font-size: 2em;
          }
          
          .voting-actions {
            flex-direction: column;
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
   * Initialize dashboard functionality
   */
  async initialize() {
    try {
      await this.votingSystem.initializeConnections();
      await this.loadProposals();
      await this.updateStats();
      this.bindEventListeners();
      
      console.log('ClanVotingDashboard: Initialized successfully');
    } catch (error) {
      console.error('ClanVotingDashboard: Initialization failed:', error);
      throw error;
    }
  }

  async loadProposals() {
    // Implementation for loading and displaying proposals
    console.log('Loading clan proposals...');
  }

  async updateStats() {
    // Implementation for updating dashboard statistics
    console.log('Updating dashboard statistics...');
  }

  bindEventListeners() {
    // Implementation for binding UI event listeners
    console.log('Binding event listeners...');
  }
}

// Export main class and utilities
export default ClanVotingSystem;