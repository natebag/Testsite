/**
 * Clan Cache Strategy for MLG.clan Platform
 * 
 * Specialized caching strategy for clan-related data including clan details,
 * member lists, leaderboards, statistics, and voting data. Optimized for
 * gaming platform requirements with real-time updates and hierarchical caching.
 * 
 * Features:
 * - Clan profile and metadata caching
 * - Member list and hierarchy caching
 * - Clan leaderboard caching with rankings
 * - Clan statistics and achievements caching
 * - Voting and governance data caching
 * - Invitation and application caching
 * - Tournament and event caching
 * 
 * @author Claude Code - Performance Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { getCacheManager } from '../cache-manager.js';

export class ClanCacheStrategy {
  constructor(options = {}) {
    this.cache = getCacheManager();
    this.namespace = 'clan';
    
    this.config = {
      profileTTL: options.profileTTL || 1800,         // 30 minutes
      membersTTL: options.membersTTL || 900,          // 15 minutes
      leaderboardTTL: options.leaderboardTTL || 300,  // 5 minutes
      statsTTL: options.statsTTL || 600,              // 10 minutes
      votingTTL: options.votingTTL || 180,            // 3 minutes
      invitationTTL: options.invitationTTL || 3600,   // 1 hour
      tournamentTTL: options.tournamentTTL || 900,    // 15 minutes
      searchTTL: options.searchTTL || 1800,           // 30 minutes
      
      // Cache sizes and limits
      maxMembersCache: options.maxMembersCache || 1000,
      maxLeaderboardSize: options.maxLeaderboardSize || 100,
      
      // Real-time update settings
      enableRealTimeUpdates: options.enableRealTimeUpdates !== false,
      updateBatchSize: options.updateBatchSize || 50,
      
      ...options
    };
    
    this.setupInvalidationPatterns();
  }

  setupInvalidationPatterns() {
    // When clan profile updates, invalidate related caches
    this.cache.registerInvalidationPattern('clan:profile', 'clan:search:*');
    this.cache.registerInvalidationPattern('clan:profile', 'clan:leaderboard:*');
    
    // When members change, invalidate clan stats and leaderboards
    this.cache.registerInvalidationPattern('clan:members', 'clan:stats:*');
    this.cache.registerInvalidationPattern('clan:members', 'clan:leaderboard:*');
    this.cache.registerInvalidationPattern('clan:members', 'clan:member:count:*');
    
    // When voting happens, invalidate governance caches
    this.cache.registerInvalidationPattern('clan:voting', 'clan:governance:*');
    this.cache.registerInvalidationPattern('clan:voting', 'clan:proposals:*');
  }

  /**
   * Cache clan profile data
   * @param {string} clanId - Clan ID
   * @param {Object} clanData - Clan data to cache
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheClanProfile(clanId, clanData, options = {}) {
    const ttl = options.ttl || this.config.profileTTL;
    
    // Cache full clan profile
    await this.cache.set(
      `${this.namespace}:profile`,
      clanId,
      clanData,
      { ttl }
    );
    
    // Cache searchable fields
    if (clanData.name) {
      await this.cache.set(
        `${this.namespace}:name`,
        clanData.name.toLowerCase(),
        { clanId },
        { ttl }
      );
    }
    
    if (clanData.tag) {
      await this.cache.set(
        `${this.namespace}:tag`,
        clanData.tag.toUpperCase(),
        { clanId },
        { ttl }
      );
    }
    
    // Cache clan summary for listings
    const clanSummary = {
      id: clanId,
      name: clanData.name,
      tag: clanData.tag,
      description: clanData.description?.substring(0, 200),
      logo_url: clanData.logo_url,
      member_count: clanData.member_count,
      total_reputation: clanData.total_reputation,
      status: clanData.status,
      created_at: clanData.created_at,
      is_public: clanData.is_public
    };
    
    await this.cache.set(
      `${this.namespace}:summary`,
      clanId,
      clanSummary,
      { ttl }
    );
    
    return true;
  }

  /**
   * Cache clan members data
   * @param {string} clanId - Clan ID
   * @param {Array} members - Clan members data
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheClanMembers(clanId, members, options = {}) {
    const ttl = options.ttl || this.config.membersTTL;
    
    // Cache full members list
    await this.cache.set(
      `${this.namespace}:members`,
      clanId,
      members,
      { ttl }
    );
    
    // Cache members by role
    const membersByRole = members.reduce((acc, member) => {
      if (!acc[member.role]) {
        acc[member.role] = [];
      }
      acc[member.role].push(member);
      return acc;
    }, {});
    
    for (const [role, roleMembers] of Object.entries(membersByRole)) {
      await this.cache.set(
        `${this.namespace}:members:role`,
        `${clanId}:${role}`,
        roleMembers,
        { ttl }
      );
    }
    
    // Cache member count by role
    const memberCounts = {};
    for (const [role, roleMembers] of Object.entries(membersByRole)) {
      memberCounts[role] = roleMembers.length;
    }
    memberCounts.total = members.length;
    
    await this.cache.set(
      `${this.namespace}:member:count`,
      clanId,
      memberCounts,
      { ttl }
    );
    
    // Cache user-to-clan membership mapping
    const membershipPromises = members.map(member => 
      this.cache.set(
        `${this.namespace}:user:membership`,
        member.user_id,
        {
          clanId,
          role: member.role,
          joined_at: member.joined_at,
          permissions: member.permissions
        },
        { ttl }
      )
    );
    
    await Promise.all(membershipPromises);
    
    return true;
  }

  /**
   * Cache clan leaderboard data
   * @param {string} clanId - Clan ID
   * @param {string} metric - Leaderboard metric
   * @param {Array} leaderboard - Leaderboard data
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheClanLeaderboard(clanId, metric, leaderboard, options = {}) {
    const ttl = options.ttl || this.config.leaderboardTTL;
    
    // Limit leaderboard size
    const limitedLeaderboard = leaderboard.slice(0, this.config.maxLeaderboardSize);
    
    await this.cache.set(
      `${this.namespace}:leaderboard:${metric}`,
      clanId,
      limitedLeaderboard,
      { ttl }
    );
    
    // Cache individual member rankings within clan
    limitedLeaderboard.forEach(async (entry, index) => {
      await this.cache.set(
        `${this.namespace}:member:ranking:${metric}`,
        `${clanId}:${entry.user_id}`,
        { rank: index + 1, value: entry[metric] },
        { ttl }
      );
    });
    
    // Cache top performers for quick access
    const topPerformers = limitedLeaderboard.slice(0, 10);
    await this.cache.set(
      `${this.namespace}:top:${metric}`,
      clanId,
      topPerformers,
      { ttl }
    );
    
    return true;
  }

  /**
   * Cache clan statistics
   * @param {string} clanId - Clan ID
   * @param {Object} stats - Clan statistics
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheClanStats(clanId, stats, options = {}) {
    const ttl = options.ttl || this.config.statsTTL;
    
    // Cache full stats
    await this.cache.set(
      `${this.namespace}:stats`,
      clanId,
      stats,
      { ttl }
    );
    
    // Cache key metrics separately
    const keyMetrics = [
      'total_reputation',
      'total_votes_cast',
      'total_content_submitted',
      'total_tournaments_won',
      'average_member_reputation'
    ];
    
    const metricPromises = keyMetrics.map(metric => {
      if (stats[metric] !== undefined) {
        return this.cache.set(
          `${this.namespace}:metric:${metric}`,
          clanId,
          stats[metric],
          { ttl }
        );
      }
    }).filter(Boolean);
    
    await Promise.all(metricPromises);
    
    return true;
  }

  /**
   * Cache clan voting/governance data
   * @param {string} clanId - Clan ID
   * @param {Array} proposals - Active proposals
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheClanVoting(clanId, proposals, options = {}) {
    const ttl = options.ttl || this.config.votingTTL;
    
    // Cache all active proposals
    await this.cache.set(
      `${this.namespace}:proposals`,
      clanId,
      proposals,
      { ttl }
    );
    
    // Cache proposals by status
    const proposalsByStatus = proposals.reduce((acc, proposal) => {
      if (!acc[proposal.status]) {
        acc[proposal.status] = [];
      }
      acc[proposal.status].push(proposal);
      return acc;
    }, {});
    
    for (const [status, statusProposals] of Object.entries(proposalsByStatus)) {
      await this.cache.set(
        `${this.namespace}:proposals:${status}`,
        clanId,
        statusProposals,
        { ttl }
      );
    }
    
    // Cache governance stats
    const governanceStats = {
      totalProposals: proposals.length,
      activeProposals: proposals.filter(p => p.status === 'active').length,
      passedProposals: proposals.filter(p => p.status === 'passed').length,
      participationRate: this.calculateParticipationRate(proposals)
    };
    
    await this.cache.set(
      `${this.namespace}:governance:stats`,
      clanId,
      governanceStats,
      { ttl }
    );
    
    return true;
  }

  /**
   * Cache clan invitations and applications
   * @param {string} clanId - Clan ID
   * @param {Object} invitationData - Invitations and applications data
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheClanInvitations(clanId, invitationData, options = {}) {
    const ttl = options.ttl || this.config.invitationTTL;
    
    // Cache outgoing invitations
    if (invitationData.invitations) {
      await this.cache.set(
        `${this.namespace}:invitations:outgoing`,
        clanId,
        invitationData.invitations,
        { ttl }
      );
    }
    
    // Cache incoming applications
    if (invitationData.applications) {
      await this.cache.set(
        `${this.namespace}:applications:incoming`,
        clanId,
        invitationData.applications,
        { ttl }
      );
    }
    
    // Cache pending counts
    const pendingCounts = {
      invitations: invitationData.invitations?.filter(i => i.status === 'pending').length || 0,
      applications: invitationData.applications?.filter(a => a.status === 'pending').length || 0
    };
    
    await this.cache.set(
      `${this.namespace}:pending:counts`,
      clanId,
      pendingCounts,
      { ttl }
    );
    
    return true;
  }

  /**
   * Cache clan tournament/event data
   * @param {string} clanId - Clan ID
   * @param {Array} tournaments - Tournament data
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheClanTournaments(clanId, tournaments, options = {}) {
    const ttl = options.ttl || this.config.tournamentTTL;
    
    await this.cache.set(
      `${this.namespace}:tournaments`,
      clanId,
      tournaments,
      { ttl }
    );
    
    // Cache by status
    const tournamentsByStatus = tournaments.reduce((acc, tournament) => {
      if (!acc[tournament.status]) {
        acc[tournament.status] = [];
      }
      acc[tournament.status].push(tournament);
      return acc;
    }, {});
    
    for (const [status, statusTournaments] of Object.entries(tournamentsByStatus)) {
      await this.cache.set(
        `${this.namespace}:tournaments:${status}`,
        clanId,
        statusTournaments,
        { ttl }
      );
    }
    
    return true;
  }

  /**
   * Cache clan search results
   * @param {string} searchQuery - Search query
   * @param {Array} results - Search results
   * @param {Object} options - Caching options
   * @returns {Promise<boolean>} Success status
   */
  async cacheClanSearch(searchQuery, results, options = {}) {
    const ttl = options.ttl || this.config.searchTTL;
    
    // Normalize search query
    const normalizedQuery = searchQuery.toLowerCase().trim();
    
    await this.cache.set(
      `${this.namespace}:search`,
      normalizedQuery,
      results,
      { ttl }
    );
    
    return true;
  }

  /**
   * Get methods for cached data
   */
  
  async getClanProfile(clanId) {
    return await this.cache.get(`${this.namespace}:profile`, clanId);
  }
  
  async getClanMembers(clanId, role = null) {
    if (role) {
      return await this.cache.get(`${this.namespace}:members:role`, `${clanId}:${role}`);
    }
    return await this.cache.get(`${this.namespace}:members`, clanId);
  }
  
  async getClanLeaderboard(clanId, metric) {
    return await this.cache.get(`${this.namespace}:leaderboard:${metric}`, clanId);
  }
  
  async getClanStats(clanId) {
    return await this.cache.get(`${this.namespace}:stats`, clanId);
  }
  
  async getClanProposals(clanId, status = null) {
    if (status) {
      return await this.cache.get(`${this.namespace}:proposals:${status}`, clanId);
    }
    return await this.cache.get(`${this.namespace}:proposals`, clanId);
  }
  
  async getUserClanMembership(userId) {
    return await this.cache.get(`${this.namespace}:user:membership`, userId);
  }

  /**
   * Batch operations
   */
  
  async batchGetClanProfiles(clanIds) {
    return await this.cache.getMultiple(`${this.namespace}:profile`, clanIds);
  }
  
  async batchGetClanSummaries(clanIds) {
    return await this.cache.getMultiple(`${this.namespace}:summary`, clanIds);
  }
  
  async batchGetClanStats(clanIds) {
    return await this.cache.getMultiple(`${this.namespace}:stats`, clanIds);
  }

  /**
   * Invalidation methods
   */
  
  async invalidateClanCache(clanId) {
    const patterns = [
      `${this.namespace}:profile:${clanId}`,
      `${this.namespace}:summary:${clanId}`,
      `${this.namespace}:members:${clanId}`,
      `${this.namespace}:members:role:${clanId}:*`,
      `${this.namespace}:stats:${clanId}`,
      `${this.namespace}:leaderboard:*:${clanId}`,
      `${this.namespace}:proposals:*:${clanId}`,
      `${this.namespace}:tournaments:*:${clanId}`
    ];
    
    let totalInvalidated = 0;
    
    for (const pattern of patterns) {
      const invalidated = await this.cache.invalidatePattern('', pattern);
      totalInvalidated += invalidated;
    }
    
    return totalInvalidated;
  }
  
  async invalidateClanMembers(clanId) {
    const patterns = [
      `${this.namespace}:members:${clanId}`,
      `${this.namespace}:members:role:${clanId}:*`,
      `${this.namespace}:member:count:${clanId}`,
      `${this.namespace}:stats:${clanId}`,
      `${this.namespace}:leaderboard:*:${clanId}`
    ];
    
    let totalInvalidated = 0;
    
    for (const pattern of patterns) {
      const invalidated = await this.cache.invalidatePattern('', pattern);
      totalInvalidated += invalidated;
    }
    
    return totalInvalidated;
  }
  
  async invalidateClanLeaderboards(clanId) {
    return await this.cache.invalidatePattern('', `${this.namespace}:leaderboard:*:${clanId}`);
  }

  /**
   * Utility methods
   */
  
  calculateParticipationRate(proposals) {
    if (proposals.length === 0) return 0;
    
    const totalVotes = proposals.reduce((sum, proposal) => {
      return sum + (proposal.votes_for || 0) + (proposal.votes_against || 0);
    }, 0);
    
    const avgVotesPerProposal = totalVotes / proposals.length;
    return Math.round(avgVotesPerProposal * 100) / 100;
  }
  
  /**
   * Real-time update methods
   */
  
  async updateMemberCount(clanId, delta) {
    if (!this.config.enableRealTimeUpdates) return;
    
    try {
      const currentCounts = await this.cache.get(`${this.namespace}:member:count`, clanId);
      if (currentCounts) {
        currentCounts.total += delta;
        await this.cache.set(
          `${this.namespace}:member:count`,
          clanId,
          currentCounts,
          { ttl: this.config.membersTTL }
        );
      }
    } catch (error) {
      // Ignore errors for real-time updates
    }
  }
  
  async updateClanReputation(clanId, delta) {
    if (!this.config.enableRealTimeUpdates) return;
    
    try {
      const currentStats = await this.cache.get(`${this.namespace}:stats`, clanId);
      if (currentStats) {
        currentStats.total_reputation += delta;
        await this.cache.set(
          `${this.namespace}:stats`,
          clanId,
          currentStats,
          { ttl: this.config.statsTTL }
        );
      }
    } catch (error) {
      // Ignore errors for real-time updates
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      namespace: this.namespace,
      config: this.config
    };
  }
}

// Create singleton instance
let globalClanCache = null;

export function createClanCache(options = {}) {
  return new ClanCacheStrategy(options);
}

export function getClanCache(options = {}) {
  if (!globalClanCache) {
    globalClanCache = new ClanCacheStrategy(options);
  }
  return globalClanCache;
}

export default ClanCacheStrategy;