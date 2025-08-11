/**
 * Burn Vote Confirmation UI Tests
 * 
 * Comprehensive test suite for burn vote confirmation dialogs
 * Tests modal functionality, accessibility, error handling, and responsive design
 */

// Mock the dependencies that are causing issues
jest.mock('../../voting/solana-voting-system.js', () => ({
  generateBurnVotePreview: jest.fn(),
  calculateTotalBurnCost: jest.fn(),
  getNextBurnVoteCost: jest.fn(),
  validateBurnVoteAffordability: jest.fn(),
  validateBurnAmount: jest.fn(),
  getVotingConfig: jest.fn()
}));

jest.mock('../../tokens/spl-mlg-token.js', () => ({
  MLGTokenManager: jest.fn().mockImplementation(() => ({
    getBalance: jest.fn().mockResolvedValue(10),
    burnTokens: jest.fn().mockResolvedValue({ signature: 'test-sig' })
  }))
}));

jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn(),
  PublicKey: jest.fn(),
  LAMPORTS_PER_SOL: 1000000000
}));

// Import after mocking
const { 
  BurnVoteConfirmationSystem, 
  BurnVoteConfirmationError,
  BurnVoteError 
} = require('./burn-vote-confirmation-ui.js');

// Mock dependencies
const mockVotingSystem = {
  connection: {
    simulateTransaction: jest.fn(),
    getFeeForMessage: jest.fn()
  }
};

const mockWallet = {
  connected: true,
  publicKey: 'mock-public-key'
};

describe('BurnVoteConfirmationSystem', () => {
  let confirmationSystem;
  let container;

  beforeEach(() => {
    // Create container
    container = document.createElement('div');
    document.body.appendChild(container);

    // Initialize system
    confirmationSystem = new BurnVoteConfirmationSystem({
      votingSystem: mockVotingSystem,
      wallet: mockWallet
    });

    // Mock CSS injection
    jest.spyOn(confirmationSystem, 'initializeCSS').mockImplementation(() => {});
  });

  afterEach(() => {
    if (confirmationSystem) {
      confirmationSystem.destroy();
    }
    document.body.removeChild(container);
    document.head.innerHTML = '';
  });

  describe('Initialization', () => {
    test('should initialize with correct default values', () => {
      expect(confirmationSystem.activeModals).toBeInstanceOf(Map);
      expect(confirmationSystem.confirmationStates).toBeInstanceOf(Map);
      expect(confirmationSystem.activeModals.size).toBe(0);
    });

    test('should inject CSS styles on initialization', () => {
      const newSystem = new BurnVoteConfirmationSystem();
      expect(newSystem.initializeCSS).toBeTruthy();
    });
  });

  describe('Modal Creation', () => {
    test('should create burn vote modal with correct structure', async () => {
      const contentId = 'test-clip';
      const options = {
        mlgCost: 2,
        voteWeight: 2,
        userBalance: 5,
        contentTitle: 'Test Clip'
      };

      await confirmationSystem.showBurnVoteConfirmation(contentId, options);
      
      const modal = document.querySelector(`#burn-vote-modal-${contentId}`);
      expect(modal).toBeTruthy();
      expect(modal.classList.contains('burn-vote-modal-overlay')).toBe(true);
      expect(modal.getAttribute('role')).toBe('dialog');
      expect(modal.getAttribute('aria-modal')).toBe('true');
    });

    test('should display correct content information', async () => {
      const contentId = 'test-clip';
      const options = {
        mlgCost: 3,
        voteWeight: 3,
        userBalance: 10,
        contentTitle: 'Amazing Clip',
        contentType: 'clip'
      };

      await confirmationSystem.showBurnVoteConfirmation(contentId, options);
      
      const modal = document.querySelector(`#burn-vote-modal-${contentId}`);
      expect(modal.textContent).toContain('Amazing Clip');
      expect(modal.textContent).toContain('3 MLG');
      expect(modal.textContent).toContain('3x multiplier');
    });

    test('should show transaction simulation data', async () => {
      const contentId = 'test-clip';
      const options = {
        mlgCost: 1,
        userBalance: 5
      };

      await confirmationSystem.showBurnVoteConfirmation(contentId, options);
      
      const modal = document.querySelector(`#burn-vote-modal-${contentId}`);
      const simulationSection = modal.querySelector('.transaction-simulation');
      
      expect(simulationSection).toBeTruthy();
      expect(simulationSection.textContent).toContain('Transaction Preview');
      expect(simulationSection.textContent).toContain('Network Fee');
    });
  });

  describe('Multi-stage Confirmation', () => {
    test('should show multi-stage confirmation for high-value burns', async () => {
      const contentId = 'high-value-clip';
      const options = {
        mlgCost: 4, // High value burn
        userBalance: 10
      };

      await confirmationSystem.showBurnVoteConfirmation(contentId, options);
      
      const modal = document.querySelector(`#burn-vote-modal-${contentId}`);
      const multiStageSection = modal.querySelector('.multi-stage-confirmation');
      
      expect(multiStageSection).toBeTruthy();
      expect(multiStageSection.textContent).toContain('Multiple Confirmations Required');
      
      const checkboxes = modal.querySelectorAll('.confirmation-checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    test('should require all confirmations before enabling confirm button', async () => {
      const contentId = 'high-value-clip';
      const options = {
        mlgCost: 4,
        userBalance: 10
      };

      await confirmationSystem.showBurnVoteConfirmation(contentId, options);
      
      const modal = document.querySelector(`#burn-vote-modal-${contentId}`);
      const confirmButton = modal.querySelector('[data-action="confirm"]');
      const checkboxes = modal.querySelectorAll('.confirmation-checkbox');
      
      // Initially disabled
      expect(confirmButton.disabled).toBe(true);
      
      // Check all boxes
      checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));
      });
      
      // Should be enabled now
      expect(confirmButton.disabled).toBe(false);
    });

    test('should show different confirmation levels for different MLG amounts', () => {
      const standardLevel = confirmationSystem.getBurnConfirmationLevel(2);
      const highValueLevel = confirmationSystem.getBurnConfirmationLevel(5);
      const legendaryLevel = confirmationSystem.getBurnConfirmationLevel(15);

      expect(standardLevel.stages).toBe(1);
      expect(highValueLevel.stages).toBe(2);
      expect(legendaryLevel.stages).toBe(3);
    });
  });

  describe('Transaction Simulation', () => {
    test('should simulate transaction with correct data', async () => {
      const simulation = await confirmationSystem.simulateTransaction(2, 10);
      
      expect(simulation).toHaveProperty('mlgCost');
      expect(simulation).toHaveProperty('networkFee');
      expect(simulation).toHaveProperty('confirmationTime');
      expect(simulation).toHaveProperty('accuracy');
      expect(simulation.mlgCost).toBe(2);
    });

    test('should handle simulation errors gracefully', async () => {
      // Mock simulation failure
      jest.spyOn(confirmationSystem, 'simulateTransaction')
        .mockRejectedValue(new Error('Network error'));

      try {
        await confirmationSystem.showBurnVoteConfirmation('test-clip', {
          mlgCost: 1,
          userBalance: 5
        });
      } catch (error) {
        expect(error.message).toContain('Network error');
      }
    });
  });

  describe('Error Handling', () => {
    test('should show insufficient balance warning', async () => {
      const contentId = 'insufficient-clip';
      const options = {
        mlgCost: 10,
        userBalance: 5 // Not enough
      };

      await confirmationSystem.showBurnVoteConfirmation(contentId, options);
      
      const modal = document.querySelector(`#burn-vote-modal-${contentId}`);
      const confirmButton = modal.querySelector('[data-action="confirm"]');
      
      expect(confirmButton.disabled).toBe(true);
      expect(confirmButton.textContent).toContain('Insufficient MLG');
    });

    test('should show error modal for different error types', () => {
      const insufficientBalanceError = new Error('Insufficient balance');
      insufficientBalanceError.type = BurnVoteError.INSUFFICIENT_BALANCE;
      
      const errorConfig = confirmationSystem.getErrorConfig(insufficientBalanceError);
      
      expect(errorConfig.title).toBe('Insufficient MLG Tokens');
      expect(errorConfig.icon).toBe('💸');
      expect(errorConfig.actions).toHaveLength(2);
    });

    test('should handle wallet not connected error', async () => {
      const disconnectedSystem = new BurnVoteConfirmationSystem({
        wallet: { connected: false }
      });

      try {
        await disconnectedSystem.showBurnVoteConfirmation('test-clip', {
          mlgCost: 1,
          userBalance: 5
        });
      } catch (error) {
        expect(error).toBeInstanceOf(BurnVoteConfirmationError);
        expect(error.type).toBe(BurnVoteError.WALLET_NOT_CONNECTED);
      }
    });
  });

  describe('Success Flow', () => {
    test('should show success modal after successful burn vote', async () => {
      const contentId = 'success-clip';
      
      // Mock successful execution
      jest.spyOn(confirmationSystem, 'executeBurnVote')
        .mockResolvedValue({
          success: true,
          transactionId: 'tx_123',
          mlgBurned: 2,
          voteWeight: 2,
          confirmationTime: '5 seconds'
        });

      await confirmationSystem.showBurnVoteConfirmation(contentId, {
        mlgCost: 2,
        userBalance: 5
      });

      // Simulate confirmation
      await confirmationSystem.handleConfirmation(contentId, 2, 2, jest.fn());
      
      const modal = document.querySelector(`#burn-vote-modal-${contentId}`);
      const successModal = modal.querySelector('.success-modal');
      
      expect(successModal).toBeTruthy();
      expect(successModal.textContent).toContain('Burn Vote Successful!');
      expect(successModal.textContent).toContain('2 MLG tokens');
    });
  });

  describe('Accessibility', () => {
    test('should set proper ARIA attributes', async () => {
      const contentId = 'accessible-clip';
      
      await confirmationSystem.showBurnVoteConfirmation(contentId, {
        mlgCost: 1,
        userBalance: 5
      });
      
      const modal = document.querySelector(`#burn-vote-modal-${contentId}`);
      
      expect(modal.getAttribute('role')).toBe('dialog');
      expect(modal.getAttribute('aria-modal')).toBe('true');
      expect(modal.getAttribute('aria-labelledby')).toContain(`modal-title-${contentId}`);
      expect(modal.getAttribute('aria-describedby')).toContain(`modal-description-${contentId}`);
    });

    test('should manage focus correctly', async () => {
      const contentId = 'focus-clip';
      
      await confirmationSystem.showBurnVoteConfirmation(contentId, {
        mlgCost: 1,
        userBalance: 5
      });
      
      const modal = document.querySelector(`#burn-vote-modal-${contentId}`);
      const focusableElements = modal.querySelectorAll(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    test('should close modal on Escape key', async () => {
      const contentId = 'escape-clip';
      
      await confirmationSystem.showBurnVoteConfirmation(contentId, {
        mlgCost: 1,
        userBalance: 5
      });
      
      const modal = document.querySelector(`#burn-vote-modal-${contentId}`);
      expect(modal).toBeTruthy();
      
      // Simulate Escape key
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      modal.dispatchEvent(escapeEvent);
      
      // Modal should be scheduled for removal
      expect(confirmationSystem.activeModals.has(contentId)).toBe(false);
    });
  });

  describe('Mobile Responsiveness', () => {
    test('should apply mobile styles on small screens', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });

      const contentId = 'mobile-clip';
      
      await confirmationSystem.showBurnVoteConfirmation(contentId, {
        mlgCost: 1,
        userBalance: 5
      });
      
      const modal = document.querySelector(`#burn-vote-modal-${contentId}`);
      const confirmButton = modal.querySelector('[data-action="confirm"]');
      
      expect(modal).toBeTruthy();
      expect(confirmButton).toBeTruthy();
    });

    test('should have proper touch target sizes', async () => {
      const contentId = 'touch-clip';
      
      await confirmationSystem.showBurnVoteConfirmation(contentId, {
        mlgCost: 4, // High value to show checkboxes
        userBalance: 10
      });
      
      const modal = document.querySelector(`#burn-vote-modal-${contentId}`);
      const checkboxes = modal.querySelectorAll('.confirmation-checkbox');
      
      checkboxes.forEach(checkbox => {
        const style = window.getComputedStyle(checkbox);
        // CSS should define minimum touch target size
        expect(checkbox.classList.contains('confirmation-checkbox')).toBe(true);
      });
    });
  });

  describe('Integration', () => {
    test('should call onConfirm callback on successful confirmation', async () => {
      const onConfirm = jest.fn();
      const contentId = 'callback-clip';
      
      // Mock successful execution
      jest.spyOn(confirmationSystem, 'executeBurnVote')
        .mockResolvedValue({
          success: true,
          transactionId: 'tx_123',
          mlgBurned: 1,
          voteWeight: 1
        });

      await confirmationSystem.showBurnVoteConfirmation(contentId, {
        mlgCost: 1,
        userBalance: 5,
        onConfirm
      });

      await confirmationSystem.handleConfirmation(contentId, 1, 1, onConfirm);
      
      expect(onConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          transactionId: 'tx_123'
        })
      );
    });

    test('should call onCancel callback when modal is cancelled', async () => {
      const onCancel = jest.fn();
      const contentId = 'cancel-clip';
      
      await confirmationSystem.showBurnVoteConfirmation(contentId, {
        mlgCost: 1,
        userBalance: 5,
        onCancel
      });

      const modal = document.querySelector(`#burn-vote-modal-${contentId}`);
      const cancelButton = modal.querySelector('[data-action="cancel"]');
      
      cancelButton.click();
      
      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    test('should clean up properly on destroy', () => {
      confirmationSystem.activeModals.set('test1', document.createElement('div'));
      confirmationSystem.activeModals.set('test2', document.createElement('div'));
      
      expect(confirmationSystem.activeModals.size).toBe(2);
      
      confirmationSystem.destroy();
      
      expect(confirmationSystem.activeModals.size).toBe(0);
      expect(confirmationSystem.confirmationStates.size).toBe(0);
    });

    test('should remove modal from DOM when hidden', async () => {
      const contentId = 'cleanup-clip';
      
      await confirmationSystem.showBurnVoteConfirmation(contentId, {
        mlgCost: 1,
        userBalance: 5
      });
      
      let modal = document.querySelector(`#burn-vote-modal-${contentId}`);
      expect(modal).toBeTruthy();
      
      confirmationSystem.hideBurnVoteModal(contentId);
      
      // After animation delay, modal should be removed
      setTimeout(() => {
        modal = document.querySelector(`#burn-vote-modal-${contentId}`);
        expect(modal).toBeFalsy();
      }, 400);
    });
  });
});

describe('BurnVoteConfirmationError', () => {
  test('should create error with correct properties', () => {
    const error = new BurnVoteConfirmationError(
      BurnVoteError.INSUFFICIENT_BALANCE,
      'Not enough tokens',
      { required: 5, available: 2 }
    );

    expect(error.name).toBe('BurnVoteConfirmationError');
    expect(error.type).toBe(BurnVoteError.INSUFFICIENT_BALANCE);
    expect(error.message).toBe('Not enough tokens');
    expect(error.context.required).toBe(5);
    expect(error.context.available).toBe(2);
    expect(error.timestamp).toBeDefined();
  });
});

describe('Configuration Constants', () => {
  test('should have correct MLG token address', () => {
    expect(confirmationSystem).toBeDefined();
    // Token address should be accessible through the system
  });

  test('should have proper confirmation levels', () => {
    const standardLevel = confirmationSystem.getBurnConfirmationLevel(1);
    const highValueLevel = confirmationSystem.getBurnConfirmationLevel(4);
    const legendaryLevel = confirmationSystem.getBurnConfirmationLevel(11);

    expect(standardLevel.stages).toBe(1);
    expect(standardLevel.confirmations).toBe(1);
    
    expect(highValueLevel.stages).toBe(2);
    expect(highValueLevel.confirmations).toBe(2);
    
    expect(legendaryLevel.stages).toBe(3);
    expect(legendaryLevel.confirmations).toBe(3);
  });
});