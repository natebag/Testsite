/**
 * Wallet Connection Loading States
 * Specialized loading components for Web3 wallet interactions with security-focused messaging
 */

class WalletLoadingStates {
  constructor(options = {}) {
    this.options = {
      primaryColor: '#00ff88',
      secondaryColor: '#8b5cf6',
      accentColor: '#3b82f6',
      warningColor: '#fbbf24',
      errorColor: '#ef4444',
      darkBg: '#0a0a0f',
      surfaceBg: '#1a1a2e',
      securityColor: '#10b981', // Green for security
      ...options
    };
    
    this.activeWalletLoaders = new Map();
    this.securityCheckSteps = [
      'Initializing secure connection...',
      'Verifying wallet authenticity...',
      'Establishing encrypted tunnel...',
      'Validating network security...',
      'Finalizing secure handshake...'
    ];
    
    this.init();
  }

  init() {
    this.injectWalletStyles();
    console.log('🔐 Wallet Loading States initialized');
  }

  /**
   * Show Phantom wallet connection loading
   * @param {HTMLElement} container - Target container
   * @param {Object} options - Loading options
   */
  showPhantomConnection(container, options = {}) {
    const loaderId = this.generateId();
    const showSecuritySteps = options.securitySteps !== false;
    const estimatedTime = options.estimatedTime || '5-10 seconds';
    
    const loaderHTML = `
      <div id="${loaderId}" class="wallet-connection-loader phantom-loader fade-in">
        <div class="connection-container">
          <!-- Phantom Wallet Icon Animation -->
          <div class="phantom-icon-container">
            <div class="phantom-ghost">
              <div class="ghost-body">
                <div class="ghost-face">
                  <div class="ghost-eye ghost-eye-left"></div>
                  <div class="ghost-eye ghost-eye-right"></div>
                  <div class="ghost-mouth"></div>
                </div>
                <div class="ghost-tail">
                  <div class="tail-segment"></div>
                  <div class="tail-segment"></div>
                  <div class="tail-segment"></div>
                </div>
              </div>
            </div>
            
            <!-- Connection rings -->
            <div class="connection-rings">
              <div class="connection-ring ring-1"></div>
              <div class="connection-ring ring-2"></div>
              <div class="connection-ring ring-3"></div>
            </div>
            
            <!-- Security shield -->
            <div class="security-shield">
              <div class="shield-icon">🛡️</div>
              <div class="shield-glow"></div>
            </div>
          </div>
          
          <!-- Connection Status -->
          <div class="connection-status">
            <h3 class="status-title">Connecting to Phantom Wallet</h3>
            <p class="status-subtitle">Establishing secure connection...</p>
            <div class="estimated-time">Estimated time: ${estimatedTime}</div>
          </div>
          
          <!-- Security Steps -->
          ${showSecuritySteps ? `
            <div class="security-steps">
              <h4 class="steps-title">Security Verification</h4>
              <div class="steps-list" id="${loaderId}-steps">
                ${this.securityCheckSteps.map((step, index) => `
                  <div class="security-step" id="${loaderId}-step-${index}">
                    <div class="step-icon">
                      <div class="step-spinner"></div>
                      <div class="step-check">✓</div>
                    </div>
                    <div class="step-text">${step}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <!-- Connection Progress -->
          <div class="connection-progress">
            <div class="progress-track">
              <div class="progress-fill" id="${loaderId}-progress"></div>
            </div>
            <div class="progress-text" id="${loaderId}-progress-text">Initializing...</div>
          </div>
          
          <!-- Security Notice -->
          <div class="security-notice">
            <div class="notice-icon">🔒</div>
            <div class="notice-text">
              <strong>Security First:</strong> Your private keys never leave your device. 
              We only request permission to view your public address and balance.
            </div>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = loaderHTML;
    this.activeWalletLoaders.set(loaderId, {
      container,
      type: 'phantom',
      startTime: Date.now(),
      currentStep: 0
    });
    
    // Start automatic progress animation
    this.animateWalletConnection(loaderId, options.duration || 4000);
    
    return loaderId;
  }

  /**
   * Show wallet transaction signing loading
   * @param {HTMLElement} container - Target container
   * @param {Object} options - Transaction options
   */
  showTransactionSigning(container, options = {}) {
    const loaderId = this.generateId();
    const transactionType = options.type || 'transaction';
    const amount = options.amount || '0';
    const recipient = options.recipient || '';
    const fee = options.fee || 'calculating...';
    
    const loaderHTML = `
      <div id="${loaderId}" class="wallet-transaction-loader fade-in">
        <div class="transaction-container">
          <!-- Transaction Animation -->
          <div class="transaction-visual">
            <div class="wallet-icon">
              <div class="wallet-body">
                <div class="wallet-card"></div>
              </div>
            </div>
            
            <div class="transaction-flow">
              <div class="flow-line"></div>
              <div class="flow-particles">
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
              </div>
            </div>
            
            <div class="destination-icon">
              <div class="dest-circle">
                <span>📱</span>
              </div>
            </div>
          </div>
          
          <!-- Transaction Details -->
          <div class="transaction-details">
            <h3 class="transaction-title">Sign ${transactionType}</h3>
            <div class="details-grid">
              ${amount !== '0' ? `
                <div class="detail-item">
                  <span class="detail-label">Amount:</span>
                  <span class="detail-value">${amount}</span>
                </div>
              ` : ''}
              
              ${recipient ? `
                <div class="detail-item">
                  <span class="detail-label">To:</span>
                  <span class="detail-value monospace">${recipient}</span>
                </div>
              ` : ''}
              
              <div class="detail-item">
                <span class="detail-label">Network Fee:</span>
                <span class="detail-value">${fee}</span>
              </div>
            </div>
          </div>
          
          <!-- Signing Status -->
          <div class="signing-status">
            <div class="status-indicator">
              <div class="status-spinner"></div>
            </div>
            <div class="status-text" id="${loaderId}-status">
              Waiting for your approval in Phantom...
            </div>
          </div>
          
          <!-- Security Warning -->
          <div class="transaction-warning">
            <div class="warning-icon">⚠️</div>
            <div class="warning-text">
              <strong>Review carefully:</strong> Only approve transactions you understand. 
              Check all details before confirming in your wallet.
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="transaction-actions">
            <button class="action-btn cancel-btn" onclick="window.walletLoader.cancelTransaction('${loaderId}')">
              <span class="btn-icon">✕</span>
              <span class="btn-text">Cancel</span>
            </button>
            <button class="action-btn help-btn" onclick="window.walletLoader.showTransactionHelp()">
              <span class="btn-icon">?</span>
              <span class="btn-text">Help</span>
            </button>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = loaderHTML;
    this.activeWalletLoaders.set(loaderId, {
      container,
      type: 'transaction',
      startTime: Date.now(),
      transactionType
    });
    
    return loaderId;
  }

  /**
   * Show wallet balance loading
   * @param {HTMLElement} container - Target container
   * @param {Object} options - Balance options
   */
  showBalanceLoading(container, options = {}) {
    const loaderId = this.generateId();
    const tokens = options.tokens || ['SOL', 'MLG'];
    const showPortfolio = options.portfolio !== false;
    
    const loaderHTML = `
      <div id="${loaderId}" class="wallet-balance-loader fade-in">
        <div class="balance-container">
          <!-- Balance Header -->
          <div class="balance-header">
            <div class="wallet-avatar">
              <div class="avatar-ring"></div>
              <div class="avatar-center">💰</div>
            </div>
            <div class="balance-info">
              <h3 class="balance-title">Loading Wallet Balance</h3>
              <p class="balance-subtitle">Fetching your assets...</p>
            </div>
          </div>
          
          <!-- Token Balance Skeletons -->
          <div class="balance-tokens">
            ${tokens.map((token, index) => `
              <div class="token-balance-skeleton" style="animation-delay: ${index * 200}ms">
                <div class="token-icon-skeleton pulse-glow"></div>
                <div class="token-info-skeleton">
                  <div class="token-name-skeleton pulse-glow"></div>
                  <div class="token-amount-skeleton pulse-glow"></div>
                </div>
                <div class="token-value-skeleton pulse-glow"></div>
              </div>
            `).join('')}
          </div>
          
          <!-- Portfolio Overview -->
          ${showPortfolio ? `
            <div class="portfolio-skeleton">
              <div class="portfolio-title-skeleton pulse-glow"></div>
              <div class="portfolio-chart-skeleton">
                <div class="chart-bars">
                  <div class="chart-bar pulse-glow" style="height: 60%; animation-delay: 0ms"></div>
                  <div class="chart-bar pulse-glow" style="height: 80%; animation-delay: 100ms"></div>
                  <div class="chart-bar pulse-glow" style="height: 40%; animation-delay: 200ms"></div>
                  <div class="chart-bar pulse-glow" style="height: 90%; animation-delay: 300ms"></div>
                  <div class="chart-bar pulse-glow" style="height: 70%; animation-delay: 400ms"></div>
                </div>
              </div>
              <div class="portfolio-stats">
                <div class="stat-item-skeleton pulse-glow"></div>
                <div class="stat-item-skeleton pulse-glow"></div>
                <div class="stat-item-skeleton pulse-glow"></div>
              </div>
            </div>
          ` : ''}
          
          <!-- Loading Indicator -->
          <div class="balance-loading-indicator">
            <div class="loading-dots">
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
            </div>
            <div class="loading-text">Syncing with blockchain...</div>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = loaderHTML;
    this.activeWalletLoaders.set(loaderId, {
      container,
      type: 'balance',
      startTime: Date.now(),
      tokens
    });
    
    return loaderId;
  }

  /**
   * Show network connection loading
   * @param {HTMLElement} container - Target container
   * @param {Object} options - Network options
   */
  showNetworkConnection(container, options = {}) {
    const loaderId = this.generateId();
    const network = options.network || 'Solana Mainnet';
    const rpcEndpoint = options.rpcEndpoint || 'api.mainnet-beta.solana.com';
    
    const loaderHTML = `
      <div id="${loaderId}" class="wallet-network-loader fade-in">
        <div class="network-container">
          <!-- Network Visualization -->
          <div class="network-visual">
            <div class="network-nodes">
              <div class="node node-center">
                <div class="node-icon">🌐</div>
                <div class="node-pulse"></div>
              </div>
              <div class="node node-1">
                <div class="connection-line line-1"></div>
              </div>
              <div class="node node-2">
                <div class="connection-line line-2"></div>
              </div>
              <div class="node node-3">
                <div class="connection-line line-3"></div>
              </div>
              <div class="node node-4">
                <div class="connection-line line-4"></div>
              </div>
            </div>
          </div>
          
          <!-- Network Info -->
          <div class="network-info">
            <h3 class="network-title">Connecting to ${network}</h3>
            <div class="network-details">
              <div class="detail-row">
                <span class="detail-label">RPC Endpoint:</span>
                <span class="detail-value monospace">${rpcEndpoint}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value" id="${loaderId}-status">Establishing connection...</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Latency:</span>
                <span class="detail-value" id="${loaderId}-latency">Measuring...</span>
              </div>
            </div>
          </div>
          
          <!-- Connection Progress -->
          <div class="connection-steps">
            <div class="step" id="${loaderId}-step-1">
              <div class="step-indicator"></div>
              <div class="step-text">Resolving network endpoint</div>
            </div>
            <div class="step" id="${loaderId}-step-2">
              <div class="step-indicator"></div>
              <div class="step-text">Testing connection speed</div>
            </div>
            <div class="step" id="${loaderId}-step-3">
              <div class="step-indicator"></div>
              <div class="step-text">Verifying network health</div>
            </div>
            <div class="step" id="${loaderId}-step-4">
              <div class="step-indicator"></div>
              <div class="step-text">Finalizing connection</div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = loaderHTML;
    this.activeWalletLoaders.set(loaderId, {
      container,
      type: 'network',
      startTime: Date.now(),
      currentStep: 0
    });
    
    // Simulate network connection steps
    this.animateNetworkConnection(loaderId, options.duration || 3000);
    
    return loaderId;
  }

  /**
   * Animate wallet connection progress
   */
  animateWalletConnection(loaderId, duration) {
    const instance = this.activeWalletLoaders.get(loaderId);
    if (!instance) return;
    
    const startTime = Date.now();
    const progressFill = document.getElementById(`${loaderId}-progress`);
    const progressText = document.getElementById(`${loaderId}-progress-text`);
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      
      if (progressFill) {
        progressFill.style.width = `${progress}%`;
      }
      
      // Update security steps
      const stepIndex = Math.floor((progress / 100) * this.securityCheckSteps.length);
      if (stepIndex !== instance.currentStep && stepIndex < this.securityCheckSteps.length) {
        this.completeSecurityStep(loaderId, instance.currentStep);
        instance.currentStep = stepIndex;
        if (progressText) {
          progressText.textContent = this.securityCheckSteps[stepIndex];
        }
      }
      
      if (progress < 100) {
        requestAnimationFrame(animate);
      } else {
        if (progressText) {
          progressText.textContent = 'Connection established!';
        }
        // Complete all remaining steps
        for (let i = instance.currentStep; i < this.securityCheckSteps.length; i++) {
          this.completeSecurityStep(loaderId, i);
        }
      }
    };
    
    animate();
  }

  /**
   * Animate network connection steps
   */
  animateNetworkConnection(loaderId, duration) {
    const instance = this.activeWalletLoaders.get(loaderId);
    if (!instance) return;
    
    const stepDuration = duration / 4;
    const latencyElement = document.getElementById(`${loaderId}-latency`);
    const statusElement = document.getElementById(`${loaderId}-status`);
    
    const steps = [
      { text: 'Connecting...', latency: 'Measuring...' },
      { text: 'Testing speed...', latency: '~150ms' },
      { text: 'Verifying health...', latency: '~120ms' },
      { text: 'Connected!', latency: '98ms' }
    ];
    
    steps.forEach((step, index) => {
      setTimeout(() => {
        const stepElement = document.getElementById(`${loaderId}-step-${index + 1}`);
        if (stepElement) {
          stepElement.classList.add('step-active');
          setTimeout(() => {
            stepElement.classList.add('step-completed');
            stepElement.classList.remove('step-active');
          }, stepDuration - 200);
        }
        
        if (statusElement) {
          statusElement.textContent = step.text;
        }
        
        if (latencyElement) {
          latencyElement.textContent = step.latency;
        }
      }, index * stepDuration);
    });
  }

  /**
   * Complete a security step
   */
  completeSecurityStep(loaderId, stepIndex) {
    const stepElement = document.getElementById(`${loaderId}-step-${stepIndex}`);
    if (stepElement) {
      stepElement.classList.add('step-completed');
    }
  }

  /**
   * Cancel transaction
   */
  cancelTransaction(loaderId) {
    const instance = this.activeWalletLoaders.get(loaderId);
    if (instance && instance.type === 'transaction') {
      // Show cancellation animation
      const container = instance.container;
      container.innerHTML = `
        <div class="transaction-cancelled fade-in">
          <div class="cancelled-icon">❌</div>
          <h3 class="cancelled-title">Transaction Cancelled</h3>
          <p class="cancelled-message">The transaction was cancelled by user request.</p>
          <button class="action-btn primary-btn" onclick="history.back()">
            <span class="btn-text">Go Back</span>
          </button>
        </div>
      `;
      
      // Clean up
      this.activeWalletLoaders.delete(loaderId);
    }
  }

  /**
   * Show transaction help
   */
  showTransactionHelp() {
    // This would typically open a modal with help information
    console.log('Transaction help requested');
  }

  /**
   * Hide wallet loader
   */
  hideLoader(loaderId, options = {}) {
    const instance = this.activeWalletLoaders.get(loaderId);
    if (!instance) return;
    
    const element = document.getElementById(loaderId);
    if (element) {
      element.classList.add('fade-out');
      setTimeout(() => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
        this.activeWalletLoaders.delete(loaderId);
        if (options.onComplete) options.onComplete();
      }, 300);
    } else {
      this.activeWalletLoaders.delete(loaderId);
      if (options.onComplete) options.onComplete();
    }
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return 'wallet-loader-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Inject wallet-specific CSS styles
   */
  injectWalletStyles() {
    const styles = `
      <style id="wallet-loading-styles">
        /* Base wallet loader styles */
        .wallet-connection-loader,
        .wallet-transaction-loader,
        .wallet-balance-loader,
        .wallet-network-loader {
          padding: 2rem;
          background: ${this.options.surfaceBg}95;
          border-radius: 12px;
          border: 1px solid ${this.options.primaryColor}30;
          backdrop-filter: blur(15px);
          min-height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        /* Phantom Wallet Connection Loader */
        .phantom-loader .connection-container {
          text-align: center;
          max-width: 500px;
          width: 100%;
        }
        
        .phantom-icon-container {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto 2rem;
        }
        
        .phantom-ghost {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto;
        }
        
        .ghost-body {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #ab9ff2, #7c5aff);
          border-radius: 50% 50% 0 0;
          position: relative;
          animation: ghostFloat 3s ease-in-out infinite;
        }
        
        .ghost-face {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
        }
        
        .ghost-eye {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          position: absolute;
          animation: ghostBlink 4s infinite;
        }
        
        .ghost-eye-left { left: -6px; }
        .ghost-eye-right { right: -6px; }
        
        .ghost-mouth {
          width: 4px;
          height: 4px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 12px;
          left: -2px;
        }
        
        .ghost-tail {
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 2px;
        }
        
        .tail-segment {
          width: 8px;
          height: 15px;
          background: linear-gradient(135deg, #ab9ff2, #7c5aff);
          border-radius: 0 0 50% 50%;
          animation: tailWave 2s ease-in-out infinite;
        }
        
        .tail-segment:nth-child(1) { animation-delay: 0s; }
        .tail-segment:nth-child(2) { animation-delay: 0.3s; }
        .tail-segment:nth-child(3) { animation-delay: 0.6s; }
        
        @keyframes ghostFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes ghostBlink {
          0%, 95%, 100% { opacity: 1; }
          97% { opacity: 0; }
        }
        
        @keyframes tailWave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.7); }
        }
        
        /* Connection rings */
        .connection-rings {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        
        .connection-ring {
          position: absolute;
          border: 2px solid;
          border-radius: 50%;
          opacity: 0.6;
          animation: connectionPulse 3s ease-out infinite;
        }
        
        .ring-1 {
          width: 100%;
          height: 100%;
          border-color: ${this.options.primaryColor};
          animation-delay: 0s;
        }
        
        .ring-2 {
          width: 80%;
          height: 80%;
          top: 10%;
          left: 10%;
          border-color: ${this.options.accentColor};
          animation-delay: 1s;
        }
        
        .ring-3 {
          width: 60%;
          height: 60%;
          top: 20%;
          left: 20%;
          border-color: ${this.options.secondaryColor};
          animation-delay: 2s;
        }
        
        @keyframes connectionPulse {
          0% {
            opacity: 0.6;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
          100% {
            opacity: 0.6;
            transform: scale(0.8);
          }
        }
        
        /* Security shield */
        .security-shield {
          position: absolute;
          top: -10px;
          right: -10px;
          width: 40px;
          height: 40px;
        }
        
        .shield-icon {
          font-size: 2rem;
          animation: shieldPulse 2s ease-in-out infinite;
        }
        
        .shield-glow {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, ${this.options.securityColor}40, transparent);
          border-radius: 50%;
          animation: shieldGlow 2s ease-in-out infinite;
        }
        
        @keyframes shieldPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        @keyframes shieldGlow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        
        /* Connection status */
        .connection-status {
          margin-bottom: 2rem;
        }
        
        .status-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: ${this.options.primaryColor};
          margin-bottom: 0.5rem;
          text-shadow: 0 0 10px ${this.options.primaryColor}30;
        }
        
        .status-subtitle {
          font-size: 1rem;
          color: #9ca3af;
          margin-bottom: 1rem;
        }
        
        .estimated-time {
          font-size: 0.875rem;
          color: ${this.options.accentColor};
          font-weight: 500;
        }
        
        /* Security steps */
        .security-steps {
          margin-bottom: 2rem;
          text-align: left;
          background: ${this.options.darkBg}40;
          border-radius: 8px;
          padding: 1.5rem;
          border: 1px solid ${this.options.securityColor}20;
        }
        
        .steps-title {
          font-size: 1rem;
          font-weight: bold;
          color: ${this.options.securityColor};
          margin-bottom: 1rem;
          text-align: center;
        }
        
        .steps-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .security-step {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          border-radius: 6px;
          transition: background 0.3s ease;
        }
        
        .security-step.step-completed {
          background: ${this.options.securityColor}10;
        }
        
        .step-icon {
          position: relative;
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }
        
        .step-spinner {
          width: 100%;
          height: 100%;
          border: 2px solid ${this.options.securityColor}30;
          border-top-color: ${this.options.securityColor};
          border-radius: 50%;
          animation: stepSpin 1s linear infinite;
        }
        
        .step-check {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${this.options.securityColor};
          font-weight: bold;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .step-completed .step-spinner {
          display: none;
        }
        
        .step-completed .step-check {
          opacity: 1;
        }
        
        @keyframes stepSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .step-text {
          font-size: 0.875rem;
          color: #d1d5db;
          flex: 1;
        }
        
        .step-completed .step-text {
          color: ${this.options.securityColor};
        }
        
        /* Connection progress */
        .connection-progress {
          margin-bottom: 2rem;
        }
        
        .progress-track {
          width: 100%;
          height: 8px;
          background: ${this.options.darkBg};
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, ${this.options.securityColor}, ${this.options.primaryColor});
          border-radius: 4px;
          width: 0%;
          transition: width 0.5s ease;
          position: relative;
        }
        
        .progress-fill::after {
          content: '';
          position: absolute;
          top: -2px;
          right: -4px;
          width: 8px;
          height: 12px;
          background: ${this.options.primaryColor};
          border-radius: 2px;
          box-shadow: 0 0 10px ${this.options.primaryColor}60;
        }
        
        .progress-text {
          text-align: center;
          font-size: 0.875rem;
          color: ${this.options.accentColor};
          font-weight: 500;
        }
        
        /* Security notice */
        .security-notice {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
          background: ${this.options.securityColor}10;
          border: 1px solid ${this.options.securityColor}30;
          border-radius: 8px;
          font-size: 0.875rem;
        }
        
        .notice-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }
        
        .notice-text {
          color: #d1d5db;
          line-height: 1.5;
        }
        
        .notice-text strong {
          color: ${this.options.securityColor};
        }
        
        /* Transaction Loader */
        .wallet-transaction-loader .transaction-container {
          text-align: center;
          max-width: 600px;
          width: 100%;
        }
        
        .transaction-visual {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3rem;
          margin-bottom: 2rem;
        }
        
        .wallet-icon {
          width: 60px;
          height: 60px;
          position: relative;
        }
        
        .wallet-body {
          width: 100%;
          height: 80%;
          background: linear-gradient(135deg, ${this.options.accentColor}, ${this.options.primaryColor});
          border-radius: 8px;
          position: relative;
          animation: walletPulse 3s ease-in-out infinite;
        }
        
        .wallet-card {
          position: absolute;
          top: 20%;
          left: 10%;
          width: 80%;
          height: 30%;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }
        
        @keyframes walletPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 ${this.options.accentColor}40; }
          50% { transform: scale(1.05); box-shadow: 0 0 0 10px ${this.options.accentColor}20; }
        }
        
        .transaction-flow {
          position: relative;
          width: 120px;
          height: 4px;
          background: ${this.options.darkBg};
          border-radius: 2px;
        }
        
        .flow-line {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, ${this.options.primaryColor}, ${this.options.accentColor});
          border-radius: 2px;
          animation: flowProgress 2s ease-in-out infinite;
        }
        
        .flow-particles {
          position: absolute;
          top: -2px;
          left: 0;
          width: 100%;
          height: 8px;
        }
        
        .flow-particles .particle {
          position: absolute;
          width: 6px;
          height: 6px;
          background: ${this.options.primaryColor};
          border-radius: 50%;
          animation: particleFlow 3s linear infinite;
        }
        
        .flow-particles .particle:nth-child(1) { animation-delay: 0s; }
        .flow-particles .particle:nth-child(2) { animation-delay: 1s; }
        .flow-particles .particle:nth-child(3) { animation-delay: 2s; }
        
        @keyframes flowProgress {
          0%, 100% { width: 0%; }
          50% { width: 100%; }
        }
        
        @keyframes particleFlow {
          0% { left: -6px; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: 120px; opacity: 0; }
        }
        
        .destination-icon {
          width: 60px;
          height: 60px;
        }
        
        .dest-circle {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, ${this.options.secondaryColor}, ${this.options.primaryColor});
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          animation: destPulse 3s ease-in-out infinite;
        }
        
        @keyframes destPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        /* Transaction details */
        .transaction-details {
          background: ${this.options.darkBg}60;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          border: 1px solid ${this.options.primaryColor}20;
        }
        
        .transaction-title {
          font-size: 1.25rem;
          font-weight: bold;
          color: ${this.options.primaryColor};
          margin-bottom: 1rem;
        }
        
        .details-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .detail-label {
          font-size: 0.875rem;
          color: #9ca3af;
        }
        
        .detail-value {
          font-size: 0.875rem;
          color: white;
          font-weight: 500;
        }
        
        .detail-value.monospace {
          font-family: 'Courier New', monospace;
          font-size: 0.75rem;
        }
        
        /* Signing status */
        .signing-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2rem;
          padding: 1rem;
          background: ${this.options.accentColor}10;
          border-radius: 8px;
          border: 1px solid ${this.options.accentColor}30;
        }
        
        .status-indicator {
          width: 40px;
          height: 40px;
          position: relative;
        }
        
        .status-spinner {
          width: 100%;
          height: 100%;
          border: 3px solid ${this.options.accentColor}30;
          border-top-color: ${this.options.accentColor};
          border-radius: 50%;
          animation: statusSpin 1s linear infinite;
        }
        
        @keyframes statusSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .status-text {
          font-size: 1rem;
          color: ${this.options.accentColor};
          font-weight: 500;
        }
        
        /* Transaction warning */
        .transaction-warning {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
          background: ${this.options.warningColor}10;
          border: 1px solid ${this.options.warningColor}30;
          border-radius: 8px;
          margin-bottom: 2rem;
          font-size: 0.875rem;
        }
        
        .warning-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }
        
        .warning-text {
          color: #d1d5db;
          line-height: 1.5;
        }
        
        .warning-text strong {
          color: ${this.options.warningColor};
        }
        
        /* Transaction actions */
        .transaction-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }
        
        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.3s ease;
          cursor: pointer;
          border: none;
          text-decoration: none;
        }
        
        .cancel-btn {
          background: ${this.options.errorColor};
          color: white;
        }
        
        .cancel-btn:hover {
          background: ${this.options.errorColor}dd;
          transform: translateY(-1px);
        }
        
        .help-btn {
          background: ${this.options.surfaceBg};
          color: #d1d5db;
          border: 1px solid #4b5563;
        }
        
        .help-btn:hover {
          background: #374151;
          border-color: #6b7280;
        }
        
        .primary-btn {
          background: ${this.options.primaryColor};
          color: ${this.options.darkBg};
        }
        
        .primary-btn:hover {
          background: ${this.options.primaryColor}dd;
          transform: translateY(-1px);
        }
        
        .btn-icon {
          font-size: 1rem;
        }
        
        .btn-text {
          font-size: 0.875rem;
        }
        
        /* Balance Loader */
        .wallet-balance-loader .balance-container {
          width: 100%;
          max-width: 600px;
        }
        
        .balance-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
          text-align: left;
        }
        
        .wallet-avatar {
          position: relative;
          width: 60px;
          height: 60px;
          flex-shrink: 0;
        }
        
        .avatar-ring {
          width: 100%;
          height: 100%;
          border: 3px solid ${this.options.primaryColor};
          border-radius: 50%;
          animation: avatarSpin 3s linear infinite;
        }
        
        .avatar-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 1.5rem;
        }
        
        @keyframes avatarSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .balance-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: ${this.options.primaryColor};
          margin-bottom: 0.5rem;
        }
        
        .balance-subtitle {
          font-size: 1rem;
          color: #9ca3af;
        }
        
        /* Token balance skeletons */
        .balance-tokens {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .token-balance-skeleton {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: ${this.options.darkBg}40;
          border-radius: 8px;
          border: 1px solid ${this.options.primaryColor}20;
        }
        
        .token-icon-skeleton {
          width: 40px;
          height: 40px;
          background: linear-gradient(
            90deg,
            ${this.options.surfaceBg} 25%,
            ${this.options.primaryColor}20 50%,
            ${this.options.surfaceBg} 75%
          );
          background-size: 200% 100%;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .token-info-skeleton {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .token-name-skeleton {
          width: 60px;
          height: 16px;
          background: linear-gradient(
            90deg,
            ${this.options.surfaceBg} 25%,
            ${this.options.primaryColor}20 50%,
            ${this.options.surfaceBg} 75%
          );
          background-size: 200% 100%;
          border-radius: 4px;
        }
        
        .token-amount-skeleton {
          width: 80px;
          height: 12px;
          background: linear-gradient(
            90deg,
            ${this.options.surfaceBg} 25%,
            ${this.options.primaryColor}20 50%,
            ${this.options.surfaceBg} 75%
          );
          background-size: 200% 100%;
          border-radius: 4px;
        }
        
        .token-value-skeleton {
          width: 60px;
          height: 16px;
          background: linear-gradient(
            90deg,
            ${this.options.surfaceBg} 25%,
            ${this.options.primaryColor}20 50%,
            ${this.options.surfaceBg} 75%
          );
          background-size: 200% 100%;
          border-radius: 4px;
          flex-shrink: 0;
        }
        
        /* Pulse glow animation */
        .pulse-glow {
          animation: pulseGlow 2s ease-in-out infinite;
        }
        
        @keyframes pulseGlow {
          0%, 100% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        /* Portfolio skeleton */
        .portfolio-skeleton {
          background: ${this.options.darkBg}40;
          border-radius: 8px;
          padding: 1.5rem;
          border: 1px solid ${this.options.primaryColor}20;
          margin-bottom: 2rem;
        }
        
        .portfolio-title-skeleton {
          width: 150px;
          height: 20px;
          background: linear-gradient(
            90deg,
            ${this.options.surfaceBg} 25%,
            ${this.options.primaryColor}20 50%,
            ${this.options.surfaceBg} 75%
          );
          background-size: 200% 100%;
          border-radius: 4px;
          margin-bottom: 1.5rem;
        }
        
        .portfolio-chart-skeleton {
          margin-bottom: 1.5rem;
        }
        
        .chart-bars {
          display: flex;
          align-items: end;
          gap: 8px;
          height: 100px;
          justify-content: center;
        }
        
        .chart-bar {
          width: 20px;
          background: linear-gradient(
            90deg,
            ${this.options.surfaceBg} 25%,
            ${this.options.primaryColor}20 50%,
            ${this.options.surfaceBg} 75%
          );
          background-size: 200% 100%;
          border-radius: 2px;
        }
        
        .portfolio-stats {
          display: flex;
          gap: 1rem;
          justify-content: space-between;
        }
        
        .stat-item-skeleton {
          flex: 1;
          height: 40px;
          background: linear-gradient(
            90deg,
            ${this.options.surfaceBg} 25%,
            ${this.options.primaryColor}20 50%,
            ${this.options.surfaceBg} 75%
          );
          background-size: 200% 100%;
          border-radius: 6px;
        }
        
        /* Balance loading indicator */
        .balance-loading-indicator {
          text-align: center;
        }
        
        .loading-dots {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          margin-bottom: 1rem;
        }
        
        .loading-dots .dot {
          width: 8px;
          height: 8px;
          background: ${this.options.primaryColor};
          border-radius: 50%;
          animation: dotPulse 1.4s ease-in-out infinite both;
        }
        
        .loading-dots .dot:nth-child(1) { animation-delay: 0s; }
        .loading-dots .dot:nth-child(2) { animation-delay: 0.2s; }
        .loading-dots .dot:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes dotPulse {
          0%, 80%, 100% { transform: scale(1); opacity: 0.5; }
          40% { transform: scale(1.5); opacity: 1; }
        }
        
        .loading-text {
          font-size: 0.875rem;
          color: ${this.options.accentColor};
          font-weight: 500;
        }
        
        /* Network Connection Loader */
        .wallet-network-loader .network-container {
          text-align: center;
          width: 100%;
          max-width: 500px;
        }
        
        .network-visual {
          margin-bottom: 2rem;
        }
        
        .network-nodes {
          position: relative;
          width: 200px;
          height: 200px;
          margin: 0 auto;
        }
        
        .node {
          position: absolute;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: ${this.options.accentColor};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
        }
        
        .node-center {
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 60px;
          background: ${this.options.primaryColor};
          font-size: 1.5rem;
          z-index: 2;
        }
        
        .node-pulse {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 2px solid ${this.options.primaryColor};
          border-radius: 50%;
          opacity: 0;
          animation: nodePulse 2s ease-out infinite;
        }
        
        @keyframes nodePulse {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(2); }
        }
        
        .node-1 {
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
        }
        
        .node-2 {
          top: 50%;
          right: 10px;
          transform: translateY(-50%);
        }
        
        .node-3 {
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
        }
        
        .node-4 {
          top: 50%;
          left: 10px;
          transform: translateY(-50%);
        }
        
        .connection-line {
          position: absolute;
          width: 2px;
          background: ${this.options.primaryColor};
          opacity: 0.6;
          animation: lineGlow 3s ease-in-out infinite;
        }
        
        .line-1 {
          top: 50px;
          left: 19px;
          height: 50px;
          transform: rotate(0deg);
          transform-origin: bottom;
        }
        
        .line-2 {
          top: 19px;
          right: 50px;
          width: 50px;
          height: 2px;
          transform: rotate(0deg);
          transform-origin: left;
        }
        
        .line-3 {
          bottom: 50px;
          left: 19px;
          height: 50px;
          transform: rotate(0deg);
          transform-origin: top;
        }
        
        .line-4 {
          top: 19px;
          left: 50px;
          width: 50px;
          height: 2px;
          transform: rotate(0deg);
          transform-origin: right;
        }
        
        @keyframes lineGlow {
          0%, 100% { 
            opacity: 0.3; 
            box-shadow: 0 0 5px ${this.options.primaryColor}40;
          }
          50% { 
            opacity: 1; 
            box-shadow: 0 0 15px ${this.options.primaryColor}60;
          }
        }
        
        /* Network info */
        .network-info {
          margin-bottom: 2rem;
        }
        
        .network-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: ${this.options.primaryColor};
          margin-bottom: 1rem;
        }
        
        .network-details {
          background: ${this.options.darkBg}60;
          border-radius: 8px;
          padding: 1rem;
          border: 1px solid ${this.options.primaryColor}20;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid ${this.options.surfaceBg}30;
        }
        
        .detail-row:last-child {
          border-bottom: none;
        }
        
        /* Connection steps */
        .connection-steps {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          text-align: left;
        }
        
        .step {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: ${this.options.darkBg}40;
          border-radius: 8px;
          border-left: 3px solid transparent;
          transition: all 0.3s ease;
        }
        
        .step.step-active {
          border-left-color: ${this.options.accentColor};
          background: ${this.options.accentColor}10;
        }
        
        .step.step-completed {
          border-left-color: ${this.options.primaryColor};
          background: ${this.options.primaryColor}10;
        }
        
        .step-indicator {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #4b5563;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }
        
        .step-active .step-indicator {
          background: ${this.options.accentColor};
          animation: stepPulse 2s ease-in-out infinite;
        }
        
        .step-completed .step-indicator {
          background: ${this.options.primaryColor};
          animation: none;
        }
        
        .step-completed .step-indicator::after {
          content: '✓';
          color: white;
          font-size: 10px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }
        
        @keyframes stepPulse {
          0%, 100% { 
            box-shadow: 0 0 0 0 ${this.options.accentColor}40;
          }
          50% { 
            box-shadow: 0 0 0 8px ${this.options.accentColor}20;
          }
        }
        
        .step-text {
          font-size: 0.875rem;
          color: #d1d5db;
        }
        
        .step-active .step-text {
          color: ${this.options.accentColor};
          font-weight: 500;
        }
        
        .step-completed .step-text {
          color: ${this.options.primaryColor};
        }
        
        /* Transaction cancelled */
        .transaction-cancelled {
          text-align: center;
          padding: 3rem 2rem;
          background: ${this.options.surfaceBg}95;
          border-radius: 12px;
          border: 1px solid ${this.options.errorColor}30;
        }
        
        .cancelled-icon {
          font-size: 4rem;
          margin-bottom: 1.5rem;
        }
        
        .cancelled-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: ${this.options.errorColor};
          margin-bottom: 1rem;
        }
        
        .cancelled-message {
          font-size: 1rem;
          color: #9ca3af;
          margin-bottom: 2rem;
          line-height: 1.5;
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
          .phantom-icon-container {
            width: 100px;
            height: 100px;
          }
          
          .phantom-ghost {
            width: 60px;
            height: 60px;
          }
          
          .transaction-visual {
            flex-direction: column;
            gap: 2rem;
          }
          
          .transaction-flow {
            width: 4px;
            height: 60px;
          }
          
          .flow-line {
            width: 100%;
            height: 0%;
          }
          
          .network-nodes {
            width: 150px;
            height: 150px;
          }
          
          .security-steps,
          .transaction-details,
          .portfolio-skeleton {
            margin: 1rem 0;
          }
          
          .transaction-actions {
            flex-direction: column;
          }
          
          .details-grid {
            font-size: 0.8rem;
          }
        }
        
        /* Accessibility improvements */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        
        /* High contrast support */
        @media (prefers-contrast: high) {
          .wallet-connection-loader,
          .wallet-transaction-loader,
          .wallet-balance-loader,
          .wallet-network-loader {
            border: 2px solid ${this.options.primaryColor};
          }
          
          .security-notice,
          .transaction-warning {
            border: 2px solid currentColor;
          }
        }
      </style>
    `;
    
    // Remove existing styles if present
    const existingStyles = document.getElementById('wallet-loading-styles');
    if (existingStyles) {
      existingStyles.remove();
    }
    
    document.head.insertAdjacentHTML('beforeend', styles);
  }
}

// Initialize global wallet loader
if (typeof window !== 'undefined') {
  window.walletLoader = new WalletLoadingStates();
  console.log('🔐 Wallet Loading States ready!');
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WalletLoadingStates;
}