/**
 * MLG.clan System Demonstration
 * 
 * This file demonstrates the functionality of the clan management system
 * with simulated wallet and blockchain interactions for testing purposes.
 * 
 * @author Claude Code - Solana Web3 Security Architect
 */

import { 
  ClanManager, 
  CLAN_TIER_CONFIG, 
  CLAN_ROLES,
  CLAN_CONFIG,
  formatMLGAmount,
  validateClanData 
} from './clan-management.js';

/**
 * Mock Phantom Wallet Adapter for demonstration
 */
class MockWalletAdapter {
  constructor() {
    this.publicKey = {
      toString: () => 'DemoUser12345678901234567890123456789012'
    };
    this.connected = true;
  }

  async signTransaction(transaction) {
    console.log('📝 Signing transaction (simulated)');
    return {
      ...transaction,
      serialize: () => Buffer.alloc(0)
    };
  }
}

/**
 * Demo Functions
 */

/**
 * Demonstrate clan tier system
 */
export function demonstrateTierSystem() {
  console.log('\n=== 🏆 MLG.clan Tier System Demo ===\n');
  
  // Show all available tiers
  Object.entries(CLAN_TIER_CONFIG).forEach(([tierKey, tier]) => {
    console.log(`${tier.icon} ${tier.name}`);
    console.log(`  • Required Stake: ${formatMLGAmount(tier.minStake)} MLG tokens`);
    console.log(`  • Max Members: ${tier.maxMembers}`);
    console.log(`  • Features: ${tier.features.join(', ')}`);
    console.log(`  • Color: ${tier.color}`);
    console.log('');
  });

  // Test tier selection logic
  const testBalances = [50, 100, 500, 1000, 5000, 10000];
  console.log('Tier Selection Examples:');
  
  const mockManager = new ClanManager();
  testBalances.forEach(balance => {
    const tier = mockManager.getClanTier(balance);
    const tierName = tier ? tier.name : 'Insufficient stake';
    console.log(`  ${formatMLGAmount(balance)} MLG → ${tierName}`);
  });

  console.log('\n=== End Tier System Demo ===\n');
}

/**
 * Demonstrate role hierarchy system
 */
export function demonstrateRoleSystem() {
  console.log('\n=== 👥 MLG.clan Role System Demo ===\n');
  
  Object.entries(CLAN_ROLES).forEach(([roleKey, role]) => {
    console.log(`🎯 ${role.name} (Priority: ${role.priority})`);
    console.log(`  • Permissions: ${role.permissions.join(', ')}`);
    console.log(`  • Max Count: ${role.maxCount === -1 ? 'Unlimited' : role.maxCount}`);
    console.log('');
  });

  console.log('Role hierarchy (highest to lowest priority):');
  const sortedRoles = Object.values(CLAN_ROLES).sort((a, b) => b.priority - a.priority);
  sortedRoles.forEach((role, index) => {
    console.log(`  ${index + 1}. ${role.name}`);
  });

  console.log('\n=== End Role System Demo ===\n');
}

/**
 * Demonstrate configuration system
 */
export function demonstrateConfiguration() {
  console.log('\n=== ⚙️ MLG.clan Configuration Demo ===\n');
  
  console.log('Clan Name Rules:');
  console.log(`  • Minimum length: ${CLAN_CONFIG.NAME_MIN_LENGTH} characters`);
  console.log(`  • Maximum length: ${CLAN_CONFIG.NAME_MAX_LENGTH} characters`);
  console.log(`  • Allowed pattern: ${CLAN_CONFIG.NAME_REGEX.toString()}`);
  console.log('');
  
  console.log('Content Limits:');
  console.log(`  • Description max: ${CLAN_CONFIG.DESCRIPTION_MAX_LENGTH} characters`);
  console.log(`  • Maximum tags: ${CLAN_CONFIG.MAX_TAGS}`);
  console.log(`  • Tag max length: ${CLAN_CONFIG.TAG_MAX_LENGTH} characters`);
  console.log('');
  
  console.log('Staking Rules:');
  console.log(`  • Lock period: ${CLAN_CONFIG.STAKE_LOCK_PERIOD / (24 * 60 * 60 * 1000)} days`);
  console.log(`  • Unstake cooldown: ${CLAN_CONFIG.UNSTAKE_COOLDOWN / (60 * 60 * 1000)} hours`);
  console.log('');
  
  console.log('Rate Limiting:');
  console.log(`  • Creation cooldown: ${CLAN_CONFIG.CREATION_COOLDOWN / (60 * 60 * 1000)} hour(s)`);
  console.log(`  • Max clans per user: ${CLAN_CONFIG.MAX_CLANS_PER_USER}`);
  console.log('');
  
  console.log('Security Features:');
  console.log(`  • Profanity check: ${CLAN_CONFIG.PROFANITY_CHECK ? 'Enabled' : 'Disabled'}`);
  console.log(`  • Content validation: ${CLAN_CONFIG.CONTENT_VALIDATION ? 'Enabled' : 'Disabled'}`);

  console.log('\n=== End Configuration Demo ===\n');
}

/**
 * Demonstrate clan validation
 */
export function demonstrateValidation() {
  console.log('\n=== ✅ MLG.clan Validation Demo ===\n');
  
  const testCases = [
    {
      name: 'Valid clan',
      data: {
        name: 'EliteGamingCrew',
        tier: 'silver',
        tags: ['esports', 'fps', 'competitive'],
        rules: ['Be respectful', 'No cheating']
      }
    },
    {
      name: 'Missing name',
      data: {
        tier: 'bronze'
      }
    },
    {
      name: 'Invalid tier',
      data: {
        name: 'TestClan',
        tier: 'platinum'
      }
    },
    {
      name: 'Invalid tags type',
      data: {
        name: 'TestClan',
        tier: 'bronze',
        tags: 'should be array'
      }
    }
  ];

  testCases.forEach(testCase => {
    console.log(`🧪 Testing: ${testCase.name}`);
    const result = validateClanData(testCase.data);
    console.log(`  Result: ${result.isValid ? '✅ Valid' : '❌ Invalid'}`);
    if (!result.isValid) {
      result.errors.forEach(error => {
        console.log(`    • ${error}`);
      });
    }
    console.log('');
  });

  console.log('\n=== End Validation Demo ===\n');
}

/**
 * Demonstrate utility functions
 */
export function demonstrateUtilities() {
  console.log('\n=== 🛠️ MLG.clan Utilities Demo ===\n');
  
  console.log('Token Amount Formatting:');
  const amounts = [100, 1234.56, 1000000, 0.123456789];
  amounts.forEach(amount => {
    console.log(`  ${amount} → ${formatMLGAmount(amount)} MLG`);
  });
  console.log('');
  
  console.log('Token Amount Formatting (custom decimals):');
  const amount = 1234.56789;
  [0, 1, 2, 3, 4].forEach(decimals => {
    console.log(`  ${amount} (${decimals} decimals) → ${formatMLGAmount(amount, decimals)} MLG`);
  });

  console.log('\n=== End Utilities Demo ===\n');
}

/**
 * Simulate clan creation process
 */
export async function simulateClanCreation() {
  console.log('\n=== 🏗️ MLG.clan Creation Simulation ===\n');
  
  try {
    // Initialize with mock wallet
    const mockWallet = new MockWalletAdapter();
    console.log(`🔗 Connected wallet: ${mockWallet.publicKey.toString()}`);
    
    // Mock clan manager that doesn't actually hit blockchain
    const clanManager = new ClanManager(mockWallet);
    
    // Override methods to avoid actual blockchain calls
    clanManager.validateTokenRequirements = async () => ({
      hasEnoughTokens: true,
      currentBalance: 1500,
      requiredStake: 500,
      shortfall: 0
    });
    
    clanManager.checkClanNameUniqueness = async () => true;
    clanManager.generateClanPDA = async (name, owner) => ({
      address: { toString: () => `clan_pda_${name.toLowerCase()}_${Math.random().toString(36).substr(2, 9)}` },
      bump: 254,
      seeds: [Buffer.from('mlg_clan'), Buffer.from(name.toLowerCase())]
    });
    
    clanManager.createStakeTransaction = async () => ({
      add: () => {},
      recentBlockhash: null,
      feePayer: null
    });
    
    // Override connection methods
    clanManager.connection = {
      getLatestBlockhash: async () => ({ blockhash: 'mock-blockhash' }),
      sendRawTransaction: async () => 'mock-signature-' + Math.random().toString(36).substr(2, 9),
      confirmTransaction: async () => ({ value: { err: null } })
    };

    // Test clan data
    const clanData = {
      name: 'DemoEliteClan',
      description: 'A demonstration clan for the MLG platform showcasing tier-based gaming communities',
      tags: ['demo', 'elite', 'gaming', 'mlg'],
      tier: 'silver',
      bannerUrl: 'https://example.com/demo-banner.jpg',
      rules: [
        'Respect all clan members and maintain sportsmanship',
        'Participate actively in clan events and tournaments',
        'Follow MLG platform community guidelines',
        'Help newer members learn and improve their skills',
        'No cheating, hacking, or exploiting game mechanics'
      ]
    };

    console.log('📋 Clan Creation Request:');
    console.log(`  Name: ${clanData.name}`);
    console.log(`  Tier: ${clanData.tier.toUpperCase()}`);
    console.log(`  Description: ${clanData.description}`);
    console.log(`  Tags: ${clanData.tags.join(', ')}`);
    console.log(`  Rules: ${clanData.rules.length} rules defined`);
    console.log('');

    // Show tier information
    const tierConfig = CLAN_TIER_CONFIG[clanData.tier.toUpperCase()];
    console.log(`🏆 Selected Tier: ${tierConfig.name} ${tierConfig.icon}`);
    console.log(`  • Required Stake: ${formatMLGAmount(tierConfig.minStake)} MLG tokens`);
    console.log(`  • Max Members: ${tierConfig.maxMembers}`);
    console.log(`  • Features: ${tierConfig.features.join(', ')}`);
    console.log('');

    // Simulate creation process
    console.log('🚀 Starting clan creation process...');
    console.log('  ✅ Validating clan name uniqueness...');
    console.log('  ✅ Checking MLG token balance...');
    console.log('  ✅ Generating clan Program Derived Address...');
    console.log('  ✅ Creating token staking transaction...');
    console.log('  📝 Signing transaction with Phantom wallet...');
    console.log('  📡 Submitting transaction to Solana blockchain...');
    console.log('  ⏳ Waiting for transaction confirmation...');
    
    const result = await clanManager.createClan(clanData);

    console.log('');
    console.log('🎉 Clan created successfully!');
    console.log(`  • Clan ID: ${result.clan.id}`);
    console.log(`  • Transaction: ${result.transaction}`);
    console.log(`  • Owner: ${result.clan.owner}`);
    console.log(`  • Members: ${result.clan.memberCount}/${result.clan.maxMembers}`);
    console.log(`  • Staked Tokens: ${formatMLGAmount(result.clan.stakedTokens)} MLG`);
    console.log(`  • Lock Period Ends: ${result.clan.lockPeriodEnd}`);
    console.log(`  • Features: ${result.clan.features.join(', ')}`);

    return result;

  } catch (error) {
    console.log('❌ Clan creation failed:');
    console.log(`  Error: ${error.message}`);
    return null;
  }

  console.log('\n=== End Creation Simulation ===\n');
}

/**
 * Run all demonstrations
 */
export async function runAllDemos() {
  console.log('\n🎮 MLG.clan System Comprehensive Demonstration 🎮\n');
  console.log('This demo showcases the complete clan management system');
  console.log('including tier mechanics, role hierarchy, validation, and creation simulation.\n');

  demonstrateTierSystem();
  demonstrateRoleSystem();
  demonstrateConfiguration();
  demonstrateValidation();
  demonstrateUtilities();
  await simulateClanCreation();
  
  console.log('🏁 All demonstrations completed!');
  console.log('\nThe MLG.clan system is ready for integration with:');
  console.log('  • Phantom wallet connection');
  console.log('  • MLG token balance verification');  
  console.log('  • Solana blockchain transactions');
  console.log('  • Content moderation systems');
  console.log('  • Real-time UI updates');
}

// Auto-run if executed directly
if (typeof window !== 'undefined') {
  window.MLGClanDemo = {
    demonstrateTierSystem,
    demonstrateRoleSystem,
    demonstrateConfiguration,
    demonstrateValidation,
    demonstrateUtilities,
    simulateClanCreation,
    runAllDemos
  };
  
  console.log('MLG.clan Demo loaded! Available functions:');
  console.log('• MLGClanDemo.runAllDemos() - Run all demonstrations');
  console.log('• MLGClanDemo.demonstrateTierSystem() - Show tier system');
  console.log('• MLGClanDemo.simulateClanCreation() - Simulate creating a clan');
} else if (typeof module !== 'undefined') {
  // Node.js environment - auto-run demo
  runAllDemos().catch(console.error);
}

export default {
  demonstrateTierSystem,
  demonstrateRoleSystem,
  demonstrateConfiguration,
  demonstrateValidation,
  demonstrateUtilities,
  simulateClanCreation,
  runAllDemos
};