/**
 * Sentry Error Tracking and Performance Monitoring
 * Production-ready error tracking and performance monitoring for MLG.clan platform
 */

import * as Sentry from '@sentry/node';
import * as SentryTracing from '@sentry/tracing';
import environmentManager from '../config/environment-manager.js';

class SentryManager {
  constructor() {
    this.initialized = false;
    this.config = environmentManager.get('monitoring.sentry');
  }

  /**
   * Initialize Sentry monitoring
   */
  initialize() {
    if (this.initialized || !this.config.dsn) {
      return;
    }

    try {
      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        tracesSampleRate: this.config.tracesSampleRate,
        profilesSampleRate: this.config.profilesSampleRate,
        
        // Performance monitoring
        integrations: [
          new Sentry.Integrations.Http({ tracing: true }),
          new SentryTracing.Integrations.Express({ app: null }),
          new SentryTracing.Integrations.Postgres(),
          new SentryTracing.Integrations.Redis(),
        ],

        // Custom error filtering
        beforeSend: this.beforeSendHook.bind(this),
        beforeSendTransaction: this.beforeSendTransactionHook.bind(this),

        // Release and user context
        release: process.env.GIT_SHA || '1.0.0',
        
        // Security and privacy
        maxBreadcrumbs: 50,
        attachStacktrace: true,
        sendDefaultPii: false,

        // Gaming platform specific configuration
        tags: {
          component: 'mlg-clan-platform',
          blockchain: 'solana',
          gaming: true
        },

        // Custom context for gaming platform
        contexts: {
          gaming: {
            platform: 'web3',
            token: 'MLG',
            features: ['voting', 'clans', 'content', 'tournaments']
          }
        }
      });

      // Set initial user context
      this.setInitialContext();
      
      this.initialized = true;
      console.log('Sentry monitoring initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }

  /**
   * Set initial Sentry context
   */
  setInitialContext() {
    Sentry.setContext('application', {
      name: 'MLG.clan Platform',
      version: '1.0.0',
      environment: this.config.environment,
      node_version: process.version,
      platform: process.platform
    });

    Sentry.setContext('blockchain', {
      network: environmentManager.get('solana.network'),
      rpc_url: environmentManager.get('solana.rpcUrl'),
      commitment: environmentManager.get('solana.commitmentLevel')
    });
  }

  /**
   * Filter and enhance errors before sending to Sentry
   */
  beforeSendHook(event, hint) {
    // Filter out non-critical errors in production
    if (this.config.environment === 'production') {
      const error = hint.originalException;
      
      // Skip certain known non-critical errors
      if (this.isNonCriticalError(error)) {
        return null;
      }
    }

    // Enhance Web3/Solana specific errors
    if (event.exception) {
      event.exception.values.forEach(exception => {
        if (this.isSolanaError(exception)) {
          this.enhanceSolanaError(exception);
        }
        
        if (this.isPhantomWalletError(exception)) {
          this.enhancePhantomWalletError(exception);
        }
      });
    }

    // Add gaming context
    this.addGamingContext(event);

    return event;
  }

  /**
   * Filter transactions before sending to Sentry
   */
  beforeSendTransactionHook(event) {
    // Skip high-frequency, low-value transactions
    if (this.isLowValueTransaction(event)) {
      return null;
    }

    // Add gaming performance context
    this.addPerformanceContext(event);

    return event;
  }

  /**
   * Check if error is non-critical
   */
  isNonCriticalError(error) {
    if (!error) return false;

    const nonCriticalPatterns = [
      /ECONNRESET/,
      /ENOTFOUND/,
      /timeout/i,
      /AbortError/,
      /User cancelled/i,
      /Network request failed/i
    ];

    const errorMessage = error.message || error.toString();
    return nonCriticalPatterns.some(pattern => pattern.test(errorMessage));
  }

  /**
   * Check if error is Solana-related
   */
  isSolanaError(exception) {
    const solanaPatterns = [
      /solana/i,
      /phantom/i,
      /wallet/i,
      /transaction/i,
      /program/i,
      /account/i
    ];

    const errorMessage = exception.value || '';
    return solanaPatterns.some(pattern => pattern.test(errorMessage));
  }

  /**
   * Check if error is Phantom wallet-related
   */
  isPhantomWalletError(exception) {
    const phantomPatterns = [
      /phantom/i,
      /wallet.*not.*connected/i,
      /user.*rejected/i,
      /insufficient.*balance/i
    ];

    const errorMessage = exception.value || '';
    return phantomPatterns.some(pattern => pattern.test(errorMessage));
  }

  /**
   * Enhance Solana error with additional context
   */
  enhanceSolanaError(exception) {
    exception.mechanism = {
      type: 'solana_blockchain',
      handled: true
    };
    
    // Add Solana-specific tags
    Sentry.setTag('error_category', 'blockchain');
    Sentry.setTag('blockchain_network', environmentManager.get('solana.network'));
  }

  /**
   * Enhance Phantom wallet error with additional context
   */
  enhancePhantomWalletError(exception) {
    exception.mechanism = {
      type: 'phantom_wallet',
      handled: true
    };
    
    // Add wallet-specific tags
    Sentry.setTag('error_category', 'wallet');
    Sentry.setTag('wallet_type', 'phantom');
  }

  /**
   * Add gaming-specific context to events
   */
  addGamingContext(event) {
    const request = event.request;
    if (request && request.url) {
      // Identify gaming-specific endpoints
      if (request.url.includes('/voting/')) {
        Sentry.setTag('gaming_feature', 'voting');
      } else if (request.url.includes('/clans/')) {
        Sentry.setTag('gaming_feature', 'clans');
      } else if (request.url.includes('/content/')) {
        Sentry.setTag('gaming_feature', 'content');
      } else if (request.url.includes('/tournaments/')) {
        Sentry.setTag('gaming_feature', 'tournaments');
      }
    }
  }

  /**
   * Check if transaction is low-value for performance monitoring
   */
  isLowValueTransaction(event) {
    const lowValuePatterns = [
      /health.*check/i,
      /ping/i,
      /metrics/i,
      /status/i
    ];

    const transactionName = event.transaction || '';
    return lowValuePatterns.some(pattern => pattern.test(transactionName));
  }

  /**
   * Add performance context to transactions
   */
  addPerformanceContext(event) {
    // Add gaming performance tags
    Sentry.setTag('performance_category', 'gaming');
    
    if (event.transaction) {
      if (event.transaction.includes('voting')) {
        Sentry.setTag('performance_feature', 'voting_system');
      } else if (event.transaction.includes('blockchain')) {
        Sentry.setTag('performance_feature', 'blockchain_integration');
      }
    }
  }

  /**
   * Capture error with gaming context
   */
  captureError(error, context = {}) {
    if (!this.initialized) {
      console.error('Sentry not initialized:', error);
      return;
    }

    const gamingContext = {
      level: 'error',
      ...context,
      timestamp: new Date().toISOString(),
      platform: 'mlg-clan'
    };

    Sentry.withScope(scope => {
      scope.setContext('gaming_error', gamingContext);
      
      if (context.user) {
        scope.setUser(context.user);
      }
      
      if (context.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      
      Sentry.captureException(error);
    });
  }

  /**
   * Capture message with context
   */
  captureMessage(message, level = 'info', context = {}) {
    if (!this.initialized) {
      console.log('Sentry not initialized, logging message:', message);
      return;
    }

    Sentry.withScope(scope => {
      scope.setLevel(level);
      scope.setContext('gaming_message', {
        ...context,
        timestamp: new Date().toISOString(),
        platform: 'mlg-clan'
      });
      
      Sentry.captureMessage(message);
    });
  }

  /**
   * Start transaction for performance monitoring
   */
  startTransaction(name, operation, context = {}) {
    if (!this.initialized) {
      return null;
    }

    const transaction = Sentry.startTransaction({
      name,
      op: operation,
      tags: {
        component: 'mlg-clan-platform',
        ...context.tags
      },
      data: context.data
    });

    return transaction;
  }

  /**
   * Set user context for error tracking
   */
  setUserContext(user) {
    if (!this.initialized) return;

    Sentry.setUser({
      id: user.id,
      username: user.username,
      email: user.email,
      wallet_address: user.walletAddress,
      clan_id: user.clanId,
      role: user.role
    });
  }

  /**
   * Clear user context
   */
  clearUserContext() {
    if (!this.initialized) return;
    
    Sentry.setUser(null);
  }

  /**
   * Add breadcrumb for tracking user actions
   */
  addBreadcrumb(message, category = 'user', level = 'info', data = {}) {
    if (!this.initialized) return;

    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data: {
        ...data,
        timestamp: new Date().toISOString(),
        platform: 'mlg-clan'
      }
    });
  }

  /**
   * Express middleware for request tracking
   */
  requestHandler() {
    if (!this.initialized) {
      return (req, res, next) => next();
    }

    return Sentry.Handlers.requestHandler({
      user: ['id', 'username', 'email', 'walletAddress'],
      ip: true,
      request: true,
      transaction: 'methodPath'
    });
  }

  /**
   * Express error handler middleware
   */
  errorHandler() {
    if (!this.initialized) {
      return (error, req, res, next) => next(error);
    }

    return Sentry.Handlers.errorHandler({
      shouldHandleError: (error) => {
        // Only send 4xx and 5xx errors to Sentry
        return error.status >= 400;
      }
    });
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    return {
      initialized: this.initialized,
      dsn_configured: !!this.config.dsn,
      environment: this.config.environment,
      traces_sample_rate: this.config.tracesSampleRate
    };
  }
}

// Create singleton instance
const sentryManager = new SentryManager();

export default sentryManager;
export { SentryManager };