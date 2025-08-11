/**
 * MLG.clan Roles Integration Examples - Sub-task 5.3
 * 
 * Comprehensive examples demonstrating integration of the clan roles and permissions
 * management system with existing clan management, invitation systems, and frontend components.
 * 
 * Integration Patterns:
 * - Clan creation with role initialization
 * - Member invitation with role assignment
 * - Permission-based UI component rendering
 * - Role-based access control for operations
 * - Real-time permission validation and updates
 * - Multi-admin approval workflows
 * 
 * Usage Examples:
 * - Setting up a new clan with complete role hierarchy
 * - Managing member roles through invitation system
 * - Implementing permission-based feature access
 * - Creating admin dashboards with role-specific controls
 * - Handling role changes and approval processes
 * 
 * @author Claude Code - Integration Specialist
 * @version 1.0.0
 * @integration clan-management.js, clan-invitations.js, clan-roles.js
 */

import { ClanManager } from './clan-management.js';
import { ClanInvitationManager, INVITATION_TYPES, INVITATION_STATUS } from './clan-invitations.js';
import { ClanRoleManager, CLAN_ROLE_HIERARCHY, PERMISSION_CATEGORIES } from './clan-roles.js';

/**
 * Complete Clan Management Integration
 * Demonstrates full integration of all clan systems
 */
export class IntegratedClanSystem {
  constructor(walletAdapter) {
    this.walletAdapter = walletAdapter;
    
    // Initialize all management systems
    this.clanManager = new ClanManager(walletAdapter);
    this.roleManager = new ClanRoleManager(walletAdapter, this.clanManager);
    this.invitationManager = new ClanInvitationManager(walletAdapter, this.clanManager);
    
    console.log('Integrated clan system initialized with full role and permission management');
  }

  /**
   * Example 1: Complete Clan Creation with Role System
   * Creates a clan and initializes the role hierarchy
   */
  async createClanWithRoles(clanData) {
    try {
      console.log('🏗️ Creating clan with integrated role system...');
      
      // Step 1: Create clan through clan management system
      const clanResult = await this.clanManager.createClan(clanData);
      
      if (!clanResult.success) {
        throw new Error('Clan creation failed');
      }

      const clanAddress = clanResult.clan.id;
      const ownerAddress = this.walletAdapter.publicKey.toString();

      // Step 2: Initialize role system for the new clan
      const roleInitResult = await this.roleManager.initializeClanRoles(clanAddress, ownerAddress);
      
      if (!roleInitResult.success) {
        throw new Error('Role system initialization failed');
      }

      // Step 3: Set up initial role configuration
      await this.setupInitialRoleConfiguration(clanAddress);

      console.log('✅ Clan created successfully with complete role system');
      console.log(`Clan Address: ${clanAddress}`);
      console.log(`Owner: ${ownerAddress}`);
      console.log(`Tier: ${clanResult.clan.tier}`);

      return {
        success: true,
        clan: clanResult.clan,
        roleSystem: roleInitResult,
        clanAddress: clanAddress
      };

    } catch (error) {
      console.error('❌ Clan creation with roles failed:', error);
      throw error;
    }
  }

  /**
   * Example 2: Member Invitation with Role Assignment
   * Demonstrates role-based invitation workflow
   */
  async inviteMemberWithRole(clanAddress, targetUserAddress, assignedRole = 'member', inviteMessage = '') {
    try {
      console.log(`📧 Inviting member with role: ${assignedRole}`);

      // Step 1: Check invitation permissions
      const senderAddress = this.walletAdapter.publicKey.toString();
      const permissionCheck = await this.roleManager.hasPermission(
        clanAddress,
        senderAddress,
        'manage_invitations',
        { type: 'invite_member', params: [targetUserAddress, assignedRole] }
      );

      if (!permissionCheck.allowed) {
        throw new Error(`Permission denied: ${permissionCheck.reason}`);
      }

      // Step 2: Check if sender can assign the target role
      const roleAssignCheck = await this.roleManager.hasPermission(
        clanAddress,
        senderAddress,
        'assign_roles',
        { type: 'assign_role', params: [assignedRole, targetUserAddress] }
      );

      if (!roleAssignCheck.allowed) {
        throw new Error(`Cannot assign role '${assignedRole}': ${roleAssignCheck.reason}`);
      }

      // Step 3: Send invitation with role information
      const invitationResult = await this.invitationManager.sendDirectInvitation({
        clanAddress: clanAddress,
        targetUser: targetUserAddress,
        role: assignedRole,
        message: inviteMessage || `You've been invited to join as ${assignedRole}`,
        type: 'direct'
      });

      if (!invitationResult.success) {
        throw new Error('Invitation sending failed');
      }

      console.log('✅ Invitation sent successfully with role assignment');

      return {
        success: true,
        invitation: invitationResult.invitation,
        assignedRole: assignedRole
      };

    } catch (error) {
      console.error('❌ Role-based invitation failed:', error);
      throw error;
    }
  }

  /**
   * Example 3: Accept Invitation and Auto-Assign Role
   * Handles invitation acceptance with automatic role assignment
   */
  async acceptInvitationWithRoleAssignment(invitationId) {
    try {
      console.log('✅ Accepting invitation and assigning role...');

      const userAddress = this.walletAdapter.publicKey.toString();

      // Step 1: Accept invitation through invitation system
      const acceptResult = await this.invitationManager.acceptInvitation(invitationId, userAddress);
      
      if (!acceptResult.success) {
        throw new Error('Invitation acceptance failed');
      }

      const invitation = acceptResult.invitation;

      // Step 2: Assign role through role management system
      const roleAssignment = await this.roleManager.assignRole(
        invitation.clanAddress,
        userAddress,
        invitation.role,
        'system', // System assignment after invitation acceptance
        {
          reason: 'Joined via invitation',
          source: 'invitation_acceptance',
          invitationId: invitationId,
          bypassApproval: true // Invitations are pre-approved
        }
      );

      if (!roleAssignment.success) {
        throw new Error('Role assignment after invitation failed');
      }

      console.log('✅ Successfully joined clan and assigned role');
      console.log(`Role: ${invitation.role}`);
      console.log(`Clan: ${invitation.clanName}`);

      return {
        success: true,
        clanAddress: invitation.clanAddress,
        assignedRole: invitation.role,
        roleAssignment: roleAssignment.assignment
      };

    } catch (error) {
      console.error('❌ Invitation acceptance with role assignment failed:', error);
      throw error;
    }
  }

  /**
   * Example 4: Permission-Based Feature Access Control
   * Demonstrates how to control feature access based on user permissions
   */
  async checkFeatureAccess(clanAddress, userAddress, featureName) {
    const featurePermissions = {
      'clan_settings': ['edit_clan'],
      'member_management': ['manage_members'],
      'invite_members': ['manage_invitations'],
      'kick_members': ['kick_members'],
      'ban_members': ['ban_members'],
      'role_management': ['assign_roles'],
      'treasury_access': ['manage_treasury'],
      'event_creation': ['create_events'],
      'content_moderation': ['content_moderation'],
      'voting_pools': ['manage_voting'],
      'emergency_actions': ['emergency_override']
    };

    const requiredPermissions = featurePermissions[featureName];
    if (!requiredPermissions) {
      return { hasAccess: false, reason: 'Unknown feature' };
    }

    const accessResults = [];

    for (const permission of requiredPermissions) {
      const check = await this.roleManager.hasPermission(clanAddress, userAddress, permission);
      accessResults.push({
        permission: permission,
        allowed: check.allowed,
        reason: check.reason
      });
    }

    const hasAccess = accessResults.every(result => result.allowed);

    return {
      hasAccess: hasAccess,
      feature: featureName,
      requiredPermissions: requiredPermissions,
      permissionResults: accessResults,
      userRole: (await this.roleManager.getUserRole(clanAddress, userAddress))?.role
    };
  }

  /**
   * Example 5: Role Promotion Workflow with Approval
   * Demonstrates multi-admin approval for role promotions
   */
  async promoteMembeWithApproval(clanAddress, targetUserAddress, newRole, reason = '') {
    try {
      console.log(`⬆️ Starting role promotion workflow: ${targetUserAddress} -> ${newRole}`);

      const promoterAddress = this.walletAdapter.publicKey.toString();

      // Step 1: Initiate role assignment (may require approval)
      const promotionResult = await this.roleManager.assignRole(
        clanAddress,
        targetUserAddress,
        newRole,
        promoterAddress,
        { reason: reason || `Promotion to ${newRole}` }
      );

      if (promotionResult.requiresApproval) {
        console.log('🕐 Promotion requires multi-admin approval');
        console.log(`Request ID: ${promotionResult.requestId}`);

        // Step 2: Get approval requirements
        const request = this.roleManager.pendingRoleChanges.get(promotionResult.requestId);
        
        console.log(`Required approvals: ${request.requiredApprovals}`);
        console.log(`Owner approval required: ${request.requiresOwnerApproval}`);
        console.log(`Expires at: ${request.expiresAt}`);

        return {
          success: true,
          requiresApproval: true,
          request: request,
          requestId: promotionResult.requestId,
          nextSteps: 'Waiting for admin approvals'
        };
      } else {
        console.log('✅ Promotion completed immediately');
        
        return {
          success: true,
          requiresApproval: false,
          assignment: promotionResult.assignment,
          newRole: newRole
        };
      }

    } catch (error) {
      console.error('❌ Role promotion workflow failed:', error);
      throw error;
    }
  }

  /**
   * Example 6: Process Approval Request
   * Shows how admins can approve or reject role change requests
   */
  async processRoleApproval(requestId, decision, approvalReason = '') {
    try {
      console.log(`⚖️ Processing role approval: ${decision}`);

      const adminAddress = this.walletAdapter.publicKey.toString();

      const approvalResult = await this.roleManager.processRoleChangeRequest(
        requestId,
        decision,
        adminAddress,
        approvalReason
      );

      if (approvalResult.finalDecision) {
        console.log(`✅ Role change ${approvalResult.finalDecision}`);
        
        if (approvalResult.finalDecision === 'approved') {
          console.log('🎉 New role has been assigned to the member');
        } else {
          console.log('❌ Role change request was rejected');
        }
      } else {
        console.log('🕐 More approvals needed');
        console.log(`Current approvals: ${approvalResult.request.approvals.length}`);
        console.log(`Required approvals: ${approvalResult.request.requiredApprovals}`);
      }

      return approvalResult;

    } catch (error) {
      console.error('❌ Role approval processing failed:', error);
      throw error;
    }
  }

  /**
   * Example 7: Comprehensive Clan Dashboard Data
   * Provides all role and permission data needed for admin dashboards
   */
  async getClanDashboardData(clanAddress) {
    try {
      console.log('📊 Gathering comprehensive clan dashboard data...');

      const userAddress = this.walletAdapter.publicKey.toString();

      // Step 1: Get basic clan information
      const clan = await this.clanManager.getClan(clanAddress);
      if (!clan) {
        throw new Error('Clan not found');
      }

      // Step 2: Get user's role and permissions
      const userRole = await this.roleManager.getUserRole(clanAddress, userAddress);
      const userPermissions = userRole ? userRole.permissions : [];

      // Step 3: Get all clan members with roles
      const clanMembers = this.roleManager.getClanMembers(clanAddress, { includeMetadata: true });

      // Step 4: Get role statistics
      const roleStats = this.roleManager.getClanRoleStatistics(clanAddress);

      // Step 5: Get pending role change requests (if user can see them)
      const pendingRequests = await this.roleManager.hasPermission(clanAddress, userAddress, 'assign_roles')
        ? this.roleManager.getPendingRoleChangeRequests(clanAddress)
        : [];

      // Step 6: Get invitation statistics
      const invitationStats = this.invitationManager.getClanInvitationStats(clanAddress);

      // Step 7: Get pending invitations (if user can manage them)
      const pendingInvitations = await this.roleManager.hasPermission(clanAddress, userAddress, 'manage_invitations')
        ? this.invitationManager.getClanInvitations(clanAddress, INVITATION_STATUS.PENDING)
        : [];

      // Step 8: Get feature access for current user
      const featureAccess = {};
      const features = [
        'clan_settings', 'member_management', 'invite_members', 'kick_members',
        'role_management', 'treasury_access', 'event_creation', 'content_moderation'
      ];

      for (const feature of features) {
        featureAccess[feature] = await this.checkFeatureAccess(clanAddress, userAddress, feature);
      }

      // Step 9: Get recent role history (last 20 entries)
      const roleHistory = this.roleManager.getRoleHistory(clanAddress, null, 20);

      const dashboardData = {
        clan: clan,
        userRole: userRole,
        userPermissions: userPermissions,
        members: clanMembers,
        roleStatistics: roleStats,
        pendingRoleRequests: pendingRequests,
        invitationStatistics: invitationStats,
        pendingInvitations: pendingInvitations,
        featureAccess: featureAccess,
        recentRoleHistory: roleHistory,
        
        // Summary counts for quick overview
        summary: {
          totalMembers: clanMembers.length,
          pendingApprovals: pendingRequests.filter(r => r.status === 'pending').length,
          pendingInvitations: pendingInvitations.length,
          recentActivity: roleHistory.length
        }
      };

      console.log('✅ Dashboard data compiled successfully');
      return dashboardData;

    } catch (error) {
      console.error('❌ Dashboard data compilation failed:', error);
      throw error;
    }
  }

  /**
   * Example 8: Bulk Role Management Operations
   * Demonstrates efficient bulk operations for role management
   */
  async bulkRoleOperations(clanAddress, operations) {
    try {
      console.log(`📋 Processing ${operations.length} bulk role operations...`);

      const results = {
        successful: [],
        failed: [],
        total: operations.length
      };

      for (const operation of operations) {
        try {
          let result;

          switch (operation.type) {
            case 'assign_role':
              result = await this.roleManager.assignRole(
                clanAddress,
                operation.targetUser,
                operation.role,
                operation.assignerAddress || this.walletAdapter.publicKey.toString(),
                operation.options
              );
              break;

            case 'remove_role':
              result = await this.roleManager.removeRole(
                clanAddress,
                operation.targetUser,
                operation.removerAddress || this.walletAdapter.publicKey.toString(),
                operation.options
              );
              break;

            case 'invite_with_role':
              result = await this.inviteMemberWithRole(
                clanAddress,
                operation.targetUser,
                operation.role,
                operation.message
              );
              break;

            default:
              throw new Error(`Unknown operation type: ${operation.type}`);
          }

          results.successful.push({
            operation: operation,
            result: result
          });

        } catch (error) {
          results.failed.push({
            operation: operation,
            error: error.message
          });
        }
      }

      console.log(`✅ Bulk operations completed: ${results.successful.length} successful, ${results.failed.length} failed`);
      
      return results;

    } catch (error) {
      console.error('❌ Bulk role operations failed:', error);
      throw error;
    }
  }

  /**
   * Helper Methods
   */

  async setupInitialRoleConfiguration(clanAddress) {
    // Set up any custom clan-specific role configurations
    console.log('⚙️ Setting up initial role configuration...');
    
    // Example: Set custom permissions for this clan
    const customConfig = {
      description: 'Initial role configuration for new clan',
      restrictions: {
        // Add any custom restrictions
      },
      customRoles: {
        // Define any custom roles specific to this clan
      },
      specialPermissions: {
        // Add any special permissions
      }
    };

    this.roleManager.setCustomClanPermissions(
      clanAddress, 
      customConfig, 
      this.walletAdapter.publicKey.toString()
    );
  }

  /**
   * Get user's effective permissions across all systems
   */
  async getUserEffectivePermissions(clanAddress, userAddress) {
    const userRole = await this.roleManager.getUserRole(clanAddress, userAddress);
    if (!userRole) {
      return { permissions: [], role: null, hasAccess: false };
    }

    const permissions = {};
    
    // Check all permission categories
    for (const category of Object.values(PERMISSION_CATEGORIES)) {
      permissions[category.id] = {};
      
      for (const permissionId of Object.keys(category.permissions)) {
        const check = await this.roleManager.hasPermission(clanAddress, userAddress, permissionId);
        permissions[category.id][permissionId] = {
          allowed: check.allowed,
          reason: check.reason
        };
      }
    }

    return {
      permissions: permissions,
      role: userRole.role,
      roleInfo: CLAN_ROLE_HIERARCHY[userRole.role.toUpperCase()],
      hasAccess: true
    };
  }

  /**
   * Get clan health metrics including role distribution
   */
  getClanHealthMetrics(clanAddress) {
    const roleStats = this.roleManager.getClanRoleStatistics(clanAddress);
    const invitationStats = this.invitationManager.getClanInvitationStats(clanAddress);
    const pendingRequests = this.roleManager.getPendingRoleChangeRequests(clanAddress);

    return {
      membershipHealth: {
        totalMembers: roleStats.totalMembers,
        roleDistribution: roleStats.roleBreakdown,
        adminRatio: (roleStats.roleBreakdown.admin + roleStats.roleBreakdown.owner) / roleStats.totalMembers,
        activeRoleRequests: pendingRequests.length
      },
      
      invitationHealth: {
        pendingInvitations: invitationStats.pendingInvitations,
        acceptanceRate: invitationStats.acceptedInvitations / 
          (invitationStats.acceptedInvitations + invitationStats.rejectedInvitations) || 0,
        activeInviteLinks: invitationStats.activeInviteLinks
      },
      
      governanceHealth: {
        pendingApprovals: pendingRequests.filter(r => r.status === 'pending').length,
        approvalBacklog: pendingRequests.filter(r => 
          new Date(r.expiresAt) < new Date(Date.now() + 24 * 60 * 60 * 1000)
        ).length
      }
    };
  }

  /**
   * Clean up expired data across all systems
   */
  async performSystemMaintenance() {
    console.log('🧹 Performing system maintenance...');

    const results = {
      rolesCleanup: this.roleManager.cleanupExpiredRequests(),
      invitationsCleanup: await this.invitationManager.cleanupExpired()
    };

    console.log(`Maintenance completed:`, results);
    return results;
  }
}

/**
 * React Component Integration Examples
 * Demonstrates how to integrate role management with React components
 */

// Example React Hook for Role Management
export const useRoleManagement = (clanAddress, userAddress) => {
  const [roleData, setRoleData] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clanAddress || !userAddress) return;

    const loadRoleData = async () => {
      try {
        setLoading(true);
        
        // This would be injected via context or props
        const integratedSystem = getIntegratedClanSystem();
        
        const [userRole, effectivePermissions] = await Promise.all([
          integratedSystem.roleManager.getUserRole(clanAddress, userAddress),
          integratedSystem.getUserEffectivePermissions(clanAddress, userAddress)
        ]);

        setRoleData(userRole);
        setPermissions(effectivePermissions.permissions);
      } catch (error) {
        console.error('Failed to load role data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRoleData();
  }, [clanAddress, userAddress]);

  return { roleData, permissions, loading };
};

// Example Permission-Based Component
export const PermissionGuard = ({ 
  clanAddress, 
  userAddress, 
  requiredPermission, 
  children, 
  fallback = null 
}) => {
  const { permissions, loading } = useRoleManagement(clanAddress, userAddress);

  if (loading) {
    return <div>Loading permissions...</div>;
  }

  // Check if user has required permission
  const hasPermission = permissions && 
    Object.values(permissions).some(category => 
      category[requiredPermission]?.allowed
    );

  return hasPermission ? children : fallback;
};

// Example Role Badge Component
export const RoleBadge = ({ role, showIcon = true, showName = true }) => {
  const roleInfo = CLAN_ROLE_HIERARCHY[role?.toUpperCase()];
  
  if (!roleInfo) return null;

  return (
    <span 
      className="role-badge"
      style={{ 
        backgroundColor: roleInfo.color,
        color: '#fff',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '0.8em',
        fontWeight: 'bold'
      }}
    >
      {showIcon && roleInfo.icon} {showName && roleInfo.displayName}
    </span>
  );
};

/**
 * Usage Examples for Frontend Integration
 */

// Example 1: Clan Settings Page with Role-Based Access
export const ClanSettingsPage = ({ clanAddress }) => {
  return (
    <div>
      <h1>Clan Settings</h1>
      
      <PermissionGuard 
        clanAddress={clanAddress} 
        requiredPermission="edit_clan"
        fallback={<div>You don't have permission to access clan settings.</div>}
      >
        <ClanSettingsForm clanAddress={clanAddress} />
      </PermissionGuard>
      
      <PermissionGuard 
        clanAddress={clanAddress} 
        requiredPermission="manage_members"
      >
        <MemberManagementSection clanAddress={clanAddress} />
      </PermissionGuard>
      
      <PermissionGuard 
        clanAddress={clanAddress} 
        requiredPermission="manage_treasury"
      >
        <TreasuryManagementSection clanAddress={clanAddress} />
      </PermissionGuard>
    </div>
  );
};

// Example 2: Member List with Role Actions
export const MemberListComponent = ({ clanAddress }) => {
  const [members, setMembers] = useState([]);
  const { roleData: userRole, permissions } = useRoleManagement(clanAddress, getCurrentUserAddress());

  const canKickMembers = permissions?.member_management?.kick_members?.allowed;
  const canAssignRoles = permissions?.member_management?.assign_roles?.allowed;

  return (
    <div>
      <h2>Clan Members</h2>
      {members.map(member => (
        <div key={member.address} className="member-item">
          <div className="member-info">
            <span>{member.address}</span>
            <RoleBadge role={member.role} />
          </div>
          
          <div className="member-actions">
            {canKickMembers && (
              <button onClick={() => kickMember(member.address)}>
                Kick
              </button>
            )}
            
            {canAssignRoles && (
              <RoleAssignmentDropdown 
                member={member}
                onRoleChange={(newRole) => assignRole(member.address, newRole)}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Export utility functions for easy integration
 */
export {
  IntegratedClanSystem as default,
  IntegratedClanSystem
};

console.log('MLG.clan Roles Integration Examples loaded successfully');
console.log('Available integration patterns: Clan creation, Role assignment, Permission guards, Dashboard data');
console.log('React components: useRoleManagement hook, PermissionGuard, RoleBadge');
console.log('MLG Token Integration: 7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL');