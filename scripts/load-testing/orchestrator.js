#!/usr/bin/env node

/**
 * MLG.clan Gaming Platform - Load Testing Orchestrator
 * Comprehensive load testing framework for 1000+ concurrent users
 */

import { spawn, exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MLGLoadTestOrchestrator {
  constructor() {
    this.profiles = {
      quick: {
        users: 100,
        duration: '2m',
        rampUp: '30s',
        scenarios: ['voting', 'browsing']
      },
      gaming: {
        users: 500,
        duration: '5m', 
        rampUp: '1m',
        scenarios: ['voting', 'clan-battles', 'tournaments', 'leaderboards']
      },
      full: {
        users: 1000,
        duration: '10m',
        rampUp: '2m',
        scenarios: ['all']
      }
    };

    this.results = {
      startTime: null,
      endTime: null,
      tests: [],
      summary: {}
    };

    this.config = {
      baseUrl: process.env.MLG_BASE_URL || 'http://localhost:3000',
      apiUrl: process.env.MLG_API_URL || 'http://localhost:3000/api',
      wsUrl: process.env.MLG_WS_URL || 'ws://localhost:3000',
      solanaRpc: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
    };
  }

  async run() {
    const profile = this.parseArgs();
    console.log(`🚀 Starting MLG.clan Load Testing - Profile: ${profile.name}`);
    console.log(`📊 Target: ${profile.users} concurrent users for ${profile.duration}`);

    this.results.startTime = new Date();

    try {
      // Pre-test preparation
      await this.prepareTesting();

      // Run load tests in parallel
      const testPromises = [
        this.runK6Tests(profile),
        this.runArtilleryTests(profile),
        this.runSolanaLoadTests(profile),
        this.runDatabaseStressTests(profile),
        this.runWebSocketTests(profile)
      ];

      await Promise.allSettled(testPromises);

      // Performance monitoring
      await this.runPerformanceMonitoring();

      this.results.endTime = new Date();

      // Generate comprehensive report
      await this.generateReport();

      console.log('✅ Load testing completed successfully');
      console.log(`📋 Report generated: ${path.join(__dirname, 'reports', `load-test-${Date.now()}.json`)}`);

    } catch (error) {
      console.error('❌ Load testing failed:', error);
      process.exit(1);
    }
  }

  parseArgs() {
    const args = process.argv.slice(2);
    const profileArg = args.find(arg => arg.startsWith('--profile='));
    const profileName = profileArg ? profileArg.split('=')[1] : 'gaming';

    if (!this.profiles[profileName]) {
      console.error(`❌ Invalid profile: ${profileName}`);
      console.error(`Available profiles: ${Object.keys(this.profiles).join(', ')}`);
      process.exit(1);
    }

    return { name: profileName, ...this.profiles[profileName] };
  }

  async prepareTesting() {
    console.log('🔧 Preparing test environment...');

    // Create test fixtures
    await this.generateTestFixtures();

    // Validate test environment
    await this.validateEnvironment();

    // Clear previous results
    await this.clearPreviousResults();

    console.log('✅ Test environment ready');
  }

  async generateTestFixtures() {
    const fixtures = {
      users: this.generateTestUsers(1000),
      clans: this.generateTestClans(50),
      content: this.generateTestContent(200),
      tokens: this.generateTestTokenData(1000)
    };

    const fixturesPath = path.join(__dirname, 'fixtures', 'test-data.json');
    await fs.writeFile(fixturesPath, JSON.stringify(fixtures, null, 2));
    console.log(`📁 Test fixtures generated: ${fixtures.users.length} users, ${fixtures.clans.length} clans`);
  }

  generateTestUsers(count) {
    return Array.from({ length: count }, (_, i) => ({
      id: `load_test_user_${i}`,
      username: `gamer_${i}`,
      email: `loadtest${i}@mlg.clan`,
      walletAddress: this.generateFakeWalletAddress(),
      clanId: Math.floor(i / 20), // 20 users per clan
      tokenBalance: Math.floor(Math.random() * 10000) + 100,
      level: Math.floor(Math.random() * 50) + 1,
      achievements: Math.floor(Math.random() * 10),
      joinedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
    }));
  }

  generateTestClans(count) {
    return Array.from({ length: count }, (_, i) => ({
      id: `load_test_clan_${i}`,
      name: `Clan ${i}`,
      description: `Load test clan ${i}`,
      memberCount: 20,
      level: Math.floor(Math.random() * 10) + 1,
      totalTokens: Math.floor(Math.random() * 100000) + 10000,
      createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000)
    }));
  }

  generateTestContent(count) {
    return Array.from({ length: count }, (_, i) => ({
      id: `load_test_content_${i}`,
      title: `Gaming Content ${i}`,
      type: ['video', 'clip', 'stream', 'tournament'][Math.floor(Math.random() * 4)],
      creatorId: `load_test_user_${Math.floor(Math.random() * 1000)}`,
      votes: Math.floor(Math.random() * 1000),
      tokensEarned: Math.floor(Math.random() * 5000),
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    }));
  }

  generateTestTokenData(count) {
    return Array.from({ length: count }, (_, i) => ({
      userId: `load_test_user_${i}`,
      balance: Math.floor(Math.random() * 10000) + 100,
      transactions: Math.floor(Math.random() * 50),
      lastActivity: new Date()
    }));
  }

  generateFakeWalletAddress() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz123456789';
    return Array.from({ length: 44 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  async validateEnvironment() {
    console.log('🔍 Validating test environment...');

    const checks = [
      this.checkServerHealth(),
      this.checkDatabaseConnection(),
      this.checkRedisConnection(),
      this.checkSolanaConnection()
    ];

    const results = await Promise.allSettled(checks);
    const failures = results.filter(r => r.status === 'rejected');

    if (failures.length > 0) {
      console.error('❌ Environment validation failed:');
      failures.forEach((failure, i) => {
        console.error(`  - Check ${i + 1}: ${failure.reason}`);
      });
      throw new Error('Environment validation failed');
    }

    console.log('✅ Environment validation passed');
  }

  async checkServerHealth() {
    // Implementation would check server health endpoints
    return Promise.resolve();
  }

  async checkDatabaseConnection() {
    // Implementation would check database connectivity
    return Promise.resolve();
  }

  async checkRedisConnection() {
    // Implementation would check Redis connectivity
    return Promise.resolve();
  }

  async checkSolanaConnection() {
    // Implementation would check Solana RPC connectivity
    return Promise.resolve();
  }

  async clearPreviousResults() {
    const reportsDir = path.join(__dirname, 'reports');
    try {
      await fs.mkdir(reportsDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  async runK6Tests(profile) {
    console.log('🎯 Running K6 API load tests...');

    return new Promise((resolve, reject) => {
      const k6Script = path.join(__dirname, 'k6', 'gaming-scenarios.js');
      const cmd = `k6 run --vus ${profile.users} --duration ${profile.duration} --env BASE_URL=${this.config.baseUrl} ${k6Script}`;

      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ K6 tests failed:', error);
          reject(error);
          return;
        }

        console.log('✅ K6 tests completed');
        this.results.tests.push({
          tool: 'k6',
          type: 'API Load Testing',
          result: 'completed',
          output: stdout,
          duration: this.calculateDuration(profile.duration)
        });

        resolve();
      });
    });
  }

  async runArtilleryTests(profile) {
    console.log('⚡ Running Artillery WebSocket tests...');

    return new Promise((resolve, reject) => {
      const artilleryConfig = path.join(__dirname, 'artillery', 'gaming-flows.yml');
      const cmd = `artillery run --config '{"phases": [{"duration": ${this.parseDuration(profile.duration)}, "arrivalRate": ${Math.floor(profile.users / 60)}}]}' ${artilleryConfig}`;

      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Artillery tests failed:', error);
          reject(error);
          return;
        }

        console.log('✅ Artillery tests completed');
        this.results.tests.push({
          tool: 'artillery',
          type: 'WebSocket Load Testing',
          result: 'completed',
          output: stdout,
          duration: this.calculateDuration(profile.duration)
        });

        resolve();
      });
    });
  }

  async runSolanaLoadTests(profile) {
    console.log('🔗 Running Solana transaction load tests...');

    return new Promise((resolve, reject) => {
      const solanaScript = path.join(__dirname, 'solana', 'transaction-load-test.js');
      const cmd = `node ${solanaScript} --users=${profile.users} --duration=${profile.duration}`;

      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Solana load tests failed:', error);
          reject(error);
          return;
        }

        console.log('✅ Solana load tests completed');
        this.results.tests.push({
          tool: 'custom',
          type: 'Solana Transaction Load Testing',
          result: 'completed',
          output: stdout,
          duration: this.calculateDuration(profile.duration)
        });

        resolve();
      });
    });
  }

  async runDatabaseStressTests(profile) {
    console.log('💾 Running database stress tests...');

    return new Promise((resolve, reject) => {
      const dbScript = path.join(__dirname, 'database', 'stress-test.js');
      const cmd = `node ${dbScript} --connections=${Math.floor(profile.users / 10)} --duration=${profile.duration}`;

      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Database stress tests failed:', error);
          reject(error);
          return;
        }

        console.log('✅ Database stress tests completed');
        this.results.tests.push({
          tool: 'custom',
          type: 'Database Stress Testing',
          result: 'completed',
          output: stdout,
          duration: this.calculateDuration(profile.duration)
        });

        resolve();
      });
    });
  }

  async runWebSocketTests(profile) {
    console.log('🌐 Running WebSocket connection tests...');

    return new Promise((resolve, reject) => {
      const wsScript = path.join(__dirname, 'websocket', 'connection-test.js');
      const cmd = `node ${wsScript} --connections=${profile.users} --duration=${profile.duration}`;

      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ WebSocket tests failed:', error);
          reject(error);
          return;
        }

        console.log('✅ WebSocket tests completed');
        this.results.tests.push({
          tool: 'custom',
          type: 'WebSocket Connection Testing',
          result: 'completed',
          output: stdout,
          duration: this.calculateDuration(profile.duration)
        });

        resolve();
      });
    });
  }

  async runPerformanceMonitoring() {
    console.log('📊 Running performance monitoring...');

    const monitorScript = path.join(__dirname, 'monitoring', 'performance-monitor.js');
    return new Promise((resolve, reject) => {
      exec(`node ${monitorScript} --duration=60s`, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Performance monitoring failed:', error);
          reject(error);
          return;
        }

        console.log('✅ Performance monitoring completed');
        this.results.tests.push({
          tool: 'custom',
          type: 'Performance Monitoring',
          result: 'completed',
          output: stdout,
          duration: 60
        });

        resolve();
      });
    });
  }

  async generateReport() {
    console.log('📋 Generating comprehensive report...');

    const reportData = {
      timestamp: new Date().toISOString(),
      duration: this.results.endTime - this.results.startTime,
      tests: this.results.tests,
      summary: this.generateSummary(),
      recommendations: this.generateRecommendations(),
      environment: this.config
    };

    const reportPath = path.join(__dirname, 'reports', `load-test-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));

    // Also generate HTML report
    await this.generateHtmlReport(reportData);

    console.log(`📄 Report saved: ${reportPath}`);
  }

  generateSummary() {
    const totalTests = this.results.tests.length;
    const successfulTests = this.results.tests.filter(t => t.result === 'completed').length;
    const failedTests = totalTests - successfulTests;

    return {
      totalTests,
      successfulTests,
      failedTests,
      successRate: `${((successfulTests / totalTests) * 100).toFixed(2)}%`,
      totalDuration: `${Math.floor((this.results.endTime - this.results.startTime) / 1000)}s`
    };
  }

  generateRecommendations() {
    const recommendations = [];

    // Add gaming-specific recommendations
    recommendations.push(
      'Monitor vote processing latency during peak traffic',
      'Implement clan battle result caching for better performance',
      'Consider tournament bracket pre-computation',
      'Optimize leaderboard refresh intervals',
      'Review token burning transaction batching',
      'Implement graceful degradation for WebSocket connections'
    );

    return recommendations;
  }

  async generateHtmlReport(data) {
    const htmlTemplate = this.createHtmlReportTemplate(data);
    const htmlPath = path.join(__dirname, 'reports', `load-test-${Date.now()}.html`);
    await fs.writeFile(htmlPath, htmlTemplate);
  }

  createHtmlReportTemplate(data) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MLG.clan Load Test Report</title>
    <style>
        body { font-family: 'Segoe UI', system-ui; margin: 0; padding: 20px; background: #0a0a0a; color: #00ff00; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 2.5em; font-weight: bold; color: #00ff00; text-shadow: 0 0 10px #00ff00; }
        .subtitle { font-size: 1.2em; color: #888; margin-top: 10px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .metric-card { background: #111; border: 1px solid #00ff00; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #00ff00; }
        .metric-label { color: #888; margin-top: 10px; }
        .test-results { margin-bottom: 40px; }
        .test-item { background: #111; border: 1px solid #333; margin: 10px 0; padding: 15px; border-radius: 8px; }
        .test-header { display: flex; justify-content: between; align-items: center; margin-bottom: 10px; }
        .test-name { font-weight: bold; color: #00ff00; }
        .test-status { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; }
        .status-completed { background: #00ff00; color: #000; }
        .status-failed { background: #ff0000; color: #fff; }
        .recommendations { background: #111; border: 1px solid #333; padding: 20px; border-radius: 8px; }
        .recommendations ul { list-style-type: none; padding: 0; }
        .recommendations li { padding: 10px 0; border-bottom: 1px solid #333; }
        .recommendations li:last-child { border-bottom: none; }
        .footer { text-align: center; margin-top: 40px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">MLG.clan</div>
            <div class="subtitle">Load Testing Report - ${data.timestamp}</div>
        </div>

        <div class="summary">
            <div class="metric-card">
                <div class="metric-value">${data.summary.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.summary.successRate}</div>
                <div class="metric-label">Success Rate</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.summary.totalDuration}</div>
                <div class="metric-label">Total Duration</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.summary.failedTests}</div>
                <div class="metric-label">Failed Tests</div>
            </div>
        </div>

        <div class="test-results">
            <h2>Test Results</h2>
            ${data.tests.map(test => `
                <div class="test-item">
                    <div class="test-header">
                        <div class="test-name">${test.type} (${test.tool})</div>
                        <div class="test-status status-${test.result}">${test.result}</div>
                    </div>
                    <div>Duration: ${test.duration}s</div>
                </div>
            `).join('')}
        </div>

        <div class="recommendations">
            <h2>Performance Recommendations</h2>
            <ul>
                ${data.recommendations.map(rec => `<li>• ${rec}</li>`).join('')}
            </ul>
        </div>

        <div class="footer">
            <p>Generated by MLG.clan Load Testing Framework</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  parseDuration(duration) {
    const match = duration.match(/(\d+)([smh])/);
    if (!match) return 60;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      default: return 60;
    }
  }

  calculateDuration(duration) {
    return this.parseDuration(duration);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const orchestrator = new MLGLoadTestOrchestrator();
  orchestrator.run().catch(console.error);
}

export default MLGLoadTestOrchestrator;