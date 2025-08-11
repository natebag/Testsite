/**
 * Clan Repository for MLG.clan Platform
 * 
 * Business logic layer for clan management, token staking, member operations,
 * and governance. Orchestrates multiple DAOs for complex clan workflows.
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

import { BaseRepository } from './BaseRepository.js';

export class ClanRepository extends BaseRepository {
  constructor(options = {}) {
    super(options);
    
    this.clanDAO = this.daos.clan;
    this.userDAO = this.daos.user;
    this.votingDAO = this.daos.voting;
    this.transactionDAO = this.daos.transaction;
    
    this.setupValidators();
    this.setupBusinessRules();
  }

  setupValidators() {
    this.registerValidator('createClan', this.validateClanCreation.bind(this));
    this.registerValidator('joinClan', this.validateClanJoin.bind(this));
    this.registerValidator('inviteMember', this.validateMemberInvitation.bind(this));
    this.registerValidator('kickMember', this.validateMemberKick.bind(this));
    this.registerValidator('updateClanSettings', this.validateClanUpdate.bind(this));
  }

  setupBusinessRules() {
    this.registerBusinessRule('uniqueClanSlug', this.validateUniqueClanSlug.bind(this));
    this.registerBusinessRule('stakingRequirements', this.validateStakingRequirements.bind(this));
    this.registerBusinessRule('membershipLimits', this.validateMembershipLimits.bind(this));
    this.registerBusinessRule('rolePermissions', this.validateRolePermissions.bind(this));
  }

  async validateClanCreation(context) {
    const { clanData, stakingData } = context;
    
    // Validate unique slug
    await this.validateBusinessRule('uniqueClanSlug', clanData.slug);
    
    // Validate staking requirements
    await this.validateBusinessRule('stakingRequirements', {
      userId: clanData.owner_id,
      requiredStake: clanData.required_stake,
      stakingData
    });
  }

  async validateClanJoin(context) {
    const { clanId, userId, stakingData } = context;
    
    // Get clan details
    const clan = await this.clanDAO.findById(clanId);
    if (!clan) {
      throw new Error('Clan not found');
    }

    // Check membership limits
    await this.validateBusinessRule('membershipLimits', {
      clan,
      newMemberId: userId
    });

    // Validate staking requirements for joining
    await this.validateBusinessRule('stakingRequirements', {
      userId,
      requiredStake: clan.required_stake,
      stakingData
    });
  }

  async validateMemberInvitation(context) {
    const { clanId, inviterId, inviteeId } = context;
    
    // Validate inviter has permission
    const membership = await this.clanDAO.getMembership(clanId, inviterId);
    if (!membership || !['owner', 'admin', 'moderator'].includes(membership.role)) {
      throw new Error('Insufficient permissions to invite members');
    }

    // Check if user already member or has pending invitation
    const existingMembership = await this.clanDAO.getMembership(clanId, inviteeId);
    if (existingMembership) {
      throw new Error('User is already a member');
    }

    const existingInvite = await this.clanDAO.getInvitation(clanId, inviteeId);
    if (existingInvite && existingInvite.status === 'pending') {
      throw new Error('User already has a pending invitation');
    }
  }

  async validateMemberKick(context) {
    const { clanId, kickerId, targetId } = context;
    
    const [kickerMembership, targetMembership] = await Promise.all([
      this.clanDAO.getMembership(clanId, kickerId),
      this.clanDAO.getMembership(clanId, targetId)
    ]);

    if (!kickerMembership || !['owner', 'admin'].includes(kickerMembership.role)) {
      throw new Error('Insufficient permissions to kick members');
    }

    if (!targetMembership) {
      throw new Error('Target user is not a member');
    }

    // Can't kick owner or higher role
    const roleHierarchy = ['member', 'moderator', 'admin', 'owner'];
    const kickerLevel = roleHierarchy.indexOf(kickerMembership.role);
    const targetLevel = roleHierarchy.indexOf(targetMembership.role);
    
    if (targetLevel >= kickerLevel) {
      throw new Error('Cannot kick member with equal or higher role');
    }
  }

  async validateClanUpdate(context) {
    const { clanId, userId, updateData } = context;
    
    const membership = await this.clanDAO.getMembership(clanId, userId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      throw new Error('Insufficient permissions to update clan settings');
    }

    // Validate slug uniqueness if changing
    if (updateData.slug) {
      const existingClan = await this.clanDAO.findBySlug(updateData.slug);
      if (existingClan && existingClan.id !== clanId) {
        throw new Error('Clan slug already taken');
      }
    }
  }

  async validateUniqueClanSlug(slug) {
    const existingClan = await this.clanDAO.findBySlug(slug);
    if (existingClan) {
      throw new Error('Clan slug already taken');
    }
    return true;
  }

  async validateStakingRequirements(data) {
    const { userId, requiredStake, stakingData } = data;
    
    // Verify user has sufficient tokens
    const user = await this.userDAO.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (stakingData.amount < requiredStake) {
      throw new Error(`Insufficient stake: ${requiredStake} MLG tokens required`);
    }

    // Verify blockchain transaction if provided
    if (stakingData.transactionId) {
      const transaction = await this.transactionDAO.findById(stakingData.transactionId);
      if (!transaction || transaction.status !== 'confirmed') {
        throw new Error('Staking transaction not confirmed');
      }
    }

    return true;
  }

  async validateMembershipLimits(data) {
    const { clan, newMemberId } = data;
    
    const memberCount = await this.clanDAO.getMemberCount(clan.id);
    if (memberCount >= clan.max_members) {
      throw new Error('Clan has reached maximum member limit');
    }

    return true;
  }

  async validateRolePermissions(data) {
    const { userId, clanId, requiredRole } = data;
    
    const membership = await this.clanDAO.getMembership(clanId, userId);
    if (!membership) {
      throw new Error('User is not a member of this clan');
    }

    const roleHierarchy = ['member', 'moderator', 'admin', 'owner'];
    const userLevel = roleHierarchy.indexOf(membership.role);
    const requiredLevel = roleHierarchy.indexOf(requiredRole);
    
    if (userLevel < requiredLevel) {
      throw new Error(`Insufficient role: ${requiredRole} required`);
    }

    return true;
  }

  /**
   * Create new clan with token staking
   */
  async createClan(clanData, stakingData, creatorProfile = {}) {
    return await this.executeOperation('createClan', async () => {
      return await this.executeTransaction(async () => {
        // Create clan with owner membership
        const clan = await this.clanDAO.createClanWithOwnership(clanData, creatorProfile);
        
        // Process staking transaction
        if (stakingData.transactionId) {
          await this.transactionDAO.update(stakingData.transactionId, {
            clan_id: clan.id,
            status: 'processed',
            processed_at: new Date()
          });
        }

        // Initialize clan statistics
        await this.initializeClanStats(clan.id);
        
        // Update user statistics
        if (this.userDAO) {
          await this.userDAO.updateUserStats(clanData.owner_id, {
            clans_owned: { operator: '+', value: 1 }
          });
        }

        // Emit clan creation event
        if (this.eventEmitter) {
          this.eventEmitter.emit('clan:created', {
            clan,
            owner: clanData.owner_id,
            stakeAmount: stakingData.amount
          });
        }

        return clan;
      });
    }, { clanData, stakingData });
  }

  /**
   * Initialize clan statistics
   */
  async initializeClanStats(clanId) {
    try {
      await this.clanDAO.updateClanStats(clanId, {
        total_members: 1,
        total_content_submitted: 0,
        total_votes_cast: 0,
        reputation_score: 0,
        activity_score: 0
      });
    } catch (error) {
      this.logger.warn('Failed to initialize clan stats:', error);
    }
  }

  /**
   * Join clan with staking
   */
  async joinClan(clanId, userId, stakingData = null) {
    return await this.executeOperation('joinClan', async () => {
      return await this.executeTransaction(async () => {
        const clan = await this.clanDAO.findById(clanId);
        if (!clan.is_public && !stakingData?.invitationId) {
          throw new Error('Clan is private and requires invitation');
        }

        // Create membership
        const membership = await this.clanDAO.createMembership({
          clan_id: clanId,
          user_id: userId,
          role: 'member',
          stake_amount: stakingData?.amount || 0,
          joined_via: stakingData?.invitationId ? 'invitation' : 'direct'
        });

        // Process staking if required
        if (stakingData?.transactionId) {
          await this.transactionDAO.update(stakingData.transactionId, {
            clan_id: clanId,
            membership_id: membership.id,
            status: 'processed'
          });
        }

        // Update clan member count
        await this.clanDAO.updateClanStats(clanId, {
          total_members: { operator: '+', value: 1 }
        });

        // Update user statistics
        if (this.userDAO) {
          await this.userDAO.updateUserStats(userId, {
            clans_joined: { operator: '+', value: 1 }
          });
        }

        // Mark invitation as accepted if applicable
        if (stakingData?.invitationId) {
          await this.clanDAO.updateInvitation(stakingData.invitationId, {
            status: 'accepted',
            responded_at: new Date()
          });
        }

        // Emit join event
        if (this.eventEmitter) {
          this.eventEmitter.emit('clan:memberJoined', {
            clanId,
            userId,
            membership
          });
        }

        return membership;
      });
    }, { clanId, userId, stakingData });
  }

  /**
   * Invite member to clan
   */
  async inviteMember(clanId, inviterId, inviteeData, message = null) {
    return await this.executeOperation('inviteMember', async () => {
      const invitation = await this.clanDAO.createInvitation({
        clan_id: clanId,
        inviter_id: inviterId,
        invitee_id: inviteeData.userId,
        invitee_email: inviteeData.email,
        message,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

      // Emit invitation event
      if (this.eventEmitter) {
        this.eventEmitter.emit('clan:memberInvited', {
          clanId,
          inviterId,
          inviteeId: inviteeData.userId,
          invitation
        });
      }

      return invitation;
    }, { clanId, inviterId, inviteeData });
  }

  /**
   * Leave clan with stake reclamation
   */
  async leaveClan(clanId, userId) {
    return await this.executeOperation('leaveClan', async () => {
      return await this.executeTransaction(async () => {
        const membership = await this.clanDAO.getMembership(clanId, userId);
        if (!membership) {
          throw new Error('User is not a member of this clan');
        }

        if (membership.role === 'owner') {
          throw new Error('Owner cannot leave clan. Transfer ownership first.');
        }

        // Remove membership
        await this.clanDAO.deleteMembership(clanId, userId);

        // Update clan statistics
        await this.clanDAO.updateClanStats(clanId, {
          total_members: { operator: '-', value: 1 }
        });

        // Process stake reclamation if applicable
        if (membership.stake_amount > 0) {
          // Create reclamation transaction
          const reclamationTx = await this.transactionDAO.create({
            user_id: userId,
            clan_id: clanId,
            transaction_type: 'stake_reclaim',
            amount: membership.stake_amount,
            status: 'pending'
          });

          // Emit reclamation event for blockchain processing
          if (this.eventEmitter) {
            this.eventEmitter.emit('clan:stakeReclaim', {
              userId,
              clanId,
              amount: membership.stake_amount,
              transactionId: reclamationTx.id
            });
          }
        }

        // Update user statistics
        if (this.userDAO) {
          await this.userDAO.updateUserStats(userId, {
            clans_joined: { operator: '-', value: 1 }
          });
        }

        // Emit leave event
        if (this.eventEmitter) {
          this.eventEmitter.emit('clan:memberLeft', {
            clanId,
            userId,
            membership
          });
        }

        return { success: true, stakeReclaimed: membership.stake_amount };
      });
    }, { clanId, userId });
  }

  /**
   * Kick member from clan
   */
  async kickMember(clanId, kickerId, targetId, reason = null) {
    return await this.executeOperation('kickMember', async () => {
      return await this.executeTransaction(async () => {
        const membership = await this.clanDAO.getMembership(clanId, targetId);

        // Remove membership
        await this.clanDAO.deleteMembership(clanId, targetId);

        // Log moderation action
        await this.clanDAO.createModerationLog({
          clan_id: clanId,
          moderator_id: kickerId,
          target_user_id: targetId,
          action: 'kick',
          reason,
          membership_role: membership.role
        });

        // Update clan statistics
        await this.clanDAO.updateClanStats(clanId, {
          total_members: { operator: '-', value: 1 }
        });

        // Emit kick event
        if (this.eventEmitter) {
          this.eventEmitter.emit('clan:memberKicked', {
            clanId,
            kickerId,
            targetId,
            reason,
            membership
          });
        }

        return { success: true };
      });
    }, { clanId, kickerId, targetId, reason });
  }

  /**
   * Update member role
   */
  async updateMemberRole(clanId, updaterId, targetId, newRole) {
    return await this.executeOperation('updateMemberRole', async () => {
      // Validate permissions
      await this.validateBusinessRule('rolePermissions', {
        userId: updaterId,
        clanId,
        requiredRole: 'admin'
      });

      const updatedMembership = await this.clanDAO.updateMembership(clanId, targetId, {
        role: newRole,
        role_updated_by: updaterId,
        role_updated_at: new Date()
      });

      // Log role change
      await this.clanDAO.createModerationLog({
        clan_id: clanId,
        moderator_id: updaterId,
        target_user_id: targetId,
        action: 'role_change',
        metadata: { new_role: newRole, old_role: updatedMembership.previousRole }
      });

      // Emit role update event
      if (this.eventEmitter) {
        this.eventEmitter.emit('clan:memberRoleUpdated', {
          clanId,
          updaterId,
          targetId,
          newRole,
          membership: updatedMembership
        });
      }

      return updatedMembership;
    }, { clanId, updaterId, targetId, newRole });
  }

  /**
   * Get clan with comprehensive data
   */
  async getClanProfile(clanId, viewerId = null, options = {}) {
    return await this.executeOperation('getClanProfile', async () => {
      const clan = await this.clanDAO.findById(clanId);
      if (!clan) {
        throw new Error('Clan not found');
      }

      const profile = { ...clan };

      if (options.includeMembers) {
        const members = await this.clanDAO.getClanMembers(clanId, {
          limit: options.memberLimit || 50
        });
        profile.members = members;
        profile.memberCount = members.length;
      }

      if (options.includeStats) {
        const stats = await this.getClanStatistics(clanId);
        profile.stats = stats;
      }

      if (options.includeActivity) {
        const activity = await this.clanDAO.getClanActivity(clanId, {
          limit: options.activityLimit || 20
        });
        profile.recentActivity = activity;
      }

      if (viewerId) {
        const membership = await this.clanDAO.getMembership(clanId, viewerId);
        profile.viewerMembership = membership;
      }

      return profile;
    }, { clanId, viewerId, options });
  }

  /**
   * Get clan statistics and rankings
   */
  async getClanStatistics(clanId) {
    return await this.executeOperation('getClanStats', async () => {
      const [
        basicStats,
        membershipStats,
        activityStats,
        rankings
      ] = await Promise.all([
        this.clanDAO.getClanStats(clanId),
        this.clanDAO.getMembershipStats(clanId),
        this.clanDAO.getActivityStats(clanId),
        this.getClanRankings(clanId)
      ]);

      return {
        ...basicStats,
        membership: membershipStats,
        activity: activityStats,
        rankings
      };
    }, { clanId });
  }

  /**
   * Get clan rankings across different metrics
   */
  async getClanRankings(clanId) {
    const [
      reputationRank,
      memberRank,
      activityRank
    ] = await Promise.all([
      this.clanDAO.getClanRanking(clanId, 'reputation_score'),
      this.clanDAO.getClanRanking(clanId, 'total_members'),
      this.clanDAO.getClanRanking(clanId, 'activity_score')
    ]);

    return {
      reputation: reputationRank,
      members: memberRank,
      activity: activityRank
    };
  }

  /**
   * Search clans with advanced filtering
   */
  async searchClans(searchParams, options = {}) {
    return await this.executeOperation('searchClans', async () => {
      const results = await this.clanDAO.searchClans(searchParams, options);
      
      // Enrich results with member counts if requested
      if (options.includeMemberCount) {
        for (const clan of results.clans) {
          clan.memberCount = await this.clanDAO.getMemberCount(clan.id);
        }
      }

      return results;
    }, { searchParams, options });
  }

  /**
   * Get clan leaderboard
   */
  async getClanLeaderboard(metric = 'reputation_score', options = {}) {
    return await this.executeOperation('getClanLeaderboard', async () => {
      return await this.clanDAO.getClanLeaderboard(metric, options);
    }, { metric, options });
  }

  /**
   * Update clan activity scores based on member actions
   */
  async updateClanActivity(clanId, activityType, activityData = {}) {
    return await this.executeOperation('updateClanActivity', async () => {
      const updates = {};
      
      switch (activityType) {
        case 'content_submitted':
          updates.total_content_submitted = { operator: '+', value: 1 };
          updates.activity_score = { operator: '+', value: 2 };
          break;
          
        case 'content_approved':
          updates.reputation_score = { operator: '+', value: 5 };
          updates.activity_score = { operator: '+', value: 3 };
          break;
          
        case 'vote_cast':
          updates.total_votes_cast = { operator: '+', value: 1 };
          updates.activity_score = { operator: '+', value: 1 };
          break;
          
        case 'member_joined':
          updates.total_members = { operator: '+', value: 1 };
          break;
          
        default:
          throw new Error(`Unknown activity type: ${activityType}`);
      }

      return await this.clanDAO.updateClanStats(clanId, updates);
    }, { clanId, activityType, activityData });
  }

  async updateAnalytics(operationName, result, context) {
    // Track clan-specific analytics
    if (this.metrics) {
      this.metrics.recordClanOperation(operationName, context.clanId);
    }
  }
}

export default ClanRepository;