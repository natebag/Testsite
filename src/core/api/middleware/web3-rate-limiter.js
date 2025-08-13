/**
 * Web3 Transaction Rate Limiter for MLG.clan Platform
 * 
 * Specialized rate limiting for blockchain operations with:
 * - Wallet connection rate limiting
 * - Transaction submission controls
 * - SPL token operation limits
 * - Gas optimization awareness
 * - Failed transaction tracking
 * 
 * @author Claude Code - Security Performance Auditor
 * @version 1.0.0
 * @created 2025-08-12
 */

import rateLimit from 'express-rate-limit';
import Redis from 'redis';

/**
 * Web3-specific rate limiting configurations
 */
const WEB3_RATE_LIMITS = {
  // Wallet connection operations
  WALLET_CONNECTIONS: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // Max 10 connection attempts per 5 minutes
    skipSuccessfulRequests: true, // Only count failed attempts
    skipFailedRequests: false
  },

  // Transaction submission
  TRANSACTION_SUBMIT: {
    windowMs: 60 * 1000, // 1 minute
    max: 5, // Max 5 transactions per minute
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // SPL token operations (burn, transfer, etc.)
  SPL_OPERATIONS: {
    windowMs: 2 * 60 * 1000, // 2 minutes
    max: 8, // Max 8 SPL operations per 2 minutes
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Voting token burns
  BURN_TO_VOTE: {
    windowMs: 60 * 1000, // 1 minute
    max: 3, // Max 3 burn operations per minute
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Network validation requests
  NETWORK_VALIDATION: {
    windowMs: 30 * 1000, // 30 seconds
    max: 20, // Max 20 validation requests per 30 seconds
    skipSuccessfulRequests: true,
    skipFailedRequests: false
  },

  // Gas estimation requests
  GAS_ESTIMATION: {
    windowMs: 15 * 1000, // 15 seconds
    max: 30, // Max 30 gas estimation requests per 15 seconds
    skipSuccessfulRequests: true,
    skipFailedRequests: false
  },

  // Account balance checks
  BALANCE_CHECKS: {
    windowMs: 10 * 1000, // 10 seconds
    max: 50, // Max 50 balance checks per 10 seconds
    skipSuccessfulRequests: true,
    skipFailedRequests: false
  },

  // Transaction status checks
  TRANSACTION_STATUS: {
    windowMs: 5 * 1000, // 5 seconds
    max: 100, // Max 100 status checks per 5 seconds (real-time needs)
    skipSuccessfulRequests: true,
    skipFailedRequests: false
  }
};

/**
 * Web3 operation detection and classification
 */
class Web3OperationDetector {
  static detectOperationType(req) {
    const path = req.path.toLowerCase();
    const body = req.body || {};
    const method = req.method.toUpperCase();

    // Wallet connection operations
    if (path.includes('/wallet/connect') || 
        path.includes('/wallet/disconnect') ||
        body.walletAddress) {
      return 'wallet_connection';
    }

    // Transaction submission
    if ((method === 'POST' && path.includes('/transaction')) ||
        body.transactionId ||
        body.transactionHash) {
      return 'transaction_submit';
    }

    // SPL token operations
    if (path.includes('/spl/') ||
        path.includes('/token/') ||
        body.tokenAddress ||
        body.splOperation) {
      return 'spl_operations';
    }

    // Burn to vote operations
    if (path.includes('/burn') ||
        path.includes('/vote') && body.burnAmount) {
      return 'burn_to_vote';
    }

    // Network validation
    if (path.includes('/validate') ||
        path.includes('/network') ||
        body.networkValidation) {
      return 'network_validation';
    }

    // Gas estimation
    if (path.includes('/gas') ||
        path.includes('/estimate') ||
        body.gasEstimate) {
      return 'gas_estimation';
    }

    // Balance checks
    if (path.includes('/balance') ||
        (method === 'GET' && path.includes('/account'))) {
      return 'balance_checks';
    }

    // Transaction status
    if (path.includes('/status') ||
        (method === 'GET' && path.includes('/transaction'))) {
      return 'transaction_status';
    }

    return 'general_web3';
  }

  static isWeb3Operation(req) {
    const path = req.path.toLowerCase();
    
    // Check for Web3 paths
    const web3Paths = [
      '/web3/', '/wallet/', '/transaction/', '/spl/', '/token/',
      '/burn/', '/solana/', '/blockchain/', '/crypto/'
    ];

    if (web3Paths.some(web3Path => path.includes(web3Path))) {
      return true;
    }

    // Check for Web3 indicators in request body
    const body = req.body || {};
    const web3Indicators = [
      'walletAddress', 'transactionId', 'transactionHash',
      'tokenAddress', 'splOperation', 'burnAmount',
      'networkValidation', 'gasEstimate'
    ];

    return web3Indicators.some(indicator => body[indicator]);
  }

  static getWalletAddress(req) {
    return req.body?.walletAddress || 
           req.query?.walletAddress || 
           req.headers['x-wallet-address'] ||
           req.user?.walletAddress;
  }

  static getNetworkType(req) {
    return req.headers['x-network-type'] || 
           req.body?.network || 
           'mainnet';
  }
}

/**
 * Web3 Redis store for tracking blockchain operations
 */
class Web3RedisStore {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.init();
  }

  async init() {
    try {
      this.client = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: 5000,
          lazyConnect: true
        },
        database: process.env.REDIS_WEB3_DB || 2
      });

      this.client.on('connect', () => {
        console.log('Web3 rate limiter Redis connected');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.error('Web3 rate limiter Redis error:', err);
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.warn('Failed to initialize Web3 Redis store:', error.message);
    }
  }

  isReady() {
    return this.isConnected && this.client;
  }

  // Track failed transactions by wallet
  async trackFailedTransaction(walletAddress, operationType, reason) {
    if (!this.isReady()) return false;

    try {
      const key = `web3_failures:${walletAddress}:${operationType}`;
      const failureData = {
        timestamp: Date.now(),
        reason,
        operationType
      };

      await this.client.lPush(key, JSON.stringify(failureData));
      await this.client.lTrim(key, 0, 99); // Keep last 100 failures
      await this.client.expire(key, 3600); // 1 hour TTL

      return true;
    } catch (error) {
      console.error('Failed to track Web3 failure:', error);
      return false;
    }
  }

  // Get failure count for wallet
  async getFailureCount(walletAddress, operationType, timeWindow = 3600) {
    if (!this.isReady()) return 0;

    try {
      const key = `web3_failures:${walletAddress}:${operationType}`;
      const failures = await this.client.lRange(key, 0, -1);
      
      const cutoffTime = Date.now() - (timeWindow * 1000);
      const recentFailures = failures.filter(failure => {
        try {
          const data = JSON.parse(failure);
          return data.timestamp > cutoffTime;
        } catch {
          return false;
        }
      });

      return recentFailures.length;
    } catch (error) {
      console.error('Failed to get Web3 failure count:', error);
      return 0;
    }
  }

  // Track successful transactions
  async trackSuccessfulTransaction(walletAddress, operationType, transactionId) {
    if (!this.isReady()) return false;

    try {
      const key = `web3_success:${walletAddress}:${operationType}`;
      const successData = {
        timestamp: Date.now(),
        transactionId,
        operationType
      };

      await this.client.setEx(
        `${key}:${transactionId}`,
        300, // 5 minutes TTL
        JSON.stringify(successData)
      );

      return true;
    } catch (error) {
      console.error('Failed to track Web3 success:', error);
      return false;
    }
  }

  // Check for recent successful transaction
  async hasRecentSuccess(walletAddress, operationType, timeWindow = 300) {
    if (!this.isReady()) return false;

    try {
      const pattern = `web3_success:${walletAddress}:${operationType}:*`;
      const keys = await this.client.keys(pattern);
      
      for (const key of keys) {
        const ttl = await this.client.ttl(key);
        if (ttl > (300 - timeWindow)) { // Recent success
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Failed to check Web3 recent success:', error);
      return false;
    }
  }
}

// Initialize Web3 Redis store
const web3RedisStore = new Web3RedisStore();

/**
 * Web3 rate limiter factory
 */
class Web3RateLimiterFactory {
  static createWeb3Limiter(baseConfig, options = {}) {
    const config = {
      ...baseConfig,
      standardHeaders: true,
      legacyHeaders: false,
      ...options
    };

    // Web3-specific key generator
    config.keyGenerator = (req) => {
      const operationType = Web3OperationDetector.detectOperationType(req);
      const walletAddress = Web3OperationDetector.getWalletAddress(req);
      const networkType = Web3OperationDetector.getNetworkType(req);

      if (walletAddress) {
        return `web3:wallet:${walletAddress}:${operationType}:${networkType}`;
      }

      const userId = req.user?.id;
      if (userId) {
        return `web3:user:${userId}:${operationType}:${networkType}`;
      }

      return `web3:ip:${req.ip}:${operationType}:${networkType}`;
    };

    // Web3-specific skip logic
    config.skip = async (req) => {
      // Skip for health checks
      if (req.path === '/api/health' || req.path === '/api/status') {
        return true;
      }

      // Skip for admin users in development
      if (process.env.NODE_ENV === 'development' && 
          req.user?.roles?.includes('admin')) {
        return true;
      }

      // Advanced skip logic for successful operations
      const operationType = Web3OperationDetector.detectOperationType(req);
      const walletAddress = Web3OperationDetector.getWalletAddress(req);

      if (config.skipSuccessfulRequests && walletAddress) {
        const hasRecentSuccess = await web3RedisStore.hasRecentSuccess(
          walletAddress, 
          operationType
        );
        if (hasRecentSuccess) {
          return true;
        }
      }

      return false;
    };

    // Web3-specific message formatting
    config.message = (req, res) => {
      const operationType = Web3OperationDetector.detectOperationType(req);
      const networkType = Web3OperationDetector.getNetworkType(req);
      
      return {
        error: 'Web3 operation rate limit exceeded',
        code: `WEB3_RATE_LIMITED_${operationType.toUpperCase()}`,
        operationType,
        networkType,
        retryAfter: Math.ceil(config.windowMs / 1000),
        message: options.customMessage || 
          `Rate limit exceeded for ${operationType} operations on ${networkType}. Please wait before trying again.`,
        web3_context: {
          operation_type: operationType,
          network_type: networkType,
          wallet_connected: !!Web3OperationDetector.getWalletAddress(req)
        }
      };
    };

    // Web3-specific response handler
    const originalHandler = config.handler;
    config.handler = async (req, res, next) => {
      const operationType = Web3OperationDetector.detectOperationType(req);
      const walletAddress = Web3OperationDetector.getWalletAddress(req);

      // Track failed attempts
      if (walletAddress) {
        await web3RedisStore.trackFailedTransaction(
          walletAddress,
          operationType,
          'rate_limit_exceeded'
        );
      }

      // Apply additional restrictions for users with many failures
      if (walletAddress) {
        const failureCount = await web3RedisStore.getFailureCount(
          walletAddress,
          operationType
        );
        
        if (failureCount > 10) {
          // Extended rate limit for problematic wallets
          res.set('X-Extended-Rate-Limit', 'true');
          res.set('Retry-After', Math.ceil(config.windowMs / 1000) * 2);
        }
      }

      if (originalHandler) {
        return originalHandler(req, res, next);
      }

      res.status(429).json(config.message(req, res));
    };

    return rateLimit(config);
  }

  static createAdaptiveWeb3Limiter(baseConfig, options = {}) {
    return async (req, res, next) => {
      let config = { ...baseConfig };
      const operationType = Web3OperationDetector.detectOperationType(req);
      const walletAddress = Web3OperationDetector.getWalletAddress(req);

      // Adjust limits based on failure history
      if (walletAddress) {
        const failureCount = await web3RedisStore.getFailureCount(
          walletAddress,
          operationType
        );

        // Reduce limits for wallets with many failures
        if (failureCount > 5) {
          config.max = Math.max(1, Math.floor(config.max * 0.5));
          config.windowMs = config.windowMs * 2; // Double the window
        }

        // Increase limits for wallets with recent successes
        const hasRecentSuccess = await web3RedisStore.hasRecentSuccess(
          walletAddress,
          operationType
        );
        
        if (hasRecentSuccess && failureCount === 0) {
          config.max = Math.floor(config.max * 1.5);
        }
      }

      // Network-specific adjustments
      const networkType = Web3OperationDetector.getNetworkType(req);
      if (networkType === 'devnet' || networkType === 'testnet') {
        config.max = Math.floor(config.max * 2); // More lenient for test networks
      }

      const limiter = this.createWeb3Limiter(config, options);
      return limiter(req, res, next);
    };
  }
}

/**
 * Web3 endpoint rate limiters
 */
export const web3RateLimiters = {
  // Wallet connection operations
  walletConnections: Web3RateLimiterFactory.createAdaptiveWeb3Limiter(
    WEB3_RATE_LIMITS.WALLET_CONNECTIONS,
    {
      customMessage: 'Wallet connection rate limit exceeded. Please wait before attempting to connect again.'
    }
  ),

  // Transaction submission
  transactionSubmit: Web3RateLimiterFactory.createAdaptiveWeb3Limiter(
    WEB3_RATE_LIMITS.TRANSACTION_SUBMIT,
    {
      customMessage: 'Transaction submission rate limit exceeded. Please wait before submitting another transaction.'
    }
  ),

  // SPL token operations
  splOperations: Web3RateLimiterFactory.createAdaptiveWeb3Limiter(
    WEB3_RATE_LIMITS.SPL_OPERATIONS,
    {
      customMessage: 'SPL token operation rate limit exceeded. Please wait before performing another token operation.'
    }
  ),

  // Burn to vote operations
  burnToVote: Web3RateLimiterFactory.createAdaptiveWeb3Limiter(
    WEB3_RATE_LIMITS.BURN_TO_VOTE,
    {
      customMessage: 'Burn-to-vote rate limit exceeded. Please wait before burning tokens for votes again.'
    }
  ),

  // Network validation
  networkValidation: Web3RateLimiterFactory.createWeb3Limiter(
    WEB3_RATE_LIMITS.NETWORK_VALIDATION,
    {
      customMessage: 'Network validation rate limit exceeded. Please reduce validation frequency.'
    }
  ),

  // Gas estimation
  gasEstimation: Web3RateLimiterFactory.createWeb3Limiter(
    WEB3_RATE_LIMITS.GAS_ESTIMATION,
    {
      customMessage: 'Gas estimation rate limit exceeded. Please reduce estimation requests.'
    }
  ),

  // Balance checks
  balanceChecks: Web3RateLimiterFactory.createWeb3Limiter(
    WEB3_RATE_LIMITS.BALANCE_CHECKS,
    {
      customMessage: 'Balance check rate limit exceeded. Please reduce balance query frequency.'
    }
  ),

  // Transaction status
  transactionStatus: Web3RateLimiterFactory.createWeb3Limiter(
    WEB3_RATE_LIMITS.TRANSACTION_STATUS,
    {
      customMessage: 'Transaction status check rate limit exceeded. Please reduce status query frequency.'
    }
  )
};

/**
 * Web3 transaction tracking middleware
 */
export const web3TransactionTrackingMiddleware = async (req, res, next) => {
  if (!Web3OperationDetector.isWeb3Operation(req)) {
    return next();
  }

  const operationType = Web3OperationDetector.detectOperationType(req);
  const walletAddress = Web3OperationDetector.getWalletAddress(req);

  // Track successful transactions on response
  const originalSend = res.send;
  res.send = async function(data) {
    try {
      // Check if operation was successful
      if (res.statusCode >= 200 && res.statusCode < 300 && walletAddress) {
        const responseData = typeof data === 'string' ? JSON.parse(data) : data;
        const transactionId = responseData?.transactionId || 
                             responseData?.transactionHash ||
                             responseData?.data?.transactionId ||
                             `success_${Date.now()}`;

        await web3RedisStore.trackSuccessfulTransaction(
          walletAddress,
          operationType,
          transactionId
        );
      }
    } catch (error) {
      // Don't let tracking errors affect the response
      console.error('Error tracking Web3 transaction:', error);
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Web3 rate limit monitoring middleware
 */
export const web3RateLimitMonitoringMiddleware = (req, res, next) => {
  if (!Web3OperationDetector.isWeb3Operation(req)) {
    return next();
  }

  const startTime = Date.now();
  const operationType = Web3OperationDetector.detectOperationType(req);
  const walletAddress = Web3OperationDetector.getWalletAddress(req);
  const networkType = Web3OperationDetector.getNetworkType(req);

  // Enhanced logging for Web3 operations
  console.log(`Web3 Operation: ${operationType} - Network: ${networkType} - Wallet: ${walletAddress || 'none'}`);

  const originalSend = res.send;
  res.send = function(data) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Log performance metrics
    if (responseTime > 1000) { // Log slow Web3 operations
      console.warn(`Slow Web3 operation: ${operationType} - ${responseTime}ms`);
    }

    // Log rate limit hits
    if (res.statusCode === 429) {
      console.warn(`Web3 rate limit hit: ${operationType} - Wallet: ${walletAddress || 'none'} - Network: ${networkType}`);
    }

    // Log failed transactions
    if (res.statusCode >= 400 && walletAddress) {
      web3RedisStore.trackFailedTransaction(
        walletAddress,
        operationType,
        `http_${res.statusCode}`
      ).catch(console.error);
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Main Web3 rate limiter middleware
 */
export const web3RateLimiterMiddleware = (operationType = 'auto', options = {}) => {
  return async (req, res, next) => {
    // Skip if not a Web3 operation
    if (!Web3OperationDetector.isWeb3Operation(req)) {
      return next();
    }

    // Apply tracking middleware
    await web3TransactionTrackingMiddleware(req, res, () => {});

    // Apply monitoring middleware
    web3RateLimitMonitoringMiddleware(req, res, () => {});

    // Auto-detect operation type
    if (operationType === 'auto') {
      operationType = Web3OperationDetector.detectOperationType(req);
    }

    // Map operation types to rate limiters
    const operationMap = {
      'wallet_connection': 'walletConnections',
      'transaction_submit': 'transactionSubmit',
      'spl_operations': 'splOperations',
      'burn_to_vote': 'burnToVote',
      'network_validation': 'networkValidation',
      'gas_estimation': 'gasEstimation',
      'balance_checks': 'balanceChecks',
      'transaction_status': 'transactionStatus',
      'general_web3': 'transactionSubmit' // Default fallback
    };

    const limiterKey = operationMap[operationType] || 'transactionSubmit';
    const limiter = web3RateLimiters[limiterKey];

    if (!limiter) {
      console.warn(`Unknown Web3 rate limiter type: ${operationType}`);
      return next();
    }

    // Add Web3-specific headers
    res.set({
      'X-Web3-Rate-Limit': 'true',
      'X-Web3-Operation-Type': operationType,
      'X-Web3-Network': Web3OperationDetector.getNetworkType(req)
    });

    // Apply the rate limiter
    return limiter(req, res, next);
  };
};

// Export everything
export default {
  web3RateLimiters,
  web3RateLimiterMiddleware,
  web3TransactionTrackingMiddleware,
  web3RateLimitMonitoringMiddleware,
  Web3OperationDetector,
  Web3RateLimiterFactory,
  web3RedisStore
};