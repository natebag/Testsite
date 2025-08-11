/**
 * Clan Redux Slice
 */

import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {ClanService} from '@/services/ClanService';
import {Clan, ClanMember} from '@/types';

interface ClanState {
  clans: Clan[];
  currentClan: Clan | null;
  memberRequests: any[];
  invitations: any[];
  loading: boolean;
  error: string | null;
}

const initialState: ClanState = {
  clans: [],
  currentClan: null,
  memberRequests: [],
  invitations: [],
  loading: false,
  error: null,
};

export const fetchUserClans = createAsyncThunk(
  'clan/fetchUserClans',
  async (_, {rejectWithValue}) => {
    try {
      return await ClanService.getUserClans();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const joinClan = createAsyncThunk(
  'clan/join',
  async ({clanId}: {clanId: string}, {rejectWithValue}) => {
    try {
      return await ClanService.joinClan(clanId);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const clanSlice = createSlice({
  name: 'clan',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentClan: (state, action) => {
      state.currentClan = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserClans.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserClans.fulfilled, (state, action) => {
        state.loading = false;
        state.clans = action.payload;
      })
      .addCase(fetchUserClans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {clearError, setCurrentClan} = clanSlice.actions;
export default clanSlice.reducer;