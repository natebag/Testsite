/**
 * MLG.clan Content Sorting Interface
 * Sub-task 4.5: Implement content sorting (by votes, recency, trending)
 * 
 * Production-ready content sorting and display interface with Xbox 360 retro aesthetic
 * Integrates with content ranking algorithm and MLG token voting system
 */

import { ContentRankingAlgorithm } from '../../content/content-ranking-algorithm.js';

/**
 * Content Sorting Interface Component
 * Handles content display, sorting, filtering, and voting integration
 */
export class ContentSortingInterface {
  constructor(config = {}) {
    this.config = {
      containerId: 'content-sorting-container',
      apiEndpoint: '/api/content',
      mlgTokenContract: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL',
      itemsPerPage: 20,
      autoRefresh: true,
      refreshInterval: 30000, // 30 seconds
      enableVirtualScrolling: true,
      ...config
    };

    this.state = {
      currentSort: 'trending',
      filters: {
        game: 'all',
        platform: 'all',
        contentType: 'all',
        timeRange: 'week'
      },
      viewMode: 'grid',
      searchQuery: '',
      isLoading: false,
      error: null,
      content: [],
      hasMore: true,
      page: 0
    };

    this.rankingAlgorithm = new ContentRankingAlgorithm();
    this.container = null;
    this.refreshTimer = null;
    this.eventListeners = new Map();
  }

  /**
   * Initialize the component
   */
  async initialize() {
    try {
      this.container = document.getElementById(this.config.containerId);
      if (!this.container) {
        throw new Error(`Container ${this.config.containerId} not found`);
      }

      this.render();
      this.attachEventListeners();
      await this.loadContent();

      if (this.config.autoRefresh) {
        this.startAutoRefresh();
      }

      console.log('ContentSortingInterface initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ContentSortingInterface:', error);
      this.setState({ error: error.message });
    }
  }

  /**
   * Render the complete interface
   */
  render() {
    this.container.innerHTML = `
      <div class="mlg-content-sorting" role="main" aria-label="Content Browser">
        ${this.renderSortingToolbar()}
        ${this.renderFilters()}
        ${this.renderViewControls()}
        ${this.renderContent()}
        ${this.renderLoadMore()}
      </div>
      ${this.renderStyles()}
    `;
  }

  /**
   * Render Xbox blade-style sorting toolbar
   */
  renderSortingToolbar() {
    const sortOptions = [
      { key: 'hot', label: 'Hot', icon: '🔥', desc: 'Trending now' },
      { key: 'trending', label: 'Trending', icon: '📈', desc: 'Rising fast' },
      { key: 'top', label: 'Top', icon: '👑', desc: 'All-time best' },
      { key: 'new', label: 'New', icon: '✨', desc: 'Fresh content' },
      { key: 'controversial', label: 'Controversial', icon: '⚡', desc: 'Mixed votes' },
      { key: 'competitive', label: 'Competitive', icon: '🏆', desc: 'Esports & ranked' }
    ];

    return `
      <div class="sorting-toolbar" role="tablist" aria-label="Content Sorting Options">
        ${sortOptions.map(option => `
          <button 
            class="sort-blade ${this.state.currentSort === option.key ? 'active' : ''}"
            role="tab"
            aria-selected="${this.state.currentSort === option.key}"
            aria-controls="content-display"
            data-sort="${option.key}"
            title="${option.desc}"
          >
            <span class="sort-icon" aria-hidden="true">${option.icon}</span>
            <span class="sort-label">${option.label}</span>
            <div class="blade-glow"></div>
          </button>
        `).join('')}
      </div>
    `;
  }

  /**
   * Render filter controls
   */
  renderFilters() {
    return `
      <div class="filter-section" aria-label="Content Filters">
        <div class="filter-row">
          ${this.renderFilterSelect('game', 'Game', [
            { value: 'all', label: 'All Games' },
            { value: 'fortnite', label: 'Fortnite' },
            { value: 'call-of-duty', label: 'Call of Duty' },
            { value: 'valorant', label: 'Valorant' },
            { value: 'apex-legends', label: 'Apex Legends' },
            { value: 'league-of-legends', label: 'League of Legends' }
          ])}
          
          ${this.renderFilterSelect('platform', 'Platform', [
            { value: 'all', label: 'All Platforms' },
            { value: 'pc', label: 'PC' },
            { value: 'xbox', label: 'Xbox' },
            { value: 'playstation', label: 'PlayStation' },
            { value: 'mobile', label: 'Mobile' },
            { value: 'nintendo', label: 'Nintendo' }
          ])}
          
          ${this.renderFilterSelect('contentType', 'Type', [
            { value: 'all', label: 'All Content' },
            { value: 'clips', label: 'Video Clips' },
            { value: 'screenshots', label: 'Screenshots' },
            { value: 'guides', label: 'Guides' },
            { value: 'reviews', label: 'Reviews' }
          ])}
          
          ${this.renderFilterSelect('timeRange', 'Time', [
            { value: 'hour', label: 'Past Hour' },
            { value: 'day', label: 'Today' },
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' },
            { value: 'year', label: 'This Year' },
            { value: 'all', label: 'All Time' }
          ])}
        </div>
        
        <div class="search-container">
          <input 
            type="search" 
            class="search-input" 
            placeholder="Search content..." 
            value="${this.state.searchQuery}"
            aria-label="Search content"
          >
          <button class="search-button" aria-label="Search">
            <span aria-hidden="true">🔍</span>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render filter select dropdown
   */
  renderFilterSelect(key, label, options) {
    return `
      <div class="filter-select">
        <label for="${key}-filter" class="filter-label">${label}:</label>
        <select id="${key}-filter" class="xbox-select" data-filter="${key}" aria-label="Filter by ${label}">
          ${options.map(option => `
            <option value="${option.value}" ${this.state.filters[key] === option.value ? 'selected' : ''}>
              ${option.label}
            </option>
          `).join('')}
        </select>
      </div>
    `;
  }

  /**
   * Render view mode controls
   */
  renderViewControls() {
    const viewModes = [
      { key: 'grid', label: 'Grid', icon: '⊞' },
      { key: 'list', label: 'List', icon: '☰' },
      { key: 'detailed', label: 'Detailed', icon: '📄' }
    ];

    return `
      <div class="view-controls" role="radiogroup" aria-label="View Mode">
        ${viewModes.map(mode => `
          <button 
            class="view-mode-btn ${this.state.viewMode === mode.key ? 'active' : ''}"
            role="radio"
            aria-checked="${this.state.viewMode === mode.key}"
            data-view="${mode.key}"
            title="${mode.label} View"
          >
            <span aria-hidden="true">${mode.icon}</span>
            <span class="sr-only">${mode.label}</span>
          </button>
        `).join('')}
      </div>
    `;
  }

  /**
   * Render content display area
   */
  renderContent() {
    if (this.state.isLoading && this.state.content.length === 0) {
      return this.renderLoadingState();
    }

    if (this.state.error) {
      return this.renderErrorState();
    }

    if (this.state.content.length === 0) {
      return this.renderEmptyState();
    }

    return `
      <div 
        id="content-display" 
        class="content-display ${this.state.viewMode}-view"
        role="tabpanel"
        aria-labelledby="sorting-toolbar"
      >
        ${this.state.content.map(item => this.renderContentItem(item)).join('')}
      </div>
    `;
  }

  /**
   * Render individual content item
   */
  renderContentItem(item) {
    const rankingData = this.rankingAlgorithm.calculateContentScore(item);
    
    return `
      <article class="content-item" data-id="${item.id}" role="article">
        <div class="content-card">
          <div class="content-thumbnail">
            ${item.thumbnailUrl ? 
              `<img src="${item.thumbnailUrl}" alt="${item.title}" loading="lazy">` :
              `<div class="placeholder-thumbnail">${this.getContentTypeIcon(item.type)}</div>`
            }
            <div class="content-duration">${item.duration || '0:00'}</div>
          </div>
          
          <div class="content-info">
            <h3 class="content-title">${this.escapeHtml(item.title)}</h3>
            <p class="content-description">${this.truncateText(item.description, 100)}</p>
            
            <div class="content-meta">
              <span class="content-game">${item.game}</span>
              <span class="content-platform">${item.platform}</span>
              <span class="content-category">${item.category}</span>
            </div>
            
            <div class="content-stats">
              <span class="views">👁 ${this.formatNumber(item.viewCount)}</span>
              <span class="score">⭐ ${rankingData.totalScore.toFixed(1)}</span>
              <span class="age">${this.formatTimeAgo(item.createdAt)}</span>
            </div>
          </div>
          
          <div class="content-actions">
            ${this.renderVotingControls(item)}
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Render voting controls with MLG token integration
   */
  renderVotingControls(item) {
    return `
      <div class="voting-controls" role="group" aria-label="Voting options">
        <button 
          class="vote-btn upvote-btn"
          data-action="upvote"
          data-content-id="${item.id}"
          aria-label="Upvote (1 MLG token)"
        >
          <span class="vote-icon">⬆</span>
          <span class="vote-count">${item.upvotes || 0}</span>
        </button>
        
        <button 
          class="vote-btn supervote-btn"
          data-action="supervote"
          data-content-id="${item.id}"
          aria-label="Super Vote (5 MLG tokens)"
        >
          <span class="vote-icon">🔥</span>
          <span class="vote-count">${item.supervotes || 0}</span>
        </button>
        
        <button 
          class="vote-btn downvote-btn"
          data-action="downvote"
          data-content-id="${item.id}"
          aria-label="Downvote (2 MLG tokens)"
        >
          <span class="vote-icon">⬇</span>
          <span class="vote-count">${item.downvotes || 0}</span>
        </button>
      </div>
    `;
  }

  /**
   * Render loading state
   */
  renderLoadingState() {
    return `
      <div class="loading-state" role="status" aria-label="Loading content">
        <div class="xbox-spinner"></div>
        <p>Loading amazing content...</p>
      </div>
    `;
  }

  /**
   * Render error state
   */
  renderErrorState() {
    return `
      <div class="error-state" role="alert">
        <div class="error-icon">⚠️</div>
        <h3>Oops! Something went wrong</h3>
        <p>${this.state.error}</p>
        <button class="retry-btn" onclick="location.reload()">Retry</button>
      </div>
    `;
  }

  /**
   * Render empty state
   */
  renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-icon">🎮</div>
        <h3>No content found</h3>
        <p>Try adjusting your filters or search terms</p>
      </div>
    `;
  }

  /**
   * Render load more button
   */
  renderLoadMore() {
    if (!this.state.hasMore || this.state.isLoading) return '';

    return `
      <div class="load-more-section">
        <button class="load-more-btn xbox-button" data-action="load-more">
          Load More Content
        </button>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Sort toolbar
    this.container.querySelectorAll('.sort-blade').forEach(btn => {
      btn.addEventListener('click', this.handleSortChange.bind(this));
    });

    // Filters
    this.container.querySelectorAll('[data-filter]').forEach(select => {
      select.addEventListener('change', this.handleFilterChange.bind(this));
    });

    // View modes
    this.container.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', this.handleViewChange.bind(this));
    });

    // Search
    const searchInput = this.container.querySelector('.search-input');
    if (searchInput) {
      searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));
    }

    // Voting
    this.container.addEventListener('click', this.handleVoting.bind(this));

    // Load more
    this.container.addEventListener('click', this.handleLoadMore.bind(this));

    // Keyboard navigation
    this.container.addEventListener('keydown', this.handleKeyNavigation.bind(this));
  }

  /**
   * Handle sort change
   */
  async handleSortChange(event) {
    const sortType = event.target.closest('.sort-blade').dataset.sort;
    if (sortType && sortType !== this.state.currentSort) {
      this.setState({ currentSort: sortType, page: 0, content: [] });
      await this.loadContent();
    }
  }

  /**
   * Handle filter change
   */
  async handleFilterChange(event) {
    const filterType = event.target.dataset.filter;
    const value = event.target.value;
    
    this.setState({
      filters: { ...this.state.filters, [filterType]: value },
      page: 0,
      content: []
    });
    
    await this.loadContent();
  }

  /**
   * Handle view mode change
   */
  handleViewChange(event) {
    const viewMode = event.target.closest('[data-view]').dataset.view;
    if (viewMode && viewMode !== this.state.viewMode) {
      this.setState({ viewMode });
      this.updateViewMode();
    }
  }

  /**
   * Handle search
   */
  async handleSearch(event) {
    const query = event.target.value;
    this.setState({ searchQuery: query, page: 0, content: [] });
    await this.loadContent();
  }

  /**
   * Handle voting actions
   */
  async handleVoting(event) {
    const voteBtn = event.target.closest('.vote-btn');
    if (!voteBtn) return;

    const action = voteBtn.dataset.action;
    const contentId = voteBtn.dataset.contentId;
    
    if (action && contentId) {
      try {
        await this.processVote(contentId, action);
      } catch (error) {
        console.error('Voting failed:', error);
        // Show error notification
      }
    }
  }

  /**
   * Handle load more
   */
  async handleLoadMore(event) {
    if (event.target.dataset.action === 'load-more') {
      this.setState({ page: this.state.page + 1 });
      await this.loadContent(true);
    }
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyNavigation(event) {
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowRight':
        this.navigateSortOptions(event.key);
        break;
      case 'ArrowUp':
      case 'ArrowDown':
        this.navigateContentItems(event.key);
        break;
      case 'Enter':
      case ' ':
        this.activateCurrentElement(event);
        break;
    }
  }

  /**
   * Load content from API
   */
  async loadContent(append = false) {
    try {
      this.setState({ isLoading: true, error: null });

      const params = new URLSearchParams({
        sort: this.state.currentSort,
        page: this.state.page,
        limit: this.config.itemsPerPage,
        search: this.state.searchQuery,
        ...this.state.filters
      });

      const response = await fetch(`${this.config.apiEndpoint}?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const rankedContent = await this.rankingAlgorithm.rankContent(data.content, {
        mode: this.state.currentSort,
        filters: this.state.filters
      });

      this.setState({
        content: append ? [...this.state.content, ...rankedContent] : rankedContent,
        hasMore: data.hasMore,
        isLoading: false
      });

      if (!append) {
        this.updateDisplay();
      } else {
        this.appendContent(rankedContent);
      }

    } catch (error) {
      console.error('Failed to load content:', error);
      this.setState({ error: error.message, isLoading: false });
    }
  }

  /**
   * Process vote with MLG token integration
   */
  async processVote(contentId, action) {
    // Integration with MLG token voting system
    const tokenCosts = {
      upvote: 1,
      downvote: 2,
      supervote: 5
    };

    try {
      // Check user's MLG token balance
      const balance = await this.checkMLGBalance();
      const cost = tokenCosts[action];

      if (balance < cost) {
        throw new Error(`Insufficient MLG tokens. Need ${cost}, have ${balance}`);
      }

      // Submit vote to blockchain
      const result = await this.submitVote(contentId, action, cost);
      
      // Update local state
      this.updateVoteCount(contentId, action);
      
      // Show success feedback
      this.showVoteSuccess(action, cost);

    } catch (error) {
      console.error('Vote processing failed:', error);
      throw error;
    }
  }

  /**
   * Update component state
   */
  setState(updates) {
    this.state = { ...this.state, ...updates };
  }

  /**
   * Update display after state change
   */
  updateDisplay() {
    const contentDisplay = this.container.querySelector('#content-display');
    if (contentDisplay) {
      contentDisplay.innerHTML = this.state.content.map(item => 
        this.renderContentItem(item)
      ).join('');
    }

    // Update active sort indicator
    this.container.querySelectorAll('.sort-blade').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.sort === this.state.currentSort);
    });

    // Update view mode
    this.updateViewMode();
  }

  /**
   * Update view mode classes
   */
  updateViewMode() {
    const contentDisplay = this.container.querySelector('#content-display');
    if (contentDisplay) {
      contentDisplay.className = `content-display ${this.state.viewMode}-view`;
    }

    // Update view mode buttons
    this.container.querySelectorAll('[data-view]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === this.state.viewMode);
    });
  }

  /**
   * Start auto-refresh timer
   */
  startAutoRefresh() {
    this.refreshTimer = setInterval(() => {
      if (!this.state.isLoading && document.visibilityState === 'visible') {
        this.loadContent();
      }
    }, this.config.refreshInterval);
  }

  /**
   * Stop auto-refresh timer
   */
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Utility functions
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength - 3) + '...';
  }

  formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  formatTimeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  getContentTypeIcon(type) {
    const icons = {
      clips: '🎬',
      screenshots: '📸',
      guides: '📖',
      reviews: '⭐'
    };
    return icons[type] || '🎮';
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    this.stopAutoRefresh();
    
    // Remove event listeners
    this.eventListeners.forEach((listener, element) => {
      element.removeEventListener(listener.event, listener.handler);
    });
    
    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  /**
   * Render component styles
   */
  renderStyles() {
    return `
      <style>
        .mlg-content-sorting {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          min-height: 100vh;
          padding: 20px;
        }

        /* Xbox 360 Sorting Toolbar */
        .sorting-toolbar {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          overflow-x: auto;
          padding: 8px 0;
        }

        .sort-blade {
          position: relative;
          background: linear-gradient(135deg, rgba(31, 41, 55, 0.9) 0%, rgba(17, 24, 39, 0.9) 100%);
          border: 2px solid rgba(16, 185, 129, 0.3);
          border-radius: 16px;
          padding: 12px 20px;
          color: #e5e7eb;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 120px;
          text-align: center;
          overflow: hidden;
        }

        .sort-blade:hover, .sort-blade.active {
          border-color: #10b981;
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
        }

        .sort-blade.active {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%);
        }

        .blade-glow {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.2), transparent);
          transition: left 0.6s ease;
        }

        .sort-blade:hover .blade-glow {
          left: 100%;
        }

        .sort-icon {
          display: block;
          font-size: 24px;
          margin-bottom: 4px;
        }

        .sort-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
        }

        /* Filter Section */
        .filter-section {
          background: rgba(31, 41, 55, 0.6);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .filter-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .filter-select {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .filter-label {
          font-size: 12px;
          color: #9ca3af;
          font-weight: 600;
          text-transform: uppercase;
        }

        .xbox-select {
          background: rgba(17, 24, 39, 0.8);
          border: 2px solid rgba(16, 185, 129, 0.3);
          border-radius: 8px;
          padding: 8px 12px;
          color: #e5e7eb;
          font-size: 14px;
          transition: border-color 0.3s ease;
        }

        .xbox-select:focus {
          border-color: #10b981;
          outline: none;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .search-container {
          display: flex;
          gap: 8px;
        }

        .search-input {
          flex: 1;
          background: rgba(17, 24, 39, 0.8);
          border: 2px solid rgba(16, 185, 129, 0.3);
          border-radius: 8px;
          padding: 12px 16px;
          color: #e5e7eb;
          font-size: 14px;
          transition: border-color 0.3s ease;
        }

        .search-input:focus {
          border-color: #10b981;
          outline: none;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .search-button {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: none;
          border-radius: 8px;
          padding: 12px 16px;
          color: black;
          cursor: pointer;
          font-size: 16px;
          transition: transform 0.2s ease;
        }

        .search-button:hover {
          transform: scale(1.05);
        }

        /* View Controls */
        .view-controls {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          justify-content: flex-end;
        }

        .view-mode-btn {
          background: rgba(31, 41, 55, 0.9);
          border: 2px solid rgba(16, 185, 129, 0.3);
          border-radius: 8px;
          padding: 8px 12px;
          color: #e5e7eb;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .view-mode-btn:hover, .view-mode-btn.active {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.2);
        }

        /* Content Display */
        .content-display {
          margin-bottom: 32px;
        }

        .content-display.grid-view {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .content-display.list-view {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .content-display.detailed-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Content Items */
        .content-item {
          background: linear-gradient(135deg, rgba(31, 41, 55, 0.9) 0%, rgba(17, 24, 39, 0.9) 100%);
          border: 2px solid rgba(16, 185, 129, 0.2);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .content-item:hover {
          transform: translateY(-4px);
          border-color: rgba(16, 185, 129, 0.5);
          box-shadow: 0 12px 40px rgba(16, 185, 129, 0.2);
        }

        .content-card {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .content-thumbnail {
          position: relative;
          aspect-ratio: 16/9;
          background: rgba(17, 24, 39, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .content-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .placeholder-thumbnail {
          font-size: 48px;
          opacity: 0.5;
        }

        .content-duration {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .content-info {
          padding: 16px;
          flex: 1;
        }

        .content-title {
          font-size: 16px;
          font-weight: 600;
          color: #e5e7eb;
          margin: 0 0 8px 0;
          line-height: 1.4;
        }

        .content-description {
          font-size: 14px;
          color: #9ca3af;
          margin: 0 0 12px 0;
          line-height: 1.4;
        }

        .content-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }

        .content-meta span {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .content-stats {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #6b7280;
        }

        .content-actions {
          padding: 16px;
          border-top: 1px solid rgba(16, 185, 129, 0.1);
        }

        /* Voting Controls */
        .voting-controls {
          display: flex;
          justify-content: space-around;
          gap: 8px;
        }

        .vote-btn {
          background: rgba(17, 24, 39, 0.8);
          border: 2px solid rgba(16, 185, 129, 0.3);
          border-radius: 8px;
          padding: 8px 12px;
          color: #e5e7eb;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          min-width: 60px;
        }

        .vote-btn:hover {
          border-color: #10b981;
          transform: translateY(-2px);
        }

        .upvote-btn:hover {
          background: rgba(34, 197, 94, 0.1);
        }

        .supervote-btn:hover {
          background: rgba(249, 115, 22, 0.1);
        }

        .downvote-btn:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .vote-icon {
          font-size: 16px;
        }

        .vote-count {
          font-size: 12px;
          font-weight: 600;
        }

        /* Loading, Error, Empty States */
        .loading-state, .error-state, .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
          color: #9ca3af;
        }

        .xbox-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(16, 185, 129, 0.2);
          border-top: 4px solid #10b981;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-icon, .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .retry-btn, .load-more-btn {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          color: black;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease;
          margin-top: 16px;
        }

        .retry-btn:hover, .load-more-btn:hover {
          transform: scale(1.05);
        }

        .load-more-section {
          display: flex;
          justify-content: center;
          margin-top: 32px;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .mlg-content-sorting {
            padding: 16px;
          }

          .sorting-toolbar {
            gap: 4px;
          }

          .sort-blade {
            min-width: 100px;
            padding: 10px 16px;
          }

          .filter-row {
            grid-template-columns: 1fr;
          }

          .content-display.grid-view {
            grid-template-columns: 1fr;
          }

          .content-display.list-view .content-card {
            flex-direction: row;
          }

          .content-display.list-view .content-thumbnail {
            width: 120px;
            aspect-ratio: 16/9;
          }
        }

        /* Accessibility */
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

        /* Focus styles for accessibility */
        .sort-blade:focus,
        .vote-btn:focus,
        .view-mode-btn:focus,
        .search-input:focus,
        .xbox-select:focus {
          outline: 2px solid #10b981;
          outline-offset: 2px;
        }
      </style>
    `;
  }

  // Mock API integration methods (to be replaced with real implementations)
  async checkMLGBalance() {
    // Mock implementation - replace with actual MLG token balance check
    return 100; // Assume user has 100 MLG tokens
  }

  async submitVote(contentId, action, cost) {
    // Mock implementation - replace with actual Solana transaction
    console.log(`Submitting ${action} vote for content ${contentId}, cost: ${cost} MLG tokens`);
    return { success: true, signature: 'mock_signature_' + Date.now() };
  }

  updateVoteCount(contentId, action) {
    // Update local vote counts
    const contentItem = this.state.content.find(item => item.id === contentId);
    if (contentItem) {
      if (action === 'upvote') contentItem.upvotes = (contentItem.upvotes || 0) + 1;
      else if (action === 'downvote') contentItem.downvotes = (contentItem.downvotes || 0) + 1;
      else if (action === 'supervote') contentItem.supervotes = (contentItem.supervotes || 0) + 1;
      
      this.updateDisplay();
    }
  }

  showVoteSuccess(action, cost) {
    // Show success notification - replace with actual notification system
    console.log(`Vote successful! ${action} cost ${cost} MLG tokens`);
  }

  appendContent(newContent) {
    // Append new content to display
    const contentDisplay = this.container.querySelector('#content-display');
    if (contentDisplay) {
      newContent.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.innerHTML = this.renderContentItem(item);
        contentDisplay.appendChild(itemElement.firstElementChild);
      });
    }
  }

  navigateSortOptions(direction) {
    // Keyboard navigation for sort options
    const sortButtons = this.container.querySelectorAll('.sort-blade');
    const currentIndex = Array.from(sortButtons).findIndex(btn => btn.classList.contains('active'));
    
    let newIndex;
    if (direction === 'ArrowLeft') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : sortButtons.length - 1;
    } else {
      newIndex = currentIndex < sortButtons.length - 1 ? currentIndex + 1 : 0;
    }
    
    sortButtons[newIndex].click();
    sortButtons[newIndex].focus();
  }

  navigateContentItems(direction) {
    // Keyboard navigation for content items
    const contentItems = this.container.querySelectorAll('.content-item');
    const focused = document.activeElement;
    const currentIndex = Array.from(contentItems).indexOf(focused.closest('.content-item'));
    
    let newIndex;
    if (direction === 'ArrowUp') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : contentItems.length - 1;
    } else {
      newIndex = currentIndex < contentItems.length - 1 ? currentIndex + 1 : 0;
    }
    
    if (contentItems[newIndex]) {
      contentItems[newIndex].focus();
    }
  }

  activateCurrentElement(event) {
    // Activate focused element
    const focused = document.activeElement;
    if (focused && (focused.classList.contains('sort-blade') || focused.classList.contains('vote-btn'))) {
      event.preventDefault();
      focused.click();
    }
  }
}

// Export for use in other modules
export default ContentSortingInterface;

// Auto-initialize if in browser environment
if (typeof window !== 'undefined' && document.readyState !== 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Auto-initialize if container exists
    const container = document.getElementById('content-sorting-container');
    if (container) {
      const sortingInterface = new ContentSortingInterface();
      sortingInterface.initialize();
    }
  });
}