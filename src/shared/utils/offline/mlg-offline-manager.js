/**
 * MLG.clan Offline Manager
 * Handles offline detection, data synchronization, and graceful degradation
 * 
 * @author Claude Code - Frontend Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

class MLGOfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.offlineQueue = [];
    this.syncInProgress = false;
    this.listeners = new Set();
    this.offlineStorage = {};
    this.lastSyncTime = null;
    this.connectionQuality = 'unknown';
    this.offlineFeatures = new Set();
    
    // IndexedDB for offline storage
    this.dbName = 'MLGOfflineData';
    this.dbVersion = 1;
    this.db = null;
    
    // Configuration
    this.config = {
      maxOfflineActions: 100,
      syncInterval: 30000, // 30 seconds
      connectionTimeout: 5000,
      retryAttempts: 3,
      backgroundSyncEnabled: true
    };

    // Gaming-themed offline features
    this.offlineGameModes = {
      'browse_clans': {
        name: '🏰 Offline Clan Browser',
        description: 'Browse cached clan data while offline',
        enabled: true
      },
      'view_profile': {
        name: '👤 Profile Viewer',
        description: 'View your cached gaming profile',
        enabled: true
      },
      'leaderboards': {
        name: '🏆 Cached Leaderboards',
        description: 'View last known leaderboard standings',
        enabled: true
      },
      'content_draft': {
        name: '📝 Content Drafts',
        description: 'Create content drafts offline',
        enabled: true
      },
      'vote_queue': {
        name: '🗳️ Vote Queue',
        description: 'Queue votes for when connection returns',
        enabled: true
      }
    };

    this.init();
  }

  async init() {
    try {
      await this.initIndexedDB();
      this.setupEventListeners();
      this.startConnectionMonitoring();
      this.loadOfflineData();
      
      // Register service worker for background sync
      if ('serviceWorker' in navigator && this.config.backgroundSyncEnabled) {
        await this.registerServiceWorker();
      }
      
      console.log('🎮 MLG Offline Manager initialized');
      
      // Notify initial state
      this.notifyConnectionChange(this.isOnline);
      
    } catch (error) {
      console.error('Failed to initialize offline manager:', error);
    }
  }

  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('userData')) {
          db.createObjectStore('userData', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('clanData')) {
          db.createObjectStore('clanData', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('contentData')) {
          db.createObjectStore('contentData', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('voteData')) {
          db.createObjectStore('voteData', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('leaderboardData')) {
          db.createObjectStore('leaderboardData', { keyPath: 'type' });
        }
        
        if (!db.objectStoreNames.contains('offlineQueue')) {
          const queueStore = db.createObjectStore('offlineQueue', { keyPath: 'id', autoIncrement: true });
          queueStore.createIndex('timestamp', 'timestamp');
          queueStore.createIndex('priority', 'priority');
        }
      };
    });
  }

  setupEventListeners() {
    // Basic online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Advanced connection monitoring
    if (navigator.connection) {
      navigator.connection.addEventListener('change', () => {
        this.assessConnectionQuality();
      });
    }
    
    // Page visibility for sync optimization
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.scheduleSync();
      }
    });
    
    // Storage events for cross-tab sync
    window.addEventListener('storage', (e) => {
      if (e.key === 'mlg_offline_sync') {
        this.handleCrossTabSync(e.newValue);
      }
    });
  }

  async handleOnline() {
    console.log('🌐 Connection restored - Back online!');
    this.isOnline = true;
    this.assessConnectionQuality();
    
    // Show recovery notification
    if (window.MLGErrorHandler) {
      window.MLGErrorHandler.createNotification({
        type: 'success',
        title: '🎮 Connection Restored!',
        message: 'Syncing your offline progress...',
        icon: '🌐'
      });
    }
    
    // Start sync process
    await this.syncOfflineData();
    this.notifyConnectionChange(true);
  }

  async handleOffline() {
    console.log('📴 Connection lost - Switching to offline mode');
    this.isOnline = false;
    this.connectionQuality = 'offline';
    
    // Show offline notification with available features
    if (window.MLGErrorHandler) {
      const availableFeatures = Object.values(this.offlineGameModes)
        .filter(mode => mode.enabled)
        .map(mode => mode.name)
        .join(', ');
        
      window.MLGErrorHandler.createNotification({
        type: 'info',
        title: '📴 Offline Mode Activated',
        message: `Available features: ${availableFeatures}`,
        icon: '🎮',
        duration: 6000
      });
    }
    
    this.notifyConnectionChange(false);
  }

  startConnectionMonitoring() {
    setInterval(() => {
      this.pingConnection();
    }, this.config.syncInterval);
  }

  async pingConnection() {
    if (!this.isOnline) return;
    
    try {
      const start = Date.now();
      const response = await fetch('/api/system/ping', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      const latency = Date.now() - start;
      this.updateConnectionMetrics(response.ok, latency);
      
    } catch (error) {
      this.updateConnectionMetrics(false, null);
    }
  }

  updateConnectionMetrics(success, latency) {
    if (!success) {
      this.connectionQuality = 'poor';
      return;
    }
    
    if (latency < 100) this.connectionQuality = 'excellent';
    else if (latency < 300) this.connectionQuality = 'good';
    else if (latency < 1000) this.connectionQuality = 'fair';
    else this.connectionQuality = 'poor';
  }

  assessConnectionQuality() {
    if (!navigator.connection) return;
    
    const { effectiveType, downlink, rtt } = navigator.connection;
    
    if (effectiveType === '4g' && downlink > 10 && rtt < 100) {
      this.connectionQuality = 'excellent';
    } else if (effectiveType === '4g' && downlink > 5) {
      this.connectionQuality = 'good';
    } else if (effectiveType === '3g' || effectiveType === '2g') {
      this.connectionQuality = 'fair';
    } else {
      this.connectionQuality = 'poor';
    }
    
    this.notifyConnectionQualityChange(this.connectionQuality);
  }

  // Offline data management
  async saveOfflineData(storeName, data, key = null) {
    if (!this.db) return false;
    
    try {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const dataToSave = {
        ...data,
        id: key || data.id || Date.now().toString(),
        lastModified: new Date().toISOString(),
        synced: false
      };
      
      await this.promisifyRequest(store.put(dataToSave));
      console.log(`💾 Saved offline data to ${storeName}:`, dataToSave.id);
      
      return true;
    } catch (error) {
      console.error('Failed to save offline data:', error);
      return false;
    }
  }

  async loadOfflineData(storeName = null) {
    if (!this.db) return null;
    
    try {
      const stores = storeName ? [storeName] : ['userData', 'clanData', 'contentData', 'voteData', 'leaderboardData'];
      const result = {};
      
      for (const store of stores) {
        const transaction = this.db.transaction([store], 'readonly');
        const objectStore = transaction.objectStore(store);
        const data = await this.promisifyRequest(objectStore.getAll());
        result[store] = data;
      }
      
      console.log('📂 Loaded offline data:', result);
      return storeName ? result[storeName] : result;
      
    } catch (error) {
      console.error('Failed to load offline data:', error);
      return null;
    }
  }

  async deleteOfflineData(storeName, key) {
    if (!this.db) return false;
    
    try {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await this.promisifyRequest(store.delete(key));
      
      console.log(`🗑️ Deleted offline data from ${storeName}:`, key);
      return true;
    } catch (error) {
      console.error('Failed to delete offline data:', error);
      return false;
    }
  }

  // Offline queue management
  async queueOfflineAction(action) {
    if (!this.db) return false;
    
    const queueItem = {
      action: action.type,
      data: action.data,
      url: action.url,
      method: action.method || 'POST',
      timestamp: new Date().toISOString(),
      priority: action.priority || 'normal',
      retries: 0,
      maxRetries: this.config.retryAttempts
    };
    
    try {
      const transaction = this.db.transaction(['offlineQueue'], 'readwrite');
      const store = transaction.objectStore('offlineQueue');
      const id = await this.promisifyRequest(store.add(queueItem));
      
      console.log('📝 Queued offline action:', queueItem.action, id);
      
      // Show user feedback
      if (window.MLGErrorHandler) {
        window.MLGErrorHandler.createNotification({
          type: 'info',
          title: '📋 Action Queued',
          message: `${action.type} will sync when connection returns`,
          icon: '⏳'
        });
      }
      
      return id;
    } catch (error) {
      console.error('Failed to queue offline action:', error);
      return false;
    }
  }

  async syncOfflineData() {
    if (this.syncInProgress || !this.isOnline) return;
    
    this.syncInProgress = true;
    console.log('🔄 Starting offline data sync...');
    
    try {
      // Get queued actions
      const queuedActions = await this.getQueuedActions();
      const results = {
        successful: 0,
        failed: 0,
        errors: []
      };
      
      for (const item of queuedActions) {
        try {
          await this.executeQueuedAction(item);
          await this.removeFromQueue(item.id);
          results.successful++;
          
        } catch (error) {
          results.failed++;
          results.errors.push({ action: item.action, error: error.message });
          
          // Update retry count
          item.retries++;
          if (item.retries >= item.maxRetries) {
            await this.removeFromQueue(item.id);
            console.warn('Max retries exceeded for action:', item.action);
          } else {
            await this.updateQueueItem(item);
          }
        }
      }
      
      this.lastSyncTime = new Date().toISOString();
      
      // Notify sync completion
      if (results.successful > 0 || results.failed > 0) {
        const message = results.failed === 0 
          ? `✅ Synced ${results.successful} actions successfully!`
          : `⚠️ Synced ${results.successful}, failed ${results.failed} actions`;
          
        if (window.MLGErrorHandler) {
          window.MLGErrorHandler.createNotification({
            type: results.failed === 0 ? 'success' : 'warning',
            title: '🔄 Sync Complete',
            message,
            icon: '📊'
          });
        }
      }
      
      console.log('✅ Offline sync completed:', results);
      
    } catch (error) {
      console.error('Sync failed:', error);
      
      if (window.MLGErrorHandler) {
        window.MLGErrorHandler.createNotification({
          type: 'error',
          title: '❌ Sync Failed',
          message: 'Will retry automatically when connection improves',
          icon: '🔄'
        });
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  async getQueuedActions() {
    if (!this.db) return [];
    
    try {
      const transaction = this.db.transaction(['offlineQueue'], 'readonly');
      const store = transaction.objectStore('offlineQueue');
      const index = store.index('priority');
      
      return await this.promisifyRequest(index.getAll());
    } catch (error) {
      console.error('Failed to get queued actions:', error);
      return [];
    }
  }

  async executeQueuedAction(item) {
    const { action, data, url, method } = item;
    
    // Use the API client if available
    if (window.MLGApiClient) {
      const apiClient = window.MLGApiClient;
      
      switch (method.toUpperCase()) {
        case 'GET':
          return await apiClient.get(url);
        case 'POST':
          return await apiClient.post(url, data);
        case 'PUT':
          return await apiClient.put(url, data);
        case 'PATCH':
          return await apiClient.patch(url, data);
        case 'DELETE':
          return await apiClient.delete(url);
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    }
    
    // Fallback to fetch
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : undefined
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  }

  async removeFromQueue(id) {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction(['offlineQueue'], 'readwrite');
      const store = transaction.objectStore('offlineQueue');
      await this.promisifyRequest(store.delete(id));
    } catch (error) {
      console.error('Failed to remove from queue:', error);
    }
  }

  async updateQueueItem(item) {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction(['offlineQueue'], 'readwrite');
      const store = transaction.objectStore('offlineQueue');
      await this.promisifyRequest(store.put(item));
    } catch (error) {
      console.error('Failed to update queue item:', error);
    }
  }

  // Service Worker integration
  async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('📱 Service Worker registered:', registration);
      
      // Listen for background sync events
      if ('sync' in registration) {
        await registration.sync.register('mlg-background-sync');
      }
      
    } catch (error) {
      console.warn('Service Worker registration failed:', error);
    }
  }

  // Graceful degradation features
  enableOfflineFeature(featureName) {
    if (this.offlineGameModes[featureName]) {
      this.offlineGameModes[featureName].enabled = true;
      this.offlineFeatures.add(featureName);
      console.log(`🎮 Enabled offline feature: ${featureName}`);
    }
  }

  disableOfflineFeature(featureName) {
    if (this.offlineGameModes[featureName]) {
      this.offlineGameModes[featureName].enabled = false;
      this.offlineFeatures.delete(featureName);
      console.log(`❌ Disabled offline feature: ${featureName}`);
    }
  }

  isFeatureAvailable(featureName) {
    const feature = this.offlineGameModes[featureName];
    return feature && feature.enabled && (!this.isOnline || this.connectionQuality !== 'poor');
  }

  getAvailableFeatures() {
    return Object.entries(this.offlineGameModes)
      .filter(([_, feature]) => feature.enabled)
      .map(([key, feature]) => ({
        key,
        name: feature.name,
        description: feature.description,
        available: this.isFeatureAvailable(key)
      }));
  }

  // Event system
  addEventListener(type, callback) {
    const listener = { type, callback };
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyConnectionChange(isOnline) {
    this.listeners.forEach(listener => {
      if (listener.type === 'connection') {
        listener.callback({ isOnline, quality: this.connectionQuality });
      }
    });
  }

  notifyConnectionQualityChange(quality) {
    this.listeners.forEach(listener => {
      if (listener.type === 'quality') {
        listener.callback(quality);
      }
    });
  }

  scheduleSync() {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    
    this.syncTimeout = setTimeout(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncOfflineData();
      }
    }, 1000);
  }

  handleCrossTabSync(data) {
    if (data) {
      const syncEvent = JSON.parse(data);
      if (syncEvent.type === 'sync_complete') {
        console.log('📨 Cross-tab sync notification received');
        // Refresh local data if needed
      }
    }
  }

  // Utility methods
  promisifyRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      connectionQuality: this.connectionQuality,
      lastSyncTime: this.lastSyncTime,
      queuedActions: this.offlineQueue.length,
      availableFeatures: this.getAvailableFeatures(),
      syncInProgress: this.syncInProgress
    };
  }

  clearOfflineData() {
    if (!this.db) return;
    
    const stores = ['userData', 'clanData', 'contentData', 'voteData', 'leaderboardData', 'offlineQueue'];
    
    stores.forEach(async (storeName) => {
      try {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        await this.promisifyRequest(store.clear());
        console.log(`🧹 Cleared offline data: ${storeName}`);
      } catch (error) {
        console.error(`Failed to clear ${storeName}:`, error);
      }
    });
    
    if (window.MLGErrorHandler) {
      window.MLGErrorHandler.createNotification({
        type: 'info',
        title: '🧹 Offline Data Cleared',
        message: 'Fresh start when you go online next!',
        icon: '♻️'
      });
    }
  }
}

// Create global instance
window.MLGOfflineManager = new MLGOfflineManager();

// Export for ES6 modules
export default MLGOfflineManager;
export { MLGOfflineManager };