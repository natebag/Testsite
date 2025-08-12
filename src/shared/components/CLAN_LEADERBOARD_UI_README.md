# MLG.clan Leaderboard UI - Production Documentation

## Overview

The MLG.clan Leaderboard UI is a comprehensive, production-ready React component that provides an interactive clan leaderboard interface with Xbox 360 retro gaming aesthetics. It implements multi-category leaderboards, time-based rankings, interactive analytics, and comprehensive clan profile management with real-time updates.

## Features

### Core Functionality
- **Multi-Category Leaderboards**: Dynamic switching between different ranking categories
- **Time-Based Rankings**: Historical data visualization with multiple time periods
- **Interactive Analytics**: Rich clan profile cards with expandable details
- **Real-Time Updates**: WebSocket integration for live leaderboard updates
- **Search & Filtering**: Advanced search and filter capabilities for finding specific clans
- **Pagination**: Efficient pagination for large datasets
- **Virtualization**: Performance optimization for handling 1000+ clans

### User Experience
- **Xbox 360 Gaming Aesthetic**: Competitive tournament-style presentations
- **Mobile-First Design**: Responsive design with touch interactions
- **Accessibility**: WCAG 2.1 AA compliance with comprehensive screen reader support
- **Performance**: Optimized rendering and data handling
- **Error Handling**: Graceful error states and recovery mechanisms

### Technical Features
- **TypeScript Support**: Full type safety and IntelliSense
- **Storybook Integration**: Comprehensive component documentation
- **Unit Testing**: Extensive test coverage with React Testing Library
- **Performance Monitoring**: Built-in performance optimizations
- **Accessibility Testing**: Automated accessibility validation

## Installation & Setup

### Prerequisites
- React 18+
- Node.js 16+
- NPM or Yarn package manager

### Dependencies
```bash
npm install @solana/web3.js @solana/spl-token react react-dom
```

### Integration Dependencies
- `clan-leaderboard.js`: Data fetching and calculations
- `clan-statistics.js`: Detailed metrics and analytics
- `clan-management.js`: Clan profile information
- Phantom Wallet: Secure transaction signing
- MLG Token Contract: 7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL

## Basic Usage

### Simple Implementation
```jsx
import React from 'react';
import ClanLeaderboardUI from './clan-leaderboard-ui.js';

function App() {
  const [wallet, setWallet] = useState(null);

  return (
    <ClanLeaderboardUI
      walletAdapter={wallet}
      initialCategory="overall_power"
      initialPeriod="all_time"
      onError={(error) => console.error('Leaderboard error:', error)}
      onSuccess={(message) => console.log('Success:', message)}
    />
  );
}
```

### With Custom Configuration
```jsx
import React from 'react';
import ClanLeaderboardUI from './clan-leaderboard-ui.js';

function TournamentLeaderboard() {
  const handleClanSelect = (clan) => {
    console.log('Selected clan:', clan);
    // Navigate to clan details page
  };

  const handleError = (error) => {
    // Send to error reporting service
    console.error('Leaderboard error:', error);
  };

  return (
    <ClanLeaderboardUI
      walletAdapter={phantomWallet}
      initialCategory="competitive_performance"
      initialPeriod="monthly"
      theme="tournament"
      className="tournament-leaderboard"
      onError={handleError}
      onSuccess={(message) => console.log('Success:', message)}
    />
  );
}
```

## Props API

### Main Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `walletAdapter` | `WalletAdapter \| null` | `null` | Phantom wallet adapter for blockchain interactions |
| `initialCategory` | `string` | `'overall_power'` | Initial leaderboard category to display |
| `initialPeriod` | `string` | `'all_time'` | Initial time period for rankings |
| `onError` | `(error: Error) => void` | - | Error handling callback |
| `onSuccess` | `(message: string) => void` | - | Success handling callback |
| `className` | `string` | `''` | Additional CSS classes |
| `theme` | `'xbox' \| 'minimal' \| 'tournament'` | `'xbox'` | UI theme variant |

### Available Categories
- `'overall_power'`: Combined voting activity and token burns
- `'content_curation'`: Content-related voting participation
- `'governance_leadership'`: Governance proposal participation
- `'community_engagement'`: General voting activity
- `'token_economics'`: MLG token burn contributions
- `'alliance_building'`: Alliance-related voting

### Available Time Periods
- `'all_time'`: Historical performance since clan creation
- `'seasonal'`: Quarterly performance rankings (90 days)
- `'monthly'`: Monthly performance rankings
- `'weekly'`: Weekly performance rankings
- `'daily'`: Daily activity rankings

## Sub-Components

The leaderboard UI is composed of several reusable sub-components that can be used independently:

### CategorySelector
```jsx
import { CategorySelector } from './clan-leaderboard-ui.js';

<CategorySelector
  activeCategory="overall_power"
  onCategoryChange={(category) => console.log('Category:', category)}
  categories={availableCategories}
/>
```

### ClanCard
```jsx
import { ClanCard } from './clan-leaderboard-ui.js';

<ClanCard
  clan={clanData}
  rank={1}
  onClanClick={(clan) => console.log('Clan clicked:', clan)}
  onBookmark={(clanId, isBookmarked) => console.log('Bookmark:', clanId, isBookmarked)}
  isBookmarked={false}
  showTrend={true}
/>
```

### StatisticsCards
```jsx
import { StatisticsCards } from './clan-leaderboard-ui.js';

<StatisticsCards
  statistics={{
    totalClans: 1247,
    averageScore: 65.3,
    participationRate: 78.2,
    lastUpdated: new Date().toISOString()
  }}
/>
```

## Styling & Theming

### Xbox Theme (Default)
The default Xbox theme provides a retro gaming aesthetic with:
- Xbox Green color scheme (#6ab04c)
- Gaming tournament-style presentations
- Animated glow effects and transitions
- Podium-style top rankings
- Competitive gaming elements

### Theme Customization
```jsx
// Built-in themes
<ClanLeaderboardUI theme="xbox" />        // Default gaming theme
<ClanLeaderboardUI theme="minimal" />     // Clean, professional theme
<ClanLeaderboardUI theme="tournament" />  // Enhanced competitive theme

// Custom CSS classes
<ClanLeaderboardUI className="custom-tournament-style" />
```

### CSS Custom Properties
The component uses CSS custom properties for easy theming:

```css
.clan-leaderboard-ui {
  --xbox-primary: #6ab04c;
  --xbox-secondary: #1e272e;
  --xbox-accent: #ff9f43;
  --xbox-background: #0b1426;
  --xbox-text: #ffffff;
  /* ... more properties */
}
```

## Accessibility

The component implements comprehensive accessibility features:

### WCAG 2.1 AA Compliance
- Proper color contrast ratios (4.5:1 minimum)
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- ARIA labels and descriptions

### Keyboard Navigation
- Tab/Shift+Tab: Navigate through interactive elements
- Enter/Space: Activate buttons and cards
- Escape: Close modals and overlays
- Arrow Keys: Navigate within lists (where applicable)

### Screen Reader Support
```jsx
// Example ARIA implementation
<button
  className="clan-card"
  role="button"
  tabIndex={0}
  aria-label={`View details for ${clan.name}`}
  onClick={() => onClanClick(clan)}
>
  {/* Clan content */}
</button>
```

## Performance Optimization

### Large Dataset Handling
```jsx
// Automatic virtualization for 1000+ clans
<ClanLeaderboardUI
  // Component automatically enables virtualization
  // when dealing with large datasets
/>
```

### Memoization
The component uses React.memo and useMemo for optimal performance:
- Memoized clan list filtering and sorting
- Cached statistical calculations
- Optimized re-rendering strategies

### Loading States
```jsx
// Built-in loading skeletons
import { LoadingSkeleton, LeaderboardSkeleton } from './clan-leaderboard-ui.js';

// Custom loading implementation
{loading ? <LeaderboardSkeleton /> : <ClanList data={clans} />}
```

## Data Integration

### Leaderboard System Integration
```jsx
// The component automatically integrates with:
import ClanLeaderboardSystem from '../../clans/clan-leaderboard.js';
import { ClanStatisticsManager } from '../../clans/clan-statistics.js';
import { CLAN_TIER_CONFIG } from '../../clans/clan-management.js';

// Data flows:
// 1. Leaderboard rankings and calculations
// 2. Real-time statistics and analytics
// 3. Clan profile and management data
// 4. Wallet integration for transactions
```

### Real-Time Updates
```jsx
// WebSocket integration for live updates
useEffect(() => {
  // Automatic WebSocket connection
  // Updates leaderboard data in real-time
  // Falls back to periodic polling if WebSocket unavailable
}, []);
```

## Error Handling

### Built-in Error States
```jsx
// Component handles various error scenarios:
<ClanLeaderboardUI
  onError={(error) => {
    switch (error.type) {
      case 'CONNECTION_ERROR':
        // Handle network issues
        break;
      case 'WALLET_ERROR':
        // Handle wallet connection problems
        break;
      case 'DATA_ERROR':
        // Handle data loading failures
        break;
      default:
        console.error('Unexpected error:', error);
    }
  }}
/>
```

### Retry Mechanisms
The component includes automatic retry mechanisms:
- Exponential backoff for network requests
- Manual retry buttons for user-initiated retries
- Graceful degradation when services are unavailable

## Testing

### Unit Tests
```bash
# Run unit tests
npm test clan-leaderboard-ui.test.js

# Run with coverage
npm test -- --coverage clan-leaderboard-ui.test.js

# Run in watch mode
npm test -- --watch clan-leaderboard-ui.test.js
```

### Integration Tests
```bash
# Run integration tests
npm test -- --testNamePattern="Integration"

# Test accessibility
npm test -- --testNamePattern="Accessibility"

# Test performance
npm test -- --testNamePattern="Performance"
```

### Storybook Testing
```bash
# Start Storybook
npm run storybook

# Run visual regression tests
npm run test-storybook

# Build Storybook
npm run build-storybook
```

## Storybook Documentation

The component includes comprehensive Storybook documentation:

### Available Stories
- **Default**: Standard leaderboard configuration
- **Categories**: Different category examples
- **Time Periods**: Various time period configurations
- **Themes**: All available theme variants
- **Mobile View**: Mobile-optimized display
- **Loading States**: Loading and skeleton states
- **Error States**: Error handling scenarios
- **Large Datasets**: Performance with big data
- **Accessibility**: Accessibility-focused examples

### Interactive Examples
```bash
# View interactive examples
npm run storybook

# Navigate to:
# MLG.clan/ClanLeaderboardUI
```

## Best Practices

### Component Usage
```jsx
// ✅ Good: Proper error handling
<ClanLeaderboardUI
  walletAdapter={wallet}
  onError={handleError}
  onSuccess={handleSuccess}
/>

// ❌ Avoid: No error handling
<ClanLeaderboardUI walletAdapter={wallet} />
```

### Performance
```jsx
// ✅ Good: Memoize expensive operations
const memoizedProps = useMemo(() => ({
  walletAdapter,
  onError,
  onSuccess
}), [walletAdapter, onError, onSuccess]);

<ClanLeaderboardUI {...memoizedProps} />

// ❌ Avoid: Creating new objects in render
<ClanLeaderboardUI
  onError={(error) => handleError(error)} // New function each render
/>
```

### Accessibility
```jsx
// ✅ Good: Proper ARIA labels
<ClanLeaderboardUI
  aria-label="Clan leaderboard rankings"
  role="main"
/>

// ❌ Avoid: Missing accessibility attributes
<ClanLeaderboardUI />
```

## Troubleshooting

### Common Issues

#### Component Not Loading
```jsx
// Check wallet adapter connection
if (!walletAdapter || !walletAdapter.connected) {
  console.log('Wallet not connected');
}

// Verify system dependencies
import { CLAN_LEADERBOARD_CONFIG } from '../../clans/clan-leaderboard.js';
console.log('Config loaded:', CLAN_LEADERBOARD_CONFIG);
```

#### Performance Issues
```jsx
// Enable virtualization for large datasets
// (automatically handled by component)

// Check for memory leaks
useEffect(() => {
  return () => {
    // Component cleans up automatically
  };
}, []);
```

#### Styling Issues
```css
/* Ensure proper CSS cascade */
.clan-leaderboard-ui {
  /* Component styles have high specificity */
  /* Use !important sparingly */
}

/* Custom theme implementation */
.clan-leaderboard-ui.custom-theme {
  --xbox-primary: #custom-color;
}
```

### Debug Mode
```jsx
// Enable debug logging
process.env.NODE_ENV === 'development' && console.log('Debug info');

// Component exposes debug information
<ClanLeaderboardUI
  onError={(error) => {
    console.group('Leaderboard Error');
    console.error(error);
    console.groupEnd();
  }}
/>
```

## Version History

### v1.0.0 (2025-08-10)
- Initial production release
- Multi-category leaderboard system
- Xbox 360 gaming aesthetic
- Full accessibility compliance
- Comprehensive test coverage
- Real-time update support
- Mobile-responsive design
- Performance optimizations

### Planned Features
- Custom theme builder
- Advanced analytics dashboard
- Tournament bracket integration
- Clan comparison tools
- Historical trend analysis
- Achievement tracking
- Social sharing features
- API documentation

## Contributing

### Development Setup
```bash
# Clone repository
git clone [repository-url]

# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Start Storybook
npm run storybook
```

### Code Standards
- Follow React best practices
- Maintain accessibility standards
- Write comprehensive tests
- Document all props and methods
- Use TypeScript for type safety

### Testing Requirements
- Unit tests for all functions
- Integration tests for data flows
- Accessibility tests for compliance
- Performance tests for optimization
- Visual regression tests for UI

## Support

### Documentation
- [Storybook Documentation](./clan-leaderboard-ui.stories.js)
- [Test Examples](./clan-leaderboard-ui.test.js)
- [Integration Guide](../../clans/README.md)

### Issues
- Report bugs with detailed reproduction steps
- Include browser and device information
- Provide error logs and stack traces
- Test with latest component version

### Contact
- Author: Claude Code - Frontend Production Engineer
- Version: 1.0.0
- Created: 2025-08-10
- Integration: MLG Token Contract (7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL)

---

*This component is part of the MLG.clan ecosystem, providing competitive clan rankings and analytics for the Web3 gaming community.*