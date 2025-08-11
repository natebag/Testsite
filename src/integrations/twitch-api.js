/**
 * Twitch API Integration
 * Handles Twitch Helix API for clips, VODs, streams, and gaming content optimization
 * Sub-task 9.6
 */

class TwitchAPI {
  constructor(clientId, clientSecret, accessToken = null) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.accessToken = accessToken;
    this.baseURL = 'https://api.twitch.tv/helix';
    this.embedBaseURL = 'https://player.twitch.tv';
    this.clipsEmbedURL = 'https://clips.twitch.tv/embed';
  }

  /**
   * Extract clip slug or video ID from Twitch URL
   */
  extractClipSlug(url) {
    const patterns = [
      /clips\.twitch\.tv\/([A-Za-z0-9_-]+)/,
      /twitch\.tv\/[^\/]+\/clip\/([A-Za-z0-9_-]+)/,
      /twitch\.tv\/clip\/([A-Za-z0-9_-]+)/
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
   * Extract video ID from Twitch URL
   */
  extractVideoId(url) {
    const patterns = [
      /twitch\.tv\/videos\/(\d+)/,
      /twitch\.tv\/[^\/]+\/v\/(\d+)/
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
   * Extract channel name from Twitch URL
   */
  extractChannelName(url) {
    const patterns = [
      /twitch\.tv\/([^\/\?]+)(?:\/|$)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && !['videos', 'clip', 'clips', 'directory'].includes(match[1])) {
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
      const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'client_credentials'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Twitch OAuth error: ${errorData.message || response.status}`);
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in,
        tokenType: data.token_type
      };
    } catch (error) {
      console.error('Error getting Twitch app access token:', error);
      throw error;
    }
  }

  /**
   * Get clip details
   */
  async getClipDetails(clipId, accessToken = null) {
    const token = accessToken || this.accessToken;
    if (!token) {
      throw new Error('Access token required for Twitch API');
    }

    try {
      const response = await fetch(
        `${this.baseURL}/clips?id=${clipId}`,
        {
          headers: {
            'Client-ID': this.clientId,
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Twitch API error: ${errorData.message || response.status}`);
      }

      const data = await response.json();
      
      if (!data.data || data.data.length === 0) {
        throw new Error('Clip not found');
      }

      const clip = data.data[0];
      
      return {
        id: clip.id,
        url: clip.url,
        embedUrl: clip.embed_url,
        broadcasterId: clip.broadcaster_id,
        broadcasterName: clip.broadcaster_name,
        creatorId: clip.creator_id,
        creatorName: clip.creator_name,
        videoId: clip.video_id,
        gameId: clip.game_id,
        language: clip.language,
        title: clip.title,
        viewCount: clip.view_count,
        createdAt: clip.created_at,
        thumbnailUrl: clip.thumbnail_url,
        duration: clip.duration,
        vodOffset: clip.vod_offset,
        isFeatured: clip.is_featured || false
      };
    } catch (error) {
      console.error('Error fetching Twitch clip details:', error);
      throw error;
    }
  }

  /**
   * Get video details (VOD)
   */
  async getVideoDetails(videoId, accessToken = null) {
    const token = accessToken || this.accessToken;
    if (!token) {
      throw new Error('Access token required for Twitch API');
    }

    try {
      const response = await fetch(
        `${this.baseURL}/videos?id=${videoId}`,
        {
          headers: {
            'Client-ID': this.clientId,
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Twitch API error: ${errorData.message || response.status}`);
      }

      const data = await response.json();
      
      if (!data.data || data.data.length === 0) {
        throw new Error('Video not found');
      }

      const video = data.data[0];
      
      return {
        id: video.id,
        streamId: video.stream_id,
        userId: video.user_id,
        userLogin: video.user_login,
        userName: video.user_name,
        title: video.title,
        description: video.description,
        createdAt: video.created_at,
        publishedAt: video.published_at,
        url: video.url,
        thumbnailUrl: video.thumbnail_url,
        viewable: video.viewable,
        viewCount: video.view_count,
        language: video.language,
        type: video.type,
        duration: video.duration,
        mutedSegments: video.muted_segments || []
      };
    } catch (error) {
      console.error('Error fetching Twitch video details:', error);
      throw error;
    }
  }

  /**
   * Get channel/user information
   */
  async getUserInfo(userId = null, login = null, accessToken = null) {
    const token = accessToken || this.accessToken;
    if (!token) {
      throw new Error('Access token required for Twitch API');
    }

    try {
      let url = `${this.baseURL}/users?`;
      if (userId) {
        url += `id=${userId}`;
      } else if (login) {
        url += `login=${login}`;
      } else {
        throw new Error('Either userId or login must be provided');
      }

      const response = await fetch(url, {
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Twitch API error: ${errorData.message || response.status}`);
      }

      const data = await response.json();
      
      if (!data.data || data.data.length === 0) {
        throw new Error('User not found');
      }

      const user = data.data[0];
      
      return {
        id: user.id,
        login: user.login,
        displayName: user.display_name,
        type: user.type,
        broadcasterType: user.broadcaster_type,
        description: user.description,
        profileImageUrl: user.profile_image_url,
        offlineImageUrl: user.offline_image_url,
        viewCount: user.view_count,
        email: user.email,
        createdAt: user.created_at
      };
    } catch (error) {
      console.error('Error fetching Twitch user info:', error);
      throw error;
    }
  }

  /**
   * Get user's clips
   */
  async getUserClips(broadcasterId, options = {}) {
    const token = this.accessToken;
    if (!token) {
      throw new Error('Access token required for Twitch API');
    }

    const {
      gameId = null,
      startedAt = null,
      endedAt = null,
      first = 20,
      after = null,
      before = null,
      isFeatured = null
    } = options;

    try {
      let url = `${this.baseURL}/clips?broadcaster_id=${broadcasterId}&first=${first}`;
      
      if (gameId) url += `&game_id=${gameId}`;
      if (startedAt) url += `&started_at=${startedAt}`;
      if (endedAt) url += `&ended_at=${endedAt}`;
      if (after) url += `&after=${after}`;
      if (before) url += `&before=${before}`;
      if (isFeatured !== null) url += `&is_featured=${isFeatured}`;

      const response = await fetch(url, {
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Twitch API error: ${errorData.message || response.status}`);
      }

      const data = await response.json();
      
      return {
        clips: data.data.map(clip => ({
          id: clip.id,
          url: clip.url,
          embedUrl: clip.embed_url,
          broadcasterId: clip.broadcaster_id,
          broadcasterName: clip.broadcaster_name,
          creatorId: clip.creator_id,
          creatorName: clip.creator_name,
          videoId: clip.video_id,
          gameId: clip.game_id,
          language: clip.language,
          title: clip.title,
          viewCount: clip.view_count,
          createdAt: clip.created_at,
          thumbnailUrl: clip.thumbnail_url,
          duration: clip.duration,
          vodOffset: clip.vod_offset,
          isFeatured: clip.is_featured || false
        })),
        pagination: data.pagination || {}
      };
    } catch (error) {
      console.error('Error fetching user clips:', error);
      throw error;
    }
  }

  /**
   * Get user's videos (VODs)
   */
  async getUserVideos(userId, options = {}) {
    const token = this.accessToken;
    if (!token) {
      throw new Error('Access token required for Twitch API');
    }

    const {
      period = 'all',
      sort = 'time',
      type = 'all',
      language = null,
      first = 20,
      after = null,
      before = null
    } = options;

    try {
      let url = `${this.baseURL}/videos?user_id=${userId}&first=${first}&period=${period}&sort=${sort}&type=${type}`;
      
      if (language) url += `&language=${language}`;
      if (after) url += `&after=${after}`;
      if (before) url += `&before=${before}`;

      const response = await fetch(url, {
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Twitch API error: ${errorData.message || response.status}`);
      }

      const data = await response.json();
      
      return {
        videos: data.data.map(video => ({
          id: video.id,
          streamId: video.stream_id,
          userId: video.user_id,
          userLogin: video.user_login,
          userName: video.user_name,
          title: video.title,
          description: video.description,
          createdAt: video.created_at,
          publishedAt: video.published_at,
          url: video.url,
          thumbnailUrl: video.thumbnail_url,
          viewable: video.viewable,
          viewCount: video.view_count,
          language: video.language,
          type: video.type,
          duration: video.duration
        })),
        pagination: data.pagination || {}
      };
    } catch (error) {
      console.error('Error fetching user videos:', error);
      throw error;
    }
  }

  /**
   * Get top clips by game
   */
  async getTopClipsByGame(gameId, options = {}) {
    const token = this.accessToken;
    if (!token) {
      throw new Error('Access token required for Twitch API');
    }

    const {
      startedAt = null,
      endedAt = null,
      first = 20,
      after = null,
      before = null,
      language = null
    } = options;

    try {
      let url = `${this.baseURL}/clips?game_id=${gameId}&first=${first}`;
      
      if (startedAt) url += `&started_at=${startedAt}`;
      if (endedAt) url += `&ended_at=${endedAt}`;
      if (after) url += `&after=${after}`;
      if (before) url += `&before=${before}`;
      if (language) url += `&language=${language}`;

      const response = await fetch(url, {
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Twitch API error: ${errorData.message || response.status}`);
      }

      const data = await response.json();
      
      return {
        clips: data.data.map(clip => ({
          id: clip.id,
          url: clip.url,
          embedUrl: clip.embed_url,
          broadcasterId: clip.broadcaster_id,
          broadcasterName: clip.broadcaster_name,
          creatorId: clip.creator_id,
          creatorName: clip.creator_name,
          videoId: clip.video_id,
          gameId: clip.game_id,
          language: clip.language,
          title: clip.title,
          viewCount: clip.view_count,
          createdAt: clip.created_at,
          thumbnailUrl: clip.thumbnail_url,
          duration: clip.duration,
          vodOffset: clip.vod_offset
        })),
        pagination: data.pagination || {}
      };
    } catch (error) {
      console.error('Error fetching top clips by game:', error);
      throw error;
    }
  }

  /**
   * Search for games
   */
  async searchGames(query, accessToken = null) {
    const token = accessToken || this.accessToken;
    if (!token) {
      throw new Error('Access token required for Twitch API');
    }

    try {
      const response = await fetch(
        `${this.baseURL}/games?name=${encodeURIComponent(query)}`,
        {
          headers: {
            'Client-ID': this.clientId,
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Twitch API error: ${errorData.message || response.status}`);
      }

      const data = await response.json();
      
      return data.data.map(game => ({
        id: game.id,
        name: game.name,
        boxArtUrl: game.box_art_url,
        igdbId: game.igdb_id
      }));
    } catch (error) {
      console.error('Error searching games:', error);
      throw error;
    }
  }

  /**
   * Get current live streams
   */
  async getLiveStreams(options = {}) {
    const token = this.accessToken;
    if (!token) {
      throw new Error('Access token required for Twitch API');
    }

    const {
      gameId = null,
      userId = null,
      userLogin = null,
      language = null,
      first = 20,
      after = null,
      before = null
    } = options;

    try {
      let url = `${this.baseURL}/streams?first=${first}`;
      
      if (gameId) url += `&game_id=${gameId}`;
      if (userId) url += `&user_id=${userId}`;
      if (userLogin) url += `&user_login=${userLogin}`;
      if (language) url += `&language=${language}`;
      if (after) url += `&after=${after}`;
      if (before) url += `&before=${before}`;

      const response = await fetch(url, {
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Twitch API error: ${errorData.message || response.status}`);
      }

      const data = await response.json();
      
      return {
        streams: data.data.map(stream => ({
          id: stream.id,
          userId: stream.user_id,
          userLogin: stream.user_login,
          userName: stream.user_name,
          gameId: stream.game_id,
          gameName: stream.game_name,
          type: stream.type,
          title: stream.title,
          viewerCount: stream.viewer_count,
          startedAt: stream.started_at,
          language: stream.language,
          thumbnailUrl: stream.thumbnail_url,
          tagIds: stream.tag_ids || [],
          tags: stream.tags || [],
          isMature: stream.is_mature || false
        })),
        pagination: data.pagination || {}
      };
    } catch (error) {
      console.error('Error fetching live streams:', error);
      throw error;
    }
  }

  /**
   * Generate clip embed HTML
   */
  generateClipEmbedHTML(clipSlug, options = {}) {
    const {
      width = 854,
      height = 480,
      autoplay = false,
      muted = false,
      preload = 'metadata',
      allowfullscreen = true
    } = options;

    const params = new URLSearchParams({
      clip: clipSlug,
      autoplay: autoplay.toString(),
      muted: muted.toString(),
      preload: preload
    });

    return `<iframe 
      src="${this.clipsEmbedURL}?${params.toString()}" 
      width="${width}" 
      height="${height}" 
      allowfullscreen="${allowfullscreen}" 
      frameborder="0">
    </iframe>`;
  }

  /**
   * Generate video embed HTML
   */
  generateVideoEmbedHTML(videoId, options = {}) {
    const {
      width = 854,
      height = 480,
      autoplay = false,
      muted = false,
      time = null,
      allowfullscreen = true
    } = options;

    const params = new URLSearchParams({
      video: videoId,
      autoplay: autoplay.toString(),
      muted: muted.toString()
    });

    if (time) {
      params.set('time', time);
    }

    return `<iframe 
      src="${this.embedBaseURL}/?${params.toString()}" 
      width="${width}" 
      height="${height}" 
      allowfullscreen="${allowfullscreen}" 
      frameborder="0">
    </iframe>`;
  }

  /**
   * Generate responsive embed HTML
   */
  generateResponsiveEmbedHTML(contentId, type = 'clip', options = {}) {
    const embedHTML = type === 'clip' 
      ? this.generateClipEmbedHTML(contentId, options)
      : this.generateVideoEmbedHTML(contentId, options);

    return `
      <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; background: #000;">
        ${embedHTML.replace(/width="\d+"/, 'width="100%"').replace(/height="\d+"/, 'height="100%"').replace('<iframe', '<iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"')}
      </div>
    `;
  }

  /**
   * Validate Twitch URL
   */
  isValidTwitchURL(url) {
    return this.extractClipSlug(url) !== null || 
           this.extractVideoId(url) !== null || 
           this.extractChannelName(url) !== null;
  }

  /**
   * Parse duration string to seconds
   */
  parseDuration(duration) {
    if (typeof duration === 'number') return duration;
    
    const parts = duration.match(/(\d+h)?(\d+m)?(\d+s)?/);
    if (!parts) return 0;

    const hours = parseInt(parts[1]) || 0;
    const minutes = parseInt(parts[2]) || 0;
    const seconds = parseInt(parts[3]) || 0;

    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Format duration in human-readable format
   */
  formatDuration(duration) {
    const totalSeconds = this.parseDuration(duration);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get thumbnail URL with custom dimensions
   */
  getThumbnailUrl(templateUrl, width = 480, height = 272) {
    return templateUrl
      .replace('{width}', width.toString())
      .replace('{height}', height.toString());
  }
}

// Integration with MLG platform
class MLGTwitchIntegration {
  constructor(clientId, clientSecret, accessToken, cacheManager) {
    this.twitch = new TwitchAPI(clientId, clientSecret, accessToken);
    this.cache = cacheManager;
  }

  /**
   * Process Twitch content for MLG platform
   */
  async processTwitchContent(url, userId, clanId = null, accessToken = null) {
    try {
      const clipSlug = this.twitch.extractClipSlug(url);
      const videoId = this.twitch.extractVideoId(url);

      let contentData;
      let contentType;

      if (clipSlug) {
        // Process clip
        const cacheKey = `twitch:clip:${clipSlug}`;
        contentData = await this.cache.get(cacheKey);

        if (!contentData) {
          contentData = await this.twitch.getClipDetails(clipSlug, accessToken);
          contentType = 'clip';
          // Cache for 1 hour
          await this.cache.set(cacheKey, contentData, 3600);
        }
      } else if (videoId) {
        // Process video/VOD
        const cacheKey = `twitch:video:${videoId}`;
        contentData = await this.cache.get(cacheKey);

        if (!contentData) {
          contentData = await this.twitch.getVideoDetails(videoId, accessToken);
          contentType = 'video';
          // Cache for 1 hour
          await this.cache.set(cacheKey, contentData, 3600);
        }
      } else {
        throw new Error('Invalid Twitch URL - not a clip or video');
      }

      // Prepare MLG content object
      const mlgContent = {
        platform: 'twitch',
        externalId: contentData.id,
        title: contentData.title,
        description: contentData.description || '',
        thumbnailUrl: contentType === 'clip' 
          ? contentData.thumbnailUrl 
          : this.twitch.getThumbnailUrl(contentData.thumbnailUrl, 480, 272),
        duration: this.twitch.parseDuration(contentData.duration),
        embedUrl: contentType === 'clip' ? contentData.embedUrl : contentData.url,
        metadata: {
          type: contentType,
          broadcasterName: contentData.broadcasterName || contentData.userName,
          broadcasterId: contentData.broadcasterId || contentData.userId,
          createdAt: contentData.createdAt,
          viewCount: contentData.viewCount,
          language: contentData.language,
          gameId: contentData.gameId,
          ...(contentType === 'clip' && {
            creatorName: contentData.creatorName,
            creatorId: contentData.creatorId,
            vodOffset: contentData.vodOffset,
            isFeatured: contentData.isFeatured
          }),
          ...(contentType === 'video' && {
            publishedAt: contentData.publishedAt,
            viewable: contentData.viewable,
            type: contentData.type,
            streamId: contentData.streamId
          })
        },
        submittedBy: userId,
        clanId: clanId,
        createdAt: new Date(),
        status: 'active'
      };

      return mlgContent;
    } catch (error) {
      console.error('Error processing Twitch content:', error);
      throw error;
    }
  }

  /**
   * Get gaming clips and highlights
   */
  async getGamingContent(gameNames = [], options = {}) {
    try {
      const results = [];

      for (const gameName of gameNames) {
        // Search for the game first
        const games = await this.twitch.searchGames(gameName);
        
        if (games.length === 0) continue;

        const game = games[0];
        
        // Get top clips for the game
        const clipsData = await this.twitch.getTopClipsByGame(game.id, {
          first: options.clipsPerGame || 10,
          startedAt: options.startedAt,
          endedAt: options.endedAt
        });

        const processedClips = clipsData.clips.map(clip => ({
          platform: 'twitch',
          type: 'clip',
          externalId: clip.id,
          title: clip.title,
          thumbnailUrl: clip.thumbnailUrl,
          duration: this.twitch.parseDuration(clip.duration),
          embedUrl: clip.embedUrl,
          broadcasterName: clip.broadcasterName,
          createdAt: clip.createdAt,
          viewCount: clip.viewCount,
          gameName: gameName,
          gameId: game.id
        }));

        results.push(...processedClips);
      }

      return results;
    } catch (error) {
      console.error('Error fetching gaming content:', error);
      throw error;
    }
  }

  /**
   * Get popular gaming streams
   */
  async getPopularGamingStreams(gameIds = [], options = {}) {
    try {
      const results = [];

      if (gameIds.length === 0) {
        // Get all popular streams
        const streamsData = await this.twitch.getLiveStreams({
          first: options.maxStreams || 20
        });
        
        results.push(...streamsData.streams);
      } else {
        // Get streams for specific games
        for (const gameId of gameIds) {
          const streamsData = await this.twitch.getLiveStreams({
            gameId: gameId,
            first: options.streamsPerGame || 5
          });
          
          results.push(...streamsData.streams);
        }
      }

      return results.map(stream => ({
        platform: 'twitch',
        type: 'stream',
        externalId: stream.id,
        title: stream.title,
        thumbnailUrl: this.twitch.getThumbnailUrl(stream.thumbnailUrl, 480, 272),
        streamerName: stream.userName,
        streamerId: stream.userId,
        gameName: stream.gameName,
        gameId: stream.gameId,
        viewerCount: stream.viewerCount,
        startedAt: stream.startedAt,
        language: stream.language,
        tags: stream.tags,
        isLive: true
      }));
    } catch (error) {
      console.error('Error fetching popular gaming streams:', error);
      throw error;
    }
  }

  /**
   * Generate authentication URL for Twitch OAuth
   */
  static generateAuthURL(clientId, redirectUri, scope = ['user:read:email', 'clips:edit'], state = null) {
    const authState = state || Math.random().toString(36).substring(2, 15);
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scope.join(' '),
      state: authState
    });

    return {
      url: `https://id.twitch.tv/oauth2/authorize?${params.toString()}`,
      state: authState
    };
  }

  /**
   * Exchange code for access token
   */
  static async exchangeCodeForToken(clientId, clientSecret, code, redirectUri) {
    try {
      const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Twitch OAuth error: ${errorData.message || response.status}`);
      }

      const data = await response.json();
      
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        scope: data.scope,
        tokenType: data.token_type
      };
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }
}

module.exports = { TwitchAPI, MLGTwitchIntegration };