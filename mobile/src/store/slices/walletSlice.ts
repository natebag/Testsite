/**
 * Wallet Redux Slice
 */

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {WalletService} from '@/services/WalletService';
import {Wallet, Transaction, WalletProvider} from '@/types';

interface WalletState {
  wallet: Wallet | null;
  transactions: Transaction[];
  isConnecting: boolean;
  isConnected: boolean;
  provider: WalletProvider | null;
  balance: number;
  tokens: any[];
  loading: boolean;
  error: string | null;
  lastUpdate: string | null;
}

const initialState: WalletState = {
  wallet: null,
  transactions: [],
  isConnecting: false,
  isConnected: false,
  provider: null,
  balance: 0,
  tokens: [],
  loading: false,
  error: null,
  lastUpdate: null,
};

// Async Thunks
export const connectWallet = createAsyncThunk(
  'wallet/connect',
  async ({provider}: {provider: WalletProvider}, {rejectWithValue}) => {
    try {
      const wallet = await WalletService.connect(provider);
      return {wallet, provider};
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to connect wallet');
    }
  }
);

export const disconnectWallet = createAsyncThunk(
  'wallet/disconnect',
  async (_, {rejectWithValue}) => {
    try {
      await WalletService.disconnect();
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to disconnect wallet');
    }
  }
);

export const refreshBalance = createAsyncThunk(
  'wallet/refreshBalance',
  async (_, {getState, rejectWithValue}) => {
    try {
      const state = getState() as {wallet: WalletState};
      const {wallet} = state.wallet;
      
      if (!wallet || !wallet.address) {
        throw new Error('No wallet connected');
      }

      const balance = await WalletService.getBalance(wallet.address);
      const tokens = await WalletService.getTokens(wallet.address);
      
      return {balance, tokens};
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to refresh balance');
    }
  }
);

export const sendTransaction = createAsyncThunk(
  'wallet/sendTransaction',
  async ({
    to,
    amount,
    token,
    memo
  }: {
    to: string;
    amount: number;
    token?: string;
    memo?: string;
  }, {getState, rejectWithValue}) => {
    try {
      const state = getState() as {wallet: WalletState};
      const {wallet} = state.wallet;
      
      if (!wallet || !wallet.address) {
        throw new Error('No wallet connected');
      }

      const transaction = await WalletService.sendTransaction({
        from: wallet.address,
        to,
        amount,
        token,
        memo,
      });
      
      return transaction;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Transaction failed');
    }
  }
);

export const signMessage = createAsyncThunk(
  'wallet/signMessage',
  async ({message}: {message: string}, {getState, rejectWithValue}) => {
    try {
      const state = getState() as {wallet: WalletState};
      const {wallet} = state.wallet;
      
      if (!wallet || !wallet.address) {
        throw new Error('No wallet connected');
      }

      const signature = await WalletService.signMessage(message);
      return {message, signature};
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to sign message');
    }
  }
);

export const getTransactionHistory = createAsyncThunk(
  'wallet/getTransactionHistory',
  async (_, {getState, rejectWithValue}) => {
    try {
      const state = getState() as {wallet: WalletState};
      const {wallet} = state.wallet;
      
      if (!wallet || !wallet.address) {
        throw new Error('No wallet connected');
      }

      const transactions = await WalletService.getTransactionHistory(wallet.address);
      return transactions;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get transaction history');
    }
  }
);

export const estimateTransactionFee = createAsyncThunk(
  'wallet/estimateTransactionFee',
  async ({
    to,
    amount,
    token
  }: {
    to: string;
    amount: number;
    token?: string;
  }, {getState, rejectWithValue}) => {
    try {
      const state = getState() as {wallet: WalletState};
      const {wallet} = state.wallet;
      
      if (!wallet || !wallet.address) {
        throw new Error('No wallet connected');
      }

      const fee = await WalletService.estimateFee({
        from: wallet.address,
        to,
        amount,
        token,
      });
      
      return fee;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to estimate fee');
    }
  }
);

// Wallet Slice
const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateTransaction: (state, action: PayloadAction<Transaction>) => {
      const index = state.transactions.findIndex(tx => tx.id === action.payload.id);
      if (index !== -1) {
        state.transactions[index] = action.payload;
      } else {
        state.transactions.unshift(action.payload);
      }
    },
    setProvider: (state, action: PayloadAction<WalletProvider>) => {
      state.provider = action.payload;
    },
    resetWallet: (state) => {
      state.wallet = null;
      state.transactions = [];
      state.isConnected = false;
      state.provider = null;
      state.balance = 0;
      state.tokens = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Connect wallet
    builder
      .addCase(connectWallet.pending, (state) => {
        state.isConnecting = true;
        state.error = null;
      })
      .addCase(connectWallet.fulfilled, (state, action) => {
        state.isConnecting = false;
        state.isConnected = true;
        state.wallet = action.payload.wallet;
        state.provider = action.payload.provider;
        state.balance = action.payload.wallet.balance;
        state.tokens = action.payload.wallet.tokens;
        state.lastUpdate = new Date().toISOString();
      })
      .addCase(connectWallet.rejected, (state, action) => {
        state.isConnecting = false;
        state.error = action.payload as string;
      });

    // Disconnect wallet
    builder
      .addCase(disconnectWallet.pending, (state) => {
        state.loading = true;
      })
      .addCase(disconnectWallet.fulfilled, (state) => {
        state.loading = false;
        state.wallet = null;
        state.transactions = [];
        state.isConnected = false;
        state.provider = null;
        state.balance = 0;
        state.tokens = [];
      })
      .addCase(disconnectWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Refresh balance
    builder
      .addCase(refreshBalance.pending, (state) => {
        state.loading = true;
      })
      .addCase(refreshBalance.fulfilled, (state, action) => {
        state.loading = false;
        state.balance = action.payload.balance;
        state.tokens = action.payload.tokens;
        state.lastUpdate = new Date().toISOString();
      })
      .addCase(refreshBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Send transaction
    builder
      .addCase(sendTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions.unshift(action.payload);
      })
      .addCase(sendTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Get transaction history
    builder
      .addCase(getTransactionHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(getTransactionHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload;
        state.lastUpdate = new Date().toISOString();
      })
      .addCase(getTransactionHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Sign message
    builder
      .addCase(signMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signMessage.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(signMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Estimate transaction fee
    builder
      .addCase(estimateTransactionFee.pending, (state) => {
        state.loading = true;
      })
      .addCase(estimateTransactionFee.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(estimateTransactionFee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {clearError, updateTransaction, setProvider, resetWallet} = walletSlice.actions;
export default walletSlice.reducer;