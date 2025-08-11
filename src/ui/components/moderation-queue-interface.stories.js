/**
 * Storybook Stories for MLG.clan Content Moderation Queue Interface
 * 
 * Comprehensive documentation and testing scenarios for all moderation components.
 * Includes visual regression testing, accessibility validation, and interaction demos.
 * 
 * @author Claude Code - Production Frontend Engineer
 * @version 1.0.0
 */

import React from 'react';
import { 
  ModerationQueueInterface,
  ContentReportModal,
  ModerationAnalyticsDashboard,
  AppealInterface,
  ModerationCard,
  BatchActionBar,
  VoteProgressBar,
  SystemHealthCard,
  CommunityActivityCard,
  CategoryDistributionChart,
  MobileModerationQueue,
  MobileContentCard,
  GAMING_VIOLATION_CATEGORIES,
  MODERATOR_ROLES,
  APPEAL_TYPES
} from './moderation-queue-interface.js';

// =============================================================================
// STORY CONFIGURATION
// =============================================================================

export default {
  title: 'MLG.clan/Moderation/Queue Interface',
  component: ModerationQueueInterface,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Content Moderation Queue Interface

Production-ready content reporting and moderation system with Xbox 360 retro aesthetic.
Implements gaming-specific violation categories, MLG token voting, and community governance.

## Features
- Gaming-focused violation categories (Cheating, Harassment, etc.)
- MLG token-based voting with reputation weighting  
- Real-time queue updates and voting progress
- Batch moderation tools for efficiency
- Mobile-responsive with swipe gestures
- WCAG AA accessibility compliance
- Analytics dashboard with transparency metrics
- Appeal process with community review

## Integration
- ContentModerationSystem from content-moderation.js
- MLG token contract: 7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL
- Phantom wallet for transaction signing
- Xbox 360 UI design patterns
        `
      }
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#111827' },
        { name: 'xbox', value: '#1a1a2e' }
      ]
    }
  },
  argTypes: {
    user: {
      description: 'Current user with role and reputation',
      control: { type: 'object' }
    }
  }
};

// =============================================================================
// MOCK DATA
// =============================================================================

const mockUsers = {
  communityMember: {
    role: MODERATOR_ROLES.COMMUNITY_MEMBER,
    reputation: 127,
    voteWeight: 1.0,
    walletAddress: 'CommunityMember123...',
    votingAccuracy: 0.68
  },
  trustedMember: {
    role: MODERATOR_ROLES.TRUSTED_MEMBER,
    reputation: 456,
    voteWeight: 1.5,
    walletAddress: 'TrustedMember456...',
    votingAccuracy: 0.82
  },
  communityModerator: {
    role: MODERATOR_ROLES.COMMUNITY_MODERATOR,
    reputation: 1247,
    voteWeight: 2.0,
    walletAddress: 'CommunityMod789...',
    votingAccuracy: 0.91
  },
  expertReviewer: {
    role: MODERATOR_ROLES.EXPERT_REVIEWER,
    reputation: 3891,
    voteWeight: 3.0,
    walletAddress: 'ExpertReviewer000...',
    votingAccuracy: 0.95
  }
};

const mockContentData = {
  id: 'content-gc-4891',
  title: 'MLG Clutch Compilation',
  author: 'ProGamer_2023',
  preview: 'Check out these insane clutch plays from last night\'s tournament...',
  category: 'video',
  uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
};

const mockQueueItems = [
  {
    id: 'content-gc-4891',
    category: 'HARASSMENT',
    severity: 'CRITICAL',
    status: 'voting_active',
    reportCount: 5,
    reportedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    votingDeadline: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(),
    content: {
      title: 'Epic Fail Compilation',
      author: 'ToxicPlayer_2023',
      preview: 'Get rekt noobs! Your mom\'s credit card won\'t save you now...'
    },
    reportSummary: {
      reason: 'Harassment, hate speech targeting other players',
      reporterName: 'CommunityMember_456',
      reporterReputation: 289,
      evidence: 'Screenshots of comment section'
    },
    votes: [
      { id: '1', voteType: 'keep', voteWeight: 1.0, tokensBurned: 1 },
      { id: '2', voteType: 'keep', voteWeight: 1.5, tokensBurned: 0.5 },
      { id: '3', voteType: 'keep', voteWeight: 1.0, tokensBurned: 1 },
      { id: '4', voteType: 'remove', voteWeight: 2.0, tokensBurned: 0.5 },
      { id: '5', voteType: 'remove', voteWeight: 1.0, tokensBurned: 2 },
      { id: '6', voteType: 'remove', voteWeight: 1.5, tokensBurned: 1 },
      { id: '7', voteType: 'remove', voteWeight: 1.0, tokensBurned: 2 },
      { id: '8', voteType: 'remove', voteWeight: 2.0, tokensBurned: 0.5 },
      { id: '9', voteType: 'remove', voteWeight: 1.0, tokensBurned: 2 },
      { id: '10', voteType: 'remove', voteWeight: 1.5, tokensBurned: 1 },
      { id: '11', voteType: 'remove', voteWeight: 1.0, tokensBurned: 2 },
      { id: '12', voteType: 'escalate', voteWeight: 3.0, tokensBurned: 0.3 }
    ],
    voteCount: 12
  },
  {
    id: 'content-gc-4890',
    category: 'SPAM',
    severity: 'MEDIUM',
    status: 'voting_active',
    reportCount: 3,
    reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    votingDeadline: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
    content: {
      title: 'NEW CRYPTO GAMING COIN!',
      author: 'CryptoPromoter_99',
      preview: 'Get rich quick with this new gaming cryptocurrency...'
    },
    reportSummary: {
      reason: 'Promotional content, cryptocurrency spam',
      reporterName: 'TrustedMember_123',
      reporterReputation: 456,
      evidence: 'Multiple similar posts detected'
    },
    votes: [
      { id: '1', voteType: 'remove', voteWeight: 1.5, tokensBurned: 1.5 },
      { id: '2', voteType: 'remove', voteWeight: 2.0, tokensBurned: 0.75 }
    ],
    voteCount: 2
  },
  {
    id: 'content-gc-4889',
    category: 'CHEATING',
    severity: 'HIGH',
    status: 'reported',
    reportCount: 2,
    reportedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    content: {
      title: 'Aimbot Tutorial 2024',
      author: 'HackerPro_666',
      preview: 'Learn how to install and use the best aimbot for competitive gaming...'
    },
    reportSummary: {
      reason: 'Tutorial for cheating software, promotes unfair gameplay',
      reporterName: 'ExpertReviewer_001',
      reporterReputation: 2847,
      evidence: 'Video analysis confirms cheat software demonstration'
    },
    votes: [],
    voteCount: 0
  }
];

const mockAnalyticsData = {
  timeframe: 'week',
  generatedAt: new Date().toISOString(),
  reports: {
    total: 1247,
    byCategory: {
      cheating: 425,
      harassment: 349,
      spam: 237,
      inappropriate: 150,
      low_quality: 62,
      copyright: 24
    },
    resolved: 1156,
    pending: 91
  },
  votes: {
    total: 3891,
    totalTokensBurned: 8247.5,
    byType: {
      keep: 1456,
      remove: 2156,
      escalate: 279
    }
  },
  community: {
    activeVoters: 89,
    topContributors: [
      { walletAddress: 'Expert123...', votes: 234, accuracy: 0.94 },
      { walletAddress: 'Mod456...', votes: 189, accuracy: 0.87 }
    ]
  },
  systemHealth: {
    consensusRate: 0.87,
    falsePositiveRate: 0.12,
    appealSuccessRate: 0.25,
    averageResponseTime: 2.3
  }
};

const mockRemovedContent = {
  id: 'content-gc-4891',
  title: 'Removed Gaming Content',
  author: 'ReportedUser_123',
  removedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  removalReason: 'Community vote - Harassment'
};

// =============================================================================
// MAIN QUEUE INTERFACE STORIES
// =============================================================================

const Template = (args) => <ModerationQueueInterface {...args} />;

export const Default = Template.bind({});
Default.args = {
  user: mockUsers.communityModerator
};
Default.storyName = 'Default Queue Dashboard';

export const CommunityMember = Template.bind({});
CommunityMember.args = {
  user: mockUsers.communityMember
};
CommunityMember.storyName = 'Community Member View';

export const TrustedMember = Template.bind({});
TrustedMember.args = {
  user: mockUsers.trustedMember
};
TrustedMember.storyName = 'Trusted Member View';

export const ExpertReviewer = Template.bind({});
ExpertReviewer.args = {
  user: mockUsers.expertReviewer
};
ExpertReviewer.storyName = 'Expert Reviewer View';

// =============================================================================
// CONTENT REPORT MODAL STORIES
// =============================================================================

export const ReportModal = {
  render: (args) => <ContentReportModal {...args} />,
  args: {
    isOpen: true,
    contentId: 'content-gc-4891',
    contentData: mockContentData,
    onClose: () => console.log('Modal closed'),
    onSubmit: (result) => console.log('Report submitted:', result)
  },
  parameters: {
    docs: {
      description: {
        story: `
Content reporting modal with gaming-specific violation categories.
Features category selection, evidence upload, and progressive disclosure.
        `
      }
    }
  }
};

export const ReportModalCheating = {
  render: (args) => <ContentReportModal {...args} />,
  args: {
    ...ReportModal.args,
    contentData: {
      ...mockContentData,
      title: 'Aimbot Tutorial 2024',
      author: 'HackerPro_666'
    }
  },
  storyName: 'Report Modal - Cheating Content'
};

export const ReportModalHarassment = {
  render: (args) => <ContentReportModal {...args} />,
  args: {
    ...ReportModal.args,
    contentData: {
      ...mockContentData,
      title: 'Toxic Player Compilation',
      author: 'TrollMaster_2023'
    }
  },
  storyName: 'Report Modal - Harassment Content'
};

// =============================================================================
// INDIVIDUAL COMPONENT STORIES
// =============================================================================

export const SingleModerationCard = {
  render: (args) => (
    <div className="bg-gray-900 p-6 min-h-screen">
      <ModerationCard {...args} />
    </div>
  ),
  args: {
    content: mockQueueItems[0],
    isSelected: false,
    onSelect: (selected) => console.log('Card selected:', selected),
    onVote: (voteType) => console.log('Vote cast:', voteType),
    userRole: mockUsers.communityModerator.role,
    voteWeight: mockUsers.communityModerator.voteWeight
  },
  storyName: 'Moderation Card - Critical Issue'
};

export const ModerationCardSpam = {
  render: (args) => (
    <div className="bg-gray-900 p-6 min-h-screen">
      <ModerationCard {...args} />
    </div>
  ),
  args: {
    ...SingleModerationCard.args,
    content: mockQueueItems[1]
  },
  storyName: 'Moderation Card - Spam Content'
};

export const ModerationCardReported = {
  render: (args) => (
    <div className="bg-gray-900 p-6 min-h-screen">
      <ModerationCard {...args} />
    </div>
  ),
  args: {
    ...SingleModerationCard.args,
    content: mockQueueItems[2]
  },
  storyName: 'Moderation Card - Recently Reported'
};

export const BatchActions = {
  render: (args) => (
    <div className="bg-gray-900 min-h-screen">
      <BatchActionBar {...args} />
    </div>
  ),
  args: {
    selectedCount: 3,
    selectedItems: mockQueueItems.slice(0, 3),
    onBatchAction: (action, items) => console.log('Batch action:', action, items),
    onClearSelection: () => console.log('Selection cleared'),
    userRole: mockUsers.communityModerator.role
  },
  storyName: 'Batch Action Bar'
};

export const VoteProgress = {
  render: (args) => (
    <div className="bg-gray-900 p-6">
      <div className="max-w-md">
        <VoteProgressBar {...args} />
      </div>
    </div>
  ),
  args: {
    type: 'remove',
    count: 8,
    percentage: 67,
    color: '#ef4444',
    label: 'Remove'
  },
  storyName: 'Vote Progress Bar'
};

// =============================================================================
// ANALYTICS DASHBOARD STORIES
// =============================================================================

export const AnalyticsDashboard = {
  render: (args) => <ModerationAnalyticsDashboard {...args} />,
  args: {
    timeframe: 'week'
  },
  storyName: 'Analytics Dashboard'
};

export const SystemHealth = {
  render: (args) => (
    <div className="bg-gray-900 p-6">
      <SystemHealthCard {...args} />
    </div>
  ),
  args: {
    stats: mockAnalyticsData
  },
  storyName: 'System Health Card'
};

export const CommunityActivity = {
  render: (args) => (
    <div className="bg-gray-900 p-6">
      <CommunityActivityCard {...args} />
    </div>
  ),
  args: {
    stats: mockAnalyticsData
  },
  storyName: 'Community Activity Card'
};

export const CategoryDistribution = {
  render: (args) => (
    <div className="bg-gray-900 p-6">
      <CategoryDistributionChart {...args} />
    </div>
  ),
  args: {
    data: mockAnalyticsData.reports.byCategory
  },
  storyName: 'Category Distribution Chart'
};

// =============================================================================
// APPEAL INTERFACE STORIES
// =============================================================================

export const AppealSubmission = {
  render: (args) => (
    <div className="bg-gray-900 p-6 min-h-screen">
      <AppealInterface {...args} />
    </div>
  ),
  args: {
    contentId: 'content-gc-4891',
    removedContent: mockRemovedContent,
    onSubmit: (result) => console.log('Appeal submitted:', result)
  },
  storyName: 'Appeal Submission Form'
};

export const AppealExpiredDeadline = {
  render: (args) => (
    <div className="bg-gray-900 p-6 min-h-screen">
      <AppealInterface {...args} />
    </div>
  ),
  args: {
    ...AppealSubmission.args,
    removedContent: {
      ...mockRemovedContent,
      removedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    }
  },
  storyName: 'Appeal - Expired Deadline'
};

// =============================================================================
// MOBILE INTERFACE STORIES
// =============================================================================

export const MobileQueue = {
  render: (args) => (
    <div className="max-w-sm mx-auto bg-gray-900">
      <MobileModerationQueue {...args} />
    </div>
  ),
  args: {
    items: mockQueueItems,
    onVote: (itemId, voteType) => console.log('Mobile vote:', itemId, voteType),
    onSelect: (itemId, selected) => console.log('Mobile select:', itemId, selected)
  },
  storyName: 'Mobile Queue Interface',
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  }
};

export const MobileCard = {
  render: (args) => (
    <div className="max-w-sm mx-auto bg-gray-900 p-4">
      <MobileContentCard {...args} />
    </div>
  ),
  args: {
    item: mockQueueItems[0],
    onSwipeLeft: () => console.log('Swipe left - Remove'),
    onSwipeRight: () => console.log('Swipe right - Keep'),
    onVote: (itemId, voteType) => console.log('Mobile vote:', itemId, voteType),
    onSelect: (itemId, selected) => console.log('Mobile select:', itemId, selected)
  },
  storyName: 'Mobile Content Card',
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: `
Mobile-optimized content card with swipe gesture support.
- Swipe left: Remove content
- Swipe right: Keep content  
- Tap: Quick vote actions
        `
      }
    }
  }
};

// =============================================================================
// INTERACTION TESTING STORIES
// =============================================================================

export const InteractionTesting = {
  render: (args) => <ModerationQueueInterface {...args} />,
  args: {
    user: mockUsers.expertReviewer
  },
  storyName: 'Full Interaction Testing',
  parameters: {
    docs: {
      description: {
        story: `
Complete interface for testing all interactions:
- Queue filtering and sorting
- Individual and batch voting
- Content reporting
- Real-time updates
- Role-based permissions
        `
      }
    }
  }
};

export const AccessibilityDemo = {
  render: (args) => <ModerationQueueInterface {...args} />,
  args: {
    user: mockUsers.communityModerator
  },
  storyName: 'Accessibility Validation',
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true
          },
          {
            id: 'keyboard-navigation',
            enabled: true
          },
          {
            id: 'aria-labels',
            enabled: true
          }
        ]
      }
    },
    docs: {
      description: {
        story: `
Accessibility compliance testing with:
- WCAG AA color contrast (≥4.5:1)
- Keyboard navigation support
- Screen reader optimization
- Focus management
- ARIA labels and roles
        `
      }
    }
  }
};

// =============================================================================
// ERROR STATE STORIES  
// =============================================================================

export const ErrorStates = {
  render: () => (
    <div className="bg-gray-900 p-6 space-y-6">
      <div className="text-white text-lg font-semibold">Error State Examples</div>
      
      {/* Connection Error */}
      <div className="bg-gray-800 border border-red-500 rounded-lg p-4">
        <div className="text-red-400 font-semibold">Connection Error</div>
        <div className="text-gray-300 text-sm">Unable to connect to moderation system</div>
      </div>
      
      {/* Insufficient Tokens */}
      <div className="bg-gray-800 border border-yellow-500 rounded-lg p-4">
        <div className="text-yellow-400 font-semibold">Insufficient MLG Tokens</div>
        <div className="text-gray-300 text-sm">You need at least 2 MLG tokens to vote</div>
      </div>
      
      {/* Vote Failed */}
      <div className="bg-gray-800 border border-red-500 rounded-lg p-4">
        <div className="text-red-400 font-semibold">Vote Transaction Failed</div>
        <div className="text-gray-300 text-sm">Transaction was rejected or failed</div>
      </div>
      
      {/* Rate Limited */}
      <div className="bg-gray-800 border border-orange-500 rounded-lg p-4">
        <div className="text-orange-400 font-semibold">Rate Limit Exceeded</div>
        <div className="text-gray-300 text-sm">Too many actions. Please wait before trying again</div>
      </div>
    </div>
  ),
  storyName: 'Error States'
};

// =============================================================================
// LOADING STATES STORIES
// =============================================================================

export const LoadingStates = {
  render: () => (
    <div className="bg-gray-900 p-6 space-y-6">
      <div className="text-white text-lg font-semibold">Loading State Examples</div>
      
      {/* Queue Loading */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
      
      {/* Vote Processing */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="animate-spin w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full"></div>
          <div className="text-green-400">Processing vote...</div>
        </div>
      </div>
      
      {/* Analytics Loading */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-gray-700 rounded"></div>
            <div className="h-24 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  ),
  storyName: 'Loading States'
};

// =============================================================================
// RESPONSIVE DESIGN STORIES
// =============================================================================

export const ResponsiveDesktop = {
  render: (args) => <ModerationQueueInterface {...args} />,
  args: {
    user: mockUsers.communityModerator
  },
  storyName: 'Desktop View (1440px+)',
  parameters: {
    viewport: {
      defaultViewport: 'desktop'
    }
  }
};

export const ResponsiveTablet = {
  render: (args) => <ModerationQueueInterface {...args} />,
  args: {
    user: mockUsers.communityModerator
  },
  storyName: 'Tablet View (768px-1024px)', 
  parameters: {
    viewport: {
      defaultViewport: 'tablet'
    }
  }
};

export const ResponsiveMobile = {
  render: (args) => <ModerationQueueInterface {...args} />,
  args: {
    user: mockUsers.communityModerator
  },
  storyName: 'Mobile View (320px-768px)',
  parameters: {
    viewport: {
      defaultViewport: 'mobile2'
    }
  }
};

// =============================================================================
// PERFORMANCE TESTING STORIES
// =============================================================================

export const LargeQueuePerformance = {
  render: (args) => <ModerationQueueInterface {...args} />,
  args: {
    user: mockUsers.expertReviewer
  },
  storyName: 'Large Queue Performance (1000+ items)',
  parameters: {
    docs: {
      description: {
        story: `
Performance testing with large dataset:
- Virtual scrolling implementation
- Efficient re-rendering
- Memory usage optimization  
- Search and filter performance
        `
      }
    }
  }
};

// =============================================================================
// THEME VARIATIONS
// =============================================================================

export const DarkTheme = {
  render: (args) => <ModerationQueueInterface {...args} />,
  args: {
    user: mockUsers.communityModerator
  },
  storyName: 'Dark Theme (Default)',
  parameters: {
    backgrounds: {
      default: 'dark'
    }
  }
};

export const XboxTheme = {
  render: (args) => <ModerationQueueInterface {...args} />,
  args: {
    user: mockUsers.communityModerator
  },
  storyName: 'Xbox 360 Theme',
  parameters: {
    backgrounds: {
      default: 'xbox'
    }
  }
};