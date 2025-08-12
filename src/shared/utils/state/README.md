# MLG.clan State Management System

## Overview

The MLG.clan state management system is a comprehensive React Context API-based solution that provides centralized state management for the entire platform. It follows Redux patterns while leveraging React's built-in Context API for optimal performance and simplicity.

## Architecture

### Core Components

1. **State Types** (`state-types.js`) - TypeScript-style type definitions and constants
2. **Reducers** (`state-reducers.js`) - Redux-style reducers for state updates
3. **Context** (`state-context.jsx`) - React Context providers and custom hooks
4. **Actions** (`state-actions.js`) - Action creators and composite actions
5. **Persistence** (`state-persistence.js`) - localStorage/sessionStorage integration
6. **Main Export** (`index.js`) - Centralized exports and utilities

### State Structure

The application state is divided into six main domains:

```javascript
{
  wallet: WalletState,    // Wallet connection and balance
  voting: VotingState,    // Voting system and daily allocations
  clan: ClanState,        // Clan membership and management
  user: UserState,        // User profile and achievements
  settings: SettingsState,// Application settings and preferences
  ui: UIState            // UI state (modals, loading, alerts)
}
```

## Usage

### Provider Setup

Wrap your application with the state provider:

```jsx
import { MLGStateProvider } from './shared/utils/state';

function App() {
  return (
    <MLGStateProvider>
      <YourAppComponents />
    </MLGStateProvider>
  );
}
```

### Using State in Components

#### Wallet State

```jsx
import { useWallet } from './shared/utils/state';

function WalletComponent() {
  const wallet = useWallet();
  
  const handleConnect = async () => {
    try {
      await wallet.actions.connect(walletAdapter);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };
  
  return (
    <div>
      <p>Status: {wallet.isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>Balance: {wallet.balance} SOL</p>
      <p>MLG Balance: {wallet.mlgBalance}</p>
      <button onClick={handleConnect} disabled={wallet.isConnecting}>
        {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    </div>
  );
}
```

#### Voting State

```jsx
import { useVoting } from './shared/utils/state';

function VotingComponent() {
  const voting = useVoting();
  
  const handleFreeVote = () => {
    voting.actions.useFreeVote();
    // Start vote process
    const voteId = Date.now().toString();
    voting.actions.startVote(voteId, 'free');
    
    // Simulate vote completion
    setTimeout(() => {
      voting.actions.voteSuccess(voteId, 'free', { target: 'content-123' });
    }, 2000);
  };
  
  const handleBurnVote = (amount) => {
    voting.actions.useBurnVote(amount);
    // Continue with burn vote process...
  };
  
  return (
    <div>
      <p>Free Votes: {voting.dailyVotesRemaining}</p>
      <p>Total Used: {voting.totalVotesUsed}</p>
      <p>Burn Available: {voting.burnVotesAvailable}</p>
      
      <button 
        onClick={handleFreeVote} 
        disabled={voting.dailyVotesRemaining <= 0 || voting.isVoting}
      >
        Use Free Vote
      </button>
      
      {[1, 2, 3, 4].map(amount => (
        <button 
          key={amount}
          onClick={() => handleBurnVote(amount)}
          disabled={voting.isVoting}
        >
          Burn {amount} Votes
        </button>
      ))}
    </div>
  );
}
```

#### Clan State

```jsx
import { useClan } from './shared/utils/state';

function ClanComponent() {
  const clan = useClan();
  
  const loadClan = async () => {
    try {
      await clan.actions.loadClan(async () => {
        // Fetch clan data from API
        return {
          clan: { id: 'clan_123', name: 'Elite MLG' },
          members: [...],
          stats: { totalMembers: 25, ranking: 15 }
        };
      });
    } catch (error) {
      console.error('Failed to load clan:', error);
    }
  };
  
  return (
    <div>
      {clan.currentClan ? (
        <div>
          <h3>{clan.currentClan.name}</h3>
          <p>Members: {clan.clanStats.totalMembers}</p>
          <p>Ranking: #{clan.clanStats.ranking}</p>
          <button onClick={clan.actions.leaveClan}>Leave Clan</button>
        </div>
      ) : (
        <button onClick={loadClan} disabled={clan.isLoading}>
          {clan.isLoading ? 'Loading...' : 'Join Clan'}
        </button>
      )}
      
      <div>
        <h4>Invitations ({clan.invitations.length})</h4>
        {clan.invitations.map(invite => (
          <div key={invite.id}>
            <span>{invite.clanName}</span>
            <button onClick={() => clan.actions.removeInvitation(invite.id)}>
              Decline
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### User State

```jsx
import { useUser } from './shared/utils/state';

function UserProfileComponent() {
  const user = useUser();
  
  const updateProfile = (updates) => {
    user.actions.updateProfile(updates);
  };
  
  const addAchievement = (achievement) => {
    user.actions.addAchievement(achievement);
  };
  
  return (
    <div>
      {user.profile && (
        <div>
          <h3>{user.profile.displayName}</h3>
          <p>@{user.profile.username}</p>
          
          <div>
            <h4>Stats</h4>
            <p>Total Votes: {user.stats.totalVotes}</p>
            <p>Tokens Earned: {user.stats.tokensEarned}</p>
          </div>
          
          <div>
            <h4>Achievements ({user.achievements.length})</h4>
            {user.achievements.map(achievement => (
              <div key={achievement.id}>
                <strong>{achievement.name}</strong>
                <p>{achievement.description}</p>
              </div>
            ))}
          </div>
          
          <div>
            <h4>Notifications ({user.notifications.length})</h4>
            {user.notifications.map(notification => (
              <div key={notification.id}>
                <h5>{notification.title}</h5>
                <p>{notification.message}</p>
                <button onClick={() => user.actions.removeNotification(notification.id)}>
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

#### Settings State

```jsx
import { useSettings } from './shared/utils/state';

function SettingsComponent() {
  const settings = useSettings();
  
  return (
    <div>
      <div>
        <label>Theme:</label>
        <select 
          value={settings.theme} 
          onChange={(e) => settings.actions.updateTheme(e.target.value)}
        >
          <option value="xbox">Xbox 360</option>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>
      
      <div>
        <label>Language:</label>
        <select 
          value={settings.language} 
          onChange={(e) => settings.actions.updateLanguage(e.target.value)}
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
        </select>
      </div>
      
      <div>
        <h4>Notifications</h4>
        {Object.entries(settings.notifications).map(([key, enabled]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => settings.actions.updateNotifications({
                [key]: e.target.checked
              })}
            />
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </label>
        ))}
      </div>
      
      <button onClick={settings.actions.reset}>
        Reset to Defaults
      </button>
    </div>
  );
}
```

#### UI State

```jsx
import { useUI } from './shared/utils/state';

function UIComponent() {
  const ui = useUI();
  
  const showSuccessAlert = () => {
    ui.actions.addAlert({
      type: 'success',
      title: 'Success!',
      message: 'Operation completed successfully'
    });
  };
  
  const showErrorAlert = () => {
    ui.actions.addAlert({
      type: 'error',
      title: 'Error',
      message: 'Something went wrong',
      persistent: true
    });
  };
  
  return (
    <div>
      <div>
        <button onClick={() => ui.actions.showModal('walletConnect')}>
          Show Wallet Modal
        </button>
        <button onClick={() => ui.actions.hideModal('walletConnect')}>
          Hide Wallet Modal
        </button>
      </div>
      
      <div>
        <button onClick={showSuccessAlert}>Success Alert</button>
        <button onClick={showErrorAlert}>Error Alert</button>
      </div>
      
      <div>
        <button onClick={ui.actions.toggleSidebar}>
          Toggle Sidebar ({ui.sidebarOpen ? 'Open' : 'Closed'})
        </button>
      </div>
      
      <div>
        <p>Current Page: {ui.currentPage}</p>
        <button onClick={() => ui.actions.setCurrentPage('voting')}>
          Go to Voting
        </button>
      </div>
      
      {/* Alert System */}
      <div className="alerts-container">
        {ui.alerts.map(alert => (
          <div key={alert.id} className={`alert alert-${alert.type}`}>
            <h4>{alert.title}</h4>
            <p>{alert.message}</p>
            <button onClick={() => ui.actions.removeAlert(alert.id)}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Advanced Usage

### Composite Actions

For complex operations that affect multiple state domains:

```jsx
import { compositeActions } from './shared/utils/state';

// Initialize complete user session
const actions = compositeActions.initializeUserSession(walletData, userData);
actions.forEach(action => dispatch(action));

// Complete voting with wallet updates
const voteActions = compositeActions.completeVote(
  voteId, 
  'burn', 
  voteResult, 
  walletUpdates
);
voteActions.forEach(action => dispatch(action));
```

### Custom Hooks

For component-specific state logic:

```jsx
import { useMLGState, useMLGDispatch } from './shared/utils/state';

function useWalletConnection() {
  const state = useMLGState();
  const dispatch = useMLGDispatch();
  
  const connectWallet = useCallback(async (adapter) => {
    // Custom wallet connection logic
    // Using dispatch and state
  }, [dispatch]);
  
  return {
    isConnected: state.wallet.isConnected,
    balance: state.wallet.balance,
    connectWallet
  };
}
```

### State Persistence

The system automatically persists important state to localStorage:

```javascript
// Persistent keys (saved to localStorage)
- user.preferences
- settings (all)
- wallet.address
- wallet.network

// Session keys (saved to sessionStorage)
- ui.modals
- ui.alerts
- voting.activeVotes

// Never persisted (security)
- wallet.privateKey
- wallet.secretKey
- user.profile.privateData
```

## Performance Optimization

### Optimized Re-renders

The system uses separate contexts for each domain to minimize re-renders:

```jsx
// Only re-renders when wallet state changes
const WalletComponent = () => {
  const wallet = useWallet(); // Only subscribes to wallet context
  return <div>{wallet.balance}</div>;
};

// Only re-renders when voting state changes
const VotingComponent = () => {
  const voting = useVoting(); // Only subscribes to voting context
  return <div>{voting.dailyVotesRemaining}</div>;
};
```

### Memoized Values

All context values are memoized to prevent unnecessary re-renders:

```jsx
// In MLGStateProvider
const walletValue = useMemo(() => state.wallet, [state.wallet]);
const votingValue = useMemo(() => state.voting, [state.voting]);
```

## Testing

The state management system includes comprehensive tests:

```bash
# Run all state management tests
npm test state-management.test.js

# Run with coverage
npm test -- --coverage state-management.test.js
```

### Test Categories

1. **Reducer Tests** - Test all state transitions
2. **Action Creator Tests** - Test action generation and validation
3. **Persistence Tests** - Test localStorage/sessionStorage integration
4. **Integration Tests** - Test complete workflows
5. **Performance Tests** - Test large state updates

## Development Tools

### State Validation

```jsx
import { devTools } from './shared/utils/state';

// Log state changes (development only)
devTools.logStateChange(prevState, nextState, action);

// Get state diff
const diff = devTools.getStateDiff(prevState, nextState);

// Validate state integrity
const validation = devTools.validateState(currentState);
```

### Storage Information

```jsx
import { getStorageInfo } from './shared/utils/state';

const storageInfo = getStorageInfo();
console.log('Storage usage:', storageInfo);
```

## Migration Guide

### From Global Variables

```jsx
// Before (global variables)
window.walletConnected = true;
window.userBalance = 1000;

// After (state management)
const wallet = useWallet();
console.log(wallet.isConnected, wallet.balance);
```

### From Component State

```jsx
// Before (component state)
function Component() {
  const [votes, setVotes] = useState(1);
  const [isVoting, setIsVoting] = useState(false);
  // ...
}

// After (global state)
function Component() {
  const voting = useVoting();
  // voting.dailyVotesRemaining, voting.isVoting available globally
}
```

## Best Practices

### 1. Use Domain-Specific Hooks

```jsx
// ✅ Good - Use specific hooks
const wallet = useWallet();
const voting = useVoting();

// ❌ Avoid - Using global state hook
const state = useMLGState();
const wallet = state.wallet;
```

### 2. Handle Loading States

```jsx
// ✅ Good - Handle loading states
const wallet = useWallet();
if (wallet.isConnecting) return <LoadingSpinner />;

// ✅ Good - Handle errors
if (wallet.error) return <ErrorMessage error={wallet.error} />;
```

### 3. Use Action Creators

```jsx
// ✅ Good - Use action creators
wallet.actions.connect(adapter);
voting.actions.useFreeVote();

// ❌ Avoid - Direct dispatch
dispatch({ type: 'WALLET_CONNECT', payload: { ... } });
```

### 4. Validate Actions

```jsx
// ✅ Good - Actions include validation
settings.actions.updateTheme('dark'); // ✅ Valid
settings.actions.updateTheme('invalid'); // ❌ Throws error

voting.actions.useBurnVote(2); // ✅ Valid (1-4)
voting.actions.useBurnVote(5); // ❌ Throws error
```

### 5. Handle Async Operations

```jsx
// ✅ Good - Proper async handling
const handleConnect = async () => {
  try {
    ui.actions.setLoading('wallet', true);
    await wallet.actions.connect(adapter);
    ui.actions.addAlert({ type: 'success', title: 'Connected' });
  } catch (error) {
    ui.actions.addAlert({ type: 'error', title: 'Failed', message: error.message });
  } finally {
    ui.actions.setLoading('wallet', false);
  }
};
```

## Troubleshooting

### Common Issues

1. **State Not Persisting**
   - Check if the state key is in `PERSISTENT_KEYS`
   - Verify localStorage is available
   - Check for storage quota exceeded

2. **Unnecessary Re-renders**
   - Use domain-specific hooks instead of `useMLGState()`
   - Verify memoization of derived values
   - Check for object/array mutations

3. **Action Not Working**
   - Verify action type is in `ACTION_TYPES`
   - Check action creator validation
   - Ensure reducer handles the action

4. **Context Not Available**
   - Verify component is wrapped in `MLGStateProvider`
   - Check for correct import paths
   - Ensure provider is at proper level in component tree

### Debug Tools

```jsx
// Enable development logging
import { devTools } from './shared/utils/state';

// Log all state changes
const enhancedDispatch = (action) => {
  const prevState = getCurrentState();
  dispatch(action);
  const nextState = getCurrentState();
  devTools.logStateChange(prevState, nextState, action);
};
```

## API Reference

See the individual module files for complete API documentation:

- [`state-types.js`](./state-types.js) - Type definitions and constants
- [`state-reducers.js`](./state-reducers.js) - Reducer functions
- [`state-context.jsx`](./state-context.jsx) - React Context and hooks
- [`state-actions.js`](./state-actions.js) - Action creators
- [`state-persistence.js`](./state-persistence.js) - Persistence utilities
- [`index.js`](./index.js) - Main exports and utilities

## Contributing

When extending the state management system:

1. Add new action types to `ACTION_TYPES`
2. Implement reducer logic in appropriate domain reducer
3. Create action creators with validation
4. Add persistence configuration if needed
5. Write comprehensive tests
6. Update this documentation

## License

This state management system is part of the MLG.clan platform and follows the project's license terms.