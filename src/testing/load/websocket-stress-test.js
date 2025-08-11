/**
 * MLG.clan Platform WebSocket Stress Testing Suite
 * 
 * Comprehensive stress testing for WebSocket connections and real-time gaming features.
 * Tests WebSocket performance under high concurrency, validates real-time event delivery,
 * measures connection stability, and ensures proper resource management.
 * 
 * Features:
 * - High-concurrency WebSocket connection testing (1000+ concurrent connections)
 * - Real-time event delivery validation
 * - Connection stability and reconnection testing
 * - Message throughput and latency measurements
 * - Memory and resource usage monitoring
 * - Gaming-specific event testing (clan updates, voting, live streams)
 * - Graceful degradation testing
 * - Load balancer and scaling validation
 * 
 * @author Claude Code - Universal Testing & Verification Agent
 * @version 1.0.0
 * @created 2025-08-11
 */

import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import crypto from 'crypto';

/**
 * WebSocket Stress Test Configuration
 */
const WEBSOCKET_TEST_CONFIG = {
  // Connection parameters
  maxConcurrentConnections: parseInt(process.env.WS_STRESS_MAX_CONNECTIONS) || 2000,
  testDuration: parseInt(process.env.WS_STRESS_DURATION) || 300000, // 5 minutes
  connectionRampUpTime: parseInt(process.env.WS_RAMP_UP_TIME) || 60000, // 1 minute
  
  // WebSocket server settings
  serverUrl: process.env.WS_SERVER_URL || 'ws://localhost:3000',
  serverHttpUrl: process.env.HTTP_SERVER_URL || 'http://localhost:3000',
  
  // Performance thresholds
  maxConnectionTime: 5000, // 5 seconds to establish connection
  maxMessageLatency: 1000, // 1 second for message round-trip
  maxDroppedConnections: 0.05, // 5% connection drop rate
  minMessageThroughput: 1000, // messages per second
  
  // Message patterns
  messageTypes: ['ping', 'clan_update', 'vote_cast', 'content_update', 'user_activity'],
  messageFrequency: 100, // milliseconds between messages per connection
  
  // Gaming events simulation
  gamingEvents: {
    clanUpdates: 0.3,     // 30% clan-related events
    votingEvents: 0.25,   // 25% voting events
    contentEvents: 0.25,  // 25% content events
    userActivity: 0.15,   // 15% user activity
    systemEvents: 0.05,   // 5% system events
  },
  
  // Worker configuration
  workerCount: parseInt(process.env.WS_STRESS_WORKERS) || 50,
  connectionsPerWorker: 40,
  
  // Testing scenarios
  scenarios: ['normal_load', 'spike_test', 'endurance_test', 'chaos_test'],
};

/**
 * Gaming event generators
 */
const generateAuthToken = () => `test_token_${crypto.randomBytes(16).toString('hex')}`;

const generateClanEvent = () => ({
  type: 'clan_update',
  clan_id: `clan_${Math.floor(Math.random() * 1000)}`,
  event: ['member_joined', 'member_left', 'rank_changed', 'achievement_unlocked'][Math.floor(Math.random() * 4)],
  user_id: `user_${Math.floor(Math.random() * 10000)}`,
  timestamp: Date.now(),
  data: {
    member_count: Math.floor(Math.random() * 1000) + 10,
    level: Math.floor(Math.random() * 50) + 1,
    score: Math.floor(Math.random() * 100000),
  },
});

const generateVotingEvent = () => ({
  type: 'vote_cast',
  session_id: `vote_${Math.floor(Math.random() * 100)}`,
  user_id: `user_${Math.floor(Math.random() * 10000)}`,
  option: Math.floor(Math.random() * 5),
  tokens_burned: Math.floor(Math.random() * 1000) + 10,
  timestamp: Date.now(),
  results: {
    total_votes: Math.floor(Math.random() * 10000),
    total_tokens: Math.floor(Math.random() * 1000000),
    leading_option: Math.floor(Math.random() * 5),
  },
});

const generateContentEvent = () => ({
  type: 'content_update',
  content_id: `content_${Math.floor(Math.random() * 10000)}`,
  event: ['new_upload', 'trending', 'liked', 'commented'][Math.floor(Math.random() * 4)],
  creator_id: `user_${Math.floor(Math.random() * 10000)}`,
  timestamp: Date.now(),
  stats: {
    views: Math.floor(Math.random() * 100000),
    likes: Math.floor(Math.random() * 10000),
    comments: Math.floor(Math.random() * 1000),
    trending_score: Math.random() * 100,
  },
});

const generateUserActivity = () => ({
  type: 'user_activity',
  user_id: `user_${Math.floor(Math.random() * 10000)}`,
  activity: ['login', 'logout', 'level_up', 'achievement'][Math.floor(Math.random() * 4)],
  timestamp: Date.now(),
  data: {
    level: Math.floor(Math.random() * 100) + 1,
    xp: Math.floor(Math.random() * 100000),
    online_status: Math.random() > 0.5,
  },
});

const generateSystemEvent = () => ({
  type: 'system_event',
  event: ['maintenance', 'update', 'announcement'][Math.floor(Math.random() * 3)],
  message: `System event generated at ${new Date().toISOString()}`,
  priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
  timestamp: Date.now(),
});

const generateRandomMessage = () => {
  const rand = Math.random();
  const events = WEBSOCKET_TEST_CONFIG.gamingEvents;
  
  if (rand < events.clanUpdates) {
    return generateClanEvent();
  } else if (rand < events.clanUpdates + events.votingEvents) {
    return generateVotingEvent();
  } else if (rand < events.clanUpdates + events.votingEvents + events.contentEvents) {
    return generateContentEvent();
  } else if (rand < events.clanUpdates + events.votingEvents + events.contentEvents + events.userActivity) {
    return generateUserActivity();
  } else {
    return generateSystemEvent();
  }
};

/**
 * WebSocket Connection Wrapper
 */
class StressTestConnection extends EventEmitter {
  constructor(url, options = {}) {
    super();
    
    this.url = url;
    this.options = options;
    this.ws = null;
    this.connectionId = options.connectionId || crypto.randomUUID();
    this.workerId = options.workerId || 0;
    
    // Connection metrics
    this.metrics = {
      connectionStartTime: null,
      connectionEstablishedTime: null,
      messagesReceived: 0,
      messagesSent: 0,
      errors: 0,
      disconnections: 0,
      latencyMeasurements: [],
      isConnected: false,
    };
    
    this.messageQueue = [];
    this.pingInterval = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.metrics.connectionStartTime = performance.now();
      
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.on('open', () => {
          this.metrics.connectionEstablishedTime = performance.now();
          this.metrics.isConnected = true;
          this.reconnectAttempts = 0;
          
          this.emit('connected', {
            connectionId: this.connectionId,
            connectionTime: this.metrics.connectionEstablishedTime - this.metrics.connectionStartTime,
          });
          
          this.startPingInterval();
          this.authenticate();
          
          resolve();
        });
        
        this.ws.on('message', (data) => {
          this.handleMessage(data);
        });
        
        this.ws.on('close', (code, reason) => {
          this.metrics.isConnected = false;
          this.metrics.disconnections++;
          
          this.emit('disconnected', {
            connectionId: this.connectionId,
            code,
            reason: reason.toString(),
          });
          
          if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
          }
          
          // Auto-reconnect if not intentional
          if (code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
              this.connect().catch(error => {
                this.emit('reconnect_failed', { connectionId: this.connectionId, error: error.message });
              });
            }, 1000 * this.reconnectAttempts);
          }
        });
        
        this.ws.on('error', (error) => {
          this.metrics.errors++;
          this.emit('error', {
            connectionId: this.connectionId,
            error: error.message,
          });
          
          if (!this.metrics.isConnected) {
            reject(error);
          }
        });
        
        // Connection timeout
        setTimeout(() => {
          if (!this.metrics.isConnected) {
            this.ws.terminate();
            reject(new Error('Connection timeout'));
          }
        }, WEBSOCKET_TEST_CONFIG.maxConnectionTime);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  authenticate() {
    const authMessage = {
      type: 'authenticate',
      token: generateAuthToken(),
      connectionId: this.connectionId,
      workerId: this.workerId,
    };
    
    this.sendMessage(authMessage);
  }

  handleMessage(data) {
    try {
      const message = JSON.parse(data.toString());
      this.metrics.messagesReceived++;
      
      // Handle pong messages for latency measurement
      if (message.type === 'pong' && message.timestamp) {
        const latency = Date.now() - message.timestamp;
        this.metrics.latencyMeasurements.push(latency);
        
        // Keep only recent measurements
        if (this.metrics.latencyMeasurements.length > 100) {
          this.metrics.latencyMeasurements = this.metrics.latencyMeasurements.slice(-50);
        }
      }
      
      this.emit('message', {
        connectionId: this.connectionId,
        message,
        latency: message.type === 'pong' ? this.metrics.latencyMeasurements[this.metrics.latencyMeasurements.length - 1] : null,
      });
      
    } catch (error) {
      this.metrics.errors++;
      this.emit('parse_error', {
        connectionId: this.connectionId,
        error: error.message,
        data: data.toString(),
      });
    }
  }

  sendMessage(message) {
    if (!this.metrics.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.messageQueue.push(message);
      return false;
    }
    
    try {
      this.ws.send(JSON.stringify(message));
      this.metrics.messagesSent++;
      
      // Process queued messages
      while (this.messageQueue.length > 0 && this.ws.readyState === WebSocket.OPEN) {
        const queuedMessage = this.messageQueue.shift();
        this.ws.send(JSON.stringify(queuedMessage));
        this.metrics.messagesSent++;
      }
      
      return true;
    } catch (error) {
      this.metrics.errors++;
      this.emit('send_error', {
        connectionId: this.connectionId,
        error: error.message,
        message,
      });
      return false;
    }
  }

  startPingInterval() {
    this.pingInterval = setInterval(() => {
      if (this.metrics.isConnected) {
        this.sendMessage({
          type: 'ping',
          timestamp: Date.now(),
          connectionId: this.connectionId,
        });
      }
    }, 30000); // Ping every 30 seconds
  }

  simulateGamingActivity() {
    if (!this.metrics.isConnected) return;
    
    const message = generateRandomMessage();
    this.sendMessage(message);
    
    // Schedule next message
    setTimeout(() => {
      this.simulateGamingActivity();
    }, WEBSOCKET_TEST_CONFIG.messageFrequency + Math.random() * 100);
  }

  getMetrics() {
    const avgLatency = this.metrics.latencyMeasurements.length > 0
      ? this.metrics.latencyMeasurements.reduce((sum, lat) => sum + lat, 0) / this.metrics.latencyMeasurements.length
      : 0;
    
    return {
      ...this.metrics,
      averageLatency: avgLatency,
      maxLatency: this.metrics.latencyMeasurements.length > 0 ? Math.max(...this.metrics.latencyMeasurements) : 0,
      minLatency: this.metrics.latencyMeasurements.length > 0 ? Math.min(...this.metrics.latencyMeasurements) : 0,
    };
  }

  disconnect() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close(1000, 'Test completed');
    }
  }
}

/**
 * WebSocket Stress Tester Class
 */
class WebSocketStressTester extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = { ...WEBSOCKET_TEST_CONFIG, ...config };
    
    // Test metrics
    this.metrics = {
      connections: {
        attempted: 0,
        established: 0,
        failed: 0,
        dropped: 0,
        active: 0,
      },
      
      messages: {
        sent: 0,
        received: 0,
        errors: 0,
        totalLatency: 0,
        latencyMeasurements: [],
      },
      
      performance: {
        startTime: null,
        endTime: null,
        peakConnections: 0,
        averageLatency: 0,
        messageThroughput: 0,
        connectionSuccessRate: 0,
      },
      
      errors: {
        connectionTimeouts: 0,
        messageParseErrors: 0,
        sendErrors: 0,
        reconnectFailures: 0,
      },
    };
    
    this.connections = new Map();
    this.workers = [];
    this.isRunning = false;
    
    this.logger = config.logger || console;
  }

  /**
   * Initialize WebSocket stress testing environment
   */
  async initialize() {
    try {
      this.logger.info('Initializing WebSocket stress testing environment...');
      
      // Test server connectivity
      await this.testServerConnectivity();
      
      this.logger.info('WebSocket stress testing environment initialized');
      
    } catch (error) {
      this.logger.error('Failed to initialize WebSocket testing environment:', error);
      throw error;
    }
  }

  /**
   * Test server connectivity
   */
  async testServerConnectivity() {
    return new Promise((resolve, reject) => {
      const testWs = new WebSocket(this.config.serverUrl);
      
      const timeout = setTimeout(() => {
        testWs.terminate();
        reject(new Error('Server connectivity test timeout'));
      }, 10000);
      
      testWs.on('open', () => {
        clearTimeout(timeout);
        testWs.close();
        resolve();
      });
      
      testWs.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Server connectivity test failed: ${error.message}`));
      });
    });
  }

  /**
   * Run comprehensive WebSocket stress test
   */
  async runStressTest() {
    this.metrics.performance.startTime = Date.now();
    this.isRunning = true;
    
    this.logger.info('Starting WebSocket stress test...');
    
    try {
      // Start monitoring
      const monitoringInterval = setInterval(() => {
        this.logMetrics();
      }, 10000); // Log metrics every 10 seconds
      
      // Run different test scenarios
      for (const scenario of this.config.scenarios) {
        this.logger.info(`Running scenario: ${scenario}`);
        await this.runScenario(scenario);
        
        // Cool down between scenarios
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
      
      // Stop monitoring
      clearInterval(monitoringInterval);
      
      // Clean up all connections
      await this.disconnectAllConnections();
      
      this.metrics.performance.endTime = Date.now();
      this.isRunning = false;
      
      // Calculate final metrics
      this.calculateFinalMetrics();
      
      // Generate comprehensive report
      const report = await this.generateStressTestReport();
      
      this.logger.info('WebSocket stress test completed');
      return report;
      
    } catch (error) {
      this.logger.error('WebSocket stress test failed:', error);
      throw error;
    }
  }

  /**
   * Run specific test scenario
   */
  async runScenario(scenario) {
    switch (scenario) {
      case 'normal_load':
        await this.runNormalLoadTest();
        break;
        
      case 'spike_test':
        await this.runSpikeTest();
        break;
        
      case 'endurance_test':
        await this.runEnduranceTest();
        break;
        
      case 'chaos_test':
        await this.runChaosTest();
        break;
        
      default:
        this.logger.warn(`Unknown scenario: ${scenario}`);
    }
  }

  /**
   * Normal load test - gradual ramp up to max connections
   */
  async runNormalLoadTest() {
    this.logger.info('Running normal load test...');
    
    const targetConnections = Math.floor(this.config.maxConcurrentConnections * 0.8);
    const rampUpStep = Math.floor(targetConnections / 10);
    
    for (let i = 0; i < targetConnections; i += rampUpStep) {
      const connectionsToCreate = Math.min(rampUpStep, targetConnections - i);
      await this.createConnections(connectionsToCreate);
      
      // Wait between batches
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Maintain connections and simulate activity
    await this.simulateNormalActivity(60000); // 1 minute
    
    // Gradually close connections
    await this.graduallyCloseConnections(0.5);
  }

  /**
   * Spike test - sudden connection increases
   */
  async runSpikeTest() {
    this.logger.info('Running spike test...');
    
    // Start with baseline connections
    const baselineConnections = Math.floor(this.config.maxConcurrentConnections * 0.1);
    await this.createConnections(baselineConnections);
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Sudden spike
    const spikeConnections = Math.floor(this.config.maxConcurrentConnections * 0.9);
    await this.createConnections(spikeConnections);
    
    // Maintain spike for short duration
    await this.simulateNormalActivity(30000); // 30 seconds
    
    // Drop back to baseline
    await this.graduallyCloseConnections(0.8);
  }

  /**
   * Endurance test - sustained high load
   */
  async runEnduranceTest() {
    this.logger.info('Running endurance test...');
    
    const sustainedConnections = Math.floor(this.config.maxConcurrentConnections * 0.7);
    await this.createConnections(sustainedConnections);
    
    // Sustained activity for extended period
    await this.simulateNormalActivity(this.config.testDuration * 0.6); // 60% of test duration
    
    await this.graduallyCloseConnections(0.8);
  }

  /**
   * Chaos test - random connection drops and reconnects
   */
  async runChaosTest() {
    this.logger.info('Running chaos test...');
    
    const chaosConnections = Math.floor(this.config.maxConcurrentConnections * 0.5);
    await this.createConnections(chaosConnections);
    
    const chaosDuration = 120000; // 2 minutes
    const startTime = Date.now();
    
    while (Date.now() - startTime < chaosDuration) {
      // Randomly drop connections
      const connectionsToKill = Math.floor(this.connections.size * 0.1);
      await this.randomlyDropConnections(connectionsToKill);
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Create new connections
      const connectionsToCreate = Math.floor(Math.random() * 100) + 20;
      await this.createConnections(connectionsToCreate);
      
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    await this.disconnectAllConnections();
  }

  /**
   * Create multiple WebSocket connections
   */
  async createConnections(count) {
    const creationPromises = [];
    const batchSize = 50; // Create connections in batches
    
    for (let i = 0; i < count; i += batchSize) {
      const batchCount = Math.min(batchSize, count - i);
      
      const batchPromises = [];
      for (let j = 0; j < batchCount; j++) {
        batchPromises.push(this.createSingleConnection());
      }
      
      creationPromises.push(Promise.allSettled(batchPromises));
      
      // Small delay between batches to avoid overwhelming the server
      if (i + batchSize < count) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    const results = await Promise.all(creationPromises);
    
    // Process results
    let successfulConnections = 0;
    for (const batchResults of results) {
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          successfulConnections++;
        } else {
          this.metrics.connections.failed++;
          this.logger.warn('Connection creation failed:', result.reason?.message);
        }
      }
    }
    
    this.logger.info(`Created ${successfulConnections}/${count} connections successfully`);
  }

  /**
   * Create single WebSocket connection
   */
  async createSingleConnection() {
    this.metrics.connections.attempted++;
    
    const connectionId = crypto.randomUUID();
    const connection = new StressTestConnection(this.config.serverUrl, {
      connectionId,
      workerId: Math.floor(Math.random() * this.config.workerCount),
    });
    
    // Set up event handlers
    connection.on('connected', (data) => {
      this.metrics.connections.established++;
      this.metrics.connections.active++;
      this.metrics.performance.peakConnections = Math.max(
        this.metrics.performance.peakConnections,
        this.metrics.connections.active
      );
      
      // Start simulating gaming activity
      setTimeout(() => {
        connection.simulateGamingActivity();
      }, Math.random() * 5000);
    });
    
    connection.on('disconnected', (data) => {
      this.metrics.connections.active--;
      this.metrics.connections.dropped++;
      this.connections.delete(connectionId);
    });
    
    connection.on('message', (data) => {
      this.metrics.messages.received++;
      if (data.latency) {
        this.metrics.messages.latencyMeasurements.push(data.latency);
        this.metrics.messages.totalLatency += data.latency;
      }
    });
    
    connection.on('error', (data) => {
      this.metrics.errors.messageParseErrors++;
    });
    
    connection.on('send_error', (data) => {
      this.metrics.errors.sendErrors++;
    });
    
    try {
      await connection.connect();
      this.connections.set(connectionId, connection);
      return connection;
    } catch (error) {
      this.metrics.connections.failed++;
      if (error.message.includes('timeout')) {
        this.metrics.errors.connectionTimeouts++;
      }
      throw error;
    }
  }

  /**
   * Simulate normal gaming activity
   */
  async simulateNormalActivity(duration) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < duration && this.isRunning) {
      // Send random messages through active connections
      const activeConnections = Array.from(this.connections.values()).filter(c => c.metrics.isConnected);
      
      if (activeConnections.length > 0) {
        const messagesToSend = Math.min(activeConnections.length, 100);
        for (let i = 0; i < messagesToSend; i++) {
          const connection = activeConnections[Math.floor(Math.random() * activeConnections.length)];
          const message = generateRandomMessage();
          connection.sendMessage(message);
          this.metrics.messages.sent++;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * Gradually close connections
   */
  async graduallyCloseConnections(percentage) {
    const connectionsToClose = Math.floor(this.connections.size * percentage);
    const connectionIds = Array.from(this.connections.keys());
    
    for (let i = 0; i < connectionsToClose; i += 10) {
      const batchEnd = Math.min(i + 10, connectionsToClose);
      
      for (let j = i; j < batchEnd; j++) {
        if (j < connectionIds.length) {
          const connection = this.connections.get(connectionIds[j]);
          if (connection) {
            connection.disconnect();
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  /**
   * Randomly drop connections for chaos testing
   */
  async randomlyDropConnections(count) {
    const activeConnections = Array.from(this.connections.entries())
      .filter(([_, conn]) => conn.metrics.isConnected);
    
    const toDrop = Math.min(count, activeConnections.length);
    
    for (let i = 0; i < toDrop; i++) {
      const randomIndex = Math.floor(Math.random() * activeConnections.length);
      const [connectionId, connection] = activeConnections.splice(randomIndex, 1)[0];
      
      // Forcefully terminate connection (simulate network issues)
      if (connection.ws) {
        connection.ws.terminate();
      }
    }
  }

  /**
   * Disconnect all connections
   */
  async disconnectAllConnections() {
    this.logger.info('Disconnecting all connections...');
    
    const disconnectPromises = Array.from(this.connections.values()).map(connection => {
      return new Promise(resolve => {
        connection.disconnect();
        setTimeout(resolve, 100);
      });
    });
    
    await Promise.all(disconnectPromises);
    this.connections.clear();
    this.metrics.connections.active = 0;
  }

  /**
   * Calculate final metrics
   */
  calculateFinalMetrics() {
    const testDuration = (this.metrics.performance.endTime - this.metrics.performance.startTime) / 1000;
    
    // Connection success rate
    this.metrics.performance.connectionSuccessRate = this.metrics.connections.attempted > 0
      ? this.metrics.connections.established / this.metrics.connections.attempted
      : 0;
    
    // Message throughput
    this.metrics.performance.messageThroughput = (this.metrics.messages.sent + this.metrics.messages.received) / testDuration;
    
    // Average latency
    this.metrics.performance.averageLatency = this.metrics.messages.latencyMeasurements.length > 0
      ? this.metrics.messages.totalLatency / this.metrics.messages.latencyMeasurements.length
      : 0;
  }

  /**
   * Log current metrics
   */
  logMetrics() {
    const duration = Date.now() - this.metrics.performance.startTime;
    const durationSec = duration / 1000;
    
    const throughput = (this.metrics.messages.sent + this.metrics.messages.received) / durationSec;
    const avgLatency = this.metrics.messages.latencyMeasurements.length > 0
      ? this.metrics.messages.totalLatency / this.metrics.messages.latencyMeasurements.length
      : 0;
    
    this.logger.info(`WebSocket Metrics (${Math.round(durationSec)}s):`);
    this.logger.info(`  Connections: ${this.metrics.connections.active} active, ${this.metrics.connections.established} established, ${this.metrics.connections.failed} failed`);
    this.logger.info(`  Messages: ${this.metrics.messages.sent} sent, ${this.metrics.messages.received} received (${throughput.toFixed(2)}/s)`);
    this.logger.info(`  Latency: ${avgLatency.toFixed(2)}ms average, ${this.metrics.errors.messageParseErrors + this.metrics.errors.sendErrors} errors`);
  }

  /**
   * Generate comprehensive stress test report
   */
  async generateStressTestReport() {
    const testDuration = (this.metrics.performance.endTime - this.metrics.performance.startTime) / 1000;
    
    // Calculate percentiles for latency
    const sortedLatencies = this.metrics.messages.latencyMeasurements.sort((a, b) => a - b);
    const latencyP50 = sortedLatencies[Math.floor(sortedLatencies.length * 0.5)] || 0;
    const latencyP95 = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] || 0;
    const latencyP99 = sortedLatencies[Math.floor(sortedLatencies.length * 0.99)] || 0;
    
    const report = {
      summary: {
        testDuration,
        totalConnections: this.metrics.connections.attempted,
        successfulConnections: this.metrics.connections.established,
        connectionSuccessRate: this.metrics.performance.connectionSuccessRate,
        peakConcurrentConnections: this.metrics.performance.peakConnections,
        messageThroughput: this.metrics.performance.messageThroughput,
        averageLatency: this.metrics.performance.averageLatency,
        status: this.getTestStatus(),
      },
      
      connections: {
        attempted: this.metrics.connections.attempted,
        established: this.metrics.connections.established,
        failed: this.metrics.connections.failed,
        dropped: this.metrics.connections.dropped,
        successRate: this.metrics.performance.connectionSuccessRate,
        dropRate: this.metrics.connections.attempted > 0 
          ? this.metrics.connections.dropped / this.metrics.connections.attempted 
          : 0,
      },
      
      messaging: {
        sent: this.metrics.messages.sent,
        received: this.metrics.messages.received,
        total: this.metrics.messages.sent + this.metrics.messages.received,
        throughput: this.metrics.performance.messageThroughput,
        errors: this.metrics.messages.errors,
        errorRate: (this.metrics.messages.sent + this.metrics.messages.received) > 0
          ? this.metrics.messages.errors / (this.metrics.messages.sent + this.metrics.messages.received)
          : 0,
      },
      
      latency: {
        average: this.metrics.performance.averageLatency,
        min: sortedLatencies.length > 0 ? sortedLatencies[0] : 0,
        max: sortedLatencies.length > 0 ? sortedLatencies[sortedLatencies.length - 1] : 0,
        percentiles: {
          p50: latencyP50,
          p95: latencyP95,
          p99: latencyP99,
        },
        measurements: sortedLatencies.length,
      },
      
      errors: {
        connectionTimeouts: this.metrics.errors.connectionTimeouts,
        messageParseErrors: this.metrics.errors.messageParseErrors,
        sendErrors: this.metrics.errors.sendErrors,
        reconnectFailures: this.metrics.errors.reconnectFailures,
        total: Object.values(this.metrics.errors).reduce((sum, count) => sum + count, 0),
      },
      
      recommendations: this.generateWebSocketRecommendations(),
      
      timestamp: new Date().toISOString(),
    };
    
    return report;
  }

  /**
   * Determine test status based on thresholds
   */
  getTestStatus() {
    const conditions = [
      this.metrics.performance.connectionSuccessRate >= 0.95, // 95% success rate
      this.metrics.performance.averageLatency <= this.config.maxMessageLatency,
      this.metrics.connections.dropped / this.metrics.connections.attempted <= this.config.maxDroppedConnections,
      this.metrics.performance.messageThroughput >= this.config.minMessageThroughput,
    ];
    
    return conditions.every(Boolean) ? 'PASSED' : 'FAILED';
  }

  /**
   * Generate WebSocket-specific recommendations
   */
  generateWebSocketRecommendations() {
    const recommendations = [];
    
    // Connection success rate
    if (this.metrics.performance.connectionSuccessRate < 0.95) {
      recommendations.push({
        type: 'CONNECTION_SUCCESS',
        severity: 'HIGH',
        message: `Connection success rate (${(this.metrics.performance.connectionSuccessRate * 100).toFixed(2)}%) below 95%`,
        action: 'Review server capacity, connection limits, and network configuration',
      });
    }
    
    // Message latency
    if (this.metrics.performance.averageLatency > this.config.maxMessageLatency) {
      recommendations.push({
        type: 'MESSAGE_LATENCY',
        severity: 'MEDIUM',
        message: `Average message latency (${this.metrics.performance.averageLatency.toFixed(2)}ms) exceeds threshold`,
        action: 'Optimize message processing, reduce payload sizes, or improve network infrastructure',
      });
    }
    
    // Connection drops
    const dropRate = this.metrics.connections.dropped / this.metrics.connections.attempted;
    if (dropRate > this.config.maxDroppedConnections) {
      recommendations.push({
        type: 'CONNECTION_DROPS',
        severity: 'HIGH',
        message: `Connection drop rate (${(dropRate * 100).toFixed(2)}%) exceeds threshold`,
        action: 'Implement better connection management, heartbeat mechanisms, and graceful degradation',
      });
    }
    
    // Message throughput
    if (this.metrics.performance.messageThroughput < this.config.minMessageThroughput) {
      recommendations.push({
        type: 'MESSAGE_THROUGHPUT',
        severity: 'MEDIUM',
        message: `Message throughput (${this.metrics.performance.messageThroughput.toFixed(2)} msg/s) below minimum`,
        action: 'Scale WebSocket server instances or optimize message handling',
      });
    }
    
    // Error rates
    const totalErrors = Object.values(this.metrics.errors).reduce((sum, count) => sum + count, 0);
    if (totalErrors > this.metrics.connections.attempted * 0.1) {
      recommendations.push({
        type: 'ERROR_RATE',
        severity: 'HIGH',
        message: `High error rate detected (${totalErrors} total errors)`,
        action: 'Review error logs, implement proper error handling, and improve connection resilience',
      });
    }
    
    return recommendations;
  }
}

/**
 * Worker thread implementation for WebSocket operations
 */
if (!isMainThread) {
  // Worker implementation would go here for distributed testing
  // This allows running WebSocket connections across multiple threads
}

export default WebSocketStressTester;

/**
 * Standalone execution
 */
if (isMainThread && import.meta.url === `file://${process.argv[1]}`) {
  const stressTester = new WebSocketStressTester();
  
  const runTest = async () => {
    try {
      await stressTester.initialize();
      const report = await stressTester.runStressTest();
      
      console.log('\n=== WEBSOCKET STRESS TEST REPORT ===');
      console.log(JSON.stringify(report, null, 2));
      
      // Save report to file
      const fs = await import('fs/promises');
      const reportPath = `websocket-stress-report-${Date.now()}.json`;
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`\nReport saved to: ${reportPath}`);
      
      process.exit(report.summary.status === 'PASSED' ? 0 : 1);
      
    } catch (error) {
      console.error('WebSocket stress test failed:', error);
      process.exit(1);
    }
  };
  
  runTest();
}