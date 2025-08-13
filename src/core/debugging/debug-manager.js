/**
 * Debug Manager for Production
 * Comprehensive debugging tools for production environment troubleshooting
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import environmentManager from '../config/environment-manager.js';
import productionLogger from '../logging/production-logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DebugManager {
  constructor() {
    this.isProduction = environmentManager.isProduction();
    this.isDebugEnabled = !this.isProduction || process.env.DEBUG_ENABLED === 'true';
    this.debugSessions = new Map();
    this.performanceMarks = new Map();
    this.memorySnapshots = [];
    this.requestTraces = new Map();
    this.gamingMetrics = new Map();
  }

  /**
   * Initialize debug manager
   */
  initialize() {
    if (!this.isDebugEnabled) return;

    console.log('Debug Manager initialized for MLG.clan platform');
    
    // Setup memory monitoring
    this.setupMemoryMonitoring();
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring();
    
    // Setup gaming-specific debugging
    this.setupGamingDebug();
    
    // Setup Web3 debugging
    this.setupWeb3Debug();
  }

  /**
   * Setup memory monitoring
   */
  setupMemoryMonitoring() {
    if (!this.isDebugEnabled) return;

    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      this.memorySnapshots.push({
        timestamp: Date.now(),
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers
      });

      // Keep only last 100 snapshots
      if (this.memorySnapshots.length > 100) {
        this.memorySnapshots.shift();
      }

      // Log memory warnings
      const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
      if (heapUsedMB > 500) {
        productionLogger.logWarning('High memory usage detected', {
          heap_used_mb: heapUsedMB,
          heap_total_mb: memoryUsage.heapTotal / 1024 / 1024,
          feature: 'debug',
          action: 'memory_warning'
        });
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    if (!this.isDebugEnabled) return;

    // Monitor event loop lag
    let start = process.hrtime.bigint();
    setInterval(() => {
      const delta = process.hrtime.bigint() - start;
      const nanosec = Number(delta);
      const millisec = nanosec / 1000000;

      if (millisec > 100) {
        productionLogger.logWarning('Event loop lag detected', {
          lag_ms: millisec,
          feature: 'debug',
          action: 'event_loop_lag'
        });
      }

      start = process.hrtime.bigint();
    }, 1000);
  }

  /**
   * Setup gaming-specific debugging
   */
  setupGamingDebug() {
    // Track gaming operations
    this.gamingDebugger = {
      trackVoting: (operation, data) => {
        this.trackGamingOperation('voting', operation, data);
      },
      
      trackClan: (operation, data) => {
        this.trackGamingOperation('clan', operation, data);
      },
      
      trackContent: (operation, data) => {
        this.trackGamingOperation('content', operation, data);
      },
      
      trackTournament: (operation, data) => {
        this.trackGamingOperation('tournament', operation, data);
      }
    };

    // Make available globally for debugging
    if (typeof global !== 'undefined') {
      global.MLGDebugGaming = this.gamingDebugger;
    }
  }

  /**
   * Setup Web3 debugging
   */
  setupWeb3Debug() {
    this.web3Debugger = {
      trackTransaction: (txData) => {
        this.trackWeb3Operation('transaction', txData);
      },
      
      trackWalletOperation: (operation, data) => {
        this.trackWeb3Operation('wallet', { operation, ...data });
      },
      
      trackTokenOperation: (operation, data) => {
        this.trackWeb3Operation('token', { operation, ...data });
      },
      
      trackNetworkCall: (method, params, result) => {
        this.trackWeb3Operation('network', { method, params, result });
      }
    };

    // Make available globally for debugging
    if (typeof global !== 'undefined') {
      global.MLGDebugWeb3 = this.web3Debugger;
    }
  }

  /**
   * Track gaming operations
   */
  trackGamingOperation(feature, operation, data) {
    if (!this.isDebugEnabled) return;

    const timestamp = Date.now();
    const key = `${feature}_${operation}`;
    
    if (!this.gamingMetrics.has(key)) {
      this.gamingMetrics.set(key, []);
    }

    const metrics = this.gamingMetrics.get(key);
    metrics.push({
      timestamp,
      operation,
      data: this.sanitizeDebugData(data),
      performance: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }
    });

    // Keep only last 50 operations per type
    if (metrics.length > 50) {
      metrics.shift();
    }

    productionLogger.logDebug(`Gaming operation: ${feature}.${operation}`, {
      feature: 'debug',
      gaming_feature: feature,
      operation,
      data: this.sanitizeDebugData(data)
    });
  }

  /**
   * Track Web3 operations
   */
  trackWeb3Operation(type, data) {
    if (!this.isDebugEnabled) return;

    const timestamp = Date.now();
    const key = `web3_${type}`;
    
    if (!this.gamingMetrics.has(key)) {
      this.gamingMetrics.set(key, []);
    }

    const metrics = this.gamingMetrics.get(key);
    metrics.push({
      timestamp,
      type,
      data: this.sanitizeDebugData(data),
      performance: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }
    });

    // Keep only last 50 operations per type
    if (metrics.length > 50) {
      metrics.shift();
    }

    productionLogger.logDebug(`Web3 operation: ${type}`, {
      feature: 'debug',
      web3_type: type,
      data: this.sanitizeDebugData(data)
    });
  }

  /**
   * Start performance mark
   */
  markStart(markName, context = {}) {
    if (!this.isDebugEnabled) return null;

    const markId = `${markName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.performanceMarks.set(markId, {
      name: markName,
      startTime: process.hrtime.bigint(),
      startCpu: process.cpuUsage(),
      startMemory: process.memoryUsage(),
      context: this.sanitizeDebugData(context)
    });

    return markId;
  }

  /**
   * End performance mark and log results
   */
  markEnd(markId, additionalContext = {}) {
    if (!this.isDebugEnabled || !markId) return null;

    const mark = this.performanceMarks.get(markId);
    if (!mark) return null;

    const endTime = process.hrtime.bigint();
    const endCpu = process.cpuUsage(mark.startCpu);
    const endMemory = process.memoryUsage();

    const duration = Number(endTime - mark.startTime) / 1000000; // Convert to milliseconds

    const performance = {
      duration_ms: duration,
      cpu_user: endCpu.user,
      cpu_system: endCpu.system,
      memory_delta: {
        rss: endMemory.rss - mark.startMemory.rss,
        heapTotal: endMemory.heapTotal - mark.startMemory.heapTotal,
        heapUsed: endMemory.heapUsed - mark.startMemory.heapUsed,
        external: endMemory.external - mark.startMemory.external
      }
    };

    productionLogger.logPerformance({
      name: mark.name,
      value: duration,
      unit: 'milliseconds',
      category: 'debug_mark'
    }, {
      ...mark.context,
      ...additionalContext,
      performance
    });

    this.performanceMarks.delete(markId);
    return performance;
  }

  /**
   * Start debug session for request tracing
   */
  startDebugSession(sessionId, context = {}) {
    if (!this.isDebugEnabled) return null;

    this.debugSessions.set(sessionId, {
      id: sessionId,
      startTime: Date.now(),
      context: this.sanitizeDebugData(context),
      events: [],
      performance: {
        marks: new Map(),
        metrics: []
      }
    });

    return this.createSessionDebugger(sessionId);
  }

  /**
   * Create session-specific debugger
   */
  createSessionDebugger(sessionId) {
    return {
      log: (message, data = {}) => this.addSessionEvent(sessionId, 'log', message, data),
      error: (message, error, data = {}) => this.addSessionEvent(sessionId, 'error', message, { error, ...data }),
      mark: (name, context = {}) => this.addSessionMark(sessionId, name, context),
      metric: (name, value, unit = 'count', context = {}) => this.addSessionMetric(sessionId, name, value, unit, context),
      end: () => this.endDebugSession(sessionId)
    };
  }

  /**
   * Add event to debug session
   */
  addSessionEvent(sessionId, type, message, data = {}) {
    if (!this.isDebugEnabled) return;

    const session = this.debugSessions.get(sessionId);
    if (!session) return;

    session.events.push({
      timestamp: Date.now(),
      type,
      message,
      data: this.sanitizeDebugData(data)
    });

    // Keep only last 100 events per session
    if (session.events.length > 100) {
      session.events.shift();
    }
  }

  /**
   * Add performance mark to session
   */
  addSessionMark(sessionId, name, context = {}) {
    if (!this.isDebugEnabled) return null;

    const session = this.debugSessions.get(sessionId);
    if (!session) return null;

    const markId = this.markStart(`${sessionId}_${name}`, context);
    session.performance.marks.set(name, markId);
    
    return {
      end: (additionalContext = {}) => {
        const performance = this.markEnd(markId, additionalContext);
        session.performance.marks.delete(name);
        return performance;
      }
    };
  }

  /**
   * Add metric to session
   */
  addSessionMetric(sessionId, name, value, unit, context = {}) {
    if (!this.isDebugEnabled) return;

    const session = this.debugSessions.get(sessionId);
    if (!session) return;

    session.performance.metrics.push({
      timestamp: Date.now(),
      name,
      value,
      unit,
      context: this.sanitizeDebugData(context)
    });
  }

  /**
   * End debug session
   */
  endDebugSession(sessionId) {
    if (!this.isDebugEnabled) return null;

    const session = this.debugSessions.get(sessionId);
    if (!session) return null;

    const endTime = Date.now();
    const duration = endTime - session.startTime;

    const sessionSummary = {
      session_id: sessionId,
      duration_ms: duration,
      event_count: session.events.length,
      metric_count: session.performance.metrics.length,
      context: session.context
    };

    productionLogger.logDebug('Debug session completed', {
      feature: 'debug',
      action: 'session_end',
      ...sessionSummary
    });

    this.debugSessions.delete(sessionId);
    return sessionSummary;
  }

  /**
   * Sanitize debug data for logging
   */
  sanitizeDebugData(data) {
    if (!data || typeof data !== 'object') return data;

    const sanitized = { ...data };
    
    // Remove sensitive information
    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'privateKey', 
      'mnemonic', 'seed', 'authorization', 'cookie'
    ];

    const sanitizeObject = (obj) => {
      if (typeof obj !== 'object' || obj === null) return obj;

      if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
      }

      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          result[key] = '***REDACTED***';
        } else if (key.toLowerCase().includes('wallet') && typeof value === 'string' && value.length > 20) {
          result[key] = `***${value.slice(-4)}`;
        } else {
          result[key] = sanitizeObject(value);
        }
      }
      return result;
    };

    return sanitizeObject(sanitized);
  }

  /**
   * Get debug dashboard data
   */
  getDebugDashboard() {
    if (!this.isDebugEnabled) {
      return { error: 'Debug mode not enabled' };
    }

    return {
      system: {
        memory: {
          current: process.memoryUsage(),
          history: this.memorySnapshots.slice(-10),
          snapshots_count: this.memorySnapshots.length
        },
        cpu: process.cpuUsage(),
        uptime: process.uptime(),
        platform: process.platform,
        node_version: process.version
      },
      
      sessions: {
        active_count: this.debugSessions.size,
        active_sessions: Array.from(this.debugSessions.keys())
      },
      
      gaming_metrics: {
        tracked_operations: Array.from(this.gamingMetrics.keys()),
        total_operations: Array.from(this.gamingMetrics.values())
          .reduce((sum, ops) => sum + ops.length, 0)
      },
      
      performance: {
        active_marks: this.performanceMarks.size,
        marks: Array.from(this.performanceMarks.keys())
      }
    };
  }

  /**
   * Get gaming metrics for specific feature
   */
  getGamingMetrics(feature = null) {
    if (!this.isDebugEnabled) return null;

    if (feature) {
      const metrics = {};
      for (const [key, value] of this.gamingMetrics.entries()) {
        if (key.startsWith(`${feature}_`)) {
          metrics[key] = value;
        }
      }
      return metrics;
    }

    return Object.fromEntries(this.gamingMetrics);
  }

  /**
   * Clear gaming metrics
   */
  clearGamingMetrics(feature = null) {
    if (!this.isDebugEnabled) return;

    if (feature) {
      for (const key of this.gamingMetrics.keys()) {
        if (key.startsWith(`${feature}_`)) {
          this.gamingMetrics.delete(key);
        }
      }
    } else {
      this.gamingMetrics.clear();
    }

    productionLogger.logDebug('Gaming metrics cleared', {
      feature: 'debug',
      action: 'metrics_cleared',
      target_feature: feature || 'all'
    });
  }

  /**
   * Export debug data for analysis
   */
  exportDebugData() {
    if (!this.isDebugEnabled) return null;

    const exportData = {
      timestamp: Date.now(),
      system: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        uptime: process.uptime()
      },
      memory_history: this.memorySnapshots,
      gaming_metrics: Object.fromEntries(this.gamingMetrics),
      active_sessions: Array.from(this.debugSessions.values()),
      performance_marks: Array.from(this.performanceMarks.values())
    };

    return exportData;
  }

  /**
   * Create Express middleware for request debugging
   */
  requestDebugger() {
    return (req, res, next) => {
      if (!this.isDebugEnabled) return next();

      const sessionId = req.headers['x-debug-session'] || 
                        `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const debugger = this.startDebugSession(sessionId, {
        method: req.method,
        path: req.path,
        user_agent: req.headers['user-agent'],
        ip: req.ip,
        user_id: req.user?.id
      });

      req.debug = debugger;
      
      // Auto-end session when response finishes
      res.on('finish', () => {
        if (debugger) {
          debugger.end();
        }
      });

      next();
    };
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    return {
      debug_enabled: this.isDebugEnabled,
      production_mode: this.isProduction,
      active_sessions: this.debugSessions.size,
      tracked_metrics: this.gamingMetrics.size,
      memory_snapshots: this.memorySnapshots.length,
      performance_marks: this.performanceMarks.size
    };
  }
}

// Create singleton instance
const debugManager = new DebugManager();

export default debugManager;
export { DebugManager };