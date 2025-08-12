import { defineConfig } from 'vite'
import { resolve } from 'path'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  // Base configuration
  base: './',
  publicDir: 'public',
  
  // Build configuration
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    
    // Asset handling
    assetsDir: 'assets',
    cssCodeSplit: true,
    
    // Rollup options for advanced bundling
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        voting: resolve(__dirname, 'voting.html'),
        clans: resolve(__dirname, 'clans.html'),
        content: resolve(__dirname, 'content.html'),
        profile: resolve(__dirname, 'profile.html'),
        dao: resolve(__dirname, 'dao.html'),
        analytics: resolve(__dirname, 'analytics.html')
      },
      
      // External dependencies that should not be bundled
      external: [
        '@solana/web3.js',
        'lucide'
      ],
      
      output: {
        // Manual chunks for better code splitting
        manualChunks: {
          // Vendor chunk for large external libraries
          vendor: ['@solana/web3.js'],
          
          // MLG core functionality
          'mlg-core': [
            './src/js/mlg-api-client-consolidated.js',
            './src/js/mlg-wallet-init-consolidated.js'
          ],
          
          // UI components
          'ui-components': [
            './src/ui/components/wallet-ui.js',
            './src/ui/components/voting-interface-ui.js',
            './src/ui/components/clan-management-ui.js'
          ],
          
          // Web3 wallet functionality  
          'web3-wallet': [
            './src/wallet/phantom-wallet.js',
            './src/voting/solana-voting-system.js'
          ]
        },
        
        // Asset naming conventions
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash].${ext}`
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash].${ext}`
          }
          return `assets/[name]-[hash].${ext}`
        }
      }
    },
    
    // Enhanced minification settings
    minify: 'esbuild',
    target: 'es2020',
    
    // Performance optimization
    chunkSizeWarningLimit: 1600,
    
    // Advanced optimization
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        dead_code: true,
        unused: true
      },
      mangle: {
        toplevel: true,
        reserved: ['MLG', 'Phantom', 'Solana']
      }
    }
  },
  
  // Development server configuration
  server: {
    port: 3000,
    host: true,
    open: true,
    cors: true,
    
    // Proxy API calls to backend
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  // Preview server (for built files)
  preview: {
    port: 4173,
    host: true,
    cors: true
  },
  
  // Module resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/ui/components'),
      '@wallet': resolve(__dirname, './src/wallet'),
      '@voting': resolve(__dirname, './src/voting'),
      '@js': resolve(__dirname, './src/js')
    },
    
    // File extensions to resolve
    extensions: ['.js', '.mjs', '.json', '.css']
  },
  
  // CSS configuration  
  css: {
    devSourcemap: true
  },
  
  // Plugins
  plugins: [
    // Legacy browser support
    legacy({
      targets: ['defaults', 'not IE 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    })
  ],
  
  // Optimization
  optimizeDeps: {
    include: [
      '@solana/web3.js',
      '@solana/wallet-adapter-phantom'
    ],
    exclude: []
  },
  
  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString())
  },
  
  // ESBuild configuration
  esbuild: {
    keepNames: true,
    minifyIdentifiers: false,
    minifySyntax: true,
    minifyWhitespace: true
  }
})