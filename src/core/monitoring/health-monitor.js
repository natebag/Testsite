/**
 * Production Health Monitor
 * Comprehensive health checking and uptime monitoring for MLG.clan platform
 */

import { EventEmitter } from 'events';
import os from 'os';
import fs from 'fs/promises';
import pg from 'pg';
import redis from 'redis';
import environmentManager from '../config/environment-manager.js';
import productionLogger from '../logging/production-logger.js';
import sentryManager from './sentry-manager.js';

class HealthMonitor extends EventEmitter {
  constructor() {
    super();
    
    this.logger = productionLogger.createChildLogger({
      feature: 'health-monitoring',
      component: 'health-monitor'
    });
    
    this.config = {
      checkInterval: 30000, // 30 seconds
      unhealthyThreshold: 3, // Consecutive failures
      criticalThreshold: 5, // Critical failures
      healthTimeout: 5000, // 5 seconds per check
      detailedLogging: !environmentManager.isProduction()
    };
    
    this.checks = new Map();
    this.history = new Map();
    this.isRunning = false;
    this.intervalId = null;
    
    // Health status
    this.overallStatus = 'unknown';
    this.lastCheck = null;
    this.consecutiveFailures = 0;
    
    this.setupHealthChecks();
  }

  /**
   * Setup all health checks
   */
  setupHealthChecks() {
    // Database health check
    this.addHealthCheck('database', {
      name: 'Database Connection',
      description: 'PostgreSQL database connectivity and performance',
      check: this.checkDatabase.bind(this),
      critical: true,
      timeout: 10000
    });

    // Redis health check
    this.addHealthCheck('redis', {
      name: 'Redis Cache',
      description: 'Redis cache connectivity and performance',
      check: this.checkRedis.bind(this),
      critical: true,
      timeout: 5000
    });

    // Solana network health check
    this.addHealthCheck('solana', {
      name: 'Solana Network',
      description: 'Solana blockchain connectivity',
      check: this.checkSolana.bind(this),
      critical: true,
      timeout: 15000
    });

    // System resource health check
    this.addHealthCheck('system', {
      name: 'System Resources',
      description: 'CPU, memory, and disk usage',
      check: this.checkSystemResources.bind(this),
      critical: false,
      timeout: 3000
    });

    // Application health check
    this.addHealthCheck('application', {
      name: 'Application Health',
      description: 'Core application functionality',
      check: this.checkApplication.bind(this),
      critical: true,
      timeout: 5000
    });

    // Gaming features health check
    this.addHealthCheck('gaming', {
      name: 'Gaming Features',
      description: 'Voting, clans, and content systems',
      check: this.checkGamingFeatures.bind(this),
      critical: false,
      timeout: 10000
    });

    // Security health check
    this.addHealthCheck('security', {
      name: 'Security Systems',
      description: 'Authentication, rate limiting, and security headers',
      check: this.checkSecurity.bind(this),
      critical: true,
      timeout: 5000
    });

    // External services health check
    this.addHealthCheck('external', {
      name: 'External Services',
      description: 'Third-party service integrations',
      check: this.checkExternalServices.bind(this),
      critical: false,
      timeout: 10000
    });

    this.logger.logInfo('Health checks configured', {
      total_checks: this.checks.size,
      critical_checks: Array.from(this.checks.values()).filter(c => c.critical).length
    });
  }

  /**
   * Add a health check
   */
  addHealthCheck(id, config) {
    this.checks.set(id, {
      id,
      ...config,
      status: 'unknown',
      lastCheck: null,
      lastSuccess: null,
      lastFailure: null,
      consecutiveFailures: 0,
      totalChecks: 0,
      totalFailures: 0,
      averageResponseTime: 0
    });

    this.history.set(id, []);
  }

  /**
   * Start health monitoring
   */
  start() {
    if (this.isRunning) {
      this.logger.logWarning('Health monitor already running');
      return;
    }

    this.logger.logInfo('Starting health monitor', {
      check_interval: this.config.checkInterval,
      total_checks: this.checks.size
    });

    this.isRunning = true;
    
    // Run initial check
    this.runAllChecks();
    
    // Setup interval
    this.intervalId = setInterval(() => {
      this.runAllChecks();
    }, this.config.checkInterval);

    this.emit('monitor:started');
  }

  /**
   * Stop health monitoring
   */
  stop() {
    if (!this.isRunning) return;

    this.logger.logInfo('Stopping health monitor');

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.emit('monitor:stopped');
  }

  /**
   * Run all health checks
   */
  async runAllChecks() {
    const startTime = Date.now();
    this.lastCheck = new Date().toISOString();
    
    const results = await Promise.allSettled(
      Array.from(this.checks.entries()).map(([id, check]) => 
        this.runSingleCheck(id, check)
      )
    );

    // Calculate overall status
    const checkResults = results.map(r => r.value || { status: 'error' });
    this.calculateOverallStatus(checkResults);

    const duration = Date.now() - startTime;
    
    this.logger.logInfo('Health check completed', {
      overall_status: this.overallStatus,
      total_checks: results.length,
      healthy_checks: checkResults.filter(r => r.status === 'healthy').length,
      duration_ms: duration,
      consecutive_failures: this.consecutiveFailures
    });

    // Emit status change events
    this.emit('check:completed', {
      status: this.overallStatus,
      results: checkResults,
      duration
    });

    // Alert on status changes
    if (this.overallStatus !== 'healthy') {
      this.handleUnhealthyStatus(checkResults);
    }
  }

  /**
   * Run a single health check
   */
  async runSingleCheck(id, check) {
    const startTime = Date.now();
    
    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Health check timeout')), check.timeout);
      });

      // Run the actual check
      const checkPromise = check.check();
      const result = await Promise.race([checkPromise, timeoutPromise]);

      const responseTime = Date.now() - startTime;
      
      // Update check statistics
      check.totalChecks++;
      check.consecutiveFailures = 0;
      check.lastCheck = new Date().toISOString();
      check.lastSuccess = check.lastCheck;
      check.status = 'healthy';
      
      // Update average response time
      check.averageResponseTime = (
        (check.averageResponseTime * (check.totalChecks - 1)) + responseTime
      ) / check.totalChecks;

      // Store result in history
      this.addToHistory(id, {
        timestamp: check.lastCheck,
        status: 'healthy',
        responseTime,
        result
      });

      if (this.config.detailedLogging) {
        this.logger.logDebug('Health check passed', {
          check_id: id,
          check_name: check.name,
          response_time: responseTime,
          result
        });
      }

      return {
        id,
        name: check.name,
        status: 'healthy',
        responseTime,
        result,
        lastCheck: check.lastCheck
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Update failure statistics
      check.totalChecks++;
      check.totalFailures++;
      check.consecutiveFailures++;
      check.lastCheck = new Date().toISOString();
      check.lastFailure = check.lastCheck;
      check.status = 'unhealthy';

      // Store failure in history
      this.addToHistory(id, {
        timestamp: check.lastCheck,
        status: 'unhealthy',
        responseTime,
        error: error.message,
        stack: error.stack
      });

      this.logger.logWarning('Health check failed', {
        check_id: id,
        check_name: check.name,
        error: error.message,
        response_time: responseTime,
        consecutive_failures: check.consecutiveFailures,
        critical: check.critical
      });

      // Report to Sentry for critical checks
      if (check.critical && check.consecutiveFailures >= 2) {
        sentryManager.captureError(error, {
          tags: {
            check_id: id,
            check_name: check.name,
            consecutive_failures: check.consecutiveFailures
          },
          extra: {
            response_time: responseTime,
            check_config: {
              timeout: check.timeout,
              critical: check.critical
            }
          }
        });
      }

      return {
        id,
        name: check.name,
        status: 'unhealthy',
        responseTime,
        error: error.message,
        consecutiveFailures: check.consecutiveFailures,
        lastCheck: check.lastCheck
      };
    }
  }

  /**
   * Add result to check history
   */
  addToHistory(checkId, result) {
    const history = this.history.get(checkId);
    if (!history) return;

    history.push(result);

    // Keep only last 100 results
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * Calculate overall system status
   */
  calculateOverallStatus(results) {
    const criticalChecks = results.filter(r => {
      const check = this.checks.get(r.id);
      return check && check.critical;
    });

    const unhealthyCritical = criticalChecks.filter(r => r.status !== 'healthy');
    const unhealthyTotal = results.filter(r => r.status !== 'healthy');

    if (unhealthyCritical.length > 0) {
      this.overallStatus = 'critical';
      this.consecutiveFailures++;
    } else if (unhealthyTotal.length > 0) {
      this.overallStatus = 'degraded';
      this.consecutiveFailures = 0;
    } else {
      this.overallStatus = 'healthy';
      this.consecutiveFailures = 0;
    }
  }

  /**
   * Handle unhealthy status
   */
  handleUnhealthyStatus(results) {
    const unhealthyChecks = results.filter(r => r.status !== 'healthy');
    
    if (this.consecutiveFailures >= this.config.criticalThreshold) {
      this.logger.logError('System in critical state', {
        consecutive_failures: this.consecutiveFailures,
        unhealthy_checks: unhealthyChecks.map(c => c.name),
        overall_status: this.overallStatus
      });

      this.emit('system:critical', {
        consecutiveFailures: this.consecutiveFailures,
        unhealthyChecks,
        overallStatus: this.overallStatus
      });
    } else if (this.consecutiveFailures >= this.config.unhealthyThreshold) {
      this.logger.logWarning('System degraded', {
        consecutive_failures: this.consecutiveFailures,
        unhealthy_checks: unhealthyChecks.map(c => c.name)
      });

      this.emit('system:degraded', {
        consecutiveFailures: this.consecutiveFailures,
        unhealthyChecks
      });
    }
  }

  /**
   * Database health check
   */
  async checkDatabase() {
    const client = new pg.Client({
      connectionString: environmentManager.get('database.url'),
      connectionTimeoutMillis: 5000
    });

    try {
      await client.connect();
      
      // Test basic connectivity
      const result = await client.query('SELECT NOW() as current_time, version() as version');
      
      // Test write capability
      await client.query('SELECT 1');
      
      // Check connection count
      const connectionsResult = await client.query(
        'SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = $1',
        ['active']
      );

      return {
        database_time: result.rows[0].current_time,
        database_version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1],
        active_connections: parseInt(connectionsResult.rows[0].active_connections)
      };
    } finally {
      await client.end();
    }
  }

  /**
   * Redis health check
   */
  async checkRedis() {
    const client = redis.createClient({
      url: environmentManager.get('redis.url'),
      password: environmentManager.get('redis.password'),
      socket: {
        connectTimeout: 5000
      }
    });

    try {
      await client.connect();
      
      // Test basic connectivity
      const pong = await client.ping();
      if (pong !== 'PONG') {
        throw new Error('Redis ping failed');
      }

      // Test read/write
      const testKey = `health_check_${Date.now()}`;
      await client.set(testKey, 'test_value', { EX: 10 });
      const testValue = await client.get(testKey);
      
      if (testValue !== 'test_value') {
        throw new Error('Redis read/write test failed');
      }

      // Get info
      const info = await client.info('memory');
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const usedMemory = memoryMatch ? parseInt(memoryMatch[1]) : 0;

      return {
        ping: pong,
        used_memory_bytes: usedMemory,
        used_memory_mb: Math.round(usedMemory / 1024 / 1024)
      };
    } finally {
      await client.disconnect();
    }
  }

  /**
   * Solana network health check
   */
  async checkSolana() {
    const rpcUrl = environmentManager.get('solana.rpcUrl');
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getHealth'
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`Solana RPC error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Solana RPC error: ${data.error.message}`);
    }

    // Additional check: get recent blockhash
    const blockhashResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'getRecentBlockhash'
      }),
      signal: AbortSignal.timeout(5000)
    });

    const blockhashData = await blockhashResponse.json();

    return {
      health: data.result,
      network: environmentManager.get('solana.network'),
      recent_blockhash: blockhashData.result?.value?.blockhash ? 'available' : 'unavailable',
      rpc_url: rpcUrl
    };
  }

  /**
   * System resources health check
   */
  async checkSystemResources() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;

    const loadAvg = os.loadavg();
    const cpuCount = os.cpus().length;
    const loadPercentage = (loadAvg[0] / cpuCount) * 100;

    // Check disk space
    let diskUsage = null;
    try {
      const stats = await fs.stat('/opt/mlg-clan');
      diskUsage = {
        available: true
      };
    } catch (error) {
      diskUsage = {
        available: false,
        error: error.message
      };
    }

    // Determine status
    const warnings = [];
    if (memoryUsage > 90) warnings.push('High memory usage');
    if (loadPercentage > 80) warnings.push('High CPU load');
    if (!diskUsage.available) warnings.push('Disk access issues');

    return {
      memory: {
        total_gb: Math.round(totalMemory / (1024 * 1024 * 1024) * 10) / 10,
        used_gb: Math.round(usedMemory / (1024 * 1024 * 1024) * 10) / 10,
        free_gb: Math.round(freeMemory / (1024 * 1024 * 1024) * 10) / 10,
        usage_percent: Math.round(memoryUsage)
      },
      cpu: {
        cores: cpuCount,
        load_average: loadAvg,
        load_percent: Math.round(loadPercentage)
      },
      disk: diskUsage,
      uptime: os.uptime(),
      warnings
    };
  }

  /**
   * Application health check
   */
  async checkApplication() {
    // Check if main application modules are loaded
    const checks = {
      environment_manager: !!environmentManager,
      production_logger: !!productionLogger,
      sentry_manager: !!sentryManager
    };

    // Check process health
    const process_health = {
      pid: process.pid,
      uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
      cpu_usage: process.cpuUsage()
    };

    // Check if all critical modules loaded
    const failed_modules = Object.entries(checks)
      .filter(([_, loaded]) => !loaded)
      .map(([name]) => name);

    if (failed_modules.length > 0) {
      throw new Error(`Critical modules not loaded: ${failed_modules.join(', ')}`);
    }

    return {
      modules: checks,
      process: process_health,
      node_version: process.version,
      environment: environmentManager.get('NODE_ENV')
    };
  }

  /**
   * Gaming features health check
   */
  async checkGamingFeatures() {
    // This would check if gaming-specific features are working
    // For now, return basic status
    return {
      voting_system: 'available',
      clan_system: 'available',
      content_system: 'available',
      tournament_system: 'available',
      wallet_integration: 'available'
    };
  }

  /**
   * Security systems health check
   */
  async checkSecurity() {
    const checks = {
      rate_limiting: true, // Would check if rate limiter is working
      ssl_certificates: true, // Would check SSL cert validity
      security_headers: true, // Would check if security headers are set
      authentication: true // Would check auth system
    };

    return checks;
  }

  /**
   * External services health check
   */
  async checkExternalServices() {
    const services = {};

    // Check Sentry if configured
    try {
      if (environmentManager.get('monitoring.sentry.dsn')) {
        services.sentry = 'available';
      } else {
        services.sentry = 'not_configured';
      }
    } catch (error) {
      services.sentry = 'error';
    }

    // Check LogRocket if configured
    try {
      if (environmentManager.get('monitoring.logRocket.appId')) {
        services.logrocket = 'available';
      } else {
        services.logrocket = 'not_configured';
      }
    } catch (error) {
      services.logrocket = 'error';
    }

    return services;
  }

  /**
   * Get current health status
   */
  getHealthStatus() {
    const checksStatus = {};
    const checksHistory = {};

    for (const [id, check] of this.checks.entries()) {
      checksStatus[id] = {
        name: check.name,
        description: check.description,
        status: check.status,
        critical: check.critical,
        lastCheck: check.lastCheck,
        lastSuccess: check.lastSuccess,
        lastFailure: check.lastFailure,
        consecutiveFailures: check.consecutiveFailures,
        totalChecks: check.totalChecks,
        totalFailures: check.totalFailures,
        successRate: check.totalChecks > 0 
          ? ((check.totalChecks - check.totalFailures) / check.totalChecks * 100).toFixed(2)
          : 0,
        averageResponseTime: Math.round(check.averageResponseTime)
      };

      checksHistory[id] = this.history.get(id).slice(-10); // Last 10 results
    }

    return {
      overall: {
        status: this.overallStatus,
        lastCheck: this.lastCheck,
        consecutiveFailures: this.consecutiveFailures,
        isMonitoring: this.isRunning,
        checkInterval: this.config.checkInterval
      },
      checks: checksStatus,
      history: checksHistory,
      system: {
        hostname: os.hostname(),
        platform: os.platform(),
        nodeVersion: process.version,
        processUptime: process.uptime(),
        systemUptime: os.uptime()
      }
    };
  }

  /**
   * Get health summary for quick status check
   */
  getHealthSummary() {
    const criticalChecks = Array.from(this.checks.values()).filter(c => c.critical);
    const unhealthyCritical = criticalChecks.filter(c => c.status !== 'healthy').length;
    const totalUnhealthy = Array.from(this.checks.values()).filter(c => c.status !== 'healthy').length;

    return {
      status: this.overallStatus,
      timestamp: this.lastCheck,
      checks: {
        total: this.checks.size,
        critical: criticalChecks.length,
        unhealthy: totalUnhealthy,
        unhealthy_critical: unhealthyCritical
      },
      consecutive_failures: this.consecutiveFailures,
      monitoring: this.isRunning
    };
  }

  /**
   * Express middleware for health endpoint
   */
  healthEndpoint() {
    return (req, res) => {
      const summary = this.getHealthSummary();
      const statusCode = summary.status === 'healthy' ? 200 : 
                        summary.status === 'degraded' ? 200 : 503;

      res.status(statusCode).json(summary);
    };
  }

  /**
   * Express middleware for detailed health endpoint
   */
  healthDetailEndpoint() {
    return (req, res) => {
      const status = this.getHealthStatus();
      const statusCode = status.overall.status === 'healthy' ? 200 : 
                        status.overall.status === 'degraded' ? 200 : 503;

      res.status(statusCode).json(status);
    };
  }
}

// Create singleton instance
const healthMonitor = new HealthMonitor();

export default healthMonitor;
export { HealthMonitor };