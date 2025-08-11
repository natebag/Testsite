/**
 * Test Setup Configuration
 */

import 'react-native-gesture-handler/jestSetup';

// Mock react-native modules
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-encrypted-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-sqlite-storage', () => ({
  DEBUG: jest.fn(),
  enablePromise: jest.fn(),
  openDatabase: jest.fn(() => Promise.resolve({
    executeSql: jest.fn(() => Promise.resolve([])),
    close: jest.fn(() => Promise.resolve()),
  })),
}));

jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: () => ({
    requestPermission: jest.fn(() => Promise.resolve(true)),
    getToken: jest.fn(() => Promise.resolve('mock-token')),
    onMessage: jest.fn(),
    onNotificationOpenedApp: jest.fn(),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
    onTokenRefresh: jest.fn(),
  }),
}));

jest.mock('react-native-permissions', () => ({
  request: jest.fn(() => Promise.resolve('granted')),
  check: jest.fn(() => Promise.resolve('granted')),
  PERMISSIONS: {
    ANDROID: {
      CAMERA: 'android.permission.CAMERA',
      RECORD_AUDIO: 'android.permission.RECORD_AUDIO',
    },
    IOS: {
      CAMERA: 'ios.permission.CAMERA',
      MICROPHONE: 'ios.permission.MICROPHONE',
    },
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
  },
}));

jest.mock('react-native-biometrics', () => ({
  isSensorAvailable: jest.fn(() => Promise.resolve({available: true, biometryType: 'TouchID'})),
  createSignature: jest.fn(() => Promise.resolve({success: true, signature: 'mock-signature'})),
  createKeys: jest.fn(() => Promise.resolve({publicKey: 'mock-public-key'})),
  biometricKeysExist: jest.fn(() => Promise.resolve({keysExist: true})),
  deleteKeys: jest.fn(() => Promise.resolve()),
}));

// Global test setup
global.__TEST__ = true;

// Silence console warnings in tests
global.console.warn = jest.fn();
global.console.error = jest.fn();