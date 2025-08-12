/**
 * Browser Cache Optimization and Storage Management
 * Implements client-side caching strategies, storage optimization,
 * and cache management for optimal browser performance
 */

/**
 * Browser storage quotas and limits (approximate values)
 */
export const STORAGE_LIMITS = {
  // localStorage: ~5-10MB per origin
  localStorage: {
    maxSize: 5 * 1024 * 1024, // 5MB
    warningThreshold: 4 * 1024 * 1024 // 4MB
  },
  
  // sessionStorage: ~5-10MB per origin
  sessionStorage: {
    maxSize: 5 * 1024 * 1024,
    warningThreshold: 4 * 1024 * 1024
  },
  
  // IndexedDB: ~50MB-250MB+ per origin
  indexedDB: {
    maxSize: 50 * 1024 * 1024, // 50MB conservative estimate
    warningThreshold: 40 * 1024 * 1024
  },
  
  // Cache API: Limited by overall storage quota
  cacheAPI: {
    maxSize: 100 * 1024 * 1024, // 100MB
    warningThreshold: 80 * 1024 * 1024
  }
};

/**
 * Cache priorities for different content types
 */
export const CACHE_PRIORITIES = {
  CRITICAL: 1,    // Core app functionality
  HIGH: 2,        // Important features
  MEDIUM: 3,      // Nice-to-have content
  LOW: 4          // Optional resources
};

/**
 * Browser Cache Manager
 * Manages client-side caching strategies and storage optimization
 */
export class BrowserCacheManager {
  constructor(options = {}) {
    this.options = {
      enableLocalStorage: true,
      enableSessionStorage: true,
      enableIndexedDB: true,
      enableCacheAPI: true,
      maxCacheSize: STORAGE_LIMITS.cacheAPI.maxSize,
      cleanupThreshold: 0.8, // Cleanup when 80% full
      compressionEnabled: true,
      encryptionEnabled: false,
      enableMetrics: true,
      ...options
    };
    
    this.storageMetrics = {
      localStorage: { used: 0, available: 0 },
      sessionStorage: { used: 0, available: 0 },
      indexedDB: { used: 0, available: 0 },
      cacheAPI: { used: 0, available: 0 }
    };
    
    this.compressionWorker = null;
    this.dbConnection = null;
    this.cacheNamespace = options.namespace || 'mlg-cache';
    
    this.init();
  }

  /**
   * Initialize browser cache manager
   */
  async init() {
    try {
      // Check browser support
      this.checkBrowserSupport();
      
      // Initialize storage systems
      if (this.options.enableIndexedDB) {
        await this.initIndexedDB();
      }
      
      if (this.options.enableCacheAPI) {
        await this.initCacheAPI();
      }
      
      // Initialize compression worker if enabled
      if (this.options.compressionEnabled) {
        this.initCompressionWorker();
      }
      
      // Update storage metrics
      await this.updateStorageMetrics();
      
      // Set up cleanup intervals
      this.setupCleanupTasks();
      
      console.log('[BrowserCache] Initialization complete');
    } catch (error) {
      console.error('[BrowserCache] Initialization failed:', error);
    }
  }

  /**
   * Check browser support for storage APIs
   */
  checkBrowserSupport() {
    this.support = {
      localStorage: typeof Storage !== 'undefined' && window.localStorage,
      sessionStorage: typeof Storage !== 'undefined' && window.sessionStorage,
      indexedDB: 'indexedDB' in window,
      cacheAPI: 'caches' in window,
      serviceWorker: 'serviceWorker' in navigator,
      webWorkers: typeof Worker !== 'undefined',
      compressionStreams: 'CompressionStream' in window
    };
    
    console.log('[BrowserCache] Browser support:', this.support);
  }

  /**
   * Initialize IndexedDB for structured data storage
   */
  async initIndexedDB() {
    if (!this.support.indexedDB) {
      console.warn('[BrowserCache] IndexedDB not supported');
      return;
    }
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(`${this.cacheNamespace}-db`, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.dbConnection = request.result;
        resolve(this.dbConnection);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('assets')) {
          const assetStore = db.createObjectStore('assets', { keyPath: 'key' });
          assetStore.createIndex('timestamp', 'timestamp');
          assetStore.createIndex('priority', 'priority');
          assetStore.createIndex('size', 'size');
        }
        
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
        
        if (!db.objectStoreNames.contains('analytics')) {
          const analyticsStore = db.createObjectStore('analytics', { keyPath: 'id', autoIncrement: true });
          analyticsStore.createIndex('timestamp', 'timestamp');
          analyticsStore.createIndex('type', 'type');
        }
      };
    });
  }

  /**
   * Initialize Cache API for network request caching
   */
  async initCacheAPI() {
    if (!this.support.cacheAPI) {
      console.warn('[BrowserCache] Cache API not supported');
      return;
    }
    
    try {
      // Open caches for different content types
      this.caches = {
        static: await caches.open(`${this.cacheNamespace}-static-v1`),
        dynamic: await caches.open(`${this.cacheNamespace}-dynamic-v1`),
        api: await caches.open(`${this.cacheNamespace}-api-v1`),
        gaming: await caches.open(`${this.cacheNamespace}-gaming-v1`)
      };
      
      console.log('[BrowserCache] Cache API initialized');
    } catch (error) {
      console.error('[BrowserCache] Failed to initialize Cache API:', error);
    }
  }

  /**
   * Initialize compression worker for large data
   */
  initCompressionWorker() {
    if (!this.support.webWorkers) {
      console.warn('[BrowserCache] Web Workers not supported');
      return;
    }
    
    try {
      const workerCode = `
        self.addEventListener('message', async function(e) {
          const { action, data, id } = e.data;
          
          try {
            if (action === 'compress') {
              const compressed = await compress(data);
              self.postMessage({ id, result: compressed });
            } else if (action === 'decompress') {
              const decompressed = await decompress(data);
              self.postMessage({ id, result: decompressed });
            }
          } catch (error) {
            self.postMessage({ id, error: error.message });
          }
        });
        
        async function compress(text) {
          if ('CompressionStream' in self) {
            const stream = new CompressionStream('gzip');
            const writer = stream.writable.getWriter();
            const reader = stream.readable.getReader();
            
            writer.write(new TextEncoder().encode(text));
            writer.close();
            
            const chunks = [];
            let done = false;
            
            while (!done) {
              const { value, done: readerDone } = await reader.read();
              done = readerDone;
              if (value) chunks.push(value);
            }
            
            return new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []));
          }
          
          // Fallback: simple base64 compression
          return btoa(text);
        }
        
        async function decompress(compressed) {
          if ('DecompressionStream' in self && compressed instanceof Uint8Array) {
            const stream = new DecompressionStream('gzip');
            const writer = stream.writable.getWriter();
            const reader = stream.readable.getReader();
            
            writer.write(compressed);
            writer.close();
            
            const chunks = [];
            let done = false;
            
            while (!done) {
              const { value, done: readerDone } = await reader.read();
              done = readerDone;
              if (value) chunks.push(value);
            }
            
            const combined = new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []));
            return new TextDecoder().decode(combined);
          }
          
          // Fallback: simple base64 decompression
          return atob(compressed);
        }
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.compressionWorker = new Worker(URL.createObjectURL(blob));
      
      console.log('[BrowserCache] Compression worker initialized');
    } catch (error) {
      console.error('[BrowserCache] Failed to initialize compression worker:', error);
    }
  }

  /**
   * Store data in appropriate storage system
   */
  async store(key, data, options = {}) {
    const {
      storageType = 'auto',
      priority = CACHE_PRIORITIES.MEDIUM,
      ttl = 3600000, // 1 hour default
      compress = false,
      encrypt = false
    } = options;
    
    try {
      let processedData = data;
      
      // Compression
      if (compress && this.options.compressionEnabled) {
        processedData = await this.compressData(processedData);
      }
      
      // Encryption (if enabled)
      if (encrypt && this.options.encryptionEnabled) {
        processedData = await this.encryptData(processedData);
      }
      
      // Determine storage type
      const selectedStorage = storageType === 'auto' 
        ? this.selectOptimalStorage(processedData, priority)
        : storageType;
      
      // Store data
      switch (selectedStorage) {
        case 'localStorage':
          return this.storeInLocalStorage(key, processedData, { ttl, priority });
        
        case 'sessionStorage':
          return this.storeInSessionStorage(key, processedData, { ttl, priority });
        
        case 'indexedDB':
          return this.storeInIndexedDB(key, processedData, { ttl, priority });
        
        case 'cacheAPI':
          return this.storeInCacheAPI(key, processedData, options);
        
        default:
          throw new Error(`Unsupported storage type: ${selectedStorage}`);
      }
    } catch (error) {
      console.error('[BrowserCache] Failed to store data:', error);
      throw error;
    }
  }

  /**
   * Retrieve data from storage
   */
  async retrieve(key, options = {}) {
    const { storageType = 'auto', decompress = false, decrypt = false } = options;
    
    try {
      let data;
      
      if (storageType === 'auto') {
        // Try different storage systems in priority order
        data = await this.retrieveFromLocalStorage(key) ||
               await this.retrieveFromSessionStorage(key) ||
               await this.retrieveFromIndexedDB(key) ||
               await this.retrieveFromCacheAPI(key);
      } else {
        // Use specific storage type
        switch (storageType) {
          case 'localStorage':
            data = await this.retrieveFromLocalStorage(key);
            break;
          case 'sessionStorage':
            data = await this.retrieveFromSessionStorage(key);
            break;
          case 'indexedDB':
            data = await this.retrieveFromIndexedDB(key);
            break;
          case 'cacheAPI':
            data = await this.retrieveFromCacheAPI(key);
            break;
          default:
            throw new Error(`Unsupported storage type: ${storageType}`);
        }
      }
      
      if (!data) return null;
      
      let processedData = data.value || data;
      
      // Decryption
      if (decrypt && this.options.encryptionEnabled) {
        processedData = await this.decryptData(processedData);
      }
      
      // Decompression
      if (decompress && this.options.compressionEnabled) {
        processedData = await this.decompressData(processedData);
      }
      
      return processedData;
    } catch (error) {
      console.error('[BrowserCache] Failed to retrieve data:', error);
      return null;
    }
  }

  /**
   * Select optimal storage based on data size and priority
   */
  selectOptimalStorage(data, priority) {
    const dataSize = this.estimateDataSize(data);
    
    // Critical data goes to IndexedDB for reliability
    if (priority === CACHE_PRIORITIES.CRITICAL) {
      return this.support.indexedDB ? 'indexedDB' : 'localStorage';
    }
    
    // Large data goes to IndexedDB or Cache API
    if (dataSize > 50000) { // 50KB
      return this.support.indexedDB ? 'indexedDB' : 'cacheAPI';
    }
    
    // Small, frequently accessed data goes to localStorage
    if (dataSize < 5000) { // 5KB
      return this.support.localStorage ? 'localStorage' : 'sessionStorage';
    }
    
    // Medium data goes to sessionStorage or IndexedDB
    return this.support.sessionStorage ? 'sessionStorage' : 'indexedDB';
  }

  /**
   * Estimate data size in bytes
   */
  estimateDataSize(data) {
    if (typeof data === 'string') {
      return new Blob([data]).size;
    } else if (data instanceof ArrayBuffer) {
      return data.byteLength;
    } else if (data instanceof Uint8Array) {
      return data.length;
    } else {
      return new Blob([JSON.stringify(data)]).size;
    }
  }

  /**
   * Store in localStorage with metadata
   */
  storeInLocalStorage(key, data, options) {
    if (!this.support.localStorage) {
      throw new Error('localStorage not supported');
    }
    
    const item = {
      value: data,
      timestamp: Date.now(),
      ttl: options.ttl,
      priority: options.priority,
      size: this.estimateDataSize(data)
    };
    
    try {
      localStorage.setItem(`${this.cacheNamespace}:${key}`, JSON.stringify(item));
      this.recordStorageMetric('localStorage', 'store', item.size);
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        this.handleStorageQuotaExceeded('localStorage');
        // Retry once after cleanup
        try {
          localStorage.setItem(`${this.cacheNamespace}:${key}`, JSON.stringify(item));
          return true;
        } catch (retryError) {
          throw new Error('localStorage quota exceeded even after cleanup');
        }
      }
      throw error;
    }
  }

  /**
   * Retrieve from localStorage
   */
  retrieveFromLocalStorage(key) {
    if (!this.support.localStorage) return null;
    
    try {
      const itemStr = localStorage.getItem(`${this.cacheNamespace}:${key}`);
      if (!itemStr) return null;
      
      const item = JSON.parse(itemStr);
      
      // Check TTL
      if (item.ttl && Date.now() - item.timestamp > item.ttl) {
        localStorage.removeItem(`${this.cacheNamespace}:${key}`);
        return null;
      }
      
      this.recordStorageMetric('localStorage', 'retrieve', item.size);
      return item.value;
    } catch (error) {
      console.warn('[BrowserCache] Failed to retrieve from localStorage:', error);
      return null;
    }
  }

  /**
   * Store in sessionStorage
   */
  storeInSessionStorage(key, data, options) {
    if (!this.support.sessionStorage) {
      throw new Error('sessionStorage not supported');
    }
    
    const item = {
      value: data,
      timestamp: Date.now(),
      ttl: options.ttl,
      priority: options.priority,
      size: this.estimateDataSize(data)
    };
    
    try {
      sessionStorage.setItem(`${this.cacheNamespace}:${key}`, JSON.stringify(item));
      this.recordStorageMetric('sessionStorage', 'store', item.size);
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        this.handleStorageQuotaExceeded('sessionStorage');
        try {
          sessionStorage.setItem(`${this.cacheNamespace}:${key}`, JSON.stringify(item));
          return true;
        } catch (retryError) {
          throw new Error('sessionStorage quota exceeded even after cleanup');
        }
      }
      throw error;
    }
  }

  /**
   * Retrieve from sessionStorage
   */
  retrieveFromSessionStorage(key) {
    if (!this.support.sessionStorage) return null;
    
    try {
      const itemStr = sessionStorage.getItem(`${this.cacheNamespace}:${key}`);
      if (!itemStr) return null;
      
      const item = JSON.parse(itemStr);
      
      // Check TTL
      if (item.ttl && Date.now() - item.timestamp > item.ttl) {
        sessionStorage.removeItem(`${this.cacheNamespace}:${key}`);
        return null;
      }
      
      this.recordStorageMetric('sessionStorage', 'retrieve', item.size);
      return item.value;
    } catch (error) {
      console.warn('[BrowserCache] Failed to retrieve from sessionStorage:', error);
      return null;
    }
  }

  /**
   * Store in IndexedDB
   */
  async storeInIndexedDB(key, data, options) {
    if (!this.dbConnection) {
      throw new Error('IndexedDB not initialized');
    }
    
    const transaction = this.dbConnection.transaction(['assets'], 'readwrite');
    const store = transaction.objectStore('assets');
    
    const item = {
      key,
      value: data,
      timestamp: Date.now(),
      ttl: options.ttl,
      priority: options.priority,
      size: this.estimateDataSize(data)
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      
      request.onsuccess = () => {
        this.recordStorageMetric('indexedDB', 'store', item.size);
        resolve(true);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retrieve from IndexedDB
   */
  async retrieveFromIndexedDB(key) {
    if (!this.dbConnection) return null;
    
    const transaction = this.dbConnection.transaction(['assets'], 'readonly');
    const store = transaction.objectStore('assets');
    
    return new Promise((resolve) => {
      const request = store.get(key);
      
      request.onsuccess = () => {
        const item = request.result;
        
        if (!item) {
          resolve(null);
          return;
        }
        
        // Check TTL
        if (item.ttl && Date.now() - item.timestamp > item.ttl) {
          this.deleteFromIndexedDB(key);
          resolve(null);
          return;
        }
        
        this.recordStorageMetric('indexedDB', 'retrieve', item.size);
        resolve(item.value);
      };
      
      request.onerror = () => {
        console.warn('[BrowserCache] Failed to retrieve from IndexedDB:', request.error);
        resolve(null);
      };
    });
  }

  /**
   * Delete from IndexedDB
   */
  async deleteFromIndexedDB(key) {
    if (!this.dbConnection) return false;
    
    const transaction = this.dbConnection.transaction(['assets'], 'readwrite');
    const store = transaction.objectStore('assets');
    
    return new Promise((resolve) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  }

  /**
   * Store in Cache API
   */
  async storeInCacheAPI(key, data, options = {}) {
    if (!this.caches) {
      throw new Error('Cache API not initialized');
    }
    
    const { cacheType = 'dynamic' } = options;
    const cache = this.caches[cacheType] || this.caches.dynamic;
    
    // Create a Response object
    const response = new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Timestamp': Date.now().toString(),
        'Cache-TTL': options.ttl?.toString() || '3600000',
        'Cache-Priority': options.priority?.toString() || '3'
      }
    });
    
    try {
      await cache.put(key, response);
      this.recordStorageMetric('cacheAPI', 'store', this.estimateDataSize(data));
      return true;
    } catch (error) {
      console.error('[BrowserCache] Failed to store in Cache API:', error);
      throw error;
    }
  }

  /**
   * Retrieve from Cache API
   */
  async retrieveFromCacheAPI(key) {
    if (!this.caches) return null;
    
    for (const cache of Object.values(this.caches)) {
      try {
        const response = await cache.match(key);
        
        if (response) {
          const timestamp = parseInt(response.headers.get('Cache-Timestamp') || '0');
          const ttl = parseInt(response.headers.get('Cache-TTL') || '3600000');
          
          // Check TTL
          if (Date.now() - timestamp > ttl) {
            await cache.delete(key);
            continue;
          }
          
          const data = await response.json();
          this.recordStorageMetric('cacheAPI', 'retrieve', this.estimateDataSize(data));
          return data;
        }
      } catch (error) {
        console.warn('[BrowserCache] Failed to retrieve from Cache API:', error);
      }
    }
    
    return null;
  }

  /**
   * Update storage metrics
   */
  async updateStorageMetrics() {
    try {
      // localStorage metrics
      if (this.support.localStorage) {
        const used = this.calculateLocalStorageUsage();
        this.storageMetrics.localStorage = {
          used,
          available: STORAGE_LIMITS.localStorage.maxSize - used,
          percentage: (used / STORAGE_LIMITS.localStorage.maxSize) * 100
        };
      }
      
      // sessionStorage metrics
      if (this.support.sessionStorage) {
        const used = this.calculateSessionStorageUsage();
        this.storageMetrics.sessionStorage = {
          used,
          available: STORAGE_LIMITS.sessionStorage.maxSize - used,
          percentage: (used / STORAGE_LIMITS.sessionStorage.maxSize) * 100
        };
      }
      
      // IndexedDB metrics
      if (this.support.indexedDB && navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        this.storageMetrics.indexedDB = {
          used: estimate.usage || 0,
          available: (estimate.quota || STORAGE_LIMITS.indexedDB.maxSize) - (estimate.usage || 0),
          percentage: ((estimate.usage || 0) / (estimate.quota || STORAGE_LIMITS.indexedDB.maxSize)) * 100
        };
      }
      
      // Cache API metrics (approximation)
      if (this.support.cacheAPI) {
        // This is an approximation as Cache API doesn't provide direct size info
        this.storageMetrics.cacheAPI = {
          used: 0, // Would need to iterate through all caches
          available: STORAGE_LIMITS.cacheAPI.maxSize,
          percentage: 0
        };
      }
    } catch (error) {
      console.warn('[BrowserCache] Failed to update storage metrics:', error);
    }
  }

  /**
   * Calculate localStorage usage
   */
  calculateLocalStorageUsage() {
    let total = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.cacheNamespace)) {
        const value = localStorage.getItem(key);
        total += new Blob([key + value]).size;
      }
    }
    
    return total;
  }

  /**
   * Calculate sessionStorage usage
   */
  calculateSessionStorageUsage() {
    let total = 0;
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(this.cacheNamespace)) {
        const value = sessionStorage.getItem(key);
        total += new Blob([key + value]).size;
      }
    }
    
    return total;
  }

  /**
   * Handle storage quota exceeded
   */
  async handleStorageQuotaExceeded(storageType) {
    console.warn(`[BrowserCache] ${storageType} quota exceeded, initiating cleanup`);
    
    switch (storageType) {
      case 'localStorage':
        this.cleanupLocalStorage();
        break;
      case 'sessionStorage':
        this.cleanupSessionStorage();
        break;
      case 'indexedDB':
        await this.cleanupIndexedDB();
        break;
      case 'cacheAPI':
        await this.cleanupCacheAPI();
        break;
    }
  }

  /**
   * Cleanup localStorage
   */
  cleanupLocalStorage() {
    const items = [];
    
    // Collect items with metadata
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.cacheNamespace)) {
        try {
          const itemStr = localStorage.getItem(key);
          const item = JSON.parse(itemStr);
          items.push({ key, ...item });
        } catch (error) {
          // Remove invalid items
          localStorage.removeItem(key);
        }
      }
    }
    
    // Sort by priority (higher number = lower priority) and age
    items.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority number = removed first
      }
      return a.timestamp - b.timestamp; // Older items first
    });
    
    // Remove items until we're under the warning threshold
    let removedSize = 0;
    const targetReduction = STORAGE_LIMITS.localStorage.warningThreshold * 0.5; // Remove 50% of warning threshold
    
    for (const item of items) {
      if (removedSize >= targetReduction) break;
      
      localStorage.removeItem(item.key);
      removedSize += item.size || 0;
    }
    
    console.log(`[BrowserCache] Cleaned up ${removedSize} bytes from localStorage`);
  }

  /**
   * Cleanup sessionStorage
   */
  cleanupSessionStorage() {
    // Similar to localStorage cleanup
    const items = [];
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(this.cacheNamespace)) {
        try {
          const itemStr = sessionStorage.getItem(key);
          const item = JSON.parse(itemStr);
          items.push({ key, ...item });
        } catch (error) {
          sessionStorage.removeItem(key);
        }
      }
    }
    
    items.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.timestamp - b.timestamp;
    });
    
    let removedSize = 0;
    const targetReduction = STORAGE_LIMITS.sessionStorage.warningThreshold * 0.5;
    
    for (const item of items) {
      if (removedSize >= targetReduction) break;
      
      sessionStorage.removeItem(item.key);
      removedSize += item.size || 0;
    }
    
    console.log(`[BrowserCache] Cleaned up ${removedSize} bytes from sessionStorage`);
  }

  /**
   * Cleanup IndexedDB
   */
  async cleanupIndexedDB() {
    if (!this.dbConnection) return;
    
    const transaction = this.dbConnection.transaction(['assets'], 'readwrite');
    const store = transaction.objectStore('assets');
    const index = store.index('timestamp');
    
    return new Promise((resolve) => {
      const request = index.openCursor();
      const itemsToDelete = [];
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        
        if (cursor) {
          const item = cursor.value;
          
          // Mark for deletion based on priority and age
          if (item.priority > CACHE_PRIORITIES.HIGH || 
              Date.now() - item.timestamp > 86400000) { // 24 hours
            itemsToDelete.push(item.key);
          }
          
          cursor.continue();
        } else {
          // Delete marked items
          let deletedCount = 0;
          const deleteTransaction = this.dbConnection.transaction(['assets'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('assets');
          
          for (const key of itemsToDelete.slice(0, 100)) { // Limit to 100 items
            deleteStore.delete(key);
            deletedCount++;
          }
          
          deleteTransaction.oncomplete = () => {
            console.log(`[BrowserCache] Cleaned up ${deletedCount} items from IndexedDB`);
            resolve();
          };
        }
      };
      
      request.onerror = () => {
        console.warn('[BrowserCache] Failed to cleanup IndexedDB:', request.error);
        resolve();
      };
    });
  }

  /**
   * Cleanup Cache API
   */
  async cleanupCacheAPI() {
    if (!this.caches) return;
    
    for (const [cacheName, cache] of Object.entries(this.caches)) {
      try {
        const requests = await cache.keys();
        const expiredRequests = [];
        
        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const timestamp = parseInt(response.headers.get('Cache-Timestamp') || '0');
            const ttl = parseInt(response.headers.get('Cache-TTL') || '3600000');
            
            if (Date.now() - timestamp > ttl) {
              expiredRequests.push(request);
            }
          }
        }
        
        // Delete expired requests
        for (const request of expiredRequests) {
          await cache.delete(request);
        }
        
        console.log(`[BrowserCache] Cleaned up ${expiredRequests.length} expired items from ${cacheName} cache`);
      } catch (error) {
        console.warn(`[BrowserCache] Failed to cleanup ${cacheName} cache:`, error);
      }
    }
  }

  /**
   * Set up automatic cleanup tasks
   */
  setupCleanupTasks() {
    // Cleanup every 5 minutes
    setInterval(async () => {
      await this.updateStorageMetrics();
      
      // Check if cleanup is needed
      for (const [storageType, metrics] of Object.entries(this.storageMetrics)) {
        if (metrics.percentage > this.options.cleanupThreshold * 100) {
          await this.handleStorageQuotaExceeded(storageType);
        }
      }
    }, 300000); // 5 minutes
    
    // Update metrics more frequently
    setInterval(() => {
      this.updateStorageMetrics();
    }, 60000); // 1 minute
  }

  /**
   * Record storage metrics for analytics
   */
  recordStorageMetric(storageType, operation, size) {
    if (!this.options.enableMetrics) return;
    
    // Store in analytics store if available
    if (this.dbConnection) {
      const transaction = this.dbConnection.transaction(['analytics'], 'readwrite');
      const store = transaction.objectStore('analytics');
      
      store.add({
        timestamp: Date.now(),
        type: 'storage',
        storageType,
        operation,
        size
      });
    }
  }

  /**
   * Compress data using worker
   */
  async compressData(data) {
    if (!this.compressionWorker) {
      return data; // No compression available
    }
    
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substr(2, 9);
      
      const handleMessage = (event) => {
        if (event.data.id === id) {
          this.compressionWorker.removeEventListener('message', handleMessage);
          
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.result);
          }
        }
      };
      
      this.compressionWorker.addEventListener('message', handleMessage);
      this.compressionWorker.postMessage({
        action: 'compress',
        data: typeof data === 'string' ? data : JSON.stringify(data),
        id
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        this.compressionWorker.removeEventListener('message', handleMessage);
        reject(new Error('Compression timeout'));
      }, 10000);
    });
  }

  /**
   * Decompress data using worker
   */
  async decompressData(compressedData) {
    if (!this.compressionWorker) {
      return compressedData; // No decompression available
    }
    
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substr(2, 9);
      
      const handleMessage = (event) => {
        if (event.data.id === id) {
          this.compressionWorker.removeEventListener('message', handleMessage);
          
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.result);
          }
        }
      };
      
      this.compressionWorker.addEventListener('message', handleMessage);
      this.compressionWorker.postMessage({
        action: 'decompress',
        data: compressedData,
        id
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        this.compressionWorker.removeEventListener('message', handleMessage);
        reject(new Error('Decompression timeout'));
      }, 10000);
    });
  }

  /**
   * Get storage statistics
   */
  getStorageStats() {
    return {
      metrics: this.storageMetrics,
      support: this.support,
      options: this.options,
      namespace: this.cacheNamespace
    };
  }

  /**
   * Clear all cached data
   */
  async clearAll() {
    try {
      // Clear localStorage
      if (this.support.localStorage) {
        const keys = Object.keys(localStorage).filter(key => 
          key.startsWith(this.cacheNamespace)
        );
        keys.forEach(key => localStorage.removeItem(key));
      }
      
      // Clear sessionStorage
      if (this.support.sessionStorage) {
        const keys = Object.keys(sessionStorage).filter(key => 
          key.startsWith(this.cacheNamespace)
        );
        keys.forEach(key => sessionStorage.removeItem(key));
      }
      
      // Clear IndexedDB
      if (this.dbConnection) {
        const transaction = this.dbConnection.transaction(['assets'], 'readwrite');
        const store = transaction.objectStore('assets');
        store.clear();
      }
      
      // Clear Cache API
      if (this.caches) {
        for (const cache of Object.values(this.caches)) {
          const requests = await cache.keys();
          for (const request of requests) {
            await cache.delete(request);
          }
        }
      }
      
      console.log('[BrowserCache] All cached data cleared');
    } catch (error) {
      console.error('[BrowserCache] Failed to clear all data:', error);
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    // Terminate compression worker
    if (this.compressionWorker) {
      this.compressionWorker.terminate();
      this.compressionWorker = null;
    }
    
    // Close IndexedDB connection
    if (this.dbConnection) {
      this.dbConnection.close();
      this.dbConnection = null;
    }
    
    console.log('[BrowserCache] Resources cleaned up');
  }
}

/**
 * Factory function to create browser cache manager
 */
export function createBrowserCacheManager(options) {
  return new BrowserCacheManager(options);
}

export default BrowserCacheManager;