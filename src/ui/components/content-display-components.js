/**
 * MLG.clan Content Display Components
 * Sub-task 4.8: Build content display components with voting integration
 * 
 * Production-ready content display components with Xbox 360 retro aesthetic
 * Integrates with voting, rewards, moderation, and ranking systems
 */

import { ContentRankingAlgorithm } from '../../content/content-ranking-algorithm.js';
import { ContentModerationSystem } from '../../content/content-moderation.js';
import { ContentRewardsSystem } from '../../content/content-rewards.js';

/**
 * Content Display Components Manager
 * Handles all content display functionality with integrated voting
 */
export class ContentDisplayComponents {
  constructor(config = {}) {
    this.config = {
      mlgTokenContract: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL',
      apiEndpoint: '/api/content',
      enableVoting: true,
      enableModeration: true,
      enableRewards: true,
      autoPlayVideos: false,
      lazyLoadImages: true,
      ...config
    };

    // Initialize systems
    this.rankingAlgorithm = new ContentRankingAlgorithm();
    this.moderationSystem = new ContentModerationSystem();
    this.rewardsSystem = new ContentRewardsSystem();

    // State management
    this.state = {
      votingStates: new Map(),
      loadingStates: new Map(),
      errorStates: new Map()
    };

    this.eventListeners = new Map();
  }

  /**
   * Initialize the component system
   */
  async initialize() {
    try {
      await this.loadExternalDependencies();
      this.attachGlobalEventListeners();
      console.log('ContentDisplayComponents initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ContentDisplayComponents:', error);
    }
  }

  /**
   * Create small content card component
   */
  createSmallContentCard(content, options = {}) {
    const cardId = `content-card-${content.id}`;
    const rankingData = this.rankingAlgorithm.calculateContentScore(content);

    return `
      <article class="content-card small-card" data-content-id="${content.id}" id="${cardId}">
        <div class="card-container">
          ${this.renderContentThumbnail(content, 'small')}
          ${this.renderCardOverlay(content, rankingData)}
          ${this.renderQuickVoting(content)}
        </div>
        ${this.renderCardInfo(content, 'small')}
        ${this.renderCardActions(content, 'small')}
      </article>
    `;
  }

  /**
   * Create medium content card component
   */
  createMediumContentCard(content, options = {}) {
    const cardId = `content-card-${content.id}`;
    const rankingData = this.rankingAlgorithm.calculateContentScore(content);

    return `
      <article class="content-card medium-card" data-content-id="${content.id}" id="${cardId}">
        <div class="card-layout">
          <div class="card-thumbnail-section">
            ${this.renderContentThumbnail(content, 'medium')}
          </div>
          <div class="card-content-section">
            ${this.renderCardInfo(content, 'medium')}
            ${this.renderEngagementMetrics(content, rankingData)}
            ${this.renderVotingWidget(content)}
          </div>
        </div>
        ${this.renderCardActions(content, 'medium')}
      </article>
    `;
  }

  /**
   * Create large featured content card
   */
  createLargeContentCard(content, options = {}) {
    const cardId = `content-card-${content.id}`;
    const rankingData = this.rankingAlgorithm.calculateContentScore(content);

    return `
      <article class="content-card large-card featured" data-content-id="${content.id}" id="${cardId}">
        <div class="hero-section">
          ${this.renderContentThumbnail(content, 'large')}
          ${this.renderHeroOverlay(content, rankingData)}
        </div>
        <div class="featured-content-section">
          ${this.renderCardInfo(content, 'large')}
          ${this.renderCreatorProfile(content.creator)}
          ${this.renderEngagementMetrics(content, rankingData)}
        </div>
        <div class="featured-actions-section">
          ${this.renderEnhancedVotingWidget(content)}
          ${this.renderCardActions(content, 'large')}
        </div>
      </article>
    `;
  }

  /**
   * Create detailed content view
   */
  createDetailedContentView(content, options = {}) {
    const rankingData = this.rankingAlgorithm.calculateContentScore(content);

    return `
      <section class="detailed-content-view" data-content-id="${content.id}">
        <div class="content-player-section">
          ${this.renderContentPlayer(content)}
        </div>
        
        <div class="content-details-section">
          <div class="primary-details">
            ${this.renderContentHeader(content, rankingData)}
            ${this.renderContentDescription(content)}
            ${this.renderContentMetadata(content)}
          </div>
          
          <div class="voting-section">
            ${this.renderDetailedVotingWidget(content, rankingData)}
          </div>
        </div>
        
        <div class="creator-section">
          ${this.renderExpandedCreatorProfile(content.creator)}
        </div>
        
        <div class="engagement-section">
          ${this.renderDetailedEngagementMetrics(content, rankingData)}
          ${this.renderCommentSection(content)}
        </div>
        
        <div class="related-content-section">
          ${this.renderRelatedContent(content)}
        </div>
      </section>
    `;
  }

  /**
   * Render content thumbnail based on content type
   */
  renderContentThumbnail(content, size = 'medium') {
    const sizeClasses = {
      small: 'thumbnail-small',
      medium: 'thumbnail-medium', 
      large: 'thumbnail-large'
    };

    const aspectRatio = content.type === 'clips' ? '16:9' : 
                       content.type === 'screenshots' ? '16:10' : '4:3';

    return `
      <div class="content-thumbnail ${sizeClasses[size]}" style="aspect-ratio: ${aspectRatio}">
        ${content.thumbnailUrl ? 
          `<img src="${content.thumbnailUrl}" alt="${this.escapeHtml(content.title)}" 
               loading="${this.config.lazyLoadImages ? 'lazy' : 'eager'}"
               onerror="this.parentElement.classList.add('thumbnail-error')">` :
          `<div class="thumbnail-placeholder">
             <span class="content-type-icon">${this.getContentTypeIcon(content.type)}</span>
           </div>`
        }
        
        ${content.type === 'clips' ? `
          <div class="video-duration">${content.duration || '0:00'}</div>
          <div class="play-button" role="button" aria-label="Play video">
            <span class="play-icon">▶</span>
          </div>
        ` : ''}
        
        <div class="thumbnail-badges">
          ${this.renderContentBadges(content)}
        </div>
      </div>
    `;
  }

  /**
   * Render content player for detailed view
   */
  renderContentPlayer(content) {
    if (content.type === 'clips' && content.videoUrl) {
      return this.renderVideoPlayer(content);
    } else if (content.type === 'screenshots' && content.imageUrl) {
      return this.renderImageViewer(content);
    } else {
      return this.renderGenericContentViewer(content);
    }
  }

  /**
   * Render custom video player with Xbox styling
   */
  renderVideoPlayer(content) {
    return `
      <div class="xbox-video-player" data-content-id="${content.id}">
        <video 
          class="video-element"
          poster="${content.thumbnailUrl || ''}"
          preload="metadata"
          ${this.config.autoPlayVideos ? 'autoplay muted' : ''}
          controls
          aria-label="Video: ${this.escapeHtml(content.title)}"
        >
          <source src="${content.videoUrl}" type="video/mp4">
          <p>Your browser doesn't support video playback. 
             <a href="${content.videoUrl}">Download the video</a> instead.</p>
        </video>
        
        <div class="custom-controls">
          <button class="play-pause-btn" aria-label="Play/Pause">
            <span class="play-icon">▶</span>
            <span class="pause-icon" style="display:none;">⏸</span>
          </button>
          
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-filled"></div>
            </div>
            <div class="time-display">
              <span class="current-time">0:00</span>
              <span class="duration">${content.duration || '0:00'}</span>
            </div>
          </div>
          
          <div class="volume-container">
            <button class="mute-btn" aria-label="Mute/Unmute">🔊</button>
            <input type="range" class="volume-slider" min="0" max="1" step="0.1" value="1">
          </div>
          
          <button class="fullscreen-btn" aria-label="Toggle fullscreen">⛶</button>
        </div>
        
        <div class="video-overlay gaming-hud">
          <div class="performance-metrics">
            <span class="resolution">${content.resolution || 'HD'}</span>
            <span class="fps">${content.fps || '60'}fps</span>
            <span class="platform-badge">${content.platform}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render voting widget with MLG token integration
   */
  renderVotingWidget(content) {
    const userVote = this.getUserVoteStatus(content.id);
    const votingDisabled = this.state.loadingStates.get(`vote-${content.id}`) || false;

    return `
      <div class="voting-widget" data-content-id="${content.id}">
        <div class="vote-buttons">
          <button 
            class="vote-btn upvote-btn ${userVote === 'upvote' ? 'voted' : ''}"
            data-action="upvote"
            data-cost="1"
            ${votingDisabled ? 'disabled' : ''}
            aria-label="Upvote (1 MLG token)"
          >
            <span class="vote-icon">⬆</span>
            <span class="vote-count">${content.upvotes || 0}</span>
            <span class="vote-cost">1 MLG</span>
          </button>
          
          <button 
            class="vote-btn supervote-btn ${userVote === 'supervote' ? 'voted' : ''}"
            data-action="supervote"
            data-cost="5"
            ${votingDisabled ? 'disabled' : ''}
            aria-label="Super Vote (5 MLG tokens)"
          >
            <span class="vote-icon">🔥</span>
            <span class="vote-count">${content.supervotes || 0}</span>
            <span class="vote-cost">5 MLG</span>
          </button>
          
          <button 
            class="vote-btn downvote-btn ${userVote === 'downvote' ? 'voted' : ''}"
            data-action="downvote"
            data-cost="2"
            ${votingDisabled ? 'disabled' : ''}
            aria-label="Downvote (2 MLG tokens)"
          >
            <span class="vote-icon">⬇</span>
            <span class="vote-count">${content.downvotes || 0}</span>
            <span class="vote-cost">2 MLG</span>
          </button>
        </div>
        
        <div class="vote-stats">
          <span class="total-votes">${this.getTotalVotes(content)} votes</span>
          <span class="vote-score">Score: ${this.calculateVoteScore(content).toFixed(1)}</span>
        </div>
        
        ${votingDisabled ? '<div class="voting-loader">Processing vote...</div>' : ''}
      </div>
    `;
  }

  /**
   * Render enhanced voting widget for detailed view
   */
  renderEnhancedVotingWidget(content) {
    const votingStats = this.calculateVotingStats(content);
    
    return `
      <div class="enhanced-voting-widget" data-content-id="${content.id}">
        ${this.renderVotingWidget(content)}
        
        <div class="voting-analytics">
          <div class="vote-breakdown">
            <div class="breakdown-item">
              <span class="label">Approval Rate:</span>
              <span class="value">${votingStats.approvalRate}%</span>
            </div>
            <div class="breakdown-item">
              <span class="label">Controversy Score:</span>
              <span class="value">${votingStats.controversyScore.toFixed(1)}</span>
            </div>
            <div class="breakdown-item">
              <span class="label">MLG Burned:</span>
              <span class="value">${votingStats.totalMLGBurned} tokens</span>
            </div>
          </div>
          
          <div class="vote-history-chart">
            ${this.renderVoteHistoryChart(content)}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render engagement metrics
   */
  renderEngagementMetrics(content, rankingData) {
    return `
      <div class="engagement-metrics">
        <div class="metric-item">
          <span class="metric-icon">👁</span>
          <span class="metric-value">${this.formatNumber(content.viewCount || 0)}</span>
          <span class="metric-label">Views</span>
        </div>
        
        <div class="metric-item">
          <span class="metric-icon">⭐</span>
          <span class="metric-value">${rankingData.totalScore.toFixed(1)}</span>
          <span class="metric-label">Score</span>
        </div>
        
        <div class="metric-item">
          <span class="metric-icon">💬</span>
          <span class="metric-value">${content.commentCount || 0}</span>
          <span class="metric-label">Comments</span>
        </div>
        
        <div class="metric-item">
          <span class="metric-icon">📤</span>
          <span class="metric-value">${content.shareCount || 0}</span>
          <span class="metric-label">Shares</span>
        </div>
        
        <div class="metric-item trending">
          <span class="metric-icon">📈</span>
          <span class="metric-value">${rankingData.trendingScore.toFixed(1)}</span>
          <span class="metric-label">Trending</span>
        </div>
      </div>
    `;
  }

  /**
   * Render creator profile section
   */
  renderCreatorProfile(creator) {
    return `
      <div class="creator-profile">
        <div class="creator-avatar">
          <img src="${creator.avatarUrl || '/default-avatar.png'}" 
               alt="${creator.displayName}" 
               loading="lazy">
          ${creator.verified ? '<span class="verified-badge">✓</span>' : ''}
        </div>
        
        <div class="creator-info">
          <h4 class="creator-name">${this.escapeHtml(creator.displayName)}</h4>
          <p class="creator-stats">
            <span class="followers">${this.formatNumber(creator.followers || 0)} followers</span>
            <span class="separator">•</span>
            <span class="reputation">Rep: ${creator.reputation || 0}</span>
          </p>
        </div>
        
        <div class="creator-actions">
          <button class="follow-btn ${creator.isFollowed ? 'following' : ''}" 
                  data-creator-id="${creator.id}">
            ${creator.isFollowed ? 'Following' : '+ Follow'}
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render content action menu
   */
  renderCardActions(content, size = 'medium') {
    return `
      <div class="card-actions ${size}-actions">
        <div class="primary-actions">
          <button class="action-btn bookmark-btn ${content.isBookmarked ? 'bookmarked' : ''}"
                  data-action="bookmark" data-content-id="${content.id}"
                  aria-label="Bookmark content">
            <span class="action-icon">${content.isBookmarked ? '🔖' : '🏷'}</span>
            <span class="action-label">Save</span>
          </button>
          
          <button class="action-btn share-btn"
                  data-action="share" data-content-id="${content.id}"
                  aria-label="Share content">
            <span class="action-icon">📤</span>
            <span class="action-label">Share</span>
          </button>
        </div>
        
        <div class="secondary-actions">
          <button class="action-btn menu-btn"
                  data-action="menu" data-content-id="${content.id}"
                  aria-label="More actions">
            <span class="action-icon">⋯</span>
          </button>
        </div>
        
        <div class="dropdown-menu" style="display: none;">
          <button class="menu-item" data-action="report" data-content-id="${content.id}">
            <span class="menu-icon">⚠️</span>
            <span class="menu-label">Report</span>
          </button>
          
          <button class="menu-item" data-action="copy-link" data-content-id="${content.id}">
            <span class="menu-icon">🔗</span>
            <span class="menu-label">Copy Link</span>
          </button>
          
          ${content.creator.id === this.getCurrentUserId() ? `
            <button class="menu-item" data-action="edit" data-content-id="${content.id}">
              <span class="menu-icon">✏️</span>
              <span class="menu-label">Edit</span>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Render content grid layout
   */
  renderContentGrid(contents, options = {}) {
    const gridOptions = {
      columns: 'auto-fit',
      minWidth: '320px',
      gap: '20px',
      ...options
    };

    return `
      <div class="content-grid" style="
        display: grid;
        grid-template-columns: repeat(${gridOptions.columns}, minmax(${gridOptions.minWidth}, 1fr));
        gap: ${gridOptions.gap};
      ">
        ${contents.map(content => this.createMediumContentCard(content)).join('')}
      </div>
    `;
  }

  /**
   * Render masonry layout for mixed content
   */
  renderMasonryLayout(contents, options = {}) {
    return `
      <div class="masonry-container">
        <div class="masonry-grid">
          ${contents.map((content, index) => {
            const cardType = this.selectCardTypeForMasonry(content, index);
            return this[`create${cardType}ContentCard`](content);
          }).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Handle voting action
   */
  async handleVoting(contentId, action) {
    try {
      this.state.loadingStates.set(`vote-${contentId}`, true);
      this.updateVotingUI(contentId);

      // Check MLG token balance
      const tokenCosts = { upvote: 1, downvote: 2, supervote: 5 };
      const cost = tokenCosts[action];
      
      const balance = await this.checkMLGBalance();
      if (balance < cost) {
        throw new Error(`Insufficient MLG tokens. Need ${cost}, have ${balance}`);
      }

      // Submit vote to blockchain
      const result = await this.submitVote(contentId, action, cost);
      
      // Update local state
      this.updateVoteCount(contentId, action);
      this.state.votingStates.set(contentId, action);
      
      // Show success feedback
      this.showVoteSuccess(action, cost);

    } catch (error) {
      console.error('Voting failed:', error);
      this.showVoteError(error.message);
    } finally {
      this.state.loadingStates.delete(`vote-${contentId}`);
      this.updateVotingUI(contentId);
    }
  }

  /**
   * Handle content actions (bookmark, share, report, etc.)
   */
  async handleContentAction(contentId, action, data = {}) {
    try {
      switch (action) {
        case 'bookmark':
          await this.toggleBookmark(contentId);
          break;
        case 'share':
          await this.shareContent(contentId, data);
          break;
        case 'report':
          await this.reportContent(contentId, data);
          break;
        case 'copy-link':
          await this.copyContentLink(contentId);
          break;
        case 'edit':
          await this.editContent(contentId);
          break;
        default:
          console.warn('Unknown content action:', action);
      }
    } catch (error) {
      console.error('Content action failed:', error);
      this.showActionError(action, error.message);
    }
  }

  /**
   * Attach event listeners for voting and content actions
   */
  attachEventListeners(container) {
    // Voting buttons
    container.addEventListener('click', async (event) => {
      const voteBtn = event.target.closest('.vote-btn');
      if (voteBtn && !voteBtn.disabled) {
        const contentId = voteBtn.closest('.voting-widget').dataset.contentId;
        const action = voteBtn.dataset.action;
        await this.handleVoting(contentId, action);
      }
    });

    // Content actions
    container.addEventListener('click', async (event) => {
      const actionBtn = event.target.closest('.action-btn, .menu-item');
      if (actionBtn) {
        const contentId = actionBtn.dataset.contentId;
        const action = actionBtn.dataset.action;
        await this.handleContentAction(contentId, action);
      }
    });

    // Video player controls
    container.addEventListener('click', (event) => {
      if (event.target.closest('.play-button, .play-pause-btn')) {
        this.handleVideoPlayback(event);
      }
    });

    // Menu toggles
    container.addEventListener('click', (event) => {
      if (event.target.closest('.menu-btn')) {
        this.toggleActionMenu(event);
      }
    });
  }

  /**
   * Utility functions
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  getContentTypeIcon(type) {
    const icons = {
      clips: '🎬',
      screenshots: '📸', 
      guides: '📖',
      reviews: '⭐',
      streams: '📺'
    };
    return icons[type] || '🎮';
  }

  getTotalVotes(content) {
    return (content.upvotes || 0) + (content.downvotes || 0) + (content.supervotes || 0);
  }

  calculateVoteScore(content) {
    const upvotes = content.upvotes || 0;
    const downvotes = content.downvotes || 0;
    const supervotes = (content.supervotes || 0) * 3; // Weight super votes higher
    
    return upvotes + supervotes - (downvotes * 0.5);
  }

  selectCardTypeForMasonry(content, index) {
    // Vary card sizes for interesting masonry layout
    if (index % 7 === 0) return 'Large'; // Every 7th item is large
    if (index % 3 === 0) return 'Medium'; // Every 3rd item is medium
    return 'Small'; // Default to small
  }

  // Mock implementations (replace with real API calls)
  async checkMLGBalance() {
    return 100; // Mock balance
  }

  async submitVote(contentId, action, cost) {
    // Mock vote submission
    return { success: true, signature: 'mock_signature' };
  }

  getUserVoteStatus(contentId) {
    return this.state.votingStates.get(contentId) || null;
  }

  getCurrentUserId() {
    return 'current_user_id'; // Mock user ID
  }

  // Additional utility methods...
  updateVotingUI(contentId) {
    const widget = document.querySelector(`[data-content-id="${contentId}"] .voting-widget`);
    if (widget) {
      const isLoading = this.state.loadingStates.get(`vote-${contentId}`);
      widget.classList.toggle('voting-loading', isLoading);
    }
  }

  showVoteSuccess(action, cost) {
    // Show success notification
    console.log(`Vote successful: ${action} (${cost} MLG)`);
  }

  showVoteError(message) {
    // Show error notification
    console.error('Vote error:', message);
  }

  renderContentBadges(content) {
    const badges = [];
    
    if (content.featured) badges.push('<span class="badge featured">Featured</span>');
    if (content.trending) badges.push('<span class="badge trending">🔥 Trending</span>');
    if (content.verified) badges.push('<span class="badge verified">✓ Verified</span>');
    
    return badges.join('');
  }

  renderCardInfo(content, size) {
    return `
      <div class="card-info ${size}-info">
        <h3 class="content-title">${this.escapeHtml(content.title)}</h3>
        ${size !== 'small' ? `<p class="content-description">${this.truncateText(content.description, 100)}</p>` : ''}
        <div class="content-meta">
          <span class="game-tag">${content.game}</span>
          <span class="platform-tag">${content.platform}</span>
          <span class="time-ago">${this.formatTimeAgo(content.createdAt)}</span>
        </div>
      </div>
    `;
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength - 3) + '...';
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

  calculateVotingStats(content) {
    const total = this.getTotalVotes(content);
    const upvotes = content.upvotes || 0;
    const downvotes = content.downvotes || 0;
    const supervotes = content.supervotes || 0;
    
    return {
      approvalRate: total > 0 ? Math.round(((upvotes + supervotes) / total) * 100) : 0,
      controversyScore: total > 0 ? Math.min(upvotes + supervotes, downvotes) / Math.max(upvotes + supervotes, downvotes) * 10 : 0,
      totalMLGBurned: upvotes + (downvotes * 2) + (supervotes * 5)
    };
  }

  renderVoteHistoryChart(content) {
    // Simple ASCII chart for vote history
    return `
      <div class="vote-chart">
        <div class="chart-bar upvotes" style="height: ${(content.upvotes || 0) / 10 * 100}%"></div>
        <div class="chart-bar supervotes" style="height: ${(content.supervotes || 0) / 10 * 100}%"></div>
        <div class="chart-bar downvotes" style="height: ${(content.downvotes || 0) / 10 * 100}%"></div>
      </div>
    `;
  }

  async loadExternalDependencies() {
    // Load any external dependencies needed
    console.log('Loading dependencies...');
  }

  attachGlobalEventListeners() {
    // Attach global event listeners
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Pause auto-refresh or videos when page becomes hidden
      }
    });
  }

  // Additional mock methods for complete functionality
  async toggleBookmark(contentId) {
    console.log('Bookmark toggled for:', contentId);
  }

  async shareContent(contentId, data) {
    if (navigator.share) {
      await navigator.share({
        title: data.title,
        url: data.url
      });
    }
  }

  async reportContent(contentId, data) {
    await this.moderationSystem.reportContent(contentId, data);
  }

  async copyContentLink(contentId) {
    const url = `${window.location.origin}/content/${contentId}`;
    await navigator.clipboard.writeText(url);
  }

  renderCardOverlay(content, rankingData) {
    return `
      <div class="card-overlay">
        <div class="overlay-top">
          ${content.featured ? '<span class="featured-badge">✨ Featured</span>' : ''}
        </div>
        <div class="overlay-bottom">
          <span class="score-badge">${rankingData.totalScore.toFixed(1)}</span>
        </div>
      </div>
    `;
  }

  renderQuickVoting(content) {
    return `
      <div class="quick-voting">
        <button class="quick-vote-btn upvote" data-action="upvote" data-content-id="${content.id}">
          ⬆ ${content.upvotes || 0}
        </button>
        <button class="quick-vote-btn downvote" data-action="downvote" data-content-id="${content.id}">
          ⬇ ${content.downvotes || 0}
        </button>
      </div>
    `;
  }

  renderHeroOverlay(content, rankingData) {
    return `
      <div class="hero-overlay">
        <div class="hero-content">
          <h2 class="hero-title">${this.escapeHtml(content.title)}</h2>
          <div class="hero-stats">
            <span class="stat">👁 ${this.formatNumber(content.viewCount)}</span>
            <span class="stat">⭐ ${rankingData.totalScore.toFixed(1)}</span>
            <span class="stat">🔥 ${content.supervotes || 0} super votes</span>
          </div>
        </div>
      </div>
    `;
  }

  renderContentHeader(content, rankingData) {
    return `
      <header class="content-header">
        <h1 class="content-title">${this.escapeHtml(content.title)}</h1>
        <div class="content-subtitle">
          <span class="creator">by ${content.creator.displayName}</span>
          <span class="separator">•</span>
          <span class="timestamp">${this.formatTimeAgo(content.createdAt)}</span>
        </div>
      </header>
    `;
  }

  renderContentDescription(content) {
    return `
      <div class="content-description">
        <p>${this.escapeHtml(content.description)}</p>
      </div>
    `;
  }

  renderContentMetadata(content) {
    return `
      <div class="content-metadata">
        <div class="meta-row">
          <span class="meta-label">Game:</span>
          <span class="meta-value">${content.game}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Platform:</span>
          <span class="meta-value">${content.platform}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Category:</span>
          <span class="meta-value">${content.category}</span>
        </div>
        ${content.tags ? `
          <div class="meta-row">
            <span class="meta-label">Tags:</span>
            <div class="tag-list">
              ${content.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderDetailedEngagementMetrics(content, rankingData) {
    return `
      <div class="detailed-metrics">
        <h3>Engagement Analytics</h3>
        ${this.renderEngagementMetrics(content, rankingData)}
        <div class="metrics-chart">
          <!-- Placeholder for engagement chart -->
          <canvas id="engagement-chart-${content.id}" width="400" height="200"></canvas>
        </div>
      </div>
    `;
  }

  renderExpandedCreatorProfile(creator) {
    return `
      <div class="expanded-creator-profile">
        <div class="creator-header">
          ${this.renderCreatorProfile(creator)}
        </div>
        <div class="creator-stats-expanded">
          <div class="stat-item">
            <span class="stat-value">${this.formatNumber(creator.totalViews || 0)}</span>
            <span class="stat-label">Total Views</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${creator.contentCount || 0}</span>
            <span class="stat-label">Content</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${creator.reputation || 0}</span>
            <span class="stat-label">Reputation</span>
          </div>
        </div>
      </div>
    `;
  }

  renderCommentSection(content) {
    return `
      <div class="comment-section">
        <h3>Comments (${content.commentCount || 0})</h3>
        <div class="comment-composer">
          <textarea placeholder="Add a comment..." class="comment-input"></textarea>
          <button class="comment-submit-btn">Post Comment</button>
        </div>
        <div class="comments-list">
          <!-- Comments will be loaded here -->
        </div>
      </div>
    `;
  }

  renderRelatedContent(content) {
    return `
      <div class="related-content">
        <h3>Related Content</h3>
        <div class="related-grid">
          <!-- Related content will be loaded here -->
          <div class="loading-placeholder">Loading related content...</div>
        </div>
      </div>
    `;
  }

  renderImageViewer(content) {
    return `
      <div class="image-viewer" data-content-id="${content.id}">
        <img src="${content.imageUrl}" alt="${this.escapeHtml(content.title)}" 
             class="main-image">
        <div class="image-controls">
          <button class="zoom-in-btn">🔍+</button>
          <button class="zoom-out-btn">🔍-</button>
          <button class="fullscreen-btn">⛶</button>
        </div>
      </div>
    `;
  }

  renderGenericContentViewer(content) {
    return `
      <div class="generic-content-viewer" data-content-id="${content.id}">
        <div class="content-icon">${this.getContentTypeIcon(content.type)}</div>
        <h3>${this.escapeHtml(content.title)}</h3>
        <p>Content preview not available</p>
        ${content.downloadUrl ? `
          <a href="${content.downloadUrl}" class="download-btn" download>
            📥 Download
          </a>
        ` : ''}
      </div>
    `;
  }

  handleVideoPlayback(event) {
    const videoPlayer = event.target.closest('.xbox-video-player');
    const video = videoPlayer.querySelector('.video-element');
    
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }

  toggleActionMenu(event) {
    const menuBtn = event.target.closest('.menu-btn');
    const dropdown = menuBtn.parentElement.querySelector('.dropdown-menu');
    
    // Toggle menu visibility
    const isVisible = dropdown.style.display !== 'none';
    dropdown.style.display = isVisible ? 'none' : 'block';
    
    // Close other open menus
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      if (menu !== dropdown) {
        menu.style.display = 'none';
      }
    });
  }

  // Cleanup method
  destroy() {
    this.eventListeners.forEach((listener, element) => {
      element.removeEventListener(listener.event, listener.handler);
    });
    this.eventListeners.clear();
  }
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  window.ContentDisplayComponents = ContentDisplayComponents;
}

export default ContentDisplayComponents;