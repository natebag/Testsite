/**
 * Repository Event Emitter Integration
 * 
 * Bridges repository operations with WebSocket events to provide real-time updates
 * across the MLG.clan platform. Automatically emits WebSocket events when data
 * changes occur in repositories, ensuring consistent real-time synchronization.
 * 
 * Features:
 * - Automatic event emission from repository operations
 * - Event filtering and transformation
 * - Batch event processing for performance
 * - Error handling and retry logic
 * - Event deduplication and optimization
 * - Integration with existing repository patterns
 * 
 * @author Claude Code - Integration Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { EventEmitter } from 'events';

/**
 * Repository Event Emitter Configuration
 */
const EVENT_EMITTER_CONFIG = {
  // Event processing
  batchSize: 10,
  batchTimeout: 1000, // 1 second
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  
  // Event filtering
  enableEventFiltering: true,
  enableEventBatching: true,
  enableDeduplication: true,
  
  // Repository event mappings
  repositoryEventMappings: {
    // User repository events
    'user:created': 'user:profile_updated',
    'user:updated': 'user:profile_updated',
    'user:achievement_earned': 'user:achievement_unlocked',
    'user:reputation_changed': 'user:reputation_changed',
    'user:balance_updated': 'user:balance_updated',
    'user:level_up': 'user:level_up',
    
    // Clan repository events
    'clan:member_added': 'clan:member_joined',
    'clan:member_removed': 'clan:member_left',
    'clan:member_role_updated': 'clan:member_promoted',
    'clan:leaderboard_updated': 'clan:leaderboard_updated',
    'clan:achievement_earned': 'clan:achievement_unlocked',
    'clan:proposal_created': 'clan:proposal_created',
    'clan:proposal_voted': 'clan:proposal_voted',
    
    // Content repository events
    'content:created': 'content:submitted',
    'content:approved': 'content:approved',
    'content:rejected': 'content:rejected',
    'content:flagged': 'content:flagged',
    'content:updated': 'content:updated',
    'content:deleted': 'content:deleted',
    'content:engagement_updated': 'content:engagement',
    'content:trending_updated': 'content:trending_updated',
    
    // Voting repository events
    'vote:cast': 'vote:cast',
    'vote:confirmed': 'vote:confirmed',
    'vote:failed': 'vote:failed',
    'vote:count_updated': 'vote:count_updated',
    'vote:mlg_burned': 'vote:mlg_burned',
    'vote:daily_limit_updated': 'vote:daily_limit_warning'
  }
};

/**
 * Repository Event Emitter Class
 */
export class RepositoryEventEmitter extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = { ...EVENT_EMITTER_CONFIG, ...options };
    this.realTimeServer = options.realTimeServer;
    this.logger = options.logger || console;
    
    // Event processing state
    this.eventQueue = [];
    this.processingBatch = false;
    this.batchTimer = null;
    
    // Repository instances
    this.repositories = new Map();
    
    // Event statistics
    this.stats = {
      eventsProcessed: 0,
      eventsEmitted: 0,
      eventsFailed: 0,
      batchesProcessed: 0,
      duplicatesFiltered: 0
    };
    
    this.logger.info('Repository Event Emitter initialized');
  }

  /**
   * Register repository with event emitter
   */
  registerRepository(name, repository) {
    try {
      // Store repository reference
      this.repositories.set(name, repository);
      
      // Hook into repository events
      this.hookRepositoryEvents(name, repository);
      
      this.logger.info(`Repository registered: ${name}`);
      
    } catch (error) {
      this.logger.error(`Failed to register repository ${name}:`, error);
      throw error;
    }
  }

  /**
   * Hook into repository events
   */
  hookRepositoryEvents(repositoryName, repository) {
    // Get all repository event methods
    const eventMethods = this.getRepositoryEventMethods(repository);
    
    eventMethods.forEach(method => {
      this.wrapRepositoryMethod(repositoryName, repository, method);
    });
    
    // Listen for custom events if repository extends EventEmitter
    if (repository instanceof EventEmitter) {
      repository.on('*', (eventName, data) => {
        this.handleRepositoryEvent(repositoryName, eventName, data);
      });
    }
  }

  /**
   * Get repository methods that should emit events
   */
  getRepositoryEventMethods(repository) {
    const eventMethods = [];
    const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(repository));
    
    // Common CRUD operations that should emit events
    const crudOperations = [
      'create', 'insert', 'add',
      'update', 'modify', 'edit',
      'delete', 'remove', 'destroy',
      'approve', 'reject', 'flag',
      'promote', 'demote', 'ban'
    ];
    
    methodNames.forEach(methodName => {
      // Skip private methods and getters
      if (methodName.startsWith('_') || methodName.startsWith('get')) {
        return;
      }
      
      // Include methods that match CRUD patterns
      const shouldInclude = crudOperations.some(operation => 
        methodName.toLowerCase().includes(operation)
      );
      
      if (shouldInclude && typeof repository[methodName] === 'function') {
        eventMethods.push(methodName);
      }
    });
    
    return eventMethods;
  }

  /**
   * Wrap repository method to emit events
   */
  wrapRepositoryMethod(repositoryName, repository, methodName) {
    const originalMethod = repository[methodName];
    
    if (typeof originalMethod !== 'function') {
      return;
    }
    
    repository[methodName] = async (...args) => {
      try {
        // Execute original method
        const result = await originalMethod.apply(repository, args);
        
        // Generate event data
        const eventData = this.generateEventData(repositoryName, methodName, args, result);
        
        // Emit WebSocket event
        if (eventData) {
          await this.handleRepositoryEvent(repositoryName, methodName, eventData);
        }
        
        return result;
        
      } catch (error) {
        // Handle method errors
        const errorEventData = {
          operation: methodName,
          error: error.message,
          args: this.sanitizeArgs(args)
        };
        
        await this.handleRepositoryEvent(repositoryName, `${methodName}:error`, errorEventData);
        
        throw error;
      }
    };
  }

  /**
   * Generate event data from repository operation
   */
  generateEventData(repositoryName, methodName, args, result) {
    try {
      const eventType = this.getEventType(repositoryName, methodName);
      
      if (!eventType) {
        return null; // No event mapping found
      }
      
      // Extract relevant data based on repository type and method
      const eventData = {
        repositoryName,
        operation: methodName,
        timestamp: new Date().toISOString(),
        ...this.extractEventDataByRepository(repositoryName, methodName, args, result)
      };
      
      return {
        type: eventType,
        data: eventData
      };
      
    } catch (error) {
      this.logger.error(`Failed to generate event data for ${repositoryName}.${methodName}:`, error);
      return null;
    }
  }

  /**
   * Get WebSocket event type from repository operation
   */
  getEventType(repositoryName, methodName) {
    // Try exact mapping first
    const exactKey = `${repositoryName}:${methodName}`;
    if (this.config.repositoryEventMappings[exactKey]) {
      return this.config.repositoryEventMappings[exactKey];
    }
    
    // Try pattern matching
    for (const [pattern, eventType] of Object.entries(this.config.repositoryEventMappings)) {
      if (pattern.includes(':') && exactKey.includes(pattern.split(':')[1])) {
        return eventType;
      }
    }
    
    // Generate default event type
    return `${repositoryName}:${methodName}`;
  }

  /**
   * Extract event data based on repository type
   */
  extractEventDataByRepository(repositoryName, methodName, args, result) {
    switch (repositoryName.toLowerCase()) {
      case 'user':
      case 'userrepository':
        return this.extractUserEventData(methodName, args, result);
      
      case 'clan':
      case 'clanrepository':
        return this.extractClanEventData(methodName, args, result);
      
      case 'content':
      case 'contentrepository':
        return this.extractContentEventData(methodName, args, result);
      
      case 'voting':
      case 'votingrepository':
        return this.extractVotingEventData(methodName, args, result);
      
      default:
        return this.extractGenericEventData(methodName, args, result);
    }
  }

  /**
   * Extract user-specific event data
   */
  extractUserEventData(methodName, args, result) {
    const data = {};
    
    if (methodName.includes('create') || methodName.includes('update')) {
      data.userId = result?.id || args[0]?.id;
      data.profileData = this.sanitizeUserData(result || args[0]);
    }
    
    if (methodName.includes('achievement')) {
      data.userId = args[0];
      data.achievementData = args[1];
    }
    
    if (methodName.includes('reputation')) {
      data.userId = args[0];
      data.reputationData = {
        previousReputation: args[1],
        newReputation: args[2],
        change: args[2] - args[1],
        reason: args[3]
      };
    }
    
    if (methodName.includes('balance')) {
      data.userId = args[0];
      data.balanceData = {
        previousBalance: args[1],
        newBalance: args[2],
        change: args[2] - args[1],
        transactionType: args[3],
        transactionId: args[4]
      };
    }
    
    return data;
  }

  /**
   * Extract clan-specific event data
   */
  extractClanEventData(methodName, args, result) {
    const data = {};
    
    if (methodName.includes('member')) {
      data.clanId = args[0];
      data.userId = args[1];
      data.memberData = args[2] || result;
    }
    
    if (methodName.includes('leaderboard')) {
      data.clanId = args[0];
      data.leaderboardData = result || args[1];
    }
    
    if (methodName.includes('proposal')) {
      data.clanId = args[0];
      data.proposalData = result || args[1];
    }
    
    if (methodName.includes('achievement')) {
      data.clanId = args[0];
      data.achievementData = result || args[1];
    }
    
    return data;
  }

  /**
   * Extract content-specific event data
   */
  extractContentEventData(methodName, args, result) {
    const data = {};
    
    if (methodName.includes('create') || methodName.includes('submit')) {
      data.contentData = result || args[0];
      data.creatorId = (result || args[0])?.creatorId;
    }
    
    if (methodName.includes('approve') || methodName.includes('reject')) {
      data.contentId = args[0];
      data.moderatorId = args[1];
      data.reason = args[2];
      data.approvalData = result || args[3];
    }
    
    if (methodName.includes('flag')) {
      data.contentId = args[0];
      data.flaggedBy = args[1];
      data.flagData = args[2];
    }
    
    if (methodName.includes('engagement')) {
      data.contentId = args[0];
      data.engagementData = result || args[1];
    }
    
    if (methodName.includes('trending')) {
      data.category = args[0];
      data.trendingData = result || args[1];
    }
    
    return data;
  }

  /**
   * Extract voting-specific event data
   */
  extractVotingEventData(methodName, args, result) {
    const data = {};
    
    if (methodName.includes('cast')) {
      data.voteData = result || args[0];
      data.userId = (result || args[0])?.userId;
      data.contentId = (result || args[0])?.contentId;
    }
    
    if (methodName.includes('confirm')) {
      data.voteId = args[0];
      data.confirmationData = result || args[1];
    }
    
    if (methodName.includes('count')) {
      data.contentId = args[0];
      data.countData = result || args[1];
    }
    
    if (methodName.includes('burn')) {
      data.userId = args[0];
      data.burnData = result || args[1];
    }
    
    return data;
  }

  /**
   * Extract generic event data
   */
  extractGenericEventData(methodName, args, result) {
    return {
      method: methodName,
      args: this.sanitizeArgs(args),
      result: this.sanitizeResult(result)
    };
  }

  /**
   * Handle repository event
   */
  async handleRepositoryEvent(repositoryName, eventName, eventData) {
    try {
      this.stats.eventsProcessed++;
      
      const event = {
        id: this.generateEventId(),
        repositoryName,
        eventName,
        data: eventData,
        timestamp: Date.now()
      };
      
      // Filter events if enabled
      if (this.config.enableEventFiltering && !this.shouldProcessEvent(event)) {
        return;
      }
      
      // Add to queue for batch processing
      if (this.config.enableEventBatching) {
        this.addToEventQueue(event);
      } else {
        // Process immediately
        await this.emitWebSocketEvent(event);
      }
      
    } catch (error) {
      this.stats.eventsFailed++;
      this.logger.error(`Failed to handle repository event ${eventName}:`, error);
    }
  }

  /**
   * Check if event should be processed
   */
  shouldProcessEvent(event) {
    // Skip events for private operations
    if (event.eventName.startsWith('_')) {
      return false;
    }
    
    // Skip events with no data
    if (!event.data || Object.keys(event.data).length === 0) {
      return false;
    }
    
    // Check for duplicates if deduplication enabled
    if (this.config.enableDeduplication) {
      const isDuplicate = this.isDuplicateEvent(event);
      if (isDuplicate) {
        this.stats.duplicatesFiltered++;
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check for duplicate events
   */
  isDuplicateEvent(event) {
    if (!this.recentEvents) {
      this.recentEvents = [];
    }
    
    const eventSignature = this.getEventSignature(event);
    const now = Date.now();
    
    // Clean old events (keep last 1 minute)
    this.recentEvents = this.recentEvents.filter(
      recentEvent => (now - recentEvent.timestamp) < 60000
    );
    
    // Check for duplicate in recent events
    const isDuplicate = this.recentEvents.some(
      recentEvent => recentEvent.signature === eventSignature &&
                    (now - recentEvent.timestamp) < 5000 // 5 second window
    );
    
    // Add current event to recent events
    this.recentEvents.push({
      signature: eventSignature,
      timestamp: now
    });
    
    return isDuplicate;
  }

  /**
   * Generate event signature for deduplication
   */
  getEventSignature(event) {
    const key = {
      repository: event.repositoryName,
      event: event.eventName,
      userId: event.data.userId,
      contentId: event.data.contentId,
      clanId: event.data.clanId
    };
    
    return JSON.stringify(key);
  }

  /**
   * Add event to processing queue
   */
  addToEventQueue(event) {
    this.eventQueue.push(event);
    
    // Process batch if queue is full
    if (this.eventQueue.length >= this.config.batchSize) {
      this.processBatch();
    } else if (!this.batchTimer) {
      // Set timer for batch processing
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, this.config.batchTimeout);
    }
  }

  /**
   * Process batch of events
   */
  async processBatch() {
    if (this.processingBatch || this.eventQueue.length === 0) {
      return;
    }
    
    this.processingBatch = true;
    
    // Clear batch timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    try {
      const batch = this.eventQueue.splice(0, this.config.batchSize);
      
      // Process events in parallel
      const promises = batch.map(event => this.emitWebSocketEvent(event));
      await Promise.allSettled(promises);
      
      this.stats.batchesProcessed++;
      this.logger.debug(`Processed batch of ${batch.length} events`);
      
    } catch (error) {
      this.logger.error('Failed to process event batch:', error);
    } finally {
      this.processingBatch = false;
      
      // Process remaining events if any
      if (this.eventQueue.length > 0) {
        setTimeout(() => this.processBatch(), 100);
      }
    }
  }

  /**
   * Emit WebSocket event
   */
  async emitWebSocketEvent(event) {
    try {
      if (!this.realTimeServer) {
        this.logger.warn('Real-time server not configured, skipping event emission');
        return;
      }
      
      const eventType = event.data.type || event.eventName;
      const eventData = event.data.data || event.data;
      
      // Route to appropriate event handler
      await this.routeEventToHandler(eventType, eventData);
      
      this.stats.eventsEmitted++;
      
    } catch (error) {
      this.logger.error(`Failed to emit WebSocket event ${event.eventName}:`, error);
      
      // Retry logic
      await this.retryEventEmission(event);
    }
  }

  /**
   * Route event to appropriate WebSocket event handler
   */
  async routeEventToHandler(eventType, eventData) {
    const [category] = eventType.split(':');
    
    switch (category) {
      case 'user':
        if (this.realTimeServer.userEvents) {
          await this.handleUserEvent(eventType, eventData);
        }
        break;
      
      case 'clan':
        if (this.realTimeServer.clanEvents) {
          await this.handleClanEvent(eventType, eventData);
        }
        break;
      
      case 'content':
        if (this.realTimeServer.contentEvents) {
          await this.handleContentEvent(eventType, eventData);
        }
        break;
      
      case 'vote':
        if (this.realTimeServer.votingEvents) {
          await this.handleVotingEvent(eventType, eventData);
        }
        break;
      
      default:
        this.logger.debug(`No specific handler for event type: ${eventType}`);
        break;
    }
  }

  /**
   * Handle user events
   */
  async handleUserEvent(eventType, eventData) {
    const userEvents = this.realTimeServer.userEvents;
    
    switch (eventType) {
      case 'user:profile_updated':
        userEvents.handleProfileUpdate(eventData.userId, eventData);
        break;
      
      case 'user:achievement_unlocked':
        userEvents.handleAchievementUnlock(eventData.userId, eventData.achievementData);
        break;
      
      case 'user:reputation_changed':
        userEvents.handleReputationChange(eventData.userId, eventData.reputationData);
        break;
      
      case 'user:balance_updated':
        userEvents.handleBalanceUpdate(eventData.userId, eventData.balanceData);
        break;
      
      case 'user:level_up':
        userEvents.handleLevelUp(eventData.userId, eventData.levelData);
        break;
      
      default:
        this.logger.debug(`Unhandled user event: ${eventType}`);
        break;
    }
  }

  /**
   * Handle clan events
   */
  async handleClanEvent(eventType, eventData) {
    const clanEvents = this.realTimeServer.clanEvents;
    
    switch (eventType) {
      case 'clan:member_joined':
        clanEvents.handleMemberJoined(eventData.clanId, eventData.memberData);
        break;
      
      case 'clan:member_left':
        clanEvents.handleMemberLeft(eventData.clanId, eventData.memberData);
        break;
      
      case 'clan:member_promoted':
        clanEvents.handleMemberPromoted(eventData.clanId, eventData.memberData);
        break;
      
      case 'clan:leaderboard_updated':
        clanEvents.handleLeaderboardUpdate(eventData.clanId, eventData.leaderboardData);
        break;
      
      case 'clan:achievement_unlocked':
        clanEvents.handleClanAchievement(eventData.clanId, eventData.achievementData);
        break;
      
      case 'clan:proposal_created':
        clanEvents.handleGovernanceProposal(eventData.clanId, eventData.proposalData);
        break;
      
      case 'clan:proposal_voted':
        clanEvents.handleProposalVote(eventData.clanId, eventData.voteData);
        break;
      
      default:
        this.logger.debug(`Unhandled clan event: ${eventType}`);
        break;
    }
  }

  /**
   * Handle content events
   */
  async handleContentEvent(eventType, eventData) {
    const contentEvents = this.realTimeServer.contentEvents;
    
    switch (eventType) {
      case 'content:submitted':
        contentEvents.handleContentSubmission(eventData);
        break;
      
      case 'content:approved':
        contentEvents.handleContentApproval(eventData);
        break;
      
      case 'content:rejected':
        contentEvents.handleContentRejection(eventData);
        break;
      
      case 'content:flagged':
        contentEvents.handleContentFlagged(eventData);
        break;
      
      case 'content:engagement':
        contentEvents.handleEngagement(eventData.engagementData);
        break;
      
      case 'content:trending_updated':
        contentEvents.handleTrendingUpdate(eventData.trendingData);
        break;
      
      default:
        this.logger.debug(`Unhandled content event: ${eventType}`);
        break;
    }
  }

  /**
   * Handle voting events
   */
  async handleVotingEvent(eventType, eventData) {
    const votingEvents = this.realTimeServer.votingEvents;
    
    switch (eventType) {
      case 'vote:cast':
        votingEvents.handleVoteCast(eventData.voteData);
        break;
      
      case 'vote:confirmed':
        votingEvents.handleVoteConfirmation(eventData.voteData);
        break;
      
      case 'vote:failed':
        votingEvents.handleVoteFailure(eventData.voteData, eventData.error);
        break;
      
      case 'vote:count_updated':
        votingEvents.handleVoteCountUpdate(eventData.contentId, eventData.countData);
        break;
      
      case 'vote:mlg_burned':
        votingEvents.handleMLGBurnConfirmation(eventData.burnData);
        break;
      
      case 'vote:daily_limit_warning':
        votingEvents.handleDailyLimitUpdate(eventData.userId, eventData.limitData);
        break;
      
      default:
        this.logger.debug(`Unhandled voting event: ${eventType}`);
        break;
    }
  }

  /**
   * Retry event emission
   */
  async retryEventEmission(event, attempt = 1) {
    if (attempt > this.config.retryAttempts) {
      this.logger.error(`Failed to emit event after ${this.config.retryAttempts} attempts:`, event);
      return;
    }
    
    try {
      await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
      await this.emitWebSocketEvent(event);
      
    } catch (error) {
      await this.retryEventEmission(event, attempt + 1);
    }
  }

  /**
   * Sanitize user data
   */
  sanitizeUserData(userData) {
    if (!userData) return null;
    
    const { password, privateKey, ...sanitized } = userData;
    return sanitized;
  }

  /**
   * Sanitize arguments
   */
  sanitizeArgs(args) {
    if (!args || args.length === 0) return [];
    
    return args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        const { password, privateKey, secret, ...sanitized } = arg;
        return sanitized;
      }
      return arg;
    });
  }

  /**
   * Sanitize result data
   */
  sanitizeResult(result) {
    if (!result || typeof result !== 'object') return result;
    
    const { password, privateKey, secret, ...sanitized } = result;
    return sanitized;
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `repo_evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get integration statistics
   */
  getStats() {
    return {
      ...this.stats,
      repositories: this.repositories.size,
      queueSize: this.eventQueue.length,
      processingBatch: this.processingBatch
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      eventsProcessed: 0,
      eventsEmitted: 0,
      eventsFailed: 0,
      batchesProcessed: 0,
      duplicatesFiltered: 0
    };
    
    this.logger.info('Repository Event Emitter statistics reset');
  }

  /**
   * Shutdown repository event emitter
   */
  async shutdown() {
    // Process remaining events in queue
    if (this.eventQueue.length > 0) {
      await this.processBatch();
    }
    
    // Clear batch timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    
    this.logger.info('Repository Event Emitter shutdown completed');
  }
}

export default RepositoryEventEmitter;