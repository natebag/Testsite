/**
 * Validation Middleware for MLG.clan API
 * 
 * Request validation using Joi schemas for input sanitization,
 * type checking, and business rule validation.
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

import Joi from 'joi';

/**
 * Validation configuration
 */
const VALIDATION_CONFIG = {
  // Global Joi options
  JOI_OPTIONS: {
    abortEarly: false, // Collect all validation errors
    allowUnknown: false, // Strict validation
    stripUnknown: true, // Remove unknown fields
    convert: true, // Type coercion
  },
  
  // Custom validation messages
  MESSAGES: {
    'string.empty': '{#label} cannot be empty',
    'string.min': '{#label} must be at least {#limit} characters long',
    'string.max': '{#label} must not exceed {#limit} characters',
    'string.email': '{#label} must be a valid email address',
    'string.uri': '{#label} must be a valid URL',
    'number.min': '{#label} must be at least {#limit}',
    'number.max': '{#label} must not exceed {#limit}',
    'number.integer': '{#label} must be an integer',
    'array.min': '{#label} must contain at least {#limit} items',
    'array.max': '{#label} must not contain more than {#limit} items',
    'any.required': '{#label} is required',
    'any.only': '{#label} must be one of: {#valids}'
  }
};

/**
 * Custom Joi validators
 */
const customValidators = {
  // Solana wallet address validation
  solanaAddress: Joi.string().custom((value, helpers) => {
    try {
      // Basic validation for Solana address format
      if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)) {
        return helpers.error('string.solanaAddress');
      }
      return value;
    } catch (error) {
      return helpers.error('string.solanaAddress');
    }
  }, 'Solana Address Validation').messages({
    'string.solanaAddress': 'Must be a valid Solana wallet address'
  }),
  
  // MLG token amount validation
  mlgAmount: Joi.number().positive().precision(2).custom((value, helpers) => {
    // Ensure amount doesn't exceed maximum supply considerations
    if (value > 1000000) {
      return helpers.error('number.maxMLG');
    }
    return value;
  }, 'MLG Amount Validation').messages({
    'number.maxMLG': 'MLG amount exceeds maximum allowed value'
  }),
  
  // Clan slug validation
  clanSlug: Joi.string()
    .min(3)
    .max(50)
    .pattern(/^[a-z0-9-]+$/)
    .messages({
      'string.pattern.base': 'Clan slug can only contain lowercase letters, numbers, and hyphens'
    }),
  
  // Username validation
  username: Joi.string()
    .min(3)
    .max(30)
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .messages({
      'string.pattern.base': 'Username can only contain letters, numbers, underscores, and hyphens'
    }),
  
  // Content type validation
  contentType: Joi.string().valid(
    'video', 'image', 'stream', 'highlight', 'tutorial', 'review', 'clip'
  ),
  
  // Vote type validation
  voteType: Joi.string().valid('up', 'down'),
  
  // Clan role validation
  clanRole: Joi.string().valid('member', 'moderator', 'admin', 'owner'),
  
  // UUID validation
  uuid: Joi.string().uuid({ version: 'uuidv4' }),
  
  // Pagination parameters
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0),
    cursor: Joi.string()
  }),
  
  // Sort parameters
  sort: Joi.object({
    field: Joi.string(),
    order: Joi.string().valid('asc', 'desc').default('desc')
  })
};

/**
 * Common validation schemas
 */
export const schemas = {
  // Authentication schemas
  auth: {
    challenge: Joi.object({
      walletAddress: customValidators.solanaAddress.required(),
      walletType: Joi.string().valid('phantom', 'solflare', 'metamask').default('phantom')
    }),
    
    verify: Joi.object({
      walletAddress: customValidators.solanaAddress.required(),
      signature: Joi.string().required(),
      nonce: Joi.string().required()
    }),
    
    refresh: Joi.object({
      refreshToken: Joi.string().required()
    })
  },
  
  // User schemas
  user: {
    profile: Joi.object({
      username: customValidators.username,
      displayName: Joi.string().min(1).max(50),
      bio: Joi.string().max(500),
      avatarUrl: Joi.string().uri(),
      socialLinks: Joi.object({
        twitter: Joi.string().uri(),
        discord: Joi.string(),
        twitch: Joi.string(),
        youtube: Joi.string().uri()
      }),
      preferences: Joi.object({
        notifications: Joi.boolean(),
        privacy: Joi.string().valid('public', 'friends', 'private').default('public')
      })
    }),
    
    search: Joi.object({
      query: Joi.string().min(1).max(100),
      username: customValidators.username,
      walletAddress: customValidators.solanaAddress,
      ...customValidators.pagination,
      ...customValidators.sort
    }),
    
    activity: Joi.object({
      activityType: Joi.string().valid(
        'vote_cast', 'content_submitted', 'content_approved', 'achievement_earned'
      ).required(),
      activityData: Joi.object()
    })
  },
  
  // Clan schemas
  clan: {
    create: Joi.object({
      name: Joi.string().min(3).max(50).required(),
      slug: customValidators.clanSlug.required(),
      description: Joi.string().max(1000),
      avatarUrl: Joi.string().uri(),
      bannerUrl: Joi.string().uri(),
      requiredStake: customValidators.mlgAmount.default(0),
      maxMembers: Joi.number().integer().min(1).max(1000).default(100),
      isPublic: Joi.boolean().default(true),
      settings: Joi.object({
        allowInvites: Joi.boolean().default(true),
        requireApproval: Joi.boolean().default(false),
        autoAcceptLevel: Joi.number().integer().min(0).max(10).default(0)
      }),
      stakingData: Joi.object({
        amount: customValidators.mlgAmount.required(),
        transactionId: customValidators.uuid
      })
    }),
    
    update: Joi.object({
      name: Joi.string().min(3).max(50),
      description: Joi.string().max(1000),
      avatarUrl: Joi.string().uri(),
      bannerUrl: Joi.string().uri(),
      maxMembers: Joi.number().integer().min(1).max(1000),
      isPublic: Joi.boolean(),
      settings: Joi.object({
        allowInvites: Joi.boolean(),
        requireApproval: Joi.boolean(),
        autoAcceptLevel: Joi.number().integer().min(0).max(10)
      })
    }),
    
    join: Joi.object({
      stakingData: Joi.object({
        amount: customValidators.mlgAmount,
        transactionId: customValidators.uuid,
        invitationId: customValidators.uuid
      })
    }),
    
    invite: Joi.object({
      userId: customValidators.uuid,
      email: Joi.string().email(),
      message: Joi.string().max(500)
    }).or('userId', 'email'),
    
    kick: Joi.object({
      reason: Joi.string().max(500)
    }),
    
    roleUpdate: Joi.object({
      role: customValidators.clanRole.required()
    }),
    
    search: Joi.object({
      query: Joi.string().min(1).max(100),
      name: Joi.string().min(1).max(50),
      isPublic: Joi.boolean(),
      minMembers: Joi.number().integer().min(0),
      maxMembers: Joi.number().integer().min(1),
      requiredStake: customValidators.mlgAmount,
      ...customValidators.pagination,
      ...customValidators.sort
    })
  },
  
  // Voting schemas
  voting: {
    purchaseVotes: Joi.object({
      amount: customValidators.mlgAmount.required(),
      transactionId: customValidators.uuid.required()
    }),
    
    castVote: Joi.object({
      contentId: customValidators.uuid.required(),
      voteType: customValidators.voteType.required(),
      votePower: Joi.number().integer().min(1).max(10).default(1)
    }),
    
    proposal: Joi.object({
      title: Joi.string().min(5).max(200).required(),
      description: Joi.string().min(10).max(2000).required(),
      proposalType: Joi.string().valid(
        'governance', 'feature', 'rule_change', 'budget', 'other'
      ).required(),
      votingPeriod: Joi.number().integer().min(1).max(30).default(7), // days
      options: Joi.array().items(
        Joi.object({
          title: Joi.string().min(1).max(100).required(),
          description: Joi.string().max(500)
        })
      ).min(2).max(10),
      metadata: Joi.object()
    }),
    
    voteProposal: Joi.object({
      optionId: customValidators.uuid.required(),
      votePower: Joi.number().integer().min(1).max(10).default(1)
    })
  },
  
  // Content schemas
  content: {
    submit: Joi.object({
      title: Joi.string().min(5).max(200).required(),
      description: Joi.string().max(2000),
      contentType: customValidators.contentType.required(),
      contentUrl: Joi.string().uri().required(),
      thumbnailUrl: Joi.string().uri(),
      duration: Joi.number().integer().min(1), // seconds
      tags: Joi.array().items(Joi.string().min(1).max(30)).max(10),
      isNSFW: Joi.boolean().default(false),
      clanId: customValidators.uuid,
      metadata: Joi.object({
        game: Joi.string().max(50),
        platform: Joi.string().max(50),
        resolution: Joi.string(),
        framerate: Joi.number().integer()
      })
    }),
    
    update: Joi.object({
      title: Joi.string().min(5).max(200),
      description: Joi.string().max(2000),
      thumbnailUrl: Joi.string().uri(),
      tags: Joi.array().items(Joi.string().min(1).max(30)).max(10),
      isNSFW: Joi.boolean(),
      metadata: Joi.object()
    }),
    
    vote: Joi.object({
      voteType: customValidators.voteType.required(),
      votePower: Joi.number().integer().min(1).max(10).default(1)
    }),
    
    moderate: Joi.object({
      action: Joi.string().valid('approve', 'reject', 'flag', 'unflag').required(),
      reason: Joi.string().max(500),
      metadata: Joi.object()
    }),
    
    report: Joi.object({
      reason: Joi.string().valid(
        'spam', 'inappropriate', 'copyright', 'harassment', 'fake', 'other'
      ).required(),
      description: Joi.string().max(500),
      evidence: Joi.array().items(Joi.string().uri())
    }),
    
    search: Joi.object({
      query: Joi.string().min(1).max(100),
      contentType: customValidators.contentType,
      tags: Joi.array().items(Joi.string()),
      game: Joi.string().max(50),
      clanId: customValidators.uuid,
      userId: customValidators.uuid,
      status: Joi.string().valid('pending', 'approved', 'rejected', 'flagged'),
      isNSFW: Joi.boolean(),
      duration: Joi.object({
        min: Joi.number().integer().min(1),
        max: Joi.number().integer().min(1)
      }),
      dateRange: Joi.object({
        start: Joi.date(),
        end: Joi.date()
      }),
      ...customValidators.pagination,
      ...customValidators.sort
    })
  },
  
  // Transaction schemas
  transaction: {
    confirm: Joi.object({
      signature: Joi.string().required(),
      transactionType: Joi.string().valid(
        'stake', 'unstake', 'vote_purchase', 'reward_claim', 'transfer'
      ).required(),
      amount: customValidators.mlgAmount,
      metadata: Joi.object()
    }),
    
    search: Joi.object({
      transactionType: Joi.string(),
      status: Joi.string().valid('pending', 'confirmed', 'failed', 'cancelled'),
      walletAddress: customValidators.solanaAddress,
      amount: Joi.object({
        min: customValidators.mlgAmount,
        max: customValidators.mlgAmount
      }),
      dateRange: Joi.object({
        start: Joi.date(),
        end: Joi.date()
      }),
      ...customValidators.pagination,
      ...customValidators.sort
    })
  }
};

/**
 * Create validation middleware for specific schema
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = source === 'query' ? req.query : 
                          source === 'params' ? req.params : 
                          req.body;
    
    const { error, value } = schema.validate(dataToValidate, {
      ...VALIDATION_CONFIG.JOI_OPTIONS,
      messages: VALIDATION_CONFIG.MESSAGES
    });
    
    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        message: 'The request data is invalid',
        details: validationErrors
      });
    }
    
    // Replace original data with validated/sanitized version
    if (source === 'query') {
      req.query = value;
    } else if (source === 'params') {
      req.params = value;
    } else {
      req.body = value;
    }
    
    next();
  };
};

/**
 * Combine multiple validations (body, query, params)
 */
export const validateMultiple = (validations) => {
  return (req, res, next) => {
    const errors = [];
    
    for (const [source, schema] of Object.entries(validations)) {
      const dataToValidate = source === 'query' ? req.query : 
                            source === 'params' ? req.params : 
                            req.body;
      
      const { error, value } = schema.validate(dataToValidate, {
        ...VALIDATION_CONFIG.JOI_OPTIONS,
        messages: VALIDATION_CONFIG.MESSAGES
      });
      
      if (error) {
        errors.push(...error.details.map(detail => ({
          source,
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        })));
      } else {
        // Update request with validated data
        if (source === 'query') {
          req.query = value;
        } else if (source === 'params') {
          req.params = value;
        } else {
          req.body = value;
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        message: 'The request data is invalid',
        details: errors
      });
    }
    
    next();
  };
};

/**
 * Sanitize HTML and dangerous content
 */
export const sanitizeMiddleware = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    // Basic HTML sanitization (for production, use a proper library like DOMPurify)
    return str
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  };
  
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item));
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };
  
  // Sanitize request data
  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  
  next();
};

// Export main validation middleware
export const validationMiddleware = {
  validate,
  validateMultiple,
  sanitizeMiddleware,
  schemas
};

export default validationMiddleware;