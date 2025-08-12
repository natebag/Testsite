/**
 * MLG.clan UI Component Utilities
 * 
 * Utility functions for component creation and styling
 */

import { RESPONSIVE_BREAKPOINTS } from './constants.js';

/**
 * Combines multiple CSS class names, filtering out falsy values
 * @param {...string} classes - Class names to combine
 * @returns {string} Combined class names
 */
export function combineClasses(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Creates a component with consistent props handling
 * @param {string} displayName - Component display name
 * @param {Function} renderFn - Render function
 * @returns {Function} Component function
 */
export function createComponent(displayName, renderFn) {
  const Component = (props) => {
    const {
      children,
      className = '',
      variant = 'default',
      size = 'md',
      disabled = false,
      loading = false,
      'data-testid': testId,
      ...restProps
    } = props;

    return renderFn({
      children,
      className,
      variant,
      size,
      disabled,
      loading,
      testId,
      ...restProps
    });
  };

  Component.displayName = displayName;
  return Component;
}

/**
 * Generates responsive class names based on breakpoints
 * @param {Object} responsiveProps - Object with breakpoint keys and class values
 * @returns {string} Responsive class names
 */
export function getResponsiveClasses(responsiveProps) {
  if (!responsiveProps || typeof responsiveProps !== 'object') {
    return '';
  }

  const classes = [];
  
  // Base classes (no prefix)
  if (responsiveProps.base) {
    classes.push(responsiveProps.base);
  }

  // Responsive classes
  Object.entries(responsiveProps).forEach(([breakpoint, classNames]) => {
    if (breakpoint === 'base' || !classNames) return;
    
    const prefix = breakpoint === 'xs' ? '' : `${breakpoint}:`;
    const prefixedClasses = classNames.split(' ').map(cls => `${prefix}${cls}`).join(' ');
    classes.push(prefixedClasses);
  });

  return classes.join(' ');
}

/**
 * Creates animation classes based on animation type
 * @param {string} animationType - Type of animation
 * @param {Object} options - Animation options
 * @returns {string} Animation class names
 */
export function getAnimationClasses(animationType, options = {}) {
  const { duration = 'normal', delay = '0s', easing = 'ease' } = options;
  
  const baseClass = 'transition-all';
  const durationClass = {
    fast: 'duration-200',
    normal: 'duration-300',
    slow: 'duration-500'
  }[duration] || 'duration-300';

  const animationClasses = {
    fade: 'opacity-0 data-[state=open]:opacity-100',
    slide: 'transform translate-y-4 data-[state=open]:translate-y-0',
    scale: 'transform scale-95 data-[state=open]:scale-100',
    slideLeft: 'transform -translate-x-4 data-[state=open]:translate-x-0',
    slideRight: 'transform translate-x-4 data-[state=open]:translate-x-0',
    bounce: 'transform data-[state=open]:animate-bounce',
    pulse: 'data-[state=open]:animate-pulse',
    spin: 'data-[state=open]:animate-spin'
  };

  return combineClasses(
    baseClass,
    durationClass,
    animationClasses[animationType] || ''
  );
}

/**
 * Generates focus ring classes for accessibility
 * @param {string} color - Focus ring color
 * @returns {string} Focus ring classes
 */
export function getFocusRingClasses(color = 'green') {
  return `focus:outline-none focus:ring-2 focus:ring-${color}-400 focus:ring-offset-2 focus:ring-offset-gray-900`;
}

/**
 * Creates hover effect classes
 * @param {string} effect - Hover effect type
 * @returns {string} Hover effect classes
 */
export function getHoverClasses(effect = 'default') {
  const effects = {
    default: 'hover:scale-105 hover:shadow-lg',
    glow: 'hover:shadow-green-400/25 hover:shadow-xl',
    lift: 'hover:-translate-y-1 hover:shadow-xl',
    bounce: 'hover:animate-bounce',
    pulse: 'hover:animate-pulse',
    gaming: 'hover:shadow-cyan-400/30 hover:shadow-2xl hover:scale-105',
    xbox: 'hover:shadow-green-400/30 hover:shadow-2xl hover:scale-105',
    burn: 'hover:shadow-red-400/40 hover:shadow-2xl hover:scale-110'
  };

  return effects[effect] || effects.default;
}

/**
 * Validates component props and logs warnings in development
 * @param {Object} props - Component props
 * @param {Object} schema - Validation schema
 * @param {string} componentName - Component name for error reporting
 */
export function validateProps(props, schema, componentName) {
  if (process.env.NODE_ENV !== 'development') return;

  Object.entries(schema).forEach(([propName, validator]) => {
    const value = props[propName];
    
    if (validator.required && (value === undefined || value === null)) {
      console.warn(`${componentName}: Required prop '${propName}' is missing`);
      return;
    }

    if (value !== undefined && validator.type && typeof value !== validator.type) {
      console.warn(`${componentName}: Prop '${propName}' should be of type '${validator.type}', got '${typeof value}'`);
    }

    if (value !== undefined && validator.oneOf && !validator.oneOf.includes(value)) {
      console.warn(`${componentName}: Prop '${propName}' should be one of [${validator.oneOf.join(', ')}], got '${value}'`);
    }
  });
}

/**
 * Creates accessible button props
 * @param {Object} options - Button options
 * @returns {Object} Accessible button props
 */
export function getAccessibleButtonProps(options = {}) {
  const {
    disabled = false,
    loading = false,
    ariaLabel,
    ariaDescribedBy,
    type = 'button'
  } = options;

  return {
    type,
    disabled: disabled || loading,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-disabled': disabled || loading,
    'aria-busy': loading,
    role: 'button',
    tabIndex: disabled ? -1 : 0
  };
}

/**
 * Generates skeleton loading classes
 * @param {Object} options - Skeleton options
 * @returns {string} Skeleton classes
 */
export function getSkeletonClasses(options = {}) {
  const { variant = 'default', animated = true } = options;
  
  const baseClasses = 'bg-gray-700';
  const animationClasses = animated ? 'animate-pulse' : '';
  
  const variantClasses = {
    default: 'rounded',
    circle: 'rounded-full',
    text: 'rounded h-4',
    title: 'rounded h-6',
    button: 'rounded-lg h-10',
    card: 'rounded-xl'
  };

  return combineClasses(
    baseClasses,
    animationClasses,
    variantClasses[variant] || variantClasses.default
  );
}

/**
 * Debounce function for performance optimization
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance optimization
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Gaming-specific responsive patterns for mobile-first design
 */
export const responsivePatterns = {
  // Gaming tile layouts
  gamingTileLayout: {
    base: 'grid grid-cols-1 gap-4 p-4',
    sm: 'grid-cols-1 gap-6 p-6',
    md: 'grid-cols-2 gap-6 p-6',
    lg: 'grid-cols-3 gap-8 p-8',
    xl: 'grid-cols-4 gap-8 p-8',
    '2xl': 'grid-cols-5 gap-10 p-10'
  },
  
  // Gaming text sizes
  gamingText: {
    base: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
    '2xl': 'text-4xl'
  },
  
  // Gaming headers
  gamingHeader: {
    base: 'text-xl font-bold',
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
    '2xl': 'text-6xl'
  },
  
  // Gaming buttons
  gamingButton: {
    base: 'px-4 py-2 text-sm min-h-11 min-w-11',
    sm: 'px-6 py-3 text-base min-h-12 min-w-12',
    md: 'px-8 py-3 text-lg min-h-12 min-w-24',
    lg: 'px-10 py-4 text-xl min-h-14 min-w-32'
  },
  
  // Gaming cards/tiles
  gamingCard: {
    base: 'p-4 rounded-lg border border-gray-700',
    sm: 'p-6 rounded-xl',
    md: 'p-8 rounded-xl',
    lg: 'p-10 rounded-2xl'
  },
  
  // Navigation layouts
  navigation: {
    base: 'fixed bottom-0 left-0 right-0 z-50',
    sm: 'fixed bottom-0 left-0 right-0 z-50',
    md: 'relative bottom-auto left-auto right-auto', // Switch to horizontal nav
    lg: 'relative bottom-auto left-auto right-auto'
  },
  
  // Gaming dashboard layouts
  dashboard: {
    base: 'flex flex-col gap-4 p-4',
    md: 'grid grid-cols-2 gap-6 p-6',
    lg: 'grid grid-cols-3 gap-8 p-8',
    xl: 'grid grid-cols-4 gap-8 p-8'
  },
  
  // Voting interfaces
  voting: {
    base: 'flex flex-col gap-4',
    md: 'grid grid-cols-2 gap-6',
    lg: 'grid grid-cols-3 gap-8'
  },
  
  // Clan roster layouts
  clanRoster: {
    base: 'flex flex-col gap-2',
    sm: 'grid grid-cols-1 gap-3',
    md: 'grid grid-cols-2 gap-4',
    lg: 'grid grid-cols-3 gap-6',
    xl: 'grid grid-cols-4 gap-6',
    '2xl': 'grid grid-cols-6 gap-8'
  },
  
  // Leaderboard layouts
  leaderboard: {
    base: 'flex flex-col gap-2',
    md: 'grid grid-cols-1 gap-4',
    lg: 'grid grid-cols-1 gap-6'
  },
  
  // Tournament bracket layouts
  tournamentBracket: {
    base: 'flex flex-col gap-4',
    md: 'grid grid-cols-2 gap-4',
    lg: 'grid grid-cols-3 gap-6',
    xl: 'grid grid-cols-4 gap-8'
  }
};

/**
 * Touch-friendly utilities
 */
export const touchUtils = {
  // Minimum touch target size (44px)
  touchTarget: 'min-h-11 min-w-11',
  
  // Larger touch target for gaming (48px)
  touchTargetLarge: 'min-h-12 min-w-12',
  
  // Gaming button touch target
  gamingTouchTarget: 'min-h-14 min-w-32',
  
  // Touch interaction optimizations
  touchOptimized: 'touch-manipulation select-none',
  
  // Remove tap highlight on touch devices
  noTapHighlight: 'tap-highlight-transparent'
};

/**
 * Device detection utilities
 */
export const deviceUtils = {
  // Check if device supports hover
  supportsHover: () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(hover: hover)').matches;
  },
  
  // Check if device is touch-based
  isTouchDevice: () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  },
  
  // Check if device has retina display
  isRetina: () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)').matches;
  },
  
  // Get current breakpoint
  getCurrentBreakpoint: () => {
    if (typeof window === 'undefined') return 'base';
    const width = window.innerWidth;
    if (width < 640) return 'base';
    if (width < 768) return 'sm';
    if (width < 1024) return 'md';
    if (width < 1280) return 'lg';
    if (width < 1536) return 'xl';
    return '2xl';
  }
};

/**
 * Generate responsive gaming component classes
 * @param {string} componentType - Type of gaming component
 * @param {object} customBreakpoints - Custom breakpoint overrides
 * @returns {string} Complete responsive class string
 */
export function generateGamingClasses(componentType, customBreakpoints = {}) {
  const basePattern = responsivePatterns[componentType] || {};
  const mergedPattern = { ...basePattern, ...customBreakpoints };
  
  return getResponsiveClasses(mergedPattern);
}

/**
 * Generate touch-optimized classes based on device capabilities
 * @param {string} baseClasses - Base CSS classes
 * @returns {string} Device-optimized classes
 */
export function getTouchOptimizedClasses(baseClasses) {
  const isTouchDevice = deviceUtils.isTouchDevice();
  const supportsHover = deviceUtils.supportsHover();
  
  let classes = baseClasses;
  
  if (isTouchDevice) {
    classes += ` ${touchUtils.touchTarget} ${touchUtils.touchOptimized}`;
  }
  
  if (!supportsHover) {
    // Remove hover-dependent classes for touch devices
    classes = classes.replace(/hover:\S+/g, '');
  }
  
  return classes;
}

/**
 * Create responsive image loading with mobile optimization
 * @param {HTMLElement} imgElement - Image element
 * @param {object} sources - Source object with different sizes
 * @param {object} options - Loading options
 */
export function createResponsiveImage(imgElement, sources, options = {}) {
  const { lazy = true, retina = true } = options;
  
  // Set up responsive sources
  const srcSet = [];
  Object.entries(sources).forEach(([size, src]) => {
    srcSet.push(`${src} ${size}`);
    if (retina && deviceUtils.isRetina()) {
      srcSet.push(`${src.replace('.', '@2x.')} ${parseInt(size) * 2}w`);
    }
  });
  
  imgElement.srcset = srcSet.join(', ');
  imgElement.sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
  
  // Add loading optimization
  if (lazy) {
    imgElement.loading = 'lazy';
    imgElement.decoding = 'async';
  }
  
  // Add performance classes
  imgElement.className = combineClasses(
    imgElement.className,
    'transition-opacity duration-300 opacity-0',
    'data-[loaded=true]:opacity-100'
  );
  
  // Handle load event
  imgElement.addEventListener('load', () => {
    imgElement.setAttribute('data-loaded', 'true');
  });
}

/**
 * Mobile-first responsive grid utility
 * @param {number} minItemWidth - Minimum item width in pixels
 * @param {number} gap - Gap between items in pixels
 * @returns {string} CSS grid template columns value
 */
export function createResponsiveGrid(minItemWidth = 280, gap = 16) {
  return `repeat(auto-fit, minmax(${minItemWidth}px, 1fr))`;
}

/**
 * Gaming-specific breakpoint utilities
 */
export const gamingBreakpoints = {
  mobile: '375px',
  tablet: '768px', 
  desktop: '1024px',
  gaming: '1440px',
  ultra: '1920px',
  fourK: '2560px'
};

/**
 * Check if current viewport matches gaming breakpoint
 * @param {string} breakpoint - Breakpoint name
 * @returns {boolean} Whether viewport matches
 */
export function matchesGamingBreakpoint(breakpoint) {
  if (typeof window === 'undefined') return false;
  
  const width = window.innerWidth;
  const breakpointValue = parseInt(gamingBreakpoints[breakpoint]);
  
  switch (breakpoint) {
    case 'mobile':
      return width >= breakpointValue && width < parseInt(gamingBreakpoints.tablet);
    case 'tablet':
      return width >= breakpointValue && width < parseInt(gamingBreakpoints.desktop);
    case 'desktop':
      return width >= breakpointValue && width < parseInt(gamingBreakpoints.gaming);
    case 'gaming':
      return width >= breakpointValue && width < parseInt(gamingBreakpoints.ultra);
    case 'ultra':
      return width >= breakpointValue && width < parseInt(gamingBreakpoints.fourK);
    case 'fourK':
      return width >= breakpointValue;
    default:
      return false;
  }
}