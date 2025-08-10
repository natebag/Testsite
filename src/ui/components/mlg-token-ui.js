/**
 * MLG Token UI Components - Sub-task 2.7
 * 
 * Production-ready UI components for MLG SPL token display and interaction
 * with Xbox 360 dashboard aesthetic following MLG.clan design patterns.
 * 
 * Features:
 * - Real-time MLG token balance display with formatting
 * - Burn-to-vote interface with progressive pricing (1,2,3,4 MLG per vote)
 * - Transaction history display with filtering and search
 * - Daily earning progress indicators and statistics
 * - Balance validation warnings and fee estimation displays
 * - Mobile-responsive design with Xbox green theme (#10b981)
 * - Integration with PhantomWalletManager and MLG token systems
 * - Loading states, error handling, and success animations
 * - Production-quality Tailwind CSS styling
 */

import { MLGTokenManager } from '../../tokens/spl-mlg-token.js';
import { getWalletManager } from '../../wallet/phantom-wallet.js';

/**
 * MLG Token Balance Display Component
 * Real-time balance display with Xbox styling
 */
export class MLGTokenBalanceDisplay {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      showIcon: true,
      showBalance: true,
      showUSD: false,
      animated: true,
      size: 'md', // sm, md, lg
      showEarnings: false,
      ...options
    };
    
    this.tokenManager = new MLGTokenManager();
    this.walletManager = getWalletManager();
    this.element = null;
    this.currentBalance = 0;
    this.isLoading = true;
    this.error = null;
    this.animationFrame = null;
    
    this.init();
  }

  async init() {
    this.render();
    this.setupEventListeners();
    await this.updateBalance();
    
    // Listen for wallet changes
    this.walletManager.on('connected', () => this.updateBalance());
    this.walletManager.on('disconnected', () => this.clearBalance());
    
    // Listen for token events
    this.tokenManager.addEventListener('balance_updated', (event) => {
      if (event.detail.walletAddress === this.walletManager.getPublicKey()?.toString()) {
        this.handleBalanceUpdate(event.detail.balance);
      }
    });
  }

  render() {
    const sizeClasses = {
      sm: 'text-sm px-2 py-1',
      md: 'text-base px-3 py-2',
      lg: 'text-lg px-4 py-3'
    };

    const baseClasses = `
      mlg-balance-display
      flex items-center gap-2
      bg-gradient-to-r from-gray-900 to-black
      border border-green-500/30
      rounded-lg
      transition-all duration-300 ease-in-out
      hover:border-green-500/50
      hover:shadow-lg hover:shadow-green-500/20
      ${sizeClasses[this.options.size]}
    `.trim().replace(/\s+/g, ' ');

    this.element = document.createElement('div');
    this.element.className = baseClasses;
    this.element.innerHTML = this.getBalanceHTML();
    
    this.container.appendChild(this.element);
  }

  getBalanceHTML() {
    if (this.isLoading) {
      return `
        <div class="flex items-center gap-2">
          ${this.options.showIcon ? this.getTokenIcon() : ''}
          <div class="animate-pulse">
            <div class="h-4 bg-gray-600 rounded w-16"></div>
          </div>
          <span class="text-gray-400 text-sm">Loading...</span>
        </div>
      `;
    }

    if (this.error) {
      return `
        <div class="flex items-center gap-2 text-red-400">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          <span class="text-sm">Error loading balance</span>
        </div>
      `;
    }

    return `
      <div class="flex items-center gap-2">
        ${this.options.showIcon ? this.getTokenIcon() : ''}
        <div class="flex flex-col">
          <div class="flex items-center gap-1">
            <span class="font-mono text-green-400 font-semibold">
              ${this.formatBalance(this.currentBalance)}
            </span>
            <span class="text-green-300 text-sm font-medium">MLG</span>
          </div>
          ${this.options.showUSD ? `
            <span class="text-gray-400 text-xs">
              ≈ $${this.formatUSD(this.currentBalance)}
            </span>
          ` : ''}
          ${this.options.showEarnings ? this.getEarningsHTML() : ''}
        </div>
        <div class="mlg-balance-glow absolute inset-0 rounded-lg bg-green-500/10 opacity-0 transition-opacity duration-300"></div>
      </div>
    `;
  }

  getTokenIcon() {
    return `
      <div class="relative">
        <div class="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
          <span class="text-white font-bold text-sm">M</span>
        </div>
        <div class="absolute inset-0 bg-green-500/20 rounded-full animate-pulse"></div>
      </div>
    `;
  }

  getEarningsHTML() {
    // Placeholder for earnings data - would integrate with earning system
    return `
      <div class="text-xs text-gray-500">
        +12.5 MLG today
      </div>
    `;
  }

  formatBalance(balance) {
    if (balance >= 1000000) {
      return (balance / 1000000).toFixed(1) + 'M';
    }
    if (balance >= 1000) {
      return (balance / 1000).toFixed(1) + 'K';
    }
    return balance.toLocaleString('en-US', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 2 
    });
  }

  formatUSD(balance) {
    // Placeholder USD conversion - would integrate with price API
    const mlgPrice = 0.0234; // Example price
    return (balance * mlgPrice).toFixed(2);
  }

  async updateBalance() {
    const publicKey = this.walletManager.getPublicKey();
    if (!publicKey) {
      this.clearBalance();
      return;
    }

    try {
      this.isLoading = true;
      this.error = null;
      this.updateDisplay();

      const balance = await this.tokenManager.getTokenBalance(publicKey.toString());
      this.handleBalanceUpdate(balance);
    } catch (error) {
      console.error('Failed to update MLG token balance:', error);
      this.error = error.message;
      this.isLoading = false;
      this.updateDisplay();
    }
  }

  handleBalanceUpdate(balance) {
    const oldBalance = this.currentBalance;
    this.currentBalance = balance;
    this.isLoading = false;
    this.error = null;
    
    if (this.options.animated && oldBalance !== balance) {
      this.animateBalanceChange(oldBalance, balance);
    } else {
      this.updateDisplay();
    }
  }

  animateBalanceChange(from, to) {
    const duration = 1000;
    const startTime = Date.now();
    const diff = to - from;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      this.currentBalance = from + (diff * easeOut);
      this.updateDisplay();

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.currentBalance = to;
        this.updateDisplay();
        this.showBalanceGlow();
      }
    };

    animate();
  }

  showBalanceGlow() {
    const glow = this.element.querySelector('.mlg-balance-glow');
    if (glow) {
      glow.style.opacity = '1';
      setTimeout(() => {
        glow.style.opacity = '0';
      }, 1000);
    }
  }

  clearBalance() {
    this.currentBalance = 0;
    this.isLoading = false;
    this.error = null;
    this.updateDisplay();
  }

  updateDisplay() {
    if (this.element) {
      this.element.innerHTML = this.getBalanceHTML();
    }
  }

  setupEventListeners() {
    // Add hover effects
    if (this.element) {
      this.element.addEventListener('mouseenter', () => {
        this.element.style.transform = 'scale(1.02)';
      });
      
      this.element.addEventListener('mouseleave', () => {
        this.element.style.transform = 'scale(1)';
      });
    }
  }

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    if (this.element) {
      this.element.remove();
    }
  }
}

/**
 * Burn-to-Vote Interface Component
 * Progressive pricing display and burn functionality
 */
export class MLGBurnToVoteInterface {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      showPricing: true,
      showBalance: true,
      maxVotes: 10,
      onVotePurchased: null,
      ...options
    };
    
    this.tokenManager = new MLGTokenManager();
    this.walletManager = getWalletManager();
    this.element = null;
    this.currentBalance = 0;
    this.selectedVotes = 1;
    this.isProcessing = false;
    this.estimatedFee = 0;
    
    this.VOTE_PRICING = [1, 2, 3, 4]; // Progressive pricing per vote
    
    this.init();
  }

  async init() {
    this.render();
    this.setupEventListeners();
    await this.updateBalance();
    await this.estimateFees();
  }

  render() {
    const baseClasses = `
      mlg-burn-interface
      bg-gradient-to-br from-gray-900 to-black
      border border-green-500/30
      rounded-xl p-6
      shadow-2xl
    `.trim().replace(/\s+/g, ' ');

    this.element = document.createElement('div');
    this.element.className = baseClasses;
    this.element.innerHTML = this.getBurnInterfaceHTML();
    
    this.container.appendChild(this.element);
  }

  getBurnInterfaceHTML() {
    return `
      <div class="space-y-6">
        <!-- Header -->
        <div class="text-center">
          <h3 class="text-xl font-bold text-green-400 mb-2">Burn MLG for Votes</h3>
          <p class="text-gray-400 text-sm">Purchase votes using your MLG tokens</p>
        </div>

        <!-- Current Balance -->
        ${this.options.showBalance ? this.getBalanceSection() : ''}

        <!-- Vote Selection -->
        ${this.getVoteSelectionHTML()}

        <!-- Pricing Display -->
        ${this.options.showPricing ? this.getPricingDisplayHTML() : ''}

        <!-- Cost Summary -->
        ${this.getCostSummaryHTML()}

        <!-- Action Button -->
        ${this.getActionButtonHTML()}

        <!-- Processing Status -->
        <div id="burn-status" class="hidden">
          <div class="flex items-center justify-center gap-2 text-blue-400">
            <div class="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
            <span>Processing transaction...</span>
          </div>
        </div>
      </div>
    `;
  }

  getBalanceSection() {
    return `
      <div class="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <div class="flex items-center justify-between">
          <span class="text-gray-300">Available MLG:</span>
          <span class="text-green-400 font-mono font-semibold text-lg">
            ${this.formatBalance(this.currentBalance)} MLG
          </span>
        </div>
      </div>
    `;
  }

  getVoteSelectionHTML() {
    return `
      <div class="space-y-3">
        <label class="block text-sm font-medium text-gray-300">
          Number of Votes to Purchase
        </label>
        <div class="flex items-center gap-4">
          <button 
            type="button" 
            id="decrease-votes" 
            class="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-white transition-colors"
            ${this.selectedVotes <= 1 ? 'disabled' : ''}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
            </svg>
          </button>
          
          <div class="flex-1 text-center">
            <div class="text-3xl font-bold text-green-400" id="vote-count">
              ${this.selectedVotes}
            </div>
            <div class="text-sm text-gray-400">
              ${this.selectedVotes === 1 ? 'vote' : 'votes'}
            </div>
          </div>
          
          <button 
            type="button" 
            id="increase-votes" 
            class="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-white transition-colors"
            ${this.selectedVotes >= this.options.maxVotes ? 'disabled' : ''}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
          </button>
        </div>
        
        <!-- Vote slider -->
        <input 
          type="range" 
          id="vote-slider" 
          min="1" 
          max="${this.options.maxVotes}" 
          value="${this.selectedVotes}"
          class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-green"
        />
      </div>
    `;
  }

  getPricingDisplayHTML() {
    return `
      <div class="space-y-2">
        <h4 class="text-sm font-medium text-gray-300 mb-3">Progressive Pricing</h4>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          ${this.VOTE_PRICING.map((price, index) => `
            <div class="bg-gray-800/30 rounded-lg p-3 text-center border border-gray-700">
              <div class="text-lg font-bold text-green-400">${price}</div>
              <div class="text-xs text-gray-400">Vote ${index + 1}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  getCostSummaryHTML() {
    const totalCost = this.calculateTotalCost();
    const canAfford = this.currentBalance >= totalCost;
    
    return `
      <div class="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-gray-300">Total MLG Cost:</span>
            <span class="text-xl font-bold ${canAfford ? 'text-green-400' : 'text-red-400'}">
              ${totalCost} MLG
            </span>
          </div>
          
          ${this.estimatedFee > 0 ? `
            <div class="flex justify-between items-center text-sm">
              <span class="text-gray-400">Est. SOL Fee:</span>
              <span class="text-gray-300">${this.estimatedFee.toFixed(6)} SOL</span>
            </div>
          ` : ''}
          
          ${!canAfford ? `
            <div class="text-red-400 text-sm mt-2 flex items-center gap-1">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
              Insufficient MLG balance
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  getActionButtonHTML() {
    const totalCost = this.calculateTotalCost();
    const canAfford = this.currentBalance >= totalCost;
    const isConnected = this.walletManager.isConnected();
    
    if (!isConnected) {
      return `
        <button class="w-full py-3 px-4 bg-gray-600 text-gray-400 rounded-lg font-medium cursor-not-allowed">
          Connect Wallet to Purchase Votes
        </button>
      `;
    }
    
    return `
      <button 
        id="burn-votes-btn"
        class="w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
          canAfford && !this.isProcessing
            ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white shadow-lg hover:shadow-green-500/25'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        }"
        ${canAfford && !this.isProcessing ? '' : 'disabled'}
      >
        ${this.isProcessing 
          ? 'Processing...' 
          : `Purchase ${this.selectedVotes} ${this.selectedVotes === 1 ? 'Vote' : 'Votes'} for ${totalCost} MLG`
        }
      </button>
    `;
  }

  calculateTotalCost() {
    let total = 0;
    for (let i = 0; i < this.selectedVotes; i++) {
      total += this.VOTE_PRICING[Math.min(i, this.VOTE_PRICING.length - 1)];
    }
    return total;
  }

  setupEventListeners() {
    if (!this.element) return;

    // Vote adjustment buttons
    this.element.getElementById('decrease-votes')?.addEventListener('click', () => {
      if (this.selectedVotes > 1) {
        this.selectedVotes--;
        this.updateVoteSelection();
      }
    });

    this.element.getElementById('increase-votes')?.addEventListener('click', () => {
      if (this.selectedVotes < this.options.maxVotes) {
        this.selectedVotes++;
        this.updateVoteSelection();
      }
    });

    // Vote slider
    this.element.getElementById('vote-slider')?.addEventListener('input', (e) => {
      this.selectedVotes = parseInt(e.target.value);
      this.updateVoteSelection();
    });

    // Burn button
    this.element.getElementById('burn-votes-btn')?.addEventListener('click', () => {
      this.handleBurnVotes();
    });
  }

  updateVoteSelection() {
    // Update vote count display
    const voteCountEl = this.element.getElementById('vote-count');
    if (voteCountEl) {
      voteCountEl.textContent = this.selectedVotes;
    }

    // Update slider
    const slider = this.element.getElementById('vote-slider');
    if (slider) {
      slider.value = this.selectedVotes;
    }

    // Re-render cost summary and action button
    const costSection = this.element.querySelector('.bg-gray-800\\/50:last-of-type');
    if (costSection) {
      costSection.outerHTML = this.getCostSummaryHTML();
    }

    const actionBtn = this.element.getElementById('burn-votes-btn');
    if (actionBtn) {
      actionBtn.outerHTML = this.getActionButtonHTML();
    }

    // Re-attach event listeners
    this.setupEventListeners();
  }

  async handleBurnVotes() {
    if (this.isProcessing) return;

    const totalCost = this.calculateTotalCost();
    if (this.currentBalance < totalCost) {
      this.showError('Insufficient MLG balance');
      return;
    }

    try {
      this.isProcessing = true;
      this.showProcessingStatus(true);

      const publicKey = this.walletManager.getPublicKey();
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }

      // Execute burn transaction
      const signature = await this.tokenManager.burnTokensForVotes(
        publicKey.toString(),
        totalCost,
        this.selectedVotes
      );

      // Show success
      this.showSuccess(`Successfully purchased ${this.selectedVotes} votes! Transaction: ${signature}`);
      
      // Update balance
      await this.updateBalance();
      
      // Callback for parent component
      if (this.options.onVotePurchased) {
        this.options.onVotePurchased({
          votes: this.selectedVotes,
          cost: totalCost,
          signature
        });
      }

    } catch (error) {
      console.error('Failed to burn tokens for votes:', error);
      this.showError(error.message);
    } finally {
      this.isProcessing = false;
      this.showProcessingStatus(false);
    }
  }

  showProcessingStatus(show) {
    const statusEl = this.element.getElementById('burn-status');
    if (statusEl) {
      statusEl.classList.toggle('hidden', !show);
    }
  }

  showSuccess(message) {
    // Create success notification
    const notification = document.createElement('div');
    notification.className = 'bg-green-500/20 border border-green-500 rounded-lg p-4 text-green-400 text-sm';
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        <span>${message}</span>
      </div>
    `;
    
    this.element.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  showError(message) {
    // Create error notification
    const notification = document.createElement('div');
    notification.className = 'bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-400 text-sm';
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        <span>${message}</span>
      </div>
    `;
    
    this.element.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  async updateBalance() {
    const publicKey = this.walletManager.getPublicKey();
    if (!publicKey) {
      this.currentBalance = 0;
      return;
    }

    try {
      this.currentBalance = await this.tokenManager.getTokenBalance(publicKey.toString());
    } catch (error) {
      console.error('Failed to update balance:', error);
      this.currentBalance = 0;
    }
  }

  async estimateFees() {
    try {
      // Estimate SOL fees for burn transaction
      this.estimatedFee = await this.tokenManager.estimateBurnTransactionFee();
    } catch (error) {
      console.error('Failed to estimate fees:', error);
      this.estimatedFee = 0.001; // Fallback estimate
    }
  }

  formatBalance(balance) {
    return balance.toLocaleString('en-US', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 2 
    });
  }

  destroy() {
    if (this.element) {
      this.element.remove();
    }
  }
}

/**
 * Transaction History Display Component
 * Shows MLG token transaction history with filtering
 */
export class MLGTransactionHistory {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      maxTransactions: 50,
      showFilters: true,
      showSearch: true,
      autoUpdate: true,
      ...options
    };
    
    this.tokenManager = new MLGTokenManager();
    this.walletManager = getWalletManager();
    this.element = null;
    this.transactions = [];
    this.filteredTransactions = [];
    this.isLoading = true;
    this.searchTerm = '';
    this.typeFilter = 'all';
    
    this.init();
  }

  async init() {
    this.render();
    this.setupEventListeners();
    await this.loadTransactions();
    
    if (this.options.autoUpdate) {
      this.startAutoUpdate();
    }
  }

  render() {
    const baseClasses = `
      mlg-transaction-history
      bg-gradient-to-br from-gray-900 to-black
      border border-green-500/30
      rounded-xl p-6
      shadow-2xl
    `.trim().replace(/\s+/g, ' ');

    this.element = document.createElement('div');
    this.element.className = baseClasses;
    this.element.innerHTML = this.getHistoryHTML();
    
    this.container.appendChild(this.element);
  }

  getHistoryHTML() {
    return `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold text-green-400">Transaction History</h3>
          <button id="refresh-history" class="p-2 text-gray-400 hover:text-green-400 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
        </div>

        <!-- Filters and Search -->
        ${this.options.showFilters || this.options.showSearch ? this.getFiltersHTML() : ''}

        <!-- Transaction List -->
        <div id="transaction-list">
          ${this.getTransactionListHTML()}
        </div>
      </div>
    `;
  }

  getFiltersHTML() {
    return `
      <div class="flex flex-col sm:flex-row gap-4">
        ${this.options.showSearch ? `
          <div class="flex-1">
            <input 
              type="text" 
              id="transaction-search"
              placeholder="Search transactions..." 
              class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
              value="${this.searchTerm}"
            />
          </div>
        ` : ''}
        
        ${this.options.showFilters ? `
          <div>
            <select id="type-filter" class="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none">
              <option value="all">All Types</option>
              <option value="burn">Burns</option>
              <option value="receive">Received</option>
              <option value="send">Sent</option>
            </select>
          </div>
        ` : ''}
      </div>
    `;
  }

  getTransactionListHTML() {
    if (this.isLoading) {
      return this.getLoadingHTML();
    }

    if (this.filteredTransactions.length === 0) {
      return this.getEmptyStateHTML();
    }

    return `
      <div class="space-y-3">
        ${this.filteredTransactions.map(tx => this.getTransactionItemHTML(tx)).join('')}
      </div>
    `;
  }

  getLoadingHTML() {
    return `
      <div class="space-y-3">
        ${Array(5).fill(0).map(() => `
          <div class="bg-gray-800/50 rounded-lg p-4 animate-pulse">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-gray-600 rounded-full"></div>
                <div class="space-y-1">
                  <div class="h-4 bg-gray-600 rounded w-24"></div>
                  <div class="h-3 bg-gray-600 rounded w-32"></div>
                </div>
              </div>
              <div class="space-y-1 text-right">
                <div class="h-4 bg-gray-600 rounded w-16"></div>
                <div class="h-3 bg-gray-600 rounded w-12"></div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  getEmptyStateHTML() {
    return `
      <div class="text-center py-12">
        <div class="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <h4 class="text-lg font-medium text-gray-300 mb-2">No Transactions Found</h4>
        <p class="text-gray-400 text-sm">
          ${this.searchTerm || this.typeFilter !== 'all' 
            ? 'Try adjusting your search or filter criteria' 
            : 'Your MLG token transactions will appear here'}
        </p>
      </div>
    `;
  }

  getTransactionItemHTML(tx) {
    const isPositive = tx.type === 'receive' || tx.type === 'earn';
    const icon = this.getTransactionIcon(tx.type);
    
    return `
      <div class="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
              ${icon}
            </div>
            <div>
              <div class="text-white font-medium">${this.getTransactionTitle(tx)}</div>
              <div class="text-gray-400 text-sm">${this.formatDate(tx.timestamp)}</div>
              ${tx.signature ? `
                <button 
                  class="text-green-400 text-xs hover:text-green-300 transition-colors mt-1"
                  onclick="window.open('https://explorer.solana.com/tx/${tx.signature}', '_blank')"
                >
                  View on Explorer
                </button>
              ` : ''}
            </div>
          </div>
          <div class="text-right">
            <div class="text-lg font-mono ${isPositive ? 'text-green-400' : 'text-red-400'}">
              ${isPositive ? '+' : '-'}${this.formatBalance(Math.abs(tx.amount))} MLG
            </div>
            ${tx.status ? `
              <div class="text-xs ${
                tx.status === 'confirmed' ? 'text-green-400' : 
                tx.status === 'failed' ? 'text-red-400' : 'text-yellow-400'
              }">
                ${tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  getTransactionIcon(type) {
    const iconClasses = "w-5 h-5 text-gray-300";
    
    switch (type) {
      case 'burn':
        return `<svg class="${iconClasses}" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clip-rule="evenodd"/>
        </svg>`;
      case 'receive':
        return `<svg class="${iconClasses}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
        </svg>`;
      case 'send':
        return `<svg class="${iconClasses}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
        </svg>`;
      case 'earn':
        return `<svg class="${iconClasses}" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>`;
      default:
        return `<svg class="${iconClasses}" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
        </svg>`;
    }
  }

  getTransactionTitle(tx) {
    switch (tx.type) {
      case 'burn':
        return `Burned for ${tx.votes || 0} votes`;
      case 'receive':
        return 'Received MLG';
      case 'send':
        return 'Sent MLG';
      case 'earn':
        return tx.description || 'Earned MLG';
      default:
        return 'MLG Transaction';
    }
  }

  formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)} hours ago`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  formatBalance(balance) {
    return balance.toLocaleString('en-US', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 2 
    });
  }

  setupEventListeners() {
    if (!this.element) return;

    // Refresh button
    this.element.getElementById('refresh-history')?.addEventListener('click', () => {
      this.loadTransactions();
    });

    // Search input
    this.element.getElementById('transaction-search')?.addEventListener('input', (e) => {
      this.searchTerm = e.target.value.toLowerCase();
      this.applyFilters();
    });

    // Type filter
    this.element.getElementById('type-filter')?.addEventListener('change', (e) => {
      this.typeFilter = e.target.value;
      this.applyFilters();
    });
  }

  async loadTransactions() {
    const publicKey = this.walletManager.getPublicKey();
    if (!publicKey) {
      this.transactions = [];
      this.applyFilters();
      return;
    }

    try {
      this.isLoading = true;
      this.updateTransactionList();

      this.transactions = await this.tokenManager.getTransactionHistory(
        publicKey.toString(),
        this.options.maxTransactions
      );
      
      this.applyFilters();
    } catch (error) {
      console.error('Failed to load transaction history:', error);
      this.transactions = [];
      this.applyFilters();
    } finally {
      this.isLoading = false;
      this.updateTransactionList();
    }
  }

  applyFilters() {
    let filtered = [...this.transactions];

    // Apply search filter
    if (this.searchTerm) {
      filtered = filtered.filter(tx => 
        tx.signature?.toLowerCase().includes(this.searchTerm) ||
        this.getTransactionTitle(tx).toLowerCase().includes(this.searchTerm) ||
        tx.description?.toLowerCase().includes(this.searchTerm)
      );
    }

    // Apply type filter
    if (this.typeFilter !== 'all') {
      filtered = filtered.filter(tx => tx.type === this.typeFilter);
    }

    this.filteredTransactions = filtered;
    this.updateTransactionList();
  }

  updateTransactionList() {
    const listEl = this.element.getElementById('transaction-list');
    if (listEl) {
      listEl.innerHTML = this.getTransactionListHTML();
    }
  }

  startAutoUpdate() {
    setInterval(() => {
      if (!document.hidden && this.walletManager.isConnected()) {
        this.loadTransactions();
      }
    }, 30000); // Update every 30 seconds
  }

  destroy() {
    if (this.element) {
      this.element.remove();
    }
  }
}

/**
 * Daily Earning Progress Component
 * Shows earning progress and statistics
 */
export class MLGEarningProgress {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      showDailyGoal: true,
      showStatistics: true,
      showActivities: true,
      dailyGoal: 100, // MLG
      ...options
    };
    
    this.tokenManager = new MLGTokenManager();
    this.walletManager = getWalletManager();
    this.element = null;
    this.todayEarned = 0;
    this.weeklyEarned = 0;
    this.activities = [];
    
    this.init();
  }

  async init() {
    this.render();
    this.setupEventListeners();
    await this.loadEarningData();
  }

  render() {
    const baseClasses = `
      mlg-earning-progress
      bg-gradient-to-br from-gray-900 to-black
      border border-green-500/30
      rounded-xl p-6
      shadow-2xl
    `.trim().replace(/\s+/g, ' ');

    this.element = document.createElement('div');
    this.element.className = baseClasses;
    this.element.innerHTML = this.getProgressHTML();
    
    this.container.appendChild(this.element);
  }

  getProgressHTML() {
    return `
      <div class="space-y-6">
        <!-- Header -->
        <div class="text-center">
          <h3 class="text-xl font-bold text-green-400 mb-2">Daily MLG Earnings</h3>
          <p class="text-gray-400 text-sm">Track your token earning progress</p>
        </div>

        <!-- Daily Progress -->
        ${this.options.showDailyGoal ? this.getDailyProgressHTML() : ''}

        <!-- Statistics -->
        ${this.options.showStatistics ? this.getStatisticsHTML() : ''}

        <!-- Recent Activities -->
        ${this.options.showActivities ? this.getActivitiesHTML() : ''}
      </div>
    `;
  }

  getDailyProgressHTML() {
    const progressPercent = Math.min((this.todayEarned / this.options.dailyGoal) * 100, 100);
    const isComplete = this.todayEarned >= this.options.dailyGoal;
    
    return `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-gray-300 font-medium">Today's Progress</span>
          <span class="text-green-400 font-mono text-lg">
            ${this.formatBalance(this.todayEarned)} / ${this.formatBalance(this.options.dailyGoal)} MLG
          </span>
        </div>
        
        <div class="relative">
          <div class="w-full bg-gray-700 rounded-full h-4">
            <div 
              class="bg-gradient-to-r from-green-400 to-green-500 h-4 rounded-full transition-all duration-1000 ease-out ${isComplete ? 'animate-pulse' : ''}"
              style="width: ${progressPercent}%"
            ></div>
          </div>
          <div class="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
            ${progressPercent.toFixed(1)}%
          </div>
        </div>
        
        ${isComplete ? `
          <div class="bg-green-500/20 border border-green-500 rounded-lg p-3 text-center">
            <div class="text-green-400 font-medium flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              Daily Goal Complete!
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  getStatisticsHTML() {
    return `
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700">
          <div class="text-2xl font-bold text-green-400">${this.formatBalance(this.todayEarned)}</div>
          <div class="text-sm text-gray-400">Today</div>
        </div>
        <div class="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700">
          <div class="text-2xl font-bold text-blue-400">${this.formatBalance(this.weeklyEarned)}</div>
          <div class="text-sm text-gray-400">This Week</div>
        </div>
      </div>
    `;
  }

  getActivitiesHTML() {
    if (this.activities.length === 0) {
      return `
        <div class="text-center py-6">
          <div class="text-gray-400 text-sm">No earning activities today</div>
        </div>
      `;
    }

    return `
      <div class="space-y-3">
        <h4 class="text-sm font-medium text-gray-300">Recent Activities</h4>
        <div class="space-y-2">
          ${this.activities.slice(0, 5).map(activity => `
            <div class="flex items-center justify-between bg-gray-800/30 rounded-lg p-3">
              <div class="flex items-center gap-3">
                <div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <div class="text-white text-sm font-medium">${activity.description}</div>
                  <div class="text-gray-400 text-xs">${this.formatTime(activity.timestamp)}</div>
                </div>
              </div>
              <div class="text-green-400 font-mono text-sm">
                +${this.formatBalance(activity.amount)} MLG
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  async loadEarningData() {
    const publicKey = this.walletManager.getPublicKey();
    if (!publicKey) {
      return;
    }

    try {
      // Load earning data from token manager
      const earningData = await this.tokenManager.getEarningData(publicKey.toString());
      
      this.todayEarned = earningData.todayEarned || 0;
      this.weeklyEarned = earningData.weeklyEarned || 0;
      this.activities = earningData.activities || [];
      
      this.updateDisplay();
    } catch (error) {
      console.error('Failed to load earning data:', error);
    }
  }

  updateDisplay() {
    if (this.element) {
      this.element.innerHTML = this.getProgressHTML();
      this.setupEventListeners();
    }
  }

  setupEventListeners() {
    // Add any interactive elements here
  }

  formatBalance(balance) {
    return balance.toLocaleString('en-US', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 1 
    });
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  destroy() {
    if (this.element) {
      this.element.remove();
    }
  }
}

/**
 * Token Validation and Fee Estimation Component
 * Shows balance validation warnings and fee estimates
 */
export class MLGTokenValidator {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      showWarnings: true,
      showFeeEstimate: true,
      minBalance: 10, // Minimum recommended balance
      ...options
    };
    
    this.tokenManager = new MLGTokenManager();
    this.walletManager = getWalletManager();
    this.element = null;
    this.currentBalance = 0;
    this.estimatedFees = {};
    this.validationStatus = 'loading';
    
    this.init();
  }

  async init() {
    this.render();
    this.setupEventListeners();
    await this.performValidation();
  }

  render() {
    const baseClasses = `
      mlg-token-validator
      bg-gradient-to-br from-gray-900 to-black
      border border-green-500/30
      rounded-xl p-6
      shadow-2xl
    `.trim().replace(/\s+/g, ' ');

    this.element = document.createElement('div');
    this.element.className = baseClasses;
    this.element.innerHTML = this.getValidatorHTML();
    
    this.container.appendChild(this.element);
  }

  getValidatorHTML() {
    return `
      <div class="space-y-4">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h4 class="text-lg font-bold text-green-400">Token Status</h4>
          <button id="refresh-validation" class="p-1 text-gray-400 hover:text-green-400 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
        </div>

        <!-- Validation Status -->
        ${this.getValidationStatusHTML()}

        <!-- Warnings -->
        ${this.options.showWarnings ? this.getWarningsHTML() : ''}

        <!-- Fee Estimates -->
        ${this.options.showFeeEstimate ? this.getFeeEstimatesHTML() : ''}
      </div>
    `;
  }

  getValidationStatusHTML() {
    if (this.validationStatus === 'loading') {
      return `
        <div class="flex items-center gap-3 bg-gray-800/50 rounded-lg p-4">
          <div class="animate-spin w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full"></div>
          <span class="text-gray-300">Validating token status...</span>
        </div>
      `;
    }

    const statusConfig = this.getStatusConfig();
    
    return `
      <div class="flex items-center gap-3 bg-gray-800/50 rounded-lg p-4">
        <div class="w-5 h-5 ${statusConfig.color}">
          ${statusConfig.icon}
        </div>
        <div class="flex-1">
          <div class="text-white font-medium">${statusConfig.title}</div>
          <div class="text-gray-400 text-sm">${statusConfig.description}</div>
        </div>
      </div>
    `;
  }

  getStatusConfig() {
    const isConnected = this.walletManager.isConnected();
    const hasMinBalance = this.currentBalance >= this.options.minBalance;
    
    if (!isConnected) {
      return {
        color: 'text-gray-400',
        icon: `<svg fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>`,
        title: 'Wallet Not Connected',
        description: 'Connect your wallet to view token status'
      };
    }
    
    if (this.currentBalance === 0) {
      return {
        color: 'text-red-400',
        icon: `<svg fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>`,
        title: 'No MLG Tokens',
        description: 'You need MLG tokens to participate in voting'
      };
    }
    
    if (!hasMinBalance) {
      return {
        color: 'text-yellow-400',
        icon: `<svg fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>`,
        title: 'Low Token Balance',
        description: `Consider acquiring more MLG tokens (minimum ${this.options.minBalance} recommended)`
      };
    }
    
    return {
      color: 'text-green-400',
      icon: `<svg fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
      </svg>`,
      title: 'Token Status Good',
      description: `You have ${this.formatBalance(this.currentBalance)} MLG tokens available`
    };
  }

  getWarningsHTML() {
    const warnings = this.generateWarnings();
    
    if (warnings.length === 0) {
      return '';
    }

    return `
      <div class="space-y-2">
        <h5 class="text-sm font-medium text-gray-300">Warnings</h5>
        ${warnings.map(warning => `
          <div class="bg-yellow-500/20 border border-yellow-500 rounded-lg p-3">
            <div class="flex items-start gap-2">
              <svg class="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
              <div>
                <div class="text-yellow-300 text-sm font-medium">${warning.title}</div>
                <div class="text-yellow-200 text-xs">${warning.description}</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  getFeeEstimatesHTML() {
    if (Object.keys(this.estimatedFees).length === 0) {
      return `
        <div class="bg-gray-800/50 rounded-lg p-4">
          <h5 class="text-sm font-medium text-gray-300 mb-2">Transaction Fees</h5>
          <div class="text-gray-400 text-sm">Loading fee estimates...</div>
        </div>
      `;
    }

    return `
      <div class="bg-gray-800/50 rounded-lg p-4">
        <h5 class="text-sm font-medium text-gray-300 mb-3">Estimated Transaction Fees</h5>
        <div class="space-y-2">
          ${Object.entries(this.estimatedFees).map(([action, fee]) => `
            <div class="flex justify-between items-center text-sm">
              <span class="text-gray-400">${this.formatActionName(action)}:</span>
              <span class="text-gray-300 font-mono">${fee.toFixed(6)} SOL</span>
            </div>
          `).join('')}
        </div>
        <div class="mt-3 pt-3 border-t border-gray-700">
          <div class="text-xs text-gray-500">
            Fees are estimates and may vary based on network conditions
          </div>
        </div>
      </div>
    `;
  }

  generateWarnings() {
    const warnings = [];
    const isConnected = this.walletManager.isConnected();
    
    if (!isConnected) {
      return warnings; // Don't show warnings if not connected
    }
    
    if (this.currentBalance === 0) {
      warnings.push({
        title: 'No MLG Tokens',
        description: 'You need MLG tokens to participate in voting and other platform activities.'
      });
    } else if (this.currentBalance < this.options.minBalance) {
      warnings.push({
        title: 'Low Token Balance',
        description: `Consider acquiring more MLG tokens. Recommended minimum: ${this.options.minBalance} MLG`
      });
    }
    
    // Check for high fees
    if (this.estimatedFees.burn && this.estimatedFees.burn > 0.01) {
      warnings.push({
        title: 'High Transaction Fees',
        description: 'Network fees are currently high. Consider waiting for lower fees.'
      });
    }
    
    return warnings;
  }

  formatActionName(action) {
    const names = {
      burn: 'Token Burn',
      transfer: 'Token Transfer',
      account: 'Account Creation'
    };
    return names[action] || action;
  }

  async performValidation() {
    this.validationStatus = 'loading';
    this.updateDisplay();
    
    try {
      const publicKey = this.walletManager.getPublicKey();
      if (!publicKey) {
        this.validationStatus = 'disconnected';
        this.updateDisplay();
        return;
      }

      // Get current balance
      this.currentBalance = await this.tokenManager.getTokenBalance(publicKey.toString());
      
      // Get fee estimates
      await this.loadFeeEstimates();
      
      this.validationStatus = 'complete';
      this.updateDisplay();
    } catch (error) {
      console.error('Validation failed:', error);
      this.validationStatus = 'error';
      this.updateDisplay();
    }
  }

  async loadFeeEstimates() {
    try {
      // Load various fee estimates
      this.estimatedFees = {
        burn: await this.tokenManager.estimateBurnTransactionFee() || 0.005,
        transfer: await this.tokenManager.estimateTransferTransactionFee() || 0.005,
        account: await this.tokenManager.estimateAccountCreationFee() || 0.002
      };
    } catch (error) {
      console.error('Failed to load fee estimates:', error);
      this.estimatedFees = {
        burn: 0.005,
        transfer: 0.005,
        account: 0.002
      };
    }
  }

  setupEventListeners() {
    if (!this.element) return;

    // Refresh button
    this.element.getElementById('refresh-validation')?.addEventListener('click', () => {
      this.performValidation();
    });
  }

  updateDisplay() {
    if (this.element) {
      this.element.innerHTML = this.getValidatorHTML();
      this.setupEventListeners();
    }
  }

  formatBalance(balance) {
    return balance.toLocaleString('en-US', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 2 
    });
  }

  destroy() {
    if (this.element) {
      this.element.remove();
    }
  }
}

/**
 * Combined MLG Token Dashboard Component
 * Brings together all token UI components in a unified dashboard
 */
export class MLGTokenDashboard {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      layout: 'grid', // grid, stack, tabs
      components: {
        balance: true,
        burnInterface: true,
        history: true,
        earnings: true,
        validator: true
      },
      ...options
    };
    
    this.element = null;
    this.components = {};
    
    this.init();
  }

  init() {
    this.render();
    this.setupComponents();
  }

  render() {
    const layoutClasses = {
      grid: 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6',
      stack: 'space-y-6',
      tabs: 'mlg-dashboard-tabs'
    };

    const baseClasses = `
      mlg-token-dashboard
      p-6
      ${layoutClasses[this.options.layout]}
    `.trim().replace(/\s+/g, ' ');

    this.element = document.createElement('div');
    this.element.className = baseClasses;
    
    if (this.options.layout === 'tabs') {
      this.element.innerHTML = this.getTabsHTML();
    } else {
      this.element.innerHTML = this.getGridStackHTML();
    }
    
    this.container.appendChild(this.element);
  }

  getTabsHTML() {
    return `
      <div class="bg-gradient-to-br from-gray-900 to-black border border-green-500/30 rounded-xl shadow-2xl">
        <div class="border-b border-gray-700">
          <nav class="flex">
            <button class="tab-button active px-6 py-3 text-green-400 border-b-2 border-green-400">Balance</button>
            <button class="tab-button px-6 py-3 text-gray-400 hover:text-green-400">Vote</button>
            <button class="tab-button px-6 py-3 text-gray-400 hover:text-green-400">History</button>
            <button class="tab-button px-6 py-3 text-gray-400 hover:text-green-400">Earnings</button>
            <button class="tab-button px-6 py-3 text-gray-400 hover:text-green-400">Status</button>
          </nav>
        </div>
        <div class="tab-content p-6">
          <div id="balance-tab" class="tab-pane active"></div>
          <div id="vote-tab" class="tab-pane hidden"></div>
          <div id="history-tab" class="tab-pane hidden"></div>
          <div id="earnings-tab" class="tab-pane hidden"></div>
          <div id="status-tab" class="tab-pane hidden"></div>
        </div>
      </div>
    `;
  }

  getGridStackHTML() {
    return `
      ${this.options.components.balance ? '<div id="balance-component"></div>' : ''}
      ${this.options.components.burnInterface ? '<div id="burn-component"></div>' : ''}
      ${this.options.components.history ? '<div id="history-component"></div>' : ''}
      ${this.options.components.earnings ? '<div id="earnings-component"></div>' : ''}
      ${this.options.components.validator ? '<div id="validator-component"></div>' : ''}
    `;
  }

  setupComponents() {
    if (this.options.components.balance) {
      const balanceContainer = this.element.querySelector('#balance-component') || 
                              this.element.querySelector('#balance-tab');
      if (balanceContainer) {
        this.components.balance = new MLGTokenBalanceDisplay(balanceContainer, {
          size: 'lg',
          showUSD: true,
          showEarnings: true,
          animated: true
        });
      }
    }

    if (this.options.components.burnInterface) {
      const burnContainer = this.element.querySelector('#burn-component') || 
                           this.element.querySelector('#vote-tab');
      if (burnContainer) {
        this.components.burnInterface = new MLGBurnToVoteInterface(burnContainer, {
          onVotePurchased: (data) => {
            // Refresh balance and history after purchase
            if (this.components.balance) {
              this.components.balance.updateBalance();
            }
            if (this.components.history) {
              this.components.history.loadTransactions();
            }
          }
        });
      }
    }

    if (this.options.components.history) {
      const historyContainer = this.element.querySelector('#history-component') || 
                              this.element.querySelector('#history-tab');
      if (historyContainer) {
        this.components.history = new MLGTransactionHistory(historyContainer, {
          maxTransactions: 25,
          autoUpdate: true
        });
      }
    }

    if (this.options.components.earnings) {
      const earningsContainer = this.element.querySelector('#earnings-component') || 
                               this.element.querySelector('#earnings-tab');
      if (earningsContainer) {
        this.components.earnings = new MLGEarningProgress(earningsContainer, {
          dailyGoal: 100,
          showStatistics: true
        });
      }
    }

    if (this.options.components.validator) {
      const validatorContainer = this.element.querySelector('#validator-component') || 
                                this.element.querySelector('#status-tab');
      if (validatorContainer) {
        this.components.validator = new MLGTokenValidator(validatorContainer, {
          minBalance: 10
        });
      }
    }

    if (this.options.layout === 'tabs') {
      this.setupTabNavigation();
    }
  }

  setupTabNavigation() {
    const tabButtons = this.element.querySelectorAll('.tab-button');
    const tabPanes = this.element.querySelectorAll('.tab-pane');

    tabButtons.forEach((button, index) => {
      button.addEventListener('click', () => {
        // Update button states
        tabButtons.forEach(btn => {
          btn.classList.remove('active', 'text-green-400', 'border-b-2', 'border-green-400');
          btn.classList.add('text-gray-400');
        });
        
        button.classList.add('active', 'text-green-400', 'border-b-2', 'border-green-400');
        button.classList.remove('text-gray-400');

        // Update pane visibility
        tabPanes.forEach(pane => {
          pane.classList.add('hidden');
          pane.classList.remove('active');
        });
        
        tabPanes[index].classList.remove('hidden');
        tabPanes[index].classList.add('active');
      });
    });
  }

  destroy() {
    Object.values(this.components).forEach(component => {
      if (component && component.destroy) {
        component.destroy();
      }
    });
    
    if (this.element) {
      this.element.remove();
    }
  }
}

// Export utility functions
export const MLGTokenUIUtils = {
  formatBalance: (balance) => {
    if (balance >= 1000000) {
      return (balance / 1000000).toFixed(1) + 'M';
    }
    if (balance >= 1000) {
      return (balance / 1000).toFixed(1) + 'K';
    }
    return balance.toLocaleString('en-US', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 2 
    });
  },

  formatUSD: (mlgAmount, price = 0.0234) => {
    return (mlgAmount * price).toFixed(2);
  },

  formatTime: (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${Math.floor(diffHours)} hours ago`;
    return date.toLocaleDateString();
  }
};

console.log('MLG Token UI Components loaded successfully');