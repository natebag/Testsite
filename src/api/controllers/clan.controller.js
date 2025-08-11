/**
 * Clan Controller for MLG.clan API
 * 
 * Handles clan management, member operations, invitations, statistics,
 * and clan-related activities using the ClanRepository.
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

import { asyncHandler } from '../middleware/error.middleware.js';
import { APIErrors } from '../middleware/error.middleware.js';

/**
 * Clan Controller Class
 */
export class ClanController {
  /**
   * Create new clan
   * POST /api/clans
   */
  static createClan = asyncHandler(async (req, res) => {
    const { name, slug, description, avatarUrl, bannerUrl, requiredStake, maxMembers, isPublic, settings, stakingData } = req.body;
    
    const clanRepository = req.services.clanRepository;
    if (!clanRepository) {
      throw APIErrors.INTERNAL_ERROR('Clan service unavailable');
    }
    
    try {
      const clanData = {
        name,
        slug,
        description,
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
        required_stake: requiredStake || 0,
        max_members: maxMembers || 100,
        is_public: isPublic !== false,
        owner_id: req.user.id,
        settings: settings || {}
      };
      
      const clan = await clanRepository.createClan(clanData, stakingData || {});
      
      // Emit clan creation event
      if (req.io) {
        req.io.emit('clan_created', {
          clan: {
            id: clan.id,
            name: clan.name,
            slug: clan.slug,
            memberCount: 1
          },
          owner: {
            id: req.user.id,
            username: req.user.username || 'Anonymous'
          }
        });
      }
      
      res.status(201).json({
        success: true,
        data: {
          clan
        },
        message: 'Clan created successfully'
      });
      
    } catch (error) {
      if (error.message.includes('already taken')) {
        throw APIErrors.RESOURCE_CONFLICT('Clan slug', 'already exists');
      }
      
      if (error.message.includes('staking') || error.message.includes('stake')) {
        throw APIErrors.BUSINESS_RULE_VIOLATION('Staking requirements', error.message);
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Get clans with filtering
   * GET /api/clans
   */
  static getClans = asyncHandler(async (req, res) => {
    const searchParams = {
      query: req.query.query,
      name: req.query.name,
      isPublic: req.query.isPublic,
      minMembers: req.query.minMembers,
      maxMembers: req.query.maxMembers,
      requiredStake: req.query.requiredStake
    };
    
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      offset: req.query.offset ? parseInt(req.query.offset) : undefined,
      includeMemberCount: req.query.includeMemberCount === 'true',
      orderBy: req.query.field ? [[req.query.field, req.query.order || 'desc']] : [['created_at', 'desc']]
    };
    
    const clanRepository = req.services.clanRepository;
    if (!clanRepository) {
      throw APIErrors.INTERNAL_ERROR('Clan service unavailable');
    }
    
    try {
      const results = await clanRepository.searchClans(searchParams, options);
      
      res.status(200).json({
        success: true,
        data: {
          clans: results.clans || results,
          pagination: {
            page: options.page,
            limit: options.limit,
            total: results.total || 0,
            totalPages: Math.ceil((results.total || 0) / options.limit)
          }
        },
        message: 'Clans retrieved successfully'
      });
      
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Get clan details
   * GET /api/clans/:id
   */
  static getClan = asyncHandler(async (req, res) => {
    const { id: clanId } = req.params;
    const { includeMembers = 'false', includeStats = 'false', includeActivity = 'false' } = req.query;
    
    const clanRepository = req.services.clanRepository;
    if (!clanRepository) {
      throw APIErrors.INTERNAL_ERROR('Clan service unavailable');
    }
    
    try {
      const options = {
        includeMembers: includeMembers === 'true',
        includeStats: includeStats === 'true',
        includeActivity: includeActivity === 'true',
        memberLimit: 50,
        activityLimit: 20
      };
      
      const clanProfile = await clanRepository.getClanProfile(clanId, req.user?.id, options);
      
      res.status(200).json({
        success: true,
        data: {
          clan: clanProfile
        },
        message: 'Clan details retrieved successfully'
      });
      
    } catch (error) {
      if (error.message.includes('not found')) {
        throw APIErrors.RESOURCE_NOT_FOUND('Clan', clanId);
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Update clan settings
   * PUT /api/clans/:id
   */
  static updateClan = asyncHandler(async (req, res) => {
    const { id: clanId } = req.params;
    const updateData = req.body;
    
    const clanRepository = req.services.clanRepository;
    if (!clanRepository) {
      throw APIErrors.INTERNAL_ERROR('Clan service unavailable');
    }
    
    try {
      // Validation handled by middleware, but we need to check permissions
      const context = {
        clanId,
        userId: req.user.id,
        updateData
      };
      
      await clanRepository.validateOperation('updateClanSettings', context);
      
      const updatedClan = await clanRepository.clanDAO.update(clanId, {
        name: updateData.name,
        description: updateData.description,
        avatar_url: updateData.avatarUrl,
        banner_url: updateData.bannerUrl,
        max_members: updateData.maxMembers,
        is_public: updateData.isPublic,
        settings: updateData.settings
      });
      
      // Emit clan update event
      if (req.io) {
        req.io.to(`clan:${clanId}`).emit('clan_updated', {
          clanId,
          updates: updateData,
          updatedBy: req.user.id
        });
      }
      
      res.status(200).json({
        success: true,
        data: {
          clan: updatedClan
        },
        message: 'Clan updated successfully'
      });
      
    } catch (error) {
      if (error.message.includes('Insufficient permissions')) {
        throw APIErrors.INSUFFICIENT_PERMISSIONS(['admin', 'owner'], req.membership?.role || 'none');
      }
      
      if (error.message.includes('not found')) {
        throw APIErrors.RESOURCE_NOT_FOUND('Clan', clanId);
      }
      
      if (error.message.includes('already taken')) {
        throw APIErrors.RESOURCE_CONFLICT('Clan slug', 'already exists');
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Join clan
   * POST /api/clans/:id/join
   */
  static joinClan = asyncHandler(async (req, res) => {
    const { id: clanId } = req.params;
    const { stakingData } = req.body;
    
    const clanRepository = req.services.clanRepository;
    if (!clanRepository) {
      throw APIErrors.INTERNAL_ERROR('Clan service unavailable');
    }
    
    try {
      const membership = await clanRepository.joinClan(clanId, req.user.id, stakingData);
      
      // Emit join event
      if (req.io) {
        req.io.to(`clan:${clanId}`).emit('member_joined', {
          clanId,
          user: {
            id: req.user.id,
            username: req.user.username || 'Anonymous'
          },
          membership
        });
        
        req.io.to(`user:${req.user.id}`).emit('clan_joined', {
          clanId,
          membership
        });
      }
      
      res.status(200).json({
        success: true,
        data: {
          membership
        },
        message: 'Successfully joined clan'
      });
      
    } catch (error) {
      if (error.message.includes('not found')) {
        throw APIErrors.RESOURCE_NOT_FOUND('Clan', clanId);
      }
      
      if (error.message.includes('already a member')) {
        throw APIErrors.RESOURCE_CONFLICT('Membership', 'already exists');
      }
      
      if (error.message.includes('maximum member limit')) {
        throw APIErrors.BUSINESS_RULE_VIOLATION('Member limit', 'Clan has reached maximum capacity');
      }
      
      if (error.message.includes('staking') || error.message.includes('stake')) {
        throw APIErrors.BUSINESS_RULE_VIOLATION('Staking requirements', error.message);
      }
      
      if (error.message.includes('private') && error.message.includes('invitation')) {
        throw APIErrors.BUSINESS_RULE_VIOLATION('Access restrictions', 'Clan is private and requires invitation');
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Leave clan
   * POST /api/clans/:id/leave
   */
  static leaveClan = asyncHandler(async (req, res) => {
    const { id: clanId } = req.params;
    
    const clanRepository = req.services.clanRepository;
    if (!clanRepository) {
      throw APIErrors.INTERNAL_ERROR('Clan service unavailable');
    }
    
    try {
      const result = await clanRepository.leaveClan(clanId, req.user.id);
      
      // Emit leave event
      if (req.io) {
        req.io.to(`clan:${clanId}`).emit('member_left', {
          clanId,
          userId: req.user.id,
          username: req.user.username || 'Anonymous'
        });
        
        req.io.to(`user:${req.user.id}`).emit('clan_left', {
          clanId
        });
      }
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Successfully left clan'
      });
      
    } catch (error) {
      if (error.message.includes('not a member')) {
        throw APIErrors.RESOURCE_NOT_FOUND('Membership', req.user.id);
      }
      
      if (error.message.includes('Owner cannot leave')) {
        throw APIErrors.BUSINESS_RULE_VIOLATION('Ownership restriction', 'Owner must transfer ownership before leaving');
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Invite member to clan
   * POST /api/clans/:id/invite
   */
  static inviteMember = asyncHandler(async (req, res) => {
    const { id: clanId } = req.params;
    const { userId, email, message } = req.body;
    
    const clanRepository = req.services.clanRepository;
    if (!clanRepository) {
      throw APIErrors.INTERNAL_ERROR('Clan service unavailable');
    }
    
    try {
      const invitation = await clanRepository.inviteMember(
        clanId,
        req.user.id,
        { userId, email },
        message
      );
      
      // Emit invitation event
      if (req.io && userId) {
        req.io.to(`user:${userId}`).emit('clan_invitation', {
          clanId,
          invitation,
          inviter: {
            id: req.user.id,
            username: req.user.username || 'Anonymous'
          }
        });
      }
      
      res.status(200).json({
        success: true,
        data: {
          invitation
        },
        message: 'Invitation sent successfully'
      });
      
    } catch (error) {
      if (error.message.includes('Insufficient permissions')) {
        throw APIErrors.INSUFFICIENT_PERMISSIONS(['moderator', 'admin', 'owner'], req.membership?.role || 'member');
      }
      
      if (error.message.includes('already a member')) {
        throw APIErrors.RESOURCE_CONFLICT('Membership', 'User is already a member');
      }
      
      if (error.message.includes('pending invitation')) {
        throw APIErrors.RESOURCE_CONFLICT('Invitation', 'User already has a pending invitation');
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Kick member from clan
   * POST /api/clans/:id/kick
   */
  static kickMember = asyncHandler(async (req, res) => {
    const { id: clanId } = req.params;
    const { userId, reason } = req.body;
    
    const clanRepository = req.services.clanRepository;
    if (!clanRepository) {
      throw APIErrors.INTERNAL_ERROR('Clan service unavailable');
    }
    
    try {
      const result = await clanRepository.kickMember(clanId, req.user.id, userId, reason);
      
      // Emit kick event
      if (req.io) {
        req.io.to(`clan:${clanId}`).emit('member_kicked', {
          clanId,
          kickedUserId: userId,
          kickedBy: req.user.id,
          reason
        });
        
        req.io.to(`user:${userId}`).emit('kicked_from_clan', {
          clanId,
          reason,
          kickedBy: req.user.id
        });
      }
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Member kicked successfully'
      });
      
    } catch (error) {
      if (error.message.includes('Insufficient permissions')) {
        throw APIErrors.INSUFFICIENT_PERMISSIONS(['admin', 'owner'], req.membership?.role || 'member');
      }
      
      if (error.message.includes('not a member')) {
        throw APIErrors.RESOURCE_NOT_FOUND('Membership', userId);
      }
      
      if (error.message.includes('equal or higher role')) {
        throw APIErrors.BUSINESS_RULE_VIOLATION('Role hierarchy', 'Cannot kick member with equal or higher role');
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Update member role
   * PUT /api/clans/:id/members/:userId/role
   */
  static updateMemberRole = asyncHandler(async (req, res) => {
    const { id: clanId, userId } = req.params;
    const { role } = req.body;
    
    const clanRepository = req.services.clanRepository;
    if (!clanRepository) {
      throw APIErrors.INTERNAL_ERROR('Clan service unavailable');
    }
    
    try {
      const updatedMembership = await clanRepository.updateMemberRole(
        clanId,
        req.user.id,
        userId,
        role
      );
      
      // Emit role update event
      if (req.io) {
        req.io.to(`clan:${clanId}`).emit('member_role_updated', {
          clanId,
          userId,
          newRole: role,
          updatedBy: req.user.id
        });
        
        req.io.to(`user:${userId}`).emit('clan_role_updated', {
          clanId,
          newRole: role
        });
      }
      
      res.status(200).json({
        success: true,
        data: {
          membership: updatedMembership
        },
        message: 'Member role updated successfully'
      });
      
    } catch (error) {
      if (error.message.includes('Insufficient role')) {
        throw APIErrors.INSUFFICIENT_PERMISSIONS(['admin'], req.membership?.role || 'member');
      }
      
      if (error.message.includes('not a member')) {
        throw APIErrors.RESOURCE_NOT_FOUND('Membership', userId);
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Get clan statistics
   * GET /api/clans/:id/stats
   */
  static getClanStats = asyncHandler(async (req, res) => {
    const { id: clanId } = req.params;
    
    const clanRepository = req.services.clanRepository;
    if (!clanRepository) {
      throw APIErrors.INTERNAL_ERROR('Clan service unavailable');
    }
    
    try {
      const stats = await clanRepository.getClanStatistics(clanId);
      
      res.status(200).json({
        success: true,
        data: {
          stats
        },
        message: 'Clan statistics retrieved successfully'
      });
      
    } catch (error) {
      if (error.message.includes('not found')) {
        throw APIErrors.RESOURCE_NOT_FOUND('Clan', clanId);
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Get clan leaderboard
   * GET /api/clans/leaderboard
   */
  static getClanLeaderboard = asyncHandler(async (req, res) => {
    const { metric = 'reputation_score', limit = 50, offset = 0 } = req.query;
    
    const clanRepository = req.services.clanRepository;
    if (!clanRepository) {
      throw APIErrors.INTERNAL_ERROR('Clan service unavailable');
    }
    
    try {
      const leaderboard = await clanRepository.getClanLeaderboard(metric, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      // Add rank numbers
      const rankedLeaderboard = leaderboard.map((clan, index) => ({
        ...clan,
        rank: parseInt(offset) + index + 1
      }));
      
      res.status(200).json({
        success: true,
        data: {
          leaderboard: rankedLeaderboard,
          metric,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: rankedLeaderboard.length
          }
        },
        message: 'Clan leaderboard retrieved successfully'
      });
      
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
}

export default ClanController;