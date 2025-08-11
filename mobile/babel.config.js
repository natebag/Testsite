module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
      safe: false,
      allowUndefined: true,
    }],
    ['module-resolver', {
      root: ['./src'],
      extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
      alias: {
        '@': './src',
        '@components': './src/components',
        '@screens': './src/screens',
        '@services': './src/services',
        '@utils': './src/utils',
        '@types': './src/types',
        '@store': './src/store',
        '@assets': './assets',
      },
    }],
  ],
};