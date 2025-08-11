/**
 * MLG.clan Content Storage and Retrieval API Contracts - Sub-task 4.3
 * 
 * Comprehensive REST/GraphQL API contracts for the MLG.clan gaming platform
 * content storage and retrieval system. Supports video clips, screenshots,
 * guides, reviews with MLG token integration and voting system.
 * 
 * Features:
 * - Content CRUD operations (Create, Read, Update, Delete)
 * - Advanced search and filtering capabilities
 * - Integration with MLG token voting system (7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL)
 * - Content moderation and reporting
 * - Analytics and metrics tracking
 * - File upload/download handling
 * - User content management
 * - Scalable gaming platform architecture
 * 
 * @author Claude Code - Production General Purpose Agent
 * @version 1.0.0
 */

import { ContentValidator } from '../content/content-validator.js';

/**
 * API Configuration and Constants
 */
export const CONTENT_API_CONFIG = {
  VERSION: 'v1',
  BASE_URL: '/api/v1/content',
  
  // Content type definitions
  CONTENT_TYPES: {
    CLIP: 'video_clip',
    SCREENSHOT: 'screenshot', 
    GUIDE: 'guide',
    REVIEW: 'review',
    STREAM: 'live_stream',
    TOURNAMENT: 'tournament_content'
  },

  // File handling
  FILE_CONFIG: {
    MAX_UPLOAD_SIZE: 500 * 1024 * 1024, // 500MB
    CHUNK_SIZE: 1024 * 1024, // 1MB chunks
    SUPPORTED_FORMATS: {
      video: ['mp4', 'webm', 'mov', 'avi'],
      image: ['png', 'jpg', 'jpeg', 'gif', 'webp'],
      document: ['pdf', 'txt', 'md']
    },
    CDN_CONFIG: {
      baseUrl: 'https://cdn.mlg.clan',
      thumbnailSizes: [150, 300, 720, 1080],
      videoQuality: ['360p', '720p', '1080p', '4k']
    }
  },

  // Pagination defaults
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    DEFAULT_OFFSET: 0
  },

  // Rate limiting
  RATE_LIMITS: {
    UPLOAD: { requests: 5, window: 'hour' },
    SEARCH: { requests: 100, window: 'minute' },
    VOTE: { requests: 50, window: 'minute' },
    REPORT: { requests: 10, window: 'hour' }
  },

  // MLG Token Integration
  MLG_TOKEN: {
    CONTRACT_ADDRESS: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL',
    VOTE_COST: {
      UPVOTE: 1,
      DOWNVOTE: 2,
      SUPER_VOTE: 5
    },
    REWARD_MULTIPLIERS: {
      CLIP: 1.0,
      GUIDE: 2.0,
      REVIEW: 1.5,
      TOURNAMENT: 3.0
    }
  },

  // Gaming platform specifics
  GAMING_CONFIG: {
    SUPPORTED_GAMES: [
      'call-of-duty', 'fortnite', 'apex-legends', 'valorant',
      'counter-strike', 'league-of-legends', 'overwatch', 'rocket-league'
    ],
    PLATFORMS: ['pc', 'xbox', 'playstation', 'mobile', 'nintendo'],
    CATEGORIES: ['highlights', 'tutorials', 'reviews', 'funny', 'competitive'],
    CONTENT_STATUS: ['draft', 'pending', 'published', 'flagged', 'removed']
  }
};

/**
 * Content Entity Schema Definitions
 */
export const CONTENT_SCHEMAS = {
  /**
   * Core Content Entity
   */
  Content: {
    id: 'string', // UUID
    userId: 'string', // Content creator ID
    walletAddress: 'string', // Creator's Solana wallet
    contentType: 'string', // CONTENT_TYPES enum
    status: 'string', // CONTENT_STATUS enum
    
    // Basic metadata
    title: 'string',
    description: 'string',
    tags: 'array<string>',
    
    // Gaming specific
    game: 'string',
    platform: 'string',
    category: 'string',
    gameMode: 'string?',
    difficulty: 'string?',
    
    // File information
    files: 'array<ContentFile>',
    thumbnailUrl: 'string?',
    previewUrl: 'string?',
    
    // Engagement metrics
    views: 'number',
    likes: 'number',
    dislikes: 'number',
    shares: 'number',
    comments: 'number',
    
    // MLG Token voting
    mlgVotes: {
      upvotes: 'number',
      downvotes: 'number',
      superVotes: 'number',
      totalTokensBurned: 'number'
    },
    
    // Content scoring
    qualityScore: 'number', // 0-100
    viralScore: 'number', // 0-100  
    trendingScore: 'number', // 0-100
    
    // Timestamps
    createdAt: 'datetime',
    updatedAt: 'datetime',
    publishedAt: 'datetime?',
    
    // Moderation
    moderationStatus: 'string',
    reportCount: 'number',
    flaggedAt: 'datetime?',
    
    // Analytics
    analytics: 'ContentAnalytics'
  },

  /**
   * Content File Schema
   */
  ContentFile: {
    id: 'string',
    filename: 'string',
    originalName: 'string',
    mimeType: 'string',
    size: 'number',
    url: 'string',
    cdnUrl: 'string',
    thumbnailUrl: 'string?',
    
    // File metadata
    duration: 'number?', // For videos/audio
    dimensions: {
      width: 'number?',
      height: 'number?'
    },
    
    // Processing status
    processingStatus: 'string', // 'pending', 'processing', 'complete', 'failed'
    processedFormats: 'array<string>',
    
    createdAt: 'datetime'
  },

  /**
   * Content Analytics Schema
   */
  ContentAnalytics: {
    id: 'string',
    contentId: 'string',
    
    // View analytics
    totalViews: 'number',
    uniqueViews: 'number',
    watchTime: 'number', // Total seconds watched
    averageWatchTime: 'number',
    completionRate: 'number', // Percentage
    
    // Engagement analytics
    engagementRate: 'number',
    shareRate: 'number',
    commentRate: 'number',
    
    // Geographic data
    topCountries: 'array<string>',
    topCities: 'array<string>',
    
    // Platform analytics
    deviceTypes: 'object', // {'mobile': 45, 'desktop': 55}
    trafficSources: 'object', // {'direct': 30, 'search': 40, 'social': 30}
    
    // Time-based data
    hourlyViews: 'array<number>', // 24 hour array
    dailyViews: 'array<number>', // 7 day array
    monthlyViews: 'array<number>', // 12 month array
    
    lastUpdated: 'datetime'
  },

  /**
   * Vote Schema (MLG Token Integration)
   */
  Vote: {
    id: 'string',
    contentId: 'string',
    userId: 'string',
    walletAddress: 'string',
    
    voteType: 'string', // 'upvote', 'downvote', 'super_vote'
    tokensBurned: 'number',
    transactionSignature: 'string', // Solana transaction hash
    
    // Wallet signature verification
    walletSignature: {
      signature: 'string',
      message: 'string',
      publicKey: 'string',
      verified: 'boolean'
    },
    
    createdAt: 'datetime',
    blockTime: 'datetime' // Solana block timestamp
  },

  /**
   * Content Report Schema
   */
  ContentReport: {
    id: 'string',
    contentId: 'string',
    reporterId: 'string',
    reporterWallet: 'string',
    
    reason: 'string', // 'spam', 'inappropriate', 'copyright', 'cheating', 'harassment'
    description: 'string',
    category: 'string',
    severity: 'string', // 'low', 'medium', 'high', 'critical'
    
    status: 'string', // 'pending', 'reviewing', 'resolved', 'dismissed'
    moderatorId: 'string?',
    moderatorNotes: 'string?',
    
    createdAt: 'datetime',
    resolvedAt: 'datetime?'
  },

  /**
   * User Content Stats Schema
   */
  UserContentStats: {
    userId: 'string',
    walletAddress: 'string',
    
    // Content counts
    totalContent: 'number',
    publishedContent: 'number',
    draftContent: 'number',
    
    // Engagement totals
    totalViews: 'number',
    totalLikes: 'number',
    totalShares: 'number',
    totalComments: 'number',
    
    // MLG token metrics
    totalTokensEarned: 'number',
    totalTokensBurned: 'number',
    votesReceived: 'number',
    votesGiven: 'number',
    
    // Quality metrics
    averageQualityScore: 'number',
    featuredContent: 'number',
    trendingContent: 'number',
    
    // Content type breakdown
    contentByType: 'object', // {'clip': 10, 'guide': 5, 'review': 3}
    contentByGame: 'object', // {'call-of-duty': 8, 'fortnite': 10}
    
    lastUpdated: 'datetime'
  }
};

/**
 * REST API Endpoint Specifications
 */
export const REST_API_ENDPOINTS = {
  /**
   * Content CRUD Operations
   */
  
  // Create new content
  'POST /api/v1/content': {
    summary: 'Create new content',
    description: 'Upload and create new gaming content with metadata',
    
    headers: {
      'Authorization': 'Bearer <jwt-token>',
      'Content-Type': 'multipart/form-data',
      'X-Wallet-Address': '<solana-wallet-address>',
      'X-Wallet-Signature': '<signed-message>'
    },
    
    requestBody: {
      // Form data for file upload
      files: 'array<File>', // Main content files
      thumbnail: 'File?', // Optional custom thumbnail
      
      // JSON metadata
      metadata: {
        title: 'string',
        description: 'string',
        contentType: 'string', // CONTENT_TYPES enum
        game: 'string',
        platform: 'string',
        category: 'string',
        tags: 'array<string>',
        gameMode: 'string?',
        difficulty: 'string?',
        isPublic: 'boolean',
        allowComments: 'boolean',
        allowVoting: 'boolean'
      }
    },
    
    responses: {
      201: {
        description: 'Content created successfully',
        body: {
          success: true,
          data: {
            content: 'Content', // Full content object
            uploadUrls: 'array<string>', // CDN upload URLs
            processingStatus: 'string'
          }
        }
      },
      400: {
        description: 'Validation failed',
        body: {
          success: false,
          error: 'validation_failed',
          details: 'ValidationResult'
        }
      },
      401: { description: 'Unauthorized - invalid token or wallet signature' },
      413: { description: 'Payload too large' },
      429: { description: 'Rate limit exceeded' }
    }
  },

  // Get content list with filtering
  'GET /api/v1/content': {
    summary: 'List content with filtering and pagination',
    description: 'Retrieve content list with advanced filtering, sorting, and search',
    
    queryParameters: {
      // Pagination
      limit: 'number', // Default: 20, Max: 100
      offset: 'number', // Default: 0
      cursor: 'string?', // Cursor-based pagination
      
      // Filtering
      contentType: 'string?', // Filter by content type
      game: 'string?', // Filter by game
      platform: 'string?', // Filter by platform
      category: 'string?', // Filter by category
      userId: 'string?', // Filter by creator
      tags: 'string?', // Comma-separated tags
      status: 'string?', // Content status
      
      // Search
      search: 'string?', // Full-text search
      searchFields: 'string?', // 'title,description,tags'
      
      // Sorting
      sortBy: 'string?', // 'created_at', 'views', 'likes', 'trending_score'
      sortOrder: 'string?', // 'asc', 'desc'
      
      // Time filters
      createdAfter: 'datetime?',
      createdBefore: 'datetime?',
      
      // Quality filters
      minQualityScore: 'number?',
      minViews: 'number?',
      minLikes: 'number?',
      
      // MLG token filters
      minTokenVotes: 'number?',
      hasMLGVotes: 'boolean?',
      
      // Special filters
      trending: 'boolean?', // Only trending content
      featured: 'boolean?', // Only featured content
      verified: 'boolean?' // Only verified creator content
    },
    
    responses: {
      200: {
        description: 'Content list retrieved successfully',
        body: {
          success: true,
          data: {
            content: 'array<Content>',
            pagination: {
              total: 'number',
              limit: 'number',
              offset: 'number',
              hasNext: 'boolean',
              hasPrev: 'boolean',
              nextCursor: 'string?',
              prevCursor: 'string?'
            },
            filters: {
              applied: 'object',
              available: 'object'
            }
          }
        }
      },
      400: { description: 'Invalid query parameters' },
      429: { description: 'Rate limit exceeded' }
    }
  },

  // Get specific content by ID
  'GET /api/v1/content/{contentId}': {
    summary: 'Get content by ID',
    description: 'Retrieve specific content with full details and analytics',
    
    pathParameters: {
      contentId: 'string' // Content UUID
    },
    
    queryParameters: {
      includeAnalytics: 'boolean?', // Include analytics data
      includeComments: 'boolean?', // Include comment preview
      includeRelated: 'boolean?', // Include related content
      incrementView: 'boolean?' // Whether to increment view count
    },
    
    headers: {
      'Authorization': 'Bearer <jwt-token>?', // Optional for public content
      'X-User-Agent': '<user-agent>',
      'X-Client-IP': '<client-ip>'
    },
    
    responses: {
      200: {
        description: 'Content retrieved successfully',
        body: {
          success: true,
          data: {
            content: 'Content',
            analytics: 'ContentAnalytics?',
            comments: 'array<Comment>?',
            relatedContent: 'array<Content>?',
            userVote: 'Vote?', // Current user's vote if authenticated
            downloadUrls: 'object' // Temporary download URLs
          }
        }
      },
      404: { description: 'Content not found' },
      403: { description: 'Access denied - private content' }
    }
  },

  // Update content
  'PUT /api/v1/content/{contentId}': {
    summary: 'Update content',
    description: 'Update content metadata and settings',
    
    pathParameters: {
      contentId: 'string'
    },
    
    headers: {
      'Authorization': 'Bearer <jwt-token>',
      'Content-Type': 'application/json',
      'X-Wallet-Signature': '<signed-message>'
    },
    
    requestBody: {
      title: 'string?',
      description: 'string?',
      tags: 'array<string>?',
      category: 'string?',
      gameMode: 'string?',
      difficulty: 'string?',
      isPublic: 'boolean?',
      allowComments: 'boolean?',
      allowVoting: 'boolean?',
      
      // File operations
      addFiles: 'array<string>?', // File IDs to add
      removeFiles: 'array<string>?', // File IDs to remove
      thumbnailFileId: 'string?' // Set new thumbnail
    },
    
    responses: {
      200: {
        description: 'Content updated successfully',
        body: {
          success: true,
          data: {
            content: 'Content'
          }
        }
      },
      400: { description: 'Validation failed' },
      401: { description: 'Unauthorized' },
      403: { description: 'Not content owner' },
      404: { description: 'Content not found' }
    }
  },

  // Delete content
  'DELETE /api/v1/content/{contentId}': {
    summary: 'Delete content',
    description: 'Permanently delete content and associated files',
    
    pathParameters: {
      contentId: 'string'
    },
    
    headers: {
      'Authorization': 'Bearer <jwt-token>',
      'X-Wallet-Signature': '<signed-message>'
    },
    
    queryParameters: {
      reason: 'string?', // Deletion reason for analytics
      hardDelete: 'boolean?' // Permanently delete vs soft delete
    },
    
    responses: {
      204: { description: 'Content deleted successfully' },
      401: { description: 'Unauthorized' },
      403: { description: 'Not content owner or insufficient permissions' },
      404: { description: 'Content not found' }
    }
  },

  /**
   * Content Voting System (MLG Token Integration)
   */
  
  // Submit vote with MLG token burn
  'POST /api/v1/content/{contentId}/vote': {
    summary: 'Vote on content with MLG tokens',
    description: 'Cast vote by burning MLG tokens, with wallet signature verification',
    
    pathParameters: {
      contentId: 'string'
    },
    
    headers: {
      'Authorization': 'Bearer <jwt-token>',
      'Content-Type': 'application/json',
      'X-Wallet-Address': '<solana-wallet-address>',
      'X-Wallet-Signature': '<signed-vote-message>'
    },
    
    requestBody: {
      voteType: 'string', // 'upvote', 'downvote', 'super_vote'
      tokenAmount: 'number', // MLG tokens to burn
      transactionSignature: 'string', // Solana burn transaction signature
      
      // Wallet signature verification
      walletSignature: {
        signature: 'string',
        message: 'string', // Standardized vote message
        publicKey: 'string'
      },
      
      // Optional vote context
      comment: 'string?',
      isAnonymous: 'boolean?'
    },
    
    responses: {
      201: {
        description: 'Vote cast successfully',
        body: {
          success: true,
          data: {
            vote: 'Vote',
            contentStats: {
              totalVotes: 'number',
              newTrendingScore: 'number'
            },
            userStats: {
              tokensRemaining: 'number',
              totalVotesGiven: 'number'
            }
          }
        }
      },
      400: { description: 'Invalid vote data or insufficient tokens' },
      401: { description: 'Unauthorized or invalid wallet signature' },
      409: { description: 'Already voted on this content' },
      429: { description: 'Rate limit exceeded' }
    }
  },

  // Get content votes
  'GET /api/v1/content/{contentId}/votes': {
    summary: 'Get content vote history',
    description: 'Retrieve vote history and statistics for content',
    
    pathParameters: {
      contentId: 'string'
    },
    
    queryParameters: {
      limit: 'number?',
      offset: 'number?',
      voteType: 'string?', // Filter by vote type
      includeAnonymous: 'boolean?',
      sortBy: 'string?' // 'created_at', 'token_amount'
    },
    
    responses: {
      200: {
        description: 'Vote history retrieved',
        body: {
          success: true,
          data: {
            votes: 'array<Vote>',
            summary: {
              totalVotes: 'number',
              totalTokensBurned: 'number',
              voteBreakdown: 'object',
              topVoters: 'array<object>'
            },
            pagination: 'object'
          }
        }
      }
    }
  },

  /**
   * Content Search and Discovery
   */
  
  // Advanced content search
  'GET /api/v1/content/search': {
    summary: 'Advanced content search',
    description: 'Full-text search with AI-powered recommendations',
    
    queryParameters: {
      q: 'string', // Search query
      type: 'string?', // Search type: 'content', 'users', 'games'
      
      // Search options
      exact: 'boolean?', // Exact phrase matching
      fuzzy: 'boolean?', // Fuzzy matching for typos
      semantic: 'boolean?', // AI semantic search
      
      // Content filters (same as GET /content)
      contentType: 'string?',
      game: 'string?',
      platform: 'string?',
      category: 'string?',
      
      // Advanced filters
      language: 'string?',
      region: 'string?',
      minDuration: 'number?',
      maxDuration: 'number?',
      
      // Ranking factors
      rankBy: 'string?', // 'relevance', 'popularity', 'recency', 'quality'
      boostFactor: 'string?', // 'views', 'votes', 'comments'
      
      // Pagination
      limit: 'number?',
      offset: 'number?'
    },
    
    responses: {
      200: {
        description: 'Search results',
        body: {
          success: true,
          data: {
            results: 'array<Content>',
            total: 'number',
            searchTime: 'number',
            suggestions: 'array<string>', // Search suggestions
            facets: {
              games: 'object',
              platforms: 'object',
              categories: 'object',
              contentTypes: 'object'
            }
          }
        }
      }
    }
  },

  // Trending content
  'GET /api/v1/content/trending': {
    summary: 'Get trending content',
    description: 'Retrieve trending content based on engagement and MLG token activity',
    
    queryParameters: {
      timeframe: 'string?', // 'hour', 'day', 'week', 'month'
      game: 'string?',
      category: 'string?',
      limit: 'number?'
    },
    
    responses: {
      200: {
        description: 'Trending content',
        body: {
          success: true,
          data: {
            trending: 'array<Content>',
            trendingMetrics: {
              timeframe: 'string',
              totalEngagement: 'number',
              totalTokenActivity: 'number'
            }
          }
        }
      }
    }
  },

  /**
   * Content Moderation and Reporting
   */
  
  // Report content
  'POST /api/v1/content/{contentId}/report': {
    summary: 'Report content for moderation',
    description: 'Submit content report for community moderation',
    
    pathParameters: {
      contentId: 'string'
    },
    
    headers: {
      'Authorization': 'Bearer <jwt-token>',
      'Content-Type': 'application/json'
    },
    
    requestBody: {
      reason: 'string', // Report reason code
      description: 'string',
      category: 'string',
      severity: 'string',
      evidence: 'array<string>?' // URLs to evidence
    },
    
    responses: {
      201: {
        description: 'Report submitted successfully',
        body: {
          success: true,
          data: {
            reportId: 'string',
            status: 'string'
          }
        }
      },
      400: { description: 'Invalid report data' },
      401: { description: 'Unauthorized' },
      429: { description: 'Report rate limit exceeded' }
    }
  },

  /**
   * User Content Management
   */
  
  // Get user's content
  'GET /api/v1/users/{userId}/content': {
    summary: 'Get user content',
    description: 'Retrieve all content created by specific user',
    
    pathParameters: {
      userId: 'string'
    },
    
    queryParameters: {
      status: 'string?', // Filter by content status
      contentType: 'string?',
      limit: 'number?',
      offset: 'number?',
      sortBy: 'string?'
    },
    
    responses: {
      200: {
        description: 'User content retrieved',
        body: {
          success: true,
          data: {
            content: 'array<Content>',
            stats: 'UserContentStats',
            pagination: 'object'
          }
        }
      }
    }
  },

  // Get user content statistics
  'GET /api/v1/users/{userId}/content/stats': {
    summary: 'Get user content statistics',
    description: 'Retrieve comprehensive content statistics for user',
    
    pathParameters: {
      userId: 'string'
    },
    
    queryParameters: {
      timeframe: 'string?', // 'day', 'week', 'month', 'year', 'all'
      includeBreakdown: 'boolean?'
    },
    
    responses: {
      200: {
        description: 'User statistics retrieved',
        body: {
          success: true,
          data: {
            stats: 'UserContentStats',
            breakdown: 'object?',
            achievements: 'array<object>',
            rankings: 'object'
          }
        }
      }
    }
  },

  /**
   * File Upload and Management
   */
  
  // Get upload URL for chunked upload
  'POST /api/v1/content/upload/initiate': {
    summary: 'Initiate chunked file upload',
    description: 'Get presigned URLs for chunked file upload to CDN',
    
    headers: {
      'Authorization': 'Bearer <jwt-token>',
      'Content-Type': 'application/json'
    },
    
    requestBody: {
      filename: 'string',
      fileSize: 'number',
      mimeType: 'string',
      chunkCount: 'number',
      checksum: 'string', // File checksum for integrity
      
      // Optional metadata
      contentId: 'string?', // Associate with existing content
      fileType: 'string' // 'main', 'thumbnail', 'preview'
    },
    
    responses: {
      200: {
        description: 'Upload initiated successfully',
        body: {
          success: true,
          data: {
            uploadId: 'string',
            uploadUrls: 'array<string>', // Presigned URLs for each chunk
            expiresAt: 'datetime',
            maxChunkSize: 'number'
          }
        }
      }
    }
  },

  // Complete chunked upload
  'POST /api/v1/content/upload/{uploadId}/complete': {
    summary: 'Complete chunked upload',
    description: 'Finalize chunked upload and start processing',
    
    pathParameters: {
      uploadId: 'string'
    },
    
    requestBody: {
      chunkETags: 'array<string>', // ETag for each uploaded chunk
      totalSize: 'number',
      checksum: 'string'
    },
    
    responses: {
      200: {
        description: 'Upload completed successfully',
        body: {
          success: true,
          data: {
            fileId: 'string',
            file: 'ContentFile',
            processingStatus: 'string'
          }
        }
      }
    }
  },

  /**
   * Analytics and Metrics
   */
  
  // Get content analytics
  'GET /api/v1/content/{contentId}/analytics': {
    summary: 'Get content analytics',
    description: 'Retrieve detailed analytics for content',
    
    pathParameters: {
      contentId: 'string'
    },
    
    queryParameters: {
      timeframe: 'string?', // 'day', 'week', 'month', 'year'
      metrics: 'string?', // Comma-separated metric names
      breakdown: 'string?' // 'country', 'device', 'source'
    },
    
    headers: {
      'Authorization': 'Bearer <jwt-token>'
    },
    
    responses: {
      200: {
        description: 'Analytics retrieved successfully',
        body: {
          success: true,
          data: {
            analytics: 'ContentAnalytics',
            timeSeries: 'object',
            breakdowns: 'object',
            insights: 'array<object>' // AI-generated insights
          }
        }
      },
      403: { description: 'Not content owner' }
    }
  },

  // Get platform analytics
  'GET /api/v1/analytics/platform': {
    summary: 'Get platform-wide analytics',
    description: 'Retrieve analytics for the entire MLG.clan platform',
    
    queryParameters: {
      timeframe: 'string?',
      breakdown: 'string?'
    },
    
    headers: {
      'Authorization': 'Bearer <admin-token>'
    },
    
    responses: {
      200: {
        description: 'Platform analytics retrieved',
        body: {
          success: true,
          data: {
            summary: {
              totalContent: 'number',
              totalUsers: 'number',
              totalViews: 'number',
              totalTokensBurned: 'number'
            },
            trends: 'object',
            topContent: 'array<Content>',
            topCreators: 'array<object>'
          }
        }
      },
      403: { description: 'Admin access required' }
    }
  }
};

/**
 * GraphQL API Schema Definition
 */
export const GRAPHQL_SCHEMA = `
  # Scalar types
  scalar DateTime
  scalar JSON
  scalar Upload

  # Enums
  enum ContentType {
    VIDEO_CLIP
    SCREENSHOT
    GUIDE
    REVIEW
    STREAM
    TOURNAMENT
  }

  enum ContentStatus {
    DRAFT
    PENDING
    PUBLISHED
    FLAGGED
    REMOVED
  }

  enum VoteType {
    UPVOTE
    DOWNVOTE
    SUPER_VOTE
  }

  enum Platform {
    PC
    XBOX
    PLAYSTATION
    MOBILE
    NINTENDO
  }

  enum SortOrder {
    ASC
    DESC
  }

  # Input types
  input ContentFilterInput {
    contentType: ContentType
    game: String
    platform: Platform
    category: String
    userId: String
    tags: [String!]
    status: ContentStatus
    createdAfter: DateTime
    createdBefore: DateTime
    minQualityScore: Float
    minViews: Int
    trending: Boolean
    featured: Boolean
  }

  input PaginationInput {
    limit: Int = 20
    offset: Int = 0
    cursor: String
  }

  input SortInput {
    field: String!
    order: SortOrder = DESC
  }

  input ContentCreateInput {
    title: String!
    description: String!
    contentType: ContentType!
    game: String!
    platform: Platform!
    category: String!
    tags: [String!]!
    gameMode: String
    difficulty: String
    isPublic: Boolean = true
    allowComments: Boolean = true
    allowVoting: Boolean = true
    files: [Upload!]!
    thumbnail: Upload
  }

  input VoteInput {
    contentId: String!
    voteType: VoteType!
    tokenAmount: Float!
    transactionSignature: String!
    walletSignature: WalletSignatureInput!
    comment: String
    isAnonymous: Boolean = false
  }

  input WalletSignatureInput {
    signature: String!
    message: String!
    publicKey: String!
  }

  # Object types
  type Content {
    id: String!
    userId: String!
    walletAddress: String!
    contentType: ContentType!
    status: ContentStatus!
    
    # Metadata
    title: String!
    description: String!
    tags: [String!]!
    game: String!
    platform: Platform!
    category: String!
    gameMode: String
    difficulty: String
    
    # Files
    files: [ContentFile!]!
    thumbnailUrl: String
    previewUrl: String
    
    # Metrics
    views: Int!
    likes: Int!
    dislikes: Int!
    shares: Int!
    comments: Int!
    
    # MLG Token voting
    mlgVotes: MLGVoteStats!
    
    # Scoring
    qualityScore: Float!
    viralScore: Float!
    trendingScore: Float!
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
    publishedAt: DateTime
    
    # Related data (resolved via DataLoader)
    creator: User
    analytics: ContentAnalytics
    userVote: Vote
    relatedContent: [Content!]!
  }

  type ContentFile {
    id: String!
    filename: String!
    originalName: String!
    mimeType: String!
    size: Int!
    url: String!
    cdnUrl: String!
    thumbnailUrl: String
    duration: Float
    dimensions: Dimensions
    processingStatus: String!
    processedFormats: [String!]!
    createdAt: DateTime!
  }

  type Dimensions {
    width: Int!
    height: Int!
  }

  type MLGVoteStats {
    upvotes: Int!
    downvotes: Int!
    superVotes: Int!
    totalTokensBurned: Float!
  }

  type ContentAnalytics {
    id: String!
    contentId: String!
    totalViews: Int!
    uniqueViews: Int!
    watchTime: Float!
    averageWatchTime: Float!
    completionRate: Float!
    engagementRate: Float!
    topCountries: [String!]!
    topCities: [String!]!
    deviceTypes: JSON!
    trafficSources: JSON!
    hourlyViews: [Int!]!
    dailyViews: [Int!]!
    monthlyViews: [Int!]!
    lastUpdated: DateTime!
  }

  type Vote {
    id: String!
    contentId: String!
    userId: String!
    walletAddress: String!
    voteType: VoteType!
    tokensBurned: Float!
    transactionSignature: String!
    walletSignature: WalletSignature!
    createdAt: DateTime!
    blockTime: DateTime!
    
    # Resolved relations
    content: Content
    user: User
  }

  type WalletSignature {
    signature: String!
    message: String!
    publicKey: String!
    verified: Boolean!
  }

  type User {
    id: String!
    walletAddress: String!
    username: String!
    avatar: String
    verified: Boolean!
    
    # Content stats
    contentStats: UserContentStats!
  }

  type UserContentStats {
    userId: String!
    walletAddress: String!
    totalContent: Int!
    publishedContent: Int!
    totalViews: Int!
    totalLikes: Int!
    totalTokensEarned: Float!
    totalTokensBurned: Float!
    averageQualityScore: Float!
    contentByType: JSON!
    contentByGame: JSON!
    lastUpdated: DateTime!
  }

  type ContentConnection {
    edges: [ContentEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ContentEdge {
    node: Content!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  # Root Query type
  type Query {
    # Content queries
    content(id: String!): Content
    contentList(
      filter: ContentFilterInput
      pagination: PaginationInput
      sort: SortInput
    ): ContentConnection!
    
    searchContent(
      query: String!
      filter: ContentFilterInput
      pagination: PaginationInput
    ): ContentConnection!
    
    trendingContent(
      timeframe: String = "day"
      game: String
      category: String
      limit: Int = 20
    ): [Content!]!
    
    featuredContent(
      limit: Int = 10
    ): [Content!]!
    
    # User content
    userContent(
      userId: String!
      filter: ContentFilterInput
      pagination: PaginationInput
    ): ContentConnection!
    
    userContentStats(
      userId: String!
      timeframe: String = "all"
    ): UserContentStats!
    
    # Analytics
    contentAnalytics(
      contentId: String!
      timeframe: String = "month"
    ): ContentAnalytics
    
    # Voting
    contentVotes(
      contentId: String!
      pagination: PaginationInput
    ): [Vote!]!
    
    # Platform stats
    platformStats(timeframe: String = "day"): JSON!
  }

  # Root Mutation type  
  type Mutation {
    # Content operations
    createContent(input: ContentCreateInput!): Content!
    updateContent(id: String!, input: ContentUpdateInput!): Content!
    deleteContent(id: String!, reason: String): Boolean!
    
    # Voting
    voteContent(input: VoteInput!): Vote!
    
    # File operations
    initiateUpload(input: UploadInitiateInput!): UploadSession!
    completeUpload(uploadId: String!, input: UploadCompleteInput!): ContentFile!
    
    # Moderation
    reportContent(input: ReportInput!): ContentReport!
  }

  # Subscription type for real-time updates
  type Subscription {
    contentVoted(contentId: String!): Vote!
    contentCreated(userId: String): Content!
    contentTrending: Content!
    userContentStats(userId: String!): UserContentStats!
  }

  input ContentUpdateInput {
    title: String
    description: String
    tags: [String!]
    category: String
    gameMode: String
    difficulty: String
    isPublic: Boolean
    allowComments: Boolean
    allowVoting: Boolean
  }

  input UploadInitiateInput {
    filename: String!
    fileSize: Int!
    mimeType: String!
    chunkCount: Int!
    checksum: String!
    contentId: String
    fileType: String!
  }

  input UploadCompleteInput {
    chunkETags: [String!]!
    totalSize: Int!
    checksum: String!
  }

  input ReportInput {
    contentId: String!
    reason: String!
    description: String!
    category: String!
    severity: String!
    evidence: [String!]
  }

  type UploadSession {
    uploadId: String!
    uploadUrls: [String!]!
    expiresAt: DateTime!
    maxChunkSize: Int!
  }

  type ContentReport {
    id: String!
    contentId: String!
    status: String!
    createdAt: DateTime!
  }
`;

/**
 * API Response Schemas
 */
export const API_RESPONSES = {
  // Standard success response
  SuccessResponse: {
    success: true,
    data: 'any',
    meta: {
      timestamp: 'datetime',
      requestId: 'string',
      version: 'string'
    }
  },

  // Standard error response
  ErrorResponse: {
    success: false,
    error: 'string', // Error code
    message: 'string', // Human readable message
    details: 'any?', // Additional error details
    meta: {
      timestamp: 'datetime',
      requestId: 'string',
      version: 'string'
    }
  },

  // Validation error response
  ValidationErrorResponse: {
    success: false,
    error: 'validation_failed',
    message: 'string',
    details: {
      errors: 'array<ValidationError>',
      warnings: 'array<ValidationWarning>'
    }
  }
};

/**
 * Authentication and Security Specifications
 */
export const SECURITY_CONFIG = {
  // JWT Authentication
  JWT: {
    issuer: 'mlg.clan',
    algorithm: 'HS256',
    expiresIn: '24h',
    refreshExpiresIn: '7d',
    requiredClaims: ['sub', 'wallet', 'exp', 'iat']
  },

  // Wallet signature verification
  WALLET_SIGNATURE: {
    requiredMessage: 'MLG.clan Action Verification',
    signatureAlgorithm: 'ed25519',
    expirationTime: 300, // 5 minutes
    nonceLength: 32
  },

  // Rate limiting configuration
  RATE_LIMITS: {
    // Content operations
    'POST:/api/v1/content': { 
      windowMs: 3600000, // 1 hour
      max: 5, // 5 uploads per hour
      skipSuccessfulRequests: false
    },
    'GET:/api/v1/content': {
      windowMs: 60000, // 1 minute  
      max: 100, // 100 requests per minute
      skipSuccessfulRequests: true
    },
    
    // Voting operations
    'POST:/api/v1/content/:id/vote': {
      windowMs: 60000, // 1 minute
      max: 50, // 50 votes per minute
      skipSuccessfulRequests: false
    },
    
    // Search operations
    'GET:/api/v1/content/search': {
      windowMs: 60000, // 1 minute
      max: 100, // 100 searches per minute
      skipSuccessfulRequests: true
    }
  },

  // Input validation rules
  VALIDATION_RULES: {
    contentId: /^[a-f\d]{8}(-[a-f\d]{4}){4}[a-f\d]{8}$/i, // UUID format
    walletAddress: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/, // Base58 Solana address
    transactionSignature: /^[1-9A-HJ-NP-Za-km-z]{87,88}$/, // Solana transaction signature
    
    // Content validation
    title: {
      minLength: 3,
      maxLength: 100,
      pattern: /^[a-zA-Z0-9\s\-_.,!?()':]+$/
    },
    description: {
      minLength: 10,
      maxLength: 1000
    },
    tags: {
      minCount: 1,
      maxCount: 15,
      maxTagLength: 25
    }
  }
};

/**
 * Performance and Caching Configuration
 */
export const PERFORMANCE_CONFIG = {
  // Caching strategy
  CACHE: {
    // Content list caching
    contentList: {
      ttl: 300, // 5 minutes
      key: 'content:list:{filters_hash}',
      tags: ['content', 'list']
    },
    
    // Individual content caching  
    content: {
      ttl: 600, // 10 minutes
      key: 'content:{id}',
      tags: ['content']
    },
    
    // Analytics caching
    analytics: {
      ttl: 1800, // 30 minutes
      key: 'analytics:{contentId}:{timeframe}',
      tags: ['analytics']
    },
    
    // Search results caching
    search: {
      ttl: 180, // 3 minutes
      key: 'search:{query_hash}',
      tags: ['search']
    }
  },

  // Database connection pooling
  DATABASE: {
    maxConnections: 50,
    minConnections: 5,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 600000
  },

  // CDN configuration
  CDN: {
    baseUrl: 'https://cdn.mlg.clan',
    thumbnailBaseUrl: 'https://thumbnails.mlg.clan',
    cacheHeaders: {
      'Cache-Control': 'public, max-age=31536000', // 1 year
      'ETag': true,
      'Last-Modified': true
    }
  },

  // File processing
  FILE_PROCESSING: {
    maxConcurrentJobs: 10,
    videoProcessingTimeout: 600000, // 10 minutes
    thumbnailGenerationTimeout: 60000, // 1 minute
    
    // Video processing options
    videoQualities: [
      { name: '360p', width: 640, height: 360, bitrate: '1000k' },
      { name: '720p', width: 1280, height: 720, bitrate: '2500k' },
      { name: '1080p', width: 1920, height: 1080, bitrate: '5000k' }
    ]
  }
};

/**
 * Error Codes and Messages
 */
export const ERROR_CODES = {
  // Authentication errors
  'AUTH_001': { message: 'Invalid or expired JWT token', statusCode: 401 },
  'AUTH_002': { message: 'Wallet signature verification failed', statusCode: 401 },
  'AUTH_003': { message: 'Insufficient permissions', statusCode: 403 },
  'AUTH_004': { message: 'Account suspended', statusCode: 403 },

  // Content errors
  'CONTENT_001': { message: 'Content not found', statusCode: 404 },
  'CONTENT_002': { message: 'Content access denied', statusCode: 403 },
  'CONTENT_003': { message: 'Content validation failed', statusCode: 400 },
  'CONTENT_004': { message: 'Content processing failed', statusCode: 500 },
  'CONTENT_005': { message: 'Content already exists', statusCode: 409 },

  // File errors
  'FILE_001': { message: 'File too large', statusCode: 413 },
  'FILE_002': { message: 'Unsupported file type', statusCode: 400 },
  'FILE_003': { message: 'File upload failed', statusCode: 500 },
  'FILE_004': { message: 'File processing failed', statusCode: 500 },

  // Vote errors
  'VOTE_001': { message: 'Insufficient MLG tokens', statusCode: 400 },
  'VOTE_002': { message: 'Already voted on this content', statusCode: 409 },
  'VOTE_003': { message: 'Invalid transaction signature', statusCode: 400 },
  'VOTE_004': { message: 'Transaction verification failed', statusCode: 400 },

  // Rate limit errors
  'RATE_001': { message: 'Too many requests', statusCode: 429 },
  'RATE_002': { message: 'Upload limit exceeded', statusCode: 429 },
  'RATE_003': { message: 'Vote limit exceeded', statusCode: 429 },

  // Validation errors
  'VALIDATION_001': { message: 'Required field missing', statusCode: 400 },
  'VALIDATION_002': { message: 'Invalid field format', statusCode: 400 },
  'VALIDATION_003': { message: 'Field value out of range', statusCode: 400 },

  // System errors
  'SYSTEM_001': { message: 'Internal server error', statusCode: 500 },
  'SYSTEM_002': { message: 'Database connection failed', statusCode: 500 },
  'SYSTEM_003': { message: 'External service unavailable', statusCode: 503 }
};

/**
 * Mock Implementation for Development
 */
export class ContentAPIClient {
  constructor(config = {}) {
    this.config = { ...CONTENT_API_CONFIG, ...config };
    this.validator = new ContentValidator();
    this.mockData = new Map();
    this.initializeMockData();
  }

  /**
   * Initialize mock data for development
   */
  initializeMockData() {
    // Mock content data
    const mockContent = {
      id: 'content-123e4567-e89b-12d3-a456-426614174000',
      userId: 'user-123e4567-e89b-12d3-a456-426614174001',
      walletAddress: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL',
      contentType: 'video_clip',
      status: 'published',
      title: 'Epic Fortnite Victory Royale - Solo Clutch',
      description: 'Incredible last-minute clutch in Fortnite Battle Royale. Watch as I take down the final squad with only 10 HP!',
      tags: ['fortnite', 'victory-royale', 'clutch', 'solo', 'battle-royale'],
      game: 'Fortnite',
      platform: 'pc',
      category: 'highlights',
      gameMode: 'solo',
      files: [{
        id: 'file-123e4567-e89b-12d3-a456-426614174002',
        filename: 'epic-victory-royale.mp4',
        mimeType: 'video/mp4',
        size: 15728640, // 15MB
        url: 'https://cdn.mlg.clan/videos/epic-victory-royale.mp4',
        duration: 45,
        dimensions: { width: 1920, height: 1080 }
      }],
      views: 1250,
      likes: 89,
      dislikes: 3,
      mlgVotes: {
        upvotes: 42,
        downvotes: 2,
        superVotes: 5,
        totalTokensBurned: 67
      },
      qualityScore: 87.5,
      trendingScore: 92.3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.mockData.set('content', [mockContent]);
    this.mockData.set('votes', []);
    this.mockData.set('reports', []);
  }

  /**
   * Create new content (Mock)
   * @param {Object} contentData - Content creation data
   * @returns {Promise<Object>}
   */
  async createContent(contentData) {
    try {
      // Validate content
      const validationResult = await this.validator.validateContent(contentData);
      
      if (!validationResult.isValid) {
        return {
          success: false,
          error: 'validation_failed',
          details: validationResult
        };
      }

      // Mock content creation
      const newContent = {
        id: `content-${Date.now()}`,
        ...contentData.metadata,
        userId: contentData.userId,
        status: 'processing',
        views: 0,
        likes: 0,
        mlgVotes: { upvotes: 0, downvotes: 0, superVotes: 0, totalTokensBurned: 0 },
        createdAt: new Date().toISOString()
      };

      const contentList = this.mockData.get('content') || [];
      contentList.push(newContent);
      this.mockData.set('content', contentList);

      return {
        success: true,
        data: {
          content: newContent,
          processingStatus: 'initiated'
        }
      };

    } catch (error) {
      return {
        success: false,
        error: 'CONTENT_004',
        message: ERROR_CODES.CONTENT_004.message
      };
    }
  }

  /**
   * Get content list with filtering (Mock)
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Object>}
   */
  async getContentList(filters = {}) {
    try {
      let content = this.mockData.get('content') || [];
      
      // Apply filters
      if (filters.game) {
        content = content.filter(c => c.game.toLowerCase() === filters.game.toLowerCase());
      }
      
      if (filters.contentType) {
        content = content.filter(c => c.contentType === filters.contentType);
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        content = content.filter(c => 
          c.title.toLowerCase().includes(searchTerm) ||
          c.description.toLowerCase().includes(searchTerm) ||
          c.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      // Apply sorting
      if (filters.sortBy) {
        content.sort((a, b) => {
          const aVal = a[filters.sortBy] || 0;
          const bVal = b[filters.sortBy] || 0;
          return filters.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        });
      }

      // Apply pagination
      const limit = Math.min(filters.limit || 20, 100);
      const offset = filters.offset || 0;
      const total = content.length;
      const paginatedContent = content.slice(offset, offset + limit);

      return {
        success: true,
        data: {
          content: paginatedContent,
          pagination: {
            total,
            limit,
            offset,
            hasNext: offset + limit < total,
            hasPrev: offset > 0
          }
        }
      };

    } catch (error) {
      return {
        success: false,
        error: 'SYSTEM_001',
        message: ERROR_CODES.SYSTEM_001.message
      };
    }
  }

  /**
   * Submit vote with MLG token (Mock)
   * @param {string} contentId - Content ID
   * @param {Object} voteData - Vote data
   * @returns {Promise<Object>}
   */
  async submitVote(contentId, voteData) {
    try {
      // Validate vote data
      if (!voteData.transactionSignature || !voteData.walletSignature) {
        return {
          success: false,
          error: 'VOTE_003',
          message: ERROR_CODES.VOTE_003.message
        };
      }

      // Mock vote creation
      const newVote = {
        id: `vote-${Date.now()}`,
        contentId,
        userId: voteData.userId,
        voteType: voteData.voteType,
        tokensBurned: voteData.tokenAmount,
        transactionSignature: voteData.transactionSignature,
        createdAt: new Date().toISOString()
      };

      const votes = this.mockData.get('votes') || [];
      votes.push(newVote);
      this.mockData.set('votes', votes);

      // Update content vote counts
      const content = this.mockData.get('content') || [];
      const targetContent = content.find(c => c.id === contentId);
      if (targetContent) {
        targetContent.mlgVotes[voteData.voteType + 's']++;
        targetContent.mlgVotes.totalTokensBurned += voteData.tokenAmount;
      }

      return {
        success: true,
        data: {
          vote: newVote,
          contentStats: {
            totalVotes: votes.filter(v => v.contentId === contentId).length
          }
        }
      };

    } catch (error) {
      return {
        success: false,
        error: 'VOTE_004',
        message: ERROR_CODES.VOTE_004.message
      };
    }
  }

  /**
   * Search content (Mock)
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>}
   */
  async searchContent(query, filters = {}) {
    const searchFilters = { ...filters, search: query };
    return this.getContentList(searchFilters);
  }

  /**
   * Get trending content (Mock)
   * @param {Object} options - Trending options
   * @returns {Promise<Object>}
   */
  async getTrendingContent(options = {}) {
    const content = this.mockData.get('content') || [];
    
    // Sort by trending score
    const trending = content
      .filter(c => c.status === 'published')
      .sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0))
      .slice(0, options.limit || 10);

    return {
      success: true,
      data: {
        trending,
        trendingMetrics: {
          timeframe: options.timeframe || 'day',
          totalEngagement: trending.reduce((sum, c) => sum + c.views + c.likes, 0)
        }
      }
    };
  }

  /**
   * Report content (Mock)
   * @param {string} contentId - Content ID
   * @param {Object} reportData - Report data
   * @returns {Promise<Object>}
   */
  async reportContent(contentId, reportData) {
    try {
      const newReport = {
        id: `report-${Date.now()}`,
        contentId,
        ...reportData,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const reports = this.mockData.get('reports') || [];
      reports.push(newReport);
      this.mockData.set('reports', reports);

      return {
        success: true,
        data: {
          reportId: newReport.id,
          status: newReport.status
        }
      };

    } catch (error) {
      return {
        success: false,
        error: 'SYSTEM_001',
        message: ERROR_CODES.SYSTEM_001.message
      };
    }
  }
}

/**
 * API Testing Utilities
 */
export const APITestUtils = {
  /**
   * Generate mock content data
   * @param {Object} overrides - Property overrides
   * @returns {Object}
   */
  generateMockContent(overrides = {}) {
    return {
      title: 'Test Gaming Content',
      description: 'This is a test gaming content for API testing',
      contentType: 'video_clip',
      game: 'Fortnite',
      platform: 'pc',
      category: 'highlights',
      tags: ['test', 'gaming', 'api'],
      ...overrides
    };
  },

  /**
   * Generate mock vote data
   * @param {Object} overrides - Property overrides
   * @returns {Object}
   */
  generateMockVote(overrides = {}) {
    return {
      voteType: 'upvote',
      tokenAmount: 1,
      transactionSignature: '5J8QvU7snqjBxNqVQhGjPFzQFzQYU7snqjBxNqVQhGjPFzQFzQYU7snqjBxNqVQhGjPFzQFzQY',
      walletSignature: {
        signature: 'test-signature',
        message: 'MLG.clan Vote Verification',
        publicKey: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL'
      },
      ...overrides
    };
  },

  /**
   * Validate API response structure
   * @param {Object} response - API response
   * @param {Object} expectedSchema - Expected response schema
   * @returns {boolean}
   */
  validateResponse(response, expectedSchema) {
    try {
      // Simple schema validation
      if (expectedSchema.success !== undefined) {
        if (response.success !== expectedSchema.success) return false;
      }
      
      if (expectedSchema.data && response.success) {
        return response.data !== undefined;
      }
      
      if (expectedSchema.error && !response.success) {
        return response.error !== undefined;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
};

// Export default client instance
export default new ContentAPIClient();