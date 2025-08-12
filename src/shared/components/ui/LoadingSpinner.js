/**
 * MLG.clan Loading Spinner Component
 * 
 * Gaming-themed loading spinners with Xbox 360 aesthetics
 */

import { createComponent, combineClasses } from './utils.js';

/**
 * Loading Spinner component with gaming aesthetics
 * @param {Object} props - Component props
 * @param {string} props.variant - Spinner variant (default, gaming, xbox, burn)
 * @param {string} props.size - Spinner size (xs, sm, md, lg, xl)
 * @param {string} props.color - Spinner color
 * @param {string} props.text - Loading text
 * @param {boolean} props.overlay - Whether to show as overlay
 * @returns {string} Loading Spinner HTML
 */
const LoadingSpinner = createComponent('LoadingSpinner', (props) => {
  const {
    variant = 'default',
    size = 'md',
    color = 'green',
    text = '',
    overlay = false,
    className = '',
    testId,
    ...restProps
  } = props;

  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6', 
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    green: 'border-green-400',
    blue: 'border-blue-400',
    purple: 'border-purple-400',
    red: 'border-red-400',
    yellow: 'border-yellow-400',
    white: 'border-white'
  };

  const spinnerClasses = combineClasses(
    'animate-spin rounded-full border-2 border-opacity-30',
    sizeClasses[size],
    colorClasses[color] || colorClasses.green,
    `border-t-${color}-400`,
    className
  );

  const containerClasses = combineClasses(
    'flex flex-col items-center justify-center',
    overlay ? 'fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm z-50' : '',
    text ? 'space-y-3' : ''
  );

  // Gaming-themed spinner variants
  const renderSpinner = () => {
    switch (variant) {
      case 'gaming':
        return `
          <div class="relative ${sizeClasses[size]}">
            <div class="${spinnerClasses}"></div>
            <div class="absolute inset-0 rounded-full border-2 border-cyan-400 border-opacity-20 animate-ping"></div>
          </div>
        `;

      case 'xbox':
        return `
          <div class="relative ${sizeClasses[size]}">
            <div class="absolute inset-0 rounded-full border-2 border-green-400 border-opacity-30 animate-spin"></div>
            <div class="absolute inset-2 rounded-full border-2 border-green-400 border-opacity-50 animate-spin" style="animation-direction: reverse; animation-duration: 0.75s;"></div>
            <div class="absolute inset-4 rounded-full bg-green-400 animate-pulse"></div>
          </div>
        `;

      case 'burn':
        return `
          <div class="relative ${sizeClasses[size]}">
            <div class="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 to-orange-500 animate-spin opacity-75"></div>
            <div class="absolute inset-1 rounded-full bg-gray-900"></div>
            <div class="absolute inset-3 rounded-full bg-gradient-to-r from-red-400 to-orange-400 animate-pulse"></div>
          </div>
        `;

      case 'dots':
        return `
          <div class="flex space-x-2">
            <div class="w-2 h-2 bg-green-400 rounded-full animate-bounce" style="animation-delay: 0ms;"></div>
            <div class="w-2 h-2 bg-green-400 rounded-full animate-bounce" style="animation-delay: 150ms;"></div>
            <div class="w-2 h-2 bg-green-400 rounded-full animate-bounce" style="animation-delay: 300ms;"></div>
          </div>
        `;

      case 'bars':
        return `
          <div class="flex space-x-1 items-end">
            <div class="w-1 bg-green-400 animate-pulse" style="height: 20px; animation-delay: 0ms;"></div>
            <div class="w-1 bg-green-400 animate-pulse" style="height: 15px; animation-delay: 150ms;"></div>
            <div class="w-1 bg-green-400 animate-pulse" style="height: 25px; animation-delay: 300ms;"></div>
            <div class="w-1 bg-green-400 animate-pulse" style="height: 18px; animation-delay: 450ms;"></div>
            <div class="w-1 bg-green-400 animate-pulse" style="height: 22px; animation-delay: 600ms;"></div>
          </div>
        `;

      default:
        return `<div class="${spinnerClasses}"></div>`;
    }
  };

  return `
    <div 
      class="${containerClasses}"
      ${testId ? `data-testid="${testId}"` : ''}
      ${Object.entries(restProps).map(([key, value]) => 
        `${key}="${value}"`
      ).join(' ')}
    >
      ${renderSpinner()}
      
      ${text ? `
        <div class="text-center">
          <p class="text-sm text-gray-300 font-medium">
            ${text}
          </p>
        </div>
      ` : ''}
    </div>
  `;
});

/**
 * Button Loading Spinner - Inline spinner for buttons
 */
export const ButtonSpinner = createComponent('ButtonSpinner', (props) => {
  const {
    size = 'sm',
    color = 'white',
    className = '',
    ...restProps
  } = props;

  return LoadingSpinner({
    variant: 'default',
    size,
    color,
    className: combineClasses('-ml-1 mr-3', className),
    ...restProps
  });
});

/**
 * Page Loading Overlay - Full page loading state
 */
export const PageLoadingOverlay = createComponent('PageLoadingOverlay', (props) => {
  const {
    text = 'Loading...',
    variant = 'xbox',
    ...restProps
  } = props;

  return LoadingSpinner({
    variant,
    size: 'xl',
    text,
    overlay: true,
    ...restProps
  });
});

/**
 * Content Loading Placeholder
 */
export const ContentLoader = createComponent('ContentLoader', (props) => {
  const {
    text = 'Loading content...',
    variant = 'gaming',
    size = 'lg',
    className = '',
    ...restProps
  } = props;

  return `
    <div class="flex flex-col items-center justify-center p-8 ${className}">
      ${LoadingSpinner({
        variant,
        size,
        text,
        ...restProps
      })}
    </div>
  `;
});

export default LoadingSpinner;