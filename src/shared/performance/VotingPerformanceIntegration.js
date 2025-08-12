/**
 * Voting Performance Integration
 * 
 * Specialized performance monitoring for voting operations in MLG.clan platform.
 * Tracks vote-to-confirmation latency, MLG burning performance, and competitive voting scenarios.
 * 
 * @author Claude Code - Analytics Architect
 * @version 1.0.0
 * @created 2025-08-12
 */

import { performanceIntegration } from './PerformanceIntegration.js';

export class VotingPerformanceIntegration {
  constructor() {
    this.activeVoteTrackers = new Map();
    this.votePerformanceHistory = [];
    this.competitiveVotingActive = false;
  }

  /**
   * Initialize voting performance monitoring
   */
  async initialize() {
    // Setup vote button click handlers
    this.setupVoteButtonTracking();
    
    // Setup wallet interaction tracking
    this.setupWalletTracking();
    
    // Setup competitive voting detection
    this.setupCompetitiveDetection();
    
    console.log('Voting performance integration initialized');
  }

  /**
   * Setup performance tracking for vote buttons
   */
  setupVoteButtonTracking() {
    // Track all vote buttons
    document.addEventListener('click', (event) => {
      const voteButton = event.target.closest('[data-vote-type]');
      if (voteButton) {
        this.trackVoteButtonClick(voteButton, event);
      }
    });
    
    // Track vote confirmation buttons
    document.addEventListener('click', (event) => {
      const confirmButton = event.target.closest('[data-confirm-vote]');
      if (confirmButton) {
        this.trackVoteConfirmation(confirmButton, event);
      }
    });
  }

  /**
   * Track vote button click performance
   */
  trackVoteButtonClick(button, event) {
    const voteData = {
      voteType: button.dataset.voteType,
      targetType: button.dataset.targetType || 'content',
      targetId: button.dataset.targetId,
      contentId: button.dataset.contentId,
      proposalId: button.dataset.proposalId,
      userId: this.getCurrentUserId(),
      isCompetitive: this.competitiveVotingActive,
      buttonPosition: this.getButtonPosition(button),
      timestamp: Date.now()
    };
    
    // Start vote tracking
    const timingId = performanceIntegration.trackVoteOperation(voteData);
    
    // Store tracking info
    this.activeVoteTrackers.set(button.dataset.targetId, {
      timingId,
      voteData,
      startTime: performance.now(),
      phase: 'button_click'
    });
    
    // Mark UI response immediately
    setTimeout(() => {
      if (performanceIntegration.gamingMetricsTracker.markVoteUIResponse) {
        performanceIntegration.gamingMetricsTracker.markVoteUIResponse(timingId);
      }
    }, 0);
    
    return timingId;
  }

  /**
   * Track vote confirmation performance
   */
  trackVoteConfirmation(button, event) {
    const targetId = button.dataset.targetId || button.dataset.contentId;
    const tracker = this.activeVoteTrackers.get(targetId);
    
    if (!tracker) return;
    
    // Update tracking phase
    tracker.phase = 'confirmation';
    tracker.confirmationTime = performance.now();
    
    // Track MLG amount if specified
    const mlgInput = document.querySelector(`[data-mlg-input="${targetId}"]`);
    if (mlgInput) {
      tracker.voteData.mlgAmount = parseFloat(mlgInput.value) || 0;
      
      // Mark as high stakes if large amount
      if (tracker.voteData.mlgAmount > 1000) {
        tracker.voteData.isHighStakes = true;
        performanceIntegration.trackHighValueOperation('vote_confirmation', tracker.voteData.mlgAmount, {
          targetId,
          voteType: tracker.voteData.voteType
        });
      }
    }
    
    // Mark validation phase
    if (performanceIntegration.gamingMetricsTracker.markVoteValidation) {
      performanceIntegration.gamingMetricsTracker.markVoteValidation(tracker.timingId);
    }
  }

  /**
   * Track wallet interaction for voting
   */
  setupWalletTracking() {
    // Listen for wallet events
    document.addEventListener('wallet:transaction:started', (event) => {
      this.handleWalletTransactionStart(event.detail);
    });
    
    document.addEventListener('wallet:transaction:confirmed', (event) => {
      this.handleWalletTransactionConfirm(event.detail);
    });
    
    document.addEventListener('wallet:transaction:failed', (event) => {
      this.handleWalletTransactionFailed(event.detail);
    });
  }

  /**
   * Handle wallet transaction start
   */
  handleWalletTransactionStart(transactionData) {
    const targetId = transactionData.targetId || transactionData.metadata?.targetId;
    const tracker = this.activeVoteTrackers.get(targetId);
    
    if (tracker) {
      tracker.phase = 'blockchain_submission';
      tracker.blockchainStartTime = performance.now();
      
      // Mark blockchain phase
      if (performanceIntegration.gamingMetricsTracker.markVoteBlockchain) {
        performanceIntegration.gamingMetricsTracker.markVoteBlockchain(
          tracker.timingId, 
          transactionData.signature
        );
      }
      
      // Track wallet performance separately
      const walletData = {
        operation: 'vote_transaction',
        walletType: transactionData.walletType || 'phantom',
        transactionType: 'burn_vote',
        amount: tracker.voteData.mlgAmount || 0,
        userId: tracker.voteData.userId,
        isHighValue: tracker.voteData.isHighStakes
      };
      
      const walletTimingId = performanceIntegration.trackWalletOperation(walletData);
      tracker.walletTimingId = walletTimingId;
    }
  }

  /**
   * Handle wallet transaction confirmation
   */
  handleWalletTransactionConfirm(transactionData) {
    const targetId = transactionData.targetId || transactionData.metadata?.targetId;
    const tracker = this.activeVoteTrackers.get(targetId);
    
    if (tracker) {
      const endTime = performance.now();
      tracker.phase = 'completed';
      tracker.endTime = endTime;
      tracker.success = true;
      
      // Complete vote tracking
      const voteResult = performanceIntegration.completeOperationTracking(
        'vote',
        tracker.timingId,
        true,
        null
      );
      
      // Complete wallet tracking
      if (tracker.walletTimingId) {
        performanceIntegration.completeOperationTracking(
          'wallet',
          tracker.walletTimingId,
          true,
          null
        );
      }
      
      // Record performance metrics
      this.recordVotePerformanceMetrics(tracker, voteResult);
      
      // Clean up tracker
      this.activeVoteTrackers.delete(targetId);
    }
  }

  /**
   * Handle wallet transaction failure
   */
  handleWalletTransactionFailed(transactionData) {
    const targetId = transactionData.targetId || transactionData.metadata?.targetId;
    const tracker = this.activeVoteTrackers.get(targetId);
    
    if (tracker) {
      const error = new Error(transactionData.error || 'Transaction failed');
      tracker.phase = 'failed';
      tracker.success = false;
      tracker.error = error;
      
      // Complete vote tracking with error
      performanceIntegration.completeOperationTracking(
        'vote',
        tracker.timingId,
        false,
        error
      );
      
      // Complete wallet tracking with error
      if (tracker.walletTimingId) {
        performanceIntegration.completeOperationTracking(
          'wallet',
          tracker.walletTimingId,
          false,
          error
        );
      }
      
      // Clean up tracker
      this.activeVoteTrackers.delete(targetId);
    }
  }

  /**
   * Record detailed vote performance metrics
   */
  recordVotePerformanceMetrics(tracker, voteResult) {
    const performanceData = {
      targetId: tracker.voteData.targetId,
      voteType: tracker.voteData.voteType,
      totalDuration: tracker.endTime - tracker.startTime,
      uiResponseTime: tracker.confirmationTime - tracker.startTime,
      blockchainTime: tracker.endTime - (tracker.blockchainStartTime || tracker.confirmationTime),
      mlgAmount: tracker.voteData.mlgAmount || 0,
      isCompetitive: tracker.voteData.isCompetitive,
      isHighStakes: tracker.voteData.isHighStakes,
      success: tracker.success,
      error: tracker.error?.message,
      timestamp: Date.now()
    };
    
    // Add to performance history
    this.votePerformanceHistory.push(performanceData);
    
    // Keep only recent history
    if (this.votePerformanceHistory.length > 100) {
      this.votePerformanceHistory.shift();
    }
    
    // Analyze performance
    this.analyzeVotePerformance(performanceData);
    
    // Emit performance event
    document.dispatchEvent(new CustomEvent('vote:performance:recorded', {
      detail: performanceData
    }));
  }

  /**
   * Analyze vote performance for insights
   */
  analyzeVotePerformance(performanceData) {
    // Check for slow vote performance
    if (performanceData.totalDuration > 5000) { // 5 seconds
      this.createVotePerformanceAlert('slow_vote', performanceData, 'Vote took longer than expected');
    }
    
    // Check for high-stakes performance issues
    if (performanceData.isHighStakes && performanceData.totalDuration > 3000) {
      this.createVotePerformanceAlert('high_stakes_slow', performanceData, 'High-value vote experienced delays');
    }
    
    // Check for competitive voting issues
    if (performanceData.isCompetitive && performanceData.totalDuration > 2000) {
      this.createVotePerformanceAlert('competitive_slow', performanceData, 'Vote delay during competitive scenario');
    }
    
    // Check for blockchain delays
    if (performanceData.blockchainTime > 10000) { // 10 seconds
      this.createVotePerformanceAlert('blockchain_delay', performanceData, 'Blockchain confirmation took too long');
    }
  }

  /**
   * Create vote-specific performance alert
   */
  createVotePerformanceAlert(alertType, performanceData, message) {
    if (performanceIntegration.alertSystem) {
      performanceIntegration.alertSystem.createPerformanceAlert({
        type: `vote_${alertType}`,
        category: 'gaming',
        metric: 'vote_latency',
        value: performanceData.totalDuration,
        level: this.determineAlertLevel(performanceData),
        message,
        data: performanceData,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Determine alert level based on performance data
   */
  determineAlertLevel(performanceData) {
    if (performanceData.totalDuration > 10000) return 'critical';
    if (performanceData.totalDuration > 5000) return 'high';
    if (performanceData.totalDuration > 3000) return 'medium';
    return 'low';
  }

  /**
   * Setup competitive voting detection
   */
  setupCompetitiveDetection() {
    // Listen for tournament events
    document.addEventListener('tournament:started', () => {
      this.competitiveVotingActive = true;
      performanceIntegration.setCompetitiveContext(true, { type: 'tournament' });
    });
    
    document.addEventListener('tournament:ended', () => {
      this.competitiveVotingActive = false;
      performanceIntegration.setCompetitiveContext(false);
    });
    
    // Detect high-activity voting periods
    this.monitorVotingActivity();
  }

  /**
   * Monitor voting activity levels
   */
  monitorVotingActivity() {
    setInterval(() => {
      const recentVotes = this.votePerformanceHistory.filter(vote => 
        Date.now() - vote.timestamp < 300000 // Last 5 minutes
      );
      
      // If more than 10 votes in 5 minutes, consider it competitive
      if (recentVotes.length > 10 && !this.competitiveVotingActive) {
        this.competitiveVotingActive = true;
        performanceIntegration.setCompetitiveContext(true, { type: 'high_activity' });
        
        // Auto-disable after period of low activity
        setTimeout(() => {
          if (this.competitiveVotingActive) {
            this.competitiveVotingActive = false;
            performanceIntegration.setCompetitiveContext(false);
          }
        }, 600000); // 10 minutes
      }
    }, 60000); // Check every minute
  }

  /**
   * Get button position for UI analytics
   */
  getButtonPosition(button) {
    const rect = button.getBoundingClientRect();
    return {
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.top + rect.height / 2),
      visible: rect.top >= 0 && rect.left >= 0 && 
               rect.bottom <= window.innerHeight && 
               rect.right <= window.innerWidth
    };
  }

  /**
   * Get current user ID for tracking
   */
  getCurrentUserId() {
    // Try to get from wallet connection
    if (window.solanaWallet?.publicKey) {
      return window.solanaWallet.publicKey.toString();
    }
    
    // Try to get from session
    if (window.currentUser?.id) {
      return window.currentUser.id;
    }
    
    // Generate session-based ID
    let sessionId = sessionStorage.getItem('mlg_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('mlg_session_id', sessionId);
    }
    
    return sessionId;
  }

  /**
   * Get voting performance summary
   */
  getVotePerformanceSummary() {
    const recentVotes = this.votePerformanceHistory.filter(vote => 
      Date.now() - vote.timestamp < 3600000 // Last hour
    );
    
    if (recentVotes.length === 0) {
      return {
        count: 0,
        averageDuration: 0,
        successRate: 100,
        competitiveVotes: 0,
        highStakesVotes: 0
      };
    }
    
    const totalDuration = recentVotes.reduce((sum, vote) => sum + vote.totalDuration, 0);
    const successfulVotes = recentVotes.filter(vote => vote.success).length;
    const competitiveVotes = recentVotes.filter(vote => vote.isCompetitive).length;
    const highStakesVotes = recentVotes.filter(vote => vote.isHighStakes).length;
    
    return {
      count: recentVotes.length,
      averageDuration: Math.round(totalDuration / recentVotes.length),
      successRate: Math.round((successfulVotes / recentVotes.length) * 100),
      competitiveVotes,
      highStakesVotes,
      medianDuration: this.calculateMedian(recentVotes.map(v => v.totalDuration)),
      p95Duration: this.calculateP95(recentVotes.map(v => v.totalDuration))
    };
  }

  /**
   * Calculate median duration
   */
  calculateMedian(durations) {
    const sorted = [...durations].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? 
      (sorted[mid - 1] + sorted[mid]) / 2 : 
      sorted[mid];
  }

  /**
   * Calculate 95th percentile duration
   */
  calculateP95(durations) {
    const sorted = [...durations].sort((a, b) => a - b);
    const index = Math.ceil(0.95 * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * Export voting performance data
   */
  exportVotePerformanceData() {
    return {
      summary: this.getVotePerformanceSummary(),
      recentHistory: this.votePerformanceHistory.slice(-50), // Last 50 votes
      activeTrackers: this.activeVoteTrackers.size,
      competitiveMode: this.competitiveVotingActive,
      exportTimestamp: Date.now()
    };
  }

  /**
   * Clean up tracking data
   */
  cleanup() {
    this.activeVoteTrackers.clear();
    this.votePerformanceHistory = [];
    this.competitiveVotingActive = false;
  }
}

// Create singleton instance
const votingPerformanceIntegration = new VotingPerformanceIntegration();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    votingPerformanceIntegration.initialize();
  });
} else {
  votingPerformanceIntegration.initialize();
}

// Expose for external access
window.votingPerformanceIntegration = votingPerformanceIntegration;

export { votingPerformanceIntegration };
export default votingPerformanceIntegration;