/**
 * Solana Web3 Gas Efficiency Optimization System - Task 17.9
 * 
 * Comprehensive gas optimization for MLG.clan gaming platform including:
 * - Transaction batching and optimization
 * - Dynamic fee estimation and management
 * - Compute unit optimization
 * - Gaming-specific Web3 performance enhancements
 * 
 * Features:
 * - Smart transaction batching for votes and clan operations
 * - Dynamic fee estimation based on network conditions
 * - Compute unit optimization for Solana programs
 * - Gaming workflow optimization for competitive scenarios
 * - Real-time fee monitoring and user cost transparency
 * 
 * @author Claude Code - Solana Web3 Security Architect
 * @version 1.0.0
 */

import { 
  Connection, 
  PublicKey, 
  Transaction,
  TransactionInstruction,
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
  SystemProgram,
  SendTransactionError
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createBurnInstruction,
  getAssociatedTokenAddress
} from '@solana/spl-token';
import { createConnection, CURRENT_NETWORK } from '../../../config/environment/solana-config.js';

/**
 * Gas Optimization Configuration
 */
export const GAS_OPTIMIZATION_CONFIG = {
  // Compute unit limits and pricing
  COMPUTE_UNITS: {
    MIN_UNITS: 1_400,
    MAX_UNITS: 1_400_000,
    DEFAULT_VOTE: 5_000,
    DEFAULT_BURN: 10_000,
    DEFAULT_CLAN_OP: 15_000,
    BATCH_MULTIPLIER: 1.2
  },
  
  // Priority fee configuration (micro-lamports per compute unit)
  PRIORITY_FEES: {
    LOW: 0,
    NORMAL: 1_000,
    HIGH: 5_000,
    ULTRA: 10_000,
    GAMING_COMPETITIVE: 15_000,
    MAX_GAMING: 25_000
  },
  
  // Network congestion thresholds
  CONGESTION_THRESHOLDS: {
    LOW: 5_000,      // Recent slot hash count
    MEDIUM: 15_000,
    HIGH: 25_000,
    EXTREME: 35_000
  },
  
  // Transaction batching limits
  BATCHING: {
    MAX_BATCH_SIZE: 10,
    MAX_VOTE_BATCH: 8,
    MAX_BURN_BATCH: 5,
    BATCH_TIMEOUT: 2000, // 2 seconds
    MIN_BATCH_SAVINGS: 0.1 // 10% fee savings minimum
  },
  
  // Fee estimation and caching
  FEE_ESTIMATION: {
    CACHE_DURATION: 10_000, // 10 seconds
    ESTIMATION_SAMPLES: 20,
    SIMULATION_RETRIES: 3,
    FEE_BUFFER_MULTIPLIER: 1.15, // 15% safety buffer
    MAX_FEE_RATIO: 0.05 // Max 5% of transaction value
  },
  
  // Gaming-specific optimizations
  GAMING: {
    TOURNAMENT_MODE_MULTIPLIER: 1.5,
    CLAN_BATTLE_MULTIPLIER: 1.3,
    VOTING_RUSH_MULTIPLIER: 1.2,
    LEADERBOARD_UPDATE_DELAY: 100, // ms
    REAL_TIME_UPDATE_PRIORITY: 'HIGH'
  },
  
  // Error handling and retry logic
  RETRY: {
    MAX_ATTEMPTS: 3,
    BASE_DELAY: 1000,
    EXPONENTIAL_BACKOFF: true,
    CONGESTION_RETRY_DELAY: 2000,
    NETWORK_ERROR_DELAY: 5000
  }
};

/**
 * Network congestion levels
 */
export const CONGESTION_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium', 
  HIGH: 'high',
  EXTREME: 'extreme'
};

/**
 * Transaction priority levels for gaming scenarios
 */
export const TRANSACTION_PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  GAMING: 'gaming',
  COMPETITIVE: 'competitive',
  TOURNAMENT: 'tournament'
};

/**
 * Main Gas Optimization Manager
 */
export class SolanaGasOptimizer {
  constructor(connection = null, options = {}) {
    this.connection = connection || createConnection();
    this.options = {
      enableBatching: true,
      enableDynamicFees: true,
      enableComputeOptimization: true,
      gamingMode: false,
      ...options
    };
    
    // State management
    this.feeCache = new Map();
    this.congestionCache = new Map();
    this.batchQueue = new Map();
    this.performanceMetrics = new Map();
    
    // Batch processing
    this.batchTimers = new Map();
    this.activeBatches = new Map();
    
    // Monitoring
    this.startNetworkMonitoring();
    
    console.log('⚡ Solana Gas Optimizer initialized');
  }

  /**
   * Optimize a single transaction for gas efficiency
   */
  async optimizeTransaction(transaction, options = {}) {
    const startTime = Date.now();
    
    try {
      const {
        priority = TRANSACTION_PRIORITIES.NORMAL,
        gamingContext = null,
        maxFeeRatio = GAS_OPTIMIZATION_CONFIG.FEE_ESTIMATION.MAX_FEE_RATIO,
        userBalance = null
      } = options;
      
      console.log(`🔧 Optimizing transaction with priority: ${priority}`);
      
      // Step 1: Analyze transaction complexity
      const analysis = await this.analyzeTransaction(transaction);
      
      // Step 2: Get current network conditions
      const networkState = await this.getNetworkState();
      
      // Step 3: Calculate optimal compute units
      const computeUnits = this.calculateOptimalComputeUnits(analysis, networkState);
      
      // Step 4: Determine priority fee
      const priorityFee = await this.calculateOptimalPriorityFee(
        priority, 
        networkState, 
        gamingContext
      );
      
      // Step 5: Add compute budget instructions
      const optimizedTx = await this.addComputeBudgetInstructions(
        transaction, 
        computeUnits, 
        priorityFee
      );
      
      // Step 6: Validate fee constraints
      const feeValidation = await this.validateFeeConstraints(
        optimizedTx, 
        maxFeeRatio, 
        userBalance
      );
      
      if (!feeValidation.valid) {
        throw new Error(`Fee validation failed: ${feeValidation.reason}`);
      }
      
      // Step 7: Performance tracking
      const optimizationTime = Date.now() - startTime;
      this.trackOptimizationMetrics(analysis, networkState, optimizationTime);
      
      console.log(`✅ Transaction optimized in ${optimizationTime}ms`);
      console.log(`💰 Estimated fee: ${feeValidation.estimatedFee} SOL`);
      console.log(`⚡ Compute units: ${computeUnits}`);
      console.log(`🎯 Priority fee: ${priorityFee} micro-lamports/CU`);
      
      return {
        optimizedTransaction: optimizedTx,
        analysis,
        fees: feeValidation,
        networkState,
        optimizationTime
      };
      
    } catch (error) {
      console.error('❌ Transaction optimization failed:', error);
      throw new Error(`Gas optimization failed: ${error.message}`);
    }
  }

  /**
   * Batch multiple transactions for improved efficiency
   */
  async batchTransactions(transactions, options = {}) {
    const startTime = Date.now();
    
    try {
      const {
        maxBatchSize = GAS_OPTIMIZATION_CONFIG.BATCHING.MAX_BATCH_SIZE,
        batchTimeout = GAS_OPTIMIZATION_CONFIG.BATCHING.BATCH_TIMEOUT,
        priority = TRANSACTION_PRIORITIES.NORMAL,
        gamingContext = null
      } = options;
      
      console.log(`📦 Batching ${transactions.length} transactions`);
      
      // Validate batch constraints
      if (transactions.length > maxBatchSize) {
        throw new Error(`Batch size exceeds maximum: ${maxBatchSize}`);
      }
      
      // Analyze batching feasibility
      const batchAnalysis = await this.analyzeBatchFeasibility(transactions);
      if (!batchAnalysis.feasible) {
        throw new Error(`Batch not feasible: ${batchAnalysis.reason}`);
      }
      
      // Create optimized batch transaction
      const batchedTx = await this.createBatchTransaction(transactions, options);
      
      // Optimize the batched transaction
      const optimizationResult = await this.optimizeTransaction(batchedTx, {
        priority,
        gamingContext,
        maxFeeRatio: 0.1, // Higher limit for batches
      });
      
      // Calculate savings
      const individualCosts = await this.estimateIndividualTransactionCosts(transactions);
      const batchCost = optimizationResult.fees.estimatedFee;
      const savings = Math.max(0, individualCosts.total - batchCost);
      const savingsPercentage = (savings / individualCosts.total) * 100;
      
      const batchTime = Date.now() - startTime;
      
      console.log(`✅ Batch created in ${batchTime}ms`);
      console.log(`💰 Individual costs: ${individualCosts.total} SOL`);
      console.log(`💰 Batch cost: ${batchCost} SOL`);
      console.log(`💵 Savings: ${savings} SOL (${savingsPercentage.toFixed(1)}%)`);
      
      return {
        batchedTransaction: optimizationResult.optimizedTransaction,
        analysis: optimizationResult.analysis,
        fees: optimizationResult.fees,
        individualCosts,
        savings: {
          amount: savings,
          percentage: savingsPercentage
        },
        batchTime
      };
      
    } catch (error) {
      console.error('❌ Transaction batching failed:', error);
      throw new Error(`Batch optimization failed: ${error.message}`);
    }
  }

  /**
   * Optimize burn-to-vote transactions specifically
   */
  async optimizeBurnToVote(burnInstructions, options = {}) {
    const {
      voteCount = 1,
      tokenAmount = 25,
      gamingContext = 'voting',
      urgency = false
    } = options;
    
    try {
      console.log(`🔥 Optimizing burn-to-vote for ${voteCount} votes`);
      
      // Determine priority based on gaming context
      let priority = TRANSACTION_PRIORITIES.NORMAL;
      if (urgency || gamingContext === 'tournament') {
        priority = TRANSACTION_PRIORITIES.COMPETITIVE;
      } else if (gamingContext === 'clan_battle') {
        priority = TRANSACTION_PRIORITIES.GAMING;
      }
      
      // Create burn transaction
      const burnTx = new Transaction();
      
      // Add all burn instructions
      burnInstructions.forEach(instruction => {
        burnTx.add(instruction);
      });
      
      // Optimize for burn operations
      const computeUnits = GAS_OPTIMIZATION_CONFIG.COMPUTE_UNITS.DEFAULT_BURN * voteCount;
      const networkState = await this.getNetworkState();
      const priorityFee = await this.calculateOptimalPriorityFee(priority, networkState, gamingContext);
      
      // Add compute budget with burn-specific optimizations
      burnTx.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: Math.min(computeUnits, GAS_OPTIMIZATION_CONFIG.COMPUTE_UNITS.MAX_UNITS)
        })
      );
      
      burnTx.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: priorityFee
        })
      );
      
      // Simulate and validate
      const simulation = await this.connection.simulateTransaction(burnTx, {
        commitment: 'processed'
      });
      
      if (simulation.value.err) {
        throw new Error(`Burn transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
      }
      
      const estimatedFee = (simulation.value.unitsConsumed || computeUnits) * priorityFee / 1_000_000 + 5000 / LAMPORTS_PER_SOL;
      
      console.log(`🔥 Burn-to-vote optimization complete`);
      console.log(`💰 Estimated fee: ${estimatedFee} SOL`);
      console.log(`⚡ Compute units: ${simulation.value.unitsConsumed || computeUnits}`);
      
      return {
        optimizedTransaction: burnTx,
        estimatedFee,
        computeUnits: simulation.value.unitsConsumed || computeUnits,
        priorityFee,
        simulation: simulation.value
      };
      
    } catch (error) {
      console.error('❌ Burn-to-vote optimization failed:', error);
      throw error;
    }
  }

  /**
   * Optimize clan treasury operations
   */
  async optimizeClanOperation(operation, options = {}) {
    const {
      operationType = 'general',
      memberCount = 1,
      urgency = false
    } = options;
    
    try {
      console.log(`🏰 Optimizing clan operation: ${operationType}`);
      
      // Determine compute units based on operation type
      let baseComputeUnits = GAS_OPTIMIZATION_CONFIG.COMPUTE_UNITS.DEFAULT_CLAN_OP;
      
      switch (operationType) {
        case 'treasury_transfer':
          baseComputeUnits = 20_000;
          break;
        case 'member_invite':
          baseComputeUnits = 15_000 * memberCount;
          break;
        case 'role_update':
          baseComputeUnits = 12_000 * memberCount;
          break;
        case 'clan_battle':
          baseComputeUnits = 25_000;
          break;
        default:
          baseComputeUnits = 15_000;
      }
      
      const priority = urgency ? TRANSACTION_PRIORITIES.GAMING : TRANSACTION_PRIORITIES.NORMAL;
      
      return await this.optimizeTransaction(operation, {
        priority,
        gamingContext: 'clan',
        computeUnits: baseComputeUnits
      });
      
    } catch (error) {
      console.error('❌ Clan operation optimization failed:', error);
      throw error;
    }
  }

  /**
   * Get current network state and congestion level
   */
  async getNetworkState() {
    const cacheKey = 'network_state';
    const cachedState = this.congestionCache.get(cacheKey);
    
    if (cachedState && Date.now() - cachedState.timestamp < 10_000) {
      return cachedState.data;
    }
    
    try {
      // Get recent performance samples
      const perfSamples = await this.connection.getRecentPerformanceSamples(5);
      
      // Calculate average slot time and congestion metrics
      let totalSlots = 0;
      let totalTransactions = 0;
      
      perfSamples.forEach(sample => {
        totalSlots += sample.numSlots;
        totalTransactions += sample.numTransactions;
      });
      
      const avgTransactionsPerSlot = totalTransactions / totalSlots;
      const congestionLevel = this.calculateCongestionLevel(avgTransactionsPerSlot);
      
      // Get current slot and epoch info
      const slot = await this.connection.getSlot('confirmed');
      const epochInfo = await this.connection.getEpochInfo('confirmed');
      
      // Get recent block hash for fee estimation
      const { blockhash, feeCalculator } = await this.connection.getRecentBlockhash('confirmed');
      
      const networkState = {
        congestionLevel,
        avgTransactionsPerSlot,
        currentSlot: slot,
        epochInfo,
        blockhash,
        feeCalculator,
        timestamp: Date.now()
      };
      
      // Cache the result
      this.congestionCache.set(cacheKey, {
        data: networkState,
        timestamp: Date.now()
      });
      
      return networkState;
      
    } catch (error) {
      console.warn('⚠️ Failed to get network state:', error);
      
      // Return default state
      return {
        congestionLevel: CONGESTION_LEVELS.MEDIUM,
        avgTransactionsPerSlot: 10_000,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Calculate congestion level based on network metrics
   */
  calculateCongestionLevel(transactionsPerSlot) {
    const thresholds = GAS_OPTIMIZATION_CONFIG.CONGESTION_THRESHOLDS;
    
    if (transactionsPerSlot <= thresholds.LOW) {
      return CONGESTION_LEVELS.LOW;
    } else if (transactionsPerSlot <= thresholds.MEDIUM) {
      return CONGESTION_LEVELS.MEDIUM;
    } else if (transactionsPerSlot <= thresholds.HIGH) {
      return CONGESTION_LEVELS.HIGH;
    } else {
      return CONGESTION_LEVELS.EXTREME;
    }
  }

  /**
   * Calculate optimal compute units for a transaction
   */
  calculateOptimalComputeUnits(analysis, networkState) {
    const baseUnits = analysis.estimatedComputeUnits || GAS_OPTIMIZATION_CONFIG.COMPUTE_UNITS.DEFAULT_VOTE;
    let adjustedUnits = baseUnits;
    
    // Adjust based on network congestion
    switch (networkState.congestionLevel) {
      case CONGESTION_LEVELS.HIGH:
        adjustedUnits *= 1.1;
        break;
      case CONGESTION_LEVELS.EXTREME:
        adjustedUnits *= 1.2;
        break;
    }
    
    // Ensure within limits
    adjustedUnits = Math.max(
      GAS_OPTIMIZATION_CONFIG.COMPUTE_UNITS.MIN_UNITS,
      Math.min(adjustedUnits, GAS_OPTIMIZATION_CONFIG.COMPUTE_UNITS.MAX_UNITS)
    );
    
    return Math.ceil(adjustedUnits);
  }

  /**
   * Calculate optimal priority fee
   */
  async calculateOptimalPriorityFee(priority, networkState, gamingContext) {
    let baseFee = GAS_OPTIMIZATION_CONFIG.PRIORITY_FEES.NORMAL;
    
    // Base priority fee
    switch (priority) {
      case TRANSACTION_PRIORITIES.LOW:
        baseFee = GAS_OPTIMIZATION_CONFIG.PRIORITY_FEES.LOW;
        break;
      case TRANSACTION_PRIORITIES.HIGH:
        baseFee = GAS_OPTIMIZATION_CONFIG.PRIORITY_FEES.HIGH;
        break;
      case TRANSACTION_PRIORITIES.GAMING:
        baseFee = GAS_OPTIMIZATION_CONFIG.PRIORITY_FEES.HIGH;
        break;
      case TRANSACTION_PRIORITIES.COMPETITIVE:
        baseFee = GAS_OPTIMIZATION_CONFIG.PRIORITY_FEES.GAMING_COMPETITIVE;
        break;
      case TRANSACTION_PRIORITIES.TOURNAMENT:
        baseFee = GAS_OPTIMIZATION_CONFIG.PRIORITY_FEES.MAX_GAMING;
        break;
    }
    
    // Adjust for network congestion
    let congestionMultiplier = 1.0;
    switch (networkState.congestionLevel) {
      case CONGESTION_LEVELS.MEDIUM:
        congestionMultiplier = 1.2;
        break;
      case CONGESTION_LEVELS.HIGH:
        congestionMultiplier = 1.5;
        break;
      case CONGESTION_LEVELS.EXTREME:
        congestionMultiplier = 2.0;
        break;
    }
    
    // Adjust for gaming context
    let gamingMultiplier = 1.0;
    if (gamingContext) {
      switch (gamingContext) {
        case 'tournament':
          gamingMultiplier = GAS_OPTIMIZATION_CONFIG.GAMING.TOURNAMENT_MODE_MULTIPLIER;
          break;
        case 'clan_battle':
          gamingMultiplier = GAS_OPTIMIZATION_CONFIG.GAMING.CLAN_BATTLE_MULTIPLIER;
          break;
        case 'voting_rush':
          gamingMultiplier = GAS_OPTIMIZATION_CONFIG.GAMING.VOTING_RUSH_MULTIPLIER;
          break;
      }
    }
    
    const finalFee = Math.ceil(baseFee * congestionMultiplier * gamingMultiplier);
    
    console.log(`💰 Priority fee calculation:`);
    console.log(`  Base: ${baseFee}, Congestion: ${congestionMultiplier}x, Gaming: ${gamingMultiplier}x`);
    console.log(`  Final: ${finalFee} micro-lamports/CU`);
    
    return finalFee;
  }

  /**
   * Analyze transaction complexity
   */
  async analyzeTransaction(transaction) {
    const instructions = transaction.instructions;
    const instructionCount = instructions.length;
    
    // Estimate compute units based on instruction types
    let estimatedComputeUnits = 0;
    let hasTokenOperations = false;
    let hasProgramCalls = false;
    
    instructions.forEach(instruction => {
      // System program instructions
      if (instruction.programId.equals(SystemProgram.programId)) {
        estimatedComputeUnits += 2_000;
      }
      // SPL Token operations
      else if (instruction.programId.equals(new PublicKey(TOKEN_PROGRAM_ID))) {
        estimatedComputeUnits += 5_000;
        hasTokenOperations = true;
      }
      // Associated Token Program
      else if (instruction.programId.equals(new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ID))) {
        estimatedComputeUnits += 3_000;
      }
      // Custom program calls
      else {
        estimatedComputeUnits += 10_000;
        hasProgramCalls = true;
      }
    });
    
    return {
      instructionCount,
      estimatedComputeUnits,
      hasTokenOperations,
      hasProgramCalls,
      complexity: this.calculateComplexityScore(instructionCount, hasTokenOperations, hasProgramCalls)
    };
  }

  /**
   * Calculate transaction complexity score
   */
  calculateComplexityScore(instructionCount, hasTokenOperations, hasProgramCalls) {
    let score = instructionCount;
    
    if (hasTokenOperations) score += 2;
    if (hasProgramCalls) score += 3;
    
    if (score <= 3) return 'low';
    if (score <= 6) return 'medium';
    if (score <= 10) return 'high';
    return 'very_high';
  }

  /**
   * Add compute budget instructions to transaction
   */
  async addComputeBudgetInstructions(transaction, computeUnits, priorityFee) {
    const optimizedTx = new Transaction();
    
    // Add compute budget instructions first
    optimizedTx.add(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: computeUnits
      })
    );
    
    if (priorityFee > 0) {
      optimizedTx.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: priorityFee
        })
      );
    }
    
    // Add original instructions
    transaction.instructions.forEach(instruction => {
      optimizedTx.add(instruction);
    });
    
    return optimizedTx;
  }

  /**
   * Validate fee constraints
   */
  async validateFeeConstraints(transaction, maxFeeRatio, userBalance) {
    try {
      // Simulate transaction to get actual fee
      const simulation = await this.connection.simulateTransaction(transaction, {
        commitment: 'processed'
      });
      
      if (simulation.value.err) {
        return {
          valid: false,
          reason: `Simulation failed: ${JSON.stringify(simulation.value.err)}`
        };
      }
      
      const unitsConsumed = simulation.value.unitsConsumed || 5_000;
      const estimatedFee = (unitsConsumed * 1_000) / LAMPORTS_PER_SOL + 5_000 / LAMPORTS_PER_SOL;
      
      // Check against user balance if provided
      if (userBalance && estimatedFee > userBalance * 0.1) {
        return {
          valid: false,
          reason: 'Fee exceeds 10% of user balance',
          estimatedFee
        };
      }
      
      return {
        valid: true,
        estimatedFee,
        unitsConsumed,
        simulation: simulation.value
      };
      
    } catch (error) {
      return {
        valid: false,
        reason: `Validation error: ${error.message}`
      };
    }
  }

  /**
   * Analyze batch feasibility
   */
  async analyzeBatchFeasibility(transactions) {
    // Check if all transactions have compatible requirements
    const instructionCounts = transactions.map(tx => tx.instructions.length);
    const totalInstructions = instructionCounts.reduce((sum, count) => sum + count, 0);
    
    // Solana has a limit on instruction count per transaction
    if (totalInstructions > 64) {
      return {
        feasible: false,
        reason: `Too many instructions: ${totalInstructions} (max 64)`
      };
    }
    
    // Check if batching would provide meaningful savings
    const estimatedSavings = this.estimateBatchSavings(transactions.length);
    if (estimatedSavings < GAS_OPTIMIZATION_CONFIG.BATCHING.MIN_BATCH_SAVINGS) {
      return {
        feasible: false,
        reason: `Insufficient savings: ${estimatedSavings * 100}% (min ${GAS_OPTIMIZATION_CONFIG.BATCHING.MIN_BATCH_SAVINGS * 100}%)`
      };
    }
    
    return {
      feasible: true,
      estimatedSavings,
      totalInstructions
    };
  }

  /**
   * Estimate batch savings percentage
   */
  estimateBatchSavings(transactionCount) {
    // Base savings from reduced signature costs
    const baseSavings = (transactionCount - 1) * 5_000 / LAMPORTS_PER_SOL;
    
    // Additional savings from compute unit optimization
    const computeSavings = transactionCount * 0.05; // 5% per transaction
    
    return Math.min(baseSavings + computeSavings, 0.5); // Cap at 50%
  }

  /**
   * Create batch transaction from multiple transactions
   */
  async createBatchTransaction(transactions, options = {}) {
    const batchTx = new Transaction();
    
    // Combine all instructions from all transactions
    transactions.forEach(tx => {
      tx.instructions.forEach(instruction => {
        batchTx.add(instruction);
      });
    });
    
    return batchTx;
  }

  /**
   * Estimate individual transaction costs
   */
  async estimateIndividualTransactionCosts(transactions) {
    let totalCost = 0;
    const individualCosts = [];
    
    for (const tx of transactions) {
      try {
        const simulation = await this.connection.simulateTransaction(tx, {
          commitment: 'processed'
        });
        
        const units = simulation.value.unitsConsumed || 5_000;
        const cost = (units * 1_000 + 5_000) / LAMPORTS_PER_SOL;
        
        individualCosts.push(cost);
        totalCost += cost;
        
      } catch (error) {
        // Use default estimate if simulation fails
        const defaultCost = 10_000 / LAMPORTS_PER_SOL;
        individualCosts.push(defaultCost);
        totalCost += defaultCost;
      }
    }
    
    return {
      individual: individualCosts,
      total: totalCost
    };
  }

  /**
   * Start network monitoring for dynamic optimizations
   */
  startNetworkMonitoring() {
    // Monitor network conditions every 30 seconds
    setInterval(async () => {
      try {
        await this.updateNetworkMetrics();
      } catch (error) {
        console.warn('⚠️ Network monitoring failed:', error);
      }
    }, 30_000);
    
    console.log('📊 Network monitoring started');
  }

  /**
   * Update network performance metrics
   */
  async updateNetworkMetrics() {
    const networkState = await this.getNetworkState();
    
    // Store metrics for trending analysis
    const metricsKey = `metrics_${Date.now()}`;
    this.performanceMetrics.set(metricsKey, {
      congestion: networkState.congestionLevel,
      transactionsPerSlot: networkState.avgTransactionsPerSlot,
      timestamp: Date.now()
    });
    
    // Clean up old metrics (keep last hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [key, metrics] of this.performanceMetrics) {
      if (metrics.timestamp < oneHourAgo) {
        this.performanceMetrics.delete(key);
      }
    }
    
    // Log congestion changes
    const previousState = this.congestionCache.get('network_state')?.data;
    if (previousState && previousState.congestionLevel !== networkState.congestionLevel) {
      console.log(`🌐 Network congestion changed: ${previousState.congestionLevel} → ${networkState.congestionLevel}`);
    }
  }

  /**
   * Track optimization metrics
   */
  trackOptimizationMetrics(analysis, networkState, optimizationTime) {
    const metrics = {
      complexity: analysis.complexity,
      congestion: networkState.congestionLevel,
      optimizationTime,
      timestamp: Date.now()
    };
    
    this.performanceMetrics.set(`opt_${Date.now()}`, metrics);
    
    // Analytics integration
    if (window.MLGAnalytics && window.MLGAnalytics.trackEvent) {
      window.MLGAnalytics.trackEvent('gas_optimization', metrics);
    }
  }

  /**
   * Get optimization statistics
   */
  getOptimizationStats() {
    const allMetrics = Array.from(this.performanceMetrics.values());
    const optimizationMetrics = allMetrics.filter(m => m.optimizationTime);
    
    if (optimizationMetrics.length === 0) {
      return null;
    }
    
    const avgOptimizationTime = optimizationMetrics.reduce((sum, m) => sum + m.optimizationTime, 0) / optimizationMetrics.length;
    
    const complexityDistribution = optimizationMetrics.reduce((dist, m) => {
      dist[m.complexity] = (dist[m.complexity] || 0) + 1;
      return dist;
    }, {});
    
    return {
      totalOptimizations: optimizationMetrics.length,
      avgOptimizationTime: Math.round(avgOptimizationTime),
      complexityDistribution,
      networkState: this.congestionCache.get('network_state')?.data
    };
  }

  /**
   * Gaming-specific: Optimize tournament batch voting
   */
  async optimizeTournamentVoting(votes, tournamentContext) {
    const {
      urgency = true,
      expectedParticipants = 100,
      votingDeadline = null
    } = tournamentContext;
    
    try {
      console.log(`🏆 Optimizing tournament voting for ${votes.length} votes`);
      
      // Use maximum priority for tournaments
      const priority = TRANSACTION_PRIORITIES.TOURNAMENT;
      const gamingContext = 'tournament';
      
      // Check if we can batch efficiently
      if (votes.length > 1 && votes.length <= GAS_OPTIMIZATION_CONFIG.BATCHING.MAX_VOTE_BATCH) {
        return await this.batchTransactions(votes, {
          priority,
          gamingContext,
          maxBatchSize: GAS_OPTIMIZATION_CONFIG.BATCHING.MAX_VOTE_BATCH
        });
      } else {
        // Optimize individual transaction with tournament priority
        return await this.optimizeTransaction(votes[0], {
          priority,
          gamingContext,
          maxFeeRatio: 0.1 // Allow higher fees for tournaments
        });
      }
      
    } catch (error) {
      console.error('❌ Tournament voting optimization failed:', error);
      throw error;
    }
  }

  /**
   * Get fee estimation for user transparency
   */
  async estimateTransactionFee(transaction, priority = TRANSACTION_PRIORITIES.NORMAL) {
    try {
      const networkState = await this.getNetworkState();
      const analysis = await this.analyzeTransaction(transaction);
      
      const computeUnits = this.calculateOptimalComputeUnits(analysis, networkState);
      const priorityFee = await this.calculateOptimalPriorityFee(priority, networkState);
      
      // Base transaction fee (5000 lamports)
      const baseFee = 5_000 / LAMPORTS_PER_SOL;
      
      // Compute unit fee
      const computeFee = (computeUnits * priorityFee) / 1_000_000 / LAMPORTS_PER_SOL;
      
      const totalFee = baseFee + computeFee;
      
      return {
        baseFee,
        computeFee,
        totalFee,
        computeUnits,
        priorityFee,
        networkCongestion: networkState.congestionLevel
      };
      
    } catch (error) {
      console.error('❌ Fee estimation failed:', error);
      return {
        baseFee: 5_000 / LAMPORTS_PER_SOL,
        computeFee: 10_000 / LAMPORTS_PER_SOL,
        totalFee: 15_000 / LAMPORTS_PER_SOL,
        error: error.message
      };
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Clear caches
    this.feeCache.clear();
    this.congestionCache.clear();
    this.batchQueue.clear();
    this.performanceMetrics.clear();
    
    // Clear timers
    this.batchTimers.forEach(timer => clearTimeout(timer));
    this.batchTimers.clear();
    
    console.log('🧹 Solana Gas Optimizer cleaned up');
  }
}

/**
 * Global gas optimizer instance
 */
let gasOptimizerInstance = null;

/**
 * Get or create gas optimizer instance
 */
export function getGasOptimizer(connection = null, options = {}) {
  if (!gasOptimizerInstance) {
    gasOptimizerInstance = new SolanaGasOptimizer(connection, options);
  }
  return gasOptimizerInstance;
}

/**
 * Initialize gas optimizer
 */
export async function initializeGasOptimizer(options = {}) {
  try {
    const optimizer = getGasOptimizer(null, options);
    
    // Perform initial network state check
    await optimizer.getNetworkState();
    
    // Make available globally
    window.MLGGasOptimizer = optimizer;
    
    console.log('✅ Solana Gas Optimizer ready globally');
    return optimizer;
    
  } catch (error) {
    console.error('❌ Failed to initialize gas optimizer:', error);
    throw error;
  }
}

export default SolanaGasOptimizer;