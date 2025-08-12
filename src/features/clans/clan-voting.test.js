/**
 * Comprehensive Test Suite for Clan Voting System
 * 
 * Tests all aspects of the clan-specific voting pools and tracking system
 * including role-based voting weights, MLG token burning, delegation,
 * proposal management, and governance analytics.
 */

import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import ClanVotingSystem, { CLAN_VOTING_CONFIG, ClanVotingDashboard } from './clan-voting.js';
import { CLAN_ROLE_HIERARCHY } from './clan-roles.js';

// Mock dependencies
jest.mock('@solana/web3.js');
jest.mock('@solana/spl-token');
jest.mock('../../config/solana-config.js');
jest.mock('../voting/solana-voting-system.js');

// Mock wallet for testing
const mockWallet = {
  publicKey: {
    toString: () => 'test_wallet_address_12345'
  },
  signTransaction: jest.fn(),
  signAllTransactions: jest.fn()
};

// Mock clan data
const mockClanId = 'test-clan-12345';
const mockClanMembers = [
  { address: 'owner_address', role: 'owner' },
  { address: 'admin_address', role: 'admin' },
  { address: 'moderator_address', role: 'moderator' },
  { address: 'member_address_1', role: 'member' },
  { address: 'member_address_2', role: 'member' }
];

describe('ClanVotingSystem', () => {
  let clanVotingSystem;
  
  beforeEach(() => {
    clanVotingSystem = new ClanVotingSystem({
      wallet: mockWallet,
      clanId: mockClanId
    });
    
    // Mock successful initialization
    clanVotingSystem.connection = { 
      getBalance: jest.fn().mockResolvedValue(1000000),
      sendAndConfirmTransaction: jest.fn().mockResolvedValue('mock_tx_signature')
    };
    clanVotingSystem.mlgTokenConnection = {};
    clanVotingSystem.baseVotingSystem = {
      burnTokensForVotes: jest.fn().mockResolvedValue({
        transaction: { signature: 'mock_burn_tx' },
        burnedTokens: 100
      })
    };
    
    // Mock clan member methods
    clanVotingSystem.getMemberRole = jest.fn();
    clanVotingSystem.getClanMembers = jest.fn().mockResolvedValue(mockClanMembers);
    clanVotingSystem.fetchMemberRoleFromClan = jest.fn();
    clanVotingSystem.validateWallet = jest.fn().mockResolvedValue(true);
    clanVotingSystem.validateClanMembership = jest.fn().mockResolvedValue(true);
    clanVotingSystem.validateProposalCreationPermissions = jest.fn().mockResolvedValue(true);
    clanVotingSystem.recordProposalOnChain = jest.fn().mockResolvedValue({ signature: 'mock_proposal_tx' });
    clanVotingSystem.recordVoteOnChain = jest.fn().mockResolvedValue({ signature: 'mock_vote_tx' });
    clanVotingSystem.recordDelegationOnChain = jest.fn().mockResolvedValue({ signature: 'mock_delegation_tx' });
    clanVotingSystem.recordDelegationRevocationOnChain = jest.fn().mockResolvedValue({ signature: 'mock_revocation_tx' });
    clanVotingSystem.processDelegatedVotes = jest.fn().mockResolvedValue({ 
      additionalPower: 0, 
      delegationCount: 0, 
      delegators: [] 
    });
    clanVotingSystem.updateVoteAnalytics = jest.fn().mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with correct configuration', () => {
      expect(clanVotingSystem.clanId).toBe(mockClanId);
      expect(clanVotingSystem.wallet).toBe(mockWallet);
      expect(clanVotingSystem.activeProposals).toBeInstanceOf(Map);
      expect(clanVotingSystem.delegationRegistry).toBeInstanceOf(Map);
    });

    test('should initialize connections successfully', async () => {
      const result = await clanVotingSystem.initializeConnections();
      expect(result).toBe(true);
    });

    test('should handle connection initialization failure', async () => {
      // Mock a failing initialization
      clanVotingSystem.initializeConnections = jest.fn().mockRejectedValue(new Error('Connection failed'));
      await expect(clanVotingSystem.initializeConnections()).rejects.toThrow('Connection failed');
    });
  });

  describe('Proposal Creation', () => {
    beforeEach(() => {
      clanVotingSystem.getMemberRole.mockResolvedValue('admin');
    });

    test('should create governance proposal successfully', async () => {
      const proposalData = {
        type: 'governance',
        title: 'Update Clan Constitution',
        description: 'Proposal to update clan rules and governance structure',
        options: ['Approve', 'Reject', 'Abstain']
      };

      const result = await clanVotingSystem.createProposal(proposalData);
      
      expect(result.success).toBe(true);
      expect(result.proposalId).toBeDefined();
      expect(result.proposal.type).toBe('governance');
      expect(result.proposal.title).toBe(proposalData.title);
      expect(result.transaction).toBe('mock_proposal_tx');
    });

    test('should create budget proposal with correct multipliers', async () => {
      const proposalData = {
        type: 'budget',
        title: 'Allocate Treasury Funds',
        description: 'Proposal to allocate 1000 MLG for tournament prizes'
      };

      const result = await clanVotingSystem.createProposal(proposalData);
      
      expect(result.success).toBe(true);
      expect(result.proposal.poolConfig.burnCostMultiplier).toBe(1.5);
      expect(result.proposal.poolConfig.passingThreshold).toBe(0.60);
    });

    test('should reject proposal creation from unauthorized role', async () => {
      clanVotingSystem.getMemberRole.mockResolvedValue('member');
      
      const proposalData = {
        type: 'governance',
        title: 'Test Governance Proposal'
      };

      await expect(clanVotingSystem.createProposal(proposalData)).rejects.toThrow(
        "Role 'member' cannot create 'governance' proposals"
      );
    });

    test('should validate proposal data requirements', async () => {
      const invalidProposal = {
        type: 'invalid_type',
        title: 'Test'
      };

      await expect(clanVotingSystem.createProposal(invalidProposal)).rejects.toThrow(
        'Invalid proposal type: invalid_type'
      );
    });

    test('should generate unique proposal IDs', async () => {
      const proposalData = {
        type: 'content',
        title: 'Test Proposal'
      };

      clanVotingSystem.getMemberRole.mockResolvedValue('moderator');
      
      const result1 = await clanVotingSystem.createProposal(proposalData);
      const result2 = await clanVotingSystem.createProposal(proposalData);
      
      expect(result1.proposalId).not.toBe(result2.proposalId);
    });
  });

  describe('Vote Casting', () => {
    let mockProposal;

    beforeEach(() => {
      mockProposal = {
        id: 'test-proposal-123',
        clanId: mockClanId,
        type: 'governance',
        status: 'active',
        votingEndTime: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
        votes: new Map(),
        votingPowerDistribution: new Map(),
        totalVotingPower: 0,
        poolConfig: CLAN_VOTING_CONFIG.POOL_TYPES.GOVERNANCE
      };

      clanVotingSystem.activeProposals.set(mockProposal.id, mockProposal);
      clanVotingSystem.getMemberRole.mockResolvedValue('admin');
    });

    test('should cast vote with base voting power', async () => {
      const result = await clanVotingSystem.castVote(mockProposal.id, 'Approve');
      
      expect(result.success).toBe(true);
      expect(result.totalVotingPower).toBe(5.0); // Admin role weight
      expect(result.vote.option).toBe('Approve');
      expect(result.vote.voter).toBe(mockWallet.publicKey.toString());
    });

    test('should calculate role-based voting weights correctly', async () => {
      // Test different roles
      const testCases = [
        { role: 'owner', expectedPower: 10.0 },
        { role: 'admin', expectedPower: 5.0 },
        { role: 'moderator', expectedPower: 3.0 },
        { role: 'officer', expectedPower: 2.0 },
        { role: 'member', expectedPower: 1.0 },
        { role: 'recruit', expectedPower: 0.5 }
      ];

      for (const testCase of testCases) {
        clanVotingSystem.getMemberRole.mockResolvedValue(testCase.role);
        mockProposal.votes.clear(); // Reset votes for each test
        
        const result = await clanVotingSystem.castVote(mockProposal.id, 'Approve');
        expect(result.totalVotingPower).toBe(testCase.expectedPower);
      }
    });

    test('should handle burn votes correctly', async () => {
      const voteOptions = { burnVotes: 3 };
      const result = await clanVotingSystem.castVote(mockProposal.id, 'Approve', voteOptions);
      
      expect(result.success).toBe(true);
      expect(result.totalVotingPower).toBe(8.0); // 5 (admin) + 3 (burned)
      expect(result.vote.burnedVotes).toBe(3);
      expect(result.burnTransaction).toBe('mock_burn_tx');
    });

    test('should prevent double voting', async () => {
      // Cast first vote
      await clanVotingSystem.castVote(mockProposal.id, 'Approve');
      
      // Attempt second vote
      await expect(clanVotingSystem.castVote(mockProposal.id, 'Reject')).rejects.toThrow(
        'You have already voted on this proposal'
      );
    });

    test('should reject votes on inactive proposals', async () => {
      mockProposal.status = 'completed';
      
      await expect(clanVotingSystem.castVote(mockProposal.id, 'Approve')).rejects.toThrow(
        'Proposal is not active: completed'
      );
    });

    test('should reject votes after voting period', async () => {
      mockProposal.votingEndTime = new Date(Date.now() - 1000).toISOString(); // Past time
      
      await expect(clanVotingSystem.castVote(mockProposal.id, 'Approve')).rejects.toThrow(
        'Voting period has ended'
      );
    });

    test('should handle delegated votes', async () => {
      clanVotingSystem.processDelegatedVotes.mockResolvedValue({
        additionalPower: 2.5,
        delegationCount: 2,
        delegators: [
          { address: 'delegator1', role: 'member', power: 1.0 },
          { address: 'delegator2', role: 'officer', power: 1.5 }
        ]
      });

      const result = await clanVotingSystem.castVote(mockProposal.id, 'Approve');
      
      expect(result.totalVotingPower).toBe(7.5); // 5 (admin) + 2.5 (delegated)
      expect(result.vote.delegatedPower).toBe(2.5);
    });
  });

  describe('Burn Vote Processing', () => {
    test('should calculate burn costs with multipliers', async () => {
      const result = await clanVotingSystem.processBurnVotes(3, 2.0);
      
      expect(result.additionalPower).toBe(3);
      expect(result.totalCost).toBe(24); // (2 + 4 + 6) * 2.0 multiplier
    });

    test('should enforce maximum burn votes', async () => {
      await expect(clanVotingSystem.processBurnVotes(6, 1.0)).rejects.toThrow(
        'Maximum 5 additional votes allowed'
      );
    });

    test('should integrate with base voting system', async () => {
      await clanVotingSystem.processBurnVotes(2, 1.5);
      
      expect(clanVotingSystem.baseVotingSystem.burnTokensForVotes).toHaveBeenCalledWith(
        2,
        {
          customCosts: {
            1: 3.0, // 2 * 1.5
            2: 6.0  // 4 * 1.5
          }
        }
      );
    });
  });

  describe('Vote Delegation', () => {
    beforeEach(() => {
      clanVotingSystem.getMemberRole.mockImplementation(address => {
        if (address === 'admin_address') return 'admin';
        if (address === 'member_address_1') return 'member';
        return 'member';
      });
    });

    test('should create delegation successfully', async () => {
      const result = await clanVotingSystem.delegateVotingPower('admin_address');
      
      expect(result.success).toBe(true);
      expect(result.delegation.delegate).toBe('admin_address');
      expect(result.delegation.delegator).toBe(mockWallet.publicKey.toString());
      expect(result.transaction).toBe('mock_delegation_tx');
    });

    test('should enforce delegation limits', async () => {
      // Fill up delegation limit
      const existingDelegations = Array(10).fill().map((_, i) => ({
        id: `delegation-${i}`,
        delegator: `delegator-${i}`
      }));
      
      clanVotingSystem.delegationRegistry.set('admin_address', existingDelegations);
      
      await expect(clanVotingSystem.delegateVotingPower('admin_address')).rejects.toThrow(
        'Delegate has reached maximum delegation limit'
      );
    });

    test('should validate delegate clan membership', async () => {
      clanVotingSystem.getMemberRole.mockResolvedValue(null); // Not a member
      
      await expect(clanVotingSystem.delegateVotingPower('non_member_address')).rejects.toThrow(
        'Delegate must be a clan member'
      );
    });

    test('should revoke delegation with notice period', async () => {
      const delegationId = 'test-delegation-123';
      const delegation = {
        id: delegationId,
        delegator: mockWallet.publicKey.toString(),
        delegate: 'admin_address',
        active: true,
        revocationNoticeGiven: false
      };

      clanVotingSystem.delegationRegistry.set('admin_address', [delegation]);

      const result = await clanVotingSystem.revokeDelegation(delegationId);
      
      expect(result.success).toBe(true);
      expect(result.status).toBe('notice_given');
      expect(delegation.revocationNoticeGiven).toBe(true);
    });

    test('should process delegated votes correctly', async () => {
      const delegations = [
        {
          delegator: 'member_address_1',
          delegate: mockWallet.publicKey.toString(),
          active: true,
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          proposalTypes: ['all']
        }
      ];
      
      clanVotingSystem.delegationRegistry.set(mockWallet.publicKey.toString(), delegations);
      clanVotingSystem.isDelegationActive = jest.fn().mockReturnValue(true);

      const result = await clanVotingSystem.processDelegatedVotes(
        mockWallet.publicKey.toString(), 
        'test-proposal'
      );
      
      expect(result.additionalPower).toBe(1.0); // Member role power
      expect(result.delegationCount).toBe(1);
    });
  });

  describe('Analytics and Reporting', () => {
    beforeEach(() => {
      // Setup mock proposals with vote data
      const mockProposals = [
        {
          id: 'proposal-1',
          type: 'governance',
          status: 'active',
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          votes: new Map([
            ['voter1', { voter: 'voter1', votingPower: 5, burnCost: 10 }],
            ['voter2', { voter: 'voter2', votingPower: 2, burnCost: 0 }]
          ]),
          passed: false
        },
        {
          id: 'proposal-2',
          type: 'budget',
          status: 'completed',
          createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          votes: new Map([
            ['voter1', { voter: 'voter1', votingPower: 3, burnCost: 5 }]
          ]),
          passed: true
        }
      ];

      mockProposals.forEach(proposal => {
        clanVotingSystem.activeProposals.set(proposal.id, proposal);
      });
    });

    test('should calculate comprehensive analytics', async () => {
      const analytics = await clanVotingSystem.getClanVotingAnalytics();
      
      expect(analytics.overview.totalProposals).toBe(2);
      expect(analytics.overview.activeProposals).toBe(1);
      expect(analytics.overview.completedProposals).toBe(1);
      expect(analytics.overview.totalVotes).toBe(3);
      expect(analytics.overview.uniqueVoters).toBe(2);
      expect(analytics.overview.totalMLGBurned).toBe(15);
    });

    test('should calculate participation metrics by role', async () => {
      const analytics = await clanVotingSystem.getClanVotingAnalytics();
      
      expect(analytics.participationMetrics.byRole).toBeDefined();
      expect(analytics.overview.averageParticipation).toBeGreaterThan(0);
    });

    test('should calculate governance health score', async () => {
      const analytics = await clanVotingSystem.getClanVotingAnalytics();
      
      expect(analytics.governanceHealth.score).toBeGreaterThanOrEqual(0);
      expect(analytics.governanceHealth.score).toBeLessThanOrEqual(100);
      expect(analytics.governanceHealth.grade).toMatch(/[ABCD]/);
      expect(Array.isArray(analytics.governanceHealth.recommendations)).toBe(true);
    });

    test('should track proposal metrics by type', async () => {
      const analytics = await clanVotingSystem.getClanVotingAnalytics();
      
      expect(analytics.proposalMetrics.byType.governance).toBeDefined();
      expect(analytics.proposalMetrics.byType.budget).toBeDefined();
      expect(analytics.proposalMetrics.byType.governance.count).toBe(1);
      expect(analytics.proposalMetrics.byType.budget.count).toBe(1);
    });
  });

  describe('Security and Validation', () => {
    test('should validate wallet connection', async () => {
      clanVotingSystem.wallet = null;
      
      await expect(clanVotingSystem.validateWallet()).rejects.toThrow(
        'Wallet not connected'
      );
    });

    test('should validate minimum SOL balance', async () => {
      clanVotingSystem.connection.getBalance.mockResolvedValue(100); // Very low balance
      
      await expect(clanVotingSystem.validateWallet()).rejects.toThrow(
        'Insufficient SOL balance for transaction fees'
      );
    });

    test('should validate clan membership', async () => {
      clanVotingSystem.getMemberRole.mockResolvedValue(null);
      
      await expect(clanVotingSystem.validateClanMembership()).rejects.toThrow(
        'You are not a member of this clan'
      );
    });

    test('should validate proposal creation permissions', async () => {
      clanVotingSystem.getMemberRole.mockResolvedValue('recruit');
      
      await expect(clanVotingSystem.validateProposalCreationPermissions('governance')).rejects.toThrow(
        "Role 'recruit' cannot create 'governance' proposals"
      );
    });
  });

  describe('Blockchain Integration', () => {
    test('should record proposals on blockchain', async () => {
      const proposal = { id: 'test-proposal', title: 'Test' };
      
      clanVotingSystem.connection = {
        getBalance: jest.fn().mockResolvedValue(1000000)
      };
      
      const result = await clanVotingSystem.recordProposalOnChain(proposal);
      
      expect(result.signature).toBeDefined();
      expect(result.confirmed).toBe(true);
    });

    test('should record votes on blockchain', async () => {
      const vote = { voter: 'test_voter', option: 'Yes' };
      
      const result = await clanVotingSystem.recordVoteOnChain('proposal-123', vote);
      
      expect(result.signature).toBeDefined();
      expect(result.confirmed).toBe(true);
    });

    test('should handle blockchain transaction failures', async () => {
      clanVotingSystem.connection = {
        getBalance: jest.fn().mockRejectedValue(new Error('Network error'))
      };
      
      await expect(clanVotingSystem.recordProposalOnChain({})).rejects.toThrow(
        'Network error'
      );
    });
  });
});

describe('ClanVotingDashboard', () => {
  let dashboard;
  
  beforeEach(() => {
    dashboard = new ClanVotingDashboard({
      clanId: mockClanId,
      wallet: mockWallet
    });
  });

  test('should initialize dashboard with correct props', () => {
    expect(dashboard.clanId).toBe(mockClanId);
    expect(dashboard.wallet).toBe(mockWallet);
    expect(dashboard.votingSystem).toBeInstanceOf(ClanVotingSystem);
  });

  test('should render dashboard HTML correctly', () => {
    const html = dashboard.render();
    
    expect(html).toContain('clan-voting-dashboard');
    expect(html).toContain('Clan Governance');
    expect(html).toContain('⚖️ Governance');
    expect(html).toContain('💰 Budget');
    expect(html).toContain('👥 Membership');
    expect(html).toContain('Create Proposal');
  });

  test('should include all proposal pool types in tabs', () => {
    const html = dashboard.render();
    
    Object.values(CLAN_VOTING_CONFIG.POOL_TYPES).forEach(poolType => {
      expect(html).toContain(poolType.icon);
      expect(html).toContain(poolType.name);
    });
  });

  test('should include voting power preview', () => {
    const html = dashboard.render();
    
    expect(html).toContain('voting-power-preview');
    expect(html).toContain('Base Power');
    expect(html).toContain('Burn Power');
    expect(html).toContain('Delegated Power');
    expect(html).toContain('Total Power');
  });

  test('should include responsive CSS styles', () => {
    const html = dashboard.render();
    
    expect(html).toContain('@media (max-width: 768px)');
    expect(html).toContain('flex-direction: column');
  });
});

describe('Configuration Validation', () => {
  test('should have valid pool type configurations', () => {
    Object.values(CLAN_VOTING_CONFIG.POOL_TYPES).forEach(poolType => {
      expect(poolType.id).toBeDefined();
      expect(poolType.name).toBeDefined();
      expect(poolType.minVotingPower).toBeGreaterThan(0);
      expect(poolType.passingThreshold).toBeGreaterThan(0);
      expect(poolType.passingThreshold).toBeLessThanOrEqual(1);
      expect(poolType.quorumRequirement).toBeGreaterThan(0);
      expect(poolType.quorumRequirement).toBeLessThanOrEqual(1);
      expect(poolType.votingPeriodHours).toBeGreaterThan(0);
      expect(Array.isArray(poolType.roleRestrictions)).toBe(true);
      expect(Array.isArray(poolType.features)).toBe(true);
    });
  });

  test('should have valid role voting weights', () => {
    Object.entries(CLAN_VOTING_CONFIG.ROLE_VOTING_WEIGHTS).forEach(([role, weight]) => {
      expect(weight).toBeGreaterThan(0);
      expect(CLAN_ROLE_HIERARCHY[role.toUpperCase()]).toBeDefined();
    });
  });

  test('should have valid burn vote costs', () => {
    Object.values(CLAN_VOTING_CONFIG.CLAN_BURN_COSTS).forEach(cost => {
      expect(cost).toBeGreaterThan(0);
    });
    
    expect(CLAN_VOTING_CONFIG.MAX_CLAN_BURN_VOTES).toBeGreaterThan(0);
    expect(CLAN_VOTING_CONFIG.MAX_CLAN_BURN_VOTES).toBeLessThanOrEqual(10);
  });

  test('should have valid delegation configuration', () => {
    const delegation = CLAN_VOTING_CONFIG.DELEGATION;
    
    expect(typeof delegation.ENABLED).toBe('boolean');
    expect(delegation.MAX_DELEGATIONS_PER_MEMBER).toBeGreaterThan(0);
    expect(delegation.DELEGATION_PERIOD_HOURS).toBeGreaterThan(0);
    expect(delegation.REVOCATION_NOTICE_HOURS).toBeGreaterThanOrEqual(0);
  });

  test('should have valid security configuration', () => {
    const security = CLAN_VOTING_CONFIG.SECURITY;
    
    expect(security.MIN_CLAN_MEMBERSHIP_DAYS).toBeGreaterThanOrEqual(0);
    expect(security.MIN_ROLE_TENURE_HOURS).toBeGreaterThanOrEqual(0);
    expect(typeof security.VOTE_SIGNATURE_REQUIRED).toBe('boolean');
    expect(typeof security.ANTI_SYBIL_ENABLED).toBe('boolean');
  });
});

describe('Integration Tests', () => {
  let clanVotingSystem;

  beforeEach(() => {
    clanVotingSystem = new ClanVotingSystem({
      wallet: mockWallet,
      clanId: mockClanId
    });
    
    // Mock all required methods
    clanVotingSystem.connection = { getBalance: jest.fn().mockResolvedValue(1000000) };
    clanVotingSystem.getMemberRole = jest.fn().mockResolvedValue('admin');
    clanVotingSystem.validateWallet = jest.fn().mockResolvedValue(true);
    clanVotingSystem.validateClanMembership = jest.fn().mockResolvedValue(true);
    clanVotingSystem.validateProposalCreationPermissions = jest.fn().mockResolvedValue(true);
    clanVotingSystem.recordProposalOnChain = jest.fn().mockResolvedValue({ signature: 'mock_tx' });
    clanVotingSystem.recordVoteOnChain = jest.fn().mockResolvedValue({ signature: 'mock_tx' });
    clanVotingSystem.processDelegatedVotes = jest.fn().mockResolvedValue({ 
      additionalPower: 0, 
      delegationCount: 0, 
      delegators: [] 
    });
    clanVotingSystem.updateVoteAnalytics = jest.fn();
  });

  test('should complete full proposal lifecycle', async () => {
    // Create proposal
    const proposalData = {
      type: 'governance',
      title: 'Test Governance Proposal',
      description: 'A test proposal for integration testing'
    };
    
    const createResult = await clanVotingSystem.createProposal(proposalData);
    expect(createResult.success).toBe(true);
    
    const proposalId = createResult.proposalId;
    
    // Cast vote
    const voteResult = await clanVotingSystem.castVote(proposalId, 'Approve');
    expect(voteResult.success).toBe(true);
    
    // Verify proposal state
    const proposal = clanVotingSystem.activeProposals.get(proposalId);
    expect(proposal.votes.size).toBe(1);
    expect(proposal.totalVotingPower).toBeGreaterThan(0);
  });

  test('should handle multiple voters with different roles', async () => {
    // Create proposal
    const proposalData = {
      type: 'membership',
      title: 'Test Membership Proposal'
    };
    
    clanVotingSystem.getMemberRole.mockResolvedValue('moderator');
    const createResult = await clanVotingSystem.createProposal(proposalData);
    const proposalId = createResult.proposalId;
    
    // Vote as moderator
    const vote1 = await clanVotingSystem.castVote(proposalId, 'Approve');
    expect(vote1.totalVotingPower).toBe(3.0); // Moderator weight
    
    // Switch to member role and vote (simulate different wallet)
    clanVotingSystem.wallet = { publicKey: { toString: () => 'member_wallet' } };
    clanVotingSystem.getMemberRole.mockResolvedValue('member');
    
    const vote2 = await clanVotingSystem.castVote(proposalId, 'Reject');
    expect(vote2.totalVotingPower).toBe(1.0); // Member weight
    
    // Verify total voting power
    const proposal = clanVotingSystem.activeProposals.get(proposalId);
    expect(proposal.totalVotingPower).toBe(4.0); // 3 + 1
  });
});