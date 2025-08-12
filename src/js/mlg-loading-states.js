/**
 * MLG.clan Loading States System
 * Xbox 360-inspired loading states for error recovery and operations
 * 
 * @author Claude Code - Frontend Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

class MLGLoadingStates {
  constructor() {
    this.activeLoaders = new Map();
    this.loadingQueue = [];
    this.isStylesInjected = false;
    
    // Xbox 360-inspired loading configurations
    this.loadingConfigs = {
      // Connection recovery
      connection_recovery: {
        title: 'Reconnecting to Xbox Live...',
        messages: [
          'Searching for network...',
          'Establishing connection...',
          'Authenticating player...',
          'Loading profile data...',
          'Ready to game!'
        ],
        icon: '🌐',
        color: '#00ff88',
        duration: 3000,
        showProgress: true,
        animation: 'xbox-ring'
      },
      
      // API retry
      api_retry: {
        title: 'Retrying connection...',
        messages: [
          'Attempting to reach game servers...',
          'Checking network stability...',
          'Resending request...',
          'Processing response...',
          'Connection restored!'
        ],
        icon: '🔄',
        color: '#0099ff',
        duration: 2500,
        showProgress: true,
        animation: 'pulse'
      },
      
      // Data sync
      data_sync: {
        title: 'Syncing game data...',
        messages: [
          'Preparing offline changes...',
          'Uploading progress...',
          'Validating data integrity...',
          'Updating cloud saves...',
          'Sync complete!'
        ],
        icon: '☁️',
        color: '#00cc70',
        duration: 4000,
        showProgress: true,
        animation: 'spin'
      },
      
      // Wallet connection
      wallet_connect: {
        title: 'Connecting controller...',
        messages: [
          'Detecting Phantom wallet...',
          'Establishing secure connection...',
          'Loading wallet data...',
          'Fetching balance...',
          'Controller ready!'
        ],
        icon: '🎮',
        color: '#ff6b00',
        duration: 3500,
        showProgress: true,
        animation: 'xbox-ring'
      },
      
      // Transaction processing
      transaction: {
        title: 'Processing transaction...',
        messages: [
          'Preparing transaction...',
          'Waiting for signature...',
          'Broadcasting to network...',
          'Confirming on blockchain...',
          'Transaction complete!'
        ],
        icon: '💰',
        color: '#ffd700',
        duration: 5000,
        showProgress: true,
        animation: 'pulse'
      },
      
      // Content loading
      content_load: {
        title: 'Loading game content...',
        messages: [
          'Fetching latest content...',
          'Processing media files...',
          'Loading thumbnails...',
          'Applying filters...',
          'Content ready!'
        ],
        icon: '🎬',
        color: '#9c27b0',
        duration: 2000,
        showProgress: true,
        animation: 'spin'
      },
      
      // Clan operations
      clan_operation: {
        title: 'Processing clan request...',
        messages: [
          'Validating permissions...',
          'Updating clan roster...',
          'Notifying members...',
          'Saving changes...',
          'Clan updated!'
        ],
        icon: '🏰',
        color: '#ff4444',
        duration: 3000,
        showProgress: true,
        animation: 'xbox-ring'
      },
      
      // Vote processing
      vote_processing: {
        title: 'Processing your vote...',
        messages: [
          'Validating vote eligibility...',
          'Burning tokens...',
          'Recording vote...',
          'Updating totals...',
          'Vote recorded!'
        ],
        icon: '🗳️',
        color: '#00bcd4',
        duration: 4500,
        showProgress: true,
        animation: 'pulse'
      },
      
      // System recovery
      system_recovery: {
        title: 'System recovery in progress...',
        messages: [
          'Detecting system issues...',
          'Initializing recovery mode...',
          'Restoring services...',
          'Running diagnostics...',
          'System operational!'
        ],
        icon: '🛠️',
        color: '#ff9800',
        duration: 6000,
        showProgress: true,
        animation: 'xbox-ring'
      },
      
      // Generic loading
      generic: {
        title: 'Loading...',
        messages: [
          'Please wait...',
          'Processing request...',
          'Almost ready...',
          'Finishing up...',
          'Complete!'
        ],
        icon: '⏳',
        color: '#607d8b',
        duration: 2000,
        showProgress: true,
        animation: 'spin'
      }
    };

    this.init();
  }

  init() {
    this.injectStyles();
    console.log('🎮 MLG Loading States initialized');
  }

  injectStyles() {
    if (this.isStylesInjected) return;
    
    const styles = document.createElement('style');
    styles.id = 'mlg-loading-states-styles';
    styles.textContent = `
      /* Xbox 360-inspired loading overlay */
      .mlg-loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        font-family: 'Segoe UI', system-ui, sans-serif;
        color: white;
      }
      
      .mlg-loading-container {
        text-align: center;
        max-width: 400px;
        padding: 40px;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid var(--loading-color, #00ff88);
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        position: relative;
        overflow: hidden;
      }
      
      .mlg-loading-container::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: linear-gradient(45deg, 
          var(--loading-color, #00ff88), 
          transparent, 
          var(--loading-color, #00ff88));
        border-radius: 20px;
        z-index: -1;
        opacity: 0.3;
        animation: borderGlow 2s ease-in-out infinite alternate;
      }
      
      .mlg-loading-icon {
        font-size: 48px;
        margin-bottom: 20px;
        display: inline-block;
        filter: drop-shadow(0 0 10px var(--loading-color, #00ff88));
      }
      
      .mlg-loading-title {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 15px;
        color: var(--loading-color, #00ff88);
        text-shadow: 0 0 10px var(--loading-color, #00ff88);
      }
      
      .mlg-loading-message {
        font-size: 14px;
        margin-bottom: 25px;
        min-height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.9;
        line-height: 1.4;
      }
      
      .mlg-loading-progress {
        margin-bottom: 20px;
      }
      
      .mlg-progress-bar {
        width: 100%;
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 10px;
        position: relative;
      }
      
      .mlg-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, 
          var(--loading-color, #00ff88), 
          rgba(255, 255, 255, 0.8),
          var(--loading-color, #00ff88));
        border-radius: 3px;
        transition: width 0.5s ease;
        box-shadow: 0 0 10px var(--loading-color, #00ff88);
        position: relative;
      }
      
      .mlg-progress-fill::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 20px;
        height: 100%;
        background: linear-gradient(90deg, 
          transparent, 
          rgba(255, 255, 255, 0.6));
        animation: shimmer 1.5s ease-in-out infinite;
      }
      
      .mlg-progress-text {
        font-size: 12px;
        opacity: 0.7;
        text-align: center;
      }
      
      .mlg-loading-animation {
        margin-bottom: 20px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      /* Xbox Ring Animation */
      .xbox-ring {
        width: 50px;
        height: 50px;
        border: 3px solid transparent;
        border-top: 3px solid var(--loading-color, #00ff88);
        border-right: 3px solid var(--loading-color, #00ff88);
        border-radius: 50%;
        animation: xboxSpin 1.2s linear infinite;
        position: relative;
      }
      
      .xbox-ring::before {
        content: '';
        position: absolute;
        top: -3px;
        left: -3px;
        right: -3px;
        bottom: -3px;
        border: 3px solid transparent;
        border-bottom: 3px solid var(--loading-color, #00ff88);
        border-left: 3px solid var(--loading-color, #00ff88);
        border-radius: 50%;
        animation: xboxSpin 1.2s linear infinite reverse;
      }
      
      /* Pulse Animation */
      .pulse {
        width: 50px;
        height: 50px;
        background: var(--loading-color, #00ff88);
        border-radius: 50%;
        animation: pulseGlow 1.5s ease-in-out infinite;
        box-shadow: 0 0 20px var(--loading-color, #00ff88);
      }
      
      /* Spin Animation */
      .spin {
        width: 50px;
        height: 50px;
        border: 4px solid rgba(255, 255, 255, 0.1);
        border-left: 4px solid var(--loading-color, #00ff88);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      /* Gaming dots animation */
      .gaming-dots {
        display: flex;
        gap: 8px;
      }
      
      .gaming-dot {
        width: 12px;
        height: 12px;
        background: var(--loading-color, #00ff88);
        border-radius: 50%;
        animation: gamingBounce 1.4s ease-in-out infinite both;
        box-shadow: 0 0 10px var(--loading-color, #00ff88);
      }
      
      .gaming-dot:nth-child(1) { animation-delay: -0.32s; }
      .gaming-dot:nth-child(2) { animation-delay: -0.16s; }
      .gaming-dot:nth-child(3) { animation-delay: 0; }
      
      /* Keyframe animations */
      @keyframes xboxSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes pulseGlow {
        0%, 100% { 
          transform: scale(1); 
          opacity: 1; 
        }
        50% { 
          transform: scale(1.2); 
          opacity: 0.7; 
        }
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes gamingBounce {
        0%, 80%, 100% {
          transform: scale(0);
        }
        40% {
          transform: scale(1);
        }
      }
      
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      
      @keyframes borderGlow {
        0% { opacity: 0.3; }
        100% { opacity: 0.6; }
      }
      
      /* Small loader for inline use */
      .mlg-small-loader {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: rgba(26, 26, 46, 0.9);
        border: 1px solid var(--loading-color, #00ff88);
        border-radius: 20px;
        color: white;
        font-size: 12px;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      
      .mlg-small-loader .loading-icon {
        animation: spin 1s linear infinite;
        font-size: 14px;
      }
      
      /* Mobile responsiveness */
      @media (max-width: 768px) {
        .mlg-loading-container {
          max-width: 320px;
          padding: 30px 20px;
        }
        
        .mlg-loading-icon {
          font-size: 40px;
          margin-bottom: 15px;
        }
        
        .mlg-loading-title {
          font-size: 18px;
        }
        
        .mlg-loading-message {
          font-size: 13px;
          min-height: 35px;
        }
      }
      
      /* Fade in animation for overlay */
      .mlg-loading-overlay {
        animation: fadeIn 0.3s ease-out;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      /* Success state */
      .mlg-loading-container.success {
        border-color: #00ff88;
        --loading-color: #00ff88;
      }
      
      .mlg-loading-container.error {
        border-color: #ff4444;
        --loading-color: #ff4444;
      }
      
      .mlg-loading-container.warning {
        border-color: #ffaa00;
        --loading-color: #ffaa00;
      }
    `;
    
    document.head.appendChild(styles);
    this.isStylesInjected = true;
  }

  showLoader(type = 'generic', options = {}) {
    const config = this.loadingConfigs[type] || this.loadingConfigs.generic;
    const loaderId = options.id || `loader_${Date.now()}`;
    
    // Remove existing loader with same ID
    this.hideLoader(loaderId);
    
    const loader = {
      id: loaderId,
      type,
      config: { ...config, ...options },
      currentStep: 0,
      startTime: Date.now(),
      element: null,
      progressInterval: null,
      messageInterval: null
    };
    
    this.createLoaderElement(loader);
    this.activeLoaders.set(loaderId, loader);
    
    console.log(`🎮 Started loading: ${loader.config.title}`);
    return loaderId;
  }

  createLoaderElement(loader) {
    const { config } = loader;
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'mlg-loading-overlay';
    overlay.style.setProperty('--loading-color', config.color);
    
    // Create container
    const container = document.createElement('div');
    container.className = 'mlg-loading-container';
    
    container.innerHTML = `
      <div class="mlg-loading-icon">${config.icon}</div>
      <div class="mlg-loading-title">${config.title}</div>
      <div class="mlg-loading-message">${config.messages[0]}</div>
      
      ${config.showProgress ? `
        <div class="mlg-loading-progress">
          <div class="mlg-progress-bar">
            <div class="mlg-progress-fill" style="width: 0%"></div>
          </div>
          <div class="mlg-progress-text">0%</div>
        </div>
      ` : ''}
      
      <div class="mlg-loading-animation">
        <div class="${config.animation}">
          ${config.animation === 'gaming-dots' ? 
            '<div class="gaming-dot"></div><div class="gaming-dot"></div><div class="gaming-dot"></div>' : 
            ''
          }
        </div>
      </div>
    `;
    
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    
    loader.element = overlay;
    loader.container = container;
    loader.progressFill = container.querySelector('.mlg-progress-fill');
    loader.progressText = container.querySelector('.mlg-progress-text');
    loader.messageEl = container.querySelector('.mlg-loading-message');
    
    // Start animations
    this.startProgressAnimation(loader);
    this.startMessageRotation(loader);
  }

  startProgressAnimation(loader) {
    if (!loader.config.showProgress) return;
    
    const { config } = loader;
    const totalSteps = config.messages.length;
    const stepDuration = config.duration / totalSteps;
    
    loader.progressInterval = setInterval(() => {
      const elapsed = Date.now() - loader.startTime;
      const progress = Math.min((elapsed / config.duration) * 100, 100);
      
      if (loader.progressFill) {
        loader.progressFill.style.width = `${progress}%`;
      }
      
      if (loader.progressText) {
        loader.progressText.textContent = `${Math.round(progress)}%`;
      }
      
      if (progress >= 100) {
        clearInterval(loader.progressInterval);
        
        // Auto-hide after completion if not persistent
        if (!loader.config.persistent) {
          setTimeout(() => {
            this.hideLoader(loader.id);
          }, 1000);
        }
      }
    }, 50);
  }

  startMessageRotation(loader) {
    const { config } = loader;
    const stepDuration = config.duration / config.messages.length;
    
    loader.messageInterval = setInterval(() => {
      if (loader.currentStep < config.messages.length - 1) {
        loader.currentStep++;
        if (loader.messageEl) {
          loader.messageEl.textContent = config.messages[loader.currentStep];
        }
      } else {
        clearInterval(loader.messageInterval);
      }
    }, stepDuration);
  }

  updateLoader(loaderId, updates) {
    const loader = this.activeLoaders.get(loaderId);
    if (!loader) return false;
    
    if (updates.message && loader.messageEl) {
      loader.messageEl.textContent = updates.message;
    }
    
    if (updates.progress && loader.progressFill) {
      loader.progressFill.style.width = `${updates.progress}%`;
      if (loader.progressText) {
        loader.progressText.textContent = `${Math.round(updates.progress)}%`;
      }
    }
    
    if (updates.status) {
      loader.container.className = `mlg-loading-container ${updates.status}`;
    }
    
    return true;
  }

  hideLoader(loaderId) {
    const loader = this.activeLoaders.get(loaderId);
    if (!loader) return false;
    
    // Clear intervals
    if (loader.progressInterval) {
      clearInterval(loader.progressInterval);
    }
    
    if (loader.messageInterval) {
      clearInterval(loader.messageInterval);
    }
    
    // Remove element with fade out
    if (loader.element) {
      loader.element.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => {
        if (loader.element && loader.element.parentNode) {
          loader.element.parentNode.removeChild(loader.element);
        }
      }, 300);
    }
    
    this.activeLoaders.delete(loaderId);
    console.log(`🏁 Finished loading: ${loader.config.title}`);
    return true;
  }

  hideAllLoaders() {
    const loaderIds = Array.from(this.activeLoaders.keys());
    loaderIds.forEach(id => this.hideLoader(id));
  }

  showSmallLoader(element, options = {}) {
    const config = {
      text: options.text || 'Loading...',
      icon: options.icon || '⏳',
      color: options.color || '#00ff88'
    };
    
    const smallLoader = document.createElement('div');
    smallLoader.className = 'mlg-small-loader';
    smallLoader.style.setProperty('--loading-color', config.color);
    smallLoader.innerHTML = `
      <span class="loading-icon">${config.icon}</span>
      <span>${config.text}</span>
    `;
    
    // Replace element content or add to it
    if (options.replace) {
      element.innerHTML = '';
      element.appendChild(smallLoader);
    } else {
      element.appendChild(smallLoader);
    }
    
    return smallLoader;
  }

  removeSmallLoader(element) {
    const loader = element.querySelector('.mlg-small-loader');
    if (loader) {
      loader.parentNode.removeChild(loader);
    }
  }

  // Convenience methods for common loading scenarios
  showConnectionRecovery() {
    return this.showLoader('connection_recovery', {
      id: 'connection_recovery'
    });
  }

  showApiRetry(attempt = 1, maxAttempts = 3) {
    return this.showLoader('api_retry', {
      id: 'api_retry',
      title: `Retry attempt ${attempt}/${maxAttempts}...`,
      messages: [
        'Preparing retry...',
        'Attempting connection...',
        'Processing response...',
        'Validating data...',
        attempt === maxAttempts ? 'Final attempt...' : 'Retry complete!'
      ]
    });
  }

  showDataSync() {
    return this.showLoader('data_sync', {
      id: 'data_sync'
    });
  }

  showWalletConnect() {
    return this.showLoader('wallet_connect', {
      id: 'wallet_connect'
    });
  }

  showTransaction(type = 'generic') {
    return this.showLoader('transaction', {
      id: `transaction_${Date.now()}`,
      title: `Processing ${type} transaction...`
    });
  }

  showContentLoad() {
    return this.showLoader('content_load', {
      id: 'content_load'
    });
  }

  showClanOperation(operation) {
    return this.showLoader('clan_operation', {
      id: 'clan_operation',
      title: `${operation}...`
    });
  }

  showVoteProcessing() {
    return this.showLoader('vote_processing', {
      id: 'vote_processing'
    });
  }

  showSystemRecovery() {
    return this.showLoader('system_recovery', {
      id: 'system_recovery'
    });
  }

  // Integration with error handler
  showErrorRecovery(errorCode, attempt = 1, maxAttempts = 3) {
    const errorMessages = {
      'E74': ['Network timeout detected', 'Switching to backup servers', 'Retrying connection', 'Recovery in progress', 'Connection restored!'],
      '0102': ['Wallet disconnected', 'Attempting reconnection', 'Validating wallet', 'Restoring session', 'Wallet reconnected!'],
      'D01': ['Data not found', 'Searching cache', 'Generating fallback', 'Loading backup data', 'Data recovered!'],
      'X01': ['System error detected', 'Running diagnostics', 'Applying fixes', 'Restarting services', 'System recovered!']
    };
    
    const messages = errorMessages[errorCode] || errorMessages['X01'];
    
    return this.showLoader('system_recovery', {
      id: `error_recovery_${errorCode}`,
      title: `Recovery ${attempt}/${maxAttempts}...`,
      messages,
      color: attempt === maxAttempts ? '#ff4444' : '#ffaa00'
    });
  }

  // Queue management for multiple loaders
  queueLoader(type, options = {}) {
    if (this.activeLoaders.size > 0 && !options.force) {
      this.loadingQueue.push({ type, options });
      return null;
    }
    
    return this.showLoader(type, options);
  }

  processQueue() {
    if (this.loadingQueue.length > 0 && this.activeLoaders.size === 0) {
      const { type, options } = this.loadingQueue.shift();
      return this.showLoader(type, options);
    }
    return null;
  }

  // Status methods
  isLoading(loaderId = null) {
    if (loaderId) {
      return this.activeLoaders.has(loaderId);
    }
    return this.activeLoaders.size > 0;
  }

  getActiveLoaders() {
    return Array.from(this.activeLoaders.keys());
  }

  getLoaderStatus(loaderId) {
    const loader = this.activeLoaders.get(loaderId);
    if (!loader) return null;
    
    const elapsed = Date.now() - loader.startTime;
    const progress = Math.min((elapsed / loader.config.duration) * 100, 100);
    
    return {
      id: loader.id,
      type: loader.type,
      progress: Math.round(progress),
      currentStep: loader.currentStep,
      totalSteps: loader.config.messages.length,
      elapsed,
      remaining: Math.max(0, loader.config.duration - elapsed)
    };
  }
}

// Add fadeOut animation CSS
const fadeOutCSS = `
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;

// Inject the additional CSS if not already present
if (!document.querySelector('#fade-out-animation')) {
  const style = document.createElement('style');
  style.id = 'fade-out-animation';
  style.textContent = fadeOutCSS;
  document.head.appendChild(style);
}

// Create global instance
window.MLGLoadingStates = new MLGLoadingStates();

// Export for ES6 modules
export default MLGLoadingStates;
export { MLGLoadingStates };