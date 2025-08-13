/**
 * Input Sanitization and XSS Protection System - Main Entry Point
 * MLG.clan Gaming Platform Security Suite
 * 
 * Comprehensive input validation and content security system designed for
 * gaming platforms with Web3 integration, user-generated content, and 
 * real-time gaming communications.
 * 
 * Main Components:
 * - Input validation for gaming content
 * - XSS protection with gaming-specific rules  
 * - Gaming-aware content filtering
 * - Web3 transaction security
 * - Real-time chat protection
 * 
 * @author Claude Code - Security & Performance Auditor
 * @version 1.0.0
 * @created 2025-08-12
 */

// Core validation and sanitization
export {
  GamingInputValidator,
  createGamingValidator,
  gamingValidator,
  VALIDATION_CONFIG,
  GAMING_FILTERS
} from './input-validator.js';

// XSS protection system
export {
  GamingXSSProtection,
  createGamingXSSProtection,
  gamingXSSProtection,
  protectGamingContent,
  XSS_CONFIG,
  GAMING_XSS_PATTERNS
} from './xss-protection.js';

// Gaming content filtering
export {
  GamingContentFilter,
  createGamingContentFilter,
  gamingContentFilter,
  GAMING_FILTER_CONFIG,
  GAMING_LANGUAGE,
  FILTER_PATTERNS
} from './gaming-content-filter.js';

/**
 * Unified Gaming Security System
 * Combines all input sanitization and content security components
 */
export class UnifiedGamingSecuritySystem {
  constructor(options = {}) {
    const {
      validationOptions = {},
      xssOptions = {},
      filterOptions = {}
    } = options;
    
    // Initialize all security components
    this.validator = createGamingValidator(validationOptions);
    this.xssProtection = createGamingXSSProtection(xssOptions);
    this.contentFilter = createGamingContentFilter(filterOptions);
    
    // Unified statistics
    this.stats = {
      totalProcessed: 0,
      validationBlocked: 0,
      xssBlocked: 0,
      contentFiltered: 0,
      averageProcessingTime: 0,
      startTime: Date.now()
    };
  }

  /**
   * Comprehensive content security processing
   * Runs all security checks in sequence for maximum protection
   */
  async processContent(content, context = {}) {
    const startTime = Date.now();
    
    try {
      const {
        contentType = 'general',
        userId = null,
        sessionId = null,
        ipAddress = null,
        userAgent = null,
        tournamentMode = false,
        clanContext = false,
        strictMode = false
      } = context;

      // Step 1: Input validation
      let validationResult;
      switch (contentType) {
        case 'username':
          validationResult = this.validator.validateUsername(content);
          break;
        case 'clan':
          validationResult = this.validator.validateClanInfo(typeof content === 'string' ? {name: content} : content);
          break;
        case 'wallet':
          validationResult = this.validator.validateWalletAddress(content, context.network);
          break;
        case 'chat':
          validationResult = this.validator.validateChatMessage(content, userId);
          break;
        default:
          validationResult = { isValid: true, sanitized: content };
      }

      if (!validationResult.isValid) {
        this.updateStats(startTime, 'validation');
        return {
          success: false,
          stage: 'validation',
          error: validationResult.error || 'Validation failed',
          content: '',
          originalContent: content,
          processingTime: Date.now() - startTime
        };
      }

      // Step 2: XSS protection
      const xssResult = this.xssProtection.protectGamingContent(
        validationResult.sanitized || content,
        contentType
      );

      if (!xssResult.isClean && strictMode) {
        this.updateStats(startTime, 'xss');
        return {
          success: false,
          stage: 'xss',
          error: 'Content contains potential XSS threats',
          threats: xssResult.threats,
          content: '',
          originalContent: content,
          processingTime: Date.now() - startTime
        };
      }

      // Step 3: Content filtering
      const filterResult = this.contentFilter.filterContent(
        xssResult.content,
        {
          contentType,
          userId,
          tournamentMode,
          clanContext,
          filterLevel: strictMode ? 'strict' : 'moderate'
        }
      );

      if (filterResult.blocked && strictMode) {
        this.updateStats(startTime, 'filter');
        return {
          success: false,
          stage: 'filter',
          error: 'Content blocked by content filter',
          warnings: filterResult.warnings,
          content: '',
          originalContent: content,
          processingTime: Date.now() - startTime
        };
      }

      // Success - content passed all security checks
      this.updateStats(startTime, 'success');
      
      return {
        success: true,
        content: filterResult.filtered,
        originalContent: content,
        security: {
          validation: validationResult,
          xss: xssResult,
          filter: filterResult
        },
        metadata: {
          contentType,
          userId,
          sessionId,
          ipAddress,
          userAgent,
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Gaming security processing error:', error);
      this.updateStats(startTime, 'error');
      
      return {
        success: false,
        stage: 'system',
        error: 'Security processing error occurred',
        content: '',
        originalContent: content,
        processingTime: Date.now() - startTime,
        systemError: error.message
      };
    }
  }

  /**
   * Quick security check for real-time gaming content
   * Optimized for low latency gaming applications
   */
  quickSecurityCheck(content, contentType = 'chat') {
    const startTime = Date.now();
    
    try {
      // Basic XSS check only for speed
      const xssResult = this.xssProtection.protectGamingContent(content, contentType);
      
      return {
        isSecure: xssResult.isClean,
        content: xssResult.content,
        threats: xssResult.threats,
        processingTime: Date.now() - startTime
      };
      
    } catch (error) {
      return {
        isSecure: false,
        content: '',
        threats: ['Processing error'],
        processingTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Batch process multiple content items
   * Useful for bulk content moderation
   */
  async batchProcess(contentItems, defaultContext = {}) {
    const results = [];
    const batchStartTime = Date.now();
    
    for (let i = 0; i < contentItems.length; i++) {
      const item = contentItems[i];
      const content = typeof item === 'string' ? item : item.content;
      const context = typeof item === 'object' ? { ...defaultContext, ...item.context } : defaultContext;
      
      const result = await this.processContent(content, context);
      results.push({
        index: i,
        ...result
      });
    }
    
    return {
      results,
      summary: {
        total: contentItems.length,
        successful: results.filter(r => r.success).length,
        blocked: results.filter(r => !r.success).length,
        totalProcessingTime: Date.now() - batchStartTime,
        averageProcessingTime: (Date.now() - batchStartTime) / contentItems.length
      }
    };
  }

  /**
   * Get comprehensive security statistics
   */
  getSecurityStatistics() {
    const uptime = Date.now() - this.stats.startTime;
    
    return {
      system: {
        ...this.stats,
        uptime,
        successRate: this.stats.totalProcessed > 0 ? 
          ((this.stats.totalProcessed - this.stats.validationBlocked - this.stats.xssBlocked - this.stats.contentFiltered) / 
           this.stats.totalProcessed * 100).toFixed(2) + '%' : '0%'
      },
      validation: this.validator.getStatistics(),
      xss: this.xssProtection.getStatistics(),
      filter: this.contentFilter.getStatistics()
    };
  }

  /**
   * Run comprehensive security test suite
   */
  async runSecurityTests() {
    const testResults = {
      validation: await this.testValidation(),
      xss: this.xssProtection.runSecurityTest(),
      filter: await this.testContentFilter(),
      integration: await this.testIntegration()
    };
    
    const totalTests = Object.values(testResults).reduce((sum, result) => sum + (result.totalTests || 0), 0);
    const passedTests = Object.values(testResults).reduce((sum, result) => sum + (result.passedTests || result.threatsBlocked || 0), 0);
    
    return {
      overall: {
        totalTests,
        passedTests,
        successRate: totalTests > 0 ? (passedTests / totalTests * 100).toFixed(2) + '%' : '0%'
      },
      ...testResults
    };
  }

  /**
   * Test validation system
   */
  async testValidation() {
    const testCases = [
      { input: 'ValidUser123', type: 'username', shouldPass: true },
      { input: 'Invalid@User!', type: 'username', shouldPass: false },
      { input: 'TooLongUsernameExceedsMaximumLength12345', type: 'username', shouldPass: false },
      { input: '11111111111111111111111111111111', type: 'wallet', shouldPass: true },
      { input: 'invalid-wallet', type: 'wallet', shouldPass: false }
    ];
    
    let passed = 0;
    const results = [];
    
    for (const testCase of testCases) {
      let result;
      switch (testCase.type) {
        case 'username':
          result = this.validator.validateUsername(testCase.input);
          break;
        case 'wallet':
          result = this.validator.validateWalletAddress(testCase.input);
          break;
        default:
          result = { isValid: false };
      }
      
      const success = result.isValid === testCase.shouldPass;
      if (success) passed++;
      
      results.push({
        input: testCase.input,
        type: testCase.type,
        expected: testCase.shouldPass,
        actual: result.isValid,
        success
      });
    }
    
    return {
      totalTests: testCases.length,
      passedTests: passed,
      results
    };
  }

  /**
   * Test content filter system
   */
  async testContentFilter() {
    const testCases = [
      { input: 'gg wp great game everyone!', shouldBlock: false },
      { input: 'Join my discord for free tokens!', shouldBlock: true },
      { input: 'You are trash at this game', shouldBlock: false }, // Gaming context
      { input: 'AAAAAAAAAAAAAAAAAAAAAA', shouldBlock: true } // Spam
    ];
    
    let passed = 0;
    const results = [];
    
    for (const testCase of testCases) {
      const result = this.contentFilter.filterContent(testCase.input);
      const success = result.blocked === testCase.shouldBlock;
      if (success) passed++;
      
      results.push({
        input: testCase.input,
        expected: testCase.shouldBlock,
        actual: result.blocked,
        success
      });
    }
    
    return {
      totalTests: testCases.length,
      passedTests: passed,
      results
    };
  }

  /**
   * Test integration between all security components
   */
  async testIntegration() {
    const testCases = [
      {
        content: 'Hey @player123, gg on that clutch play! #tournament',
        context: { contentType: 'chat', tournamentMode: true },
        shouldSucceed: true
      },
      {
        content: '<script>alert("xss")</script>Send me your private keys for free tokens!',
        context: { contentType: 'chat', strictMode: true },
        shouldSucceed: false
      },
      {
        content: 'MLGPlayer2024',
        context: { contentType: 'username' },
        shouldSucceed: true
      }
    ];
    
    let passed = 0;
    const results = [];
    
    for (const testCase of testCases) {
      const result = await this.processContent(testCase.content, testCase.context);
      const success = result.success === testCase.shouldSucceed;
      if (success) passed++;
      
      results.push({
        content: testCase.content,
        context: testCase.context,
        expected: testCase.shouldSucceed,
        actual: result.success,
        success
      });
    }
    
    return {
      totalTests: testCases.length,
      passedTests: passed,
      results
    };
  }

  /**
   * Update system statistics
   */
  updateStats(startTime, stage) {
    const processingTime = Date.now() - startTime;
    
    this.stats.totalProcessed++;
    
    switch (stage) {
      case 'validation':
        this.stats.validationBlocked++;
        break;
      case 'xss':
        this.stats.xssBlocked++;
        break;
      case 'filter':
        this.stats.contentFiltered++;
        break;
    }
    
    // Update average processing time
    this.stats.averageProcessingTime = 
      (this.stats.averageProcessingTime * (this.stats.totalProcessed - 1) + processingTime) / 
      this.stats.totalProcessed;
  }

  /**
   * Reset all system components
   */
  reset() {
    this.validator.clearCache();
    this.xssProtection.clearCache();
    this.contentFilter.reset();
    
    this.stats = {
      totalProcessed: 0,
      validationBlocked: 0,
      xssBlocked: 0,
      contentFiltered: 0,
      averageProcessingTime: 0,
      startTime: Date.now()
    };
  }
}

/**
 * Create unified gaming security system instance
 */
export const createGamingSecuritySystem = (options = {}) => {
  return new UnifiedGamingSecuritySystem(options);
};

/**
 * Default gaming platform security system
 */
export const gamingSecuritySystem = createGamingSecuritySystem();

/**
 * Quick utility functions for common use cases
 */
export const securityUtils = {
  // Quick chat message security check
  secureChatMessage: async (message, userId) => {
    return await gamingSecuritySystem.processContent(message, {
      contentType: 'chat',
      userId,
      strictMode: false
    });
  },
  
  // Quick username validation
  validateUsername: (username) => {
    return gamingValidator.validateUsername(username);
  },
  
  // Quick wallet address validation
  validateWallet: (address, network = 'solana') => {
    return gamingValidator.validateWalletAddress(address, network);
  },
  
  // Quick XSS protection
  protectContent: (content, type = 'general') => {
    return protectGamingContent(content, type);
  },
  
  // Real-time security check for gaming
  quickCheck: (content, type = 'chat') => {
    return gamingSecuritySystem.quickSecurityCheck(content, type);
  }
};

export default {
  // Main classes
  UnifiedGamingSecuritySystem,
  GamingInputValidator,
  GamingXSSProtection,
  GamingContentFilter,
  
  // Factory functions
  createGamingSecuritySystem,
  createGamingValidator,
  createGamingXSSProtection,
  createGamingContentFilter,
  
  // Default instances
  gamingSecuritySystem,
  gamingValidator,
  gamingXSSProtection,
  gamingContentFilter,
  
  // Utility functions
  securityUtils,
  protectGamingContent
};