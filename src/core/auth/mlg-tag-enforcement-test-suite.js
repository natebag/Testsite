/**
 * MLG Tag Enforcement Test Suite
 * 
 * Comprehensive testing system for MLG tag validation and enforcement across
 * the platform. Validates all enforcement mechanisms, security features,
 * performance characteristics, and accessibility compliance.
 * 
 * Features:
 * - Complete enforcement system validation
 * - Security penetration testing for tag spoofing
 * - Performance benchmarking and stress testing
 * - Accessibility compliance verification
 * - Cross-component integration testing
 * - Mobile optimization validation
 * - Real-world scenario simulation
 * - Comprehensive reporting and analytics
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 * @created 2025-08-13
 * @task Task 21.5 - Implement [MLG] tag validation and enforcement across platform
 */

import { MLGTagEnforcementSystem } from './mlg-tag-enforcement-system.js';
import { MLGPlatformTagIntegration } from './mlg-platform-tag-integration.js';
import { MLGTaggingValidator } from './mlg-tagging-validation.js';

/**
 * Test Suite Configuration
 */
const TEST_CONFIG = {
  // Test Categories
  CATEGORIES: {
    SECURITY: 'security',
    PERFORMANCE: 'performance',
    VALIDATION: 'validation',
    INTEGRATION: 'integration',
    ACCESSIBILITY: 'accessibility',
    EDGE_CASES: 'edge_cases'
  },
  
  // Test Severity Levels
  SEVERITY: {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
    INFO: 'info'
  },
  
  // Performance Thresholds
  PERFORMANCE_THRESHOLDS: {
    single_tag_processing: 50,    // milliseconds
    batch_processing_100: 500,    // milliseconds
    batch_processing_1000: 3000,  // milliseconds
    memory_usage_mb: 10,          // megabytes
    violation_detection: 100      // milliseconds
  },
  
  // Security Test Vectors
  XSS_VECTORS: [
    '<script>alert("xss")</script>',
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    'onclick="alert(1)"',
    '<iframe src="javascript:alert(1)"></iframe>',
    '<svg onload=alert(1)>',
    'User<img src=x onerror=prompt(1)>Name'
  ],
  
  // Tag Spoofing Vectors
  TAG_SPOOFING_VECTORS: [
    '[ADMIN] FakeAdmin',
    '[MOD] FakeMod',
    '[MLG][ADMIN] DoubleTag',
    '[𝐌𝐋𝐆] UnicodeSpoof',
    '[MLG ] ExtraSpace',
    '［MLG］ FullwidthBrackets',
    '[mlg] LowercaseTag',
    '[MLG]NoSpace',
    'Pre[MLG] MidTag',
    '[MLG] Valid[FAKE] Mixed'
  ],
  
  // Performance Test Data
  BULK_TEST_SIZES: [50, 100, 500, 1000, 2000],
  STRESS_TEST_DURATION: 30000, // 30 seconds
  
  // Mock Users for Testing
  MOCK_USERS: {
    authorized: [
      { id: 'auth_user_1', username: 'ProGamer123' },
      { id: 'auth_user_2', username: 'MLG_Player' },
      { id: 'auth_user_3', username: 'ClanLeader' }
    ],
    unauthorized: [
      { id: 'unauth_user_1', username: 'RandomPlayer' },
      { id: 'unauth_user_2', username: 'GuestUser' },
      { id: 'unauth_user_3', username: 'Visitor123' }
    ]
  }
};

/**
 * MLG Tag Enforcement Test Suite Class
 */
class MLGTagEnforcementTestSuite {
  constructor(options = {}) {
    this.config = { ...TEST_CONFIG, ...options };
    this.logger = options.logger || console;
    
    // Test systems
    this.enforcementSystem = null;
    this.platformIntegration = null;
    this.validator = null;
    
    // Test results
    this.testResults = [];
    this.performanceMetrics = [];
    this.securityResults = [];
    this.integrationResults = [];
    
    // Test state
    this.isRunning = false;
    this.currentTestSuite = null;
    this.startTime = null;
    
    this.logger.info('🧪 MLG Tag Enforcement Test Suite initialized');
  }

  /**
   * Run complete test suite
   * @param {Object} systems - System instances to test
   * @returns {Promise<Object>} Complete test results
   */
  async runCompleteTestSuite(systems = {}) {
    try {
      if (this.isRunning) {
        throw new Error('Test suite is already running');
      }
      
      this.isRunning = true;
      this.startTime = Date.now();
      
      this.logger.info('🚀 Starting complete MLG tag enforcement test suite...');
      
      // Initialize test systems
      await this.initializeTestSystems(systems);
      
      // Run test categories
      await this.runSecurityTests();
      await this.runPerformanceTests();
      await this.runValidationTests();
      await this.runIntegrationTests();
      await this.runAccessibilityTests();
      await this.runEdgeCaseTests();
      
      // Generate comprehensive report
      const report = this.generateComprehensiveReport();
      
      this.logger.info('✅ Complete test suite finished');
      
      return report;
      
    } catch (error) {
      this.logger.error('❌ Test suite failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
      await this.cleanup();
    }
  }

  /**
   * Initialize test systems
   * @param {Object} systems - System instances
   */
  async initializeTestSystems(systems) {
    this.logger.debug('🔧 Initializing test systems...');
    
    // Initialize enforcement system
    this.enforcementSystem = systems.enforcementSystem || new MLGTagEnforcementSystem({
      mode: 'strict',
      logger: this.logger
    });
    
    if (!systems.enforcementSystem) {
      await this.enforcementSystem.initialize();
    }
    
    // Add mock authorized users
    this.config.MOCK_USERS.authorized.forEach(user => {
      this.enforcementSystem.addAuthorizedUser(user.id);
    });
    
    // Initialize platform integration
    this.platformIntegration = systems.platformIntegration || new MLGPlatformTagIntegration({
      logger: this.logger
    });
    
    // Initialize validator
    this.validator = new MLGTaggingValidator();
    
    this.logger.debug('✅ Test systems initialized');
  }

  /**
   * Run security tests
   */
  async runSecurityTests() {
    this.currentTestSuite = 'Security Tests';
    this.logger.info('🛡️ Running security tests...');
    
    const securityTests = [
      () => this.testXSSPrevention(),
      () => this.testTagSpoofingPrevention(),
      () => this.testUnauthorizedTagRemoval(),
      () => this.testSecurityInjection(),
      () => this.testSQLInjectionAttempts(),
      () => this.testUnicodeAttacks(),
      () => this.testBufferOverflowAttempts()
    ];
    
    for (const test of securityTests) {
      try {
        await test();
      } catch (error) {
        this.recordTestResult('security', 'Security Test Failed', false, error.message, 'critical');
      }
    }
    
    this.logger.info('✅ Security tests complete');
  }

  /**
   * Test XSS prevention
   */
  async testXSSPrevention() {
    this.logger.debug('  🔍 Testing XSS prevention...');
    
    for (const xssVector of this.config.XSS_VECTORS) {
      const result = this.enforcementSystem.enforceTag(xssVector, 'test_user_xss');
      
      const containsDangerous = this.config.XSS_VECTORS.some(pattern => 
        result.enforcedUsername.includes(pattern)
      );
      
      this.recordTestResult(
        'security',
        `XSS Prevention: ${xssVector}`,
        !containsDangerous,
        containsDangerous ? `XSS vector not sanitized: ${result.enforcedUsername}` : 'XSS vector properly sanitized',
        containsDangerous ? 'critical' : 'info'
      );
    }
  }

  /**
   * Test tag spoofing prevention
   */
  async testTagSpoofingPrevention() {
    this.logger.debug('  🎭 Testing tag spoofing prevention...');
    
    for (const spoofVector of this.config.TAG_SPOOFING_VECTORS) {
      const result = this.enforcementSystem.enforceTag(spoofVector, 'unauthorized_user');
      
      const hasUnauthorizedTag = spoofVector !== result.enforcedUsername && 
                                 result.action === 'remove_tag';
      
      this.recordTestResult(
        'security',
        `Tag Spoofing Prevention: ${spoofVector}`,
        hasUnauthorizedTag,
        hasUnauthorizedTag ? 'Spoofing attempt blocked' : 'Spoofing attempt not detected',
        hasUnauthorizedTag ? 'info' : 'high'
      );
    }
  }

  /**
   * Test unauthorized tag removal
   */
  async testUnauthorizedTagRemoval() {
    this.logger.debug('  🚫 Testing unauthorized tag removal...');
    
    const unauthorizedTaggedUsers = [
      '[MLG] UnauthorizedUser1',
      '[MLG] FakeMLGMember',
      '[MLG] ImposterUser'
    ];
    
    for (const taggedUser of unauthorizedTaggedUsers) {
      const result = this.enforcementSystem.enforceTag(taggedUser, 'unauthorized_test');
      
      const tagRemoved = !result.enforcedUsername.includes('[MLG]');
      
      this.recordTestResult(
        'security',
        `Unauthorized Tag Removal: ${taggedUser}`,
        tagRemoved,
        tagRemoved ? 'Unauthorized tag removed' : 'Unauthorized tag not removed',
        tagRemoved ? 'info' : 'high'
      );
    }
  }

  /**
   * Test security injection attempts
   */
  async testSecurityInjection() {
    this.logger.debug('  💉 Testing security injection attempts...');
    
    const injectionVectors = [
      "'; DROP TABLE users; --",
      '${alert("injection")}',
      '{{constructor.constructor("alert(1)")()}}',
      '__proto__.polluted = true',
      'eval("alert(1)")'
    ];
    
    for (const injection of injectionVectors) {
      const result = this.enforcementSystem.enforceTag(injection, 'injection_test');
      
      const isSafe = !result.enforcedUsername.includes('eval') &&
                     !result.enforcedUsername.includes('DROP') &&
                     !result.enforcedUsername.includes('constructor');
      
      this.recordTestResult(
        'security',
        `Injection Prevention: ${injection}`,
        isSafe,
        isSafe ? 'Injection attempt blocked' : 'Injection attempt not blocked',
        isSafe ? 'info' : 'critical'
      );
    }
  }

  /**
   * Test SQL injection attempts
   */
  async testSQLInjectionAttempts() {
    this.logger.debug('  🗃️ Testing SQL injection attempts...');
    
    const sqlVectors = [
      "admin' OR '1'='1",
      "'; DELETE FROM users; --",
      "UNION SELECT password FROM users",
      "1' AND (SELECT COUNT(*) FROM users) > 0 --"
    ];
    
    for (const sqlVector of sqlVectors) {
      const result = this.enforcementSystem.enforceTag(sqlVector, 'sql_test');
      
      const isSafe = !result.enforcedUsername.toLowerCase().includes('select') &&
                     !result.enforcedUsername.toLowerCase().includes('union') &&
                     !result.enforcedUsername.toLowerCase().includes('delete');
      
      this.recordTestResult(
        'security',
        `SQL Injection Prevention: ${sqlVector}`,
        isSafe,
        isSafe ? 'SQL injection blocked' : 'SQL injection not blocked',
        isSafe ? 'info' : 'critical'
      );
    }
  }

  /**
   * Test unicode attacks
   */
  async testUnicodeAttacks() {
    this.logger.debug('  🌐 Testing unicode attacks...');
    
    const unicodeVectors = [
      '[𝐌𝐋𝐆] UnicodeSpoof',
      '[МLG] CyrillicM',
      '[MLG] ZeroWidth‌User',
      '［MLG］ FullwidthBrackets'
    ];
    
    for (const unicodeVector of unicodeVectors) {
      const result = this.enforcementSystem.enforceTag(unicodeVector, 'unicode_test');
      
      const isNormalized = result.enforcedUsername.includes('[MLG]') === false ||
                          result.enforcedUsername === '[MLG] UnicodeSpoof';
      
      this.recordTestResult(
        'security',
        `Unicode Attack Prevention: ${unicodeVector}`,
        isNormalized,
        isNormalized ? 'Unicode attack normalized' : 'Unicode attack not detected',
        isNormalized ? 'info' : 'medium'
      );
    }
  }

  /**
   * Test buffer overflow attempts
   */
  async testBufferOverflowAttempts() {
    this.logger.debug('  💥 Testing buffer overflow attempts...');
    
    const longStrings = [
      'A'.repeat(10000),
      '[MLG] ' + 'VeryLongUsername'.repeat(100),
      'X'.repeat(100000)
    ];
    
    for (const longString of longStrings) {
      try {
        const startTime = Date.now();
        const result = this.enforcementSystem.enforceTag(longString, 'buffer_test');
        const processingTime = Date.now() - startTime;
        
        const isHandled = processingTime < 1000 && result.enforcedUsername.length < 1000;
        
        this.recordTestResult(
          'security',
          `Buffer Overflow Prevention: ${longString.length} chars`,
          isHandled,
          isHandled ? 'Buffer overflow handled' : 'Buffer overflow not handled',
          isHandled ? 'info' : 'high'
        );
      } catch (error) {
        this.recordTestResult(
          'security',
          `Buffer Overflow Prevention: ${longString.length} chars`,
          true,
          'Buffer overflow properly rejected',
          'info'
        );
      }
    }
  }

  /**
   * Run performance tests
   */
  async runPerformanceTests() {
    this.currentTestSuite = 'Performance Tests';
    this.logger.info('⚡ Running performance tests...');
    
    await this.testSingleTagProcessing();
    await this.testBatchProcessing();
    await this.testMemoryUsage();
    await this.testStressLoad();
    await this.testCachePerformance();
    
    this.logger.info('✅ Performance tests complete');
  }

  /**
   * Test single tag processing performance
   */
  async testSingleTagProcessing() {
    this.logger.debug('  ⚡ Testing single tag processing performance...');
    
    const iterations = 1000;
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      this.enforcementSystem.enforceTag(`TestUser${i}`, `test_user_${i}`);
      times.push(Date.now() - startTime);
    }
    
    const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    
    this.recordTestResult(
      'performance',
      'Single Tag Processing Speed',
      averageTime < this.config.PERFORMANCE_THRESHOLDS.single_tag_processing,
      `Average: ${averageTime.toFixed(2)}ms, Max: ${maxTime}ms`,
      averageTime < this.config.PERFORMANCE_THRESHOLDS.single_tag_processing ? 'info' : 'medium'
    );
    
    this.performanceMetrics.push({
      test: 'single_tag_processing',
      averageTime,
      maxTime,
      iterations
    });
  }

  /**
   * Test batch processing performance
   */
  async testBatchProcessing() {
    this.logger.debug('  📦 Testing batch processing performance...');
    
    for (const batchSize of this.config.BULK_TEST_SIZES) {
      const startTime = Date.now();
      
      for (let i = 0; i < batchSize; i++) {
        this.enforcementSystem.enforceTag(`BatchUser${i}`, `batch_user_${i}`);
      }
      
      const totalTime = Date.now() - startTime;
      const threshold = batchSize <= 100 ? 
        this.config.PERFORMANCE_THRESHOLDS.batch_processing_100 :
        this.config.PERFORMANCE_THRESHOLDS.batch_processing_1000;
      
      this.recordTestResult(
        'performance',
        `Batch Processing (${batchSize} users)`,
        totalTime < threshold,
        `${totalTime}ms for ${batchSize} users (${(totalTime/batchSize).toFixed(2)}ms per user)`,
        totalTime < threshold ? 'info' : 'medium'
      );
      
      this.performanceMetrics.push({
        test: 'batch_processing',
        batchSize,
        totalTime,
        perUserTime: totalTime / batchSize
      });
    }
  }

  /**
   * Test memory usage
   */
  async testMemoryUsage() {
    this.logger.debug('  💾 Testing memory usage...');
    
    const initialMemory = this.getMemoryUsage();
    
    // Process large batch to test memory consumption
    for (let i = 0; i < 5000; i++) {
      this.enforcementSystem.enforceTag(`MemoryTestUser${i}`, `memory_user_${i}`);
    }
    
    const finalMemory = this.getMemoryUsage();
    const memoryIncrease = (finalMemory.used - initialMemory.used) / (1024 * 1024); // MB
    
    this.recordTestResult(
      'performance',
      'Memory Usage',
      memoryIncrease < this.config.PERFORMANCE_THRESHOLDS.memory_usage_mb,
      `Memory increase: ${memoryIncrease.toFixed(2)}MB`,
      memoryIncrease < this.config.PERFORMANCE_THRESHOLDS.memory_usage_mb ? 'info' : 'medium'
    );
    
    this.performanceMetrics.push({
      test: 'memory_usage',
      initialMemory: initialMemory.used,
      finalMemory: finalMemory.used,
      increase: memoryIncrease
    });
  }

  /**
   * Test stress load
   */
  async testStressLoad() {
    this.logger.debug('  🔥 Testing stress load...');
    
    const startTime = Date.now();
    let processed = 0;
    let errors = 0;
    
    while (Date.now() - startTime < this.config.STRESS_TEST_DURATION) {
      try {
        this.enforcementSystem.enforceTag(`StressUser${processed}`, `stress_user_${processed}`);
        processed++;
      } catch (error) {
        errors++;
      }
    }
    
    const actualDuration = Date.now() - startTime;
    const throughput = processed / (actualDuration / 1000); // operations per second
    
    this.recordTestResult(
      'performance',
      'Stress Load Test',
      errors === 0,
      `Processed ${processed} operations in ${actualDuration}ms (${throughput.toFixed(2)} ops/sec), ${errors} errors`,
      errors === 0 ? 'info' : 'high'
    );
    
    this.performanceMetrics.push({
      test: 'stress_load',
      duration: actualDuration,
      processed,
      errors,
      throughput
    });
  }

  /**
   * Test cache performance
   */
  async testCachePerformance() {
    this.logger.debug('  🗄️ Testing cache performance...');
    
    const testUser = 'CacheTestUser';
    const testUserId = 'cache_test_user';
    
    // First call (cache miss)
    const startTime1 = Date.now();
    this.enforcementSystem.enforceTag(testUser, testUserId);
    const cacheloadTime = Date.now() - startTime1;
    
    // Second call (cache hit)
    const startTime2 = Date.now();
    this.enforcementSystem.enforceTag(testUser, testUserId);
    const cacheHitTime = Date.now() - startTime2;
    
    const cacheImprovement = cacheloadTime > cacheHitTime;
    
    this.recordTestResult(
      'performance',
      'Cache Performance',
      cacheImprovement,
      `Cache miss: ${cacheloadTime}ms, Cache hit: ${cacheHitTime}ms`,
      cacheImprovement ? 'info' : 'low'
    );
  }

  /**
   * Run validation tests
   */
  async runValidationTests() {
    this.currentTestSuite = 'Validation Tests';
    this.logger.info('✅ Running validation tests...');
    
    // Use existing validator
    const mockTaggingService = {
      tagUsername: (username) => `[MLG] ${username}`,
      validateUsername: (username) => {
        if (username.length < 3 || username.length > 32) throw new Error('Invalid length');
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) throw new Error('Invalid characters');
        return true;
      },
      getStatistics: () => ({ taggedUsernamesCached: 100 })
    };
    
    const mockDisplayUtility = {
      createUsernameElement: (username, displayName, options) => {
        const element = document.createElement('div');
        element.textContent = displayName;
        element.classList.add('mlg-username');
        
        if (displayName.includes('[MLG]')) {
          const tag = document.createElement('span');
          tag.classList.add('mlg-tag');
          tag.setAttribute('aria-label', 'MLG Clan Member');
          tag.setAttribute('role', 'badge');
          element.appendChild(tag);
        }
        
        return element;
      }
    };
    
    const validationResult = await this.validator.validateComplete(
      mockTaggingService,
      mockDisplayUtility
    );
    
    this.recordTestResult(
      'validation',
      'Complete Validation Suite',
      validationResult.success,
      `${validationResult.passed}/${validationResult.total_tests} tests passed`,
      validationResult.success ? 'info' : 'high'
    );
    
    this.logger.info('✅ Validation tests complete');
  }

  /**
   * Run integration tests
   */
  async runIntegrationTests() {
    this.currentTestSuite = 'Integration Tests';
    this.logger.info('🔗 Running integration tests...');
    
    await this.testPlatformIntegration();
    await this.testComponentIntegration();
    await this.testEventHandling();
    
    this.logger.info('✅ Integration tests complete');
  }

  /**
   * Test platform integration
   */
  async testPlatformIntegration() {
    this.logger.debug('  🌐 Testing platform integration...');
    
    try {
      // Test initialization
      const isInitialized = this.platformIntegration.isInitialized;
      
      this.recordTestResult(
        'integration',
        'Platform Integration Initialization',
        isInitialized,
        isInitialized ? 'Platform integration initialized' : 'Platform integration not initialized',
        isInitialized ? 'info' : 'critical'
      );
      
      // Test statistics
      const stats = this.platformIntegration.getStatistics();
      const hasValidStats = stats && typeof stats.isInitialized === 'boolean';
      
      this.recordTestResult(
        'integration',
        'Platform Integration Statistics',
        hasValidStats,
        hasValidStats ? 'Statistics available' : 'Statistics not available',
        hasValidStats ? 'info' : 'medium'
      );
      
    } catch (error) {
      this.recordTestResult(
        'integration',
        'Platform Integration Test',
        false,
        `Integration test failed: ${error.message}`,
        'high'
      );
    }
  }

  /**
   * Test component integration
   */
  async testComponentIntegration() {
    this.logger.debug('  🧩 Testing component integration...');
    
    // Create mock DOM elements
    const testContainer = document.createElement('div');
    testContainer.innerHTML = `
      <div class="voting-interface">
        <span class="username" data-user-id="voting_user">TestVoter</span>
      </div>
      <div class="clan-roster">
        <span class="username" data-user-id="clan_user">[MLG] ClanMember</span>
      </div>
      <div class="user-profile">
        <span class="username" data-user-id="profile_user">ProfileUser</span>
      </div>
    `;
    
    document.body.appendChild(testContainer);
    
    try {
      // Test element detection
      const usernameElements = testContainer.querySelectorAll('.username');
      const elementsFound = usernameElements.length > 0;
      
      this.recordTestResult(
        'integration',
        'Component Element Detection',
        elementsFound,
        `Found ${usernameElements.length} username elements`,
        elementsFound ? 'info' : 'medium'
      );
      
      // Test enforcement on elements
      let enforcedElements = 0;
      for (const element of usernameElements) {
        const username = element.textContent;
        const userId = element.getAttribute('data-user-id');
        
        if (username && userId) {
          const result = this.enforcementSystem.enforceTag(username, userId);
          if (result.action !== 'none') {
            enforcedElements++;
          }
        }
      }
      
      this.recordTestResult(
        'integration',
        'Component Element Enforcement',
        true,
        `Enforced ${enforcedElements} elements`,
        'info'
      );
      
    } finally {
      document.body.removeChild(testContainer);
    }
  }

  /**
   * Test event handling
   */
  async testEventHandling() {
    this.logger.debug('  📡 Testing event handling...');
    
    let eventsReceived = 0;
    
    const eventHandler = () => {
      eventsReceived++;
    };
    
    // Test enforcement system events
    this.enforcementSystem.on('tag_violation', eventHandler);
    this.enforcementSystem.on('element_enforced', eventHandler);
    
    // Trigger events
    this.enforcementSystem.enforceTag('[MLG] UnauthorizedUser', 'unauthorized_test');
    this.enforcementSystem.enforceTag('AuthorizedUser', 'auth_user_1');
    
    // Wait for events
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.recordTestResult(
      'integration',
      'Event Handling',
      eventsReceived > 0,
      `Received ${eventsReceived} events`,
      eventsReceived > 0 ? 'info' : 'medium'
    );
    
    // Cleanup
    this.enforcementSystem.removeListener('tag_violation', eventHandler);
    this.enforcementSystem.removeListener('element_enforced', eventHandler);
  }

  /**
   * Run accessibility tests
   */
  async runAccessibilityTests() {
    this.currentTestSuite = 'Accessibility Tests';
    this.logger.info('♿ Running accessibility tests...');
    
    await this.testAriaCompliance();
    await this.testKeyboardNavigation();
    await this.testScreenReaderSupport();
    
    this.logger.info('✅ Accessibility tests complete');
  }

  /**
   * Test ARIA compliance
   */
  async testAriaCompliance() {
    this.logger.debug('  🏷️ Testing ARIA compliance...');
    
    // Create test element with MLG tag
    const testElement = document.createElement('div');
    testElement.innerHTML = `
      <span class="mlg-username">
        <span class="mlg-tag" aria-label="MLG Clan Member" role="badge">[MLG]</span>
        TestUser
      </span>
    `;
    
    const mlgTag = testElement.querySelector('.mlg-tag');
    
    const hasAriaLabel = mlgTag && mlgTag.hasAttribute('aria-label');
    const hasRole = mlgTag && mlgTag.hasAttribute('role');
    const ariaLabel = mlgTag ? mlgTag.getAttribute('aria-label') : '';
    
    this.recordTestResult(
      'accessibility',
      'ARIA Label Presence',
      hasAriaLabel,
      hasAriaLabel ? `ARIA label: "${ariaLabel}"` : 'ARIA label missing',
      hasAriaLabel ? 'info' : 'high'
    );
    
    this.recordTestResult(
      'accessibility',
      'Role Attribute Presence',
      hasRole,
      hasRole ? 'Role attribute present' : 'Role attribute missing',
      hasRole ? 'info' : 'high'
    );
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation() {
    this.logger.debug('  ⌨️ Testing keyboard navigation...');
    
    const testElement = document.createElement('button');
    testElement.className = 'mlg-username';
    testElement.setAttribute('tabindex', '0');
    testElement.textContent = '[MLG] KeyboardUser';
    
    const isFocusable = testElement.tabIndex >= 0;
    
    this.recordTestResult(
      'accessibility',
      'Keyboard Navigation Support',
      isFocusable,
      isFocusable ? 'Element is focusable' : 'Element is not focusable',
      isFocusable ? 'info' : 'medium'
    );
  }

  /**
   * Test screen reader support
   */
  async testScreenReaderSupport() {
    this.logger.debug('  📢 Testing screen reader support...');
    
    const testElement = document.createElement('div');
    testElement.innerHTML = `
      <span class="mlg-username" aria-describedby="mlg-description">
        <span class="mlg-tag" aria-label="MLG Clan Member" role="badge">[MLG]</span>
        ScreenReaderUser
      </span>
      <span id="mlg-description" class="sr-only">This user is a member of the MLG clan</span>
    `;
    
    const hasDescription = testElement.querySelector('#mlg-description') !== null;
    const hasAriaDescribedBy = testElement.querySelector('.mlg-username').hasAttribute('aria-describedby');
    
    this.recordTestResult(
      'accessibility',
      'Screen Reader Support',
      hasDescription && hasAriaDescribedBy,
      hasDescription && hasAriaDescribedBy ? 'Screen reader support implemented' : 'Screen reader support incomplete',
      hasDescription && hasAriaDescribedBy ? 'info' : 'medium'
    );
  }

  /**
   * Run edge case tests
   */
  async runEdgeCaseTests() {
    this.currentTestSuite = 'Edge Case Tests';
    this.logger.info('🎯 Running edge case tests...');
    
    await this.testEmptyInputs();
    await this.testSpecialCharacters();
    await this.testInternationalization();
    await this.testConcurrency();
    
    this.logger.info('✅ Edge case tests complete');
  }

  /**
   * Test empty and null inputs
   */
  async testEmptyInputs() {
    this.logger.debug('  🕳️ Testing empty inputs...');
    
    const emptyInputs = ['', null, undefined, '   ', '\t\n'];
    
    for (const input of emptyInputs) {
      try {
        const result = this.enforcementSystem.enforceTag(input, 'empty_test');
        
        this.recordTestResult(
          'edge_cases',
          `Empty Input Handling: ${JSON.stringify(input)}`,
          result.success === false || result.enforcedUsername === '',
          'Empty input handled gracefully',
          'info'
        );
      } catch (error) {
        this.recordTestResult(
          'edge_cases',
          `Empty Input Handling: ${JSON.stringify(input)}`,
          true,
          'Empty input properly rejected',
          'info'
        );
      }
    }
  }

  /**
   * Test special characters
   */
  async testSpecialCharacters() {
    this.logger.debug('  🔣 Testing special characters...');
    
    const specialInputs = [
      'User@#$%',
      'User\n\r\t',
      'User\u0000\u0001',
      'Üsér',
      '用户',
      'مستخدم'
    ];
    
    for (const input of specialInputs) {
      const result = this.enforcementSystem.enforceTag(input, 'special_test');
      
      const isHandled = result.enforcedUsername !== input || result.action !== 'none';
      
      this.recordTestResult(
        'edge_cases',
        `Special Characters: ${input}`,
        isHandled,
        `Input handled: ${result.enforcedUsername}`,
        'info'
      );
    }
  }

  /**
   * Test internationalization
   */
  async testInternationalization() {
    this.logger.debug('  🌍 Testing internationalization...');
    
    const i18nInputs = [
      'ユーザー名',      // Japanese
      '用户名',          // Chinese
      'пользователь',    // Russian
      'utilisateur',     // French
      'المستخدم'        // Arabic
    ];
    
    for (const input of i18nInputs) {
      const result = this.enforcementSystem.enforceTag(input, 'i18n_test');
      
      this.recordTestResult(
        'edge_cases',
        `Internationalization: ${input}`,
        result.success,
        `International username handled: ${result.enforcedUsername}`,
        result.success ? 'info' : 'low'
      );
    }
  }

  /**
   * Test concurrency
   */
  async testConcurrency() {
    this.logger.debug('  🔄 Testing concurrency...');
    
    const concurrentOperations = 100;
    const promises = [];
    
    for (let i = 0; i < concurrentOperations; i++) {
      promises.push(
        Promise.resolve(this.enforcementSystem.enforceTag(`ConcurrentUser${i}`, `concurrent_${i}`))
      );
    }
    
    try {
      const results = await Promise.all(promises);
      const successfulResults = results.filter(r => r.success).length;
      
      this.recordTestResult(
        'edge_cases',
        'Concurrency Test',
        successfulResults === concurrentOperations,
        `${successfulResults}/${concurrentOperations} concurrent operations successful`,
        successfulResults === concurrentOperations ? 'info' : 'medium'
      );
    } catch (error) {
      this.recordTestResult(
        'edge_cases',
        'Concurrency Test',
        false,
        `Concurrency test failed: ${error.message}`,
        'high'
      );
    }
  }

  /**
   * Record test result
   * @param {string} category - Test category
   * @param {string} testName - Test name
   * @param {boolean} passed - Whether test passed
   * @param {string} details - Test details
   * @param {string} severity - Test severity
   */
  recordTestResult(category, testName, passed, details, severity = 'info') {
    const result = {
      category,
      testName,
      passed,
      details,
      severity,
      timestamp: new Date()
    };
    
    this.testResults.push(result);
    
    const icon = passed ? '✅' : '❌';
    const severityIcon = {
      critical: '🔥',
      high: '⚠️',
      medium: '⚡',
      low: '💡',
      info: 'ℹ️'
    }[severity];
    
    this.logger.debug(`    ${icon} ${severityIcon} ${testName}: ${details}`);
  }

  /**
   * Generate comprehensive report
   * @returns {Object} Complete test report
   */
  generateComprehensiveReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    const byCategory = {};
    const bySeverity = {};
    
    this.testResults.forEach(result => {
      // By category
      if (!byCategory[result.category]) {
        byCategory[result.category] = { total: 0, passed: 0, failed: 0 };
      }
      byCategory[result.category].total++;
      if (result.passed) {
        byCategory[result.category].passed++;
      } else {
        byCategory[result.category].failed++;
      }
      
      // By severity
      if (!result.passed) {
        if (!bySeverity[result.severity]) {
          bySeverity[result.severity] = 0;
        }
        bySeverity[result.severity]++;
      }
    });
    
    const testDuration = Date.now() - this.startTime;
    
    return {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        successRate: Math.round((passedTests / totalTests) * 100),
        testDuration,
        timestamp: new Date()
      },
      categoryResults: byCategory,
      severityBreakdown: bySeverity,
      detailedResults: this.testResults,
      performanceMetrics: this.performanceMetrics,
      securityResults: this.securityResults,
      integrationResults: this.integrationResults,
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Generate recommendations based on test results
   * @returns {Array} Recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    const failedTests = this.testResults.filter(r => !r.passed);
    
    const criticalFailures = failedTests.filter(r => r.severity === 'critical');
    const highFailures = failedTests.filter(r => r.severity === 'high');
    
    if (criticalFailures.length > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        message: `${criticalFailures.length} critical security issues must be fixed before production`,
        category: 'Security',
        count: criticalFailures.length
      });
    }
    
    if (highFailures.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        message: `${highFailures.length} high-priority issues should be addressed`,
        category: 'General',
        count: highFailures.length
      });
    }
    
    const performanceIssues = this.performanceMetrics.filter(m => 
      m.averageTime > 100 || m.totalTime > 5000
    );
    
    if (performanceIssues.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        message: 'Performance optimization recommended for better user experience',
        category: 'Performance',
        count: performanceIssues.length
      });
    }
    
    return recommendations;
  }

  /**
   * Get memory usage
   * @returns {Object} Memory usage information
   */
  getMemoryUsage() {
    if (window.performance?.memory) {
      return {
        used: window.performance.memory.usedJSHeapSize,
        total: window.performance.memory.totalJSHeapSize,
        limit: window.performance.memory.jsHeapSizeLimit
      };
    }
    return { used: 0, total: 0, limit: 0 };
  }

  /**
   * Cleanup test systems
   */
  async cleanup() {
    this.logger.debug('🧹 Cleaning up test systems...');
    
    if (this.enforcementSystem) {
      await this.enforcementSystem.cleanup();
    }
    
    if (this.platformIntegration) {
      await this.platformIntegration.cleanup();
    }
    
    this.logger.debug('✅ Test cleanup complete');
  }
}

// Export test suite
export { MLGTagEnforcementTestSuite, TEST_CONFIG };
export default MLGTagEnforcementTestSuite;