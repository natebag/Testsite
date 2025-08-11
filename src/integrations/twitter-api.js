/**
 * X/Twitter API Integration
 * Handles Twitter API v2 for video content, tweet embedding, and media extraction
 * Sub-task 9.4
 */

class TwitterAPI {
  constructor(bearerToken, apiKey = null, apiSecret = null, accessToken = null, accessTokenSecret = null) {
    this.bearerToken = bearerToken;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.accessToken = accessToken;
    this.accessTokenSecret = accessTokenSecret;
    this.baseURL = 'https://api.twitter.com/2';
    this.embedBaseURL = 'https://platform.twitter.com/embed';
    this.oEmbedURL = 'https://publish.twitter.com/oembed';
  }

  /**
   * Extract tweet ID from Twitter/X URL
   */
  extractTweetId(url) {
    const patterns = [
      /twitter\.com\/[^\/]+\/status\/(\d+)/,
      /x\.com\/[^\/]+\/status\/(\d+)/,
      /mobile\.twitter\.com\/[^\/]+\/status\/(\d+)/,
      /t\.co\/.*\/(\d+)/
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
   * Extract username from Twitter/X URL
   */
  extractUsername(url) {
    const patterns = [
      /twitter\.com\/([^\/\?]+)/,
      /x\.com\/([^\/\?]+)/,
      /mobile\.twitter\.com\/([^\/\?]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && !['status', 'home', 'search', 'notifications'].includes(match[1])) {
        return match[1];
      }
    }
    return null;
  }

  /**
   * Get tweet by ID with media information
   */
  async getTweetById(tweetId, options = {}) {
    const {
      expansions = ['attachments.media_keys', 'author_id', 'referenced_tweets.id'],
      tweetFields = ['created_at', 'public_metrics', 'context_annotations', 'entities', 'attachments'],
      mediaFields = ['type', 'url', 'preview_image_url', 'duration_ms', 'height', 'width', 'variants'],
      userFields = ['username', 'name', 'profile_image_url', 'verified']
    } = options;

    try {
      let url = `${this.baseURL}/tweets/${tweetId}?`;
      const params = new URLSearchParams({
        'tweet.fields': tweetFields.join(','),
        'expansions': expansions.join(','),
        'media.fields': mediaFields.join(','),
        'user.fields': userFields.join(',')
      });

      url += params.toString();

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Twitter API error: ${errorData.errors?.[0]?.message || response.status}`);
      }

      const data = await response.json();
      
      // Process the response
      const tweet = data.data;
      const includes = data.includes || {};
      const users = includes.users || [];
      const media = includes.media || [];

      // Find author
      const author = users.find(user => user.id === tweet.author_id);

      // Process media attachments
      const processedMedia = [];
      if (tweet.attachments?.media_keys) {
        for (const mediaKey of tweet.attachments.media_keys) {
          const mediaItem = media.find(m => m.media_key === mediaKey);
          if (mediaItem) {
            processedMedia.push({
              key: mediaItem.media_key,
              type: mediaItem.type,
              url: mediaItem.url,
              previewImageUrl: mediaItem.preview_image_url,
              duration: mediaItem.duration_ms,
              height: mediaItem.height,
              width: mediaItem.width,
              variants: mediaItem.variants || [],
              isVideo: mediaItem.type === 'video' || mediaItem.type === 'animated_gif'
            });
          }
        }
      }

      return {
        id: tweet.id,
        text: tweet.text,
        createdAt: tweet.created_at,
        authorId: tweet.author_id,
        author: author ? {
          id: author.id,
          username: author.username,
          name: author.name,
          profileImageUrl: author.profile_image_url,
          verified: author.verified || false
        } : null,
        publicMetrics: {
          retweetCount: tweet.public_metrics?.retweet_count || 0,
          likeCount: tweet.public_metrics?.like_count || 0,
          replyCount: tweet.public_metrics?.reply_count || 0,
          quoteCount: tweet.public_metrics?.quote_count || 0
        },
        entities: tweet.entities || {},
        contextAnnotations: tweet.context_annotations || [],
        media: processedMedia,
        hasVideo: processedMedia.some(m => m.isVideo),
        hasImage: processedMedia.some(m => m.type === 'photo'),
        referencedTweets: tweet.referenced_tweets || []
      };
    } catch (error) {
      console.error('Error fetching tweet:', error);
      throw error;
    }
  }

  /**
   * Get user tweets
   */
  async getUserTweets(userId, options = {}) {
    const {
      maxResults = 10,
      exclude = ['retweets', 'replies'],
      paginationToken = null,
      expansions = ['attachments.media_keys', 'author_id'],
      tweetFields = ['created_at', 'public_metrics', 'entities', 'attachments'],
      mediaFields = ['type', 'url', 'preview_image_url', 'duration_ms', 'height', 'width']
    } = options;

    try {
      let url = `${this.baseURL}/users/${userId}/tweets?`;
      const params = new URLSearchParams({
        'max_results': maxResults.toString(),
        'exclude': exclude.join(','),
        'tweet.fields': tweetFields.join(','),
        'expansions': expansions.join(','),
        'media.fields': mediaFields.join(',')
      });

      if (paginationToken) {
        params.set('pagination_token', paginationToken);
      }

      url += params.toString();

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Twitter API error: ${errorData.errors?.[0]?.message || response.status}`);
      }

      const data = await response.json();
      
      const tweets = data.data || [];
      const media = data.includes?.media || [];

      const processedTweets = tweets.map(tweet => {
        const tweetMedia = [];
        if (tweet.attachments?.media_keys) {
          for (const mediaKey of tweet.attachments.media_keys) {
            const mediaItem = media.find(m => m.media_key === mediaKey);
            if (mediaItem) {
              tweetMedia.push({
                key: mediaItem.media_key,
                type: mediaItem.type,
                url: mediaItem.url,
                previewImageUrl: mediaItem.preview_image_url,
                duration: mediaItem.duration_ms,
                height: mediaItem.height,
                width: mediaItem.width,
                isVideo: mediaItem.type === 'video' || mediaItem.type === 'animated_gif'
              });
            }
          }
        }

        return {
          id: tweet.id,
          text: tweet.text,
          createdAt: tweet.created_at,
          publicMetrics: tweet.public_metrics || {},
          entities: tweet.entities || {},
          media: tweetMedia,
          hasVideo: tweetMedia.some(m => m.isVideo),
          hasImage: tweetMedia.some(m => m.type === 'photo')
        };
      });

      return {
        tweets: processedTweets,
        meta: data.meta || {},
        nextToken: data.meta?.next_token
      };
    } catch (error) {
      console.error('Error fetching user tweets:', error);
      throw error;
    }
  }

  /**
   * Search tweets with video content
   */
  async searchTweets(query, options = {}) {
    const {
      maxResults = 10,
      nextToken = null,
      expansions = ['attachments.media_keys', 'author_id'],
      tweetFields = ['created_at', 'public_metrics', 'entities', 'attachments', 'context_annotations'],
      mediaFields = ['type', 'url', 'preview_image_url', 'duration_ms', 'height', 'width', 'variants'],
      userFields = ['username', 'name', 'profile_image_url', 'verified']
    } = options;

    try {
      let url = `${this.baseURL}/tweets/search/recent?`;
      const params = new URLSearchParams({
        'query': query,
        'max_results': maxResults.toString(),
        'tweet.fields': tweetFields.join(','),
        'expansions': expansions.join(','),
        'media.fields': mediaFields.join(','),
        'user.fields': userFields.join(',')
      });

      if (nextToken) {
        params.set('next_token', nextToken);
      }

      url += params.toString();

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Twitter API error: ${errorData.errors?.[0]?.message || response.status}`);
      }

      const data = await response.json();
      
      const tweets = data.data || [];
      const users = data.includes?.users || [];
      const media = data.includes?.media || [];

      const processedTweets = tweets.map(tweet => {
        const author = users.find(user => user.id === tweet.author_id);
        
        const tweetMedia = [];
        if (tweet.attachments?.media_keys) {
          for (const mediaKey of tweet.attachments.media_keys) {
            const mediaItem = media.find(m => m.media_key === mediaKey);
            if (mediaItem) {
              tweetMedia.push({
                key: mediaItem.media_key,
                type: mediaItem.type,
                url: mediaItem.url,
                previewImageUrl: mediaItem.preview_image_url,
                duration: mediaItem.duration_ms,
                height: mediaItem.height,
                width: mediaItem.width,
                variants: mediaItem.variants || [],
                isVideo: mediaItem.type === 'video' || mediaItem.type === 'animated_gif'
              });
            }
          }
        }

        return {
          id: tweet.id,
          text: tweet.text,
          createdAt: tweet.created_at,
          authorId: tweet.author_id,
          author: author ? {
            id: author.id,
            username: author.username,
            name: author.name,
            profileImageUrl: author.profile_image_url,
            verified: author.verified || false
          } : null,
          publicMetrics: tweet.public_metrics || {},
          entities: tweet.entities || {},
          contextAnnotations: tweet.context_annotations || [],
          media: tweetMedia,
          hasVideo: tweetMedia.some(m => m.isVideo),
          hasImage: tweetMedia.some(m => m.type === 'photo')
        };
      });

      return {
        tweets: processedTweets,
        meta: data.meta || {},
        nextToken: data.meta?.next_token
      };
    } catch (error) {
      console.error('Error searching tweets:', error);
      throw error;
    }
  }

  /**
   * Get user information
   */
  async getUserByUsername(username) {
    try {
      const userFields = [
        'id', 'name', 'username', 'profile_image_url', 'description',
        'public_metrics', 'verified', 'created_at'
      ];

      const response = await fetch(
        `${this.baseURL}/users/by/username/${username}?user.fields=${userFields.join(',')}`,
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Twitter API error: ${errorData.errors?.[0]?.message || response.status}`);
      }

      const data = await response.json();
      const user = data.data;
      
      return {
        id: user.id,
        name: user.name,
        username: user.username,
        profileImageUrl: user.profile_image_url,
        description: user.description || '',
        verified: user.verified || false,
        createdAt: user.created_at,
        publicMetrics: {
          followersCount: user.public_metrics?.followers_count || 0,
          followingCount: user.public_metrics?.following_count || 0,
          tweetCount: user.public_metrics?.tweet_count || 0,
          listedCount: user.public_metrics?.listed_count || 0
        }
      };
    } catch (error) {
      console.error('Error fetching user by username:', error);
      throw error;
    }
  }

  /**
   * Generate oEmbed HTML for tweet
   */
  async generateOEmbedHTML(tweetUrl, options = {}) {
    const {
      maxwidth = null,
      hideMedia = false,
      hideThread = false,
      omitScript = false,
      align = 'none',
      related = null,
      lang = 'en',
      theme = 'light',
      linkColor = null,
      widgetType = null
    } = options;

    try {
      const params = new URLSearchParams({
        url: tweetUrl,
        align: align,
        lang: lang,
        theme: theme
      });

      if (maxwidth) params.set('maxwidth', maxwidth.toString());
      if (hideMedia) params.set('hide_media', 'true');
      if (hideThread) params.set('hide_thread', 'true');
      if (omitScript) params.set('omit_script', 'true');
      if (related) params.set('related', related);
      if (linkColor) params.set('link_color', linkColor);
      if (widgetType) params.set('widget_type', widgetType);

      const response = await fetch(`${this.oEmbedURL}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Twitter oEmbed API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        html: data.html,
        width: data.width,
        height: data.height,
        type: data.type,
        version: data.version,
        authorName: data.author_name,
        authorUrl: data.author_url,
        providerName: data.provider_name,
        providerUrl: data.provider_url,
        cacheAge: data.cache_age,
        url: data.url
      };
    } catch (error) {
      console.error('Error generating Twitter oEmbed:', error);
      throw error;
    }
  }

  /**
   * Generate responsive embed HTML
   */
  async generateResponsiveEmbedHTML(tweetUrl, options = {}) {
    try {
      const oEmbedData = await this.generateOEmbedHTML(tweetUrl, options);
      
      return `
        <div style="max-width: 100%; margin: 0 auto;">
          ${oEmbedData.html}
        </div>
      `;
    } catch (error) {
      console.error('Error generating responsive embed:', error);
      throw error;
    }
  }

  /**
   * Extract hashtags from tweet text
   */
  extractHashtags(text, entities = null) {
    if (entities && entities.hashtags) {
      return entities.hashtags.map(hashtag => hashtag.tag);
    }

    const hashtagRegex = /#[a-zA-Z0-9_]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.slice(1)) : [];
  }

  /**
   * Extract mentions from tweet text
   */
  extractMentions(text, entities = null) {
    if (entities && entities.mentions) {
      return entities.mentions.map(mention => mention.username);
    }

    const mentionRegex = /@[a-zA-Z0-9_]+/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(mention => mention.slice(1)) : [];
  }

  /**
   * Extract URLs from tweet text
   */
  extractUrls(entities = null) {
    if (entities && entities.urls) {
      return entities.urls.map(url => ({
        url: url.url,
        expandedUrl: url.expanded_url,
        displayUrl: url.display_url,
        unwoundUrl: url.unwound_url
      }));
    }
    return [];
  }

  /**
   * Validate Twitter/X URL
   */
  isValidTwitterURL(url) {
    return this.extractTweetId(url) !== null;
  }

  /**
   * Format tweet creation date
   */
  formatCreatedAt(createdAt) {
    return new Date(createdAt).toISOString();
  }

  /**
   * Get best video variant (highest bitrate)
   */
  getBestVideoVariant(variants) {
    if (!variants || variants.length === 0) return null;
    
    const videoVariants = variants.filter(v => v.content_type === 'video/mp4');
    if (videoVariants.length === 0) return variants[0];
    
    return videoVariants.reduce((best, current) => {
      return (current.bit_rate || 0) > (best.bit_rate || 0) ? current : best;
    });
  }
}

// Integration with MLG platform
class MLGTwitterIntegration {
  constructor(bearerToken, apiKey, apiSecret, cacheManager) {
    this.twitter = new TwitterAPI(bearerToken, apiKey, apiSecret);
    this.cache = cacheManager;
  }

  /**
   * Process Twitter content for MLG platform
   */
  async processTwitterContent(url, userId, clanId = null) {
    try {
      const tweetId = this.twitter.extractTweetId(url);
      if (!tweetId) {
        throw new Error('Invalid Twitter URL');
      }

      // Check cache first
      const cacheKey = `twitter:tweet:${tweetId}`;
      let tweetData = await this.cache.get(cacheKey);

      if (!tweetData) {
        tweetData = await this.twitter.getTweetById(tweetId);
        // Cache for 10 minutes (Twitter content can change quickly)
        await this.cache.set(cacheKey, tweetData, 600);
      }

      // Extract relevant information
      const hashtags = this.twitter.extractHashtags(tweetData.text, tweetData.entities);
      const mentions = this.twitter.extractMentions(tweetData.text, tweetData.entities);
      const urls = this.twitter.extractUrls(tweetData.entities);

      // Get primary video if available
      const primaryVideo = tweetData.media.find(m => m.isVideo);
      const primaryImage = tweetData.media.find(m => m.type === 'photo');

      // Prepare MLG content object
      const mlgContent = {
        platform: 'twitter',
        externalId: tweetId,
        title: tweetData.text.length > 100 ? tweetData.text.substring(0, 100) + '...' : tweetData.text,
        description: tweetData.text,
        thumbnailUrl: primaryVideo?.previewImageUrl || primaryImage?.url || tweetData.author?.profileImageUrl,
        duration: primaryVideo?.duration || 0,
        embedUrl: url,
        metadata: {
          authorUsername: tweetData.author?.username,
          authorName: tweetData.author?.name,
          authorVerified: tweetData.author?.verified,
          createdAt: tweetData.createdAt,
          publicMetrics: tweetData.publicMetrics,
          hashtags: hashtags,
          mentions: mentions,
          urls: urls,
          hasVideo: tweetData.hasVideo,
          hasImage: tweetData.hasImage,
          media: tweetData.media,
          contextAnnotations: tweetData.contextAnnotations
        },
        submittedBy: userId,
        clanId: clanId,
        createdAt: new Date(),
        status: 'active'
      };

      return mlgContent;
    } catch (error) {
      console.error('Error processing Twitter content:', error);
      throw error;
    }
  }

  /**
   * Search for gaming-related tweets
   */
  async searchGamingContent(query = 'gaming', options = {}) {
    try {
      const gamingQuery = `${query} (has:videos OR has:images) -is:retweet lang:en`;
      const results = await this.twitter.searchTweets(gamingQuery, {
        maxResults: options.maxResults || 20,
        nextToken: options.nextToken
      });

      return results.tweets
        .filter(tweet => tweet.hasVideo || tweet.hasImage)
        .map(tweet => ({
          platform: 'twitter',
          externalId: tweet.id,
          title: tweet.text.length > 100 ? tweet.text.substring(0, 100) + '...' : tweet.text,
          description: tweet.text,
          thumbnailUrl: tweet.media.find(m => m.isVideo)?.previewImageUrl || 
                       tweet.media.find(m => m.type === 'photo')?.url ||
                       tweet.author?.profileImageUrl,
          authorUsername: tweet.author?.username,
          authorName: tweet.author?.name,
          createdAt: tweet.createdAt,
          publicMetrics: tweet.publicMetrics,
          hasVideo: tweet.hasVideo,
          hasImage: tweet.hasImage,
          hashtags: this.twitter.extractHashtags(tweet.text, tweet.entities)
        }));
    } catch (error) {
      console.error('Error searching gaming content:', error);
      throw error;
    }
  }

  /**
   * Get user's gaming tweets
   */
  async getUserGamingTweets(username, options = {}) {
    try {
      const user = await this.twitter.getUserByUsername(username);
      const userTweets = await this.twitter.getUserTweets(user.id, {
        maxResults: options.maxResults || 20,
        paginationToken: options.paginationToken
      });

      // Filter for gaming-related content
      const gamingTweets = userTweets.tweets.filter(tweet => {
        const text = tweet.text.toLowerCase();
        const hashtags = this.twitter.extractHashtags(tweet.text, tweet.entities)
          .map(tag => tag.toLowerCase());
        
        return text.includes('gaming') || 
               text.includes('game') || 
               text.includes('esports') ||
               text.includes('mlg') ||
               hashtags.some(tag => ['gaming', 'games', 'esports', 'mlg', 'gamer', 'twitch', 'stream'].includes(tag));
      });

      return gamingTweets.map(tweet => ({
        platform: 'twitter',
        externalId: tweet.id,
        title: tweet.text.length > 100 ? tweet.text.substring(0, 100) + '...' : tweet.text,
        description: tweet.text,
        thumbnailUrl: tweet.media.find(m => m.isVideo)?.previewImageUrl || 
                     tweet.media.find(m => m.type === 'photo')?.url,
        createdAt: tweet.createdAt,
        publicMetrics: tweet.publicMetrics,
        hasVideo: tweet.hasVideo,
        hasImage: tweet.hasImage,
        hashtags: this.twitter.extractHashtags(tweet.text, tweet.entities)
      }));
    } catch (error) {
      console.error('Error fetching user gaming tweets:', error);
      throw error;
    }
  }

  /**
   * Generate embed HTML with oEmbed
   */
  async generateEmbedHTML(tweetUrl, options = {}) {
    try {
      const cacheKey = `twitter:embed:${this.twitter.extractTweetId(tweetUrl)}`;
      let embedData = await this.cache.get(cacheKey);

      if (!embedData) {
        embedData = await this.twitter.generateOEmbedHTML(tweetUrl, options);
        // Cache embed HTML for 1 hour
        await this.cache.set(cacheKey, embedData, 3600);
      }

      return embedData.html;
    } catch (error) {
      console.error('Error generating embed HTML:', error);
      throw error;
    }
  }
}

module.exports = { TwitterAPI, MLGTwitterIntegration };