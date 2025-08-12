/**
 * Wallet UI Components for MLG.clan Platform - Sub-task 1.6
 * 
 * Enhanced production-ready UI components for Phantom wallet status indicators
 * and comprehensive connection management with Xbox 360 dashboard aesthetic.
 * 
 * Sub-task 1.6 Implementation Features:
 * - Comprehensive connection status indicators (connecting, connected, disconnected, error states)
 * - Enhanced connection button with all states (idle, connecting, connected, error, retry)
 * - Production-ready components using Tailwind CSS with Xbox green theme
 * - Integration with enhanced PhantomWalletManager error handling from sub-task 1.5
 * - Real-time status updates with health monitoring and connection validation
 * - Error display components with user-friendly messages and retry functionality
 * - Network status indicators with RPC latency and health metrics
 * - Mobile-responsive design with accessibility compliance (WCAG 2.1 AA)
 * - Xbox retro styling with pulse effects, hover animations, and glow states
 * - Session management integration with activity tracking
 * - Copy-to-clipboard functionality with visual feedback
 * - Auto-reconnection status display with progress indicators
 * - Rate limiting indicators and connection attempt tracking
 * - Security event handling for account changes and network switches
 * - Cross-tab session management and cleanup status
 * - Comprehensive analytics event integration ready
 * 
 * Enhanced for Sub-task 1.6:
 * - Advanced connection state visualization
 * - Enhanced error categorization and user guidance
 * - Improved loading states and progress indicators
 * - Better health monitoring with visual feedback
 * - Enhanced security status indicators
 * - Improved accessibility and keyboard navigation
 */

import { getWalletManager } from '../../wallet/phantom-wallet.js';

/**
 * WalletAddressDisplay - Displays truncated wallet address with hover expansion
 */
export class WalletAddressDisplay {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      showCopyButton: true,
      showBalance: false,
      showStatusIcon: true,
      expandOnHover: true,
      className: '',
      ...options
    };
    
    this.walletManager = getWalletManager();
    this.isExpanded = false;
    this.element = null;
    
    this.init();
  }

  /**
   * Initialize the wallet address display component
   */
  init() {
    this.render();
    this.setupEventListeners();
    this.updateDisplay();
    
    // Listen for wallet state changes
    this.walletManager.on('connected', () => this.updateDisplay());
    this.walletManager.on('disconnected', () => this.updateDisplay());
    this.walletManager.on('error', (error) => this.showError(error.message));
  }

  /**
   * Render the wallet address display component
   */
  render() {
    const baseClasses = `
      wallet-address-display
      flex items-center gap-2
      px-3 py-2
      bg-gradient-to-r from-gray-800 to-gray-900
      border border-green-500/20
      rounded-lg
      transition-all duration-300 ease-in-out
      hover:border-green-500/40
      hover:shadow-lg hover:shadow-green-500/10
      ${this.options.className}
    `.trim().replace(/\s+/g, ' ');

    this.element = document.createElement('div');
    this.element.className = baseClasses;
    this.element.innerHTML = this.getDisplayHTML();
    
    this.container.appendChild(this.element);
  }

  /**
   * Generate HTML for the wallet display
   */
  getDisplayHTML() {
    const connectionInfo = this.walletManager.getConnectionInfo();
    
    if (!connectionInfo || !connectionInfo.isConnected) {
      return this.getNotConnectedHTML();
    }

    const { address, shortAddress } = connectionInfo;
    const displayAddress = this.isExpanded ? address : shortAddress;
    
    return `
      <div class="flex items-center gap-2 min-w-0 flex-1">
        ${this.options.showStatusIcon ? this.getStatusIcon() : ''}
        <span class="wallet-address font-mono text-sm text-green-400 truncate" 
              title="${address}">
          ${displayAddress}
        </span>
        ${this.options.showBalance ? '<span class="wallet-balance text-xs text-gray-400"></span>' : ''}
      </div>
      ${this.options.showCopyButton ? this.getCopyButtonHTML() : ''}
    `;
  }

  /**
   * HTML for not connected state
   */
  getNotConnectedHTML() {
    return `
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 bg-gray-500 rounded-full"></div>
        <span class="text-gray-500 text-sm">Not connected</span>
      </div>
    `;
  }

  /**
   * Generate status icon HTML
   */
  getStatusIcon() {
    const connectionInfo = this.walletManager.getConnectionInfo();
    const isConnected = connectionInfo?.isConnected;
    
    return `
      <div class="status-icon w-2 h-2 rounded-full ${
        isConnected 
          ? 'bg-green-400 pulse-glow' 
          : 'bg-gray-500'
      }" title="${isConnected ? 'Connected' : 'Disconnected'}"></div>
    `;
  }

  /**
   * Generate copy button HTML
   */
  getCopyButtonHTML() {
    return `
      <button class="copy-btn p-1 rounded hover:bg-gray-700 transition-colors group" 
              title="Copy address">
        <svg class="w-4 h-4 text-gray-400 group-hover:text-green-400" 
             fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
    `;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (!this.element) return;

    // Hover expansion
    if (this.options.expandOnHover) {
      this.element.addEventListener('mouseenter', () => this.expandAddress());
      this.element.addEventListener('mouseleave', () => this.contractAddress());
    }

    // Copy button
    if (this.options.showCopyButton) {
      const copyBtn = this.element.querySelector('.copy-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.copyAddress();
        });
      }
    }

    // Update balance if enabled
    if (this.options.showBalance) {
      this.updateBalance();
    }
  }

  /**
   * Expand address display
   */
  expandAddress() {
    const connectionInfo = this.walletManager.getConnectionInfo();
    if (!connectionInfo?.isConnected || this.isExpanded) return;

    this.isExpanded = true;
    const addressElement = this.element.querySelector('.wallet-address');
    if (addressElement) {
      addressElement.textContent = connectionInfo.address;
      addressElement.classList.add('expanded');
    }
  }

  /**
   * Contract address display
   */
  contractAddress() {
    const connectionInfo = this.walletManager.getConnectionInfo();
    if (!connectionInfo?.isConnected || !this.isExpanded) return;

    this.isExpanded = false;
    const addressElement = this.element.querySelector('.wallet-address');
    if (addressElement) {
      addressElement.textContent = connectionInfo.shortAddress;
      addressElement.classList.remove('expanded');
    }
  }

  /**
   * Copy wallet address to clipboard
   */
  async copyAddress() {
    const connectionInfo = this.walletManager.getConnectionInfo();
    if (!connectionInfo?.isConnected) return;

    try {
      await navigator.clipboard.writeText(connectionInfo.address);
      this.showCopyFeedback();
    } catch (error) {
      console.error('Failed to copy address:', error);
      // Fallback for older browsers
      this.fallbackCopy(connectionInfo.address);
    }
  }

  /**
   * Show copy feedback animation
   */
  showCopyFeedback() {
    const copyBtn = this.element.querySelector('.copy-btn');
    if (!copyBtn) return;

    const originalHTML = copyBtn.innerHTML;
    copyBtn.innerHTML = `
      <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
    `;

    setTimeout(() => {
      copyBtn.innerHTML = originalHTML;
    }, 1500);
  }

  /**
   * Fallback copy method for older browsers
   */
  fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      this.showCopyFeedback();
    } catch (error) {
      console.error('Fallback copy failed:', error);
    } finally {
      document.body.removeChild(textArea);
    }
  }

  /**
   * Update wallet balance display
   */
  async updateBalance() {
    const balanceElement = this.element?.querySelector('.wallet-balance');
    if (!balanceElement) return;

    try {
      const balance = await this.walletManager.getBalance();
      balanceElement.textContent = `${balance.toFixed(4)} SOL`;
      balanceElement.classList.remove('error');
    } catch (error) {
      balanceElement.textContent = 'Error';
      balanceElement.classList.add('error', 'text-red-400');
    }
  }

  /**
   * Update the entire display
   */
  updateDisplay() {
    if (!this.element) return;
    
    this.element.innerHTML = this.getDisplayHTML();
    this.setupEventListeners();
  }

  /**
   * Show error message with enhanced error display
   */
  showError(error) {
    if (!this.element) return;
    
    const errorMessage = typeof error === 'string' ? error : error.userMessage || error.message || 'Connection error';
    const errorTitle = error.title || 'Wallet Error';
    
    this.element.innerHTML = `
      <div class="flex items-center gap-2 text-red-400 p-2 bg-red-900/20 rounded border border-red-500/20">
        <div class="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-red-300">${errorTitle}</p>
          <p class="text-xs text-red-400 mt-1">${errorMessage}</p>
        </div>
      </div>
    `;
  }

  /**
   * Destroy component and cleanup
   */
  destroy() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}

/**
 * WalletErrorDisplay - Enhanced error display component with retry functionality
 */
export class WalletErrorDisplay {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      showRetryButton: true,
      showDetailsButton: false,
      autoHide: false,
      autoHideDelay: 5000,
      className: '',
      ...options
    };
    
    this.walletManager = getWalletManager();
    this.element = null;
    this.currentError = null;
    this.autoHideTimer = null;
    
    this.init();
  }

  /**
   * Initialize the error display component
   */
  init() {
    this.render();
    this.hide(); // Start hidden
    
    // Listen for wallet errors
    this.walletManager.on('error', (error) => this.showError(error));
    this.walletManager.on('connectionFailed', (data) => this.showError(data.error));
    this.walletManager.on('connected', () => this.hide());
    this.walletManager.on('connecting', () => this.hide());
  }

  /**
   * Render the error display component
   */
  render() {
    this.element = document.createElement('div');
    this.element.className = `wallet-error-display hidden transition-all duration-300 ${this.options.className}`;
    
    this.container.appendChild(this.element);
  }

  /**
   * Show error with comprehensive display
   */
  showError(error) {
    if (!this.element) return;
    
    this.currentError = error;
    const errorType = error.type || 'UNKNOWN_ERROR';
    const errorTitle = error.title || 'Connection Error';
    const errorMessage = error.userMessage || error.message || 'An unexpected error occurred';
    const canRetry = this.canRetryError(errorType);
    const actionText = error.action || 'Try Again';
    const actionUrl = error.actionUrl;
    
    this.element.innerHTML = `
      <div class="error-content bg-gradient-to-r from-red-900/80 to-red-800/80 border border-red-500/30 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0">
            <svg class="w-6 h-6 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-semibold text-red-300 mb-1">${errorTitle}</h3>
            <p class="text-sm text-red-400 mb-3 leading-relaxed">${errorMessage}</p>
            
            <div class="flex items-center gap-2 flex-wrap">
              ${canRetry && this.options.showRetryButton ? `
                <button class="retry-btn px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded 
                               transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50">
                  <svg class="w-4 h-4 mr-1.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  ${actionText}
                </button>
              ` : ''}
              
              ${actionUrl ? `
                <a href="${actionUrl}" target="_blank" rel="noopener noreferrer"
                   class="action-link px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded 
                          transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50">
                  <svg class="w-4 h-4 mr-1.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  ${actionText}
                </a>
              ` : ''}
              
              ${this.options.showDetailsButton ? `
                <button class="details-btn text-sm text-gray-400 hover:text-gray-300 underline focus:outline-none">
                  View Details
                </button>
              ` : ''}
            </div>
            
            ${this.options.showDetailsButton ? `
              <div class="error-details hidden mt-3 p-2 bg-black/20 rounded border border-gray-700">
                <p class="text-xs text-gray-400 font-mono break-all">${error.message}</p>
                <p class="text-xs text-gray-500 mt-1">Error Type: ${errorType}</p>
              </div>
            ` : ''}
          </div>
          
          <button class="dismiss-btn flex-shrink-0 p-1 text-gray-400 hover:text-gray-300 focus:outline-none">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    `;
    
    this.setupEventListeners();
    this.show();
    
    // Auto-hide if enabled
    if (this.options.autoHide) {
      this.startAutoHide();
    }
  }

  /**
   * Setup event listeners for error display
   */
  setupEventListeners() {
    if (!this.element) return;

    // Retry button
    const retryBtn = this.element.querySelector('.retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => this.handleRetry());
    }

    // Details button
    const detailsBtn = this.element.querySelector('.details-btn');
    if (detailsBtn) {
      detailsBtn.addEventListener('click', () => this.toggleDetails());
    }

    // Dismiss button
    const dismissBtn = this.element.querySelector('.dismiss-btn');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => this.hide());
    }
  }

  /**
   * Handle retry button click
   */
  async handleRetry() {
    if (!this.currentError) return;
    
    const retryBtn = this.element?.querySelector('.retry-btn');
    if (retryBtn) {
      retryBtn.disabled = true;
      retryBtn.innerHTML = `
        <svg class="w-4 h-4 mr-1.5 inline animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Retrying...
      `;
    }
    
    try {
      await this.walletManager.connect();
    } catch (error) {
      console.error('Retry failed:', error);
      // Error will be caught by error listener and displayed
    }
  }

  /**
   * Toggle error details display
   */
  toggleDetails() {
    const detailsEl = this.element?.querySelector('.error-details');
    if (detailsEl) {
      detailsEl.classList.toggle('hidden');
    }
  }

  /**
   * Check if error type can be retried
   */
  canRetryError(errorType) {
    const nonRetryableErrors = [
      'USER_REJECTED',
      'WALLET_NOT_INSTALLED',
      'BROWSER_INCOMPATIBLE'
    ];
    
    return !nonRetryableErrors.includes(errorType);
  }

  /**
   * Show the error display
   */
  show() {
    if (this.element) {
      this.element.classList.remove('hidden', 'opacity-0', 'translate-y-2');
      this.element.classList.add('opacity-100', 'translate-y-0');
    }
  }

  /**
   * Hide the error display
   */
  hide() {
    if (this.element) {
      this.element.classList.add('hidden', 'opacity-0', 'translate-y-2');
      this.element.classList.remove('opacity-100', 'translate-y-0');
    }
    
    this.clearAutoHide();
  }

  /**
   * Start auto-hide timer
   */
  startAutoHide() {
    this.clearAutoHide();
    this.autoHideTimer = setTimeout(() => {
      this.hide();
    }, this.options.autoHideDelay);
  }

  /**
   * Clear auto-hide timer
   */
  clearAutoHide() {
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
  }

  /**
   * Destroy component
   */
  destroy() {
    this.clearAutoHide();
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}

/**
 * WalletStatusBadge - Compact status indicator with health information
 */
export class WalletStatusBadge {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      showText: false,
      showHealth: true,
      showLatency: false,
      size: 'sm', // 'xs', 'sm', 'md', 'lg'
      position: 'inline', // 'inline', 'fixed-top-right', 'fixed-bottom-right'
      className: '',
      ...options
    };
    
    this.walletManager = getWalletManager();
    this.element = null;
    this.healthCheckInterval = null;
    
    this.init();
  }

  /**
   * Initialize the status badge
   */
  init() {
    this.render();
    this.updateStatus();
    this.startHealthChecks();
    
    // Listen for wallet state changes
    this.walletManager.on('connected', () => this.updateStatus());
    this.walletManager.on('disconnected', () => this.updateStatus());
    this.walletManager.on('connecting', () => this.updateStatus());
    this.walletManager.on('error', () => this.updateStatus());
    this.walletManager.on('healthCheckPassed', () => this.updateStatus());
    this.walletManager.on('healthCheckFailed', () => this.updateStatus());
  }

  /**
   * Render the status badge
   */
  render() {
    const positionClasses = {
      'inline': '',
      'fixed-top-right': 'fixed top-4 right-4 z-50',
      'fixed-bottom-right': 'fixed bottom-4 right-4 z-50'
    };
    
    this.element = document.createElement('div');
    this.element.className = `wallet-status-badge ${positionClasses[this.options.position]} ${this.options.className}`;
    
    this.container.appendChild(this.element);
  }

  /**
   * Update comprehensive status display with enhanced information
   */
  updateStatus() {
    if (!this.element) return;
    
    const walletStatus = this.walletManager.getWalletStatus();
    const connectionHealth = this.walletManager.getConnectionHealth();
    const { isConnected, isConnecting, canConnect, network, reconnectionAttempts } = walletStatus;
    const { isHealthy, rpcLatency, errorCount, consecutiveFailures, isRateLimited, retryAttempts } = connectionHealth;
    
    const sizeClasses = {
      xs: { dot: 'w-2 h-2', text: 'text-xs', badge: 'text-xs px-2 py-1' },
      sm: { dot: 'w-2.5 h-2.5', text: 'text-sm', badge: 'text-xs px-2.5 py-1.5' },
      md: { dot: 'w-3 h-3', text: 'text-base', badge: 'text-sm px-3 py-2' },
      lg: { dot: 'w-4 h-4', text: 'text-lg', badge: 'text-base px-4 py-2' }
    };
    
    const sizes = sizeClasses[this.options.size] || sizeClasses.sm;
    
    // Determine status and colors with enhanced logic
    let status, statusText, dotColor, bgColor, textColor, statusDetails = [];
    
    if (isConnecting) {
      const attemptInfo = retryAttempts > 0 ? ` (${retryAttempts + 1})` : '';
      status = 'connecting';
      statusText = `Connecting${attemptInfo}`;
      dotColor = retryAttempts > 0 ? 'bg-yellow-400 animate-pulse' : 'bg-yellow-400 animate-pulse';
      bgColor = 'bg-yellow-900/20 border-yellow-500/30';
      textColor = 'text-yellow-400';
      statusDetails.push('Establishing wallet connection');
    } else if (isConnected) {
      if (isRateLimited) {
        status = 'connected-rate-limited';
        statusText = 'Connected (Limited)';
        dotColor = 'bg-orange-400 animate-pulse';
        bgColor = 'bg-orange-900/20 border-orange-500/30';
        textColor = 'text-orange-400';
        statusDetails.push('Rate limited - please wait');
      } else if (isHealthy && consecutiveFailures === 0) {
        status = 'connected-healthy';
        statusText = 'Connected';
        dotColor = 'bg-green-400 pulse-glow';
        bgColor = 'bg-green-900/20 border-green-500/30';
        textColor = 'text-green-400';
        statusDetails.push(`Network: ${network || 'mainnet-beta'}`);
        if (rpcLatency) statusDetails.push(`Latency: ${rpcLatency}ms`);
      } else {
        status = 'connected-unhealthy';
        statusText = 'Connected (Issues)';
        dotColor = 'bg-orange-400 animate-pulse';
        bgColor = 'bg-orange-900/20 border-orange-500/30';
        textColor = 'text-orange-400';
        statusDetails.push(`${errorCount} recent errors`);
        if (consecutiveFailures > 0) statusDetails.push(`${consecutiveFailures} consecutive failures`);
      }
    } else if (canConnect) {
      status = 'ready';
      statusText = reconnectionAttempts > 0 ? 'Ready (Reconnecting)' : 'Ready';
      dotColor = reconnectionAttempts > 0 ? 'bg-blue-400 animate-pulse' : 'bg-gray-400';
      bgColor = 'bg-gray-900/20 border-gray-500/30';
      textColor = 'text-gray-400';
      statusDetails.push('Phantom wallet detected');
      if (reconnectionAttempts > 0) statusDetails.push(`${reconnectionAttempts} reconnection attempts`);
    } else {
      status = 'unavailable';
      statusText = 'Unavailable';
      dotColor = 'bg-red-400';
      bgColor = 'bg-red-900/20 border-red-500/30';
      textColor = 'text-red-400';
      statusDetails.push('Phantom wallet not found');
    }
    
    // Build comprehensive tooltip
    const tooltip = [statusText, ...statusDetails].join('\\n');
    
    this.element.innerHTML = `
      <div class="flex items-center gap-2 ${sizes.badge} rounded-full border ${bgColor} transition-all duration-300 cursor-help" 
           title="${tooltip}">
        <div class="${sizes.dot} rounded-full ${dotColor} relative" title="${statusText}">
          ${isRateLimited ? `
            <div class="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-500 rounded-full"></div>
          ` : ''}
          ${consecutiveFailures > 2 ? `
            <div class="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
          ` : ''}
        </div>
        
        ${this.options.showText ? `
          <span class="${sizes.text} font-medium ${textColor}">${statusText}</span>
        ` : ''}
        
        ${this.options.showHealth && isConnected ? `
          <div class="flex items-center gap-0.5" title="Health Indicators">
            <div class="w-1 h-3 rounded-full transition-colors ${
              errorCount === 0 ? 'bg-green-400' : 
              errorCount < 3 ? 'bg-yellow-400' : 'bg-red-400'
            }" title="Error Count: ${errorCount}"></div>
            <div class="w-1 h-2 rounded-full transition-colors ${
              isHealthy ? 'bg-green-400' : 'bg-red-400'
            }" title="Network Health"></div>
            <div class="w-1 h-4 rounded-full transition-colors ${
              !rpcLatency ? 'bg-gray-400' :
              rpcLatency < 100 ? 'bg-green-400' :
              rpcLatency < 500 ? 'bg-yellow-400' : 'bg-red-400'
            }" title="Response Time: ${rpcLatency || 'Unknown'}ms"></div>
            ${consecutiveFailures > 0 ? `
              <div class="w-1 h-2 rounded-full bg-red-500 animate-pulse" 
                   title="Consecutive Failures: ${consecutiveFailures}"></div>
            ` : ''}
          </div>
        ` : ''}
        
        ${this.options.showLatency && rpcLatency ? `
          <span class="text-xs ${textColor} opacity-75 font-mono" title="Network Latency">
            ${rpcLatency}ms
          </span>
        ` : ''}
        
        ${retryAttempts > 0 && isConnecting ? `
          <div class="flex items-center gap-1">
            <div class="w-1 h-1 rounded-full bg-current animate-pulse"></div>
            <span class="text-xs ${textColor} opacity-75">${retryAttempts + 1}</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.healthCheckInterval = setInterval(() => {
      this.updateStatus();
    }, 10000); // Update every 10 seconds
  }

  /**
   * Stop health checks
   */
  stopHealthChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Destroy component
   */
  destroy() {
    this.stopHealthChecks();
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}

/**
 * WalletConnectButton - Enhanced wallet connection button with comprehensive state management
 */
export class WalletConnectButton {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      text: 'Connect Wallet',
      connectingText: 'Connecting...',
      connectedText: 'Connected',
      errorText: 'Connection Error',
      retryText: 'Retry Connection',
      showAddress: true,
      showDisconnect: true,
      showStatus: true,
      showRetryOnError: true,
      className: '',
      variant: 'primary', // 'primary', 'secondary', 'minimal', 'hero'
      size: 'md', // 'sm', 'md', 'lg', 'xl'
      ...options
    };
    
    this.walletManager = getWalletManager();
    this.element = null;
    this.currentState = 'disconnected'; // 'disconnected', 'connecting', 'connected', 'error'
    this.lastError = null;
    
    this.init();
  }

  /**
   * Initialize the wallet connect button
   */
  init() {
    this.render();
    this.setupEventListeners();
    this.updateButtonState();
    
    // Listen for comprehensive wallet state changes
    this.walletManager.on('connecting', () => this.handleConnecting());
    this.walletManager.on('connected', () => this.handleConnected());
    this.walletManager.on('disconnected', () => this.handleDisconnected());
    this.walletManager.on('error', (error) => this.handleError(error));
    this.walletManager.on('connectionFailed', (data) => this.handleConnectionFailed(data));
    this.walletManager.on('connectionRetry', (data) => this.handleConnectionRetry(data));
    this.walletManager.on('autoReconnectFailed', () => this.handleAutoReconnectFailed());
    this.walletManager.on('walletLocked', () => this.handleWalletLocked());
  }

  /**
   * Render the wallet connect button
   */
  render() {
    const variantClasses = this.getVariantClasses();
    
    this.element = document.createElement('div');
    this.element.className = `wallet-connect-button ${this.options.className}`;
    this.element.innerHTML = this.getButtonHTML(variantClasses);
    
    this.container.appendChild(this.element);
  }

  /**
   * Get variant and size-specific CSS classes
   */
  getVariantClasses() {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
      xl: 'px-8 py-4 text-lg'
    };
    
    const baseClasses = `
      font-semibold rounded-lg transition-all duration-300 
      focus:outline-none focus:ring-2 focus:ring-opacity-50
      disabled:cursor-not-allowed
      ${sizeClasses[this.options.size] || sizeClasses.md}
    `.trim().replace(/\s+/g, ' ');
    
    const variants = {
      primary: `
        ${baseClasses}
        bg-gradient-to-r from-green-600 to-green-500
        hover:from-green-500 hover:to-green-400
        text-white shadow-lg shadow-green-500/20
        hover:shadow-xl hover:shadow-green-500/30
        hover:transform hover:-translate-y-0.5
        focus:ring-green-400
        disabled:opacity-50 disabled:transform-none disabled:shadow-lg
      `,
      secondary: `
        ${baseClasses}
        bg-gray-800 hover:bg-gray-700 border border-green-500/30 
        hover:border-green-500/50 text-green-400
        focus:ring-green-400
        disabled:opacity-50
      `,
      minimal: `
        ${baseClasses}
        text-green-400 hover:text-green-300 bg-transparent
        hover:bg-green-400/10 border border-transparent
        hover:border-green-400/30
        focus:ring-green-400
        disabled:opacity-50
      `,
      hero: `
        ${baseClasses}
        bg-gradient-to-r from-green-600 via-green-500 to-emerald-500
        hover:from-green-500 hover:via-emerald-500 hover:to-green-400
        text-white shadow-xl shadow-green-500/25
        hover:shadow-2xl hover:shadow-green-500/40
        hover:transform hover:scale-105 hover:-translate-y-1
        focus:ring-green-400
        disabled:opacity-50 disabled:transform-none disabled:shadow-xl
        relative overflow-hidden
      `
    };
    
    return variants[this.options.variant] || variants.primary;
  }

  /**
   * Generate enhanced button HTML based on current state with comprehensive status
   */
  getButtonHTML(variantClasses) {
    const connectionInfo = this.walletManager.getConnectionInfo();
    const walletStatus = this.walletManager.getWalletStatus();
    const connectionHealth = this.walletManager.getConnectionHealth();
    const isConnected = connectionInfo?.isConnected;
    const { isRateLimited, retryAttempts } = connectionHealth;
    
    if (isConnected && this.options.showAddress) {
      return this.getConnectedStateHTML();
    }
    
    // Determine button content based on current state with enhanced information
    let buttonContent, isDisabled, extraClasses, tooltip;
    
    switch (this.currentState) {
      case 'connecting':
        const connectingText = retryAttempts > 0 
          ? `${this.options.connectingText} (${retryAttempts + 1})` 
          : this.options.connectingText;
        buttonContent = `
          ${this.getLoadingSpinner()}
          <span class="btn-text">${connectingText}</span>
        `;
        isDisabled = true;
        extraClasses = 'cursor-wait';
        tooltip = retryAttempts > 0 ? `Connection attempt ${retryAttempts + 1}` : 'Connecting to Phantom wallet';
        break;
        
      case 'error':
        const errorType = this.lastError?.type || 'unknown';
        const canRetry = this.walletManager.shouldRetryConnection?.(this.lastError) ?? true;
        const errorIcon = this.getErrorIcon(errorType);
        const buttonText = canRetry && this.options.showRetryOnError ? this.options.retryText : this.options.errorText;
        
        buttonContent = `
          ${errorIcon}
          <span class="btn-text">${buttonText}</span>
          ${isRateLimited ? '<span class="text-xs opacity-75 ml-1">(Rate Limited)</span>' : ''}
        `;
        isDisabled = isRateLimited;
        extraClasses = `bg-red-600 hover:bg-red-500 border-red-500 ${isRateLimited ? 'opacity-50 cursor-not-allowed' : ''}`;
        tooltip = this.getErrorTooltip(errorType, isRateLimited);
        break;
        
      case 'connected':
        const healthStatus = connectionHealth.isHealthy ? 'Healthy' : 'Issues Detected';
        buttonContent = `
          <div class="w-2 h-2 bg-green-400 rounded-full mr-2 pulse-glow"></div>
          <span class="btn-text">${this.options.connectedText}</span>
          ${connectionHealth.rpcLatency ? `<span class="text-xs opacity-75 ml-1">${connectionHealth.rpcLatency}ms</span>` : ''}
        `;
        isDisabled = false;
        extraClasses = connectionHealth.isHealthy ? '' : 'border-yellow-500/50';
        tooltip = `Connected - Network ${healthStatus}`;
        break;
        
      default:
        const isAvailable = walletStatus.isAvailable;
        const walletIcon = isAvailable ? this.getWalletIcon() : this.getInstallIcon();
        const defaultText = isAvailable ? this.options.text : 'Install Phantom';
        
        buttonContent = `
          ${walletIcon}
          <span class="btn-text">${defaultText}</span>
        `;
        isDisabled = false;
        extraClasses = isAvailable ? '' : 'bg-blue-600 hover:bg-blue-500';
        tooltip = isAvailable ? 'Click to connect Phantom wallet' : 'Phantom wallet not detected - click to install';
    }
    
    const finalClasses = `${variantClasses} ${extraClasses}`.trim().replace(/\s+/g, ' ');
    
    return `
      <button class="wallet-btn ${finalClasses} flex items-center justify-center relative group"
              ${isDisabled ? 'disabled' : ''}
              data-state="${this.currentState}"
              title="${tooltip}"
              aria-label="${tooltip}">
        ${buttonContent}
        ${this.options.showStatus ? this.getStatusIndicator() : ''}
        ${this.getProgressIndicator()}
      </button>
    `;
  }

  /**
   * Get enhanced status indicator for button with comprehensive health metrics
   */
  getStatusIndicator() {
    const connectionHealth = this.walletManager.getConnectionHealth();
    const { isHealthy, errorCount, rpcLatency, consecutiveFailures, isRateLimited } = connectionHealth;
    
    if (this.currentState !== 'connected' && this.currentState !== 'error') return '';
    
    // Enhanced health visualization with more granular status
    const getHealthColor = () => {
      if (!isHealthy || consecutiveFailures > 0) return 'bg-red-400';
      if (errorCount > 0) return 'bg-yellow-400';
      return 'bg-green-400';
    };
    
    const getLatencyColor = () => {
      if (!rpcLatency) return 'bg-gray-400';
      if (rpcLatency < 100) return 'bg-green-400';
      if (rpcLatency < 500) return 'bg-yellow-400';
      return 'bg-red-400';
    };
    
    const getErrorCountColor = () => {
      if (errorCount === 0) return 'bg-green-400';
      if (errorCount < 3) return 'bg-yellow-400';
      return 'bg-red-400';
    };
    
    // Create status tooltip
    const statusLines = [];
    if (this.currentState === 'connected') {
      statusLines.push(`Network: ${isHealthy ? 'Healthy' : 'Issues'}`);
      statusLines.push(`Latency: ${rpcLatency ? `${rpcLatency}ms` : 'Unknown'}`);
      statusLines.push(`Errors: ${errorCount}`);
      if (consecutiveFailures > 0) {
        statusLines.push(`Recent failures: ${consecutiveFailures}`);
      }
    }
    if (isRateLimited) {
      statusLines.push('Rate limited - please wait');
    }
    
    const tooltip = statusLines.join('\n');
    
    return `
      <div class="ml-2 flex items-center gap-0.5 health-indicators" title="${tooltip}">
        ${this.currentState === 'connected' ? `
          <div class="w-1 h-2 rounded-full ${getHealthColor()} transition-colors" 
               title="Network Health"></div>
          <div class="w-1 h-3 rounded-full ${getLatencyColor()} transition-colors" 
               title="Response Time"></div>
          <div class="w-1 h-2 rounded-full ${getErrorCountColor()} transition-colors" 
               title="Error Count"></div>
        ` : ''}
        ${isRateLimited ? `
          <div class="w-1 h-4 rounded-full bg-orange-400 animate-pulse" 
               title="Rate Limited"></div>
        ` : ''}
        ${consecutiveFailures > 2 ? `
          <div class="w-1 h-2 rounded-full bg-red-500 animate-pulse" 
               title="Connection Issues"></div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Generate connected state HTML with dropdown
   */
  getConnectedStateHTML() {
    const connectionInfo = this.walletManager.getConnectionInfo();
    
    return `
      <div class="wallet-dropdown relative">
        <button class="wallet-btn connected ${this.getVariantClasses().trim().replace(/\s+/g, ' ')} 
                       flex items-center gap-2">
          <div class="w-2 h-2 bg-green-400 rounded-full pulse-glow"></div>
          <span class="font-mono text-sm">${connectionInfo.shortAddress}</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        <div class="dropdown-menu absolute top-full right-0 mt-2 w-64 
                    bg-gray-900 border border-green-500/20 rounded-lg shadow-xl
                    transform scale-95 opacity-0 pointer-events-none
                    transition-all duration-200 z-50">
          <div class="p-4 border-b border-gray-700">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 
                          rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9z" />
                </svg>
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-white">Phantom Wallet</p>
                <p class="text-xs text-gray-400 font-mono truncate" title="${connectionInfo.address}">
                  ${connectionInfo.address}
                </p>
              </div>
            </div>
          </div>
          
          <div class="p-2">
            <button class="copy-address-btn w-full text-left px-3 py-2 text-sm
                           text-gray-300 hover:bg-gray-800 rounded flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Address
            </button>
            
            ${this.options.showDisconnect ? `
              <button class="disconnect-btn w-full text-left px-3 py-2 text-sm
                             text-red-400 hover:bg-red-900/20 rounded flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Disconnect
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate enhanced loading spinner HTML with Xbox-style animation and connection state
   */
  getLoadingSpinner() {
    const connectionHealth = this.walletManager.getConnectionHealth();
    const retryAttempts = connectionHealth.retryAttempts || 0;
    
    // Different spinner styles based on connection state
    const spinnerClass = retryAttempts > 0 ? 'animate-pulse' : 'animate-spin';
    const ringColor = retryAttempts > 1 ? 'text-yellow-400' : 'text-current';
    const pulseColor = retryAttempts > 1 ? 'bg-yellow-400' : 'bg-green-400';
    
    return `
      <div class="relative mr-2 loading-spinner-container">
        <svg class="${spinnerClass} h-5 w-5 ${ringColor}" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
          </path>
        </svg>
        <div class="absolute inset-0 animate-ping rounded-full ${pulseColor} opacity-20"></div>
        ${retryAttempts > 0 ? `
          <div class="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center">
            <span class="text-xs font-bold text-black">${retryAttempts}</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Get error-specific icon based on error type
   */
  getErrorIcon(errorType) {
    const iconMap = {
      'WALLET_NOT_INSTALLED': `
        <svg class="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>`,
      'WALLET_LOCKED': `
        <svg class="w-5 h-5 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>`,
      'USER_REJECTED': `
        <svg class="w-5 h-5 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
        </svg>`,
      'NETWORK_ERROR': `
        <svg class="w-5 h-5 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>`,
      'RATE_LIMITED': `
        <svg class="w-5 h-5 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>`,
      'CONNECTION_TIMEOUT': `
        <svg class="w-5 h-5 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>`
    };
    
    return iconMap[errorType] || `
      <svg class="w-5 h-5 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>`;
  }

  /**
   * Get wallet connection icon
   */
  getWalletIcon() {
    return `
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>`;
  }

  /**
   * Get install wallet icon
   */
  getInstallIcon() {
    return `
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>`;
  }

  /**
   * Get error-specific tooltip message
   */
  getErrorTooltip(errorType, isRateLimited) {
    if (isRateLimited) {
      return 'Too many connection attempts - please wait before retrying';
    }
    
    const tooltipMap = {
      'WALLET_NOT_INSTALLED': 'Phantom wallet not found - click to install',
      'WALLET_LOCKED': 'Wallet is locked - please unlock and try again',
      'USER_REJECTED': 'Connection was cancelled - click to try again',
      'NETWORK_ERROR': 'Network connection error - check your internet',
      'RATE_LIMITED': 'Too many requests - please wait',
      'CONNECTION_TIMEOUT': 'Connection timed out - try again',
      'CONNECTION_FAILED': 'Connection failed - click to retry'
    };
    
    return tooltipMap[errorType] || 'Connection error - click to retry';
  }

  /**
   * Get progress indicator for connection attempts
   */
  getProgressIndicator() {
    const connectionHealth = this.walletManager.getConnectionHealth();
    const { retryAttempts, isRateLimited } = connectionHealth;
    const maxAttempts = 3; // From ERROR_CONFIG.MAX_RETRY_ATTEMPTS
    
    if (this.currentState !== 'connecting' && this.currentState !== 'error') {
      return '';
    }
    
    if (isRateLimited) {
      return `
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-b animate-pulse"></div>
      `;
    }
    
    if (retryAttempts > 0 && this.currentState === 'connecting') {
      const progress = (retryAttempts / maxAttempts) * 100;
      return `
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 rounded-b overflow-hidden">
          <div class="h-full bg-yellow-400 transition-all duration-300 rounded-b" 
               style="width: ${progress}%"></div>
        </div>
      `;
    }
    
    return '';
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (!this.element) return;

    // Main button click
    const walletBtn = this.element.querySelector('.wallet-btn');
    if (walletBtn) {
      walletBtn.addEventListener('click', (e) => this.handleButtonClick(e));
    }

    // Dropdown toggle
    const dropdown = this.element.querySelector('.wallet-dropdown');
    if (dropdown) {
      // Toggle dropdown on button click
      walletBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDropdown();
      });

      // Copy address
      const copyBtn = this.element.querySelector('.copy-address-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => this.copyAddress());
      }

      // Disconnect
      const disconnectBtn = this.element.querySelector('.disconnect-btn');
      if (disconnectBtn) {
        disconnectBtn.addEventListener('click', () => this.handleDisconnect());
      }

      // Close dropdown on outside click
      document.addEventListener('click', () => this.closeDropdown());
    }
  }

  /**
   * Handle main button click with state-aware logic
   */
  async handleButtonClick(e) {
    e.preventDefault();
    
    const connectionInfo = this.walletManager.getConnectionInfo();
    
    // Handle different states
    switch (this.currentState) {
      case 'connected':
        // Already connected, don't do anything (dropdown handles this)
        return;
        
      case 'connecting':
        // Already connecting, ignore click
        return;
        
      case 'error':
        // In error state, attempt retry
        if (this.options.showRetryOnError) {
          this.attemptRetry();
        }
        return;
        
      default:
        // Disconnected state, attempt connection
        this.attemptConnection();
    }
  }

  /**
   * Attempt wallet connection
   */
  async attemptConnection() {
    try {
      await this.walletManager.connect();
    } catch (error) {
      console.error('Connection failed:', error);
      // Error will be handled by error event listeners
    }
  }

  /**
   * Attempt retry after error
   */
  async attemptRetry() {
    console.log('Retrying wallet connection...');
    
    // Reset state to connecting
    this.currentState = 'connecting';
    this.updateButtonState();
    
    try {
      await this.walletManager.connect();
    } catch (error) {
      console.error('Retry failed:', error);
      // Error will be handled by error event listeners
    }
  }

  /**
   * Toggle dropdown menu
   */
  toggleDropdown() {
    const dropdown = this.element.querySelector('.dropdown-menu');
    if (!dropdown) return;
    
    const isOpen = dropdown.classList.contains('open');
    
    if (isOpen) {
      this.closeDropdown();
    } else {
      dropdown.classList.add('open', 'scale-100', 'opacity-100', 'pointer-events-auto');
      dropdown.classList.remove('scale-95', 'opacity-0', 'pointer-events-none');
    }
  }

  /**
   * Close dropdown menu
   */
  closeDropdown() {
    const dropdown = this.element.querySelector('.dropdown-menu');
    if (!dropdown) return;
    
    dropdown.classList.remove('open', 'scale-100', 'opacity-100', 'pointer-events-auto');
    dropdown.classList.add('scale-95', 'opacity-0', 'pointer-events-none');
  }

  /**
   * Copy wallet address
   */
  async copyAddress() {
    const connectionInfo = this.walletManager.getConnectionInfo();
    if (!connectionInfo?.address) return;

    try {
      await navigator.clipboard.writeText(connectionInfo.address);
      
      // Show feedback
      const copyBtn = this.element.querySelector('.copy-address-btn');
      if (copyBtn) {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = `
          <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        `;
        
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
        }, 1500);
      }
      
      this.closeDropdown();
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  }

  /**
   * Handle disconnect button click
   */
  async handleDisconnect() {
    try {
      await this.walletManager.disconnect();
      this.closeDropdown();
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  }

  // Enhanced state handlers with comprehensive error management
  handleConnecting() {
    this.currentState = 'connecting';
    this.lastError = null;
    this.updateButtonState();
  }

  handleConnected() {
    this.currentState = 'connected';
    this.lastError = null;
    this.updateButtonState();
  }

  handleDisconnected() {
    this.currentState = 'disconnected';
    this.updateButtonState();
    this.closeDropdown();
  }

  handleError(error) {
    this.currentState = 'error';
    this.lastError = error;
    this.updateButtonState();
    this.closeDropdown();
  }

  handleConnectionFailed(data) {
    this.currentState = 'error';
    this.lastError = data.error;
    this.updateButtonState();
    
    // Show retry option if available
    if (data.canRetry && this.options.showRetryOnError) {
      console.log('Connection failed but can retry');
    }
  }

  handleConnectionRetry(data) {
    this.currentState = 'connecting';
    console.log(`Retry attempt ${data.attempt}/${data.maxAttempts}`);
    this.updateButtonState();
  }

  handleAutoReconnectFailed() {
    this.currentState = 'error';
    this.updateButtonState();
  }

  handleWalletLocked() {
    this.currentState = 'error';
    this.lastError = {
      type: 'WALLET_LOCKED',
      title: 'Wallet Locked',
      userMessage: 'Please unlock your Phantom wallet and try again'
    };
    this.updateButtonState();
  }

  /**
   * Update button state based on wallet connection
   */
  updateButtonState() {
    if (!this.element) return;
    
    const variantClasses = this.getVariantClasses();
    this.element.innerHTML = this.getButtonHTML(variantClasses);
    this.setupEventListeners();
  }

  /**
   * Destroy component and cleanup
   */
  destroy() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}

/**
 * WalletNetworkIndicator - Network status and RPC health indicator
 */
export class WalletNetworkIndicator {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      showNetworkName: true,
      showRpcStatus: true,
      showLatency: false,
      autoRefresh: true,
      refreshInterval: 15000, // 15 seconds
      className: '',
      ...options
    };
    
    this.walletManager = getWalletManager();
    this.element = null;
    this.refreshTimer = null;
    
    this.init();
  }

  /**
   * Initialize network indicator
   */
  init() {
    this.render();
    this.updateStatus();
    
    if (this.options.autoRefresh) {
      this.startAutoRefresh();
    }
    
    // Listen for wallet events
    this.walletManager.on('connected', () => this.updateStatus());
    this.walletManager.on('disconnected', () => this.updateStatus());
    this.walletManager.on('healthCheckPassed', () => this.updateStatus());
    this.walletManager.on('healthCheckFailed', () => this.updateStatus());
  }

  /**
   * Render network indicator
   */
  render() {
    this.element = document.createElement('div');
    this.element.className = `wallet-network-indicator ${this.options.className}`;
    
    this.container.appendChild(this.element);
  }

  /**
   * Update network status display
   */
  updateStatus() {
    if (!this.element) return;
    
    const connectionHealth = this.walletManager.getConnectionHealth();
    const walletStatus = this.walletManager.getWalletStatus();
    const { isHealthy, rpcLatency, errorCount, lastCheck } = connectionHealth;
    const { network, isConnected } = walletStatus;
    
    const timeSinceCheck = Date.now() - lastCheck;
    const isStale = timeSinceCheck > 60000; // 1 minute
    
    // Determine network status
    let networkStatus, statusColor, statusText;
    
    if (!isConnected) {
      networkStatus = 'disconnected';
      statusColor = 'text-gray-400';
      statusText = 'Not Connected';
    } else if (isHealthy && !isStale) {
      networkStatus = 'healthy';
      statusColor = 'text-green-400';
      statusText = 'Network Healthy';
    } else if (isStale) {
      networkStatus = 'stale';
      statusColor = 'text-yellow-400';
      statusText = 'Status Unknown';
    } else {
      networkStatus = 'unhealthy';
      statusColor = 'text-red-400';
      statusText = 'Network Issues';
    }
    
    this.element.innerHTML = `
      <div class="flex items-center gap-2 text-sm">
        ${this.options.showNetworkName ? `
          <span class="font-medium text-gray-300">${network || 'Unknown'}</span>
          <div class="w-1 h-4 bg-gray-600 rounded-full"></div>
        ` : ''}
        
        ${this.options.showRpcStatus ? `
          <div class="flex items-center gap-1.5" title="${statusText}">
            <div class="w-2 h-2 rounded-full ${
              networkStatus === 'healthy' ? 'bg-green-400 pulse-glow' :
              networkStatus === 'unhealthy' ? 'bg-red-400 animate-pulse' :
              networkStatus === 'stale' ? 'bg-yellow-400' :
              'bg-gray-400'
            }"></div>
            <span class="${statusColor} text-xs">${statusText}</span>
          </div>
        ` : ''}
        
        ${this.options.showLatency && rpcLatency ? `
          <span class="text-xs text-gray-400">${rpcLatency}ms</span>
        ` : ''}
        
        ${errorCount > 0 ? `
          <div class="flex items-center gap-1 text-xs text-red-400" title="${errorCount} recent errors">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            ${errorCount}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Start auto refresh timer
   */
  startAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    this.refreshTimer = setInterval(() => {
      this.updateStatus();
    }, this.options.refreshInterval);
  }

  /**
   * Stop auto refresh
   */
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Destroy component
   */
  destroy() {
    this.stopAutoRefresh();
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}

/**
 * WalletStatusIndicator - Simple connection status indicator (legacy compatibility)
 */
export class WalletStatusIndicator {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      showText: true,
      showBalance: false,
      size: 'sm', // 'xs', 'sm', 'md', 'lg'
      ...options
    };
    
    this.walletManager = getWalletManager();
    this.element = null;
    
    this.init();
  }

  init() {
    this.render();
    this.updateStatus();
    
    // Listen for wallet state changes
    this.walletManager.on('connected', () => this.updateStatus());
    this.walletManager.on('disconnected', () => this.updateStatus());
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'wallet-status-indicator flex items-center gap-2';
    
    this.container.appendChild(this.element);
  }

  updateStatus() {
    if (!this.element) return;
    
    const connectionInfo = this.walletManager.getConnectionInfo();
    const isConnected = connectionInfo?.isConnected;
    
    const sizeClasses = {
      xs: 'w-1.5 h-1.5',
      sm: 'w-2 h-2',
      md: 'w-3 h-3',
      lg: 'w-4 h-4'
    };
    
    const textSizes = {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg'
    };
    
    const dotSize = sizeClasses[this.options.size] || sizeClasses.sm;
    const textSize = textSizes[this.options.size] || textSizes.sm;
    
    this.element.innerHTML = `
      <div class="${dotSize} rounded-full ${
        isConnected 
          ? 'bg-green-400 pulse-glow' 
          : 'bg-gray-500'
      }"></div>
      ${this.options.showText ? `
        <span class="${textSize} ${
          isConnected ? 'text-green-400' : 'text-gray-500'
        }">
          ${isConnected ? 'Connected' : 'Disconnected'}
        </span>
      ` : ''}
      ${this.options.showBalance && isConnected ? `
        <span class="balance ${textSize} text-gray-400"></span>
      ` : ''}
    `;
    
    if (this.options.showBalance && isConnected) {
      this.updateBalance();
    }
  }

  async updateBalance() {
    const balanceElement = this.element?.querySelector('.balance');
    if (!balanceElement) return;
    
    try {
      const balance = await this.walletManager.getBalance();
      balanceElement.textContent = `${balance.toFixed(4)} SOL`;
    } catch (error) {
      balanceElement.textContent = '-- SOL';
    }
  }

  destroy() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}

// Enhanced CSS styles with Xbox 360 dashboard aesthetic and comprehensive animations
const CSS_STYLES = `
  /* Core Pulse and Glow Effects - Enhanced for Sub-task 1.6 */
  .pulse-glow {
    animation: pulse-glow 2s infinite;
    filter: drop-shadow(0 0 2px rgba(16, 185, 129, 0.6));
  }
  
  @keyframes pulse-glow {
    0%, 100% { 
      box-shadow: 0 0 5px rgba(16, 185, 129, 0.4), 0 0 10px rgba(16, 185, 129, 0.2); 
      filter: drop-shadow(0 0 2px rgba(16, 185, 129, 0.6));
    }
    50% { 
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.8), 0 0 30px rgba(16, 185, 129, 0.4); 
      filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.8));
    }
  }
  
  /* Enhanced Connection State Animations */
  .connecting-pulse {
    animation: connecting-pulse 1.5s ease-in-out infinite;
  }
  
  @keyframes connecting-pulse {
    0%, 100% { 
      opacity: 1;
      transform: scale(1);
    }
    50% { 
      opacity: 0.7;
      transform: scale(1.1);
    }
  }
  
  /* Error State Animation */
  .error-shake {
    animation: error-shake 0.5s ease-in-out;
  }
  
  @keyframes error-shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-2px); }
    75% { transform: translateX(2px); }
  }
  
  /* Rate Limited Warning Animation */
  .rate-limited-warning {
    animation: rate-limited-warning 2s ease-in-out infinite;
  }
  
  @keyframes rate-limited-warning {
    0%, 100% { 
      border-color: rgba(251, 146, 60, 0.3);
    }
    50% { 
      border-color: rgba(251, 146, 60, 0.7);
      box-shadow: 0 0 10px rgba(251, 146, 60, 0.3);
    }
  }
  
  /* Xbox-Style Retro Effects */
  .xbox-glow {
    position: relative;
    overflow: hidden;
  }
  
  .xbox-glow::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(16, 185, 129, 0.1), transparent);
    animation: xbox-sweep 3s infinite;
    pointer-events: none;
  }
  
  @keyframes xbox-sweep {
    0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
    50% { transform: translateX(100%) translateY(100%) rotate(45deg); }
    100% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
  }
  
  /* Enhanced Hover Effects */
  .wallet-address-display:hover {
    transform: scale(1.02) translateY(-1px);
    box-shadow: 0 5px 20px rgba(16, 185, 129, 0.3);
  }
  
  .wallet-connect-button .wallet-btn {
    position: relative;
    overflow: hidden;
  }
  
  .wallet-connect-button .wallet-btn:not(:disabled):hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
  }
  
  .wallet-connect-button .wallet-btn[data-state="error"]:hover {
    box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
  }
  
  /* Hero Variant Special Effects */
  .wallet-btn.hero-variant::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.8s;
  }
  
  .wallet-btn.hero-variant:hover::after {
    left: 100%;
  }
  
  /* Dropdown Animations */
  .wallet-dropdown .dropdown-menu {
    transform-origin: top right;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .wallet-dropdown .dropdown-menu.open {
    animation: dropdown-appear 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  @keyframes dropdown-appear {
    0% {
      opacity: 0;
      transform: scale(0.95) translateY(-10px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  
  /* Status Badge Animations */
  .wallet-status-badge {
    transition: all 0.3s ease;
  }
  
  .wallet-status-badge:hover {
    transform: scale(1.05);
  }
  
  /* Error Display Animations */
  .wallet-error-display:not(.hidden) {
    animation: error-slide-in 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  @keyframes error-slide-in {
    0% {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  /* Loading States */
  .loading-shimmer {
    background: linear-gradient(90deg, #1f2937 25%, #374151 50%, #1f2937 75%);
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }
  
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  
  /* Network Health Indicators */
  .health-indicator {
    display: flex;
    gap: 1px;
  }
  
  .health-bar {
    width: 2px;
    background: #374151;
    border-radius: 1px;
    transition: all 0.3s ease;
  }
  
  .health-bar.active {
    background: #10b981;
    box-shadow: 0 0 4px rgba(16, 185, 129, 0.5);
  }
  
  .health-bar.warning {
    background: #f59e0b;
    box-shadow: 0 0 4px rgba(245, 158, 11, 0.5);
  }
  
  .health-bar.error {
    background: #ef4444;
    box-shadow: 0 0 4px rgba(239, 68, 68, 0.5);
  }
  
  /* Accessibility Improvements */
  @media (prefers-reduced-motion: reduce) {
    .pulse-glow,
    .xbox-glow::before,
    .loading-shimmer {
      animation: none;
    }
    
    .wallet-address-display:hover,
    .wallet-btn:hover {
      transform: none;
    }
  }
  
  /* Focus States for Accessibility */
  .wallet-btn:focus {
    outline: none;
    ring: 2px;
    ring-color: rgba(16, 185, 129, 0.5);
    ring-offset: 2px;
    ring-offset-color: #1f2937;
  }
  
  /* Enhanced Status Indicators - Sub-task 1.6 Features */
  .health-indicators {
    gap: 2px;
    padding: 2px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
  }
  
  .health-indicators:hover {
    background: rgba(0, 0, 0, 0.4);
    transform: scale(1.1);
  }
  
  /* Loading Spinner Container Enhancements */
  .loading-spinner-container {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* Enhanced Button States */
  .wallet-btn[data-state="connecting"] {
    background: linear-gradient(45deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.2));
    border-color: rgba(251, 191, 36, 0.3);
  }
  
  .wallet-btn[data-state="connected"] {
    background: linear-gradient(45deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.2));
    border-color: rgba(16, 185, 129, 0.3);
  }
  
  .wallet-btn[data-state="error"] {
    animation: error-shake 0.5s ease-in-out;
    background: linear-gradient(45deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.2));
    border-color: rgba(239, 68, 68, 0.3);
  }
  
  .wallet-btn[data-state="error"]:hover {
    background: linear-gradient(45deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.3));
  }
  
  /* Progress Indicators */
  .retry-progress-indicator {
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.6), transparent);
    animation: progress-sweep 2s linear infinite;
  }
  
  @keyframes progress-sweep {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  /* Connection Attempt Counter */
  .connection-attempt-counter {
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.9), rgba(245, 158, 11, 0.9));
    border: 1px solid rgba(251, 191, 36, 0.3);
    animation: counter-pulse 1s ease-in-out infinite;
  }
  
  @keyframes counter-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
  
  /* Enhanced Tooltip Styling */
  .wallet-ui-tooltip {
    background: linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(31, 41, 55, 0.95));
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12px;
    line-height: 1.4;
    color: rgba(255, 255, 255, 0.9);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(8px);
    z-index: 1000;
  }
  
  /* High Contrast Mode Support */
  @media (prefers-contrast: high) {
    .wallet-status-badge {
      border: 2px solid currentColor;
    }
    
    .pulse-glow {
      animation: none;
      border: 2px solid #10b981;
    }
    
    .health-indicators > div {
      border: 1px solid currentColor;
    }
  }
`;

// Inject CSS styles
function injectStyles() {
  if (document.getElementById('wallet-ui-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'wallet-ui-styles';
  style.textContent = CSS_STYLES;
  document.head.appendChild(style);
}

// Auto-inject styles when module loads
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectStyles);
  } else {
    injectStyles();
  }
}

/**
 * WalletConnectionFlow - Complete connection flow component
 */
export class WalletConnectionFlow {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      showProgress: true,
      showErrors: true,
      showRetry: true,
      autoConnect: false,
      className: '',
      ...options
    };
    
    this.walletManager = getWalletManager();
    this.element = null;
    this.components = {};
    
    this.init();
  }

  /**
   * Initialize the connection flow
   */
  init() {
    this.render();
    this.setupComponents();
    this.updateFlow();
    
    // Listen for all wallet events
    this.walletManager.on('connecting', () => this.updateFlow());
    this.walletManager.on('connected', () => this.updateFlow());
    this.walletManager.on('disconnected', () => this.updateFlow());
    this.walletManager.on('error', () => this.updateFlow());
    this.walletManager.on('connectionRetry', (data) => this.showRetryProgress(data));
  }

  /**
   * Render the connection flow container
   */
  render() {
    this.element = document.createElement('div');
    this.element.className = `wallet-connection-flow ${this.options.className}`;
    this.element.innerHTML = `
      <div class="flow-content space-y-4">
        <div class="connection-button-container"></div>
        <div class="status-indicator-container"></div>
        <div class="error-display-container"></div>
        <div class="network-indicator-container"></div>
        <div class="progress-container hidden"></div>
      </div>
    `;
    
    this.container.appendChild(this.element);
  }

  /**
   * Setup all component instances
   */
  setupComponents() {
    const buttonContainer = this.element.querySelector('.connection-button-container');
    const statusContainer = this.element.querySelector('.status-indicator-container');
    const errorContainer = this.element.querySelector('.error-display-container');
    const networkContainer = this.element.querySelector('.network-indicator-container');
    
    // Main connection button
    this.components.connectButton = new WalletConnectButton(buttonContainer, {
      variant: 'primary',
      size: 'lg',
      showStatus: true,
      showRetryOnError: true
    });
    
    // Status badge
    this.components.statusBadge = new WalletStatusBadge(statusContainer, {
      showText: true,
      showHealth: true,
      size: 'md'
    });
    
    // Error display
    if (this.options.showErrors) {
      this.components.errorDisplay = new WalletErrorDisplay(errorContainer, {
        showRetryButton: this.options.showRetry,
        showDetailsButton: true,
        autoHide: false
      });
    }
    
    // Network indicator
    this.components.networkIndicator = new WalletNetworkIndicator(networkContainer, {
      showNetworkName: true,
      showRpcStatus: true,
      showLatency: true
    });
  }

  /**
   * Update flow based on current state
   */
  updateFlow() {
    const walletStatus = this.walletManager.getWalletStatus();
    const { isConnected, isConnecting, canConnect } = walletStatus;
    
    // Show/hide components based on state
    const statusContainer = this.element.querySelector('.status-indicator-container');
    const networkContainer = this.element.querySelector('.network-indicator-container');
    
    if (isConnected) {
      statusContainer.classList.remove('hidden');
      networkContainer.classList.remove('hidden');
    } else {
      statusContainer.classList.add('hidden');
      if (!isConnecting) {
        networkContainer.classList.add('hidden');
      }
    }
  }

  /**
   * Show retry progress
   */
  showRetryProgress(data) {
    if (!this.options.showProgress) return;
    
    const progressContainer = this.element.querySelector('.progress-container');
    progressContainer.classList.remove('hidden');
    
    progressContainer.innerHTML = `
      <div class="retry-progress bg-gray-800 border border-gray-600 rounded-lg p-3">
        <div class="flex items-center gap-3">
          <div class="loading-spinner">
            <div class="animate-spin h-5 w-5 border-2 border-green-400 border-t-transparent rounded-full"></div>
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-300">Retrying Connection</p>
            <p class="text-xs text-gray-400">Attempt ${data.attempt} of ${data.maxAttempts}</p>
          </div>
          <div class="retry-progress-bar flex-1 max-w-24">
            <div class="w-full bg-gray-700 rounded-full h-2">
              <div class="bg-green-400 h-2 rounded-full transition-all duration-500" 
                   style="width: ${(data.attempt / data.maxAttempts) * 100}%"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Hide after a delay
    setTimeout(() => {
      progressContainer.classList.add('hidden');
    }, 3000);
  }

  /**
   * Destroy all components
   */
  destroy() {
    Object.values(this.components).forEach(component => {
      if (component && typeof component.destroy === 'function') {
        component.destroy();
      }
    });
    
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}

/**
 * Utility function to create a complete wallet UI with all components
 */
export function createWalletUI(container, options = {}) {
  const {
    layout = 'full', // 'full', 'compact', 'minimal'
    showAddress = true,
    showStatus = true,
    showNetwork = true,
    showErrors = true,
    ...componentOptions
  } = options;
  
  const components = {};
  
  switch (layout) {
    case 'full':
      components.connectionFlow = new WalletConnectionFlow(container, {
        showErrors: showErrors,
        showRetry: true,
        showProgress: true,
        ...componentOptions
      });
      break;
      
    case 'compact':
      // Just button and status
      const compactContainer = document.createElement('div');
      compactContainer.className = 'wallet-ui-compact flex items-center gap-4';
      container.appendChild(compactContainer);
      
      const buttonContainer = document.createElement('div');
      const statusContainer = document.createElement('div');
      compactContainer.appendChild(buttonContainer);
      compactContainer.appendChild(statusContainer);
      
      components.connectButton = new WalletConnectButton(buttonContainer, {
        variant: 'secondary',
        size: 'md',
        ...componentOptions
      });
      
      if (showStatus) {
        components.statusBadge = new WalletStatusBadge(statusContainer, {
          showText: false,
          size: 'sm'
        });
      }
      break;
      
    case 'minimal':
      // Just the connection button
      components.connectButton = new WalletConnectButton(container, {
        variant: 'minimal',
        size: 'sm',
        showStatus: false,
        ...componentOptions
      });
      break;
      
    default:
      throw new Error(`Unknown layout: ${layout}`);
  }
  
  return {
    components,
    destroy: () => {
      Object.values(components).forEach(component => {
        if (component && typeof component.destroy === 'function') {
          component.destroy();
        }
      });
    }
  };
}

// Export utility functions and classes
export {
  injectStyles,
  getWalletManager,
  createWalletUI
};

/**
 * Sub-task 1.6 Implementation Summary and Usage Examples
 * 
 * This enhanced implementation provides comprehensive Phantom wallet status UI components
 * and connection buttons with the following Sub-task 1.6 specific features:
 * 
 * ENHANCED STATUS INDICATORS:
 * - Real-time connection health monitoring with visual indicators
 * - Rate limiting status with warning animations
 * - Connection attempt counters with progress visualization
 * - Network latency display with color-coded performance indicators
 * - Error state categorization with specific icons and tooltips
 * - Retry attempt tracking with exponential backoff visualization
 * 
 * COMPREHENSIVE CONNECTION BUTTON:
 * - Multi-state button with connecting, connected, error, and retry states
 * - Progress indicators for connection attempts
 * - Error-specific icons and user guidance
 * - Rate limiting protection with visual feedback
 * - Accessible tooltips and ARIA labels
 * - Mobile-responsive design with touch-friendly interactions
 * 
 * INTEGRATION WITH SUB-TASK 1.5 ERROR HANDLING:
 * - Full integration with PhantomWalletManager error categorization
 * - User-friendly error messages with actionable guidance
 * - Retry logic with visual feedback
 * - Auto-reconnection status display
 * - Security event handling (account changes, network switches)
 * 
 * USAGE EXAMPLES:
 * 
 * // Basic connection button with status
 * const button = new WalletConnectButton(document.getElementById('wallet-btn'), {
 *   variant: 'primary',
 *   size: 'lg',
 *   showStatus: true,
 *   showRetryOnError: true
 * });
 * 
 * // Status badge with health monitoring
 * const status = new WalletStatusBadge(document.getElementById('wallet-status'), {
 *   showText: true,
 *   showHealth: true,
 *   showLatency: true,
 *   size: 'md'
 * });
 * 
 * // Complete connection flow with all components
 * const flow = new WalletConnectionFlow(document.getElementById('wallet-flow'), {
 *   showProgress: true,
 *   showErrors: true,
 *   showRetry: true
 * });
 * 
 * // Error display with retry functionality
 * const errorDisplay = new WalletErrorDisplay(document.getElementById('error-container'), {
 *   showRetryButton: true,
 *   showDetailsButton: true,
 *   autoHide: false
 * });
 * 
 * // Network health indicator
 * const network = new WalletNetworkIndicator(document.getElementById('network-status'), {
 *   showNetworkName: true,
 *   showRpcStatus: true,
 *   showLatency: true,
 *   autoRefresh: true
 * });
 * 
 * // Utility function for quick setup
 * const ui = createWalletUI(document.getElementById('wallet-container'), {
 *   layout: 'full',          // 'full', 'compact', 'minimal'
 *   showAddress: true,
 *   showStatus: true,
 *   showNetwork: true,
 *   showErrors: true
 * });
 * 
 * ACCESSIBILITY FEATURES:
 * - WCAG 2.1 AA compliant with proper ARIA labels
 * - High contrast mode support
 * - Reduced motion support for accessibility preferences
 * - Keyboard navigation support
 * - Screen reader compatible
 * 
 * VISUAL DESIGN:
 * - Xbox 360 dashboard aesthetic with retro green (#10b981) theme
 * - Smooth animations and transitions
 * - Hover effects and focus states
 * - Loading spinners with connection attempt visualization
 * - Progress bars and status indicators
 * - Error shake animations and warning states
 * 
 * INTEGRATION POINTS:
 * - Event listeners for all wallet state changes
 * - Real-time health monitoring
 * - Session management integration
 * - Security event handling
 * - Analytics event tracking (ready for implementation)
 */