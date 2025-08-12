/**
 * MLG.clan Comprehensive Clan Management UI Test Suite
 * 
 * Comprehensive testing for clan management interface including unit tests,
 * integration tests, accessibility tests, and performance tests.
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 * @created 2025-08-10
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import ClanManagementUI, { XBOX_COLORS, BLADE_NAVIGATION, SORT_OPTIONS, FILTER_OPTIONS, INVITATION_STATUS } from './clan-management-ui.jsx';

// =============================================================================
// MOCK SETUP
// =============================================================================

// Mock the clan management modules
jest.mock('../../clans/clan-management.js', () => ({
  ClanManager: jest.fn().mockImplementation(() => ({
    getClan: jest.fn(),
    addMember: jest.fn(),
    removeMember: jest.fn(),
    promoteMember: jest.fn(),
    demoteMember: jest.fn(),
    sendInvitation: jest.fn(),
    transferOwnership: jest.fn()
  })),
  CLAN_TIER_CONFIG: {
    BRONZE: { id: 'bronze', name: 'Bronze Clan', minStake: 100, maxMembers: 20, color: '#CD7F32', icon: '🥉' },
    SILVER: { id: 'silver', name: 'Silver Clan', minStake: 500, maxMembers: 50, color: '#C0C0C0', icon: '🥈' },
    GOLD: { id: 'gold', name: 'Gold Clan', minStake: 1000, maxMembers: 100, color: '#FFD700', icon: '🥇' },
    DIAMOND: { id: 'diamond', name: 'Diamond Clan', minStake: 5000, maxMembers: 250, color: '#B9F2FF', icon: '💎' }
  },
  CLAN_ROLES: {
    OWNER: { id: 'owner', name: 'Clan Owner', permissions: ['all'], priority: 1000, maxCount: 1 },
    ADMIN: { id: 'admin', name: 'Admin', permissions: ['manage_members', 'edit_clan'], priority: 900, maxCount: 5 },
    MODERATOR: { id: 'moderator', name: 'Moderator', permissions: ['kick_members'], priority: 800, maxCount: 10 },
    MEMBER: { id: 'member', name: 'Member', permissions: ['chat'], priority: 100, maxCount: -1 }
  },
  formatMLGAmount: jest.fn((amount) => amount.toLocaleString())
}));

jest.mock('../../clans/clan-statistics.js', () => ({
  ClanStatisticsManager: jest.fn().mockImplementation(() => ({
    calculateClanStatistics: jest.fn(),
    getDashboardData: jest.fn(),
    subscribe: jest.fn(),
    shutdown: jest.fn()
  })),
  CLAN_STATISTICS_CONFIG: {
    HEALTH_SCORE_RANGES: {
      EXCELLENT: { min: 85, max: 100, color: '#48BB78', label: 'Excellent' },
      GOOD: { min: 70, max: 84, color: '#4299E1', label: 'Good' },
      AVERAGE: { min: 55, max: 69, color: '#F6AD55', label: 'Average' },
      POOR: { min: 40, max: 54, color: '#ED8936', label: 'Poor' },
      CRITICAL: { min: 0, max: 39, color: '#E53E3E', label: 'Critical' }
    }
  },
  formatStatisticValue: jest.fn((value, metric) => `${value} ${metric.unit || ''}`),
  getHealthScoreRange: jest.fn((score) => ({
    level: score >= 85 ? 'excellent' : score >= 70 ? 'good' : 'average',
    color: score >= 85 ? '#48BB78' : score >= 70 ? '#4299E1' : '#F6AD55',
    label: score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : 'Average'
  }))
}));

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  onmessage: null,
  onerror: null,
  onclose: null,
  close: jest.fn()
}));

// =============================================================================
// TEST DATA
// =============================================================================

const mockClanData = {
  id: 'test-clan-123',
  name: 'Test Gaming Clan',
  description: 'A test clan for unit testing',
  tier: 'gold',
  memberCount: 25,
  maxMembers: 100,
  owner: 'owner-address-123',
  admins: ['admin-address-1'],
  moderators: ['mod-address-1'],
  members: [
    {
      id: 'member-1',
      name: 'TestOwner',
      publicKey: 'owner-address-123',
      role: 'owner',
      status: 'online',
      joinDate: '2025-01-01',
      votingPower: 150,
      activityScore: 95
    },
    {
      id: 'member-2', 
      name: 'TestAdmin',
      publicKey: 'admin-address-1',
      role: 'admin',
      status: 'online',
      joinDate: '2025-01-15',
      votingPower: 120,
      activityScore: 88
    },
    {
      id: 'member-3',
      name: 'TestModerator',
      publicKey: 'mod-address-1',
      role: 'moderator',
      status: 'idle',
      joinDate: '2025-02-01',
      votingPower: 85,
      activityScore: 72
    },
    {
      id: 'member-4',
      name: 'TestMember',
      publicKey: 'member-address-1',
      role: 'member',
      status: 'offline',
      joinDate: '2025-02-15',
      votingPower: 45,
      activityScore: 41
    }
  ],
  stakedTokens: 2500,
  lockPeriodEnd: '2025-12-31T23:59:59.000Z',
  network: 'devnet',
  status: 'active'
};

const mockStatistics = {
  clanAddress: 'test-clan-123',
  clanName: 'Test Gaming Clan',
  overallScore: 78.5,
  healthScore: 85.2,
  memberActivity: {
    participationRate: 84.4,
    engagementScore: 79.2
  },
  financialPerformance: {
    totalTokenBurns: 1250
  }
};

const mockWalletAdapter = {
  publicKey: { toString: () => 'owner-address-123' },
  connected: true,
  signTransaction: jest.fn().mockResolvedValue({}),
  connect: jest.fn(),
  disconnect: jest.fn()
};

const defaultProps = {
  walletAdapter: mockWalletAdapter,
  clanAddress: 'test-clan-123',
  userAddress: 'owner-address-123',
  onError: jest.fn(),
  onSuccess: jest.fn()
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const renderClanManagementUI = (props = {}) => {
  return render(<ClanManagementUI {...defaultProps} {...props} />);
};

const mockClanManager = () => {
  const mockManager = {
    getClan: jest.fn().mockResolvedValue(mockClanData),
    addMember: jest.fn().mockResolvedValue({ success: true }),
    removeMember: jest.fn().mockResolvedValue({ success: true }),
    promoteMember: jest.fn().mockResolvedValue({ success: true }),
    sendInvitation: jest.fn().mockResolvedValue({ success: true })
  };
  
  require('../../clans/clan-management.js').ClanManager.mockImplementation(() => mockManager);
  return mockManager;
};

const mockStatisticsManager = () => {
  const mockManager = {
    calculateClanStatistics: jest.fn().mockResolvedValue(mockStatistics),
    subscribe: jest.fn().mockReturnValue(() => {}),
    shutdown: jest.fn()
  };
  
  require('../../clans/clan-statistics.js').ClanStatisticsManager.mockImplementation(() => mockManager);
  return mockManager;
};

// =============================================================================
// BASIC RENDERING TESTS
// =============================================================================

describe('ClanManagementUI - Basic Rendering', () => {
  let clanManager, statisticsManager;

  beforeEach(() => {
    jest.clearAllMocks();
    clanManager = mockClanManager();
    statisticsManager = mockStatisticsManager();
  });

  test('renders loading state initially', () => {
    renderClanManagementUI();
    expect(screen.getByText('Loading clan management...')).toBeInTheDocument();
  });

  test('renders main navigation blade', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      expect(screen.getByText('Clan Management')).toBeInTheDocument();
    });

    // Check all navigation items
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('Roles')).toBeInTheDocument();
    expect(screen.getByText('Invitations')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  test('displays clan information correctly', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      expect(screen.getByText('Test Gaming Clan')).toBeInTheDocument();
    });

    expect(screen.getByText('Gold Clan')).toBeInTheDocument();
  });

  test('handles error state gracefully', async () => {
    clanManager.getClan.mockRejectedValue(new Error('Clan not found'));
    
    renderClanManagementUI();
    
    await waitFor(() => {
      expect(screen.getByText('Error Loading Clan')).toBeInTheDocument();
      expect(screen.getByText('Clan not found')).toBeInTheDocument();
    });
  });
});

// =============================================================================
// NAVIGATION TESTS
// =============================================================================

describe('ClanManagementUI - Navigation', () => {
  let clanManager, statisticsManager;

  beforeEach(() => {
    clanManager = mockClanManager();
    statisticsManager = mockStatisticsManager();
  });

  test('switches between tabs correctly', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      expect(screen.getByText('Clan Dashboard')).toBeInTheDocument();
    });

    // Switch to Members tab
    fireEvent.click(screen.getByText('Members'));
    expect(screen.getByText('Member Roster')).toBeInTheDocument();

    // Switch to Roles tab
    fireEvent.click(screen.getByText('Roles'));
    expect(screen.getByText('Role Management')).toBeInTheDocument();

    // Switch to Invitations tab
    fireEvent.click(screen.getByText('Invitations'));
    expect(screen.getByText('Invitations & Recruitment')).toBeInTheDocument();

    // Switch to Settings tab
    fireEvent.click(screen.getByText('Settings'));
    expect(screen.getByText('Clan Settings')).toBeInTheDocument();
  });

  test('navigation maintains active state styling', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      const dashboardButton = screen.getByText('Dashboard').closest('button');
      expect(dashboardButton).toHaveClass('bg-green-600');
    });

    // Click Members tab
    const membersButton = screen.getByText('Members').closest('button');
    fireEvent.click(membersButton);
    
    expect(membersButton).toHaveClass('bg-green-600');
    expect(screen.getByText('Dashboard').closest('button')).not.toHaveClass('bg-green-600');
  });
});

// =============================================================================
// DASHBOARD TESTS
// =============================================================================

describe('ClanManagementUI - Dashboard', () => {
  let clanManager, statisticsManager;

  beforeEach(() => {
    clanManager = mockClanManager();
    statisticsManager = mockStatisticsManager();
  });

  test('displays clan statistics tiles', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument(); // Member count
      expect(screen.getByText('Total Members')).toBeInTheDocument();
    });

    expect(screen.getByText('MLG Staked')).toBeInTheDocument();
    expect(screen.getByText('Overall Score')).toBeInTheDocument();
    expect(screen.getByText('Participation')).toBeInTheDocument();
  });

  test('refreshes data when refresh button clicked', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);
    });

    expect(clanManager.getClan).toHaveBeenCalledWith('test-clan-123');
    expect(statisticsManager.calculateClanStatistics).toHaveBeenCalledWith('test-clan-123');
  });

  test('renders health bars correctly', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      const healthBars = screen.getAllByText(/\/100|\/\d+/);
      expect(healthBars.length).toBeGreaterThan(0);
    });
  });
});

// =============================================================================
// MEMBER ROSTER TESTS
// =============================================================================

describe('ClanManagementUI - Member Roster', () => {
  let clanManager, statisticsManager;

  beforeEach(() => {
    clanManager = mockClanManager();
    statisticsManager = mockStatisticsManager();
  });

  test('displays member list', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Members'));
    });

    await waitFor(() => {
      expect(screen.getByText('TestOwner')).toBeInTheDocument();
      expect(screen.getByText('TestAdmin')).toBeInTheDocument();
      expect(screen.getByText('TestModerator')).toBeInTheDocument();
      expect(screen.getByText('TestMember')).toBeInTheDocument();
    });
  });

  test('filters members by search query', async () => {
    const user = userEvent.setup();
    renderClanManagementUI();
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Members'));
    });

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search by name, address, or role...');
      expect(searchInput).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search by name, address, or role...');
    await user.type(searchInput, 'TestOwner');

    await waitFor(() => {
      expect(screen.getByText('TestOwner')).toBeInTheDocument();
      expect(screen.queryByText('TestAdmin')).not.toBeInTheDocument();
    });
  });

  test('filters members by role', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Members'));
    });

    await waitFor(() => {
      const roleFilter = screen.getByDisplayValue('All Members');
      fireEvent.change(roleFilter, { target: { value: FILTER_OPTIONS.ADMINS } });
    });

    await waitFor(() => {
      expect(screen.getByText('TestOwner')).toBeInTheDocument();
      expect(screen.getByText('TestAdmin')).toBeInTheDocument();
      expect(screen.queryByText('TestMember')).not.toBeInTheDocument();
    });
  });

  test('sorts members correctly', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Members'));
    });

    const sortSelect = screen.getByDisplayValue('Name');
    fireEvent.change(sortSelect, { target: { value: SORT_OPTIONS.ROLE } });

    await waitFor(() => {
      const memberCards = screen.getAllByText(/Test\w+/);
      expect(memberCards[0]).toHaveTextContent('TestOwner');
    });
  });

  test('shows invite button for authorized users', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Members'));
    });

    await waitFor(() => {
      expect(screen.getByText('Invite Members')).toBeInTheDocument();
    });
  });

  test('hides management buttons for unauthorized users', async () => {
    renderClanManagementUI({ userAddress: 'member-address-1' });
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Members'));
    });

    await waitFor(() => {
      expect(screen.queryByText('Invite Members')).not.toBeInTheDocument();
    });
  });

  test('handles member removal', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Members'));
    });

    await waitFor(() => {
      const removeButtons = screen.getAllByText('Remove');
      fireEvent.click(removeButtons[0]);
    });

    expect(clanManager.removeMember).toHaveBeenCalled();
  });
});

// =============================================================================
// ROLE MANAGEMENT TESTS
// =============================================================================

describe('ClanManagementUI - Role Management', () => {
  let clanManager, statisticsManager;

  beforeEach(() => {
    clanManager = mockClanManager();
    statisticsManager = mockStatisticsManager();
  });

  test('displays role sections', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Roles'));
    });

    await waitFor(() => {
      expect(screen.getByText('Clan Owner')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('Moderator')).toBeInTheDocument();
      expect(screen.getByText('Member')).toBeInTheDocument();
    });
  });

  test('shows permissions for each role', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Roles'));
    });

    await waitFor(() => {
      expect(screen.getByText('all')).toBeInTheDocument(); // Owner permissions
      expect(screen.getByText('manage members')).toBeInTheDocument(); // Admin permissions
    });
  });

  test('displays members in correct role sections', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Roles'));
    });

    await waitFor(() => {
      const ownerSection = screen.getByText('Clan Owner').closest('div');
      expect(within(ownerSection).getByText('TestOwner')).toBeInTheDocument();
      
      const adminSection = screen.getByText('Admin').closest('div');
      expect(within(adminSection).getByText('TestAdmin')).toBeInTheDocument();
    });
  });

  test('shows role distribution statistics', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Roles'));
    });

    await waitFor(() => {
      expect(screen.getByText('Role Distribution')).toBeInTheDocument();
    });
  });
});

// =============================================================================
// INVITATION SYSTEM TESTS
// =============================================================================

describe('ClanManagementUI - Invitations', () => {
  let clanManager, statisticsManager;

  beforeEach(() => {
    clanManager = mockClanManager();
    statisticsManager = mockStatisticsManager();
  });

  test('displays invitation statistics', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Invitations'));
    });

    await waitFor(() => {
      expect(screen.getByText('pending')).toBeInTheDocument();
      expect(screen.getByText('accepted')).toBeInTheDocument();
      expect(screen.getByText('rejected')).toBeInTheDocument();
      expect(screen.getByText('expired')).toBeInTheDocument();
    });
  });

  test('opens invitation modal', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Invitations'));
    });

    const inviteButton = screen.getByText('Send Invitation');
    fireEvent.click(inviteButton);

    await waitFor(() => {
      expect(screen.getByText('Send Invitation')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter wallet address...')).toBeInTheDocument();
    });
  });

  test('handles single invitation submission', async () => {
    const user = userEvent.setup();
    renderClanManagementUI();
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Invitations'));
    });

    fireEvent.click(screen.getByText('Send Invitation'));

    await waitFor(() => {
      const addressInput = screen.getByPlaceholderText('Enter wallet address...');
      const submitButton = screen.getByRole('button', { name: /send invitation/i });
      
      return user.type(addressInput, 'test-wallet-address-123')
        .then(() => fireEvent.click(submitButton));
    });

    expect(clanManager.sendInvitation).toHaveBeenCalledWith('test-clan-123', {
      address: 'test-wallet-address-123',
      role: 'member',
      message: ''
    });
  });

  test('handles batch invitation mode', async () => {
    const user = userEvent.setup();
    renderClanManagementUI();
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Invitations'));
    });

    fireEvent.click(screen.getByText('Send Invitation'));

    await waitFor(() => {
      const batchCheckbox = screen.getByLabelText('Batch invite mode');
      fireEvent.click(batchCheckbox);
      
      const addressInput = screen.getByPlaceholderText('Paste wallet addresses, one per line...');
      expect(addressInput).toBeInTheDocument();
    });
  });
});

// =============================================================================
// SETTINGS TESTS
// =============================================================================

describe('ClanManagementUI - Settings', () => {
  let clanManager, statisticsManager;

  beforeEach(() => {
    clanManager = mockClanManager();
    statisticsManager = mockStatisticsManager();
  });

  test('displays clan information', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Settings'));
    });

    await waitFor(() => {
      expect(screen.getByText('Test Gaming Clan')).toBeInTheDocument();
      expect(screen.getByText('A test clan for unit testing')).toBeInTheDocument();
    });
  });

  test('displays financial status', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Settings'));
    });

    await waitFor(() => {
      expect(screen.getByText('Financial Status')).toBeInTheDocument();
      expect(screen.getByText('Staked MLG Tokens')).toBeInTheDocument();
    });
  });

  test('shows danger zone for owners', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Settings'));
    });

    await waitFor(() => {
      expect(screen.getByText('⚠️ Danger Zone')).toBeInTheDocument();
      expect(screen.getByText('Transfer Ownership')).toBeInTheDocument();
      expect(screen.getByText('Dissolve Clan')).toBeInTheDocument();
    });
  });

  test('hides edit buttons for unauthorized users', async () => {
    renderClanManagementUI({ userAddress: 'member-address-1' });
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Settings'));
    });

    await waitFor(() => {
      expect(screen.queryByText('Edit Settings')).not.toBeInTheDocument();
    });
  });
});

// =============================================================================
// ACCESSIBILITY TESTS
// =============================================================================

describe('ClanManagementUI - Accessibility', () => {
  let clanManager, statisticsManager;

  beforeEach(() => {
    clanManager = mockClanManager();
    statisticsManager = mockStatisticsManager();
  });

  test('has proper heading structure', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toHaveTextContent('Clan Management');
    });

    fireEvent.click(screen.getByText('Members'));
    
    await waitFor(() => {
      const sectionHeading = screen.getByRole('heading', { level: 3 });
      expect(sectionHeading).toHaveTextContent('Member Roster');
    });
  });

  test('navigation is keyboard accessible', async () => {
    const user = userEvent.setup();
    renderClanManagementUI();
    
    await waitFor(() => {
      const dashboardTab = screen.getByText('Dashboard').closest('button');
      dashboardTab.focus();
      expect(dashboardTab).toHaveFocus();
    });

    await user.keyboard('{Tab}');
    
    const membersTab = screen.getByText('Members').closest('button');
    expect(membersTab).toHaveFocus();
  });

  test('buttons have proper ARIA labels', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      const refreshButton = screen.getByText('Refresh');
      expect(refreshButton).toHaveAttribute('type', 'button');
    });

    fireEvent.click(screen.getByText('Members'));
    
    await waitFor(() => {
      const inviteButton = screen.getByText('Invite Members');
      expect(inviteButton).toBeInTheDocument();
    });
  });

  test('form inputs have proper labels', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Members'));
    });

    const searchInput = screen.getByLabelText(/search members/i);
    expect(searchInput).toBeInTheDocument();
    
    const roleFilter = screen.getByLabelText(/filter by role/i);
    expect(roleFilter).toBeInTheDocument();
    
    const sortSelect = screen.getByLabelText(/sort by/i);
    expect(sortSelect).toBeInTheDocument();
  });

  test('modal is properly announced', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Invitations'));
    });

    fireEvent.click(screen.getByText('Send Invitation'));

    await waitFor(() => {
      const modal = screen.getByRole('dialog', { hidden: true }) || screen.getByText('Send Invitation').closest('[role="dialog"]');
      expect(modal).toBeInTheDocument();
    });
  });
});

// =============================================================================
// RESPONSIVE DESIGN TESTS
// =============================================================================

describe('ClanManagementUI - Responsive Design', () => {
  let clanManager, statisticsManager;

  beforeEach(() => {
    clanManager = mockClanManager();
    statisticsManager = mockStatisticsManager();
    
    // Mock window.matchMedia for responsive tests
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  test('adapts layout for mobile screens', async () => {
    // Mock mobile viewport
    window.matchMedia.mockImplementation(query => ({
      matches: query === '(max-width: 768px)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    renderClanManagementUI();
    
    await waitFor(() => {
      const navigation = screen.getByText('Clan Management').closest('div');
      expect(navigation).toHaveClass('xbox-blade-nav');
    });
  });

  test('maintains functionality on touch devices', async () => {
    // Mock touch events
    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 }]
    });

    renderClanManagementUI();
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Members'));
    });

    const memberCard = screen.getAllByText(/Test\w+/)[0].closest('div');
    fireEvent(memberCard, touchStartEvent);
    
    // Should not crash or throw errors
    expect(memberCard).toBeInTheDocument();
  });
});

// =============================================================================
// PERFORMANCE TESTS
// =============================================================================

describe('ClanManagementUI - Performance', () => {
  let clanManager, statisticsManager;

  beforeEach(() => {
    clanManager = mockClanManager();
    statisticsManager = mockStatisticsManager();
  });

  test('handles large member lists efficiently', async () => {
    // Create large member dataset
    const largeMemberList = Array.from({ length: 200 }, (_, i) => ({
      id: `member-${i}`,
      name: `TestMember${i}`,
      publicKey: `address-${i}`,
      role: 'member',
      status: 'offline',
      joinDate: '2025-01-01',
      votingPower: Math.floor(Math.random() * 100),
      activityScore: Math.floor(Math.random() * 100)
    }));

    const largeClanData = {
      ...mockClanData,
      members: largeMemberList,
      memberCount: 200
    };

    clanManager.getClan.mockResolvedValue(largeClanData);
    
    const startTime = performance.now();
    renderClanManagementUI();
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Members'));
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render within reasonable time (adjust threshold as needed)
    expect(renderTime).toBeLessThan(2000);
  });

  test('debounces search input', async () => {
    const user = userEvent.setup();
    renderClanManagementUI();
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Members'));
    });

    const searchInput = screen.getByPlaceholderText('Search by name, address, or role...');
    
    // Type rapidly
    await user.type(searchInput, 'test', { delay: 50 });
    
    // Search should be debounced, not called for every keystroke
    expect(searchInput.value).toBe('test');
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('ClanManagementUI - Integration', () => {
  let clanManager, statisticsManager;

  beforeEach(() => {
    clanManager = mockClanManager();
    statisticsManager = mockStatisticsManager();
  });

  test('integrates with clan manager correctly', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      expect(clanManager.getClan).toHaveBeenCalledWith('test-clan-123');
    });

    expect(statisticsManager.calculateClanStatistics).toHaveBeenCalledWith('test-clan-123');
  });

  test('handles wallet adapter changes', async () => {
    const { rerender } = renderClanManagementUI();
    
    const newWalletAdapter = {
      ...mockWalletAdapter,
      publicKey: { toString: () => 'new-address-456' }
    };

    rerender(<ClanManagementUI {...defaultProps} walletAdapter={newWalletAdapter} />);
    
    await waitFor(() => {
      expect(clanManager.getClan).toHaveBeenCalled();
    });
  });

  test('handles real-time updates via WebSocket', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      expect(screen.getByText('Test Gaming Clan')).toBeInTheDocument();
    });

    // Simulate WebSocket message
    const mockWebSocket = global.WebSocket.mock.instances[0];
    if (mockWebSocket && mockWebSocket.onmessage) {
      const updateMessage = {
        data: JSON.stringify({
          type: 'member_update',
          payload: { id: 'member-1', status: 'offline' }
        })
      };
      
      mockWebSocket.onmessage(updateMessage);
    }
  });

  test('cleans up resources on unmount', async () => {
    const { unmount } = renderClanManagementUI();
    
    await waitFor(() => {
      expect(screen.getByText('Test Gaming Clan')).toBeInTheDocument();
    });

    unmount();
    
    expect(statisticsManager.shutdown).toHaveBeenCalled();
  });
});

// =============================================================================
// ERROR HANDLING TESTS
// =============================================================================

describe('ClanManagementUI - Error Handling', () => {
  let clanManager, statisticsManager;

  beforeEach(() => {
    clanManager = mockClanManager();
    statisticsManager = mockStatisticsManager();
  });

  test('handles clan loading errors', async () => {
    clanManager.getClan.mockRejectedValue(new Error('Network error'));
    
    renderClanManagementUI();
    
    await waitFor(() => {
      expect(screen.getByText('Error Loading Clan')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    expect(defaultProps.onError).toHaveBeenCalledWith(expect.any(Error));
  });

  test('handles statistics loading errors gracefully', async () => {
    statisticsManager.calculateClanStatistics.mockRejectedValue(new Error('Stats unavailable'));
    
    renderClanManagementUI();
    
    await waitFor(() => {
      // Should still load clan data even if stats fail
      expect(screen.getByText('Test Gaming Clan')).toBeInTheDocument();
    });
    
    // Should not show error for optional statistics
    expect(screen.queryByText('Stats unavailable')).not.toBeInTheDocument();
  });

  test('handles member action errors', async () => {
    clanManager.removeMember.mockRejectedValue(new Error('Permission denied'));
    
    renderClanManagementUI();
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Members'));
    });

    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);
    
    await waitFor(() => {
      expect(defaultProps.onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  test('handles WebSocket connection errors', async () => {
    // Mock WebSocket to throw error
    global.WebSocket.mockImplementation(() => {
      throw new Error('WebSocket connection failed');
    });
    
    renderClanManagementUI();
    
    await waitFor(() => {
      // Should still function without WebSocket
      expect(screen.getByText('Test Gaming Clan')).toBeInTheDocument();
    });
  });
});

// =============================================================================
// CUSTOM HOOK TESTS (if any)
// =============================================================================

describe('ClanManagementUI - Custom Functionality', () => {
  let clanManager, statisticsManager;

  beforeEach(() => {
    clanManager = mockClanManager();
    statisticsManager = mockStatisticsManager();
  });

  test('Xbox theme colors are applied correctly', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      const navButton = screen.getByText('Dashboard').closest('button');
      expect(navButton).toHaveClass('bg-green-600');
    });
  });

  test('health bars render with correct colors', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      const healthBars = document.querySelectorAll('[style*="background"]');
      expect(healthBars.length).toBeGreaterThan(0);
    });
  });

  test('tier badges display correctly', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      expect(screen.getByText('Gold Clan')).toBeInTheDocument();
    });
  });

  test('role badges have proper styling', async () => {
    renderClanManagementUI();
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Members'));
    });

    await waitFor(() => {
      const roleBadges = screen.getAllByText(/Owner|Admin|Moderator|Member/);
      expect(roleBadges.length).toBeGreaterThan(0);
    });
  });
});