/**
 * LogRocket Session Recording and User Analytics
 * Production-ready session recording and user experience monitoring for MLG.clan platform
 */

import environmentManager from '../config/environment-manager.js';

class LogRocketManager {
  constructor() {
    this.initialized = false;
    this.config = environmentManager.get('monitoring.logRocket');
    this.sessionData = new Map();
  }

  /**
   * Initialize LogRocket (client-side only)
   */
  initializeClient() {
    if (typeof window === 'undefined' || this.initialized || !this.config.appId) {
      return;
    }

    try {
      // Load LogRocket script dynamically
      this.loadLogRocketScript().then(() => {
        if (window.LogRocket) {
          window.LogRocket.init(this.config.appId, {
            // Gaming platform configuration
            release: process.env.GIT_SHA || '1.0.0',
            
            // Privacy and GDPR compliance
            shouldCaptureIP: false,
            shouldDebugLog: !environmentManager.isProduction(),
            
            // Performance optimization
            uploadTimeSlice: 5000,
            captureConsole: true,
            captureExceptions: true,
            
            // Gaming-specific configuration
            dom: {
              inputSanitizer: this.sanitizeGameInputs.bind(this),
              textSanitizer: this.sanitizeGameText.bind(this),
              isEnabled: true
            },
            
            network: {
              requestSanitizer: this.sanitizeNetworkRequests.bind(this),
              responseSanitizer: this.sanitizeNetworkResponses.bind(this),
              isEnabled: true
            },
            
            // Console capture configuration
            console: {
              shouldAggregateConsoleErrors: true,
              isEnabled: {
                log: true,
                info: true,
                warn: true,
                error: true,
                debug: false
              }
            }
          });

          this.setupGamingIntegrations();
          this.initialized = true;
          console.log('LogRocket session recording initialized');
        }
      });
    } catch (error) {
      console.error('Failed to initialize LogRocket:', error);
    }
  }

  /**
   * Load LogRocket script dynamically
   */
  loadLogRocketScript() {
    return new Promise((resolve, reject) => {
      if (window.LogRocket) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.lr-ingest.io/LogRocket.min.js';
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Setup gaming-specific integrations
   */
  setupGamingIntegrations() {
    if (!window.LogRocket) return;

    // Track gaming-specific events
    this.trackGamingEvents();
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring();
    
    // Setup Web3/blockchain event tracking
    this.setupWeb3Tracking();
    
    // Setup clan activity tracking
    this.setupClanTracking();
  }

  /**
   * Track gaming-specific events
   */
  trackGamingEvents() {
    // Vote casting events
    this.addEventTracker('vote-cast', (data) => {
      window.LogRocket.track('Gaming: Vote Cast', {
        proposal_id: data.proposalId,
        vote_type: data.voteType,
        tokens_burned: data.tokensBurned,
        voting_power: data.votingPower
      });
    });

    // Clan activities
    this.addEventTracker('clan-action', (data) => {
      window.LogRocket.track('Gaming: Clan Action', {
        action: data.action,
        clan_id: data.clanId,
        member_count: data.memberCount,
        role: data.role
      });
    });

    // Content interactions
    this.addEventTracker('content-interaction', (data) => {
      window.LogRocket.track('Gaming: Content Interaction', {
        content_type: data.contentType,
        action: data.action,
        content_id: data.contentId,
        creator: data.creator
      });
    });

    // Tournament activities
    this.addEventTracker('tournament-activity', (data) => {
      window.LogRocket.track('Gaming: Tournament Activity', {
        tournament_id: data.tournamentId,
        action: data.action,
        participant_count: data.participantCount,
        prize_pool: data.prizePool
      });
    });
  }

  /**
   * Setup performance monitoring for gaming features
   */
  setupPerformanceMonitoring() {
    // Track Web3 transaction performance
    this.addPerformanceTracker('web3-transaction', (timing) => {
      window.LogRocket.track('Performance: Web3 Transaction', {
        duration: timing.duration,
        transaction_type: timing.type,
        network: timing.network,
        success: timing.success
      });
    });

    // Track page load performance for gaming features
    this.addPerformanceTracker('gaming-page-load', (timing) => {
      window.LogRocket.track('Performance: Gaming Page Load', {
        page: timing.page,
        load_time: timing.loadTime,
        interactive_time: timing.interactiveTime,
        feature: timing.feature
      });
    });

    // Track voting system performance
    this.addPerformanceTracker('voting-performance', (timing) => {
      window.LogRocket.track('Performance: Voting System', {
        action: timing.action,
        duration: timing.duration,
        tokens_involved: timing.tokensInvolved,
        blockchain_time: timing.blockchainTime
      });
    });
  }

  /**
   * Setup Web3 and blockchain event tracking
   */
  setupWeb3Tracking() {
    // Wallet connection tracking
    this.addEventTracker('wallet-connection', (data) => {
      window.LogRocket.track('Web3: Wallet Connection', {
        wallet_type: data.walletType,
        network: data.network,
        success: data.success,
        error_type: data.errorType
      });
    });

    // Transaction tracking
    this.addEventTracker('blockchain-transaction', (data) => {
      window.LogRocket.track('Web3: Transaction', {
        transaction_type: data.type,
        signature: data.signature ? 'present' : 'missing',
        amount: data.amount,
        success: data.success,
        error: data.error
      });
    });

    // Token operations
    this.addEventTracker('token-operation', (data) => {
      window.LogRocket.track('Web3: Token Operation', {
        operation: data.operation,
        token_amount: data.amount,
        token_type: 'MLG',
        success: data.success
      });
    });
  }

  /**
   * Setup clan activity tracking
   */
  setupClanTracking() {
    // Clan creation/joining
    this.addEventTracker('clan-membership', (data) => {
      window.LogRocket.track('Clan: Membership Change', {
        action: data.action,
        clan_id: data.clanId,
        clan_name: data.clanName,
        member_role: data.role,
        member_count: data.memberCount
      });
    });

    // Clan governance
    this.addEventTracker('clan-governance', (data) => {
      window.LogRocket.track('Clan: Governance Action', {
        action: data.action,
        proposal_type: data.proposalType,
        voting_power: data.votingPower,
        outcome: data.outcome
      });
    });
  }

  /**
   * Add event tracker for custom events
   */
  addEventTracker(eventType, handler) {
    document.addEventListener(`mlg-${eventType}`, (event) => {
      try {
        handler(event.detail);
      } catch (error) {
        console.error(`Error tracking ${eventType}:`, error);
      }
    });
  }

  /**
   * Add performance tracker
   */
  addPerformanceTracker(trackerType, handler) {
    document.addEventListener(`mlg-performance-${trackerType}`, (event) => {
      try {
        handler(event.detail);
      } catch (error) {
        console.error(`Error tracking performance ${trackerType}:`, error);
      }
    });
  }

  /**
   * Sanitize gaming inputs for privacy
   */
  sanitizeGameInputs(text, element) {
    // Sanitize wallet addresses and private keys
    if (element && (element.type === 'password' || element.name?.includes('private'))) {
      return '***HIDDEN***';
    }

    // Sanitize wallet addresses
    text = text.replace(/[1-9A-HJ-NP-Za-km-z]{32,44}/g, '***WALLET_ADDRESS***');
    
    // Sanitize private keys
    text = text.replace(/[0-9a-fA-F]{64}/g, '***PRIVATE_KEY***');
    
    // Sanitize seed phrases
    text = text.replace(/\b([a-z]{3,8}\s+){11,23}[a-z]{3,8}\b/gi, '***SEED_PHRASE***');

    return text;
  }

  /**
   * Sanitize gaming text content
   */
  sanitizeGameText(text, element) {
    // Sanitize sensitive gaming information
    if (element?.classList?.contains('sensitive-game-data')) {
      return '***GAME_DATA***';
    }

    // Apply input sanitization
    return this.sanitizeGameInputs(text, element);
  }

  /**
   * Sanitize network requests
   */
  sanitizeNetworkRequests(request) {
    const sanitizedRequest = { ...request };

    // Remove sensitive headers
    if (sanitizedRequest.reqHeaders) {
      delete sanitizedRequest.reqHeaders.authorization;
      delete sanitizedRequest.reqHeaders.cookie;
      delete sanitizedRequest.reqHeaders['x-api-key'];
    }

    // Sanitize request body for wallet operations
    if (sanitizedRequest.body) {
      try {
        const body = JSON.parse(sanitizedRequest.body);
        if (body.privateKey) body.privateKey = '***HIDDEN***';
        if (body.mnemonic) body.mnemonic = '***HIDDEN***';
        if (body.password) body.password = '***HIDDEN***';
        sanitizedRequest.body = JSON.stringify(body);
      } catch (e) {
        // Not JSON, sanitize as text
        sanitizedRequest.body = this.sanitizeGameInputs(sanitizedRequest.body);
      }
    }

    return sanitizedRequest;
  }

  /**
   * Sanitize network responses
   */
  sanitizeNetworkResponses(response) {
    const sanitizedResponse = { ...response };

    // Remove sensitive response headers
    if (sanitizedResponse.respHeaders) {
      delete sanitizedResponse.respHeaders['set-cookie'];
      delete sanitizedResponse.respHeaders.authorization;
    }

    // Sanitize response body
    if (sanitizedResponse.body) {
      try {
        const body = JSON.parse(sanitizedResponse.body);
        if (body.token) body.token = '***HIDDEN***';
        if (body.privateKey) body.privateKey = '***HIDDEN***';
        if (body.walletAddress) body.walletAddress = '***WALLET***';
        sanitizedResponse.body = JSON.stringify(body);
      } catch (e) {
        // Not JSON, sanitize as text
        sanitizedResponse.body = this.sanitizeGameInputs(sanitizedResponse.body);
      }
    }

    return sanitizedResponse;
  }

  /**
   * Identify user for session tracking
   */
  identify(user) {
    if (!this.initialized || !window.LogRocket) return;

    try {
      const userTraits = {
        name: user.username,
        email: user.email,
        // Sanitize wallet address for privacy
        wallet: user.walletAddress ? `***${user.walletAddress.slice(-4)}` : null,
        clan_id: user.clanId,
        clan_role: user.clanRole,
        registration_date: user.createdAt,
        total_votes: user.totalVotes,
        tokens_held: user.tokensHeld,
        gaming_level: user.gamingLevel,
        platform_role: user.role
      };

      window.LogRocket.identify(user.id, userTraits);
      
      // Store session data
      this.sessionData.set('user', userTraits);
      
      console.log('LogRocket user identified');
    } catch (error) {
      console.error('Error identifying user to LogRocket:', error);
    }
  }

  /**
   * Track custom gaming event
   */
  track(eventName, properties = {}) {
    if (!this.initialized || !window.LogRocket) return;

    try {
      const sanitizedProperties = this.sanitizeEventProperties(properties);
      window.LogRocket.track(eventName, sanitizedProperties);
    } catch (error) {
      console.error('Error tracking event to LogRocket:', error);
    }
  }

  /**
   * Sanitize event properties
   */
  sanitizeEventProperties(properties) {
    const sanitized = { ...properties };
    
    // Remove or sanitize sensitive properties
    if (sanitized.privateKey) delete sanitized.privateKey;
    if (sanitized.mnemonic) delete sanitized.mnemonic;
    if (sanitized.password) delete sanitized.password;
    if (sanitized.walletAddress) {
      sanitized.wallet_hash = `***${sanitized.walletAddress.slice(-4)}`;
      delete sanitized.walletAddress;
    }

    return sanitized;
  }

  /**
   * Add tags to current session
   */
  addTags(tags) {
    if (!this.initialized || !window.LogRocket) return;

    try {
      Object.entries(tags).forEach(([key, value]) => {
        window.LogRocket.addTag(key, value);
      });
    } catch (error) {
      console.error('Error adding tags to LogRocket:', error);
    }
  }

  /**
   * Capture console logs with context
   */
  captureConsoleLog(level, message, context = {}) {
    if (!this.initialized || !window.LogRocket) return;

    try {
      const sanitizedContext = this.sanitizeEventProperties(context);
      window.LogRocket.captureMessage(message, {
        level,
        extra: sanitizedContext
      });
    } catch (error) {
      console.error('Error capturing console log to LogRocket:', error);
    }
  }

  /**
   * Start session recording
   */
  startRecording() {
    if (!this.initialized || !window.LogRocket) return;

    try {
      window.LogRocket.startRecording();
      console.log('LogRocket recording started');
    } catch (error) {
      console.error('Error starting LogRocket recording:', error);
    }
  }

  /**
   * Stop session recording
   */
  stopRecording() {
    if (!this.initialized || !window.LogRocket) return;

    try {
      window.LogRocket.stopRecording();
      console.log('LogRocket recording stopped');
    } catch (error) {
      console.error('Error stopping LogRocket recording:', error);
    }
  }

  /**
   * Get session URL for debugging
   */
  getSessionURL() {
    if (!this.initialized || !window.LogRocket) return null;

    try {
      return window.LogRocket.sessionURL;
    } catch (error) {
      console.error('Error getting LogRocket session URL:', error);
      return null;
    }
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    return {
      initialized: this.initialized,
      app_id_configured: !!this.config.appId,
      enabled: this.config.enabled,
      session_active: this.initialized && typeof window !== 'undefined' && !!window.LogRocket,
      session_url: this.getSessionURL()
    };
  }
}

// Create singleton instance
const logRocketManager = new LogRocketManager();

export default logRocketManager;
export { LogRocketManager };