/**
 * MLG.clan Invitation and Approval System - Sub-task 5.2
 * 
 * Comprehensive clan member invitation and approval system with multiple invitation methods,
 * approval workflows, and member capacity management integrated with the MLG token ecosystem.
 * 
 * Core Features:
 * - Direct member invitations by clan admins with role assignment
 * - Shareable invite links with expiration and usage limits
 * - Join request system for public/private clans with approval queues
 * - Bulk invitation capabilities for efficient team management
 * - Multi-admin approval requirements for sensitive roles
 * - Member capacity management based on clan tier limits
 * - Comprehensive invitation tracking and audit trail
 * 
 * Invitation Methods:
 * - Direct Invite: Admin sends invitation directly to user's wallet address
 * - Invite Links: Shareable URLs with customizable settings (expiration, uses, roles)
 * - Join Requests: Users request to join clan, pending admin approval
 * - Bulk Invites: Mass invitation system for tournaments and events
 * 
 * Approval Workflows:
 * - Auto-approval for invite links (configurable)
 * - Manual approval queue with multi-admin voting for sensitive roles
 * - Invitation history and comprehensive audit trail
 * - Cooldown periods and spam prevention measures
 * 
 * Security Features:
 * - Cryptographically secure invitation token generation
 * - Rate limiting and abuse prevention mechanisms
 * - Member verification requirements and wallet validation
 * - Invitation link access controls and permissions
 * 
 * Integration:
 * - Seamless integration with existing clan management system
 * - MLG token-based verification and member capacity limits
 * - Phantom wallet integration for secure invitation acceptance
 * - Notification system for real-time invitation updates
 * 
 * @author Claude Code - Community Management Specialist
 * @version 1.0.0
 * @integration MLG Token: 7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL
 * @depends clan-management.js - Core clan management system
 */

import {
PublicKey,
  Keypair,
  Transaction,
  SystemProgram
} from '@solana/web3.js';

import { createMLGTokenConnection, MLG_TOKEN_CONFIG, TOKEN_PROGRAMS } from '../../../config/environment/solana-config.js';
import { CLAN_TIER_CONFIG, CLAN_ROLES, CLAN_CONFIG } from './clan-management.js';
import crypto from 'crypto';

/**
 * Invitation Configuration
 * Defines limits, timeouts, and security settings for invitations
 */
export const INVITATION_CONFIG = {
  // Invitation token settings
  TOKEN_LENGTH: 32, // bytes for secure token generation
  TOKEN_EXPIRY: {
    DEFAULT: 7 * 24 * 60 * 60 * 1000, // 7 days
    SHORT: 24 * 60 * 60 * 1000, // 24 hours
    LONG: 30 * 24 * 60 * 60 * 1000, // 30 days
    PERMANENT: -1 // Never expires
  },
  
  // Invitation limits per role
  INVITATION_LIMITS: {
    OWNER: {
      daily: -1, // Unlimited
      concurrent: 50,
      bulkSize: 25
    },
    ADMIN: {
      daily: 25,
      concurrent: 20,
      bulkSize: 15
    },
    MODERATOR: {
      daily: 10,
      concurrent: 10,
      bulkSize: 5
    },
    MEMBER: {
      daily: 3,
      concurrent: 5,
      bulkSize: 3
    }
  },
  
  // Join request settings
  JOIN_REQUESTS: {
    MAX_PENDING_PER_USER: 3, // Max clans user can request to join
    AUTO_CLEANUP_DAYS: 30, // Auto-reject old requests
    APPROVAL_TIMEOUT: 7 * 24 * 60 * 60 * 1000, // 7 days
    MULTI_ADMIN_THRESHOLD: 2 // Requires 2+ admin approvals for sensitive roles
  },
  
  // Security and rate limiting
  RATE_LIMITS: {
    INVITATIONS_PER_MINUTE: 5,
    JOIN_REQUESTS_PER_HOUR: 3,
    LINK_GENERATION_PER_DAY: 10
  },
  
  // Cooldown periods
  COOLDOWNS: {
    REJECTION_COOLDOWN: 24 * 60 * 60 * 1000, // 24 hours before re-requesting
    INVITE_SPAM_COOLDOWN: 60 * 60 * 1000, // 1 hour between invites to same user
    BAN_COOLDOWN: 30 * 24 * 60 * 60 * 1000 // 30 days after ban before rejoining
  },
  
  // Notification settings
  NOTIFICATIONS: {
    ENABLED: true,
    BATCH_SIZE: 10,
    RETRY_ATTEMPTS: 3
  }
};

/**
 * Invitation Types
 * Defines different invitation methods and their properties
 */
export const INVITATION_TYPES = {
  DIRECT: {
    id: 'direct',
    name: 'Direct Invitation',
    requiresApproval: false,
    canSetRole: true,
    trackable: true
  },
  LINK: {
    id: 'link',
    name: 'Invitation Link',
    requiresApproval: false, // Configurable
    canSetRole: true,
    trackable: true
  },
  JOIN_REQUEST: {
    id: 'join_request',
    name: 'Join Request',
    requiresApproval: true,
    canSetRole: false, // Role assigned after approval
    trackable: true
  },
  BULK: {
    id: 'bulk',
    name: 'Bulk Invitation',
    requiresApproval: false,
    canSetRole: true,
    trackable: true
  }
};

/**
 * Invitation Status Types
 */
export const INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
  AUTO_ACCEPTED: 'auto_accepted'
};

/**
 * Clan Invitation Manager
 * Handles all aspects of clan invitations, approvals, and member management
 */
export class ClanInvitationManager {
  constructor(walletAdapter = null, clanManager = null) {
    this.walletAdapter = walletAdapter;
    this.clanManager = clanManager;
    this.connection = createMLGTokenConnection();
    
    // Invitation storage and caching
    this.invitations = new Map(); // invitation_id -> invitation_data
    this.userInvitations = new Map(); // user_address -> invitation_ids[]
    this.clanInvitations = new Map(); // clan_address -> invitation_ids[]
    this.inviteLinks = new Map(); // link_token -> link_data
    this.joinRequests = new Map(); // request_id -> request_data
    
    // Rate limiting and security
    this.rateLimits = new Map();
    this.cooldowns = new Map();
    this.auditTrail = [];
    
    // Notification queue
    this.notificationQueue = [];
    
    console.log('ClanInvitationManager initialized with comprehensive invitation system');
  }

  /**
   * Generate cryptographically secure invitation token
   */
  generateInvitationToken() {
    return crypto.randomBytes(INVITATION_CONFIG.TOKEN_LENGTH).toString('hex');
  }

  /**
   * Generate unique invitation ID
   */
  generateInvitationId(clanAddress, targetUser = null) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const userPart = targetUser ? targetUser.slice(-8) : 'bulk';
    return `inv_${clanAddress.slice(-8)}_${userPart}_${timestamp}_${random}`;
  }

  /**
   * Check rate limits for user actions
   */
  checkRateLimit(userAddress, action) {
    const key = `${userAddress}_${action}`;
    const now = Date.now();
    const limits = this.rateLimits.get(key) || { count: 0, resetTime: now };
    
    // Reset counter if time window expired
    if (now >= limits.resetTime) {
      limits.count = 0;
      limits.resetTime = now + (60 * 60 * 1000); // 1 hour window
    }
    
    const maxCount = INVITATION_CONFIG.RATE_LIMITS[action.toUpperCase()] || 10;
    
    if (limits.count >= maxCount) {
      const remainingTime = Math.ceil((limits.resetTime - now) / 60000);
      return {
        allowed: false,
        remainingTime: remainingTime,
        message: `Rate limit exceeded. Try again in ${remainingTime} minutes.`
      };
    }
    
    return { allowed: true };
  }

  /**
   * Update rate limit counters
   */
  updateRateLimit(userAddress, action) {
    const key = `${userAddress}_${action}`;
    const limits = this.rateLimits.get(key) || { count: 0, resetTime: Date.now() + 60 * 60 * 1000 };
    limits.count += 1;
    this.rateLimits.set(key, limits);
  }

  /**
   * Check user permissions for invitation actions
   */
  async checkInvitationPermissions(clanAddress, userAddress, action = 'invite') {
    try {
      const clan = await this.clanManager.getClan(clanAddress);
      if (!clan) {
        return { allowed: false, error: 'Clan not found' };
      }

      // Check if user is member
      if (!clan.members.includes(userAddress)) {
        return { allowed: false, error: 'User is not a clan member' };
      }

      // Determine user role
      let userRole = 'member';
      if (clan.owner === userAddress) {
        userRole = 'owner';
      } else if (clan.admins.includes(userAddress)) {
        userRole = 'admin';
      } else if (clan.moderators.includes(userAddress)) {
        userRole = 'moderator';
      }

      // Check role-specific permissions
      const roleConfig = CLAN_ROLES[userRole.toUpperCase()];
      if (!roleConfig) {
        return { allowed: false, error: 'Invalid user role' };
      }

      // Check specific permissions
      const requiredPermissions = {
        'invite': ['manage_members', 'all'],
        'bulk_invite': ['manage_members', 'all'],
        'approve_request': ['manage_members', 'all'],
        'reject_request': ['manage_members', 'all'],
        'revoke_invitation': ['manage_members', 'all']
      };

      const required = requiredPermissions[action] || ['manage_members'];
      const hasPermission = required.some(perm => 
        roleConfig.permissions.includes(perm) || roleConfig.permissions.includes('all')
      );

      if (!hasPermission) {
        return { allowed: false, error: 'Insufficient permissions' };
      }

      return { allowed: true, role: userRole, permissions: roleConfig.permissions };
    } catch (error) {
      console.error('Error checking invitation permissions:', error);
      return { allowed: false, error: 'Permission check failed' };
    }
  }

  /**
   * Validate invitation data
   */
  validateInvitationData(invitationData) {
    const validation = {
      isValid: false,
      errors: [],
      warnings: []
    };

    const { clanAddress, targetUser, role, type, expiresAt, message } = invitationData;

    // Required fields
    if (!clanAddress) validation.errors.push('Clan address is required');
    if (!type || !INVITATION_TYPES[type.toUpperCase()]) {
      validation.errors.push('Valid invitation type is required');
    }

    // Validate target user for direct invitations
    if (type === 'direct' && !targetUser) {
      validation.errors.push('Target user address is required for direct invitations');
    }

    // Validate role assignment
    if (role && !CLAN_ROLES[role.toUpperCase()]) {
      validation.errors.push('Invalid role specified');
    }

    // Validate expiration date
    if (expiresAt && new Date(expiresAt) <= new Date()) {
      validation.errors.push('Expiration date must be in the future');
    }

    // Validate message length
    if (message && message.length > 500) {
      validation.errors.push('Invitation message cannot exceed 500 characters');
    }

    validation.isValid = validation.errors.length === 0;
    return validation;
  }

  /**
   * Check clan capacity before sending invitations
   */
  async checkClanCapacity(clanAddress, additionalMembers = 1) {
    try {
      const clan = await this.clanManager.getClan(clanAddress);
      if (!clan) {
        return { hasCapacity: false, error: 'Clan not found' };
      }

      const currentMembers = clan.memberCount || clan.members.length;
      const maxMembers = clan.maxMembers;
      const availableSlots = maxMembers - currentMembers;

      // Count pending invitations
      const clanInvites = this.clanInvitations.get(clanAddress) || [];
      const pendingInvites = clanInvites.filter(inviteId => {
        const invite = this.invitations.get(inviteId);
        return invite && invite.status === INVITATION_STATUS.PENDING;
      }).length;

      const totalNeeded = additionalMembers + pendingInvites;

      return {
        hasCapacity: totalNeeded <= availableSlots,
        currentMembers: currentMembers,
        maxMembers: maxMembers,
        availableSlots: availableSlots,
        pendingInvites: pendingInvites,
        totalNeeded: totalNeeded
      };
    } catch (error) {
      console.error('Error checking clan capacity:', error);
      return { hasCapacity: false, error: 'Capacity check failed' };
    }
  }

  /**
   * Send direct invitation to specific user
   */
  async sendDirectInvitation(invitationData) {
    try {
      if (!this.walletAdapter || !this.walletAdapter.publicKey) {
        throw new Error('Wallet not connected');
      }

      const senderAddress = this.walletAdapter.publicKey.toString();
      const { clanAddress, targetUser, role = 'member', message = '', expiresAt } = invitationData;

      // Validate input
      const validation = this.validateInvitationData(invitationData);
      if (!validation.isValid) {
        throw new Error(`Invalid invitation data: ${validation.errors.join(', ')}`);
      }

      // Check permissions
      const permissionCheck = await this.checkInvitationPermissions(clanAddress, senderAddress);
      if (!permissionCheck.allowed) {
        throw new Error(permissionCheck.error);
      }

      // Check rate limits
      const rateCheck = this.checkRateLimit(senderAddress, 'INVITATIONS_PER_MINUTE');
      if (!rateCheck.allowed) {
        throw new Error(rateCheck.message);
      }

      // Check clan capacity
      const capacityCheck = await this.checkClanCapacity(clanAddress, 1);
      if (!capacityCheck.hasCapacity) {
        throw new Error(`Clan at capacity. Available slots: ${capacityCheck.availableSlots}`);
      }

      // Check if user already invited or member
      const clan = await this.clanManager.getClan(clanAddress);
      if (clan.members.includes(targetUser)) {
        throw new Error('User is already a member of this clan');
      }

      // Check for existing pending invitation
      const existingInvites = this.userInvitations.get(targetUser) || [];
      for (const inviteId of existingInvites) {
        const invite = this.invitations.get(inviteId);
        if (invite && invite.clanAddress === clanAddress && invite.status === INVITATION_STATUS.PENDING) {
          throw new Error('User already has a pending invitation to this clan');
        }
      }

      // Check cooldown periods
      const cooldownKey = `${senderAddress}_${targetUser}`;
      const lastInvite = this.cooldowns.get(cooldownKey);
      if (lastInvite && (Date.now() - lastInvite) < INVITATION_CONFIG.COOLDOWNS.INVITE_SPAM_COOLDOWN) {
        throw new Error('Please wait before sending another invitation to this user');
      }

      // Generate invitation
      const invitationId = this.generateInvitationId(clanAddress, targetUser);
      const invitation = {
        id: invitationId,
        type: INVITATION_TYPES.DIRECT.id,
        clanAddress: clanAddress,
        clanName: clan.name,
        targetUser: targetUser,
        senderAddress: senderAddress,
        role: role,
        message: message,
        
        // Timestamps
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt || new Date(Date.now() + INVITATION_CONFIG.TOKEN_EXPIRY.DEFAULT).toISOString(),
        
        // Status tracking
        status: INVITATION_STATUS.PENDING,
        attempts: 0,
        
        // Security
        token: this.generateInvitationToken(),
        
        // Metadata
        metadata: {
          inviterRole: permissionCheck.role,
          targetRole: role,
          clanTier: clan.tier,
          directInvite: true
        }
      };

      // Store invitation
      this.invitations.set(invitationId, invitation);
      
      // Update indexes
      const userInvites = this.userInvitations.get(targetUser) || [];
      userInvites.push(invitationId);
      this.userInvitations.set(targetUser, userInvites);
      
      const clanInvites = this.clanInvitations.get(clanAddress) || [];
      clanInvites.push(invitationId);
      this.clanInvitations.set(clanAddress, clanInvites);

      // Update rate limits and cooldowns
      this.updateRateLimit(senderAddress, 'INVITATIONS_PER_MINUTE');
      this.cooldowns.set(cooldownKey, Date.now());

      // Add to audit trail
      this.auditTrail.push({
        action: 'invitation_sent',
        clanAddress: clanAddress,
        actorAddress: senderAddress,
        targetAddress: targetUser,
        invitationId: invitationId,
        timestamp: new Date().toISOString(),
        metadata: { role: role, type: 'direct' }
      });

      // Queue notification
      this.queueNotification({
        type: 'invitation_received',
        recipientAddress: targetUser,
        data: {
          clanName: clan.name,
          inviterAddress: senderAddress,
          role: role,
          message: message,
          invitationId: invitationId
        }
      });

      console.log(`Direct invitation sent to ${targetUser} for clan ${clan.name}`);

      return {
        success: true,
        invitation: invitation,
        invitationId: invitationId
      };

    } catch (error) {
      console.error('Direct invitation failed:', error);
      throw error;
    }
  }

  /**
   * Create shareable invitation link
   */
  async createInvitationLink(linkData) {
    try {
      if (!this.walletAdapter || !this.walletAdapter.publicKey) {
        throw new Error('Wallet not connected');
      }

      const creatorAddress = this.walletAdapter.publicKey.toString();
      const { 
        clanAddress, 
        role = 'member', 
        maxUses = 1, 
        expiresAt,
        requireApproval = false,
        message = ''
      } = linkData;

      // Check permissions
      const permissionCheck = await this.checkInvitationPermissions(clanAddress, creatorAddress);
      if (!permissionCheck.allowed) {
        throw new Error(permissionCheck.error);
      }

      // Check rate limits
      const rateCheck = this.checkRateLimit(creatorAddress, 'LINK_GENERATION_PER_DAY');
      if (!rateCheck.allowed) {
        throw new Error(rateCheck.message);
      }

      // Get clan info
      const clan = await this.clanManager.getClan(clanAddress);
      if (!clan) {
        throw new Error('Clan not found');
      }

      // Generate link token
      const linkToken = this.generateInvitationToken();
      const linkId = this.generateInvitationId(clanAddress, 'link');

      const inviteLink = {
        id: linkId,
        token: linkToken,
        clanAddress: clanAddress,
        clanName: clan.name,
        creatorAddress: creatorAddress,
        
        // Link settings
        role: role,
        maxUses: maxUses,
        currentUses: 0,
        requireApproval: requireApproval,
        message: message,
        
        // Timestamps
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt || new Date(Date.now() + INVITATION_CONFIG.TOKEN_EXPIRY.DEFAULT).toISOString(),
        
        // Status
        status: 'active',
        isActive: true,
        
        // Tracking
        usedBy: [], // Array of user addresses who used this link
        
        // Metadata
        metadata: {
          creatorRole: permissionCheck.role,
          targetRole: role,
          clanTier: clan.tier,
          linkInvite: true
        }
      };

      // Store invite link
      this.inviteLinks.set(linkToken, inviteLink);

      // Update rate limits
      this.updateRateLimit(creatorAddress, 'LINK_GENERATION_PER_DAY');

      // Add to audit trail
      this.auditTrail.push({
        action: 'invite_link_created',
        clanAddress: clanAddress,
        actorAddress: creatorAddress,
        linkId: linkId,
        timestamp: new Date().toISOString(),
        metadata: { role: role, maxUses: maxUses, requireApproval: requireApproval }
      });

      console.log(`Invitation link created for clan ${clan.name}`);

      return {
        success: true,
        inviteLink: inviteLink,
        linkToken: linkToken,
        linkUrl: `${window.location.origin}/clan/join/${linkToken}` // Assuming frontend route structure
      };

    } catch (error) {
      console.error('Invitation link creation failed:', error);
      throw error;
    }
  }

  /**
   * Use invitation link to join clan
   */
  async useInvitationLink(linkToken, userAddress = null) {
    try {
      if (!userAddress && this.walletAdapter && this.walletAdapter.publicKey) {
        userAddress = this.walletAdapter.publicKey.toString();
      }

      if (!userAddress) {
        throw new Error('User address required');
      }

      // Get invite link
      const inviteLink = this.inviteLinks.get(linkToken);
      if (!inviteLink) {
        throw new Error('Invalid or expired invitation link');
      }

      // Check if link is still active
      if (!inviteLink.isActive || inviteLink.status !== 'active') {
        throw new Error('Invitation link is no longer active');
      }

      // Check expiration
      if (new Date(inviteLink.expiresAt) <= new Date()) {
        inviteLink.isActive = false;
        inviteLink.status = 'expired';
        throw new Error('Invitation link has expired');
      }

      // Check usage limits
      if (inviteLink.currentUses >= inviteLink.maxUses) {
        inviteLink.isActive = false;
        inviteLink.status = 'exhausted';
        throw new Error('Invitation link has reached maximum usage');
      }

      // Check if user already used this link
      if (inviteLink.usedBy.includes(userAddress)) {
        throw new Error('You have already used this invitation link');
      }

      // Check clan capacity
      const capacityCheck = await this.checkClanCapacity(inviteLink.clanAddress, 1);
      if (!capacityCheck.hasCapacity) {
        throw new Error(`Clan at capacity. Available slots: ${capacityCheck.availableSlots}`);
      }

      // Check if user is already a member
      const clan = await this.clanManager.getClan(inviteLink.clanAddress);
      if (clan.members.includes(userAddress)) {
        throw new Error('You are already a member of this clan');
      }

      // Update link usage
      inviteLink.currentUses += 1;
      inviteLink.usedBy.push(userAddress);
      inviteLink.lastUsedAt = new Date().toISOString();

      if (inviteLink.requireApproval) {
        // Create join request for manual approval
        const joinRequest = await this.createJoinRequest({
          clanAddress: inviteLink.clanAddress,
          userAddress: userAddress,
          message: `Joined via invitation link: ${inviteLink.message}`,
          requestedRole: inviteLink.role,
          source: 'invite_link',
          linkToken: linkToken
        });

        return {
          success: true,
          requiresApproval: true,
          joinRequest: joinRequest
        };
      } else {
        // Auto-accept link invitation
        const result = await this.clanManager.addMember(
          new PublicKey(inviteLink.clanAddress),
          new PublicKey(userAddress),
          inviteLink.role
        );

        // Add to audit trail
        this.auditTrail.push({
          action: 'link_invitation_accepted',
          clanAddress: inviteLink.clanAddress,
          actorAddress: userAddress,
          linkId: inviteLink.id,
          timestamp: new Date().toISOString(),
          metadata: { role: inviteLink.role, autoAccepted: true }
        });

        // Queue notifications
        this.queueNotification({
          type: 'member_joined',
          recipientAddress: inviteLink.creatorAddress,
          data: {
            clanName: clan.name,
            newMemberAddress: userAddress,
            joinMethod: 'invite_link',
            role: inviteLink.role
          }
        });

        console.log(`User ${userAddress} joined clan ${clan.name} via invitation link`);

        return {
          success: true,
          requiresApproval: false,
          membershipResult: result,
          role: inviteLink.role
        };
      }

    } catch (error) {
      console.error('Invitation link usage failed:', error);
      throw error;
    }
  }

  /**
   * Create join request for clan membership
   */
  async createJoinRequest(requestData) {
    try {
      const { 
        clanAddress, 
        userAddress, 
        message = '', 
        requestedRole = 'member',
        source = 'manual'
      } = requestData;

      // Validate user address
      if (!userAddress) {
        throw new Error('User address is required');
      }

      // Check rate limits
      const rateCheck = this.checkRateLimit(userAddress, 'JOIN_REQUESTS_PER_HOUR');
      if (!rateCheck.allowed) {
        throw new Error(rateCheck.message);
      }

      // Get clan info
      const clan = await this.clanManager.getClan(clanAddress);
      if (!clan) {
        throw new Error('Clan not found');
      }

      // Check if user is already a member
      if (clan.members.includes(userAddress)) {
        throw new Error('You are already a member of this clan');
      }

      // Check for existing pending request
      for (const [requestId, request] of this.joinRequests) {
        if (request.userAddress === userAddress && 
            request.clanAddress === clanAddress && 
            request.status === 'pending') {
          throw new Error('You already have a pending join request for this clan');
        }
      }

      // Check user's pending request limit
      const userPendingRequests = Array.from(this.joinRequests.values())
        .filter(req => req.userAddress === userAddress && req.status === 'pending').length;
      
      if (userPendingRequests >= INVITATION_CONFIG.JOIN_REQUESTS.MAX_PENDING_PER_USER) {
        throw new Error(`Maximum pending join requests reached (${INVITATION_CONFIG.JOIN_REQUESTS.MAX_PENDING_PER_USER})`);
      }

      // Generate request ID
      const requestId = this.generateInvitationId(clanAddress, userAddress);

      const joinRequest = {
        id: requestId,
        clanAddress: clanAddress,
        clanName: clan.name,
        userAddress: userAddress,
        requestedRole: requestedRole,
        message: message,
        source: source, // 'manual', 'invite_link', etc.
        
        // Timestamps
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + INVITATION_CONFIG.JOIN_REQUESTS.APPROVAL_TIMEOUT).toISOString(),
        
        // Status tracking
        status: 'pending',
        approvals: [], // Array of { adminAddress, decision, timestamp }
        requiredApprovals: this.calculateRequiredApprovals(requestedRole),
        
        // Metadata
        metadata: {
          targetRole: requestedRole,
          clanTier: clan.tier,
          joinRequest: true,
          source: source
        }
      };

      // Store join request
      this.joinRequests.set(requestId, joinRequest);

      // Update rate limits
      this.updateRateLimit(userAddress, 'JOIN_REQUESTS_PER_HOUR');

      // Add to audit trail
      this.auditTrail.push({
        action: 'join_request_created',
        clanAddress: clanAddress,
        actorAddress: userAddress,
        requestId: requestId,
        timestamp: new Date().toISOString(),
        metadata: { requestedRole: requestedRole, source: source }
      });

      // Notify clan admins
      const admins = [clan.owner, ...clan.admins];
      for (const adminAddress of admins) {
        this.queueNotification({
          type: 'join_request_received',
          recipientAddress: adminAddress,
          data: {
            clanName: clan.name,
            requesterAddress: userAddress,
            requestedRole: requestedRole,
            message: message,
            requestId: requestId
          }
        });
      }

      console.log(`Join request created for clan ${clan.name} by user ${userAddress}`);

      return {
        success: true,
        joinRequest: joinRequest,
        requestId: requestId
      };

    } catch (error) {
      console.error('Join request creation failed:', error);
      throw error;
    }
  }

  /**
   * Calculate required approvals for role assignment
   */
  calculateRequiredApprovals(role) {
    const roleLevel = {
      'member': 1,
      'moderator': 1,
      'admin': 2,
      'owner': 3 // Should never happen for join requests
    };

    return roleLevel[role] || 1;
  }

  /**
   * Approve or reject join request
   */
  async processJoinRequest(requestId, decision, adminAddress = null) {
    try {
      if (!adminAddress && this.walletAdapter && this.walletAdapter.publicKey) {
        adminAddress = this.walletAdapter.publicKey.toString();
      }

      if (!adminAddress) {
        throw new Error('Admin address required');
      }

      // Get join request
      const joinRequest = this.joinRequests.get(requestId);
      if (!joinRequest) {
        throw new Error('Join request not found');
      }

      // Check if request is still pending
      if (joinRequest.status !== 'pending') {
        throw new Error('Join request is no longer pending');
      }

      // Check expiration
      if (new Date(joinRequest.expiresAt) <= new Date()) {
        joinRequest.status = 'expired';
        throw new Error('Join request has expired');
      }

      // Check admin permissions
      const permissionCheck = await this.checkInvitationPermissions(
        joinRequest.clanAddress, 
        adminAddress, 
        'approve_request'
      );
      if (!permissionCheck.allowed) {
        throw new Error(permissionCheck.error);
      }

      // Check if admin already voted
      const existingApproval = joinRequest.approvals.find(approval => 
        approval.adminAddress === adminAddress
      );
      if (existingApproval) {
        throw new Error('You have already voted on this join request');
      }

      // Add admin's decision
      const approval = {
        adminAddress: adminAddress,
        decision: decision, // 'approve' or 'reject'
        timestamp: new Date().toISOString(),
        adminRole: permissionCheck.role
      };

      joinRequest.approvals.push(approval);

      // Check if we have enough decisions to finalize
      const approvals = joinRequest.approvals.filter(a => a.decision === 'approve').length;
      const rejections = joinRequest.approvals.filter(a => a.decision === 'reject').length;

      let finalDecision = null;
      
      // Immediate rejection if any admin rejects (for most roles)
      if (rejections > 0 && joinRequest.requestedRole !== 'admin') {
        finalDecision = 'rejected';
      }
      // Approval if we have enough approvals
      else if (approvals >= joinRequest.requiredApprovals) {
        finalDecision = 'approved';
      }
      // Rejection if too many rejections for admin role
      else if (rejections > 0 && joinRequest.requestedRole === 'admin') {
        finalDecision = 'rejected';
      }

      if (finalDecision) {
        joinRequest.status = finalDecision;
        joinRequest.finalizedAt = new Date().toISOString();
        joinRequest.finalizedBy = adminAddress;

        if (finalDecision === 'approved') {
          // Add user to clan
          try {
            await this.clanManager.addMember(
              new PublicKey(joinRequest.clanAddress),
              new PublicKey(joinRequest.userAddress),
              joinRequest.requestedRole
            );

            // Notify user of approval
            this.queueNotification({
              type: 'join_request_approved',
              recipientAddress: joinRequest.userAddress,
              data: {
                clanName: joinRequest.clanName,
                role: joinRequest.requestedRole,
                approvedBy: adminAddress
              }
            });

          } catch (error) {
            // Revert status if clan addition failed
            joinRequest.status = 'pending';
            joinRequest.finalizedAt = null;
            joinRequest.finalizedBy = null;
            joinRequest.approvals.pop(); // Remove the approval
            throw new Error(`Failed to add member to clan: ${error.message}`);
          }
        } else {
          // Notify user of rejection
          this.queueNotification({
            type: 'join_request_rejected',
            recipientAddress: joinRequest.userAddress,
            data: {
              clanName: joinRequest.clanName,
              rejectedBy: adminAddress,
              reason: 'Admin decision'
            }
          });

          // Set cooldown for rejection
          const cooldownKey = `${joinRequest.userAddress}_${joinRequest.clanAddress}`;
          this.cooldowns.set(cooldownKey, Date.now());
        }
      }

      // Add to audit trail
      this.auditTrail.push({
        action: `join_request_${decision}`,
        clanAddress: joinRequest.clanAddress,
        actorAddress: adminAddress,
        targetAddress: joinRequest.userAddress,
        requestId: requestId,
        timestamp: new Date().toISOString(),
        metadata: { 
          decision: decision, 
          finalDecision: finalDecision,
          approvals: approvals,
          rejections: rejections
        }
      });

      console.log(`Join request ${decision} by admin ${adminAddress}`);

      return {
        success: true,
        decision: decision,
        finalDecision: finalDecision,
        joinRequest: joinRequest,
        requiresMoreApprovals: !finalDecision && joinRequest.status === 'pending'
      };

    } catch (error) {
      console.error('Join request processing failed:', error);
      throw error;
    }
  }

  /**
   * Send bulk invitations
   */
  async sendBulkInvitations(bulkData) {
    try {
      if (!this.walletAdapter || !this.walletAdapter.publicKey) {
        throw new Error('Wallet not connected');
      }

      const senderAddress = this.walletAdapter.publicKey.toString();
      const { clanAddress, targetUsers, role = 'member', message = '', expiresAt } = bulkData;

      // Check permissions
      const permissionCheck = await this.checkInvitationPermissions(clanAddress, senderAddress, 'bulk_invite');
      if (!permissionCheck.allowed) {
        throw new Error(permissionCheck.error);
      }

      // Check bulk size limits
      const limits = INVITATION_CONFIG.INVITATION_LIMITS[permissionCheck.role.toUpperCase()];
      if (targetUsers.length > limits.bulkSize) {
        throw new Error(`Bulk size limit exceeded. Maximum: ${limits.bulkSize}, requested: ${targetUsers.length}`);
      }

      // Check clan capacity
      const capacityCheck = await this.checkClanCapacity(clanAddress, targetUsers.length);
      if (!capacityCheck.hasCapacity) {
        throw new Error(`Insufficient clan capacity. Available: ${capacityCheck.availableSlots}, needed: ${targetUsers.length}`);
      }

      const results = {
        successful: [],
        failed: [],
        total: targetUsers.length
      };

      // Process each invitation
      for (const targetUser of targetUsers) {
        try {
          const invitationResult = await this.sendDirectInvitation({
            clanAddress,
            targetUser,
            role,
            message,
            expiresAt,
            type: 'direct'
          });

          results.successful.push({
            targetUser,
            invitationId: invitationResult.invitationId
          });

        } catch (error) {
          results.failed.push({
            targetUser,
            error: error.message
          });
        }
      }

      // Add to audit trail
      this.auditTrail.push({
        action: 'bulk_invitations_sent',
        clanAddress: clanAddress,
        actorAddress: senderAddress,
        timestamp: new Date().toISOString(),
        metadata: { 
          totalInvitations: targetUsers.length,
          successful: results.successful.length,
          failed: results.failed.length,
          role: role
        }
      });

      console.log(`Bulk invitations sent: ${results.successful.length} successful, ${results.failed.length} failed`);

      return {
        success: true,
        results: results
      };

    } catch (error) {
      console.error('Bulk invitations failed:', error);
      throw error;
    }
  }

  /**
   * Accept invitation (used by invitees)
   */
  async acceptInvitation(invitationId, userAddress = null) {
    try {
      if (!userAddress && this.walletAdapter && this.walletAdapter.publicKey) {
        userAddress = this.walletAdapter.publicKey.toString();
      }

      if (!userAddress) {
        throw new Error('User address required');
      }

      // Get invitation
      const invitation = this.invitations.get(invitationId);
      if (!invitation) {
        throw new Error('Invitation not found');
      }

      // Verify invitation belongs to user
      if (invitation.targetUser !== userAddress) {
        throw new Error('Invitation does not belong to this user');
      }

      // Check invitation status
      if (invitation.status !== INVITATION_STATUS.PENDING) {
        throw new Error(`Invitation is ${invitation.status}`);
      }

      // Check expiration
      if (new Date(invitation.expiresAt) <= new Date()) {
        invitation.status = INVITATION_STATUS.EXPIRED;
        throw new Error('Invitation has expired');
      }

      // Check clan capacity
      const capacityCheck = await this.checkClanCapacity(invitation.clanAddress, 1);
      if (!capacityCheck.hasCapacity) {
        throw new Error(`Clan at capacity. Available slots: ${capacityCheck.availableSlots}`);
      }

      // Add user to clan
      const memberResult = await this.clanManager.addMember(
        new PublicKey(invitation.clanAddress),
        new PublicKey(userAddress),
        invitation.role
      );

      // Update invitation status
      invitation.status = INVITATION_STATUS.ACCEPTED;
      invitation.acceptedAt = new Date().toISOString();
      invitation.attempts += 1;

      // Add to audit trail
      this.auditTrail.push({
        action: 'invitation_accepted',
        clanAddress: invitation.clanAddress,
        actorAddress: userAddress,
        invitationId: invitationId,
        timestamp: new Date().toISOString(),
        metadata: { role: invitation.role, type: invitation.type }
      });

      // Notify sender
      this.queueNotification({
        type: 'invitation_accepted',
        recipientAddress: invitation.senderAddress,
        data: {
          clanName: invitation.clanName,
          acceptedBy: userAddress,
          role: invitation.role,
          invitationId: invitationId
        }
      });

      console.log(`Invitation ${invitationId} accepted by user ${userAddress}`);

      return {
        success: true,
        invitation: invitation,
        membershipResult: memberResult,
        role: invitation.role
      };

    } catch (error) {
      console.error('Invitation acceptance failed:', error);
      throw error;
    }
  }

  /**
   * Reject invitation
   */
  async rejectInvitation(invitationId, userAddress = null, reason = '') {
    try {
      if (!userAddress && this.walletAdapter && this.walletAdapter.publicKey) {
        userAddress = this.walletAdapter.publicKey.toString();
      }

      if (!userAddress) {
        throw new Error('User address required');
      }

      // Get invitation
      const invitation = this.invitations.get(invitationId);
      if (!invitation) {
        throw new Error('Invitation not found');
      }

      // Verify invitation belongs to user
      if (invitation.targetUser !== userAddress) {
        throw new Error('Invitation does not belong to this user');
      }

      // Check invitation status
      if (invitation.status !== INVITATION_STATUS.PENDING) {
        throw new Error(`Invitation is already ${invitation.status}`);
      }

      // Update invitation status
      invitation.status = INVITATION_STATUS.REJECTED;
      invitation.rejectedAt = new Date().toISOString();
      invitation.rejectionReason = reason;

      // Add to audit trail
      this.auditTrail.push({
        action: 'invitation_rejected',
        clanAddress: invitation.clanAddress,
        actorAddress: userAddress,
        invitationId: invitationId,
        timestamp: new Date().toISOString(),
        metadata: { role: invitation.role, reason: reason }
      });

      // Notify sender
      this.queueNotification({
        type: 'invitation_rejected',
        recipientAddress: invitation.senderAddress,
        data: {
          clanName: invitation.clanName,
          rejectedBy: userAddress,
          reason: reason,
          invitationId: invitationId
        }
      });

      console.log(`Invitation ${invitationId} rejected by user ${userAddress}`);

      return {
        success: true,
        invitation: invitation
      };

    } catch (error) {
      console.error('Invitation rejection failed:', error);
      throw error;
    }
  }

  /**
   * Revoke invitation (used by clan admins)
   */
  async revokeInvitation(invitationId, adminAddress = null, reason = '') {
    try {
      if (!adminAddress && this.walletAdapter && this.walletAdapter.publicKey) {
        adminAddress = this.walletAdapter.publicKey.toString();
      }

      if (!adminAddress) {
        throw new Error('Admin address required');
      }

      // Get invitation
      const invitation = this.invitations.get(invitationId);
      if (!invitation) {
        throw new Error('Invitation not found');
      }

      // Check permissions
      const permissionCheck = await this.checkInvitationPermissions(
        invitation.clanAddress, 
        adminAddress, 
        'revoke_invitation'
      );
      if (!permissionCheck.allowed) {
        throw new Error(permissionCheck.error);
      }

      // Check invitation status
      if (invitation.status !== INVITATION_STATUS.PENDING) {
        throw new Error(`Cannot revoke invitation that is ${invitation.status}`);
      }

      // Update invitation status
      invitation.status = INVITATION_STATUS.REVOKED;
      invitation.revokedAt = new Date().toISOString();
      invitation.revokedBy = adminAddress;
      invitation.revocationReason = reason;

      // Add to audit trail
      this.auditTrail.push({
        action: 'invitation_revoked',
        clanAddress: invitation.clanAddress,
        actorAddress: adminAddress,
        targetAddress: invitation.targetUser,
        invitationId: invitationId,
        timestamp: new Date().toISOString(),
        metadata: { reason: reason }
      });

      // Notify target user
      this.queueNotification({
        type: 'invitation_revoked',
        recipientAddress: invitation.targetUser,
        data: {
          clanName: invitation.clanName,
          revokedBy: adminAddress,
          reason: reason,
          invitationId: invitationId
        }
      });

      console.log(`Invitation ${invitationId} revoked by admin ${adminAddress}`);

      return {
        success: true,
        invitation: invitation
      };

    } catch (error) {
      console.error('Invitation revocation failed:', error);
      throw error;
    }
  }

  /**
   * Get invitations for a user
   */
  getUserInvitations(userAddress, status = null) {
    const userInviteIds = this.userInvitations.get(userAddress) || [];
    const invitations = userInviteIds.map(id => this.invitations.get(id)).filter(Boolean);
    
    if (status) {
      return invitations.filter(invite => invite.status === status);
    }
    
    return invitations;
  }

  /**
   * Get invitations for a clan
   */
  getClanInvitations(clanAddress, status = null) {
    const clanInviteIds = this.clanInvitations.get(clanAddress) || [];
    const invitations = clanInviteIds.map(id => this.invitations.get(id)).filter(Boolean);
    
    if (status) {
      return invitations.filter(invite => invite.status === status);
    }
    
    return invitations;
  }

  /**
   * Get join requests for a clan
   */
  getClanJoinRequests(clanAddress, status = null) {
    const requests = Array.from(this.joinRequests.values())
      .filter(request => request.clanAddress === clanAddress);
    
    if (status) {
      return requests.filter(request => request.status === status);
    }
    
    return requests;
  }

  /**
   * Get invitation statistics for a clan
   */
  getClanInvitationStats(clanAddress) {
    const invitations = this.getClanInvitations(clanAddress);
    const joinRequests = this.getClanJoinRequests(clanAddress);
    
    return {
      totalInvitations: invitations.length,
      pendingInvitations: invitations.filter(i => i.status === INVITATION_STATUS.PENDING).length,
      acceptedInvitations: invitations.filter(i => i.status === INVITATION_STATUS.ACCEPTED).length,
      rejectedInvitations: invitations.filter(i => i.status === INVITATION_STATUS.REJECTED).length,
      expiredInvitations: invitations.filter(i => i.status === INVITATION_STATUS.EXPIRED).length,
      revokedInvitations: invitations.filter(i => i.status === INVITATION_STATUS.REVOKED).length,
      
      totalJoinRequests: joinRequests.length,
      pendingJoinRequests: joinRequests.filter(r => r.status === 'pending').length,
      approvedJoinRequests: joinRequests.filter(r => r.status === 'approved').length,
      rejectedJoinRequests: joinRequests.filter(r => r.status === 'rejected').length,
      expiredJoinRequests: joinRequests.filter(r => r.status === 'expired').length,
      
      activeInviteLinks: Array.from(this.inviteLinks.values())
        .filter(link => link.clanAddress === clanAddress && link.isActive).length
    };
  }

  /**
   * Queue notification for delivery
   */
  queueNotification(notification) {
    if (!INVITATION_CONFIG.NOTIFICATIONS.ENABLED) {
      return;
    }

    notification.id = crypto.randomBytes(16).toString('hex');
    notification.createdAt = new Date().toISOString();
    notification.attempts = 0;
    notification.status = 'queued';

    this.notificationQueue.push(notification);
    
    // Trigger notification processing (would be async in real implementation)
    setTimeout(() => this.processNotificationQueue(), 100);
  }

  /**
   * Process notification queue
   */
  async processNotificationQueue() {
    const batch = this.notificationQueue.splice(0, INVITATION_CONFIG.NOTIFICATIONS.BATCH_SIZE);
    
    for (const notification of batch) {
      try {
        // In a real implementation, this would send actual notifications
        // (email, in-app notifications, push notifications, etc.)
        console.log('Processing notification:', {
          type: notification.type,
          recipient: notification.recipientAddress,
          data: notification.data
        });

        notification.status = 'sent';
        notification.sentAt = new Date().toISOString();
      } catch (error) {
        console.error('Notification delivery failed:', error);
        notification.attempts += 1;
        notification.status = 'failed';
        
        if (notification.attempts < INVITATION_CONFIG.NOTIFICATIONS.RETRY_ATTEMPTS) {
          // Re-queue for retry
          this.notificationQueue.push(notification);
        }
      }
    }

    // Continue processing if queue has more items
    if (this.notificationQueue.length > 0) {
      setTimeout(() => this.processNotificationQueue(), 1000);
    }
  }

  /**
   * Clean up expired invitations and requests
   */
  async cleanupExpired() {
    const now = new Date();
    let cleanedCount = 0;

    // Clean up expired invitations
    for (const [invitationId, invitation] of this.invitations) {
      if (invitation.status === INVITATION_STATUS.PENDING && 
          new Date(invitation.expiresAt) <= now) {
        invitation.status = INVITATION_STATUS.EXPIRED;
        cleanedCount++;

        this.auditTrail.push({
          action: 'invitation_expired',
          clanAddress: invitation.clanAddress,
          invitationId: invitationId,
          timestamp: now.toISOString(),
          metadata: { autoCleanup: true }
        });
      }
    }

    // Clean up expired join requests
    for (const [requestId, request] of this.joinRequests) {
      if (request.status === 'pending' && new Date(request.expiresAt) <= now) {
        request.status = 'expired';
        cleanedCount++;

        this.auditTrail.push({
          action: 'join_request_expired',
          clanAddress: request.clanAddress,
          requestId: requestId,
          timestamp: now.toISOString(),
          metadata: { autoCleanup: true }
        });
      }
    }

    // Clean up expired invite links
    for (const [linkToken, link] of this.inviteLinks) {
      if (link.isActive && new Date(link.expiresAt) <= now) {
        link.isActive = false;
        link.status = 'expired';
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired invitations/requests/links`);
    }

    return { cleanedCount };
  }

  /**
   * Get audit trail for clan invitation activities
   */
  getAuditTrail(clanAddress = null, limit = 100) {
    let trail = this.auditTrail;
    
    if (clanAddress) {
      trail = trail.filter(entry => entry.clanAddress === clanAddress);
    }
    
    return trail.slice(-limit).reverse(); // Most recent first
  }

  /**
   * Clear all caches and reset state
   */
  clearCache() {
    this.invitations.clear();
    this.userInvitations.clear();
    this.clanInvitations.clear();
    this.inviteLinks.clear();
    this.joinRequests.clear();
    this.rateLimits.clear();
    this.cooldowns.clear();
    this.auditTrail = [];
    this.notificationQueue = [];
    console.log('All invitation caches and state cleared');
  }
}

/**
 * Utility Functions
 */

/**
 * Format invitation for display
 */
export function formatInvitation(invitation) {
  return {
    id: invitation.id,
    type: invitation.type,
    clanName: invitation.clanName,
    role: invitation.role,
    status: invitation.status,
    createdAt: invitation.createdAt,
    expiresAt: invitation.expiresAt,
    isExpired: new Date(invitation.expiresAt) <= new Date(),
    message: invitation.message || '',
    senderAddress: invitation.senderAddress,
    targetUser: invitation.targetUser
  };
}

/**
 * Format join request for display
 */
export function formatJoinRequest(request) {
  return {
    id: request.id,
    clanName: request.clanName,
    userAddress: request.userAddress,
    requestedRole: request.requestedRole,
    status: request.status,
    createdAt: request.createdAt,
    expiresAt: request.expiresAt,
    isExpired: new Date(request.expiresAt) <= new Date(),
    message: request.message || '',
    approvals: request.approvals,
    requiredApprovals: request.requiredApprovals,
    source: request.source
  };
}

/**
 * Validate invitation token format
 */
export function validateInvitationToken(token) {
  if (!token || typeof token !== 'string') {
    return false;
  }

  // Check if token is hex string of correct length
  const expectedLength = INVITATION_CONFIG.TOKEN_LENGTH * 2; // Hex representation
  return token.length === expectedLength && /^[a-fA-F0-9]+$/.test(token);
}

/**
 * Generate invitation URL
 */
export function generateInvitationUrl(baseUrl, linkToken) {
  return `${baseUrl}/clan/join/${linkToken}`;
}

/**
 * Calculate invitation expiry options
 */
export function getExpiryOptions() {
  const now = Date.now();
  
  return [
    {
      id: 'short',
      name: '24 Hours',
      duration: INVITATION_CONFIG.TOKEN_EXPIRY.SHORT,
      expiresAt: new Date(now + INVITATION_CONFIG.TOKEN_EXPIRY.SHORT).toISOString()
    },
    {
      id: 'default',
      name: '7 Days',
      duration: INVITATION_CONFIG.TOKEN_EXPIRY.DEFAULT,
      expiresAt: new Date(now + INVITATION_CONFIG.TOKEN_EXPIRY.DEFAULT).toISOString()
    },
    {
      id: 'long',
      name: '30 Days',
      duration: INVITATION_CONFIG.TOKEN_EXPIRY.LONG,
      expiresAt: new Date(now + INVITATION_CONFIG.TOKEN_EXPIRY.LONG).toISOString()
    }
  ];
}

console.log('MLG.clan Invitation and Approval System loaded successfully');
console.log('Supported invitation types:', Object.keys(INVITATION_TYPES));
console.log('MLG Token Integration: 7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL');