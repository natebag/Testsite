/**
 * Content Data Access Object (DAO) for MLG.clan Platform
 * 
 * Handles all database operations related to content submissions, moderation,
 * engagement tracking, and content discovery with comprehensive validation and caching.
 * 
 * Features:
 * - Content submission and management
 * - Moderation workflow and approval process
 * - Engagement metrics and analytics
 * - Search and discovery algorithms
 * - Content ranking and recommendations
 * - File metadata and validation
 * - Real-time content statistics
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

import Joi from 'joi';
import { BaseDAO } from './BaseDAO.js';

/**
 * Validation schemas for content operations
 */
const CONTENT_SCHEMAS = {
  submission: Joi.object({
    user_id: Joi.string().uuid().required(),
    clan_id: Joi.string().uuid().optional().allow(null),
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().min(10).max(1000).required(),
    content_type: Joi.string().valid('video', 'image', 'document', 'audio', 'stream').required(),
    gaming_platform: Joi.string().valid('xbox', 'playstation', 'pc', 'mobile', 'nintendo', 'steam-deck', 'other').required(),
    category: Joi.string().valid('highlights', 'gameplay', 'tutorials', 'funny', 'competitive', 'speedrun', 'review', 'guide').required(),
    game_title: Joi.string().min(2).max(100).required(),
    file_url: Joi.string().uri().required(),
    thumbnail_url: Joi.string().uri().optional(),
    file_size: Joi.number().integer().positive().optional(),
    duration_seconds: Joi.number().integer().positive().optional(),
    dimensions: Joi.object({
      width: Joi.number().integer().positive(),
      height: Joi.number().integer().positive()
    }).optional(),
    is_nsfw: Joi.boolean().default(false),
    visibility: Joi.string().valid('public', 'clan', 'private').default('public'),
    tags: Joi.array().items(Joi.string().max(25)).max(15).optional(),
    encoding_details: Joi.object().optional(),
    upload_metadata: Joi.object().optional()
  }),

  moderation: Joi.object({
    content_id: Joi.string().uuid().required(),
    moderator_id: Joi.string().uuid().optional().allow(null),
    action: Joi.string().valid('approve', 'reject', 'flag', 'remove', 'restore').required(),
    reason: Joi.string().max(100).optional(),
    notes: Joi.string().max(2000).optional(),
    flags_added: Joi.array().items(Joi.string().max(50)).optional(),
    flags_removed: Joi.array().items(Joi.string().max(50)).optional(),
    is_automated: Joi.boolean().default(false),
    confidence_score: Joi.number().min(0).max(1).optional()
  }),

  update: Joi.object({
    title: Joi.string().min(3).max(200).optional(),
    description: Joi.string().min(10).max(1000).optional(),
    thumbnail_url: Joi.string().uri().optional(),
    is_nsfw: Joi.boolean().optional(),
    visibility: Joi.string().valid('public', 'clan', 'private').optional(),
    tags: Joi.array().items(Joi.string().max(25)).max(15).optional()
  })
};

/**
 * Content DAO class extending BaseDAO
 */
export class ContentDAO extends BaseDAO {
  constructor(options = {}) {
    super({
      tableName: 'content_submissions',
      primaryKey: 'id',
      createSchema: CONTENT_SCHEMAS.submission,
      updateSchema: CONTENT_SCHEMAS.update,
      cacheEnabled: true,
      cacheTTL: 300, // 5 minutes for content data
      cacheKeyPrefix: 'content',
      ...options
    });

    this.moderationSchema = CONTENT_SCHEMAS.moderation;
  }

  /**
   * Submit new content
   * @param {Object} contentData - Content submission data
   * @returns {Promise<Object>} Created content submission
   */
  async submitContent(contentData) {
    const startTime = Date.now();
    
    try {
      // Validate content data
      if (this.createSchema) {
        const { error, value } = this.createSchema.validate(contentData);
        if (error) {
          throw new Error(`Content validation error: ${error.message}`);
        }
        contentData = value;
      }

      // Set initial status
      const createData = {
        ...contentData,
        status: 'pending',
        tags: contentData.tags || [],
        dimensions: contentData.dimensions ? JSON.stringify(contentData.dimensions) : null,
        encoding_details: contentData.encoding_details ? JSON.stringify(contentData.encoding_details) : '{}',
        upload_metadata: contentData.upload_metadata ? JSON.stringify(contentData.upload_metadata) : '{}'
      };

      const content = await this.create(createData);

      // Update user content statistics
      await this.executeQuery(`
        UPDATE users 
        SET total_content_submitted = total_content_submitted + 1, updated_at = NOW()
        WHERE id = $1
      `, [contentData.user_id]);

      // Update clan statistics if clan content
      if (contentData.clan_id) {
        await this.executeQuery(`
          UPDATE clans 
          SET total_content_submitted = total_content_submitted + 1, updated_at = NOW()
          WHERE id = $1
        `, [contentData.clan_id]);
      }

      this.trackQueryPerformance(startTime, 'submitContent');
      this.emitEvent('content_submitted', content);
      
      return content;

    } catch (error) {
      this.handleError('submitContent', error, { contentData });
      throw error;
    }
  }

  /**
   * Moderate content submission
   * @param {Object} moderationData - Moderation data
   * @returns {Promise<Object>} Updated content and moderation log
   */
  async moderateContent(moderationData) {
    const startTime = Date.now();
    
    try {
      // Validate moderation data
      if (this.moderationSchema) {
        const { error, value } = this.moderationSchema.validate(moderationData);
        if (error) {
          throw new Error(`Moderation validation error: ${error.message}`);
        }
        moderationData = value;
      }

      return await this.executeTransaction(async (txDAO) => {
        // Get current content status
        const contentQuery = `
          SELECT id, status, user_id FROM content_submissions WHERE id = $1
        `;
        const contentResult = await txDAO.executeQuery(contentQuery, [moderationData.content_id]);
        
        if (contentResult.rows.length === 0) {
          throw new Error('Content not found');
        }

        const content = contentResult.rows[0];
        const previousStatus = content.status;

        // Determine new status based on action
        let newStatus = previousStatus;
        switch (moderationData.action) {
          case 'approve':
            newStatus = 'approved';
            break;
          case 'reject':
            newStatus = 'rejected';
            break;
          case 'flag':
            newStatus = 'flagged';
            break;
          case 'remove':
            newStatus = 'removed';
            break;
          case 'restore':
            newStatus = 'approved';
            break;
        }

        // Update content status and moderation fields
        const updateContentQuery = `
          UPDATE content_submissions
          SET 
            status = $2,
            moderated_by = $3,
            moderated_at = NOW(),
            moderation_notes = $4,
            moderation_flags = $5,
            updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `;

        const flags = moderationData.flags_added || [];
        
        const updateResult = await txDAO.executeQuery(updateContentQuery, [
          moderationData.content_id,
          newStatus,
          moderationData.moderator_id,
          moderationData.notes,
          flags
        ]);

        const updatedContent = updateResult.rows[0];

        // Create moderation log entry
        const logQuery = `
          INSERT INTO content_moderation_logs (
            content_id, moderator_id, action, previous_status, new_status,
            reason, notes, flags_added, flags_removed, is_automated, confidence_score
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *
        `;

        const logResult = await txDAO.executeQuery(logQuery, [
          moderationData.content_id,
          moderationData.moderator_id,
          moderationData.action,
          previousStatus,
          newStatus,
          moderationData.reason,
          moderationData.notes,
          moderationData.flags_added || [],
          moderationData.flags_removed || [],
          moderationData.is_automated,
          moderationData.confidence_score
        ]);

        const moderationLog = logResult.rows[0];

        // Update user statistics if approved
        if (newStatus === 'approved' && previousStatus !== 'approved') {
          await txDAO.executeQuery(`
            UPDATE users 
            SET total_content_approved = total_content_approved + 1, updated_at = NOW()
            WHERE id = $1
          `, [content.user_id]);
        } else if (previousStatus === 'approved' && newStatus !== 'approved') {
          await txDAO.executeQuery(`
            UPDATE users 
            SET total_content_approved = GREATEST(0, total_content_approved - 1), updated_at = NOW()
            WHERE id = $1
          `, [content.user_id]);
        }

        // Invalidate content cache
        if (this.cacheEnabled && this.redis) {
          await this.invalidateCache(moderationData.content_id);
        }

        this.trackQueryPerformance(startTime, 'moderateContent');
        this.emitEvent('content_moderated', {
          content: updatedContent,
          moderation_log: moderationLog,
          action: moderationData.action
        });
        
        return {
          content: updatedContent,
          moderation_log: moderationLog
        };
      });

    } catch (error) {
      this.handleError('moderateContent', error, { moderationData });
      throw error;
    }
  }

  /**
   * Get content submissions with filters and pagination
   * @param {Object} filters - Filter options
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Filtered content with pagination
   */
  async getContent(filters = {}, options = {}) {
    const startTime = Date.now();
    const { 
      limit = 50, 
      offset = 0, 
      sortBy = 'created_at',
      sortOrder = 'DESC',
      includePrivate = false
    } = options;
    
    try {
      let whereConditions = [];
      const params = [];
      let paramIndex = 1;

      // Status filter
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          const placeholders = filters.status.map(() => `$${paramIndex++}`);
          whereConditions.push(`cs.status IN (${placeholders.join(', ')})`);
          params.push(...filters.status);
        } else {
          whereConditions.push(`cs.status = $${paramIndex}`);
          params.push(filters.status);
          paramIndex++;
        }
      } else {
        // Default to approved content only
        whereConditions.push(`cs.status = 'approved'`);
      }

      // User filter
      if (filters.userId) {
        whereConditions.push(`cs.user_id = $${paramIndex}`);
        params.push(filters.userId);
        paramIndex++;
      }

      // Clan filter
      if (filters.clanId) {
        whereConditions.push(`cs.clan_id = $${paramIndex}`);
        params.push(filters.clanId);
        paramIndex++;
      }

      // Content type filter
      if (filters.contentType) {
        whereConditions.push(`cs.content_type = $${paramIndex}`);
        params.push(filters.contentType);
        paramIndex++;
      }

      // Gaming platform filter
      if (filters.gamingPlatform) {
        whereConditions.push(`cs.gaming_platform = $${paramIndex}`);
        params.push(filters.gamingPlatform);
        paramIndex++;
      }

      // Category filter
      if (filters.category) {
        whereConditions.push(`cs.category = $${paramIndex}`);
        params.push(filters.category);
        paramIndex++;
      }

      // Game title filter
      if (filters.gameTitle) {
        whereConditions.push(`cs.game_title ILIKE $${paramIndex}`);
        params.push(`%${filters.gameTitle}%`);
        paramIndex++;
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        whereConditions.push(`cs.tags && $${paramIndex}`);
        params.push(filters.tags);
        paramIndex++;
      }

      // Visibility filter
      if (!includePrivate) {
        whereConditions.push(`cs.visibility = 'public'`);
      } else if (filters.visibility) {
        whereConditions.push(`cs.visibility = $${paramIndex}`);
        params.push(filters.visibility);
        paramIndex++;
      }

      // NSFW filter
      if (filters.nsfw === false) {
        whereConditions.push(`cs.is_nsfw = false`);
      }

      // Date range filter
      if (filters.dateFrom) {
        whereConditions.push(`cs.created_at >= $${paramIndex}`);
        params.push(filters.dateFrom);
        paramIndex++;
      }

      if (filters.dateTo) {
        whereConditions.push(`cs.created_at <= $${paramIndex}`);
        params.push(filters.dateTo);
        paramIndex++;
      }

      // Search query filter
      if (filters.search) {
        whereConditions.push(`(cs.search_vector @@ plainto_tsquery('english', $${paramIndex}) OR cs.title ILIKE $${paramIndex + 1})`);
        params.push(filters.search, `%${filters.search}%`);
        paramIndex += 2;
      }

      // Minimum engagement filter
      if (filters.minUpvotes) {
        whereConditions.push(`cs.upvote_count >= $${paramIndex}`);
        params.push(filters.minUpvotes);
        paramIndex++;
      }

      // Build ORDER BY clause
      let orderByClause;
      switch (sortBy) {
        case 'votes':
          orderByClause = `(cs.upvote_count - cs.downvote_count) ${sortOrder}`;
          break;
        case 'views':
          orderByClause = `cs.view_count ${sortOrder}`;
          break;
        case 'engagement':
          orderByClause = `(cs.upvote_count + cs.downvote_count + cs.comment_count) ${sortOrder}`;
          break;
        case 'trending':
          // Trending algorithm: recent engagement weighted by recency
          orderByClause = `(
            (cs.upvote_count - cs.downvote_count) * 
            EXP(-EXTRACT(EPOCH FROM (NOW() - cs.created_at)) / 86400.0)
          ) DESC`;
          break;
        default:
          orderByClause = `cs.${sortBy} ${sortOrder}`;
      }

      const query = `
        SELECT 
          cs.*,
          u.username as creator_username,
          up.display_name as creator_display_name,
          up.avatar_url as creator_avatar,
          c.name as clan_name,
          c.slug as clan_slug,
          c.tier as clan_tier,
          (cs.upvote_count - cs.downvote_count) as vote_score,
          EXTRACT(EPOCH FROM (NOW() - cs.created_at)) / 3600 as hours_since_created
        FROM content_submissions cs
        JOIN users u ON cs.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN clans c ON cs.clan_id = c.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY ${orderByClause}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      const result = await this.executeQuery(query, params);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM content_submissions cs
        WHERE ${whereConditions.join(' AND ')}
      `;

      const countResult = await this.executeQuery(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      this.trackQueryPerformance(startTime, 'getContent');

      return {
        content: result.rows,
        pagination: {
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit),
          currentPage: Math.floor(offset / limit) + 1
        },
        filters: filters
      };

    } catch (error) {
      this.handleError('getContent', error, { filters, options });
      throw error;
    }
  }

  /**
   * Get trending content based on engagement and recency
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Trending content
   */
  async getTrendingContent(options = {}) {
    const startTime = Date.now();
    const { 
      limit = 20, 
      timeWindow = 24,  // hours
      category = null,
      gamingPlatform = null
    } = options;
    
    try {
      let whereConditions = [
        `cs.status = 'approved'`,
        `cs.visibility = 'public'`,
        `cs.created_at > NOW() - INTERVAL '${timeWindow * 3} hours'` // Look at content from 3x time window
      ];

      const params = [];
      let paramIndex = 1;

      if (category) {
        whereConditions.push(`cs.category = $${paramIndex}`);
        params.push(category);
        paramIndex++;
      }

      if (gamingPlatform) {
        whereConditions.push(`cs.gaming_platform = $${paramIndex}`);
        params.push(gamingPlatform);
        paramIndex++;
      }

      const query = `
        SELECT 
          cs.*,
          u.username as creator_username,
          up.display_name as creator_display_name,
          up.avatar_url as creator_avatar,
          c.name as clan_name,
          c.slug as clan_slug,
          (cs.upvote_count - cs.downvote_count) as vote_score,
          (cs.upvote_count + cs.comment_count + cs.share_count) as engagement_score,
          -- Trending score: engagement weighted by recency
          (
            (cs.upvote_count - cs.downvote_count + cs.comment_count * 0.5 + cs.share_count * 2) * 
            EXP(-EXTRACT(EPOCH FROM (NOW() - cs.created_at)) / ${timeWindow * 3600})
          ) as trending_score
        FROM content_submissions cs
        JOIN users u ON cs.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN clans c ON cs.clan_id = c.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY trending_score DESC
        LIMIT $${paramIndex}
      `;

      params.push(limit);

      const result = await this.executeQuery(query, params);

      this.trackQueryPerformance(startTime, 'getTrendingContent');
      return result.rows;

    } catch (error) {
      this.handleError('getTrendingContent', error, options);
      throw error;
    }
  }

  /**
   * Increment view count for content
   * @param {string} contentId - Content ID
   * @param {Object} viewData - View tracking data
   * @returns {Promise<Object>} Updated content
   */
  async incrementViewCount(contentId, viewData = {}) {
    const startTime = Date.now();
    
    try {
      const query = `
        UPDATE content_submissions
        SET 
          view_count = view_count + 1,
          updated_at = NOW()
        WHERE id = $1 AND status = 'approved'
        RETURNING view_count
      `;

      const result = await this.executeQuery(query, [contentId]);
      
      if (result.rows.length === 0) {
        throw new Error('Content not found or not approved');
      }

      const newViewCount = result.rows[0].view_count;

      // Invalidate cache
      if (this.cacheEnabled && this.redis) {
        await this.invalidateCache(contentId);
      }

      this.trackQueryPerformance(startTime, 'incrementViewCount');
      this.emitEvent('content_viewed', { content_id: contentId, new_view_count: newViewCount, ...viewData });
      
      return { view_count: newViewCount };

    } catch (error) {
      this.handleError('incrementViewCount', error, { contentId, viewData });
      throw error;
    }
  }

  /**
   * Get content analytics and statistics
   * @param {string} contentId - Content ID
   * @param {Object} options - Analytics options
   * @returns {Promise<Object>} Content analytics
   */
  async getContentAnalytics(contentId, options = {}) {
    const startTime = Date.now();
    const { includeTrends = false } = options;
    
    try {
      const query = `
        SELECT 
          cs.*,
          u.username as creator_username,
          up.display_name as creator_display_name,
          c.name as clan_name,
          
          -- Engagement metrics
          (cs.upvote_count - cs.downvote_count) as vote_score,
          (cs.upvote_count + cs.downvote_count) as total_votes,
          CASE 
            WHEN (cs.upvote_count + cs.downvote_count) > 0 
            THEN ROUND((cs.upvote_count::FLOAT / (cs.upvote_count + cs.downvote_count)) * 100, 2)
            ELSE 0 
          END as approval_rate,
          
          -- Time metrics
          EXTRACT(EPOCH FROM (NOW() - cs.created_at)) / 3600 as hours_since_created,
          EXTRACT(EPOCH FROM (NOW() - cs.created_at)) / 86400 as days_since_created,
          
          -- Ranking
          (SELECT COUNT(*) + 1 FROM content_submissions cs2 
           WHERE cs2.status = 'approved' 
           AND cs2.category = cs.category 
           AND (cs2.upvote_count - cs2.downvote_count) > (cs.upvote_count - cs.downvote_count)) as category_rank,
           
          -- Recent activity (last 24 hours)
          (SELECT COUNT(*) FROM content_votes cv 
           WHERE cv.content_id = cs.id AND cv.created_at > NOW() - INTERVAL '24 hours') as recent_votes_24h
           
        FROM content_submissions cs
        JOIN users u ON cs.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN clans c ON cs.clan_id = c.id
        WHERE cs.id = $1
      `;

      const result = await this.executeQuery(query, [contentId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      let analytics = result.rows[0];

      // Get vote distribution over time if trends requested
      if (includeTrends) {
        const trendsQuery = `
          SELECT 
            DATE_TRUNC('hour', cv.created_at) as hour,
            COUNT(*) FILTER (WHERE cv.vote_type = 'upvote') as upvotes,
            COUNT(*) FILTER (WHERE cv.vote_type = 'downvote') as downvotes,
            COUNT(*) as total_votes
          FROM content_votes cv
          WHERE cv.content_id = $1
            AND cv.created_at > NOW() - INTERVAL '7 days'
          GROUP BY DATE_TRUNC('hour', cv.created_at)
          ORDER BY hour DESC
          LIMIT 168
        `;

        const trendsResult = await this.executeQuery(trendsQuery, [contentId]);
        analytics.vote_trends = trendsResult.rows;
      }

      this.trackQueryPerformance(startTime, 'getContentAnalytics');
      return analytics;

    } catch (error) {
      this.handleError('getContentAnalytics', error, { contentId, options });
      throw error;
    }
  }

  /**
   * Get moderation queue with filters
   * @param {Object} filters - Moderation filters
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Content pending moderation
   */
  async getModerationQueue(filters = {}, options = {}) {
    const startTime = Date.now();
    const { limit = 50, offset = 0, sortBy = 'created_at' } = options;
    
    try {
      let whereConditions = [];
      const params = [];
      let paramIndex = 1;

      // Status filter - default to pending
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          const placeholders = filters.status.map(() => `$${paramIndex++}`);
          whereConditions.push(`cs.status IN (${placeholders.join(', ')})`);
          params.push(...filters.status);
        } else {
          whereConditions.push(`cs.status = $${paramIndex}`);
          params.push(filters.status);
          paramIndex++;
        }
      } else {
        whereConditions.push(`cs.status IN ('pending', 'flagged')`);
      }

      // Content type filter
      if (filters.contentType) {
        whereConditions.push(`cs.content_type = $${paramIndex}`);
        params.push(filters.contentType);
        paramIndex++;
      }

      // Flag filter
      if (filters.flags && filters.flags.length > 0) {
        whereConditions.push(`cs.moderation_flags && $${paramIndex}`);
        params.push(filters.flags);
        paramIndex++;
      }

      // Age filter
      if (filters.olderThan) {
        whereConditions.push(`cs.created_at < NOW() - INTERVAL '${filters.olderThan} hours'`);
      }

      const query = `
        SELECT 
          cs.*,
          u.username as creator_username,
          up.display_name as creator_display_name,
          up.avatar_url as creator_avatar,
          c.name as clan_name,
          
          -- Moderation history count
          (SELECT COUNT(*) FROM content_moderation_logs cml 
           WHERE cml.content_id = cs.id) as moderation_history_count,
           
          -- Time since submission
          EXTRACT(EPOCH FROM (NOW() - cs.created_at)) / 3600 as hours_pending
          
        FROM content_submissions cs
        JOIN users u ON cs.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN clans c ON cs.clan_id = c.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY 
          CASE 
            WHEN '${sortBy}' = 'priority' THEN 
              CASE cs.status
                WHEN 'flagged' THEN 1
                WHEN 'pending' THEN 2
                ELSE 3
              END
            ELSE 1
          END,
          cs.${sortBy === 'priority' ? 'created_at' : sortBy} ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      const result = await this.executeQuery(query, params);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM content_submissions cs
        WHERE ${whereConditions.join(' AND ')}
      `;

      const countResult = await this.executeQuery(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      this.trackQueryPerformance(startTime, 'getModerationQueue');

      return {
        content: result.rows,
        pagination: {
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit),
          currentPage: Math.floor(offset / limit) + 1
        }
      };

    } catch (error) {
      this.handleError('getModerationQueue', error, { filters, options });
      throw error;
    }
  }

  /**
   * Get content recommendations for user
   * @param {string} userId - User ID
   * @param {Object} options - Recommendation options
   * @returns {Promise<Array>} Recommended content
   */
  async getRecommendations(userId, options = {}) {
    const startTime = Date.now();
    const { limit = 10, excludeViewed = true } = options;
    
    try {
      let excludeClause = '';
      if (excludeViewed) {
        // This would need a views tracking table in a real implementation
        excludeClause = `AND cs.id NOT IN (
          SELECT content_id FROM content_views WHERE user_id = $2
        )`;
      }

      const query = `
        WITH user_preferences AS (
          -- Get user's voting patterns
          SELECT 
            cs.category,
            cs.gaming_platform,
            cs.game_title,
            COUNT(*) as interaction_count,
            AVG(CASE WHEN cv.vote_type = 'upvote' THEN 1.0 ELSE -1.0 END) as avg_rating
          FROM content_votes cv
          JOIN content_submissions cs ON cv.content_id = cs.id
          WHERE cv.user_id = $1
          GROUP BY cs.category, cs.gaming_platform, cs.game_title
          HAVING COUNT(*) >= 2
        ),
        clan_preferences AS (
          -- Get content from user's clans
          SELECT DISTINCT c.id as clan_id
          FROM clan_members cm
          JOIN clans c ON cm.clan_id = c.id
          WHERE cm.user_id = $1 AND cm.is_active = true
        )
        SELECT DISTINCT
          cs.*,
          u.username as creator_username,
          up.display_name as creator_display_name,
          c.name as clan_name,
          (cs.upvote_count - cs.downvote_count) as vote_score,
          
          -- Recommendation score
          (
            COALESCE(up_prefs.avg_rating * 10, 0) +
            CASE WHEN cp.clan_id IS NOT NULL THEN 5 ELSE 0 END +
            LOG(cs.upvote_count + 1) * 2 +
            EXP(-EXTRACT(EPOCH FROM (NOW() - cs.created_at)) / 86400.0) * 3
          ) as recommendation_score
          
        FROM content_submissions cs
        JOIN users u ON cs.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN clans c ON cs.clan_id = c.id
        LEFT JOIN user_preferences up_prefs ON (
          cs.category = up_prefs.category OR
          cs.gaming_platform = up_prefs.gaming_platform OR
          cs.game_title = up_prefs.game_title
        )
        LEFT JOIN clan_preferences cp ON cs.clan_id = cp.clan_id
        WHERE cs.status = 'approved'
          AND cs.visibility = 'public'
          AND cs.user_id != $1
          AND cs.created_at > NOW() - INTERVAL '30 days'
          ${excludeClause}
        ORDER BY recommendation_score DESC
        LIMIT $${excludeViewed ? 3 : 2}
      `;

      const params = excludeViewed ? [userId, userId, limit] : [userId, limit];
      const result = await this.executeQuery(query, params);

      this.trackQueryPerformance(startTime, 'getRecommendations');
      return result.rows;

    } catch (error) {
      this.handleError('getRecommendations', error, { userId, options });
      throw error;
    }
  }

  /**
   * Override findById to include creator and engagement data
   */
  async findById(id, options = {}) {
    const startTime = Date.now();
    const cacheKey = `${this.cacheKeyPrefix}:${id}`;
    
    try {
      // Check cache first
      if (this.cacheEnabled && this.redis) {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          this.cacheHits++;
          return JSON.parse(cached);
        }
        this.cacheMisses++;
      }

      const query = `
        SELECT 
          cs.*,
          u.username as creator_username,
          up.display_name as creator_display_name,
          up.avatar_url as creator_avatar,
          c.name as clan_name,
          c.slug as clan_slug,
          (cs.upvote_count - cs.downvote_count) as vote_score
        FROM content_submissions cs
        JOIN users u ON cs.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN clans c ON cs.clan_id = c.id
        WHERE cs.id = $1
          ${options.includeInactive ? '' : "AND cs.status IN ('approved', 'pending')"}
      `;

      const result = await this.executeQuery(query, [id]);
      const content = result.rows[0] || null;

      // Cache the result
      if (content && this.cacheEnabled && this.redis) {
        await this.redis.setEx(cacheKey, this.cacheTTL, JSON.stringify(content));
      }

      this.trackQueryPerformance(startTime, 'findById');
      return content;

    } catch (error) {
      this.handleError('findById', error, { id, options });
      throw error;
    }
  }
}

export default ContentDAO;