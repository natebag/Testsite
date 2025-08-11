/**
 * Data Models and Validation Schemas for MLG.clan Platform
 * 
 * Centralized data models, validation schemas, and type definitions
 * for all platform entities with comprehensive validation rules.
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

import Joi from 'joi';

/**
 * Common validation patterns
 */
export const COMMON_PATTERNS = {
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  SOLANA_ADDRESS: /^[A-Za-z0-9]{32,44}$/,
  SOLANA_SIGNATURE: /^[A-Za-z0-9]{86,88}$/,
  USERNAME: /^[a-zA-Z0-9_-]+$/,
  SLUG: /^[a-z0-9-]+$/,
  HEX_COLOR: /^#[0-9A-Fa-f]{6}$/,
  EMAIL: /^[^@]+@[^@]+\.[^@]+$/
};

/**
 * Base schema definitions
 */
const baseTimestamps = {
  created_at: Joi.date().default(() => new Date()),
  updated_at: Joi.date().default(() => new Date())
};

const baseUUID = {
  id: Joi.string().uuid().default(() => require('uuid').v4())
};

/**
 * User-related schemas
 */
export const USER_SCHEMAS = {
  create: Joi.object({
    ...baseUUID,
    wallet_address: Joi.string().pattern(COMMON_PATTERNS.SOLANA_ADDRESS).required(),
    username: Joi.string().min(3).max(32).pattern(COMMON_PATTERNS.USERNAME).optional(),
    email: Joi.string().pattern(COMMON_PATTERNS.EMAIL).optional(),
    verification_signature: Joi.string().required(),
    verification_message: Joi.string().required(),
    status: Joi.string().valid('active', 'inactive', 'banned', 'suspended').default('active'),
    ...baseTimestamps
  }),

  update: Joi.object({
    username: Joi.string().min(3).max(32).pattern(COMMON_PATTERNS.USERNAME).optional(),
    email: Joi.string().pattern(COMMON_PATTERNS.EMAIL).optional(),
    email_notifications: Joi.boolean().optional(),
    profile_visibility: Joi.string().valid('public', 'friends', 'private').optional(),
    status: Joi.string().valid('active', 'inactive', 'banned', 'suspended').optional(),
    updated_at: Joi.date().default(() => new Date())
  }),

  profile: Joi.object({
    user_id: Joi.string().uuid().required(),
    display_name: Joi.string().min(1).max(50).optional(),
    bio: Joi.string().max(500).optional(),
    avatar_url: Joi.string().uri().optional(),
    banner_url: Joi.string().uri().optional(),
    location: Joi.string().max(100).optional(),
    website_url: Joi.string().uri().optional(),
    social_links: Joi.object().optional(),
    gaming_stats: Joi.object().optional(),
    ...baseTimestamps
  })
};

/**
 * Clan-related schemas
 */
export const CLAN_SCHEMAS = {
  create: Joi.object({
    ...baseUUID,
    name: Joi.string().min(3).max(32).pattern(COMMON_PATTERNS.USERNAME).required(),
    slug: Joi.string().min(3).max(32).pattern(COMMON_PATTERNS.SLUG).required(),
    description: Joi.string().max(1000).optional(),
    owner_id: Joi.string().uuid().required(),
    tier: Joi.string().valid('bronze', 'silver', 'gold', 'diamond').default('bronze'),
    staked_tokens: Joi.number().min(0).default(0),
    required_stake: Joi.number().min(0).default(100),
    member_count: Joi.number().integer().min(1).default(1),
    max_members: Joi.number().integer().min(1).max(1000).default(20),
    is_public: Joi.boolean().default(true),
    is_verified: Joi.boolean().default(false),
    status: Joi.string().valid('active', 'inactive', 'suspended').default('active'),
    voting_enabled: Joi.boolean().default(true),
    proposal_threshold: Joi.number().min(0).default(10),
    banner_url: Joi.string().uri().optional(),
    logo_url: Joi.string().uri().optional(),
    color_theme: Joi.string().pattern(COMMON_PATTERNS.HEX_COLOR).optional(),
    rules: Joi.array().items(Joi.string().max(500)).max(10).default([]),
    tags: Joi.array().items(Joi.string().max(25)).max(10).default([]),
    ...baseTimestamps
  }),

  member: Joi.object({
    ...baseUUID,
    clan_id: Joi.string().uuid().required(),
    user_id: Joi.string().uuid().required(),
    role: Joi.string().valid('owner', 'admin', 'moderator', 'member').default('member'),
    is_active: Joi.boolean().default(true),
    joined_at: Joi.date().default(() => new Date()),
    invited_by: Joi.string().uuid().optional(),
    content_contributed: Joi.number().integer().min(0).default(0),
    votes_cast_for_clan: Joi.number().integer().min(0).default(0),
    tokens_contributed: Joi.number().min(0).default(0),
    notes: Joi.string().max(500).optional(),
    ...baseTimestamps
  }),

  invitation: Joi.object({
    ...baseUUID,
    clan_id: Joi.string().uuid().required(),
    invited_user_id: Joi.string().uuid().required(),
    invited_by_user_id: Joi.string().uuid().required(),
    role: Joi.string().valid('admin', 'moderator', 'member').default('member'),
    message: Joi.string().max(500).optional(),
    status: Joi.string().valid('pending', 'accepted', 'declined', 'expired', 'cancelled').default('pending'),
    expires_at: Joi.date().default(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    responded_at: Joi.date().optional(),
    ...baseTimestamps
  })
};

/**
 * Content-related schemas
 */
export const CONTENT_SCHEMAS = {
  submission: Joi.object({
    ...baseUUID,
    user_id: Joi.string().uuid().required(),
    clan_id: Joi.string().uuid().optional(),
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
    status: Joi.string().valid('pending', 'approved', 'rejected', 'flagged', 'removed').default('pending'),
    is_featured: Joi.boolean().default(false),
    featured_until: Joi.date().optional(),
    is_nsfw: Joi.boolean().default(false),
    visibility: Joi.string().valid('public', 'clan', 'private').default('public'),
    tags: Joi.array().items(Joi.string().max(25)).max(15).default([]),
    view_count: Joi.number().integer().min(0).default(0),
    upvote_count: Joi.number().integer().min(0).default(0),
    downvote_count: Joi.number().integer().min(0).default(0),
    comment_count: Joi.number().integer().min(0).default(0),
    share_count: Joi.number().integer().min(0).default(0),
    encoding_details: Joi.object().default({}),
    upload_metadata: Joi.object().default({}),
    ...baseTimestamps
  }),

  vote: Joi.object({
    ...baseUUID,
    content_id: Joi.string().uuid().required(),
    user_id: Joi.string().uuid().required(),
    vote_type: Joi.string().valid('upvote', 'downvote').required(),
    voting_transaction_id: Joi.string().uuid().optional(),
    is_daily_vote: Joi.boolean().default(true),
    clan_bonus: Joi.boolean().default(false),
    vote_weight: Joi.number().min(0.1).max(5.0).default(1.0),
    ...baseTimestamps
  }),

  moderation: Joi.object({
    ...baseUUID,
    content_id: Joi.string().uuid().required(),
    moderator_id: Joi.string().uuid().optional(),
    action: Joi.string().valid('approve', 'reject', 'flag', 'remove', 'restore').required(),
    previous_status: Joi.string().valid('pending', 'approved', 'rejected', 'flagged', 'removed').optional(),
    new_status: Joi.string().valid('pending', 'approved', 'rejected', 'flagged', 'removed').required(),
    reason: Joi.string().max(100).optional(),
    notes: Joi.string().max(2000).optional(),
    flags_added: Joi.array().items(Joi.string().max(50)).default([]),
    flags_removed: Joi.array().items(Joi.string().max(50)).default([]),
    is_automated: Joi.boolean().default(false),
    confidence_score: Joi.number().min(0).max(1).optional(),
    can_be_appealed: Joi.boolean().default(true),
    appeal_deadline: Joi.date().optional(),
    created_at: Joi.date().default(() => new Date())
  })
};

/**
 * Voting-related schemas
 */
export const VOTING_SCHEMAS = {
  transaction: Joi.object({
    ...baseUUID,
    user_id: Joi.string().uuid().required(),
    blockchain_transaction_id: Joi.string().uuid().required(),
    votes_purchased: Joi.number().integer().min(1).max(4).required(),
    mlg_tokens_burned: Joi.number().positive().required(),
    cost_per_vote: Joi.number().positive().required(),
    votes_remaining: Joi.number().integer().min(0).required(),
    votes_used: Joi.number().integer().min(0).default(0),
    valid_until: Joi.date().required(),
    ...baseTimestamps
  }),

  proposal: Joi.object({
    ...baseUUID,
    clan_id: Joi.string().uuid().optional(),
    creator_id: Joi.string().uuid().required(),
    title: Joi.string().min(10).max(200).required(),
    description: Joi.string().min(20).max(2000).required(),
    proposal_type: Joi.string().max(50).required(),
    voting_starts_at: Joi.date().default(() => new Date()),
    voting_ends_at: Joi.date().required(),
    minimum_participation: Joi.number().integer().min(1).default(5),
    upvotes: Joi.number().integer().min(0).default(0),
    downvotes: Joi.number().integer().min(0).default(0),
    total_participants: Joi.number().integer().min(0).default(0),
    status: Joi.string().valid('draft', 'active', 'passed', 'failed', 'cancelled', 'expired').default('active'),
    outcome: Joi.string().optional(),
    metadata: Joi.object().default({}),
    tags: Joi.array().items(Joi.string().max(25)).max(5).default([]),
    ...baseTimestamps
  })
};

/**
 * Achievement-related schemas
 */
export const ACHIEVEMENT_SCHEMAS = {
  achievement: Joi.object({
    ...baseUUID,
    name: Joi.string().min(3).max(100).required(),
    slug: Joi.string().min(3).max(100).pattern(COMMON_PATTERNS.SLUG).required(),
    description: Joi.string().min(10).max(500).required(),
    achievement_type: Joi.string().valid('voting', 'content', 'clan', 'social', 'milestone').required(),
    requirements: Joi.object().required(),
    reward_mlg_tokens: Joi.number().min(0).default(0),
    reward_reputation: Joi.number().integer().min(0).default(0),
    icon_url: Joi.string().uri().optional(),
    badge_color: Joi.string().pattern(COMMON_PATTERNS.HEX_COLOR).optional(),
    rarity: Joi.string().valid('common', 'uncommon', 'rare', 'epic', 'legendary').default('common'),
    is_hidden: Joi.boolean().default(false),
    is_repeatable: Joi.boolean().default(false),
    max_completions: Joi.number().integer().min(-1).default(1),
    display_order: Joi.number().integer().default(0),
    category: Joi.string().max(50).optional(),
    tags: Joi.array().items(Joi.string().max(25)).max(10).default([]),
    is_active: Joi.boolean().default(true),
    ...baseTimestamps
  }),

  progress: Joi.object({
    ...baseUUID,
    user_id: Joi.string().uuid().required(),
    achievement_id: Joi.string().uuid().required(),
    current_progress: Joi.object().default({}),
    completion_count: Joi.number().integer().min(0).default(0),
    is_completed: Joi.boolean().default(false),
    first_completed_at: Joi.date().optional(),
    last_completed_at: Joi.date().optional(),
    rewards_claimed: Joi.boolean().default(false),
    claimed_at: Joi.date().optional(),
    ...baseTimestamps
  })
};

/**
 * Transaction-related schemas
 */
export const TRANSACTION_SCHEMAS = {
  blockchain: Joi.object({
    ...baseUUID,
    user_id: Joi.string().uuid().required(),
    transaction_signature: Joi.string().pattern(COMMON_PATTERNS.SOLANA_SIGNATURE).required(),
    transaction_type: Joi.string().max(50).required(),
    amount: Joi.number().min(0).optional(),
    token_mint: Joi.string().pattern(COMMON_PATTERNS.SOLANA_ADDRESS).optional(),
    from_address: Joi.string().pattern(COMMON_PATTERNS.SOLANA_ADDRESS).optional(),
    to_address: Joi.string().pattern(COMMON_PATTERNS.SOLANA_ADDRESS).optional(),
    status: Joi.string().valid('pending', 'confirmed', 'failed', 'cancelled').default('pending'),
    block_height: Joi.number().integer().positive().optional(),
    slot: Joi.number().integer().positive().optional(),
    confirmation_status: Joi.string().valid('processed', 'confirmed', 'finalized').optional(),
    network: Joi.string().valid('mainnet', 'testnet', 'devnet').default('mainnet'),
    fee_lamports: Joi.number().integer().min(0).optional(),
    metadata: Joi.object().default({}),
    error_message: Joi.string().optional(),
    ...baseTimestamps
  })
};

/**
 * Response wrapper schemas
 */
export const RESPONSE_SCHEMAS = {
  success: Joi.object({
    success: Joi.boolean().default(true),
    data: Joi.any().required(),
    meta: Joi.object().optional(),
    timestamp: Joi.date().default(() => new Date())
  }),

  error: Joi.object({
    success: Joi.boolean().default(false),
    error: Joi.object({
      code: Joi.string().required(),
      message: Joi.string().required(),
      details: Joi.any().optional()
    }).required(),
    timestamp: Joi.date().default(() => new Date())
  }),

  paginated: Joi.object({
    success: Joi.boolean().default(true),
    data: Joi.array().required(),
    pagination: Joi.object({
      total: Joi.number().integer().min(0).required(),
      limit: Joi.number().integer().positive().required(),
      offset: Joi.number().integer().min(0).required(),
      pages: Joi.number().integer().min(0).required(),
      currentPage: Joi.number().integer().positive().required(),
      hasNext: Joi.boolean().required(),
      hasPrev: Joi.boolean().required()
    }).required(),
    timestamp: Joi.date().default(() => new Date())
  })
};

/**
 * Validation utility functions
 */
export class ModelValidator {
  static validate(schema, data, options = {}) {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      allowUnknown: options.allowUnknown || false,
      stripUnknown: options.stripUnknown || true,
      ...options
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));

      throw new ValidationError('Data validation failed', details);
    }

    return value;
  }

  static validatePartial(schema, data, options = {}) {
    // Create a schema where all fields are optional for partial updates
    const partialSchema = schema.fork(
      Object.keys(schema.describe().keys),
      (field) => field.optional()
    );

    return this.validate(partialSchema, data, options);
  }
}

/**
 * Custom validation error
 */
export class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

/**
 * Model factory for creating validated instances
 */
export class ModelFactory {
  static createUser(data) {
    return ModelValidator.validate(USER_SCHEMAS.create, data);
  }

  static createClan(data) {
    return ModelValidator.validate(CLAN_SCHEMAS.create, data);
  }

  static createContent(data) {
    return ModelValidator.validate(CONTENT_SCHEMAS.submission, data);
  }

  static createVotingTransaction(data) {
    return ModelValidator.validate(VOTING_SCHEMAS.transaction, data);
  }

  static createProposal(data) {
    return ModelValidator.validate(VOTING_SCHEMAS.proposal, data);
  }

  static createAchievement(data) {
    return ModelValidator.validate(ACHIEVEMENT_SCHEMAS.achievement, data);
  }

  static createTransaction(data) {
    return ModelValidator.validate(TRANSACTION_SCHEMAS.blockchain, data);
  }
}

export default {
  USER_SCHEMAS,
  CLAN_SCHEMAS,
  CONTENT_SCHEMAS,
  VOTING_SCHEMAS,
  ACHIEVEMENT_SCHEMAS,
  TRANSACTION_SCHEMAS,
  RESPONSE_SCHEMAS,
  COMMON_PATTERNS,
  ModelValidator,
  ValidationError,
  ModelFactory
};