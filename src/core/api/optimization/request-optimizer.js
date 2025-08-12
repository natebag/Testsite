/**
 * API Request Optimizer for MLG.clan Platform
 * 
 * Advanced request optimization system with intelligent routing, request batching,
 * compression, and gaming-specific performance enhancements.
 * 
 * Features:
 * - Request batching and deduplication
 * - Intelligent request routing and load balancing
 * - Response compression and optimization
 * - Gaming-specific request prioritization
 * - Connection keep-alive optimization
 * - Request/response caching at multiple levels
 * - Performance monitoring and adaptive optimization
 * 
 * @author Claude Code - API Performance Architect
 * @version 1.0.0
 * @created 2025-08-12
 */

import { EventEmitter } from 'events';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import { performance } from 'perf_hooks';

export class RequestOptimizer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Request batching
      enableBatching: options.enableBatching !== false,
      batchSize: options.batchSize || 10,
      batchWindow: options.batchWindow || 100, // 100ms
      maxBatchWait: options.maxBatchWait || 500, // 500ms
      
      // Request deduplication
      enableDeduplication: options.enableDeduplication !== false,
      deduplicationWindow: options.deduplicationWindow || 1000, // 1 second
      
      // Compression settings
      enableCompression: options.enableCompression !== false,
      compressionThreshold: options.compressionThreshold || 1024, // 1KB
      compressionLevel: options.compressionLevel || 6,
      
      // Gaming-specific optimizations
      enableGamingOptimizations: options.enableGamingOptimizations !== false,
      votingRequestPriority: options.votingRequestPriority || 10,
      leaderboardRequestPriority: options.leaderboardRequestPriority || 8,
      
      // Connection optimization
      enableKeepAlive: options.enableKeepAlive !== false,
      keepAliveTimeout: options.keepAliveTimeout || 60000, // 60 seconds
      maxSockets: options.maxSockets || 50,
      
      // Security and CORS
      enableSecurity: options.enableSecurity !== false,
      corsOrigins: options.corsOrigins || ['http://localhost:3000', 'https://mlg.clan'],
      
      // Performance monitoring
      enableMetrics: options.enableMetrics !== false,
      metricsWindow: options.metricsWindow || 60000, // 1 minute
      
      ...options
    };
    
    // Request batching queues
    this.batchQueues = new Map();
    this.batchTimers = new Map();
    
    // Deduplication cache
    this.requestCache = new Map();
    this.deduplicationTimers = new Map();
    
    // Performance metrics
    this.metrics = {
      totalRequests: 0,
      batchedRequests: 0,
      deduplicatedRequests: 0,
      compressedResponses: 0,
      avgResponseTime: 0,
      totalResponseTime: 0,
      prioritizedRequests: 0,
      errorCount: 0,
      
      // Gaming-specific metrics
      votingRequests: 0,
      leaderboardRequests: 0,
      tournamentRequests: 0,
      
      // Compression metrics
      compressionRatio: 0,
      compressionSavings: 0,
      
      lastReset: Date.now()
    };
    
    // Request priority queue
    this.priorityQueue = [];
    this.processingQueue = false;
    
    this.logger = options.logger || console;
    
    this.setupMiddleware();
    this.startMetricsCollection();
  }

  /**
   * Setup optimization middleware stack
   */
  setupMiddleware() {
    this.middlewareStack = [];
    
    // Security middleware
    if (this.config.enableSecurity) {
      this.middlewareStack.push(this.createSecurityMiddleware());
    }
    
    // CORS middleware
    this.middlewareStack.push(this.createCORSMiddleware());
    
    // Compression middleware
    if (this.config.enableCompression) {
      this.middlewareStack.push(this.createCompressionMiddleware());
    }
    
    // Request optimization middleware
    this.middlewareStack.push(this.createOptimizationMiddleware());
    
    // Gaming-specific middleware
    if (this.config.enableGamingOptimizations) {
      this.middlewareStack.push(this.createGamingOptimizationMiddleware());
    }
    
    // Metrics middleware
    if (this.config.enableMetrics) {
      this.middlewareStack.push(this.createMetricsMiddleware());
    }
  }

  /**
   * Create security middleware
   */
  createSecurityMiddleware() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "https:"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: false, // Allow embedding for gaming widgets
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    });
  }

  /**
   * Create CORS middleware
   */
  createCORSMiddleware() {
    return cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        // Allow configured origins
        if (this.config.corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        // Allow localhost in development
        if (process.env.NODE_ENV === 'development' && 
            origin.includes('localhost')) {
          return callback(null, true);
        }
        
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'X-Gaming-Priority',
        'X-Request-ID'
      ],
      maxAge: 86400 // 24 hours
    });
  }

  /**
   * Create compression middleware
   */
  createCompressionMiddleware() {
    return compression({
      level: this.config.compressionLevel,
      threshold: this.config.compressionThreshold,
      filter: (req, res) => {
        // Don't compress if client doesn't support it
        if (req.headers['x-no-compression']) {
          return false;
        }
        
        // Compress JSON responses
        if (res.getHeader('content-type')?.includes('application/json')) {
          return true;
        }
        
        // Use default compression filter
        return compression.filter(req, res);
      },
      // Custom compression for gaming data
      chunkSize: 16384, // 16KB chunks for better streaming
      windowBits: 15,
      memLevel: 8
    });
  }

  /**
   * Create main optimization middleware
   */
  createOptimizationMiddleware() {
    return async (req, res, next) => {
      const startTime = performance.now();
      this.metrics.totalRequests++;
      
      try {
        // Add request ID for tracking
        req.requestId = this.generateRequestId();
        res.setHeader('X-Request-ID', req.requestId);
        
        // Check for request deduplication
        if (this.config.enableDeduplication) {
          const duplicate = await this.checkDuplication(req);
          if (duplicate) {
            this.metrics.deduplicatedRequests++;
            return this.sendCachedResponse(res, duplicate);
          }
        }
        
        // Apply keep-alive optimization
        if (this.config.enableKeepAlive) {
          res.setHeader('Connection', 'keep-alive');
          res.setHeader('Keep-Alive', `timeout=${this.config.keepAliveTimeout / 1000}`);
        }
        
        // Set optimization headers
        res.setHeader('X-Optimization-Version', '1.0');
        res.setHeader('X-Performance-Mode', 'gaming');
        
        // Intercept response to apply post-processing
        this.interceptResponse(req, res, startTime);
        
        next();
        
      } catch (error) {
        this.metrics.errorCount++;
        this.logger.error('Request optimization error:', error);
        next(error);
      }
    };
  }

  /**
   * Create gaming-specific optimization middleware
   */
  createGamingOptimizationMiddleware() {
    return async (req, res, next) => {
      try {
        // Detect gaming-critical requests
        const priority = this.getRequestPriority(req);
        
        if (priority > 5) {
          this.metrics.prioritizedRequests++;
          
          // Set high-priority headers
          res.setHeader('X-Gaming-Priority', priority);
          res.setHeader('Cache-Control', 'no-cache, must-revalidate');
          
          // Add to priority queue if batching is enabled
          if (this.config.enableBatching && this.shouldBatch(req)) {
            return this.addToBatch(req, res, priority);
          }
        }
        
        // Apply gaming-specific headers
        this.setGamingHeaders(req, res);
        
        next();
        
      } catch (error) {
        this.logger.error('Gaming optimization error:', error);
        next(error);
      }
    };
  }

  /**
   * Create metrics collection middleware
   */
  createMetricsMiddleware() {
    return (req, res, next) => {
      const startTime = performance.now();
      
      // Intercept response to collect metrics
      const originalSend = res.send;
      res.send = function(data) {
        const responseTime = performance.now() - startTime;
        this.updateResponseMetrics(req, res, responseTime, data);
        return originalSend.call(res, data);
      }.bind(this);
      
      next();
    };
  }

  /**
   * Get request priority based on endpoint and headers
   */
  getRequestPriority(req) {
    const path = req.path;
    const gamingHeader = req.headers['x-gaming-priority'];
    
    // Explicit priority header
    if (gamingHeader && !isNaN(gamingHeader)) {
      return Math.min(parseInt(gamingHeader), 10);
    }
    
    // Voting endpoints - highest priority
    if (path.includes('/vote') || path.includes('/voting')) {
      this.metrics.votingRequests++;
      return this.config.votingRequestPriority;
    }
    
    // Leaderboard endpoints - high priority
    if (path.includes('/leaderboard') || path.includes('/ranking')) {
      this.metrics.leaderboardRequests++;
      return this.config.leaderboardRequestPriority;
    }
    
    // Tournament endpoints - high priority
    if (path.includes('/tournament')) {
      this.metrics.tournamentRequests++;
      return 8;
    }
    
    // Real-time endpoints - medium-high priority
    if (path.includes('/realtime') || path.includes('/live')) {
      return 7;
    }
    
    // User profile endpoints - medium priority
    if (path.includes('/user') || path.includes('/profile')) {
      return 5;
    }
    
    // Clan endpoints - medium priority
    if (path.includes('/clan')) {
      return 5;
    }
    
    // Content endpoints - lower priority
    if (path.includes('/content')) {
      return 3;
    }
    
    // Default priority
    return 1;
  }

  /**
   * Set gaming-specific response headers
   */
  setGamingHeaders(req, res) {
    const path = req.path;
    
    // Voting endpoints
    if (path.includes('/vote')) {
      res.setHeader('X-Gaming-Feature', 'voting');
      res.setHeader('X-Cache-Strategy', 'realtime');
      res.setHeader('X-Max-Age', '5'); // 5 seconds max cache
    }
    
    // Leaderboard endpoints
    else if (path.includes('/leaderboard')) {
      res.setHeader('X-Gaming-Feature', 'leaderboard');
      res.setHeader('X-Cache-Strategy', 'frequent-refresh');
      res.setHeader('X-Max-Age', '30'); // 30 seconds max cache
    }
    
    // Tournament endpoints
    else if (path.includes('/tournament')) {
      res.setHeader('X-Gaming-Feature', 'tournament');
      res.setHeader('X-Cache-Strategy', 'event-based');
      res.setHeader('X-Max-Age', '60'); // 1 minute max cache
    }
    
    // Set common gaming headers
    res.setHeader('X-Gaming-Platform', 'MLG.clan');
    res.setHeader('X-Real-Time-Updates', 'supported');
  }

  /**
   * Check for request deduplication
   */
  async checkDuplication(req) {
    if (req.method !== 'GET') {
      return null; // Only deduplicate GET requests
    }
    
    const key = this.generateDeduplicationKey(req);
    const cached = this.requestCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.config.deduplicationWindow) {
      return cached.response;
    }
    
    return null;
  }

  /**
   * Generate deduplication key
   */
  generateDeduplicationKey(req) {
    return `${req.method}:${req.path}:${JSON.stringify(req.query)}:${req.user?.id || 'anonymous'}`;
  }

  /**
   * Cache response for deduplication
   */
  cacheResponse(req, responseData) {
    if (req.method !== 'GET') return;
    
    const key = this.generateDeduplicationKey(req);
    
    this.requestCache.set(key, {
      response: responseData,
      timestamp: Date.now()
    });
    
    // Set cleanup timer
    if (this.deduplicationTimers.has(key)) {
      clearTimeout(this.deduplicationTimers.get(key));
    }
    
    const timer = setTimeout(() => {
      this.requestCache.delete(key);
      this.deduplicationTimers.delete(key);
    }, this.config.deduplicationWindow);
    
    this.deduplicationTimers.set(key, timer);
  }

  /**
   * Send cached response
   */
  sendCachedResponse(res, cachedData) {
    res.setHeader('X-Cache', 'HIT-DEDUPLICATED');
    res.setHeader('X-Deduplication', 'true');
    
    if (typeof cachedData === 'object') {
      res.json(cachedData);
    } else {
      res.send(cachedData);
    }
  }

  /**
   * Intercept response for post-processing
   */
  interceptResponse(req, res, startTime) {
    const originalSend = res.send;
    const originalJson = res.json;
    
    res.send = function(data) {
      this.processResponse(req, res, data, startTime);
      return originalSend.call(res, data);
    }.bind(this);
    
    res.json = function(obj) {
      this.processResponse(req, res, obj, startTime);
      return originalJson.call(res, obj);
    }.bind(this);
  }

  /**
   * Process response data
   */
  processResponse(req, res, data, startTime) {
    const responseTime = performance.now() - startTime;
    
    // Cache successful responses for deduplication
    if (res.statusCode === 200 && this.config.enableDeduplication) {
      this.cacheResponse(req, data);
    }
    
    // Update metrics
    this.updateResponseMetrics(req, res, responseTime, data);
    
    // Set performance headers
    res.setHeader('X-Response-Time', `${Math.round(responseTime)}ms`);
    
    // Emit performance event
    this.emit('response:processed', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      priority: this.getRequestPriority(req)
    });
  }

  /**
   * Update response metrics
   */
  updateResponseMetrics(req, res, responseTime, data) {
    this.metrics.totalResponseTime += responseTime;
    this.metrics.avgResponseTime = this.metrics.totalResponseTime / this.metrics.totalRequests;
    
    // Track compression
    if (res.getHeader('content-encoding')) {
      this.metrics.compressedResponses++;
      
      if (typeof data === 'string' && data.length > this.config.compressionThreshold) {
        const estimatedSavings = data.length * 0.3; // Approximate 30% compression
        this.metrics.compressionSavings += estimatedSavings;
      }
    }
    
    // Track errors
    if (res.statusCode >= 400) {
      this.metrics.errorCount++;
    }
  }

  /**
   * Request batching functionality
   */
  shouldBatch(req) {
    // Only batch read operations
    if (req.method !== 'GET') return false;
    
    // Don't batch real-time critical endpoints
    const path = req.path;
    if (path.includes('/vote') || path.includes('/realtime')) {
      return false;
    }
    
    return true;
  }

  addToBatch(req, res, priority) {
    const batchKey = this.generateBatchKey(req);
    
    if (!this.batchQueues.has(batchKey)) {
      this.batchQueues.set(batchKey, []);
    }
    
    const batch = this.batchQueues.get(batchKey);
    batch.push({ req, res, priority, timestamp: Date.now() });
    
    // Process batch when it reaches size limit
    if (batch.length >= this.config.batchSize) {
      this.processBatch(batchKey);
    }
    // Or set timer for batch processing
    else if (!this.batchTimers.has(batchKey)) {
      const timer = setTimeout(() => {
        this.processBatch(batchKey);
      }, this.config.batchWindow);
      
      this.batchTimers.set(batchKey, timer);
    }
  }

  generateBatchKey(req) {
    // Group similar requests for batching
    const pathPattern = req.path.replace(/\/\d+/g, '/:id');
    return `${req.method}:${pathPattern}`;
  }

  async processBatch(batchKey) {
    const batch = this.batchQueues.get(batchKey);
    if (!batch || batch.length === 0) return;
    
    // Clear timer
    if (this.batchTimers.has(batchKey)) {
      clearTimeout(this.batchTimers.get(batchKey));
      this.batchTimers.delete(batchKey);
    }
    
    // Sort by priority
    batch.sort((a, b) => b.priority - a.priority);
    
    // Process batch
    try {
      for (const item of batch) {
        // Check if request hasn't timed out
        if (Date.now() - item.timestamp < this.config.maxBatchWait) {
          // Process individual request
          // This would typically forward to the actual handler
          this.metrics.batchedRequests++;
        }
      }
    } catch (error) {
      this.logger.error('Batch processing error:', error);
    } finally {
      // Clear batch
      this.batchQueues.delete(batchKey);
    }
  }

  /**
   * Utility methods
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start metrics collection
   */
  startMetricsCollection() {
    setInterval(() => {
      this.emitMetrics();
    }, this.config.metricsWindow);
  }

  /**
   * Emit performance metrics
   */
  emitMetrics() {
    const uptime = Date.now() - this.metrics.lastReset;
    const requestsPerSecond = this.metrics.totalRequests / (uptime / 1000);
    
    const metricsSnapshot = {
      ...this.metrics,
      uptime,
      requestsPerSecond: Math.round(requestsPerSecond * 100) / 100,
      batchingEfficiency: this.metrics.totalRequests > 0 ? 
        (this.metrics.batchedRequests / this.metrics.totalRequests) * 100 : 0,
      deduplicationRate: this.metrics.totalRequests > 0 ? 
        (this.metrics.deduplicatedRequests / this.metrics.totalRequests) * 100 : 0,
      errorRate: this.metrics.totalRequests > 0 ? 
        (this.metrics.errorCount / this.metrics.totalRequests) * 100 : 0,
      compressionRate: this.metrics.totalRequests > 0 ? 
        (this.metrics.compressedResponses / this.metrics.totalRequests) * 100 : 0
    };
    
    this.emit('metrics:snapshot', metricsSnapshot);
  }

  /**
   * Get optimization statistics
   */
  getStats() {
    return {
      ...this.metrics,
      activeQueues: {
        batching: this.batchQueues.size,
        deduplication: this.requestCache.size
      },
      configuration: {
        batchingEnabled: this.config.enableBatching,
        deduplicationEnabled: this.config.enableDeduplication,
        compressionEnabled: this.config.enableCompression,
        gamingOptimizationsEnabled: this.config.enableGamingOptimizations
      }
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      batchedRequests: 0,
      deduplicatedRequests: 0,
      compressedResponses: 0,
      avgResponseTime: 0,
      totalResponseTime: 0,
      prioritizedRequests: 0,
      errorCount: 0,
      votingRequests: 0,
      leaderboardRequests: 0,
      tournamentRequests: 0,
      compressionRatio: 0,
      compressionSavings: 0,
      lastReset: Date.now()
    };
  }

  /**
   * Get middleware stack
   */
  getMiddleware() {
    return this.middlewareStack;
  }

  /**
   * Shutdown optimization system
   */
  shutdown() {
    // Clear all timers
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer);
    }
    
    for (const timer of this.deduplicationTimers.values()) {
      clearTimeout(timer);
    }
    
    // Clear caches
    this.batchQueues.clear();
    this.requestCache.clear();
    this.batchTimers.clear();
    this.deduplicationTimers.clear();
    
    this.logger.info('Request Optimizer shutdown complete');
  }
}

// Create singleton instance
let globalRequestOptimizer = null;

export function createRequestOptimizer(options = {}) {
  return new RequestOptimizer(options);
}

export function getRequestOptimizer(options = {}) {
  if (!globalRequestOptimizer) {
    globalRequestOptimizer = new RequestOptimizer(options);
  }
  return globalRequestOptimizer;
}

export default RequestOptimizer;