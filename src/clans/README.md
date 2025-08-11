# MLG.clan Clan Management System

A comprehensive Solana blockchain-based clan management system for the MLG gaming platform, implementing SPL token-gated access, progressive tier requirements, and secure on-chain clan operations.

## Overview

The MLG.clan system enables gaming communities to create and manage clans using MLG token staking mechanics. Built with security-first principles and integrated with Phantom wallet for seamless user experience.

## Features

### 🏆 Progressive Tier System
- **Bronze Tier**: 100 MLG tokens, 20 members max
- **Silver Tier**: 500 MLG tokens, 50 members max  
- **Gold Tier**: 1000 MLG tokens, 100 members max
- **Diamond Tier**: 5000 MLG tokens, 250 members max

### 🔒 Security Features
- Phantom wallet integration with secure transaction signing
- Content moderation for clan names and descriptions
- Rate limiting and abuse prevention
- Comprehensive audit trails
- MLG token balance verification before operations

### ⚡ Blockchain Integration
- On-chain clan registration with Program Derived Addresses (PDAs)
- Token staking with 7-day lock periods
- Solana transaction confirmation and verification
- Integration with MLG token contract: `7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL`

### 👥 Clan Management
- Role-based hierarchy (Owner, Admin, Moderator, Member)
- Member invitation and management system
- Clan ownership transfer capabilities
- Tier upgrade/downgrade functionality
- Comprehensive clan metadata (description, tags, banner, rules)

## Installation

```bash
npm install @solana/web3.js @solana/spl-token @solana/wallet-adapter-phantom
```

## Quick Start

### 1. Basic Setup

```javascript
import { ClanManager } from './clan-management.js';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

// Initialize wallet adapter
const walletAdapter = new PhantomWalletAdapter();
await walletAdapter.connect();

// Create clan manager
const clanManager = new ClanManager(walletAdapter);
```

### 2. Create a Clan

```javascript
const clanData = {
  name: 'EliteGamingCrew',
  description: 'Professional esports team',
  tags: ['esports', 'fps', 'competitive'],
  tier: 'silver', // bronze, silver, gold, diamond
  bannerUrl: 'https://example.com/banner.jpg',
  rules: [
    'Be respectful to all members',
    'No cheating or exploiting',
    'Participate in clan events'
  ]
};

try {
  const result = await clanManager.createClan(clanData);
  console.log('Clan created:', result.clan);
  console.log('Transaction:', result.transaction);
} catch (error) {
  console.error('Creation failed:', error.message);
}
```

### 3. Manage Members

```javascript
// Add member
await clanManager.addMember(clanAddress, memberPublicKey, 'member');

// Remove member
await clanManager.removeMember(clanAddress, memberPublicKey, 'kicked');

// Transfer ownership
await clanManager.transferOwnership(clanAddress, newOwnerPublicKey);
```

### 4. Upgrade Tier

```javascript
// Upgrade to Gold tier
const upgradeResult = await clanManager.upgradeClanTier(clanAddress, 'gold');
if (upgradeResult.success) {
  console.log(`Upgraded to ${upgradeResult.newTier.name}!`);
}
```

## API Reference

### ClanManager Class

#### Constructor
```javascript
new ClanManager(walletAdapter)
```

#### Methods

##### `createClan(clanData)`
Creates a new clan with MLG token staking.

**Parameters:**
- `clanData.name` (string): Unique clan name (3-32 characters)
- `clanData.description` (string): Clan description (max 500 chars)
- `clanData.tags` (array): Clan tags (max 10)
- `clanData.tier` (string): Clan tier (bronze/silver/gold/diamond)
- `clanData.bannerUrl` (string): Banner image URL
- `clanData.rules` (array): Clan rules

**Returns:** `Promise<{success: boolean, clan: object, transaction: string}>`

##### `upgradeClanTier(clanAddress, newTier)`
Upgrades clan to higher tier with additional token staking.

**Parameters:**
- `clanAddress` (string): Clan PDA address
- `newTier` (string): Target tier

**Returns:** `Promise<{success: boolean, clan: object, transaction: string}>`

##### `addMember(clanAddress, memberPublicKey, role)`
Adds new member to clan.

**Parameters:**
- `clanAddress` (string): Clan PDA address  
- `memberPublicKey` (PublicKey): Member's public key
- `role` (string): Member role (member/moderator/admin)

**Returns:** `Promise<{success: boolean, clan: object}>`

##### `getUserClans(userPublicKey)`
Gets all clans for a user.

**Parameters:**
- `userPublicKey` (PublicKey): User's public key

**Returns:** `Promise<Array<object>>`

##### `getClan(clanAddress)`
Retrieves clan information.

**Parameters:**
- `clanAddress` (string): Clan PDA address

**Returns:** `Promise<object>`

### Tier Configuration

```javascript
import { CLAN_TIER_CONFIG } from './clan-management.js';

// Access tier information
const bronzeTier = CLAN_TIER_CONFIG.BRONZE;
console.log(bronzeTier.minStake); // 100
console.log(bronzeTier.maxMembers); // 20
console.log(bronzeTier.features); // ['basic_chat', 'member_invites', ...]
```

### Role System

```javascript
import { CLAN_ROLES } from './clan-management.js';

// Access role information
const ownerRole = CLAN_ROLES.OWNER;
console.log(ownerRole.permissions); // ['all']
console.log(ownerRole.priority); // 1000
```

## Integration Examples

### Complete Integration with MLG Token System

```javascript
import { ClanIntegrationExample } from './clan-integration-example.js';

// Initialize complete integration
const integration = new ClanIntegrationExample();
await integration.initialize();

// Connect wallet
const walletResult = await integration.connectWallet();
console.log(`Balance: ${walletResult.balance} MLG`);

// Get tier recommendations
const recommendations = integration.getTierRecommendations();
recommendations.forEach(tier => {
  if (tier.canAfford) {
    console.log(`✅ ${tier.name}: ${tier.minStake} MLG`);
  }
});

// Create clan with full validation
const result = await integration.createClan({
  name: 'MyAwesomeClan',
  tier: 'bronze'
});
```

### Error Handling

```javascript
try {
  const result = await clanManager.createClan(clanData);
  // Handle success
} catch (error) {
  if (error.message.includes('Insufficient MLG tokens')) {
    // Show token purchase options
  } else if (error.message.includes('User rejected')) {
    // User cancelled transaction
  } else if (error.message.includes('Clan name is already taken')) {
    // Suggest alternative names
  }
  // Handle other errors
}
```

## Configuration

### Clan Configuration

```javascript
import { CLAN_CONFIG } from './clan-management.js';

// Access configuration values
CLAN_CONFIG.NAME_MIN_LENGTH; // 3
CLAN_CONFIG.NAME_MAX_LENGTH; // 32
CLAN_CONFIG.STAKE_LOCK_PERIOD; // 7 days in milliseconds
CLAN_CONFIG.CREATION_COOLDOWN; // 1 hour in milliseconds
CLAN_CONFIG.MAX_CLANS_PER_USER; // 3
```

### Network Configuration

The system uses the MLG token on Solana mainnet:
- **MLG Token Mint**: `7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL`
- **Network**: Solana mainnet-beta
- **Decimals**: 9

## Testing

Run the comprehensive test suite:

```bash
npm test src/clans/clan-management.test.js
```

The test suite covers:
- Clan creation and validation
- Tier system functionality
- Member management
- Security features
- Error handling
- Integration scenarios

## Security Considerations

### ⚠️ Important Security Notes

1. **Private Keys**: Never request, store, or handle private keys
2. **Transaction Signing**: Always use Phantom wallet for transaction signing
3. **Token Validation**: Verify MLG token balances before operations
4. **Rate Limiting**: Respect cooldown periods to prevent abuse
5. **Content Moderation**: All clan names/descriptions are filtered
6. **Simulation**: All transactions are simulated before execution

### Best Practices

- Always check wallet connection before operations
- Validate user input comprehensively
- Provide clear error messages to users
- Show transaction confirmation dialogs
- Handle network failures gracefully
- Cache data appropriately for performance

## Troubleshooting

### Common Issues

**"Wallet not connected"**
```javascript
// Ensure wallet is connected first
if (!clanManager.walletAdapter || !clanManager.walletAdapter.connected) {
  await walletAdapter.connect();
}
```

**"Insufficient MLG tokens"**
```javascript
// Check balance before operations
const validation = await clanManager.validateTokenRequirements(
  userPublicKey, 
  requiredAmount
);
if (!validation.hasEnoughTokens) {
  console.log(`Need ${validation.shortfall} more MLG tokens`);
}
```

**"Clan name is already taken"**
```javascript
// Check name availability
const isAvailable = await clanManager.checkClanNameUniqueness(clanName);
if (!isAvailable) {
  // Suggest alternatives
}
```

**"Rate limited"**
```javascript
// Check rate limits
const rateCheck = clanManager.checkRateLimit(userPublicKey);
if (!rateCheck.allowed) {
  console.log(`Wait ${rateCheck.remainingTime} minutes`);
}
```

## Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Clan Manager  │────│  Phantom Wallet │────│  Solana Network │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────│   MLG Token     │──────────────┘
                        │   Contract      │
                        └─────────────────┘
```

### Data Flow

1. User connects Phantom wallet
2. ClanManager validates MLG token balance
3. User creates clan with tier selection
4. System generates PDA for clan
5. Tokens are staked to clan account
6. Transaction is signed and submitted
7. Clan metadata is stored and cached

## Contributing

When contributing to the clan system:

1. Follow Solana security best practices
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Ensure MLG token integration compatibility
5. Test on Solana devnet before mainnet

## License

This code is part of the MLG.clan platform implementation.

---

For questions or support, refer to the main project documentation or contact the development team.