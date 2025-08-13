/**
 * Clan Routes for MLG.clan API
 * 
 * Routes for clan management, member operations, invitations,
 * statistics, and leaderboards.
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

import express from 'express';
import { ClanController } from '../controllers/clan.controller.js';
import { validate, schemas } from '../middleware/validation.middleware.js';
import { 
  authMiddleware, 
  optionalAuthMiddleware, 
  requireClanMembership, 
  requireClanRole 
} from '../middleware/auth.middleware.js';
import { rateLimiterMiddleware } from '../middleware/rateLimiter.middleware.js';
import { gamingRateLimiterMiddleware } from '../middleware/gaming-rate-limiter.js';

const router = express.Router();

/**
 * POST /api/clans
 * Create new clan
 * 
 * @header {string} Authorization - Bearer access token
 * @body {string} name - Clan name
 * @body {string} slug - Unique clan slug
 * @body {string} [description] - Clan description
 * @body {string} [avatarUrl] - Clan avatar URL
 * @body {string} [bannerUrl] - Clan banner URL
 * @body {number} [requiredStake=0] - MLG tokens required to join
 * @body {number} [maxMembers=100] - Maximum clan members
 * @body {boolean} [isPublic=true] - Whether clan is public
 * @body {object} [settings] - Clan settings
 * @body {object} [stakingData] - Staking transaction data
 * @returns {object} Created clan data
 */
router.post('/',
  authMiddleware,
  gamingRateLimiterMiddleware('clans'),
  validate(schemas.clan.create),
  ClanController.createClan
);

/**
 * GET /api/clans
 * Get clans with filtering and search
 * 
 * @query {string} [query] - Search query
 * @query {string} [name] - Clan name filter
 * @query {boolean} [isPublic] - Public clan filter
 * @query {number} [minMembers] - Minimum member count
 * @query {number} [maxMembers] - Maximum member count
 * @query {number} [requiredStake] - Required stake filter
 * @query {number} [page=1] - Page number
 * @query {number} [limit=20] - Results per page
 * @query {string} [field] - Sort field
 * @query {string} [order=desc] - Sort order
 * @query {boolean} [includeMemberCount=false] - Include member counts
 * @returns {object} Clans list with pagination
 */
router.get('/',
  optionalAuthMiddleware,
  gamingRateLimiterMiddleware('general'),
  validate(schemas.clan.search, 'query'),
  ClanController.getClans
);

/**
 * GET /api/clans/leaderboard
 * Get clan leaderboard
 * 
 * @query {string} [metric=reputation_score] - Ranking metric
 * @query {number} [limit=50] - Number of results
 * @query {number} [offset=0] - Results offset
 * @returns {object} Clan leaderboard data
 */
router.get('/leaderboard',
  optionalAuthMiddleware,
  gamingRateLimiterMiddleware('clans'),
  ClanController.getClanLeaderboard
);

/**
 * GET /api/clans/:id
 * Get clan details
 * 
 * @param {string} id - Clan ID
 * @query {boolean} [includeMembers=false] - Include member list
 * @query {boolean} [includeStats=false] - Include statistics
 * @query {boolean} [includeActivity=false] - Include recent activity
 * @returns {object} Detailed clan information
 */
router.get('/:id',
  optionalAuthMiddleware,
  gamingRateLimiterMiddleware('clans'),
  ClanController.getClan
);

/**
 * PUT /api/clans/:id
 * Update clan settings
 * 
 * @header {string} Authorization - Bearer access token
 * @param {string} id - Clan ID
 * @body {string} [name] - Clan name
 * @body {string} [description] - Clan description
 * @body {string} [avatarUrl] - Clan avatar URL
 * @body {string} [bannerUrl] - Clan banner URL
 * @body {number} [maxMembers] - Maximum clan members
 * @body {boolean} [isPublic] - Whether clan is public
 * @body {object} [settings] - Clan settings
 * @returns {object} Updated clan data
 */
router.put('/:id',
  authMiddleware,
  requireClanRole('admin'),
  gamingRateLimiterMiddleware('clans'),
  validate(schemas.clan.update),
  ClanController.updateClan
);

/**
 * POST /api/clans/:id/join
 * Join a clan
 * 
 * @header {string} Authorization - Bearer access token
 * @param {string} id - Clan ID
 * @body {object} [stakingData] - Staking transaction data
 * @returns {object} Membership data
 */
router.post('/:id/join',
  authMiddleware,
  gamingRateLimiterMiddleware('clans'),
  validate(schemas.clan.join),
  ClanController.joinClan
);

/**
 * POST /api/clans/:id/leave
 * Leave a clan
 * 
 * @header {string} Authorization - Bearer access token
 * @param {string} id - Clan ID
 * @returns {object} Leave confirmation with stake reclamation info
 */
router.post('/:id/leave',
  authMiddleware,
  requireClanMembership(),
  gamingRateLimiterMiddleware('clans'),
  ClanController.leaveClan
);

/**
 * POST /api/clans/:id/invite
 * Invite member to clan
 * 
 * @header {string} Authorization - Bearer access token
 * @param {string} id - Clan ID
 * @body {string} [userId] - User ID to invite
 * @body {string} [email] - Email address to invite
 * @body {string} [message] - Invitation message
 * @returns {object} Invitation data
 */
router.post('/:id/invite',
  authMiddleware,
  requireClanRole('moderator'),
  gamingRateLimiterMiddleware('clans'),
  validate(schemas.clan.invite),
  ClanController.inviteMember
);

/**
 * POST /api/clans/:id/kick
 * Kick member from clan
 * 
 * @header {string} Authorization - Bearer access token
 * @param {string} id - Clan ID
 * @body {string} userId - User ID to kick
 * @body {string} [reason] - Reason for kicking
 * @returns {object} Kick confirmation
 */
router.post('/:id/kick',
  authMiddleware,
  requireClanRole('admin'),
  gamingRateLimiterMiddleware('clans'),
  validate(schemas.clan.kick),
  ClanController.kickMember
);

/**
 * PUT /api/clans/:id/members/:userId/role
 * Update member role
 * 
 * @header {string} Authorization - Bearer access token
 * @param {string} id - Clan ID
 * @param {string} userId - User ID
 * @body {string} role - New role (member, moderator, admin)
 * @returns {object} Updated membership data
 */
router.put('/:id/members/:userId/role',
  authMiddleware,
  requireClanRole('admin'),
  gamingRateLimiterMiddleware('clans'),
  validate(schemas.clan.roleUpdate),
  ClanController.updateMemberRole
);

/**
 * GET /api/clans/:id/stats
 * Get clan statistics
 * 
 * @param {string} id - Clan ID
 * @returns {object} Comprehensive clan statistics
 */
router.get('/:id/stats',
  optionalAuthMiddleware,
  gamingRateLimiterMiddleware('clans'),
  ClanController.getClanStats
);

/**
 * Additional clan routes for enhanced functionality
 */

/**
 * GET /api/clans/:id/members
 * Get clan members list
 */
router.get('/:id/members',
  optionalAuthMiddleware,
  gamingRateLimiterMiddleware('clans'),
  async (req, res, next) => {
    try {
      const { id: clanId } = req.params;
      const { page = 1, limit = 50, role, search } = req.query;
      
      const clanRepository = req.services.clanRepository;
      
      if (!clanRepository) {
        return res.status(500).json({
          error: 'Clan service unavailable',
          code: 'SERVICE_ERROR'
        });
      }
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        role,
        search
      };
      
      const members = await clanRepository.clanDAO.getClanMembers(clanId, options);
      
      res.status(200).json({
        success: true,
        data: {
          members,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: members.length,
            hasMore: members.length === parseInt(limit)
          }
        },
        message: 'Clan members retrieved successfully'
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/clans/:id/invitations
 * Get clan invitations (members only)
 */
router.get('/:id/invitations',
  authMiddleware,
  requireClanMembership(),
  gamingRateLimiterMiddleware('clans'),
  async (req, res, next) => {
    try {
      const { id: clanId } = req.params;
      const { status = 'pending', page = 1, limit = 20 } = req.query;
      
      const clanRepository = req.services.clanRepository;
      
      const invitations = await clanRepository.clanDAO.getClanInvitations(clanId, {
        status,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      res.status(200).json({
        success: true,
        data: {
          invitations,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: invitations.length,
            hasMore: invitations.length === parseInt(limit)
          }
        },
        message: 'Clan invitations retrieved successfully'
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/clans/:id/invitations/:invitationId/respond
 * Respond to clan invitation
 */
router.post('/:id/invitations/:invitationId/respond',
  authMiddleware,
  gamingRateLimiterMiddleware('clans'),
  async (req, res, next) => {
    try {
      const { id: clanId, invitationId } = req.params;
      const { action, stakingData } = req.body; // action: 'accept' | 'decline'
      
      if (!['accept', 'decline'].includes(action)) {
        return res.status(400).json({
          error: 'Invalid action',
          code: 'INVALID_ACTION',
          message: 'Action must be either "accept" or "decline"'
        });
      }
      
      const clanRepository = req.services.clanRepository;
      
      // Get invitation and verify it belongs to the user
      const invitation = await clanRepository.clanDAO.getInvitation(clanId, req.user.id);
      
      if (!invitation || invitation.id !== invitationId) {
        return res.status(404).json({
          error: 'Invitation not found',
          code: 'INVITATION_NOT_FOUND'
        });
      }
      
      if (action === 'accept') {
        // Join the clan
        const membership = await clanRepository.joinClan(
          clanId, 
          req.user.id, 
          { ...stakingData, invitationId }
        );
        
        res.status(200).json({
          success: true,
          data: { membership },
          message: 'Invitation accepted successfully'
        });
      } else {
        // Decline the invitation
        await clanRepository.clanDAO.updateInvitation(invitationId, {
          status: 'declined',
          responded_at: new Date()
        });
        
        res.status(200).json({
          success: true,
          message: 'Invitation declined'
        });
      }
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/clans/:id/activity
 * Get clan activity feed
 */
router.get('/:id/activity',
  optionalAuthMiddleware,
  gamingRateLimiterMiddleware('clans'),
  async (req, res, next) => {
    try {
      const { id: clanId } = req.params;
      const { limit = 20, offset = 0, type } = req.query;
      
      const clanRepository = req.services.clanRepository;
      
      const activity = await clanRepository.clanDAO.getClanActivity(clanId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        type
      });
      
      res.status(200).json({
        success: true,
        data: {
          activity,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: activity.length === parseInt(limit)
          }
        },
        message: 'Clan activity retrieved successfully'
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/clans/:id/transfer-ownership
 * Transfer clan ownership
 */
router.post('/:id/transfer-ownership',
  authMiddleware,
  requireClanRole('owner'),
  gamingRateLimiterMiddleware('clans'),
  async (req, res, next) => {
    try {
      const { id: clanId } = req.params;
      const { newOwnerId } = req.body;
      
      if (!newOwnerId) {
        return res.status(400).json({
          error: 'New owner ID is required',
          code: 'MISSING_NEW_OWNER'
        });
      }
      
      const clanRepository = req.services.clanRepository;
      
      // Transfer ownership
      const result = await clanRepository.transferOwnership(clanId, req.user.id, newOwnerId);
      
      // Emit ownership transfer event
      if (req.io) {
        req.io.to(`clan:${clanId}`).emit('ownership_transferred', {
          clanId,
          previousOwner: req.user.id,
          newOwner: newOwnerId
        });
      }
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Ownership transferred successfully'
      });
      
    } catch (error) {
      next(error);
    }
  }
);

export default router;