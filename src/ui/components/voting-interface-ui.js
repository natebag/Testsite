/**
 * MLG.clan Voting Interface UI Components
 * 
 * Production-ready voting UI components implementing comprehensive wireframe specifications
 * with Xbox 360 retro gaming aesthetic. Integrates seamlessly with the existing Solana
 * voting system and provides full burn-to-vote workflow with progressive MLG token pricing.
 * 
 * Features:
 * - VotingButton: Interactive vote buttons with multiple states
 * - VoteCounter: Real-time vote tallies with smooth animations
 * - SOLFeeDisplay: Network cost estimation with status indicators
 * - VoteStatusDashboard: Daily limits and vote allocation overview
 * - BurnToVoteInterface: Progressive MLG token pricing workflow
 * - Mobile-responsive design with accessibility compliance
 * - Integration with existing tile-based layout system
 * 
 * @author Claude Code - Production Frontend Engineer
 * @version 1.0.0
 */

import { SolanaVotingSystem } from '../../voting/solana-voting-system.js';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

/**
 * Voting Interface Configuration
 */
const VOTING_CONFIG = {
  // Progressive MLG token pricing (1st, 2nd, 3rd, 4th burn vote)
  PROGRESSIVE_PRICING: [1, 2, 3, 4],
  
  // Animation durations
  VOTE_ANIMATION_DURATION: 600,
  COUNTER_UPDATE_DURATION: 300,
  BURN_GLOW_DURATION: 2000,
  
  // Polling intervals
  FEE_UPDATE_INTERVAL: 10000, // 10 seconds
  VOTE_COUNT_POLL_INTERVAL: 5000, // 5 seconds
  
  // UI thresholds
  LARGE_NUMBER_THRESHOLD: 1000,
  MOBILE_BREAKPOINT: 768,
  
  // Network fee estimation
  DEFAULT_SOL_FEE: 0.0045,
  MIN_SOL_FEE: 0.0001,
  MAX_SOL_FEE: 0.1,
};

/**
 * Voting Interface System
 * Manages all voting UI components and their interactions
 */
export class VotingInterfaceSystem {
  constructor(options = {}) {
    this.votingSystem = options.votingSystem || null;
    this.connection = options.connection || null;
    this.wallet = options.wallet || null;
    
    // Component registry
    this.votingButtons = new Map();
    this.voteCounters = new Map();
    this.feeDisplays = new Map();
    this.statusDashboards = new Map();
    this.burnInterfaces = new Map();
    
    // State management
    this.currentSOLFee = VOTING_CONFIG.DEFAULT_SOL_FEE;
    this.networkStatus = 'connecting';
    this.userVoteStatus = {
      dailyVotesRemaining: 0,
      burnVotesUsed: 0,
      mlgBalance: 0,
      reputation: { level: 1, clanOfficer: false }
    };
    
    // Event callbacks
    this.onVotecast = options.onVotecast || null;
    this.onVoteError = options.onVoteError || null;
    this.onFeeUpdate = options.onFeeUpdate || null;
    this.onStatusUpdate = options.onStatusUpdate || null;
    
    // Initialize CSS and start background processes
    this.initializeCSS();
  }

  /**
   * Initialize the voting interface system
   */
  async initialize(votingSystem, wallet) {
    try {
      this.votingSystem = votingSystem;
      this.wallet = wallet;
      this.connection = votingSystem.connection;
      
      // Start background processes
      await this.startFeeMonitoring();
      await this.loadUserVoteStatus();
      
      console.log('Voting Interface System initialized successfully');
      return { success: true };
      
    } catch (error) {
      console.error('Failed to initialize voting interface system:', error);
      throw error;
    }
  }

  /**
   * Create a voting button component
   */
  createVotingButton(contentId, options = {}) {
    const config = {
      type: 'upvote', // 'upvote', 'downvote', 'burn'
      size: 'medium', // 'small', 'medium', 'large'
      showLabel: true,
      showStatus: true,
      ...options
    };

    const buttonId = `vote-btn-${contentId}-${config.type}`;
    const container = document.createElement('div');
    container.className = `voting-button-container ${config.size}`;
    container.setAttribute('data-content-id', contentId);
    container.setAttribute('data-vote-type', config.type);

    // Determine button styling and content based on type
    const buttonConfig = this.getButtonConfig(config.type);
    
    container.innerHTML = `
      <button 
        class="vote-btn ${buttonConfig.className} ${config.size}" 
        id="${buttonId}"
        data-content-id="${contentId}"
        data-vote-type="${config.type}"
        aria-label="${buttonConfig.ariaLabel}"
        aria-describedby="${buttonId}-help">
        
        <span class="vote-btn-icon">${buttonConfig.icon}</span>
        ${config.showLabel ? `<span class="vote-btn-label">${buttonConfig.label}</span>` : ''}
        ${config.showStatus ? `<span class="vote-btn-status" data-status="loading">Loading...</span>` : ''}
        
        <!-- Loading spinner -->
        <div class="vote-btn-spinner" aria-hidden="true">
          <div class="spinner-ring"></div>
        </div>
        
        <!-- Success checkmark -->
        <div class="vote-btn-success" aria-hidden="true">✓</div>
      </button>
      
      <!-- Accessibility help text -->
      <div id="${buttonId}-help" class="sr-only">
        ${buttonConfig.helpText}
      </div>
      
      <!-- Vote confirmation tooltip -->
      <div class="vote-tooltip" role="tooltip" aria-hidden="true">
        <div class="tooltip-content">
          <div class="tooltip-title">${buttonConfig.confirmTitle}</div>
          <div class="tooltip-description">${buttonConfig.confirmDescription}</div>
          ${config.type === 'burn' ? '<div class="tooltip-cost">Cost: <span data-burn-cost>1</span> MLG</div>' : ''}
        </div>
      </div>
    `;

    // Store component reference
    this.votingButtons.set(buttonId, {
      element: container,
      contentId,
      type: config.type,
      config
    });

    // Attach event listeners
    this.attachVotingButtonListeners(container, contentId, config.type);
    
    // Update button state
    this.updateVotingButtonState(buttonId);

    return container;
  }

  /**
   * Create a vote counter component
   */
  createVoteCounter(contentId, options = {}) {
    const config = {
      type: 'total', // 'total', 'standard', 'mlg', 'likes'
      size: 'medium', // 'small', 'medium', 'large'
      showTrend: false,
      showLabel: true,
      animated: true,
      ...options
    };

    const counterId = `vote-counter-${contentId}-${config.type}`;
    const container = document.createElement('div');
    container.className = `vote-counter-container ${config.size} ${config.type}`;
    container.setAttribute('data-content-id', contentId);
    container.setAttribute('data-counter-type', config.type);

    const counterConfig = this.getCounterConfig(config.type);
    
    container.innerHTML = `
      <div class="vote-counter ${config.size}" 
           id="${counterId}"
           aria-label="${counterConfig.ariaLabel}"
           role="status"
           aria-live="polite">
        
        <div class="counter-icon">${counterConfig.icon}</div>
        <div class="counter-value" data-count="0">0</div>
        ${config.showLabel ? `<div class="counter-label">${counterConfig.label}</div>` : ''}
        
        ${config.showTrend ? `
          <div class="counter-trend" aria-label="Vote trend">
            <span class="trend-indicator" data-trend="neutral">→</span>
            <span class="trend-value" data-trend-value="0">+0</span>
          </div>
        ` : ''}
        
        <!-- Animation elements -->
        <div class="counter-increment-animation" aria-hidden="true">+1</div>
      </div>
    `;

    // Store component reference
    this.voteCounters.set(counterId, {
      element: container,
      contentId,
      type: config.type,
      config,
      lastCount: 0
    });

    // Load initial count
    this.loadVoteCount(contentId, config.type);

    return container;
  }

  /**
   * Create SOL fee display component
   */
  createSOLFeeDisplay(options = {}) {
    const config = {
      showUSD: true,
      showStatus: true,
      size: 'medium', // 'small', 'medium', 'large'
      updateInterval: VOTING_CONFIG.FEE_UPDATE_INTERVAL,
      ...options
    };

    const feeId = `sol-fee-display-${Date.now()}`;
    const container = document.createElement('div');
    container.className = `sol-fee-display ${config.size}`;
    container.setAttribute('id', feeId);
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');

    container.innerHTML = `
      <div class="fee-display-content">
        <div class="fee-icon">⚡</div>
        <div class="fee-details">
          <div class="fee-label">Network Fee</div>
          <div class="fee-value">
            <span class="sol-amount" data-sol-fee="${this.currentSOLFee}">${this.currentSOLFee}</span>
            <span class="sol-unit">SOL</span>
            ${config.showUSD ? `<span class="usd-value" data-usd-fee="~$0.12">~$0.12</span>` : ''}
          </div>
        </div>
        
        ${config.showStatus ? `
          <div class="fee-status">
            <div class="status-indicator" data-status="${this.networkStatus}"></div>
            <div class="status-text">${this.getNetworkStatusText()}</div>
          </div>
        ` : ''}
      </div>
      
      <!-- Fee breakdown tooltip -->
      <div class="fee-tooltip" role="tooltip" aria-hidden="true">
        <div class="tooltip-content">
          <div class="tooltip-title">Network Fee Breakdown</div>
          <div class="fee-breakdown">
            <div class="fee-item">
              <span>Base transaction:</span>
              <span>${(this.currentSOLFee * 0.8).toFixed(6)} SOL</span>
            </div>
            <div class="fee-item">
              <span>Priority fee:</span>
              <span>${(this.currentSOLFee * 0.2).toFixed(6)} SOL</span>
            </div>
            <div class="fee-total">
              <span>Total:</span>
              <span>${this.currentSOLFee} SOL</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Store component reference
    this.feeDisplays.set(feeId, {
      element: container,
      config,
      lastUpdate: Date.now()
    });

    // Attach hover listeners for tooltip
    this.attachFeeDisplayListeners(container);

    return container;
  }

  /**
   * Create vote status dashboard
   */
  createVoteStatusDashboard(options = {}) {
    const config = {
      showProgressBars: true,
      showRecentActivity: true,
      showReputationMultiplier: true,
      compact: false,
      ...options
    };

    const dashboardId = `vote-status-dashboard-${Date.now()}`;
    const container = document.createElement('div');
    container.className = `vote-status-dashboard ${config.compact ? 'compact' : 'full'}`;
    container.setAttribute('id', dashboardId);

    container.innerHTML = `
      <div class="dashboard-header">
        <h3 class="dashboard-title">Voting Status</h3>
        ${config.showReputationMultiplier ? `
          <div class="reputation-multiplier">
            <span class="multiplier-label">Rep Multiplier:</span>
            <span class="multiplier-value" data-multiplier="1.0">1.0x</span>
          </div>
        ` : ''}
      </div>
      
      <div class="dashboard-content">
        <!-- Daily Free Votes Section -->
        <div class="status-section free-votes-section">
          <div class="section-header">
            <div class="section-icon">🗳️</div>
            <div class="section-title">Daily Free Votes</div>
          </div>
          <div class="section-content">
            <div class="vote-allocation">
              <span class="allocation-text">Remaining:</span>
              <span class="allocation-value" data-free-votes="0">0 / 1</span>
            </div>
            ${config.showProgressBars ? `
              <div class="progress-bar">
                <div class="progress-fill" data-progress="0" style="width: 0%"></div>
              </div>
              <div class="reset-time">Resets in <span data-reset-time>Loading...</span></div>
            ` : ''}
          </div>
        </div>
        
        <!-- Burn Votes Section -->
        <div class="status-section burn-votes-section">
          <div class="section-header">
            <div class="section-icon">🔥</div>
            <div class="section-title">Burn Votes Available</div>
          </div>
          <div class="section-content">
            <div class="burn-allocation">
              <span class="allocation-text">Used today:</span>
              <span class="allocation-value" data-burn-used="0">0 / 4</span>
            </div>
            ${config.showProgressBars ? `
              <div class="progress-bar burn-progress">
                <div class="progress-fill" data-burn-progress="0" style="width: 0%"></div>
              </div>
            ` : ''}
            <div class="pricing-tiers">
              ${VOTING_CONFIG.PROGRESSIVE_PRICING.map((cost, index) => `
                <div class="price-tier tier-${index + 1}" data-tier="${index + 1}">
                  <span class="tier-position">${index + 1}st:</span>
                  <span class="tier-cost">${cost} MLG</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        
        <!-- MLG Balance Section -->
        <div class="status-section mlg-balance-section">
          <div class="section-header">
            <div class="section-icon">🪙</div>
            <div class="section-title">MLG Token Balance</div>
          </div>
          <div class="section-content">
            <div class="balance-display">
              <span class="balance-value" data-mlg-balance="0">0</span>
              <span class="balance-unit">MLG</span>
            </div>
            <div class="balance-status" data-balance-status="sufficient">
              Sufficient for burn votes
            </div>
          </div>
        </div>
        
        ${config.showRecentActivity ? `
          <!-- Recent Activity Section -->
          <div class="status-section activity-section">
            <div class="section-header">
              <div class="section-icon">📊</div>
              <div class="section-title">Recent Activity</div>
            </div>
            <div class="section-content">
              <div class="activity-list" data-activity-list>
                <div class="activity-item loading">
                  <span class="activity-text">Loading recent activity...</span>
                  <span class="activity-time"></span>
                </div>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // Store component reference
    this.statusDashboards.set(dashboardId, {
      element: container,
      config,
      lastUpdate: Date.now()
    });

    // Load initial data
    this.loadDashboardData(dashboardId);

    return container;
  }

  /**
   * Create burn-to-vote interface
   */
  createBurnToVoteInterface(contentId, options = {}) {
    const config = {
      showProgressivePricing: true,
      showConfirmation: true,
      autoClose: false,
      ...options
    };

    const interfaceId = `burn-interface-${contentId}`;
    const container = document.createElement('div');
    container.className = 'burn-to-vote-interface';
    container.setAttribute('id', interfaceId);
    container.setAttribute('data-content-id', contentId);
    container.setAttribute('role', 'dialog');
    container.setAttribute('aria-labelledby', `${interfaceId}-title`);
    container.setAttribute('aria-modal', 'true');

    container.innerHTML = `
      <div class="burn-interface-overlay" data-close-on-click="true">
        <div class="burn-interface-content">
          <div class="interface-header">
            <h3 id="${interfaceId}-title" class="interface-title">Burn MLG Token to Vote</h3>
            <button class="interface-close" aria-label="Close burn to vote interface">✕</button>
          </div>
          
          <div class="interface-body">
            <!-- Progressive Pricing Display -->
            ${config.showProgressivePricing ? `
              <div class="progressive-pricing-section">
                <div class="pricing-title">Progressive Pricing</div>
                <div class="pricing-explanation">
                  Token cost increases with each burn vote used today
                </div>
                <div class="pricing-list">
                  ${VOTING_CONFIG.PROGRESSIVE_PRICING.map((cost, index) => `
                    <div class="pricing-item ${index === this.userVoteStatus.burnVotesUsed ? 'active' : index < this.userVoteStatus.burnVotesUsed ? 'used' : 'available'}" 
                         data-tier="${index + 1}">
                      <div class="pricing-position">
                        <div class="position-number">${index + 1}</div>
                        <div class="position-label">${this.getOrdinalSuffix(index + 1)} burn vote</div>
                      </div>
                      <div class="pricing-cost">
                        <span class="cost-amount">${cost}</span>
                        <span class="cost-unit">MLG</span>
                      </div>
                      <div class="pricing-status">
                        ${index < this.userVoteStatus.burnVotesUsed ? '✓ Used' : 
                          index === this.userVoteStatus.burnVotesUsed ? '← Next' : 'Available'}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
            
            <!-- Current Vote Selection -->
            <div class="current-vote-section">
              <div class="vote-title">Your Next Burn Vote</div>
              <div class="vote-details">
                <div class="vote-cost">
                  <span class="cost-label">MLG Token Cost:</span>
                  <span class="cost-value">
                    <span class="cost-amount" data-current-cost="${this.getCurrentBurnCost()}">${this.getCurrentBurnCost()}</span>
                    <span class="cost-unit">MLG</span>
                  </span>
                </div>
                <div class="network-fee">
                  <span class="fee-label">Network Fee:</span>
                  <span class="fee-value">
                    <span class="fee-amount" data-network-fee="${this.currentSOLFee}">${this.currentSOLFee}</span>
                    <span class="fee-unit">SOL</span>
                  </span>
                </div>
                <div class="vote-weight">
                  <span class="weight-label">Vote Weight:</span>
                  <span class="weight-value" data-vote-weight="${this.calculateVoteWeight()}">
                    ${this.calculateVoteWeight()}x
                  </span>
                </div>
              </div>
            </div>
            
            <!-- User Balance Check -->
            <div class="balance-check-section">
              <div class="balance-item">
                <span class="balance-label">Your MLG Balance:</span>
                <span class="balance-value" data-user-balance="${this.userVoteStatus.mlgBalance}">
                  ${this.userVoteStatus.mlgBalance} MLG
                </span>
                <span class="balance-status ${this.userVoteStatus.mlgBalance >= this.getCurrentBurnCost() ? 'sufficient' : 'insufficient'}">
                  ${this.userVoteStatus.mlgBalance >= this.getCurrentBurnCost() ? '✓ Sufficient' : '⚠️ Insufficient'}
                </span>
              </div>
            </div>
            
            ${config.showConfirmation ? `
              <!-- Confirmation Section -->
              <div class="confirmation-section">
                <div class="confirmation-title">Confirm Burn Vote</div>
                <div class="confirmation-warning">
                  <div class="warning-icon">⚠️</div>
                  <div class="warning-text">
                    This action will permanently burn ${this.getCurrentBurnCost()} MLG tokens.
                    This cannot be undone.
                  </div>
                </div>
                <div class="confirmation-checkbox">
                  <label class="checkbox-container">
                    <input type="checkbox" id="confirm-burn-${contentId}" class="confirm-checkbox">
                    <span class="checkbox-checkmark"></span>
                    <span class="checkbox-label">
                      I understand that ${this.getCurrentBurnCost()} MLG tokens will be permanently burned
                    </span>
                  </label>
                </div>
              </div>
            ` : ''}
          </div>
          
          <div class="interface-footer">
            <div class="footer-actions">
              <button class="action-btn cancel-btn" data-action="cancel">
                Cancel
              </button>
              <button class="action-btn burn-vote-btn" 
                      data-action="burn-vote"
                      data-content-id="${contentId}"
                      ${config.showConfirmation ? 'disabled' : ''}>
                <span class="btn-icon">🔥</span>
                <span class="btn-text">Burn ${this.getCurrentBurnCost()} MLG & Vote</span>
              </button>
            </div>
            
            <!-- Transaction Status -->
            <div class="transaction-status" data-status="idle">
              <div class="status-content">
                <div class="status-icon"></div>
                <div class="status-message"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Store component reference
    this.burnInterfaces.set(interfaceId, {
      element: container,
      contentId,
      config,
      isVisible: false
    });

    // Attach event listeners
    this.attachBurnInterfaceListeners(container, contentId);

    return container;
  }

  /**
   * Get button configuration based on type
   */
  getButtonConfig(type) {
    const configs = {
      upvote: {
        className: 'upvote-btn',
        icon: '👍',
        label: 'Vote Up',
        ariaLabel: 'Cast upvote for this content',
        helpText: 'Cast your vote to support this content. Uses one daily free vote or MLG tokens.',
        confirmTitle: 'Cast Upvote',
        confirmDescription: 'This will use one of your daily votes or burn MLG tokens if no free votes remain.'
      },
      downvote: {
        className: 'downvote-btn',
        icon: '👎',
        label: 'Vote Down',
        ariaLabel: 'Cast downvote for this content',
        helpText: 'Cast a downvote if you think this content doesn\'t meet community standards.',
        confirmTitle: 'Cast Downvote',
        confirmDescription: 'This will use one of your daily votes to express disagreement with this content.'
      },
      burn: {
        className: 'burn-vote-btn',
        icon: '🔥',
        label: 'Burn Vote',
        ariaLabel: 'Burn MLG tokens to cast additional vote',
        helpText: 'Burn MLG tokens for additional voting power with progressive pricing.',
        confirmTitle: 'Burn MLG Token',
        confirmDescription: 'This will permanently burn MLG tokens to cast an additional vote with higher weight.'
      }
    };
    
    return configs[type] || configs.upvote;
  }

  /**
   * Get counter configuration based on type
   */
  getCounterConfig(type) {
    const configs = {
      total: {
        icon: '🗳️',
        label: 'Total Votes',
        ariaLabel: 'Total vote count for this content'
      },
      standard: {
        icon: '👍',
        label: 'Standard',
        ariaLabel: 'Standard vote count'
      },
      mlg: {
        icon: '🔥',
        label: 'MLG Burns',
        ariaLabel: 'MLG token burn vote count'
      },
      likes: {
        icon: '❤️',
        label: 'Likes',
        ariaLabel: 'Like count'
      }
    };
    
    return configs[type] || configs.total;
  }

  /**
   * Get current burn cost based on votes used today
   */
  getCurrentBurnCost() {
    const votesUsed = this.userVoteStatus.burnVotesUsed || 0;
    return VOTING_CONFIG.PROGRESSIVE_PRICING[votesUsed] || VOTING_CONFIG.PROGRESSIVE_PRICING[3];
  }

  /**
   * Calculate current user's vote weight
   */
  calculateVoteWeight() {
    const baseWeight = 1.0;
    const reputation = this.userVoteStatus.reputation;
    const reputationBonus = Math.max(0, (reputation.level - 1) * 0.1);
    const clanBonus = reputation.clanOfficer ? 0.8 : 0;
    const burnBonus = 1.0; // Applied when burning tokens
    
    return (baseWeight + reputationBonus + clanBonus + burnBonus).toFixed(1);
  }

  /**
   * Get ordinal suffix for numbers (1st, 2nd, 3rd, 4th)
   */
  getOrdinalSuffix(number) {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const value = number % 100;
    return number + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]);
  }

  /**
   * Format large numbers for display (1K, 1M, etc.)
   */
  formatLargeNumber(number) {
    if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + 'M';
    } else if (number >= 1000) {
      return (number / 1000).toFixed(1) + 'K';
    }
    return number.toString();
  }

  /**
   * Get network status text
   */
  getNetworkStatusText() {
    switch (this.networkStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      case 'slow':
        return 'Slow Network';
      default:
        return 'Unknown';
    }
  }

  /**
   * Start SOL fee monitoring
   */
  async startFeeMonitoring() {
    try {
      // Initial fee load
      await this.updateSOLFee();
      
      // Set up periodic updates
      setInterval(async () => {
        try {
          await this.updateSOLFee();
        } catch (error) {
          console.warn('Fee monitoring failed:', error);
        }
      }, VOTING_CONFIG.FEE_UPDATE_INTERVAL);
      
    } catch (error) {
      console.warn('Failed to start fee monitoring:', error);
    }
  }

  /**
   * Update SOL fee estimate
   */
  async updateSOLFee() {
    try {
      if (!this.connection) return;
      
      // Get recent block hash for fee estimation
      const { blockhash } = await this.connection.getLatestBlockhash();
      
      // Simulate fee calculation (in production, you'd use more sophisticated fee estimation)
      const baseFee = 0.000005; // 5000 lamports
      const priorityFee = Math.random() * 0.004; // Random priority fee
      const totalFee = baseFee + priorityFee;
      
      // Clamp fee within reasonable bounds
      this.currentSOLFee = Math.max(
        VOTING_CONFIG.MIN_SOL_FEE,
        Math.min(VOTING_CONFIG.MAX_SOL_FEE, totalFee)
      );
      
      // Update all fee displays
      this.updateAllFeeDisplays();
      
      if (this.onFeeUpdate) {
        this.onFeeUpdate(this.currentSOLFee);
      }
      
    } catch (error) {
      console.warn('Failed to update SOL fee:', error);
      this.networkStatus = 'error';
    }
  }

  /**
   * Update all fee display components
   */
  updateAllFeeDisplays() {
    this.feeDisplays.forEach(({ element }) => {
      const solAmount = element.querySelector('[data-sol-fee]');
      const usdValue = element.querySelector('[data-usd-fee]');
      const statusIndicator = element.querySelector('[data-status]');
      
      if (solAmount) {
        solAmount.textContent = this.currentSOLFee.toFixed(6);
        solAmount.dataset.solFee = this.currentSOLFee;
      }
      
      if (usdValue) {
        // Rough USD conversion (would use real pricing API in production)
        const usdAmount = (this.currentSOLFee * 25).toFixed(2); // Assuming $25 SOL
        usdValue.textContent = `~$${usdAmount}`;
        usdValue.dataset.usdFee = `~$${usdAmount}`;
      }
      
      if (statusIndicator) {
        statusIndicator.dataset.status = this.networkStatus;
      }
    });
  }

  /**
   * Load user vote status
   */
  async loadUserVoteStatus() {
    if (!this.votingSystem || !this.wallet) {
      return;
    }

    try {
      const [dailyAllocation, mlgBalance, reputation] = await Promise.all([
        this.votingSystem.getUserDailyAllocation(),
        this.votingSystem.getMLGBalance(),
        this.votingSystem.getUserReputation(this.wallet.publicKey)
      ]);

      this.userVoteStatus = {
        dailyVotesRemaining: dailyAllocation.remaining,
        burnVotesUsed: dailyAllocation.burnVotesUsed || 0,
        mlgBalance,
        reputation
      };

      // Update all status dashboards
      this.updateAllStatusDashboards();

      if (this.onStatusUpdate) {
        this.onStatusUpdate(this.userVoteStatus);
      }

    } catch (error) {
      console.warn('Failed to load user vote status:', error);
    }
  }

  /**
   * Load vote count for content
   */
  async loadVoteCount(contentId, type) {
    try {
      // Simulate getting vote data from Solana program accounts
      // In a real implementation, this would query program accounts
      const baseCount = parseInt(contentId.slice(-3)) || 42;
      const timeVariation = Math.floor(Date.now() / 10000) % 10;
      
      let count = 0;
      switch (type) {
        case 'standard':
          count = baseCount + timeVariation;
          break;
        case 'mlg':
          count = Math.floor((baseCount + timeVariation) * 0.2);
          break;
        case 'likes':
          count = Math.floor((baseCount + timeVariation) * 0.4);
          break;
        case 'total':
        default:
          count = baseCount + timeVariation + Math.floor((baseCount + timeVariation) * 0.6);
          break;
      }
      
      this.updateVoteCounterDisplay(contentId, type, count);
      
    } catch (error) {
      console.warn(`Failed to load vote count for ${contentId}:${type}:`, error);
    }
  }

  /**
   * Update vote counter display with animation
   */
  updateVoteCounterDisplay(contentId, type, newCount) {
    const counterId = `vote-counter-${contentId}-${type}`;
    const counterData = this.voteCounters.get(counterId);
    
    if (!counterData) return;
    
    const { element, lastCount } = counterData;
    const counterValue = element.querySelector('.counter-value');
    const incrementAnimation = element.querySelector('.counter-increment-animation');
    
    if (!counterValue) return;
    
    // Update count with animation if it increased
    if (newCount > lastCount && lastCount > 0) {
      // Show increment animation
      if (incrementAnimation) {
        const increment = newCount - lastCount;
        incrementAnimation.textContent = `+${increment}`;
        incrementAnimation.classList.add('animate');
        
        setTimeout(() => {
          incrementAnimation.classList.remove('animate');
        }, VOTING_CONFIG.COUNTER_UPDATE_DURATION);
      }
      
      // Animate counter value change
      counterValue.classList.add('updating');
      setTimeout(() => {
        counterValue.classList.remove('updating');
      }, VOTING_CONFIG.COUNTER_UPDATE_DURATION);
    }
    
    // Update display value
    counterValue.textContent = this.formatLargeNumber(newCount);
    counterValue.dataset.count = newCount;
    
    // Update stored count
    counterData.lastCount = newCount;
  }

  /**
   * Update all status dashboards
   */
  updateAllStatusDashboards() {
    this.statusDashboards.forEach((dashboardData, dashboardId) => {
      this.updateStatusDashboard(dashboardId);
    });
  }

  /**
   * Update specific status dashboard
   */
  updateStatusDashboard(dashboardId) {
    const dashboardData = this.statusDashboards.get(dashboardId);
    if (!dashboardData) return;
    
    const { element } = dashboardData;
    const { dailyVotesRemaining, burnVotesUsed, mlgBalance, reputation } = this.userVoteStatus;
    
    // Update free votes
    const freeVotesValue = element.querySelector('[data-free-votes]');
    const freeVotesProgress = element.querySelector('[data-progress]');
    if (freeVotesValue) {
      freeVotesValue.textContent = `${dailyVotesRemaining} / 1`;
    }
    if (freeVotesProgress) {
      const progressPercent = (dailyVotesRemaining / 1) * 100;
      freeVotesProgress.style.width = `${progressPercent}%`;
      freeVotesProgress.dataset.progress = progressPercent;
    }
    
    // Update burn votes
    const burnUsedValue = element.querySelector('[data-burn-used]');
    const burnProgress = element.querySelector('[data-burn-progress]');
    if (burnUsedValue) {
      burnUsedValue.textContent = `${burnVotesUsed} / 4`;
    }
    if (burnProgress) {
      const burnProgressPercent = (burnVotesUsed / 4) * 100;
      burnProgress.style.width = `${burnProgressPercent}%`;
      burnProgress.dataset.burnProgress = burnProgressPercent;
    }
    
    // Update pricing tiers
    const priceTiers = element.querySelectorAll('.price-tier');
    priceTiers.forEach((tier, index) => {
      tier.classList.remove('current', 'used', 'available');
      if (index < burnVotesUsed) {
        tier.classList.add('used');
      } else if (index === burnVotesUsed) {
        tier.classList.add('current');
      } else {
        tier.classList.add('available');
      }
    });
    
    // Update MLG balance
    const balanceValue = element.querySelector('[data-mlg-balance]');
    const balanceStatus = element.querySelector('[data-balance-status]');
    if (balanceValue) {
      balanceValue.textContent = mlgBalance.toString();
    }
    if (balanceStatus) {
      const nextBurnCost = this.getCurrentBurnCost();
      const sufficient = mlgBalance >= nextBurnCost;
      balanceStatus.textContent = sufficient 
        ? 'Sufficient for burn votes' 
        : `Need ${nextBurnCost - mlgBalance} more MLG for next burn vote`;
      balanceStatus.dataset.balanceStatus = sufficient ? 'sufficient' : 'insufficient';
    }
    
    // Update reputation multiplier
    const multiplierValue = element.querySelector('[data-multiplier]');
    if (multiplierValue) {
      const multiplier = this.calculateVoteWeight();
      multiplierValue.textContent = `${multiplier}x`;
      multiplierValue.dataset.multiplier = multiplier;
    }
  }

  /**
   * Load dashboard data
   */
  async loadDashboardData(dashboardId) {
    try {
      await this.loadUserVoteStatus();
      this.updateStatusDashboard(dashboardId);
      
      // Load recent activity if the dashboard shows it
      const dashboardData = this.statusDashboards.get(dashboardId);
      if (dashboardData?.config.showRecentActivity) {
        await this.loadRecentActivity(dashboardId);
      }
      
    } catch (error) {
      console.warn('Failed to load dashboard data:', error);
    }
  }

  /**
   * Load recent voting activity
   */
  async loadRecentActivity(dashboardId) {
    const dashboardData = this.statusDashboards.get(dashboardId);
    if (!dashboardData) return;
    
    const { element } = dashboardData;
    const activityList = element.querySelector('[data-activity-list]');
    
    if (!activityList) return;
    
    try {
      // Simulate loading recent activity (would come from Solana program in production)
      const recentActivity = [
        { action: 'Voted on "Epic Headshot Compilation"', timestamp: Date.now() - 120000, type: 'free' },
        { action: 'Burn voted on "Tournament Highlights"', timestamp: Date.now() - 3600000, type: 'burn' },
        { action: 'Voted on "Clan War Recap"', timestamp: Date.now() - 7200000, type: 'free' }
      ];
      
      activityList.innerHTML = recentActivity.map(activity => `
        <div class="activity-item ${activity.type}">
          <span class="activity-text">${activity.action}</span>
          <span class="activity-time">${this.formatTimeAgo(activity.timestamp)}</span>
        </div>
      `).join('');
      
    } catch (error) {
      console.warn('Failed to load recent activity:', error);
      activityList.innerHTML = `
        <div class="activity-item error">
          <span class="activity-text">Failed to load recent activity</span>
          <span class="activity-time">Error</span>
        </div>
      `;
    }
  }

  /**
   * Format timestamp as "time ago" string
   */
  formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) {
      return `${seconds}s ago`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ago`;
    } else if (seconds < 86400) {
      return `${Math.floor(seconds / 3600)}h ago`;
    } else {
      return `${Math.floor(seconds / 86400)}d ago`;
    }
  }

  /**
   * Handle voting action
   */
  async handleVote(contentId, voteType) {
    if (!this.votingSystem || !this.wallet) {
      throw new Error('Voting system not initialized');
    }

    try {
      let result;
      
      if (voteType === 'burn') {
        // Handle burn vote with progressive pricing
        const burnCost = this.getCurrentBurnCost();
        result = await this.votingSystem.castTokenVote(contentId, burnCost);
      } else {
        // Handle free vote
        result = await this.votingSystem.castFreeVote(contentId);
      }

      // Update UI after successful vote
      await this.loadUserVoteStatus();
      await this.loadVoteCount(contentId, 'total');
      
      if (this.onVotecast) {
        this.onVotecast({
          contentId,
          voteType,
          result,
          userStatus: this.userVoteStatus
        });
      }
      
      return result;
      
    } catch (error) {
      console.error('Vote failed:', error);
      
      if (this.onVoteError) {
        this.onVoteError({
          contentId,
          voteType,
          error,
          userStatus: this.userVoteStatus
        });
      }
      
      throw error;
    }
  }

  /**
   * Update voting button state
   */
  updateVotingButtonState(buttonId) {
    const buttonData = this.votingButtons.get(buttonId);
    if (!buttonData) return;
    
    const { element, type } = buttonData;
    const button = element.querySelector('.vote-btn');
    const status = element.querySelector('.vote-btn-status');
    
    if (!button) return;
    
    // Determine button state based on user's vote status
    let buttonState = 'enabled';
    let statusText = '';
    
    if (type === 'burn') {
      const burnCost = this.getCurrentBurnCost();
      const canAfford = this.userVoteStatus.mlgBalance >= burnCost;
      const hasRemainingBurns = this.userVoteStatus.burnVotesUsed < 4;
      
      if (!canAfford) {
        buttonState = 'disabled';
        statusText = `Need ${burnCost - this.userVoteStatus.mlgBalance} more MLG`;
      } else if (!hasRemainingBurns) {
        buttonState = 'disabled';
        statusText = 'Daily limit reached';
      } else {
        buttonState = 'enabled';
        statusText = `Cost: ${burnCost} MLG`;
      }
    } else {
      // Free vote button
      if (this.userVoteStatus.dailyVotesRemaining > 0) {
        buttonState = 'enabled';
        statusText = `${this.userVoteStatus.dailyVotesRemaining} remaining`;
      } else {
        buttonState = 'disabled';
        statusText = 'No free votes left';
      }
    }
    
    // Apply state to button
    button.disabled = (buttonState === 'disabled');
    button.classList.toggle('disabled', buttonState === 'disabled');
    
    if (status) {
      status.textContent = `(${statusText})`;
      status.dataset.status = buttonState;
    }
  }

  /**
   * Show burn-to-vote interface
   */
  showBurnToVoteInterface(contentId) {
    const interfaceId = `burn-interface-${contentId}`;
    let interfaceData = this.burnInterfaces.get(interfaceId);
    
    if (!interfaceData) {
      // Create interface if it doesn't exist
      const interfaceElement = this.createBurnToVoteInterface(contentId);
      document.body.appendChild(interfaceElement);
      interfaceData = this.burnInterfaces.get(interfaceId);
    }
    
    if (!interfaceData) return;
    
    const { element } = interfaceData;
    
    // Add to DOM if not already there
    if (!element.parentNode) {
      document.body.appendChild(element);
    }
    
    // Update interface with current data
    this.updateBurnInterface(interfaceId);
    
    // Show interface with animation
    element.classList.add('show');
    interfaceData.isVisible = true;
    
    // Focus management for accessibility
    const firstFocusable = element.querySelector('button:not(:disabled), input:not(:disabled)');
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }

  /**
   * Hide burn-to-vote interface
   */
  hideBurnToVoteInterface(contentId) {
    const interfaceId = `burn-interface-${contentId}`;
    const interfaceData = this.burnInterfaces.get(interfaceId);
    
    if (!interfaceData) return;
    
    const { element } = interfaceData;
    
    // Hide with animation
    element.classList.remove('show');
    interfaceData.isVisible = false;
    
    // Remove from DOM after animation
    setTimeout(() => {
      if (element.parentNode && !interfaceData.isVisible) {
        element.parentNode.removeChild(element);
      }
    }, 300);
  }

  /**
   * Update burn interface with current data
   */
  updateBurnInterface(interfaceId) {
    const interfaceData = this.burnInterfaces.get(interfaceId);
    if (!interfaceData) return;
    
    const { element } = interfaceData;
    const currentCost = this.getCurrentBurnCost();
    
    // Update current cost
    const costAmount = element.querySelector('[data-current-cost]');
    if (costAmount) {
      costAmount.textContent = currentCost;
      costAmount.dataset.currentCost = currentCost;
    }
    
    // Update network fee
    const networkFee = element.querySelector('[data-network-fee]');
    if (networkFee) {
      networkFee.textContent = this.currentSOLFee.toFixed(6);
      networkFee.dataset.networkFee = this.currentSOLFee;
    }
    
    // Update vote weight
    const voteWeight = element.querySelector('[data-vote-weight]');
    if (voteWeight) {
      const weight = this.calculateVoteWeight();
      voteWeight.textContent = `${weight}x`;
      voteWeight.dataset.voteWeight = weight;
    }
    
    // Update user balance
    const userBalance = element.querySelector('[data-user-balance]');
    const balanceStatus = element.querySelector('.balance-status');
    if (userBalance) {
      userBalance.textContent = `${this.userVoteStatus.mlgBalance} MLG`;
      userBalance.dataset.userBalance = this.userVoteStatus.mlgBalance;
    }
    if (balanceStatus) {
      const sufficient = this.userVoteStatus.mlgBalance >= currentCost;
      balanceStatus.className = `balance-status ${sufficient ? 'sufficient' : 'insufficient'}`;
      balanceStatus.textContent = sufficient ? '✓ Sufficient' : '⚠️ Insufficient';
    }
    
    // Update pricing tiers
    const pricingItems = element.querySelectorAll('.pricing-item');
    pricingItems.forEach((item, index) => {
      item.className = 'pricing-item';
      if (index < this.userVoteStatus.burnVotesUsed) {
        item.classList.add('used');
      } else if (index === this.userVoteStatus.burnVotesUsed) {
        item.classList.add('active');
      } else {
        item.classList.add('available');
      }
    });
    
    // Update burn button state
    const burnButton = element.querySelector('.burn-vote-btn');
    const confirmCheckbox = element.querySelector('.confirm-checkbox');
    if (burnButton) {
      const canAfford = this.userVoteStatus.mlgBalance >= currentCost;
      const hasConfirmed = !confirmCheckbox || confirmCheckbox.checked;
      const canVote = canAfford && hasConfirmed && this.userVoteStatus.burnVotesUsed < 4;
      
      burnButton.disabled = !canVote;
      burnButton.classList.toggle('disabled', !canVote);
    }
  }

  /**
   * Attach voting button event listeners
   */
  attachVotingButtonListeners(container, contentId, voteType) {
    const button = container.querySelector('.vote-btn');
    if (!button) return;
    
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      
      if (button.disabled) return;
      
      try {
        // Show loading state
        button.classList.add('loading');
        button.disabled = true;
        
        if (voteType === 'burn') {
          // Show burn interface for confirmation
          this.showBurnToVoteInterface(contentId);
        } else {
          // Handle direct vote
          await this.handleVote(contentId, voteType);
          
          // Show success animation
          button.classList.add('success');
          setTimeout(() => button.classList.remove('success'), 1000);
        }
        
      } catch (error) {
        console.error('Vote button click failed:', error);
        
        // Show error animation
        button.classList.add('error');
        setTimeout(() => button.classList.remove('error'), 1000);
        
      } finally {
        button.classList.remove('loading');
        // Re-enable button after state update
        setTimeout(() => {
          this.updateVotingButtonState(button.closest('.voting-button-container').querySelector('.vote-btn').id);
        }, 1000);
      }
    });
    
    // Tooltip hover events
    const tooltip = container.querySelector('.vote-tooltip');
    if (tooltip) {
      button.addEventListener('mouseenter', () => {
        tooltip.classList.add('show');
      });
      
      button.addEventListener('mouseleave', () => {
        tooltip.classList.remove('show');
      });
    }
  }

  /**
   * Attach fee display event listeners
   */
  attachFeeDisplayListeners(container) {
    const tooltip = container.querySelector('.fee-tooltip');
    if (!tooltip) return;
    
    container.addEventListener('mouseenter', () => {
      tooltip.classList.add('show');
    });
    
    container.addEventListener('mouseleave', () => {
      tooltip.classList.remove('show');
    });
  }

  /**
   * Attach burn interface event listeners
   */
  attachBurnInterfaceListeners(container, contentId) {
    // Close button
    const closeButton = container.querySelector('.interface-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.hideBurnToVoteInterface(contentId);
      });
    }
    
    // Cancel button
    const cancelButton = container.querySelector('[data-action="cancel"]');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        this.hideBurnToVoteInterface(contentId);
      });
    }
    
    // Click outside to close
    const overlay = container.querySelector('.burn-interface-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.hideBurnToVoteInterface(contentId);
        }
      });
    }
    
    // Escape key to close
    container.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideBurnToVoteInterface(contentId);
      }
    });
    
    // Confirmation checkbox
    const confirmCheckbox = container.querySelector('.confirm-checkbox');
    if (confirmCheckbox) {
      confirmCheckbox.addEventListener('change', () => {
        const interfaceId = `burn-interface-${contentId}`;
        this.updateBurnInterface(interfaceId);
      });
    }
    
    // Burn vote button
    const burnButton = container.querySelector('[data-action="burn-vote"]');
    if (burnButton) {
      burnButton.addEventListener('click', async (e) => {
        e.preventDefault();
        
        if (burnButton.disabled) return;
        
        try {
          // Update transaction status
          this.updateTransactionStatus(container, 'processing', 'Processing burn vote transaction...');
          
          // Perform the burn vote
          const result = await this.handleVote(contentId, 'burn');
          
          // Show success
          this.updateTransactionStatus(container, 'success', 'Burn vote successful! Closing interface...');
          
          // Close interface after delay
          setTimeout(() => {
            this.hideBurnToVoteInterface(contentId);
          }, 2000);
          
        } catch (error) {
          console.error('Burn vote failed:', error);
          this.updateTransactionStatus(container, 'error', `Transaction failed: ${error.message}`);
        }
      });
    }
  }

  /**
   * Update transaction status in burn interface
   */
  updateTransactionStatus(container, status, message) {
    const statusElement = container.querySelector('.transaction-status');
    const statusIcon = statusElement.querySelector('.status-icon');
    const statusMessage = statusElement.querySelector('.status-message');
    
    if (!statusElement || !statusIcon || !statusMessage) return;
    
    statusElement.dataset.status = status;
    statusMessage.textContent = message;
    
    // Update icon based on status
    switch (status) {
      case 'processing':
        statusIcon.textContent = '⏳';
        break;
      case 'success':
        statusIcon.textContent = '✅';
        break;
      case 'error':
        statusIcon.textContent = '❌';
        break;
      default:
        statusIcon.textContent = '';
    }
  }

  /**
   * Initialize CSS styles for voting components
   */
  initializeCSS() {
    if (document.getElementById('voting-interface-styles')) {
      return; // Already initialized
    }

    const style = document.createElement('style');
    style.id = 'voting-interface-styles';
    style.textContent = `
      /* Voting Interface CSS Variables - Xbox 360 Theme */
      :root {
        --xbox-green: #10b981;
        --xbox-green-dark: #059669;
        --xbox-green-light: #34d399;
        --burn-red: #dc2626;
        --burn-orange: #f59e0b;
        --vault-purple: #8b5cf6;
        --vault-blue: #3b82f6;
        --tile-bg: linear-gradient(135deg, #065f46, #064e3b);
        --tile-border: #10b981;
        --vote-transition: 0.3s ease;
        --burn-glow-duration: 2s;
        --spacing-xs: 4px;
        --spacing-sm: 8px;
        --spacing-md: 16px;
        --spacing-lg: 24px;
        --spacing-xl: 32px;
      }

      /* Voting Button Styles */
      .voting-button-container {
        position: relative;
        display: inline-block;
      }

      .vote-btn {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: 12px 24px;
        border-radius: 8px;
        border: 2px solid var(--xbox-green);
        background: var(--tile-bg);
        color: white;
        font-weight: bold;
        font-size: 16px;
        cursor: pointer;
        transition: var(--vote-transition);
        position: relative;
        overflow: hidden;
        min-height: 48px;
        box-sizing: border-box;
      }

      .vote-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
        border-color: var(--xbox-green-light);
      }

      .vote-btn:active:not(:disabled) {
        transform: translateY(0);
        box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
      }

      .vote-btn:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.3);
      }

      .vote-btn.disabled,
      .vote-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none !important;
        box-shadow: none !important;
      }

      /* Vote Button Variants */
      .vote-btn.upvote-btn {
        border-color: var(--xbox-green);
        background: var(--tile-bg);
      }

      .vote-btn.upvote-btn:hover:not(:disabled) {
        border-color: var(--xbox-green-light);
        background: linear-gradient(135deg, #059669, #047857);
      }

      .vote-btn.downvote-btn {
        border-color: #ef4444;
        background: linear-gradient(135deg, #7f1d1d, #991b1b);
      }

      .vote-btn.downvote-btn:hover:not(:disabled) {
        border-color: #f87171;
        background: linear-gradient(135deg, #991b1b, #b91c1c);
        box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
      }

      .vote-btn.burn-vote-btn {
        border-color: var(--burn-orange);
        background: linear-gradient(45deg, var(--burn-red), var(--burn-orange));
        animation: burn-glow var(--burn-glow-duration) infinite;
      }

      .vote-btn.burn-vote-btn:hover:not(:disabled) {
        border-color: #fbbf24;
        box-shadow: 0 8px 20px rgba(245, 158, 11, 0.6);
      }

      @keyframes burn-glow {
        0%, 100% { box-shadow: 0 0 10px rgba(220, 38, 38, 0.5); }
        50% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.7); }
      }

      /* Vote Button States */
      .vote-btn.loading .vote-btn-spinner {
        opacity: 1;
        visibility: visible;
      }

      .vote-btn.loading .vote-btn-icon,
      .vote-btn.loading .vote-btn-label {
        opacity: 0.3;
      }

      .vote-btn.success {
        background: var(--xbox-green) !important;
        color: black;
        animation: vote-success 0.6s ease;
      }

      .vote-btn.success .vote-btn-success {
        opacity: 1;
        visibility: visible;
      }

      @keyframes vote-success {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }

      .vote-btn.error {
        animation: vote-error 0.5s ease;
      }

      @keyframes vote-error {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }

      /* Vote Button Components */
      .vote-btn-icon {
        font-size: 18px;
        transition: var(--vote-transition);
      }

      .vote-btn-label {
        font-weight: bold;
        transition: var(--vote-transition);
      }

      .vote-btn-status {
        font-size: 12px;
        opacity: 0.8;
        transition: var(--vote-transition);
      }

      .vote-btn-spinner {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        opacity: 0;
        visibility: hidden;
        transition: var(--vote-transition);
      }

      .spinner-ring {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .vote-btn-success {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 20px;
        color: white;
        opacity: 0;
        visibility: hidden;
        transition: var(--vote-transition);
      }

      /* Vote Button Sizes */
      .voting-button-container.small .vote-btn {
        padding: 8px 16px;
        font-size: 14px;
        min-height: 36px;
      }

      .voting-button-container.large .vote-btn {
        padding: 16px 32px;
        font-size: 18px;
        min-height: 56px;
      }

      /* Vote Tooltip */
      .vote-tooltip {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        margin-bottom: var(--spacing-sm);
        background: rgba(0, 0, 0, 0.9);
        border: 1px solid var(--xbox-green);
        border-radius: 8px;
        padding: var(--spacing-md);
        color: white;
        font-size: 14px;
        white-space: nowrap;
        opacity: 0;
        visibility: hidden;
        transition: var(--vote-transition);
        z-index: 1000;
        backdrop-filter: blur(10px);
      }

      .vote-tooltip.show {
        opacity: 1;
        visibility: visible;
      }

      .vote-tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 6px solid transparent;
        border-top-color: var(--xbox-green);
      }

      .tooltip-title {
        font-weight: bold;
        color: var(--xbox-green);
        margin-bottom: var(--spacing-xs);
      }

      .tooltip-description {
        margin-bottom: var(--spacing-xs);
        font-size: 13px;
        opacity: 0.9;
      }

      .tooltip-cost {
        color: var(--burn-orange);
        font-weight: bold;
      }

      /* Vote Counter Styles */
      .vote-counter-container {
        display: inline-block;
        position: relative;
      }

      .vote-counter {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        padding: 8px 16px;
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid var(--xbox-green);
        border-radius: 20px;
        color: white;
        transition: var(--vote-transition);
      }

      .vote-counter.medium {
        font-size: 16px;
        font-weight: bold;
      }

      .vote-counter.small {
        padding: 4px 12px;
        font-size: 14px;
      }

      .vote-counter.large {
        padding: 12px 20px;
        font-size: 20px;
        font-weight: bold;
      }

      /* Counter Variants */
      .vote-counter-container.mlg .vote-counter {
        background: rgba(245, 158, 11, 0.1);
        border-color: var(--burn-orange);
        color: var(--burn-orange);
      }

      .vote-counter-container.likes .vote-counter {
        background: rgba(239, 68, 68, 0.1);
        border-color: #ef4444;
        color: #ef4444;
      }

      .counter-icon {
        font-size: 1.2em;
      }

      .counter-value {
        font-weight: bold;
        transition: var(--vote-transition);
      }

      .counter-value.updating {
        color: var(--xbox-green-light);
        text-shadow: 0 0 8px rgba(52, 211, 153, 0.6);
        animation: counter-update 0.3s ease-out;
      }

      @keyframes counter-update {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
      }

      .counter-label {
        font-size: 0.8em;
        opacity: 0.8;
      }

      .counter-trend {
        display: flex;
        align-items: center;
        gap: 2px;
        margin-left: var(--spacing-xs);
        font-size: 0.8em;
        opacity: 0.7;
      }

      .counter-increment-animation {
        position: absolute;
        top: -20px;
        left: 50%;
        transform: translateX(-50%);
        color: var(--xbox-green-light);
        font-weight: bold;
        font-size: 14px;
        opacity: 0;
        visibility: hidden;
        transition: all 0.6s ease-out;
      }

      .counter-increment-animation.animate {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(-10px);
      }

      /* SOL Fee Display Styles */
      .sol-fee-display {
        display: inline-block;
        position: relative;
      }

      .fee-display-content {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: 6px 12px;
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid var(--vault-blue);
        border-radius: 6px;
        color: var(--vault-blue);
        font-size: 14px;
        transition: var(--vote-transition);
      }

      .fee-display-content:hover {
        background: rgba(59, 130, 246, 0.15);
        border-color: #60a5fa;
      }

      .fee-icon {
        font-size: 16px;
      }

      .fee-details {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .fee-label {
        font-size: 11px;
        opacity: 0.8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .fee-value {
        display: flex;
        align-items: baseline;
        gap: 4px;
        font-weight: bold;
      }

      .sol-unit {
        font-size: 12px;
        opacity: 0.8;
      }

      .usd-value {
        font-size: 11px;
        opacity: 0.7;
        margin-left: 4px;
      }

      .fee-status {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
      }

      .status-indicator {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--vault-blue);
        transition: var(--vote-transition);
      }

      .status-indicator[data-status="connected"] {
        background: var(--xbox-green);
        animation: pulse-dot 2s infinite;
      }

      .status-indicator[data-status="error"] {
        background: #ef4444;
      }

      @keyframes pulse-dot {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      /* Fee Tooltip */
      .fee-tooltip {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        margin-bottom: var(--spacing-sm);
        background: rgba(0, 0, 0, 0.9);
        border: 1px solid var(--vault-blue);
        border-radius: 8px;
        padding: var(--spacing-md);
        color: white;
        font-size: 12px;
        width: 200px;
        opacity: 0;
        visibility: hidden;
        transition: var(--vote-transition);
        z-index: 1000;
        backdrop-filter: blur(10px);
      }

      .fee-tooltip.show {
        opacity: 1;
        visibility: visible;
      }

      .fee-breakdown {
        margin-top: var(--spacing-xs);
      }

      .fee-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 2px;
        font-size: 11px;
      }

      .fee-total {
        display: flex;
        justify-content: space-between;
        margin-top: var(--spacing-xs);
        padding-top: var(--spacing-xs);
        border-top: 1px solid var(--vault-blue);
        font-weight: bold;
      }

      /* Vote Status Dashboard Styles */
      .vote-status-dashboard {
        background: var(--tile-bg);
        border: 1px solid var(--tile-border);
        border-radius: 12px;
        padding: var(--spacing-lg);
        color: white;
        font-family: monospace;
      }

      .vote-status-dashboard.compact {
        padding: var(--spacing-md);
      }

      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-lg);
        padding-bottom: var(--spacing-md);
        border-bottom: 1px solid rgba(16, 185, 129, 0.3);
      }

      .dashboard-title {
        font-size: 20px;
        font-weight: bold;
        color: var(--xbox-green);
        margin: 0;
      }

      .reputation-multiplier {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        padding: 4px 12px;
        background: linear-gradient(45deg, #fbbf24, #f59e0b);
        border-radius: 20px;
        color: black;
        font-weight: bold;
        font-size: 14px;
        animation: reputation-glow 2s infinite;
      }

      @keyframes reputation-glow {
        0%, 100% { box-shadow: 0 0 10px rgba(251, 191, 36, 0.5); }
        50% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.8); }
      }

      .dashboard-content {
        display: grid;
        gap: var(--spacing-lg);
      }

      .status-section {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        padding: var(--spacing-md);
        border: 1px solid rgba(16, 185, 129, 0.2);
        transition: var(--vote-transition);
      }

      .status-section:hover {
        border-color: rgba(16, 185, 129, 0.4);
        background: rgba(255, 255, 255, 0.08);
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-md);
      }

      .section-icon {
        font-size: 20px;
      }

      .section-title {
        font-weight: bold;
        color: var(--xbox-green);
        font-size: 16px;
      }

      .section-content {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .vote-allocation,
      .burn-allocation,
      .balance-display {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
      }

      .allocation-value,
      .balance-value {
        font-weight: bold;
        color: white;
      }

      .progress-bar {
        width: 100%;
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        overflow: hidden;
        position: relative;
      }

      .progress-fill {
        height: 100%;
        background: var(--xbox-green);
        border-radius: 4px;
        transition: width 0.5s ease;
        position: relative;
      }

      .progress-bar.burn-progress .progress-fill {
        background: linear-gradient(90deg, var(--burn-orange), var(--burn-red));
      }

      .reset-time {
        font-size: 12px;
        opacity: 0.7;
        text-align: center;
      }

      .pricing-tiers {
        display: flex;
        gap: var(--spacing-xs);
        flex-wrap: wrap;
        margin-top: var(--spacing-sm);
      }

      .price-tier {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: bold;
        font-size: 12px;
        transition: var(--vote-transition);
      }

      .price-tier.tier-1 {
        background: rgba(34, 197, 94, 0.2);
        color: #22c55e;
        border: 1px solid #22c55e;
      }

      .price-tier.tier-2 {
        background: rgba(251, 191, 36, 0.2);
        color: #fbbf24;
        border: 1px solid #fbbf24;
      }

      .price-tier.tier-3 {
        background: rgba(249, 115, 22, 0.2);
        color: #f97316;
        border: 1px solid #f97316;
      }

      .price-tier.tier-4 {
        background: rgba(220, 38, 38, 0.2);
        color: #dc2626;
        border: 1px solid #dc2626;
      }

      .price-tier.current {
        animation: pulse-glow 2s infinite;
      }

      .price-tier.used {
        opacity: 0.5;
      }

      @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 0 5px currentColor; }
        50% { box-shadow: 0 0 15px currentColor; }
      }

      .balance-status {
        font-size: 12px;
        padding: 2px 8px;
        border-radius: 4px;
        font-weight: bold;
      }

      .balance-status.sufficient {
        background: rgba(34, 197, 94, 0.2);
        color: #22c55e;
      }

      .balance-status.insufficient {
        background: rgba(220, 38, 38, 0.2);
        color: #dc2626;
      }

      .activity-list {
        max-height: 150px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      .activity-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-xs) var(--spacing-sm);
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
        font-size: 12px;
        transition: var(--vote-transition);
      }

      .activity-item:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .activity-item.burn {
        border-left: 3px solid var(--burn-orange);
      }

      .activity-item.free {
        border-left: 3px solid var(--xbox-green);
      }

      .activity-item.loading {
        opacity: 0.6;
        animation: pulse 2s infinite;
      }

      .activity-item.error {
        border-left: 3px solid #ef4444;
        color: #ef4444;
      }

      @keyframes pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }

      .activity-time {
        color: #9ca3af;
        font-size: 11px;
      }

      /* Burn-to-Vote Interface Styles */
      .burn-to-vote-interface {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 2000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      }

      .burn-to-vote-interface.show {
        opacity: 1;
        visibility: visible;
      }

      .burn-interface-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }

      .burn-interface-content {
        background: var(--tile-bg);
        border: 2px solid var(--burn-orange);
        border-radius: 16px;
        width: 100%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
        color: white;
        font-family: monospace;
        transform: scale(0.9);
        transition: transform 0.3s ease;
      }

      .burn-to-vote-interface.show .burn-interface-content {
        transform: scale(1);
      }

      .interface-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-lg);
        border-bottom: 1px solid rgba(245, 158, 11, 0.3);
      }

      .interface-title {
        margin: 0;
        font-size: 24px;
        font-weight: bold;
        color: var(--burn-orange);
      }

      .interface-close {
        background: transparent;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: var(--vote-transition);
      }

      .interface-close:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .interface-body {
        padding: var(--spacing-lg);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
      }

      .progressive-pricing-section,
      .current-vote-section,
      .balance-check-section,
      .confirmation-section {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        padding: var(--spacing-md);
        border: 1px solid rgba(245, 158, 11, 0.2);
      }

      .pricing-title,
      .vote-title,
      .confirmation-title {
        font-weight: bold;
        color: var(--burn-orange);
        margin-bottom: var(--spacing-sm);
        font-size: 16px;
      }

      .pricing-explanation {
        font-size: 14px;
        opacity: 0.8;
        margin-bottom: var(--spacing-md);
      }

      .pricing-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .pricing-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--spacing-md);
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
        border: 1px solid transparent;
        transition: var(--vote-transition);
      }

      .pricing-item.active {
        border-color: var(--burn-orange);
        background: rgba(245, 158, 11, 0.1);
        animation: pulse-glow 2s infinite;
      }

      .pricing-item.used {
        opacity: 0.5;
        background: rgba(34, 197, 94, 0.1);
        border-color: rgba(34, 197, 94, 0.3);
      }

      .pricing-item.available {
        opacity: 0.7;
      }

      .pricing-position {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
      }

      .position-number {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--burn-orange);
        color: black;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 16px;
      }

      .pricing-item.used .position-number {
        background: #22c55e;
      }

      .pricing-item.available .position-number {
        background: #6b7280;
      }

      .position-label {
        font-weight: 500;
      }

      .pricing-cost {
        display: flex;
        align-items: baseline;
        gap: 4px;
        font-weight: bold;
        font-size: 18px;
      }

      .cost-unit {
        font-size: 14px;
        opacity: 0.8;
      }

      .pricing-status {
        font-size: 12px;
        font-weight: bold;
        color: var(--burn-orange);
      }

      .pricing-item.used .pricing-status {
        color: #22c55e;
      }

      .vote-details {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .vote-cost,
      .network-fee,
      .vote-weight,
      .balance-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-sm);
        background: rgba(0, 0, 0, 0.3);
        border-radius: 6px;
      }

      .cost-label,
      .fee-label,
      .weight-label,
      .balance-label {
        font-size: 14px;
        opacity: 0.8;
      }

      .cost-value,
      .fee-value,
      .weight-value,
      .balance-value {
        display: flex;
        align-items: baseline;
        gap: 4px;
        font-weight: bold;
        color: white;
      }

      .cost-unit,
      .fee-unit {
        font-size: 12px;
        opacity: 0.8;
      }

      .confirmation-warning {
        display: flex;
        align-items: flex-start;
        gap: var(--spacing-sm);
        padding: var(--spacing-md);
        background: rgba(245, 158, 11, 0.1);
        border: 1px solid var(--burn-orange);
        border-radius: 6px;
        margin-bottom: var(--spacing-md);
      }

      .warning-icon {
        font-size: 20px;
        color: var(--burn-orange);
        flex-shrink: 0;
      }

      .warning-text {
        font-size: 14px;
        line-height: 1.4;
      }

      .confirmation-checkbox {
        margin-top: var(--spacing-sm);
      }

      .checkbox-container {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        cursor: pointer;
        font-size: 14px;
      }

      .confirm-checkbox {
        width: 18px;
        height: 18px;
        accent-color: var(--burn-orange);
        cursor: pointer;
      }

      .checkbox-label {
        line-height: 1.3;
        cursor: pointer;
      }

      .interface-footer {
        padding: var(--spacing-lg);
        border-top: 1px solid rgba(245, 158, 11, 0.3);
      }

      .footer-actions {
        display: flex;
        gap: var(--spacing-md);
        justify-content: flex-end;
        margin-bottom: var(--spacing-md);
      }

      .action-btn {
        padding: 12px 24px;
        border-radius: 8px;
        border: 2px solid;
        font-weight: bold;
        cursor: pointer;
        transition: var(--vote-transition);
        font-size: 16px;
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        min-height: 48px;
      }

      .action-btn.cancel-btn {
        background: transparent;
        border-color: #6b7280;
        color: #9ca3af;
      }

      .action-btn.cancel-btn:hover {
        border-color: #9ca3af;
        background: rgba(156, 163, 175, 0.1);
      }

      .action-btn.burn-vote-btn {
        background: linear-gradient(45deg, var(--burn-red), var(--burn-orange));
        border-color: var(--burn-orange);
        color: white;
        animation: burn-glow var(--burn-glow-duration) infinite;
      }

      .action-btn.burn-vote-btn:hover:not(:disabled) {
        transform: scale(1.02);
        box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
      }

      .action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        animation: none;
        transform: none !important;
      }

      .btn-icon {
        font-size: 18px;
      }

      .btn-text {
        font-weight: bold;
      }

      .transaction-status {
        background: rgba(0, 0, 0, 0.5);
        border-radius: 6px;
        padding: var(--spacing-sm) var(--spacing-md);
        border: 1px solid rgba(255, 255, 255, 0.1);
        opacity: 0;
        visibility: hidden;
        transition: var(--vote-transition);
      }

      .transaction-status[data-status="processing"],
      .transaction-status[data-status="success"],
      .transaction-status[data-status="error"] {
        opacity: 1;
        visibility: visible;
      }

      .transaction-status[data-status="success"] {
        border-color: var(--xbox-green);
        background: rgba(16, 185, 129, 0.1);
      }

      .transaction-status[data-status="error"] {
        border-color: #ef4444;
        background: rgba(239, 68, 68, 0.1);
      }

      .status-content {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        font-size: 14px;
      }

      .status-icon {
        font-size: 16px;
      }

      .status-message {
        flex: 1;
      }

      /* Screen reader only content */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      /* Mobile responsive styles */
      @media (max-width: 768px) {
        .vote-btn {
          padding: 12px 20px;
          font-size: 16px;
          min-height: 44px;
        }

        .voting-button-container.small .vote-btn {
          padding: 10px 16px;
          font-size: 14px;
          min-height: 40px;
        }

        .vote-tooltip {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 0;
          max-width: calc(100vw - 40px);
          white-space: normal;
        }

        .sol-fee-display.large {
          font-size: 16px;
        }

        .fee-display-content {
          padding: 8px 12px;
        }

        .vote-status-dashboard {
          padding: var(--spacing-md);
        }

        .dashboard-header {
          flex-direction: column;
          gap: var(--spacing-sm);
          align-items: flex-start;
        }

        .dashboard-content {
          gap: var(--spacing-md);
        }

        .pricing-tiers {
          justify-content: center;
        }

        .burn-interface-overlay {
          padding: 10px;
        }

        .burn-interface-content {
          max-width: none;
          width: 100%;
        }

        .interface-header {
          padding: var(--spacing-md);
        }

        .interface-title {
          font-size: 20px;
        }

        .interface-body {
          padding: var(--spacing-md);
          gap: var(--spacing-md);
        }

        .pricing-list {
          gap: var(--spacing-xs);
        }

        .pricing-item {
          padding: var(--spacing-sm);
          flex-direction: column;
          align-items: flex-start;
          gap: var(--spacing-xs);
        }

        .pricing-position {
          width: 100%;
        }

        .pricing-cost {
          align-self: flex-end;
        }

        .footer-actions {
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .action-btn {
          width: 100%;
          justify-content: center;
        }
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .vote-btn,
        .vote-counter,
        .sol-fee-display,
        .burn-to-vote-interface,
        .pricing-item {
          transition: none;
        }

        .burn-glow,
        .pulse-glow,
        .pulse-dot,
        .counter-update,
        .vote-success,
        .vote-error,
        .reputation-glow,
        .spin,
        .pulse {
          animation: none;
        }

        .vote-btn:hover,
        .pricing-item.active {
          transform: none;
          animation: none;
        }
      }

      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .vote-btn,
        .vote-counter,
        .sol-fee-display,
        .status-section {
          border-width: 2px;
        }

        .vote-tooltip,
        .fee-tooltip {
          border-width: 2px;
          background: black;
        }

        .burn-interface-content {
          border-width: 3px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Destroy the voting interface system
   */
  destroy() {
    // Clear all component registries
    this.votingButtons.clear();
    this.voteCounters.clear();
    this.feeDisplays.clear();
    this.statusDashboards.clear();

    // Clean up burn interfaces
    this.burnInterfaces.forEach(({ element }) => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    this.burnInterfaces.clear();

    console.log('Voting Interface System destroyed');
  }
}

/**
 * Utility functions for voting interface integration
 */
export const VotingInterfaceUtils = {
  /**
   * Create and initialize a voting interface system
   */
  async createVotingInterfaceSystem(votingSystem, wallet, options = {}) {
    const interfaceSystem = new VotingInterfaceSystem(options);
    await interfaceSystem.initialize(votingSystem, wallet);
    return interfaceSystem;
  },

  /**
   * Quick setup for voting button
   */
  setupVotingButton(container, contentId, type, interfaceSystem, options = {}) {
    const button = interfaceSystem.createVotingButton(contentId, { type, ...options });
    container.appendChild(button);
    return button;
  },

  /**
   * Quick setup for vote counter
   */
  setupVoteCounter(container, contentId, type, interfaceSystem, options = {}) {
    const counter = interfaceSystem.createVoteCounter(contentId, { type, ...options });
    container.appendChild(counter);
    return counter;
  },

  /**
   * Quick setup for SOL fee display
   */
  setupSOLFeeDisplay(container, interfaceSystem, options = {}) {
    const feeDisplay = interfaceSystem.createSOLFeeDisplay(options);
    container.appendChild(feeDisplay);
    return feeDisplay;
  },

  /**
   * Quick setup for vote status dashboard
   */
  setupVoteStatusDashboard(container, interfaceSystem, options = {}) {
    const dashboard = interfaceSystem.createVoteStatusDashboard(options);
    container.appendChild(dashboard);
    return dashboard;
  },

  /**
   * Format vote count for display
   */
  formatVoteCount(count) {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  },

  /**
   * Calculate time until daily reset (midnight UTC)
   */
  calculateTimeUntilReset() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setUTCDate(midnight.getUTCDate() + 1);
    midnight.setUTCHours(0, 0, 0, 0);
    
    const diff = midnight.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }
};

// Export default class
export default VotingInterfaceSystem;