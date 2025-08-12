/**
 * MLG.clan Offline Data Manager
 * Implements offline-first data strategies for gaming content
 */

class OfflineDataManager {
  constructor() {
    this.dbName = 'mlg-clan-offline';
    this.dbVersion = 1;
    this.db = null;
    this.syncQueue = [];
    this.maxOfflineStorage = 50 * 1024 * 1024; // 50MB
    
    this.init();
  }

  /**
   * Initialize offline data manager
   */
  async init() {
    try {
      await this.initDatabase();
      await this.setupSyncQueue();
      await this.cleanupOldData();
      
      console.log('[OfflineData] Manager initialized successfully');
    } catch (error) {
      console.error('[OfflineData] Manager initialization failed:', error);
    }
  }

  /**
   * Initialize IndexedDB database
   */
  async initDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('[OfflineData] Database opened successfully');
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        this.createObjectStores(db);
        
        console.log('[OfflineData] Database upgraded to version', this.dbVersion);
      };
    });
  }

  /**
   * Create IndexedDB object stores
   */
  createObjectStores(db) {
    // Gaming profiles store
    if (!db.objectStoreNames.contains('profiles')) {
      const profileStore = db.createObjectStore('profiles', { keyPath: 'id' });
      profileStore.createIndex('userId', 'userId', { unique: false });
      profileStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
    }

    // Clan data store
    if (!db.objectStoreNames.contains('clans')) {
      const clanStore = db.createObjectStore('clans', { keyPath: 'id' });
      clanStore.createIndex('memberId', 'members', { unique: false, multiEntry: true });
      clanStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
    }

    // Leaderboard data store
    if (!db.objectStoreNames.contains('leaderboards')) {
      const leaderboardStore = db.createObjectStore('leaderboards', { keyPath: 'id' });
      leaderboardStore.createIndex('category', 'category', { unique: false });
      leaderboardStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
    }

    // Content data store
    if (!db.objectStoreNames.contains('content')) {
      const contentStore = db.createObjectStore('content', { keyPath: 'id' });
      contentStore.createIndex('creatorId', 'creatorId', { unique: false });
      contentStore.createIndex('category', 'category', { unique: false });
      contentStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
    }

    // Tournament data store
    if (!db.objectStoreNames.contains('tournaments')) {
      const tournamentStore = db.createObjectStore('tournaments', { keyPath: 'id' });
      tournamentStore.createIndex('status', 'status', { unique: false });
      tournamentStore.createIndex('startDate', 'startDate', { unique: false });
      tournamentStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
    }

    // Voting data store
    if (!db.objectStoreNames.contains('votes')) {
      const voteStore = db.createObjectStore('votes', { keyPath: 'id' });
      voteStore.createIndex('proposalId', 'proposalId', { unique: false });
      voteStore.createIndex('voterId', 'voterId', { unique: false });
      voteStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
    }

    // Sync queue store
    if (!db.objectStoreNames.contains('syncQueue')) {
      const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      syncStore.createIndex('action', 'action', { unique: false });
      syncStore.createIndex('priority', 'priority', { unique: false });
      syncStore.createIndex('timestamp', 'timestamp', { unique: false });
    }

    // Assets cache store
    if (!db.objectStoreNames.contains('assets')) {
      const assetStore = db.createObjectStore('assets', { keyPath: 'url' });
      assetStore.createIndex('type', 'type', { unique: false });
      assetStore.createIndex('size', 'size', { unique: false });
      assetStore.createIndex('lastAccessed', 'lastAccessed', { unique: false });
    }
  }

  /**
   * Setup sync queue processing
   */
  async setupSyncQueue() {
    // Load existing sync queue
    this.syncQueue = await this.getAllFromStore('syncQueue');
    
    // Process queue when online
    if (navigator.onLine) {
      this.processSyncQueue();
    }
    
    // Listen for online events
    window.addEventListener('online', () => {
      this.processSyncQueue();
    });
  }

  /**
   * Store gaming profile data
   */
  async storeProfile(profileData) {
    try {
      const data = {
        ...profileData,
        lastUpdated: Date.now(),
        offline: true
      };
      
      await this.putToStore('profiles', data);
      console.log('[OfflineData] Profile stored:', profileData.id);
      
      return data;
    } catch (error) {
      console.error('[OfflineData] Failed to store profile:', error);
      throw error;
    }
  }

  /**
   * Get gaming profile data
   */
  async getProfile(profileId) {
    try {
      const profile = await this.getFromStore('profiles', profileId);
      
      if (profile) {
        // Update last accessed
        profile.lastAccessed = Date.now();
        await this.putToStore('profiles', profile);
      }
      
      return profile;
    } catch (error) {
      console.error('[OfflineData] Failed to get profile:', error);
      return null;
    }
  }

  /**
   * Store clan data
   */
  async storeClan(clanData) {
    try {
      const data = {
        ...clanData,
        lastUpdated: Date.now(),
        offline: true
      };
      
      await this.putToStore('clans', data);
      console.log('[OfflineData] Clan stored:', clanData.id);
      
      return data;
    } catch (error) {
      console.error('[OfflineData] Failed to store clan:', error);
      throw error;
    }
  }

  /**
   * Get clan data
   */
  async getClan(clanId) {
    try {
      return await this.getFromStore('clans', clanId);
    } catch (error) {
      console.error('[OfflineData] Failed to get clan:', error);
      return null;
    }
  }

  /**
   * Get user's clans
   */
  async getUserClans(userId) {
    try {
      const allClans = await this.getAllFromStore('clans');
      return allClans.filter(clan => 
        clan.members && clan.members.some(member => member.id === userId)
      );
    } catch (error) {
      console.error('[OfflineData] Failed to get user clans:', error);
      return [];
    }
  }

  /**
   * Store leaderboard data
   */
  async storeLeaderboard(leaderboardData) {
    try {
      const data = {
        ...leaderboardData,
        lastUpdated: Date.now(),
        offline: true
      };
      
      await this.putToStore('leaderboards', data);
      console.log('[OfflineData] Leaderboard stored:', leaderboardData.id);
      
      return data;
    } catch (error) {
      console.error('[OfflineData] Failed to store leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard data
   */
  async getLeaderboard(leaderboardId) {
    try {
      return await this.getFromStore('leaderboards', leaderboardId);
    } catch (error) {
      console.error('[OfflineData] Failed to get leaderboard:', error);
      return null;
    }
  }

  /**
   * Get leaderboards by category
   */
  async getLeaderboardsByCategory(category) {
    try {
      return await this.getFromIndex('leaderboards', 'category', category);
    } catch (error) {
      console.error('[OfflineData] Failed to get leaderboards by category:', error);
      return [];
    }
  }

  /**
   * Store content data
   */
  async storeContent(contentData) {
    try {
      const data = {
        ...contentData,
        lastUpdated: Date.now(),
        offline: true
      };
      
      await this.putToStore('content', data);
      console.log('[OfflineData] Content stored:', contentData.id);
      
      return data;
    } catch (error) {
      console.error('[OfflineData] Failed to store content:', error);
      throw error;
    }
  }

  /**
   * Get content data
   */
  async getContent(contentId) {
    try {
      return await this.getFromStore('content', contentId);
    } catch (error) {
      console.error('[OfflineData] Failed to get content:', error);
      return null;
    }
  }

  /**
   * Get content by creator
   */
  async getContentByCreator(creatorId) {
    try {
      return await this.getFromIndex('content', 'creatorId', creatorId);
    } catch (error) {
      console.error('[OfflineData] Failed to get content by creator:', error);
      return [];
    }
  }

  /**
   * Store tournament data
   */
  async storeTournament(tournamentData) {
    try {
      const data = {
        ...tournamentData,
        lastUpdated: Date.now(),
        offline: true
      };
      
      await this.putToStore('tournaments', data);
      console.log('[OfflineData] Tournament stored:', tournamentData.id);
      
      return data;
    } catch (error) {
      console.error('[OfflineData] Failed to store tournament:', error);
      throw error;
    }
  }

  /**
   * Get tournament data
   */
  async getTournament(tournamentId) {
    try {
      return await this.getFromStore('tournaments', tournamentId);
    } catch (error) {
      console.error('[OfflineData] Failed to get tournament:', error);
      return null;
    }
  }

  /**
   * Get active tournaments
   */
  async getActiveTournaments() {
    try {
      const activeTournaments = await this.getFromIndex('tournaments', 'status', 'active');
      const upcomingTournaments = await this.getFromIndex('tournaments', 'status', 'upcoming');
      
      return [...activeTournaments, ...upcomingTournaments].sort(
        (a, b) => new Date(a.startDate) - new Date(b.startDate)
      );
    } catch (error) {
      console.error('[OfflineData] Failed to get active tournaments:', error);
      return [];
    }
  }

  /**
   * Store vote data
   */
  async storeVote(voteData) {
    try {
      const data = {
        ...voteData,
        lastUpdated: Date.now(),
        offline: true,
        synced: false
      };
      
      await this.putToStore('votes', data);
      console.log('[OfflineData] Vote stored:', voteData.id);
      
      // Add to sync queue
      await this.addToSyncQueue('vote', data, 'high');
      
      return data;
    } catch (error) {
      console.error('[OfflineData] Failed to store vote:', error);
      throw error;
    }
  }

  /**
   * Get vote data
   */
  async getVote(voteId) {
    try {
      return await this.getFromStore('votes', voteId);
    } catch (error) {
      console.error('[OfflineData] Failed to get vote:', error);
      return null;
    }
  }

  /**
   * Get votes by proposal
   */
  async getVotesByProposal(proposalId) {
    try {
      return await this.getFromIndex('votes', 'proposalId', proposalId);
    } catch (error) {
      console.error('[OfflineData] Failed to get votes by proposal:', error);
      return [];
    }
  }

  /**
   * Store asset data
   */
  async storeAsset(url, data, type = 'unknown') {
    try {
      const assetData = {
        url,
        data,
        type,
        size: this.calculateDataSize(data),
        lastAccessed: Date.now(),
        stored: Date.now()
      };
      
      // Check storage limits
      const totalSize = await this.getTotalStorageSize();
      if (totalSize + assetData.size > this.maxOfflineStorage) {
        await this.cleanupAssets();
      }
      
      await this.putToStore('assets', assetData);
      console.log('[OfflineData] Asset stored:', url);
      
      return assetData;
    } catch (error) {
      console.error('[OfflineData] Failed to store asset:', error);
      throw error;
    }
  }

  /**
   * Get asset data
   */
  async getAsset(url) {
    try {
      const asset = await this.getFromStore('assets', url);
      
      if (asset) {
        // Update last accessed
        asset.lastAccessed = Date.now();
        await this.putToStore('assets', asset);
      }
      
      return asset;
    } catch (error) {
      console.error('[OfflineData] Failed to get asset:', error);
      return null;
    }
  }

  /**
   * Add item to sync queue
   */
  async addToSyncQueue(action, data, priority = 'normal') {
    try {
      const syncItem = {
        action,
        data,
        priority,
        timestamp: Date.now(),
        attempts: 0,
        maxAttempts: 3
      };
      
      await this.putToStore('syncQueue', syncItem);
      this.syncQueue.push(syncItem);
      
      console.log('[OfflineData] Added to sync queue:', action);
      
      // Try immediate sync if online
      if (navigator.onLine) {
        setTimeout(() => this.processSyncQueue(), 1000);
      }
      
      return syncItem;
    } catch (error) {
      console.error('[OfflineData] Failed to add to sync queue:', error);
      throw error;
    }
  }

  /**
   * Process sync queue
   */
  async processSyncQueue() {
    if (!navigator.onLine || this.syncQueue.length === 0) {
      return;
    }
    
    console.log('[OfflineData] Processing sync queue:', this.syncQueue.length, 'items');
    
    // Sort by priority and timestamp
    const sortedQueue = this.syncQueue.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff === 0) {
        return a.timestamp - b.timestamp;
      }
      
      return priorityDiff;
    });
    
    for (const item of sortedQueue) {
      try {
        await this.syncItem(item);
        
        // Remove from queue on successful sync
        await this.removeFromSyncQueue(item.id);
        this.syncQueue = this.syncQueue.filter(q => q.id !== item.id);
        
        console.log('[OfflineData] Synced item:', item.action);
        
      } catch (error) {
        console.error('[OfflineData] Failed to sync item:', error);
        
        // Increment attempts
        item.attempts = (item.attempts || 0) + 1;
        
        if (item.attempts >= item.maxAttempts) {
          // Remove failed items after max attempts
          await this.removeFromSyncQueue(item.id);
          this.syncQueue = this.syncQueue.filter(q => q.id !== item.id);
          
          console.warn('[OfflineData] Removed failed sync item:', item.action);
        } else {
          // Update attempts count
          await this.putToStore('syncQueue', item);
        }
      }
    }
  }

  /**
   * Sync individual item
   */
  async syncItem(item) {
    const { action, data } = item;
    
    switch (action) {
      case 'vote':
        await this.syncVote(data);
        break;
      case 'profile_update':
        await this.syncProfile(data);
        break;
      case 'clan_join':
        await this.syncClanJoin(data);
        break;
      case 'content_create':
        await this.syncContentCreate(data);
        break;
      default:
        throw new Error(`Unknown sync action: ${action}`);
    }
  }

  /**
   * Sync vote data
   */
  async syncVote(voteData) {
    const response = await fetch('/api/voting/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voteData)
    });
    
    if (!response.ok) {
      throw new Error(`Vote sync failed: ${response.status}`);
    }
    
    // Mark as synced
    voteData.synced = true;
    voteData.syncedAt = Date.now();
    await this.putToStore('votes', voteData);
  }

  /**
   * Sync profile data
   */
  async syncProfile(profileData) {
    const response = await fetch(`/api/profiles/${profileData.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    
    if (!response.ok) {
      throw new Error(`Profile sync failed: ${response.status}`);
    }
  }

  /**
   * Sync clan join
   */
  async syncClanJoin(joinData) {
    const response = await fetch('/api/clans/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(joinData)
    });
    
    if (!response.ok) {
      throw new Error(`Clan join sync failed: ${response.status}`);
    }
  }

  /**
   * Sync content creation
   */
  async syncContentCreate(contentData) {
    const response = await fetch('/api/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contentData)
    });
    
    if (!response.ok) {
      throw new Error(`Content sync failed: ${response.status}`);
    }
  }

  /**
   * Remove item from sync queue
   */
  async removeFromSyncQueue(itemId) {
    try {
      await this.deleteFromStore('syncQueue', itemId);
    } catch (error) {
      console.error('[OfflineData] Failed to remove from sync queue:', error);
    }
  }

  /**
   * Get total storage size
   */
  async getTotalStorageSize() {
    try {
      const assets = await this.getAllFromStore('assets');
      return assets.reduce((total, asset) => total + (asset.size || 0), 0);
    } catch (error) {
      console.error('[OfflineData] Failed to get total storage size:', error);
      return 0;
    }
  }

  /**
   * Cleanup old assets
   */
  async cleanupAssets() {
    try {
      const assets = await this.getAllFromStore('assets');
      
      // Sort by last accessed (oldest first)
      const sortedAssets = assets.sort((a, b) => a.lastAccessed - b.lastAccessed);
      
      // Remove oldest 20% of assets
      const toRemove = Math.floor(sortedAssets.length * 0.2);
      
      for (let i = 0; i < toRemove; i++) {
        await this.deleteFromStore('assets', sortedAssets[i].url);
      }
      
      console.log('[OfflineData] Cleaned up', toRemove, 'assets');
    } catch (error) {
      console.error('[OfflineData] Asset cleanup failed:', error);
    }
  }

  /**
   * Cleanup old data
   */
  async cleanupOldData() {
    try {
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      const cutoffTime = Date.now() - maxAge;
      
      const stores = ['profiles', 'clans', 'leaderboards', 'content', 'tournaments'];
      
      for (const storeName of stores) {
        const allData = await this.getAllFromStore(storeName);
        
        for (const item of allData) {
          if (item.lastUpdated && item.lastUpdated < cutoffTime) {
            await this.deleteFromStore(storeName, item.id);
          }
        }
      }
      
      console.log('[OfflineData] Old data cleanup completed');
    } catch (error) {
      console.error('[OfflineData] Data cleanup failed:', error);
    }
  }

  /**
   * Calculate data size
   */
  calculateDataSize(data) {
    return new Blob([JSON.stringify(data)]).size;
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats() {
    try {
      const stores = ['profiles', 'clans', 'leaderboards', 'content', 'tournaments', 'votes', 'assets'];
      const stats = {};
      
      for (const storeName of stores) {
        const data = await this.getAllFromStore(storeName);
        stats[storeName] = {
          count: data.length,
          size: data.reduce((total, item) => total + this.calculateDataSize(item), 0)
        };
      }
      
      stats.syncQueue = this.syncQueue.length;
      stats.totalSize = Object.values(stats).reduce((total, store) => total + (store.size || 0), 0);
      stats.maxSize = this.maxOfflineStorage;
      stats.usagePercent = Math.round((stats.totalSize / stats.maxSize) * 100);
      
      return stats;
    } catch (error) {
      console.error('[OfflineData] Failed to get storage stats:', error);
      return {};
    }
  }

  // === IndexedDB Helper Methods ===

  /**
   * Put data to store
   */
  putToStore(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get data from store
   */
  getFromStore(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all data from store
   */
  getAllFromStore(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get data from index
   */
  getFromIndex(storeName, indexName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete data from store
   */
  deleteFromStore(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear entire store
   */
  clearStore(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Initialize global offline data manager
window.offlineDataManager = new OfflineDataManager();

export { OfflineDataManager };
export default OfflineDataManager;