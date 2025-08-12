/**
 * Gaming-Specific Security: Clan Action Spam Prevention and Security
 * 
 * Advanced clan security system preventing spam, abuse, and coordinated attacks
 * on clan operations including invitations, role changes, and clan activities.
 * 
 * Features:
 * - Clan invitation spam prevention
 * - Role manipulation detection
 * - Coordinated clan attacks prevention
 * - Member behavior analysis
 * - Gaming-specific clan security measures
 * 
 * @author Claude Code - Security Auditor
 * @version 2.0.0
 * @created 2025-08-11
 */

import { createHash } from 'crypto';

/**
 * Clan Security Configuration
 */
const CLAN_SECURITY_CONFIG = {
  // Invitation limits
  INVITATIONS: {
    MAX_PER_HOUR: 10,
    MAX_PER_DAY: 50,
    MAX_PENDING_PER_USER: 20,
    MIN_TIME_BETWEEN_INVITES: 30000, // 30 seconds
    BULK_INVITE_THRESHOLD: 5, // Invites in quick succession
    REPUTATION_REQUIREMENT: 10 // Min reputation to invite
  },

  // Role management
  ROLES: {
    MAX_ROLE_CHANGES_PER_DAY: 5,
    MIN_TIME_BETWEEN_CHANGES: 60000, // 1 minute
    PROMOTION_COOLDOWN: 24 * 60 * 60 * 1000, // 24 hours
    DEMOTION_PROTECTION_TIME: 60 * 60 * 1000, // 1 hour protection after promotion
    MAX_SIMULTANEOUS_ROLE_CHANGES: 3
  },

  // Clan operations
  OPERATIONS: {
    MAX_CLAN_CREATIONS_PER_USER: 3,
    MIN_TIME_BETWEEN_CLAN_CREATION: 7 * 24 * 60 * 60 * 1000, // 7 days
    MAX_JOIN_REQUESTS_PER_DAY: 10,
    MAX_LEAVE_REJOIN_CYCLES: 3, // Per day
    CLAN_NAME_CHANGE_COOLDOWN: 30 * 24 * 60 * 60 * 1000 // 30 days
  },

  // Anti-abuse measures
  ABUSE_DETECTION: {
    SIMILAR_USERNAME_THRESHOLD: 0.8, // Similarity threshold for coordinated accounts
    COORDINATED_JOINING_THRESHOLD: 5, // Multiple users joining within time window
    COORDINATED_TIME_WINDOW: 300000, // 5 minutes
    MASS_LEAVING_THRESHOLD: 10, // Members leaving within short time
    SUSPICIOUS_PATTERN_THRESHOLD: 3
  },

  // Behavior analysis
  BEHAVIOR: {
    NORMAL_SESSION_LENGTH: 30 * 60 * 1000, // 30 minutes
    RAPID_ACTION_THRESHOLD: 5000, // 5 seconds between actions
    AUTOMATION_DETECTION_THRESHOLD: 10, // Identical timing patterns
    HUMAN_VARIANCE_THRESHOLD: 2000 // Expected timing variance
  }
};

/**
 * Clan Security Analyzer
 */
class ClanSecurityAnalyzer {
  constructor() {
    this.clanHistory = new Map(); // Clan-specific history
    this.userClanActivity = new Map(); // User activity across clans
    this.invitationHistory = new Map(); // Invitation tracking
    this.roleChangeHistory = new Map(); // Role change tracking
    this.suspiciousActivity = new Map(); // Suspicious patterns
    
    this.startCleanupInterval();
  }

  /**
   * Analyze clan invitation for spam/abuse
   */
  analyzeInvitation(inviterId, inviteeId, clanId, req) {
    const analysis = {
      inviterId,
      inviteeId,
      clanId,
      timestamp: Date.now(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      suspicious: false,
      reasons: [],
      riskScore: 0,
      action: 'invite'
    };

    // Check invitation rate limits
    this.checkInvitationRateLimit(analysis);
    
    // Check for spam patterns
    this.checkInvitationSpamPatterns(analysis);
    
    // Check for coordinated invitations
    this.checkCoordinatedInvitations(analysis);
    
    // Check inviter reputation and behavior
    this.checkInviterBehavior(analysis);
    
    // Calculate risk score
    analysis.riskScore = this.calculateClanRiskScore(analysis);
    
    // Update tracking
    this.updateInvitationHistory(analysis);
    
    return analysis;
  }

  /**
   * Analyze role changes for manipulation
   */
  analyzeRoleChange(userId, targetUserId, clanId, fromRole, toRole, req) {
    const analysis = {
      userId,
      targetUserId,
      clanId,
      fromRole,
      toRole,
      timestamp: Date.now(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      suspicious: false,
      reasons: [],
      riskScore: 0,
      action: 'role_change'
    };

    // Check role change rate limits
    this.checkRoleChangeRateLimit(analysis);
    
    // Check for rapid role cycling
    this.checkRoleManipulationPatterns(analysis);
    
    // Check permission escalation abuse
    this.checkPermissionEscalation(analysis);
    
    // Check coordinated role changes
    this.checkCoordinatedRoleChanges(analysis);
    
    // Calculate risk score
    analysis.riskScore = this.calculateClanRiskScore(analysis);
    
    // Update tracking
    this.updateRoleChangeHistory(analysis);
    
    return analysis;
  }

  /**
   * Analyze clan joining patterns
   */
  analyzeClanJoin(userId, clanId, req) {
    const analysis = {
      userId,
      clanId,
      timestamp: Date.now(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      suspicious: false,
      reasons: [],
      riskScore: 0,
      action: 'join'
    };

    // Check join frequency
    this.checkJoinFrequency(analysis);
    
    // Check leave-rejoin cycles
    this.checkLeaveRejoinCycles(analysis);
    
    // Check coordinated joining
    this.checkCoordinatedJoining(analysis);
    
    // Calculate risk score
    analysis.riskScore = this.calculateClanRiskScore(analysis);
    
    // Update tracking
    this.updateClanActivity(analysis);
    
    return analysis;
  }

  /**
   * Check invitation rate limits
   */
  checkInvitationRateLimit(analysis) {
    const inviterId = analysis.inviterId;
    const now = Date.now();

    if (!this.invitationHistory.has(inviterId)) {
      this.invitationHistory.set(inviterId, []);
    }

    const userInvites = this.invitationHistory.get(inviterId);
    
    // Check hourly limit
    const hourlyInvites = userInvites.filter(invite => 
      now - invite.timestamp < 60 * 60 * 1000
    );

    if (hourlyInvites.length >= CLAN_SECURITY_CONFIG.INVITATIONS.MAX_PER_HOUR) {
      analysis.suspicious = true;
      analysis.reasons.push('Exceeded hourly invitation limit');
      analysis.riskScore += 40;
    }

    // Check daily limit
    const dailyInvites = userInvites.filter(invite => 
      now - invite.timestamp < 24 * 60 * 60 * 1000
    );

    if (dailyInvites.length >= CLAN_SECURITY_CONFIG.INVITATIONS.MAX_PER_DAY) {
      analysis.suspicious = true;
      analysis.reasons.push('Exceeded daily invitation limit');
      analysis.riskScore += 50;
    }

    // Check minimum time between invites
    if (hourlyInvites.length > 0) {
      const lastInvite = hourlyInvites[hourlyInvites.length - 1];
      const timeDiff = now - lastInvite.timestamp;
      
      if (timeDiff < CLAN_SECURITY_CONFIG.INVITATIONS.MIN_TIME_BETWEEN_INVITES) {
        analysis.suspicious = true;
        analysis.reasons.push('Sending invitations too quickly');
        analysis.riskScore += 30;
      }
    }
  }

  /**
   * Check for invitation spam patterns
   */
  checkInvitationSpamPatterns(analysis) {
    const inviterId = analysis.inviterId;
    const clanId = analysis.clanId;

    if (!this.invitationHistory.has(inviterId)) return;

    const userInvites = this.invitationHistory.get(inviterId);
    const recentInvites = userInvites.filter(invite => 
      Date.now() - invite.timestamp < 300000 // Last 5 minutes
    );

    // Check for bulk invitations
    if (recentInvites.length >= CLAN_SECURITY_CONFIG.INVITATIONS.BULK_INVITE_THRESHOLD) {
      analysis.suspicious = true;
      analysis.reasons.push('Bulk invitation pattern detected');
      analysis.riskScore += 35;
    }

    // Check for repetitive invitations to same users
    const inviteeIds = recentInvites.map(invite => invite.inviteeId);
    const uniqueInvitees = new Set(inviteeIds);
    
    if (inviteeIds.length > uniqueInvitees.size * 1.5) {
      analysis.suspicious = true;
      analysis.reasons.push('Repetitive invitations to same users');
      analysis.riskScore += 25;
    }

    // Check for cross-clan invitation spam
    const clanIds = new Set(recentInvites.map(invite => invite.clanId));
    if (clanIds.size > 3) { // Inviting to multiple clans quickly
      analysis.suspicious = true;
      analysis.reasons.push('Cross-clan invitation spam');
      analysis.riskScore += 30;
    }
  }

  /**
   * Check for coordinated invitations
   */
  checkCoordinatedInvitations(analysis) {
    const clanId = analysis.clanId;
    const now = Date.now();

    // Get all recent invitations for this clan
    const allInvites = [];
    for (const [inviterId, invites] of this.invitationHistory.entries()) {
      const clanInvites = invites.filter(invite => 
        invite.clanId === clanId && 
        now - invite.timestamp < CLAN_SECURITY_CONFIG.ABUSE_DETECTION.COORDINATED_TIME_WINDOW
      );
      allInvites.push(...clanInvites);
    }

    // Check for coordinated timing
    const coordinatedInvites = allInvites.filter(invite => 
      Math.abs(now - invite.timestamp) < 60000 // Within 1 minute
    );

    if (coordinatedInvites.length >= CLAN_SECURITY_CONFIG.ABUSE_DETECTION.COORDINATED_JOINING_THRESHOLD) {
      analysis.suspicious = true;
      analysis.reasons.push('Coordinated invitation timing detected');
      analysis.riskScore += 40;
    }

    // Check for same IP invitations
    const sameIPInvites = allInvites.filter(invite => invite.ip === analysis.ip);
    if (sameIPInvites.length >= 3) {
      analysis.suspicious = true;
      analysis.reasons.push('Multiple invitations from same IP');
      analysis.riskScore += 35;
    }
  }

  /**
   * Check inviter behavior and reputation
   */
  checkInviterBehavior(analysis) {
    const inviterId = analysis.inviterId;

    // Check if inviter has minimum reputation (would integrate with user system)
    // For now, we'll simulate this check
    const inviterReputation = this.getUserReputation(inviterId);
    
    if (inviterReputation < CLAN_SECURITY_CONFIG.INVITATIONS.REPUTATION_REQUIREMENT) {
      analysis.suspicious = true;
      analysis.reasons.push('Inviter has insufficient reputation');
      analysis.riskScore += 20;
    }

    // Check inviter's recent activity patterns
    if (this.userClanActivity.has(inviterId)) {
      const activity = this.userClanActivity.get(inviterId);
      const recentActivity = activity.filter(act => 
        Date.now() - act.timestamp < 24 * 60 * 60 * 1000
      );

      // Check for automation patterns
      const timingVariances = this.calculateTimingVariances(recentActivity);
      if (timingVariances.length > 0 && 
          timingVariances.every(v => v < CLAN_SECURITY_CONFIG.BEHAVIOR.HUMAN_VARIANCE_THRESHOLD)) {
        analysis.suspicious = true;
        analysis.reasons.push('Automated behavior pattern detected');
        analysis.riskScore += 45;
      }
    }
  }

  /**
   * Check role change rate limits
   */
  checkRoleChangeRateLimit(analysis) {
    const userId = analysis.userId;
    const now = Date.now();

    if (!this.roleChangeHistory.has(userId)) {
      this.roleChangeHistory.set(userId, []);
    }

    const userRoleChanges = this.roleChangeHistory.get(userId);
    
    // Check daily limit
    const dailyChanges = userRoleChanges.filter(change => 
      now - change.timestamp < 24 * 60 * 60 * 1000
    );

    if (dailyChanges.length >= CLAN_SECURITY_CONFIG.ROLES.MAX_ROLE_CHANGES_PER_DAY) {
      analysis.suspicious = true;
      analysis.reasons.push('Exceeded daily role change limit');
      analysis.riskScore += 50;
    }

    // Check minimum time between changes
    if (userRoleChanges.length > 0) {
      const lastChange = userRoleChanges[userRoleChanges.length - 1];
      const timeDiff = now - lastChange.timestamp;
      
      if (timeDiff < CLAN_SECURITY_CONFIG.ROLES.MIN_TIME_BETWEEN_CHANGES) {
        analysis.suspicious = true;
        analysis.reasons.push('Role changes too frequent');
        analysis.riskScore += 30;
      }
    }
  }

  /**
   * Check for role manipulation patterns
   */
  checkRoleManipulationPatterns(analysis) {
    const targetUserId = analysis.targetUserId;
    const clanId = analysis.clanId;

    // Check for rapid promotion/demotion cycles
    if (this.roleChangeHistory.has(analysis.userId)) {
      const userChanges = this.roleChangeHistory.get(analysis.userId);
      const targetChanges = userChanges.filter(change => 
        change.targetUserId === targetUserId && 
        change.clanId === clanId &&
        Date.now() - change.timestamp < 60 * 60 * 1000 // Last hour
      );

      // Check for cycling pattern
      if (targetChanges.length >= 2) {
        const roles = targetChanges.map(change => change.toRole);
        const uniqueRoles = new Set(roles);
        
        if (roles.length > uniqueRoles.size) {
          analysis.suspicious = true;
          analysis.reasons.push('Role cycling pattern detected');
          analysis.riskScore += 40;
        }
      }
    }

    // Check promotion cooldown
    const roleHierarchy = ['member', 'moderator', 'admin', 'owner'];
    const fromLevel = roleHierarchy.indexOf(analysis.fromRole);
    const toLevel = roleHierarchy.indexOf(analysis.toRole);

    if (toLevel > fromLevel) { // Promotion
      // Check if user was recently demoted
      const recentDemotions = this.findRecentRoleChanges(targetUserId, clanId, 24 * 60 * 60 * 1000);
      const hadDemotion = recentDemotions.some(change => 
        roleHierarchy.indexOf(change.fromRole) > roleHierarchy.indexOf(change.toRole)
      );

      if (hadDemotion) {
        analysis.suspicious = true;
        analysis.reasons.push('Rapid promotion after demotion');
        analysis.riskScore += 25;
      }
    }
  }

  /**
   * Check permission escalation abuse
   */
  checkPermissionEscalation(analysis) {
    const fromRole = analysis.fromRole;
    const toRole = analysis.toRole;
    const roleHierarchy = ['member', 'moderator', 'admin', 'owner'];
    
    const fromLevel = roleHierarchy.indexOf(fromRole);
    const toLevel = roleHierarchy.indexOf(toRole);
    
    // Check for suspicious escalation patterns
    if (toLevel - fromLevel > 1) { // Skipping hierarchy levels
      analysis.suspicious = true;
      analysis.reasons.push('Suspicious permission escalation');
      analysis.riskScore += 35;
    }

    // Check for owner role abuse
    if (toRole === 'owner' && fromRole !== 'admin') {
      analysis.suspicious = true;
      analysis.reasons.push('Direct escalation to owner role');
      analysis.riskScore += 50;
    }
  }

  /**
   * Check coordinated role changes
   */
  checkCoordinatedRoleChanges(analysis) {
    const clanId = analysis.clanId;
    const now = Date.now();

    // Get all recent role changes for this clan
    const allRoleChanges = [];
    for (const [userId, changes] of this.roleChangeHistory.entries()) {
      const clanChanges = changes.filter(change => 
        change.clanId === clanId && 
        now - change.timestamp < CLAN_SECURITY_CONFIG.ABUSE_DETECTION.COORDINATED_TIME_WINDOW
      );
      allRoleChanges.push(...clanChanges);
    }

    // Check for simultaneous role changes
    const simultaneousChanges = allRoleChanges.filter(change => 
      Math.abs(now - change.timestamp) < 60000 // Within 1 minute
    );

    if (simultaneousChanges.length >= CLAN_SECURITY_CONFIG.ROLES.MAX_SIMULTANEOUS_ROLE_CHANGES) {
      analysis.suspicious = true;
      analysis.reasons.push('Coordinated role changes detected');
      analysis.riskScore += 45;
    }
  }

  /**
   * Check join frequency patterns
   */
  checkJoinFrequency(analysis) {
    const userId = analysis.userId;
    const now = Date.now();

    if (!this.userClanActivity.has(userId)) return;

    const userActivity = this.userClanActivity.get(userId);
    const joinActions = userActivity.filter(act => 
      act.action === 'join' && 
      now - act.timestamp < 24 * 60 * 60 * 1000
    );

    if (joinActions.length >= CLAN_SECURITY_CONFIG.OPERATIONS.MAX_JOIN_REQUESTS_PER_DAY) {
      analysis.suspicious = true;
      analysis.reasons.push('Exceeded daily join request limit');
      analysis.riskScore += 30;
    }
  }

  /**
   * Check leave-rejoin cycles
   */
  checkLeaveRejoinCycles(analysis) {
    const userId = analysis.userId;
    const clanId = analysis.clanId;

    if (!this.userClanActivity.has(userId)) return;

    const userActivity = this.userClanActivity.get(userId);
    const clanActivity = userActivity.filter(act => 
      act.clanId === clanId && 
      Date.now() - act.timestamp < 24 * 60 * 60 * 1000
    );

    // Count leave-join cycles
    let cycles = 0;
    let lastAction = null;

    for (const activity of clanActivity.sort((a, b) => a.timestamp - b.timestamp)) {
      if (lastAction === 'leave' && activity.action === 'join') {
        cycles++;
      }
      lastAction = activity.action;
    }

    if (cycles >= CLAN_SECURITY_CONFIG.OPERATIONS.MAX_LEAVE_REJOIN_CYCLES) {
      analysis.suspicious = true;
      analysis.reasons.push('Excessive leave-rejoin cycles');
      analysis.riskScore += 40;
    }
  }

  /**
   * Check coordinated joining
   */
  checkCoordinatedJoining(analysis) {
    const clanId = analysis.clanId;
    const now = Date.now();

    // Get all recent join actions for this clan
    const allJoinActions = [];
    for (const [userId, activities] of this.userClanActivity.entries()) {
      const joinActions = activities.filter(act => 
        act.action === 'join' && 
        act.clanId === clanId && 
        now - act.timestamp < CLAN_SECURITY_CONFIG.ABUSE_DETECTION.COORDINATED_TIME_WINDOW
      );
      allJoinActions.push(...joinActions);
    }

    // Check for coordinated timing
    const coordinatedJoins = allJoinActions.filter(action => 
      Math.abs(now - action.timestamp) < 60000 // Within 1 minute
    );

    if (coordinatedJoins.length >= CLAN_SECURITY_CONFIG.ABUSE_DETECTION.COORDINATED_JOINING_THRESHOLD) {
      analysis.suspicious = true;
      analysis.reasons.push('Coordinated joining pattern detected');
      analysis.riskScore += 45;
    }

    // Check for similar usernames (bot accounts)
    const usernames = coordinatedJoins.map(join => join.username).filter(Boolean);
    const similarityScore = this.calculateUsernameSimilarity(usernames);
    
    if (similarityScore > CLAN_SECURITY_CONFIG.ABUSE_DETECTION.SIMILAR_USERNAME_THRESHOLD) {
      analysis.suspicious = true;
      analysis.reasons.push('Similar usernames in coordinated joining');
      analysis.riskScore += 35;
    }
  }

  /**
   * Calculate clan-specific risk score
   */
  calculateClanRiskScore(analysis) {
    let score = analysis.riskScore;

    // Adjust based on user reputation
    const userReputation = this.getUserReputation(analysis.userId);
    if (userReputation < 0) {
      score += 20;
    } else if (userReputation > 100) {
      score = Math.max(0, score - 10);
    }

    // Adjust based on clan size and activity
    const clanMetrics = this.getClanMetrics(analysis.clanId);
    if (clanMetrics.size < 5) { // Small clan
      score += 5; // Slightly more suspicious
    }

    return Math.min(score, 100);
  }

  /**
   * Update invitation history
   */
  updateInvitationHistory(analysis) {
    const inviterId = analysis.inviterId;

    if (!this.invitationHistory.has(inviterId)) {
      this.invitationHistory.set(inviterId, []);
    }

    this.invitationHistory.get(inviterId).push({
      inviteeId: analysis.inviteeId,
      clanId: analysis.clanId,
      timestamp: analysis.timestamp,
      ip: analysis.ip,
      suspicious: analysis.suspicious,
      riskScore: analysis.riskScore
    });

    if (analysis.suspicious) {
      this.recordSuspiciousActivity(analysis);
    }
  }

  /**
   * Update role change history
   */
  updateRoleChangeHistory(analysis) {
    const userId = analysis.userId;

    if (!this.roleChangeHistory.has(userId)) {
      this.roleChangeHistory.set(userId, []);
    }

    this.roleChangeHistory.get(userId).push({
      targetUserId: analysis.targetUserId,
      clanId: analysis.clanId,
      fromRole: analysis.fromRole,
      toRole: analysis.toRole,
      timestamp: analysis.timestamp,
      ip: analysis.ip,
      suspicious: analysis.suspicious,
      riskScore: analysis.riskScore
    });

    if (analysis.suspicious) {
      this.recordSuspiciousActivity(analysis);
    }
  }

  /**
   * Update clan activity tracking
   */
  updateClanActivity(analysis) {
    const userId = analysis.userId;

    if (!this.userClanActivity.has(userId)) {
      this.userClanActivity.set(userId, []);
    }

    this.userClanActivity.get(userId).push({
      clanId: analysis.clanId,
      action: analysis.action,
      timestamp: analysis.timestamp,
      ip: analysis.ip,
      suspicious: analysis.suspicious,
      riskScore: analysis.riskScore
    });

    if (analysis.suspicious) {
      this.recordSuspiciousActivity(analysis);
    }
  }

  /**
   * Record suspicious activity for analysis
   */
  recordSuspiciousActivity(analysis) {
    const key = `${analysis.userId}:${analysis.timestamp}`;
    this.suspiciousActivity.set(key, {
      ...analysis,
      recordedAt: Date.now()
    });
  }

  /**
   * Helper methods
   */
  getUserReputation(userId) {
    // This would integrate with the actual user reputation system
    // For now, return a default value
    return 50;
  }

  getClanMetrics(clanId) {
    // This would integrate with the actual clan system
    // For now, return default metrics
    return {
      size: 10,
      activity: 'normal'
    };
  }

  findRecentRoleChanges(targetUserId, clanId, timeWindow) {
    const changes = [];
    for (const [userId, userChanges] of this.roleChangeHistory.entries()) {
      const relevantChanges = userChanges.filter(change => 
        change.targetUserId === targetUserId &&
        change.clanId === clanId &&
        Date.now() - change.timestamp < timeWindow
      );
      changes.push(...relevantChanges);
    }
    return changes;
  }

  calculateTimingVariances(activities) {
    if (activities.length < 2) return [];
    
    const intervals = [];
    for (let i = 1; i < activities.length; i++) {
      intervals.push(activities[i].timestamp - activities[i-1].timestamp);
    }

    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    return intervals.map(interval => Math.abs(interval - mean));
  }

  calculateUsernameSimilarity(usernames) {
    if (usernames.length < 2) return 0;

    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < usernames.length; i++) {
      for (let j = i + 1; j < usernames.length; j++) {
        const similarity = this.stringSimilarity(usernames[i], usernames[j]);
        totalSimilarity += similarity;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  stringSimilarity(str1, str2) {
    // Simple string similarity calculation
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill().map(() => Array(str1.length + 1).fill(0));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Start cleanup interval
   */
  startCleanupInterval() {
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000); // Cleanup every hour
  }

  /**
   * Cleanup old data
   */
  cleanupOldData() {
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    // Cleanup invitation history
    for (const [inviterId, invites] of this.invitationHistory.entries()) {
      const recentInvites = invites.filter(invite => now - invite.timestamp < maxAge);
      if (recentInvites.length === 0) {
        this.invitationHistory.delete(inviterId);
      } else {
        this.invitationHistory.set(inviterId, recentInvites);
      }
    }

    // Cleanup role change history
    for (const [userId, changes] of this.roleChangeHistory.entries()) {
      const recentChanges = changes.filter(change => now - change.timestamp < maxAge);
      if (recentChanges.length === 0) {
        this.roleChangeHistory.delete(userId);
      } else {
        this.roleChangeHistory.set(userId, recentChanges);
      }
    }

    // Cleanup user clan activity
    for (const [userId, activities] of this.userClanActivity.entries()) {
      const recentActivities = activities.filter(activity => now - activity.timestamp < maxAge);
      if (recentActivities.length === 0) {
        this.userClanActivity.delete(userId);
      } else {
        this.userClanActivity.set(userId, recentActivities);
      }
    }

    // Cleanup suspicious activity
    for (const [key, activity] of this.suspiciousActivity.entries()) {
      if (now - activity.recordedAt > maxAge) {
        this.suspiciousActivity.delete(key);
      }
    }
  }

  /**
   * Get analytics data
   */
  getAnalytics() {
    return {
      totalInviters: this.invitationHistory.size,
      totalRoleChangers: this.roleChangeHistory.size,
      totalActiveUsers: this.userClanActivity.size,
      suspiciousActivities: this.suspiciousActivity.size,
      recentActivity: {
        invitations: Array.from(this.invitationHistory.values())
          .flat()
          .filter(invite => Date.now() - invite.timestamp < 60 * 60 * 1000).length,
        roleChanges: Array.from(this.roleChangeHistory.values())
          .flat()
          .filter(change => Date.now() - change.timestamp < 60 * 60 * 1000).length,
        suspicious: Array.from(this.suspiciousActivity.values())
          .filter(activity => Date.now() - activity.recordedAt < 60 * 60 * 1000).length
      }
    };
  }
}

// Initialize clan security analyzer
const clanSecurityAnalyzer = new ClanSecurityAnalyzer();

/**
 * Clan invitation security middleware
 */
export const clanInvitationSecurityMiddleware = (req, res, next) => {
  try {
    const { inviteeId, clanId } = req.body;
    const inviterId = req.user?.id;

    if (!inviterId || !inviteeId || !clanId) {
      return res.status(400).json({
        error: 'Missing required parameters for clan invitation',
        code: 'MISSING_CLAN_INVITE_PARAMS'
      });
    }

    // Analyze invitation
    const analysis = clanSecurityAnalyzer.analyzeInvitation(inviterId, inviteeId, clanId, req);

    // Block if highly suspicious
    if (analysis.suspicious && analysis.riskScore >= 60) {
      return res.status(429).json({
        error: 'Clan invitation blocked due to suspicious activity',
        code: 'SUSPICIOUS_CLAN_INVITE_BLOCKED',
        reasons: analysis.reasons,
        riskScore: analysis.riskScore,
        retryAfter: 300
      });
    }

    req.invitationAnalysis = analysis;
    next();

  } catch (error) {
    console.error('Clan invitation security middleware error:', error);
    return res.status(500).json({
      error: 'Clan invitation security system error',
      code: 'CLAN_INVITE_SECURITY_ERROR'
    });
  }
};

/**
 * Clan role change security middleware
 */
export const clanRoleSecurityMiddleware = (req, res, next) => {
  try {
    const { targetUserId, clanId, fromRole, toRole } = req.body;
    const userId = req.user?.id;

    if (!userId || !targetUserId || !clanId || !fromRole || !toRole) {
      return res.status(400).json({
        error: 'Missing required parameters for role change',
        code: 'MISSING_ROLE_CHANGE_PARAMS'
      });
    }

    // Analyze role change
    const analysis = clanSecurityAnalyzer.analyzeRoleChange(userId, targetUserId, clanId, fromRole, toRole, req);

    // Block if highly suspicious
    if (analysis.suspicious && analysis.riskScore >= 70) {
      return res.status(429).json({
        error: 'Role change blocked due to suspicious activity',
        code: 'SUSPICIOUS_ROLE_CHANGE_BLOCKED',
        reasons: analysis.reasons,
        riskScore: analysis.riskScore,
        retryAfter: 300
      });
    }

    req.roleChangeAnalysis = analysis;
    next();

  } catch (error) {
    console.error('Clan role security middleware error:', error);
    return res.status(500).json({
      error: 'Clan role security system error',
      code: 'CLAN_ROLE_SECURITY_ERROR'
    });
  }
};

/**
 * Clan join security middleware
 */
export const clanJoinSecurityMiddleware = (req, res, next) => {
  try {
    const { clanId } = req.body;
    const userId = req.user?.id;

    if (!userId || !clanId) {
      return res.status(400).json({
        error: 'Missing required parameters for clan join',
        code: 'MISSING_CLAN_JOIN_PARAMS'
      });
    }

    // Analyze clan join
    const analysis = clanSecurityAnalyzer.analyzeClanJoin(userId, clanId, req);

    // Block if highly suspicious
    if (analysis.suspicious && analysis.riskScore >= 50) {
      return res.status(429).json({
        error: 'Clan join blocked due to suspicious activity',
        code: 'SUSPICIOUS_CLAN_JOIN_BLOCKED',
        reasons: analysis.reasons,
        riskScore: analysis.riskScore,
        retryAfter: 300
      });
    }

    req.joinAnalysis = analysis;
    next();

  } catch (error) {
    console.error('Clan join security middleware error:', error);
    return res.status(500).json({
      error: 'Clan join security system error',
      code: 'CLAN_JOIN_SECURITY_ERROR'
    });
  }
};

/**
 * Get clan security analyzer instance
 */
export const getClanSecurityAnalyzer = () => clanSecurityAnalyzer;

export default {
  clanInvitationSecurityMiddleware,
  clanRoleSecurityMiddleware,
  clanJoinSecurityMiddleware,
  getClanSecurityAnalyzer
};