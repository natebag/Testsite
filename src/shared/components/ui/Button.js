/**
 * MLG.clan Button Component
 * 
 * A flexible button component with gaming aesthetics and Xbox 360 styling
 */

import { createComponent, combineClasses, validateProps, getAccessibleButtonProps } from './utils.js';
import { BUTTON_CLASSES, COMPONENT_VARIANTS, COMPONENT_SIZES } from './constants.js';

/**
 * Button component with gaming aesthetics
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.variant - Button variant (primary, secondary, etc.)
 * @param {string} props.size - Button size (xs, sm, md, lg, xl)
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {boolean} props.loading - Whether button is in loading state
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Click handler
 * @param {string} props.type - Button type (button, submit, reset)
 * @param {boolean} props.fullWidth - Whether button takes full width
 * @param {string} props.ariaLabel - Accessibility label
 * @returns {string} Button HTML
 */
const Button = createComponent('Button', (props) => {
  const {
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    className = '',
    onClick,
    type = 'button',
    fullWidth = false,
    ariaLabel,
    testId,
    ...restProps
  } = props;

  // Validate props in development
  if (process.env.NODE_ENV === 'development') {
    validateProps(props, {
      variant: { type: 'string', oneOf: Object.values(COMPONENT_VARIANTS) },
      size: { type: 'string', oneOf: Object.values(COMPONENT_SIZES) },
      disabled: { type: 'boolean' },
      loading: { type: 'boolean' },
      onClick: { type: 'function' }
    }, 'Button');
  }

  const buttonClasses = combineClasses(
    BUTTON_CLASSES.base,
    BUTTON_CLASSES.sizes[size],
    BUTTON_CLASSES.variants[variant],
    fullWidth ? 'w-full' : '',
    loading ? 'cursor-wait' : '',
    disabled && !loading ? 'opacity-50 cursor-not-allowed' : '',
    className
  );

  const accessibleProps = getAccessibleButtonProps({
    disabled,
    loading,
    ariaLabel,
    type
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
      ${loading ? `
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ` : ''}
      <span class="${loading ? 'opacity-75' : ''}">${children}</span>
    </button>
  `;
});

export default Button;