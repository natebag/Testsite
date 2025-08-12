/**
 * Advanced Input Validation and Security Middleware for MLG.clan Platform
 * 
 * Comprehensive input sanitization, validation, and injection prevention middleware
 * designed for gaming platforms with Web3 integration.
 * 
 * Features:
 * - SQL injection and NoSQL injection prevention
 * - XSS protection with context-aware sanitization
 * - Input validation with gaming-specific rules
 * - File upload security validation
 * - Wallet address validation
 * - Gaming content validation (usernames, clan names, etc.)
 * 
 * @author Claude Code - Security Auditor
 * @version 2.0.0
 * @created 2025-08-11
 */

import Joi from 'joi';
import DOMPurify from 'isomorphic-dompurify';
import { PublicKey } from '@solana/web3.js';
import { createHash } from 'crypto';
import validator from 'validator';

/**
 * Security Configuration
 */
const SECURITY_CONFIG = {
  // Input length limits
  LIMITS: {
    USERNAME: { min: 3, max: 30 },
    CLAN_NAME: { min: 3, max: 50 },
    CONTENT_TITLE: { min: 5, max: 200 },
    CONTENT_DESCRIPTION: { min: 10, max: 2000 },
    MESSAGE: { min: 1, max: 500 },
    BIO: { min: 0, max: 500 },
    URL: { max: 2000 }
  },
  
  // Gaming-specific patterns
  PATTERNS: {
    USERNAME: /^[a-zA-Z0-9_-]+$/,
    CLAN_NAME: /^[a-zA-Z0-9\s_-]+$/,
    CLAN_TAG: /^[A-Z0-9]{2,6}$/,
    SOLANA_ADDRESS: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    MLG_TOKEN_AMOUNT: /^\d+(\.\d{1,9})?$/
  },
  
  // Dangerous patterns to block
  BLOCKED_PATTERNS: [
    // SQL injection patterns
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /(\%3D)|(=)[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    
    // NoSQL injection patterns
    /\$where/i,
    /\$regex/i,
    /\$ne/i,
    /\$in/i,
    /\$nin/i,
    /\$exists/i,
    /\$type/i,
    
    // XSS patterns
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi,
    /onmouseover\s*=/gi,
    
    // Command injection patterns
    /;\s*(ls|cat|pwd|whoami|id|uname|ps|netstat|ifconfig)/gi,
    /\|\s*(ls|cat|pwd|whoami|id|uname|ps|netstat|ifconfig)/gi,
    /&&\s*(ls|cat|pwd|whoami|id|uname|ps|netstat|ifconfig)/gi,
    
    // Gaming-specific abuse patterns
    /admin|moderator|system|bot|official/gi,
    /\b(fuck|shit|damn|bitch|asshole|cunt|nigger|faggot)\b/gi
  ],
  
  // File upload security
  FILE_UPLOAD: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: {
      IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      VIDEO: ['video/mp4', 'video/webm', 'video/ogg'],
      DOCUMENT: ['application/pdf', 'text/plain']
    },
    BLOCKED_EXTENSIONS: ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.php', '.asp', '.jsp']
  }
};

/**
 * Gaming-specific validation schemas
 */
const GAMING_SCHEMAS = {
  username: Joi.string()
    .min(SECURITY_CONFIG.LIMITS.USERNAME.min)
    .max(SECURITY_CONFIG.LIMITS.USERNAME.max)
    .pattern(SECURITY_CONFIG.PATTERNS.USERNAME)
    .required()
    .messages({
      'string.pattern.base': 'Username can only contain letters, numbers, hyphens, and underscores',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 30 characters'
    }),
    
  clanName: Joi.string()
    .min(SECURITY_CONFIG.LIMITS.CLAN_NAME.min)
    .max(SECURITY_CONFIG.LIMITS.CLAN_NAME.max)
    .pattern(SECURITY_CONFIG.PATTERNS.CLAN_NAME)
    .required()
    .messages({
      'string.pattern.base': 'Clan name can contain letters, numbers, spaces, hyphens, and underscores',
      'string.min': 'Clan name must be at least 3 characters long',
      'string.max': 'Clan name cannot exceed 50 characters'
    }),
    
  clanTag: Joi.string()
    .pattern(SECURITY_CONFIG.PATTERNS.CLAN_TAG)
    .required()
    .messages({
      'string.pattern.base': 'Clan tag must be 2-6 uppercase letters or numbers'
    }),
    
  walletAddress: Joi.string()
    .pattern(SECURITY_CONFIG.PATTERNS.SOLANA_ADDRESS)
    .required()
    .messages({
      'string.pattern.base': 'Invalid Solana wallet address format'
    }),
    
  mlgAmount: Joi.string()
    .pattern(SECURITY_CONFIG.PATTERNS.MLG_TOKEN_AMOUNT)
    .required()
    .messages({
      'string.pattern.base': 'Invalid MLG token amount format'
    }),
    
  contentTitle: Joi.string()
    .min(SECURITY_CONFIG.LIMITS.CONTENT_TITLE.min)
    .max(SECURITY_CONFIG.LIMITS.CONTENT_TITLE.max)
    .required(),
    
  contentDescription: Joi.string()
    .min(SECURITY_CONFIG.LIMITS.CONTENT_DESCRIPTION.min)
    .max(SECURITY_CONFIG.LIMITS.CONTENT_DESCRIPTION.max)
    .required(),
    
  message: Joi.string()
    .min(SECURITY_CONFIG.LIMITS.MESSAGE.min)
    .max(SECURITY_CONFIG.LIMITS.MESSAGE.max)
    .required(),
    
  bio: Joi.string()
    .max(SECURITY_CONFIG.LIMITS.BIO.max)
    .allow('')
};

/**
 * Input Security Validator Class
 */
class InputSecurityValidator {
  /**
   * Check for dangerous patterns in input
   */
  static containsDangerousPattern(input) {
    if (typeof input !== 'string') return false;
    
    return SECURITY_CONFIG.BLOCKED_PATTERNS.some(pattern => pattern.test(input));
  }

  /**
   * Sanitize HTML content with gaming-specific rules
   */
  static sanitizeHtml(input, options = {}) {
    const config = {
      ALLOWED_TAGS: options.allowTags || ['b', 'i', 'em', 'strong', 'u', 'br'],
      ALLOWED_ATTR: options.allowAttributes || [],
      KEEP_CONTENT: true,
      ...options
    };

    return DOMPurify.sanitize(input, config);
  }

  /**
   * Sanitize and validate SQL inputs
   */
  static sanitizeSqlInput(input) {
    if (typeof input !== 'string') return input;
    
    // Remove or escape dangerous SQL characters
    return input
      .replace(/['"]/g, '') // Remove quotes
      .replace(/[;--]/g, '') // Remove semicolons and comments
      .replace(/\s+(or|and|union|select|insert|update|delete|drop|exec|execute)\s+/gi, ' ') // Remove SQL keywords
      .trim();
  }

  /**
   * Validate Solana wallet address
   */
  static validateWalletAddress(address) {
    try {
      new PublicKey(address);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate MLG token amount
   */
  static validateMlgAmount(amount) {
    const numAmount = parseFloat(amount);
    return !isNaN(numAmount) && 
           numAmount > 0 && 
           numAmount <= 1000000 && // Max 1M MLG
           numAmount.toString().split('.')[1]?.length <= 9; // Max 9 decimal places
  }

  /**
   * Gaming username validation with security checks
   */
  static validateGamingUsername(username) {
    if (!username || typeof username !== 'string') {
      return { valid: false, error: 'Username is required' };
    }

    // Check for dangerous patterns
    if (this.containsDangerousPattern(username)) {
      return { valid: false, error: 'Username contains prohibited characters or patterns' };
    }

    // Check against reserved words
    const reservedWords = ['admin', 'moderator', 'system', 'bot', 'official', 'mlg', 'clan'];
    if (reservedWords.some(word => username.toLowerCase().includes(word))) {
      return { valid: false, error: 'Username contains reserved words' };
    }

    // Validate with Joi schema
    const { error } = GAMING_SCHEMAS.username.validate(username);
    if (error) {
      return { valid: false, error: error.details[0].message };
    }

    return { valid: true };
  }

  /**
   * File upload security validation
   */
  static validateFileUpload(file, allowedTypes = 'IMAGE') {
    const validation = {
      valid: false,
      errors: []
    };

    if (!file || !file.mimetype || !file.size) {
      validation.errors.push('Invalid file data');
      return validation;
    }

    // Check file size
    if (file.size > SECURITY_CONFIG.FILE_UPLOAD.MAX_SIZE) {
      validation.errors.push(`File too large. Maximum size is ${SECURITY_CONFIG.FILE_UPLOAD.MAX_SIZE / (1024 * 1024)}MB`);
    }

    // Check MIME type
    const allowedMimeTypes = SECURITY_CONFIG.FILE_UPLOAD.ALLOWED_TYPES[allowedTypes] || [];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      validation.errors.push(`File type not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`);
    }

    // Check file extension
    const filename = file.originalname || file.name || '';
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    if (SECURITY_CONFIG.FILE_UPLOAD.BLOCKED_EXTENSIONS.includes(extension)) {
      validation.errors.push('File extension is blocked for security reasons');
    }

    // Check for executable content
    if (this.containsDangerousPattern(filename)) {
      validation.errors.push('Filename contains dangerous patterns');
    }

    validation.valid = validation.errors.length === 0;
    return validation;
  }

  /**
   * Comprehensive input sanitization
   */
  static sanitizeInput(input, type = 'text') {
    if (input === null || input === undefined) return input;
    
    if (typeof input === 'string') {
      // Remove null bytes and control characters
      let sanitized = input.replace(/\0/g, '').replace(/[\x00-\x1f\x7f]/g, '');
      
      switch (type) {
        case 'html':
          return this.sanitizeHtml(sanitized);
        case 'sql':
          return this.sanitizeSqlInput(sanitized);
        case 'url':
          return validator.isURL(sanitized) ? validator.escape(sanitized) : '';
        case 'email':
          return validator.isEmail(sanitized) ? validator.normalizeEmail(sanitized) : '';
        default:
          return validator.escape(sanitized);
      }
    }
    
    if (typeof input === 'object' && !Array.isArray(input)) {
      const sanitized = {};
      for (const key in input) {
        if (input.hasOwnProperty(key)) {
          sanitized[validator.escape(key)] = this.sanitizeInput(input[key], type);
        }
      }
      return sanitized;
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item, type));
    }
    
    return input;
  }
}

/**
 * Main input validation middleware
 */
export const inputValidationMiddleware = (schema, options = {}) => {
  return async (req, res, next) => {
    try {
      const { sanitizeInputs = true, checkDangerousPatterns = true } = options;

      // Extract data to validate
      const dataToValidate = {
        ...req.body,
        ...req.query,
        ...req.params
      };

      // Check for dangerous patterns first
      if (checkDangerousPatterns) {
        const inputString = JSON.stringify(dataToValidate);
        if (InputSecurityValidator.containsDangerousPattern(inputString)) {
          return res.status(400).json({
            error: 'Input contains prohibited patterns',
            code: 'DANGEROUS_INPUT_DETECTED',
            timestamp: new Date().toISOString()
          });
        }
      }

      // Sanitize inputs if enabled
      if (sanitizeInputs) {
        req.body = InputSecurityValidator.sanitizeInput(req.body);
        req.query = InputSecurityValidator.sanitizeInput(req.query);
      }

      // Validate with schema if provided
      if (schema) {
        const { error, value } = schema.validate(dataToValidate, {
          abortEarly: false,
          stripUnknown: true
        });

        if (error) {
          const validationErrors = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }));

          return res.status(400).json({
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: validationErrors,
            timestamp: new Date().toISOString()
          });
        }

        // Replace request data with validated and sanitized data
        Object.assign(req.body, value);
      }

      next();

    } catch (error) {
      console.error('Input validation middleware error:', error);
      return res.status(500).json({
        error: 'Input validation failed',
        code: 'VALIDATION_SYSTEM_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Gaming-specific validation middleware
 */
export const gamingValidationMiddleware = {
  // Username validation
  username: inputValidationMiddleware(Joi.object({
    username: GAMING_SCHEMAS.username
  })),

  // Clan validation
  clan: inputValidationMiddleware(Joi.object({
    name: GAMING_SCHEMAS.clanName,
    tag: GAMING_SCHEMAS.clanTag.optional(),
    description: GAMING_SCHEMAS.contentDescription.optional()
  })),

  // Wallet validation
  wallet: inputValidationMiddleware(Joi.object({
    walletAddress: GAMING_SCHEMAS.walletAddress
  })),

  // Content validation
  content: inputValidationMiddleware(Joi.object({
    title: GAMING_SCHEMAS.contentTitle,
    description: GAMING_SCHEMAS.contentDescription,
    tags: Joi.array().items(Joi.string().max(20)).max(10).optional()
  })),

  // Voting validation
  voting: inputValidationMiddleware(Joi.object({
    contentId: Joi.string().uuid().required(),
    voteType: Joi.string().valid('up', 'down').required(),
    mlgAmount: GAMING_SCHEMAS.mlgAmount
  })),

  // MLG token operations
  mlgToken: inputValidationMiddleware(Joi.object({
    amount: GAMING_SCHEMAS.mlgAmount,
    walletAddress: GAMING_SCHEMAS.walletAddress,
    operation: Joi.string().valid('burn', 'transfer', 'stake').required()
  }))
};

/**
 * File upload validation middleware
 */
export const fileUploadValidationMiddleware = (allowedTypes = 'IMAGE') => {
  return (req, res, next) => {
    try {
      if (!req.file && !req.files) {
        return next(); // No file to validate
      }

      const files = req.files || [req.file];
      const validationErrors = [];

      for (const file of files) {
        const validation = InputSecurityValidator.validateFileUpload(file, allowedTypes);
        if (!validation.valid) {
          validationErrors.push({
            filename: file.originalname || file.name,
            errors: validation.errors
          });
        }
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: 'File validation failed',
          code: 'FILE_VALIDATION_ERROR',
          details: validationErrors,
          timestamp: new Date().toISOString()
        });
      }

      next();

    } catch (error) {
      console.error('File upload validation error:', error);
      return res.status(500).json({
        error: 'File validation failed',
        code: 'FILE_VALIDATION_SYSTEM_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Real-time input monitoring middleware
 */
export const inputMonitoringMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;

  // Monitor request
  const requestData = {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    method: req.method,
    path: req.path,
    bodySize: JSON.stringify(req.body || {}).length,
    userId: req.user?.id,
    walletAddress: req.user?.walletAddress
  };

  res.send = function(data) {
    const processingTime = Date.now() - startTime;
    
    // Log suspicious requests
    if (processingTime > 5000 || // Long processing time
        requestData.bodySize > 10000 || // Large request body
        res.statusCode >= 400) { // Error responses
      
      console.warn('Suspicious request detected:', {
        ...requestData,
        processingTime,
        statusCode: res.statusCode,
        responseSize: data ? data.length : 0
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Export validation schemas for reuse
 */
export { GAMING_SCHEMAS, InputSecurityValidator };

export default {
  inputValidationMiddleware,
  gamingValidationMiddleware,
  fileUploadValidationMiddleware,
  inputMonitoringMiddleware,
  InputSecurityValidator,
  GAMING_SCHEMAS
};