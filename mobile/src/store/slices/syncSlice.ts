/**
 * Sync Redux Slice for Cross-Platform Data Synchronization
 */

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {SyncService} from '@/services/SyncService';
import {SyncState, PendingAction, SyncConflict, ActionType} from '@/types';

interface SyncSliceState extends SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAttempt: string | null;
  syncProgress: number;
  error: string | null;
}

const initialState: SyncSliceState = {
  lastSync: '',
  isOnline: true,
  isSyncing: false,
  lastSyncAttempt: null,
  syncProgress: 0,
  pendingActions: [],
  conflicts: [],
  error: null,
};

// Async Thunks
export const performFullSync = createAsyncThunk(
  'sync/performFullSync',
  async (_, {getState, rejectWithValue}) => {
    try {
      const state = getState() as any;
      const syncData = await SyncService.performFullSync(state);
      return syncData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Full sync failed');
    }
  }
);

export const syncPendingActions = createAsyncThunk(
  'sync/syncPendingActions',
  async (_, {getState, rejectWithValue}) => {
    try {
      const state = getState() as {sync: SyncSliceState};
      const {pendingActions} = state.sync;
      
      const results = await SyncService.syncPendingActions(pendingActions);
      return results;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Pending actions sync failed');
    }
  }
);

export const resolveConflict = createAsyncThunk(
  'sync/resolveConflict',
  async ({
    conflictId,
    resolution,
    selectedData
  }: {
    conflictId: string;
    resolution: 'local' | 'server' | 'merge';
    selectedData?: any;
  }, {rejectWithValue}) => {
    try {
      const result = await SyncService.resolveConflict(conflictId, resolution, selectedData);
      return {conflictId, result};
    } catch (error: any) {
      return rejectWithValue(error.message || 'Conflict resolution failed');
    }
  }
);

export const addPendingAction = createAsyncThunk(
  'sync/addPendingAction',
  async ({type, data}: {type: ActionType; data: any}, {rejectWithValue}) => {
    try {
      const action = await SyncService.queueAction(type, data);
      return action;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to queue action');
    }
  }
);

export const incrementalSync = createAsyncThunk(
  'sync/incrementalSync',
  async ({timestamp}: {timestamp: string}, {rejectWithValue}) => {
    try {
      const syncData = await SyncService.incrementalSync(timestamp);
      return syncData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Incremental sync failed');
    }
  }
);

export const checkConnectivity = createAsyncThunk(
  'sync/checkConnectivity',
  async (_, {rejectWithValue}) => {
    try {
      const isOnline = await SyncService.checkConnectivity();
      return isOnline;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Connectivity check failed');
    }
  }
);

// Sync Slice
const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
      if (action.payload) {
        // Trigger sync when coming back online
        state.lastSyncAttempt = new Date().toISOString();
      }
    },
    updateSyncProgress: (state, action: PayloadAction<number>) => {
      state.syncProgress = Math.max(0, Math.min(100, action.payload));
    },
    clearError: (state) => {
      state.error = null;
    },
    addConflict: (state, action: PayloadAction<SyncConflict>) => {
      const existingIndex = state.conflicts.findIndex(c => c.id === action.payload.id);
      if (existingIndex === -1) {
        state.conflicts.push(action.payload);
      }
    },
    removeConflict: (state, action: PayloadAction<string>) => {
      state.conflicts = state.conflicts.filter(c => c.id !== action.payload);
    },
    retryPendingAction: (state, action: PayloadAction<string>) => {
      const actionIndex = state.pendingActions.findIndex(a => a.id === action.payload);
      if (actionIndex !== -1) {
        state.pendingActions[actionIndex].retries += 1;
        state.pendingActions[actionIndex].timestamp = new Date().toISOString();
      }
    },
    removePendingAction: (state, action: PayloadAction<string>) => {
      state.pendingActions = state.pendingActions.filter(a => a.id !== action.payload);
    },
    resetSync: (state) => {
      state.pendingActions = [];
      state.conflicts = [];
      state.isSyncing = false;
      state.syncProgress = 0;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Full sync
    builder
      .addCase(performFullSync.pending, (state) => {
        state.isSyncing = true;
        state.syncProgress = 0;
        state.error = null;
        state.lastSyncAttempt = new Date().toISOString();
      })
      .addCase(performFullSync.fulfilled, (state, action) => {
        state.isSyncing = false;
        state.syncProgress = 100;
        state.lastSync = new Date().toISOString();
        
        // Update state with synced data
        if (action.payload.conflicts) {
          state.conflicts = [...state.conflicts, ...action.payload.conflicts];
        }
        
        // Remove successfully synced pending actions
        if (action.payload.syncedActions) {
          state.pendingActions = state.pendingActions.filter(
            action => !action.payload.syncedActions.includes(action.id)
          );
        }
      })
      .addCase(performFullSync.rejected, (state, action) => {
        state.isSyncing = false;
        state.syncProgress = 0;
        state.error = action.payload as string;
      });

    // Sync pending actions
    builder
      .addCase(syncPendingActions.pending, (state) => {
        state.isSyncing = true;
        state.error = null;
      })
      .addCase(syncPendingActions.fulfilled, (state, action) => {
        state.isSyncing = false;
        
        // Remove successfully synced actions
        if (action.payload.successful) {
          state.pendingActions = state.pendingActions.filter(
            action => !action.payload.successful.includes(action.id)
          );
        }
        
        // Update failed actions with retry count
        if (action.payload.failed) {
          action.payload.failed.forEach((failedId: string) => {
            const actionIndex = state.pendingActions.findIndex(a => a.id === failedId);
            if (actionIndex !== -1) {
              state.pendingActions[actionIndex].retries += 1;
            }
          });
        }
        
        state.lastSync = new Date().toISOString();
      })
      .addCase(syncPendingActions.rejected, (state, action) => {
        state.isSyncing = false;
        state.error = action.payload as string;
      });

    // Resolve conflict
    builder
      .addCase(resolveConflict.pending, (state) => {
        state.isSyncing = true;
        state.error = null;
      })
      .addCase(resolveConflict.fulfilled, (state, action) => {
        state.isSyncing = false;
        state.conflicts = state.conflicts.filter(c => c.id !== action.payload.conflictId);
      })
      .addCase(resolveConflict.rejected, (state, action) => {
        state.isSyncing = false;
        state.error = action.payload as string;
      });

    // Add pending action
    builder
      .addCase(addPendingAction.fulfilled, (state, action) => {
        state.pendingActions.push(action.payload);
      })
      .addCase(addPendingAction.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Incremental sync
    builder
      .addCase(incrementalSync.pending, (state) => {
        state.isSyncing = true;
        state.error = null;
        state.lastSyncAttempt = new Date().toISOString();
      })
      .addCase(incrementalSync.fulfilled, (state, action) => {
        state.isSyncing = false;
        state.lastSync = new Date().toISOString();
        
        if (action.payload.conflicts) {
          state.conflicts = [...state.conflicts, ...action.payload.conflicts];
        }
      })
      .addCase(incrementalSync.rejected, (state, action) => {
        state.isSyncing = false;
        state.error = action.payload as string;
      });

    // Check connectivity
    builder
      .addCase(checkConnectivity.fulfilled, (state, action) => {
        state.isOnline = action.payload;
      });
  },
});

export const {
  setOnlineStatus,
  updateSyncProgress,
  clearError,
  addConflict,
  removeConflict,
  retryPendingAction,
  removePendingAction,
  resetSync,
} = syncSlice.actions;

export default syncSlice.reducer;