# MLG.clan Content Ranking Algorithm

A sophisticated multi-factor ranking system for the MLG.clan gaming community platform that calculates content scores based on votes, engagement, and gaming-specific metrics. This algorithm integrates seamlessly with the MLG token voting system and provides real-time content discovery.

## Features

### 🚀 Multi-Factor Scoring System
- **Vote-based scoring** with MLG token progressive pricing (1,2,3,4 MLG tokens)
- **Engagement metrics** (views, likes, comments, shares, watch time)
- **Time decay factors** for trending vs evergreen content
- **Gaming-specific scoring** (skill level, competitive relevance, game popularity)
- **User reputation influence** (clan status, achievement level, verified creators)

### 🎮 Gaming Community Focus
- **Game-specific trending** with popularity multipliers
- **Competitive vs casual content** weighting
- **Esports/tournament content** boosting
- **Platform cross-referencing** (Xbox, PlayStation, PC trends)
- **Gaming achievement integration**

### 📊 Multiple Ranking Modes
- **Trending**: Time-sensitive viral content (6-hour half-life)
- **Hot**: Sustained high engagement (12-hour half-life)
- **Top**: All-time best content with quality focus
- **New**: Recent content with quality filtering
- **Controversial**: Mixed sentiment high-engagement content

### ⚡ Performance Optimization
- **Intelligent caching** with 5-minute TTL
- **Batch processing** for large content sets
- **Real-time score updates** for high-traffic content
- **Background processing** with configurable intervals

### 🔬 Advanced Features
- **A/B testing support** with configurable variants
- **Comprehensive analytics** with score insights
- **Personalized recommendations** based on user preferences
- **Similar content discovery** with weighted similarity scoring

## Quick Start

### Basic Usage

```javascript
import { ContentRankingAlgorithm, rankingModes } from './content-ranking-algorithm.js';

// Initialize algorithm
const algorithm = new ContentRankingAlgorithm();

// Calculate single content score
const content = {
  id: 'content-123',
  game: 'Fortnite',
  category: 'highlights',
  views: 1000,
  likes: 100,
  mlgVotes: {
    upvotes: 25,
    downvotes: 2,
    totalTokensBurned: 75 // 3 MLG tokens per vote average
  },
  createdAt: new Date().toISOString()
};

const scoreResult = algorithm.calculateContentScore(content, { mode: 'trending' });
console.log(`Content score: ${scoreResult.normalizedScore}/100`);
```

### Ranking Multiple Content Items

```javascript
// Rank content list
const contentList = [
  // ... your content objects
];

const trendingContent = algorithm.rankContent(contentList, {
  mode: 'trending',
  limit: 20,
  timeWindowHours: 24
});

console.log('Top trending content:', trendingContent.slice(0, 5));
```

### Using Specialized Ranking Modes

```javascript
// Get hot content (balanced engagement + time)
const hotContent = rankingModes.getHot(contentList, { limit: 10 });

// Get competitive esports content
const competitiveContent = gamingRanking.getCompetitiveContent(contentList);

// Get personalized recommendations
const userProfile = {
  preferredGames: ['fortnite', 'valorant'],
  preferredPlatforms: ['pc', 'xbox']
};
const personalizedContent = recommendations.getPersonalizedRecommendations(
  userProfile, 
  contentList, 
  { limit: 15 }
);
```

## Integration Examples

### MLG Token Voting Integration

```javascript
import { MLGVotingRankingIntegration } from './content-ranking-integration.js';

const votingIntegration = new MLGVotingRankingIntegration();

// Handle new vote and update content ranking
const voteData = {
  voteType: 'upvote',
  tokenAmount: 3, // 3 MLG tokens burned
  transactionSignature: '5J8QvU7snqjBxNqVQhGjPFzQFzQY...',
  walletSignature: { /* signature data */ }
};

const result = await votingIntegration.handleNewVote('content-123', voteData);

if (result.data.shouldTrend) {
  console.log('Content promoted to trending!');
}
```

### Real-time Content Scoring

```javascript
import { RealTimeContentScoring } from './content-ranking-integration.js';

const realTimeScoring = new RealTimeContentScoring();

// Monitor high-traffic content for real-time updates
realTimeScoring.startRealTimeScoring(['viral-content-1', 'viral-content-2']);

// Subscribe to score updates
realTimeScoring.subscribeToScoreUpdates('viral-content-1', (scoreResult) => {
  console.log('Real-time score update:', scoreResult.normalizedScore);
  // Update UI, trigger notifications, etc.
});
```

### Content Discovery Service

```javascript
import { ContentDiscoveryService } from './content-ranking-integration.js';

const discoveryService = new ContentDiscoveryService();

// Get trending content for homepage
const trending = await discoveryService.getTrendingContent({
  game: 'Fortnite',
  timeWindow: 24,
  limit: 20
});

// Get game-specific leaderboard
const gameLeaderboard = await discoveryService.getGameLeaderboard('Valorant', {
  timeframe: 'week',
  limit: 50
});
```

## Algorithm Configuration

### Scoring Weights Configuration

```javascript
const customConfig = {
  SCORING_WEIGHTS: {
    VOTES: {
      UPVOTE: 1.0,
      DOWNVOTE: -0.5,
      SUPER_VOTE: 3.0,
      MLG_TOKEN_MULTIPLIER: {
        1: 1.0,  // 1 MLG token
        2: 1.5,  // 2 MLG tokens (50% bonus)
        3: 2.0,  // 3 MLG tokens (100% bonus)
        4: 2.5   // 4 MLG tokens (150% bonus)
      }
    },
    ENGAGEMENT: {
      VIEWS: 0.1,
      LIKES: 1.0,
      COMMENTS: 2.0,
      SHARES: 3.0,
      WATCH_TIME_RATIO: 4.0
    }
  }
};

const algorithm = new ContentRankingAlgorithm(customConfig);
```

### Game-Specific Configuration

```javascript
const gamingConfig = {
  GAMING_FACTORS: {
    GAME_POPULARITY: {
      'fortnite': 1.3,
      'valorant': 1.2,
      'apex-legends': 1.1
    },
    COMPETITIVE_RELEVANCE: {
      'casual': 0.9,
      'ranked': 1.2,
      'tournament': 1.5,
      'esports': 2.0
    }
  }
};
```

## Performance Metrics

The algorithm includes built-in performance monitoring:

```javascript
const metrics = algorithm.getMetrics();
console.log({
  calculationsPerformed: metrics.calculationsPerformed,
  averageCalculationTime: metrics.averageCalculationTime,
  cacheHitRate: metrics.cacheHitRate,
  cacheSize: metrics.cacheSize
});
```

## A/B Testing

The algorithm supports A/B testing for score optimization:

```javascript
// Users are automatically assigned to test groups
const scoreResult = algorithm.calculateContentScore(content, {
  mode: 'hot'
});

console.log('A/B test group:', scoreResult.metadata.abTestGroup);
```

## Content Analytics Dashboard

```javascript
import { ContentAnalyticsDashboard } from './content-ranking-integration.js';

const analyticsService = new ContentAnalyticsDashboard();

// Get comprehensive analytics for content
const analytics = await analyticsService.getContentAnalytics('content-123');

console.log({
  currentScore: analytics.data.currentScore,
  trendingPotential: analytics.data.trendingPotential,
  optimizationSuggestions: analytics.data.optimizationSuggestions
});
```

## Score Insights

The algorithm provides automatic insights about content performance:

```javascript
const scoreResult = algorithm.calculateContentScore(content);

scoreResult.insights.forEach(insight => {
  console.log(`${insight.type}: ${insight.message} (${insight.impact} impact)`);
});

// Example output:
// positive: Strong community voting support (high impact)
// trending: Rapidly gaining traction (high impact)
// positive: High relevance for competitive gaming community (medium impact)
```

## Testing

The algorithm includes comprehensive test coverage:

```bash
npm test -- src/content/content-ranking-algorithm.test.js
```

Tests cover:
- Core scoring functions with realistic gaming scenarios
- MLG token integration with progressive pricing
- Different ranking modes and their behaviors
- Performance optimization and caching
- Error handling and edge cases
- Gaming-specific features and esports content
- A/B testing and personalization
- Integration workflows

## Architecture

### Core Components

1. **ContentRankingAlgorithm**: Main algorithm class with scoring logic
2. **RankingModes**: Specialized ranking mode implementations
3. **GamingRankingUtils**: Gaming-specific utility functions
4. **ContentRecommendations**: Personalization and similarity engine
5. **Integration Services**: API and real-time integration layers

### Score Calculation Flow

```
Content Input → Vote Score → Engagement Score → Time Score → Gaming Score
                     ↓
User Reputation → Composite Score → Normalization → Final Result
                     ↓
A/B Testing → Caching → Score Insights → Return Result
```

### MLG Token Integration

The algorithm integrates with the MLG token contract (`7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL`) through:
- Progressive pricing validation (1,2,3,4 MLG tokens)
- Transaction signature verification
- Real-time balance checking
- Vote impact analysis

## Production Deployment

### Environment Variables
```bash
RANKING_CACHE_TTL=300
RANKING_BATCH_SIZE=100
RANKING_REAL_TIME_THRESHOLD=10000
AB_TESTING_ENABLED=true
```

### Monitoring
- Performance metrics tracking
- Cache hit rate monitoring
- Score distribution analysis
- A/B test result tracking

### Scaling Considerations
- Implement Redis for distributed caching
- Use database indexing for large content sets
- Consider horizontal scaling for batch processing
- Monitor memory usage for large content volumes

## Contributing

When extending the algorithm:
1. Add comprehensive tests for new features
2. Update configuration documentation
3. Ensure backward compatibility
4. Include performance benchmarks
5. Test with realistic gaming community data

## License

This code is part of the MLG.clan gaming community platform.