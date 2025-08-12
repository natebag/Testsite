/**
 * Content Reward System Test Suite - Sub-task 4.7
 * 
 * Comprehensive test suite for the MLG.clan content reward system
 * Tests all aspects of reward calculation, distribution, and security measures
 * 
 * @author Claude Code - Solana Web3 Security Architect
 * @version 1.0.0
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

import { 
  ContentRewardSystem, 
  RewardAnalytics,
  RewardUIComponents,
  REWARD_CONFIG 
} from './content-rewards.js';

import { ContentRankingAlgorithm } from './content-ranking-algorithm.js';

// Mock Solana connection and dependencies
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn(),
  PublicKey: jest.fn().mockImplementation((key) => ({ toString: () => key })),
  Transaction: jest.fn(),
  SystemProgram: {},
  sendAndConfirmTransaction: jest.fn(),
  Keypair: {
    generate: jest.fn().mockReturnValue({
      publicKey: { toString: () => 'mock_keypair_public_key' },
      secretKey: new Uint8Array(64)
    })
  },
  LAMPORTS_PER_SOL: 1000000000
}));

jest.mock('@solana/spl-token', () => ({
  TOKEN_PROGRAM_ID: 'mock_token_program_id',
  createTransferInstruction: jest.fn(),
  getAssociatedTokenAddress: jest.fn(),
  getAccount: jest.fn(),
  createAssociatedTokenAccountInstruction: jest.fn()
}));

jest.mock('../../config/solana-config.js', () => ({
  createConnection: () => ({
    simulateTransaction: jest.fn().mockResolvedValue({ value: { err: null } }),
    sendTransaction: jest.fn().mockResolvedValue('mock_signature'),
    confirmTransaction: jest.fn().mockResolvedValue(true)
  }),
  createMLGTokenConnection: () => ({}),
  MLG_TOKEN_CONFIG: {
    DECIMALS: 9,
    MINT_ADDRESS: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL'
  },
  CURRENT_NETWORK: 'devnet'
}));

// Import mocked modules
import { PublicKey, Connection, Keypair } from '@solana/web3.js';

// Test data
const mockContent = {
  id: 'content_123',
  title: 'Epic Gaming Montage',
  creator: {
    id: 'creator_456',
    walletAddress: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL',
    accountCreatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days old
    clanStatus: 'member',
    verified: false,
    achievementLevel: 'silver'
  },
  views: 5000,
  likes: 500,
  comments: 75,
  shares: 25,
  mlgVotes: {
    upvotes: 50,
    downvotes: 5,
    superVotes: 10,
    totalTokensBurned: 15
  },
  analytics: {
    clickThroughRate: 0.12,
    completionRate: 0.85,
    watchTime: 2400
  },
  contentType: 'video_clip',
  duration: 180,
  category: 'highlights',
  game: 'valorant',
  gameMode: 'ranked',
  difficulty: 'advanced',
  platform: 'pc',
  tags: ['esports', 'clutch', 'ace'],
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
};

const mockCreator = {
  id: 'creator_456',
  walletAddress: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL',
  accountCreatedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), // 100 days old
  clanStatus: 'verified',
  verified: true,
  achievementLevel: 'gold',
  gamerscore: 5000,
  totalContent: 25,
  averageContentScore: 75
};

describe('ContentRewardSystem', () => {
  let rewardSystem;
  let mockConnection;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    mockConnection = {
      simulateTransaction: jest.fn().mockResolvedValue({ value: { err: null } }),
      sendTransaction: jest.fn().mockResolvedValue('mock_signature_12345'),
      confirmTransaction: jest.fn().mockResolvedValue(true),
      getAccountInfo: jest.fn().mockResolvedValue(null)
    };
    
    rewardSystem = new ContentRewardSystem(mockConnection);
    
    // Mock treasury methods
    rewardSystem.getTreasuryBalance = jest.fn().mockResolvedValue(1000000);
    rewardSystem.getTreasuryTokenAccount = jest.fn().mockResolvedValue(new PublicKey('11111111111111111111111111111111'));
    rewardSystem.getTreasuryAuthority = jest.fn().mockResolvedValue(new PublicKey('11111111111111111111111111111111'));
    rewardSystem.getTreasuryKeypair = jest.fn().mockResolvedValue(Keypair.generate());
  });
  
  afterEach(() => {
    jest.resetAllMocks();
  });
  
  describe('Reward Calculation', () => {
    test('should calculate performance-based rewards correctly', async () => {
      const result = await rewardSystem.calculateContentReward(mockContent);
      
      expect(result.eligible).toBe(true);
      expect(result.totalReward).toBeGreaterThan(0);
      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.baseReward).toBeGreaterThan(0);
      expect(result.breakdown.engagementBonus).toBeGreaterThan(0);
      expect(result.metrics.contentScore).toBeGreaterThan(0);
    });
    
    test('should apply creator tier multipliers correctly', async () => {
      // Test verified creator bonus
      const verifiedContent = {
        ...mockContent,
        creator: { ...mockContent.creator, verified: true }
      };
      
      const verifiedResult = await rewardSystem.calculateContentReward(verifiedContent);
      const standardResult = await rewardSystem.calculateContentReward(mockContent);
      
      expect(verifiedResult.totalReward).toBeGreaterThan(standardResult.totalReward);
      expect(verifiedResult.breakdown.creatorMultiplier).toBe(REWARD_CONFIG.CREATOR_TIERS.VERIFIED.multiplier);
    });
    
    test('should calculate engagement bonuses for viral content', async () => {
      const viralContent = {
        ...mockContent,
        views: 15000, // Above viral threshold
        likes: 2000,
        analytics: {
          ...mockContent.analytics,
          completionRate: 0.9 // Excellent completion rate
        }
      };
      
      const result = await rewardSystem.calculateContentReward(viralContent);
      
      expect(result.breakdown.engagementBonus).toBeGreaterThanOrEqual(
        REWARD_CONFIG.PERFORMANCE_REWARDS.ENGAGEMENT.VIRAL_BONUS
      );
    });
    
    test('should apply trending and velocity bonuses', async () => {
      // Mock ranking algorithm to return trending insights
      jest.spyOn(rewardSystem.rankingAlgorithm, 'calculateContentScore').mockReturnValue({
        normalizedScore: 85,
        components: { votes: 75, engagement: 80, time: 90 },
        insights: [
          { type: 'trending', message: 'Rapidly gaining traction', impact: 'high' }
        ]
      });
      
      const result = await rewardSystem.calculateContentReward(mockContent);
      
      expect(result.breakdown.velocityBonus).toBeGreaterThanOrEqual(
        REWARD_CONFIG.PERFORMANCE_REWARDS.VELOCITY_REWARDS.TRENDING_BONUS
      );
    });
    
    test('should enforce minimum payout threshold', async () => {
      const lowQualityContent = {
        ...mockContent,
        views: 10,
        likes: 1,
        mlgVotes: { upvotes: 2, downvotes: 1, superVotes: 0, totalTokensBurned: 0 },
        analytics: { clickThroughRate: 0.01, completionRate: 0.2 }
      };
      
      const result = await rewardSystem.calculateContentReward(lowQualityContent);
      
      if (result.totalReward > 0) {
        expect(result.totalReward).toBeGreaterThanOrEqual(REWARD_CONFIG.DISTRIBUTION.MINIMUM_PAYOUT);
      }
    });
  });
  
  describe('Eligibility Checks', () => {
    test('should reject rewards for new accounts', async () => {
      const newAccountContent = {
        ...mockContent,
        creator: {
          ...mockContent.creator,
          accountCreatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days old
        }
      };
      
      const result = await rewardSystem.calculateContentReward(newAccountContent);
      
      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('account_age');
    });
    
    test('should enforce daily reward limits', async () => {
      const creatorId = mockContent.creator.id;
      
      // Add maximum daily rewards to history
      for (let i = 0; i < REWARD_CONFIG.ANTI_GAMING.MAXIMUM_DAILY_REWARDS; i++) {
        rewardSystem.rewardHistory.push({
          recipient: creatorId,
          amount: 100,
          timestamp: new Date().toISOString(),
          status: 'completed'
        });
      }
      
      const result = await rewardSystem.calculateContentReward(mockContent);
      
      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('daily_limit');
    });
    
    test('should enforce cooling period between rewards', async () => {
      const creatorId = mockContent.creator.id;
      
      // Add recent reward within cooling period
      rewardSystem.rewardHistory.push({
        recipient: creatorId,
        amount: 100,
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        status: 'completed'
      });
      
      const result = await rewardSystem.calculateContentReward(mockContent);
      
      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('cooling_period');
    });
    
    test('should check content quality threshold', async () => {
      // Mock very low quality content score
      jest.spyOn(rewardSystem.rankingAlgorithm, 'calculateContentScore').mockReturnValue({
        normalizedScore: 5, // Well below threshold
        components: { votes: 0, engagement: 0, time: 0.5 },
        insights: []
      });
      
      const result = await rewardSystem.calculateContentReward(mockContent);
      
      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('content_quality');
    });
  });
  
  describe('Anti-Gaming Measures', () => {
    test('should detect and penalize suspicious voting patterns', async () => {
      const suspiciousContent = {
        ...mockContent,
        mlgVotes: {
          upvotes: 1000, // Unrealistic number of votes
          downvotes: 10,
          superVotes: 50,
          totalTokensBurned: 200
        },
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
      };
      
      const result = await rewardSystem.calculateContentReward(suspiciousContent);
      
      expect(result.breakdown.antiGamingPenalty).toBeGreaterThan(0);
    });
    
    test('should analyze creator behavior patterns', async () => {
      const suspiciousCreator = {
        ...mockContent.creator,
        id: 'suspicious_creator'
      };
      
      // Add suspicious account to tracker
      rewardSystem.antiGamingTracker.suspiciousAccounts.set(suspiciousCreator.id, 3);
      
      const suspiciousContent = {
        ...mockContent,
        creator: suspiciousCreator
      };
      
      const antiGamingResult = await rewardSystem.checkAntiGamingMeasures(suspiciousContent);
      
      expect(antiGamingResult.riskLevel).toBe('medium');
    });
    
    test('should check content similarity for duplicate detection', async () => {
      // Mock content similarity detection
      rewardSystem.checkContentSimilarity = jest.fn().mockResolvedValue({
        suspicious: true,
        similarityScore: 0.95,
        matchedContent: ['content_789']
      });
      
      const result = await rewardSystem.calculateContentReward(mockContent);
      
      expect(result.breakdown.antiGamingPenalty).toBeGreaterThan(0);
    });
  });
  
  describe('Reward Distribution', () => {
    test('should distribute rewards successfully', async () => {
      const rewardsList = [
        {
          recipient: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL',
          amount: 500,
          contentId: 'content_123',
          type: 'performance'
        },
        {
          recipient: '8YKjwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL',
          amount: 300,
          contentId: 'content_456',
          type: 'performance'
        }
      ];
      
      const result = await rewardSystem.distributeRewards(rewardsList);
      
      expect(result.successful).toBeDefined();
      expect(result.totalAmount).toBe(800);
      expect(result.totalRecipients).toBe(2);
    });
    
    test('should handle insufficient treasury balance', async () => {
      // Mock low treasury balance
      rewardSystem.getTreasuryBalance = jest.fn().mockResolvedValue(100);
      
      const rewardsList = [
        {
          recipient: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL',
          amount: 500,
          contentId: 'content_123',
          type: 'performance'
        }
      ];
      
      const result = await rewardSystem.distributeRewards(rewardsList);
      
      expect(result.error).toContain('Insufficient treasury balance');
    });
    
    test('should process rewards in batches', async () => {
      const largeBatch = Array.from({ length: 150 }, (_, i) => ({
        recipient: `creator_${i}`,
        amount: 100,
        contentId: `content_${i}`,
        type: 'performance'
      }));
      
      const result = await rewardSystem.distributeRewards(largeBatch, { batchSize: 50 });
      
      // Should process in 3 batches of 50 each
      expect(result.totalAmount).toBe(15000);
    });
    
    test('should handle failed transactions gracefully', async () => {
      // Mock transaction failure
      mockConnection.simulateTransaction = jest.fn().mockResolvedValue({
        value: { err: { InstructionError: [0, 'InvalidAccountData'] } }
      });
      
      const rewardsList = [
        {
          recipient: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL',
          amount: 500,
          contentId: 'content_123',
          type: 'performance'
        }
      ];
      
      const result = await rewardSystem.distributeRewards(rewardsList);
      
      expect(result.failed.length).toBeGreaterThan(0);
      expect(result.failed[0].error).toContain('simulation failed');
    });
  });
  
  describe('Achievement System', () => {
    test('should calculate achievement rewards correctly', async () => {
      const achievement = await rewardSystem.calculateAchievementReward(
        mockCreator,
        'FIRST_VIRAL',
        { contentId: 'content_123', views: 15000 }
      );
      
      expect(achievement).toBeDefined();
      expect(achievement.type).toBe('content_milestone');
      expect(achievement.amount).toBe(REWARD_CONFIG.ACHIEVEMENT_REWARDS.CONTENT_MILESTONES.FIRST_VIRAL.reward);
      expect(achievement.description).toBe(REWARD_CONFIG.ACHIEVEMENT_REWARDS.CONTENT_MILESTONES.FIRST_VIRAL.description);
    });
    
    test('should apply creator tier multipliers to achievements', async () => {
      const verifiedCreator = { ...mockCreator, verified: true };
      
      const achievement = await rewardSystem.calculateAchievementReward(
        verifiedCreator,
        'COMMUNITY_FAVORITE',
        { likes: 150 }
      );
      
      expect(achievement.tierMultiplier).toBe(REWARD_CONFIG.CREATOR_TIERS.VERIFIED.multiplier);
      expect(achievement.amount).toBeGreaterThan(
        REWARD_CONFIG.ACHIEVEMENT_REWARDS.CONTENT_MILESTONES.COMMUNITY_FAVORITE.reward
      );
    });
    
    test('should handle unknown achievement types', async () => {
      const achievement = await rewardSystem.calculateAchievementReward(
        mockCreator,
        'UNKNOWN_ACHIEVEMENT',
        {}
      );
      
      expect(achievement).toBeNull();
    });
  });
  
  describe('Creator Dashboard', () => {
    test('should generate comprehensive creator dashboard', async () => {
      // Add some reward history
      rewardSystem.rewardHistory = [
        {
          recipient: mockCreator.id,
          amount: 500,
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          type: 'performance'
        },
        {
          recipient: mockCreator.id,
          amount: 300,
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          type: 'achievement'
        }
      ];
      
      // Mock content performance
      rewardSystem.getCreatorContentPerformance = jest.fn().mockResolvedValue({
        totalContent: 25,
        averageScore: 75.5,
        topContent: 5,
        totalViews: 50000,
        totalEngagement: 7500,
        averageEngagementRate: 0.15
      });
      
      const dashboard = await rewardSystem.getCreatorDashboard(mockCreator.id);
      
      expect(dashboard.creatorId).toBe(mockCreator.id);
      expect(dashboard.earnings.total).toBe(800);
      expect(dashboard.earnings.average).toBe(400);
      expect(dashboard.earnings.rewardsCount).toBe(2);
      expect(dashboard.performance).toBeDefined();
      expect(dashboard.predictions).toBeDefined();
      expect(dashboard.trends).toBeDefined();
    });
    
    test('should calculate creator rankings and percentiles', async () => {
      // Set up multiple creators with different earnings
      rewardSystem.creatorStats.set('creator_1', { totalEarnings: 5000 });
      rewardSystem.creatorStats.set('creator_2', { totalEarnings: 3000 });
      rewardSystem.creatorStats.set('creator_3', { totalEarnings: 1000 });
      rewardSystem.creatorStats.set(mockCreator.id, { totalEarnings: 2000 });
      
      const dashboard = await rewardSystem.getCreatorDashboard(mockCreator.id);
      
      expect(dashboard.earnings.rank).toBe(3); // Third place
      expect(dashboard.earnings.percentile).toBeGreaterThan(0);
      expect(dashboard.earnings.percentile).toBeLessThanOrEqual(100);
    });
    
    test('should generate earnings trends', async () => {
      const recentRewards = Array.from({ length: 10 }, (_, i) => ({
        recipient: mockCreator.id,
        amount: 200 + (i * 10), // Increasing trend
        timestamp: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
        type: 'performance'
      }));
      
      rewardSystem.rewardHistory = recentRewards;
      
      const dashboard = await rewardSystem.getCreatorDashboard(mockCreator.id);
      
      expect(dashboard.trends.trend).toBe('increasing');
      expect(dashboard.trends.change).toBeGreaterThan(0);
    });
    
    test('should provide earnings recommendations', async () => {
      // Mock low engagement performance
      rewardSystem.getCreatorContentPerformance = jest.fn().mockResolvedValue({
        averageEngagementRate: 0.02, // Low engagement
        totalContent: 5 // Low content count
      });
      
      const dashboard = await rewardSystem.getCreatorDashboard(mockCreator.id);
      
      expect(dashboard.recommendations).toBeDefined();
      expect(dashboard.recommendations.length).toBeGreaterThan(0);
      expect(dashboard.recommendations[0].type).toBe('engagement');
    });
  });
  
  describe('Pool Health Monitoring', () => {
    test('should monitor reward pool health', async () => {
      const poolHealth = await rewardSystem.getRewardPoolHealth();
      
      expect(poolHealth.treasuryBalance).toBeDefined();
      expect(poolHealth.pools).toBeDefined();
      expect(poolHealth.utilization).toBeDefined();
      expect(poolHealth.runway).toBeDefined();
      expect(poolHealth.metrics).toBeDefined();
    });
    
    test('should calculate pool utilization rates', async () => {
      // Set some distributed amounts
      rewardSystem.rewardPools.get('daily').distributed = 5000; // 50% utilized
      rewardSystem.rewardPools.get('weekly').distributed = 25000; // 50% utilized
      
      const poolHealth = await rewardSystem.getRewardPoolHealth();
      
      expect(poolHealth.utilization.daily).toBe(50);
      expect(poolHealth.utilization.weekly).toBe(50);
      expect(poolHealth.utilization.overall).toBeCloseTo(33.33, 1);
    });
    
    test('should assess health status correctly', async () => {
      // Mock low treasury balance
      rewardSystem.getTreasuryBalance = jest.fn().mockResolvedValue(1000);
      rewardSystem.calculateDailyBurnRate = jest.fn().mockReturnValue(500); // 2-day runway
      
      const poolHealth = await rewardSystem.getRewardPoolHealth();
      
      expect(poolHealth.runway.status).toBe('critical');
      expect(poolHealth.runway.estimatedDays).toBe(2);
    });
    
    test('should provide health recommendations', async () => {
      // Mock high utilization
      rewardSystem.rewardPools.get('daily').distributed = 9500; // 95% utilized
      
      const poolHealth = await rewardSystem.getRewardPoolHealth();
      
      expect(poolHealth.recommendations).toBeDefined();
      expect(poolHealth.recommendations.length).toBeGreaterThan(0);
    });
  });
  
  describe('Appeals System', () => {
    test('should submit reward appeals', async () => {
      const appealData = {
        creatorId: mockCreator.id,
        rewardId: 'reward_123',
        appealType: 'denied_reward',
        description: 'Content was high quality but reward was denied',
        evidence: ['screenshot_1.png', 'metrics_data.json']
      };
      
      const result = await rewardSystem.submitRewardAppeal(appealData);
      
      expect(result.success).toBe(true);
      expect(result.appealId).toBeDefined();
      expect(result.status).toBe('pending');
      expect(result.reviewDeadline).toBeDefined();
    });
    
    test('should handle disabled appeals system', async () => {
      rewardSystem.config.APPEALS.ENABLED = false;
      
      const appealData = {
        creatorId: mockCreator.id,
        rewardId: 'reward_123',
        appealType: 'incorrect_amount',
        description: 'Reward amount was too low'
      };
      
      const result = await rewardSystem.submitRewardAppeal(appealData);
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Appeals system is currently disabled');
    });
    
    test('should store appeal data correctly', async () => {
      const appealData = {
        creatorId: mockCreator.id,
        rewardId: 'reward_123',
        appealType: 'technical_error',
        description: 'Transaction failed but reward was not retried'
      };
      
      const result = await rewardSystem.submitRewardAppeal(appealData);
      const storedAppeal = rewardSystem.appealsCases.get(result.appealId);
      
      expect(storedAppeal).toBeDefined();
      expect(storedAppeal.creatorId).toBe(appealData.creatorId);
      expect(storedAppeal.status).toBe('pending');
      expect(storedAppeal.communityVotes.support).toBe(0);
    });
  });
});

describe('RewardAnalytics', () => {
  let rewardSystem;
  let analytics;
  
  beforeEach(() => {
    rewardSystem = new ContentRewardSystem();
    analytics = new RewardAnalytics(rewardSystem);
    
    // Add mock reward history
    rewardSystem.rewardHistory = [
      {
        recipient: 'creator_1',
        amount: 500,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        type: 'performance'
      },
      {
        recipient: 'creator_2',
        amount: 300,
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        type: 'achievement'
      },
      {
        recipient: 'creator_1',
        amount: 750,
        timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        type: 'performance'
      }
    ];
  });
  
  test('should generate comprehensive analytics report', () => {
    const report = analytics.generateAnalyticsReport({ timeframe: 'week' });
    
    expect(report.timeframe).toBe('week');
    expect(report.summary.totalRewards).toBe(3);
    expect(report.summary.totalAmount).toBe(1550);
    expect(report.summary.uniqueCreators).toBe(2);
    expect(report.summary.averageReward).toBeCloseTo(516.67, 1);
  });
  
  test('should analyze reward distribution by tiers', () => {
    const report = analytics.generateAnalyticsReport();
    
    expect(report.distribution.tiers).toBeDefined();
    expect(report.distribution.tiers.high).toBe(1); // 750 MLG reward
    expect(report.distribution.tiers.medium).toBe(2); // 500 and 300 MLG rewards
    expect(report.distribution.tiers.low).toBe(0);
  });
  
  test('should identify top performers', () => {
    const report = analytics.generateAnalyticsReport();
    
    expect(report.topPerformers).toBeDefined();
    expect(report.topPerformers[0].creatorId).toBe('creator_1');
    expect(report.topPerformers[0].totalEarnings).toBe(1250);
    expect(report.topPerformers[1].creatorId).toBe('creator_2');
    expect(report.topPerformers[1].totalEarnings).toBe(300);
  });
  
  test('should analyze reward trends over time', () => {
    const report = analytics.generateAnalyticsReport();
    
    expect(report.trends).toBeDefined();
    expect(report.trends.dailyData).toBeDefined();
    expect(report.trends.trend).toBeDefined();
  });
  
  test('should analyze pool utilization', () => {
    // Mock pool data
    rewardSystem.rewardPools.set('daily', {
      allocated: 10000,
      distributed: 5000,
      remaining: 5000
    });
    
    const report = analytics.generateAnalyticsReport();
    
    expect(report.poolUtilization.daily.utilization).toBe(50);
    expect(report.poolUtilization.daily.remaining).toBe(5000);
  });
});

describe('RewardUIComponents', () => {
  let rewardSystem;
  let uiComponents;
  
  beforeEach(() => {
    rewardSystem = new ContentRewardSystem();
    uiComponents = new RewardUIComponents(rewardSystem);
    
    // Mock dashboard method
    rewardSystem.getCreatorDashboard = jest.fn().mockResolvedValue({
      earnings: {
        total: 2500,
        rank: 5,
        percentile: 85
      },
      predictions: {
        nextReward: {
          estimated: 350,
          confidence: 0.8,
          timeframe: '24-48 hours'
        }
      },
      trends: {
        trend: 'increasing',
        change: 15
      },
      tier: 'established',
      history: [
        { timestamp: '2024-01-01T00:00:00Z', amount: 300, type: 'performance' },
        { timestamp: '2024-01-02T00:00:00Z', amount: 500, type: 'achievement' }
      ]
    });
    
    // Mock pool health method
    rewardSystem.getRewardPoolHealth = jest.fn().mockResolvedValue({
      runway: {
        status: 'healthy',
        estimatedDays: 45,
        dailyBurnRate: 2000
      },
      treasuryBalance: 100000,
      utilization: {
        daily: 65,
        weekly: 45,
        monthly: 30,
        overall: 46.67
      }
    });
  });
  
  test('should generate creator earnings widget', async () => {
    const widget = await uiComponents.generateEarningsWidget('creator_123');
    
    expect(widget.type).toBe('earnings_widget');
    expect(widget.data.totalEarnings).toBe(2500);
    expect(widget.data.rank).toBe(5);
    expect(widget.data.percentile).toBe(85);
    expect(widget.data.tier).toBe('established');
    expect(widget.visualizations.earningsChart).toBeDefined();
    expect(widget.visualizations.progressBar).toBeDefined();
  });
  
  test('should generate earnings chart data', () => {
    const history = [
      { timestamp: '2024-01-01T00:00:00Z', amount: 300, type: 'performance' },
      { timestamp: '2024-01-02T00:00:00Z', amount: 500, type: 'achievement' }
    ];
    
    const chartData = uiComponents.generateEarningsChartData(history);
    
    expect(chartData).toHaveLength(2);
    expect(chartData[0].amount).toBe(300);
    expect(chartData[0].type).toBe('performance');
    expect(chartData[0].date).toBeDefined();
  });
  
  test('should calculate next tier thresholds', () => {
    expect(uiComponents.calculateNextTierThreshold('standard')).toBe(1000);
    expect(uiComponents.calculateNextTierThreshold('established')).toBe(25000);
    expect(uiComponents.calculateNextTierThreshold('verified')).toBeNull(); // Highest tier
  });
  
  test('should generate pool status widget', async () => {
    const widget = await uiComponents.generatePoolStatusWidget();
    
    expect(widget.type).toBe('pool_status_widget');
    expect(widget.data.healthStatus).toBe('healthy');
    expect(widget.data.treasuryBalance).toBe(100000);
    expect(widget.data.estimatedRunway).toBe(45);
    expect(widget.alerts).toBeDefined();
  });
  
  test('should generate appropriate pool alerts', async () => {
    // Mock critical pool health
    rewardSystem.getRewardPoolHealth = jest.fn().mockResolvedValue({
      runway: { status: 'critical' },
      utilization: { overall: 90 }
    });
    
    const widget = await uiComponents.generatePoolStatusWidget();
    
    expect(widget.alerts).toBeDefined();
    expect(widget.alerts.length).toBeGreaterThan(0);
    expect(widget.alerts[0].type).toBe('error');
  });
});

describe('Integration Tests', () => {
  let rewardSystem;
  
  beforeEach(() => {
    rewardSystem = new ContentRewardSystem();
    
    // Mock dependencies
    rewardSystem.getTreasuryBalance = jest.fn().mockResolvedValue(1000000);
    rewardSystem.getTreasuryTokenAccount = jest.fn().mockResolvedValue(new PublicKey('11111111111111111111111111111111'));
    rewardSystem.getTreasuryAuthority = jest.fn().mockResolvedValue(new PublicKey('11111111111111111111111111111111'));
    rewardSystem.getTreasuryKeypair = jest.fn().mockResolvedValue(Keypair.generate());
  });
  
  test('should handle end-to-end reward flow', async () => {
    // 1. Calculate reward
    const rewardResult = await rewardSystem.calculateContentReward(mockContent);
    expect(rewardResult.eligible).toBe(true);
    
    // 2. Distribute rewards
    const rewardsList = [{
      recipient: mockContent.creator.walletAddress,
      amount: rewardResult.totalReward,
      contentId: mockContent.id,
      type: 'performance'
    }];
    
    const distributionResult = await rewardSystem.distributeRewards(rewardsList);
    expect(distributionResult.successful.length).toBe(1);
    
    // 3. Check creator dashboard
    const dashboard = await rewardSystem.getCreatorDashboard(mockContent.creator.id);
    expect(dashboard).toBeDefined();
    
    // 4. Check pool health
    const poolHealth = await rewardSystem.getRewardPoolHealth();
    expect(poolHealth.runway.status).toBeDefined();
  });
  
  test('should handle multiple creators and reward types', async () => {
    const creators = [
      { ...mockCreator, id: 'creator_1', walletAddress: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL' },
      { ...mockCreator, id: 'creator_2', walletAddress: '8YKjwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL' },
      { ...mockCreator, id: 'creator_3', walletAddress: '9ZLkwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL' }
    ];
    
    const rewards = [];
    
    // Performance rewards
    for (const creator of creators) {
      const content = { ...mockContent, creator };
      const rewardResult = await rewardSystem.calculateContentReward(content);
      if (rewardResult.eligible) {
        rewards.push({
          recipient: creator.walletAddress,
          amount: rewardResult.totalReward,
          contentId: `content_${creator.id}`,
          type: 'performance'
        });
      }
    }
    
    // Achievement rewards
    for (const creator of creators) {
      const achievement = await rewardSystem.calculateAchievementReward(
        creator,
        'COMMUNITY_FAVORITE',
        { likes: 150 }
      );
      if (achievement) {
        rewards.push({
          recipient: creator.walletAddress,
          amount: achievement.amount,
          contentId: `achievement_${creator.id}`,
          type: 'achievement'
        });
      }
    }
    
    const distributionResult = await rewardSystem.distributeRewards(rewards);
    expect(distributionResult.totalRecipients).toBeGreaterThan(0);
    expect(distributionResult.totalAmount).toBeGreaterThan(0);
  });
  
  test('should maintain system consistency under load', async () => {
    const iterations = 10;
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const content = {
        ...mockContent,
        id: `content_${i}`,
        creator: { ...mockContent.creator, id: `creator_${i}` }
      };
      
      const rewardResult = await rewardSystem.calculateContentReward(content);
      results.push(rewardResult);
    }
    
    // Check that all calculations succeeded
    expect(results.every(r => r.eligible !== undefined)).toBe(true);
    
    // Check metrics consistency
    const metrics = rewardSystem.getMetrics ? rewardSystem.getMetrics() : rewardSystem.metrics;
    expect(metrics).toBeDefined();
  });
});

describe('Configuration and Customization', () => {
  test('should accept custom configuration', () => {
    const customConfig = {
      REWARD_POOLS: {
        DAILY: { TOTAL_ALLOCATION: 20000 }
      },
      PERFORMANCE_REWARDS: {
        ENGAGEMENT: { VIRAL_THRESHOLD: 20000 }
      }
    };
    
    const rewardSystem = new ContentRewardSystem(null, customConfig);
    
    expect(rewardSystem.config.REWARD_POOLS.DAILY.TOTAL_ALLOCATION).toBe(20000);
    expect(rewardSystem.config.PERFORMANCE_REWARDS.ENGAGEMENT.VIRAL_THRESHOLD).toBe(20000);
  });
  
  test('should merge custom config with defaults', () => {
    const customConfig = {
      CREATOR_TIERS: {
        VERIFIED: { multiplier: 2.0 } // Override verified multiplier
      }
    };
    
    const rewardSystem = new ContentRewardSystem(null, customConfig);
    
    // Should use custom value
    expect(rewardSystem.config.CREATOR_TIERS.VERIFIED.multiplier).toBe(2.0);
    
    // Should retain default values
    expect(rewardSystem.config.CREATOR_TIERS.VERIFIED.baseBonus).toBe(REWARD_CONFIG.CREATOR_TIERS.VERIFIED.baseBonus);
    expect(rewardSystem.config.MLG_TOKEN_ADDRESS).toBe(REWARD_CONFIG.MLG_TOKEN_ADDRESS);
  });
  
  test('should validate critical configuration values', () => {
    expect(REWARD_CONFIG.MLG_TOKEN_ADDRESS).toBe('7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL');
    expect(REWARD_CONFIG.DISTRIBUTION.MINIMUM_PAYOUT).toBeGreaterThan(0);
    expect(REWARD_CONFIG.ANTI_GAMING.MINIMUM_ACCOUNT_AGE_DAYS).toBeGreaterThan(0);
    expect(REWARD_CONFIG.APPEALS.ENABLED).toBe(true);
  });
});