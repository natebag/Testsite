/**
 * Web3 Testing Suite Runner
 * 
 * Comprehensive test suite for all MLG.clan Web3 functionality
 * Covers all sub-tasks 8.1-8.10 for complete blockchain integration testing
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class Web3TestRunner {
  constructor() {
    this.testSuites = [
      {
        name: 'Phantom Integration Tests',
        file: 'phantom-integration.test.js',
        description: 'Full Phantom wallet integration testing',
        subtask: '8.1'
      },
      {
        name: 'Multi-Wallet Support Tests',
        file: 'multi-wallet-support.test.js',
        description: 'Multi-wallet compatibility testing',
        subtask: '8.2'
      },
      {
        name: 'Transaction Simulation Tests',
        file: 'transaction-simulation.test.js',
        description: 'Transaction simulation framework testing',
        subtask: '8.3'
      },
      {
        name: 'Network Failover Tests',
        file: 'network-failover.test.js',
        description: 'Network switching and failover testing',
        subtask: '8.4'
      },
      {
        name: 'Gas Optimization Tests',
        file: 'gas-optimization.test.js',
        description: 'Fee estimation and optimization testing',
        subtask: '8.5'
      },
      {
        name: 'Error Recovery Tests',
        file: 'error-recovery.test.js',
        description: 'Error handling and recovery testing',
        subtask: '8.6'
      },
      {
        name: 'Security Audit Tests',
        file: 'security-audit.test.js',
        description: 'Security audit and penetration testing',
        subtask: '8.7'
      },
      {
        name: 'Load Testing',
        file: 'load-testing.test.js',
        description: 'Load testing with concurrent transactions',
        subtask: '8.8'
      },
      {
        name: 'Cross-Platform Tests',
        file: 'cross-platform.test.js',
        description: 'Cross-browser and mobile compatibility',
        subtask: '8.9'
      },
      {
        name: 'Voting System Tests',
        file: 'voting-system.test.js',
        description: 'Vote system and token burn validation',
        subtask: '8.10'
      }
    ];
    
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      suites: [],
      startTime: null,
      endTime: null,
      duration: 0
    };
  }

  async runAllTests(options = {}) {
    const {
      verbose = true,
      generateReport = true,
      parallel = false,
      timeout = 300000, // 5 minutes per suite
      includeSubtasks = [],
      excludeSubtasks = []
    } = options;

    console.log('🚀 Starting MLG.clan Web3 Testing Suite');
    console.log('=' .repeat(50));
    
    this.results.startTime = Date.now();

    const suitesToRun = this.filterTestSuites(includeSubtasks, excludeSubtasks);
    
    if (parallel) {
      await this.runTestsInParallel(suitesToRun, { verbose, timeout });
    } else {
      await this.runTestsSequentially(suitesToRun, { verbose, timeout });
    }

    this.results.endTime = Date.now();
    this.results.duration = this.results.endTime - this.results.startTime;

    this.printSummary();

    if (generateReport) {
      await this.generateTestReport();
    }

    return this.results;
  }

  filterTestSuites(includeSubtasks, excludeSubtasks) {
    let suites = [...this.testSuites];

    if (includeSubtasks.length > 0) {
      suites = suites.filter(suite => includeSubtasks.includes(suite.subtask));
    }

    if (excludeSubtasks.length > 0) {
      suites = suites.filter(suite => !excludeSubtasks.includes(suite.subtask));
    }

    return suites;
  }

  async runTestsSequentially(suites, options) {
    const { verbose, timeout } = options;

    for (let i = 0; i < suites.length; i++) {
      const suite = suites[i];
      
      if (verbose) {
        console.log(`\n📋 Running ${suite.name} (${suite.subtask})`);
        console.log(`   ${suite.description}`);
        console.log(`   Progress: ${i + 1}/${suites.length}`);
      }

      const result = await this.runSingleTest(suite, { timeout, verbose });
      this.results.suites.push(result);
      
      this.results.total += result.total;
      this.results.passed += result.passed;
      this.results.failed += result.failed;

      if (verbose) {
        this.printSuiteResult(result);
      }
    }
  }

  async runTestsInParallel(suites, options) {
    const { verbose, timeout } = options;

    console.log(`\n🔄 Running ${suites.length} test suites in parallel`);

    const testPromises = suites.map(suite => 
      this.runSingleTest(suite, { timeout, verbose: false })
    );

    const results = await Promise.allSettled(testPromises);

    results.forEach((result, index) => {
      const suite = suites[index];
      
      if (result.status === 'fulfilled') {
        const suiteResult = result.value;
        this.results.suites.push(suiteResult);
        
        this.results.total += suiteResult.total;
        this.results.passed += suiteResult.passed;
        this.results.failed += suiteResult.failed;
        
        if (verbose) {
          console.log(`\n✅ ${suite.name} completed`);
          this.printSuiteResult(suiteResult);
        }
      } else {
        const failedResult = {
          name: suite.name,
          subtask: suite.subtask,
          file: suite.file,
          total: 0,
          passed: 0,
          failed: 1,
          duration: 0,
          error: result.reason.message,
          success: false
        };
        
        this.results.suites.push(failedResult);
        this.results.total += 1;
        this.results.failed += 1;
        
        if (verbose) {
          console.log(`\n❌ ${suite.name} failed: ${result.reason.message}`);
        }
      }
    });
  }

  async runSingleTest(suite, options = {}) {
    const { timeout, verbose } = options;
    const startTime = Date.now();

    try {
      // Run Jest on specific test file
      const command = `npx jest ${suite.file} --testTimeout=${timeout} --json --silent`;
      const output = execSync(command, {
        cwd: path.dirname(path.dirname(__dirname)),
        encoding: 'utf8',
        timeout: timeout + 10000 // Add buffer for Jest startup
      });

      const jestResult = JSON.parse(output);
      const suiteResult = this.parseJestResult(suite, jestResult, startTime);
      
      return suiteResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Try to parse Jest output from error
      let testResults = { total: 0, passed: 0, failed: 1 };
      
      if (error.stdout) {
        try {
          const jestResult = JSON.parse(error.stdout);
          testResults = {
            total: jestResult.numTotalTests || 0,
            passed: jestResult.numPassedTests || 0,
            failed: jestResult.numFailedTests || 1
          };
        } catch (parseError) {
          // Use default values
        }
      }

      return {
        name: suite.name,
        subtask: suite.subtask,
        file: suite.file,
        ...testResults,
        duration,
        error: error.message,
        success: false
      };
    }
  }

  parseJestResult(suite, jestResult, startTime) {
    const duration = Date.now() - startTime;
    
    return {
      name: suite.name,
      subtask: suite.subtask,
      file: suite.file,
      total: jestResult.numTotalTests || 0,
      passed: jestResult.numPassedTests || 0,
      failed: jestResult.numFailedTests || 0,
      duration,
      success: jestResult.success || false,
      testResults: jestResult.testResults || []
    };
  }

  printSuiteResult(result) {
    const status = result.success ? '✅' : '❌';
    const duration = (result.duration / 1000).toFixed(2);
    
    console.log(`   ${status} ${result.passed}/${result.total} tests passed (${duration}s)`);
    
    if (!result.success && result.error) {
      console.log(`   ❌ Error: ${result.error}`);
    }
  }

  printSummary() {
    const duration = (this.results.duration / 1000).toFixed(2);
    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 Web3 Testing Suite Summary');
    console.log('='.repeat(50));
    
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed} (${successRate}%)`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Duration: ${duration}s`);
    console.log(`Test Suites: ${this.results.suites.length}`);
    
    const failedSuites = this.results.suites.filter(s => !s.success);
    if (failedSuites.length > 0) {
      console.log('\n❌ Failed Test Suites:');
      failedSuites.forEach(suite => {
        console.log(`   - ${suite.name} (${suite.subtask})`);
        if (suite.error) {
          console.log(`     Error: ${suite.error}`);
        }
      });
    }
    
    const passedSuites = this.results.suites.filter(s => s.success);
    console.log(`\n✅ Successful Test Suites: ${passedSuites.length}/${this.results.suites.length}`);
    
    if (this.results.failed === 0) {
      console.log('\n🎉 All Web3 tests passed! MLG.clan is ready for production.');
    } else {
      console.log(`\n⚠️  ${this.results.failed} test(s) failed. Please review and fix issues.`);
    }
  }

  async generateTestReport() {
    const reportData = {
      summary: {
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: ((this.results.passed / this.results.total) * 100).toFixed(1),
        duration: this.results.duration,
        timestamp: new Date().toISOString()
      },
      suites: this.results.suites.map(suite => ({
        name: suite.name,
        subtask: suite.subtask,
        file: suite.file,
        total: suite.total,
        passed: suite.passed,
        failed: suite.failed,
        duration: suite.duration,
        success: suite.success,
        error: suite.error || null
      })),
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage()
      },
      coverage: await this.generateCoverageReport()
    };

    // Save JSON report
    const reportPath = path.join(__dirname, '../../web3-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    // Generate HTML report
    await this.generateHTMLReport(reportData);
    
    console.log(`\n📄 Test report generated:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   HTML: ${reportPath.replace('.json', '.html')}`);
  }

  async generateHTMLReport(reportData) {
    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MLG.clan Web3 Test Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 20px; }
            .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
            .metric { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
            .metric h3 { margin: 0 0 10px 0; color: #333; }
            .metric .value { font-size: 2em; font-weight: bold; }
            .success { color: #27ae60; }
            .error { color: #e74c3c; }
            .warning { color: #f39c12; }
            .suites { background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
            .suite { padding: 20px; border-bottom: 1px solid #eee; }
            .suite:last-child { border-bottom: none; }
            .suite-header { display: flex; justify-content: between; align-items: center; margin-bottom: 10px; }
            .suite-name { font-size: 1.2em; font-weight: bold; }
            .suite-subtask { background: #3498db; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; }
            .suite-stats { display: flex; gap: 20px; margin-top: 10px; }
            .stat { font-size: 0.9em; }
            .progress-bar { width: 100%; height: 8px; background: #eee; border-radius: 4px; overflow: hidden; margin: 10px 0; }
            .progress-fill { height: 100%; transition: width 0.3s ease; }
            .footer { margin-top: 30px; text-align: center; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚀 MLG.clan Web3 Test Report</h1>
                <p>Generated on ${new Date(reportData.summary.timestamp).toLocaleString()}</p>
            </div>
            
            <div class="summary">
                <div class="metric">
                    <h3>Total Tests</h3>
                    <div class="value">${reportData.summary.total}</div>
                </div>
                <div class="metric">
                    <h3>Passed</h3>
                    <div class="value success">${reportData.summary.passed}</div>
                </div>
                <div class="metric">
                    <h3>Failed</h3>
                    <div class="value error">${reportData.summary.failed}</div>
                </div>
                <div class="metric">
                    <h3>Success Rate</h3>
                    <div class="value ${reportData.summary.failed === 0 ? 'success' : 'warning'}">${reportData.summary.successRate}%</div>
                </div>
                <div class="metric">
                    <h3>Duration</h3>
                    <div class="value">${(reportData.summary.duration / 1000).toFixed(1)}s</div>
                </div>
            </div>
            
            <div class="suites">
                <h2 style="padding: 20px; margin: 0; background: #f8f9fa; border-bottom: 1px solid #eee;">Test Suites</h2>
                ${reportData.suites.map(suite => `
                <div class="suite">
                    <div class="suite-header">
                        <div>
                            <div class="suite-name">${suite.success ? '✅' : '❌'} ${suite.name}</div>
                            <div style="margin-top: 5px;">
                                <span class="suite-subtask">Sub-task ${suite.subtask}</span>
                            </div>
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill ${suite.success ? 'success' : 'error'}" 
                             style="width: ${suite.total > 0 ? (suite.passed / suite.total) * 100 : 0}%; 
                                    background: ${suite.success ? '#27ae60' : '#e74c3c'};"></div>
                    </div>
                    <div class="suite-stats">
                        <span class="stat">Tests: ${suite.total}</span>
                        <span class="stat">Passed: ${suite.passed}</span>
                        <span class="stat">Failed: ${suite.failed}</span>
                        <span class="stat">Duration: ${(suite.duration / 1000).toFixed(2)}s</span>
                    </div>
                    ${suite.error ? `<div style="color: #e74c3c; margin-top: 10px; font-size: 0.9em;">Error: ${suite.error}</div>` : ''}
                </div>
                `).join('')}
            </div>
            
            <div class="footer">
                <p>MLG.clan Web3 Testing Suite - Comprehensive blockchain integration validation</p>
                <p>Platform: ${reportData.environment.platform} | Node: ${reportData.environment.node}</p>
            </div>
        </div>
    </body>
    </html>`;

    const htmlPath = path.join(__dirname, '../../web3-test-report.html');
    fs.writeFileSync(htmlPath, htmlTemplate);
  }

  async generateCoverageReport() {
    try {
      // Try to read Jest coverage if available
      const coveragePath = path.join(__dirname, '../../coverage/coverage-summary.json');
      if (fs.existsSync(coveragePath)) {
        const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        return coverage;
      }
    } catch (error) {
      console.log('No coverage data available');
    }
    
    return null;
  }

  // Utility methods for specific test scenarios
  async runQuickTest() {
    console.log('🚀 Running Quick Web3 Test Suite');
    
    // Run only essential tests for quick validation
    const quickTests = ['8.1', '8.3', '8.10']; // Phantom, Transaction, Voting
    
    return await this.runAllTests({
      includeSubtasks: quickTests,
      verbose: true,
      parallel: true,
      generateReport: false
    });
  }

  async runSecurityTests() {
    console.log('🔒 Running Security-Focused Test Suite');
    
    const securityTests = ['8.6', '8.7']; // Error Recovery, Security Audit
    
    return await this.runAllTests({
      includeSubtasks: securityTests,
      verbose: true,
      generateReport: true
    });
  }

  async runPerformanceTests() {
    console.log('⚡ Running Performance Test Suite');
    
    const performanceTests = ['8.5', '8.8', '8.9']; // Gas Optimization, Load Testing, Cross-Platform
    
    return await this.runAllTests({
      includeSubtasks: performanceTests,
      verbose: true,
      timeout: 600000, // 10 minutes for performance tests
      generateReport: true
    });
  }
}

// Export for programmatic usage
export { Web3TestRunner };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new Web3TestRunner();
  const args = process.argv.slice(2);
  
  if (args.includes('--quick')) {
    await runner.runQuickTest();
  } else if (args.includes('--security')) {
    await runner.runSecurityTests();
  } else if (args.includes('--performance')) {
    await runner.runPerformanceTests();
  } else {
    const options = {
      verbose: !args.includes('--quiet'),
      generateReport: !args.includes('--no-report'),
      parallel: args.includes('--parallel'),
      timeout: args.includes('--timeout') ? 
        parseInt(args[args.indexOf('--timeout') + 1]) * 1000 : 300000
    };
    
    await runner.runAllTests(options);
  }
}