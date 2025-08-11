const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

const config = {
  resolver: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@screens': path.resolve(__dirname, 'src/screens'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@store': path.resolve(__dirname, 'src/store'),
      '@assets': path.resolve(__dirname, 'assets'),
    },
    platforms: ['native', 'android', 'ios'],
  },
  transformer: {
    assetPlugins: ['expo-asset/tools/hashAssetFiles'],
  },
  watchFolders: [
    path.resolve(__dirname, '../src'), // Watch parent web project for shared code
  ],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);