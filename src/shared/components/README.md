# MLG.clan Wallet UI Components

Comprehensive Phantom Wallet integration UI components for the MLG.clan platform, featuring Xbox 360 dashboard aesthetic with retro gaming theme.

## Features

- **Complete Status Management**: Connection status indicators for connecting, connected, disconnected, and error states
- **Enhanced Connection Button**: Multi-state connection button with loading animations and error handling
- **Error Display System**: User-friendly error messages with retry functionality and detailed error information
- **Network Health Monitoring**: Real-time network status and RPC health indicators
- **Xbox 360 Theme**: Retro gaming aesthetic with green color scheme and glow effects
- **Mobile Responsive**: Optimized for all device sizes with touch-friendly interactions
- **Accessibility**: WCAG 2.1 AA compliant with proper ARIA labels and keyboard navigation
- **Comprehensive Integration**: Full integration with PhantomWalletManager error handling system

## Components Overview

### Core Components

#### `WalletConnectButton`
Enhanced connection button with comprehensive state management and visual feedback.

**Features:**
- Multiple variants: `primary`, `secondary`, `minimal`, `hero`
- Size options: `sm`, `md`, `lg`, `xl`
- State-aware button content and styling
- Integrated status indicators and health monitoring
- Error state handling with retry functionality
- Loading animations and visual feedback

#### `WalletErrorDisplay`
Comprehensive error display component with user-friendly messaging and retry options.

**Features:**
- Categorized error types with appropriate messaging
- Retry functionality for retryable errors
- Detailed error information display
- Auto-hide capability
- Action buttons and external links
- Accessibility compliant error announcements

#### `WalletStatusBadge`
Compact status indicator with connection health information.

**Features:**
- Real-time status updates
- Health monitoring indicators
- Latency display options
- Multiple size variants
- Position options: `inline`, `fixed-top-right`, `fixed-bottom-right`

#### `WalletAddressDisplay`
Wallet address display with hover expansion and copy functionality.

**Features:**
- Truncated address format (ABC...XYZ)
- Hover expansion to full address
- Copy-to-clipboard with visual feedback
- Balance display option
- Status icon integration

#### `WalletNetworkIndicator`
Network status and RPC health monitoring component.

**Features:**
- Network name display
- RPC status monitoring
- Latency indicators
- Error count display
- Auto-refresh capability

### Composite Components

#### `WalletConnectionFlow`
Complete connection flow component combining all individual components.

**Features:**
- Orchestrates all wallet UI components
- Progress indicators for retry attempts
- Adaptive UI based on connection state
- Comprehensive event handling

#### `WalletStatusIndicator` (Legacy)
Simple status indicator for backward compatibility.

## Usage Examples

### Quick Start

```javascript
import { createWalletUI } from './src/ui/components/wallet-ui.js';

// Create a complete wallet UI with all components
const walletUI = createWalletUI(document.getElementById('wallet-container'), {
  layout: 'full',
  showErrors: true,
  showNetwork: true,
  showRetry: true
});
```

### Individual Components

```javascript
import { 
  WalletConnectButton, 
  WalletErrorDisplay, 
  WalletStatusBadge,
  WalletAddressDisplay,
  WalletNetworkIndicator
} from './src/ui/components/wallet-ui.js';

// Connection button with primary styling
const connectButton = new WalletConnectButton(buttonContainer, {
  variant: 'primary',
  size: 'lg',
  showStatus: true,
  showRetryOnError: true
});

// Error display with retry functionality
const errorDisplay = new WalletErrorDisplay(errorContainer, {
  showRetryButton: true,
  showDetailsButton: true,
  autoHide: false
});

// Status badge with health monitoring
const statusBadge = new WalletStatusBadge(statusContainer, {
  showText: true,
  showHealth: true,
  showLatency: true,
  size: 'md'
});

// Address display with balance
const addressDisplay = new WalletAddressDisplay(addressContainer, {
  showCopyButton: true,
  showBalance: true,
  expandOnHover: true
});

// Network indicator
const networkIndicator = new WalletNetworkIndicator(networkContainer, {
  showNetworkName: true,
  showRpcStatus: true,
  showLatency: true,
  autoRefresh: true
});
```

### Layout Options

```javascript
// Full layout with all components
const fullUI = createWalletUI(container, {
  layout: 'full',
  showErrors: true,
  showNetwork: true,
  showRetry: true
});

// Compact layout for space-constrained areas
const compactUI = createWalletUI(container, {
  layout: 'compact',
  showStatus: true,
  variant: 'secondary'
});

// Minimal layout - just the connection button
const minimalUI = createWalletUI(container, {
  layout: 'minimal',
  variant: 'minimal',
  size: 'sm'
});
```

## Component Options

### WalletConnectButton Options

```javascript
{
  text: 'Connect Wallet',              // Default button text
  connectingText: 'Connecting...',     // Text while connecting
  connectedText: 'Connected',          // Text when connected
  errorText: 'Connection Error',       // Text on error
  retryText: 'Retry Connection',       // Text for retry button
  showAddress: true,                   // Show address when connected
  showDisconnect: true,                // Show disconnect option
  showStatus: true,                    // Show status indicators
  showRetryOnError: true,              // Show retry on error
  variant: 'primary',                  // Button style variant
  size: 'md',                          // Button size
  className: ''                        // Additional CSS classes
}
```

### WalletErrorDisplay Options

```javascript
{
  showRetryButton: true,               // Show retry button
  showDetailsButton: false,            // Show error details
  autoHide: false,                     // Auto-hide after delay
  autoHideDelay: 5000,                 // Auto-hide delay in ms
  className: ''                        // Additional CSS classes
}
```

### WalletStatusBadge Options

```javascript
{
  showText: false,                     // Show status text
  showHealth: true,                    // Show health indicators
  showLatency: false,                  // Show latency info
  size: 'sm',                          // Badge size
  position: 'inline',                  // Badge position
  className: ''                        // Additional CSS classes
}
```

## Event Integration

All components automatically integrate with the PhantomWalletManager event system:

```javascript
import { getWalletManager } from './src/wallet/phantom-wallet.js';

const walletManager = getWalletManager();

// Listen for wallet events
walletManager.on('connecting', () => console.log('Connecting...'));
walletManager.on('connected', (info) => console.log('Connected:', info));
walletManager.on('disconnected', () => console.log('Disconnected'));
walletManager.on('error', (error) => console.log('Error:', error));
walletManager.on('connectionRetry', (data) => console.log('Retrying:', data));
walletManager.on('healthCheckFailed', (health) => console.log('Health check failed:', health));
```

## Error Handling

The components integrate with the comprehensive error handling system:

### Error Types Handled

- `WALLET_NOT_INSTALLED` - Phantom wallet not found
- `WALLET_NOT_AVAILABLE` - Wallet installed but not responding  
- `USER_REJECTED` - User cancelled connection
- `CONNECTION_TIMEOUT` - Connection timed out
- `WALLET_LOCKED` - Wallet is locked
- `NETWORK_ERROR` - Network connection issues
- `RPC_ERROR` - Solana RPC issues
- `BROWSER_INCOMPATIBLE` - Browser not supported
- `RATE_LIMITED` - Too many connection attempts
- `CONNECTION_FAILED` - Generic connection failure

### Error Display Features

- User-friendly error messages
- Categorized error types with appropriate actions
- Retry functionality for retryable errors
- External action links (e.g., "Install Phantom")
- Detailed error information for debugging

## Styling and Theming

### Xbox 360 Dashboard Aesthetic

The components follow the Xbox 360 dashboard design principles:

- **Color Scheme**: Primary green (#10b981) with dark backgrounds
- **Typography**: Clean, gaming-focused fonts
- **Animations**: Subtle glow effects and smooth transitions
- **Visual Hierarchy**: Clear status indicators and feedback

### CSS Classes

The components use Tailwind CSS with custom enhancements:

```css
/* Core glow effect */
.pulse-glow {
  animation: pulse-glow 2s infinite;
}

/* Xbox-style sweep animation */
.xbox-glow::before {
  background: linear-gradient(45deg, transparent, rgba(16, 185, 129, 0.1), transparent);
  animation: xbox-sweep 3s infinite;
}

/* Enhanced hover effects */
.wallet-btn:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
}
```

### Customization

Components accept custom CSS classes and can be styled with additional Tailwind utilities:

```javascript
const button = new WalletConnectButton(container, {
  className: 'custom-button-class shadow-2xl',
  variant: 'primary'
});
```

## Accessibility Features

- **WCAG 2.1 AA Compliant**: Proper contrast ratios and semantic HTML
- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **Screen Reader Support**: Comprehensive ARIA labels and descriptions
- **Focus Management**: Proper focus indicators and tab order
- **Reduced Motion**: Respects `prefers-reduced-motion` setting
- **High Contrast**: Support for high contrast mode

## Browser Support

- **Modern Browsers**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **Mobile**: iOS Safari 14+, Chrome Mobile 88+
- **Features**: ES2020, CSS Grid, Flexbox, CSS Custom Properties
- **Polyfills**: Automatic detection and graceful degradation

## Performance

- **Bundle Size**: ~15KB minified + gzipped (excluding Tailwind)
- **Runtime**: Minimal DOM manipulation with efficient event handling
- **Memory**: Proper cleanup and garbage collection
- **Animations**: Hardware-accelerated CSS animations
- **Lazy Loading**: Components initialize only when needed

## Testing

Run the demo to test all components:

```bash
# Serve the demo file
python -m http.server 8000
# Visit http://localhost:8000/src/ui/examples/wallet-ui-demo.html
```

## Integration Examples

### React Integration

```jsx
import { useEffect, useRef } from 'react';
import { createWalletUI } from './wallet-ui.js';

function WalletComponent() {
  const containerRef = useRef(null);
  const walletUIRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && !walletUIRef.current) {
      walletUIRef.current = createWalletUI(containerRef.current, {
        layout: 'full',
        showErrors: true
      });
    }

    return () => {
      if (walletUIRef.current) {
        walletUIRef.current.destroy();
        walletUIRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} className="wallet-container" />;
}
```

### Vue Integration

```vue
<template>
  <div ref="walletContainer" class="wallet-container"></div>
</template>

<script>
import { createWalletUI } from './wallet-ui.js';

export default {
  name: 'WalletComponent',
  data() {
    return {
      walletUI: null
    };
  },
  mounted() {
    this.walletUI = createWalletUI(this.$refs.walletContainer, {
      layout: 'compact',
      showStatus: true
    });
  },
  beforeUnmount() {
    if (this.walletUI) {
      this.walletUI.destroy();
    }
  }
};
</script>
```

## API Reference

### Component Methods

All components implement these standard methods:

- `init()` - Initialize component
- `render()` - Render HTML structure  
- `updateState()` - Update component state
- `setupEventListeners()` - Setup event handlers
- `destroy()` - Clean up and remove component

### Utility Functions

- `createWalletUI(container, options)` - Create complete wallet UI
- `injectStyles()` - Inject CSS styles
- `getWalletManager()` - Get wallet manager instance

## Contributing

1. Follow the existing code structure and patterns
2. Maintain Xbox 360 dashboard aesthetic
3. Ensure accessibility compliance
4. Add comprehensive JSDoc comments
5. Test across all supported browsers
6. Update documentation for new features

## License

Part of the MLG.clan platform. Internal use only.