/**
 * Content Routes for MLG.clan API
 * 
 * Routes for content submission, moderation, voting, search,
 * trending content, and content management.
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

import express from 'express';
import { ContentController } from '../controllers/content.controller.js';
import { validate, schemas } from '../middleware/validation.middleware.js';
import { 
  authMiddleware, 
  optionalAuthMiddleware, 
  requireRole,
  requireSelfOrAdmin 
} from '../middleware/auth.middleware.js';
import { rateLimiterMiddleware } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

/**
 * Content Submission and Management Routes
 */

/**
 * POST /api/content/submit
 * Submit new content
 * 
 * @header {string} Authorization - Bearer access token
 * @body {string} title - Content title
 * @body {string} [description] - Content description
 * @body {string} contentType - Content type (video, image, stream, etc.)
 * @body {string} contentUrl - URL to content
 * @body {string} [thumbnailUrl] - Thumbnail URL
 * @body {number} [duration] - Content duration in seconds
 * @body {array} [tags] - Content tags
 * @body {boolean} [isNSFW=false] - NSFW flag
 * @body {string} [clanId] - Associated clan ID
 * @body {object} [metadata] - Additional metadata
 * @returns {object} Submitted content data
 */
router.post('/submit',
  authMiddleware,
  rateLimiterMiddleware('contentSubmit'),
  validate(schemas.content.submit),
  ContentController.submitContent
);

/**
 * GET /api/content
 * Get content with filtering and search
 * 
 * @query {string} [query] - Search query
 * @query {string} [contentType] - Content type filter
 * @query {string} [tags] - Comma-separated tags
 * @query {string} [game] - Game filter
 * @query {string} [clanId] - Clan ID filter
 * @query {string} [userId] - User ID filter
 * @query {string} [status] - Content status filter
 * @query {boolean} [isNSFW] - NSFW filter
 * @query {number} [minDuration] - Minimum duration
 * @query {number} [maxDuration] - Maximum duration
 * @query {string} [startDate] - Start date filter
 * @query {string} [endDate] - End date filter
 * @query {number} [page=1] - Page number
 * @query {number} [limit=20] - Results per page
 * @query {string} [field] - Sort field
 * @query {string} [order=desc] - Sort order
 * @query {boolean} [includeVoteCounts=false] - Include vote counts
 * @query {boolean} [includeMetadata=false] - Include metadata
 * @returns {object} Content list with pagination
 */
router.get('/',
  optionalAuthMiddleware,
  rateLimiterMiddleware('search'),
  validate(schemas.content.search, 'query'),
  ContentController.getContent
);

/**
 * GET /api/content/trending
 * Get trending content
 * 
 * @query {string} [period=24h] - Trending period
 * @query {string} [contentType] - Content type filter
 * @query {number} [limit=20] - Number of results
 * @query {string} [clanId] - Clan filter
 * @returns {object} Trending content list
 */
router.get('/trending',
  optionalAuthMiddleware,
  rateLimiterMiddleware('search'),
  ContentController.getTrendingContent
);

/**
 * GET /api/content/leaderboard
 * Get content leaderboard
 * 
 * @query {string} [metric=vote_score] - Ranking metric
 * @query {string} [period=30d] - Time period
 * @query {string} [contentType] - Content type filter
 * @query {number} [limit=50] - Number of results
 * @returns {object} Content leaderboard
 */
router.get('/leaderboard',
  optionalAuthMiddleware,
  rateLimiterMiddleware('user'),
  ContentController.getContentLeaderboard
);

/**
 * GET /api/content/:id
 * Get content details
 * 
 * @param {string} id - Content ID
 * @query {boolean} [includeVotes=false] - Include vote details
 * @query {boolean} [includeComments=false] - Include comments
 * @returns {object} Detailed content information
 */
router.get('/:id',
  optionalAuthMiddleware,
  rateLimiterMiddleware('user'),
  ContentController.getContentDetails
);

/**
 * PUT /api/content/:id
 * Update content (owner only)
 * 
 * @header {string} Authorization - Bearer access token
 * @param {string} id - Content ID
 * @body {string} [title] - Content title
 * @body {string} [description] - Content description
 * @body {string} [thumbnailUrl] - Thumbnail URL
 * @body {array} [tags] - Content tags
 * @body {boolean} [isNSFW] - NSFW flag
 * @body {object} [metadata] - Additional metadata
 * @returns {object} Updated content data
 */
router.put('/:id',
  authMiddleware,
  rateLimiterMiddleware('user'),
  validate(schemas.content.update),
  ContentController.updateContent
);

/**
 * DELETE /api/content/:id
 * Delete content (owner or admin only)
 * 
 * @header {string} Authorization - Bearer access token
 * @param {string} id - Content ID
 * @body {string} [reason] - Deletion reason
 * @returns {object} Deletion confirmation
 */
router.delete('/:id',
  authMiddleware,
  rateLimiterMiddleware('user'),
  ContentController.deleteContent
);

/**
 * POST /api/content/:id/vote
 * Vote on content
 * 
 * @header {string} Authorization - Bearer access token
 * @param {string} id - Content ID
 * @body {string} voteType - Vote type ('up' or 'down')
 * @body {number} [votePower=1] - Vote power
 * @returns {object} Vote confirmation and updated counts
 */
router.post('/:id/vote',
  authMiddleware,
  rateLimiterMiddleware('voting'),
  validate(schemas.content.vote),
  ContentController.voteOnContent
);

/**
 * POST /api/content/:id/moderate
 * Moderate content (approve/reject/flag)
 * 
 * @header {string} Authorization - Bearer access token
 * @param {string} id - Content ID
 * @body {string} action - Moderation action
 * @body {string} [reason] - Moderation reason
 * @body {object} [metadata] - Additional metadata
 * @returns {object} Moderation confirmation
 */
router.post('/:id/moderate',
  authMiddleware,
  requireRole('moderator'),
  rateLimiterMiddleware('user'),
  validate(schemas.content.moderate),
  ContentController.moderateContent
);

/**
 * POST /api/content/:id/report
 * Report content for moderation
 * 
 * @header {string} Authorization - Bearer access token
 * @param {string} id - Content ID
 * @body {string} reason - Report reason
 * @body {string} [description] - Detailed description
 * @body {array} [evidence] - Evidence URLs
 * @returns {object} Report confirmation
 */
router.post('/:id/report',
  authMiddleware,
  rateLimiterMiddleware('user'),
  validate(schemas.content.report),
  ContentController.reportContent
);

/**
 * GET /api/content/:id/analytics
 * Get content analytics (owner/admin only)
 * 
 * @header {string} Authorization - Bearer access token
 * @param {string} id - Content ID
 * @query {string} [period=30d] - Analytics period
 * @returns {object} Content analytics data
 */
router.get('/:id/analytics',
  authMiddleware,
  rateLimiterMiddleware('user'),
  ContentController.getContentAnalytics
);

/**
 * Additional content utility routes
 */

/**
 * GET /api/content/user/:userId
 * Get content by specific user
 */
router.get('/user/:userId',
  optionalAuthMiddleware,
  rateLimiterMiddleware('user'),
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20, status, contentType } = req.query;
      
      const contentRepository = req.services.contentRepository;
      
      if (!contentRepository) {
        return res.status(500).json({
          error: 'Content service unavailable',
          code: 'SERVICE_ERROR'
        });
      }
      
      const searchParams = {
        userId,
        status,
        contentType
      };
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        orderBy: [['created_at', 'desc']]
      };
      
      const results = await contentRepository.searchContent(searchParams, options);
      
      res.status(200).json({
        success: true,
        data: {
          content: results.content || results,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: results.total || 0,
            totalPages: Math.ceil((results.total || 0) / parseInt(limit))
          }
        },
        message: 'User content retrieved successfully'
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/content/clan/:clanId
 * Get content for specific clan
 */
router.get('/clan/:clanId',
  optionalAuthMiddleware,
  rateLimiterMiddleware('user'),
  async (req, res, next) => {
    try {
      const { clanId } = req.params;
      const { page = 1, limit = 20, contentType, status = 'approved' } = req.query;
      
      const contentRepository = req.services.contentRepository;
      
      const searchParams = {
        clanId,
        contentType,
        status
      };
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        orderBy: [['created_at', 'desc']]
      };
      
      const results = await contentRepository.searchContent(searchParams, options);
      
      res.status(200).json({
        success: true,
        data: {
          content: results.content || results,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: results.total || 0,
            totalPages: Math.ceil((results.total || 0) / parseInt(limit))
          }
        },
        message: 'Clan content retrieved successfully'
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/content/tags/popular
 * Get popular content tags
 */
router.get('/tags/popular',
  optionalAuthMiddleware,
  rateLimiterMiddleware('search'),
  async (req, res, next) => {
    try {
      const { limit = 20, period = '30d' } = req.query;
      
      const contentRepository = req.services.contentRepository;
      
      const popularTags = await contentRepository.getPopularTags({
        limit: parseInt(limit),
        period
      });
      
      res.status(200).json({
        success: true,
        data: {
          tags: popularTags
        },
        message: 'Popular tags retrieved successfully'
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/content/moderation/queue
 * Get content moderation queue (moderators only)
 */
router.get('/moderation/queue',
  authMiddleware,
  requireRole('moderator'),
  rateLimiterMiddleware('user'),
  async (req, res, next) => {
    try {
      const { page = 1, limit = 20, status = 'pending' } = req.query;
      
      const contentRepository = req.services.contentRepository;
      
      const moderationQueue = await contentRepository.getModerationQueue({
        status,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      res.status(200).json({
        success: true,
        data: {
          queue: moderationQueue.content || moderationQueue,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: moderationQueue.total || 0,
            totalPages: Math.ceil((moderationQueue.total || 0) / parseInt(limit))
          }
        },
        message: 'Moderation queue retrieved successfully'
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/content/reports
 * Get content reports (moderators only)
 */
router.get('/reports',
  authMiddleware,
  requireRole('moderator'),
  rateLimiterMiddleware('user'),
  async (req, res, next) => {
    try {
      const { page = 1, limit = 20, status = 'pending', reason } = req.query;
      
      const contentRepository = req.services.contentRepository;
      
      const reports = await contentRepository.getContentReports({
        status,
        reason,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      res.status(200).json({
        success: true,
        data: {
          reports,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: reports.length,
            hasMore: reports.length === parseInt(limit)
          }
        },
        message: 'Content reports retrieved successfully'
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/content/reports/:reportId/resolve
 * Resolve content report (moderators only)
 */
router.post('/reports/:reportId/resolve',
  authMiddleware,
  requireRole('moderator'),
  rateLimiterMiddleware('user'),
  async (req, res, next) => {
    try {
      const { reportId } = req.params;
      const { action, resolution, notes } = req.body;
      
      const contentRepository = req.services.contentRepository;
      
      const result = await contentRepository.resolveContentReport(reportId, {
        resolvedBy: req.user.id,
        action,
        resolution,
        notes
      });
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Content report resolved successfully'
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/content/stats/global
 * Get global content statistics (admin only)
 */
router.get('/stats/global',
  authMiddleware,
  requireRole('admin'),
  rateLimiterMiddleware('user'),
  async (req, res, next) => {
    try {
      const { period = '30d' } = req.query;
      
      const contentRepository = req.services.contentRepository;
      
      const stats = await contentRepository.getGlobalContentStats(period);
      
      res.status(200).json({
        success: true,
        data: {
          stats
        },
        message: 'Global content statistics retrieved successfully'
      });
      
    } catch (error) {
      next(error);
    }
  }
);

export default router;