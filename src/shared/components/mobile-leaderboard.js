/**
 * MLG.clan Mobile-Optimized Leaderboard
 * 
 * Vertical mobile leaderboard design optimized for gaming
 * Features mobile-first responsive design with touch interactions
 * 
 * Features:
 * - Vertical card-based layout for mobile
 * - Touch-friendly player cards
 * - Swipe-to-refresh functionality
 * - Infinite scroll for large leaderboards
 * - Real-time rank updates
 * - Mobile-optimized animations
 * - Gaming achievement displays
 * - Clan affiliation indicators
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 */

import { 
  generateGamingClasses, 
  getTouchOptimizedClasses,
  deviceUtils,
  touchUtils,
  responsivePatterns,
  createResponsiveImage
} from './ui/utils.js';

/**
 * Mobile Leaderboard Configuration
 */
const MOBILE_LEADERBOARD_CONFIG = {
  // Layout settings
  CARD_MIN_HEIGHT: '80px',
  COMPACT_CARD_HEIGHT: '60px',
  EXPANDED_CARD_HEIGHT: '120px',
  
  // Touch interaction
  SWIPE_REFRESH_THRESHOLD: 60,
  PULL_TO_REFRESH_THRESHOLD: 80,
  
  // Performance
  ITEMS_PER_PAGE: 20,
  VIRTUAL_SCROLL_BUFFER: 5,
  UPDATE_ANIMATION_DELAY: 100,
  
  // Real-time updates
  RANK_CHANGE_ANIMATION_DURATION: 500,
  HIGHLIGHT_DURATION: 2000
};

/**
 * Mobile Leaderboard Component
 * Provides touch-optimized leaderboard experience
 */
export class MobileLeaderboard {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      type: 'global', // global, clan, weekly, etc.
      showRankChanges: true,
      enablePullToRefresh: true,
      enableInfiniteScroll: true,
      showAchievements: true,
      showClanInfo: true,
      compact: false,
      ...options
    };
    
    this.state = {
      leaderboardData: [],
      currentPage: 1,
      isLoading: false,
      isRefreshing: false,
      hasMore: true,
      userRank: null,
      selectedPlayer: null
    };
    
    this.touchState = {
      startY: 0,
      currentY: 0,
      isPulling: false,
      pullDistance: 0
    };
    
    this.init();
  }

  /**
   * Initialize mobile leaderboard
   */
  init() {
    this.createMobileLayout();
    this.setupTouchHandlers();
    this.setupScrollHandlers();
    this.loadLeaderboardData();
    
    if (deviceUtils.isTouchDevice()) {
      this.enableMobileOptimizations();
    }
  }

  /**
   * Create mobile-optimized leaderboard layout
   */
  createMobileLayout() {
    this.container.innerHTML = `
      <div class="mobile-leaderboard-container ${generateGamingClasses('leaderboard')}">
        <!-- Mobile Header -->
        <div class="mobile-leaderboard-header ${this.getHeaderClasses()}">
          <div class="header-content">
            <h2 class="${generateGamingClasses('gamingHeader')}">
              ${this.getLeaderboardTitle()}
            </h2>
            <div class="leaderboard-stats">
              <span class="total-players">-- players</span>
              <span class="last-updated">Last updated: --</span>
            </div>
          </div>
          
          <div class="header-actions">
            <button class="refresh-btn ${this.getRefreshButtonClasses()}" 
                    data-action="refresh">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8c3.74 0 6.85-2.54 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
              Refresh
            </button>
            
            <button class="filter-btn ${this.getFilterButtonClasses()}"
                    data-action="filter">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/>
              </svg>
              Filter
            </button>
          </div>
        </div>

        <!-- Pull to Refresh Indicator -->
        ${this.options.enablePullToRefresh ? this.createPullToRefreshIndicator() : ''}

        <!-- User Rank Card (if applicable) -->
        <div class="user-rank-card ${this.getUserRankCardClasses()}">
          <div class="rank-card-content">
            <div class="rank-position">
              <span class="rank-number">--</span>
              <span class="rank-label">Your Rank</span>
            </div>
            <div class="rank-details">
              <span class="player-name">--</span>
              <span class="player-score">-- MLG</span>
            </div>
            <div class="rank-change">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="change-icon">
                <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
              </svg>
              <span class="change-value">--</span>
            </div>
          </div>
        </div>

        <!-- Leaderboard List -->
        <div class="leaderboard-list ${this.getLeaderboardListClasses()}">
          <!-- Leaderboard items will be inserted here -->
        </div>

        <!-- Loading States -->
        <div class="loading-container">
          <div class="initial-loading hidden">
            ${this.createLoadingState()}
          </div>
          
          <div class="infinite-loading hidden">
            ${this.createInfiniteLoadingState()}
          </div>
        </div>

        <!-- Empty State -->
        <div class="empty-state hidden ${this.getEmptyStateClasses()}">
          <div class="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h3>No Rankings Yet</h3>
          <p>Be the first to compete and claim the top spot!</p>
        </div>
      </div>
    `;

    this.bindMobileEvents();
  }

  /**
   * Create pull-to-refresh indicator
   */
  createPullToRefreshIndicator() {
    return `
      <div class="pull-to-refresh-indicator">
        <div class="refresh-spinner">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8c3.74 0 6.85-2.54 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </div>
        <span class="refresh-text">Pull to refresh</span>
      </div>
    `;
  }

  /**
   * Create loading state
   */
  createLoadingState() {
    return `
      <div class="loading-content">
        <div class="loading-spinner">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" 
                    fill="none" stroke-dasharray="32" stroke-dashoffset="32">
              <animate attributeName="stroke-dashoffset" dur="1s" 
                       values="32;0" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>
        <p>Loading leaderboard...</p>
      </div>
    `;
  }

  /**
   * Create infinite loading state
   */
  createInfiniteLoadingState() {
    return `
      <div class="infinite-loading-content">
        <div class="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p>Loading more players...</p>
      </div>
    `;
  }

  /**
   * Create individual leaderboard item
   */
  createLeaderboardItem(player, index) {
    const rank = index + 1;
    const isTopThree = rank <= 3;
    const isUser = player.isCurrentUser;
    const hasRankChange = player.rankChange !== undefined;
    
    return `
      <div class="leaderboard-item ${this.getLeaderboardItemClasses(rank, isUser)}"
           data-player-id="${player.id}">
        
        <!-- Rank Badge -->
        <div class="rank-badge ${this.getRankBadgeClasses(rank)}">
          ${isTopThree ? this.getRankIcon(rank) : `<span class="rank-number">${rank}</span>`}
        </div>

        <!-- Player Avatar -->
        <div class="player-avatar ${this.getAvatarClasses()}">
          <img src="${player.avatar || '/assets/icons/default-avatar.png'}" 
               alt="${player.name}"
               loading="lazy">
          ${player.isOnline ? '<div class="online-indicator"></div>' : ''}
        </div>

        <!-- Player Info -->
        <div class="player-info">
          <div class="player-name-row">
            <span class="player-name">${player.name}</span>
            ${hasRankChange ? this.createRankChangeIndicator(player.rankChange) : ''}
          </div>
          
          <div class="player-details">
            ${this.options.showClanInfo && player.clan ? 
              `<span class="clan-tag">[${player.clan}]</span>` : ''}
            <span class="player-level">Level ${player.level || '--'}</span>
          </div>
          
          ${this.options.showAchievements && player.achievements ? 
            this.createAchievementIcons(player.achievements) : ''}
        </div>

        <!-- Player Stats -->
        <div class="player-stats">
          <div class="primary-stat">
            <span class="stat-value">${this.formatStatValue(player.score)}</span>
            <span class="stat-label">${this.getStatLabel()}</span>
          </div>
          
          ${player.secondaryStats ? this.createSecondaryStats(player.secondaryStats) : ''}
        </div>

        <!-- Action Button -->
        <div class="player-actions">
          <button class="view-profile-btn ${getTouchOptimizedClasses(touchUtils.touchTarget)}"
                  data-action="view-profile"
                  data-player-id="${player.id}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Create rank change indicator
   */
  createRankChangeIndicator(rankChange) {
    const isPositive = rankChange > 0;
    const isNegative = rankChange < 0;
    
    if (rankChange === 0) return '';
    
    return `
      <div class="rank-change ${isPositive ? 'positive' : 'negative'}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="${isPositive ? 
            'M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z' : 
            'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z'}"/>
        </svg>
        <span>${Math.abs(rankChange)}</span>
      </div>
    `;
  }

  /**
   * Create achievement icons
   */
  createAchievementIcons(achievements) {
    const displayAchievements = achievements.slice(0, 3); // Show max 3
    
    return `
      <div class="achievement-icons">
        ${displayAchievements.map(achievement => `
          <div class="achievement-icon" title="${achievement.name}">
            <img src="${achievement.icon}" alt="${achievement.name}" width="16" height="16">
          </div>
        `).join('')}
        ${achievements.length > 3 ? `<span class="more-achievements">+${achievements.length - 3}</span>` : ''}
      </div>
    `;
  }

  /**
   * Create secondary stats
   */
  createSecondaryStats(stats) {
    return `
      <div class="secondary-stats">
        ${Object.entries(stats).slice(0, 2).map(([key, value]) => `
          <div class="secondary-stat">
            <span class="stat-value">${value}</span>
            <span class="stat-label">${key}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Get rank icon for top 3
   */
  getRankIcon(rank) {
    const icons = {
      1: '🥇',
      2: '🥈', 
      3: '🥉'
    };
    return `<span class="rank-icon">${icons[rank] || rank}</span>`;
  }

  /**
   * Get responsive CSS classes
   */
  getHeaderClasses() {
    return generateGamingClasses('gamingCard', {
      base: 'bg-gaming-surface border-b border-tile-border p-4 sticky top-0 z-10',
      sm: 'p-6'
    });
  }

  getRefreshButtonClasses() {
    return getTouchOptimizedClasses(
      `${touchUtils.touchTarget} flex items-center gap-2 px-3 py-2 bg-tile-bg-primary border border-tile-border rounded-lg text-gaming-accent transition-all duration-200 active:scale-95`
    );
  }

  getFilterButtonClasses() {
    return getTouchOptimizedClasses(
      `${touchUtils.touchTarget} flex items-center gap-2 px-3 py-2 bg-tile-bg-primary border border-tile-border rounded-lg text-gray-300 transition-all duration-200 active:scale-95`
    );
  }

  getUserRankCardClasses() {
    return generateGamingClasses('gamingCard', {
      base: 'bg-gradient-to-r from-gaming-purple to-gaming-blue p-4 mx-4 rounded-lg mb-4',
      sm: 'mx-6 p-6'
    });
  }

  getLeaderboardListClasses() {
    return generateGamingClasses('leaderboard', {
      base: 'flex flex-col gap-2 p-4',
      sm: 'gap-3 p-6'
    });
  }

  getLeaderboardItemClasses(rank, isUser) {
    const baseClasses = 'flex items-center gap-3 p-3 bg-tile-bg-primary border border-tile-border rounded-lg transition-all duration-200';
    const userClasses = isUser ? 'border-gaming-accent bg-tile-hover' : '';
    const topThreeClasses = rank <= 3 ? 'border-gaming-yellow bg-gradient-to-r from-gaming-yellow/10 to-transparent' : '';
    
    return getTouchOptimizedClasses(`${baseClasses} ${userClasses} ${topThreeClasses} active:scale-95`);
  }

  getRankBadgeClasses(rank) {
    const baseClasses = 'flex items-center justify-center w-12 h-12 rounded-full font-bold';
    if (rank === 1) return `${baseClasses} bg-yellow-500 text-black`;
    if (rank === 2) return `${baseClasses} bg-gray-400 text-black`;
    if (rank === 3) return `${baseClasses} bg-orange-600 text-white`;
    return `${baseClasses} bg-gaming-surface text-gaming-accent border border-tile-border`;
  }

  getAvatarClasses() {
    return 'relative w-12 h-12 rounded-full overflow-hidden bg-gaming-surface border border-tile-border';
  }

  getEmptyStateClasses() {
    return 'flex flex-col items-center justify-center py-16 text-center text-gray-400';
  }

  /**
   * Get leaderboard title based on type
   */
  getLeaderboardTitle() {
    const titles = {
      global: 'Global Leaderboard',
      clan: 'Clan Rankings',
      weekly: 'Weekly Champions',
      tournament: 'Tournament Standings'
    };
    return titles[this.options.type] || 'Leaderboard';
  }

  /**
   * Get stat label based on leaderboard type
   */
  getStatLabel() {
    const labels = {
      global: 'MLG Burned',
      clan: 'Clan Points',
      weekly: 'Weekly Score',
      tournament: 'Tournament Points'
    };
    return labels[this.options.type] || 'Score';
  }

  /**
   * Format stat value for display
   */
  formatStatValue(value) {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  }

  /**
   * Setup touch event handlers
   */
  setupTouchHandlers() {
    if (!this.options.enablePullToRefresh) return;

    const container = this.container.querySelector('.mobile-leaderboard-container');
    
    container.addEventListener('touchstart', (e) => {
      this.handleTouchStart(e);
    }, { passive: false });

    container.addEventListener('touchmove', (e) => {
      this.handleTouchMove(e);
    }, { passive: false });

    container.addEventListener('touchend', (e) => {
      this.handleTouchEnd(e);
    }, { passive: false });
  }

  /**
   * Handle touch start for pull-to-refresh
   */
  handleTouchStart(e) {
    const touch = e.touches[0];
    this.touchState.startY = touch.clientY;
    this.touchState.currentY = touch.clientY;
    this.touchState.isPulling = false;
    this.touchState.pullDistance = 0;
  }

  /**
   * Handle touch move for pull-to-refresh
   */
  handleTouchMove(e) {
    if (this.state.isRefreshing) return;

    const touch = e.touches[0];
    this.touchState.currentY = touch.clientY;
    
    const deltaY = this.touchState.currentY - this.touchState.startY;
    const scrollTop = this.container.scrollTop;

    // Only trigger pull-to-refresh at the top of the list
    if (scrollTop === 0 && deltaY > 0) {
      this.touchState.isPulling = true;
      this.touchState.pullDistance = Math.min(deltaY, MOBILE_LEADERBOARD_CONFIG.PULL_TO_REFRESH_THRESHOLD * 2);
      
      e.preventDefault();
      this.updatePullToRefreshIndicator(this.touchState.pullDistance);
    }
  }

  /**
   * Handle touch end for pull-to-refresh
   */
  handleTouchEnd(e) {
    if (!this.touchState.isPulling) return;

    if (this.touchState.pullDistance >= MOBILE_LEADERBOARD_CONFIG.PULL_TO_REFRESH_THRESHOLD) {
      this.triggerRefresh();
    }

    this.resetPullToRefresh();
  }

  /**
   * Update pull-to-refresh visual indicator
   */
  updatePullToRefreshIndicator(distance) {
    const indicator = this.container.querySelector('.pull-to-refresh-indicator');
    if (!indicator) return;

    const progress = Math.min(distance / MOBILE_LEADERBOARD_CONFIG.PULL_TO_REFRESH_THRESHOLD, 1);
    const rotation = progress * 180;

    indicator.style.transform = `translateY(${distance}px)`;
    indicator.style.opacity = Math.min(progress, 1);
    
    const spinner = indicator.querySelector('.refresh-spinner svg');
    spinner.style.transform = `rotate(${rotation}deg)`;

    const text = indicator.querySelector('.refresh-text');
    text.textContent = progress >= 1 ? 'Release to refresh' : 'Pull to refresh';
  }

  /**
   * Reset pull-to-refresh state
   */
  resetPullToRefresh() {
    const indicator = this.container.querySelector('.pull-to-refresh-indicator');
    if (indicator) {
      indicator.style.transform = '';
      indicator.style.opacity = '';
    }

    this.touchState.isPulling = false;
    this.touchState.pullDistance = 0;
  }

  /**
   * Setup scroll handlers for infinite scroll
   */
  setupScrollHandlers() {
    if (!this.options.enableInfiniteScroll) return;

    const container = this.container;
    let isScrolling = false;

    container.addEventListener('scroll', () => {
      if (isScrolling) return;
      
      isScrolling = true;
      requestAnimationFrame(() => {
        this.handleScroll();
        isScrolling = false;
      });
    });
  }

  /**
   * Handle scroll for infinite loading
   */
  handleScroll() {
    if (this.state.isLoading || !this.state.hasMore) return;

    const container = this.container;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    // Load more when near bottom
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      this.loadMoreData();
    }
  }

  /**
   * Bind mobile-specific events
   */
  bindMobileEvents() {
    // Action button handlers
    this.container.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      const playerId = e.target.closest('[data-player-id]')?.dataset.playerId;
      
      if (action) {
        this.handleAction(action, playerId);
      }
    });

    // Long press for additional options
    this.container.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const playerItem = e.target.closest('.leaderboard-item');
      if (playerItem) {
        this.handlePlayerLongPress(playerItem);
      }
    });
  }

  /**
   * Enable mobile-specific optimizations
   */
  enableMobileOptimizations() {
    // Optimize scrolling performance
    this.container.style.webkitOverflowScrolling = 'touch';
    this.container.style.overscrollBehavior = 'contain';
  }

  /**
   * Handle action buttons
   */
  handleAction(action, playerId) {
    switch (action) {
      case 'refresh':
        this.triggerRefresh();
        break;
      case 'filter':
        this.showFilterModal();
        break;
      case 'view-profile':
        this.viewPlayerProfile(playerId);
        break;
    }
  }

  /**
   * Handle player long press
   */
  handlePlayerLongPress(playerItem) {
    const playerId = playerItem.dataset.playerId;
    // Show context menu with options like: View Profile, Send Message, Add Friend, etc.
    console.log('Long press on player:', playerId);
  }

  /**
   * Trigger refresh
   */
  async triggerRefresh() {
    if (this.state.isRefreshing) return;

    this.state.isRefreshing = true;
    this.showRefreshingState();

    try {
      await this.loadLeaderboardData(true);
    } finally {
      this.state.isRefreshing = false;
      this.hideRefreshingState();
    }
  }

  /**
   * Load leaderboard data
   */
  async loadLeaderboardData(refresh = false) {
    if (this.state.isLoading && !refresh) return;

    this.state.isLoading = true;
    
    if (refresh) {
      this.state.currentPage = 1;
      this.state.hasMore = true;
    }

    try {
      // Simulate API call
      const mockData = this.generateMockData();
      
      if (refresh) {
        this.state.leaderboardData = mockData;
      } else {
        this.state.leaderboardData.push(...mockData);
      }

      this.renderLeaderboard();
      
    } catch (error) {
      console.error('Failed to load leaderboard data:', error);
      this.showErrorState();
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * Load more data for infinite scroll
   */
  async loadMoreData() {
    if (this.state.isLoading || !this.state.hasMore) return;

    this.showInfiniteLoading();
    
    try {
      this.state.currentPage++;
      await this.loadLeaderboardData();
    } finally {
      this.hideInfiniteLoading();
    }
  }

  /**
   * Render leaderboard
   */
  renderLeaderboard() {
    const list = this.container.querySelector('.leaderboard-list');
    
    if (this.state.leaderboardData.length === 0) {
      this.showEmptyState();
      return;
    }

    this.hideEmptyState();
    
    const html = this.state.leaderboardData.map((player, index) => 
      this.createLeaderboardItem(player, index)
    ).join('');

    list.innerHTML = html;
    
    // Update stats
    this.updateHeaderStats();
  }

  /**
   * Generate mock data for testing
   */
  generateMockData() {
    const names = ['XxProGamerxX', 'SnipeKing', 'ClanDestroyer', 'NoobSlayer', 'GamingLegend'];
    const clans = ['MLG', 'PROS', 'ELITE', 'GODS', 'KINGS'];
    
    return Array.from({ length: 20 }, (_, i) => ({
      id: `player-${this.state.currentPage}-${i}`,
      name: names[Math.floor(Math.random() * names.length)] + (Math.floor(Math.random() * 999) + 1),
      avatar: `/assets/avatars/avatar-${(i % 10) + 1}.png`,
      score: Math.floor(Math.random() * 100000) + 1000,
      level: Math.floor(Math.random() * 100) + 1,
      clan: Math.random() > 0.3 ? clans[Math.floor(Math.random() * clans.length)] : null,
      isOnline: Math.random() > 0.4,
      isCurrentUser: i === 0 && this.state.currentPage === 1,
      rankChange: Math.floor(Math.random() * 21) - 10, // -10 to +10
      achievements: Array.from({ length: Math.floor(Math.random() * 5) }, (_, j) => ({
        name: `Achievement ${j + 1}`,
        icon: `/assets/achievements/achievement-${j + 1}.png`
      })),
      secondaryStats: {
        Wins: Math.floor(Math.random() * 1000),
        'Win Rate': `${Math.floor(Math.random() * 100)}%`
      }
    }));
  }

  /**
   * Update header statistics
   */
  updateHeaderStats() {
    const totalPlayers = this.container.querySelector('.total-players');
    const lastUpdated = this.container.querySelector('.last-updated');

    if (totalPlayers) {
      totalPlayers.textContent = `${this.state.leaderboardData.length}+ players`;
    }

    if (lastUpdated) {
      lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    }
  }

  /**
   * Show various states
   */
  showRefreshingState() {
    // Add refreshing animation to header
    const refreshBtn = this.container.querySelector('.refresh-btn svg');
    refreshBtn?.classList.add('animate-spin');
  }

  hideRefreshingState() {
    const refreshBtn = this.container.querySelector('.refresh-btn svg');
    refreshBtn?.classList.remove('animate-spin');
  }

  showInfiniteLoading() {
    const loading = this.container.querySelector('.infinite-loading');
    loading?.classList.remove('hidden');
  }

  hideInfiniteLoading() {
    const loading = this.container.querySelector('.infinite-loading');
    loading?.classList.add('hidden');
  }

  showEmptyState() {
    const emptyState = this.container.querySelector('.empty-state');
    emptyState?.classList.remove('hidden');
  }

  hideEmptyState() {
    const emptyState = this.container.querySelector('.empty-state');
    emptyState?.classList.add('hidden');
  }

  showErrorState() {
    // Show error toast or modal
    console.error('Error state - implement error UI');
  }

  /**
   * Show filter modal
   */
  showFilterModal() {
    // Implement filter modal
    console.log('Show filter modal');
  }

  /**
   * View player profile
   */
  viewPlayerProfile(playerId) {
    // Navigate to player profile
    console.log('View player profile:', playerId);
  }

  /**
   * Destroy component and cleanup
   */
  destroy() {
    // Clean up event listeners and state
    this.state = {};
    this.touchState = {};
    this.container.innerHTML = '';
  }
}

/**
 * Mobile Leaderboard Styles
 */
export const mobileLeaderboardStyles = `
  .mobile-leaderboard-container {
    height: 100vh;
    overflow-y: auto;
    background: var(--gaming-bg);
    color: white;
  }

  .mobile-leaderboard-header {
    backdrop-filter: blur(10px);
  }

  .header-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .leaderboard-stats {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .header-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .pull-to-refresh-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    color: var(--gaming-accent);
    transform: translateY(-100%);
    transition: all 0.3s ease;
  }

  .refresh-spinner svg {
    transition: transform 0.3s ease;
  }

  .user-rank-card {
    position: relative;
    overflow: hidden;
  }

  .rank-card-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .rank-position {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .rank-number {
    font-size: 2rem;
    font-weight: 900;
    color: white;
  }

  .rank-label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.8);
  }

  .leaderboard-item {
    position: relative;
    background: var(--tile-bg-primary);
    border: 1px solid var(--tile-border);
    border-radius: 8px;
    min-height: ${MOBILE_LEADERBOARD_CONFIG.CARD_MIN_HEIGHT};
  }

  .rank-badge {
    flex-shrink: 0;
  }

  .rank-number {
    font-size: 1.125rem;
    font-weight: 700;
  }

  .rank-icon {
    font-size: 1.5rem;
  }

  .player-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .online-indicator {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 12px;
    height: 12px;
    background: var(--gaming-accent);
    border: 2px solid var(--gaming-surface);
    border-radius: 50%;
  }

  .player-info {
    flex: 1;
    min-width: 0;
  }

  .player-name-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .player-name {
    font-weight: 600;
    color: white;
    truncate;
  }

  .rank-change {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    padding: 0.125rem 0.25rem;
    border-radius: 4px;
  }

  .rank-change.positive {
    color: var(--gaming-accent);
    background: rgba(0, 255, 136, 0.1);
  }

  .rank-change.negative {
    color: var(--gaming-red);
    background: rgba(239, 68, 68, 0.1);
  }

  .player-details {
    display: flex;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 0.25rem;
  }

  .clan-tag {
    color: var(--gaming-accent);
  }

  .achievement-icons {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-top: 0.25rem;
  }

  .achievement-icon img {
    border-radius: 2px;
  }

  .more-achievements {
    font-size: 0.625rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .player-stats {
    text-align: right;
    flex-shrink: 0;
  }

  .primary-stat {
    display: flex;
    flex-direction: column;
  }

  .stat-value {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--gaming-accent);
  }

  .stat-label {
    font-size: 0.625rem;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
  }

  .secondary-stats {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }

  .secondary-stat {
    display: flex;
    flex-direction: column;
    font-size: 0.75rem;
  }

  .player-actions {
    flex-shrink: 0;
    margin-left: 0.5rem;
  }

  .view-profile-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--tile-bg-secondary);
    border: 1px solid var(--tile-border);
    border-radius: 50%;
    color: var(--gaming-accent);
    transition: all 0.2s ease;
  }

  .view-profile-btn:active {
    transform: scale(0.9);
    background: var(--tile-hover);
  }

  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .infinite-loading-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    color: rgba(255, 255, 255, 0.7);
    justify-content: center;
  }

  .loading-dots {
    display: flex;
    gap: 0.25rem;
  }

  .loading-dots span {
    width: 6px;
    height: 6px;
    background: var(--gaming-accent);
    border-radius: 50%;
    animation: loadingDots 1.4s infinite ease-in-out;
  }

  .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
  .loading-dots span:nth-child(2) { animation-delay: -0.16s; }

  @keyframes loadingDots {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }

  @media (max-width: 640px) {
    .mobile-leaderboard-header {
      padding: 1rem;
    }
    
    .leaderboard-list {
      padding: 1rem;
      gap: 0.5rem;
    }
    
    .leaderboard-item {
      gap: 0.75rem;
      padding: 0.75rem;
    }
    
    .rank-badge {
      width: 10px;
      height: 10px;
    }
    
    .player-avatar {
      width: 10px;
      height: 10px;
    }
  }
`;

export default MobileLeaderboard;