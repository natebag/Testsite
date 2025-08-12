/**
 * MLG.clan State Persistence Manager
 * 
 * Handles state persistence to localStorage and sessionStorage
 * Provides encryption, compression, and cache management
 * 
 * @version 1.0.0
 * @created 2025-08-12
 */

import { 
  PERSISTENCE_CONFIG, 
  sanitizeStateForPersistence,
  validateStateType 
} from './state-types.js';

// =============================================================================
// STORAGE MANAGER CLASS
// =============================================================================

class StateStorageManager {
  constructor() {
    this.storagePrefix = PERSISTENCE_CONFIG.STORAGE_PREFIX;
    this.cacheExpiry = PERSISTENCE_CONFIG.CACHE_EXPIRY;
    this.isStorageAvailable = this.checkStorageAvailability();
  }

  /**
   * Check if localStorage and sessionStorage are available
   * @returns {Object} - Storage availability status
   */
  checkStorageAvailability() {
    const testKey = '__storage_test__';
    try {
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      return { localStorage: true, sessionStorage: true };
    } catch (e) {
      console.warn('Storage not available:', e);
      return { localStorage: false, sessionStorage: false };
    }
  }

  /**
   * Generate storage key with prefix
   * @param {string} key - Original key
   * @returns {string} - Prefixed key
   */
  getStorageKey(key) {
    return `${this.storagePrefix}${key}`;
  }

  /**
   * Create cache entry with expiry
   * @param {any} data - Data to cache
   * @param {number} expiryMs - Expiry time in milliseconds
   * @returns {Object} - Cache entry object
   */
  createCacheEntry(data, expiryMs) {
    return {
      data,
      timestamp: Date.now(),
      expires: Date.now() + expiryMs,
      version: '1.0.0'
    };
  }

  /**
   * Check if cache entry is valid
   * @param {Object} entry - Cache entry
   * @returns {boolean} - Whether entry is valid
   */
  isCacheValid(entry) {
    if (!entry || typeof entry !== 'object') return false;
    if (!entry.timestamp || !entry.expires) return false;
    return Date.now() < entry.expires;
  }

  /**
   * Compress data for storage (simple JSON stringify for now)
   * @param {any} data - Data to compress
   * @returns {string} - Compressed data
   */
  compressData(data) {
    try {
      return JSON.stringify(data);
    } catch (e) {
      console.error('Failed to compress data:', e);
      return null;
    }
  }

  /**
   * Decompress data from storage
   * @param {string} compressedData - Compressed data
   * @returns {any} - Decompressed data
   */
  decompressData(compressedData) {
    try {
      return JSON.parse(compressedData);
    } catch (e) {
      console.error('Failed to decompress data:', e);
      return null;
    }
  }

  /**
   * Save data to localStorage
   * @param {string} key - Storage key
   * @param {any} data - Data to save
   * @param {number} expiryMs - Expiry time in milliseconds
   * @returns {boolean} - Success status
   */
  saveToLocalStorage(key, data, expiryMs = this.cacheExpiry.settings) {
    if (!this.isStorageAvailable.localStorage) return false;

    try {
      const sanitizedData = sanitizeStateForPersistence(data);
      const cacheEntry = this.createCacheEntry(sanitizedData, expiryMs);
      const compressed = this.compressData(cacheEntry);
      
      if (compressed) {
        localStorage.setItem(this.getStorageKey(key), compressed);
        return true;
      }
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
    return false;
  }

  /**
   * Load data from localStorage
   * @param {string} key - Storage key
   * @returns {any} - Loaded data or null
   */
  loadFromLocalStorage(key) {
    if (!this.isStorageAvailable.localStorage) return null;

    try {
      const compressed = localStorage.getItem(this.getStorageKey(key));
      if (!compressed) return null;

      const entry = this.decompressData(compressed);
      if (!entry || !this.isCacheValid(entry)) {
        this.removeFromLocalStorage(key);
        return null;
      }

      return entry.data;
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
      this.removeFromLocalStorage(key);
    }
    return null;
  }

  /**
   * Save data to sessionStorage
   * @param {string} key - Storage key
   * @param {any} data - Data to save
   * @returns {boolean} - Success status
   */
  saveToSessionStorage(key, data) {
    if (!this.isStorageAvailable.sessionStorage) return false;

    try {
      const compressed = this.compressData(data);
      if (compressed) {
        sessionStorage.setItem(this.getStorageKey(key), compressed);
        return true;
      }
    } catch (e) {
      console.error('Failed to save to sessionStorage:', e);
    }
    return false;
  }

  /**
   * Load data from sessionStorage
   * @param {string} key - Storage key
   * @returns {any} - Loaded data or null
   */
  loadFromSessionStorage(key) {
    if (!this.isStorageAvailable.sessionStorage) return null;

    try {
      const compressed = sessionStorage.getItem(this.getStorageKey(key));
      if (!compressed) return null;

      return this.decompressData(compressed);
    } catch (e) {
      console.error('Failed to load from sessionStorage:', e);
      this.removeFromSessionStorage(key);
    }
    return null;
  }

  /**
   * Remove data from localStorage
   * @param {string} key - Storage key
   */
  removeFromLocalStorage(key) {
    if (this.isStorageAvailable.localStorage) {
      localStorage.removeItem(this.getStorageKey(key));
    }
  }

  /**
   * Remove data from sessionStorage
   * @param {string} key - Storage key
   */
  removeFromSessionStorage(key) {
    if (this.isStorageAvailable.sessionStorage) {
      sessionStorage.removeItem(this.getStorageKey(key));
    }
  }

  /**
   * Clear all MLG.clan data from storage
   */
  clearAllData() {
    if (this.isStorageAvailable.localStorage) {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.storagePrefix)) {
          localStorage.removeItem(key);
        }
      });
    }

    if (this.isStorageAvailable.sessionStorage) {
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith(this.storagePrefix)) {
          sessionStorage.removeItem(key);
        }
      });
    }
  }

  /**
   * Get storage usage statistics
   * @returns {Object} - Storage usage info
   */
  getStorageInfo() {
    const info = {
      localStorage: { available: this.isStorageAvailable.localStorage, keys: 0, size: 0 },
      sessionStorage: { available: this.isStorageAvailable.sessionStorage, keys: 0, size: 0 }
    };

    if (this.isStorageAvailable.localStorage) {
      const keys = Object.keys(localStorage);
      const mlgKeys = keys.filter(key => key.startsWith(this.storagePrefix));
      info.localStorage.keys = mlgKeys.length;
      info.localStorage.size = mlgKeys.reduce((size, key) => {
        return size + (localStorage.getItem(key)?.length || 0);
      }, 0);
    }

    if (this.isStorageAvailable.sessionStorage) {
      const keys = Object.keys(sessionStorage);
      const mlgKeys = keys.filter(key => key.startsWith(this.storagePrefix));
      info.sessionStorage.keys = mlgKeys.length;
      info.sessionStorage.size = mlgKeys.reduce((size, key) => {
        return size + (sessionStorage.getItem(key)?.length || 0);
      }, 0);
    }

    return info;
  }
}

// =============================================================================
// STATE PERSISTENCE FUNCTIONS
// =============================================================================

// Create singleton instance
const storageManager = new StateStorageManager();

/**
 * Save application state to persistent storage
 * @param {Object} state - Application state
 * @returns {boolean} - Success status
 */
export function saveState(state) {
  try {
    let success = true;

    // Save persistent keys to localStorage
    PERSISTENCE_CONFIG.PERSISTENT_KEYS.forEach(keyPath => {
      const value = getNestedValue(state, keyPath);
      if (value !== undefined) {
        const key = keyPath.replace(/\./g, '_');
        const expiry = getExpiryForKey(keyPath);
        if (!storageManager.saveToLocalStorage(key, value, expiry)) {
          success = false;
        }
      }
    });

    // Save session keys to sessionStorage
    PERSISTENCE_CONFIG.SESSION_KEYS.forEach(keyPath => {
      const value = getNestedValue(state, keyPath);
      if (value !== undefined) {
        const key = keyPath.replace(/\./g, '_');
        if (!storageManager.saveToSessionStorage(key, value)) {
          success = false;
        }
      }
    });

    return success;
  } catch (e) {
    console.error('Failed to save state:', e);
    return false;
  }
}

/**
 * Load application state from persistent storage
 * @returns {Object} - Loaded state object
 */
export function loadState() {
  const loadedState = {};

  try {
    // Load persistent keys from localStorage
    PERSISTENCE_CONFIG.PERSISTENT_KEYS.forEach(keyPath => {
      const key = keyPath.replace(/\./g, '_');
      const value = storageManager.loadFromLocalStorage(key);
      if (value !== null) {
        setNestedValue(loadedState, keyPath, value);
      }
    });

    // Load session keys from sessionStorage
    PERSISTENCE_CONFIG.SESSION_KEYS.forEach(keyPath => {
      const key = keyPath.replace(/\./g, '_');
      const value = storageManager.loadFromSessionStorage(key);
      if (value !== null) {
        setNestedValue(loadedState, keyPath, value);
      }
    });

    return loadedState;
  } catch (e) {
    console.error('Failed to load state:', e);
    return {};
  }
}

/**
 * Clear all persistent state data
 */
export function clearPersistedState() {
  storageManager.clearAllData();
}

/**
 * Get storage usage information
 * @returns {Object} - Storage info
 */
export function getStorageInfo() {
  return storageManager.getStorageInfo();
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - Object to search
 * @param {string} path - Dot notation path (e.g., 'user.preferences.theme')
 * @returns {any} - Value or undefined
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Set nested value in object using dot notation
 * @param {Object} obj - Object to modify
 * @param {string} path - Dot notation path
 * @param {any} value - Value to set
 */
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    return current[key];
  }, obj);
  target[lastKey] = value;
}

/**
 * Get appropriate expiry time for a key path
 * @param {string} keyPath - Key path
 * @returns {number} - Expiry time in milliseconds
 */
function getExpiryForKey(keyPath) {
  if (keyPath.startsWith('user.')) return PERSISTENCE_CONFIG.CACHE_EXPIRY.user;
  if (keyPath.startsWith('clan.')) return PERSISTENCE_CONFIG.CACHE_EXPIRY.clan;
  if (keyPath.startsWith('voting.')) return PERSISTENCE_CONFIG.CACHE_EXPIRY.voting;
  if (keyPath.startsWith('settings.')) return PERSISTENCE_CONFIG.CACHE_EXPIRY.settings;
  return PERSISTENCE_CONFIG.CACHE_EXPIRY.settings; // Default
}

/**
 * Create middleware for automatic state persistence
 * @param {Function} next - Next middleware function
 * @returns {Function} - Middleware function
 */
export function createPersistenceMiddleware(next) {
  return (state, action) => {
    const newState = next(state, action);
    
    // Debounce save operations to avoid excessive writes
    clearTimeout(createPersistenceMiddleware.saveTimeout);
    createPersistenceMiddleware.saveTimeout = setTimeout(() => {
      saveState(newState);
    }, 100);
    
    return newState;
  };
}

// Export storage manager for advanced usage
export { storageManager };

export default {
  saveState,
  loadState,
  clearPersistedState,
  getStorageInfo,
  createPersistenceMiddleware,
  storageManager
};