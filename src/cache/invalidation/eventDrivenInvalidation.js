/**
 * Event-Driven Cache Invalidation System for MLG.clan Platform
 * 
 * Advanced cache invalidation system that automatically invalidates related caches
 * based on data changes, user actions, and system events. Ensures data consistency
 * while maintaining optimal cache performance through intelligent invalidation strategies.
 * 
 * Features:
 * - Event-driven automatic cache invalidation
 * - Cascade invalidation for related data
 * - Pattern-based cache clearing
 * - Real-time invalidation notifications
 * - Smart invalidation strategies
 * - Dependency graph management
 * - Batch invalidation processing
 * - Performance impact monitoring
 * 
 * @author Claude Code - Performance Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { EventEmitter } from 'events';
import { getCacheManager } from '../cache-manager.js';
import { getUserCache } from '../strategies/userCache.js';
import { getClanCache } from '../strategies/clanCache.js';
import { getContentCache } from '../strategies/contentCache.js';
import { getVotingCache } from '../strategies/votingCache.js';
import { getTransactionCache } from '../strategies/transactionCache.js';

export class EventDrivenInvalidation extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Invalidation settings
      enableCascadeInvalidation: options.enableCascadeInvalidation !== false,
      enableBatchProcessing: options.enableBatchProcessing !== false,
      batchProcessingDelay: options.batchProcessingDelay || 1000, // 1 second
      maxBatchSize: options.maxBatchSize || 100,
      
      // Performance settings
      enablePerformanceTracking: options.enablePerformanceTracking !== false,
      maxInvalidationTime: options.maxInvalidationTime || 5000, // 5 seconds
      
      // Retry settings
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      
      // Event filtering
      enableEventFiltering: options.enableEventFiltering !== false,
      eventFilterThreshold: options.eventFilterThreshold || 100, // events per second
      
      ...options
    };
    
    // Cache instances
    this.cache = getCacheManager();
    this.userCache = getUserCache();
    this.clanCache = getClanCache();
    this.contentCache = getContentCache();
    this.votingCache = getVotingCache();
    this.transactionCache = getTransactionCache();
    
    // Invalidation rules and dependencies
    this.invalidationRules = new Map();
    this.dependencyGraph = new Map();
    this.eventHandlers = new Map();
    
    // Batch processing
    this.invalidationQueue = new Map();
    this.batchTimer = null;
    
    // Performance tracking
    this.metrics = {
      totalInvalidations: 0,
      cascadeInvalidations: 0,
      batchInvalidations: 0,
      failedInvalidations: 0,
      avgInvalidationTime: 0,
      totalInvalidationTime: 0,
      eventFilters: 0,
      retries: 0
    };
    
    // Event filtering for high-frequency events
    this.eventFilter = new Map();
    this.eventFilterTimer = new Map();
    
    this.logger = options.logger || console;
    
    this.setupInvalidationRules();
    this.setupEventHandlers();
  }

  /**
   * Setup invalidation rules and dependency mappings
   */
  setupInvalidationRules() {
    // User-related invalidation rules
    this.addInvalidationRule('user:profile:updated', [
      { cache: 'userCache', method: 'invalidateUserCache', params: ['userId'] },
      { cache: 'userCache', method: 'invalidateUserSearch', params: ['field', 'oldValue', 'newValue'] }
    ]);
    
    this.addInvalidationRule('user:stats:updated', [
      { cache: 'userCache', method: 'invalidateUserCache', params: ['userId'] },
      { cache: 'clanCache', method: 'invalidateClanLeaderboards', params: ['clanId'] }
    ]);
    
    this.addInvalidationRule('user:achievement:earned', [
      { cache: 'userCache', method: 'invalidateUserCache', params: ['userId'] }
    ]);
    
    // Clan-related invalidation rules
    this.addInvalidationRule('clan:profile:updated', [
      { cache: 'clanCache', method: 'invalidateClanCache', params: ['clanId'] }
    ]);
    
    this.addInvalidationRule('clan:member:added', [
      { cache: 'clanCache', method: 'invalidateClanMembers', params: ['clanId'] },
      { cache: 'userCache', method: 'invalidateUserCache', params: ['userId'] }
    ]);
    
    this.addInvalidationRule('clan:member:removed', [
      { cache: 'clanCache', method: 'invalidateClanMembers', params: ['clanId'] },
      { cache: 'userCache', method: 'invalidateUserCache', params: ['userId'] }
    ]);
    
    // Content-related invalidation rules
    this.addInvalidationRule('content:created', [
      { cache: 'contentCache', method: 'invalidateTrendingCache' },
      { cache: 'contentCache', method: 'invalidateTagCache', params: ['tags'] }
    ]);
    
    this.addInvalidationRule('content:updated', [
      { cache: 'contentCache', method: 'invalidateContentCache', params: ['contentId'] },
      { cache: 'contentCache', method: 'invalidateSearchCache' }
    ]);
    
    this.addInvalidationRule('content:deleted', [
      { cache: 'contentCache', method: 'invalidateContentCache', params: ['contentId'] },
      { cache: 'contentCache', method: 'invalidateTrendingCache' }
    ]);
    
    // Voting-related invalidation rules
    this.addInvalidationRule('vote:cast', [
      { cache: 'votingCache', method: 'incrementDailyVoteCount', params: ['userId', 'mlgBurned'] },
      { cache: 'contentCache', method: 'updateVoteCount', params: ['contentId', 'voteDelta', 'voteType'] },
      { cache: 'userCache', method: 'invalidateUserCache', params: ['userId'] }
    ]);
    
    this.addInvalidationRule('proposal:vote:cast', [
      { cache: 'votingCache', method: 'updateProposalVoteCount', params: ['proposalId', 'voteType', 'mlgBurned'] },
      { cache: 'clanCache', method: 'invalidateProposalCache', params: ['proposalId'] }
    ]);
    
    // Transaction-related invalidation rules
    this.addInvalidationRule('transaction:completed', [
      { cache: 'transactionCache', method: 'updateBalance', params: ['userId', 'amount', 'component'] },
      { cache: 'transactionCache', method: 'updateTransactionStatus', params: ['transactionId', 'status'] }
    ]);
    
    this.addInvalidationRule('transaction:failed', [
      { cache: 'transactionCache', method: 'updateTransactionStatus', params: ['transactionId', 'status'] }
    ]);
    
    // Global invalidation rules
    this.addInvalidationRule('leaderboard:updated', [
      { cache: 'userCache', method: 'invalidateVotingLeaderboards' },
      { cache: 'clanCache', method: 'invalidateClanLeaderboards', params: ['*'] }
    ]);
  }

  /**
   * Add invalidation rule for specific event
   */
  addInvalidationRule(eventType, actions) {
    if (!this.invalidationRules.has(eventType)) {
      this.invalidationRules.set(eventType, []);
    }
    
    const existingRules = this.invalidationRules.get(eventType);
    existingRules.push(...actions);
    
    // Build dependency graph
    this.buildDependencyGraph(eventType, actions);
  }

  /**
   * Build dependency graph for cascade invalidation
   */
  buildDependencyGraph(eventType, actions) {
    if (!this.dependencyGraph.has(eventType)) {
      this.dependencyGraph.set(eventType, new Set());
    }
    
    const dependencies = this.dependencyGraph.get(eventType);
    
    // Add direct dependencies
    for (const action of actions) {
      const key = `${action.cache}:${action.method}`;
      dependencies.add(key);
      
      // Add cascade dependencies
      if (this.config.enableCascadeInvalidation) {
        this.addCascadeDependencies(key, dependencies);
      }
    }
  }

  /**
   * Add cascade dependencies based on data relationships
   */
  addCascadeDependencies(actionKey, dependencies) {
    const cascadeRules = {
      'userCache:invalidateUserCache': [
        'clanCache:invalidateClanMembers',
        'contentCache:invalidateContentCache'
      ],
      'clanCache:invalidateClanMembers': [
        'userCache:invalidateUserCache',
        'clanCache:invalidateClanLeaderboards'
      ],
      'contentCache:invalidateContentCache': [
        'contentCache:invalidateTrendingCache',
        'contentCache:invalidateSearchCache'
      ],
      'votingCache:updateProposalVoteCount': [
        'clanCache:invalidateProposalCache'
      ]
    };
    
    const cascades = cascadeRules[actionKey] || [];
    cascades.forEach(cascade => dependencies.add(cascade));
  }

  /**
   * Setup event handlers for automatic invalidation
   */
  setupEventHandlers() {
    // Listen to all registered event types
    for (const eventType of this.invalidationRules.keys()) {
      this.setupEventHandler(eventType);
    }
    
    // Setup special handlers for high-frequency events
    this.setupHighFrequencyEventHandlers();
    
    // Setup batch processing
    if (this.config.enableBatchProcessing) {
      this.setupBatchProcessing();
    }
  }

  /**
   * Setup event handler for specific event type
   */
  setupEventHandler(eventType) {
    const handler = async (eventData) => {
      await this.handleInvalidationEvent(eventType, eventData);
    };
    
    this.eventHandlers.set(eventType, handler);
    this.on(eventType, handler);
  }

  /**
   * Setup handlers for high-frequency events with filtering
   */
  setupHighFrequencyEventHandlers() {
    const highFrequencyEvents = [
      'vote:cast',
      'content:viewed',
      'user:activity',
      'transaction:pending'
    ];
    
    for (const eventType of highFrequencyEvents) {
      this.setupFilteredEventHandler(eventType);
    }
  }

  /**
   * Setup filtered event handler to prevent spam
   */
  setupFilteredEventHandler(eventType) {
    if (!this.config.enableEventFiltering) return;
    
    this.on(eventType, (eventData) => {
      const now = Date.now();
      const filterKey = `${eventType}:${eventData.userId || eventData.id}`;
      
      const lastEvent = this.eventFilter.get(filterKey);
      if (lastEvent && (now - lastEvent) < 1000) {
        this.metrics.eventFilters++;
        return; // Skip this event due to filtering
      }
      
      this.eventFilter.set(filterKey, now);
      
      // Clear old filter entries
      if (!this.eventFilterTimer.has(filterKey)) {
        this.eventFilterTimer.set(filterKey, setTimeout(() => {
          this.eventFilter.delete(filterKey);
          this.eventFilterTimer.delete(filterKey);
        }, 60000)); // Clear after 1 minute
      }
      
      this.handleInvalidationEvent(eventType, eventData);
    });
  }

  /**
   * Setup batch processing for invalidations
   */
  setupBatchProcessing() {
    // Process batches at regular intervals
    setInterval(() => {
      this.processBatchInvalidations();
    }, this.config.batchProcessingDelay);
  }

  /**
   * Handle invalidation event
   */
  async handleInvalidationEvent(eventType, eventData) {
    const startTime = Date.now();
    
    try {
      const rules = this.invalidationRules.get(eventType);
      if (!rules || rules.length === 0) {
        return;
      }
      
      if (this.config.enableBatchProcessing && this.shouldBatchProcess(eventType)) {
        await this.queueForBatchProcessing(eventType, eventData, rules);
      } else {
        await this.processImmediateInvalidation(eventType, eventData, rules);
      }
      
      // Update metrics
      this.updateInvalidationMetrics(startTime, 'success');
      
    } catch (error) {
      this.metrics.failedInvalidations++;
      this.logger.error(`Invalidation failed for event ${eventType}:`, error);
      
      // Retry if configured
      if (this.config.maxRetries > 0) {
        await this.retryInvalidation(eventType, eventData, 1);
      }
    }
  }

  /**
   * Determine if event should be batch processed
   */
  shouldBatchProcess(eventType) {
    const batchableEvents = [
      'vote:cast',
      'user:activity',
      'content:viewed',
      'transaction:pending'
    ];
    
    return batchableEvents.includes(eventType);
  }

  /**
   * Queue invalidation for batch processing
   */
  async queueForBatchProcessing(eventType, eventData, rules) {
    const batchKey = this.generateBatchKey(eventType, eventData);
    
    if (!this.invalidationQueue.has(batchKey)) {
      this.invalidationQueue.set(batchKey, {
        eventType,
        eventData: [eventData],
        rules,
        queuedAt: Date.now()
      });
    } else {
      const existing = this.invalidationQueue.get(batchKey);
      existing.eventData.push(eventData);
      
      // Process immediately if batch is full
      if (existing.eventData.length >= this.config.maxBatchSize) {
        await this.processBatchItem(batchKey, existing);
        this.invalidationQueue.delete(batchKey);
      }
    }
  }

  /**
   * Generate batch key for similar events
   */
  generateBatchKey(eventType, eventData) {
    // Group by event type and target entity
    const entityId = eventData.userId || eventData.contentId || eventData.clanId || 'global';
    return `${eventType}:${entityId}`;
  }

  /**
   * Process immediate invalidation
   */
  async processImmediateInvalidation(eventType, eventData, rules) {
    const invalidationPromises = rules.map(async (rule) => {
      await this.executeInvalidationRule(rule, eventData);
    });
    
    await Promise.allSettled(invalidationPromises);
    this.metrics.totalInvalidations++;
    
    // Process cascade invalidations
    if (this.config.enableCascadeInvalidation) {
      await this.processCascadeInvalidations(eventType, eventData);
    }
  }

  /**
   * Process batch invalidations
   */
  async processBatchInvalidations() {
    if (this.invalidationQueue.size === 0) return;
    
    const batchItems = Array.from(this.invalidationQueue.entries());
    this.invalidationQueue.clear();
    
    const batchPromises = batchItems.map(async ([batchKey, batchData]) => {
      await this.processBatchItem(batchKey, batchData);
    });
    
    await Promise.allSettled(batchPromises);
    
    if (batchItems.length > 0) {
      this.metrics.batchInvalidations++;
      this.logger.debug(`Processed ${batchItems.length} batch invalidations`);
    }
  }

  /**
   * Process individual batch item
   */
  async processBatchItem(batchKey, batchData) {
    const { eventType, eventData, rules } = batchData;
    
    // Aggregate event data for batch processing
    const aggregatedData = this.aggregateEventData(eventType, eventData);
    
    // Execute invalidation rules with aggregated data
    const invalidationPromises = rules.map(async (rule) => {
      await this.executeInvalidationRule(rule, aggregatedData);
    });
    
    await Promise.allSettled(invalidationPromises);
    
    // Process cascades for aggregated data
    if (this.config.enableCascadeInvalidation) {
      await this.processCascadeInvalidations(eventType, aggregatedData);
    }
  }

  /**
   * Aggregate event data for batch processing
   */
  aggregateEventData(eventType, eventDataArray) {
    if (eventDataArray.length === 1) {
      return eventDataArray[0];
    }
    
    // Aggregate based on event type
    switch (eventType) {
      case 'vote:cast':
        return this.aggregateVoteData(eventDataArray);
      case 'user:activity':
        return this.aggregateUserActivityData(eventDataArray);
      default:
        return eventDataArray[0]; // Use first event for non-aggregatable events
    }
  }

  /**
   * Aggregate vote data for batch processing
   */
  aggregateVoteData(voteEvents) {
    const aggregated = {
      userId: voteEvents[0].userId,
      votes: voteEvents.length,
      totalMLGBurned: voteEvents.reduce((sum, vote) => sum + (vote.mlgBurned || 0), 0),
      contentIds: [...new Set(voteEvents.map(vote => vote.contentId).filter(Boolean))],
      proposalIds: [...new Set(voteEvents.map(vote => vote.proposalId).filter(Boolean))]
    };
    
    return aggregated;
  }

  /**
   * Aggregate user activity data
   */
  aggregateUserActivityData(activityEvents) {
    return {
      userId: activityEvents[0].userId,
      activities: activityEvents.length,
      activityTypes: [...new Set(activityEvents.map(activity => activity.type))]
    };
  }

  /**
   * Execute single invalidation rule
   */
  async executeInvalidationRule(rule, eventData) {
    const { cache, method, params = [] } = rule;
    
    // Get cache instance
    const cacheInstance = this.getCacheInstance(cache);
    if (!cacheInstance || !cacheInstance[method]) {
      this.logger.warn(`Cache method ${cache}.${method} not found`);
      return;
    }
    
    // Resolve parameters from event data
    const resolvedParams = params.map(param => this.resolveParameter(param, eventData));
    
    // Execute invalidation method
    await cacheInstance[method](...resolvedParams);
  }

  /**
   * Get cache instance by name
   */
  getCacheInstance(cacheName) {
    const cacheMap = {
      'cache': this.cache,
      'userCache': this.userCache,
      'clanCache': this.clanCache,
      'contentCache': this.contentCache,
      'votingCache': this.votingCache,
      'transactionCache': this.transactionCache
    };
    
    return cacheMap[cacheName];
  }

  /**
   * Resolve parameter from event data
   */
  resolveParameter(param, eventData) {
    if (typeof param === 'string' && param.startsWith('$')) {
      // Parameter reference (e.g., '$userId')
      const paramName = param.substring(1);
      return eventData[paramName];
    }
    
    if (param === '*') {
      // Wildcard parameter
      return undefined; // Let the method handle wildcard
    }
    
    // Direct parameter value
    return param;
  }

  /**
   * Process cascade invalidations
   */
  async processCascadeInvalidations(eventType, eventData) {
    const dependencies = this.dependencyGraph.get(eventType);
    if (!dependencies || dependencies.size === 0) {
      return;
    }
    
    const cascadePromises = Array.from(dependencies).map(async (dependency) => {
      const [cacheName, methodName] = dependency.split(':');
      const cacheInstance = this.getCacheInstance(cacheName);
      
      if (cacheInstance && cacheInstance[methodName]) {
        try {
          // Execute cascade invalidation with event data
          const params = this.resolveCascadeParameters(methodName, eventData);
          await cacheInstance[methodName](...params);
        } catch (error) {
          this.logger.warn(`Cascade invalidation failed: ${dependency}`, error);
        }
      }
    });
    
    await Promise.allSettled(cascadePromises);
    this.metrics.cascadeInvalidations++;
  }

  /**
   * Resolve parameters for cascade invalidation
   */
  resolveCascadeParameters(methodName, eventData) {
    // Parameter mapping for common methods
    const parameterMaps = {
      'invalidateUserCache': [eventData.userId],
      'invalidateClanCache': [eventData.clanId],
      'invalidateContentCache': [eventData.contentId],
      'invalidateClanMembers': [eventData.clanId],
      'invalidateClanLeaderboards': [eventData.clanId],
      'invalidateTrendingCache': [],
      'invalidateSearchCache': []
    };
    
    return parameterMaps[methodName] || [];
  }

  /**
   * Retry failed invalidation
   */
  async retryInvalidation(eventType, eventData, attempt) {
    if (attempt > this.config.maxRetries) {
      this.logger.error(`Max retries exceeded for invalidation: ${eventType}`);
      return;
    }
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
    
    try {
      await this.handleInvalidationEvent(eventType, eventData);
      this.metrics.retries++;
    } catch (error) {
      this.logger.warn(`Invalidation retry ${attempt} failed for ${eventType}:`, error);
      await this.retryInvalidation(eventType, eventData, attempt + 1);
    }
  }

  /**
   * Update invalidation metrics
   */
  updateInvalidationMetrics(startTime, status) {
    const duration = Date.now() - startTime;
    
    if (status === 'success') {
      this.metrics.totalInvalidations++;
      this.metrics.totalInvalidationTime += duration;
      this.metrics.avgInvalidationTime = 
        this.metrics.totalInvalidationTime / this.metrics.totalInvalidations;
    } else {
      this.metrics.failedInvalidations++;
    }
    
    // Alert on slow invalidations
    if (duration > this.config.maxInvalidationTime) {
      this.logger.warn(`Slow invalidation detected: ${duration}ms`);
    }
  }

  /**
   * Emit invalidation event
   */
  emitInvalidationEvent(eventType, eventData) {
    this.emit(eventType, eventData);
    
    // Also emit to specific cache instances if they listen
    const cacheInstances = [
      this.userCache,
      this.clanCache,
      this.contentCache,
      this.votingCache,
      this.transactionCache
    ];
    
    for (const cache of cacheInstances) {
      if (cache && cache.emit) {
        cache.emit(eventType, eventData);
      }
    }
  }

  /**
   * Manual invalidation methods
   */
  
  async invalidateUserData(userId, options = {}) {
    await this.emitInvalidationEvent('user:profile:updated', { 
      userId, 
      ...options 
    });
  }
  
  async invalidateClanData(clanId, options = {}) {
    await this.emitInvalidationEvent('clan:profile:updated', { 
      clanId, 
      ...options 
    });
  }
  
  async invalidateContentData(contentId, options = {}) {
    await this.emitInvalidationEvent('content:updated', { 
      contentId, 
      ...options 
    });
  }
  
  async invalidateVotingData(options = {}) {
    await this.emitInvalidationEvent('leaderboard:updated', options);
  }

  /**
   * Invalidation pattern methods
   */
  
  async invalidateByPattern(pattern, options = {}) {
    const invalidationPromises = [];
    
    if (pattern.includes('user:')) {
      invalidationPromises.push(this.userCache.invalidatePattern('', pattern));
    }
    
    if (pattern.includes('clan:')) {
      invalidationPromises.push(this.clanCache.invalidatePattern('', pattern));
    }
    
    if (pattern.includes('content:')) {
      invalidationPromises.push(this.contentCache.invalidatePattern('', pattern));
    }
    
    if (pattern.includes('voting:')) {
      invalidationPromises.push(this.votingCache.invalidatePattern('', pattern));
    }
    
    if (pattern.includes('transaction:')) {
      invalidationPromises.push(this.transactionCache.invalidatePattern('', pattern));
    }
    
    const results = await Promise.allSettled(invalidationPromises);
    const totalInvalidated = results
      .filter(result => result.status === 'fulfilled')
      .reduce((sum, result) => sum + (result.value || 0), 0);
    
    return totalInvalidated;
  }

  /**
   * Get invalidation statistics
   */
  getInvalidationStats() {
    return {
      ...this.metrics,
      rules: this.invalidationRules.size,
      dependencies: Array.from(this.dependencyGraph.values())
        .reduce((sum, deps) => sum + deps.size, 0),
      queueSize: this.invalidationQueue.size,
      eventHandlers: this.eventHandlers.size,
      filterEntries: this.eventFilter.size
    };
  }

  /**
   * Get invalidation health status
   */
  getHealthStatus() {
    const stats = this.getInvalidationStats();
    const failureRate = stats.totalInvalidations > 0 ? 
      (stats.failedInvalidations / stats.totalInvalidations) * 100 : 0;
    
    let status = 'healthy';
    if (failureRate > 5) {
      status = 'unhealthy';
    } else if (failureRate > 1 || stats.avgInvalidationTime > 1000) {
      status = 'degraded';
    }
    
    return {
      status,
      stats,
      recommendations: this.generateHealthRecommendations(stats)
    };
  }

  /**
   * Generate health recommendations
   */
  generateHealthRecommendations(stats) {
    const recommendations = [];
    
    const failureRate = stats.totalInvalidations > 0 ? 
      (stats.failedInvalidations / stats.totalInvalidations) * 100 : 0;
    
    if (failureRate > 1) {
      recommendations.push({
        category: 'reliability',
        priority: 'high',
        issue: `High invalidation failure rate: ${failureRate.toFixed(2)}%`,
        suggestion: 'Review invalidation rules and error handling'
      });
    }
    
    if (stats.avgInvalidationTime > 1000) {
      recommendations.push({
        category: 'performance',
        priority: 'medium',
        issue: `Slow average invalidation time: ${stats.avgInvalidationTime}ms`,
        suggestion: 'Consider enabling batch processing or optimizing invalidation methods'
      });
    }
    
    if (stats.queueSize > 100) {
      recommendations.push({
        category: 'performance',
        priority: 'medium',
        issue: `Large invalidation queue: ${stats.queueSize}`,
        suggestion: 'Increase batch processing frequency or optimize event handling'
      });
    }
    
    if (stats.eventFilters > stats.totalInvalidations * 0.5) {
      recommendations.push({
        category: 'efficiency',
        priority: 'low',
        issue: `High event filtering rate: ${stats.eventFilters} filtered events`,
        suggestion: 'Review event emission patterns to reduce unnecessary events'
      });
    }
    
    return recommendations;
  }

  /**
   * Reset metrics and queues
   */
  reset() {
    this.metrics = {
      totalInvalidations: 0,
      cascadeInvalidations: 0,
      batchInvalidations: 0,
      failedInvalidations: 0,
      avgInvalidationTime: 0,
      totalInvalidationTime: 0,
      eventFilters: 0,
      retries: 0
    };
    
    this.invalidationQueue.clear();
    this.eventFilter.clear();
    
    // Clear timers
    for (const timer of this.eventFilterTimer.values()) {
      clearTimeout(timer);
    }
    this.eventFilterTimer.clear();
  }

  /**
   * Shutdown invalidation system
   */
  shutdown() {
    // Clear batch timer
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    
    // Clear filter timers
    for (const timer of this.eventFilterTimer.values()) {
      clearTimeout(timer);
    }
    
    // Process remaining queue items
    if (this.invalidationQueue.size > 0) {
      this.processBatchInvalidations();
    }
    
    this.emit('shutdown');
    this.removeAllListeners();
  }
}

// Create singleton instance
let globalEventDrivenInvalidation = null;

export function createEventDrivenInvalidation(options = {}) {
  return new EventDrivenInvalidation(options);
}

export function getEventDrivenInvalidation(options = {}) {
  if (!globalEventDrivenInvalidation) {
    globalEventDrivenInvalidation = new EventDrivenInvalidation(options);
  }
  return globalEventDrivenInvalidation;
}

export default EventDrivenInvalidation;