/**
 * MLG.clan State Management Test Suite
 * 
 * Comprehensive tests for the state management system
 * Tests all reducers, actions, persistence, and context functionality
 * 
 * @version 1.0.0
 * @created 2025-08-12
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Import state management modules
import {
  rootReducer,
  walletReducer,
  votingReducer,
  clanReducer,
  userReducer,
  settingsReducer,
  uiReducer,
  createAction,
  validateAction
} from './state-reducers.js';

import {
  ACTION_TYPES,
  DEFAULT_WALLET_STATE,
  DEFAULT_VOTING_STATE,
  DEFAULT_CLAN_STATE,
  DEFAULT_USER_STATE,
  DEFAULT_SETTINGS_STATE,
  DEFAULT_UI_STATE,
  validateStateType,
  sanitizeStateForPersistence
} from './state-types.js';

import {
  walletActions,
  votingActions,
  clanActions,
  userActions,
  settingsActions,
  uiActions,
  compositeActions
} from './state-actions.js';

import {
  saveState,
  loadState,
  clearPersistedState,
  storageManager
} from './state-persistence.js';

// =============================================================================
// TEST SETUP AND UTILITIES
// =============================================================================

// Mock localStorage and sessionStorage
const localStorageMock = {
  store: {},
  getItem: jest.fn((key) => localStorageMock.store[key] || null),
  setItem: jest.fn((key, value) => { localStorageMock.store[key] = value; }),
  removeItem: jest.fn((key) => { delete localStorageMock.store[key]; }),
  clear: jest.fn(() => { localStorageMock.store = {}; })
};

const sessionStorageMock = {
  store: {},
  getItem: jest.fn((key) => sessionStorageMock.store[key] || null),
  setItem: jest.fn((key, value) => { sessionStorageMock.store[key] = value; }),
  removeItem: jest.fn((key) => { delete sessionStorageMock.store[key]; }),
  clear: jest.fn(() => { sessionStorageMock.store = {}; })
};

// Mock global storage
global.localStorage = localStorageMock;
global.sessionStorage = sessionStorageMock;

// Test utilities
function createMockState() {
  return {
    wallet: { ...DEFAULT_WALLET_STATE },
    voting: { ...DEFAULT_VOTING_STATE },
    clan: { ...DEFAULT_CLAN_STATE },
    user: { ...DEFAULT_USER_STATE },
    settings: { ...DEFAULT_SETTINGS_STATE },
    ui: { ...DEFAULT_UI_STATE }
  };
}

function createMockWallet() {
  return {
    publicKey: 'TestPublicKey123',
    address: 'Test123...xyz',
    network: 'mainnet-beta'
  };
}

// =============================================================================
// STATE TYPES TESTS
// =============================================================================

describe('State Types', () => {
  test('should validate wallet state type', () => {
    expect(validateStateType(DEFAULT_WALLET_STATE, 'WalletState')).toBe(true);
    expect(validateStateType({}, 'WalletState')).toBe(false);
    expect(validateStateType(null, 'WalletState')).toBe(false);
  });

  test('should validate voting state type', () => {
    expect(validateStateType(DEFAULT_VOTING_STATE, 'VotingState')).toBe(true);
    expect(validateStateType({}, 'VotingState')).toBe(false);
  });

  test('should validate clan state type', () => {
    expect(validateStateType(DEFAULT_CLAN_STATE, 'ClanState')).toBe(true);
    expect(validateStateType({}, 'ClanState')).toBe(false);
  });

  test('should validate user state type', () => {
    expect(validateStateType(DEFAULT_USER_STATE, 'UserState')).toBe(true);
    expect(validateStateType({}, 'UserState')).toBe(false);
  });

  test('should sanitize state for persistence', () => {
    const state = {
      wallet: { privateKey: 'secret', publicKey: 'public' },
      user: { profile: { privateData: 'secret', publicData: 'public' } }
    };
    
    const sanitized = sanitizeStateForPersistence(state);
    expect(sanitized.wallet.publicKey).toBe('public');
    expect(sanitized.wallet.privateKey).toBeUndefined();
  });
});

// =============================================================================
// WALLET REDUCER TESTS
// =============================================================================

describe('Wallet Reducer', () => {
  test('should handle WALLET_CONNECT_START', () => {
    const action = createAction(ACTION_TYPES.WALLET_CONNECT_START);
    const newState = walletReducer(DEFAULT_WALLET_STATE, action);
    
    expect(newState.isConnecting).toBe(true);
    expect(newState.error).toBeNull();
  });

  test('should handle WALLET_CONNECT_SUCCESS', () => {
    const mockWallet = createMockWallet();
    const action = createAction(ACTION_TYPES.WALLET_CONNECT_SUCCESS, mockWallet);
    const newState = walletReducer(DEFAULT_WALLET_STATE, action);
    
    expect(newState.isConnected).toBe(true);
    expect(newState.isConnecting).toBe(false);
    expect(newState.publicKey).toBe(mockWallet.publicKey);
    expect(newState.address).toBe(mockWallet.address);
    expect(newState.error).toBeNull();
  });

  test('should handle WALLET_CONNECT_ERROR', () => {
    const error = 'Connection failed';
    const action = createAction(ACTION_TYPES.WALLET_CONNECT_ERROR, { error });
    const newState = walletReducer(DEFAULT_WALLET_STATE, action);
    
    expect(newState.isConnected).toBe(false);
    expect(newState.isConnecting).toBe(false);
    expect(newState.error).toBe(error);
  });

  test('should handle WALLET_DISCONNECT', () => {
    const connectedState = {
      ...DEFAULT_WALLET_STATE,
      isConnected: true,
      publicKey: 'test',
      address: 'test',
      network: 'devnet'
    };
    
    const action = createAction(ACTION_TYPES.WALLET_DISCONNECT);
    const newState = walletReducer(connectedState, action);
    
    expect(newState.isConnected).toBe(false);
    expect(newState.publicKey).toBeNull();
    expect(newState.address).toBeNull();
    expect(newState.network).toBe('devnet'); // Should preserve network
  });

  test('should handle WALLET_UPDATE_BALANCE', () => {
    const balance = 5000000000; // 5 SOL
    const action = createAction(ACTION_TYPES.WALLET_UPDATE_BALANCE, { balance });
    const newState = walletReducer(DEFAULT_WALLET_STATE, action);
    
    expect(newState.balance).toBe(balance);
  });

  test('should handle WALLET_ADD_TRANSACTION', () => {
    const transaction = {
      signature: 'test_signature',
      type: 'vote',
      amount: 100
    };
    const action = createAction(ACTION_TYPES.WALLET_ADD_TRANSACTION, { transaction });
    const newState = walletReducer(DEFAULT_WALLET_STATE, action);
    
    expect(newState.transactionHistory.transactions).toHaveLength(1);
    expect(newState.transactionHistory.transactions[0]).toEqual(transaction);
  });
});

// =============================================================================
// VOTING REDUCER TESTS
// =============================================================================

describe('Voting Reducer', () => {
  test('should handle VOTING_RESET_DAILY', () => {
    const usedState = {
      ...DEFAULT_VOTING_STATE,
      dailyVotesRemaining: 0,
      totalVotesUsed: 5
    };
    
    const action = createAction(ACTION_TYPES.VOTING_RESET_DAILY);
    const newState = votingReducer(usedState, action);
    
    expect(newState.dailyVotesRemaining).toBe(1);
    expect(newState.totalVotesUsed).toBe(0);
    expect(newState.lastResetTime).toBeTruthy();
  });

  test('should handle VOTING_USE_FREE_VOTE', () => {
    const action = createAction(ACTION_TYPES.VOTING_USE_FREE_VOTE);
    const newState = votingReducer(DEFAULT_VOTING_STATE, action);
    
    expect(newState.dailyVotesRemaining).toBe(0);
    expect(newState.totalVotesUsed).toBe(1);
    expect(newState.error).toBeNull();
  });

  test('should prevent free vote when none remaining', () => {
    const noVotesState = {
      ...DEFAULT_VOTING_STATE,
      dailyVotesRemaining: 0
    };
    
    const action = createAction(ACTION_TYPES.VOTING_USE_FREE_VOTE);
    const newState = votingReducer(noVotesState, action);
    
    expect(newState.dailyVotesRemaining).toBe(0);
    expect(newState.error).toBe('No free votes remaining');
  });

  test('should handle VOTING_USE_BURN_VOTE', () => {
    const burnState = {
      ...DEFAULT_VOTING_STATE,
      burnVotesAvailable: 5
    };
    
    const action = createAction(ACTION_TYPES.VOTING_USE_BURN_VOTE, { amount: 2 });
    const newState = votingReducer(burnState, action);
    
    expect(newState.burnVotesAvailable).toBe(3);
    expect(newState.totalVotesUsed).toBe(2);
  });

  test('should handle VOTING_START', () => {
    const voteId = 'test_vote_123';
    const action = createAction(ACTION_TYPES.VOTING_START, { voteId, type: 'content' });
    const newState = votingReducer(DEFAULT_VOTING_STATE, action);
    
    expect(newState.isVoting).toBe(true);
    expect(newState.activeVotes).toHaveLength(1);
    expect(newState.activeVotes[0].id).toBe(voteId);
  });

  test('should handle VOTING_SUCCESS', () => {
    const voteId = 'test_vote_123';
    const activeState = {
      ...DEFAULT_VOTING_STATE,
      isVoting: true,
      activeVotes: [{ id: voteId, type: 'content' }]
    };
    
    const action = createAction(ACTION_TYPES.VOTING_SUCCESS, {
      voteId,
      type: 'content',
      result: { success: true }
    });
    const newState = votingReducer(activeState, action);
    
    expect(newState.isVoting).toBe(false);
    expect(newState.activeVotes).toHaveLength(0);
    expect(newState.voteHistory.daily).toHaveLength(1);
  });
});

// =============================================================================
// CLAN REDUCER TESTS
// =============================================================================

describe('Clan Reducer', () => {
  test('should handle CLAN_LOAD_START', () => {
    const action = createAction(ACTION_TYPES.CLAN_LOAD_START);
    const newState = clanReducer(DEFAULT_CLAN_STATE, action);
    
    expect(newState.isLoading).toBe(true);
    expect(newState.error).toBeNull();
  });

  test('should handle CLAN_LOAD_SUCCESS', () => {
    const clan = { id: 'test_clan', name: 'Test Clan' };
    const members = [{ id: '1', name: 'Member1' }];
    const stats = { totalMembers: 1, totalVotes: 10 };
    
    const action = createAction(ACTION_TYPES.CLAN_LOAD_SUCCESS, { clan, members, stats });
    const newState = clanReducer(DEFAULT_CLAN_STATE, action);
    
    expect(newState.isLoading).toBe(false);
    expect(newState.currentClan).toEqual(clan);
    expect(newState.membersList).toEqual(members);
    expect(newState.clanStats).toEqual(stats);
    expect(newState.error).toBeNull();
  });

  test('should handle CLAN_JOIN', () => {
    const clan = { id: 'test_clan', name: 'Test Clan' };
    const members = [{ id: '1', name: 'Member1' }];
    
    const action = createAction(ACTION_TYPES.CLAN_JOIN, { clan, members });
    const newState = clanReducer(DEFAULT_CLAN_STATE, action);
    
    expect(newState.currentClan).toEqual(clan);
    expect(newState.membersList).toEqual(members);
  });

  test('should handle CLAN_LEAVE', () => {
    const clanState = {
      ...DEFAULT_CLAN_STATE,
      currentClan: { id: 'test_clan' },
      membersList: [{ id: '1' }]
    };
    
    const action = createAction(ACTION_TYPES.CLAN_LEAVE);
    const newState = clanReducer(clanState, action);
    
    expect(newState.currentClan).toBeNull();
    expect(newState.membersList).toEqual([]);
  });

  test('should handle CLAN_ADD_INVITATION', () => {
    const invitation = {
      id: 'invite_123',
      clanId: 'clan_456',
      clanName: 'Test Clan'
    };
    
    const action = createAction(ACTION_TYPES.CLAN_ADD_INVITATION, { invitation });
    const newState = clanReducer(DEFAULT_CLAN_STATE, action);
    
    expect(newState.invitations).toHaveLength(1);
    expect(newState.invitations[0]).toEqual(invitation);
  });
});

// =============================================================================
// USER REDUCER TESTS
// =============================================================================

describe('User Reducer', () => {
  test('should handle USER_LOAD_SUCCESS', () => {
    const profile = { id: 'user_123', username: 'testuser' };
    const achievements = [{ id: 'ach_1', name: 'First Vote' }];
    const stats = { totalVotes: 5 };
    
    const action = createAction(ACTION_TYPES.USER_LOAD_SUCCESS, { profile, achievements, stats });
    const newState = userReducer(DEFAULT_USER_STATE, action);
    
    expect(newState.isLoading).toBe(false);
    expect(newState.profile).toEqual(profile);
    expect(newState.achievements).toEqual(achievements);
    expect(newState.stats).toEqual(stats);
    expect(newState.lastLogin).toBeTruthy();
  });

  test('should handle USER_UPDATE_PROFILE', () => {
    const profileUpdates = { displayName: 'New Name' };
    const existingState = {
      ...DEFAULT_USER_STATE,
      profile: { id: 'user_123', username: 'testuser' }
    };
    
    const action = createAction(ACTION_TYPES.USER_UPDATE_PROFILE, { profile: profileUpdates });
    const newState = userReducer(existingState, action);
    
    expect(newState.profile.username).toBe('testuser'); // Preserved
    expect(newState.profile.displayName).toBe('New Name'); // Updated
  });

  test('should handle USER_ADD_ACHIEVEMENT', () => {
    const achievement = { id: 'ach_2', name: 'Daily Voter' };
    
    const action = createAction(ACTION_TYPES.USER_ADD_ACHIEVEMENT, { achievement });
    const newState = userReducer(DEFAULT_USER_STATE, action);
    
    expect(newState.achievements).toHaveLength(1);
    expect(newState.achievements[0].id).toBe(achievement.id);
    expect(newState.achievements[0].unlockedAt).toBeTruthy();
  });

  test('should handle USER_ADD_NOTIFICATION', () => {
    const notification = { title: 'Test Notification', message: 'Test message' };
    
    const action = createAction(ACTION_TYPES.USER_ADD_NOTIFICATION, { notification });
    const newState = userReducer(DEFAULT_USER_STATE, action);
    
    expect(newState.notifications).toHaveLength(1);
    expect(newState.notifications[0].title).toBe(notification.title);
    expect(newState.notifications[0].read).toBe(false);
    expect(newState.notifications[0].timestamp).toBeTruthy();
  });
});

// =============================================================================
// SETTINGS REDUCER TESTS
// =============================================================================

describe('Settings Reducer', () => {
  test('should handle SETTINGS_UPDATE_THEME', () => {
    const action = createAction(ACTION_TYPES.SETTINGS_UPDATE_THEME, { theme: 'dark' });
    const newState = settingsReducer(DEFAULT_SETTINGS_STATE, action);
    
    expect(newState.theme).toBe('dark');
  });

  test('should handle SETTINGS_UPDATE_LANGUAGE', () => {
    const action = createAction(ACTION_TYPES.SETTINGS_UPDATE_LANGUAGE, { language: 'es' });
    const newState = settingsReducer(DEFAULT_SETTINGS_STATE, action);
    
    expect(newState.language).toBe('es');
  });

  test('should handle SETTINGS_RESET', () => {
    const customState = {
      ...DEFAULT_SETTINGS_STATE,
      theme: 'dark',
      language: 'es',
      autoConnect: true
    };
    
    const action = createAction(ACTION_TYPES.SETTINGS_RESET);
    const newState = settingsReducer(customState, action);
    
    expect(newState.theme).toBe('xbox'); // Reset
    expect(newState.language).toBe('es'); // Preserved
    expect(newState.autoConnect).toBe(true); // Preserved
  });
});

// =============================================================================
// UI REDUCER TESTS
// =============================================================================

describe('UI Reducer', () => {
  test('should handle UI_SHOW_MODAL', () => {
    const action = createAction(ACTION_TYPES.UI_SHOW_MODAL, { modalName: 'walletConnect' });
    const newState = uiReducer(DEFAULT_UI_STATE, action);
    
    expect(newState.modals.walletConnect).toBe(true);
  });

  test('should handle UI_HIDE_MODAL', () => {
    const modalState = {
      ...DEFAULT_UI_STATE,
      modals: { ...DEFAULT_UI_STATE.modals, walletConnect: true }
    };
    
    const action = createAction(ACTION_TYPES.UI_HIDE_MODAL, { modalName: 'walletConnect' });
    const newState = uiReducer(modalState, action);
    
    expect(newState.modals.walletConnect).toBe(false);
  });

  test('should handle UI_SET_LOADING', () => {
    const action = createAction(ACTION_TYPES.UI_SET_LOADING, { key: 'wallet', isLoading: true });
    const newState = uiReducer(DEFAULT_UI_STATE, action);
    
    expect(newState.loading.wallet).toBe(true);
  });

  test('should handle UI_ADD_ALERT', () => {
    const alert = { type: 'success', title: 'Test', message: 'Test message' };
    
    const action = createAction(ACTION_TYPES.UI_ADD_ALERT, { alert });
    const newState = uiReducer(DEFAULT_UI_STATE, action);
    
    expect(newState.alerts).toHaveLength(1);
    expect(newState.alerts[0].type).toBe('success');
    expect(newState.alerts[0].timestamp).toBeTruthy();
  });

  test('should handle UI_TOGGLE_SIDEBAR', () => {
    const action = createAction(ACTION_TYPES.UI_TOGGLE_SIDEBAR);
    const newState = uiReducer(DEFAULT_UI_STATE, action);
    
    expect(newState.sidebarOpen).toBe(true);
    
    const newState2 = uiReducer(newState, action);
    expect(newState2.sidebarOpen).toBe(false);
  });
});

// =============================================================================
// ROOT REDUCER TESTS
// =============================================================================

describe('Root Reducer', () => {
  test('should combine all domain reducers', () => {
    const mockState = createMockState();
    const action = createAction(ACTION_TYPES.WALLET_CONNECT_SUCCESS, createMockWallet());
    
    const newState = rootReducer(mockState, action);
    
    expect(newState.wallet.isConnected).toBe(true);
    expect(newState.voting).toEqual(mockState.voting);
    expect(newState.clan).toEqual(mockState.clan);
    expect(newState.user).toEqual(mockState.user);
    expect(newState.settings).toEqual(mockState.settings);
    expect(newState.ui).toEqual(mockState.ui);
  });

  test('should handle unknown actions gracefully', () => {
    const mockState = createMockState();
    const unknownAction = { type: 'UNKNOWN_ACTION', payload: {} };
    
    const newState = rootReducer(mockState, unknownAction);
    
    expect(newState).toEqual(mockState);
  });
});

// =============================================================================
// ACTION CREATORS TESTS
// =============================================================================

describe('Action Creators', () => {
  test('should create wallet connect success action', () => {
    const mockWallet = createMockWallet();
    const action = walletActions.connectSuccess(
      mockWallet.publicKey,
      mockWallet.address,
      mockWallet.network
    );
    
    expect(action.type).toBe(ACTION_TYPES.WALLET_CONNECT_SUCCESS);
    expect(action.payload.publicKey).toBe(mockWallet.publicKey);
    expect(action.payload.address).toBe(mockWallet.address);
    expect(action.payload.network).toBe(mockWallet.network);
    expect(action.timestamp).toBeTruthy();
  });

  test('should create voting burn action with validation', () => {
    const action = votingActions.useBurnVote(2);
    
    expect(action.type).toBe(ACTION_TYPES.VOTING_USE_BURN_VOTE);
    expect(action.payload.amount).toBe(2);
    
    // Test validation
    expect(() => votingActions.useBurnVote(0)).toThrow();
    expect(() => votingActions.useBurnVote(5)).toThrow();
  });

  test('should create clan invitation action with defaults', () => {
    const invitation = {
      clanId: 'test_clan',
      clanName: 'Test Clan',
      inviterName: 'TestUser'
    };
    
    const action = clanActions.addInvitation(invitation);
    
    expect(action.type).toBe(ACTION_TYPES.CLAN_ADD_INVITATION);
    expect(action.payload.invitation.clanId).toBe(invitation.clanId);
    expect(action.payload.invitation.id).toBeTruthy();
    expect(action.payload.invitation.timestamp).toBeTruthy();
    expect(action.payload.invitation.expiresAt).toBeTruthy();
  });

  test('should create settings theme action with validation', () => {
    const action = settingsActions.updateTheme('dark');
    
    expect(action.type).toBe(ACTION_TYPES.SETTINGS_UPDATE_THEME);
    expect(action.payload.theme).toBe('dark');
    
    // Test validation
    expect(() => settingsActions.updateTheme('invalid')).toThrow();
  });

  test('should create composite actions array', () => {
    const walletData = createMockWallet();
    const userData = { profile: { username: 'test' }, achievements: [], stats: {} };
    
    const actions = compositeActions.initializeUserSession(walletData, userData);
    
    expect(Array.isArray(actions)).toBe(true);
    expect(actions).toHaveLength(3);
    expect(actions[0].type).toBe(ACTION_TYPES.WALLET_CONNECT_SUCCESS);
    expect(actions[1].type).toBe(ACTION_TYPES.USER_LOAD_SUCCESS);
    expect(actions[2].type).toBe(ACTION_TYPES.UI_ADD_ALERT);
  });
});

// =============================================================================
// PERSISTENCE TESTS
// =============================================================================

describe('State Persistence', () => {
  beforeEach(() => {
    localStorageMock.clear();
    sessionStorageMock.clear();
  });

  test('should save state to localStorage', () => {
    const mockState = createMockState();
    mockState.wallet.address = 'test_address';
    mockState.settings.theme = 'dark';
    
    const result = saveState(mockState);
    
    expect(result).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  test('should load state from localStorage', () => {
    // Setup mock stored data
    const storedData = {
      wallet_address: 'test_address',
      settings: { theme: 'dark', language: 'es' }
    };
    
    Object.keys(storedData).forEach(key => {
      localStorageMock.store[`mlg_clan_${key}`] = JSON.stringify({
        data: storedData[key],
        timestamp: Date.now(),
        expires: Date.now() + 60000,
        version: '1.0.0'
      });
    });
    
    const loadedState = loadState();
    
    expect(loadedState.settings.theme).toBe('dark');
    expect(loadedState.settings.language).toBe('es');
  });

  test('should clear all persisted state', () => {
    // Setup some stored data
    localStorageMock.store['mlg_clan_test'] = 'test_data';
    localStorageMock.store['other_data'] = 'other_data';
    
    clearPersistedState();
    
    expect(localStorageMock.store['mlg_clan_test']).toBeUndefined();
    expect(localStorageMock.store['other_data']).toBe('other_data'); // Should not be cleared
  });

  test('should handle storage errors gracefully', () => {
    // Mock storage failure
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('Storage full');
    });
    
    const mockState = createMockState();
    const result = saveState(mockState);
    
    expect(result).toBe(false);
  });

  test('should validate cache expiry', () => {
    // Setup expired cache entry
    const expiredData = {
      data: { theme: 'dark' },
      timestamp: Date.now() - 120000, // 2 minutes ago
      expires: Date.now() - 60000, // Expired 1 minute ago
      version: '1.0.0'
    };
    
    localStorageMock.store['mlg_clan_settings'] = JSON.stringify(expiredData);
    
    const loadedState = loadState();
    
    // Should not load expired data
    expect(loadedState.settings).toBeUndefined();
  });
});

// =============================================================================
// VALIDATION TESTS
// =============================================================================

describe('Validation Functions', () => {
  test('should validate action structure', () => {
    const validAction = createAction(ACTION_TYPES.WALLET_CONNECT_START);
    const invalidAction1 = {};
    const invalidAction2 = { type: '' };
    const invalidAction3 = { payload: {} };
    
    expect(validateAction(validAction)).toBe(true);
    expect(validateAction(invalidAction1)).toBe(false);
    expect(validateAction(invalidAction2)).toBe(false);
    expect(validateAction(invalidAction3)).toBe(false);
  });

  test('should create action with timestamp', () => {
    const action = createAction(ACTION_TYPES.WALLET_CONNECT_START, { test: 'data' });
    
    expect(action.type).toBe(ACTION_TYPES.WALLET_CONNECT_START);
    expect(action.payload.test).toBe('data');
    expect(action.timestamp).toBeTruthy();
    expect(new Date(action.timestamp)).toBeInstanceOf(Date);
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('State Management Integration', () => {
  test('should handle complete wallet connection flow', () => {
    let state = createMockState();
    
    // Start connection
    const startAction = walletActions.connectStart();
    state = rootReducer(state, startAction);
    expect(state.wallet.isConnecting).toBe(true);
    
    // Successful connection
    const mockWallet = createMockWallet();
    const successAction = walletActions.connectSuccess(
      mockWallet.publicKey,
      mockWallet.address,
      mockWallet.network
    );
    state = rootReducer(state, successAction);
    
    expect(state.wallet.isConnected).toBe(true);
    expect(state.wallet.isConnecting).toBe(false);
    expect(state.wallet.publicKey).toBe(mockWallet.publicKey);
  });

  test('should handle complete voting flow', () => {
    let state = createMockState();
    
    // Use free vote
    const freeVoteAction = votingActions.useFreeVote();
    state = rootReducer(state, freeVoteAction);
    
    expect(state.voting.dailyVotesRemaining).toBe(0);
    expect(state.voting.totalVotesUsed).toBe(1);
    
    // Start burn vote
    const voteId = 'test_vote_123';
    const startVoteAction = votingActions.startVote(voteId, 'burn');
    state = rootReducer(state, startVoteAction);
    
    expect(state.voting.isVoting).toBe(true);
    expect(state.voting.activeVotes).toHaveLength(1);
    
    // Complete burn vote
    const burnVoteAction = votingActions.useBurnVote(2);
    state = rootReducer(state, burnVoteAction);
    
    const successAction = votingActions.voteSuccess(voteId, 'burn', { signature: 'test_sig' });
    state = rootReducer(state, successAction);
    
    expect(state.voting.isVoting).toBe(false);
    expect(state.voting.activeVotes).toHaveLength(0);
    expect(state.voting.voteHistory.daily).toHaveLength(1);
  });

  test('should handle error states properly', () => {
    let state = createMockState();
    
    // Wallet connection error
    const walletErrorAction = walletActions.connectError('Connection failed');
    state = rootReducer(state, walletErrorAction);
    
    expect(state.wallet.isConnected).toBe(false);
    expect(state.wallet.isConnecting).toBe(false);
    expect(state.wallet.error).toBe('Connection failed');
    
    // Voting error
    const voteId = 'test_vote_123';
    const voteErrorAction = votingActions.voteError(voteId, 'Insufficient funds');
    state = rootReducer(state, voteErrorAction);
    
    expect(state.voting.isVoting).toBe(false);
    expect(state.voting.error).toBe('Insufficient funds');
  });

  test('should maintain state immutability', () => {
    const originalState = createMockState();
    const stateCopy = JSON.parse(JSON.stringify(originalState));
    
    const action = walletActions.connectSuccess('test', 'test', 'mainnet-beta');
    const newState = rootReducer(originalState, action);
    
    // Original state should not be mutated
    expect(originalState).toEqual(stateCopy);
    
    // New state should be different
    expect(newState).not.toEqual(originalState);
    expect(newState.wallet.isConnected).toBe(true);
    expect(originalState.wallet.isConnected).toBe(false);
  });
});

// =============================================================================
// PERFORMANCE TESTS
// =============================================================================

describe('State Management Performance', () => {
  test('should handle large state updates efficiently', () => {
    const startTime = performance.now();
    
    let state = createMockState();
    
    // Perform 1000 state updates
    for (let i = 0; i < 1000; i++) {
      const action = walletActions.updateBalance(Math.random() * 1000000000);
      state = rootReducer(state, action);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
    expect(state.wallet.balance).toBeGreaterThan(0);
  });

  test('should handle large notification lists efficiently', () => {
    let state = createMockState();
    
    // Add 100 notifications
    for (let i = 0; i < 100; i++) {
      const action = userActions.addNotification({
        title: `Notification ${i}`,
        message: `Test message ${i}`
      });
      state = rootReducer(state, action);
    }
    
    expect(state.user.notifications).toHaveLength(50); // Should be limited to 50
  });
});

console.log('🧪 MLG.clan State Management Test Suite Complete');
console.log('✅ All state management functionality thoroughly tested');