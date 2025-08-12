/**
 * MLG.clan Gaming Tile Component
 * 
 * A specialized tile component with Xbox 360 aesthetic and gaming features
 */

import { createComponent, combineClasses, getHoverClasses } from './utils.js';

/**
 * Gaming Tile component with Xbox 360 aesthetic
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Tile content
 * @param {string} props.title - Tile title
 * @param {string} props.subtitle - Tile subtitle
 * @param {string} props.icon - Icon element or SVG
 * @param {string} props.variant - Tile variant (default, accent, success, warning, danger)
 * @param {string} props.size - Tile size (sm, md, lg, xl)
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.glow - Whether to show glow effect
 * @param {boolean} props.animated - Whether to show animations
 * @param {string} props.badge - Badge content
 * @param {string} props.image - Background image URL
 * @returns {string} Gaming Tile HTML
 */
const GamingTile = createComponent('GamingTile', (props) => {
  const {
    children,
    title = '',
    subtitle = '',
    icon = '',
    variant = 'default',
    size = 'md',
    onClick,
    glow = true,
    animated = true,
    badge = '',
    image = '',
    className = '',
    testId,
    ...restProps
  } = props;

  const isInteractive = Boolean(onClick);

  const variantClasses = {
    default: 'bg-gray-900/80 border-green-400/30 hover:border-green-400',
    accent: 'bg-gradient-to-br from-cyan-900/20 to-cyan-800/20 border-cyan-400/30 hover:border-cyan-400',
    success: 'bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-400/30 hover:border-green-400',
    warning: 'bg-gradient-to-br from-yellow-900/20 to-yellow-800/20 border-yellow-400/30 hover:border-yellow-400',
    danger: 'bg-gradient-to-br from-red-900/20 to-red-800/20 border-red-400/30 hover:border-red-400',
    gaming: 'bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-400/30 hover:border-purple-400'
  };

  const sizeClasses = {
    sm: 'p-4 min-h-[120px]',
    md: 'p-6 min-h-[160px]',
    lg: 'p-8 min-h-[200px]',
    xl: 'p-10 min-h-[240px]'
  };

  const glowClasses = {
    default: 'hover:shadow-green-400/25',
    accent: 'hover:shadow-cyan-400/25',
    success: 'hover:shadow-green-400/25',
    warning: 'hover:shadow-yellow-400/25',
    danger: 'hover:shadow-red-400/25',
    gaming: 'hover:shadow-purple-400/25'
  };

  const tileClasses = combineClasses(
    'relative overflow-hidden rounded-xl border-2 backdrop-blur-sm',
    'transition-all duration-300 transform',
    variantClasses[variant],
    sizeClasses[size],
    glow ? `hover:shadow-2xl ${glowClasses[variant]}` : '',
    animated ? 'hover:scale-105 hover:-translate-y-1' : '',
    isInteractive ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400' : '',
    className
  );

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
  };

  const handleKeyDown = (e) => {
    if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      if (onClick) {
        onClick(e);
      }
    }
  };

  const Tag = isInteractive ? 'button' : 'div';
  const interactiveProps = isInteractive ? {
    tabIndex: 0,
    role: 'button',
    'aria-label': title || 'Gaming tile'
  } : {};

  return `
    <${Tag}
      class="${tileClasses}"
      ${Object.entries(interactiveProps).map(([key, value]) => 
        `${key}="${value}"`
      ).join(' ')}
      ${isInteractive ? `onclick="(${handleClick.toString()})(event)"` : ''}
      ${isInteractive ? `onkeydown="(${handleKeyDown.toString()})(event)"` : ''}
      ${testId ? `data-testid="${testId}"` : ''}
      ${Object.entries(restProps).map(([key, value]) => 
        `${key}="${value}"`
      ).join(' ')}
    >
      <!-- Background Image -->
      ${image ? `
        <div 
          class="absolute inset-0 bg-cover bg-center opacity-20"
          style="background-image: url('${image}')"
        ></div>
      ` : ''}

      <!-- Animated Sweep Effect -->
      ${animated ? `
        <div class="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-700">
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-1000"></div>
        </div>
      ` : ''}

      <!-- Badge -->
      ${badge ? `
        <div class="absolute top-3 right-3 bg-green-500 text-black text-xs font-bold px-2 py-1 rounded-full">
          ${badge}
        </div>
      ` : ''}

      <!-- Content Container -->
      <div class="relative z-10 h-full flex flex-col">
        <!-- Header -->
        ${icon || title || subtitle ? `
          <div class="flex items-start space-x-3 mb-4">
            ${icon ? `
              <div class="flex-shrink-0 text-2xl">
                ${icon}
              </div>
            ` : ''}
            
            <div class="flex-1 min-w-0">
              ${title ? `
                <h3 class="text-lg font-semibold text-white truncate">
                  ${title}
                </h3>
              ` : ''}
              
              ${subtitle ? `
                <p class="text-sm text-gray-400 mt-1">
                  ${subtitle}
                </p>
              ` : ''}
            </div>
          </div>
        ` : ''}

        <!-- Main Content -->
        ${children ? `
          <div class="flex-1 text-gray-300">
            ${children}
          </div>
        ` : ''}

        <!-- Interactive Indicator -->
        ${isInteractive ? `
          <div class="absolute bottom-3 right-3 opacity-50 group-hover:opacity-100 transition-opacity">
            <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        ` : ''}
      </div>
    </${Tag}>
  `;
});

export default GamingTile;