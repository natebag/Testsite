#!/usr/bin/env node

/**
 * MLG.clan Gaming Platform - WebSocket Connection Load Testing
 * High-concurrency WebSocket testing for real-time gaming features
 */

import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MLGWebSocketLoadTester extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      connections: options.connections || 100,
      duration: options.duration || '5m',
      wsUrl: options.wsUrl || 'ws://localhost:3000',
      messageTypes: options.messageTypes || [
        'voting_updates',
        'clan_battle_events', 
        'tournament_brackets',
        'leaderboard_changes',
        'chat_messages'
      ],
      messageFrequency: options.messageFrequency || 2000, // ms between messages
      ...options
    };

    this.connections = new Map();
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      failedConnections: 0,
      messagesReceived: 0,
      messagesSent: 0,
      connectionLatencies: [],
      messageLatencies: [],
      disconnections: 0,
      errors: [],
      messagesByType: {},
      startTime: null,
      endTime: null
    };

    this.isRunning = false;
    this.messageScenarios = this.createMessageScenarios();
  }

  async run() {
    console.log('🌐 Starting MLG.clan WebSocket Load Testing');
    console.log(`🔗 Target: ${this.options.connections} concurrent WebSocket connections`);
    console.log(`⏱️  Duration: ${this.options.duration}`);
    console.log(`📡 WebSocket URL: ${this.options.wsUrl}`);

    this.metrics.startTime = Date.now();
    this.isRunning = true;

    try {
      // Create concurrent WebSocket connections
      await this.establishConnections();

      // Run load test scenarios
      await this.runLoadTestScenarios();

      this.metrics.endTime = Date.now();

      // Generate comprehensive report
      await this.generateReport();

      console.log('✅ WebSocket load testing completed');

    } catch (error) {
      console.error('❌ WebSocket load testing failed:', error);
      throw error;

    } finally {
      await this.cleanup();
    }
  }

  async establishConnections() {
    console.log(`🔌 Establishing ${this.options.connections} WebSocket connections...`);

    const connectionPromises = [];
    const batchSize = 50; // Connect in batches to avoid overwhelming the server

    for (let i = 0; i < this.options.connections; i += batchSize) {
      const batchEnd = Math.min(i + batchSize, this.options.connections);
      
      for (let j = i; j < batchEnd; j++) {
        connectionPromises.push(this.createConnection(j));
      }

      // Wait for batch to complete before starting next batch
      await Promise.allSettled(connectionPromises.splice(-batchSize));
      
      // Brief pause between batches
      await this.sleep(100);
      
      console.log(`  📊 Connected: ${Math.min(batchEnd, this.options.connections)}/${this.options.connections}`);
    }

    console.log(`✅ Established ${this.connections.size} WebSocket connections`);
    console.log(`❌ Failed connections: ${this.metrics.failedConnections}`);
  }

  async createConnection(connectionId) {
    const startTime = Date.now();
    
    try {
      const ws = new WebSocket(this.options.wsUrl, {
        handshakeTimeout: 10000,
        perMessageDeflate: false
      });

      const connectionData = {
        id: connectionId,
        ws: ws,
        connected: false,
        authenticated: false,
        messagesSent: 0,
        messagesReceived: 0,
        lastActivity: null,
        latencies: [],
        errors: []
      };

      // Connection event handlers
      ws.on('open', () => {
        const latency = Date.now() - startTime;
        connectionData.connected = true;
        connectionData.lastActivity = Date.now();
        
        this.metrics.totalConnections++;
        this.metrics.activeConnections++;
        this.metrics.connectionLatencies.push(latency);
        
        this.connections.set(connectionId, connectionData);
        
        // Send authentication message
        this.authenticateConnection(connectionData);
      });

      ws.on('message', (data) => {
        this.handleMessage(connectionData, data);
      });

      ws.on('close', (code, reason) => {
        this.handleDisconnection(connectionData, code, reason);
      });

      ws.on('error', (error) => {
        this.handleConnectionError(connectionData, error);
      });

      ws.on('pong', () => {
        connectionData.lastActivity = Date.now();
      });

    } catch (error) {
      this.metrics.failedConnections++;
      this.metrics.errors.push({
        type: 'connection_failed',
        connectionId,
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  authenticateConnection(connectionData) {
    const authMessage = {
      type: 'authenticate',
      token: `load_test_token_${connectionData.id}`,
      userId: `load_test_user_${connectionData.id}`,
      clientType: 'load_test'
    };

    this.sendMessage(connectionData, authMessage);
  }

  handleMessage(connectionData, rawData) {
    try {
      const message = JSON.parse(rawData.toString());
      connectionData.messagesReceived++;
      connectionData.lastActivity = Date.now();
      this.metrics.messagesReceived++;

      // Track message latency for messages with timestamps
      if (message.sentAt) {
        const latency = Date.now() - message.sentAt;
        connectionData.latencies.push(latency);
        this.metrics.messageLatencies.push(latency);
      }

      // Track messages by type
      if (message.type) {
        this.metrics.messagesByType[message.type] = 
          (this.metrics.messagesByType[message.type] || 0) + 1;
      }

      // Handle specific message types
      this.handleSpecificMessage(connectionData, message);

    } catch (error) {
      this.metrics.errors.push({
        type: 'message_parse_error',
        connectionId: connectionData.id,
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  handleSpecificMessage(connectionData, message) {
    switch (message.type) {
      case 'auth_success':
        connectionData.authenticated = true;
        break;
        
      case 'voting_update':
        // Simulate acknowledgment for voting updates
        if (Math.random() > 0.8) { // 20% acknowledgment rate
          this.sendMessage(connectionData, {
            type: 'vote_ack',
            voteId: message.voteId,
            timestamp: Date.now()
          });
        }
        break;
        
      case 'clan_battle_event':
        // Simulate clan member response
        if (Math.random() > 0.7) { // 30% response rate
          this.sendMessage(connectionData, {
            type: 'battle_action',
            battleId: message.battleId,
            action: 'participate',
            timestamp: Date.now()
          });
        }
        break;
        
      case 'tournament_bracket_update':
        // Acknowledge tournament updates
        this.sendMessage(connectionData, {
          type: 'bracket_viewed',
          tournamentId: message.tournamentId,
          timestamp: Date.now()
        });
        break;
    }
  }

  handleDisconnection(connectionData, code, reason) {
    connectionData.connected = false;
    this.metrics.activeConnections--;
    this.metrics.disconnections++;
    
    this.metrics.errors.push({
      type: 'disconnection',
      connectionId: connectionData.id,
      code,
      reason: reason.toString(),
      timestamp: Date.now()
    });
  }

  handleConnectionError(connectionData, error) {
    connectionData.errors.push({
      error: error.message,
      timestamp: Date.now()
    });
    
    this.metrics.errors.push({
      type: 'connection_error',
      connectionId: connectionData.id,
      error: error.message,
      timestamp: Date.now()
    });
  }

  async runLoadTestScenarios() {
    console.log('🎮 Starting WebSocket gaming scenarios...');
    
    const duration = this.parseDuration(this.options.duration);
    const endTime = Date.now() + duration * 1000;

    // Start message sending scenarios for all connections
    const scenarioPromises = Array.from(this.connections.values()).map(connectionData =>
      this.runConnectionScenario(connectionData, endTime)
    );

    // Start monitoring
    const monitoringPromise = this.monitorConnections(endTime);

    // Wait for all scenarios to complete
    await Promise.allSettled([...scenarioPromises, monitoringPromise]);

    console.log('✅ WebSocket scenarios completed');
  }

  async runConnectionScenario(connectionData, endTime) {
    // Wait for authentication
    let authAttempts = 0;
    while (!connectionData.authenticated && authAttempts < 50) {
      await this.sleep(100);
      authAttempts++;
    }

    if (!connectionData.authenticated) {
      console.warn(`⚠️  Connection ${connectionData.id} failed to authenticate`);
      return;
    }

    while (Date.now() < endTime && connectionData.connected && this.isRunning) {
      try {
        // Select and execute random gaming scenario
        const scenario = this.selectRandomScenario();
        await this.executeScenario(connectionData, scenario);

        // Random interval between messages
        const interval = this.options.messageFrequency + Math.random() * 1000;
        await this.sleep(interval);

      } catch (error) {
        connectionData.errors.push({
          error: error.message,
          timestamp: Date.now()
        });
      }
    }
  }

  selectRandomScenario() {
    const scenarios = Object.keys(this.messageScenarios);
    return scenarios[Math.floor(Math.random() * scenarios.length)];
  }

  async executeScenario(connectionData, scenarioName) {
    const scenario = this.messageScenarios[scenarioName];
    
    if (scenario && typeof scenario === 'function') {
      await scenario(connectionData);
    }
  }

  createMessageScenarios() {
    return {
      voting_session: async (connectionData) => {
        // Simulate joining a voting session
        await this.sendMessage(connectionData, {
          type: 'join_voting_room',
          contentId: `content_${Math.floor(Math.random() * 100)}`,
          timestamp: Date.now()
        });

        await this.sleep(Math.random() * 2000 + 1000);

        // Submit a vote
        await this.sendMessage(connectionData, {
          type: 'submit_vote',
          contentId: `content_${Math.floor(Math.random() * 100)}`,
          voteType: Math.random() > 0.5 ? 'up' : 'down',
          tokensToBurn: Math.floor(Math.random() * 20) + 5,
          timestamp: Date.now()
        });
      },

      clan_battle: async (connectionData) => {
        // Join clan battle room
        await this.sendMessage(connectionData, {
          type: 'join_clan_battle',
          battleId: `battle_${Math.floor(Math.random() * 10)}`,
          clanId: `clan_${Math.floor(Math.random() * 20)}`,
          timestamp: Date.now()
        });

        // Send battle actions
        for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
          await this.sleep(Math.random() * 1000 + 500);
          
          await this.sendMessage(connectionData, {
            type: 'battle_action',
            battleId: `battle_${Math.floor(Math.random() * 10)}`,
            action: ['attack', 'defend', 'special'][Math.floor(Math.random() * 3)],
            power: Math.floor(Math.random() * 100) + 10,
            timestamp: Date.now()
          });
        }
      },

      tournament_participation: async (connectionData) => {
        // Join tournament
        await this.sendMessage(connectionData, {
          type: 'join_tournament',
          tournamentId: `tournament_${Math.floor(Math.random() * 5)}`,
          timestamp: Date.now()
        });

        await this.sleep(Math.random() * 1500 + 500);

        // Submit match result
        await this.sendMessage(connectionData, {
          type: 'submit_match_result',
          tournamentId: `tournament_${Math.floor(Math.random() * 5)}`,
          matchId: `match_${Math.floor(Math.random() * 50)}`,
          result: Math.random() > 0.5 ? 'win' : 'lose',
          timestamp: Date.now()
        });
      },

      leaderboard_subscription: async (connectionData) => {
        // Subscribe to leaderboard updates
        await this.sendMessage(connectionData, {
          type: 'subscribe_leaderboard',
          leaderboardType: ['global', 'clan', 'weekly'][Math.floor(Math.random() * 3)],
          timestamp: Date.now()
        });

        await this.sleep(Math.random() * 3000 + 2000);

        // Unsubscribe
        await this.sendMessage(connectionData, {
          type: 'unsubscribe_leaderboard',
          leaderboardType: ['global', 'clan', 'weekly'][Math.floor(Math.random() * 3)],
          timestamp: Date.now()
        });
      },

      gaming_chat: async (connectionData) => {
        // Join chat room
        await this.sendMessage(connectionData, {
          type: 'join_chat',
          roomType: 'clan',
          roomId: `clan_${Math.floor(Math.random() * 20)}`,
          timestamp: Date.now()
        });

        // Send messages
        for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
          await this.sleep(Math.random() * 2000 + 1000);
          
          await this.sendMessage(connectionData, {
            type: 'chat_message',
            roomType: 'clan',
            roomId: `clan_${Math.floor(Math.random() * 20)}`,
            message: `Load test message ${Math.floor(Math.random() * 1000)}`,
            timestamp: Date.now()
          });
        }
      }
    };
  }

  async sendMessage(connectionData, message) {
    if (!connectionData.connected || connectionData.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      connectionData.ws.send(JSON.stringify(message));
      connectionData.messagesSent++;
      this.metrics.messagesSent++;
      connectionData.lastActivity = Date.now();
      return true;
      
    } catch (error) {
      connectionData.errors.push({
        error: `Send failed: ${error.message}`,
        timestamp: Date.now()
      });
      return false;
    }
  }

  async monitorConnections(endTime) {
    console.log('📊 Starting connection monitoring...');
    
    while (Date.now() < endTime && this.isRunning) {
      const activeCount = Array.from(this.connections.values())
        .filter(conn => conn.connected).length;
      
      const elapsed = Date.now() - this.metrics.startTime;
      const remaining = Math.max(0, endTime - Date.now());
      
      console.log(`📊 Status: ${activeCount}/${this.connections.size} active, ` +
                 `${this.metrics.messagesReceived} msgs received, ` +
                 `${this.metrics.messagesSent} msgs sent (${(remaining/1000).toFixed(0)}s remaining)`);

      // Send periodic ping to maintain connections
      if (elapsed % 30000 < 5000) { // Every 30 seconds
        this.pingConnections();
      }

      await this.sleep(5000); // Monitor every 5 seconds
    }
  }

  pingConnections() {
    for (const connectionData of this.connections.values()) {
      if (connectionData.connected && connectionData.ws.readyState === WebSocket.OPEN) {
        try {
          connectionData.ws.ping();
        } catch (error) {
          // Ignore ping errors
        }
      }
    }
  }

  async generateReport() {
    console.log('📋 Generating WebSocket load test report...');

    const totalDuration = this.metrics.endTime - this.metrics.startTime;
    const avgConnectionLatency = this.calculateAverage(this.metrics.connectionLatencies);
    const avgMessageLatency = this.calculateAverage(this.metrics.messageLatencies);
    const messagesPerSecond = this.metrics.messagesReceived / (totalDuration / 1000);

    const report = {
      timestamp: new Date().toISOString(),
      configuration: this.options,
      duration: `${Math.floor(totalDuration / 1000)}s`,
      summary: {
        targetConnections: this.options.connections,
        successfulConnections: this.metrics.totalConnections,
        failedConnections: this.metrics.failedConnections,
        connectionSuccessRate: `${((this.metrics.totalConnections / this.options.connections) * 100).toFixed(2)}%`,
        totalMessagesReceived: this.metrics.messagesReceived,
        totalMessagesSent: this.metrics.messagesSent,
        messagesPerSecond: messagesPerSecond.toFixed(2),
        disconnections: this.metrics.disconnections,
        totalErrors: this.metrics.errors.length
      },
      performance: {
        connectionLatency: {
          average: `${avgConnectionLatency.toFixed(2)}ms`,
          p95: `${this.calculatePercentile(this.metrics.connectionLatencies, 95).toFixed(2)}ms`,
          p99: `${this.calculatePercentile(this.metrics.connectionLatencies, 99).toFixed(2)}ms`
        },
        messageLatency: {
          average: `${avgMessageLatency.toFixed(2)}ms`,
          p95: `${this.calculatePercentile(this.metrics.messageLatencies, 95).toFixed(2)}ms`,
          p99: `${this.calculatePercentile(this.metrics.messageLatencies, 99).toFixed(2)}ms`
        },
        throughput: {
          messagesPerSecond: messagesPerSecond.toFixed(2),
          peakConcurrentConnections: Math.max(this.metrics.activeConnections, this.metrics.totalConnections)
        }
      },
      messageBreakdown: this.metrics.messagesByType,
      connectionStats: this.generateConnectionStats(),
      errorAnalysis: this.analyzeErrors(),
      recommendations: this.generateWebSocketRecommendations()
    };

    // Save report
    const reportPath = path.join(__dirname, '..', 'reports', `websocket-load-test-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Generate text report
    const textReport = this.generateTextReport(report);
    const textPath = path.join(__dirname, '..', 'reports', `websocket-load-test-${Date.now()}.txt`);
    await fs.writeFile(textPath, textReport);

    console.log(`📄 WebSocket report saved: ${reportPath}`);
    this.printReportSummary(report);
  }

  generateConnectionStats() {
    const connections = Array.from(this.connections.values());
    const activeConnections = connections.filter(c => c.connected);
    
    return {
      totalCreated: this.connections.size,
      currentlyActive: activeConnections.length,
      averageMessagesPerConnection: {
        sent: (this.metrics.messagesSent / this.connections.size).toFixed(2),
        received: (this.metrics.messagesReceived / this.connections.size).toFixed(2)
      },
      connectionUptime: this.calculateConnectionUptime(),
      topPerformers: connections
        .sort((a, b) => b.messagesReceived - a.messagesReceived)
        .slice(0, 5)
        .map(conn => ({
          connectionId: conn.id,
          messagesReceived: conn.messagesReceived,
          messagesSent: conn.messagesSent,
          errors: conn.errors.length
        }))
    };
  }

  calculateConnectionUptime() {
    const totalDuration = this.metrics.endTime - this.metrics.startTime;
    const connectionSeconds = this.metrics.totalConnections * (totalDuration / 1000);
    const disconnectionSeconds = this.metrics.disconnections * (totalDuration / 2000); // Estimate
    
    return {
      averageUptimePercentage: `${(((connectionSeconds - disconnectionSeconds) / connectionSeconds) * 100).toFixed(2)}%`,
      totalConnectionSeconds: Math.floor(connectionSeconds),
      estimatedDowntimeSeconds: Math.floor(disconnectionSeconds)
    };
  }

  analyzeErrors() {
    const errorsByType = {};
    this.metrics.errors.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
    });

    return {
      totalErrors: this.metrics.errors.length,
      errorsByType,
      errorRate: `${((this.metrics.errors.length / this.metrics.totalConnections) * 100).toFixed(2)}%`,
      commonErrors: Object.entries(errorsByType)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([type, count]) => ({ type, count }))
    };
  }

  generateWebSocketRecommendations() {
    const recommendations = [];
    const connectionSuccessRate = (this.metrics.totalConnections / this.options.connections) * 100;
    const avgMessageLatency = this.calculateAverage(this.metrics.messageLatencies);

    if (connectionSuccessRate < 95) {
      recommendations.push('Investigate connection failures and implement connection retry logic');
    }

    if (avgMessageLatency > 200) {
      recommendations.push('Optimize WebSocket message processing and consider message queuing');
    }

    if (this.metrics.disconnections > this.metrics.totalConnections * 0.1) {
      recommendations.push('Implement WebSocket heartbeat mechanism for connection stability');
    }

    // Gaming-specific recommendations
    recommendations.push('Implement message priority queues for critical gaming events');
    recommendations.push('Consider WebSocket connection pooling for clan battle coordination');
    recommendations.push('Use message compression for large tournament bracket updates');
    recommendations.push('Implement graceful degradation when WebSocket connections are unavailable');
    recommendations.push('Monitor WebSocket memory usage under sustained high-message loads');

    return recommendations;
  }

  generateTextReport(report) {
    return `
🌐 MLG.clan WebSocket Load Test Report
======================================

⏰ Generated: ${report.timestamp}
⌛ Duration: ${report.duration}
🎯 Configuration: ${report.configuration.connections} target connections

📊 SUMMARY
----------
Successful Connections: ${report.summary.successfulConnections}/${report.summary.targetConnections}
Connection Success Rate: ${report.summary.connectionSuccessRate}
Messages Received: ${report.summary.totalMessagesReceived}
Messages Sent: ${report.summary.totalMessagesSent}
Messages/Second: ${report.summary.messagesPerSecond}
Disconnections: ${report.summary.disconnections}
Total Errors: ${report.summary.totalErrors}

⚡ PERFORMANCE
--------------
Avg Connection Latency: ${report.performance.connectionLatency.average}
P95 Connection Latency: ${report.performance.connectionLatency.p95}
Avg Message Latency: ${report.performance.messageLatency.average}
P95 Message Latency: ${report.performance.messageLatency.p95}
Peak Concurrent Connections: ${report.performance.throughput.peakConcurrentConnections}

📈 MESSAGE BREAKDOWN
--------------------
${Object.entries(report.messageBreakdown).map(([type, count]) => `${type}: ${count}`).join('\n')}

💡 RECOMMENDATIONS
------------------
${report.recommendations.map(rec => `• ${rec}`).join('\n')}
`;
  }

  printReportSummary(report) {
    console.log('\n🌐 MLG.clan WebSocket Load Test Results');
    console.log('=======================================');
    console.log(`🔗 ${report.summary.successfulConnections}/${report.summary.targetConnections} connections (${report.summary.connectionSuccessRate} success)`);
    console.log(`📨 ${report.summary.totalMessagesReceived} messages received`);
    console.log(`📤 ${report.summary.totalMessagesSent} messages sent`);
    console.log(`⚡ ${report.summary.messagesPerSecond} messages/second`);
    console.log(`⏱️  ${report.performance.connectionLatency.average} avg connection latency`);
    console.log(`📊 ${report.performance.messageLatency.average} avg message latency`);
    
    if (report.summary.totalErrors > 0) {
      console.log(`❌ ${report.summary.totalErrors} total errors occurred`);
    }
  }

  calculateAverage(array) {
    if (!array || array.length === 0) return 0;
    return array.reduce((sum, val) => sum + val, 0) / array.length;
  }

  calculatePercentile(sortedArray, percentile) {
    if (!sortedArray || sortedArray.length === 0) return 0;
    const sorted = [...sortedArray].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
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
    console.log('🧹 Cleaning up WebSocket connections...');
    this.isRunning = false;

    // Close all connections
    for (const connectionData of this.connections.values()) {
      if (connectionData.ws && connectionData.connected) {
        try {
          connectionData.ws.close(1000, 'Load test completed');
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }

    this.connections.clear();
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
    } else if (arg.startsWith('--url=')) {
      options.wsUrl = arg.split('=')[1];
    }
  });

  const loadTester = new MLGWebSocketLoadTester(options);
  
  try {
    await loadTester.run();
    process.exit(0);
  } catch (error) {
    console.error('❌ WebSocket load test failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default MLGWebSocketLoadTester;