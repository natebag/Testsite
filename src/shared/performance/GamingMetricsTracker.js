/**
 * Advanced Gaming Performance Metrics Tracker
 * 
 * Specialized performance tracking for gaming operations including
 * vote latency, leaderboard performance, tournament brackets,
 * Web3 wallet interactions, and clan management operations.
 * 
 * Features:
 * - Vote-to-confirmation latency tracking with MLG burning correlation
 * - Leaderboard refresh performance monitoring with tier analysis
 * - Tournament bracket loading analytics with participant scaling
 * - Web3 wallet interaction performance with transaction type breakdown
 * - Clan management operation timing with operation complexity analysis
 * - Real-time performance correlation with competitive gaming scenarios
 * 
 * @author Claude Code - Analytics Architect
 * @version 1.0.0
 * @created 2025-08-12
 */

import { EventEmitter } from 'events';
import { getPerformanceAnalytics } from './PerformanceAnalytics.js';
import { getGamingOptimizations } from './gamingOptimizations.js';

export class GamingMetricsTracker extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Performance thresholds (in milliseconds)
      thresholds: {
        voteResponse: { excellent: 200, good: 500, poor: 2000 },
        voteConfirmation: { excellent: 1000, good: 3000, poor: 10000 },
        leaderboardLoad: { excellent: 300, good: 800, poor: 3000 },
        leaderboardUpdate: { excellent: 500, good: 1500, poor: 5000 },
        tournamentBracket: { excellent: 600, good: 1200, poor: 4000 },
        walletConnection: { excellent: 800, good: 2000, poor: 8000 },
        walletTransaction: { excellent: 1000, good: 3000, poor: 12000 },
        clanOperation: { excellent: 400, good: 1000, poor: 4000 },
        searchQuery: { excellent: 150, good: 400, poor: 1500 },
        contentLoad: { excellent: 500, good: 1200, poor: 4000 }
      },
      
      // Tracking settings
      enableDetailedTracking: options.enableDetailedTracking !== false,
      enableCorrelationAnalysis: options.enableCorrelationAnalysis !== false,
      enablePredictiveMetrics: options.enablePredictiveMetrics !== false,
      
      // Batching and storage
      batchSize: options.batchSize || 25,
      flushInterval: options.flushInterval || 10000, // 10 seconds
      retentionPeriod: options.retentionPeriod || 86400000, // 24 hours
      
      ...options
    };
    
    // Initialize tracking systems
    this.performanceAnalytics = getPerformanceAnalytics();
    this.gamingOptimizations = getGamingOptimizations();
    
    // Active tracking maps
    this.activeTimings = new Map(); // timingId -> timing data
    this.metricsBatch = [];
    this.correlationData = new Map();
    this.performanceProfiles = new Map(); // user -> performance profile
    
    // Competitive gaming context
    this.competitiveContext = {
      activeTournaments: new Set(),
      highStakesSessions: new Set(),
      performanceCriticalUsers: new Set()
    };
    
    this.logger = options.logger || console;
    
    this.initializeTracking();
  }

  /**
   * Initialize all gaming metrics tracking
   */
  async initializeTracking() {
    try {
      // Start timing infrastructure
      this.initializeTimingSystem();
      
      // Setup competitive context tracking
      this.initializeCompetitiveTracking();
      
      // Start batch processing
      this.startBatchProcessing();
      
      // Initialize correlation analysis
      if (this.config.enableCorrelationAnalysis) {
        this.initializeCorrelationAnalysis();
      }
      
      // Initialize predictive metrics
      if (this.config.enablePredictiveMetrics) {
        this.initializePredictiveMetrics();
      }
      
      this.emit('tracker:initialized');
      this.logger.log('Gaming metrics tracker initialized');
      
    } catch (error) {
      this.logger.error('Failed to initialize gaming metrics tracker:', error);
      throw error;
    }
  }

  /**
   * Initialize timing system for gaming operations
   */
  initializeTimingSystem() {
    // Hook into existing performance analytics for timing coordination
    this.performanceAnalytics.on('gaming_metric:recorded', (metric) => {
      this.handleGamingMetricEvent(metric);
    });
    
    // Listen for gaming optimization events
    this.gamingOptimizations.on('leaderboard:updated', (data) => {
      this.trackLeaderboardUpdate(data);
    });
    
    this.gamingOptimizations.on('votes:aggregated', (data) => {
      this.trackVoteAggregation(data);
    });
  }

  /**
   * Initialize competitive gaming context tracking
   */
  initializeCompetitiveTracking() {
    // Track tournament states
    this.on('tournament:started', (tournamentId) => {
      this.competitiveContext.activeTournaments.add(tournamentId);
      this.adjustPerformanceThresholds('tournament');
    });
    
    this.on('tournament:ended', (tournamentId) => {
      this.competitiveContext.activeTournaments.delete(tournamentId);
      this.resetPerformanceThresholds();
    });
    
    // Track high-stakes sessions (large MLG burns, critical votes)
    this.on('session:high_stakes', (sessionId) => {
      this.competitiveContext.highStakesSessions.add(sessionId);
    });
  }

  /**
   * Vote Response Time Tracking
   */

  /**
   * Start tracking vote response time
   */
  startVoteTracking(voteData) {
    const timingId = `vote_${voteData.contentId || voteData.proposalId}_${Date.now()}`;
    
    const timing = {
      id: timingId,
      type: 'vote_response',
      startTime: performance.now(),
      context: {
        voteType: voteData.voteType,
        targetType: voteData.targetType,
        targetId: voteData.targetId,
        mlgAmount: voteData.mlgAmount || 0,
        userId: voteData.userId,
        isHighStakes: voteData.mlgAmount > 1000,
        competitiveContext: this.getCompetitiveContext()
      },
      phases: {
        uiResponse: null,
        validation: null,
        blockchain: null,
        confirmation: null
      }
    };
    
    this.activeTimings.set(timingId, timing);
    
    // Start UI response timer
    this.performanceAnalytics.startGamingTimer('vote-response', timingId, timing.context);
    
    return timingId;
  }

  /**
   * Mark vote UI response complete
   */
  markVoteUIResponse(timingId) {
    const timing = this.activeTimings.get(timingId);
    if (!timing) return;
    
    timing.phases.uiResponse = performance.now() - timing.startTime;
    
    // If UI response is slow, emit warning
    if (timing.phases.uiResponse > this.config.thresholds.voteResponse.poor) {
      this.emit('performance:warning', {
        type: 'slow_vote_ui',
        timingId,
        duration: timing.phases.uiResponse,
        context: timing.context
      });
    }
  }

  /**
   * Mark vote validation complete
   */
  markVoteValidation(timingId) {
    const timing = this.activeTimings.get(timingId);
    if (!timing) return;
    
    const now = performance.now();
    timing.phases.validation = now - timing.startTime - (timing.phases.uiResponse || 0);
  }

  /**
   * Mark vote blockchain submission complete
   */
  markVoteBlockchain(timingId, transactionHash) {
    const timing = this.activeTimings.get(timingId);
    if (!timing) return;
    
    const now = performance.now();
    const previousPhases = (timing.phases.uiResponse || 0) + (timing.phases.validation || 0);
    timing.phases.blockchain = now - timing.startTime - previousPhases;
    timing.context.transactionHash = transactionHash;
  }

  /**
   * Complete vote tracking
   */
  completeVoteTracking(timingId, success = true, error = null) {
    const timing = this.activeTimings.get(timingId);
    if (!timing) return;
    
    const endTime = performance.now();
    const totalDuration = endTime - timing.startTime;
    
    timing.phases.confirmation = totalDuration - 
      (timing.phases.uiResponse || 0) - 
      (timing.phases.validation || 0) - 
      (timing.phases.blockchain || 0);
    
    timing.endTime = endTime;
    timing.totalDuration = totalDuration;
    timing.success = success;
    timing.error = error;
    
    // End performance analytics timing
    this.performanceAnalytics.endGamingTimer('vote-response', timingId, {
      success,
      error: error?.message,
      phases: timing.phases,
      totalDuration
    });
    
    // Record detailed metrics
    this.recordVoteMetrics(timing);
    
    // Clean up
    this.activeTimings.delete(timingId);
    
    return timing;
  }

  /**
   * Record comprehensive vote metrics
   */
  recordVoteMetrics(timing) {
    const metrics = {
      type: 'vote_performance',
      timingId: timing.id,
      totalDuration: timing.totalDuration,
      success: timing.success,
      context: timing.context,
      phases: timing.phases,
      timestamp: Date.now(),
      
      // Performance categorization
      uiPerformance: this.categorizePerformance(timing.phases.uiResponse, 'voteResponse'),
      overallPerformance: this.categorizePerformance(timing.totalDuration, 'voteConfirmation'),
      
      // Competitive context
      isCompetitive: this.isCompetitiveContext(),
      isHighStakes: timing.context.isHighStakes,
      
      // Correlation factors
      mlgAmount: timing.context.mlgAmount,
      networkConditions: this.getCurrentNetworkConditions(),
      devicePerformance: this.getCurrentDevicePerformance()
    };
    
    this.addToBatch(metrics);
    
    // Update user performance profile
    this.updateUserPerformanceProfile(timing.context.userId, 'vote', metrics);
    
    // Check for performance anomalies
    this.checkPerformanceAnomaly('vote', metrics);
    
    this.emit('vote:performance_recorded', metrics);
  }

  /**
   * Leaderboard Performance Tracking
   */

  /**
   * Start tracking leaderboard load
   */
  startLeaderboardTracking(leaderboardData) {
    const timingId = `leaderboard_${leaderboardData.type}_${Date.now()}`;
    
    const timing = {
      id: timingId,
      type: 'leaderboard_load',
      startTime: performance.now(),
      context: {
        leaderboardType: leaderboardData.type,
        tier: leaderboardData.tier,
        expectedEntryCount: leaderboardData.expectedEntryCount || 100,
        refreshType: leaderboardData.refreshType || 'manual', // manual, auto, realtime
        userId: leaderboardData.userId,
        competitiveContext: this.getCompetitiveContext()
      },
      phases: {
        dataFetch: null,
        processing: null,
        rendering: null
      }
    };
    
    this.activeTimings.set(timingId, timing);
    this.performanceAnalytics.startGamingTimer('leaderboard-render', timingId, timing.context);
    
    return timingId;
  }

  /**
   * Mark leaderboard data fetch complete
   */
  markLeaderboardDataFetch(timingId, entryCount) {
    const timing = this.activeTimings.get(timingId);
    if (!timing) return;
    
    timing.phases.dataFetch = performance.now() - timing.startTime;
    timing.context.actualEntryCount = entryCount;
  }

  /**
   * Mark leaderboard processing complete
   */
  markLeaderboardProcessing(timingId) {
    const timing = this.activeTimings.get(timingId);
    if (!timing) return;
    
    const now = performance.now();
    timing.phases.processing = now - timing.startTime - (timing.phases.dataFetch || 0);
  }

  /**
   * Complete leaderboard tracking
   */
  completeLeaderboardTracking(timingId, success = true, error = null) {
    const timing = this.activeTimings.get(timingId);
    if (!timing) return;
    
    const endTime = performance.now();
    const totalDuration = endTime - timing.startTime;
    
    timing.phases.rendering = totalDuration - 
      (timing.phases.dataFetch || 0) - 
      (timing.phases.processing || 0);
    
    timing.endTime = endTime;
    timing.totalDuration = totalDuration;
    timing.success = success;
    timing.error = error;
    
    this.performanceAnalytics.endGamingTimer('leaderboard-render', timingId, {
      success,
      error: error?.message,
      entryCount: timing.context.actualEntryCount,
      phases: timing.phases
    });
    
    this.recordLeaderboardMetrics(timing);
    this.activeTimings.delete(timingId);
    
    return timing;
  }

  /**
   * Record leaderboard performance metrics
   */
  recordLeaderboardMetrics(timing) {
    const metrics = {
      type: 'leaderboard_performance',
      timingId: timing.id,
      totalDuration: timing.totalDuration,
      success: timing.success,
      context: timing.context,
      phases: timing.phases,
      timestamp: Date.now(),
      
      // Performance analysis
      performance: this.categorizePerformance(timing.totalDuration, 'leaderboardLoad'),
      scalingEfficiency: this.calculateScalingEfficiency(
        timing.context.expectedEntryCount,
        timing.context.actualEntryCount,
        timing.totalDuration
      ),
      
      // Competitive impact
      isCompetitive: this.isCompetitiveContext(),
      competitiveImpact: this.assessCompetitiveImpact(timing.totalDuration, 'leaderboard')
    };
    
    this.addToBatch(metrics);
    this.updateUserPerformanceProfile(timing.context.userId, 'leaderboard', metrics);
    this.emit('leaderboard:performance_recorded', metrics);
  }

  /**
   * Tournament Bracket Performance Tracking
   */

  /**
   * Start tracking tournament bracket loading
   */
  startTournamentTracking(tournamentData) {
    const timingId = `tournament_${tournamentData.tournamentId}_${Date.now()}`;
    
    const timing = {
      id: timingId,
      type: 'tournament_bracket',
      startTime: performance.now(),
      context: {
        tournamentId: tournamentData.tournamentId,
        participantCount: tournamentData.participantCount,
        bracketType: tournamentData.bracketType, // single, double, swiss
        loadType: tournamentData.loadType, // initial, update, refresh
        userId: tournamentData.userId,
        isLive: tournamentData.isLive || false
      },
      phases: {
        bracketCalculation: null,
        dataAssembly: null,
        rendering: null
      }
    };
    
    this.activeTimings.set(timingId, timing);
    this.performanceAnalytics.startGamingTimer('tournament-bracket', timingId, timing.context);
    
    return timingId;
  }

  /**
   * Complete tournament bracket tracking
   */
  completeTournamentTracking(timingId, success = true, error = null) {
    const timing = this.activeTimings.get(timingId);
    if (!timing) return;
    
    const endTime = performance.now();
    timing.endTime = endTime;
    timing.totalDuration = endTime - timing.startTime;
    timing.success = success;
    timing.error = error;
    
    this.performanceAnalytics.endGamingTimer('tournament-bracket', timingId, {
      success,
      participantCount: timing.context.participantCount,
      isLive: timing.context.isLive
    });
    
    this.recordTournamentMetrics(timing);
    this.activeTimings.delete(timingId);
    
    return timing;
  }

  /**
   * Record tournament performance metrics
   */
  recordTournamentMetrics(timing) {
    const metrics = {
      type: 'tournament_performance',
      timingId: timing.id,
      totalDuration: timing.totalDuration,
      success: timing.success,
      context: timing.context,
      timestamp: Date.now(),
      
      performance: this.categorizePerformance(timing.totalDuration, 'tournamentBracket'),
      complexityScore: this.calculateTournamentComplexity(timing.context),
      liveImpact: timing.context.isLive ? 'critical' : 'normal'
    };
    
    this.addToBatch(metrics);
    this.emit('tournament:performance_recorded', metrics);
  }

  /**
   * Web3 Wallet Interaction Tracking
   */

  /**
   * Start tracking wallet interaction
   */
  startWalletTracking(walletData) {
    const timingId = `wallet_${walletData.operation}_${Date.now()}`;
    
    const timing = {
      id: timingId,
      type: 'wallet_interaction',
      startTime: performance.now(),
      context: {
        operation: walletData.operation, // connect, sign, transaction, balance
        walletType: walletData.walletType, // phantom, solflare, etc
        transactionType: walletData.transactionType, // vote, transfer, burn
        amount: walletData.amount,
        userId: walletData.userId,
        isHighValue: walletData.amount > 5000
      },
      phases: {
        walletPrompt: null,
        userAction: null,
        blockchain: null,
        confirmation: null
      }
    };
    
    this.activeTimings.set(timingId, timing);
    this.performanceAnalytics.startGamingTimer('wallet-interaction', timingId, timing.context);
    
    return timingId;
  }

  /**
   * Complete wallet tracking
   */
  completeWalletTracking(timingId, success = true, error = null) {
    const timing = this.activeTimings.get(timingId);
    if (!timing) return;
    
    const endTime = performance.now();
    timing.endTime = endTime;
    timing.totalDuration = endTime - timing.startTime;
    timing.success = success;
    timing.error = error;
    
    this.performanceAnalytics.endGamingTimer('wallet-interaction', timingId, {
      success,
      operation: timing.context.operation,
      walletType: timing.context.walletType
    });
    
    this.recordWalletMetrics(timing);
    this.activeTimings.delete(timingId);
    
    return timing;
  }

  /**
   * Record wallet performance metrics
   */
  recordWalletMetrics(timing) {
    const metrics = {
      type: 'wallet_performance',
      timingId: timing.id,
      totalDuration: timing.totalDuration,
      success: timing.success,
      context: timing.context,
      timestamp: Date.now(),
      
      performance: this.categorizePerformance(timing.totalDuration, 
        timing.context.operation === 'connect' ? 'walletConnection' : 'walletTransaction'),
      operationComplexity: this.calculateWalletComplexity(timing.context),
      userImpact: timing.context.isHighValue ? 'high' : 'normal'
    };
    
    this.addToBatch(metrics);
    this.updateUserPerformanceProfile(timing.context.userId, 'wallet', metrics);
    this.emit('wallet:performance_recorded', metrics);
  }

  /**
   * Clan Management Performance Tracking
   */

  /**
   * Start tracking clan operation
   */
  startClanTracking(clanData) {
    const timingId = `clan_${clanData.operation}_${Date.now()}`;
    
    const timing = {
      id: timingId,
      type: 'clan_management',
      startTime: performance.now(),
      context: {
        operation: clanData.operation, // create, join, leave, invite, kick, promote
        clanId: clanData.clanId,
        clanSize: clanData.clanSize || 0,
        userId: clanData.userId,
        targetUserId: clanData.targetUserId,
        operationComplexity: this.calculateClanOperationComplexity(clanData)
      }
    };
    
    this.activeTimings.set(timingId, timing);
    this.performanceAnalytics.startGamingTimer('clan-management', timingId, timing.context);
    
    return timingId;
  }

  /**
   * Complete clan operation tracking
   */
  completeClanTracking(timingId, success = true, error = null) {
    const timing = this.activeTimings.get(timingId);
    if (!timing) return;
    
    const endTime = performance.now();
    timing.endTime = endTime;
    timing.totalDuration = endTime - timing.startTime;
    timing.success = success;
    timing.error = error;
    
    this.performanceAnalytics.endGamingTimer('clan-management', timingId, {
      success,
      operation: timing.context.operation,
      clanSize: timing.context.clanSize
    });
    
    this.recordClanMetrics(timing);
    this.activeTimings.delete(timingId);
    
    return timing;
  }

  /**
   * Record clan management performance metrics
   */
  recordClanMetrics(timing) {
    const metrics = {
      type: 'clan_performance',
      timingId: timing.id,
      totalDuration: timing.totalDuration,
      success: timing.success,
      context: timing.context,
      timestamp: Date.now(),
      
      performance: this.categorizePerformance(timing.totalDuration, 'clanOperation'),
      scalingImpact: this.assessClanScalingImpact(timing.context.clanSize, timing.totalDuration)
    };
    
    this.addToBatch(metrics);
    this.emit('clan:performance_recorded', metrics);
  }

  /**
   * Performance Analysis and Utilities
   */

  /**
   * Categorize performance level
   */
  categorizePerformance(duration, operationType) {
    const thresholds = this.config.thresholds[operationType];
    if (!thresholds || !duration) return 'unknown';
    
    if (duration <= thresholds.excellent) return 'excellent';
    if (duration <= thresholds.good) return 'good';
    if (duration <= thresholds.poor) return 'needs_improvement';
    return 'poor';
  }

  /**
   * Calculate scaling efficiency
   */
  calculateScalingEfficiency(expectedCount, actualCount, duration) {
    if (!expectedCount || !actualCount || !duration) return 0;
    
    const expectedDuration = expectedCount * 2; // Assume 2ms per entry baseline
    const efficiency = (expectedDuration / duration) * 100;
    
    return Math.min(100, Math.max(0, efficiency));
  }

  /**
   * Calculate tournament complexity score
   */
  calculateTournamentComplexity(context) {
    let complexity = 1;
    
    // Base complexity by participant count
    complexity += Math.log2(context.participantCount || 1);
    
    // Bracket type complexity
    const bracketMultipliers = {
      single: 1,
      double: 1.5,
      swiss: 2,
      roundrobin: 3
    };
    
    complexity *= bracketMultipliers[context.bracketType] || 1;
    
    // Live tournament adds complexity
    if (context.isLive) complexity *= 1.3;
    
    return Math.round(complexity * 100) / 100;
  }

  /**
   * Calculate wallet operation complexity
   */
  calculateWalletComplexity(context) {
    const operationWeights = {
      connect: 1,
      balance: 1.2,
      sign: 1.5,
      transaction: 2,
      burn: 2.5
    };
    
    let complexity = operationWeights[context.operation] || 1;
    
    if (context.isHighValue) complexity *= 1.5;
    if (context.amount > 10000) complexity *= 1.2;
    
    return Math.round(complexity * 100) / 100;
  }

  /**
   * Calculate clan operation complexity
   */
  calculateClanOperationComplexity(clanData) {
    const operationWeights = {
      join: 1,
      leave: 1.2,
      invite: 1.5,
      kick: 1.8,
      promote: 2,
      create: 3
    };
    
    let complexity = operationWeights[clanData.operation] || 1;
    
    // Larger clans add complexity
    if (clanData.clanSize > 50) complexity *= 1.3;
    if (clanData.clanSize > 100) complexity *= 1.5;
    
    return Math.round(complexity * 100) / 100;
  }

  /**
   * Assess competitive impact of performance
   */
  assessCompetitiveImpact(duration, operationType) {
    const thresholds = this.config.thresholds[operationType];
    if (!thresholds) return 'unknown';
    
    if (duration <= thresholds.excellent) return 'none';
    if (duration <= thresholds.good) return 'minimal';
    if (duration <= thresholds.poor) return 'moderate';
    return 'severe';
  }

  /**
   * Assess clan scaling impact
   */
  assessClanScalingImpact(clanSize, duration) {
    const baselinePerMember = 10; // 10ms baseline per clan member
    const expectedDuration = clanSize * baselinePerMember;
    
    if (duration <= expectedDuration) return 'optimal';
    if (duration <= expectedDuration * 1.5) return 'acceptable';
    if (duration <= expectedDuration * 2) return 'poor';
    return 'critical';
  }

  /**
   * Get current competitive context
   */
  getCompetitiveContext() {
    return {
      activeTournaments: this.competitiveContext.activeTournaments.size > 0,
      highStakesSessions: this.competitiveContext.highStakesSessions.size > 0,
      tournamentCount: this.competitiveContext.activeTournaments.size
    };
  }

  /**
   * Check if in competitive context
   */
  isCompetitiveContext() {
    return this.competitiveContext.activeTournaments.size > 0 ||
           this.competitiveContext.highStakesSessions.size > 0;
  }

  /**
   * Data Management and Processing
   */

  /**
   * Add metrics to processing batch
   */
  addToBatch(metrics) {
    this.metricsBatch.push(metrics);
    
    if (this.metricsBatch.length >= this.config.batchSize) {
      this.processBatch();
    }
  }

  /**
   * Start batch processing
   */
  startBatchProcessing() {
    setInterval(() => {
      if (this.metricsBatch.length > 0) {
        this.processBatch();
      }
    }, this.config.flushInterval);
  }

  /**
   * Process metrics batch
   */
  async processBatch() {
    if (this.metricsBatch.length === 0) return;
    
    const batch = [...this.metricsBatch];
    this.metricsBatch = [];
    
    try {
      // Store metrics
      await this.storeMetricsBatch(batch);
      
      // Analyze for patterns
      this.analyzeMetricsBatch(batch);
      
      // Update correlation data
      if (this.config.enableCorrelationAnalysis) {
        this.updateCorrelationData(batch);
      }
      
      this.emit('batch:processed', { count: batch.length });
      
    } catch (error) {
      this.logger.error('Failed to process metrics batch:', error);
      // Re-queue failed metrics
      this.metricsBatch.unshift(...batch);
    }
  }

  /**
   * Store metrics batch
   */
  async storeMetricsBatch(batch) {
    // Implementation would store to local storage or send to analytics service
    const key = `gaming_metrics_batch_${Date.now()}`;
    try {
      localStorage.setItem(key, JSON.stringify(batch));
    } catch (error) {
      this.logger.warn('Failed to store metrics batch locally:', error);
    }
  }

  /**
   * Analyze metrics batch for patterns and anomalies
   */
  analyzeMetricsBatch(batch) {
    // Group metrics by type
    const metricsByType = new Map();
    
    batch.forEach(metric => {
      if (!metricsByType.has(metric.type)) {
        metricsByType.set(metric.type, []);
      }
      metricsByType.get(metric.type).push(metric);
    });
    
    // Analyze each type for trends
    metricsByType.forEach((metrics, type) => {
      this.analyzeMetricTypePatterns(type, metrics);
    });
  }

  /**
   * Analyze patterns for specific metric type
   */
  analyzeMetricTypePatterns(type, metrics) {
    if (metrics.length < 3) return; // Need minimum data for analysis
    
    // Calculate performance distribution
    const durations = metrics.map(m => m.totalDuration).filter(Boolean);
    if (durations.length === 0) return;
    
    const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const p95 = this.calculatePercentile(durations, 95);
    
    // Check for performance degradation
    const recentMetrics = metrics.slice(-5);
    const recentAvg = recentMetrics.reduce((sum, m) => sum + (m.totalDuration || 0), 0) / recentMetrics.length;
    
    if (recentAvg > avg * 1.5) {
      this.emit('performance:degradation_detected', {
        type,
        avgIncrease: ((recentAvg - avg) / avg) * 100,
        recentAvg,
        historicalAvg: avg,
        timestamp: Date.now()
      });
    }
    
    // Emit pattern analysis
    this.emit('pattern:analyzed', {
      type,
      count: metrics.length,
      avgDuration: Math.round(avg),
      p95Duration: Math.round(p95),
      performanceDistribution: this.calculatePerformanceDistribution(metrics)
    });
  }

  /**
   * Calculate performance distribution
   */
  calculatePerformanceDistribution(metrics) {
    const distribution = {
      excellent: 0,
      good: 0,
      needs_improvement: 0,
      poor: 0
    };
    
    metrics.forEach(metric => {
      const perf = metric.performance || 'unknown';
      if (distribution.hasOwnProperty(perf)) {
        distribution[perf]++;
      }
    });
    
    return distribution;
  }

  /**
   * Calculate percentile from array of numbers
   */
  calculatePercentile(numbers, percentile) {
    const sorted = numbers.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * Update user performance profile
   */
  updateUserPerformanceProfile(userId, operationType, metrics) {
    if (!userId) return;
    
    if (!this.performanceProfiles.has(userId)) {
      this.performanceProfiles.set(userId, {
        userId,
        operations: new Map(),
        overallScore: 100,
        lastUpdated: Date.now()
      });
    }
    
    const profile = this.performanceProfiles.get(userId);
    
    if (!profile.operations.has(operationType)) {
      profile.operations.set(operationType, {
        count: 0,
        avgDuration: 0,
        successRate: 100,
        recentPerformance: []
      });
    }
    
    const opProfile = profile.operations.get(operationType);
    opProfile.count++;
    opProfile.avgDuration = (opProfile.avgDuration * (opProfile.count - 1) + metrics.totalDuration) / opProfile.count;
    opProfile.successRate = (opProfile.successRate * (opProfile.count - 1) + (metrics.success ? 100 : 0)) / opProfile.count;
    
    // Keep recent performance history
    opProfile.recentPerformance.push({
      duration: metrics.totalDuration,
      performance: metrics.performance,
      timestamp: metrics.timestamp
    });
    
    if (opProfile.recentPerformance.length > 10) {
      opProfile.recentPerformance.shift();
    }
    
    profile.lastUpdated = Date.now();
  }

  /**
   * Check for performance anomalies
   */
  checkPerformanceAnomaly(operationType, metrics) {
    // Check against user's historical performance
    const userId = metrics.context?.userId;
    if (userId) {
      const profile = this.performanceProfiles.get(userId);
      if (profile && profile.operations.has(operationType)) {
        const opProfile = profile.operations.get(operationType);
        if (metrics.totalDuration > opProfile.avgDuration * 3) {
          this.emit('anomaly:detected', {
            type: 'user_performance_anomaly',
            userId,
            operationType,
            currentDuration: metrics.totalDuration,
            avgDuration: opProfile.avgDuration,
            deviationFactor: metrics.totalDuration / opProfile.avgDuration,
            timestamp: Date.now()
          });
        }
      }
    }
  }

  /**
   * Initialize correlation analysis
   */
  initializeCorrelationAnalysis() {
    // Analyze correlations between performance and various factors
    setInterval(() => {
      this.analyzePerformanceCorrelations();
    }, 60000); // Every minute
  }

  /**
   * Analyze performance correlations
   */
  analyzePerformanceCorrelations() {
    // Correlate with network conditions, device performance, time of day, etc.
    const correlations = {
      networkLatency: this.analyzeNetworkCorrelation(),
      deviceMemory: this.analyzeDeviceCorrelation(),
      timeOfDay: this.analyzeTimeCorrelation(),
      competitiveContext: this.analyzeCompetitiveCorrelation()
    };
    
    this.emit('correlations:analyzed', correlations);
  }

  /**
   * Network condition correlation analysis
   */
  analyzeNetworkCorrelation() {
    // Implementation would analyze correlation between network conditions and performance
    return { correlation: 0.7, impact: 'high' };
  }

  /**
   * Device performance correlation analysis
   */
  analyzeDeviceCorrelation() {
    // Implementation would analyze correlation between device specs and performance
    return { correlation: 0.6, impact: 'medium' };
  }

  /**
   * Time of day correlation analysis
   */
  analyzeTimeCorrelation() {
    // Implementation would analyze performance patterns by time
    return { correlation: 0.4, impact: 'low' };
  }

  /**
   * Competitive context correlation analysis
   */
  analyzeCompetitiveCorrelation() {
    // Implementation would analyze impact of competitive scenarios on performance
    return { correlation: 0.8, impact: 'high' };
  }

  /**
   * Initialize predictive metrics
   */
  initializePredictiveMetrics() {
    // Setup predictive performance modeling
    setInterval(() => {
      this.updatePredictiveModels();
    }, 300000); // Every 5 minutes
  }

  /**
   * Update predictive performance models
   */
  updatePredictiveModels() {
    // Implementation would update ML models for performance prediction
    this.emit('predictive:models_updated');
  }

  /**
   * Get current network conditions
   */
  getCurrentNetworkConditions() {
    if (navigator.connection) {
      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      };
    }
    return {};
  }

  /**
   * Get current device performance indicators
   */
  getCurrentDevicePerformance() {
    return {
      memory: navigator.deviceMemory,
      cores: navigator.hardwareConcurrency,
      pixelRatio: window.devicePixelRatio
    };
  }

  /**
   * Adjust performance thresholds for competitive scenarios
   */
  adjustPerformanceThresholds(scenario) {
    if (scenario === 'tournament') {
      // Tighten thresholds during tournaments
      Object.keys(this.config.thresholds).forEach(key => {
        const threshold = this.config.thresholds[key];
        threshold.excellent = Math.round(threshold.excellent * 0.8);
        threshold.good = Math.round(threshold.good * 0.9);
      });
    }
  }

  /**
   * Reset performance thresholds to default
   */
  resetPerformanceThresholds() {
    // Reset to original thresholds
    // Implementation would restore original threshold values
  }

  /**
   * Handle gaming metric events from performance analytics
   */
  handleGamingMetricEvent(metric) {
    // Process gaming metric events for additional analysis
    this.emit('gaming_metric:processed', metric);
  }

  /**
   * Track leaderboard updates
   */
  trackLeaderboardUpdate(data) {
    const metrics = {
      type: 'leaderboard_update_system',
      duration: data.duration,
      tiers: data.tiers,
      timestamp: data.timestamp,
      performance: this.categorizePerformance(data.duration, 'leaderboardUpdate'),
      systemGenerated: true
    };
    
    this.addToBatch(metrics);
  }

  /**
   * Track vote aggregation performance
   */
  trackVoteAggregation(data) {
    const metrics = {
      type: 'vote_aggregation_system',
      duration: data.duration,
      batches: data.batches,
      timestamp: data.timestamp,
      performance: this.categorizePerformance(data.duration, 'voteResponse'),
      systemGenerated: true
    };
    
    this.addToBatch(metrics);
  }

  /**
   * Public API methods
   */

  /**
   * Get performance summary for specific operation type
   */
  getOperationPerformanceSummary(operationType, timeframe = 'hour') {
    // Implementation would return performance summary
    return {
      operationType,
      timeframe,
      summary: 'Performance summary data'
    };
  }

  /**
   * Get user performance profile
   */
  getUserPerformanceProfile(userId) {
    return this.performanceProfiles.get(userId) || null;
  }

  /**
   * Get competitive context status
   */
  getCompetitiveStatus() {
    return {
      ...this.competitiveContext,
      isCompetitive: this.isCompetitiveContext()
    };
  }

  /**
   * Shutdown tracker
   */
  shutdown() {
    // Process remaining metrics
    if (this.metricsBatch.length > 0) {
      this.processBatch();
    }
    
    this.emit('tracker:shutdown');
    this.removeAllListeners();
  }
}

// Create singleton instance
let globalGamingMetricsTracker = null;

export function createGamingMetricsTracker(options = {}) {
  return new GamingMetricsTracker(options);
}

export function getGamingMetricsTracker(options = {}) {
  if (!globalGamingMetricsTracker) {
    globalGamingMetricsTracker = new GamingMetricsTracker(options);
  }
  return globalGamingMetricsTracker;
}

export default GamingMetricsTracker;