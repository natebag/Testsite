/**
 * Content Repository for MLG.clan Platform
 * 
 * Business logic layer for content management, moderation workflows, ranking algorithms,
 * and reward distribution. Orchestrates complex content operations across DAOs.
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

import { BaseRepository } from './BaseRepository.js';

export class ContentRepository extends BaseRepository {
  constructor(options = {}) {
    super(options);
    
    this.contentDAO = this.daos.content;
    this.userDAO = this.daos.user;
    this.clanDAO = this.daos.clan;
    this.votingDAO = this.daos.voting;
    this.achievementDAO = this.daos.achievement;
    
    this.setupValidators();
    this.setupBusinessRules();
  }

  setupValidators() {
    this.registerValidator('submitContent', this.validateContentSubmission.bind(this));
    this.registerValidator('moderateContent', this.validateContentModeration.bind(this));
    this.registerValidator('updateContent', this.validateContentUpdate.bind(this));
    this.registerValidator('deleteContent', this.validateContentDeletion.bind(this));
  }

  setupBusinessRules() {
    this.registerBusinessRule('contentLimits', this.validateContentLimits.bind(this));
    this.registerBusinessRule('moderationPermissions', this.validateModerationPermissions.bind(this));
    this.registerBusinessRule('contentVisibility', this.validateContentVisibility.bind(this));
    this.registerBusinessRule('rewardEligibility', this.validateRewardEligibility.bind(this));
  }

  async validateContentSubmission(context) {
    const { userId, contentData } = context;
    
    // Validate user submission limits
    await this.validateBusinessRule('contentLimits', {
      userId,
      contentType: contentData.content_type
    });

    // Validate clan content permissions if submitting to clan
    if (contentData.clan_id) {
      await this.validateBusinessRule('contentVisibility', {
        userId,
        clanId: contentData.clan_id,
        visibility: contentData.visibility
      });
    }

    // Validate file constraints
    await this.validateFileConstraints(contentData);
  }

  async validateContentModeration(context) {
    const { moderatorId, contentId, action, reason } = context;
    
    const content = await this.contentDAO.findById(contentId);
    if (!content) {
      throw new Error('Content not found');
    }

    // Validate moderation permissions
    await this.validateBusinessRule('moderationPermissions', {
      moderatorId,
      contentOwnerId: content.user_id,
      clanId: content.clan_id,
      action
    });

    if (content.moderation_status === 'approved' && action === 'approve') {
      throw new Error('Content is already approved');
    }

    if (content.moderation_status === 'rejected' && action === 'reject') {
      throw new Error('Content is already rejected');
    }
  }

  async validateContentUpdate(context) {
    const { userId, contentId, updateData } = context;
    
    const content = await this.contentDAO.findById(contentId);
    if (!content) {
      throw new Error('Content not found');
    }

    // Only owner can update content
    if (content.user_id !== userId) {
      throw new Error('Only content owner can update content');
    }

    // Content cannot be updated after approval
    if (content.moderation_status === 'approved' && Object.keys(updateData).some(key => 
      ['title', 'description', 'file_url', 'content_type'].includes(key)
    )) {
      throw new Error('Approved content cannot have major changes');
    }
  }

  async validateContentDeletion(context) {
    const { userId, contentId, isAdmin = false } = context;
    
    const content = await this.contentDAO.findById(contentId);
    if (!content) {
      throw new Error('Content not found');
    }

    // Owner can always delete, admins can delete flagged content
    if (content.user_id !== userId && !isAdmin) {
      throw new Error('Insufficient permissions to delete content');
    }

    if (content.is_deleted) {
      throw new Error('Content is already deleted');
    }
  }

  async validateFileConstraints(contentData) {
    const constraints = {
      video: { maxSize: 500 * 1024 * 1024, maxDuration: 600 }, // 500MB, 10min
      image: { maxSize: 50 * 1024 * 1024 }, // 50MB
      audio: { maxSize: 100 * 1024 * 1024, maxDuration: 1200 }, // 100MB, 20min
      document: { maxSize: 25 * 1024 * 1024 } // 25MB
    };

    const constraint = constraints[contentData.content_type];
    if (!constraint) {
      throw new Error(`Unsupported content type: ${contentData.content_type}`);
    }

    if (contentData.file_size > constraint.maxSize) {
      throw new Error(`File size exceeds limit for ${contentData.content_type}`);
    }

    if (constraint.maxDuration && contentData.duration_seconds > constraint.maxDuration) {
      throw new Error(`Duration exceeds limit for ${contentData.content_type}`);
    }
  }

  async validateContentLimits(data) {
    const { userId, contentType } = data;
    
    // Get user's daily submission count
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const dailyCount = await this.contentDAO.getUserContentCount(userId, {
      since: startOfDay,
      contentType
    });

    // Daily limits by content type
    const limits = {
      video: 5,
      image: 10,
      audio: 3,
      document: 5,
      stream: 2
    };

    const limit = limits[contentType] || 3;
    if (dailyCount >= limit) {
      throw new Error(`Daily submission limit exceeded for ${contentType} (${limit} per day)`);
    }

    return true;
  }

  async validateModerationPermissions(data) {
    const { moderatorId, contentOwnerId, clanId, action } = data;
    
    // Content owners can't moderate their own content
    if (moderatorId === contentOwnerId) {
      throw new Error('Cannot moderate your own content');
    }

    // Check if user has moderation permissions
    const user = await this.userDAO.findById(moderatorId);
    if (!user) {
      throw new Error('Moderator not found');
    }

    // Global moderators and admins can moderate any content
    if (user.role === 'admin' || user.is_moderator) {
      return true;
    }

    // Clan-specific moderation
    if (clanId) {
      const membership = await this.clanDAO.getMembership(clanId, moderatorId);
      if (!membership || !['owner', 'admin', 'moderator'].includes(membership.role)) {
        throw new Error('Insufficient clan permissions for moderation');
      }
    } else {
      throw new Error('No moderation permissions');
    }

    return true;
  }

  async validateContentVisibility(data) {
    const { userId, clanId, visibility } = data;
    
    if (visibility === 'clan' && clanId) {
      const membership = await this.clanDAO.getMembership(clanId, userId);
      if (!membership) {
        throw new Error('Must be clan member to submit clan-only content');
      }
    }

    return true;
  }

  async validateRewardEligibility(data) {
    const { contentId, metric, threshold } = data;
    
    const content = await this.contentDAO.findById(contentId);
    if (!content || content.moderation_status !== 'approved') {
      throw new Error('Content not eligible for rewards');
    }

    // Check if content meets minimum performance thresholds
    const stats = await this.contentDAO.getContentStats(contentId);
    if (stats[metric] < threshold) {
      return false;
    }

    // Check if rewards already distributed
    const existingReward = await this.contentDAO.getContentReward(contentId, metric);
    if (existingReward) {
      return false;
    }

    return true;
  }

  /**
   * Submit content with validation and processing
   */
  async submitContent(userId, contentData, uploadMetadata = {}) {
    return await this.executeOperation('submitContent', async () => {
      return await this.executeTransaction(async () => {
        // Create content record
        const content = await this.contentDAO.create({
          ...contentData,
          user_id: userId,
          moderation_status: 'pending',
          submitted_at: new Date(),
          upload_metadata: uploadMetadata
        });

        // Update user statistics
        if (this.userDAO) {
          await this.userDAO.updateUserStats(userId, {
            total_content_submitted: { operator: '+', value: 1 }
          });
        }

        // Update clan statistics if applicable
        if (contentData.clan_id && this.clanDAO) {
          await this.clanDAO.updateClanStats(contentData.clan_id, {
            total_content_submitted: { operator: '+', value: 1 }
          });
        }

        // Initialize content engagement tracking
        await this.initializeContentEngagement(content.id);

        // Emit content submission event
        if (this.eventEmitter) {
          this.eventEmitter.emit('content:submitted', {
            content,
            userId,
            clanId: contentData.clan_id
          });
        }

        return content;
      });
    }, { userId, contentData });
  }

  /**
   * Initialize engagement tracking for new content
   */
  async initializeContentEngagement(contentId) {
    try {
      await this.contentDAO.updateContentStats(contentId, {
        view_count: 0,
        upvote_count: 0,
        downvote_count: 0,
        comment_count: 0,
        share_count: 0,
        vote_score: 0,
        engagement_score: 0
      });
    } catch (error) {
      this.logger.warn('Failed to initialize content engagement:', error);
    }
  }

  /**
   * Moderate content (approve, reject, flag)
   */
  async moderateContent(moderatorId, contentId, action, reason = null, metadata = {}) {
    return await this.executeOperation('moderateContent', async () => {
      return await this.executeTransaction(async () => {
        const content = await this.contentDAO.findById(contentId);
        
        // Update moderation status
        const updatedContent = await this.contentDAO.updateModerationStatus(contentId, {
          moderation_status: action === 'flag' ? 'flagged' : action + 'd',
          moderated_by: moderatorId,
          moderated_at: new Date(),
          moderation_reason: reason,
          moderation_metadata: metadata
        });

        // Create moderation log
        await this.contentDAO.createModerationLog({
          content_id: contentId,
          moderator_id: moderatorId,
          action,
          reason,
          previous_status: content.moderation_status,
          new_status: updatedContent.moderation_status
        });

        // Handle approval rewards
        if (action === 'approve') {
          await this.handleContentApprovalRewards(contentId, content.user_id, content.clan_id);
        }

        // Handle rejection penalties
        if (action === 'reject') {
          await this.handleContentRejectionPenalties(content.user_id);
        }

        // Emit moderation event
        if (this.eventEmitter) {
          this.eventEmitter.emit('content:moderated', {
            contentId,
            moderatorId,
            action,
            content: updatedContent
          });
        }

        return updatedContent;
      });
    }, { moderatorId, contentId, action, reason });
  }

  /**
   * Handle rewards for approved content
   */
  async handleContentApprovalRewards(contentId, userId, clanId) {
    try {
      // User reputation reward
      if (this.userDAO) {
        await this.userDAO.updateUserStats(userId, {
          total_content_approved: { operator: '+', value: 1 },
          reputation_score: { operator: '+', value: 5 }
        });
      }

      // Clan reputation reward
      if (clanId && this.clanDAO) {
        await this.clanDAO.updateClanStats(clanId, {
          total_content_approved: { operator: '+', value: 1 },
          reputation_score: { operator: '+', value: 3 }
        });
      }

      // Check for content achievement progress
      if (this.achievementDAO) {
        await this.achievementDAO.updateProgress(userId, 'content_creator', {
          approved_content: 1
        });
      }
    } catch (error) {
      this.logger.warn('Failed to process approval rewards:', error);
    }
  }

  /**
   * Handle penalties for rejected content
   */
  async handleContentRejectionPenalties(userId) {
    try {
      // Track rejection for user
      if (this.userDAO) {
        await this.userDAO.updateUserStats(userId, {
          total_content_rejected: { operator: '+', value: 1 }
        });

        // Apply reputation penalty for repeated rejections
        const user = await this.userDAO.findById(userId);
        const rejectionRate = user.total_content_rejected / (user.total_content_submitted || 1);
        
        if (rejectionRate > 0.3) { // More than 30% rejection rate
          await this.userDAO.updateUserStats(userId, {
            reputation_score: { operator: '-', value: 2 }
          });
        }
      }
    } catch (error) {
      this.logger.warn('Failed to process rejection penalties:', error);
    }
  }

  /**
   * Get content with comprehensive data
   */
  async getContentDetails(contentId, viewerId = null, options = {}) {
    return await this.executeOperation('getContentDetails', async () => {
      const content = await this.contentDAO.findById(contentId);
      if (!content) {
        throw new Error('Content not found');
      }

      // Check visibility permissions
      if (!await this.checkContentVisibility(content, viewerId)) {
        throw new Error('Content not accessible');
      }

      const details = { ...content };

      if (options.includeStats) {
        const stats = await this.contentDAO.getContentStats(contentId);
        details.stats = stats;
      }

      if (options.includeComments) {
        const comments = await this.contentDAO.getContentComments(contentId, {
          limit: options.commentLimit || 20
        });
        details.comments = comments;
      }

      if (options.includeRankings) {
        const rankings = await this.getContentRankings(contentId);
        details.rankings = rankings;
      }

      if (viewerId) {
        const [userVote, userEngagement] = await Promise.all([
          this.votingDAO.getUserVote(viewerId, contentId, 'content'),
          this.contentDAO.getUserContentEngagement(viewerId, contentId)
        ]);
        
        details.viewerData = {
          hasVoted: !!userVote,
          voteType: userVote?.vote_type,
          engagement: userEngagement
        };
      }

      // Track view if not the owner
      if (viewerId && viewerId !== content.user_id) {
        await this.trackContentView(contentId, viewerId);
      }

      return details;
    }, { contentId, viewerId, options });
  }

  /**
   * Check if user can view content based on visibility settings
   */
  async checkContentVisibility(content, viewerId) {
    if (content.visibility === 'public') {
      return true;
    }

    if (!viewerId) {
      return false;
    }

    if (content.user_id === viewerId) {
      return true; // Owner can always view
    }

    if (content.visibility === 'clan' && content.clan_id) {
      const membership = await this.clanDAO.getMembership(content.clan_id, viewerId);
      return !!membership;
    }

    if (content.visibility === 'private') {
      return false;
    }

    return true;
  }

  /**
   * Track content view for analytics
   */
  async trackContentView(contentId, viewerId) {
    try {
      // Update view count (with deduplication)
      await this.contentDAO.incrementViewCount(contentId, viewerId);

      // Update engagement tracking
      await this.contentDAO.updateUserContentEngagement(viewerId, contentId, {
        last_viewed: new Date(),
        view_count: { operator: '+', value: 1 }
      });
    } catch (error) {
      this.logger.warn('Failed to track content view:', error);
    }
  }

  /**
   * Get content rankings across different metrics
   */
  async getContentRankings(contentId) {
    const [
      voteRank,
      viewRank,
      engagementRank
    ] = await Promise.all([
      this.contentDAO.getContentRanking(contentId, 'vote_score'),
      this.contentDAO.getContentRanking(contentId, 'view_count'),
      this.contentDAO.getContentRanking(contentId, 'engagement_score')
    ]);

    return {
      votes: voteRank,
      views: viewRank,
      engagement: engagementRank
    };
  }

  /**
   * Search content with advanced filtering
   */
  async searchContent(searchParams, options = {}) {
    return await this.executeOperation('searchContent', async () => {
      // Add visibility filter based on viewer
      if (options.viewerId) {
        searchParams.visibilityFilter = await this.buildVisibilityFilter(options.viewerId);
      } else {
        searchParams.visibility = 'public';
      }

      const results = await this.contentDAO.searchContent(searchParams, options);

      // Enrich results with additional data if requested
      if (options.includeUserData) {
        for (const content of results.content) {
          const user = await this.userDAO.findById(content.user_id);
          content.user = {
            id: user.id,
            username: user.username,
            reputation_score: user.reputation_score
          };
        }
      }

      return results;
    }, { searchParams, options });
  }

  /**
   * Build visibility filter based on user's clan memberships
   */
  async buildVisibilityFilter(viewerId) {
    const userClans = await this.clanDAO.getUserMemberships(viewerId);
    const clanIds = userClans.map(m => m.clan_id);

    return {
      public: true,
      userContent: viewerId,
      clanContent: clanIds
    };
  }

  /**
   * Get trending content with dynamic ranking
   */
  async getTrendingContent(options = {}) {
    return await this.executeOperation('getTrendingContent', async () => {
      const timeframe = options.timeframe || '24h';
      const category = options.category;
      const platform = options.platform;

      // Calculate trending scores
      const trendingContent = await this.contentDAO.getTrendingContent({
        timeframe,
        category,
        platform,
        limit: options.limit || 20,
        algorithm: options.algorithm || 'weighted_engagement'
      });

      return trendingContent;
    }, { options });
  }

  /**
   * Get content leaderboard
   */
  async getContentLeaderboard(metric = 'vote_score', options = {}) {
    return await this.executeOperation('getContentLeaderboard', async () => {
      return await this.contentDAO.getContentLeaderboard(metric, options);
    }, { metric, options });
  }

  /**
   * Process high-performing content rewards
   */
  async processContentRewards(contentId, rewardType = 'performance') {
    return await this.executeOperation('processContentRewards', async () => {
      return await this.executeTransaction(async () => {
        const content = await this.contentDAO.findById(contentId);
        
        // Validate reward eligibility
        const isEligible = await this.validateBusinessRule('rewardEligibility', {
          contentId,
          metric: 'vote_score',
          threshold: 100 // Minimum score for rewards
        });

        if (!isEligible) {
          throw new Error('Content not eligible for rewards');
        }

        // Calculate reward amount based on performance
        const rewardAmount = await this.calculateContentReward(contentId, rewardType);

        // Create reward record
        const reward = await this.contentDAO.createContentReward({
          content_id: contentId,
          user_id: content.user_id,
          clan_id: content.clan_id,
          reward_type: rewardType,
          amount: rewardAmount,
          processed_at: new Date()
        });

        // Update user rewards
        if (this.userDAO) {
          await this.userDAO.updateUserStats(content.user_id, {
            total_rewards_earned: { operator: '+', value: rewardAmount },
            reputation_score: { operator: '+', value: 10 }
          });
        }

        // Update clan rewards if applicable
        if (content.clan_id && this.clanDAO) {
          await this.clanDAO.updateClanStats(content.clan_id, {
            total_rewards_earned: { operator: '+', value: Math.floor(rewardAmount * 0.1) }
          });
        }

        // Emit reward event
        if (this.eventEmitter) {
          this.eventEmitter.emit('content:rewardProcessed', {
            reward,
            contentId,
            userId: content.user_id,
            amount: rewardAmount
          });
        }

        return reward;
      });
    }, { contentId, rewardType });
  }

  /**
   * Calculate content reward based on performance metrics
   */
  async calculateContentReward(contentId, rewardType) {
    const stats = await this.contentDAO.getContentStats(contentId);
    
    let baseReward = 0;
    
    switch (rewardType) {
      case 'performance':
        // Score-based reward
        baseReward = Math.min(50, Math.floor(stats.vote_score / 10));
        break;
      case 'engagement':
        // Engagement-based reward
        baseReward = Math.min(30, Math.floor(stats.engagement_score / 20));
        break;
      case 'trending':
        // Trending bonus
        baseReward = 75;
        break;
      default:
        baseReward = 10;
    }

    return Math.max(1, baseReward);
  }

  /**
   * Update content engagement scores (called by scheduler)
   */
  async updateContentEngagementScores() {
    return await this.executeOperation('updateEngagementScores', async () => {
      const updatedCount = await this.contentDAO.recalculateAllEngagementScores();
      
      // Emit update event
      if (this.eventEmitter) {
        this.eventEmitter.emit('content:engagementScoresUpdated', {
          updatedCount,
          timestamp: new Date()
        });
      }

      return { updatedCount };
    });
  }

  async updateAnalytics(operationName, result, context) {
    // Track content-specific analytics
    if (this.metrics) {
      this.metrics.recordContentOperation(operationName, context.contentId, context.userId);
    }
  }
}

export default ContentRepository;