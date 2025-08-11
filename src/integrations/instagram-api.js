/**
 * Instagram API Integration
 * Handles Instagram posts, reels, stories, and highlights integration
 * Sub-task 9.3
 */

class InstagramAPI {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseURL = 'https://graph.instagram.com';
    this.basicDisplayURL = 'https://graph.instagram.com';
    this.embedBaseURL = 'https://www.instagram.com/p';
  }

  /**
   * Extract post ID from Instagram URL
   */
  extractPostId(url) {
    const patterns = [
      /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
      /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
      /instagram\.com\/tv\/([A-Za-z0-9_-]+)/,
      /instagr\.am\/p\/([A-Za-z0-9_-]+)/
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
   * Extract username from Instagram URL
   */
  extractUsername(url) {
    const patterns = [
      /instagram\.com\/([^\/\?]+)/,
      /instagr\.am\/([^\/\?]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && !['p', 'reel', 'tv', 'stories'].includes(match[1])) {
        return match[1];
      }
    }
    return null;
  }

  /**
   * Get user basic information
   */
  async getUserInfo(userId = 'me') {
    try {
      const fields = [
        'id', 'username', 'account_type', 'media_count'
      ].join(',');

      const response = await fetch(
        `${this.basicDisplayURL}/${userId}?fields=${fields}&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Instagram API error: ${errorData.error?.message || response.status}`);
      }

      const user = await response.json();
      
      return {
        id: user.id,
        username: user.username,
        accountType: user.account_type,
        mediaCount: user.media_count
      };
    } catch (error) {
      console.error('Error fetching Instagram user info:', error);
      throw error;
    }
  }

  /**
   * Get user media (posts, reels, etc.)
   */
  async getUserMedia(userId = 'me', options = {}) {
    const {
      limit = 25,
      after = null,
      before = null
    } = options;

    try {
      const fields = [
        'id', 'media_type', 'media_url', 'permalink', 'thumbnail_url',
        'caption', 'timestamp', 'username', 'like_count', 'comments_count',
        'children{media_type,media_url,permalink,thumbnail_url}'
      ].join(',');

      let url = `${this.basicDisplayURL}/${userId}/media?fields=${fields}&limit=${limit}&access_token=${this.accessToken}`;
      
      if (after) url += `&after=${after}`;
      if (before) url += `&before=${before}`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Instagram API error: ${errorData.error?.message || response.status}`);
      }

      const data = await response.json();
      
      return {
        media: data.data.map(item => ({
          id: item.id,
          mediaType: item.media_type,
          mediaUrl: item.media_url,
          thumbnailUrl: item.thumbnail_url,
          permalink: item.permalink,
          caption: item.caption || '',
          timestamp: item.timestamp,
          username: item.username,
          likeCount: item.like_count || 0,
          commentsCount: item.comments_count || 0,
          children: item.children?.data || [],
          isVideo: item.media_type === 'VIDEO',
          isCarousel: item.media_type === 'CAROUSEL_ALBUM'
        })),
        paging: data.paging
      };
    } catch (error) {
      console.error('Error fetching Instagram user media:', error);
      throw error;
    }
  }

  /**
   * Get specific media details
   */
  async getMediaDetails(mediaId) {
    try {
      const fields = [
        'id', 'media_type', 'media_url', 'permalink', 'thumbnail_url',
        'caption', 'timestamp', 'username', 'like_count', 'comments_count',
        'children{media_type,media_url,permalink,thumbnail_url}'
      ].join(',');

      const response = await fetch(
        `${this.basicDisplayURL}/${mediaId}?fields=${fields}&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Instagram API error: ${errorData.error?.message || response.status}`);
      }

      const media = await response.json();
      
      return {
        id: media.id,
        mediaType: media.media_type,
        mediaUrl: media.media_url,
        thumbnailUrl: media.thumbnail_url,
        permalink: media.permalink,
        caption: media.caption || '',
        timestamp: media.timestamp,
        username: media.username,
        likeCount: media.like_count || 0,
        commentsCount: media.comments_count || 0,
        children: media.children?.data || [],
        isVideo: media.media_type === 'VIDEO',
        isCarousel: media.media_type === 'CAROUSEL_ALBUM'
      };
    } catch (error) {
      console.error('Error fetching Instagram media details:', error);
      throw error;
    }
  }

  /**
   * Get business account insights (requires Instagram Business Account)
   */
  async getAccountInsights(userId = 'me', metric = [], period = 'day', since = null, until = null) {
    const defaultMetrics = [
      'impressions', 'reach', 'profile_views', 'website_clicks'
    ];

    const metricsToFetch = metric.length > 0 ? metric : defaultMetrics;

    try {
      let url = `${this.baseURL}/${userId}/insights?metric=${metricsToFetch.join(',')}&period=${period}&access_token=${this.accessToken}`;
      
      if (since) url += `&since=${since}`;
      if (until) url += `&until=${until}`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Instagram API error: ${errorData.error?.message || response.status}`);
      }

      const data = await response.json();
      
      const insights = {};
      data.data.forEach(insight => {
        insights[insight.name] = {
          value: insight.values[0]?.value || 0,
          endTime: insight.values[0]?.end_time,
          period: insight.period,
          title: insight.title,
          description: insight.description
        };
      });

      return insights;
    } catch (error) {
      console.error('Error fetching Instagram account insights:', error);
      throw error;
    }
  }

  /**
   * Get media insights (requires Instagram Business Account)
   */
  async getMediaInsights(mediaId, metrics = []) {
    const defaultMetrics = [
      'impressions', 'reach', 'likes', 'comments', 'saves', 'shares'
    ];

    const metricsToFetch = metrics.length > 0 ? metrics : defaultMetrics;

    try {
      const response = await fetch(
        `${this.baseURL}/${mediaId}/insights?metric=${metricsToFetch.join(',')}&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Instagram API error: ${errorData.error?.message || response.status}`);
      }

      const data = await response.json();
      
      const insights = {};
      data.data.forEach(insight => {
        insights[insight.name] = {
          value: insight.value || 0,
          title: insight.title,
          description: insight.description
        };
      });

      return insights;
    } catch (error) {
      console.error('Error fetching Instagram media insights:', error);
      throw error;
    }
  }

  /**
   * Get stories (requires Instagram Business Account)
   */
  async getStories(userId = 'me') {
    try {
      const fields = [
        'id', 'media_type', 'media_url', 'permalink', 'thumbnail_url',
        'timestamp', 'username'
      ].join(',');

      const response = await fetch(
        `${this.baseURL}/${userId}/stories?fields=${fields}&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Instagram API error: ${errorData.error?.message || response.status}`);
      }

      const data = await response.json();
      
      return {
        stories: data.data.map(story => ({
          id: story.id,
          mediaType: story.media_type,
          mediaUrl: story.media_url,
          thumbnailUrl: story.thumbnail_url,
          permalink: story.permalink,
          timestamp: story.timestamp,
          username: story.username,
          isVideo: story.media_type === 'VIDEO'
        }))
      };
    } catch (error) {
      console.error('Error fetching Instagram stories:', error);
      throw error;
    }
  }

  /**
   * Generate embed HTML for Instagram post
   */
  generateEmbedHTML(postUrl, options = {}) {
    const {
      width = 400,
      height = null,
      hidecaption = false,
      maxwidth = 658
    } = options;

    const postId = this.extractPostId(postUrl);
    if (!postId) {
      throw new Error('Invalid Instagram URL');
    }

    let embedUrl = `${this.embedBaseURL}/${postId}/embed/`;
    const params = [];

    if (hidecaption) params.push('hidecaption=true');
    if (maxwidth && maxwidth !== 658) params.push(`maxwidth=${maxwidth}`);

    if (params.length > 0) {
      embedUrl += '?' + params.join('&');
    }

    const heightAttr = height ? `height="${height}"` : '';

    return `<iframe 
      src="${embedUrl}" 
      width="${width}" 
      ${heightAttr}
      frameborder="0" 
      scrolling="no" 
      allowtransparency="true">
    </iframe>`;
  }

  /**
   * Generate responsive embed HTML
   */
  generateResponsiveEmbedHTML(postUrl, options = {}) {
    const {
      maxwidth = 540,
      hidecaption = false
    } = options;

    const postId = this.extractPostId(postUrl);
    if (!postId) {
      throw new Error('Invalid Instagram URL');
    }

    let embedUrl = `${this.embedBaseURL}/${postId}/embed/`;
    const params = [];

    if (hidecaption) params.push('hidecaption=true');
    if (maxwidth && maxwidth !== 658) params.push(`maxwidth=${maxwidth}`);

    if (params.length > 0) {
      embedUrl += '?' + params.join('&');
    }

    return `
      <div style="max-width: ${maxwidth}px; margin: 0 auto;">
        <iframe 
          src="${embedUrl}"
          width="100%" 
          height="800"
          frameborder="0" 
          scrolling="no" 
          allowtransparency="true"
          style="border: none; overflow: hidden;">
        </iframe>
      </div>
    `;
  }

  /**
   * Generate oEmbed HTML (alternative embedding method)
   */
  async generateOEmbedHTML(postUrl, options = {}) {
    const {
      maxwidth = 658,
      hidecaption = false,
      omitscript = false
    } = options;

    try {
      let oEmbedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(postUrl)}`;
      const params = [];

      if (maxwidth !== 658) params.push(`maxwidth=${maxwidth}`);
      if (hidecaption) params.push('hidecaption=true');
      if (omitscript) params.push('omitscript=true');

      if (params.length > 0) {
        oEmbedUrl += '&' + params.join('&');
      }

      const response = await fetch(oEmbedUrl);

      if (!response.ok) {
        throw new Error(`Instagram oEmbed API error: ${response.status}`);
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
      console.error('Error generating Instagram oEmbed:', error);
      throw error;
    }
  }

  /**
   * Validate Instagram URL
   */
  isValidInstagramURL(url) {
    return this.extractPostId(url) !== null || this.extractUsername(url) !== null;
  }

  /**
   * Check if media is a video
   */
  isVideoMedia(mediaType) {
    return mediaType === 'VIDEO' || mediaType === 'REEL';
  }

  /**
   * Format timestamp
   */
  formatTimestamp(timestamp) {
    return new Date(timestamp).toISOString();
  }

  /**
   * Get hashtags from caption
   */
  extractHashtags(caption) {
    if (!caption) return [];
    const hashtagRegex = /#[a-zA-Z0-9_]+/g;
    const matches = caption.match(hashtagRegex);
    return matches ? matches.map(tag => tag.slice(1)) : [];
  }

  /**
   * Get mentions from caption
   */
  extractMentions(caption) {
    if (!caption) return [];
    const mentionRegex = /@[a-zA-Z0-9_.]+/g;
    const matches = caption.match(mentionRegex);
    return matches ? matches.map(mention => mention.slice(1)) : [];
  }
}

// Integration with MLG platform
class MLGInstagramIntegration {
  constructor(accessToken, cacheManager) {
    this.instagram = new InstagramAPI(accessToken);
    this.cache = cacheManager;
  }

  /**
   * Process Instagram content for MLG platform
   */
  async processInstagramContent(url, userId, clanId = null) {
    try {
      const postId = this.instagram.extractPostId(url);
      if (!postId) {
        throw new Error('Invalid Instagram URL');
      }

      // Check cache first
      const cacheKey = `instagram:media:${postId}`;
      let mediaData = await this.cache.get(cacheKey);

      if (!mediaData) {
        // Try to get media details using the URL approach
        try {
          const oEmbedData = await this.instagram.generateOEmbedHTML(url);
          
          mediaData = {
            id: postId,
            mediaType: 'UNKNOWN',
            mediaUrl: null,
            thumbnailUrl: oEmbedData.thumbnailUrl,
            permalink: url,
            caption: oEmbedData.title || '',
            timestamp: new Date().toISOString(),
            username: oEmbedData.authorName,
            likeCount: 0,
            commentsCount: 0,
            embedHtml: oEmbedData.html,
            isVideo: false,
            isCarousel: false
          };
        } catch (oEmbedError) {
          throw new Error('Unable to fetch Instagram media data');
        }

        // Cache for 15 minutes (Instagram content changes frequently)
        await this.cache.set(cacheKey, mediaData, 900);
      }

      // Extract hashtags and mentions
      const hashtags = this.instagram.extractHashtags(mediaData.caption);
      const mentions = this.instagram.extractMentions(mediaData.caption);

      // Prepare MLG content object
      const mlgContent = {
        platform: 'instagram',
        externalId: postId,
        title: mediaData.caption ? mediaData.caption.substring(0, 100) + '...' : 'Instagram Post',
        description: mediaData.caption || '',
        thumbnailUrl: mediaData.thumbnailUrl,
        duration: mediaData.isVideo ? null : 0, // Instagram doesn't provide video duration in basic API
        embedUrl: mediaData.permalink,
        metadata: {
          username: mediaData.username,
          timestamp: mediaData.timestamp,
          mediaType: mediaData.mediaType,
          likeCount: mediaData.likeCount,
          commentsCount: mediaData.commentsCount,
          hashtags: hashtags,
          mentions: mentions,
          isVideo: mediaData.isVideo,
          isCarousel: mediaData.isCarousel,
          embedHtml: mediaData.embedHtml
        },
        submittedBy: userId,
        clanId: clanId,
        createdAt: new Date(),
        status: 'active'
      };

      return mlgContent;
    } catch (error) {
      console.error('Error processing Instagram content:', error);
      throw error;
    }
  }

  /**
   * Get gaming-related content from Instagram
   */
  async searchGamingContent(userIds = []) {
    try {
      const results = [];

      for (const userId of userIds) {
        const userMedia = await this.instagram.getUserMedia(userId, {
          limit: 10
        });

        const gamingPosts = userMedia.media
          .filter(media => {
            const caption = media.caption.toLowerCase();
            return caption.includes('gaming') || 
                   caption.includes('game') || 
                   caption.includes('esports') ||
                   caption.includes('mlg') ||
                   this.instagram.extractHashtags(media.caption)
                     .some(tag => ['gaming', 'games', 'esports', 'mlg', 'gamer'].includes(tag.toLowerCase()));
          })
          .map(media => ({
            platform: 'instagram',
            externalId: media.id,
            title: media.caption ? media.caption.substring(0, 100) + '...' : 'Instagram Post',
            description: media.caption,
            thumbnailUrl: media.thumbnailUrl || media.mediaUrl,
            embedUrl: media.permalink,
            username: media.username,
            timestamp: media.timestamp,
            likeCount: media.likeCount,
            commentsCount: media.commentsCount,
            isVideo: media.isVideo,
            hashtags: this.instagram.extractHashtags(media.caption)
          }));

        results.push(...gamingPosts);
      }

      return results;
    } catch (error) {
      console.error('Error searching Instagram gaming content:', error);
      throw error;
    }
  }

  /**
   * Get user's gaming highlights
   */
  async getGamingHighlights(userId = 'me') {
    try {
      const stories = await this.instagram.getStories(userId);
      
      return stories.stories
        .filter(story => {
          // Filter for gaming-related content based on available data
          return true; // Instagram API limitations - would need additional context
        })
        .map(story => ({
          platform: 'instagram',
          type: 'story',
          externalId: story.id,
          mediaUrl: story.mediaUrl,
          thumbnailUrl: story.thumbnailUrl,
          timestamp: story.timestamp,
          username: story.username,
          isVideo: story.isVideo
        }));
    } catch (error) {
      console.error('Error fetching Instagram gaming highlights:', error);
      return [];
    }
  }

  /**
   * Generate authentication URL for Instagram Basic Display
   */
  static generateAuthURL(appId, redirectUri, scope = ['user_profile', 'user_media']) {
    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      scope: scope.join(','),
      response_type: 'code',
      state: Math.random().toString(36).substring(2, 15)
    });

    return {
      url: `https://api.instagram.com/oauth/authorize?${params.toString()}`,
      state: params.get('state')
    };
  }

  /**
   * Exchange code for access token
   */
  static async exchangeCodeForToken(appId, appSecret, code, redirectUri) {
    try {
      const formData = new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code: code
      });

      const response = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Instagram OAuth error: ${response.status}`);
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        userId: data.user_id
      };
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }
}

module.exports = { InstagramAPI, MLGInstagramIntegration };