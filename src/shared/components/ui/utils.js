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