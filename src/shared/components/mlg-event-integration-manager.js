/**
 * MLG Event Integration Manager
 * 
 * Central integration system that coordinates all MLG event banner components
 * with existing platform systems. Manages data flow, state synchronization,
 * and seamless integration between tournament displays, countdowns, status
 * indicators, and announcement systems.
 * 
 * Features:
 * - Centralized event management and coordination
 * - Real-time data synchronization across components
 * - WebSocket integration for live updates
 * - State management and persistence
 * - Event lifecycle management
 * - Cross-component communication
 * - Performance optimization and caching
 * - Error handling and fallback systems
 * - Analytics and metrics collection
 * - Plugin architecture for extensibility
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 * @created 2025-08-13
 * @task Task 21.3 - Create MLG branded event banners and tournament displays
 */

import { EventEmitter } from 'events';
import { MLGEventBannerSystem } from './mlg-event-banner-system.js';
import { MLGTournamentBracket } from './mlg-tournament-bracket.js';
import { MLGCountdownTimer } from './mlg-countdown-timer.js';
import { MLGLiveStatusIndicators } from './mlg-live-status-indicators.js';
import { MLGEventAnnouncementSystem } from './mlg-event-announcement-system.js';
import { MLGBrandingSystem } from './mlg-branding-system.js';

/**
 * Integration Configuration
 */
const INTEGRATION_CONFIG = {
  // System Components
  COMPONENTS: {
    banner: 'banner',
    bracket: 'bracket',
    countdown: 'countdown',
    status: 'status',
    announcement: 'announcement',
    branding: 'branding'
  },
  
  // Integration Channels
  CHANNELS: {
    websocket: 'websocket',
    polling: 'polling',
    events: 'events',
    storage: 'storage'
  },
  
  // Update Frequencies (milliseconds)
  FREQUENCIES: {
    realtime: 1000,      // 1 second
    frequent: 5000,      // 5 seconds
    normal: 15000,       // 15 seconds
    slow: 60000          // 1 minute
  },
  
  // Cache Settings
  CACHE: {
    maxAge: 5 * 60 * 1000,  // 5 minutes
    maxSize: 100,           // Max cached items
    strategy: 'lru'         // Least Recently Used
  },
  
  // Event Types
  EVENT_TYPES: {
    tournament_start: 'tournament_start',
    tournament_end: 'tournament_end',
    match_start: 'match_start',
    match_end: 'match_end',
    status_change: 'status_change',
    announcement: 'announcement',
    countdown_expire: 'countdown_expire',
    bracket_update: 'bracket_update'
  },
  
  // System States
  STATES: {
    initializing: 'initializing',
    ready: 'ready',
    connected: 'connected',
    disconnected: 'disconnected',
    error: 'error',
    maintenance: 'maintenance'
  }
};

/**
 * MLG Event Integration Manager Class
 */
class MLGEventIntegrationManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = { ...INTEGRATION_CONFIG, ...options };
    this.state = this.config.STATES.initializing;
    this.components = new Map();
    this.connections = new Map();
    this.cache = new Map();
    this.eventQueue = [];
    this.subscriptions = new Map();
    this.metrics = new Map();
    this.isInitialized = false;
    this.logger = options.logger || console;
    
    // System references
    this.bannerSystem = null;
    this.bracketSystem = null;
    this.countdownSystem = null;
    this.statusSystem = null;
    this.announcementSystem = null;
    this.brandingSystem = null;
    
    // Integration state
    this.activeEvents = new Map();
    this.activeTournaments = new Map();
    this.activeCountdowns = new Map();
    this.activeStatus = new Map();
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.createEvent = this.createEvent.bind(this);
    this.updateEvent = this.updateEvent.bind(this);
    this.syncData = this.syncData.bind(this);
    this.handleWebSocketMessage = this.handleWebSocketMessage.bind(this);
    
    this.logger.info('🎮 MLG Event Integration Manager initialized');
  }

  /**
   * Initialize the integration manager
   * @param {Object} platformSystems - Existing platform systems
   */
  async initialize(platformSystems = {}) {
    try {
      if (this.isInitialized) return;
      
      this.logger.info('🚀 Initializing MLG Event Integration Manager...');
      
      // Initialize core systems
      await this.initializeSystems();
      
      // Setup integrations with existing platform
      await this.setupPlatformIntegrations(platformSystems);
      
      // Setup data synchronization
      await this.setupDataSync();
      
      // Setup WebSocket connections
      await this.setupWebSocketConnections();
      
      // Setup event handling
      this.setupEventHandling();
      
      // Setup performance monitoring
      this.setupPerformanceMonitoring();
      
      // Load cached data
      await this.loadCachedData();
      
      this.state = this.config.STATES.ready;
      this.isInitialized = true;
      
      this.emit('manager_initialized', { 
        state: this.state,
        components: Array.from(this.components.keys()),
        connections: Array.from(this.connections.keys())
      });
      
      this.logger.info('✅ MLG Event Integration Manager initialized successfully');
      
      return true;
    } catch (error) {
      this.state = this.config.STATES.error;
      this.logger.error('❌ Failed to initialize integration manager:', error);
      throw error;
    }
  }

  /**
   * Initialize core systems
   */
  async initializeSystems() {
    this.logger.debug('🔧 Initializing core systems...');
    
    // Initialize branding system first
    this.brandingSystem = new MLGBrandingSystem();
    await this.brandingSystem.initialize();
    this.components.set('branding', this.brandingSystem);
    
    // Initialize banner system
    this.bannerSystem = new MLGEventBannerSystem();
    await this.bannerSystem.initialize();
    this.components.set('banner', this.bannerSystem);
    
    // Initialize tournament bracket system
    this.bracketSystem = new MLGTournamentBracket();
    this.components.set('bracket', this.bracketSystem);
    
    // Initialize countdown timer system
    this.countdownSystem = new MLGCountdownTimer();
    this.components.set('countdown', this.countdownSystem);
    
    // Initialize status indicators
    this.statusSystem = new MLGLiveStatusIndicators();
    await this.statusSystem.initialize();
    this.components.set('status', this.statusSystem);
    
    // Initialize announcement system
    this.announcementSystem = new MLGEventAnnouncementSystem();
    await this.announcementSystem.initialize();
    this.components.set('announcement', this.announcementSystem);
    
    this.logger.debug('✅ Core systems initialized');
  }

  /**
   * Setup platform integrations
   * @param {Object} platformSystems - Platform systems
   */
  async setupPlatformIntegrations(platformSystems) {
    this.logger.debug('🔗 Setting up platform integrations...');
    
    // Integrate with existing voting system
    if (platformSystems.voting) {
      this.setupVotingIntegration(platformSystems.voting);
    }
    
    // Integrate with clan management
    if (platformSystems.clans) {
      this.setupClanIntegration(platformSystems.clans);
    }
    
    // Integrate with wallet system
    if (platformSystems.wallet) {
      this.setupWalletIntegration(platformSystems.wallet);
    }
    
    // Integrate with content system
    if (platformSystems.content) {
      this.setupContentIntegration(platformSystems.content);
    }
    
    // Integrate with user system
    if (platformSystems.user) {
      this.setupUserIntegration(platformSystems.user);
    }
    
    this.logger.debug('✅ Platform integrations setup complete');
  }

  /**
   * Setup voting system integration
   * @param {Object} votingSystem - Voting system
   */
  setupVotingIntegration(votingSystem) {
    // Listen for vote events
    votingSystem.on('vote_cast', (data) => {
      this.handleVoteEvent(data);
    });
    
    votingSystem.on('vote_completed', (data) => {
      this.handleVoteCompletion(data);
    });
    
    this.connections.set('voting', votingSystem);
    this.logger.debug('🗳️ Voting system integration setup');
  }

  /**
   * Setup clan system integration
   * @param {Object} clanSystem - Clan system
   */
  setupClanIntegration(clanSystem) {
    // Listen for clan events
    clanSystem.on('tournament_created', (data) => {
      this.handleTournamentCreation(data);
    });
    
    clanSystem.on('match_started', (data) => {
      this.handleMatchStart(data);
    });
    
    clanSystem.on('match_completed', (data) => {
      this.handleMatchCompletion(data);
    });
    
    this.connections.set('clans', clanSystem);
    this.logger.debug('🏰 Clan system integration setup');
  }

  /**
   * Setup wallet system integration
   * @param {Object} walletSystem - Wallet system
   */
  setupWalletIntegration(walletSystem) {
    // Listen for wallet events
    walletSystem.on('tokens_burned', (data) => {
      this.handleTokenBurn(data);
    });
    
    walletSystem.on('rewards_distributed', (data) => {
      this.handleRewardDistribution(data);
    });
    
    this.connections.set('wallet', walletSystem);
    this.logger.debug('💰 Wallet system integration setup');
  }

  /**
   * Setup content system integration
   * @param {Object} contentSystem - Content system
   */
  setupContentIntegration(contentSystem) {
    // Listen for content events
    contentSystem.on('content_uploaded', (data) => {
      this.handleContentUpload(data);
    });
    
    contentSystem.on('content_featured', (data) => {
      this.handleContentFeature(data);
    });
    
    this.connections.set('content', contentSystem);
    this.logger.debug('📱 Content system integration setup');
  }

  /**
   * Setup user system integration
   * @param {Object} userSystem - User system
   */
  setupUserIntegration(userSystem) {
    // Listen for user events
    userSystem.on('achievement_unlocked', (data) => {
      this.handleAchievement(data);
    });
    
    userSystem.on('user_promoted', (data) => {
      this.handleUserPromotion(data);
    });
    
    this.connections.set('user', userSystem);
    this.logger.debug('👤 User system integration setup');
  }

  /**
   * Create comprehensive event display
   * @param {Object} eventData - Event data
   * @param {Object} options - Display options
   * @returns {Object} Event instance
   */
  async createEvent(eventData, options = {}) {
    try {
      const {
        type = 'tournament',
        id = `event-${Date.now()}`,
        title = 'MLG Event',
        description = '',
        startTime = null,
        endTime = null,
        status = 'upcoming',
        tournament = null,
        participants = [],
        announcements = [],
        containers = {}
      } = eventData;

      const {
        showBanner = true,
        showCountdown = true,
        showStatus = true,
        showBracket = false,
        showAnnouncements = true,
        autoUpdate = true
      } = options;

      this.logger.debug(`🎯 Creating event: ${id} (${type})`);

      const event = {
        id,
        type,
        title,
        description,
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        status,
        tournament,
        participants,
        announcements,
        components: {},
        options,
        createdAt: new Date(),
        lastUpdate: new Date(),
        metrics: {
          views: 0,
          interactions: 0,
          updates: 0
        }
      };

      // Create banner if requested
      if (showBanner && containers.banner) {
        event.components.banner = this.bannerSystem.createEventBanner(eventData, {
          ...options,
          container: containers.banner
        });
      }

      // Create countdown if requested and has start time
      if (showCountdown && startTime && containers.countdown) {
        event.components.countdown = this.countdownSystem;
        await this.countdownSystem.initialize(containers.countdown, startTime);
      }

      // Create status indicator if requested
      if (showStatus && containers.status) {
        event.components.status = this.statusSystem.createIndicator(containers.status, {
          status: status,
          showText: true,
          showTime: true,
          priority: this.getStatusPriority(status)
        });
      }

      // Create tournament bracket if requested
      if (showBracket && tournament && containers.bracket) {
        event.components.bracket = this.bracketSystem;
        await this.bracketSystem.initialize(containers.bracket, tournament);
      }

      // Create announcements if requested
      if (showAnnouncements && announcements.length > 0) {
        announcements.forEach(announcement => {
          this.announcementSystem.announce(announcement);
        });
      }

      // Store event
      this.activeEvents.set(id, event);

      // Setup auto-update if enabled
      if (autoUpdate) {
        this.setupEventAutoUpdate(event);
      }

      // Cache event data
      this.cacheEventData(event);

      this.emit('event_created', { event });
      this.updateMetrics('events_created', 1);

      return event;
    } catch (error) {
      this.logger.error('❌ Error creating event:', error);
      throw error;
    }
  }

  /**
   * Update existing event
   * @param {string} eventId - Event ID
   * @param {Object} updateData - Update data
   */
  async updateEvent(eventId, updateData) {
    try {
      const event = this.activeEvents.get(eventId);
      if (!event) {
        this.logger.warn(`❓ Event not found: ${eventId}`);
        return;
      }

      this.logger.debug(`🔄 Updating event: ${eventId}`);

      // Update event data
      Object.assign(event, updateData);
      event.lastUpdate = new Date();
      event.metrics.updates++;

      // Update components
      await this.updateEventComponents(event, updateData);

      // Update cache
      this.cacheEventData(event);

      this.emit('event_updated', { event, updateData });
      this.updateMetrics('events_updated', 1);

    } catch (error) {
      this.logger.error('❌ Error updating event:', error);
    }
  }

  /**
   * Update event components
   * @param {Object} event - Event object
   * @param {Object} updateData - Update data
   */
  async updateEventComponents(event, updateData) {
    // Update banner
    if (event.components.banner && updateData.banner) {
      // Update banner display
      this.bannerSystem.updateEventStatus(
        event.components.banner,
        updateData.status || event.status,
        updateData.banner
      );
    }

    // Update countdown
    if (event.components.countdown && updateData.startTime) {
      this.countdownSystem.setTargetTime(updateData.startTime);
    }

    // Update status indicator
    if (event.components.status && updateData.status) {
      this.statusSystem.updateStatus(
        event.components.status.id,
        updateData.status
      );
    }

    // Update tournament bracket
    if (event.components.bracket && updateData.tournament) {
      event.tournament = { ...event.tournament, ...updateData.tournament };
      await this.bracketSystem.render();
    }

    // Create announcements for significant updates
    if (updateData.status && updateData.status !== event.status) {
      this.createStatusChangeAnnouncement(event, updateData.status);
    }
  }

  /**
   * Setup data synchronization
   */
  async setupDataSync() {
    this.logger.debug('🔄 Setting up data synchronization...');

    // Setup periodic sync
    setInterval(() => {
      this.syncData();
    }, this.config.FREQUENCIES.normal);

    // Setup real-time sync for critical updates
    setInterval(() => {
      this.syncCriticalData();
    }, this.config.FREQUENCIES.realtime);

    this.logger.debug('✅ Data synchronization setup complete');
  }

  /**
   * Synchronize data across systems
   */
  async syncData() {
    try {
      // Sync active events
      for (const [eventId, event] of this.activeEvents) {
        await this.syncEventData(eventId, event);
      }

      // Sync tournament data
      for (const [tournamentId, tournament] of this.activeTournaments) {
        await this.syncTournamentData(tournamentId, tournament);
      }

      // Sync status indicators
      for (const [statusId, status] of this.activeStatus) {
        await this.syncStatusData(statusId, status);
      }

      this.updateMetrics('sync_operations', 1);
    } catch (error) {
      this.logger.error('❌ Error during data sync:', error);
    }
  }

  /**
   * Sync critical data that requires real-time updates
   */
  async syncCriticalData() {
    // Sync live event statuses
    this.activeEvents.forEach(async (event) => {
      if (event.status === 'live') {
        await this.fetchLiveEventData(event.id);
      }
    });

    // Sync active tournaments
    this.activeTournaments.forEach(async (tournament) => {
      if (tournament.status === 'live') {
        await this.fetchLiveTournamentData(tournament.id);
      }
    });
  }

  /**
   * Setup WebSocket connections
   */
  async setupWebSocketConnections() {
    this.logger.debug('🔌 Setting up WebSocket connections...');

    try {
      // Setup event updates WebSocket
      const eventWS = new WebSocket(this.config.WEBSOCKET_URLS?.events || 'ws://localhost:8080/events');
      eventWS.onmessage = this.handleWebSocketMessage;
      eventWS.onopen = () => {
        this.state = this.config.STATES.connected;
        this.logger.debug('🔌 Event WebSocket connected');
      };
      eventWS.onclose = () => {
        this.state = this.config.STATES.disconnected;
        this.logger.warn('⚠️ Event WebSocket disconnected');
      };
      this.connections.set('event-websocket', eventWS);

      // Setup tournament updates WebSocket
      const tournamentWS = new WebSocket(this.config.WEBSOCKET_URLS?.tournaments || 'ws://localhost:8080/tournaments');
      tournamentWS.onmessage = this.handleWebSocketMessage;
      this.connections.set('tournament-websocket', tournamentWS);

    } catch (error) {
      this.logger.warn('⚠️ WebSocket setup failed, falling back to polling:', error);
      this.setupPollingFallback();
    }
  }

  /**
   * Handle WebSocket messages
   * @param {MessageEvent} event - WebSocket message event
   */
  handleWebSocketMessage(event) {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'event_update':
          this.handleEventUpdate(data.payload);
          break;
        case 'tournament_update':
          this.handleTournamentUpdate(data.payload);
          break;
        case 'match_update':
          this.handleMatchUpdate(data.payload);
          break;
        case 'status_change':
          this.handleStatusChange(data.payload);
          break;
        case 'announcement':
          this.handleAnnouncementMessage(data.payload);
          break;
        default:
          this.logger.debug(`📨 Unknown WebSocket message type: ${data.type}`);
      }
    } catch (error) {
      this.logger.error('❌ Error handling WebSocket message:', error);
    }
  }

  /**
   * Handle various platform events
   */
  handleVoteEvent(data) {
    this.announcementSystem.announce({
      type: 'system',
      title: 'Vote Cast',
      message: `Vote registered for ${data.proposal}`,
      duration: 3000,
      channels: ['toast']
    });
  }

  handleVoteCompletion(data) {
    this.announcementSystem.announce({
      type: 'achievement',
      title: 'Voting Complete',
      message: `Voting has concluded for ${data.proposal}`,
      duration: 5000,
      channels: ['banner', 'announcement']
    });
  }

  handleTournamentCreation(data) {
    this.createEvent({
      type: 'tournament',
      id: data.tournamentId,
      title: data.name,
      description: data.description,
      startTime: data.startTime,
      tournament: data,
      status: 'scheduled'
    });
  }

  handleMatchStart(data) {
    this.announcementSystem.announce({
      type: 'match',
      title: 'Match Started',
      message: `${data.player1} vs ${data.player2}`,
      duration: 8000,
      channels: ['banner', 'notification']
    });
  }

  handleMatchCompletion(data) {
    this.announcementSystem.announce({
      type: 'achievement',
      title: 'Match Complete',
      message: `Winner: ${data.winner}`,
      duration: 5000,
      channels: ['banner', 'celebration']
    });
  }

  handleTokenBurn(data) {
    this.announcementSystem.announce({
      type: 'system',
      title: 'Tokens Burned',
      message: `${data.amount} tokens burned for voting`,
      duration: 4000,
      channels: ['toast']
    });
  }

  handleRewardDistribution(data) {
    this.announcementSystem.announce({
      type: 'celebration',
      title: 'Rewards Distributed',
      message: `${data.totalAmount} tokens distributed to winners`,
      duration: 6000,
      channels: ['banner', 'announcement']
    });
  }

  handleAchievement(data) {
    this.announcementSystem.announce({
      type: 'achievement',
      title: 'Achievement Unlocked!',
      message: `${data.user} earned: ${data.achievement}`,
      duration: 5000,
      channels: ['modal', 'celebration']
    });
  }

  /**
   * Setup event handling
   */
  setupEventHandling() {
    // Component event handling
    this.components.forEach((component, name) => {
      if (component.on) {
        component.on('error', (error) => {
          this.logger.error(`❌ ${name} component error:`, error);
          this.handleComponentError(name, error);
        });
        
        component.on('update', (data) => {
          this.handleComponentUpdate(name, data);
        });
      }
    });

    // System event handling
    this.on('event_created', (data) => {
      this.logger.debug(`📅 Event created: ${data.event.id}`);
    });

    this.on('event_updated', (data) => {
      this.logger.debug(`🔄 Event updated: ${data.event.id}`);
    });
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    // Monitor component performance
    setInterval(() => {
      this.collectPerformanceMetrics();
    }, this.config.FREQUENCIES.normal);

    // Monitor memory usage
    setInterval(() => {
      this.monitorMemoryUsage();
    }, this.config.FREQUENCIES.slow);
  }

  /**
   * Collect performance metrics
   */
  collectPerformanceMetrics() {
    const metrics = {
      timestamp: new Date(),
      activeEvents: this.activeEvents.size,
      activeTournaments: this.activeTournaments.size,
      cacheSize: this.cache.size,
      memoryUsage: this.getMemoryUsage(),
      componentStats: {}
    };

    // Collect component-specific metrics
    this.components.forEach((component, name) => {
      if (component.getStatistics) {
        metrics.componentStats[name] = component.getStatistics();
      }
    });

    this.metrics.set('performance', metrics);
    this.emit('metrics_collected', metrics);
  }

  /**
   * Monitor memory usage
   */
  monitorMemoryUsage() {
    const usage = this.getMemoryUsage();
    
    if (usage.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB threshold
      this.logger.warn('⚠️ High memory usage detected, performing cleanup');
      this.performMemoryCleanup();
    }
  }

  /**
   * Get memory usage information
   * @returns {Object} Memory usage stats
   */
  getMemoryUsage() {
    if (window.performance && window.performance.memory) {
      return {
        usedJSHeapSize: window.performance.memory.usedJSHeapSize,
        totalJSHeapSize: window.performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: window.performance.memory.jsHeapSizeLimit
      };
    }
    return { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 };
  }

  /**
   * Perform memory cleanup
   */
  performMemoryCleanup() {
    // Clean expired cache entries
    this.cleanExpiredCache();
    
    // Remove old events
    this.cleanOldEvents();
    
    // Clear old metrics
    this.cleanOldMetrics();
    
    this.logger.debug('🧹 Memory cleanup completed');
  }

  /**
   * Cache event data
   * @param {Object} event - Event object
   */
  cacheEventData(event) {
    const cacheKey = `event:${event.id}`;
    const cacheEntry = {
      data: event,
      timestamp: Date.now(),
      accessed: Date.now()
    };
    
    this.cache.set(cacheKey, cacheEntry);
    
    // Cleanup old cache entries if needed
    if (this.cache.size > this.config.CACHE.maxSize) {
      this.cleanExpiredCache();
    }
  }

  /**
   * Clean expired cache entries
   */
  cleanExpiredCache() {
    const now = Date.now();
    const maxAge = this.config.CACHE.maxAge;
    
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > maxAge) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Update metrics
   * @param {string} metric - Metric name
   * @param {number} value - Metric value
   */
  updateMetrics(metric, value) {
    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, current + value);
  }

  /**
   * Get status priority for event status
   * @param {string} status - Event status
   * @returns {number} Priority level
   */
  getStatusPriority(status) {
    const priorities = {
      upcoming: 2,
      live: 4,
      completed: 1,
      cancelled: 3,
      delayed: 3
    };
    return priorities[status] || 2;
  }

  /**
   * Get integration statistics
   * @returns {Object} Integration statistics
   */
  getStatistics() {
    return {
      isInitialized: this.isInitialized,
      state: this.state,
      activeEvents: this.activeEvents.size,
      activeTournaments: this.activeTournaments.size,
      activeCountdowns: this.activeCountdowns.size,
      activeStatus: this.activeStatus.size,
      components: Array.from(this.components.keys()),
      connections: Array.from(this.connections.keys()),
      cacheSize: this.cache.size,
      metrics: Object.fromEntries(this.metrics),
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Cleanup integration manager
   */
  async cleanup() {
    this.logger.info('🧹 Cleaning up MLG Event Integration Manager...');

    // Cleanup components
    for (const [name, component] of this.components) {
      if (component.cleanup) {
        await component.cleanup();
      }
    }

    // Close WebSocket connections
    for (const [name, connection] of this.connections) {
      if (connection.close) {
        connection.close();
      }
    }

    // Clear collections
    this.activeEvents.clear();
    this.activeTournaments.clear();
    this.activeCountdowns.clear();
    this.activeStatus.clear();
    this.cache.clear();
    this.metrics.clear();

    // Remove event listeners
    this.removeAllListeners();

    this.state = this.config.STATES.initializing;
    this.isInitialized = false;

    this.logger.info('✅ MLG Event Integration Manager cleanup complete');
  }
}

// Export the integration manager
export { MLGEventIntegrationManager, INTEGRATION_CONFIG };
export default MLGEventIntegrationManager;