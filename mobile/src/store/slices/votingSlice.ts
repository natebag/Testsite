/**
 * Voting Redux Slice
 */

import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {VotingService} from '@/services/VotingService';
import {VotingProposal, Vote} from '@/types';

interface VotingState {
  proposals: VotingProposal[];
  userVotes: Vote[];
  activeProposals: VotingProposal[];
  loading: boolean;
  error: string | null;
}

const initialState: VotingState = {
  proposals: [],
  userVotes: [],
  activeProposals: [],
  loading: false,
  error: null,
};

export const fetchProposals = createAsyncThunk(
  'voting/fetchProposals',
  async (_, {rejectWithValue}) => {
    try {
      return await VotingService.getProposals();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const castVote = createAsyncThunk(
  'voting/castVote',
  async ({proposalId, optionId, tokensSpent}: {proposalId: string; optionId: string; tokensSpent: number}, {rejectWithValue}) => {
    try {
      return await VotingService.castVote(proposalId, optionId, tokensSpent);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const votingSlice = createSlice({
  name: 'voting',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProposals.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProposals.fulfilled, (state, action) => {
        state.loading = false;
        state.proposals = action.payload.all;
        state.activeProposals = action.payload.active;
      })
      .addCase(fetchProposals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {clearError} = votingSlice.actions;
export default votingSlice.reducer;