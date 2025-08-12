# MLG.clan Burn Vote Confirmation System - Technical Specifications

## Overview
This document provides comprehensive technical specifications for implementing the MLG token burn vote confirmation system, designed with Xbox 360 aesthetic principles while ensuring modern web accessibility and performance standards.

## Architecture

### Component Hierarchy
```
BurnVoteConfirmationSystem/
├── BurnVoteModal (Main confirmation dialog)
├── MultiStageConfirmation (4+ MLG token flows)
├── TransactionSimulation (Cost preview component)
├── ErrorDialogs (Failure state handling)
├── SuccessAnimations (Completion feedback)
└── MobileAdaptations (Responsive variants)
```

### State Management
```javascript
// Core state interface
interface BurnVoteState {
  isOpen: boolean;
  stage: 'initial' | 'multi-stage-1' | 'multi-stage-2' | 'processing' | 'success' | 'error';
  contentId: string;
  mlgCost: number;
  voteWeight: number;
  userBalance: number;
  simulationData: TransactionSimulation;
  confirmationChecks: boolean[];
  error?: BurnVoteError;
}
```

## Design Token System

### Color Palette
```css
:root {
  /* Primary Colors */
  --xbox-green: #10b981;
  --xbox-green-hover: #059669;
  --xbox-green-light: #34d399;
  
  /* Burn Effect Colors */
  --burn-orange: #f59e0b;
  --burn-red: #dc2626;
  --burn-gradient: linear-gradient(45deg, #dc2626, #f59e0b);
  --warning-gradient: linear-gradient(45deg, #f59e0b, #d97706);
  
  /* State Colors */
  --success-gradient: linear-gradient(45deg, #10b981, #059669);
  --error-color: #ef4444;
  --info-color: #3b82f6;
  
  /* Surface Colors */
  --modal-bg: rgba(0, 0, 0, 0.8);
  --tile-bg: rgba(31, 41, 55, 0.95);
  --tile-border: rgba(16, 185, 129, 0.3);
}
```

### Spacing System (8px Grid)
```css
:root {
  --spacing-xs: 4px;   /* Icon padding, micro spacing */
  --spacing-sm: 8px;   /* Base unit, element spacing */
  --spacing-md: 16px;  /* Section padding, card spacing */
  --spacing-lg: 24px;  /* Modal padding, major sections */
  --spacing-xl: 32px;  /* Modal margins, page sections */
  --spacing-2xl: 48px; /* Large separations */
}
```

### Typography Scale
```css
:root {
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-size-xs: 0.75rem;   /* 12px - Helper text */
  --font-size-sm: 0.875rem;  /* 14px - Body text */
  --font-size-base: 1rem;    /* 16px - Default */
  --font-size-lg: 1.125rem;  /* 18px - Emphasized text */
  --font-size-xl: 1.25rem;   /* 20px - Small headings */
  --font-size-2xl: 1.5rem;   /* 24px - Modal headings */
  --font-weight-normal: 400;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

## Animation System

### Timing Functions
```css
:root {
  --transition-fast: 0.15s ease-out;    /* Button hover, quick feedback */
  --transition-medium: 0.3s ease;       /* Modal transitions, state changes */
  --transition-slow: 0.5s ease;         /* Success celebrations, major changes */
  --bounce-timing: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### Key Animations
```css
/* Burn glow effect for danger states */
@keyframes burn-glow {
  0%, 100% { 
    box-shadow: 0 0 10px rgba(220, 38, 38, 0.5); 
  }
  50% { 
    box-shadow: 0 0 20px rgba(245, 158, 11, 0.7); 
  }
}

/* Success celebration animation */
@keyframes success-celebration {
  0% { 
    transform: scale(0.8); 
    opacity: 0; 
  }
  50% { 
    transform: scale(1.1); 
  }
  100% { 
    transform: scale(1); 
    opacity: 1; 
  }
}

/* Warning pulse for attention-grabbing elements */
@keyframes warning-pulse {
  0%, 100% { 
    transform: scale(1); 
    opacity: 1; 
  }
  50% { 
    transform: scale(1.02); 
    opacity: 0.9; 
  }
}

/* Transaction simulation scanning effect */
@keyframes simulation-scan {
  0%, 100% { 
    border-color: rgba(59, 130, 246, 0.3); 
  }
  50% { 
    border-color: rgba(59, 130, 246, 0.6); 
  }
}
```

## Component Specifications

### 1. Main Burn Vote Modal

#### Structure
```html
<div class="burn-vote-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <div class="burn-vote-modal-container">
    <header class="modal-header">
      <h2 id="modal-title">Confirm MLG Burn Vote</h2>
      <button class="modal-close" aria-label="Close modal">×</button>
    </header>
    
    <main class="modal-content">
      <section class="content-preview" aria-label="Content being voted on">
        <!-- Content information -->
      </section>
      
      <section class="transaction-simulation" aria-label="Transaction cost breakdown">
        <!-- Cost preview -->
      </section>
      
      <section class="burn-warning" role="alert">
        <!-- Permanent destruction warning -->
      </section>
    </main>
    
    <footer class="modal-actions">
      <button class="btn-cancel">Cancel</button>
      <button class="btn-confirm burn-effect">Burn & Vote</button>
    </footer>
  </div>
</div>
```

#### Styling
```css
.burn-vote-modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--modal-bg);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md);
  z-index: 2000;
}

.burn-vote-modal-container {
  background: var(--tile-bg);
  border: 2px solid var(--tile-border);
  border-radius: calc(var(--spacing-sm) * 2);
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
  max-width: 480px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: var(--spacing-lg);
}
```

### 2. Multi-Stage Confirmation Flow

#### Progressive Burn Levels
```javascript
const BURN_CONFIRMATION_LEVELS = {
  STANDARD: { minTokens: 1, maxTokens: 3, stages: 1 },
  HIGH_VALUE: { minTokens: 4, maxTokens: 10, stages: 2 },
  LEGENDARY: { minTokens: 11, maxTokens: Infinity, stages: 3 }
};

function getBurnConfirmationLevel(tokenCount) {
  if (tokenCount >= BURN_CONFIRMATION_LEVELS.LEGENDARY.minTokens) return 'LEGENDARY';
  if (tokenCount >= BURN_CONFIRMATION_LEVELS.HIGH_VALUE.minTokens) return 'HIGH_VALUE';
  return 'STANDARD';
}
```

#### Confirmation Checkboxes
```css
.confirmation-checkbox {
  appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid var(--burn-orange);
  border-radius: 4px;
  position: relative;
  cursor: pointer;
  transition: var(--transition-fast);
}

.confirmation-checkbox:checked {
  background: var(--burn-orange);
  border-color: var(--burn-red);
}

.confirmation-checkbox:checked::after {
  content: "✓";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: black;
  font-weight: bold;
  font-size: 12px;
}

.confirmation-checkbox:focus {
  outline: 2px solid var(--xbox-green);
  outline-offset: 2px;
}
```

### 3. Transaction Simulation Component

#### Data Structure
```javascript
interface TransactionSimulation {
  mlgCost: number;
  voteWeight: number;
  networkFee: number; // in SOL
  estimatedConfirmationTime: string;
  simulationAccuracy: 'high' | 'medium' | 'low';
}
```

#### Implementation
```css
.transaction-simulation {
  background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: var(--spacing-sm);
  padding: var(--spacing-md);
  animation: simulation-scan 3s infinite;
}

.simulation-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xs) 0;
  font-size: var(--font-size-sm);
}

.simulation-total {
  border-top: 1px solid rgba(156, 163, 175, 0.3);
  padding-top: var(--spacing-sm);
  margin-top: var(--spacing-sm);
  font-weight: var(--font-weight-semibold);
}
```

### 4. Error State Handling

#### Error Types
```javascript
enum BurnVoteError {
  INSUFFICIENT_BALANCE = 'insufficient_balance',
  NETWORK_ERROR = 'network_error',
  TRANSACTION_FAILED = 'transaction_failed',
  SIMULATION_FAILED = 'simulation_failed',
  USER_REJECTED = 'user_rejected'
}
```

#### Error Dialog Structure
```javascript
function showBurnVoteError(error: BurnVoteError, context: any) {
  const errorConfig = {
    [BurnVoteError.INSUFFICIENT_BALANCE]: {
      title: 'Insufficient MLG Tokens',
      icon: '💸',
      description: `You need ${context.required} MLG tokens but only have ${context.available}`,
      actions: [
        { label: 'Cancel', type: 'secondary' },
        { label: 'Get MLG Tokens', type: 'primary', href: '/earn-tokens' }
      ]
    },
    [BurnVoteError.TRANSACTION_FAILED]: {
      title: 'Transaction Failed',
      icon: '❌',
      description: 'Your burn vote could not be processed',
      actions: [
        { label: 'Cancel', type: 'secondary' },
        { label: 'Retry', type: 'primary', action: 'retry' }
      ]
    }
  };
  
  return renderErrorDialog(errorConfig[error]);
}
```

## Responsive Design

### Breakpoints
```css
/* Mobile-first approach */
.burn-vote-modal-container {
  margin: var(--spacing-sm);
  padding: var(--spacing-md);
}

@media (min-width: 768px) {
  .burn-vote-modal-container {
    margin: var(--spacing-lg);
    padding: var(--spacing-lg);
  }
}

/* Touch target sizing for mobile */
@media (max-width: 768px) {
  .touch-target {
    min-height: 44px;
    min-width: 44px;
  }
  
  .modal-actions {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .modal-actions button {
    width: 100%;
  }
}
```

### Mobile Adaptations
```css
/* Stack buttons vertically on mobile */
@media (max-width: 640px) {
  .modal-actions {
    flex-direction: column;
  }
  
  .modal-container {
    max-height: 95vh;
    margin: var(--spacing-xs);
  }
  
  /* Larger touch targets */
  .confirmation-checkbox {
    width: 24px;
    height: 24px;
  }
}
```

## Accessibility Implementation

### ARIA Labels and Roles
```html
<!-- Modal with proper ARIA attributes -->
<div 
  role="dialog" 
  aria-modal="true" 
  aria-labelledby="burn-modal-title"
  aria-describedby="burn-modal-description"
>
  <h2 id="burn-modal-title">Confirm MLG Burn Vote</h2>
  <p id="burn-modal-description">This action will permanently destroy MLG tokens</p>
  
  <!-- Live region for dynamic updates -->
  <div aria-live="polite" aria-atomic="true" id="status-updates"></div>
  
  <!-- Warning with proper role -->
  <div role="alert" class="burn-warning">
    Permanent token burn warning
  </div>
</div>
```

### Keyboard Navigation
```javascript
// Focus management
function setupFocusManagement(modal) {
  const focusableElements = modal.querySelectorAll(
    'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];
  
  // Trap focus within modal
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    }
    
    // Close on Escape
    if (e.key === 'Escape') {
      closeBurnVoteModal();
    }
  });
}
```

### Screen Reader Support
```javascript
// Announce state changes to screen readers
function announceToScreenReader(message) {
  const announcement = document.getElementById('status-updates');
  announcement.textContent = message;
  
  // Clear after announcement
  setTimeout(() => {
    announcement.textContent = '';
  }, 1000);
}

// Usage
announceToScreenReader('MLG burn vote confirmed. Transaction processing.');
```

## Performance Optimization

### Lazy Loading
```javascript
// Dynamically import modal components
const BurnVoteModal = lazy(() => import('./BurnVoteModal'));

// Preload critical animations
function preloadCriticalAnimations() {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = '/animations/burn-effects.css';
  document.head.appendChild(link);
}
```

### Animation Performance
```css
/* Use transform and opacity for smooth animations */
.modal-enter {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

.modal-enter-active {
  opacity: 1;
  transform: scale(1) translateY(0);
  transition: opacity var(--transition-medium), transform var(--transition-medium);
}

/* Use will-change for animated elements */
.burn-effect {
  will-change: box-shadow, transform;
}

/* Remove will-change after animation */
.burn-effect.animation-complete {
  will-change: auto;
}
```

## Integration with Solana

### Transaction Simulation
```javascript
async function simulateBurnTransaction(params) {
  try {
    const simulation = await connection.simulateTransaction(
      await buildBurnTransaction(params)
    );
    
    return {
      success: simulation.value.err === null,
      logs: simulation.value.logs,
      computeUnitsConsumed: simulation.value.unitsConsumed,
      fee: await connection.getFeeForMessage(transaction.compileMessage())
    };
  } catch (error) {
    throw new BurnSimulationError('Failed to simulate burn transaction', error);
  }
}
```

### Error Handling
```javascript
class BurnVoteError extends Error {
  constructor(type, message, context) {
    super(message);
    this.type = type;
    this.context = context;
    this.timestamp = Date.now();
  }
}

// Usage in transaction flow
try {
  const result = await executeBurnVote(params);
  showSuccessModal(result);
} catch (error) {
  if (error instanceof BurnVoteError) {
    showBurnVoteError(error.type, error.context);
  } else {
    showBurnVoteError(BurnVoteError.NETWORK_ERROR, { originalError: error });
  }
}
```

## Testing Strategy

### Component Testing
```javascript
describe('BurnVoteModal', () => {
  it('should display correct token cost', () => {
    render(<BurnVoteModal mlgCost={4} />);
    expect(screen.getByText('4 MLG')).toBeInTheDocument();
  });
  
  it('should require multi-stage confirmation for high-value burns', () => {
    render(<BurnVoteModal mlgCost={4} />);
    expect(screen.getByText(/Multiple confirmations required/)).toBeInTheDocument();
  });
  
  it('should be accessible via keyboard', async () => {
    render(<BurnVoteModal />);
    
    // Test tab navigation
    userEvent.tab();
    expect(screen.getByRole('button', { name: /close/i })).toHaveFocus();
    
    // Test escape key
    userEvent.keyboard('{Escape}');
    expect(mockOnClose).toHaveBeenCalled();
  });
});
```

### Visual Regression Testing
```javascript
// Storybook stories for visual testing
export const StandardBurn = {
  args: { mlgCost: 1, voteWeight: 2 }
};

export const HighValueBurn = {
  args: { mlgCost: 4, voteWeight: 8 }
};

export const InsufficientBalance = {
  args: { mlgCost: 5, userBalance: 2 }
};
```

## Deployment Checklist

### Pre-deployment
- [ ] All animations respect `prefers-reduced-motion`
- [ ] High contrast mode tested and functional
- [ ] Screen reader compatibility verified
- [ ] Mobile touch targets meet 44px minimum
- [ ] All error states have been tested
- [ ] Transaction simulation accuracy validated
- [ ] Performance budget maintained (< 50kb for modal bundle)

### Post-deployment
- [ ] Monitor error rates for burn transactions
- [ ] Track completion rates for multi-stage confirmations
- [ ] Collect accessibility feedback
- [ ] Monitor performance metrics
- [ ] A/B test confirmation flow effectiveness

This specification provides the foundation for implementing a robust, accessible, and performant burn vote confirmation system that maintains the MLG.clan gaming aesthetic while ensuring serious financial operations are handled with appropriate care and security.