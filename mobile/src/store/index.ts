/**
 * Redux Store Configuration for MLG.clan Mobile App
 */

import {configureStore} from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import EncryptedStorage from 'react-native-encrypted-storage';

// Reducers
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import clanReducer from './slices/clanSlice';
import contentReducer from './slices/contentSlice';
import walletReducer from './slices/walletSlice';
import votingReducer from './slices/votingSlice';
import notificationReducer from './slices/notificationSlice';
import syncReducer from './slices/syncSlice';
import performanceReducer from './slices/performanceSlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  version: 1,
  storage: EncryptedStorage,
  whitelist: ['auth', 'user', 'wallet', 'sync'],
  blacklist: ['performance'], // Don't persist performance data
};

// Sensitive data persist config
const sensitivePersistConfig = {
  key: 'wallet',
  storage: EncryptedStorage,
  serialize: false,
  deserialize: false,
};

// Root reducer
const rootReducer = {
  auth: persistReducer(persistConfig, authReducer),
  user: userReducer,
  clan: clanReducer,
  content: contentReducer,
  wallet: persistReducer(sensitivePersistConfig, walletReducer),
  voting: votingReducer,
  notification: notificationReducer,
  sync: syncReducer,
  performance: performanceReducer,
};

// Configure store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['items.dates'],
      },
      immutableCheck: {
        ignoredPaths: ['some.nested.path'],
      },
    }),
  devTools: __DEV__,
});

export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
import {useDispatch, useSelector, TypedUseSelectorHook} from 'react-redux';
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;