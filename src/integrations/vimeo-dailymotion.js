/**
 * Vimeo and Dailymotion API Integration
 * Handles multi-platform video support, API integration, and content management
 * Sub-task 9.7
 */

class VimeoAPI {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseURL = 'https://api.vimeo.com';
    this.embedBaseURL = 'https://player.vimeo.com/video';
    this.oEmbedURL = 'https://vimeo.com/api/oembed.json';
  }

  /**
   * Extract video ID from Vimeo URL
   */
  extractVideoId(url) {
    const patterns = [
      /vimeo\.com\/(\d+)/,
      /vimeo\.com\/video\/(\d+)/,
      /vimeo\.com\/channels\/[^\/]+\/(\d+)/,
      /vimeo\.com\/groups\/[^\/]+\/videos\/(\d+)/,
      /player\.vimeo\.com\/video\/(\d+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }

  /**
   * Get video details
   */
  async getVideoDetails(videoId) {
    try {
      const response = await fetch(`${this.baseURL}/videos/${videoId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Vimeo API error: ${errorData.error || response.status}`);
      }

      const video = await response.json();
      
      return {
        id: video.resource_key.replace('/videos/', ''),
        uri: video.uri,
        name: video.name,
        description: video.description || '',
        link: video.link,
        duration: video.duration,
        width: video.width,
        height: video.height,
        language: video.language,
        createdTime: video.created_time,
        modifiedTime: video.modified_time,
        releaseTime: video.release_time,
        contentRating: video.content_rating || [],
        license: video.license,
        privacy: video.privacy,
        pictures: video.pictures,
        tags: video.tags?.map(tag => tag.name) || [],
        categories: video.categories?.map(cat => cat.name) || [],
        stats: {
          plays: video.stats?.plays || 0
        },
        metadata: {
          connections: video.metadata?.connections || {},
          interactions: video.metadata?.interactions || {}
        },
        user: {
          uri: video.user?.uri,
          name: video.user?.name,
          link: video.user?.link,
          location: video.user?.location,
          bio: video.user?.bio,
          shortBio: video.user?.short_bio,
          createdTime: video.user?.created_time,
          pictures: video.user?.pictures,
          websites: video.user?.websites || [],
          metadata: video.user?.metadata || {}
        },
        app: video.app,
        status: video.status,
        resourceKey: video.resource_key,
        embed: video.embed
      };
    } catch (error) {
      console.error('Error fetching Vimeo video details:', error);
      throw error;
    }
  }

  /**
   * Search videos
   */
  async searchVideos(query, options = {}) {
    const {
      sort = 'relevant',
      direction = 'desc',
      filter = 'CC',
      filterEmbeddable = true,
      perPage = 25,
      page = 1
    } = options;

    try {
      const params = new URLSearchParams({
        query: query,
        sort: sort,
        direction: direction,
        filter: filter,
        filter_embeddable: filterEmbeddable.toString(),
        per_page: perPage.toString(),
        page: page.toString()
      });

      const response = await fetch(`${this.baseURL}/videos?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Vimeo API error: ${errorData.error || response.status}`);
      }

      const data = await response.json();
      
      return {
        videos: data.data.map(video => ({
          id: video.resource_key.replace('/videos/', ''),
          uri: video.uri,
          name: video.name,
          description: video.description || '',
          link: video.link,
          duration: video.duration,
          createdTime: video.created_time,
          pictures: video.pictures,
          tags: video.tags?.map(tag => tag.name) || [],
          user: {
            name: video.user?.name,
            link: video.user?.link
          },
          stats: {
            plays: video.stats?.plays || 0
          },
          privacy: video.privacy
        })),
        total: data.total,
        page: data.page,
        perPage: data.per_page,
        paging: data.paging
      };
    } catch (error) {
      console.error('Error searching Vimeo videos:', error);
      throw error;
    }
  }

  /**
   * Get user videos
   */
  async getUserVideos(userId, options = {}) {
    const {
      sort = 'date',
      direction = 'desc',
      perPage = 25,
      page = 1
    } = options;

    try {
      const params = new URLSearchParams({
        sort: sort,
        direction: direction,
        per_page: perPage.toString(),
        page: page.toString()
      });

      const response = await fetch(`${this.baseURL}/users/${userId}/videos?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Vimeo API error: ${errorData.error || response.status}`);
      }

      const data = await response.json();
      
      return {
        videos: data.data.map(video => ({
          id: video.resource_key.replace('/videos/', ''),
          uri: video.uri,
          name: video.name,
          description: video.description || '',
          link: video.link,
          duration: video.duration,
          createdTime: video.created_time,
          pictures: video.pictures,
          tags: video.tags?.map(tag => tag.name) || [],
          stats: {
            plays: video.stats?.plays || 0
          }
        })),
        total: data.total,
        page: data.page,
        perPage: data.per_page,
        paging: data.paging
      };
    } catch (error) {
      console.error('Error fetching user videos:', error);
      throw error;
    }
  }

  /**
   * Generate oEmbed HTML
   */
  async generateOEmbedHTML(videoUrl, options = {}) {
    const {
      maxwidth = null,
      maxheight = null,
      byline = true,
      portrait = true,
      title = true,
      autoplay = false,
      loop = false
    } = options;

    try {
      const params = new URLSearchParams({
        url: videoUrl,
        byline: byline ? '1' : '0',
        portrait: portrait ? '1' : '0',
        title: title ? '1' : '0',
        autoplay: autoplay ? '1' : '0',
        loop: loop ? '1' : '0'
      });

      if (maxwidth) params.set('maxwidth', maxwidth.toString());
      if (maxheight) params.set('maxheight', maxheight.toString());

      const response = await fetch(`${this.oEmbedURL}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Vimeo oEmbed API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        html: data.html,
        width: data.width,
        height: data.height,
        type: data.type,
        version: data.version,
        title: data.title,
        authorName: data.author_name,
        authorUrl: data.author_url,
        providerName: data.provider_name,
        providerUrl: data.provider_url,
        thumbnailUrl: data.thumbnail_url,
        thumbnailWidth: data.thumbnail_width,
        thumbnailHeight: data.thumbnail_height,
        videoId: data.video_id,
        duration: data.duration,
        description: data.description,
        uploadDate: data.upload_date,
        accountType: data.account_type,
        uri: data.uri
      };
    } catch (error) {
      console.error('Error generating Vimeo oEmbed:', error);
      throw error;
    }
  }

  /**
   * Generate custom embed HTML
   */
  generateEmbedHTML(videoId, options = {}) {
    const {
      width = 640,
      height = 360,
      autoplay = false,
      loop = false,
      muted = false,
      title = true,
      byline = true,
      portrait = true,
      color = null,
      responsive = false
    } = options;

    const params = new URLSearchParams();
    
    if (autoplay) params.set('autoplay', '1');
    if (loop) params.set('loop', '1');
    if (muted) params.set('muted', '1');
    if (!title) params.set('title', '0');
    if (!byline) params.set('byline', '0');
    if (!portrait) params.set('portrait', '0');
    if (color) params.set('color', color);

    const embedUrl = `${this.embedBaseURL}/${videoId}${params.toString() ? '?' + params.toString() : ''}`;

    if (responsive) {
      return `
        <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;">
          <iframe 
            src="${embedUrl}"
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
            frameborder="0" 
            allow="autoplay; fullscreen; picture-in-picture" 
            allowfullscreen>
          </iframe>
        </div>
      `;
    }

    return `<iframe 
      src="${embedUrl}"
      width="${width}" 
      height="${height}" 
      frameborder="0" 
      allow="autoplay; fullscreen; picture-in-picture" 
      allowfullscreen>
    </iframe>`;
  }

  /**
   * Validate Vimeo URL
   */
  isValidVimeoURL(url) {
    return this.extractVideoId(url) !== null;
  }

  /**
   * Get thumbnail from pictures array
   */
  getBestThumbnail(pictures) {
    if (!pictures || !pictures.sizes) return null;
    
    // Get the largest available thumbnail
    const sizes = pictures.sizes.sort((a, b) => b.width - a.width);
    return sizes[0]?.link || null;
  }
}

class DailymotionAPI {
  constructor(apiKey = null) {
    this.apiKey = apiKey;
    this.baseURL = 'https://www.dailymotion.com/services/oembed';
    this.embedBaseURL = 'https://www.dailymotion.com/embed/video';
  }

  /**
   * Extract video ID from Dailymotion URL
   */
  extractVideoId(url) {
    const patterns = [
      /dailymotion\.com\/video\/([a-zA-Z0-9]+)/,
      /dai\.ly\/([a-zA-Z0-9]+)/,
      /dailymotion\.com\/embed\/video\/([a-zA-Z0-9]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }

  /**
   * Generate oEmbed HTML
   */
  async generateOEmbedHTML(videoUrl, options = {}) {
    const {
      maxwidth = null,
      maxheight = null,
      autoplay = false,
      info = true,
      logo = true,
      related = true,
      quality = 'auto'
    } = options;

    try {
      const params = new URLSearchParams({
        url: videoUrl,
        format: 'json',
        autoplay: autoplay ? '1' : '0',
        info: info ? '1' : '0',
        logo: logo ? '1' : '0',
        related: related ? '1' : '0',
        quality: quality
      });

      if (maxwidth) params.set('maxwidth', maxwidth.toString());
      if (maxheight) params.set('maxheight', maxheight.toString());

      const response = await fetch(`${this.baseURL}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Dailymotion oEmbed API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        html: data.html,
        width: data.width,
        height: data.height,
        type: data.type,
        version: data.version,
        title: data.title,
        authorName: data.author_name,
        authorUrl: data.author_url,
        providerName: data.provider_name,
        providerUrl: data.provider_url,
        thumbnailUrl: data.thumbnail_url,
        thumbnailWidth: data.thumbnail_width,
        thumbnailHeight: data.thumbnail_height
      };
    } catch (error) {
      console.error('Error generating Dailymotion oEmbed:', error);
      throw error;
    }
  }

  /**
   * Generate custom embed HTML
   */
  generateEmbedHTML(videoId, options = {}) {
    const {
      width = 640,
      height = 360,
      autoplay = false,
      mute = false,
      info = true,
      logo = true,
      related = true,
      quality = 'auto',
      responsive = false
    } = options;

    const params = new URLSearchParams();
    
    if (autoplay) params.set('autoplay', '1');
    if (mute) params.set('mute', '1');
    if (!info) params.set('ui-highlight', '0');
    if (!logo) params.set('ui-logo', '0');
    if (!related) params.set('endscreen-enable', '0');
    if (quality !== 'auto') params.set('quality', quality);

    const embedUrl = `${this.embedBaseURL}/${videoId}${params.toString() ? '?' + params.toString() : ''}`;

    if (responsive) {
      return `
        <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;">
          <iframe 
            src="${embedUrl}"
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
            frameborder="0" 
            allow="autoplay; fullscreen" 
            allowfullscreen>
          </iframe>
        </div>
      `;
    }

    return `<iframe 
      src="${embedUrl}"
      width="${width}" 
      height="${height}" 
      frameborder="0" 
      allow="autoplay; fullscreen" 
      allowfullscreen>
    </iframe>`;
  }

  /**
   * Validate Dailymotion URL
   */
  isValidDailymotionURL(url) {
    return this.extractVideoId(url) !== null;
  }
}

// Integration with MLG platform
class MLGVimeoDailymotionIntegration {
  constructor(vimeoAccessToken, dailymotionApiKey, cacheManager) {
    this.vimeo = new VimeoAPI(vimeoAccessToken);
    this.dailymotion = new DailymotionAPI(dailymotionApiKey);
    this.cache = cacheManager;
  }

  /**
   * Process Vimeo/Dailymotion content for MLG platform
   */
  async processVideoContent(url, userId, clanId = null) {
    try {
      let platform, videoId, contentData;

      // Determine platform
      if (this.vimeo.isValidVimeoURL(url)) {
        platform = 'vimeo';
        videoId = this.vimeo.extractVideoId(url);
      } else if (this.dailymotion.isValidDailymotionURL(url)) {
        platform = 'dailymotion';
        videoId = this.dailymotion.extractVideoId(url);
      } else {
        throw new Error('Invalid video URL - not a Vimeo or Dailymotion video');
      }

      // Check cache first
      const cacheKey = `${platform}:video:${videoId}`;
      contentData = await this.cache.get(cacheKey);

      if (!contentData) {
        if (platform === 'vimeo') {
          // Get Vimeo video details
          const vimeoData = await this.vimeo.getVideoDetails(videoId);
          contentData = {
            id: vimeoData.id,
            title: vimeoData.name,
            description: vimeoData.description,
            duration: vimeoData.duration,
            thumbnailUrl: this.vimeo.getBestThumbnail(vimeoData.pictures),
            embedUrl: vimeoData.link,
            createdTime: vimeoData.createdTime,
            author: vimeoData.user?.name,
            authorUrl: vimeoData.user?.link,
            tags: vimeoData.tags,
            categories: vimeoData.categories,
            stats: vimeoData.stats,
            privacy: vimeoData.privacy?.view,
            width: vimeoData.width,
            height: vimeoData.height
          };
        } else {
          // Get Dailymotion oEmbed data
          const dmData = await this.dailymotion.generateOEmbedHTML(url);
          contentData = {
            id: videoId,
            title: dmData.title,
            description: '',
            duration: 0, // Not available in oEmbed
            thumbnailUrl: dmData.thumbnailUrl,
            embedUrl: url,
            createdTime: new Date().toISOString(),
            author: dmData.authorName,
            authorUrl: dmData.authorUrl,
            embedHtml: dmData.html,
            width: dmData.width,
            height: dmData.height
          };
        }

        // Cache for 2 hours
        await this.cache.set(cacheKey, contentData, 7200);
      }

      // Prepare MLG content object
      const mlgContent = {
        platform: platform,
        externalId: contentData.id,
        title: contentData.title,
        description: contentData.description || '',
        thumbnailUrl: contentData.thumbnailUrl,
        duration: contentData.duration || 0,
        embedUrl: contentData.embedUrl,
        metadata: {
          authorName: contentData.author,
          authorUrl: contentData.authorUrl,
          createdTime: contentData.createdTime,
          tags: contentData.tags || [],
          categories: contentData.categories || [],
          stats: contentData.stats || {},
          privacy: contentData.privacy,
          dimensions: {
            width: contentData.width,
            height: contentData.height
          },
          ...(platform === 'dailymotion' && {
            embedHtml: contentData.embedHtml
          })
        },
        submittedBy: userId,
        clanId: clanId,
        createdAt: new Date(),
        status: 'active'
      };

      return mlgContent;
    } catch (error) {
      console.error('Error processing video content:', error);
      throw error;
    }
  }

  /**
   * Search for gaming content on Vimeo
   */
  async searchGamingContent(query = 'gaming', options = {}) {
    try {
      const searchResults = await this.vimeo.searchVideos(query, {
        sort: 'relevant',
        filterEmbeddable: true,
        perPage: options.maxResults || 20
      });

      return searchResults.videos.map(video => ({
        platform: 'vimeo',
        externalId: video.id,
        title: video.name,
        description: video.description,
        thumbnailUrl: this.vimeo.getBestThumbnail(video.pictures),
        duration: video.duration,
        embedUrl: video.link,
        authorName: video.user?.name,
        authorUrl: video.user?.link,
        createdTime: video.createdTime,
        tags: video.tags,
        stats: video.stats
      }));
    } catch (error) {
      console.error('Error searching gaming content:', error);
      return [];
    }
  }

  /**
   * Get user's gaming videos from Vimeo
   */
  async getUserGamingVideos(userId, options = {}) {
    try {
      const userVideos = await this.vimeo.getUserVideos(userId, {
        sort: 'date',
        perPage: options.maxResults || 50
      });

      // Filter for gaming-related content
      const gamingVideos = userVideos.videos.filter(video => {
        const title = video.name.toLowerCase();
        const description = video.description.toLowerCase();
        const tags = video.tags.map(tag => tag.toLowerCase());
        
        return title.includes('gaming') || 
               title.includes('game') || 
               description.includes('gaming') ||
               description.includes('game') ||
               tags.some(tag => ['gaming', 'games', 'esports', 'mlg', 'gameplay'].includes(tag));
      });

      return gamingVideos.map(video => ({
        platform: 'vimeo',
        externalId: video.id,
        title: video.name,
        description: video.description,
        thumbnailUrl: this.vimeo.getBestThumbnail(video.pictures),
        duration: video.duration,
        embedUrl: video.link,
        createdTime: video.createdTime,
        tags: video.tags,
        stats: video.stats
      }));
    } catch (error) {
      console.error('Error fetching user gaming videos:', error);
      throw error;
    }
  }

  /**
   * Generate embed HTML for any platform
   */
  async generateEmbedHTML(url, options = {}) {
    try {
      let platform, videoId, embedHtml;

      if (this.vimeo.isValidVimeoURL(url)) {
        platform = 'vimeo';
        videoId = this.vimeo.extractVideoId(url);
        
        const cacheKey = `vimeo:embed:${videoId}`;
        embedHtml = await this.cache.get(cacheKey);
        
        if (!embedHtml) {
          if (options.useOEmbed) {
            const oEmbedData = await this.vimeo.generateOEmbedHTML(url, options);
            embedHtml = oEmbedData.html;
          } else {
            embedHtml = this.vimeo.generateEmbedHTML(videoId, options);
          }
          
          // Cache for 24 hours
          await this.cache.set(cacheKey, embedHtml, 86400);
        }
      } else if (this.dailymotion.isValidDailymotionURL(url)) {
        platform = 'dailymotion';
        videoId = this.dailymotion.extractVideoId(url);
        
        const cacheKey = `dailymotion:embed:${videoId}`;
        embedHtml = await this.cache.get(cacheKey);
        
        if (!embedHtml) {
          if (options.useOEmbed) {
            const oEmbedData = await this.dailymotion.generateOEmbedHTML(url, options);
            embedHtml = oEmbedData.html;
          } else {
            embedHtml = this.dailymotion.generateEmbedHTML(videoId, options);
          }
          
          // Cache for 24 hours
          await this.cache.set(cacheKey, embedHtml, 86400);
        }
      } else {
        throw new Error('Invalid video URL');
      }

      return embedHtml;
    } catch (error) {
      console.error('Error generating embed HTML:', error);
      throw error;
    }
  }

  /**
   * Get video quality options
   */
  getQualityOptions(platform) {
    if (platform === 'vimeo') {
      return ['auto', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'];
    } else if (platform === 'dailymotion') {
      return ['auto', '240', '380', '480', '720', '1080'];
    }
    return ['auto'];
  }

  /**
   * Format duration for display
   */
  formatDuration(seconds) {
    if (!seconds) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Check if URL is from supported platform
   */
  isSupportedURL(url) {
    return this.vimeo.isValidVimeoURL(url) || this.dailymotion.isValidDailymotionURL(url);
  }

  /**
   * Get platform from URL
   */
  getPlatformFromURL(url) {
    if (this.vimeo.isValidVimeoURL(url)) return 'vimeo';
    if (this.dailymotion.isValidDailymotionURL(url)) return 'dailymotion';
    return null;
  }

  /**
   * Generate thumbnail URL with custom dimensions
   */
  generateThumbnailUrl(originalUrl, width = 640, height = 360) {
    if (!originalUrl) return null;
    
    // Vimeo thumbnails can be resized
    if (originalUrl.includes('vimeocdn.com')) {
      return originalUrl.replace(/(_\d+x\d+)?(\.[a-z]+)$/, `_${width}x${height}$2`);
    }
    
    // Dailymotion thumbnails have fixed sizes
    if (originalUrl.includes('dailymotion.com')) {
      return originalUrl;
    }
    
    return originalUrl;
  }
}

module.exports = { 
  VimeoAPI, 
  DailymotionAPI, 
  MLGVimeoDailymotionIntegration 
};