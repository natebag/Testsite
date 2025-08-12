/**
 * MLG.clan State Action Creators
 * 
 * Centralized action creators for all state operations
 * Provides consistent API for triggering state changes
 * 
 * @version 1.0.0
 * @created 2025-08-12
 */

import { ACTION_TYPES } from './state-types.js';
import { createAction, createAsyncActions } from './state-reducers.js';

// =============================================================================
// WALLET ACTION CREATORS
// =============================================================================

export const walletActions = {
  // Connection actions
  connectStart: () => createAction(ACTION_TYPES.WALLET_CONNECT_START),
  
  connectSuccess: (publicKey, address, network = 'mainnet-beta') => 
    createAction(ACTION_TYPES.WALLET_CONNECT_SUCCESS, { 
      publicKey, 
      address, 
      network 
    }),
  
  connectError: (error) => 
    createAction(ACTION_TYPES.WALLET_CONNECT_ERROR, { 
      error: typeof error === 'string' ? error : error.message 
    }),
  
  disconnect: () => createAction(ACTION_TYPES.WALLET_DISCONNECT),

  // Balance actions
  updateBalance: (balance) => 
    createAction(ACTION_TYPES.WALLET_UPDATE_BALANCE, { balance }),
  
  updateMLGBalance: (mlgBalance, tokenAccounts = {}) => 
    createAction(ACTION_TYPES.WALLET_UPDATE_MLG_BALANCE, { 
      mlgBalance, 
      tokenAccounts 
    }),

  // Transaction actions
  addTransaction: (transaction) => {
    const txData = {
      id: transaction.signature || Date.now().toString(),
      signature: transaction.signature,
      type: transaction.type || 'unknown',
      amount: transaction.amount || 0,
      status: transaction.status || 'pending',
      timestamp: new Date().toISOString(),
      ...transaction
    };
    return createAction(ACTION_TYPES.WALLET_ADD_TRANSACTION, { transaction: txData });
  }
};

// =============================================================================
// VOTING ACTION CREATORS
// =============================================================================

export const votingActions = {
  // Daily management
  resetDaily: () => createAction(ACTION_TYPES.VOTING_RESET_DAILY),
  
  // Vote usage
  useFreeVote: () => createAction(ACTION_TYPES.VOTING_USE_FREE_VOTE),
  
  useBurnVote: (amount = 1) => {
    if (amount < 1 || amount > 4) {
      throw new Error('Burn vote amount must be between 1 and 4');
    }
    return createAction(ACTION_TYPES.VOTING_USE_BURN_VOTE, { amount });
  },

  // Vote process
  startVote: (voteId, type = 'content', metadata = {}) => 
    createAction(ACTION_TYPES.VOTING_START, { 
      voteId: voteId || Date.now().toString(), 
      type,
      metadata 
    }),
  
  voteSuccess: (voteId, type, result = {}) => 
    createAction(ACTION_TYPES.VOTING_SUCCESS, { 
      voteId, 
      type, 
      result: {
        success: true,
        timestamp: new Date().toISOString(),
        ...result
      }
    }),
  
  voteError: (voteId, error) => 
    createAction(ACTION_TYPES.VOTING_ERROR, { 
      voteId, 
      error: typeof error === 'string' ? error : error.message 
    }),

  // History management
  updateHistory: (historyData) => 
    createAction(ACTION_TYPES.VOTING_UPDATE_HISTORY, { history: historyData })
};

// =============================================================================
// CLAN ACTION CREATORS
// =============================================================================

export const clanActions = {
  // Loading states
  loadStart: () => createAction(ACTION_TYPES.CLAN_LOAD_START),
  
  loadSuccess: (clan, members = [], stats = {}) => 
    createAction(ACTION_TYPES.CLAN_LOAD_SUCCESS, { 
      clan, 
      members, 
      stats 
    }),
  
  loadError: (error) => 
    createAction(ACTION_TYPES.CLAN_LOAD_ERROR, { 
      error: typeof error === 'string' ? error : error.message 
    }),

  // Clan membership
  joinClan: (clan, members = []) => 
    createAction(ACTION_TYPES.CLAN_JOIN, { clan, members }),
  
  leaveClan: () => createAction(ACTION_TYPES.CLAN_LEAVE),

  // Member management
  updateMembers: (members) => 
    createAction(ACTION_TYPES.CLAN_UPDATE_MEMBERS, { members }),

  // Statistics
  updateStats: (stats, leaderboard = null) => 
    createAction(ACTION_TYPES.CLAN_UPDATE_STATS, { stats, leaderboard }),

  // Invitations
  addInvitation: (invitation) => {
    const inviteData = {
      id: invitation.id || Date.now().toString(),
      clanId: invitation.clanId,
      clanName: invitation.clanName,
      inviterName: invitation.inviterName,
      timestamp: new Date().toISOString(),
      expiresAt: invitation.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      ...invitation
    };
    return createAction(ACTION_TYPES.CLAN_ADD_INVITATION, { invitation: inviteData });
  },
  
  removeInvitation: (invitationId) => 
    createAction(ACTION_TYPES.CLAN_REMOVE_INVITATION, { invitationId })
};

// =============================================================================
// USER ACTION CREATORS
// =============================================================================

export const userActions = {
  // Loading states
  loadStart: () => createAction(ACTION_TYPES.USER_LOAD_START),
  
  loadSuccess: (profile, achievements = [], stats = {}) => 
    createAction(ACTION_TYPES.USER_LOAD_SUCCESS, { 
      profile, 
      achievements, 
      stats 
    }),
  
  loadError: (error) => 
    createAction(ACTION_TYPES.USER_LOAD_ERROR, { 
      error: typeof error === 'string' ? error : error.message 
    }),

  // Profile management
  updateProfile: (profileUpdates) => 
    createAction(ACTION_TYPES.USER_UPDATE_PROFILE, { profile: profileUpdates }),
  
  updatePreferences: (preferenceUpdates) => 
    createAction(ACTION_TYPES.USER_UPDATE_PREFERENCES, { preferences: preferenceUpdates }),

  // Achievements
  addAchievement: (achievement) => {
    const achievementData = {
      id: achievement.id || Date.now().toString(),
      name: achievement.name,
      description: achievement.description,
      type: achievement.type || 'milestone',
      rarity: achievement.rarity || 'common',
      points: achievement.points || 0,
      unlockedAt: new Date().toISOString(),
      ...achievement
    };
    return createAction(ACTION_TYPES.USER_ADD_ACHIEVEMENT, { achievement: achievementData });
  },

  // Notifications
  addNotification: (notification) => {
    const notifData = {
      id: notification.id || Date.now().toString(),
      type: notification.type || 'info',
      title: notification.title,
      message: notification.message,
      priority: notification.priority || 'normal',
      read: false,
      timestamp: new Date().toISOString(),
      expiresAt: notification.expiresAt,
      ...notification
    };
    return createAction(ACTION_TYPES.USER_ADD_NOTIFICATION, { notification: notifData });
  },
  
  removeNotification: (notificationId) => 
    createAction(ACTION_TYPES.USER_REMOVE_NOTIFICATION, { notificationId })
};

// =============================================================================
// SETTINGS ACTION CREATORS
// =============================================================================

export const settingsActions = {
  updateTheme: (theme) => {
    if (!['xbox', 'dark', 'light'].includes(theme)) {
      throw new Error('Invalid theme. Must be xbox, dark, or light');
    }
    return createAction(ACTION_TYPES.SETTINGS_UPDATE_THEME, { theme });
  },
  
  updateLanguage: (language) => 
    createAction(ACTION_TYPES.SETTINGS_UPDATE_LANGUAGE, { language }),
  
  updateNotifications: (notificationSettings) => 
    createAction(ACTION_TYPES.SETTINGS_UPDATE_NOTIFICATIONS, { 
      notifications: notificationSettings 
    }),
  
  updatePrivacy: (privacySettings) => 
    createAction(ACTION_TYPES.SETTINGS_UPDATE_PRIVACY, { 
      privacy: privacySettings 
    }),
  
  updatePerformance: (performanceSettings) => 
    createAction(ACTION_TYPES.SETTINGS_UPDATE_PERFORMANCE, { 
      performance: performanceSettings 
    }),
  
  reset: () => createAction(ACTION_TYPES.SETTINGS_RESET)
};

// =============================================================================
// UI ACTION CREATORS
// =============================================================================

export const uiActions = {
  // Modal management
  showModal: (modalName) => 
    createAction(ACTION_TYPES.UI_SHOW_MODAL, { modalName }),
  
  hideModal: (modalName) => 
    createAction(ACTION_TYPES.UI_HIDE_MODAL, { modalName }),
  
  hideAllModals: () => {
    // This would require a custom action type or multiple actions
    // For now, we'll return an array of actions
    const modalNames = ['walletConnect', 'clanInvite', 'voteConfirm', 'settings'];
    return modalNames.map(modalName => 
      createAction(ACTION_TYPES.UI_HIDE_MODAL, { modalName })
    );
  },

  // Loading states
  setLoading: (key, isLoading) => 
    createAction(ACTION_TYPES.UI_SET_LOADING, { key, isLoading }),
  
  setGlobalLoading: (isLoading) => 
    createAction(ACTION_TYPES.UI_SET_LOADING, { key: 'global', isLoading }),

  // Alert management
  addAlert: (alert) => {
    const alertData = {
      id: alert.id || Date.now().toString(),
      type: alert.type || 'info', // info, success, warning, error
      title: alert.title,
      message: alert.message,
      duration: alert.duration || 5000, // Auto-dismiss after 5 seconds
      persistent: alert.persistent || false,
      timestamp: new Date().toISOString(),
      ...alert
    };
    return createAction(ACTION_TYPES.UI_ADD_ALERT, { alert: alertData });
  },
  
  removeAlert: (alertId) => 
    createAction(ACTION_TYPES.UI_REMOVE_ALERT, { alertId }),

  // Navigation
  toggleSidebar: () => createAction(ACTION_TYPES.UI_TOGGLE_SIDEBAR),
  
  setCurrentPage: (page) => 
    createAction(ACTION_TYPES.UI_SET_CURRENT_PAGE, { page })
};

// =============================================================================
// COMPOSITE ACTION CREATORS
// =============================================================================

export const compositeActions = {
  /**
   * Initialize user session with wallet connection
   */
  initializeUserSession: (walletData, userData) => [
    walletActions.connectSuccess(
      walletData.publicKey, 
      walletData.address, 
      walletData.network
    ),
    userActions.loadSuccess(userData.profile, userData.achievements, userData.stats),
    uiActions.addAlert({
      type: 'success',
      title: 'Connected',
      message: 'Wallet connected successfully'
    })
  ],

  /**
   * Complete voting action with all related updates
   */
  completeVote: (voteId, voteType, result, walletUpdates) => [
    votingActions.voteSuccess(voteId, voteType, result),
    walletActions.updateMLGBalance(walletUpdates.mlgBalance, walletUpdates.tokenAccounts),
    walletActions.addTransaction({
      type: 'vote',
      signature: result.signature,
      amount: result.burnAmount || 0,
      status: 'confirmed'
    }),
    uiActions.addAlert({
      type: 'success',
      title: 'Vote Submitted',
      message: `Your ${voteType} vote has been recorded`
    })
  ],

  /**
   * Handle error with user notification
   */
  handleError: (error, context = 'general') => [
    uiActions.addAlert({
      type: 'error',
      title: 'Error',
      message: typeof error === 'string' ? error : error.message,
      persistent: true
    }),
    uiActions.setLoading(context, false)
  ]
};

// =============================================================================
// ASYNC ACTION HELPERS
// =============================================================================

export const asyncActions = {
  wallet: createAsyncActions('WALLET_CONNECT'),
  clan: createAsyncActions('CLAN_LOAD'),
  user: createAsyncActions('USER_LOAD'),
  voting: createAsyncActions('VOTING')
};

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  walletActions,
  votingActions,
  clanActions,
  userActions,
  settingsActions,
  uiActions,
  compositeActions,
  asyncActions
};