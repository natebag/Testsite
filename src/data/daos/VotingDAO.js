/**
 * Voting Data Access Object (DAO) for MLG.clan Platform
 * 
 * Handles all database operations related to voting, proposals, MLG token burns,
 * and governance with comprehensive validation and caching.
 * 
 * Features:
 * - Voting transaction management with MLG token burns
 * - Proposal creation and lifecycle management
 * - Vote casting and validation
 * - Content voting with daily limits
 * - Governance proposal workflows
 * - Vote aggregation and statistics
 * - Real-time vote tracking
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

import Joi from 'joi';
import { BaseDAO } from './BaseDAO.js';

/**
 * Validation schemas for voting operations
 */
const VOTING_SCHEMAS = {
  votingTransaction: Joi.object({
    user_id: Joi.string().uuid().required(),
    blockchain_transaction_id: Joi.string().uuid().required(),
    votes_purchased: Joi.number().integer().min(1).max(4).required(),
    mlg_tokens_burned: Joi.number().positive().required(),
    cost_per_vote: Joi.number().positive().required(),
    valid_until: Joi.date().min('now').optional()
  }),

  proposal: Joi.object({
    clan_id: Joi.string().uuid().optional().allow(null),
    creator_id: Joi.string().uuid().required(),
    title: Joi.string().min(10).max(200).required(),
    description: Joi.string().min(20).max(2000).required(),
    proposal_type: Joi.string().max(50).required(),
    voting_starts_at: Joi.date().optional(),
    voting_ends_at: Joi.date().min(Joi.ref('voting_starts_at')).required(),
    minimum_participation: Joi.number().integer().min(1).default(5),
    metadata: Joi.object().optional(),
    tags: Joi.array().items(Joi.string().max(25)).max(5).optional()
  }),

  contentVote: Joi.object({
    content_id: Joi.string().uuid().required(),
    user_id: Joi.string().uuid().required(),
    vote_type: Joi.string().valid('upvote', 'downvote').required(),
    voting_transaction_id: Joi.string().uuid().optional().allow(null),
    is_daily_vote: Joi.boolean().default(true),
    clan_bonus: Joi.boolean().default(false),
    vote_weight: Joi.number().min(0.1).max(5.0).default(1.0)
  })
};

/**
 * Voting DAO class extending BaseDAO
 */
export class VotingDAO extends BaseDAO {
  constructor(options = {}) {
    super({
      tableName: 'voting_transactions',
      primaryKey: 'id',
      createSchema: VOTING_SCHEMAS.votingTransaction,
      cacheEnabled: true,
      cacheTTL: 180, // 3 minutes for voting data
      cacheKeyPrefix: 'vote',
      ...options
    });

    this.proposalSchema = VOTING_SCHEMAS.proposal;
    this.contentVoteSchema = VOTING_SCHEMAS.contentVote;
  }

  /**
   * Create voting transaction for MLG token burn
   * @param {Object} transactionData - Transaction data
   * @returns {Promise<Object>} Created voting transaction
   */
  async createVotingTransaction(transactionData) {
    const startTime = Date.now();
    
    try {
      // Validate transaction data
      if (this.createSchema) {
        const { error, value } = this.createSchema.validate(transactionData);
        if (error) {
          throw new Error(`Transaction validation error: ${error.message}`);
        }
        transactionData = value;
      }

      // Set default valid_until to end of day
      if (!transactionData.valid_until) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        transactionData.valid_until = tomorrow;
      }

      // Calculate votes remaining
      const createData = {
        ...transactionData,
        votes_remaining: transactionData.votes_purchased,
        votes_used: 0
      };

      const transaction = await this.create(createData);

      this.trackQueryPerformance(startTime, 'createVotingTransaction');
      this.emitEvent('voting_transaction_created', transaction);
      
      return transaction;

    } catch (error) {
      this.handleError('createVotingTransaction', error, { transactionData });
      throw error;
    }
  }

  /**
   * Get available votes for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Available votes summary
   */
  async getAvailableVotes(userId) {
    const startTime = Date.now();
    
    try {
      const query = `
        SELECT 
          COALESCE(SUM(votes_remaining), 0) as purchased_votes_remaining,
          COALESCE(SUM(votes_purchased), 0) as total_purchased_votes,
          COALESCE(SUM(votes_used), 0) as total_votes_used,
          COUNT(*) as transaction_count
        FROM voting_transactions
        WHERE user_id = $1 
          AND votes_remaining > 0 
          AND valid_until > NOW()
      `;

      const result = await this.executeQuery(query, [userId]);
      const votingStats = result.rows[0];

      // Get daily vote status from users table
      const dailyVoteQuery = `
        SELECT 
          daily_vote_count,
          last_vote_reset,
          CASE 
            WHEN last_vote_reset = CURRENT_DATE THEN daily_vote_count
            ELSE 0
          END as today_votes_used,
          CASE 
            WHEN last_vote_reset = CURRENT_DATE THEN (1 - daily_vote_count)
            ELSE 1
          END as daily_votes_remaining
        FROM users
        WHERE id = $1
      `;

      const dailyResult = await this.executeQuery(dailyVoteQuery, [userId]);
      const dailyStats = dailyResult.rows[0] || { 
        daily_vote_count: 0, 
        today_votes_used: 0, 
        daily_votes_remaining: 1 
      };

      const summary = {
        daily_votes_remaining: Math.max(0, parseInt(dailyStats.daily_votes_remaining) || 0),
        purchased_votes_remaining: parseInt(votingStats.purchased_votes_remaining) || 0,
        total_votes_available: Math.max(0, parseInt(dailyStats.daily_votes_remaining) || 0) + 
                               (parseInt(votingStats.purchased_votes_remaining) || 0),
        today_votes_used: parseInt(dailyStats.today_votes_used) || 0,
        total_purchased_votes: parseInt(votingStats.total_purchased_votes) || 0,
        total_votes_used: parseInt(votingStats.total_votes_used) || 0,
        voting_transaction_count: parseInt(votingStats.transaction_count) || 0,
        last_vote_reset: dailyStats.last_vote_reset
      };

      this.trackQueryPerformance(startTime, 'getAvailableVotes');
      return summary;

    } catch (error) {
      this.handleError('getAvailableVotes', error, { userId });
      throw error;
    }
  }

  /**
   * Use votes from available balance
   * @param {string} userId - User ID
   * @param {number} votesToUse - Number of votes to consume
   * @param {Object} options - Usage options
   * @returns {Promise<Object>} Usage result
   */
  async useVotes(userId, votesToUse = 1, options = {}) {
    const startTime = Date.now();
    
    try {
      if (votesToUse <= 0) {
        throw new Error('Votes to use must be positive');
      }

      return await this.executeTransaction(async (txDAO) => {
        // Get current vote status
        const availableVotes = await this.getAvailableVotes(userId);
        
        if (availableVotes.total_votes_available < votesToUse) {
          throw new Error(`Insufficient votes. Available: ${availableVotes.total_votes_available}, Requested: ${votesToUse}`);
        }

        let dailyVotesUsed = 0;
        let purchasedVotesUsed = 0;
        let remainingToUse = votesToUse;

        // Use daily votes first
        if (availableVotes.daily_votes_remaining > 0 && remainingToUse > 0) {
          dailyVotesUsed = Math.min(availableVotes.daily_votes_remaining, remainingToUse);
          remainingToUse -= dailyVotesUsed;
        }

        // Use purchased votes if needed
        if (remainingToUse > 0) {
          purchasedVotesUsed = remainingToUse;
        }

        // Update user daily vote count if using daily votes
        if (dailyVotesUsed > 0) {
          const updateUserQuery = `
            UPDATE users 
            SET 
              daily_vote_count = CASE 
                WHEN last_vote_reset = CURRENT_DATE 
                THEN daily_vote_count + $2
                ELSE $2
              END,
              last_vote_reset = CURRENT_DATE,
              total_votes_cast = total_votes_cast + $2,
              updated_at = NOW()
            WHERE id = $1
          `;
          
          await txDAO.executeQuery(updateUserQuery, [userId, dailyVotesUsed]);
        }

        // Update purchased vote transactions if using purchased votes
        const transactionUpdates = [];
        if (purchasedVotesUsed > 0) {
          let stillNeedToUse = purchasedVotesUsed;
          
          // Get available transactions in order
          const transactionQuery = `
            SELECT id, votes_remaining
            FROM voting_transactions
            WHERE user_id = $1 
              AND votes_remaining > 0 
              AND valid_until > NOW()
            ORDER BY created_at ASC
            FOR UPDATE
          `;
          
          const transactions = await txDAO.executeQuery(transactionQuery, [userId]);
          
          for (const transaction of transactions.rows) {
            if (stillNeedToUse <= 0) break;
            
            const votesToTakeFromTx = Math.min(transaction.votes_remaining, stillNeedToUse);
            stillNeedToUse -= votesToTakeFromTx;
            
            // Update transaction
            await txDAO.executeQuery(`
              UPDATE voting_transactions
              SET 
                votes_remaining = votes_remaining - $2,
                votes_used = votes_used + $2,
                updated_at = NOW()
              WHERE id = $1
            `, [transaction.id, votesToTakeFromTx]);
            
            transactionUpdates.push({
              transaction_id: transaction.id,
              votes_used: votesToTakeFromTx
            });
          }
        }

        // Update user total votes cast if using purchased votes
        if (purchasedVotesUsed > 0) {
          await txDAO.executeQuery(`
            UPDATE users 
            SET total_votes_cast = total_votes_cast + $2, updated_at = NOW()
            WHERE id = $1
          `, [userId, purchasedVotesUsed]);
        }

        const result = {
          votes_used: votesToUse,
          daily_votes_used: dailyVotesUsed,
          purchased_votes_used: purchasedVotesUsed,
          transaction_updates: transactionUpdates,
          remaining_votes: availableVotes.total_votes_available - votesToUse
        };

        this.trackQueryPerformance(startTime, 'useVotes');
        this.emitEvent('votes_used', result, { userId });
        
        return result;
      });

    } catch (error) {
      this.handleError('useVotes', error, { userId, votesToUse, options });
      throw error;
    }
  }

  /**
   * Cast vote on content
   * @param {Object} voteData - Vote data
   * @returns {Promise<Object>} Created vote record
   */
  async castContentVote(voteData) {
    const startTime = Date.now();
    
    try {
      // Validate vote data
      if (this.contentVoteSchema) {
        const { error, value } = this.contentVoteSchema.validate(voteData);
        if (error) {
          throw new Error(`Vote validation error: ${error.message}`);
        }
        voteData = value;
      }

      return await this.executeTransaction(async (txDAO) => {
        // Check if user already voted on this content
        const existingVoteQuery = `
          SELECT id, vote_type FROM content_votes 
          WHERE content_id = $1 AND user_id = $2
        `;
        const existingVote = await txDAO.executeQuery(existingVoteQuery, [voteData.content_id, voteData.user_id]);
        
        if (existingVote.rows.length > 0) {
          const existing = existingVote.rows[0];
          if (existing.vote_type === voteData.vote_type) {
            throw new Error('User has already cast this type of vote on this content');
          }
          
          // Update existing vote instead of creating new one
          const updateQuery = `
            UPDATE content_votes 
            SET vote_type = $3, updated_at = NOW()
            WHERE content_id = $1 AND user_id = $2
            RETURNING *
          `;
          const updateResult = await txDAO.executeQuery(updateQuery, [
            voteData.content_id, 
            voteData.user_id, 
            voteData.vote_type
          ]);
          
          const updatedVote = updateResult.rows[0];
          
          // Update content submission counters
          await this.updateContentVoteCounts(txDAO, voteData.content_id, existing.vote_type, voteData.vote_type);
          
          this.trackQueryPerformance(startTime, 'castContentVote');
          this.emitEvent('content_vote_updated', updatedVote);
          
          return updatedVote;
        }

        // Use votes if not a daily vote or user has no daily votes
        if (!voteData.is_daily_vote || voteData.voting_transaction_id) {
          await this.useVotes(voteData.user_id, 1);
        } else {
          // Check daily vote availability
          const availableVotes = await this.getAvailableVotes(voteData.user_id);
          if (availableVotes.daily_votes_remaining <= 0) {
            throw new Error('No daily votes remaining. Purchase additional votes with MLG tokens.');
          }
          
          // Use daily vote
          await this.useVotes(voteData.user_id, 1);
        }

        // Create vote record
        const voteQuery = `
          INSERT INTO content_votes (
            content_id, user_id, vote_type, voting_transaction_id, 
            is_daily_vote, clan_bonus, vote_weight
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;

        const voteResult = await txDAO.executeQuery(voteQuery, [
          voteData.content_id,
          voteData.user_id,
          voteData.vote_type,
          voteData.voting_transaction_id || null,
          voteData.is_daily_vote,
          voteData.clan_bonus,
          voteData.vote_weight
        ]);

        const vote = voteResult.rows[0];

        // Update content submission counters
        await this.updateContentVoteCounts(txDAO, voteData.content_id, null, voteData.vote_type);

        this.trackQueryPerformance(startTime, 'castContentVote');
        this.emitEvent('content_vote_cast', vote);
        
        return vote;
      });

    } catch (error) {
      this.handleError('castContentVote', error, { voteData });
      throw error;
    }
  }

  /**
   * Update content vote counts
   * @private
   */
  async updateContentVoteCounts(txDAO, contentId, oldVoteType, newVoteType) {
    let upvoteChange = 0;
    let downvoteChange = 0;

    // Calculate changes
    if (oldVoteType === 'upvote' && newVoteType === 'downvote') {
      upvoteChange = -1;
      downvoteChange = 1;
    } else if (oldVoteType === 'downvote' && newVoteType === 'upvote') {
      upvoteChange = 1;
      downvoteChange = -1;
    } else if (!oldVoteType && newVoteType === 'upvote') {
      upvoteChange = 1;
    } else if (!oldVoteType && newVoteType === 'downvote') {
      downvoteChange = 1;
    }

    if (upvoteChange !== 0 || downvoteChange !== 0) {
      await txDAO.executeQuery(`
        UPDATE content_submissions
        SET 
          upvote_count = upvote_count + $2,
          downvote_count = downvote_count + $3,
          updated_at = NOW()
        WHERE id = $1
      `, [contentId, upvoteChange, downvoteChange]);
    }
  }

  /**
   * Create governance proposal
   * @param {Object} proposalData - Proposal data
   * @returns {Promise<Object>} Created proposal
   */
  async createProposal(proposalData) {
    const startTime = Date.now();
    
    try {
      // Validate proposal data
      if (this.proposalSchema) {
        const { error, value } = this.proposalSchema.validate(proposalData);
        if (error) {
          throw new Error(`Proposal validation error: ${error.message}`);
        }
        proposalData = value;
      }

      // Set default voting start time
      if (!proposalData.voting_starts_at) {
        proposalData.voting_starts_at = new Date();
      }

      const proposalQuery = `
        INSERT INTO voting_proposals (
          clan_id, creator_id, title, description, proposal_type,
          voting_starts_at, voting_ends_at, minimum_participation,
          metadata, tags, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const values = [
        proposalData.clan_id || null,
        proposalData.creator_id,
        proposalData.title,
        proposalData.description,
        proposalData.proposal_type,
        proposalData.voting_starts_at,
        proposalData.voting_ends_at,
        proposalData.minimum_participation,
        JSON.stringify(proposalData.metadata || {}),
        proposalData.tags || [],
        'active'
      ];

      const result = await this.executeQuery(proposalQuery, values);
      const proposal = result.rows[0];

      this.trackQueryPerformance(startTime, 'createProposal');
      this.emitEvent('proposal_created', proposal);
      
      return proposal;

    } catch (error) {
      this.handleError('createProposal', error, { proposalData });
      throw error;
    }
  }

  /**
   * Vote on proposal
   * @param {string} proposalId - Proposal ID
   * @param {string} userId - User ID
   * @param {string} voteType - 'upvote' or 'downvote'
   * @param {Object} options - Vote options
   * @returns {Promise<Object>} Vote result
   */
  async voteOnProposal(proposalId, userId, voteType, options = {}) {
    const startTime = Date.now();
    
    try {
      if (!['upvote', 'downvote'].includes(voteType)) {
        throw new Error(`Invalid vote type: ${voteType}`);
      }

      return await this.executeTransaction(async (txDAO) => {
        // Get proposal details
        const proposalQuery = `
          SELECT * FROM voting_proposals
          WHERE id = $1 AND status = 'active' 
            AND voting_starts_at <= NOW() AND voting_ends_at > NOW()
        `;
        const proposalResult = await txDAO.executeQuery(proposalQuery, [proposalId]);
        
        if (proposalResult.rows.length === 0) {
          throw new Error('Proposal not found, inactive, or voting period ended');
        }

        const proposal = proposalResult.rows[0];

        // Check if user is eligible to vote (clan member if clan proposal)
        if (proposal.clan_id) {
          const memberQuery = `
            SELECT id FROM clan_members 
            WHERE clan_id = $1 AND user_id = $2 AND is_active = true
          `;
          const memberResult = await txDAO.executeQuery(memberQuery, [proposal.clan_id, userId]);
          
          if (memberResult.rows.length === 0) {
            throw new Error('User is not a member of this clan');
          }
        }

        // Check if user already voted
        // For proposals, we'll store votes in a separate table or use metadata
        // For now, we'll use the voting_proposals metadata field to track voters
        const metadata = proposal.metadata || {};
        const voters = metadata.voters || {};
        
        if (voters[userId]) {
          throw new Error('User has already voted on this proposal');
        }

        // Update proposal vote counts and voter tracking
        const upvoteIncrement = voteType === 'upvote' ? 1 : 0;
        const downvoteIncrement = voteType === 'downvote' ? 1 : 0;
        
        // Update metadata with voter
        metadata.voters = { ...voters, [userId]: { vote: voteType, timestamp: new Date() } };

        const updateQuery = `
          UPDATE voting_proposals
          SET 
            upvotes = upvotes + $2,
            downvotes = downvotes + $3,
            total_participants = total_participants + 1,
            metadata = $4,
            updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `;

        const updateResult = await txDAO.executeQuery(updateQuery, [
          proposalId,
          upvoteIncrement,
          downvoteIncrement,
          JSON.stringify(metadata)
        ]);

        const updatedProposal = updateResult.rows[0];

        // Check if proposal should be finalized
        const shouldFinalize = await this.checkProposalFinalization(txDAO, updatedProposal);
        if (shouldFinalize) {
          await this.finalizeProposal(txDAO, proposalId);
        }

        this.trackQueryPerformance(startTime, 'voteOnProposal');
        this.emitEvent('proposal_vote_cast', {
          proposal: updatedProposal,
          voter_id: userId,
          vote_type: voteType
        });
        
        return {
          proposal: updatedProposal,
          vote_type: voteType,
          finalized: shouldFinalize
        };
      });

    } catch (error) {
      this.handleError('voteOnProposal', error, { proposalId, userId, voteType, options });
      throw error;
    }
  }

  /**
   * Check if proposal should be finalized
   * @private
   */
  async checkProposalFinalization(txDAO, proposal) {
    // Finalize if minimum participation reached and majority vote
    if (proposal.total_participants >= proposal.minimum_participation) {
      const totalVotes = proposal.upvotes + proposal.downvotes;
      if (totalVotes > 0) {
        const approvalRate = proposal.upvotes / totalVotes;
        return approvalRate > 0.5; // Simple majority
      }
    }
    return false;
  }

  /**
   * Finalize proposal
   * @private
   */
  async finalizeProposal(txDAO, proposalId) {
    const query = `
      UPDATE voting_proposals
      SET 
        status = CASE 
          WHEN upvotes > downvotes THEN 'passed'
          ELSE 'failed'
        END,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await txDAO.executeQuery(query, [proposalId]);
    const proposal = result.rows[0];

    this.emitEvent('proposal_finalized', proposal);
    return proposal;
  }

  /**
   * Get user voting history
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Voting history
   */
  async getUserVotingHistory(userId, options = {}) {
    const startTime = Date.now();
    const { limit = 50, offset = 0, type = 'all' } = options;
    
    try {
      let query;
      let countQuery;
      const params = [userId];

      if (type === 'content' || type === 'all') {
        // Content votes
        query = `
          SELECT 
            'content' as vote_type,
            cv.id,
            cv.vote_type as vote,
            cv.created_at,
            cv.is_daily_vote,
            cv.vote_weight,
            cs.title as content_title,
            cs.game_title,
            cs.content_type,
            u.username as content_creator
          FROM content_votes cv
          JOIN content_submissions cs ON cv.content_id = cs.id
          JOIN users u ON cs.user_id = u.id
          WHERE cv.user_id = $1
          ORDER BY cv.created_at DESC
          LIMIT $2 OFFSET $3
        `;

        countQuery = `
          SELECT COUNT(*) as total FROM content_votes WHERE user_id = $1
        `;
      }

      const result = await this.executeQuery(query, [userId, limit, offset]);
      const countResult = await this.executeQuery(countQuery, [userId]);
      const total = parseInt(countResult.rows[0].total);

      this.trackQueryPerformance(startTime, 'getUserVotingHistory');

      return {
        votes: result.rows,
        pagination: {
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit),
          currentPage: Math.floor(offset / limit) + 1
        }
      };

    } catch (error) {
      this.handleError('getUserVotingHistory', error, { userId, options });
      throw error;
    }
  }

  /**
   * Get voting statistics for user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Voting statistics
   */
  async getUserVotingStats(userId, options = {}) {
    const startTime = Date.now();
    const { days = 30 } = options;
    
    try {
      const query = `
        SELECT 
          -- Overall stats
          u.total_votes_cast,
          u.total_mlg_burned,
          u.consecutive_days_voted,
          u.daily_vote_count as today_votes_used,
          
          -- Recent content voting
          (SELECT COUNT(*) FROM content_votes cv 
           WHERE cv.user_id = u.id AND cv.created_at > NOW() - INTERVAL '${days} days') as recent_content_votes,
           
          (SELECT COUNT(*) FROM content_votes cv 
           WHERE cv.user_id = u.id AND cv.vote_type = 'upvote' 
           AND cv.created_at > NOW() - INTERVAL '${days} days') as recent_upvotes,
           
          (SELECT COUNT(*) FROM content_votes cv 
           WHERE cv.user_id = u.id AND cv.vote_type = 'downvote' 
           AND cv.created_at > NOW() - INTERVAL '${days} days') as recent_downvotes,
           
          -- Purchased votes
          (SELECT COALESCE(SUM(votes_purchased), 0) FROM voting_transactions vt 
           WHERE vt.user_id = u.id) as total_votes_purchased,
           
          (SELECT COALESCE(SUM(votes_remaining), 0) FROM voting_transactions vt 
           WHERE vt.user_id = u.id AND vt.valid_until > NOW()) as remaining_purchased_votes,
           
          -- MLG spending
          (SELECT COALESCE(SUM(mlg_tokens_burned), 0) FROM voting_transactions vt 
           WHERE vt.user_id = u.id AND vt.created_at > NOW() - INTERVAL '${days} days') as recent_mlg_spent
           
        FROM users u
        WHERE u.id = $1
      `;

      const result = await this.executeQuery(query, [userId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const stats = result.rows[0];
      
      // Convert to numbers and add derived metrics
      Object.keys(stats).forEach(key => {
        if (stats[key] !== null && !isNaN(stats[key])) {
          stats[key] = parseInt(stats[key]) || 0;
        }
      });

      // Calculate voting efficiency
      stats.voting_efficiency = stats.recent_content_votes > 0 
        ? (stats.recent_upvotes / stats.recent_content_votes) * 100 
        : 0;

      // Calculate daily vote utilization
      stats.daily_vote_utilization = (stats.today_votes_used / 1) * 100; // Assuming 1 daily vote

      this.trackQueryPerformance(startTime, 'getUserVotingStats');
      return stats;

    } catch (error) {
      this.handleError('getUserVotingStats', error, { userId, options });
      throw error;
    }
  }

  /**
   * Get active proposals
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Active proposals
   */
  async getActiveProposals(options = {}) {
    const startTime = Date.now();
    const { 
      limit = 25, 
      offset = 0, 
      clanId = null, 
      proposalType = null,
      sortBy = 'created_at'
    } = options;
    
    try {
      let whereConditions = [
        "vp.status = 'active'",
        "vp.voting_starts_at <= NOW()",
        "vp.voting_ends_at > NOW()"
      ];
      const params = [];
      let paramIndex = 1;

      if (clanId) {
        whereConditions.push(`vp.clan_id = $${paramIndex}`);
        params.push(clanId);
        paramIndex++;
      }

      if (proposalType) {
        whereConditions.push(`vp.proposal_type = $${paramIndex}`);
        params.push(proposalType);
        paramIndex++;
      }

      const orderByClause = sortBy === 'votes' 
        ? 'vp.total_participants DESC' 
        : sortBy === 'ending' 
        ? 'vp.voting_ends_at ASC'
        : 'vp.created_at DESC';

      const query = `
        SELECT 
          vp.*,
          u.username as creator_username,
          up.display_name as creator_display_name,
          c.name as clan_name,
          c.slug as clan_slug,
          EXTRACT(EPOCH FROM (vp.voting_ends_at - NOW())) / 3600 as hours_remaining
        FROM voting_proposals vp
        JOIN users u ON vp.creator_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN clans c ON vp.clan_id = c.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY ${orderByClause}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      const result = await this.executeQuery(query, params);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM voting_proposals vp
        WHERE ${whereConditions.join(' AND ')}
      `;

      const countResult = await this.executeQuery(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      this.trackQueryPerformance(startTime, 'getActiveProposals');

      return {
        proposals: result.rows,
        pagination: {
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit),
          currentPage: Math.floor(offset / limit) + 1
        }
      };

    } catch (error) {
      this.handleError('getActiveProposals', error, options);
      throw error;
    }
  }
}

export default VotingDAO;