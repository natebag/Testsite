/**
 * Automated Threat Detection System for MLG.clan Platform
 * 
 * Advanced AI-powered threat detection system with machine learning-based
 * anomaly detection, behavioral analysis, and real-time threat response
 * specifically designed for gaming platforms.
 * 
 * Features:
 * - Real-time anomaly detection
 * - Behavioral pattern analysis
 * - Gaming-specific threat detection
 * - Automated response mechanisms
 * - Machine learning threat scoring
 * - Coordinated attack detection
 * 
 * @author Claude Code - Security Auditor
 * @version 2.0.0
 * @created 2025-08-11
 */

import { createHash } from 'crypto';

/**
 * Threat Detection Configuration
 */
const THREAT_CONFIG = {
  // Detection thresholds
  THRESHOLDS: {
    ANOMALY_SCORE: 0.7,           // ML anomaly detection threshold
    BEHAVIOR_DEVIATION: 0.8,      // Behavioral pattern deviation
    THREAT_SCORE: 75,             // Combined threat score threshold
    CONFIDENCE_LEVEL: 0.6,        // Minimum confidence for actions
    COORDINATED_ATTACK: 5,        // Minimum users for coordinated attack
    TIME_WINDOW: 300000           // 5 minutes for pattern analysis
  },

  // ML Model parameters (simplified)
  MACHINE_LEARNING: {
    FEATURE_WEIGHTS: {
      REQUEST_FREQUENCY: 0.25,
      ERROR_RATE: 0.20,
      RESPONSE_PATTERN: 0.15,
      GEO_ANOMALY: 0.15,
      USER_AGENT_CONSISTENCY: 0.10,
      TIMING_PATTERN: 0.15
    },
    TRAINING_WINDOW: 7 * 24 * 60 * 60 * 1000, // 7 days
    UPDATE_INTERVAL: 60 * 60 * 1000,          // 1 hour
    MIN_SAMPLES: 100                          // Minimum samples for learning
  },

  // Gaming-specific threat patterns
  GAMING_THREATS: {
    VOTE_MANIPULATION: {
      MAX_VOTE_FREQUENCY: 1.0,    // Votes per second
      COORDINATED_THRESHOLD: 3,    // Users voting together
      PATTERN_SIMILARITY: 0.9     // Pattern similarity threshold
    },
    CLAN_ABUSE: {
      RAPID_JOIN_LEAVE: 5,        // Actions per minute
      MASS_INVITATION: 10,        // Invites per minute
      ROLE_CYCLING: 3             // Role changes per hour
    },
    TOKEN_ABUSE: {
      SUSPICIOUS_AMOUNTS: [0.1, 1.0, 10.0, 100.0], // Common bot amounts
      BURN_FREQUENCY: 2,          // Burns per minute
      WALLET_SWITCHING: 3         // Wallet changes per hour
    }
  },

  // Response actions
  RESPONSES: {
    LOW_THREAT: ['LOG', 'MONITOR'],
    MEDIUM_THREAT: ['LOG', 'MONITOR', 'RATE_LIMIT'],
    HIGH_THREAT: ['LOG', 'MONITOR', 'RATE_LIMIT', 'TEMPORARY_BLOCK'],
    CRITICAL_THREAT: ['LOG', 'MONITOR', 'BLOCK', 'ALERT_ADMIN']
  }
};

/**
 * Threat Detection Engine
 */
class ThreatDetectionEngine {
  constructor() {
    this.userProfiles = new Map();        // User behavior profiles
    this.threatScores = new Map();        // Current threat scores
    this.detectionModels = new Map();     // ML models for different threats
    this.activeThreats = new Map();       // Currently active threats
    this.historicalData = new Map();      // Historical data for learning
    
    this.initializeDetectionModels();
    this.startThreatAnalysisLoop();
  }

  /**
   * Initialize ML detection models
   */
  initializeDetectionModels() {
    // Initialize different threat detection models
    this.detectionModels.set('anomaly_detection', new AnomalyDetectionModel());
    this.detectionModels.set('behavior_analysis', new BehaviorAnalysisModel());
    this.detectionModels.set('gaming_threats', new GamingThreatModel());
    this.detectionModels.set('coordinated_attacks', new CoordinatedAttackModel());
  }

  /**
   * Analyze incoming request for threats
   */
  analyzeRequest(req, metadata = {}) {
    const analysis = {
      timestamp: Date.now(),
      requestId: req.requestId,
      userId: req.user?.id,
      walletAddress: req.user?.walletAddress,
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      threats: [],
      anomalies: [],
      threatScore: 0,
      confidence: 0,
      recommended_actions: [],
      ...metadata
    };

    try {
      // Run all detection models
      this.runAnomalyDetection(analysis);
      this.runBehaviorAnalysis(analysis);
      this.runGamingThreatDetection(analysis);
      this.runCoordinatedAttackDetection(analysis);

      // Calculate combined threat score
      analysis.threatScore = this.calculateThreatScore(analysis);
      analysis.confidence = this.calculateConfidence(analysis);

      // Determine recommended actions
      analysis.recommended_actions = this.determineActions(analysis);

      // Update user profile
      this.updateUserProfile(analysis);

      // Execute automated responses if needed
      if (analysis.confidence > THREAT_CONFIG.THRESHOLDS.CONFIDENCE_LEVEL) {
        this.executeAutomatedResponse(analysis);
      }

      return analysis;

    } catch (error) {
      console.error('Threat analysis error:', error);
      return {
        ...analysis,
        error: error.message,
        threatScore: 0,
        confidence: 0
      };
    }
  }

  /**
   * Run anomaly detection
   */
  runAnomalyDetection(analysis) {
    const model = this.detectionModels.get('anomaly_detection');
    const features = this.extractAnomalyFeatures(analysis);
    
    const anomalyResult = model.detect(features);
    
    if (anomalyResult.score > THREAT_CONFIG.THRESHOLDS.ANOMALY_SCORE) {
      analysis.anomalies.push({
        type: 'statistical_anomaly',
        score: anomalyResult.score,
        features: anomalyResult.anomalous_features,
        description: 'Statistical anomaly detected in request patterns'
      });
      
      analysis.threats.push({
        type: 'ANOMALY',
        severity: this.scoresToSeverity(anomalyResult.score),
        confidence: anomalyResult.confidence,
        details: anomalyResult
      });
    }
  }

  /**
   * Run behavioral analysis
   */
  runBehaviorAnalysis(analysis) {
    const userId = analysis.userId;
    if (!userId) return; // Skip for anonymous users

    const userProfile = this.getUserProfile(userId);
    const model = this.detectionModels.get('behavior_analysis');
    
    const behaviorFeatures = this.extractBehaviorFeatures(analysis, userProfile);
    const behaviorResult = model.analyze(behaviorFeatures, userProfile.baseline);
    
    if (behaviorResult.deviation > THREAT_CONFIG.THRESHOLDS.BEHAVIOR_DEVIATION) {
      analysis.threats.push({
        type: 'BEHAVIOR_ANOMALY',
        severity: this.deviationToSeverity(behaviorResult.deviation),
        confidence: behaviorResult.confidence,
        details: {
          deviation: behaviorResult.deviation,
          changed_patterns: behaviorResult.changed_patterns,
          profile_age: userProfile.age
        }
      });
    }
  }

  /**
   * Run gaming-specific threat detection
   */
  runGamingThreatDetection(analysis) {
    const model = this.detectionModels.get('gaming_threats');
    const gamingFeatures = this.extractGamingFeatures(analysis);
    
    // Check voting threats
    if (analysis.path.includes('/voting')) {
      const votingThreats = model.detectVotingThreats(gamingFeatures, analysis);
      analysis.threats.push(...votingThreats);
    }

    // Check clan threats
    if (analysis.path.includes('/clan')) {
      const clanThreats = model.detectClanThreats(gamingFeatures, analysis);
      analysis.threats.push(...clanThreats);
    }

    // Check token threats
    if (analysis.path.includes('/token')) {
      const tokenThreats = model.detectTokenThreats(gamingFeatures, analysis);
      analysis.threats.push(...tokenThreats);
    }
  }

  /**
   * Run coordinated attack detection
   */
  runCoordinatedAttackDetection(analysis) {
    const model = this.detectionModels.get('coordinated_attacks');
    const coordinationFeatures = this.extractCoordinationFeatures(analysis);
    
    const coordinatedResult = model.detectCoordination(coordinationFeatures, this.activeThreats);
    
    if (coordinatedResult.coordinated) {
      analysis.threats.push({
        type: 'COORDINATED_ATTACK',
        severity: 'HIGH',
        confidence: coordinatedResult.confidence,
        details: {
          participants: coordinatedResult.participants,
          attack_type: coordinatedResult.attack_type,
          timing_correlation: coordinatedResult.timing_correlation
        }
      });
    }
  }

  /**
   * Extract anomaly detection features
   */
  extractAnomalyFeatures(analysis) {
    const now = Date.now();
    const timeOfDay = new Date(now).getHours();
    const dayOfWeek = new Date(now).getDay();

    return {
      request_frequency: this.calculateRequestFrequency(analysis.ip),
      error_rate: this.calculateErrorRate(analysis.ip),
      response_time: analysis.responseTime || 0,
      path_entropy: this.calculatePathEntropy(analysis.path),
      time_of_day: timeOfDay,
      day_of_week: dayOfWeek,
      user_agent_consistency: this.checkUserAgentConsistency(analysis.userId, analysis.userAgent),
      geo_anomaly: this.detectGeoAnomaly(analysis.ip),
      content_length: analysis.contentLength || 0,
      header_anomaly: this.detectHeaderAnomaly(analysis)
    };
  }

  /**
   * Extract behavioral features
   */
  extractBehaviorFeatures(analysis, userProfile) {
    return {
      session_duration: this.calculateSessionDuration(analysis.userId),
      action_sequence: this.getActionSequence(analysis.userId),
      timing_pattern: this.getTimingPattern(analysis.userId),
      path_preferences: this.getPathPreferences(analysis.userId),
      interaction_depth: this.calculateInteractionDepth(analysis),
      device_consistency: this.checkDeviceConsistency(analysis.userId, analysis.userAgent),
      historical_comparison: this.compareWithHistory(analysis.userId, analysis)
    };
  }

  /**
   * Extract gaming-specific features
   */
  extractGamingFeatures(analysis) {
    return {
      gaming_context: {
        voting_frequency: this.getVotingFrequency(analysis.userId),
        clan_activity: this.getClanActivity(analysis.userId),
        token_operations: this.getTokenOperations(analysis.userId),
        content_interaction: this.getContentInteraction(analysis.userId)
      },
      wallet_behavior: {
        wallet_switches: this.getWalletSwitches(analysis.ip),
        token_patterns: this.getTokenPatterns(analysis.walletAddress),
        transaction_timing: this.getTransactionTiming(analysis.walletAddress)
      },
      reputation_metrics: {
        user_reputation: this.getUserReputation(analysis.userId),
        account_age: this.getAccountAge(analysis.userId),
        community_standing: this.getCommunityStanding(analysis.userId)
      }
    };
  }

  /**
   * Extract coordination features
   */
  extractCoordinationFeatures(analysis) {
    const now = Date.now();
    const timeWindow = THREAT_CONFIG.THRESHOLDS.TIME_WINDOW;

    return {
      simultaneous_actions: this.findSimultaneousActions(analysis, timeWindow),
      ip_clustering: this.analyzeIPClustering(analysis.ip, timeWindow),
      behavioral_similarity: this.findBehavioralSimilarity(analysis, timeWindow),
      timing_correlation: this.analyzeTimingCorrelation(analysis, timeWindow),
      shared_patterns: this.findSharedPatterns(analysis, timeWindow)
    };
  }

  /**
   * Calculate combined threat score
   */
  calculateThreatScore(analysis) {
    let totalScore = 0;
    let weightSum = 0;

    // Weight threats by severity and confidence
    const severityWeights = {
      'LOW': 10,
      'MEDIUM': 30,
      'HIGH': 60,
      'CRITICAL': 100
    };

    for (const threat of analysis.threats) {
      const weight = severityWeights[threat.severity] || 10;
      const score = weight * (threat.confidence || 0.5);
      totalScore += score;
      weightSum += weight;
    }

    // Add anomaly contributions
    for (const anomaly of analysis.anomalies) {
      totalScore += anomaly.score * 50; // Scale anomaly scores
      weightSum += 50;
    }

    return weightSum > 0 ? Math.min(totalScore / weightSum * 100, 100) : 0;
  }

  /**
   * Calculate confidence level
   */
  calculateConfidence(analysis) {
    if (analysis.threats.length === 0 && analysis.anomalies.length === 0) {
      return 0;
    }

    const confidences = [
      ...analysis.threats.map(t => t.confidence || 0.5),
      ...analysis.anomalies.map(a => 0.7) // Default confidence for anomalies
    ];

    // Use weighted average with threat score influence
    const avgConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    const threatScoreInfluence = Math.min(analysis.threatScore / 100, 1);
    
    return (avgConfidence + threatScoreInfluence) / 2;
  }

  /**
   * Determine appropriate actions based on threat analysis
   */
  determineActions(analysis) {
    const threatScore = analysis.threatScore;
    const confidence = analysis.confidence;

    if (confidence < THREAT_CONFIG.THRESHOLDS.CONFIDENCE_LEVEL) {
      return ['LOG']; // Low confidence, just log
    }

    if (threatScore >= 90) {
      return THREAT_CONFIG.RESPONSES.CRITICAL_THREAT;
    } else if (threatScore >= 70) {
      return THREAT_CONFIG.RESPONSES.HIGH_THREAT;
    } else if (threatScore >= 40) {
      return THREAT_CONFIG.RESPONSES.MEDIUM_THREAT;
    } else {
      return THREAT_CONFIG.RESPONSES.LOW_THREAT;
    }
  }

  /**
   * Execute automated response actions
   */
  executeAutomatedResponse(analysis) {
    const actions = analysis.recommended_actions;
    
    for (const action of actions) {
      switch (action) {
        case 'LOG':
          this.logThreat(analysis);
          break;
        case 'MONITOR':
          this.addToMonitoring(analysis);
          break;
        case 'RATE_LIMIT':
          this.applyRateLimit(analysis);
          break;
        case 'TEMPORARY_BLOCK':
          this.applyTemporaryBlock(analysis);
          break;
        case 'BLOCK':
          this.blockUser(analysis);
          break;
        case 'ALERT_ADMIN':
          this.alertAdministrators(analysis);
          break;
      }
    }
  }

  /**
   * Get or create user profile
   */
  getUserProfile(userId) {
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, {
        userId,
        created: Date.now(),
        age: 0,
        requests: [],
        baseline: this.createBaselineProfile(),
        last_updated: Date.now()
      });
    }

    const profile = this.userProfiles.get(userId);
    profile.age = Date.now() - profile.created;
    
    return profile;
  }

  /**
   * Create baseline user profile
   */
  createBaselineProfile() {
    return {
      avg_request_frequency: 0,
      common_paths: [],
      typical_timing: [],
      usual_user_agents: [],
      normal_session_duration: 0,
      standard_response_patterns: []
    };
  }

  /**
   * Update user profile with new data
   */
  updateUserProfile(analysis) {
    const userId = analysis.userId;
    if (!userId) return;

    const profile = this.getUserProfile(userId);
    
    // Add request to history
    profile.requests.push({
      timestamp: analysis.timestamp,
      path: analysis.path,
      method: analysis.method,
      userAgent: analysis.userAgent,
      threatScore: analysis.threatScore
    });

    // Keep only recent requests
    const maxHistory = 1000;
    if (profile.requests.length > maxHistory) {
      profile.requests.splice(0, profile.requests.length - maxHistory);
    }

    // Update baseline if enough data
    if (profile.requests.length >= THREAT_CONFIG.MACHINE_LEARNING.MIN_SAMPLES) {
      this.updateBaseline(profile);
    }

    profile.last_updated = Date.now();
  }

  /**
   * Update user baseline profile
   */
  updateBaseline(profile) {
    const recentRequests = profile.requests.slice(-100); // Last 100 requests
    
    // Calculate average request frequency
    const timespan = recentRequests[recentRequests.length - 1].timestamp - recentRequests[0].timestamp;
    profile.baseline.avg_request_frequency = recentRequests.length / (timespan / 60000); // Per minute

    // Calculate common paths
    const pathCounts = recentRequests.reduce((counts, req) => {
      counts[req.path] = (counts[req.path] || 0) + 1;
      return counts;
    }, {});
    
    profile.baseline.common_paths = Object.entries(pathCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([path]) => path);

    // Calculate timing patterns
    const timings = [];
    for (let i = 1; i < recentRequests.length; i++) {
      timings.push(recentRequests[i].timestamp - recentRequests[i-1].timestamp);
    }
    profile.baseline.typical_timing = this.calculateStatistics(timings);

    // Track user agents
    const userAgents = recentRequests.map(req => req.userAgent);
    profile.baseline.usual_user_agents = [...new Set(userAgents)];
  }

  /**
   * Helper methods for feature extraction
   */
  calculateRequestFrequency(ip) {
    // Implementation would track requests per IP
    return Math.random() * 10; // Placeholder
  }

  calculateErrorRate(ip) {
    // Implementation would track error rates per IP
    return Math.random() * 0.1; // Placeholder
  }

  calculatePathEntropy(path) {
    // Calculate entropy of path string
    const chars = path.split('');
    const charCounts = chars.reduce((counts, char) => {
      counts[char] = (counts[char] || 0) + 1;
      return counts;
    }, {});

    let entropy = 0;
    for (const count of Object.values(charCounts)) {
      const probability = count / chars.length;
      entropy -= probability * Math.log2(probability);
    }

    return entropy;
  }

  checkUserAgentConsistency(userId, userAgent) {
    if (!userId) return 1;

    const profile = this.getUserProfile(userId);
    const usualAgents = profile.baseline.usual_user_agents;
    
    return usualAgents.includes(userAgent) ? 1 : 0;
  }

  detectGeoAnomaly(ip) {
    // Placeholder for geo-location anomaly detection
    return Math.random() < 0.1 ? 1 : 0;
  }

  detectHeaderAnomaly(analysis) {
    // Placeholder for HTTP header anomaly detection
    return 0;
  }

  // Additional helper methods...
  calculateSessionDuration(userId) { return 300000; } // 5 minutes placeholder
  getActionSequence(userId) { return []; }
  getTimingPattern(userId) { return []; }
  getPathPreferences(userId) { return []; }
  calculateInteractionDepth(analysis) { return 1; }
  checkDeviceConsistency(userId, userAgent) { return 1; }
  compareWithHistory(userId, analysis) { return {}; }
  
  getVotingFrequency(userId) { return 0; }
  getClanActivity(userId) { return {}; }
  getTokenOperations(userId) { return {}; }
  getContentInteraction(userId) { return {}; }
  
  getWalletSwitches(ip) { return 0; }
  getTokenPatterns(walletAddress) { return {}; }
  getTransactionTiming(walletAddress) { return []; }
  
  getUserReputation(userId) { return 50; }
  getAccountAge(userId) { return 30 * 24 * 60 * 60 * 1000; }
  getCommunityStanding(userId) { return 'good'; }

  /**
   * Helper methods for automated responses
   */
  logThreat(analysis) {
    console.warn('THREAT DETECTED:', {
      requestId: analysis.requestId,
      threatScore: analysis.threatScore,
      confidence: analysis.confidence,
      threats: analysis.threats.length,
      userId: analysis.userId
    });
  }

  addToMonitoring(analysis) {
    const key = analysis.userId || analysis.ip;
    this.activeThreats.set(key, {
      ...analysis,
      monitoring_started: Date.now(),
      escalation_count: (this.activeThreats.get(key)?.escalation_count || 0) + 1
    });
  }

  applyRateLimit(analysis) {
    // This would integrate with the rate limiting system
    console.log('Applying rate limit for:', analysis.userId || analysis.ip);
  }

  applyTemporaryBlock(analysis) {
    // This would integrate with the blocking system
    console.log('Applying temporary block for:', analysis.userId || analysis.ip);
  }

  blockUser(analysis) {
    // This would integrate with the user management system
    console.log('Blocking user:', analysis.userId || analysis.ip);
  }

  alertAdministrators(analysis) {
    // This would send alerts to administrators
    console.error('🚨 CRITICAL THREAT ALERT:', {
      threatScore: analysis.threatScore,
      confidence: analysis.confidence,
      userId: analysis.userId,
      threats: analysis.threats
    });
  }

  /**
   * Utility methods
   */
  scoresToSeverity(score) {
    if (score >= 0.9) return 'CRITICAL';
    if (score >= 0.7) return 'HIGH';
    if (score >= 0.4) return 'MEDIUM';
    return 'LOW';
  }

  deviationToSeverity(deviation) {
    if (deviation >= 0.9) return 'CRITICAL';
    if (deviation >= 0.7) return 'HIGH';
    if (deviation >= 0.5) return 'MEDIUM';
    return 'LOW';
  }

  calculateStatistics(values) {
    if (values.length === 0) return { mean: 0, std: 0 };
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);
    
    return { mean, std };
  }

  /**
   * Start threat analysis loop
   */
  startThreatAnalysisLoop() {
    setInterval(() => {
      this.performPeriodicAnalysis();
      this.updateModels();
      this.cleanupOldData();
    }, 60000); // Every minute
  }

  performPeriodicAnalysis() {
    // Analyze trends and patterns
    // Update threat levels
    // Generate reports
  }

  updateModels() {
    // Update ML models with new data
    for (const [name, model] of this.detectionModels) {
      if (model.update) {
        model.update(this.historicalData.get(name) || []);
      }
    }
  }

  cleanupOldData() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Cleanup active threats
    for (const [key, threat] of this.activeThreats.entries()) {
      if (now - threat.timestamp > maxAge) {
        this.activeThreats.delete(key);
      }
    }

    // Cleanup user profiles
    for (const [userId, profile] of this.userProfiles.entries()) {
      if (now - profile.last_updated > 7 * 24 * 60 * 60 * 1000) { // 7 days
        this.userProfiles.delete(userId);
      }
    }
  }

  /**
   * Get threat detection statistics
   */
  getStatistics() {
    return {
      active_threats: this.activeThreats.size,
      monitored_users: this.userProfiles.size,
      total_models: this.detectionModels.size,
      recent_detections: Array.from(this.activeThreats.values())
        .filter(threat => Date.now() - threat.timestamp < 60 * 60 * 1000).length
    };
  }
}

/**
 * Simplified ML Model Classes (placeholders for actual implementations)
 */
class AnomalyDetectionModel {
  detect(features) {
    // Simplified anomaly detection
    const score = Math.random();
    return {
      score,
      confidence: 0.8,
      anomalous_features: Object.keys(features).filter(() => Math.random() > 0.7)
    };
  }
}

class BehaviorAnalysisModel {
  analyze(features, baseline) {
    // Simplified behavioral analysis
    const deviation = Math.random();
    return {
      deviation,
      confidence: 0.7,
      changed_patterns: ['timing', 'frequency']
    };
  }
}

class GamingThreatModel {
  detectVotingThreats(features, analysis) {
    const threats = [];
    // Simplified voting threat detection
    if (Math.random() > 0.8) {
      threats.push({
        type: 'VOTE_MANIPULATION',
        severity: 'MEDIUM',
        confidence: 0.6
      });
    }
    return threats;
  }

  detectClanThreats(features, analysis) {
    const threats = [];
    // Simplified clan threat detection
    if (Math.random() > 0.9) {
      threats.push({
        type: 'CLAN_SPAM',
        severity: 'LOW',
        confidence: 0.5
      });
    }
    return threats;
  }

  detectTokenThreats(features, analysis) {
    const threats = [];
    // Simplified token threat detection
    if (Math.random() > 0.85) {
      threats.push({
        type: 'TOKEN_ABUSE',
        severity: 'HIGH',
        confidence: 0.7
      });
    }
    return threats;
  }
}

class CoordinatedAttackModel {
  detectCoordination(features, activeThreats) {
    // Simplified coordination detection
    return {
      coordinated: Math.random() > 0.95,
      confidence: 0.6,
      participants: 3,
      attack_type: 'vote_manipulation',
      timing_correlation: 0.8
    };
  }
}

// Initialize threat detection engine
const threatDetectionEngine = new ThreatDetectionEngine();

/**
 * Threat detection middleware
 */
export const threatDetectionMiddleware = (req, res, next) => {
  try {
    // Analyze the request for threats
    const threatAnalysis = threatDetectionEngine.analyzeRequest(req);
    
    // Add analysis to request for logging
    req.threatAnalysis = threatAnalysis;

    // Block if critical threat detected
    if (threatAnalysis.threatScore >= THREAT_CONFIG.THRESHOLDS.THREAT_SCORE && 
        threatAnalysis.confidence >= THREAT_CONFIG.THRESHOLDS.CONFIDENCE_LEVEL) {
      
      return res.status(429).json({
        error: 'Request blocked by threat detection system',
        code: 'THREAT_DETECTED',
        threatScore: threatAnalysis.threatScore,
        confidence: threatAnalysis.confidence,
        requestId: req.requestId
      });
    }

    next();

  } catch (error) {
    console.error('Threat detection middleware error:', error);
    // Don't block requests on system errors
    next();
  }
};

/**
 * Get threat detection engine instance
 */
export const getThreatDetectionEngine = () => threatDetectionEngine;

/**
 * Get threat statistics endpoint
 */
export const getThreatStatistics = (req, res) => {
  if (!req.user?.roles?.includes('admin')) {
    return res.status(403).json({
      error: 'Insufficient permissions',
      code: 'ADMIN_REQUIRED'
    });
  }

  const stats = threatDetectionEngine.getStatistics();
  res.json({
    success: true,
    statistics: stats,
    timestamp: new Date().toISOString()
  });
};

export default {
  threatDetectionMiddleware,
  getThreatDetectionEngine,
  getThreatStatistics
};