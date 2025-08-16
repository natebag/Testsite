/**
 * Gas Optimization Integration System
 * 
 * Main integration module that coordinates all gas optimization components
 * for seamless integration with the MLG.clan gaming platform.
 * 
 * Features:
 * - Unified initialization of all gas optimization components
 * - Integration with existing wallet and voting systems
 * - Gaming-specific optimization workflows
 * - Real-time monitoring and analytics
 * - User-friendly interfaces and notifications
 * 
 * @author Claude Code - Solana Web3 Security Architect
 * @version 1.0.0
 */

import { 
  getGasOptimizer, 
  initializeGasOptimizer,
  TRANSACTION_PRIORITIES,
  CONGESTION_LEVELS 
} from './gas-optimization.js';
import { 
  getFeeEstimator, 
  initializeFeeEstimator,
  FEE_CATEGORIES 
} from './fee-estimation.js';
import { 
  getTransactionBatcher, 
  initializeTransactionBatcher,
  BATCH_TYPES,
  BATCH_STATUS 
} from './transaction-batching.js';
import { 
  getGasOptimizationUI, 
  initializeGasOptimizationUI 
} from '../../shared/components/gas-optimization-ui.js';

/**
 * Integration Configuration
 */
export const GAS_INTEGRATION_CONFIG = {
  // System initialization order
  INIT_SEQUENCE: [
    'gasOptimizer',
    'feeEstimator', 
    'transactionBatcher',
    'gasOptimizationUI'
  ],
  
  // Gaming mode mappings
  GAMING_MODES: {
    CASUAL: 'CASUAL',
    COMPETITIVE: 'TOURNAMENT', 
    CLAN_OPERATIONS: 'CLAN_BATTLE',
    VOTING_SESSION: 'VOTING_RUSH'
  },
  
  // Integration points with existing systems
  INTEGRATION_POINTS: {
    VOTING_SYSTEM: 'MLGVotingIntegration',
    WALLET_MANAGER: 'phantomWalletManager',
    API_CLIENT: 'MLGApiClient',
    WEBSOCKET_MANAGER: 'MLGWebSocketManager'
  },
  
  // Monitoring and analytics
  MONITORING: {
    ENABLED: true,
    METRICS_INTERVAL: 30_000, // 30 seconds
    PERFORMANCE_TRACKING: true,
    USER_FEEDBACK_COLLECTION: true
  }
};

/**
 * Main Gas Optimization Integration Manager
 */
export class GasOptimizationIntegration {
  constructor() {
    this.components = {
      gasOptimizer: null,
      feeEstimator: null,
      transactionBatcher: null,
      gasOptimizationUI: null
    };
    
    // Integration state
    this.isInitialized = false;
    this.currentGamingMode = GAS_INTEGRATION_CONFIG.GAMING_MODES.CASUAL;
    this.activeOptimizations = new Map();
    
    // External system references
    this.externalSystems = {
      votingIntegration: null,
      walletManager: null,
      apiClient: null,
      websocketManager: null
    };
    
    // Monitoring
    this.metrics = {
      totalOptimizations: 0,
      totalFeeSavings: 0,
      avgOptimizationTime: 0,
      userSatisfactionScore: 0
    };
    
    this.monitoringInterval = null;
    
    console.log('🚀 Gas Optimization Integration initialized');
  }

  /**
   * Initialize all gas optimization components
   */
  async initialize(options = {}) {
    try {
      console.log('🚀 Initializing Gas Optimization Integration...');
      
      const {
        enableBatching = true,
        enableUI = true,
        gamingMode = 'CASUAL',
        connection = null,
        enableMonitoring = true
      } = options;
      
      // Initialize components in sequence
      for (const componentName of GAS_INTEGRATION_CONFIG.INIT_SEQUENCE) {
        await this.initializeComponent(componentName, {
          enableBatching,
          enableUI,
          connection,
          gamingMode
        });
      }
      
      // Connect to external systems
      await this.connectExternalSystems();
      
      // Set gaming mode
      await this.setGamingMode(gamingMode);
      
      // Start monitoring if enabled
      if (enableMonitoring && GAS_INTEGRATION_CONFIG.MONITORING.ENABLED) {
        this.startMonitoring();
      }
      
      // Setup global event listeners
      this.setupEventListeners();
      
      this.isInitialized = true;
      
      console.log('✅ Gas Optimization Integration initialized successfully');
      
      return {
        success: true,
        components: Object.keys(this.components),
        gamingMode: this.currentGamingMode,
        features: {
          gasOptimization: true,
          feeEstimation: true,
          transactionBatching: enableBatching,
          userInterface: enableUI,
          monitoring: enableMonitoring
        }
      };
      
    } catch (error) {
      console.error('❌ Gas Optimization Integration failed:', error);
      throw new Error(`Integration initialization failed: ${error.message}`);
    }
  }

  /**
   * Initialize individual component
   */
  async initializeComponent(componentName, options) {
    try {
      console.log(`🔧 Initializing ${componentName}...`);
      
      switch (componentName) {
        case 'gasOptimizer':
          this.components.gasOptimizer = await initializeGasOptimizer({
            enableBatching: options.enableBatching,
            gamingMode: options.gamingMode === 'CASUAL'
          });
          break;
          
        case 'feeEstimator':
          this.components.feeEstimator = await initializeFeeEstimator({
            gasOptimizer: this.components.gasOptimizer
          });
          break;
          
        case 'transactionBatcher':
          if (options.enableBatching) {
            this.components.transactionBatcher = await initializeTransactionBatcher({
              gasOptimizer: this.components.gasOptimizer,
              feeEstimator: this.components.feeEstimator,
              gamingMode: options.gamingMode
            });
          }
          break;
          
        case 'gasOptimizationUI':
          if (options.enableUI) {
            this.components.gasOptimizationUI = await initializeGasOptimizationUI();
          }
          break;
          
        default:
          console.warn(`⚠️ Unknown component: ${componentName}`);
      }
      
      console.log(`✅ ${componentName} initialized`);
      
    } catch (error) {
      console.error(`❌ Failed to initialize ${componentName}:`, error);
      throw error;
    }
  }

  /**
   * Connect to external MLG.clan systems
   */
  async connectExternalSystems() {
    try {
      console.log('🔗 Connecting to external systems...');
      
      // Connect to voting integration
      if (window.MLGVotingIntegration) {
        this.externalSystems.votingIntegration = window.MLGVotingIntegration;
        console.log('✅ Connected to MLG Voting Integration');
      }
      
      // Connect to wallet manager
      if (window.phantomWalletManager) {
        this.externalSystems.walletManager = window.phantomWalletManager;
        console.log('✅ Connected to Phantom Wallet Manager');
      }
      
      // Connect to API client
      if (window.MLGApiClient) {
        this.externalSystems.apiClient = window.MLGApiClient;
        console.log('✅ Connected to MLG API Client');
      }
      
      // Connect to WebSocket manager
      if (window.MLGWebSocketManager) {
        this.externalSystems.websocketManager = window.MLGWebSocketManager;
        console.log('✅ Connected to WebSocket Manager');
      }
      
      console.log('🔗 External system connections complete');
      
    } catch (error) {
      console.warn('⚠️ External system connection failed:', error);
    }
  }

  /**
   * Set gaming mode across all components
   */
  async setGamingMode(mode) {
    if (!GAS_INTEGRATION_CONFIG.GAMING_MODES[mode]) {
      throw new Error(`Invalid gaming mode: ${mode}`);
    }
    
    try {
      this.currentGamingMode = mode;
      const batcherMode = GAS_INTEGRATION_CONFIG.GAMING_MODES[mode];
      
      // Update transaction batcher mode
      if (this.components.transactionBatcher) {
        this.components.transactionBatcher.setGamingMode(batcherMode);
      }
      
      // Update gas optimizer settings
      if (this.components.gasOptimizer) {
        this.components.gasOptimizer.options.gamingMode = mode === 'COMPETITIVE';
      }
      
      console.log(`🎮 Gaming mode set to: ${mode} (${batcherMode})`);
      
    } catch (error) {
      console.error('❌ Failed to set gaming mode:', error);
      throw error;
    }
  }

  /**
   * Optimize transaction with integrated workflow
   */
  async optimizeTransaction(transaction, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const optimizationId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    try {
      console.log(`⚡ Starting optimization ${optimizationId}`);
      
      const {
        operationType = 'custom',
        priority = TRANSACTION_PRIORITIES.NORMAL,
        userBalance = null,
        showUI = true,
        enableBatching = this.components.transactionBatcher !== null,
        gamingContext = null
      } = options;
      
      // Store active optimization
      this.activeOptimizations.set(optimizationId, {
        transaction,
        options,
        startTime,
        status: 'processing'
      });
      
      // Step 1: Get fee estimation
      const feeEstimation = await this.components.feeEstimator.estimateCustomTransaction(transaction, {
        priority,
        gamingContext: gamingContext || this.mapGamingContext(),
        userBalance,
        transactionValue: options.transactionValue || 0
      });
      
      // Step 2: Check if batching is beneficial
      let batchRecommendation = null;
      if (enableBatching && this.shouldConsiderBatching(operationType, feeEstimation)) {
        batchRecommendation = await this.evaluateBatchingOption(transaction, options);
      }
      
      // Step 3: Perform gas optimization
      const optimizationResult = await this.components.gasOptimizer.optimizeTransaction(transaction, {
        priority,
        gamingContext: gamingContext || this.mapGamingContext(),
        maxFeeRatio: options.maxFeeRatio || 0.05,
        userBalance
      });
      
      // Step 4: Show UI if requested
      let uiResult = null;
      if (showUI && this.components.gasOptimizationUI) {
        uiResult = await this.showOptimizationUI(feeEstimation, batchRecommendation, options);
      }
      
      // Step 5: Prepare final result
      const result = {
        optimizationId,
        optimizedTransaction: optimizationResult.optimizedTransaction,
        feeEstimation,
        batchRecommendation,
        networkState: optimizationResult.networkState,
        optimizationTime: Date.now() - startTime,
        uiShown: !!uiResult,
        recommendations: this.generateRecommendations(feeEstimation, batchRecommendation, optimizationResult)
      };
      
      // Update active optimization
      const activeOpt = this.activeOptimizations.get(optimizationId);
      activeOpt.status = 'completed';
      activeOpt.result = result;
      
      // Track metrics
      this.trackOptimizationMetrics(result);
      
      console.log(`✅ Optimization ${optimizationId} completed in ${result.optimizationTime}ms`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Optimization ${optimizationId} failed:`, error);
      
      // Update optimization status
      const activeOpt = this.activeOptimizations.get(optimizationId);
      if (activeOpt) {
        activeOpt.status = 'failed';
        activeOpt.error = error.message;
      }
      
      throw new Error(`Transaction optimization failed: ${error.message}`);
    }
  }

  /**
   * Optimize gaming operation (votes, burns, clan ops)
   */
  async optimizeGamingOperation(operationType, operationOptions = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      console.log(`🎮 Optimizing gaming operation: ${operationType}`);
      
      const {
        tokenAmount = 25,
        voteCount = 1,
        priority = this.getDefaultPriorityForOperation(operationType),
        userBalance = null,
        showUI = true,
        urgency = false
      } = operationOptions;
      
      // Get specialized estimation for gaming operation
      const estimation = await this.components.feeEstimator.estimateGamingOperation(operationType, {
        tokenAmount,
        voteCount,
        priority,
        userBalance,
        includePriceFeeds: true
      });
      
      // Check for batching opportunities
      let batchingResult = null;
      if (this.components.transactionBatcher && this.isBatchableOperation(operationType)) {
        batchingResult = await this.evaluateGamingBatch(operationType, operationOptions);
      }
      
      // Show optimization UI
      let uiResult = null;
      if (showUI && this.components.gasOptimizationUI) {
        uiResult = await this.components.gasOptimizationUI.createFeeWidget(operationType, {
          ...operationOptions,
          userBalance,
          showBatchingOption: !!batchingResult,
          showOptimizationTips: true
        });
      }
      
      return {
        operationType,
        estimation,
        batchingResult,
        uiResult,
        recommendations: this.generateGamingRecommendations(operationType, estimation, batchingResult)
      };
      
    } catch (error) {
      console.error(`❌ Gaming operation optimization failed:`, error);
      throw error;
    }
  }

  /**
   * Execute optimized transaction with integrated workflow
   */
  async executeOptimizedTransaction(optimizationResult, executionOptions = {}) {
    try {
      const {
        useRecommendedSettings = true,
        waitForConfirmation = true,
        trackPerformance = true
      } = executionOptions;
      
      console.log(`🚀 Executing optimized transaction ${optimizationResult.optimizationId}`);
      
      const startTime = Date.now();
      
      // Get wallet connection
      const walletManager = this.externalSystems.walletManager;
      if (!walletManager || !walletManager.isConnected()) {
        throw new Error('Wallet not connected');
      }
      
      // Execute transaction
      const signature = await walletManager.sendTransaction(
        optimizationResult.optimizedTransaction,
        {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
          maxRetries: 3
        }
      );
      
      let confirmation = null;
      if (waitForConfirmation) {
        confirmation = await walletManager.confirmTransaction(signature, 'confirmed');
        
        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }
      }
      
      const executionTime = Date.now() - startTime;
      
      // Track actual vs estimated fees
      if (trackPerformance && confirmation) {
        await this.trackExecutionPerformance(optimizationResult, signature, confirmation, executionTime);
      }
      
      // Update optimization status
      const activeOpt = this.activeOptimizations.get(optimizationResult.optimizationId);
      if (activeOpt) {
        activeOpt.status = 'executed';
        activeOpt.signature = signature;
        activeOpt.confirmation = confirmation;
        activeOpt.executionTime = executionTime;
      }
      
      console.log(`✅ Transaction executed: ${signature} (${executionTime}ms)`);
      
      return {
        signature,
        confirmation,
        executionTime,
        optimizationId: optimizationResult.optimizationId
      };
      
    } catch (error) {
      console.error('❌ Transaction execution failed:', error);
      throw error;
    }
  }

  /**
   * Show optimization UI for transaction
   */
  async showOptimizationUI(feeEstimation, batchRecommendation, options = {}) {
    if (!this.components.gasOptimizationUI) {
      return null;
    }
    
    try {
      const uiOptions = {
        targetElement: options.targetElement || null,
        inline: options.inline || false,
        showBatchingOption: !!batchRecommendation,
        showOptimizationTips: true,
        userBalance: options.userBalance
      };
      
      return await this.components.gasOptimizationUI.createFeeWidget('custom_transaction', uiOptions);
      
    } catch (error) {
      console.error('❌ Failed to show optimization UI:', error);
      return null;
    }
  }

  /**
   * Check if operation should consider batching
   */
  shouldConsiderBatching(operationType, feeEstimation) {
    // Consider batching for operations that commonly happen in groups
    const batchableOperations = ['vote', 'burn', 'single_vote_burn', 'multi_vote_burn'];
    
    // Also consider if fees are above medium level
    const feeLevelSuggestsBatching = ['HIGH', 'VERY_HIGH'].includes(feeEstimation.category.level);
    
    return batchableOperations.includes(operationType) || feeLevelSuggestsBatching;
  }

  /**
   * Evaluate batching option for transaction
   */
  async evaluateBatchingOption(transaction, options) {
    if (!this.components.transactionBatcher) {
      return null;
    }
    
    try {
      // This is a simplified evaluation - in practice, you'd check pending transactions
      const batchEstimation = await this.components.feeEstimator.estimateBatchFees([
        { type: options.operationType || 'custom', options }
      ], {
        priority: options.priority
      });
      
      return {
        feasible: batchEstimation.savings.worthBatching,
        estimatedSavings: batchEstimation.savings,
        recommendedBatchSize: Math.min(5, batchEstimation.operationCount + 2)
      };
      
    } catch (error) {
      console.warn('⚠️ Batch evaluation failed:', error);
      return null;
    }
  }

  /**
   * Evaluate batching for gaming operations
   */
  async evaluateGamingBatch(operationType, options) {
    if (!this.isBatchableOperation(operationType)) {
      return null;
    }
    
    // Check current batch queue status
    const batchStats = this.components.transactionBatcher.getBatchStatistics();
    const relevantQueue = this.getRelevantBatchQueue(operationType);
    
    if (batchStats.currentQueues[relevantQueue]?.count > 0) {
      return {
        feasible: true,
        currentQueueSize: batchStats.currentQueues[relevantQueue].count,
        estimatedWaitTime: 2000, // 2 seconds typical wait
        recommendedAction: 'join_batch'
      };
    }
    
    return {
      feasible: true,
      currentQueueSize: 0,
      estimatedWaitTime: 3000, // 3 seconds to build batch
      recommendedAction: 'start_batch'
    };
  }

  /**
   * Check if operation can be batched
   */
  isBatchableOperation(operationType) {
    const batchableOps = [
      'single_vote_burn',
      'multi_vote_burn',
      'free_vote',
      'clan_role_update',
      'leaderboard_update'
    ];
    
    return batchableOps.includes(operationType);
  }

  /**
   * Get relevant batch queue for operation
   */
  getRelevantBatchQueue(operationType) {
    if (operationType.includes('vote')) return BATCH_TYPES.VOTE;
    if (operationType.includes('burn')) return BATCH_TYPES.BURN;
    if (operationType.includes('clan')) return BATCH_TYPES.CLAN_OP;
    return BATCH_TYPES.MIXED;
  }

  /**
   * Get default priority for gaming operation
   */
  getDefaultPriorityForOperation(operationType) {
    const priorityMap = {
      'tournament_entry': TRANSACTION_PRIORITIES.TOURNAMENT,
      'clan_treasury_transfer': TRANSACTION_PRIORITIES.GAMING,
      'single_vote_burn': TRANSACTION_PRIORITIES.NORMAL,
      'multi_vote_burn': TRANSACTION_PRIORITIES.HIGH,
      'free_vote': TRANSACTION_PRIORITIES.LOW
    };
    
    return priorityMap[operationType] || TRANSACTION_PRIORITIES.NORMAL;
  }

  /**
   * Map current gaming mode to context
   */
  mapGamingContext() {
    const contextMap = {
      'CASUAL': null,
      'COMPETITIVE': 'tournament',
      'CLAN_OPERATIONS': 'clan',
      'VOTING_SESSION': 'voting_rush'
    };
    
    return contextMap[this.currentGamingMode] || null;
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations(feeEstimation, batchRecommendation, optimizationResult) {
    const recommendations = [];
    
    // Fee level recommendations
    if (['HIGH', 'VERY_HIGH'].includes(feeEstimation.category.level)) {
      recommendations.push({
        type: 'fee_optimization',
        message: 'Consider waiting for lower network congestion to reduce fees',
        action: 'wait_for_low_congestion',
        priority: 'medium'
      });
    }
    
    // Batching recommendations
    if (batchRecommendation && batchRecommendation.feasible) {
      recommendations.push({
        type: 'batching',
        message: `Batching could save ${batchRecommendation.estimatedSavings.percentage.toFixed(1)}% on fees`,
        action: 'enable_batching',
        priority: 'high'
      });
    }
    
    // Network state recommendations
    if (optimizationResult.networkState.congestionLevel === CONGESTION_LEVELS.EXTREME) {
      recommendations.push({
        type: 'timing',
        message: 'Network is extremely congested - consider delaying non-urgent transactions',
        action: 'delay_transaction',
        priority: 'high'
      });
    }
    
    return recommendations;
  }

  /**
   * Generate gaming-specific recommendations
   */
  generateGamingRecommendations(operationType, estimation, batchingResult) {
    const recommendations = [...estimation.recommendations];
    
    // Gaming-specific recommendations
    if (operationType.includes('tournament') && estimation.category.level === 'HIGH') {
      recommendations.push({
        type: 'gaming',
        message: 'High fees detected for tournament operation - consider maximum priority',
        action: 'increase_priority',
        priority: 'high'
      });
    }
    
    if (batchingResult && batchingResult.feasible) {
      recommendations.push({
        type: 'gaming_batch',
        message: `${batchingResult.currentQueueSize} similar operations queued - join batch to save fees`,
        action: 'join_gaming_batch',
        priority: 'medium'
      });
    }
    
    return recommendations;
  }

  /**
   * Track optimization metrics
   */
  trackOptimizationMetrics(optimizationResult) {
    this.metrics.totalOptimizations++;
    this.metrics.avgOptimizationTime = (
      (this.metrics.avgOptimizationTime * (this.metrics.totalOptimizations - 1)) + optimizationResult.optimizationTime
    ) / this.metrics.totalOptimizations;
    
    console.log(`📊 Optimization metrics updated: ${this.metrics.totalOptimizations} total optimizations`);
  }

  /**
   * Track execution performance against estimates
   */
  async trackExecutionPerformance(optimizationResult, signature, confirmation, executionTime) {
    try {
      // Record actual fee for accuracy tracking
      if (this.components.feeEstimator && confirmation.value.fee) {
        const actualFeeSOL = confirmation.value.fee / 1_000_000_000; // lamports to SOL
        const estimatedFeeSOL = optimizationResult.feeEstimation.fees.totalSOL;
        
        this.components.feeEstimator.recordActualFee(
          optimizationResult.operationType || 'custom',
          estimatedFeeSOL,
          actualFeeSOL
        );
      }
      
      // Track execution metrics
      console.log(`📊 Execution tracked: ${signature} (${executionTime}ms)`);
      
    } catch (error) {
      console.warn('⚠️ Performance tracking failed:', error);
    }
  }

  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    // Listen for wallet connection changes
    window.addEventListener('wallet-connected', () => {
      console.log('🔗 Wallet connected - gas optimization ready');
    });
    
    window.addEventListener('wallet-disconnected', () => {
      console.log('🔌 Wallet disconnected - clearing active optimizations');
      this.activeOptimizations.clear();
    });
    
    // Listen for gaming mode changes
    window.addEventListener('mlg-gaming-mode-change', (event) => {
      this.setGamingMode(event.detail.mode).catch(error => {
        console.error('❌ Failed to update gaming mode:', error);
      });
    });
    
    // Listen for gas optimization confirmations
    window.addEventListener('gas-optimization-confirm', (event) => {
      console.log('✅ Gas optimization confirmed by user:', event.detail);
    });
  }

  /**
   * Start system monitoring
   */
  startMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, GAS_INTEGRATION_CONFIG.MONITORING.METRICS_INTERVAL);
    
    console.log('📊 System monitoring started');
  }

  /**
   * Collect system performance metrics
   */
  collectSystemMetrics() {
    try {
      const gasOptimizerStats = this.components.gasOptimizer?.getOptimizationStats();
      const batcherStats = this.components.transactionBatcher?.getBatchStatistics();
      const feeEstimatorStats = this.components.feeEstimator?.getAccuracyStats();
      
      const systemMetrics = {
        timestamp: Date.now(),
        activeOptimizations: this.activeOptimizations.size,
        gamingMode: this.currentGamingMode,
        gasOptimizer: gasOptimizerStats,
        transactionBatcher: batcherStats,
        feeEstimator: feeEstimatorStats,
        totalMetrics: this.metrics
      };
      
      // Send to analytics if available
      if (window.MLGAnalytics && window.MLGAnalytics.trackSystemMetrics) {
        window.MLGAnalytics.trackSystemMetrics('gas_optimization', systemMetrics);
      }
      
      console.log('📊 System metrics collected:', systemMetrics);
      
    } catch (error) {
      console.warn('⚠️ Metrics collection failed:', error);
    }
  }

  /**
   * Get comprehensive system status
   */
  getSystemStatus() {
    return {
      initialized: this.isInitialized,
      gamingMode: this.currentGamingMode,
      components: Object.fromEntries(
        Object.entries(this.components).map(([name, component]) => [name, !!component])
      ),
      externalSystems: Object.fromEntries(
        Object.entries(this.externalSystems).map(([name, system]) => [name, !!system])
      ),
      activeOptimizations: this.activeOptimizations.size,
      metrics: this.metrics,
      monitoring: !!this.monitoringInterval
    };
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Stop monitoring
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    // Clean up components
    Object.values(this.components).forEach(component => {
      if (component && component.destroy) {
        component.destroy();
      }
    });
    
    // Clear state
    this.activeOptimizations.clear();
    this.externalSystems = {};
    this.components = {};
    
    console.log('🧹 Gas Optimization Integration cleaned up');
  }
}

/**
 * Global integration instance
 */
let gasOptimizationIntegrationInstance = null;

/**
 * Get or create gas optimization integration instance
 */
export function getGasOptimizationIntegration() {
  if (!gasOptimizationIntegrationInstance) {
    gasOptimizationIntegrationInstance = new GasOptimizationIntegration();
  }
  return gasOptimizationIntegrationInstance;
}

/**
 * Initialize complete gas optimization system
 */
export async function initializeGasOptimization(options = {}) {
  try {
    console.log('🚀 Initializing complete Gas Optimization System...');
    
    const integration = getGasOptimizationIntegration();
    const result = await integration.initialize(options);
    
    // Make available globally
    window.MLGGasOptimization = integration;
    window.gasOptimization = integration; // Shorter alias
    
    console.log('✅ Complete Gas Optimization System ready globally');
    
    return {
      integration,
      ...result
    };
    
  } catch (error) {
    console.error('❌ Failed to initialize Gas Optimization System:', error);
    throw error;
  }
}

/**
 * Convenience function to optimize a vote transaction
 */
export async function optimizeVoteTransaction(voteType, tokenAmount, options = {}) {
  const integration = getGasOptimizationIntegration();
  
  return await integration.optimizeGamingOperation(`${voteType}_vote_burn`, {
    tokenAmount,
    voteCount: 1,
    ...options
  });
}

/**
 * Convenience function to optimize clan operation
 */
export async function optimizeClanOperation(operationType, options = {}) {
  const integration = getGasOptimizationIntegration();
  
  return await integration.optimizeGamingOperation(`clan_${operationType}`, options);
}

export {
  TRANSACTION_PRIORITIES,
  CONGESTION_LEVELS,
  FEE_CATEGORIES,
  BATCH_TYPES,
  BATCH_STATUS
};

export default GasOptimizationIntegration;