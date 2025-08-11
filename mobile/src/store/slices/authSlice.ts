/**
 * Authentication Redux Slice
 */

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {AuthService} from '@/services/AuthService';
import {BiometricService} from '@/services/BiometricService';
import {User} from '@/types';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  biometricEnabled: boolean;
  mfaRequired: boolean;
  loading: boolean;
  error: string | null;
  lastAuthCheck: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  refreshToken: null,
  biometricEnabled: false,
  mfaRequired: false,
  loading: false,
  error: null,
  lastAuthCheck: null,
};

// Async Thunks
export const loginWithCredentials = createAsyncThunk(
  'auth/loginWithCredentials',
  async ({email, password}: {email: string; password: string}, {rejectWithValue}) => {
    try {
      const response = await AuthService.login(email, password);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const loginWithWallet = createAsyncThunk(
  'auth/loginWithWallet',
  async ({walletAddress, signature}: {walletAddress: string; signature: string}, {rejectWithValue}) => {
    try {
      const response = await AuthService.loginWithWallet(walletAddress, signature);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Wallet login failed');
    }
  }
);

export const loginWithBiometrics = createAsyncThunk(
  'auth/loginWithBiometrics',
  async (_, {rejectWithValue}) => {
    try {
      const isSupported = await BiometricService.isSupported();
      if (!isSupported) {
        throw new Error('Biometric authentication not supported');
      }

      const biometricResult = await BiometricService.authenticate();
      if (!biometricResult.success) {
        throw new Error('Biometric authentication failed');
      }

      const response = await AuthService.loginWithBiometrics();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Biometric login failed');
    }
  }
);

export const refreshAuthToken = createAsyncThunk(
  'auth/refreshAuthToken',
  async (_, {getState, rejectWithValue}) => {
    try {
      const state = getState() as {auth: AuthState};
      const {refreshToken} = state.auth;
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await AuthService.refreshToken(refreshToken);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Token refresh failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, {getState}) => {
    const state = getState() as {auth: AuthState};
    const {token} = state.auth;
    
    if (token) {
      await AuthService.logout(token);
    }
    
    return null;
  }
);

export const enableBiometrics = createAsyncThunk(
  'auth/enableBiometrics',
  async (_, {rejectWithValue}) => {
    try {
      const isSupported = await BiometricService.isSupported();
      if (!isSupported) {
        throw new Error('Biometric authentication not supported on this device');
      }

      const result = await BiometricService.enroll();
      if (!result.success) {
        throw new Error('Failed to enable biometric authentication');
      }

      await AuthService.enableBiometrics();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to enable biometrics');
    }
  }
);

export const verifyMFA = createAsyncThunk(
  'auth/verifyMFA',
  async ({code}: {code: string}, {rejectWithValue}) => {
    try {
      const response = await AuthService.verifyMFA(code);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'MFA verification failed');
    }
  }
);

// Auth Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setMFARequired: (state, action: PayloadAction<boolean>) => {
      state.mfaRequired = action.payload;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = {...state.user, ...action.payload};
      }
    },
    setLastAuthCheck: (state) => {
      state.lastAuthCheck = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    // Login with credentials
    builder
      .addCase(loginWithCredentials.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithCredentials.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.mfaRequired = action.payload.mfaRequired || false;
        state.lastAuthCheck = new Date().toISOString();
      })
      .addCase(loginWithCredentials.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Login with wallet
    builder
      .addCase(loginWithWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithWallet.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.lastAuthCheck = new Date().toISOString();
      })
      .addCase(loginWithWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Login with biometrics
    builder
      .addCase(loginWithBiometrics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithBiometrics.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.lastAuthCheck = new Date().toISOString();
      })
      .addCase(loginWithBiometrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Refresh token
    builder
      .addCase(refreshAuthToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.lastAuthCheck = new Date().toISOString();
      })
      .addCase(refreshAuthToken.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
      });

    // Logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.mfaRequired = false;
        state.error = null;
      });

    // Enable biometrics
    builder
      .addCase(enableBiometrics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(enableBiometrics.fulfilled, (state) => {
        state.loading = false;
        state.biometricEnabled = true;
      })
      .addCase(enableBiometrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Verify MFA
    builder
      .addCase(verifyMFA.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyMFA.fulfilled, (state, action) => {
        state.loading = false;
        state.mfaRequired = false;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(verifyMFA.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {clearError, setMFARequired, updateUser, setLastAuthCheck} = authSlice.actions;
export default authSlice.reducer;