/**
 * Mobile Gaming Content Manager for MLG.clan
 * 
 * Advanced content management system optimized for mobile gaming contexts:
 * - Tournament brackets and leaderboard images
 * - Gaming clips and screenshot optimization
 * - User-generated content with bandwidth awareness
 * - Social gaming content with priority loading
 * - Clan media assets with context switching
 * 
 * Features:
 * - Context-aware content prioritization
 * - Smart preloading based on user behavior
 * - Bandwidth-conscious media streaming
 * - Gaming session memory management
 * - Social interaction media optimization
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 */

import MobileMediaOptimizer from './mobile-media-optimizer.js';

/**
 * Gaming Content Type Definitions
 */
const GAMING_CONTENT_TYPES = {
  TOURNAMENT_BRACKET: {
    priority: 'critical',
    preloadRadius: 2,
    sizes: ['mobile', 'tablet'],
    formats: ['webp', 'png'],
    cacheStrategy: 'aggressive',
    updateFrequency: 'real-time'
  },
  LEADERBOARD: {
    priority: 'high',
    preloadRadius: 3,
    sizes: ['mobile', 'tablet'],
    formats: ['webp', 'jpg'],
    cacheStrategy: 'moderate',
    updateFrequency: 'frequent'
  },
  GAMING_CLIP: {
    priority: 'normal',
    preloadRadius: 1,
    sizes: ['thumbnail', 'preview'],
    formats: ['webp', 'jpg'],
    cacheStrategy: 'smart',
    updateFrequency: 'static'
  },
  SCREENSHOT: {
    priority: 'normal',
    preloadRadius: 1,
    sizes: ['thumbnail', 'fullscreen'],
    formats: ['webp', 'jpg'],
    cacheStrategy: 'smart',
    updateFrequency: 'static'
  },
  USER_AVATAR: {
    priority: 'high',
    preloadRadius: 5,
    sizes: ['small', 'medium'],
    formats: ['webp', 'jpg'],
    cacheStrategy: 'aggressive',
    updateFrequency: 'moderate'
  },
  CLAN_BANNER: {
    priority: 'high',
    preloadRadius: 2,
    sizes: ['mobile', 'desktop'],
    formats: ['webp', 'jpg'],
    cacheStrategy: 'moderate',
    updateFrequency: 'rare'
  },
  ACHIEVEMENT_BADGE: {
    priority: 'normal',
    preloadRadius: 10,
    sizes: ['tiny', 'small'],
    formats: ['webp', 'png'],
    cacheStrategy: 'aggressive',
    updateFrequency: 'static'
  },
  SOCIAL_POST_IMAGE: {
    priority: 'normal',
    preloadRadius: 2,
    sizes: ['thumbnail', 'medium'],
    formats: ['webp', 'jpg'],
    cacheStrategy: 'smart',
    updateFrequency: 'static'
  }
};

/**
 * Gaming Context Priorities
 */
const CONTEXT_PRIORITIES = {
  tournament: {
    critical: ['TOURNAMENT_BRACKET', 'LEADERBOARD', 'USER_AVATAR'],
    high: ['GAMING_CLIP', 'ACHIEVEMENT_BADGE'],
    normal: ['SCREENSHOT', 'SOCIAL_POST_IMAGE'],
    low: ['CLAN_BANNER']
  },
  clan: {
    critical: ['CLAN_BANNER', 'USER_AVATAR'],
    high: ['LEADERBOARD', 'ACHIEVEMENT_BADGE'],
    normal: ['GAMING_CLIP', 'SCREENSHOT'],
    low: ['TOURNAMENT_BRACKET', 'SOCIAL_POST_IMAGE']
  },
  voting: {
    critical: ['GAMING_CLIP', 'SCREENSHOT', 'USER_AVATAR'],
    high: ['SOCIAL_POST_IMAGE', 'ACHIEVEMENT_BADGE'],
    normal: ['LEADERBOARD'],
    low: ['TOURNAMENT_BRACKET', 'CLAN_BANNER']
  },
  profile: {
    critical: ['USER_AVATAR', 'ACHIEVEMENT_BADGE'],
    high: ['GAMING_CLIP', 'SCREENSHOT'],
    normal: ['CLAN_BANNER', 'SOCIAL_POST_IMAGE'],
    low: ['TOURNAMENT_BRACKET', 'LEADERBOARD']
  },
  social: {
    critical: ['SOCIAL_POST_IMAGE', 'USER_AVATAR'],
    high: ['GAMING_CLIP', 'SCREENSHOT'],
    normal: ['ACHIEVEMENT_BADGE', 'CLAN_BANNER'],
    low: ['TOURNAMENT_BRACKET', 'LEADERBOARD']
  }
};

/**
 * Mobile Gaming Content Manager Class
 */
export class MobileGamingContentManager {
  constructor(options = {}) {
    this.options = {
      enableSmartPreloading: true,
      enableContextAwareness: true,
      enableBandwidthOptimization: true,
      enableUserBehaviorTracking: true,
      maxConcurrentLoads: 4,
      preloadBudget: 5 * 1024 * 1024, // 5MB
      debugMode: false,
      ...options
    };

    // Initialize mobile media optimizer
    this.mediaOptimizer = MobileMediaOptimizer;

    // Content management state
    this.currentContext = 'general';
    this.contentCache = new Map();
    this.preloadQueue = new Map();
    this.loadingQueue = new Set();
    this.userBehavior = {
      viewedContent: new Set(),
      preferredTypes: new Map(),
      sessionStartTime: Date.now(),
      interactionPattern: []
    };

    // Performance tracking
    this.analytics = {
      contentLoaded: 0,
      cacheHits: 0,
      preloadSuccesses: 0,
      contextSwitches: 0,
      bandwidthSaved: 0
    };

    this.init();
  }

  /**
   * Initialize the content manager
   */
  async init() {
    try {
      await this.setupContextDetection();
      this.setupUserBehaviorTracking();
      this.startPreloadingEngine();
      
      if (this.options.debugMode) {
        this.enableDebugMode();
      }

      console.log('🎮 Mobile Gaming Content Manager initialized');
    } catch (error) {
      console.error('Failed to initialize content manager:', error);
    }
  }

  /**
   * Create tournament bracket display
   */
  createTournamentBracket(config = {}) {
    const {
      tournamentData,
      rounds,
      participants,
      isLive = false,
      showAdvancement = true,
      className = ''
    } = config;

    const container = document.createElement('div');
    container.className = `tournament-bracket-container ${className}`;
    container.style.cssText = `
      width: 100%;
      overflow-x: auto;
      overflow-y: hidden;
      background: linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(10, 10, 15, 0.98));
      border-radius: 12px;
      border: 2px solid rgba(0, 255, 136, 0.3);
      padding: 1rem;
      position: relative;
    `;

    // Add live indicator for active tournaments
    if (isLive) {
      this.addLiveIndicator(container);
    }

    // Create bracket visualization
    const bracket = this.createBracketVisualization(tournamentData, rounds);
    container.appendChild(bracket);

    // Add participant avatars with optimization
    this.addParticipantAvatars(container, participants);

    // Setup auto-refresh for live tournaments
    if (isLive) {
      this.setupLiveBracketUpdates(container, tournamentData.id);
    }

    return container;
  }

  /**
   * Create mobile-optimized leaderboard
   */
  createMobileLeaderboard(config = {}) {
    const {
      leaderboardData,
      type = 'general',
      showRankChange = true,
      isRealTime = false,
      maxEntries = 20,
      className = ''
    } = config;

    const container = document.createElement('div');
    container.className = `mobile-leaderboard ${type}-leaderboard ${className}`;
    container.style.cssText = `
      background: linear-gradient(135deg, rgba(26, 26, 46, 0.9), rgba(10, 10, 15, 0.95));
      border-radius: 12px;
      border: 1px solid rgba(0, 255, 136, 0.3);
      overflow: hidden;
      position: relative;
    `;

    // Add header
    const header = this.createLeaderboardHeader(type, isRealTime);
    container.appendChild(header);

    // Add entries with optimized avatars
    const entriesList = document.createElement('div');
    entriesList.className = 'leaderboard-entries';
    
    leaderboardData.slice(0, maxEntries).forEach((entry, index) => {
      const entryElement = this.createLeaderboardEntry(entry, index, showRankChange);
      entriesList.appendChild(entryElement);
    });

    container.appendChild(entriesList);

    // Setup real-time updates if enabled
    if (isRealTime) {
      this.setupRealTimeLeaderboard(container, type);
    }

    return container;
  }

  /**
   * Create gaming clip gallery with mobile optimizations
   */
  createGamingClipGallery(config = {}) {
    const {
      clips,
      layout = 'grid',
      autoPlay = false,
      showControls = true,
      enableInfiniteScroll = true,
      className = ''
    } = config;

    const container = document.createElement('div');
    container.className = `gaming-clip-gallery ${layout}-layout ${className}`;
    container.style.cssText = `
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      padding: 1rem;
    `;

    // Create clip thumbnails with lazy loading
    clips.forEach((clip, index) => {
      const clipElement = this.createOptimizedClipThumbnail({
        ...clip,
        autoPlay: autoPlay && index === 0, // Only autoplay first clip
        showControls,
        priority: index < 4 ? 'high' : 'normal' // Prioritize first 4 clips
      });
      
      container.appendChild(clipElement);
    });

    // Setup infinite scroll if enabled
    if (enableInfiniteScroll) {
      this.setupInfiniteScroll(container, 'clips');
    }

    // Setup intersection observer for video preloading
    this.setupClipPreloading(container);

    return container;
  }

  /**
   * Create screenshot gallery with mobile touch optimizations
   */
  createScreenshotGallery(config = {}) {
    const {
      screenshots,
      layout = 'masonry',
      enableLightbox = true,
      enableSwipeGestures = true,
      className = ''
    } = config;

    const container = document.createElement('div');
    container.className = `screenshot-gallery ${layout}-layout ${className}`;
    
    if (layout === 'masonry') {
      container.style.cssText = `
        columns: auto;
        column-width: 250px;
        column-gap: 1rem;
        padding: 1rem;
      `;
    } else {
      container.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        padding: 1rem;
      `;
    }

    // Create screenshot thumbnails
    screenshots.forEach((screenshot, index) => {
      const screenshotElement = this.createOptimizedScreenshot({
        ...screenshot,
        priority: index < 6 ? 'high' : 'normal',
        enableLightbox,
        enableSwipeGestures
      });
      
      container.appendChild(screenshotElement);
    });

    // Setup lightbox if enabled
    if (enableLightbox) {
      this.setupScreenshotLightbox(container);
    }

    return container;
  }

  /**
   * Create optimized user avatar with gaming context
   */
  createGamingUserAvatar(config = {}) {
    const {
      userId,
      username,
      avatarUrl,
      size = 'medium',
      showOnlineStatus = true,
      showClanInfo = true,
      showRankBadge = true,
      isInteractive = true,
      className = ''
    } = config;

    const avatarContainer = this.mediaOptimizer.createMobileGamingAvatar({
      src: avatarUrl,
      alt: `${username}'s Avatar`,
      size,
      className: `user-avatar ${className}`,
      priority: 'high'
    });

    // Add user-specific enhancements
    if (showOnlineStatus) {
      this.addUserOnlineStatus(avatarContainer, userId);
    }

    if (showClanInfo) {
      this.addUserClanInfo(avatarContainer, userId);
    }

    if (showRankBadge) {
      this.addUserRankBadge(avatarContainer, userId);
    }

    // Add interactive features for mobile
    if (isInteractive) {
      this.addAvatarInteractivity(avatarContainer, userId, username);
    }

    return avatarContainer;
  }

  /**
   * Create clan banner with member highlights
   */
  createClanBanner(config = {}) {
    const {
      clanData,
      showMemberCount = true,
      showRanking = true,
      showRecentActivity = false,
      enableParallax = false,
      className = ''
    } = config;

    const bannerContainer = this.mediaOptimizer.createMobileClanBanner({
      src: clanData.bannerUrl,
      clanName: clanData.name,
      memberCount: clanData.memberCount,
      rank: clanData.rank,
      className: `clan-banner ${className}`,
      priority: 'high'
    });

    // Add clan-specific information overlays
    if (showMemberCount) {
      this.addMemberCountDisplay(bannerContainer, clanData.memberCount);
    }

    if (showRanking) {
      this.addClanRankingDisplay(bannerContainer, clanData.ranking);
    }

    if (showRecentActivity) {
      this.addRecentActivityFeed(bannerContainer, clanData.recentActivity);
    }

    // Add parallax effect for supported devices
    if (enableParallax && !this.mediaOptimizer.isLowPowerMode) {
      this.addClanBannerParallax(bannerContainer);
    }

    return bannerContainer;
  }

  /**
   * Create social post with embedded media
   */
  createSocialGamePost(config = {}) {
    const {
      postData,
      showUserInfo = true,
      enableInteractions = true,
      autoExpandMedia = false,
      className = ''
    } = config;

    const container = document.createElement('div');
    container.className = `social-game-post ${className}`;
    container.style.cssText = `
      background: linear-gradient(135deg, rgba(26, 26, 46, 0.9), rgba(10, 10, 15, 0.95));
      border-radius: 12px;
      border: 1px solid rgba(0, 255, 136, 0.2);
      padding: 1rem;
      margin-bottom: 1rem;
      position: relative;
    `;

    // Add user info header
    if (showUserInfo) {
      const userHeader = this.createPostUserHeader(postData.user);
      container.appendChild(userHeader);
    }

    // Add post content
    const content = this.createPostContent(postData.content);
    container.appendChild(content);

    // Add embedded media with optimization
    if (postData.media && postData.media.length > 0) {
      const mediaContainer = this.createPostMediaContainer(postData.media, autoExpandMedia);
      container.appendChild(mediaContainer);
    }

    // Add interaction controls
    if (enableInteractions) {
      const interactions = this.createPostInteractions(postData);
      container.appendChild(interactions);
    }

    return container;
  }

  /**
   * Context-aware preloading based on user behavior
   */
  async startContextAwarePreloading(context) {
    if (!this.options.enableSmartPreloading) return;

    const contextPriorities = CONTEXT_PRIORITIES[context];
    if (!contextPriorities) return;

    // Preload critical content types for the current context
    for (const contentType of contextPriorities.critical) {
      await this.preloadContentType(contentType, 'critical');
    }

    // Queue high priority content
    for (const contentType of contextPriorities.high) {
      this.queueContentPreload(contentType, 'high');
    }

    console.log(`🎯 Started preloading for ${context} context`);
  }

  /**
   * Smart bandwidth management
   */
  async manageBandwidthUsage() {
    const connectionType = this.mediaOptimizer.connectionType;
    const isDataSaver = this.mediaOptimizer.dataSaverEnabled;
    
    // Adjust preload strategy based on connection
    if (['slow-2g', '2g'].includes(connectionType) || isDataSaver) {
      this.options.maxConcurrentLoads = 1;
      this.options.preloadBudget = 1 * 1024 * 1024; // 1MB
      this.pauseNonCriticalPreloading();
    } else if (connectionType === '3g') {
      this.options.maxConcurrentLoads = 2;
      this.options.preloadBudget = 3 * 1024 * 1024; // 3MB
    } else {
      this.options.maxConcurrentLoads = 4;
      this.options.preloadBudget = 5 * 1024 * 1024; // 5MB
    }

    console.log(`📊 Bandwidth management updated for ${connectionType}`);
  }

  /**
   * User behavior tracking for smart preloading
   */
  trackUserBehavior(action, contentType, contentId) {
    if (!this.options.enableUserBehaviorTracking) return;

    const interaction = {
      timestamp: Date.now(),
      action,
      contentType,
      contentId,
      context: this.currentContext
    };

    this.userBehavior.interactionPattern.push(interaction);

    // Update preference scoring
    const currentScore = this.userBehavior.preferredTypes.get(contentType) || 0;
    this.userBehavior.preferredTypes.set(contentType, currentScore + 1);

    // Trigger adaptive preloading based on patterns
    this.adaptivePreloadingStrategy(contentType);
  }

  /**
   * Gaming session memory management
   */
  optimizeForGamingSession() {
    // Clean up old content to free memory
    this.cleanupExpiredContent();
    
    // Optimize cache for current context
    this.optimizeCacheForContext(this.currentContext);
    
    // Preload anticipated content
    this.preloadAnticipatedContent();
    
    console.log('🎮 Optimized for gaming session');
  }

  /**
   * Real-time content updates for live gaming events
   */
  setupRealTimeUpdates(contentType, contentId, updateInterval = 5000) {
    const updateKey = `${contentType}-${contentId}`;
    
    const updateLoop = setInterval(async () => {
      try {
        const updatedContent = await this.fetchContentUpdate(contentType, contentId);
        if (updatedContent) {
          await this.updateContent(contentType, contentId, updatedContent);
          console.log(`🔄 Updated ${contentType} content: ${contentId}`);
        }
      } catch (error) {
        console.warn(`Failed to update ${contentType}:`, error);
      }
    }, updateInterval);

    // Store the interval ID for cleanup
    this.realTimeUpdates = this.realTimeUpdates || new Map();
    this.realTimeUpdates.set(updateKey, updateLoop);

    // Auto-cleanup when content is no longer visible
    setTimeout(() => {
      if (this.realTimeUpdates.has(updateKey)) {
        clearInterval(this.realTimeUpdates.get(updateKey));
        this.realTimeUpdates.delete(updateKey);
      }
    }, 300000); // 5 minutes max
  }

  /**
   * Performance analytics and optimization suggestions
   */
  getPerformanceReport() {
    const sessionDuration = Date.now() - this.userBehavior.sessionStartTime;
    const avgLoadTime = this.analytics.contentLoaded > 0 ? 
      this.analytics.totalLoadTime / this.analytics.contentLoaded : 0;

    return {
      sessionDuration: Math.round(sessionDuration / 1000) + 's',
      contentLoaded: this.analytics.contentLoaded,
      cacheHitRate: ((this.analytics.cacheHits / Math.max(this.analytics.contentLoaded, 1)) * 100).toFixed(1) + '%',
      preloadSuccessRate: ((this.analytics.preloadSuccesses / Math.max(this.preloadAttempts || 1, 1)) * 100).toFixed(1) + '%',
      bandwidthSaved: this.formatBytes(this.analytics.bandwidthSaved),
      contextSwitches: this.analytics.contextSwitches,
      averageLoadTime: Math.round(avgLoadTime) + 'ms',
      cacheSize: this.contentCache.size,
      recommendations: this.generateOptimizationRecommendations()
    };
  }

  /**
   * Helper methods for content creation
   */

  createOptimizedClipThumbnail(clipData) {
    return this.mediaOptimizer.createMobileGamingThumbnail({
      src: clipData.thumbnailUrl,
      alt: clipData.title,
      showPlayButton: true,
      duration: clipData.duration,
      views: clipData.views,
      creator: clipData.creator,
      className: 'gaming-clip-thumbnail'
    });
  }

  createOptimizedScreenshot(screenshotData) {
    return this.mediaOptimizer.createMobileGamingThumbnail({
      src: screenshotData.imageUrl,
      alt: screenshotData.description || 'Gaming Screenshot',
      className: 'screenshot-thumbnail',
      size: 'medium'
    });
  }

  addLiveIndicator(container) {
    const liveIndicator = document.createElement('div');
    liveIndicator.className = 'live-indicator';
    liveIndicator.textContent = 'LIVE';
    liveIndicator.style.cssText = `
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: linear-gradient(135deg, #ff4444, #cc3333);
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: bold;
      z-index: 5;
      animation: pulse-live 2s infinite;
    `;
    
    container.appendChild(liveIndicator);
  }

  /**
   * Utility methods
   */

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  generateOptimizationRecommendations() {
    const recommendations = [];
    
    if (this.analytics.cacheHits / Math.max(this.analytics.contentLoaded, 1) < 0.3) {
      recommendations.push('Consider increasing cache duration for better performance');
    }
    
    if (this.mediaOptimizer.isLowPowerMode) {
      recommendations.push('Low battery detected - animations and effects reduced');
    }
    
    if (this.mediaOptimizer.dataSaverEnabled) {
      recommendations.push('Data saver mode active - content quality optimized for bandwidth');
    }
    
    return recommendations;
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    // Clear all intervals and timeouts
    if (this.realTimeUpdates) {
      this.realTimeUpdates.forEach(interval => clearInterval(interval));
      this.realTimeUpdates.clear();
    }
    
    // Clear caches
    this.contentCache.clear();
    this.preloadQueue.clear();
    this.loadingQueue.clear();
    
    console.log('🗑️ Mobile Gaming Content Manager destroyed');
  }
}

// Export styles for the gaming content manager
export const gamingContentStyles = `
  /* Tournament bracket styles */
  .tournament-bracket-container {
    contain: layout style paint;
  }
  
  .live-indicator {
    animation: pulse-live 2s infinite;
  }
  
  @keyframes pulse-live {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
  }
  
  /* Mobile leaderboard styles */
  .mobile-leaderboard {
    contain: layout style paint;
  }
  
  .leaderboard-entry {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    border-bottom: 1px solid rgba(0, 255, 136, 0.1);
    transition: background-color 0.2s ease;
  }
  
  .leaderboard-entry:hover {
    background: rgba(0, 255, 136, 0.05);
  }
  
  /* Gaming clip gallery */
  .gaming-clip-gallery {
    contain: layout style paint;
  }
  
  .gaming-clip-thumbnail {
    position: relative;
    cursor: pointer;
  }
  
  /* Screenshot gallery */
  .screenshot-gallery.masonry-layout .screenshot-thumbnail {
    display: inline-block;
    width: 100%;
    margin-bottom: 1rem;
    break-inside: avoid;
  }
  
  /* Social post styles */
  .social-game-post {
    contain: layout style paint;
  }
  
  .post-user-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }
  
  .post-interactions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(0, 255, 136, 0.1);
  }
`;

// Create and export default instance
export default new MobileGamingContentManager();