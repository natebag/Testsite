/**
 * Gaming Content Filter System for MLG.clan Platform
 * 
 * Advanced content filtering system specifically designed for gaming communities
 * with support for gaming terminology, competitive language, and community moderation.
 * 
 * Features:
 * - Gaming-aware profanity filtering
 * - Competitive gaming language preservation
 * - Tournament and clan content moderation
 * - Real-time chat filtering with gaming context
 * - Community-driven moderation tools
 * 
 * @author Claude Code - Security & Performance Auditor
 * @version 1.0.0
 * @created 2025-08-12
 */

/**
 * Gaming content filtering configuration
 */
const GAMING_FILTER_CONFIG = {
  // Filtering levels
  LEVELS: {
    STRICT: 'strict',        // High security, blocks more content
    MODERATE: 'moderate',    // Balanced filtering for gaming communities
    LENIENT: 'lenient',      // Minimal filtering, preserves gaming culture
    COMPETITIVE: 'competitive' // Tournament-focused filtering
  },
  
  // Gaming context awareness
  CONTEXT: {
    enableGamingTerms: true,
    preserveCompetitive: true,
    allowTrashTalk: false,    // Controlled competitive banter
    enableMentions: true,
    enableHashtags: true
  },
  
  // Community moderation
  MODERATION: {
    enableCommunityReports: true,
    autoModerateSpam: true,
    enableUserBlocking: true,
    escalateToHuman: true
  },
  
  // Performance settings
  PERFORMANCE: {
    enableCaching: true,
    cacheSize: 10000,
    cacheTTL: 3600
  }
};

/**
 * Gaming terminology and language patterns
 */
const GAMING_LANGUAGE = {
  // Competitive gaming terms (preserve these)
  competitiveTerms: [
    'gg', 'glhf', 'wp', 'nt', 'ez', 'clutch', 'ace', 'frag',
    'respawn', 'spawn', 'camp', 'rush', 'strat', 'meta',
    'buff', 'nerf', 'op', 'broken', 'balanced', 'rekt',
    'pwned', 'owned', 'dominated', 'outplayed', 'carried',
    'feeding', 'griefing', 'trolling', 'smurfing'
  ],
  
  // Gaming abbreviations
  abbreviations: [
    'fps', 'rts', 'moba', 'mmo', 'rpg', 'fps',
    'pve', 'pvp', 'npc', 'ai', 'bot', 'afk',
    'brb', 'gtg', 'imo', 'imho', 'tbh', 'rn'
  ],
  
  // Platform-specific terms
  platformTerms: [
    'clan', 'guild', 'team', 'squad', 'party',
    'tournament', 'bracket', 'match', 'round',
    'leaderboard', 'ranking', 'score', 'points',
    'vote', 'burn', 'stake', 'token', 'nft'
  ],
  
  // Emotional expressions (gaming context)
  emotionalExpressions: [
    'hype', 'tilted', 'salty', 'toxic', 'wholesome',
    'poggers', 'pog', 'kappa', 'lul', 'omegalul'
  ]
};

/**
 * Content filtering patterns
 */
const FILTER_PATTERNS = {
  // Inappropriate content patterns (basic examples for demonstration)
  inappropriate: {
    mild: [
      /\bsuck\b/gi,
      /\bstupid\b/gi,
      /\bidiot\b/gi
    ],
    moderate: [
      /\bdumb(ass)?\b/gi,
      /\bcrap\b/gi
    ],
    severe: [
      // More serious patterns would go here
      // This is a demonstration system focusing on defensive security
    ]
  },
  
  // Spam detection patterns
  spam: [
    /(.)\1{10,}/g,           // Repeated characters
    /[A-Z]{20,}/g,           // Excessive capitals
    /(.{1,10})\1{5,}/g,      // Repeated phrases
    /(free|cheap|buy).*(coins?|tokens?|nft)/gi,
    /join.*(discord|telegram).*(free|prize)/gi,
    /(click|visit).*(link|url|site)/gi
  ],
  
  // Personal information patterns
  personalInfo: [
    /\b\d{3}-?\d{3}-?\d{4}\b/g,    // Phone numbers
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
    /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g // Credit card patterns
  ],
  
  // Scam detection patterns
  scams: [
    /(give|send).*(password|private.?key|seed.?phrase)/gi,
    /(double|triple).*(coins?|tokens?|crypto)/gi,
    /admin.*(verify|confirm).*(wallet|account)/gi,
    /(urgent|limited.?time).*(offer|deal|giveaway)/gi
  ]
};

/**
 * Main Gaming Content Filter Class
 */
export class GamingContentFilter {
  constructor(options = {}) {
    this.config = { ...GAMING_FILTER_CONFIG, ...options };
    this.cache = new Map();
    this.userReports = new Map();
    this.moderationQueue = [];
    this.stats = {
      totalFiltered: 0,
      spamBlocked: 0,
      inappropriateBlocked: 0,
      scamsBlocked: 0,
      personalInfoBlocked: 0,
      falsePositives: 0,
      communityReports: 0
    };
    
    this.initializeFilter();
  }

  /**
   * Initialize the content filter
   */
  initializeFilter() {
    // Compile regex patterns for performance
    this.compiledPatterns = {
      inappropriate: this.compilePatternSets(FILTER_PATTERNS.inappropriate),
      spam: FILTER_PATTERNS.spam,
      personalInfo: FILTER_PATTERNS.personalInfo,
      scams: FILTER_PATTERNS.scams
    };
    
    // Create gaming terms lookup for fast checking
    this.gamingTermsSet = new Set([
      ...GAMING_LANGUAGE.competitiveTerms,
      ...GAMING_LANGUAGE.abbreviations,
      ...GAMING_LANGUAGE.platformTerms,
      ...GAMING_LANGUAGE.emotionalExpressions
    ].map(term => term.toLowerCase()));
    
    this.setupCacheCleanup();
  }

  /**
   * Compile pattern sets into single regex
   */
  compilePatternSets(patternSets) {
    const compiled = {};
    for (const [level, patterns] of Object.entries(patternSets)) {
      compiled[level] = new RegExp(
        patterns.map(p => p.source).join('|'),
        'gi'
      );
    }
    return compiled;
  }

  /**
   * Filter gaming content with context awareness
   */
  filterContent(content, context = {}) {
    const startTime = Date.now();
    
    try {
      if (!content || typeof content !== 'string') {
        return {
          filtered: '',
          isClean: true,
          warnings: [],
          blocked: false,
          confidence: 1.0
        };
      }
      
      // Check cache first
      const cacheKey = this.generateCacheKey(content, context);
      if (this.config.PERFORMANCE.enableCaching && this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }
      
      const {
        contentType = 'general',
        filterLevel = GAMING_FILTER_CONFIG.LEVELS.MODERATE,
        userId = null,
        tournamentMode = false,
        clanContext = false
      } = context;
      
      let filtered = content;
      const warnings = [];
      let blocked = false;
      let confidence = 1.0;
      
      // Step 1: Check for gaming terms to preserve context
      const gamingContext = this.analyzeGamingContext(content);
      
      // Step 2: Check for scams and security threats (highest priority)
      const scamCheck = this.checkScams(filtered);
      if (scamCheck.detected) {
        warnings.push(...scamCheck.warnings);
        filtered = scamCheck.filtered;
        blocked = scamCheck.shouldBlock;
        this.stats.scamsBlocked++;
      }
      
      // Step 3: Check for personal information
      const personalInfoCheck = this.checkPersonalInfo(filtered);
      if (personalInfoCheck.detected) {
        warnings.push(...personalInfoCheck.warnings);
        filtered = personalInfoCheck.filtered;
        this.stats.personalInfoBlocked++;
      }
      
      // Step 4: Spam detection
      const spamCheck = this.checkSpam(filtered, gamingContext);
      if (spamCheck.detected) {
        warnings.push(...spamCheck.warnings);
        filtered = spamCheck.filtered;
        if (spamCheck.shouldBlock) {
          blocked = true;
          this.stats.spamBlocked++;
        }
      }
      
      // Step 5: Inappropriate content filtering (context-aware)
      if (!blocked) {
        const inappropriateCheck = this.checkInappropriate(
          filtered, 
          filterLevel, 
          gamingContext,
          { tournamentMode, clanContext }
        );
        
        if (inappropriateCheck.detected) {
          warnings.push(...inappropriateCheck.warnings);
          filtered = inappropriateCheck.filtered;
          confidence = inappropriateCheck.confidence;
          if (inappropriateCheck.shouldBlock) {
            blocked = true;
            this.stats.inappropriateBlocked++;
          }
        }
      }
      
      const result = {
        original: content,
        filtered,
        isClean: warnings.length === 0,
        warnings,
        blocked,
        confidence,
        gamingContext,
        processingTime: Date.now() - startTime,
        contentType,
        filterLevel
      };
      
      // Cache the result
      if (this.config.PERFORMANCE.enableCaching) {
        this.cacheResult(cacheKey, result);
      }
      
      this.stats.totalFiltered++;
      return result;
      
    } catch (error) {
      console.error('Content filtering error:', error);
      return {
        filtered: '',
        isClean: false,
        warnings: ['Filtering error occurred'],
        blocked: true,
        confidence: 0.0,
        error: error.message
      };
    }
  }

  /**
   * Analyze gaming context in content
   */
  analyzeGamingContext(content) {
    const words = content.toLowerCase().split(/\s+/);
    const gamingTerms = words.filter(word => this.gamingTermsSet.has(word));
    
    return {
      hasGamingTerms: gamingTerms.length > 0,
      gamingTerms,
      gamingScore: gamingTerms.length / words.length,
      isCompetitive: this.isCompetitiveContent(content),
      isPlatformSpecific: this.isPlatformSpecific(content),
      emotionalTone: this.analyzeEmotionalTone(content)
    };
  }

  /**
   * Check if content is competitive gaming related
   */
  isCompetitiveContent(content) {
    const competitiveIndicators = [
      'tournament', 'bracket', 'match', 'vs', 'versus',
      'win', 'lose', 'victory', 'defeat', 'score',
      'rank', 'ranking', 'leaderboard', 'champion'
    ];
    
    const lowerContent = content.toLowerCase();
    return competitiveIndicators.some(indicator => 
      lowerContent.includes(indicator)
    );
  }

  /**
   * Check if content is platform-specific
   */
  isPlatformSpecific(content) {
    const platformIndicators = [
      'mlg', 'clan', 'vote', 'burn', 'token',
      'wallet', 'phantom', 'solana', 'nft'
    ];
    
    const lowerContent = content.toLowerCase();
    return platformIndicators.some(indicator => 
      lowerContent.includes(indicator)
    );
  }

  /**
   * Analyze emotional tone of gaming content
   */
  analyzeEmotionalTone(content) {
    const positiveTerms = ['gg', 'wp', 'glhf', 'nice', 'good', 'awesome', 'amazing'];
    const negativeTerms = ['ez', 'rekt', 'owned', 'trash', 'bad', 'terrible'];
    const neutralTerms = ['strat', 'meta', 'build', 'team', 'play'];
    
    const lowerContent = content.toLowerCase();
    const positive = positiveTerms.filter(term => lowerContent.includes(term)).length;
    const negative = negativeTerms.filter(term => lowerContent.includes(term)).length;
    const neutral = neutralTerms.filter(term => lowerContent.includes(term)).length;
    
    if (positive > negative) return 'positive';
    if (negative > positive) return 'negative';
    return 'neutral';
  }

  /**
   * Check for scams and security threats
   */
  checkScams(content) {
    const detected = [];
    let filtered = content;
    
    for (const pattern of this.compiledPatterns.scams) {
      const matches = content.match(pattern);
      if (matches) {
        detected.push({
          type: 'scam',
          pattern: pattern.source,
          matches,
          severity: 'critical'
        });
        // Block scam content entirely
        filtered = '[BLOCKED: Potential scam content detected]';
      }
    }
    
    return {
      detected: detected.length > 0,
      warnings: detected.map(d => `Scam pattern detected: ${d.type}`),
      filtered,
      shouldBlock: detected.length > 0
    };
  }

  /**
   * Check for personal information
   */
  checkPersonalInfo(content) {
    const detected = [];
    let filtered = content;
    
    for (const pattern of this.compiledPatterns.personalInfo) {
      const matches = content.match(pattern);
      if (matches) {
        detected.push({
          type: 'personal_info',
          pattern: pattern.source,
          matches
        });
        // Replace personal info with placeholders
        filtered = filtered.replace(pattern, '[REDACTED]');
      }
    }
    
    return {
      detected: detected.length > 0,
      warnings: detected.map(d => `Personal information redacted: ${d.type}`),
      filtered
    };
  }

  /**
   * Check for spam content
   */
  checkSpam(content, gamingContext) {
    const detected = [];
    let filtered = content;
    
    for (const pattern of this.compiledPatterns.spam) {
      const matches = content.match(pattern);
      if (matches) {
        // Check if it's legitimate gaming repetition (like "GGGGGG")
        const isGamingRepetition = this.isLegitimateGamingRepetition(matches[0], gamingContext);
        
        if (!isGamingRepetition) {
          detected.push({
            type: 'spam',
            pattern: pattern.source,
            matches,
            severity: 'medium'
          });
        }
      }
    }
    
    return {
      detected: detected.length > 0,
      warnings: detected.map(d => `Spam pattern detected: ${d.type}`),
      filtered,
      shouldBlock: detected.length > 2 // Block if multiple spam patterns
    };
  }

  /**
   * Check if repetition is legitimate gaming expression
   */
  isLegitimateGamingRepetition(text, gamingContext) {
    const gamingRepetitions = ['gg', 'lol', 'omg', 'wow', 'nice'];
    const lowerText = text.toLowerCase();
    
    return gamingRepetitions.some(term => 
      lowerText.includes(term.repeat(2))
    ) && gamingContext.hasGamingTerms;
  }

  /**
   * Check for inappropriate content with gaming context
   */
  checkInappropriate(content, filterLevel, gamingContext, contextOptions = {}) {
    const detected = [];
    let filtered = content;
    let confidence = 1.0;
    
    const patterns = this.getInappropriatePatterns(filterLevel);
    
    for (const [level, pattern] of Object.entries(patterns)) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          // Check if it's acceptable in gaming context
          const isAcceptableGaming = this.isAcceptableInGamingContext(
            match, 
            gamingContext, 
            contextOptions
          );
          
          if (!isAcceptableGaming) {
            detected.push({
              type: 'inappropriate',
              level,
              match,
              severity: this.getSeverityForLevel(level)
            });
            
            // Replace with gaming-appropriate alternative
            const replacement = this.getGamingReplacement(match);
            filtered = filtered.replace(new RegExp(match, 'gi'), replacement);
            confidence *= 0.8; // Reduce confidence for each replacement
          }
        }
      }
    }
    
    return {
      detected: detected.length > 0,
      warnings: detected.map(d => `Inappropriate content filtered: ${d.level}`),
      filtered,
      confidence,
      shouldBlock: detected.some(d => d.severity === 'high')
    };
  }

  /**
   * Get inappropriate patterns based on filter level
   */
  getInappropriatePatterns(filterLevel) {
    switch (filterLevel) {
      case GAMING_FILTER_CONFIG.LEVELS.STRICT:
        return this.compiledPatterns.inappropriate;
      case GAMING_FILTER_CONFIG.LEVELS.MODERATE:
        return {
          moderate: this.compiledPatterns.inappropriate.moderate,
          severe: this.compiledPatterns.inappropriate.severe
        };
      case GAMING_FILTER_CONFIG.LEVELS.LENIENT:
        return {
          severe: this.compiledPatterns.inappropriate.severe
        };
      case GAMING_FILTER_CONFIG.LEVELS.COMPETITIVE:
        // Even more lenient for competitive gaming
        return {};
      default:
        return this.compiledPatterns.inappropriate;
    }
  }

  /**
   * Check if content is acceptable in gaming context
   */
  isAcceptableInGamingContext(text, gamingContext, contextOptions) {
    const lowerText = text.toLowerCase();
    
    // Tournament mode is more strict
    if (contextOptions.tournamentMode) {
      return false;
    }
    
    // Some competitive terms are acceptable
    if (gamingContext.isCompetitive && gamingContext.emotionalTone !== 'negative') {
      const competitiveAcceptable = ['trash', 'destroyed', 'owned'];
      return competitiveAcceptable.includes(lowerText);
    }
    
    return false;
  }

  /**
   * Get gaming-appropriate replacement for filtered content
   */
  getGamingReplacement(text) {
    const replacements = {
      'stupid': 'newbie',
      'idiot': 'player',
      'suck': 'need practice',
      'trash': 'learning',
      'dumb': 'inexperienced'
    };
    
    return replacements[text.toLowerCase()] || '[filtered]';
  }

  /**
   * Get severity level for inappropriate content level
   */
  getSeverityForLevel(level) {
    const severityMap = {
      mild: 'low',
      moderate: 'medium',
      severe: 'high'
    };
    return severityMap[level] || 'medium';
  }

  /**
   * Generate cache key
   */
  generateCacheKey(content, context) {
    const crypto = require('crypto');
    const contextString = JSON.stringify(context);
    return crypto
      .createHash('md5')
      .update(`${content}-${contextString}`)
      .digest('hex');
  }

  /**
   * Cache result
   */
  cacheResult(key, result) {
    if (this.cache.size >= this.config.PERFORMANCE.cacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      ...result,
      cachedAt: Date.now()
    });
  }

  /**
   * Setup cache cleanup
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
    }, 60000);
  }

  /**
   * Report content by community
   */
  reportContent(content, reportedBy, reason) {
    const reportId = `report_${Date.now()}_${reportedBy}`;
    
    this.userReports.set(reportId, {
      content,
      reportedBy,
      reason,
      timestamp: new Date().toISOString(),
      status: 'pending'
    });
    
    this.stats.communityReports++;
    
    // Add to moderation queue if multiple reports
    this.addToModerationQueue(content, reportId);
    
    return reportId;
  }

  /**
   * Add content to moderation queue
   */
  addToModerationQueue(content, reportId) {
    const existingEntry = this.moderationQueue.find(entry => entry.content === content);
    
    if (existingEntry) {
      existingEntry.reports.push(reportId);
      existingEntry.reportCount++;
    } else {
      this.moderationQueue.push({
        content,
        reports: [reportId],
        reportCount: 1,
        addedAt: Date.now(),
        priority: 'normal'
      });
    }
    
    // Sort by report count and priority
    this.moderationQueue.sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      return b.reportCount - a.reportCount;
    });
  }

  /**
   * Get filter statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      moderationQueueSize: this.moderationQueue.length,
      pendingReports: this.userReports.size,
      filterEfficiency: this.stats.totalFiltered > 0 ? 
        ((this.stats.totalFiltered - this.stats.falsePositives) / this.stats.totalFiltered * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * Clear all caches and reset
   */
  reset() {
    this.cache.clear();
    this.userReports.clear();
    this.moderationQueue = [];
    this.stats = {
      totalFiltered: 0,
      spamBlocked: 0,
      inappropriateBlocked: 0,
      scamsBlocked: 0,
      personalInfoBlocked: 0,
      falsePositives: 0,
      communityReports: 0
    };
  }
}

/**
 * Create gaming content filter instance
 */
export const createGamingContentFilter = (options = {}) => {
  return new GamingContentFilter(options);
};

/**
 * Default gaming content filter
 */
export const gamingContentFilter = createGamingContentFilter();

export default {
  GamingContentFilter,
  createGamingContentFilter,
  gamingContentFilter,
  GAMING_FILTER_CONFIG,
  GAMING_LANGUAGE,
  FILTER_PATTERNS
};