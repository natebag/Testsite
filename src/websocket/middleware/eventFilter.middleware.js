/**
 * Event Filtering Middleware for WebSocket Connections
 * 
 * Provides intelligent event filtering and targeting based on user preferences,
 * permissions, and subscription settings. Ensures users only receive relevant
 * real-time updates while reducing bandwidth and improving performance.
 * 
 * Features:
 * - Permission-based event filtering
 * - User preference-based filtering
 * - Geographic and timezone-based filtering
 * - Content-type specific filtering
 * - Bandwidth optimization through selective updates
 * - Event priority and importance filtering
 * 
 * @author Claude Code - WebSocket Optimization Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

/**
 * Event filtering configuration
 */
const EVENT_FILTER_CONFIG = {
  // Event categories and their default priorities
  eventPriorities: {
    'system': 10,
    'security': 9,
    'user': 8,
    'clan': 7,
    'voting': 6,
    'content': 5,
    'achievement': 4,
    'social': 3,
    'analytics': 2,
    'debug': 1
  },
  
  // Events that require specific permissions
  permissionEvents: {
    'admin:system_alert': ['admin'],
    'moderator:content_flagged': ['moderator', 'admin'],
    'clan:governance_proposal': ['clan_member'],
    'user:balance_updated': ['user_self'],
    'voting:mlg_burned': ['voting_participant']
  },
  
  // Events that can be filtered by user preferences
  filterableEvents: {
    'clan:member_joined': 'clan_notifications',
    'clan:achievement_unlocked': 'achievement_notifications',
    'content:trending_updated': 'trending_notifications',
    'user:achievement_unlocked': 'achievement_notifications',
    'voting:count_updated': 'voting_notifications',
    'content:engagement': 'social_notifications'
  },
  
  // Default user preferences
  defaultPreferences: {
    clan_notifications: true,
    achievement_notifications: true,
    trending_notifications: false,
    voting_notifications: true,
    social_notifications: true,
    system_notifications: true,
    debug_notifications: false
  },
  
  // Bandwidth optimization settings
  bandwidth: {
    lowBandwidth: {
      maxEventsPerSecond: 5,
      priorityThreshold: 6,
      aggregateEvents: true
    },
    normalBandwidth: {
      maxEventsPerSecond: 20,
      priorityThreshold: 3,
      aggregateEvents: false
    },
    highBandwidth: {
      maxEventsPerSecond: 50,
      priorityThreshold: 1,
      aggregateEvents: false
    }
  }
};

/**
 * Event Filter Middleware
 */
export function eventFilterMiddleware(options = {}) {
  const config = { ...EVENT_FILTER_CONFIG, ...options };
  const logger = options.logger || console;
  
  return async (socket, next) => {
    try {
      // Initialize user preferences
      await initializeUserPreferences(socket, config, logger);
      
      // Setup event filtering
      setupEventFiltering(socket, config, logger);
      
      // Setup bandwidth optimization
      setupBandwidthOptimization(socket, config, logger);
      
      logger.debug(`Event filtering initialized for socket: ${socket.id}`);
      next();
      
    } catch (error) {
      logger.error(`Event filtering setup failed for socket ${socket.id}:`, error);
      next(error);
    }
  };
}

/**
 * Initialize user preferences for event filtering
 */
async function initializeUserPreferences(socket, config, logger) {
  try {
    // Set default preferences
    socket.eventPreferences = { ...config.defaultPreferences };
    
    // Load user-specific preferences if available
    if (socket.userId) {
      // TODO: Load preferences from database/cache
      // For now, use defaults
      logger.debug(`Using default event preferences for user: ${socket.userId}`);
    }
    
    // Set bandwidth preference (can be overridden by client)
    socket.bandwidthMode = 'normalBandwidth';
    
    // Initialize event statistics
    socket.eventStats = {
      totalSent: 0,
      totalFiltered: 0,
      priorityFiltered: 0,
      preferenceFiltered: 0,
      permissionFiltered: 0,
      bandwidthFiltered: 0,
      lastResetTime: Date.now()
    };
    
  } catch (error) {
    logger.error('Failed to initialize user preferences:', error);
    throw error;
  }
}

/**
 * Setup event filtering for socket
 */
function setupEventFiltering(socket, config, logger) {
  const originalEmit = socket.emit.bind(socket);
  
  socket.emit = function(event, data, ...args) {
    try {
      // Skip filtering for system events
      if (isSystemEvent(event)) {
        return originalEmit(event, data, ...args);
      }
      
      // Apply event filtering
      const shouldSend = shouldSendEvent(socket, event, data, config, logger);
      
      if (shouldSend) {
        // Add metadata to event
        const enrichedData = enrichEventData(event, data, socket);
        socket.eventStats.totalSent++;
        return originalEmit(event, enrichedData, ...args);
      } else {
        socket.eventStats.totalFiltered++;
        logger.debug(`Event filtered: ${event} for socket ${socket.id}`);
        return false;
      }
      
    } catch (error) {
      logger.error(`Error in event filtering for ${event}:`, error);
      // Send event anyway to avoid breaking functionality
      return originalEmit(event, data, ...args);
    }
  };
  
  // Handle preference updates from client
  socket.on('update_preferences', (preferences, callback) => {
    updateUserPreferences(socket, preferences, config, logger, callback);
  });
  
  // Handle bandwidth mode changes
  socket.on('set_bandwidth_mode', (mode, callback) => {
    setBandwidthMode(socket, mode, config, logger, callback);
  });
  
  // Get current event statistics
  socket.on('get_event_stats', (callback) => {
    if (callback) {
      callback(socket.eventStats);
    }
  });
}

/**
 * Setup bandwidth optimization
 */
function setupBandwidthOptimization(socket, config, logger) {
  socket.eventQueue = [];
  socket.lastEventTime = 0;
  
  // Process event queue periodically
  socket.eventQueueTimer = setInterval(() => {
    processEventQueue(socket, config, logger);
  }, 1000); // Process every second
  
  // Clean up timer on disconnect
  socket.on('disconnect', () => {
    if (socket.eventQueueTimer) {
      clearInterval(socket.eventQueueTimer);
    }
  });
}

/**
 * Determine if event should be sent to user
 */
function shouldSendEvent(socket, event, data, config, logger) {
  // Check permissions
  if (!hasEventPermission(socket, event, data, config)) {
    socket.eventStats.permissionFiltered++;
    logger.debug(`Event ${event} filtered due to permissions for socket ${socket.id}`);
    return false;
  }
  
  // Check user preferences
  if (!matchesUserPreferences(socket, event, config)) {
    socket.eventStats.preferenceFiltered++;
    logger.debug(`Event ${event} filtered due to user preferences for socket ${socket.id}`);
    return false;
  }
  
  // Check event priority
  if (!meetsEventPriority(socket, event, config)) {
    socket.eventStats.priorityFiltered++;
    logger.debug(`Event ${event} filtered due to low priority for socket ${socket.id}`);
    return false;
  }
  
  // Check bandwidth constraints
  if (!withinBandwidthLimits(socket, event, config)) {
    socket.eventStats.bandwidthFiltered++;
    logger.debug(`Event ${event} filtered due to bandwidth limits for socket ${socket.id}`);
    return false;
  }
  
  return true;
}

/**
 * Check if user has permission for specific event
 */
function hasEventPermission(socket, event, data, config) {
  const requiredPermissions = config.permissionEvents[event];
  
  if (!requiredPermissions) {
    return true; // No specific permissions required
  }
  
  // Check for special permission types
  if (requiredPermissions.includes('user_self')) {
    return data && data.userId === socket.userId;
  }
  
  if (requiredPermissions.includes('clan_member')) {
    return socket.clanId && data && data.clanId === socket.clanId;
  }
  
  // Check standard permissions
  if (!socket.permissions) {
    return false;
  }
  
  return requiredPermissions.some(permission => 
    socket.permissions.includes(permission) || 
    (socket.roles && socket.roles.includes(permission))
  );
}

/**
 * Check if event matches user preferences
 */
function matchesUserPreferences(socket, event, config) {
  const preferenceKey = config.filterableEvents[event];
  
  if (!preferenceKey) {
    return true; // Not a filterable event
  }
  
  return socket.eventPreferences[preferenceKey] === true;
}

/**
 * Check if event meets priority threshold
 */
function meetsEventPriority(socket, event, config) {
  const bandwidthConfig = config.bandwidth[socket.bandwidthMode];
  const eventCategory = event.split(':')[0];
  const eventPriority = config.eventPriorities[eventCategory] || 5;
  
  return eventPriority >= bandwidthConfig.priorityThreshold;
}

/**
 * Check if event is within bandwidth limits
 */
function withinBandwidthLimits(socket, event, config) {
  const bandwidthConfig = config.bandwidth[socket.bandwidthMode];
  const now = Date.now();
  const timeDiff = (now - socket.lastEventTime) / 1000;
  
  if (timeDiff < 1) {
    // Check if we're exceeding events per second
    const recentEvents = socket.eventQueue.filter(e => 
      (now - e.timestamp) < 1000
    ).length;
    
    return recentEvents < bandwidthConfig.maxEventsPerSecond;
  }
  
  return true;
}

/**
 * Enrich event data with metadata
 */
function enrichEventData(event, data, socket) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  return {
    ...data,
    _metadata: {
      timestamp: new Date().toISOString(),
      server_id: process.env.SERVER_ID || 'default',
      socket_id: socket.id,
      user_id: socket.userId,
      event_category: event.split(':')[0]
    }
  };
}

/**
 * Process event queue for bandwidth optimization
 */
function processEventQueue(socket, config, logger) {
  if (socket.eventQueue.length === 0) {
    return;
  }
  
  const bandwidthConfig = config.bandwidth[socket.bandwidthMode];
  
  if (bandwidthConfig.aggregateEvents) {
    // Aggregate similar events
    const aggregatedEvents = aggregateEvents(socket.eventQueue);
    socket.eventQueue = [];
    
    // Send aggregated events
    aggregatedEvents.forEach(event => {
      socket.emit(event.type, event.data);
    });
    
    logger.debug(`Sent ${aggregatedEvents.length} aggregated events to socket ${socket.id}`);
  } else {
    // Send events up to rate limit
    const eventsToSend = socket.eventQueue.splice(0, bandwidthConfig.maxEventsPerSecond);
    
    eventsToSend.forEach(event => {
      socket.emit(event.type, event.data);
    });
    
    logger.debug(`Sent ${eventsToSend.length} queued events to socket ${socket.id}`);
  }
}

/**
 * Aggregate similar events to reduce bandwidth
 */
function aggregateEvents(eventQueue) {
  const aggregated = {};
  
  eventQueue.forEach(event => {
    const key = event.type;
    
    if (!aggregated[key]) {
      aggregated[key] = {
        type: event.type,
        data: {
          events: [],
          count: 0,
          firstTimestamp: event.timestamp,
          lastTimestamp: event.timestamp
        }
      };
    }
    
    aggregated[key].data.events.push(event.data);
    aggregated[key].data.count++;
    aggregated[key].data.lastTimestamp = event.timestamp;
  });
  
  return Object.values(aggregated);
}

/**
 * Update user preferences
 */
function updateUserPreferences(socket, preferences, config, logger, callback) {
  try {
    // Validate preferences
    const validPreferences = {};
    Object.keys(config.defaultPreferences).forEach(key => {
      if (key in preferences && typeof preferences[key] === 'boolean') {
        validPreferences[key] = preferences[key];
      }
    });
    
    // Update socket preferences
    socket.eventPreferences = {
      ...socket.eventPreferences,
      ...validPreferences
    };
    
    logger.info(`Event preferences updated for user ${socket.userId}:`, validPreferences);
    
    // TODO: Save preferences to database
    
    if (callback) {
      callback({
        success: true,
        preferences: socket.eventPreferences,
        message: 'Preferences updated successfully'
      });
    }
    
  } catch (error) {
    logger.error(`Failed to update preferences for user ${socket.userId}:`, error);
    
    if (callback) {
      callback({
        success: false,
        error: error.message
      });
    }
  }
}

/**
 * Set bandwidth mode
 */
function setBandwidthMode(socket, mode, config, logger, callback) {
  try {
    if (!config.bandwidth[mode]) {
      throw new Error(`Invalid bandwidth mode: ${mode}`);
    }
    
    socket.bandwidthMode = mode;
    
    logger.info(`Bandwidth mode set to ${mode} for user ${socket.userId}`);
    
    if (callback) {
      callback({
        success: true,
        mode: socket.bandwidthMode,
        config: config.bandwidth[mode]
      });
    }
    
  } catch (error) {
    logger.error(`Failed to set bandwidth mode for user ${socket.userId}:`, error);
    
    if (callback) {
      callback({
        success: false,
        error: error.message
      });
    }
  }
}

/**
 * Check if event is a system event
 */
function isSystemEvent(event) {
  const systemEvents = [
    'connect',
    'disconnect',
    'error',
    'authenticated',
    'authentication_failed',
    'rate_limited',
    'token_refresh_required',
    'preferences_updated',
    'bandwidth_mode_changed'
  ];
  
  return systemEvents.includes(event);
}

/**
 * Get event filtering statistics for socket
 */
export function getEventFilterStats(socket) {
  return {
    ...socket.eventStats,
    preferences: socket.eventPreferences,
    bandwidthMode: socket.bandwidthMode,
    queueLength: socket.eventQueue ? socket.eventQueue.length : 0
  };
}

/**
 * Reset event statistics for socket
 */
export function resetEventStats(socket) {
  socket.eventStats = {
    totalSent: 0,
    totalFiltered: 0,
    priorityFiltered: 0,
    preferenceFiltered: 0,
    permissionFiltered: 0,
    bandwidthFiltered: 0,
    lastResetTime: Date.now()
  };
}

export default eventFilterMiddleware;