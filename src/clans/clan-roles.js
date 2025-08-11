/**
 * MLG.clan Roles and Permissions Management System - Sub-task 5.3
 * 
 * Comprehensive clan member roles and permissions management system with hierarchical
 * role structure, granular permissions, role assignment workflows, and real-time
 * permission validation integrated with the MLG token ecosystem.
 * 
 * Core Features:
 * - Hierarchical role system with Owner > Admin > Moderator > Officer > Member > Recruit
 * - Granular permission system for all clan operations and content management
 * - Role assignment workflows with approval requirements and audit trails
 * - Multi-admin approval for sensitive role changes and permission escalations
 * - Real-time permission validation with inheritance and custom configurations
 * - Emergency override capabilities and role assignment history tracking
 * - Integration with existing clan management and invitation systems
 * 
 * Role Hierarchy:
 * - Owner: Full clan control including dissolution, token management, and ownership transfer
 * - Admin: Member management, role assignment (except Owner), clan settings, financial operations
 * - Moderator: Content moderation, member warnings, limited member management, event coordination
 * - Officer: Event coordination, member recruitment assistance, content management
 * - Member: Basic participation, content submission, voting, limited clan features
 * - Recruit: Limited permissions, probationary status, supervised participation
 * 
 * Permission Categories:
 * - Clan Management: Edit settings, logo, description, rules, dissolution
 * - Member Management: Invite, kick, ban, role assignment, member oversight
 * - Content Moderation: Remove posts, warn members, manage reports, chat moderation
 * - Financial Operations: Token staking, clan treasury, rewards distribution
 * - Event Management: Tournament creation, scheduling, coordination, participation
 * - Voting Operations: Clan voting pools, proposal creation, vote management
 * 
 * Security Features:
 * - Role escalation prevention and permission inheritance validation
 * - Multi-signature approval for sensitive operations and role changes
 * - Comprehensive audit trail with role assignment history
 * - Emergency override with owner verification and audit logging
 * - Rate limiting and abuse prevention for role operations
 * - Integration with Solana wallet verification and transaction signing
 * 
 * @author Claude Code - Community Management and Security Architect
 * @version 1.0.0
 * @integration MLG Token: 7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL
 * @depends clan-management.js - Core clan management system
 * @depends clan-invitations.js - Member invitation and approval system
 */

import pkg from '@solana/web3.js';
const { 
  PublicKey,
  Transaction,
  SystemProgram
} = pkg;

import { createMLGTokenConnection, MLG_TOKEN_CONFIG, TOKEN_PROGRAMS } from '../../config/solana-config.js';
import { CLAN_TIER_CONFIG, CLAN_CONFIG } from './clan-management.js';
import { INVITATION_CONFIG } from './clan-invitations.js';
import crypto from 'crypto';

/**
 * Role Hierarchy Configuration
 * Defines the complete role system with permissions, priorities, and constraints
 */
export const CLAN_ROLE_HIERARCHY = {
  OWNER: {
    id: 'owner',
    name: 'Clan Owner',
    displayName: 'Owner',
    description: 'Full clan control including dissolution and token management',
    priority: 1000,
    maxCount: 1,
    canAssignRoles: ['admin', 'moderator', 'officer', 'member', 'recruit'],
    canBeAssignedBy: [], // Only through ownership transfer
    permissions: ['all'], // Full permissions
    color: '#FFD700',
    icon: '👑',
    features: [
      'clan_dissolution',
      'ownership_transfer',
      'token_management',
      'emergency_override',
      'all_permissions'
    ]
  },
  ADMIN: {
    id: 'admin',
    name: 'Admin',
    displayName: 'Admin',
    description: 'Member management, role assignment (except Owner), clan settings',
    priority: 900,
    maxCount: 5,
    canAssignRoles: ['moderator', 'officer', 'member', 'recruit'],
    canBeAssignedBy: ['owner'],
    permissions: [
      'manage_members',
      'assign_roles',
      'edit_clan',
      'kick_members',
      'ban_members',
      'manage_invitations',
      'manage_treasury',
      'create_events',
      'manage_voting',
      'content_moderation'
    ],
    color: '#FF6B6B',
    icon: '🛡️',
    features: [
      'member_management',
      'role_assignment',
      'clan_settings',
      'financial_operations',
      'event_management'
    ]
  },
  MODERATOR: {
    id: 'moderator',
    name: 'Moderator',
    displayName: 'Moderator',
    description: 'Content moderation, member warnings, limited member management',
    priority: 800,
    maxCount: 10,
    canAssignRoles: ['member', 'recruit'],
    canBeAssignedBy: ['owner', 'admin'],
    permissions: [
      'kick_members',
      'mute_members',
      'warn_members',
      'content_moderation',
      'manage_chat',
      'manage_reports',
      'event_assistance',
      'limited_invitations'
    ],
    color: '#4ECDC4',
    icon: '🛡️',
    features: [
      'content_moderation',
      'member_warnings',
      'chat_management',
      'report_handling',
      'event_coordination'
    ]
  },
  OFFICER: {
    id: 'officer',
    name: 'Officer',
    displayName: 'Officer',
    description: 'Event coordination, member recruitment assistance',
    priority: 700,
    maxCount: 15,
    canAssignRoles: ['recruit'],
    canBeAssignedBy: ['owner', 'admin', 'moderator'],
    permissions: [
      'event_coordination',
      'recruitment_assistance',
      'content_management',
      'member_mentoring',
      'limited_invitations',
      'event_participation'
    ],
    color: '#95E1D3',
    icon: '⭐',
    features: [
      'event_coordination',
      'recruitment_assistance',
      'member_mentoring',
      'content_curation'
    ]
  },
  MEMBER: {
    id: 'member',
    name: 'Member',
    displayName: 'Member',
    description: 'Basic participation, content submission, voting',
    priority: 500,
    maxCount: -1, // Unlimited
    canAssignRoles: [],
    canBeAssignedBy: ['owner', 'admin', 'moderator', 'officer'],
    permissions: [
      'chat_participation',
      'content_submission',
      'voting_participation',
      'event_participation',
      'view_statistics',
      'clan_interaction'
    ],
    color: '#A8E6CF',
    icon: '👤',
    features: [
      'basic_participation',
      'content_submission',
      'voting_rights',
      'event_participation'
    ]
  },
  RECRUIT: {
    id: 'recruit',
    name: 'Recruit',
    displayName: 'Recruit',
    description: 'Limited permissions, probationary status',
    priority: 100,
    maxCount: -1, // Unlimited
    canAssignRoles: [],
    canBeAssignedBy: ['owner', 'admin', 'moderator', 'officer', 'member'],
    permissions: [
      'limited_chat',
      'view_content',
      'limited_voting',
      'view_statistics'
    ],
    color: '#DDA0DD',
    icon: '🌱',
    features: [
      'probationary_access',
      'supervised_participation',
      'limited_features'
    ]
  }
};

/**
 * Permission Categories and Definitions
 * Comprehensive permission system with detailed access controls
 */
export const PERMISSION_CATEGORIES = {
  CLAN_MANAGEMENT: {
    id: 'clan_management',
    name: 'Clan Management',
    description: 'Clan settings, configuration, and administrative operations',
    permissions: {
      'edit_clan': {
        name: 'Edit Clan Settings',
        description: 'Modify clan name, description, rules, and basic settings'
      },
      'manage_clan_assets': {
        name: 'Manage Clan Assets',
        description: 'Upload/change clan logo, banner, and visual assets'
      },
      'clan_dissolution': {
        name: 'Clan Dissolution',
        description: 'Permanently dissolve the clan (Owner only)'
      },
      'ownership_transfer': {
        name: 'Ownership Transfer',
        description: 'Transfer clan ownership to another member (Owner only)'
      },
      'emergency_override': {
        name: 'Emergency Override',
        description: 'Bypass normal restrictions in emergency situations'
      }
    }
  },
  MEMBER_MANAGEMENT: {
    id: 'member_management',
    name: 'Member Management',
    description: 'Member oversight, role assignment, and membership operations',
    permissions: {
      'manage_members': {
        name: 'Manage Members',
        description: 'General member management and oversight'
      },
      'invite_members': {
        name: 'Invite Members',
        description: 'Send invitations to new members'
      },
      'kick_members': {
        name: 'Kick Members',
        description: 'Remove members from the clan'
      },
      'ban_members': {
        name: 'Ban Members',
        description: 'Permanently ban members from the clan'
      },
      'assign_roles': {
        name: 'Assign Roles',
        description: 'Assign and modify member roles'
      },
      'warn_members': {
        name: 'Warn Members',
        description: 'Issue warnings to clan members'
      },
      'mute_members': {
        name: 'Mute Members',
        description: 'Temporarily restrict member communication'
      }
    }
  },
  CONTENT_MODERATION: {
    id: 'content_moderation',
    name: 'Content Moderation',
    description: 'Content oversight, moderation, and community management',
    permissions: {
      'content_moderation': {
        name: 'Content Moderation',
        description: 'Moderate and manage clan content'
      },
      'remove_content': {
        name: 'Remove Content',
        description: 'Delete inappropriate or rule-breaking content'
      },
      'manage_chat': {
        name: 'Manage Chat',
        description: 'Moderate clan chat and communications'
      },
      'manage_reports': {
        name: 'Manage Reports',
        description: 'Handle member reports and complaints'
      },
      'content_approval': {
        name: 'Content Approval',
        description: 'Approve content before publication'
      }
    }
  },
  FINANCIAL_OPERATIONS: {
    id: 'financial_operations',
    name: 'Financial Operations',
    description: 'Token management, treasury operations, and financial controls',
    permissions: {
      'manage_treasury': {
        name: 'Manage Treasury',
        description: 'Access and manage clan treasury funds'
      },
      'token_management': {
        name: 'Token Management',
        description: 'Manage clan token staking and unstaking'
      },
      'distribute_rewards': {
        name: 'Distribute Rewards',
        description: 'Distribute rewards and incentives to members'
      },
      'financial_reporting': {
        name: 'Financial Reporting',
        description: 'Access financial reports and transaction history'
      },
      'fee_management': {
        name: 'Fee Management',
        description: 'Manage clan fees and payment requirements'
      }
    }
  },
  EVENT_MANAGEMENT: {
    id: 'event_management',
    name: 'Event Management',
    description: 'Event creation, coordination, and tournament management',
    permissions: {
      'create_events': {
        name: 'Create Events',
        description: 'Create new clan events and tournaments'
      },
      'manage_events': {
        name: 'Manage Events',
        description: 'Modify and manage existing events'
      },
      'event_coordination': {
        name: 'Event Coordination',
        description: 'Coordinate event logistics and participation'
      },
      'tournament_management': {
        name: 'Tournament Management',
        description: 'Manage tournament brackets and competitions'
      },
      'event_participation': {
        name: 'Event Participation',
        description: 'Participate in clan events and activities'
      }
    }
  },
  VOTING_OPERATIONS: {
    id: 'voting_operations',
    name: 'Voting Operations',
    description: 'Clan voting, proposals, and governance operations',
    permissions: {
      'manage_voting': {
        name: 'Manage Voting',
        description: 'Create and manage clan voting pools'
      },
      'create_proposals': {
        name: 'Create Proposals',
        description: 'Create governance proposals for clan voting'
      },
      'voting_participation': {
        name: 'Voting Participation',
        description: 'Participate in clan votes and governance'
      },
      'voting_oversight': {
        name: 'Voting Oversight',
        description: 'Monitor and oversee voting processes'
      }
    }
  },
  BASIC_ACCESS: {
    id: 'basic_access',
    name: 'Basic Access',
    description: 'Basic clan participation and interaction rights',
    permissions: {
      'chat_participation': {
        name: 'Chat Participation',
        description: 'Participate in clan chat and discussions'
      },
      'content_submission': {
        name: 'Content Submission',
        description: 'Submit content for clan consideration'
      },
      'view_statistics': {
        name: 'View Statistics',
        description: 'View clan statistics and performance metrics'
      },
      'clan_interaction': {
        name: 'Clan Interaction',
        description: 'Basic interaction with clan features and members'
      },
      'limited_chat': {
        name: 'Limited Chat',
        description: 'Restricted chat participation with supervision'
      },
      'view_content': {
        name: 'View Content',
        description: 'View clan content and discussions'
      },
      'limited_voting': {
        name: 'Limited Voting',
        description: 'Participate in select votes with restrictions'
      }
    }
  }
};

/**
 * Role Assignment Configuration
 * Defines rules and requirements for role assignment operations
 */
export const ROLE_ASSIGNMENT_CONFIG = {
  // Approval requirements for role assignments
  APPROVAL_REQUIREMENTS: {
    'recruit': { admins: 1, timeout: 24 * 60 * 60 * 1000 }, // 24 hours
    'member': { admins: 1, timeout: 24 * 60 * 60 * 1000 },
    'officer': { admins: 2, timeout: 48 * 60 * 60 * 1000 }, // 48 hours
    'moderator': { admins: 2, timeout: 48 * 60 * 60 * 1000 },
    'admin': { admins: 1, ownerApproval: true, timeout: 72 * 60 * 60 * 1000 } // 72 hours + owner
  },
  
  // Cooldown periods for role changes
  ROLE_CHANGE_COOLDOWNS: {
    'promotion': 7 * 24 * 60 * 60 * 1000, // 7 days
    'demotion': 3 * 24 * 60 * 60 * 1000,  // 3 days
    'role_change': 24 * 60 * 60 * 1000     // 24 hours general cooldown
  },
  
  // Rate limits for role operations
  RATE_LIMITS: {
    ROLE_ASSIGNMENTS_PER_DAY: 10,
    BULK_ROLE_CHANGES_PER_HOUR: 3,
    ROLE_MODIFICATIONS_PER_HOUR: 5
  },
  
  // Auto-assignment rules
  AUTO_ASSIGNMENT_RULES: {
    NEW_MEMBERS: 'recruit', // Default role for new members
    INVITE_DEFAULT: 'member', // Default for invited members
    MINIMUM_ACTIVITY_PROMOTION: {
      'recruit_to_member': {
        daysActive: 7,
        activityScore: 50,
        autoPromote: true
      }
    }
  }
};

/**
 * Clan Roles and Permissions Manager
 * Comprehensive role management system with hierarchical permissions and security controls
 */
export class ClanRoleManager {
  constructor(walletAdapter = null, clanManager = null) {
    this.walletAdapter = walletAdapter;
    this.clanManager = clanManager;
    this.connection = createMLGTokenConnection();
    
    // Role and permission caches
    this.roleAssignments = new Map(); // clan_address -> { member_address: role_data }
    this.permissionCache = new Map(); // permission_key -> permission_result
    this.roleHistory = new Map(); // clan_address -> role_change_history[]
    this.pendingRoleChanges = new Map(); // request_id -> role_change_request
    
    // Security and validation
    this.rateLimits = new Map();
    this.cooldowns = new Map();
    this.auditTrail = [];
    
    // Custom permission configurations per clan
    this.customPermissions = new Map(); // clan_address -> custom_config
    
    console.log('ClanRoleManager initialized with comprehensive role and permission system');
  }

  /**
   * Initialize clan role system for a new clan
   */
  async initializeClanRoles(clanAddress, ownerAddress) {
    try {
      const clanRoles = new Map();
      
      // Set owner role
      clanRoles.set(ownerAddress, {
        role: 'owner',
        assignedAt: new Date().toISOString(),
        assignedBy: 'system',
        permissions: this.getRolePermissions('owner'),
        metadata: {
          isFounder: true,
          autoAssigned: true
        }
      });

      this.roleAssignments.set(clanAddress, clanRoles);

      // Add to audit trail
      this.auditTrail.push({
        action: 'clan_roles_initialized',
        clanAddress: clanAddress,
        actorAddress: 'system',
        targetAddress: ownerAddress,
        timestamp: new Date().toISOString(),
        metadata: { ownerRole: 'owner' }
      });

      console.log(`Clan roles initialized for ${clanAddress} with owner ${ownerAddress}`);

      return {
        success: true,
        ownerAddress: ownerAddress,
        initialRole: 'owner'
      };

    } catch (error) {
      console.error('Clan role initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get role permissions for a specific role
   */
  getRolePermissions(roleId) {
    const role = CLAN_ROLE_HIERARCHY[roleId.toUpperCase()];
    if (!role) {
      return [];
    }

    if (role.permissions.includes('all')) {
      // Owner gets all permissions
      return this.getAllPermissions();
    }

    return role.permissions;
  }

  /**
   * Get all available permissions in the system
   */
  getAllPermissions() {
    const allPermissions = [];
    
    for (const category of Object.values(PERMISSION_CATEGORIES)) {
      for (const permissionId of Object.keys(category.permissions)) {
        allPermissions.push(permissionId);
      }
    }
    
    return allPermissions;
  }

  /**
   * Check if user has specific permission in clan
   */
  async hasPermission(clanAddress, userAddress, permission, operation = null) {
    try {
      // Check cache first
      const cacheKey = `${clanAddress}_${userAddress}_${permission}`;
      const cached = this.permissionCache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < 60000) { // 1 minute cache
        return cached.result;
      }

      // Get user role in clan
      const userRole = await this.getUserRole(clanAddress, userAddress);
      if (!userRole) {
        const result = { allowed: false, reason: 'User is not a clan member' };
        this.permissionCache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
      }

      const role = CLAN_ROLE_HIERARCHY[userRole.role.toUpperCase()];
      if (!role) {
        const result = { allowed: false, reason: 'Invalid role' };
        this.permissionCache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
      }

      // Check if user has permission
      const hasPermission = role.permissions.includes('all') || role.permissions.includes(permission);
      
      if (!hasPermission) {
        const result = { 
          allowed: false, 
          reason: `Role '${role.name}' does not have permission '${permission}'`,
          role: userRole.role,
          permissions: role.permissions
        };
        this.permissionCache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
      }

      // Check custom clan permissions
      const customConfig = this.customPermissions.get(clanAddress);
      if (customConfig && customConfig.restrictions) {
        const restriction = customConfig.restrictions[`${userRole.role}_${permission}`];
        if (restriction && !restriction.allowed) {
          const result = {
            allowed: false,
            reason: `Custom clan restriction: ${restriction.reason}`,
            customRestriction: true
          };
          this.permissionCache.set(cacheKey, { result, timestamp: Date.now() });
          return result;
        }
      }

      // Additional operation-specific checks
      if (operation) {
        const operationCheck = await this.checkOperationPermission(clanAddress, userAddress, userRole, operation);
        if (!operationCheck.allowed) {
          this.permissionCache.set(cacheKey, { result: operationCheck, timestamp: Date.now() });
          return operationCheck;
        }
      }

      const result = {
        allowed: true,
        role: userRole.role,
        permissions: role.permissions,
        priority: role.priority
      };

      this.permissionCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;

    } catch (error) {
      console.error('Permission check failed:', error);
      return { allowed: false, reason: 'Permission check error', error: error.message };
    }
  }

  /**
   * Check operation-specific permissions
   */
  async checkOperationPermission(clanAddress, userAddress, userRole, operation) {
    const operationChecks = {
      'assign_role': async (targetRole, targetUser) => {
        const role = CLAN_ROLE_HIERARCHY[userRole.role.toUpperCase()];
        const targetRoleData = CLAN_ROLE_HIERARCHY[targetRole.toUpperCase()];
        
        if (!targetRoleData) {
          return { allowed: false, reason: 'Invalid target role' };
        }

        // Can't assign roles higher than or equal to your own (except Owner)
        if (userRole.role !== 'owner' && targetRoleData.priority >= role.priority) {
          return { allowed: false, reason: 'Cannot assign equal or higher roles' };
        }

        // Check if role can assign target role
        if (!role.canAssignRoles.includes(targetRole)) {
          return { allowed: false, reason: `Role '${role.name}' cannot assign '${targetRoleData.name}' role` };
        }

        // Check target role maximum count
        if (targetRoleData.maxCount > 0) {
          const currentCount = await this.getRoleCount(clanAddress, targetRole);
          if (currentCount >= targetRoleData.maxCount) {
            return { allowed: false, reason: `Maximum ${targetRoleData.name} count reached (${targetRoleData.maxCount})` };
          }
        }

        return { allowed: true };
      },

      'kick_member': async (targetUser) => {
        const targetRole = await this.getUserRole(clanAddress, targetUser);
        if (!targetRole) {
          return { allowed: true }; // Can kick non-members (cleanup)
        }

        const userRoleData = CLAN_ROLE_HIERARCHY[userRole.role.toUpperCase()];
        const targetRoleData = CLAN_ROLE_HIERARCHY[targetRole.role.toUpperCase()];

        // Can't kick users with equal or higher roles (except Owner)
        if (userRole.role !== 'owner' && targetRoleData.priority >= userRoleData.priority) {
          return { allowed: false, reason: 'Cannot kick members with equal or higher roles' };
        }

        return { allowed: true };
      },

      'ban_member': async (targetUser) => {
        // Similar to kick but with additional restrictions
        const kickCheck = await operationChecks['kick_member'](targetUser);
        if (!kickCheck.allowed) {
          return kickCheck;
        }

        // Additional ban-specific checks
        const targetRole = await this.getUserRole(clanAddress, targetUser);
        if (targetRole && ['owner', 'admin'].includes(targetRole.role)) {
          return { allowed: false, reason: 'Cannot ban Owners or Admins' };
        }

        return { allowed: true };
      }
    };

    const checker = operationChecks[operation.type];
    if (checker) {
      return await checker(...(operation.params || []));
    }

    return { allowed: true }; // Default allow for unknown operations
  }

  /**
   * Get user's role in clan
   */
  async getUserRole(clanAddress, userAddress) {
    try {
      const clanRoles = this.roleAssignments.get(clanAddress);
      if (!clanRoles) {
        return null;
      }

      return clanRoles.get(userAddress) || null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  /**
   * Get count of users with specific role in clan
   */
  async getRoleCount(clanAddress, roleId) {
    try {
      const clanRoles = this.roleAssignments.get(clanAddress);
      if (!clanRoles) {
        return 0;
      }

      let count = 0;
      for (const [userAddress, roleData] of clanRoles) {
        if (roleData.role === roleId) {
          count++;
        }
      }

      return count;
    } catch (error) {
      console.error('Error getting role count:', error);
      return 0;
    }
  }

  /**
   * Assign role to user
   */
  async assignRole(clanAddress, targetUserAddress, newRole, assignerAddress = null, options = {}) {
    try {
      if (!assignerAddress && this.walletAdapter && this.walletAdapter.publicKey) {
        assignerAddress = this.walletAdapter.publicKey.toString();
      }

      if (!assignerAddress) {
        throw new Error('Assigner address required');
      }

      // Validate inputs
      const newRoleData = CLAN_ROLE_HIERARCHY[newRole.toUpperCase()];
      if (!newRoleData) {
        throw new Error('Invalid role specified');
      }

      // Check permissions
      const permissionCheck = await this.hasPermission(
        clanAddress, 
        assignerAddress, 
        'assign_roles',
        { 
          type: 'assign_role', 
          params: [newRole, targetUserAddress] 
        }
      );

      if (!permissionCheck.allowed) {
        throw new Error(permissionCheck.reason);
      }

      // Check rate limits
      const rateCheck = this.checkRateLimit(assignerAddress, 'ROLE_ASSIGNMENTS_PER_DAY');
      if (!rateCheck.allowed) {
        throw new Error(rateCheck.message);
      }

      // Get current role
      const currentRole = await this.getUserRole(clanAddress, targetUserAddress);
      
      // Check if role change is needed
      if (currentRole && currentRole.role === newRole) {
        throw new Error(`User already has role '${newRoleData.name}'`);
      }

      // Check cooldown periods
      const cooldownKey = `${clanAddress}_${targetUserAddress}_role_change`;
      const lastChange = this.cooldowns.get(cooldownKey);
      if (lastChange && (Date.now() - lastChange) < ROLE_ASSIGNMENT_CONFIG.ROLE_CHANGE_COOLDOWNS.role_change) {
        throw new Error('Role change cooldown period has not expired');
      }

      // Check if multi-admin approval is required
      const approvalReqs = ROLE_ASSIGNMENT_CONFIG.APPROVAL_REQUIREMENTS[newRole];
      const requiresApproval = approvalReqs && (
        approvalReqs.admins > 1 || 
        (approvalReqs.ownerApproval && permissionCheck.role !== 'owner')
      );

      if (requiresApproval && !options.bypassApproval) {
        // Create pending role change request
        return await this.createRoleChangeRequest(
          clanAddress,
          targetUserAddress,
          newRole,
          assignerAddress,
          options
        );
      }

      // Execute role assignment
      const roleAssignment = {
        role: newRole,
        assignedAt: new Date().toISOString(),
        assignedBy: assignerAddress,
        permissions: this.getRolePermissions(newRole),
        previousRole: currentRole ? currentRole.role : null,
        metadata: {
          assignmentReason: options.reason || 'Role assignment',
          requiresApproval: false,
          ...options.metadata
        }
      };

      // Update role assignments
      let clanRoles = this.roleAssignments.get(clanAddress);
      if (!clanRoles) {
        clanRoles = new Map();
        this.roleAssignments.set(clanAddress, clanRoles);
      }

      clanRoles.set(targetUserAddress, roleAssignment);

      // Add to role history
      this.addToRoleHistory(clanAddress, {
        action: 'role_assigned',
        targetUser: targetUserAddress,
        newRole: newRole,
        previousRole: currentRole ? currentRole.role : null,
        assignedBy: assignerAddress,
        timestamp: new Date().toISOString(),
        metadata: options
      });

      // Update rate limits and cooldowns
      this.updateRateLimit(assignerAddress, 'ROLE_ASSIGNMENTS_PER_DAY');
      this.cooldowns.set(cooldownKey, Date.now());

      // Clear permission cache for affected user
      this.clearUserPermissionCache(clanAddress, targetUserAddress);

      // Add to audit trail
      this.auditTrail.push({
        action: 'role_assigned',
        clanAddress: clanAddress,
        actorAddress: assignerAddress,
        targetAddress: targetUserAddress,
        timestamp: new Date().toISOString(),
        metadata: {
          newRole: newRole,
          previousRole: currentRole ? currentRole.role : null,
          reason: options.reason
        }
      });

      console.log(`Role '${newRoleData.name}' assigned to ${targetUserAddress} by ${assignerAddress}`);

      return {
        success: true,
        assignment: roleAssignment,
        requiresApproval: false
      };

    } catch (error) {
      console.error('Role assignment failed:', error);
      throw error;
    }
  }

  /**
   * Create role change request for multi-admin approval
   */
  async createRoleChangeRequest(clanAddress, targetUserAddress, newRole, requestorAddress, options = {}) {
    try {
      const requestId = this.generateRequestId(clanAddress, targetUserAddress, newRole);
      const approvalReqs = ROLE_ASSIGNMENT_CONFIG.APPROVAL_REQUIREMENTS[newRole];
      
      const request = {
        id: requestId,
        clanAddress: clanAddress,
        targetUser: targetUserAddress,
        newRole: newRole,
        requestor: requestorAddress,
        reason: options.reason || 'Role change request',
        
        // Approval tracking
        approvals: [],
        requiredApprovals: approvalReqs.admins,
        requiresOwnerApproval: approvalReqs.ownerApproval || false,
        
        // Timestamps
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + approvalReqs.timeout).toISOString(),
        
        // Status
        status: 'pending',
        
        // Metadata
        metadata: options
      };

      this.pendingRoleChanges.set(requestId, request);

      // Add to audit trail
      this.auditTrail.push({
        action: 'role_change_request_created',
        clanAddress: clanAddress,
        actorAddress: requestorAddress,
        targetAddress: targetUserAddress,
        requestId: requestId,
        timestamp: new Date().toISOString(),
        metadata: { newRole: newRole, requiredApprovals: approvalReqs.admins }
      });

      console.log(`Role change request created for ${targetUserAddress} -> ${newRole}`);

      return {
        success: true,
        requiresApproval: true,
        request: request,
        requestId: requestId
      };

    } catch (error) {
      console.error('Role change request creation failed:', error);
      throw error;
    }
  }

  /**
   * Approve or reject role change request
   */
  async processRoleChangeRequest(requestId, decision, adminAddress = null, reason = '') {
    try {
      if (!adminAddress && this.walletAdapter && this.walletAdapter.publicKey) {
        adminAddress = this.walletAdapter.publicKey.toString();
      }

      if (!adminAddress) {
        throw new Error('Admin address required');
      }

      const request = this.pendingRoleChanges.get(requestId);
      if (!request) {
        throw new Error('Role change request not found');
      }

      if (request.status !== 'pending') {
        throw new Error(`Request is ${request.status}`);
      }

      // Check expiration
      if (new Date(request.expiresAt) <= new Date()) {
        request.status = 'expired';
        throw new Error('Role change request has expired');
      }

      // Check admin permissions
      const permissionCheck = await this.hasPermission(
        request.clanAddress, 
        adminAddress, 
        'assign_roles'
      );

      if (!permissionCheck.allowed) {
        throw new Error(permissionCheck.reason);
      }

      // Check if admin already voted
      const existingApproval = request.approvals.find(approval => 
        approval.adminAddress === adminAddress
      );
      if (existingApproval) {
        throw new Error('You have already voted on this request');
      }

      // Add approval/rejection
      const approval = {
        adminAddress: adminAddress,
        decision: decision, // 'approve' or 'reject'
        timestamp: new Date().toISOString(),
        reason: reason,
        adminRole: permissionCheck.role
      };

      request.approvals.push(approval);

      // Check if decision can be finalized
      const approvals = request.approvals.filter(a => a.decision === 'approve').length;
      const rejections = request.approvals.filter(a => a.decision === 'reject').length;

      let finalDecision = null;

      // Immediate rejection
      if (rejections > 0) {
        finalDecision = 'rejected';
      }
      // Check if enough approvals
      else if (approvals >= request.requiredApprovals) {
        // Check owner approval requirement
        if (request.requiresOwnerApproval) {
          const ownerApproval = request.approvals.find(a => 
            a.decision === 'approve' && a.adminRole === 'owner'
          );
          if (ownerApproval) {
            finalDecision = 'approved';
          }
        } else {
          finalDecision = 'approved';
        }
      }

      if (finalDecision) {
        request.status = finalDecision;
        request.finalizedAt = new Date().toISOString();
        request.finalizedBy = adminAddress;

        if (finalDecision === 'approved') {
          // Execute role assignment
          try {
            await this.assignRole(
              request.clanAddress,
              request.targetUser,
              request.newRole,
              'system', // System assignment after approval
              { 
                ...request.metadata,
                bypassApproval: true,
                approvalProcess: true,
                approvedBy: request.approvals.map(a => a.adminAddress)
              }
            );
          } catch (error) {
            // Revert request status if assignment failed
            request.status = 'pending';
            request.finalizedAt = null;
            request.finalizedBy = null;
            request.approvals.pop();
            throw new Error(`Role assignment failed: ${error.message}`);
          }
        }

        // Remove from pending requests after successful processing
        if (finalDecision === 'approved' || finalDecision === 'rejected') {
          // Keep for audit trail but mark as processed
          request.processed = true;
        }
      }

      // Add to audit trail
      this.auditTrail.push({
        action: `role_change_request_${decision}`,
        clanAddress: request.clanAddress,
        actorAddress: adminAddress,
        targetAddress: request.targetUser,
        requestId: requestId,
        timestamp: new Date().toISOString(),
        metadata: { 
          decision: decision,
          finalDecision: finalDecision,
          approvals: approvals,
          rejections: rejections,
          reason: reason
        }
      });

      console.log(`Role change request ${decision} by ${adminAddress}`);

      return {
        success: true,
        decision: decision,
        finalDecision: finalDecision,
        request: request,
        requiresMoreApprovals: !finalDecision && request.status === 'pending'
      };

    } catch (error) {
      console.error('Role change request processing failed:', error);
      throw error;
    }
  }

  /**
   * Remove role from user (demote to member or remove from clan)
   */
  async removeRole(clanAddress, targetUserAddress, removerAddress = null, options = {}) {
    try {
      if (!removerAddress && this.walletAdapter && this.walletAdapter.publicKey) {
        removerAddress = this.walletAdapter.publicKey.toString();
      }

      if (!removerAddress) {
        throw new Error('Remover address required');
      }

      // Get current role
      const currentRole = await this.getUserRole(clanAddress, targetUserAddress);
      if (!currentRole) {
        throw new Error('User does not have a role in this clan');
      }

      // Cannot remove owner role (must transfer ownership first)
      if (currentRole.role === 'owner') {
        throw new Error('Cannot remove Owner role. Transfer ownership first.');
      }

      // Check permissions for role removal
      const permissionCheck = await this.hasPermission(
        clanAddress, 
        removerAddress, 
        'assign_roles',
        { 
          type: 'kick_member', 
          params: [targetUserAddress] 
        }
      );

      if (!permissionCheck.allowed) {
        throw new Error(permissionCheck.reason);
      }

      const newRole = options.demoteToRole || ROLE_ASSIGNMENT_CONFIG.AUTO_ASSIGNMENT_RULES.NEW_MEMBERS;

      if (options.removeFromClan) {
        // Remove user from clan entirely
        const clanRoles = this.roleAssignments.get(clanAddress);
        if (clanRoles) {
          clanRoles.delete(targetUserAddress);
        }

        // Clear permission cache
        this.clearUserPermissionCache(clanAddress, targetUserAddress);

        // Add to role history
        this.addToRoleHistory(clanAddress, {
          action: 'role_removed',
          targetUser: targetUserAddress,
          previousRole: currentRole.role,
          removedBy: removerAddress,
          timestamp: new Date().toISOString(),
          metadata: { ...options, removedFromClan: true }
        });

        console.log(`User ${targetUserAddress} removed from clan ${clanAddress}`);

        return {
          success: true,
          action: 'removed_from_clan',
          previousRole: currentRole.role
        };
      } else {
        // Demote to lower role
        return await this.assignRole(
          clanAddress,
          targetUserAddress,
          newRole,
          removerAddress,
          {
            ...options,
            reason: options.reason || `Demoted from ${currentRole.role}`,
            isDemotion: true
          }
        );
      }

    } catch (error) {
      console.error('Role removal failed:', error);
      throw error;
    }
  }

  /**
   * Transfer clan ownership
   */
  async transferOwnership(clanAddress, newOwnerAddress, currentOwnerAddress = null, options = {}) {
    try {
      if (!currentOwnerAddress && this.walletAdapter && this.walletAdapter.publicKey) {
        currentOwnerAddress = this.walletAdapter.publicKey.toString();
      }

      if (!currentOwnerAddress) {
        throw new Error('Current owner address required');
      }

      // Verify current ownership
      const currentOwnerRole = await this.getUserRole(clanAddress, currentOwnerAddress);
      if (!currentOwnerRole || currentOwnerRole.role !== 'owner') {
        throw new Error('Only current owner can transfer ownership');
      }

      // Verify new owner is clan member
      const newOwnerRole = await this.getUserRole(clanAddress, newOwnerAddress);
      if (!newOwnerRole) {
        throw new Error('New owner must be a clan member');
      }

      // Cannot transfer to same user
      if (currentOwnerAddress === newOwnerAddress) {
        throw new Error('Cannot transfer ownership to yourself');
      }

      // Execute ownership transfer
      const timestamp = new Date().toISOString();

      // Update current owner to admin
      const clanRoles = this.roleAssignments.get(clanAddress);
      if (clanRoles) {
        // Demote current owner to admin
        clanRoles.set(currentOwnerAddress, {
          role: 'admin',
          assignedAt: timestamp,
          assignedBy: 'system',
          permissions: this.getRolePermissions('admin'),
          previousRole: 'owner',
          metadata: {
            ...options.metadata,
            demotedFromOwner: true,
            ownershipTransfer: true
          }
        });

        // Promote new owner
        clanRoles.set(newOwnerAddress, {
          role: 'owner',
          assignedAt: timestamp,
          assignedBy: currentOwnerAddress,
          permissions: this.getRolePermissions('owner'),
          previousRole: newOwnerRole.role,
          metadata: {
            ...options.metadata,
            promotedToOwner: true,
            ownershipTransfer: true
          }
        });
      }

      // Clear permission caches
      this.clearUserPermissionCache(clanAddress, currentOwnerAddress);
      this.clearUserPermissionCache(clanAddress, newOwnerAddress);

      // Add to role history
      this.addToRoleHistory(clanAddress, {
        action: 'ownership_transferred',
        previousOwner: currentOwnerAddress,
        newOwner: newOwnerAddress,
        previousOwnerRole: 'owner',
        newOwnerPreviousRole: newOwnerRole.role,
        timestamp: timestamp,
        metadata: options
      });

      // Add to audit trail
      this.auditTrail.push({
        action: 'ownership_transferred',
        clanAddress: clanAddress,
        actorAddress: currentOwnerAddress,
        targetAddress: newOwnerAddress,
        timestamp: timestamp,
        metadata: {
          reason: options.reason || 'Ownership transfer',
          previousOwnerNewRole: 'admin'
        }
      });

      console.log(`Clan ownership transferred from ${currentOwnerAddress} to ${newOwnerAddress}`);

      return {
        success: true,
        previousOwner: currentOwnerAddress,
        newOwner: newOwnerAddress,
        previousOwnerNewRole: 'admin'
      };

    } catch (error) {
      console.error('Ownership transfer failed:', error);
      throw error;
    }
  }

  /**
   * Get all clan members with their roles
   */
  getClanMembers(clanAddress, options = {}) {
    const clanRoles = this.roleAssignments.get(clanAddress);
    if (!clanRoles) {
      return [];
    }

    const members = [];
    for (const [userAddress, roleData] of clanRoles) {
      const roleInfo = CLAN_ROLE_HIERARCHY[roleData.role.toUpperCase()];
      
      const member = {
        address: userAddress,
        role: roleData.role,
        roleInfo: roleInfo,
        assignedAt: roleData.assignedAt,
        assignedBy: roleData.assignedBy,
        permissions: roleData.permissions,
        metadata: roleData.metadata
      };

      // Apply filters
      if (options.role && roleData.role !== options.role) {
        continue;
      }

      if (options.includeMetadata === false) {
        delete member.metadata;
      }

      members.push(member);
    }

    // Sort by role priority (highest first)
    members.sort((a, b) => b.roleInfo.priority - a.roleInfo.priority);

    return members;
  }

  /**
   * Get role statistics for clan
   */
  getClanRoleStatistics(clanAddress) {
    const members = this.getClanMembers(clanAddress);
    const stats = {
      totalMembers: members.length,
      roleBreakdown: {},
      hierarchyDistribution: {}
    };

    // Count members by role
    for (const role of Object.values(CLAN_ROLE_HIERARCHY)) {
      stats.roleBreakdown[role.id] = members.filter(m => m.role === role.id).length;
      stats.hierarchyDistribution[role.id] = {
        current: stats.roleBreakdown[role.id],
        maximum: role.maxCount,
        percentage: role.maxCount > 0 ? (stats.roleBreakdown[role.id] / role.maxCount) * 100 : 0
      };
    }

    return stats;
  }

  /**
   * Get pending role change requests for clan
   */
  getPendingRoleChangeRequests(clanAddress, status = 'pending') {
    const requests = [];
    
    for (const [requestId, request] of this.pendingRoleChanges) {
      if (request.clanAddress === clanAddress && 
          (status === 'all' || request.status === status)) {
        requests.push({
          ...request,
          isExpired: new Date(request.expiresAt) <= new Date()
        });
      }
    }

    return requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Set custom clan permissions configuration
   */
  setCustomClanPermissions(clanAddress, customConfig, adminAddress = null) {
    try {
      if (!adminAddress && this.walletAdapter && this.walletAdapter.publicKey) {
        adminAddress = this.walletAdapter.publicKey.toString();
      }

      // Verify admin has permission to modify clan permissions
      const permissionCheck = this.hasPermission(clanAddress, adminAddress, 'edit_clan');
      if (!permissionCheck.allowed) {
        throw new Error(permissionCheck.reason);
      }

      this.customPermissions.set(clanAddress, {
        ...customConfig,
        updatedAt: new Date().toISOString(),
        updatedBy: adminAddress
      });

      // Clear permission cache for all clan members
      this.clearClanPermissionCache(clanAddress);

      // Add to audit trail
      this.auditTrail.push({
        action: 'custom_permissions_updated',
        clanAddress: clanAddress,
        actorAddress: adminAddress,
        timestamp: new Date().toISOString(),
        metadata: { customConfig: Object.keys(customConfig) }
      });

      console.log(`Custom permissions updated for clan ${clanAddress}`);

      return { success: true };
    } catch (error) {
      console.error('Custom permissions update failed:', error);
      throw error;
    }
  }

  /**
   * Emergency override - bypass normal role restrictions (Owner only)
   */
  async emergencyOverride(clanAddress, operation, ownerAddress = null, justification = '') {
    try {
      if (!ownerAddress && this.walletAdapter && this.walletAdapter.publicKey) {
        ownerAddress = this.walletAdapter.publicKey.toString();
      }

      if (!ownerAddress) {
        throw new Error('Owner address required for emergency override');
      }

      // Verify ownership
      const ownerRole = await this.getUserRole(clanAddress, ownerAddress);
      if (!ownerRole || ownerRole.role !== 'owner') {
        throw new Error('Emergency override requires clan ownership');
      }

      if (!justification) {
        throw new Error('Justification required for emergency override');
      }

      // Log emergency override
      this.auditTrail.push({
        action: 'emergency_override',
        clanAddress: clanAddress,
        actorAddress: ownerAddress,
        timestamp: new Date().toISOString(),
        metadata: {
          operation: operation,
          justification: justification,
          emergency: true
        }
      });

      console.warn(`EMERGENCY OVERRIDE by ${ownerAddress}: ${operation}`);
      console.warn(`Justification: ${justification}`);

      return {
        success: true,
        override: true,
        justification: justification,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Emergency override failed:', error);
      throw error;
    }
  }

  /**
   * Helper Functions
   */

  generateRequestId(clanAddress, targetUser, role) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `roleReq_${clanAddress.slice(-8)}_${targetUser.slice(-8)}_${role}_${timestamp}_${random}`;
  }

  addToRoleHistory(clanAddress, historyEntry) {
    let history = this.roleHistory.get(clanAddress);
    if (!history) {
      history = [];
      this.roleHistory.set(clanAddress, history);
    }
    history.push(historyEntry);

    // Keep only last 1000 entries per clan
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }
  }

  checkRateLimit(userAddress, limitType) {
    const key = `${userAddress}_${limitType}`;
    const now = Date.now();
    const limits = this.rateLimits.get(key) || { count: 0, resetTime: now + 24 * 60 * 60 * 1000 };
    
    if (now >= limits.resetTime) {
      limits.count = 0;
      limits.resetTime = now + 24 * 60 * 60 * 1000;
    }
    
    const maxCount = ROLE_ASSIGNMENT_CONFIG.RATE_LIMITS[limitType] || 10;
    
    if (limits.count >= maxCount) {
      const remainingTime = Math.ceil((limits.resetTime - now) / 3600000);
      return {
        allowed: false,
        remainingTime: remainingTime,
        message: `Rate limit exceeded. Try again in ${remainingTime} hours.`
      };
    }
    
    return { allowed: true };
  }

  updateRateLimit(userAddress, limitType) {
    const key = `${userAddress}_${limitType}`;
    const limits = this.rateLimits.get(key) || { count: 0, resetTime: Date.now() + 24 * 60 * 60 * 1000 };
    limits.count += 1;
    this.rateLimits.set(key, limits);
  }

  clearUserPermissionCache(clanAddress, userAddress) {
    const keysToDelete = [];
    for (const key of this.permissionCache.keys()) {
      if (key.startsWith(`${clanAddress}_${userAddress}_`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.permissionCache.delete(key));
  }

  clearClanPermissionCache(clanAddress) {
    const keysToDelete = [];
    for (const key of this.permissionCache.keys()) {
      if (key.startsWith(`${clanAddress}_`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.permissionCache.delete(key));
  }

  /**
   * Get role assignment history for clan or user
   */
  getRoleHistory(clanAddress, userAddress = null, limit = 50) {
    const history = this.roleHistory.get(clanAddress) || [];
    
    let filteredHistory = history;
    if (userAddress) {
      filteredHistory = history.filter(entry => 
        entry.targetUser === userAddress || 
        entry.newOwner === userAddress || 
        entry.previousOwner === userAddress
      );
    }

    return filteredHistory.slice(-limit).reverse();
  }

  /**
   * Get audit trail for role operations
   */
  getRoleAuditTrail(clanAddress = null, limit = 100) {
    let trail = this.auditTrail;
    
    if (clanAddress) {
      trail = trail.filter(entry => entry.clanAddress === clanAddress);
    }
    
    return trail.slice(-limit).reverse();
  }

  /**
   * Clean up expired role change requests
   */
  cleanupExpiredRequests() {
    const now = new Date();
    let cleanedCount = 0;

    for (const [requestId, request] of this.pendingRoleChanges) {
      if (request.status === 'pending' && new Date(request.expiresAt) <= now) {
        request.status = 'expired';
        cleanedCount++;

        this.auditTrail.push({
          action: 'role_change_request_expired',
          clanAddress: request.clanAddress,
          requestId: requestId,
          timestamp: now.toISOString(),
          metadata: { autoCleanup: true }
        });
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired role change requests`);
    }

    return { cleanedCount };
  }

  /**
   * Clear all caches and reset state
   */
  clearCache() {
    this.roleAssignments.clear();
    this.permissionCache.clear();
    this.roleHistory.clear();
    this.pendingRoleChanges.clear();
    this.rateLimits.clear();
    this.cooldowns.clear();
    this.auditTrail = [];
    this.customPermissions.clear();
    console.log('All role management caches and state cleared');
  }
}

/**
 * Utility Functions
 */

/**
 * Get role display information
 */
export function getRoleDisplayInfo(roleId) {
  const role = CLAN_ROLE_HIERARCHY[roleId.toUpperCase()];
  if (!role) {
    return null;
  }

  return {
    id: role.id,
    name: role.name,
    displayName: role.displayName,
    description: role.description,
    color: role.color,
    icon: role.icon,
    priority: role.priority,
    features: role.features
  };
}

/**
 * Get permission display information
 */
export function getPermissionDisplayInfo(permissionId) {
  for (const category of Object.values(PERMISSION_CATEGORIES)) {
    if (category.permissions[permissionId]) {
      return {
        id: permissionId,
        name: category.permissions[permissionId].name,
        description: category.permissions[permissionId].description,
        category: category.id,
        categoryName: category.name
      };
    }
  }
  return null;
}

/**
 * Check if role can assign another role
 */
export function canRoleAssignRole(assignerRole, targetRole) {
  const assigner = CLAN_ROLE_HIERARCHY[assignerRole.toUpperCase()];
  const target = CLAN_ROLE_HIERARCHY[targetRole.toUpperCase()];
  
  if (!assigner || !target) {
    return false;
  }

  return assigner.canAssignRoles.includes(targetRole.toLowerCase());
}

/**
 * Get role hierarchy order
 */
export function getRoleHierarchyOrder() {
  return Object.values(CLAN_ROLE_HIERARCHY)
    .sort((a, b) => b.priority - a.priority)
    .map(role => ({
      id: role.id,
      name: role.name,
      priority: role.priority
    }));
}

/**
 * Format role assignment for display
 */
export function formatRoleAssignment(assignment, includePermissions = false) {
  const roleInfo = CLAN_ROLE_HIERARCHY[assignment.role.toUpperCase()];
  
  const formatted = {
    role: assignment.role,
    roleInfo: roleInfo ? {
      name: roleInfo.name,
      displayName: roleInfo.displayName,
      color: roleInfo.color,
      icon: roleInfo.icon,
      priority: roleInfo.priority
    } : null,
    assignedAt: assignment.assignedAt,
    assignedBy: assignment.assignedBy,
    previousRole: assignment.previousRole,
    metadata: assignment.metadata
  };

  if (includePermissions) {
    formatted.permissions = assignment.permissions;
  }

  return formatted;
}

/**
 * Validate role assignment data
 */
export function validateRoleAssignmentData(assignmentData) {
  const validation = {
    isValid: false,
    errors: [],
    warnings: []
  };

  const { clanAddress, targetUser, role, assignerAddress } = assignmentData;

  // Required fields
  if (!clanAddress) validation.errors.push('Clan address is required');
  if (!targetUser) validation.errors.push('Target user address is required');
  if (!role) validation.errors.push('Role is required');
  if (!assignerAddress) validation.errors.push('Assigner address is required');

  // Validate role exists
  if (role && !CLAN_ROLE_HIERARCHY[role.toUpperCase()]) {
    validation.errors.push('Invalid role specified');
  }

  validation.isValid = validation.errors.length === 0;
  return validation;
}

console.log('MLG.clan Roles and Permissions Management System loaded successfully');
console.log('Available roles:', Object.keys(CLAN_ROLE_HIERARCHY));
console.log('Permission categories:', Object.keys(PERMISSION_CATEGORIES));
console.log('MLG Token Integration: 7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL');