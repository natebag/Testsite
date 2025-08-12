/**
 * MLG.clan Consolidated API Client
 * 
 * Unified API client combining functionality from:
 * - src/js/api-client.js 
 * - src/js/mlg-api-client.js
 * 
 * Features:
 * - Comprehensive error handling with retry logic
 * - Caching system for performance optimization
 * - Loading states with gaming aesthetic
 * - Real-time data updates via WebSocket
 * - Fallback mechanisms for offline/degraded service
 * - Authentication and token management
 * - Gaming-themed user feedback
 * 
 * @version 2.0.0 - Consolidated Edition
 * @typedef {import('../../../types/wallet.d.ts').WalletState} WalletState
 * @typedef {import('../../../types/voting.d.ts').VotingState} VotingState
 * @typedef {import('../../../types/clan.d.ts').ClanState} ClanState
 */

/**
 * @typedef {Object} MLGApiClientOptions
 * @property {string} [baseURL] - Base URL for API requests
 * @property {number} [timeout=10000] - Request timeout in milliseconds
 * @property {number} [maxRetries=3] - Maximum number of retry attempts
 * @property {number} [retryDelay=1000] - Base retry delay in milliseconds
 * @property {number} [backoffMultiplier=2] - Backoff multiplier for retries
 * @property {number} [cacheTimeout=30000] - Cache timeout in milliseconds
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Whether the request was successful
 * @property {any} data - Response data
 * @property {string} [error] - Error message if request failed
 * @property {Object} [metadata] - Additional response metadata
 */

class MLGApiClient {
  /**
   * Create a new MLG API Client instance
   * @param {MLGApiClientOptions} options - Client configuration options
   */
  constructor(options = {}) {
    // Core configuration
    this.baseURL = options.baseURL || (window.location.origin + '/api');
    this.timeout = options.timeout || 10000;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.backoffMultiplier = options.backoffMultiplier || 2;
    
    // Systems integration
    this.errorHandler = window.MLGErrorHandler;
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 30000;
    this.loadingStates = new Map();
    this.callbacks = new Map();
    
    // Authentication
    this.authToken = localStorage.getItem('mlg_auth_token');
    this.refreshToken = localStorage.getItem('mlg_refresh_token');
    
    // API endpoints configuration
    this.endpoints = {
      auth: {
        login: '/auth/login',
        logout: '/auth/logout',
        refresh: '/auth/refresh',
        profile: '/auth/profile',
        connect: '/auth/wallet/connect'
      },
      users: {
        profile: '/users/profile',
        update: '/users/profile',
        stats: '/users/stats',
        preferences: '/users/preferences'
      },
      content: {
        submit: '/content/submit',
        list: '/content/list',
        get: '/content/:id',
        trending: '/content/trending',
        search: '/content/search'
      },
      voting: {
        cast: '/voting/cast',
        history: '/voting/history',
        leaderboard: '/voting/leaderboard',
        stats: '/voting/stats'
      },
      clans: {
        create: '/clans/create',
        list: '/clans/list',
        get: '/clans/:id',
        join: '/clans/:id/join',
        leave: '/clans/:id/leave',
        members: '/clans/:id/members',
        leaderboard: '/clans/leaderboard'
      },
      system: {
        status: '/system/status',
        health: '/system/health',
        analytics: '/system/analytics'
      },
      web3: {
        connect: '/web3/connect',
        disconnect: '/web3/disconnect',
        transaction: '/web3/transaction',
        balance: '/web3/balance'
      }
    };
    
    this.initialize();
  }

  /**
   * Initialize the API client with all required systems
   * @returns {Promise<void>}
   */
  async initialize() {
    // Initialize loading system integration
    this.initializeLoadingSystem();
    
    // Set up authentication token refresh
    this.setupTokenRefresh();
    
    // Initialize real-time connections
    this.initializeWebSocket();
    
    console.log('🚀 MLG.clan API Client initialized');
  }

  initializeLoadingSystem() {
    if (!window.MLG) {
      console.warn('MLG loading system not available, using fallback');
      this.loadingFallback = true;
    }
  }

  setupTokenRefresh() {
    // Auto-refresh tokens before expiry
    if (this.authToken) {
      const payload = this.parseJWT(this.authToken);
      if (payload && payload.exp) {
        const expiresIn = (payload.exp * 1000) - Date.now();
        if (expiresIn > 0 && expiresIn < 300000) { // Less than 5 minutes
          this.refreshAuthToken();
        }
      }
    }
  }

  initializeWebSocket() {
    if (window.MLGWebSocketManager) {
      window.MLGWebSocketManager.subscribe('api_updates', (data) => {
        this.handleRealTimeUpdate(data);
      });
    }
  }

  /**
   * Core HTTP request method with comprehensive error handling
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
   * @param {string} endpoint - API endpoint
   * @param {Object} [options={}] - Request options
   * @param {Object} [options.data] - Request body data
   * @param {Object} [options.headers] - Additional headers
   * @param {boolean} [options.cache] - Whether to use cache for GET requests
   * @param {any} [options.fallback] - Fallback data on error
   * @returns {Promise<ApiResponse>} API response
   */
  async request(method, endpoint, options = {}) {
    const url = this.buildURL(endpoint);
    const config = this.buildRequestConfig(method, options);
    
    // Show loading state
    const loadingId = this.showLoading(method, endpoint);
    
    try {
      // Check cache for GET requests
      if (method === 'GET' && options.cache !== false) {
        const cached = this.getCached(url);
        if (cached) {
          this.hideLoading(loadingId);
          return cached;
        }
      }
      
      const response = await this.executeRequest(url, config);
      const data = await this.handleResponse(response);
      
      // Cache successful GET requests
      if (method === 'GET' && response.ok) {
        this.setCached(url, data);
      }
      
      this.hideLoading(loadingId);
      return data;
      
    } catch (error) {
      this.hideLoading(loadingId);
      return this.handleError(error, method, endpoint, options);
    }
  }

  async executeRequest(url, config) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        const response = await fetch(url, {
          ...config,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Handle authentication errors
        if (response.status === 401) {
          const refreshed = await this.refreshAuthToken();
          if (refreshed) {
            // Retry with new token
            config.headers.Authorization = `Bearer ${this.authToken}`;
            continue;
          }
        }
        
        return response;
        
      } catch (error) {
        lastError = error;
        
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(this.backoffMultiplier, attempt - 1);
          await this.delay(delay);
          console.warn(`🔄 Retry attempt ${attempt + 1} for ${url} in ${delay}ms`);
        }
      }
    }
    
    throw lastError;
  }

  buildURL(endpoint) {
    if (endpoint.startsWith('http')) return endpoint;
    return `${this.baseURL}${endpoint}`;
  }

  buildRequestConfig(method, options) {
    const config = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };
    
    // Add authentication if available
    if (this.authToken) {
      config.headers.Authorization = `Bearer ${this.authToken}`;
    }
    
    // Add body for non-GET requests
    if (options.data && method !== 'GET') {
      config.body = JSON.stringify(options.data);
    }
    
    return config;
  }

  async handleResponse(response) {
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.response = response;
      throw error;
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  }

  async handleError(error, method, endpoint, options) {
    console.error(`🚨 API Error [${method} ${endpoint}]:`, error);
    
    // Use MLG error handler if available
    if (this.errorHandler) {
      this.errorHandler.createNotification({
        type: 'error',
        title: '🔥 Connection Issue',
        message: this.getErrorMessage(error),
        icon: '⚠️'
      });
    }
    
    // Return fallback data if available
    if (options.fallback) {
      console.log('📦 Using fallback data for', endpoint);
      return options.fallback;
    }
    
    throw error;
  }

  getErrorMessage(error) {
    if (error.name === 'AbortError') return 'Request timed out. Check your connection.';
    if (error.status === 429) return 'Too many requests. Please wait a moment.';
    if (error.status === 503) return 'Service temporarily unavailable.';
    if (error.status >= 500) return 'Server error. Please try again later.';
    if (error.status === 401) return 'Authentication required. Please log in.';
    if (error.status === 403) return 'Access denied. Check your permissions.';
    return error.message || 'An unexpected error occurred.';
  }

  // Caching system
  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('📦 Cache hit for', key);
      return cached.data;
    }
    return null;
  }

  setCached(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
    console.log('🗑️ API cache cleared');
  }

  // Loading states
  showLoading(method, endpoint) {
    const id = `${method}-${endpoint}-${Date.now()}`;
    
    if (window.MLG && window.MLG.showLoading) {
      window.MLG.showLoading(id);
    } else if (this.loadingFallback) {
      console.log(`⏳ Loading: ${method} ${endpoint}`);
    }
    
    return id;
  }

  hideLoading(id) {
    if (window.MLG && window.MLG.hideLoading) {
      window.MLG.hideLoading(id);
    } else if (this.loadingFallback) {
      console.log(`✅ Complete: ${id}`);
    }
  }

  // Authentication methods
  async refreshAuthToken() {
    if (!this.refreshToken) return false;
    
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });
      
      if (response.ok) {
        const data = await response.json();
        this.authToken = data.accessToken;
        localStorage.setItem('mlg_auth_token', this.authToken);
        console.log('🔄 Auth token refreshed');
        return true;
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
    }
    
    this.logout();
    return false;
  }

  logout() {
    this.authToken = null;
    this.refreshToken = null;
    localStorage.removeItem('mlg_auth_token');
    localStorage.removeItem('mlg_refresh_token');
    console.log('👋 User logged out');
  }

  // Convenience methods for different endpoints
  
  // Authentication
  async login(credentials) {
    return this.request('POST', this.endpoints.auth.login, { data: credentials });
  }

  async getUserProfile() {
    return this.request('GET', this.endpoints.users.profile);
  }

  async updateProfile(profileData) {
    return this.request('PUT', this.endpoints.users.update, { data: profileData });
  }

  // Content operations
  async submitContent(contentData) {
    return this.request('POST', this.endpoints.content.submit, { data: contentData });
  }

  async getTrendingContent() {
    return this.request('GET', this.endpoints.content.trending, {
      fallback: this.generateFallbackContent()
    });
  }

  async searchContent(query) {
    return this.request('GET', `${this.endpoints.content.search}?q=${encodeURIComponent(query)}`);
  }

  // Voting operations
  async castVote(contentId, voteType, cost = 0) {
    return this.request('POST', this.endpoints.voting.cast, {
      data: { contentId, voteType, cost }
    });
  }

  async getVotingLeaderboard() {
    return this.request('GET', this.endpoints.voting.leaderboard, {
      fallback: this.generateFallbackLeaderboard()
    });
  }

  // Clan operations
  async createClan(clanData) {
    return this.request('POST', this.endpoints.clans.create, { data: clanData });
  }

  async getClans() {
    return this.request('GET', this.endpoints.clans.list, {
      fallback: this.generateFallbackClans()
    });
  }

  async joinClan(clanId) {
    return this.request('POST', this.endpoints.clans.join.replace(':id', clanId));
  }

  // System operations
  async getSystemStatus() {
    return this.request('GET', this.endpoints.system.status, {
      fallback: { status: 'operational', uptime: '99.9%' }
    });
  }

  async getAnalytics() {
    return this.request('GET', this.endpoints.system.analytics, {
      fallback: this.generateFallbackAnalytics()
    });
  }

  // Web3 operations
  async connectWallet(walletData) {
    return this.request('POST', this.endpoints.web3.connect, { data: walletData });
  }

  async getWalletBalance(address) {
    return this.request('GET', `${this.endpoints.web3.balance}?address=${address}`);
  }

  // Fallback data generators
  generateFallbackContent() {
    return [
      { id: 1, title: 'Epic Gaming Moment', platform: 'youtube', votes: 156 },
      { id: 2, title: 'Pro Valorant Play', platform: 'twitch', votes: 89 },
      { id: 3, title: 'Insane Clutch', platform: 'tiktok', votes: 234 }
    ];
  }

  generateFallbackLeaderboard() {
    return [
      { username: 'ProGamer2024', votes: 1247, mlgBurned: 31175 },
      { username: 'VoteKing', votes: 891, mlgBurned: 22275 },
      { username: 'MLGBurner', votes: 654, mlgBurned: 16350 }
    ];
  }

  generateFallbackClans() {
    return [
      { id: 1, name: 'Elite Gamers', members: 45, wins: 289 },
      { id: 2, name: 'Victory Squad', members: 38, wins: 156 },
      { id: 3, name: 'Apex Legends', members: 50, wins: 423 }
    ];
  }

  generateFallbackAnalytics() {
    return {
      users: { online: 5642, total: 28941 },
      content: { submissions: 1834, approved: 1672 },
      voting: { total: 45632, today: 892 }
    };
  }

  // Utility methods
  parseJWT(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  handleRealTimeUpdate(data) {
    // Handle real-time updates from WebSocket
    if (data.type === 'cache_invalidate') {
      this.cache.delete(data.endpoint);
    }
    
    // Trigger callbacks for specific endpoints
    const callbacks = this.callbacks.get(data.endpoint);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  subscribe(endpoint, callback) {
    if (!this.callbacks.has(endpoint)) {
      this.callbacks.set(endpoint, []);
    }
    this.callbacks.get(endpoint).push(callback);
  }

  unsubscribe(endpoint, callback) {
    const callbacks = this.callbacks.get(endpoint);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
}

// Initialize global instance
if (typeof window !== 'undefined') {
  window.MLGApiClient = new MLGApiClient();
  console.log('🎮 MLG.clan Consolidated API Client ready');
}

// Export for ES6 modules
export default MLGApiClient;
export { MLGApiClient };