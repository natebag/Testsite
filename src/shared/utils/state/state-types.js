/**
 * MLG.clan State Management Types and Constants
 * 
 * TypeScript-style type definitions and constants for the state management system
 * Provides consistent type checking and validation for all state operations
 * 
 * @version 1.0.0
 * @created 2025-08-12
 */

// =============================================================================
// STATE STRUCTURE TYPES
// =============================================================================

/**
 * Main application state structure
 * @typedef {Object} AppState
 * @property {WalletState} wallet - Wallet connection and authentication state
 * @property {VotingState} voting - Voting system state
 * @property {ClanState} clan - Clan management state
 * @property {UserState} user - User profile and preferences state
 * @property {SettingsState} settings - Application settings state
 * @property {UIState} ui - UI state (modals, loading, etc.)
 */

/**
 * Wallet state structure
 * @typedef {Object} WalletState
 * @property {boolean} isConnected - Whether wallet is connected
 * @property {string|null} publicKey - Wallet public key
 * @property {string|null} address - Wallet address string
 * @property {number} balance - SOL balance in lamports
 * @property {number} mlgBalance - MLG token balance
 * @property {Object} tokenAccounts - Associated token accounts
 * @property {boolean} isConnecting - Connection loading state
 * @property {string|null} error - Connection error message
 * @property {string|null} network - Solana network (mainnet-beta, devnet, etc.)
 * @property {Object} transactionHistory - Recent transaction history
 */

/**
 * Voting state structure
 * @typedef {Object} VotingState
 * @property {number} dailyVotesRemaining - Free votes remaining today
 * @property {number} totalVotesUsed - Total votes used today
 * @property {number} burnVotesAvailable - Available burn-to-vote count
 * @property {Array} activeVotes - Currently active vote sessions
 * @property {Object} voteHistory - Historical voting data
 * @property {boolean} isVoting - Voting operation in progress
 * @property {string|null} error - Voting error message
 * @property {Date|null} lastResetTime - Last daily reset timestamp
 */

/**
 * Clan state structure
 * @typedef {Object} ClanState
 * @property {Object|null} currentClan - Current user's clan data
 * @property {Array} membersList - Clan members list
 * @property {Object} clanStats - Clan statistics and metrics
 * @property {Array} invitations - Pending clan invitations
 * @property {Array} availableClans - Clans available to join
 * @property {boolean} isLoading - Clan data loading state
 * @property {string|null} error - Clan operation error
 * @property {Object} leaderboard - Clan leaderboard data
 */

/**
 * User state structure
 * @typedef {Object} UserState
 * @property {Object|null} profile - User profile data
 * @property {Object} preferences - User preferences and settings
 * @property {Array} achievements - User achievements and badges
 * @property {Object} stats - User statistics and metrics
 * @property {Array} notifications - User notifications
 * @property {boolean} isLoading - Profile loading state
 * @property {string|null} error - Profile error message
 * @property {Date|null} lastLogin - Last login timestamp
 */

/**
 * Settings state structure
 * @typedef {Object} SettingsState
 * @property {string} theme - UI theme (dark, light, xbox)
 * @property {string} language - Selected language
 * @property {Object} notifications - Notification preferences
 * @property {Object} privacy - Privacy settings
 * @property {Object} performance - Performance preferences
 * @property {boolean} autoConnect - Auto-connect wallet setting
 * @property {string} defaultNetwork - Default Solana network
 */

/**
 * UI state structure
 * @typedef {Object} UIState
 * @property {Object} modals - Modal visibility state
 * @property {Object} loading - Global loading states
 * @property {Array} alerts - Active alert messages
 * @property {Object} navigation - Navigation state
 * @property {boolean} sidebarOpen - Sidebar visibility
 * @property {string} currentPage - Current page identifier
 */

// =============================================================================
// ACTION TYPES
// =============================================================================

export const ACTION_TYPES = {
  // Wallet Actions
  WALLET_CONNECT_START: 'WALLET_CONNECT_START',
  WALLET_CONNECT_SUCCESS: 'WALLET_CONNECT_SUCCESS',
  WALLET_CONNECT_ERROR: 'WALLET_CONNECT_ERROR',
  WALLET_DISCONNECT: 'WALLET_DISCONNECT',
  WALLET_UPDATE_BALANCE: 'WALLET_UPDATE_BALANCE',
  WALLET_UPDATE_MLG_BALANCE: 'WALLET_UPDATE_MLG_BALANCE',
  WALLET_ADD_TRANSACTION: 'WALLET_ADD_TRANSACTION',

  // Voting Actions
  VOTING_RESET_DAILY: 'VOTING_RESET_DAILY',
  VOTING_USE_FREE_VOTE: 'VOTING_USE_FREE_VOTE',
  VOTING_USE_BURN_VOTE: 'VOTING_USE_BURN_VOTE',
  VOTING_START: 'VOTING_START',
  VOTING_SUCCESS: 'VOTING_SUCCESS',
  VOTING_ERROR: 'VOTING_ERROR',
  VOTING_UPDATE_HISTORY: 'VOTING_UPDATE_HISTORY',

  // Clan Actions
  CLAN_LOAD_START: 'CLAN_LOAD_START',
  CLAN_LOAD_SUCCESS: 'CLAN_LOAD_SUCCESS',
  CLAN_LOAD_ERROR: 'CLAN_LOAD_ERROR',
  CLAN_JOIN: 'CLAN_JOIN',
  CLAN_LEAVE: 'CLAN_LEAVE',
  CLAN_UPDATE_MEMBERS: 'CLAN_UPDATE_MEMBERS',
  CLAN_UPDATE_STATS: 'CLAN_UPDATE_STATS',
  CLAN_ADD_INVITATION: 'CLAN_ADD_INVITATION',
  CLAN_REMOVE_INVITATION: 'CLAN_REMOVE_INVITATION',

  // User Actions
  USER_LOAD_START: 'USER_LOAD_START',
  USER_LOAD_SUCCESS: 'USER_LOAD_SUCCESS',
  USER_LOAD_ERROR: 'USER_LOAD_ERROR',
  USER_UPDATE_PROFILE: 'USER_UPDATE_PROFILE',
  USER_UPDATE_PREFERENCES: 'USER_UPDATE_PREFERENCES',
  USER_ADD_ACHIEVEMENT: 'USER_ADD_ACHIEVEMENT',
  USER_ADD_NOTIFICATION: 'USER_ADD_NOTIFICATION',
  USER_REMOVE_NOTIFICATION: 'USER_REMOVE_NOTIFICATION',

  // Settings Actions
  SETTINGS_UPDATE_THEME: 'SETTINGS_UPDATE_THEME',
  SETTINGS_UPDATE_LANGUAGE: 'SETTINGS_UPDATE_LANGUAGE',
  SETTINGS_UPDATE_NOTIFICATIONS: 'SETTINGS_UPDATE_NOTIFICATIONS',
  SETTINGS_UPDATE_PRIVACY: 'SETTINGS_UPDATE_PRIVACY',
  SETTINGS_UPDATE_PERFORMANCE: 'SETTINGS_UPDATE_PERFORMANCE',
  SETTINGS_RESET: 'SETTINGS_RESET',

  // UI Actions
  UI_SHOW_MODAL: 'UI_SHOW_MODAL',
  UI_HIDE_MODAL: 'UI_HIDE_MODAL',
  UI_SET_LOADING: 'UI_SET_LOADING',
  UI_ADD_ALERT: 'UI_ADD_ALERT',
  UI_REMOVE_ALERT: 'UI_REMOVE_ALERT',
  UI_TOGGLE_SIDEBAR: 'UI_TOGGLE_SIDEBAR',
  UI_SET_CURRENT_PAGE: 'UI_SET_CURRENT_PAGE'
};

// =============================================================================
// DEFAULT STATE VALUES
// =============================================================================

export const DEFAULT_WALLET_STATE = {
  isConnected: false,
  publicKey: null,
  address: null,
  balance: 0,
  mlgBalance: 0,
  tokenAccounts: {},
  isConnecting: false,
  error: null,
  network: 'mainnet-beta',
  transactionHistory: {
    transactions: [],
    lastUpdated: null
  }
};

export const DEFAULT_VOTING_STATE = {
  dailyVotesRemaining: 1,
  totalVotesUsed: 0,
  burnVotesAvailable: 0,
  activeVotes: [],
  voteHistory: {
    daily: [],
    weekly: [],
    monthly: []
  },
  isVoting: false,
  error: null,
  lastResetTime: null
};

export const DEFAULT_CLAN_STATE = {
  currentClan: null,
  membersList: [],
  clanStats: {
    totalMembers: 0,
    totalVotes: 0,
    weeklyActivity: 0,
    ranking: null
  },
  invitations: [],
  availableClans: [],
  isLoading: false,
  error: null,
  leaderboard: {
    top: [],
    userRank: null,
    lastUpdated: null
  }
};

export const DEFAULT_USER_STATE = {
  profile: null,
  preferences: {
    notifications: true,
    darkMode: true,
    autoConnect: false,
    language: 'en'
  },
  achievements: [],
  stats: {
    totalVotes: 0,
    tokensEarned: 0,
    clanContributions: 0,
    joinDate: null
  },
  notifications: [],
  isLoading: false,
  error: null,
  lastLogin: null
};

export const DEFAULT_SETTINGS_STATE = {
  theme: 'xbox', // xbox, dark, light
  language: 'en',
  notifications: {
    votes: true,
    clan: true,
    achievements: true,
    system: true
  },
  privacy: {
    showProfile: true,
    showStats: true,
    allowInvitations: true
  },
  performance: {
    animations: true,
    autoRefresh: true,
    cacheEnabled: true
  },
  autoConnect: false,
  defaultNetwork: 'mainnet-beta'
};

export const DEFAULT_UI_STATE = {
  modals: {
    walletConnect: false,
    clanInvite: false,
    voteConfirm: false,
    settings: false
  },
  loading: {
    global: false,
    wallet: false,
    voting: false,
    clan: false
  },
  alerts: [],
  navigation: {
    previousPage: null,
    currentPage: 'home'
  },
  sidebarOpen: false,
  currentPage: 'home'
};

// =============================================================================
// PERSISTENCE CONFIGURATION
// =============================================================================

export const PERSISTENCE_CONFIG = {
  // Keys that should be persisted to localStorage
  PERSISTENT_KEYS: [
    'user.preferences',
    'settings',
    'wallet.address',
    'wallet.network'
  ],
  
  // Keys that should never be persisted (security)
  NEVER_PERSIST: [
    'wallet.privateKey',
    'wallet.secretKey',
    'user.profile.privateData'
  ],
  
  // Session storage keys (cleared on page reload)
  SESSION_KEYS: [
    'ui.modals',
    'ui.alerts',
    'voting.activeVotes'
  ],
  
  // Storage key prefix
  STORAGE_PREFIX: 'mlg_clan_',
  
  // Cache expiry times (in milliseconds)
  CACHE_EXPIRY: {
    user: 5 * 60 * 1000, // 5 minutes
    clan: 2 * 60 * 1000, // 2 minutes
    voting: 30 * 1000,   // 30 seconds
    settings: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validates if a value matches the expected type structure
 * @param {any} value - Value to validate
 * @param {string} type - Expected type name
 * @returns {boolean} - Whether value is valid
 */
export function validateStateType(value, type) {
  if (!value || typeof value !== 'object') return false;
  
  switch (type) {
    case 'WalletState':
      return 'isConnected' in value && 'publicKey' in value;
    case 'VotingState':
      return 'dailyVotesRemaining' in value && 'totalVotesUsed' in value;
    case 'ClanState':
      return 'currentClan' in value && 'membersList' in value;
    case 'UserState':
      return 'profile' in value && 'preferences' in value;
    case 'SettingsState':
      return 'theme' in value && 'language' in value;
    case 'UIState':
      return 'modals' in value && 'loading' in value;
    default:
      return false;
  }
}

/**
 * Sanitizes state data for persistence
 * @param {Object} state - State object to sanitize
 * @returns {Object} - Sanitized state object
 */
export function sanitizeStateForPersistence(state) {
  const sanitized = { ...state };
  
  // Remove sensitive data
  PERSISTENCE_CONFIG.NEVER_PERSIST.forEach(key => {
    const keys = key.split('.');
    let obj = sanitized;
    for (let i = 0; i < keys.length - 1; i++) {
      if (obj[keys[i]]) {
        obj = obj[keys[i]];
      }
    }
    if (obj && keys[keys.length - 1] in obj) {
      delete obj[keys[keys.length - 1]];
    }
  });
  
  return sanitized;
}

export default {
  ACTION_TYPES,
  DEFAULT_WALLET_STATE,
  DEFAULT_VOTING_STATE,
  DEFAULT_CLAN_STATE,
  DEFAULT_USER_STATE,
  DEFAULT_SETTINGS_STATE,
  DEFAULT_UI_STATE,
  PERSISTENCE_CONFIG,
  validateStateType,
  sanitizeStateForPersistence
};