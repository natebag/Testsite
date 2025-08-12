/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
    "./*.html",
    "./src/ui/components/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        'gaming-bg': '#0a0a0f',
        'gaming-surface': '#1a1a2e',
        'gaming-accent': '#00ff88',
        'gaming-purple': '#8b5cf6',
        'gaming-blue': '#3b82f6',
        'gaming-yellow': '#fbbf24',
        'gaming-red': '#ef4444',
        'xbox-green': '#107c10',
        'xbox-green-light': '#16c60c',
        'xbox-green-dark': '#0e6b0e',
        'tile-bg-primary': 'rgba(26, 26, 46, 0.8)',
        'tile-bg-secondary': 'rgba(16, 124, 16, 0.1)',
        'tile-border': 'rgba(0, 255, 136, 0.3)',
        'tile-hover': 'rgba(0, 255, 136, 0.1)',
        'burn-red': '#ff4444',
        'burn-orange': '#ff8800',
        'burn-yellow': '#ffaa00'
      },
      animation: {
        'pulse-neon': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'burn-pulse': 'burn-pulse 3s infinite',
        'spin-slow': 'spin 2s linear infinite'
      },
      keyframes: {
        glow: {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)' 
          },
          '50%': { 
            boxShadow: '0 0 30px rgba(0, 255, 136, 0.6)' 
          }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        'burn-pulse': {
          '0%, 100%': { 
            boxShadow: '0 0 5px rgba(255, 68, 68, 0.3)' 
          },
          '50%': { 
            boxShadow: '0 0 25px rgba(255, 68, 68, 0.6)' 
          }
        }
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(0, 255, 136, 0.3)',
        'glow-burn': '0 0 25px rgba(255, 68, 68, 0.4)',
        'glow-wallet': '0 0 15px rgba(139, 92, 246, 0.3)',
        'glow-intense': '0 0 30px rgba(0, 255, 136, 0.6)'
      },
      backdropBlur: {
        'gaming': '10px'
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }]
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100'
      }
    }
  },
  plugins: [
    // Custom plugin for gaming-specific utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.card-glow': {
          background: theme('colors.tile-bg-primary'),
          border: `1px solid ${theme('colors.tile-border')}`,
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease'
        },
        '.card-glow:hover': {
          borderColor: theme('colors.gaming-accent'),
          boxShadow: theme('boxShadow.glow-primary'),
          transform: 'translateY(-2px)'
        },
        '.btn-gaming': {
          background: `linear-gradient(45deg, ${theme('colors.gaming-accent')}, ${theme('colors.xbox-green-light')})`,
          color: 'black',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        },
        '.btn-gaming:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme('boxShadow.glow-primary')
        },
        '.btn-burn': {
          background: `linear-gradient(45deg, ${theme('colors.burn-red')}, ${theme('colors.burn-orange')})`,
          color: 'white',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          animation: theme('animation.burn-pulse')
        },
        '.btn-burn:hover': {
          transform: 'scale(1.05)',
          boxShadow: theme('boxShadow.glow-burn')
        },
        '.tile-base': {
          background: theme('colors.tile-bg-primary'),
          border: `2px solid ${theme('colors.tile-border')}`,
          borderRadius: '12px',
          padding: '1.5rem',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden'
        },
        '.tile-base:hover': {
          borderColor: theme('colors.gaming-accent'),
          boxShadow: theme('boxShadow.glow-primary'),
          transform: 'scale(1.02)'
        },
        '.wallet-connected': {
          background: theme('colors.gaming-purple'),
          boxShadow: theme('boxShadow.glow-wallet')
        },
        '.text-gaming': {
          background: `linear-gradient(45deg, ${theme('colors.gaming-accent')}, ${theme('colors.xbox-green-light')})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }
      }
      
      addUtilities(newUtilities)
    }
  ],
  // Optimize for production
  corePlugins: {
    preflight: true
  }
}