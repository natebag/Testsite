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

// Current network (switch to mainnet for production)
export const CURRENT_NETWORK = SOLANA_NETWORKS.DEVNET;

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

// SPL Token Program Addresses (to be updated with actual MLG token)
export const TOKEN_PROGRAMS = {
  MLG_TOKEN_MINT: 'MLGtokenMintAddressToBeDeployedLater', // Placeholder
  ASSOCIATED_TOKEN_PROGRAM: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  TOKEN_PROGRAM: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
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