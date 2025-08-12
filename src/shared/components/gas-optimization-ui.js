/**
 * Gas Optimization UI Component
 * 
 * User-facing interface for displaying transaction fee estimates,
 * gas optimization options, and network status for MLG.clan gaming operations.
 * 
 * Features:
 * - Real-time fee estimation display
 * - Network congestion status indicator
 * - Transaction batching options
 * - Gaming-specific cost breakdowns
 * - User balance and affordability checks
 * - Optimization recommendations
 * 
 * @author Claude Code - Solana Web3 Security Architect
 * @version 1.0.0
 */

import { getFeeEstimator } from '../../features/web3/fee-estimation.js';
import { getTransactionBatcher } from '../../features/web3/transaction-batching.js';
import { getGasOptimizer, TRANSACTION_PRIORITIES, CONGESTION_LEVELS } from '../../features/web3/gas-optimization.js';

/**
 * Gas Optimization UI Configuration
 */
export const GAS_UI_CONFIG = {
  // Display settings
  AUTO_UPDATE_INTERVAL: 10_000, // 10 seconds
  ANIMATION_DURATION: 300,
  
  // Color schemes for different fee levels
  FEE_COLORS: {
    VERY_LOW: '#10b981', // Green
    LOW: '#3b82f6',      // Blue
    MEDIUM: '#f59e0b',   // Yellow
    HIGH: '#ef4444',     // Red
    VERY_HIGH: '#dc2626' // Dark red
  },
  
  // Congestion level indicators
  CONGESTION_COLORS: {
    [CONGESTION_LEVELS.LOW]: '#10b981',
    [CONGESTION_LEVELS.MEDIUM]: '#f59e0b',
    [CONGESTION_LEVELS.HIGH]: '#ef4444',
    [CONGESTION_LEVELS.EXTREME]: '#dc2626'
  },
  
  // Gaming mode indicators
  GAMING_MODE_ICONS: {
    CASUAL: '🎮',
    TOURNAMENT: '🏆',
    CLAN_BATTLE: '⚔️',
    VOTING_RUSH: '🗳️'
  }
};

/**
 * Gas Optimization UI Manager
 */
export class GasOptimizationUI {
  constructor() {
    this.feeEstimator = getFeeEstimator();
    this.transactionBatcher = getTransactionBatcher();
    this.gasOptimizer = getGasOptimizer();
    
    // UI state
    this.currentEstimation = null;
    this.isVisible = false;
    this.updateInterval = null;
    this.container = null;
    
    // User preferences
    this.preferences = {
      currency: 'SOL', // SOL, USD, MLG
      showTechnicalDetails: false,
      enableBatching: true,
      autoUpdate: true
    };
    
    this.loadUserPreferences();
    
    console.log('🖥️ Gas Optimization UI initialized');
  }

  /**
   * Create and display fee estimation widget
   */
  async createFeeWidget(operation, options = {}) {
    const {
      targetElement = null,
      inline = false,
      showBatchingOption = true,
      showOptimizationTips = true,
      userBalance = null
    } = options;
    
    try {
      // Get fee estimation
      const estimation = await this.feeEstimator.estimateGamingOperation(operation, {
        ...options,
        userBalance,
        includePriceFeeds: true
      });
      
      this.currentEstimation = estimation;
      
      // Create widget HTML
      const widgetHTML = this.createFeeWidgetHTML(estimation, options);
      
      // Create or update widget
      if (targetElement) {
        if (inline) {
          targetElement.innerHTML = widgetHTML;
        } else {
          const widget = this.createWidgetContainer(widgetHTML);
          targetElement.appendChild(widget);
        }
      } else {
        // Create floating widget
        this.createFloatingWidget(widgetHTML);
      }
      
      // Attach event listeners
      this.attachWidgetEventListeners();
      
      // Start auto-update if enabled
      if (this.preferences.autoUpdate) {
        this.startAutoUpdate(operation, options);
      }
      
      console.log('💰 Fee widget created for operation:', operation);
      
      return {
        estimation,
        widgetHTML,
        element: this.container
      };
      
    } catch (error) {
      console.error('❌ Failed to create fee widget:', error);
      throw error;
    }
  }

  /**
   * Create fee widget HTML
   */
  createFeeWidgetHTML(estimation, options = {}) {
    const { showBatchingOption = true, showOptimizationTips = true, userBalance = null } = options;
    
    const feeColor = GAS_UI_CONFIG.FEE_COLORS[estimation.category.level];
    const congestionColor = GAS_UI_CONFIG.CONGESTION_COLORS[estimation.networkState.congestion];
    const formattedFee = this.formatFeeDisplay(estimation);
    
    return `
      <div class="gas-optimization-widget bg-gaming-surface border border-gaming-accent rounded-lg p-4 max-w-md">
        <!-- Header -->
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-gaming-accent font-bold flex items-center">
            ⛽ Transaction Fee
            ${estimation.networkState.isHighTraffic ? '<span class="ml-2 text-red-400" title="High network traffic">⚠️</span>' : ''}
          </h3>
          <div class="flex items-center space-x-2">
            <div class="network-status" data-congestion="${estimation.networkState.congestion}">
              <div class="w-2 h-2 rounded-full" style="background-color: ${congestionColor}"></div>
              <span class="text-xs text-gray-400 ml-1">${estimation.networkState.congestion}</span>
            </div>
            <button class="text-gray-400 hover:text-white text-sm" onclick="this.closest('.gas-optimization-widget').classList.toggle('expanded')">
              ⚙️
            </button>
          </div>
        </div>
        
        <!-- Main Fee Display -->
        <div class="fee-display mb-4">
          <div class="flex items-center justify-between">
            <div class="fee-amount">
              <span class="text-2xl font-bold" style="color: ${feeColor}">${formattedFee}</span>
              <div class="text-sm text-gray-400">
                ${estimation.category.label} Fee
              </div>
            </div>
            <div class="currency-selector">
              <select class="bg-gaming-dark border border-gaming-accent rounded px-2 py-1 text-sm" 
                      onchange="window.gasOptimizationUI.changeCurrency(this.value)">
                <option value="SOL" ${this.preferences.currency === 'SOL' ? 'selected' : ''}>SOL</option>
                <option value="USD" ${this.preferences.currency === 'USD' ? 'selected' : ''}>USD</option>
                <option value="MLG" ${this.preferences.currency === 'MLG' ? 'selected' : ''}>MLG</option>
              </select>
            </div>
          </div>
          
          <!-- Fee Breakdown -->
          <div class="fee-breakdown mt-2 text-sm text-gray-400">
            <div class="flex justify-between">
              <span>Base Fee:</span>
              <span>${this.formatFee(estimation.fees.baseFee, this.preferences.currency, estimation)}</span>
            </div>
            <div class="flex justify-between">
              <span>Compute Fee:</span>
              <span>${this.formatFee(estimation.fees.computeFee, this.preferences.currency, estimation)}</span>
            </div>
            <div class="border-t border-gray-600 my-1"></div>
            <div class="flex justify-between font-semibold">
              <span>Total:</span>
              <span>${formattedFee}</span>
            </div>
          </div>
        </div>
        
        <!-- Warnings -->
        ${estimation.warnings && estimation.warnings.length > 0 ? `
          <div class="warnings mb-3">
            ${estimation.warnings.map(warning => `
              <div class="warning-item flex items-start space-x-2 text-sm mb-2">
                <span class="text-yellow-400">⚠️</span>
                <span class="text-gray-300">${warning.message}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        <!-- Batching Option -->
        ${showBatchingOption && this.preferences.enableBatching ? `
          <div class="batching-option mb-3">
            <div class="flex items-center justify-between p-2 bg-gaming-dark rounded border">
              <div class="flex items-center space-x-2">
                <span class="text-blue-400">📦</span>
                <div>
                  <div class="text-sm font-medium">Enable Batching</div>
                  <div class="text-xs text-gray-400">Group transactions to save fees</div>
                </div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" class="batch-toggle" checked>
                <span class="slider"></span>
              </label>
            </div>
          </div>
        ` : ''}
        
        <!-- Expandable Details -->
        <div class="expandable-details hidden">
          <!-- Technical Details -->
          <div class="technical-details mb-3 p-3 bg-gaming-dark rounded text-sm">
            <h4 class="font-semibold mb-2">Technical Details</h4>
            <div class="space-y-1">
              <div class="flex justify-between">
                <span>Compute Units:</span>
                <span>${estimation.computeUnits?.toLocaleString() || 'N/A'}</span>
              </div>
              <div class="flex justify-between">
                <span>Priority Fee:</span>
                <span>${estimation.priorityFee} μ-lamports/CU</span>
              </div>
              <div class="flex justify-between">
                <span>Network:</span>
                <span class="capitalize">${estimation.networkState.congestion}</span>
              </div>
            </div>
          </div>
          
          <!-- Optimization Tips -->
          ${showOptimizationTips && estimation.recommendations ? `
            <div class="optimization-tips">
              <h4 class="font-semibold mb-2 text-gaming-accent">💡 Optimization Tips</h4>
              ${estimation.recommendations.map(rec => `
                <div class="tip-item flex items-start space-x-2 text-sm mb-2">
                  <span class="text-gaming-accent">•</span>
                  <span class="text-gray-300">${rec.message}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
        
        <!-- Action Buttons -->
        <div class="action-buttons flex space-x-2 mt-4">
          <button class="flex-1 bg-gaming-accent hover:bg-green-400 text-black px-4 py-2 rounded font-bold transition-colors"
                  onclick="window.gasOptimizationUI.confirmTransaction()">
            Proceed
          </button>
          <button class="px-4 py-2 border border-gaming-accent text-gaming-accent hover:bg-gaming-accent hover:text-black rounded transition-colors"
                  onclick="window.gasOptimizationUI.optimizeSettings()">
            Optimize
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Create floating widget container
   */
  createFloatingWidget(widgetHTML) {
    // Remove existing floating widget
    const existing = document.querySelector('.floating-gas-widget');
    if (existing) existing.remove();
    
    const container = document.createElement('div');
    container.className = 'floating-gas-widget fixed top-4 right-4 z-50 transition-transform transform';
    container.innerHTML = widgetHTML;
    
    document.body.appendChild(container);
    this.container = container;
    
    // Animate in
    setTimeout(() => {
      container.classList.remove('translate-x-full');
    }, 100);
    
    this.isVisible = true;
  }

  /**
   * Create widget container for inline placement
   */
  createWidgetContainer(widgetHTML) {
    const container = document.createElement('div');
    container.className = 'gas-widget-container';
    container.innerHTML = widgetHTML;
    
    this.container = container;
    return container;
  }

  /**
   * Attach event listeners to widget elements
   */
  attachWidgetEventListeners() {
    if (!this.container) return;
    
    // Expandable details toggle
    const widget = this.container.querySelector('.gas-optimization-widget');
    if (widget) {
      const expandButton = widget.querySelector('[onclick*="expanded"]');
      if (expandButton) {
        expandButton.onclick = () => {
          const details = widget.querySelector('.expandable-details');
          if (details) {
            details.classList.toggle('hidden');
            widget.classList.toggle('expanded');
          }
        };
      }
      
      // Batch toggle
      const batchToggle = widget.querySelector('.batch-toggle');
      if (batchToggle) {
        batchToggle.onchange = (e) => {
          this.preferences.enableBatching = e.target.checked;
          this.saveUserPreferences();
          console.log(`🎛️ Batching ${e.target.checked ? 'enabled' : 'disabled'}`);
        };
      }
    }
  }

  /**
   * Change currency display
   */
  async changeCurrency(currency) {
    this.preferences.currency = currency;
    this.saveUserPreferences();
    
    // Update current display
    if (this.currentEstimation && this.container) {
      await this.updateFeeDisplay();
    }
    
    console.log(`💱 Currency changed to: ${currency}`);
  }

  /**
   * Update fee display with current estimation
   */
  async updateFeeDisplay() {
    if (!this.currentEstimation || !this.container) return;
    
    const feeAmountElement = this.container.querySelector('.fee-amount span');
    const breakdownElements = this.container.querySelectorAll('.fee-breakdown span:last-child');
    
    if (feeAmountElement) {
      const formattedFee = this.formatFeeDisplay(this.currentEstimation);
      feeAmountElement.textContent = formattedFee;
    }
    
    // Update breakdown
    if (breakdownElements.length >= 3) {
      breakdownElements[0].textContent = this.formatFee(this.currentEstimation.fees.baseFee, this.preferences.currency, this.currentEstimation);
      breakdownElements[1].textContent = this.formatFee(this.currentEstimation.fees.computeFee, this.preferences.currency, this.currentEstimation);
      breakdownElements[2].textContent = this.formatFeeDisplay(this.currentEstimation);
    }
  }

  /**
   * Format fee for display based on currency preference
   */
  formatFeeDisplay(estimation) {
    return this.formatFee(estimation.fees.totalSOL, this.preferences.currency, estimation);
  }

  /**
   * Format individual fee amount
   */
  formatFee(solAmount, currency, estimation) {
    switch (currency) {
      case 'SOL':
        return `${solAmount.toFixed(6)} SOL`;
      case 'USD':
        return estimation.prices ? `$${estimation.prices.USD.toFixed(2)}` : 'N/A';
      case 'MLG':
        return estimation.prices ? `${estimation.prices.MLG.toLocaleString()} MLG` : 'N/A';
      default:
        return `${solAmount.toFixed(6)} SOL`;
    }
  }

  /**
   * Start auto-update of fee information
   */
  startAutoUpdate(operation, options) {
    this.stopAutoUpdate();
    
    this.updateInterval = setInterval(async () => {
      try {
        const updatedEstimation = await this.feeEstimator.estimateGamingOperation(operation, {
          ...options,
          includePriceFeeds: true
        });
        
        // Check if fees have changed significantly
        const feeChange = Math.abs(updatedEstimation.fees.totalSOL - this.currentEstimation.fees.totalSOL);
        const percentChange = (feeChange / this.currentEstimation.fees.totalSOL) * 100;
        
        if (percentChange > 10) {
          console.log(`💰 Fee update: ${percentChange.toFixed(1)}% change detected`);
          this.currentEstimation = updatedEstimation;
          await this.updateFeeDisplay();
          
          // Show notification for significant changes
          this.showFeeChangeNotification(percentChange, updatedEstimation.fees.totalSOL > this.currentEstimation.fees.totalSOL);
        }
        
      } catch (error) {
        console.warn('⚠️ Auto-update failed:', error);
      }
    }, GAS_UI_CONFIG.AUTO_UPDATE_INTERVAL);
  }

  /**
   * Stop auto-update
   */
  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Show fee change notification
   */
  showFeeChangeNotification(percentChange, isIncrease) {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 left-4 bg-gaming-surface border border-gaming-accent rounded-lg p-3 z-50 transition-transform transform translate-x-full max-w-sm`;
    
    const icon = isIncrease ? '📈' : '📉';
    const color = isIncrease ? 'text-red-400' : 'text-green-400';
    const direction = isIncrease ? 'increased' : 'decreased';
    
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="text-xl">${icon}</span>
        <div>
          <div class="font-semibold ${color}">
            Fee ${direction} by ${percentChange.toFixed(1)}%
          </div>
          <div class="text-sm text-gray-400">
            Network conditions changed
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 100);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }

  /**
   * Confirm transaction with current settings
   */
  confirmTransaction() {
    if (!this.currentEstimation) return;
    
    // Dispatch confirmation event
    window.dispatchEvent(new CustomEvent('gas-optimization-confirm', {
      detail: {
        estimation: this.currentEstimation,
        preferences: this.preferences
      }
    }));
    
    console.log('✅ Transaction confirmed with gas optimization');
    this.hideWidget();
  }

  /**
   * Open optimization settings
   */
  optimizeSettings() {
    // Create settings modal
    const modal = this.createSettingsModal();
    document.body.appendChild(modal);
    
    // Animate in
    setTimeout(() => {
      modal.classList.remove('opacity-0');
    }, 100);
  }

  /**
   * Create optimization settings modal
   */
  createSettingsModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 opacity-0 transition-opacity';
    
    modal.innerHTML = `
      <div class="bg-gaming-surface rounded-lg p-6 max-w-md mx-4 border border-gaming-accent">
        <h2 class="text-xl font-bold text-gaming-accent mb-4">⚙️ Gas Optimization Settings</h2>
        
        <div class="space-y-4">
          <!-- Currency Preference -->
          <div>
            <label class="block text-sm font-medium mb-2">Display Currency</label>
            <select class="w-full bg-gaming-dark border border-gaming-accent rounded px-3 py-2" 
                    value="${this.preferences.currency}" onchange="this.updateCurrency(this.value)">
              <option value="SOL">SOL (Solana)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="MLG">MLG (Gaming Token)</option>
            </select>
          </div>
          
          <!-- Batching -->
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">Enable Batching</div>
              <div class="text-sm text-gray-400">Group transactions for better fees</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" ${this.preferences.enableBatching ? 'checked' : ''} 
                     onchange="this.toggleBatching(this.checked)">
              <span class="slider"></span>
            </label>
          </div>
          
          <!-- Auto Updates -->
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">Auto Update Fees</div>
              <div class="text-sm text-gray-400">Refresh fees automatically</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" ${this.preferences.autoUpdate ? 'checked' : ''}
                     onchange="this.toggleAutoUpdate(this.checked)">
              <span class="slider"></span>
            </label>
          </div>
          
          <!-- Technical Details -->
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">Show Technical Details</div>
              <div class="text-sm text-gray-400">Display compute units, etc.</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" ${this.preferences.showTechnicalDetails ? 'checked' : ''}
                     onchange="this.toggleTechnicalDetails(this.checked)">
              <span class="slider"></span>
            </label>
          </div>
        </div>
        
        <div class="flex space-x-3 mt-6">
          <button class="flex-1 bg-gaming-accent hover:bg-green-400 text-black px-4 py-2 rounded font-bold transition-colors"
                  onclick="this.closeModal()">
            Save Settings
          </button>
          <button class="px-4 py-2 border border-gaming-accent text-gaming-accent hover:bg-gaming-accent hover:text-black rounded transition-colors"
                  onclick="this.closeModal()">
            Cancel
          </button>
        </div>
      </div>
    `;
    
    // Add close functionality
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.classList.add('opacity-0');
        setTimeout(() => {
          if (document.body.contains(modal)) {
            document.body.removeChild(modal);
          }
        }, 300);
      }
    };
    
    return modal;
  }

  /**
   * Hide the gas optimization widget
   */
  hideWidget() {
    if (this.container) {
      this.container.classList.add('translate-x-full');
      setTimeout(() => {
        if (document.body.contains(this.container)) {
          document.body.removeChild(this.container);
        }
        this.container = null;
        this.isVisible = false;
      }, 300);
    }
    
    this.stopAutoUpdate();
  }

  /**
   * Load user preferences from storage
   */
  loadUserPreferences() {
    try {
      const stored = localStorage.getItem('mlg_gas_ui_preferences');
      if (stored) {
        this.preferences = { ...this.preferences, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('⚠️ Failed to load gas UI preferences:', error);
    }
  }

  /**
   * Save user preferences to storage
   */
  saveUserPreferences() {
    try {
      localStorage.setItem('mlg_gas_ui_preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.warn('⚠️ Failed to save gas UI preferences:', error);
    }
  }

  /**
   * Create batch status indicator
   */
  createBatchStatusIndicator() {
    const stats = this.transactionBatcher.getBatchStatistics();
    
    if (stats.currentQueues && Object.values(stats.currentQueues).some(queue => queue.count > 0)) {
      return `
        <div class="batch-status-indicator fixed bottom-4 right-4 bg-gaming-surface border border-gaming-accent rounded-lg p-3 z-40">
          <div class="flex items-center space-x-2 mb-2">
            <span class="text-blue-400">📦</span>
            <span class="font-semibold">Batch Queue</span>
          </div>
          ${Object.entries(stats.currentQueues).map(([type, queue]) => 
            queue.count > 0 ? `
              <div class="text-sm text-gray-300">
                ${type}: ${queue.count} pending
              </div>
            ` : ''
          ).join('')}
        </div>
      `;
    }
    
    return '';
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stopAutoUpdate();
    
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    
    console.log('🧹 Gas Optimization UI cleaned up');
  }
}

// CSS Styles for Gas Optimization UI
const gasUIStyles = `
  .gas-optimization-widget {
    animation: slideIn 0.3s ease-out;
  }
  
  .gas-optimization-widget.expanded .expandable-details {
    display: block !important;
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
  }
  
  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .toggle-switch .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #374151;
    transition: .4s;
    border-radius: 24px;
  }
  
  .toggle-switch .slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
  
  .toggle-switch input:checked + .slider {
    background-color: #10b981;
  }
  
  .toggle-switch input:checked + .slider:before {
    transform: translateX(20px);
  }
  
  .fee-display {
    animation: fadeIn 0.5s ease-in;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .warning-item {
    animation: slideInLeft 0.3s ease-out;
  }
  
  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = gasUIStyles;
document.head.appendChild(styleSheet);

/**
 * Global gas optimization UI instance
 */
let gasOptimizationUIInstance = null;

/**
 * Get or create gas optimization UI instance
 */
export function getGasOptimizationUI() {
  if (!gasOptimizationUIInstance) {
    gasOptimizationUIInstance = new GasOptimizationUI();
  }
  return gasOptimizationUIInstance;
}

/**
 * Initialize gas optimization UI
 */
export async function initializeGasOptimizationUI() {
  try {
    const ui = getGasOptimizationUI();
    
    // Make available globally
    window.gasOptimizationUI = ui;
    window.MLGGasOptimizationUI = ui;
    
    console.log('✅ Gas Optimization UI ready globally');
    return ui;
    
  } catch (error) {
    console.error('❌ Failed to initialize gas optimization UI:', error);
    throw error;
  }
}

export default GasOptimizationUI;