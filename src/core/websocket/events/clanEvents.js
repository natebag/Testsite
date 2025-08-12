/**
 * Clan Events Handler for WebSocket Server
 * 
 * Handles clan-specific real-time events for the MLG.clan platform including
 * member management, leaderboard updates, governance events, achievements,
 * and clan activities.
 * 
 * Features:
 * - Clan membership events (join, leave, role changes)
 * - Leaderboard and ranking updates
 * - Governance proposal and voting events
 * - Clan achievement and milestone notifications
 * - Activity feed and communication events
 * - Tournament and competition updates
 * 
 * @author Claude Code - Clan Events Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { EventEmitter } from 'events';

/**
 * Clan Events Handler
 */
export class ClanEventHandler extends EventEmitter {
  constructor(io, options = {}) {
    super();
    
    this.io = io;
    this.roomManager = options.roomManager;
    this.logger = options.logger || console;
    
    // Clan event types
    this.eventTypes = {
      MEMBER_JOINED: 'clan:member_joined',
      MEMBER_LEFT: 'clan:member_left',
      MEMBER_PROMOTED: 'clan:member_promoted',
      MEMBER_DEMOTED: 'clan:member_demoted',
      MEMBER_BANNED: 'clan:member_banned',
      LEADERBOARD_UPDATED: 'clan:leaderboard_updated',
      RANK_CHANGED: 'clan:rank_changed',
      ACHIEVEMENT_UNLOCKED: 'clan:achievement_unlocked',
      MILESTONE_REACHED: 'clan:milestone_reached',
      PROPOSAL_CREATED: 'clan:proposal_created',
      PROPOSAL_VOTED: 'clan:proposal_voted',
      PROPOSAL_EXECUTED: 'clan:proposal_executed',
      TOURNAMENT_STARTED: 'clan:tournament_started',
      TOURNAMENT_ENDED: 'clan:tournament_ended',
      CHALLENGE_ISSUED: 'clan:challenge_issued',
      ACTIVITY_POSTED: 'clan:activity_posted',
      ANNOUNCEMENT: 'clan:announcement',
      WAR_DECLARED: 'clan:war_declared',
      WAR_ENDED: 'clan:war_ended'
    };
    
    // Event statistics
    this.stats = {
      memberJoins: 0,
      memberLeaves: 0,
      promotions: 0,
      demotions: 0,
      leaderboardUpdates: 0,
      achievementsUnlocked: 0,
      proposals: 0,
      tournaments: 0,
      announcements: 0,
      wars: 0
    };
    
    this.logger.info('Clan Events Handler initialized');
  }

  /**
   * Handle clan join request
   */
  handleClanJoin(socket, data) {
    try {
      const { clanId } = data;
      
      if (!clanId) {
        socket.emit('clan:join_failed', { error: 'Clan ID required' });
        return;
      }
      
      // Join clan room
      socket.join(`clan:${clanId}`);
      socket.clanId = clanId;
      
      // Confirm join
      socket.emit('clan:joined', {
        clanId,
        timestamp: new Date().toISOString()
      });
      
      this.logger.info(`Socket ${socket.id} joined clan ${clanId}`);
      
    } catch (error) {
      this.logger.error(`Error handling clan join for ${socket.id}:`, error);
      socket.emit('clan:join_failed', { error: error.message });
    }
  }

  /**
   * Subscribe to clan events
   */
  subscribeToClan(socket, data) {
    try {
      const { clanId, eventTypes = [] } = data;
      
      if (!clanId || !socket.clanId || socket.clanId !== clanId) {
        socket.emit('clan:subscription_failed', { error: 'Not a member of this clan' });
        return;
      }
      
      // Store subscription preferences
      socket.clanEventSubscriptions = eventTypes.length > 0 ? eventTypes : Object.values(this.eventTypes);
      
      socket.emit('clan:subscribed', {
        clanId,
        eventTypes: socket.clanEventSubscriptions,
        timestamp: new Date().toISOString()
      });
      
      this.logger.info(`Socket ${socket.id} subscribed to clan ${clanId} events`);
      
    } catch (error) {
      this.logger.error(`Error subscribing to clan events for ${socket.id}:`, error);
      socket.emit('clan:subscription_failed', { error: error.message });
    }
  }

  /**
   * Handle member joined
   */
  handleMemberJoined(clanId, memberData) {
    try {
      const eventData = {
        clanId,
        userId: memberData.userId,
        username: memberData.username,
        walletAddress: memberData.walletAddress,
        role: memberData.role || 'member',
        joinedAt: new Date().toISOString(),
        invitedBy: memberData.invitedBy,
        memberCount: memberData.memberCount
      };
      
      // Update statistics
      this.stats.memberJoins++;
      
      // Broadcast to clan members
      this.io.to(`clan:${clanId}`).emit(this.eventTypes.MEMBER_JOINED, {
        ...eventData,
        message: `${eventData.username} joined the clan!`,
        celebration: true
      });
      
      // Send welcome message to new member
      this.io.to(`user:${memberData.userId}`).emit('clan:welcome', {
        clanId,
        message: `Welcome to the clan! You are now member #${eventData.memberCount}`,
        clanInfo: memberData.clanInfo,
        timestamp: eventData.joinedAt
      });
      
      this.logger.info(`Member joined clan: ${memberData.username} -> ${clanId}`);
      this.emit('member_joined', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling member join for clan ${clanId}:`, error);
    }
  }

  /**
   * Handle member left
   */
  handleMemberLeft(clanId, memberData) {
    try {
      const eventData = {
        clanId,
        userId: memberData.userId,
        username: memberData.username,
        reason: memberData.reason || 'voluntary',
        leftAt: new Date().toISOString(),
        memberCount: memberData.memberCount,
        wasLeader: memberData.wasLeader || false
      };
      
      // Update statistics
      this.stats.memberLeaves++;
      
      // Broadcast to clan members
      this.io.to(`clan:${clanId}`).emit(this.eventTypes.MEMBER_LEFT, {
        ...eventData,
        message: eventData.reason === 'kicked' 
          ? `${eventData.username} was removed from the clan`
          : `${eventData.username} left the clan`
      });
      
      // Handle leadership transition if needed
      if (eventData.wasLeader && memberData.newLeader) {
        this.handleMemberPromoted(clanId, {
          ...memberData.newLeader,
          promotedTo: 'leader',
          reason: 'leadership_transition'
        });
      }
      
      this.logger.info(`Member left clan: ${memberData.username} <- ${clanId} (${eventData.reason})`);
      this.emit('member_left', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling member leave for clan ${clanId}:`, error);
    }
  }

  /**
   * Handle member promotion
   */
  handleMemberPromoted(clanId, promotionData) {
    try {
      const eventData = {
        clanId,
        userId: promotionData.userId,
        username: promotionData.username,
        previousRole: promotionData.previousRole,
        newRole: promotionData.promotedTo,
        promotedBy: promotionData.promotedBy,
        reason: promotionData.reason,
        timestamp: new Date().toISOString()
      };
      
      // Update statistics
      this.stats.promotions++;
      
      // Broadcast to clan members
      this.io.to(`clan:${clanId}`).emit(this.eventTypes.MEMBER_PROMOTED, {
        ...eventData,
        message: `${eventData.username} was promoted to ${eventData.newRole}!`,
        celebration: true
      });
      
      // Notify promoted member
      this.io.to(`user:${promotionData.userId}`).emit('user:promotion', {
        clanId,
        newRole: eventData.newRole,
        previousRole: eventData.previousRole,
        message: `Congratulations! You were promoted to ${eventData.newRole}`,
        timestamp: eventData.timestamp
      });
      
      this.logger.info(`Member promoted: ${promotionData.username} -> ${eventData.newRole} in ${clanId}`);
      this.emit('member_promoted', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling member promotion for clan ${clanId}:`, error);
    }
  }

  /**
   * Handle leaderboard update
   */
  handleLeaderboardUpdate(clanId, leaderboardData) {
    try {
      const eventData = {
        clanId,
        leaderboard: leaderboardData.leaderboard,
        changes: leaderboardData.changes || [],
        season: leaderboardData.season,
        lastUpdated: new Date().toISOString(),
        topPlayers: leaderboardData.leaderboard.slice(0, 10) // Top 10
      };
      
      // Update statistics
      this.stats.leaderboardUpdates++;
      
      // Broadcast to clan members
      this.io.to(`clan:${clanId}`).emit(this.eventTypes.LEADERBOARD_UPDATED, eventData);
      
      // Notify players with significant rank changes
      eventData.changes.forEach(change => {
        if (Math.abs(change.rankChange) >= 5) { // Significant change
          this.io.to(`user:${change.userId}`).emit(this.eventTypes.RANK_CHANGED, {
            clanId,
            previousRank: change.previousRank,
            newRank: change.newRank,
            rankChange: change.rankChange,
            reason: change.reason || 'performance',
            timestamp: eventData.lastUpdated
          });
        }
      });
      
      this.logger.info(`Leaderboard updated for clan ${clanId}`);
      this.emit('leaderboard_updated', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling leaderboard update for clan ${clanId}:`, error);
    }
  }

  /**
   * Handle clan achievement unlock
   */
  handleClanAchievement(clanId, achievementData) {
    try {
      const eventData = {
        clanId,
        achievementId: achievementData.id,
        achievementName: achievementData.name,
        achievementDescription: achievementData.description,
        category: achievementData.category,
        rarity: achievementData.rarity || 'common',
        rewards: achievementData.rewards || {},
        contributors: achievementData.contributors || [],
        timestamp: new Date().toISOString()
      };
      
      // Update statistics
      this.stats.achievementsUnlocked++;
      
      // Broadcast to clan members with celebration
      this.io.to(`clan:${clanId}`).emit(this.eventTypes.ACHIEVEMENT_UNLOCKED, {
        ...eventData,
        message: `Clan Achievement Unlocked: ${eventData.achievementName}!`,
        celebration: true,
        fireworks: eventData.rarity === 'legendary'
      });
      
      // Reward contributors
      eventData.contributors.forEach(contributor => {
        this.io.to(`user:${contributor.userId}`).emit('user:clan_achievement_reward', {
          clanId,
          achievementName: eventData.achievementName,
          contribution: contributor.contribution,
          reward: contributor.reward,
          timestamp: eventData.timestamp
        });
      });
      
      this.logger.info(`Clan achievement unlocked: ${clanId} - ${eventData.achievementName}`);
      this.emit('clan_achievement', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling clan achievement for ${clanId}:`, error);
    }
  }

  /**
   * Handle governance proposal
   */
  handleGovernanceProposal(clanId, proposalData) {
    try {
      const eventData = {
        clanId,
        proposalId: proposalData.id,
        title: proposalData.title,
        description: proposalData.description,
        type: proposalData.type, // 'member_vote', 'rule_change', 'treasury', etc.
        proposedBy: proposalData.proposedBy,
        proposerUsername: proposalData.proposerUsername,
        votingStartTime: proposalData.votingStartTime,
        votingEndTime: proposalData.votingEndTime,
        requiredVotes: proposalData.requiredVotes,
        eligibleVoters: proposalData.eligibleVoters || [],
        timestamp: new Date().toISOString()
      };
      
      // Update statistics
      this.stats.proposals++;
      
      // Broadcast to clan members
      this.io.to(`clan:${clanId}`).emit(this.eventTypes.PROPOSAL_CREATED, {
        ...eventData,
        message: `New proposal: ${eventData.title}`,
        actionRequired: true
      });
      
      // Notify eligible voters specifically
      eventData.eligibleVoters.forEach(voterId => {
        this.io.to(`user:${voterId}`).emit('user:voting_required', {
          clanId,
          proposalId: eventData.proposalId,
          title: eventData.title,
          endTime: eventData.votingEndTime,
          message: 'Your vote is needed on a clan proposal',
          timestamp: eventData.timestamp
        });
      });
      
      this.logger.info(`Governance proposal created: ${clanId} - ${eventData.title}`);
      this.emit('proposal_created', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling governance proposal for clan ${clanId}:`, error);
    }
  }

  /**
   * Handle proposal vote
   */
  handleProposalVote(clanId, voteData) {
    try {
      const eventData = {
        clanId,
        proposalId: voteData.proposalId,
        voterId: voteData.voterId,
        voterUsername: voteData.voterUsername,
        vote: voteData.vote, // 'for', 'against', 'abstain'
        voteWeight: voteData.voteWeight || 1,
        currentTally: voteData.currentTally,
        totalVotes: voteData.totalVotes,
        requiredVotes: voteData.requiredVotes,
        timestamp: new Date().toISOString()
      };
      
      // Broadcast vote update to clan members
      this.io.to(`clan:${clanId}`).emit(this.eventTypes.PROPOSAL_VOTED, eventData);
      
      // Check if proposal can be executed
      if (eventData.totalVotes >= eventData.requiredVotes) {
        this.handleProposalExecution(clanId, {
          proposalId: eventData.proposalId,
          finalTally: eventData.currentTally,
          executed: true
        });
      }
      
      this.logger.info(`Proposal vote: ${voteData.voterUsername} voted ${voteData.vote} on ${clanId}/${voteData.proposalId}`);
      this.emit('proposal_voted', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling proposal vote for clan ${clanId}:`, error);
    }
  }

  /**
   * Handle proposal execution
   */
  handleProposalExecution(clanId, executionData) {
    try {
      const eventData = {
        clanId,
        proposalId: executionData.proposalId,
        executed: executionData.executed,
        result: executionData.result || (executionData.finalTally.for > executionData.finalTally.against ? 'passed' : 'failed'),
        finalTally: executionData.finalTally,
        executedAt: new Date().toISOString(),
        effects: executionData.effects || []
      };
      
      // Broadcast execution result
      this.io.to(`clan:${clanId}`).emit(this.eventTypes.PROPOSAL_EXECUTED, {
        ...eventData,
        message: `Proposal ${eventData.result}!`,
        celebration: eventData.result === 'passed'
      });
      
      this.logger.info(`Proposal executed: ${clanId}/${executionData.proposalId} - ${eventData.result}`);
      this.emit('proposal_executed', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling proposal execution for clan ${clanId}:`, error);
    }
  }

  /**
   * Handle tournament events
   */
  handleTournamentStart(clanId, tournamentData) {
    try {
      const eventData = {
        clanId,
        tournamentId: tournamentData.id,
        tournamentName: tournamentData.name,
        type: tournamentData.type, // 'internal', 'inter_clan', 'public'
        participants: tournamentData.participants || [],
        startTime: new Date().toISOString(),
        endTime: tournamentData.endTime,
        prizes: tournamentData.prizes || {},
        rules: tournamentData.rules
      };
      
      // Update statistics
      this.stats.tournaments++;
      
      // Broadcast to clan members
      this.io.to(`clan:${clanId}`).emit(this.eventTypes.TOURNAMENT_STARTED, {
        ...eventData,
        message: `Tournament started: ${eventData.tournamentName}!`,
        actionRequired: true
      });
      
      // Notify participants
      eventData.participants.forEach(participant => {
        this.io.to(`user:${participant.userId}`).emit('user:tournament_started', {
          tournamentId: eventData.tournamentId,
          tournamentName: eventData.tournamentName,
          startTime: eventData.startTime,
          message: 'Your tournament has started!',
          clanId
        });
      });
      
      this.logger.info(`Tournament started: ${clanId} - ${eventData.tournamentName}`);
      this.emit('tournament_started', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling tournament start for clan ${clanId}:`, error);
    }
  }

  /**
   * Handle clan announcement
   */
  handleAnnouncement(clanId, announcementData) {
    try {
      const eventData = {
        clanId,
        id: announcementData.id || this.generateAnnouncementId(),
        title: announcementData.title,
        message: announcementData.message,
        author: announcementData.author,
        authorUsername: announcementData.authorUsername,
        priority: announcementData.priority || 'normal',
        category: announcementData.category || 'general',
        pinned: announcementData.pinned || false,
        timestamp: new Date().toISOString()
      };
      
      // Update statistics
      this.stats.announcements++;
      
      // Broadcast to clan members
      this.io.to(`clan:${clanId}`).emit(this.eventTypes.ANNOUNCEMENT, {
        ...eventData,
        notification: {
          title: 'Clan Announcement',
          message: eventData.title,
          priority: eventData.priority
        }
      });
      
      this.logger.info(`Clan announcement: ${clanId} - ${eventData.title}`);
      this.emit('announcement', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling announcement for clan ${clanId}:`, error);
    }
  }

  /**
   * Handle clan war events
   */
  handleClanWarDeclared(clanId, warData) {
    try {
      const eventData = {
        warId: warData.id,
        attackingClan: clanId,
        defendingClan: warData.defendingClan,
        warType: warData.type || 'territory',
        startTime: warData.startTime,
        endTime: warData.endTime,
        stakes: warData.stakes || {},
        rules: warData.rules,
        declaredAt: new Date().toISOString()
      };
      
      // Update statistics
      this.stats.wars++;
      
      // Broadcast to attacking clan
      this.io.to(`clan:${clanId}`).emit(this.eventTypes.WAR_DECLARED, {
        ...eventData,
        message: `War declared against ${warData.defendingClanName}!`,
        role: 'attacker',
        preparation: true
      });
      
      // Broadcast to defending clan
      this.io.to(`clan:${warData.defendingClan}`).emit(this.eventTypes.WAR_DECLARED, {
        ...eventData,
        message: `${warData.attackingClanName} has declared war!`,
        role: 'defender',
        preparation: true
      });
      
      this.logger.info(`Clan war declared: ${clanId} vs ${warData.defendingClan}`);
      this.emit('war_declared', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling war declaration for clan ${clanId}:`, error);
    }
  }

  /**
   * Generate unique announcement ID
   */
  generateAnnouncementId() {
    return `announce_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get clan event statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalEvents: Object.values(this.stats).reduce((sum, count) => sum + count, 0)
    };
  }

  /**
   * Reset event statistics
   */
  resetStats() {
    this.stats = {
      memberJoins: 0,
      memberLeaves: 0,
      promotions: 0,
      demotions: 0,
      leaderboardUpdates: 0,
      achievementsUnlocked: 0,
      proposals: 0,
      tournaments: 0,
      announcements: 0,
      wars: 0
    };
    
    this.logger.info('Clan event statistics reset');
  }
}

export default ClanEventHandler;