/**
 * MLG.clan Performance-Optimized Responsive Image System
 * 
 * Advanced responsive image loading system for gaming platforms
 * Optimized for mobile bandwidth and performance
 * 
 * Features:
 * - Intelligent responsive image sizing
 * - Lazy loading with intersection observer
 * - WebP format detection and fallbacks
 * - Retina display optimization
 * - Mobile bandwidth awareness
 * - Gaming asset preloading
 * - Progressive enhancement
 * - Image compression optimization
 * - CDN integration ready
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 */

import { 
  deviceUtils,
  createResponsiveImage,
  debounce
} from './ui/utils.js';

/**
 * Responsive Image Configuration
 */
const RESPONSIVE_IMAGE_CONFIG = {
  // Breakpoint definitions for image sizing
  breakpoints: {
    xs: 375,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
    gaming: 1440,
    ultra: 1920,
    '4k': 2560
  },
  
  // Image quality settings
  quality: {
    mobile: 75,      // Optimized for mobile bandwidth
    tablet: 85,      // Balanced quality/size
    desktop: 90,     // High quality for desktop
    gaming: 95,      // Premium quality for gaming
    retina: 85       // Retina displays
  },
  
  // Format preferences
  formats: ['webp', 'avif', 'jpg', 'png'],
  
  // Lazy loading settings
  lazyLoading: {
    rootMargin: '50px 0px',
    threshold: 0.1,
    loadingClass: 'image-loading',
    loadedClass: 'image-loaded',
    errorClass: 'image-error'
  },
  
  // Performance settings
  performance: {
    maxConcurrentLoads: 3,
    preloadCritical: true,
    enableServiceWorker: true,
    compressionLevel: 8
  },
  
  // Gaming-specific settings
  gaming: {
    avatarSizes: [48, 96, 144],
    badgeSizes: [24, 48, 72],
    heroSizes: [640, 1280, 1920],
    thumbnailSizes: [150, 300, 450]
  }
};

/**
 * Responsive Image System Manager
 */
export class ResponsiveImageSystem {
  constructor(options = {}) {
    this.options = {
      baseUrl: '',
      cdnUrl: '',
      enableWebP: true,
      enableAVIF: false,
      enableLazyLoading: true,
      enableRetina: true,
      enableCompression: true,
      debugMode: false,
      ...options
    };
    
    this.loadQueue = [];
    this.loadingImages = new Set();
    this.observedImages = new WeakMap();
    this.formatSupport = {};
    this.connectionSpeed = 'unknown';
    
    this.init();
  }

  /**
   * Initialize the responsive image system
   */
  init() {
    this.detectFormatSupport();
    this.detectConnectionSpeed();
    this.setupIntersectionObserver();
    this.setupPerformanceMonitoring();
    
    if (this.options.debugMode) {
      this.enableDebugMode();
    }
  }

  /**
   * Detect supported image formats
   */
  async detectFormatSupport() {
    const formats = ['webp', 'avif', 'jp2'];
    const support = {};
    
    for (const format of formats) {
      support[format] = await this.testFormatSupport(format);
    }
    
    this.formatSupport = support;
    
    if (this.options.debugMode) {
      console.log('Format support detected:', support);
    }
  }

  /**
   * Test support for specific image format
   */
  testFormatSupport(format) {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      
      const testImages = {
        webp: 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA',
        avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=',
        jp2: 'data:image/jp2;base64,/0//UQAyAAAAAAABAAAAAgAAAAAAAAAAAAAABAAAAAQAAAAAAAAAAAAEBwEBBwEBBwEBBwEB'
      };
      
      img.src = testImages[format] || '';
    });
  }

  /**
   * Detect connection speed for adaptive loading
   */
  detectConnectionSpeed() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      this.connectionSpeed = connection.effectiveType || connection.type || 'unknown';
      
      // Listen for connection changes
      connection.addEventListener('change', () => {
        this.connectionSpeed = connection.effectiveType || connection.type || 'unknown';
        this.adjustQualityForConnection();
      });
    }
  }

  /**
   * Setup intersection observer for lazy loading
   */
  setupIntersectionObserver() {
    if (!this.options.enableLazyLoading || !('IntersectionObserver' in window)) {
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
            this.intersectionObserver.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: RESPONSIVE_IMAGE_CONFIG.lazyLoading.rootMargin,
        threshold: RESPONSIVE_IMAGE_CONFIG.lazyLoading.threshold
      }
    );
  }

  /**
   * Create optimized gaming avatar
   */
  createGamingAvatar(config = {}) {
    const {
      src,
      alt = 'Gaming Avatar',
      size = 'medium',
      isOnline = false,
      clan = null,
      className = '',
      lazy = true
    } = config;

    const sizeMap = {
      small: 48,
      medium: 96,
      large: 144
    };

    const avatarSize = sizeMap[size] || 96;
    
    const container = document.createElement('div');
    container.className = `gaming-avatar-container ${className}`;
    container.style.width = `${avatarSize}px`;
    container.style.height = `${avatarSize}px`;
    container.style.position = 'relative';

    const img = this.createResponsiveImg({
      src,
      alt,
      sizes: this.generateAvatarSizes(avatarSize),
      className: 'gaming-avatar-img',
      lazy,
      priority: !lazy
    });

    container.appendChild(img);

    // Add online indicator
    if (isOnline) {
      const onlineIndicator = document.createElement('div');
      onlineIndicator.className = 'avatar-online-indicator';
      onlineIndicator.style.cssText = `
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: ${Math.max(12, avatarSize * 0.125)}px;
        height: ${Math.max(12, avatarSize * 0.125)}px;
        background: var(--gaming-accent);
        border: 2px solid var(--gaming-surface);
        border-radius: 50%;
      `;
      container.appendChild(onlineIndicator);
    }

    // Add clan badge
    if (clan) {
      const clanBadge = document.createElement('div');
      clanBadge.className = 'avatar-clan-badge';
      clanBadge.textContent = clan;
      clanBadge.style.cssText = `
        position: absolute;
        top: -4px;
        left: -4px;
        background: var(--gaming-accent);
        color: black;
        font-size: ${Math.max(8, avatarSize * 0.08)}px;
        font-weight: 700;
        padding: 2px 4px;
        border-radius: 4px;
        max-width: ${avatarSize * 0.6}px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      `;
      container.appendChild(clanBadge);
    }

    return container;
  }

  /**
   * Create gaming hero image
   */
  createGamingHero(config = {}) {
    const {
      src,
      alt = 'Gaming Hero',
      aspectRatio = '16/9',
      overlay = true,
      content = null,
      className = '',
      lazy = false,
      priority = true
    } = config;

    const container = document.createElement('div');
    container.className = `gaming-hero-container ${className}`;
    container.style.cssText = `
      position: relative;
      width: 100%;
      aspect-ratio: ${aspectRatio};
      overflow: hidden;
      border-radius: 12px;
    `;

    const img = this.createResponsiveImg({
      src,
      alt,
      sizes: this.generateHeroSizes(),
      className: 'gaming-hero-img',
      lazy,
      priority
    });

    img.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    `;

    container.appendChild(img);

    // Add overlay
    if (overlay) {
      const overlayEl = document.createElement('div');
      overlayEl.className = 'gaming-hero-overlay';
      overlayEl.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          135deg,
          rgba(10, 10, 15, 0.3) 0%,
          rgba(26, 26, 46, 0.5) 50%,
          rgba(0, 255, 136, 0.1) 100%
        );
        backdrop-filter: blur(1px);
      `;
      container.appendChild(overlayEl);
    }

    // Add content
    if (content) {
      const contentEl = document.createElement('div');
      contentEl.className = 'gaming-hero-content';
      contentEl.style.cssText = `
        position: absolute;
        bottom: 2rem;
        left: 2rem;
        right: 2rem;
        color: white;
        z-index: 2;
      `;
      contentEl.innerHTML = content;
      container.appendChild(contentEl);
    }

    return container;
  }

  /**
   * Create gaming thumbnail
   */
  createGamingThumbnail(config = {}) {
    const {
      src,
      alt = 'Gaming Thumbnail',
      size = 'medium',
      aspectRatio = '4/3',
      showPlayButton = false,
      className = '',
      lazy = true
    } = config;

    const sizeMap = {
      small: 150,
      medium: 300,
      large: 450
    };

    const thumbnailSize = sizeMap[size] || 300;

    const container = document.createElement('div');
    container.className = `gaming-thumbnail-container ${className}`;
    container.style.cssText = `
      position: relative;
      width: 100%;
      max-width: ${thumbnailSize}px;
      aspect-ratio: ${aspectRatio};
      overflow: hidden;
      border-radius: 8px;
      border: 1px solid var(--tile-border);
    `;

    const img = this.createResponsiveImg({
      src,
      alt,
      sizes: this.generateThumbnailSizes(thumbnailSize),
      className: 'gaming-thumbnail-img',
      lazy
    });

    img.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.2s ease;
    `;

    container.appendChild(img);

    // Add play button overlay
    if (showPlayButton) {
      const playButton = document.createElement('div');
      playButton.className = 'gaming-thumbnail-play';
      playButton.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 48px;
        height: 48px;
        background: rgba(0, 0, 0, 0.7);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 20px;
        cursor: pointer;
        transition: all 0.2s ease;
      `;
      playButton.innerHTML = '▶';
      
      playButton.addEventListener('mouseenter', () => {
        playButton.style.background = 'rgba(0, 255, 136, 0.8)';
        playButton.style.transform = 'translate(-50%, -50%) scale(1.1)';
      });
      
      playButton.addEventListener('mouseleave', () => {
        playButton.style.background = 'rgba(0, 0, 0, 0.7)';
        playButton.style.transform = 'translate(-50%, -50%) scale(1)';
      });

      container.appendChild(playButton);
    }

    return container;
  }

  /**
   * Create responsive image element
   */
  createResponsiveImg(config = {}) {
    const {
      src,
      alt = '',
      sizes = '100vw',
      className = '',
      lazy = true,
      priority = false,
      onLoad = null,
      onError = null
    } = config;

    const img = document.createElement('img');
    img.alt = alt;
    img.className = `responsive-image ${className}`;
    
    // Add loading classes
    img.classList.add(RESPONSIVE_IMAGE_CONFIG.lazyLoading.loadingClass);

    // Generate srcset with multiple formats and sizes
    const srcSet = this.generateSrcSet(src);
    
    if (lazy && this.options.enableLazyLoading && !priority) {
      // Lazy loading setup
      img.dataset.src = src;
      img.dataset.srcset = srcSet;
      img.sizes = sizes;
      
      // Add placeholder
      img.src = this.generatePlaceholder(src);
      
      // Observe for lazy loading
      if (this.intersectionObserver) {
        this.intersectionObserver.observe(img);
        this.observedImages.set(img, config);
      }
    } else {
      // Immediate loading
      img.src = src;
      img.srcset = srcSet;
      img.sizes = sizes;
      
      if (priority) {
        img.loading = 'eager';
        img.fetchPriority = 'high';
      }
    }

    // Setup event handlers
    img.addEventListener('load', () => {
      img.classList.remove(RESPONSIVE_IMAGE_CONFIG.lazyLoading.loadingClass);
      img.classList.add(RESPONSIVE_IMAGE_CONFIG.lazyLoading.loadedClass);
      
      if (onLoad) {
        onLoad(img);
      }
    });

    img.addEventListener('error', () => {
      img.classList.remove(RESPONSIVE_IMAGE_CONFIG.lazyLoading.loadingClass);
      img.classList.add(RESPONSIVE_IMAGE_CONFIG.lazyLoading.errorClass);
      
      // Try fallback
      this.handleImageError(img, src);
      
      if (onError) {
        onError(img);
      }
    });

    return img;
  }

  /**
   * Generate srcset for responsive images
   */
  generateSrcSet(src) {
    const srcSets = [];
    const baseUrl = this.getOptimizedUrl(src);
    
    // Generate different sizes for each breakpoint
    Object.entries(RESPONSIVE_IMAGE_CONFIG.breakpoints).forEach(([breakpoint, width]) => {
      const quality = this.getQualityForBreakpoint(breakpoint);
      const format = this.getBestFormat();
      
      // Regular density
      srcSets.push(`${this.buildImageUrl(baseUrl, width, quality, format)} ${width}w`);
      
      // Retina density
      if (this.options.enableRetina && width <= 1920) {
        const retinaWidth = width * 2;
        srcSets.push(`${this.buildImageUrl(baseUrl, retinaWidth, quality, format)} ${retinaWidth}w`);
      }
    });
    
    return srcSets.join(', ');
  }

  /**
   * Generate sizes attribute for avatars
   */
  generateAvatarSizes(size) {
    return `(max-width: 640px) ${size}px, (max-width: 1024px) ${size}px, ${size}px`;
  }

  /**
   * Generate sizes attribute for hero images
   */
  generateHeroSizes() {
    return '(max-width: 640px) 100vw, (max-width: 1024px) 100vw, (max-width: 1440px) 100vw, 1440px';
  }

  /**
   * Generate sizes attribute for thumbnails
   */
  generateThumbnailSizes(maxSize) {
    return `(max-width: 640px) 50vw, (max-width: 1024px) 33vw, ${maxSize}px`;
  }

  /**
   * Build optimized image URL
   */
  buildImageUrl(baseUrl, width, quality, format) {
    const params = new URLSearchParams();
    
    params.set('w', width);
    params.set('q', quality);
    
    if (format && format !== 'jpg') {
      params.set('f', format);
    }
    
    if (this.options.enableCompression) {
      params.set('c', RESPONSIVE_IMAGE_CONFIG.performance.compressionLevel);
    }
    
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}${params.toString()}`;
  }

  /**
   * Get optimized URL with CDN
   */
  getOptimizedUrl(src) {
    if (this.options.cdnUrl && !src.startsWith('http')) {
      return `${this.options.cdnUrl}/${src}`;
    }
    
    if (this.options.baseUrl && !src.startsWith('http')) {
      return `${this.options.baseUrl}/${src}`;
    }
    
    return src;
  }

  /**
   * Get best supported format
   */
  getBestFormat() {
    if (this.options.enableAVIF && this.formatSupport.avif) {
      return 'avif';
    }
    
    if (this.options.enableWebP && this.formatSupport.webp) {
      return 'webp';
    }
    
    return 'jpg';
  }

  /**
   * Get quality based on breakpoint and connection
   */
  getQualityForBreakpoint(breakpoint) {
    let baseQuality;
    
    if (['xs', 'sm'].includes(breakpoint)) {
      baseQuality = RESPONSIVE_IMAGE_CONFIG.quality.mobile;
    } else if (['md', 'lg'].includes(breakpoint)) {
      baseQuality = RESPONSIVE_IMAGE_CONFIG.quality.tablet;
    } else if (['gaming', 'ultra', '4k'].includes(breakpoint)) {
      baseQuality = RESPONSIVE_IMAGE_CONFIG.quality.gaming;
    } else {
      baseQuality = RESPONSIVE_IMAGE_CONFIG.quality.desktop;
    }
    
    // Adjust for connection speed
    if (this.connectionSpeed === 'slow-2g' || this.connectionSpeed === '2g') {
      baseQuality = Math.max(50, baseQuality - 25);
    } else if (this.connectionSpeed === '3g') {
      baseQuality = Math.max(60, baseQuality - 15);
    }
    
    return baseQuality;
  }

  /**
   * Generate placeholder image
   */
  generatePlaceholder(src) {
    // Simple 1x1 transparent pixel
    return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  }

  /**
   * Load image with queue management
   */
  async loadImage(img) {
    if (this.loadingImages.has(img)) {
      return;
    }

    // Check concurrent load limit
    if (this.loadingImages.size >= RESPONSIVE_IMAGE_CONFIG.performance.maxConcurrentLoads) {
      this.loadQueue.push(img);
      return;
    }

    this.loadingImages.add(img);

    try {
      const src = img.dataset.src;
      const srcset = img.dataset.srcset;
      
      if (srcset) {
        img.srcset = srcset;
      }
      
      if (src) {
        img.src = src;
      }
      
      // Wait for load
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
    } catch (error) {
      console.warn('Failed to load image:', error);
    } finally {
      this.loadingImages.delete(img);
      
      // Process queue
      if (this.loadQueue.length > 0) {
        const nextImg = this.loadQueue.shift();
        this.loadImage(nextImg);
      }
    }
  }

  /**
   * Handle image loading errors
   */
  handleImageError(img, originalSrc) {
    // Try different format
    const fallbackFormat = this.formatSupport.webp ? 'jpg' : 'png';
    const fallbackSrc = this.buildImageUrl(originalSrc, 300, 75, fallbackFormat);
    
    if (img.src !== fallbackSrc) {
      img.src = fallbackSrc;
      return;
    }
    
    // Use default placeholder
    img.src = this.generateErrorPlaceholder();
  }

  /**
   * Generate error placeholder
   */
  generateErrorPlaceholder() {
    // Simple gray placeholder SVG
    const svg = `
      <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#1a1a2e"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#666" font-family="Arial">
          Image not available
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Adjust quality based on connection
   */
  adjustQualityForConnection() {
    // Re-observe all images with new quality settings
    this.observedImages.forEach((config, img) => {
      if (img.dataset.srcset) {
        img.dataset.srcset = this.generateSrcSet(config.src);
      }
    });
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (entry.name.includes('image') && this.options.debugMode) {
            console.log('Image performance:', entry);
          }
        });
      });
      
      observer.observe({ entryTypes: ['resource'] });
    }
  }

  /**
   * Preload critical images
   */
  preloadCriticalImages(urls) {
    if (!RESPONSIVE_IMAGE_CONFIG.performance.preloadCritical) {
      return;
    }

    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = this.getOptimizedUrl(url);
      document.head.appendChild(link);
    });
  }

  /**
   * Enable debug mode
   */
  enableDebugMode() {
    console.log('Responsive Image System Debug Mode Enabled');
    console.log('Format support:', this.formatSupport);
    console.log('Connection speed:', this.connectionSpeed);
    
    // Add debug styles
    const style = document.createElement('style');
    style.textContent = `
      .responsive-image.image-loading {
        background: linear-gradient(90deg, #1a1a2e 25%, #2a2a3e 50%, #1a1a2e 75%);
        background-size: 200% 100%;
        animation: loading-shimmer 1.5s infinite;
      }
      
      .responsive-image.image-error {
        border: 2px solid var(--gaming-red);
        background: rgba(239, 68, 68, 0.1);
      }
      
      @keyframes loading-shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Get system statistics
   */
  getStats() {
    return {
      formatSupport: this.formatSupport,
      connectionSpeed: this.connectionSpeed,
      loadingImages: this.loadingImages.size,
      queuedImages: this.loadQueue.length,
      observedImages: this.observedImages.size
    };
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    this.loadQueue = [];
    this.loadingImages.clear();
    this.observedImages = new WeakMap();
  }
}

/**
 * Responsive Image Styles
 */
export const responsiveImageStyles = `
  .gaming-avatar-container {
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid var(--tile-border);
    transition: all 0.2s ease;
  }
  
  .gaming-avatar-container:hover {
    border-color: var(--gaming-accent);
    transform: scale(1.05);
  }
  
  .gaming-avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  
  .gaming-hero-container:hover .gaming-hero-img {
    transform: scale(1.02);
  }
  
  .gaming-thumbnail-container:hover .gaming-thumbnail-img {
    transform: scale(1.05);
  }
  
  .responsive-image {
    display: block;
    max-width: 100%;
    height: auto;
  }
  
  .responsive-image.image-loading {
    background: var(--tile-bg-primary);
  }
  
  .responsive-image.image-loaded {
    animation: fadeIn 0.3s ease;
  }
  
  .responsive-image.image-error {
    background: var(--tile-bg-primary);
    color: var(--gaming-red);
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100px;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @media (max-width: 640px) {
    .gaming-hero-content {
      bottom: 1rem !important;
      left: 1rem !important;
      right: 1rem !important;
    }
  }
`;

// Export default instance
export default new ResponsiveImageSystem();