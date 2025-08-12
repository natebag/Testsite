/**
 * Solana Transaction Batching System
 * 
 * Intelligent batching system for MLG.clan gaming operations to reduce
 * transaction fees and improve efficiency through smart grouping and timing.
 * 
 * Features:
 * - Smart vote batching with time-based windows
 * - Burn transaction optimization and grouping
 * - Clan operation batching for treasury management
 * - Tournament-specific batch processing
 * - Real-time batch queue management
 * - Gaming-aware priority and timing
 * 
 * @author Claude Code - Solana Web3 Security Architect
 * @version 1.0.0
 */

import { 
  Connection, 
  PublicKey, 
  Transaction,
  TransactionInstruction,
  ComputeBudgetProgram
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID,
  createBurnInstruction,
  getAssociatedTokenAddress
} from '@solana/spl-token';
import { getGasOptimizer, TRANSACTION_PRIORITIES } from './gas-optimization.js';
import { getFeeEstimator } from './fee-estimation.js';
import { createConnection } from '../../../config/environment/solana-config.js';

/**
 * Transaction Batching Configuration
 */
export const BATCHING_CONFIG = {
  // Batch sizing limits
  MAX_INSTRUCTIONS_PER_BATCH: 64, // Solana transaction limit
  MAX_VOTE_BATCH_SIZE: 10,
  MAX_BURN_BATCH_SIZE: 8,
  MAX_CLAN_OP_BATCH_SIZE: 6,
  
  // Timing windows (milliseconds)
  BATCH_WINDOWS: {
    VOTE: 3_000, // 3 seconds
    BURN: 2_000, // 2 seconds
    CLAN: 5_000, // 5 seconds
    TOURNAMENT: 1_000, // 1 second for tournaments
    DEFAULT: 3_000
  },
  
  // Minimum batch requirements
  MIN_BATCH_SIZE: 2,
  MIN_FEE_SAVINGS: 0.1, // 10% minimum savings to batch
  
  // Priority handling
  PRIORITY_THRESHOLDS: {
    IMMEDIATE: 0, // Process immediately
    FAST: 500, // 500ms max wait
    NORMAL: 2_000, // 2s max wait
    PATIENT: 5_000 // 5s max wait
  },
  
  // Gaming-specific batching
  GAMING_MODES: {
    TOURNAMENT: {
      maxWaitTime: 1_000,
      maxBatchSize: 5,
      priorityOverride: true
    },
    CLAN_BATTLE: {
      maxWaitTime: 2_000,
      maxBatchSize: 8,
      priorityOverride: false
    },
    VOTING_RUSH: {
      maxWaitTime: 1_500,
      maxBatchSize: 12,
      priorityOverride: false
    },
    CASUAL: {
      maxWaitTime: 5_000,
      maxBatchSize: 15,
      priorityOverride: false
    }
  },
  
  // Error handling
  RETRY: {
    MAX_ATTEMPTS: 3,
    BATCH_SPLIT_ON_FAIL: true,
    INDIVIDUAL_FALLBACK: true
  }
};

/**
 * Batch Types for different operations
 */
export const BATCH_TYPES = {
  VOTE: 'vote',
  BURN: 'burn',
  CLAN_OP: 'clan_operation',
  TREASURY: 'treasury',
  MIXED: 'mixed',
  TOURNAMENT: 'tournament'
};

/**
 * Batch Status Tracking
 */
export const BATCH_STATUS = {
  QUEUED: 'queued',
  BUILDING: 'building',
  READY: 'ready',
  EXECUTING: 'executing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * Transaction Batching Manager
 */
export class TransactionBatcher {
  constructor(connection = null, gasOptimizer = null, feeEstimator = null) {
    this.connection = connection || createConnection();
    this.gasOptimizer = gasOptimizer || getGasOptimizer();
    this.feeEstimator = feeEstimator || getFeeEstimator();
    
    // Batch queues organized by type
    this.batchQueues = new Map();
    this.activeBatches = new Map();
    this.batchTimers = new Map();
    
    // Statistics and monitoring
    this.batchStats = {
      totalBatches: 0,
      successfulBatches: 0,
      totalFeesSaved: 0,
      avgBatchSize: 0,
      avgProcessingTime: 0
    };
    
    // State management
    this.isProcessing = false;
    this.gamingMode = 'CASUAL';
    
    this.initializeBatchQueues();
    
    console.log('📦 Transaction Batcher initialized');
  }

  /**
   * Initialize batch queues for different operation types
   */
  initializeBatchQueues() {
    Object.values(BATCH_TYPES).forEach(type => {
      this.batchQueues.set(type, {
        transactions: [],
        metadata: [],
        createdAt: Date.now(),
        status: BATCH_STATUS.QUEUED
      });
    });
  }

  /**
   * Add transaction to appropriate batch queue
   */
  async addToBatch(transaction, options = {}) {
    const {
      type = BATCH_TYPES.MIXED,
      priority = TRANSACTION_PRIORITIES.NORMAL,
      gamingContext = null,
      userId = null,
      contentId = null,
      operationId = null,
      timeout = null,
      callback = null
    } = options;
    
    try {
      console.log(`📦 Adding transaction to ${type} batch`);
      
      // Determine batch type if not specified
      const batchType = this.determineBatchType(transaction, type);
      
      // Create transaction metadata
      const metadata = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        transaction,
        options,
        priority,
        gamingContext,
        userId,
        contentId,
        operationId,
        addedAt: Date.now(),
        timeout,
        callback,
        status: 'pending'
      };
      
      // Get or create batch queue
      let batchQueue = this.batchQueues.get(batchType);
      if (!batchQueue) {
        batchQueue = {
          transactions: [],
          metadata: [],
          createdAt: Date.now(),
          status: BATCH_STATUS.QUEUED
        };
        this.batchQueues.set(batchType, batchQueue);
      }
      
      // Add to queue
      batchQueue.transactions.push(transaction);
      batchQueue.metadata.push(metadata);
      
      console.log(`📦 Transaction added to ${batchType} batch (${batchQueue.transactions.length} pending)`);
      
      // Check if we should process the batch immediately
      const shouldProcess = this.shouldProcessBatch(batchType, batchQueue);
      
      if (shouldProcess) {
        // Process immediately for high priority or full batches
        await this.processBatch(batchType);
      } else {
        // Set or reset timer for this batch type
        this.scheduleeBatchProcessing(batchType);
      }
      
      return {
        batchType,
        transactionId: metadata.id,
        queuePosition: batchQueue.transactions.length,
        estimatedProcessTime: this.estimateProcessingTime(batchType, batchQueue)
      };
      
    } catch (error) {
      console.error('❌ Failed to add transaction to batch:', error);
      throw new Error(`Batching failed: ${error.message}`);
    }
  }

  /**
   * Determine appropriate batch type for transaction
   */
  determineBatchType(transaction, hintType) {
    // Analyze transaction instructions to determine type
    const instructions = transaction.instructions;
    
    // Check for burn instructions
    const hasBurnInstruction = instructions.some(ix => 
      ix.programId.equals(new PublicKey(TOKEN_PROGRAM_ID)) &&
      ix.data.length > 0 && ix.data[0] === 8 // Burn instruction discriminator
    );
    
    if (hasBurnInstruction) {
      return BATCH_TYPES.BURN;
    }
    
    // Check for vote-related instructions (custom program calls)
    const hasVoteInstruction = instructions.some(ix => 
      !ix.programId.equals(new PublicKey(TOKEN_PROGRAM_ID)) &&
      !ix.programId.equals(new PublicKey('11111111111111111111111111111112')) // System Program
    );
    
    if (hasVoteInstruction && hintType === BATCH_TYPES.VOTE) {
      return BATCH_TYPES.VOTE;
    }
    
    // Default to hint type or mixed
    return hintType || BATCH_TYPES.MIXED;
  }

  /**
   * Check if batch should be processed immediately
   */
  shouldProcessBatch(batchType, batchQueue) {
    const transactions = batchQueue.transactions;
    const metadata = batchQueue.metadata;
    
    // Check size limits
    const maxSize = this.getMaxBatchSize(batchType);
    if (transactions.length >= maxSize) {
      return true;
    }
    
    // Check for high priority transactions
    const hasHighPriority = metadata.some(meta => 
      meta.priority === TRANSACTION_PRIORITIES.COMPETITIVE ||
      meta.priority === TRANSACTION_PRIORITIES.TOURNAMENT
    );
    
    if (hasHighPriority && transactions.length >= BATCHING_CONFIG.MIN_BATCH_SIZE) {
      return true;
    }
    
    // Check gaming mode constraints
    const gamingConfig = BATCHING_CONFIG.GAMING_MODES[this.gamingMode];
    if (gamingConfig && transactions.length >= Math.min(gamingConfig.maxBatchSize, maxSize)) {
      return true;
    }
    
    // Check individual transaction timeouts
    const now = Date.now();
    const hasExpiredTimeout = metadata.some(meta => 
      meta.timeout && (now - meta.addedAt) > meta.timeout
    );
    
    if (hasExpiredTimeout) {
      return true;
    }
    
    return false;
  }

  /**
   * Get maximum batch size for operation type
   */
  getMaxBatchSize(batchType) {
    switch (batchType) {
      case BATCH_TYPES.VOTE:
        return BATCHING_CONFIG.MAX_VOTE_BATCH_SIZE;
      case BATCH_TYPES.BURN:
        return BATCHING_CONFIG.MAX_BURN_BATCH_SIZE;
      case BATCH_TYPES.CLAN_OP:
        return BATCHING_CONFIG.MAX_CLAN_OP_BATCH_SIZE;
      default:
        return 10; // Default max size
    }
  }

  /**
   * Schedule batch processing with appropriate timing
   */
  scheduleeBatchProcessing(batchType) {
    // Clear existing timer
    if (this.batchTimers.has(batchType)) {
      clearTimeout(this.batchTimers.get(batchType));
    }
    
    // Determine wait time based on gaming mode and batch type
    const gamingConfig = BATCHING_CONFIG.GAMING_MODES[this.gamingMode];
    const baseWaitTime = BATCHING_CONFIG.BATCH_WINDOWS[batchType.toUpperCase()] || BATCHING_CONFIG.BATCH_WINDOWS.DEFAULT;
    const waitTime = Math.min(baseWaitTime, gamingConfig?.maxWaitTime || baseWaitTime);
    
    // Schedule processing
    const timer = setTimeout(() => {
      this.processBatch(batchType).catch(error => {
        console.error(`❌ Scheduled batch processing failed for ${batchType}:`, error);
      });
    }, waitTime);
    
    this.batchTimers.set(batchType, timer);
    
    console.log(`⏰ Batch ${batchType} scheduled for processing in ${waitTime}ms`);
  }

  /**
   * Process a batch of transactions
   */
  async processBatch(batchType) {
    const startTime = Date.now();
    
    try {
      console.log(`🚀 Processing ${batchType} batch`);
      
      // Get and validate batch queue
      const batchQueue = this.batchQueues.get(batchType);
      if (!batchQueue || batchQueue.transactions.length === 0) {
        console.log(`ℹ️ No transactions in ${batchType} batch to process`);
        return;
      }
      
      // Check minimum batch size requirement
      if (batchQueue.transactions.length < BATCHING_CONFIG.MIN_BATCH_SIZE) {
        console.log(`⏳ ${batchType} batch too small (${batchQueue.transactions.length}), waiting for more`);
        return;
      }
      
      // Mark batch as processing
      batchQueue.status = BATCH_STATUS.BUILDING;
      
      // Extract transactions and metadata
      const transactions = [...batchQueue.transactions];
      const metadata = [...batchQueue.metadata];
      
      // Clear the queue
      batchQueue.transactions = [];
      batchQueue.metadata = [];
      batchQueue.status = BATCH_STATUS.QUEUED;
      
      // Clear timer
      if (this.batchTimers.has(batchType)) {
        clearTimeout(this.batchTimers.get(batchType));
        this.batchTimers.delete(batchType);
      }
      
      // Create batch ID
      const batchId = `batch_${batchType}_${Date.now()}`;
      
      // Store active batch
      this.activeBatches.set(batchId, {
        type: batchType,
        transactions,
        metadata,
        status: BATCH_STATUS.BUILDING,
        startTime
      });
      
      // Analyze batch feasibility
      const feasibility = await this.analyzeBatchFeasibility(transactions, batchType);
      if (!feasibility.canBatch) {
        console.log(`⚠️ Batch ${batchId} not feasible: ${feasibility.reason}`);
        await this.processIndividualTransactions(transactions, metadata, batchId);
        return;
      }
      
      // Create optimized batch transaction
      const batchResult = await this.createOptimizedBatch(transactions, metadata, batchType);
      
      // Execute the batch
      const executionResult = await this.executeBatch(batchId, batchResult);
      
      // Handle results
      await this.processBatchResults(batchId, executionResult, metadata);
      
      // Update statistics
      this.updateBatchStatistics(batchId, transactions.length, Date.now() - startTime, executionResult.success);
      
      console.log(`✅ Batch ${batchId} completed in ${Date.now() - startTime}ms`);
      
    } catch (error) {
      console.error(`❌ Batch processing failed for ${batchType}:`, error);
      
      // Fallback to individual processing
      const batchQueue = this.batchQueues.get(batchType);
      if (batchQueue && batchQueue.transactions.length > 0) {
        await this.processIndividualTransactions(
          batchQueue.transactions, 
          batchQueue.metadata, 
          `fallback_${batchType}_${Date.now()}`
        );
      }
      
      throw error;
    }
  }

  /**
   * Analyze if transactions can be batched together
   */
  async analyzeBatchFeasibility(transactions, batchType) {
    try {
      // Count total instructions
      const totalInstructions = transactions.reduce((sum, tx) => sum + tx.instructions.length, 0);
      
      if (totalInstructions > BATCHING_CONFIG.MAX_INSTRUCTIONS_PER_BATCH) {
        return {
          canBatch: false,
          reason: `Too many instructions: ${totalInstructions} (max ${BATCHING_CONFIG.MAX_INSTRUCTIONS_PER_BATCH})`
        };
      }
      
      // Estimate fee savings
      const feeEstimation = await this.feeEstimator.estimateBatchFees(
        transactions.map((tx, index) => ({
          type: batchType,
          options: {}
        }))
      );
      
      if (!feeEstimation.savings.worthBatching) {
        return {
          canBatch: false,
          reason: `Insufficient savings: ${feeEstimation.savings.percentage.toFixed(1)}%`
        };
      }
      
      // Check for compatible signers (simplified check)
      const requiresMultipleSigners = transactions.some(tx => 
        tx.signatures && tx.signatures.length > 1
      );
      
      if (requiresMultipleSigners) {
        return {
          canBatch: false,
          reason: 'Multi-signer transactions cannot be batched'
        };
      }
      
      return {
        canBatch: true,
        totalInstructions,
        estimatedSavings: feeEstimation.savings
      };
      
    } catch (error) {
      console.error('❌ Batch feasibility analysis failed:', error);
      return {
        canBatch: false,
        reason: `Analysis failed: ${error.message}`
      };
    }
  }

  /**
   * Create optimized batch transaction
   */
  async createOptimizedBatch(transactions, metadata, batchType) {
    try {
      // Create new batch transaction
      const batchTx = new Transaction();
      
      // Determine priority from highest priority transaction
      const maxPriority = metadata.reduce((max, meta) => {
        const priorityLevels = {
          [TRANSACTION_PRIORITIES.LOW]: 1,
          [TRANSACTION_PRIORITIES.NORMAL]: 2,
          [TRANSACTION_PRIORITIES.HIGH]: 3,
          [TRANSACTION_PRIORITIES.GAMING]: 4,
          [TRANSACTION_PRIORITIES.COMPETITIVE]: 5,
          [TRANSACTION_PRIORITIES.TOURNAMENT]: 6
        };
        return Math.max(max, priorityLevels[meta.priority] || 2);
      }, 1);
      
      const priorities = Object.keys(TRANSACTION_PRIORITIES);
      const batchPriority = priorities[Math.min(maxPriority - 1, priorities.length - 1)];
      
      // Combine all instructions
      transactions.forEach(tx => {
        tx.instructions.forEach(instruction => {
          batchTx.add(instruction);
        });
      });
      
      // Optimize with gas optimizer
      const optimizationResult = await this.gasOptimizer.optimizeTransaction(batchTx, {
        priority: batchPriority,
        gamingContext: this.getGamingContext(metadata),
        maxFeeRatio: 0.1 // Allow higher fees for batches
      });
      
      return {
        batchTransaction: optimizationResult.optimizedTransaction,
        optimization: optimizationResult,
        batchPriority
      };
      
    } catch (error) {
      console.error('❌ Failed to create optimized batch:', error);
      throw error;
    }
  }

  /**
   * Get gaming context from metadata
   */
  getGamingContext(metadata) {
    // Find most relevant gaming context
    const contexts = metadata
      .map(meta => meta.gamingContext)
      .filter(context => context !== null);
    
    if (contexts.includes('tournament')) return 'tournament';
    if (contexts.includes('clan_battle')) return 'clan_battle';
    if (contexts.includes('voting_rush')) return 'voting_rush';
    if (contexts.includes('voting')) return 'voting';
    
    return null;
  }

  /**
   * Execute batch transaction
   */
  async executeBatch(batchId, batchResult) {
    const batch = this.activeBatches.get(batchId);
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }
    
    try {
      batch.status = BATCH_STATUS.EXECUTING;
      
      console.log(`📡 Executing batch ${batchId} with ${batch.transactions.length} transactions`);
      
      // Use the gas optimizer's connection for execution
      const signature = await this.connection.sendTransaction(
        batchResult.batchTransaction,
        [], // Signers should be handled by wallet
        {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
          maxRetries: BATCHING_CONFIG.RETRY.MAX_ATTEMPTS
        }
      );
      
      // Wait for confirmation
      const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Batch transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }
      
      batch.status = BATCH_STATUS.COMPLETED;
      
      return {
        success: true,
        signature,
        confirmation,
        batchResult
      };
      
    } catch (error) {
      console.error(`❌ Batch execution failed for ${batchId}:`, error);
      batch.status = BATCH_STATUS.FAILED;
      
      return {
        success: false,
        error: error.message,
        batchResult
      };
    }
  }

  /**
   * Process batch execution results
   */
  async processBatchResults(batchId, executionResult, metadata) {
    const batch = this.activeBatches.get(batchId);
    if (!batch) return;
    
    try {
      if (executionResult.success) {
        // Notify all transaction callbacks of success
        metadata.forEach(meta => {
          meta.status = 'completed';
          if (meta.callback) {
            try {
              meta.callback({
                success: true,
                signature: executionResult.signature,
                batchId,
                transactionId: meta.id
              });
            } catch (callbackError) {
              console.error('❌ Callback failed:', callbackError);
            }
          }
        });
        
        console.log(`✅ Batch ${batchId} success: ${metadata.length} transactions completed`);
        
      } else {
        // Handle batch failure - try individual processing if configured
        if (BATCHING_CONFIG.RETRY.INDIVIDUAL_FALLBACK) {
          console.log(`🔄 Falling back to individual processing for ${batchId}`);
          await this.processIndividualTransactions(batch.transactions, metadata, `${batchId}_fallback`);
        } else {
          // Mark all as failed
          metadata.forEach(meta => {
            meta.status = 'failed';
            if (meta.callback) {
              try {
                meta.callback({
                  success: false,
                  error: executionResult.error,
                  batchId,
                  transactionId: meta.id
                });
              } catch (callbackError) {
                console.error('❌ Callback failed:', callbackError);
              }
            }
          });
        }
      }
      
      // Clean up batch
      this.activeBatches.delete(batchId);
      
    } catch (error) {
      console.error(`❌ Failed to process batch results for ${batchId}:`, error);
    }
  }

  /**
   * Process transactions individually as fallback
   */
  async processIndividualTransactions(transactions, metadata, fallbackId) {
    console.log(`🔄 Processing ${transactions.length} transactions individually (${fallbackId})`);
    
    const results = [];
    
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      const meta = metadata[i];
      
      try {
        // Optimize individual transaction
        const optimizationResult = await this.gasOptimizer.optimizeTransaction(tx, {
          priority: meta.priority,
          gamingContext: meta.gamingContext
        });
        
        // Execute transaction
        const signature = await this.connection.sendTransaction(
          optimizationResult.optimizedTransaction,
          [],
          { skipPreflight: false, preflightCommitment: 'confirmed' }
        );
        
        const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');
        
        if (confirmation.value.err) {
          throw new Error(`Individual transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }
        
        // Success callback
        meta.status = 'completed';
        if (meta.callback) {
          meta.callback({
            success: true,
            signature,
            transactionId: meta.id,
            processed: 'individual'
          });
        }
        
        results.push({ success: true, signature, transactionId: meta.id });
        
      } catch (error) {
        console.error(`❌ Individual transaction failed (${meta.id}):`, error);
        
        meta.status = 'failed';
        if (meta.callback) {
          meta.callback({
            success: false,
            error: error.message,
            transactionId: meta.id,
            processed: 'individual'
          });
        }
        
        results.push({ success: false, error: error.message, transactionId: meta.id });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`📊 Individual processing complete: ${successCount}/${transactions.length} successful`);
    
    return results;
  }

  /**
   * Estimate processing time for batch
   */
  estimateProcessingTime(batchType, batchQueue) {
    const baseTime = 2_000; // 2 seconds base processing
    const perTransactionTime = 500; // 500ms per additional transaction
    const queueSize = batchQueue.transactions.length;
    
    return baseTime + (queueSize * perTransactionTime);
  }

  /**
   * Update batch statistics
   */
  updateBatchStatistics(batchId, transactionCount, processingTime, success) {
    this.batchStats.totalBatches++;
    if (success) {
      this.batchStats.successfulBatches++;
    }
    
    // Update running averages
    this.batchStats.avgBatchSize = (
      (this.batchStats.avgBatchSize * (this.batchStats.totalBatches - 1)) + transactionCount
    ) / this.batchStats.totalBatches;
    
    this.batchStats.avgProcessingTime = (
      (this.batchStats.avgProcessingTime * (this.batchStats.totalBatches - 1)) + processingTime
    ) / this.batchStats.totalBatches;
    
    console.log(`📊 Batch stats updated: ${this.batchStats.successfulBatches}/${this.batchStats.totalBatches} successful`);
  }

  /**
   * Set gaming mode for batch optimization
   */
  setGamingMode(mode) {
    if (!BATCHING_CONFIG.GAMING_MODES[mode]) {
      throw new Error(`Unknown gaming mode: ${mode}`);
    }
    
    this.gamingMode = mode;
    console.log(`🎮 Gaming mode set to: ${mode}`);
    
    // Adjust existing timers based on new mode
    this.adjustTimersForGamingMode();
  }

  /**
   * Adjust existing timers when gaming mode changes
   */
  adjustTimersForGamingMode() {
    const gamingConfig = BATCHING_CONFIG.GAMING_MODES[this.gamingMode];
    
    // Clear and reschedule all active timers with new timing
    for (const [batchType, timer] of this.batchTimers) {
      clearTimeout(timer);
      this.scheduleeBatchProcessing(batchType);
    }
  }

  /**
   * Get current batch statistics
   */
  getBatchStatistics() {
    return {
      ...this.batchStats,
      currentQueues: Object.fromEntries(
        Array.from(this.batchQueues.entries()).map(([type, queue]) => [
          type,
          {
            count: queue.transactions.length,
            status: queue.status,
            oldestTransaction: queue.transactions.length > 0 ? 
              Math.min(...queue.metadata.map(meta => meta.addedAt)) : null
          }
        ])
      ),
      activeBatches: this.activeBatches.size,
      gamingMode: this.gamingMode
    };
  }

  /**
   * Cancel all pending transactions for a user
   */
  cancelUserTransactions(userId) {
    let canceledCount = 0;
    
    for (const [batchType, queue] of this.batchQueues) {
      const toRemove = [];
      
      queue.metadata.forEach((meta, index) => {
        if (meta.userId === userId) {
          toRemove.push(index);
          
          // Call callback with cancellation
          if (meta.callback) {
            try {
              meta.callback({
                success: false,
                error: 'Transaction cancelled by user',
                transactionId: meta.id,
                cancelled: true
              });
            } catch (callbackError) {
              console.error('❌ Cancellation callback failed:', callbackError);
            }
          }
          
          canceledCount++;
        }
      });
      
      // Remove transactions in reverse order to maintain indices
      toRemove.reverse().forEach(index => {
        queue.transactions.splice(index, 1);
        queue.metadata.splice(index, 1);
      });
    }
    
    console.log(`🚫 Cancelled ${canceledCount} transactions for user ${userId}`);
    return canceledCount;
  }

  /**
   * Force process all queued batches immediately
   */
  async forceProcessAllBatches() {
    console.log('🚀 Force processing all queued batches');
    
    const promises = [];
    for (const batchType of this.batchQueues.keys()) {
      const queue = this.batchQueues.get(batchType);
      if (queue.transactions.length > 0) {
        promises.push(this.processBatch(batchType));
      }
    }
    
    try {
      await Promise.all(promises);
      console.log('✅ All batches processed');
    } catch (error) {
      console.error('❌ Force processing failed:', error);
      throw error;
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Clear all timers
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer);
    }
    this.batchTimers.clear();
    
    // Clear all queues
    this.batchQueues.clear();
    this.activeBatches.clear();
    
    console.log('🧹 Transaction Batcher cleaned up');
  }
}

/**
 * Global transaction batcher instance
 */
let transactionBatcherInstance = null;

/**
 * Get or create transaction batcher instance
 */
export function getTransactionBatcher(connection = null, gasOptimizer = null, feeEstimator = null) {
  if (!transactionBatcherInstance) {
    transactionBatcherInstance = new TransactionBatcher(connection, gasOptimizer, feeEstimizer);
  }
  return transactionBatcherInstance;
}

/**
 * Initialize transaction batcher
 */
export async function initializeTransactionBatcher(options = {}) {
  try {
    const batcher = getTransactionBatcher();
    
    // Set initial gaming mode if specified
    if (options.gamingMode) {
      batcher.setGamingMode(options.gamingMode);
    }
    
    // Make available globally
    window.MLGTransactionBatcher = batcher;
    
    console.log('✅ Transaction Batcher ready globally');
    return batcher;
    
  } catch (error) {
    console.error('❌ Failed to initialize transaction batcher:', error);
    throw error;
  }
}

export default TransactionBatcher;