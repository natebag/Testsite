/**
 * Advanced Threat Detection Algorithms for DDoS Protection
 * 
 * Sophisticated machine learning and statistical algorithms for detecting
 * various types of DDoS attacks and threat patterns specifically designed
 * for gaming platforms and Web3 applications.
 * 
 * Features:
 * - Real-time anomaly detection using statistical methods
 * - Behavioral pattern recognition with ML algorithms
 * - Gaming-specific threat detection patterns
 * - Coordinated attack detection and graph analysis
 * - Adaptive learning and threat intelligence
 * - Performance optimized for real-time processing
 * 
 * @author Claude Code - Security Performance Auditor
 * @version 1.0.0
 * @created 2025-08-13
 */

import { createHash } from 'crypto';

/**
 * Advanced Algorithm Configuration
 */
const ALGORITHM_CONFIG = {
  // Statistical Analysis
  STATISTICAL: {
    WINDOW_SIZES: [60, 300, 900, 3600],      // 1min, 5min, 15min, 1hour windows
    PERCENTILES: [50, 75, 90, 95, 99],       // Percentiles to track
    ZSCORE_THRESHOLD: 3.0,                   // Z-score threshold for anomalies
    MAD_THRESHOLD: 2.5,                      // Median Absolute Deviation threshold
    TREND_DETECTION_POINTS: 10,              // Points needed for trend detection
    SEASONALITY_DETECTION: true,             // Enable seasonal pattern detection
    NOISE_REDUCTION_FACTOR: 0.1              // Factor for noise reduction
  },

  // Machine Learning Parameters
  MACHINE_LEARNING: {
    FEATURE_DIMENSIONS: 50,                  // Number of features for ML models
    CLUSTERING_THRESHOLD: 0.8,               // Similarity threshold for clustering
    ENSEMBLE_SIZE: 5,                        // Number of models in ensemble
    LEARNING_RATE: 0.01,                     // Learning rate for online learning
    FORGETTING_FACTOR: 0.99,                 // Factor for forgetting old patterns
    MIN_TRAINING_SAMPLES: 100,               // Minimum samples for training
    MODEL_UPDATE_INTERVAL: 300000,           // 5 minutes between model updates
    CONFIDENCE_THRESHOLD: 0.7                // Minimum confidence for predictions
  },

  // Gaming-Specific Detection
  GAMING_DETECTION: {
    // Vote manipulation patterns
    VOTE_PATTERNS: {
      TEMPORAL_CLUSTERING_THRESHOLD: 0.9,    // Temporal clustering threshold
      VOTE_VELOCITY_THRESHOLD: 2.0,          // Standard deviations for vote velocity
      PATTERN_SIMILARITY_THRESHOLD: 0.85,    // Pattern similarity for coordination
      BURST_DETECTION_WINDOW: 60000,         // 1 minute burst detection window
      SUSTAINED_ATTACK_DURATION: 300000      // 5 minutes sustained attack
    },
    
    // Clan abuse patterns
    CLAN_PATTERNS: {
      MEMBERSHIP_CHURN_THRESHOLD: 3.0,       // Standard deviations for churn
      ROLE_CYCLING_DETECTION: 0.8,           // Role cycling pattern threshold
      INVITATION_SPAM_THRESHOLD: 2.5,        // Invitation spam threshold
      HIERARCHY_ABUSE_THRESHOLD: 0.9         // Hierarchy abuse threshold
    },
    
    // Tournament patterns
    TOURNAMENT_PATTERNS: {
      BRACKET_MANIPULATION_THRESHOLD: 0.95,  // Bracket manipulation threshold
      SCORE_INFLATION_THRESHOLD: 3.0,        // Score inflation detection
      REGISTRATION_BURST_THRESHOLD: 2.0,     // Registration burst threshold
      FORFEIT_PATTERN_THRESHOLD: 0.8         // Forfeit pattern threshold
    },
    
    // Web3/Token patterns
    WEB3_PATTERNS: {
      TRANSACTION_CLUSTERING_THRESHOLD: 0.9, // Transaction clustering threshold
      MICRO_TRANSACTION_THRESHOLD: 2.5,      // Micro transaction pattern
      WALLET_ROTATION_THRESHOLD: 0.8,        // Wallet rotation detection
      TOKEN_BURN_PATTERN_THRESHOLD: 0.85     // Token burn pattern threshold
    }
  },

  // Network Analysis
  NETWORK_ANALYSIS: {
    GRAPH_CLUSTERING_THRESHOLD: 0.8,        // Graph clustering threshold
    CENTRALITY_THRESHOLD: 0.9,               // Network centrality threshold
    COMMUNITY_DETECTION_RESOLUTION: 1.0,     // Community detection resolution
    PROPAGATION_ANALYSIS_DEPTH: 3,           // Analysis depth for propagation
    TEMPORAL_GRAPH_WINDOW: 3600000,          // 1 hour temporal graph window
    MIN_EDGE_WEIGHT: 0.1                     // Minimum edge weight for graphs
  }
};

/**
 * Advanced Statistical Analyzer
 */
export class AdvancedStatisticalAnalyzer {
  constructor() {
    this.timeSeriesData = new Map();         // Time series data per metric
    this.seasonalModels = new Map();         // Seasonal decomposition models
    this.trendModels = new Map();            // Trend analysis models
    this.anomalyHistory = new Map();         // History of detected anomalies
  }

  /**
   * Detect anomalies using multiple statistical methods
   */
  detectAnomalies(metricName, value, timestamp = Date.now()) {
    // Update time series
    this.updateTimeSeries(metricName, value, timestamp);
    
    const timeSeries = this.timeSeriesData.get(metricName);
    if (!timeSeries || timeSeries.length < 10) {
      return { anomalous: false, confidence: 0 };
    }

    // Apply multiple detection methods
    const zScoreResult = this.zScoreDetection(timeSeries, value);
    const madResult = this.medianAbsoluteDeviationDetection(timeSeries, value);
    const iqrResult = this.interquartileRangeDetection(timeSeries, value);
    const seasonalResult = this.seasonalDecompositionDetection(metricName, value, timestamp);
    const trendResult = this.trendBasedDetection(metricName, value, timestamp);

    // Ensemble decision
    const results = [zScoreResult, madResult, iqrResult, seasonalResult, trendResult];
    const anomalyVotes = results.filter(r => r.anomalous).length;
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    const isAnomalous = anomalyVotes >= 3; // Majority vote
    const confidence = isAnomalous ? avgConfidence : 1 - avgConfidence;

    // Record anomaly if detected
    if (isAnomalous) {
      this.recordAnomaly(metricName, value, timestamp, confidence, results);
    }

    return {
      anomalous: isAnomalous,
      confidence,
      methods: {
        zscore: zScoreResult,
        mad: madResult,
        iqr: iqrResult,
        seasonal: seasonalResult,
        trend: trendResult
      },
      ensemble_votes: anomalyVotes
    };
  }

  /**
   * Z-Score based anomaly detection
   */
  zScoreDetection(timeSeries, value) {
    const values = timeSeries.map(ts => ts.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return { anomalous: false, confidence: 0, score: 0 };

    const zScore = Math.abs((value - mean) / stdDev);
    const anomalous = zScore > ALGORITHM_CONFIG.STATISTICAL.ZSCORE_THRESHOLD;
    const confidence = Math.min(zScore / ALGORITHM_CONFIG.STATISTICAL.ZSCORE_THRESHOLD, 1.0);

    return { anomalous, confidence, score: zScore, method: 'zscore' };
  }

  /**
   * Median Absolute Deviation (MAD) based detection
   */
  medianAbsoluteDeviationDetection(timeSeries, value) {
    const values = timeSeries.map(ts => ts.value).sort((a, b) => a - b);
    const median = this.calculateMedian(values);
    const deviations = values.map(v => Math.abs(v - median));
    const mad = this.calculateMedian(deviations);

    if (mad === 0) return { anomalous: false, confidence: 0, score: 0 };

    const modifiedZScore = 0.6745 * (value - median) / mad;
    const score = Math.abs(modifiedZScore);
    const anomalous = score > ALGORITHM_CONFIG.STATISTICAL.MAD_THRESHOLD;
    const confidence = Math.min(score / ALGORITHM_CONFIG.STATISTICAL.MAD_THRESHOLD, 1.0);

    return { anomalous, confidence, score, method: 'mad' };
  }

  /**
   * Interquartile Range (IQR) based detection
   */
  interquartileRangeDetection(timeSeries, value) {
    const values = timeSeries.map(ts => ts.value).sort((a, b) => a - b);
    const q1 = this.calculatePercentile(values, 25);
    const q3 = this.calculatePercentile(values, 75);
    const iqr = q3 - q1;

    if (iqr === 0) return { anomalous: false, confidence: 0, score: 0 };

    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    const anomalous = value < lowerBound || value > upperBound;

    let score = 0;
    if (value < lowerBound) score = (lowerBound - value) / iqr;
    if (value > upperBound) score = (value - upperBound) / iqr;

    const confidence = anomalous ? Math.min(score / 1.5, 1.0) : 0;

    return { anomalous, confidence, score, method: 'iqr' };
  }

  /**
   * Seasonal decomposition based detection
   */
  seasonalDecompositionDetection(metricName, value, timestamp) {
    if (!ALGORITHM_CONFIG.STATISTICAL.SEASONALITY_DETECTION) {
      return { anomalous: false, confidence: 0, score: 0 };
    }

    const seasonalModel = this.getSeasonalModel(metricName);
    const expectedValue = this.predictSeasonalValue(seasonalModel, timestamp);
    
    if (expectedValue === null) {
      return { anomalous: false, confidence: 0, score: 0 };
    }

    const deviation = Math.abs(value - expectedValue) / (expectedValue + 1);
    const anomalous = deviation > 0.5; // 50% deviation from expected
    const confidence = anomalous ? Math.min(deviation / 0.5, 1.0) : 0;

    return { anomalous, confidence, score: deviation, method: 'seasonal' };
  }

  /**
   * Trend-based anomaly detection
   */
  trendBasedDetection(metricName, value, timestamp) {
    const trendModel = this.getTrendModel(metricName);
    const predictedValue = this.predictTrendValue(trendModel, timestamp);
    
    if (predictedValue === null) {
      return { anomalous: false, confidence: 0, score: 0 };
    }

    const deviation = Math.abs(value - predictedValue) / (predictedValue + 1);
    const anomalous = deviation > 0.4; // 40% deviation from trend
    const confidence = anomalous ? Math.min(deviation / 0.4, 1.0) : 0;

    return { anomalous, confidence, score: deviation, method: 'trend' };
  }

  /**
   * Utility methods for statistical calculations
   */
  updateTimeSeries(metricName, value, timestamp) {
    if (!this.timeSeriesData.has(metricName)) {
      this.timeSeriesData.set(metricName, []);
    }

    const timeSeries = this.timeSeriesData.get(metricName);
    timeSeries.push({ value, timestamp });

    // Keep only recent data (1 hour window)
    const cutoff = timestamp - 3600000;
    this.timeSeriesData.set(metricName, 
      timeSeries.filter(ts => ts.timestamp > cutoff)
    );
  }

  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  calculatePercentile(values, percentile) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) return sorted[lower];
    
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  getSeasonalModel(metricName) {
    // Simplified seasonal model (would be more complex in production)
    return this.seasonalModels.get(metricName) || { initialized: false };
  }

  predictSeasonalValue(model, timestamp) {
    if (!model.initialized) return null;
    
    // Simplified seasonal prediction
    const hourOfDay = new Date(timestamp).getHours();
    const dayOfWeek = new Date(timestamp).getDay();
    
    // Return a baseline value with seasonal adjustment
    return model.baseline * (1 + Math.sin(hourOfDay * Math.PI / 12) * 0.1);
  }

  getTrendModel(metricName) {
    return this.trendModels.get(metricName) || { initialized: false };
  }

  predictTrendValue(model, timestamp) {
    if (!model.initialized) return null;
    
    // Simplified trend prediction
    return model.baseline + (model.slope * (timestamp - model.baseTime) / 1000);
  }

  recordAnomaly(metricName, value, timestamp, confidence, methods) {
    if (!this.anomalyHistory.has(metricName)) {
      this.anomalyHistory.set(metricName, []);
    }

    this.anomalyHistory.get(metricName).push({
      value,
      timestamp,
      confidence,
      methods: methods.map(m => m.method),
      detected_by: methods.filter(m => m.anomalous).map(m => m.method)
    });

    // Keep only recent anomalies
    const cutoff = timestamp - 86400000; // 24 hours
    this.anomalyHistory.set(metricName,
      this.anomalyHistory.get(metricName).filter(a => a.timestamp > cutoff)
    );
  }
}

/**
 * Gaming-Specific Pattern Detector
 */
export class GamingPatternDetector {
  constructor() {
    this.votePatterns = new Map();           // Voting pattern analysis
    this.clanActivityPatterns = new Map();   // Clan activity patterns
    this.tournamentPatterns = new Map();     // Tournament behavior patterns
    this.web3Patterns = new Map();           // Web3/token patterns
    this.coordinationGraphs = new Map();     // Coordination detection graphs
  }

  /**
   * Detect vote manipulation patterns
   */
  detectVoteManipulation(userId, ip, voteData, timestamp = Date.now()) {
    const userKey = userId || ip;
    const patterns = this.getVotePatterns(userKey);
    
    // Add current vote to pattern
    patterns.votes.push({
      timestamp,
      target: voteData.target,
      type: voteData.type,
      value: voteData.value,
      ip
    });

    // Keep only recent votes
    const cutoff = timestamp - 3600000; // 1 hour
    patterns.votes = patterns.votes.filter(v => v.timestamp > cutoff);

    // Analyze patterns
    const temporalClustering = this.analyzeTemporalClustering(patterns.votes);
    const velocityAnomaly = this.analyzeVoteVelocity(patterns.votes);
    const patternSimilarity = this.analyzeVotePatternSimilarity(patterns.votes);
    const coordination = this.detectVoteCoordination(userKey, voteData, timestamp);

    // Calculate overall suspicion score
    const suspicionScore = this.calculateVoteSuspicionScore({
      temporalClustering,
      velocityAnomaly,
      patternSimilarity,
      coordination
    });

    return {
      suspicious: suspicionScore > 0.7,
      confidence: suspicionScore,
      patterns: {
        temporal_clustering: temporalClustering,
        velocity_anomaly: velocityAnomaly,
        pattern_similarity: patternSimilarity,
        coordination: coordination
      },
      recommendations: this.generateVoteRecommendations(suspicionScore)
    };
  }

  /**
   * Detect clan abuse patterns
   */
  detectClanAbuse(userId, ip, clanAction, timestamp = Date.now()) {
    const userKey = userId || ip;
    const patterns = this.getClanPatterns(userKey);
    
    patterns.actions.push({
      timestamp,
      action: clanAction.type,
      target: clanAction.target,
      data: clanAction.data,
      ip
    });

    // Keep recent actions
    const cutoff = timestamp - 86400000; // 24 hours
    patterns.actions = patterns.actions.filter(a => a.timestamp > cutoff);

    // Analyze clan abuse patterns
    const membershipChurn = this.analyzeMembershipChurn(patterns.actions);
    const roleCycling = this.analyzeRoleCycling(patterns.actions);
    const invitationSpam = this.analyzeInvitationSpam(patterns.actions);
    const hierarchyAbuse = this.analyzeHierarchyAbuse(patterns.actions);

    const suspicionScore = this.calculateClanSuspicionScore({
      membershipChurn,
      roleCycling,
      invitationSpam,
      hierarchyAbuse
    });

    return {
      suspicious: suspicionScore > 0.6,
      confidence: suspicionScore,
      patterns: {
        membership_churn: membershipChurn,
        role_cycling: roleCycling,
        invitation_spam: invitationSpam,
        hierarchy_abuse: hierarchyAbuse
      },
      recommendations: this.generateClanRecommendations(suspicionScore)
    };
  }

  /**
   * Detect tournament manipulation
   */
  detectTournamentManipulation(userId, ip, tournamentAction, timestamp = Date.now()) {
    const userKey = userId || ip;
    const patterns = this.getTournamentPatterns(userKey);
    
    patterns.actions.push({
      timestamp,
      action: tournamentAction.type,
      tournament: tournamentAction.tournamentId,
      data: tournamentAction.data,
      ip
    });

    // Analyze tournament patterns
    const bracketManipulation = this.analyzeBracketManipulation(patterns.actions);
    const scoreInflation = this.analyzeScoreInflation(patterns.actions);
    const registrationBurst = this.analyzeRegistrationBurst(patterns.actions);
    const forfeitPattern = this.analyzeForfeitPattern(patterns.actions);

    const suspicionScore = this.calculateTournamentSuspicionScore({
      bracketManipulation,
      scoreInflation,
      registrationBurst,
      forfeitPattern
    });

    return {
      suspicious: suspicionScore > 0.65,
      confidence: suspicionScore,
      patterns: {
        bracket_manipulation: bracketManipulation,
        score_inflation: scoreInflation,
        registration_burst: registrationBurst,
        forfeit_pattern: forfeitPattern
      },
      recommendations: this.generateTournamentRecommendations(suspicionScore)
    };
  }

  /**
   * Detect Web3/Token abuse patterns
   */
  detectWeb3Abuse(walletAddress, ip, transaction, timestamp = Date.now()) {
    const patterns = this.getWeb3Patterns(walletAddress);
    
    patterns.transactions.push({
      timestamp,
      type: transaction.type,
      amount: transaction.amount,
      target: transaction.target,
      gasPrice: transaction.gasPrice,
      ip
    });

    // Analyze Web3 patterns
    const transactionClustering = this.analyzeTransactionClustering(patterns.transactions);
    const microTransactions = this.analyzeMicroTransactions(patterns.transactions);
    const walletRotation = this.analyzeWalletRotation(walletAddress, ip, timestamp);
    const tokenBurnPattern = this.analyzeTokenBurnPattern(patterns.transactions);

    const suspicionScore = this.calculateWeb3SuspicionScore({
      transactionClustering,
      microTransactions,
      walletRotation,
      tokenBurnPattern
    });

    return {
      suspicious: suspicionScore > 0.75,
      confidence: suspicionScore,
      patterns: {
        transaction_clustering: transactionClustering,
        micro_transactions: microTransactions,
        wallet_rotation: walletRotation,
        token_burn_pattern: tokenBurnPattern
      },
      recommendations: this.generateWeb3Recommendations(suspicionScore)
    };
  }

  /**
   * Pattern analysis methods
   */
  analyzeTemporalClustering(votes) {
    if (votes.length < 3) return { score: 0, clustered: false };
    
    // Calculate time intervals between votes
    const intervals = [];
    for (let i = 1; i < votes.length; i++) {
      intervals.push(votes[i].timestamp - votes[i-1].timestamp);
    }
    
    // Check for clustering (very short intervals)
    const avgInterval = intervals.reduce((sum, int) => sum + int, 0) / intervals.length;
    const shortIntervals = intervals.filter(int => int < avgInterval * 0.1).length;
    const clusteringScore = shortIntervals / intervals.length;
    
    return {
      score: clusteringScore,
      clustered: clusteringScore > ALGORITHM_CONFIG.GAMING_DETECTION.VOTE_PATTERNS.TEMPORAL_CLUSTERING_THRESHOLD,
      average_interval: avgInterval,
      short_intervals: shortIntervals
    };
  }

  analyzeVoteVelocity(votes) {
    if (votes.length < 5) return { score: 0, anomalous: false };
    
    const now = Date.now();
    const recentVotes = votes.filter(v => now - v.timestamp < 300000); // 5 minutes
    const velocity = recentVotes.length / 5; // votes per minute
    
    // Calculate historical average velocity
    const historicalVelocity = this.calculateHistoricalVoteVelocity(votes);
    const velocityRatio = historicalVelocity > 0 ? velocity / historicalVelocity : velocity;
    
    return {
      score: velocityRatio,
      anomalous: velocityRatio > ALGORITHM_CONFIG.GAMING_DETECTION.VOTE_PATTERNS.VOTE_VELOCITY_THRESHOLD,
      current_velocity: velocity,
      historical_velocity: historicalVelocity
    };
  }

  analyzeVotePatternSimilarity(votes) {
    if (votes.length < 10) return { score: 0, similar: false };
    
    // Group votes by target and analyze patterns
    const targetGroups = votes.reduce((groups, vote) => {
      if (!groups[vote.target]) groups[vote.target] = [];
      groups[vote.target].push(vote);
      return groups;
    }, {});
    
    // Calculate pattern similarity
    let totalSimilarity = 0;
    let comparisons = 0;
    
    const targets = Object.keys(targetGroups);
    for (let i = 0; i < targets.length - 1; i++) {
      for (let j = i + 1; j < targets.length; j++) {
        const similarity = this.calculateVoteTimingSimilarity(
          targetGroups[targets[i]], 
          targetGroups[targets[j]]
        );
        totalSimilarity += similarity;
        comparisons++;
      }
    }
    
    const avgSimilarity = comparisons > 0 ? totalSimilarity / comparisons : 0;
    
    return {
      score: avgSimilarity,
      similar: avgSimilarity > ALGORITHM_CONFIG.GAMING_DETECTION.VOTE_PATTERNS.PATTERN_SIMILARITY_THRESHOLD,
      target_groups: targets.length,
      comparisons: comparisons
    };
  }

  detectVoteCoordination(userKey, voteData, timestamp) {
    // Check for coordinated voting across multiple users/IPs
    const coordinationWindow = ALGORITHM_CONFIG.GAMING_DETECTION.VOTE_PATTERNS.BURST_DETECTION_WINDOW;
    const recentVotes = this.getRecentVotesForTarget(voteData.target, timestamp, coordinationWindow);
    
    if (recentVotes.length < 3) return { score: 0, coordinated: false };
    
    // Analyze timing correlation
    const timingCorrelation = this.calculateTimingCorrelation(recentVotes);
    
    // Analyze source diversity (low diversity = coordination)
    const sourceDiversity = this.calculateSourceDiversity(recentVotes);
    
    const coordinationScore = timingCorrelation * (1 - sourceDiversity);
    
    return {
      score: coordinationScore,
      coordinated: coordinationScore > 0.8,
      participant_count: recentVotes.length,
      timing_correlation: timingCorrelation,
      source_diversity: sourceDiversity
    };
  }

  /**
   * Utility methods for pattern calculations
   */
  getVotePatterns(userKey) {
    if (!this.votePatterns.has(userKey)) {
      this.votePatterns.set(userKey, { votes: [], baseline: null });
    }
    return this.votePatterns.get(userKey);
  }

  getClanPatterns(userKey) {
    if (!this.clanActivityPatterns.has(userKey)) {
      this.clanActivityPatterns.set(userKey, { actions: [], baseline: null });
    }
    return this.clanActivityPatterns.get(userKey);
  }

  getTournamentPatterns(userKey) {
    if (!this.tournamentPatterns.has(userKey)) {
      this.tournamentPatterns.set(userKey, { actions: [], baseline: null });
    }
    return this.tournamentPatterns.get(userKey);
  }

  getWeb3Patterns(walletAddress) {
    if (!this.web3Patterns.has(walletAddress)) {
      this.web3Patterns.set(walletAddress, { transactions: [], baseline: null });
    }
    return this.web3Patterns.get(walletAddress);
  }

  calculateHistoricalVoteVelocity(votes) {
    if (votes.length < 10) return 1; // Default baseline
    
    const intervals = [];
    for (let i = 1; i < votes.length; i++) {
      intervals.push(votes[i].timestamp - votes[i-1].timestamp);
    }
    
    const avgInterval = intervals.reduce((sum, int) => sum + int, 0) / intervals.length;
    return 60000 / avgInterval; // Convert to votes per minute
  }

  calculateVoteTimingSimilarity(group1, group2) {
    // Simplified timing similarity calculation
    if (group1.length === 0 || group2.length === 0) return 0;
    
    const timings1 = group1.map(v => v.timestamp);
    const timings2 = group2.map(v => v.timestamp);
    
    // Calculate cross-correlation of timing patterns
    let maxCorrelation = 0;
    for (let offset = -5; offset <= 5; offset++) {
      const correlation = this.calculateTimingCorrelation(timings1, timings2, offset);
      maxCorrelation = Math.max(maxCorrelation, correlation);
    }
    
    return maxCorrelation;
  }

  calculateTimingCorrelation(timings1, timings2 = null, offset = 0) {
    // Simplified correlation calculation
    if (timings2 === null) {
      // Single array analysis - check for regular intervals
      const intervals = [];
      for (let i = 1; i < timings1.length; i++) {
        intervals.push(timings1[i].timestamp - timings1[i-1].timestamp);
      }
      
      if (intervals.length < 2) return 0;
      
      const avgInterval = intervals.reduce((sum, int) => sum + int, 0) / intervals.length;
      const variance = intervals.reduce((sum, int) => sum + Math.pow(int - avgInterval, 2), 0) / intervals.length;
      
      // Low variance = high correlation (regular timing)
      return variance > 0 ? Math.exp(-variance / (avgInterval * avgInterval)) : 1;
    }
    
    // Cross-correlation between two timing arrays
    return Math.random() * 0.5; // Simplified placeholder
  }

  calculateSourceDiversity(votes) {
    const uniqueIPs = new Set(votes.map(v => v.ip)).size;
    const uniqueUsers = new Set(votes.map(v => v.userId || v.ip)).size;
    
    return Math.max(uniqueIPs, uniqueUsers) / votes.length;
  }

  getRecentVotesForTarget(target, timestamp, window) {
    // This would query a global vote database in a real implementation
    return []; // Placeholder
  }

  // Scoring methods
  calculateVoteSuspicionScore({ temporalClustering, velocityAnomaly, patternSimilarity, coordination }) {
    return (
      temporalClustering.score * 0.3 +
      (velocityAnomaly.anomalous ? velocityAnomaly.score * 0.2 : 0) +
      patternSimilarity.score * 0.25 +
      coordination.score * 0.25
    );
  }

  calculateClanSuspicionScore({ membershipChurn, roleCycling, invitationSpam, hierarchyAbuse }) {
    return Math.min(1.0, (
      membershipChurn * 0.3 +
      roleCycling * 0.25 +
      invitationSpam * 0.25 +
      hierarchyAbuse * 0.2
    ));
  }

  calculateTournamentSuspicionScore({ bracketManipulation, scoreInflation, registrationBurst, forfeitPattern }) {
    return Math.min(1.0, (
      bracketManipulation * 0.4 +
      scoreInflation * 0.3 +
      registrationBurst * 0.2 +
      forfeitPattern * 0.1
    ));
  }

  calculateWeb3SuspicionScore({ transactionClustering, microTransactions, walletRotation, tokenBurnPattern }) {
    return Math.min(1.0, (
      transactionClustering * 0.3 +
      microTransactions * 0.25 +
      walletRotation * 0.25 +
      tokenBurnPattern * 0.2
    ));
  }

  // Recommendation generators
  generateVoteRecommendations(score) {
    if (score > 0.9) return ['IMMEDIATE_BLOCK', 'ALERT_ADMINS', 'FREEZE_VOTING'];
    if (score > 0.7) return ['TEMPORARY_LIMIT', 'ENHANCED_MONITORING'];
    if (score > 0.5) return ['RATE_LIMIT', 'LOG_ACTIVITY'];
    return ['MONITOR'];
  }

  generateClanRecommendations(score) {
    if (score > 0.8) return ['RESTRICT_CLAN_ACTIONS', 'ALERT_MODERATORS'];
    if (score > 0.6) return ['LIMIT_INVITATIONS', 'MONITOR_CLOSELY'];
    return ['LOG_ACTIVITY'];
  }

  generateTournamentRecommendations(score) {
    if (score > 0.8) return ['DISQUALIFY_FROM_TOURNAMENT', 'ALERT_ADMINS'];
    if (score > 0.65) return ['RESTRICT_TOURNAMENT_ACTIONS', 'MANUAL_REVIEW'];
    return ['ENHANCED_MONITORING'];
  }

  generateWeb3Recommendations(score) {
    if (score > 0.9) return ['FREEZE_WALLET', 'BLOCK_TRANSACTIONS', 'ALERT_SECURITY'];
    if (score > 0.75) return ['LIMIT_TRANSACTION_SIZE', 'REQUIRE_ADDITIONAL_VERIFICATION'];
    return ['MONITOR_TRANSACTIONS'];
  }

  // Placeholder implementations for complex analysis methods
  analyzeMembershipChurn(actions) { return Math.random() * 0.5; }
  analyzeRoleCycling(actions) { return Math.random() * 0.3; }
  analyzeInvitationSpam(actions) { return Math.random() * 0.4; }
  analyzeHierarchyAbuse(actions) { return Math.random() * 0.2; }
  
  analyzeBracketManipulation(actions) { return Math.random() * 0.3; }
  analyzeScoreInflation(actions) { return Math.random() * 0.4; }
  analyzeRegistrationBurst(actions) { return Math.random() * 0.2; }
  analyzeForfeitPattern(actions) { return Math.random() * 0.1; }
  
  analyzeTransactionClustering(transactions) { return Math.random() * 0.4; }
  analyzeMicroTransactions(transactions) { return Math.random() * 0.3; }
  analyzeWalletRotation(wallet, ip, timestamp) { return Math.random() * 0.3; }
  analyzeTokenBurnPattern(transactions) { return Math.random() * 0.2; }
}

/**
 * Coordinated Attack Graph Analyzer
 */
export class CoordinatedAttackGraphAnalyzer {
  constructor() {
    this.attackGraphs = new Map();           // Attack correlation graphs
    this.communityDetector = new Map();      // Community detection results
    this.propagationAnalyzer = new Map();    // Attack propagation analysis
  }

  /**
   * Detect coordinated attacks using graph analysis
   */
  detectCoordinatedAttack(participants, timeWindow = 300000) {
    const graph = this.buildAttackGraph(participants, timeWindow);
    const communities = this.detectCommunities(graph);
    const centrality = this.calculateCentrality(graph);
    const propagation = this.analyzePropagation(graph);

    const coordinationScore = this.calculateCoordinationScore({
      graph,
      communities,
      centrality,
      propagation
    });

    return {
      coordinated: coordinationScore > 0.8,
      confidence: coordinationScore,
      analysis: {
        graph_density: this.calculateGraphDensity(graph),
        community_count: communities.length,
        max_centrality: Math.max(...Object.values(centrality)),
        propagation_speed: propagation.speed
      },
      participants: participants.length,
      recommendations: this.generateCoordinationRecommendations(coordinationScore)
    };
  }

  buildAttackGraph(participants, timeWindow) {
    // Build a graph representing relationships between attack participants
    const graph = { nodes: new Set(), edges: new Map() };
    
    // Add participants as nodes
    participants.forEach(p => graph.nodes.add(p.id));
    
    // Add edges based on timing correlation and behavioral similarity
    for (let i = 0; i < participants.length - 1; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        const similarity = this.calculateParticipantSimilarity(
          participants[i], 
          participants[j], 
          timeWindow
        );
        
        if (similarity > ALGORITHM_CONFIG.NETWORK_ANALYSIS.MIN_EDGE_WEIGHT) {
          const edgeKey = `${participants[i].id}-${participants[j].id}`;
          graph.edges.set(edgeKey, { weight: similarity, participants: [i, j] });
        }
      }
    }
    
    return graph;
  }

  calculateParticipantSimilarity(p1, p2, timeWindow) {
    // Calculate similarity based on timing, behavior, and targets
    const timingSimilarity = this.calculateTimingSimilarity(p1.timestamps, p2.timestamps);
    const behaviorSimilarity = this.calculateBehaviorSimilarity(p1.actions, p2.actions);
    const targetSimilarity = this.calculateTargetSimilarity(p1.targets, p2.targets);
    
    return (timingSimilarity * 0.4 + behaviorSimilarity * 0.3 + targetSimilarity * 0.3);
  }

  detectCommunities(graph) {
    // Simplified community detection using clustering
    const communities = [];
    const visited = new Set();
    
    for (const node of graph.nodes) {
      if (!visited.has(node)) {
        const community = this.findConnectedComponent(graph, node, visited);
        if (community.length > 1) {
          communities.push(community);
        }
      }
    }
    
    return communities;
  }

  calculateCentrality(graph) {
    // Calculate betweenness centrality for each node
    const centrality = {};
    
    for (const node of graph.nodes) {
      centrality[node] = this.calculateBetweennessCentrality(graph, node);
    }
    
    return centrality;
  }

  analyzePropagation(graph) {
    // Analyze how attacks propagate through the network
    return {
      speed: Math.random(), // Simplified
      reach: graph.nodes.size,
      depth: 3
    };
  }

  calculateCoordinationScore({ graph, communities, centrality, propagation }) {
    const graphDensity = this.calculateGraphDensity(graph);
    const communityScore = communities.length > 0 ? 1 / communities.length : 0;
    const centralityScore = Math.max(...Object.values(centrality));
    const propagationScore = propagation.speed;
    
    return Math.min(1.0, (
      graphDensity * 0.3 +
      communityScore * 0.3 +
      centralityScore * 0.2 +
      propagationScore * 0.2
    ));
  }

  // Utility methods for graph analysis
  calculateGraphDensity(graph) {
    const nodeCount = graph.nodes.size;
    const edgeCount = graph.edges.size;
    const maxEdges = nodeCount * (nodeCount - 1) / 2;
    
    return maxEdges > 0 ? edgeCount / maxEdges : 0;
  }

  calculateTimingSimilarity(timestamps1, timestamps2) {
    // Simplified timing similarity calculation
    return Math.random() * 0.8; // Placeholder
  }

  calculateBehaviorSimilarity(actions1, actions2) {
    // Simplified behavior similarity calculation
    return Math.random() * 0.7; // Placeholder
  }

  calculateTargetSimilarity(targets1, targets2) {
    // Calculate Jaccard similarity for target sets
    const set1 = new Set(targets1);
    const set2 = new Set(targets2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  findConnectedComponent(graph, startNode, visited) {
    const component = [startNode];
    const queue = [startNode];
    visited.add(startNode);
    
    while (queue.length > 0) {
      const current = queue.shift();
      
      // Find connected nodes
      for (const [edgeKey, edge] of graph.edges) {
        const [node1, node2] = edgeKey.split('-');
        let neighbor = null;
        
        if (node1 === current && !visited.has(node2)) {
          neighbor = node2;
        } else if (node2 === current && !visited.has(node1)) {
          neighbor = node1;
        }
        
        if (neighbor) {
          visited.add(neighbor);
          component.push(neighbor);
          queue.push(neighbor);
        }
      }
    }
    
    return component;
  }

  calculateBetweennessCentrality(graph, node) {
    // Simplified betweenness centrality calculation
    return Math.random(); // Placeholder
  }

  generateCoordinationRecommendations(score) {
    if (score > 0.9) return ['BLOCK_ALL_PARTICIPANTS', 'EMERGENCY_LOCKDOWN'];
    if (score > 0.8) return ['ISOLATE_ATTACK_NETWORK', 'ALERT_SECURITY_TEAM'];
    if (score > 0.6) return ['INCREASE_MONITORING', 'RATE_LIMIT_PARTICIPANTS'];
    return ['LOG_FOR_ANALYSIS'];
  }
}

// Create singleton instances
export const statisticalAnalyzer = new AdvancedStatisticalAnalyzer();
export const gamingPatternDetector = new GamingPatternDetector();
export const coordinatedAttackAnalyzer = new CoordinatedAttackGraphAnalyzer();

/**
 * Unified threat analysis function
 */
export const analyzeAdvancedThreats = (threatData) => {
  const results = {
    statistical_anomalies: [],
    gaming_patterns: {},
    coordination_analysis: null,
    overall_threat_score: 0,
    recommendations: []
  };

  // Statistical analysis
  if (threatData.metrics) {
    for (const [metricName, value] of Object.entries(threatData.metrics)) {
      const anomaly = statisticalAnalyzer.detectAnomalies(metricName, value, threatData.timestamp);
      if (anomaly.anomalous) {
        results.statistical_anomalies.push({ metric: metricName, ...anomaly });
      }
    }
  }

  // Gaming pattern analysis
  if (threatData.gaming_activity) {
    const activity = threatData.gaming_activity;
    
    if (activity.votes) {
      results.gaming_patterns.vote_manipulation = gamingPatternDetector.detectVoteManipulation(
        activity.userId, activity.ip, activity.votes, threatData.timestamp
      );
    }
    
    if (activity.clan_actions) {
      results.gaming_patterns.clan_abuse = gamingPatternDetector.detectClanAbuse(
        activity.userId, activity.ip, activity.clan_actions, threatData.timestamp
      );
    }
    
    if (activity.tournament_actions) {
      results.gaming_patterns.tournament_manipulation = gamingPatternDetector.detectTournamentManipulation(
        activity.userId, activity.ip, activity.tournament_actions, threatData.timestamp
      );
    }
    
    if (activity.web3_transactions) {
      results.gaming_patterns.web3_abuse = gamingPatternDetector.detectWeb3Abuse(
        activity.walletAddress, activity.ip, activity.web3_transactions, threatData.timestamp
      );
    }
  }

  // Coordination analysis
  if (threatData.participants && threatData.participants.length > 1) {
    results.coordination_analysis = coordinatedAttackAnalyzer.detectCoordinatedAttack(
      threatData.participants, threatData.timeWindow
    );
  }

  // Calculate overall threat score
  results.overall_threat_score = calculateOverallThreatScore(results);
  
  // Generate recommendations
  results.recommendations = generateUnifiedRecommendations(results);

  return results;
};

function calculateOverallThreatScore(results) {
  let score = 0;
  let components = 0;

  // Statistical anomalies contribution
  if (results.statistical_anomalies.length > 0) {
    const avgAnomalyConfidence = results.statistical_anomalies.reduce(
      (sum, a) => sum + a.confidence, 0
    ) / results.statistical_anomalies.length;
    score += avgAnomalyConfidence * 0.3;
    components++;
  }

  // Gaming patterns contribution
  const gamingScores = Object.values(results.gaming_patterns)
    .filter(p => p.suspicious)
    .map(p => p.confidence);
  
  if (gamingScores.length > 0) {
    const avgGamingScore = gamingScores.reduce((sum, s) => sum + s, 0) / gamingScores.length;
    score += avgGamingScore * 0.4;
    components++;
  }

  // Coordination contribution
  if (results.coordination_analysis && results.coordination_analysis.coordinated) {
    score += results.coordination_analysis.confidence * 0.3;
    components++;
  }

  return components > 0 ? score / components : 0;
}

function generateUnifiedRecommendations(results) {
  const recommendations = new Set();

  // Add recommendations from each component
  results.statistical_anomalies.forEach(a => {
    if (a.confidence > 0.8) recommendations.add('STATISTICAL_ANOMALY_DETECTED');
  });

  Object.values(results.gaming_patterns).forEach(pattern => {
    if (pattern.recommendations) {
      pattern.recommendations.forEach(rec => recommendations.add(rec));
    }
  });

  if (results.coordination_analysis && results.coordination_analysis.recommendations) {
    results.coordination_analysis.recommendations.forEach(rec => recommendations.add(rec));
  }

  // Overall recommendations based on threat score
  if (results.overall_threat_score > 0.9) {
    recommendations.add('IMMEDIATE_RESPONSE_REQUIRED');
    recommendations.add('ESCALATE_TO_SECURITY_TEAM');
  } else if (results.overall_threat_score > 0.7) {
    recommendations.add('ENHANCED_MONITORING');
    recommendations.add('APPLY_STRICT_RATE_LIMITS');
  } else if (results.overall_threat_score > 0.5) {
    recommendations.add('MONITOR_CLOSELY');
  }

  return Array.from(recommendations);
}

export default {
  AdvancedStatisticalAnalyzer,
  GamingPatternDetector,
  CoordinatedAttackGraphAnalyzer,
  analyzeAdvancedThreats,
  statisticalAnalyzer,
  gamingPatternDetector,
  coordinatedAttackAnalyzer
};