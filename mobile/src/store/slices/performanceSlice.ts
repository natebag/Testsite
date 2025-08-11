/**
 * Performance Redux Slice
 */

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {PerformanceMonitor} from '@/services/PerformanceMonitor';
import {PerformanceMetrics} from '@/types';

interface PerformanceState {
  metrics: PerformanceMetrics;
  isMonitoring: boolean;
  alerts: string[];
  history: PerformanceMetrics[];
  loading: boolean;
  error: string | null;
}

const initialState: PerformanceState = {
  metrics: {
    appStartTime: 0,
    memoryUsage: 0,
    batteryLevel: 100,
    networkLatency: 0,
    renderTime: 0,
    crashCount: 0,
  },
  isMonitoring: false,
  alerts: [],
  history: [],
  loading: false,
  error: null,
};

export const startMonitoring = createAsyncThunk(
  'performance/startMonitoring',
  async (_, {rejectWithValue}) => {
    try {
      await PerformanceMonitor.startMonitoring();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const collectMetrics = createAsyncThunk(
  'performance/collectMetrics',
  async (_, {rejectWithValue}) => {
    try {
      return await PerformanceMonitor.collectMetrics();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const performanceSlice = createSlice({
  name: 'performance',
  initialState,
  reducers: {
    updateMetrics: (state, action: PayloadAction<Partial<PerformanceMetrics>>) => {
      state.metrics = {...state.metrics, ...action.payload};
    },
    addAlert: (state, action: PayloadAction<string>) => {
      state.alerts.push(action.payload);
    },
    clearAlerts: (state) => {
      state.alerts = [];
    },
    setMonitoring: (state, action: PayloadAction<boolean>) => {
      state.isMonitoring = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startMonitoring.fulfilled, (state) => {
        state.isMonitoring = true;
      })
      .addCase(collectMetrics.fulfilled, (state, action) => {
        state.metrics = action.payload;
        state.history.push(action.payload);
        // Keep only last 100 entries
        if (state.history.length > 100) {
          state.history.shift();
        }
      });
  },
});

export const {updateMetrics, addAlert, clearAlerts, setMonitoring} = performanceSlice.actions;
export default performanceSlice.reducer;