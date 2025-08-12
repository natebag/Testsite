/**
 * MLG.clan Responsive Button Component
 * 
 * A flexible button component with gaming aesthetics, Xbox 360 styling,
 * and comprehensive responsive/touch optimization
 */

import { 
  createComponent, 
  combineClasses, 
  validateProps, 
  getAccessibleButtonProps,
  generateGamingClasses,
  getTouchOptimizedClasses,
  touchUtils,
  responsivePatterns
} from './utils.js';
import { BUTTON_CLASSES, COMPONENT_VARIANTS, COMPONENT_SIZES } from './constants.js';

/**
 * Responsive Gaming Button component with touch optimization
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.variant - Button variant (primary, secondary, burn, gaming)
 * @param {string} props.size - Button size (xs, sm, md, lg, xl)
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {boolean} props.loading - Whether button is in loading state
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Click handler
 * @param {string} props.type - Button type (button, submit, reset)
 * @param {boolean} props.fullWidth - Whether button takes full width
 * @param {boolean} props.responsive - Enable responsive sizing
 * @param {boolean} props.touchOptimized - Enable touch optimizations
 * @param {string} props.icon - Icon to display in button
 * @param {string} props.iconPosition - Icon position (left, right)
 * @param {string} props.ariaLabel - Accessibility label
 * @param {string} props.hapticFeedback - Haptic feedback type (light, medium, heavy)
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
    responsive = true,
    touchOptimized = true,
    icon = null,
    iconPosition = 'left',
    ariaLabel,
    hapticFeedback = 'medium',
    testId,
    ...restProps
  } = props;

  // Validate props in development
  if (process.env.NODE_ENV === 'development') {
    validateProps(props, {
      variant: { type: 'string', oneOf: ['primary', 'secondary', 'burn', 'gaming', 'danger', 'ghost'] },
      size: { type: 'string', oneOf: Object.values(COMPONENT_SIZES) },
      disabled: { type: 'boolean' },
      loading: { type: 'boolean' },
      responsive: { type: 'boolean' },
      touchOptimized: { type: 'boolean' },
      onClick: { type: 'function' }
    }, 'Button');
  }

  // Generate responsive and touch-optimized classes
  const responsiveClasses = responsive ? generateGamingClasses('gamingButton') : '';
  const touchClasses = touchOptimized ? getTouchOptimizedClasses(touchUtils.gamingTouchTarget) : '';
  
  const buttonClasses = combineClasses(
    BUTTON_CLASSES.base,
    responsive ? responsiveClasses : BUTTON_CLASSES.sizes[size],
    getGamingVariantClasses(variant),
    touchClasses,
    fullWidth ? 'w-full' : '',
    loading ? 'cursor-wait' : '',
    disabled && !loading ? 'opacity-50 cursor-not-allowed' : '',
    'transition-all duration-200 active:scale-95',
    touchOptimized ? 'touch-manipulation select-none' : '',
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
    
    // Haptic feedback for touch devices
    if (touchOptimized && 'vibrate' in navigator) {
      const hapticPatterns = {
        light: 25,
        medium: 50,
        heavy: 100
      };
      navigator.vibrate(hapticPatterns[hapticFeedback] || 50);
    }
    
    if (onClick) {
      onClick(e);
    }
  };

  // Helper function to render icon
  const renderIcon = (iconContent, position) => {
    if (!iconContent) return '';
    
    const iconClasses = position === 'right' ? 'ml-2' : 'mr-2';
    return `<span class="inline-flex ${iconClasses}">${iconContent}</span>`;
  };

  return `
    <button 
      class="${buttonClasses}"
      ${Object.entries(accessibleProps).map(([key, value]) => 
        value !== undefined ? `${key}="${value}"` : ''
      ).filter(Boolean).join(' ')}
      ${testId ? `data-testid="${testId}"` : ''}
      ${touchOptimized ? 'data-touch-optimized="true"' : ''}
      ${hapticFeedback ? `data-haptic="${hapticFeedback}"` : ''}
      onclick="(${handleClick.toString()})(event)"
      ${Object.entries(restProps).map(([key, value]) => 
        `${key}="${value}"`
      ).join(' ')}
    >
      <span class="flex items-center justify-center gap-2">
        ${loading ? `
          <svg class="animate-spin h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ` : ''}
        ${icon && iconPosition === 'left' && !loading ? renderIcon(icon, 'left') : ''}
        <span class="${loading ? 'opacity-75' : ''}">${children}</span>
        ${icon && iconPosition === 'right' && !loading ? renderIcon(icon, 'right') : ''}
      </span>
    </button>
  `;
});

/**
 * Get gaming variant classes for buttons
 */
function getGamingVariantClasses(variant) {
  const variantClasses = {
    primary: 'bg-gradient-to-r from-gaming-accent to-xbox-green-light text-black font-semibold hover:shadow-glow-primary',
    secondary: 'bg-tile-bg-primary border-2 border-gaming-accent text-gaming-accent hover:bg-gaming-accent hover:text-black',
    burn: 'bg-gradient-to-r from-burn-red to-burn-orange text-white font-semibold hover:shadow-glow-burn animate-burn-pulse',
    gaming: 'bg-gradient-to-r from-gaming-purple to-gaming-blue text-white font-semibold hover:shadow-glow-wallet',
    danger: 'bg-gradient-to-r from-gaming-red to-burn-red text-white font-semibold hover:shadow-glow-burn',
    ghost: 'bg-transparent border-2 border-tile-border text-white hover:bg-tile-hover hover:border-gaming-accent'
  };
  
  return variantClasses[variant] || variantClasses.primary;
}

export default Button;