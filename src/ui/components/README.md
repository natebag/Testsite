# MLG.clan Real-Time Vote Display System

A production-ready UI component system for displaying real-time vote counts with Solana blockchain integration. Built with Xbox 360 retro dashboard aesthetic and comprehensive accessibility support.

## Features

- **Real-time vote updates** with 5-second Solana RPC polling
- **Three component variants**: Compact displays, detailed panels, and voting modals
- **Complete voting workflow** with burn-to-vote mechanics
- **Xbox 360 aesthetic** with green color scheme and retro animations
- **Mobile responsive** design with proper touch targets
- **Accessibility compliant** (WCAG 2.1 AA) with ARIA labels and keyboard navigation
- **Network status monitoring** with error handling and recovery
- **Vote weight visualization** based on user reputation and clan status

## Quick Start

### Installation

```javascript
import VoteDisplaySystem, { VoteDisplayUtils } from './components/vote-display-ui.js';
import { SolanaVotingSystem } from '../voting/solana-voting-system.js';
```

### Basic Setup

```javascript
// Initialize voting system
const votingSystem = new SolanaVotingSystem();
await votingSystem.initialize(wallet);

// Create vote display system
const voteDisplay = await VoteDisplayUtils.createVoteDisplaySystem(
  votingSystem, 
  wallet,
  {
    onVoteUpdated: (updates) => console.log('Votes updated:', updates),
    onNetworkStatusChange: (status) => console.log('Network:', status)
  }
);

// Add compact vote display to content tile
const container = document.querySelector('.content-tile');
const compactDisplay = voteDisplay.createCompactVoteDisplay('clip-123', {
  showFreeVotes: true,
  showMLGVotes: true,
  enableVoting: true
});
container.appendChild(compactDisplay);
```

## Component Types

### 1. Compact Vote Display

Lightweight vote counters for content tiles and grids.

```javascript
const display = voteDisplaySystem.createCompactVoteDisplay(contentId, {
  showFreeVotes: true,      // Show standard vote counts
  showMLGVotes: true,       // Show MLG token vote counts  
  showLikes: true,          // Show like counts
  enableVoting: true        // Include vote buttons
});
```

**Features:**
- Inline vote count badges with real-time updates
- Vote buttons with immediate visual feedback
- Network status indicator
- Touch-friendly mobile design

### 2. Detailed Vote Panel

Comprehensive vote statistics for full-screen content views.

```javascript
const panel = voteDisplaySystem.createDetailedVotePanel(contentId, {
  showVoteBreakdown: true,  // Show detailed vote statistics
  showUserStatus: true,     // Show user voting status
  showVoteWeight: true      // Show vote weight calculation
});
```

**Features:**
- Three-column vote statistics grid
- User vote status and remaining allocations
- Vote weight breakdown with reputation bonuses
- Large voting action buttons

### 3. Voting Interface Modal

Complete voting workflow with burn-to-vote mechanics.

```javascript
// Modal is created automatically, show with:
voteDisplaySystem.showVotingModal(contentId);
```

**Features:**
- Free vote option with daily allocation status
- MLG token burn voting with cost calculation
- Vote weight breakdown and multiplier explanation
- Accessible modal with proper focus management

## Configuration

### System Configuration

```javascript
const VOTE_SYSTEM_CONFIG = {
  POLL_INTERVAL: 5000,           // Active content polling (5s)
  BACKGROUND_POLL_INTERVAL: 15000,  // Background polling (15s)
  MAX_RETRY_ATTEMPTS: 3,         // Network error retries
  VOTE_CACHE_DURATION: 30000,    // Cache duration (30s)
  ANIMATION_DURATION: 300,       // Transition timing (0.3s)
  UPDATE_ANIMATION_DURATION: 200  // Count update animation (0.2s)
};
```

### Component Options

```javascript
// Compact Display Options
{
  showFreeVotes: boolean,    // Show standard vote counts
  showMLGVotes: boolean,     // Show MLG token vote counts
  showLikes: boolean,        // Show like counts
  enableVoting: boolean      // Include interactive voting buttons
}

// Detailed Panel Options  
{
  showVoteBreakdown: boolean,  // Show vote statistics grid
  showUserStatus: boolean,     // Show user voting status
  showVoteWeight: boolean      // Show vote weight calculation
}
```

## Real-Time Updates

The system automatically polls Solana RPC endpoints for vote updates:

- **Active content**: 5-second intervals for visible content
- **Background content**: 15-second intervals for cached content
- **Error handling**: Exponential backoff with automatic recovery
- **Network monitoring**: Visual status indicators with connection state

### Manual Updates

```javascript
// Force refresh vote data
await voteDisplaySystem.loadVoteData(contentId);

// Update specific content
voteDisplaySystem.updateVoteDisplays([{
  contentId: 'clip-123',
  standardVotes: 150,
  mlgVotes: 30,
  likes: 75
}]);
```

## Voting Actions

### Handle Voting Events

```javascript
// Free vote
try {
  const result = await voteDisplaySystem.handleVote(contentId, 'free');
  console.log('Free vote cast:', result);
} catch (error) {
  console.error('Vote failed:', error);
}

// MLG token vote  
try {
  const result = await voteDisplaySystem.handleVote(contentId, 'mlg');
  console.log('Token vote cast:', result);
} catch (error) {
  console.error('Token vote failed:', error);
}
```

### Vote Animations

The system provides automatic visual feedback:

- **Success**: Green pulse animation with scale effect
- **Error**: Red shake animation with error indication
- **Loading**: Button disabled state with loading indicator
- **Count updates**: Smooth number increment with glow effect

## Styling & Theming

### CSS Custom Properties

```css
:root {
  --vote-primary: #10b981;      /* Xbox green */
  --vote-secondary: #3b82f6;    /* Blue accent */
  --vote-burn: #f59e0b;         /* Amber for MLG tokens */
  --vote-disabled: #6b7280;     /* Gray for disabled states */
  --vote-transition: 0.3s ease; /* Animation timing */
}
```

### Custom Animations

```css
/* Vote count update animation */
@keyframes voteCountUp {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

/* MLG token burn effect */
@keyframes burn-glow {
  0%, 100% { box-shadow: 0 0 10px rgba(245, 158, 11, 0.4); }
  50% { box-shadow: 0 0 20px rgba(217, 119, 6, 0.8); }
}
```

## Accessibility

### ARIA Support

All components include comprehensive accessibility features:

```html
<!-- Vote display with ARIA labels -->
<div role="group" aria-label="Vote on this content">
  <div aria-live="polite">
    <span aria-label="142 standard votes">👍 142</span>
    <span aria-label="28 MLG token votes">🔥 28</span>
  </div>
  <button aria-describedby="free-vote-help">Free Vote</button>
  <div id="free-vote-help" class="sr-only">
    Uses one of your daily free votes. You have 1 remaining today.
  </div>
</div>
```

### Keyboard Navigation

- **Tab navigation** through all interactive elements
- **Enter/Space** to activate vote buttons
- **Escape** to close modals
- **Focus indicators** with 2px outline

### Screen Reader Support

- **Live regions** for vote count updates
- **Descriptive labels** for all vote actions
- **Status announcements** for voting results
- **Hidden help text** with voting explanations

## Mobile Responsive Design

### Breakpoint Strategy

```css
/* Mobile: < 768px */
.vote-display-compact {
  flex-direction: column;
}

.vote-badge {
  font-size: 16px;
  min-height: 32px; /* Touch target */
}

/* Tablet: 768px - 1024px */
.vote-stats-grid {
  grid-template-columns: repeat(2, 1fr);
}

/* Desktop: > 1024px */
.vote-stats-grid {
  grid-template-columns: repeat(3, 1fr);
}
```

### Touch Optimization

- **Minimum 32px touch targets** for mobile
- **Increased button spacing** on small screens
- **Swipe-friendly** modal interactions
- **Responsive font sizes** (16px minimum)

## Error Handling

### Network Errors

```javascript
voteDisplaySystem.onNetworkStatusChange = (status, error) => {
  switch (status) {
    case 'connected':
      showSuccessMessage('Connected to Solana network');
      break;
    case 'connecting':
      showLoadingMessage('Connecting to network...');
      break;
    case 'error':
      showErrorMessage(`Network error: ${error.message}`);
      break;
  }
};
```

### Vote Errors

```javascript
voteDisplaySystem.onError = (error, context) => {
  console.error(`Vote system error in ${context}:`, error);
  
  // Show user-friendly error messages
  if (error.message.includes('insufficient funds')) {
    showErrorMessage('Not enough MLG tokens for vote');
  } else if (error.message.includes('daily limit')) {
    showErrorMessage('Daily vote limit reached');
  } else {
    showErrorMessage('Voting temporarily unavailable');
  }
};
```

## Integration Examples

### With Existing Content Tiles

```javascript
// Add vote display to existing clip tiles
document.querySelectorAll('.clip-tile').forEach(tile => {
  const contentId = tile.dataset.clipId;
  const voteContainer = tile.querySelector('.vote-container');
  
  if (voteContainer) {
    const display = voteDisplaySystem.createCompactVoteDisplay(contentId);
    voteContainer.appendChild(display);
  }
});
```

### With Tournament Brackets

```javascript
// Tournament voting integration
const tournamentVotes = voteDisplaySystem.createCompactVoteDisplay('match-123', {
  showFreeVotes: false,  // Hide standard votes
  showMLGVotes: true,    // Show only MLG votes
  showLikes: false,      // Hide likes
  enableVoting: true
});

document.querySelector('.tournament-match').appendChild(tournamentVotes);
```

### With Clan Management

```javascript
// Clan proposal voting
const proposalPanel = voteDisplaySystem.createDetailedVotePanel('proposal-456', {
  showVoteBreakdown: true,
  showUserStatus: true,
  showVoteWeight: true
});

document.querySelector('.clan-proposal').appendChild(proposalPanel);
```

## Performance Optimization

### Lazy Loading

```javascript
// Only create displays for visible content
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const contentId = entry.target.dataset.contentId;
      const display = voteDisplaySystem.createCompactVoteDisplay(contentId);
      entry.target.appendChild(display);
      observer.unobserve(entry.target);
    }
  });
});

document.querySelectorAll('.content-tile').forEach(tile => {
  observer.observe(tile);
});
```

### Batch Updates

```javascript
// Batch multiple vote updates for better performance
const updates = [
  { contentId: 'clip-1', standardVotes: 100, mlgVotes: 25 },
  { contentId: 'clip-2', standardVotes: 150, mlgVotes: 30 },
  { contentId: 'clip-3', standardVotes: 200, mlgVotes: 45 }
];

voteDisplaySystem.updateVoteDisplays(updates);
```

### Memory Management

```javascript
// Clean up when removing content
voteDisplaySystem.removeFromActivePolling(contentId);

// Destroy system when done
voteDisplaySystem.destroy();
```

## Testing

### Unit Tests

```bash
npm test vote-display-ui.test.js
```

### Integration Tests

```javascript
import { render, fireEvent, waitFor } from '@testing-library/react';
import VoteDisplaySystem from './vote-display-ui.js';

test('should handle vote button clicks', async () => {
  const voteDisplay = new VoteDisplaySystem();
  const display = voteDisplay.createCompactVoteDisplay('test-clip');
  
  const freeVoteBtn = display.querySelector('.free-vote');
  fireEvent.click(freeVoteBtn);
  
  await waitFor(() => {
    expect(mockVotingSystem.castFreeVote).toHaveBeenCalled();
  });
});
```

### Accessibility Testing

```javascript
import { axe, toHaveNoViolations } from 'jest-axe';

test('should have no accessibility violations', async () => {
  const display = voteDisplaySystem.createDetailedVotePanel('test-clip');
  document.body.appendChild(display);
  
  const results = await axe(display);
  expect(results).toHaveNoViolations();
});
```

## Browser Support

- **Chrome**: 88+
- **Firefox**: 85+
- **Safari**: 14+
- **Edge**: 88+
- **Mobile**: iOS Safari 14+, Chrome Android 88+

### Polyfills Required

```javascript
// For older browsers
import 'core-js/features/map';
import 'core-js/features/set';
import 'core-js/features/promise';
```

## Troubleshooting

### Common Issues

**Vote counts not updating:**
- Check Solana RPC connection
- Verify polling is enabled
- Check browser console for errors

**Modal not showing:**
- Ensure modal container is in DOM
- Check z-index conflicts
- Verify modal ID uniqueness

**Touch targets too small:**
- Check mobile breakpoints
- Verify min-height CSS rules
- Test on actual devices

**Accessibility issues:**
- Run axe-core accessibility tests
- Test with screen readers
- Verify keyboard navigation

### Debug Mode

```javascript
const voteDisplaySystem = new VoteDisplaySystem({
  debug: true,  // Enable debug logging
  onError: (error, context) => {
    console.debug('Vote display error:', { error, context });
  }
});
```

## Contributing

1. Follow Xbox 360 aesthetic guidelines
2. Maintain accessibility standards (WCAG 2.1 AA)
3. Write comprehensive tests
4. Update documentation for new features
5. Test on mobile devices

## License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for the MLG.clan community**