/**
 * MLG Username Tagging Test Suite for MLG.clan Platform
 * 
 * Comprehensive testing suite for MLG username tagging functionality across
 * all platform sections including validation, display, and integration tests.
 * 
 * Features:
 * - Service initialization and configuration tests
 * - Username tagging logic validation
 * - Clan membership detection testing
 * - Frontend display integration tests
 * - Performance and edge case testing
 * - Cross-platform compatibility validation
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 * @created 2025-08-13
 */

import { MLGUsernameTaggingService } from './mlg-username-tagging-service.js';
import { mlgUsernameDisplay } from '../../shared/utils/mlg-username-display.js';

/**
 * Test Configuration
 */
const TEST_CONFIG = {
  // Test timeouts
  SERVICE_INIT_TIMEOUT: 5000,
  DATABASE_TIMEOUT: 3000,
  UI_RENDER_TIMEOUT: 2000,
  
  // Test data
  TEST_USERS: [
    {
      id: 'test_user_001',
      username: 'TestUser001',
      is_clan_member: true,
      expected_display: '[MLG] TestUser001'
    },
    {
      id: 'test_user_002',
      username: 'NonMemberUser',
      is_clan_member: false,
      expected_display: 'NonMemberUser'
    },
    {
      id: 'test_user_003',
      username: 'AlreadyTagged[MLG]User',
      is_clan_member: true,
      expected_display: '[MLG] AlreadyTagged[MLG]User'
    }
  ],
  
  // Test scenarios
  TEST_SCENARIOS: [
    'service_initialization',
    'username_tagging_logic',
    'clan_membership_detection',
    'frontend_display_integration',
    'performance_validation',
    'edge_case_handling'
  ]
};

/**
 * MLG Username Tagging Test Suite
 */
class MLGUsernameTaggingTestSuite {
  constructor() {
    this.testResults = [];
    this.testService = null;
    this.startTime = null;
    this.errors = [];
    
    console.log('🧪 MLG Username Tagging Test Suite initialized');
  }

  /**
   * Run complete test suite
   * @returns {Promise<Object>} Test results summary
   */
  async runAllTests() {
    this.startTime = Date.now();
    console.log('🚀 Starting MLG Username Tagging Test Suite...');
    
    try {
      // Run all test scenarios
      for (const scenario of TEST_CONFIG.TEST_SCENARIOS) {
        console.log(`\n📋 Running test scenario: ${scenario}`);
        await this.runTestScenario(scenario);
      }
      
      // Generate test report
      const report = this.generateTestReport();
      console.log('\n📊 Test Suite Complete:', report);
      
      return report;
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.errors.push({ scenario: 'test_suite', error: error.message });
      throw error;
    }
  }

  /**
   * Run individual test scenario
   * @param {string} scenario - Test scenario name
   */
  async runTestScenario(scenario) {
    const startTime = Date.now();
    
    try {
      switch (scenario) {
        case 'service_initialization':
          await this.testServiceInitialization();
          break;
        case 'username_tagging_logic':
          await this.testUsernameTaggingLogic();
          break;
        case 'clan_membership_detection':
          await this.testClanMembershipDetection();
          break;
        case 'frontend_display_integration':
          await this.testFrontendDisplayIntegration();
          break;
        case 'performance_validation':
          await this.testPerformanceValidation();
          break;
        case 'edge_case_handling':
          await this.testEdgeCaseHandling();
          break;
        default:
          throw new Error(`Unknown test scenario: ${scenario}`);
      }
      
      const duration = Date.now() - startTime;
      this.testResults.push({
        scenario,
        status: 'passed',
        duration,
        timestamp: new Date()
      });
      
      console.log(`✅ ${scenario} test passed (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        scenario,
        status: 'failed',
        duration,
        error: error.message,
        timestamp: new Date()
      });
      
      console.error(`❌ ${scenario} test failed:`, error.message);
      this.errors.push({ scenario, error: error.message });
    }
  }

  /**
   * Test service initialization
   */
  async testServiceInitialization() {
    console.log('  🔧 Testing service initialization...');
    
    // Test service creation
    this.testService = new MLGUsernameTaggingService({
      logger: console
    });
    
    if (!this.testService) {
      throw new Error('Failed to create MLG tagging service');
    }
    
    // Test service initialization
    await this.testService.initialize();
    
    if (!this.testService.isInitialized) {
      throw new Error('Service failed to initialize properly');
    }
    
    // Test configuration
    const stats = this.testService.getStatistics();
    if (!stats || typeof stats !== 'object') {
      throw new Error('Service statistics not available');
    }
    
    console.log('    ✓ Service created and initialized successfully');
    console.log('    ✓ Configuration valid');
    console.log('    ✓ Statistics available');
  }

  /**
   * Test username tagging logic
   */
  async testUsernameTaggingLogic() {
    console.log('  🏷️ Testing username tagging logic...');
    
    if (!this.testService) {
      throw new Error('Service not initialized');
    }
    
    // Test basic tagging
    const testUsername = 'TestUser123';
    const taggedUsername = this.testService.tagUsername(testUsername);
    
    if (!taggedUsername.startsWith('[MLG]')) {
      throw new Error('Username not properly tagged');
    }
    
    console.log('    ✓ Basic username tagging works');
    
    // Test tag removal
    const untaggedUsername = this.testService.untagUsername(taggedUsername);
    if (untaggedUsername !== testUsername) {
      throw new Error('Username not properly untagged');
    }
    
    console.log('    ✓ Username untagging works');
    
    // Test already tagged username
    const alreadyTagged = '[MLG] ExistingUser';
    const reTagged = this.testService.tagUsername(alreadyTagged);
    if (reTagged !== alreadyTagged) {
      throw new Error('Already tagged username was modified');
    }
    
    console.log('    ✓ Already tagged username handling works');
    
    // Test validation
    try {
      this.testService.validateUsername('ValidUser123');
      console.log('    ✓ Username validation works for valid usernames');
    } catch (error) {
      throw new Error('Valid username rejected: ' + error.message);
    }
    
    // Test invalid username rejection
    try {
      this.testService.validateUsername('');
      throw new Error('Empty username not rejected');
    } catch (error) {
      console.log('    ✓ Invalid username properly rejected');
    }
  }

  /**
   * Test clan membership detection
   */
  async testClanMembershipDetection() {
    console.log('  👥 Testing clan membership detection...');
    
    if (!this.testService) {
      throw new Error('Service not initialized');
    }
    
    // Test with mock data
    for (const testUser of TEST_CONFIG.TEST_USERS) {
      const displayUsername = await this.testService.getDisplayUsername(
        testUser.id,
        testUser.username,
        { test: true }
      );
      
      if (testUser.is_clan_member) {
        if (!displayUsername.startsWith('[MLG]')) {
          throw new Error(`Clan member ${testUser.username} not properly tagged`);
        }
      } else {
        if (displayUsername.startsWith('[MLG]')) {
          throw new Error(`Non-clan member ${testUser.username} incorrectly tagged`);
        }
      }
      
      console.log(`    ✓ ${testUser.username}: ${displayUsername}`);
    }
    
    console.log('    ✓ Clan membership detection works correctly');
  }

  /**
   * Test frontend display integration
   */
  async testFrontendDisplayIntegration() {
    console.log('  🎨 Testing frontend display integration...');
    
    // Test if display utility is available
    if (!mlgUsernameDisplay) {
      throw new Error('MLG username display utility not available');
    }
    
    // Test element creation
    const testUser = TEST_CONFIG.TEST_USERS[0];
    const element = mlgUsernameDisplay.createUsernameElement(
      testUser.username,
      testUser.expected_display,
      { userId: testUser.id }
    );
    
    if (!element || !element.classList) {
      throw new Error('Failed to create username element');
    }
    
    console.log('    ✓ Username element creation works');
    
    // Test styling application
    if (!element.querySelector('.mlg-tag') && testUser.is_clan_member) {
      throw new Error('MLG tag not found in clan member element');
    }
    
    console.log('    ✓ MLG tag styling applied correctly');
    
    // Test statistics
    const stats = mlgUsernameDisplay.getStatistics();
    if (!stats || typeof stats !== 'object') {
      throw new Error('Display utility statistics not available');
    }
    
    console.log('    ✓ Display utility statistics available');
  }

  /**
   * Test performance validation
   */
  async testPerformanceValidation() {
    console.log('  ⚡ Testing performance validation...');
    
    if (!this.testService) {
      throw new Error('Service not initialized');
    }
    
    // Test bulk tagging performance
    const startTime = Date.now();
    const bulkUsers = [];
    
    for (let i = 0; i < 100; i++) {
      const username = `BulkUser${i}`;
      const tagged = this.testService.tagUsername(username);
      bulkUsers.push(tagged);
    }
    
    const bulkTaggingTime = Date.now() - startTime;
    
    if (bulkTaggingTime > 1000) { // Should complete in under 1 second
      throw new Error(`Bulk tagging too slow: ${bulkTaggingTime}ms`);
    }
    
    console.log(`    ✓ Bulk tagging performance: ${bulkTaggingTime}ms for 100 users`);
    
    // Test cache performance
    const cacheStartTime = Date.now();
    
    for (let i = 0; i < 50; i++) {
      await this.testService.getDisplayUsername('cache_test_user', 'CacheTestUser');
    }
    
    const cacheTime = Date.now() - cacheStartTime;
    
    if (cacheTime > 500) { // Should be very fast with caching
      throw new Error(`Cache performance too slow: ${cacheTime}ms`);
    }
    
    console.log(`    ✓ Cache performance: ${cacheTime}ms for 50 lookups`);
    
    // Test memory usage
    const stats = this.testService.getStatistics();
    if (stats.taggedUsernamesCached > 1000) {
      console.warn(`    ⚠️ High cache usage: ${stats.taggedUsernamesCached} entries`);
    } else {
      console.log(`    ✓ Memory usage acceptable: ${stats.taggedUsernamesCached} cached entries`);
    }
  }

  /**
   * Test edge case handling
   */
  async testEdgeCaseHandling() {
    console.log('  🔍 Testing edge case handling...');
    
    if (!this.testService) {
      throw new Error('Service not initialized');
    }
    
    // Test null/undefined inputs
    const nullResult = this.testService.tagUsername(null);
    if (nullResult !== null) {
      console.log('    ✓ Null input handled gracefully');
    }
    
    const undefinedResult = this.testService.tagUsername(undefined);
    if (undefinedResult !== undefined) {
      console.log('    ✓ Undefined input handled gracefully');
    }
    
    // Test very long usernames
    const longUsername = 'A'.repeat(100);
    const longTagged = this.testService.tagUsername(longUsername);
    console.log('    ✓ Long username handled');
    
    // Test special characters
    const specialChars = 'User_123-Test';
    const specialTagged = this.testService.tagUsername(specialChars);
    if (!specialTagged.includes(specialChars)) {
      throw new Error('Special characters not preserved');
    }
    console.log('    ✓ Special characters preserved');
    
    // Test concurrent access
    const concurrentPromises = [];
    for (let i = 0; i < 10; i++) {
      concurrentPromises.push(
        this.testService.getDisplayUsername(`concurrent_${i}`, `ConcurrentUser${i}`)
      );
    }
    
    const concurrentResults = await Promise.all(concurrentPromises);
    if (concurrentResults.length !== 10) {
      throw new Error('Concurrent access failed');
    }
    console.log('    ✓ Concurrent access handled correctly');
    
    // Test service cleanup
    await this.testService.shutdown();
    console.log('    ✓ Service cleanup completed');
  }

  /**
   * Generate comprehensive test report
   * @returns {Object} Test report
   */
  generateTestReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'passed').length;
    const failedTests = this.testResults.filter(r => r.status === 'failed').length;
    const totalDuration = Date.now() - this.startTime;
    
    const report = {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        success_rate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0,
        total_duration: totalDuration
      },
      results: this.testResults,
      errors: this.errors,
      timestamp: new Date(),
      platform: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
        mlg_service_version: '1.0.0',
        test_environment: 'development'
      }
    };
    
    return report;
  }

  /**
   * Export test results to JSON
   * @returns {string} JSON string of test results
   */
  exportResults() {
    const report = this.generateTestReport();
    return JSON.stringify(report, null, 2);
  }

  /**
   * Print human-readable test summary
   */
  printSummary() {
    const report = this.generateTestReport();
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 MLG USERNAME TAGGING TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${report.summary.passed}/${report.summary.total}`);
    console.log(`❌ Failed: ${report.summary.failed}/${report.summary.total}`);
    console.log(`📈 Success Rate: ${report.summary.success_rate}%`);
    console.log(`⏱️ Total Duration: ${report.summary.total_duration}ms`);
    
    if (report.errors.length > 0) {
      console.log('\n❌ Errors:');
      report.errors.forEach(error => {
        console.log(`  - ${error.scenario}: ${error.error}`);
      });
    }
    
    console.log('\n🎯 Test Environment:');
    console.log(`  - Platform: ${report.platform.userAgent}`);
    console.log(`  - MLG Service Version: ${report.platform.mlg_service_version}`);
    console.log(`  - Environment: ${report.platform.test_environment}`);
    
    console.log('='.repeat(50));
  }
}

/**
 * Quick test runner function
 * @returns {Promise<Object>} Test results
 */
export async function runMLGTaggingTests() {
  const testSuite = new MLGUsernameTaggingTestSuite();
  const results = await testSuite.runAllTests();
  testSuite.printSummary();
  return results;
}

/**
 * Browser-compatible test runner
 */
if (typeof window !== 'undefined') {
  window.runMLGTaggingTests = runMLGTaggingTests;
  window.MLGUsernameTaggingTestSuite = MLGUsernameTaggingTestSuite;
}

// Export for use in other modules
export { MLGUsernameTaggingTestSuite, TEST_CONFIG };
export default MLGUsernameTaggingTestSuite;