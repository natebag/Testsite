/**
 * MLG.clan State Reducers
 * 
 * Redux-style reducers for managing application state
 * Each reducer handles a specific domain of the application state
 * 
 * @version 1.0.0
 * @created 2025-08-12
 */

import { 
  ACTION_TYPES,
  DEFAULT_WALLET_STATE,
  DEFAULT_VOTING_STATE,
  DEFAULT_CLAN_STATE,
  DEFAULT_USER_STATE,
  DEFAULT_SETTINGS_STATE,
  DEFAULT_UI_STATE
} from './state-types.js';

// =============================================================================
// WALLET REDUCER
// =============================================================================

export function walletReducer(state = DEFAULT_WALLET_STATE, action) {
  switch (action.type) {
    case ACTION_TYPES.WALLET_CONNECT_START:
      return {
        ...state,
        isConnecting: true,
        error: null
      };

    case ACTION_TYPES.WALLET_CONNECT_SUCCESS:
      return {
        ...state,
        isConnected: true,
        isConnecting: false,
        publicKey: action.payload.publicKey,
        address: action.payload.address,
        network: action.payload.network || state.network,
        error: null
      };

    case ACTION_TYPES.WALLET_CONNECT_ERROR:
      return {
        ...state,
        isConnected: false,
        isConnecting: false,
        error: action.payload.error
      };

    case ACTION_TYPES.WALLET_DISCONNECT:
      return {
        ...DEFAULT_WALLET_STATE,
        network: state.network // Preserve network preference
      };

    case ACTION_TYPES.WALLET_UPDATE_BALANCE:
      return {
        ...state,
        balance: action.payload.balance
      };

    case ACTION_TYPES.WALLET_UPDATE_MLG_BALANCE:
      return {
        ...state,
        mlgBalance: action.payload.mlgBalance,
        tokenAccounts: {
          ...state.tokenAccounts,
          ...action.payload.tokenAccounts
        }
      };

    case ACTION_TYPES.WALLET_ADD_TRANSACTION:
      return {
        ...state,
        transactionHistory: {
          ...state.transactionHistory,
          transactions: [
            action.payload.transaction,
            ...state.transactionHistory.transactions.slice(0, 49) // Keep last 50
          ],
          lastUpdated: new Date().toISOString()
        }
      };

    default:
      return state;
  }
}

// =============================================================================
// VOTING REDUCER
// =============================================================================

export function votingReducer(state = DEFAULT_VOTING_STATE, action) {
  switch (action.type) {
    case ACTION_TYPES.VOTING_RESET_DAILY:
      return {
        ...state,
        dailyVotesRemaining: 1,
        totalVotesUsed: 0,
        lastResetTime: new Date().toISOString(),
        error: null
      };

    case ACTION_TYPES.VOTING_USE_FREE_VOTE:
      if (state.dailyVotesRemaining <= 0) {
        return {
          ...state,
          error: 'No free votes remaining'
        };
      }
      return {
        ...state,
        dailyVotesRemaining: state.dailyVotesRemaining - 1,
        totalVotesUsed: state.totalVotesUsed + 1,
        error: null
      };

    case ACTION_TYPES.VOTING_USE_BURN_VOTE:
      return {
        ...state,
        burnVotesAvailable: Math.max(0, state.burnVotesAvailable - action.payload.amount),
        totalVotesUsed: state.totalVotesUsed + action.payload.amount,
        error: null
      };

    case ACTION_TYPES.VOTING_START:
      return {
        ...state,
        isVoting: true,
        activeVotes: [
          ...state.activeVotes,
          {
            id: action.payload.voteId,
            type: action.payload.type,
            startTime: new Date().toISOString()
          }
        ],
        error: null
      };

    case ACTION_TYPES.VOTING_SUCCESS:
      return {
        ...state,
        isVoting: false,
        activeVotes: state.activeVotes.filter(vote => vote.id !== action.payload.voteId),
        voteHistory: {
          ...state.voteHistory,
          daily: [
            {
              id: action.payload.voteId,
              type: action.payload.type,
              timestamp: new Date().toISOString(),
              result: action.payload.result
            },
            ...state.voteHistory.daily.slice(0, 99) // Keep last 100
          ]
        }
      };

    case ACTION_TYPES.VOTING_ERROR:
      return {
        ...state,
        isVoting: false,
        activeVotes: state.activeVotes.filter(vote => vote.id !== action.payload.voteId),
        error: action.payload.error
      };

    case ACTION_TYPES.VOTING_UPDATE_HISTORY:
      return {
        ...state,
        voteHistory: {
          ...state.voteHistory,
          ...action.payload.history
        }
      };

    default:
      return state;
  }
}

// =============================================================================
// CLAN REDUCER
// =============================================================================

export function clanReducer(state = DEFAULT_CLAN_STATE, action) {
  switch (action.type) {
    case ACTION_TYPES.CLAN_LOAD_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case ACTION_TYPES.CLAN_LOAD_SUCCESS:
      return {
        ...state,
        isLoading: false,
        currentClan: action.payload.clan,
        membersList: action.payload.members || [],
        clanStats: action.payload.stats || state.clanStats,
        error: null
      };

    case ACTION_TYPES.CLAN_LOAD_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload.error
      };

    case ACTION_TYPES.CLAN_JOIN:
      return {
        ...state,
        currentClan: action.payload.clan,
        membersList: action.payload.members || [],
        invitations: state.invitations.filter(inv => inv.clanId !== action.payload.clan.id)
      };

    case ACTION_TYPES.CLAN_LEAVE:
      return {
        ...state,
        currentClan: null,
        membersList: [],
        clanStats: DEFAULT_CLAN_STATE.clanStats
      };

    case ACTION_TYPES.CLAN_UPDATE_MEMBERS:
      return {
        ...state,
        membersList: action.payload.members,
        clanStats: {
          ...state.clanStats,
          totalMembers: action.payload.members.length
        }
      };

    case ACTION_TYPES.CLAN_UPDATE_STATS:
      return {
        ...state,
        clanStats: {
          ...state.clanStats,
          ...action.payload.stats
        },
        leaderboard: action.payload.leaderboard || state.leaderboard
      };

    case ACTION_TYPES.CLAN_ADD_INVITATION:
      return {
        ...state,
        invitations: [
          ...state.invitations.filter(inv => inv.id !== action.payload.invitation.id),
          action.payload.invitation
        ]
      };

    case ACTION_TYPES.CLAN_REMOVE_INVITATION:
      return {
        ...state,
        invitations: state.invitations.filter(inv => inv.id !== action.payload.invitationId)
      };

    default:
      return state;
  }
}

// =============================================================================
// USER REDUCER
// =============================================================================

export function userReducer(state = DEFAULT_USER_STATE, action) {
  switch (action.type) {
    case ACTION_TYPES.USER_LOAD_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case ACTION_TYPES.USER_LOAD_SUCCESS:
      return {
        ...state,
        isLoading: false,
        profile: action.payload.profile,
        achievements: action.payload.achievements || state.achievements,
        stats: action.payload.stats || state.stats,
        lastLogin: new Date().toISOString(),
        error: null
      };

    case ACTION_TYPES.USER_LOAD_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload.error
      };

    case ACTION_TYPES.USER_UPDATE_PROFILE:
      return {
        ...state,
        profile: {
          ...state.profile,
          ...action.payload.profile
        }
      };

    case ACTION_TYPES.USER_UPDATE_PREFERENCES:
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload.preferences
        }
      };

    case ACTION_TYPES.USER_ADD_ACHIEVEMENT:
      return {
        ...state,
        achievements: [
          ...state.achievements.filter(ach => ach.id !== action.payload.achievement.id),
          {
            ...action.payload.achievement,
            unlockedAt: new Date().toISOString()
          }
        ]
      };

    case ACTION_TYPES.USER_ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [
          {
            ...action.payload.notification,
            id: action.payload.notification.id || Date.now().toString(),
            timestamp: new Date().toISOString(),
            read: false
          },
          ...state.notifications.slice(0, 49) // Keep last 50
        ]
      };

    case ACTION_TYPES.USER_REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(notif => notif.id !== action.payload.notificationId)
      };

    default:
      return state;
  }
}

// =============================================================================
// SETTINGS REDUCER
// =============================================================================

export function settingsReducer(state = DEFAULT_SETTINGS_STATE, action) {
  switch (action.type) {
    case ACTION_TYPES.SETTINGS_UPDATE_THEME:
      return {
        ...state,
        theme: action.payload.theme
      };

    case ACTION_TYPES.SETTINGS_UPDATE_LANGUAGE:
      return {
        ...state,
        language: action.payload.language
      };

    case ACTION_TYPES.SETTINGS_UPDATE_NOTIFICATIONS:
      return {
        ...state,
        notifications: {
          ...state.notifications,
          ...action.payload.notifications
        }
      };

    case ACTION_TYPES.SETTINGS_UPDATE_PRIVACY:
      return {
        ...state,
        privacy: {
          ...state.privacy,
          ...action.payload.privacy
        }
      };

    case ACTION_TYPES.SETTINGS_UPDATE_PERFORMANCE:
      return {
        ...state,
        performance: {
          ...state.performance,
          ...action.payload.performance
        }
      };

    case ACTION_TYPES.SETTINGS_RESET:
      return {
        ...DEFAULT_SETTINGS_STATE,
        // Preserve certain user-specific settings
        language: state.language,
        autoConnect: state.autoConnect
      };

    default:
      return state;
  }
}

// =============================================================================
// UI REDUCER
// =============================================================================

export function uiReducer(state = DEFAULT_UI_STATE, action) {
  switch (action.type) {
    case ACTION_TYPES.UI_SHOW_MODAL:
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload.modalName]: true
        }
      };

    case ACTION_TYPES.UI_HIDE_MODAL:
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload.modalName]: false
        }
      };

    case ACTION_TYPES.UI_SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.isLoading
        }
      };

    case ACTION_TYPES.UI_ADD_ALERT:
      return {
        ...state,
        alerts: [
          ...state.alerts,
          {
            ...action.payload.alert,
            id: action.payload.alert.id || Date.now().toString(),
            timestamp: new Date().toISOString()
          }
        ]
      };

    case ACTION_TYPES.UI_REMOVE_ALERT:
      return {
        ...state,
        alerts: state.alerts.filter(alert => alert.id !== action.payload.alertId)
      };

    case ACTION_TYPES.UI_TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen
      };

    case ACTION_TYPES.UI_SET_CURRENT_PAGE:
      return {
        ...state,
        navigation: {
          previousPage: state.currentPage,
          currentPage: action.payload.page
        },
        currentPage: action.payload.page
      };

    default:
      return state;
  }
}

// =============================================================================
// ROOT REDUCER
// =============================================================================

/**
 * Root reducer combining all domain reducers
 * @param {Object} state - Current application state
 * @param {Object} action - Redux action object
 * @returns {Object} - New application state
 */
export function rootReducer(state = {}, action) {
  return {
    wallet: walletReducer(state.wallet, action),
    voting: votingReducer(state.voting, action),
    clan: clanReducer(state.clan, action),
    user: userReducer(state.user, action),
    settings: settingsReducer(state.settings, action),
    ui: uiReducer(state.ui, action)
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Creates an action object with consistent structure
 * @param {string} type - Action type
 * @param {Object} payload - Action payload
 * @returns {Object} - Action object
 */
export function createAction(type, payload = {}) {
  return {
    type,
    payload,
    timestamp: new Date().toISOString()
  };
}

/**
 * Creates async action creators for common patterns
 * @param {string} baseType - Base action type (e.g., 'WALLET_CONNECT')
 * @returns {Object} - Object with start, success, and error action creators
 */
export function createAsyncActions(baseType) {
  return {
    start: (payload) => createAction(`${baseType}_START`, payload),
    success: (payload) => createAction(`${baseType}_SUCCESS`, payload),
    error: (error) => createAction(`${baseType}_ERROR`, { error })
  };
}

/**
 * Validates action object structure
 * @param {Object} action - Action to validate
 * @returns {boolean} - Whether action is valid
 */
export function validateAction(action) {
  return (
    action &&
    typeof action === 'object' &&
    typeof action.type === 'string' &&
    action.type.length > 0
  );
}

export default {
  walletReducer,
  votingReducer,
  clanReducer,
  userReducer,
  settingsReducer,
  uiReducer,
  rootReducer,
  createAction,
  createAsyncActions,
  validateAction
};