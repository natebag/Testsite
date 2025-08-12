/**
 * MLG.clan Clan Management System Tests
 * 
 * Comprehensive test suite for clan creation, management, and blockchain integration.
 * Tests cover Solana integration, MLG token staking, tier management, and security features.
 */

import { jest } from '@jest/globals';
import { PublicKey } from '@solana/web3.js';

// Mock Solana dependencies
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn(() => ({
    getLatestBlockhash: jest.fn(() => Promise.resolve({ blockhash: 'mock-blockhash' })),
    sendRawTransaction: jest.fn(() => Promise.resolve('mock-signature')),
    confirmTransaction: jest.fn(() => Promise.resolve({ value: { err: null } })),
    getVersion: jest.fn(() => Promise.resolve({ 'solana-core': '1.14.0' })),
    getAccountInfo: jest.fn(() => Promise.resolve({ data: Buffer.alloc(0) }))
  })),
  PublicKey: jest.fn().mockImplementation((key) => ({
    toString: () => key,
    toBuffer: () => Buffer.from(key, 'hex').slice(0, 32),
    findProgramAddress: jest.fn(() => Promise.resolve([{ toString: () => 'mock-pda' }, 254]))
  })),
  Transaction: jest.fn(() => ({
    add: jest.fn(),
    serialize: jest.fn(() => Buffer.alloc(0)),
    recentBlockhash: null,
    feePayer: null
  })),
  SystemProgram: {
    programId: 'mock-system-program'
  },
  sendAndConfirmTransaction: jest.fn(),
  Keypair: {
    generate: jest.fn(() => ({
      publicKey: { toString: () => 'mock-keypair-public' },
      secretKey: new Uint8Array(64)
    }))
  },
  LAMPORTS_PER_SOL: 1000000000
}));

// Enable mocking for PublicKey static methods
PublicKey.findProgramAddress = jest.fn(() => Promise.resolve([{ toString: () => 'mock-pda' }, 254]));

jest.mock('@solana/spl-token', () => ({
  TOKEN_PROGRAM_ID: { toString: () => 'mock-token-program' },
  ASSOCIATED_TOKEN_PROGRAM_ID: { toString: () => 'mock-associated-token-program' },
  getAssociatedTokenAddress: jest.fn(() => Promise.resolve({ toString: () => 'mock-token-account' })),
  createAssociatedTokenAccountInstruction: jest.fn(() => ({ type: 'createATA' })),
  createTransferInstruction: jest.fn(() => ({ type: 'transfer' })),
  createBurnInstruction: jest.fn(() => ({ type: 'burn' })),
  getAccount: jest.fn(() => Promise.resolve({ 
    amount: BigInt(1000 * Math.pow(10, 9)), // 1000 tokens with 9 decimals
    mint: 'mock-mint',
    owner: 'mock-owner'
  })),
  getMint: jest.fn(() => Promise.resolve({
    decimals: 9,
    supply: BigInt(1000000 * Math.pow(10, 9))
  }))
}));

// Mock config
jest.mock('../../config/solana-config.js', () => ({
  createMLGTokenConnection: jest.fn(() => ({
    getLatestBlockhash: jest.fn(() => Promise.resolve({ blockhash: 'mock-blockhash' })),
    sendRawTransaction: jest.fn(() => Promise.resolve('mock-signature')),
    confirmTransaction: jest.fn(() => Promise.resolve({ value: { err: null } })),
    getVersion: jest.fn(() => Promise.resolve({ 'solana-core': '1.14.0' })),
    getAccountInfo: jest.fn(() => Promise.resolve({ data: Buffer.alloc(0) }))
  })),
  CURRENT_NETWORK: 'mainnet-beta',
  MLG_TOKEN_CONFIG: {
    DECIMALS: 9,
    SYMBOL: 'MLG',
    NAME: 'MLG Gaming Token'
  },
  TOKEN_PROGRAMS: {
    MLG_TOKEN_MINT: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL'
  }
}));

// Mock content moderation
jest.mock('../content/content-moderation.js', () => ({
  validateContent: jest.fn(() => Promise.resolve({
    isValid: true,
    confidence: 0.95
  }))
}));

import { 
  ClanManager, 
  CLAN_TIER_CONFIG, 
  CLAN_ROLES,
  CLAN_CONFIG,
  formatMLGAmount,
  calculateLockTimeRemaining,
  validateClanData
} from './clan-management.js';

describe('ClanManager', () => {
  let clanManager;
  let mockWalletAdapter;
  let mockUserPublicKey;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset mock implementations
    const { getAccount } = await import('@solana/spl-token');
    getAccount.mockResolvedValue({
      amount: BigInt(1000 * Math.pow(10, 9)), // 1000 tokens with 9 decimals
      mint: 'mock-mint',
      owner: 'mock-owner'
    });
    
    // Setup mock wallet
    mockUserPublicKey = new PublicKey('7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL');
    mockWalletAdapter = {
      publicKey: mockUserPublicKey,
      signTransaction: jest.fn((tx) => Promise.resolve({
        ...tx,
        serialize: () => Buffer.alloc(0)
      })),
      connected: true
    };

    // Initialize ClanManager
    clanManager = new ClanManager(mockWalletAdapter);
  });

  describe('Initialization', () => {
    test('should initialize correctly with wallet adapter', () => {
      expect(clanManager.walletAdapter).toBe(mockWalletAdapter);
      expect(clanManager.connection).toBeDefined();
      expect(clanManager.mlgTokenMint).toBeDefined();
    });

    test('should initialize caches', () => {
      expect(clanManager.clanCache).toBeInstanceOf(Map);
      expect(clanManager.userClanCache).toBeInstanceOf(Map);
      expect(clanManager.nameReservationCache).toBeInstanceOf(Map);
    });
  });

  describe('Clan Tier System', () => {
    test('should correctly identify Bronze tier', () => {
      const tier = clanManager.getClanTier(100);
      expect(tier).toBe(CLAN_TIER_CONFIG.BRONZE);
      expect(tier.minStake).toBe(100);
      expect(tier.maxMembers).toBe(20);
    });

    test('should correctly identify Silver tier', () => {
      const tier = clanManager.getClanTier(500);
      expect(tier).toBe(CLAN_TIER_CONFIG.SILVER);
      expect(tier.minStake).toBe(500);
      expect(tier.maxMembers).toBe(50);
    });

    test('should correctly identify Gold tier', () => {
      const tier = clanManager.getClanTier(1000);
      expect(tier).toBe(CLAN_TIER_CONFIG.GOLD);
      expect(tier.minStake).toBe(1000);
      expect(tier.maxMembers).toBe(100);
    });

    test('should correctly identify Diamond tier', () => {
      const tier = clanManager.getClanTier(5000);
      expect(tier).toBe(CLAN_TIER_CONFIG.DIAMOND);
      expect(tier.minStake).toBe(5000);
      expect(tier.maxMembers).toBe(250);
    });

    test('should return null for insufficient stake', () => {
      const tier = clanManager.getClanTier(50);
      expect(tier).toBeNull();
    });

    test('should select highest applicable tier', () => {
      const tier = clanManager.getClanTier(10000);
      expect(tier).toBe(CLAN_TIER_CONFIG.DIAMOND);
    });
  });

  describe('Clan Name Validation', () => {
    test('should validate correct clan name', async () => {
      const validation = await clanManager.validateClanName('TestClan123');
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should reject too short name', async () => {
      const validation = await clanManager.validateClanName('ab');
      expect(validation.isValid).toBe(false);
      expect(validation.errors[0]).toContain('must be at least');
    });

    test('should reject too long name', async () => {
      const longName = 'a'.repeat(CLAN_CONFIG.NAME_MAX_LENGTH + 1);
      const validation = await clanManager.validateClanName(longName);
      expect(validation.isValid).toBe(false);
      expect(validation.errors[0]).toContain('cannot exceed');
    });

    test('should reject invalid characters', async () => {
      const validation = await clanManager.validateClanName('Test Clan!');
      expect(validation.isValid).toBe(false);
      expect(validation.errors[0]).toContain('can only contain');
    });

    test('should accept valid characters', async () => {
      const validation = await clanManager.validateClanName('Test-Clan_123');
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Token Requirements Validation', () => {
    test('should validate sufficient token balance', async () => {
      const validation = await clanManager.validateTokenRequirements(mockUserPublicKey, 500);
      expect(validation.hasEnoughTokens).toBe(true);
      expect(validation.currentBalance).toBe(1000); // Mocked 1000 tokens
      expect(validation.shortfall).toBe(0);
    });

    test('should identify insufficient token balance', async () => {
      const validation = await clanManager.validateTokenRequirements(mockUserPublicKey, 2000);
      expect(validation.hasEnoughTokens).toBe(false);
      expect(validation.shortfall).toBe(1000); // Need 2000, have 1000
    });
  });

  describe('Rate Limiting', () => {
    test('should allow operation when no previous operation', () => {
      const check = clanManager.checkRateLimit(mockUserPublicKey, 'create_clan');
      expect(check.allowed).toBe(true);
    });

    test('should block operation within cooldown period', () => {
      // Simulate previous operation
      const key = `${mockUserPublicKey.toString()}_create_clan`;
      clanManager.lastOperations.set(key, Date.now() - 30 * 60 * 1000); // 30 minutes ago
      
      const check = clanManager.checkRateLimit(mockUserPublicKey, 'create_clan');
      expect(check.allowed).toBe(false);
      expect(check.remainingTime).toBeGreaterThan(0);
    });

    test('should allow operation after cooldown period', () => {
      // Simulate old operation
      const key = `${mockUserPublicKey.toString()}_create_clan`;
      clanManager.lastOperations.set(key, Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      
      const check = clanManager.checkRateLimit(mockUserPublicKey, 'create_clan');
      expect(check.allowed).toBe(true);
    });
  });

  describe('Clan Creation', () => {
    const validClanData = {
      name: 'TestClan',
      description: 'A test gaming clan',
      tags: ['fps', 'competitive'],
      tier: 'bronze',
      bannerUrl: 'https://example.com/banner.jpg',
      rules: ['Be respectful', 'No cheating']
    };

    test('should create clan successfully with valid data', async () => {
      const result = await clanManager.createClan(validClanData);
      
      expect(result.success).toBe(true);
      expect(result.clan.name).toBe('TestClan');
      expect(result.clan.tier).toBe('bronze');
      expect(result.clan.owner).toBe(mockUserPublicKey.toString());
      expect(result.transaction).toBe('mock-signature');
      expect(mockWalletAdapter.signTransaction).toHaveBeenCalled();
    });

    test('should fail without wallet connection', async () => {
      clanManager.walletAdapter = null;
      
      await expect(clanManager.createClan(validClanData))
        .rejects.toThrow('Wallet not connected');
    });

    test('should fail with invalid tier', async () => {
      const invalidData = { ...validClanData, tier: 'platinum' };
      
      await expect(clanManager.createClan(invalidData))
        .rejects.toThrow('Invalid clan tier specified');
    });

    test('should validate clan data before creation', async () => {
      const invalidData = { ...validClanData, name: '' };
      
      await expect(clanManager.createClan(invalidData))
        .rejects.toThrow('Invalid clan name');
    });
  });

  describe('Clan Management Operations', () => {
    let testClan;

    beforeEach(async () => {
      // Create a test clan
      const clanData = {
        name: 'TestClan',
        description: 'Test clan for operations',
        tags: ['test'],
        tier: 'silver',
        bannerUrl: '',
        rules: []
      };
      
      const result = await clanManager.createClan(clanData);
      testClan = result.clan;
    });

    test('should upgrade clan tier successfully', async () => {
      const result = await clanManager.upgradeClanTier(testClan.id, 'gold');
      
      expect(result.success).toBe(true);
      expect(result.clan.tier).toBe('gold');
      expect(result.clan.maxMembers).toBe(CLAN_TIER_CONFIG.GOLD.maxMembers);
      expect(result.newTier.id).toBe('gold');
    });

    test('should fail to upgrade to lower tier', async () => {
      await expect(clanManager.upgradeClanTier(testClan.id, 'bronze'))
        .rejects.toThrow('New tier must be higher than current tier');
    });

    test('should transfer ownership successfully', async () => {
      const newOwner = new PublicKey('NewOwnerPublicKey11111111111111111111111111');
      
      // First add new owner as member
      await clanManager.addMember(testClan.id, newOwner);
      
      const result = await clanManager.transferOwnership(testClan.id, newOwner);
      
      expect(result.success).toBe(true);
      expect(result.clan.owner).toBe(newOwner.toString());
      expect(result.newOwner).toBe(newOwner.toString());
    });

    test('should add member successfully', async () => {
      const newMember = new PublicKey('NewMemberPublicKey1111111111111111111111111');
      
      const result = await clanManager.addMember(testClan.id, newMember, 'member');
      
      expect(result.success).toBe(true);
      expect(result.clan.members).toContain(newMember.toString());
      expect(result.newMember).toBe(newMember.toString());
      expect(result.role).toBe('member');
    });

    test('should remove member successfully', async () => {
      const member = new PublicKey('MemberToRemove1111111111111111111111111111');
      
      // First add the member
      await clanManager.addMember(testClan.id, member);
      
      // Then remove them
      const result = await clanManager.removeMember(testClan.id, member, 'kicked');
      
      expect(result.success).toBe(true);
      expect(result.clan.members).not.toContain(member.toString());
      expect(result.reason).toBe('kicked');
    });

    test('should not allow non-owners to upgrade tier', async () => {
      // Change wallet to different user
      const differentUser = new PublicKey('DifferentUser111111111111111111111111111111');
      clanManager.walletAdapter.publicKey = differentUser;
      
      await expect(clanManager.upgradeClanTier(testClan.id, 'gold'))
        .rejects.toThrow('Only clan owner can upgrade tier');
    });
  });

  describe('Clan Queries', () => {
    let testClan;

    beforeEach(async () => {
      const clanData = {
        name: 'QueryTestClan',
        description: 'Clan for query testing',
        tags: ['query', 'test'],
        tier: 'bronze',
        bannerUrl: '',
        rules: []
      };
      
      const result = await clanManager.createClan(clanData);
      testClan = result.clan;
    });

    test('should retrieve clan by address', async () => {
      const retrievedClan = await clanManager.getClan(testClan.id);
      
      expect(retrievedClan).not.toBeNull();
      expect(retrievedClan.name).toBe('QueryTestClan');
      expect(retrievedClan.id).toBe(testClan.id);
    });

    test('should return user clans', async () => {
      const userClans = await clanManager.getUserClans(mockUserPublicKey);
      
      expect(Array.isArray(userClans)).toBe(true);
      expect(userClans.length).toBeGreaterThan(0);
      expect(userClans.some(clan => clan.name === 'QueryTestClan')).toBe(true);
    });

    test('should return empty array for user with no clans', async () => {
      const differentUser = new PublicKey('UserWithNoClans111111111111111111111111111');
      const userClans = await clanManager.getUserClans(differentUser);
      
      expect(Array.isArray(userClans)).toBe(true);
      expect(userClans.length).toBe(0);
    });
  });

  describe('Security Features', () => {
    test('should prevent creating clan without sufficient tokens', async () => {
      // Mock insufficient balance
      const { getAccount } = await import('@solana/spl-token');
      getAccount.mockResolvedValueOnce({
        amount: BigInt(50 * Math.pow(10, 9)), // Only 50 tokens
        mint: 'mock-mint',
        owner: 'mock-owner'
      });

      const clanData = {
        name: 'InsufficientFundsClan',
        tier: 'bronze'
      };

      await expect(clanManager.createClan(clanData))
        .rejects.toThrow('Insufficient MLG tokens');
    });

    test('should enforce member limits', async () => {
      const clanData = {
        name: 'SmallClan',
        tier: 'bronze' // Max 20 members
      };
      
      const result = await clanManager.createClan(clanData);
      const clan = result.clan;
      
      // Try to add more members than allowed
      for (let i = 1; i < 21; i++) { // 19 more members (already has owner)
        const member = new PublicKey(`Member${i}${'1'.repeat(32 - `Member${i}`.length)}`);
        await clanManager.addMember(clan.id, member);
      }
      
      // This should fail - exceeds member limit
      const extraMember = new PublicKey('ExtraMember111111111111111111111111111111');
      await expect(clanManager.addMember(clan.id, extraMember))
        .rejects.toThrow('Clan is at maximum capacity');
    });

    test('should prevent non-members from becoming owners', async () => {
      const clanData = {
        name: 'OwnershipTestClan',
        tier: 'bronze'
      };
      
      const result = await clanManager.createClan(clanData);
      const nonMember = new PublicKey('NonMemberUser11111111111111111111111111111');
      
      await expect(clanManager.transferOwnership(result.clan.id, nonMember))
        .rejects.toThrow('New owner must be a clan member');
    });
  });
});

describe('Utility Functions', () => {
  describe('formatMLGAmount', () => {
    test('should format amounts correctly', () => {
      expect(formatMLGAmount(1000)).toBe('1,000');
      expect(formatMLGAmount(1234.567)).toBe('1,234.57');
      expect(formatMLGAmount(1000000)).toBe('1,000,000');
    });

    test('should handle decimal places', () => {
      expect(formatMLGAmount(1234.567, 0)).toBe('1,235');
      expect(formatMLGAmount(1234.567, 3)).toBe('1,234.567');
    });
  });

  describe('calculateLockTimeRemaining', () => {
    test('should calculate remaining time correctly', () => {
      const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
      const result = calculateLockTimeRemaining(futureDate.toISOString());
      
      expect(result.expired).toBe(false);
      expect(result.days).toBeGreaterThanOrEqual(1); // Should be at least 1 day
      expect(result.formatted).toContain('d');
    });

    test('should handle expired lock periods', () => {
      const pastDate = new Date(Date.now() - 1000); // 1 second ago
      const result = calculateLockTimeRemaining(pastDate.toISOString());
      
      expect(result.expired).toBe(true);
      expect(result.remaining).toBe(0);
    });
  });

  describe('validateClanData', () => {
    test('should validate correct clan data', () => {
      const validData = {
        name: 'ValidClan',
        tier: 'bronze',
        tags: ['tag1', 'tag2'],
        rules: ['rule1', 'rule2']
      };
      
      const result = validateClanData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject missing name', () => {
      const invalidData = {
        tier: 'bronze'
      };
      
      const result = validateClanData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('name is required');
    });

    test('should reject invalid tier', () => {
      const invalidData = {
        name: 'TestClan',
        tier: 'invalid'
      };
      
      const result = validateClanData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Valid tier is required');
    });
  });
});

describe('Configuration Constants', () => {
  test('should have correct tier configurations', () => {
    expect(CLAN_TIER_CONFIG.BRONZE.minStake).toBe(100);
    expect(CLAN_TIER_CONFIG.SILVER.minStake).toBe(500);
    expect(CLAN_TIER_CONFIG.GOLD.minStake).toBe(1000);
    expect(CLAN_TIER_CONFIG.DIAMOND.minStake).toBe(5000);
  });

  test('should have correct member limits', () => {
    expect(CLAN_TIER_CONFIG.BRONZE.maxMembers).toBe(20);
    expect(CLAN_TIER_CONFIG.SILVER.maxMembers).toBe(50);
    expect(CLAN_TIER_CONFIG.GOLD.maxMembers).toBe(100);
    expect(CLAN_TIER_CONFIG.DIAMOND.maxMembers).toBe(250);
  });

  test('should have correct role hierarchy', () => {
    expect(CLAN_ROLES.OWNER.priority).toBe(1000);
    expect(CLAN_ROLES.ADMIN.priority).toBe(900);
    expect(CLAN_ROLES.MODERATOR.priority).toBe(800);
    expect(CLAN_ROLES.MEMBER.priority).toBe(100);
  });

  test('should have sensible configuration values', () => {
    expect(CLAN_CONFIG.NAME_MIN_LENGTH).toBe(3);
    expect(CLAN_CONFIG.NAME_MAX_LENGTH).toBe(32);
    expect(CLAN_CONFIG.MAX_CLANS_PER_USER).toBe(3);
    expect(CLAN_CONFIG.CREATION_COOLDOWN).toBe(60 * 60 * 1000); // 1 hour
  });
});