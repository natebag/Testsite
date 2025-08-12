/**
 * MLG.clan Main Application Entry Point
 * 
 * Centralized initialization and module loading for the MLG.clan platform
 * Optimized for Vite bundling and modern JavaScript
 */

// Import core styles
import './styles/main.css'
import './styles/lazy-loading.css'

// Import advanced code splitting system (Task 17.7)
import './shared/performance/CodeSplittingIntegration.js'

// Import state management system
import './shared/utils/state/index.js'

// Import core MLG systems
import './shared/utils/api/mlg-api-client-consolidated.js'
import './shared/utils/wallet/mlg-wallet-init-consolidated.js'
import './core/websocket/mlg-websocket-manager.js'
import './shared/utils/error/mlg-error-handler.js'
import './shared/utils/cache/mlg-cache-manager.js'
import './shared/utils/offline/mlg-offline-manager.js'
import './shared/utils/mlg-connection-status.js'
import './shared/utils/offline/mlg-fallback-system.js'
import './shared/utils/loading/mlg-loading-states.js'
import './shared/utils/error/mlg-error-logger.js'
import './shared/utils/error/mlg-error-system.js'

// Import lazy loading system
import './shared/utils/lazy-loading/index.js'

// Import UI components
import './shared/components/gaming-loading-states.js'
import './shared/components/xbox-page-transitions.js'
import './shared/components/wallet-loading-states.js'
import './shared/components/vote-burn-loading.js'
import './shared/components/gaming-upload-progress.js'
import './shared/components/mlg-loading-system.js'

// Import core production components for Task 16.1
import './shared/components/burn-vote-confirmation-ui.js'
import './shared/components/content-submission-form.js'
import './shared/components/clan-management-ui.jsx'
import './shared/components/clan-leaderboard-ui.jsx'

// Import core systems
import './features/voting/solana-voting-system.js'
import './features/wallet/phantom-wallet.js'
import './features/clans/clan-voting.js'
import './features/content/content-validator.js'

// Initialize application
class MLGApplication {
  constructor() {
    this.initialized = false
    this.modules = new Map()
  }

  async initialize() {
    if (this.initialized) return

    try {
      console.log('🎮 Initializing MLG.clan Application...')

      // Initialize core systems
      await this.initializeCoreServices()
      
      // Initialize page-specific features
      await this.initializePageFeatures()
      
      // Set up global event listeners
      this.setupGlobalEventListeners()
      
      this.initialized = true
      console.log('✅ MLG.clan Application initialized successfully')
      
      // Dispatch ready event
      window.dispatchEvent(new CustomEvent('mlg-app-ready'))
      
    } catch (error) {
      console.error('❌ Failed to initialize MLG.clan Application:', error)
      throw error
    }
  }

  async initializeCoreServices() {
    // Initialize wallet system if enabled
    if (document.querySelector('meta[name="mlg-wallet-auto-init"]')) {
      await window.initializeMLGWallet()
    }

    // Initialize API client
    if (window.MLGApiClient) {
      console.log('🌐 API Client ready')
    }

    // Initialize WebSocket if available
    if (window.MLGWebSocketManager) {
      await window.MLGWebSocketManager.connect()
    }
  }

  async initializePageFeatures() {
    const pageName = this.getPageName()
    
    switch (pageName) {
      case 'voting':
        await this.initializeVotingFeatures()
        break
      case 'clans':
        await this.initializeClanFeatures()
        break
      case 'content':
        await this.initializeContentFeatures()
        break
      case 'profile':
        await this.initializeProfileFeatures()
        break
      case 'dao':
        await this.initializeDAOFeatures()
        break
      case 'analytics':
        await this.initializeAnalyticsFeatures()
        break
      default:
        await this.initializeHomeFeatures()
    }
  }

  getPageName() {
    const path = window.location.pathname
    const fileName = path.split('/').pop()
    return fileName.replace('.html', '') || 'index'
  }

  async initializeVotingFeatures() {
    console.log('🗳️ Initializing voting features...')
    // Voting-specific initialization will be handled by existing page scripts
  }

  async initializeClanFeatures() {
    console.log('🏛️ Initializing clan features...')
    // Clan-specific initialization will be handled by existing page scripts
  }

  async initializeContentFeatures() {
    console.log('📱 Initializing content features...')
    // Content-specific initialization will be handled by existing page scripts
  }

  async initializeProfileFeatures() {
    console.log('👤 Initializing profile features...')
    // Profile-specific initialization will be handled by existing page scripts
  }

  async initializeDAOFeatures() {
    console.log('🏛️ Initializing DAO features...')
    // DAO-specific initialization will be handled by existing page scripts
  }

  async initializeAnalyticsFeatures() {
    console.log('📊 Initializing analytics features...')
    // Analytics-specific initialization will be handled by existing page scripts
  }

  async initializeHomeFeatures() {
    console.log('🏠 Initializing home features...')
    // Home-specific initialization will be handled by existing page scripts
  }

  setupGlobalEventListeners() {
    // Handle wallet connection events
    window.addEventListener('wallet-connected', (event) => {
      console.log('🎯 Global wallet connected event:', event.detail)
    })

    window.addEventListener('wallet-disconnected', (event) => {
      console.log('🔌 Global wallet disconnected event:', event.detail)
    })

    // Handle application errors
    window.addEventListener('error', (event) => {
      if (window.MLGErrorHandler) {
        window.MLGErrorHandler.handleGlobalError(event.error)
      }
    })

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (window.MLGErrorHandler) {
        window.MLGErrorHandler.handleGlobalError(event.reason)
      }
    })
  }

  // Public API methods
  getModule(name) {
    return this.modules.get(name)
  }

  registerModule(name, module) {
    this.modules.set(name, module)
  }

  isInitialized() {
    return this.initialized
  }
}

// Create global application instance
const mlgApp = new MLGApplication()

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    mlgApp.initialize().catch(console.error)
  })
} else {
  mlgApp.initialize().catch(console.error)
}

// Export for manual initialization if needed
window.MLGApplication = mlgApp

// Make state management system available globally for React components
window.MLGStateManagement = {
  // Import state management when needed
  async getStateManager() {
    const stateModule = await import('./shared/utils/state/index.js');
    return stateModule.default;
  },
  
  // Quick access to main components
  async getProvider() {
    const { MLGStateProvider } = await import('./shared/utils/state/index.js');
    return MLGStateProvider;
  },
  
  async getHooks() {
    const stateModule = await import('./shared/utils/state/index.js');
    return {
      useWallet: stateModule.useWallet,
      useVoting: stateModule.useVoting,
      useClan: stateModule.useClan,
      useUser: stateModule.useUser,
      useSettings: stateModule.useSettings,
      useUI: stateModule.useUI
    };
  }
};

console.log('🎮 MLG.clan State Management System Loaded');
console.log('✅ Task 16.8 - Proper state management (React Context API) implemented');

// Export for module systems
export { MLGApplication }
export default mlgApp