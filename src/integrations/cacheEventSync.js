/**
 * Cache Event Synchronization Integration
 * 
 * Synchronizes cache invalidation events with WebSocket real-time updates
 * to ensure data consistency across the MLG.clan platform. Automatically
 * triggers WebSocket events when cache data changes occur.
 * 
 * Features:
 * - Cache invalidation event detection
 * - Real-time cache sync notifications
 * - Cache warming coordination
 * - Performance optimization through smart caching
 * - Event-driven cache management
 * - Redis pub/sub integration for distributed caching
 * 
 * @author Claude Code - Cache Integration Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { EventEmitter } from 'events';

/**
 * Cache Event Sync Configuration
 */
const CACHE_EVENT_CONFIG = {
  // Synchronization settings
  enableRealtimeSync: true,
  enableCacheWarming: true,
  enableInvalidationBroadcast: true,
  
  // Performance settings
  batchInvalidations: true,
  batchTimeout: 500, // 500ms
  maxBatchSize: 50,
  
  // Cache event mappings
  cacheEventMappings: {
    // User cache events
    'user:profile': 'user:profile_updated',
    'user:preferences': 'user:preference_updated',
    'user:achievements': 'user:achievement_unlocked',
    'user:balance': 'user:balance_updated',
    'user:reputation': 'user:reputation_changed',
    
    // Clan cache events
    'clan:info': 'clan:updated',
    'clan:members': 'clan:member_joined',
    'clan:leaderboard': 'clan:leaderboard_updated',
    'clan:achievements': 'clan:achievement_unlocked',
    'clan:proposals': 'clan:proposal_created',
    
    // Content cache events
    'content:info': 'content:updated',
    'content:trending': 'content:trending_updated',
    'content:engagement': 'content:engagement',
    'content:moderation': 'content:approved',
    
    // Voting cache events
    'voting:counts': 'vote:count_updated',
    'voting:limits': 'vote:daily_limit_warning',
    'voting:leaderboard': 'vote:leaderboard_updated'
  },
  
  // Cache warming strategies
  warmingStrategies: {
    'user:profile': { ttl: 3600, priority: 'high' },
    'clan:leaderboard': { ttl: 1800, priority: 'high' },
    'content:trending': { ttl: 300, priority: 'medium' },
    'voting:counts': { ttl: 60, priority: 'high' }
  }
};

/**
 * Cache Event Synchronization Class
 */
export class CacheEventSync extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = { ...CACHE_EVENT_CONFIG, ...options };
    this.cacheManager = options.cacheManager;
    this.realTimeServer = options.realTimeServer;
    this.redisClient = options.redisClient;
    this.logger = options.logger || console;
    
    // Sync state
    this.invalidationQueue = [];
    this.warmingQueue = [];
    this.batchTimer = null;
    
    // Statistics
    this.stats = {
      invalidationsProcessed: 0,
      warmingsCompleted: 0,
      eventsEmitted: 0,
      batchesProcessed: 0,
      syncErrors: 0
    };
    
    // Initialize cache event hooks
    this.initializeCacheHooks();
    
    this.logger.info('Cache Event Sync initialized');
  }

  /**
   * Initialize cache event hooks
   */
  initializeCacheHooks() {
    if (!this.cacheManager) {
      this.logger.warn('Cache manager not provided, some features will be disabled');
      return;
    }
    
    // Hook into cache manager events
    this.hookCacheManagerEvents();
    
    // Setup Redis pub/sub for distributed cache events
    if (this.redisClient) {
      this.setupRedisPubSub();
    }
  }

  /**
   * Hook into cache manager events
   */
  hookCacheManagerEvents() {
    // Listen for cache invalidation events
    this.cacheManager.on('cache:invalidated', (data) => {
      this.handleCacheInvalidation(data);
    });
    
    // Listen for cache set events
    this.cacheManager.on('cache:set', (data) => {
      this.handleCacheSet(data);
    });
    
    // Listen for cache miss events
    this.cacheManager.on('cache:miss', (data) => {
      this.handleCacheMiss(data);
    });
    
    // Listen for cache hit events
    this.cacheManager.on('cache:hit', (data) => {
      this.handleCacheHit(data);
    });
    
    // Listen for cache warming events
    this.cacheManager.on('cache:warmed', (data) => {
      this.handleCacheWarmed(data);
    });
    
    this.logger.info('Cache manager event hooks established');
  }

  /**
   * Setup Redis pub/sub for distributed cache events
   */
  setupRedisPubSub() {
    try {
      // Subscribe to cache invalidation channel
      this.redisClient.subscribe('cache:invalidation', (message) => {
        this.handleDistributedInvalidation(JSON.parse(message));
      });
      
      // Subscribe to cache warming channel
      this.redisClient.subscribe('cache:warming', (message) => {
        this.handleDistributedWarming(JSON.parse(message));
      });
      
      this.logger.info('Redis pub/sub for cache events established');
      
    } catch (error) {
      this.logger.error('Failed to setup Redis pub/sub:', error);
    }
  }

  /**
   * Handle cache invalidation
   */
  async handleCacheInvalidation(invalidationData) {
    try {
      this.stats.invalidationsProcessed++;
      
      const { key, reason, timestamp = Date.now() } = invalidationData;
      
      // Extract cache type and ID from key
      const cacheInfo = this.parseCacheKey(key);
      
      if (!cacheInfo) {
        return; // Unrecognized cache key format
      }
      
      // Map to WebSocket event
      const eventType = this.mapCacheEventToWebSocket(cacheInfo.type, 'invalidation');
      
      if (eventType) {
        // Prepare event data
        const eventData = {
          ...cacheInfo,
          reason,
          timestamp: new Date(timestamp).toISOString(),
          source: 'cache_invalidation'
        };
        
        // Add to batch or process immediately
        if (this.config.batchInvalidations) {
          this.addToBatch('invalidation', { eventType, eventData });
        } else {
          await this.emitCacheEvent(eventType, eventData);
        }
      }
      
      // Trigger cache warming if enabled
      if (this.config.enableCacheWarming) {
        await this.triggerCacheWarming(cacheInfo);
      }
      
      // Publish to Redis for distributed invalidation
      if (this.redisClient && this.config.enableInvalidationBroadcast) {
        await this.publishDistributedInvalidation(invalidationData);
      }
      
    } catch (error) {
      this.stats.syncErrors++;
      this.logger.error('Error handling cache invalidation:', error);
    }
  }

  /**
   * Handle cache set events
   */
  async handleCacheSet(setData) {
    try {
      const { key, value, ttl, timestamp = Date.now() } = setData;
      
      const cacheInfo = this.parseCacheKey(key);
      
      if (!cacheInfo) {
        return;
      }
      
      // Map to WebSocket event for cache updates
      const eventType = this.mapCacheEventToWebSocket(cacheInfo.type, 'updated');
      
      if (eventType) {
        const eventData = {
          ...cacheInfo,
          cached: true,
          ttl,
          timestamp: new Date(timestamp).toISOString(),
          source: 'cache_set'
        };
        
        await this.emitCacheEvent(eventType, eventData);
      }
      
    } catch (error) {
      this.logger.error('Error handling cache set:', error);
    }
  }

  /**
   * Handle cache miss events
   */
  async handleCacheMiss(missData) {
    try {
      const { key, timestamp = Date.now() } = missData;
      
      const cacheInfo = this.parseCacheKey(key);
      
      if (!cacheInfo) {
        return;
      }
      
      // Trigger cache warming for high-priority misses
      const warmingStrategy = this.config.warmingStrategies[cacheInfo.type];
      
      if (warmingStrategy && warmingStrategy.priority === 'high') {
        await this.triggerCacheWarming(cacheInfo);
      }
      
    } catch (error) {
      this.logger.error('Error handling cache miss:', error);
    }
  }

  /**
   * Handle cache hit events
   */
  async handleCacheHit(hitData) {
    // Currently just logging for analytics
    // Could be extended for cache usage tracking
    this.logger.debug('Cache hit:', hitData.key);
  }

  /**
   * Handle cache warmed events
   */
  async handleCacheWarmed(warmedData) {
    try {
      this.stats.warmingsCompleted++;
      
      const { key, timestamp = Date.now() } = warmedData;
      
      const cacheInfo = this.parseCacheKey(key);
      
      if (!cacheInfo) {
        return;
      }
      
      // Emit cache warming completion event
      const eventType = `${cacheInfo.type}:cache_warmed`;
      const eventData = {
        ...cacheInfo,
        warmed: true,
        timestamp: new Date(timestamp).toISOString(),
        source: 'cache_warming'
      };
      
      // Notify relevant users about cache warming completion
      await this.notifyCacheWarming(cacheInfo, eventData);
      
    } catch (error) {
      this.logger.error('Error handling cache warmed:', error);
    }
  }

  /**
   * Parse cache key to extract type and identifier
   */
  parseCacheKey(key) {
    if (!key || typeof key !== 'string') {
      return null;
    }
    
    // Expected format: "type:id" or "type:id:subtype"
    const parts = key.split(':');
    
    if (parts.length < 2) {
      return null;
    }
    
    const [type, id, subtype] = parts;
    
    return {
      type: subtype ? `${type}:${subtype}` : type,
      id,
      fullKey: key
    };
  }

  /**
   * Map cache event to WebSocket event type
   */
  mapCacheEventToWebSocket(cacheType, action) {
    // Direct mapping first
    const directMapping = this.config.cacheEventMappings[cacheType];
    
    if (directMapping) {
      return directMapping;
    }
    
    // Pattern-based mapping
    for (const [pattern, eventType] of Object.entries(this.config.cacheEventMappings)) {
      if (cacheType.includes(pattern.split(':')[0])) {
        return eventType;
      }
    }
    
    // Generate default event type
    return `${cacheType.replace(':', '_')}:${action}`;
  }

  /**
   * Add event to batch processing
   */
  addToBatch(type, eventInfo) {
    if (type === 'invalidation') {
      this.invalidationQueue.push(eventInfo);
    } else if (type === 'warming') {
      this.warmingQueue.push(eventInfo);
    }
    
    // Process batch if full or start timer
    if (this.invalidationQueue.length >= this.config.maxBatchSize) {
      this.processBatch();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, this.config.batchTimeout);
    }
  }

  /**
   * Process batched events
   */
  async processBatch() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    try {
      const invalidations = this.invalidationQueue.splice(0);
      const warmings = this.warmingQueue.splice(0);
      
      // Process invalidations
      if (invalidations.length > 0) {
        await Promise.allSettled(
          invalidations.map(({ eventType, eventData }) =>
            this.emitCacheEvent(eventType, eventData)
          )
        );
      }
      
      // Process warmings
      if (warmings.length > 0) {
        await Promise.allSettled(
          warmings.map(({ eventType, eventData }) =>
            this.emitCacheEvent(eventType, eventData)
          )
        );
      }
      
      this.stats.batchesProcessed++;
      
      this.logger.debug(`Processed batch: ${invalidations.length} invalidations, ${warmings.length} warmings`);
      
    } catch (error) {
      this.logger.error('Error processing cache event batch:', error);
    }
  }

  /**
   * Emit cache-related WebSocket event
   */
  async emitCacheEvent(eventType, eventData) {
    try {
      if (!this.realTimeServer) {
        this.logger.warn('Real-time server not configured');
        return;
      }
      
      // Route to appropriate event handler based on event type
      await this.routeCacheEventToHandler(eventType, eventData);
      
      this.stats.eventsEmitted++;
      
    } catch (error) {
      this.stats.syncErrors++;
      this.logger.error(`Failed to emit cache event ${eventType}:`, error);
    }
  }

  /**
   * Route cache event to appropriate WebSocket handler
   */
  async routeCacheEventToHandler(eventType, eventData) {
    const [category] = eventType.split(':');
    
    switch (category) {
      case 'user':
        await this.handleUserCacheEvent(eventType, eventData);
        break;
      
      case 'clan':
        await this.handleClanCacheEvent(eventType, eventData);
        break;
      
      case 'content':
        await this.handleContentCacheEvent(eventType, eventData);
        break;
      
      case 'vote':
      case 'voting':
        await this.handleVotingCacheEvent(eventType, eventData);
        break;
      
      default:
        this.logger.debug(`No specific handler for cache event type: ${eventType}`);
        break;
    }
  }

  /**
   * Handle user cache events
   */
  async handleUserCacheEvent(eventType, eventData) {
    if (!this.realTimeServer.userEvents) return;
    
    const userEvents = this.realTimeServer.userEvents;
    
    // Broadcast cache sync notification to user
    if (eventData.id) {
      userEvents.sendNotification(eventData.id, {
        type: 'cache_sync',
        title: 'Data Updated',
        message: 'Your profile data has been refreshed',
        priority: 'low',
        category: 'system',
        data: {
          cacheType: eventData.type,
          eventType,
          timestamp: eventData.timestamp
        }
      });
    }
  }

  /**
   * Handle clan cache events
   */
  async handleClanCacheEvent(eventType, eventData) {
    if (!this.realTimeServer.clanEvents) return;
    
    // Broadcast to clan members about data refresh
    if (eventData.id) {
      this.realTimeServer.io.to(`clan:${eventData.id}`).emit('clan:cache_refreshed', {
        cacheType: eventData.type,
        timestamp: eventData.timestamp,
        message: 'Clan data has been updated'
      });
    }
  }

  /**
   * Handle content cache events
   */
  async handleContentCacheEvent(eventType, eventData) {
    if (!this.realTimeServer.contentEvents) return;
    
    // Broadcast to content watchers
    if (eventData.id) {
      this.realTimeServer.io.to(`content:${eventData.id}`).emit('content:cache_refreshed', {
        contentId: eventData.id,
        cacheType: eventData.type,
        timestamp: eventData.timestamp
      });
    }
  }

  /**
   * Handle voting cache events
   */
  async handleVotingCacheEvent(eventType, eventData) {
    if (!this.realTimeServer.votingEvents) return;
    
    // Broadcast voting data refresh
    this.realTimeServer.io.to('voting:general').emit('voting:cache_refreshed', {
      cacheType: eventData.type,
      timestamp: eventData.timestamp,
      data: eventData
    });
  }

  /**
   * Trigger cache warming
   */
  async triggerCacheWarming(cacheInfo) {
    try {
      const warmingStrategy = this.config.warmingStrategies[cacheInfo.type];
      
      if (!warmingStrategy) {
        return; // No warming strategy defined
      }
      
      // Request cache warming from cache manager
      if (this.cacheManager && this.cacheManager.warm) {
        await this.cacheManager.warm(cacheInfo.fullKey, {
          ttl: warmingStrategy.ttl,
          priority: warmingStrategy.priority
        });
        
        this.logger.debug(`Cache warming triggered for: ${cacheInfo.fullKey}`);
      }
      
    } catch (error) {
      this.logger.error(`Failed to trigger cache warming for ${cacheInfo.fullKey}:`, error);
    }
  }

  /**
   * Notify about cache warming completion
   */
  async notifyCacheWarming(cacheInfo, eventData) {
    try {
      // Notify specific users about their data being refreshed
      if (cacheInfo.type.includes('user') && cacheInfo.id) {
        this.realTimeServer.io.to(`user:${cacheInfo.id}`).emit('user:cache_warmed', {
          type: cacheInfo.type,
          timestamp: eventData.timestamp,
          message: 'Your data has been pre-loaded for better performance'
        });
      }
      
      // Notify clan members
      if (cacheInfo.type.includes('clan') && cacheInfo.id) {
        this.realTimeServer.io.to(`clan:${cacheInfo.id}`).emit('clan:cache_warmed', {
          type: cacheInfo.type,
          timestamp: eventData.timestamp
        });
      }
      
    } catch (error) {
      this.logger.error('Failed to notify cache warming completion:', error);
    }
  }

  /**
   * Publish distributed invalidation event
   */
  async publishDistributedInvalidation(invalidationData) {
    try {
      await this.redisClient.publish('cache:invalidation', JSON.stringify({
        ...invalidationData,
        serverId: process.env.SERVER_ID || 'default',
        timestamp: Date.now()
      }));
      
    } catch (error) {
      this.logger.error('Failed to publish distributed invalidation:', error);
    }
  }

  /**
   * Handle distributed invalidation from other servers
   */
  async handleDistributedInvalidation(data) {
    try {
      // Skip if from same server
      if (data.serverId === (process.env.SERVER_ID || 'default')) {
        return;
      }
      
      // Process distributed invalidation
      await this.handleCacheInvalidation({
        key: data.key,
        reason: `distributed_${data.reason}`,
        timestamp: data.timestamp
      });
      
    } catch (error) {
      this.logger.error('Failed to handle distributed invalidation:', error);
    }
  }

  /**
   * Handle distributed warming from other servers
   */
  async handleDistributedWarming(data) {
    try {
      // Skip if from same server
      if (data.serverId === (process.env.SERVER_ID || 'default')) {
        return;
      }
      
      // Process distributed warming
      const cacheInfo = this.parseCacheKey(data.key);
      
      if (cacheInfo) {
        await this.triggerCacheWarming(cacheInfo);
      }
      
    } catch (error) {
      this.logger.error('Failed to handle distributed warming:', error);
    }
  }

  /**
   * Get cache sync statistics
   */
  getStats() {
    return {
      ...this.stats,
      queueSizes: {
        invalidations: this.invalidationQueue.length,
        warmings: this.warmingQueue.length
      },
      batchTimerActive: !!this.batchTimer
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      invalidationsProcessed: 0,
      warmingsCompleted: 0,
      eventsEmitted: 0,
      batchesProcessed: 0,
      syncErrors: 0
    };
    
    this.logger.info('Cache Event Sync statistics reset');
  }

  /**
   * Shutdown cache event sync
   */
  async shutdown() {
    // Process remaining batches
    if (this.invalidationQueue.length > 0 || this.warmingQueue.length > 0) {
      await this.processBatch();
    }
    
    // Clear batch timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    
    // Unsubscribe from Redis channels
    if (this.redisClient) {
      await this.redisClient.unsubscribe('cache:invalidation');
      await this.redisClient.unsubscribe('cache:warming');
    }
    
    this.logger.info('Cache Event Sync shutdown completed');
  }
}

export default CacheEventSync;