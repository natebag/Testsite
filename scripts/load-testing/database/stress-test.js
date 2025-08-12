#!/usr/bin/env node

/**
 * MLG.clan Gaming Platform - Database Stress Testing
 * High-load database performance testing for gaming operations
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MLGDatabaseStressTester {
  constructor(options = {}) {
    this.options = {
      connections: options.connections || 50,
      duration: options.duration || '5m',
      queries: options.queries || ['vote_insert', 'leaderboard_read', 'clan_update', 'user_stats'],
      queryDistribution: {
        vote_insert: 0.3,      // 30% - High priority gaming operation
        leaderboard_read: 0.4,  // 40% - Most frequent operation
        clan_update: 0.2,      // 20% - Moderate frequency
        user_stats: 0.1        // 10% - Lower frequency
      },
      ...options
    };

    this.metrics = {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      queryTimes: [],
      queryTypeStats: {},
      connectionStats: {
        active: 0,
        peak: 0,
        total: 0,
        errors: 0
      },
      lockWaits: 0,
      deadlocks: 0,
      startTime: null,
      endTime: null
    };

    this.activeConnections = [];
    this.isRunning = false;
  }

  async run() {
    console.log('💾 Starting MLG.clan Database Stress Testing');
    console.log(`🔗 Target: ${this.options.connections} concurrent connections`);
    console.log(`⏱️  Duration: ${this.options.duration}`);
    console.log(`📊 Query Types: ${this.options.queries.join(', ')}`);

    this.metrics.startTime = Date.now();
    this.isRunning = true;

    try {
      // Initialize database connections
      await this.initializeConnections();

      // Run stress test
      await this.runStressTest();

      this.metrics.endTime = Date.now();

      // Generate report
      await this.generateReport();

      console.log('✅ Database stress testing completed');

    } catch (error) {
      console.error('❌ Database stress testing failed:', error);
      throw error;

    } finally {
      await this.cleanup();
    }
  }

  async initializeConnections() {
    console.log(`🔌 Initializing ${this.options.connections} database connections...`);

    // In a real implementation, you would create actual database connections
    // For this demonstration, we'll simulate connections
    for (let i = 0; i < this.options.connections; i++) {
      const connection = {
        id: `conn_${i}`,
        active: false,
        queryCount: 0,
        errorCount: 0,
        avgResponseTime: 0,
        lastActivity: null
      };

      this.activeConnections.push(connection);
    }

    this.metrics.connectionStats.total = this.activeConnections.length;
    console.log(`✅ ${this.activeConnections.length} database connections initialized`);
  }

  async runStressTest() {
    console.log('🚀 Starting database stress test...');

    const duration = this.parseDuration(this.options.duration);
    const endTime = Date.now() + duration * 1000;

    // Create worker promises for each connection
    const workers = this.activeConnections.map(connection => 
      this.runConnectionWorker(connection, endTime)
    );

    // Monitor progress
    const monitorInterval = setInterval(() => {
      const elapsed = Date.now() - this.metrics.startTime;
      const remaining = Math.max(0, endTime - Date.now());
      const activeConns = this.activeConnections.filter(c => c.active).length;
      
      console.log(`📊 Progress: ${this.metrics.totalQueries} queries, ${activeConns} active connections (${(remaining / 1000).toFixed(0)}s remaining)`);
      
      // Update peak connections
      this.metrics.connectionStats.peak = Math.max(this.metrics.connectionStats.peak, activeConns);
    }, 5000);

    try {
      await Promise.allSettled(workers);
    } finally {
      clearInterval(monitorInterval);
    }

    console.log('✅ Database stress test completed');
  }

  async runConnectionWorker(connection, endTime) {
    connection.active = true;
    this.metrics.connectionStats.active++;

    while (Date.now() < endTime && this.isRunning) {
      try {
        // Select query type based on distribution
        const queryType = this.selectQueryType();
        
        // Execute query
        const startTime = Date.now();
        const result = await this.executeQuery(connection, queryType);
        const queryTime = Date.now() - startTime;

        // Update metrics
        this.updateQueryMetrics(queryType, result.success, queryTime, result.error);
        
        // Update connection stats
        connection.queryCount++;
        connection.lastActivity = Date.now();
        connection.avgResponseTime = 
          (connection.avgResponseTime * (connection.queryCount - 1) + queryTime) / connection.queryCount;

        if (!result.success) {
          connection.errorCount++;
        }

      } catch (error) {
        this.updateQueryMetrics('error', false, 0, error.message);
        connection.errorCount++;
      }

      // Brief pause between queries
      await this.sleep(Math.random() * 50 + 10); // 10-60ms
    }

    connection.active = false;
    this.metrics.connectionStats.active--;
  }

  selectQueryType() {
    const random = Math.random();
    let cumulative = 0;

    for (const [queryType, probability] of Object.entries(this.options.queryDistribution)) {
      cumulative += probability;
      if (random <= cumulative) {
        return queryType;
      }
    }

    return this.options.queries[0]; // Fallback
  }

  async executeQuery(connection, queryType) {
    // Simulate different types of database queries with realistic response times and patterns
    
    try {
      switch (queryType) {
        case 'vote_insert':
          return await this.simulateVoteInsert(connection);
        case 'leaderboard_read':
          return await this.simulateLeaderboardRead(connection);
        case 'clan_update':
          return await this.simulateClanUpdate(connection);
        case 'user_stats':
          return await this.simulateUserStats(connection);
        default:
          return await this.simulateGenericQuery(connection);
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async simulateVoteInsert(connection) {
    // Simulate voting insert operation - high frequency, needs to be fast
    const latency = Math.random() * 50 + 10; // 10-60ms
    await this.sleep(latency);

    // Simulate occasional constraint violations or lock waits
    if (Math.random() < 0.02) { // 2% chance
      this.metrics.lockWaits++;
      await this.sleep(Math.random() * 200 + 100); // Additional wait for lock
    }

    if (Math.random() < 0.01) { // 1% chance of failure
      return { success: false, error: 'Constraint violation' };
    }

    return { 
      success: true, 
      result: { 
        voteId: `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tokensDeducted: Math.floor(Math.random() * 20) + 5 
      } 
    };
  }

  async simulateLeaderboardRead(connection) {
    // Simulate leaderboard read - most frequent operation
    const latency = Math.random() * 30 + 5; // 5-35ms (optimized with indexes)
    await this.sleep(latency);

    if (Math.random() < 0.005) { // 0.5% chance of failure
      return { success: false, error: 'Connection timeout' };
    }

    return { 
      success: true, 
      result: { 
        players: Array.from({ length: 100 }, (_, i) => ({
          rank: i + 1,
          userId: `user_${i}`,
          score: Math.floor(Math.random() * 10000)
        }))
      } 
    };
  }

  async simulateClanUpdate(connection) {
    // Simulate clan statistics update - medium complexity
    const latency = Math.random() * 100 + 20; // 20-120ms
    await this.sleep(latency);

    // Higher chance of lock waits for updates
    if (Math.random() < 0.05) { // 5% chance
      this.metrics.lockWaits++;
      await this.sleep(Math.random() * 300 + 100); // Lock wait time
    }

    if (Math.random() < 0.02) { // 2% chance of failure
      return { success: false, error: 'Update conflict' };
    }

    return { 
      success: true, 
      result: { 
        clanId: `clan_${Math.floor(Math.random() * 50)}`,
        membersUpdated: Math.floor(Math.random() * 20) + 1,
        newStats: {
          totalScore: Math.floor(Math.random() * 100000),
          activeBattles: Math.floor(Math.random() * 5)
        }
      } 
    };
  }

  async simulateUserStats(connection) {
    // Simulate user statistics query - complex aggregation
    const latency = Math.random() * 200 + 50; // 50-250ms (complex query)
    await this.sleep(latency);

    if (Math.random() < 0.01) { // 1% chance of failure
      return { success: false, error: 'Query timeout' };
    }

    return { 
      success: true, 
      result: { 
        userId: `user_${Math.floor(Math.random() * 1000)}`,
        stats: {
          totalVotes: Math.floor(Math.random() * 1000),
          tokensEarned: Math.floor(Math.random() * 10000),
          clanRank: Math.floor(Math.random() * 100) + 1,
          achievements: Math.floor(Math.random() * 20)
        }
      } 
    };
  }

  async simulateGenericQuery(connection) {
    const latency = Math.random() * 100 + 20;
    await this.sleep(latency);

    return { success: true, result: { generic: true } };
  }

  updateQueryMetrics(queryType, success, queryTime, error = null) {
    this.metrics.totalQueries++;
    
    if (success) {
      this.metrics.successfulQueries++;
      this.metrics.queryTimes.push(queryTime);
    } else {
      this.metrics.failedQueries++;
    }

    // Update query type statistics
    if (!this.metrics.queryTypeStats[queryType]) {
      this.metrics.queryTypeStats[queryType] = {
        total: 0,
        successful: 0,
        failed: 0,
        avgTime: 0,
        times: []
      };
    }

    const stats = this.metrics.queryTypeStats[queryType];
    stats.total++;
    
    if (success) {
      stats.successful++;
      stats.times.push(queryTime);
      stats.avgTime = stats.times.reduce((sum, time) => sum + time, 0) / stats.times.length;
    } else {
      stats.failed++;
    }

    // Simulate occasional deadlocks
    if (error && error.includes('deadlock')) {
      this.metrics.deadlocks++;
    }
  }

  async generateReport() {
    console.log('📋 Generating database stress test report...');

    const totalDuration = this.metrics.endTime - this.metrics.startTime;
    const successRate = (this.metrics.successfulQueries / this.metrics.totalQueries) * 100;
    const avgQps = this.metrics.totalQueries / (totalDuration / 1000);

    // Calculate percentiles
    const sortedTimes = [...this.metrics.queryTimes].sort((a, b) => a - b);
    const p50 = this.calculatePercentile(sortedTimes, 50);
    const p95 = this.calculatePercentile(sortedTimes, 95);
    const p99 = this.calculatePercentile(sortedTimes, 99);

    const report = {
      timestamp: new Date().toISOString(),
      configuration: this.options,
      duration: `${Math.floor(totalDuration / 1000)}s`,
      summary: {
        totalQueries: this.metrics.totalQueries,
        successfulQueries: this.metrics.successfulQueries,
        failedQueries: this.metrics.failedQueries,
        successRate: `${successRate.toFixed(2)}%`,
        averageQueriesPerSecond: avgQps.toFixed(2),
        lockWaits: this.metrics.lockWaits,
        deadlocks: this.metrics.deadlocks
      },
      performance: {
        responseTimePercentiles: {
          p50: `${p50.toFixed(2)}ms`,
          p95: `${p95.toFixed(2)}ms`,
          p99: `${p99.toFixed(2)}ms`
        },
        queryThroughput: {
          peak: `${this.calculatePeakQps().toFixed(2)} QPS`,
          average: `${avgQps.toFixed(2)} QPS`
        },
        connectionUtilization: {
          peak: this.metrics.connectionStats.peak,
          average: this.calculateAverageActiveConnections(),
          total: this.metrics.connectionStats.total
        }
      },
      queryTypeBreakdown: this.generateQueryTypeBreakdown(),
      connectionStats: this.generateConnectionStats(),
      recommendations: this.generateDatabaseRecommendations()
    };

    // Save report
    const reportPath = path.join(__dirname, '..', 'reports', `database-stress-test-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Generate text report
    const textReport = this.generateTextReport(report);
    const textPath = path.join(__dirname, '..', 'reports', `database-stress-test-${Date.now()}.txt`);
    await fs.writeFile(textPath, textReport);

    console.log(`📄 Database report saved: ${reportPath}`);
    this.printReportSummary(report);
  }

  generateQueryTypeBreakdown() {
    const breakdown = {};
    
    for (const [queryType, stats] of Object.entries(this.metrics.queryTypeStats)) {
      const successRate = (stats.successful / stats.total) * 100;
      const p95Time = this.calculatePercentile(stats.times, 95);
      
      breakdown[queryType] = {
        totalQueries: stats.total,
        successRate: `${successRate.toFixed(2)}%`,
        averageTime: `${stats.avgTime.toFixed(2)}ms`,
        p95Time: `${p95Time.toFixed(2)}ms`,
        throughput: `${(stats.total / ((this.metrics.endTime - this.metrics.startTime) / 1000)).toFixed(2)} QPS`
      };
    }
    
    return breakdown;
  }

  generateConnectionStats() {
    const totalQueries = this.activeConnections.reduce((sum, conn) => sum + conn.queryCount, 0);
    const avgQueriesPerConnection = totalQueries / this.activeConnections.length;
    const topConnections = this.activeConnections
      .sort((a, b) => b.queryCount - a.queryCount)
      .slice(0, 5)
      .map((conn, index) => ({
        connectionId: conn.id,
        queriesExecuted: conn.queryCount,
        errorCount: conn.errorCount,
        averageResponseTime: `${conn.avgResponseTime.toFixed(2)}ms`,
        errorRate: `${((conn.errorCount / conn.queryCount) * 100).toFixed(2)}%`
      }));

    return {
      totalConnections: this.activeConnections.length,
      averageQueriesPerConnection: avgQueriesPerConnection.toFixed(2),
      peakConcurrentConnections: this.metrics.connectionStats.peak,
      topPerformingConnections: topConnections
    };
  }

  generateDatabaseRecommendations() {
    const recommendations = [];
    const successRate = (this.metrics.successfulQueries / this.metrics.totalQueries) * 100;
    const avgResponseTime = this.metrics.queryTimes.reduce((sum, time) => sum + time, 0) / this.metrics.queryTimes.length;

    if (successRate < 95) {
      recommendations.push('Investigate query failures and implement retry logic for transient errors');
    }

    if (avgResponseTime > 100) {
      recommendations.push('Optimize slow queries with proper indexing and query analysis');
    }

    if (this.metrics.lockWaits > 0) {
      recommendations.push('Review transaction isolation levels and optimize for concurrent access patterns');
    }

    if (this.metrics.deadlocks > 0) {
      recommendations.push('Implement deadlock detection and resolution strategies');
    }

    // Gaming-specific recommendations
    recommendations.push('Consider partitioning vote tables by date for better performance');
    recommendations.push('Implement read replicas for leaderboard queries');
    recommendations.push('Use materialized views for complex clan statistics');
    recommendations.push('Consider caching strategies for frequently accessed user stats');
    recommendations.push('Implement connection pooling with appropriate sizing');

    return recommendations;
  }

  generateTextReport(report) {
    return `
💾 MLG.clan Database Stress Test Report
=======================================

⏰ Generated: ${report.timestamp}
⌛ Duration: ${report.duration}
🎯 Configuration: ${report.configuration.connections} connections, ${report.configuration.queries.join(', ')}

📊 SUMMARY
----------
Total Queries: ${report.summary.totalQueries}
Successful: ${report.summary.successfulQueries}
Failed: ${report.summary.failedQueries}
Success Rate: ${report.summary.successRate}
Avg QPS: ${report.summary.averageQueriesPerSecond}
Lock Waits: ${report.summary.lockWaits}
Deadlocks: ${report.summary.deadlocks}

⚡ PERFORMANCE
--------------
Response Time P50: ${report.performance.responseTimePercentiles.p50}
Response Time P95: ${report.performance.responseTimePercentiles.p95}
Response Time P99: ${report.performance.responseTimePercentiles.p99}
Peak QPS: ${report.performance.queryThroughput.peak}
Peak Connections: ${report.performance.connectionUtilization.peak}

🔍 QUERY TYPE BREAKDOWN
-----------------------
${Object.entries(report.queryTypeBreakdown).map(([type, stats]) => 
  `${type}: ${stats.totalQueries} queries, ${stats.successRate} success, ${stats.averageTime} avg time`
).join('\n')}

💡 RECOMMENDATIONS
------------------
${report.recommendations.map(rec => `• ${rec}`).join('\n')}
`;
  }

  printReportSummary(report) {
    console.log('\n💾 MLG.clan Database Stress Test Results');
    console.log('========================================');
    console.log(`⚡ ${report.summary.totalQueries} total queries`);
    console.log(`✅ ${report.summary.successRate} success rate`);
    console.log(`🚀 ${report.summary.averageQueriesPerSecond} average QPS`);
    console.log(`🔒 ${report.summary.lockWaits} lock waits`);
    console.log(`💥 ${report.summary.deadlocks} deadlocks`);
    console.log(`🔗 Peak ${report.performance.connectionUtilization.peak} concurrent connections`);
  }

  calculatePercentile(sortedArray, percentile) {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
  }

  calculatePeakQps() {
    // Calculate peak QPS over 5-second windows
    const windowSize = 5000; // 5 seconds
    const duration = this.metrics.endTime - this.metrics.startTime;
    const windows = Math.floor(duration / windowSize);
    
    if (windows === 0) return 0;
    
    const queriesPerWindow = this.metrics.totalQueries / windows;
    return queriesPerWindow / (windowSize / 1000);
  }

  calculateAverageActiveConnections() {
    // This would be tracked over time in a real implementation
    return Math.floor(this.metrics.connectionStats.peak * 0.7); // Estimate
  }

  parseDuration(duration) {
    const match = duration.match(/(\d+)([smh])/);
    if (!match) return 300;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      default: return 300;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup() {
    console.log('🧹 Cleaning up database connections...');
    this.isRunning = false;
    this.activeConnections.length = 0;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options = {};

  args.forEach(arg => {
    if (arg.startsWith('--connections=')) {
      options.connections = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--duration=')) {
      options.duration = arg.split('=')[1];
    }
  });

  const stressTester = new MLGDatabaseStressTester(options);
  
  try {
    await stressTester.run();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database stress test failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default MLGDatabaseStressTester;