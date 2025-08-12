/**
 * Content Events Handler for WebSocket Server
 * 
 * Handles content-specific real-time events for the MLG.clan platform including
 * content submissions, moderation updates, engagement notifications, trending alerts,
 * and content lifecycle events.
 * 
 * Features:
 * - Content submission and approval notifications
 * - Real-time moderation status updates
 * - Engagement tracking (likes, comments, shares)
 * - Trending algorithm updates
 * - Content ranking and leaderboard changes
 * - Creator reward notifications
 * - Content violation and takedown alerts
 * 
 * @author Claude Code - Content Events Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { EventEmitter } from 'events';

/**
 * Content Events Handler
 */
export class ContentEventHandler extends EventEmitter {
  constructor(io, options = {}) {
    super();
    
    this.io = io;
    this.roomManager = options.roomManager;
    this.logger = options.logger || console;
    
    // Content event types
    this.eventTypes = {
      SUBMITTED: 'content:submitted',
      APPROVED: 'content:approved',
      REJECTED: 'content:rejected',
      FLAGGED: 'content:flagged',
      TAKEN_DOWN: 'content:taken_down',
      RESTORED: 'content:restored',
      UPDATED: 'content:updated',
      DELETED: 'content:deleted',
      ENGAGEMENT: 'content:engagement',
      TRENDING_UPDATED: 'content:trending_updated',
      RANKING_CHANGED: 'content:ranking_changed',
      MILESTONE_REACHED: 'content:milestone_reached',
      REWARD_EARNED: 'content:reward_earned',
      FEATURED: 'content:featured',
      UNFEATURED: 'content:unfeatured',
      COMMENT_ADDED: 'content:comment_added',
      SHARE_TRACKED: 'content:share_tracked',
      VIEW_MILESTONE: 'content:view_milestone',
      QUALITY_SCORE_UPDATED: 'content:quality_score_updated'
    };
    
    // Event statistics
    this.stats = {
      contentSubmitted: 0,
      contentApproved: 0,
      contentRejected: 0,
      contentFlagged: 0,
      engagementEvents: 0,
      trendingUpdates: 0,
      milestonesReached: 0,
      rewardsEarned: 0,
      commentsAdded: 0
    };
    
    // Engagement thresholds for milestones
    this.engagementThresholds = {
      views: [100, 500, 1000, 5000, 10000, 50000, 100000],
      likes: [10, 50, 100, 500, 1000, 5000, 10000],
      comments: [5, 25, 50, 100, 250, 500, 1000],
      shares: [5, 25, 50, 100, 250, 500, 1000]
    };
    
    this.logger.info('Content Events Handler initialized');
  }

  /**
   * Subscribe to content events
   */
  subscribeToContent(socket, data) {
    try {
      const { contentIds = [], categories = [], creators = [], eventTypes = [] } = data;
      
      // Store subscription preferences
      socket.contentSubscriptions = {
        contentIds: new Set(contentIds),
        categories: new Set(categories),
        creators: new Set(creators),
        eventTypes: eventTypes.length > 0 ? new Set(eventTypes) : new Set(Object.values(this.eventTypes)),
        subscribedAt: new Date().toISOString()
      };
      
      // Join relevant content rooms
      contentIds.forEach(contentId => {
        socket.join(`content:${contentId}`);
      });
      
      categories.forEach(category => {
        socket.join(`content:category:${category}`);
      });
      
      creators.forEach(creatorId => {
        socket.join(`content:creator:${creatorId}`);
      });
      
      // Join general content room
      socket.join('content:general');
      
      socket.emit('content:subscribed', {
        contentIds,
        categories,
        creators,
        eventTypes: Array.from(socket.contentSubscriptions.eventTypes),
        timestamp: socket.contentSubscriptions.subscribedAt
      });
      
      this.logger.info(`Socket ${socket.id} subscribed to content events`);
      
    } catch (error) {
      this.logger.error(`Error subscribing to content events for ${socket.id}:`, error);
      socket.emit('content:subscription_failed', { error: error.message });
    }
  }

  /**
   * Handle content submission
   */
  handleContentSubmission(submissionData) {
    try {
      const eventData = {
        contentId: submissionData.id,
        title: submissionData.title,
        type: submissionData.type, // 'video', 'image', 'text', 'link'
        category: submissionData.category,
        creatorId: submissionData.creatorId,
        creatorUsername: submissionData.creatorUsername,
        submittedAt: new Date().toISOString(),
        status: 'pending_review',
        moderationQueue: true
      };
      
      // Update statistics
      this.stats.contentSubmitted++;
      
      // Notify creator
      this.io.to(`user:${submissionData.creatorId}`).emit(this.eventTypes.SUBMITTED, {
        ...eventData,
        message: 'Content submitted successfully! It will be reviewed shortly.',
        estimatedReviewTime: '15-30 minutes'
      });
      
      // Notify moderators
      this.io.to('role:moderator').emit('moderation:new_submission', {
        ...eventData,
        priority: 'normal',
        autoModeration: submissionData.autoModeration
      });
      
      // Notify category followers
      this.io.to(`content:category:${submissionData.category}`).emit(this.eventTypes.SUBMITTED, {
        contentId: eventData.contentId,
        category: eventData.category,
        type: eventData.type,
        creatorUsername: eventData.creatorUsername,
        timestamp: eventData.submittedAt,
        message: `New ${eventData.type} submitted in ${eventData.category}`
      });
      
      this.logger.info(`Content submitted: ${submissionData.id} by ${submissionData.creatorUsername}`);
      this.emit('content_submitted', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling content submission:`, error);
    }
  }

  /**
   * Handle content approval
   */
  handleContentApproval(approvalData) {
    try {
      const eventData = {
        contentId: approvalData.contentId,
        title: approvalData.title,
        creatorId: approvalData.creatorId,
        moderatorId: approvalData.moderatorId,
        moderatorUsername: approvalData.moderatorUsername,
        approvedAt: new Date().toISOString(),
        qualityScore: approvalData.qualityScore,
        category: approvalData.category,
        featured: approvalData.featured || false
      };
      
      // Update statistics
      this.stats.contentApproved++;
      
      // Notify creator
      this.io.to(`user:${approvalData.creatorId}`).emit(this.eventTypes.APPROVED, {
        ...eventData,
        message: 'Congratulations! Your content has been approved and is now live!',
        celebration: true,
        rewards: approvalData.rewards || {}
      });
      
      // Broadcast to category
      this.io.to(`content:category:${approvalData.category}`).emit(this.eventTypes.APPROVED, {
        contentId: eventData.contentId,
        title: eventData.title,
        category: eventData.category,
        creatorUsername: approvalData.creatorUsername,
        featured: eventData.featured,
        timestamp: eventData.approvedAt
      });
      
      // Handle featured content
      if (eventData.featured) {
        this.handleContentFeatured(approvalData);
      }
      
      this.logger.info(`Content approved: ${approvalData.contentId} - Quality: ${eventData.qualityScore}`);
      this.emit('content_approved', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling content approval:`, error);
    }
  }

  /**
   * Handle content rejection
   */
  handleContentRejection(rejectionData) {
    try {
      const eventData = {
        contentId: rejectionData.contentId,
        title: rejectionData.title,
        creatorId: rejectionData.creatorId,
        moderatorId: rejectionData.moderatorId,
        reason: rejectionData.reason,
        reasons: rejectionData.reasons || [], // Multiple reasons
        rejectedAt: new Date().toISOString(),
        appealable: rejectionData.appealable !== false,
        feedback: rejectionData.feedback
      };
      
      // Update statistics
      this.stats.contentRejected++;
      
      // Notify creator
      this.io.to(`user:${rejectionData.creatorId}`).emit(this.eventTypes.REJECTED, {
        ...eventData,
        message: 'Your content submission was not approved.',
        canAppeal: eventData.appealable,
        improvementTips: rejectionData.improvementTips || []
      });
      
      this.logger.info(`Content rejected: ${rejectionData.contentId} - Reason: ${eventData.reason}`);
      this.emit('content_rejected', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling content rejection:`, error);
    }
  }

  /**
   * Handle content flagging
   */
  handleContentFlagged(flagData) {
    try {
      const eventData = {
        contentId: flagData.contentId,
        creatorId: flagData.creatorId,
        flaggedBy: flagData.flaggedBy,
        flagType: flagData.type, // 'inappropriate', 'spam', 'copyright', etc.
        reason: flagData.reason,
        flaggedAt: new Date().toISOString(),
        autoFlag: flagData.autoFlag || false,
        severity: flagData.severity || 'medium'
      };
      
      // Update statistics
      this.stats.contentFlagged++;
      
      // Notify creator (unless severe violation)
      if (eventData.severity !== 'high') {
        this.io.to(`user:${flagData.creatorId}`).emit(this.eventTypes.FLAGGED, {
          contentId: eventData.contentId,
          flagType: eventData.flagType,
          reason: eventData.reason,
          message: 'Your content has been flagged and is under review.',
          appealable: true
        });
      }
      
      // Alert moderators
      this.io.to('role:moderator').emit('moderation:content_flagged', {
        ...eventData,
        priority: eventData.severity === 'high' ? 'urgent' : 'normal'
      });
      
      this.logger.warn(`Content flagged: ${flagData.contentId} - ${eventData.flagType} (${eventData.severity})`);
      this.emit('content_flagged', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling content flagging:`, error);
    }
  }

  /**
   * Handle engagement events
   */
  handleEngagement(engagementData) {
    try {
      const eventData = {
        contentId: engagementData.contentId,
        userId: engagementData.userId,
        username: engagementData.username,
        type: engagementData.type, // 'like', 'comment', 'share', 'view'
        timestamp: new Date().toISOString(),
        totalCount: engagementData.totalCount,
        creatorId: engagementData.creatorId
      };
      
      // Update statistics
      this.stats.engagementEvents++;
      
      // Broadcast engagement update
      this.io.to(`content:${engagementData.contentId}`).emit(this.eventTypes.ENGAGEMENT, {
        contentId: eventData.contentId,
        type: eventData.type,
        totalCount: eventData.totalCount,
        anonymous: engagementData.anonymous || false,
        timestamp: eventData.timestamp
      });
      
      // Notify creator of engagement (except for their own actions)
      if (eventData.userId !== eventData.creatorId && !engagementData.anonymous) {
        this.io.to(`user:${eventData.creatorId}`).emit('user:content_engagement', {
          contentId: eventData.contentId,
          type: eventData.type,
          username: eventData.username,
          message: this.getEngagementMessage(eventData.type, eventData.username),
          timestamp: eventData.timestamp
        });
      }
      
      // Check for engagement milestones
      this.checkEngagementMilestones(engagementData);
      
      this.logger.debug(`Engagement: ${engagementData.type} on ${engagementData.contentId} by ${engagementData.username}`);
      this.emit('engagement', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling engagement:`, error);
    }
  }

  /**
   * Handle trending updates
   */
  handleTrendingUpdate(trendingData) {
    try {
      const eventData = {
        category: trendingData.category,
        trending: trendingData.trending, // Array of trending content
        algorithm: trendingData.algorithm || 'default',
        timestamp: new Date().toISOString(),
        changes: trendingData.changes || []
      };
      
      // Update statistics
      this.stats.trendingUpdates++;
      
      // Broadcast trending update to category watchers
      this.io.to(`content:category:${trendingData.category}`).emit(this.eventTypes.TRENDING_UPDATED, eventData);
      
      // Notify creators of significant ranking changes
      eventData.changes.forEach(change => {
        if (change.rankChange && Math.abs(change.rankChange) >= 3) { // Significant change
          this.io.to(`user:${change.creatorId}`).emit('user:content_trending', {
            contentId: change.contentId,
            newRank: change.newRank,
            previousRank: change.previousRank,
            category: eventData.category,
            message: change.newRank < change.previousRank 
              ? `Your content is trending up! Now #${change.newRank} in ${eventData.category}`
              : `Your content ranking changed to #${change.newRank} in ${eventData.category}`,
            celebration: change.newRank <= 10
          });
        }
      });
      
      this.logger.info(`Trending updated: ${trendingData.category} - ${eventData.trending.length} items`);
      this.emit('trending_updated', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling trending update:`, error);
    }
  }

  /**
   * Handle content featured
   */
  handleContentFeatured(featuredData) {
    try {
      const eventData = {
        contentId: featuredData.contentId,
        title: featuredData.title,
        creatorId: featuredData.creatorId,
        creatorUsername: featuredData.creatorUsername,
        category: featuredData.category,
        featuredBy: featuredData.featuredBy,
        featuredAt: new Date().toISOString(),
        duration: featuredData.duration || '24h',
        spotlight: featuredData.spotlight || false
      };
      
      // Notify creator
      this.io.to(`user:${featuredData.creatorId}`).emit(this.eventTypes.FEATURED, {
        ...eventData,
        message: 'Congratulations! Your content has been featured!',
        celebration: true,
        rewards: featuredData.rewards || {}
      });
      
      // Broadcast to all users
      this.io.emit(this.eventTypes.FEATURED, {
        contentId: eventData.contentId,
        title: eventData.title,
        category: eventData.category,
        creatorUsername: eventData.creatorUsername,
        timestamp: eventData.featuredAt
      });
      
      this.logger.info(`Content featured: ${featuredData.contentId} by ${featuredData.creatorUsername}`);
      this.emit('content_featured', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling content featured:`, error);
    }
  }

  /**
   * Handle content rewards
   */
  handleContentReward(rewardData) {
    try {
      const eventData = {
        contentId: rewardData.contentId,
        creatorId: rewardData.creatorId,
        rewardType: rewardData.type, // 'performance', 'quality', 'engagement', 'milestone'
        amount: rewardData.amount,
        currency: rewardData.currency || 'MLG',
        reason: rewardData.reason,
        period: rewardData.period, // 'daily', 'weekly', 'monthly'
        timestamp: new Date().toISOString(),
        totalEarned: rewardData.totalEarned
      };
      
      // Update statistics
      this.stats.rewardsEarned++;
      
      // Notify creator
      this.io.to(`user:${rewardData.creatorId}`).emit(this.eventTypes.REWARD_EARNED, {
        ...eventData,
        message: `You earned ${eventData.amount} ${eventData.currency} tokens!`,
        celebration: eventData.amount >= 100,
        breakdown: rewardData.breakdown || {}
      });
      
      this.logger.info(`Content reward: ${rewardData.creatorId} earned ${eventData.amount} ${eventData.currency} for ${eventData.contentId}`);
      this.emit('content_reward', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling content reward:`, error);
    }
  }

  /**
   * Handle comment addition
   */
  handleCommentAdded(commentData) {
    try {
      const eventData = {
        contentId: commentData.contentId,
        commentId: commentData.commentId,
        userId: commentData.userId,
        username: commentData.username,
        comment: commentData.comment,
        parentId: commentData.parentId, // For reply threads
        timestamp: new Date().toISOString(),
        creatorId: commentData.creatorId
      };
      
      // Update statistics
      this.stats.commentsAdded++;
      
      // Broadcast to content watchers
      this.io.to(`content:${commentData.contentId}`).emit(this.eventTypes.COMMENT_ADDED, {
        contentId: eventData.contentId,
        commentId: eventData.commentId,
        username: eventData.username,
        comment: eventData.comment,
        parentId: eventData.parentId,
        timestamp: eventData.timestamp
      });
      
      // Notify content creator (unless commenting on own content)
      if (eventData.userId !== eventData.creatorId) {
        this.io.to(`user:${eventData.creatorId}`).emit('user:content_comment', {
          contentId: eventData.contentId,
          commentId: eventData.commentId,
          username: eventData.username,
          comment: eventData.comment,
          message: `${eventData.username} commented on your content`,
          timestamp: eventData.timestamp
        });
      }
      
      // Notify parent comment author for replies
      if (eventData.parentId && commentData.parentAuthorId && commentData.parentAuthorId !== eventData.userId) {
        this.io.to(`user:${commentData.parentAuthorId}`).emit('user:comment_reply', {
          contentId: eventData.contentId,
          commentId: eventData.commentId,
          parentId: eventData.parentId,
          username: eventData.username,
          comment: eventData.comment,
          message: `${eventData.username} replied to your comment`,
          timestamp: eventData.timestamp
        });
      }
      
      this.logger.debug(`Comment added: ${commentData.contentId} by ${commentData.username}`);
      this.emit('comment_added', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling comment addition:`, error);
    }
  }

  /**
   * Check engagement milestones
   */
  checkEngagementMilestones(engagementData) {
    const { type, totalCount, contentId, creatorId } = engagementData;
    const thresholds = this.engagementThresholds[type] || [];
    
    thresholds.forEach(threshold => {
      const previousCount = totalCount - 1;
      
      if (previousCount < threshold && totalCount >= threshold) {
        this.stats.milestonesReached++;
        
        this.io.to(`user:${creatorId}`).emit(this.eventTypes.MILESTONE_REACHED, {
          contentId,
          type,
          milestone: threshold,
          totalCount,
          message: `Milestone reached: ${threshold} ${type}!`,
          celebration: threshold >= 1000,
          reward: this.calculateMilestoneReward(type, threshold)
        });
        
        // Broadcast significant milestones
        if (threshold >= 10000) {
          this.io.to(`content:category:${engagementData.category}`).emit(this.eventTypes.MILESTONE_REACHED, {
            contentId,
            type,
            milestone: threshold,
            creatorUsername: engagementData.creatorUsername,
            message: `${engagementData.creatorUsername}'s content reached ${threshold} ${type}!`,
            celebration: true
          });
        }
      }
    });
  }

  /**
   * Calculate milestone reward
   */
  calculateMilestoneReward(type, milestone) {
    const baseRewards = {
      views: 1,
      likes: 5,
      comments: 10,
      shares: 15
    };
    
    const base = baseRewards[type] || 1;
    const multiplier = Math.floor(Math.log10(milestone));
    
    return {
      mlg_tokens: base * multiplier,
      reputation_points: Math.floor(milestone / 100)
    };
  }

  /**
   * Get engagement message
   */
  getEngagementMessage(type, username) {
    const messages = {
      'like': `${username} liked your content`,
      'comment': `${username} commented on your content`,
      'share': `${username} shared your content`,
      'view': `${username} viewed your content`
    };
    
    return messages[type] || `${username} engaged with your content`;
  }

  /**
   * Get content event statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalEvents: Object.values(this.stats).reduce((sum, count) => sum + count, 0)
    };
  }

  /**
   * Reset event statistics
   */
  resetStats() {
    this.stats = {
      contentSubmitted: 0,
      contentApproved: 0,
      contentRejected: 0,
      contentFlagged: 0,
      engagementEvents: 0,
      trendingUpdates: 0,
      milestonesReached: 0,
      rewardsEarned: 0,
      commentsAdded: 0
    };
    
    this.logger.info('Content event statistics reset');
  }
}

export default ContentEventHandler;