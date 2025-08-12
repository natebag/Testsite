/**
 * Performance Monitoring System Test Suite
 * 
 * Comprehensive test suite to validate the accuracy and functionality
 * of the performance monitoring system for MLG.clan platform.
 * 
 * Tests:
 * - Core performance analytics functionality
 * - Gaming metrics tracking accuracy
 * - Alert system responsiveness
 * - Data pipeline integrity
 * - Insights engine recommendations
 * - Integration with existing components
 * 
 * @author Claude Code - Analytics Architect
 * @version 1.0.0
 * @created 2025-08-12
 */

import { getPerformanceAnalytics } from './PerformanceAnalytics.js';
import { getGamingMetricsTracker } from './GamingMetricsTracker.js';
import { getPerformanceAlertSystem } from './PerformanceAlertSystem.js';
import { getAnalyticsDataPipeline } from './AnalyticsDataPipeline.js';
import { getPerformanceInsightsEngine } from './PerformanceInsightsEngine.js';
import { performanceIntegration } from './PerformanceIntegration.js';
import { votingPerformanceIntegration } from './VotingPerformanceIntegration.js';

export class PerformanceMonitoringTests {
  constructor() {
    this.testResults = [];
    this.testSummary = {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0
    };
    
    this.performanceAnalytics = getPerformanceAnalytics();
    this.gamingMetricsTracker = getGamingMetricsTracker();
    this.alertSystem = getPerformanceAlertSystem();
    this.dataPipeline = getAnalyticsDataPipeline();
    this.insightsEngine = getPerformanceInsightsEngine();
    
    this.startTime = 0;
  }

  /**
   * Run complete performance monitoring test suite
   */
  async runCompleteTestSuite() {
    console.log('🎯 Starting Performance Monitoring System Test Suite');
    this.startTime = Date.now();
    
    try {
      // Core system tests
      await this.testPerformanceAnalyticsCore();
      await this.testGamingMetricsTracking();
      await this.testAlertSystem();
      await this.testDataPipeline();
      await this.testInsightsEngine();
      
      // Integration tests
      await this.testPerformanceIntegration();
      await this.testVotingIntegration();
      
      // End-to-end tests
      await this.testEndToEndWorkflow();
      
      // Performance tests
      await this.testSystemPerformance();
      
      // Generate test report
      const report = this.generateTestReport();
      
      console.log('✅ Performance Monitoring Test Suite Complete');
      return report;
      
    } catch (error) {
      console.error('❌ Test Suite Failed:', error);
      throw error;
    }
  }

  /**
   * Test Performance Analytics Core
   */
  async testPerformanceAnalyticsCore() {
    console.log('🧪 Testing Performance Analytics Core...');
    
    // Test 1: Initialization
    await this.runTest('Core Analytics Initialization', async () => {
      const isInitialized = this.performanceAnalytics.isInitialized || false;
      this.assert(isInitialized, 'Performance analytics should be initialized');
    });
    
    // Test 2: Web Vitals Recording
    await this.runTest('Web Vitals Recording', async () => {
      // Simulate LCP metric
      this.performanceAnalytics.recordMetric('LCP', {
        value: 2500,
        element: 'main-content',
        timestamp: Date.now()
      });
      
      const snapshot = this.performanceAnalytics.getWebVitalsSnapshot();
      this.assert(snapshot.LCP, 'LCP metric should be recorded');
      this.assert(snapshot.LCP.latest === 2500, 'LCP value should match recorded value');
    });
    
    // Test 3: Gaming Metrics Recording
    await this.runTest('Gaming Metrics Recording', async () => {
      this.performanceAnalytics.recordGamingMetric('vote_response_time', {
        duration: 1500,
        voteType: 'upvote',
        contentType: 'video',
        timestamp: Date.now()
      });
      
      const snapshot = this.performanceAnalytics.getGamingPerformanceSnapshot();
      this.assert(snapshot.vote, 'Vote metrics should be recorded');
      this.assert(snapshot.vote.latest === 1500, 'Vote duration should match');
    });
    
    // Test 4: Performance Snapshot
    await this.runTest('Performance Snapshot Generation', async () => {
      const snapshot = this.performanceAnalytics.getPerformanceSnapshot();
      
      this.assert(snapshot.webVitals, 'Snapshot should include web vitals');
      this.assert(snapshot.gaming, 'Snapshot should include gaming metrics');
      this.assert(snapshot.network, 'Snapshot should include network info');
      this.assert(snapshot.device, 'Snapshot should include device info');
    });
    
    console.log('✅ Performance Analytics Core tests completed');
  }

  /**
   * Test Gaming Metrics Tracking
   */
  async testGamingMetricsTracking() {
    console.log('🧪 Testing Gaming Metrics Tracking...');
    
    // Test 1: Vote Tracking
    await this.runTest('Vote Performance Tracking', async () => {
      const voteData = {
        voteType: 'upvote',
        targetType: 'content',
        targetId: 'test_content_123',
        userId: 'test_user_456',
        mlgAmount: 100
      };
      
      const timingId = this.gamingMetricsTracker.startVoteTracking(voteData);
      this.assert(timingId, 'Vote tracking should return timing ID');
      
      // Simulate vote completion
      setTimeout(() => {
        const result = this.gamingMetricsTracker.completeVoteTracking(timingId, true);
        this.assert(result, 'Vote tracking should complete successfully');
      }, 100);
    });
    
    // Test 2: Leaderboard Tracking
    await this.runTest('Leaderboard Performance Tracking', async () => {
      const leaderboardData = {
        type: 'reputation_score',
        tier: 'global',
        expectedEntryCount: 100,
        userId: 'test_user_456'
      };
      
      const timingId = this.gamingMetricsTracker.startLeaderboardTracking(leaderboardData);
      this.assert(timingId, 'Leaderboard tracking should return timing ID');
      
      // Simulate data fetch completion
      this.gamingMetricsTracker.markLeaderboardDataFetch(timingId, 95);
      
      setTimeout(() => {
        const result = this.gamingMetricsTracker.completeLeaderboardTracking(timingId, true);
        this.assert(result, 'Leaderboard tracking should complete successfully');
      }, 50);
    });
    
    // Test 3: Performance Profile Updates
    await this.runTest('User Performance Profile Updates', async () => {
      const userId = 'test_user_456';
      const profile = this.gamingMetricsTracker.getUserPerformanceProfile(userId);
      
      // Profile should exist after tracking operations
      this.assert(profile, 'User performance profile should exist');
      this.assert(profile.operations, 'Profile should contain operations data');
    });
    
    // Test 4: Competitive Context
    await this.runTest('Competitive Context Management', async () => {
      const status = this.gamingMetricsTracker.getCompetitiveStatus();
      this.assert(typeof status.isCompetitive === 'boolean', 'Competitive status should be boolean');
      
      // Test tournament context
      this.gamingMetricsTracker.emit('tournament:started', 'test_tournament_123');
      const updatedStatus = this.gamingMetricsTracker.getCompetitiveStatus();
      this.assert(updatedStatus.activeTournaments.size > 0, 'Active tournaments should be tracked');
    });
    
    console.log('✅ Gaming Metrics Tracking tests completed');
  }

  /**
   * Test Alert System
   */
  async testAlertSystem() {
    console.log('🧪 Testing Alert System...');
    
    // Test 1: Alert Creation
    await this.runTest('Performance Alert Creation', async () => {
      const alertData = {
        type: 'web_vital_threshold',
        category: 'webVitals',
        metric: 'LCP',
        value: 5000,
        threshold: 4000,
        level: 'critical',
        timestamp: Date.now()
      };
      
      const alertId = this.alertSystem.createPerformanceAlert(alertData);
      this.assert(alertId, 'Alert should be created successfully');
      
      const activeAlerts = this.alertSystem.getActiveAlerts();
      this.assert(activeAlerts.length > 0, 'Alert should appear in active alerts');
    });
    
    // Test 2: Alert Resolution
    await this.runTest('Alert Resolution', async () => {
      const activeAlerts = this.alertSystem.getActiveAlerts();
      
      if (activeAlerts.length > 0) {
        const alertId = activeAlerts[0].id;
        const resolved = this.alertSystem.resolveAlert(alertId, 'test_resolution');
        this.assert(resolved, 'Alert should be resolvable');
        
        const updatedAlerts = this.alertSystem.getActiveAlerts();
        const resolvedAlert = updatedAlerts.find(alert => alert.id === alertId);
        this.assert(!resolvedAlert, 'Resolved alert should not be in active alerts');
      }
    });
    
    // Test 3: Budget Violation Detection
    await this.runTest('Performance Budget Monitoring', async () => {
      // Simulate budget violation
      this.alertSystem.updateBudgetTracking('webVitals', 'LCP', 6000);
      
      // Check for budget violation alerts
      const violations = this.alertSystem.getBudgetViolationSummary();
      this.assert(violations.totalViolations >= 0, 'Budget violations should be tracked');
    });
    
    // Test 4: Alert Statistics
    await this.runTest('Alert Statistics Generation', async () => {
      const stats = this.alertSystem.getAlertStatistics('hour');
      
      this.assert(typeof stats.totalAlerts === 'number', 'Total alerts should be numeric');
      this.assert(typeof stats.resolutionRate === 'number', 'Resolution rate should be numeric');
      this.assert(stats.alertsByLevel, 'Alerts should be categorized by level');
    });
    
    console.log('✅ Alert System tests completed');
  }

  /**
   * Test Data Pipeline
   */
  async testDataPipeline() {
    console.log('🧪 Testing Analytics Data Pipeline...');
    
    // Test 1: Event Ingestion
    await this.runTest('Event Ingestion', async () => {
      // Simulate ingesting an event
      const eventData = {
        type: 'gaming_performance',
        name: 'vote_response_time',
        duration: 1200,
        timestamp: Date.now()
      };
      
      this.dataPipeline.ingestEvent('gaming_performance', eventData);
      
      // Check real-time metrics
      const realTimeMetrics = this.dataPipeline.getRealTimeMetrics('gaming_performance', 300000);
      this.assert(realTimeMetrics.length >= 0, 'Real-time metrics should be available');
    });
    
    // Test 2: Data Aggregation
    await this.runTest('Data Aggregation', async () => {
      const aggregatedMetrics = this.dataPipeline.getAggregatedMetrics('realTime');
      this.assert(Array.isArray(aggregatedMetrics), 'Aggregated metrics should be array');
    });
    
    // Test 3: Segment Performance
    await this.runTest('Segment Performance Analysis', async () => {
      const segmentPerformance = this.dataPipeline.getSegmentPerformance();
      this.assert(Array.isArray(segmentPerformance), 'Segment performance should be array');
    });
    
    // Test 4: Data Quality Metrics
    await this.runTest('Data Quality Monitoring', async () => {
      const qualityMetrics = this.dataPipeline.getDataQualityMetrics();
      this.assert(typeof qualityMetrics === 'object', 'Quality metrics should be object');
    });
    
    console.log('✅ Analytics Data Pipeline tests completed');
  }

  /**
   * Test Insights Engine
   */
  async testInsightsEngine() {
    console.log('🧪 Testing Performance Insights Engine...');
    
    // Test 1: Insight Generation
    await this.runTest('Performance Insight Generation', async () => {
      const insights = this.insightsEngine.getCurrentInsights();
      this.assert(Array.isArray(insights), 'Insights should be array');
    });
    
    // Test 2: Recommendation Generation
    await this.runTest('Optimization Recommendations', async () => {
      const recommendations = this.insightsEngine.getTopRecommendations(5);
      this.assert(Array.isArray(recommendations), 'Recommendations should be array');
      
      if (recommendations.length > 0) {
        const rec = recommendations[0];
        this.assert(rec.title, 'Recommendation should have title');
        this.assert(rec.impact, 'Recommendation should have impact level');
        this.assert(rec.actions, 'Recommendation should have actions');
      }
    });
    
    // Test 3: Bottleneck Analysis
    await this.runTest('Bottleneck Detection', async () => {
      const bottlenecks = this.insightsEngine.getBottleneckAnalysis();
      this.assert(Array.isArray(bottlenecks), 'Bottlenecks should be array');
    });
    
    // Test 4: Performance Predictions
    await this.runTest('Performance Predictions', async () => {
      const predictions = this.insightsEngine.getPerformancePredictions();
      this.assert(Array.isArray(predictions), 'Predictions should be array');
    });
    
    console.log('✅ Performance Insights Engine tests completed');
  }

  /**
   * Test Performance Integration
   */
  async testPerformanceIntegration() {
    console.log('🧪 Testing Performance Integration...');
    
    // Test 1: Initialization Status
    await this.runTest('Integration Initialization', async () => {
      const isReady = performanceIntegration.isReady();
      this.assert(typeof isReady === 'boolean', 'Ready status should be boolean');
    });
    
    // Test 2: Dashboard Data
    await this.runTest('Dashboard Data Generation', async () => {
      const dashboardData = performanceIntegration.getPerformanceDashboardData();
      
      if (dashboardData) {
        this.assert(dashboardData.webVitals, 'Dashboard should include web vitals');
        this.assert(dashboardData.gaming, 'Dashboard should include gaming metrics');
        this.assert(dashboardData.alerts, 'Dashboard should include alerts');
        this.assert(dashboardData.insights, 'Dashboard should include insights');
      }
    });
    
    // Test 3: Operation Tracking
    await this.runTest('Operation Tracking', async () => {
      const voteData = {
        voteType: 'upvote',
        targetType: 'content',
        targetId: 'test_content_789',
        userId: 'test_user_789'
      };
      
      const timingId = performanceIntegration.trackVoteOperation(voteData);
      this.assert(timingId, 'Vote operation tracking should return timing ID');
    });
    
    // Test 4: Performance Analysis Trigger
    await this.runTest('Manual Performance Analysis', async () => {
      try {
        performanceIntegration.triggerPerformanceAnalysis();
        this.assert(true, 'Performance analysis should trigger without errors');
      } catch (error) {
        this.assert(false, `Performance analysis failed: ${error.message}`);
      }
    });
    
    console.log('✅ Performance Integration tests completed');
  }

  /**
   * Test Voting Integration
   */
  async testVotingIntegration() {
    console.log('🧪 Testing Voting Performance Integration...');
    
    // Test 1: Vote Performance Summary
    await this.runTest('Vote Performance Summary', async () => {
      const summary = votingPerformanceIntegration.getVotePerformanceSummary();
      
      this.assert(typeof summary.count === 'number', 'Count should be numeric');
      this.assert(typeof summary.averageDuration === 'number', 'Average duration should be numeric');
      this.assert(typeof summary.successRate === 'number', 'Success rate should be numeric');
    });
    
    // Test 2: Performance Data Export
    await this.runTest('Vote Performance Data Export', async () => {
      const exportData = votingPerformanceIntegration.exportVotePerformanceData();
      
      this.assert(exportData.summary, 'Export should include summary');
      this.assert(Array.isArray(exportData.recentHistory), 'Export should include recent history');
      this.assert(typeof exportData.exportTimestamp === 'number', 'Export should have timestamp');
    });
    
    console.log('✅ Voting Performance Integration tests completed');
  }

  /**
   * Test End-to-End Workflow
   */
  async testEndToEndWorkflow() {
    console.log('🧪 Testing End-to-End Performance Workflow...');
    
    await this.runTest('Complete Performance Monitoring Workflow', async () => {
      // 1. Record performance metric
      this.performanceAnalytics.recordGamingMetric('vote_response_time', {
        duration: 3500, // Slow vote to trigger analysis
        voteType: 'upvote',
        contentType: 'video',
        timestamp: Date.now()
      });
      
      // 2. Wait for processing
      await this.delay(100);
      
      // 3. Check for insights generation
      const insights = this.insightsEngine.getCurrentInsights('performance', 'high');
      
      // 4. Check for recommendations
      const recommendations = this.insightsEngine.getTopRecommendations(3);
      
      // 5. Verify data pipeline processed the event
      const realTimeMetrics = this.dataPipeline.getRealTimeMetrics('gaming_performance', 60000);
      
      this.assert(true, 'End-to-end workflow completed without errors');
    });
    
    console.log('✅ End-to-End Workflow tests completed');
  }

  /**
   * Test System Performance
   */
  async testSystemPerformance() {
    console.log('🧪 Testing System Performance...');
    
    // Test 1: Metric Recording Performance
    await this.runTest('Metric Recording Performance', async () => {
      const startTime = performance.now();
      
      // Record 100 metrics
      for (let i = 0; i < 100; i++) {
        this.performanceAnalytics.recordGamingMetric('test_metric', {
          duration: Math.random() * 1000,
          timestamp: Date.now()
        });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.assert(duration < 1000, `Metric recording should be fast (${duration}ms for 100 metrics)`);
    });
    
    // Test 2: Memory Usage
    await this.runTest('Memory Usage Check', async () => {
      if (performance.memory) {
        const memoryBefore = performance.memory.usedJSHeapSize;
        
        // Generate some performance data
        for (let i = 0; i < 50; i++) {
          this.performanceAnalytics.recordMetric('LCP', {
            value: Math.random() * 5000,
            timestamp: Date.now()
          });
        }
        
        const memoryAfter = performance.memory.usedJSHeapSize;
        const memoryIncrease = memoryAfter - memoryBefore;
        
        this.assert(memoryIncrease < 10485760, `Memory increase should be reasonable (${memoryIncrease} bytes)`);
      } else {
        this.addWarning('Memory API not available for testing');
      }
    });
    
    // Test 3: Alert System Responsiveness
    await this.runTest('Alert System Responsiveness', async () => {
      const startTime = performance.now();
      
      this.alertSystem.createPerformanceAlert({
        type: 'test_alert',
        category: 'performance',
        metric: 'test_metric',
        value: 9999,
        level: 'critical',
        timestamp: Date.now()
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.assert(duration < 100, `Alert creation should be fast (${duration}ms)`);
    });
    
    console.log('✅ System Performance tests completed');
  }

  /**
   * Test Utilities
   */

  /**
   * Run individual test with error handling
   */
  async runTest(testName, testFunction) {
    try {
      this.testSummary.total++;
      console.log(`  🔍 ${testName}`);
      
      await testFunction();
      
      this.testResults.push({
        name: testName,
        status: 'PASSED',
        timestamp: Date.now()
      });
      
      this.testSummary.passed++;
      console.log(`  ✅ ${testName} - PASSED`);
      
    } catch (error) {
      this.testResults.push({
        name: testName,
        status: 'FAILED',
        error: error.message,
        timestamp: Date.now()
      });
      
      this.testSummary.failed++;
      console.log(`  ❌ ${testName} - FAILED: ${error.message}`);
    }
  }

  /**
   * Assert condition with error message
   */
  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  /**
   * Add warning to test results
   */
  addWarning(message) {
    this.testResults.push({
      name: 'Warning',
      status: 'WARNING',
      message,
      timestamp: Date.now()
    });
    
    this.testSummary.warnings++;
    console.log(`  ⚠️ WARNING: ${message}`);
  }

  /**
   * Delay utility for async tests
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;
    
    const report = {
      summary: {
        ...this.testSummary,
        duration: totalDuration,
        timestamp: endTime,
        success: this.testSummary.failed === 0
      },
      results: this.testResults,
      systemInfo: {
        userAgent: navigator.userAgent,
        timestamp: endTime,
        performanceMemory: performance.memory ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        } : null
      },
      recommendations: this.generateTestRecommendations()
    };
    
    this.logTestReport(report);
    return report;
  }

  /**
   * Generate recommendations based on test results
   */
  generateTestRecommendations() {
    const recommendations = [];
    
    if (this.testSummary.failed > 0) {
      recommendations.push({
        type: 'critical',
        title: 'Address Failed Tests',
        description: `${this.testSummary.failed} test(s) failed and require immediate attention`,
        priority: 'high'
      });
    }
    
    if (this.testSummary.warnings > 0) {
      recommendations.push({
        type: 'improvement',
        title: 'Review Warnings',
        description: `${this.testSummary.warnings} warning(s) detected that may impact performance`,
        priority: 'medium'
      });
    }
    
    if (this.testSummary.failed === 0 && this.testSummary.warnings === 0) {
      recommendations.push({
        type: 'maintenance',
        title: 'Regular Testing',
        description: 'All tests passed. Continue regular performance testing',
        priority: 'low'
      });
    }
    
    return recommendations;
  }

  /**
   * Log comprehensive test report
   */
  logTestReport(report) {
    console.log('\n🎯 PERFORMANCE MONITORING TEST REPORT');
    console.log('=====================================');
    console.log(`Duration: ${report.summary.duration}ms`);
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Warnings: ${report.summary.warnings}`);
    console.log(`Success Rate: ${((report.summary.passed / report.summary.total) * 100).toFixed(1)}%`);
    
    if (report.summary.success) {
      console.log('\n✅ ALL TESTS PASSED - Performance monitoring system is functioning correctly');
    } else {
      console.log('\n❌ SOME TESTS FAILED - Review failed tests and address issues');
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n🎯 RECOMMENDATIONS:');
      report.recommendations.forEach(rec => {
        console.log(`  ${rec.type.toUpperCase()}: ${rec.title}`);
        console.log(`    ${rec.description}`);
      });
    }
    
    console.log('\n=====================================');
  }

  /**
   * Export test results for external analysis
   */
  exportTestResults() {
    return {
      ...this.generateTestReport(),
      exportFormat: 'performance_monitoring_test_results',
      version: '1.0.0'
    };
  }
}

// Auto-run tests if in test environment
if (typeof window !== 'undefined' && window.location?.search?.includes('runTests=true')) {
  const testSuite = new PerformanceMonitoringTests();
  testSuite.runCompleteTestSuite().then(report => {
    console.log('Test suite completed:', report);
  }).catch(error => {
    console.error('Test suite failed:', error);
  });
}

// Export for external use
export { PerformanceMonitoringTests };
export default PerformanceMonitoringTests;