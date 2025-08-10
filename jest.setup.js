/**
 * Jest setup file for MLG.clan platform tests
 */

// Mock browser APIs and Node.js polyfills
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Buffer for Solana web3.js
global.Buffer = Buffer;

// Mock crypto for web3.js
const crypto = require('crypto');
Object.defineProperty(global.self, 'crypto', {
  value: {
    getRandomValues: arr => crypto.randomBytes(arr.length)
  }
});

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock console methods for cleaner test output
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn()
};

// Mock Solana web3.js modules
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getAccountInfo: jest.fn(),
    getLatestBlockhash: jest.fn().mockResolvedValue({ blockhash: 'mock-blockhash' }),
    sendRawTransaction: jest.fn().mockResolvedValue('mock-signature'),
    confirmTransaction: jest.fn().mockResolvedValue(true),
    getVersion: jest.fn().mockResolvedValue({ 'solana-core': '1.16.0' }),
    getSlot: jest.fn().mockResolvedValue(100000)
  })),
  PublicKey: jest.fn().mockImplementation((key) => ({
    toString: () => key,
    toBase58: () => key,
    equals: jest.fn().mockReturnValue(false)
  })),
  Transaction: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockReturnThis(),
    serialize: jest.fn().mockReturnValue(Buffer.from('mock-serialized'))
  })),
  sendAndConfirmTransaction: jest.fn().mockResolvedValue('mock-signature'),
  clusterApiUrl: jest.fn().mockReturnValue('https://api.devnet.solana.com')
}));

// Mock Solana SPL Token modules  
jest.mock('@solana/spl-token', () => ({
  TOKEN_PROGRAM_ID: { toString: () => 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
  ASSOCIATED_TOKEN_PROGRAM_ID: { toString: () => 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL' },
  getAssociatedTokenAddress: jest.fn().mockResolvedValue({ toString: () => 'mock-associated-token-address' }),
  createAssociatedTokenAccountInstruction: jest.fn().mockReturnValue({}),
  createBurnInstruction: jest.fn().mockReturnValue({}),
  getAccount: jest.fn().mockResolvedValue({
    amount: BigInt('1000000000'),
    mint: 'mock-mint',
    owner: 'mock-owner'
  }),
  getMint: jest.fn().mockResolvedValue({
    decimals: 9,
    supply: BigInt('1000000000000000'),
    isInitialized: true,
    mintAuthority: null,
    freezeAuthority: null
  })
}));

// Mock fetch for token discovery
global.fetch = jest.fn().mockResolvedValue({
  json: jest.fn().mockResolvedValue({ tokens: [] })
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
});