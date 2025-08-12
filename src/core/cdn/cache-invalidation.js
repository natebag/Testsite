/**
 * @fileoverview CDN Cache Invalidation and Purging System
 * Handles cache invalidation, purging, and content freshness management
 */

import { EventEmitter } from 'events';

/**
 * Cache Invalidation Manager
 */
export class CacheInvalidationManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      batchSize: config.batchSize || 100,
      batchDelay: config.batchDelay || 5000, // 5 seconds
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      enableBatching: config.enableBatching !== false,
      enableTagBased: config.enableTagBased !== false,
      enableWildcard: config.enableWildcard !== false,
      ...config
    };
    
    this.invalidationQueue = [];
    this.batchTimer = null;
    this.processingStatus = new Map();
    this.invalidationHistory = [];
    this.tagMappings = new Map();
    this.dependencyGraph = new Map();
    
    this.providers = new Map();
    this.isProcessing = false;
    
    this.initializeInvalidationSystem();
  }

  /**
   * Register CDN provider for cache invalidation
   * @param {string} name - Provider name
   * @param {Object} config - Provider configuration
   */
  registerProvider(name, config) {
    this.providers.set(name, {
      name,
      type: config.type, // 'cloudflare', 'aws_cloudfront', 'fastly', etc.
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      baseUrl: config.baseUrl,
      zoneId: config.zoneId,
      distributionId: config.distributionId,
      endpoints: {
        invalidate: config.endpoints?.invalidate,
        purge: config.endpoints?.purge,
        status: config.endpoints?.status
      },
      rateLimits: {
        requestsPerMinute: config.rateLimits?.requestsPerMinute || 1200,
        burstLimit: config.rateLimits?.burstLimit || 100
      },
      capabilities: config.capabilities || ['path', 'tag', 'wildcard'],
      ...config
    });
    
    console.log(`CDN provider registered for cache invalidation: ${name}`);
  }

  /**
   * Initialize invalidation system
   */
  initializeInvalidationSystem() {
    this.setupEventHandlers();
    this.startBatchProcessor();
  }

  /**
   * Invalidate content by paths
   * @param {Array|string} paths - Paths to invalidate
   * @param {Object} options - Invalidation options
   * @returns {Promise<Object>} - Invalidation result
   */
  async invalidatePaths(paths, options = {}) {
    const pathArray = Array.isArray(paths) ? paths : [paths];
    const invalidationId = this.generateInvalidationId();
    
    const invalidationRequest = {
      id: invalidationId,
      type: 'path',
      paths: pathArray,
      providers: options.providers || Array.from(this.providers.keys()),
      priority: options.priority || 'normal',
      tags: options.tags || [],
      timestamp: Date.now(),
      options: {
        recursive: options.recursive || false,
        includeQueryParams: options.includeQueryParams || false,
        ...options
      }
    };
    
    // Add tags for future reference
    if (options.tags && options.tags.length > 0) {
      this.addTagMappings(pathArray, options.tags);
    }
    
    // Add to processing queue
    return await this.queueInvalidation(invalidationRequest);
  }

  /**
   * Invalidate content by tags
   * @param {Array|string} tags - Tags to invalidate
   * @param {Object} options - Invalidation options
   * @returns {Promise<Object>} - Invalidation result
   */
  async invalidateByTags(tags, options = {}) {
    if (!this.config.enableTagBased) {
      throw new Error('Tag-based invalidation is disabled');
    }
    
    const tagArray = Array.isArray(tags) ? tags : [tags];
    const invalidationId = this.generateInvalidationId();
    
    // Get paths associated with tags
    const pathsToInvalidate = this.getPathsFromTags(tagArray);
    
    const invalidationRequest = {
      id: invalidationId,
      type: 'tag',
      tags: tagArray,
      paths: pathsToInvalidate,
      providers: options.providers || Array.from(this.providers.keys()),
      priority: options.priority || 'normal',
      timestamp: Date.now(),
      options: options
    };
    
    return await this.queueInvalidation(invalidationRequest);
  }

  /**
   * Invalidate content by wildcard patterns
   * @param {Array|string} patterns - Wildcard patterns
   * @param {Object} options - Invalidation options
   * @returns {Promise<Object>} - Invalidation result
   */
  async invalidateByWildcard(patterns, options = {}) {
    if (!this.config.enableWildcard) {
      throw new Error('Wildcard invalidation is disabled');
    }
    
    const patternArray = Array.isArray(patterns) ? patterns : [patterns];
    const invalidationId = this.generateInvalidationId();
    
    const invalidationRequest = {
      id: invalidationId,
      type: 'wildcard',
      patterns: patternArray,
      providers: options.providers || Array.from(this.providers.keys()),
      priority: options.priority || 'normal',
      timestamp: Date.now(),
      options: options
    };
    
    return await this.queueInvalidation(invalidationRequest);
  }

  /**
   * Purge entire cache for specific providers
   * @param {Object} options - Purge options
   * @returns {Promise<Object>} - Purge result
   */
  async purgeAll(options = {}) {
    const invalidationId = this.generateInvalidationId();
    
    const purgeRequest = {
      id: invalidationId,
      type: 'purge_all',
      providers: options.providers || Array.from(this.providers.keys()),
      priority: 'high',
      timestamp: Date.now(),
      options: options
    };
    
    console.warn('Cache purge requested for all content - this is an expensive operation');
    
    return await this.processImmediateInvalidation(purgeRequest);
  }

  /**
   * Queue invalidation request for batch processing
   * @param {Object} invalidationRequest - Invalidation request
   * @returns {Promise<Object>} - Queue result
   */
  async queueInvalidation(invalidationRequest) {
    // Check for immediate processing
    if (invalidationRequest.priority === 'urgent' || !this.config.enableBatching) {
      return await this.processImmediateInvalidation(invalidationRequest);
    }
    
    // Add to batch queue
    this.invalidationQueue.push(invalidationRequest);
    
    // Set processing status
    this.processingStatus.set(invalidationRequest.id, {
      status: 'queued',
      queuedAt: Date.now(),
      request: invalidationRequest
    });
    
    this.emit('invalidationQueued', {
      id: invalidationRequest.id,
      type: invalidationRequest.type,
      paths: invalidationRequest.paths,
      queueSize: this.invalidationQueue.length
    });
    
    return {
      id: invalidationRequest.id,
      status: 'queued',
      queuePosition: this.invalidationQueue.length,
      estimatedProcessingTime: this.estimateProcessingTime()
    };
  }

  /**
   * Process invalidation immediately (bypass queue)
   * @param {Object} invalidationRequest - Invalidation request
   * @returns {Promise<Object>} - Processing result
   */
  async processImmediateInvalidation(invalidationRequest) {
    this.processingStatus.set(invalidationRequest.id, {
      status: 'processing',
      startedAt: Date.now(),
      request: invalidationRequest
    });
    
    try {
      const results = await this.executeInvalidation(invalidationRequest);
      
      this.processingStatus.set(invalidationRequest.id, {
        status: 'completed',
        completedAt: Date.now(),
        results: results
      });
      
      this.addToHistory(invalidationRequest, results);
      
      this.emit('invalidationCompleted', {
        id: invalidationRequest.id,
        results: results
      });
      
      return {
        id: invalidationRequest.id,
        status: 'completed',
        results: results
      };
    } catch (error) {
      this.processingStatus.set(invalidationRequest.id, {
        status: 'failed',
        failedAt: Date.now(),
        error: error.message
      });
      
      this.emit('invalidationFailed', {
        id: invalidationRequest.id,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Execute invalidation across providers
   * @param {Object} invalidationRequest - Invalidation request
   * @returns {Promise<Object>} - Execution results
   */
  async executeInvalidation(invalidationRequest) {
    const results = {
      successful: [],
      failed: [],
      totalProviders: invalidationRequest.providers.length,
      startTime: Date.now()
    };
    
    const invalidationPromises = invalidationRequest.providers.map(async (providerName) => {
      try {
        const provider = this.providers.get(providerName);
        if (!provider) {
          throw new Error(`Provider not found: ${providerName}`);
        }
        
        const result = await this.invalidateWithProvider(provider, invalidationRequest);
        results.successful.push({
          provider: providerName,
          result: result
        });
      } catch (error) {
        console.error(`Invalidation failed for provider ${providerName}:`, error);
        results.failed.push({
          provider: providerName,
          error: error.message
        });
      }
    });
    
    await Promise.allSettled(invalidationPromises);
    
    results.endTime = Date.now();
    results.duration = results.endTime - results.startTime;
    results.successRate = (results.successful.length / results.totalProviders) * 100;
    
    return results;
  }

  /**
   * Invalidate with specific provider
   * @param {Object} provider - Provider configuration
   * @param {Object} invalidationRequest - Invalidation request
   * @returns {Promise<Object>} - Provider-specific result
   */
  async invalidateWithProvider(provider, invalidationRequest) {
    switch (provider.type) {
      case 'cloudflare':
        return await this.invalidateCloudflare(provider, invalidationRequest);
      
      case 'aws_cloudfront':
        return await this.invalidateCloudFront(provider, invalidationRequest);
      
      case 'fastly':
        return await this.invalidateFastly(provider, invalidationRequest);
      
      case 'custom':
        return await this.invalidateCustom(provider, invalidationRequest);
      
      default:
        throw new Error(`Unsupported provider type: ${provider.type}`);
    }
  }

  /**
   * Cloudflare cache invalidation
   * @param {Object} provider - Cloudflare provider config
   * @param {Object} invalidationRequest - Invalidation request
   * @returns {Promise<Object>} - Cloudflare result
   */
  async invalidateCloudflare(provider, invalidationRequest) {
    const apiUrl = `https://api.cloudflare.com/client/v4/zones/${provider.zoneId}/purge_cache`;
    
    let purgeData = {};
    
    if (invalidationRequest.type === 'path') {
      purgeData.files = invalidationRequest.paths.map(path => 
        path.startsWith('http') ? path : `${provider.baseUrl}${path}`
      );
    } else if (invalidationRequest.type === 'tag') {
      purgeData.tags = invalidationRequest.tags;
    } else if (invalidationRequest.type === 'purge_all') {
      purgeData.purge_everything = true;
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(purgeData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Cloudflare invalidation failed: ${error.errors?.[0]?.message || 'Unknown error'}`);
    }
    
    const result = await response.json();
    return {
      provider: 'cloudflare',
      success: result.success,
      id: result.result?.id,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * AWS CloudFront cache invalidation
   * @param {Object} provider - CloudFront provider config
   * @param {Object} invalidationRequest - Invalidation request
   * @returns {Promise<Object>} - CloudFront result
   */
  async invalidateCloudFront(provider, invalidationRequest) {
    // This would integrate with AWS SDK in production
    // For now, return mock result
    
    console.log(`Mock CloudFront invalidation for distribution: ${provider.distributionId}`);
    
    return {
      provider: 'aws_cloudfront',
      success: true,
      id: `I${Date.now()}`,
      status: 'InProgress',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Fastly cache invalidation
   * @param {Object} provider - Fastly provider config
   * @param {Object} invalidationRequest - Invalidation request
   * @returns {Promise<Object>} - Fastly result
   */
  async invalidateFastly(provider, invalidationRequest) {
    // Mock Fastly invalidation
    console.log(`Mock Fastly invalidation for service: ${provider.serviceId}`);
    
    return {
      provider: 'fastly',
      success: true,
      id: `purge_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Custom provider invalidation
   * @param {Object} provider - Custom provider config
   * @param {Object} invalidationRequest - Invalidation request
   * @returns {Promise<Object>} - Custom provider result
   */
  async invalidateCustom(provider, invalidationRequest) {
    if (!provider.endpoints?.invalidate) {
      throw new Error('Custom provider missing invalidation endpoint');
    }
    
    const response = await fetch(provider.endpoints.invalidate, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: invalidationRequest.type,
        paths: invalidationRequest.paths,
        tags: invalidationRequest.tags,
        patterns: invalidationRequest.patterns
      })
    });
    
    if (!response.ok) {
      throw new Error(`Custom provider invalidation failed: ${response.status}`);
    }
    
    const result = await response.json();
    return {
      provider: 'custom',
      success: true,
      result: result,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Start batch processor
   */
  startBatchProcessor() {
    if (!this.config.enableBatching) return;
    
    this.batchTimer = setInterval(() => {
      if (this.invalidationQueue.length > 0 && !this.isProcessing) {
        this.processBatch();
      }
    }, this.config.batchDelay);
  }

  /**
   * Process batch of invalidation requests
   */
  async processBatch() {
    if (this.isProcessing || this.invalidationQueue.length === 0) return;
    
    this.isProcessing = true;
    
    try {
      const batch = this.invalidationQueue.splice(0, this.config.batchSize);
      console.log(`Processing cache invalidation batch: ${batch.length} requests`);
      
      const batchResults = await Promise.allSettled(
        batch.map(request => this.processImmediateInvalidation(request))
      );
      
      const successful = batchResults.filter(r => r.status === 'fulfilled').length;
      const failed = batchResults.filter(r => r.status === 'rejected').length;
      
      this.emit('batchProcessed', {
        batchSize: batch.length,
        successful,
        failed,
        timestamp: Date.now()
      });
      
      console.log(`Batch processing completed: ${successful} successful, ${failed} failed`);
    } catch (error) {
      console.error('Batch processing failed:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Add tag mappings for content
   * @param {Array} paths - Content paths
   * @param {Array} tags - Associated tags
   */
  addTagMappings(paths, tags) {
    tags.forEach(tag => {
      if (!this.tagMappings.has(tag)) {
        this.tagMappings.set(tag, new Set());
      }
      
      paths.forEach(path => {
        this.tagMappings.get(tag).add(path);
      });
    });
  }

  /**
   * Get paths from tags
   * @param {Array} tags - Tags to lookup
   * @returns {Array} - Associated paths
   */
  getPathsFromTags(tags) {
    const paths = new Set();
    
    tags.forEach(tag => {
      const tagPaths = this.tagMappings.get(tag);
      if (tagPaths) {
        tagPaths.forEach(path => paths.add(path));
      }
    });
    
    return Array.from(paths);
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.on('invalidationQueued', (event) => {
      console.log(`📝 Cache invalidation queued: ${event.id} (${event.type})`);
    });
    
    this.on('invalidationCompleted', (event) => {
      console.log(`✅ Cache invalidation completed: ${event.id}`);
    });
    
    this.on('invalidationFailed', (event) => {
      console.error(`❌ Cache invalidation failed: ${event.id} - ${event.error}`);
    });
    
    this.on('batchProcessed', (event) => {
      console.log(`📦 Batch processed: ${event.successful}/${event.batchSize} successful`);
    });
  }

  /**
   * Generate unique invalidation ID
   * @returns {string} - Unique ID
   */
  generateInvalidationId() {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Estimate processing time for queued items
   * @returns {number} - Estimated time in milliseconds
   */
  estimateProcessingTime() {
    const queueSize = this.invalidationQueue.length;
    const batchSize = this.config.batchSize;
    const batchDelay = this.config.batchDelay;
    const avgProcessingTime = 2000; // 2 seconds per batch
    
    const numberOfBatches = Math.ceil(queueSize / batchSize);
    return (numberOfBatches * (batchDelay + avgProcessingTime));
  }

  /**
   * Add to invalidation history
   * @param {Object} request - Invalidation request
   * @param {Object} results - Processing results
   */
  addToHistory(request, results) {
    this.invalidationHistory.push({
      id: request.id,
      type: request.type,
      paths: request.paths,
      tags: request.tags,
      timestamp: request.timestamp,
      duration: results.duration,
      successRate: results.successRate,
      providers: results.successful.map(s => s.provider)
    });
    
    // Keep only last 1000 entries
    if (this.invalidationHistory.length > 1000) {
      this.invalidationHistory.shift();
    }
  }

  /**
   * Get invalidation status
   * @param {string} invalidationId - Invalidation ID
   * @returns {Object} - Status information
   */
  getInvalidationStatus(invalidationId) {
    return this.processingStatus.get(invalidationId) || null;
  }

  /**
   * Get invalidation history
   * @param {Object} filters - History filters
   * @returns {Array} - Filtered history
   */
  getInvalidationHistory(filters = {}) {
    let history = [...this.invalidationHistory];
    
    if (filters.type) {
      history = history.filter(h => h.type === filters.type);
    }
    
    if (filters.since) {
      history = history.filter(h => h.timestamp >= filters.since);
    }
    
    if (filters.provider) {
      history = history.filter(h => h.providers.includes(filters.provider));
    }
    
    return history.slice(-100); // Return last 100 entries
  }

  /**
   * Get system statistics
   * @returns {Object} - System statistics
   */
  getStatistics() {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    const recentHistory = this.invalidationHistory.filter(h => h.timestamp >= last24h);
    
    return {
      queue: {
        size: this.invalidationQueue.length,
        estimatedProcessingTime: this.estimateProcessingTime(),
        isProcessing: this.isProcessing
      },
      providers: Array.from(this.providers.keys()),
      statistics: {
        last24h: {
          totalInvalidations: recentHistory.length,
          averageSuccessRate: recentHistory.reduce((sum, h) => sum + h.successRate, 0) / recentHistory.length || 0,
          averageDuration: recentHistory.reduce((sum, h) => sum + h.duration, 0) / recentHistory.length || 0
        },
        allTime: {
          totalInvalidations: this.invalidationHistory.length,
          tagMappings: this.tagMappings.size,
          dependencyMappings: this.dependencyGraph.size
        }
      }
    };
  }

  /**
   * Shutdown invalidation system
   */
  shutdown() {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    
    this.removeAllListeners();
    console.log('Cache invalidation system shutdown');
  }
}

/**
 * Create and export default cache invalidation manager
 */
export const cacheInvalidationManager = new CacheInvalidationManager();

/**
 * Express middleware for automatic cache invalidation
 * @param {Object} options - Middleware options
 * @returns {Function} - Express middleware function
 */
export function cacheInvalidationMiddleware(options = {}) {
  return async (req, res, next) => {
    // Store original methods
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Override response methods to trigger invalidation
    res.send = function(body) {
      // Check if this is a content modification request
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        // Extract content paths from request
        const pathsToInvalidate = extractPathsFromRequest(req, res);
        
        if (pathsToInvalidate.length > 0) {
          // Queue invalidation after response is sent
          setImmediate(async () => {
            try {
              await cacheInvalidationManager.invalidatePaths(pathsToInvalidate, {
                tags: extractTagsFromRequest(req, res),
                priority: 'normal'
              });
            } catch (error) {
              console.error('Auto-invalidation failed:', error);
            }
          });
        }
      }
      
      return originalSend.call(this, body);
    };
    
    res.json = function(obj) {
      return res.send(JSON.stringify(obj));
    };
    
    next();
  };
}

/**
 * Extract paths to invalidate from request
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @returns {Array} - Paths to invalidate
 */
function extractPathsFromRequest(req, res) {
  const paths = [];
  
  // Add request path
  paths.push(req.path);
  
  // Add related paths based on request data
  if (req.body) {
    // Content updates
    if (req.body.contentId) {
      paths.push(`/content/${req.body.contentId}`);
      paths.push('/content/trending');
    }
    
    // User updates
    if (req.body.userId || req.user?.id) {
      const userId = req.body.userId || req.user.id;
      paths.push(`/user/${userId}`);
      paths.push('/users/leaderboard');
    }
    
    // Clan updates
    if (req.body.clanId) {
      paths.push(`/clan/${req.body.clanId}`);
      paths.push('/clans');
    }
  }
  
  return paths;
}

/**
 * Extract tags from request
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @returns {Array} - Tags for invalidation
 */
function extractTagsFromRequest(req, res) {
  const tags = [];
  
  // Extract content type
  if (req.path.includes('/content')) {
    tags.push('content');
  }
  if (req.path.includes('/user')) {
    tags.push('user');
  }
  if (req.path.includes('/clan')) {
    tags.push('clan');
  }
  
  // Add method-based tags
  tags.push(`method-${req.method.toLowerCase()}`);
  
  return tags;
}