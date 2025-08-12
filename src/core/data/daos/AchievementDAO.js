/**
 * Achievement Data Access Object (DAO) for MLG.clan Platform
 * 
 * Handles all database operations related to achievements, progress tracking,
 * and reward distribution with comprehensive validation and caching.
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

import Joi from 'joi';
import { BaseDAO } from './BaseDAO.js';

const ACHIEVEMENT_SCHEMAS = {
  create: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    slug: Joi.string().min(3).max(100).pattern(/^[a-z0-9-]+$/).required(),
    description: Joi.string().min(10).max(500).required(),
    achievement_type: Joi.string().valid('voting', 'content', 'clan', 'social', 'milestone').required(),
    requirements: Joi.object().required(),
    reward_mlg_tokens: Joi.number().min(0).default(0),
    reward_reputation: Joi.number().integer().min(0).default(0),
    rarity: Joi.string().valid('common', 'uncommon', 'rare', 'epic', 'legendary').default('common'),
    is_repeatable: Joi.boolean().default(false),
    max_completions: Joi.number().integer().min(-1).default(1),
    category: Joi.string().max(50).optional(),
    tags: Joi.array().items(Joi.string().max(25)).max(10).optional()
  })
};

export class AchievementDAO extends BaseDAO {
  constructor(options = {}) {
    super({
      tableName: 'achievements',
      primaryKey: 'id',
      createSchema: ACHIEVEMENT_SCHEMAS.create,
      cacheEnabled: true,
      cacheTTL: 1800, // 30 minutes for achievement data
      cacheKeyPrefix: 'achievement',
      ...options
    });
  }

  async getActiveAchievements(options = {}) {
    const startTime = Date.now();
    const { type = null, category = null, limit = 100 } = options;

    try {
      let whereConditions = ['a.is_active = true'];
      const params = [];
      let paramIndex = 1;

      if (type) {
        whereConditions.push(`a.achievement_type = $${paramIndex}`);
        params.push(type);
        paramIndex++;
      }

      if (category) {
        whereConditions.push(`a.category = $${paramIndex}`);
        params.push(category);
        paramIndex++;
      }

      const query = `
        SELECT * FROM achievements a
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY a.display_order, a.name
        LIMIT $${paramIndex}
      `;

      params.push(limit);
      const result = await this.executeQuery(query, params);

      this.trackQueryPerformance(startTime, 'getActiveAchievements');
      return result.rows;

    } catch (error) {
      this.handleError('getActiveAchievements', error, options);
      throw error;
    }
  }

  async getUserProgress(userId, options = {}) {
    const startTime = Date.now();
    const { includeCompleted = true, achievementId = null } = options;

    try {
      let whereConditions = ['ap.user_id = $1'];
      const params = [userId];
      let paramIndex = 2;

      if (!includeCompleted) {
        whereConditions.push('ap.is_completed = false');
      }

      if (achievementId) {
        whereConditions.push(`ap.achievement_id = $${paramIndex}`);
        params.push(achievementId);
        paramIndex++;
      }

      const query = `
        SELECT 
          ap.*,
          a.name as achievement_name,
          a.description,
          a.requirements,
          a.reward_mlg_tokens,
          a.reward_reputation,
          a.rarity,
          a.is_repeatable,
          a.max_completions
        FROM achievement_progress ap
        JOIN achievements a ON ap.achievement_id = a.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY ap.is_completed ASC, ap.updated_at DESC
      `;

      const result = await this.executeQuery(query, params);

      this.trackQueryPerformance(startTime, 'getUserProgress');
      return result.rows;

    } catch (error) {
      this.handleError('getUserProgress', error, { userId, options });
      throw error;
    }
  }

  async updateProgress(userId, achievementId, progressData) {
    const startTime = Date.now();

    try {
      return await this.executeTransaction(async (txDAO) => {
        // Get achievement details
        const achievementQuery = `
          SELECT * FROM achievements WHERE id = $1 AND is_active = true
        `;
        const achievement = await txDAO.executeQuery(achievementQuery, [achievementId]);
        
        if (achievement.rows.length === 0) {
          throw new Error('Achievement not found or inactive');
        }

        const ach = achievement.rows[0];

        // Get or create progress record
        const progressQuery = `
          SELECT * FROM achievement_progress 
          WHERE user_id = $1 AND achievement_id = $2
        `;
        const progressResult = await txDAO.executeQuery(progressQuery, [userId, achievementId]);

        let progress;
        if (progressResult.rows.length === 0) {
          // Create new progress
          const createQuery = `
            INSERT INTO achievement_progress (user_id, achievement_id, current_progress)
            VALUES ($1, $2, $3)
            RETURNING *
          `;
          const createResult = await txDAO.executeQuery(createQuery, [
            userId, achievementId, JSON.stringify(progressData)
          ]);
          progress = createResult.rows[0];
        } else {
          progress = progressResult.rows[0];
          
          // Update existing progress
          const mergedProgress = { ...progress.current_progress, ...progressData };
          const updateQuery = `
            UPDATE achievement_progress
            SET current_progress = $3, updated_at = NOW()
            WHERE user_id = $1 AND achievement_id = $2
            RETURNING *
          `;
          const updateResult = await txDAO.executeQuery(updateQuery, [
            userId, achievementId, JSON.stringify(mergedProgress)
          ]);
          progress = updateResult.rows[0];
        }

        // Check if achievement is completed
        const completed = this.checkAchievementCompletion(ach.requirements, progress.current_progress);
        
        if (completed && !progress.is_completed) {
          // Mark as completed
          const completeQuery = `
            UPDATE achievement_progress
            SET 
              is_completed = true,
              completion_count = completion_count + 1,
              first_completed_at = COALESCE(first_completed_at, NOW()),
              last_completed_at = NOW(),
              updated_at = NOW()
            WHERE user_id = $1 AND achievement_id = $2
            RETURNING *
          `;
          const completeResult = await txDAO.executeQuery(completeQuery, [userId, achievementId]);
          progress = completeResult.rows[0];

          // Award rewards (would integrate with reward system)
          this.emitEvent('achievement_completed', {
            user_id: userId,
            achievement: ach,
            progress: progress,
            rewards: {
              mlg_tokens: ach.reward_mlg_tokens,
              reputation: ach.reward_reputation
            }
          });
        }

        this.trackQueryPerformance(startTime, 'updateProgress');
        return progress;
      });

    } catch (error) {
      this.handleError('updateProgress', error, { userId, achievementId, progressData });
      throw error;
    }
  }

  checkAchievementCompletion(requirements, currentProgress) {
    // Simple completion checking - would be more sophisticated in production
    for (const [key, requiredValue] of Object.entries(requirements)) {
      const currentValue = currentProgress[key] || 0;
      if (currentValue < requiredValue) {
        return false;
      }
    }
    return true;
  }

  async getUserStats(userId) {
    const startTime = Date.now();

    try {
      const query = `
        SELECT 
          COUNT(*) as total_achievements,
          COUNT(*) FILTER (WHERE is_completed = true) as completed_achievements,
          COUNT(*) FILTER (WHERE is_completed = false) as in_progress_achievements,
          COALESCE(SUM(CASE WHEN is_completed = true THEN a.reward_mlg_tokens ELSE 0 END), 0) as total_mlg_earned,
          COALESCE(SUM(CASE WHEN is_completed = true THEN a.reward_reputation ELSE 0 END), 0) as total_reputation_earned,
          COUNT(*) FILTER (WHERE is_completed = true AND a.rarity = 'legendary') as legendary_count,
          COUNT(*) FILTER (WHERE is_completed = true AND a.rarity = 'epic') as epic_count,
          MAX(last_completed_at) as last_achievement_date
        FROM achievement_progress ap
        JOIN achievements a ON ap.achievement_id = a.id
        WHERE ap.user_id = $1
      `;

      const result = await this.executeQuery(query, [userId]);
      const stats = result.rows[0] || {};

      // Calculate completion rate
      stats.completion_rate = stats.total_achievements > 0 
        ? (stats.completed_achievements / stats.total_achievements) * 100 
        : 0;

      this.trackQueryPerformance(startTime, 'getUserStats');
      return stats;

    } catch (error) {
      this.handleError('getUserStats', error, { userId });
      throw error;
    }
  }
}

export default AchievementDAO;