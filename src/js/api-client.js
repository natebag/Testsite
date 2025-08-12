/**
 * MLG.clan Centralized API Client
 * 
 * This module handles all API interactions for the MLG.clan platform with:
 * - Error handling and retry logic
 * - Caching for performance optimization
 * - Loading states with Xbox 360 aesthetic
 * - Real-time data updates
 * - Fallback for when APIs are unavailable
 */

class MLGApiClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || (window.location.origin + '/api/demo');
    this.timeout = options.timeout || 10000; // 10 second timeout
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000; // 1 second initial delay
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 30000; // 30 second cache
    this.loadingStates = new Map();
    this.callbacks = new Map(); // For real-time updates
    
    // Initialize loading system integration
    this.initializeLoadingSystem();
  }

  initializeLoadingSystem() {
    // Ensure MLG loading system is available
    if (!window.MLG) {
      console.warn('MLG loading system not available, using fallback loading states');
    }
  }

  /**
   * Show loading state with Xbox 360 aesthetic
   */
  showLoading(containerId, options = {}) {
    this.loadingStates.set(containerId, true);
    
    const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!container) return;

    if (window.MLG) {
      window.MLG.show(container, {
        type: 'dashboard',
        message: options.message || 'Loading data...',
        progress: true,
        ...options
      });
    } else {
      // Fallback loading state
      container.innerHTML = `
        <div class="text-center py-8">
          <div class="animate-spin inline-block w-8 h-8 border-4 border-gaming-accent border-r-transparent rounded-full mb-4"></div>
          <p class="text-gaming-accent">${options.message || 'Loading...'}</p>
        </div>
      `;
    }
  }

  /**
   * Hide loading state
   */
  hideLoading(containerId) {
    this.loadingStates.set(containerId, false);
    
    if (window.MLG) {
      window.MLG.hide();
    }
  }

  /**
   * Show error state with Xbox 360 aesthetic
   */
  showError(containerId, error, options = {}) {
    const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!container) return;

    if (window.MLG) {
      window.MLG.showError(container, error, {
        title: options.title || 'Connection Error',
        retry: true,
        onRetry: options.onRetry,
        support: true,
        ...options
      });
    } else {
      // Fallback error state
      container.innerHTML = `
        <div class="text-center py-8 card-glow rounded-xl p-6">
          <div class="text-gaming-red text-4xl mb-4">⚠️</div>
          <h3 class="text-xl font-bold text-gaming-red mb-2">${options.title || 'Error'}</h3>
          <p class="text-gray-400 mb-4">${error.message}</p>
          ${options.onRetry ? `
            <button onclick="${options.onRetry.name || 'location.reload'}()" 
                    class="bg-gaming-accent text-black px-4 py-2 rounded hover:bg-green-400 transition-colors">
              Retry
            </button>
          ` : ''}
        </div>
      `;
    }
  }

  /**
   * Get cached data if available and not expired
   */
  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set cache data with timestamp
   */
  setCache(key, data) {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache for a specific key or all cache
   */
  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Make HTTP request with retry logic and error handling
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const cacheKey = `${options.method || 'GET'}:${url}`;
    
    // Check cache first for GET requests
    if (!options.method || options.method === 'GET') {
      const cached = this.getCached(cacheKey);
      if (cached) {
        console.log(`📦 Cache hit for ${endpoint}`);
        return cached;
      }
    }

    let lastError = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 API Request attempt ${attempt}/${this.maxRetries}: ${endpoint}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        const response = await fetch(url, {
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
          ...options.fetchOptions
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Cache successful GET requests
        if (!options.method || options.method === 'GET') {
          this.setCache(cacheKey, data);
        }
        
        console.log(`✅ API Success: ${endpoint}`);
        return data;

      } catch (error) {
        lastError = error;
        console.warn(`❌ API attempt ${attempt} failed for ${endpoint}:`, error.message);
        
        // Don't retry on certain errors
        if (error.name === 'AbortError' || 
            (error.message.includes('HTTP 4') && !error.message.includes('HTTP 408'))) {
          break;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All attempts failed, throw the last error
    throw new Error(`API request failed after ${this.maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Get platform status and statistics
   */
  async getStatus() {
    try {
      return await this.request('/status');
    } catch (error) {
      console.error('Failed to get platform status:', error);
      // Return fallback data
      return {
        success: false,
        platform: 'MLG.clan',
        status: 'offline',
        systems: {
          backend: 'offline',
          web3: 'disconnected',
          realtime: 'inactive',
          content: 'unavailable',
          mobile: 'offline',
          dao: 'inactive'
        },
        stats: {
          users_online: 0,
          transactions_hour: 0,
          votes_today: 0,
          content_items: 0
        }
      };
    }
  }

  /**
   * Get wallet information
   */
  async getWallet() {
    try {
      return await this.request('/wallet');
    } catch (error) {
      console.error('Failed to get wallet info:', error);
      return {
        success: false,
        wallet: {
          connected: false,
          address: null,
          balance: { sol: 0, mlg: 0 }
        }
      };
    }
  }

  /**
   * Connect wallet (POST request)
   */
  async connectWallet(publicKey) {
    try {
      return await this.request('/wallet/connect', {
        method: 'POST',
        body: { publicKey }
      });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  /**
   * Get voting data
   */
  async getVoting() {
    try {
      return await this.request('/voting');
    } catch (error) {
      console.error('Failed to get voting data:', error);
      return {
        success: false,
        voting: {
          daily_votes_remaining: 0,
          mlg_balance: 0,
          next_vote_cost: 25,
          total_votes_today: 0,
          mlg_burned_today: 0,
          active_voters: 0
        },
        trending_content: []
      };
    }
  }

  /**
   * Get clan information
   */
  async getClans() {
    try {
      return await this.request('/clans');
    } catch (error) {
      console.error('Failed to get clan data:', error);
      return {
        success: false,
        user_clan: null,
        leaderboard: [],
        treasury: {
          balance: 0,
          monthly_income: 0,
          pending_votes: 0
        }
      };
    }
  }

  /**
   * Get content data
   */
  async getContent() {
    try {
      return await this.request('/content');
    } catch (error) {
      console.error('Failed to get content data:', error);
      return {
        success: false,
        platforms: {},
        trending: [],
        analytics: {
          total_views_today: "0",
          engagement_rate: "0",
          new_creators: 0
        }
      };
    }
  }

  /**
   * Get DAO governance data
   */
  async getDao() {
    try {
      return await this.request('/dao');
    } catch (error) {
      console.error('Failed to get DAO data:', error);
      return {
        success: false,
        treasury: {
          total_assets: "$0",
          mlg_tokens: "0",
          monthly_revenue: "$0"
        },
        governance: {
          active_proposals: 0,
          total_voters: 0,
          participation_rate: 0
        },
        user_voting: {
          mlg_holdings: 0,
          voting_weight: 0,
          proposals_voted: 0
        },
        proposals: []
      };
    }
  }

  /**
   * Get analytics data
   */
  async getAnalytics() {
    try {
      return await this.request('/analytics');
    } catch (error) {
      console.error('Failed to get analytics data:', error);
      return {
        success: false,
        metrics: {
          daily_active_users: 0,
          transactions: "0",
          revenue_30d: "$0",
          active_clans: 0
        },
        gaming_activity: {
          votes_cast_today: 0,
          content_submissions: 0,
          clan_battles: 0,
          tournaments_active: 0
        },
        token_metrics: {
          mlg_burned_today: 0,
          mlg_earned_today: 0,
          average_vote_cost: 25,
          token_velocity: 0
        },
        growth: {
          user_retention_7d: 0,
          revenue_per_user: "$0",
          user_satisfaction: 0
        }
      };
    }
  }

  /**
   * Record a vote transaction (POST request)
   */
  async recordVote(voteData) {
    try {
      return await this.request('/voting/record', {
        method: 'POST',
        body: voteData
      });
    } catch (error) {
      console.error('Failed to record vote:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get vote count for specific content
   */
  async getVoteCount(contentId) {
    try {
      return await this.request(`/voting/count/${contentId}`);
    } catch (error) {
      console.error('Failed to get vote count:', error);
      return {
        success: false,
        count: Math.floor(Math.random() * 1000) + 100, // Fallback random count
        contentId: contentId
      };
    }
  }

  /**
   * Get active votes data
   */
  async getActiveVotes() {
    try {
      return await this.request('/voting/active');
    } catch (error) {
      console.error('Failed to get active votes:', error);
      return {
        success: false,
        votes: {},
        total_active: 0
      };
    }
  }

  /**
   * Get user profile data
   */
  async getUserProfile() {
    try {
      return await this.request('/user/profile');
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return {
        success: false,
        profile: {
          dailyVotesRemaining: 4,
          votesToday: 0,
          mlgBalance: 1250
        }
      };
    }
  }

  /**
   * Get system status data
   */
  async getSystemStatus() {
    try {
      return await this.request('/system/status');
    } catch (error) {
      console.error('Failed to get system status:', error);
      return {
        success: false,
        status: 'offline',
        services: []
      };
    }
  }

  /**
   * Get mobile app data
   */
  async getMobile() {
    try {
      return await this.request('/mobile');
    } catch (error) {
      console.error('Failed to get mobile data:', error);
      return {
        success: false,
        app_performance: {
          ios_rating: 0,
          android_rating: 0,
          downloads: "0",
          daily_users: 0
        },
        features: {
          phantom_wallet: "unavailable",
          biometric_auth: "disabled",
          offline_mode: "unavailable",
          push_notifications: "disabled"
        },
        development_status: {
          ios_version: "v0.0.0",
          android_version: "v0.0.0",
          beta_testers: 0,
          app_store_status: "development"
        }
      };
    }
  }

  /**
   * Start real-time updates for a specific endpoint
   */
  startRealTimeUpdates(endpoint, callback, interval = 5000) {
    const key = `realtime:${endpoint}`;
    
    // Clear existing interval if any
    this.stopRealTimeUpdates(endpoint);
    
    const intervalId = setInterval(async () => {
      try {
        // Clear cache to get fresh data
        this.clearCache(`GET:${this.baseUrl}${endpoint}`);
        const data = await this.request(endpoint);
        callback(data);
      } catch (error) {
        console.warn(`Real-time update failed for ${endpoint}:`, error.message);
      }
    }, interval);
    
    this.callbacks.set(key, intervalId);
    console.log(`🔄 Started real-time updates for ${endpoint} (${interval}ms)`);
  }

  /**
   * Stop real-time updates for a specific endpoint
   */
  stopRealTimeUpdates(endpoint) {
    const key = `realtime:${endpoint}`;
    const intervalId = this.callbacks.get(key);
    
    if (intervalId) {
      clearInterval(intervalId);
      this.callbacks.delete(key);
      console.log(`⏹️ Stopped real-time updates for ${endpoint}`);
    }
  }

  /**
   * Stop all real-time updates
   */
  stopAllRealTimeUpdates() {
    for (const [key, intervalId] of this.callbacks) {
      if (key.startsWith('realtime:')) {
        clearInterval(intervalId);
      }
    }
    this.callbacks.clear();
    console.log('⏹️ Stopped all real-time updates');
  }

  /**
   * Health check - test if the API is available
   */
  async healthCheck() {
    try {
      const response = await this.request('/status');
      return response.success === true;
    } catch (error) {
      return false;
    }
  }
}

// Export for both module and global use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MLGApiClient;
} else {
  window.MLGApiClient = MLGApiClient;
}

// Create global instance
window.mlgApi = new MLGApiClient();
window.MLGApiClient = MLGApiClient;

console.log('🚀 MLG API Client initialized and available globally as window.mlgApi');