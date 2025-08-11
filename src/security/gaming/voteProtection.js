/**
 * Gaming-Specific Security: Vote Manipulation Detection and Prevention
 * 
 * Advanced voting security system designed specifically for gaming platforms,
 * preventing vote manipulation, MLG token abuse, and coordinated attacks.
 * 
 * Features:
 * - Vote manipulation pattern detection
 * - MLG token burn validation
 * - Coordinated attack prevention
 * - Gaming behavior analysis
 * - Reputation-based validation
 * - Real-time anomaly detection
 * 
 * @author Claude Code - Security Auditor
 * @version 2.0.0
 * @created 2025-08-11
 */

import { createHash } from 'crypto';

/**
 * Vote Protection Configuration
 */
const VOTE_SECURITY_CONFIG = {
  // Vote pattern detection
  PATTERNS: {
    MAX_VOTES_PER_MINUTE: 10,
    MAX_VOTES_PER_HOUR: 100,
    MAX_VOTES_PER_DAY: 500,
    SUSPICIOUS_PATTERN_THRESHOLD: 5, // Rapid votes in sequence
    MIN_TIME_BETWEEN_VOTES: 3000, // 3 seconds
    REPUTATION_THRESHOLD: 50 // Minimum reputation for unlimited voting
  },

  // MLG token validation
  MLG_TOKEN: {
    MIN_BURN_AMOUNT: 1, // Minimum MLG to burn per vote
    MAX_BURN_AMOUNT: 1000, // Maximum MLG to burn per vote
    BURN_VALIDATION_WINDOW: 30000, // 30 seconds to validate burn
    REQUIRED_TOKEN_BALANCE: 10, // Minimum balance to vote
    PREMIUM_MULTIPLIER: 2, // Vote weight multiplier for premium users
    REPUTATION_BONUS: 0.1 // Additional weight based on reputation
  },

  // Coordinated attack detection
  COORDINATION: {
    SAME_IP_THRESHOLD: 5, // Max votes from same IP per hour
    SIMILAR_TIME_THRESHOLD: 10000, // 10 seconds for coordinated detection
    WALLET_CLUSTER_THRESHOLD: 10, // Max related wallets voting together
    BEHAVIORAL_SIMILARITY_THRESHOLD: 0.8, // Behavioral pattern similarity
    VOTING_VELOCITY_THRESHOLD: 20 // Votes per minute across all users
  },

  // Gaming behavior analysis
  BEHAVIOR: {
    NORMAL_VOTE_DISTRIBUTION: {
      UP_VOTE_RATIO: { min: 0.3, max: 0.8 }, // Normal up/down vote ratio
      VOTE_TIMING_VARIANCE: 5000, // Expected variance in vote timing
      SESSION_LENGTH_VARIANCE: 300000 // 5 minutes session variance
    },
    SUSPICIOUS_INDICATORS: {
      IMMEDIATE_VOTING: 1000, // Voting within 1 second of content view
      RAPID_CONTENT_SWITCHING: 2000, // Switching content too quickly
      IDENTICAL_VOTE_PATTERNS: 0.95, // Pattern similarity threshold
      NO_CONTENT_INTERACTION: true // Voting without viewing content
    }
  },

  // Real-time limits
  REALTIME: {
    VOTE_QUEUE_SIZE: 1000,
    ANALYSIS_BATCH_SIZE: 100,
    PATTERN_ANALYSIS_INTERVAL: 30000, // 30 seconds
    CLEANUP_INTERVAL: 300000 // 5 minutes
  }
};

/**
 * Vote Pattern Analyzer
 */
class VotePatternAnalyzer {
  constructor() {
    this.votingHistory = new Map(); // User voting history
    this.contentVotingPatterns = new Map(); // Content-specific patterns
    this.ipVotingHistory = new Map(); // IP-based tracking
    this.realtimeVoteQueue = [];
    this.suspiciousPatterns = new Map();
    
    this.startAnalysisLoop();
  }

  /**
   * Analyze voting pattern for suspicious behavior
   */
  analyzeVotingPattern(userId, walletAddress, contentId, voteType, mlgAmount, req) {
    const analysis = {
      userId,
      walletAddress,
      contentId,
      voteType,
      mlgAmount,
      timestamp: Date.now(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      suspicious: false,
      reasons: [],
      riskScore: 0
    };

    // Add to real-time queue
    this.realtimeVoteQueue.push(analysis);

    // Immediate pattern checks
    this.checkRateLimit(analysis);
    this.checkMLGTokenValidation(analysis);
    this.checkCoordinatedVoting(analysis);
    this.checkBehavioralPatterns(analysis, req);
    this.checkIPPatterns(analysis);

    // Calculate overall risk score
    analysis.riskScore = this.calculateRiskScore(analysis);

    // Update tracking data
    this.updateVotingHistory(analysis);

    return analysis;
  }

  /**
   * Check rate limiting patterns
   */
  checkRateLimit(analysis) {
    const userId = analysis.userId;
    const now = Date.now();
    
    // Get user voting history
    if (!this.votingHistory.has(userId)) {
      this.votingHistory.set(userId, []);
    }

    const userVotes = this.votingHistory.get(userId);
    
    // Filter recent votes
    const recentVotes = userVotes.filter(vote => 
      now - vote.timestamp < VOTE_SECURITY_CONFIG.PATTERNS.MAX_VOTES_PER_HOUR * 60000
    );

    // Check per-minute limit
    const lastMinuteVotes = recentVotes.filter(vote => 
      now - vote.timestamp < 60000
    );

    if (lastMinuteVotes.length >= VOTE_SECURITY_CONFIG.PATTERNS.MAX_VOTES_PER_MINUTE) {
      analysis.suspicious = true;
      analysis.reasons.push('Exceeded per-minute vote limit');
      analysis.riskScore += 50;
    }

    // Check per-hour limit
    if (recentVotes.length >= VOTE_SECURITY_CONFIG.PATTERNS.MAX_VOTES_PER_HOUR) {
      analysis.suspicious = true;
      analysis.reasons.push('Exceeded per-hour vote limit');
      analysis.riskScore += 30;
    }

    // Check minimum time between votes
    if (recentVotes.length > 0) {
      const lastVote = recentVotes[recentVotes.length - 1];
      const timeDiff = now - lastVote.timestamp;
      
      if (timeDiff < VOTE_SECURITY_CONFIG.PATTERNS.MIN_TIME_BETWEEN_VOTES) {
        analysis.suspicious = true;
        analysis.reasons.push('Voting too quickly');
        analysis.riskScore += 25;
      }
    }

    // Check rapid sequence pattern
    const rapidVotes = recentVotes.filter(vote => 
      now - vote.timestamp < 30000 // Last 30 seconds
    );

    if (rapidVotes.length >= VOTE_SECURITY_CONFIG.PATTERNS.SUSPICIOUS_PATTERN_THRESHOLD) {
      analysis.suspicious = true;
      analysis.reasons.push('Suspicious rapid voting pattern');
      analysis.riskScore += 40;
    }
  }

  /**
   * Validate MLG token burn
   */
  checkMLGTokenValidation(analysis) {
    const mlgAmount = parseFloat(analysis.mlgAmount);

    // Check burn amount limits
    if (mlgAmount < VOTE_SECURITY_CONFIG.MLG_TOKEN.MIN_BURN_AMOUNT) {
      analysis.suspicious = true;
      analysis.reasons.push('MLG burn amount too low');
      analysis.riskScore += 20;
    }

    if (mlgAmount > VOTE_SECURITY_CONFIG.MLG_TOKEN.MAX_BURN_AMOUNT) {
      analysis.suspicious = true;
      analysis.reasons.push('MLG burn amount suspiciously high');
      analysis.riskScore += 30;
    }

    // Check for common manipulation amounts
    const suspiciousAmounts = [0.1, 0.5, 1.0, 5.0, 10.0, 100.0];
    if (suspiciousAmounts.includes(mlgAmount)) {
      analysis.riskScore += 5; // Minor risk increase
    }

    // TODO: Integrate with actual MLG token validation
    // This would check blockchain for actual burn transaction
    analysis.mlgTokenValidated = true;
  }

  /**
   * Detect coordinated voting attacks
   */
  checkCoordinatedVoting(analysis) {
    const contentId = analysis.contentId;
    const ip = analysis.ip;
    const now = Date.now();

    // Check same IP voting patterns
    if (!this.ipVotingHistory.has(ip)) {
      this.ipVotingHistory.set(ip, []);
    }

    const ipVotes = this.ipVotingHistory.get(ip);
    const recentIPVotes = ipVotes.filter(vote => 
      now - vote.timestamp < 60 * 60 * 1000 // Last hour
    );

    if (recentIPVotes.length >= VOTE_SECURITY_CONFIG.COORDINATION.SAME_IP_THRESHOLD) {
      analysis.suspicious = true;
      analysis.reasons.push('Too many votes from same IP');
      analysis.riskScore += 35;
    }

    // Check content voting patterns
    if (!this.contentVotingPatterns.has(contentId)) {
      this.contentVotingPatterns.set(contentId, []);
    }

    const contentVotes = this.contentVotingPatterns.get(contentId);
    const recentContentVotes = contentVotes.filter(vote => 
      now - vote.timestamp < 300000 // Last 5 minutes
    );

    // Check for coordinated timing
    const coordinatedVotes = recentContentVotes.filter(vote => 
      Math.abs(now - vote.timestamp) < VOTE_SECURITY_CONFIG.COORDINATION.SIMILAR_TIME_THRESHOLD
    );

    if (coordinatedVotes.length >= 3) {
      analysis.suspicious = true;
      analysis.reasons.push('Coordinated voting timing detected');
      analysis.riskScore += 45;
    }

    // Check voting velocity for content
    const velocityWindow = 60000; // 1 minute
    const velocityVotes = recentContentVotes.filter(vote => 
      now - vote.timestamp < velocityWindow
    );

    if (velocityVotes.length >= VOTE_SECURITY_CONFIG.COORDINATION.VOTING_VELOCITY_THRESHOLD) {
      analysis.suspicious = true;
      analysis.reasons.push('Unusual voting velocity detected');
      analysis.riskScore += 40;
    }
  }

  /**
   * Check behavioral patterns
   */
  checkBehavioralPatterns(analysis, req) {
    // Check for immediate voting (no content interaction)
    const contentViewTime = req.headers['x-content-view-time'];
    if (contentViewTime && parseInt(contentViewTime) < VOTE_SECURITY_CONFIG.BEHAVIOR.SUSPICIOUS_INDICATORS.IMMEDIATE_VOTING) {
      analysis.suspicious = true;
      analysis.reasons.push('Voting without sufficient content interaction');
      analysis.riskScore += 30;
    }

    // Check user agent consistency
    const userAgent = analysis.userAgent;
    const userId = analysis.userId;
    
    if (this.votingHistory.has(userId)) {
      const userVotes = this.votingHistory.get(userId);
      const recentVotes = userVotes.slice(-10); // Last 10 votes
      
      const userAgentVariations = new Set(recentVotes.map(vote => vote.userAgent));
      if (userAgentVariations.size > 3) { // Too many different user agents
        analysis.suspicious = true;
        analysis.reasons.push('Inconsistent user agent patterns');
        analysis.riskScore += 25;
      }
    }

    // Check vote distribution
    if (this.votingHistory.has(userId)) {
      const userVotes = this.votingHistory.get(userId);
      const recentVotes = userVotes.filter(vote => 
        Date.now() - vote.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
      );

      if (recentVotes.length > 10) {
        const upVotes = recentVotes.filter(vote => vote.voteType === 'up').length;
        const downVotes = recentVotes.filter(vote => vote.voteType === 'down').length;
        const upVoteRatio = upVotes / (upVotes + downVotes);

        const normalRatio = VOTE_SECURITY_CONFIG.BEHAVIOR.NORMAL_VOTE_DISTRIBUTION.UP_VOTE_RATIO;
        if (upVoteRatio < normalRatio.min || upVoteRatio > normalRatio.max) {
          analysis.suspicious = true;
          analysis.reasons.push('Abnormal vote distribution pattern');
          analysis.riskScore += 20;
        }
      }
    }
  }

  /**
   * Check IP-based patterns
   */
  checkIPPatterns(analysis) {
    const ip = analysis.ip;
    
    // Check for patterns across different users from same IP
    const allIPVotes = this.realtimeVoteQueue.filter(vote => 
      vote.ip === ip && 
      Date.now() - vote.timestamp < 60 * 60 * 1000 // Last hour
    );

    // Multiple users from same IP
    const uniqueUsers = new Set(allIPVotes.map(vote => vote.userId));
    if (uniqueUsers.size > 5) {
      analysis.suspicious = true;
      analysis.reasons.push('Multiple users voting from same IP');
      analysis.riskScore += 25;
    }

    // Similar voting patterns from same IP
    const sameTypeVotes = allIPVotes.filter(vote => vote.voteType === analysis.voteType);
    if (sameTypeVotes.length >= 10) {
      analysis.suspicious = true;
      analysis.reasons.push('Repetitive voting patterns from IP');
      analysis.riskScore += 20;
    }
  }

  /**
   * Calculate overall risk score
   */
  calculateRiskScore(analysis) {
    let score = analysis.riskScore;

    // Adjust based on user reputation (if available)
    if (analysis.userReputation) {
      if (analysis.userReputation < 0) {
        score += 20; // Negative reputation increases risk
      } else if (analysis.userReputation > VOTE_SECURITY_CONFIG.PATTERNS.REPUTATION_THRESHOLD) {
        score = Math.max(0, score - 10); // Good reputation reduces risk
      }
    }

    // Adjust based on account age (if available)
    if (analysis.accountAge) {
      if (analysis.accountAge < 7 * 24 * 60 * 60 * 1000) { // Less than 7 days
        score += 15;
      }
    }

    // Premium user adjustment
    if (analysis.userTier === 'premium' || analysis.userTier === 'vip') {
      score = Math.max(0, score - 5);
    }

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Update voting history
   */
  updateVotingHistory(analysis) {
    const userId = analysis.userId;
    const contentId = analysis.contentId;
    const ip = analysis.ip;

    // Update user voting history
    if (!this.votingHistory.has(userId)) {
      this.votingHistory.set(userId, []);
    }
    this.votingHistory.get(userId).push({
      contentId,
      voteType: analysis.voteType,
      timestamp: analysis.timestamp,
      mlgAmount: analysis.mlgAmount,
      userAgent: analysis.userAgent,
      riskScore: analysis.riskScore
    });

    // Update content voting patterns
    if (!this.contentVotingPatterns.has(contentId)) {
      this.contentVotingPatterns.set(contentId, []);
    }
    this.contentVotingPatterns.get(contentId).push({
      userId,
      voteType: analysis.voteType,
      timestamp: analysis.timestamp,
      ip,
      riskScore: analysis.riskScore
    });

    // Update IP voting history
    if (!this.ipVotingHistory.has(ip)) {
      this.ipVotingHistory.set(ip, []);
    }
    this.ipVotingHistory.get(ip).push({
      userId,
      contentId,
      voteType: analysis.voteType,
      timestamp: analysis.timestamp,
      riskScore: analysis.riskScore
    });

    // Store suspicious patterns
    if (analysis.suspicious) {
      const patternKey = `${userId}:${Date.now()}`;
      this.suspiciousPatterns.set(patternKey, analysis);
    }
  }

  /**
   * Start real-time analysis loop
   */
  startAnalysisLoop() {
    setInterval(() => {
      this.performBatchAnalysis();
      this.cleanupOldData();
    }, VOTE_SECURITY_CONFIG.REALTIME.PATTERN_ANALYSIS_INTERVAL);
  }

  /**
   * Perform batch analysis on recent votes
   */
  performBatchAnalysis() {
    if (this.realtimeVoteQueue.length === 0) return;

    const batchSize = VOTE_SECURITY_CONFIG.REALTIME.ANALYSIS_BATCH_SIZE;
    const batch = this.realtimeVoteQueue.slice(0, batchSize);

    // Analyze cross-user patterns
    this.analyzeCrossUserPatterns(batch);

    // Remove processed votes from queue
    this.realtimeVoteQueue.splice(0, batchSize);
  }

  /**
   * Analyze patterns across multiple users
   */
  analyzeCrossUserPatterns(batch) {
    // Group by content
    const contentGroups = batch.reduce((groups, vote) => {
      if (!groups[vote.contentId]) {
        groups[vote.contentId] = [];
      }
      groups[vote.contentId].push(vote);
      return groups;
    }, {});

    // Analyze each content group
    for (const [contentId, votes] of Object.entries(contentGroups)) {
      if (votes.length >= 5) { // Enough votes to analyze
        this.detectCoordinatedAttacks(contentId, votes);
        this.detectBotNetworks(contentId, votes);
      }
    }
  }

  /**
   * Detect coordinated attacks on content
   */
  detectCoordinatedAttacks(contentId, votes) {
    // Check time clustering
    const timeWindows = this.groupByTimeWindow(votes, 60000); // 1-minute windows
    
    for (const window of timeWindows) {
      if (window.length >= 5) {
        // Check for suspicious patterns within window
        const uniqueIPs = new Set(window.map(vote => vote.ip));
        const uniqueUsers = new Set(window.map(vote => vote.userId));
        
        if (uniqueIPs.size < uniqueUsers.size * 0.5) {
          console.warn(`Coordinated attack detected on content ${contentId}:`, {
            votes: window.length,
            uniqueIPs: uniqueIPs.size,
            uniqueUsers: uniqueUsers.size,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  }

  /**
   * Detect bot networks
   */
  detectBotNetworks(contentId, votes) {
    // Analyze behavioral similarity
    const behaviorPatterns = votes.map(vote => ({
      userId: vote.userId,
      timingPattern: this.extractTimingPattern(vote.userId),
      votePattern: this.extractVotePattern(vote.userId),
      similarity: 0
    }));

    // Calculate similarity between users
    for (let i = 0; i < behaviorPatterns.length; i++) {
      for (let j = i + 1; j < behaviorPatterns.length; j++) {
        const similarity = this.calculateBehaviorSimilarity(
          behaviorPatterns[i],
          behaviorPatterns[j]
        );
        
        if (similarity > VOTE_SECURITY_CONFIG.COORDINATION.BEHAVIORAL_SIMILARITY_THRESHOLD) {
          console.warn(`Potential bot network detected:`, {
            user1: behaviorPatterns[i].userId,
            user2: behaviorPatterns[j].userId,
            similarity,
            contentId
          });
        }
      }
    }
  }

  /**
   * Group votes by time windows
   */
  groupByTimeWindow(votes, windowSize) {
    const windows = [];
    const sortedVotes = votes.sort((a, b) => a.timestamp - b.timestamp);
    
    let currentWindow = [];
    let windowStart = sortedVotes[0]?.timestamp;

    for (const vote of sortedVotes) {
      if (vote.timestamp - windowStart <= windowSize) {
        currentWindow.push(vote);
      } else {
        if (currentWindow.length > 0) {
          windows.push(currentWindow);
        }
        currentWindow = [vote];
        windowStart = vote.timestamp;
      }
    }

    if (currentWindow.length > 0) {
      windows.push(currentWindow);
    }

    return windows;
  }

  /**
   * Extract timing pattern for user
   */
  extractTimingPattern(userId) {
    if (!this.votingHistory.has(userId)) return {};

    const votes = this.votingHistory.get(userId).slice(-20); // Last 20 votes
    if (votes.length < 2) return {};

    const intervals = [];
    for (let i = 1; i < votes.length; i++) {
      intervals.push(votes[i].timestamp - votes[i-1].timestamp);
    }

    return {
      avgInterval: intervals.reduce((a, b) => a + b, 0) / intervals.length,
      variance: this.calculateVariance(intervals),
      pattern: this.detectPattern(intervals)
    };
  }

  /**
   * Extract vote pattern for user
   */
  extractVotePattern(userId) {
    if (!this.votingHistory.has(userId)) return {};

    const votes = this.votingHistory.get(userId).slice(-20);
    const upVotes = votes.filter(vote => vote.voteType === 'up').length;
    const downVotes = votes.filter(vote => vote.voteType === 'down').length;

    return {
      upVoteRatio: upVotes / votes.length,
      avgMlgAmount: votes.reduce((sum, vote) => sum + parseFloat(vote.mlgAmount || 0), 0) / votes.length,
      consistency: this.calculatePatternConsistency(votes)
    };
  }

  /**
   * Calculate behavior similarity between users
   */
  calculateBehaviorSimilarity(pattern1, pattern2) {
    // Simple similarity calculation (can be enhanced)
    let similarity = 0;
    let factors = 0;

    // Timing similarity
    if (pattern1.timingPattern.avgInterval && pattern2.timingPattern.avgInterval) {
      const timingDiff = Math.abs(pattern1.timingPattern.avgInterval - pattern2.timingPattern.avgInterval);
      const maxInterval = Math.max(pattern1.timingPattern.avgInterval, pattern2.timingPattern.avgInterval);
      similarity += (1 - timingDiff / maxInterval) * 0.4;
      factors += 0.4;
    }

    // Vote pattern similarity
    if (pattern1.votePattern.upVoteRatio !== undefined && pattern2.votePattern.upVoteRatio !== undefined) {
      const ratioDiff = Math.abs(pattern1.votePattern.upVoteRatio - pattern2.votePattern.upVoteRatio);
      similarity += (1 - ratioDiff) * 0.3;
      factors += 0.3;
    }

    // MLG amount similarity
    if (pattern1.votePattern.avgMlgAmount && pattern2.votePattern.avgMlgAmount) {
      const amountDiff = Math.abs(pattern1.votePattern.avgMlgAmount - pattern2.votePattern.avgMlgAmount);
      const maxAmount = Math.max(pattern1.votePattern.avgMlgAmount, pattern2.votePattern.avgMlgAmount);
      if (maxAmount > 0) {
        similarity += (1 - amountDiff / maxAmount) * 0.3;
        factors += 0.3;
      }
    }

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Calculate variance of an array
   */
  calculateVariance(values) {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Detect pattern in intervals (simplified)
   */
  detectPattern(intervals) {
    // Simple pattern detection - can be enhanced
    const uniqueIntervals = [...new Set(intervals)];
    return {
      hasPattern: uniqueIntervals.length < intervals.length * 0.5,
      complexity: uniqueIntervals.length / intervals.length
    };
  }

  /**
   * Calculate pattern consistency
   */
  calculatePatternConsistency(votes) {
    if (votes.length < 3) return 0;
    
    // Check consistency in vote types
    const voteTypeChanges = votes.slice(1).filter((vote, index) => 
      vote.voteType !== votes[index].voteType
    ).length;
    
    return 1 - (voteTypeChanges / (votes.length - 1));
  }

  /**
   * Cleanup old data
   */
  cleanupOldData() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Cleanup voting history
    for (const [userId, votes] of this.votingHistory.entries()) {
      const recentVotes = votes.filter(vote => now - vote.timestamp < maxAge);
      if (recentVotes.length === 0) {
        this.votingHistory.delete(userId);
      } else {
        this.votingHistory.set(userId, recentVotes);
      }
    }

    // Cleanup content patterns
    for (const [contentId, votes] of this.contentVotingPatterns.entries()) {
      const recentVotes = votes.filter(vote => now - vote.timestamp < maxAge);
      if (recentVotes.length === 0) {
        this.contentVotingPatterns.delete(contentId);
      } else {
        this.contentVotingPatterns.set(contentId, recentVotes);
      }
    }

    // Cleanup IP history
    for (const [ip, votes] of this.ipVotingHistory.entries()) {
      const recentVotes = votes.filter(vote => now - vote.timestamp < maxAge);
      if (recentVotes.length === 0) {
        this.ipVotingHistory.delete(ip);
      } else {
        this.ipVotingHistory.set(ip, recentVotes);
      }
    }

    // Cleanup suspicious patterns
    for (const [key, pattern] of this.suspiciousPatterns.entries()) {
      if (now - pattern.timestamp > maxAge) {
        this.suspiciousPatterns.delete(key);
      }
    }

    // Cleanup real-time queue
    this.realtimeVoteQueue = this.realtimeVoteQueue.filter(vote => 
      now - vote.timestamp < 60 * 60 * 1000 // Keep last hour
    );
  }

  /**
   * Get analytics data
   */
  getAnalytics() {
    return {
      totalUsers: this.votingHistory.size,
      totalContent: this.contentVotingPatterns.size,
      suspiciousPatterns: this.suspiciousPatterns.size,
      queueSize: this.realtimeVoteQueue.length,
      recentActivity: {
        lastHour: this.realtimeVoteQueue.filter(vote => 
          Date.now() - vote.timestamp < 60 * 60 * 1000
        ).length,
        suspicious: this.realtimeVoteQueue.filter(vote => 
          vote.suspicious && Date.now() - vote.timestamp < 60 * 60 * 1000
        ).length
      }
    };
  }
}

// Initialize vote pattern analyzer
const votePatternAnalyzer = new VotePatternAnalyzer();

/**
 * Vote protection middleware
 */
export const voteProtectionMiddleware = (req, res, next) => {
  try {
    const { contentId, voteType, mlgAmount } = req.body;
    const userId = req.user?.id;
    const walletAddress = req.user?.walletAddress;

    if (!userId || !walletAddress || !contentId || !voteType || !mlgAmount) {
      return res.status(400).json({
        error: 'Missing required vote parameters',
        code: 'MISSING_VOTE_PARAMS'
      });
    }

    // Analyze voting pattern
    const analysis = votePatternAnalyzer.analyzeVotingPattern(
      userId, 
      walletAddress, 
      contentId, 
      voteType, 
      mlgAmount, 
      req
    );

    // Check if vote should be blocked
    if (analysis.suspicious && analysis.riskScore >= 70) {
      return res.status(429).json({
        error: 'Vote blocked due to suspicious activity',
        code: 'SUSPICIOUS_VOTE_BLOCKED',
        reasons: analysis.reasons,
        riskScore: analysis.riskScore,
        retryAfter: 300 // 5 minutes
      });
    }

    // Add analysis to request for logging
    req.voteAnalysis = analysis;

    // Log suspicious but not blocked votes
    if (analysis.suspicious) {
      console.warn('Suspicious vote detected but allowed:', {
        userId,
        contentId,
        riskScore: analysis.riskScore,
        reasons: analysis.reasons
      });
    }

    next();

  } catch (error) {
    console.error('Vote protection middleware error:', error);
    return res.status(500).json({
      error: 'Vote protection system error',
      code: 'VOTE_PROTECTION_ERROR'
    });
  }
};

/**
 * Vote analytics endpoint middleware
 */
export const voteAnalyticsMiddleware = (req, res, next) => {
  if (!req.user?.roles?.includes('admin') && !req.user?.roles?.includes('moderator')) {
    return res.status(403).json({
      error: 'Insufficient permissions for vote analytics',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }

  req.voteAnalytics = votePatternAnalyzer.getAnalytics();
  next();
};

/**
 * Get vote pattern analyzer instance
 */
export const getVotePatternAnalyzer = () => votePatternAnalyzer;

export default {
  voteProtectionMiddleware,
  voteAnalyticsMiddleware,
  getVotePatternAnalyzer
};