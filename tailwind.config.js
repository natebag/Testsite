/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
    "./*.html",
    "./public/**/*.html",
    "./src/ui/components/**/*.js",
    "./src/shared/components/**/*.{js,jsx}",
    "./mobile/src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    // Gaming-optimized responsive breakpoints
    screens: {
      // Mobile devices
      'xs': '375px',        // Small mobile devices (iPhone SE)
      'sm': '640px',        // Mobile devices (standard)
      'md': '768px',        // Tablets
      'lg': '1024px',       // Laptop/small desktop
      'xl': '1280px',       // Desktop
      '2xl': '1536px',      // Large desktop
      
      // Gaming-specific breakpoints
      'mobile': '480px',    // Gaming mobile breakpoint
      'tablet': '768px',    // Gaming tablet breakpoint
      'desktop': '1024px',  // Gaming desktop breakpoint
      'gaming': '1440px',   // Competitive gaming standard
      'ultra': '1920px',    // Ultra-wide gaming
      '4k': '2560px',       // 4K gaming displays
      
      // Special device targeting
      'touch': {'raw': '(hover: none) and (pointer: coarse)'}, // Touch devices
      'mouse': {'raw': '(hover: hover) and (pointer: fine)'},   // Mouse devices
      'retina': {'raw': '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)'}, // Retina displays
      
      // Orientation-based breakpoints
      'portrait': {'raw': '(orientation: portrait)'},
      'landscape': {'raw': '(orientation: landscape)'},
      
      // Gaming layout specific
      'competitive': {'min': '1920px', 'max': '2560px'}, // Competitive gaming range
      'tournament': {'min': '1440px'},                    // Tournament standard
      
      // Maximum breakpoints for mobile-first design
      'max-sm': {'max': '639px'},
      'max-md': {'max': '767px'},
      'max-lg': {'max': '1023px'},
      'max-xl': {'max': '1279px'},
      'max-2xl': {'max': '1535px'}
    },
    extend: {
      fontFamily: {
        // MLG Official Fonts
        'mlg-primary': ['Rajdhani', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
        'mlg-heading': ['Orbitron', 'Segoe UI', 'system-ui', 'sans-serif'],
        'mlg-display': ['Exo 2', 'Orbitron', 'system-ui', 'sans-serif'],
        'mlg-gaming': ['Play', 'Rajdhani', 'monospace', 'system-ui'],
        'mlg-mono': ['Fira Code', 'SF Mono', 'Monaco', 'Cascadia Code', 'monospace'],
        
        // Gaming font aliases
        'gaming': ['Play', 'Rajdhani', 'system-ui'],
        'competitive': ['Orbitron', 'Segoe UI', 'sans-serif'],
        'display': ['Exo 2', 'Orbitron', 'system-ui'],
        
        // Backwards compatibility
        'sans': ['Rajdhani', 'Segoe UI', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'mono': ['Fira Code', 'SF Mono', 'Monaco', 'Cascadia Code', 'Consolas', 'monospace']
      },
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
        'burn-yellow': '#ffaa00',
        
        // MLG Brand Colors
        'mlg': {
          'text-primary': '#ffffff',
          'text-secondary': '#e5e5e5',
          'text-tertiary': '#cccccc',
          'text-muted': '#999999',
          'text-disabled': '#666666',
          'text-accent': '#00ff88',
          'text-brand': '#00d4ff',
          'text-warning': '#fbbf24',
          'text-error': '#ef4444',
          'text-success': '#10b981'
        }
      },
      animation: {
        'pulse-neon': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'burn-pulse': 'burn-pulse 3s infinite',
        'spin-slow': 'spin 2s linear infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out'
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
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(0, 255, 136, 0.3)',
        'glow-burn': '0 0 25px rgba(255, 68, 68, 0.4)',
        'glow-wallet': '0 0 15px rgba(139, 92, 246, 0.3)',
        'glow-intense': '0 0 30px rgba(0, 255, 136, 0.6)',
        'mobile-card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'mobile-glow': '0 0 15px rgba(0, 255, 136, 0.2)'
      },
      backdropBlur: {
        'gaming': '10px'
      },
      fontSize: {
        // Mobile-optimized font sizes
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        
        // Gaming-specific responsive text sizes
        'mobile-header': ['1.5rem', { lineHeight: '2rem' }],
        'mobile-body': ['0.875rem', { lineHeight: '1.25rem' }],
        'tablet-header': ['2rem', { lineHeight: '2.5rem' }],
        'desktop-header': ['2.5rem', { lineHeight: '3rem' }],
        'gaming-title': ['3rem', { lineHeight: '1.1' }],
        'competitive-display': ['4rem', { lineHeight: '1' }]
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        
        // Touch-friendly spacing
        'touch-xs': '0.25rem',   // 4px
        'touch-sm': '0.5rem',    // 8px
        'touch-md': '0.75rem',   // 12px
        'touch-lg': '1rem',      // 16px
        'touch-xl': '1.5rem',    // 24px
        'touch-2xl': '2rem',     // 32px
        'touch-3xl': '2.5rem',   // 40px
        
        // Gaming-specific spacing
        'gaming-xs': '0.5rem',
        'gaming-sm': '1rem',
        'gaming-md': '1.5rem',
        'gaming-lg': '2rem',
        'gaming-xl': '3rem',
        'gaming-2xl': '4rem'
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100'
      },
      // Touch target minimum sizes
      minHeight: {
        'touch': '44px',
        'touch-lg': '48px',
        'gaming-button': '52px'
      },
      minWidth: {
        'touch': '44px',
        'touch-lg': '48px',
        'gaming-button': '120px'
      },
      // Container sizes for different gaming layouts
      maxWidth: {
        'mobile-gaming': '100%',
        'tablet-gaming': '768px',
        'desktop-gaming': '1200px',
        'ultra-gaming': '1800px',
        'competitive': '2560px'
      },
      // Grid template columns for gaming layouts
      gridTemplateColumns: {
        'mobile-tiles': 'repeat(1, minmax(0, 1fr))',
        'tablet-tiles': 'repeat(2, minmax(0, 1fr))',
        'desktop-tiles': 'repeat(3, minmax(0, 1fr))',
        'gaming-tiles': 'repeat(4, minmax(0, 1fr))',
        'ultra-tiles': 'repeat(5, minmax(0, 1fr))',
        
        // Responsive auto-fit grids
        'auto-mobile': 'repeat(auto-fit, minmax(280px, 1fr))',
        'auto-tablet': 'repeat(auto-fit, minmax(320px, 1fr))',
        'auto-desktop': 'repeat(auto-fit, minmax(350px, 1fr))',
        'auto-gaming': 'repeat(auto-fit, minmax(400px, 1fr))'
      },
      // Gaming-specific aspect ratios
      aspectRatio: {
        'gaming-card': '16 / 10',
        'tournament-banner': '21 / 9',
        'mobile-card': '4 / 3',
        'clan-logo': '1 / 1'
      }
    }
  },
  plugins: [
    // Enhanced gaming-specific utilities with responsive variants
    function({ addUtilities, addComponents, theme, addVariant }) {
      // Add touch variant
      addVariant('touch', '@media (hover: none) and (pointer: coarse)')
      addVariant('mouse', '@media (hover: hover) and (pointer: fine)')
      
      // Mobile-first gaming utilities
      const newUtilities = {
        // Base card components with responsive variants
        '.card-glow': {
          background: theme('colors.tile-bg-primary'),
          border: `1px solid ${theme('colors.tile-border')}`,
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          borderRadius: '12px'
        },
        '.card-glow:hover': {
          borderColor: theme('colors.gaming-accent'),
          boxShadow: theme('boxShadow.glow-primary'),
          transform: 'translateY(-2px)'
        },
        
        // Mobile-optimized card
        '.card-mobile': {
          background: theme('colors.tile-bg-primary'),
          border: `1px solid ${theme('colors.tile-border')}`,
          borderRadius: '8px',
          padding: '1rem',
          boxShadow: theme('boxShadow.mobile-card')
        },
        
        // Touch-friendly buttons
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
          letterSpacing: '0.5px',
          minHeight: theme('minHeight.touch'),
          minWidth: theme('minWidth.touch'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        },
        '.btn-gaming:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme('boxShadow.glow-primary')
        },
        
        // Mobile-optimized gaming button
        '.btn-gaming-mobile': {
          background: `linear-gradient(45deg, ${theme('colors.gaming-accent')}, ${theme('colors.xbox-green-light')})`,
          color: 'black',
          border: 'none',
          padding: '0.875rem 1.25rem',
          borderRadius: '8px',
          fontWeight: '600',
          fontSize: '0.875rem',
          minHeight: theme('minHeight.touch-lg'),
          minWidth: theme('minWidth.gaming-button'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        },
        
        // Touch-friendly burn button
        '.btn-burn': {
          background: `linear-gradient(45deg, ${theme('colors.burn-red')}, ${theme('colors.burn-orange')})`,
          color: 'white',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          animation: theme('animation.burn-pulse'),
          minHeight: theme('minHeight.touch'),
          minWidth: theme('minWidth.touch')
        },
        '.btn-burn:hover': {
          transform: 'scale(1.05)',
          boxShadow: theme('boxShadow.glow-burn')
        },
        
        // Gaming tile system
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
        
        // Mobile-optimized tile
        '.tile-mobile': {
          background: theme('colors.tile-bg-primary'),
          border: `1px solid ${theme('colors.tile-border')}`,
          borderRadius: '8px',
          padding: '1rem',
          transition: 'all 0.2s ease',
          position: 'relative'
        },
        
        // Wallet states
        '.wallet-connected': {
          background: theme('colors.gaming-purple'),
          boxShadow: theme('boxShadow.glow-wallet')
        },
        
        // Gaming text effects
        '.text-gaming': {
          background: `linear-gradient(45deg, ${theme('colors.gaming-accent')}, ${theme('colors.xbox-green-light')})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        },
        
        // Touch-friendly navigation
        '.nav-mobile': {
          padding: '1rem',
          gap: '0.5rem',
          minHeight: theme('minHeight.touch-lg')
        },
        
        // Gaming-specific responsive grids
        '.grid-gaming-mobile': {
          display: 'grid',
          gridTemplateColumns: theme('gridTemplateColumns.mobile-tiles'),
          gap: '1rem'
        },
        '.grid-gaming-tablet': {
          display: 'grid',
          gridTemplateColumns: theme('gridTemplateColumns.tablet-tiles'),
          gap: '1.5rem'
        },
        '.grid-gaming-desktop': {
          display: 'grid',
          gridTemplateColumns: theme('gridTemplateColumns.desktop-tiles'),
          gap: '2rem'
        },
        
        // Touch interaction helpers
        '.touch-action-pan-y': {
          touchAction: 'pan-y'
        },
        '.touch-action-manipulation': {
          touchAction: 'manipulation'
        },
        
        // Gaming performance optimizations
        '.gpu-accelerated': {
          transform: 'translateZ(0)',
          willChange: 'transform'
        }
      }
      
      addUtilities(newUtilities)
      
      // Responsive component variants
      const responsiveComponents = {
        '.leaderboard-mobile': {
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          padding: '1rem'
        },
        '.leaderboard-desktop': {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          padding: '2rem'
        },
        
        '.voting-interface-mobile': {
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          padding: '1rem'
        },
        '.voting-interface-desktop': {
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '2rem',
          padding: '2rem'
        }
      }
      
      addComponents(responsiveComponents)
    }
  ],
  // Optimize for production
  corePlugins: {
    preflight: true
  }
}