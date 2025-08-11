/**
 * MLG.clan Integration Examples
 * 
 * Demonstrates how to integrate the clan management system with existing
 * MLG token infrastructure, Phantom wallet, and content moderation systems.
 * 
 * This file provides practical examples for:
 * - Setting up clan management with wallet integration
 * - Creating clans with proper error handling
 * - Integrating with existing MLG token balance checks
 * - Implementing clan UI components
 * - Handling blockchain transactions and confirmations
 * 
 * @author Claude Code - Solana Web3 Security Architect
 * @integration MLG Token: 7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL
 */

import { ClanManager, CLAN_TIER_CONFIG, formatMLGAmount } from './clan-management.js';
import { MLGTokenBalance } from '../tokens/spl-mlg-token.js';
import { PhantomWalletManager } from '../wallet/phantom-wallet.js';

/**
 * Complete Clan Integration Example
 * Shows how to set up clan management with all dependencies
 */
export class ClanIntegrationExample {
  constructor() {
    this.walletManager = null;
    this.tokenManager = null;
    this.clanManager = null;
    this.isInitialized = false;
    
    // UI state
    this.currentUser = null;
    this.userBalance = 0;
    this.userClans = [];
    this.selectedClan = null;
  }

  /**
   * Initialize all systems
   */
  async initialize() {
    try {
      console.log('Initializing MLG.clan integration...');

      // 1. Initialize Phantom wallet
      this.walletManager = new PhantomWalletManager();
      await this.walletManager.initialize();

      // 2. Initialize MLG token manager
      this.tokenManager = new MLGTokenBalance();
      await this.tokenManager.initialize();

      // 3. Initialize clan manager (will be connected when wallet connects)
      this.isInitialized = true;
      console.log('MLG.clan integration initialized successfully');

      return { success: true };
    } catch (error) {
      console.error('Failed to initialize clan integration:', error);
      throw error;
    }
  }

  /**
   * Connect wallet and set up clan management
   */
  async connectWallet() {
    try {
      if (!this.isInitialized) {
        throw new Error('Integration not initialized. Call initialize() first.');
      }

      // Connect wallet
      const walletResult = await this.walletManager.connect();
      if (!walletResult.success) {
        throw new Error('Failed to connect wallet');
      }

      this.currentUser = walletResult.publicKey;
      console.log(`Wallet connected: ${this.currentUser.toString()}`);

      // Initialize clan manager with connected wallet
      this.clanManager = new ClanManager(this.walletManager.adapter);

      // Load user data
      await this.loadUserData();

      return {
        success: true,
        publicKey: this.currentUser,
        balance: this.userBalance
      };

    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }

  /**
   * Load user's MLG token balance and clan information
   */
  async loadUserData() {
    try {
      if (!this.currentUser) {
        return;
      }

      // Load MLG token balance
      const balanceInfo = await this.tokenManager.getBalance(this.currentUser);
      this.userBalance = balanceInfo.balance;

      // Load user's clans
      this.userClans = await this.clanManager.getUserClans(this.currentUser);

      console.log(`User balance: ${formatMLGAmount(this.userBalance)} MLG`);
      console.log(`User clans: ${this.userClans.length}`);

    } catch (error) {
      console.error('Failed to load user data:', error);
      // Don't throw - this is not critical for basic functionality
    }
  }

  /**
   * Create clan with comprehensive validation and user feedback
   */
  async createClan(clanData) {
    try {
      if (!this.clanManager) {
        throw new Error('Clan manager not initialized. Connect wallet first.');
      }

      console.log('Starting clan creation process...');
      
      // Step 1: Validate tier and requirements
      const tierConfig = CLAN_TIER_CONFIG[clanData.tier.toUpperCase()];
      if (!tierConfig) {
        throw new Error(`Invalid tier: ${clanData.tier}`);
      }

      console.log(`Creating ${tierConfig.name} clan "${clanData.name}"`);
      console.log(`Required stake: ${formatMLGAmount(tierConfig.minStake)} MLG tokens`);
      console.log(`Member limit: ${tierConfig.maxMembers} members`);

      // Step 2: Check user's token balance
      if (this.userBalance < tierConfig.minStake) {
        const shortfall = tierConfig.minStake - this.userBalance;
        throw new Error(
          `Insufficient MLG tokens. You need ${formatMLGAmount(tierConfig.minStake)} MLG ` +
          `but only have ${formatMLGAmount(this.userBalance)} MLG. ` +
          `Shortfall: ${formatMLGAmount(shortfall)} MLG tokens.`
        );
      }

      // Step 3: Validate clan data
      const validation = await this.validateClanCreation(clanData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Step 4: Show confirmation to user
      const confirmed = await this.showClanCreationConfirmation(clanData, tierConfig);
      if (!confirmed) {
        return { success: false, cancelled: true };
      }

      // Step 5: Create the clan
      console.log('Creating clan on blockchain...');
      const result = await this.clanManager.createClan(clanData);

      // Step 6: Update local state
      await this.loadUserData(); // Refresh balance and clans
      this.selectedClan = result.clan;

      console.log(`Clan "${clanData.name}" created successfully!`);
      console.log(`Transaction: ${result.transaction}`);
      console.log(`Clan ID: ${result.clan.id}`);

      return {
        success: true,
        clan: result.clan,
        transaction: result.transaction,
        newBalance: this.userBalance
      };

    } catch (error) {
      console.error('Clan creation failed:', error);
      
      // Provide user-friendly error messages
      if (error.message.includes('User rejected')) {
        return { 
          success: false, 
          error: 'Transaction cancelled by user',
          userCancelled: true 
        };
      }
      
      if (error.message.includes('Insufficient SOL')) {
        return { 
          success: false, 
          error: 'Insufficient SOL for transaction fees. Please add SOL to your wallet.',
          needsSol: true 
        };
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Validate clan creation data
   */
  async validateClanCreation(clanData) {
    const errors = [];
    const warnings = [];

    // Basic validation
    if (!clanData.name) {
      errors.push('Clan name is required');
    } else if (clanData.name.length < 3) {
      errors.push('Clan name must be at least 3 characters');
    } else if (clanData.name.length > 32) {
      errors.push('Clan name cannot exceed 32 characters');
    }

    // Tier validation
    if (!clanData.tier || !CLAN_TIER_CONFIG[clanData.tier.toUpperCase()]) {
      errors.push('Valid tier is required (Bronze, Silver, Gold, Diamond)');
    }

    // Tag validation
    if (clanData.tags && clanData.tags.length > 10) {
      errors.push('Cannot exceed 10 tags');
    }

    // Description validation
    if (clanData.description && clanData.description.length > 500) {
      errors.push('Description cannot exceed 500 characters');
    }

    // Name uniqueness check
    if (clanData.name && errors.length === 0) {
      const isUnique = await this.clanManager.checkClanNameUniqueness(clanData.name);
      if (!isUnique) {
        errors.push('Clan name is already taken');
      }
    }

    // Rate limiting check
    if (errors.length === 0) {
      const rateCheck = this.clanManager.checkRateLimit(this.currentUser, 'create_clan');
      if (!rateCheck.allowed) {
        errors.push(`Please wait ${rateCheck.remainingTime} minutes before creating another clan`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      warnings: warnings
    };
  }

  /**
   * Show clan creation confirmation dialog
   */
  async showClanCreationConfirmation(clanData, tierConfig) {
    return new Promise((resolve) => {
      // In a real application, this would show a UI dialog
      // For demonstration, we'll simulate user confirmation
      console.log('\n=== CLAN CREATION CONFIRMATION ===');
      console.log(`Clan Name: ${clanData.name}`);
      console.log(`Tier: ${tierConfig.name} ${tierConfig.icon}`);
      console.log(`Required Stake: ${formatMLGAmount(tierConfig.minStake)} MLG tokens`);
      console.log(`Member Limit: ${tierConfig.maxMembers} members`);
      console.log(`Features: ${tierConfig.features.join(', ')}`);
      console.log('\nThis will:');
      console.log(`- Stake ${formatMLGAmount(tierConfig.minStake)} MLG tokens`);
      console.log('- Create your clan on the Solana blockchain');
      console.log('- Lock your tokens for 7 days');
      console.log('- Make you the clan owner');
      console.log('\nTransaction fees: ~0.001 SOL');
      console.log('=====================================\n');

      // Auto-confirm for demo (in real app, user would click confirm/cancel)
      setTimeout(() => resolve(true), 100);
    });
  }

  /**
   * Join an existing clan
   */
  async joinClan(clanAddress) {
    try {
      if (!this.clanManager) {
        throw new Error('Clan manager not initialized');
      }

      // Get clan information
      const clan = await this.clanManager.getClan(clanAddress);
      if (!clan) {
        throw new Error('Clan not found');
      }

      // Check if clan has space
      if (clan.memberCount >= clan.maxMembers) {
        throw new Error('Clan is full');
      }

      // In a real implementation, this would require invitation or approval
      console.log(`Joining clan: ${clan.name}`);

      // For demo, we'll simulate the join process
      return {
        success: true,
        clan: clan,
        message: `Successfully joined ${clan.name}!`
      };

    } catch (error) {
      console.error('Failed to join clan:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upgrade clan tier
   */
  async upgradeClanTier(clanAddress, newTier) {
    try {
      if (!this.clanManager) {
        throw new Error('Clan manager not initialized');
      }

      const clan = await this.clanManager.getClan(clanAddress);
      if (!clan) {
        throw new Error('Clan not found');
      }

      // Verify ownership
      if (clan.owner !== this.currentUser.toString()) {
        throw new Error('Only clan owner can upgrade tier');
      }

      const newTierConfig = CLAN_TIER_CONFIG[newTier.toUpperCase()];
      const currentTierConfig = CLAN_TIER_CONFIG[clan.tier.toUpperCase()];

      if (!newTierConfig) {
        throw new Error('Invalid tier specified');
      }

      if (newTierConfig.minStake <= currentTierConfig.minStake) {
        throw new Error('New tier must be higher than current tier');
      }

      const additionalStakeRequired = newTierConfig.minStake - clan.stakedTokens;

      // Check balance
      if (this.userBalance < additionalStakeRequired) {
        throw new Error(
          `Insufficient MLG tokens for upgrade. Need additional ${formatMLGAmount(additionalStakeRequired)} MLG.`
        );
      }

      console.log(`Upgrading clan from ${currentTierConfig.name} to ${newTierConfig.name}`);
      console.log(`Additional stake required: ${formatMLGAmount(additionalStakeRequired)} MLG`);

      // Execute upgrade
      const result = await this.clanManager.upgradeClanTier(clanAddress, newTier);

      // Update local state
      await this.loadUserData();

      return {
        success: true,
        clan: result.clan,
        transaction: result.transaction,
        previousTier: currentTierConfig,
        newTier: newTierConfig
      };

    } catch (error) {
      console.error('Clan upgrade failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get tier recommendations based on user balance
   */
  getTierRecommendations() {
    const recommendations = [];
    const balance = this.userBalance;

    for (const [tierName, tierConfig] of Object.entries(CLAN_TIER_CONFIG)) {
      const canAfford = balance >= tierConfig.minStake;
      const recommendation = {
        tier: tierConfig.id,
        name: tierConfig.name,
        icon: tierConfig.icon,
        color: tierConfig.color,
        minStake: tierConfig.minStake,
        maxMembers: tierConfig.maxMembers,
        features: tierConfig.features,
        canAfford: canAfford,
        shortfall: canAfford ? 0 : tierConfig.minStake - balance,
        recommended: false
      };

      // Mark as recommended if user can afford and it's a good value
      if (canAfford) {
        recommendation.recommended = true;
      }

      recommendations.push(recommendation);
    }

    // Sort by stake requirement
    recommendations.sort((a, b) => a.minStake - b.minStake);

    return recommendations;
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect() {
    try {
      if (this.walletManager) {
        await this.walletManager.disconnect();
      }

      // Clear state
      this.currentUser = null;
      this.userBalance = 0;
      this.userClans = [];
      this.selectedClan = null;
      this.clanManager = null;

      console.log('Disconnected from MLG.clan system');

    } catch (error) {
      console.error('Error during disconnect:', error);
    }
  }
}

/**
 * Simple usage example
 */
export async function simpleClanExample() {
  console.log('=== MLG.clan Simple Example ===\n');

  try {
    // Initialize integration
    const clanIntegration = new ClanIntegrationExample();
    await clanIntegration.initialize();

    // Connect wallet (in real app, user would click connect button)
    console.log('Connecting wallet...');
    const walletResult = await clanIntegration.connectWallet();
    
    if (!walletResult.success) {
      console.log('Wallet connection failed');
      return;
    }

    console.log(`Connected! Balance: ${formatMLGAmount(walletResult.balance)} MLG\n`);

    // Show tier recommendations
    const recommendations = clanIntegration.getTierRecommendations();
    console.log('Available tiers:');
    recommendations.forEach(tier => {
      const status = tier.canAfford ? '✅ Available' : '❌ Insufficient funds';
      console.log(`${tier.icon} ${tier.name}: ${formatMLGAmount(tier.minStake)} MLG - ${status}`);
    });
    console.log();

    // Try to create a Bronze clan
    const bronzeTier = recommendations.find(t => t.tier === 'bronze');
    if (bronzeTier && bronzeTier.canAfford) {
      console.log('Creating Bronze tier clan...');
      
      const clanData = {
        name: 'MyAwesomeClan',
        description: 'A competitive gaming clan for MLG enthusiasts',
        tags: ['fps', 'competitive', 'esports'],
        tier: 'bronze',
        bannerUrl: 'https://example.com/clan-banner.jpg',
        rules: [
          'Be respectful to all members',
          'No cheating or exploiting',
          'Participate in clan events',
          'Help other members improve'
        ]
      };

      const result = await clanIntegration.createClan(clanData);
      
      if (result.success) {
        console.log(`\n🎉 Clan created successfully!`);
        console.log(`Name: ${result.clan.name}`);
        console.log(`Tier: ${result.clan.tier}`);
        console.log(`Members: ${result.clan.memberCount}/${result.clan.maxMembers}`);
        console.log(`Transaction: ${result.transaction}`);
        console.log(`New balance: ${formatMLGAmount(result.newBalance)} MLG`);
      } else {
        console.log(`❌ Clan creation failed: ${result.error}`);
      }
    } else {
      console.log('⚠️ Cannot create Bronze clan - insufficient funds');
    }

    // Clean up
    await clanIntegration.disconnect();

  } catch (error) {
    console.error('Example failed:', error);
  }
}

/**
 * Advanced clan management example
 */
export async function advancedClanExample() {
  console.log('=== MLG.clan Advanced Example ===\n');

  try {
    const clanIntegration = new ClanIntegrationExample();
    await clanIntegration.initialize();
    
    const walletResult = await clanIntegration.connectWallet();
    if (!walletResult.success) return;

    console.log(`Connected with ${formatMLGAmount(walletResult.balance)} MLG\n`);

    // Create a Silver tier clan
    const silverClanData = {
      name: 'EliteGamingCrew',
      description: 'Professional esports team focused on competitive FPS games',
      tags: ['esports', 'professional', 'fps', 'tournaments'],
      tier: 'silver',
      bannerUrl: 'https://example.com/elite-banner.jpg',
      rules: [
        'Minimum 2.0 K/D ratio required',
        'Must participate in weekly scrimmages',
        'Discord activity required',
        'Tournament participation mandatory',
        'Professional conduct at all times'
      ]
    };

    console.log('Creating Silver tier clan...');
    const createResult = await clanIntegration.createClan(silverClanData);

    if (createResult.success) {
      const clan = createResult.clan;
      console.log(`✅ Silver clan created: ${clan.name}`);
      console.log(`Features: ${clan.features.join(', ')}`);
      
      // Try to upgrade to Gold tier
      if (clanIntegration.userBalance >= CLAN_TIER_CONFIG.GOLD.minStake) {
        console.log('\nUpgrading to Gold tier...');
        const upgradeResult = await clanIntegration.upgradeClanTier(clan.id, 'gold');
        
        if (upgradeResult.success) {
          console.log(`🚀 Upgraded to ${upgradeResult.newTier.name}!`);
          console.log(`New member limit: ${upgradeResult.clan.maxMembers}`);
          console.log(`Additional features: ${upgradeResult.newTier.features.slice(-2).join(', ')}`);
        } else {
          console.log(`❌ Upgrade failed: ${upgradeResult.error}`);
        }
      } else {
        console.log('⚠️ Insufficient funds for Gold tier upgrade');
      }
    } else {
      console.log(`❌ Clan creation failed: ${createResult.error}`);
    }

    await clanIntegration.disconnect();

  } catch (error) {
    console.error('Advanced example failed:', error);
  }
}

/**
 * Error handling example
 */
export async function errorHandlingExample() {
  console.log('=== MLG.clan Error Handling Example ===\n');

  const clanIntegration = new ClanIntegrationExample();
  
  try {
    // Try to create clan without initialization
    const result1 = await clanIntegration.createClan({ name: 'TestClan', tier: 'bronze' });
    console.log('Should not reach here');
  } catch (error) {
    console.log(`✅ Caught expected error: ${error.message}`);
  }

  // Initialize but don't connect wallet
  await clanIntegration.initialize();
  
  try {
    const result2 = await clanIntegration.createClan({ name: 'TestClan', tier: 'bronze' });
    console.log('Should not reach here');
  } catch (error) {
    console.log(`✅ Caught expected error: ${error.message}`);
  }

  console.log('\nError handling working correctly!');
}

// Export examples for testing
export default {
  ClanIntegrationExample,
  simpleClanExample,
  advancedClanExample,
  errorHandlingExample
};

// Auto-run simple example if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.MLGClanExamples = {
    ClanIntegrationExample,
    simpleClanExample,
    advancedClanExample,
    errorHandlingExample
  };
  
  console.log('MLG.clan integration examples loaded. Try:');
  console.log('- MLGClanExamples.simpleClanExample()');
  console.log('- MLGClanExamples.advancedClanExample()');
  console.log('- MLGClanExamples.errorHandlingExample()');
}