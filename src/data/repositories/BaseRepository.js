/**
 * Base Repository for MLG.clan Platform
 * 
 * Provides business logic layer on top of DAOs with cross-cutting concerns
 * like event handling, caching strategies, and complex business workflows.
 * 
 * Features:
 * - Business logic orchestration
 * - Cross-DAO transaction coordination
 * - Event-driven architecture integration
 * - Advanced caching strategies
 * - Performance monitoring and analytics
 * - Error handling and recovery
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

export class BaseRepository {
  constructor(options = {}) {
    this.daos = options.daos || {};
    this.eventEmitter = options.eventEmitter;
    this.logger = options.logger || console;
    this.metrics = options.metrics;
    
    // Performance tracking
    this.operationCount = 0;
    this.errorCount = 0;
    this.totalOperationTime = 0;
    
    // Business rules and validators
    this.businessRules = new Map();
    this.validators = new Map();
  }

  /**
   * Execute business operation with monitoring and error handling
   * @param {string} operationName - Operation name
   * @param {Function} operation - Operation function
   * @param {Object} context - Operation context
   * @returns {Promise<any>} Operation result
   */
  async executeOperation(operationName, operation, context = {}) {
    const startTime = Date.now();
    this.operationCount++;

    try {
      // Pre-operation validation
      await this.validateOperation(operationName, context);
      
      // Execute operation
      const result = await operation();
      
      // Post-operation processing
      await this.postProcessOperation(operationName, result, context);
      
      // Track performance
      const duration = Date.now() - startTime;
      this.totalOperationTime += duration;
      
      if (this.metrics) {
        this.metrics.recordOperation(operationName, duration, 'success');
      }
      
      return result;

    } catch (error) {
      this.errorCount++;
      const duration = Date.now() - startTime;
      
      if (this.metrics) {
        this.metrics.recordOperation(operationName, duration, 'error');
      }
      
      this.logger.error(`Repository operation failed: ${operationName}`, {
        error: error.message,
        context,
        duration
      });
      
      throw error;
    }
  }

  /**
   * Validate operation before execution
   * @param {string} operationName - Operation name
   * @param {Object} context - Operation context
   */
  async validateOperation(operationName, context) {
    const validator = this.validators.get(operationName);
    if (validator) {
      await validator(context);
    }
  }

  /**
   * Post-process operation results
   * @param {string} operationName - Operation name
   * @param {any} result - Operation result
   * @param {Object} context - Operation context
   */
  async postProcessOperation(operationName, result, context) {
    // Emit business events
    if (this.eventEmitter) {
      this.eventEmitter.emit(`repository:${operationName}`, {
        result,
        context,
        timestamp: new Date()
      });
    }
    
    // Update metrics and analytics
    await this.updateAnalytics(operationName, result, context);
  }

  /**
   * Update analytics and metrics
   * @param {string} operationName - Operation name
   * @param {any} result - Operation result
   * @param {Object} context - Operation context
   */
  async updateAnalytics(operationName, result, context) {
    // Override in subclasses for specific analytics
  }

  /**
   * Register business rule
   * @param {string} ruleName - Rule name
   * @param {Function} ruleFunction - Rule validation function
   */
  registerBusinessRule(ruleName, ruleFunction) {
    this.businessRules.set(ruleName, ruleFunction);
  }

  /**
   * Register operation validator
   * @param {string} operationName - Operation name
   * @param {Function} validatorFunction - Validator function
   */
  registerValidator(operationName, validatorFunction) {
    this.validators.set(operationName, validatorFunction);
  }

  /**
   * Execute business rule validation
   * @param {string} ruleName - Rule name
   * @param {Object} data - Data to validate
   * @returns {Promise<boolean>} Validation result
   */
  async validateBusinessRule(ruleName, data) {
    const rule = this.businessRules.get(ruleName);
    if (!rule) {
      throw new Error(`Business rule not found: ${ruleName}`);
    }
    
    return await rule(data);
  }

  /**
   * Execute cross-DAO transaction
   * @param {Function} transactionFunction - Transaction function
   * @returns {Promise<any>} Transaction result
   */
  async executeTransaction(transactionFunction) {
    // Use the primary DAO's transaction method
    const primaryDAO = Object.values(this.daos)[0];
    if (!primaryDAO || !primaryDAO.executeTransaction) {
      throw new Error('No DAO available for transaction execution');
    }
    
    return await primaryDAO.executeTransaction(transactionFunction);
  }

  /**
   * Get repository performance statistics
   * @returns {Object} Performance stats
   */
  getStats() {
    return {
      operationCount: this.operationCount,
      errorCount: this.errorCount,
      avgOperationTime: this.operationCount > 0 ? Math.round(this.totalOperationTime / this.operationCount) : 0,
      errorRate: this.operationCount > 0 ? (this.errorCount / this.operationCount) * 100 : 0,
      totalOperationTime: this.totalOperationTime
    };
  }

  /**
   * Reset performance counters
   */
  resetStats() {
    this.operationCount = 0;
    this.errorCount = 0;
    this.totalOperationTime = 0;
  }
}

export default BaseRepository;