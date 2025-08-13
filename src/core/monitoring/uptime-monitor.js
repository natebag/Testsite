/**
 * Uptime Monitoring System
 * Tracks application uptime, downtime, and availability metrics for production
 */

import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import environmentManager from '../config/environment-manager.js';
import productionLogger from '../logging/production-logger.js';

class UptimeMonitor extends EventEmitter {
  constructor() {
    super();
    
    this.logger = productionLogger.createChildLogger({
      feature: 'monitoring',
      component: 'uptime-monitor'
    });
    
    this.config = {
      checkInterval: 60000, // 1 minute
      pingTimeout: 10000, // 10 seconds
      alertThreshold: 5, // Minutes of downtime before alert
      dataRetentionDays: 30,
      storageFile: path.join(process.cwd(), 'logs', 'uptime-data.json')
    };
    
    this.status = {
      isUp: false,
      lastCheck: null,
      upSince: null,
      downSince: null,
      totalUptime: 0,
      totalDowntime: 0,
      uptimePercentage: 100,
      checksToday: 0,
      failuresToday: 0
    };
    
    this.incidents = [];
    this.checks = [];
    this.isRunning = false;
    this.intervalId = null;
    this.startTime = Date.now();
    
    // Endpoints to monitor
    this.endpoints = [
      {
        id: 'main',
        name: 'Main Application',
        url: 'http://localhost:3000/health',
        method: 'GET',
        expectedStatus: 200,
        timeout: 5000,
        critical: true
      },
      {
        id: 'api',
        name: 'API Health',
        url: 'http://localhost:3000/api/health',
        method: 'GET',
        expectedStatus: 200,
        timeout: 5000,
        critical: true
      },
      {
        id: 'database',
        name: 'Database Connection',
        url: 'http://localhost:3000/api/health/database',
        method: 'GET',
        expectedStatus: 200,
        timeout: 10000,
        critical: true
      },
      {
        id: 'redis',
        name: 'Redis Cache',
        url: 'http://localhost:3000/api/health/redis',
        method: 'GET',
        expectedStatus: 200,
        timeout: 5000,
        critical: true
      },
      {
        id: 'solana',
        name: 'Solana Network',
        url: 'http://localhost:3000/api/health/solana',
        method: 'GET',
        expectedStatus: 200,
        timeout: 15000,
        critical: false
      }
    ];

    this.loadStoredData();
  }

  /**
   * Start uptime monitoring
   */
  async start() {
    if (this.isRunning) {
      this.logger.logWarning('Uptime monitor already running');
      return;
    }

    this.logger.logInfo('Starting uptime monitor', {
      check_interval: this.config.checkInterval,
      endpoints: this.endpoints.length,
      alert_threshold: this.config.alertThreshold
    });

    this.isRunning = true;
    this.startTime = Date.now();
    
    // Run initial check
    await this.performUptimeCheck();
    
    // Setup interval
    this.intervalId = setInterval(async () => {
      await this.performUptimeCheck();
    }, this.config.checkInterval);

    // Setup daily reset
    this.setupDailyReset();

    // Setup periodic data save
    setInterval(() => {
      this.saveStoredData();
    }, 300000); // Save every 5 minutes

    this.emit('monitor:started');
  }

  /**
   * Stop uptime monitoring
   */
  stop() {
    if (!this.isRunning) return;

    this.logger.logInfo('Stopping uptime monitor');

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.saveStoredData();
    this.emit('monitor:stopped');
  }

  /**
   * Perform uptime check across all endpoints
   */
  async performUptimeCheck() {
    const checkTime = Date.now();
    const checkTimestamp = new Date(checkTime).toISOString();
    
    try {
      // Check all endpoints
      const endpointResults = await Promise.allSettled(
        this.endpoints.map(endpoint => this.checkEndpoint(endpoint))
      );

      // Evaluate overall status
      const criticalEndpoints = this.endpoints.filter(e => e.critical);
      const criticalResults = endpointResults.slice(0, criticalEndpoints.length);
      const allCriticalUp = criticalResults.every(r => 
        r.status === 'fulfilled' && r.value.isUp
      );

      const wasUp = this.status.isUp;
      this.status.isUp = allCriticalUp;
      this.status.lastCheck = checkTimestamp;
      this.status.checksToday++;

      // Handle status changes
      if (!wasUp && this.status.isUp) {
        // System came back up
        this.handleSystemUp(checkTime);
      } else if (wasUp && !this.status.isUp) {
        // System went down
        this.handleSystemDown(checkTime);
      }

      // Update uptime calculations
      this.updateUptimeStats(checkTime);

      // Store check result
      const checkResult = {
        timestamp: checkTimestamp,
        epochTime: checkTime,
        isUp: this.status.isUp,
        responseTime: endpointResults.reduce((sum, r) => {
          return sum + (r.value?.responseTime || 0);
        }, 0) / endpointResults.length,
        endpoints: endpointResults.map((result, index) => ({
          id: this.endpoints[index].id,
          name: this.endpoints[index].name,
          isUp: result.status === 'fulfilled' ? result.value.isUp : false,
          responseTime: result.status === 'fulfilled' ? result.value.responseTime : null,
          error: result.status === 'rejected' ? result.reason.message : null
        }))
      };

      this.checks.push(checkResult);

      // Keep only recent checks in memory (last 1000)
      if (this.checks.length > 1000) {
        this.checks = this.checks.slice(-1000);
      }

      // Log status
      if (this.status.isUp) {
        this.logger.logDebug('Uptime check passed', {
          response_time_avg: Math.round(checkResult.responseTime),
          uptime_percentage: this.status.uptimePercentage,
          checks_today: this.status.checksToday
        });
      } else {
        this.logger.logWarning('Uptime check failed', {
          failed_endpoints: checkResult.endpoints
            .filter(e => !e.isUp)
            .map(e => e.name),
          consecutive_failures: this.getConsecutiveFailures()
        });
        
        this.status.failuresToday++;
      }

      this.emit('check:completed', checkResult);

      // Check for alerts
      this.checkAlerts();

    } catch (error) {
      this.logger.logError(error, {
        action: 'uptime_check',
        check_time: checkTimestamp
      });
    }
  }

  /**
   * Check a single endpoint
   */
  async checkEndpoint(endpoint) {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), endpoint.timeout);

      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        signal: controller.signal,
        headers: {
          'User-Agent': 'MLG.clan-UptimeMonitor/1.0'
        }
      });

      clearTimeout(timeout);
      const responseTime = Date.now() - startTime;
      
      const isUp = response.status === endpoint.expectedStatus;
      
      return {
        isUp,
        responseTime,
        statusCode: response.status,
        statusText: response.statusText
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        isUp: false,
        responseTime,
        error: error.message
      };
    }
  }

  /**
   * Handle system coming back up
   */
  handleSystemUp(checkTime) {
    const downDuration = this.status.downSince ? checkTime - this.status.downSince : 0;
    
    this.logger.logInfo('System back online', {
      down_duration_ms: downDuration,
      down_duration_minutes: Math.round(downDuration / 60000),
      uptime_percentage: this.status.uptimePercentage
    });

    // End current incident if exists
    if (this.incidents.length > 0) {
      const currentIncident = this.incidents[this.incidents.length - 1];
      if (!currentIncident.resolvedAt) {
        currentIncident.resolvedAt = new Date(checkTime).toISOString();
        currentIncident.duration = downDuration;
        currentIncident.status = 'resolved';
      }
    }

    this.status.upSince = checkTime;
    this.status.downSince = null;
    
    this.emit('system:up', {
      timestamp: checkTime,
      downDuration,
      incident: this.incidents[this.incidents.length - 1]
    });
  }

  /**
   * Handle system going down
   */
  handleSystemDown(checkTime) {
    this.logger.logError('System went offline', {
      last_up_since: this.status.upSince,
      checks_today: this.status.checksToday,
      failures_today: this.status.failuresToday
    });

    // Create new incident
    const incident = {
      id: `incident_${checkTime}`,
      startedAt: new Date(checkTime).toISOString(),
      resolvedAt: null,
      duration: null,
      status: 'ongoing',
      checks: [],
      affectedEndpoints: []
    };

    this.incidents.push(incident);

    this.status.downSince = checkTime;
    this.status.upSince = null;

    this.emit('system:down', {
      timestamp: checkTime,
      incident
    });
  }

  /**
   * Update uptime statistics
   */
  updateUptimeStats(checkTime) {
    const sessionDuration = checkTime - this.startTime;
    
    if (this.status.isUp && this.status.upSince) {
      const uptime = checkTime - this.status.upSince;
      this.status.totalUptime += Math.min(uptime, this.config.checkInterval);
    } else if (!this.status.isUp && this.status.downSince) {
      const downtime = checkTime - this.status.downSince;
      this.status.totalDowntime += Math.min(downtime, this.config.checkInterval);
    }

    // Calculate uptime percentage
    const totalTime = this.status.totalUptime + this.status.totalDowntime;
    if (totalTime > 0) {
      this.status.uptimePercentage = (this.status.totalUptime / totalTime) * 100;
    }
  }

  /**
   * Get consecutive failures count
   */
  getConsecutiveFailures() {
    let failures = 0;
    for (let i = this.checks.length - 1; i >= 0; i--) {
      if (!this.checks[i].isUp) {
        failures++;
      } else {
        break;
      }
    }
    return failures;
  }

  /**
   * Check for alert conditions
   */
  checkAlerts() {
    if (!this.status.isUp) {
      const consecutiveFailures = this.getConsecutiveFailures();
      const downMinutes = consecutiveFailures * (this.config.checkInterval / 60000);
      
      if (downMinutes >= this.config.alertThreshold) {
        this.emitAlert('downtime', {
          duration_minutes: downMinutes,
          consecutive_failures: consecutiveFailures,
          failed_endpoints: this.getFailedEndpoints()
        });
      }
    }

    // Check daily failure rate
    const dailyFailureRate = this.status.checksToday > 0 
      ? (this.status.failuresToday / this.status.checksToday) * 100
      : 0;
    
    if (dailyFailureRate > 10) { // More than 10% failures
      this.emitAlert('high_failure_rate', {
        failure_rate: dailyFailureRate,
        failures_today: this.status.failuresToday,
        checks_today: this.status.checksToday
      });
    }
  }

  /**
   * Emit alert
   */
  emitAlert(type, data) {
    const alert = {
      type,
      timestamp: new Date().toISOString(),
      data,
      severity: type === 'downtime' ? 'critical' : 'warning'
    };

    this.logger.logWarning('Uptime alert triggered', {
      alert_type: type,
      severity: alert.severity,
      ...data
    });

    this.emit('alert', alert);
  }

  /**
   * Get currently failed endpoints
   */
  getFailedEndpoints() {
    const lastCheck = this.checks[this.checks.length - 1];
    return lastCheck ? lastCheck.endpoints.filter(e => !e.isUp) : [];
  }

  /**
   * Setup daily reset of counters
   */
  setupDailyReset() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.resetDailyCounters();
      
      // Set up daily interval
      setInterval(() => {
        this.resetDailyCounters();
      }, 24 * 60 * 60 * 1000); // 24 hours
      
    }, msUntilMidnight);
  }

  /**
   * Reset daily counters
   */
  resetDailyCounters() {
    this.logger.logInfo('Resetting daily counters', {
      previous_checks: this.status.checksToday,
      previous_failures: this.status.failuresToday,
      uptime_percentage: this.status.uptimePercentage
    });

    this.status.checksToday = 0;
    this.status.failuresToday = 0;
  }

  /**
   * Load stored uptime data
   */
  async loadStoredData() {
    try {
      const data = await fs.readFile(this.config.storageFile, 'utf8');
      const stored = JSON.parse(data);
      
      // Restore relevant data
      if (stored.incidents) {
        this.incidents = stored.incidents.slice(-100); // Keep last 100 incidents
      }
      
      if (stored.totalUptime) {
        this.status.totalUptime = stored.totalUptime;
      }
      
      if (stored.totalDowntime) {
        this.status.totalDowntime = stored.totalDowntime;
      }

      this.logger.logInfo('Loaded stored uptime data', {
        incidents_loaded: this.incidents.length,
        total_uptime: this.status.totalUptime,
        total_downtime: this.status.totalDowntime
      });
      
    } catch (error) {
      this.logger.logInfo('No stored uptime data found, starting fresh');
    }
  }

  /**
   * Save uptime data to storage
   */
  async saveStoredData() {
    try {
      const data = {
        lastSaved: new Date().toISOString(),
        totalUptime: this.status.totalUptime,
        totalDowntime: this.status.totalDowntime,
        incidents: this.incidents.slice(-100), // Keep last 100 incidents
        recentChecks: this.checks.slice(-100) // Keep last 100 checks
      };

      // Ensure directory exists
      await fs.mkdir(path.dirname(this.config.storageFile), { recursive: true });
      
      await fs.writeFile(this.config.storageFile, JSON.stringify(data, null, 2));
      
    } catch (error) {
      this.logger.logError(error, {
        action: 'save_uptime_data',
        storage_file: this.config.storageFile
      });
    }
  }

  /**
   * Get uptime statistics
   */
  getUptimeStats() {
    const now = Date.now();
    const sessionDuration = now - this.startTime;
    
    // Calculate uptime for different periods
    const last24Hours = this.getUptimeForPeriod(24 * 60 * 60 * 1000);
    const last7Days = this.getUptimeForPeriod(7 * 24 * 60 * 60 * 1000);
    const last30Days = this.getUptimeForPeriod(30 * 24 * 60 * 60 * 1000);

    return {
      current_status: {
        is_up: this.status.isUp,
        last_check: this.status.lastCheck,
        up_since: this.status.upSince ? new Date(this.status.upSince).toISOString() : null,
        down_since: this.status.downSince ? new Date(this.status.downSince).toISOString() : null
      },
      session: {
        started_at: new Date(this.startTime).toISOString(),
        duration_hours: Math.round(sessionDuration / (1000 * 60 * 60) * 100) / 100,
        uptime_percentage: Math.round(this.status.uptimePercentage * 100) / 100
      },
      today: {
        checks: this.status.checksToday,
        failures: this.status.failuresToday,
        success_rate: this.status.checksToday > 0 
          ? Math.round(((this.status.checksToday - this.status.failuresToday) / this.status.checksToday) * 100 * 100) / 100
          : 100
      },
      periods: {
        last_24_hours: last24Hours,
        last_7_days: last7Days,
        last_30_days: last30Days
      },
      incidents: {
        total: this.incidents.length,
        ongoing: this.incidents.filter(i => i.status === 'ongoing').length,
        resolved: this.incidents.filter(i => i.status === 'resolved').length,
        recent: this.incidents.slice(-5) // Last 5 incidents
      },
      endpoints: this.endpoints.map(endpoint => ({
        id: endpoint.id,
        name: endpoint.name,
        critical: endpoint.critical,
        status: this.getEndpointStatus(endpoint.id)
      }))
    };
  }

  /**
   * Get uptime percentage for a specific time period
   */
  getUptimeForPeriod(periodMs) {
    const now = Date.now();
    const startTime = now - periodMs;
    
    const periodChecks = this.checks.filter(check => 
      check.epochTime >= startTime
    );

    if (periodChecks.length === 0) {
      return {
        uptime_percentage: this.status.isUp ? 100 : 0,
        total_checks: 0,
        successful_checks: 0
      };
    }

    const successfulChecks = periodChecks.filter(check => check.isUp).length;
    const uptimePercentage = (successfulChecks / periodChecks.length) * 100;

    return {
      uptime_percentage: Math.round(uptimePercentage * 100) / 100,
      total_checks: periodChecks.length,
      successful_checks: successfulChecks
    };
  }

  /**
   * Get status for specific endpoint
   */
  getEndpointStatus(endpointId) {
    const lastCheck = this.checks[this.checks.length - 1];
    if (!lastCheck) return 'unknown';

    const endpointResult = lastCheck.endpoints.find(e => e.id === endpointId);
    return endpointResult ? (endpointResult.isUp ? 'up' : 'down') : 'unknown';
  }

  /**
   * Express middleware for uptime status endpoint
   */
  uptimeEndpoint() {
    return (req, res) => {
      const stats = this.getUptimeStats();
      res.json(stats);
    };
  }

  /**
   * Express middleware for uptime badge endpoint
   */
  uptimeBadgeEndpoint() {
    return (req, res) => {
      const period = req.query.period || '24h';
      let periodMs;
      
      switch (period) {
        case '1h': periodMs = 60 * 60 * 1000; break;
        case '24h': periodMs = 24 * 60 * 60 * 1000; break;
        case '7d': periodMs = 7 * 24 * 60 * 60 * 1000; break;
        case '30d': periodMs = 30 * 24 * 60 * 60 * 1000; break;
        default: periodMs = 24 * 60 * 60 * 1000;
      }

      const uptimeStats = this.getUptimeForPeriod(periodMs);
      const uptime = uptimeStats.uptime_percentage;
      
      // Generate SVG badge
      const color = uptime >= 99 ? 'brightgreen' : 
                   uptime >= 95 ? 'yellow' : 
                   uptime >= 90 ? 'orange' : 'red';
      
      const svg = this.generateUptimeBadge(uptime, color);
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(svg);
    };
  }

  /**
   * Generate uptime badge SVG
   */
  generateUptimeBadge(uptime, color) {
    const uptimeText = `${uptime.toFixed(2)}%`;
    const width = 104;
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20">
      <linearGradient id="b" x2="0" y2="100%">
        <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
        <stop offset="1" stop-opacity=".1"/>
      </linearGradient>
      <clipPath id="a">
        <rect width="${width}" height="20" rx="3" fill="#fff"/>
      </clipPath>
      <g clip-path="url(#a)">
        <path fill="#555" d="M0 0h63v20H0z"/>
        <path fill="${color}" d="M63 0h${width-63}v20H63z"/>
        <path fill="url(#b)" d="M0 0h${width}v20H0z"/>
      </g>
      <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="110">
        <text x="325" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="530">uptime</text>
        <text x="325" y="140" transform="scale(.1)" textLength="530">uptime</text>
        <text x="825" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(width-63)*10-20}">${uptimeText}</text>
        <text x="825" y="140" transform="scale(.1)" textLength="${(width-63)*10-20}">${uptimeText}</text>
      </g>
    </svg>`;
  }
}

// Create singleton instance
const uptimeMonitor = new UptimeMonitor();

export default uptimeMonitor;
export { UptimeMonitor };