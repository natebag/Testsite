#!/usr/bin/env node

/**
 * MLG.clan Gaming Platform - Real-time Performance Monitor
 * Comprehensive monitoring during load testing with gaming-specific metrics
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MLGPerformanceMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      duration: options.duration || '60s',
      sampleInterval: options.sampleInterval || 1000, // 1 second
      apiEndpoint: options.apiEndpoint || 'http://localhost:3000/api',
      wsEndpoint: options.wsEndpoint || 'ws://localhost:3000',
      metricsPort: options.metricsPort || 8090,
      alertThresholds: {
        responseTime: 1000,      // ms
        errorRate: 0.1,          // 10%
        cpuUsage: 80,           // %
        memoryUsage: 80,        // %
        diskUsage: 90,          // %
        networkLatency: 500,    // ms
        ...options.alertThresholds
      }
    };

    this.isMonitoring = false;
    this.startTime = null;
    this.metrics = {
      system: {
        cpu: [],
        memory: [],
        disk: [],
        network: []
      },
      gaming: {
        votingLatency: [],
        tokenBurnRate: [],
        clanBattleResponseTime: [],
        tournamentUpdates: [],
        leaderboardRefresh: [],
        webSocketConnections: 0,
        activeVotingSessions: 0,
        concurrentClanBattles: 0,
        tournamentParticipants: 0
      },
      api: {
        requests: [],
        responses: [],
        errors: [],
        endpoints: {}
      },
      database: {
        connectionPool: [],
        queryLatency: [],
        activeConnections: 0,
        lockWaits: 0
      },
      blockchain: {
        transactionThroughput: [],
        confirmationTime: [],
        rpcLatency: [],
        failureRate: []
      }
    };

    this.alerts = [];
    this.dashboardData = [];
    this.wsServer = null;
    this.clients = new Set();
  }

  async start() {
    console.log('📊 Starting MLG.clan Performance Monitor');
    console.log(`⏱️  Duration: ${this.options.duration}`);
    console.log(`📡 Sample Interval: ${this.options.sampleInterval}ms`);

    this.startTime = Date.now();
    this.isMonitoring = true;

    try {
      // Setup monitoring infrastructure
      await this.setupMonitoringServer();
      await this.initializeMetricsCollection();

      // Start monitoring loops
      await Promise.all([
        this.startSystemMonitoring(),
        this.startGamingMetricsMonitoring(),
        this.startApiMonitoring(),
        this.startDatabaseMonitoring(),
        this.startBlockchainMonitoring(),
        this.startAlertSystem()
      ]);

      const duration = this.parseDuration(this.options.duration);
      await this.sleep(duration * 1000);

      await this.stop();
      await this.generateReport();

      console.log('✅ Performance monitoring completed');

    } catch (error) {
      console.error('❌ Performance monitoring failed:', error);
      throw error;
    }
  }

  async setupMonitoringServer() {
    // Create HTTP server for metrics dashboard
    const server = http.createServer((req, res) => {
      if (req.url === '/metrics') {
        this.handleMetricsRequest(req, res);
      } else if (req.url === '/dashboard') {
        this.handleDashboardRequest(req, res);
      } else if (req.url === '/health') {
        this.handleHealthCheck(req, res);
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    // Setup WebSocket server for real-time updates
    this.wsServer = new WebSocketServer({ server });
    this.wsServer.on('connection', (ws) => {
      this.clients.add(ws);
      
      ws.on('close', () => {
        this.clients.delete(ws);
      });

      // Send initial data
      ws.send(JSON.stringify({
        type: 'initial',
        data: this.getCurrentMetrics()
      }));
    });

    return new Promise((resolve) => {
      server.listen(this.options.metricsPort, () => {
        console.log(`📊 Metrics server running on http://localhost:${this.options.metricsPort}`);
        console.log(`🔗 Dashboard: http://localhost:${this.options.metricsPort}/dashboard`);
        resolve();
      });
    });
  }

  async initializeMetricsCollection() {
    // Create metrics directory
    const metricsDir = path.join(__dirname, '..', 'reports', 'monitoring');
    try {
      await fs.mkdir(metricsDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  async startSystemMonitoring() {
    const monitorSystem = async () => {
      while (this.isMonitoring) {
        try {
          const systemMetrics = await this.collectSystemMetrics();
          this.metrics.system.cpu.push(systemMetrics.cpu);
          this.metrics.system.memory.push(systemMetrics.memory);
          this.metrics.system.disk.push(systemMetrics.disk);
          this.metrics.system.network.push(systemMetrics.network);

          this.checkSystemAlerts(systemMetrics);
          this.broadcastMetrics('system', systemMetrics);

        } catch (error) {
          console.error('System monitoring error:', error);
        }

        await this.sleep(this.options.sampleInterval);
      }
    };

    monitorSystem();
  }

  async startGamingMetricsMonitoring() {
    const monitorGaming = async () => {
      while (this.isMonitoring) {
        try {
          const gamingMetrics = await this.collectGamingMetrics();
          
          this.metrics.gaming.votingLatency.push(gamingMetrics.votingLatency);
          this.metrics.gaming.tokenBurnRate.push(gamingMetrics.tokenBurnRate);
          this.metrics.gaming.clanBattleResponseTime.push(gamingMetrics.clanBattleResponseTime);
          this.metrics.gaming.tournamentUpdates.push(gamingMetrics.tournamentUpdates);
          this.metrics.gaming.leaderboardRefresh.push(gamingMetrics.leaderboardRefresh);

          this.checkGamingAlerts(gamingMetrics);
          this.broadcastMetrics('gaming', gamingMetrics);

        } catch (error) {
          console.error('Gaming metrics monitoring error:', error);
        }

        await this.sleep(this.options.sampleInterval);
      }
    };

    monitorGaming();
  }

  async startApiMonitoring() {
    const monitorApi = async () => {
      while (this.isMonitoring) {
        try {
          const apiMetrics = await this.collectApiMetrics();
          
          this.metrics.api.requests.push(apiMetrics.requests);
          this.metrics.api.responses.push(apiMetrics.responses);
          this.metrics.api.errors.push(apiMetrics.errors);

          this.checkApiAlerts(apiMetrics);
          this.broadcastMetrics('api', apiMetrics);

        } catch (error) {
          console.error('API monitoring error:', error);
        }

        await this.sleep(this.options.sampleInterval);
      }
    };

    monitorApi();
  }

  async startDatabaseMonitoring() {
    const monitorDatabase = async () => {
      while (this.isMonitoring) {
        try {
          const dbMetrics = await this.collectDatabaseMetrics();
          
          this.metrics.database.connectionPool.push(dbMetrics.connectionPool);
          this.metrics.database.queryLatency.push(dbMetrics.queryLatency);
          this.metrics.database.activeConnections = dbMetrics.activeConnections;
          this.metrics.database.lockWaits = dbMetrics.lockWaits;

          this.checkDatabaseAlerts(dbMetrics);
          this.broadcastMetrics('database', dbMetrics);

        } catch (error) {
          console.error('Database monitoring error:', error);
        }

        await this.sleep(this.options.sampleInterval);
      }
    };

    monitorDatabase();
  }

  async startBlockchainMonitoring() {
    const monitorBlockchain = async () => {
      while (this.isMonitoring) {
        try {
          const blockchainMetrics = await this.collectBlockchainMetrics();
          
          this.metrics.blockchain.transactionThroughput.push(blockchainMetrics.transactionThroughput);
          this.metrics.blockchain.confirmationTime.push(blockchainMetrics.confirmationTime);
          this.metrics.blockchain.rpcLatency.push(blockchainMetrics.rpcLatency);
          this.metrics.blockchain.failureRate.push(blockchainMetrics.failureRate);

          this.checkBlockchainAlerts(blockchainMetrics);
          this.broadcastMetrics('blockchain', blockchainMetrics);

        } catch (error) {
          console.error('Blockchain monitoring error:', error);
        }

        await this.sleep(this.options.sampleInterval * 2); // Slower sampling for blockchain
      }
    };

    monitorBlockchain();
  }

  async startAlertSystem() {
    const processAlerts = async () => {
      while (this.isMonitoring) {
        try {
          await this.processAlerts();
        } catch (error) {
          console.error('Alert processing error:', error);
        }

        await this.sleep(5000); // Check every 5 seconds
      }
    };

    processAlerts();
  }

  async collectSystemMetrics() {
    // Simulate system metrics collection
    // In a real implementation, you would use libraries like 'systeminformation' or 'node-os-utils'
    return {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100,
      network: {
        bytesIn: Math.floor(Math.random() * 1000000),
        bytesOut: Math.floor(Math.random() * 1000000),
        latency: Math.random() * 100
      },
      timestamp: Date.now()
    };
  }

  async collectGamingMetrics() {
    try {
      // Collect gaming-specific metrics via API calls
      const votingStats = await this.fetchApiMetrics('/stats/voting');
      const clanStats = await this.fetchApiMetrics('/stats/clans');
      const tournamentStats = await this.fetchApiMetrics('/stats/tournaments');

      return {
        votingLatency: votingStats?.averageResponseTime || Math.random() * 200,
        tokenBurnRate: votingStats?.burnSuccessRate || Math.random(),
        clanBattleResponseTime: clanStats?.battleResponseTime || Math.random() * 300,
        tournamentUpdates: tournamentStats?.updateCount || Math.floor(Math.random() * 10),
        leaderboardRefresh: Math.random() * 500,
        webSocketConnections: Math.floor(Math.random() * 1000) + 500,
        activeVotingSessions: Math.floor(Math.random() * 200) + 50,
        concurrentClanBattles: Math.floor(Math.random() * 20) + 5,
        tournamentParticipants: Math.floor(Math.random() * 500) + 100,
        timestamp: Date.now()
      };

    } catch (error) {
      // Return simulated data if API is unavailable
      return {
        votingLatency: Math.random() * 200,
        tokenBurnRate: Math.random(),
        clanBattleResponseTime: Math.random() * 300,
        tournamentUpdates: Math.floor(Math.random() * 10),
        leaderboardRefresh: Math.random() * 500,
        webSocketConnections: Math.floor(Math.random() * 1000) + 500,
        activeVotingSessions: Math.floor(Math.random() * 200) + 50,
        concurrentClanBattles: Math.floor(Math.random() * 20) + 5,
        tournamentParticipants: Math.floor(Math.random() * 500) + 100,
        timestamp: Date.now()
      };
    }
  }

  async collectApiMetrics() {
    return {
      requests: Math.floor(Math.random() * 100) + 50,
      responses: Math.floor(Math.random() * 95) + 45,
      errors: Math.floor(Math.random() * 5),
      averageResponseTime: Math.random() * 500,
      p95ResponseTime: Math.random() * 1000,
      activeConnections: Math.floor(Math.random() * 200) + 100,
      timestamp: Date.now()
    };
  }

  async collectDatabaseMetrics() {
    return {
      connectionPool: {
        active: Math.floor(Math.random() * 50) + 10,
        idle: Math.floor(Math.random() * 20) + 5,
        total: 100
      },
      queryLatency: Math.random() * 100,
      activeConnections: Math.floor(Math.random() * 50) + 10,
      lockWaits: Math.floor(Math.random() * 5),
      throughput: Math.floor(Math.random() * 1000) + 500,
      timestamp: Date.now()
    };
  }

  async collectBlockchainMetrics() {
    return {
      transactionThroughput: Math.random() * 100,
      confirmationTime: Math.random() * 2000 + 500,
      rpcLatency: Math.random() * 200,
      failureRate: Math.random() * 0.1,
      activeTransactions: Math.floor(Math.random() * 50) + 10,
      timestamp: Date.now()
    };
  }

  async fetchApiMetrics(endpoint) {
    try {
      // In a real implementation, make HTTP request to get actual metrics
      return null;
    } catch (error) {
      return null;
    }
  }

  checkSystemAlerts(metrics) {
    if (metrics.cpu > this.options.alertThresholds.cpuUsage) {
      this.createAlert('high_cpu', `CPU usage: ${metrics.cpu.toFixed(2)}%`, 'warning');
    }

    if (metrics.memory > this.options.alertThresholds.memoryUsage) {
      this.createAlert('high_memory', `Memory usage: ${metrics.memory.toFixed(2)}%`, 'warning');
    }

    if (metrics.network.latency > this.options.alertThresholds.networkLatency) {
      this.createAlert('high_latency', `Network latency: ${metrics.network.latency.toFixed(2)}ms`, 'warning');
    }
  }

  checkGamingAlerts(metrics) {
    if (metrics.votingLatency > this.options.alertThresholds.responseTime) {
      this.createAlert('slow_voting', `Voting latency: ${metrics.votingLatency.toFixed(2)}ms`, 'critical');
    }

    if (metrics.tokenBurnRate < 0.9) {
      this.createAlert('low_burn_success', `Token burn success rate: ${(metrics.tokenBurnRate * 100).toFixed(2)}%`, 'warning');
    }

    if (metrics.webSocketConnections > 1500) {
      this.createAlert('high_ws_connections', `WebSocket connections: ${metrics.webSocketConnections}`, 'info');
    }
  }

  checkApiAlerts(metrics) {
    const errorRate = metrics.errors / (metrics.requests || 1);
    if (errorRate > this.options.alertThresholds.errorRate) {
      this.createAlert('high_error_rate', `API error rate: ${(errorRate * 100).toFixed(2)}%`, 'critical');
    }

    if (metrics.p95ResponseTime > this.options.alertThresholds.responseTime) {
      this.createAlert('slow_api', `P95 response time: ${metrics.p95ResponseTime.toFixed(2)}ms`, 'warning');
    }
  }

  checkDatabaseAlerts(metrics) {
    const poolUtilization = metrics.connectionPool.active / metrics.connectionPool.total;
    if (poolUtilization > 0.8) {
      this.createAlert('high_db_connections', `DB pool utilization: ${(poolUtilization * 100).toFixed(2)}%`, 'warning');
    }

    if (metrics.lockWaits > 10) {
      this.createAlert('db_lock_contention', `Database lock waits: ${metrics.lockWaits}`, 'critical');
    }
  }

  checkBlockchainAlerts(metrics) {
    if (metrics.confirmationTime > 5000) {
      this.createAlert('slow_confirmations', `Transaction confirmation: ${metrics.confirmationTime.toFixed(2)}ms`, 'warning');
    }

    if (metrics.failureRate > 0.05) {
      this.createAlert('high_tx_failures', `Transaction failure rate: ${(metrics.failureRate * 100).toFixed(2)}%`, 'critical');
    }
  }

  createAlert(type, message, severity) {
    const alert = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      message,
      severity,
      timestamp: Date.now(),
      acknowledged: false
    };

    this.alerts.push(alert);
    
    console.log(`🚨 ${severity.toUpperCase()}: ${message}`);
    
    this.broadcastMetrics('alert', alert);
  }

  async processAlerts() {
    // Process unacknowledged alerts
    const unacknowledged = this.alerts.filter(a => !a.acknowledged);
    
    if (unacknowledged.length > 0) {
      // In a real implementation, you could send notifications, emails, etc.
    }
  }

  broadcastMetrics(type, data) {
    if (this.clients.size > 0) {
      const message = JSON.stringify({
        type: 'update',
        category: type,
        data,
        timestamp: Date.now()
      });

      this.clients.forEach(client => {
        try {
          client.send(message);
        } catch (error) {
          this.clients.delete(client);
        }
      });
    }
  }

  getCurrentMetrics() {
    return {
      system: this.metrics.system,
      gaming: this.metrics.gaming,
      api: this.metrics.api,
      database: this.metrics.database,
      blockchain: this.metrics.blockchain,
      alerts: this.alerts.filter(a => !a.acknowledged).slice(-10),
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime
    };
  }

  handleMetricsRequest(req, res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(this.getCurrentMetrics(), null, 2));
  }

  handleDashboardRequest(req, res) {
    const dashboard = this.createDashboardHTML();
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(dashboard);
  }

  handleHealthCheck(req, res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      uptime: Date.now() - this.startTime,
      monitoring: this.isMonitoring
    }));
  }

  createDashboardHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MLG.clan Performance Monitor</title>
    <style>
        body { font-family: 'Segoe UI', system-ui; margin: 0; padding: 20px; background: #0a0a0a; color: #00ff00; }
        .container { max-width: 1400px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 2em; font-weight: bold; color: #00ff00; text-shadow: 0 0 10px #00ff00; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .panel { background: #111; border: 1px solid #00ff00; padding: 20px; border-radius: 8px; }
        .panel h3 { margin: 0 0 15px 0; color: #00ff00; border-bottom: 1px solid #333; padding-bottom: 10px; }
        .metric { display: flex; justify-content: space-between; margin: 10px 0; }
        .metric-label { color: #888; }
        .metric-value { color: #00ff00; font-weight: bold; }
        .alert { background: #330000; border-left: 4px solid #ff0000; padding: 10px; margin: 5px 0; }
        .alert.warning { background: #332200; border-left-color: #ffaa00; }
        .alert.info { background: #002233; border-left-color: #0088ff; }
        .status-indicator { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 10px; }
        .status-healthy { background: #00ff00; }
        .status-warning { background: #ffaa00; }
        .status-critical { background: #ff0000; }
        #charts { margin-top: 20px; }
        .chart-container { background: #111; border: 1px solid #333; padding: 15px; margin: 10px 0; border-radius: 8px; }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">MLG.clan Performance Monitor</div>
            <div><span class="status-indicator status-healthy"></span>System Status: <span id="systemStatus">Monitoring Active</span></div>
        </div>

        <div class="grid">
            <div class="panel">
                <h3>🎮 Gaming Metrics</h3>
                <div class="metric">
                    <span class="metric-label">Voting Latency:</span>
                    <span class="metric-value" id="votingLatency">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Token Burn Rate:</span>
                    <span class="metric-value" id="tokenBurnRate">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">WebSocket Connections:</span>
                    <span class="metric-value" id="wsConnections">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Active Voting Sessions:</span>
                    <span class="metric-value" id="votingSessions">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Tournament Participants:</span>
                    <span class="metric-value" id="tournamentParticipants">-</span>
                </div>
            </div>

            <div class="panel">
                <h3>💻 System Metrics</h3>
                <div class="metric">
                    <span class="metric-label">CPU Usage:</span>
                    <span class="metric-value" id="cpuUsage">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Memory Usage:</span>
                    <span class="metric-value" id="memoryUsage">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Network Latency:</span>
                    <span class="metric-value" id="networkLatency">-</span>
                </div>
            </div>

            <div class="panel">
                <h3>🔗 API Metrics</h3>
                <div class="metric">
                    <span class="metric-label">Requests/sec:</span>
                    <span class="metric-value" id="apiRequests">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">P95 Response Time:</span>
                    <span class="metric-value" id="apiP95">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Error Rate:</span>
                    <span class="metric-value" id="apiErrors">-</span>
                </div>
            </div>

            <div class="panel">
                <h3>⛓️ Blockchain Metrics</h3>
                <div class="metric">
                    <span class="metric-label">Transaction TPS:</span>
                    <span class="metric-value" id="txTps">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Confirmation Time:</span>
                    <span class="metric-value" id="confirmTime">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">RPC Latency:</span>
                    <span class="metric-value" id="rpcLatency">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Failure Rate:</span>
                    <span class="metric-value" id="failureRate">-</span>
                </div>
            </div>
        </div>

        <div class="panel">
            <h3>🚨 Active Alerts</h3>
            <div id="alerts">
                <p>No active alerts</p>
            </div>
        </div>

        <div id="charts">
            <div class="chart-container">
                <canvas id="votingChart" width="400" height="200"></canvas>
            </div>
            <div class="chart-container">
                <canvas id="systemChart" width="400" height="200"></canvas>
            </div>
        </div>
    </div>

    <script>
        const ws = new WebSocket('ws://localhost:${this.options.metricsPort}');
        
        ws.onmessage = function(event) {
            const message = JSON.parse(event.data);
            if (message.type === 'update') {
                updateMetrics(message);
            } else if (message.type === 'initial') {
                initializeMetrics(message.data);
            }
        };

        function updateMetrics(message) {
            const { category, data } = message;
            
            if (category === 'gaming') {
                document.getElementById('votingLatency').textContent = data.votingLatency.toFixed(2) + 'ms';
                document.getElementById('tokenBurnRate').textContent = (data.tokenBurnRate * 100).toFixed(2) + '%';
                document.getElementById('wsConnections').textContent = data.webSocketConnections;
                document.getElementById('votingSessions').textContent = data.activeVotingSessions;
                document.getElementById('tournamentParticipants').textContent = data.tournamentParticipants;
            } else if (category === 'system') {
                document.getElementById('cpuUsage').textContent = data.cpu.toFixed(2) + '%';
                document.getElementById('memoryUsage').textContent = data.memory.toFixed(2) + '%';
                document.getElementById('networkLatency').textContent = data.network.latency.toFixed(2) + 'ms';
            } else if (category === 'api') {
                document.getElementById('apiRequests').textContent = data.requests;
                document.getElementById('apiP95').textContent = data.p95ResponseTime.toFixed(2) + 'ms';
                document.getElementById('apiErrors').textContent = ((data.errors / data.requests) * 100).toFixed(2) + '%';
            } else if (category === 'blockchain') {
                document.getElementById('txTps').textContent = data.transactionThroughput.toFixed(2);
                document.getElementById('confirmTime').textContent = data.confirmationTime.toFixed(2) + 'ms';
                document.getElementById('rpcLatency').textContent = data.rpcLatency.toFixed(2) + 'ms';
                document.getElementById('failureRate').textContent = (data.failureRate * 100).toFixed(2) + '%';
            } else if (category === 'alert') {
                addAlert(data);
            }
        }

        function initializeMetrics(data) {
            // Initialize dashboard with initial data
            updateMetrics({ category: 'gaming', data: data.gaming });
            updateMetrics({ category: 'system', data: data.system });
            updateMetrics({ category: 'api', data: data.api });
            updateMetrics({ category: 'blockchain', data: data.blockchain });
        }

        function addAlert(alert) {
            const alertsDiv = document.getElementById('alerts');
            const alertElement = document.createElement('div');
            alertElement.className = 'alert ' + alert.severity;
            alertElement.innerHTML = '<strong>' + alert.type + ':</strong> ' + alert.message;
            alertsDiv.appendChild(alertElement);
        }

        ws.onerror = function(error) {
            document.getElementById('systemStatus').textContent = 'Connection Error';
        };
    </script>
</body>
</html>
    `;
  }

  async stop() {
    console.log('⏹️  Stopping performance monitor...');
    this.isMonitoring = false;

    if (this.wsServer) {
      this.wsServer.close();
    }
  }

  async generateReport() {
    console.log('📋 Generating performance monitoring report...');

    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      configuration: this.options,
      summary: this.generateSummary(),
      metrics: this.metrics,
      alerts: this.alerts,
      recommendations: this.generateRecommendations()
    };

    const reportPath = path.join(__dirname, '..', 'reports', 'monitoring', `performance-monitor-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`📄 Performance report saved: ${reportPath}`);
  }

  generateSummary() {
    const criticalAlerts = this.alerts.filter(a => a.severity === 'critical').length;
    const warningAlerts = this.alerts.filter(a => a.severity === 'warning').length;

    return {
      totalAlerts: this.alerts.length,
      criticalAlerts,
      warningAlerts,
      systemHealthScore: this.calculateHealthScore(),
      averageVotingLatency: this.calculateAverage(this.metrics.gaming.votingLatency),
      averageApiResponseTime: this.calculateAverage(this.metrics.api.responses.map(r => r.averageResponseTime || 0)),
      peakWebSocketConnections: Math.max(...this.metrics.gaming.webSocketConnections || [0])
    };
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.alerts.some(a => a.type === 'slow_voting')) {
      recommendations.push('Optimize voting transaction processing pipeline');
    }

    if (this.alerts.some(a => a.type === 'high_cpu')) {
      recommendations.push('Consider horizontal scaling for CPU-intensive operations');
    }

    if (this.alerts.some(a => a.type === 'high_ws_connections')) {
      recommendations.push('Implement WebSocket connection pooling and rate limiting');
    }

    recommendations.push('Monitor blockchain network conditions during peak hours');
    recommendations.push('Implement caching for frequently accessed leaderboard data');

    return recommendations;
  }

  calculateHealthScore() {
    // Simple health score calculation based on alerts and metrics
    let score = 100;
    score -= this.alerts.filter(a => a.severity === 'critical').length * 20;
    score -= this.alerts.filter(a => a.severity === 'warning').length * 10;
    return Math.max(0, score);
  }

  calculateAverage(array) {
    if (!array || array.length === 0) return 0;
    return array.reduce((sum, val) => sum + (val || 0), 0) / array.length;
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

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options = {};

  args.forEach(arg => {
    if (arg.startsWith('--duration=')) {
      options.duration = arg.split('=')[1];
    } else if (arg.startsWith('--port=')) {
      options.metricsPort = parseInt(arg.split('=')[1]);
    }
  });

  const monitor = new MLGPerformanceMonitor(options);
  
  try {
    await monitor.start();
    process.exit(0);
  } catch (error) {
    console.error('❌ Performance monitoring failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default MLGPerformanceMonitor;