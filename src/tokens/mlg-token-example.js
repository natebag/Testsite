/**
 * MLG Token Usage Examples
 * 
 * This file demonstrates how to use the MLG Token Management System
 * for common operations like checking balances, burning tokens for votes,
 * and managing token accounts.
 */

import { mlgTokenManager, MLGTokenUtils } from './spl-mlg-token.js';
import { getMLGTokenNetworkConfig } from '../../config/solana-config.js';

/**
 * Example: Initialize MLG Token Manager
 */
export async function initializeMLGToken() {
  try {
    console.log('Initializing MLG Token Manager...');
    
    // Option 1: Initialize with known mint address
    // const mintAddress = 'YourActualMLGTokenMintAddressHere';
    // const success = await mlgTokenManager.initialize(mintAddress);
    
    // Option 2: Discover MLG token automatically
    console.log('Searching for MLG token...');
    const discoveredMint = await mlgTokenManager.discoverMLGToken();
    
    if (discoveredMint) {
      console.log('Found MLG token:', discoveredMint);
      const success = await mlgTokenManager.initialize(discoveredMint);
      
      if (success) {
        console.log('✅ MLG Token Manager initialized successfully');
        console.log('Token Info:', mlgTokenManager.getTokenInfo());
        return true;
      }
    } else {
      console.log('⚠️ MLG token not found. Using placeholder configuration.');
      console.log('Please provide the actual MLG token mint address.');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Failed to initialize MLG Token Manager:', error);
    return false;
  }
}

/**
 * Example: Check user's MLG token balance
 */
export async function checkUserBalance(walletAddress) {
  try {
    console.log('Checking MLG token balance for:', walletAddress);
    
    const balance = await mlgTokenManager.getTokenBalance(walletAddress);
    
    console.log('Balance Info:', {
      'Formatted Balance': MLGTokenUtils.formatTokenAmount(balance.balance),
      'Raw Balance': balance.raw,
      'Has Account': balance.hasAccount,
      'Token Account': balance.associatedTokenAddress
    });
    
    return balance;
    
  } catch (error) {
    console.error('❌ Failed to check balance:', error);
    throw error;
  }
}

/**
 * Example: Create token account for new user
 */
export async function setupUserTokenAccount(walletAddress, wallet) {
  try {
    console.log('Setting up token account for:', walletAddress);
    
    // Check if account exists
    const balance = await mlgTokenManager.getTokenBalance(walletAddress);
    
    if (balance.hasAccount) {
      console.log('✅ Token account already exists');
      return balance.associatedTokenAddress;
    }
    
    // Create associated token account
    console.log('Creating associated token account...');
    const signature = await mlgTokenManager.createAssociatedTokenAccount(
      walletAddress, 
      wallet
    );
    
    if (signature) {
      console.log('✅ Token account created successfully');
      console.log('Transaction signature:', signature);
      return signature;
    } else {
      console.log('ℹ️ Account already existed, no action needed');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Failed to setup token account:', error);
    throw error;
  }
}

/**
 * Example: Purchase additional votes by burning tokens
 */
export async function purchaseAdditionalVotes(walletAddress, wallet, numberOfVotes) {
  try {
    console.log(`Purchasing ${numberOfVotes} additional votes...`);
    
    // Validate vote count (max 4 additional votes per day)
    if (numberOfVotes < 1 || numberOfVotes > 4) {
      throw new Error('Can only purchase 1-4 additional votes per day');
    }
    
    // Calculate cost
    const cost = MLGTokenUtils.calculateVoteCost(numberOfVotes);
    console.log(`Cost: ${cost} MLG tokens`);
    
    // Check balance
    const balance = await mlgTokenManager.getTokenBalance(walletAddress);
    if (balance.balance < cost) {
      throw new Error(`Insufficient balance. Need ${cost} MLG, have ${balance.balance} MLG`);
    }
    
    // Estimate transaction cost
    const txCost = await mlgTokenManager.estimateTransactionCost('burn');
    console.log(`Transaction cost: ${txCost.sol} SOL (${txCost.lamports} lamports)`);
    
    // Confirm with user (in real implementation)
    console.log('⚠️ This will burn tokens permanently. Confirm transaction?');
    
    // Burn tokens
    const result = await mlgTokenManager.burnTokens(walletAddress, wallet, cost);
    
    console.log('✅ Tokens burned successfully!');
    console.log('Transaction Details:', {
      'Signature': result.signature,
      'Burned Amount': `${result.burnedAmount} MLG`,
      'Additional Votes': numberOfVotes,
      'Timestamp': new Date(result.timestamp).toISOString()
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Failed to purchase votes:', error);
    throw error;
  }
}

/**
 * Example: Display token information and network config
 */
export function displayMLGTokenInfo() {
  console.log('=== MLG Token Configuration ===');
  
  const networkConfig = getMLGTokenNetworkConfig();
  console.log('Network:', networkConfig.network);
  console.log('RPC Endpoints:', networkConfig.endpoints);
  console.log('Mint Address:', networkConfig.mintAddress);
  
  const tokenInfo = mlgTokenManager.getTokenInfo();
  if (tokenInfo) {
    console.log('Token Details:', tokenInfo);
  } else {
    console.log('Token not initialized');
  }
  
  console.log('Vote Costs:');
  for (let i = 1; i <= 4; i++) {
    const cost = MLGTokenUtils.calculateVoteCost(i);
    console.log(`  ${i} vote(s): ${cost} MLG`);
  }
}

/**
 * Example: Monitor connection health
 */
export async function monitorConnectionHealth() {
  try {
    console.log('Checking connection health...');
    
    const isHealthy = await mlgTokenManager.isConnectionHealthy();
    
    if (isHealthy) {
      console.log('✅ Connection is healthy');
    } else {
      console.log('❌ Connection issues detected');
    }
    
    return isHealthy;
    
  } catch (error) {
    console.error('Connection health check failed:', error);
    return false;
  }
}

/**
 * Example: Complete workflow for new user
 */
export async function completeUserOnboarding(walletAddress, wallet) {
  try {
    console.log('=== MLG Token User Onboarding ===');
    
    // 1. Initialize token manager
    const initialized = await initializeMLGToken();
    if (!initialized) {
      throw new Error('Token manager initialization failed');
    }
    
    // 2. Setup user's token account
    await setupUserTokenAccount(walletAddress, wallet);
    
    // 3. Check initial balance
    const balance = await checkUserBalance(walletAddress);
    
    // 4. Display information
    displayMLGTokenInfo();
    
    // 5. Health check
    await monitorConnectionHealth();
    
    console.log('✅ User onboarding completed successfully');
    
    return {
      initialized: true,
      balance,
      hasAccount: balance.hasAccount
    };
    
  } catch (error) {
    console.error('❌ User onboarding failed:', error);
    return {
      initialized: false,
      error: error.message
    };
  }
}

/**
 * Example: Voting workflow with token burn
 */
export async function executeVotingWorkflow(walletAddress, wallet, votingData) {
  try {
    console.log('=== MLG Token Voting Workflow ===');
    
    const { contentId, useAdditionalVotes, additionalVoteCount } = votingData;
    
    // 1. Process free daily vote (this would be handled by voting system)
    console.log(`Casting free vote on content: ${contentId}`);
    
    // 2. Handle additional votes if requested
    if (useAdditionalVotes && additionalVoteCount > 0) {
      console.log(`User wants ${additionalVoteCount} additional votes`);
      
      const burnResult = await purchaseAdditionalVotes(
        walletAddress, 
        wallet, 
        additionalVoteCount
      );
      
      console.log('Additional votes purchased successfully');
      return {
        freeVote: true,
        additionalVotes: additionalVoteCount,
        burnTransaction: burnResult.signature,
        totalVotes: 1 + additionalVoteCount
      };
    }
    
    return {
      freeVote: true,
      additionalVotes: 0,
      totalVotes: 1
    };
    
  } catch (error) {
    console.error('❌ Voting workflow failed:', error);
    throw error;
  }
}

// Export for demo/testing purposes
export const MLGTokenExamples = {
  initializeMLGToken,
  checkUserBalance,
  setupUserTokenAccount,
  purchaseAdditionalVotes,
  displayMLGTokenInfo,
  monitorConnectionHealth,
  completeUserOnboarding,
  executeVotingWorkflow
};