module.exports = {
  rootDir: '..',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/config/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@components/(.*)$': '<rootDir>/src/shared/components/$1',
    '^@utils/(.*)$': '<rootDir>/src/shared/utils/$1',
    '^@router/(.*)$': '<rootDir>/src/shared/router/$1',
    '^@wallet/(.*)$': '<rootDir>/src/features/wallet/$1',
    '^@voting/(.*)$': '<rootDir>/src/features/voting/$1',
    '^@clans/(.*)$': '<rootDir>/src/features/clans/$1',
    '^@content/(.*)$': '<rootDir>/src/features/content/$1',
    '^@tokens/(.*)$': '<rootDir>/src/features/tokens/$1',
    '^@styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/index.{js,ts}',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: [['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }]] }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(uuid|@solana|@jest)/)'
  ],
  resetModules: true,
  clearMocks: true,
  resetMocks: true,
};