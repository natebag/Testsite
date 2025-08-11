/**
 * Storybook Stories for Burn Vote Confirmation UI
 * 
 * Interactive documentation and testing for burn vote confirmation dialogs.
 * Showcases different scenarios, error states, and accessibility features.
 */

import { BurnVoteConfirmationSystem, BurnVoteError } from './burn-vote-confirmation-ui.js';

export default {
  title: 'MLG.clan/Burn Vote Confirmation',
  component: BurnVoteConfirmationSystem,
  parameters: {
    docs: {
      description: {
        component: `
# MLG Burn Vote Confirmation System

Production-ready confirmation dialogs for SPL token burn votes with comprehensive error handling, 
multi-stage confirmations, and Xbox 360 retro aesthetic.

## Features

- **Progressive Confirmation Levels**: Different confirmation requirements based on MLG token amount
- **Transaction Simulation**: Real-time cost breakdown and network fee estimation
- **Multi-stage Security**: Up to 3 confirmation stages for high-value burns
- **Comprehensive Error Handling**: Specific error states with recovery options
- **Xbox 360 Aesthetic**: Authentic gaming UI with green theme and retro animations
- **Full Accessibility**: WCAG 2.1 AA compliant with screen reader support
- **Mobile Responsive**: Touch-friendly design with proper target sizes

## Usage

\`\`\`javascript
import { BurnVoteConfirmationSystem } from './burn-vote-confirmation-ui.js';

const confirmationSystem = new BurnVoteConfirmationSystem({
  votingSystem,
  wallet,
  onConfirm: (result) => console.log('Confirmed:', result),
  onCancel: () => console.log('Cancelled'),
  onError: (error) => console.error('Error:', error)
});

// Show confirmation dialog
await confirmationSystem.showBurnVoteConfirmation('content-id', {
  mlgCost: 4,
  voteWeight: 4,
  userBalance: 10,
  contentTitle: 'Epic Gaming Moment',
  contentType: 'clip'
});
\`\`\`

## Confirmation Levels

| MLG Tokens | Level | Stages | Confirmations | Description |
|------------|-------|--------|---------------|-------------|
| 1-3 | Standard | 1 | 1 | Simple confirmation |
| 4-10 | High-Value | 2 | 2 | Multi-stage confirmation |
| 11+ | Legendary | 3 | 3 | Maximum security |
        `
      }
    },
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0f0f23' },
        { name: 'xbox', value: '#1a1a2e' }
      ]
    }
  },
  argTypes: {
    mlgCost: {
      control: { type: 'range', min: 1, max: 20, step: 1 },
      description: 'MLG tokens to burn for the vote'
    },
    voteWeight: {
      control: { type: 'range', min: 1, max: 20, step: 1 },
      description: 'Vote weight multiplier gained'
    },
    userBalance: {
      control: { type: 'range', min: 0, max: 50, step: 0.5 },
      description: 'User\'s current MLG token balance'
    },
    contentTitle: {
      control: 'text',
      description: 'Title of content being voted on'
    },
    contentType: {
      control: { type: 'select' },
      options: ['clip', 'montage', 'stream', 'tournament'],
      description: 'Type of content'
    },
    simulateSuccess: {
      control: 'boolean',
      description: 'Simulate successful transaction'
    },
    simulateError: {
      control: 'boolean',
      description: 'Simulate transaction error'
    }
  }
};

// Mock system for Storybook
const createMockSystem = (options = {}) => {
  const mockVotingSystem = {
    connection: {
      simulateTransaction: () => Promise.resolve({ value: { err: null } }),
      getFeeForMessage: () => Promise.resolve(5000)
    }
  };

  const mockWallet = {
    connected: true,
    publicKey: 'mock-wallet-key'
  };

  return new BurnVoteConfirmationSystem({
    votingSystem: mockVotingSystem,
    wallet: mockWallet,
    ...options
  });
};

// Story template
const Template = (args) => {
  const container = document.createElement('div');
  container.style.cssText = `
    min-height: 100vh;
    background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const button = document.createElement('button');
  button.textContent = `Show Burn Vote Confirmation (${args.mlgCost} MLG)`;
  button.style.cssText = `
    background: linear-gradient(45deg, #10b981, #059669);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 16px 32px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  `;

  button.addEventListener('mouseover', () => {
    button.style.transform = 'translateY(-2px)';
    button.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
  });

  button.addEventListener('mouseout', () => {
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = 'none';
  });

  const system = createMockSystem({
    onConfirm: (result) => {
      console.log('✅ Burn vote confirmed:', result);
    },
    onCancel: () => {
      console.log('❌ Burn vote cancelled');
    },
    onError: (error) => {
      console.error('🔥 Burn vote error:', error);
    }
  });

  button.addEventListener('click', async () => {
    try {
      await system.showBurnVoteConfirmation(`story-${Date.now()}`, {
        mlgCost: args.mlgCost,
        voteWeight: args.voteWeight,
        userBalance: args.userBalance,
        contentTitle: args.contentTitle,
        contentType: args.contentType
      });
    } catch (error) {
      console.error('Story error:', error);
    }
  });

  container.appendChild(button);
  return container;
};

// Standard burn vote (1-3 MLG tokens)
export const StandardBurn = Template.bind({});
StandardBurn.args = {
  mlgCost: 2,
  voteWeight: 2,
  userBalance: 10,
  contentTitle: 'Epic Gaming Moment',
  contentType: 'clip',
  simulateSuccess: false,
  simulateError: false
};
StandardBurn.parameters = {
  docs: {
    description: {
      story: `
Standard burn vote for low-value transactions. Features single-stage confirmation 
with transaction preview and burn warning. No multi-stage confirmations required.

**Characteristics:**
- 1-3 MLG tokens
- Single confirmation stage
- Simple transaction preview
- Immediate processing after confirmation
      `
    }
  }
};

// High-value burn vote (4-10 MLG tokens)
export const HighValueBurn = Template.bind({});
HighValueBurn.args = {
  mlgCost: 4,
  voteWeight: 4,
  userBalance: 15,
  contentTitle: 'Legendary Clutch Play',
  contentType: 'clip'
};
HighValueBurn.parameters = {
  docs: {
    description: {
      story: `
High-value burn vote with enhanced security measures. Requires multiple confirmation 
checkboxes before the burn button becomes active. Enhanced warnings and visual effects.

**Security Features:**
- 2 confirmation stages
- Multiple acknowledgment checkboxes
- Enhanced burn warning animations
- Disabled confirmation until all boxes checked
      `
    }
  }
};

// Legendary burn vote (11+ MLG tokens)
export const LegendaryBurn = Template.bind({});
LegendaryBurn.args = {
  mlgCost: 12,
  voteWeight: 12,
  userBalance: 20,
  contentTitle: 'Ultimate Gaming Achievement',
  contentType: 'tournament'
};
LegendaryBurn.parameters = {
  docs: {
    description: {
      story: `
Maximum security legendary burn vote for the highest value transactions. Features 
3-stage confirmation process with comprehensive warnings and acknowledgments.

**Maximum Security:**
- 3 confirmation stages
- Multiple detailed acknowledgments
- High-value transaction warnings
- Enhanced visual feedback
      `
    }
  }
};

// Insufficient balance error
export const InsufficientBalance = Template.bind({});
InsufficientBalance.args = {
  mlgCost: 8,
  voteWeight: 8,
  userBalance: 3,
  contentTitle: 'Expensive Vote',
  contentType: 'clip'
};
InsufficientBalance.parameters = {
  docs: {
    description: {
      story: `
Demonstrates insufficient balance error handling. Shows clear balance shortfall 
information and provides options to acquire more MLG tokens.

**Error Features:**
- Clear balance vs requirement display
- Shortfall calculation
- Disabled confirmation button
- Link to token acquisition
      `
    }
  }
};

// Network error simulation
export const NetworkError = Template.bind({});
NetworkError.args = {
  mlgCost: 3,
  voteWeight: 3,
  userBalance: 10,
  contentTitle: 'Network Test',
  contentType: 'clip',
  simulateError: true
};
NetworkError.parameters = {
  docs: {
    description: {
      story: `
Simulates network connectivity issues during transaction simulation or execution. 
Shows error recovery options and retry mechanisms.

**Error Handling:**
- Network timeout detection
- Clear error messaging
- Retry functionality
- User-friendly explanations
      `
    }
  }
};

// Success flow with celebration
export const SuccessFlow = Template.bind({});
SuccessFlow.args = {
  mlgCost: 3,
  voteWeight: 3,
  userBalance: 10,
  contentTitle: 'Success Demo',
  contentType: 'clip',
  simulateSuccess: true
};
SuccessFlow.parameters = {
  docs: {
    description: {
      story: `
Complete success flow with Xbox-style celebration animation. Shows transaction 
confirmation details and automatically closes after 5 seconds.

**Success Features:**
- Celebration animation
- Transaction details display
- Auto-close functionality
- Success feedback
      `
    }
  }
};

// Mobile responsive view
export const MobileView = Template.bind({});
MobileView.args = {
  mlgCost: 4,
  voteWeight: 4,
  userBalance: 10,
  contentTitle: 'Mobile Test',
  contentType: 'clip'
};
MobileView.parameters = {
  viewport: {
    defaultViewport: 'iphone12'
  },
  docs: {
    description: {
      story: `
Mobile-optimized view with touch-friendly interface. Features stacked button layout, 
larger touch targets, and optimized spacing for mobile devices.

**Mobile Features:**
- Stacked button layout
- 44px minimum touch targets
- Optimized modal sizing
- Touch-friendly checkboxes
      `
    }
  }
};

// Accessibility focused
export const AccessibilityDemo = Template.bind({});
AccessibilityDemo.args = {
  mlgCost: 4,
  voteWeight: 4,
  userBalance: 10,
  contentTitle: 'Accessibility Test',
  contentType: 'clip'
};
AccessibilityDemo.parameters = {
  docs: {
    description: {
      story: `
Demonstrates accessibility features including proper ARIA labels, keyboard navigation, 
focus management, and screen reader compatibility.

**Accessibility Features:**
- WCAG 2.1 AA compliant
- Full keyboard navigation
- Screen reader support
- High contrast compatibility
- Focus trap within modal
- Proper ARIA attributes

**Keyboard Shortcuts:**
- \`Tab\` - Navigate between elements
- \`Space/Enter\` - Activate buttons/checkboxes
- \`Escape\` - Close modal
      `
    }
  }
};

// Dark mode / High contrast
export const HighContrast = Template.bind({});
HighContrast.args = {
  mlgCost: 2,
  voteWeight: 2,
  userBalance: 10,
  contentTitle: 'High Contrast Test',
  contentType: 'clip'
};
HighContrast.parameters = {
  backgrounds: { default: 'dark' },
  docs: {
    description: {
      story: `
High contrast mode demonstration for users with visual impairments. Enhanced border 
widths, stronger color contrasts, and improved visual hierarchy.

**High Contrast Features:**
- Enhanced border visibility
- Stronger color contrasts
- Improved text readability
- Clear visual hierarchy
      `
    }
  }
};

// Performance test with multiple modals
export const PerformanceTest = (args) => {
  const container = document.createElement('div');
  container.style.cssText = `
    min-height: 100vh;
    background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
    color: white;
    padding: 20px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    align-items: center;
  `;

  const system = createMockSystem();

  for (let i = 1; i <= 5; i++) {
    const button = document.createElement('button');
    button.textContent = `Modal ${i} (${i} MLG)`;
    button.style.cssText = `
      background: linear-gradient(45deg, #10b981, #059669);
      color: white;
      border: none;
      border-radius: 8px;
      padding: 12px 20px;
      font-weight: 600;
      cursor: pointer;
    `;

    button.addEventListener('click', async () => {
      await system.showBurnVoteConfirmation(`perf-test-${i}`, {
        mlgCost: i,
        voteWeight: i,
        userBalance: 20,
        contentTitle: `Performance Test ${i}`,
        contentType: 'clip'
      });
    });

    container.appendChild(button);
  }

  return container;
};

PerformanceTest.parameters = {
  docs: {
    description: {
      story: `
Performance testing with multiple simultaneous modals. Tests memory usage, 
event handling, and cleanup functionality with multiple active confirmations.

**Performance Features:**
- Efficient modal management
- Proper cleanup on close
- Memory leak prevention
- Event listener management
      `
    }
  }
};

// Interactive playground
export const Playground = Template.bind({});
Playground.args = {
  mlgCost: 5,
  voteWeight: 5,
  userBalance: 15,
  contentTitle: 'Interactive Playground',
  contentType: 'clip',
  simulateSuccess: false,
  simulateError: false
};
Playground.parameters = {
  docs: {
    description: {
      story: `
Interactive playground to test different parameter combinations. Use the controls 
panel to adjust MLG cost, user balance, and other parameters to explore different scenarios.

**Try These Scenarios:**
- Set MLG cost higher than user balance
- Test different confirmation levels (1-3, 4-10, 11+)
- Compare different content types
- Enable success/error simulation
      `
    }
  }
};