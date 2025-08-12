/**
 * User Events Handler for WebSocket Server
 * 
 * Handles user-specific real-time events for the MLG.clan platform including
 * profile updates, achievement notifications, reputation changes, balance updates,
 * and social interactions.
 * 
 * Features:
 * - Profile and preference updates
 * - Achievement and progression notifications
 * - Reputation score changes
 * - MLG token balance updates
 * - Social interaction events
 * - Personal notifications and alerts
 * 
 * @author Claude Code - User Events Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { EventEmitter } from 'events';

/**
 * User Events Handler
 */
export class UserEventHandler extends EventEmitter {
  constructor(io, options = {}) {
    super();
    
    this.io = io;
    this.roomManager = options.roomManager;
    this.logger = options.logger || console;
    
    // User event types
    this.eventTypes = {
      PROFILE_UPDATED: 'user:profile_updated',
      ACHIEVEMENT_UNLOCKED: 'user:achievement_unlocked',
      REPUTATION_CHANGED: 'user:reputation_changed',
      BALANCE_UPDATED: 'user:balance_updated',
      PREFERENCE_UPDATED: 'user:preference_updated',
      NOTIFICATION: 'user:notification',
      SOCIAL_INTERACTION: 'user:social_interaction',
      PROGRESS_UPDATED: 'user:progress_updated',
      STREAK_UPDATED: 'user:streak_updated',
      LEVEL_UP: 'user:level_up',
      FRIEND_REQUEST: 'user:friend_request',
      FRIEND_ACCEPTED: 'user:friend_accepted',
      MESSAGE_RECEIVED: 'user:message_received'
    };
    
    // Event statistics
    this.stats = {
      profileUpdates: 0,
      achievementsUnlocked: 0,
      reputationChanges: 0,
      balanceUpdates: 0,
      notifications: 0,
      socialInteractions: 0,
      levelUps: 0,
      friendRequests: 0
    };
    
    this.logger.info('User Events Handler initialized');
  }

  /**
   * Subscribe user to their personal updates
   */
  subscribeToUpdates(socket, data = {}) {
    try {
      const { preferences = {} } = data;
      
      // Join user-specific room
      socket.join(`user:${socket.userId}`);
      
      // Store user preferences for event filtering
      socket.userEventPreferences = {
        achievements: preferences.achievements !== false,
        reputation: preferences.reputation !== false,
        balance: preferences.balance !== false,
        social: preferences.social !== false,
        notifications: preferences.notifications !== false,
        ...preferences
      };
      
      // Send confirmation
      socket.emit('user:subscribed', {
        userId: socket.userId,
        preferences: socket.userEventPreferences,
        timestamp: new Date().toISOString()
      });
      
      this.logger.info(`User subscribed to updates: ${socket.userId}`);
      
    } catch (error) {
      this.logger.error(`Failed to subscribe user ${socket.userId} to updates:`, error);
      socket.emit('user:subscription_failed', { error: error.message });
    }
  }

  /**
   * Handle profile update
   */
  handleProfileUpdate(userId, profileData) {
    try {
      const eventData = {
        userId,
        changes: profileData.changes || {},
        updatedFields: profileData.updatedFields || [],
        timestamp: new Date().toISOString(),
        source: profileData.source || 'user_action'
      };
      
      // Update statistics
      this.stats.profileUpdates++;
      
      // Broadcast to user
      this.io.to(`user:${userId}`).emit(this.eventTypes.PROFILE_UPDATED, eventData);
      
      // Broadcast to friends if profile is public
      if (profileData.isPublic && profileData.friends) {
        profileData.friends.forEach(friendId => {
          this.io.to(`user:${friendId}`).emit(this.eventTypes.SOCIAL_INTERACTION, {
            type: 'friend_profile_updated',
            userId,
            friendId,
            changes: eventData.changes,
            timestamp: eventData.timestamp
          });
        });
      }
      
      this.logger.info(`User profile updated: ${userId}`, eventData);
      this.emit('profile_updated', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling profile update for user ${userId}:`, error);
    }
  }

  /**
   * Handle achievement unlock
   */
  handleAchievementUnlock(userId, achievementData) {
    try {
      const eventData = {
        userId,
        achievementId: achievementData.id,
        achievementName: achievementData.name,
        achievementDescription: achievementData.description,
        category: achievementData.category,
        rarity: achievementData.rarity || 'common',
        points: achievementData.points || 0,
        rewards: achievementData.rewards || {},
        timestamp: new Date().toISOString(),
        progress: achievementData.progress || {}
      };
      
      // Update statistics
      this.stats.achievementsUnlocked++;
      
      // Broadcast to user
      this.io.to(`user:${userId}`).emit(this.eventTypes.ACHIEVEMENT_UNLOCKED, {
        ...eventData,
        message: `Achievement unlocked: ${eventData.achievementName}!`,
        celebration: true
      });
      
      // Broadcast to clan if user is in one
      const userSockets = this.io.sockets.sockets;
      for (const [socketId, socket] of userSockets) {
        if (socket.userId === userId && socket.clanId) {
          this.io.to(`clan:${socket.clanId}`).emit('clan:member_achievement', {
            userId,
            username: socket.username || 'Unknown User',
            achievementName: eventData.achievementName,
            category: eventData.category,
            rarity: eventData.rarity,
            timestamp: eventData.timestamp
          });
          break;
        }
      }
      
      this.logger.info(`Achievement unlocked: ${userId} - ${eventData.achievementName}`);
      this.emit('achievement_unlocked', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling achievement unlock for user ${userId}:`, error);
    }
  }

  /**
   * Handle reputation change
   */
  handleReputationChange(userId, reputationData) {
    try {
      const eventData = {
        userId,
        previousReputation: reputationData.previousReputation,
        newReputation: reputationData.newReputation,
        change: reputationData.change,
        reason: reputationData.reason,
        source: reputationData.source || 'system',
        timestamp: new Date().toISOString()
      };
      
      // Update statistics
      this.stats.reputationChanges++;
      
      // Broadcast to user
      this.io.to(`user:${userId}`).emit(this.eventTypes.REPUTATION_CHANGED, {
        ...eventData,
        message: this.getReputationChangeMessage(eventData.change, eventData.reason)
      });
      
      // Check for reputation milestones
      this.checkReputationMilestones(userId, eventData);
      
      this.logger.info(`Reputation changed: ${userId} - ${eventData.change} (${eventData.reason})`);
      this.emit('reputation_changed', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling reputation change for user ${userId}:`, error);
    }
  }

  /**
   * Handle balance update
   */
  handleBalanceUpdate(userId, balanceData) {
    try {
      const eventData = {
        userId,
        previousBalance: balanceData.previousBalance,
        newBalance: balanceData.newBalance,
        change: balanceData.change,
        transactionType: balanceData.transactionType,
        transactionId: balanceData.transactionId,
        reason: balanceData.reason,
        timestamp: new Date().toISOString()
      };
      
      // Update statistics
      this.stats.balanceUpdates++;
      
      // Broadcast to user
      this.io.to(`user:${userId}`).emit(this.eventTypes.BALANCE_UPDATED, {
        ...eventData,
        message: this.getBalanceChangeMessage(eventData.change, eventData.transactionType)
      });
      
      // Check for balance milestones
      this.checkBalanceMilestones(userId, eventData);
      
      this.logger.info(`Balance updated: ${userId} - ${eventData.change} MLG tokens`);
      this.emit('balance_updated', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling balance update for user ${userId}:`, error);
    }
  }

  /**
   * Handle level up
   */
  handleLevelUp(userId, levelData) {
    try {
      const eventData = {
        userId,
        previousLevel: levelData.previousLevel,
        newLevel: levelData.newLevel,
        experience: levelData.experience,
        experienceToNext: levelData.experienceToNext,
        rewards: levelData.rewards || {},
        timestamp: new Date().toISOString()
      };
      
      // Update statistics
      this.stats.levelUps++;
      
      // Broadcast to user with celebration
      this.io.to(`user:${userId}`).emit(this.eventTypes.LEVEL_UP, {
        ...eventData,
        message: `Congratulations! You've reached level ${eventData.newLevel}!`,
        celebration: true
      });
      
      // Broadcast to clan if applicable
      const userSockets = this.io.sockets.sockets;
      for (const [socketId, socket] of userSockets) {
        if (socket.userId === userId && socket.clanId) {
          this.io.to(`clan:${socket.clanId}`).emit('clan:member_level_up', {
            userId,
            username: socket.username || 'Unknown User',
            newLevel: eventData.newLevel,
            timestamp: eventData.timestamp
          });
          break;
        }
      }
      
      this.logger.info(`Level up: ${userId} - Level ${eventData.newLevel}`);
      this.emit('level_up', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling level up for user ${userId}:`, error);
    }
  }

  /**
   * Handle progress update
   */
  handleProgressUpdate(userId, progressData) {
    try {
      const eventData = {
        userId,
        type: progressData.type, // 'achievement', 'quest', 'challenge', etc.
        targetId: progressData.targetId,
        targetName: progressData.targetName,
        previousProgress: progressData.previousProgress,
        newProgress: progressData.newProgress,
        maxProgress: progressData.maxProgress,
        percentage: Math.round((progressData.newProgress / progressData.maxProgress) * 100),
        timestamp: new Date().toISOString()
      };
      
      // Only send if progress is significant (avoid spam)
      const progressDiff = eventData.newProgress - eventData.previousProgress;
      const isSignificant = progressDiff >= (eventData.maxProgress * 0.1) || // 10% or more
                           eventData.percentage >= 100 || // Completed
                           eventData.percentage % 25 === 0; // 25%, 50%, 75% milestones
      
      if (isSignificant) {
        this.io.to(`user:${userId}`).emit(this.eventTypes.PROGRESS_UPDATED, eventData);
        this.logger.debug(`Progress updated: ${userId} - ${eventData.targetName} (${eventData.percentage}%)`);
      }
      
      this.emit('progress_updated', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling progress update for user ${userId}:`, error);
    }
  }

  /**
   * Handle friend request
   */
  handleFriendRequest(fromUserId, toUserId, requestData) {
    try {
      const eventData = {
        fromUserId,
        toUserId,
        requestId: requestData.requestId,
        fromUsername: requestData.fromUsername,
        message: requestData.message,
        timestamp: new Date().toISOString()
      };
      
      // Update statistics
      this.stats.friendRequests++;
      
      // Send to target user
      this.io.to(`user:${toUserId}`).emit(this.eventTypes.FRIEND_REQUEST, {
        ...eventData,
        notification: {
          title: 'Friend Request',
          message: `${eventData.fromUsername} sent you a friend request`,
          type: 'friend_request',
          actions: ['accept', 'decline']
        }
      });
      
      this.logger.info(`Friend request: ${fromUserId} -> ${toUserId}`);
      this.emit('friend_request', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling friend request from ${fromUserId} to ${toUserId}:`, error);
    }
  }

  /**
   * Handle friend request accepted
   */
  handleFriendAccepted(userId, friendId, friendData) {
    try {
      const eventData = {
        userId,
        friendId,
        friendUsername: friendData.friendUsername,
        timestamp: new Date().toISOString()
      };
      
      // Notify both users
      this.io.to(`user:${userId}`).emit(this.eventTypes.FRIEND_ACCEPTED, {
        ...eventData,
        message: `${eventData.friendUsername} accepted your friend request!`
      });
      
      this.io.to(`user:${friendId}`).emit(this.eventTypes.FRIEND_ACCEPTED, {
        userId: friendId,
        friendId: userId,
        friendUsername: friendData.username,
        message: `You are now friends with ${friendData.username}!`,
        timestamp: eventData.timestamp
      });
      
      this.logger.info(`Friend accepted: ${userId} <-> ${friendId}`);
      this.emit('friend_accepted', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling friend acceptance between ${userId} and ${friendId}:`, error);
    }
  }

  /**
   * Send personal notification
   */
  sendNotification(userId, notificationData) {
    try {
      const eventData = {
        userId,
        id: notificationData.id || this.generateNotificationId(),
        type: notificationData.type || 'info',
        title: notificationData.title,
        message: notificationData.message,
        priority: notificationData.priority || 'normal',
        category: notificationData.category || 'general',
        actions: notificationData.actions || [],
        data: notificationData.data || {},
        expiresAt: notificationData.expiresAt,
        timestamp: new Date().toISOString()
      };
      
      // Update statistics
      this.stats.notifications++;
      
      // Send to user
      this.io.to(`user:${userId}`).emit(this.eventTypes.NOTIFICATION, eventData);
      
      this.logger.info(`Notification sent: ${userId} - ${eventData.title}`);
      this.emit('notification_sent', eventData);
      
    } catch (error) {
      this.logger.error(`Error sending notification to user ${userId}:`, error);
    }
  }

  /**
   * Handle social interaction
   */
  handleSocialInteraction(userId, interactionData) {
    try {
      const eventData = {
        userId,
        type: interactionData.type, // 'like', 'comment', 'share', 'mention', etc.
        targetUserId: interactionData.targetUserId,
        targetType: interactionData.targetType, // 'content', 'comment', 'profile', etc.
        targetId: interactionData.targetId,
        actorUsername: interactionData.actorUsername,
        message: interactionData.message,
        timestamp: new Date().toISOString()
      };
      
      // Update statistics
      this.stats.socialInteractions++;
      
      // Send to affected user
      if (eventData.targetUserId && eventData.targetUserId !== userId) {
        this.io.to(`user:${eventData.targetUserId}`).emit(this.eventTypes.SOCIAL_INTERACTION, {
          ...eventData,
          notification: {
            title: this.getSocialInteractionTitle(eventData.type),
            message: this.getSocialInteractionMessage(eventData),
            type: 'social'
          }
        });
      }
      
      this.logger.debug(`Social interaction: ${userId} - ${eventData.type}`);
      this.emit('social_interaction', eventData);
      
    } catch (error) {
      this.logger.error(`Error handling social interaction for user ${userId}:`, error);
    }
  }

  /**
   * Check reputation milestones
   */
  checkReputationMilestones(userId, reputationData) {
    const milestones = [100, 500, 1000, 2500, 5000, 10000];
    const { previousReputation, newReputation } = reputationData;
    
    milestones.forEach(milestone => {
      if (previousReputation < milestone && newReputation >= milestone) {
        this.handleAchievementUnlock(userId, {
          id: `reputation_milestone_${milestone}`,
          name: `Reputation ${milestone}`,
          description: `Reached ${milestone} reputation points`,
          category: 'reputation',
          rarity: milestone >= 5000 ? 'legendary' : milestone >= 1000 ? 'epic' : 'rare',
          points: Math.floor(milestone / 100),
          rewards: {
            mlg_tokens: Math.floor(milestone / 10)
          }
        });
      }
    });
  }

  /**
   * Check balance milestones
   */
  checkBalanceMilestones(userId, balanceData) {
    const milestones = [100, 500, 1000, 5000, 10000, 50000];
    const { previousBalance, newBalance } = balanceData;
    
    milestones.forEach(milestone => {
      if (previousBalance < milestone && newBalance >= milestone) {
        this.handleAchievementUnlock(userId, {
          id: `balance_milestone_${milestone}`,
          name: `MLG Collector ${milestone}`,
          description: `Accumulated ${milestone} MLG tokens`,
          category: 'wealth',
          rarity: milestone >= 10000 ? 'legendary' : milestone >= 1000 ? 'epic' : 'rare',
          points: Math.floor(milestone / 100)
        });
      }
    });
  }

  /**
   * Generate notification message helpers
   */
  getReputationChangeMessage(change, reason) {
    const action = change > 0 ? 'gained' : 'lost';
    const amount = Math.abs(change);
    return `You ${action} ${amount} reputation points for ${reason}`;
  }

  getBalanceChangeMessage(change, transactionType) {
    const action = change > 0 ? 'received' : 'spent';
    const amount = Math.abs(change);
    return `You ${action} ${amount} MLG tokens (${transactionType})`;
  }

  getSocialInteractionTitle(type) {
    const titles = {
      'like': 'Content Liked',
      'comment': 'New Comment',
      'share': 'Content Shared',
      'mention': 'You Were Mentioned',
      'follow': 'New Follower',
      'vote': 'Vote Received'
    };
    
    return titles[type] || 'Social Interaction';
  }

  getSocialInteractionMessage(eventData) {
    const messages = {
      'like': `${eventData.actorUsername} liked your ${eventData.targetType}`,
      'comment': `${eventData.actorUsername} commented on your ${eventData.targetType}`,
      'share': `${eventData.actorUsername} shared your ${eventData.targetType}`,
      'mention': `${eventData.actorUsername} mentioned you`,
      'follow': `${eventData.actorUsername} started following you`,
      'vote': `${eventData.actorUsername} voted on your ${eventData.targetType}`
    };
    
    return messages[eventData.type] || `${eventData.actorUsername} interacted with your content`;
  }

  /**
   * Generate unique notification ID
   */
  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get user event statistics
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
      profileUpdates: 0,
      achievementsUnlocked: 0,
      reputationChanges: 0,
      balanceUpdates: 0,
      notifications: 0,
      socialInteractions: 0,
      levelUps: 0,
      friendRequests: 0
    };
    
    this.logger.info('User event statistics reset');
  }
}

export default UserEventHandler;