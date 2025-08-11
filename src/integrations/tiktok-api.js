/**
 * TikTok API Integration
 * Handles TikTok for Developers API, video discovery, embedding, and creator analytics
 * Sub-task 9.5
 */

class TikTokAPI {
  constructor(clientKey, clientSecret, accessToken = null) {
    this.clientKey = clientKey;
    this.clientSecret = clientSecret;
    this.accessToken = accessToken;
    this.baseURL = 'https://open.tiktokapis.com/v2';
    this.embedBaseURL = 'https://www.tiktok.com/embed/v2';
    this.oEmbedURL = 'https://www.tiktok.com/oembed';
  }

  /**
   * Extract video ID from TikTok URL
   */
  extractVideoId(url) {
    const patterns = [
      /tiktok\.com\/@[^\/]+\/video\/(\d+)/,
      /tiktok\.com\/v\/(\d+)/,
      /vm\.tiktok\.com\/([A-Za-z0-9]+)/,
      /tiktok\.com\/t\/([A-Za-z0-9]+)/,
      /tiktok\.com\/@[^\/]+\/video\/(\d+)/
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
   * Extract username from TikTok URL
   */
  extractUsername(url) {
    const patterns = [
      /tiktok\.com\/@([^\/\?]+)/,
      /tiktok\.com\/[@]([^\/\?]+)/
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
   * Get access token using client credentials
   */
  async getClientAccessToken() {
    try {
      const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache'
        },
        body: new URLSearchParams({
          client_key: this.clientKey,
          client_secret: this.clientSecret,
          grant_type: 'client_credentials'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`TikTok OAuth error: ${errorData.error_description || response.status}`);
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        scope: data.scope
      };
    } catch (error) {
      console.error('Error getting TikTok client access token:', error);
      throw error;
    }
  }

  /**
   * Get user information
   */
  async getUserInfo(accessToken = null) {
    const token = accessToken || this.accessToken;
    if (!token) {
      throw new Error('Access token required for TikTok API');
    }

    try {
      const response = await fetch(`${this.baseURL}/user/info/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`TikTok API error: ${errorData.error?.message || response.status}`);
      }

      const data = await response.json();
      const user = data.data?.user;
      
      if (!user) {
        throw new Error('User data not found in response');
      }

      return {
        openId: user.open_id,
        unionId: user.union_id,
        avatarUrl: user.avatar_url,
        displayName: user.display_name,
        bio: user.bio_description,
        profileDeepLink: user.profile_deep_link,
        isVerified: user.is_verified || false,
        followerCount: user.follower_count || 0,
        followingCount: user.following_count || 0,
        likesCount: user.likes_count || 0,
        videoCount: user.video_count || 0
      };
    } catch (error) {
      console.error('Error fetching TikTok user info:', error);
      throw error;
    }
  }

  /**
   * Get user videos
   */
  async getUserVideos(accessToken = null, options = {}) {
    const token = accessToken || this.accessToken;
    if (!token) {
      throw new Error('Access token required for TikTok API');
    }

    const {
      maxCount = 20,
      cursor = 0
    } = options;

    try {
      const response = await fetch(`${this.baseURL}/video/list/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          max_count: maxCount,
          cursor: cursor
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`TikTok API error: ${errorData.error?.message || response.status}`);
      }

      const data = await response.json();
      
      if (data.error?.code !== 'ok') {
        throw new Error(`TikTok API error: ${data.error?.message}`);
      }

      const videos = data.data?.videos || [];
      
      return {
        videos: videos.map(video => ({
          id: video.id,
          title: video.title || '',
          videoDescription: video.video_description || '',
          duration: video.duration || 0,
          coverImageUrl: video.cover_image_url,
          shareUrl: video.share_url,
          embedUrl: video.embed_link,
          createTime: video.create_time,
          viewCount: video.view_count || 0,
          likeCount: video.like_count || 0,
          commentCount: video.comment_count || 0,
          shareCount: video.share_count || 0,
          playUrl: video.play_url,
          downloadUrl: video.download_url,
          publiclyAvailable: video.publicly_available || false,
          isCommentDisabled: video.is_comment_disabled || false,
          isDuetDisabled: video.is_duet_disabled || false,
          isStitchDisabled: video.is_stitch_disabled || false
        })),
        cursor: data.data?.cursor || 0,
        hasMore: data.data?.has_more || false,
        total: data.data?.total || 0
      };
    } catch (error) {
      console.error('Error fetching TikTok user videos:', error);
      throw error;
    }
  }

  /**
   * Query videos by hashtag or keyword (Research API - limited access)
   */
  async queryVideos(query, options = {}) {
    const token = this.accessToken;
    if (!token) {
      throw new Error('Access token required for TikTok Research API');
    }

    const {
      maxCount = 100,
      cursor = 0,
      searchId = null,
      startDate = null,
      endDate = null,
      region = 'US',
      musicId = null,
      effectId = null,
      hashtag = null,
      keyword = null,
      username = null
    } = options;

    try {
      const requestBody = {
        query: {
          and: []
        },
        max_count: maxCount,
        cursor: cursor,
        search_id: searchId
      };

      // Build query conditions
      if (hashtag) {
        requestBody.query.and.push({
          operation: 'EQ',
          field_name: 'hashtag_name',
          field_values: [hashtag]
        });
      }

      if (keyword) {
        requestBody.query.and.push({
          operation: 'IN',
          field_name: 'video_description',
          field_values: [keyword]
        });
      }

      if (username) {
        requestBody.query.and.push({
          operation: 'EQ',
          field_name: 'username',
          field_values: [username]
        });
      }

      if (startDate && endDate) {
        requestBody.query.and.push({
          operation: 'GTE',
          field_name: 'create_date',
          field_values: [startDate]
        });
        requestBody.query.and.push({
          operation: 'LTE',
          field_name: 'create_date',
          field_values: [endDate]
        });
      }

      if (region) {
        requestBody.query.and.push({
          operation: 'EQ',
          field_name: 'region_code',
          field_values: [region]
        });
      }

      const response = await fetch(`${this.baseURL}/research/video/query/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`TikTok Research API error: ${errorData.error?.message || response.status}`);
      }

      const data = await response.json();
      
      if (data.error?.code !== 'ok') {
        throw new Error(`TikTok Research API error: ${data.error?.message}`);
      }

      const videos = data.data?.videos || [];
      
      return {
        videos: videos.map(video => ({
          id: video.id,
          createTime: video.create_time,
          username: video.username,
          regionCode: video.region_code,
          videoDescription: video.video_description,
          musicId: video.music_id,
          likeCount: video.like_count || 0,
          commentCount: video.comment_count || 0,
          shareCount: video.share_count || 0,
          viewCount: video.view_count || 0,
          hashtags: video.hashtag_names || [],
          effects: video.effect_ids || [],
          playlistId: video.playlist_id,
          voiceToTextText: video.voice_to_text?.text
        })),
        cursor: data.data?.cursor,
        hasMore: data.data?.has_more || false,
        searchId: data.data?.search_id,
        total: data.data?.total || 0
      };
    } catch (error) {
      console.error('Error querying TikTok videos:', error);
      throw error;
    }
  }

  /**
   * Generate oEmbed HTML for TikTok video
   */
  async generateOEmbedHTML(videoUrl, options = {}) {
    const {
      maxwidth = 325,
      maxheight = 0
    } = options;

    try {
      const params = new URLSearchParams({
        url: videoUrl
      });

      if (maxwidth && maxwidth !== 325) {
        params.set('maxwidth', maxwidth.toString());
      }

      if (maxheight && maxheight > 0) {
        params.set('maxheight', maxheight.toString());
      }

      const response = await fetch(`${this.oEmbedURL}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`TikTok oEmbed API error: ${response.status}`);
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
      console.error('Error generating TikTok oEmbed:', error);
      throw error;
    }
  }

  /**
   * Generate responsive embed HTML
   */
  async generateResponsiveEmbedHTML(videoUrl, options = {}) {
    try {
      const oEmbedData = await this.generateOEmbedHTML(videoUrl, options);
      
      return `
        <div style="max-width: 605px; min-width: 325px; margin: 0 auto;">
          ${oEmbedData.html}
        </div>
      `;
    } catch (error) {
      console.error('Error generating responsive embed:', error);
      throw error;
    }
  }

  /**
   * Generate custom embed HTML
   */
  generateCustomEmbedHTML(videoId, options = {}) {
    const {
      width = 325,
      height = 578,
      hideCaption = false,
      hideUsername = false
    } = options;

    let embedUrl = `${this.embedBaseURL}/${videoId}`;
    const params = [];

    if (hideCaption) params.push('hide_caption=1');
    if (hideUsername) params.push('hide_username=1');

    if (params.length > 0) {
      embedUrl += '?' + params.join('&');
    }

    return `<iframe 
      src="${embedUrl}" 
      width="${width}" 
      height="${height}" 
      frameborder="0" 
      scrolling="no" 
      allowtransparency="true" 
      allow="encrypted-media;">
    </iframe>`;
  }

  /**
   * Validate TikTok URL
   */
  isValidTikTokURL(url) {
    return this.extractVideoId(url) !== null;
  }

  /**
   * Format duration in human-readable format
   */
  formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Format create time
   */
  formatCreateTime(timestamp) {
    return new Date(timestamp * 1000).toISOString();
  }

  /**
   * Extract hashtags from description
   */
  extractHashtags(description) {
    if (!description) return [];
    const hashtagRegex = /#[a-zA-Z0-9_\u4e00-\u9fff]+/g;
    const matches = description.match(hashtagRegex);
    return matches ? matches.map(tag => tag.slice(1)) : [];
  }
}

// Integration with MLG platform
class MLGTikTokIntegration {
  constructor(clientKey, clientSecret, accessToken, cacheManager) {
    this.tiktok = new TikTokAPI(clientKey, clientSecret, accessToken);
    this.cache = cacheManager;
  }

  /**
   * Process TikTok content for MLG platform
   */
  async processTikTokContent(url, userId, clanId = null, accessToken = null) {
    try {
      const videoId = this.tiktok.extractVideoId(url);
      if (!videoId) {
        throw new Error('Invalid TikTok URL');
      }

      // Check cache first
      const cacheKey = `tiktok:video:${videoId}`;
      let videoData = await this.cache.get(cacheKey);

      if (!videoData) {
        // Try to get oEmbed data
        try {
          const oEmbedData = await this.tiktok.generateOEmbedHTML(url);
          
          videoData = {
            id: videoId,
            title: oEmbedData.title || 'TikTok Video',
            videoDescription: '',
            duration: 0, // oEmbed doesn't provide duration
            coverImageUrl: oEmbedData.thumbnailUrl,
            shareUrl: url,
            embedUrl: url,
            createTime: Date.now() / 1000, // Current timestamp as fallback
            viewCount: 0,
            likeCount: 0,
            commentCount: 0,
            shareCount: 0,
            authorName: oEmbedData.authorName,
            authorUrl: oEmbedData.authorUrl,
            embedHtml: oEmbedData.html
          };
        } catch (oEmbedError) {
          throw new Error('Unable to fetch TikTok video data');
        }

        // Cache for 30 minutes (TikTok content can change frequently)
        await this.cache.set(cacheKey, videoData, 1800);
      }

      // Extract hashtags from description
      const hashtags = this.tiktok.extractHashtags(videoData.videoDescription);

      // Prepare MLG content object
      const mlgContent = {
        platform: 'tiktok',
        externalId: videoId,
        title: videoData.title,
        description: videoData.videoDescription || '',
        thumbnailUrl: videoData.coverImageUrl,
        duration: videoData.duration,
        embedUrl: videoData.shareUrl,
        metadata: {
          authorName: videoData.authorName,
          authorUrl: videoData.authorUrl,
          createTime: this.tiktok.formatCreateTime(videoData.createTime),
          viewCount: videoData.viewCount,
          likeCount: videoData.likeCount,
          commentCount: videoData.commentCount,
          shareCount: videoData.shareCount,
          hashtags: hashtags,
          embedHtml: videoData.embedHtml,
          playUrl: videoData.playUrl,
          downloadUrl: videoData.downloadUrl
        },
        submittedBy: userId,
        clanId: clanId,
        createdAt: new Date(),
        status: 'active'
      };

      return mlgContent;
    } catch (error) {
      console.error('Error processing TikTok content:', error);
      throw error;
    }
  }

  /**
   * Search for gaming-related TikTok content
   */
  async searchGamingContent(options = {}) {
    try {
      const {
        hashtag = 'gaming',
        maxCount = 20,
        region = 'US'
      } = options;

      // Use Research API if available
      if (this.tiktok.accessToken) {
        const results = await this.tiktok.queryVideos('gaming', {
          hashtag: hashtag,
          maxCount: maxCount,
          region: region
        });

        return results.videos.map(video => ({
          platform: 'tiktok',
          externalId: video.id,
          title: `TikTok Video by @${video.username}`,
          description: video.videoDescription,
          thumbnailUrl: null, // Research API doesn't provide thumbnail
          createTime: this.tiktok.formatCreateTime(video.createTime),
          username: video.username,
          viewCount: video.viewCount,
          likeCount: video.likeCount,
          commentCount: video.commentCount,
          shareCount: video.shareCount,
          hashtags: video.hashtags
        }));
      }

      // Fallback to predefined gaming content or empty results
      return [];
    } catch (error) {
      console.error('Error searching TikTok gaming content:', error);
      return [];
    }
  }

  /**
   * Get user's gaming videos
   */
  async getUserGamingVideos(accessToken = null) {
    try {
      const videos = await this.tiktok.getUserVideos(accessToken, {
        maxCount: 50
      });

      // Filter for gaming-related content
      const gamingVideos = videos.videos.filter(video => {
        const description = video.videoDescription.toLowerCase();
        const title = video.title.toLowerCase();
        
        return description.includes('gaming') || 
               description.includes('game') || 
               description.includes('esports') ||
               description.includes('mlg') ||
               title.includes('gaming') ||
               title.includes('game');
      });

      return gamingVideos.map(video => ({
        platform: 'tiktok',
        externalId: video.id,
        title: video.title,
        description: video.videoDescription,
        thumbnailUrl: video.coverImageUrl,
        duration: video.duration,
        embedUrl: video.shareUrl,
        createTime: this.tiktok.formatCreateTime(video.createTime),
        viewCount: video.viewCount,
        likeCount: video.likeCount,
        commentCount: video.commentCount,
        shareCount: video.shareCount,
        hashtags: this.tiktok.extractHashtags(video.videoDescription)
      }));
    } catch (error) {
      console.error('Error fetching user gaming videos:', error);
      throw error;
    }
  }

  /**
   * Generate authentication URL for TikTok Login Kit
   */
  static generateAuthURL(clientKey, redirectUri, scope = ['user.info.basic', 'video.list'], state = null) {
    const authState = state || Math.random().toString(36).substring(2, 15);
    
    const params = new URLSearchParams({
      client_key: clientKey,
      scope: scope.join(','),
      response_type: 'code',
      redirect_uri: redirectUri,
      state: authState
    });

    return {
      url: `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`,
      state: authState
    };
  }

  /**
   * Exchange code for access token
   */
  static async exchangeCodeForToken(clientKey, clientSecret, code, redirectUri) {
    try {
      const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache'
        },
        body: new URLSearchParams({
          client_key: clientKey,
          client_secret: clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`TikTok OAuth error: ${errorData.error_description || response.status}`);
      }

      const data = await response.json();
      
      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in,
        openId: data.open_id,
        refreshToken: data.refresh_token,
        refreshExpiresIn: data.refresh_expires_in,
        scope: data.scope,
        tokenType: data.token_type
      };
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }

  /**
   * Generate embed HTML for MLG platform
   */
  async generateEmbedHTML(videoUrl, options = {}) {
    try {
      const videoId = this.tiktok.extractVideoId(videoUrl);
      const cacheKey = `tiktok:embed:${videoId}`;
      let embedData = await this.cache.get(cacheKey);

      if (!embedData) {
        embedData = await this.tiktok.generateOEmbedHTML(videoUrl, options);
        // Cache embed HTML for 1 hour
        await this.cache.set(cacheKey, embedData, 3600);
      }

      return embedData.html;
    } catch (error) {
      console.error('Error generating TikTok embed HTML:', error);
      throw error;
    }
  }
}

module.exports = { TikTokAPI, MLGTikTokIntegration };