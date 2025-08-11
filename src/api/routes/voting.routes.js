/**
 * Voting Routes for MLG.clan API
 * 
 * Routes for vote purchasing, casting votes, governance proposals,
 * and voting-related operations.
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

import express from 'express';
import { VotingController } from '../controllers/voting.controller.js';
import { validate, schemas } from '../middleware/validation.middleware.js';
import { authMiddleware, optionalAuthMiddleware, requireRole } from '../middleware/auth.middleware.js';
import { rateLimiterMiddleware } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

/**
 * Vote Purchase and Management Routes
 */

/**
 * POST /api/voting/votes/purchase
 * Purchase votes by burning MLG tokens
 * 
 * @header {string} Authorization - Bearer access token
 * @body {number} amount - Amount of MLG tokens to burn
 * @body {string} transactionId - Solana transaction ID
 * @returns {object} Vote purchase confirmation and new balance
 */
router.post('/votes/purchase',
  authMiddleware,
  rateLimiterMiddleware('voting'),
  validate(schemas.voting.purchaseVotes),
  VotingController.purchaseVotes
);

/**
 * POST /api/voting/votes/cast
 * Cast vote on content
 * 
 * @header {string} Authorization - Bearer access token
 * @body {string} contentId - Content ID to vote on
 * @body {string} voteType - Vote type ('up' or 'down')
 * @body {number} [votePower=1] - Vote power (1-10)
 * @returns {object} Vote confirmation and updated content stats
 */
router.post('/votes/cast',
  authMiddleware,
  rateLimiterMiddleware('voting'),
  validate(schemas.voting.castVote),
  VotingController.castVote
);

/**
 * GET /api/voting/votes/daily
 * Get daily vote status for current user
 * 
 * @header {string} Authorization - Bearer access token
 * @returns {object} Daily vote limits, used votes, and remaining votes
 */
router.get('/votes/daily',
  authMiddleware,
  rateLimiterMiddleware('user'),
  VotingController.getDailyVoteStatus
);

/**
 * Governance Proposal Routes
 */

/**
 * POST /api/voting/proposals
 * Create governance proposal
 * 
 * @header {string} Authorization - Bearer access token
 * @body {string} title - Proposal title
 * @body {string} description - Proposal description
 * @body {string} proposalType - Type of proposal
 * @body {number} [votingPeriod=7] - Voting period in days
 * @body {array} options - Voting options
 * @body {object} [metadata] - Additional proposal metadata
 * @returns {object} Created proposal data
 */
router.post('/proposals',
  authMiddleware,
  rateLimiterMiddleware('user'),
  validate(schemas.voting.proposal),
  VotingController.createProposal
);

/**
 * GET /api/voting/proposals
 * Get proposals with filtering
 * 
 * @query {string} [status] - Proposal status filter
 * @query {string} [proposalType] - Proposal type filter
 * @query {string} [createdBy] - Creator filter
 * @query {number} [page=1] - Page number
 * @query {number} [limit=20] - Results per page
 * @query {string} [sortBy=created_at] - Sort field
 * @query {string} [sortOrder=desc] - Sort order
 * @returns {object} Proposals list with pagination
 */
router.get('/proposals',
  optionalAuthMiddleware,
  rateLimiterMiddleware('search'),
  VotingController.getProposals
);

/**
 * GET /api/voting/proposals/:id
 * Get proposal details
 * 
 * @param {string} id - Proposal ID
 * @returns {object} Detailed proposal information
 */
router.get('/proposals/:id',
  optionalAuthMiddleware,
  rateLimiterMiddleware('user'),
  VotingController.getProposal
);

/**
 * POST /api/voting/proposals/:id/vote
 * Vote on governance proposal
 * 
 * @header {string} Authorization - Bearer access token
 * @param {string} id - Proposal ID
 * @body {string} optionId - Voting option ID
 * @body {number} [votePower=1] - Vote power
 * @returns {object} Vote confirmation and updated results
 */
router.post('/proposals/:id/vote',
  authMiddleware,
  rateLimiterMiddleware('voting'),
  validate(schemas.voting.voteProposal),
  VotingController.voteOnProposal
);

/**
 * GET /api/voting/proposals/:id/results
 * Get proposal voting results
 * 
 * @param {string} id - Proposal ID
 * @query {boolean} [includeVoters=false] - Include voter details
 * @returns {object} Proposal voting results
 */
router.get('/proposals/:id/results',
  optionalAuthMiddleware,
  rateLimiterMiddleware('user'),
  VotingController.getProposalResults
);

/**
 * Voting History and Statistics Routes
 */

/**
 * GET /api/voting/history
 * Get user's voting history
 * 
 * @header {string} Authorization - Bearer access token
 * @query {string} [type=all] - Vote type filter ('content', 'proposals', 'all')
 * @query {number} [page=1] - Page number
 * @query {number} [limit=20] - Results per page
 * @query {string} [startDate] - Start date filter
 * @query {string} [endDate] - End date filter
 * @returns {object} Voting history with pagination
 */
router.get('/history',
  authMiddleware,
  rateLimiterMiddleware('user'),
  VotingController.getVotingHistory
);

/**
 * GET /api/voting/stats
 * Get voting statistics
 * 
 * @header {string} Authorization - Bearer access token
 * @query {string} [period=30d] - Statistics period
 * @query {string} [userId] - User ID (admin only)
 * @returns {object} Voting statistics
 */
router.get('/stats',
  authMiddleware,
  rateLimiterMiddleware('user'),
  VotingController.getVotingStats
);

/**
 * GET /api/voting/trending
 * Get trending content based on voting activity
 * 
 * @query {string} [period=24h] - Trending period
 * @query {string} [contentType] - Content type filter
 * @query {number} [limit=20] - Number of results
 * @returns {object} Trending content list
 */
router.get('/trending',
  optionalAuthMiddleware,
  rateLimiterMiddleware('search'),
  VotingController.getTrendingContent
);

/**
 * Additional voting utility routes
 */

/**
 * GET /api/voting/leaderboard
 * Get voting leaderboard (most active voters)
 */
router.get('/leaderboard',
  optionalAuthMiddleware,
  rateLimiterMiddleware('user'),
  async (req, res, next) => {
    try {
      const { period = '30d', limit = 50 } = req.query;
      
      const votingRepository = req.services.votingRepository;
      
      if (!votingRepository) {
        return res.status(500).json({
          error: 'Voting service unavailable',
          code: 'SERVICE_ERROR'
        });
      }
      
      const leaderboard = await votingRepository.getVotingLeaderboard({
        period,
        limit: parseInt(limit)
      });
      
      res.status(200).json({
        success: true,
        data: {
          leaderboard,
          period
        },
        message: 'Voting leaderboard retrieved successfully'
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/voting/user/:userId/votes
 * Get user's votes on specific content (public info)
 */
router.get('/user/:userId/votes',
  optionalAuthMiddleware,
  rateLimiterMiddleware('user'),
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { contentId, page = 1, limit = 20 } = req.query;
      
      const votingRepository = req.services.votingRepository;
      
      const userVotes = await votingRepository.getUserVotes(userId, {
        contentId,
        page: parseInt(page),
        limit: parseInt(limit),
        publicOnly: true // Only return public voting info
      });
      
      res.status(200).json({
        success: true,
        data: {
          votes: userVotes,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            hasMore: userVotes.length === parseInt(limit)
          }
        },
        message: 'User votes retrieved successfully'
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/voting/content/:contentId/votes
 * Get votes for specific content
 */
router.get('/content/:contentId/votes',
  optionalAuthMiddleware,
  rateLimiterMiddleware('user'),
  async (req, res, next) => {
    try {
      const { contentId } = req.params;
      const { page = 1, limit = 20, voteType } = req.query;
      
      const votingRepository = req.services.votingRepository;
      
      const contentVotes = await votingRepository.getContentVotes(contentId, {
        voteType,
        page: parseInt(page),
        limit: parseInt(limit),
        includeVoters: true
      });
      
      res.status(200).json({
        success: true,
        data: {
          votes: contentVotes.votes,
          summary: contentVotes.summary,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: contentVotes.total,
            totalPages: Math.ceil((contentVotes.total || 0) / parseInt(limit))
          }
        },
        message: 'Content votes retrieved successfully'
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/voting/proposals/:id/close
 * Close proposal (admin/creator only)
 */
router.post('/proposals/:id/close',
  authMiddleware,
  rateLimiterMiddleware('user'),
  async (req, res, next) => {
    try {
      const { id: proposalId } = req.params;
      const { reason } = req.body;
      
      const votingRepository = req.services.votingRepository;
      
      // Get proposal to check if user can close it
      const proposal = await votingRepository.getProposalDetails(proposalId, req.user.id);
      
      if (!proposal) {
        return res.status(404).json({
          error: 'Proposal not found',
          code: 'PROPOSAL_NOT_FOUND'
        });
      }
      
      // Check if user can close the proposal
      const canClose = proposal.created_by === req.user.id || 
                      req.user.roles?.includes('admin') ||
                      req.user.roles?.includes('moderator');
      
      if (!canClose) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only proposal creator, moderators, or admins can close proposals'
        });
      }
      
      const result = await votingRepository.closeProposal(proposalId, req.user.id, reason);
      
      // Emit proposal closure event
      if (req.io) {
        req.io.emit('proposal_closed', {
          proposalId,
          closedBy: req.user.id,
          reason
        });
      }
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Proposal closed successfully'
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/voting/rewards/pending
 * Get pending voting rewards for user
 */
router.get('/rewards/pending',
  authMiddleware,
  rateLimiterMiddleware('user'),
  async (req, res, next) => {
    try {
      const votingRepository = req.services.votingRepository;
      
      const pendingRewards = await votingRepository.getPendingVoteRewards(req.user.id);
      
      res.status(200).json({
        success: true,
        data: {
          rewards: pendingRewards
        },
        message: 'Pending voting rewards retrieved successfully'
      });
      
    } catch (error) {
      next(error);
    }
  }
);

export default router;