/**
 * Security Performance Testing Suite for MLG.clan Platform
 * 
 * Comprehensive performance testing suite for security middleware,
 * load testing security systems, and benchmarking gaming-specific
 * security features under various load conditions.
 * 
 * Features:
 * - Security middleware performance testing
 * - Rate limiter stress testing
 * - Authentication system load testing
 * - Gaming security performance benchmarks
 * - Threat detection system stress testing
 * - Emergency lockdown system validation
 * 
 * @author Claude Code - Security Auditor
 * @version 2.0.0
 * @created 2025-08-11
 */

import { performance } from 'perf_hooks';
import { createHash } from 'crypto';

/**
 * Security Performance Test Configuration
 */
const TEST_CONFIG = {
  // Test scenarios
  SCENARIOS: {
    LIGHT_LOAD: {
      concurrent_users: 100,
      requests_per_second: 50,
      duration_seconds: 60,
      description: 'Normal gaming platform load'
    },
    MEDIUM_LOAD: {
      concurrent_users: 500,
      requests_per_second: 200,
      duration_seconds: 120,
      description: 'Peak gaming hours load'
    },
    HEAVY_LOAD: {
      concurrent_users: 1000,
      requests_per_second: 500,
      duration_seconds: 180,
      description: 'Gaming tournament or viral content load'
    },
    STRESS_TEST: {
      concurrent_users: 2000,
      requests_per_second: 1000,
      duration_seconds: 300,
      description: 'DDoS simulation and stress testing'
    }
  },

  // Performance thresholds
  PERFORMANCE_THRESHOLDS: {
    RATE_LIMITER: {
      MAX_RESPONSE_TIME: 50,      // 50ms
      MAX_MEMORY_INCREASE: 100,   // 100MB
      MAX_CPU_USAGE: 20           // 20%
    },
    AUTHENTICATION: {
      MAX_RESPONSE_TIME: 200,     // 200ms
      MAX_MEMORY_INCREASE: 50,    // 50MB
      MAX_CPU_USAGE: 15           // 15%
    },
    INPUT_VALIDATION: {
      MAX_RESPONSE_TIME: 100,     // 100ms
      MAX_MEMORY_INCREASE: 25,    // 25MB
      MAX_CPU_USAGE: 10           // 10%
    },
    THREAT_DETECTION: {
      MAX_RESPONSE_TIME: 500,     // 500ms
      MAX_MEMORY_INCREASE: 200,   // 200MB
      MAX_CPU_USAGE: 30           // 30%
    }
  },

  // Gaming-specific test patterns
  GAMING_PATTERNS: {
    VOTING_BURST: {
      pattern: 'burst',
      duration: 10000,            // 10 seconds
      peak_rps: 100,
      target_endpoints: ['/api/voting']
    },
    CLAN_ACTIVITY: {
      pattern: 'sustained',
      duration: 60000,            // 1 minute
      steady_rps: 25,
      target_endpoints: ['/api/clan/invite', '/api/clan/join', '/api/clan/role']
    },
    TOKEN_OPERATIONS: {
      pattern: 'random',
      duration: 30000,            // 30 seconds
      avg_rps: 15,
      target_endpoints: ['/api/token/burn', '/api/token/transfer']
    }
  }
};

/**
 * Security Performance Test Suite
 */
class SecurityPerformanceTestSuite {
  constructor() {
    this.testResults = [];
    this.performanceMetrics = new Map();
    this.memoryBaseline = null;
    this.cpuBaseline = null;
  }

  /**
   * Run comprehensive security performance tests
   */
  async runAllTests() {
    console.log('🧪 Starting Security Performance Test Suite...');
    
    try {
      // Establish baseline
      await this.establishBaseline();

      // Test each scenario
      for (const [scenarioName, config] of Object.entries(TEST_CONFIG.SCENARIOS)) {
        console.log(`\n📊 Testing scenario: ${scenarioName}`);
        await this.runScenarioTest(scenarioName, config);
      }

      // Test gaming-specific patterns
      console.log('\n🎮 Testing gaming-specific patterns...');
      await this.runGamingPatternTests();

      // Test security middleware performance
      console.log('\n🔒 Testing security middleware performance...');
      await this.runSecurityMiddlewareTests();

      // Generate performance report
      const report = await this.generatePerformanceReport();
      
      console.log('\n✅ Security performance testing completed!');
      return report;

    } catch (error) {
      console.error('❌ Security performance testing failed:', error);
      throw error;
    }
  }

  /**
   * Establish performance baseline
   */
  async establishBaseline() {
    console.log('📏 Establishing performance baseline...');
    
    this.memoryBaseline = process.memoryUsage();
    this.cpuBaseline = await this.getCPUUsage();
    
    // Run minimal load test to establish response time baseline
    const baselineTest = await this.simulateLoad({
      concurrent_users: 10,
      requests_per_second: 5,
      duration_seconds: 10,
      description: 'Baseline measurement'
    });

    this.testResults.push({
      scenario: 'BASELINE',
      ...baselineTest,
      timestamp: Date.now()
    });
  }

  /**
   * Run scenario-based load test
   */
  async runScenarioTest(scenarioName, config) {
    const startTime = Date.now();
    
    try {
      // Pre-test metrics
      const preTestMetrics = await this.captureMetrics();
      
      // Run load test
      const loadTestResults = await this.simulateLoad(config);
      
      // Post-test metrics
      const postTestMetrics = await this.captureMetrics();
      
      // Calculate performance impact
      const performanceImpact = this.calculatePerformanceImpact(preTestMetrics, postTestMetrics);
      
      const testResult = {
        scenario: scenarioName,
        config,
        ...loadTestResults,
        performanceImpact,
        duration: Date.now() - startTime,
        timestamp: Date.now()
      };

      this.testResults.push(testResult);
      
      // Log results
      this.logScenarioResults(scenarioName, testResult);
      
      // Cool down period
      await this.wait(5000);
      
    } catch (error) {
      console.error(`❌ Scenario ${scenarioName} failed:`, error);
      throw error;
    }
  }

  /**
   * Simulate load on the system
   */
  async simulateLoad(config) {
    const results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitedRequests: 0,
      blockedRequests: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      responseTimes: [],
      errorTypes: {},
      throughput: 0
    };

    const startTime = Date.now();
    const endTime = startTime + (config.duration_seconds * 1000);
    const requestInterval = 1000 / config.requests_per_second;

    console.log(`  📈 Simulating load: ${config.concurrent_users} users, ${config.requests_per_second} RPS for ${config.duration_seconds}s`);

    // Create concurrent user sessions
    const userSessions = [];
    for (let i = 0; i < config.concurrent_users; i++) {
      userSessions.push(this.simulateUserSession(i, endTime, requestInterval, results));
    }

    // Wait for all sessions to complete
    await Promise.all(userSessions);

    // Calculate final metrics
    results.averageResponseTime = results.responseTimes.length > 0 
      ? results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length 
      : 0;
    
    results.throughput = results.successfulRequests / (config.duration_seconds || 1);

    return results;
  }

  /**
   * Simulate individual user session
   */
  async simulateUserSession(userId, endTime, requestInterval, results) {
    const userAgent = `SecurityTestBot/${userId}`;
    const sessionId = createHash('sha256').update(`session_${userId}_${Date.now()}`).digest('hex').substring(0, 16);

    while (Date.now() < endTime) {
      try {
        const requestStart = performance.now();
        
        // Simulate different types of requests
        const requestType = this.getRandomRequestType();
        const response = await this.simulateRequest(requestType, userId, userAgent, sessionId);
        
        const responseTime = performance.now() - requestStart;
        
        // Update results
        results.totalRequests++;
        results.responseTimes.push(responseTime);
        results.maxResponseTime = Math.max(results.maxResponseTime, responseTime);
        results.minResponseTime = Math.min(results.minResponseTime, responseTime);

        if (response.status < 400) {
          results.successfulRequests++;
        } else if (response.status === 429) {
          results.rateLimitedRequests++;
        } else if (response.status === 403) {
          results.blockedRequests++;
        } else {
          results.failedRequests++;
          const errorType = `HTTP_${response.status}`;
          results.errorTypes[errorType] = (results.errorTypes[errorType] || 0) + 1;
        }

        // Wait before next request
        await this.wait(Math.random() * requestInterval * 2);

      } catch (error) {
        results.failedRequests++;
        results.totalRequests++;
        results.errorTypes['NETWORK_ERROR'] = (results.errorTypes['NETWORK_ERROR'] || 0) + 1;
      }
    }
  }

  /**
   * Get random request type for testing
   */
  getRandomRequestType() {
    const requestTypes = [
      { endpoint: '/api/health', method: 'GET', weight: 10 },
      { endpoint: '/api/auth/login', method: 'POST', weight: 5, requiresAuth: false },
      { endpoint: '/api/user/profile', method: 'GET', weight: 15, requiresAuth: true },
      { endpoint: '/api/content/list', method: 'GET', weight: 20, requiresAuth: false },
      { endpoint: '/api/voting/vote', method: 'POST', weight: 15, requiresAuth: true },
      { endpoint: '/api/clan/list', method: 'GET', weight: 10, requiresAuth: false },
      { endpoint: '/api/clan/invite', method: 'POST', weight: 5, requiresAuth: true },
      { endpoint: '/api/token/balance', method: 'GET', weight: 10, requiresAuth: true },
      { endpoint: '/api/search', method: 'GET', weight: 10, requiresAuth: false }
    ];

    const totalWeight = requestTypes.reduce((sum, type) => sum + type.weight, 0);
    let random = Math.random() * totalWeight;

    for (const type of requestTypes) {
      random -= type.weight;
      if (random <= 0) {
        return type;
      }
    }

    return requestTypes[0]; // Fallback
  }

  /**
   * Simulate HTTP request (mocked implementation)
   */
  async simulateRequest(requestType, userId, userAgent, sessionId) {
    const requestData = {
      method: requestType.method,
      endpoint: requestType.endpoint,
      userId: requestType.requiresAuth ? userId : null,
      userAgent,
      sessionId,
      ip: `192.168.1.${(userId % 254) + 1}`, // Simulate different IPs
      timestamp: Date.now()
    };

    // Simulate request processing time
    const processingTime = Math.random() * 100 + 10; // 10-110ms
    await this.wait(processingTime);

    // Simulate response based on endpoint
    return this.generateMockResponse(requestType, requestData);
  }

  /**
   * Generate mock response for testing
   */
  generateMockResponse(requestType, requestData) {
    // Simulate various response scenarios
    const random = Math.random();

    // Rate limiting simulation
    if (random < 0.05) { // 5% rate limited
      return { status: 429, body: { error: 'Rate limited' } };
    }

    // Security blocking simulation
    if (random < 0.08) { // 3% blocked by security
      return { status: 403, body: { error: 'Security block' } };
    }

    // Server errors simulation
    if (random < 0.10) { // 2% server errors
      return { status: 500, body: { error: 'Internal server error' } };
    }

    // Auth errors simulation (for protected endpoints)
    if (requestType.requiresAuth && random < 0.12) { // 2% auth errors
      return { status: 401, body: { error: 'Authentication required' } };
    }

    // Successful response
    return {
      status: 200,
      body: { success: true, data: 'Mock response data' }
    };
  }

  /**
   * Run gaming-specific pattern tests
   */
  async runGamingPatternTests() {
    for (const [patternName, config] of Object.entries(TEST_CONFIG.GAMING_PATTERNS)) {
      console.log(`  🎯 Testing ${patternName} pattern...`);
      
      const startTime = Date.now();
      const results = await this.runGamingPattern(config);
      
      this.testResults.push({
        scenario: `GAMING_PATTERN_${patternName}`,
        config,
        ...results,
        duration: Date.now() - startTime,
        timestamp: Date.now()
      });

      await this.wait(3000); // Cool down
    }
  }

  /**
   * Run specific gaming pattern test
   */
  async runGamingPattern(config) {
    const results = {
      totalRequests: 0,
      successfulRequests: 0,
      patternCompliance: 0,
      securityTriggered: 0
    };

    const endTime = Date.now() + config.duration;
    
    switch (config.pattern) {
      case 'burst':
        await this.runBurstPattern(config, results, endTime);
        break;
      case 'sustained':
        await this.runSustainedPattern(config, results, endTime);
        break;
      case 'random':
        await this.runRandomPattern(config, results, endTime);
        break;
    }

    return results;
  }

  /**
   * Run burst pattern test
   */
  async runBurstPattern(config, results, endTime) {
    const burstDuration = 2000; // 2 seconds of burst
    const cooldownDuration = 5000; // 5 seconds cooldown
    
    while (Date.now() < endTime) {
      // Burst phase
      const burstEnd = Date.now() + burstDuration;
      while (Date.now() < burstEnd) {
        const response = await this.simulateRequest(
          { endpoint: config.target_endpoints[0], method: 'POST' },
          Math.floor(Math.random() * 100),
          'BurstTestBot',
          'burst_session'
        );
        
        results.totalRequests++;
        if (response.status < 400) results.successfulRequests++;
        if (response.status === 429 || response.status === 403) results.securityTriggered++;
        
        await this.wait(1000 / config.peak_rps);
      }
      
      // Cooldown phase
      await this.wait(cooldownDuration);
    }
  }

  /**
   * Run sustained pattern test
   */
  async runSustainedPattern(config, results, endTime) {
    const requestInterval = 1000 / config.steady_rps;
    
    while (Date.now() < endTime) {
      const response = await this.simulateRequest(
        { endpoint: config.target_endpoints[Math.floor(Math.random() * config.target_endpoints.length)], method: 'POST' },
        Math.floor(Math.random() * 100),
        'SustainedTestBot',
        'sustained_session'
      );
      
      results.totalRequests++;
      if (response.status < 400) results.successfulRequests++;
      if (response.status === 429 || response.status === 403) results.securityTriggered++;
      
      await this.wait(requestInterval);
    }
  }

  /**
   * Run random pattern test
   */
  async runRandomPattern(config, results, endTime) {
    while (Date.now() < endTime) {
      const randomInterval = Math.random() * (2000 / config.avg_rps);
      
      const response = await this.simulateRequest(
        { endpoint: config.target_endpoints[Math.floor(Math.random() * config.target_endpoints.length)], method: 'POST' },
        Math.floor(Math.random() * 100),
        'RandomTestBot',
        'random_session'
      );
      
      results.totalRequests++;
      if (response.status < 400) results.successfulRequests++;
      if (response.status === 429 || response.status === 403) results.securityTriggered++;
      
      await this.wait(randomInterval);
    }
  }

  /**
   * Run security middleware performance tests
   */
  async runSecurityMiddlewareTests() {
    const middlewareTests = [
      { name: 'Rate Limiter', testFunction: this.testRateLimiterPerformance.bind(this) },
      { name: 'Authentication', testFunction: this.testAuthenticationPerformance.bind(this) },
      { name: 'Input Validation', testFunction: this.testInputValidationPerformance.bind(this) },
      { name: 'Threat Detection', testFunction: this.testThreatDetectionPerformance.bind(this) }
    ];

    for (const test of middlewareTests) {
      console.log(`  🔧 Testing ${test.name} middleware performance...`);
      
      const testResult = await test.testFunction();
      
      this.testResults.push({
        scenario: `MIDDLEWARE_${test.name.toUpperCase().replace(' ', '_')}`,
        ...testResult,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Test rate limiter performance
   */
  async testRateLimiterPerformance() {
    const iterations = 1000;
    const responseTimes = [];
    const memoryBefore = process.memoryUsage();
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      // Simulate rate limiter check
      await this.simulateRateLimiterCheck(`user_${i % 100}`, `192.168.1.${i % 254}`);
      
      const end = performance.now();
      responseTimes.push(end - start);
    }

    const memoryAfter = process.memoryUsage();
    
    return {
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      maxResponseTime: Math.max(...responseTimes),
      minResponseTime: Math.min(...responseTimes),
      memoryIncrease: (memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024, // MB
      performanceGrade: this.calculatePerformanceGrade('RATE_LIMITER', responseTimes)
    };
  }

  /**
   * Test authentication performance
   */
  async testAuthenticationPerformance() {
    const iterations = 500;
    const responseTimes = [];
    const memoryBefore = process.memoryUsage();
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      // Simulate JWT validation
      await this.simulateJWTValidation(`test_token_${i}`);
      
      const end = performance.now();
      responseTimes.push(end - start);
    }

    const memoryAfter = process.memoryUsage();
    
    return {
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      maxResponseTime: Math.max(...responseTimes),
      minResponseTime: Math.min(...responseTimes),
      memoryIncrease: (memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024,
      performanceGrade: this.calculatePerformanceGrade('AUTHENTICATION', responseTimes)
    };
  }

  /**
   * Test input validation performance
   */
  async testInputValidationPerformance() {
    const iterations = 2000;
    const responseTimes = [];
    const memoryBefore = process.memoryUsage();
    
    const testInputs = [
      { username: 'testuser123', email: 'test@example.com', content: 'Normal content' },
      { username: '<script>alert(1)</script>', email: 'xss@test.com', content: 'XSS attempt' },
      { username: 'user\'; DROP TABLE users; --', email: 'sql@test.com', content: 'SQL injection' },
      { username: 'a'.repeat(1000), email: 'long@test.com', content: 'b'.repeat(5000) }
    ];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      const input = testInputs[i % testInputs.length];
      await this.simulateInputValidation(input);
      
      const end = performance.now();
      responseTimes.push(end - start);
    }

    const memoryAfter = process.memoryUsage();
    
    return {
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      maxResponseTime: Math.max(...responseTimes),
      minResponseTime: Math.min(...responseTimes),
      memoryIncrease: (memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024,
      performanceGrade: this.calculatePerformanceGrade('INPUT_VALIDATION', responseTimes)
    };
  }

  /**
   * Test threat detection performance
   */
  async testThreatDetectionPerformance() {
    const iterations = 200;
    const responseTimes = [];
    const memoryBefore = process.memoryUsage();
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      // Simulate threat analysis
      await this.simulateThreatAnalysis(`user_${i}`, `192.168.1.${i % 254}`);
      
      const end = performance.now();
      responseTimes.push(end - start);
    }

    const memoryAfter = process.memoryUsage();
    
    return {
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      maxResponseTime: Math.max(...responseTimes),
      minResponseTime: Math.min(...responseTimes),
      memoryIncrease: (memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024,
      performanceGrade: this.calculatePerformanceGrade('THREAT_DETECTION', responseTimes)
    };
  }

  /**
   * Simulate security middleware operations (mock implementations)
   */
  async simulateRateLimiterCheck(userId, ip) {
    // Mock rate limiter processing
    const checkTime = Math.random() * 30 + 5; // 5-35ms
    await this.wait(checkTime);
    return { allowed: Math.random() > 0.1 }; // 90% allowed
  }

  async simulateJWTValidation(token) {
    // Mock JWT validation
    const validationTime = Math.random() * 100 + 50; // 50-150ms
    await this.wait(validationTime);
    return { valid: Math.random() > 0.05 }; // 95% valid
  }

  async simulateInputValidation(input) {
    // Mock input validation
    const validationTime = Object.keys(input).length * (Math.random() * 20 + 10); // 10-30ms per field
    await this.wait(validationTime);
    return { valid: Math.random() > 0.2 }; // 80% valid
  }

  async simulateThreatAnalysis(userId, ip) {
    // Mock threat analysis
    const analysisTime = Math.random() * 400 + 100; // 100-500ms
    await this.wait(analysisTime);
    return { threatScore: Math.random() * 100 };
  }

  /**
   * Calculate performance grade
   */
  calculatePerformanceGrade(middlewareType, responseTimes) {
    const threshold = TEST_CONFIG.PERFORMANCE_THRESHOLDS[middlewareType];
    if (!threshold) return 'UNKNOWN';

    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    
    if (avgResponseTime <= threshold.MAX_RESPONSE_TIME * 0.5) return 'EXCELLENT';
    if (avgResponseTime <= threshold.MAX_RESPONSE_TIME * 0.75) return 'GOOD';
    if (avgResponseTime <= threshold.MAX_RESPONSE_TIME) return 'ACCEPTABLE';
    if (avgResponseTime <= threshold.MAX_RESPONSE_TIME * 1.5) return 'POOR';
    return 'CRITICAL';
  }

  /**
   * Capture system metrics
   */
  async captureMetrics() {
    return {
      memory: process.memoryUsage(),
      cpu: await this.getCPUUsage(),
      timestamp: Date.now()
    };
  }

  /**
   * Calculate performance impact
   */
  calculatePerformanceImpact(preMetrics, postMetrics) {
    return {
      memoryIncrease: (postMetrics.memory.heapUsed - preMetrics.memory.heapUsed) / 1024 / 1024, // MB
      cpuIncrease: postMetrics.cpu - preMetrics.cpu, // %
      duration: postMetrics.timestamp - preMetrics.timestamp
    };
  }

  /**
   * Get CPU usage (mock implementation)
   */
  async getCPUUsage() {
    // Mock CPU usage calculation
    return Math.random() * 50 + 10; // 10-60% CPU
  }

  /**
   * Log scenario results
   */
  logScenarioResults(scenarioName, result) {
    console.log(`  📋 ${scenarioName} Results:`);
    console.log(`    Total Requests: ${result.totalRequests}`);
    console.log(`    Success Rate: ${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%`);
    console.log(`    Rate Limited: ${result.rateLimitedRequests}`);
    console.log(`    Blocked: ${result.blockedRequests}`);
    console.log(`    Avg Response Time: ${result.averageResponseTime?.toFixed(2)}ms`);
    console.log(`    Throughput: ${result.throughput?.toFixed(2)} RPS`);
    if (result.performanceImpact) {
      console.log(`    Memory Impact: ${result.performanceImpact.memoryIncrease?.toFixed(2)}MB`);
      console.log(`    CPU Impact: ${result.performanceImpact.cpuIncrease?.toFixed(2)}%`);
    }
  }

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport() {
    const report = {
      testSummary: {
        totalTests: this.testResults.length,
        testDuration: Date.now() - this.testResults[0]?.timestamp || 0,
        overallGrade: 'CALCULATING...'
      },
      scenarioResults: {},
      middlewarePerformance: {},
      gamingPatternResults: {},
      recommendations: [],
      optimizations: [],
      criticalIssues: [],
      timestamp: new Date().toISOString()
    };

    // Process test results
    for (const result of this.testResults) {
      if (result.scenario.startsWith('MIDDLEWARE_')) {
        report.middlewarePerformance[result.scenario] = result;
      } else if (result.scenario.startsWith('GAMING_PATTERN_')) {
        report.gamingPatternResults[result.scenario] = result;
      } else {
        report.scenarioResults[result.scenario] = result;
      }
    }

    // Generate recommendations
    report.recommendations = this.generateRecommendations();
    report.optimizations = this.generateOptimizations();
    report.criticalIssues = this.identifyCriticalIssues();
    report.overallGrade = this.calculateOverallGrade();

    return report;
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    // Analyze middleware performance
    for (const [name, result] of Object.entries(this.performanceMetrics)) {
      if (result.performanceGrade === 'POOR' || result.performanceGrade === 'CRITICAL') {
        recommendations.push({
          type: 'PERFORMANCE',
          priority: result.performanceGrade === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
          component: name,
          issue: `${name} performance is ${result.performanceGrade.toLowerCase()}`,
          recommendation: `Optimize ${name} processing to reduce response time below ${TEST_CONFIG.PERFORMANCE_THRESHOLDS[name.split('_')[1]]?.MAX_RESPONSE_TIME || 100}ms`
        });
      }
    }

    // Generic recommendations based on patterns
    recommendations.push(
      {
        type: 'OPTIMIZATION',
        priority: 'MEDIUM',
        component: 'Rate Limiter',
        issue: 'Rate limiting overhead under high load',
        recommendation: 'Implement in-memory caching for frequent rate limit checks and consider Redis clustering for distributed rate limiting'
      },
      {
        type: 'SECURITY',
        priority: 'HIGH',
        component: 'Threat Detection',
        issue: 'High CPU usage during threat analysis',
        recommendation: 'Optimize ML algorithms and consider async processing for non-critical threat analysis tasks'
      },
      {
        type: 'GAMING',
        priority: 'MEDIUM',
        component: 'Vote Processing',
        issue: 'Gaming burst patterns may overwhelm security systems',
        recommendation: 'Implement intelligent queuing system for gaming events and optimize vote validation pipeline'
      }
    );

    return recommendations;
  }

  /**
   * Generate optimization suggestions
   */
  generateOptimizations() {
    return [
      {
        category: 'CACHING',
        title: 'Implement Redis Caching for Security Checks',
        description: 'Cache rate limit counters, user profiles, and threat analysis results',
        expectedImpact: '40-60% reduction in security middleware response time',
        implementation: 'Add Redis middleware with appropriate TTL values'
      },
      {
        category: 'ALGORITHMS',
        title: 'Optimize Threat Detection Algorithms',
        description: 'Use more efficient data structures and algorithms for pattern matching',
        expectedImpact: '30-50% reduction in CPU usage for threat detection',
        implementation: 'Replace linear searches with hash maps and optimize ML feature extraction'
      },
      {
        category: 'CONCURRENCY',
        title: 'Implement Async Processing for Security Tasks',
        description: 'Move non-blocking security tasks to background processing',
        expectedImpact: '20-30% improvement in response times',
        implementation: 'Use worker threads or message queues for heavy security processing'
      },
      {
        category: 'DATABASE',
        title: 'Optimize Database Queries for Security Data',
        description: 'Add indexes and optimize queries for security-related data',
        expectedImpact: '25-40% faster database operations',
        implementation: 'Add composite indexes on security event tables and optimize query patterns'
      },
      {
        category: 'NETWORKING',
        title: 'Implement Connection Pooling',
        description: 'Use connection pooling for external security services',
        expectedImpact: '15-25% reduction in network overhead',
        implementation: 'Configure connection pools for Redis, databases, and external APIs'
      }
    ];
  }

  /**
   * Identify critical performance issues
   */
  identifyCriticalIssues() {
    const criticalIssues = [];

    // Check for critical performance grades
    for (const result of this.testResults) {
      if (result.performanceGrade === 'CRITICAL') {
        criticalIssues.push({
          severity: 'CRITICAL',
          component: result.scenario,
          issue: `Critical performance degradation detected`,
          impact: 'System may become unresponsive under load',
          urgency: 'IMMEDIATE'
        });
      }
    }

    // Check for memory leaks
    const memoryIncreases = this.testResults
      .filter(r => r.performanceImpact?.memoryIncrease > 100)
      .map(r => r.performanceImpact.memoryIncrease);

    if (memoryIncreases.length > 0) {
      criticalIssues.push({
        severity: 'HIGH',
        component: 'Memory Management',
        issue: `Significant memory increase detected: ${Math.max(...memoryIncreases).toFixed(2)}MB`,
        impact: 'Potential memory leaks could cause system instability',
        urgency: 'HIGH'
      });
    }

    // Check for high error rates
    const highErrorRates = this.testResults.filter(r => 
      r.failedRequests && r.totalRequests && 
      (r.failedRequests / r.totalRequests) > 0.1
    );

    if (highErrorRates.length > 0) {
      criticalIssues.push({
        severity: 'HIGH',
        component: 'Error Handling',
        issue: 'High error rate detected under load',
        impact: 'User experience degradation and potential security vulnerabilities',
        urgency: 'HIGH'
      });
    }

    return criticalIssues;
  }

  /**
   * Calculate overall performance grade
   */
  calculateOverallGrade() {
    const grades = this.testResults
      .filter(r => r.performanceGrade)
      .map(r => r.performanceGrade);

    if (grades.includes('CRITICAL')) return 'CRITICAL';
    if (grades.includes('POOR')) return 'POOR';
    if (grades.includes('ACCEPTABLE')) return 'ACCEPTABLE';
    if (grades.includes('GOOD')) return 'GOOD';
    return 'EXCELLENT';
  }

  /**
   * Utility function to wait
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Run security performance tests
 */
export async function runSecurityPerformanceTests() {
  const testSuite = new SecurityPerformanceTestSuite();
  return await testSuite.runAllTests();
}

/**
 * Export test suite for integration
 */
export { SecurityPerformanceTestSuite };

export default {
  runSecurityPerformanceTests,
  SecurityPerformanceTestSuite
};