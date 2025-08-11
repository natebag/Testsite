/**
 * MLG.clan Invitation System Test Suite
 * 
 * Comprehensive tests for clan member invitation and approval system
 * covering all invitation methods, approval workflows, and edge cases.
 * 
 * Test Categories:
 * - Direct Invitations
 * - Invitation Links  
 * - Join Requests
 * - Bulk Invitations
 * - Permission Validation
 * - Rate Limiting
 * - Capacity Management
 * - Security Features
 * - Notification System
 * - Audit Trail
 * 
 * @author Claude Code - Testing Specialist
 * @version 1.0.0
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PublicKey } from '@solana/web3.js';

// Mock dependencies
jest.mock('../../config/solana-config.js', () => ({
  createMLGTokenConnection: jest.fn(() => ({
    getLatestBlockhash: jest.fn(),
    sendRawTransaction: jest.fn(),
    confirmTransaction: jest.fn()
  })),
  MLG_TOKEN_CONFIG: {
    DECIMALS: 9,
    SYMBOL: 'MLG'
  },
  TOKEN_PROGRAMS: {
    MLG_TOKEN_MINT: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL'
  }
}));

jest.mock('./clan-management.js', () => ({
  CLAN_TIER_CONFIG: {
    BRONZE: { id: 'bronze', maxMembers: 20, minStake: 100 },
    SILVER: { id: 'silver', maxMembers: 50, minStake: 500 },
    GOLD: { id: 'gold', maxMembers: 100, minStake: 1000 },
    DIAMOND: { id: 'diamond', maxMembers: 250, minStake: 5000 }
  },
  CLAN_ROLES: {
    OWNER: { id: 'owner', permissions: ['all'], priority: 1000 },
    ADMIN: { id: 'admin', permissions: ['manage_members', 'edit_clan'], priority: 900 },
    MODERATOR: { id: 'moderator', permissions: ['kick_members'], priority: 800 },
    MEMBER: { id: 'member', permissions: ['chat'], priority: 100 }
  },
  CLAN_CONFIG: {
    NAME_MIN_LENGTH: 3,
    NAME_MAX_LENGTH: 32
  }
}));

import {
  ClanInvitationManager,
  INVITATION_CONFIG,
  INVITATION_TYPES,
  INVITATION_STATUS,
  formatInvitation,
  formatJoinRequest,
  validateInvitationToken,
  generateInvitationUrl,
  getExpiryOptions
} from './clan-invitations.js';

// Mock wallet adapter
const createMockWalletAdapter = (publicKeyString) => ({
  publicKey: new PublicKey(publicKeyString),
  signTransaction: jest.fn(),
  connected: true
});

// Mock clan manager
const createMockClanManager = () => ({
  getClan: jest.fn(),
  addMember: jest.fn(),
  removeMember: jest.fn()
});

// Test data
const TEST_ADDRESSES = {
  CLAN_OWNER: '11111111111111111111111111111112',
  CLAN_ADMIN: '11111111111111111111111111111113',
  CLAN_MEMBER: '11111111111111111111111111111114',
  TARGET_USER: '11111111111111111111111111111115',
  EXTERNAL_USER: '11111111111111111111111111111116',
  CLAN_ADDRESS: '22222222222222222222222222222222'
};

const MOCK_CLAN = {
  id: TEST_ADDRESSES.CLAN_ADDRESS,
  name: 'Test Clan',
  owner: TEST_ADDRESSES.CLAN_OWNER,
  admins: [TEST_ADDRESSES.CLAN_ADMIN],
  moderators: [],
  members: [
    TEST_ADDRESSES.CLAN_OWNER,
    TEST_ADDRESSES.CLAN_ADMIN,
    TEST_ADDRESSES.CLAN_MEMBER
  ],
  memberCount: 3,
  maxMembers: 20,
  tier: 'bronze',
  status: 'active'
};

describe('ClanInvitationManager', () => {
  let invitationManager;
  let mockWalletAdapter;
  let mockClanManager;

  beforeEach(() => {
    mockWalletAdapter = createMockWalletAdapter(TEST_ADDRESSES.CLAN_OWNER);
    mockClanManager = createMockClanManager();
    
    // Create clan data with consistent address format
    const mockClanData = {
      ...MOCK_CLAN,
      owner: mockWalletAdapter.publicKey.toString(),
      members: [
        mockWalletAdapter.publicKey.toString(),
        TEST_ADDRESSES.CLAN_ADMIN,
        TEST_ADDRESSES.CLAN_MEMBER
      ]
    };
    
    // Setup clan manager mock responses
    mockClanManager.getClan.mockResolvedValue(mockClanData);
    mockClanManager.addMember.mockResolvedValue({ success: true });
    
    invitationManager = new ClanInvitationManager(mockWalletAdapter, mockClanManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with wallet adapter and clan manager', () => {
      expect(invitationManager.walletAdapter).toBe(mockWalletAdapter);
      expect(invitationManager.clanManager).toBe(mockClanManager);
      expect(invitationManager.invitations).toBeInstanceOf(Map);
      expect(invitationManager.joinRequests).toBeInstanceOf(Map);
    });

    test('should initialize empty data structures', () => {
      expect(invitationManager.invitations.size).toBe(0);
      expect(invitationManager.userInvitations.size).toBe(0);
      expect(invitationManager.clanInvitations.size).toBe(0);
      expect(invitationManager.joinRequests.size).toBe(0);
    });
  });

  describe('Token Generation', () => {
    test('should generate secure invitation tokens', () => {
      const token1 = invitationManager.generateInvitationToken();
      const token2 = invitationManager.generateInvitationToken();
      
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(INVITATION_CONFIG.TOKEN_LENGTH * 2); // Hex representation
    });

    test('should generate unique invitation IDs', () => {
      const id1 = invitationManager.generateInvitationId(TEST_ADDRESSES.CLAN_ADDRESS, TEST_ADDRESSES.TARGET_USER);
      const id2 = invitationManager.generateInvitationId(TEST_ADDRESSES.CLAN_ADDRESS, TEST_ADDRESSES.TARGET_USER);
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1).toContain('inv_');
    });
  });

  describe('Permission Validation', () => {
    test('should validate clan owner permissions', async () => {
      const result = await invitationManager.checkInvitationPermissions(
        TEST_ADDRESSES.CLAN_ADDRESS,
        mockWalletAdapter.publicKey.toString(),
        'invite'
      );

      expect(result.allowed).toBe(true);
      expect(result.role).toBe('owner');
      expect(result.permissions).toContain('all');
    });

    test('should validate clan admin permissions', async () => {
      const result = await invitationManager.checkInvitationPermissions(
        TEST_ADDRESSES.CLAN_ADDRESS,
        TEST_ADDRESSES.CLAN_ADMIN,
        'invite'
      );

      expect(result.allowed).toBe(true);
      expect(result.role).toBe('admin');
      expect(result.permissions).toContain('manage_members');
    });

    test('should reject non-member permissions', async () => {
      const result = await invitationManager.checkInvitationPermissions(
        TEST_ADDRESSES.CLAN_ADDRESS,
        TEST_ADDRESSES.EXTERNAL_USER,
        'invite'
      );

      expect(result.allowed).toBe(false);
      expect(result.error).toContain('not a clan member');
    });

    test('should reject insufficient permissions', async () => {
      const result = await invitationManager.checkInvitationPermissions(
        TEST_ADDRESSES.CLAN_ADDRESS,
        TEST_ADDRESSES.CLAN_MEMBER,
        'invite'
      );

      expect(result.allowed).toBe(false);
      expect(result.error).toContain('Insufficient permissions');
    });
  });

  describe('Rate Limiting', () => {
    test('should allow actions within rate limits', () => {
      const result = invitationManager.checkRateLimit(
        TEST_ADDRESSES.CLAN_OWNER,
        'INVITATIONS_PER_MINUTE'
      );

      expect(result.allowed).toBe(true);
    });

    test('should enforce rate limits', () => {
      const userAddress = TEST_ADDRESSES.CLAN_OWNER;
      const action = 'INVITATIONS_PER_MINUTE';
      const limit = INVITATION_CONFIG.RATE_LIMITS.INVITATIONS_PER_MINUTE;

      // Exhaust rate limit
      for (let i = 0; i < limit; i++) {
        invitationManager.updateRateLimit(userAddress, action);
      }

      const result = invitationManager.checkRateLimit(userAddress, action);
      expect(result.allowed).toBe(false);
      expect(result.remainingTime).toBeGreaterThan(0);
    });

    test('should reset rate limits after time window', () => {
      const userAddress = TEST_ADDRESSES.CLAN_OWNER;
      const action = 'INVITATIONS_PER_MINUTE';
      
      // Set up expired rate limit
      const expiredTime = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago
      invitationManager.rateLimits.set(`${userAddress}_${action}`, {
        count: 10,
        resetTime: expiredTime
      });

      const result = invitationManager.checkRateLimit(userAddress, action);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Clan Capacity Management', () => {
    test('should validate available clan capacity', async () => {
      const result = await invitationManager.checkClanCapacity(TEST_ADDRESSES.CLAN_ADDRESS, 1);

      expect(result.hasCapacity).toBe(true);
      expect(result.currentMembers).toBe(3);
      expect(result.maxMembers).toBe(20);
      expect(result.availableSlots).toBe(17);
    });

    test('should reject when at capacity', async () => {
      // Mock clan at capacity
      const fullClan = { ...MOCK_CLAN, memberCount: 20, maxMembers: 20 };
      mockClanManager.getClan.mockResolvedValueOnce(fullClan);

      const result = await invitationManager.checkClanCapacity(TEST_ADDRESSES.CLAN_ADDRESS, 1);

      expect(result.hasCapacity).toBe(false);
      expect(result.availableSlots).toBe(0);
    });

    test('should account for pending invitations', async () => {
      // Add some pending invitations
      const inviteId = 'test-invite-1';
      const invitation = {
        id: inviteId,
        clanAddress: TEST_ADDRESSES.CLAN_ADDRESS,
        status: INVITATION_STATUS.PENDING
      };
      
      invitationManager.invitations.set(inviteId, invitation);
      invitationManager.clanInvitations.set(TEST_ADDRESSES.CLAN_ADDRESS, [inviteId]);

      const result = await invitationManager.checkClanCapacity(TEST_ADDRESSES.CLAN_ADDRESS, 1);

      expect(result.pendingInvites).toBe(1);
      expect(result.totalNeeded).toBe(2); // 1 new + 1 pending
    });
  });

  describe('Direct Invitations', () => {
    test('should send direct invitation successfully', async () => {
      const invitationData = {
        clanAddress: TEST_ADDRESSES.CLAN_ADDRESS,
        targetUser: TEST_ADDRESSES.TARGET_USER,
        role: 'member',
        message: 'Welcome to our clan!',
        type: 'direct'
      };

      const result = await invitationManager.sendDirectInvitation(invitationData);

      expect(result.success).toBe(true);
      expect(result.invitation).toBeDefined();
      expect(result.invitationId).toBeDefined();
      expect(result.invitation.targetUser).toBe(TEST_ADDRESSES.TARGET_USER);
      expect(result.invitation.role).toBe('member');
      expect(result.invitation.status).toBe(INVITATION_STATUS.PENDING);
    });

    test('should reject invitation to existing member', async () => {
      const invitationData = {
        clanAddress: TEST_ADDRESSES.CLAN_ADDRESS,
        targetUser: TEST_ADDRESSES.CLAN_MEMBER, // Already a member
        role: 'member',
        type: 'direct'
      };

      await expect(invitationManager.sendDirectInvitation(invitationData))
        .rejects.toThrow('already a member');
    });

    test('should reject duplicate pending invitations', async () => {
      const invitationData = {
        clanAddress: TEST_ADDRESSES.CLAN_ADDRESS,
        targetUser: TEST_ADDRESSES.TARGET_USER,
        role: 'member',
        type: 'direct'
      };

      // Send first invitation
      await invitationManager.sendDirectInvitation(invitationData);

      // Try to send duplicate
      await expect(invitationManager.sendDirectInvitation(invitationData))
        .rejects.toThrow('pending invitation');
    });

    test('should enforce invitation limits by role', async () => {
      // Create separate invitation manager with clan member wallet
      const memberWalletAdapter = createMockWalletAdapter(TEST_ADDRESSES.CLAN_MEMBER);
      const memberInvitationManager = new ClanInvitationManager(memberWalletAdapter, mockClanManager);

      const invitationData = {
        clanAddress: TEST_ADDRESSES.CLAN_ADDRESS,
        targetUser: TEST_ADDRESSES.TARGET_USER,
        role: 'member',
        type: 'direct'
      };

      await expect(memberInvitationManager.sendDirectInvitation(invitationData))
        .rejects.toThrow('Insufficient permissions');
    });
  });

  describe('Invitation Links', () => {
    test('should create invitation link successfully', async () => {
      const linkData = {
        clanAddress: TEST_ADDRESSES.CLAN_ADDRESS,
        role: 'member',
        maxUses: 5,
        requireApproval: false,
        message: 'Join our gaming clan!'
      };

      const result = await invitationManager.createInvitationLink(linkData);

      expect(result.success).toBe(true);
      expect(result.inviteLink).toBeDefined();
      expect(result.linkToken).toBeDefined();
      expect(result.linkUrl).toContain('/clan/join/');
      expect(result.inviteLink.maxUses).toBe(5);
      expect(result.inviteLink.currentUses).toBe(0);
    });

    test('should use invitation link successfully', async () => {
      // Create invitation link first
      const linkData = {
        clanAddress: TEST_ADDRESSES.CLAN_ADDRESS,
        role: 'member',
        maxUses: 1,
        requireApproval: false
      };

      const linkResult = await invitationManager.createInvitationLink(linkData);
      const linkToken = linkResult.linkToken;

      // Use the link
      const result = await invitationManager.useInvitationLink(
        linkToken,
        TEST_ADDRESSES.TARGET_USER
      );

      expect(result.success).toBe(true);
      expect(result.requiresApproval).toBe(false);
      expect(result.membershipResult).toBeDefined();
      expect(mockClanManager.addMember).toHaveBeenCalledWith(
        expect.any(PublicKey),
        expect.any(PublicKey),
        'member'
      );
    });

    test('should create join request for approval-required links', async () => {
      // Create approval-required link
      const linkData = {
        clanAddress: TEST_ADDRESSES.CLAN_ADDRESS,
        role: 'member',
        maxUses: 1,
        requireApproval: true
      };

      const linkResult = await invitationManager.createInvitationLink(linkData);
      const linkToken = linkResult.linkToken;

      // Use the link
      const result = await invitationManager.useInvitationLink(
        linkToken,
        TEST_ADDRESSES.TARGET_USER
      );

      expect(result.success).toBe(true);
      expect(result.requiresApproval).toBe(true);
      expect(result.joinRequest).toBeDefined();
      expect(mockClanManager.addMember).not.toHaveBeenCalled();
    });

    test('should reject expired invitation links', async () => {
      // Create expired link
      const expiredDate = new Date(Date.now() - 1000).toISOString();
      const linkData = {
        clanAddress: TEST_ADDRESSES.CLAN_ADDRESS,
        role: 'member',
        maxUses: 1,
        expiresAt: expiredDate
      };

      const linkResult = await invitationManager.createInvitationLink(linkData);
      const linkToken = linkResult.linkToken;

      await expect(invitationManager.useInvitationLink(linkToken, TEST_ADDRESSES.TARGET_USER))
        .rejects.toThrow('expired');
    });

    test('should reject links at usage limit', async () => {
      // Create single-use link
      const linkData = {
        clanAddress: TEST_ADDRESSES.CLAN_ADDRESS,
        role: 'member',
        maxUses: 1,
        requireApproval: false
      };

      const linkResult = await invitationManager.createInvitationLink(linkData);
      const linkToken = linkResult.linkToken;

      // Use the link once
      await invitationManager.useInvitationLink(linkToken, TEST_ADDRESSES.TARGET_USER);

      // Try to use again
      await expect(invitationManager.useInvitationLink(linkToken, TEST_ADDRESSES.EXTERNAL_USER))
        .rejects.toThrow('maximum usage');
    });
  });

  describe('Join Requests', () => {
    test('should create join request successfully', async () => {
      const requestData = {
        clanAddress: TEST_ADDRESSES.CLAN_ADDRESS,
        userAddress: TEST_ADDRESSES.TARGET_USER,
        message: 'I would like to join your clan',
        requestedRole: 'member'
      };

      const result = await invitationManager.createJoinRequest(requestData);

      expect(result.success).toBe(true);
      expect(result.joinRequest).toBeDefined();
      expect(result.requestId).toBeDefined();
      expect(result.joinRequest.status).toBe('pending');
      expect(result.joinRequest.requiredApprovals).toBe(1);
    });

    test('should reject duplicate join requests', async () => {
      const requestData = {
        clanAddress: TEST_ADDRESSES.CLAN_ADDRESS,
        userAddress: TEST_ADDRESSES.TARGET_USER,
        message: 'Please let me join',
        requestedRole: 'member'
      };

      // Create first request
      await invitationManager.createJoinRequest(requestData);

      // Try to create duplicate
      await expect(invitationManager.createJoinRequest(requestData))
        .rejects.toThrow('pending join request');
    });

    test('should approve join request successfully', async () => {
      // Create join request
      const requestData = {
        clanAddress: TEST_ADDRESSES.CLAN_ADDRESS,
        userAddress: TEST_ADDRESSES.TARGET_USER,
        requestedRole: 'member'
      };

      const requestResult = await invitationManager.createJoinRequest(requestData);
      const requestId = requestResult.requestId;

      // Approve the request
      const approvalResult = await invitationManager.processJoinRequest(
        requestId,
        'approve',
        TEST_ADDRESSES.CLAN_OWNER
      );

      expect(approvalResult.success).toBe(true);
      expect(approvalResult.decision).toBe('approve');
      expect(approvalResult.finalDecision).toBe('approved');
      expect(mockClanManager.addMember).toHaveBeenCalledWith(
        expect.any(PublicKey),
        expect.any(PublicKey),
        'member'
      );
    });

    test('should reject join request successfully', async () => {
      // Create join request
      const requestData = {
        clanAddress: TEST_ADDRESSES.CLAN_ADDRESS,
        userAddress: TEST_ADDRESSES.TARGET_USER,
        requestedRole: 'member'
      };

      const requestResult = await invitationManager.createJoinRequest(requestData);
      const requestId = requestResult.requestId;

      // Reject the request
      const rejectionResult = await invitationManager.processJoinRequest(
        requestId,
        'reject',
        TEST_ADDRESSES.CLAN_OWNER
      );

      expect(rejectionResult.success).toBe(true);
      expect(rejectionResult.decision).toBe('reject');
      expect(rejectionResult.finalDecision).toBe('rejected');
      expect(mockClanManager.addMember).not.toHaveBeenCalled();
    });

    test('should require multiple approvals for admin role', async () => {
      const requestData = {
        clanAddress: TEST_ADDRESSES.CLAN_ADDRESS,
        userAddress: TEST_ADDRESSES.TARGET_USER,
        requestedRole: 'admin'
      };

      const requestResult = await invitationManager.createJoinRequest(requestData);
      expect(requestResult.joinRequest.requiredApprovals).toBe(2);

      // First approval
      const firstApproval = await invitationManager.processJoinRequest(
        requestResult.requestId,
        'approve',
        TEST_ADDRESSES.CLAN_OWNER
      );

      expect(firstApproval.finalDecision).toBeNull();
      expect(firstApproval.requiresMoreApprovals).toBe(true);

      // Second approval
      const secondApproval = await invitationManager.processJoinRequest(
        requestResult.requestId,
        'approve',
        TEST_ADDRESSES.CLAN_ADMIN
      );

      expect(secondApproval.finalDecision).toBe('approved');
    });

    test('should prevent duplicate votes from same admin', async () => {
      const requestData = {
        clanAddress: TEST_ADDRESSES.CLAN_ADDRESS,
        userAddress: TEST_ADDRESSES.TARGET_USER,
        requestedRole: 'member'
      };

      const requestResult = await invitationManager.createJoinRequest(requestData);
      const requestId = requestResult.requestId;

      // First vote
      await invitationManager.processJoinRequest(requestId, 'approve', TEST_ADDRESSES.CLAN_OWNER);

      // Try to vote again
      await expect(invitationManager.processJoinRequest(requestId, 'approve', TEST_ADDRESSES.CLAN_OWNER))
        .rejects.toThrow('already voted');
    });
  });

  describe('Bulk Invitations', () => {
    test('should send bulk invitations successfully', async () => {
      const bulkData = {
        clanAddress: TEST_ADDRESSES.CLAN_ADDRESS,
        targetUsers: [TEST_ADDRESSES.TARGET_USER, TEST_ADDRESSES.EXTERNAL_USER],
        role: 'member',
        message: 'Join our gaming community!'
      };

      const result = await invitationManager.sendBulkInvitations(bulkData);

      expect(result.success).toBe(true);
      expect(result.results.total).toBe(2);
      expect(result.results.successful.length).toBe(2);
      expect(result.results.failed.length).toBe(0);
    });

    test('should enforce bulk size limits', async () => {
      // Create separate invitation manager with clan admin wallet
      const adminWalletAdapter = createMockWalletAdapter(TEST_ADDRESSES.CLAN_ADMIN);
      const adminInvitationManager = new ClanInvitationManager(adminWalletAdapter, mockClanManager);

      const adminLimits = INVITATION_CONFIG.INVITATION_LIMITS.ADMIN;
      const tooManyUsers = Array(adminLimits.bulkSize + 1).fill(0).map((_, i) => 
        `1111111111111111111111111111111${i.toString().padStart(2, '0')}`
      );

      const bulkData = {
        clanAddress: TEST_ADDRESSES.CLAN_ADDRESS,
        targetUsers: tooManyUsers,
        role: 'member'
      };

      await expect(adminInvitationManager.sendBulkInvitations(bulkData))
        .rejects.toThrow('Bulk size limit exceeded');
    });

    test('should handle partial failures in bulk invitations', async () => {
      const bulkData = {
        clanAddress: TEST_ADDRESSES.CLAN_ADDRESS,
        targetUsers: [TEST_ADDRESSES.TARGET_USER, TEST_ADDRESSES.CLAN_MEMBER], // Second is already member
        role: 'member'
      };

      const result = await invitationManager.sendBulkInvitations(bulkData);

      expect(result.success).toBe(true);
      expect(result.results.successful.length).toBe(1);
      expect(result.results.failed.length).toBe(1);
      expect(result.results.failed[0].error).toContain('already a member');
    });
  });

  describe('Invitation Management', () => {
    let invitationId;

    beforeEach(async () => {
      // Create a test invitation
      const invitationData = {
        clanAddress: TEST_ADDRESSES.CLAN_ADDRESS,
        targetUser: TEST_ADDRESSES.TARGET_USER,
        role: 'member',
        type: 'direct'
      };

      const result = await invitationManager.sendDirectInvitation(invitationData);
      invitationId = result.invitationId;
    });

    test('should accept invitation successfully', async () => {
      const result = await invitationManager.acceptInvitation(
        invitationId,
        TEST_ADDRESSES.TARGET_USER
      );

      expect(result.success).toBe(true);
      expect(result.invitation.status).toBe(INVITATION_STATUS.ACCEPTED);
      expect(mockClanManager.addMember).toHaveBeenCalled();
    });

    test('should reject invitation successfully', async () => {
      const result = await invitationManager.rejectInvitation(
        invitationId,
        TEST_ADDRESSES.TARGET_USER,
        'Not interested'
      );

      expect(result.success).toBe(true);
      expect(result.invitation.status).toBe(INVITATION_STATUS.REJECTED);
      expect(result.invitation.rejectionReason).toBe('Not interested');
    });

    test('should revoke invitation successfully', async () => {
      const result = await invitationManager.revokeInvitation(
        invitationId,
        TEST_ADDRESSES.CLAN_OWNER,
        'Changed our mind'
      );

      expect(result.success).toBe(true);
      expect(result.invitation.status).toBe(INVITATION_STATUS.REVOKED);
      expect(result.invitation.revocationReason).toBe('Changed our mind');
    });

    test('should prevent non-target user from accepting invitation', async () => {
      await expect(invitationManager.acceptInvitation(invitationId, TEST_ADDRESSES.EXTERNAL_USER))
        .rejects.toThrow('does not belong to this user');
    });

    test('should prevent non-admin from revoking invitation', async () => {
      await expect(invitationManager.revokeInvitation(
        invitationId,
        TEST_ADDRESSES.EXTERNAL_USER,
        'Unauthorized'
      )).rejects.toThrow('Insufficient permissions');
    });
  });

  describe('Data Retrieval', () => {
    beforeEach(async () => {
      // Create test invitations
      await invitationManager.sendDirectInvitation({
        clanAddress: TEST_ADDRESSES.CLAN_ADDRESS,
        targetUser: TEST_ADDRESSES.TARGET_USER,
        role: 'member',
        type: 'direct'
      });

      await invitationManager.createJoinRequest({
        clanAddress: TEST_ADDRESSES.CLAN_ADDRESS,
        userAddress: TEST_ADDRESSES.EXTERNAL_USER,
        requestedRole: 'member'
      });
    });

    test('should get user invitations', () => {
      const invitations = invitationManager.getUserInvitations(TEST_ADDRESSES.TARGET_USER);
      expect(invitations).toHaveLength(1);
      expect(invitations[0].targetUser).toBe(TEST_ADDRESSES.TARGET_USER);
    });

    test('should get clan invitations', () => {
      const invitations = invitationManager.getClanInvitations(TEST_ADDRESSES.CLAN_ADDRESS);
      expect(invitations).toHaveLength(1);
      expect(invitations[0].clanAddress).toBe(TEST_ADDRESSES.CLAN_ADDRESS);
    });

    test('should get clan join requests', () => {
      const requests = invitationManager.getClanJoinRequests(TEST_ADDRESSES.CLAN_ADDRESS);
      expect(requests).toHaveLength(1);
      expect(requests[0].userAddress).toBe(TEST_ADDRESSES.EXTERNAL_USER);
    });

    test('should get clan invitation statistics', () => {
      const stats = invitationManager.getClanInvitationStats(TEST_ADDRESSES.CLAN_ADDRESS);
      expect(stats.totalInvitations).toBe(1);
      expect(stats.pendingInvitations).toBe(1);
      expect(stats.totalJoinRequests).toBe(1);
      expect(stats.pendingJoinRequests).toBe(1);
    });

    test('should filter by status', () => {
      const pendingInvitations = invitationManager.getUserInvitations(
        TEST_ADDRESSES.TARGET_USER,
        INVITATION_STATUS.PENDING
      );
      expect(pendingInvitations).toHaveLength(1);

      const acceptedInvitations = invitationManager.getUserInvitations(
        TEST_ADDRESSES.TARGET_USER,
        INVITATION_STATUS.ACCEPTED
      );
      expect(acceptedInvitations).toHaveLength(0);
    });
  });

  describe('Cleanup and Maintenance', () => {
    test('should clean up expired invitations', async () => {
      // Create expired invitation
      const expiredInvite = {
        id: 'expired-invite',
        clanAddress: TEST_ADDRESSES.CLAN_ADDRESS,
        status: INVITATION_STATUS.PENDING,
        expiresAt: new Date(Date.now() - 1000).toISOString()
      };

      invitationManager.invitations.set('expired-invite', expiredInvite);

      const result = await invitationManager.cleanupExpired();
      expect(result.cleanedCount).toBe(1);
      expect(expiredInvite.status).toBe(INVITATION_STATUS.EXPIRED);
    });

    test('should get audit trail', async () => {
      // Perform some operations to generate audit entries
      await invitationManager.sendDirectInvitation({
        clanAddress: TEST_ADDRESSES.CLAN_ADDRESS,
        targetUser: TEST_ADDRESSES.TARGET_USER,
        role: 'member',
        type: 'direct'
      });
      
      const trail = invitationManager.getAuditTrail();
      expect(Array.isArray(trail)).toBe(true);
      expect(trail.length).toBeGreaterThan(0);
      expect(trail[0]).toHaveProperty('action');
      expect(trail[0]).toHaveProperty('timestamp');
    });

    test('should clear all caches', () => {
      // Add some data first
      invitationManager.invitations.set('test', {});
      invitationManager.joinRequests.set('test', {});

      invitationManager.clearCache();

      expect(invitationManager.invitations.size).toBe(0);
      expect(invitationManager.joinRequests.size).toBe(0);
      expect(invitationManager.auditTrail).toHaveLength(0);
    });
  });
});

describe('Utility Functions', () => {
  describe('formatInvitation', () => {
    test('should format invitation for display', () => {
      const invitation = {
        id: 'test-invite',
        type: INVITATION_TYPES.DIRECT.id,
        clanName: 'Test Clan',
        role: 'member',
        status: INVITATION_STATUS.PENDING,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        message: 'Welcome!',
        senderAddress: TEST_ADDRESSES.CLAN_OWNER,
        targetUser: TEST_ADDRESSES.TARGET_USER
      };

      const formatted = formatInvitation(invitation);

      expect(formatted.id).toBe('test-invite');
      expect(formatted.clanName).toBe('Test Clan');
      expect(formatted.isExpired).toBe(false);
    });

    test('should detect expired invitations', () => {
      const expiredInvitation = {
        id: 'expired-invite',
        type: INVITATION_TYPES.DIRECT.id,
        clanName: 'Test Clan',
        role: 'member',
        status: INVITATION_STATUS.PENDING,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        message: '',
        senderAddress: TEST_ADDRESSES.CLAN_OWNER,
        targetUser: TEST_ADDRESSES.TARGET_USER
      };

      const formatted = formatInvitation(expiredInvitation);
      expect(formatted.isExpired).toBe(true);
    });
  });

  describe('formatJoinRequest', () => {
    test('should format join request for display', () => {
      const request = {
        id: 'test-request',
        clanName: 'Test Clan',
        userAddress: TEST_ADDRESSES.TARGET_USER,
        requestedRole: 'member',
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        message: 'Please let me join',
        approvals: [],
        requiredApprovals: 1,
        source: 'manual'
      };

      const formatted = formatJoinRequest(request);

      expect(formatted.id).toBe('test-request');
      expect(formatted.clanName).toBe('Test Clan');
      expect(formatted.isExpired).toBe(false);
      expect(formatted.approvals).toHaveLength(0);
    });
  });

  describe('validateInvitationToken', () => {
    test('should validate correct token format', () => {
      const validToken = 'a'.repeat(INVITATION_CONFIG.TOKEN_LENGTH * 2);
      expect(validateInvitationToken(validToken)).toBe(true);
    });

    test('should reject invalid token formats', () => {
      expect(validateInvitationToken(null)).toBe(false);
      expect(validateInvitationToken('')).toBe(false);
      expect(validateInvitationToken('short')).toBe(false);
      expect(validateInvitationToken('invalid-chars!')).toBe(false);
    });
  });

  describe('generateInvitationUrl', () => {
    test('should generate correct invitation URL', () => {
      const baseUrl = 'https://example.com';
      const linkToken = 'abcd1234';
      const url = generateInvitationUrl(baseUrl, linkToken);

      expect(url).toBe('https://example.com/clan/join/abcd1234');
    });
  });

  describe('getExpiryOptions', () => {
    test('should provide expiry options', () => {
      const options = getExpiryOptions();

      expect(Array.isArray(options)).toBe(true);
      expect(options.length).toBeGreaterThan(0);
      expect(options[0]).toHaveProperty('id');
      expect(options[0]).toHaveProperty('name');
      expect(options[0]).toHaveProperty('duration');
      expect(options[0]).toHaveProperty('expiresAt');
    });
  });
});

describe('Configuration Validation', () => {
  test('should have valid invitation configuration', () => {
    expect(INVITATION_CONFIG).toBeDefined();
    expect(INVITATION_CONFIG.TOKEN_LENGTH).toBeGreaterThan(0);
    expect(INVITATION_CONFIG.INVITATION_LIMITS).toBeDefined();
    expect(INVITATION_CONFIG.RATE_LIMITS).toBeDefined();
  });

  test('should have valid invitation types', () => {
    expect(INVITATION_TYPES.DIRECT).toBeDefined();
    expect(INVITATION_TYPES.LINK).toBeDefined();
    expect(INVITATION_TYPES.JOIN_REQUEST).toBeDefined();
    expect(INVITATION_TYPES.BULK).toBeDefined();
  });

  test('should have valid invitation statuses', () => {
    expect(INVITATION_STATUS.PENDING).toBeDefined();
    expect(INVITATION_STATUS.ACCEPTED).toBeDefined();
    expect(INVITATION_STATUS.REJECTED).toBeDefined();
    expect(INVITATION_STATUS.EXPIRED).toBeDefined();
    expect(INVITATION_STATUS.REVOKED).toBeDefined();
  });
});

console.log('✅ MLG.clan Invitation System Test Suite - All tests configured');
console.log('📊 Test Coverage: Direct invitations, invite links, join requests, bulk operations');
console.log('🔒 Security Testing: Rate limiting, permissions, capacity management');
console.log('⚡ Integration Testing: Clan management integration, wallet adapter integration');