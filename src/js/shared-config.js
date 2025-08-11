/**
 * MLG.clan Shared Configuration
 * Common configurations and dependencies for all pages
 */

window.MLGConfig = {
  // External dependencies
  externalDependencies: [
    {
      name: 'tailwind',
      src: 'https://cdn.tailwindcss.com',
      globalCheck: 'tailwind',
      critical: true,
      options: {
        async: false,
        timeout: 10000
      }
    },
    {
      name: 'lucide',
      src: 'https://unpkg.com/lucide@latest/dist/umd/lucide.js',
      globalCheck: 'lucide',
      critical: true,
      options: {
        async: false,
        timeout: 10000
      }
    },
    {
      name: 'socket-io',
      src: 'https://cdn.socket.io/4.7.4/socket.io.min.js',
      globalCheck: 'io',
      critical: false,
      options: {
        async: true,
        timeout: 15000
      }
    },
    {
      name: 'solana-web3',
      src: 'https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js',
      globalCheck: () => typeof window.solanaWeb3 !== 'undefined' || typeof window.solana !== 'undefined',
      critical: false,
      options: {
        async: true,
        timeout: 15000
      }
    }
  ],

  // Tailwind configuration
  tailwindConfig: {
    theme: {
      extend: {
        colors: {
          'gaming-bg': '#0a0a0f',
          'gaming-surface': '#1a1a2e',
          'gaming-accent': '#00ff88',
          'gaming-purple': '#8b5cf6',
          'gaming-blue': '#3b82f6',
          'gaming-yellow': '#fbbf24',
          'gaming-red': '#ef4444'
        },
        animation: {
          'pulse-neon': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          'glow': 'glow 2s ease-in-out infinite alternate',
          'float': 'float 6s ease-in-out infinite'
        }
      }
    }
  },

  // CSP configuration
  csp: "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com https://cdn.socket.io; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; img-src 'self' data: blob: https:; connect-src 'self' wss: https: ws://localhost:3000; frame-src 'self' https://www.youtube.com https://player.twitch.tv https://www.tiktok.com; font-src 'self' data:;",

  // Common styles
  sharedStyles: `
    /* Gaming Theme Styles */
    :root {
      --neon-green: #00ff88;
      --neon-blue: #00ffff;
      --neon-purple: #8b5cf6;
      --dark-bg: #0a0a0f;
      --card-bg: #1a1a2e;
    }
    
    body {
      background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      overflow-x: hidden;
    }
    
    .neon-glow {
      box-shadow: 0 0 10px var(--neon-green), 0 0 20px var(--neon-green), 0 0 30px var(--neon-green);
      border: 1px solid var(--neon-green);
    }
    
    .card-glow {
      background: rgba(26, 26, 46, 0.95);
      border: 1px solid rgba(0, 255, 136, 0.2);
      backdrop-filter: blur(15px);
      transition: all 0.3s ease;
    }
    
    .card-glow:hover {
      border-color: rgba(0, 255, 136, 0.5);
      box-shadow: 0 0 20px rgba(0, 255, 136, 0.1);
      transform: translateY(-2px);
    }
    
    @keyframes glow {
      from { box-shadow: 0 0 10px var(--neon-green); }
      to { box-shadow: 0 0 20px var(--neon-green), 0 0 30px var(--neon-green); }
    }
    
    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
      100% { transform: translateY(0px); }
    }
    
    .status-online {
      position: relative;
    }
    
    .status-online::before {
      content: '';
      position: absolute;
      top: -2px;
      right: -2px;
      width: 12px;
      height: 12px;
      background: var(--neon-green);
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    
    .hero-text {
      background: linear-gradient(90deg, #00ff88, #00ffff, #8b5cf6);
      background-size: 300% 100%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: gradient-shift 3s ease infinite;
    }
    
    @keyframes gradient-shift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    .notification {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 1000;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    }
    
    .notification.show {
      transform: translateX(0);
    }
    
    .loading-spinner {
      border: 2px solid rgba(0, 255, 136, 0.1);
      border-left: 2px solid var(--neon-green);
      border-radius: 50%;
      width: 20px;
      height: 20px;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Module Loading Error Styles */
    .module-error {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc2626;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 14px;
      max-width: 400px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }

    /* Fallback navigation styles */
    .fallback-nav {
      background: rgba(220, 38, 38, 0.1);
      border: 1px solid #dc2626;
      border-radius: 8px;
      padding: 12px;
      margin: 16px 0;
      text-center;
    }
  `,

  // API configuration
  api: {
    baseUrl: window.location.origin + '/api',
    timeout: 30000,
    retries: 3
  },

  // Feature flags
  features: {
    enableSPARouter: true,
    enableRealTimeUpdates: true,
    enableWalletIntegration: true,
    enableAnalytics: true,
    enableOfflineSupport: false
  },

  // Development settings
  development: {
    showErrors: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    enableDebugLogs: window.location.search.includes('debug=true'),
    mockData: window.location.search.includes('mock=true')
  }
};

// Initialize Tailwind configuration
if (typeof window.tailwind !== 'undefined') {
  try {
    window.tailwind.config = window.MLGConfig.tailwindConfig;
  } catch (error) {
    console.warn('Failed to configure Tailwind:', error);
  }
}

// Inject shared styles
if (document.head) {
  const styleElement = document.createElement('style');
  styleElement.textContent = window.MLGConfig.sharedStyles;
  document.head.appendChild(styleElement);
}

console.log('📋 MLG.clan shared configuration loaded');