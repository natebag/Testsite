/**
 * MLG.clan Connection Status UI Component
 * Network status indicators and connection health monitoring with gaming aesthetics
 * 
 * @author Claude Code - Frontend Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

class MLGConnectionStatus {
  constructor(options = {}) {
    this.container = null;
    this.statusWidget = null;
    this.isVisible = false;
    this.currentStatus = 'unknown';
    this.currentQuality = 'unknown';
    this.stats = {
      uptime: 0,
      downtime: 0,
      lastDisconnect: null,
      connectionAttempts: 0,
      successfulConnections: 0
    };
    
    // Configuration
    this.config = {
      position: options.position || 'top-right',
      showDetails: options.showDetails !== false,
      autoHide: options.autoHide !== false,
      hideDelay: options.hideDelay || 3000,
      theme: options.theme || 'gaming',
      showStats: options.showStats !== false,
      ...options
    };
    
    // Gaming-themed status messages
    this.statusMessages = {
      excellent: {
        icon: '🎮',
        text: 'Excellent Connection',
        description: 'Gaming at maximum performance!',
        color: '#00ff88',
        ping: '< 50ms'
      },
      good: {
        icon: '⚡',
        text: 'Good Connection',
        description: 'Smooth gaming experience',
        color: '#00cc70',
        ping: '< 100ms'
      },
      fair: {
        icon: '⚠️',
        text: 'Fair Connection',
        description: 'Some lag may occur',
        color: '#ffaa00',
        ping: '< 300ms'
      },
      poor: {
        icon: '🐌',
        text: 'Poor Connection',
        description: 'Expect high latency',
        color: '#ff4444',
        ping: '> 300ms'
      },
      offline: {
        icon: '📴',
        text: 'Offline Mode',
        description: 'Playing in offline mode',
        color: '#666666',
        ping: 'N/A'
      },
      connecting: {
        icon: '🔄',
        text: 'Connecting...',
        description: 'Attempting to reconnect',
        color: '#0099ff',
        ping: '...'
      }
    };

    this.init();
  }

  async init() {
    this.createStatusWidget();
    this.bindEvents();
    this.startMonitoring();
    
    console.log('🎮 MLG Connection Status initialized');
  }

  createStatusWidget() {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'mlg-connection-status';
    this.container.className = `mlg-connection-widget ${this.config.position} ${this.config.theme}`;
    
    // Add styles
    this.injectStyles();
    
    // Create widget HTML
    this.container.innerHTML = `
      <div class="connection-indicator" id="connection-indicator">
        <div class="status-icon">🎮</div>
        <div class="status-info">
          <div class="status-text">Checking Connection...</div>
          <div class="status-details">Initializing...</div>
        </div>
        <div class="expand-btn" id="expand-btn">
          <i class="chevron">▼</i>
        </div>
      </div>
      
      <div class="connection-details" id="connection-details" style="display: none;">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">Ping</div>
            <div class="stat-value" id="ping-value">--ms</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Quality</div>
            <div class="stat-value" id="quality-value">--</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Uptime</div>
            <div class="stat-value" id="uptime-value">--</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Data Usage</div>
            <div class="stat-value" id="data-usage">--KB</div>
          </div>
        </div>
        
        <div class="connection-actions">
          <button class="action-btn test-btn" id="test-connection">
            🎯 Test Connection
          </button>
          <button class="action-btn refresh-btn" id="force-refresh">
            🔄 Refresh
          </button>
          <button class="action-btn stats-btn" id="view-stats">
            📊 Stats
          </button>
        </div>
        
        <div class="offline-features" id="offline-features" style="display: none;">
          <div class="features-title">🎮 Available Offline Features:</div>
          <div class="features-list" id="features-list"></div>
        </div>
      </div>
    `;
    
    // Add to page
    document.body.appendChild(this.container);
    
    // Get references
    this.statusWidget = this.container.querySelector('#connection-indicator');
    this.detailsPanel = this.container.querySelector('#connection-details');
    this.expandBtn = this.container.querySelector('#expand-btn');
    this.offlineFeaturesPanel = this.container.querySelector('#offline-features');
  }

  injectStyles() {
    if (document.getElementById('mlg-connection-status-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'mlg-connection-status-styles';
    styles.textContent = `
      .mlg-connection-widget {
        position: fixed;
        z-index: 9999;
        font-family: 'Segoe UI', system-ui, sans-serif;
        font-size: 13px;
        max-width: 320px;
        background: rgba(26, 26, 46, 0.95);
        border: 2px solid #00ff88;
        border-radius: 12px;
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 32px rgba(0, 255, 136, 0.3);
        transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        color: white;
      }
      
      .mlg-connection-widget.top-right {
        top: 20px;
        right: 20px;
      }
      
      .mlg-connection-widget.top-left {
        top: 20px;
        left: 20px;
      }
      
      .mlg-connection-widget.bottom-right {
        bottom: 20px;
        right: 20px;
      }
      
      .mlg-connection-widget.bottom-left {
        bottom: 20px;
        left: 20px;
      }
      
      .connection-indicator {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .connection-indicator:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      .status-icon {
        font-size: 18px;
        margin-right: 12px;
        min-width: 24px;
        text-align: center;
        animation: pulse 2s infinite;
      }
      
      .status-info {
        flex: 1;
        min-width: 0;
      }
      
      .status-text {
        font-weight: 600;
        margin-bottom: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .status-details {
        font-size: 11px;
        opacity: 0.8;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .expand-btn {
        margin-left: 8px;
        padding: 4px;
        border-radius: 4px;
        transition: transform 0.2s, background 0.2s;
      }
      
      .expand-btn:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      .expand-btn.expanded .chevron {
        transform: rotate(180deg);
      }
      
      .chevron {
        transition: transform 0.2s;
        font-size: 10px;
      }
      
      .connection-details {
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding: 16px;
        animation: slideDown 0.3s ease;
      }
      
      .stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 16px;
      }
      
      .stat-item {
        text-align: center;
        padding: 8px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .stat-label {
        font-size: 10px;
        opacity: 0.7;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .stat-value {
        font-weight: 600;
        font-size: 12px;
      }
      
      .connection-actions {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
      }
      
      .action-btn {
        flex: 1;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        color: white;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
      }
      
      .action-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
      }
      
      .action-btn:active {
        transform: translateY(0);
      }
      
      .offline-features {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        padding: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .features-title {
        font-weight: 600;
        margin-bottom: 8px;
        font-size: 12px;
      }
      
      .features-list {
        font-size: 11px;
        line-height: 1.4;
      }
      
      .feature-item {
        margin-bottom: 4px;
        opacity: 0.9;
      }
      
      .feature-item.disabled {
        opacity: 0.5;
        text-decoration: line-through;
      }
      
      /* Status-specific styles */
      .mlg-connection-widget.status-excellent {
        border-color: #00ff88;
        box-shadow: 0 8px 32px rgba(0, 255, 136, 0.3);
      }
      
      .mlg-connection-widget.status-good {
        border-color: #00cc70;
        box-shadow: 0 8px 32px rgba(0, 204, 112, 0.3);
      }
      
      .mlg-connection-widget.status-fair {
        border-color: #ffaa00;
        box-shadow: 0 8px 32px rgba(255, 170, 0, 0.3);
      }
      
      .mlg-connection-widget.status-poor {
        border-color: #ff4444;
        box-shadow: 0 8px 32px rgba(255, 68, 68, 0.3);
      }
      
      .mlg-connection-widget.status-offline {
        border-color: #666666;
        box-shadow: 0 8px 32px rgba(102, 102, 102, 0.3);
      }
      
      .mlg-connection-widget.status-connecting {
        border-color: #0099ff;
        box-shadow: 0 8px 32px rgba(0, 153, 255, 0.3);
      }
      
      /* Animations */
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      .status-icon.connecting {
        animation: spin 1s linear infinite;
      }
      
      /* Mobile responsiveness */
      @media (max-width: 768px) {
        .mlg-connection-widget {
          max-width: 280px;
          font-size: 12px;
        }
        
        .mlg-connection-widget.top-right,
        .mlg-connection-widget.top-left {
          top: 10px;
        }
        
        .mlg-connection-widget.top-right,
        .mlg-connection-widget.bottom-right {
          right: 10px;
        }
        
        .mlg-connection-widget.top-left,
        .mlg-connection-widget.bottom-left {
          left: 10px;
        }
        
        .mlg-connection-widget.bottom-right,
        .mlg-connection-widget.bottom-left {
          bottom: 10px;
        }
        
        .connection-actions {
          flex-direction: column;
        }
      }
      
      /* Hide widget when not needed */
      .mlg-connection-widget.hidden {
        opacity: 0;
        pointer-events: none;
        transform: scale(0.95);
      }
    `;
    
    document.head.appendChild(styles);
  }

  bindEvents() {
    // Toggle details panel
    this.statusWidget.addEventListener('click', () => {
      this.toggleDetails();
    });
    
    // Action buttons
    this.container.querySelector('#test-connection').addEventListener('click', (e) => {
      e.stopPropagation();
      this.testConnection();
    });
    
    this.container.querySelector('#force-refresh').addEventListener('click', (e) => {
      e.stopPropagation();
      this.forceRefresh();
    });
    
    this.container.querySelector('#view-stats').addEventListener('click', (e) => {
      e.stopPropagation();
      this.showDetailedStats();
    });
    
    // Listen to connection events
    if (window.MLGErrorHandler) {
      window.MLGErrorHandler.addEventListener('connection', (data) => {
        this.updateConnectionStatus(data.isOnline, data.quality);
      });
      
      window.MLGErrorHandler.addEventListener('quality', (quality) => {
        this.updateConnectionQuality(quality);
      });
    }
    
    if (window.MLGOfflineManager) {
      window.MLGOfflineManager.addEventListener('connection', (data) => {
        this.updateConnectionStatus(data.isOnline, data.quality);
        this.updateOfflineFeatures();
      });
    }
  }

  startMonitoring() {
    // Initial status check
    this.updateConnectionStatus(navigator.onLine, 'unknown');
    
    // Auto-hide timer
    if (this.config.autoHide) {
      this.startAutoHideTimer();
    }
    
    // Update uptime counter
    this.startUptimeCounter();
    
    // Periodic status updates
    setInterval(() => {
      this.updateStats();
    }, 5000);
  }

  updateConnectionStatus(isOnline, quality = null) {
    const previousStatus = this.currentStatus;
    this.currentStatus = isOnline ? (quality || 'good') : 'offline';
    this.currentQuality = quality || (isOnline ? 'unknown' : 'offline');
    
    const status = this.statusMessages[this.currentStatus] || this.statusMessages.good;
    
    // Update widget appearance
    this.container.className = `mlg-connection-widget ${this.config.position} ${this.config.theme} status-${this.currentStatus}`;
    
    // Update status display
    const statusIcon = this.container.querySelector('.status-icon');
    const statusText = this.container.querySelector('.status-text');
    const statusDetails = this.container.querySelector('.status-details');
    
    statusIcon.textContent = status.icon;
    statusIcon.className = this.currentStatus === 'connecting' ? 'status-icon connecting' : 'status-icon';
    statusText.textContent = status.text;
    statusDetails.textContent = status.description;
    
    // Update quality display
    const qualityValue = this.container.querySelector('#quality-value');
    if (qualityValue) {
      qualityValue.textContent = status.ping;
    }
    
    // Track connection changes
    if (previousStatus !== this.currentStatus) {
      this.trackConnectionChange(previousStatus, this.currentStatus);
      this.showWidget();
    }
    
    // Update offline features
    if (!isOnline) {
      this.updateOfflineFeatures();
    }
  }

  updateConnectionQuality(quality) {
    this.currentQuality = quality;
    this.updateConnectionStatus(this.currentStatus !== 'offline', quality);
  }

  toggleDetails() {
    const isExpanded = this.detailsPanel.style.display !== 'none';
    
    if (isExpanded) {
      this.detailsPanel.style.display = 'none';
      this.expandBtn.classList.remove('expanded');
    } else {
      this.detailsPanel.style.display = 'block';
      this.expandBtn.classList.add('expanded');
      this.updateDetailedInfo();
    }
  }

  updateDetailedInfo() {
    // Update ping
    const pingValue = this.container.querySelector('#ping-value');
    if (pingValue) {
      const status = this.statusMessages[this.currentStatus];
      pingValue.textContent = status ? status.ping : '--ms';
    }
    
    // Update uptime
    const uptimeValue = this.container.querySelector('#uptime-value');
    if (uptimeValue) {
      uptimeValue.textContent = this.formatUptime(this.stats.uptime);
    }
    
    // Update data usage (mock data)
    const dataUsage = this.container.querySelector('#data-usage');
    if (dataUsage) {
      const usage = Math.floor(Math.random() * 500) + 100;
      dataUsage.textContent = `${usage}KB`;
    }
  }

  updateOfflineFeatures() {
    if (!window.MLGOfflineManager) return;
    
    const features = window.MLGOfflineManager.getAvailableFeatures();
    const featuresPanel = this.offlineFeaturesPanel;
    const featuresList = this.container.querySelector('#features-list');
    
    if (this.currentStatus === 'offline' && features.length > 0) {
      featuresPanel.style.display = 'block';
      
      featuresList.innerHTML = features.map(feature => 
        `<div class="feature-item ${feature.available ? '' : 'disabled'}">
          ${feature.name}
        </div>`
      ).join('');
    } else {
      featuresPanel.style.display = 'none';
    }
  }

  async testConnection() {
    this.updateConnectionStatus(true, 'connecting');
    
    const testBtn = this.container.querySelector('#test-connection');
    const originalText = testBtn.textContent;
    testBtn.textContent = '🔄 Testing...';
    testBtn.disabled = true;
    
    try {
      const start = Date.now();
      const response = await fetch('/api/system/ping', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      const latency = Date.now() - start;
      const quality = this.getQualityFromLatency(latency);
      
      this.updateConnectionStatus(response.ok, quality);
      
      if (window.MLGErrorHandler) {
        window.MLGErrorHandler.createNotification({
          type: 'success',
          title: '🎯 Connection Test Complete',
          message: `Ping: ${latency}ms - ${quality.toUpperCase()}`,
          icon: '📊'
        });
      }
      
    } catch (error) {
      this.updateConnectionStatus(false, 'offline');
      
      if (window.MLGErrorHandler) {
        window.MLGErrorHandler.createNotification({
          type: 'error',
          title: '❌ Connection Test Failed',
          message: 'Unable to reach servers',
          icon: '🔌'
        });
      }
    } finally {
      testBtn.textContent = originalText;
      testBtn.disabled = false;
    }
  }

  forceRefresh() {
    if (window.MLGApiClient) {
      window.MLGApiClient.clearCache();
    }
    
    if (window.MLGOfflineManager) {
      window.MLGOfflineManager.scheduleSync();
    }
    
    if (window.MLGErrorHandler) {
      window.MLGErrorHandler.createNotification({
        type: 'info',
        title: '🔄 Refresh Complete',
        message: 'Cache cleared and sync initiated',
        icon: '♻️'
      });
    }
  }

  showDetailedStats() {
    const stats = {
      ...this.stats,
      currentStatus: this.currentStatus,
      currentQuality: this.currentQuality,
      uptime: this.formatUptime(this.stats.uptime),
      successRate: this.stats.connectionAttempts > 0 
        ? Math.round((this.stats.successfulConnections / this.stats.connectionAttempts) * 100)
        : 0
    };
    
    if (window.MLGErrorHandler) {
      window.MLGErrorHandler.createNotification({
        type: 'info',
        title: '📊 Connection Statistics',
        message: `Uptime: ${stats.uptime} | Success Rate: ${stats.successRate}%`,
        icon: '📈',
        duration: 6000
      });
    }
    
    console.log('🎮 MLG Connection Stats:', stats);
  }

  getQualityFromLatency(latency) {
    if (latency < 50) return 'excellent';
    if (latency < 100) return 'good';
    if (latency < 300) return 'fair';
    return 'poor';
  }

  trackConnectionChange(from, to) {
    this.stats.connectionAttempts++;
    
    if (to !== 'offline' && to !== 'connecting') {
      this.stats.successfulConnections++;
    }
    
    if (to === 'offline') {
      this.stats.lastDisconnect = new Date();
    }
  }

  formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  startUptimeCounter() {
    setInterval(() => {
      if (this.currentStatus !== 'offline') {
        this.stats.uptime++;
      } else {
        this.stats.downtime++;
      }
    }, 1000);
  }

  startAutoHideTimer() {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }
    
    this.hideTimer = setTimeout(() => {
      if (this.currentStatus === 'excellent' || this.currentStatus === 'good') {
        this.hideWidget();
      }
    }, this.config.hideDelay);
  }

  updateStats() {
    if (this.detailsPanel.style.display !== 'none') {
      this.updateDetailedInfo();
    }
  }

  showWidget() {
    this.container.classList.remove('hidden');
    this.isVisible = true;
    
    if (this.config.autoHide) {
      this.startAutoHideTimer();
    }
  }

  hideWidget() {
    if (this.detailsPanel.style.display !== 'none') return; // Keep visible if details are open
    
    this.container.classList.add('hidden');
    this.isVisible = false;
  }

  // Public API
  setPosition(position) {
    this.config.position = position;
    this.container.className = `mlg-connection-widget ${position} ${this.config.theme} status-${this.currentStatus}`;
  }

  setTheme(theme) {
    this.config.theme = theme;
    this.container.className = `mlg-connection-widget ${this.config.position} ${theme} status-${this.currentStatus}`;
  }

  show() {
    this.showWidget();
  }

  hide() {
    this.hideWidget();
  }

  destroy() {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }
    
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    const styles = document.getElementById('mlg-connection-status-styles');
    if (styles) {
      styles.parentNode.removeChild(styles);
    }
  }

  getStatus() {
    return {
      isVisible: this.isVisible,
      currentStatus: this.currentStatus,
      currentQuality: this.currentQuality,
      stats: { ...this.stats }
    };
  }
}

// Create global instance
window.MLGConnectionStatus = new MLGConnectionStatus();

// Export for ES6 modules
export default MLGConnectionStatus;
export { MLGConnectionStatus };