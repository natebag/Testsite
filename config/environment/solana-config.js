/**
 * Solana Network Configuration for MLG.clan Platform
 * 
 * Centralized configuration for Solana network connections, RPC endpoints,
 * and blockchain integration settings used across the platform.
 */

import { Connection, clusterApiUrl } from '@solana/web3.js';

/**
 * Network Configuration
 */
export const NETWORK_CONFIG = {
  // Current network (change to 'mainnet-beta' for production)
  CURRENT: 'mainnet-beta',
  
  // Available networks
  NETWORKS: {
    'mainnet-beta': {
      name: 'Mainnet Beta',
      cluster: 'mainnet-beta',
      rpcEndpoint: clusterApiUrl('mainnet-beta'),
      explorerUrl: 'https://explorer.solana.com'
    },
    'devnet': {
      name: 'Devnet',
      cluster: 'devnet', 
      rpcEndpoint: clusterApiUrl('devnet'),
      explorerUrl: 'https://explorer.solana.com/?cluster=devnet'
    },
    'testnet': {
      name: 'Testnet',
      cluster: 'testnet',
      rpcEndpoint: clusterApiUrl('testnet'), 
      explorerUrl: 'https://explorer.solana.com/?cluster=testnet'
    }
  }
};

/**
 * RPC Connection Configuration
 */
export const CONNECTION_CONFIG = {
  // Primary RPC endpoints (add your custom RPCs here)
  RPC_ENDPOINTS: {
    'mainnet-beta': [
      clusterApiUrl('mainnet-beta'),
      // Add custom mainnet RPC endpoints here for better performance
      // 'https://api.mainnet-beta.solana.com',
      // 'https://solana-api.projectserum.com'
    ],
    'devnet': [
      clusterApiUrl('devnet'),
      // Add custom devnet RPC endpoints here
    ],
    'testnet': [
      clusterApiUrl('testnet')
    ]
  },
  
  // Connection settings
  COMMITMENT: 'confirmed',
  TIMEOUT: 30000, // 30 seconds
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Health check settings
  HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
  CONNECTION_POOL_SIZE: 3
};

/**
 * MLG Token Configuration
 */
export const MLG_TOKEN_CONFIG = {
  // Real MLG SPL Token on Solana Mainnet
  MINT_ADDRESS: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL',
  SYMBOL: 'MLG',
  NAME: 'MLG Gaming Token',
  DECIMALS: 9,
  
  // Token validation settings
  VALIDATION: {
    REQUIRE_METADATA: true,
    CHECK_MINT_AUTHORITY: false,
    VERIFY_SUPPLY: false
  }
};

/**
 * Wallet Configuration
 */
export const WALLET_CONFIG = {
  // Session settings
  SESSION_TIMEOUT: 2 * 60 * 60 * 1000, // 2 hours
  AUTO_RECONNECT: true,
  
  // Connection settings  
  CONNECTION_TIMEOUT: 30000, // 30 seconds
  MAX_RECONNECTION_ATTEMPTS: 3,
  
  // Security settings
  REQUIRE_CONFIRMATION: true,
  TRANSACTION_TIMEOUT: 60000 // 60 seconds
};

/**
 * Token Program Addresses
 */
export const TOKEN_PROGRAMS = {
  TOKEN_PROGRAM_ID: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  ASSOCIATED_TOKEN_PROGRAM_ID: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  TOKEN_2022_PROGRAM_ID: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
};

/**
 * Current network getter
 */
export const CURRENT_NETWORK = NETWORK_CONFIG.CURRENT;

/**
 * Create a connection to the current network
 */
export function createConnection(network = CURRENT_NETWORK, options = {}) {
  const networkConfig = NETWORK_CONFIG.NETWORKS[network];
  if (!networkConfig) {
    throw new Error(`Unknown network: ${network}`);
  }
  
  const rpcEndpoints = CONNECTION_CONFIG.RPC_ENDPOINTS[network] || [networkConfig.rpcEndpoint];
  const primaryEndpoint = rpcEndpoints[0];
  
  return new Connection(primaryEndpoint, {
    commitment: options.commitment || CONNECTION_CONFIG.COMMITMENT,
    wsEndpoint: options.wsEndpoint,
    httpHeaders: options.httpHeaders,
    ...options
  });
}

/**
 * Create a connection specifically optimized for MLG token operations
 */
export function createMLGTokenConnection(options = {}) {
  return createConnection(CURRENT_NETWORK, {
    commitment: 'confirmed', // Use confirmed for token operations
    ...options
  });
}

/**
 * Get explorer URL for a transaction or address
 */
export function getExplorerUrl(signature, type = 'tx', network = CURRENT_NETWORK) {
  const networkConfig = NETWORK_CONFIG.NETWORKS[network];
  if (!networkConfig) {
    throw new Error(`Unknown network: ${network}`);
  }
  
  const baseUrl = networkConfig.explorerUrl;
  const clusterParam = network !== 'mainnet-beta' ? `?cluster=${network}` : '';
  
  switch (type) {
    case 'tx':
    case 'transaction':
      return `${baseUrl}/tx/${signature}${clusterParam}`;
    case 'address':
    case 'account':
      return `${baseUrl}/address/${signature}${clusterParam}`;
    case 'token':
      return `${baseUrl}/address/${signature}${clusterParam}`;
    default:
      return `${baseUrl}/${type}/${signature}${clusterParam}`;
  }
}

/**
 * Validate network configuration
 */
export function validateNetworkConfig() {
  const requiredNetworks = ['mainnet-beta', 'devnet', 'testnet'];
  const errors = [];
  
  requiredNetworks.forEach(network => {
    if (!NETWORK_CONFIG.NETWORKS[network]) {
      errors.push(`Missing network configuration for: ${network}`);
    }
  });
  
  if (!NETWORK_CONFIG.NETWORKS[CURRENT_NETWORK]) {
    errors.push(`Current network '${CURRENT_NETWORK}' is not configured`);
  }
  
  if (errors.length > 0) {
    throw new Error(`Network configuration errors: ${errors.join(', ')}`);
  }
  
  return true;
}

/**
 * Get current network info
 */
export function getCurrentNetworkInfo() {
  return NETWORK_CONFIG.NETWORKS[CURRENT_NETWORK];
}

/**
 * Check if we're on mainnet
 */
export function isMainnet() {
  return CURRENT_NETWORK === 'mainnet-beta';
}

/**
 * Check if we're on devnet
 */
export function isDevnet() {
  return CURRENT_NETWORK === 'devnet';
}

// Validate configuration on import
try {
  validateNetworkConfig();
} catch (error) {
  console.error('Solana configuration validation failed:', error);
}