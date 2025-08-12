/**
 * MLG.clan API Client with Comprehensive Error Handling
 * Features retry mechanisms, exponential backoff, and gaming-themed feedback
 * 
 * @author Claude Code - Frontend Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

class MLGApiClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || '/api';
    this.timeout = options.timeout || 10000;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.backoffMultiplier = options.backoffMultiplier || 2;
    this.errorHandler = window.MLGErrorHandler;
    
    // API endpoints configuration
    this.endpoints = {
      auth: {
        login: '/auth/login',
        logout: '/auth/logout',
        refresh: '/auth/refresh',
        profile: '/auth/profile'
      },
      users: {
        profile: '/users/profile',
        update: '/users/profile',
        stats: '/users/stats',
        achievements: '/users/achievements'
      },
      clans: {
        list: '/clans',
        create: '/clans',
        join: '/clans/:id/join',
        leave: '/clans/:id/leave',
        details: '/clans/:id',
        members: '/clans/:id/members',
        stats: '/clans/:id/stats'
      },
      voting: {
        active: '/votes/active',
        create: '/votes',
        vote: '/votes/:id/vote',
        results: '/votes/:id/results',
        history: '/votes/history'
      },
      content: {
        list: '/content',
        create: '/content',
        upload: '/content/upload',
        moderate: '/content/:id/moderate',
        featured: '/content/featured'
      },
      leaderboard: {
        users: '/leaderboard/users',
        clans: '/leaderboard/clans',
        global: '/leaderboard/global'
      },
      system: {
        health: '/system/health',
        stats: '/system/stats',
        status: '/system/status'
      }
    };

    // Request interceptors
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    
    // Enhanced cache manager
    this.cacheManager = window.MLGCacheManager || null;
    
    // Fallback basic cache for GET requests
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes

    this.init();
  }

  init() {
    // Add default request interceptors
    this.addRequestInterceptor((config) => {
      // Add authentication token using enhanced auth manager
      if (window.MLGAuthManager) {
        const authHeader = window.MLGAuthManager.getAuthHeader();
        if (authHeader) {
          config.headers = config.headers || {};
          config.headers['Authorization'] = authHeader;
        }
      } else {
        // Fallback to basic token storage
        const token = localStorage.getItem('mlg_auth_token');
        if (token) {
          config.headers = config.headers || {};
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      }
      return config;
    });

    // Add default response interceptors
    this.addResponseInterceptor(
      (response) => response, // Success handler
      (error) => this.handleResponseError(error) // Error handler
    );

    console.log('🎮 MLG API Client initialized');
  }

  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(successHandler, errorHandler) {
    this.responseInterceptors.push({ successHandler, errorHandler });
  }

  async request(config) {
    // Apply request interceptors
    let finalConfig = { ...config };
    for (const interceptor of this.requestInterceptors) {
      finalConfig = await interceptor(finalConfig);
    }

    const { url, method = 'GET', data, headers = {}, cache = false } = finalConfig;
    const fullUrl = this.buildURL(url);
    const cacheKey = `${method}:${fullUrl}`;

    // Check enhanced cache for GET requests
    if (method === 'GET' && cache) {
      // Try enhanced cache manager first
      if (this.cacheManager) {
        const cacheKey = this.cacheManager.generateKey(fullUrl, { method, data });
        const cachedData = this.cacheManager.get(cacheKey, { url: fullUrl });
        if (cachedData) {
          console.log('🎯 Enhanced cache hit:', fullUrl);
          return cachedData;
        }
      } else {
        // Fallback to basic cache
        if (this.cache.has(cacheKey)) {
          const cached = this.cache.get(cacheKey);
          if (Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log('🎯 Basic cache hit:', fullUrl);
            return cached.data;
          }
        }
      }
    }

    // Setup request options
    const requestOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data && method !== 'GET') {
      requestOptions.body = JSON.stringify(data);
    }

    // Execute request with error handling
    const result = await this.errorHandler.executeWithErrorHandling(
      async () => {
        const response = await this.fetchWithTimeout(fullUrl, requestOptions);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const responseData = await response.json();

        // Cache GET requests using enhanced cache manager
        if (method === 'GET' && cache) {
          if (this.cacheManager) {
            const enhancedCacheKey = this.cacheManager.generateKey(fullUrl, { method, data });
            this.cacheManager.set(enhancedCacheKey, responseData, {
              url: fullUrl,
              strategy: this.cacheManager.getStrategy(fullUrl)
            });
          } else {
            // Fallback to basic cache
            this.cache.set(cacheKey, {
              data: responseData,
              timestamp: Date.now()
            });
          }
        }

        return responseData;
      },
      {
        operation: this.getOperationName(url, method),
        url: fullUrl,
        method
      }
    );

    // Apply response interceptors
    if (result.success) {
      let finalResult = result.data;
      for (const { successHandler } of this.responseInterceptors) {
        finalResult = await successHandler(finalResult);
      }
      return finalResult;
    } else {
      // Handle error through interceptors
      for (const { errorHandler } of this.responseInterceptors) {
        if (errorHandler) {
          await errorHandler(result.error);
        }
      }
      
      // Return fallback data if available
      if (result.data) {
        return result.data;
      }
      
      throw result.error;
    }
  }

  async fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  buildURL(endpoint) {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    return `${this.baseURL}${endpoint}`;
  }

  getOperationName(url, method) {
    const operations = {
      '/auth/login': 'userLogin',
      '/auth/profile': 'getUserProfile',
      '/users/profile': 'getUserProfile',
      '/clans': 'getClans',
      '/votes/active': 'getActiveVotes',
      '/leaderboard/users': 'getUserLeaderboard',
      '/leaderboard/clans': 'getClanLeaderboard',
      '/system/health': 'systemHealth'
    };

    return operations[url] || `${method.toLowerCase()}_${url.replace(/[^a-zA-Z]/g, '_')}`;
  }

  async handleResponseError(error) {
    // Handle authentication errors
    if (error.message && error.message.includes('401')) {
      console.log('🔄 401 error - attempting token refresh...');
      
      if (window.MLGAuthManager) {
        const refreshedToken = await window.MLGAuthManager.refreshToken();
        if (refreshedToken) {
          console.log('✅ Token refreshed, retrying original request');
          // The original request will be retried automatically with the new token
          return;
        } else {
          console.log('❌ Token refresh failed, logging out');
          window.MLGAuthManager.logout('auth_failed');
        }
      }
    }
    
    // Handle other errors through MLGErrorHandler
    console.warn('API Response Error:', error);
    return Promise.reject(error);
  }

  // Convenience methods for different HTTP verbs
  async get(url, options = {}) {
    return this.request({ url, method: 'GET', ...options });
  }

  async post(url, data, options = {}) {
    return this.request({ url, method: 'POST', data, ...options });
  }

  async put(url, data, options = {}) {
    return this.request({ url, method: 'PUT', data, ...options });
  }

  async patch(url, data, options = {}) {
    return this.request({ url, method: 'PATCH', data, ...options });
  }

  async delete(url, options = {}) {
    return this.request({ url, method: 'DELETE', ...options });
  }

  // High-level API methods with gaming context
  
  // Authentication
  async login(credentials) {
    try {
      // Use enhanced auth manager if available
      if (window.MLGAuthManager) {
        return await window.MLGAuthManager.login(credentials);
      } else {
        // Fallback to basic login
        const result = await this.post(this.endpoints.auth.login, credentials);
        if (result.token) {
          localStorage.setItem('mlg_auth_token', result.token);
          this.errorHandler.createNotification({
            type: 'success',
            title: '🎮 Login Successful',
            message: `Welcome back, ${result.user?.gamertag || 'Gamer'}!`,
            icon: '🏆'
          });
        }
        return result;
      }
    } catch (error) {
      if (!window.MLGAuthManager) {
        this.errorHandler.createNotification({
          type: 'error',
          title: '❌ Login Failed',
          message: 'Check your credentials and try again',
          icon: '🔐'
        });
      }
      throw error;
    }
  }

  async logout() {
    try {
      // Use enhanced auth manager if available
      if (window.MLGAuthManager) {
        window.MLGAuthManager.logout();
      } else {
        // Fallback to basic logout
        await this.post(this.endpoints.auth.logout);
        localStorage.removeItem('mlg_auth_token');
        this.errorHandler.createNotification({
          type: 'info',
          title: '👋 Logged Out',
          message: 'Thanks for gaming with MLG.clan!',
          icon: '🎮'
        });
      }
    } catch (error) {
      // Clear token even if logout request fails
      if (!window.MLGAuthManager) {
        localStorage.removeItem('mlg_auth_token');
      }
      throw error;
    }
  }

  // User Profile
  async getUserProfile(useCache = true) {
    return this.get(this.endpoints.users.profile, { cache: useCache });
  }

  async updateUserProfile(profileData) {
    const result = await this.put(this.endpoints.users.profile, profileData);
    this.errorHandler.createNotification({
      type: 'success',
      title: '✅ Profile Updated',
      message: 'Your gaming profile has been saved!',
      icon: '👤'
    });
    return result;
  }

  async getUserStats(userId = null) {
    const url = userId ? `${this.endpoints.users.stats}?userId=${userId}` : this.endpoints.users.stats;
    return this.get(url, { cache: true });
  }

  // Clan Operations
  async getClans(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const url = params ? `${this.endpoints.clans.list}?${params}` : this.endpoints.clans.list;
    return this.get(url, { cache: true });
  }

  async createClan(clanData) {
    const result = await this.post(this.endpoints.clans.create, clanData);
    this.errorHandler.createNotification({
      type: 'success',
      title: '🏰 Clan Created',
      message: `Welcome to ${clanData.name}! Your gaming empire begins.`,
      icon: '👑'
    });
    return result;
  }

  async joinClan(clanId) {
    const url = this.endpoints.clans.join.replace(':id', clanId);
    const result = await this.post(url);
    this.errorHandler.createNotification({
      type: 'success',
      title: '🤝 Clan Joined',
      message: 'Welcome to your new gaming family!',
      icon: '🎉'
    });
    return result;
  }

  async leaveClan(clanId) {
    const url = this.endpoints.clans.leave.replace(':id', clanId);
    const result = await this.post(url);
    this.errorHandler.createNotification({
      type: 'info',
      title: '👋 Left Clan',
      message: 'You have left the clan. Good luck on your solo journey!',
      icon: '🚪'
    });
    return result;
  }

  async getClanDetails(clanId) {
    const url = this.endpoints.clans.details.replace(':id', clanId);
    return this.get(url, { cache: true });
  }

  // Voting System
  async getActiveVotes() {
    return this.get(this.endpoints.voting.active, { cache: true });
  }

  async createVote(voteData) {
    const result = await this.post(this.endpoints.voting.create, voteData);
    this.errorHandler.createNotification({
      type: 'success',
      title: '🗳️ Vote Created',
      message: 'Your proposal is now live! Let the community decide.',
      icon: '📊'
    });
    return result;
  }

  async castVote(voteId, choice, amount = 0) {
    const url = this.endpoints.voting.vote.replace(':id', voteId);
    const result = await this.post(url, { choice, amount });
    
    if (amount > 0) {
      this.errorHandler.createNotification({
        type: 'success',
        title: '🔥 Vote Burned!',
        message: `You burned ${amount} MLG tokens for your vote!`,
        icon: '🔥'
      });
    } else {
      this.errorHandler.createNotification({
        type: 'success',
        title: '✅ Vote Recorded',
        message: 'Your voice has been heard!',
        icon: '🗳️'
      });
    }
    return result;
  }

  async getVoteResults(voteId) {
    const url = this.endpoints.voting.results.replace(':id', voteId);
    return this.get(url, { cache: true });
  }

  // Content Operations
  async getContent(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const url = params ? `${this.endpoints.content.list}?${params}` : this.endpoints.content.list;
    return this.get(url, { cache: true });
  }

  async submitContent(contentData) {
    const result = await this.post(this.endpoints.content.create, contentData);
    this.errorHandler.createNotification({
      type: 'success',
      title: '🎬 Content Submitted',
      message: 'Your content is now under review. Prepare for fame!',
      icon: '⭐'
    });
    return result;
  }

  async uploadContent(file, metadata = {}) {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(metadata).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const result = await this.request({
      url: this.endpoints.content.upload,
      method: 'POST',
      data: formData,
      headers: {
        // Don't set Content-Type for FormData, let browser set it
      }
    });

    this.errorHandler.createNotification({
      type: 'success',
      title: '📤 Upload Complete',
      message: 'Your gaming content is ready to conquer the leaderboards!',
      icon: '🚀'
    });

    return result;
  }

  async getFeaturedContent() {
    return this.get(this.endpoints.content.featured, { cache: true });
  }

  // Leaderboards
  async getUserLeaderboard(timeframe = 'all') {
    const url = `${this.endpoints.leaderboard.users}?timeframe=${timeframe}`;
    return this.get(url, { cache: true });
  }

  async getClanLeaderboard(timeframe = 'all') {
    const url = `${this.endpoints.leaderboard.clans}?timeframe=${timeframe}`;
    return this.get(url, { cache: true });
  }

  async getGlobalLeaderboard() {
    return this.get(this.endpoints.leaderboard.global, { cache: true });
  }

  // System Health
  async checkSystemHealth() {
    return this.get(this.endpoints.system.health);
  }

  async getSystemStats() {
    return this.get(this.endpoints.system.stats, { cache: true });
  }

  async getSystemStatus() {
    return this.get(this.endpoints.system.status, { cache: true });
  }

  // Utility methods
  clearCache(pattern = null) {
    if (this.cacheManager) {
      this.cacheManager.clear(pattern);
      
      // Show performance report
      const report = this.cacheManager.getPerformanceReport();
      console.log('📈 Cache Performance Report:', report);
      
      this.errorHandler.createNotification({
        type: 'success',
        title: '🧹 Cache Cleared',
        message: `Cache cleared. Hit rate was ${report.stats.hitRate}%`,
        icon: '♻️'
      });
    } else {
      this.cache.clear();
      this.errorHandler.createNotification({
        type: 'info',
        title: '🧹 Cache Cleared',
        message: 'Fresh data incoming on next request!',
        icon: '♻️'
      });
    }
  }

  getCacheStats() {
    if (this.cacheManager) {
      const stats = this.cacheManager.getStats();
      const report = this.cacheManager.getPerformanceReport();
      
      return {
        enhanced: true,
        ...stats,
        performance: report,
        recommendations: report.recommendations
      };
    } else {
      return {
        enhanced: false,
        size: this.cache.size,
        entries: Array.from(this.cache.keys()),
        timeout: this.cacheTimeout
      };
    }
  }
  
  // Cache warming for critical data
  async warmCache() {
    if (this.cacheManager) {
      await this.cacheManager.warmCache();
    }
  }
  
  // Intelligent cache refresh
  async refreshCache(url) {
    if (this.cacheManager) {
      const cacheKey = this.cacheManager.generateKey(url);
      return await this.cacheManager.refresh(cacheKey, () => this.get(url));
    }
    return null;
  }

  setAuthToken(token) {
    if (window.MLGAuthManager) {
      if (token) {
        window.MLGAuthManager.setToken(token);
      } else {
        window.MLGAuthManager.clearAuthData();
      }
    } else {
      // Fallback to basic storage
      if (token) {
        localStorage.setItem('mlg_auth_token', token);
      } else {
        localStorage.removeItem('mlg_auth_token');
      }
    }
  }

  getAuthToken() {
    if (window.MLGAuthManager) {
      return window.MLGAuthManager.getToken();
    } else {
      return localStorage.getItem('mlg_auth_token');
    }
  }

  isAuthenticated() {
    if (window.MLGAuthManager) {
      return window.MLGAuthManager.isAuthenticated();
    } else {
      return !!this.getAuthToken();
    }
  }
  
  getCurrentUser() {
    if (window.MLGAuthManager) {
      return window.MLGAuthManager.getCurrentUser();
    } else {
      return null;
    }
  }

  // Batch operations for efficiency
  async batchRequest(requests) {
    const results = await Promise.allSettled(
      requests.map(config => this.request(config))
    );

    return results.map((result, index) => ({
      request: requests[index],
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  }

  // Real-time data with periodic refresh
  startPeriodicRefresh(operation, interval = 30000) {
    const refreshId = setInterval(async () => {
      try {
        await operation();
      } catch (error) {
        console.warn('Periodic refresh failed:', error);
      }
    }, interval);

    return () => clearInterval(refreshId);
  }
}

// Create global instance
window.MLGApiClient = new MLGApiClient();

// Export for ES6 modules
export default MLGApiClient;
export { MLGApiClient };