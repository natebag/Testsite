/**
 * MLG.clan WebSocket Manager
 * Centralized real-time communication system with Socket.io
 * 
 * Features:
 * - Connection management with auto-reconnect
 * - Event subscription/unsubscription
 * - Room-based updates (voting, clans, content, etc.)
 * - Connection status monitoring
 * - Gaming-themed connection feedback
 * - Fallback graceful degradation
 * 
 * @author Claude Code - Frontend Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

class MLGWebSocketManager {
  constructor(options = {}) {
    this.serverUrl = options.serverUrl || 'ws://localhost:3000';
    this.socket = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.subscriptions = new Map();
    this.roomSubscriptions = new Set();
    this.heartbeatInterval = null;
    this.connectionTimeout = null;
    this.errorHandler = window.MLGErrorHandler;
    
    // Event listeners
    this.listeners = {
      connect: new Set(),
      disconnect: new Set(),
      reconnect: new Set(),
      error: new Set(),
      message: new Set()
    };

    this.init();
  }

  async init() {
    if (typeof io === 'undefined') {
      console.warn('🔌 Socket.io not available, falling back to polling mode');
      this.initPollingFallback();
      return;
    }

    try {
      await this.connect();
      this.setupEventHandlers();
      this.startHeartbeat();
      
      console.log('🎮 MLG WebSocket Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WebSocket manager:', error);
      this.initPollingFallback();
    }
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.connectionTimeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);

      try {
        this.socket = io(this.serverUrl, {
          transports: ['websocket', 'polling'],
          upgrade: true,
          rememberUpgrade: true,
          timeout: 10000,
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
          reconnectionDelayMax: this.maxReconnectDelay
        });

        this.socket.on('connect', () => {
          clearTimeout(this.connectionTimeout);
          this.isConnected = true;
          this.connectionAttempts = 0;
          this.reconnectDelay = 1000; // Reset delay
          
          console.log('🔗 WebSocket connected successfully');
          this.notifyConnectionStatus('connected');
          this.resubscribeAll();
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          this.isConnected = false;
          console.warn(`🔌 WebSocket disconnected: ${reason}`);
          this.notifyConnectionStatus('disconnected', reason);
          
          if (reason === 'io server disconnect') {
            // Server initiated disconnect, manually reconnect
            this.scheduleReconnect();
          }
        });

        this.socket.on('connect_error', (error) => {
          clearTimeout(this.connectionTimeout);
          console.error('WebSocket connection error:', error);
          this.handleConnectionError(error);
          reject(error);
        });

        this.socket.on('reconnect', (attemptNumber) => {
          console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`);
          this.notifyConnectionStatus('reconnected');
          this.notifyListeners('reconnect', { attempts: attemptNumber });
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
          console.log(`🔄 WebSocket reconnection attempt ${attemptNumber}/${this.maxReconnectAttempts}`);
          this.showConnectionStatus(`Reconnecting... (${attemptNumber}/${this.maxReconnectAttempts})`);
        });

        this.socket.on('reconnect_error', (error) => {
          console.error('WebSocket reconnection error:', error);
          this.handleConnectionError(error);
        });

        this.socket.on('reconnect_failed', () => {
          console.error('❌ WebSocket reconnection failed after max attempts');
          this.notifyConnectionStatus('failed');
          this.initPollingFallback();
        });

      } catch (error) {
        clearTimeout(this.connectionTimeout);
        reject(error);
      }
    });
  }

  setupEventHandlers() {
    if (!this.socket) return;

    // Handle gaming-specific events
    this.socket.on('voting_update', (data) => {
      console.log('🗳️ Voting update received:', data);
      this.notifySubscribers('voting', data);
    });
    
    this.socket.on('vote-update', (data) => {
      console.log('🗳️ Individual vote update received:', data);
      this.notifySubscribers('vote-update', data);
    });

    this.socket.on('clan_update', (data) => {
      console.log('🏛️ Clan update received:', data);
      this.notifySubscribers('clans', data);
    });

    this.socket.on('content_update', (data) => {
      console.log('📱 Content update received:', data);
      this.notifySubscribers('content', data);
    });

    this.socket.on('dao_update', (data) => {
      console.log('🏛️ DAO update received:', data);
      this.notifySubscribers('dao', data);
    });

    this.socket.on('leaderboard_update', (data) => {
      console.log('🏆 Leaderboard update received:', data);
      this.notifySubscribers('leaderboard', data);
    });

    this.socket.on('user_update', (data) => {
      console.log('👤 User profile update received:', data);
      this.notifySubscribers('profile', data);
    });

    this.socket.on('system_status', (data) => {
      console.log('⚡ System status update received:', data);
      this.notifySubscribers('system', data);
    });

    // Handle generic events
    this.socket.on('message', (data) => {
      this.notifyListeners('message', data);
    });

    this.socket.on('notification', (data) => {
      this.showGameNotification(data);
    });

    this.socket.on('pong', (latency) => {
      this.updateConnectionQuality(latency);
    });
  }

  // Subscribe to real-time updates for a specific room/category
  subscribe(room, callback) {
    if (!callback || typeof callback !== 'function') {
      console.error('Invalid callback provided for subscription');
      return false;
    }

    // Store subscription
    if (!this.subscriptions.has(room)) {
      this.subscriptions.set(room, new Set());
    }
    this.subscriptions.get(room).add(callback);

    // Join room if connected
    if (this.isConnected && this.socket) {
      this.socket.emit('join_room', room);
      this.roomSubscriptions.add(room);
      console.log(`📡 Subscribed to ${room} updates`);
    }

    return true;
  }

  // Unsubscribe from real-time updates
  unsubscribe(room, callback = null) {
    if (!this.subscriptions.has(room)) return;

    if (callback) {
      // Remove specific callback
      this.subscriptions.get(room).delete(callback);
      if (this.subscriptions.get(room).size === 0) {
        this.subscriptions.delete(room);
        this.leaveRoom(room);
      }
    } else {
      // Remove all callbacks for room
      this.subscriptions.delete(room);
      this.leaveRoom(room);
    }
  }

  leaveRoom(room) {
    if (this.isConnected && this.socket) {
      this.socket.emit('leave_room', room);
      this.roomSubscriptions.delete(room);
      console.log(`🚪 Left ${room} room`);
    }
  }

  // Notify all subscribers for a room
  notifySubscribers(room, data) {
    if (this.subscriptions.has(room)) {
      this.subscriptions.get(room).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${room} subscription callback:`, error);
        }
      });
    }
  }

  // Resubscribe to all rooms after reconnection
  resubscribeAll() {
    if (!this.isConnected || !this.socket) return;

    this.roomSubscriptions.forEach(room => {
      this.socket.emit('join_room', room);
      console.log(`🔄 Resubscribed to ${room}`);
    });
  }

  // Send message to server
  emit(event, data) {
    if (!this.isConnected || !this.socket) {
      console.warn(`Cannot emit ${event}: WebSocket not connected`);
      return false;
    }

    try {
      this.socket.emit(event, data);
      return true;
    } catch (error) {
      console.error(`Error emitting ${event}:`, error);
      return false;
    }
  }

  // Send message with acknowledgment
  emitWithAck(event, data, timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.socket) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const timer = setTimeout(() => {
        reject(new Error(`Acknowledgment timeout for ${event}`));
      }, timeout);

      try {
        this.socket.emit(event, data, (response) => {
          clearTimeout(timer);
          resolve(response);
        });
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  // Connection status management
  notifyConnectionStatus(status, reason = null) {
    this.notifyListeners('connect', { status, reason });
    this.updateUIConnectionStatus(status, reason);
  }

  updateUIConnectionStatus(status, reason) {
    const statusElement = document.getElementById('system-status');
    if (!statusElement) return;

    const statusConfig = {
      connected: {
        icon: 'activity',
        text: 'Real-time Connected',
        class: 'text-gaming-accent',
        bgClass: 'status-online'
      },
      disconnected: {
        icon: 'wifi-off',
        text: 'Connection Lost',
        class: 'text-gaming-yellow',
        bgClass: 'status-warning'
      },
      reconnected: {
        icon: 'activity',
        text: 'Connection Restored',
        class: 'text-gaming-accent',
        bgClass: 'status-online'
      },
      failed: {
        icon: 'alert-circle',
        text: 'Offline Mode',
        class: 'text-gaming-red',
        bgClass: 'status-error'
      }
    };

    const config = statusConfig[status] || statusConfig.disconnected;
    
    // Update status indicator
    const statusIcon = statusElement.querySelector('i[data-lucide]');
    const statusText = statusElement.querySelector('span');
    
    if (statusIcon && statusText) {
      statusIcon.setAttribute('data-lucide', config.icon);
      statusText.textContent = config.text;
      statusText.className = `text-sm font-medium ${config.class}`;
      
      // Update status container class
      statusElement.className = `flex items-center space-x-2 ${config.bgClass}`;
      
      // Re-initialize lucide icons
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }
  }

  showConnectionStatus(message) {
    if (this.errorHandler) {
      this.errorHandler.createNotification({
        type: 'info',
        title: '🔌 Connection Status',
        message: message,
        icon: '🎮',
        duration: 3000
      });
    }
  }

  showGameNotification(data) {
    if (this.errorHandler) {
      this.errorHandler.createNotification({
        type: data.type || 'info',
        title: data.title || '🎮 Game Update',
        message: data.message || 'New update available',
        icon: data.icon || '📢',
        duration: data.duration || 5000
      });
    }
  }

  // Connection quality monitoring
  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.socket) {
        const start = Date.now();
        this.socket.emit('ping', start);
      }
    }, 30000); // Ping every 30 seconds
  }

  updateConnectionQuality(latency) {
    let quality = 'excellent';
    let color = 'text-gaming-accent';

    if (latency > 500) {
      quality = 'poor';
      color = 'text-gaming-red';
    } else if (latency > 200) {
      quality = 'fair';
      color = 'text-gaming-yellow';
    } else if (latency > 100) {
      quality = 'good';
      color = 'text-gaming-blue';
    }

    // Update UI if quality indicator exists
    const qualityElement = document.getElementById('connection-quality');
    if (qualityElement) {
      qualityElement.textContent = `${latency}ms`;
      qualityElement.className = `text-xs ${color}`;
      qualityElement.title = `Connection quality: ${quality}`;
    }
  }

  // Error handling
  handleConnectionError(error) {
    this.connectionAttempts++;
    
    if (this.errorHandler) {
      this.errorHandler.handleError(error, {
        type: 'websocket',
        operation: 'connect',
        attempts: this.connectionAttempts
      });
    }

    // Show user-friendly error message
    if (this.connectionAttempts === 1) {
      this.showConnectionStatus('Connection lost. Attempting to reconnect...');
    } else if (this.connectionAttempts >= this.maxReconnectAttempts) {
      this.showConnectionStatus('Unable to connect. Switching to offline mode.');
    }
  }

  scheduleReconnect() {
    if (this.connectionAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.initPollingFallback();
      return;
    }

    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.connectionAttempts), this.maxReconnectDelay);
    console.log(`⏰ Scheduling reconnect in ${delay}ms`);
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.connectionAttempts++;
        this.connect().catch(() => {
          this.scheduleReconnect();
        });
      }
    }, delay);
  }

  // Fallback to polling when WebSocket fails
  initPollingFallback() {
    console.log('🔄 Initializing polling fallback mode');
    
    // Use existing MLGApiClient periodic refresh as fallback
    if (window.MLGApiClient) {
      this.fallbackMode = true;
      this.showConnectionStatus('Using polling mode - some features may be limited');
      
      // Simulate real-time updates with polling
      this.fallbackInterval = setInterval(() => {
        this.pollForUpdates();
      }, 10000); // Poll every 10 seconds
    }
  }

  async pollForUpdates() {
    if (!window.MLGApiClient || this.isConnected) return;

    try {
      // Poll for updates on subscribed rooms
      this.roomSubscriptions.forEach(async (room) => {
        try {
          let data = null;
          
          switch (room) {
            case 'voting':
              data = await window.MLGApiClient.getActiveVotes();
              break;
            case 'clans':
              data = await window.MLGApiClient.getClans();
              break;
            case 'content':
              data = await window.MLGApiClient.getContent();
              break;
            case 'profile':
              data = await window.MLGApiClient.getUserProfile();
              break;
            case 'system':
              data = await window.MLGApiClient.getSystemStatus();
              break;
          }
          
          if (data) {
            this.notifySubscribers(room, { success: true, data, fallback: true });
          }
        } catch (error) {
          console.warn(`Polling failed for ${room}:`, error);
        }
      });
    } catch (error) {
      console.error('Polling update failed:', error);
    }
  }

  // Event listeners
  addEventListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].add(callback);
      return () => this.listeners[event].delete(callback);
    }
  }

  notifyListeners(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  // Public API methods
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      connectionAttempts: this.connectionAttempts,
      roomSubscriptions: Array.from(this.roomSubscriptions),
      subscriptionCount: this.subscriptions.size,
      fallbackMode: this.fallbackMode || false
    };
  }

  getSubscriptions() {
    const subs = {};
    this.subscriptions.forEach((callbacks, room) => {
      subs[room] = callbacks.size;
    });
    return subs;
  }

  // Cleanup
  destroy() {
    console.log('🧹 Destroying WebSocket manager...');
    
    // Clear intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval);
    }
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }

    // Clear subscriptions
    this.subscriptions.clear();
    this.roomSubscriptions.clear();

    // Close socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnected = false;
    console.log('✅ WebSocket manager destroyed');
  }
}

// Create global instance
window.MLGWebSocketManager = new MLGWebSocketManager();

// Export for ES6 modules
export default MLGWebSocketManager;
export { MLGWebSocketManager };