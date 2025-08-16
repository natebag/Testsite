/**
 * Clan Data Access Object (DAO) for MLG.clan Platform
 * 
 * Handles all database operations related to clans, memberships, invitations,
 * and governance with comprehensive validation and caching.
 * 
 * Features:
 * - Clan CRUD operations with staking integration
 * - Membership management and role assignments
 * - Invitation system and approval workflows
 * - Governance and voting proposal support
 * - Tier management and staking requirements
 * - Activity tracking and statistics
 * - Search and discovery features
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

import Joi from 'joi';
import { BaseDAO } from './BaseDAO.js';
import { MLGUsernameTaggingService } from '../../auth/mlg-username-tagging-service.js';

/**
 * Validation schemas for clan operations
 */
const CLAN_SCHEMAS = {
  create: Joi.object({
    name: Joi.string().min(3).max(32).pattern(/^[a-zA-Z0-9_-]+$/).required(),
    slug: Joi.string().min(3).max(32).pattern(/^[a-z0-9-]+$/).required(),
    description: Joi.string().max(1000).optional(),
    owner_id: Joi.string().uuid().required(),
    tier: Joi.string().valid('bronze', 'silver', 'gold', 'diamond').default('bronze'),
    required_stake: Joi.number().min(0).default(100),
    max_members: Joi.number().integer().min(1).max(1000).default(20),
    is_public: Joi.boolean().default(true),
    voting_enabled: Joi.boolean().default(true),
    proposal_threshold: Joi.number().min(0).default(10),
    banner_url: Joi.string().uri().optional(),
    logo_url: Joi.string().uri().optional(),
    color_theme: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
    rules: Joi.array().items(Joi.string().max(500)).max(10).optional(),
    tags: Joi.array().items(Joi.string().max(25)).max(10).optional()
  }),

  update: Joi.object({
    name: Joi.string().min(3).max(32).pattern(/^[a-zA-Z0-9_-]+$/).optional(),
    description: Joi.string().max(1000).optional(),
    max_members: Joi.number().integer().min(1).max(1000).optional(),
    is_public: Joi.boolean().optional(),
    voting_enabled: Joi.boolean().optional(),
    proposal_threshold: Joi.number().min(0).optional(),
    banner_url: Joi.string().uri().optional(),
    logo_url: Joi.string().uri().optional(),
    color_theme: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
    rules: Joi.array().items(Joi.string().max(500)).max(10).optional(),
    tags: Joi.array().items(Joi.string().max(25)).max(10).optional(),
    status: Joi.string().valid('active', 'inactive', 'suspended').optional()
  }),

  member: Joi.object({
    clan_id: Joi.string().uuid().required(),
    user_id: Joi.string().uuid().required(),
    role: Joi.string().valid('owner', 'admin', 'moderator', 'member').default('member'),
    invited_by: Joi.string().uuid().optional(),
    notes: Joi.string().max(500).optional()
  }),

  invitation: Joi.object({
    clan_id: Joi.string().uuid().required(),
    invited_user_id: Joi.string().uuid().required(),
    invited_by_user_id: Joi.string().uuid().required(),
    role: Joi.string().valid('owner', 'admin', 'moderator', 'member').default('member'),
    message: Joi.string().max(500).optional(),
    expires_at: Joi.date().min('now').optional()
  })
};

/**
 * Clan DAO class extending BaseDAO
 */
export class ClanDAO extends BaseDAO {
  constructor(options = {}) {
    super({
      tableName: 'clans',
      primaryKey: 'id',
      createSchema: CLAN_SCHEMAS.create,
      updateSchema: CLAN_SCHEMAS.update,
      cacheEnabled: true,
      cacheTTL: 300, // 5 minutes for clan data
      cacheKeyPrefix: 'clan',
      ...options
    });

    this.memberSchema = CLAN_SCHEMAS.member;
    this.invitationSchema = CLAN_SCHEMAS.invitation;
    
    // Initialize MLG tagging service
    this.mlgTaggingService = new MLGUsernameTaggingService({
      db: this.db,
      cache: this.redis,
      logger: this.logger
    });
    
    // Initialize tagging service
    this.initializeMLGTagging();
  }

  /**
   * Initialize MLG tagging service
   */
  async initializeMLGTagging() {
    try {
      await this.mlgTaggingService.initialize();
      this.logger.info('🏷️ MLG tagging service integrated with ClanDAO');
    } catch (error) {
      this.logger.error('❌ Failed to initialize MLG tagging service:', error);
    }
  }

  /**
   * Find clan by slug
   * @param {string} slug - Clan slug
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Clan record with member info
   */
  async findBySlug(slug, options = {}) {
    const startTime = Date.now();
    const cacheKey = `${this.cacheKeyPrefix}:slug:${slug}`;
    
    try {
      // Check cache first
      if (this.cacheEnabled && this.redis) {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          this.cacheHits++;
          return JSON.parse(cached);
        }
        this.cacheMisses++;
      }

      const query = `
        SELECT 
          c.*,
          u.username as owner_username,
          up.display_name as owner_display_name,
          up.avatar_url as owner_avatar
        FROM clans c
        LEFT JOIN users u ON c.owner_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE c.slug = $1
          ${options.includeInactive ? '' : "AND c.status = 'active'"}
      `;

      const result = await this.executeQuery(query, [slug]);
      const clan = result.rows[0] || null;

      // Cache the result
      if (clan && this.cacheEnabled && this.redis) {
        await this.redis.setEx(cacheKey, this.cacheTTL, JSON.stringify(clan));
      }

      this.trackQueryPerformance(startTime, 'findBySlug');
      return clan;

    } catch (error) {
      this.handleError('findBySlug', error, { slug, options });
      throw error;
    }
  }

  /**
   * Find clans by owner
   * @param {string} ownerId - Owner user ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Clan records
   */
  async findByOwner(ownerId, options = {}) {
    const startTime = Date.now();
    
    try {
      const query = `
        SELECT 
          c.*,
          (SELECT COUNT(*) FROM clan_members cm WHERE cm.clan_id = c.id AND cm.is_active = true) as active_members
        FROM clans c
        WHERE c.owner_id = $1
          ${options.includeInactive ? '' : "AND c.status = 'active'"}
        ORDER BY c.created_at DESC
      `;

      const result = await this.executeQuery(query, [ownerId]);

      this.trackQueryPerformance(startTime, 'findByOwner');
      return result.rows;

    } catch (error) {
      this.handleError('findByOwner', error, { ownerId, options });
      throw error;
    }
  }

  /**
   * Create clan with initial owner membership
   * @param {Object} clanData - Clan data
   * @returns {Promise<Object>} Created clan with membership
   */
  async createClan(clanData) {
    const startTime = Date.now();
    
    try {
      return await this.executeTransaction(async (txDAO) => {
        // Create clan record
        const clan = await txDAO.create(clanData);
        
        // Add owner as member
        const memberData = {
          clan_id: clan.id,
          user_id: clanData.owner_id,
          role: 'owner',
          is_active: true,
          joined_at: new Date()
        };

        const memberQuery = `
          INSERT INTO clan_members (
            clan_id, user_id, role, is_active, joined_at
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;

        await txDAO.executeQuery(memberQuery, [
          memberData.clan_id,
          memberData.user_id,
          memberData.role,
          memberData.is_active,
          memberData.joined_at
        ]);

        // Update clan member count
        await txDAO.executeQuery(`
          UPDATE clans SET member_count = 1 WHERE id = $1
        `, [clan.id]);

        const clanWithStats = {
          ...clan,
          member_count: 1,
          active_members: 1
        };

        // Cache the created clan
        if (this.cacheEnabled && this.redis) {
          const cacheKey = `${this.cacheKeyPrefix}:${clan.id}`;
          const slugCacheKey = `${this.cacheKeyPrefix}:slug:${clan.slug}`;
          
          await Promise.all([
            this.redis.setEx(cacheKey, this.cacheTTL, JSON.stringify(clanWithStats)),
            this.redis.setEx(slugCacheKey, this.cacheTTL, JSON.stringify(clanWithStats))
          ]);
        }

        this.trackQueryPerformance(startTime, 'createClan');
        this.emitEvent('clan_created', clanWithStats);
        
        return clanWithStats;
      });

    } catch (error) {
      this.handleError('createClan', error, { clanData });
      throw error;
    }
  }

  /**
   * Add member to clan
   * @param {Object} memberData - Member data
   * @param {Object} options - Add options
   * @returns {Promise<Object>} Created membership
   */
  async addMember(memberData, options = {}) {
    const startTime = Date.now();
    
    try {
      // Validate member data
      if (this.memberSchema) {
        const { error, value } = this.memberSchema.validate(memberData);
        if (error) {
          throw new Error(`Member validation error: ${error.message}`);
        }
        memberData = value;
      }

      return await this.executeTransaction(async (txDAO) => {
        // Check if clan exists and has space
        const clanQuery = `
          SELECT id, max_members, member_count, status
          FROM clans 
          WHERE id = $1 AND status = 'active'
        `;
        const clanResult = await txDAO.executeQuery(clanQuery, [memberData.clan_id]);
        
        if (clanResult.rows.length === 0) {
          throw new Error('Clan not found or inactive');
        }

        const clan = clanResult.rows[0];
        if (clan.member_count >= clan.max_members) {
          throw new Error('Clan is at maximum capacity');
        }

        // Check if user is already a member
        const existingQuery = `
          SELECT id FROM clan_members 
          WHERE clan_id = $1 AND user_id = $2 AND is_active = true
        `;
        const existing = await txDAO.executeQuery(existingQuery, [memberData.clan_id, memberData.user_id]);
        
        if (existing.rows.length > 0) {
          throw new Error('User is already a member of this clan');
        }

        // Create membership record
        const createData = {
          ...memberData,
          is_active: true,
          joined_at: new Date()
        };

        const memberQuery = `
          INSERT INTO clan_members (
            clan_id, user_id, role, is_active, joined_at, invited_by, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;

        const memberResult = await txDAO.executeQuery(memberQuery, [
          createData.clan_id,
          createData.user_id,
          createData.role,
          createData.is_active,
          createData.joined_at,
          createData.invited_by || null,
          createData.notes || null
        ]);

        const member = memberResult.rows[0];

        // Update clan member count
        await txDAO.executeQuery(`
          UPDATE clans 
          SET member_count = member_count + 1, updated_at = NOW()
          WHERE id = $1
        `, [memberData.clan_id]);

        // Invalidate clan cache
        if (this.cacheEnabled && this.redis) {
          await this.invalidateCache(memberData.clan_id);
        }

        this.trackQueryPerformance(startTime, 'addMember');
        this.emitEvent('member_added', member);
        
        return member;
      });

    } catch (error) {
      this.handleError('addMember', error, { memberData, options });
      throw error;
    }
  }

  /**
   * Remove member from clan
   * @param {string} clanId - Clan ID
   * @param {string} userId - User ID
   * @param {Object} options - Remove options
   * @returns {Promise<boolean>} Success status
   */
  async removeMember(clanId, userId, options = {}) {
    const startTime = Date.now();
    
    try {
      return await this.executeTransaction(async (txDAO) => {
        // Check if member exists and get their role
        const memberQuery = `
          SELECT id, role FROM clan_members 
          WHERE clan_id = $1 AND user_id = $2 AND is_active = true
        `;
        const memberResult = await txDAO.executeQuery(memberQuery, [clanId, userId]);
        
        if (memberResult.rows.length === 0) {
          throw new Error('Member not found or already inactive');
        }

        const member = memberResult.rows[0];

        // Check if trying to remove owner
        if (member.role === 'owner') {
          throw new Error('Cannot remove clan owner. Transfer ownership first.');
        }

        // Deactivate member
        const updateQuery = `
          UPDATE clan_members 
          SET is_active = false, updated_at = NOW()
          WHERE clan_id = $1 AND user_id = $2
          RETURNING *
        `;
        const updateResult = await txDAO.executeQuery(updateQuery, [clanId, userId]);
        const removedMember = updateResult.rows[0];

        // Update clan member count
        await txDAO.executeQuery(`
          UPDATE clans 
          SET member_count = member_count - 1, updated_at = NOW()
          WHERE id = $1
        `, [clanId]);

        // Invalidate clan cache
        if (this.cacheEnabled && this.redis) {
          await this.invalidateCache(clanId);
        }

        this.trackQueryPerformance(startTime, 'removeMember');
        this.emitEvent('member_removed', removedMember);
        
        return true;
      });

    } catch (error) {
      this.handleError('removeMember', error, { clanId, userId, options });
      throw error;
    }
  }

  /**
   * Update member role
   * @param {string} clanId - Clan ID
   * @param {string} userId - User ID
   * @param {string} newRole - New role
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated member
   */
  async updateMemberRole(clanId, userId, newRole, options = {}) {
    const startTime = Date.now();
    
    try {
      const validRoles = ['member', 'moderator', 'admin'];
      if (!validRoles.includes(newRole)) {
        throw new Error(`Invalid role: ${newRole}`);
      }

      const query = `
        UPDATE clan_members 
        SET role = $3, updated_at = NOW()
        WHERE clan_id = $1 AND user_id = $2 AND is_active = true AND role != 'owner'
        RETURNING *
      `;

      const result = await this.executeQuery(query, [clanId, userId, newRole]);
      
      if (result.rows.length === 0) {
        throw new Error('Member not found or cannot update role');
      }

      const member = result.rows[0];

      // Invalidate clan cache
      if (this.cacheEnabled && this.redis) {
        await this.invalidateCache(clanId);
      }

      this.trackQueryPerformance(startTime, 'updateMemberRole');
      this.emitEvent('member_role_updated', member, { newRole });
      
      return member;

    } catch (error) {
      this.handleError('updateMemberRole', error, { clanId, userId, newRole, options });
      throw error;
    }
  }

  /**
   * Get clan members with user information
   * @param {string} clanId - Clan ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Members with pagination
   */
  async getClanMembers(clanId, options = {}) {
    const startTime = Date.now();
    const { limit = 50, offset = 0, role = null, includeInactive = false } = options;
    
    try {
      let whereConditions = ['cm.clan_id = $1'];
      const params = [clanId];
      let paramIndex = 2;

      if (!includeInactive) {
        whereConditions.push('cm.is_active = true');
      }

      if (role) {
        whereConditions.push(`cm.role = $${paramIndex}`);
        params.push(role);
        paramIndex++;
      }

      const query = `
        SELECT 
          cm.*,
          u.wallet_address,
          u.username,
          u.reputation_score,
          up.display_name,
          up.avatar_url,
          invited_by_user.username as invited_by_username
        FROM clan_members cm
        JOIN users u ON cm.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN users invited_by_user ON cm.invited_by = invited_by_user.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY 
          CASE cm.role 
            WHEN 'owner' THEN 1 
            WHEN 'admin' THEN 2 
            WHEN 'moderator' THEN 3 
            ELSE 4 
          END,
          cm.joined_at ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      const result = await this.executeQuery(query, params);

      // Apply MLG tagging to all clan member usernames
      if (this.mlgTaggingService) {
        for (const member of result.rows) {
          const displayUsername = await this.mlgTaggingService.getDisplayUsername(
            member.user_id, 
            member.display_name || member.username, 
            { clanId: clanId, source: 'clan_roster' }
          );
          member.mlg_display_name = displayUsername;
          member.is_tagged = displayUsername !== (member.display_name || member.username);
        }
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM clan_members cm
        WHERE ${whereConditions.join(' AND ')}
      `;

      const countResult = await this.executeQuery(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      this.trackQueryPerformance(startTime, 'getClanMembers');

      return {
        members: result.rows,
        pagination: {
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit),
          currentPage: Math.floor(offset / limit) + 1
        }
      };

    } catch (error) {
      this.handleError('getClanMembers', error, { clanId, options });
      throw error;
    }
  }

  /**
   * Create clan invitation
   * @param {Object} invitationData - Invitation data
   * @returns {Promise<Object>} Created invitation
   */
  async createInvitation(invitationData) {
    const startTime = Date.now();
    
    try {
      // Validate invitation data
      if (this.invitationSchema) {
        const { error, value } = this.invitationSchema.validate(invitationData);
        if (error) {
          throw new Error(`Invitation validation error: ${error.message}`);
        }
        invitationData = value;
      }

      return await this.executeTransaction(async (txDAO) => {
        // Check if clan exists and has space
        const clanQuery = `
          SELECT id, max_members, member_count, name
          FROM clans 
          WHERE id = $1 AND status = 'active'
        `;
        const clanResult = await txDAO.executeQuery(clanQuery, [invitationData.clan_id]);
        
        if (clanResult.rows.length === 0) {
          throw new Error('Clan not found or inactive');
        }

        const clan = clanResult.rows[0];
        if (clan.member_count >= clan.max_members) {
          throw new Error('Clan is at maximum capacity');
        }

        // Check if user is already a member or has pending invitation
        const existingQuery = `
          SELECT 'member' as type FROM clan_members 
          WHERE clan_id = $1 AND user_id = $2 AND is_active = true
          UNION
          SELECT 'invitation' as type FROM clan_invitations 
          WHERE clan_id = $1 AND invited_user_id = $2 AND status = 'pending'
        `;
        const existing = await txDAO.executeQuery(existingQuery, [invitationData.clan_id, invitationData.invited_user_id]);
        
        if (existing.rows.length > 0) {
          const type = existing.rows[0].type;
          throw new Error(type === 'member' 
            ? 'User is already a member of this clan'
            : 'User already has a pending invitation'
          );
        }

        // Create invitation
        const createData = {
          ...invitationData,
          expires_at: invitationData.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          status: 'pending'
        };

        const invitationQuery = `
          INSERT INTO clan_invitations (
            clan_id, invited_user_id, invited_by_user_id, role, message, expires_at, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;

        const result = await txDAO.executeQuery(invitationQuery, [
          createData.clan_id,
          createData.invited_user_id,
          createData.invited_by_user_id,
          createData.role,
          createData.message || null,
          createData.expires_at,
          createData.status
        ]);

        const invitation = result.rows[0];

        this.trackQueryPerformance(startTime, 'createInvitation');
        this.emitEvent('invitation_created', invitation);
        
        return invitation;
      });

    } catch (error) {
      this.handleError('createInvitation', error, { invitationData });
      throw error;
    }
  }

  /**
   * Respond to clan invitation
   * @param {string} invitationId - Invitation ID
   * @param {string} response - 'accepted' or 'declined'
   * @param {Object} options - Response options
   * @returns {Promise<Object>} Updated invitation and optional membership
   */
  async respondToInvitation(invitationId, response, options = {}) {
    const startTime = Date.now();
    
    try {
      const validResponses = ['accepted', 'declined'];
      if (!validResponses.includes(response)) {
        throw new Error(`Invalid response: ${response}`);
      }

      return await this.executeTransaction(async (txDAO) => {
        // Get invitation details
        const invitationQuery = `
          SELECT * FROM clan_invitations 
          WHERE id = $1 AND status = 'pending' AND expires_at > NOW()
        `;
        const invitationResult = await txDAO.executeQuery(invitationQuery, [invitationId]);
        
        if (invitationResult.rows.length === 0) {
          throw new Error('Invitation not found, already responded to, or expired');
        }

        const invitation = invitationResult.rows[0];

        // Update invitation status
        const updateQuery = `
          UPDATE clan_invitations 
          SET status = $2, responded_at = NOW(), updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `;
        const updateResult = await txDAO.executeQuery(updateQuery, [invitationId, response]);
        const updatedInvitation = updateResult.rows[0];

        let membership = null;

        // If accepted, create membership
        if (response === 'accepted') {
          const memberData = {
            clan_id: invitation.clan_id,
            user_id: invitation.invited_user_id,
            role: invitation.role,
            invited_by: invitation.invited_by_user_id
          };

          membership = await this.addMember(memberData);
        }

        this.trackQueryPerformance(startTime, 'respondToInvitation');
        this.emitEvent('invitation_responded', updatedInvitation, { response, membership });
        
        return {
          invitation: updatedInvitation,
          membership
        };
      });

    } catch (error) {
      this.handleError('respondToInvitation', error, { invitationId, response, options });
      throw error;
    }
  }

  /**
   * Search clans by various criteria
   * @param {Object} searchParams - Search parameters
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Search results
   */
  async searchClans(searchParams, options = {}) {
    const startTime = Date.now();
    const { limit = 25, offset = 0 } = options;
    
    try {
      let whereConditions = ["c.status = 'active'"];
      const params = [];
      let paramIndex = 1;

      // Name/slug search
      if (searchParams.query) {
        whereConditions.push(`(c.name ILIKE $${paramIndex} OR c.slug ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`);
        params.push(`%${searchParams.query}%`);
        paramIndex++;
      }

      // Tier filter
      if (searchParams.tier) {
        whereConditions.push(`c.tier = $${paramIndex}`);
        params.push(searchParams.tier);
        paramIndex++;
      }

      // Tags filter
      if (searchParams.tags && searchParams.tags.length > 0) {
        whereConditions.push(`c.tags && $${paramIndex}`);
        params.push(searchParams.tags);
        paramIndex++;
      }

      // Member count range
      if (searchParams.minMembers) {
        whereConditions.push(`c.member_count >= $${paramIndex}`);
        params.push(searchParams.minMembers);
        paramIndex++;
      }

      if (searchParams.maxMembers) {
        whereConditions.push(`c.member_count <= $${paramIndex}`);
        params.push(searchParams.maxMembers);
        paramIndex++;
      }

      // Public only filter
      if (!searchParams.includePrivate) {
        whereConditions.push('c.is_public = true');
      }

      // Has available spots
      if (searchParams.hasAvailableSpots) {
        whereConditions.push('c.member_count < c.max_members');
      }

      const query = `
        SELECT 
          c.*,
          u.username as owner_username,
          up.display_name as owner_display_name,
          up.avatar_url as owner_avatar,
          c.member_count,
          (c.max_members - c.member_count) as available_spots
        FROM clans c
        LEFT JOIN users u ON c.owner_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY 
          ${searchParams.sortBy === 'members' ? 'c.member_count DESC' :
            searchParams.sortBy === 'newest' ? 'c.created_at DESC' :
            searchParams.sortBy === 'activity' ? 'c.activity_score DESC' :
            'c.activity_score DESC, c.member_count DESC'}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      const result = await this.executeQuery(query, params);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM clans c
        WHERE ${whereConditions.join(' AND ')}
      `;

      const countResult = await this.executeQuery(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      this.trackQueryPerformance(startTime, 'searchClans');

      return {
        clans: result.rows,
        pagination: {
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit),
          currentPage: Math.floor(offset / limit) + 1
        }
      };

    } catch (error) {
      this.handleError('searchClans', error, { searchParams, options });
      throw error;
    }
  }

  /**
   * Get clan statistics and analytics
   * @param {string} clanId - Clan ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Clan statistics
   */
  async getClanStatistics(clanId, options = {}) {
    const startTime = Date.now();
    const { days = 30 } = options;
    
    try {
      const query = `
        SELECT 
          c.*,
          -- Member statistics
          (SELECT COUNT(*) FROM clan_members cm WHERE cm.clan_id = c.id AND cm.is_active = true) as active_members,
          (SELECT COUNT(*) FROM clan_members cm WHERE cm.clan_id = c.id AND cm.role = 'admin') as admin_count,
          (SELECT COUNT(*) FROM clan_members cm WHERE cm.clan_id = c.id AND cm.role = 'moderator') as moderator_count,
          
          -- Activity statistics
          (SELECT COUNT(*) FROM content_submissions cs 
           JOIN clan_members cm ON cs.user_id = cm.user_id 
           WHERE cm.clan_id = c.id AND cm.is_active = true 
           AND cs.created_at > NOW() - INTERVAL '${days} days') as recent_content_submissions,
           
          (SELECT COUNT(*) FROM content_votes cv 
           JOIN clan_members cm ON cv.user_id = cm.user_id 
           WHERE cm.clan_id = c.id AND cm.is_active = true 
           AND cv.created_at > NOW() - INTERVAL '${days} days') as recent_votes,
           
          -- Invitation statistics
          (SELECT COUNT(*) FROM clan_invitations ci 
           WHERE ci.clan_id = c.id AND ci.status = 'pending') as pending_invitations,
           
          (SELECT COUNT(*) FROM clan_invitations ci 
           WHERE ci.clan_id = c.id AND ci.status = 'accepted' 
           AND ci.responded_at > NOW() - INTERVAL '${days} days') as recent_joins,
           
          -- Growth metrics
          (SELECT COUNT(*) FROM clan_members cm 
           WHERE cm.clan_id = c.id AND cm.is_active = true 
           AND cm.joined_at > NOW() - INTERVAL '${days} days') as new_members_count,
           
          -- Average member reputation
          (SELECT ROUND(AVG(u.reputation_score)) FROM clan_members cm 
           JOIN users u ON cm.user_id = u.id 
           WHERE cm.clan_id = c.id AND cm.is_active = true) as avg_member_reputation
           
        FROM clans c
        WHERE c.id = $1
      `;

      const result = await this.executeQuery(query, [clanId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const stats = result.rows[0];
      
      // Convert counts to numbers
      stats.active_members = parseInt(stats.active_members) || 0;
      stats.admin_count = parseInt(stats.admin_count) || 0;
      stats.moderator_count = parseInt(stats.moderator_count) || 0;
      stats.recent_content_submissions = parseInt(stats.recent_content_submissions) || 0;
      stats.recent_votes = parseInt(stats.recent_votes) || 0;
      stats.pending_invitations = parseInt(stats.pending_invitations) || 0;
      stats.recent_joins = parseInt(stats.recent_joins) || 0;
      stats.new_members_count = parseInt(stats.new_members_count) || 0;
      stats.avg_member_reputation = parseInt(stats.avg_member_reputation) || 0;
      
      // Calculate derived metrics
      stats.member_capacity_percentage = (stats.active_members / stats.max_members) * 100;
      stats.growth_rate = stats.active_members > 0 ? (stats.new_members_count / stats.active_members) * 100 : 0;

      this.trackQueryPerformance(startTime, 'getClanStatistics');
      return stats;

    } catch (error) {
      this.handleError('getClanStatistics', error, { clanId, options });
      throw error;
    }
  }

  /**
   * Override findById to include owner information
   */
  async findById(id, options = {}) {
    const startTime = Date.now();
    const cacheKey = `${this.cacheKeyPrefix}:${id}`;
    
    try {
      // Check cache first
      if (this.cacheEnabled && this.redis) {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          this.cacheHits++;
          return JSON.parse(cached);
        }
        this.cacheMisses++;
      }

      const query = `
        SELECT 
          c.*,
          u.username as owner_username,
          up.display_name as owner_display_name,
          up.avatar_url as owner_avatar
        FROM clans c
        LEFT JOIN users u ON c.owner_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE c.id = $1
          ${options.includeInactive ? '' : "AND c.status = 'active'"}
      `;

      const result = await this.executeQuery(query, [id]);
      const clan = result.rows[0] || null;

      // Cache the result
      if (clan && this.cacheEnabled && this.redis) {
        await this.redis.setEx(cacheKey, this.cacheTTL, JSON.stringify(clan));
      }

      this.trackQueryPerformance(startTime, 'findById');
      return clan;

    } catch (error) {
      this.handleError('findById', error, { id, options });
      throw error;
    }
  }

  /**
   * Invalidate clan cache including slug cache
   */
  async invalidateCache(id) {
    if (!this.redis) return;
    
    try {
      // Get clan data first to clear slug cache
      const clan = await super.findById(id, { includeInactive: true });
      
      const cacheKeys = [
        `${this.cacheKeyPrefix}:${id}`
      ];
      
      if (clan && clan.slug) {
        cacheKeys.push(`${this.cacheKeyPrefix}:slug:${clan.slug}`);
      }
      
      await this.redis.del(...cacheKeys);
      
    } catch (error) {
      this.logger.warn('Failed to invalidate clan cache:', error);
    }
  }
}

export default ClanDAO;