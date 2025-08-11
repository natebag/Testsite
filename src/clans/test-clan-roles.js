/**
 * Test Suite for Clan Roles and Permissions Management System
 * 
 * Comprehensive testing of role hierarchy, permission validation, role assignment workflows,
 * and integration with existing clan management systems.
 */

import { ClanRoleManager, CLAN_ROLE_HIERARCHY, PERMISSION_CATEGORIES, ROLE_ASSIGNMENT_CONFIG } from './clan-roles.js';
import { ClanManager, CLAN_TIER_CONFIG } from './clan-management.js';
import { ClanInvitationManager } from './clan-invitations.js';

/**
 * Mock Wallet Adapter for testing
 */
class MockWalletAdapter {
  constructor(publicKeyString) {
    this.publicKey = { toString: () => publicKeyString };
    this.connected = true;
  }

  async signTransaction(transaction) {
    // Mock transaction signing
    return { serialize: () => new Uint8Array([1, 2, 3, 4]) };
  }
}

/**
 * Test Suite Runner
 */
class ClanRoleTestSuite {
  constructor() {
    this.testResults = [];
    this.setupTestData();
  }

  setupTestData() {
    // Test addresses
    this.addresses = {
      owner: 'owner123456789abcdefghijklmnop',
      admin1: 'admin1123456789abcdefghijklmnop',
      admin2: 'admin2123456789abcdefghijklmnop',
      mod1: 'mod123456789abcdefghijklmnop',
      officer1: 'officer123456789abcdefghijklmnop',
      member1: 'member123456789abcdefghijklmnop',
      member2: 'member223456789abcdefghijklmnop',
      recruit1: 'recruit123456789abcdefghijklmnop',
      external: 'external123456789abcdefghijklmnop'
    };

    this.testClanAddress = 'testclan123456789abcdefghijklmnop';
  }

  async runTest(testName, testFunction) {
    try {
      console.log(`\n🧪 Running: ${testName}`);
      const startTime = Date.now();
      
      await testFunction();
      
      const duration = Date.now() - startTime;
      this.testResults.push({ name: testName, status: 'PASS', duration });
      console.log(`✅ ${testName} - PASSED (${duration}ms)`);
      
    } catch (error) {
      this.testResults.push({ name: testName, status: 'FAIL', error: error.message });
      console.error(`❌ ${testName} - FAILED: ${error.message}`);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Clan Roles and Permissions Test Suite...\n');

    // Initialize test environment
    const ownerWallet = new MockWalletAdapter(this.addresses.owner);
    const clanManager = new ClanManager(ownerWallet);
    const roleManager = new ClanRoleManager(ownerWallet, clanManager);
    
    // Role hierarchy tests
    await this.runTest('Test Role Hierarchy Structure', 
      () => this.testRoleHierarchy());
    
    await this.runTest('Test Permission Categories', 
      () => this.testPermissionCategories());

    // Role initialization tests
    await this.runTest('Test Clan Role Initialization', 
      () => this.testClanRoleInitialization(roleManager));

    // Permission validation tests
    await this.runTest('Test Basic Permission Validation', 
      () => this.testBasicPermissionValidation(roleManager));

    await this.runTest('Test Role Hierarchy Permissions', 
      () => this.testRoleHierarchyPermissions(roleManager));

    // Role assignment tests
    await this.runTest('Test Direct Role Assignment', 
      () => this.testDirectRoleAssignment(roleManager));

    await this.runTest('Test Role Assignment Restrictions', 
      () => this.testRoleAssignmentRestrictions(roleManager));

    await this.runTest('Test Multi-Admin Approval Process', 
      () => this.testMultiAdminApproval(roleManager));

    // Role management tests
    await this.runTest('Test Role Promotion and Demotion', 
      () => this.testRolePromotionDemotion(roleManager));

    await this.runTest('Test Ownership Transfer', 
      () => this.testOwnershipTransfer(roleManager));

    // Permission validation tests
    await this.runTest('Test Operation-Specific Permissions', 
      () => this.testOperationSpecificPermissions(roleManager));

    await this.runTest('Test Custom Clan Permissions', 
      () => this.testCustomClanPermissions(roleManager));

    // Security and validation tests
    await this.runTest('Test Rate Limiting', 
      () => this.testRateLimiting(roleManager));

    await this.runTest('Test Emergency Override', 
      () => this.testEmergencyOverride(roleManager));

    // Integration tests
    await this.runTest('Test Integration with Clan Management', 
      () => this.testClanManagementIntegration(clanManager, roleManager));

    await this.runTest('Test Integration with Invitation System', 
      () => this.testInvitationSystemIntegration(clanManager, roleManager));

    // Utility function tests
    await this.runTest('Test Utility Functions', 
      () => this.testUtilityFunctions());

    // Performance tests
    await this.runTest('Test Performance with Large Role Sets', 
      () => this.testPerformance(roleManager));

    // Print summary
    this.printTestSummary();
  }

  testRoleHierarchy() {
    // Test role hierarchy structure
    const roles = Object.values(CLAN_ROLE_HIERARCHY);
    
    // Should have all expected roles
    const expectedRoles = ['owner', 'admin', 'moderator', 'officer', 'member', 'recruit'];
    const actualRoles = roles.map(r => r.id);
    
    for (const expectedRole of expectedRoles) {
      if (!actualRoles.includes(expectedRole)) {
        throw new Error(`Missing expected role: ${expectedRole}`);
      }
    }

    // Test role priority ordering
    const sortedByPriority = roles.sort((a, b) => b.priority - a.priority);
    if (sortedByPriority[0].id !== 'owner') {
      throw new Error('Owner should have highest priority');
    }
    
    if (sortedByPriority[sortedByPriority.length - 1].id !== 'recruit') {
      throw new Error('Recruit should have lowest priority');
    }

    // Test role assignment capabilities
    const owner = CLAN_ROLE_HIERARCHY.OWNER;
    if (!owner.canAssignRoles.includes('admin')) {
      throw new Error('Owner should be able to assign admin role');
    }

    const member = CLAN_ROLE_HIERARCHY.MEMBER;
    if (member.canAssignRoles.length > 0) {
      throw new Error('Member should not be able to assign any roles');
    }
  }

  testPermissionCategories() {
    // Test permission categories structure
    const categories = Object.values(PERMISSION_CATEGORIES);
    
    // Should have all expected categories
    const expectedCategories = [
      'clan_management', 'member_management', 'content_moderation',
      'financial_operations', 'event_management', 'voting_operations', 'basic_access'
    ];

    for (const expectedCategory of expectedCategories) {
      const found = categories.find(c => c.id === expectedCategory);
      if (!found) {
        throw new Error(`Missing expected category: ${expectedCategory}`);
      }

      // Each category should have permissions
      if (!found.permissions || Object.keys(found.permissions).length === 0) {
        throw new Error(`Category ${expectedCategory} has no permissions`);
      }
    }

    // Test permission structure
    const clanMgmt = PERMISSION_CATEGORIES.CLAN_MANAGEMENT;
    if (!clanMgmt.permissions['edit_clan']) {
      throw new Error('Missing edit_clan permission in clan_management');
    }

    const memberMgmt = PERMISSION_CATEGORIES.MEMBER_MANAGEMENT;
    if (!memberMgmt.permissions['kick_members']) {
      throw new Error('Missing kick_members permission in member_management');
    }
  }

  async testClanRoleInitialization(roleManager) {
    // Test clan role initialization
    const result = await roleManager.initializeClanRoles(this.testClanAddress, this.addresses.owner);
    
    if (!result.success) {
      throw new Error('Clan role initialization failed');
    }

    if (result.ownerAddress !== this.addresses.owner) {
      throw new Error('Owner address mismatch');
    }

    // Verify owner role was set
    const ownerRole = await roleManager.getUserRole(this.testClanAddress, this.addresses.owner);
    if (!ownerRole || ownerRole.role !== 'owner') {
      throw new Error('Owner role not properly initialized');
    }

    // Verify role permissions
    if (!ownerRole.permissions.includes('edit_clan')) {
      throw new Error('Owner missing expected permissions');
    }
  }

  async testBasicPermissionValidation(roleManager) {
    // Setup test roles
    await roleManager.initializeClanRoles(this.testClanAddress, this.addresses.owner);
    
    // Test owner permissions
    const ownerCheck = await roleManager.hasPermission(
      this.testClanAddress, 
      this.addresses.owner, 
      'edit_clan'
    );
    
    if (!ownerCheck.allowed) {
      throw new Error('Owner should have edit_clan permission');
    }

    // Test non-member permissions
    const nonMemberCheck = await roleManager.hasPermission(
      this.testClanAddress, 
      this.addresses.external, 
      'edit_clan'
    );
    
    if (nonMemberCheck.allowed) {
      throw new Error('Non-member should not have any permissions');
    }

    // Add member and test basic permissions
    const clanRoles = roleManager.roleAssignments.get(this.testClanAddress);
    clanRoles.set(this.addresses.member1, {
      role: 'member',
      assignedAt: new Date().toISOString(),
      assignedBy: this.addresses.owner,
      permissions: roleManager.getRolePermissions('member'),
      metadata: { testMember: true }
    });

    const memberCheck = await roleManager.hasPermission(
      this.testClanAddress, 
      this.addresses.member1, 
      'chat_participation'
    );
    
    if (!memberCheck.allowed) {
      throw new Error('Member should have chat_participation permission');
    }

    const memberEditCheck = await roleManager.hasPermission(
      this.testClanAddress, 
      this.addresses.member1, 
      'edit_clan'
    );
    
    if (memberEditCheck.allowed) {
      throw new Error('Member should not have edit_clan permission');
    }
  }

  async testRoleHierarchyPermissions(roleManager) {
    // Setup role hierarchy
    await roleManager.initializeClanRoles(this.testClanAddress, this.addresses.owner);
    
    const clanRoles = roleManager.roleAssignments.get(this.testClanAddress);
    
    // Add admin
    clanRoles.set(this.addresses.admin1, {
      role: 'admin',
      assignedAt: new Date().toISOString(),
      assignedBy: this.addresses.owner,
      permissions: roleManager.getRolePermissions('admin'),
      metadata: {}
    });

    // Add moderator
    clanRoles.set(this.addresses.mod1, {
      role: 'moderator',
      assignedAt: new Date().toISOString(),
      assignedBy: this.addresses.admin1,
      permissions: roleManager.getRolePermissions('moderator'),
      metadata: {}
    });

    // Test admin permissions
    const adminManageCheck = await roleManager.hasPermission(
      this.testClanAddress, 
      this.addresses.admin1, 
      'manage_members'
    );
    
    if (!adminManageCheck.allowed) {
      throw new Error('Admin should have manage_members permission');
    }

    // Test moderator permissions
    const modKickCheck = await roleManager.hasPermission(
      this.testClanAddress, 
      this.addresses.mod1, 
      'kick_members'
    );
    
    if (!modKickCheck.allowed) {
      throw new Error('Moderator should have kick_members permission');
    }

    const modManageCheck = await roleManager.hasPermission(
      this.testClanAddress, 
      this.addresses.mod1, 
      'manage_treasury'
    );
    
    if (modManageCheck.allowed) {
      throw new Error('Moderator should not have manage_treasury permission');
    }
  }

  async testDirectRoleAssignment(roleManager) {
    // Setup
    await roleManager.initializeClanRoles(this.testClanAddress, this.addresses.owner);
    
    // Test owner assigning admin role
    const adminAssignment = await roleManager.assignRole(
      this.testClanAddress,
      this.addresses.admin1,
      'admin',
      this.addresses.owner,
      { reason: 'Test admin assignment' }
    );

    if (!adminAssignment.success) {
      throw new Error('Admin role assignment failed');
    }

    // Verify assignment
    const adminRole = await roleManager.getUserRole(this.testClanAddress, this.addresses.admin1);
    if (!adminRole || adminRole.role !== 'admin') {
      throw new Error('Admin role not properly assigned');
    }

    // Test admin assigning moderator role
    const modAssignment = await roleManager.assignRole(
      this.testClanAddress,
      this.addresses.mod1,
      'moderator',
      this.addresses.admin1,
      { reason: 'Test moderator assignment' }
    );

    if (!modAssignment.success) {
      throw new Error('Moderator role assignment failed');
    }

    // Test member assignment
    const memberAssignment = await roleManager.assignRole(
      this.testClanAddress,
      this.addresses.member1,
      'member',
      this.addresses.admin1,
      { reason: 'Test member assignment' }
    );

    if (!memberAssignment.success) {
      throw new Error('Member role assignment failed');
    }
  }

  async testRoleAssignmentRestrictions(roleManager) {
    // Setup
    await roleManager.initializeClanRoles(this.testClanAddress, this.addresses.owner);
    await roleManager.assignRole(this.testClanAddress, this.addresses.admin1, 'admin', this.addresses.owner);
    await roleManager.assignRole(this.testClanAddress, this.addresses.member1, 'member', this.addresses.admin1);

    // Test member trying to assign roles (should fail)
    try {
      await roleManager.assignRole(
        this.testClanAddress,
        this.addresses.member2,
        'moderator',
        this.addresses.member1
      );
      throw new Error('Member should not be able to assign roles');
    } catch (error) {
      if (!error.message.includes('does not have permission')) {
        throw error;
      }
    }

    // Test admin trying to assign owner role (should fail)
    try {
      await roleManager.assignRole(
        this.testClanAddress,
        this.addresses.member1,
        'owner',
        this.addresses.admin1
      );
      throw new Error('Admin should not be able to assign owner role');
    } catch (error) {
      if (!error.message.includes('cannot assign')) {
        throw error;
      }
    }

    // Test assigning role to same user twice (should fail)
    try {
      await roleManager.assignRole(
        this.testClanAddress,
        this.addresses.admin1,
        'admin',
        this.addresses.owner
      );
      throw new Error('Should not be able to assign same role twice');
    } catch (error) {
      if (!error.message.includes('already has role')) {
        throw error;
      }
    }
  }

  async testMultiAdminApproval(roleManager) {
    // Setup with multiple admins
    await roleManager.initializeClanRoles(this.testClanAddress, this.addresses.owner);
    await roleManager.assignRole(this.testClanAddress, this.addresses.admin1, 'admin', this.addresses.owner);
    await roleManager.assignRole(this.testClanAddress, this.addresses.admin2, 'admin', this.addresses.owner);
    await roleManager.assignRole(this.testClanAddress, this.addresses.member1, 'member', this.addresses.admin1);

    // Test admin role assignment (requires owner approval)
    const adminRequest = await roleManager.assignRole(
      this.testClanAddress,
      this.addresses.member1,
      'admin',
      this.addresses.admin1,
      { reason: 'Promote to admin' }
    );

    if (!adminRequest.requiresApproval) {
      throw new Error('Admin role assignment should require approval');
    }

    const requestId = adminRequest.requestId;
    const request = roleManager.pendingRoleChanges.get(requestId);

    if (!request || request.status !== 'pending') {
      throw new Error('Role change request not properly created');
    }

    // Test admin approval (should not be sufficient)
    const adminApproval = await roleManager.processRoleChangeRequest(
      requestId,
      'approve',
      this.addresses.admin2,
      'Approved by admin2'
    );

    if (adminApproval.finalDecision) {
      throw new Error('Admin approval alone should not finalize admin role assignment');
    }

    // Test owner approval (should finalize)
    const ownerApproval = await roleManager.processRoleChangeRequest(
      requestId,
      'approve',
      this.addresses.owner,
      'Approved by owner'
    );

    if (ownerApproval.finalDecision !== 'approved') {
      throw new Error('Owner approval should finalize admin role assignment');
    }

    // Verify role was assigned
    const newAdminRole = await roleManager.getUserRole(this.testClanAddress, this.addresses.member1);
    if (!newAdminRole || newAdminRole.role !== 'admin') {
      throw new Error('Admin role not assigned after approval process');
    }
  }

  async testRolePromotionDemotion(roleManager) {
    // Setup
    await roleManager.initializeClanRoles(this.testClanAddress, this.addresses.owner);
    await roleManager.assignRole(this.testClanAddress, this.addresses.admin1, 'admin', this.addresses.owner);
    await roleManager.assignRole(this.testClanAddress, this.addresses.member1, 'member', this.addresses.admin1);

    // Test promotion: member -> moderator
    const promotion = await roleManager.assignRole(
      this.testClanAddress,
      this.addresses.member1,
      'moderator',
      this.addresses.admin1,
      { reason: 'Promoting good member' }
    );

    if (!promotion.success) {
      throw new Error('Promotion failed');
    }

    const promotedRole = await roleManager.getUserRole(this.testClanAddress, this.addresses.member1);
    if (!promotedRole || promotedRole.role !== 'moderator') {
      throw new Error('Member not promoted to moderator');
    }

    // Test demotion: moderator -> member
    const demotion = await roleManager.assignRole(
      this.testClanAddress,
      this.addresses.member1,
      'member',
      this.addresses.admin1,
      { reason: 'Demoting for testing', isDemotion: true }
    );

    if (!demotion.success) {
      throw new Error('Demotion failed');
    }

    const demotedRole = await roleManager.getUserRole(this.testClanAddress, this.addresses.member1);
    if (!demotedRole || demotedRole.role !== 'member') {
      throw new Error('Moderator not demoted to member');
    }

    // Verify role history
    const history = roleManager.getRoleHistory(this.testClanAddress, this.addresses.member1);
    if (history.length < 2) {
      throw new Error('Role history not properly maintained');
    }
  }

  async testOwnershipTransfer(roleManager) {
    // Setup
    await roleManager.initializeClanRoles(this.testClanAddress, this.addresses.owner);
    await roleManager.assignRole(this.testClanAddress, this.addresses.admin1, 'admin', this.addresses.owner);

    // Test ownership transfer
    const transfer = await roleManager.transferOwnership(
      this.testClanAddress,
      this.addresses.admin1,
      this.addresses.owner,
      { reason: 'Test ownership transfer' }
    );

    if (!transfer.success) {
      throw new Error('Ownership transfer failed');
    }

    // Verify new owner
    const newOwnerRole = await roleManager.getUserRole(this.testClanAddress, this.addresses.admin1);
    if (!newOwnerRole || newOwnerRole.role !== 'owner') {
      throw new Error('New owner role not assigned');
    }

    // Verify previous owner demoted to admin
    const previousOwnerRole = await roleManager.getUserRole(this.testClanAddress, this.addresses.owner);
    if (!previousOwnerRole || previousOwnerRole.role !== 'admin') {
      throw new Error('Previous owner not demoted to admin');
    }

    // Test that only new owner can transfer ownership
    try {
      await roleManager.transferOwnership(
        this.testClanAddress,
        this.addresses.owner,
        this.addresses.admin1
      );
      throw new Error('Previous owner should not be able to transfer ownership');
    } catch (error) {
      if (!error.message.includes('Only current owner')) {
        throw error;
      }
    }
  }

  async testOperationSpecificPermissions(roleManager) {
    // Setup
    await roleManager.initializeClanRoles(this.testClanAddress, this.addresses.owner);
    await roleManager.assignRole(this.testClanAddress, this.addresses.admin1, 'admin', this.addresses.owner);
    await roleManager.assignRole(this.testClanAddress, this.addresses.mod1, 'moderator', this.addresses.admin1);
    await roleManager.assignRole(this.testClanAddress, this.addresses.member1, 'member', this.addresses.admin1);

    // Test admin can kick member
    const adminKickMember = await roleManager.hasPermission(
      this.testClanAddress,
      this.addresses.admin1,
      'kick_members',
      { type: 'kick_member', params: [this.addresses.member1] }
    );

    if (!adminKickMember.allowed) {
      throw new Error('Admin should be able to kick member');
    }

    // Test moderator cannot kick admin
    const modKickAdmin = await roleManager.hasPermission(
      this.testClanAddress,
      this.addresses.mod1,
      'kick_members',
      { type: 'kick_member', params: [this.addresses.admin1] }
    );

    if (modKickAdmin.allowed) {
      throw new Error('Moderator should not be able to kick admin');
    }

    // Test member cannot kick anyone
    const memberKickMod = await roleManager.hasPermission(
      this.testClanAddress,
      this.addresses.member1,
      'kick_members',
      { type: 'kick_member', params: [this.addresses.mod1] }
    );

    if (memberKickMod.allowed) {
      throw new Error('Member should not be able to kick moderator');
    }
  }

  async testCustomClanPermissions(roleManager) {
    // Setup
    await roleManager.initializeClanRoles(this.testClanAddress, this.addresses.owner);
    await roleManager.assignRole(this.testClanAddress, this.addresses.admin1, 'admin', this.addresses.owner);

    // Set custom permissions
    const customConfig = {
      restrictions: {
        'admin_manage_treasury': {
          allowed: false,
          reason: 'Treasury management restricted to owner only'
        }
      },
      customRoles: {},
      specialPermissions: {}
    };

    roleManager.setCustomClanPermissions(this.testClanAddress, customConfig, this.addresses.owner);

    // Test that admin no longer has treasury permission due to custom restriction
    const adminTreasuryCheck = await roleManager.hasPermission(
      this.testClanAddress,
      this.addresses.admin1,
      'manage_treasury'
    );

    if (adminTreasuryCheck.allowed) {
      throw new Error('Custom restriction should prevent admin treasury access');
    }

    if (!adminTreasuryCheck.customRestriction) {
      throw new Error('Permission denial should be marked as custom restriction');
    }

    // Verify owner still has access (override custom restrictions)
    const ownerTreasuryCheck = await roleManager.hasPermission(
      this.testClanAddress,
      this.addresses.owner,
      'manage_treasury'
    );

    if (!ownerTreasuryCheck.allowed) {
      throw new Error('Owner should retain treasury access despite custom restrictions');
    }
  }

  async testRateLimiting(roleManager) {
    // Setup
    await roleManager.initializeClanRoles(this.testClanAddress, this.addresses.owner);
    
    // Test rate limiting by making multiple role assignments quickly
    const limit = ROLE_ASSIGNMENT_CONFIG.RATE_LIMITS.ROLE_ASSIGNMENTS_PER_DAY;
    
    // Make assignments up to limit
    for (let i = 0; i < limit; i++) {
      const memberAddress = `member${i}123456789abcdefghij`;
      await roleManager.assignRole(
        this.testClanAddress,
        memberAddress,
        'member',
        this.addresses.owner,
        { reason: `Rate limit test ${i}` }
      );
    }

    // Next assignment should be rate limited
    try {
      await roleManager.assignRole(
        this.testClanAddress,
        'overlimit123456789abcdefghij',
        'member',
        this.addresses.owner,
        { reason: 'Should be rate limited' }
      );
      throw new Error('Rate limiting should prevent this assignment');
    } catch (error) {
      if (!error.message.includes('Rate limit exceeded')) {
        throw error;
      }
    }
  }

  async testEmergencyOverride(roleManager) {
    // Setup
    await roleManager.initializeClanRoles(this.testClanAddress, this.addresses.owner);

    // Test emergency override
    const override = await roleManager.emergencyOverride(
      this.testClanAddress,
      'bypass_role_restrictions',
      this.addresses.owner,
      'Testing emergency override functionality'
    );

    if (!override.success || !override.override) {
      throw new Error('Emergency override failed');
    }

    // Test non-owner cannot use emergency override
    try {
      await roleManager.emergencyOverride(
        this.testClanAddress,
        'unauthorized_override',
        this.addresses.admin1,
        'Should fail'
      );
      throw new Error('Non-owner should not be able to use emergency override');
    } catch (error) {
      if (!error.message.includes('requires clan ownership')) {
        throw error;
      }
    }

    // Verify emergency override is logged in audit trail
    const auditTrail = roleManager.getRoleAuditTrail(this.testClanAddress);
    const overrideEntry = auditTrail.find(entry => entry.action === 'emergency_override');
    
    if (!overrideEntry) {
      throw new Error('Emergency override not logged in audit trail');
    }
  }

  async testClanManagementIntegration(clanManager, roleManager) {
    // Test integration with clan management system
    
    // Mock clan data
    const mockClan = {
      id: this.testClanAddress,
      name: 'Test Integration Clan',
      owner: this.addresses.owner,
      members: [this.addresses.owner],
      admins: [],
      moderators: [],
      tier: 'bronze',
      maxMembers: 20
    };

    // Set up clan in clan manager
    clanManager.clanCache.set(this.testClanAddress, mockClan);

    // Initialize roles
    await roleManager.initializeClanRoles(this.testClanAddress, this.addresses.owner);

    // Test role assignment updates clan member lists
    await roleManager.assignRole(this.testClanAddress, this.addresses.admin1, 'admin', this.addresses.owner);
    
    // Verify role manager has correct role data
    const adminRole = await roleManager.getUserRole(this.testClanAddress, this.addresses.admin1);
    if (!adminRole || adminRole.role !== 'admin') {
      throw new Error('Role assignment not properly integrated');
    }

    // Test clan member retrieval
    const clanMembers = roleManager.getClanMembers(this.testClanAddress);
    if (clanMembers.length !== 2) { // owner + admin
      throw new Error('Clan members not properly tracked');
    }

    const ownerMember = clanMembers.find(m => m.address === this.addresses.owner);
    const adminMember = clanMembers.find(m => m.address === this.addresses.admin1);

    if (!ownerMember || ownerMember.role !== 'owner') {
      throw new Error('Owner not properly listed in clan members');
    }

    if (!adminMember || adminMember.role !== 'admin') {
      throw new Error('Admin not properly listed in clan members');
    }
  }

  async testInvitationSystemIntegration(clanManager, roleManager) {
    // Test integration with invitation system
    const invitationManager = new ClanInvitationManager(
      new MockWalletAdapter(this.addresses.owner),
      clanManager
    );

    // Setup
    await roleManager.initializeClanRoles(this.testClanAddress, this.addresses.owner);

    // Test role-based invitation permissions
    const ownerPermCheck = await roleManager.hasPermission(
      this.testClanAddress,
      this.addresses.owner,
      'manage_invitations'
    );

    if (!ownerPermCheck.allowed) {
      throw new Error('Owner should have invitation management permissions');
    }

    // Add admin and test admin invitation permissions
    await roleManager.assignRole(this.testClanAddress, this.addresses.admin1, 'admin', this.addresses.owner);

    const adminPermCheck = await roleManager.hasPermission(
      this.testClanAddress,
      this.addresses.admin1,
      'manage_invitations'
    );

    if (!adminPermCheck.allowed) {
      throw new Error('Admin should have invitation management permissions');
    }

    // Test member lacks invitation permissions
    await roleManager.assignRole(this.testClanAddress, this.addresses.member1, 'member', this.addresses.admin1);

    const memberPermCheck = await roleManager.hasPermission(
      this.testClanAddress,
      this.addresses.member1,
      'manage_invitations'
    );

    if (memberPermCheck.allowed) {
      throw new Error('Member should not have invitation management permissions');
    }

    // Test role assignment through invitation acceptance
    // This would normally be handled by the invitation system calling role assignment
    const inviteeRole = 'member';
    const invitationResult = await roleManager.assignRole(
      this.testClanAddress,
      this.addresses.member2,
      inviteeRole,
      this.addresses.admin1,
      { 
        reason: 'Joined via invitation',
        source: 'invitation_system',
        invitationId: 'test_inv_123'
      }
    );

    if (!invitationResult.success) {
      throw new Error('Role assignment via invitation failed');
    }
  }

  testUtilityFunctions() {
    // Test role display info
    const ownerInfo = this.getRoleDisplayInfo('owner');
    if (!ownerInfo || ownerInfo.name !== 'Clan Owner') {
      throw new Error('getRoleDisplayInfo not working correctly');
    }

    // Test permission display info  
    const editClanInfo = this.getPermissionDisplayInfo('edit_clan');
    if (!editClanInfo || editClanInfo.name !== 'Edit Clan Settings') {
      throw new Error('getPermissionDisplayInfo not working correctly');
    }

    // Test role assignment validation
    const validData = {
      clanAddress: this.testClanAddress,
      targetUser: this.addresses.member1,
      role: 'member',
      assignerAddress: this.addresses.owner
    };

    const validation = this.validateRoleAssignmentData(validData);
    if (!validation.isValid) {
      throw new Error('Valid role assignment data should pass validation');
    }

    const invalidData = { ...validData, role: 'invalid_role' };
    const invalidValidation = this.validateRoleAssignmentData(invalidData);
    if (invalidValidation.isValid) {
      throw new Error('Invalid role assignment data should fail validation');
    }

    // Test role hierarchy order
    const hierarchyOrder = this.getRoleHierarchyOrder();
    if (hierarchyOrder[0].id !== 'owner' || hierarchyOrder[hierarchyOrder.length - 1].id !== 'recruit') {
      throw new Error('Role hierarchy order incorrect');
    }
  }

  async testPerformance(roleManager) {
    // Test performance with large role sets
    await roleManager.initializeClanRoles(this.testClanAddress, this.addresses.owner);

    const startTime = Date.now();
    
    // Create many role assignments
    const testMemberCount = 100;
    const assignments = [];
    
    for (let i = 0; i < testMemberCount; i++) {
      const memberAddress = `perf_member_${i}_${'x'.repeat(20)}`;
      assignments.push(roleManager.assignRole(
        this.testClanAddress,
        memberAddress,
        'member',
        this.addresses.owner,
        { reason: `Performance test member ${i}` }
      ));
    }

    await Promise.all(assignments);
    
    const assignmentTime = Date.now() - startTime;
    
    // Test permission checking performance
    const permissionStartTime = Date.now();
    const permissionChecks = [];
    
    for (let i = 0; i < testMemberCount; i++) {
      const memberAddress = `perf_member_${i}_${'x'.repeat(20)}`;
      permissionChecks.push(roleManager.hasPermission(
        this.testClanAddress,
        memberAddress,
        'chat_participation'
      ));
    }

    await Promise.all(permissionChecks);
    
    const permissionTime = Date.now() - permissionStartTime;

    console.log(`Performance Test Results:`);
    console.log(`- ${testMemberCount} role assignments: ${assignmentTime}ms (${assignmentTime/testMemberCount}ms avg)`);
    console.log(`- ${testMemberCount} permission checks: ${permissionTime}ms (${permissionTime/testMemberCount}ms avg)`);

    // Performance thresholds (adjust as needed)
    if (assignmentTime / testMemberCount > 50) {
      throw new Error(`Role assignment too slow: ${assignmentTime/testMemberCount}ms per assignment`);
    }

    if (permissionTime / testMemberCount > 10) {
      throw new Error(`Permission checking too slow: ${permissionTime/testMemberCount}ms per check`);
    }
  }

  // Utility function implementations for testing
  getRoleDisplayInfo(roleId) {
    const role = CLAN_ROLE_HIERARCHY[roleId.toUpperCase()];
    if (!role) return null;

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

  getPermissionDisplayInfo(permissionId) {
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

  validateRoleAssignmentData(assignmentData) {
    const validation = {
      isValid: false,
      errors: [],
      warnings: []
    };

    const { clanAddress, targetUser, role, assignerAddress } = assignmentData;

    if (!clanAddress) validation.errors.push('Clan address is required');
    if (!targetUser) validation.errors.push('Target user address is required');
    if (!role) validation.errors.push('Role is required');
    if (!assignerAddress) validation.errors.push('Assigner address is required');

    if (role && !CLAN_ROLE_HIERARCHY[role.toUpperCase()]) {
      validation.errors.push('Invalid role specified');
    }

    validation.isValid = validation.errors.length === 0;
    return validation;
  }

  getRoleHierarchyOrder() {
    return Object.values(CLAN_ROLE_HIERARCHY)
      .sort((a, b) => b.priority - a.priority)
      .map(role => ({
        id: role.id,
        name: role.name,
        priority: role.priority
      }));
  }

  printTestSummary() {
    console.log('\n📊 Test Summary:');
    console.log('================');
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const total = this.testResults.length;

    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.filter(r => r.status === 'FAIL').forEach(test => {
        console.log(`  - ${test.name}: ${test.error}`);
      });
    }

    const avgDuration = this.testResults
      .filter(r => r.duration)
      .reduce((sum, r) => sum + r.duration, 0) / passed;
    
    console.log(`\nAverage Test Duration: ${avgDuration.toFixed(1)}ms`);
    
    console.log('\n🎉 Clan Roles and Permissions Test Suite Complete!');
  }
}

// Export test suite for external use
export { ClanRoleTestSuite };

// Run tests if this file is executed directly
if (typeof process !== 'undefined' && process.argv && process.argv[1] && process.argv[1].includes('test-clan-roles.js')) {
  const testSuite = new ClanRoleTestSuite();
  testSuite.runAllTests().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}