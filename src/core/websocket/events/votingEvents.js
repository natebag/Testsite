/**
 * Voting Events Handler for WebSocket Server
 * 
 * Handles real-time voting events for the MLG.clan platform including vote casting,
 * MLG token burning, vote count updates, daily limits, and voting system notifications.
 * 
 * Features:
 * - Real-time vote casting and confirmation
 * - MLG token burn notifications and tracking
 * - Live vote count updates with aggregation
 * - Daily vote limit tracking and warnings
 * - Voting leaderboard updates
 * - Content trending algorithm updates
 * - Fraud detection and validation events
 * 
 * @author Claude Code - Voting Events Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { EventEmitter } from 'events';

/**
 * Voting Events Handler
 */
export class VotingEventHandler extends EventEmitter {
  constructor(io, options = {}) {
    super();
    
    this.io = io;
    this.roomManager = options.roomManager;
    this.eventAggregator = options.eventAggregator;
    this.logger = options.logger || console;
    
    // Voting event types
    this.eventTypes = {
      VOTE_CAST: 'vote:cast',
      VOTE_CONFIRMED: 'vote:confirmed',
      VOTE_FAILED: 'vote:failed',
      COUNT_UPDATED: 'vote:count_updated',
      MLG_BURNED: 'vote:mlg_burned',
      BURN_CONFIRMED: 'vote:burn_confirmed',
      DAILY_LIMIT_WARNING: 'vote:daily_limit_warning',
      DAILY_LIMIT_REACHED: 'vote:daily_limit_reached',
      DAILY_LIMIT_RESET: 'vote:daily_limit_reset',
      LEADERBOARD_UPDATED: 'vote:leaderboard_updated',
      TRENDING_UPDATED: 'vote:trending_updated',
      FRAUD_DETECTED: 'vote:fraud_detected',
      VALIDATION_FAILED: 'vote:validation_failed',
      STREAK_UPDATED: 'vote:streak_updated',
      MILESTONE_REACHED: 'vote:milestone_reached'
    };
    
    // Event statistics
    this.stats = {
      votesCast: 0,
      votesConfirmed: 0,
      votesFailed: 0,
      tokensB


: 0,
      fraudDetected: 0,
      limitWarnings: 0,
      streaksUpdated: 0,
      milestonesReached: 0
    };
    
    // Vote aggregation settings
    this.aggregationSettings = {
      countUpdateWindow: 1000, // 1 second
      maxBatchSize: 100,
      enableAggregation: true
    };
    
    this.logger.info('Voting Events Handler initialized');
  }

  /**
   * Subscribe to voting events
   */
  subscribeToVoting(socket, data) {
    try {
      const { contentIds = [], categories = [], eventTypes = [] } = data;
      
      // Store subscription preferences
      socket.votingSubscriptions = {
        contentIds: new Set(contentIds),
        categories: new Set(categories),
        eventTypes: eventTypes.length > 0 ? new Set(eventTypes) : new Set(Object.values(this.eventTypes)),
        subscribedAt: new Date().toISOString()
      };
      
      // Join relevant voting rooms
      contentIds.forEach(contentId => {
        socket.join(`voting:content:${contentId}`);
      });
      
      categories.forEach(category => {
        socket.join(`voting:category:${category}`);
      });
      
      // Join general voting room
      socket.join('voting:general');
      
      socket.emit('voting:subscribed', {
        contentIds,
        categories,
        eventTypes: Array.from(socket.votingSubscriptions.eventTypes),
        timestamp: socket.votingSubscriptions.subscribedAt
      });
      
      this.logger.info(`Socket ${socket.id} subscribed to voting events`);
      
    } catch (error) {
      this.logger.error(`Error subscribing to voting events for ${socket.id}:`, error);
      socket.emit('voting:subscription_failed', { error: error.message });
    }
  }

  /**
   * Handle vote cast
   */
  handleVoteCast(voteData) {
    try {
      const eventData = {
        voteId: voteData.id,
        userId: voteData.userId,
        contentId: voteData.contentId,
        contentType: voteData.contentType,
        voteType: voteData.voteType, // 'upvote', 'downvote'
        mlgTokensUsed: voteData.mlgTokensUsed,
        transactionHash: voteData.transactionHash,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
      
      // Update statistics
      this.stats.votesCast++;
      
      // Send immediate confirmation to voter
      this.io.to(`user:${voteData.userId}`).emit(this.eventTypes.VOTE_CAST, {
        ...eventData,
        message: 'Vote cast successfully, awaiting blockchain confirmation',
        showProgress: true
      });
      
      // Broadcast to content watchers
      this.io.to(`voting:content:${voteData.contentId}`).emit(this.eventTypes.VOTE_CAST, {
        contentId: eventData.contentId,
        voteType: eventData.voteType,
        voteId: eventData.voteId,
        timestamp: eventData.timestamp,
        anonymous: true // Don't reveal voter identity immediately
      });
      
      this.logger.info(`Vote cast: ${voteData.userId} -> ${voteData.contentId} (${voteData.voteType})`);
      this.emit('vote_cast', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling vote cast:`, error);
    }
  }

  /**
   * Handle vote confirmation
   */
  handleVoteConfirmation(voteData) {
    try {
      const eventData = {
        voteId: voteData.id,
        userId: voteData.userId,
        contentId: voteData.contentId,
        voteType: voteData.voteType,
        mlgTokensUsed: voteData.mlgTokensUsed,
        transactionHash: voteData.transactionHash,
        blockNumber: voteData.blockNumber,
        confirmations: voteData.confirmations || 1,
        timestamp: new Date().toISOString(),
        status: 'confirmed'
      };
      
      // Update statistics
      this.stats.votesConfirmed++;
      
      // Confirm to voter
      this.io.to(`user:${voteData.userId}`).emit(this.eventTypes.VOTE_CONFIRMED, {
        ...eventData,
        message: 'Vote confirmed on blockchain!',
        celebration: true
      });
      
      // Update vote counts
      this.handleVoteCountUpdate(voteData.contentId, {
        voteType: voteData.voteType,
        newCount: voteData.newCount,
        totalVotes: voteData.totalVotes,
        voteWeight: voteData.mlgTokensUsed
      });
      
      // Handle MLG token burn confirmation
      if (voteData.mlgTokensUsed > 0) {
        this.handleMLGBurnConfirmation(voteData);
      }
      
      // Update user voting streak
      this.handleVotingStreakUpdate(voteData.userId, voteData.streakData);
      
      this.logger.info(`Vote confirmed: ${voteData.id} - ${voteData.transactionHash}`);
      this.emit('vote_confirmed', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling vote confirmation:`, error);
    }
  }

  /**
   * Handle vote failure
   */
  handleVoteFailure(voteData, errorInfo) {
    try {
      const eventData = {
        voteId: voteData.id,
        userId: voteData.userId,
        contentId: voteData.contentId,
        error: errorInfo.message,
        errorCode: errorInfo.code,
        transactionHash: voteData.transactionHash,
        timestamp: new Date().toISOString(),
        status: 'failed'
      };
      
      // Update statistics
      this.stats.votesFailed++;
      
      // Notify voter of failure
      this.io.to(`user:${voteData.userId}`).emit(this.eventTypes.VOTE_FAILED, {
        ...eventData,
        message: `Vote failed: ${errorInfo.message}`,
        retryable: errorInfo.retryable || false
      });
      
      this.logger.warn(`Vote failed: ${voteData.id} - ${errorInfo.message}`);
      this.emit('vote_failed', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling vote failure:`, error);
    }
  }

  /**
   * Handle vote count updates with aggregation
   */
  handleVoteCountUpdate(contentId, countData) {
    try {
      const eventData = {
        contentId,
        voteType: countData.voteType,
        newCount: countData.newCount,
        totalVotes: countData.totalVotes,
        voteWeight: countData.voteWeight || 1,
        timestamp: new Date().toISOString(),
        trending: countData.trending || false
      };
      
      // Use event aggregator for high-frequency updates
      if (this.eventAggregator && this.aggregationSettings.enableAggregation) {
        this.eventAggregator.addEvent(
          `voting:content:${contentId}`,
          this.eventTypes.COUNT_UPDATED,
          eventData,
          { priority: 5, aggregatable: true }
        );
      } else {
        // Direct broadcast for immediate updates
        this.io.to(`voting:content:${contentId}`).emit(this.eventTypes.COUNT_UPDATED, eventData);
      }
      
      // Check for trending status
      if (eventData.trending) {
        this.handleTrendingUpdate(contentId, countData);
      }
      
      this.logger.debug(`Vote count updated: ${contentId} - ${countData.voteType}: ${countData.newCount}`);
      this.emit('count_updated', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling vote count update for ${contentId}:`, error);
    }
  }

  /**
   * Handle MLG token burn confirmation
   */
  handleMLGBurnConfirmation(burnData) {
    try {
      const eventData = {
        userId: burnData.userId,
        contentId: burnData.contentId,
        tokensBurned: burnData.mlgTokensUsed,
        transactionHash: burnData.transactionHash,
        burnAddress: burnData.burnAddress,
        totalBurned: burnData.totalBurned, // User's lifetime burned total
        timestamp: new Date().toISOString()
      };
      
      // Update statistics
      this.stats.tokensBurned += burnData.mlgTokensUsed;
      
      // Confirm burn to user
      this.io.to(`user:${burnData.userId}`).emit(this.eventTypes.MLG_BURNED, {
        ...eventData,
        message: `${eventData.tokensBurned} MLG tokens burned for voting power!`,
        celebration: eventData.tokensBurned >= 100 // Celebrate large burns
      });
      
      // Broadcast burn confirmation
      this.io.to(`user:${burnData.userId}`).emit(this.eventTypes.BURN_CONFIRMED, {
        ...eventData,
        message: 'Token burn confirmed on Solana blockchain'
      });
      
      // Check for burn milestones
      this.checkBurnMilestones(burnData.userId, eventData);
      
      this.logger.info(`MLG tokens burned: ${burnData.userId} - ${eventData.tokensBurned} tokens`);
      this.emit('mlg_burned', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling MLG burn confirmation:`, error);
    }
  }

  /**
   * Handle daily voting limit updates
   */
  handleDailyLimitUpdate(userId, limitData) {
    try {
      const eventData = {
        userId,
        currentVotes: limitData.currentVotes,
        dailyLimit: limitData.dailyLimit,
        remainingVotes: limitData.remainingVotes,
        resetTime: limitData.resetTime,
        warningThreshold: Math.floor(limitData.dailyLimit * 0.8), // 80% threshold
        timestamp: new Date().toISOString()
      };
      
      // Send warning when approaching limit
      if (eventData.remainingVotes <= (eventData.dailyLimit - eventData.warningThreshold) && eventData.remainingVotes > 0) {
        this.stats.limitWarnings++;
        
        this.io.to(`user:${userId}`).emit(this.eventTypes.DAILY_LIMIT_WARNING, {
          ...eventData,
          message: `Warning: Only ${eventData.remainingVotes} votes remaining today`,
          warning: true
        });
      }
      
      // Notify when limit reached
      if (eventData.remainingVotes === 0) {
        this.io.to(`user:${userId}`).emit(this.eventTypes.DAILY_LIMIT_REACHED, {
          ...eventData,
          message: 'Daily voting limit reached. Limit resets at midnight UTC.',
          blocked: true
        });
      }
      
      this.logger.debug(`Daily limit updated: ${userId} - ${eventData.remainingVotes} votes remaining`);
      this.emit('daily_limit_updated', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling daily limit update for ${userId}:`, error);
    }
  }

  /**
   * Handle daily limit reset
   */
  handleDailyLimitReset(userId, resetData) {
    try {
      const eventData = {
        userId,
        newDailyLimit: resetData.dailyLimit,
        previousDayVotes: resetData.previousDayVotes,
        resetTime: new Date().toISOString(),
        bonusVotes: resetData.bonusVotes || 0 // Bonus votes for streaks, achievements, etc.
      };
      
      this.io.to(`user:${userId}`).emit(this.eventTypes.DAILY_LIMIT_RESET, {
        ...eventData,
        message: eventData.bonusVotes > 0 
          ? `Daily votes reset! You have ${eventData.newDailyLimit} votes today (+${eventData.bonusVotes} bonus)`
          : `Daily votes reset! You have ${eventData.newDailyLimit} votes today`
      });
      
      this.logger.info(`Daily limit reset: ${userId} - ${eventData.newDailyLimit} votes available`);
      this.emit('daily_limit_reset', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling daily limit reset for ${userId}:`, error);
    }
  }

  /**
   * Handle voting streak updates
   */
  handleVotingStreakUpdate(userId, streakData) {
    try {
      if (!streakData) return;
      
      const eventData = {
        userId,
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
        streakType: streakData.type, // 'daily', 'weekly', 'monthly'
        multiplier: streakData.multiplier || 1,
        bonusReward: streakData.bonusReward || 0,
        timestamp: new Date().toISOString()
      };
      
      // Update statistics
      this.stats.streaksUpdated++;
      
      // Notify user of streak milestone
      if (eventData.currentStreak > 0 && eventData.currentStreak % 7 === 0) { // Weekly milestones
        this.io.to(`user:${userId}`).emit(this.eventTypes.STREAK_UPDATED, {
          ...eventData,
          message: `Amazing! ${eventData.currentStreak} day voting streak!`,
          milestone: true,
          celebration: true
        });
      }
      
      // Check for streak achievements
      this.checkStreakAchievements(userId, eventData);
      
      this.logger.debug(`Voting streak updated: ${userId} - ${eventData.currentStreak} days`);
      this.emit('streak_updated', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling streak update for ${userId}:`, error);
    }
  }

  /**
   * Handle trending content updates
   */
  handleTrendingUpdate(contentId, trendingData) {
    try {
      const eventData = {
        contentId,
        category: trendingData.category,
        rank: trendingData.rank,
        previousRank: trendingData.previousRank,
        trendingScore: trendingData.trendingScore,
        velocity: trendingData.velocity, // Vote velocity
        timestamp: new Date().toISOString()
      };
      
      // Broadcast trending update
      this.io.to(`voting:category:${trendingData.category}`).emit(this.eventTypes.TRENDING_UPDATED, eventData);
      
      // Notify content creator if trending up significantly
      if (eventData.previousRank && eventData.rank < eventData.previousRank - 5) {
        const creatorId = trendingData.creatorId;
        if (creatorId) {
          this.io.to(`user:${creatorId}`).emit('user:content_trending', {
            contentId: eventData.contentId,
            rank: eventData.rank,
            category: eventData.category,
            message: `Your content is trending! Rank #${eventData.rank} in ${eventData.category}`,
            celebration: true
          });
        }
      }
      
      this.logger.info(`Trending updated: ${contentId} - Rank #${eventData.rank} in ${trendingData.category}`);
      this.emit('trending_updated', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling trending update for ${contentId}:`, error);
    }
  }

  /**
   * Handle fraud detection
   */
  handleFraudDetection(fraudData) {
    try {
      const eventData = {
        userId: fraudData.userId,
        contentId: fraudData.contentId,
        fraudType: fraudData.type, // 'bot_voting', 'wash_trading', 'coordinated_voting'
        confidence: fraudData.confidence,
        evidence: fraudData.evidence,
        action: fraudData.action, // 'warning', 'temp_ban', 'permanent_ban'
        timestamp: new Date().toISOString()
      };
      
      // Update statistics
      this.stats.fraudDetected++;
      
      // Notify affected user
      this.io.to(`user:${fraudData.userId}`).emit(this.eventTypes.FRAUD_DETECTED, {
        userId: eventData.userId,
        fraudType: eventData.fraudType,
        action: eventData.action,
        message: this.getFraudMessage(eventData.fraudType, eventData.action),
        appeal: eventData.action !== 'warning'
      });
      
      // Alert moderators
      this.io.to('role:moderator').emit('moderation:fraud_alert', {
        ...eventData,
        priority: 'high'
      });
      
      this.logger.warn(`Fraud detected: ${fraudData.userId} - ${eventData.fraudType} (${eventData.confidence}% confidence)`);
      this.emit('fraud_detected', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling fraud detection:`, error);
    }
  }

  /**
   * Check burn milestones
   */
  checkBurnMilestones(userId, burnData) {
    const milestones = [100, 500, 1000, 5000, 10000, 50000, 100000];
    const { totalBurned } = burnData;
    
    milestones.forEach(milestone => {
      const previousTotal = totalBurned - burnData.tokensBurned;
      
      if (previousTotal < milestone && totalBurned >= milestone) {
        this.stats.milestonesReached++;
        
        this.io.to(`user:${userId}`).emit(this.eventTypes.MILESTONE_REACHED, {
          userId,
          type: 'burn_milestone',
          milestone,
          totalBurned,
          message: `Milestone reached! You've burned ${milestone} MLG tokens total!`,
          celebration: true,
          reward: {
            type: 'achievement',
            title: `Token Burner ${milestone}`,
            points: Math.floor(milestone / 100)
          }
        });
      }
    });
  }

  /**
   * Check streak achievements
   */
  checkStreakAchievements(userId, streakData) {
    const achievements = [
      { streak: 7, title: 'Week Warrior', rarity: 'common' },
      { streak: 30, title: 'Month Master', rarity: 'rare' },
      { streak: 100, title: 'Century Voter', rarity: 'epic' },
      { streak: 365, title: 'Year-Round Enthusiast', rarity: 'legendary' }
    ];
    
    achievements.forEach(achievement => {
      if (streakData.currentStreak === achievement.streak) {
        this.io.to(`user:${userId}`).emit('user:achievement_unlocked', {
          userId,
          achievementId: `voting_streak_${achievement.streak}`,
          achievementName: achievement.title,
          category: 'voting',
          rarity: achievement.rarity,
          description: `Maintained a ${achievement.streak}-day voting streak`,
          reward: {
            mlg_tokens: achievement.streak,
            bonus_votes: Math.floor(achievement.streak / 10)
          }
        });
      }
    });
  }

  /**
   * Get fraud message
   */
  getFraudMessage(fraudType, action) {
    const messages = {
      'bot_voting': {
        'warning': 'Suspicious voting patterns detected. Please ensure you are voting manually.',
        'temp_ban': 'Your account has been temporarily suspended for automated voting.',
        'permanent_ban': 'Your account has been permanently banned for bot voting.'
      },
      'wash_trading': {
        'warning': 'Unusual voting patterns detected between your accounts.',
        'temp_ban': 'Your account has been temporarily suspended for wash trading.',
        'permanent_ban': 'Your account has been permanently banned for wash trading.'
      },
      'coordinated_voting': {
        'warning': 'Coordinated voting activity detected. Please vote independently.',
        'temp_ban': 'Your account has been temporarily suspended for coordinated voting.',
        'permanent_ban': 'Your account has been permanently banned for coordinated voting.'
      }
    };
    
    return messages[fraudType]?.[action] || 'Suspicious activity detected.';
  }

  /**
   * Get voting event statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalEvents: Object.values(this.stats).reduce((sum, count) => sum + count, 0),
      aggregationEnabled: this.aggregationSettings.enableAggregation
    };
  }

  /**
   * Reset event statistics
   */
  resetStats() {
    this.stats = {
      votesCast: 0,
      votesConfirmed: 0,
      votesFailed: 0,
      tokensBurned: 0,
      fraudDetected: 0,
      limitWarnings: 0,
      streaksUpdated: 0,
      milestonesReached: 0
    };
    
    this.logger.info('Voting event statistics reset');
  }
}

export default VotingEventHandler;