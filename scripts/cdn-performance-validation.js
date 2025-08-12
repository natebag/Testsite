/**
 * @fileoverview CDN Performance Validation Script
 * Comprehensive performance testing for the CDN integration system
 */

import { performance } from 'perf_hooks';
import { CDNIntegration } from '../src/core/cdn/index.js';

/**
 * Performance validation suite for CDN system
 */
class CDNPerformanceValidator {
  constructor() {
    this.cdnIntegration = null;
    this.testResults = {
      urlGeneration: {},
      mediaOptimization: {},
      cacheOperations: {},
      security: {},
      routing: {},
      failover: {},
      monitoring: {},
      overall: {}
    };
    this.performanceThresholds = {
      urlGeneration: 10, // ms per URL
      mediaOptimization: 5000, // ms per asset
      cacheInvalidation: 1000, // ms per operation
      securityCheck: 50, // ms per check
      routingDecision: 100, // ms per decision
      failoverDetection: 2000, // ms for failover
      monitoringUpdate: 200 // ms for metrics update
    };
  }

  /**
   * Initialize CDN system for testing
   */
  async initialize() {
    console.log('🚀 Initializing CDN Performance Validation...');
    
    this.cdnIntegration = new CDNIntegration({
      environment: 'test',
      enableFailover: true,
      enableSecurity: true,
      enableMonitoring: true,
      enableIntelligentRouting: true,
      enableGamingMedia: true
    });

    await this.cdnIntegration.initialize();
    console.log('✅ CDN system initialized for performance testing');
  }

  /**
   * Run complete performance validation suite
   */
  async runValidation() {
    console.log('\n📊 Starting CDN Performance Validation Suite...\n');
    
    try {
      await this.testUrlGenerationPerformance();
      await this.testMediaOptimizationPerformance();
      await this.testCacheOperationPerformance();
      await this.testSecurityPerformance();
      await this.testRoutingPerformance();
      await this.testFailoverPerformance();
      await this.testMonitoringPerformance();
      await this.testOverallSystemPerformance();
      
      this.generatePerformanceReport();
      
    } catch (error) {
      console.error('❌ Performance validation failed:', error);
      throw error;
    }
  }

  /**
   * Test URL generation performance
   */
  async testUrlGenerationPerformance() {
    console.log('📏 Testing URL Generation Performance...');
    
    const tests = [
      { name: 'Basic URL Generation', count: 10000 },
      { name: 'URL with Optimizations', count: 5000 },
      { name: 'Gaming Asset URLs', count: 3000 },
      { name: 'Signed URL Generation', count: 1000 }
    ];

    this.testResults.urlGeneration = {};

    for (const test of tests) {
      const startTime = performance.now();
      
      for (let i = 0; i < test.count; i++) {
        switch (test.name) {
          case 'Basic URL Generation':
            this.cdnIntegration.getCDNUrl(`/assets/image-${i}.jpg`);
            break;
          
          case 'URL with Optimizations':
            this.cdnIntegration.getCDNUrl(`/assets/optimized-${i}.jpg`, {
              width: 800,
              height: 600,
              format: 'webp',
              quality: 85
            });
            break;
          
          case 'Gaming Asset URLs':
            this.cdnIntegration.getCDNUrl(`/game/textures/asset-${i}.png`, {
              platform: 'web',
              quality: 'high'
            });
            break;
          
          case 'Signed URL Generation':
            this.cdnIntegration.managers.security.generateSignedUrl(
              `https://cdn.test.com/premium/asset-${i}.zip`,
              {
                expires: Math.floor(Date.now() / 1000) + 3600
              }
            );
            break;
        }
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTime = duration / test.count;
      
      this.testResults.urlGeneration[test.name] = {
        totalTime: duration,
        averageTime: avgTime,
        operationsPerSecond: (test.count / duration) * 1000,
        passed: avgTime < this.performanceThresholds.urlGeneration,
        threshold: this.performanceThresholds.urlGeneration
      };
      
      console.log(`  ${test.name}: ${avgTime.toFixed(2)}ms avg (${((test.count / duration) * 1000).toFixed(0)} ops/sec)`);
    }
  }

  /**
   * Test media optimization performance
   */
  async testMediaOptimizationPerformance() {
    console.log('🎨 Testing Media Optimization Performance...');
    
    const tests = [
      { name: 'Image Optimization', type: 'image', count: 50 },
      { name: 'Gaming Texture Optimization', type: 'gaming', count: 30 },
      { name: 'Batch Processing', type: 'batch', count: 20 }
    ];

    this.testResults.mediaOptimization = {};

    for (const test of tests) {
      const startTime = performance.now();
      
      try {
        for (let i = 0; i < test.count; i++) {
          const mockData = Buffer.alloc(1024 * 100, `mock-${test.type}-${i}`); // 100KB mock data
          
          switch (test.type) {
            case 'image':
              await this.cdnIntegration.optimizeMedia(mockData, {
                type: 'image',
                format: 'webp',
                quality: 85,
                width: 800,
                height: 600
              });
              break;
            
            case 'gaming':
              await this.cdnIntegration.managers.gamingMedia.handleAssetRequest({
                assetPath: `/game/texture-${i}.png`,
                assetType: 'textures',
                platform: 'web',
                quality: 'high'
              });
              break;
            
            case 'batch':
              const files = Array.from({ length: 5 }, (_, j) => ({
                path: `/batch/image-${i}-${j}.jpg`,
                type: 'image'
              }));
              
              await this.cdnIntegration.managers.mediaOptimizer.batchProcess(files, {
                concurrency: 3,
                image: { format: 'webp', quality: 80 }
              });
              break;
          }
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        const avgTime = duration / test.count;
        
        this.testResults.mediaOptimization[test.name] = {
          totalTime: duration,
          averageTime: avgTime,
          operationsPerSecond: (test.count / duration) * 1000,
          passed: avgTime < this.performanceThresholds.mediaOptimization,
          threshold: this.performanceThresholds.mediaOptimization
        };
        
        console.log(`  ${test.name}: ${avgTime.toFixed(2)}ms avg`);
        
      } catch (error) {
        console.error(`  ${test.name}: FAILED - ${error.message}`);
        this.testResults.mediaOptimization[test.name] = {
          error: error.message,
          passed: false
        };
      }
    }
  }

  /**
   * Test cache operation performance
   */
  async testCacheOperationPerformance() {
    console.log('🗄️ Testing Cache Operation Performance...');
    
    const tests = [
      { name: 'Path Invalidation', operation: 'invalidatePaths', count: 100 },
      { name: 'Tag Invalidation', operation: 'invalidateByTags', count: 50 },
      { name: 'Cache Status Check', operation: 'getInvalidationStatus', count: 500 }
    ];

    this.testResults.cacheOperations = {};

    for (const test of tests) {
      const startTime = performance.now();
      
      try {
        const promises = [];
        
        for (let i = 0; i < test.count; i++) {
          switch (test.operation) {
            case 'invalidatePaths':
              promises.push(
                this.cdnIntegration.managers.cacheInvalidation.invalidatePaths([
                  `/cache/path-${i}.css`,
                  `/cache/path-${i}.js`
                ], { priority: 'normal' })
              );
              break;
            
            case 'invalidateByTags':
              promises.push(
                this.cdnIntegration.managers.cacheInvalidation.invalidateByTags([
                  `tag-${i}`
                ], { priority: 'normal' })
              );
              break;
            
            case 'getInvalidationStatus':
              const statusId = `test-${i}`;
              this.cdnIntegration.managers.cacheInvalidation.getInvalidationStatus(statusId);
              break;
          }
        }
        
        if (promises.length > 0) {
          await Promise.all(promises);
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        const avgTime = duration / test.count;
        
        this.testResults.cacheOperations[test.name] = {
          totalTime: duration,
          averageTime: avgTime,
          operationsPerSecond: (test.count / duration) * 1000,
          passed: avgTime < this.performanceThresholds.cacheInvalidation,
          threshold: this.performanceThresholds.cacheInvalidation
        };
        
        console.log(`  ${test.name}: ${avgTime.toFixed(2)}ms avg`);
        
      } catch (error) {
        console.error(`  ${test.name}: FAILED - ${error.message}`);
        this.testResults.cacheOperations[test.name] = {
          error: error.message,
          passed: false
        };
      }
    }
  }

  /**
   * Test security performance
   */
  async testSecurityPerformance() {
    console.log('🔒 Testing Security Performance...');
    
    const tests = [
      { name: 'Rate Limit Checks', count: 10000 },
      { name: 'URL Signature Verification', count: 5000 },
      { name: 'Bot Detection', count: 3000 },
      { name: 'DDoS Analysis', count: 1000 }
    ];

    this.testResults.security = {};

    for (const test of tests) {
      const startTime = performance.now();
      
      for (let i = 0; i < test.count; i++) {
        const testIP = `192.168.1.${(i % 254) + 1}`;
        
        switch (test.name) {
          case 'Rate Limit Checks':
            this.cdnIntegration.managers.security.checkRateLimit(testIP);
            break;
          
          case 'URL Signature Verification':
            const signedUrl = this.cdnIntegration.managers.security.generateSignedUrl(
              `https://test.com/asset-${i}.jpg`,
              { expires: Math.floor(Date.now() / 1000) + 3600 }
            );
            this.cdnIntegration.managers.security.verifySignedUrl(signedUrl);
            break;
          
          case 'Bot Detection':
            const userAgent = i % 2 === 0 ? 
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' :
              'Python/3.9 requests/2.25.1';
            
            this.cdnIntegration.managers.security.checkBotProtection({
              userAgent,
              ipAddress: testIP
            });
            break;
          
          case 'DDoS Analysis':
            this.cdnIntegration.managers.security.checkDDoSProtection(testIP, {
              userAgent: 'test-agent',
              path: `/test/${i}`,
              method: 'GET'
            });
            break;
        }
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTime = duration / test.count;
      
      this.testResults.security[test.name] = {
        totalTime: duration,
        averageTime: avgTime,
        operationsPerSecond: (test.count / duration) * 1000,
        passed: avgTime < this.performanceThresholds.securityCheck,
        threshold: this.performanceThresholds.securityCheck
      };
      
      console.log(`  ${test.name}: ${avgTime.toFixed(2)}ms avg (${((test.count / duration) * 1000).toFixed(0)} ops/sec)`);
    }
  }

  /**
   * Test routing performance
   */
  async testRoutingPerformance() {
    console.log('🗺️ Testing Routing Performance...');
    
    const tests = [
      { name: 'Geographic Routing', count: 5000 },
      { name: 'Intelligent Routing', count: 3000 },
      { name: 'Device-Aware Routing', count: 2000 }
    ];

    this.testResults.routing = {};

    for (const test of tests) {
      const startTime = performance.now();
      
      for (let i = 0; i < test.count; i++) {
        const userContext = {
          ip: `${(i % 255) + 1}.${(i % 255) + 1}.1.1`,
          userAgent: i % 2 === 0 ? 
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' :
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
          country: ['US', 'UK', 'DE', 'SG'][i % 4]
        };
        
        const contentInfo = {
          type: ['image', 'video', 'gaming', 'static'][i % 4],
          size: (i % 10 + 1) * 1024 * 1024 // 1-10MB
        };
        
        switch (test.name) {
          case 'Geographic Routing':
            this.cdnIntegration.managers.geoDistribution.selectOptimalEdgeServer(
              userContext,
              contentInfo
            );
            break;
          
          case 'Intelligent Routing':
            this.cdnIntegration.managers.intelligentRouting.routeRequest({
              userContext,
              contentInfo
            });
            break;
          
          case 'Device-Aware Routing':
            const enrichedContext = this.cdnIntegration.managers.intelligentRouting
              .enrichUserContext(userContext);
            this.cdnIntegration.managers.intelligentRouting.selectOptimalEndpoint(
              [/* mock candidates */],
              enrichedContext,
              contentInfo
            );
            break;
        }
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTime = duration / test.count;
      
      this.testResults.routing[test.name] = {
        totalTime: duration,
        averageTime: avgTime,
        operationsPerSecond: (test.count / duration) * 1000,
        passed: avgTime < this.performanceThresholds.routingDecision,
        threshold: this.performanceThresholds.routingDecision
      };
      
      console.log(`  ${test.name}: ${avgTime.toFixed(2)}ms avg`);
    }
  }

  /**
   * Test failover performance
   */
  async testFailoverPerformance() {
    console.log('🔄 Testing Failover Performance...');
    
    const tests = [
      { name: 'Health Check Processing', count: 1000 },
      { name: 'Failover Decision', count: 100 },
      { name: 'Recovery Detection', count: 100 }
    ];

    this.testResults.failover = {};

    // Register test providers
    this.cdnIntegration.managers.failover.registerProvider('test-primary', {
      baseUrl: 'https://primary.test.com',
      priority: 1
    });
    
    this.cdnIntegration.managers.failover.registerProvider('test-fallback', {
      baseUrl: 'https://fallback.test.com',
      priority: 2
    });

    for (const test of tests) {
      const startTime = performance.now();
      
      for (let i = 0; i < test.count; i++) {
        switch (test.name) {
          case 'Health Check Processing':
            // Simulate health check results
            this.cdnIntegration.managers.failover.recordSuccessfulHealthCheck(
              'test-primary',
              Math.random() * 200 + 50 // 50-250ms response time
            );
            break;
          
          case 'Failover Decision':
            // Simulate provider failure
            this.cdnIntegration.managers.failover.recordFailedHealthCheck(
              'test-primary',
              new Error('Simulated failure')
            );
            break;
          
          case 'Recovery Detection':
            // Simulate recovery
            this.cdnIntegration.managers.failover.recordSuccessfulHealthCheck(
              'test-primary',
              120
            );
            break;
        }
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTime = duration / test.count;
      
      this.testResults.failover[test.name] = {
        totalTime: duration,
        averageTime: avgTime,
        operationsPerSecond: (test.count / duration) * 1000,
        passed: avgTime < this.performanceThresholds.failoverDetection,
        threshold: this.performanceThresholds.failoverDetection
      };
      
      console.log(`  ${test.name}: ${avgTime.toFixed(2)}ms avg`);
    }
  }

  /**
   * Test monitoring performance
   */
  async testMonitoringPerformance() {
    console.log('📊 Testing Monitoring Performance...');
    
    const tests = [
      { name: 'Metrics Recording', count: 10000 },
      { name: 'Real-time Metrics Retrieval', count: 5000 },
      { name: 'Performance Analysis', count: 1000 }
    ];

    this.testResults.monitoring = {};

    for (const test of tests) {
      const startTime = performance.now();
      
      for (let i = 0; i < test.count; i++) {
        switch (test.name) {
          case 'Metrics Recording':
            this.cdnIntegration.managers.monitoring.recordRequest({
              provider: 'test-provider',
              region: ['us-east', 'us-west', 'europe', 'asia'][i % 4],
              path: `/test/asset-${i}.jpg`,
              method: 'GET',
              status: [200, 404, 500][i % 3],
              responseTime: Math.random() * 500 + 50,
              bytes: Math.random() * 1024 * 1024 + 1024,
              cacheStatus: ['HIT', 'MISS'][i % 2]
            });
            break;
          
          case 'Real-time Metrics Retrieval':
            this.cdnIntegration.managers.monitoring.getRealTimeMetrics();
            break;
          
          case 'Performance Analysis':
            this.cdnIntegration.managers.monitoring.getPerformanceSummary({
              startTime: Date.now() - 3600000,
              endTime: Date.now()
            });
            break;
        }
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTime = duration / test.count;
      
      this.testResults.monitoring[test.name] = {
        totalTime: duration,
        averageTime: avgTime,
        operationsPerSecond: (test.count / duration) * 1000,
        passed: avgTime < this.performanceThresholds.monitoringUpdate,
        threshold: this.performanceThresholds.monitoringUpdate
      };
      
      console.log(`  ${test.name}: ${avgTime.toFixed(2)}ms avg (${((test.count / duration) * 1000).toFixed(0)} ops/sec)`);
    }
  }

  /**
   * Test overall system performance under load
   */
  async testOverallSystemPerformance() {
    console.log('🏗️ Testing Overall System Performance...');
    
    const concurrentUsers = 100;
    const requestsPerUser = 50;
    const totalRequests = concurrentUsers * requestsPerUser;
    
    console.log(`  Simulating ${concurrentUsers} concurrent users with ${requestsPerUser} requests each...`);
    
    const startTime = performance.now();
    const userPromises = [];
    
    for (let userId = 0; userId < concurrentUsers; userId++) {
      const userPromise = this.simulateUserSession(userId, requestsPerUser);
      userPromises.push(userPromise);
    }
    
    const results = await Promise.allSettled(userPromises);
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    this.testResults.overall = {
      totalRequests,
      concurrentUsers,
      duration,
      successful,
      failed,
      successRate: (successful / concurrentUsers) * 100,
      throughput: (totalRequests / duration) * 1000,
      averageResponseTime: duration / totalRequests
    };
    
    console.log(`  Completed ${totalRequests} requests in ${duration.toFixed(2)}ms`);
    console.log(`  Success rate: ${this.testResults.overall.successRate.toFixed(1)}%`);
    console.log(`  Throughput: ${this.testResults.overall.throughput.toFixed(0)} requests/sec`);
  }

  /**
   * Simulate a user session with mixed requests
   */
  async simulateUserSession(userId, requestCount) {
    const requests = [];
    
    for (let i = 0; i < requestCount; i++) {
      const requestType = Math.floor(Math.random() * 4);
      
      switch (requestType) {
        case 0: // URL generation
          requests.push(
            Promise.resolve(
              this.cdnIntegration.getCDNUrl(`/user/${userId}/asset-${i}.jpg`, {
                width: 800,
                height: 600,
                format: 'webp'
              })
            )
          );
          break;
        
        case 1: // Gaming asset
          requests.push(
            this.cdnIntegration.managers.gamingMedia.handleAssetRequest({
              assetPath: `/game/user-${userId}/texture-${i}.png`,
              assetType: 'textures',
              platform: 'web',
              quality: 'medium'
            })
          );
          break;
        
        case 2: // Security check
          requests.push(
            Promise.resolve(
              this.cdnIntegration.managers.security.checkRateLimit(`user-${userId}`)
            )
          );
          break;
        
        case 3: // Routing decision
          requests.push(
            Promise.resolve(
              this.cdnIntegration.managers.intelligentRouting.routeRequest({
                userContext: {
                  ip: `192.168.${userId % 255}.1`,
                  userAgent: 'Test User Agent',
                  country: 'US'
                },
                contentInfo: { type: 'image' }
              })
            )
          );
          break;
      }
    }
    
    return Promise.all(requests);
  }

  /**
   * Generate comprehensive performance report
   */
  generatePerformanceReport() {
    console.log('\n📋 CDN Performance Validation Report');
    console.log('=====================================\n');
    
    let overallPassed = true;
    const categories = Object.keys(this.testResults).filter(k => k !== 'overall');
    
    for (const category of categories) {
      console.log(`${category.toUpperCase()}:`);
      const categoryResults = this.testResults[category];
      
      for (const [testName, result] of Object.entries(categoryResults)) {
        if (result.error) {
          console.log(`  ❌ ${testName}: ERROR - ${result.error}`);
          overallPassed = false;
        } else {
          const status = result.passed ? '✅' : '❌';
          const avgTime = result.averageTime ? result.averageTime.toFixed(2) : 'N/A';
          const threshold = result.threshold ? result.threshold.toFixed(2) : 'N/A';
          
          console.log(`  ${status} ${testName}: ${avgTime}ms (threshold: ${threshold}ms)`);
          
          if (!result.passed) {
            overallPassed = false;
          }
        }
      }
      console.log('');
    }
    
    // Overall system performance
    if (this.testResults.overall.duration) {
      console.log('OVERALL SYSTEM PERFORMANCE:');
      const overall = this.testResults.overall;
      console.log(`  Total Requests: ${overall.totalRequests}`);
      console.log(`  Concurrent Users: ${overall.concurrentUsers}`);
      console.log(`  Duration: ${overall.duration.toFixed(2)}ms`);
      console.log(`  Success Rate: ${overall.successRate.toFixed(1)}%`);
      console.log(`  Throughput: ${overall.throughput.toFixed(0)} req/sec`);
      console.log(`  Avg Response Time: ${overall.averageResponseTime.toFixed(2)}ms`);
      console.log('');
    }
    
    // Summary
    console.log('VALIDATION SUMMARY:');
    if (overallPassed) {
      console.log('🎉 All performance tests PASSED!');
      console.log('   CDN system meets performance requirements.');
    } else {
      console.log('⚠️  Some performance tests FAILED!');
      console.log('   Review failed tests and optimize accordingly.');
    }
    
    console.log('\n📊 Performance validation completed.');
    
    return {
      passed: overallPassed,
      results: this.testResults
    };
  }

  /**
   * Cleanup and shutdown
   */
  async cleanup() {
    if (this.cdnIntegration) {
      await this.cdnIntegration.shutdown();
    }
    console.log('🧹 Performance validation cleanup completed.');
  }
}

/**
 * Main execution function
 */
async function runPerformanceValidation() {
  const validator = new CDNPerformanceValidator();
  
  try {
    await validator.initialize();
    const result = await validator.runValidation();
    
    // Exit with appropriate code
    process.exit(result.passed ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Performance validation failed:', error);
    process.exit(1);
  } finally {
    await validator.cleanup();
  }
}

// Run validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPerformanceValidation();
}

export { CDNPerformanceValidator };