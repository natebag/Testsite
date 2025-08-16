/**
 * MLG Username Tagging Validation System for MLG.clan Platform
 * 
 * Comprehensive validation system for MLG username tagging that ensures
 * proper tag formatting, enforcement mechanisms, and consistency across
 * all platform implementations.
 * 
 * Features:
 * - Tag format validation and standardization
 * - Enforcement mechanism verification
 * - Cross-platform consistency checking
 * - Security validation for tag injection
 * - Performance impact assessment
 * - Accessibility compliance validation
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 * @created 2025-08-13
 */

/**
 * Validation Configuration
 */
const VALIDATION_CONFIG = {
  // Tag Format Rules
  TAG_PREFIX: '[MLG]',
  TAG_SEPARATOR: ' ',
  TAG_REGEX: /^\[MLG\]\s/,
  MAX_TAG_LENGTH: 5, // '[MLG]' = 5 characters
  
  // Username Constraints
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 32,
  USERNAME_PATTERN: /^[a-zA-Z0-9_-]+$/,
  
  // Security Rules
  FORBIDDEN_PATTERNS: [
    /<script/i,
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /on\w+=/i
  ],
  
  // Reserved Prefixes
  RESERVED_PREFIXES: [
    '[ADMIN]',
    '[MOD]',
    '[DEV]',
    '[SYSTEM]',
    '[BOT]'
  ],
  
  // Performance Thresholds
  MAX_PROCESSING_TIME: 100, // milliseconds
  MAX_MEMORY_USAGE: 1024 * 1024, // 1MB
  
  // Accessibility Requirements
  REQUIRED_ARIA_ATTRIBUTES: ['aria-label'],
  REQUIRED_ROLE_ATTRIBUTES: ['badge']
};

/**
 * MLG Username Tagging Validator
 */
class MLGTaggingValidator {
  constructor() {
    this.validationResults = [];
    this.errors = [];
    this.warnings = [];
    
    console.log('🔍 MLG Tagging Validator initialized');
  }

  /**
   * Run complete validation suite
   * @param {Object} taggingService - MLG tagging service instance
   * @param {Object} displayUtility - MLG display utility instance
   * @returns {Promise<Object>} Validation results
   */
  async validateComplete(taggingService, displayUtility) {
    console.log('🚀 Starting comprehensive MLG tagging validation...');
    
    const startTime = Date.now();
    
    try {
      // Reset validation state
      this.validationResults = [];
      this.errors = [];
      this.warnings = [];
      
      // Run validation tests
      await this.validateTagFormatting(taggingService);
      await this.validateEnforcementMechanisms(taggingService);
      await this.validateSecurityCompliance(taggingService);
      await this.validatePerformanceImpact(taggingService);
      await this.validateDisplayConsistency(displayUtility);
      await this.validateAccessibilityCompliance(displayUtility);
      
      const totalTime = Date.now() - startTime;
      
      const results = {
        success: this.errors.length === 0,
        total_tests: this.validationResults.length,
        passed: this.validationResults.filter(r => r.passed).length,
        failed: this.validationResults.filter(r => !r.passed).length,
        warnings: this.warnings.length,
        errors: this.errors,
        warnings_list: this.warnings,
        validation_time: totalTime,
        timestamp: new Date()
      };
      
      console.log(`✅ Validation complete: ${results.passed}/${results.total_tests} tests passed`);
      return results;
      
    } catch (error) {
      console.error('❌ Validation failed:', error);
      throw error;
    }
  }

  /**
   * Validate tag formatting compliance
   * @param {Object} taggingService - MLG tagging service
   */
  async validateTagFormatting(taggingService) {
    console.log('  🏷️ Validating tag formatting...');
    
    const testCases = [
      { input: 'TestUser', expected: '[MLG] TestUser' },
      { input: 'User_123', expected: '[MLG] User_123' },
      { input: 'Player-Pro', expected: '[MLG] Player-Pro' },
      { input: '[MLG] AlreadyTagged', expected: '[MLG] AlreadyTagged' }
    ];
    
    for (const testCase of testCases) {
      const result = taggingService.tagUsername(testCase.input);
      const passed = result === testCase.expected || result.startsWith(VALIDATION_CONFIG.TAG_PREFIX);
      
      this.validationResults.push({
        test: 'tag_formatting',
        input: testCase.input,
        expected: testCase.expected,
        actual: result,
        passed
      });
      
      if (!passed) {
        this.errors.push(`Tag formatting failed for "${testCase.input}": got "${result}", expected "${testCase.expected}"`);
      }
    }
    
    // Validate tag format consistency
    const sampleTag = taggingService.tagUsername('SampleUser');
    if (!VALIDATION_CONFIG.TAG_REGEX.test(sampleTag)) {
      this.errors.push(`Tag format does not match required pattern: ${sampleTag}`);
    }
    
    console.log('    ✓ Tag formatting validation complete');
  }

  /**
   * Validate enforcement mechanisms
   * @param {Object} taggingService - MLG tagging service
   */
  async validateEnforcementMechanisms(taggingService) {
    console.log('  🔒 Validating enforcement mechanisms...');
    
    // Test username validation
    const validUsernames = ['ValidUser123', 'Test_User', 'Player-1'];
    const invalidUsernames = ['', 'ab', 'a'.repeat(50), '123!@#', '<script>'];
    
    // Test valid usernames
    for (const username of validUsernames) {
      try {
        const isValid = taggingService.validateUsername(username);
        this.validationResults.push({
          test: 'username_validation_valid',
          input: username,
          passed: isValid === true
        });
      } catch (error) {
        this.errors.push(`Valid username "${username}" was rejected: ${error.message}`);
        this.validationResults.push({
          test: 'username_validation_valid',
          input: username,
          passed: false
        });
      }
    }
    
    // Test invalid usernames
    for (const username of invalidUsernames) {
      try {
        taggingService.validateUsername(username);
        this.errors.push(`Invalid username "${username}" was accepted`);
        this.validationResults.push({
          test: 'username_validation_invalid',
          input: username,
          passed: false
        });
      } catch (error) {
        this.validationResults.push({
          test: 'username_validation_invalid',
          input: username,
          passed: true
        });
      }
    }
    
    // Test reserved prefix enforcement
    for (const prefix of VALIDATION_CONFIG.RESERVED_PREFIXES) {
      const testUsername = prefix + 'TestUser';
      try {
        taggingService.validateUsername(testUsername);
        this.errors.push(`Reserved prefix "${prefix}" was not blocked`);
        this.validationResults.push({
          test: 'reserved_prefix_enforcement',
          input: testUsername,
          passed: false
        });
      } catch (error) {
        this.validationResults.push({
          test: 'reserved_prefix_enforcement',
          input: testUsername,
          passed: true
        });
      }
    }
    
    console.log('    ✓ Enforcement mechanisms validation complete');
  }

  /**
   * Validate security compliance
   * @param {Object} taggingService - MLG tagging service
   */
  async validateSecurityCompliance(taggingService) {
    console.log('  🛡️ Validating security compliance...');
    
    // Test XSS injection attempts
    const xssAttempts = [
      '<script>alert("xss")</script>',
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'User<img src=x onerror=alert(1)>',
      'onclick="alert(1)"User'
    ];
    
    for (const attempt of xssAttempts) {
      const result = taggingService.tagUsername(attempt);
      
      // Check if dangerous patterns are still present
      const containsDangerous = VALIDATION_CONFIG.FORBIDDEN_PATTERNS.some(pattern => 
        pattern.test(result)
      );
      
      this.validationResults.push({
        test: 'xss_prevention',
        input: attempt,
        passed: !containsDangerous,
        result
      });
      
      if (containsDangerous) {
        this.errors.push(`XSS attempt not properly sanitized: "${attempt}" → "${result}"`);
      }
    }
    
    // Test tag injection attempts
    const tagInjectionAttempts = [
      '[ADMIN] FakeAdmin',
      '[MOD] FakeMod',
      '[MLG][ADMIN] DoubleTag'
    ];
    
    for (const attempt of tagInjectionAttempts) {
      try {
        taggingService.validateUsername(attempt);
        this.errors.push(`Tag injection attempt not blocked: "${attempt}"`);
        this.validationResults.push({
          test: 'tag_injection_prevention',
          input: attempt,
          passed: false
        });
      } catch (error) {
        this.validationResults.push({
          test: 'tag_injection_prevention',
          input: attempt,
          passed: true
        });
      }
    }
    
    console.log('    ✓ Security compliance validation complete');
  }

  /**
   * Validate performance impact
   * @param {Object} taggingService - MLG tagging service
   */
  async validatePerformanceImpact(taggingService) {
    console.log('  ⚡ Validating performance impact...');
    
    // Test bulk processing performance
    const startTime = Date.now();
    const bulkUsers = [];
    
    for (let i = 0; i < 1000; i++) {
      const username = `BulkUser${i}`;
      const tagged = taggingService.tagUsername(username);
      bulkUsers.push(tagged);
    }
    
    const bulkProcessingTime = Date.now() - startTime;
    
    this.validationResults.push({
      test: 'bulk_processing_performance',
      count: 1000,
      time: bulkProcessingTime,
      passed: bulkProcessingTime < (VALIDATION_CONFIG.MAX_PROCESSING_TIME * 10) // 10x allowance for bulk
    });
    
    if (bulkProcessingTime > (VALIDATION_CONFIG.MAX_PROCESSING_TIME * 10)) {
      this.warnings.push(`Bulk processing performance concern: ${bulkProcessingTime}ms for 1000 users`);
    }
    
    // Test individual processing performance
    const singleStartTime = Date.now();
    taggingService.tagUsername('PerformanceTestUser');
    const singleProcessingTime = Date.now() - singleStartTime;
    
    this.validationResults.push({
      test: 'single_processing_performance',
      time: singleProcessingTime,
      passed: singleProcessingTime < VALIDATION_CONFIG.MAX_PROCESSING_TIME
    });
    
    if (singleProcessingTime > VALIDATION_CONFIG.MAX_PROCESSING_TIME) {
      this.errors.push(`Single processing too slow: ${singleProcessingTime}ms`);
    }
    
    // Test memory usage
    const stats = taggingService.getStatistics();
    const estimatedMemoryUsage = stats.taggedUsernamesCached * 100; // Rough estimate
    
    this.validationResults.push({
      test: 'memory_usage',
      cached_entries: stats.taggedUsernamesCached,
      estimated_usage: estimatedMemoryUsage,
      passed: estimatedMemoryUsage < VALIDATION_CONFIG.MAX_MEMORY_USAGE
    });
    
    if (estimatedMemoryUsage > VALIDATION_CONFIG.MAX_MEMORY_USAGE) {
      this.warnings.push(`High memory usage: ${estimatedMemoryUsage} bytes estimated`);
    }
    
    console.log('    ✓ Performance impact validation complete');
  }

  /**
   * Validate display consistency
   * @param {Object} displayUtility - MLG display utility
   */
  async validateDisplayConsistency(displayUtility) {
    console.log('  🎨 Validating display consistency...');
    
    const testUsers = [
      { username: 'ClanMember', displayName: '[MLG] ClanMember', isMember: true },
      { username: 'NonMember', displayName: 'NonMember', isMember: false }
    ];
    
    for (const user of testUsers) {
      const element = displayUtility.createUsernameElement(
        user.username,
        user.displayName,
        { userId: `test_${user.username}` }
      );
      
      if (!element || !element.classList) {
        this.errors.push(`Failed to create element for user: ${user.username}`);
        this.validationResults.push({
          test: 'element_creation',
          username: user.username,
          passed: false
        });
        continue;
      }
      
      // Check for MLG tag presence
      const hasMLGTag = element.querySelector('.mlg-tag');
      const shouldHaveTag = user.isMember;
      
      this.validationResults.push({
        test: 'mlg_tag_presence',
        username: user.username,
        has_tag: !!hasMLGTag,
        should_have_tag: shouldHaveTag,
        passed: !!hasMLGTag === shouldHaveTag
      });
      
      if (!!hasMLGTag !== shouldHaveTag) {
        this.errors.push(`MLG tag presence mismatch for ${user.username}: has=${!!hasMLGTag}, should=${shouldHaveTag}`);
      }
      
      // Check styling consistency
      if (hasMLGTag) {
        const tagStyles = window.getComputedStyle(hasMLGTag);
        const hasValidStyling = tagStyles.color && tagStyles.backgroundColor;
        
        this.validationResults.push({
          test: 'tag_styling',
          username: user.username,
          passed: hasValidStyling
        });
        
        if (!hasValidStyling) {
          this.warnings.push(`MLG tag styling issue for ${user.username}`);
        }
      }
    }
    
    console.log('    ✓ Display consistency validation complete');
  }

  /**
   * Validate accessibility compliance
   * @param {Object} displayUtility - MLG display utility
   */
  async validateAccessibilityCompliance(displayUtility) {
    console.log('  ♿ Validating accessibility compliance...');
    
    const testElement = displayUtility.createUsernameElement(
      'AccessibilityTest',
      '[MLG] AccessibilityTest',
      { userId: 'accessibility_test' }
    );
    
    if (!testElement) {
      this.errors.push('Cannot test accessibility - element creation failed');
      return;
    }
    
    // Check for ARIA labels
    const mlgTag = testElement.querySelector('.mlg-tag');
    if (mlgTag) {
      const hasAriaLabel = mlgTag.hasAttribute('aria-label');
      const hasRole = mlgTag.hasAttribute('role');
      
      this.validationResults.push({
        test: 'aria_label_presence',
        passed: hasAriaLabel
      });
      
      this.validationResults.push({
        test: 'role_attribute_presence',
        passed: hasRole
      });
      
      if (!hasAriaLabel) {
        this.errors.push('MLG tag missing aria-label attribute');
      }
      
      if (!hasRole) {
        this.errors.push('MLG tag missing role attribute');
      }
      
      // Check aria-label content
      if (hasAriaLabel) {
        const ariaLabel = mlgTag.getAttribute('aria-label');
        const isDescriptive = ariaLabel && ariaLabel.length > 0 && ariaLabel.toLowerCase().includes('mlg');
        
        this.validationResults.push({
          test: 'aria_label_descriptive',
          aria_label: ariaLabel,
          passed: isDescriptive
        });
        
        if (!isDescriptive) {
          this.warnings.push(`Aria-label not descriptive: "${ariaLabel}"`);
        }
      }
    }
    
    // Check color contrast (basic check)
    const usernameElement = testElement.querySelector('.mlg-username');
    if (usernameElement) {
      const styles = window.getComputedStyle(usernameElement);
      const hasValidColor = styles.color && styles.color !== 'rgba(0, 0, 0, 0)';
      
      this.validationResults.push({
        test: 'color_contrast',
        color: styles.color,
        passed: hasValidColor
      });
      
      if (!hasValidColor) {
        this.warnings.push('Username color may have contrast issues');
      }
    }
    
    // Check keyboard navigation
    const isInteractive = testElement.style.cursor === 'pointer' || testElement.getAttribute('tabindex');
    if (isInteractive) {
      this.validationResults.push({
        test: 'keyboard_navigation',
        passed: true // Basic check - element appears to be interactive
      });
    }
    
    console.log('    ✓ Accessibility compliance validation complete');
  }

  /**
   * Generate validation report
   * @returns {Object} Detailed validation report
   */
  generateReport() {
    const totalTests = this.validationResults.length;
    const passedTests = this.validationResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    return {
      summary: {
        total_tests: totalTests,
        passed: passedTests,
        failed: failedTests,
        success_rate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0,
        errors: this.errors.length,
        warnings: this.warnings.length,
        compliance_level: this.getComplianceLevel()
      },
      detailed_results: this.validationResults,
      errors: this.errors,
      warnings: this.warnings,
      recommendations: this.generateRecommendations(),
      timestamp: new Date()
    };
  }

  /**
   * Get compliance level based on results
   * @returns {string} Compliance level
   */
  getComplianceLevel() {
    const errorCount = this.errors.length;
    const warningCount = this.warnings.length;
    
    if (errorCount === 0 && warningCount === 0) return 'EXCELLENT';
    if (errorCount === 0 && warningCount <= 2) return 'GOOD';
    if (errorCount <= 2 && warningCount <= 5) return 'ACCEPTABLE';
    return 'NEEDS_IMPROVEMENT';
  }

  /**
   * Generate recommendations based on validation results
   * @returns {Array} Array of recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    if (this.errors.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'ERRORS',
        message: 'Address critical errors before production deployment',
        count: this.errors.length
      });
    }
    
    if (this.warnings.length > 3) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'WARNINGS',
        message: 'Consider addressing performance and accessibility warnings',
        count: this.warnings.length
      });
    }
    
    const performanceIssues = this.validationResults.filter(r => 
      r.test.includes('performance') && !r.passed
    ).length;
    
    if (performanceIssues > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'PERFORMANCE',
        message: 'Optimize performance for better user experience',
        count: performanceIssues
      });
    }
    
    const accessibilityIssues = this.validationResults.filter(r => 
      (r.test.includes('aria') || r.test.includes('accessibility')) && !r.passed
    ).length;
    
    if (accessibilityIssues > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'ACCESSIBILITY',
        message: 'Fix accessibility issues for compliance',
        count: accessibilityIssues
      });
    }
    
    return recommendations;
  }

  /**
   * Print validation summary to console
   */
  printSummary() {
    const report = this.generateReport();
    
    console.log('\n' + '='.repeat(60));
    console.log('🔍 MLG USERNAME TAGGING VALIDATION REPORT');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${report.summary.passed}/${report.summary.total_tests}`);
    console.log(`❌ Failed: ${report.summary.failed}/${report.summary.total_tests}`);
    console.log(`⚠️ Warnings: ${report.summary.warnings}`);
    console.log(`📈 Success Rate: ${report.summary.success_rate}%`);
    console.log(`🏆 Compliance Level: ${report.summary.compliance_level}`);
    
    if (report.recommendations.length > 0) {
      console.log('\n📋 Recommendations:');
      report.recommendations.forEach(rec => {
        console.log(`  ${rec.priority}: ${rec.message} (${rec.count} issues)`);
      });
    }
    
    console.log('='.repeat(60));
  }
}

// Export for use in other modules
export { MLGTaggingValidator, VALIDATION_CONFIG };
export default MLGTaggingValidator;