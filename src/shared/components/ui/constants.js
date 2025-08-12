/**
 * MLG.clan UI Component Constants
 * 
 * Shared constants for consistent styling across all components
 */

export const COMPONENT_VARIANTS = {
  primary: 'primary',
  secondary: 'secondary',
  accent: 'accent',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  gaming: 'gaming',
  xbox: 'xbox',
  burn: 'burn'
};

export const COMPONENT_SIZES = {
  xs: 'xs',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl'
};

export const GAMING_COLORS = {
  // Primary Gaming Colors
  gamingBg: '#0a0a0f',
  gamingSurface: '#1a1a2e',
  gamingAccent: '#00ff88',
  gamingPurple: '#8b5cf6',
  gamingBlue: '#3b82f6',
  gamingYellow: '#fbbf24',
  gamingRed: '#ef4444',
  
  // Xbox 360 Theme
  xboxGreen: '#107c10',
  xboxGreenLight: '#16c60c',
  xboxGreenDark: '#0e6b0e',
  
  // Tile System
  tileBgPrimary: 'rgba(26, 26, 46, 0.8)',
  tileBgSecondary: 'rgba(16, 124, 16, 0.1)',
  tileBorder: 'rgba(0, 255, 136, 0.3)',
  tileHover: 'rgba(0, 255, 136, 0.1)',
  
  // Burn/Vote Colors
  burnRed: '#ff4444',
  burnOrange: '#ff8800',
  burnYellow: '#ffaa00'
};

export const ANIMATION_DURATIONS = {
  fast: '0.2s',
  normal: '0.3s',
  slow: '0.6s'
};

export const RESPONSIVE_BREAKPOINTS = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

export const GLOW_EFFECTS = {
  primary: '0 0 20px rgba(0, 255, 136, 0.3)',
  burn: '0 0 25px rgba(255, 68, 68, 0.4)',
  wallet: '0 0 15px rgba(139, 92, 246, 0.3)',
  xbox: '0 0 20px rgba(16, 124, 16, 0.3)'
};

export const BUTTON_CLASSES = {
  base: 'inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  sizes: {
    xs: 'px-2 py-1 text-xs rounded-md min-h-[32px]',
    sm: 'px-3 py-2 text-sm rounded-md min-h-[36px]',
    md: 'px-4 py-2 text-base rounded-lg min-h-[40px]',
    lg: 'px-6 py-3 text-lg rounded-lg min-h-[44px]',
    xl: 'px-8 py-4 text-xl rounded-xl min-h-[48px]'
  },
  variants: {
    primary: 'bg-gradient-to-r from-green-400 to-green-500 text-black hover:from-green-300 hover:to-green-400 shadow-lg hover:shadow-green-400/25',
    secondary: 'bg-gray-800 text-green-400 border-2 border-green-400 hover:bg-green-400 hover:text-black',
    accent: 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg hover:shadow-purple-400/25',
    success: 'bg-green-600 text-white hover:bg-green-500',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-500',
    danger: 'bg-red-600 text-white hover:bg-red-500',
    gaming: 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-black hover:from-cyan-300 hover:to-cyan-400',
    xbox: 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-500 hover:to-green-600',
    burn: 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-400 hover:to-orange-400 animate-pulse'
  }
};

export const CARD_CLASSES = {
  base: 'bg-gray-900/80 border border-green-400/30 backdrop-blur-sm transition-all duration-300',
  variants: {
    default: 'hover:border-green-400 hover:shadow-lg hover:shadow-green-400/20',
    gaming: 'bg-gradient-to-br from-gray-900 to-gray-800 border-cyan-400/30 hover:border-cyan-400',
    xbox: 'bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-400/30 hover:border-green-400',
    elevated: 'shadow-xl hover:shadow-2xl transform hover:scale-[1.02]'
  },
  sizes: {
    sm: 'p-4 rounded-lg',
    md: 'p-6 rounded-xl',
    lg: 'p-8 rounded-2xl'
  }
};

export const INPUT_CLASSES = {
  base: 'w-full bg-gray-800 border border-gray-600 text-white placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent',
  sizes: {
    sm: 'px-3 py-2 text-sm rounded-md',
    md: 'px-4 py-3 text-base rounded-lg',
    lg: 'px-5 py-4 text-lg rounded-xl'
  },
  states: {
    error: 'border-red-500 focus:ring-red-400',
    success: 'border-green-500 focus:ring-green-400',
    disabled: 'opacity-50 cursor-not-allowed'
  }
};