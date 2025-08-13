/**
 * XSS Protection System for MLG.clan Gaming Platform
 * 
 * Advanced Cross-Site Scripting (XSS) protection specifically designed for
 * gaming platforms with user-generated content, Web3 integrations, and 
 * real-time gaming communications.
 * 
 * Features:
 * - Gaming content XSS protection
 * - Web3 transaction data sanitization
 * - Real-time chat XSS prevention
 * - Tournament bracket protection
 * - User profile XSS filtering
 * 
 * @author Claude Code - Security & Performance Auditor
 * @version 1.0.0
 * @created 2025-08-12
 */

import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import xss from 'xss';

/**
 * XSS Protection Configuration
 */
const XSS_CONFIG = {
  // Gaming content protection settings
  GAMING: {
    allowGamingTags: true,
    allowEmbeds: false, // Gaming video embeds disabled for security
    allowCustomAttributes: ['data-player-id', 'data-gaming-stat', 'data-tournament-id'],
    maxContentLength: 10000,
    enableProfileCustomization: true
  },
  
  // Web3 specific protection
  WEB3: {
    strictWalletValidation: true,
    allowContractData: false,
    sanitizeTransactionData: true,
    blockScriptInjection: true
  },
  
  // Gaming chat protection
  CHAT: {
    allowBasicFormatting: true,
    allowEmojis: true,
    allowGamingMentions: true,
    blockInlineScripts: true,
    maxMessageLength: 500
  },
  
  // Performance settings
  PERFORMANCE: {
    cacheCleanedContent: true,
    cacheTTL: 3600, // 1 hour
    maxCacheSize: 10000,
    enableMetrics: true
  }
};

/**
 * Gaming-specific XSS patterns and whitelists
 */
const GAMING_XSS_PATTERNS = {
  // Dangerous patterns specific to gaming platforms
  dangerousPatterns: [
    /<script[^>]*>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi,
    /document\./gi,
    /window\./gi,
    /eval\(/gi,
    /Function\(/gi
  ],
  
  // Gaming-safe HTML tags
  allowedTags: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span', 'div',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'blockquote', 'code', 'pre',
    'gaming-stat', 'player-card', 'tournament-bracket'
  ],
  
  // Gaming-safe attributes
  allowedAttributes: {
    '*': ['class', 'id', 'style'],
    'gaming-stat': ['data-stat-type', 'data-player-id', 'data-value'],
    'player-card': ['data-player-id', 'data-rank'],
    'tournament-bracket': ['data-tournament-id', 'data-round'],
    'span': ['data-player-id', 'data-mention-type'],
    'div': ['data-gaming-component', 'data-tournament-id']
  },
  
  // Safe CSS properties for gaming styling
  allowedCSSProperties: [
    'color', 'background-color', 'font-size', 'font-weight',
    'text-align', 'margin', 'padding', 'border',
    'border-radius', 'opacity', 'display'
  ]
};

/**
 * Advanced XSS Protection Class
 */
export class GamingXSSProtection {
  constructor(options = {}) {
    this.config = { ...XSS_CONFIG, ...options };
    this.cache = new Map();
    this.metrics = {
      totalProcessed: 0,
      threatsBlocked: 0,
      contentSanitized: 0,
      averageProcessingTime: 0,
      cacheHits: 0
    };
    
    this.initializeProtection();
  }

  /**
   * Initialize XSS protection systems
   */
  initializeProtection() {
    // Initialize DOMPurify for server-side protection
    const window = new JSDOM('').window;
    this.purify = DOMPurify(window);
    
    // Configure DOMPurify for gaming platform
    this.purifyConfig = {
      ALLOWED_TAGS: GAMING_XSS_PATTERNS.allowedTags,
      ALLOWED_ATTR: this.config.GAMING.allowCustomAttributes,
      KEEP_CONTENT: true,
      RETURN_DOM: false,
      SANITIZE_DOM: true,
      WHOLE_DOCUMENT: false,
      ADD_TAGS: ['gaming-stat', 'player-card', 'tournament-bracket'],
      ADD_ATTR: ['data-player-id', 'data-gaming-stat', 'data-tournament-id']
    };
    
    // Initialize XSS library configuration
    this.xssOptions = {
      whitelist: GAMING_XSS_PATTERNS.allowedAttributes,
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script', 'style'],
      allowCommentTag: false,
      css: {
        whiteList: this.createCSSWhitelist()
      }
    };
    
    // Setup cache cleanup
    this.setupCacheCleanup();
  }

  /**
   * Create CSS whitelist for gaming styling
   */
  createCSSWhitelist() {
    const whitelist = {};
    GAMING_XSS_PATTERNS.allowedCSSProperties.forEach(prop => {
      whitelist[prop] = true;
    });
    return whitelist;
  }

  /**
   * Main XSS protection method for gaming content
   */
  protectGamingContent(content, contentType = 'general') {
    const startTime = Date.now();
    
    try {
      if (!content || typeof content !== 'string') {
        return { isClean: true, content: '', threats: [] };
      }
      
      // Check cache first
      const cacheKey = this.generateCacheKey(content, contentType);
      if (this.config.PERFORMANCE.cacheCleanedContent && this.cache.has(cacheKey)) {
        this.metrics.cacheHits++;
        return this.cache.get(cacheKey);
      }
      
      // Detect potential threats
      const threats = this.detectThreats(content);
      
      // Apply content-type specific protection
      let cleanContent;
      switch (contentType) {
        case 'chat':
          cleanContent = this.protectChatMessage(content);
          break;
        case 'profile':
          cleanContent = this.protectUserProfile(content);
          break;
        case 'clan':
          cleanContent = this.protectClanContent(content);
          break;
        case 'tournament':
          cleanContent = this.protectTournamentData(content);
          break;
        case 'web3':
          cleanContent = this.protectWeb3Data(content);
          break;
        default:
          cleanContent = this.protectGeneralContent(content);
      }
      
      const result = {
        isClean: threats.length === 0,
        content: cleanContent,
        original: content,
        threats,
        contentType,
        processingTime: Date.now() - startTime
      };
      
      // Cache the result
      if (this.config.PERFORMANCE.cacheCleanedContent) {
        this.cacheResult(cacheKey, result);
      }
      
      // Update metrics
      this.updateMetrics(startTime, threats.length > 0, cleanContent !== content);
      
      return result;
      
    } catch (error) {
      console.error('XSS Protection Error:', error);
      this.updateMetrics(startTime, false, false);
      return {
        isClean: false,
        content: '',
        threats: ['Processing error'],
        error: error.message
      };
    }
  }

  /**
   * Protect gaming chat messages
   */
  protectChatMessage(content) {
    if (!content) return '';
    
    // Limit message length
    if (content.length > this.config.CHAT.maxMessageLength) {
      content = content.substring(0, this.config.CHAT.maxMessageLength);
    }
    
    // Apply basic XSS protection
    let cleanContent = this.purify.sanitize(content, {
      ...this.purifyConfig,
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span', 'br'],
      ALLOWED_ATTR: ['class', 'data-player-id', 'data-mention-type']
    });
    
    // Preserve gaming mentions (@player, #tournament)
    cleanContent = this.preserveGamingMentions(cleanContent);
    
    return cleanContent;
  }

  /**
   * Protect user profile content
   */
  protectUserProfile(content) {
    if (!content) return '';
    
    // Allow more customization for profiles but maintain security
    return this.purify.sanitize(content, {
      ...this.purifyConfig,
      ALLOWED_TAGS: [
        ...GAMING_XSS_PATTERNS.allowedTags,
        'gaming-stat', 'player-card'
      ],
      ALLOWED_ATTR: [
        ...this.config.GAMING.allowCustomAttributes,
        'style'
      ],
      ALLOW_UNKNOWN_PROTOCOLS: false
    });
  }

  /**
   * Protect clan descriptions and content
   */
  protectClanContent(content) {
    if (!content) return '';
    
    return this.purify.sanitize(content, {
      ...this.purifyConfig,
      ALLOWED_TAGS: GAMING_XSS_PATTERNS.allowedTags,
      ALLOWED_ATTR: this.config.GAMING.allowCustomAttributes
    });
  }

  /**
   * Protect tournament data and brackets
   */
  protectTournamentData(content) {
    if (!content) return '';
    
    return this.purify.sanitize(content, {
      ...this.purifyConfig,
      ALLOWED_TAGS: [
        ...GAMING_XSS_PATTERNS.allowedTags,
        'tournament-bracket'
      ],
      ALLOWED_ATTR: [
        ...this.config.GAMING.allowCustomAttributes,
        'data-tournament-id', 'data-round', 'data-match-id'
      ]
    });
  }

  /**
   * Protect Web3 transaction and wallet data
   */
  protectWeb3Data(content) {
    if (!content) return '';
    
    // Very strict protection for Web3 data
    return this.purify.sanitize(content, {
      ALLOWED_TAGS: ['span', 'div', 'code', 'pre'],
      ALLOWED_ATTR: ['class', 'data-wallet-address', 'data-transaction-id'],
      KEEP_CONTENT: true,
      ALLOW_UNKNOWN_PROTOCOLS: false,
      SANITIZE_DOM: true
    });
  }

  /**
   * Protect general gaming content
   */
  protectGeneralContent(content) {
    if (!content) return '';
    
    return this.purify.sanitize(content, this.purifyConfig);
  }

  /**
   * Detect potential XSS threats
   */
  detectThreats(content) {
    const threats = [];
    
    GAMING_XSS_PATTERNS.dangerousPatterns.forEach((pattern, index) => {
      if (pattern.test(content)) {
        threats.push({
          type: 'XSS Pattern',
          pattern: pattern.source,
          severity: this.calculateThreatSeverity(pattern),
          description: this.getThreatDescription(pattern)
        });
      }
    });
    
    return threats;
  }

  /**
   * Calculate threat severity
   */
  calculateThreatSeverity(pattern) {
    const criticalPatterns = ['<script', 'javascript:', 'eval(', 'Function('];
    const highPatterns = ['<iframe', '<object', '<embed'];
    
    const patternSource = pattern.source.toLowerCase();
    
    if (criticalPatterns.some(p => patternSource.includes(p.toLowerCase()))) {
      return 'critical';
    } else if (highPatterns.some(p => patternSource.includes(p.toLowerCase()))) {
      return 'high';
    } else {
      return 'medium';
    }
  }

  /**
   * Get threat description
   */
  getThreatDescription(pattern) {
    const descriptions = {
      '<script': 'Script injection attempt',
      'javascript:': 'JavaScript URL injection',
      'on\\w+\\s*=': 'Event handler injection',
      '<iframe': 'Iframe injection attempt',
      'eval\\(': 'Code evaluation attempt',
      'document\\.': 'DOM manipulation attempt',
      'window\\.': 'Window object access attempt'
    };
    
    const patternSource = pattern.source;
    for (const [key, description] of Object.entries(descriptions)) {
      if (patternSource.includes(key)) {
        return description;
      }
    }
    
    return 'Potential XSS pattern detected';
  }

  /**
   * Preserve gaming mentions in content
   */
  preserveGamingMentions(content) {
    // Preserve @player mentions
    content = content.replace(
      /@([a-zA-Z0-9_-]+)/g,
      '<span class="gaming-mention player-mention" data-mention-type="player" data-player-id="$1">@$1</span>'
    );
    
    // Preserve #tournament hashtags
    content = content.replace(
      /#([a-zA-Z0-9_-]+)/g,
      '<span class="gaming-mention tournament-mention" data-mention-type="tournament">##$1</span>'
    );
    
    return content;
  }

  /**
   * Generate cache key for content
   */
  generateCacheKey(content, contentType) {
    const crypto = require('crypto');
    return crypto
      .createHash('md5')
      .update(`${content}-${contentType}`)
      .digest('hex');
  }

  /**
   * Cache cleaned content result
   */
  cacheResult(key, result) {
    if (this.cache.size >= this.config.PERFORMANCE.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      ...result,
      cachedAt: Date.now()
    });
  }

  /**
   * Setup cache cleanup interval
   */
  setupCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      const ttl = this.config.PERFORMANCE.cacheTTL * 1000;
      
      for (const [key, value] of this.cache.entries()) {
        if (now - value.cachedAt > ttl) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Cleanup every minute
  }

  /**
   * Update protection metrics
   */
  updateMetrics(startTime, threatDetected, contentSanitized) {
    const processingTime = Date.now() - startTime;
    
    this.metrics.totalProcessed++;
    if (threatDetected) {
      this.metrics.threatsBlocked++;
    }
    if (contentSanitized) {
      this.metrics.contentSanitized++;
    }
    
    // Update average processing time
    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime * (this.metrics.totalProcessed - 1) + processingTime) / 
      this.metrics.totalProcessed;
  }

  /**
   * Get protection statistics
   */
  getStatistics() {
    return {
      ...this.metrics,
      cacheSize: this.cache.size,
      threatBlockRate: this.metrics.totalProcessed > 0 ? 
        (this.metrics.threatsBlocked / this.metrics.totalProcessed * 100).toFixed(2) + '%' : '0%',
      sanitizationRate: this.metrics.totalProcessed > 0 ? 
        (this.metrics.contentSanitized / this.metrics.totalProcessed * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * Clear protection cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Test XSS protection with common gaming attack vectors
   */
  runSecurityTest() {
    const testVectors = [
      '<script>alert("XSS in gaming chat")</script>',
      '<img src="x" onerror="alert(\'Gaming profile XSS\')">',
      'javascript:alert("Clan description XSS")',
      '<iframe src="javascript:alert(\'Tournament XSS\')"></iframe>',
      '@player<script>alert("Mention XSS")</script>',
      '#tournament<img src=x onerror=alert("Hashtag XSS")>'
    ];
    
    const results = testVectors.map(vector => {
      const result = this.protectGamingContent(vector, 'test');
      return {
        input: vector,
        output: result.content,
        threatsDetected: result.threats.length,
        blocked: result.threats.length > 0
      };
    });
    
    return {
      totalTests: testVectors.length,
      threatsBlocked: results.filter(r => r.blocked).length,
      results
    };
  }
}

/**
 * Create gaming XSS protection instance
 */
export const createGamingXSSProtection = (options = {}) => {
  return new GamingXSSProtection(options);
};

/**
 * Default gaming platform XSS protection
 */
export const gamingXSSProtection = createGamingXSSProtection();

/**
 * Quick XSS protection function for gaming content
 */
export const protectGamingContent = (content, contentType = 'general') => {
  return gamingXSSProtection.protectGamingContent(content, contentType);
};

export default {
  GamingXSSProtection,
  createGamingXSSProtection,
  gamingXSSProtection,
  protectGamingContent,
  XSS_CONFIG,
  GAMING_XSS_PATTERNS
};