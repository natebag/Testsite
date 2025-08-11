/**
 * MLG.clan Multi-Platform Video Embedding System - Sub-task 6.8
 * 
 * Comprehensive video embedding system supporting major platforms:
 * YouTube, Twitter/X, TikTok, Instagram, Twitch, Vimeo, Dailymotion
 * 
 * Features:
 * - Platform detection and URL parsing
 * - API integration for metadata and thumbnails
 * - Responsive video players with MLG.clan branding
 * - Performance optimization with lazy loading
 * - Error handling and fallback support
 * - Analytics and engagement tracking
 * - Security and CORS management
 * 
 * @author Claude Code - Production Video Systems Engineer
 * @version 1.0.0
 */

/**
 * Platform Configuration and API Endpoints
 */
const PLATFORM_CONFIG = {
  youtube: {
    name: 'YouTube',
    icon: '📺',
    apiKey: 'AIzaSyDummy_Key_Replace_With_Actual', // Replace with actual API key
    apiBaseUrl: 'https://www.googleapis.com/youtube/v3',
    embedBaseUrl: 'https://www.youtube.com/embed',
    thumbnailBaseUrl: 'https://img.youtube.com/vi',
    urlPatterns: [
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    ],
    maxDuration: 3600, // 1 hour
    features: ['autoplay', 'controls', 'loop', 'captions', 'quality_selection'],
    rateLimit: { calls: 10000, per: 'day' }
  },
  
  twitter: {
    name: 'Twitter/X',
    icon: '🐦',
    apiKey: 'Bearer_Token_Replace_With_Actual', // Replace with actual bearer token
    apiBaseUrl: 'https://api.twitter.com/2',
    oembedUrl: 'https://publish.twitter.com/oembed',
    urlPatterns: [
      /https?:\/\/(www\.)?(twitter|x)\.com\/\w+\/status\/(\d+)/i,
      /https?:\/\/twitter\.com\/\w+\/status\/(\d+)/i
    ],
    maxDuration: 140, // 2 minutes 20 seconds
    features: ['autoplay', 'controls', 'muted_autoplay'],
    rateLimit: { calls: 300, per: 'hour' }
  },
  
  tiktok: {
    name: 'TikTok',
    icon: '🎵',
    apiKey: 'TikTok_API_Key_Replace_With_Actual', // Replace with actual API key
    apiBaseUrl: 'https://open-api.tiktok.com/platform/v1',
    oembedUrl: 'https://www.tiktok.com/oembed',
    urlPatterns: [
      /https?:\/\/(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/(\d+)/i,
      /https?:\/\/vm\.tiktok\.com\/([A-Za-z0-9]+)/i,
      /https?:\/\/(?:www\.)?tiktok\.com\/t\/([A-Za-z0-9]+)/i
    ],
    maxDuration: 60, // 1 minute
    features: ['autoplay', 'loop', 'muted_autoplay'],
    rateLimit: { calls: 1000, per: 'day' }
  },
  
  instagram: {
    name: 'Instagram',
    icon: '📷',
    apiKey: 'Instagram_Access_Token_Replace_With_Actual', // Replace with actual access token
    apiBaseUrl: 'https://graph.instagram.com',
    oembedUrl: 'https://graph.facebook.com/v18.0/instagram_oembed',
    urlPatterns: [
      /https?:\/\/(?:www\.)?instagram\.com\/p\/([A-Za-z0-9_-]+)/i,
      /https?:\/\/(?:www\.)?instagram\.com\/reel\/([A-Za-z0-9_-]+)/i,
      /https?:\/\/(?:www\.)?instagram\.com\/tv\/([A-Za-z0-9_-]+)/i
    ],
    maxDuration: 3600, // 1 hour for IGTV
    features: ['autoplay', 'controls', 'loop'],
    rateLimit: { calls: 200, per: 'hour' }
  },
  
  twitch: {
    name: 'Twitch',
    icon: '🎮',
    apiKey: 'Twitch_Client_ID_Replace_With_Actual', // Replace with actual client ID
    apiSecret: 'Twitch_Client_Secret_Replace_With_Actual', // Replace with actual client secret
    apiBaseUrl: 'https://api.twitch.tv/helix',
    embedBaseUrl: 'https://player.twitch.tv',
    urlPatterns: [
      /https?:\/\/(?:www\.)?twitch\.tv\/videos\/(\d+)/i,
      /https?:\/\/(?:www\.)?twitch\.tv\/\w+\/clip\/([A-Za-z0-9_-]+)/i,
      /https?:\/\/clips\.twitch\.tv\/([A-Za-z0-9_-]+)/i,
      /https?:\/\/(?:www\.)?twitch\.tv\/(\w+)/i // Live streams
    ],
    maxDuration: 7200, // 2 hours
    features: ['autoplay', 'controls', 'chat', 'quality_selection'],
    rateLimit: { calls: 800, per: 'hour' }
  },
  
  vimeo: {
    name: 'Vimeo',
    icon: '🎬',
    apiKey: 'Vimeo_Access_Token_Replace_With_Actual', // Replace with actual access token
    apiBaseUrl: 'https://api.vimeo.com',
    embedBaseUrl: 'https://player.vimeo.com/video',
    oembedUrl: 'https://vimeo.com/api/oembed.json',
    urlPatterns: [
      /https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/i,
      /https?:\/\/player\.vimeo\.com\/video\/(\d+)/i
    ],
    maxDuration: 7200, // 2 hours
    features: ['autoplay', 'controls', 'loop', 'quality_selection', 'picture_in_picture'],
    rateLimit: { calls: 1000, per: 'hour' }
  },
  
  dailymotion: {
    name: 'Dailymotion',
    icon: '🌐',
    apiKey: 'Dailymotion_API_Key_Replace_With_Actual', // Replace with actual API key
    apiBaseUrl: 'https://www.dailymotion.com/services/oembed',
    embedBaseUrl: 'https://www.dailymotion.com/embed/video',
    urlPatterns: [
      /https?:\/\/(?:www\.)?dailymotion\.com\/video\/([A-Za-z0-9]+)/i,
      /https?:\/\/dai\.ly\/([A-Za-z0-9]+)/i
    ],
    maxDuration: 3600, // 1 hour
    features: ['autoplay', 'controls', 'loop'],
    rateLimit: { calls: 5000, per: 'day' }
  }
};

/**
 * Video Quality and Performance Settings
 */
const VIDEO_SETTINGS = {
  defaultQuality: '720p',
  autoQuality: true,
  lazyLoading: true,
  preloadMetadata: true,
  thumbnailSizes: ['default', 'mqdefault', 'hqdefault', 'sddefault', 'maxresdefault'],
  playerOptions: {
    width: '100%',
    height: 'auto',
    responsive: true,
    controls: true,
    autoplay: false,
    muted: true,
    loop: false,
    playsInline: true
  },
  caching: {
    thumbnails: 86400, // 24 hours
    metadata: 3600,    // 1 hour
    embedHtml: 1800    // 30 minutes
  }
};

/**
 * Error Messages and Handling
 */
const ERROR_MESSAGES = {
  INVALID_URL: 'Invalid or unsupported video URL',
  PLATFORM_NOT_SUPPORTED: 'Video platform not supported',
  API_RATE_LIMIT: 'API rate limit exceeded, please try again later',
  VIDEO_NOT_FOUND: 'Video not found or is private',
  NETWORK_ERROR: 'Network error, please check your connection',
  PARSING_ERROR: 'Error parsing video information',
  EMBED_BLOCKED: 'Video embedding is disabled by the content owner',
  GEOGRAPHIC_RESTRICTION: 'Video is not available in your region',
  COPYRIGHT_CLAIM: 'Video has copyright restrictions'
};

/**
 * Multi-Platform Video Embedding System
 */
export class MultiPlatformVideoEmbed {
  constructor(options = {}) {
    this.config = { ...PLATFORM_CONFIG, ...options.platformConfig };
    this.videoSettings = { ...VIDEO_SETTINGS, ...options.videoSettings };
    this.cache = new Map();
    this.rateLimiter = new Map();
    this.observers = new Map();
    
    // Initialize intersection observer for lazy loading
    this.initializeLazyLoading();
    
    // Set up error handling
    this.errorHandler = options.errorHandler || this.defaultErrorHandler;
    this.successHandler = options.successHandler || this.defaultSuccessHandler;
    
    console.log('MultiPlatformVideoEmbed initialized with platforms:', Object.keys(this.config));
  }

  /**
   * Detect platform from video URL
   */
  detectPlatform(url) {
    if (!url || typeof url !== 'string') {
      throw new Error(ERROR_MESSAGES.INVALID_URL);
    }

    for (const [platform, config] of Object.entries(this.config)) {
      for (const pattern of config.urlPatterns) {
        if (pattern.test(url)) {
          const match = url.match(pattern);
          return {
            platform,
            id: match[1] || match[2] || match[3],
            originalUrl: url,
            config
          };
        }
      }
    }

    throw new Error(ERROR_MESSAGES.PLATFORM_NOT_SUPPORTED);
  }

  /**
   * Extract video ID from URL
   */
  extractVideoId(url, platform) {
    const config = this.config[platform];
    if (!config) {
      throw new Error(ERROR_MESSAGES.PLATFORM_NOT_SUPPORTED);
    }

    for (const pattern of config.urlPatterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1] || match[2] || match[3];
      }
    }

    throw new Error(ERROR_MESSAGES.INVALID_URL);
  }

  /**
   * Generate video thumbnail URL
   */
  generateThumbnailUrl(platform, videoId, quality = 'hqdefault') {
    const config = this.config[platform];
    
    switch (platform) {
      case 'youtube':
        return `${config.thumbnailBaseUrl}/${videoId}/${quality}.jpg`;
      
      case 'vimeo':
        return `https://vumbnail.com/${videoId}.jpg`;
      
      case 'dailymotion':
        return `https://www.dailymotion.com/thumbnail/video/${videoId}`;
      
      default:
        return null;
    }
  }

  /**
   * Fetch video metadata from platform APIs
   */
  async fetchVideoMetadata(platform, videoId) {
    const cacheKey = `metadata_${platform}_${videoId}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.videoSettings.caching.metadata * 1000) {
        return cached.data;
      }
    }

    // Check rate limiting
    if (this.isRateLimited(platform)) {
      throw new Error(ERROR_MESSAGES.API_RATE_LIMIT);
    }

    let metadata = {};
    
    try {
      switch (platform) {
        case 'youtube':
          metadata = await this.fetchYouTubeMetadata(videoId);
          break;
        
        case 'twitter':
          metadata = await this.fetchTwitterMetadata(videoId);
          break;
        
        case 'tiktok':
          metadata = await this.fetchTikTokMetadata(videoId);
          break;
        
        case 'instagram':
          metadata = await this.fetchInstagramMetadata(videoId);
          break;
        
        case 'twitch':
          metadata = await this.fetchTwitchMetadata(videoId);
          break;
        
        case 'vimeo':
          metadata = await this.fetchVimeoMetadata(videoId);
          break;
        
        case 'dailymotion':
          metadata = await this.fetchDailymotionMetadata(videoId);
          break;
        
        default:
          metadata = await this.fetchGenericMetadata(platform, videoId);
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: metadata,
        timestamp: Date.now()
      });

      // Track rate limiting
      this.trackRateLimit(platform);

      return metadata;
    } catch (error) {
      console.error(`Error fetching ${platform} metadata:`, error);
      throw error;
    }
  }

  /**
   * YouTube API integration
   */
  async fetchYouTubeMetadata(videoId) {
    const config = this.config.youtube;
    const url = `${config.apiBaseUrl}/videos?id=${videoId}&key=${config.apiKey}&part=snippet,statistics,contentDetails`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const video = data.items[0];
        return {
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
          duration: this.parseDuration(video.contentDetails.duration),
          views: parseInt(video.statistics.viewCount || 0),
          likes: parseInt(video.statistics.likeCount || 0),
          author: video.snippet.channelTitle,
          publishedAt: new Date(video.snippet.publishedAt),
          platform: 'youtube'
        };
      } else {
        throw new Error(ERROR_MESSAGES.VIDEO_NOT_FOUND);
      }
    } catch (error) {
      throw new Error(`YouTube API error: ${error.message}`);
    }
  }

  /**
   * Twitter/X oEmbed integration
   */
  async fetchTwitterMetadata(tweetId) {
    const config = this.config.twitter;
    const url = `${config.oembedUrl}?url=https://twitter.com/i/status/${tweetId}&omit_script=true`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      return {
        title: data.title || 'Twitter Video',
        description: data.html ? this.extractTextFromHTML(data.html) : '',
        thumbnail: this.extractTwitterThumbnail(data.html),
        author: data.author_name,
        authorUrl: data.author_url,
        embedHtml: data.html,
        platform: 'twitter'
      };
    } catch (error) {
      throw new Error(`Twitter API error: ${error.message}`);
    }
  }

  /**
   * TikTok API integration
   */
  async fetchTikTokMetadata(videoId) {
    // TikTok oEmbed as primary method
    const oembedUrl = `${this.config.tiktok.oembedUrl}?url=https://www.tiktok.com/@user/video/${videoId}`;
    
    try {
      const response = await fetch(oembedUrl);
      const data = await response.json();
      
      return {
        title: data.title || 'TikTok Video',
        description: data.title || '',
        thumbnail: data.thumbnail_url,
        author: data.author_name,
        embedHtml: data.html,
        platform: 'tiktok'
      };
    } catch (error) {
      // Fallback to basic metadata
      return {
        title: 'TikTok Video',
        description: 'TikTok video content',
        platform: 'tiktok'
      };
    }
  }

  /**
   * Instagram Graph API integration
   */
  async fetchInstagramMetadata(mediaId) {
    const config = this.config.instagram;
    const url = `${config.apiBaseUrl}/${mediaId}?fields=id,media_type,media_url,thumbnail_url,permalink,caption&access_token=${config.apiKey}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      return {
        title: 'Instagram Post',
        description: data.caption || '',
        thumbnail: data.thumbnail_url || data.media_url,
        mediaUrl: data.media_url,
        permalink: data.permalink,
        mediaType: data.media_type,
        platform: 'instagram'
      };
    } catch (error) {
      throw new Error(`Instagram API error: ${error.message}`);
    }
  }

  /**
   * Twitch Helix API integration
   */
  async fetchTwitchMetadata(videoId) {
    const config = this.config.twitch;
    
    // Determine if it's a clip or video
    const isClip = videoId.includes('-') || videoId.length < 10;
    const endpoint = isClip ? 'clips' : 'videos';
    const param = isClip ? 'id' : 'id';
    
    const url = `${config.apiBaseUrl}/${endpoint}?${param}=${videoId}`;
    
    try {
      const headers = {
        'Client-ID': config.apiKey,
        'Authorization': `Bearer ${await this.getTwitchAccessToken()}`
      };
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        const video = data.data[0];
        return {
          title: video.title,
          description: video.description || '',
          thumbnail: video.thumbnail_url,
          duration: video.duration ? parseInt(video.duration) : null,
          views: video.view_count,
          author: video.user_name || video.broadcaster_name,
          createdAt: new Date(video.created_at),
          platform: 'twitch'
        };
      } else {
        throw new Error(ERROR_MESSAGES.VIDEO_NOT_FOUND);
      }
    } catch (error) {
      throw new Error(`Twitch API error: ${error.message}`);
    }
  }

  /**
   * Vimeo API integration
   */
  async fetchVimeoMetadata(videoId) {
    const config = this.config.vimeo;
    const url = `${config.apiBaseUrl}/videos/${videoId}`;
    
    try {
      const headers = {
        'Authorization': `Bearer ${config.apiKey}`
      };
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      
      return {
        title: data.name,
        description: data.description || '',
        thumbnail: data.pictures?.sizes?.[2]?.link || data.pictures?.base_link,
        duration: data.duration,
        views: data.stats?.plays,
        likes: data.metadata?.interactions?.like?.total,
        author: data.user?.name,
        createdAt: new Date(data.created_time),
        platform: 'vimeo'
      };
    } catch (error) {
      throw new Error(`Vimeo API error: ${error.message}`);
    }
  }

  /**
   * Dailymotion oEmbed integration
   */
  async fetchDailymotionMetadata(videoId) {
    const config = this.config.dailymotion;
    const url = `${config.apiBaseUrl}?url=https://www.dailymotion.com/video/${videoId}&format=json`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      return {
        title: data.title,
        description: data.description || '',
        thumbnail: data.thumbnail_url,
        author: data.author_name,
        embedHtml: data.html,
        platform: 'dailymotion'
      };
    } catch (error) {
      throw new Error(`Dailymotion API error: ${error.message}`);
    }
  }

  /**
   * Generate embed HTML for video
   */
  generateEmbedHtml(platform, videoId, options = {}) {
    const config = this.config[platform];
    const settings = { ...this.videoSettings.playerOptions, ...options };
    
    const commonParams = {
      autoplay: settings.autoplay ? 1 : 0,
      muted: settings.muted ? 1 : 0,
      controls: settings.controls ? 1 : 0,
      loop: settings.loop ? 1 : 0
    };

    switch (platform) {
      case 'youtube':
        return this.generateYouTubeEmbed(videoId, commonParams, settings);
      
      case 'vimeo':
        return this.generateVimeoEmbed(videoId, commonParams, settings);
      
      case 'dailymotion':
        return this.generateDailymotionEmbed(videoId, commonParams, settings);
      
      case 'twitch':
        return this.generateTwitchEmbed(videoId, commonParams, settings);
      
      default:
        return this.generateGenericEmbed(platform, videoId, settings);
    }
  }

  /**
   * Generate YouTube embed
   */
  generateYouTubeEmbed(videoId, params, settings) {
    const paramString = new URLSearchParams({
      ...params,
      rel: 0,
      modestbranding: 1,
      color: 'white',
      theme: 'dark'
    }).toString();

    return `
      <div class="video-embed youtube-embed" style="position: relative; width: 100%; height: 0; padding-bottom: 56.25%;">
        <iframe
          src="https://www.youtube.com/embed/${videoId}?${paramString}"
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
        </iframe>
      </div>
    `;
  }

  /**
   * Generate Vimeo embed
   */
  generateVimeoEmbed(videoId, params, settings) {
    const paramString = new URLSearchParams({
      ...params,
      color: '10b981', // MLG green
      title: 0,
      byline: 0,
      portrait: 0
    }).toString();

    return `
      <div class="video-embed vimeo-embed" style="position: relative; width: 100%; height: 0; padding-bottom: 56.25%;">
        <iframe
          src="https://player.vimeo.com/video/${videoId}?${paramString}"
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
          frameborder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen>
        </iframe>
      </div>
    `;
  }

  /**
   * Generate Dailymotion embed
   */
  generateDailymotionEmbed(videoId, params, settings) {
    const paramString = new URLSearchParams(params).toString();

    return `
      <div class="video-embed dailymotion-embed" style="position: relative; width: 100%; height: 0; padding-bottom: 56.25%;">
        <iframe
          src="https://www.dailymotion.com/embed/video/${videoId}?${paramString}"
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
          frameborder="0"
          allow="autoplay; fullscreen"
          allowfullscreen>
        </iframe>
      </div>
    `;
  }

  /**
   * Generate Twitch embed
   */
  generateTwitchEmbed(videoId, params, settings) {
    const isClip = videoId.includes('-') || videoId.length < 10;
    const embedType = isClip ? 'clip' : 'video';
    
    const twitchParams = new URLSearchParams({
      [embedType]: videoId,
      parent: window.location.hostname,
      autoplay: params.autoplay,
      muted: params.muted
    }).toString();

    return `
      <div class="video-embed twitch-embed" style="position: relative; width: 100%; height: 0; padding-bottom: 56.25%;">
        <iframe
          src="https://player.twitch.tv/?${twitchParams}"
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
          frameborder="0"
          scrolling="no"
          allowfullscreen>
        </iframe>
      </div>
    `;
  }

  /**
   * Generate generic embed using oEmbed
   */
  async generateGenericEmbed(platform, videoId, settings) {
    try {
      const metadata = await this.fetchVideoMetadata(platform, videoId);
      if (metadata.embedHtml) {
        return `<div class="video-embed ${platform}-embed">${metadata.embedHtml}</div>`;
      }
    } catch (error) {
      console.warn(`Failed to generate embed for ${platform}:`, error);
    }

    // Fallback to basic embed
    return `
      <div class="video-embed generic-embed" style="padding: 20px; text-align: center; background: #1a1a1a; color: #fff;">
        <p>🎬 ${platform.toUpperCase()} Video</p>
        <p>Direct link: <a href="${videoId}" target="_blank" rel="noopener">Open Video</a></p>
      </div>
    `;
  }

  /**
   * Initialize lazy loading for video embeds
   */
  initializeLazyLoading() {
    if ('IntersectionObserver' in window) {
      this.lazyLoadObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target;
            this.loadVideo(element);
            this.lazyLoadObserver.unobserve(element);
          }
        });
      }, {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
      });
    }
  }

  /**
   * Load video on demand
   */
  async loadVideo(element) {
    const platform = element.dataset.platform;
    const videoId = element.dataset.videoId;
    const options = JSON.parse(element.dataset.options || '{}');

    try {
      const embedHtml = await this.generateEmbedHtml(platform, videoId, options);
      element.innerHTML = embedHtml;
      element.classList.add('loaded');
      
      // Track loading event
      this.trackVideoLoad(platform, videoId);
    } catch (error) {
      console.error('Error loading video:', error);
      element.innerHTML = this.generateErrorEmbed(error.message);
      element.classList.add('error');
    }
  }

  /**
   * Create video card with metadata
   */
  async createVideoCard(url, options = {}) {
    try {
      const detection = this.detectPlatform(url);
      const metadata = await this.fetchVideoMetadata(detection.platform, detection.id);
      
      const card = document.createElement('div');
      card.className = `video-card ${detection.platform}-card`;
      card.setAttribute('data-platform', detection.platform);
      card.setAttribute('data-video-id', detection.id);
      card.setAttribute('data-options', JSON.stringify(options));

      // Generate thumbnail with lazy loading
      const thumbnailUrl = metadata.thumbnail || this.generateThumbnailUrl(detection.platform, detection.id);
      
      card.innerHTML = `
        <div class="video-card-header">
          <div class="platform-badge">
            <span class="platform-icon">${detection.config.icon}</span>
            <span class="platform-name">${detection.config.name}</span>
          </div>
          ${metadata.duration ? `<div class="duration-badge">${this.formatDuration(metadata.duration)}</div>` : ''}
        </div>
        
        <div class="video-thumbnail-container">
          ${thumbnailUrl ? `<img src="${thumbnailUrl}" alt="${metadata.title}" class="video-thumbnail" loading="lazy">` : ''}
          <div class="play-overlay">
            <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
        
        <div class="video-metadata">
          <h3 class="video-title">${metadata.title}</h3>
          ${metadata.author ? `<p class="video-author">by ${metadata.author}</p>` : ''}
          ${metadata.description ? `<p class="video-description">${this.truncateText(metadata.description, 120)}</p>` : ''}
          
          <div class="video-stats">
            ${metadata.views ? `<span class="stat views">${this.formatNumber(metadata.views)} views</span>` : ''}
            ${metadata.likes ? `<span class="stat likes">${this.formatNumber(metadata.likes)} likes</span>` : ''}
            ${metadata.publishedAt ? `<span class="stat date">${this.formatDate(metadata.publishedAt)}</span>` : ''}
          </div>
        </div>
        
        <div class="video-embed-container" style="display: none;">
          <!-- Embed will be loaded here on demand -->
        </div>
      `;

      // Add click handler for play button
      const playOverlay = card.querySelector('.play-overlay');
      const embedContainer = card.querySelector('.video-embed-container');
      const thumbnailContainer = card.querySelector('.video-thumbnail-container');

      playOverlay.addEventListener('click', async () => {
        thumbnailContainer.style.display = 'none';
        embedContainer.style.display = 'block';
        
        try {
          const embedHtml = this.generateEmbedHtml(detection.platform, detection.id, {
            ...options,
            autoplay: true
          });
          embedContainer.innerHTML = embedHtml;
          
          // Track play event
          this.trackVideoPlay(detection.platform, detection.id);
        } catch (error) {
          embedContainer.innerHTML = this.generateErrorEmbed(error.message);
        }
      });

      return card;
    } catch (error) {
      console.error('Error creating video card:', error);
      return this.createErrorCard(url, error.message);
    }
  }

  /**
   * Create error card for failed video processing
   */
  createErrorCard(url, errorMessage) {
    const card = document.createElement('div');
    card.className = 'video-card error-card';
    card.innerHTML = `
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <h3>Video Load Error</h3>
        <p>${errorMessage}</p>
        <a href="${url}" target="_blank" rel="noopener" class="original-link">Open Original Link</a>
      </div>
    `;
    return card;
  }

  /**
   * Generate error embed HTML
   */
  generateErrorEmbed(errorMessage) {
    return `
      <div class="video-embed-error">
        <div class="error-content">
          <div class="error-icon">⚠️</div>
          <p>${errorMessage}</p>
        </div>
      </div>
    `;
  }

  /**
   * Rate limiting helpers
   */
  isRateLimited(platform) {
    const key = `rate_limit_${platform}`;
    const limit = this.rateLimiter.get(key);
    
    if (!limit) return false;
    
    const config = this.config[platform];
    const now = Date.now();
    const timeWindow = config.rateLimit.per === 'hour' ? 3600000 : 86400000;
    
    return (now - limit.startTime < timeWindow) && (limit.calls >= config.rateLimit.calls);
  }

  trackRateLimit(platform) {
    const key = `rate_limit_${platform}`;
    const now = Date.now();
    const existing = this.rateLimiter.get(key);
    
    if (!existing || (now - existing.startTime > (this.config[platform].rateLimit.per === 'hour' ? 3600000 : 86400000))) {
      this.rateLimiter.set(key, { calls: 1, startTime: now });
    } else {
      existing.calls++;
    }
  }

  /**
   * Utility methods
   */
  parseDuration(duration) {
    // Parse ISO 8601 duration (PT4M13S) to seconds
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }

  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    } else {
      return num.toString();
    }
  }

  formatDate(date) {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  extractTextFromHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  extractTwitterThumbnail(html) {
    // Extract thumbnail from Twitter embed HTML
    const match = html.match(/src="([^"]*\.(?:jpg|jpeg|png|gif))"/i);
    return match ? match[1] : null;
  }

  /**
   * Get Twitch access token
   */
  async getTwitchAccessToken() {
    const cacheKey = 'twitch_access_token';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour
      return cached.data;
    }

    try {
      const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.config.twitch.apiKey,
          client_secret: this.config.twitch.apiSecret,
          grant_type: 'client_credentials'
        })
      });

      const data = await response.json();
      
      this.cache.set(cacheKey, {
        data: data.access_token,
        timestamp: Date.now()
      });

      return data.access_token;
    } catch (error) {
      throw new Error(`Failed to get Twitch access token: ${error.message}`);
    }
  }

  /**
   * Analytics and tracking
   */
  trackVideoLoad(platform, videoId) {
    // Implement analytics tracking
    console.log(`Video loaded: ${platform}/${videoId}`);
  }

  trackVideoPlay(platform, videoId) {
    // Implement analytics tracking
    console.log(`Video played: ${platform}/${videoId}`);
  }

  /**
   * Default event handlers
   */
  defaultErrorHandler(error, platform, videoId) {
    console.error(`Video error [${platform}/${videoId}]:`, error);
  }

  defaultSuccessHandler(data, platform, videoId) {
    console.log(`Video success [${platform}/${videoId}]:`, data);
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.lazyLoadObserver) {
      this.lazyLoadObserver.disconnect();
    }
    
    this.cache.clear();
    this.rateLimiter.clear();
    this.observers.clear();
  }
}

/**
 * Export factory function for easy initialization
 */
export function createMultiPlatformVideoEmbed(options = {}) {
  return new MultiPlatformVideoEmbed(options);
}

/**
 * Export configuration for external use
 */
export { PLATFORM_CONFIG, VIDEO_SETTINGS, ERROR_MESSAGES };