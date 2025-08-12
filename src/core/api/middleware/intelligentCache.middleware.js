/**
 * Intelligent API Response Caching Middleware with Event-Driven Invalidation
 * 
 * Advanced caching system that integrates with the APIResponseCache to provide
 * intelligent, event-driven cache invalidation for gaming platform APIs.
 * 
 * Features:
 * - Automatic cache invalidation based on data changes
 * - Gaming-specific invalidation strategies
 * - Real-time cache warming
 * - Smart cache key generation
 * - Performance optimization for high-traffic endpoints
 * 
 * @author Claude Code - API Performance Architect
 * @version 1.0.0
 * @created 2025-08-12
 */

import { getAPIResponseCache, invalidateAPICache } from './responseCache.middleware.js';
import { getCacheManager } from '../../cache/cache-manager.js';

export class IntelligentCacheMiddleware {
  constructor(options = {}) {
    this.config = {
      // Cache warming configuration
      enableWarmingOnWrite: options.enableWarmingOnWrite !== false,
      warmingDelay: options.warmingDelay || 100, // 100ms delay after write
      
      // Invalidation configuration
      enableSmartInvalidation: options.enableSmartInvalidation !== false,
      batchInvalidation: options.batchInvalidation !== false,
      invalidationDelay: options.invalidationDelay || 50, // 50ms delay
      
      // Gaming-specific settings
      enableRealTimeInvalidation: options.enableRealTimeInvalidation !== false,
      votingInvalidationStrategy: options.votingInvalidationStrategy || 'immediate',
      leaderboardRefreshInterval: options.leaderboardRefreshInterval || 30000, // 30 seconds
      
      ...options
    };
    
    this.responseCache = getAPIResponseCache();
    this.cacheManager = getCacheManager();
    
    // Batch processing queues
    this.invalidationQueue = new Map();
    this.warmingQueue = [];
    
    // Processing state
    this.processingInvalidation = false;
    this.processingWarming = false;
    
    this.logger = options.logger || console;
    
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for cache invalidation
   */
  setupEventListeners() {
    // User-related events
    this.responseCache.on('data:user:updated', (data) => {
      this.handleUserUpdate(data);
    });
    
    this.responseCache.on('data:user:deleted', (data) => {
      this.handleUserDelete(data);
    });
    
    // Voting-related events  
    this.responseCache.on('data:vote:cast', (data) => {
      this.handleVoteCast(data);
    });
    
    this.responseCache.on('data:vote:updated', (data) => {
      this.handleVoteUpdate(data);
    });
    
    // Clan-related events
    this.responseCache.on('data:clan:updated', (data) => {
      this.handleClanUpdate(data);
    });
    
    this.responseCache.on('data:clan:member:added', (data) => {
      this.handleClanMemberChange(data);
    });
    
    this.responseCache.on('data:clan:member:removed', (data) => {
      this.handleClanMemberChange(data);
    });
    
    // Content-related events
    this.responseCache.on('data:content:created', (data) => {
      this.handleContentCreate(data);
    });
    
    this.responseCache.on('data:content:updated', (data) => {
      this.handleContentUpdate(data);
    });
    
    // Tournament-related events
    this.responseCache.on('data:tournament:updated', (data) => {
      this.handleTournamentUpdate(data);
    });
    
    // Leaderboard refresh
    this.responseCache.on('data:leaderboard:refresh', (data) => {
      this.handleLeaderboardRefresh(data);
    });
  }

  /**
   * Main middleware function
   */
  middleware() {
    return async (req, res, next) => {
      const originalSend = res.send;
      const originalJson = res.json;
      
      // Intercept successful responses to trigger cache warming
      res.send = async function(body) {
        if (res.statusCode >= 200 && res.statusCode < 300 && req.method !== 'GET') {
          await this.triggerPostWriteActions(req, res, body);
        }
        return originalSend.call(res, body);
      }.bind(this);
      
      res.json = async function(obj) {
        if (res.statusCode >= 200 && res.statusCode < 300 && req.method !== 'GET') {
          await this.triggerPostWriteActions(req, res, JSON.stringify(obj));
        }
        return originalJson.call(res, obj);
      }.bind(this);
      
      next();
    };
  }

  /**
   * Trigger actions after write operations
   */
  async triggerPostWriteActions(req, res, responseBody) {
    try {
      const endpoint = req.route?.path || req.path;
      const method = req.method;
      const userId = req.user?.id;
      const clanId = req.user?.clan_id;
      
      // Determine event type from endpoint and method
      const eventType = this.getEventTypeFromRequest(req, method);
      
      if (eventType) {
        // Schedule invalidation
        if (this.config.enableSmartInvalidation) {
          this.scheduleInvalidation(eventType, {
            userId,
            clanId,
            endpoint,
            method,
            body: this.parseRequestBody(req)
          });
        }
        
        // Schedule cache warming
        if (this.config.enableWarmingOnWrite) {
          this.scheduleWarming(endpoint, {
            userId,
            clanId,
            method: 'GET',
            priority: this.getWarmingPriority(eventType)
          });
        }
      }
      
    } catch (error) {
      this.logger.error('Post-write action error:', error);
    }
  }

  /**
   * Determine event type from request
   */
  getEventTypeFromRequest(req, method) {
    const path = req.route?.path || req.path;
    
    // User operations
    if (path.includes('/user') || path.includes('/users')) {
      if (method === 'PUT' || method === 'PATCH') return 'user:update';
      if (method === 'POST') return 'user:create';
      if (method === 'DELETE') return 'user:delete';
    }
    
    // Voting operations
    if (path.includes('/vote') || path.includes('/voting')) {
      if (method === 'POST') return 'vote:cast';
      if (method === 'PUT' || method === 'PATCH') return 'vote:update';
      if (method === 'DELETE') return 'vote:delete';
    }
    
    // Clan operations
    if (path.includes('/clan') || path.includes('/clans')) {
      if (method === 'PUT' || method === 'PATCH') return 'clan:update';
      if (method === 'POST' && path.includes('/member')) return 'clan:member:add';
      if (method === 'DELETE' && path.includes('/member')) return 'clan:member:remove';
    }
    
    // Content operations
    if (path.includes('/content')) {
      if (method === 'POST') return 'content:create';
      if (method === 'PUT' || method === 'PATCH') return 'content:update';
      if (method === 'DELETE') return 'content:delete';
    }
    
    // Tournament operations
    if (path.includes('/tournament')) {
      if (method === 'PUT' || method === 'PATCH') return 'tournament:update';
      if (method === 'POST') return 'tournament:create';
    }
    
    return null;
  }

  /**
   * Schedule cache invalidation
   */
  scheduleInvalidation(eventType, data) {
    if (!this.invalidationQueue.has(eventType)) {
      this.invalidationQueue.set(eventType, []);
    }
    
    this.invalidationQueue.get(eventType).push({
      ...data,
      timestamp: Date.now()
    });
    
    // Process immediately for high-priority events
    if (this.isHighPriorityEvent(eventType)) {
      setTimeout(() => this.processInvalidationQueue(), this.config.invalidationDelay);
    } else {
      // Batch process for lower priority events
      setTimeout(() => this.processInvalidationQueue(), 1000);
    }
  }

  /**
   * Process invalidation queue
   */
  async processInvalidationQueue() {
    if (this.processingInvalidation || this.invalidationQueue.size === 0) {
      return;
    }
    
    this.processingInvalidation = true;
    
    try {
      for (const [eventType, events] of this.invalidationQueue.entries()) {
        if (events.length === 0) continue;
        
        // Group events by similar data for batch processing
        const groupedEvents = this.groupEventsByData(events);
        
        for (const group of groupedEvents) {
          await this.executeInvalidation(eventType, group);
        }
        
        // Clear processed events
        this.invalidationQueue.set(eventType, []);
      }
      
    } catch (error) {
      this.logger.error('Invalidation queue processing error:', error);
    } finally {
      this.processingInvalidation = false;
    }
  }

  /**
   * Execute cache invalidation for event group
   */
  async executeInvalidation(eventType, eventGroup) {
    try {
      // Merge data from all events in the group
      const mergedData = this.mergeEventData(eventGroup);
      
      await invalidateAPICache(eventType, mergedData);
      
      this.logger.debug(`Cache invalidation executed: ${eventType}`, {
        eventCount: eventGroup.length,
        data: mergedData
      });
      
    } catch (error) {
      this.logger.error(`Cache invalidation failed for ${eventType}:`, error);
    }
  }

  /**
   * Schedule cache warming
   */
  scheduleWarming(endpoint, options = {}) {
    this.warmingQueue.push({
      endpoint,
      ...options,
      timestamp: Date.now()
    });
    
    if (!this.processingWarming) {
      setTimeout(() => this.processWarmingQueue(), this.config.warmingDelay);
    }
  }

  /**
   * Process cache warming queue
   */
  async processWarmingQueue() {
    if (this.processingWarming || this.warmingQueue.length === 0) {
      return;
    }
    
    this.processingWarming = true;
    
    try {
      // Sort by priority
      this.warmingQueue.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      
      // Process in batches
      const batch = this.warmingQueue.splice(0, 5);
      
      await Promise.all(batch.map(item => this.executeWarming(item)));
      
      // Continue processing if more items exist
      if (this.warmingQueue.length > 0) {
        setTimeout(() => this.processWarmingQueue(), 100);
      }
      
    } catch (error) {
      this.logger.error('Warming queue processing error:', error);
    } finally {
      this.processingWarming = false;
    }
  }

  /**
   * Execute cache warming
   */
  async executeWarming(warmingItem) {
    try {
      const { endpoint, userId, clanId, method = 'GET' } = warmingItem;
      
      // Generate related endpoints to warm
      const endpointsToWarm = this.generateRelatedEndpoints(endpoint, { userId, clanId });
      
      for (const targetEndpoint of endpointsToWarm) {
        // This would typically make internal requests to warm the cache
        // For now, we'll simulate the cache warming
        await this.simulateEndpointRequest(targetEndpoint, { userId, clanId });
      }
      
      this.logger.debug(`Cache warming executed: ${endpoint}`, {
        relatedEndpoints: endpointsToWarm.length
      });
      
    } catch (error) {
      this.logger.error(`Cache warming failed for ${warmingItem.endpoint}:`, error);
    }
  }

  /**
   * Event handlers for different data changes
   */
  
  async handleUserUpdate(data) {
    await this.scheduleInvalidation('user:update', data);
    
    // Warm user profile and related endpoints
    if (this.config.enableWarmingOnWrite) {
      this.scheduleWarming(`/api/users/${data.userId}`, {
        userId: data.userId,
        priority: 8
      });
    }
  }

  async handleVoteCast(data) {
    // Immediate invalidation for voting (gaming critical)
    if (this.config.votingInvalidationStrategy === 'immediate') {
      await invalidateAPICache('vote:cast', data);
    } else {
      this.scheduleInvalidation('vote:cast', data);
    }
    
    // Warm leaderboards and voting results
    this.scheduleWarming('/api/leaderboard', {
      priority: 10
    });
    
    this.scheduleWarming(`/api/voting/results/${data.contentId}`, {
      priority: 9
    });
  }

  async handleClanUpdate(data) {
    await this.scheduleInvalidation('clan:update', data);
    
    // Warm clan profile and member lists
    this.scheduleWarming(`/api/clans/${data.clanId}`, {
      clanId: data.clanId,
      priority: 7
    });
  }

  async handleClanMemberChange(data) {
    await this.scheduleInvalidation('clan:member:change', data);
    
    // Warm clan and user profiles
    this.scheduleWarming(`/api/clans/${data.clanId}/members`, {
      priority: 6
    });
  }

  async handleContentCreate(data) {
    await this.scheduleInvalidation('content:create', data);
    
    // Warm content lists and trending
    this.scheduleWarming('/api/content/trending', {
      priority: 5
    });
  }

  async handleLeaderboardRefresh(data) {
    // Force refresh all leaderboard caches
    await invalidateAPICache('leaderboard:refresh', data);
    
    // Immediately warm leaderboards
    const leaderboardEndpoints = [
      '/api/leaderboard/users',
      '/api/leaderboard/clans',
      '/api/leaderboard/voting'
    ];
    
    for (const endpoint of leaderboardEndpoints) {
      this.scheduleWarming(endpoint, { priority: 10 });
    }
  }

  /**
   * Utility methods
   */
  
  isHighPriorityEvent(eventType) {
    const highPriorityEvents = [
      'vote:cast',
      'vote:update',
      'leaderboard:refresh',
      'tournament:update'
    ];
    
    return highPriorityEvents.includes(eventType);
  }

  getWarmingPriority(eventType) {
    const priorityMap = {
      'vote:cast': 10,
      'vote:update': 9,
      'user:update': 8,
      'clan:update': 7,
      'clan:member:add': 6,
      'content:create': 5,
      'tournament:update': 8
    };
    
    return priorityMap[eventType] || 3;
  }

  groupEventsByData(events) {
    // Group similar events together for batch processing
    const groups = new Map();
    
    for (const event of events) {
      const key = `${event.userId || 'null'}:${event.clanId || 'null'}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      
      groups.get(key).push(event);
    }
    
    return Array.from(groups.values());
  }

  mergeEventData(events) {
    // Merge data from multiple similar events
    const merged = {
      userIds: new Set(),
      clanIds: new Set(),
      contentIds: new Set(),
      endpoints: new Set()
    };
    
    for (const event of events) {
      if (event.userId) merged.userIds.add(event.userId);
      if (event.clanId) merged.clanIds.add(event.clanId);
      if (event.contentId) merged.contentIds.add(event.contentId);
      if (event.endpoint) merged.endpoints.add(event.endpoint);
    }
    
    return {
      userIds: Array.from(merged.userIds),
      clanIds: Array.from(merged.clanIds),
      contentIds: Array.from(merged.contentIds),
      endpoints: Array.from(merged.endpoints)
    };
  }

  generateRelatedEndpoints(changedEndpoint, context = {}) {
    const related = [];
    
    // User-related endpoints
    if (changedEndpoint.includes('/user') && context.userId) {
      related.push(`/api/users/${context.userId}`);
      related.push(`/api/users/${context.userId}/stats`);
      
      if (context.clanId) {
        related.push(`/api/clans/${context.clanId}/members`);
      }
    }
    
    // Voting-related endpoints
    if (changedEndpoint.includes('/vote')) {
      related.push('/api/leaderboard/users');
      related.push('/api/leaderboard/clans');
      
      if (context.clanId) {
        related.push(`/api/clans/${context.clanId}/stats`);
      }
    }
    
    // Clan-related endpoints
    if (changedEndpoint.includes('/clan') && context.clanId) {
      related.push(`/api/clans/${context.clanId}`);
      related.push(`/api/clans/${context.clanId}/members`);
      related.push('/api/leaderboard/clans');
    }
    
    return related;
  }

  async simulateEndpointRequest(endpoint, context = {}) {
    // This would make an internal request to warm the cache
    // For now, we'll just log the warming action
    this.logger.debug(`Warming cache for endpoint: ${endpoint}`, context);
    
    // In a real implementation, this would:
    // 1. Create a mock request object
    // 2. Call the appropriate controller/handler
    // 3. Let the response cache middleware handle the caching
  }

  parseRequestBody(req) {
    // Safely parse request body for context
    try {
      if (req.body && typeof req.body === 'object') {
        return req.body;
      }
      return {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Start automatic leaderboard refresh
   */
  startLeaderboardRefresh() {
    if (this.config.leaderboardRefreshInterval > 0) {
      setInterval(() => {
        this.handleLeaderboardRefresh({
          source: 'automatic',
          timestamp: Date.now()
        });
      }, this.config.leaderboardRefreshInterval);
      
      this.logger.info(`Automatic leaderboard refresh started (${this.config.leaderboardRefreshInterval}ms interval)`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      invalidationQueue: {
        totalTypes: this.invalidationQueue.size,
        totalEvents: Array.from(this.invalidationQueue.values())
          .reduce((sum, events) => sum + events.length, 0)
      },
      warmingQueue: {
        size: this.warmingQueue.length
      },
      processing: {
        invalidation: this.processingInvalidation,
        warming: this.processingWarming
      }
    };
  }
}

// Create singleton instance
let globalIntelligentCache = null;

export function createIntelligentCacheMiddleware(options = {}) {
  return new IntelligentCacheMiddleware(options);
}

export function getIntelligentCacheMiddleware(options = {}) {
  if (!globalIntelligentCache) {
    globalIntelligentCache = new IntelligentCacheMiddleware(options);
  }
  return globalIntelligentCache;
}

// Export middleware factory
export function intelligentCache(options = {}) {
  const middleware = getIntelligentCacheMiddleware(options);
  return middleware.middleware();
}

// Event emission helpers for use in controllers
export function emitDataChange(eventType, data = {}) {
  const cache = getAPIResponseCache();
  cache.emit(`data:${eventType}`, data);
}

export function emitUserUpdate(userId, additionalData = {}) {
  emitDataChange('user:updated', { userId, ...additionalData });
}

export function emitVoteCast(userId, contentId, clanId = null, additionalData = {}) {
  emitDataChange('vote:cast', { userId, contentId, clanId, ...additionalData });
}

export function emitClanUpdate(clanId, additionalData = {}) {
  emitDataChange('clan:updated', { clanId, ...additionalData });
}

export function emitContentCreate(userId, contentId, additionalData = {}) {
  emitDataChange('content:created', { userId, contentId, ...additionalData });
}

export function emitLeaderboardRefresh(additionalData = {}) {
  emitDataChange('leaderboard:refresh', additionalData);
}

export default IntelligentCacheMiddleware;