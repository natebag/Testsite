/**
 * Content Controller for MLG.clan API
 * 
 * Handles content submission, moderation, voting, search,
 * and content-related operations using the ContentRepository.
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

import { asyncHandler } from '../middleware/error.middleware.js';
import { APIErrors } from '../middleware/error.middleware.js';

/**
 * Content Controller Class
 */
export class ContentController {
  /**
   * Submit new content
   * POST /api/content/submit
   */
  static submitContent = asyncHandler(async (req, res) => {
    const { 
      title, 
      description, 
      contentType, 
      contentUrl, 
      thumbnailUrl, 
      duration, 
      tags, 
      isNSFW, 
      clanId, 
      metadata 
    } = req.body;
    
    const contentRepository = req.services.contentRepository;
    if (!contentRepository) {
      throw APIErrors.INTERNAL_ERROR('Content service unavailable');
    }
    
    try {
      const contentData = {
        title,
        description,
        content_type: contentType,
        content_url: contentUrl,
        thumbnail_url: thumbnailUrl,
        duration,
        tags: tags || [],
        is_nsfw: isNSFW || false,
        clan_id: clanId,
        submitted_by: req.user.id,
        metadata: metadata || {},
        status: 'pending' // Default status for new submissions
      };
      
      const content = await contentRepository.submitContent(contentData);
      
      // Emit content submission event
      if (req.io) {
        req.io.emit('content_submitted', {
          content: {
            id: content.id,
            title: content.title,
            contentType: content.content_type,
            submittedBy: req.user.username || 'Anonymous'
          }
        });
        
        // Notify clan members if submitted to a clan
        if (clanId) {
          req.io.to(`clan:${clanId}`).emit('clan_content_submitted', {
            content,
            submitter: {
              id: req.user.id,
              username: req.user.username || 'Anonymous'
            }
          });
        }
      }
      
      res.status(201).json({
        success: true,
        data: {
          content
        },
        message: 'Content submitted successfully'
      });
      
    } catch (error) {
      if (error.message.includes('rate limit') || error.message.includes('daily limit')) {
        throw APIErrors.BUSINESS_RULE_VIOLATION('Submission limits', error.message);
      }
      
      if (error.message.includes('validation') || error.message.includes('invalid')) {
        throw APIErrors.VALIDATION_FAILED([{
          field: 'contentUrl',
          message: 'Invalid content URL or format',
          value: contentUrl
        }]);
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Get content with filtering and search
   * GET /api/content
   */
  static getContent = asyncHandler(async (req, res) => {
    const searchParams = {
      query: req.query.query,
      contentType: req.query.contentType,
      tags: req.query.tags ? req.query.tags.split(',') : undefined,
      game: req.query.game,
      clanId: req.query.clanId,
      userId: req.query.userId,
      status: req.query.status,
      isNSFW: req.query.isNSFW === 'true',
      duration: req.query.duration ? {
        min: req.query.minDuration,
        max: req.query.maxDuration
      } : undefined,
      dateRange: req.query.startDate ? {
        start: new Date(req.query.startDate),
        end: req.query.endDate ? new Date(req.query.endDate) : undefined
      } : undefined
    };
    
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      offset: req.query.offset ? parseInt(req.query.offset) : undefined,
      orderBy: req.query.field ? [[req.query.field, req.query.order || 'desc']] : [['created_at', 'desc']],
      includeVoteCounts: req.query.includeVoteCounts === 'true',
      includeMetadata: req.query.includeMetadata === 'true'
    };
    
    const contentRepository = req.services.contentRepository;
    if (!contentRepository) {
      throw APIErrors.INTERNAL_ERROR('Content service unavailable');
    }
    
    try {
      const results = await contentRepository.searchContent(searchParams, options);
      
      res.status(200).json({
        success: true,
        data: {
          content: results.content || results,
          pagination: {
            page: options.page,
            limit: options.limit,
            total: results.total || 0,
            totalPages: Math.ceil((results.total || 0) / options.limit)
          }
        },
        message: 'Content retrieved successfully'
      });
      
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Get content details
   * GET /api/content/:id
   */
  static getContentDetails = asyncHandler(async (req, res) => {
    const { id: contentId } = req.params;
    const { includeVotes = 'false', includeComments = 'false' } = req.query;
    
    const contentRepository = req.services.contentRepository;
    if (!contentRepository) {
      throw APIErrors.INTERNAL_ERROR('Content service unavailable');
    }
    
    try {
      const content = await contentRepository.getContentDetails(contentId, {
        includeVotes: includeVotes === 'true',
        includeComments: includeComments === 'true',
        viewerId: req.user?.id
      });
      
      if (!content) {
        throw APIErrors.RESOURCE_NOT_FOUND('Content', contentId);
      }
      
      // Track content view if user is authenticated
      if (req.user) {
        await contentRepository.trackContentView(contentId, req.user.id);
      }
      
      res.status(200).json({
        success: true,
        data: {
          content
        },
        message: 'Content details retrieved successfully'
      });
      
    } catch (error) {
      if (error.message.includes('not found')) {
        throw APIErrors.RESOURCE_NOT_FOUND('Content', contentId);
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Vote on content
   * POST /api/content/:id/vote
   */
  static voteOnContent = asyncHandler(async (req, res) => {
    const { id: contentId } = req.params;
    const { voteType, votePower = 1 } = req.body;
    
    const votingRepository = req.services.votingRepository;
    if (!votingRepository) {
      throw APIErrors.INTERNAL_ERROR('Voting service unavailable');
    }
    
    try {
      const voteResult = await votingRepository.castVote(
        req.user.id,
        contentId,
        voteType,
        votePower
      );
      
      // Emit real-time vote update
      if (req.io) {
        req.io.emit('content_vote_update', {
          contentId,
          voteType,
          votePower,
          newCounts: voteResult.voteCounts
        });
      }
      
      res.status(200).json({
        success: true,
        data: voteResult,
        message: 'Vote cast successfully'
      });
      
    } catch (error) {
      if (error.message.includes('not found')) {
        throw APIErrors.RESOURCE_NOT_FOUND('Content', contentId);
      }
      
      if (error.message.includes('already voted')) {
        throw APIErrors.RESOURCE_CONFLICT('Vote', 'User already voted on this content');
      }
      
      if (error.message.includes('own content')) {
        throw APIErrors.BUSINESS_RULE_VIOLATION('Self-voting', 'Cannot vote on your own content');
      }
      
      if (error.message.includes('insufficient votes')) {
        throw APIErrors.BUSINESS_RULE_VIOLATION('Vote limits', 'Insufficient daily votes remaining');
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Moderate content (approve/reject/flag)
   * POST /api/content/:id/moderate
   */
  static moderateContent = asyncHandler(async (req, res) => {
    const { id: contentId } = req.params;
    const { action, reason, metadata } = req.body;
    
    // Check if user has moderation permissions
    const hasModeratorRole = req.user.roles?.includes('moderator') || 
                           req.user.roles?.includes('admin') ||
                           req.user.roles?.includes('owner');
    
    if (!hasModeratorRole) {
      throw APIErrors.INSUFFICIENT_PERMISSIONS(['moderator', 'admin'], req.user.roles || []);
    }
    
    const contentRepository = req.services.contentRepository;
    if (!contentRepository) {
      throw APIErrors.INTERNAL_ERROR('Content service unavailable');
    }
    
    try {
      const moderationResult = await contentRepository.moderateContent(
        contentId,
        req.user.id,
        action,
        reason,
        metadata
      );
      
      // Emit moderation event
      if (req.io) {
        // Notify content owner
        if (moderationResult.contentOwnerId) {
          req.io.to(`user:${moderationResult.contentOwnerId}`).emit('content_moderated', {
            contentId,
            action,
            reason,
            moderatedBy: req.user.username || 'Moderator'
          });
        }
        
        // Broadcast to moderators
        req.io.emit('content_moderation_update', {
          contentId,
          action,
          moderatedBy: req.user.id
        });
      }
      
      res.status(200).json({
        success: true,
        data: moderationResult,
        message: 'Content moderated successfully'
      });
      
    } catch (error) {
      if (error.message.includes('not found')) {
        throw APIErrors.RESOURCE_NOT_FOUND('Content', contentId);
      }
      
      if (error.message.includes('already moderated')) {
        throw APIErrors.RESOURCE_CONFLICT('Moderation', 'Content already moderated');
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Get trending content
   * GET /api/content/trending
   */
  static getTrendingContent = asyncHandler(async (req, res) => {
    const { 
      period = '24h', 
      contentType, 
      limit = 20,
      clanId 
    } = req.query;
    
    const contentRepository = req.services.contentRepository;
    if (!contentRepository) {
      throw APIErrors.INTERNAL_ERROR('Content service unavailable');
    }
    
    try {
      const trendingContent = await contentRepository.getTrendingContent({
        period,
        contentType,
        limit: parseInt(limit),
        clanId
      });
      
      res.status(200).json({
        success: true,
        data: {
          trending: trendingContent,
          period,
          generatedAt: new Date().toISOString()
        },
        message: 'Trending content retrieved successfully'
      });
      
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Get content leaderboard
   * GET /api/content/leaderboard
   */
  static getContentLeaderboard = asyncHandler(async (req, res) => {
    const { 
      metric = 'vote_score', 
      period = '30d',
      contentType,
      limit = 50 
    } = req.query;
    
    const contentRepository = req.services.contentRepository;
    if (!contentRepository) {
      throw APIErrors.INTERNAL_ERROR('Content service unavailable');
    }
    
    try {
      const leaderboard = await contentRepository.getContentLeaderboard({
        metric,
        period,
        contentType,
        limit: parseInt(limit)
      });
      
      // Add rank numbers
      const rankedLeaderboard = leaderboard.map((item, index) => ({
        ...item,
        rank: index + 1
      }));
      
      res.status(200).json({
        success: true,
        data: {
          leaderboard: rankedLeaderboard,
          metric,
          period
        },
        message: 'Content leaderboard retrieved successfully'
      });
      
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Report content
   * POST /api/content/:id/report
   */
  static reportContent = asyncHandler(async (req, res) => {
    const { id: contentId } = req.params;
    const { reason, description, evidence } = req.body;
    
    const contentRepository = req.services.contentRepository;
    if (!contentRepository) {
      throw APIErrors.INTERNAL_ERROR('Content service unavailable');
    }
    
    try {
      const report = await contentRepository.reportContent({
        contentId,
        reportedBy: req.user.id,
        reason,
        description,
        evidence: evidence || []
      });
      
      // Emit report event for moderators
      if (req.io) {
        req.io.emit('content_reported', {
          contentId,
          reason,
          reportedBy: req.user.username || 'Anonymous',
          reportId: report.id
        });
      }
      
      res.status(200).json({
        success: true,
        data: {
          report
        },
        message: 'Content reported successfully'
      });
      
    } catch (error) {
      if (error.message.includes('not found')) {
        throw APIErrors.RESOURCE_NOT_FOUND('Content', contentId);
      }
      
      if (error.message.includes('already reported')) {
        throw APIErrors.RESOURCE_CONFLICT('Report', 'Content already reported by user');
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Update content (owner only)
   * PUT /api/content/:id
   */
  static updateContent = asyncHandler(async (req, res) => {
    const { id: contentId } = req.params;
    const updateData = req.body;
    
    const contentRepository = req.services.contentRepository;
    if (!contentRepository) {
      throw APIErrors.INTERNAL_ERROR('Content service unavailable');
    }
    
    try {
      // First check if user owns the content
      const content = await contentRepository.contentDAO.findById(contentId);
      
      if (!content) {
        throw APIErrors.RESOURCE_NOT_FOUND('Content', contentId);
      }
      
      if (content.submitted_by !== req.user.id && !req.user.roles?.includes('admin')) {
        throw APIErrors.INSUFFICIENT_PERMISSIONS(['owner', 'admin'], ['user']);
      }
      
      const updatedContent = await contentRepository.updateContent(contentId, {
        title: updateData.title,
        description: updateData.description,
        thumbnail_url: updateData.thumbnailUrl,
        tags: updateData.tags,
        is_nsfw: updateData.isNSFW,
        metadata: updateData.metadata
      });
      
      res.status(200).json({
        success: true,
        data: {
          content: updatedContent
        },
        message: 'Content updated successfully'
      });
      
    } catch (error) {
      if (error.message.includes('not found')) {
        throw APIErrors.RESOURCE_NOT_FOUND('Content', contentId);
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Delete content (owner or admin only)
   * DELETE /api/content/:id
   */
  static deleteContent = asyncHandler(async (req, res) => {
    const { id: contentId } = req.params;
    const { reason } = req.body;
    
    const contentRepository = req.services.contentRepository;
    if (!contentRepository) {
      throw APIErrors.INTERNAL_ERROR('Content service unavailable');
    }
    
    try {
      // Check if user owns the content or is admin
      const content = await contentRepository.contentDAO.findById(contentId);
      
      if (!content) {
        throw APIErrors.RESOURCE_NOT_FOUND('Content', contentId);
      }
      
      if (content.submitted_by !== req.user.id && !req.user.roles?.includes('admin')) {
        throw APIErrors.INSUFFICIENT_PERMISSIONS(['owner', 'admin'], ['user']);
      }
      
      await contentRepository.deleteContent(contentId, req.user.id, reason);
      
      // Emit deletion event
      if (req.io) {
        req.io.emit('content_deleted', {
          contentId,
          deletedBy: req.user.id,
          reason
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Content deleted successfully'
      });
      
    } catch (error) {
      if (error.message.includes('not found')) {
        throw APIErrors.RESOURCE_NOT_FOUND('Content', contentId);
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Get content analytics (owner/admin only)
   * GET /api/content/:id/analytics
   */
  static getContentAnalytics = asyncHandler(async (req, res) => {
    const { id: contentId } = req.params;
    const { period = '30d' } = req.query;
    
    const contentRepository = req.services.contentRepository;
    if (!contentRepository) {
      throw APIErrors.INTERNAL_ERROR('Content service unavailable');
    }
    
    try {
      // Check ownership or admin privileges
      const content = await contentRepository.contentDAO.findById(contentId);
      
      if (!content) {
        throw APIErrors.RESOURCE_NOT_FOUND('Content', contentId);
      }
      
      if (content.submitted_by !== req.user.id && !req.user.roles?.includes('admin')) {
        throw APIErrors.INSUFFICIENT_PERMISSIONS(['owner', 'admin'], ['user']);
      }
      
      const analytics = await contentRepository.getContentAnalytics(contentId, period);
      
      res.status(200).json({
        success: true,
        data: {
          analytics
        },
        message: 'Content analytics retrieved successfully'
      });
      
    } catch (error) {
      if (error.message.includes('not found')) {
        throw APIErrors.RESOURCE_NOT_FOUND('Content', contentId);
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
}

export default ContentController;