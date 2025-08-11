/**
 * MLG.clan Comprehensive Clan Management UI Stories
 * 
 * Storybook documentation for all clan management components and variants.
 * Demonstrates Xbox 360 gaming aesthetic, responsive behavior, and accessibility features.
 * 
 * @author Claude Code - Frontend Production Engineer  
 * @version 1.0.0
 * @created 2025-08-10
 */

import React from 'react';
import ClanManagementUI, { XBOX_COLORS, BLADE_NAVIGATION, SORT_OPTIONS, FILTER_OPTIONS } from './clan-management-ui.js';

// =============================================================================
// STORY CONFIGURATION
// =============================================================================

export default {
  title: 'MLG.clan/ClanManagementUI',
  component: ClanManagementUI,
  parameters: {
    docs: {
      description: {
        component: `
# Clan Management UI

A comprehensive clan management interface with Xbox 360 retro gaming aesthetic. 
Features include member roster management, role assignment, invitation system, 
and clan settings with real-time updates and mobile-responsive design.

## Features

- **Interactive Member Roster**: Search, filter, sort members with role badges
- **Role Management**: Drag-and-drop role assignments with permission matrix
- **Invitation System**: Single and batch invitation capabilities  
- **Clan Dashboard**: Real-time statistics and performance metrics
- **Xbox 360 Aesthetic**: Blade navigation, tile layouts, glow effects
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation
- **Mobile Responsive**: Optimized for all device sizes

## Integration

- Integrates with \`clan-management.js\` for core operations
- Real-time updates via WebSocket connections
- MLG Token contract integration for staking
- Phantom Wallet for secure transactions
        `
      }
    },
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0b1426' },
        { name: 'xbox', value: '#1a1a2e' }
      ]
    }
  },
  argTypes: {
    walletAdapter: {
      description: 'Phantom wallet adapter instance',
      control: false
    },
    clanAddress: {
      description: 'Solana address of the clan',
      control: 'text'
    },
    userAddress: {
      description: 'Current user wallet address',
      control: 'text'
    },
    theme: {
      description: 'UI theme variant',
      control: { type: 'select' },
      options: ['xbox', 'dark', 'light']
    },
    onError: { action: 'error occurred' },
    onSuccess: { action: 'success occurred' }
  }
};

// =============================================================================
// MOCK DATA
// =============================================================================

const mockClanData = {
  id: 'clan_123',
  name: 'Xbox Elite Gamers',
  description: 'Premier Xbox gaming clan focused on competitive play and community building.',
  tier: 'gold',
  memberCount: 45,
  maxMembers: 100,
  owner: 'owner_address_123',
  admins: ['admin_address_1', 'admin_address_2'],
  moderators: ['mod_address_1', 'mod_address_2'],
  members: [],
  stakedTokens: 2500,
  lockPeriodEnd: '2025-12-31T23:59:59.000Z',
  network: 'devnet',
  status: 'active',
  createdAt: '2025-01-01T00:00:00.000Z',
  features: ['tournaments', 'analytics', 'custom_roles']
};

const mockMembers = [
  {
    id: 'member_1',
    name: 'GameMaster_Pro',
    publicKey: 'Abc123DefGhi456JklMno789PqrStu012VwxYz345',
    role: 'owner',
    status: 'online',
    joinDate: '2025-01-01',
    votingPower: 150,
    activityScore: 95,
    lastSeen: new Date().toISOString()
  },
  {
    id: 'member_2', 
    name: 'EliteSniper_99',
    publicKey: 'Def456GhiJkl789MnoP012QrsT345UvwX678YzA901',
    role: 'admin',
    status: 'online',
    joinDate: '2025-01-15',
    votingPower: 120,
    activityScore: 88,
    lastSeen: new Date(Date.now() - 300000).toISOString() // 5 min ago
  },
  {
    id: 'member_3',
    name: 'TacticMaster',
    publicKey: 'Ghi789JklMno012PqrS345TuvW678XyzA901Bcd234',
    role: 'moderator',
    status: 'idle',
    joinDate: '2025-02-01',
    votingPower: 85,
    activityScore: 72,
    lastSeen: new Date(Date.now() - 1800000).toISOString() // 30 min ago
  },
  {
    id: 'member_4',
    name: 'RookieGamer',
    publicKey: 'Jkl012MnoP345QrsT678UvwX901YzAb234CdEf567',
    role: 'member',
    status: 'offline',
    joinDate: '2025-02-15',
    votingPower: 45,
    activityScore: 41,
    lastSeen: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  },
  {
    id: 'member_5',
    name: 'CompetitivePro',
    publicKey: 'Mno345PqrS678TuvW901XyzA234BcDe567FgHi890',
    role: 'member',
    status: 'online',
    joinDate: '2025-03-01',
    votingPower: 65,
    activityScore: 78,
    lastSeen: new Date().toISOString()
  }
];

const mockStatistics = {
  clanAddress: 'clan_123',
  clanName: 'Xbox Elite Gamers',
  tier: 'gold',
  period: 'daily',
  timestamp: new Date().toISOString(),
  overallScore: 78.5,
  healthScore: 85.2,
  trendDirection: 'improving',
  memberActivity: {
    totalMembers: 45,
    activeMembers: 38,
    participationRate: 84.4,
    engagementScore: 79.2,
    retentionRate: 92.1
  },
  financialPerformance: {
    totalTokenBurns: 1250,
    treasuryContributions: 8500,
    burnEfficiency: 73.5,
    returnOnInvestment: 145.2
  },
  governanceMetrics: {
    proposalsCreated: 8,
    proposalsSuccessful: 6,
    governanceParticipation: 76.8,
    leadershipEffectiveness: 88.9
  },
  contentMetrics: {
    contentSubmissions: 24,
    curationActivity: 67.3,
    contentQuality: 81.7
  },
  socialHealth: {
    recruitmentSuccess: 78.5,
    communityHealth: 86.4,
    conflictResolution: 95.2,
    memberSatisfaction: 83.7
  },
  competitivePerformance: {
    tournamentPerformance: 72.8,
    rankingImprovements: 3.2,
    winRate: 68.5
  }
};

const mockInvitations = [
  {
    id: 'inv_1',
    recipientName: 'NewGamer_2025',
    recipientAddress: 'Pqr678StU901VwxY234ZaB567CdEf890GhI123JkL456',
    role: 'member',
    status: 'pending',
    sentAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    expiresAt: new Date(Date.now() + 6 * 24 * 3600000).toISOString(), // 6 days from now
    message: 'Welcome to our elite gaming clan!'
  },
  {
    id: 'inv_2',
    recipientName: 'ProPlayer_XY',
    recipientAddress: 'StU901VwxY234ZaB567CdEf890GhI123JkL456MnO789',
    role: 'moderator',
    status: 'pending',
    sentAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    expiresAt: new Date(Date.now() + 5 * 24 * 3600000).toISOString()
  },
  {
    id: 'inv_3',
    recipientName: 'RetiredVet',
    recipientAddress: 'VwxY234ZaB567CdEf890GhI123JkL456MnO789PqR012',
    role: 'member',
    status: 'accepted',
    sentAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    acceptedAt: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
  }
];

const mockWalletAdapter = {
  publicKey: { toString: () => 'owner_address_123' },
  connected: true,
  signTransaction: async (transaction) => transaction
};

// =============================================================================
// STORY TEMPLATES
// =============================================================================

const Template = (args) => <ClanManagementUI {...args} />;

// =============================================================================
// STORY VARIANTS
// =============================================================================

export const Default = Template.bind({});
Default.args = {
  clanAddress: 'clan_123',
  userAddress: 'owner_address_123',
  walletAdapter: mockWalletAdapter,
  theme: 'xbox'
};
Default.parameters = {
  docs: {
    description: {
      story: 'Default clan management UI with owner permissions and full access to all features.'
    }
  }
};

export const MemberView = Template.bind({});
MemberView.args = {
  ...Default.args,
  userAddress: 'member_address_456', // Regular member
  walletAdapter: {
    ...mockWalletAdapter,
    publicKey: { toString: () => 'member_address_456' }
  }
};
MemberView.parameters = {
  docs: {
    description: {
      story: 'Clan management UI from a regular member perspective with limited permissions.'
    }
  }
};

export const AdminView = Template.bind({});
AdminView.args = {
  ...Default.args,
  userAddress: 'admin_address_1', // Admin
  walletAdapter: {
    ...mockWalletAdapter,
    publicKey: { toString: () => 'admin_address_1' }
  }
};
AdminView.parameters = {
  docs: {
    description: {
      story: 'Clan management UI from an admin perspective with member management permissions.'
    }
  }
};

export const ModeratorView = Template.bind({});
ModeratorView.args = {
  ...Default.args,
  userAddress: 'mod_address_1', // Moderator
  walletAdapter: {
    ...mockWalletAdapter,
    publicKey: { toString: () => 'mod_address_1' }
  }
};
ModeratorView.parameters = {
  docs: {
    description: {
      story: 'Clan management UI from a moderator perspective with limited management permissions.'
    }
  }
};

export const LoadingState = Template.bind({});
LoadingState.args = {
  ...Default.args,
  clanAddress: 'loading_clan' // Will trigger loading state
};
LoadingState.parameters = {
  docs: {
    description: {
      story: 'Loading state with Xbox-style spinner and loading indicators.'
    }
  }
};

export const ErrorState = Template.bind({});
ErrorState.args = {
  ...Default.args,
  clanAddress: '', // Invalid address will trigger error
  walletAdapter: null // No wallet
};
ErrorState.parameters = {
  docs: {
    description: {
      story: 'Error state handling with user-friendly error messages and retry options.'
    }
  }
};

export const BronzeTierClan = Template.bind({});
BronzeTierClan.args = {
  ...Default.args,
  // Mock data would show bronze tier restrictions
};
BronzeTierClan.parameters = {
  docs: {
    description: {
      story: 'Bronze tier clan with limited features and smaller member capacity.'
    }
  }
};

export const DiamondTierClan = Template.bind({});
DiamondTierClan.args = {
  ...Default.args,
  // Mock data would show diamond tier features
};
DiamondTierClan.parameters = {
  docs: {
    description: {
      story: 'Diamond tier clan with all premium features and maximum capacity.'
    }
  }
};

export const MobileLayout = Template.bind({});
MobileLayout.args = {
  ...Default.args
};
MobileLayout.parameters = {
  viewport: {
    defaultViewport: 'mobile1'
  },
  docs: {
    description: {
      story: 'Mobile-optimized layout with responsive blade navigation and touch-friendly controls.'
    }
  }
};

export const TabletLayout = Template.bind({});
TabletLayout.args = {
  ...Default.args
};
TabletLayout.parameters = {
  viewport: {
    defaultViewport: 'tablet'
  },
  docs: {
    description: {
      story: 'Tablet layout with optimized grid layouts and touch interactions.'
    }
  }
};

export const DashboardTab = Template.bind({});
DashboardTab.args = {
  ...Default.args
};
DashboardTab.parameters = {
  docs: {
    description: {
      story: 'Dashboard view showing clan statistics, health metrics, and recent activity feed.'
    }
  }
};

export const MembersTab = Template.bind({});
MembersTab.args = {
  ...Default.args
};
MembersTab.parameters = {
  docs: {
    description: {
      story: 'Member roster with search, filtering, sorting, and bulk management operations.'
    }
  }
};

export const RolesTab = Template.bind({});
RolesTab.args = {
  ...Default.args
};
RolesTab.parameters = {
  docs: {
    description: {
      story: 'Role management interface with drag-and-drop functionality and permission matrix.'
    }
  }
};

export const InvitationsTab = Template.bind({});
InvitationsTab.args = {
  ...Default.args
};
InvitationsTab.parameters = {
  docs: {
    description: {
      story: 'Invitation and recruitment system with batch invite capabilities.'
    }
  }
};

export const SettingsTab = Template.bind({});
SettingsTab.args = {
  ...Default.args
};
SettingsTab.parameters = {
  docs: {
    description: {
      story: 'Clan settings and configuration with financial information and danger zone.'
    }
  }
};

// =============================================================================
// ACCESSIBILITY STORIES
// =============================================================================

export const KeyboardNavigation = Template.bind({});
KeyboardNavigation.args = {
  ...Default.args
};
KeyboardNavigation.parameters = {
  docs: {
    description: {
      story: `
## Keyboard Navigation

This component supports full keyboard navigation:

- **Tab/Shift+Tab**: Navigate between interactive elements
- **Enter/Space**: Activate buttons and controls
- **Arrow Keys**: Navigate within lists and grids
- **Escape**: Close modals and dropdowns
- **Home/End**: Jump to first/last items in lists

All interactive elements have proper focus indicators and ARIA labels.
      `
    }
  }
};

export const HighContrast = Template.bind({});
HighContrast.args = {
  ...Default.args,
  className: 'high-contrast-mode'
};
HighContrast.parameters = {
  docs: {
    description: {
      story: 'High contrast mode for improved accessibility and readability.'
    }
  }
};

export const ScreenReaderOptimized = Template.bind({});
ScreenReaderOptimized.args = {
  ...Default.args
};
ScreenReaderOptimized.parameters = {
  docs: {
    description: {
      story: `
## Screen Reader Support

The component includes comprehensive ARIA labels and descriptions:

- **Role badges**: Announced with role names and permissions
- **Member status**: Online/offline status clearly announced
- **Statistics**: Values announced with context and units
- **Actions**: All buttons have descriptive labels
- **Navigation**: Blade navigation properly structured for screen readers
      `
    }
  }
};

// =============================================================================
// INTERACTION STORIES
// =============================================================================

export const DragAndDropRoles = Template.bind({});
DragAndDropRoles.args = {
  ...Default.args
};
DragAndDropRoles.parameters = {
  docs: {
    description: {
      story: `
## Drag and Drop Role Management

Owners can drag members between role sections to reassign permissions:

1. Navigate to the Roles tab
2. Drag a member from one role section to another
3. Drop to confirm the role change
4. Changes are applied immediately with blockchain confirmation

The interface provides visual feedback during drag operations.
      `
    }
  }
};

export const BatchInvitations = Template.bind({});
BatchInvitations.args = {
  ...Default.args
};
BatchInvitations.parameters = {
  docs: {
    description: {
      story: `
## Batch Invitation System

Admins can invite multiple members simultaneously:

1. Navigate to Invitations tab
2. Click "Send Invitation" button  
3. Enable "Batch invite mode"
4. Paste multiple wallet addresses (one per line)
5. Select role and send batch invitations

The system processes invitations in parallel with progress feedback.
      `
    }
  }
};

export const RealTimeUpdates = Template.bind({});
RealTimeUpdates.args = {
  ...Default.args
};
RealTimeUpdates.parameters = {
  docs: {
    description: {
      story: `
## Real-Time Updates

The interface receives live updates via WebSocket connections:

- **Member status changes**: Online/offline indicators update automatically  
- **New members**: Member roster updates when invitations are accepted
- **Statistics**: Performance metrics refresh every 30 seconds
- **Role changes**: Permission updates reflect immediately
- **Clan events**: Activity feed shows real-time events

Visual indicators show when data is being updated.
      `
    }
  }
};

// =============================================================================
// THEME VARIANTS
// =============================================================================

export const XboxTheme = Template.bind({});
XboxTheme.args = {
  ...Default.args,
  theme: 'xbox'
};
XboxTheme.parameters = {
  docs: {
    description: {
      story: 'Classic Xbox 360 theme with green accents, blade navigation, and glow effects.'
    }
  }
};

export const DarkTheme = Template.bind({});
DarkTheme.args = {
  ...Default.args,
  theme: 'dark'
};
DarkTheme.parameters = {
  docs: {
    description: {
      story: 'Dark theme variant with muted colors for extended gaming sessions.'
    }
  }
};

// =============================================================================
// PERFORMANCE STORIES
// =============================================================================

export const LargeClanRoster = Template.bind({});
LargeClanRoster.args = {
  ...Default.args
  // Mock data would include 200+ members for virtualization testing
};
LargeClanRoster.parameters = {
  docs: {
    description: {
      story: `
## Performance Optimization

For large clans with 200+ members:

- **Virtualization**: Only visible members are rendered
- **Search debouncing**: Search queries are debounced by 300ms
- **Lazy loading**: Member details load on demand
- **Pagination**: Results are paginated for better performance
- **Caching**: Frequently accessed data is cached locally

The interface maintains smooth performance even with maximum clan size.
      `
    }
  }
};

export const SlowNetwork = Template.bind({});
SlowNetwork.args = {
  ...Default.args
};
SlowNetwork.parameters = {
  docs: {
    description: {
      story: `
## Slow Network Handling

Optimizations for poor network conditions:

- **Skeleton loaders**: Show content structure while loading
- **Progressive enhancement**: Core functionality loads first
- **Offline indicators**: Clear status when connection is lost
- **Retry mechanisms**: Automatic retry for failed operations
- **Data compression**: Minimize bandwidth usage

The interface degrades gracefully on slow connections.
      `
    }
  }
};

// =============================================================================
// INTEGRATION STORIES  
// =============================================================================

export const SolanaIntegration = Template.bind({});
SolanaIntegration.args = {
  ...Default.args
};
SolanaIntegration.parameters = {
  docs: {
    description: {
      story: `
## Solana Blockchain Integration

The component integrates with Solana blockchain:

- **Wallet Connection**: Phantom wallet adapter for secure transactions
- **MLG Token**: Real token balances and staking information  
- **Transaction Signing**: All clan operations require blockchain confirmation
- **PDA Addresses**: Program-derived addresses for clan data storage
- **Real-time Balance**: Token balances update automatically

All operations are verified on-chain for transparency and security.
      `
    }
  }
};

export const MLGTokenIntegration = Template.bind({});
MLGTokenIntegration.args = {
  ...Default.args
};
MLGTokenIntegration.parameters = {
  docs: {
    description: {
      story: `
## MLG Token Integration

MLG Token (7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL) powers the clan system:

- **Clan Tiers**: Different staking amounts unlock tier benefits
- **Voting Power**: Token holdings determine voting influence
- **Treasury**: Clans accumulate tokens for collective decisions
- **Rewards**: Active participation earns token rewards
- **Burns**: Voting actions burn tokens for consensus mechanisms

Token economics create sustainable clan engagement incentives.
      `
    }
  }
};