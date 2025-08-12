/**
 * Voting Controller for MLG.clan API
 * 
 * Handles MLG token burning for votes, vote casting, proposals,
 * and voting-related operations using the VotingRepository.
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

import { asyncHandler } from '../middleware/error.middleware.js';
import { APIErrors } from '../middleware/error.middleware.js';

/**
 * Voting Controller Class
 */
export class VotingController {
  /**
   * Purchase votes by burning MLG tokens
   * POST /api/voting/votes/purchase
   */
  static purchaseVotes = asyncHandler(async (req, res) => {
    const { amount, transactionId } = req.body;
    
    const votingRepository = req.services.votingRepository;
    if (!votingRepository) {
      throw APIErrors.INTERNAL_ERROR('Voting service unavailable');
    }
    
    try {
      const purchaseResult = await votingRepository.purchaseVotes(
        req.user.id,
        amount,
        transactionId
      );
      
      // Emit vote purchase event
      if (req.io) {
        req.io.to(`user:${req.user.id}`).emit('votes_purchased', {
          userId: req.user.id,
          amount,
          votesReceived: purchaseResult.votesReceived,
          transactionId
        });
      }
      
      res.status(200).json({
        success: true,
        data: purchaseResult,
        message: 'Votes purchased successfully'
      });
      
    } catch (error) {
      if (error.message.includes('not confirmed') || error.message.includes('transaction')) {
        throw APIErrors.BUSINESS_RULE_VIOLATION('Transaction validation', error.message);
      }
      
      if (error.message.includes('insufficient')) {
        throw APIErrors.BUSINESS_RULE_VIOLATION('Token balance', 'Insufficient MLG tokens for purchase');
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Cast vote on content
   * POST /api/voting/votes/cast
   */
  static castVote = asyncHandler(async (req, res) => {
    const { contentId, voteType, votePower = 1 } = req.body;
    
    const votingRepository = req.services.votingRepository;
    if (!votingRepository) {
      throw APIErrors.INTERNAL_ERROR('Voting service unavailable');
    }
    
    try {
      const voteResult = await votingRepository.castVote(
        req.user.id,
        contentId,
        voteType,
        votePower
      );
      
      // Emit vote cast event
      if (req.io) {
        // Notify content owner
        if (voteResult.contentOwnerId) {
          req.io.to(`user:${voteResult.contentOwnerId}`).emit('content_voted', {
            contentId,
            voteType,
            votePower,
            voterUsername: req.user.username || 'Anonymous'
          });
        }
        
        // Real-time vote count updates
        req.io.emit('vote_update', {
          contentId,
          voteType,
          newCounts: voteResult.voteCounts
        });
      }
      
      res.status(200).json({
        success: true,
        data: voteResult,
        message: 'Vote cast successfully'
      });
      
    } catch (error) {
      if (error.message.includes('not found')) {
        throw APIErrors.RESOURCE_NOT_FOUND('Content', contentId);
      }
      
      if (error.message.includes('insufficient votes') || error.message.includes('daily limit')) {
        throw APIErrors.BUSINESS_RULE_VIOLATION('Vote limits', error.message);
      }
      
      if (error.message.includes('already voted')) {
        throw APIErrors.RESOURCE_CONFLICT('Vote', 'User already voted on this content');
      }
      
      if (error.message.includes('own content')) {
        throw APIErrors.BUSINESS_RULE_VIOLATION('Self-voting', 'Cannot vote on your own content');
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Get daily vote status for user
   * GET /api/voting/votes/daily
   */
  static getDailyVoteStatus = asyncHandler(async (req, res) => {
    const votingRepository = req.services.votingRepository;
    if (!votingRepository) {
      throw APIErrors.INTERNAL_ERROR('Voting service unavailable');
    }
    
    try {
      const voteStatus = await votingRepository.getUserVoteStatus(req.user.id);
      
      res.status(200).json({
        success: true,
        data: {
          voteStatus
        },
        message: 'Daily vote status retrieved successfully'
      });
      
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Create governance proposal
   * POST /api/voting/proposals
   */
  static createProposal = asyncHandler(async (req, res) => {
    const { title, description, proposalType, votingPeriod, options, metadata } = req.body;
    
    const votingRepository = req.services.votingRepository;
    if (!votingRepository) {
      throw APIErrors.INTERNAL_ERROR('Voting service unavailable');
    }
    
    try {
      const proposalData = {
        title,
        description,
        proposal_type: proposalType,
        created_by: req.user.id,
        voting_period_days: votingPeriod || 7,
        options,
        metadata: metadata || {}
      };
      
      const proposal = await votingRepository.createProposal(proposalData);
      
      // Emit proposal creation event
      if (req.io) {
        req.io.emit('proposal_created', {
          proposal: {
            id: proposal.id,
            title: proposal.title,
            proposalType: proposal.proposal_type,
            createdBy: req.user.username || 'Anonymous'
          }
        });
        
        // Notify clan members if it's a clan-specific proposal
        if (metadata.clanId) {
          req.io.to(`clan:${metadata.clanId}`).emit('clan_proposal_created', {
            proposal,
            creator: {
              id: req.user.id,
              username: req.user.username || 'Anonymous'
            }
          });
        }
      }
      
      res.status(201).json({
        success: true,
        data: {
          proposal
        },
        message: 'Proposal created successfully'
      });
      
    } catch (error) {
      if (error.message.includes('reputation') || error.message.includes('requirements')) {
        throw APIErrors.BUSINESS_RULE_VIOLATION('Proposal requirements', error.message);
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Get proposals with filtering
   * GET /api/voting/proposals
   */
  static getProposals = asyncHandler(async (req, res) => {
    const { 
      status, 
      proposalType, 
      createdBy, 
      page = 1, 
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;
    
    const votingRepository = req.services.votingRepository;
    if (!votingRepository) {
      throw APIErrors.INTERNAL_ERROR('Voting service unavailable');
    }
    
    try {
      const searchParams = {
        status,
        proposalType,
        createdBy
      };
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder
      };
      
      const results = await votingRepository.searchProposals(searchParams, options);
      
      res.status(200).json({
        success: true,
        data: {
          proposals: results.proposals || results,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: results.total || 0,
            totalPages: Math.ceil((results.total || 0) / parseInt(limit))
          }
        },
        message: 'Proposals retrieved successfully'
      });
      
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Get proposal details
   * GET /api/voting/proposals/:id
   */
  static getProposal = asyncHandler(async (req, res) => {
    const { id: proposalId } = req.params;
    
    const votingRepository = req.services.votingRepository;
    if (!votingRepository) {
      throw APIErrors.INTERNAL_ERROR('Voting service unavailable');
    }
    
    try {
      const proposal = await votingRepository.getProposalDetails(proposalId, req.user?.id);
      
      if (!proposal) {
        throw APIErrors.RESOURCE_NOT_FOUND('Proposal', proposalId);
      }
      
      res.status(200).json({
        success: true,
        data: {
          proposal
        },
        message: 'Proposal details retrieved successfully'
      });
      
    } catch (error) {
      if (error.message.includes('not found')) {
        throw APIErrors.RESOURCE_NOT_FOUND('Proposal', proposalId);
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Vote on governance proposal
   * POST /api/voting/proposals/:id/vote
   */
  static voteOnProposal = asyncHandler(async (req, res) => {
    const { id: proposalId } = req.params;
    const { optionId, votePower = 1 } = req.body;
    
    const votingRepository = req.services.votingRepository;
    if (!votingRepository) {
      throw APIErrors.INTERNAL_ERROR('Voting service unavailable');
    }
    
    try {
      const voteResult = await votingRepository.voteOnProposal(
        req.user.id,
        proposalId,
        optionId,
        votePower
      );
      
      // Emit proposal vote event
      if (req.io) {
        req.io.emit('proposal_vote_cast', {
          proposalId,
          optionId,
          votePower,
          voterUsername: req.user.username || 'Anonymous'
        });
        
        // Real-time vote count updates
        req.io.emit('proposal_vote_update', {
          proposalId,
          voteResults: voteResult.currentResults
        });
      }
      
      res.status(200).json({
        success: true,
        data: voteResult,
        message: 'Proposal vote cast successfully'
      });
      
    } catch (error) {
      if (error.message.includes('not found')) {
        throw APIErrors.RESOURCE_NOT_FOUND('Proposal', proposalId);
      }
      
      if (error.message.includes('already voted')) {
        throw APIErrors.RESOURCE_CONFLICT('Vote', 'User already voted on this proposal');
      }
      
      if (error.message.includes('voting period ended') || error.message.includes('expired')) {
        throw APIErrors.BUSINESS_RULE_VIOLATION('Voting period', 'Voting period has ended');
      }
      
      if (error.message.includes('insufficient voting power')) {
        throw APIErrors.BUSINESS_RULE_VIOLATION('Voting power', 'Insufficient voting power for this proposal');
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Get proposal voting results
   * GET /api/voting/proposals/:id/results
   */
  static getProposalResults = asyncHandler(async (req, res) => {
    const { id: proposalId } = req.params;
    const { includeVoters = 'false' } = req.query;
    
    const votingRepository = req.services.votingRepository;
    if (!votingRepository) {
      throw APIErrors.INTERNAL_ERROR('Voting service unavailable');
    }
    
    try {
      const results = await votingRepository.getProposalResults(proposalId, {
        includeVoters: includeVoters === 'true'
      });
      
      if (!results) {
        throw APIErrors.RESOURCE_NOT_FOUND('Proposal', proposalId);
      }
      
      res.status(200).json({
        success: true,
        data: {
          results
        },
        message: 'Proposal results retrieved successfully'
      });
      
    } catch (error) {
      if (error.message.includes('not found')) {
        throw APIErrors.RESOURCE_NOT_FOUND('Proposal', proposalId);
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Get user's voting history
   * GET /api/voting/history
   */
  static getVotingHistory = asyncHandler(async (req, res) => {
    const { 
      type = 'all', // 'content' | 'proposals' | 'all'
      page = 1, 
      limit = 20,
      startDate,
      endDate
    } = req.query;
    
    const votingRepository = req.services.votingRepository;
    if (!votingRepository) {
      throw APIErrors.INTERNAL_ERROR('Voting service unavailable');
    }
    
    try {
      const options = {
        type,
        page: parseInt(page),
        limit: parseInt(limit),
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      };
      
      const history = await votingRepository.getUserVotingHistory(req.user.id, options);
      
      res.status(200).json({
        success: true,
        data: {
          history: history.votes || history,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: history.total || 0,
            totalPages: Math.ceil((history.total || 0) / parseInt(limit))
          }
        },
        message: 'Voting history retrieved successfully'
      });
      
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Get voting statistics
   * GET /api/voting/stats
   */
  static getVotingStats = asyncHandler(async (req, res) => {
    const { period = '30d', userId } = req.query;
    
    // If userId is provided and different from current user, check admin permissions
    const targetUserId = userId || req.user.id;
    if (userId && userId !== req.user.id && !req.user.roles?.includes('admin')) {
      throw APIErrors.INSUFFICIENT_PERMISSIONS(['admin'], req.user.roles || []);
    }
    
    const votingRepository = req.services.votingRepository;
    if (!votingRepository) {
      throw APIErrors.INTERNAL_ERROR('Voting service unavailable');
    }
    
    try {
      const stats = await votingRepository.getVotingStatistics(targetUserId, period);
      
      res.status(200).json({
        success: true,
        data: {
          stats
        },
        message: 'Voting statistics retrieved successfully'
      });
      
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Get trending content based on voting activity
   * GET /api/voting/trending
   */
  static getTrendingContent = asyncHandler(async (req, res) => {
    const { 
      period = '24h', // '1h' | '24h' | '7d' | '30d'
      contentType,
      limit = 20
    } = req.query;
    
    const votingRepository = req.services.votingRepository;
    if (!votingRepository) {
      throw APIErrors.INTERNAL_ERROR('Voting service unavailable');
    }
    
    try {
      const trendingContent = await votingRepository.getTrendingContent({
        period,
        contentType,
        limit: parseInt(limit)
      });
      
      res.status(200).json({
        success: true,
        data: {
          trending: trendingContent,
          period,
          generatedAt: new Date().toISOString()
        },
        message: 'Trending content retrieved successfully'
      });
      
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
}

export default VotingController;