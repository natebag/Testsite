/**
 * MLG.clan State Context and Providers
 * 
 * React Context API implementation for global state management
 * Provides contexts, providers, and custom hooks for state access
 * 
 * @version 1.0.0
 * @created 2025-08-12
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { 
  rootReducer, 
  createAction, 
  createAsyncActions,
  validateAction 
} from './state-reducers.js';
import { 
  DEFAULT_WALLET_STATE,
  DEFAULT_VOTING_STATE,
  DEFAULT_CLAN_STATE,
  DEFAULT_USER_STATE,
  DEFAULT_SETTINGS_STATE,
  DEFAULT_UI_STATE,
  ACTION_TYPES 
} from './state-types.js';
import { 
  saveState, 
  loadState, 
  createPersistenceMiddleware 
} from './state-persistence.js';

// =============================================================================
// CONTEXT DEFINITIONS
// =============================================================================

const StateContext = createContext();
const DispatchContext = createContext();

// Individual domain contexts for optimized re-renders
const WalletContext = createContext();
const VotingContext = createContext();
const ClanContext = createContext();
const UserContext = createContext();
const SettingsContext = createContext();
const UIContext = createContext();

// =============================================================================
// MAIN STATE PROVIDER
// =============================================================================

/**
 * Main application state provider
 * Combines all state domains and provides persistence
 */
export function MLGStateProvider({ children, initialState = {} }) {
  // Initialize state with defaults and loaded persistent state
  const defaultState = {
    wallet: DEFAULT_WALLET_STATE,
    voting: DEFAULT_VOTING_STATE,
    clan: DEFAULT_CLAN_STATE,
    user: DEFAULT_USER_STATE,
    settings: DEFAULT_SETTINGS_STATE,
    ui: DEFAULT_UI_STATE
  };

  const loadedState = loadState();
  const mergedState = mergeStates(defaultState, loadedState, initialState);

  // Create reducer with persistence middleware
  const enhancedReducer = useCallback((state, action) => {
    if (!validateAction(action)) {
      console.warn('Invalid action:', action);
      return state;
    }

    const newState = rootReducer(state, action);
    
    // Auto-save state on changes (debounced in persistence layer)
    if (newState !== state) {
      saveState(newState);
    }

    return newState;
  }, []);

  const [state, dispatch] = useReducer(enhancedReducer, mergedState);

  // Enhanced dispatch with action validation and logging
  const enhancedDispatch = useCallback((action) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎮 MLG State Action:', action);
    }
    dispatch(action);
  }, [dispatch]);

  // Memoized context values to prevent unnecessary re-renders
  const stateValue = useMemo(() => state, [state]);
  const dispatchValue = useMemo(() => enhancedDispatch, [enhancedDispatch]);

  // Individual domain values for optimized subscriptions
  const walletValue = useMemo(() => state.wallet, [state.wallet]);
  const votingValue = useMemo(() => state.voting, [state.voting]);
  const clanValue = useMemo(() => state.clan, [state.clan]);
  const userValue = useMemo(() => state.user, [state.user]);
  const settingsValue = useMemo(() => state.settings, [state.settings]);
  const uiValue = useMemo(() => state.ui, [state.ui]);

  // Initialize daily voting reset
  useEffect(() => {
    const checkDailyReset = () => {
      const lastReset = state.voting.lastResetTime;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (!lastReset || new Date(lastReset) < today) {
        enhancedDispatch(createAction(ACTION_TYPES.VOTING_RESET_DAILY));
      }
    };

    checkDailyReset();
    const interval = setInterval(checkDailyReset, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [state.voting.lastResetTime, enhancedDispatch]);

  return (
    <StateContext.Provider value={stateValue}>
      <DispatchContext.Provider value={dispatchValue}>
        <WalletContext.Provider value={walletValue}>
          <VotingContext.Provider value={votingValue}>
            <ClanContext.Provider value={clanValue}>
              <UserContext.Provider value={userValue}>
                <SettingsContext.Provider value={settingsValue}>
                  <UIContext.Provider value={uiValue}>
                    {children}
                  </UIContext.Provider>
                </SettingsContext.Provider>
              </UserContext.Provider>
            </ClanContext.Provider>
          </VotingContext.Provider>
        </WalletContext.Provider>
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

// =============================================================================
// CUSTOM HOOKS
// =============================================================================

/**
 * Hook to access full application state
 * @returns {Object} - Complete application state
 */
export function useMLGState() {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error('useMLGState must be used within MLGStateProvider');
  }
  return context;
}

/**
 * Hook to access dispatch function
 * @returns {Function} - Enhanced dispatch function
 */
export function useMLGDispatch() {
  const context = useContext(DispatchContext);
  if (!context) {
    throw new Error('useMLGDispatch must be used within MLGStateProvider');
  }
  return context;
}

/**
 * Hook to access both state and dispatch
 * @returns {Array} - [state, dispatch]
 */
export function useMLGStateAndDispatch() {
  return [useMLGState(), useMLGDispatch()];
}

// =============================================================================
// DOMAIN-SPECIFIC HOOKS
// =============================================================================

/**
 * Hook for wallet state and actions
 * @returns {Object} - Wallet state and action creators
 */
export function useWallet() {
  const wallet = useContext(WalletContext);
  const dispatch = useMLGDispatch();

  if (!wallet) {
    throw new Error('useWallet must be used within MLGStateProvider');
  }

  const actions = useMemo(() => ({
    connect: async (walletAdapter) => {
      dispatch(createAction(ACTION_TYPES.WALLET_CONNECT_START));
      try {
        const result = await walletAdapter.connect();
        dispatch(createAction(ACTION_TYPES.WALLET_CONNECT_SUCCESS, result));
        return result;
      } catch (error) {
        dispatch(createAction(ACTION_TYPES.WALLET_CONNECT_ERROR, { error: error.message }));
        throw error;
      }
    },
    disconnect: () => {
      dispatch(createAction(ACTION_TYPES.WALLET_DISCONNECT));
    },
    updateBalance: (balance) => {
      dispatch(createAction(ACTION_TYPES.WALLET_UPDATE_BALANCE, { balance }));
    },
    updateMLGBalance: (mlgBalance, tokenAccounts = {}) => {
      dispatch(createAction(ACTION_TYPES.WALLET_UPDATE_MLG_BALANCE, { mlgBalance, tokenAccounts }));
    },
    addTransaction: (transaction) => {
      dispatch(createAction(ACTION_TYPES.WALLET_ADD_TRANSACTION, { transaction }));
    }
  }), [dispatch]);

  return { ...wallet, actions };
}

/**
 * Hook for voting state and actions
 * @returns {Object} - Voting state and action creators
 */
export function useVoting() {
  const voting = useContext(VotingContext);
  const dispatch = useMLGDispatch();

  if (!voting) {
    throw new Error('useVoting must be used within MLGStateProvider');
  }

  const actions = useMemo(() => ({
    useFreeVote: () => {
      dispatch(createAction(ACTION_TYPES.VOTING_USE_FREE_VOTE));
    },
    useBurnVote: (amount) => {
      dispatch(createAction(ACTION_TYPES.VOTING_USE_BURN_VOTE, { amount }));
    },
    startVote: (voteId, type) => {
      dispatch(createAction(ACTION_TYPES.VOTING_START, { voteId, type }));
    },
    voteSuccess: (voteId, type, result) => {
      dispatch(createAction(ACTION_TYPES.VOTING_SUCCESS, { voteId, type, result }));
    },
    voteError: (voteId, error) => {
      dispatch(createAction(ACTION_TYPES.VOTING_ERROR, { voteId, error }));
    },
    resetDaily: () => {
      dispatch(createAction(ACTION_TYPES.VOTING_RESET_DAILY));
    }
  }), [dispatch]);

  return { ...voting, actions };
}

/**
 * Hook for clan state and actions
 * @returns {Object} - Clan state and action creators
 */
export function useClan() {
  const clan = useContext(ClanContext);
  const dispatch = useMLGDispatch();

  if (!clan) {
    throw new Error('useClan must be used within MLGStateProvider');
  }

  const actions = useMemo(() => ({
    loadClan: async (clanLoader) => {
      dispatch(createAction(ACTION_TYPES.CLAN_LOAD_START));
      try {
        const result = await clanLoader();
        dispatch(createAction(ACTION_TYPES.CLAN_LOAD_SUCCESS, result));
        return result;
      } catch (error) {
        dispatch(createAction(ACTION_TYPES.CLAN_LOAD_ERROR, { error: error.message }));
        throw error;
      }
    },
    joinClan: (clan, members) => {
      dispatch(createAction(ACTION_TYPES.CLAN_JOIN, { clan, members }));
    },
    leaveClan: () => {
      dispatch(createAction(ACTION_TYPES.CLAN_LEAVE));
    },
    updateMembers: (members) => {
      dispatch(createAction(ACTION_TYPES.CLAN_UPDATE_MEMBERS, { members }));
    },
    updateStats: (stats, leaderboard) => {
      dispatch(createAction(ACTION_TYPES.CLAN_UPDATE_STATS, { stats, leaderboard }));
    },
    addInvitation: (invitation) => {
      dispatch(createAction(ACTION_TYPES.CLAN_ADD_INVITATION, { invitation }));
    },
    removeInvitation: (invitationId) => {
      dispatch(createAction(ACTION_TYPES.CLAN_REMOVE_INVITATION, { invitationId }));
    }
  }), [dispatch]);

  return { ...clan, actions };
}

/**
 * Hook for user state and actions
 * @returns {Object} - User state and action creators
 */
export function useUser() {
  const user = useContext(UserContext);
  const dispatch = useMLGDispatch();

  if (!user) {
    throw new Error('useUser must be used within MLGStateProvider');
  }

  const actions = useMemo(() => ({
    loadUser: async (userLoader) => {
      dispatch(createAction(ACTION_TYPES.USER_LOAD_START));
      try {
        const result = await userLoader();
        dispatch(createAction(ACTION_TYPES.USER_LOAD_SUCCESS, result));
        return result;
      } catch (error) {
        dispatch(createAction(ACTION_TYPES.USER_LOAD_ERROR, { error: error.message }));
        throw error;
      }
    },
    updateProfile: (profile) => {
      dispatch(createAction(ACTION_TYPES.USER_UPDATE_PROFILE, { profile }));
    },
    updatePreferences: (preferences) => {
      dispatch(createAction(ACTION_TYPES.USER_UPDATE_PREFERENCES, { preferences }));
    },
    addAchievement: (achievement) => {
      dispatch(createAction(ACTION_TYPES.USER_ADD_ACHIEVEMENT, { achievement }));
    },
    addNotification: (notification) => {
      dispatch(createAction(ACTION_TYPES.USER_ADD_NOTIFICATION, { notification }));
    },
    removeNotification: (notificationId) => {
      dispatch(createAction(ACTION_TYPES.USER_REMOVE_NOTIFICATION, { notificationId }));
    }
  }), [dispatch]);

  return { ...user, actions };
}

/**
 * Hook for settings state and actions
 * @returns {Object} - Settings state and action creators
 */
export function useSettings() {
  const settings = useContext(SettingsContext);
  const dispatch = useMLGDispatch();

  if (!settings) {
    throw new Error('useSettings must be used within MLGStateProvider');
  }

  const actions = useMemo(() => ({
    updateTheme: (theme) => {
      dispatch(createAction(ACTION_TYPES.SETTINGS_UPDATE_THEME, { theme }));
    },
    updateLanguage: (language) => {
      dispatch(createAction(ACTION_TYPES.SETTINGS_UPDATE_LANGUAGE, { language }));
    },
    updateNotifications: (notifications) => {
      dispatch(createAction(ACTION_TYPES.SETTINGS_UPDATE_NOTIFICATIONS, { notifications }));
    },
    updatePrivacy: (privacy) => {
      dispatch(createAction(ACTION_TYPES.SETTINGS_UPDATE_PRIVACY, { privacy }));
    },
    updatePerformance: (performance) => {
      dispatch(createAction(ACTION_TYPES.SETTINGS_UPDATE_PERFORMANCE, { performance }));
    },
    reset: () => {
      dispatch(createAction(ACTION_TYPES.SETTINGS_RESET));
    }
  }), [dispatch]);

  return { ...settings, actions };
}

/**
 * Hook for UI state and actions
 * @returns {Object} - UI state and action creators
 */
export function useUI() {
  const ui = useContext(UIContext);
  const dispatch = useMLGDispatch();

  if (!ui) {
    throw new Error('useUI must be used within MLGStateProvider');
  }

  const actions = useMemo(() => ({
    showModal: (modalName) => {
      dispatch(createAction(ACTION_TYPES.UI_SHOW_MODAL, { modalName }));
    },
    hideModal: (modalName) => {
      dispatch(createAction(ACTION_TYPES.UI_HIDE_MODAL, { modalName }));
    },
    setLoading: (key, isLoading) => {
      dispatch(createAction(ACTION_TYPES.UI_SET_LOADING, { key, isLoading }));
    },
    addAlert: (alert) => {
      dispatch(createAction(ACTION_TYPES.UI_ADD_ALERT, { alert }));
    },
    removeAlert: (alertId) => {
      dispatch(createAction(ACTION_TYPES.UI_REMOVE_ALERT, { alertId }));
    },
    toggleSidebar: () => {
      dispatch(createAction(ACTION_TYPES.UI_TOGGLE_SIDEBAR));
    },
    setCurrentPage: (page) => {
      dispatch(createAction(ACTION_TYPES.UI_SET_CURRENT_PAGE, { page }));
    }
  }), [dispatch]);

  return { ...ui, actions };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Merge multiple state objects with deep merging
 * @param {...Object} states - State objects to merge
 * @returns {Object} - Merged state object
 */
function mergeStates(...states) {
  return states.reduce((merged, state) => {
    if (!state || typeof state !== 'object') return merged;
    
    Object.keys(state).forEach(key => {
      if (state[key] && typeof state[key] === 'object' && !Array.isArray(state[key])) {
        merged[key] = { ...merged[key], ...state[key] };
      } else if (state[key] !== undefined) {
        merged[key] = state[key];
      }
    });
    
    return merged;
  }, {});
}

/**
 * Higher-order component for injecting state into class components
 * @param {React.Component} Component - Component to wrap
 * @returns {React.Component} - Wrapped component with state props
 */
export function withMLGState(Component) {
  return function MLGStateInjectedComponent(props) {
    const state = useMLGState();
    const dispatch = useMLGDispatch();
    
    return (
      <Component 
        {...props} 
        mlgState={state} 
        mlgDispatch={dispatch}
      />
    );
  };
}

export default {
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
};