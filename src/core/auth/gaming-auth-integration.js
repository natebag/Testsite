/**
 * Gaming Authentication Integration Layer for MLG.clan Platform
 * Integrates all authentication components with existing MLG platform systems
 * 
 * Features:
 * - Unified authentication interface for all gaming features
 * - Integration with existing wallet, clan, tournament, and voting systems
 * - Backward compatibility with existing authentication
 * - Performance optimized integration
 * - Comprehensive error handling and fallbacks
 * 
 * @author Claude Code - Security and Performance Auditor
 * @version 2.0.0
 * @created 2025-08-13
 */

import GamingAuthService from './gaming-auth-service.js';
import Web3WalletManager from './web3-wallet-manager.js';
import GamingSessionManager from './gaming-session-manager.js';
import GamingMFASystem from './gaming-mfa-system.js';
import GamingPlatformAuth from './gaming-platform-auth.js';
import GamingAuthSecurityMonitor from './gaming-auth-security-monitor.js';
import { EventEmitter } from 'events';

/**
 * Integration Configuration
 */
const INTEGRATION_CONFIG = {
  // Component Integration
  COMPONENTS: {
    authService: { required: true, fallback: null },
    walletManager: { required: true, fallback: null },
    sessionManager: { required: true, fallback: null },
    mfaSystem: { required: false, fallback: 'basic' },
    platformAuth: { required: true, fallback: null },
    securityMonitor: { required: false, fallback: 'logging' }
  },
  
  // Existing System Integration
  EXISTING_SYSTEMS: {
    mlgApiClient: true,
    mlgWalletInit: true,
    mlgCacheManager: true,
    clanManagement: true,
    votingSystem: true,
    contentSystem: true
  },
  
  // Performance Settings
  PERFORMANCE: {
    componentInitTimeout: 5000, // 5 seconds
    fallbackTimeout: 1000, // 1 second
    healthCheckInterval: 30000, // 30 seconds
    metricsCollection: true
  },
  
  // Compatibility Settings
  COMPATIBILITY: {
    backwardCompatible: true,
    migrationMode: false,
    legacySupport: true,
    gracefulDegradation: true
  }
};

/**
 * Integration Events
 */
const INTEGRATION_EVENTS = {
  COMPONENT_READY: 'component_ready',
  COMPONENT_ERROR: 'component_error',
  FALLBACK_ACTIVATED: 'fallback_activated',
  HEALTH_CHECK: 'health_check',
  PERFORMANCE_WARNING: 'performance_warning',
  MIGRATION_COMPLETE: 'migration_complete'
};

/**
 * Gaming Authentication Integration Class
 */
class GamingAuthIntegration extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = options;
    this.logger = options.logger || console;
    this.db = options.db;
    this.redis = options.redis;
    
    // Component instances
    this.components = {
      authService: null,
      walletManager: null,
      sessionManager: null,
      mfaSystem: null,
      platformAuth: null,
      securityMonitor: null
    };
    
    // Integration state
    this.initialized = false;
    this.fallbackMode = false;
    this.healthStatus = new Map();
    
    // Performance tracking
    this.metrics = {
      componentLatencies: new Map(),
      operationCounts: new Map(),
      errorCounts: new Map(),
      fallbackActivations: 0
    };
    
    // Existing system references
    this.existingSystems = {
      mlgApiClient: null,
      mlgWalletInit: null,
      mlgCacheManager: null
    };
  }
  
  /**
   * Initialize All Authentication Components
   */
  async initialize() {
    this.logger.info('🔧 Initializing Gaming Authentication Integration...');
    
    try {
      // Initialize components in dependency order
      await this.initializeComponents();
      
      // Setup existing system integration
      await this.setupExistingSystemIntegration();
      
      // Setup health monitoring
      this.setupHealthMonitoring();
      
      // Setup performance monitoring
      this.setupPerformanceMonitoring();
      
      // Setup fallback mechanisms
      this.setupFallbackMechanisms();
      
      this.initialized = true;
      this.logger.info('✅ Gaming Authentication Integration initialized successfully');
      
      return { success: true, components: this.getComponentStatus() };
      
    } catch (error) {
      this.logger.error('❌ Gaming Authentication Integration failed to initialize:', error);
      
      // Activate fallback mode
      await this.activateFallbackMode();
      
      return { success: false, error: error.message, fallbackActive: true };
    }
  }
  
  /**
   * Initialize Individual Components
   */
  async initializeComponents() {
    const initPromises = [];
    
    // Initialize core authentication service
    initPromises.push(this.initializeAuthService());
    
    // Initialize Web3 wallet manager
    initPromises.push(this.initializeWalletManager());
    
    // Initialize session manager
    initPromises.push(this.initializeSessionManager());
    
    // Initialize MFA system (optional)
    if (INTEGRATION_CONFIG.COMPONENTS.mfaSystem.required) {
      initPromises.push(this.initializeMFASystem());
    }
    
    // Initialize platform authentication
    initPromises.push(this.initializePlatformAuth());
    
    // Initialize security monitor (optional)
    if (INTEGRATION_CONFIG.COMPONENTS.securityMonitor.required) {
      initPromises.push(this.initializeSecurityMonitor());
    }
    
    // Wait for all components with timeout
    await Promise.race([
      Promise.all(initPromises),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Component initialization timeout')), 
        INTEGRATION_CONFIG.PERFORMANCE.componentInitTimeout)
      )
    ]);
  }
  
  async initializeAuthService() {
    try {
      this.components.authService = new GamingAuthService({
        db: this.db,
        redis: this.redis,
        logger: this.logger,
        performanceMonitor: this.metrics
      });
      
      this.healthStatus.set('authService', 'healthy');
      this.emit(INTEGRATION_EVENTS.COMPONENT_READY, { component: 'authService' });
      
    } catch (error) {
      this.healthStatus.set('authService', 'failed');
      this.emit(INTEGRATION_EVENTS.COMPONENT_ERROR, { 
        component: 'authService', 
        error: error.message 
      });
      throw error;
    }
  }
  
  async initializeWalletManager() {
    try {
      this.components.walletManager = new Web3WalletManager({
        network: this.options.network || 'mainnet',
        logger: this.logger,
        authService: this.components.authService
      });
      
      this.healthStatus.set('walletManager', 'healthy');
      this.emit(INTEGRATION_EVENTS.COMPONENT_READY, { component: 'walletManager' });
      
    } catch (error) {
      this.healthStatus.set('walletManager', 'failed');
      this.emit(INTEGRATION_EVENTS.COMPONENT_ERROR, { 
        component: 'walletManager', 
        error: error.message 
      });
      throw error;
    }
  }
  
  async initializeSessionManager() {
    try {
      this.components.sessionManager = new GamingSessionManager({
        db: this.db,
        redis: this.redis,
        logger: this.logger,
        encryptionKey: this.options.encryptionKey
      });
      
      this.healthStatus.set('sessionManager', 'healthy');
      this.emit(INTEGRATION_EVENTS.COMPONENT_READY, { component: 'sessionManager' });
      
    } catch (error) {
      this.healthStatus.set('sessionManager', 'failed');
      this.emit(INTEGRATION_EVENTS.COMPONENT_ERROR, { 
        component: 'sessionManager', 
        error: error.message 
      });
      throw error;
    }
  }
  
  async initializeMFASystem() {
    try {
      this.components.mfaSystem = new GamingMFASystem({
        db: this.db,
        redis: this.redis,
        logger: this.logger,
        smsProvider: this.options.smsProvider,
        emailProvider: this.options.emailProvider
      });
      
      this.healthStatus.set('mfaSystem', 'healthy');
      this.emit(INTEGRATION_EVENTS.COMPONENT_READY, { component: 'mfaSystem' });
      
    } catch (error) {
      this.healthStatus.set('mfaSystem', 'failed');
      this.emit(INTEGRATION_EVENTS.COMPONENT_ERROR, { 
        component: 'mfaSystem', 
        error: error.message 
      });
      
      // MFA is optional, continue without it
      this.logger.warn('MFA system failed to initialize, continuing without MFA');
    }
  }
  
  async initializePlatformAuth() {
    try {
      this.components.platformAuth = new GamingPlatformAuth({
        db: this.db,
        redis: this.redis,
        logger: this.logger,
        web3Manager: this.components.walletManager,
        sessionManager: this.components.sessionManager,
        mfaSystem: this.components.mfaSystem
      });
      
      this.healthStatus.set('platformAuth', 'healthy');
      this.emit(INTEGRATION_EVENTS.COMPONENT_READY, { component: 'platformAuth' });
      
    } catch (error) {
      this.healthStatus.set('platformAuth', 'failed');
      this.emit(INTEGRATION_EVENTS.COMPONENT_ERROR, { 
        component: 'platformAuth', 
        error: error.message 
      });
      throw error;
    }
  }
  
  async initializeSecurityMonitor() {
    try {
      this.components.securityMonitor = new GamingAuthSecurityMonitor({
        db: this.db,
        redis: this.redis,
        logger: this.logger,
        geoIP: this.options.geoIP
      });
      
      this.healthStatus.set('securityMonitor', 'healthy');
      this.emit(INTEGRATION_EVENTS.COMPONENT_READY, { component: 'securityMonitor' });
      
    } catch (error) {
      this.healthStatus.set('securityMonitor', 'failed');
      this.emit(INTEGRATION_EVENTS.COMPONENT_ERROR, { 
        component: 'securityMonitor', 
        error: error.message 
      });
      
      // Security monitor is optional, continue without it
      this.logger.warn('Security monitor failed to initialize, continuing without enhanced monitoring');
    }
  }
  
  /**
   * Setup Integration with Existing Systems
   */
  async setupExistingSystemIntegration() {
    this.logger.info('🔗 Setting up existing system integration...');
    
    // Integration with existing MLG API Client
    if (INTEGRATION_CONFIG.EXISTING_SYSTEMS.mlgApiClient) {
      await this.integrateWithApiClient();
    }
    
    // Integration with existing wallet initialization
    if (INTEGRATION_CONFIG.EXISTING_SYSTEMS.mlgWalletInit) {
      await this.integrateWithWalletInit();
    }
    
    // Integration with existing cache manager
    if (INTEGRATION_CONFIG.EXISTING_SYSTEMS.mlgCacheManager) {
      await this.integrateWithCacheManager();
    }
    
    // Integration with clan management
    if (INTEGRATION_CONFIG.EXISTING_SYSTEMS.clanManagement) {
      await this.integrateWithClanManagement();
    }
    
    // Integration with voting system
    if (INTEGRATION_CONFIG.EXISTING_SYSTEMS.votingSystem) {
      await this.integrateWithVotingSystem();
    }
    
    this.logger.info('✅ Existing system integration complete');
  }
  
  async integrateWithApiClient() {
    try {
      // Get reference to existing API client
      if (typeof window !== 'undefined' && window.MLGApiClient) {
        this.existingSystems.mlgApiClient = window.MLGApiClient;
        
        // Extend API client with authentication methods
        this.extendApiClientWithAuth();
        
        this.logger.info('✅ Integrated with existing MLG API Client');
      }
    } catch (error) {
      this.logger.error('Failed to integrate with API client:', error);
    }
  }
  
  async integrateWithWalletInit() {
    try {
      // Get reference to existing wallet initialization
      if (typeof window !== 'undefined' && window.MLGWalletInit) {
        this.existingSystems.mlgWalletInit = window.MLGWalletInit;
        
        // Enhance wallet initialization with new authentication
        this.enhanceWalletInit();
        
        this.logger.info('✅ Integrated with existing MLG Wallet Init');
      }
    } catch (error) {
      this.logger.error('Failed to integrate with wallet init:', error);
    }
  }
  
  async integrateWithCacheManager() {
    try {
      // Get reference to existing cache manager
      if (typeof window !== 'undefined' && window.MLGCacheManager) {
        this.existingSystems.mlgCacheManager = window.MLGCacheManager;
        
        // Integrate authentication caching
        this.integrateCaching();
        
        this.logger.info('✅ Integrated with existing MLG Cache Manager');
      }
    } catch (error) {
      this.logger.error('Failed to integrate with cache manager:', error);
    }
  }
  
  /**
   * Unified Authentication API
   */
  async authenticate(method, credentials, options = {}) {
    const startTime = Date.now();
    
    try {
      // Check security first
      if (this.components.securityMonitor) {
        const rateLimitCheck = await this.components.securityMonitor.checkRateLimit(
          credentials.identifier || credentials.email || credentials.walletAddress,
          'authentication',
          options
        );
        
        if (!rateLimitCheck.allowed) {
          throw new Error('Rate limit exceeded');
        }
        
        // Threat detection
        const threatDetection = await this.components.securityMonitor.detectThreats(
          credentials.identifier || credentials.email || credentials.walletAddress,
          'authentication',
          options
        );
        
        if (threatDetection.actionRequired) {
          await this.components.securityMonitor.takeSecurityAction(
            credentials.identifier,
            threatDetection.actionRequired.action,
            options
          );
          throw new Error(`Security action required: ${threatDetection.actionRequired.reason}`);
        }
      }
      
      let authResult;
      
      // Route to appropriate authentication method
      switch (method) {
        case 'email':
          authResult = await this.components.authService.authenticateWithEmail(
            credentials.email,
            credentials.password,
            options
          );
          break;
          
        case 'wallet':
          authResult = await this.components.authService.authenticateWithWallet(
            credentials.walletType,
            credentials.publicKey,
            credentials.signature,
            credentials.message,
            options
          );
          break;
          
        case 'social':
          authResult = await this.components.authService.authenticateWithSocial(
            credentials.provider,
            credentials.authCode,
            options
          );
          break;
          
        default:
          throw new Error(`Unknown authentication method: ${method}`);
      }
      
      // Handle MFA requirement
      if (authResult.requiresMFA && this.components.mfaSystem) {
        return await this.handleMFARequirement(authResult, options);
      }
      
      const latency = Date.now() - startTime;
      this.recordOperation('authenticate', latency, true);
      
      return {
        success: true,
        ...authResult,
        latency
      };
      
    } catch (error) {
      const latency = Date.now() - startTime;
      this.recordOperation('authenticate', latency, false);
      
      this.logger.error('Authentication failed:', error);
      throw error;
    }
  }
  
  /**
   * Gaming Feature Authentication
   */
  async authenticateForTournament(userId, tournamentId, options = {}) {
    try {
      return await this.components.platformAuth.authenticateForTournament(
        userId,
        tournamentId,
        options.action || 'join'
      );
    } catch (error) {
      return this.handleAuthenticationError('tournament', error, options);
    }
  }
  
  async authenticateForClan(userId, clanId, options = {}) {
    try {
      return await this.components.platformAuth.authenticateForClan(
        userId,
        clanId,
        options.action || 'view'
      );
    } catch (error) {
      return this.handleAuthenticationError('clan', error, options);
    }
  }
  
  async authenticateForVoting(userId, proposalId, voteData, options = {}) {
    try {
      return await this.components.platformAuth.authenticateForVoting(
        userId,
        proposalId,
        voteData
      );
    } catch (error) {
      return this.handleAuthenticationError('voting', error, options);
    }
  }
  
  /**
   * Session Management
   */
  async createSession(userId, sessionType, options = {}) {
    try {
      return await this.components.sessionManager.createSession(
        userId,
        sessionType,
        options
      );
    } catch (error) {
      return this.handleSessionError('create', error, options);
    }
  }
  
  async validateSession(sessionToken, options = {}) {
    try {
      return await this.components.sessionManager.validateSession(
        sessionToken,
        options
      );
    } catch (error) {
      return this.handleSessionError('validate', error, options);
    }
  }
  
  /**
   * Wallet Management
   */
  async connectWallet(walletType, options = {}) {
    try {
      return await this.components.walletManager.connectWallet(walletType, options);
    } catch (error) {
      return this.handleWalletError('connect', error, options);
    }
  }
  
  async switchWallet(walletType) {
    try {
      return await this.components.walletManager.switchWallet(walletType);
    } catch (error) {
      return this.handleWalletError('switch', error);
    }
  }
  
  /**
   * Error Handling and Fallbacks
   */
  handleAuthenticationError(type, error, options = {}) {
    this.recordOperation(`${type}_auth`, 0, false);
    
    if (INTEGRATION_CONFIG.COMPATIBILITY.gracefulDegradation) {
      // Attempt fallback authentication
      return this.attemptFallbackAuth(type, error, options);
    }
    
    throw error;
  }
  
  handleSessionError(operation, error, options = {}) {
    this.recordOperation(`session_${operation}`, 0, false);
    
    if (INTEGRATION_CONFIG.COMPATIBILITY.gracefulDegradation) {
      // Attempt fallback session management
      return this.attemptFallbackSession(operation, error, options);
    }
    
    throw error;
  }
  
  handleWalletError(operation, error, options = {}) {
    this.recordOperation(`wallet_${operation}`, 0, false);
    
    if (INTEGRATION_CONFIG.COMPATIBILITY.gracefulDegradation) {
      // Attempt fallback wallet operation
      return this.attemptFallbackWallet(operation, error, options);
    }
    
    throw error;
  }
  
  async activateFallbackMode() {
    this.fallbackMode = true;
    this.metrics.fallbackActivations++;
    
    this.emit(INTEGRATION_EVENTS.FALLBACK_ACTIVATED, {
      timestamp: new Date(),
      reason: 'Component initialization failure'
    });
    
    this.logger.warn('⚠️  Fallback mode activated');
  }
  
  /**
   * Health Monitoring
   */
  setupHealthMonitoring() {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, INTEGRATION_CONFIG.PERFORMANCE.healthCheckInterval);
  }
  
  async performHealthCheck() {
    const healthResults = {};
    
    for (const [componentName, component] of Object.entries(this.components)) {
      if (component && typeof component.getPerformanceMetrics === 'function') {
        try {
          const metrics = component.getPerformanceMetrics();
          healthResults[componentName] = {
            status: 'healthy',
            metrics
          };
        } catch (error) {
          healthResults[componentName] = {
            status: 'unhealthy',
            error: error.message
          };
        }
      }
    }
    
    this.emit(INTEGRATION_EVENTS.HEALTH_CHECK, {
      timestamp: new Date(),
      results: healthResults
    });
  }
  
  /**
   * Performance Monitoring
   */
  setupPerformanceMonitoring() {
    this.performanceInterval = setInterval(() => {
      this.analyzePerformance();
    }, 30000); // Every 30 seconds
  }
  
  analyzePerformance() {
    const overallLatency = this.calculateOverallLatency();
    const errorRate = this.calculateErrorRate();
    
    if (overallLatency > 500) { // 500ms threshold
      this.emit(INTEGRATION_EVENTS.PERFORMANCE_WARNING, {
        type: 'high_latency',
        value: overallLatency,
        threshold: 500
      });
    }
    
    if (errorRate > 0.05) { // 5% error rate threshold
      this.emit(INTEGRATION_EVENTS.PERFORMANCE_WARNING, {
        type: 'high_error_rate',
        value: errorRate,
        threshold: 0.05
      });
    }
  }
  
  /**
   * Utility Methods
   */
  recordOperation(operation, latency, success) {
    if (!this.metrics.operationCounts.has(operation)) {
      this.metrics.operationCounts.set(operation, { success: 0, failure: 0 });
      this.metrics.componentLatencies.set(operation, []);
    }
    
    if (success) {
      this.metrics.operationCounts.get(operation).success++;
    } else {
      this.metrics.operationCounts.get(operation).failure++;
    }
    
    if (latency > 0) {
      this.metrics.componentLatencies.get(operation).push(latency);
    }
  }
  
  calculateOverallLatency() {
    let totalLatency = 0;
    let totalOperations = 0;
    
    for (const latencies of this.metrics.componentLatencies.values()) {
      totalLatency += latencies.reduce((sum, latency) => sum + latency, 0);
      totalOperations += latencies.length;
    }
    
    return totalOperations > 0 ? totalLatency / totalOperations : 0;
  }
  
  calculateErrorRate() {
    let totalSuccess = 0;
    let totalFailure = 0;
    
    for (const counts of this.metrics.operationCounts.values()) {
      totalSuccess += counts.success;
      totalFailure += counts.failure;
    }
    
    const total = totalSuccess + totalFailure;
    return total > 0 ? totalFailure / total : 0;
  }
  
  getComponentStatus() {
    const status = {};
    
    for (const [componentName, component] of Object.entries(this.components)) {
      status[componentName] = {
        initialized: component !== null,
        healthy: this.healthStatus.get(componentName) === 'healthy'
      };
    }
    
    return status;
  }
  
  getIntegrationMetrics() {
    return {
      initialized: this.initialized,
      fallbackMode: this.fallbackMode,
      overallLatency: this.calculateOverallLatency(),
      errorRate: this.calculateErrorRate(),
      fallbackActivations: this.metrics.fallbackActivations,
      componentStatus: this.getComponentStatus(),
      operationCounts: Object.fromEntries(this.metrics.operationCounts)
    };
  }
  
  /**
   * Extension Methods for Existing Systems
   */
  extendApiClientWithAuth() {
    if (this.existingSystems.mlgApiClient) {
      const apiClient = this.existingSystems.mlgApiClient;
      
      // Add authentication methods to existing API client
      apiClient.authenticateUser = async (method, credentials, options) => {
        return await this.authenticate(method, credentials, options);
      };
      
      apiClient.validateSession = async (sessionToken, options) => {
        return await this.validateSession(sessionToken, options);
      };
      
      apiClient.connectWallet = async (walletType, options) => {
        return await this.connectWallet(walletType, options);
      };
    }
  }
  
  enhanceWalletInit() {
    if (this.existingSystems.mlgWalletInit) {
      const walletInit = this.existingSystems.mlgWalletInit;
      
      // Enhance existing wallet initialization with new features
      const originalInit = walletInit.init;
      walletInit.init = async (options) => {
        // Call original initialization
        const result = await originalInit.call(walletInit, options);
        
        // Add new authentication features
        if (result.success && this.components.walletManager) {
          await this.components.walletManager.init();
        }
        
        return result;
      };
    }
  }
  
  integrateCaching() {
    if (this.existingSystems.mlgCacheManager) {
      // Integrate authentication caching with existing cache manager
      const cacheManager = this.existingSystems.mlgCacheManager;
      
      // Add authentication-specific caching methods
      cacheManager.cacheUserSession = (userId, sessionData, ttl) => {
        return cacheManager.set(`auth_session:${userId}`, sessionData, ttl);
      };
      
      cacheManager.getCachedUserSession = (userId) => {
        return cacheManager.get(`auth_session:${userId}`);
      };
    }
  }
  
  // Cleanup method
  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.performanceInterval) {
      clearInterval(this.performanceInterval);
    }
    
    // Destroy all components
    for (const component of Object.values(this.components)) {
      if (component && typeof component.destroy === 'function') {
        component.destroy();
      }
    }
    
    this.logger.info('🔧 Gaming Authentication Integration destroyed');
  }
}

export default GamingAuthIntegration;
export { INTEGRATION_CONFIG, INTEGRATION_EVENTS };