/**
 * Voting Repository for MLG.clan Platform
 * 
 * Business logic layer for voting system, MLG token burns, proposal management,
 * and vote aggregation. Orchestrates complex voting workflows across DAOs.
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

import { BaseRepository } from './BaseRepository.js';

export class VotingRepository extends BaseRepository {
  constructor(options = {}) {
    super(options);
    
    this.votingDAO = this.daos.voting;
    this.userDAO = this.daos.user;
    this.clanDAO = this.daos.clan;
    this.contentDAO = this.daos.content;
    this.transactionDAO = this.daos.transaction;
    
    this.setupValidators();
    this.setupBusinessRules();
  }

  setupValidators() {
    this.registerValidator('purchaseVotes', this.validateVotePurchase.bind(this));
    this.registerValidator('castVote', this.validateVoteCasting.bind(this));
    this.registerValidator('createProposal', this.validateProposalCreation.bind(this));
    this.registerValidator('closeProposal', this.validateProposalClosure.bind(this));
  }

  setupBusinessRules() {
    this.registerBusinessRule('dailyVoteLimit', this.validateDailyVoteLimit.bind(this));
    this.registerBusinessRule('voteWeight', this.calculateVoteWeight.bind(this));
    this.registerBusinessRule('proposalPermissions', this.validateProposalPermissions.bind(this));
    this.registerBusinessRule('mlgBurnRatio', this.validateMLGBurnRatio.bind(this));
  }

  async validateVotePurchase(context) {
    const { userId, voteCount, mlgAmount, transactionId } = context;
    
    // Validate daily vote limit
    await this.validateBusinessRule('dailyVoteLimit', {
      userId,
      requestedVotes: voteCount
    });

    // Validate MLG burn ratio
    await this.validateBusinessRule('mlgBurnRatio', {
      voteCount,
      mlgAmount
    });

    // Verify blockchain transaction
    if (transactionId) {
      const transaction = await this.transactionDAO.findById(transactionId);
      if (!transaction || transaction.status !== 'confirmed') {
        throw new Error('MLG burn transaction not confirmed');
      }
    }
  }

  async validateVoteCasting(context) {
    const { userId, targetId, targetType, voteType } = context;
    
    // Check if user has available votes
    const dailyVotes = await this.votingDAO.getUserDailyVotes(userId);
    if (!dailyVotes || dailyVotes.votes_remaining <= 0) {
      throw new Error('No votes remaining for today');
    }

    // Check if user already voted on this target
    const existingVote = await this.votingDAO.getUserVote(userId, targetId, targetType);
    if (existingVote) {
      throw new Error('User has already voted on this item');
    }

    // Validate target exists
    await this.validateVoteTarget(targetId, targetType);
  }

  async validateProposalCreation(context) {
    const { userId, clanId, proposalData } = context;
    
    if (clanId) {
      // Validate clan proposal permissions
      await this.validateBusinessRule('proposalPermissions', {
        userId,
        clanId,
        requiredRole: 'member'
      });

      // Check clan governance settings
      const clan = await this.clanDAO.findById(clanId);
      if (!clan.voting_enabled) {
        throw new Error('Voting is disabled for this clan');
      }
    }

    // Validate proposal timing
    const now = new Date();
    const startTime = new Date(proposalData.voting_starts_at || now);
    const endTime = new Date(proposalData.voting_ends_at);
    
    if (endTime <= startTime) {
      throw new Error('Voting end time must be after start time');
    }
  }

  async validateProposalClosure(context) {
    const { proposalId, userId } = context;
    
    const proposal = await this.votingDAO.getProposal(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    if (proposal.status !== 'active') {
      throw new Error('Proposal is not active');
    }

    // Check if voting period has ended
    if (new Date() < new Date(proposal.voting_ends_at)) {
      throw new Error('Voting period has not ended yet');
    }

    // Validate user has permission to close
    if (proposal.clan_id) {
      await this.validateBusinessRule('proposalPermissions', {
        userId,
        clanId: proposal.clan_id,
        requiredRole: 'moderator'
      });
    }
  }

  async validateVoteTarget(targetId, targetType) {
    let target = null;
    
    switch (targetType) {
      case 'content':
        target = await this.contentDAO.findById(targetId);
        if (!target || target.moderation_status !== 'approved') {
          throw new Error('Content not found or not approved for voting');
        }
        break;
      case 'proposal':
        target = await this.votingDAO.getProposal(targetId);
        if (!target || target.status !== 'active') {
          throw new Error('Proposal not found or not active');
        }
        break;
      default:
        throw new Error(`Unsupported vote target type: ${targetType}`);
    }
    
    return target;
  }

  async validateDailyVoteLimit(data) {
    const { userId, requestedVotes } = data;
    
    const dailyVotes = await this.votingDAO.getUserDailyVotes(userId);
    const currentVotes = dailyVotes ? dailyVotes.votes_purchased_today : 0;
    const maxDaily = 4; // Platform limit
    
    if (currentVotes + requestedVotes > maxDaily) {
      throw new Error(`Daily vote limit exceeded. Maximum ${maxDaily} votes per day.`);
    }
    
    return true;
  }

  async calculateVoteWeight(data) {
    const { userId, clanId } = data;
    
    let baseWeight = 1;
    
    // Get user multipliers
    const user = await this.userDAO.findById(userId);
    if (user) {
      // Reputation-based weight bonus (max +50%)
      const reputationBonus = Math.min(0.5, user.reputation_score / 1000);
      baseWeight += reputationBonus;
    }
    
    // Clan membership bonus
    if (clanId) {
      const membership = await this.clanDAO.getMembership(clanId, userId);
      if (membership) {
        // Role-based bonuses
        const roleBonus = {
          member: 0,
          moderator: 0.1,
          admin: 0.2,
          owner: 0.3
        };
        baseWeight += roleBonus[membership.role] || 0;
        
        // Clan tier bonus
        const clan = await this.clanDAO.findById(clanId);
        const tierBonus = {
          bronze: 0,
          silver: 0.05,
          gold: 0.1,
          diamond: 0.15
        };
        baseWeight += tierBonus[clan.tier] || 0;
      }
    }
    
    return Math.min(2.0, baseWeight); // Cap at 2x weight
  }

  async validateProposalPermissions(data) {
    const { userId, clanId, requiredRole } = data;
    
    const membership = await this.clanDAO.getMembership(clanId, userId);
    if (!membership) {
      throw new Error('User is not a member of this clan');
    }
    
    const roleHierarchy = ['member', 'moderator', 'admin', 'owner'];
    const userLevel = roleHierarchy.indexOf(membership.role);
    const requiredLevel = roleHierarchy.indexOf(requiredRole);
    
    if (userLevel < requiredLevel) {
      throw new Error(`Insufficient permissions: ${requiredRole} role required`);
    }
    
    return true;
  }

  async validateMLGBurnRatio(data) {
    const { voteCount, mlgAmount } = data;
    
    // Current rate: 25 MLG per vote (can be dynamic)
    const currentRate = 25;
    const requiredAmount = voteCount * currentRate;
    
    if (mlgAmount < requiredAmount) {
      throw new Error(`Insufficient MLG tokens: ${requiredAmount} required for ${voteCount} votes`);
    }
    
    return true;
  }

  /**
   * Purchase votes with MLG token burn
   */
  async purchaseVotes(userId, voteCount, transactionData) {
    return await this.executeOperation('purchaseVotes', async () => {
      return await this.executeTransaction(async () => {
        const currentRate = 25; // MLG per vote
        const totalCost = voteCount * currentRate;
        
        // Create voting transaction record
        const votingTx = await this.votingDAO.createVotingTransaction({
          user_id: userId,
          blockchain_transaction_id: transactionData.transactionId,
          votes_purchased: voteCount,
          mlg_tokens_burned: totalCost,
          cost_per_vote: currentRate,
          valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });

        // Update blockchain transaction status
        if (transactionData.transactionId) {
          await this.transactionDAO.update(transactionData.transactionId, {
            voting_transaction_id: votingTx.id,
            status: 'processed',
            processed_at: new Date()
          });
        }

        // Update user daily votes
        await this.votingDAO.updateUserDailyVotes(userId, {
          votes_purchased_today: { operator: '+', value: voteCount },
          votes_remaining: { operator: '+', value: voteCount },
          total_mlg_burned: { operator: '+', value: totalCost }
        });

        // Update user statistics
        if (this.userDAO) {
          await this.userDAO.updateUserStats(userId, {
            total_votes_purchased: { operator: '+', value: voteCount },
            total_mlg_burned: { operator: '+', value: totalCost }
          });
        }

        // Emit vote purchase event
        if (this.eventEmitter) {
          this.eventEmitter.emit('voting:votesPurchased', {
            userId,
            voteCount,
            mlgBurned: totalCost,
            transaction: votingTx
          });
        }

        return votingTx;
      });
    }, { userId, voteCount, mlgAmount: transactionData.amount, transactionId: transactionData.transactionId });
  }

  /**
   * Cast vote on content or proposal
   */
  async castVote(userId, targetId, targetType, voteType, metadata = {}) {
    return await this.executeOperation('castVote', async () => {
      return await this.executeTransaction(async () => {
        // Calculate vote weight
        const voteWeight = await this.validateBusinessRule('voteWeight', {
          userId,
          clanId: metadata.clanId
        });

        // Create vote record
        const vote = await this.votingDAO.createVote({
          user_id: userId,
          target_id: targetId,
          target_type: targetType,
          vote_type: voteType,
          vote_weight: voteWeight,
          clan_context: metadata.clanId,
          metadata
        });

        // Update user daily votes
        await this.votingDAO.updateUserDailyVotes(userId, {
          votes_remaining: { operator: '-', value: 1 },
          votes_cast_today: { operator: '+', value: 1 }
        });

        // Update target vote counts
        await this.updateTargetVoteCounts(targetId, targetType, voteType, voteWeight);

        // Update user voting statistics
        if (this.userDAO) {
          await this.userDAO.updateUserStats(userId, {
            total_votes_cast: { operator: '+', value: 1 }
          });
        }

        // Update clan statistics if applicable
        if (metadata.clanId && this.clanDAO) {
          await this.clanDAO.updateClanStats(metadata.clanId, {
            total_votes_cast: { operator: '+', value: 1 }
          });
        }

        // Emit vote cast event
        if (this.eventEmitter) {
          this.eventEmitter.emit('voting:voteCast', {
            vote,
            userId,
            targetId,
            targetType,
            voteType,
            voteWeight
          });
        }

        return vote;
      });
    }, { userId, targetId, targetType, voteType });
  }

  /**
   * Update vote counts for the target
   */
  async updateTargetVoteCounts(targetId, targetType, voteType, voteWeight) {
    const updates = {};
    
    if (voteType === 'upvote') {
      updates.upvote_count = { operator: '+', value: 1 };
      updates.upvote_weight = { operator: '+', value: voteWeight };
    } else if (voteType === 'downvote') {
      updates.downvote_count = { operator: '+', value: 1 };
      updates.downvote_weight = { operator: '+', value: voteWeight };
    }
    
    // Calculate new score
    updates.vote_score = { recalculate: true };
    
    switch (targetType) {
      case 'content':
        await this.contentDAO.updateVoteStats(targetId, updates);
        break;
      case 'proposal':
        await this.votingDAO.updateProposalVotes(targetId, updates);
        break;
    }
  }

  /**
   * Create governance proposal
   */
  async createProposal(proposalData, creatorId) {
    return await this.executeOperation('createProposal', async () => {
      const proposal = await this.votingDAO.createProposal({
        ...proposalData,
        creator_id: creatorId,
        status: 'active',
        created_at: new Date(),
        voting_starts_at: proposalData.voting_starts_at || new Date()
      });

      // Update clan governance activity if applicable
      if (proposalData.clan_id && this.clanDAO) {
        await this.clanDAO.updateClanStats(proposalData.clan_id, {
          total_proposals: { operator: '+', value: 1 }
        });
      }

      // Emit proposal creation event
      if (this.eventEmitter) {
        this.eventEmitter.emit('voting:proposalCreated', {
          proposal,
          creatorId,
          clanId: proposalData.clan_id
        });
      }

      return proposal;
    }, { proposalData, creatorId });
  }

  /**
   * Close proposal and calculate results
   */
  async closeProposal(proposalId, closerId) {
    return await this.executeOperation('closeProposal', async () => {
      return await this.executeTransaction(async () => {
        const proposal = await this.votingDAO.getProposal(proposalId);
        
        // Calculate final results
        const results = await this.calculateProposalResults(proposalId);
        
        // Update proposal status
        const updatedProposal = await this.votingDAO.updateProposal(proposalId, {
          status: 'closed',
          closed_at: new Date(),
          closed_by: closerId,
          final_results: results
        });

        // Update clan governance stats if applicable
        if (proposal.clan_id && this.clanDAO) {
          await this.clanDAO.updateClanStats(proposal.clan_id, {
            total_proposals_closed: { operator: '+', value: 1 }
          });
        }

        // Emit proposal closure event
        if (this.eventEmitter) {
          this.eventEmitter.emit('voting:proposalClosed', {
            proposal: updatedProposal,
            results,
            closerId
          });
        }

        return { proposal: updatedProposal, results };
      });
    }, { proposalId, userId: closerId });
  }

  /**
   * Calculate proposal voting results
   */
  async calculateProposalResults(proposalId) {
    const [
      voteStats,
      participantStats,
      voteBreakdown
    ] = await Promise.all([
      this.votingDAO.getProposalVoteStats(proposalId),
      this.votingDAO.getProposalParticipants(proposalId),
      this.votingDAO.getProposalVoteBreakdown(proposalId)
    ]);

    const totalWeight = voteStats.total_upvote_weight + voteStats.total_downvote_weight;
    const approvalRate = totalWeight > 0 ? 
      (voteStats.total_upvote_weight / totalWeight) * 100 : 0;

    return {
      totalVotes: voteStats.total_votes,
      totalParticipants: participantStats.unique_voters,
      upvotes: voteStats.upvote_count,
      downvotes: voteStats.downvote_count,
      upvoteWeight: voteStats.total_upvote_weight,
      downvoteWeight: voteStats.total_downvote_weight,
      approvalRate: Math.round(approvalRate * 100) / 100,
      passed: approvalRate >= 50, // Simple majority
      breakdown: voteBreakdown
    };
  }

  /**
   * Get user voting dashboard
   */
  async getUserVotingDashboard(userId) {
    return await this.executeOperation('getUserVotingDashboard', async () => {
      const [
        dailyVotes,
        votingHistory,
        votingStats,
        activeProposals
      ] = await Promise.all([
        this.votingDAO.getUserDailyVotes(userId),
        this.votingDAO.getUserVotingHistory(userId, { limit: 10 }),
        this.votingDAO.getUserVotingStats(userId),
        this.votingDAO.getActiveProposals({ limit: 5 })
      ]);

      return {
        dailyVotes,
        recentVotes: votingHistory,
        stats: votingStats,
        activeProposals,
        timestamp: new Date()
      };
    }, { userId });
  }

  /**
   * Get content voting leaderboard
   */
  async getContentVotingLeaderboard(options = {}) {
    return await this.executeOperation('getContentVotingLeaderboard', async () => {
      const timeframe = options.timeframe || '7d';
      return await this.votingDAO.getVotingLeaderboard('content', timeframe, options);
    }, { options });
  }

  /**
   * Get proposal voting analytics
   */
  async getProposalAnalytics(proposalId) {
    return await this.executeOperation('getProposalAnalytics', async () => {
      const [
        voteTimeline,
        participantBreakdown,
        clanParticipation
      ] = await Promise.all([
        this.votingDAO.getProposalVoteTimeline(proposalId),
        this.votingDAO.getProposalParticipantBreakdown(proposalId),
        this.votingDAO.getProposalClanParticipation(proposalId)
      ]);

      return {
        timeline: voteTimeline,
        participants: participantBreakdown,
        clanParticipation: clanParticipation
      };
    }, { proposalId });
  }

  /**
   * Refresh daily vote allocations (called by scheduler)
   */
  async refreshDailyVoteAllocations() {
    return await this.executeOperation('refreshDailyVotes', async () => {
      const resetCount = await this.votingDAO.resetAllUserDailyVotes();
      
      // Emit daily reset event
      if (this.eventEmitter) {
        this.eventEmitter.emit('voting:dailyVotesReset', {
          usersReset: resetCount,
          timestamp: new Date()
        });
      }

      return { usersReset: resetCount };
    });
  }

  async updateAnalytics(operationName, result, context) {
    // Track voting-specific analytics
    if (this.metrics) {
      this.metrics.recordVotingOperation(operationName, context.userId, context.targetType);
    }
  }
}

export default VotingRepository;