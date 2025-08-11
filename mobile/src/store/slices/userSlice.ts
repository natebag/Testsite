/**
 * User Redux Slice
 */

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {UserService} from '@/services/UserService';
import {User, UserPreferences, Achievement} from '@/types';

interface UserState {
  profile: User | null;
  achievements: Achievement[];
  preferences: UserPreferences | null;
  loading: boolean;
  error: string | null;
  lastUpdate: string | null;
}

const initialState: UserState = {
  profile: null,
  achievements: [],
  preferences: null,
  loading: false,
  error: null,
  lastUpdate: null,
};

// Async Thunks
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async ({userId}: {userId?: string} = {}, {rejectWithValue}) => {
    try {
      const profile = await UserService.getProfile(userId);
      return profile;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (updates: Partial<User>, {rejectWithValue}) => {
    try {
      const updatedProfile = await UserService.updateProfile(updates);
      return updatedProfile;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update profile');
    }
  }
);

export const fetchUserAchievements = createAsyncThunk(
  'user/fetchAchievements',
  async (_, {rejectWithValue}) => {
    try {
      const achievements = await UserService.getAchievements();
      return achievements;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch achievements');
    }
  }
);

export const updateUserPreferences = createAsyncThunk(
  'user/updatePreferences',
  async (preferences: Partial<UserPreferences>, {rejectWithValue}) => {
    try {
      const updatedPreferences = await UserService.updatePreferences(preferences);
      return updatedPreferences;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update preferences');
    }
  }
);

export const uploadProfilePicture = createAsyncThunk(
  'user/uploadProfilePicture',
  async ({imageUri}: {imageUri: string}, {rejectWithValue}) => {
    try {
      const profilePictureUrl = await UserService.uploadProfilePicture(imageUri);
      return profilePictureUrl;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to upload profile picture');
    }
  }
);

// User Slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateStats: (state, action: PayloadAction<Partial<User['stats']>>) => {
      if (state.profile) {
        state.profile.stats = {...state.profile.stats, ...action.payload};
      }
    },
    addAchievement: (state, action: PayloadAction<Achievement>) => {
      const exists = state.achievements.find(a => a.id === action.payload.id);
      if (!exists) {
        state.achievements.push(action.payload);
      }
    },
    updatePreferencesLocal: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      if (state.preferences) {
        state.preferences = {...state.preferences, ...action.payload};
      }
    },
    setLastUpdate: (state) => {
      state.lastUpdate = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    // Fetch user profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.preferences = action.payload.preferences;
        state.lastUpdate = new Date().toISOString();
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update user profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.lastUpdate = new Date().toISOString();
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch user achievements
    builder
      .addCase(fetchUserAchievements.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserAchievements.fulfilled, (state, action) => {
        state.loading = false;
        state.achievements = action.payload;
        state.lastUpdate = new Date().toISOString();
      })
      .addCase(fetchUserAchievements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update user preferences
    builder
      .addCase(updateUserPreferences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserPreferences.fulfilled, (state, action) => {
        state.loading = false;
        state.preferences = action.payload;
        state.lastUpdate = new Date().toISOString();
      })
      .addCase(updateUserPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Upload profile picture
    builder
      .addCase(uploadProfilePicture.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadProfilePicture.fulfilled, (state, action) => {
        state.loading = false;
        if (state.profile) {
          state.profile.profilePicture = action.payload;
        }
        state.lastUpdate = new Date().toISOString();
      })
      .addCase(uploadProfilePicture.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  updateStats,
  addAchievement,
  updatePreferencesLocal,
  setLastUpdate,
} = userSlice.actions;

export default userSlice.reducer;