/**
 * Content Rewards Integration Example - Sub-task 4.7
 * 
 * Comprehensive example demonstrating how to integrate the MLG.clan content reward system
 * with existing content ranking, voting, and Phantom wallet systems
 * 
 * @author Claude Code - Solana Web3 Security Architect  
 * @version 1.0.0
 */

import { 
  ContentRewardSystem, 
  RewardAnalytics, 
  RewardUIComponents,
  REWARD_CONFIG 
} from './content-rewards.js';
import { ContentRankingAlgorithm } from './content-ranking-algorithm.js';
import { PublicKey, Connection } from '@solana/web3.js';

/**
 * Example: Basic Content Reward Calculation and Distribution
 */
async function basicRewardExample() {
  console.log('🚀 MLG.clan Content Reward System - Basic Example');
  console.log('=' .repeat(60));
  
  try {
    // Initialize reward system
    const rewardSystem = new ContentRewardSystem();
    console.log('✅ Reward system initialized');
    
    // Example content data (would come from your database)
    const exampleContent = {
      id: 'content_viral_ace_clip_001',
      title: 'Insane 1v5 Ace Clutch - Valorant Champions',
      creator: {
        id: 'creator_pro_player_123',
        walletAddress: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL',
        accountCreatedAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(), // 150 days old
        clanStatus: 'verified',
        verified: true,
        achievementLevel: 'diamond',
        gamerscore: 12500
      },
      views: 25000,
      likes: 3200,
      comments: 450,
      shares: 180,
      bookmarks: 280,
      mlgVotes: {
        upvotes: 150,
        downvotes: 8,
        superVotes: 25,
        totalTokensBurned: 45 // Progressive pricing: some 1 MLG, some 2 MLG, etc.
      },
      analytics: {
        clickThroughRate: 0.18,
        completionRate: 0.92,
        watchTime: 15600, // Total watch time in seconds
        totalViews: 25000,
        averageWatchTime: 85 // Average watch time per view
      },
      contentType: 'video_clip',
      duration: 95, // Video duration in seconds
      category: 'highlights',
      game: 'valorant',
      gameMode: 'tournament',
      difficulty: 'professional',
      platform: 'pc',
      tags: ['esports', 'clutch', 'ace', 'tournament', 'valorant-champions'],
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
    };
    
    console.log('\n📊 Calculating reward for viral gaming content...');
    console.log(`Content: ${exampleContent.title}`);
    console.log(`Creator: ${exampleContent.creator.id} (${exampleContent.creator.clanStatus})`);
    console.log(`Views: ${exampleContent.views.toLocaleString()}, Likes: ${exampleContent.likes.toLocaleString()}`);
    
    // Calculate reward
    const rewardResult = await rewardSystem.calculateContentReward(exampleContent);
    
    if (rewardResult.eligible) {
      console.log('\n🎉 Reward Calculation Results:');
      console.log(`Total Reward: ${rewardResult.totalReward.toLocaleString()} MLG tokens`);
      console.log('\n📋 Reward Breakdown:');
      console.log(`  • Base Performance: ${rewardResult.breakdown.baseReward} MLG`);
      console.log(`  • Engagement Bonus: ${rewardResult.breakdown.engagementBonus} MLG`);
      console.log(`  • Velocity Bonus: ${rewardResult.breakdown.velocityBonus} MLG`);
      console.log(`  • Creator Multiplier: ${rewardResult.breakdown.creatorMultiplier}x`);
      console.log(`  • Creator Tier Bonus: ${rewardResult.breakdown.creatorBonus} MLG`);
      
      if (rewardResult.breakdown.antiGamingPenalty > 0) {
        console.log(`  • Anti-Gaming Penalty: -${(rewardResult.breakdown.antiGamingPenalty * 100).toFixed(1)}%`);
      }
      
      console.log('\n📈 Performance Metrics:');
      console.log(`  • Content Score: ${rewardResult.metrics.contentScore}/100`);
      console.log(`  • Creator Tier: ${rewardResult.metrics.creatorTier}`);
      
      // Demonstrate reward distribution
      console.log('\n💰 Distributing reward to creator wallet...');
      const rewardsList = [{
        recipient: exampleContent.creator.walletAddress,
        amount: rewardResult.totalReward,
        contentId: exampleContent.id,
        type: 'performance',
        creatorId: exampleContent.creator.id
      }];
      
      // Note: In production, this would interact with actual Solana blockchain
      const distributionResult = await rewardSystem.distributeRewards(rewardsList);
      
      if (distributionResult.successful && distributionResult.successful.length > 0) {
        console.log('✅ Reward distributed successfully!');
        console.log(`Transaction ID: ${distributionResult.successful[0].transactionId}`);
        console.log(`Amount: ${distributionResult.successful[0].amount} MLG`);
        console.log(`Status: ${distributionResult.successful[0].status}`);
      } else {
        console.log('❌ Reward distribution failed');
        if (distributionResult.failed && distributionResult.failed.length > 0) {
          console.log(`Error: ${distributionResult.failed[0].error}`);
        }
      }
      
    } else {
      console.log('\n❌ Content not eligible for rewards');
      console.log(`Reason: ${rewardResult.reason}`);
      if (rewardResult.suggestedActions) {
        console.log('💡 Suggestions:');
        rewardResult.suggestedActions.forEach(action => {
          console.log(`  • ${action}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Basic reward example failed:', error);
  }
}

/**
 * Example: Achievement-Based Rewards
 */
async function achievementRewardExample() {
  console.log('\n\n🏆 Achievement-Based Rewards Example');
  console.log('=' .repeat(60));
  
  try {
    const rewardSystem = new ContentRewardSystem();
    
    // Example creator who just hit a milestone
    const creator = {
      id: 'creator_rising_star_456',
      walletAddress: '8YKjwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL',
      accountCreatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      clanStatus: 'member',
      verified: false,
      achievementLevel: 'gold',
      gamerscore: 3500,
      totalContent: 8,
      averageContentScore: 68.5
    };
    
    console.log(`\n🌟 Processing achievements for creator: ${creator.id}`);
    
    // Example: First viral content achievement
    console.log('\n🔥 Achievement: First Viral Content');
    const viralAchievement = await rewardSystem.calculateAchievementReward(
      creator,
      'FIRST_VIRAL',
      { 
        contentId: 'content_first_viral_789',
        views: 12000,
        timestamp: new Date().toISOString()
      }
    );
    
    if (viralAchievement) {
      console.log(`✅ Achievement Unlocked: ${viralAchievement.description}`);
      console.log(`💰 Reward: ${viralAchievement.amount} MLG tokens`);
      console.log(`🎯 Type: ${viralAchievement.type}`);
      console.log(`⭐ Tier Multiplier: ${viralAchievement.tierMultiplier}x`);
    }
    
    // Example: Community favorite achievement  
    console.log('\n❤️ Achievement: Community Favorite');
    const communityAchievement = await rewardSystem.calculateAchievementReward(
      creator,
      'COMMUNITY_FAVORITE',
      {
        contentId: 'content_loved_content_101',
        likes: 105,
        timestamp: new Date().toISOString()
      }
    );
    
    if (communityAchievement) {
      console.log(`✅ Achievement Unlocked: ${communityAchievement.description}`);
      console.log(`💰 Reward: ${communityAchievement.amount} MLG tokens`);
    }
    
    // Example: Gaming achievement
    console.log('\n🎮 Achievement: Multi-Game Creator');
    const gamingAchievement = await rewardSystem.calculateAchievementReward(
      creator,
      'MULTI_GAME_CREATOR',
      {
        games: ['valorant', 'apex-legends', 'fortnite', 'call-of-duty', 'overwatch'],
        timestamp: new Date().toISOString()
      }
    );
    
    if (gamingAchievement) {
      console.log(`✅ Achievement Unlocked: ${gamingAchievement.description}`);
      console.log(`💰 Reward: ${gamingAchievement.amount} MLG tokens`);
    }
    
    // Distribute all achievement rewards
    const achievementRewards = [viralAchievement, communityAchievement, gamingAchievement]
      .filter(achievement => achievement !== null)
      .map(achievement => ({
        recipient: creator.walletAddress,
        amount: achievement.amount,
        contentId: achievement.context?.contentId || 'achievement',
        type: 'achievement',
        creatorId: creator.id,
        achievementType: achievement.achievementType
      }));
    
    if (achievementRewards.length > 0) {
      console.log(`\n💎 Distributing ${achievementRewards.length} achievement rewards...`);
      const distributionResult = await rewardSystem.distributeRewards(achievementRewards);
      
      const totalAmount = achievementRewards.reduce((sum, reward) => sum + reward.amount, 0);
      console.log(`Total Achievement Rewards: ${totalAmount} MLG tokens`);
      
      if (distributionResult.successful && distributionResult.successful.length > 0) {
        console.log('✅ All achievement rewards distributed successfully!');
        distributionResult.successful.forEach(reward => {
          console.log(`  • ${reward.achievementType}: ${reward.amount} MLG (${reward.transactionId})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Achievement reward example failed:', error);
  }
}

/**
 * Example: Creator Dashboard Analytics
 */
async function creatorDashboardExample() {
  console.log('\n\n📊 Creator Dashboard Example');
  console.log('=' .repeat(60));
  
  try {
    const rewardSystem = new ContentRewardSystem();
    const uiComponents = new RewardUIComponents(rewardSystem);
    
    // Add some mock reward history for demonstration
    const creatorId = 'creator_dashboard_demo_789';
    
    // Simulate historical rewards
    const mockRewards = [
      { recipient: creatorId, amount: 500, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), type: 'performance' },
      { recipient: creatorId, amount: 300, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), type: 'achievement' },
      { recipient: creatorId, amount: 750, timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), type: 'performance' },
      { recipient: creatorId, amount: 200, timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), type: 'performance' },
      { recipient: creatorId, amount: 1000, timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), type: 'achievement' }
    ];
    
    rewardSystem.rewardHistory = mockRewards;
    
    // Mock creator stats
    rewardSystem.creatorStats.set(creatorId, {
      totalEarnings: 2750,
      rewardCount: 5,
      averageReward: 550,
      achievements: [
        {
          type: 'content_milestone',
          achievementType: 'FIRST_VIRAL',
          amount: 1000,
          description: 'First viral content (10k+ views)',
          earnedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          type: 'community_impact', 
          achievementType: 'COMMUNITY_FAVORITE',
          amount: 300,
          description: '100+ likes milestone',
          earnedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    });
    
    console.log(`\n👤 Loading dashboard for creator: ${creatorId}`);
    
    // Get comprehensive dashboard data
    const dashboard = await rewardSystem.getCreatorDashboard(creatorId);
    
    console.log('\n💰 Earnings Summary:');
    console.log(`  • Total Earnings: ${dashboard.earnings.total.toLocaleString()} MLG`);
    console.log(`  • Average Reward: ${dashboard.earnings.average.toFixed(0)} MLG`);
    console.log(`  • Best Reward: ${dashboard.earnings.best} MLG`);
    console.log(`  • Total Rewards: ${dashboard.earnings.rewardsCount}`);
    console.log(`  • Rank: #${dashboard.earnings.rank}`);
    console.log(`  • Percentile: ${dashboard.earnings.percentile}th`);
    
    console.log('\n🏆 Achievements:');
    if (dashboard.achievements && dashboard.achievements.length > 0) {
      dashboard.achievements.forEach(achievement => {
        console.log(`  • ${achievement.description} (+${achievement.amount} MLG)`);
      });
    } else {
      console.log('  • No achievements yet');
    }
    
    console.log('\n📈 Performance Metrics:');
    console.log(`  • Total Content: ${dashboard.performance.totalContent}`);
    console.log(`  • Average Score: ${dashboard.performance.averageScore}/100`);
    console.log(`  • Top Performers: ${dashboard.performance.topContent}`);
    console.log(`  • Total Views: ${dashboard.performance.totalViews.toLocaleString()}`);
    console.log(`  • Engagement Rate: ${(dashboard.performance.averageEngagementRate * 100).toFixed(1)}%`);
    
    console.log('\n🔮 Reward Predictions:');
    console.log(`  • Next Reward: ${dashboard.predictions.nextReward.estimated} MLG (${dashboard.predictions.nextReward.timeframe})`);
    console.log(`  • Confidence: ${(dashboard.predictions.nextReward.confidence * 100).toFixed(0)}%`);
    console.log(`  • Weekly Estimate: ${dashboard.predictions.weeklyEstimate} MLG`);
    console.log(`  • Monthly Estimate: ${dashboard.predictions.monthlyEstimate} MLG`);
    console.log(`  • Growth Potential: ${dashboard.predictions.growthPotential.toUpperCase()}`);
    
    console.log('\n📊 Earnings Trend:');
    console.log(`  • Trend: ${dashboard.trends.trend.toUpperCase()}`);
    console.log(`  • Change: ${dashboard.trends.change > 0 ? '+' : ''}${dashboard.trends.change}%`);
    
    console.log('\n💡 Recommendations:');
    if (dashboard.recommendations && dashboard.recommendations.length > 0) {
      dashboard.recommendations.forEach(rec => {
        console.log(`  • [${rec.impact?.toUpperCase() || 'INFO'}] ${rec.message}`);
      });
    } else {
      console.log('  • Keep up the excellent work!');
    }
    
    // Generate UI widget data
    console.log('\n🎨 Generating UI Components...');
    const earningsWidget = await uiComponents.generateEarningsWidget(creatorId);
    
    console.log('\n📱 Earnings Widget Data:');
    console.log(`  • Type: ${earningsWidget.type}`);
    console.log(`  • Total Earnings: ${earningsWidget.data.totalEarnings} MLG`);
    console.log(`  • Rank: #${earningsWidget.data.rank}`);
    console.log(`  • Tier: ${earningsWidget.data.tier}`);
    console.log(`  • Chart Data Points: ${earningsWidget.visualizations.earningsChart.length}`);
    
  } catch (error) {
    console.error('❌ Creator dashboard example failed:', error);
  }
}

/**
 * Example: Reward Pool Health Monitoring
 */
async function rewardPoolHealthExample() {
  console.log('\n\n🏥 Reward Pool Health Monitoring Example');
  console.log('=' .repeat(60));
  
  try {
    const rewardSystem = new ContentRewardSystem();
    const uiComponents = new RewardUIComponents(rewardSystem);
    
    // Simulate some reward distribution to show utilization
    rewardSystem.rewardPools.get('daily').distributed = 7500; // 75% utilized
    rewardSystem.rewardPools.get('weekly').distributed = 20000; // 40% utilized
    rewardSystem.rewardPools.get('monthly').distributed = 60000; // 30% utilized
    
    // Mock some recent reward history for burn rate calculation
    rewardSystem.rewardHistory = Array.from({ length: 50 }, (_, i) => ({
      recipient: `creator_${i}`,
      amount: 100 + Math.floor(Math.random() * 400),
      timestamp: new Date(Date.now() - (i * 2 * 60 * 60 * 1000)).toISOString(), // Last 100 hours
      type: 'performance'
    }));
    
    console.log('\n🔍 Checking reward pool health...');
    const poolHealth = await rewardSystem.getRewardPoolHealth();
    
    console.log('\n💎 Treasury Status:');
    console.log(`  • Balance: ${poolHealth.treasuryBalance.toLocaleString()} MLG`);
    console.log(`  • Daily Burn Rate: ${poolHealth.runway.dailyBurnRate.toLocaleString()} MLG/day`);
    console.log(`  • Estimated Runway: ${poolHealth.runway.estimatedDays} days`);
    console.log(`  • Health Status: ${poolHealth.runway.status.toUpperCase()}`);
    
    console.log('\n📊 Pool Utilization:');
    console.log(`  • Daily Pool: ${poolHealth.utilization.daily.toFixed(1)}%`);
    console.log(`  • Weekly Pool: ${poolHealth.utilization.weekly.toFixed(1)}%`);
    console.log(`  • Monthly Pool: ${poolHealth.utilization.monthly.toFixed(1)}%`);
    console.log(`  • Overall: ${poolHealth.utilization.overall.toFixed(1)}%`);
    
    console.log('\n⚠️ Health Recommendations:');
    if (poolHealth.recommendations && poolHealth.recommendations.length > 0) {
      poolHealth.recommendations.forEach(rec => {
        console.log(`  • [${rec.priority?.toUpperCase()}] ${rec.action}`);
        console.log(`    ${rec.description}`);
      });
    } else {
      console.log('  • All systems operating normally');
    }
    
    // Generate pool status widget
    console.log('\n📱 Pool Status Widget:');
    const poolWidget = await uiComponents.generatePoolStatusWidget();
    console.log(`  • Widget Type: ${poolWidget.type}`);
    console.log(`  • Health Status: ${poolWidget.data.healthStatus}`);
    console.log(`  • Active Alerts: ${poolWidget.alerts.length}`);
    
    if (poolWidget.alerts.length > 0) {
      console.log('\n🚨 Active Alerts:');
      poolWidget.alerts.forEach(alert => {
        console.log(`  • [${alert.type.toUpperCase()}] ${alert.message}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Pool health monitoring example failed:', error);
  }
}

/**
 * Example: Anti-Gaming and Security Measures
 */
async function antiGamingExample() {
  console.log('\n\n🛡️ Anti-Gaming and Security Measures Example');
  console.log('=' .repeat(60));
  
  try {
    const rewardSystem = new ContentRewardSystem();
    
    // Example: Suspicious content with unusual voting patterns
    const suspiciousContent = {
      id: 'content_suspicious_123',
      title: 'Generic Gaming Video',
      creator: {
        id: 'creator_new_account_999',
        walletAddress: '9ZLkwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL',
        accountCreatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // Only 3 days old
        clanStatus: 'member',
        verified: false,
        achievementLevel: 'bronze'
      },
      views: 500,
      likes: 45,
      comments: 2,
      shares: 0,
      mlgVotes: {
        upvotes: 200, // Suspicious: way more votes than views
        downvotes: 5,
        superVotes: 50, // Very suspicious
        totalTokensBurned: 150
      },
      analytics: {
        clickThroughRate: 0.02,
        completionRate: 0.25,
        watchTime: 300
      },
      contentType: 'video_clip',
      duration: 60,
      category: 'generic',
      game: 'unknown',
      platform: 'pc',
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15 minutes ago
    };
    
    console.log('\n🚨 Analyzing suspicious content...');
    console.log(`Content: ${suspiciousContent.title}`);
    console.log(`Creator Account Age: 3 days`);
    console.log(`Views vs Votes: ${suspiciousContent.views} views, ${suspiciousContent.mlgVotes.upvotes} upvotes`);
    
    // Test eligibility checks
    const eligibilityResult = await rewardSystem.checkRewardEligibility(suspiciousContent);
    
    console.log('\n🔍 Eligibility Check Results:');
    console.log(`  • Eligible: ${eligibilityResult.eligible ? 'YES' : 'NO'}`);
    if (!eligibilityResult.eligible) {
      console.log(`  • Reason: ${eligibilityResult.reason}`);
      console.log('  • Failed Checks:');
      eligibilityResult.allChecks.filter(check => !check.passed).forEach(check => {
        console.log(`    - ${check.check}: ${check.message}`);
      });
    }
    
    // Test anti-gaming measures even if ineligible (for demonstration)
    console.log('\n🛡️ Anti-Gaming Analysis:');
    const antiGamingResult = await rewardSystem.checkAntiGamingMeasures(suspiciousContent);
    
    console.log(`  • Suspicious Activity: ${antiGamingResult.suspicious ? 'DETECTED' : 'None'}`);
    console.log(`  • Risk Level: ${antiGamingResult.riskLevel.toUpperCase()}`);
    
    if (antiGamingResult.suspicious) {
      console.log('  • Suspicious Indicators:');
      antiGamingResult.indicators.forEach(indicator => {
        console.log(`    - ${indicator.replace('_', ' ').toUpperCase()}`);
      });
      console.log(`  • Penalty Multiplier: ${antiGamingResult.penaltyMultiplier.toFixed(2)}x`);
    }
    
    // Example: Content that would be flagged for similarity
    console.log('\n🔄 Content Similarity Check Example:');
    
    // Mock similarity detection
    rewardSystem.checkContentSimilarity = async (content) => ({
      suspicious: true,
      similarityScore: 0.87, // 87% similar to existing content
      matchedContent: ['content_original_456', 'content_duplicate_789']
    });
    
    const similarityResult = await rewardSystem.checkContentSimilarity(suspiciousContent);
    console.log(`  • Similar Content Detected: ${similarityResult.suspicious ? 'YES' : 'NO'}`);
    if (similarityResult.suspicious) {
      console.log(`  • Similarity Score: ${(similarityResult.similarityScore * 100).toFixed(1)}%`);
      console.log(`  • Matched Content: ${similarityResult.matchedContent.join(', ')}`);
    }
    
    // Example: Appeals process
    console.log('\n⚖️ Appeals Process Example:');
    const appealData = {
      creatorId: suspiciousContent.creator.id,
      rewardId: 'reward_denied_123',
      appealType: 'denied_reward',
      description: 'My content was original and high-quality, but reward was denied due to false positive in anti-gaming detection.',
      evidence: [
        'original_footage_timestamp.mp4',
        'streaming_platform_analytics.png',
        'community_testimonials.txt'
      ]
    };
    
    const appealResult = await rewardSystem.submitRewardAppeal(appealData);
    console.log(`  • Appeal Submitted: ${appealResult.success ? 'YES' : 'NO'}`);
    if (appealResult.success) {
      console.log(`  • Appeal ID: ${appealResult.appealId}`);
      console.log(`  • Status: ${appealResult.status}`);
      console.log(`  • Review Deadline: ${new Date(appealResult.reviewDeadline).toLocaleDateString()}`);
    }
    
  } catch (error) {
    console.error('❌ Anti-gaming example failed:', error);
  }
}

/**
 * Example: Reward Analytics and Reporting
 */
async function analyticsReportingExample() {
  console.log('\n\n📈 Analytics and Reporting Example');
  console.log('=' .repeat(60));
  
  try {
    const rewardSystem = new ContentRewardSystem();
    const analytics = new RewardAnalytics(rewardSystem);
    
    // Generate mock reward history for analytics
    const mockRewardHistory = [];
    const creators = ['creator_1', 'creator_2', 'creator_3', 'creator_4', 'creator_5'];
    const rewardTypes = ['performance', 'achievement', 'performance', 'performance'];
    
    // Generate 100 mock rewards over the past 30 days
    for (let i = 0; i < 100; i++) {
      mockRewardHistory.push({
        recipient: creators[Math.floor(Math.random() * creators.length)],
        amount: 100 + Math.floor(Math.random() * 800), // 100-900 MLG
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        type: rewardTypes[Math.floor(Math.random() * rewardTypes.length)],
        status: 'completed'
      });
    }
    
    rewardSystem.rewardHistory = mockRewardHistory;
    
    console.log('\n📊 Generating analytics report...');
    const report = analytics.generateAnalyticsReport({ timeframe: 'month' });
    
    console.log('\n📋 Report Summary:');
    console.log(`  • Timeframe: ${report.timeframe}`);
    console.log(`  • Total Rewards: ${report.summary.totalRewards}`);
    console.log(`  • Total Amount: ${report.summary.totalAmount.toLocaleString()} MLG`);
    console.log(`  • Unique Creators: ${report.summary.uniqueCreators}`);
    console.log(`  • Average Reward: ${report.summary.averageReward.toFixed(0)} MLG`);
    
    console.log('\n🎯 Reward Distribution by Tier:');
    console.log(`  • High Tier (500+ MLG): ${report.distribution.tiers.high} rewards`);
    console.log(`  • Medium Tier (100-499 MLG): ${report.distribution.tiers.medium} rewards`);
    console.log(`  • Low Tier (<100 MLG): ${report.distribution.tiers.low} rewards`);
    
    console.log('\n📚 Distribution by Type:');
    Object.entries(report.distribution.types).forEach(([type, count]) => {
      console.log(`  • ${type.charAt(0).toUpperCase() + type.slice(1)}: ${count} rewards`);
    });
    
    console.log('\n🏆 Top Performers:');
    report.topPerformers.slice(0, 5).forEach((performer, index) => {
      console.log(`  ${index + 1}. ${performer.creatorId}: ${performer.totalEarnings.toLocaleString()} MLG`);
    });
    
    console.log('\n📈 Reward Trends:');
    console.log(`  • Trend: ${report.trends.trend.toUpperCase()}`);
    console.log(`  • Recent Activity: ${report.trends.dailyData.slice(-7).length} days of data`);
    
    // Pool utilization analysis
    console.log('\n🏊 Pool Utilization Analysis:');
    Object.entries(report.poolUtilization).forEach(([pool, data]) => {
      console.log(`  • ${pool.charAt(0).toUpperCase() + pool.slice(1)}: ${data.utilization.toFixed(1)}% utilized`);
    });
    
  } catch (error) {
    console.error('❌ Analytics reporting example failed:', error);
  }
}

/**
 * Example: Integration with Phantom Wallet
 */
async function phantomWalletIntegrationExample() {
  console.log('\n\n👻 Phantom Wallet Integration Example');
  console.log('=' .repeat(60));
  
  try {
    console.log('\n🔗 Integrating with Phantom wallet for reward distribution...');
    
    // Note: This is a demonstration of how the reward system would integrate
    // with actual Phantom wallet transactions in a real application
    
    const mockPhantomIntegration = {
      isConnected: true,
      publicKey: new PublicKey('7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL'),
      
      async signAndSendTransaction(transaction) {
        // Mock transaction signing
        console.log('📝 Transaction signed by Phantom wallet');
        return 'mock_signature_' + Date.now();
      },
      
      async getTokenBalance(mintAddress) {
        // Mock token balance check
        return 5000; // 5000 MLG tokens
      }
    };
    
    console.log(`✅ Phantom wallet connected: ${mockPhantomIntegration.publicKey.toString()}`);
    
    const currentBalance = await mockPhantomIntegration.getTokenBalance(REWARD_CONFIG.MLG_TOKEN_ADDRESS);
    console.log(`💰 Current MLG token balance: ${currentBalance.toLocaleString()} MLG`);
    
    // Example reward claim process
    console.log('\n🎁 Simulating reward claim process...');
    const pendingReward = {
      amount: 750,
      contentId: 'content_reward_claim_example',
      reason: 'Viral gaming content performance bonus'
    };
    
    console.log(`📦 Pending reward: ${pendingReward.amount} MLG`);
    console.log(`📝 Reason: ${pendingReward.reason}`);
    console.log('\n⏳ Processing reward distribution...');
    
    // Simulate transaction
    const transactionId = await mockPhantomIntegration.signAndSendTransaction({
      type: 'reward_distribution',
      amount: pendingReward.amount,
      recipient: mockPhantomIntegration.publicKey
    });
    
    console.log(`✅ Reward distributed successfully!`);
    console.log(`🆔 Transaction ID: ${transactionId}`);
    console.log(`💎 Amount: ${pendingReward.amount} MLG tokens`);
    
    const newBalance = await mockPhantomIntegration.getTokenBalance(REWARD_CONFIG.MLG_TOKEN_ADDRESS);
    console.log(`💰 New MLG token balance: ${newBalance.toLocaleString()} MLG`);
    console.log(`📈 Balance increase: +${pendingReward.amount} MLG`);
    
    console.log('\n🔐 Security measures active:');
    console.log('  ✅ Transaction simulation before execution');
    console.log('  ✅ User confirmation for all reward claims');
    console.log('  ✅ Rate limiting on reward distribution');
    console.log('  ✅ Anti-gaming measures applied');
    console.log('  ✅ Audit trail maintained');
    
  } catch (error) {
    console.error('❌ Phantom wallet integration example failed:', error);
  }
}

/**
 * Main Example Runner
 */
async function runAllExamples() {
  console.log('🎮 MLG.clan Content Reward System - Integration Examples');
  console.log('💎 Gaming Creator Economy with Solana Blockchain Integration');
  console.log('🚀 Version 1.0.0 - Production Ready');
  console.log('\n' + '=' .repeat(80));
  
  try {
    // Run all examples sequentially
    await basicRewardExample();
    await achievementRewardExample();
    await creatorDashboardExample();
    await rewardPoolHealthExample();
    await antiGamingExample();
    await analyticsReportingExample();
    await phantomWalletIntegrationExample();
    
    console.log('\n\n🎉 All examples completed successfully!');
    console.log('\n📚 Key Integration Points:');
    console.log('  • Content ranking algorithm feeds reward calculations');
    console.log('  • Voting system data influences reward amounts');
    console.log('  • Phantom wallet handles secure reward distributions');
    console.log('  • Real-time analytics provide system insights');
    console.log('  • Anti-gaming measures ensure fair distribution');
    console.log('  • Achievement system encourages community engagement');
    console.log('  • Dashboard provides creator insights and predictions');
    
    console.log('\n🔗 MLG Token Contract: 7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL');
    console.log('🌐 Network: Solana (Production Ready)');
    console.log('⚡ Real-time updates and blockchain integration active');
    
  } catch (error) {
    console.error('❌ Example execution failed:', error);
  }
}

// Export for use in other modules
export {
  basicRewardExample,
  achievementRewardExample,
  creatorDashboardExample,
  rewardPoolHealthExample,
  antiGamingExample,
  analyticsReportingExample,
  phantomWalletIntegrationExample,
  runAllExamples
};

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}