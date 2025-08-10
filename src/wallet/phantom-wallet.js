/**
 * Phantom Wallet Integration for MLG.clan Platform
 * 
 * This module provides secure wallet detection, connection, and session management
 * following Solana wallet adapter patterns and security best practices.
 * 
 * Security Features:
 * - Read-only wallet connections (never requests private keys)
 * - Proper error handling and user feedback
 * - Robust session persistence with secure storage
 * - Automatic reconnection with timeout handling
 * - Connection state validation and recovery
 * - Session expiration and inactivity management
 * - Account change detection and security measures
 * - User preferences and settings persistence
 * - Comprehensive disconnection and cleanup handling
 * - Security audit logging for disconnection events
 * - Cross-tab session management and cleanup
 * - Multiple disconnection scenarios (user, emergency, clean, reset)
 * 
 * Disconnection Usage Examples:
 * 
 * // Standard user disconnect (keeps preferences)
 * await walletManager.disconnectUser();
 * 
 * // Emergency security disconnect
 * await walletManager.emergencyDisconnect('suspicious_activity');
 * 
 * // Clean disconnect for account switching
 * await walletManager.cleanDisconnect();
 * 
 * // Complete reset (nuclear option)
 * await walletManager.resetWallet();
 * 
 * // Standard logout
 * await walletManager.logout();
 * 
 * // Custom disconnect with specific options
 * await walletManager.disconnect({
 *   reason: 'custom_reason',
 *   clearPreferences: false,
 *   clearUserData: true,
 *   forced: false
 * });
 */

import { 
  Connection, 
  PublicKey, 
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { createConnection, CURRENT_NETWORK, WALLET_CONFIG } from '../../config/solana-config.js';

/**
 * Session Storage Keys for different types of data
 */
const SESSION_KEYS = {
  WALLET_SESSION: 'mlg_clan_wallet_session',
  USER_PREFERENCES: 'mlg_clan_user_preferences', 
  SESSION_ACTIVITY: 'mlg_clan_session_activity',
  CONNECTION_ATTEMPTS: 'mlg_clan_connection_attempts'
};

/**
 * Session Configuration
 */
const SESSION_CONFIG = {
  INACTIVITY_TIMEOUT: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
  SESSION_REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
  MAX_RECONNECTION_ATTEMPTS: 3,
  RECONNECTION_DELAY: 2000, // 2 seconds
  ACTIVITY_TRACKING_EVENTS: ['click', 'keypress', 'mousemove', 'touchstart'],
  SESSION_STORAGE_PREFIX: 'mlg_session_'
};

/**
 * Error Handling Configuration
 */
const ERROR_CONFIG = {
  MAX_RETRY_ATTEMPTS: 3,
  INITIAL_RETRY_DELAY: 1000, // 1 second
  MAX_RETRY_DELAY: 10000, // 10 seconds
  CONNECTION_TIMEOUT: 30000, // 30 seconds
  RPC_TIMEOUT: 15000, // 15 seconds
  VALIDATION_TIMEOUT: 10000, // 10 seconds
  RATE_LIMIT_BACKOFF: 5000, // 5 seconds
  HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
  BROWSER_COMPATIBILITY_CHECK: true
};

/**
 * Error Types and Codes
 */
const ERROR_TYPES = {
  WALLET_NOT_INSTALLED: 'WALLET_NOT_INSTALLED',
  WALLET_NOT_AVAILABLE: 'WALLET_NOT_AVAILABLE',
  USER_REJECTED: 'USER_REJECTED',
  CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
  WALLET_LOCKED: 'WALLET_LOCKED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  RPC_ERROR: 'RPC_ERROR',
  TRANSACTION_ERROR: 'TRANSACTION_ERROR',
  BROWSER_INCOMPATIBLE: 'BROWSER_INCOMPATIBLE',
  RATE_LIMITED: 'RATE_LIMITED',
  PHANTOM_ERROR: 'PHANTOM_ERROR',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

/**
 * User-friendly error messages
 */
const ERROR_MESSAGES = {
  [ERROR_TYPES.WALLET_NOT_INSTALLED]: {
    title: 'Phantom Wallet Not Found',
    message: 'Please install Phantom wallet from phantom.app and refresh this page.',
    action: 'Install Phantom',
    actionUrl: 'https://phantom.app'
  },
  [ERROR_TYPES.WALLET_NOT_AVAILABLE]: {
    title: 'Wallet Unavailable',
    message: 'Phantom wallet is installed but not responding. Please refresh the page or restart your browser.',
    action: 'Refresh Page'
  },
  [ERROR_TYPES.USER_REJECTED]: {
    title: 'Connection Cancelled',
    message: 'You cancelled the wallet connection. Click "Connect Wallet" to try again.',
    action: 'Try Again'
  },
  [ERROR_TYPES.CONNECTION_TIMEOUT]: {
    title: 'Connection Timeout',
    message: 'The connection took too long. Please check your internet connection and try again.',
    action: 'Retry Connection'
  },
  [ERROR_TYPES.WALLET_LOCKED]: {
    title: 'Wallet Locked',
    message: 'Please unlock your Phantom wallet and try connecting again.',
    action: 'Unlock Wallet'
  },
  [ERROR_TYPES.NETWORK_ERROR]: {
    title: 'Network Connection Error',
    message: 'Unable to connect to the Solana network. Please check your internet connection.',
    action: 'Check Connection'
  },
  [ERROR_TYPES.RPC_ERROR]: {
    title: 'Network Service Error',
    message: 'The Solana network is experiencing issues. Please try again in a moment.',
    action: 'Try Again'
  },
  [ERROR_TYPES.BROWSER_INCOMPATIBLE]: {
    title: 'Browser Not Supported',
    message: 'Your browser doesn\'t support wallet connections. Please use Chrome, Firefox, or Edge.',
    action: 'Switch Browser'
  },
  [ERROR_TYPES.RATE_LIMITED]: {
    title: 'Too Many Requests',
    message: 'Please wait a moment before trying to connect again.',
    action: 'Wait and Retry'
  },
  [ERROR_TYPES.CONNECTION_FAILED]: {
    title: 'Connection Failed',
    message: 'Failed to establish a secure connection. Please try again.',
    action: 'Retry'
  },
  [ERROR_TYPES.UNKNOWN_ERROR]: {
    title: 'Connection Error',
    message: 'An unexpected error occurred. Please try again or contact support.',
    action: 'Try Again'
  }
};

/**
 * PhantomWalletManager - Handles all Phantom wallet interactions with enhanced session persistence
 */
export class PhantomWalletManager {
  constructor() {
    this.adapter = null;
    this.connection = null;
    this.isConnecting = false;
    this.isConnected = false;
    this.publicKey = null;
    this.listeners = new Map();
    
    // Session management properties
    this.sessionTimeout = null;
    this.sessionRefreshInterval = null;
    this.lastActivity = Date.now();
    this.reconnectionAttempts = 0;
    this.userPreferences = {};
    this.sessionData = null;
    this.activityListeners = [];
    
    // Additional cleanup properties
    this.reconnectionTimer = null;
    this.connectionTimer = null;
    this.pendingConnection = null;
    this.pendingBalanceRequest = null;
    this.balanceCache = new Map();
    this.transactionCache = new Map();
    
    // Error handling and retry properties
    this.retryAttempts = 0;
    this.lastError = null;
    this.errorHistory = [];
    this.healthCheckTimer = null;
    this.rateLimitUntil = null;
    this.fallbackRpcProviders = [];
    this.currentRpcIndex = 0;
    this.connectionHealth = {
      isHealthy: false,
      lastCheck: Date.now(),
      rpcLatency: null,
      errorCount: 0,
      consecutiveFailures: 0
    };
    
    // Browser compatibility flags
    this.browserSupport = this.checkBrowserCompatibility();
    
    // Initialize connection with error handling (async)
    this.initializeConnection().catch(error => {
      console.error('Connection initialization failed:', error);
    });
    
    this.init();
  }

  /**
   * Initialize connection with comprehensive error handling and network validation
   */
  async initializeConnection() {
    try {
      // Validate the target network
      if (!this.validateTargetNetwork(this.currentNetwork)) {
        throw new Error(`Unsupported network: ${this.currentNetwork}`);
      }
      
      // Create connection with network validation
      this.connection = await this.createValidatedConnection(this.currentNetwork);
      
      // Verify RPC endpoint health
      await this.validateRpcEndpoint(this.connection);
      
      // Update connection health
      this.connectionHealth.isHealthy = true;
      this.connectionHealth.errorCount = 0;
      
      // Start network monitoring
      this.startNetworkMonitoring();
      
      console.log(`Solana connection initialized successfully on ${this.currentNetwork}`);
      
      return this.connection;
      
    } catch (error) {
      console.error('Failed to initialize Solana connection:', error);
      this.handleConnectionError(error);
      // Don't throw here, let the app continue and retry later
      this.scheduleConnectionRetry();
      return null;
    }
  }

  /**
   * Check browser compatibility for wallet operations
   */
  checkBrowserCompatibility() {
    if (typeof window === 'undefined') {
      return { isCompatible: false, issues: ['Server-side environment'] };
    }

    const issues = [];
    let isCompatible = true;

    // Check for basic Web APIs
    if (!window.localStorage) {
      issues.push('LocalStorage not available');
      isCompatible = false;
    }

    if (!window.crypto || !window.crypto.subtle) {
      issues.push('Web Crypto API not available');
      isCompatible = false;
    }

    // Check for modern JavaScript features
    try {
      new Promise(() => {});
    } catch (error) {
      issues.push('Promise support required');
      isCompatible = false;
    }

    // Check for fetch API
    if (!window.fetch) {
      issues.push('Fetch API not available');
      isCompatible = false;
    }

    // Detect potential issues with specific browsers
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.includes('internet explorer')) {
      issues.push('Internet Explorer is not supported');
      isCompatible = false;
    }

    return { isCompatible, issues, userAgent };
  }

  /**
   * Initialize the Phantom wallet adapter with enhanced session management and error handling
   */
  init() {
    try {
      // Check browser compatibility first
      if (!this.browserSupport.isCompatible) {
        const error = this.createWalletError(ERROR_TYPES.BROWSER_INCOMPATIBLE, 
          `Browser compatibility issues: ${this.browserSupport.issues.join(', ')}`
        );
        this.handleError(error);
        return; // Don't continue initialization
      }

      // Initialize adapter with error handling
      try {
        this.adapter = new PhantomWalletAdapter();
        this.setupEventListeners();
      } catch (adapterError) {
        console.error('Failed to initialize Phantom adapter:', adapterError);
        const error = this.createWalletError(ERROR_TYPES.WALLET_NOT_AVAILABLE, 
          'Failed to initialize Phantom wallet adapter'
        );
        this.handleError(error);
        // Continue with initialization even if adapter fails initially
      }
      
      // Load user preferences
      this.loadUserPreferences();
      
      // Setup activity tracking for session management
      this.setupActivityTracking();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      // Check for existing session and attempt restoration
      const sessionRestored = this.restoreSession();
      
      // Start session refresh interval
      this.startSessionRefresh();
      
      // Attempt auto-reconnection if session was found
      if (sessionRestored && this.userPreferences.autoReconnect !== false) {
        this.attemptAutoReconnectWithRetry();
      }
      
    } catch (error) {
      console.error('Failed to initialize wallet manager:', error);
      const walletError = this.createWalletError(ERROR_TYPES.UNKNOWN_ERROR, 
        'Wallet manager initialization failed'
      );
      this.handleError(walletError);
    }
  }

  /**
   * Setup wallet adapter event listeners
   */
  setupEventListeners() {
    if (!this.adapter) return;

    // Connection events
    this.adapter.on('connect', this.handleConnect.bind(this));
    this.adapter.on('disconnect', this.handleDisconnect.bind(this));
    this.adapter.on('error', this.handleError.bind(this));
    
    // Account change events (for security)
    this.adapter.on('accountChanged', this.handleAccountChanged.bind(this));
  }

  /**
   * Check if Phantom wallet is available in the browser
   * @returns {boolean} True if Phantom is detected
   */
  static isPhantomAvailable() {
    if (typeof window === 'undefined') return false;
    
    return !!(
      window.solana && 
      window.solana.isPhantom &&
      window.solana.connect &&
      typeof window.solana.connect === 'function'
    );
  }

  /**
   * Get wallet availability status with detailed information and session data
   * @returns {Object} Wallet availability details
   */
  getWalletStatus() {
    const isAvailable = PhantomWalletManager.isPhantomAvailable();
    
    return {
      isAvailable,
      isInstalled: isAvailable,
      isConnecting: this.isConnecting,
      isConnected: this.isConnected,
      publicKey: this.publicKey?.toBase58() || null,
      network: CURRENT_NETWORK,
      adapter: this.adapter?.name || null,
      canConnect: isAvailable && !this.isConnecting && !this.isConnected,
      
      // Session information
      hasSession: !!this.sessionData,
      lastActivity: this.lastActivity,
      timeSinceActivity: Date.now() - this.lastActivity,
      reconnectionAttempts: this.reconnectionAttempts,
      autoReconnectEnabled: this.userPreferences.autoReconnect,
      sessionTimeout: this.userPreferences.sessionTimeout || SESSION_CONFIG.INACTIVITY_TIMEOUT
    };
  }

  /**
   * Connect to Phantom wallet with comprehensive error handling and retry logic
   * @param {Object} options - Connection options
   * @returns {Promise<Object>} Connection result
   */
  async connect(options = {}) {
    const { 
      onlyIfTrusted = false, 
      autoApprove = false,
      timeout = ERROR_CONFIG.CONNECTION_TIMEOUT,
      skipRetry = false
    } = options;

    try {
      // Pre-connection validation with detailed error handling
      await this.validatePreConnectionRequirements();

      // Check if already connected
      if (this.isConnected) {
        return this.getConnectionInfo();
      }

      // Check if connection is already in progress
      if (this.isConnecting) {
        const error = this.createWalletError(ERROR_TYPES.CONNECTION_FAILED, 
          'Connection already in progress'
        );
        throw error;
      }

      // Check rate limiting
      if (this.isRateLimited()) {
        const waitTime = Math.ceil((this.rateLimitUntil - Date.now()) / 1000);
        const error = this.createWalletError(ERROR_TYPES.RATE_LIMITED, 
          `Please wait ${waitTime} seconds before trying again`
        );
        throw error;
      }

      return await this.performConnection(options);

    } catch (error) {
      this.recordError(error);
      
      // Attempt retry if enabled and not explicitly skipped
      if (!skipRetry && this.shouldRetryConnection(error)) {
        console.log(`Connection failed, attempting retry (${this.retryAttempts + 1}/${ERROR_CONFIG.MAX_RETRY_ATTEMPTS})`);
        return await this.retryConnection(options);
      }
      
      throw error;
    }
  }

  /**
   * Validate all pre-connection requirements
   */
  async validatePreConnectionRequirements() {
    // Check browser compatibility
    if (!this.browserSupport.isCompatible) {
      throw this.createWalletError(ERROR_TYPES.BROWSER_INCOMPATIBLE, 
        `Browser not supported: ${this.browserSupport.issues.join(', ')}`
      );
    }

    // Check if Phantom is available
    if (!PhantomWalletManager.isPhantomAvailable()) {
      throw this.createWalletError(ERROR_TYPES.WALLET_NOT_INSTALLED, 
        'Phantom wallet is not installed or available'
      );
    }

    // Check adapter availability
    if (!this.adapter) {
      throw this.createWalletError(ERROR_TYPES.WALLET_NOT_AVAILABLE, 
        'Phantom wallet adapter is not available'
      );
    }

    // Check connection health
    if (!this.connectionHealth.isHealthy) {
      try {
        await this.performHealthCheck();
      } catch (healthError) {
        throw this.createWalletError(ERROR_TYPES.NETWORK_ERROR, 
          'Network connection is not healthy'
        );
      }
    }
  }

  /**
   * Perform the actual connection with comprehensive error handling
   */
  async performConnection(options) {
    const { timeout = ERROR_CONFIG.CONNECTION_TIMEOUT } = options;
    
    this.isConnecting = true;
    this.emit('connecting', { attempt: this.retryAttempts + 1 });

    try {
      // Create connection timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          const error = this.createWalletError(ERROR_TYPES.CONNECTION_TIMEOUT, 
            `Connection timed out after ${timeout / 1000} seconds`
          );
          reject(error);
        }, timeout);
      });

      // Create connection promise with enhanced error handling
      const connectPromise = this.createConnectionPromise(options);
      
      // Race between connection and timeout
      await Promise.race([connectPromise, timeoutPromise]);

      // Verify connection integrity
      await this.verifyConnection();
      
      // Validate network compatibility
      await this.validateNetworkCompatibility();

      // Update connection state
      this.isConnected = true;
      this.publicKey = this.adapter.publicKey;
      this.retryAttempts = 0;
      this.connectionHealth.isHealthy = true;
      this.connectionHealth.consecutiveFailures = 0;
      
      // Start session management
      this.startSessionTimeout();
      this.saveSession();
      this.updateActivityTimestamp();
      
      // Update preferences for manual connections
      if (!options.isAutoReconnect) {
        this.userPreferences.autoReconnect = true;
        this.saveUserPreferences();
      }
      
      const connectionInfo = this.getConnectionInfo();
      this.emit('connected', connectionInfo);
      
      console.log('Wallet connected successfully:', this.formatShortAddress(this.publicKey.toBase58()));
      return connectionInfo;

    } catch (error) {
      this.handleConnectionFailure(error);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Create connection promise with error categorization
   */
  async createConnectionPromise(options) {
    try {
      await this.adapter.connect(options);
    } catch (error) {
      // Categorize and enhance the error
      const enhancedError = this.categorizeConnectionError(error);
      throw enhancedError;
    }
  }

  /**
   * Verify connection integrity after successful connection
   */
  async verifyConnection() {
    if (!this.adapter.connected || !this.adapter.publicKey) {
      throw this.createWalletError(ERROR_TYPES.CONNECTION_FAILED, 
        'Connection verification failed - adapter not properly connected'
      );
    }

    // Test RPC connection
    try {
      const startTime = Date.now();
      await Promise.race([
        this.connection.getRecentBlockhash(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('RPC timeout')), ERROR_CONFIG.RPC_TIMEOUT)
        )
      ]);
      this.connectionHealth.rpcLatency = Date.now() - startTime;
    } catch (error) {
      throw this.createWalletError(ERROR_TYPES.RPC_ERROR, 
        'Failed to verify network connection'
      );
    }
  }

  // Network Validation and Management Methods

  /**
   * Validate target network is supported
   * @param {string} network - Network to validate
   * @returns {boolean} True if network is supported
   */
  validateTargetNetwork(network) {
    if (!validateNetwork(network)) {
      console.error(`Invalid network identifier: ${network}`);
      return false;
    }
    
    if (!this.supportedNetworks.includes(network)) {
      console.error(`Unsupported network: ${network}. Supported: ${this.supportedNetworks.join(', ')}`);
      return false;
    }
    
    return true;
  }

  /**
   * Create validated connection with network-specific configuration
   * @param {string} network - Target network
   * @returns {Promise<Connection>} Validated connection
   */
  async createValidatedConnection(network) {
    const endpoints = RPC_ENDPOINTS[network];
    
    if (!endpoints || endpoints.length === 0) {
      throw this.createWalletError(ERROR_TYPES.NETWORK_VALIDATION_FAILED,
        `No RPC endpoints configured for network: ${network}`
      );
    }

    let lastError = null;
    
    // Try each endpoint until one works
    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      
      try {
        console.log(`Trying RPC endpoint: ${endpoint}`);
        const connection = createConnection(network);
        
        // Test the connection with a simple call
        await this.testRpcEndpoint(connection, endpoint);
        
        console.log(`Successfully connected to ${network} via ${endpoint}`);
        return connection;
        
      } catch (error) {
        lastError = error;
        console.warn(`RPC endpoint ${endpoint} failed:`, error.message);
        
        // Update health status
        this.rpcHealthStatus.set(endpoint, {
          isHealthy: false,
          lastCheck: Date.now(),
          error: error.message,
          latency: null
        });
      }
    }
    
    // All endpoints failed
    throw this.createWalletError(ERROR_TYPES.RPC_ENDPOINT_FAILED,
      `All RPC endpoints failed for network ${network}`, lastError
    );
  }

  /**
   * Test RPC endpoint health and latency
   * @param {Connection} connection - Connection to test
   * @param {string} endpoint - Endpoint URL
   */
  async testRpcEndpoint(connection, endpoint) {
    const startTime = Date.now();
    
    try {
      // Test with a simple, fast call
      await Promise.race([
        connection.getEpochInfo(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('RPC endpoint test timeout')), 5000)
        )
      ]);
      
      const latency = Date.now() - startTime;
      
      // Update health status
      this.rpcHealthStatus.set(endpoint, {
        isHealthy: true,
        lastCheck: Date.now(),
        error: null,
        latency: latency
      });
      
      console.log(`RPC endpoint ${endpoint} healthy (${latency}ms)`);
      
    } catch (error) {
      throw new Error(`RPC endpoint test failed: ${error.message}`);
    }
  }

  /**
   * Validate RPC endpoint after connection
   * @param {Connection} connection - Connection to validate
   */
  async validateRpcEndpoint(connection) {
    try {
      const startTime = Date.now();
      
      // Perform comprehensive health check
      await Promise.all([
        // Basic connectivity
        connection.getEpochInfo(),
        // Block production check
        connection.getRecentBlockhash(),
        // Slot information
        connection.getSlot()
      ]);
      
      const latency = Date.now() - startTime;
      
      // Update connection health
      this.connectionHealth.rpcLatency = latency;
      this.connectionHealth.lastCheck = Date.now();
      
      console.log(`RPC endpoint validation passed (${latency}ms)`);
      
    } catch (error) {
      throw this.createWalletError(ERROR_TYPES.RPC_ERROR,
        'RPC endpoint validation failed', error
      );
    }
  }

  /**
   * Validate network compatibility between wallet and application
   */
  async validateNetworkCompatibility() {
    try {
      // Check if adapter supports network detection
      if (!this.adapter?.connected) {
        throw new Error('Wallet adapter not connected');
      }

      // Get wallet's current network (if available)
      const walletNetwork = await this.detectWalletNetwork();
      
      if (walletNetwork && walletNetwork !== this.currentNetwork) {
        console.warn(`Network mismatch detected: wallet=${walletNetwork}, app=${this.currentNetwork}`);
        
        const error = this.createWalletError(ERROR_TYPES.NETWORK_MISMATCH,
          `Wallet is on ${walletNetwork} but application requires ${this.currentNetwork}`
        );
        
        // Emit network mismatch event for UI handling
        this.emit('networkMismatch', {
          walletNetwork: walletNetwork,
          requiredNetwork: this.currentNetwork,
          canSwitch: this.canSwitchNetwork(),
          error: error
        });
        
        // If network validation is strictly enforced, throw error
        if (this.networkValidationEnabled) {
          throw error;
        }
      }
      
      console.log(`Network compatibility validated: ${this.currentNetwork}`);
      
    } catch (error) {
      console.error('Network compatibility validation failed:', error);
      
      // Don't throw if this is just a detection failure
      if (error.type !== ERROR_TYPES.NETWORK_MISMATCH) {
        console.warn('Network detection failed, continuing with assumed compatibility');
        return;
      }
      
      throw error;
    }
  }

  /**
   * Detect the wallet's current network
   * @returns {Promise<string|null>} Detected network or null if unable to detect
   */
  async detectWalletNetwork() {
    try {
      // Try to determine network from wallet or RPC
      if (this.connection) {
        // Check genesis hash to determine network
        const genesisHash = await this.connection.getGenesisHash();
        
        // Known genesis hashes for different networks
        const networkGenesisHashes = {
          [SOLANA_NETWORKS.MAINNET]: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',
          [SOLANA_NETWORKS.DEVNET]: 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG',
          [SOLANA_NETWORKS.TESTNET]: '4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY'
        };
        
        for (const [network, hash] of Object.entries(networkGenesisHashes)) {
          if (genesisHash === hash) {
            return network;
          }
        }
      }
      
      // Fallback: assume current network if detection fails
      return this.currentNetwork;
      
    } catch (error) {
      console.warn('Failed to detect wallet network:', error);
      return null;
    }
  }

  /**
   * Check if the wallet supports network switching
   * @returns {boolean} True if network switching is supported
   */
  canSwitchNetwork() {
    // Most Solana wallets don't support programmatic network switching
    // This would need to be implemented based on specific wallet capabilities
    return false;
  }

  /**
   * Request wallet to switch to specified network
   * @param {string} targetNetwork - Network to switch to
   * @returns {Promise<boolean>} True if switch successful
   */
  async requestNetworkSwitch(targetNetwork) {
    if (!this.validateTargetNetwork(targetNetwork)) {
      throw this.createWalletError(ERROR_TYPES.NETWORK_VALIDATION_FAILED,
        `Invalid target network: ${targetNetwork}`
      );
    }
    
    if (!this.canSwitchNetwork()) {
      throw this.createWalletError(ERROR_TYPES.NETWORK_SWITCH_REQUIRED,
        'Please manually switch your wallet to the required network'
      );
    }
    
    // Implementation would depend on wallet-specific network switching API
    // For now, emit an event that UI can handle
    this.emit('networkSwitchRequested', {
      currentNetwork: this.currentNetwork,
      targetNetwork: targetNetwork,
      requiresManualSwitch: true
    });
    
    return false;
  }

  /**
   * Start network monitoring for changes and health
   */
  startNetworkMonitoring() {
    if (this.networkMonitoringInterval) {
      clearInterval(this.networkMonitoringInterval);
    }
    
    this.networkMonitoringInterval = setInterval(async () => {
      await this.performNetworkHealthCheck();
    }, this.networkCheckInterval);
    
    console.log('Network monitoring started');
  }

  /**
   * Stop network monitoring
   */
  stopNetworkMonitoring() {
    if (this.networkMonitoringInterval) {
      clearInterval(this.networkMonitoringInterval);
      this.networkMonitoringInterval = null;
    }
    
    console.log('Network monitoring stopped');
  }

  /**
   * Perform periodic network health check
   */
  async performNetworkHealthCheck() {
    try {
      this.lastNetworkCheck = Date.now();
      
      // Check connection health
      await this.performHealthCheck();
      
      // Check for network changes
      const currentDetectedNetwork = await this.detectWalletNetwork();
      
      if (currentDetectedNetwork && currentDetectedNetwork !== this.currentNetwork) {
        console.warn(`Network change detected: ${this.currentNetwork} -> ${currentDetectedNetwork}`);
        
        // Emit network change event
        this.emit('networkChanged', {
          previousNetwork: this.currentNetwork,
          newNetwork: currentDetectedNetwork,
          timestamp: Date.now()
        });
        
        // Handle network change based on policy
        await this.handleNetworkChange(currentDetectedNetwork);
      }
      
      // Emit health check completed
      this.emit('networkHealthCheck', {
        network: this.currentNetwork,
        healthy: this.connectionHealth.isHealthy,
        latency: this.connectionHealth.rpcLatency,
        timestamp: this.lastNetworkCheck
      });
      
    } catch (error) {
      console.error('Network health check failed:', error);
      this.emit('networkHealthCheckFailed', {
        network: this.currentNetwork,
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Handle network change with appropriate action
   * @param {string} newNetwork - New detected network
   */
  async handleNetworkChange(newNetwork) {
    console.warn(`Network change detected: ${this.currentNetwork} -> ${newNetwork}`);
    
    this.logDisconnectionEvent('network_change_disconnect', {
      oldNetwork: this.currentNetwork,
      newNetwork: newNetwork,
      securityReason: 'network_switch_detected'
    });
    
    // Disconnect for security if network validation is enabled
    if (this.networkValidationEnabled) {
      await this.disconnect({
        forced: true,
        reason: 'network_changed',
        clearUserData: false,
        clearPreferences: false
      });
      
      // Update current network
      this.currentNetwork = newNetwork;
      
      // Attempt to reconnect with new network
      if (this.userPreferences.autoReconnect) {
        console.log(`Attempting reconnection on new network: ${newNetwork}`);
        setTimeout(() => {
          this.attemptAutoReconnectWithRetry().catch(error => {
            console.error('Auto-reconnect after network change failed:', error);
          });
        }, 2000);
      }
    } else {
      // Just update current network without disconnecting
      this.currentNetwork = newNetwork;
      console.log(`Network updated to: ${newNetwork} (validation disabled)`);
    }
  }

  /**
   * Get comprehensive network status information
   * @returns {Object} Network status details
   */
  getNetworkStatus() {
    return {
      currentNetwork: this.currentNetwork,
      targetNetwork: CURRENT_NETWORK,
      networkCompatible: this.currentNetwork === CURRENT_NETWORK,
      supportedNetworks: this.supportedNetworks,
      networkValidationEnabled: this.networkValidationEnabled,
      
      // Connection health
      connectionHealthy: this.connectionHealth.isHealthy,
      rpcLatency: this.connectionHealth.rpcLatency,
      lastNetworkCheck: this.lastNetworkCheck,
      
      // RPC endpoint health
      rpcHealthStatus: Object.fromEntries(this.rpcHealthStatus),
      availableEndpoints: RPC_ENDPOINTS[this.currentNetwork] || [],
      
      // Monitoring status
      monitoringActive: !!this.networkMonitoringInterval,
      networkCheckInterval: this.networkCheckInterval,
      
      // Capabilities
      canSwitchNetwork: this.canSwitchNetwork(),
      requiresManualNetworkSwitch: !this.canSwitchNetwork()
    };
  }

  /**
   * Update network validation settings
   * @param {Object} settings - Network validation settings
   */
  updateNetworkValidationSettings(settings) {
    const {
      enabled = this.networkValidationEnabled,
      supportedNetworks = this.supportedNetworks,
      checkInterval = this.networkCheckInterval,
      strictValidation = true
    } = settings;
    
    this.networkValidationEnabled = enabled;
    this.supportedNetworks = supportedNetworks;
    this.networkCheckInterval = checkInterval;
    
    // Restart monitoring with new interval if active
    if (this.networkMonitoringInterval) {
      this.startNetworkMonitoring();
    }
    
    console.log('Network validation settings updated:', {
      enabled,
      supportedNetworks,
      checkInterval,
      strictValidation
    });
    
    this.emit('networkValidationSettingsUpdated', {
      enabled,
      supportedNetworks,
      checkInterval,
      strictValidation
    });
  }

  /**
   * Validate application network configuration
   * @returns {Object} Network configuration validation results
   */
  validateNetworkConfiguration() {
    const issues = [];
    const warnings = [];
    
    // Check if current network is supported
    if (!this.supportedNetworks.includes(CURRENT_NETWORK)) {
      issues.push(`Current network ${CURRENT_NETWORK} is not in supported networks list`);
    }
    
    // Check if RPC endpoints are configured
    const endpoints = RPC_ENDPOINTS[CURRENT_NETWORK];
    if (!endpoints || endpoints.length === 0) {
      issues.push(`No RPC endpoints configured for ${CURRENT_NETWORK}`);
    } else if (endpoints.length === 1) {
      warnings.push('Only one RPC endpoint configured - consider adding fallbacks');
    }
    
    // Check network validation settings
    if (!this.networkValidationEnabled && CURRENT_NETWORK === SOLANA_NETWORKS.MAINNET) {
      warnings.push('Network validation disabled on mainnet - consider enabling for security');
    }
    
    return {
      valid: issues.length === 0,
      issues,
      warnings,
      currentNetwork: CURRENT_NETWORK,
      supportedNetworks: this.supportedNetworks,
      endpointsConfigured: endpoints?.length || 0,
      validationEnabled: this.networkValidationEnabled
    };
  }

  // Error Handling and Retry Methods

  /**
   * Create a standardized wallet error with proper categorization
   */
  createWalletError(type, message, originalError = null) {
    const errorInfo = ERROR_MESSAGES[type] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN_ERROR];
    const error = new Error(message);
    
    error.code = type;
    error.type = type;
    error.title = errorInfo.title;
    error.userMessage = errorInfo.message;
    error.action = errorInfo.action;
    error.actionUrl = errorInfo.actionUrl;
    error.timestamp = Date.now();
    
    if (originalError) {
      error.originalError = originalError;
      error.stack = originalError.stack;
    }
    
    return error;
  }

  /**
   * Categorize connection errors into user-friendly types
   */
  categorizeConnectionError(error) {
    const message = error?.message?.toLowerCase() || '';
    const code = error?.code || '';

    // User rejection patterns
    if (message.includes('user rejected') || message.includes('user denied') || message.includes('user cancelled')) {
      return this.createWalletError(ERROR_TYPES.USER_REJECTED, 'User cancelled the connection', error);
    }

    // Wallet locked patterns
    if (message.includes('locked') || message.includes('unlock')) {
      return this.createWalletError(ERROR_TYPES.WALLET_LOCKED, 'Phantom wallet is locked', error);
    }

    // Network validation and mismatch patterns
    if (message.includes('network mismatch') || message.includes('wrong network') || message.includes('network validation')) {
      return this.createWalletError(ERROR_TYPES.NETWORK_MISMATCH, 'Network mismatch detected', error);
    }

    // RPC endpoint failure patterns
    if (message.includes('rpc endpoint') || message.includes('all rpc endpoints failed') || message.includes('endpoint test failed')) {
      return this.createWalletError(ERROR_TYPES.RPC_ENDPOINT_FAILED, 'RPC endpoint validation failed', error);
    }

    // Network health check patterns
    if (message.includes('cluster health') || message.includes('network health') || message.includes('health check')) {
      return this.createWalletError(ERROR_TYPES.CLUSTER_HEALTH_FAILED, 'Network health check failed', error);
    }

    // Network/RPC patterns (general)
    if (message.includes('network') || message.includes('rpc') || message.includes('fetch')) {
      return this.createWalletError(ERROR_TYPES.NETWORK_ERROR, 'Network connection error', error);
    }

    // Timeout patterns
    if (message.includes('timeout') || code === 'TIMEOUT') {
      return this.createWalletError(ERROR_TYPES.CONNECTION_TIMEOUT, 'Connection timed out', error);
    }

    // Rate limiting patterns
    if (message.includes('rate limit') || message.includes('too many requests') || code === 429) {
      return this.createWalletError(ERROR_TYPES.RATE_LIMITED, 'Too many connection attempts', error);
    }

    // Wallet not available patterns
    if (message.includes('not found') || message.includes('not available') || message.includes('not installed')) {
      return this.createWalletError(ERROR_TYPES.WALLET_NOT_AVAILABLE, 'Phantom wallet not available', error);
    }

    // Generic connection failure
    if (message.includes('connect') || message.includes('connection')) {
      return this.createWalletError(ERROR_TYPES.CONNECTION_FAILED, 'Failed to connect to wallet', error);
    }

    // Unknown error
    return this.createWalletError(ERROR_TYPES.UNKNOWN_ERROR, error.message || 'Unknown connection error', error);
  }

  /**
   * Record error in history for analysis and retry logic
   */
  recordError(error) {
    this.lastError = error;
    this.connectionHealth.errorCount++;
    this.connectionHealth.consecutiveFailures++;
    
    const errorRecord = {
      timestamp: Date.now(),
      type: error.type || ERROR_TYPES.UNKNOWN_ERROR,
      message: error.message,
      code: error.code,
      userAgent: this.browserSupport.userAgent,
      connectionHealth: { ...this.connectionHealth }
    };
    
    this.errorHistory.push(errorRecord);
    
    // Keep only last 50 errors to prevent memory bloat
    if (this.errorHistory.length > 50) {
      this.errorHistory = this.errorHistory.slice(-50);
    }
    
    // Update rate limiting if too many consecutive failures
    if (this.connectionHealth.consecutiveFailures >= 5) {
      this.rateLimitUntil = Date.now() + ERROR_CONFIG.RATE_LIMIT_BACKOFF;
      console.warn('Rate limiting enabled due to consecutive failures');
    }
  }

  /**
   * Check if connection attempts are currently rate limited
   */
  isRateLimited() {
    return this.rateLimitUntil && Date.now() < this.rateLimitUntil;
  }

  /**
   * Determine if a connection should be retried based on error type
   */
  shouldRetryConnection(error) {
    // Don't retry if max attempts reached
    if (this.retryAttempts >= ERROR_CONFIG.MAX_RETRY_ATTEMPTS) {
      return false;
    }
    
    // Don't retry user-initiated cancellations
    if (error.type === ERROR_TYPES.USER_REJECTED) {
      return false;
    }
    
    // Don't retry browser incompatibility
    if (error.type === ERROR_TYPES.BROWSER_INCOMPATIBLE) {
      return false;
    }
    
    // Don't retry wallet not installed
    if (error.type === ERROR_TYPES.WALLET_NOT_INSTALLED) {
      return false;
    }
    
    // Don't retry network mismatch (requires manual intervention)
    if (error.type === ERROR_TYPES.NETWORK_MISMATCH) {
      return false;
    }
    
    // Don't retry network switch required
    if (error.type === ERROR_TYPES.NETWORK_SWITCH_REQUIRED) {
      return false;
    }
    
    // Retry network, timeout, and connection errors
    const retryableErrors = [
      ERROR_TYPES.NETWORK_ERROR,
      ERROR_TYPES.CONNECTION_TIMEOUT,
      ERROR_TYPES.RPC_ERROR,
      ERROR_TYPES.CONNECTION_FAILED,
      ERROR_TYPES.WALLET_NOT_AVAILABLE,
      ERROR_TYPES.RPC_ENDPOINT_FAILED,
      ERROR_TYPES.CLUSTER_HEALTH_FAILED,
      ERROR_TYPES.NETWORK_VALIDATION_FAILED
    ];
    
    return retryableErrors.includes(error.type);
  }

  /**
   * Retry connection with exponential backoff
   */
  async retryConnection(options) {
    this.retryAttempts++;
    
    // Calculate backoff delay (exponential with jitter)
    const baseDelay = ERROR_CONFIG.INITIAL_RETRY_DELAY;
    const maxDelay = ERROR_CONFIG.MAX_RETRY_DELAY;
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, this.retryAttempts - 1), maxDelay);
    const jitterDelay = exponentialDelay + (Math.random() * 1000); // Add up to 1s jitter
    
    console.log(`Retrying connection in ${Math.round(jitterDelay)}ms (attempt ${this.retryAttempts}/${ERROR_CONFIG.MAX_RETRY_ATTEMPTS})`);
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, jitterDelay));
    
    // Emit retry event
    this.emit('connectionRetry', {
      attempt: this.retryAttempts,
      maxAttempts: ERROR_CONFIG.MAX_RETRY_ATTEMPTS,
      delay: jitterDelay,
      lastError: this.lastError
    });
    
    // Retry with skip retry flag to prevent infinite recursion
    return await this.connect({ ...options, skipRetry: true });
  }

  /**
   * Handle connection failure with proper cleanup and error emission
   */
  handleConnectionFailure(error) {
    this.isConnecting = false;
    this.isConnected = false;
    this.publicKey = null;
    
    console.error('Connection failed:', error);
    this.emit('connectionFailed', {
      error: error,
      attempt: this.retryAttempts + 1,
      canRetry: this.shouldRetryConnection(error)
    });
  }

  /**
   * Handle general connection errors (for RPC and network issues)
   */
  handleConnectionError(error) {
    this.connectionHealth.isHealthy = false;
    this.connectionHealth.errorCount++;
    this.connectionHealth.lastCheck = Date.now();
    
    console.error('Connection error:', error);
    this.emit('connectionError', { error, health: this.connectionHealth });
  }

  /**
   * Schedule connection retry for initialization failures
   */
  scheduleConnectionRetry() {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
    }
    
    this.connectionTimer = setTimeout(async () => {
      console.log('Retrying connection initialization...');
      try {
        await this.initializeConnection();
      } catch (error) {
        console.error('Connection retry failed:', error);
      }
    }, ERROR_CONFIG.INITIAL_RETRY_DELAY);
  }

  /**
   * Connect with built-in retry mechanism
   */
  async connectWithRetry(options = {}) {
    const { maxRetries = ERROR_CONFIG.MAX_RETRY_ATTEMPTS, ...connectOptions } = options;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.connect({ ...connectOptions, skipRetry: true });
      } catch (error) {
        console.warn(`Connection attempt ${attempt}/${maxRetries} failed:`, error.message);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        if (!this.shouldRetryConnection(error)) {
          throw error;
        }
        
        // Wait before next attempt
        const delay = ERROR_CONFIG.INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, Math.min(delay, ERROR_CONFIG.MAX_RETRY_DELAY)));
      }
    }
  }

  /**
   * Enhanced auto-reconnection with retry logic
   */
  async attemptAutoReconnectWithRetry() {
    try {
      console.log('Attempting auto-reconnection with retry logic...');
      return await this.connectWithRetry({
        onlyIfTrusted: true,
        isAutoReconnect: true,
        timeout: 10000, // Shorter timeout for auto-reconnect
        maxRetries: SESSION_CONFIG.MAX_RECONNECTION_ATTEMPTS
      });
    } catch (error) {
      console.error('Auto-reconnection failed:', error);
      this.emit('autoReconnectFailed', {
        attempts: SESSION_CONFIG.MAX_RECONNECTION_ATTEMPTS,
        lastError: error.message
      });
      return false;
    }
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    const startTime = Date.now();
    
    try {
      // Test RPC connection
      await Promise.race([
        this.connection.getRecentBlockhash(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), ERROR_CONFIG.VALIDATION_TIMEOUT)
        )
      ]);
      
      // Update health metrics
      this.connectionHealth.isHealthy = true;
      this.connectionHealth.rpcLatency = Date.now() - startTime;
      this.connectionHealth.lastCheck = Date.now();
      this.connectionHealth.consecutiveFailures = 0;
      
      return true;
    } catch (error) {
      this.connectionHealth.isHealthy = false;
      this.connectionHealth.errorCount++;
      this.connectionHealth.consecutiveFailures++;
      this.connectionHealth.lastCheck = Date.now();
      
      throw error;
    }
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    this.healthCheckTimer = setInterval(async () => {
      try {
        await this.performHealthCheck();
        this.emit('healthCheckPassed', this.connectionHealth);
      } catch (error) {
        console.warn('Health check failed:', error.message);
        this.emit('healthCheckFailed', { error, health: this.connectionHealth });
      }
    }, ERROR_CONFIG.HEALTH_CHECK_INTERVAL);
  }

  /**
   * Get comprehensive connection health information
   */
  getConnectionHealth() {
    return {
      ...this.connectionHealth,
      isRateLimited: this.isRateLimited(),
      rateLimitUntil: this.rateLimitUntil,
      retryAttempts: this.retryAttempts,
      lastError: this.lastError,
      errorHistory: this.errorHistory.slice(-10), // Last 10 errors
      browserSupport: this.browserSupport
    };
  }

  /**
   * Recovery method for wallet locked scenario
   */
  async recoverFromWalletLocked() {
    console.log('Attempting recovery from wallet locked state...');
    
    // Clear any existing connection state
    this.isConnecting = false;
    this.isConnected = false;
    
    // Wait a moment for user to unlock
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Emit event to prompt user
    this.emit('walletLocked', {
      message: 'Please unlock your Phantom wallet and try again',
      canRetry: true
    });
  }

  /**
   * Comprehensive wallet disconnection with enhanced cleanup
   * @param {Object} options - Disconnection options
   * @param {boolean} options.clearPreferences - Clear user preferences
   * @param {boolean} options.clearUserData - Clear all user data
   * @param {boolean} options.forced - Force disconnection without wallet confirmation
   * @param {string} options.reason - Reason for disconnection (for audit logging)
   * @returns {Promise<void>}
   */
  async disconnect(options = {}) {
    const {
      clearPreferences = false,
      clearUserData = false,
      forced = false,
      reason = 'user_initiated'
    } = options;

    // Log disconnection attempt for security auditing
    this.logDisconnectionEvent('disconnect_initiated', {
      reason,
      forced,
      clearPreferences,
      clearUserData,
      currentState: {
        isConnected: this.isConnected,
        hasAdapter: !!this.adapter,
        publicKey: this.publicKey?.toBase58()
      }
    });

    // Emit pre-disconnect event for UI components to prepare
    this.emit('beforeDisconnect', {
      reason,
      forced,
      timestamp: Date.now()
    });

    try {
      // Phase 1: Clear all timers and intervals first
      this.clearAllTimers();
      
      // Phase 2: Remove all event listeners and cleanup
      this.removeAllEventListeners();
      
      // Phase 3: Clear session and user data
      this.performDataCleanup(clearUserData, clearPreferences);
      
      // Phase 4: Handle wallet adapter disconnection
      await this.disconnectWalletAdapter(forced);
      
      // Phase 5: Reset internal state
      this.resetConnectionState();
      
      // Phase 6: Update preferences if needed
      this.updateDisconnectionPreferences(clearPreferences, reason);
      
      // Log successful disconnection
      this.logDisconnectionEvent('disconnect_completed', {
        reason,
        forced,
        success: true
      });
      
      // Emit final disconnection event
      this.emit('disconnected', {
        reason,
        forced,
        timestamp: Date.now(),
        cleanupComplete: true
      });
      
    } catch (error) {
      console.error('Disconnect error:', error);
      
      // Log the error but continue with forced cleanup
      this.logDisconnectionEvent('disconnect_error', {
        reason,
        error: error.message,
        stack: error.stack
      });
      
      // Force cleanup even if disconnect fails
      this.forceDisconnect(reason);
    }
  }

  /**
   * Force disconnect and comprehensive cleanup (for error recovery and security)
   * @param {string} reason - Reason for forced disconnection
   */
  forceDisconnect(reason = 'forced_cleanup') {
    console.warn('Force disconnecting wallet - performing emergency cleanup');
    
    try {
      // Log forced disconnection for security audit
      this.logDisconnectionEvent('force_disconnect_initiated', {
        reason,
        timestamp: Date.now()
      });
      
      // Emergency state reset - do this first
      this.isConnected = false;
      this.publicKey = null;
      this.isConnecting = false;
      this.reconnectionAttempts = 0;
      
      // Clear all timers and intervals immediately
      this.clearAllTimers();
      
      // Perform comprehensive data cleanup
      this.performDataCleanup(false, false); // Don't clear preferences in force disconnect
      
      // Remove all listeners to prevent memory leaks
      this.removeAllEventListeners();
      
      // Clean up wallet adapter without waiting for response
      this.forceAdapterCleanup();
      
      // Clear any pending operations
      this.clearPendingOperations();
      
      // Log completion
      this.logDisconnectionEvent('force_disconnect_completed', {
        reason,
        timestamp: Date.now()
      });
      
      // Emit disconnection event
      this.emit('disconnected', {
        reason,
        forced: true,
        timestamp: Date.now(),
        emergencyCleanup: true
      });
      
    } catch (error) {
      // Even if forced cleanup fails, log it but don't throw
      console.error('Force disconnect cleanup failed:', error);
      this.logDisconnectionEvent('force_disconnect_error', {
        reason,
        error: error.message
      });
    }
  }

  /**
   * Get current connection information with session data
   * @returns {Object} Connection details
   */
  getConnectionInfo() {
    if (!this.isConnected || !this.publicKey) {
      return null;
    }

    const address = this.publicKey.toBase58();
    
    return {
      isConnected: true,
      publicKey: this.publicKey,
      address: address,
      shortAddress: this.formatShortAddress(address),
      network: this.currentNetwork,
      targetNetwork: CURRENT_NETWORK,
      networkCompatible: this.currentNetwork === CURRENT_NETWORK,
      walletName: 'Phantom',
      timestamp: Date.now(),
      
      // Network validation information
      networkValidationEnabled: this.networkValidationEnabled,
      supportedNetworks: this.supportedNetworks,
      rpcEndpointHealthy: this.connectionHealth.isHealthy,
      rpcLatency: this.connectionHealth.rpcLatency,
      
      // Session information
      sessionActive: !!this.sessionData,
      lastActivity: this.lastActivity,
      timeSinceActivity: Date.now() - this.lastActivity,
      autoReconnectEnabled: this.userPreferences.autoReconnect,
      userPreferences: { ...this.userPreferences }
    };
  }

  /**
   * Format wallet address for display (ABC...XYZ)
   * @param {string} address - Full wallet address
   * @returns {string} Formatted short address
   */
  formatShortAddress(address) {
    if (!address || address.length < 8) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }

  /**
   * Get wallet balance in SOL
   * @returns {Promise<number>} Balance in SOL
   */
  async getBalance() {
    if (!this.isConnected || !this.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const balance = await this.connection.getBalance(this.publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      throw new Error('Unable to fetch wallet balance');
    }
  }

  /**
   * Sign a message for authentication (SIWS pattern)
   * @param {string} message - Message to sign
   * @returns {Promise<Uint8Array>} Signature
   */
  async signMessage(message) {
    if (!this.isConnected || !this.adapter?.signMessage) {
      throw new Error('Wallet not connected or signing not supported');
    }

    try {
      const encodedMessage = new TextEncoder().encode(message);
      const signature = await this.adapter.signMessage(encodedMessage);
      
      return signature;
    } catch (error) {
      console.error('Message signing failed:', error);
      throw new Error('Failed to sign message');
    }
  }

  /**
   * Validate wallet connection and network
   * @returns {Promise<boolean>} True if valid
   */
  async validateConnection() {
    if (!this.isConnected || !this.publicKey) {
      return false;
    }

    try {
      // Check if wallet is still connected
      if (!this.adapter?.connected) {
        this.forceDisconnect();
        return false;
      }

      // Verify public key hasn't changed
      if (!this.adapter.publicKey?.equals(this.publicKey)) {
        await this.handleAccountChanged(this.adapter.publicKey);
        return false;
      }

      // Test connection with a simple RPC call
      await this.connection.getRecentBlockhash();
      
      return true;
    } catch (error) {
      console.error('Connection validation failed:', error);
      return false;
    }
  }

  // Event Handlers

  /**
   * Handle successful wallet connection
   */
  handleConnect() {
    console.log('Phantom wallet connected');
    if (this.adapter?.publicKey) {
      this.publicKey = this.adapter.publicKey;
      this.isConnected = true;
    }
  }

  /**
   * Handle wallet disconnection from adapter events
   * Handles both user-initiated and automatic disconnections
   */
  handleDisconnect() {
    console.log('Phantom wallet disconnected by adapter');
    
    // Determine disconnection type
    const disconnectReason = this.isConnecting ? 'connection_failed' : 'wallet_disconnected';
    
    // Log the adapter-initiated disconnection
    this.logDisconnectionEvent('adapter_disconnect_detected', {
      reason: disconnectReason,
      adapterConnected: this.adapter?.connected,
      timestamp: Date.now()
    });
    
    // Perform force disconnect with appropriate reason
    this.forceDisconnect(disconnectReason);
  }

  /**
   * Handle wallet errors with user-friendly messages
   * @param {Error} error - Original error
   */
  handleError(error) {
    console.error('Phantom wallet error:', error);
    
    const userError = this.createUserFriendlyError(error);
    this.emit('error', userError);
  }

  /**
   * Handle account changes (security measure)
   * @param {PublicKey} newPublicKey - New public key
   */
  async handleAccountChanged(newPublicKey) {
    const oldKey = this.publicKey;
    
    console.warn('Wallet account changed - disconnecting for security');
    
    // Log security event for account change
    this.logDisconnectionEvent('account_changed_security_disconnect', {
      oldPublicKey: oldKey?.toBase58(),
      newPublicKey: newPublicKey?.toBase58(),
      timestamp: Date.now(),
      securityReason: 'account_switch_detected'
    });
    
    // Force disconnect for security - don't wait for user confirmation
    await this.disconnect({
      forced: true,
      reason: 'account_changed',
      clearUserData: false, // Keep preferences but clear session
      clearPreferences: false
    });
    
    // Emit account changed event after cleanup
    this.emit('accountChanged', {
      oldKey,
      newKey: newPublicKey,
      securityDisconnect: true,
      timestamp: Date.now()
    });
  }

  // Enhanced Session Management

  /**
   * Save comprehensive wallet session data to secure storage
   */
  saveSession() {
    if (!this.isConnected || !this.publicKey) return;

    try {
      const sessionData = {
        publicKey: this.publicKey.toBase58(),
        network: CURRENT_NETWORK,
        timestamp: Date.now(),
        lastActivity: this.lastActivity,
        walletName: 'Phantom',
        version: '2.0',
        reconnectionAttempts: this.reconnectionAttempts
      };

      // Save to both localStorage and sessionStorage for different persistence levels
      localStorage.setItem(SESSION_KEYS.WALLET_SESSION, JSON.stringify(sessionData));
      sessionStorage.setItem(SESSION_KEYS.SESSION_ACTIVITY, JSON.stringify({
        lastActivity: this.lastActivity,
        sessionStart: Date.now()
      }));

      this.sessionData = sessionData;
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  /**
   * Restore wallet session from storage with comprehensive validation
   */
  restoreSession() {
    try {
      const sessionData = localStorage.getItem(SESSION_KEYS.WALLET_SESSION);
      if (!sessionData) return false;

      const session = JSON.parse(sessionData);
      
      // Validate session structure and version
      if (!session.version || !session.publicKey || !session.network) {
        console.warn('Invalid session structure, clearing...');
        this.clearSession();
        return false;
      }

      // Check session age (expire based on user preferences or default 2 hours)
      const maxAge = this.userPreferences.sessionTimeout || SESSION_CONFIG.INACTIVITY_TIMEOUT;
      const sessionAge = Date.now() - (session.lastActivity || session.timestamp);
      
      if (sessionAge > maxAge) {
        console.log('Session expired, clearing...');
        this.clearSession();
        return false;
      }

      // Validate network compatibility
      if (session.network !== CURRENT_NETWORK) {
        console.warn('Network mismatch, clearing session...');
        this.clearSession();
        return false;
      }

      // Restore session state
      if (session.publicKey) {
        try {
          this.publicKey = new PublicKey(session.publicKey);
          this.sessionData = session;
          this.lastActivity = session.lastActivity || session.timestamp;
          this.reconnectionAttempts = session.reconnectionAttempts || 0;
          
          console.log('Session restored for wallet:', this.formatShortAddress(session.publicKey));
          return true;
        } catch (error) {
          console.error('Invalid public key in session:', error);
        }
      }
      
      return false;
    } catch (error) {
      console.error('Failed to restore session:', error);
      this.clearSession();
      return false;
    }
  }

  /**
   * Clear all session data from storage
   */
  clearSession() {
    try {
      localStorage.removeItem(SESSION_KEYS.WALLET_SESSION);
      sessionStorage.removeItem(SESSION_KEYS.SESSION_ACTIVITY);
      localStorage.removeItem(SESSION_KEYS.CONNECTION_ATTEMPTS);
      
      this.sessionData = null;
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  /**
   * Start session timeout with inactivity monitoring
   */
  startSessionTimeout() {
    this.clearSessionTimeout();
    
    const timeoutDuration = this.userPreferences.sessionTimeout || SESSION_CONFIG.INACTIVITY_TIMEOUT;
    
    this.sessionTimeout = setTimeout(() => {
      const timeSinceActivity = Date.now() - this.lastActivity;
      
      if (timeSinceActivity >= timeoutDuration) {
        console.log('Session timeout due to inactivity - auto disconnecting');
        this.emit('sessionExpired', { reason: 'inactivity', lastActivity: this.lastActivity });
        this.disconnect();
      } else {
        // Reschedule if there was recent activity
        this.startSessionTimeout();
      }
    }, timeoutDuration);
  }

  /**
   * Clear session timeout
   */
  clearSessionTimeout() {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
  }

  /**
   * Start session refresh interval for periodic validation
   */
  startSessionRefresh() {
    this.clearSessionRefresh();
    
    this.sessionRefreshInterval = setInterval(async () => {
      if (this.isConnected) {
        try {
          // Validate connection is still active
          const isValid = await this.validateConnection();
          
          if (!isValid) {
            console.warn('Session validation failed, disconnecting...');
            this.forceDisconnect();
            return;
          }
          
          // Update session data
          this.saveSession();
          
          // Emit refresh event
          this.emit('sessionRefreshed', {
            lastActivity: this.lastActivity,
            isConnected: this.isConnected
          });
          
        } catch (error) {
          console.error('Session refresh failed:', error);
        }
      }
    }, SESSION_CONFIG.SESSION_REFRESH_INTERVAL);
  }

  /**
   * Clear session refresh interval
   */
  clearSessionRefresh() {
    if (this.sessionRefreshInterval) {
      clearInterval(this.sessionRefreshInterval);
      this.sessionRefreshInterval = null;
    }
  }

  /**
   * Update activity timestamp
   */
  updateActivityTimestamp() {
    this.lastActivity = Date.now();
    
    // Save activity to session storage for cross-tab tracking
    try {
      const activityData = {
        lastActivity: this.lastActivity,
        tab: Date.now() // Unique tab identifier
      };
      sessionStorage.setItem(SESSION_KEYS.SESSION_ACTIVITY, JSON.stringify(activityData));
    } catch (error) {
      console.error('Failed to update activity timestamp:', error);
    }
  }

  /**
   * Setup activity tracking for session management
   */
  setupActivityTracking() {
    if (typeof window === 'undefined') return;

    SESSION_CONFIG.ACTIVITY_TRACKING_EVENTS.forEach(eventType => {
      const handler = () => this.updateActivityTimestamp();
      document.addEventListener(eventType, handler, { passive: true });
      this.activityListeners.push({ eventType, handler });
    });

    // Track visibility changes with enhanced handling
    const visibilityHandler = () => this.handleVisibilityChange();
    document.addEventListener('visibilitychange', visibilityHandler);
    this.activityListeners.push({ eventType: 'visibilitychange', handler: visibilityHandler });
    
    // Track beforeunload for cleanup
    const beforeUnloadHandler = () => {
      this.logDisconnectionEvent('page_unload', {
        reason: 'browser_navigation',
        connected: this.isConnected
      });
    };
    window.addEventListener('beforeunload', beforeUnloadHandler);
    this.activityListeners.push({ eventType: 'beforeunload', handler: beforeUnloadHandler, target: 'window' });
    
    // Track storage events for cross-tab session management
    const storageHandler = (event) => {
      if (event.key === SESSION_KEYS.WALLET_SESSION && !event.newValue) {
        // Session was cleared in another tab
        console.log('Session cleared in another tab - disconnecting');
        this.forceDisconnect('session_cleared_external');
      }
    };
    window.addEventListener('storage', storageHandler);
    this.activityListeners.push({ eventType: 'storage', handler: storageHandler, target: 'window' });
  }

  /**
   * Attempt automatic reconnection with exponential backoff
   */
  async attemptAutoReconnect() {
    if (this.reconnectionAttempts >= SESSION_CONFIG.MAX_RECONNECTION_ATTEMPTS) {
      console.log('Max reconnection attempts reached');
      this.emit('autoReconnectFailed', { attempts: this.reconnectionAttempts });
      return false;
    }

    if (this.isConnecting || this.isConnected) {
      return false;
    }

    console.log(`Attempting auto-reconnection (${this.reconnectionAttempts + 1}/${SESSION_CONFIG.MAX_RECONNECTION_ATTEMPTS})`);
    
    try {
      this.reconnectionAttempts++;
      
      // Exponential backoff delay
      const delay = SESSION_CONFIG.RECONNECTION_DELAY * Math.pow(2, this.reconnectionAttempts - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const result = await this.connect({ 
        onlyIfTrusted: true, 
        isAutoReconnect: true,
        timeout: 10000 // Shorter timeout for auto-reconnect
      });
      
      this.emit('autoReconnectSuccess', { attempts: this.reconnectionAttempts });
      return result;
      
    } catch (error) {
      console.warn(`Auto-reconnection attempt ${this.reconnectionAttempts} failed:`, error.message);
      
      if (this.reconnectionAttempts < SESSION_CONFIG.MAX_RECONNECTION_ATTEMPTS) {
        // Schedule next attempt
        setTimeout(() => {
          this.attemptAutoReconnect();
        }, SESSION_CONFIG.RECONNECTION_DELAY);
      } else {
        this.emit('autoReconnectFailed', { 
          attempts: this.reconnectionAttempts, 
          lastError: error.message 
        });
      }
      
      return false;
    }
  }

  /**
   * Save user preferences to localStorage
   */
  saveUserPreferences() {
    try {
      localStorage.setItem(SESSION_KEYS.USER_PREFERENCES, JSON.stringify(this.userPreferences));
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }

  /**
   * Load user preferences from localStorage
   */
  loadUserPreferences() {
    try {
      const preferences = localStorage.getItem(SESSION_KEYS.USER_PREFERENCES);
      if (preferences) {
        this.userPreferences = { 
          ...this.getDefaultPreferences(), 
          ...JSON.parse(preferences) 
        };
      } else {
        this.userPreferences = this.getDefaultPreferences();
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
      this.userPreferences = this.getDefaultPreferences();
    }
  }

  /**
   * Get default user preferences
   */
  getDefaultPreferences() {
    return {
      autoReconnect: true,
      sessionTimeout: SESSION_CONFIG.INACTIVITY_TIMEOUT,
      theme: 'auto',
      notifications: true
    };
  }

  /**
   * Update user preferences
   * @param {Object} newPreferences - New preference values
   */
  updateUserPreferences(newPreferences) {
    this.userPreferences = { ...this.userPreferences, ...newPreferences };
    this.saveUserPreferences();
    this.emit('preferencesUpdated', this.userPreferences);
  }

  /**
   * Get current session information
   */
  getSessionInfo() {
    return {
      isConnected: this.isConnected,
      sessionData: this.sessionData,
      lastActivity: this.lastActivity,
      userPreferences: this.userPreferences,
      reconnectionAttempts: this.reconnectionAttempts,
      timeSinceActivity: Date.now() - this.lastActivity
    };
  }

  /**
   * Get comprehensive disconnection status and cleanup statistics
   * @returns {Object} Disconnection status information
   */
  getDisconnectionStatus() {
    const auditLog = this.getDisconnectionAuditLog();
    const recentDisconnections = auditLog.filter(entry => 
      Date.now() - entry.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
    );

    return {
      // Current state
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      hasActiveSession: !!this.sessionData,
      
      // Cleanup status
      timersActive: !!(this.sessionTimeout || this.sessionRefreshInterval || this.reconnectionTimer),
      listenersActive: this.activityListeners.length > 0,
      adapterConnected: this.adapter?.connected || false,
      
      // Audit information
      totalDisconnectionEvents: auditLog.length,
      recentDisconnections: recentDisconnections.length,
      lastDisconnection: auditLog.length > 0 ? auditLog[auditLog.length - 1] : null,
      
      // Security events
      securityDisconnections: auditLog.filter(entry => 
        entry.type.includes('security') || 
        entry.type.includes('account_changed') ||
        entry.type.includes('network_change')
      ).length,
      
      // Data cleanup status
      hasStoredSession: !!localStorage.getItem(SESSION_KEYS.WALLET_SESSION),
      hasStoredPreferences: !!localStorage.getItem(SESSION_KEYS.USER_PREFERENCES),
      hasActivityData: !!sessionStorage.getItem(SESSION_KEYS.SESSION_ACTIVITY),
      
      // Recent activity
      lastActivity: this.lastActivity,
      timeSinceActivity: Date.now() - this.lastActivity,
      
      // Connection health
      reconnectionAttempts: this.reconnectionAttempts,
      maxReconnectionAttempts: SESSION_CONFIG.MAX_RECONNECTION_ATTEMPTS,
      autoReconnectEnabled: this.userPreferences.autoReconnect
    };
  }

  // Public Disconnection Methods for Different Scenarios

  /**
   * User-initiated disconnection with options
   * @param {Object} options - Disconnection options
   */
  async disconnectUser(options = {}) {
    return await this.disconnect({
      reason: 'user_initiated',
      clearPreferences: options.clearPreferences || false,
      clearUserData: options.clearUserData || false,
      forced: false
    });
  }

  /**
   * Emergency disconnection for security reasons
   * @param {string} securityReason - Specific security reason
   */
  async emergencyDisconnect(securityReason = 'security_threat') {
    console.warn(`Emergency disconnect triggered: ${securityReason}`);
    
    return await this.disconnect({
      reason: `security_${securityReason}`,
      clearPreferences: false,
      clearUserData: false,
      forced: true
    });
  }

  /**
   * Clean disconnection that preserves user preferences
   * Used when switching accounts or networks
   */
  async cleanDisconnect() {
    return await this.disconnect({
      reason: 'clean_switch',
      clearPreferences: false,
      clearUserData: true, // Clear session data but keep preferences
      forced: false
    });
  }

  /**
   * Complete reset - clears everything
   * Nuclear option for troubleshooting
   */
  async resetWallet() {
    console.warn('Performing complete wallet reset - all data will be cleared');
    
    return await this.disconnect({
      reason: 'complete_reset',
      clearPreferences: true,
      clearUserData: true,
      forced: true
    });
  }

  /**
   * Logout - standard user logout that disables auto-reconnect
   */
  async logout() {
    return await this.disconnect({
      reason: 'user_logout',
      clearPreferences: false, // Keep preferences but disable auto-reconnect
      clearUserData: true,
      forced: false
    });
  }

  // Event System

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Emit event to all listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (!this.listeners.has(event)) return;
    
    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} event listener:`, error);
      }
    });
  }

  // Enhanced Disconnection and Cleanup Methods

  /**
   * Clear all timers and intervals
   */
  clearAllTimers() {
    try {
      // Clear session timeout
      this.clearSessionTimeout();
      
      // Clear session refresh interval
      this.clearSessionRefresh();
      
      // Clear any reconnection timers
      if (this.reconnectionTimer) {
        clearTimeout(this.reconnectionTimer);
        this.reconnectionTimer = null;
      }
      
      // Clear any pending connection timeouts
      if (this.connectionTimer) {
        clearTimeout(this.connectionTimer);
        this.connectionTimer = null;
      }

      // Clear health check timer
      if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer);
        this.healthCheckTimer = null;
      }
      
      // Clear network monitoring timer
      if (this.networkMonitoringInterval) {
        clearInterval(this.networkMonitoringInterval);
        this.networkMonitoringInterval = null;
      }
      
      console.log('All timers cleared successfully');
    } catch (error) {
      console.error('Error clearing timers:', error);
    }
  }

  /**
   * Remove all event listeners and cleanup
   */
  removeAllEventListeners() {
    try {
      // Remove wallet adapter listeners
      if (this.adapter) {
        try {
          this.adapter.removeAllListeners();
        } catch (error) {
          console.warn('Error removing adapter listeners:', error);
        }
      }
      
      // Remove activity listeners
      if (typeof window !== 'undefined' && this.activityListeners?.length > 0) {
        this.activityListeners.forEach(({ eventType, handler, target = 'document' }) => {
          try {
            const eventTarget = target === 'window' ? window : document;
            eventTarget.removeEventListener(eventType, handler);
          } catch (error) {
            console.warn(`Error removing ${eventType} listener from ${target}:`, error);
          }
        });
      }
      this.activityListeners = [];
      
      // Clear internal event listeners
      this.listeners.clear();
      
      console.log('All event listeners removed');
    } catch (error) {
      console.error('Error removing event listeners:', error);
    }
  }

  /**
   * Perform comprehensive data cleanup
   * @param {boolean} clearUserData - Clear all user data
   * @param {boolean} clearPreferences - Clear user preferences
   */
  performDataCleanup(clearUserData = false, clearPreferences = false) {
    try {
      // Always clear session data
      this.clearSession();
      
      // Clear user data if requested
      if (clearUserData) {
        this.clearAllUserData();
      }
      
      // Clear preferences if requested
      if (clearPreferences) {
        this.clearUserPreferences();
      }
      
      // Clear any cached data
      this.clearCachedData();
      
      console.log('Data cleanup completed', { clearUserData, clearPreferences });
    } catch (error) {
      console.error('Error during data cleanup:', error);
    }
  }

  /**
   * Disconnect wallet adapter with proper error handling
   * @param {boolean} forced - Force disconnection without waiting
   */
  async disconnectWalletAdapter(forced = false) {
    if (!this.adapter) return;
    
    try {
      if (this.adapter.connected) {
        if (forced) {
          // Don't wait for response in forced mode
          this.adapter.disconnect().catch(err => {
            console.warn('Forced adapter disconnect error (ignored):', err);
          });
        } else {
          // Normal disconnect with timeout
          await Promise.race([
            this.adapter.disconnect(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Adapter disconnect timeout')), 5000)
            )
          ]);
        }
      }
      
      console.log('Wallet adapter disconnected');
    } catch (error) {
      console.error('Wallet adapter disconnect error:', error);
      
      // Force adapter cleanup if normal disconnect fails
      this.forceAdapterCleanup();
    }
  }

  /**
   * Force cleanup of adapter without waiting for responses
   */
  forceAdapterCleanup() {
    try {
      if (this.adapter) {
        // Remove all listeners first
        this.adapter.removeAllListeners();
        
        // Try to set connected state to false if possible
        if (this.adapter._connected !== undefined) {
          this.adapter._connected = false;
        }
        
        // Clear the adapter reference
        this.adapter = null;
      }
      
      console.log('Adapter force cleanup completed');
    } catch (error) {
      console.error('Force adapter cleanup error:', error);
    }
  }

  /**
   * Reset connection state to defaults
   */
  resetConnectionState() {
    this.isConnected = false;
    this.publicKey = null;
    this.isConnecting = false;
    this.reconnectionAttempts = 0;
    this.sessionData = null;
    this.lastActivity = Date.now();
    
    console.log('Connection state reset');
  }

  /**
   * Update preferences based on disconnection type
   * @param {boolean} clearPreferences - Whether to clear preferences
   * @param {string} reason - Disconnection reason
   */
  updateDisconnectionPreferences(clearPreferences, reason) {
    try {
      if (clearPreferences) {
        this.clearUserPreferences();
      } else {
        // Update auto-reconnect based on disconnection reason
        if (reason === 'user_initiated') {
          this.userPreferences.autoReconnect = false;
        } else if (reason === 'account_changed') {
          // Keep auto-reconnect but reset connection attempts
          this.userPreferences.lastAccountChange = Date.now();
        }
        
        this.saveUserPreferences();
      }
    } catch (error) {
      console.error('Error updating disconnection preferences:', error);
    }
  }

  /**
   * Clear all user data from storage
   */
  clearAllUserData() {
    try {
      const keysToRemove = [
        SESSION_KEYS.WALLET_SESSION,
        SESSION_KEYS.SESSION_ACTIVITY,
        SESSION_KEYS.CONNECTION_ATTEMPTS,
        'mlg_clan_wallet_balance_cache',
        'mlg_clan_transaction_history',
        'mlg_clan_token_holdings'
      ];
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to remove ${key}:`, error);
        }
      });
      
      console.log('All user data cleared from storage');
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  /**
   * Clear user preferences
   */
  clearUserPreferences() {
    try {
      localStorage.removeItem(SESSION_KEYS.USER_PREFERENCES);
      this.userPreferences = this.getDefaultPreferences();
      console.log('User preferences cleared and reset to defaults');
    } catch (error) {
      console.error('Error clearing user preferences:', error);
    }
  }

  /**
   * Clear cached data
   */
  clearCachedData() {
    try {
      // Clear any in-memory cache
      if (this.balanceCache) {
        this.balanceCache.clear();
      }
      
      if (this.transactionCache) {
        this.transactionCache.clear();
      }
      
      // Clear session storage cache items
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        if (key.startsWith('mlg_clan_cache_') || key.startsWith(SESSION_CONFIG.SESSION_STORAGE_PREFIX)) {
          sessionStorage.removeItem(key);
        }
      });
      
      console.log('Cached data cleared');
    } catch (error) {
      console.error('Error clearing cached data:', error);
    }
  }

  /**
   * Clear any pending operations and promises
   */
  clearPendingOperations() {
    try {
      // Clear any pending connection promises
      if (this.pendingConnection) {
        this.pendingConnection = null;
      }
      
      // Clear pending balance requests
      if (this.pendingBalanceRequest) {
        this.pendingBalanceRequest = null;
      }
      
      // Reset operation flags
      this.isConnecting = false;
      
      console.log('Pending operations cleared');
    } catch (error) {
      console.error('Error clearing pending operations:', error);
    }
  }

  /**
   * Perform complete destruction of the wallet manager
   * @param {boolean} clearAllData - Clear all data including preferences
   * @param {boolean} keepPreferences - Keep user preferences
   */
  performCompleteDestruction(clearAllData = false, keepPreferences = true) {
    try {
      // Clear all timers and intervals
      this.clearAllTimers();
      
      // Remove all event listeners
      this.removeAllEventListeners();
      
      // Clear all data based on options
      if (clearAllData) {
        this.clearAllUserData();
        if (!keepPreferences) {
          this.clearUserPreferences();
        }
      } else {
        // Just clear session data
        this.clearSession();
        this.clearCachedData();
      }
      
      // Reset all internal state
      this.resetConnectionState();
      
      // Clear pending operations
      this.clearPendingOperations();
      
      // Final adapter cleanup
      this.forceAdapterCleanup();
      
      console.log('Complete wallet manager destruction finished');
    } catch (error) {
      console.error('Error during complete destruction:', error);
    }
  }

  /**
   * Log disconnection events for security auditing
   * @param {string} eventType - Type of disconnection event
   * @param {Object} data - Event data
   */
  logDisconnectionEvent(eventType, data) {
    try {
      const logEntry = {
        timestamp: Date.now(),
        type: eventType,
        data: {
          ...data,
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
          url: typeof window !== 'undefined' ? window.location.href : 'unknown'
        }
      };
      
      // Store in session storage for audit trail (limited to last 100 events)
      const auditKey = 'mlg_clan_disconnect_audit_log';
      let auditLog = [];
      
      try {
        const existingLog = sessionStorage.getItem(auditKey);
        if (existingLog) {
          auditLog = JSON.parse(existingLog);
        }
      } catch (error) {
        // If parsing fails, start fresh
        auditLog = [];
      }
      
      auditLog.push(logEntry);
      
      // Keep only last 100 entries to prevent storage bloat
      if (auditLog.length > 100) {
        auditLog = auditLog.slice(-100);
      }
      
      sessionStorage.setItem(auditKey, JSON.stringify(auditLog));
      
      // Also log to console for development
      console.log(`[WALLET AUDIT] ${eventType}:`, data);
      
    } catch (error) {
      // Don't throw on logging errors, but warn
      console.warn('Failed to log disconnection event:', error);
    }
  }

  /**
   * Get disconnection audit log for security review
   * @returns {Array} Array of audit log entries
   */
  getDisconnectionAuditLog() {
    try {
      const auditKey = 'mlg_clan_disconnect_audit_log';
      const auditLog = sessionStorage.getItem(auditKey);
      return auditLog ? JSON.parse(auditLog) : [];
    } catch (error) {
      console.error('Failed to retrieve audit log:', error);
      return [];
    }
  }

  /**
   * Clear disconnection audit log
   */
  clearDisconnectionAuditLog() {
    try {
      sessionStorage.removeItem('mlg_clan_disconnect_audit_log');
      console.log('Disconnection audit log cleared');
    } catch (error) {
      console.error('Failed to clear audit log:', error);
    }
  }

  /**
   * Handle network change disconnection
   * @param {string} newNetwork - New network identifier
   */
  async handleNetworkChange(newNetwork) {
    console.warn('Network change detected - disconnecting for security');
    
    this.logDisconnectionEvent('network_change_disconnect', {
      oldNetwork: CURRENT_NETWORK,
      newNetwork: newNetwork,
      securityReason: 'network_switch_detected'
    });
    
    await this.disconnect({
      forced: true,
      reason: 'network_changed',
      clearUserData: false,
      clearPreferences: false
    });
    
    this.emit('networkChanged', {
      oldNetwork: CURRENT_NETWORK,
      newNetwork: newNetwork,
      securityDisconnect: true
    });
  }

  /**
   * Handle browser tab visibility change
   */
  handleVisibilityChange() {
    if (document.hidden) {
      // Tab became hidden - update activity but don't disconnect
      console.log('Tab hidden - marking as inactive');
    } else {
      // Tab became visible - update activity and validate connection
      console.log('Tab visible - validating connection');
      this.updateActivityTimestamp();
      
      if (this.isConnected) {
        // Validate connection is still active after tab becomes visible
        this.validateConnection().then(isValid => {
          if (!isValid) {
            console.warn('Connection invalid after tab visibility change');
            this.forceDisconnect('connection_validation_failed');
          }
        }).catch(error => {
          console.error('Connection validation error:', error);
        });
      }
    }
  }

  // Utility Methods

  /**
   * Create user-friendly error messages (legacy method - now uses categorizeConnectionError)
   * @param {Error} error - Original error
   * @returns {Error} User-friendly error
   */
  createUserFriendlyError(error) {
    // Use the new error categorization system
    return this.categorizeConnectionError(error);
  }

  // Enhanced Authentication and Signing Methods

  /**
   * Initialize the authentication system
   */
  initializeAuthentication() {
    try {
      // Load existing auth session if valid
      this.loadAuthSession();
      
      // Clean up expired nonces
      this.cleanupExpiredNonces();
      
      // Set up auth session monitoring
      this.startAuthSessionMonitoring();
      
      console.log('Authentication system initialized');
    } catch (error) {
      console.error('Failed to initialize authentication system:', error);
    }
  }

  /**
   * Generate a secure nonce for authentication
   * @returns {Object} Nonce data
   */
  generateNonce() {
    try {
      // Generate cryptographically secure random bytes
      const randomBytes = new Uint8Array(AUTH_CONFIG.NONCE_LENGTH);
      crypto.getRandomValues(randomBytes);
      
      // Convert to base58 for readability
      const nonce = bs58.encode(randomBytes);
      
      const nonceData = {
        value: nonce,
        timestamp: Date.now(),
        expires: Date.now() + AUTH_CONFIG.NONCE_EXPIRY,
        attempts: 0,
        used: false,
        id: this.generateNonceId()
      };
      
      // Store the nonce
      this.currentNonce = nonceData;
      this.storeNonce(nonceData);
      
      console.log('Generated new nonce:', nonceData.id);
      return nonceData;
    } catch (error) {
      console.error('Failed to generate nonce:', error);
      throw this.createWalletError(ERROR_TYPES.UNKNOWN_ERROR, 'Failed to generate authentication nonce');
    }
  }

  /**
   * Generate unique nonce ID
   * @returns {string} Unique nonce identifier
   */
  generateNonceId() {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${randomPart}`;
  }

  /**
   * Store nonce in secure storage
   * @param {Object} nonceData - Nonce data to store
   */
  storeNonce(nonceData) {
    try {
      const nonceStorage = {
        [nonceData.id]: nonceData,
        current: nonceData.id
      };
      
      // Store in session storage (more secure for temporary data)
      sessionStorage.setItem(SESSION_KEYS.AUTH_NONCE, JSON.stringify(nonceStorage));
    } catch (error) {
      console.error('Failed to store nonce:', error);
    }
  }

  /**
   * Retrieve and validate nonce
   * @param {string} nonceId - Nonce ID to retrieve
   * @returns {Object|null} Nonce data if valid, null otherwise
   */
  retrieveNonce(nonceId) {
    try {
      const nonceStorage = sessionStorage.getItem(SESSION_KEYS.AUTH_NONCE);
      if (!nonceStorage) return null;
      
      const storage = JSON.parse(nonceStorage);
      const nonceData = storage[nonceId];
      
      if (!nonceData) return null;
      
      // Check if nonce has expired
      if (Date.now() > nonceData.expires) {
        console.warn('Nonce expired:', nonceId);
        this.removeNonce(nonceId);
        return null;
      }
      
      // Check if nonce has been used (prevent replay)
      if (nonceData.used) {
        console.warn('Nonce already used:', nonceId);
        return null;
      }
      
      return nonceData;
    } catch (error) {
      console.error('Failed to retrieve nonce:', error);
      return null;
    }
  }

  /**
   * Mark nonce as used
   * @param {string} nonceId - Nonce ID to mark as used
   */
  markNonceAsUsed(nonceId) {
    try {
      const nonceStorage = sessionStorage.getItem(SESSION_KEYS.AUTH_NONCE);
      if (!nonceStorage) return;
      
      const storage = JSON.parse(nonceStorage);
      if (storage[nonceId]) {
        storage[nonceId].used = true;
        storage[nonceId].usedAt = Date.now();
        sessionStorage.setItem(SESSION_KEYS.AUTH_NONCE, JSON.stringify(storage));
      }
    } catch (error) {
      console.error('Failed to mark nonce as used:', error);
    }
  }

  /**
   * Remove nonce from storage
   * @param {string} nonceId - Nonce ID to remove
   */
  removeNonce(nonceId) {
    try {
      const nonceStorage = sessionStorage.getItem(SESSION_KEYS.AUTH_NONCE);
      if (!nonceStorage) return;
      
      const storage = JSON.parse(nonceStorage);
      delete storage[nonceId];
      
      // Update current nonce if this was the current one
      if (storage.current === nonceId) {
        storage.current = null;
      }
      
      sessionStorage.setItem(SESSION_KEYS.AUTH_NONCE, JSON.stringify(storage));
    } catch (error) {
      console.error('Failed to remove nonce:', error);
    }
  }

  /**
   * Clean up expired nonces
   */
  cleanupExpiredNonces() {
    try {
      const nonceStorage = sessionStorage.getItem(SESSION_KEYS.AUTH_NONCE);
      if (!nonceStorage) return;
      
      const storage = JSON.parse(nonceStorage);
      const now = Date.now();
      let cleaned = 0;
      
      Object.keys(storage).forEach(key => {
        if (key === 'current') return;
        
        const nonce = storage[key];
        if (now > nonce.expires) {
          delete storage[key];
          cleaned++;
          
          // Update current nonce if expired
          if (storage.current === key) {
            storage.current = null;
          }
        }
      });
      
      if (cleaned > 0) {
        sessionStorage.setItem(SESSION_KEYS.AUTH_NONCE, JSON.stringify(storage));
        console.log(`Cleaned up ${cleaned} expired nonces`);
      }
    } catch (error) {
      console.error('Failed to cleanup expired nonces:', error);
    }
  }

  /**
   * Create authentication message following SIWS pattern
   * @param {Object} options - Message options
   * @returns {Object} Message data with nonce
   */
  createAuthMessage(options = {}) {
    const {
      domain = AUTH_CONFIG.DOMAIN,
      statement = 'Sign in to MLG.clan with your Solana wallet',
      version = AUTH_CONFIG.MESSAGE_VERSION,
      chainId = this.currentNetwork,
      uri = typeof window !== 'undefined' ? window.location.origin : 'https://mlg.clan',
      issuedAt = new Date().toISOString(),
      resources = []
    } = options;

    if (!this.isConnected || !this.publicKey) {
      throw this.createWalletError(ERROR_TYPES.CONNECTION_FAILED, 'Wallet must be connected before creating auth message');
    }

    // Generate new nonce
    const nonceData = this.generateNonce();
    
    // Create SIWS-compliant message
    const message = {
      domain,
      address: this.publicKey.toBase58(),
      statement,
      uri,
      version,
      chainId,
      nonce: nonceData.value,
      nonceId: nonceData.id,
      issuedAt,
      expirationTime: new Date(Date.now() + AUTH_CONFIG.NONCE_EXPIRY).toISOString(),
      notBefore: issuedAt,
      requestId: this.generateRequestId(),
      resources: [...resources]
    };

    // Create formatted message string
    const messageString = this.formatAuthMessage(message);
    
    return {
      message: messageString,
      messageData: message,
      nonce: nonceData,
      timestamp: Date.now()
    };
  }

  /**
   * Format authentication message into standard SIWS format
   * @param {Object} messageData - Message data object
   * @returns {string} Formatted message string
   */
  formatAuthMessage(messageData) {
    const {
      domain,
      address,
      statement,
      uri,
      version,
      chainId,
      nonce,
      issuedAt,
      expirationTime,
      notBefore,
      requestId,
      resources
    } = messageData;

    let message = `${domain} wants you to sign in with your Solana account:\n${address}`;
    
    if (statement) {
      message += `\n\n${statement}`;
    }
    
    message += `\n\nURI: ${uri}`;
    message += `\nVersion: ${version}`;
    message += `\nChain ID: ${chainId}`;
    message += `\nNonce: ${nonce}`;
    message += `\nIssued At: ${issuedAt}`;
    
    if (expirationTime) {
      message += `\nExpiration Time: ${expirationTime}`;
    }
    
    if (notBefore) {
      message += `\nNot Before: ${notBefore}`;
    }
    
    if (requestId) {
      message += `\nRequest ID: ${requestId}`;
    }
    
    if (resources && resources.length > 0) {
      message += `\nResources:`;
      resources.forEach(resource => {
        message += `\n- ${resource}`;
      });
    }

    return message;
  }

  /**
   * Generate unique request ID
   * @returns {string} Request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Authenticate user with wallet signature
   * @param {Object} options - Authentication options
   * @returns {Promise<Object>} Authentication result
   */
  async authenticate(options = {}) {
    if (this.authenticationInProgress) {
      throw this.createWalletError(ERROR_TYPES.MESSAGE_SIGNING_FAILED, 
        'Authentication already in progress'
      );
    }

    if (!this.isConnected || !this.publicKey) {
      throw this.createWalletError(ERROR_TYPES.CONNECTION_FAILED, 
        'Wallet must be connected before authentication'
      );
    }

    try {
      this.authenticationInProgress = true;
      this.lastAuthAttempt = Date.now();
      this.emit('authenticationStarted', { publicKey: this.publicKey.toBase58() });

      // Create authentication message
      const authData = this.createAuthMessage(options);
      console.log('Created auth message with nonce:', authData.nonce.id);

      // Sign the message
      const signature = await this.signMessage(authData.message, {
        timeout: 60000, // Longer timeout for auth
        skipCache: true, // Always fresh signature for auth
        validateSignature: true
      });

      // Verify the signature locally
      const isValid = await this.verifySignature(authData.message, signature, this.publicKey);
      if (!isValid) {
        throw this.createWalletError(ERROR_TYPES.INVALID_SIGNATURE, 
          'Signature verification failed'
        );
      }

      // Mark nonce as used
      this.markNonceAsUsed(authData.nonce.id);

      // Create authentication session
      const authSession = await this.createAuthSession(authData, signature);
      
      // Store authentication session
      this.authSession = authSession;
      this.saveAuthSession(authSession);

      // Reset retry attempts on success
      this.authRetryAttempts = 0;
      
      this.emit('authenticationCompleted', {
        publicKey: this.publicKey.toBase58(),
        sessionId: authSession.id,
        timestamp: authSession.timestamp
      });

      console.log('Authentication successful for wallet:', this.formatShortAddress(this.publicKey.toBase58()));
      
      return {
        success: true,
        session: authSession,
        publicKey: this.publicKey.toBase58(),
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('Authentication failed:', error);
      this.authRetryAttempts++;
      
      this.emit('authenticationFailed', {
        error: error.type || ERROR_TYPES.MESSAGE_SIGNING_FAILED,
        message: error.userMessage || error.message,
        attempt: this.authRetryAttempts
      });
      
      throw error;
    } finally {
      this.authenticationInProgress = false;
    }
  }

  /**
   * Create authentication session
   * @param {Object} authData - Authentication message data
   * @param {Uint8Array} signature - Wallet signature
   * @returns {Promise<Object>} Authentication session
   */
  async createAuthSession(authData, signature) {
    const sessionId = this.generateSessionId();
    
    const session = {
      id: sessionId,
      publicKey: this.publicKey.toBase58(),
      shortAddress: this.formatShortAddress(this.publicKey.toBase58()),
      signature: bs58.encode(signature),
      message: authData.message,
      messageData: authData.messageData,
      nonce: authData.nonce,
      timestamp: Date.now(),
      expiresAt: Date.now() + AUTH_CONFIG.AUTH_SESSION_TIMEOUT,
      network: this.currentNetwork,
      domain: AUTH_CONFIG.DOMAIN,
      version: AUTH_CONFIG.MESSAGE_VERSION,
      verified: true,
      lastActivity: Date.now()
    };

    // Add signature to used signatures to prevent replay
    this.usedSignatures.add(session.signature);
    
    return session;
  }

  /**
   * Generate unique session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    const timestamp = Date.now().toString(36);
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    const randomPart = bs58.encode(randomBytes).substring(0, 8);
    return `auth_${timestamp}_${randomPart}`;
  }

  /**
   * Verify signature against message and public key
   * @param {string} message - Original message
   * @param {Uint8Array} signature - Signature to verify
   * @param {PublicKey} publicKey - Public key of signer
   * @returns {Promise<boolean>} True if signature is valid
   */
  async verifySignature(message, signature, publicKey) {
    try {
      const encodedMessage = new TextEncoder().encode(message);
      const publicKeyBytes = publicKey.toBytes();
      
      // Use tweetnacl for signature verification
      const isValid = naclVerify(encodedMessage, signature, publicKeyBytes);
      
      console.log('Signature verification result:', isValid);
      return isValid;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Verify authentication session and message
   * @param {Object} sessionData - Session data to verify
   * @returns {Promise<boolean>} True if session is valid
   */
  async verifyAuthSession(sessionData) {
    try {
      // Basic session structure validation
      if (!sessionData || !sessionData.signature || !sessionData.message || !sessionData.publicKey) {
        return false;
      }

      // Check session expiration
      if (Date.now() > sessionData.expiresAt) {
        console.warn('Auth session expired');
        return false;
      }

      // Check for replay attack
      if (this.usedSignatures.has(sessionData.signature)) {
        const signatureAge = Date.now() - sessionData.timestamp;
        if (signatureAge < AUTH_CONFIG.REPLAY_ATTACK_WINDOW) {
          console.warn('Potential replay attack detected');
          return false;
        }
      }

      // Verify the signature
      const publicKey = new PublicKey(sessionData.publicKey);
      const signature = bs58.decode(sessionData.signature);
      const isValidSignature = await this.verifySignature(sessionData.message, signature, publicKey);
      
      if (!isValidSignature) {
        console.warn('Invalid signature in auth session');
        return false;
      }

      // Verify nonce if available
      if (sessionData.nonce && sessionData.messageData) {
        const isValidNonce = this.verifyMessageNonce(sessionData.messageData);
        if (!isValidNonce) {
          console.warn('Invalid nonce in auth session');
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Auth session verification error:', error);
      return false;
    }
  }

  /**
   * Verify nonce in message data
   * @param {Object} messageData - Message data containing nonce
   * @returns {boolean} True if nonce is valid
   */
  verifyMessageNonce(messageData) {
    try {
      if (!messageData.nonce || !messageData.nonceId) {
        return false;
      }

      // Check if nonce exists in our records (even if used)
      const nonceStorage = sessionStorage.getItem(SESSION_KEYS.AUTH_NONCE);
      if (!nonceStorage) return false;
      
      const storage = JSON.parse(nonceStorage);
      const storedNonce = storage[messageData.nonceId];
      
      if (!storedNonce) return false;
      
      // Verify nonce value matches
      if (storedNonce.value !== messageData.nonce) {
        return false;
      }

      // Check expiration based on message timestamp
      const messageTime = new Date(messageData.issuedAt).getTime();
      if (messageTime > storedNonce.expires) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Nonce verification error:', error);
      return false;
    }
  }

  /**
   * Get current authentication session
   * @returns {Object|null} Current auth session or null
   */
  getCurrentAuthSession() {
    if (!this.authSession) return null;
    
    // Check if session is still valid
    if (Date.now() > this.authSession.expiresAt) {
      console.log('Auth session expired, clearing...');
      this.clearAuthSession();
      return null;
    }
    
    return this.authSession;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated() {
    const session = this.getCurrentAuthSession();
    return !!(session && session.verified && this.isConnected);
  }

  /**
   * Refresh authentication session
   * @returns {Promise<Object>} Refreshed session
   */
  async refreshAuthSession() {
    if (!this.isAuthenticated()) {
      throw this.createWalletError(ERROR_TYPES.AUTH_SESSION_EXPIRED, 
        'No valid authentication session to refresh'
      );
    }

    console.log('Refreshing authentication session...');
    
    // Create new authentication
    return await this.authenticate({
      statement: 'Refresh your MLG.clan session',
      refreshing: true
    });
  }

  /**
   * Save authentication session to storage
   * @param {Object} session - Session to save
   */
  saveAuthSession(session) {
    try {
      const sessionData = {
        ...session,
        savedAt: Date.now()
      };
      
      // Store in localStorage for persistence across browser sessions
      localStorage.setItem(SESSION_KEYS.AUTH_SESSION, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Failed to save auth session:', error);
    }
  }

  /**
   * Load authentication session from storage
   */
  loadAuthSession() {
    try {
      const sessionData = localStorage.getItem(SESSION_KEYS.AUTH_SESSION);
      if (!sessionData) return;
      
      const session = JSON.parse(sessionData);
      
      // Verify session integrity
      this.verifyAuthSession(session).then(isValid => {
        if (isValid && Date.now() < session.expiresAt) {
          this.authSession = session;
          
          // Add signature to used signatures set
          this.usedSignatures.add(session.signature);
          
          console.log('Loaded valid auth session:', session.id);
          this.emit('authSessionLoaded', {
            sessionId: session.id,
            publicKey: session.publicKey
          });
        } else {
          console.log('Invalid or expired auth session, clearing...');
          this.clearAuthSession();
        }
      }).catch(error => {
        console.error('Auth session verification failed:', error);
        this.clearAuthSession();
      });
    } catch (error) {
      console.error('Failed to load auth session:', error);
      this.clearAuthSession();
    }
  }

  /**
   * Clear authentication session
   */
  clearAuthSession() {
    try {
      localStorage.removeItem(SESSION_KEYS.AUTH_SESSION);
      this.authSession = null;
      
      console.log('Auth session cleared');
      this.emit('authSessionCleared', { timestamp: Date.now() });
    } catch (error) {
      console.error('Failed to clear auth session:', error);
    }
  }

  /**
   * Start authentication session monitoring
   */
  startAuthSessionMonitoring() {
    // Check session validity periodically
    setInterval(() => {
      if (this.authSession) {
        const timeUntilExpiry = this.authSession.expiresAt - Date.now();
        
        // Emit warning when session is about to expire (15 minutes)
        if (timeUntilExpiry > 0 && timeUntilExpiry < 15 * 60 * 1000) {
          this.emit('authSessionExpiring', {
            sessionId: this.authSession.id,
            expiresAt: this.authSession.expiresAt,
            timeUntilExpiry: timeUntilExpiry
          });
        }
        
        // Clear expired sessions
        if (timeUntilExpiry <= 0) {
          console.log('Auth session expired during monitoring');
          this.clearAuthSession();
          this.emit('authSessionExpired', { timestamp: Date.now() });
        }
      }
    }, 60000); // Check every minute
  }

  /**
   * Sign out user and clear authentication
   */
  async signOut() {
    console.log('Signing out user...');
    
    try {
      // Clear authentication session
      this.clearAuthSession();
      
      // Clear all nonces
      sessionStorage.removeItem(SESSION_KEYS.AUTH_NONCE);
      
      // Clear signature cache
      this.clearSignatureCache();
      
      // Clear used signatures (but keep recent ones for replay protection)
      this.cleanupUsedSignatures();
      
      // Emit sign out event
      this.emit('signedOut', { 
        timestamp: Date.now(),
        publicKey: this.publicKey?.toBase58() || null
      });
      
      console.log('User signed out successfully');
      
    } catch (error) {
      console.error('Error during sign out:', error);
      throw this.createWalletError(ERROR_TYPES.UNKNOWN_ERROR, 'Failed to sign out properly');
    }
  }

  /**
   * Cache signature for performance optimization
   * @param {string} message - Message that was signed
   * @param {Uint8Array} signature - Signature to cache
   */
  cacheSignature(message, signature) {
    try {
      const cacheKey = this.generateSignatureCacheKey(message);
      const cacheEntry = {
        signature: signature,
        timestamp: Date.now(),
        messageHash: cacheKey,
        publicKey: this.publicKey.toBase58()
      };
      
      this.signatureCache.set(cacheKey, cacheEntry);
      
      // Cleanup cache if it gets too large
      if (this.signatureCache.size > AUTH_CONFIG.MAX_SIGNATURE_CACHE) {
        this.cleanupSignatureCache();
      }
    } catch (error) {
      console.error('Failed to cache signature:', error);
    }
  }

  /**
   * Get signature from cache
   * @param {string} message - Message to find signature for
   * @returns {Object|null} Cached signature entry or null
   */
  getSignatureFromCache(message) {
    try {
      const cacheKey = this.generateSignatureCacheKey(message);
      const cacheEntry = this.signatureCache.get(cacheKey);
      
      if (!cacheEntry) return null;
      
      // Check if cache entry is still valid (5 minutes)
      const age = Date.now() - cacheEntry.timestamp;
      if (age > 5 * 60 * 1000) {
        this.signatureCache.delete(cacheKey);
        return null;
      }
      
      // Verify it's for the same public key
      if (cacheEntry.publicKey !== this.publicKey?.toBase58()) {
        this.signatureCache.delete(cacheKey);
        return null;
      }
      
      return cacheEntry;
    } catch (error) {
      console.error('Failed to get signature from cache:', error);
      return null;
    }
  }

  /**
   * Generate cache key for message
   * @param {string} message - Message to generate key for
   * @returns {string} Cache key
   */
  generateSignatureCacheKey(message) {
    // Create a hash of the message for caching
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    return btoa(String.fromCharCode(...data)).substring(0, 32);
  }

  /**
   * Clean up signature cache
   */
  cleanupSignatureCache() {
    try {
      const now = Date.now();
      const maxAge = 5 * 60 * 1000; // 5 minutes
      
      for (const [key, entry] of this.signatureCache.entries()) {
        if (now - entry.timestamp > maxAge) {
          this.signatureCache.delete(key);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup signature cache:', error);
    }
  }

  /**
   * Clear all signature cache
   */
  clearSignatureCache() {
    try {
      this.signatureCache.clear();
      console.log('Signature cache cleared');
    } catch (error) {
      console.error('Failed to clear signature cache:', error);
    }
  }

  /**
   * Clean up used signatures (keep recent ones for replay protection)
   */
  cleanupUsedSignatures() {
    try {
      // In a real implementation, you'd want to keep signatures with timestamps
      // For now, we'll clear old ones periodically
      if (this.usedSignatures.size > 1000) {
        // Keep only the most recent 500 signatures
        const signaturesArray = Array.from(this.usedSignatures);
        this.usedSignatures.clear();
        signaturesArray.slice(-500).forEach(sig => this.usedSignatures.add(sig));
      }
    } catch (error) {
      console.error('Failed to cleanup used signatures:', error);
    }
  }

  /**
   * Categorize signing errors into user-friendly types
   * @param {Error} error - Original signing error
   * @returns {Error} Categorized error
   */
  categorizeSigningError(error) {
    const message = error?.message?.toLowerCase() || '';
    
    // User rejection patterns
    if (message.includes('user rejected') || message.includes('user denied') || 
        message.includes('user cancelled') || message.includes('rejected by user')) {
      return this.createWalletError(ERROR_TYPES.USER_REJECTED_SIGNING, 
        'User cancelled message signing', error);
    }
    
    // Signing not supported
    if (message.includes('not supported') || message.includes('signmessage') || 
        message.includes('signing not available')) {
      return this.createWalletError(ERROR_TYPES.SIGNING_NOT_SUPPORTED, 
        'Message signing not supported by wallet', error);
    }
    
    // Wallet locked
    if (message.includes('locked') || message.includes('unlock')) {
      return this.createWalletError(ERROR_TYPES.WALLET_LOCKED, 
        'Wallet is locked - please unlock and try again', error);
    }
    
    // Timeout
    if (message.includes('timeout') || message.includes('timed out')) {
      return this.createWalletError(ERROR_TYPES.MESSAGE_SIGNING_FAILED, 
        'Message signing timed out', error);
    }
    
    // Invalid signature
    if (message.includes('invalid signature') || message.includes('verification failed')) {
      return this.createWalletError(ERROR_TYPES.INVALID_SIGNATURE, 
        'Signature verification failed', error);
    }
    
    // Generic signing failure
    return this.createWalletError(ERROR_TYPES.MESSAGE_SIGNING_FAILED, 
      error.message || 'Message signing failed', error);
  }

  /**
   * Get comprehensive authentication status
   * @returns {Object} Authentication status information
   */
  getAuthenticationStatus() {
    const session = this.getCurrentAuthSession();
    
    return {
      isAuthenticated: this.isAuthenticated(),
      isConnected: this.isConnected,
      hasAuthSession: !!session,
      authSessionId: session?.id || null,
      publicKey: this.publicKey?.toBase58() || null,
      shortAddress: this.publicKey ? this.formatShortAddress(this.publicKey.toBase58()) : null,
      
      // Session details
      sessionExpiresAt: session?.expiresAt || null,
      sessionTimeRemaining: session ? session.expiresAt - Date.now() : null,
      sessionValid: session ? Date.now() < session.expiresAt : false,
      
      // Authentication state
      authenticationInProgress: this.authenticationInProgress,
      lastAuthAttempt: this.lastAuthAttempt,
      authRetryAttempts: this.authRetryAttempts,
      
      // Nonce status
      hasCurrentNonce: !!this.currentNonce,
      currentNonceId: this.currentNonce?.id || null,
      nonceExpires: this.currentNonce?.expires || null,
      
      // Capabilities
      signingSupported: !!(this.adapter && this.adapter.signMessage),
      canAuthenticate: this.isConnected && !this.authenticationInProgress,
      
      // Security info
      signatureCacheSize: this.signatureCache.size,
      usedSignaturesCount: this.usedSignatures.size,
      network: this.currentNetwork
    };
  }

  /**
   * Enhanced disconnection that clears authentication data
   */
  async disconnect(options = {}) {
    // Clear authentication data before disconnecting
    try {
      await this.signOut();
    } catch (error) {
      console.warn('Error clearing auth data during disconnect:', error);
    }
    
    // Find and call the original disconnect method from the parent chain
    let currentProto = Object.getPrototypeOf(this);
    while (currentProto) {
      if (currentProto.hasOwnProperty('disconnect') && currentProto.disconnect !== this.disconnect) {
        return await currentProto.disconnect.call(this, options);
      }
      currentProto = Object.getPrototypeOf(currentProto);
    }
    
    // Fallback basic disconnect if no parent method found
    this.isConnected = false;
    this.publicKey = null;
    this.emit('disconnected', { reason: 'manual', timestamp: Date.now() });
  }

  /**
   * Comprehensive cleanup and destruction of wallet manager
   * This is the nuclear option - clears everything
   * @param {Object} options - Destruction options
   */
  async destroy(options = {}) {
    const {
      clearAllData = false,
      keepPreferences = true,
      reason = 'destroy_called'
    } = options;
    
    console.log('Destroying PhantomWalletManager...');
    
    try {
      // Log destruction event
      this.logDisconnectionEvent('wallet_manager_destroy_initiated', {
        reason,
        clearAllData,
        keepPreferences,
        timestamp: Date.now()
      });
      
      // First disconnect if connected
      if (this.isConnected || this.adapter?.connected) {
        await this.disconnect({
          forced: true,
          reason: 'manager_destroyed',
          clearUserData: clearAllData,
          clearPreferences: !keepPreferences
        });
      }
      
      // Complete cleanup of all resources
      this.performCompleteDestruction(clearAllData, keepPreferences);
      
      // Log successful destruction
      this.logDisconnectionEvent('wallet_manager_destroy_completed', {
        reason,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Error during wallet manager destruction:', error);
      
      // Force cleanup even if normal destruction fails
      this.performCompleteDestruction(clearAllData, keepPreferences);
      
      this.logDisconnectionEvent('wallet_manager_destroy_error', {
        reason,
        error: error.message,
        timestamp: Date.now()
      });
    }
  }
}

// Singleton instance for global use
let walletManagerInstance = null;

/**
 * Get the global wallet manager instance
 * @returns {PhantomWalletManager} Wallet manager instance
 */
export function getWalletManager() {
  if (!walletManagerInstance) {
    walletManagerInstance = new PhantomWalletManager();
  }
  return walletManagerInstance;
}

/**
 * Initialize wallet manager (call this once at app startup)
 * @returns {PhantomWalletManager} Initialized wallet manager
 */
export function initializeWallet() {
  if (walletManagerInstance) {
    walletManagerInstance.destroy();
  }
  
  walletManagerInstance = new PhantomWalletManager();
  return walletManagerInstance;
}

// Export for direct class usage
export default PhantomWalletManager;