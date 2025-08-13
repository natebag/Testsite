/**
 * Gaming Content Validation System
 * Specialized validation for gaming platform content with performance optimization
 * 
 * Features:
 * - Tournament and clan content validation
 * - Real-time chat message filtering
 * - Gaming leaderboard data sanitization
 * - User-generated gaming content protection
 * 
 * @author Claude Code - Security & Performance Auditor
 * @version 1.0.0
 * @created 2025-08-12
 */

import { gamingSanitizer, ENHANCED_SECURITY_CONFIG } from './index.js';
import validator from 'validator';

/**
 * Gaming Content Types and Validation Rules
 */
export const GAMING_CONTENT_TYPES = {
  CHAT_MESSAGE: {
    maxLength: 500,
    allowEmojis: true,
    filterToxicity: true,
    allowFormatting: false,
    processingTimeout: 2 // 2ms max for real-time chat
  },
  
  CLAN_DESCRIPTION: {
    maxLength: 1000,
    allowEmojis: true,
    filterToxicity: true,
    allowFormatting: true,
    processingTimeout: 5 // 5ms max
  },
  
  TOURNAMENT_NAME: {
    maxLength: 100,
    allowEmojis: false,
    filterToxicity: true,
    allowFormatting: false,
    processingTimeout: 3 // 3ms max
  },
  
  TOURNAMENT_DESCRIPTION: {
    maxLength: 2000,
    allowEmojis: true,
    filterToxicity: true,
    allowFormatting: true,
    processingTimeout: 5 // 5ms max
  },
  
  PLAYER_BIO: {
    maxLength: 500,
    allowEmojis: true,
    filterToxicity: true,
    allowFormatting: true,
    processingTimeout: 4 // 4ms max
  },
  
  TEAM_NAME: {
    maxLength: 50,
    allowEmojis: false,
    filterToxicity: true,
    allowFormatting: false,
    processingTimeout: 2 // 2ms max
  },
  
  ACHIEVEMENT_DESCRIPTION: {
    maxLength: 200,
    allowEmojis: true,
    filterToxicity: false,
    allowFormatting: true,
    processingTimeout: 3 // 3ms max
  },
  
  LEADERBOARD_ENTRY: {
    maxLength: 200,
    allowEmojis: false,
    filterToxicity: false,
    allowFormatting: false,
    processingTimeout: 1 // 1ms max for leaderboards
  }
};

/**
 * Gaming-Specific Validation Patterns
 */
export const GAMING_VALIDATION_PATTERNS = {
  // Player and team patterns
  GAMER_TAG: /^[a-zA-Z0-9_-]{3,20}$/,
  TEAM_NAME: /^[a-zA-Z0-9\s_-]{3,50}$/,
  CLAN_TAG: /^[A-Z0-9]{2,6}$/,
  
  // Tournament patterns
  TOURNAMENT_CODE: /^[A-Z0-9]{6,12}$/,
  BRACKET_POSITION: /^[1-9]\d{0,2}$/,
  ROUND_NUMBER: /^[1-9]\d{0,1}$/,
  
  // Scoring patterns
  GAME_SCORE: /^\d{1,8}$/,
  KDA_RATIO: /^\d{1,3}\/\d{1,3}\/\d{1,3}$/,
  WIN_RATE: /^(100|[1-9]?\d)(\.\d{1,2})?%?$/,
  
  // Gaming platform specific
  MATCH_ID: /^[A-Z0-9]{8}-[A-Z0-9]{4}$/,
  GAME_MODE: /^[a-zA-Z0-9_]{3,20}$/,
  MAP_NAME: /^[a-zA-Z0-9\s_-]{3,30}$/
};

/**
 * Gaming Content Validator Class
 */
export class GamingContentValidator {
  constructor() {
    this.validationStats = {
      totalValidations: 0,
      passedValidations: 0,
      failedValidations: 0,
      averageTime: 0,
      totalTime: 0
    };
  }

  /**
   * Validate gaming chat message with real-time performance
   */
  async validateChatMessage(message, userId = null, channelType = 'general') {
    const startTime = performance.now();
    
    try {
      const result = await this.validateContent(message, 'CHAT_MESSAGE', {
        userId,
        channelType,
        realTime: true
      });
      
      this.updateValidationStats(performance.now() - startTime, result.isValid);
      return result;
      
    } catch (error) {
      console.error('Chat message validation error:', error);
      this.updateValidationStats(performance.now() - startTime, false);
      return {
        isValid: false,
        sanitizedContent: '',
        errors: ['Validation system error'],
        warnings: []
      };
    }
  }

  /**
   * Validate clan content (names, descriptions, etc.)
   */
  async validateClanContent(content, contentType, clanId = null) {
    const startTime = performance.now();
    
    try {
      const result = await this.validateContent(content, contentType, {
        clanId,
        context: 'clan'
      });
      
      // Additional clan-specific validations
      if (contentType === 'CLAN_DESCRIPTION') {
        result.warnings.push(...this.validateClanDescription(content));
      }
      
      this.updateValidationStats(performance.now() - startTime, result.isValid);
      return result;
      
    } catch (error) {
      console.error('Clan content validation error:', error);
      this.updateValidationStats(performance.now() - startTime, false);
      return this.getErrorResponse();
    }
  }

  /**
   * Validate tournament data with strict rules
   */
  async validateTournamentContent(content, contentType, tournamentId = null) {
    const startTime = performance.now();
    
    try {
      const result = await this.validateContent(content, contentType, {
        tournamentId,
        context: 'tournament',
        strictMode: true
      });
      
      // Additional tournament-specific validations
      if (contentType === 'TOURNAMENT_NAME') {
        result.warnings.push(...this.validateTournamentName(content));
      }
      
      this.updateValidationStats(performance.now() - startTime, result.isValid);
      return result;
      
    } catch (error) {
      console.error('Tournament content validation error:', error);
      this.updateValidationStats(performance.now() - startTime, false);
      return this.getErrorResponse();
    }
  }

  /**
   * Validate user profile content
   */
  async validateUserProfile(content, contentType, userId = null) {
    const startTime = performance.now();
    
    try {
      const result = await this.validateContent(content, contentType, {
        userId,
        context: 'profile'
      });
      
      // Additional profile-specific validations
      if (contentType === 'PLAYER_BIO') {
        result.warnings.push(...this.validatePlayerBio(content));
      }
      
      this.updateValidationStats(performance.now() - startTime, result.isValid);
      return result;
      
    } catch (error) {
      console.error('User profile validation error:', error);
      this.updateValidationStats(performance.now() - startTime, false);
      return this.getErrorResponse();
    }
  }

  /**
   * Core content validation logic
   */
  async validateContent(content, contentType, options = {}) {
    const validationRules = GAMING_CONTENT_TYPES[contentType];
    if (!validationRules) {
      throw new Error(`Unknown content type: ${contentType}`);
    }

    const result = {
      isValid: true,
      sanitizedContent: content,
      errors: [],
      warnings: [],
      metadata: {
        contentType,
        originalLength: content.length,
        sanitizedLength: 0,
        processingTime: 0
      }
    };

    const startTime = performance.now();

    // Basic validation checks
    if (!this.validateBasicRules(content, validationRules, result)) {
      result.isValid = false;
    }

    // Gaming-specific pattern validation
    if (!this.validateGamingPatterns(content, contentType, result)) {
      result.isValid = false;
    }

    // Sanitize content if it passes basic validation
    if (result.isValid || options.sanitizeAnyway) {
      result.sanitizedContent = await this.sanitizeGamingContent(
        content, 
        contentType, 
        validationRules,
        options
      );
      result.metadata.sanitizedLength = result.sanitizedContent.length;
    }

    // Performance check
    const processingTime = performance.now() - startTime;
    result.metadata.processingTime = processingTime;
    
    if (processingTime > validationRules.processingTimeout) {
      result.warnings.push(`Processing time exceeded target (${processingTime.toFixed(2)}ms > ${validationRules.processingTimeout}ms)`);
    }

    return result;
  }

  /**
   * Validate basic content rules
   */
  validateBasicRules(content, rules, result) {
    let isValid = true;

    // Check content exists
    if (!content || typeof content !== 'string') {
      result.errors.push('Content is required and must be a string');
      return false;
    }

    // Check length
    if (content.length > rules.maxLength) {
      result.errors.push(`Content exceeds maximum length (${content.length} > ${rules.maxLength})`);
      isValid = false;
    }

    // Check for empty content where not allowed
    if (content.trim().length === 0 && rules.maxLength > 0) {
      result.errors.push('Content cannot be empty');
      isValid = false;
    }

    return isValid;
  }

  /**
   * Validate gaming-specific patterns
   */
  validateGamingPatterns(content, contentType, result) {
    let isValid = true;

    // Check for reserved gaming terms that shouldn't be used
    const reservedTerms = ['admin', 'moderator', 'system', 'official', 'mlg-official'];
    const lowerContent = content.toLowerCase();
    
    for (const term of reservedTerms) {
      if (lowerContent.includes(term)) {
        result.warnings.push(`Content contains reserved term: ${term}`);
      }
    }

    // Content-specific pattern validation
    switch (contentType) {
      case 'TEAM_NAME':
        if (!GAMING_VALIDATION_PATTERNS.TEAM_NAME.test(content)) {
          result.errors.push('Team name contains invalid characters');
          isValid = false;
        }
        break;
        
      case 'TOURNAMENT_NAME':
        if (content.length < 5) {
          result.errors.push('Tournament name too short');
          isValid = false;
        }
        break;
    }

    return isValid;
  }

  /**
   * Sanitize gaming content based on type and rules
   */
  async sanitizeGamingContent(content, contentType, rules, options = {}) {
    const sanitizationConfig = {
      allowEmojis: rules.allowEmojis,
      filterToxicity: rules.filterToxicity,
      allowFormatting: rules.allowFormatting,
      maxLength: rules.maxLength,
      strictMode: options.strictMode || false
    };

    let sanitizationType;
    switch (contentType) {
      case 'CHAT_MESSAGE':
        sanitizationType = 'gaming-chat';
        break;
      case 'CLAN_DESCRIPTION':
        sanitizationType = 'clan-content';
        break;
      case 'TOURNAMENT_NAME':
      case 'TOURNAMENT_DESCRIPTION':
        sanitizationType = 'tournament-data';
        break;
      case 'PLAYER_BIO':
        sanitizationType = 'user-profile';
        break;
      default:
        sanitizationType = 'text';
    }

    return await gamingSanitizer.sanitizeWithCache(content, sanitizationType, sanitizationConfig);
  }

  /**
   * Validate clan description specifically
   */
  validateClanDescription(content) {
    const warnings = [];
    
    // Check for clan recruitment keywords
    const recruitmentKeywords = ['recruiting', 'looking for', 'need players', 'join us'];
    const lowerContent = content.toLowerCase();
    
    if (recruitmentKeywords.some(keyword => lowerContent.includes(keyword))) {
      warnings.push('Description appears to be for recruitment - consider using dedicated recruitment channels');
    }
    
    return warnings;
  }

  /**
   * Validate tournament name specifically
   */
  validateTournamentName(content) {
    const warnings = [];
    
    // Check for unofficial tournament indicators
    const unofficialIndicators = ['unofficial', 'fan-made', 'community'];
    const lowerContent = content.toLowerCase();
    
    if (unofficialIndicators.some(indicator => lowerContent.includes(indicator))) {
      warnings.push('Tournament name indicates unofficial status');
    }
    
    return warnings;
  }

  /**
   * Validate player bio specifically
   */
  validatePlayerBio(content) {
    const warnings = [];
    
    // Check for social media links (should be in dedicated fields)
    const socialPatterns = [
      /twitter\.com/i,
      /instagram\.com/i,
      /youtube\.com/i,
      /twitch\.tv/i,
      /discord\.gg/i
    ];
    
    if (socialPatterns.some(pattern => pattern.test(content))) {
      warnings.push('Bio contains social media links - consider using dedicated social media fields');
    }
    
    return warnings;
  }

  /**
   * Get error response for system failures
   */
  getErrorResponse() {
    return {
      isValid: false,
      sanitizedContent: '',
      errors: ['System validation error'],
      warnings: [],
      metadata: {
        contentType: 'unknown',
        originalLength: 0,
        sanitizedLength: 0,
        processingTime: 0
      }
    };
  }

  /**
   * Update validation statistics
   */
  updateValidationStats(processingTime, isValid) {
    this.validationStats.totalValidations++;
    this.validationStats.totalTime += processingTime;
    this.validationStats.averageTime = this.validationStats.totalTime / this.validationStats.totalValidations;
    
    if (isValid) {
      this.validationStats.passedValidations++;
    } else {
      this.validationStats.failedValidations++;
    }
  }

  /**
   * Get validation statistics
   */
  getValidationStats() {
    const total = this.validationStats.totalValidations;
    return {
      ...this.validationStats,
      successRate: total > 0 ? ((this.validationStats.passedValidations / total) * 100).toFixed(2) : 0,
      averageTimeMs: Number(this.validationStats.averageTime.toFixed(3))
    };
  }

  /**
   * Reset validation statistics
   */
  resetStats() {
    this.validationStats = {
      totalValidations: 0,
      passedValidations: 0,
      failedValidations: 0,
      averageTime: 0,
      totalTime: 0
    };
  }
}

/**
 * Batch validation for multiple gaming content items
 */
export class GamingBatchValidator extends GamingContentValidator {
  /**
   * Validate multiple content items efficiently
   */
  async validateBatch(contentItems, options = {}) {
    const { maxConcurrent = 10, timeoutMs = 50 } = options;
    const results = [];
    
    // Process in batches to maintain performance
    for (let i = 0; i < contentItems.length; i += maxConcurrent) {
      const batch = contentItems.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (item) => {
        try {
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Validation timeout')), timeoutMs)
          );
          
          const validationPromise = this.validateContent(
            item.content, 
            item.contentType, 
            item.options || {}
          );
          
          return await Promise.race([validationPromise, timeoutPromise]);
        } catch (error) {
          return this.getErrorResponse();
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }
}

// Create singleton instances
export const gamingContentValidator = new GamingContentValidator();
export const gamingBatchValidator = new GamingBatchValidator();

export default {
  GamingContentValidator,
  GamingBatchValidator,
  GAMING_CONTENT_TYPES,
  GAMING_VALIDATION_PATTERNS,
  gamingContentValidator,
  gamingBatchValidator
};