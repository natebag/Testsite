/**
 * Solana Network Configuration
 * 
 * Contains RPC endpoints, network settings, and program addresses
 * for the MLG.clan platform
 */

import { clusterApiUrl, Connection } from '@solana/web3.js';

// Network Configuration
export const SOLANA_NETWORKS = {
  DEVNET: 'devnet',
  MAINNET: 'mainnet-beta',
  TESTNET: 'testnet'
};

// Current network - MAINNET for real MLG token deployment
export const CURRENT_NETWORK = SOLANA_NETWORKS.MAINNET;

// RPC Endpoints with fallbacks
export const RPC_ENDPOINTS = {
  [SOLANA_NETWORKS.DEVNET]: [
    clusterApiUrl('devnet'),
    'https://api.devnet.solana.com',
    'https://devnet.genesysgo.net'
  ],
  [SOLANA_NETWORKS.MAINNET]: [
    clusterApiUrl('mainnet-beta'),
    'https://api.mainnet-beta.solana.com',
    'https://solana-api.projectserum.com'
  ]
};

// SPL Token Program Addresses for MLG token
export const TOKEN_PROGRAMS = {
  MLG_TOKEN_MINT: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL', // Real MLG SPL Token mint address
  ASSOCIATED_TOKEN_PROGRAM: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  TOKEN_PROGRAM: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
};

// MLG Token specific configuration
export const MLG_TOKEN_CONFIG = {
  SYMBOL: 'MLG',
  NAME: 'MLG Gaming Token',
  DECIMALS: 9, // Standard for Solana SPL tokens
  EXPECTED_DECIMALS: 9, // Used for burn calculations
  DISCOVERY_ENABLED: true,
  
  // Token operations configuration
  BURN_VOTE_COSTS: {
    1: 1,    // 1 MLG for 1st additional vote
    2: 2,    // 2 MLG for 2nd additional vote  
    3: 3,    // 3 MLG for 3rd additional vote
    4: 4     // 4 MLG for 4th additional vote
  },
  
  // Transaction settings optimized for MLG token operations
  TRANSACTION_CONFIG: {
    MAX_RETRIES: 5,
    RETRY_DELAY: 1000,
    CONFIRMATION_TIMEOUT: 30000,
    PRIORITY_FEE: 0, // Micro-lamports
    COMPUTE_UNIT_LIMIT: 200000,
    
    // Dedicated RPC endpoints optimized for SPL token operations
    RPC_ENDPOINTS: [
      // Primary high-performance RPC for token queries
      'https://api.mainnet-beta.solana.com',
      // Backup RPC endpoints with good SPL token support
      'https://solana-api.projectserum.com',
      'https://rpc.ankr.com/solana',
      // QuickNode RPC (if available)
      'https://late-spring-smoke.solana-mainnet.quiknode.pro'
    ]
  }
};

// Connection Configuration
export const CONNECTION_CONFIG = {
  commitment: 'confirmed',
  preflightCommitment: 'confirmed',
  skipPreflight: false,
  maxRetries: 3,
  confirmTransactionInitialTimeout: 60000
};

// Wallet Configuration
export const WALLET_CONFIG = {
  autoConnect: false,
  localStorageKey: 'mlg_clan_wallet_adapter',
  onError: (error) => {
    console.error('Wallet error:', error);
  }
};

// Create Solana connection with fallback RPC providers
export function createConnection(network = CURRENT_NETWORK) {
  const endpoints = RPC_ENDPOINTS[network];
  
  if (!endpoints || endpoints.length === 0) {
    throw new Error(`No RPC endpoints configured for network: ${network}`);
  }

  // Try primary endpoint first, fallback to others if needed
  try {
    return new Connection(endpoints[0], CONNECTION_CONFIG);
  } catch (error) {
    console.warn('Primary RPC endpoint failed, trying fallbacks...', error);
    
    for (let i = 1; i < endpoints.length; i++) {
      try {
        return new Connection(endpoints[i], CONNECTION_CONFIG);
      } catch (fallbackError) {
        console.warn(`Fallback RPC ${i} failed:`, fallbackError);
      }
    }
    
    throw new Error(`All RPC endpoints failed for network: ${network}`);
  }
}

// Validation helpers
export function validateNetwork(network) {
  return Object.values(SOLANA_NETWORKS).includes(network);
}

export function getCurrentNetworkEndpoints() {
  return RPC_ENDPOINTS[CURRENT_NETWORK];
}

// MLG Token specific connection utilities
export function createMLGTokenConnection(network = CURRENT_NETWORK, options = {}) {
  let endpoint;
  
  // Use custom endpoint if provided, otherwise use optimized RPC endpoints
  if (options.endpoint) {
    endpoint = options.endpoint;
  } else {
    // Select best RPC endpoint for MLG token operations based on network
    const mlgEndpoints = network === SOLANA_NETWORKS.MAINNET
      ? MLG_TOKEN_CONFIG.TRANSACTION_CONFIG.RPC_ENDPOINTS
      : RPC_ENDPOINTS[network];
      
    endpoint = mlgEndpoints[0]; // Use primary optimized endpoint
  }
  
  // Create connection with MLG token optimizations
  const mlgOptions = {
    ...CONNECTION_CONFIG,
    ...MLG_TOKEN_CONFIG.TRANSACTION_CONFIG,
    commitment: 'confirmed', // Faster than 'finalized' for token queries
    wsEndpoint: undefined, // Disable WebSocket for token operations
    disableRetryOnRateLimit: false,
    httpHeaders: {
      'Content-Type': 'application/json',
      'User-Agent': 'MLG-Clan-Platform/1.0'
    },
    ...options
  };
  
  try {
    const connection = new Connection(endpoint, mlgOptions);
    
    // Add MLG token specific connection optimizations
    connection._mlgOptimized = true;
    connection._tokenEndpoint = endpoint;
    connection._lastHealthCheck = Date.now();
    
    console.log(`Created MLG-optimized connection to: ${endpoint}`);
    return connection;
  } catch (error) {
    console.warn('Failed to create optimized MLG connection, falling back to default:', error);
    return createConnection(network);
  }
}

export async function validateMLGTokenMint(mintAddress) {
  try {
    if (mintAddress === 'MLGtokenMintAddressToBeDeployedLater') {
      return { isValid: false, error: 'Placeholder mint address' };
    }
    
    // Validate against the real MLG token mint address
    if (mintAddress !== '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL') {
      return { isValid: false, error: 'Invalid MLG token mint address' };
    }
    
    // Basic PublicKey validation
    const { PublicKey } = await import('@solana/web3.js');
    new PublicKey(mintAddress); // Will throw if invalid
    return { isValid: true, mintAddress };
  } catch (error) {
    return { isValid: false, error: error.message };
  }
}

export function getMLGTokenNetworkConfig(network = CURRENT_NETWORK) {
  return {
    network,
    endpoints: RPC_ENDPOINTS[network],
    mintAddress: TOKEN_PROGRAMS.MLG_TOKEN_MINT,
    tokenConfig: MLG_TOKEN_CONFIG,
    connectionConfig: CONNECTION_CONFIG
  };
}

// MLG Token Connection Validation
export async function validateMLGTokenConnection(connection, mintAddress = TOKEN_PROGRAMS.MLG_TOKEN_MINT) {
  const validation = {
    connectionHealthy: false,
    mintAddressValid: false,
    tokenProgramAccessible: false,
    responseTime: null,
    error: null
  };
  
  try {
    const startTime = Date.now();
    
    // Test basic connection health
    const version = await connection.getVersion();
    validation.connectionHealthy = !!version;
    
    // Test SPL Token program accessibility
    const tokenProgramInfo = await connection.getAccountInfo(
      new (await import('@solana/web3.js')).PublicKey(TOKEN_PROGRAMS.TOKEN_PROGRAM)
    );
    validation.tokenProgramAccessible = !!tokenProgramInfo;
    
    // Validate MLG token mint address - must be the real contract
    if (mintAddress !== 'MLGtokenMintAddressToBeDeployedLater') {
      try {
        // Verify it's the correct MLG token mint
        if (mintAddress !== '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL') {
          validation.mintAddressValid = false;
        } else {
          const mintPublicKey = new (await import('@solana/web3.js')).PublicKey(mintAddress);
          const mintInfo = await connection.getAccountInfo(mintPublicKey);
          validation.mintAddressValid = !!mintInfo;
        }
      } catch (error) {
        validation.mintAddressValid = false;
      }
    }
    
    validation.responseTime = Date.now() - startTime;
    
    return validation;
  } catch (error) {
    validation.error = error.message;
    return validation;
  }
}

// Get optimized MLG token query configuration
export function getMLGTokenQueryConfig() {
  return {
    commitment: 'confirmed',
    encoding: 'base64',
    maxSupportedTransactionVersion: 0,
    skipPreflight: false,
    preflightCommitment: 'confirmed'
  };
}