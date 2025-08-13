/**
 * Input Validation and Sanitization System for MLG.clan Gaming Platform
 * 
 * Comprehensive input validation and sanitization focused on gaming content security,
 * user-generated content protection, and Web3 transaction safety.
 * 
 * Features:
 * - Gaming content validation and sanitization
 * - User profile and clan content protection
 * - Web3 wallet address and transaction validation
 * - Real-time chat and messaging security
 * - Tournament data integrity protection
 * 
 * @author Claude Code - Security & Performance Auditor
 * @version 1.0.0
 * @created 2025-08-12
 */

import DOMPurify from 'dompurify';
import validator from 'validator';
import { JSDOM } from 'jsdom';

/**
 * Input validation configuration for gaming platform
 */
const VALIDATION_CONFIG = {
  // Gaming content limits
  GAMING: {
    maxUsernameLength: 32,
    maxClanNameLength: 64,
    maxClanDescriptionLength: 500,
    maxTournamentNameLength: 100,
    maxChatMessageLength: 300,
    allowedUsernameChars: /^[a-zA-Z0-9_-]+$/,
    allowedClanTags: /^[A-Z0-9]{2,6}$/
  },
  
  // Web3 validation patterns
  WEB3: {
    solanaAddressPattern: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    ethereumAddressPattern: /^0x[a-fA-F0-9]{40}$/,
    maxTokenAmount: '999999999999999999', // 18 decimal places
    validNetworks: ['mainnet-beta', 'devnet', 'testnet']
  },
  
  // Content filtering
  CONTENT: {
    profanityFiltering: true,
    spamDetection: true,
    linkValidation: true,
    imageValidation: true,
    maxLinksPerMessage: 2,
    allowedImageTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    maxImageSize: 5 * 1024 * 1024 // 5MB
  },
  
  // Performance settings
  PERFORMANCE: {
    sanitizationTimeout: 100, // 100ms max
    cacheTTL: 3600, // 1 hour cache
    maxConcurrentValidations: 1000
  }
};

/**
 * Gaming-specific profanity and spam detection
 */
const GAMING_FILTERS = {
  // Common gaming profanity patterns (basic examples)
  profanityPatterns: [
    /n00b/gi,
    /scrub/gi,
    /trash/gi
  ],
  
  // Spam detection patterns
  spamPatterns: [
    /(.)\1{10,}/g, // Repeated characters
    /[A-Z]{20,}/g, // Excessive capitals
    /(free|cheap|buy).*(coins?|tokens?|nft)/gi,
    /join.*(discord|telegram).*(free|coins?)/gi
  ],
  
  // Gaming terminology whitelist
  gamingTermsWhitelist: [
    'gg', 'glhf', 'wp', 'nt', 'clutch', 'ace', 'frag',
    'respawn', 'spawn', 'camp', 'rush', 'strat'
  ]
};

/**
 * DOMPurify configuration for gaming content
 */
const createDOMPurifyConfig = () => {
  const window = new JSDOM('').window;
  const purify = DOMPurify(window);
  
  // Gaming platform safe HTML configuration
  return {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'u', 'br', 'p', 'span',
      'div', 'pre', 'code' // For gaming stats display
    ],
    ALLOWED_ATTR: [
      'class', 'id', 'data-gaming-stat', 'data-player-id'
    ],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    SANITIZE_DOM: true,
    WHOLE_DOCUMENT: false,
    CUSTOM_ELEMENT_HANDLING: {
      tagNameCheck: /^gaming-/,
      attributeNameCheck: /^data-gaming-/,
      allowCustomizedBuiltInElements: false
    }
  };
};

/**
 * Main Input Validator Class
 */
export class GamingInputValidator {
  constructor(options = {}) {
    this.config = { ...VALIDATION_CONFIG, ...options };
    this.purifyConfig = createDOMPurifyConfig();
    this.validationCache = new Map();
    this.stats = {
      totalValidations: 0,
      blockedInputs: 0,
      sanitizedInputs: 0,
      cacheHits: 0,
      averageProcessingTime: 0
    };
    
    this.initializeProfanityFilter();
  }

  /**
   * Initialize profanity filtering system
   */
  initializeProfanityFilter() {
    // Create combined profanity pattern
    this.profanityRegex = new RegExp(
      GAMING_FILTERS.profanityPatterns
        .map(pattern => pattern.source)
        .join('|'),
      'gi'
    );
    
    // Create spam detection pattern
    this.spamRegex = new RegExp(
      GAMING_FILTERS.spamPatterns
        .map(pattern => pattern.source)
        .join('|'),
      'gi'
    );
  }

  /**
   * Validate and sanitize gaming username
   */
  validateUsername(username) {
    const startTime = Date.now();
    
    try {
      // Basic validation
      if (!username || typeof username !== 'string') {
        return { isValid: false, error: 'Username is required' };
      }
      
      // Length validation
      if (username.length > this.config.GAMING.maxUsernameLength) {
        return { 
          isValid: false, 
          error: `Username too long (max ${this.config.GAMING.maxUsernameLength} characters)` 
        };
      }
      
      // Character validation
      if (!this.config.GAMING.allowedUsernameChars.test(username)) {
        return { 
          isValid: false, 
          error: 'Username contains invalid characters' 
        };
      }
      
      // Profanity check
      if (this.containsProfanity(username)) {
        return { 
          isValid: false, 
          error: 'Username contains inappropriate content' 
        };
      }
      
      // Sanitize
      const sanitized = validator.escape(username.trim());
      
      this.updateStats(startTime, true);
      return { 
        isValid: true, 
        sanitized,
        original: username 
      };
      
    } catch (error) {
      this.updateStats(startTime, false);
      return { 
        isValid: false, 
        error: 'Validation error occurred' 
      };
    }
  }

  /**
   * Validate and sanitize clan information
   */
  validateClanInfo(clanData) {
    const startTime = Date.now();
    
    try {
      const result = {
        isValid: true,
        sanitized: {},
        errors: []
      };
      
      // Validate clan name
      if (clanData.name) {
        if (clanData.name.length > this.config.GAMING.maxClanNameLength) {
          result.errors.push('Clan name too long');
          result.isValid = false;
        } else if (this.containsProfanity(clanData.name)) {
          result.errors.push('Clan name contains inappropriate content');
          result.isValid = false;
        } else {
          result.sanitized.name = validator.escape(clanData.name.trim());
        }
      }
      
      // Validate clan tag
      if (clanData.tag) {
        if (!this.config.GAMING.allowedClanTags.test(clanData.tag)) {
          result.errors.push('Invalid clan tag format');
          result.isValid = false;
        } else {
          result.sanitized.tag = validator.escape(clanData.tag.trim().toUpperCase());
        }
      }
      
      // Validate clan description
      if (clanData.description) {
        if (clanData.description.length > this.config.GAMING.maxClanDescriptionLength) {
          result.errors.push('Clan description too long');
          result.isValid = false;
        } else {
          const sanitizedDescription = this.sanitizeHTML(clanData.description);
          if (this.containsProfanity(sanitizedDescription) || this.isSpam(sanitizedDescription)) {
            result.errors.push('Clan description contains inappropriate content');
            result.isValid = false;
          } else {
            result.sanitized.description = sanitizedDescription;
          }
        }
      }
      
      this.updateStats(startTime, result.isValid);
      return result;
      
    } catch (error) {
      this.updateStats(startTime, false);
      return { 
        isValid: false, 
        errors: ['Validation error occurred'] 
      };
    }
  }

  /**
   * Validate Web3 wallet address
   */
  validateWalletAddress(address, network = 'solana') {
    const startTime = Date.now();
    
    try {
      if (!address || typeof address !== 'string') {
        return { isValid: false, error: 'Wallet address is required' };
      }
      
      const trimmedAddress = address.trim();
      let isValidFormat = false;
      
      switch (network.toLowerCase()) {
        case 'solana':
          isValidFormat = this.config.WEB3.solanaAddressPattern.test(trimmedAddress);
          break;
        case 'ethereum':
          isValidFormat = this.config.WEB3.ethereumAddressPattern.test(trimmedAddress);
          break;
        default:
          return { isValid: false, error: 'Unsupported network' };
      }
      
      if (!isValidFormat) {
        return { 
          isValid: false, 
          error: `Invalid ${network} wallet address format` 
        };
      }
      
      // Additional validation: Check for common invalid addresses
      const invalidAddresses = [
        '11111111111111111111111111111111', // Solana burn address
        '0x0000000000000000000000000000000000000000' // Ethereum null address
      ];
      
      if (invalidAddresses.includes(trimmedAddress)) {
        return { 
          isValid: false, 
          error: 'Invalid wallet address' 
        };
      }
      
      this.updateStats(startTime, true);
      return { 
        isValid: true, 
        sanitized: trimmedAddress,
        network 
      };
      
    } catch (error) {
      this.updateStats(startTime, false);
      return { 
        isValid: false, 
        error: 'Wallet validation error' 
      };
    }
  }

  /**
   * Validate gaming chat message
   */
  validateChatMessage(message, userId = null) {
    const startTime = Date.now();
    
    try {
      if (!message || typeof message !== 'string') {
        return { isValid: false, error: 'Message is required' };
      }
      
      // Length validation
      if (message.length > this.config.GAMING.maxChatMessageLength) {
        return { 
          isValid: false, 
          error: `Message too long (max ${this.config.GAMING.maxChatMessageLength} characters)` 
        };
      }
      
      // Spam detection
      if (this.isSpam(message)) {
        return { 
          isValid: false, 
          error: 'Message detected as spam' 
        };
      }
      
      // Profanity filtering
      if (this.containsProfanity(message)) {
        // Auto-moderate instead of blocking for gaming chat
        const sanitized = this.filterProfanity(message);
        this.updateStats(startTime, true, true);
        return { 
          isValid: true, 
          sanitized,
          original: message,
          wasFiltered: true 
        };
      }
      
      // Link validation
      const linkValidation = this.validateLinks(message);
      if (!linkValidation.isValid) {
        return linkValidation;
      }
      
      // HTML sanitization
      const sanitized = this.sanitizeHTML(message);
      
      this.updateStats(startTime, true);
      return { 
        isValid: true, 
        sanitized,
        original: message 
      };
      
    } catch (error) {
      this.updateStats(startTime, false);
      return { 
        isValid: false, 
        error: 'Message validation error' 
      };
    }
  }

  /**
   * Sanitize HTML content for gaming platform
   */
  sanitizeHTML(content) {
    if (!content || typeof content !== 'string') {
      return '';
    }
    
    const window = new JSDOM('').window;
    const purify = DOMPurify(window);
    
    return purify.sanitize(content, this.purifyConfig);
  }

  /**
   * Check for profanity in gaming content
   */
  containsProfanity(content) {
    if (!content || !this.config.CONTENT.profanityFiltering) {
      return false;
    }
    
    const normalized = content.toLowerCase();
    
    // Check against gaming terms whitelist first
    const isWhitelisted = GAMING_FILTERS.gamingTermsWhitelist.some(term => 
      normalized.includes(term.toLowerCase())
    );
    
    if (isWhitelisted) {
      return false;
    }
    
    return this.profanityRegex.test(content);
  }

  /**
   * Filter profanity from content
   */
  filterProfanity(content) {
    if (!content || !this.config.CONTENT.profanityFiltering) {
      return content;
    }
    
    return content.replace(this.profanityRegex, (match) => {
      return '*'.repeat(match.length);
    });
  }

  /**
   * Detect spam in gaming content
   */
  isSpam(content) {
    if (!content || !this.config.CONTENT.spamDetection) {
      return false;
    }
    
    return this.spamRegex.test(content);
  }

  /**
   * Validate links in content
   */
  validateLinks(content) {
    if (!content) {
      return { isValid: true };
    }
    
    // Extract URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = content.match(urlRegex) || [];
    
    // Check link count
    if (urls.length > this.config.CONTENT.maxLinksPerMessage) {
      return { 
        isValid: false, 
        error: `Too many links (max ${this.config.CONTENT.maxLinksPerMessage})` 
      };
    }
    
    // Validate each URL
    for (const url of urls) {
      if (!validator.isURL(url, { protocols: ['http', 'https'] })) {
        return { 
          isValid: false, 
          error: 'Invalid URL format' 
        };
      }
      
      // Check for suspicious domains (basic check)
      try {
        const urlObj = new URL(url);
        const suspiciousDomains = ['bit.ly', 't.co', 'tinyurl.com'];
        if (suspiciousDomains.includes(urlObj.hostname)) {
          return { 
            isValid: false, 
            error: 'Shortened URLs not allowed' 
          };
        }
      } catch (e) {
        return { 
          isValid: false, 
          error: 'Invalid URL' 
        };
      }
    }
    
    return { isValid: true };
  }

  /**
   * Update validation statistics
   */
  updateStats(startTime, isValid, wasSanitized = false) {
    const processingTime = Date.now() - startTime;
    
    this.stats.totalValidations++;
    if (!isValid) {
      this.stats.blockedInputs++;
    }
    if (wasSanitized) {
      this.stats.sanitizedInputs++;
    }
    
    // Update average processing time
    this.stats.averageProcessingTime = 
      (this.stats.averageProcessingTime * (this.stats.totalValidations - 1) + processingTime) / 
      this.stats.totalValidations;
  }

  /**
   * Get validation statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      cacheSize: this.validationCache.size,
      successRate: this.stats.totalValidations > 0 ? 
        ((this.stats.totalValidations - this.stats.blockedInputs) / this.stats.totalValidations * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * Clear validation cache
   */
  clearCache() {
    this.validationCache.clear();
  }

  /**
   * Get gaming-specific validation rules
   */
  getGamingValidationRules() {
    return {
      username: {
        maxLength: this.config.GAMING.maxUsernameLength,
        allowedChars: this.config.GAMING.allowedUsernameChars.source,
        profanityFiltering: this.config.CONTENT.profanityFiltering
      },
      clanName: {
        maxLength: this.config.GAMING.maxClanNameLength,
        profanityFiltering: this.config.CONTENT.profanityFiltering
      },
      clanTag: {
        pattern: this.config.GAMING.allowedClanTags.source,
        maxLength: 6
      },
      chatMessage: {
        maxLength: this.config.GAMING.maxChatMessageLength,
        maxLinks: this.config.CONTENT.maxLinksPerMessage,
        spamDetection: this.config.CONTENT.spamDetection,
        profanityFiltering: this.config.CONTENT.profanityFiltering
      }
    };
  }
}

/**
 * Create gaming input validator instance
 */
export const createGamingValidator = (options = {}) => {
  return new GamingInputValidator(options);
};

/**
 * Default gaming platform validator
 */
export const gamingValidator = createGamingValidator();

export default {
  GamingInputValidator,
  createGamingValidator,
  gamingValidator,
  VALIDATION_CONFIG,
  GAMING_FILTERS
};