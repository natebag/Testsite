/**
 * Facebook Video API Integration
 * Handles Facebook video embedding, authentication, and permissions management
 * Sub-task 9.2
 */

class FacebookVideoAPI {
  constructor(appId, appSecret, accessToken = null) {
    this.appId = appId;
    this.appSecret = appSecret;
    this.accessToken = accessToken;
    this.baseURL = 'https://graph.facebook.com/v18.0';
    this.embedBaseURL = 'https://www.facebook.com/plugins/video.php';
  }

  /**
   * Extract video ID from Facebook URL
   */
  extractVideoId(url) {
    const patterns = [
      /facebook\.com\/.*\/videos\/(\d+)/,
      /facebook\.com\/video\.php\?v=(\d+)/,
      /facebook\.com\/.*\/posts\/(\d+)/,
      /fb\.watch\/([a-zA-Z0-9]+)/,
      /facebook\.com\/watch\/\?v=(\d+)/
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
   * Extract page ID from Facebook URL
   */
  extractPageId(url) {
    const patterns = [
      /facebook\.com\/([^\/\?]+)/,
      /facebook\.com\/pages\/[^\/]+\/(\d+)/
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
   * Get app access token
   */
  async getAppAccessToken() {
    try {
      const response = await fetch(
        `${this.baseURL}/oauth/access_token?client_id=${this.appId}&client_secret=${this.appSecret}&grant_type=client_credentials`
      );

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.status}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error getting Facebook app access token:', error);
      throw error;
    }
  }

  /**
   * Get video metadata
   */
  async getVideoMetadata(videoId, accessToken = null) {
    const token = accessToken || this.accessToken;
    if (!token) {
      throw new Error('Access token required for Facebook API');
    }

    try {
      const fields = [
        'id', 'title', 'description', 'created_time', 'updated_time',
        'length', 'picture', 'source', 'permalink_url', 'embed_html',
        'status', 'published', 'privacy', 'views', 'reactions.summary(true)',
        'comments.summary(true)', 'shares', 'from', 'thumbnails'
      ].join(',');

      const response = await fetch(
        `${this.baseURL}/${videoId}?fields=${fields}&access_token=${token}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Facebook API error: ${errorData.error?.message || response.status}`);
      }

      const video = await response.json();
      
      return {
        id: video.id,
        title: video.title || 'Untitled Video',
        description: video.description || '',
        createdTime: video.created_time,
        updatedTime: video.updated_time,
        duration: video.length || 0,
        picture: video.picture,
        source: video.source,
        permalinkUrl: video.permalink_url,
        embedHtml: video.embed_html,
        status: video.status?.video_status || 'unknown',
        published: video.published || false,
        privacy: video.privacy?.value || 'unknown',
        views: video.views || 0,
        reactions: video.reactions?.summary?.total_count || 0,
        comments: video.comments?.summary?.total_count || 0,
        shares: video.shares?.count || 0,
        from: {
          id: video.from?.id,
          name: video.from?.name
        },
        thumbnails: video.thumbnails?.data || []
      };
    } catch (error) {
      console.error('Error fetching Facebook video metadata:', error);
      throw error;
    }
  }

  /**
   * Get page videos
   */
  async getPageVideos(pageId, accessToken = null, options = {}) {
    const token = accessToken || this.accessToken;
    if (!token) {
      throw new Error('Access token required for Facebook API');
    }

    const {
      limit = 25,
      since = null,
      until = null,
      after = null,
      before = null
    } = options;

    try {
      let url = `${this.baseURL}/${pageId}/videos?access_token=${token}&limit=${limit}`;
      
      const fields = [
        'id', 'title', 'description', 'created_time', 'length',
        'picture', 'permalink_url', 'status', 'views'
      ].join(',');
      
      url += `&fields=${fields}`;
      
      if (since) url += `&since=${since}`;
      if (until) url += `&until=${until}`;
      if (after) url += `&after=${after}`;
      if (before) url += `&before=${before}`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Facebook API error: ${errorData.error?.message || response.status}`);
      }

      const data = await response.json();
      
      return {
        videos: data.data.map(video => ({
          id: video.id,
          title: video.title || 'Untitled Video',
          description: video.description || '',
          createdTime: video.created_time,
          duration: video.length || 0,
          picture: video.picture,
          permalinkUrl: video.permalink_url,
          status: video.status?.video_status || 'unknown',
          views: video.views || 0
        })),
        paging: data.paging
      };
    } catch (error) {
      console.error('Error fetching page videos:', error);
      throw error;
    }
  }

  /**
   * Get page information
   */
  async getPageInfo(pageId, accessToken = null) {
    const token = accessToken || this.accessToken;
    if (!token) {
      throw new Error('Access token required for Facebook API');
    }

    try {
      const fields = [
        'id', 'name', 'about', 'category', 'category_list',
        'cover', 'fan_count', 'picture', 'link', 'username',
        'verification_status', 'website', 'posts.limit(1)'
      ].join(',');

      const response = await fetch(
        `${this.baseURL}/${pageId}?fields=${fields}&access_token=${token}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Facebook API error: ${errorData.error?.message || response.status}`);
      }

      const page = await response.json();
      
      return {
        id: page.id,
        name: page.name,
        about: page.about || '',
        category: page.category,
        categoryList: page.category_list || [],
        cover: page.cover,
        fanCount: page.fan_count || 0,
        picture: page.picture?.data?.url,
        link: page.link,
        username: page.username,
        verificationStatus: page.verification_status,
        website: page.website
      };
    } catch (error) {
      console.error('Error fetching Facebook page info:', error);
      throw error;
    }
  }

  /**
   * Generate embed HTML for Facebook video
   */
  generateEmbedHTML(videoUrl, options = {}) {
    const {
      width = 560,
      height = 315,
      showText = false,
      showCaptions = false,
      autoplay = false,
      allowfullscreen = true
    } = options;

    const params = new URLSearchParams({
      href: encodeURIComponent(videoUrl),
      width: width.toString(),
      height: height.toString(),
      show_text: showText.toString(),
      show_captions: showCaptions.toString(),
      autoplay: autoplay.toString(),
      allowfullscreen: allowfullscreen.toString()
    });

    return `<iframe 
      src="${this.embedBaseURL}?${params.toString()}" 
      width="${width}" 
      height="${height}" 
      style="border:none;overflow:hidden" 
      scrolling="no" 
      frameborder="0" 
      allowfullscreen="${allowfullscreen}">
    </iframe>`;
  }

  /**
   * Generate responsive embed HTML
   */
  generateResponsiveEmbedHTML(videoUrl, options = {}) {
    const {
      aspectRatio = '16:9',
      showText = false,
      showCaptions = false,
      autoplay = false
    } = options;

    const paddingBottom = aspectRatio === '16:9' ? '56.25%' : '75%';
    
    const params = new URLSearchParams({
      href: encodeURIComponent(videoUrl),
      show_text: showText.toString(),
      show_captions: showCaptions.toString(),
      autoplay: autoplay.toString(),
      allowfullscreen: 'true'
    });

    return `
      <div style="position: relative; padding-bottom: ${paddingBottom}; height: 0; overflow: hidden; max-width: 100%; background: #000;">
        <iframe 
          src="${this.embedBaseURL}?${params.toString()}"
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
          scrolling="no" 
          frameborder="0" 
          allowfullscreen>
        </iframe>
      </div>
    `;
  }

  /**
   * Check if video is embeddable
   */
  async isVideoEmbeddable(videoId, accessToken = null) {
    try {
      const metadata = await this.getVideoMetadata(videoId, accessToken);
      return metadata.status === 'ready' && metadata.published;
    } catch (error) {
      console.error('Error checking video embeddability:', error);
      return false;
    }
  }

  /**
   * Get video insights (requires page access token)
   */
  async getVideoInsights(videoId, accessToken, metrics = []) {
    const defaultMetrics = [
      'video_views',
      'video_views_unique',
      'video_view_time',
      'video_complete_views_30s',
      'video_reactions_by_type_total',
      'video_comments',
      'video_shares'
    ];

    const metricsToFetch = metrics.length > 0 ? metrics : defaultMetrics;

    try {
      const response = await fetch(
        `${this.baseURL}/${videoId}/video_insights?metric=${metricsToFetch.join(',')}&access_token=${accessToken}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Facebook API error: ${errorData.error?.message || response.status}`);
      }

      const data = await response.json();
      
      const insights = {};
      data.data.forEach(insight => {
        insights[insight.name] = {
          value: insight.values[0]?.value || 0,
          endTime: insight.values[0]?.end_time,
          title: insight.title,
          description: insight.description
        };
      });

      return insights;
    } catch (error) {
      console.error('Error fetching video insights:', error);
      throw error;
    }
  }

  /**
   * Validate Facebook video URL
   */
  isValidFacebookURL(url) {
    return this.extractVideoId(url) !== null;
  }

  /**
   * Format duration in human-readable format
   */
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Get video reactions breakdown
   */
  async getVideoReactions(videoId, accessToken = null) {
    const token = accessToken || this.accessToken;
    if (!token) {
      throw new Error('Access token required for Facebook API');
    }

    try {
      const response = await fetch(
        `${this.baseURL}/${videoId}/reactions?summary=1&access_token=${token}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Facebook API error: ${errorData.error?.message || response.status}`);
      }

      const data = await response.json();
      
      return {
        totalCount: data.summary?.total_count || 0,
        viewerReaction: data.summary?.viewer_reaction,
        reactions: data.data || []
      };
    } catch (error) {
      console.error('Error fetching video reactions:', error);
      throw error;
    }
  }
}

// Integration with MLG platform
class MLGFacebookIntegration {
  constructor(appId, appSecret, accessToken, cacheManager) {
    this.facebook = new FacebookVideoAPI(appId, appSecret, accessToken);
    this.cache = cacheManager;
  }

  /**
   * Process Facebook video content for MLG platform
   */
  async processFacebookContent(url, userId, clanId = null, accessToken = null) {
    try {
      const videoId = this.facebook.extractVideoId(url);
      if (!videoId) {
        throw new Error('Invalid Facebook video URL');
      }

      // Check cache first
      const cacheKey = `facebook:metadata:${videoId}`;
      let metadata = await this.cache.get(cacheKey);

      if (!metadata) {
        metadata = await this.facebook.getVideoMetadata(videoId, accessToken);
        // Cache for 30 minutes (Facebook content changes frequently)
        await this.cache.set(cacheKey, metadata, 1800);
      }

      // Check if video is embeddable
      const embeddable = await this.facebook.isVideoEmbeddable(videoId, accessToken);

      // Prepare MLG content object
      const mlgContent = {
        platform: 'facebook',
        externalId: videoId,
        title: metadata.title,
        description: metadata.description,
        thumbnailUrl: metadata.picture,
        duration: metadata.duration,
        embedUrl: metadata.permalinkUrl,
        metadata: {
          fromName: metadata.from.name,
          fromId: metadata.from.id,
          createdTime: metadata.createdTime,
          views: metadata.views,
          reactions: metadata.reactions,
          comments: metadata.comments,
          shares: metadata.shares,
          status: metadata.status,
          privacy: metadata.privacy,
          embeddable: embeddable
        },
        submittedBy: userId,
        clanId: clanId,
        createdAt: new Date(),
        status: embeddable ? 'active' : 'restricted'
      };

      return mlgContent;
    } catch (error) {
      console.error('Error processing Facebook content:', error);
      throw error;
    }
  }

  /**
   * Get gaming pages and their videos
   */
  async searchGamingContent(pageIds = [], accessToken = null) {
    try {
      const results = [];

      for (const pageId of pageIds) {
        const pageVideos = await this.facebook.getPageVideos(pageId, accessToken, {
          limit: 10
        });

        const processedVideos = pageVideos.videos.map(video => ({
          platform: 'facebook',
          externalId: video.id,
          title: video.title,
          description: video.description,
          thumbnailUrl: video.picture,
          duration: video.duration,
          embedUrl: video.permalinkUrl,
          createdTime: video.createdTime,
          views: video.views,
          status: video.status
        }));

        results.push(...processedVideos);
      }

      return results;
    } catch (error) {
      console.error('Error searching Facebook gaming content:', error);
      throw error;
    }
  }

  /**
   * Authenticate user for Facebook integration
   */
  generateAuthURL(redirectUri, scope = ['pages_show_list', 'pages_read_engagement']) {
    const params = new URLSearchParams({
      client_id: this.facebook.appId,
      redirect_uri: redirectUri,
      scope: scope.join(','),
      response_type: 'code',
      state: Math.random().toString(36).substring(2, 15)
    });

    return {
      url: `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`,
      state: params.get('state')
    };
  }

  /**
   * Exchange code for access token
   */
  async exchangeCodeForToken(code, redirectUri) {
    try {
      const response = await fetch(
        `${this.facebook.baseURL}/oauth/access_token?client_id=${this.facebook.appId}&client_secret=${this.facebook.appSecret}&code=${code}&redirect_uri=${redirectUri}`
      );

      if (!response.ok) {
        throw new Error(`Facebook OAuth error: ${response.status}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }
}

module.exports = { FacebookVideoAPI, MLGFacebookIntegration };