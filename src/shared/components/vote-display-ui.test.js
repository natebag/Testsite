/**
 * MLG.clan Vote Display UI System - Test Suite
 * 
 * Comprehensive test suite for the real-time vote display system.
 * Tests all components, real-time updates, error handling, and accessibility.
 */

import { jest } from '@jest/globals';
// Mock the Solana voting system import to avoid dependency issues
jest.mock('../../voting/solana-voting-system.js', () => ({
  SolanaVotingSystem: jest.fn()
}));

import VoteDisplaySystem, { VoteDisplayUtils } from './vote-display-ui.js';

// Mock DOM environment for testing
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;
global.HTMLElement = dom.window.HTMLElement;

// Mock Solana Web3.js
const mockConnection = {
  getAccountInfo: jest.fn(),
  confirmTransaction: jest.fn(),
  sendTransaction: jest.fn()
};

const mockWallet = {
  publicKey: {
    toBase58: () => 'TestWallet123456789abcdef'
  },
  signTransaction: jest.fn(),
  signAllTransactions: jest.fn()
};

const mockVotingSystem = {
  connection: mockConnection,
  initialize: jest.fn(),
  getUserDailyAllocation: jest.fn(),
  getMLGBalance: jest.fn(),
  getUserReputation: jest.fn(),
  castFreeVote: jest.fn(),
  castTokenVote: jest.fn()
};

describe('VoteDisplaySystem', () => {
  let voteDisplaySystem;
  
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    
    // Create fresh instance
    voteDisplaySystem = new VoteDisplaySystem({
      onVoteUpdated: jest.fn(),
      onNetworkStatusChange: jest.fn(),
      onError: jest.fn()
    });
    
    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (voteDisplaySystem) {
      voteDisplaySystem.destroy();
    }
  });

  describe('Initialization', () => {
    test('should initialize successfully with valid parameters', async () => {
      mockVotingSystem.initialize.mockResolvedValue({ success: true });
      mockVotingSystem.getUserDailyAllocation.mockResolvedValue({ remaining: 1, total: 1 });
      mockVotingSystem.getMLGBalance.mockResolvedValue(45);

      const result = await voteDisplaySystem.initialize(mockVotingSystem, mockWallet);
      
      expect(result.success).toBe(true);
      expect(voteDisplaySystem.votingSystem).toBe(mockVotingSystem);
      expect(voteDisplaySystem.wallet).toBe(mockWallet);
    });

    test('should handle initialization errors gracefully', async () => {
      mockVotingSystem.initialize.mockRejectedValue(new Error('Connection failed'));

      await expect(voteDisplaySystem.initialize(mockVotingSystem, mockWallet))
        .rejects.toThrow('Connection failed');
    });

    test('should initialize CSS styles', () => {
      voteDisplaySystem.initializeCSS();
      
      const styleElement = document.getElementById('vote-display-styles');
      expect(styleElement).toBeTruthy();
      expect(styleElement.textContent).toContain('--vote-primary: #10b981');
    });

    test('should not duplicate CSS styles on multiple calls', () => {
      voteDisplaySystem.initializeCSS();
      voteDisplaySystem.initializeCSS();
      
      const styleElements = document.querySelectorAll('#vote-display-styles');
      expect(styleElements.length).toBe(1);
    });
  });

  describe('Compact Vote Display', () => {
    test('should create compact vote display with correct structure', () => {
      const contentId = 'test-clip-1';
      const display = voteDisplaySystem.createCompactVoteDisplay(contentId);
      
      expect(display).toBeInstanceOf(HTMLElement);
      expect(display.className).toBe('vote-display-compact');
      expect(display.dataset.contentId).toBe(contentId);
      expect(display.getAttribute('role')).toBe('group');
      expect(display.getAttribute('aria-label')).toBe('Vote on this content');
    });

    test('should include all vote count badges', () => {
      const display = voteDisplaySystem.createCompactVoteDisplay('test-clip');
      
      const standardVotes = display.querySelector('.vote-badge.standard-votes');
      const mlgVotes = display.querySelector('.vote-badge.mlg-votes');
      const likes = display.querySelector('.vote-badge.likes');
      
      expect(standardVotes).toBeTruthy();
      expect(mlgVotes).toBeTruthy();
      expect(likes).toBeTruthy();
    });

    test('should include voting buttons when enabled', () => {
      const display = voteDisplaySystem.createCompactVoteDisplay('test-clip', {
        enableVoting: true
      });
      
      const freeVoteBtn = display.querySelector('.vote-btn.free-vote');
      const mlgVoteBtn = display.querySelector('.vote-btn.mlg-vote');
      
      expect(freeVoteBtn).toBeTruthy();
      expect(mlgVoteBtn).toBeTruthy();
      expect(freeVoteBtn.dataset.type).toBe('free');
      expect(mlgVoteBtn.dataset.type).toBe('mlg');
    });

    test('should hide voting buttons when disabled', () => {
      const display = voteDisplaySystem.createCompactVoteDisplay('test-clip', {
        enableVoting: false
      });
      
      const voteActions = display.querySelector('.vote-actions');
      expect(voteActions).toBeFalsy();
    });

    test('should include accessibility features', () => {
      const contentId = 'test-clip';
      const display = voteDisplaySystem.createCompactVoteDisplay(contentId);
      
      const voteCountsDisplay = display.querySelector('.vote-counts-display');
      expect(voteCountsDisplay.getAttribute('aria-live')).toBe('polite');
      
      const helpText = display.querySelector(`#free-vote-help-${contentId}`);
      expect(helpText).toBeTruthy();
      expect(helpText.className).toContain('sr-only');
    });

    test('should register component and add to active content', () => {
      const contentId = 'test-clip';
      const display = voteDisplaySystem.createCompactVoteDisplay(contentId);
      
      expect(voteDisplaySystem.compactDisplays.get(contentId)).toBe(display);
      expect(voteDisplaySystem.activeContent.has(contentId)).toBe(true);
    });
  });

  describe('Detailed Vote Panel', () => {
    test('should create detailed vote panel with correct structure', () => {
      const contentId = 'test-clip-detailed';
      const panel = voteDisplaySystem.createDetailedVotePanel(contentId);
      
      expect(panel).toBeInstanceOf(HTMLElement);
      expect(panel.className).toBe('vote-panel-detailed');
      expect(panel.dataset.contentId).toBe(contentId);
    });

    test('should include vote statistics grid', () => {
      const panel = voteDisplaySystem.createDetailedVotePanel('test-clip');
      
      const statsGrid = panel.querySelector('.vote-stats-grid');
      expect(statsGrid).toBeTruthy();
      
      const statCards = panel.querySelectorAll('.vote-stat-card');
      expect(statCards.length).toBe(3); // standard, mlg, likes
    });

    test('should include user vote status section', () => {
      const panel = voteDisplaySystem.createDetailedVotePanel('test-clip', {
        showUserStatus: true
      });
      
      const userStatus = panel.querySelector('.user-vote-status');
      expect(userStatus).toBeTruthy();
      
      const statusItems = userStatus.querySelectorAll('.vote-status-item');
      expect(statusItems.length).toBeGreaterThan(0);
    });

    test('should include vote weight breakdown', () => {
      const panel = voteDisplaySystem.createDetailedVotePanel('test-clip', {
        showVoteWeight: true
      });
      
      const weightBreakdown = panel.querySelector('.vote-weight-breakdown');
      expect(weightBreakdown).toBeTruthy();
      
      const weightItems = weightBreakdown.querySelectorAll('.weight-item');
      expect(weightItems.length).toBeGreaterThan(0);
    });

    test('should include detailed voting actions', () => {
      const panel = voteDisplaySystem.createDetailedVotePanel('test-clip');
      
      const voteActions = panel.querySelector('.vote-actions-detailed');
      expect(voteActions).toBeTruthy();
      
      const voteButtons = voteActions.querySelectorAll('.vote-btn-large');
      expect(voteButtons.length).toBe(3); // free, mlg, modal
    });
  });

  describe('Voting Modal', () => {
    test('should create voting modal with correct structure', () => {
      const contentId = 'test-clip-modal';
      const modal = voteDisplaySystem.createVotingModal(contentId);
      
      expect(modal).toBeInstanceOf(HTMLElement);
      expect(modal.id).toBe(`vote-modal-${contentId}`);
      expect(modal.className).toBe('vote-modal-overlay');
      expect(modal.getAttribute('role')).toBe('dialog');
      expect(modal.getAttribute('aria-modal')).toBe('true');
    });

    test('should not create duplicate modals', () => {
      const contentId = 'test-clip-modal';
      document.body.appendChild(voteDisplaySystem.createVotingModal(contentId));
      
      const modal2 = voteDisplaySystem.createVotingModal(contentId);
      expect(modal2.id).toBe(`vote-modal-${contentId}`);
      
      const modals = document.querySelectorAll(`#vote-modal-${contentId}`);
      expect(modals.length).toBe(1);
    });

    test('should include free vote option', () => {
      const modal = voteDisplaySystem.createVotingModal('test-clip');
      
      const freeOption = modal.querySelector('.free-vote-option');
      expect(freeOption).toBeTruthy();
      
      const freeBtn = modal.querySelector('.vote-option-btn.free-vote');
      expect(freeBtn).toBeTruthy();
    });

    test('should include MLG token vote option', () => {
      const modal = voteDisplaySystem.createVotingModal('test-clip');
      
      const mlgOption = modal.querySelector('.mlg-vote-option');
      expect(mlgOption).toBeTruthy();
      
      const mlgBtn = modal.querySelector('.vote-option-btn.mlg-vote');
      expect(mlgBtn).toBeTruthy();
    });

    test('should include vote weight breakdown', () => {
      const modal = voteDisplaySystem.createVotingModal('test-clip');
      
      const weightSection = modal.querySelector('.vote-weight-modal-section');
      expect(weightSection).toBeTruthy();
      
      const calcRows = weightSection.querySelectorAll('.calc-row');
      expect(calcRows.length).toBeGreaterThan(0);
    });

    test('should show and hide modal correctly', () => {
      const contentId = 'test-modal';
      voteDisplaySystem.createVotingModal(contentId);
      
      voteDisplaySystem.showVotingModal(contentId);
      const modal = document.querySelector(`#vote-modal-${contentId}`);
      expect(modal.parentNode).toBe(document.body);
      expect(modal.classList.contains('show')).toBe(true);
      
      voteDisplaySystem.hideVotingModal(contentId);
      expect(modal.classList.contains('show')).toBe(false);
    });
  });

  describe('Real-Time Updates', () => {
    beforeEach(async () => {
      await voteDisplaySystem.initialize(mockVotingSystem, mockWallet);
    });

    test('should start real-time polling', async () => {
      expect(voteDisplaySystem.pollInterval).toBeTruthy();
      expect(voteDisplaySystem.backgroundPollInterval).toBeTruthy();
    });

    test('should update vote displays with new data', () => {
      const contentId = 'test-clip';
      const display = voteDisplaySystem.createCompactVoteDisplay(contentId);
      document.body.appendChild(display);
      
      const updates = [{
        contentId,
        standardVotes: 100,
        mlgVotes: 25,
        likes: 50
      }];
      
      voteDisplaySystem.updateVoteDisplays(updates);
      
      const standardCount = display.querySelector('[data-type="standard"]');
      const mlgCount = display.querySelector('[data-type="mlg"]');
      const likesCount = display.querySelector('[data-type="likes"]');
      
      expect(standardCount.textContent).toBe('100');
      expect(mlgCount.textContent).toBe('25');
      expect(likesCount.textContent).toBe('50');
    });

    test('should animate count updates', () => {
      const element = document.createElement('span');
      element.textContent = '10';
      document.body.appendChild(element);
      
      voteDisplaySystem.updateCountWithAnimation(element, 15);
      
      expect(element.textContent).toBe('15');
      expect(element.classList.contains('vote-count-update')).toBe(true);
    });

    test('should not update if count is the same', () => {
      const element = document.createElement('span');
      element.textContent = '10';
      const spy = jest.spyOn(element.classList, 'add');
      
      voteDisplaySystem.updateCountWithAnimation(element, 10);
      
      expect(spy).not.toHaveBeenCalled();
    });

    test('should cache vote data', () => {
      const contentId = 'test-clip';
      const updates = [{
        contentId,
        standardVotes: 100,
        mlgVotes: 25,
        likes: 50
      }];
      
      voteDisplaySystem.updateVoteDisplays(updates);
      
      const cached = voteDisplaySystem.voteCache.get(contentId);
      expect(cached.standardVotes).toBe(100);
      expect(cached.mlgVotes).toBe(25);
      expect(cached.likes).toBe(50);
      expect(cached.lastUpdated).toBeDefined();
    });
  });

  describe('Vote Actions', () => {
    beforeEach(async () => {
      await voteDisplaySystem.initialize(mockVotingSystem, mockWallet);
    });

    test('should handle free vote successfully', async () => {
      mockVotingSystem.castFreeVote.mockResolvedValue({ success: true, signature: 'test-sig' });
      
      const result = await voteDisplaySystem.handleVote('test-clip', 'free');
      
      expect(mockVotingSystem.castFreeVote).toHaveBeenCalledWith('test-clip');
      expect(result.success).toBe(true);
    });

    test('should handle MLG token vote successfully', async () => {
      mockVotingSystem.castTokenVote.mockResolvedValue({ success: true, signature: 'test-sig' });
      
      const result = await voteDisplaySystem.handleVote('test-clip', 'mlg');
      
      expect(mockVotingSystem.castTokenVote).toHaveBeenCalledWith('test-clip', 1);
      expect(result.success).toBe(true);
    });

    test('should handle vote errors', async () => {
      mockVotingSystem.castFreeVote.mockRejectedValue(new Error('Insufficient funds'));
      
      await expect(voteDisplaySystem.handleVote('test-clip', 'free'))
        .rejects.toThrow('Insufficient funds');
    });

    test('should show success animation after successful vote', async () => {
      mockVotingSystem.castFreeVote.mockResolvedValue({ success: true });
      const contentId = 'test-clip';
      
      // Create display with vote button
      const display = voteDisplaySystem.createCompactVoteDisplay(contentId);
      document.body.appendChild(display);
      
      await voteDisplaySystem.handleVote(contentId, 'free');
      
      const button = display.querySelector('[data-type="free"]');
      expect(button.classList.contains('vote-success')).toBe(true);
    });

    test('should show error animation after failed vote', async () => {
      mockVotingSystem.castFreeVote.mockRejectedValue(new Error('Vote failed'));
      const contentId = 'test-clip';
      
      const display = voteDisplaySystem.createCompactVoteDisplay(contentId);
      document.body.appendChild(display);
      
      try {
        await voteDisplaySystem.handleVote(contentId, 'free');
      } catch (error) {
        // Expected error
      }
      
      const button = display.querySelector('[data-type="free"]');
      expect(button.classList.contains('vote-error')).toBe(true);
    });
  });

  describe('Network Status', () => {
    test('should initialize with connecting status', () => {
      const newSystem = new VoteDisplaySystem();
      expect(newSystem.networkStatus).toBe('connecting');
    });

    test('should update network status indicators', () => {
      // Create elements to test
      const statusDot = document.createElement('span');
      statusDot.className = 'status-dot';
      const statusText = document.createElement('span');
      statusText.className = 'status-text';
      document.body.appendChild(statusDot);
      document.body.appendChild(statusText);
      
      voteDisplaySystem.networkStatus = 'connected';
      voteDisplaySystem.updateNetworkStatus();
      
      expect(statusDot.dataset.status).toBe('connected');
      expect(statusText.textContent).toBe('Network: Connected');
    });

    test('should handle polling errors', () => {
      const error = new Error('Network timeout');
      voteDisplaySystem.handlePollingError(error);
      
      expect(voteDisplaySystem.networkStatus).toBe('error');
    });

    test('should return correct network status text', () => {
      voteDisplaySystem.networkStatus = 'connected';
      expect(voteDisplaySystem.getNetworkStatusText()).toBe('Connected');
      
      voteDisplaySystem.networkStatus = 'connecting';
      expect(voteDisplaySystem.getNetworkStatusText()).toBe('Connecting...');
      
      voteDisplaySystem.networkStatus = 'error';
      expect(voteDisplaySystem.getNetworkStatusText()).toBe('Connection Lost');
    });
  });

  describe('User Data Management', () => {
    beforeEach(async () => {
      mockVotingSystem.getUserDailyAllocation.mockResolvedValue({ remaining: 1, total: 1 });
      mockVotingSystem.getMLGBalance.mockResolvedValue(45);
      mockVotingSystem.getUserReputation.mockResolvedValue({
        level: 3,
        clanOfficer: true,
        points: 2840
      });
      
      await voteDisplaySystem.initialize(mockVotingSystem, mockWallet);
    });

    test('should load user vote status', async () => {
      await voteDisplaySystem.loadUserVoteStatus('test-clip');
      
      expect(mockVotingSystem.getUserDailyAllocation).toHaveBeenCalled();
      expect(mockVotingSystem.getMLGBalance).toHaveBeenCalled();
      expect(mockVotingSystem.getUserReputation).toHaveBeenCalledWith(mockWallet.publicKey);
    });

    test('should calculate vote weight correctly', () => {
      const reputation = {
        level: 3,
        clanOfficer: true,
        points: 2840
      };
      
      const weight = voteDisplaySystem.calculateVoteWeight(reputation);
      
      // Base (1.0) + reputation bonus (0.2 for level 3) + clan officer (0.8)
      expect(weight).toBe(2.0);
    });

    test('should update user status across components', () => {
      const contentId = 'test-clip';
      const display = voteDisplaySystem.createCompactVoteDisplay(contentId);
      document.body.appendChild(display);
      
      const userData = {
        contentId,
        freeVotesRemaining: 1,
        mlgBalance: 45,
        reputation: { level: 3, clanOfficer: true },
        voteWeight: 2.0
      };
      
      voteDisplaySystem.updateUserStatus(userData);
      
      const freeBtn = display.querySelector('.free-vote .vote-btn-status');
      expect(freeBtn.textContent).toBe('(1 left)');
    });
  });

  describe('Cleanup', () => {
    test('should clean up intervals on destroy', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      voteDisplaySystem.pollInterval = 123;
      voteDisplaySystem.backgroundPollInterval = 456;
      
      voteDisplaySystem.destroy();
      
      expect(clearIntervalSpy).toHaveBeenCalledWith(123);
      expect(clearIntervalSpy).toHaveBeenCalledWith(456);
    });

    test('should remove all modals on destroy', () => {
      const contentId = 'test-clip';
      const modal = voteDisplaySystem.createVotingModal(contentId);
      document.body.appendChild(modal);
      
      voteDisplaySystem.destroy();
      
      expect(document.querySelector(`#vote-modal-${contentId}`)).toBeFalsy();
    });

    test('should clear all maps on destroy', () => {
      voteDisplaySystem.compactDisplays.set('test', 'value');
      voteDisplaySystem.detailedPanels.set('test', 'value');
      voteDisplaySystem.votingModals.set('test', 'value');
      voteDisplaySystem.activeContent.add('test');
      voteDisplaySystem.voteCache.set('test', 'value');
      
      voteDisplaySystem.destroy();
      
      expect(voteDisplaySystem.compactDisplays.size).toBe(0);
      expect(voteDisplaySystem.detailedPanels.size).toBe(0);
      expect(voteDisplaySystem.votingModals.size).toBe(0);
      expect(voteDisplaySystem.activeContent.size).toBe(0);
      expect(voteDisplaySystem.voteCache.size).toBe(0);
    });
  });

  describe('Accessibility', () => {
    test('should include proper ARIA labels', () => {
      const display = voteDisplaySystem.createCompactVoteDisplay('test-clip');
      
      expect(display.getAttribute('role')).toBe('group');
      expect(display.getAttribute('aria-label')).toBe('Vote on this content');
      
      const voteCountsDisplay = display.querySelector('.vote-counts-display');
      expect(voteCountsDisplay.getAttribute('aria-live')).toBe('polite');
    });

    test('should include screen reader help text', () => {
      const contentId = 'test-clip';
      const display = voteDisplaySystem.createCompactVoteDisplay(contentId);
      
      const freeVoteHelp = display.querySelector(`#free-vote-help-${contentId}`);
      expect(freeVoteHelp).toBeTruthy();
      expect(freeVoteHelp.classList.contains('sr-only')).toBe(true);
      
      const mlgVoteHelp = display.querySelector(`#mlg-vote-help-${contentId}`);
      expect(mlgVoteHelp).toBeTruthy();
      expect(mlgVoteHelp.classList.contains('sr-only')).toBe(true);
    });

    test('should set proper modal accessibility attributes', () => {
      const contentId = 'test-clip';
      const modal = voteDisplaySystem.createVotingModal(contentId);
      
      expect(modal.getAttribute('role')).toBe('dialog');
      expect(modal.getAttribute('aria-modal')).toBe('true');
      expect(modal.getAttribute('aria-labelledby')).toBe(`vote-modal-title-${contentId}`);
    });
  });

  describe('Responsive Design', () => {
    test('should include responsive CSS classes', () => {
      voteDisplaySystem.initializeCSS();
      const styles = document.getElementById('vote-display-styles');
      
      expect(styles.textContent).toContain('@media (max-width: 768px)');
      expect(styles.textContent).toContain('grid-template-columns: 1fr');
    });

    test('should include reduced motion support', () => {
      voteDisplaySystem.initializeCSS();
      const styles = document.getElementById('vote-display-styles');
      
      expect(styles.textContent).toContain('@media (prefers-reduced-motion: reduce)');
      expect(styles.textContent).toContain('transition: none');
      expect(styles.textContent).toContain('animation: none');
    });

    test('should include high contrast mode support', () => {
      voteDisplaySystem.initializeCSS();
      const styles = document.getElementById('vote-display-styles');
      
      expect(styles.textContent).toContain('@media (prefers-contrast: high)');
      expect(styles.textContent).toContain('border-width: 2px');
    });
  });
});

describe('VoteDisplayUtils', () => {
  test('should create vote display system', async () => {
    const mockVotingSystem = {
      initialize: jest.fn().mockResolvedValue({ success: true })
    };
    const mockWallet = { publicKey: 'test' };
    
    const displaySystem = await VoteDisplayUtils.createVoteDisplaySystem(
      mockVotingSystem, 
      mockWallet
    );
    
    expect(displaySystem).toBeInstanceOf(VoteDisplaySystem);
  });

  test('should setup compact vote display', () => {
    const container = document.createElement('div');
    const contentId = 'test-clip';
    const displaySystem = new VoteDisplaySystem();
    
    const voteDisplay = VoteDisplayUtils.setupCompactVoteDisplay(
      container, 
      contentId, 
      displaySystem
    );
    
    expect(container.contains(voteDisplay)).toBe(true);
    expect(voteDisplay.dataset.contentId).toBe(contentId);
  });

  test('should setup detailed vote panel', () => {
    const container = document.createElement('div');
    const contentId = 'test-clip';
    const displaySystem = new VoteDisplaySystem();
    
    const votePanel = VoteDisplayUtils.setupDetailedVotePanel(
      container, 
      contentId, 
      displaySystem
    );
    
    expect(container.contains(votePanel)).toBe(true);
    expect(votePanel.dataset.contentId).toBe(contentId);
  });
});

describe('Integration Tests', () => {
  test('should integrate with existing voting system', async () => {
    const voteDisplaySystem = new VoteDisplaySystem();
    await voteDisplaySystem.initialize(mockVotingSystem, mockWallet);
    
    expect(voteDisplaySystem.votingSystem).toBe(mockVotingSystem);
    expect(voteDisplaySystem.wallet).toBe(mockWallet);
    expect(voteDisplaySystem.connection).toBe(mockConnection);
  });

  test('should handle voting system callbacks', async () => {
    const onVoteUpdated = jest.fn();
    const onNetworkStatusChange = jest.fn();
    const onError = jest.fn();
    
    const voteDisplaySystem = new VoteDisplaySystem({
      onVoteUpdated,
      onNetworkStatusChange,
      onError
    });
    
    await voteDisplaySystem.initialize(mockVotingSystem, mockWallet);
    
    // Trigger callbacks
    voteDisplaySystem.updateVoteDisplays([{ contentId: 'test', standardVotes: 1 }]);
    voteDisplaySystem.handlePollingError(new Error('Test error'));
    
    expect(onVoteUpdated).toHaveBeenCalled();
    expect(onNetworkStatusChange).toHaveBeenCalled();
  });

  test('should maintain Xbox 360 aesthetic', () => {
    voteDisplaySystem.initializeCSS();
    const styles = document.getElementById('vote-display-styles');
    
    // Check for Xbox green color
    expect(styles.textContent).toContain('--vote-primary: #10b981');
    
    // Check for burn effect animation
    expect(styles.textContent).toContain('@keyframes burn-glow');
    
    // Check for gradient backgrounds
    expect(styles.textContent).toContain('linear-gradient');
    
    // Check for hover effects
    expect(styles.textContent).toContain('transform: scale(1.05)');
  });
});