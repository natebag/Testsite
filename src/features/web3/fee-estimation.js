/**
 * Solana Fee Estimation & Cost Prediction System
 * 
 * Provides accurate, real-time fee estimation for MLG.clan gaming operations
 * with transparent cost breakdowns and user-friendly predictions.
 * 
 * Features:
 * - Real-time fee calculation based on network conditions
 * - Gaming-specific cost predictions (voting, burning, clan ops)
 * - User balance validation and affordability checks
 * - Historical fee tracking and prediction accuracy
 * - Multi-currency display (SOL, USD, MLG tokens)
 * 
 * @author Claude Code - Solana Web3 Security Architect
 * @version 1.0.0
 */

import { 
  Connection, 
  PublicKey, 
  Transaction,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { getGasOptimizer, TRANSACTION_PRIORITIES, CONGESTION_LEVELS } from './gas-optimization.js';
import { createConnection } from '../../../config/environment/solana-config.js';

/**
 * Fee Estimation Configuration
 */
export const FEE_ESTIMATION_CONFIG = {
  // Cache settings
  CACHE_DURATION: 10_000, // 10 seconds
  PREDICTION_ACCURACY_SAMPLES: 50,
  
  // Display preferences
  DISPLAY_CURRENCIES: ['SOL', 'USD', 'MLG'],
  PRECISION: {
    SOL: 6,
    USD: 2,
    MLG: 0
  },
  
  // Fee categories
  FEE_CATEGORIES: {
    VOTE: 'vote',
    BURN: 'burn',
    CLAN: 'clan',
    TREASURY: 'treasury',
    BATCH: 'batch',
    CUSTOM: 'custom'
  },
  
  // Gaming operation base costs (in compute units)
  GAMING_OPERATIONS: {
    free_vote: 3_000,
    single_vote_burn: 8_000,
    multi_vote_burn: 12_000,
    clan_join: 15_000,
    clan_treasury_transfer: 20_000,
    clan_role_update: 10_000,
    tournament_entry: 25_000,
    leaderboard_update: 5_000
  },
  
  // User warning thresholds
  WARNING_THRESHOLDS: {
    HIGH_FEE_PERCENTAGE: 0.05, // 5% of transaction value
    EXPENSIVE_USD: 5.00, // $5 USD
    BALANCE_PERCENTAGE: 0.1 // 10% of user balance
  },
  
  // Price feed settings
  PRICE_FEED: {
    SOL_USD_API: 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
    MLG_SOL_RATE: 0.000001, // Example: 1 MLG = 0.000001 SOL
    CACHE_DURATION: 60_000, // 1 minute
    FALLBACK_SOL_USD: 100 // Fallback if API fails
  }
};

/**
 * Fee Category Definitions
 */
export const FEE_CATEGORIES = {
  VERY_LOW: { range: [0, 0.001], label: 'Very Low', color: '#10b981' },
  LOW: { range: [0.001, 0.005], label: 'Low', color: '#3b82f6' },
  MEDIUM: { range: [0.005, 0.01], label: 'Medium', color: '#f59e0b' },
  HIGH: { range: [0.01, 0.05], label: 'High', color: '#ef4444' },
  VERY_HIGH: { range: [0.05, Infinity], label: 'Very High', color: '#dc2626' }
};

/**
 * Main Fee Estimation Manager
 */
export class SolanaFeeEstimator {
  constructor(connection = null, gasOptimizer = null) {
    this.connection = connection || createConnection();
    this.gasOptimizer = gasOptimizer || getGasOptimizer();
    
    // Caches
    this.feeCache = new Map();
    this.priceCache = new Map();
    this.historicalFees = [];
    
    // State
    this.isInitialized = false;
    
    console.log('💰 Solana Fee Estimator initialized');
  }

  /**
   * Initialize fee estimator
   */
  async initialize() {
    try {
      // Load historical fee data
      await this.loadHistoricalFees();
      
      // Initialize price feeds
      await this.updatePrices();
      
      // Start background price updates
      this.startPriceUpdates();
      
      this.isInitialized = true;
      console.log('✅ Fee Estimator ready');
      
    } catch (error) {
      console.error('❌ Fee Estimator initialization failed:', error);
      throw error;
    }
  }

  /**
   * Estimate fee for a gaming operation
   */
  async estimateGamingOperation(operationType, options = {}) {
    const {
      tokenAmount = 0,
      voteCount = 1,
      memberCount = 1,
      priority = TRANSACTION_PRIORITIES.NORMAL,
      userBalance = null,
      includePriceFeeds = true
    } = options;
    
    try {
      console.log(`💰 Estimating fee for ${operationType}`);
      
      // Get base compute units for operation
      const baseComputeUnits = FEE_ESTIMATION_CONFIG.GAMING_OPERATIONS[operationType] || 10_000;
      
      // Adjust for operation parameters
      let adjustedComputeUnits = baseComputeUnits;
      
      switch (operationType) {
        case 'single_vote_burn':
        case 'multi_vote_burn':
          adjustedComputeUnits = baseComputeUnits * Math.max(1, Math.ceil(voteCount / 5));
          break;
        case 'clan_role_update':
          adjustedComputeUnits = baseComputeUnits * memberCount;
          break;
        case 'tournament_entry':
          adjustedComputeUnits = baseComputeUnits * (1 + Math.log10(Math.max(1, tokenAmount / 100)));
          break;
      }
      
      // Get network state and calculate fees
      const networkState = await this.gasOptimizer.getNetworkState();
      const priorityFee = await this.gasOptimizer.calculateOptimalPriorityFee(
        priority, 
        networkState, 
        this.getGamingContext(operationType)
      );
      
      // Calculate fee components
      const baseFee = 5_000; // lamports
      const computeFee = (adjustedComputeUnits * priorityFee) / 1_000; // micro-lamports to lamports
      const totalLamports = baseFee + computeFee;
      const totalSOL = totalLamports / LAMPORTS_PER_SOL;
      
      // Create estimation result
      const estimation = {
        operation: operationType,
        fees: {
          baseFee: baseFee / LAMPORTS_PER_SOL,
          computeFee: computeFee / LAMPORTS_PER_SOL,
          totalSOL,
          totalLamports
        },
        computeUnits: adjustedComputeUnits,
        priorityFee,
        networkState: {
          congestion: networkState.congestionLevel,
          isHighTraffic: networkState.congestionLevel === CONGESTION_LEVELS.HIGH || networkState.congestionLevel === CONGESTION_LEVELS.EXTREME
        },
        category: this.categorizeFee(totalSOL),
        timestamp: Date.now()
      };
      
      // Add price conversions if requested
      if (includePriceFeeds) {
        const prices = await this.getCurrentPrices();
        estimation.prices = {
          USD: totalSOL * prices.SOL_USD,
          MLG: Math.ceil(totalSOL / FEE_ESTIMATION_CONFIG.PRICE_FEED.MLG_SOL_RATE)
        };
      }
      
      // Add user-specific warnings
      if (userBalance !== null) {
        estimation.warnings = this.generateWarnings(estimation, userBalance, tokenAmount);
      }
      
      // Add recommendations
      estimation.recommendations = this.generateRecommendations(estimation, networkState);
      
      // Cache the result
      this.cacheEstimation(operationType, estimation);
      
      console.log(`💰 Fee estimated: ${totalSOL.toFixed(6)} SOL (${estimation.category.label})`);
      
      return estimation;
      
    } catch (error) {
      console.error('❌ Gaming operation fee estimation failed:', error);
      throw new Error(`Fee estimation failed: ${error.message}`);
    }
  }

  /**
   * Estimate fee for custom transaction
   */
  async estimateCustomTransaction(transaction, options = {}) {
    const {
      priority = TRANSACTION_PRIORITIES.NORMAL,
      gamingContext = null,
      userBalance = null,
      transactionValue = 0
    } = options;
    
    try {
      // Use gas optimizer for detailed analysis
      const optimizationResult = await this.gasOptimizer.optimizeTransaction(transaction, {
        priority,
        gamingContext,
        maxFeeRatio: 1.0, // Allow any fee for estimation
        userBalance
      });
      
      const totalSOL = optimizationResult.fees.estimatedFee;
      
      const estimation = {
        operation: 'custom_transaction',
        fees: {
          baseFee: 5_000 / LAMPORTS_PER_SOL,
          computeFee: totalSOL - (5_000 / LAMPORTS_PER_SOL),
          totalSOL,
          totalLamports: totalSOL * LAMPORTS_PER_SOL
        },
        computeUnits: optimizationResult.fees.unitsConsumed,
        priorityFee: null, // Extracted from optimization
        networkState: {
          congestion: optimizationResult.networkState.congestionLevel,
          isHighTraffic: optimizationResult.networkState.congestionLevel === CONGESTION_LEVELS.HIGH || optimizationResult.networkState.congestionLevel === CONGESTION_LEVELS.EXTREME
        },
        category: this.categorizeFee(totalSOL),
        analysis: optimizationResult.analysis,
        timestamp: Date.now()
      };
      
      // Add price conversions
      const prices = await this.getCurrentPrices();
      estimation.prices = {
        USD: totalSOL * prices.SOL_USD,
        MLG: Math.ceil(totalSOL / FEE_ESTIMATION_CONFIG.PRICE_FEED.MLG_SOL_RATE)
      };
      
      // Add user-specific warnings
      if (userBalance !== null) {
        estimation.warnings = this.generateWarnings(estimation, userBalance, transactionValue);
      }
      
      estimation.recommendations = this.generateRecommendations(estimation, optimizationResult.networkState);
      
      return estimation;
      
    } catch (error) {
      console.error('❌ Custom transaction fee estimation failed:', error);
      throw error;
    }
  }

  /**
   * Estimate batch operation fees with savings calculation
   */
  async estimateBatchFees(operations, options = {}) {
    try {
      console.log(`💰 Estimating batch fees for ${operations.length} operations`);
      
      // Estimate individual fees
      const individualEstimations = [];
      let totalIndividualFee = 0;
      
      for (const operation of operations) {
        const estimation = await this.estimateGamingOperation(operation.type, {
          ...operation.options,
          includePriceFeeds: false // Avoid repeated API calls
        });
        individualEstimations.push(estimation);
        totalIndividualFee += estimation.fees.totalSOL;
      }
      
      // Estimate batch fee (simplified calculation)
      const avgComputeUnits = individualEstimations.reduce((sum, est) => sum + est.computeUnits, 0);
      const batchComputeUnits = avgComputeUnits * 1.1; // 10% overhead for batching
      
      const networkState = await this.gasOptimizer.getNetworkState();
      const priorityFee = await this.gasOptimizer.calculateOptimalPriorityFee(
        options.priority || TRANSACTION_PRIORITIES.NORMAL,
        networkState,
        'batch'
      );
      
      const batchBaseFee = 5_000 / LAMPORTS_PER_SOL; // Single transaction base fee
      const batchComputeFee = (batchComputeUnits * priorityFee) / 1_000 / LAMPORTS_PER_SOL;
      const totalBatchFee = batchBaseFee + batchComputeFee;
      
      // Calculate savings
      const savings = Math.max(0, totalIndividualFee - totalBatchFee);
      const savingsPercentage = (savings / totalIndividualFee) * 100;
      
      const prices = await this.getCurrentPrices();
      
      const batchEstimation = {
        operation: 'batch_operations',
        operationCount: operations.length,
        individual: {
          estimations: individualEstimations,
          totalFee: totalIndividualFee,
          totalUSD: totalIndividualFee * prices.SOL_USD,
          totalMLG: Math.ceil(totalIndividualFee / FEE_ESTIMATION_CONFIG.PRICE_FEED.MLG_SOL_RATE)
        },
        batch: {
          fees: {
            baseFee: batchBaseFee,
            computeFee: batchComputeFee,
            totalSOL: totalBatchFee,
            totalLamports: totalBatchFee * LAMPORTS_PER_SOL
          },
          computeUnits: batchComputeUnits,
          prices: {
            USD: totalBatchFee * prices.SOL_USD,
            MLG: Math.ceil(totalBatchFee / FEE_ESTIMATION_CONFIG.PRICE_FEED.MLG_SOL_RATE)
          }
        },
        savings: {
          amount: savings,
          percentage: savingsPercentage,
          amountUSD: savings * prices.SOL_USD,
          worthBatching: savingsPercentage > 10 // Worth batching if >10% savings
        },
        category: this.categorizeFee(totalBatchFee),
        timestamp: Date.now()
      };
      
      console.log(`💰 Batch estimation complete: ${savingsPercentage.toFixed(1)}% savings`);
      
      return batchEstimation;
      
    } catch (error) {
      console.error('❌ Batch fee estimation failed:', error);
      throw error;
    }
  }

  /**
   * Get gaming context for fee calculation
   */
  getGamingContext(operationType) {
    const contextMap = {
      'tournament_entry': 'tournament',
      'clan_join': 'clan',
      'clan_treasury_transfer': 'clan',
      'clan_role_update': 'clan',
      'single_vote_burn': 'voting',
      'multi_vote_burn': 'voting_rush',
      'leaderboard_update': 'competitive'
    };
    
    return contextMap[operationType] || null;
  }

  /**
   * Categorize fee level
   */
  categorizeFee(feeSOL) {
    for (const [level, config] of Object.entries(FEE_CATEGORIES)) {
      if (feeSOL >= config.range[0] && feeSOL < config.range[1]) {
        return { level, ...config };
      }
    }
    return FEE_CATEGORIES.VERY_HIGH;
  }

  /**
   * Generate user warnings based on fee and balance
   */
  generateWarnings(estimation, userBalance, transactionValue) {
    const warnings = [];
    
    // High fee percentage of balance
    if (estimation.fees.totalSOL > userBalance * FEE_ESTIMATION_CONFIG.WARNING_THRESHOLDS.BALANCE_PERCENTAGE) {
      warnings.push({
        type: 'high_fee_balance',
        message: `Fee is ${((estimation.fees.totalSOL / userBalance) * 100).toFixed(1)}% of your balance`,
        severity: 'warning'
      });
    }
    
    // High fee relative to transaction value
    if (transactionValue > 0 && estimation.fees.totalSOL > transactionValue * FEE_ESTIMATION_CONFIG.WARNING_THRESHOLDS.HIGH_FEE_PERCENTAGE) {
      warnings.push({
        type: 'high_fee_transaction',
        message: `Fee is ${((estimation.fees.totalSOL / transactionValue) * 100).toFixed(1)}% of transaction value`,
        severity: 'warning'
      });
    }
    
    // Expensive in USD terms
    if (estimation.prices && estimation.prices.USD > FEE_ESTIMATION_CONFIG.WARNING_THRESHOLDS.EXPENSIVE_USD) {
      warnings.push({
        type: 'expensive_usd',
        message: `Fee is $${estimation.prices.USD.toFixed(2)} USD`,
        severity: 'info'
      });
    }
    
    // Network congestion warning
    if (estimation.networkState.isHighTraffic) {
      warnings.push({
        type: 'network_congestion',
        message: 'Network is experiencing high traffic - fees may be higher than usual',
        severity: 'info'
      });
    }
    
    return warnings;
  }

  /**
   * Generate recommendations for fee optimization
   */
  generateRecommendations(estimation, networkState) {
    const recommendations = [];
    
    // Network timing recommendations
    if (networkState.congestionLevel === CONGESTION_LEVELS.HIGH || networkState.congestionLevel === CONGESTION_LEVELS.EXTREME) {
      recommendations.push({
        type: 'timing',
        message: 'Consider waiting for lower network congestion to reduce fees',
        action: 'delay_transaction'
      });
    }
    
    // Priority adjustment recommendations
    if (estimation.category.level === 'HIGH' || estimation.category.level === 'VERY_HIGH') {
      recommendations.push({
        type: 'priority',
        message: 'Consider using lower priority to reduce fees if not urgent',
        action: 'reduce_priority'
      });
    }
    
    // Batching recommendations
    if (estimation.operation.includes('vote') || estimation.operation.includes('burn')) {
      recommendations.push({
        type: 'batching',
        message: 'Consider batching multiple votes to save on fees',
        action: 'enable_batching'
      });
    }
    
    return recommendations;
  }

  /**
   * Get current market prices
   */
  async getCurrentPrices() {
    const cacheKey = 'current_prices';
    const cached = this.priceCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < FEE_ESTIMATION_CONFIG.PRICE_FEED.CACHE_DURATION) {
      return cached.data;
    }
    
    try {
      // Fetch SOL/USD price
      const response = await fetch(FEE_ESTIMATION_CONFIG.PRICE_FEED.SOL_USD_API);
      const data = await response.json();
      
      const prices = {
        SOL_USD: data.solana?.usd || FEE_ESTIMATION_CONFIG.PRICE_FEED.FALLBACK_SOL_USD,
        MLG_SOL: FEE_ESTIMATION_CONFIG.PRICE_FEED.MLG_SOL_RATE,
        timestamp: Date.now()
      };
      
      // Cache the result
      this.priceCache.set(cacheKey, {
        data: prices,
        timestamp: Date.now()
      });
      
      return prices;
      
    } catch (error) {
      console.warn('⚠️ Price feed failed, using fallback:', error);
      
      return {
        SOL_USD: FEE_ESTIMATION_CONFIG.PRICE_FEED.FALLBACK_SOL_USD,
        MLG_SOL: FEE_ESTIMATION_CONFIG.PRICE_FEED.MLG_SOL_RATE,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Update prices in background
   */
  startPriceUpdates() {
    setInterval(async () => {
      try {
        await this.getCurrentPrices();
      } catch (error) {
        console.warn('⚠️ Background price update failed:', error);
      }
    }, FEE_ESTIMATION_CONFIG.PRICE_FEED.CACHE_DURATION);
    
    console.log('📈 Price updates started');
  }

  /**
   * Cache estimation for performance
   */
  cacheEstimation(operationType, estimation) {
    const cacheKey = `${operationType}_${estimation.networkState.congestion}`;
    this.feeCache.set(cacheKey, {
      data: estimation,
      timestamp: Date.now()
    });
    
    // Clean old cache entries
    for (const [key, cached] of this.feeCache) {
      if (Date.now() - cached.timestamp > FEE_ESTIMATION_CONFIG.CACHE_DURATION) {
        this.feeCache.delete(key);
      }
    }
  }

  /**
   * Load historical fee data for accuracy tracking
   */
  async loadHistoricalFees() {
    try {
      const stored = localStorage.getItem('mlg_fee_history');
      if (stored) {
        this.historicalFees = JSON.parse(stored);
        console.log(`📊 Loaded ${this.historicalFees.length} historical fee records`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load historical fees:', error);
      this.historicalFees = [];
    }
  }

  /**
   * Record actual fee for accuracy tracking
   */
  recordActualFee(operationType, estimatedFee, actualFee) {
    const record = {
      operation: operationType,
      estimated: estimatedFee,
      actual: actualFee,
      accuracy: Math.abs(1 - (actualFee / estimatedFee)) * 100,
      timestamp: Date.now()
    };
    
    this.historicalFees.push(record);
    
    // Keep only recent records
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
    this.historicalFees = this.historicalFees.filter(r => r.timestamp > cutoff);
    
    // Save to storage
    try {
      localStorage.setItem('mlg_fee_history', JSON.stringify(this.historicalFees.slice(-100)));
    } catch (error) {
      console.warn('⚠️ Failed to save fee history:', error);
    }
    
    console.log(`📊 Fee accuracy: ${(100 - record.accuracy).toFixed(1)}%`);
  }

  /**
   * Get estimation accuracy statistics
   */
  getAccuracyStats() {
    if (this.historicalFees.length === 0) {
      return null;
    }
    
    const recentFees = this.historicalFees.slice(-50);
    const avgAccuracy = recentFees.reduce((sum, record) => sum + (100 - record.accuracy), 0) / recentFees.length;
    
    const accuracyByOperation = recentFees.reduce((acc, record) => {
      if (!acc[record.operation]) {
        acc[record.operation] = [];
      }
      acc[record.operation].push(100 - record.accuracy);
      return acc;
    }, {});
    
    Object.keys(accuracyByOperation).forEach(op => {
      const accuracies = accuracyByOperation[op];
      accuracyByOperation[op] = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
    });
    
    return {
      overallAccuracy: avgAccuracy,
      totalRecords: this.historicalFees.length,
      recentRecords: recentFees.length,
      accuracyByOperation
    };
  }

  /**
   * Format fee for display
   */
  formatFee(estimation, currency = 'SOL') {
    const precision = FEE_ESTIMATION_CONFIG.PRECISION[currency] || 4;
    
    switch (currency) {
      case 'SOL':
        return `${estimation.fees.totalSOL.toFixed(precision)} SOL`;
      case 'USD':
        return estimation.prices ? `$${estimation.prices.USD.toFixed(precision)}` : 'N/A';
      case 'MLG':
        return estimation.prices ? `${estimation.prices.MLG.toLocaleString()} MLG` : 'N/A';
      default:
        return `${estimation.fees.totalSOL.toFixed(precision)} SOL`;
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.feeCache.clear();
    this.priceCache.clear();
    
    console.log('🧹 Fee Estimator cleaned up');
  }
}

/**
 * Global fee estimator instance
 */
let feeEstimatorInstance = null;

/**
 * Get or create fee estimator instance
 */
export function getFeeEstimator(connection = null, gasOptimizer = null) {
  if (!feeEstimatorInstance) {
    feeEstimatorInstance = new SolanaFeeEstimator(connection, gasOptimizer);
  }
  return feeEstimatorInstance;
}

/**
 * Initialize fee estimator
 */
export async function initializeFeeEstimator(options = {}) {
  try {
    const estimator = getFeeEstimator();
    await estimator.initialize();
    
    // Make available globally
    window.MLGFeeEstimator = estimator;
    
    console.log('✅ Fee Estimator ready globally');
    return estimator;
    
  } catch (error) {
    console.error('❌ Failed to initialize fee estimator:', error);
    throw error;
  }
}

export default SolanaFeeEstimator;