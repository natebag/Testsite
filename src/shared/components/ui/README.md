# MLG.clan UI Component Library

A comprehensive collection of reusable UI components designed for the MLG gaming platform with Xbox 360 aesthetics and gaming-themed styling.

## Overview

This component library provides a complete set of UI building blocks that follow a consistent design system with:

- **Gaming Aesthetics**: Xbox 360 inspired design with glowing effects and gradients
- **Accessibility**: WCAG 2.1 AA compliant with proper ARIA labels and keyboard navigation
- **Responsive Design**: Mobile-first approach with responsive utilities
- **Performance**: Optimized components with minimal overhead
- **Consistency**: Unified styling through design tokens and shared utilities

## Quick Start

```javascript
// Import the component library
import { Button, Card, GamingTile, Grid } from '../shared/components/ui/index.js';

// Use components in your application
const myPage = `
  ${Grid({ cols: { base: '1', md: '3' }, gap: '6', children: `
    ${GamingTile({ 
      title: 'Player Stats',
      icon: '🎮',
      variant: 'gaming',
      children: 'View your gaming statistics'
    })}
    ${GamingTile({ 
      title: 'Leaderboard',
      icon: '🏆',
      variant: 'success',
      children: 'Check your ranking'
    })}
    ${GamingTile({ 
      title: 'Tournaments',
      icon: '⚔️',
      variant: 'accent',
      children: 'Join upcoming tournaments'
    })}
  ` })}
`;
```

## Component Categories

### Core UI Components
Essential building blocks for any interface:
- [`Button`](#button) - Gaming-themed buttons with multiple variants
- [`Card`](#card) - Flexible container with hover effects
- [`Input`](#input) - Form inputs with validation states
- [`Modal`](#modal) - Accessible modal dialogs
- [`Grid`](#grid) - Responsive grid layouts

### Gaming Components
Specialized components for gaming interfaces:
- [`GamingTile`](#gamingtile) - Xbox-style dashboard tiles
- [`XboxButton`](#xboxbutton) - Controller button aesthetics
- [`BurnButton`](#burnbutton) - Token burning with fire effects
- [`LoadingSpinner`](#loadingspinner) - Gaming-themed loading states
- [`SkeletonLoader`](#skeletonloader) - Content loading placeholders

### Layout Components
Tools for structuring your interface:
- [`Container`](#container) - Page containers with max widths
- [`Stack`](#stack) - Vertical and horizontal stacking
- [`Flex`](#flex) - Flexible box layouts
- [`Spacer`](#spacer) - Consistent spacing utilities

### Form Components
Complete form building toolkit:
- [`Form`](#form) - Form wrapper with validation
- [`FormField`](#formfield) - Field wrapper with labels
- [`FormGroup`](#formgroup) - Grouped form sections
- [`GamingForm`](#gamingform) - Gaming-styled form containers

## Component Reference

### Button

Flexible button component with gaming aesthetics and multiple variants.

```javascript
Button({
  variant: 'primary',     // primary, secondary, accent, gaming, xbox, burn
  size: 'md',            // xs, sm, md, lg, xl
  disabled: false,
  loading: false,
  fullWidth: false,
  onClick: () => {},
  children: 'Click Me'
})
```

**Variants:**
- `primary` - Green gradient (main actions)
- `secondary` - Outlined style (secondary actions)
- `accent` - Purple gradient (special features)
- `gaming` - Cyan gradient (gaming features)
- `xbox` - Xbox green (Xbox-specific actions)
- `burn` - Red/orange gradient with animation (destructive actions)

### GamingTile

Xbox 360 dashboard-style tiles for navigation and content display.

```javascript
GamingTile({
  title: 'Tile Title',
  subtitle: 'Optional subtitle',
  icon: '🎮',
  variant: 'default',    // default, accent, success, warning, danger, gaming
  size: 'md',           // sm, md, lg, xl
  onClick: () => {},
  glow: true,
  animated: true,
  badge: 'NEW',
  image: '/path/to/bg.jpg',
  children: 'Tile content'
})
```

**Features:**
- Hover animations and glow effects
- Background image support
- Badge overlays
- Accessibility support
- Responsive sizing

### LoadingSpinner

Gaming-themed loading indicators with multiple styles.

```javascript
LoadingSpinner({
  variant: 'default',    // default, gaming, xbox, burn, dots, bars
  size: 'md',           // xs, sm, md, lg, xl
  color: 'green',       // green, blue, purple, red, yellow, white
  text: 'Loading...',
  overlay: false        // Show as full-page overlay
})
```

**Variants:**
- `default` - Simple spinning circle
- `gaming` - Multi-layer spinning effect
- `xbox` - Xbox orb-style loader
- `burn` - Fire-themed loader for token burning
- `dots` - Bouncing dots
- `bars` - Animated bars

### Form Components

Comprehensive form building system with validation.

```javascript
// Basic form
Form({
  onSubmit: (data) => console.log(data),
  validation: {
    username: {
      required: true,
      minLength: 3,
      label: 'Username'
    },
    email: {
      required: true,
      email: true,
      label: 'Email'
    }
  },
  children: `
    ${FormField({
      label: 'Username',
      required: true,
      children: Input({
        name: 'username',
        placeholder: 'Enter username'
      })
    })}
    ${FormField({
      label: 'Email',
      required: true,
      children: Input({
        name: 'email',
        type: 'email',
        placeholder: 'Enter email'
      })
    })}
    ${Button({
      type: 'submit',
      children: 'Submit'
    })}
  `
})
```

### Grid System

Responsive grid layouts with gaming-optimized presets.

```javascript
// Basic responsive grid
Grid({
  cols: { base: '1', md: '2', lg: '3' },
  gap: '4',
  children: 'Grid items...'
})

// Gaming tile grid
GamingTileGrid({
  children: 'Gaming tiles...'
})

// Stats grid
StatsGrid({
  children: 'Stat cards...'
})
```

## Design Tokens

The component library uses consistent design tokens defined in `constants.js`:

### Colors
```javascript
const GAMING_COLORS = {
  gamingBg: '#0a0a0f',
  gamingSurface: '#1a1a2e', 
  gamingAccent: '#00ff88',
  xboxGreen: '#107c10',
  burnRed: '#ff4444'
}
```

### Component Variants
```javascript
const COMPONENT_VARIANTS = {
  primary: 'primary',
  secondary: 'secondary',
  accent: 'accent',
  gaming: 'gaming',
  xbox: 'xbox',
  burn: 'burn'
}
```

### Responsive Breakpoints
```javascript
const RESPONSIVE_BREAKPOINTS = {
  xs: '480px',
  sm: '640px', 
  md: '768px',
  lg: '1024px',
  xl: '1280px'
}
```

## Accessibility Features

All components include built-in accessibility features:

- **Keyboard Navigation**: Tab order and keyboard interaction support
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Focus Management**: Visible focus indicators and logical tab order
- **Color Contrast**: WCAG AA compliant color combinations
- **Reduced Motion**: Respects `prefers-reduced-motion` settings

## Performance Considerations

- **Minimal Bundle Size**: Tree-shakeable imports
- **CSS Optimization**: Utility-first approach with Tailwind CSS
- **Lazy Loading**: Components load only when needed
- **Animation Performance**: GPU-accelerated animations
- **Memory Management**: Proper cleanup of event listeners

## Gaming Theme Features

### Xbox 360 Aesthetic
- Dashboard-style tiles with glow effects
- Controller button styling
- Xbox green color palette
- Curved corners and gradients

### Interactive Effects
- Hover animations and scale transforms
- Glow and shadow effects
- Particle animations for special buttons
- Smooth transitions and easing

### Gaming-Specific Components
- Token burning with fire effects
- Leaderboard layouts
- Tournament brackets
- Achievement displays
- Score cards and stat grids

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow the existing component patterns
2. Include accessibility features
3. Add proper TypeScript types (when applicable)
4. Test across all supported browsers
5. Update documentation for new components

## Examples

See the `examples/` directory for complete usage examples of all components in realistic gaming scenarios.