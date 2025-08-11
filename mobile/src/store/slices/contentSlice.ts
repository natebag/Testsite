/**
 * Content Redux Slice
 */

import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {ContentService} from '@/services/ContentService';
import {Content} from '@/types';

interface ContentState {
  content: Content[];
  featured: Content[];
  userContent: Content[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
}

const initialState: ContentState = {
  content: [],
  featured: [],
  userContent: [],
  loading: false,
  error: null,
  hasMore: true,
  currentPage: 1,
};

export const fetchContent = createAsyncThunk(
  'content/fetchContent',
  async ({page = 1, limit = 10}: {page?: number; limit?: number} = {}, {rejectWithValue}) => {
    try {
      return await ContentService.getContent(page, limit);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const submitContent = createAsyncThunk(
  'content/submit',
  async (contentData: any, {rejectWithValue}) => {
    try {
      return await ContentService.submitContent(contentData);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetContent: (state) => {
      state.content = [];
      state.currentPage = 1;
      state.hasMore = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchContent.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchContent.fulfilled, (state, action) => {
        state.loading = false;
        if (action.meta.arg.page === 1) {
          state.content = action.payload.content;
        } else {
          state.content = [...state.content, ...action.payload.content];
        }
        state.hasMore = action.payload.hasMore;
        state.currentPage = action.meta.arg.page || 1;
      })
      .addCase(fetchContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {clearError, resetContent} = contentSlice.actions;
export default contentSlice.reducer;