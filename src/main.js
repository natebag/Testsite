/**
 * MLG.clan Main Application Entry Point
 * 
 * Centralized initialization and module loading for the MLG.clan platform
 * Optimized for Vite bundling and modern JavaScript
 */

// Import core styles
import './styles/main.css'

// Import core MLG systems
import './js/mlg-api-client-consolidated.js'
import './js/mlg-wallet-init-consolidated.js'
import './js/mlg-websocket-manager.js'
import './js/mlg-error-handler.js'
import './js/mlg-cache-manager.js'
import './js/mlg-offline-manager.js'
import './js/mlg-connection-status.js'
import './js/mlg-fallback-system.js'
import './js/mlg-loading-states.js'
import './js/mlg-error-logger.js'
import './js/mlg-error-system.js'

// Import UI components
import './ui/components/gaming-loading-states.js'
import './ui/components/xbox-page-transitions.js'
import './ui/components/wallet-loading-states.js'
import './ui/components/vote-burn-loading.js'
import './ui/components/gaming-upload-progress.js'
import './ui/components/mlg-loading-system.js'

// Import core production components for Task 16.1
import './ui/components/burn-vote-confirmation-ui.js'
import './ui/components/content-submission-form.js'
import './ui/components/clan-management-ui.js'
import './ui/components/clan-leaderboard-ui.js'

// Import core systems
import './voting/solana-voting-system.js'
import './wallet/phantom-wallet.js'
import './clans/clan-voting.js'
import './content/content-validator.js'

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

// Export for module systems
export { MLGApplication }
export default mlgApp