/**
 * MLG.clan WebSocket Client
 * 
 * Frontend JavaScript client for real-time communication with the MLG.clan platform.
 * Provides automatic reconnection, event management, authentication handling,
 * and seamless integration with the platform's gaming features.
 * 
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Wallet-based authentication integration
 * - Event subscription management
 * - Connection health monitoring
 * - Offline/online state handling
 * - Performance optimization
 * - Error handling and recovery
 * 
 * @author Claude Code - Frontend WebSocket Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { io } from 'socket.io-client';

/**
 * WebSocket Client Configuration
 */
const CLIENT_CONFIG = {
  // Connection settings
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  randomizationFactor: 0.5,
  timeout: 20000,
  
  // Transport settings
  transports: ['websocket', 'polling'],
  upgrade: true,
  rememberUpgrade: true,
  
  // Authentication settings
  auth: {
    autoAuthenticate: true,
    tokenRefreshThreshold: 300000, // 5 minutes
    retryAuthOnFailure: true
  },
  
  // Event settings
  enableEventFiltering: true,
  enableBandwidthOptimization: true,
  defaultBandwidthMode: 'normalBandwidth',
  
  // Health monitoring
  heartbeatInterval: 30000, // 30 seconds
  connectionTimeout: 60000, // 1 minute
  
  // Performance settings
  enableMetrics: true,
  metricsInterval: 60000, // 1 minute
  
  // Debugging
  debug: process.env.NODE_ENV === 'development'
};

/**
 * MLG.clan WebSocket Client Class
 */
export class MLGWebSocketClient {
  constructor(options = {}) {
    this.config = { ...CLIENT_CONFIG, ...options };
    this.url = options.url || 'ws://localhost:3000';
    
    // Client state
    this.socket = null;
    this.isConnected = false;
    this.isAuthenticated = false;
    this.connectionState = 'disconnected';
    this.lastConnectionAttempt = null;
    
    // Authentication
    this.authToken = null;
    this.walletAddress = null;
    this.userInfo = null;
    
    // Event management
    this.eventSubscriptions = new Map();
    this.eventHandlers = new Map();
    this.eventQueue = [];
    
    // Connection management
    this.reconnectAttempts = 0;
    this.heartbeatTimer = null;
    this.tokenRefreshTimer = null;
    
    // Performance metrics
    this.metrics = {
      connectTime: null,
      reconnectCount: 0,
      messagesReceived: 0,
      messagesSent: 0,
      errors: 0,
      lastActivity: null
    };
    
    // Event listeners
    this.listeners = new Map();
    
    // Initialize client
    this.initialize();
  }

  /**
   * Initialize WebSocket client
   */
  initialize() {
    if (this.config.debug) {
      console.log('[MLG WebSocket] Initializing client...');
    }
    
    // Setup online/offline detection
    this.setupOnlineOfflineDetection();
    
    // Auto-connect if enabled
    if (this.config.autoConnect) {
      this.connect();
    }
  }

  /**
   * Connect to WebSocket server
   */
  connect(authToken = null) {
    if (this.socket && this.socket.connected) {
      console.warn('[MLG WebSocket] Already connected');
      return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
      try {
        this.connectionState = 'connecting';
        this.lastConnectionAttempt = Date.now();
        
        // Store auth token if provided
        if (authToken) {
          this.authToken = authToken;
        }
        
        // Create socket connection
        this.socket = io(this.url, {
          ...this.config,
          auth: this.authToken ? { token: this.authToken } : {}
        });
        
        // Setup socket event handlers
        this.setupSocketEvents(resolve, reject);
        
      } catch (error) {
        this.connectionState = 'error';
        this.metrics.errors++;
        reject(error);
      }
    });
  }

  /**
   * Setup socket event handlers
   */
  setupSocketEvents(connectResolve, connectReject) {
    // Connection events
    this.socket.on('connect', () => {
      this.handleConnect(connectResolve);
    });
    
    this.socket.on('disconnect', (reason) => {
      this.handleDisconnect(reason);
    });
    
    this.socket.on('connect_error', (error) => {
      this.handleConnectionError(error, connectReject);
    });
    
    this.socket.on('reconnect', (attemptNumber) => {
      this.handleReconnect(attemptNumber);
    });
    
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      this.handleReconnectAttempt(attemptNumber);
    });
    
    this.socket.on('reconnect_error', (error) => {
      this.handleReconnectError(error);
    });
    
    this.socket.on('reconnect_failed', () => {
      this.handleReconnectFailed();
    });
    
    // Authentication events
    this.socket.on('authenticated', (data) => {
      this.handleAuthenticated(data);
    });
    
    this.socket.on('authentication_failed', (data) => {
      this.handleAuthenticationFailed(data);
    });
    
    this.socket.on('token_refresh_required', (data) => {
      this.handleTokenRefreshRequired(data);
    });
    
    // System events
    this.socket.on('system:connection', (data) => {
      this.emit('connection_info', data);
    });
    
    this.socket.on('system:server_status', (data) => {
      this.emit('server_status', data);
    });
    
    this.socket.on('system:maintenance', (data) => {
      this.emit('maintenance', data);
    });
    
    this.socket.on('system:alert', (data) => {
      this.emit('alert', data);
    });
    
    this.socket.on('rate_limited', (data) => {
      this.handleRateLimit(data);
    });
    
    // Generic event handler for all events
    this.socket.onAny((eventName, ...args) => {
      this.handleGenericEvent(eventName, ...args);
    });
  }

  /**
   * Handle successful connection
   */
  handleConnect(resolve) {
    this.isConnected = true;
    this.connectionState = 'connected';
    this.metrics.connectTime = Date.now();
    this.metrics.lastActivity = Date.now();
    this.reconnectAttempts = 0;
    
    if (this.config.debug) {
      console.log('[MLG WebSocket] Connected to server');
    }
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Authenticate if token available
    if (this.authToken && this.config.auth.autoAuthenticate) {
      this.authenticate(this.authToken);
    }
    
    // Process queued events
    this.processEventQueue();
    
    // Emit connect event
    this.emit('connect', {
      timestamp: new Date().toISOString(),
      reconnect: this.metrics.reconnectCount > 0
    });
    
    if (resolve) resolve();
  }

  /**
   * Handle disconnection
   */
  handleDisconnect(reason) {
    this.isConnected = false;
    this.isAuthenticated = false;
    this.connectionState = 'disconnected';
    
    // Stop heartbeat
    this.stopHeartbeat();
    
    if (this.config.debug) {
      console.log(`[MLG WebSocket] Disconnected: ${reason}`);
    }
    
    // Emit disconnect event
    this.emit('disconnect', {
      reason,
      timestamp: new Date().toISOString(),
      wasAuthenticated: this.isAuthenticated
    });
  }

  /**
   * Handle connection error
   */
  handleConnectionError(error, reject) {
    this.connectionState = 'error';
    this.metrics.errors++;
    
    console.error('[MLG WebSocket] Connection error:', error.message);
    
    // Emit error event
    this.emit('error', {
      type: 'connection_error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
    
    if (reject) reject(error);
  }

  /**
   * Handle reconnection
   */
  handleReconnect(attemptNumber) {
    this.metrics.reconnectCount++;
    
    if (this.config.debug) {
      console.log(`[MLG WebSocket] Reconnected after ${attemptNumber} attempts`);
    }
    
    // Emit reconnect event
    this.emit('reconnect', {
      attemptNumber,
      totalReconnects: this.metrics.reconnectCount,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle reconnection attempt
   */
  handleReconnectAttempt(attemptNumber) {
    this.reconnectAttempts = attemptNumber;
    this.connectionState = 'reconnecting';
    
    if (this.config.debug) {
      console.log(`[MLG WebSocket] Reconnection attempt ${attemptNumber}`);
    }
    
    // Emit reconnect attempt event
    this.emit('reconnect_attempt', {
      attemptNumber,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle reconnection error
   */
  handleReconnectError(error) {
    this.metrics.errors++;
    
    console.error('[MLG WebSocket] Reconnection error:', error.message);
    
    // Emit reconnect error event
    this.emit('reconnect_error', {
      message: error.message,
      attemptNumber: this.reconnectAttempts,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle reconnection failed
   */
  handleReconnectFailed() {
    this.connectionState = 'failed';
    
    console.error('[MLG WebSocket] Reconnection failed after maximum attempts');
    
    // Emit reconnect failed event
    this.emit('reconnect_failed', {
      maxAttempts: this.config.reconnectionAttempts,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle authentication success
   */
  handleAuthenticated(data) {
    this.isAuthenticated = true;
    this.userInfo = data;
    this.walletAddress = data.walletAddress;
    
    if (this.config.debug) {
      console.log('[MLG WebSocket] Authenticated successfully');
    }
    
    // Setup token refresh timer
    this.setupTokenRefresh();
    
    // Emit authenticated event
    this.emit('authenticated', data);
  }

  /**
   * Handle authentication failure
   */
  handleAuthenticationFailed(data) {
    this.isAuthenticated = false;
    
    console.error('[MLG WebSocket] Authentication failed:', data.error);
    
    // Emit authentication failed event
    this.emit('authentication_failed', data);
    
    // Retry authentication if enabled
    if (this.config.auth.retryAuthOnFailure && this.authToken) {
      setTimeout(() => {
        this.authenticate(this.authToken);
      }, 5000); // Retry after 5 seconds
    }
  }

  /**
   * Handle token refresh requirement
   */
  handleTokenRefreshRequired(data) {
    if (this.config.debug) {
      console.log('[MLG WebSocket] Token refresh required');
    }
    
    // Emit token refresh required event
    this.emit('token_refresh_required', data);
  }

  /**
   * Handle rate limiting
   */
  handleRateLimit(data) {
    console.warn(`[MLG WebSocket] Rate limited: ${data.message}`);
    
    // Emit rate limit event
    this.emit('rate_limited', data);
  }

  /**
   * Handle generic events
   */
  handleGenericEvent(eventName, ...args) {
    this.metrics.messagesReceived++;
    this.metrics.lastActivity = Date.now();
    
    // Check if we have specific handlers for this event
    const handlers = this.eventHandlers.get(eventName);
    if (handlers && handlers.length > 0) {
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`[MLG WebSocket] Error in event handler for ${eventName}:`, error);
        }
      });
    }
    
    // Emit through our event system
    this.emit(eventName, ...args);
  }

  /**
   * Authenticate with server
   */
  authenticate(token, signature = null, message = null) {
    if (!this.isConnected) {
      console.warn('[MLG WebSocket] Cannot authenticate - not connected');
      return;
    }
    
    this.authToken = token;
    
    const authData = { token };
    
    if (signature && message) {
      authData.signature = signature;
      authData.message = message;
    }
    
    this.socket.emit('authenticate', authData);
  }

  /**
   * Refresh authentication token
   */
  refreshToken(newToken) {
    if (!this.isConnected) {
      console.warn('[MLG WebSocket] Cannot refresh token - not connected');
      return;
    }
    
    this.authToken = newToken;
    
    this.socket.emit('refresh_token', { token: newToken }, (response) => {
      if (response.success) {
        if (this.config.debug) {
          console.log('[MLG WebSocket] Token refreshed successfully');
        }
        this.emit('token_refreshed', response);
      } else {
        console.error('[MLG WebSocket] Token refresh failed:', response.error);
        this.emit('token_refresh_failed', response);
      }
    });
  }

  /**
   * Setup token refresh timer
   */
  setupTokenRefresh() {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }
    
    // Set timer to emit refresh requirement before token expires
    this.tokenRefreshTimer = setTimeout(() => {
      this.emit('token_refresh_needed', {
        message: 'Authentication token will expire soon',
        timestamp: new Date().toISOString()
      });
    }, this.config.auth.tokenRefreshThreshold);
  }

  /**
   * Subscribe to room or event type
   */
  subscribe(type, id, options = {}) {
    if (!this.isConnected) {
      console.warn('[MLG WebSocket] Cannot subscribe - not connected');
      return false;
    }
    
    const subscriptionKey = `${type}:${id}`;
    
    // Store subscription
    this.eventSubscriptions.set(subscriptionKey, {
      type,
      id,
      options,
      timestamp: Date.now()
    });
    
    // Send subscription request based on type
    switch (type) {
      case 'user':
        this.socket.emit('user:subscribe_updates', { ...options });
        break;
      
      case 'clan':
        this.socket.emit('clan:subscribe', { clanId: id, ...options });
        break;
      
      case 'content':
        this.socket.emit('content:subscribe', { contentIds: [id], ...options });
        break;
      
      case 'voting':
        this.socket.emit('voting:subscribe', { contentIds: [id], ...options });
        break;
      
      case 'room':
        this.socket.emit('join_room', { roomId: id, ...options });
        break;
      
      default:
        console.warn(`[MLG WebSocket] Unknown subscription type: ${type}`);
        return false;
    }
    
    if (this.config.debug) {
      console.log(`[MLG WebSocket] Subscribed to ${subscriptionKey}`);
    }
    
    return true;
  }

  /**
   * Unsubscribe from room or event type
   */
  unsubscribe(type, id) {
    if (!this.isConnected) {
      return false;
    }
    
    const subscriptionKey = `${type}:${id}`;
    
    // Remove subscription
    this.eventSubscriptions.delete(subscriptionKey);
    
    // Send unsubscription request
    switch (type) {
      case 'room':
        this.socket.emit('leave_room', { roomId: id });
        break;
      
      default:
        // For other types, we might need specific unsubscribe logic
        break;
    }
    
    if (this.config.debug) {
      console.log(`[MLG WebSocket] Unsubscribed from ${subscriptionKey}`);
    }
    
    return true;
  }

  /**
   * Add event listener
   */
  on(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    
    this.eventHandlers.get(eventName).push(handler);
  }

  /**
   * Remove event listener
   */
  off(eventName, handler) {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to internal listeners
   */
  emit(eventName, ...args) {
    const handlers = this.listeners.get(eventName);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`[MLG WebSocket] Error in listener for ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * Add internal listener
   */
  addEventListener(eventName, handler) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    
    this.listeners.get(eventName).push(handler);
  }

  /**
   * Remove internal listener
   */
  removeEventListener(eventName, handler) {
    const handlers = this.listeners.get(eventName);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Send message to server
   */
  send(eventName, data, callback = null) {
    if (!this.isConnected) {
      // Queue event for when connected
      this.eventQueue.push({ eventName, data, callback });
      return false;
    }
    
    this.metrics.messagesSent++;
    this.metrics.lastActivity = Date.now();
    
    if (callback) {
      this.socket.emit(eventName, data, callback);
    } else {
      this.socket.emit(eventName, data);
    }
    
    return true;
  }

  /**
   * Process queued events
   */
  processEventQueue() {
    while (this.eventQueue.length > 0) {
      const { eventName, data, callback } = this.eventQueue.shift();
      this.send(eventName, data, callback);
    }
  }

  /**
   * Start heartbeat
   */
  startHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.socket.emit('heartbeat', (response) => {
          if (response) {
            this.metrics.lastActivity = Date.now();
          }
        });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Setup online/offline detection
   */
  setupOnlineOfflineDetection() {
    if (typeof window === 'undefined') return; // Not in browser
    
    window.addEventListener('online', () => {
      if (this.config.debug) {
        console.log('[MLG WebSocket] Network came online');
      }
      
      if (!this.isConnected) {
        this.connect();
      }
      
      this.emit('network_online');
    });
    
    window.addEventListener('offline', () => {
      if (this.config.debug) {
        console.log('[MLG WebSocket] Network went offline');
      }
      
      this.emit('network_offline');
    });
  }

  /**
   * Update client preferences
   */
  updatePreferences(preferences) {
    this.send('update_preferences', preferences, (response) => {
      if (response.success) {
        this.emit('preferences_updated', response.preferences);
      } else {
        console.error('[MLG WebSocket] Failed to update preferences:', response.error);
      }
    });
  }

  /**
   * Set bandwidth mode
   */
  setBandwidthMode(mode) {
    const validModes = ['lowBandwidth', 'normalBandwidth', 'highBandwidth'];
    
    if (!validModes.includes(mode)) {
      console.error(`[MLG WebSocket] Invalid bandwidth mode: ${mode}`);
      return false;
    }
    
    this.send('set_bandwidth_mode', mode, (response) => {
      if (response.success) {
        this.emit('bandwidth_mode_changed', response.mode);
      } else {
        console.error('[MLG WebSocket] Failed to set bandwidth mode:', response.error);
      }
    });
    
    return true;
  }

  /**
   * Get connection info
   */
  getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      isAuthenticated: this.isAuthenticated,
      connectionState: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      userInfo: this.userInfo,
      metrics: this.metrics,
      subscriptions: Array.from(this.eventSubscriptions.keys())
    };
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: this.metrics.connectTime ? Date.now() - this.metrics.connectTime : 0,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true
    };
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
    
    this.stopHeartbeat();
    
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }
    
    this.isConnected = false;
    this.isAuthenticated = false;
    this.connectionState = 'disconnected';
    
    if (this.config.debug) {
      console.log('[MLG WebSocket] Manually disconnected');
    }
  }

  /**
   * Destroy client and clean up
   */
  destroy() {
    this.disconnect();
    
    // Clear all handlers and subscriptions
    this.eventHandlers.clear();
    this.eventSubscriptions.clear();
    this.listeners.clear();
    this.eventQueue.length = 0;
    
    if (this.config.debug) {
      console.log('[MLG WebSocket] Client destroyed');
    }
  }
}

/**
 * Create WebSocket client instance
 */
export function createWebSocketClient(url, options = {}) {
  return new MLGWebSocketClient({ url, ...options });
}

/**
 * Default export
 */
export default MLGWebSocketClient;