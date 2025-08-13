/**
 * MLG.clan Auto-Scaling Cluster Manager
 * Manages application instances for load balancing and auto-scaling
 */

import cluster from 'cluster';
import os from 'os';
import fs from 'fs';
import { EventEmitter } from 'events';
import environmentManager from '../../src/core/config/environment-manager.js';
import productionLogger from '../../src/core/logging/production-logger.js';

class ClusterManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      workers: options.workers || this.calculateOptimalWorkers(),
      minWorkers: options.minWorkers || 2,
      maxWorkers: options.maxWorkers || os.cpus().length * 2,
      restartDelay: options.restartDelay || 1000,
      gracefulTimeout: options.gracefulTimeout || 30000,
      healthCheckInterval: options.healthCheckInterval || 30000,
      scaleCheckInterval: options.scaleCheckInterval || 60000,
      cpuThreshold: options.cpuThreshold || 80,
      memoryThreshold: options.memoryThreshold || 85,
      responseTimeThreshold: options.responseTimeThreshold || 1000,
      ports: options.ports || [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007]
    };
    
    this.workers = new Map();
    this.workerStats = new Map();
    this.metrics = {
      totalRequests: 0,
      averageResponseTime: 0,
      errorRate: 0,
      cpuUsage: 0,
      memoryUsage: 0
    };
    
    this.isShuttingDown = false;
    this.logger = productionLogger.createChildLogger({
      feature: 'auto-scaling',
      component: 'cluster-manager'
    });
    
    // Setup signal handlers
    this.setupSignalHandlers();
    
    // Setup monitoring intervals
    this.setupMonitoring();
  }

  /**
   * Calculate optimal number of workers
   */
  calculateOptimalWorkers() {
    const cpuCount = os.cpus().length;
    const totalMemoryGB = os.totalmem() / (1024 * 1024 * 1024);
    
    // Gaming applications are typically CPU-intensive
    // Use 1.5x CPU cores, limited by available memory
    let optimalWorkers = Math.floor(cpuCount * 1.5);
    
    // Ensure we don't exceed memory limits (assume 512MB per worker)
    const maxWorkersByMemory = Math.floor(totalMemoryGB / 0.5);
    optimalWorkers = Math.min(optimalWorkers, maxWorkersByMemory);
    
    // Ensure minimum and maximum bounds
    optimalWorkers = Math.max(optimalWorkers, this.config.minWorkers);
    optimalWorkers = Math.min(optimalWorkers, this.config.maxWorkers);
    
    this.logger.logInfo('Calculated optimal worker count', {
      cpu_count: cpuCount,
      total_memory_gb: Math.round(totalMemoryGB * 10) / 10,
      optimal_workers: optimalWorkers,
      max_by_memory: maxWorkersByMemory
    });
    
    return optimalWorkers;
  }

  /**
   * Start the cluster
   */
  async start() {
    if (!cluster.isPrimary) {
      // Worker process - start the application
      return this.startWorker();
    }

    this.logger.logInfo('Starting MLG.clan cluster manager', {
      workers: this.config.workers,
      min_workers: this.config.minWorkers,
      max_workers: this.config.maxWorkers
    });

    // Create initial workers
    for (let i = 0; i < this.config.workers; i++) {
      await this.createWorker(i);
    }

    // Setup cluster event handlers
    this.setupClusterEvents();

    // Setup health monitoring
    this.startHealthMonitoring();

    // Setup auto-scaling
    this.startAutoScaling();

    this.logger.logInfo('Cluster manager started successfully', {
      active_workers: this.workers.size,
      pids: Array.from(this.workers.values()).map(w => w.process.pid)
    });

    this.emit('cluster:started');
  }

  /**
   * Create a new worker
   */
  async createWorker(index) {
    return new Promise((resolve) => {
      const port = this.config.ports[index % this.config.ports.length];
      const env = {
        ...process.env,
        WORKER_ID: index,
        PORT: port,
        CLUSTER_MODE: 'true'
      };

      cluster.setupPrimary({
        env: env,
        silent: false
      });

      const worker = cluster.fork();
      worker.workerIndex = index;
      worker.port = port;
      worker.startTime = Date.now();
      worker.requestCount = 0;
      worker.errorCount = 0;
      worker.lastHealthCheck = Date.now();

      this.workers.set(worker.id, worker);
      this.workerStats.set(worker.id, {
        id: worker.id,
        index: index,
        port: port,
        pid: worker.process.pid,
        startTime: worker.startTime,
        requests: 0,
        errors: 0,
        cpuUsage: 0,
        memoryUsage: 0,
        responseTime: 0,
        status: 'starting'
      });

      worker.once('online', () => {
        this.logger.logInfo('Worker started', {
          worker_id: worker.id,
          worker_index: index,
          port: port,
          pid: worker.process.pid
        });
        
        this.workerStats.get(worker.id).status = 'online';
        this.emit('worker:started', worker);
        resolve(worker);
      });

      worker.on('message', (message) => {
        this.handleWorkerMessage(worker, message);
      });
    });
  }

  /**
   * Start worker process
   */
  async startWorker() {
    const workerId = process.env.WORKER_ID;
    const port = process.env.PORT;

    this.logger.logInfo('Starting worker process', {
      worker_id: workerId,
      port: port,
      pid: process.pid
    });

    try {
      // Import and start the main application
      const { default: app } = await import('../../server.js');
      
      // Setup worker-specific monitoring
      this.setupWorkerMonitoring();
      
      // Setup graceful shutdown for worker
      this.setupWorkerShutdown();
      
      this.logger.logInfo('Worker process started successfully', {
        worker_id: workerId,
        port: port,
        pid: process.pid
      });
      
    } catch (error) {
      this.logger.logError(error, {
        worker_id: workerId,
        port: port,
        action: 'start_worker'
      });
      process.exit(1);
    }
  }

  /**
   * Handle messages from workers
   */
  handleWorkerMessage(worker, message) {
    const stats = this.workerStats.get(worker.id);
    if (!stats) return;

    switch (message.type) {
      case 'health':
        stats.cpuUsage = message.data.cpu;
        stats.memoryUsage = message.data.memory;
        stats.requests = message.data.requests;
        stats.errors = message.data.errors;
        stats.responseTime = message.data.responseTime;
        stats.lastHealthCheck = Date.now();
        break;
        
      case 'request':
        stats.requests++;
        this.metrics.totalRequests++;
        break;
        
      case 'error':
        stats.errors++;
        this.logger.logWarning('Worker reported error', {
          worker_id: worker.id,
          error: message.data.error
        });
        break;
        
      case 'shutdown_ready':
        this.logger.logInfo('Worker ready for shutdown', {
          worker_id: worker.id
        });
        worker.kill('SIGTERM');
        break;
        
      default:
        this.logger.logDebug('Unknown message from worker', {
          worker_id: worker.id,
          message_type: message.type
        });
    }
  }

  /**
   * Setup cluster event handlers
   */
  setupClusterEvents() {
    cluster.on('exit', (worker, code, signal) => {
      this.logger.logWarning('Worker exited', {
        worker_id: worker.id,
        worker_index: worker.workerIndex,
        exit_code: code,
        signal: signal,
        pid: worker.process.pid
      });

      this.workers.delete(worker.id);
      this.workerStats.delete(worker.id);

      // Restart worker if not shutting down
      if (!this.isShuttingDown && code !== 0) {
        this.logger.logInfo('Restarting worker', {
          worker_index: worker.workerIndex,
          delay: this.config.restartDelay
        });

        setTimeout(() => {
          this.createWorker(worker.workerIndex);
        }, this.config.restartDelay);
      }

      this.emit('worker:exit', worker, code, signal);
    });

    cluster.on('disconnect', (worker) => {
      this.logger.logInfo('Worker disconnected', {
        worker_id: worker.id,
        worker_index: worker.workerIndex
      });
      
      this.emit('worker:disconnect', worker);
    });
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  setupSignalHandlers() {
    const shutdown = async (signal) => {
      this.logger.logInfo('Received shutdown signal', { signal });
      await this.gracefulShutdown();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGHUP', () => this.reloadWorkers());
  }

  /**
   * Graceful shutdown of all workers
   */
  async gracefulShutdown() {
    if (this.isShuttingDown) return;
    
    this.isShuttingDown = true;
    this.logger.logInfo('Starting graceful shutdown');

    // Stop accepting new workers
    cluster.disconnect();

    // Send shutdown signal to all workers
    const shutdownPromises = Array.from(this.workers.values()).map(worker => {
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          this.logger.logWarning('Worker shutdown timeout, force killing', {
            worker_id: worker.id
          });
          worker.kill('SIGKILL');
          resolve();
        }, this.config.gracefulTimeout);

        worker.once('exit', () => {
          clearTimeout(timeout);
          resolve();
        });

        // Send graceful shutdown message
        worker.send({ type: 'shutdown' });
      });
    });

    await Promise.all(shutdownPromises);
    this.logger.logInfo('All workers shut down gracefully');
    this.emit('cluster:shutdown');
  }

  /**
   * Reload all workers with zero downtime
   */
  async reloadWorkers() {
    this.logger.logInfo('Starting zero-downtime worker reload');

    const currentWorkers = Array.from(this.workers.values());
    
    // Create new workers first
    const newWorkers = [];
    for (let i = 0; i < currentWorkers.length; i++) {
      const newIndex = this.config.ports.length + i; // Use higher indices
      const newWorker = await this.createWorker(newIndex);
      newWorkers.push(newWorker);
      
      // Wait a bit between starting workers
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Wait for new workers to be fully ready
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Gracefully shut down old workers
    for (const worker of currentWorkers) {
      this.logger.logInfo('Shutting down old worker', {
        worker_id: worker.id
      });
      
      worker.send({ type: 'shutdown' });
      
      setTimeout(() => {
        if (!worker.isDead()) {
          worker.kill('SIGTERM');
        }
      }, this.config.gracefulTimeout);
      
      // Wait a bit between shutting down workers
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    this.logger.logInfo('Worker reload completed');
    this.emit('cluster:reloaded');
  }

  /**
   * Setup monitoring intervals
   */
  setupMonitoring() {
    // Health monitoring
    setInterval(() => {
      if (cluster.isPrimary) {
        this.checkWorkerHealth();
      }
    }, this.config.healthCheckInterval);

    // Auto-scaling check
    setInterval(() => {
      if (cluster.isPrimary) {
        this.checkAutoScaling();
      }
    }, this.config.scaleCheckInterval);
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    this.logger.logInfo('Starting health monitoring');
  }

  /**
   * Start auto-scaling
   */
  startAutoScaling() {
    this.logger.logInfo('Starting auto-scaling monitoring', {
      cpu_threshold: this.config.cpuThreshold,
      memory_threshold: this.config.memoryThreshold,
      response_time_threshold: this.config.responseTimeThreshold
    });
  }

  /**
   * Check worker health
   */
  checkWorkerHealth() {
    const now = Date.now();
    const unhealthyWorkers = [];

    for (const [workerId, stats] of this.workerStats.entries()) {
      const worker = this.workers.get(workerId);
      if (!worker) continue;

      // Check if worker is responsive
      if (now - stats.lastHealthCheck > this.config.healthCheckInterval * 2) {
        unhealthyWorkers.push(worker);
        this.logger.logWarning('Unresponsive worker detected', {
          worker_id: workerId,
          last_health_check: stats.lastHealthCheck
        });
      }

      // Check resource usage
      if (stats.memoryUsage > this.config.memoryThreshold) {
        this.logger.logWarning('High memory usage in worker', {
          worker_id: workerId,
          memory_usage: stats.memoryUsage
        });
      }

      if (stats.cpuUsage > this.config.cpuThreshold) {
        this.logger.logWarning('High CPU usage in worker', {
          worker_id: workerId,
          cpu_usage: stats.cpuUsage
        });
      }
    }

    // Restart unhealthy workers
    for (const worker of unhealthyWorkers) {
      this.logger.logInfo('Restarting unhealthy worker', {
        worker_id: worker.id
      });
      worker.kill('SIGTERM');
    }
  }

  /**
   * Check auto-scaling conditions
   */
  checkAutoScaling() {
    const activeWorkers = this.workers.size;
    const avgStats = this.calculateAverageStats();
    
    this.logger.logDebug('Auto-scaling check', {
      active_workers: activeWorkers,
      avg_cpu: avgStats.cpuUsage,
      avg_memory: avgStats.memoryUsage,
      avg_response_time: avgStats.responseTime
    });

    // Scale up conditions
    const shouldScaleUp = (
      (avgStats.cpuUsage > this.config.cpuThreshold ||
       avgStats.responseTime > this.config.responseTimeThreshold) &&
      activeWorkers < this.config.maxWorkers
    );

    // Scale down conditions
    const shouldScaleDown = (
      avgStats.cpuUsage < this.config.cpuThreshold * 0.3 &&
      avgStats.responseTime < this.config.responseTimeThreshold * 0.5 &&
      activeWorkers > this.config.minWorkers
    );

    if (shouldScaleUp) {
      this.scaleUp();
    } else if (shouldScaleDown) {
      this.scaleDown();
    }
  }

  /**
   * Calculate average statistics across all workers
   */
  calculateAverageStats() {
    const stats = Array.from(this.workerStats.values());
    
    if (stats.length === 0) {
      return {
        cpuUsage: 0,
        memoryUsage: 0,
        responseTime: 0,
        requests: 0,
        errors: 0
      };
    }

    return {
      cpuUsage: stats.reduce((sum, s) => sum + s.cpuUsage, 0) / stats.length,
      memoryUsage: stats.reduce((sum, s) => sum + s.memoryUsage, 0) / stats.length,
      responseTime: stats.reduce((sum, s) => sum + s.responseTime, 0) / stats.length,
      requests: stats.reduce((sum, s) => sum + s.requests, 0),
      errors: stats.reduce((sum, s) => sum + s.errors, 0)
    };
  }

  /**
   * Scale up by adding a worker
   */
  async scaleUp() {
    const currentCount = this.workers.size;
    
    if (currentCount >= this.config.maxWorkers) {
      this.logger.logInfo('Cannot scale up - at maximum workers', {
        current: currentCount,
        max: this.config.maxWorkers
      });
      return;
    }

    this.logger.logInfo('Scaling up - adding worker', {
      current_workers: currentCount,
      target_workers: currentCount + 1
    });

    const newIndex = Math.max(...Array.from(this.workers.values()).map(w => w.workerIndex)) + 1;
    await this.createWorker(newIndex);
    
    this.emit('cluster:scaled_up', this.workers.size);
  }

  /**
   * Scale down by removing a worker
   */
  async scaleDown() {
    const currentCount = this.workers.size;
    
    if (currentCount <= this.config.minWorkers) {
      this.logger.logInfo('Cannot scale down - at minimum workers', {
        current: currentCount,
        min: this.config.minWorkers
      });
      return;
    }

    // Find worker with least load
    let targetWorker = null;
    let minRequests = Infinity;
    
    for (const [workerId, stats] of this.workerStats.entries()) {
      if (stats.requests < minRequests) {
        minRequests = stats.requests;
        targetWorker = this.workers.get(workerId);
      }
    }

    if (targetWorker) {
      this.logger.logInfo('Scaling down - removing worker', {
        current_workers: currentCount,
        target_workers: currentCount - 1,
        worker_id: targetWorker.id
      });

      targetWorker.send({ type: 'shutdown' });
      
      setTimeout(() => {
        if (!targetWorker.isDead()) {
          targetWorker.kill('SIGTERM');
        }
      }, this.config.gracefulTimeout);
      
      this.emit('cluster:scaled_down', this.workers.size);
    }
  }

  /**
   * Setup worker-specific monitoring
   */
  setupWorkerMonitoring() {
    // Report health metrics to primary
    setInterval(() => {
      const usage = process.cpuUsage();
      const memory = process.memoryUsage();
      
      process.send({
        type: 'health',
        data: {
          cpu: usage.user + usage.system,
          memory: (memory.heapUsed / memory.heapTotal) * 100,
          requests: process.requestCount || 0,
          errors: process.errorCount || 0,
          responseTime: process.avgResponseTime || 0
        }
      });
    }, this.config.healthCheckInterval);
  }

  /**
   * Setup worker shutdown handling
   */
  setupWorkerShutdown() {
    process.on('message', (message) => {
      if (message.type === 'shutdown') {
        this.logger.logInfo('Worker received shutdown signal');
        
        // Graceful shutdown logic here
        // Close servers, finish requests, cleanup
        setTimeout(() => {
          process.send({ type: 'shutdown_ready' });
        }, 1000);
      }
    });
  }

  /**
   * Get cluster status
   */
  getStatus() {
    if (!cluster.isPrimary) {
      return null;
    }

    const avgStats = this.calculateAverageStats();
    
    return {
      cluster: {
        is_primary: cluster.isPrimary,
        active_workers: this.workers.size,
        min_workers: this.config.minWorkers,
        max_workers: this.config.maxWorkers,
        is_shutting_down: this.isShuttingDown
      },
      workers: Array.from(this.workerStats.values()),
      metrics: {
        ...avgStats,
        total_requests: this.metrics.totalRequests,
        error_rate: avgStats.requests > 0 ? (avgStats.errors / avgStats.requests) * 100 : 0
      },
      system: {
        cpu_count: os.cpus().length,
        total_memory: Math.round(os.totalmem() / (1024 * 1024 * 1024) * 10) / 10,
        free_memory: Math.round(os.freemem() / (1024 * 1024 * 1024) * 10) / 10,
        load_average: os.loadavg(),
        uptime: os.uptime()
      }
    };
  }
}

export default ClusterManager;
export { ClusterManager };