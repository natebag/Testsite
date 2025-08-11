/**
 * MLG.clan Platform Performance Worker
 * 
 * Worker thread implementation for performance testing load generation.
 * Executes various performance test scenarios and reports metrics back
 * to the main performance benchmark process.
 * 
 * @author Claude Code - Universal Testing & Verification Agent
 * @version 1.0.0
 * @created 2025-08-11
 */

import { performance } from 'perf_hooks';
import { parentPort } from 'worker_threads';
import crypto from 'crypto';

/**
 * Performance test scenarios
 */
const TEST_SCENARIOS = {
  api_endpoints: [
    { endpoint: '/api/users/profile', method: 'GET', category: 'api_endpoints' },
    { endpoint: '/api/clans', method: 'GET', category: 'api_endpoints' },
    { endpoint: '/api/content/trending', method: 'GET', category: 'api_endpoints' },
    { endpoint: '/api/voting/sessions', method: 'GET', category: 'api_endpoints' },
    { endpoint: '/api/transactions', method: 'GET', category: 'api_endpoints' },
  ],
  
  database_operations: [
    { operation: 'user_query', category: 'database_operations' },
    { operation: 'clan_query', category: 'database_operations' },
    { operation: 'content_query', category: 'database_operations' },
    { operation: 'complex_join', category: 'database_operations' },
    { operation: 'aggregation', category: 'database_operations' },
  ],
  
  cache_operations: [
    { operation: 'cache_get', category: 'cache_operations' },
    { operation: 'cache_set', category: 'cache_operations' },
    { operation: 'cache_delete', category: 'cache_operations' },
    { operation: 'cache_bulk_get', category: 'cache_operations' },
  ],
  
  gaming_operations: [
    { operation: 'burn_to_vote', category: 'gaming_operations' },
    { operation: 'clan_join', category: 'gaming_operations' },
    { operation: 'content_submission', category: 'gaming_operations' },
    { operation: 'leaderboard_update', category: 'gaming_operations' },
  ],
};

/**
 * Performance Worker Class
 */
export class PerformanceWorker {
  constructor(workload, config) {
    this.workload = workload;
    this.config = config;
    this.isRunning = false;
    this.startTime = null;
    this.requestCount = 0;
    
    // Performance tracking
    this.metrics = {
      requests: 0,
      errors: 0,
      totalResponseTime: 0,
      responseTimes: [],
    };
  }

  /**
   * Run worker load generation
   */
  async run() {
    this.isRunning = true;
    this.startTime = Date.now();
    
    const { requestCount, requestInterval, duration, pattern } = this.workload;
    const endTime = this.startTime + duration;
    
    try {
      // Generate load based on pattern
      if (pattern === 'stress' || pattern === 'concurrent_stress') {
        await this.runConcurrentLoad(requestCount, endTime);
      } else {
        await this.runSequentialLoad(requestCount, requestInterval, endTime);
      }
      
    } catch (error) {
      parentPort.postMessage({
        type: 'error_occurred',
        data: {
          workerId: this.workload.workerId,
          error: error.message,
          operation: 'worker_run',
        }
      });
    }
    
    this.isRunning = false;
  }

  /**
   * Run sequential load generation
   */
  async runSequentialLoad(requestCount, requestInterval, endTime) {
    for (let i = 0; i < requestCount && Date.now() < endTime && this.isRunning; i++) {
      const scenario = this.selectScenario();
      await this.executeScenario(scenario);
      
      // Wait for next request interval
      if (i < requestCount - 1 && Date.now() < endTime) {
        await new Promise(resolve => setTimeout(resolve, requestInterval));
      }
    }
  }

  /**
   * Run concurrent load generation
   */
  async runConcurrentLoad(requestCount, endTime) {
    const concurrentRequests = [];
    const maxConcurrency = 50; // Limit concurrent requests per worker
    
    for (let i = 0; i < requestCount && Date.now() < endTime && this.isRunning; i++) {
      if (concurrentRequests.length >= maxConcurrency) {
        // Wait for some requests to complete
        await Promise.race(concurrentRequests);
        concurrentRequests.splice(0, Math.floor(maxConcurrency / 2));
      }
      
      const scenario = this.selectScenario();
      const requestPromise = this.executeScenario(scenario)
        .then(() => {
          // Remove from concurrent array when complete
          const index = concurrentRequests.indexOf(requestPromise);
          if (index > -1) {
            concurrentRequests.splice(index, 1);
          }
        })
        .catch(error => {
          // Handle individual request errors
          this.recordError(scenario.category, error);
        });
      
      concurrentRequests.push(requestPromise);
      
      // Small delay between request initiation
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Wait for all remaining requests
    await Promise.allSettled(concurrentRequests);
  }

  /**
   * Select test scenario based on pattern
   */
  selectScenario() {
    const { pattern } = this.workload;
    
    // Pattern-specific scenario selection
    switch (pattern) {
      case 'cpu_stress':
        return this.selectFromCategory(['database_operations', 'gaming_operations']);
        
      case 'memory_stress':
        return this.selectFromCategory(['cache_operations', 'database_operations']);
        
      case 'io_stress':
        return this.selectFromCategory(['api_endpoints', 'database_operations']);
        
      default:
        // Random scenario from all categories
        const allScenarios = Object.values(TEST_SCENARIOS).flat();
        return allScenarios[Math.floor(Math.random() * allScenarios.length)];
    }
  }

  /**
   * Select scenario from specific categories
   */
  selectFromCategory(categories) {
    const availableScenarios = categories
      .flatMap(category => TEST_SCENARIOS[category] || []);
    
    if (availableScenarios.length === 0) {
      return TEST_SCENARIOS.api_endpoints[0]; // Fallback
    }
    
    return availableScenarios[Math.floor(Math.random() * availableScenarios.length)];
  }

  /**
   * Execute test scenario
   */
  async executeScenario(scenario) {
    const startTime = performance.now();
    let success = true;
    let error = null;
    
    try {
      switch (scenario.category) {
        case 'api_endpoints':
          await this.executeApiRequest(scenario);
          break;
          
        case 'database_operations':
          await this.executeDatabaseOperation(scenario);
          break;
          
        case 'cache_operations':
          await this.executeCacheOperation(scenario);
          break;
          
        case 'websocket_operations':
          await this.executeWebSocketOperation(scenario);
          break;
          
        case 'gaming_operations':
          await this.executeGamingOperation(scenario);
          break;
          
        default:
          await this.executeDefaultOperation(scenario);
      }
      
    } catch (err) {
      success = false;
      error = err;
      this.metrics.errors++;
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    this.metrics.requests++;
    this.metrics.totalResponseTime += duration;
    this.metrics.responseTimes.push(duration);
    
    // Report to main process
    parentPort.postMessage({
      type: 'request_completed',
      data: {
        category: scenario.category,
        operation: scenario.operation || scenario.endpoint,
        duration,
        success,
        error,
        workerId: this.workload.workerId,
      }
    });
    
    // Send performance metrics periodically
    if (this.metrics.requests % 100 === 0) {
      this.sendPerformanceMetrics();
    }
  }

  /**
   * Execute API request
   */
  async executeApiRequest(scenario) {
    const { endpoint, method } = scenario;
    
    // Simulate HTTP request
    const requestTime = this.simulateNetworkLatency();
    
    // Simulate request processing
    await this.simulateProcessingTime(20, 100);
    
    // Simulate response parsing
    await this.simulateProcessingTime(5, 20);
    
    // Add network latency
    await new Promise(resolve => setTimeout(resolve, requestTime));
  }

  /**
   * Execute database operation
   */
  async executeDatabaseOperation(scenario) {
    const { operation } = scenario;
    
    switch (operation) {
      case 'user_query':
        await this.simulateProcessingTime(10, 50);
        break;
        
      case 'clan_query':
        await this.simulateProcessingTime(15, 75);
        break;
        
      case 'content_query':
        await this.simulateProcessingTime(20, 100);
        break;
        
      case 'complex_join':
        await this.simulateProcessingTime(50, 200);
        break;
        
      case 'aggregation':
        await this.simulateProcessingTime(30, 150);
        break;
        
      default:
        await this.simulateProcessingTime(10, 60);
    }
    
    // Simulate database I/O
    const ioTime = Math.random() * 20 + 5; // 5-25ms
    await new Promise(resolve => setTimeout(resolve, ioTime));
  }

  /**
   * Execute cache operation
   */
  async executeCacheOperation(scenario) {
    const { operation } = scenario;
    
    switch (operation) {
      case 'cache_get':
        // Fast cache hit
        await this.simulateProcessingTime(1, 5);
        break;
        
      case 'cache_set':
        // Moderate cache write
        await this.simulateProcessingTime(2, 10);
        break;
        
      case 'cache_delete':
        // Fast cache delete
        await this.simulateProcessingTime(1, 3);
        break;
        
      case 'cache_bulk_get':
        // Bulk operation - more time
        await this.simulateProcessingTime(5, 25);
        break;
        
      default:
        await this.simulateProcessingTime(1, 5);
    }
  }

  /**
   * Execute WebSocket operation
   */
  async executeWebSocketOperation(scenario) {
    // Simulate WebSocket message exchange
    await this.simulateProcessingTime(5, 15);
    
    // Add network round-trip
    const networkTime = this.simulateNetworkLatency();
    await new Promise(resolve => setTimeout(resolve, networkTime));
  }

  /**
   * Execute gaming-specific operation
   */
  async executeGamingOperation(scenario) {
    const { operation } = scenario;
    
    switch (operation) {
      case 'burn_to_vote':
        // Complex transaction with multiple steps
        await this.simulateProcessingTime(50, 200);
        // Blockchain interaction delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
        break;
        
      case 'clan_join':
        // Multi-step process with validation
        await this.simulateProcessingTime(30, 100);
        break;
        
      case 'content_submission':
        // File processing simulation
        await this.simulateProcessingTime(100, 500);
        break;
        
      case 'leaderboard_update':
        // Calculation and ranking update
        await this.simulateProcessingTime(20, 80);
        break;
        
      default:
        await this.simulateProcessingTime(25, 100);
    }
  }

  /**
   * Execute default operation
   */
  async executeDefaultOperation(scenario) {
    // Generic operation simulation
    await this.simulateProcessingTime(10, 50);
  }

  /**
   * Simulate processing time with CPU-intensive work
   */
  async simulateProcessingTime(minMs, maxMs) {
    const duration = Math.random() * (maxMs - minMs) + minMs;
    const endTime = performance.now() + duration;
    
    // Simulate CPU work
    while (performance.now() < endTime) {
      // Light computational work
      Math.sqrt(Math.random() * 1000000);
    }
  }

  /**
   * Simulate network latency
   */
  simulateNetworkLatency() {
    // Simulate realistic network conditions
    const baseLatency = 20; // 20ms base
    const jitter = Math.random() * 30; // 0-30ms jitter
    const occasional_spike = Math.random() < 0.05 ? Math.random() * 200 : 0; // 5% chance of spike
    
    return baseLatency + jitter + occasional_spike;
  }

  /**
   * Record error for reporting
   */
  recordError(category, error) {
    parentPort.postMessage({
      type: 'error_occurred',
      data: {
        category,
        error: error.message,
        workerId: this.workload.workerId,
      }
    });
  }

  /**
   * Send performance metrics to main process
   */
  sendPerformanceMetrics() {
    const metrics = {
      workerId: this.workload.workerId,
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      avgResponseTime: this.metrics.totalResponseTime / this.metrics.requests,
      recentResponseTimes: this.metrics.responseTimes.slice(-50), // Last 50 measurements
      memoryUsage: process.memoryUsage(),
    };
    
    parentPort.postMessage({
      type: 'performance_measurement',
      data: {
        category: 'worker_metrics',
        operation: 'performance_update',
        metrics,
      }
    });
  }
}

export default PerformanceWorker;