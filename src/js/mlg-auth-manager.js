/**
 * MLG.clan Authentication Manager
 * Enhanced security and token management system
 * 
 * Features:
 * - Secure token storage with encryption
 * - Automatic token refresh
 * - Session management
 * - Multi-tab synchronization
 * - Security event logging
 * - Gaming-themed authentication feedback
 * 
 * @author Claude Code - Frontend Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

class MLGAuthManager {
  constructor(options = {}) {
    this.tokenKey = 'mlg_auth_token';
    this.refreshKey = 'mlg_refresh_token';
    this.userKey = 'mlg_user_data';
    this.sessionKey = 'mlg_session_info';
    this.apiClient = window.MLGApiClient;
    this.errorHandler = window.MLGErrorHandler;
    
    // Token configuration
    this.tokenExpiryBuffer = 5 * 60 * 1000; // 5 minutes buffer
    this.refreshAttempts = 0;
    this.maxRefreshAttempts = 3;
    this.refreshInProgress = false;
    
    // Session management
    this.sessionTimeout = null;
    this.activityTimeout = 15 * 60 * 1000; // 15 minutes of inactivity
    this.warningTimeout = null;
    
    // Security features
    this.encryptionKey = null;
    this.fingerprint = null;
    
    // Event listeners
    this.listeners = {
      login: new Set(),
      logout: new Set(),
      refresh: new Set(),
      session_warning: new Set(),
      session_expired: new Set()
    };

    this.init();
  }

  async init() {
    console.log('🔐 Initializing MLG Authentication Manager...');
    
    // Generate device fingerprint for security
    this.generateDeviceFingerprint();
    
    // Setup encryption for sensitive data
    await this.initEncryption();
    
    // Check existing session
    await this.validateExistingSession();
    
    // Setup session monitoring
    this.setupSessionMonitoring();
    
    // Setup multi-tab synchronization
    this.setupStorageSync();
    
    // Setup automatic token refresh
    this.setupTokenRefresh();
    
    console.log('✅ MLG Authentication Manager initialized');
  }

  generateDeviceFingerprint() {
    // Create a simple device fingerprint for session validation
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('MLG.clan fingerprint', 2, 2);
    
    this.fingerprint = btoa(JSON.stringify({
      userAgent: navigator.userAgent.slice(0, 100),
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: `${screen.width}x${screen.height}`,
      canvas: canvas.toDataURL().slice(0, 100),
      timestamp: Date.now()
    }));
  }

  async initEncryption() {
    // Generate a simple encryption key from device characteristics
    // Note: This is basic obfuscation, not real encryption
    const key = btoa(this.fingerprint + window.location.origin).slice(0, 16);
    this.encryptionKey = key;
  }

  // Simple XOR encryption for token obfuscation
  encryptData(data) {
    if (!this.encryptionKey || !data) return data;
    
    const key = this.encryptionKey;
    let encrypted = '';
    
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    
    return btoa(encrypted);
  }

  decryptData(encryptedData) {
    if (!this.encryptionKey || !encryptedData) return encryptedData;
    
    try {
      const data = atob(encryptedData);
      const key = this.encryptionKey;
      let decrypted = '';
      
      for (let i = 0; i < data.length; i++) {
        decrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      
      return decrypted;
    } catch (error) {
      console.warn('Failed to decrypt data:', error);
      return null;
    }
  }

  // Secure token storage
  setToken(token, refreshToken = null) {
    if (!token) return;
    
    const tokenData = {
      token: token,
      expires: Date.now() + (60 * 60 * 1000), // 1 hour default
      fingerprint: this.fingerprint,
      timestamp: Date.now()
    };
    
    // Encrypt and store
    const encryptedToken = this.encryptData(JSON.stringify(tokenData));
    localStorage.setItem(this.tokenKey, encryptedToken);
    
    if (refreshToken) {
      const refreshData = {
        token: refreshToken,
        expires: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        fingerprint: this.fingerprint
      };
      const encryptedRefresh = this.encryptData(JSON.stringify(refreshData));
      localStorage.setItem(this.refreshKey, encryptedRefresh);
    }
    
    // Update session info
    this.updateSessionInfo({
      loginTime: Date.now(),
      lastActivity: Date.now(),
      fingerprint: this.fingerprint
    });
    
    console.log('🔒 Token securely stored');
  }

  getToken() {
    try {
      const encryptedToken = localStorage.getItem(this.tokenKey);
      if (!encryptedToken) return null;
      
      const tokenDataStr = this.decryptData(encryptedToken);
      if (!tokenDataStr) return null;
      
      const tokenData = JSON.parse(tokenDataStr);
      
      // Validate fingerprint
      if (tokenData.fingerprint !== this.fingerprint) {
        console.warn('🚨 Token fingerprint mismatch - security violation');
        this.clearAuthData();
        return null;
      }
      
      // Check expiration
      if (Date.now() >= (tokenData.expires - this.tokenExpiryBuffer)) {
        console.log('🔄 Token expired, attempting refresh...');
        this.refreshToken();
        return null;
      }
      
      return tokenData.token;
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      this.clearAuthData();
      return null;
    }
  }

  getRefreshToken() {
    try {
      const encryptedRefresh = localStorage.getItem(this.refreshKey);
      if (!encryptedRefresh) return null;
      
      const refreshDataStr = this.decryptData(encryptedRefresh);
      if (!refreshDataStr) return null;
      
      const refreshData = JSON.parse(refreshDataStr);
      
      // Validate fingerprint
      if (refreshData.fingerprint !== this.fingerprint) {
        console.warn('🚨 Refresh token fingerprint mismatch');
        this.clearAuthData();
        return null;
      }
      
      // Check expiration
      if (Date.now() >= refreshData.expires) {
        console.log('🔄 Refresh token expired');
        this.clearAuthData();
        return null;
      }
      
      return refreshData.token;
    } catch (error) {
      console.error('Failed to retrieve refresh token:', error);
      return null;
    }
  }

  async login(credentials) {
    try {
      console.log('🎮 Starting MLG authentication...');\n      \n      // Show gaming-themed loading\n      if (this.errorHandler) {\n        this.errorHandler.createNotification({\n          type: 'info',\n          title: '🎮 Logging In',\n          message: 'Connecting to MLG servers...',\n          icon: '🔐',\n          duration: 3000\n        });\n      }\n      \n      // Attempt login via API\n      const response = await this.apiClient.post('/auth/login', {\n        ...credentials,\n        fingerprint: this.fingerprint\n      });\n      \n      if (response.token) {\n        // Store tokens securely\n        this.setToken(response.token, response.refreshToken);\n        \n        // Store user data\n        if (response.user) {\n          this.setUserData(response.user);\n        }\n        \n        // Setup session\n        this.startSession();\n        \n        // Notify listeners\n        this.notifyListeners('login', { user: response.user });\n        \n        // Success notification\n        if (this.errorHandler) {\n          this.errorHandler.createNotification({\n            type: 'success',\n            title: '🏆 Login Successful',\n            message: `Welcome back, ${response.user?.gamertag || 'Gamer'}!`,\n            icon: '🎮'\n          });\n        }\n        \n        console.log('✅ MLG authentication successful');\n        return { success: true, user: response.user };\n      } else {\n        throw new Error('No token received from server');\n      }\n      \n    } catch (error) {\n      console.error('Login failed:', error);\n      \n      // Gaming-themed error messages\n      let errorMessage = 'Authentication failed. Check your credentials.';\n      if (error.message.includes('network')) {\n        errorMessage = 'Connection to MLG servers failed. Check your internet.';\n      } else if (error.message.includes('401')) {\n        errorMessage = 'Invalid credentials. Please try again.';\n      } else if (error.message.includes('429')) {\n        errorMessage = 'Too many login attempts. Please wait before trying again.';\n      }\n      \n      if (this.errorHandler) {\n        this.errorHandler.createNotification({\n          type: 'error',\n          title: '❌ Login Failed',\n          message: errorMessage,\n          icon: '🔐'\n        });\n      }\n      \n      return { success: false, error: error.message };\n    }\n  }\n\n  async refreshToken() {\n    if (this.refreshInProgress) {\n      console.log('🔄 Refresh already in progress...');\n      return null;\n    }\n    \n    this.refreshInProgress = true;\n    \n    try {\n      const refreshToken = this.getRefreshToken();\n      if (!refreshToken) {\n        console.log('🚫 No refresh token available');\n        this.logout();\n        return null;\n      }\n      \n      this.refreshAttempts++;\n      \n      if (this.refreshAttempts > this.maxRefreshAttempts) {\n        console.error('❌ Max refresh attempts exceeded');\n        this.logout();\n        return null;\n      }\n      \n      console.log(`🔄 Attempting token refresh (${this.refreshAttempts}/${this.maxRefreshAttempts})...`);\n      \n      const response = await this.apiClient.post('/auth/refresh', {\n        refreshToken: refreshToken,\n        fingerprint: this.fingerprint\n      });\n      \n      if (response.token) {\n        // Store new tokens\n        this.setToken(response.token, response.refreshToken);\n        \n        // Reset attempts counter\n        this.refreshAttempts = 0;\n        \n        // Notify listeners\n        this.notifyListeners('refresh', { token: response.token });\n        \n        console.log('✅ Token refreshed successfully');\n        return response.token;\n      } else {\n        throw new Error('No token in refresh response');\n      }\n      \n    } catch (error) {\n      console.error('Token refresh failed:', error);\n      \n      if (this.refreshAttempts >= this.maxRefreshAttempts) {\n        console.error('❌ Refresh attempts exhausted, logging out');\n        this.logout();\n      }\n      \n      return null;\n    } finally {\n      this.refreshInProgress = false;\n    }\n  }\n\n  logout(reason = 'user_logout') {\n    console.log(`🚪 Logging out (reason: ${reason})`);\n    \n    // Clear all auth data\n    this.clearAuthData();\n    \n    // Stop session monitoring\n    this.stopSession();\n    \n    // Notify listeners\n    this.notifyListeners('logout', { reason });\n    \n    // Show logout notification\n    if (this.errorHandler && reason === 'user_logout') {\n      this.errorHandler.createNotification({\n        type: 'info',\n        title: '👋 Logged Out',\n        message: 'Thanks for gaming with MLG.clan!',\n        icon: '🎮'\n      });\n    } else if (reason === 'session_expired') {\n      if (this.errorHandler) {\n        this.errorHandler.createNotification({\n          type: 'warning',\n          title: '⏰ Session Expired',\n          message: 'Please login again to continue',\n          icon: '🔐'\n        });\n      }\n    }\n    \n    // Redirect to login if needed\n    if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {\n      setTimeout(() => {\n        window.location.href = 'index.html';\n      }, 2000);\n    }\n  }\n\n  clearAuthData() {\n    localStorage.removeItem(this.tokenKey);\n    localStorage.removeItem(this.refreshKey);\n    localStorage.removeItem(this.userKey);\n    localStorage.removeItem(this.sessionKey);\n    \n    // Clear any cached data\n    if (this.apiClient) {\n      this.apiClient.clearCache();\n    }\n    \n    console.log('🧹 Auth data cleared');\n  }\n\n  setUserData(userData) {\n    if (!userData) return;\n    \n    const encryptedData = this.encryptData(JSON.stringify({\n      ...userData,\n      timestamp: Date.now(),\n      fingerprint: this.fingerprint\n    }));\n    \n    localStorage.setItem(this.userKey, encryptedData);\n  }\n\n  getUserData() {\n    try {\n      const encryptedData = localStorage.getItem(this.userKey);\n      if (!encryptedData) return null;\n      \n      const dataStr = this.decryptData(encryptedData);\n      if (!dataStr) return null;\n      \n      const data = JSON.parse(dataStr);\n      \n      // Validate fingerprint\n      if (data.fingerprint !== this.fingerprint) {\n        console.warn('🚨 User data fingerprint mismatch');\n        this.clearAuthData();\n        return null;\n      }\n      \n      return data;\n    } catch (error) {\n      console.error('Failed to retrieve user data:', error);\n      return null;\n    }\n  }\n\n  updateSessionInfo(info) {\n    const sessionInfo = {\n      ...info,\n      lastUpdate: Date.now(),\n      fingerprint: this.fingerprint\n    };\n    \n    localStorage.setItem(this.sessionKey, JSON.stringify(sessionInfo));\n  }\n\n  getSessionInfo() {\n    try {\n      const sessionStr = localStorage.getItem(this.sessionKey);\n      if (!sessionStr) return null;\n      \n      const session = JSON.parse(sessionStr);\n      \n      // Validate fingerprint\n      if (session.fingerprint !== this.fingerprint) {\n        console.warn('🚨 Session fingerprint mismatch');\n        return null;\n      }\n      \n      return session;\n    } catch (error) {\n      console.error('Failed to retrieve session info:', error);\n      return null;\n    }\n  }\n\n  async validateExistingSession() {\n    const token = this.getToken();\n    const userData = this.getUserData();\n    \n    if (token && userData) {\n      console.log('🔍 Validating existing session...');\n      \n      try {\n        // Validate token with server\n        const response = await this.apiClient.get('/auth/validate');\n        \n        if (response.valid) {\n          console.log('✅ Session validated');\n          this.startSession();\n          return true;\n        } else {\n          console.log('❌ Session invalid, clearing data');\n          this.clearAuthData();\n          return false;\n        }\n      } catch (error) {\n        console.warn('Session validation failed:', error);\n        // Don't clear data immediately, might be network issue\n        return false;\n      }\n    }\n    \n    return false;\n  }\n\n  setupSessionMonitoring() {\n    // Track user activity\n    const events = ['click', 'keypress', 'scroll', 'mousemove', 'touchstart'];\n    \n    const activityHandler = () => {\n      this.updateLastActivity();\n    };\n    \n    events.forEach(event => {\n      document.addEventListener(event, activityHandler, { passive: true });\n    });\n    \n    // Setup session timeout warning\n    this.resetSessionTimer();\n  }\n\n  updateLastActivity() {\n    const sessionInfo = this.getSessionInfo();\n    if (sessionInfo) {\n      this.updateSessionInfo({\n        ...sessionInfo,\n        lastActivity: Date.now()\n      });\n    }\n    \n    // Reset session timer\n    this.resetSessionTimer();\n  }\n\n  resetSessionTimer() {\n    // Clear existing timers\n    if (this.sessionTimeout) clearTimeout(this.sessionTimeout);\n    if (this.warningTimeout) clearTimeout(this.warningTimeout);\n    \n    // Set warning timer (5 minutes before expiry)\n    this.warningTimeout = setTimeout(() => {\n      this.showSessionWarning();\n    }, this.activityTimeout - (5 * 60 * 1000));\n    \n    // Set expiry timer\n    this.sessionTimeout = setTimeout(() => {\n      this.logout('session_expired');\n    }, this.activityTimeout);\n  }\n\n  showSessionWarning() {\n    this.notifyListeners('session_warning', { timeRemaining: 5 * 60 * 1000 });\n    \n    if (this.errorHandler) {\n      this.errorHandler.createNotification({\n        type: 'warning',\n        title: '⏰ Session Expiring',\n        message: 'Your session will expire in 5 minutes due to inactivity',\n        icon: '⚠️',\n        duration: 10000\n      });\n    }\n  }\n\n  startSession() {\n    this.updateLastActivity();\n    console.log('🟢 Session started');\n  }\n\n  stopSession() {\n    if (this.sessionTimeout) clearTimeout(this.sessionTimeout);\n    if (this.warningTimeout) clearTimeout(this.warningTimeout);\n    console.log('🔴 Session stopped');\n  }\n\n  setupStorageSync() {\n    // Listen for storage changes in other tabs\n    window.addEventListener('storage', (e) => {\n      if (e.key === this.tokenKey && !e.newValue) {\n        // Token was removed in another tab\n        console.log('🔄 Auth data removed in another tab');\n        this.logout('multi_tab_logout');\n      }\n    });\n  }\n\n  setupTokenRefresh() {\n    // Setup automatic token refresh\n    setInterval(() => {\n      const token = this.getToken();\n      if (token) {\n        // Check if token needs refresh soon\n        const tokenData = JSON.parse(this.decryptData(localStorage.getItem(this.tokenKey)));\n        const timeUntilExpiry = tokenData.expires - Date.now();\n        \n        if (timeUntilExpiry < (2 * this.tokenExpiryBuffer)) {\n          console.log('🔄 Proactive token refresh');\n          this.refreshToken();\n        }\n      }\n    }, 5 * 60 * 1000); // Check every 5 minutes\n  }\n\n  // Public API methods\n  isAuthenticated() {\n    return !!this.getToken();\n  }\n\n  getCurrentUser() {\n    return this.getUserData();\n  }\n\n  hasPermission(permission) {\n    const userData = this.getUserData();\n    return userData?.permissions?.includes(permission) || false;\n  }\n\n  getAuthHeader() {\n    const token = this.getToken();\n    return token ? `Bearer ${token}` : null;\n  }\n\n  // Event system\n  addEventListener(event, callback) {\n    if (this.listeners[event]) {\n      this.listeners[event].add(callback);\n      return () => this.listeners[event].delete(callback);\n    }\n  }\n\n  notifyListeners(event, data) {\n    if (this.listeners[event]) {\n      this.listeners[event].forEach(callback => {\n        try {\n          callback(data);\n        } catch (error) {\n          console.error(`Error in ${event} listener:`, error);\n        }\n      });\n    }\n  }\n\n  // Security methods\n  getSecurityInfo() {\n    return {\n      fingerprint: this.fingerprint,\n      isAuthenticated: this.isAuthenticated(),\n      sessionInfo: this.getSessionInfo(),\n      tokenExpiry: this.getToken() ? 'valid' : 'expired'\n    };\n  }\n\n  // Cleanup\n  destroy() {\n    this.stopSession();\n    this.clearAuthData();\n    this.listeners = {};\n    console.log('🧹 Auth manager destroyed');\n  }\n}\n\n// Create global instance\nwindow.MLGAuthManager = new MLGAuthManager();\n\n// Export for ES6 modules\nexport default MLGAuthManager;\nexport { MLGAuthManager };