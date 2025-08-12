/**
 * Event Aggregator for WebSocket Server
 * 
 * Provides intelligent event batching and aggregation to optimize bandwidth usage
 * and improve performance for high-frequency events in the MLG.clan platform.
 * Reduces redundant events and implements smart batching strategies.
 * 
 * Features:
 * - Event batching with configurable windows
 * - Smart aggregation based on event types
 * - Duplicate event elimination
 * - Priority-based event queuing
 * - Bandwidth optimization
 * - Real-time analytics event processing
 * 
 * @author Claude Code - Event Optimization Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { EventEmitter } from 'events';

/**
 * Event Aggregator Configuration
 */
const AGGREGATOR_CONFIG = {
  // Batching settings
  aggregationWindow: 1000, // 1 second default window
  maxEventsPerBatch: 50,
  maxBatchSize: 1024 * 1024, // 1MB max batch size
  
  // Event-specific configurations
  eventConfigs: {
    'vote:count_updated': {
      aggregationType: 'latest', // Only keep latest value
      priority: 5,
      batchable: true,
      deduplicateBy: ['contentId'] // Remove duplicates by contentId
    },
    'clan:leaderboard_updated': {
      aggregationType: 'merge', // Merge leaderboard updates
      priority: 6,
      batchable: true,
      deduplicateBy: ['clanId']
    },
    'user:balance_updated': {
      aggregationType: 'latest',
      priority: 8,
      batchable: true,
      deduplicateBy: ['userId']
    },
    'content:trending_updated': {
      aggregationType: 'merge',
      priority: 4,
      batchable: true,
      deduplicateBy: ['category']
    },
    'clan:member_activity': {
      aggregationType: 'count', // Count similar activities
      priority: 3,
      batchable: true,
      deduplicateBy: ['clanId', 'activityType']
    },
    'system:alert': {
      aggregationType: 'none', // Send immediately
      priority: 10,
      batchable: false
    },
    'voting:mlg_burned': {
      aggregationType: 'sum', // Sum token amounts
      priority: 7,
      batchable: true,
      deduplicateBy: ['userId']
    }
  },
  
  // Performance settings
  maxQueueSize: 10000,
  processingInterval: 100, // Process every 100ms
  cleanupInterval: 60000, // Cleanup every minute
  
  // Analytics
  enableAnalytics: true,
  analyticsWindow: 300000 // 5 minutes analytics window
};

/**
 * Event Aggregator Class
 */
export class EventAggregator extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = { ...AGGREGATOR_CONFIG, ...options };
    this.logger = options.logger || console;
    
    // Event queues
    this.eventQueues = new Map(); // roomId -> event queue
    this.priorityQueues = new Map(); // priority -> event array
    this.pendingBatches = new Map(); // roomId -> batch info
    
    // Analytics
    this.analytics = {
      totalEvents: 0,
      aggregatedEvents: 0,
      batchesSent: 0,
      duplicatesRemoved: 0,
      bandwidthSaved: 0,
      processingTime: 0,
      eventsByType: new Map(),
      lastReset: Date.now()
    };
    
    // Processing state
    this.isProcessing = false;
    this.processingTimer = null;
    this.cleanupTimer = null;
    
    this.startProcessing();
    this.startCleanupTimer();
    
    this.logger.info('Event Aggregator initialized');
  }

  /**
   * Add event for aggregation
   */
  addEvent(roomId, eventType, eventData, options = {}) {
    try {
      const event = {
        id: this.generateEventId(),
        type: eventType,
        data: eventData,
        roomId,
        timestamp: Date.now(),
        priority: this.getEventPriority(eventType),
        config: this.getEventConfig(eventType),
        options
      };
      
      // Update analytics
      this.analytics.totalEvents++;
      this.updateEventTypeAnalytics(eventType);
      
      // Handle non-batchable events immediately
      if (!event.config.batchable) {
        this.emit('immediate_event', event);
        return event.id;
      }
      
      // Add to appropriate queue
      this.addToQueue(event);
      
      return event.id;
      
    } catch (error) {
      this.logger.error('Failed to add event for aggregation:', error);
      throw error;
    }
  }

  /**
   * Add event to appropriate queue
   */
  addToQueue(event) {
    const { roomId, priority } = event;
    
    // Add to room-specific queue
    if (!this.eventQueues.has(roomId)) {
      this.eventQueues.set(roomId, []);
    }
    
    const roomQueue = this.eventQueues.get(roomId);
    roomQueue.push(event);
    
    // Maintain queue size limit
    if (roomQueue.length > this.config.maxQueueSize / this.eventQueues.size) {
      roomQueue.shift(); // Remove oldest event
    }
    
    // Add to priority queue
    if (!this.priorityQueues.has(priority)) {
      this.priorityQueues.set(priority, []);
    }
    
    this.priorityQueues.get(priority).push(event);
  }

  /**
   * Get event configuration
   */
  getEventConfig(eventType) {
    return this.config.eventConfigs[eventType] || {
      aggregationType: 'none',
      priority: 5,
      batchable: true,
      deduplicateBy: []
    };
  }

  /**
   * Get event priority
   */
  getEventPriority(eventType) {
    const config = this.getEventConfig(eventType);
    return config.priority || 5;
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start event processing
   */
  startProcessing() {
    this.processingTimer = setInterval(() => {
      this.processEvents();
    }, this.config.processingInterval);
    
    this.logger.info('Event processing started');
  }

  /**
   * Process events from queues
   */
  async processEvents() {
    if (this.isProcessing) {
      return;
    }
    
    this.isProcessing = true;
    const startTime = Date.now();
    
    try {
      // Process by priority (highest first)
      const priorities = Array.from(this.priorityQueues.keys()).sort((a, b) => b - a);
      
      for (const priority of priorities) {
        const events = this.priorityQueues.get(priority);
        if (events && events.length > 0) {
          await this.processPriorityQueue(priority, events);
        }
      }
      
      // Process room-specific batches
      await this.processRoomBatches();
      
    } catch (error) {
      this.logger.error('Error processing events:', error);
    } finally {
      this.isProcessing = false;
      this.analytics.processingTime += Date.now() - startTime;
    }
  }

  /**
   * Process priority queue
   */
  async processPriorityQueue(priority, events) {
    if (events.length === 0) {
      return;
    }
    
    // Group events by room for batching
    const eventsByRoom = new Map();
    
    events.forEach(event => {
      if (!eventsByRoom.has(event.roomId)) {
        eventsByRoom.set(event.roomId, []);
      }
      eventsByRoom.get(event.roomId).push(event);
    });
    
    // Process each room's events
    for (const [roomId, roomEvents] of eventsByRoom) {
      await this.processRoomEvents(roomId, roomEvents);
    }
    
    // Clear processed events
    this.priorityQueues.set(priority, []);
  }

  /**
   * Process events for a specific room
   */
  async processRoomEvents(roomId, events) {
    if (events.length === 0) {
      return;
    }
    
    // Group events by type for aggregation
    const eventsByType = new Map();
    
    events.forEach(event => {
      if (!eventsByType.has(event.type)) {
        eventsByType.set(event.type, []);
      }
      eventsByType.get(event.type).push(event);
    });
    
    // Aggregate each event type
    const aggregatedEvents = [];
    
    for (const [eventType, typeEvents] of eventsByType) {
      const aggregated = this.aggregateEventsByType(eventType, typeEvents);
      aggregatedEvents.push(...aggregated);
    }
    
    // Create batch for room
    if (aggregatedEvents.length > 0) {
      this.createBatch(roomId, aggregatedEvents);
    }
  }

  /**
   * Aggregate events by type
   */
  aggregateEventsByType(eventType, events) {
    if (events.length === 0) {
      return [];
    }
    
    const config = this.getEventConfig(eventType);
    
    switch (config.aggregationType) {
      case 'latest':
        return this.aggregateLatest(events, config);
      case 'merge':
        return this.aggregateMerge(events, config);
      case 'count':
        return this.aggregateCount(events, config);
      case 'sum':
        return this.aggregateSum(events, config);
      case 'none':
      default:
        return events;
    }
  }

  /**
   * Keep only latest events (deduplicated)
   */
  aggregateLatest(events, config) {
    const { deduplicateBy } = config;
    
    if (deduplicateBy.length === 0) {
      return [events[events.length - 1]]; // Return latest
    }
    
    // Group by deduplication keys
    const grouped = new Map();
    
    events.forEach(event => {
      const key = this.generateDedupeKey(event, deduplicateBy);
      grouped.set(key, event); // Overwrites previous, keeping latest
    });
    
    const deduplicated = Array.from(grouped.values());
    this.analytics.duplicatesRemoved += events.length - deduplicated.length;
    
    return deduplicated;
  }

  /**
   * Merge events with similar data
   */
  aggregateMerge(events, config) {
    const { deduplicateBy } = config;
    
    if (deduplicateBy.length === 0) {
      // Merge all events into one
      return [{
        ...events[0],
        data: this.mergeEventData(events.map(e => e.data)),
        aggregatedCount: events.length
      }];
    }
    
    // Group by deduplication keys and merge each group
    const grouped = new Map();
    
    events.forEach(event => {
      const key = this.generateDedupeKey(event, deduplicateBy);
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(event);
    });
    
    const merged = [];
    for (const [key, groupEvents] of grouped) {
      merged.push({
        ...groupEvents[0],
        data: this.mergeEventData(groupEvents.map(e => e.data)),
        aggregatedCount: groupEvents.length
      });
    }
    
    this.analytics.duplicatesRemoved += events.length - merged.length;
    return merged;
  }

  /**
   * Count similar events
   */
  aggregateCount(events, config) {
    const { deduplicateBy } = config;
    
    const counted = new Map();
    
    events.forEach(event => {
      const key = deduplicateBy.length > 0 
        ? this.generateDedupeKey(event, deduplicateBy)
        : event.type;
      
      if (!counted.has(key)) {
        counted.set(key, {
          ...event,
          data: { ...event.data, count: 0 }
        });
      }
      
      counted.get(key).data.count++;
    });
    
    const result = Array.from(counted.values());
    this.analytics.duplicatesRemoved += events.length - result.length;
    return result;
  }

  /**
   * Sum numeric values in events
   */
  aggregateSum(events, config) {
    const { deduplicateBy } = config;
    
    const summed = new Map();
    
    events.forEach(event => {
      const key = deduplicateBy.length > 0 
        ? this.generateDedupeKey(event, deduplicateBy)
        : 'total';
      
      if (!summed.has(key)) {
        summed.set(key, {
          ...event,
          data: { ...event.data }
        });
      }
      
      const existing = summed.get(key);
      
      // Sum numeric properties
      Object.keys(event.data).forEach(prop => {
        if (typeof event.data[prop] === 'number') {
          existing.data[prop] = (existing.data[prop] || 0) + event.data[prop];
        }
      });
    });
    
    const result = Array.from(summed.values());
    this.analytics.duplicatesRemoved += events.length - result.length;
    return result;
  }

  /**
   * Generate deduplication key
   */
  generateDedupeKey(event, deduplicateBy) {
    return deduplicateBy.map(key => {
      return event.data[key] || event[key] || 'null';
    }).join('|');
  }

  /**
   * Merge event data objects
   */
  mergeEventData(dataArray) {
    const merged = {};
    
    dataArray.forEach(data => {
      Object.assign(merged, data);
    });
    
    return merged;
  }

  /**
   * Create batch for room
   */
  createBatch(roomId, events) {
    const batch = {
      id: this.generateBatchId(),
      roomId,
      events,
      createdAt: Date.now(),
      size: this.calculateBatchSize(events)
    };
    
    // Check batch size limits
    if (batch.size > this.config.maxBatchSize) {
      this.splitLargeBatch(batch);
      return;
    }
    
    this.pendingBatches.set(batch.id, batch);
    this.analytics.aggregatedEvents += events.length;
    
    // Emit batch ready event
    this.emit('batch_ready', batch);
  }

  /**
   * Split large batch into smaller ones
   */
  splitLargeBatch(largeBatch) {
    const { events, roomId } = largeBatch;
    const batchSize = Math.ceil(events.length / Math.ceil(largeBatch.size / this.config.maxBatchSize));
    
    for (let i = 0; i < events.length; i += batchSize) {
      const batchEvents = events.slice(i, i + batchSize);
      this.createBatch(roomId, batchEvents);
    }
  }

  /**
   * Calculate batch size in bytes
   */
  calculateBatchSize(events) {
    return JSON.stringify(events).length;
  }

  /**
   * Generate batch ID
   */
  generateBatchId() {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Process room batches
   */
  async processRoomBatches() {
    const now = Date.now();
    const readyBatches = [];
    
    for (const [batchId, batch] of this.pendingBatches) {
      const age = now - batch.createdAt;
      
      // Send batch if window elapsed or max events reached
      if (age >= this.config.aggregationWindow || 
          batch.events.length >= this.config.maxEventsPerBatch) {
        readyBatches.push(batch);
        this.pendingBatches.delete(batchId);
      }
    }
    
    // Emit ready batches
    readyBatches.forEach(batch => {
      this.emit('batch_send', batch);
      this.analytics.batchesSent++;
    });
  }

  /**
   * Update event type analytics
   */
  updateEventTypeAnalytics(eventType) {
    if (!this.analytics.eventsByType.has(eventType)) {
      this.analytics.eventsByType.set(eventType, 0);
    }
    
    this.analytics.eventsByType.set(
      eventType, 
      this.analytics.eventsByType.get(eventType) + 1
    );
  }

  /**
   * Start cleanup timer
   */
  startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);
    
    this.logger.info('Event aggregator cleanup timer started');
  }

  /**
   * Perform cleanup of old events and batches
   */
  performCleanup() {
    const now = Date.now();
    const maxAge = this.config.aggregationWindow * 10; // 10x window
    
    // Clean old events from queues
    for (const [roomId, queue] of this.eventQueues) {
      const filteredQueue = queue.filter(event => 
        (now - event.timestamp) < maxAge
      );
      
      if (filteredQueue.length !== queue.length) {
        this.eventQueues.set(roomId, filteredQueue);
      }
      
      // Remove empty queues
      if (filteredQueue.length === 0) {
        this.eventQueues.delete(roomId);
      }
    }
    
    // Clean priority queues
    for (const [priority, events] of this.priorityQueues) {
      const filteredEvents = events.filter(event => 
        (now - event.timestamp) < maxAge
      );
      
      if (filteredEvents.length !== events.length) {
        this.priorityQueues.set(priority, filteredEvents);
      }
      
      if (filteredEvents.length === 0) {
        this.priorityQueues.delete(priority);
      }
    }
    
    // Clean old pending batches
    for (const [batchId, batch] of this.pendingBatches) {
      if ((now - batch.createdAt) > maxAge) {
        this.pendingBatches.delete(batchId);
      }
    }
  }

  /**
   * Get aggregator statistics
   */
  getStats() {
    const eventsByType = {};
    this.analytics.eventsByType.forEach((count, type) => {
      eventsByType[type] = count;
    });
    
    return {
      ...this.analytics,
      eventsByType,
      queueSizes: {
        roomQueues: this.eventQueues.size,
        priorityQueues: this.priorityQueues.size,
        pendingBatches: this.pendingBatches.size
      },
      aggregationRate: this.analytics.totalEvents > 0 
        ? (this.analytics.duplicatesRemoved / this.analytics.totalEvents) * 100 
        : 0
    };
  }

  /**
   * Reset analytics
   */
  resetStats() {
    this.analytics = {
      totalEvents: 0,
      aggregatedEvents: 0,
      batchesSent: 0,
      duplicatesRemoved: 0,
      bandwidthSaved: 0,
      processingTime: 0,
      eventsByType: new Map(),
      lastReset: Date.now()
    };
  }

  /**
   * Shutdown event aggregator
   */
  async shutdown() {
    this.logger.info('Shutting down Event Aggregator...');
    
    // Clear timers
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
    }
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    // Process remaining events
    await this.processEvents();
    
    // Clear data structures
    this.eventQueues.clear();
    this.priorityQueues.clear();
    this.pendingBatches.clear();
    
    this.logger.info('Event Aggregator shutdown completed');
  }
}

export default EventAggregator;