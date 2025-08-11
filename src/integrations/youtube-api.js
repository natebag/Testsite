/**
 * YouTube API Integration
 * Handles video embedding, metadata extraction, and channel integration
 * Sub-task 9.1
 */

class YouTubeAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://www.googleapis.com/youtube/v3';
    this.embedBaseURL = 'https://www.youtube.com/embed';
  }

  /**
   * Extract video ID from YouTube URL
   */
  extractVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/
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
   * Extract channel ID from YouTube URL
   */
  extractChannelId(url) {
    const patterns = [
      /youtube\.com\/channel\/([^\/\?&]+)/,
      /youtube\.com\/c\/([^\/\?&]+)/,
      /youtube\.com\/@([^\/\?&]+)/,
      /youtube\.com\/user\/([^\/\?&]+)/
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
   * Get video metadata from YouTube API
   */
  async getVideoMetadata(videoId) {
    try {
      const response = await fetch(
        `${this.baseURL}/videos?id=${videoId}&part=snippet,statistics,contentDetails,status&key=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        throw new Error('Video not found');
      }

      const video = data.items[0];
      
      return {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        channelId: video.snippet.channelId,
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        thumbnails: video.snippet.thumbnails,
        duration: this.parseDuration(video.contentDetails.duration),
        viewCount: parseInt(video.statistics.viewCount || 0),
        likeCount: parseInt(video.statistics.likeCount || 0),
        commentCount: parseInt(video.statistics.commentCount || 0),
        tags: video.snippet.tags || [],
        categoryId: video.snippet.categoryId,
        defaultLanguage: video.snippet.defaultLanguage,
        embeddable: video.status.embeddable,
        publicStatsViewable: video.status.publicStatsViewable,
        madeForKids: video.status.madeForKids,
        privacyStatus: video.status.privacyStatus
      };
    } catch (error) {
      console.error('Error fetching YouTube video metadata:', error);
      throw error;
    }
  }

  /**
   * Get channel information
   */
  async getChannelInfo(channelId) {
    try {
      const response = await fetch(
        `${this.baseURL}/channels?id=${channelId}&part=snippet,statistics,contentDetails&key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        throw new Error('Channel not found');
      }

      const channel = data.items[0];
      
      return {
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        customUrl: channel.snippet.customUrl,
        publishedAt: channel.snippet.publishedAt,
        thumbnails: channel.snippet.thumbnails,
        country: channel.snippet.country,
        viewCount: parseInt(channel.statistics.viewCount || 0),
        subscriberCount: parseInt(channel.statistics.subscriberCount || 0),
        videoCount: parseInt(channel.statistics.videoCount || 0),
        uploadsPlaylistId: channel.contentDetails.relatedPlaylists?.uploads
      };
    } catch (error) {
      console.error('Error fetching YouTube channel info:', error);
      throw error;
    }
  }

  /**
   * Get channel videos
   */
  async getChannelVideos(channelId, options = {}) {
    const {
      maxResults = 25,
      order = 'date',
      publishedAfter = null,
      publishedBefore = null,
      pageToken = null
    } = options;

    try {
      let url = `${this.baseURL}/search?channelId=${channelId}&part=snippet&type=video&order=${order}&maxResults=${maxResults}&key=${this.apiKey}`;
      
      if (publishedAfter) {
        url += `&publishedAfter=${publishedAfter}`;
      }
      if (publishedBefore) {
        url += `&publishedBefore=${publishedBefore}`;
      }
      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        videos: data.items.map(item => ({
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          publishedAt: item.snippet.publishedAt,
          thumbnails: item.snippet.thumbnails,
          channelTitle: item.snippet.channelTitle
        })),
        nextPageToken: data.nextPageToken,
        prevPageToken: data.prevPageToken,
        totalResults: data.pageInfo.totalResults
      };
    } catch (error) {
      console.error('Error fetching channel videos:', error);
      throw error;
    }
  }

  /**
   * Search videos
   */
  async searchVideos(query, options = {}) {
    const {
      maxResults = 25,
      order = 'relevance',
      publishedAfter = null,
      publishedBefore = null,
      videoDuration = null, // short, medium, long
      videoDefinition = null, // high, standard
      pageToken = null,
      regionCode = null,
      relevanceLanguage = null
    } = options;

    try {
      let url = `${this.baseURL}/search?q=${encodeURIComponent(query)}&part=snippet&type=video&order=${order}&maxResults=${maxResults}&key=${this.apiKey}`;
      
      if (publishedAfter) url += `&publishedAfter=${publishedAfter}`;
      if (publishedBefore) url += `&publishedBefore=${publishedBefore}`;
      if (videoDuration) url += `&videoDuration=${videoDuration}`;
      if (videoDefinition) url += `&videoDefinition=${videoDefinition}`;
      if (pageToken) url += `&pageToken=${pageToken}`;
      if (regionCode) url += `&regionCode=${regionCode}`;
      if (relevanceLanguage) url += `&relevanceLanguage=${relevanceLanguage}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        videos: data.items.map(item => ({
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          publishedAt: item.snippet.publishedAt,
          thumbnails: item.snippet.thumbnails,
          channelId: item.snippet.channelId,
          channelTitle: item.snippet.channelTitle
        })),
        nextPageToken: data.nextPageToken,
        prevPageToken: data.prevPageToken,
        totalResults: data.pageInfo.totalResults
      };
    } catch (error) {
      console.error('Error searching YouTube videos:', error);
      throw error;
    }
  }

  /**
   * Generate embed HTML
   */
  generateEmbedHTML(videoId, options = {}) {
    const {
      width = 560,
      height = 315,
      autoplay = false,
      mute = false,
      controls = true,
      modestbranding = false,
      rel = false,
      start = null,
      end = null,
      loop = false,
      playlist = null
    } = options;

    let embedUrl = `${this.embedBaseURL}/${videoId}?`;
    const params = [];

    if (autoplay) params.push('autoplay=1');
    if (mute) params.push('mute=1');
    if (!controls) params.push('controls=0');
    if (modestbranding) params.push('modestbranding=1');
    if (!rel) params.push('rel=0');
    if (start) params.push(`start=${start}`);
    if (end) params.push(`end=${end}`);
    if (loop) {
      params.push('loop=1');
      if (!playlist) params.push(`playlist=${videoId}`);
    }
    if (playlist) params.push(`playlist=${playlist}`);

    embedUrl += params.join('&');

    return `<iframe 
      width="${width}" 
      height="${height}" 
      src="${embedUrl}" 
      title="YouTube video player" 
      frameborder="0" 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
      allowfullscreen>
    </iframe>`;
  }

  /**
   * Generate responsive embed HTML
   */
  generateResponsiveEmbedHTML(videoId, options = {}) {
    const embedHTML = this.generateEmbedHTML(videoId, options);
    
    return `
      <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; background: #000;">
        <iframe 
          src="${this.embedBaseURL}/${videoId}${this.buildEmbedParams(options)}"
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen>
        </iframe>
      </div>
    `;
  }

  /**
   * Build embed parameters
   */
  buildEmbedParams(options = {}) {
    const {
      autoplay = false,
      mute = false,
      controls = true,
      modestbranding = false,
      rel = false,
      start = null,
      end = null,
      loop = false,
      playlist = null
    } = options;

    const params = [];
    
    if (autoplay) params.push('autoplay=1');
    if (mute) params.push('mute=1');
    if (!controls) params.push('controls=0');
    if (modestbranding) params.push('modestbranding=1');
    if (!rel) params.push('rel=0');
    if (start) params.push(`start=${start}`);
    if (end) params.push(`end=${end}`);
    if (loop) params.push('loop=1');
    if (playlist) params.push(`playlist=${playlist}`);

    return params.length > 0 ? '?' + params.join('&') : '';
  }

  /**
   * Parse ISO 8601 duration to seconds
   */
  parseDuration(duration) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);

    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Format duration in human-readable format
   */
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Get video categories
   */
  async getVideoCategories(regionCode = 'US') {
    try {
      const response = await fetch(
        `${this.baseURL}/videoCategories?part=snippet&regionCode=${regionCode}&key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.items.map(item => ({
        id: item.id,
        title: item.snippet.title,
        assignable: item.snippet.assignable
      }));
    } catch (error) {
      console.error('Error fetching YouTube categories:', error);
      throw error;
    }
  }

  /**
   * Get trending videos
   */
  async getTrendingVideos(options = {}) {
    const {
      regionCode = 'US',
      categoryId = null,
      maxResults = 25,
      pageToken = null
    } = options;

    try {
      let url = `${this.baseURL}/videos?part=snippet,statistics&chart=mostPopular&regionCode=${regionCode}&maxResults=${maxResults}&key=${this.apiKey}`;
      
      if (categoryId) url += `&videoCategoryId=${categoryId}`;
      if (pageToken) url += `&pageToken=${pageToken}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        videos: data.items.map(item => ({
          id: item.id,
          title: item.snippet.title,
          description: item.snippet.description,
          publishedAt: item.snippet.publishedAt,
          thumbnails: item.snippet.thumbnails,
          channelId: item.snippet.channelId,
          channelTitle: item.snippet.channelTitle,
          viewCount: parseInt(item.statistics.viewCount || 0),
          likeCount: parseInt(item.statistics.likeCount || 0),
          commentCount: parseInt(item.statistics.commentCount || 0)
        })),
        nextPageToken: data.nextPageToken,
        prevPageToken: data.prevPageToken
      };
    } catch (error) {
      console.error('Error fetching trending videos:', error);
      throw error;
    }
  }

  /**
   * Validate video URL
   */
  isValidYouTubeURL(url) {
    return this.extractVideoId(url) !== null;
  }

  /**
   * Get thumbnail URLs
   */
  getThumbnailUrls(videoId) {
    return {
      default: `https://img.youtube.com/vi/${videoId}/default.jpg`,
      medium: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      high: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      standard: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
      maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    };
  }
}

// Export for use in other modules
module.exports = YouTubeAPI;

// Example usage and integration with MLG platform
class MLGYouTubeIntegration {
  constructor(apiKey, cacheManager) {
    this.youtube = new YouTubeAPI(apiKey);
    this.cache = cacheManager;
  }

  /**
   * Process YouTube content for MLG platform
   */
  async processYouTubeContent(url, userId, clanId = null) {
    try {
      const videoId = this.youtube.extractVideoId(url);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      // Check cache first
      const cacheKey = `youtube:metadata:${videoId}`;
      let metadata = await this.cache.get(cacheKey);

      if (!metadata) {
        metadata = await this.youtube.getVideoMetadata(videoId);
        // Cache for 1 hour
        await this.cache.set(cacheKey, metadata, 3600);
      }

      // Prepare MLG content object
      const mlgContent = {
        platform: 'youtube',
        externalId: videoId,
        title: metadata.title,
        description: metadata.description,
        thumbnailUrl: metadata.thumbnails.high?.url || metadata.thumbnails.medium?.url,
        duration: metadata.duration,
        embedUrl: `${this.youtube.embedBaseURL}/${videoId}`,
        metadata: {
          channelTitle: metadata.channelTitle,
          publishedAt: metadata.publishedAt,
          viewCount: metadata.viewCount,
          likeCount: metadata.likeCount,
          commentCount: metadata.commentCount,
          tags: metadata.tags,
          embeddable: metadata.embeddable
        },
        submittedBy: userId,
        clanId: clanId,
        createdAt: new Date(),
        status: metadata.embeddable ? 'active' : 'restricted'
      };

      return mlgContent;
    } catch (error) {
      console.error('Error processing YouTube content:', error);
      throw error;
    }
  }

  /**
   * Get gaming-related content from YouTube
   */
  async searchGamingContent(query, options = {}) {
    try {
      const searchOptions = {
        ...options,
        videoCategoryId: '20', // Gaming category
        order: 'relevance'
      };

      const results = await this.youtube.searchVideos(query, searchOptions);
      
      return results.videos.map(video => ({
        platform: 'youtube',
        externalId: video.id,
        title: video.title,
        description: video.description,
        thumbnailUrl: video.thumbnails.high?.url || video.thumbnails.medium?.url,
        channelTitle: video.channelTitle,
        publishedAt: video.publishedAt
      }));
    } catch (error) {
      console.error('Error searching gaming content:', error);
      throw error;
    }
  }
}

module.exports = { YouTubeAPI, MLGYouTubeIntegration };