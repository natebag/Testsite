# MLG.clan Content Sorting & Display Interface - Technical Specifications

## Sub-task 4.5: Implementation Guide for ui-production-builder

### Overview

This document provides comprehensive technical specifications for implementing the content sorting and display interface for the MLG.clan gaming community platform. The interface maintains the signature Xbox 360 dashboard aesthetic while integrating with the existing content ranking algorithm and MLG token voting system.

### Architecture Integration

#### Core Dependencies

```javascript
// Required imports from existing codebase
import { ContentRankingAlgorithm, rankingModes, gamingRanking } from '../content/content-ranking-algorithm.js';
import { VotingSystem } from '../ui/components/voting-interface-ui.js';
import { MLGToken } from '../tokens/spl-mlg-token.js';
import { ContentAPI } from '../api/content-api.contracts.js';
```

#### Component Structure

```
src/ui/components/content-sorting/
├── ContentSortingInterface.js          # Main container component
├── SortingToolbar.js                   # Xbox blade-style sort controls
├── FilterControls.js                   # Game/Platform/Type filters
├── ViewModeControls.js                 # Grid/List/Detailed view toggles
├── ContentDisplayGrid.js               # Grid layout for content cards
├── ContentDisplayList.js               # List layout for content
├── ContentCard.js                      # Individual content preview card
├── PaginationControls.js               # Pagination and infinite scroll
├── AdvancedFilters.js                  # Collapsible advanced filter panel
├── SearchIntegration.js                # Search with sorting integration
├── LoadingStates.js                    # Loading and shimmer components
└── styles/
    ├── xbox-aesthetic.css              # Xbox 360 dashboard styling
    ├── sorting-animations.css          # Transition and hover effects
    └── responsive-design.css           # Mobile-first responsive design
```

### Core Component Specifications

#### 1. ContentSortingInterface.js (Main Container)

```javascript
export class ContentSortingInterface extends HTMLElement {
    constructor() {
        super();
        this.state = {
            sortMode: 'hot',                    // hot, trending, top, new, controversial
            viewMode: 'grid',                   // grid, list, detailed
            filters: {
                game: 'all',
                platform: 'all',
                contentType: 'all',
                timeRange: '24h',
                skillLevel: [],
                minVotes: 0,
                verifiedOnly: false
            },
            searchQuery: '',
            currentPage: 1,
            itemsPerPage: 20,
            content: [],
            loading: false,
            totalResults: 0
        };
        
        this.rankingAlgorithm = new ContentRankingAlgorithm();
        this.votingSystem = new VotingSystem();
        
        this.bindEvents();
        this.initializeWebSocket();
    }
    
    // Real-time content updates via WebSocket
    initializeWebSocket() {
        this.ws = new WebSocket('ws://localhost:3001/content-updates');
        this.ws.onmessage = (event) => {
            const update = JSON.parse(event.data);
            this.handleRealTimeUpdate(update);
        };
    }
    
    // Handle real-time vote and ranking updates
    handleRealTimeUpdate(update) {
        if (update.type === 'vote_update') {
            this.updateContentVotes(update.contentId, update.newVotes);
        } else if (update.type === 'ranking_update') {
            this.refreshContentRanking();
        }
    }
    
    // Main sorting method with performance optimization
    async sortContent(sortMode, filters = {}) {
        this.setState({ loading: true, sortMode });
        
        try {
            // Batch fetch content based on filters
            const contentList = await this.fetchFilteredContent(filters);
            
            // Apply ranking algorithm based on sort mode
            const rankedContent = this.rankingAlgorithm.rankContent(contentList, {
                mode: sortMode,
                limit: this.state.itemsPerPage,
                offset: (this.state.currentPage - 1) * this.state.itemsPerPage,
                timeWindowHours: this.getTimeWindowFromRange(filters.timeRange)
            });
            
            this.setState({ 
                content: rankedContent,
                totalResults: contentList.length,
                loading: false 
            });
            
            // Announce to screen readers
            this.announceToScreenReader(`Content sorted by ${sortMode}. ${rankedContent.length} results loaded.`);
            
        } catch (error) {
            console.error('Sorting failed:', error);
            this.setState({ loading: false });
            this.showErrorMessage('Failed to sort content. Please try again.');
        }
    }
    
    // Apply multiple filters with debouncing for performance
    applyFilters(newFilters) {
        this.setState({ filters: { ...this.state.filters, ...newFilters } });
        
        // Debounce filter application to prevent excessive API calls
        clearTimeout(this.filterTimeout);
        this.filterTimeout = setTimeout(() => {
            this.sortContent(this.state.sortMode, this.state.filters);
        }, 300);
    }
    
    // Search integration with sorting preservation
    handleSearch(query) {
        this.setState({ searchQuery: query });
        
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.sortContent(this.state.sortMode, {
                ...this.state.filters,
                search: query
            });
        }, 500);
    }
}
```

#### 2. SortingToolbar.js (Xbox Blade Controls)

```javascript
export class SortingToolbar extends HTMLElement {
    constructor() {
        super();
        this.sortModes = [
            { 
                key: 'hot', 
                label: 'Hot', 
                icon: '🔥', 
                description: 'Balanced engagement',
                algorithm: 'Hot content with sustained engagement'
            },
            { 
                key: 'trending', 
                label: 'Trending', 
                icon: '📈', 
                description: 'Rising fast',
                algorithm: 'High velocity and recent engagement'
            },
            { 
                key: 'top', 
                label: 'Top', 
                icon: '⭐', 
                description: 'All-time best',
                algorithm: 'Highest quality content based on total votes'
            },
            { 
                key: 'new', 
                label: 'New', 
                icon: '🆕', 
                description: 'Recently posted',
                algorithm: 'Most recent content with quality filtering'
            },
            { 
                key: 'controversial', 
                label: 'Controversial', 
                icon: '⚡', 
                description: 'Mixed reactions',
                algorithm: 'Content with high engagement but mixed sentiment'
            },
            { 
                key: 'competitive', 
                label: 'Competitive', 
                icon: '🏆', 
                description: 'Esports focus',
                algorithm: 'Tournament and ranked gameplay content'
            }
        ];
    }
    
    render() {
        return `
            <div class="sorting-toolbar">
                <div class="xbox-blade-container">
                    ${this.sortModes.map(mode => `
                        <button class="sort-tile ${mode.key === this.currentSort ? 'active' : ''}"
                                data-sort="${mode.key}"
                                role="tab"
                                aria-selected="${mode.key === this.currentSort}"
                                aria-describedby="sort-${mode.key}-description">
                            <div class="sort-icon">${mode.icon}</div>
                            <div class="sort-label">${mode.label}</div>
                            <div class="sort-description">${mode.description}</div>
                            <div class="sort-indicator" aria-hidden="true"></div>
                        </button>
                        <div id="sort-${mode.key}-description" class="sr-only">
                            ${mode.algorithm}
                        </div>
                    `).join('')}
                </div>
                
                <!-- Sort Direction and Time Range -->
                <div class="sort-controls">
                    <button class="sort-direction-btn" 
                            aria-label="Toggle sort direction"
                            onclick="toggleSortDirection()">
                        <span class="direction-icon">${this.sortDirection === 'desc' ? '↓' : '↑'}</span>
                        <span>${this.sortDirection === 'desc' ? 'Descending' : 'Ascending'}</span>
                    </button>
                    
                    <select class="time-range-select" 
                            aria-label="Select time range for content"
                            onchange="updateTimeRange(this.value)">
                        <option value="1h">Last Hour</option>
                        <option value="24h" selected>Last 24 hours</option>
                        <option value="7d">Last Week</option>
                        <option value="30d">Last Month</option>
                        <option value="all">All Time</option>
                    </select>
                    
                    <div class="result-count" role="status" aria-live="polite">
                        <span class="count-number">${this.totalResults?.toLocaleString() || 0}</span>
                        <span class="count-label">results</span>
                    </div>
                </div>
                
                <!-- Real-time Update Indicator -->
                <div class="live-indicator" aria-label="Content updating in real-time">
                    <div class="pulse-dot"></div>
                    <span>Live sorting</span>
                </div>
            </div>
        `;
    }
    
    // Handle Xbox blade navigation with keyboard
    handleKeyNavigation(event) {
        const tiles = this.querySelectorAll('.sort-tile');
        const currentIndex = Array.from(tiles).findIndex(tile => 
            tile.classList.contains('active'));
        
        let newIndex = currentIndex;
        
        switch (event.key) {
            case 'ArrowLeft':
                newIndex = Math.max(0, currentIndex - 1);
                break;
            case 'ArrowRight':
                newIndex = Math.min(tiles.length - 1, currentIndex + 1);
                break;
            case 'Home':
                newIndex = 0;
                break;
            case 'End':
                newIndex = tiles.length - 1;
                break;
            case 'Enter':
            case ' ':
                this.selectSortMode(tiles[currentIndex]);
                return;
        }
        
        if (newIndex !== currentIndex) {
            tiles[newIndex].focus();
            event.preventDefault();
        }
    }
}
```

#### 3. ContentCard.js (Gaming Content Cards)

```javascript
export class ContentCard extends HTMLElement {
    constructor() {
        super();
        this.votingSystem = new VotingSystem();
        this.content = null;
    }
    
    setContent(content) {
        this.content = content;
        this.render();
        this.bindVotingEvents();
    }
    
    render() {
        const { content } = this;
        if (!content) return;
        
        return `
            <article class="content-card" 
                     role="article" 
                     aria-labelledby="content-${content.id}-title"
                     data-content-id="${content.id}">
                
                <!-- Content Preview -->
                <div class="content-preview">
                    <img src="${content.thumbnail}" 
                         alt="${content.title}"
                         class="preview-image"
                         loading="lazy">
                    
                    <!-- Trending/Status Badges -->
                    ${content.isTrending ? '<div class="trending-badge">🔥 TRENDING</div>' : ''}
                    ${content.isCompetitive ? '<div class="competitive-badge">🏆 COMPETITIVE</div>' : ''}
                    
                    <!-- Duration for video content -->
                    ${content.contentType === 'video_clip' ? 
                        `<div class="duration-badge">${this.formatDuration(content.duration)}</div>` : ''}
                </div>
                
                <!-- Content Metadata -->
                <div class="content-metadata">
                    <h3 id="content-${content.id}-title" class="content-title">
                        ${content.title}
                    </h3>
                    
                    <div class="content-details">
                        <span class="game-name">${content.game}</span>
                        <span aria-hidden="true">•</span>
                        <span class="platform">${content.platform}</span>
                        <span aria-hidden="true">•</span>
                        <time datetime="${content.createdAt}" class="timestamp">
                            ${this.getRelativeTime(content.createdAt)}
                        </time>
                    </div>
                    
                    <!-- Content Tags -->
                    <div class="content-tags" role="list">
                        ${content.tags?.map(tag => 
                            `<span class="tag" role="listitem">${tag}</span>`
                        ).join('') || ''}
                    </div>
                </div>
                
                <!-- Voting Integration -->
                <div class="voting-section">
                    <div class="vote-controls">
                        <button class="vote-button upvote ${content.userVote === 'up' ? 'active' : ''}"
                                aria-label="Upvote this content"
                                data-vote-type="up"
                                data-content-id="${content.id}">
                            <svg class="vote-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"/>
                            </svg>
                            <span class="vote-count">${content.mlgVotes?.upvotes || 0}</span>
                        </button>
                        
                        <button class="vote-button downvote ${content.userVote === 'down' ? 'active' : ''}"
                                aria-label="Downvote this content"
                                data-vote-type="down"
                                data-content-id="${content.id}">
                            <svg class="vote-icon rotate-180" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"/>
                            </svg>
                            <span class="vote-count">${content.mlgVotes?.downvotes || 0}</span>
                        </button>
                    </div>
                    
                    <!-- MLG Token Super Vote -->
                    <button class="super-vote-button"
                            aria-label="Cast super vote with MLG tokens"
                            onclick="openSuperVoteDialog('${content.id}')">
                        <span class="token-icon">🪙</span>
                        <span>Super Vote</span>
                        <span class="super-vote-count">${content.mlgVotes?.superVotes || 0}</span>
                    </button>
                    
                    <!-- Engagement Stats -->
                    <div class="engagement-stats">
                        <span class="views">${this.formatNumber(content.views)} views</span>
                        <button class="comments-btn" aria-label="View comments">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                            </svg>
                            <span>${content.comments || 0}</span>
                        </button>
                    </div>
                </div>
                
                <!-- Creator Information -->
                <div class="creator-info">
                    <div class="creator-profile">
                        <img src="${content.creator?.avatar || '/placeholder-avatar.png'}" 
                             alt="${content.creator?.username}"
                             class="creator-avatar">
                        <span class="creator-username">${content.creator?.username}</span>
                        ${content.creator?.verified ? '<span class="verified-badge">✓ Verified</span>' : ''}
                    </div>
                    
                    <div class="creator-stats">
                        <span class="gamerscore">
                            <span class="star-icon">★</span>
                            ${this.formatNumber(content.creator?.gamerscore || 0)} GS
                        </span>
                    </div>
                </div>
            </article>
        `;
    }
    
    // Handle MLG token voting integration
    async handleVote(voteType, contentId) {
        try {
            const voteResult = await this.votingSystem.submitVote(contentId, voteType);
            
            if (voteResult.success) {
                this.updateVoteDisplay(voteType, voteResult.newCounts);
                this.announceVoteSuccess(voteType);
            } else {
                this.showVoteError(voteResult.error);
            }
        } catch (error) {
            console.error('Vote failed:', error);
            this.showVoteError('Voting failed. Please check your wallet connection.');
        }
    }
    
    // Super vote with MLG token burning
    async handleSuperVote(contentId, tokenAmount) {
        const confirmDialog = new SuperVoteConfirmationDialog(contentId, tokenAmount);
        const confirmed = await confirmDialog.show();
        
        if (confirmed) {
            try {
                const burnResult = await this.votingSystem.burnTokensForVote(contentId, tokenAmount);
                
                if (burnResult.success) {
                    this.updateSuperVoteDisplay(burnResult.newCount);
                    this.showBurnEffect();
                    this.announceToScreenReader(`Super vote cast successfully. ${tokenAmount} MLG tokens burned.`);
                }
            } catch (error) {
                this.showVoteError('Super vote failed. Please try again.');
            }
        }
    }
    
    // Real-time vote updates via WebSocket
    updateVotesFromWebSocket(voteUpdate) {
        if (voteUpdate.contentId === this.content.id) {
            this.content.mlgVotes = voteUpdate.votes;
            this.updateVoteDisplay();
        }
    }
}
```

### Styling Specifications (Xbox 360 Aesthetic)

#### CSS Variables for Theming

```css
:root {
    /* Xbox 360 Color Palette */
    --xbox-green: #10b981;
    --xbox-green-light: #34d399;
    --xbox-green-dark: #047857;
    
    /* Gaming Background Gradients */
    --blade-gradient: linear-gradient(135deg, #111827, #1f2937, #065f46);
    --tile-gradient: linear-gradient(135deg, #064e3b, #065f46);
    --active-tile-gradient: linear-gradient(135deg, #10b981, #059669);
    
    /* Typography */
    --xbox-font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
    --heading-font-weight: 700;
    --body-font-weight: 400;
    
    /* Spacing System (8px grid) */
    --space-1: 0.25rem;    /* 4px */
    --space-2: 0.5rem;     /* 8px */
    --space-3: 0.75rem;    /* 12px */
    --space-4: 1rem;       /* 16px */
    --space-6: 1.5rem;     /* 24px */
    --space-8: 2rem;       /* 32px */
    --space-12: 3rem;      /* 48px */
    
    /* Border Radius */
    --border-radius-sm: 0.375rem;
    --border-radius: 0.5rem;
    --border-radius-lg: 0.75rem;
    --border-radius-xl: 1rem;
    
    /* Shadows */
    --shadow-xbox: 0 10px 25px rgba(16, 185, 129, 0.3);
    --shadow-hover: 0 12px 28px rgba(0, 0, 0, 0.4);
    --shadow-glow: 0 0 20px rgba(16, 185, 129, 0.6);
    
    /* Transitions */
    --transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    --transition-normal: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    --transition-slow: 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
```

#### Xbox Blade Navigation Animation

```css
.xbox-blade {
    background: var(--blade-gradient);
    border: 1px solid var(--xbox-green);
    transition: all var(--transition-normal);
    position: relative;
    overflow: hidden;
}

.xbox-blade::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.1), transparent);
    transition: left 0.6s ease;
}

.xbox-blade:hover::before {
    left: 100%;
}

.xbox-blade:hover {
    transform: translateX(var(--space-2));
    box-shadow: var(--shadow-xbox);
    border-color: var(--xbox-green-light);
}

/* Mobile touch optimization */
@media (hover: none) {
    .xbox-blade:active {
        transform: scale(0.98);
    }
}
```

#### Sort Tile Active States

```css
.sort-tile {
    background: var(--tile-gradient);
    border: 1px solid var(--xbox-green);
    transition: all var(--transition-normal);
    position: relative;
    padding: var(--space-6) var(--space-4);
    border-radius: var(--border-radius-lg);
    text-align: center;
    cursor: pointer;
}

.sort-tile:hover {
    transform: scale(1.02);
    box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4);
    background: linear-gradient(135deg, #065f46, #047857);
}

.sort-tile.active {
    background: var(--active-tile-gradient);
    box-shadow: var(--shadow-glow);
    transform: scale(1.02);
}

.sort-tile.active .sort-indicator {
    background: linear-gradient(45deg, #fbbf24, #f59e0b);
    animation: pulse-gold 2s infinite;
}

@keyframes pulse-gold {
    0%, 100% { 
        box-shadow: 0 0 8px rgba(251, 191, 36, 0.4); 
    }
    50% { 
        box-shadow: 0 0 16px rgba(245, 158, 11, 0.6); 
    }
}
```

### Performance Optimization

#### 1. Virtual Scrolling for Large Content Lists

```javascript
class VirtualScrollManager {
    constructor(container, itemHeight = 200, bufferSize = 5) {
        this.container = container;
        this.itemHeight = itemHeight;
        this.bufferSize = bufferSize;
        this.scrollTop = 0;
        this.containerHeight = container.clientHeight;
        
        this.bindScrollEvents();
    }
    
    calculateVisibleRange(contentLength) {
        const startIndex = Math.floor(this.scrollTop / this.itemHeight);
        const endIndex = Math.min(
            startIndex + Math.ceil(this.containerHeight / this.itemHeight) + this.bufferSize,
            contentLength - 1
        );
        
        return {
            startIndex: Math.max(0, startIndex - this.bufferSize),
            endIndex,
            offsetY: startIndex * this.itemHeight
        };
    }
    
    renderVisibleItems(content, renderFunction) {
        const { startIndex, endIndex, offsetY } = this.calculateVisibleRange(content.length);
        const visibleItems = content.slice(startIndex, endIndex + 1);
        
        this.container.style.paddingTop = `${offsetY}px`;
        this.container.style.paddingBottom = `${(content.length - endIndex - 1) * this.itemHeight}px`;
        
        return visibleItems.map((item, index) => 
            renderFunction(item, startIndex + index));
    }
}
```

#### 2. Content Caching Strategy

```javascript
class ContentCacheManager {
    constructor() {
        this.cache = new Map();
        this.maxCacheSize = 1000;
        this.ttl = 5 * 60 * 1000; // 5 minutes
    }
    
    set(key, data) {
        const cacheEntry = {
            data,
            timestamp: Date.now(),
            accessCount: 1
        };
        
        // Remove oldest entries if cache is full
        if (this.cache.size >= this.maxCacheSize) {
            const oldestKey = Array.from(this.cache.keys())[0];
            this.cache.delete(oldestKey);
        }
        
        this.cache.set(key, cacheEntry);
    }
    
    get(key) {
        const entry = this.cache.get(key);
        
        if (!entry || (Date.now() - entry.timestamp) > this.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        entry.accessCount++;
        return entry.data;
    }
    
    invalidateByPattern(pattern) {
        for (const [key] of this.cache) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }
}
```

### Accessibility Implementation

#### 1. Screen Reader Announcements

```javascript
class AccessibilityManager {
    constructor() {
        this.announcer = this.createAnnouncer();
    }
    
    createAnnouncer() {
        const announcer = document.createElement('div');
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        document.body.appendChild(announcer);
        return announcer;
    }
    
    announce(message, priority = 'polite') {
        this.announcer.setAttribute('aria-live', priority);
        this.announcer.textContent = message;
        
        // Clear announcement after screen reader has time to read it
        setTimeout(() => {
            this.announcer.textContent = '';
        }, 1000);
    }
    
    announceContentUpdate(sortType, resultCount) {
        const message = `Content sorted by ${sortType}. ${resultCount} results loaded.`;
        this.announce(message);
    }
    
    announceVoteSuccess(voteType, newCount) {
        const message = `${voteType === 'up' ? 'Upvote' : 'Downvote'} registered. New count: ${newCount}.`;
        this.announce(message);
    }
}
```

#### 2. Keyboard Navigation

```javascript
class KeyboardNavigationManager {
    constructor(container) {
        this.container = container;
        this.currentFocus = null;
        this.bindKeyEvents();
    }
    
    bindKeyEvents() {
        this.container.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'Tab':
                    this.handleTabNavigation(e);
                    break;
                case 'ArrowUp':
                case 'ArrowDown':
                case 'ArrowLeft':
                case 'ArrowRight':
                    this.handleArrowNavigation(e);
                    break;
                case 'Enter':
                case ' ':
                    this.handleActivation(e);
                    break;
                case 'Escape':
                    this.handleEscape(e);
                    break;
                case 'Home':
                case 'End':
                    this.handleHomeEnd(e);
                    break;
            }
        });
    }
    
    handleArrowNavigation(event) {
        const focusableElements = this.getFocusableElements();
        const currentIndex = focusableElements.indexOf(document.activeElement);
        
        let newIndex;
        
        switch (event.key) {
            case 'ArrowUp':
                newIndex = Math.max(0, currentIndex - this.getGridColumns());
                break;
            case 'ArrowDown':
                newIndex = Math.min(focusableElements.length - 1, currentIndex + this.getGridColumns());
                break;
            case 'ArrowLeft':
                newIndex = Math.max(0, currentIndex - 1);
                break;
            case 'ArrowRight':
                newIndex = Math.min(focusableElements.length - 1, currentIndex + 1);
                break;
        }
        
        if (newIndex !== undefined && newIndex !== currentIndex) {
            focusableElements[newIndex].focus();
            event.preventDefault();
        }
    }
    
    getFocusableElements() {
        const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        return Array.from(this.container.querySelectorAll(selector))
            .filter(el => !el.disabled && el.offsetParent !== null);
    }
}
```

### Mobile Responsiveness

#### 1. Touch-Friendly Controls

```css
/* Mobile-first responsive design */
@media (max-width: 768px) {
    .sort-tile {
        min-height: 44px; /* Minimum touch target size */
        padding: var(--space-3) var(--space-4);
        font-size: 0.875rem;
    }
    
    .content-grid {
        grid-template-columns: 1fr;
        gap: var(--space-4);
    }
    
    .vote-button {
        min-width: 44px;
        min-height: 44px;
    }
    
    /* Horizontal scroll for sort options */
    .xbox-blade-container {
        display: flex;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
        padding-bottom: var(--space-2);
    }
    
    .sort-tile {
        scroll-snap-align: start;
        flex: 0 0 auto;
        min-width: 120px;
    }
    
    /* Mobile filter panel */
    .advanced-filter-panel {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        max-height: 70vh;
        border-radius: var(--border-radius-xl) var(--border-radius-xl) 0 0;
        transform: translateY(100%);
    }
    
    .advanced-filter-panel.open {
        transform: translateY(0);
    }
}
```

#### 2. Progressive Web App Features

```javascript
// Service worker registration for offline support
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(registration => {
            console.log('SW registered', registration);
        })
        .catch(error => {
            console.log('SW registration failed', error);
        });
}

// Offline content caching
class OfflineCacheManager {
    constructor() {
        this.cacheName = 'mlg-content-v1';
        this.offlineContent = [];
    }
    
    async cacheContent(content) {
        if ('caches' in window) {
            const cache = await caches.open(this.cacheName);
            const contentData = JSON.stringify(content);
            const response = new Response(contentData);
            await cache.put(`/content/${content.id}`, response);
        }
    }
    
    async getOfflineContent() {
        if ('caches' in window) {
            const cache = await caches.open(this.cacheName);
            const keys = await cache.keys();
            const content = [];
            
            for (const key of keys) {
                const response = await cache.match(key);
                const data = await response.json();
                content.push(data);
            }
            
            return content;
        }
        return [];
    }
}
```

### Testing Strategy

#### 1. Unit Tests for Components

```javascript
// Example Jest test for ContentSortingInterface
import { ContentSortingInterface } from '../ContentSortingInterface.js';
import { ContentRankingAlgorithm } from '../../../content/content-ranking-algorithm.js';

describe('ContentSortingInterface', () => {
    let sortingInterface;
    let mockContent;
    
    beforeEach(() => {
        sortingInterface = new ContentSortingInterface();
        mockContent = [
            {
                id: '1',
                title: 'Epic Gaming Moment',
                game: 'fortnite',
                platform: 'pc',
                mlgVotes: { upvotes: 100, downvotes: 5 },
                createdAt: new Date().toISOString()
            }
        ];
    });
    
    test('should sort content by hot algorithm', async () => {
        const result = await sortingInterface.sortContent('hot', {});
        expect(result).toBeDefined();
        expect(sortingInterface.state.sortMode).toBe('hot');
    });
    
    test('should apply filters correctly', async () => {
        const filters = { game: 'fortnite', platform: 'pc' };
        await sortingInterface.applyFilters(filters);
        
        expect(sortingInterface.state.filters.game).toBe('fortnite');
        expect(sortingInterface.state.filters.platform).toBe('pc');
    });
    
    test('should handle search with debouncing', (done) => {
        const searchQuery = 'epic gaming';
        sortingInterface.handleSearch(searchQuery);
        
        expect(sortingInterface.state.searchQuery).toBe(searchQuery);
        
        setTimeout(() => {
            // Check if search was applied after debounce
            done();
        }, 600);
    });
});
```

#### 2. Accessibility Testing

```javascript
// Automated accessibility tests with axe-core
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Content Sorting Interface Accessibility', () => {
    test('should have no accessibility violations', async () => {
        const container = document.createElement('div');
        const sortingInterface = new ContentSortingInterface();
        container.appendChild(sortingInterface);
        
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
    
    test('should support keyboard navigation', () => {
        const sortingInterface = new ContentSortingInterface();
        const firstTile = sortingInterface.querySelector('.sort-tile');
        
        firstTile.focus();
        
        // Simulate arrow key navigation
        const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
        firstTile.dispatchEvent(event);
        
        // Check that focus moved to next tile
        const nextTile = sortingInterface.querySelector('.sort-tile:nth-child(2)');
        expect(document.activeElement).toBe(nextTile);
    });
});
```

### Deployment Configuration

#### 1. Build Process

```json
// package.json scripts
{
  "scripts": {
    "build:sorting": "rollup -c rollup.sorting.config.js",
    "test:sorting": "jest src/ui/components/content-sorting/",
    "test:a11y": "jest --config jest.a11y.config.js",
    "lint:css": "stylelint src/ui/components/content-sorting/styles/**/*.css",
    "optimize:images": "imagemin src/assets/images/* --out-dir=dist/images"
  }
}
```

#### 2. Performance Budget

```javascript
// webpack-bundle-analyzer configuration
module.exports = {
  performance: {
    maxAssetSize: 250000,        // 250KB per asset
    maxEntrypointSize: 400000,   // 400KB per entry point
    hints: 'warning'
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        sorting: {
          name: 'content-sorting',
          test: /[\\/]content-sorting[\\/]/,
          chunks: 'all',
          priority: 10
        },
        vendor: {
          name: 'vendors',
          test: /[\\/]node_modules[\\/]/,
          chunks: 'all',
          priority: 5
        }
      }
    }
  }
};
```

This comprehensive technical specification provides the ui-production-builder with all necessary details to implement a production-ready content sorting and display interface that maintains the Xbox 360 aesthetic while integrating seamlessly with the existing MLG.clan platform architecture.

The implementation prioritizes performance, accessibility, and mobile-first responsive design while leveraging the sophisticated content ranking algorithm and MLG token voting system already built in previous sub-tasks.