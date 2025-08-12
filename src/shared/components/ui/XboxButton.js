/**
 * MLG.clan Xbox Button Component
 * 
 * A specialized button component with Xbox 360 controller button aesthetics
 */

import { createComponent, combineClasses, getAccessibleButtonProps } from './utils.js';

/**
 * Xbox Button component with controller button aesthetics
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.buttonType - Xbox button type (A, B, X, Y, or custom)
 * @param {string} props.size - Button size (sm, md, lg)
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {boolean} props.loading - Whether button is in loading state
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.glowing - Whether button should glow
 * @param {string} props.label - Button label text
 * @returns {string} Xbox Button HTML
 */
const XboxButton = createComponent('XboxButton', (props) => {
  const {
    children,
    buttonType = 'A',
    size = 'md',
    disabled = false,
    loading = false,
    onClick,
    glowing = false,
    label = '',
    className = '',
    testId,
    ...restProps
  } = props;

  const buttonColors = {
    A: {
      bg: 'bg-green-600',
      hover: 'hover:bg-green-500',
      shadow: 'shadow-green-400/50',
      glow: 'shadow-green-400/75'
    },
    B: {
      bg: 'bg-red-600',
      hover: 'hover:bg-red-500', 
      shadow: 'shadow-red-400/50',
      glow: 'shadow-red-400/75'
    },
    X: {
      bg: 'bg-blue-600',
      hover: 'hover:bg-blue-500',
      shadow: 'shadow-blue-400/50',
      glow: 'shadow-blue-400/75'
    },
    Y: {
      bg: 'bg-yellow-600',
      hover: 'hover:bg-yellow-500',
      shadow: 'shadow-yellow-400/50',
      glow: 'shadow-yellow-400/75'
    },
    custom: {
      bg: 'bg-gray-600',
      hover: 'hover:bg-gray-500',
      shadow: 'shadow-gray-400/50',
      glow: 'shadow-gray-400/75'
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base'
  };

  const colors = buttonColors[buttonType] || buttonColors.custom;

  const buttonClasses = combineClasses(
    'relative inline-flex items-center justify-center',
    'rounded-full border-2 border-white/20',
    'font-bold text-white transition-all duration-300',
    'focus:outline-none focus:ring-4 focus:ring-white/25',
    'transform active:scale-95',
    colors.bg,
    colors.hover,
    sizeClasses[size],
    glowing ? `shadow-2xl ${colors.glow} animate-pulse` : `shadow-lg ${colors.shadow}`,
    loading ? 'cursor-wait' : 'hover:scale-110',
    disabled && !loading ? 'opacity-50 cursor-not-allowed' : '',
    className
  );

  const accessibleProps = getAccessibleButtonProps({
    disabled,
    loading,
    ariaLabel: label || `Xbox ${buttonType} button`,
    type: 'button'
  });

  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  return `
    <div class="inline-flex flex-col items-center space-y-2">
      <button 
        class="${buttonClasses}"
        ${Object.entries(accessibleProps).map(([key, value]) => 
          value !== undefined ? `${key}="${value}"` : ''
        ).filter(Boolean).join(' ')}
        ${testId ? `data-testid="${testId}"` : ''}
        onclick="(${handleClick.toString()})(event)"
        ${Object.entries(restProps).map(([key, value]) => 
          `${key}="${value}"`
        ).join(' ')}
      >
        <!-- Loading Spinner -->
        ${loading ? `
          <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ` : `
          <!-- Button Content -->
          ${children || buttonType}
        `}

        <!-- Glow Effect Overlay -->
        ${glowing ? `
          <div class="absolute inset-0 rounded-full bg-white/10 animate-ping"></div>
        ` : ''}

        <!-- Inner Glow -->
        <div class="absolute inset-1 rounded-full bg-white/5"></div>
      </button>

      <!-- Button Label -->
      ${label ? `
        <span class="text-xs text-gray-400 font-medium select-none">
          ${label}
        </span>
      ` : ''}
    </div>
  `;
});

/**
 * Xbox Button Group component for common gaming actions
 */
export const XboxButtonGroup = createComponent('XboxButtonGroup', (props) => {
  const {
    onAccept,
    onCancel,
    onAction,
    onMenu,
    size = 'md',
    className = '',
    testId,
    ...restProps
  } = props;

  return `
    <div 
      class="flex items-center space-x-4 ${className}"
      ${testId ? `data-testid="${testId}"` : ''}
      ${Object.entries(restProps).map(([key, value]) => 
        `${key}="${value}"`
      ).join(' ')}
    >
      ${onAccept ? XboxButton({
        buttonType: 'A',
        size,
        onClick: onAccept,
        label: 'Accept',
        testId: testId ? `${testId}-accept` : undefined
      }) : ''}

      ${onCancel ? XboxButton({
        buttonType: 'B', 
        size,
        onClick: onCancel,
        label: 'Cancel',
        testId: testId ? `${testId}-cancel` : undefined
      }) : ''}

      ${onAction ? XboxButton({
        buttonType: 'X',
        size,
        onClick: onAction,
        label: 'Action',
        testId: testId ? `${testId}-action` : undefined
      }) : ''}

      ${onMenu ? XboxButton({
        buttonType: 'Y',
        size,
        onClick: onMenu,
        label: 'Menu',
        testId: testId ? `${testId}-menu` : undefined
      }) : ''}
    </div>
  `;
});

export default XboxButton;