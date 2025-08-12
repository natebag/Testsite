/**
 * @fileoverview CDN Failover and Redundancy System
 * Provides automatic failover, health monitoring, and redundancy management
 */

import { EventEmitter } from 'events';

/**
 * CDN Failover Manager
 */
export class CDNFailoverManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      healthCheckInterval: config.healthCheckInterval || 30000, // 30 seconds
      failureThreshold: config.failureThreshold || 3,
      recoveryThreshold: config.recoveryThreshold || 2,
      timeout: config.timeout || 5000,
      maxRetries: config.maxRetries || 3,
      backoffMultiplier: config.backoffMultiplier || 2,
      ...config
    };
    
    this.providers = new Map();
    this.healthStatus = new Map();
    this.requestQueues = new Map();
    this.circuitBreakers = new Map();
    this.performanceMetrics = new Map();
    
    this.currentPrimary = null;
    this.isFailoverActive = false;
    this.healthCheckTimer = null;
    
    this.initializeFailoverSystem();
  }

  /**
   * Register CDN provider
   * @param {string} name - Provider name
   * @param {Object} config - Provider configuration
   */
  registerProvider(name, config) {
    this.providers.set(name, {
      name,
      baseUrl: config.baseUrl,
      zones: config.zones || {},
      priority: config.priority || 100,
      weight: config.weight || 1,
      regions: config.regions || [],
      capabilities: config.capabilities || [],
      maxRequests: config.maxRequests || 1000,
      ...config
    });
    
    this.healthStatus.set(name, {
      isHealthy: true,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      lastCheck: null,
      lastError: null,
      responseTime: 0,
      uptime: 100,
      requestCount: 0,
      errorCount: 0
    });
    
    this.circuitBreakers.set(name, {
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      failureCount: 0,
      lastFailureTime: null,
      nextAttemptTime: null
    });
    
    this.requestQueues.set(name, []);
    this.performanceMetrics.set(name, {
      avgResponseTime: 0,
      requestsPerSecond: 0,
      bandwidth: 0,
      hitRatio: 0,
      lastMetricsReset: Date.now()
    });
    
    // Set primary provider if none set
    if (!this.currentPrimary) {
      this.currentPrimary = name;
    }
    
    console.log(`CDN provider registered: ${name} (priority: ${config.priority})`);
  }

  /**
   * Initialize failover system
   */
  initializeFailoverSystem() {
    this.startHealthChecking();
    this.startMetricsCollection();
    this.setupEventHandlers();
  }

  /**
   * Start health checking for all providers
   */
  startHealthChecking() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckInterval);
    
    console.log('CDN health checking started');
  }

  /**
   * Perform health checks on all providers
   */
  async performHealthChecks() {
    const providers = Array.from(this.providers.keys());
    const healthPromises = providers.map(name => this.checkProviderHealth(name));
    
    await Promise.allSettled(healthPromises);
    this.evaluateFailoverConditions();
  }

  /**
   * Check health of a specific provider
   * @param {string} providerName - Provider name
   */
  async checkProviderHealth(providerName) {
    const provider = this.providers.get(providerName);
    const status = this.healthStatus.get(providerName);
    const circuitBreaker = this.circuitBreakers.get(providerName);
    
    // Skip if circuit breaker is open and cooling down
    if (circuitBreaker.state === 'OPEN' && 
        Date.now() < circuitBreaker.nextAttemptTime) {
      return;
    }
    
    const healthCheckUrl = `${provider.baseUrl}/health`;
    const startTime = Date.now();
    
    try {
      const response = await this.makeHealthCheckRequest(healthCheckUrl);
      const responseTime = Date.now() - startTime;
      
      if (response.ok && responseTime < this.config.timeout) {
        this.recordSuccessfulHealthCheck(providerName, responseTime);
      } else {
        this.recordFailedHealthCheck(providerName, new Error(`Health check failed: ${response.status}`));
      }
    } catch (error) {
      this.recordFailedHealthCheck(providerName, error);
    }
  }

  /**
   * Make health check request with timeout
   * @param {string} url - Health check URL
   * @returns {Promise} - Response promise
   */
  async makeHealthCheckRequest(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'MLG-CDN-HealthCheck/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Record successful health check
   * @param {string} providerName - Provider name
   * @param {number} responseTime - Response time in ms
   */
  recordSuccessfulHealthCheck(providerName, responseTime) {
    const status = this.healthStatus.get(providerName);
    const circuitBreaker = this.circuitBreakers.get(providerName);
    
    // Update health status
    status.consecutiveFailures = 0;
    status.consecutiveSuccesses++;
    status.lastCheck = Date.now();
    status.responseTime = responseTime;
    status.requestCount++;
    
    // Update circuit breaker
    if (circuitBreaker.state === 'HALF_OPEN' && 
        status.consecutiveSuccesses >= this.config.recoveryThreshold) {
      circuitBreaker.state = 'CLOSED';
      circuitBreaker.failureCount = 0;
      console.log(`Circuit breaker closed for provider: ${providerName}`);
    }
    
    // Mark as healthy if it wasn't
    if (!status.isHealthy) {
      status.isHealthy = true;
      this.emit('providerRecovered', {
        provider: providerName,
        responseTime,
        timestamp: Date.now()
      });
      console.log(`Provider recovered: ${providerName}`);
    }
  }

  /**
   * Record failed health check
   * @param {string} providerName - Provider name
   * @param {Error} error - Error that occurred
   */
  recordFailedHealthCheck(providerName, error) {
    const status = this.healthStatus.get(providerName);
    const circuitBreaker = this.circuitBreakers.get(providerName);
    
    // Update health status
    status.consecutiveFailures++;
    status.consecutiveSuccesses = 0;
    status.lastCheck = Date.now();
    status.lastError = error.message;
    status.errorCount++;
    
    // Update circuit breaker
    circuitBreaker.failureCount++;
    circuitBreaker.lastFailureTime = Date.now();
    
    if (circuitBreaker.failureCount >= this.config.failureThreshold) {
      circuitBreaker.state = 'OPEN';
      circuitBreaker.nextAttemptTime = Date.now() + (30000 * Math.pow(2, Math.min(circuitBreaker.failureCount - this.config.failureThreshold, 5))); // Exponential backoff
      console.log(`Circuit breaker opened for provider: ${providerName}`);
    }
    
    // Mark as unhealthy if consecutive failures exceed threshold
    if (status.consecutiveFailures >= this.config.failureThreshold && status.isHealthy) {
      status.isHealthy = false;
      this.emit('providerFailed', {
        provider: providerName,
        error: error.message,
        consecutiveFailures: status.consecutiveFailures,
        timestamp: Date.now()
      });
      console.error(`Provider failed: ${providerName} - ${error.message}`);
    }
  }

  /**
   * Evaluate if failover conditions are met
   */
  evaluateFailoverConditions() {
    const primaryStatus = this.healthStatus.get(this.currentPrimary);
    
    if (!primaryStatus || !primaryStatus.isHealthy) {
      this.initiateFailover();
    } else if (this.isFailoverActive) {
      this.evaluateFailoverRecovery();
    }
  }

  /**
   * Initiate failover to backup provider
   */
  initiateFailover() {
    if (this.isFailoverActive) return;
    
    const backupProvider = this.selectBestBackupProvider();
    if (!backupProvider) {
      console.error('No healthy backup providers available for failover');
      this.emit('failoverFailed', {
        primary: this.currentPrimary,
        timestamp: Date.now()
      });
      return;
    }
    
    console.warn(`Initiating failover from ${this.currentPrimary} to ${backupProvider}`);
    
    this.isFailoverActive = true;
    const previousPrimary = this.currentPrimary;
    this.currentPrimary = backupProvider;
    
    this.emit('failoverInitiated', {
      from: previousPrimary,
      to: backupProvider,
      timestamp: Date.now()
    });
    
    // Process queued requests with new provider
    this.processQueuedRequests();
  }

  /**
   * Select best backup provider for failover
   * @returns {string|null} - Best backup provider name
   */
  selectBestBackupProvider() {
    const healthyProviders = Array.from(this.providers.entries())
      .filter(([name, provider]) => {
        const status = this.healthStatus.get(name);
        return name !== this.currentPrimary && status.isHealthy;
      })
      .sort((a, b) => {
        // Sort by priority (lower number = higher priority) then by response time
        const priorityDiff = a[1].priority - b[1].priority;
        if (priorityDiff !== 0) return priorityDiff;
        
        const statusA = this.healthStatus.get(a[0]);
        const statusB = this.healthStatus.get(b[0]);
        return statusA.responseTime - statusB.responseTime;
      });
    
    return healthyProviders.length > 0 ? healthyProviders[0][0] : null;
  }

  /**
   * Evaluate if primary provider has recovered
   */
  evaluateFailoverRecovery() {
    const originalPrimary = this.getOriginalPrimary();
    const originalStatus = this.healthStatus.get(originalPrimary);
    
    if (originalStatus && originalStatus.isHealthy && 
        originalStatus.consecutiveSuccesses >= this.config.recoveryThreshold) {
      this.initiateFailoverRecovery(originalPrimary);
    }
  }

  /**
   * Get original primary provider (highest priority)
   * @returns {string} - Original primary provider name
   */
  getOriginalPrimary() {
    return Array.from(this.providers.entries())
      .sort((a, b) => a[1].priority - b[1].priority)[0][0];
  }

  /**
   * Initiate failover recovery to original primary
   * @param {string} originalPrimary - Original primary provider name
   */
  initiateFailoverRecovery(originalPrimary) {
    console.log(`Initiating failover recovery to ${originalPrimary}`);
    
    const currentBackup = this.currentPrimary;
    this.currentPrimary = originalPrimary;
    this.isFailoverActive = false;
    
    this.emit('failoverRecovered', {
      from: currentBackup,
      to: originalPrimary,
      timestamp: Date.now()
    });
  }

  /**
   * Get current active provider for a request
   * @param {Object} options - Request options
   * @returns {string} - Active provider name
   */
  getActiveProvider(options = {}) {
    // Check for region-specific routing
    if (options.region) {
      const regionalProvider = this.getRegionalProvider(options.region);
      if (regionalProvider) {
        const status = this.healthStatus.get(regionalProvider);
        if (status && status.isHealthy) {
          return regionalProvider;
        }
      }
    }
    
    // Return current primary if healthy
    const primaryStatus = this.healthStatus.get(this.currentPrimary);
    if (primaryStatus && primaryStatus.isHealthy) {
      return this.currentPrimary;
    }
    
    // Fallback to any healthy provider
    return this.selectBestBackupProvider() || this.currentPrimary;
  }

  /**
   * Get provider for specific region
   * @param {string} region - Target region
   * @returns {string|null} - Regional provider name
   */
  getRegionalProvider(region) {
    for (const [name, provider] of this.providers) {
      if (provider.regions.includes(region)) {
        return name;
      }
    }
    return null;
  }

  /**
   * Make request with automatic failover
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise} - Request promise with failover
   */
  async makeRequestWithFailover(url, options = {}) {
    let lastError;
    let attempts = 0;
    const maxAttempts = Math.min(this.providers.size, this.config.maxRetries);
    
    while (attempts < maxAttempts) {
      const provider = this.getActiveProvider(options);
      const providerConfig = this.providers.get(provider);
      
      try {
        const requestUrl = url.replace(/^https?:\/\/[^\/]+/, providerConfig.baseUrl);
        const response = await this.makeTimedRequest(requestUrl, options);
        
        // Record successful request
        this.recordRequestSuccess(provider, Date.now() - options.startTime || 0);
        
        return response;
      } catch (error) {
        lastError = error;
        this.recordRequestFailure(provider, error);
        
        // Try next provider
        attempts++;
        if (attempts < maxAttempts) {
          const backoffDelay = Math.min(1000 * Math.pow(this.config.backoffMultiplier, attempts), 10000);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Make timed request
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise} - Response promise
   */
  async makeTimedRequest(url, options) {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      options.responseTime = Date.now() - startTime;
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Record successful request
   * @param {string} provider - Provider name
   * @param {number} responseTime - Response time
   */
  recordRequestSuccess(provider, responseTime) {
    const metrics = this.performanceMetrics.get(provider);
    if (metrics) {
      metrics.avgResponseTime = (metrics.avgResponseTime * 0.9) + (responseTime * 0.1);
      metrics.requestsPerSecond++;
    }
  }

  /**
   * Record failed request
   * @param {string} provider - Provider name
   * @param {Error} error - Request error
   */
  recordRequestFailure(provider, error) {
    const status = this.healthStatus.get(provider);
    if (status) {
      status.errorCount++;
    }
    
    console.error(`Request failed for provider ${provider}:`, error.message);
  }

  /**
   * Process queued requests after failover
   */
  async processQueuedRequests() {
    for (const [provider, queue] of this.requestQueues) {
      if (queue.length > 0) {
        console.log(`Processing ${queue.length} queued requests for ${provider}`);
        
        const requests = queue.splice(0);
        const processPromises = requests.map(async (queuedRequest) => {
          try {
            const response = await this.makeRequestWithFailover(
              queuedRequest.url, 
              queuedRequest.options
            );
            queuedRequest.resolve(response);
          } catch (error) {
            queuedRequest.reject(error);
          }
        });
        
        await Promise.allSettled(processPromises);
      }
    }
  }

  /**
   * Start metrics collection
   */
  startMetricsCollection() {
    setInterval(() => {
      this.updatePerformanceMetrics();
    }, 60000); // Update every minute
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics() {
    for (const [provider, metrics] of this.performanceMetrics) {
      const status = this.healthStatus.get(provider);
      
      // Calculate uptime percentage
      if (status) {
        const totalChecks = status.requestCount + status.errorCount;
        status.uptime = totalChecks > 0 ? ((totalChecks - status.errorCount) / totalChecks) * 100 : 100;
      }
      
      // Reset per-second counters
      metrics.requestsPerSecond = 0;
      metrics.lastMetricsReset = Date.now();
    }
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.on('providerFailed', (event) => {
      console.log(`📊 Provider Failed: ${event.provider} after ${event.consecutiveFailures} consecutive failures`);
    });
    
    this.on('providerRecovered', (event) => {
      console.log(`✅ Provider Recovered: ${event.provider} (${event.responseTime}ms response time)`);
    });
    
    this.on('failoverInitiated', (event) => {
      console.log(`🔄 Failover Initiated: ${event.from} → ${event.to}`);
    });
    
    this.on('failoverRecovered', (event) => {
      console.log(`🔙 Failover Recovered: ${event.from} → ${event.to}`);
    });
  }

  /**
   * Get comprehensive status report
   * @returns {Object} - Status report
   */
  getStatusReport() {
    const report = {
      currentPrimary: this.currentPrimary,
      isFailoverActive: this.isFailoverActive,
      providers: {},
      circuitBreakers: {},
      performanceMetrics: {},
      summary: {
        totalProviders: this.providers.size,
        healthyProviders: 0,
        unhealthyProviders: 0,
        openCircuitBreakers: 0
      }
    };
    
    for (const [name, provider] of this.providers) {
      const status = this.healthStatus.get(name);
      const circuitBreaker = this.circuitBreakers.get(name);
      const metrics = this.performanceMetrics.get(name);
      
      report.providers[name] = {
        ...provider,
        health: status,
        isActive: name === this.currentPrimary
      };
      
      report.circuitBreakers[name] = circuitBreaker;
      report.performanceMetrics[name] = metrics;
      
      // Update summary
      if (status.isHealthy) {
        report.summary.healthyProviders++;
      } else {
        report.summary.unhealthyProviders++;
      }
      
      if (circuitBreaker.state === 'OPEN') {
        report.summary.openCircuitBreakers++;
      }
    }
    
    return report;
  }

  /**
   * Shutdown failover manager
   */
  shutdown() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    
    this.removeAllListeners();
    console.log('CDN failover manager shutdown');
  }
}

/**
 * Create and export default failover manager instance
 */
export const cdnFailoverManager = new CDNFailoverManager();

// Export for testing
export { CDNFailoverManager };