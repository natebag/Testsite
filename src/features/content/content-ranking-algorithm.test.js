/**
 * Content Ranking Algorithm Tests - Sub-task 4.4
 * 
 * Comprehensive test suite for the MLG.clan content ranking algorithm.
 * Tests all ranking modes, gaming-specific features, MLG token integration,
 * and performance optimization with realistic gaming scenarios.
 * 
 * @author Claude Code - Production General Purpose Agent
 * @version 1.0.0
 */

import { 
  ContentRankingAlgorithm, 
  RankingModes, 
  GamingRankingUtils,
  ContentRecommendations,
  RANKING_CONFIG 
} from './content-ranking-algorithm.js';

describe('ContentRankingAlgorithm', () => {
  let algorithm;
  let mockContent;
  
  beforeEach(() => {
    algorithm = new ContentRankingAlgorithm();
    mockContent = createMockContent();
  });
  
  afterEach(() => {
    // Clear any caches
    algorithm.scoreCache.clear();
  });

  describe('Core Scoring Functions', () => {
    test('calculateVoteScore should handle MLG token weighting correctly', () => {
      const content = {
        id: 'test-1',
        mlgVotes: {
          upvotes: 10,
          downvotes: 2,
          superVotes: 3,
          totalTokensBurned: 25 // High token burn = higher weighting
        }
      };

      const voteScore = algorithm.calculateVoteScore(content);
      
      expect(voteScore).toBeGreaterThan(0);
      expect(voteScore).toBeGreaterThan(10); // Base upvotes should be multiplied
    });

    test('calculateVoteScore should apply progressive token pricing', () => {
      const lowTokenContent = {
        id: 'test-low',
        mlgVotes: {
          upvotes: 5,
          downvotes: 0,
          superVotes: 0,
          totalTokensBurned: 5 // 1 token per vote
        }
      };

      const highTokenContent = {
        id: 'test-high',
        mlgVotes: {
          upvotes: 5,
          downvotes: 0,
          superVotes: 0,
          totalTokensBurned: 20 // 4 tokens per vote average
        }
      };

      const lowScore = algorithm.calculateVoteScore(lowTokenContent);
      const highScore = algorithm.calculateVoteScore(highTokenContent);
      
      expect(highScore).toBeGreaterThan(lowScore);
    });

    test('calculateEngagementScore should factor in all engagement metrics', () => {
      const content = {
        id: 'test-engagement',
        views: 1000,
        likes: 100,
        comments: 50,
        shares: 25,
        contentType: 'video_clip',
        duration: 120,
        analytics: {
          watchTime: 80000, // 80 seconds average watch time
          totalViews: 1000,
          completionRate: 0.75,
          clickThroughRate: 0.15
        }
      };

      const engagementScore = algorithm.calculateEngagementScore(content);
      
      expect(engagementScore).toBeGreaterThan(0);
      expect(engagementScore).toBeGreaterThan(100); // Should be significant due to good metrics
    });

    test('calculateTimeScore should decay properly for different modes', () => {
      const oldContent = {
        id: 'old',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 24 hours ago
      };

      const newContent = {
        id: 'new',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago
      };

      const oldTrendingScore = algorithm.calculateTimeScore(oldContent, 'trending');
      const newTrendingScore = algorithm.calculateTimeScore(newContent, 'trending');
      const oldTopScore = algorithm.calculateTimeScore(oldContent, 'top');
      
      expect(newTrendingScore).toBeGreaterThan(oldTrendingScore);
      expect(oldTopScore).toBeGreaterThan(oldTrendingScore); // Top mode has less time penalty
    });

    test('calculateGamingScore should apply game popularity multipliers', () => {
      const fortniteContent = {
        id: 'fortnite',
        game: 'Fortnite',
        category: 'highlights',
        gameMode: 'ranked',
        tags: ['competitive']
      };

      const unpopularGameContent = {
        id: 'unpopular',
        game: 'Unknown Game',
        category: 'highlights',
        gameMode: 'casual'
      };

      const fortniteScore = algorithm.calculateGamingScore(fortniteContent);
      const unpopularScore = algorithm.calculateGamingScore(unpopularGameContent);
      
      expect(fortniteScore).toBeGreaterThan(unpopularScore);
    });

    test('calculateUserReputationScore should boost verified creators', () => {
      const regularUser = {
        id: 'regular',
        creator: {
          clanStatus: 'member',
          achievementLevel: 'bronze',
          gamerscore: 500,
          verified: false
        }
      };

      const verifiedUser = {
        id: 'verified',
        creator: {
          clanStatus: 'leader',
          achievementLevel: 'diamond',
          gamerscore: 5000,
          verified: true
        }
      };

      const regularScore = algorithm.calculateUserReputationScore(regularUser);
      const verifiedScore = algorithm.calculateUserReputationScore(verifiedUser);
      
      expect(verifiedScore).toBeGreaterThan(regularScore);
      expect(verifiedScore).toBeGreaterThan(1.0); // Should be a multiplier > 1
    });

    test('calculateControversyScore should identify controversial content', () => {
      const balancedContent = {
        id: 'balanced',
        mlgVotes: {
          upvotes: 50,
          downvotes: 50 // Perfect 50/50 split
        }
      };

      const unbalancedContent = {
        id: 'unbalanced',
        mlgVotes: {
          upvotes: 90,
          downvotes: 10 // 90/10 split
        }
      };

      const balancedControversy = algorithm.calculateControversyScore(balancedContent);
      const unbalancedControversy = algorithm.calculateControversyScore(unbalancedContent);
      
      expect(balancedControversy).toBeGreaterThan(unbalancedControversy);
    });
  });

  describe('Composite Scoring', () => {
    test('calculateContentScore should return comprehensive score object', () => {
      const content = createRealisticGameContent();
      const result = algorithm.calculateContentScore(content, { mode: 'hot' });

      expect(result).toHaveProperty('contentId');
      expect(result).toHaveProperty('compositeScore');
      expect(result).toHaveProperty('normalizedScore');
      expect(result).toHaveProperty('components');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('insights');
      
      expect(result.normalizedScore).toBeGreaterThanOrEqual(0);
      expect(result.normalizedScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.insights)).toBe(true);
    });

    test('calculateContentScore should use caching', () => {
      const content = createRealisticGameContent();
      
      const startTime = performance.now();
      const result1 = algorithm.calculateContentScore(content, { mode: 'hot' });
      const firstCallTime = performance.now() - startTime;
      
      const startTime2 = performance.now();
      const result2 = algorithm.calculateContentScore(content, { mode: 'hot' });
      const secondCallTime = performance.now() - startTime2;
      
      expect(result1.compositeScore).toBe(result2.compositeScore);
      expect(secondCallTime).toBeLessThan(firstCallTime); // Cache should make it faster
      expect(algorithm.metrics.cacheHits).toBe(1);
    });

    test('different modes should produce different scores', () => {
      const content = createRealisticGameContent();
      
      const trendingScore = algorithm.calculateContentScore(content, { mode: 'trending' });
      const hotScore = algorithm.calculateContentScore(content, { mode: 'hot' });
      const topScore = algorithm.calculateContentScore(content, { mode: 'top' });
      const newScore = algorithm.calculateContentScore(content, { mode: 'new' });
      
      // Scores should be different for different modes
      expect(trendingScore.compositeScore).not.toBe(hotScore.compositeScore);
      expect(hotScore.compositeScore).not.toBe(topScore.compositeScore);
      expect(topScore.compositeScore).not.toBe(newScore.compositeScore);
    });
  });

  describe('Content Ranking', () => {
    test('rankContent should sort content by score', () => {
      const contentList = [
        createMockContentWithScore('low', 10),
        createMockContentWithScore('high', 100),
        createMockContentWithScore('medium', 50)
      ];

      const ranked = algorithm.rankContent(contentList, { mode: 'hot' });
      
      expect(ranked.length).toBe(3);
      expect(ranked[0].id).toBe('high');
      expect(ranked[1].id).toBe('medium');
      expect(ranked[2].id).toBe('low');
      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].rank).toBe(2);
      expect(ranked[2].rank).toBe(3);
    });

    test('rankContent should apply time window filters', () => {
      const recentContent = createMockContentWithAge('recent', 1); // 1 hour ago
      const oldContent = createMockContentWithAge('old', 50); // 50 hours ago

      const contentList = [recentContent, oldContent];
      const ranked = algorithm.rankContent(contentList, { 
        mode: 'trending', 
        timeWindowHours: 24 
      });
      
      expect(ranked.length).toBe(1);
      expect(ranked[0].id).toBe('recent');
    });

    test('rankContent should apply quality threshold for new mode', () => {
      const highQuality = createMockContentWithQuality('high', 0.8);
      const lowQuality = createMockContentWithQuality('low', 0.1);

      const contentList = [highQuality, lowQuality];
      const ranked = algorithm.rankContent(contentList, { mode: 'new' });
      
      expect(ranked.length).toBe(1);
      expect(ranked[0].id).toBe('high');
    });

    test('rankContent should respect limit parameter', () => {
      const contentList = Array.from({ length: 100 }, (_, i) => 
        createMockContentWithScore(`content-${i}`, i));

      const ranked = algorithm.rankContent(contentList, { limit: 10 });
      
      expect(ranked.length).toBe(10);
    });
  });

  describe('Gaming-Specific Features', () => {
    test('esports content should get boosted score', () => {
      const regularContent = {
        id: 'regular',
        game: 'Fortnite',
        category: 'highlights',
        tags: ['gaming'],
        mlgVotes: { upvotes: 10, downvotes: 0, totalTokensBurned: 10 },
        views: 1000,
        likes: 100,
        createdAt: new Date().toISOString()
      };

      const esportsContent = {
        ...regularContent,
        id: 'esports',
        tags: ['esports', 'tournament', 'competitive'],
        gameMode: 'tournament'
      };

      const regularScore = algorithm.calculateContentScore(regularContent);
      const esportsScore = algorithm.calculateContentScore(esportsContent);
      
      expect(esportsScore.compositeScore).toBeGreaterThan(regularScore.compositeScore);
    });

    test('platform trending should be detected', () => {
      // Mock the platform trending detection
      algorithm.isPlatformTrending = jest.fn().mockReturnValue(true);
      
      const content = {
        id: 'trending-platform',
        platform: 'xbox',
        game: 'Halo',
        category: 'highlights'
      };

      const gamingScore = algorithm.calculateGamingScore(content);
      expect(gamingScore).toBeGreaterThan(1.0); // Should include platform boost
      expect(algorithm.isPlatformTrending).toHaveBeenCalledWith('xbox', 'Halo');
    });
  });

  describe('Performance and Optimization', () => {
    test('batchCalculateScores should process multiple items', async () => {
      const contentList = Array.from({ length: 50 }, (_, i) => 
        createMockContentWithScore(`batch-${i}`, i));

      const results = await algorithm.batchCalculateScores(contentList, { batchSize: 10 });
      
      expect(results.length).toBe(50);
      expect(results[0]).toHaveProperty('compositeScore');
    });

    test('metrics should be tracked correctly', () => {
      const content = createRealisticGameContent();
      
      const initialCalculations = algorithm.metrics.calculationsPerformed;
      algorithm.calculateContentScore(content);
      
      expect(algorithm.metrics.calculationsPerformed).toBe(initialCalculations + 1);
      expect(algorithm.metrics.averageCalculationTime).toBeGreaterThan(0);
      expect(algorithm.metrics.lastUpdateTime).toBeTruthy();
    });

    test('cache should respect TTL', (done) => {
      const content = createRealisticGameContent();
      
      // Override cache TTL for testing
      algorithm.config.CACHE.SCORE_TTL_SECONDS = 0.1; // 100ms
      
      const result1 = algorithm.calculateContentScore(content);
      expect(algorithm.scoreCache.size).toBe(1);
      
      setTimeout(() => {
        expect(algorithm.scoreCache.size).toBe(0); // Should be cleared
        done();
      }, 150);
    });
  });

  describe('A/B Testing', () => {
    test('A/B testing should assign consistent groups', () => {
      const content1 = { id: 'test-1' };
      const content2 = { id: 'test-2' };
      
      const group1a = algorithm.getABTestGroup(content1);
      const group1b = algorithm.getABTestGroup(content1);
      const group2 = algorithm.getABTestGroup(content2);
      
      expect(group1a).toBe(group1b); // Same content should get same group
      expect(['control', 'variant_a', 'variant_b']).toContain(group1a);
      expect(['control', 'variant_a', 'variant_b']).toContain(group2);
    });

    test('A/B testing should affect scores when enabled', () => {
      const content = createRealisticGameContent();
      
      // Clear cache to ensure fresh calculations
      algorithm.scoreCache.clear();
      
      const controlScore = algorithm.calculateContentScore(content, { 
        abTestGroup: 'control',
        forceRecalculate: true 
      });
      const variantScore = algorithm.calculateContentScore(content, { 
        abTestGroup: 'variant_a',
        forceRecalculate: true 
      });
      
      expect(controlScore.compositeScore).not.toBe(variantScore.compositeScore);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing content data gracefully', () => {
      const incompleteContent = { 
        id: 'incomplete',
        createdAt: new Date().toISOString()
      };
      
      const result = algorithm.calculateContentScore(incompleteContent);
      
      expect(result).toHaveProperty('contentId');
      expect(result.compositeScore).toBeGreaterThanOrEqual(0);
      expect(result.normalizedScore).toBeGreaterThanOrEqual(0);
    });

    test('should handle calculation errors with default scores', () => {
      const content = createRealisticGameContent();
      
      // Force an error in vote calculation
      algorithm.calculateVoteScore = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      
      const result = algorithm.calculateContentScore(content);
      
      expect(result.metadata.error).toBe(true);
      expect(result.compositeScore).toBe(0);
    });
  });

  describe('Score Insights', () => {
    test('should generate relevant insights for high-performing content', () => {
      const highPerformingContent = {
        id: 'high-performer',
        views: 10000,
        likes: 1500,
        comments: 200,
        mlgVotes: { upvotes: 100, downvotes: 5, totalTokensBurned: 200 },
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
      };

      const result = algorithm.calculateContentScore(highPerformingContent);
      
      expect(result.insights.length).toBeGreaterThan(0);
      expect(result.insights.some(insight => insight.type === 'positive')).toBe(true);
      expect(result.insights.some(insight => insight.category === 'votes')).toBe(true);
    });

    test('should identify trending content', () => {
      const trendingContent = {
        id: 'trending',
        views: 5000,
        likes: 500,
        mlgVotes: { upvotes: 50, downvotes: 2, totalTokensBurned: 100 },
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() // Very recent
      };

      const result = algorithm.calculateContentScore(trendingContent);
      
      expect(result.insights.some(insight => insight.type === 'trending')).toBe(true);
    });
  });
});

describe('RankingModes', () => {
  let algorithm;
  let rankingModes;
  let mockContentList;

  beforeEach(() => {
    algorithm = new ContentRankingAlgorithm();
    rankingModes = new RankingModes(algorithm);
    mockContentList = createMockContentList();
  });

  test('getTrending should use trending mode configuration', () => {
    const spy = jest.spyOn(algorithm, 'rankContent');
    
    rankingModes.getTrending(mockContentList, { limit: 20 });
    
    expect(spy).toHaveBeenCalledWith(mockContentList, {
      limit: 20,
      mode: 'trending',
      timeWindowHours: 24
    });
  });

  test('getHot should use hot mode configuration', () => {
    const spy = jest.spyOn(algorithm, 'rankContent');
    
    rankingModes.getHot(mockContentList);
    
    expect(spy).toHaveBeenCalledWith(mockContentList, {
      mode: 'hot',
      timeWindowHours: 48
    });
  });

  test('getTop should use top mode with no time window', () => {
    const spy = jest.spyOn(algorithm, 'rankContent');
    
    rankingModes.getTop(mockContentList);
    
    expect(spy).toHaveBeenCalledWith(mockContentList, {
      mode: 'top',
      timeWindowHours: null
    });
  });

  test('getControversial should use controversial mode', () => {
    const spy = jest.spyOn(algorithm, 'rankContent');
    
    rankingModes.getControversial(mockContentList);
    
    expect(spy).toHaveBeenCalledWith(mockContentList, {
      mode: 'controversial',
      timeWindowHours: 168
    });
  });
});

describe('GamingRankingUtils', () => {
  test('getGameSpecificTrending should filter by game', () => {
    const contentList = [
      { id: '1', game: 'Fortnite', views: 1000, createdAt: new Date().toISOString(), mlgVotes: { upvotes: 5, downvotes: 0, totalTokensBurned: 5 } },
      { id: '2', game: 'Call of Duty', views: 2000, createdAt: new Date().toISOString(), mlgVotes: { upvotes: 8, downvotes: 0, totalTokensBurned: 8 } },
      { id: '3', game: 'Fortnite', views: 1500, createdAt: new Date().toISOString(), mlgVotes: { upvotes: 6, downvotes: 0, totalTokensBurned: 6 } }
    ];

    const fortniteResults = GamingRankingUtils.getGameSpecificTrending(contentList, 'Fortnite');
    
    expect(fortniteResults.length).toBe(2);
    expect(fortniteResults.every(content => content.game === 'Fortnite')).toBe(true);
  });

  test('getCompetitiveContent should filter competitive content', () => {
    const contentList = [
      { id: '1', gameMode: 'ranked', tags: ['competitive'] },
      { id: '2', gameMode: 'casual', tags: ['fun'] },
      { id: '3', tags: ['esports', 'tournament'] }
    ];

    const competitiveResults = GamingRankingUtils.getCompetitiveContent(contentList);
    
    expect(competitiveResults.length).toBe(2);
    expect(competitiveResults.find(c => c.id === '2')).toBeUndefined();
  });

  test('getCasualContent should filter casual content', () => {
    const contentList = [
      { id: '1', gameMode: 'casual', tags: ['funny'] },
      { id: '2', gameMode: 'ranked', tags: ['competitive'] },
      { id: '3', tags: ['meme', 'creative'] }
    ];

    const casualResults = GamingRankingUtils.getCasualContent(contentList);
    
    expect(casualResults.length).toBe(2);
    expect(casualResults.find(c => c.id === '2')).toBeUndefined();
  });
});

describe('ContentRecommendations', () => {
  let algorithm;
  let recommendations;

  beforeEach(() => {
    algorithm = new ContentRankingAlgorithm();
    recommendations = new ContentRecommendations(algorithm);
  });

  test('getPersonalizedRecommendations should filter by user preferences', () => {
    const user = {
      preferredGames: ['fortnite', 'call-of-duty'],
      preferredPlatforms: ['pc', 'xbox']
    };

    const contentList = [
      { id: '1', game: 'fortnite', platform: 'pc', createdAt: new Date().toISOString(), mlgVotes: { upvotes: 5 } },
      { id: '2', game: 'minecraft', platform: 'mobile', createdAt: new Date().toISOString(), mlgVotes: { upvotes: 3 } },
      { id: '3', game: 'call-of-duty', platform: 'xbox', createdAt: new Date().toISOString(), mlgVotes: { upvotes: 7 } }
    ];

    const results = recommendations.getPersonalizedRecommendations(user, contentList);
    
    expect(results.length).toBe(2);
    expect(results.find(c => c.id === '2')).toBeUndefined(); // Minecraft should be filtered out
  });

  test('getSimilarContent should calculate similarity correctly', () => {
    const baseContent = {
      id: 'base',
      game: 'Fortnite',
      platform: 'pc',
      category: 'highlights',
      tags: ['battle-royale', 'victory']
    };

    const contentList = [
      {
        id: 'similar',
        game: 'Fortnite',
        platform: 'pc',
        category: 'highlights',
        tags: ['battle-royale', 'clutch']
      },
      {
        id: 'different',
        game: 'Minecraft',
        platform: 'mobile',
        category: 'creative',
        tags: ['building']
      }
    ];

    const results = recommendations.getSimilarContent(baseContent, contentList);
    
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('similar');
    expect(results[0].similarityScore).toBeGreaterThan(0.5);
  });

  test('calculateContentSimilarity should weight factors correctly', () => {
    const content1 = {
      game: 'Fortnite',
      platform: 'pc',
      category: 'highlights',
      tags: ['battle-royale', 'victory']
    };

    const content2 = {
      game: 'Fortnite', // Same game (0.4)
      platform: 'pc',   // Same platform (0.2)
      category: 'highlights', // Same category (0.2)
      tags: ['battle-royale'] // 50% tag overlap (0.1)
    };

    const similarity = recommendations.calculateContentSimilarity(content1, content2);
    
    expect(similarity).toBeCloseTo(0.9, 1); // 0.4 + 0.2 + 0.2 + 0.1
  });
});

describe('Integration Tests', () => {
  test('full MLG.clan content ranking workflow', () => {
    const algorithm = new ContentRankingAlgorithm();
    const contentList = createMLGClanContentScenario();

    // Test different ranking modes
    const trending = algorithm.rankContent(contentList, { mode: 'trending', limit: 5 });
    const hot = algorithm.rankContent(contentList, { mode: 'hot', limit: 5 });
    const top = algorithm.rankContent(contentList, { mode: 'top', limit: 5 });

    expect(trending.length).toBeLessThanOrEqual(5);
    expect(hot.length).toBeLessThanOrEqual(5);
    expect(top.length).toBeLessThanOrEqual(5);

    // Trending should favor recent content
    expect(trending[0].createdAt).toBeDefined();
    
    // All should have ranking metadata
    trending.forEach(content => {
      expect(content.rank).toBeDefined();
      expect(content.rankingScore).toBeDefined();
      expect(content.scoreComponents).toBeDefined();
    });
  });

  test('MLG token voting integration', () => {
    const algorithm = new ContentRankingAlgorithm();
    
    // Create content with significantly different token burn patterns
    const lowTokenContent = {
      id: 'low-token',
      mlgVotes: { upvotes: 10, downvotes: 0, totalTokensBurned: 10 }, // 1 token per vote
      views: 1000,
      likes: 50,
      createdAt: new Date().toISOString()
    };
    
    const highTokenContent = {
      id: 'high-token',
      mlgVotes: { upvotes: 10, downvotes: 0, totalTokensBurned: 40 }, // 4 tokens per vote
      views: 1000,
      likes: 50,
      createdAt: new Date().toISOString()
    };

    const lowScore = algorithm.calculateContentScore(lowTokenContent);
    const highScore = algorithm.calculateContentScore(highTokenContent);

    // Higher token burn should result in higher vote score component
    expect(highScore.components.votes).toBeGreaterThan(lowScore.components.votes);
    
    // Both should have insights
    expect(lowScore.insights.length).toBeGreaterThan(0);
    expect(highScore.insights.length).toBeGreaterThan(0);
  });

  test('gaming community behavior simulation', () => {
    const algorithm = new ContentRankingAlgorithm();
    
    // Simulate realistic gaming content scenarios
    const esportsHighlight = createEsportsContent();
    const casualClip = createCasualContent();
    const tutorialGuide = createTutorialContent();

    const contentList = [esportsHighlight, casualClip, tutorialGuide];
    
    // Test competitive ranking
    const competitive = GamingRankingUtils.getCompetitiveContent(contentList);
    expect(competitive.length).toBeGreaterThan(0);
    expect(competitive[0].id).toBe(esportsHighlight.id);

    // Test casual ranking
    const casual = GamingRankingUtils.getCasualContent(contentList);
    expect(casual.some(c => c.id === casualClip.id)).toBe(true);
  });
});

describe('Performance Benchmarks', () => {
  test('should handle large content sets efficiently', async () => {
    const algorithm = new ContentRankingAlgorithm();
    const largeContentList = Array.from({ length: 1000 }, (_, i) => 
      createRealisticGameContent(`content-${i}`));

    const startTime = performance.now();
    const results = await algorithm.batchCalculateScores(largeContentList);
    const endTime = performance.now();

    expect(results.length).toBe(1000);
    expect(endTime - startTime).toBeLessThan(10000); // Should complete in under 10 seconds
  });

  test('caching should improve performance significantly', () => {
    const algorithm = new ContentRankingAlgorithm();
    const content = createRealisticGameContent();

    // First calculation (no cache)
    const start1 = performance.now();
    algorithm.calculateContentScore(content);
    const time1 = performance.now() - start1;

    // Second calculation (cached)
    const start2 = performance.now();
    algorithm.calculateContentScore(content);
    const time2 = performance.now() - start2;

    expect(time2).toBeLessThan(time1 * 0.5); // Should be at least 50% faster
  });
});

// Helper functions for creating test data

function createMockContent(id = 'test') {
  return {
    id,
    userId: 'user-123',
    contentType: 'video_clip',
    title: 'Test Gaming Content',
    game: 'Fortnite',
    platform: 'pc',
    category: 'highlights',
    tags: ['gaming', 'test'],
    views: 100,
    likes: 10,
    comments: 5,
    mlgVotes: {
      upvotes: 5,
      downvotes: 1,
      superVotes: 0,
      totalTokensBurned: 7
    },
    createdAt: new Date().toISOString(),
    creator: {
      clanStatus: 'member',
      achievementLevel: 'bronze',
      gamerscore: 1000,
      verified: false
    }
  };
}

function createRealisticGameContent(id = 'realistic') {
  return {
    id,
    userId: 'user-456',
    contentType: 'video_clip',
    title: 'Epic Fortnite Victory Royale',
    description: 'Amazing clutch play in ranked battle royale',
    game: 'Fortnite',
    platform: 'pc',
    category: 'highlights',
    gameMode: 'ranked',
    tags: ['battle-royale', 'victory', 'clutch'],
    views: 2500,
    likes: 200,
    comments: 50,
    shares: 25,
    duration: 120,
    mlgVotes: {
      upvotes: 35,
      downvotes: 3,
      superVotes: 5,
      totalTokensBurned: 85
    },
    analytics: {
      watchTime: 75000,
      totalViews: 2500,
      completionRate: 0.65,
      clickThroughRate: 0.12
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    creator: {
      clanStatus: 'officer',
      achievementLevel: 'gold',
      gamerscore: 3500,
      verified: false
    }
  };
}

function createMockContentWithScore(id, baseScore) {
  const content = createMockContent(id);
  content.views = baseScore * 10;
  content.likes = baseScore;
  content.mlgVotes.upvotes = Math.floor(baseScore / 2);
  return content;
}

function createMockContentWithAge(id, hoursAgo) {
  const content = createMockContent(id);
  content.createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
  return content;
}

function createMockContentWithQuality(id, qualityScore) {
  const content = createMockContent(id);
  content.qualityScore = qualityScore;
  return content;
}

function createMockContentWithMLGVotes(votes, totalTokens) {
  const content = createMockContent();
  content.mlgVotes = {
    upvotes: votes,
    downvotes: 0,
    superVotes: 0,
    totalTokensBurned: totalTokens
  };
  return content;
}

function createMockContentList() {
  return [
    createMockContent('content-1'),
    createMockContent('content-2'),
    createMockContent('content-3')
  ];
}

function createMLGClanContentScenario() {
  return [
    {
      id: 'viral-clip',
      game: 'Fortnite',
      category: 'highlights',
      views: 10000,
      likes: 800,
      mlgVotes: { upvotes: 100, downvotes: 5, totalTokensBurned: 250 },
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      creator: { verified: true, clanStatus: 'leader' }
    },
    {
      id: 'tutorial-guide',
      game: 'Valorant',
      category: 'tutorials',
      views: 3000,
      likes: 150,
      mlgVotes: { upvotes: 40, downvotes: 2, totalTokensBurned: 95 },
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      creator: { verified: false, achievementLevel: 'platinum' }
    },
    {
      id: 'esports-highlight',
      game: 'League of Legends',
      category: 'tournament',
      gameMode: 'tournament',
      tags: ['esports', 'championship'],
      views: 5000,
      likes: 300,
      mlgVotes: { upvotes: 60, downvotes: 1, totalTokensBurned: 180 },
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      creator: { verified: true, clanStatus: 'founder' }
    }
  ];
}

function createEsportsContent() {
  return {
    id: 'esports-content',
    game: 'Counter-Strike',
    category: 'tournament',
    gameMode: 'tournament',
    tags: ['esports', 'competitive', 'championship'],
    views: 8000,
    mlgVotes: { upvotes: 80, downvotes: 2, totalTokensBurned: 300 }
  };
}

function createCasualContent() {
  return {
    id: 'casual-content',
    game: 'Minecraft',
    category: 'funny',
    gameMode: 'creative',
    tags: ['funny', 'casual', 'meme'],
    views: 2000,
    mlgVotes: { upvotes: 20, downvotes: 1, totalTokensBurned: 35 }
  };
}

function createTutorialContent() {
  return {
    id: 'tutorial-content',
    game: 'Apex Legends',
    category: 'tutorials',
    gameMode: 'ranked',
    tags: ['guide', 'tips', 'strategy'],
    views: 4000,
    mlgVotes: { upvotes: 50, downvotes: 3, totalTokensBurned: 120 }
  };
}