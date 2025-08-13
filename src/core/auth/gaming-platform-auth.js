/**
 * Gaming Platform Features Authentication for MLG.clan
 * Specialized authentication for tournaments, clans, voting, and gaming features
 * 
 * Features:
 * - Tournament participant authentication and verification
 * - Clan member role-based authentication
 * - Voting system authentication (burn-to-vote)
 * - Leaderboard authentication and integrity
 * - Gaming chat authentication and moderation
 * - Achievement and NFT-based access controls
 * 
 * @author Claude Code - Security and Performance Auditor
 * @version 2.0.0
 * @created 2025-08-13
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';

/**
 * Gaming Platform Authentication Configuration
 */
const GAMING_PLATFORM_AUTH_CONFIG = {
  // Tournament Authentication
  TOURNAMENT: {
    eligibilityRequirements: {
      minMLGTokens: 50,
      maxParticipants: 1000,
      registrationWindow: 24 * 60 * 60 * 1000, // 24 hours
      mfaRequired: true,
      verificationTimeout: 10 * 60 * 1000 // 10 minutes
    },
    permissions: {
      view_tournament: ['participant', 'organizer', 'admin'],
      join_tournament: ['participant', 'organizer', 'admin'],
      manage_tournament: ['organizer', 'admin'],
      broadcast_tournament: ['organizer', 'admin'],
      moderate_tournament: ['moderator', 'admin']
    },
    security: {
      antiCheatRequired: true,
      streamProofRequired: false,
      deviceLockdown: true,
      sessionIsolation: true
    }
  },
  
  // Clan Authentication
  CLAN: {
    roles: {
      member: {
        name: 'Member',
        level: 1,
        permissions: ['view_clan', 'chat', 'participate_events']
      },
      officer: {
        name: 'Officer', 
        level: 2,
        permissions: ['view_clan', 'chat', 'participate_events', 'invite_members', 'moderate_chat']
      },
      admin: {
        name: 'Admin',
        level: 3,
        permissions: ['view_clan', 'chat', 'participate_events', 'invite_members', 'moderate_chat', 'manage_roles', 'clan_settings']
      },
      owner: {
        name: 'Owner',
        level: 4,
        permissions: ['*'] // All permissions
      }
    },
    requirements: {
      creation: {
        minMLGTokens: 1000,
        creationFee: 100,
        mfaRequired: true
      },
      joining: {
        inviteRequired: true,
        approvalRequired: true,
        cooldownPeriod: 24 * 60 * 60 * 1000 // 24 hours
      }
    }
  },
  
  // Voting System Authentication
  VOTING: {
    requirements: {
      minMLGTokens: 100,
      burnRequired: true,
      mfaRequired: true,
      walletVerification: true,
      cooldownBetweenVotes: 60 * 60 * 1000 // 1 hour
    },
    voteTypes: {
      governance: {
        name: 'Governance Vote',
        minTokensBurn: 10,
        maxTokensBurn: 1000,
        votePower: 'linear' // linear with tokens burned
      },
      content: {
        name: 'Content Vote',
        minTokensBurn: 1,
        maxTokensBurn: 100,
        votePower: 'logarithmic'
      },
      tournament: {
        name: 'Tournament Vote',
        minTokensBurn: 5,
        maxTokensBurn: 500,
        votePower: 'linear'
      }
    }
  },
  
  // Leaderboard Authentication
  LEADERBOARD: {
    submission: {
      verificationRequired: true,
      antiCheatCheck: true,
      witnessRequired: false,
      screenshotRequired: true
    },
    integrity: {
      duplicateCheck: true,
      timeWindowCheck: true,
      scoreValidation: true,
      behaviorAnalysis: true
    }
  },
  
  // Gaming Chat Authentication
  CHAT: {
    moderation: {
      realTimeFiltering: true,
      toxicityDetection: true,
      spamPrevention: true,
      rateLimiting: true
    },
    permissions: {
      global_chat: ['verified_user'],
      clan_chat: ['clan_member'],
      tournament_chat: ['tournament_participant'],
      moderator_chat: ['moderator', 'admin']
    }
  },
  
  // Performance Targets
  PERFORMANCE: {
    authLatency: 200, // milliseconds
    permissionCheck: 50, // milliseconds
    walletVerification: 500, // milliseconds
    bulkOperations: 1000 // milliseconds for batch operations
  }
};

/**
 * Gaming Platform Authentication Events
 */
const GAMING_PLATFORM_EVENTS = {
  TOURNAMENT_JOINED: 'tournament_joined',
  TOURNAMENT_LEFT: 'tournament_left',
  CLAN_ROLE_CHANGED: 'clan_role_changed',
  VOTE_CAST: 'vote_cast',
  LEADERBOARD_SUBMITTED: 'leaderboard_submitted',
  CHAT_MODERATED: 'chat_moderated',
  PERMISSION_DENIED: 'permission_denied',
  SECURITY_VIOLATION: 'security_violation'
};

/**
 * Gaming Platform Authentication Class
 */
class GamingPlatformAuth extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.db = options.db;
    this.redis = options.redis;
    this.logger = options.logger || console;
    this.web3Manager = options.web3Manager;
    this.sessionManager = options.sessionManager;
    this.mfaSystem = options.mfaSystem;
    
    // Performance tracking
    this.metrics = {
      authLatencies: [],
      permissionChecks: [],
      walletVerifications: [],
      successfulOperations: 0,
      failedOperations: 0
    };
    
    // Caching for performance
    this.permissionCache = new Map();
    this.clanRoleCache = new Map();
    this.tournamentCache = new Map();
    
    this.init();
  }
  
  async init() {
    this.logger.info('🎮 Initializing Gaming Platform Authentication...');
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring();
    
    // Load cached data
    await this.loadCachedData();
    
    // Setup cache cleanup
    this.setupCacheCleanup();
    
    this.logger.info('✅ Gaming Platform Authentication initialized');
  }
  
  /**
   * Tournament Authentication
   */
  async authenticateForTournament(userId, tournamentId, action = 'join') {
    const startTime = Date.now();
    
    try {
      // Get tournament details
      const tournament = await this.getTournamentDetails(tournamentId);
      if (!tournament) {
        throw new Error('Tournament not found');
      }
      
      // Check tournament status
      if (tournament.status !== 'registration_open' && action === 'join') {
        throw new Error('Tournament registration is closed');
      }
      
      // Get user info and session
      const user = await this.getUserDetails(userId);
      const session = await this.sessionManager.validateSession(user.sessionToken);
      
      if (!session.valid) {
        throw new Error('Invalid session');
      }
      
      // Check basic eligibility
      await this.checkTournamentEligibility(user, tournament);
      
      // Check permissions
      const hasPermission = await this.checkTournamentPermission(userId, tournamentId, action);
      if (!hasPermission) {
        throw new Error(`No permission for tournament action: ${action}`);
      }
      
      // Verify MFA for tournament entry
      if (action === 'join' && GAMING_PLATFORM_AUTH_CONFIG.TOURNAMENT.eligibilityRequirements.mfaRequired) {
        const mfaVerified = await this.verifyMFAForTournament(userId, tournamentId);
        if (!mfaVerified) {
          throw new Error('MFA verification required for tournament entry');
        }
      }
      
      // Create tournament session
      const tournamentSession = await this.createTournamentSession(userId, tournamentId, action);
      
      const latency = Date.now() - startTime;
      this.metrics.authLatencies.push(latency);
      this.metrics.successfulOperations++;
      
      this.emit(GAMING_PLATFORM_EVENTS.TOURNAMENT_JOINED, {
        userId,
        tournamentId,
        action,
        latency
      });
      
      this.logger.info(`🏆 Tournament authentication success: User ${userId} ${action} tournament ${tournamentId} (${latency}ms)`);
      
      return {
        success: true,
        tournamentSession,
        tournament,
        permissions: await this.getTournamentPermissions(userId, tournamentId)
      };
      
    } catch (error) {
      const latency = Date.now() - startTime;
      this.metrics.authLatencies.push(latency);
      this.metrics.failedOperations++;
      
      this.emit(GAMING_PLATFORM_EVENTS.PERMISSION_DENIED, {
        userId,
        tournamentId,
        action,
        reason: error.message,
        latency
      });
      
      this.logger.error(`Tournament authentication failed:`, error);
      throw error;
    }
  }
  
  /**
   * Clan Authentication
   */
  async authenticateForClan(userId, clanId, action = 'view') {
    const startTime = Date.now();
    
    try {
      // Get clan membership and role
      const membership = await this.getClanMembership(userId, clanId);
      const userRole = membership?.role || 'guest';
      
      // Check permissions for action
      const hasPermission = await this.checkClanPermission(userId, clanId, action, userRole);
      if (!hasPermission) {
        throw new Error(`No permission for clan action: ${action}`);
      }
      
      // Create clan session
      const clanSession = await this.createClanSession(userId, clanId, userRole);
      
      const latency = Date.now() - startTime;
      this.metrics.authLatencies.push(latency);
      this.metrics.successfulOperations++;
      
      this.logger.info(`🛡️ Clan authentication success: User ${userId} ${action} clan ${clanId} as ${userRole} (${latency}ms)`);
      
      return {
        success: true,
        clanSession,
        membership,
        role: userRole,
        permissions: await this.getClanPermissions(userRole)
      };
      
    } catch (error) {
      const latency = Date.now() - startTime;
      this.metrics.authLatencies.push(latency);
      this.metrics.failedOperations++;
      
      this.emit(GAMING_PLATFORM_EVENTS.PERMISSION_DENIED, {
        userId,
        clanId,
        action,
        reason: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Voting Authentication (Burn-to-Vote)
   */
  async authenticateForVoting(userId, proposalId, voteData) {
    const startTime = Date.now();
    
    try {
      // Validate vote data
      if (!voteData.tokensBurn || !voteData.walletSignature) {
        throw new Error('Invalid vote data');
      }
      
      // Get proposal details
      const proposal = await this.getProposalDetails(proposalId);
      if (!proposal) {
        throw new Error('Proposal not found');
      }
      
      // Check voting requirements
      await this.checkVotingRequirements(userId, proposal, voteData);
      
      // Verify wallet signature for burn transaction
      const walletVerified = await this.verifyWalletForVoting(userId, voteData);
      if (!walletVerified) {
        throw new Error('Wallet verification failed');
      }
      
      // Verify MFA for voting
      if (GAMING_PLATFORM_AUTH_CONFIG.VOTING.requirements.mfaRequired) {
        const mfaVerified = await this.verifyMFAForVoting(userId, proposalId);
        if (!mfaVerified) {
          throw new Error('MFA verification required for voting');
        }
      }
      
      // Check cooldown period
      const cooldownCheck = await this.checkVotingCooldown(userId);
      if (!cooldownCheck.allowed) {
        throw new Error(`Voting cooldown active. Next vote allowed in ${cooldownCheck.remainingTime}ms`);
      }
      
      // Create voting session
      const votingSession = await this.createVotingSession(userId, proposalId, voteData);
      
      const latency = Date.now() - startTime;
      this.metrics.authLatencies.push(latency);
      this.metrics.successfulOperations++;
      
      this.emit(GAMING_PLATFORM_EVENTS.VOTE_CAST, {
        userId,
        proposalId,
        tokensBurn: voteData.tokensBurn,
        latency
      });
      
      this.logger.info(`🗳️ Voting authentication success: User ${userId} voting on ${proposalId} (${latency}ms)`);
      
      return {
        success: true,
        votingSession,
        proposal,
        votePower: this.calculateVotePower(voteData.tokensBurn, proposal.voteType)
      };
      
    } catch (error) {
      const latency = Date.now() - startTime;
      this.metrics.authLatencies.push(latency);
      this.metrics.failedOperations++;
      
      this.logger.error(`Voting authentication failed:`, error);
      throw error;
    }
  }
  
  /**
   * Leaderboard Authentication
   */
  async authenticateForLeaderboard(userId, gameMode, scoreData) {
    const startTime = Date.now();
    
    try {
      // Validate score submission
      if (!scoreData.score || !scoreData.timestamp || !scoreData.gameSession) {
        throw new Error('Invalid score data');
      }
      
      // Check user session validity
      const session = await this.sessionManager.validateSession(scoreData.sessionToken);
      if (!session.valid) {
        throw new Error('Invalid gaming session');
      }
      
      // Verify anti-cheat requirements
      if (GAMING_PLATFORM_AUTH_CONFIG.LEADERBOARD.submission.antiCheatCheck) {
        const antiCheatPassed = await this.verifyAntiCheat(userId, scoreData);
        if (!antiCheatPassed) {
          throw new Error('Anti-cheat verification failed');
        }
      }
      
      // Verify score integrity
      const integrityCheck = await this.verifyScoreIntegrity(userId, gameMode, scoreData);
      if (!integrityCheck.valid) {
        throw new Error(`Score integrity check failed: ${integrityCheck.reason}`);
      }
      
      // Create leaderboard session
      const leaderboardSession = await this.createLeaderboardSession(userId, gameMode, scoreData);
      
      const latency = Date.now() - startTime;
      this.metrics.authLatencies.push(latency);
      this.metrics.successfulOperations++;
      
      this.emit(GAMING_PLATFORM_EVENTS.LEADERBOARD_SUBMITTED, {
        userId,
        gameMode,
        score: scoreData.score,
        latency
      });
      
      this.logger.info(`🏅 Leaderboard authentication success: User ${userId} submitted score ${scoreData.score} for ${gameMode} (${latency}ms)`);
      
      return {
        success: true,
        leaderboardSession,
        scoreVerified: true,
        ranking: await this.calculateRanking(userId, gameMode, scoreData.score)
      };
      
    } catch (error) {
      const latency = Date.now() - startTime;
      this.metrics.authLatencies.push(latency);
      this.metrics.failedOperations++;
      
      this.logger.error(`Leaderboard authentication failed:`, error);
      throw error;
    }
  }
  
  /**
   * Gaming Chat Authentication
   */
  async authenticateForChat(userId, chatRoom, messageData) {
    const startTime = Date.now();
    
    try {
      // Get chat room details
      const room = await this.getChatRoomDetails(chatRoom);
      if (!room) {
        throw new Error('Chat room not found');
      }
      
      // Check chat permissions
      const hasPermission = await this.checkChatPermission(userId, chatRoom);
      if (!hasPermission) {
        throw new Error('No permission to access this chat room');
      }
      
      // Check rate limiting
      const rateLimitCheck = await this.checkChatRateLimit(userId, chatRoom);
      if (!rateLimitCheck.allowed) {
        throw new Error('Chat rate limit exceeded');
      }
      
      // Moderate message content
      if (GAMING_PLATFORM_AUTH_CONFIG.CHAT.moderation.realTimeFiltering) {
        const moderationResult = await this.moderateMessage(messageData);
        if (!moderationResult.approved) {
          this.emit(GAMING_PLATFORM_EVENTS.CHAT_MODERATED, {
            userId,
            chatRoom,
            reason: moderationResult.reason,
            action: 'message_blocked'
          });
          throw new Error(`Message blocked: ${moderationResult.reason}`);
        }
      }
      
      // Create chat session
      const chatSession = await this.createChatSession(userId, chatRoom);
      
      const latency = Date.now() - startTime;
      this.metrics.authLatencies.push(latency);
      this.metrics.successfulOperations++;
      
      this.logger.info(`💬 Chat authentication success: User ${userId} in ${chatRoom} (${latency}ms)`);
      
      return {
        success: true,
        chatSession,
        room,
        permissions: await this.getChatPermissions(userId, chatRoom)
      };
      
    } catch (error) {
      const latency = Date.now() - startTime;
      this.metrics.authLatencies.push(latency);
      this.metrics.failedOperations++;
      
      throw error;
    }
  }
  
  /**
   * Helper Methods
   */
  
  async checkTournamentEligibility(user, tournament) {
    const requirements = GAMING_PLATFORM_AUTH_CONFIG.TOURNAMENT.eligibilityRequirements;
    
    // Check MLG token balance
    if (user.mlgTokenBalance < requirements.minMLGTokens) {
      throw new Error(`Insufficient MLG tokens. Required: ${requirements.minMLGTokens}, Available: ${user.mlgTokenBalance}`);
    }
    
    // Check tournament capacity
    if (tournament.participants >= requirements.maxParticipants) {
      throw new Error('Tournament is full');
    }
    
    // Check registration window
    const now = Date.now();
    if (now < tournament.registrationStart || now > tournament.registrationEnd) {
      throw new Error('Tournament registration is not open');
    }
    
    // Check user eligibility status
    if (user.banned || user.suspended) {
      throw new Error('User is not eligible to participate');
    }
  }
  
  async checkTournamentPermission(userId, tournamentId, action) {
    const userRole = await this.getUserTournamentRole(userId, tournamentId);
    const requiredRoles = GAMING_PLATFORM_AUTH_CONFIG.TOURNAMENT.permissions[action] || [];
    
    return requiredRoles.includes(userRole) || userRole === 'admin';
  }
  
  async checkClanPermission(userId, clanId, action, userRole) {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = `clan_perm:${userId}:${clanId}:${action}`;
    const cached = this.permissionCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 60000) { // 1 minute cache
      const latency = Date.now() - startTime;
      this.metrics.permissionChecks.push(latency);
      return cached.result;
    }
    
    // Get role permissions
    const roleConfig = GAMING_PLATFORM_AUTH_CONFIG.CLAN.roles[userRole];
    if (!roleConfig) {
      return false;
    }
    
    // Check if role has permission
    const hasPermission = roleConfig.permissions.includes('*') || roleConfig.permissions.includes(action);
    
    // Cache result
    this.permissionCache.set(cacheKey, {
      result: hasPermission,
      timestamp: Date.now()
    });
    
    const latency = Date.now() - startTime;
    this.metrics.permissionChecks.push(latency);
    
    return hasPermission;
  }
  
  async checkVotingRequirements(userId, proposal, voteData) {
    const requirements = GAMING_PLATFORM_AUTH_CONFIG.VOTING.requirements;
    const voteType = GAMING_PLATFORM_AUTH_CONFIG.VOTING.voteTypes[proposal.voteType];
    
    if (!voteType) {
      throw new Error('Invalid vote type');
    }
    
    // Check minimum token burn
    if (voteData.tokensBurn < voteType.minTokensBurn) {
      throw new Error(`Minimum ${voteType.minTokensBurn} MLG tokens required to burn`);
    }
    
    // Check maximum token burn
    if (voteData.tokensBurn > voteType.maxTokensBurn) {
      throw new Error(`Maximum ${voteType.maxTokensBurn} MLG tokens allowed to burn`);
    }
    
    // Check user token balance
    const userBalance = await this.web3Manager.getMLGTokenBalance();
    if (userBalance < voteData.tokensBurn) {
      throw new Error('Insufficient MLG tokens for voting');
    }
  }
  
  async verifyWalletForVoting(userId, voteData) {
    const startTime = Date.now();
    
    try {
      // Verify wallet signature
      const signatureValid = await this.web3Manager.verifyWalletSignature(
        voteData.walletAddress,
        voteData.walletSignature,
        voteData.voteMessage
      );
      
      if (!signatureValid) {
        return false;
      }
      
      // Verify wallet ownership
      const walletOwnership = await this.verifyWalletOwnership(userId, voteData.walletAddress);
      
      const latency = Date.now() - startTime;
      this.metrics.walletVerifications.push(latency);
      
      return walletOwnership;
      
    } catch (error) {
      const latency = Date.now() - startTime;
      this.metrics.walletVerifications.push(latency);
      this.logger.error('Wallet verification failed:', error);
      return false;
    }
  }
  
  async verifyScoreIntegrity(userId, gameMode, scoreData) {
    const config = GAMING_PLATFORM_AUTH_CONFIG.LEADERBOARD.integrity;
    
    // Check for duplicate submissions
    if (config.duplicateCheck) {
      const isDuplicate = await this.checkDuplicateScore(userId, gameMode, scoreData);
      if (isDuplicate) {
        return { valid: false, reason: 'Duplicate score submission' };
      }
    }
    
    // Check time window
    if (config.timeWindowCheck) {
      const timeValid = await this.validateScoreTimestamp(userId, scoreData);
      if (!timeValid) {
        return { valid: false, reason: 'Invalid score timestamp' };
      }
    }
    
    // Validate score range
    if (config.scoreValidation) {
      const scoreValid = await this.validateScoreRange(gameMode, scoreData.score);
      if (!scoreValid) {
        return { valid: false, reason: 'Score outside valid range' };
      }
    }
    
    // Behavior analysis
    if (config.behaviorAnalysis) {
      const behaviorValid = await this.analyzeScoringBehavior(userId, gameMode, scoreData);
      if (!behaviorValid) {
        return { valid: false, reason: 'Suspicious scoring behavior detected' };
      }
    }
    
    return { valid: true };
  }
  
  calculateVotePower(tokensBurn, voteType) {
    const voteConfig = GAMING_PLATFORM_AUTH_CONFIG.VOTING.voteTypes[voteType];
    
    switch (voteConfig.votePower) {
      case 'linear':
        return tokensBurn;
      case 'logarithmic':
        return Math.log2(tokensBurn + 1);
      case 'quadratic':
        return Math.sqrt(tokensBurn);
      default:
        return tokensBurn;
    }
  }
  
  async createTournamentSession(userId, tournamentId, action) {
    return await this.sessionManager.createSession(userId, 'tournament', {
      tournamentId,
      action,
      tournament: true,
      requireMFA: GAMING_PLATFORM_AUTH_CONFIG.TOURNAMENT.eligibilityRequirements.mfaRequired
    });
  }
  
  async createClanSession(userId, clanId, role) {
    return await this.sessionManager.createSession(userId, 'clan', {
      clanId,
      clanRole: role,
      clanManagement: true
    });
  }
  
  async createVotingSession(userId, proposalId, voteData) {
    return await this.sessionManager.createSession(userId, 'voting', {
      proposalId,
      tokensBurn: voteData.tokensBurn,
      voting: true,
      requireWallet: true
    });
  }
  
  async createLeaderboardSession(userId, gameMode, scoreData) {
    return await this.sessionManager.createSession(userId, 'standard', {
      gameMode,
      score: scoreData.score,
      leaderboard: true
    });
  }
  
  async createChatSession(userId, chatRoom) {
    return await this.sessionManager.createSession(userId, 'standard', {
      chatRoom,
      chat: true
    });
  }
  
  setupPerformanceMonitoring() {
    this.metricsInterval = setInterval(() => {
      const avgAuthLatency = this.getAverageLatency(this.metrics.authLatencies);
      const avgPermissionCheck = this.getAverageLatency(this.metrics.permissionChecks);
      const avgWalletVerification = this.getAverageLatency(this.metrics.walletVerifications);
      
      // Check performance targets
      if (avgAuthLatency > GAMING_PLATFORM_AUTH_CONFIG.PERFORMANCE.authLatency) {
        this.emit(GAMING_PLATFORM_EVENTS.SECURITY_VIOLATION, {
          type: 'performance_degradation',
          metric: 'auth_latency',
          value: avgAuthLatency,
          target: GAMING_PLATFORM_AUTH_CONFIG.PERFORMANCE.authLatency
        });
      }
      
      this.logger.debug(`🎮 Platform auth metrics: ${avgAuthLatency}ms auth, ${avgPermissionCheck}ms permissions, ${avgWalletVerification}ms wallet`);
      
      // Clear old metrics
      this.metrics.authLatencies = this.metrics.authLatencies.slice(-100);
      this.metrics.permissionChecks = this.metrics.permissionChecks.slice(-100);
      this.metrics.walletVerifications = this.metrics.walletVerifications.slice(-100);
    }, 30000); // Every 30 seconds
  }
  
  setupCacheCleanup() {
    this.cacheCleanupInterval = setInterval(() => {
      const now = Date.now();
      
      // Clean permission cache
      for (const [key, value] of this.permissionCache) {
        if (now - value.timestamp > 60000) { // 1 minute expiry
          this.permissionCache.delete(key);
        }
      }
      
      // Clean other caches
      this.clanRoleCache.clear();
      this.tournamentCache.clear();
    }, 60000); // Every minute
  }
  
  async loadCachedData() {
    // Pre-load frequently accessed data
    this.logger.info('🔥 Loading cached gaming platform data...');
    
    try {
      // Load active tournaments
      const activeTournaments = await this.getActiveTournaments();
      for (const tournament of activeTournaments) {
        this.tournamentCache.set(tournament.id, tournament);
      }
      
      this.logger.info(`✅ Cached ${activeTournaments.length} active tournaments`);
    } catch (error) {
      this.logger.error('Failed to load cached data:', error);
    }
  }
  
  getAverageLatency(metrics) {
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, latency) => sum + latency, 0) / metrics.length;
  }
  
  getPerformanceMetrics() {
    return {
      averageAuthLatency: this.getAverageLatency(this.metrics.authLatencies),
      averagePermissionCheck: this.getAverageLatency(this.metrics.permissionChecks),
      averageWalletVerification: this.getAverageLatency(this.metrics.walletVerifications),
      successfulOperations: this.metrics.successfulOperations,
      failedOperations: this.metrics.failedOperations,
      successRate: this.metrics.successfulOperations / (this.metrics.successfulOperations + this.metrics.failedOperations),
      cacheSize: this.permissionCache.size
    };
  }
  
  // Placeholder database methods (would be implemented with actual database)
  async getTournamentDetails(tournamentId) {
    return this.tournamentCache.get(tournamentId) || null;
  }
  
  async getUserDetails(userId) {
    // Would query database for user details
    return { id: userId, mlgTokenBalance: 1000 }; // Placeholder
  }
  
  async getClanMembership(userId, clanId) {
    // Would query database for clan membership
    return { role: 'member' }; // Placeholder
  }
  
  async getProposalDetails(proposalId) {
    // Would query database for proposal details
    return { id: proposalId, voteType: 'governance' }; // Placeholder
  }
  
  async getChatRoomDetails(chatRoom) {
    // Would query database for chat room details
    return { id: chatRoom, type: 'general' }; // Placeholder
  }
  
  async getActiveTournaments() {
    // Would query database for active tournaments
    return []; // Placeholder
  }
  
  // Cleanup method
  destroy() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
    }
    
    this.logger.info('🎮 Gaming Platform Authentication destroyed');
  }
}

export default GamingPlatformAuth;
export { GAMING_PLATFORM_AUTH_CONFIG, GAMING_PLATFORM_EVENTS };