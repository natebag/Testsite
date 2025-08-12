/**
 * MLG.clan State Management System - Main Export
 * 
 * Centralized export for all state management functionality
 * Provides a clean API for importing state management components
 * 
 * @version 1.0.0
 * @created 2025-08-12
 */

// =============================================================================
// CORE STATE SYSTEM EXPORTS
// =============================================================================

// Types and constants
export {
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
} from './state-types.js';

// Reducers
export {
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
} from './state-reducers.js';

// Persistence
export {
  saveState,
  loadState,
  clearPersistedState,
  getStorageInfo,
  createPersistenceMiddleware,
  storageManager
} from './state-persistence.js';

// Context and hooks
export {
  MLGStateProvider,
  useMLGState,
  useMLGDispatch,
  useMLGStateAndDispatch,
  useWallet,
  useVoting,
  useClan,
  useUser,
  useSettings,
  useUI,
  withMLGState
} from './state-context.jsx';

// Action creators
export {
  walletActions,
  votingActions,
  clanActions,
  userActions,
  settingsActions,
  uiActions,
  compositeActions,
  asyncActions
} from './state-actions.js';

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

// Most commonly used imports
export {
  MLGStateProvider as StateProvider,
  useMLGState as useState,
  useMLGDispatch as useDispatch
} from './state-context.jsx';

// =============================================================================
// STATE MANAGEMENT UTILITIES
// =============================================================================

/**
 * Create a complete state management setup for the MLG platform
 * @param {Object} options - Configuration options
 * @returns {Object} - State management configuration
 */
export function createMLGStateManagement(options = {}) {
  const {
    initialState = {},
    enablePersistence = true,
    enableDevTools = process.env.NODE_ENV === 'development',
    enableLogging = process.env.NODE_ENV === 'development'
  } = options;

  return {
    initialState,
    enablePersistence,
    enableDevTools,
    enableLogging,
    // Add more configuration as needed
  };
}

/**
 * State management helper functions
 */
export const stateUtils = {
  /**
   * Check if state is properly initialized
   * @param {Object} state - State to check
   * @returns {boolean} - Whether state is valid
   */
  isStateValid(state) {
    if (!state || typeof state !== 'object') return false;
    
    const requiredKeys = ['wallet', 'voting', 'clan', 'user', 'settings', 'ui'];
    return requiredKeys.every(key => key in state);
  },

  /**
   * Get state statistics for debugging
   * @param {Object} state - Application state
   * @returns {Object} - State statistics
   */
  getStateStats(state) {
    if (!this.isStateValid(state)) {
      return { valid: false, error: 'Invalid state structure' };
    }

    return {
      valid: true,
      wallet: {
        connected: state.wallet.isConnected,
        balance: state.wallet.balance,
        mlgBalance: state.wallet.mlgBalance
      },
      voting: {
        freeVotesRemaining: state.voting.dailyVotesRemaining,
        totalVotesUsed: state.voting.totalVotesUsed,
        isVoting: state.voting.isVoting
      },
      clan: {
        hasClan: !!state.clan.currentClan,
        memberCount: state.clan.membersList.length,
        isLoading: state.clan.isLoading
      },
      user: {
        hasProfile: !!state.user.profile,
        achievementCount: state.user.achievements.length,
        notificationCount: state.user.notifications.length
      },
      ui: {
        openModals: Object.keys(state.ui.modals).filter(key => state.ui.modals[key]),
        alertCount: state.ui.alerts.length,
        currentPage: state.ui.currentPage
      }
    };
  },

  /**
   * Reset specific state domains
   * @param {Array} domains - Array of domain names to reset
   * @returns {Array} - Array of reset actions
   */
  createResetActions(domains = []) {
    const actions = [];
    
    if (domains.includes('wallet') || domains.includes('all')) {
      actions.push({ type: ACTION_TYPES.WALLET_DISCONNECT });
    }
    
    if (domains.includes('voting') || domains.includes('all')) {
      actions.push({ type: ACTION_TYPES.VOTING_RESET_DAILY });
    }
    
    if (domains.includes('clan') || domains.includes('all')) {
      actions.push({ type: ACTION_TYPES.CLAN_LEAVE });
    }
    
    if (domains.includes('settings') || domains.includes('all')) {
      actions.push({ type: ACTION_TYPES.SETTINGS_RESET });
    }
    
    return actions;
  }
};

// =============================================================================
// DEVELOPMENT HELPERS
// =============================================================================

/**
 * Development mode state inspector
 * Only available in development builds
 */
export const devTools = {
  /**
   * Log state changes to console
   * @param {Object} prevState - Previous state
   * @param {Object} nextState - Next state
   * @param {Object} action - Action that caused the change
   */
  logStateChange(prevState, nextState, action) {
    if (process.env.NODE_ENV !== 'development') return;
    
    console.group(`🎮 MLG State: ${action.type}`);
    console.log('Action:', action);
    console.log('Previous State:', prevState);
    console.log('Next State:', nextState);
    console.groupEnd();
  },

  /**
   * Get state diff between two states
   * @param {Object} prevState - Previous state
   * @param {Object} nextState - Next state
   * @returns {Object} - State differences
   */
  getStateDiff(prevState, nextState) {
    const diff = {};
    
    Object.keys(nextState).forEach(domain => {
      if (JSON.stringify(prevState[domain]) !== JSON.stringify(nextState[domain])) {
        diff[domain] = {
          prev: prevState[domain],
          next: nextState[domain]
        };
      }
    });
    
    return diff;
  },

  /**
   * Validate state integrity
   * @param {Object} state - State to validate
   * @returns {Object} - Validation result
   */
  validateState(state) {
    const errors = [];
    const warnings = [];
    
    // Check required structure
    if (!stateUtils.isStateValid(state)) {
      errors.push('Invalid state structure');
    }
    
    // Check wallet state
    if (state.wallet?.isConnected && !state.wallet.publicKey) {
      errors.push('Wallet marked as connected but no public key');
    }
    
    // Check voting state
    if (state.voting?.dailyVotesRemaining < 0) {
      errors.push('Negative daily votes remaining');
    }
    
    // Check for potential memory leaks
    if (state.user?.notifications?.length > 100) {
      warnings.push('Large number of notifications - potential memory leak');
    }
    
    if (state.ui?.alerts?.length > 20) {
      warnings.push('Large number of alerts - potential memory leak');
    }
    
    return { errors, warnings, valid: errors.length === 0 };
  }
};

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default {
  // Main components
  MLGStateProvider,
  useMLGState,
  useMLGDispatch,
  
  // Domain hooks
  useWallet,
  useVoting,
  useClan,
  useUser,
  useSettings,
  useUI,
  
  // Action creators
  walletActions,
  votingActions,
  clanActions,
  userActions,
  settingsActions,
  uiActions,
  
  // Utilities
  createMLGStateManagement,
  stateUtils,
  devTools
};