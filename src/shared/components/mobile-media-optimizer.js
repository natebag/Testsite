/**
 * Mobile Media Optimizer for MLG.clan Gaming Platform
 * 
 * Advanced mobile-specific media optimization system optimized for:
 * - Gaming content (clips, screenshots, tournament brackets)
 * - Bandwidth-conscious delivery
 * - Network-aware adaptive loading
 * - Gaming context awareness
 * - Xbox 360 aesthetic preservation
 * 
 * Features:
 * - Adaptive image quality based on connection speed
 * - Gaming context-aware prioritization
 * - Smart preloading for anticipated content
 * - Data saver mode support
 * - Battery optimization for mobile gaming sessions
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 */

import { ResponsiveImageSystem } from './responsive-image-system.js';
import { MLGLazyImageLoader } from '../utils/lazy-loading/lazy-image-loader.js';

/**
 * Mobile Media Optimization Configuration
 */
const MOBILE_MEDIA_CONFIG = {
  // Connection-based quality presets
  connectionProfiles: {
    'slow-2g': {
      imageQuality: 45,
      maxWidth: 360,
      formats: ['webp', 'jpg'],
      enablePrefetch: false,
      maxConcurrent: 1,
      dataSaverMode: true
    },
    '2g': {
      imageQuality: 55,
      maxWidth: 480,
      formats: ['webp', 'jpg'],
      enablePrefetch: false,
      maxConcurrent: 2,
      dataSaverMode: true
    },
    '3g': {
      imageQuality: 70,
      maxWidth: 720,
      formats: ['webp', 'avif', 'jpg'],
      enablePrefetch: true,
      maxConcurrent: 3,
      dataSaverMode: false
    },
    '4g': {
      imageQuality: 85,
      maxWidth: 1080,
      formats: ['avif', 'webp', 'jpg'],
      enablePrefetch: true,
      maxConcurrent: 4,
      dataSaverMode: false
    },
    '5g': {
      imageQuality: 95,
      maxWidth: 1440,
      formats: ['avif', 'webp', 'jpg'],
      enablePrefetch: true,
      maxConcurrent: 6,
      dataSaverMode: false
    }
  },

  // Gaming context priorities
  gamingContexts: {
    tournament: {
      priority: 'high',
      preloadRadius: 5,
      criticalAssets: ['brackets', 'leaderboards', 'player-avatars']
    },
    clan: {
      priority: 'medium',
      preloadRadius: 3,
      criticalAssets: ['clan-banners', 'member-avatars', 'clan-stats']
    },
    voting: {
      priority: 'high',
      preloadRadius: 4,
      criticalAssets: ['content-thumbnails', 'creator-avatars']
    },
    profile: {
      priority: 'low',
      preloadRadius: 2,
      criticalAssets: ['profile-avatar', 'achievement-badges']
    },
    social: {
      priority: 'medium',
      preloadRadius: 3,
      criticalAssets: ['gaming-clips', 'screenshots', 'reaction-gifs']
    }
  },

  // Mobile-specific size presets
  mobileSizes: {
    avatar: {
      small: { width: 32, height: 32 },
      medium: { width: 48, height: 48 },
      large: { width: 72, height: 72 },
      profile: { width: 96, height: 96 }
    },
    thumbnail: {
      small: { width: 120, height: 90 },
      medium: { width: 180, height: 135 },
      large: { width: 240, height: 180 }
    },
    hero: {
      mobile: { width: 375, height: 211 },
      tablet: { width: 768, height: 432 },
      desktop: { width: 1024, height: 576 }
    },
    badge: {
      tiny: { width: 16, height: 16 },
      small: { width: 24, height: 24 },
      medium: { width: 32, height: 32 }
    }
  },

  // Performance thresholds
  performance: {
    maxMemoryUsage: 50 * 1024 * 1024, // 50MB
    lowBatteryThreshold: 0.2, // 20%
    maxLoadTime: 3000, // 3 seconds
    priorityLoadTime: 1000, // 1 second for priority content
    dataSaverBudget: 2 * 1024 * 1024 // 2MB per session
  },

  // Xbox 360 gaming aesthetic
  gamingStyles: {
    loadingPlaceholder: {
      background: 'linear-gradient(135deg, #1a1a2e 0%, #0a0a0f 100%)',
      borderColor: 'rgba(0, 255, 136, 0.3)',
      textColor: '#00ff88'
    },
    errorPlaceholder: {
      background: 'linear-gradient(135deg, #2e1a1a 0%, #0f0a0a 100%)',
      borderColor: 'rgba(255, 68, 68, 0.3)',
      textColor: '#ff4444'
    }
  }
};

/**
 * Mobile Media Optimizer Class
 */
export class MobileMediaOptimizer {
  constructor(options = {}) {
    this.options = {
      enableAdaptiveQuality: true,
      enableContextAwarePriority: true,
      enableDataSaver: true,
      enableBatteryOptimization: true,
      enableAnalytics: true,
      debugMode: false,
      ...options
    };

    // System state
    this.connectionType = 'unknown';
    this.batteryLevel = 1;
    this.isLowPowerMode = false;
    this.dataSaverEnabled = false;
    this.currentContext = 'general';
    this.sessionBandwidthUsed = 0;

    // Optimization systems
    this.responsiveImageSystem = new ResponsiveImageSystem();
    this.lazyLoader = new MLGLazyImageLoader();
    
    // Caching and queues
    this.preloadQueue = [];
    this.loadingQueue = [];
    this.priorityQueue = [];
    this.imageCache = new Map();
    this.contextCache = new Map();

    // Performance tracking
    this.analytics = {
      imagesOptimized: 0,
      bytessSaved: 0,
      averageLoadTime: 0,
      contextSwitches: 0,
      dataSaverActivations: 0,
      batteryOptimizations: 0
    };

    this.init();
  }

  /**
   * Initialize the mobile media optimizer
   */
  async init() {
    try {
      await this.detectNetworkConditions();
      await this.detectBatteryStatus();
      this.setupEventListeners();
      this.initializeContextDetection();
      
      if (this.options.debugMode) {
        this.enableDebugMode();
      }

      console.log('📱 Mobile Media Optimizer initialized', {
        connection: this.connectionType,
        battery: this.batteryLevel,
        dataSaver: this.dataSaverEnabled
      });
    } catch (error) {
      console.error('Failed to initialize Mobile Media Optimizer:', error);
    }
  }

  /**
   * Detect network conditions for adaptive optimization
   */
  async detectNetworkConditions() {
    // Use Network Information API if available
    if ('connection' in navigator) {
      const connection = navigator.connection;
      this.connectionType = connection.effectiveType || connection.type || '4g';
      this.dataSaverEnabled = connection.saveData || false;

      // Listen for connection changes
      connection.addEventListener('change', () => {
        this.connectionType = connection.effectiveType || connection.type || '4g';
        this.dataSaverEnabled = connection.saveData || false;
        this.onNetworkChange();
      });
    } else {
      // Fallback: estimate connection based on timing
      this.connectionType = await this.estimateConnectionSpeed();
    }

    // Enable data saver mode for slow connections
    if (['slow-2g', '2g'].includes(this.connectionType)) {
      this.dataSaverEnabled = true;
    }
  }

  /**
   * Detect battery status for power optimization
   */
  async detectBatteryStatus() {
    try {
      if ('getBattery' in navigator) {
        const battery = await navigator.getBattery();
        this.batteryLevel = battery.level;
        this.isLowPowerMode = battery.level < MOBILE_MEDIA_CONFIG.performance.lowBatteryThreshold;

        // Listen for battery changes
        battery.addEventListener('levelchange', () => {
          this.batteryLevel = battery.level;
          this.isLowPowerMode = battery.level < MOBILE_MEDIA_CONFIG.performance.lowBatteryThreshold;
          this.onBatteryChange();
        });

        battery.addEventListener('chargingchange', () => {
          this.onBatteryChange();
        });
      }
    } catch (error) {
      console.warn('Battery API not available:', error);
    }
  }

  /**
   * Setup event listeners for context changes
   */
  setupEventListeners() {
    // Listen for page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseOptimization();
      } else {
        this.resumeOptimization();
      }
    });

    // Listen for orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.recalculateImageSizes(), 100);
    });

    // Listen for memory pressure warnings
    if ('memory' in performance && performance.memory) {
      setInterval(() => {
        this.checkMemoryUsage();
      }, 30000);
    }
  }

  /**
   * Initialize context detection for gaming priorities
   */
  initializeContextDetection() {
    // Detect current gaming context from URL and page content
    this.currentContext = this.detectGamingContext();
    
    // Set up mutation observer to detect context changes
    const observer = new MutationObserver(() => {
      const newContext = this.detectGamingContext();
      if (newContext !== this.currentContext) {
        this.onContextChange(this.currentContext, newContext);
        this.currentContext = newContext;
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-context']
    });
  }

  /**
   * Detect current gaming context from page elements
   */
  detectGamingContext() {
    const url = window.location.pathname;
    const bodyClass = document.body.className;
    
    // URL-based context detection
    if (url.includes('tournament') || bodyClass.includes('tournament')) {
      return 'tournament';
    } else if (url.includes('clan') || bodyClass.includes('clan')) {
      return 'clan';
    } else if (url.includes('voting') || bodyClass.includes('voting')) {
      return 'voting';
    } else if (url.includes('profile') || bodyClass.includes('profile')) {
      return 'profile';
    } else if (url.includes('social') || bodyClass.includes('social')) {
      return 'social';
    }

    // Content-based context detection
    const contextElements = document.querySelector('[data-gaming-context]');
    if (contextElements) {
      return contextElements.dataset.gamingContext;
    }

    return 'general';
  }

  /**
   * Create optimized gaming image with mobile-specific optimizations
   */
  createOptimizedGamingImage(config = {}) {
    const {
      src,
      alt = 'Gaming Image',
      type = 'thumbnail',
      size = 'medium',
      priority = 'normal',
      context = this.currentContext,
      enableLazyLoading = true,
      className = '',
      onLoad = null,
      onError = null
    } = config;

    // Get connection-specific settings
    const connectionProfile = MOBILE_MEDIA_CONFIG.connectionProfiles[this.connectionType] || 
                            MOBILE_MEDIA_CONFIG.connectionProfiles['4g'];

    // Get context-specific settings
    const contextSettings = MOBILE_MEDIA_CONFIG.gamingContexts[context] || 
                           MOBILE_MEDIA_CONFIG.gamingContexts['general'];

    // Determine optimal size and quality
    const imageSize = this.calculateOptimalSize(type, size, connectionProfile);
    const imageQuality = this.calculateOptimalQuality(priority, connectionProfile);

    // Create container
    const container = document.createElement('div');
    container.className = `mobile-gaming-image-container ${type}-${size} ${className}`;
    container.style.cssText = this.getContainerStyles(type, size);

    // Create image element
    const img = document.createElement('img');
    img.alt = alt;
    img.className = `mobile-gaming-image ${type}-image priority-${priority}`;
    
    // Set up responsive loading
    if (enableLazyLoading && priority !== 'critical') {
      this.setupLazyImage(img, src, imageSize, imageQuality, connectionProfile);
    } else {
      this.setupEagerImage(img, src, imageSize, imageQuality, connectionProfile);
    }

    // Add loading state
    this.addLoadingState(container, type);

    // Setup event handlers
    img.addEventListener('load', () => {
      this.onImageLoad(img, container, onLoad);
    });

    img.addEventListener('error', () => {
      this.onImageError(img, container, onError);
    });

    container.appendChild(img);

    // Add to appropriate queue based on priority
    if (priority === 'critical') {
      this.priorityQueue.push(container);
    } else {
      this.loadingQueue.push(container);
    }

    return container;
  }

  /**
   * Create gaming avatar with mobile optimizations
   */
  createMobileGamingAvatar(config = {}) {
    const {
      src,
      alt = 'Player Avatar',
      size = 'medium',
      isOnline = false,
      clan = null,
      rank = null,
      showBorder = true,
      className = ''
    } = config;

    const container = this.createOptimizedGamingImage({
      ...config,
      type: 'avatar',
      priority: 'high',
      className: `gaming-avatar ${className}`
    });

    // Add gaming-specific enhancements
    if (isOnline) {
      this.addOnlineIndicator(container, size);
    }

    if (clan) {
      this.addClanBadge(container, clan, size);
    }

    if (rank) {
      this.addRankBadge(container, rank, size);
    }

    if (showBorder) {
      this.addGamingBorder(container, size);
    }

    return container;
  }

  /**
   * Create gaming hero image with mobile optimizations
   */
  createMobileGamingHero(config = {}) {
    const {
      src,
      alt = 'Gaming Hero',
      aspectRatio = '16/9',
      overlay = true,
      content = null,
      parallax = false,
      className = ''
    } = config;

    const container = this.createOptimizedGamingImage({
      ...config,
      type: 'hero',
      size: this.getMobileHeroSize(),
      priority: 'critical',
      className: `gaming-hero ${className}`
    });

    // Set aspect ratio
    container.style.aspectRatio = aspectRatio;

    // Add gaming overlay
    if (overlay) {
      this.addGamingOverlay(container);
    }

    // Add content overlay
    if (content) {
      this.addContentOverlay(container, content);
    }

    // Add parallax effect for mobile (if supported and not low power)
    if (parallax && !this.isLowPowerMode) {
      this.addMobileParallax(container);
    }

    return container;
  }

  /**
   * Create gaming thumbnail with mobile touch optimizations
   */
  createMobileGamingThumbnail(config = {}) {
    const {
      src,
      alt = 'Gaming Content',
      showPlayButton = false,
      duration = null,
      views = null,
      creator = null,
      touchOptimized = true,
      className = ''
    } = config;

    const container = this.createOptimizedGamingImage({
      ...config,
      type: 'thumbnail',
      priority: 'normal',
      className: `gaming-thumbnail ${className}`
    });

    // Add mobile touch optimizations
    if (touchOptimized) {
      this.addTouchOptimizations(container);
    }

    // Add play button for video content
    if (showPlayButton) {
      this.addMobilePlayButton(container);
    }

    // Add content metadata
    if (duration || views || creator) {
      this.addThumbnailMetadata(container, { duration, views, creator });
    }

    return container;
  }

  /**
   * Create optimized clan banner for mobile
   */
  createMobileClanBanner(config = {}) {
    const {
      src,
      clanName,
      memberCount,
      rank,
      isOwnClan = false,
      className = ''
    } = config;

    const container = this.createOptimizedGamingImage({
      ...config,
      alt: `${clanName} Clan Banner`,
      type: 'hero',
      size: 'mobile',
      priority: 'high',
      className: `clan-banner ${className}`
    });

    // Add clan information overlay
    this.addClanInfoOverlay(container, { clanName, memberCount, rank, isOwnClan });

    return container;
  }

  /**
   * Setup lazy loading for non-critical images
   */
  setupLazyImage(img, src, size, quality, profile) {
    // Generate optimized URLs
    const srcSet = this.generateMobileSrcSet(src, size, quality, profile);
    
    img.dataset.src = this.buildOptimizedUrl(src, size, quality, profile.formats[0]);
    img.dataset.srcset = srcSet;
    img.dataset.sizes = this.generateSizesAttribute(size);
    
    // Add to lazy loader
    this.lazyLoader.observe(img);
    
    // Add placeholder
    img.src = this.generateGamingPlaceholder(size.width, size.height);
  }

  /**
   * Setup eager loading for critical images
   */
  setupEagerImage(img, src, size, quality, profile) {
    const optimizedUrl = this.buildOptimizedUrl(src, size, quality, profile.formats[0]);
    const srcSet = this.generateMobileSrcSet(src, size, quality, profile);
    
    img.src = optimizedUrl;
    img.srcset = srcSet;
    img.sizes = this.generateSizesAttribute(size);
    img.loading = 'eager';
    
    if ('fetchPriority' in HTMLImageElement.prototype) {
      img.fetchPriority = 'high';
    }
    
    // Preload critical images
    this.preloadImage(optimizedUrl);
  }

  /**
   * Calculate optimal image size for mobile device
   */
  calculateOptimalSize(type, size, profile) {
    const baseSizes = MOBILE_MEDIA_CONFIG.mobileSizes[type];
    if (!baseSizes || !baseSizes[size]) {
      return { width: 300, height: 200 };
    }

    const baseSize = baseSizes[size];
    const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const maxWidth = Math.min(profile.maxWidth, window.innerWidth);

    return {
      width: Math.min(baseSize.width * devicePixelRatio, maxWidth),
      height: Math.round(baseSize.height * devicePixelRatio * (maxWidth / (baseSize.width * devicePixelRatio)))
    };
  }

  /**
   * Calculate optimal image quality based on connection and priority
   */
  calculateOptimalQuality(priority, profile) {
    let baseQuality = profile.imageQuality;

    // Adjust for priority
    if (priority === 'critical') {
      baseQuality = Math.min(baseQuality + 10, 95);
    } else if (priority === 'low') {
      baseQuality = Math.max(baseQuality - 10, 35);
    }

    // Adjust for data saver mode
    if (this.dataSaverEnabled) {
      baseQuality = Math.max(baseQuality - 15, 30);
    }

    // Adjust for low battery mode
    if (this.isLowPowerMode) {
      baseQuality = Math.max(baseQuality - 10, 35);
    }

    return baseQuality;
  }

  /**
   * Generate mobile-optimized srcset
   */
  generateMobileSrcSet(src, size, quality, profile) {
    const srcSets = [];
    const formats = profile.formats;
    
    // Generate variants for different densities
    [1, 1.5, 2].forEach(density => {
      if (size.width * density <= profile.maxWidth) {
        formats.forEach(format => {
          const width = Math.round(size.width * density);
          const height = Math.round(size.height * density);
          const url = this.buildOptimizedUrl(src, { width, height }, quality, format);
          srcSets.push(`${url} ${width}w`);
        });
      }
    });

    return srcSets.join(', ');
  }

  /**
   * Build optimized image URL with mobile parameters
   */
  buildOptimizedUrl(src, size, quality, format) {
    const params = new URLSearchParams();
    
    params.set('w', size.width);
    params.set('h', size.height);
    params.set('q', quality);
    params.set('f', format);
    params.set('mobile', '1');
    
    // Add data saver flag
    if (this.dataSaverEnabled) {
      params.set('datasaver', '1');
    }
    
    // Add low power mode flag
    if (this.isLowPowerMode) {
      params.set('lowpower', '1');
    }

    const separator = src.includes('?') ? '&' : '?';
    return `${src}${separator}${params.toString()}`;
  }

  /**
   * Generate sizes attribute for responsive images
   */
  generateSizesAttribute(size) {
    return `(max-width: 480px) ${Math.min(size.width, 480)}px, ` +
           `(max-width: 768px) ${Math.min(size.width, 768)}px, ` +
           `${size.width}px`;
  }

  /**
   * Generate gaming-themed placeholder
   */
  generateGamingPlaceholder(width, height) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = Math.min(width, 100);
    canvas.height = Math.min(height, 100);
    
    // Xbox 360 inspired gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#0a0a0f');
    gradient.addColorStop(1, '#2a2a3e');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle border
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    
    // Add loading indicator (optional small circle)
    if (canvas.width > 50 && canvas.height > 50) {
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    return canvas.toDataURL('image/png');
  }

  /**
   * Add loading state with Xbox 360 aesthetic
   */
  addLoadingState(container, type) {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = `mobile-gaming-loading ${type}-loading`;
    loadingOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: ${MOBILE_MEDIA_CONFIG.gamingStyles.loadingPlaceholder.background};
      border: 1px solid ${MOBILE_MEDIA_CONFIG.gamingStyles.loadingPlaceholder.borderColor};
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${MOBILE_MEDIA_CONFIG.gamingStyles.loadingPlaceholder.textColor};
      font-size: 0.8rem;
      z-index: 1;
      border-radius: 6px;
      backdrop-filter: blur(2px);
    `;

    // Add Xbox-style loading animation
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'xbox-loading-spinner';
    loadingSpinner.style.cssText = `
      width: 24px;
      height: 24px;
      border: 2px solid rgba(0, 255, 136, 0.2);
      border-top: 2px solid #00ff88;
      border-radius: 50%;
      animation: xbox-spin 1s linear infinite;
    `;

    loadingOverlay.appendChild(loadingSpinner);
    container.appendChild(loadingOverlay);
    container.style.position = 'relative';

    return loadingOverlay;
  }

  /**
   * Handle image load completion
   */
  onImageLoad(img, container, callback) {
    // Remove loading state
    const loadingOverlay = container.querySelector('.mobile-gaming-loading');
    if (loadingOverlay) {
      loadingOverlay.style.opacity = '0';
      setTimeout(() => loadingOverlay.remove(), 300);
    }

    // Add loaded class for animations
    img.classList.add('loaded');
    container.classList.add('image-loaded');

    // Update analytics
    this.analytics.imagesOptimized++;

    // Call custom callback
    if (callback) {
      callback(img, container);
    }
  }

  /**
   * Handle image load error
   */
  onImageError(img, container, callback) {
    // Remove loading state
    const loadingOverlay = container.querySelector('.mobile-gaming-loading');
    if (loadingOverlay) {
      loadingOverlay.remove();
    }

    // Add error state
    const errorOverlay = document.createElement('div');
    errorOverlay.className = 'mobile-gaming-error';
    errorOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: ${MOBILE_MEDIA_CONFIG.gamingStyles.errorPlaceholder.background};
      border: 1px solid ${MOBILE_MEDIA_CONFIG.gamingStyles.errorPlaceholder.borderColor};
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${MOBILE_MEDIA_CONFIG.gamingStyles.errorPlaceholder.textColor};
      font-size: 0.7rem;
      z-index: 1;
      border-radius: 6px;
    `;

    errorOverlay.innerHTML = `
      <div style="text-align: center;">
        <div style="margin-bottom: 4px;">⚠️</div>
        <div>Image not available</div>
      </div>
    `;

    container.appendChild(errorOverlay);
    container.classList.add('image-error');

    // Call custom callback
    if (callback) {
      callback(img, container);
    }
  }

  /**
   * Add gaming-specific UI enhancements
   */
  addOnlineIndicator(container, size) {
    const indicator = document.createElement('div');
    indicator.className = 'online-indicator';
    const indicatorSize = size === 'small' ? 8 : size === 'medium' ? 10 : 12;
    
    indicator.style.cssText = `
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: ${indicatorSize}px;
      height: ${indicatorSize}px;
      background: #00ff88;
      border: 2px solid #1a1a2e;
      border-radius: 50%;
      box-shadow: 0 0 4px rgba(0, 255, 136, 0.5);
      z-index: 3;
    `;
    
    container.appendChild(indicator);
  }

  addClanBadge(container, clan, size) {
    const badge = document.createElement('div');
    badge.className = 'clan-badge';
    badge.textContent = clan.substring(0, 3).toUpperCase();
    
    const fontSize = size === 'small' ? '8px' : size === 'medium' ? '10px' : '12px';
    
    badge.style.cssText = `
      position: absolute;
      top: -2px;
      left: -2px;
      background: linear-gradient(135deg, #00ff88, #00cc6a);
      color: black;
      font-size: ${fontSize};
      font-weight: bold;
      padding: 1px 3px;
      border-radius: 3px;
      z-index: 3;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    `;
    
    container.appendChild(badge);
  }

  addTouchOptimizations(container) {
    container.style.touchAction = 'manipulation';
    container.style.WebkitTapHighlightColor = 'transparent';
    
    // Add mobile hover effects
    container.addEventListener('touchstart', () => {
      container.classList.add('touch-active');
    });
    
    container.addEventListener('touchend', () => {
      setTimeout(() => container.classList.remove('touch-active'), 150);
    });
  }

  /**
   * Context change handlers
   */
  onNetworkChange() {
    console.log('📶 Network changed:', this.connectionType);
    
    // Adjust quality for new connection
    this.recalculateImageSizes();
    
    // Update data saver mode
    if (['slow-2g', '2g'].includes(this.connectionType)) {
      this.enableDataSaverMode();
    }
  }

  onBatteryChange() {
    if (this.isLowPowerMode && !this.prevLowPowerMode) {
      console.log('🔋 Enabling battery optimization mode');
      this.enableBatteryOptimization();
      this.analytics.batteryOptimizations++;
    }
    
    this.prevLowPowerMode = this.isLowPowerMode;
  }

  onContextChange(oldContext, newContext) {
    console.log(`🎮 Gaming context changed: ${oldContext} → ${newContext}`);
    
    // Update priority queues based on new context
    this.updateContextPriorities(newContext);
    this.analytics.contextSwitches++;
  }

  /**
   * Performance optimization methods
   */
  enableDataSaverMode() {
    if (this.dataSaverEnabled) return;
    
    this.dataSaverEnabled = true;
    console.log('📊 Data saver mode enabled');
    
    // Reduce image quality globally
    this.recalculateImageSizes();
    
    // Pause non-critical preloading
    this.preloadQueue = [];
    
    this.analytics.dataSaverActivations++;
  }

  enableBatteryOptimization() {
    // Disable animations
    document.body.classList.add('low-battery-mode');
    
    // Reduce concurrent loading
    this.loadingQueue = this.loadingQueue.slice(0, 2);
    
    // Clear preload queue
    this.preloadQueue = [];
  }

  pauseOptimization() {
    // Pause all loading when page is hidden
    this.loadingQueue.forEach(container => {
      const img = container.querySelector('img');
      if (img && !img.complete) {
        img.dataset.pausedSrc = img.src;
        img.src = '';
      }
    });
  }

  resumeOptimization() {
    // Resume loading when page becomes visible
    this.loadingQueue.forEach(container => {
      const img = container.querySelector('img');
      if (img && img.dataset.pausedSrc) {
        img.src = img.dataset.pausedSrc;
        delete img.dataset.pausedSrc;
      }
    });
  }

  /**
   * Get mobile hero size based on device
   */
  getMobileHeroSize() {
    const width = window.innerWidth;
    if (width <= 480) return 'mobile';
    if (width <= 768) return 'tablet';
    return 'desktop';
  }

  /**
   * Preload image with priority queue
   */
  async preloadImage(url) {
    try {
      const img = new Image();
      img.src = url;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      this.imageCache.set(url, img);
      console.log('🚀 Preloaded image:', url);
    } catch (error) {
      console.warn('Failed to preload image:', url, error);
    }
  }

  /**
   * Get system performance statistics
   */
  getPerformanceStats() {
    return {
      ...this.analytics,
      connectionType: this.connectionType,
      batteryLevel: this.batteryLevel,
      dataSaverEnabled: this.dataSaverEnabled,
      currentContext: this.currentContext,
      sessionBandwidthUsed: this.sessionBandwidthUsed,
      cacheSize: this.imageCache.size,
      loadingQueueSize: this.loadingQueue.length,
      preloadQueueSize: this.preloadQueue.length
    };
  }

  /**
   * Enable debug mode with performance monitoring
   */
  enableDebugMode() {
    // Add debug styles
    const debugStyles = document.createElement('style');
    debugStyles.textContent = `
      .mobile-gaming-image-container {
        outline: 1px dashed rgba(0, 255, 136, 0.3);
      }
      
      .mobile-gaming-image-container::after {
        content: attr(data-debug);
        position: absolute;
        top: 0;
        left: 0;
        background: rgba(0, 0, 0, 0.8);
        color: #00ff88;
        font-size: 10px;
        padding: 2px 4px;
        z-index: 10;
      }
      
      @keyframes xbox-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(debugStyles);

    // Log performance stats periodically
    setInterval(() => {
      console.table(this.getPerformanceStats());
    }, 10000);
  }

  /**
   * Cleanup and destroy optimizer
   */
  destroy() {
    // Clear queues
    this.preloadQueue = [];
    this.loadingQueue = [];
    this.priorityQueue = [];
    
    // Clear caches
    this.imageCache.clear();
    this.contextCache.clear();
    
    console.log('🗑️ Mobile Media Optimizer destroyed');
  }
}

/**
 * Mobile Gaming Media Styles
 */
export const mobileMediaStyles = `
  /* Base mobile image containers */
  .mobile-gaming-image-container {
    position: relative;
    overflow: hidden;
    border-radius: 6px;
    background: var(--tile-bg-primary);
    border: 1px solid var(--tile-border);
  }

  .mobile-gaming-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.3s ease, transform 0.2s ease;
  }

  .mobile-gaming-image.loaded {
    opacity: 1;
  }

  /* Avatar containers */
  .gaming-avatar {
    border-radius: 50%;
    border: 2px solid var(--tile-border);
  }

  .gaming-avatar:hover {
    border-color: var(--gaming-accent);
    transform: scale(1.05);
  }

  /* Hero containers */
  .gaming-hero {
    border-radius: 12px;
    overflow: hidden;
  }

  .gaming-hero .mobile-gaming-image {
    transition: transform 0.3s ease;
  }

  .gaming-hero:hover .mobile-gaming-image {
    transform: scale(1.02);
  }

  /* Thumbnail containers */
  .gaming-thumbnail {
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .gaming-thumbnail:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  .gaming-thumbnail.touch-active {
    transform: scale(0.98);
  }

  /* Loading states */
  .mobile-gaming-loading {
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  /* Error states */
  .image-error {
    opacity: 0.7;
  }

  /* Battery optimization */
  .low-battery-mode .mobile-gaming-image-container,
  .low-battery-mode .mobile-gaming-image {
    animation: none !important;
    transition: opacity 0.1s ease !important;
  }

  /* Responsive breakpoints */
  @media (max-width: 480px) {
    .mobile-gaming-image-container {
      border-radius: 4px;
    }
    
    .gaming-hero {
      border-radius: 8px;
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .mobile-gaming-image-container {
      border-width: 2px;
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .mobile-gaming-image-container,
    .mobile-gaming-image,
    .gaming-thumbnail {
      animation: none !important;
      transition: none !important;
    }
  }
`;

// Create and export default instance
export default new MobileMediaOptimizer();