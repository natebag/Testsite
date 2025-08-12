/**
 * Transaction Cache Strategy for MLG.clan Platform
 * 
 * Specialized caching strategy for transaction-related data including transaction history,
 * user balances, MLG token operations, and blockchain interaction data. Optimized for
 * high-frequency financial operations with real-time balance updates and audit trails.
 * 
 * Features:
 * - Real-time balance tracking and updates
 * - Transaction history caching with pagination
 * - MLG token operation caching
 * - Blockchain transaction status tracking
 * - User wallet and balance caching
 * - Transaction analytics and reporting
 * - Audit trail caching for compliance
 * - Rate limiting for transaction operations
 * 
 * @author Claude Code - Performance Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { getCacheManager } from '../cache-manager.js';

export class TransactionCacheStrategy {
  constructor(options = {}) {
    this.cache = getCacheManager();
    this.namespace = 'transaction';
    
    this.config = {
      balanceTTL: options.balanceTTL || 300,             // 5 minutes
      historyTTL: options.historyTTL || 1800,            // 30 minutes
      statusTTL: options.statusTTL || 180,               // 3 minutes
      analyticsTTL: options.analyticsTTL || 3600,        // 1 hour
      auditTTL: options.auditTTL || 86400,               // 24 hours
      blockchainTTL: options.blockchainTTL || 300,       // 5 minutes
      
      // Pagination settings
      defaultPageSize: options.defaultPageSize || 20,
      maxPageSize: options.maxPageSize || 100,
      maxHistoryPages: options.maxHistoryPages || 10,
      
      // Balance update settings
      enableRealTimeBalances: options.enableRealTimeBalances !== false,
      balanceUpdateBatchSize: options.balanceUpdateBatchSize || 50,
      balancePrecision: options.balancePrecision || 8,
      
      // Rate limiting
      enableRateLimiting: options.enableRateLimiting !== false,
      maxTransactionsPerMinute: options.maxTransactionsPerMinute || 10,
      maxTransactionsPerHour: options.maxTransactionsPerHour || 100,
      
      // Security settings
      enableAuditLogging: options.enableAuditLogging !== false,
      encryptSensitiveData: options.encryptSensitiveData !== false,
      
      ...options
    };
    
    this.setupInvalidationPatterns();
  }

  setupInvalidationPatterns() {
    // When transactions are created, invalidate balance and history
    this.cache.registerInvalidationPattern('transaction:create', 'transaction:balance:*');
    this.cache.registerInvalidationPattern('transaction:create', 'transaction:history:*');
    
    // When balances update, invalidate analytics
    this.cache.registerInvalidationPattern('transaction:balance', 'transaction:analytics:*');
    this.cache.registerInvalidationPattern('transaction:balance', 'user:stats:*');
    
    // When transaction status changes, invalidate pending lists
    this.cache.registerInvalidationPattern('transaction:status', 'transaction:pending:*');
  }

  /**
   * Cache user balance data
   * @param {string} userId - User ID
   * @param {Object} balanceData - Balance data to cache
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheUserBalance(userId, balanceData, options = {}) {
    const ttl = options.ttl || this.config.balanceTTL;
    
    // Cache main balance data
    await this.cache.set(
      `${this.namespace}:balance`,
      userId,
      {
        mlg_balance: this.roundBalance(balanceData.mlg_balance || 0),
        sol_balance: this.roundBalance(balanceData.sol_balance || 0),
        pending_mlg: this.roundBalance(balanceData.pending_mlg || 0),
        locked_mlg: this.roundBalance(balanceData.locked_mlg || 0),
        total_earned: this.roundBalance(balanceData.total_earned || 0),
        total_burned: this.roundBalance(balanceData.total_burned || 0),
        last_updated: Date.now(),
        wallet_address: balanceData.wallet_address
      },
      { ttl }
    );
    
    // Cache individual balance components for quick access
    const balanceComponents = {
      mlg: balanceData.mlg_balance || 0,
      sol: balanceData.sol_balance || 0,
      pending: balanceData.pending_mlg || 0,
      locked: balanceData.locked_mlg || 0
    };
    
    const componentPromises = Object.entries(balanceComponents).map(([component, value]) => 
      this.cache.set(
        `${this.namespace}:balance:${component}`,
        userId,
        this.roundBalance(value),
        { ttl }
      )
    );
    
    await Promise.all(componentPromises);
    
    return true;
  }

  /**
   * Cache transaction history
   * @param {string} userId - User ID
   * @param {Array} transactions - Transaction history
   * @param {Object} pagination - Pagination info
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheTransactionHistory(userId, transactions, pagination, options = {}) {
    const ttl = options.ttl || this.config.historyTTL;
    const page = pagination.page || 1;
    
    // Cache paginated transaction history
    await this.cache.set(
      `${this.namespace}:history`,
      `${userId}:page:${page}`,
      {
        transactions,
        pagination: {
          ...pagination,
          cached_at: Date.now()
        }
      },
      { ttl }
    );
    
    // Cache recent transactions separately for quick access
    if (page === 1) {
      const recentTransactions = transactions.slice(0, 10);
      await this.cache.set(
        `${this.namespace}:recent`,
        userId,
        recentTransactions,
        { ttl }
      );
    }
    
    // Cache transactions by type
    const transactionsByType = transactions.reduce((acc, tx) => {
      if (!acc[tx.type]) {
        acc[tx.type] = [];
      }
      acc[tx.type].push(tx);
      return acc;
    }, {});
    
    for (const [type, typeTxs] of Object.entries(transactionsByType)) {
      await this.cache.set(
        `${this.namespace}:history:type`,
        `${userId}:${type}:page:${page}`,
        typeTxs,
        { ttl }
      );
    }
    
    return true;
  }

  /**
   * Cache individual transaction details
   * @param {string} transactionId - Transaction ID
   * @param {Object} transactionData - Transaction data
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheTransactionDetails(transactionId, transactionData, options = {}) {
    const ttl = options.ttl || this.config.historyTTL;
    
    // Cache full transaction details
    await this.cache.set(
      `${this.namespace}:details`,
      transactionId,
      transactionData,
      { ttl }
    );
    
    // Cache transaction status separately for quick checks
    await this.cache.set(
      `${this.namespace}:status`,
      transactionId,
      {
        status: transactionData.status,
        blockchain_hash: transactionData.blockchain_hash,
        confirmations: transactionData.confirmations,
        last_checked: Date.now()
      },
      { ttl: this.config.statusTTL }
    );
    
    return true;
  }

  /**
   * Cache blockchain transaction data
   * @param {string} blockchainHash - Blockchain transaction hash
   * @param {Object} blockchainData - Blockchain data
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheBlockchainTransaction(blockchainHash, blockchainData, options = {}) {
    const ttl = options.ttl || this.config.blockchainTTL;
    
    await this.cache.set(
      `${this.namespace}:blockchain`,
      blockchainHash,
      {
        transaction_hash: blockchainHash,
        block_number: blockchainData.block_number,
        block_hash: blockchainData.block_hash,
        confirmations: blockchainData.confirmations,
        gas_used: blockchainData.gas_used,
        gas_price: blockchainData.gas_price,
        status: blockchainData.status,
        timestamp: blockchainData.timestamp,
        from_address: blockchainData.from_address,
        to_address: blockchainData.to_address,
        value: blockchainData.value,
        cached_at: Date.now()
      },
      { ttl }
    );
    
    return true;
  }

  /**
   * Cache pending transactions
   * @param {string} userId - User ID
   * @param {Array} pendingTransactions - Pending transactions
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cachePendingTransactions(userId, pendingTransactions, options = {}) {
    const ttl = options.ttl || this.config.statusTTL;
    
    await this.cache.set(
      `${this.namespace}:pending`,
      userId,
      pendingTransactions,
      { ttl }
    );
    
    // Cache count for quick access
    await this.cache.set(
      `${this.namespace}:pending:count`,
      userId,
      pendingTransactions.length,
      { ttl }
    );
    
    return true;
  }

  /**
   * Cache transaction analytics
   * @param {string} scope - Analytics scope (user, global, daily, monthly)
   * @param {string} scopeId - Scope ID (user ID or date)
   * @param {Object} analytics - Analytics data
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheTransactionAnalytics(scope, scopeId, analytics, options = {}) {
    const ttl = options.ttl || this.config.analyticsTTL;
    
    const cacheKey = scopeId ? `${scope}:${scopeId}` : scope;
    
    await this.cache.set(
      `${this.namespace}:analytics`,
      cacheKey,
      analytics,
      { ttl }
    );
    
    // Cache key metrics separately
    const keyMetrics = {
      total_transactions: analytics.total_transactions,
      total_volume: analytics.total_volume,
      avg_transaction_size: analytics.avg_transaction_size,
      successful_transactions: analytics.successful_transactions,
      failed_transactions: analytics.failed_transactions,
      success_rate: analytics.success_rate
    };
    
    await this.cache.set(
      `${this.namespace}:metrics:${scope}`,
      scopeId || 'global',
      keyMetrics,
      { ttl }
    );
    
    return true;
  }

  /**
   * Cache MLG token operations
   * @param {string} operationType - Operation type (burn, earn, transfer)
   * @param {string} userId - User ID
   * @param {Array} operations - MLG operations
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheMLGOperations(operationType, userId, operations, options = {}) {
    const ttl = options.ttl || this.config.historyTTL;
    
    await this.cache.set(
      `${this.namespace}:mlg:${operationType}`,
      userId,
      operations,
      { ttl }
    );
    
    // Cache operation totals
    const total = operations.reduce((sum, op) => sum + (op.amount || 0), 0);
    await this.cache.set(
      `${this.namespace}:mlg:${operationType}:total`,
      userId,
      this.roundBalance(total),
      { ttl }
    );
    
    return true;
  }

  /**
   * Cache audit trail data
   * @param {string} userId - User ID
   * @param {Array} auditEvents - Audit events
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheAuditTrail(userId, auditEvents, options = {}) {
    if (!this.config.enableAuditLogging) return false;
    
    const ttl = options.ttl || this.config.auditTTL;
    
    await this.cache.set(
      `${this.namespace}:audit`,
      userId,
      auditEvents,
      { ttl }
    );
    
    return true;
  }

  /**
   * Get methods for cached data
   */
  
  async getUserBalance(userId) {
    return await this.cache.get(`${this.namespace}:balance`, userId);
  }
  
  async getUserBalanceComponent(userId, component) {
    return await this.cache.get(`${this.namespace}:balance:${component}`, userId);
  }
  
  async getTransactionHistory(userId, page = 1) {
    return await this.cache.get(`${this.namespace}:history`, `${userId}:page:${page}`);
  }
  
  async getRecentTransactions(userId) {
    return await this.cache.get(`${this.namespace}:recent`, userId);
  }
  
  async getTransactionDetails(transactionId) {
    return await this.cache.get(`${this.namespace}:details`, transactionId);
  }
  
  async getTransactionStatus(transactionId) {
    return await this.cache.get(`${this.namespace}:status`, transactionId);
  }
  
  async getBlockchainTransaction(hash) {
    return await this.cache.get(`${this.namespace}:blockchain`, hash);
  }
  
  async getPendingTransactions(userId) {
    return await this.cache.get(`${this.namespace}:pending`, userId);
  }
  
  async getPendingTransactionCount(userId) {
    return await this.cache.get(`${this.namespace}:pending:count`, userId);
  }

  /**
   * Real-time balance updates
   */
  
  async updateBalance(userId, amount, component = 'mlg') {
    if (!this.config.enableRealTimeBalances) return;
    
    try {
      const currentBalance = await this.getUserBalance(userId);
      if (currentBalance) {
        const balanceKey = `${component}_balance`;
        if (currentBalance[balanceKey] !== undefined) {
          currentBalance[balanceKey] = this.roundBalance(currentBalance[balanceKey] + amount);
          currentBalance.last_updated = Date.now();
          
          await this.cache.set(
            `${this.namespace}:balance`,
            userId,
            currentBalance,
            { ttl: this.config.balanceTTL }
          );
          
          // Update individual component cache
          await this.cache.set(
            `${this.namespace}:balance:${component}`,
            userId,
            currentBalance[balanceKey],
            { ttl: this.config.balanceTTL }
          );
        }
      }
    } catch (error) {
      // Ignore errors for real-time updates
    }
  }
  
  async updateTransactionStatus(transactionId, status, confirmations = 0) {
    try {
      await this.cache.set(
        `${this.namespace}:status`,
        transactionId,
        {
          status,
          confirmations,
          last_checked: Date.now()
        },
        { ttl: this.config.statusTTL }
      );
      
      // Update full transaction details if cached
      const transactionDetails = await this.getTransactionDetails(transactionId);
      if (transactionDetails) {
        transactionDetails.status = status;
        transactionDetails.confirmations = confirmations;
        transactionDetails.updated_at = new Date().toISOString();
        
        await this.cache.set(
          `${this.namespace}:details`,
          transactionId,
          transactionDetails,
          { ttl: this.config.historyTTL }
        );
      }
    } catch (error) {
      // Ignore errors for real-time updates
    }
  }

  /**
   * Rate limiting for transactions
   */
  
  async checkTransactionRate(userId) {
    if (!this.config.enableRateLimiting) return { allowed: true };
    
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;
    
    try {
      // Get recent transaction timestamps
      const recentTxs = await this.cache.get(`${this.namespace}:rate:${userId}`, 'timestamps') || [];
      
      // Filter to get transactions in the last minute and hour
      const txsLastMinute = recentTxs.filter(timestamp => timestamp > oneMinuteAgo);
      const txsLastHour = recentTxs.filter(timestamp => timestamp > oneHourAgo);
      
      if (txsLastMinute.length >= this.config.maxTransactionsPerMinute) {
        return {
          allowed: false,
          reason: 'Rate limit exceeded - too many transactions per minute',
          retryAfter: 60 - Math.floor((now - Math.min(...txsLastMinute)) / 1000)
        };
      }
      
      if (txsLastHour.length >= this.config.maxTransactionsPerHour) {
        return {
          allowed: false,
          reason: 'Rate limit exceeded - too many transactions per hour',
          retryAfter: 3600 - Math.floor((now - Math.min(...txsLastHour)) / 1000)
        };
      }
      
      return { allowed: true };
    } catch (error) {
      // Allow transaction if rate limiting check fails
      return { allowed: true };
    }
  }
  
  async recordTransactionAttempt(userId) {
    if (!this.config.enableRateLimiting) return;
    
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    try {
      const recentTxs = await this.cache.get(`${this.namespace}:rate:${userId}`, 'timestamps') || [];
      
      // Add current timestamp and filter old ones
      const updatedTxs = recentTxs
        .filter(timestamp => timestamp > oneHourAgo)
        .concat([now]);
      
      await this.cache.set(
        `${this.namespace}:rate:${userId}`,
        'timestamps',
        updatedTxs,
        { ttl: 3600 } // 1 hour
      );
    } catch (error) {
      // Ignore errors for rate limiting
    }
  }

  /**
   * Batch operations
   */
  
  async batchGetUserBalances(userIds) {
    return await this.cache.getMultiple(`${this.namespace}:balance`, userIds);
  }
  
  async batchGetTransactionStatuses(transactionIds) {
    return await this.cache.getMultiple(`${this.namespace}:status`, transactionIds);
  }
  
  async batchGetPendingCounts(userIds) {
    return await this.cache.getMultiple(`${this.namespace}:pending:count`, userIds);
  }

  /**
   * Invalidation methods
   */
  
  async invalidateUserTransactionCache(userId) {
    const patterns = [
      `${this.namespace}:balance:${userId}`,
      `${this.namespace}:balance:*:${userId}`,
      `${this.namespace}:history:${userId}:*`,
      `${this.namespace}:recent:${userId}`,
      `${this.namespace}:pending:${userId}`,
      `${this.namespace}:pending:count:${userId}`,
      `${this.namespace}:mlg:*:${userId}`,
      `${this.namespace}:audit:${userId}`
    ];
    
    let totalInvalidated = 0;
    
    for (const pattern of patterns) {
      const invalidated = await this.cache.invalidatePattern('', pattern);
      totalInvalidated += invalidated;
    }
    
    return totalInvalidated;
  }
  
  async invalidateTransactionCache(transactionId) {
    const patterns = [
      `${this.namespace}:details:${transactionId}`,
      `${this.namespace}:status:${transactionId}`
    ];
    
    let totalInvalidated = 0;
    
    for (const pattern of patterns) {
      const invalidated = await this.cache.invalidatePattern('', pattern);
      totalInvalidated += invalidated;
    }
    
    return totalInvalidated;
  }

  /**
   * Utility methods
   */
  
  roundBalance(amount) {
    return Math.round(amount * Math.pow(10, this.config.balancePrecision)) / Math.pow(10, this.config.balancePrecision);
  }
  
  /**
   * Analytics helpers
   */
  
  async calculateUserTransactionStats(userId) {
    // This would calculate stats from cached transaction data
    const recentTxs = await this.getRecentTransactions(userId);
    if (!recentTxs) return null;
    
    const stats = {
      total_transactions: recentTxs.length,
      successful_transactions: recentTxs.filter(tx => tx.status === 'completed').length,
      total_volume: recentTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0),
      avg_transaction_size: 0
    };
    
    if (stats.total_transactions > 0) {
      stats.avg_transaction_size = this.roundBalance(stats.total_volume / stats.total_transactions);
      stats.success_rate = Math.round((stats.successful_transactions / stats.total_transactions) * 100);
    }
    
    return stats;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      namespace: this.namespace,
      config: this.config
    };
  }
}

// Create singleton instance
let globalTransactionCache = null;

export function createTransactionCache(options = {}) {
  return new TransactionCacheStrategy(options);
}

export function getTransactionCache(options = {}) {
  if (!globalTransactionCache) {
    globalTransactionCache = new TransactionCacheStrategy(options);
  }
  return globalTransactionCache;
}

export default TransactionCacheStrategy;