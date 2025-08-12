/**
 * MLG.clan Platform MongoDB Collections Schema
 * 
 * This file defines MongoDB collections for real-time data, analytics,
 * chat systems, and cached data for the MLG.clan gaming platform.
 * 
 * Collections are organized for:
 * - Real-time activity feeds and notifications
 * - Chat and communication systems
 * - Analytics and metrics with time-series optimization
 * - File metadata and video processing information
 * - Cache collections for frequently accessed data
 * - Event logs and audit trails
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-10
 */

/**
 * MongoDB Connection Configuration
 */
export const MONGODB_CONFIG = {
  // Database name
  database: 'mlg_clan_realtime',
  
  // Connection options
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 50,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4, // Use IPv4
    
    // Write concern for important operations
    writeConcern: {
      w: 'majority',
      j: true,
      wtimeout: 1000
    },
    
    // Read preference for analytics
    readPreference: 'secondaryPreferred',
    
    // Compression
    compressors: ['zlib'],
    
    // SSL/TLS (enable in production)
    ssl: process.env.NODE_ENV === 'production',
    
    // Authentication
    authSource: 'admin'
  },
  
  // Collection options
  collectionOptions: {
    // Default read concern
    readConcern: { level: 'majority' },
    
    // Default write concern
    writeConcern: {
      w: 'majority',
      j: true
    }
  }
};

/**
 * Collection Schemas and Indexes
 * 
 * Each collection definition includes:
 * - Schema validation rules
 * - Index definitions for performance
 * - TTL settings for automatic cleanup
 * - Shard key recommendations for scaling
 */

/**
 * Real-time Activity Feed Collection
 * Stores user activity feeds, notifications, and real-time updates
 */
export const ACTIVITY_FEEDS_COLLECTION = {
  name: 'activity_feeds',
  
  // JSON Schema validation
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'activityType', 'timestamp'],
      properties: {
        _id: { bsonType: 'objectId' },
        userId: { bsonType: 'string', description: 'User UUID from PostgreSQL' },
        activityType: {
          bsonType: 'string',
          enum: [
            'content_upload', 'content_vote', 'content_comment',
            'clan_join', 'clan_leave', 'clan_invite', 'clan_promotion',
            'achievement_earned', 'milestone_reached', 'vote_purchase',
            'content_featured', 'content_moderated', 'user_mention'
          ],
          description: 'Type of activity'
        },
        timestamp: { bsonType: 'date', description: 'Activity timestamp' },
        targetUserId: { bsonType: 'string', description: 'Target user for activity' },
        clanId: { bsonType: 'string', description: 'Associated clan UUID' },
        contentId: { bsonType: 'string', description: 'Associated content UUID' },
        metadata: {
          bsonType: 'object',
          description: 'Additional activity data',
          additionalProperties: true
        },
        visibility: {
          bsonType: 'string',
          enum: ['public', 'clan', 'friends', 'private'],
          description: 'Activity visibility level'
        },
        priority: {
          bsonType: 'int',
          minimum: 1,
          maximum: 10,
          description: 'Activity priority for feed ordering'
        },
        isRead: { bsonType: 'bool', description: 'Whether activity has been viewed' },
        expiresAt: { bsonType: 'date', description: 'TTL expiry date' }
      }
    }
  },
  
  // Indexes for performance
  indexes: [
    { key: { userId: 1, timestamp: -1 }, name: 'user_activity_timeline' },
    { key: { targetUserId: 1, timestamp: -1 }, name: 'target_user_activities', sparse: true },
    { key: { clanId: 1, timestamp: -1 }, name: 'clan_activities', sparse: true },
    { key: { activityType: 1, timestamp: -1 }, name: 'activity_type_timeline' },
    { key: { timestamp: -1 }, name: 'global_activity_feed' },
    { key: { visibility: 1, timestamp: -1 }, name: 'visibility_timeline' },
    { key: { isRead: 1, userId: 1 }, name: 'unread_activities' },
    { key: { expiresAt: 1 }, name: 'ttl_expiry', expireAfterSeconds: 0 }, // TTL index
    { 
      key: { userId: 1, activityType: 1, contentId: 1 }, 
      name: 'duplicate_prevention',
      unique: true,
      sparse: true
    }
  ],
  
  // TTL: Keep activity feeds for 30 days
  ttlSeconds: 30 * 24 * 60 * 60,
  
  // Recommended shard key for horizontal scaling
  shardKey: { userId: 1, timestamp: 1 }
};

/**
 * Real-time Notifications Collection
 * Stores user notifications and alerts
 */
export const NOTIFICATIONS_COLLECTION = {
  name: 'notifications',
  
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'type', 'title', 'message', 'createdAt'],
      properties: {
        _id: { bsonType: 'objectId' },
        userId: { bsonType: 'string', description: 'Recipient user UUID' },
        type: {
          bsonType: 'string',
          enum: [
            'system', 'achievement', 'clan_invite', 'content_approved',
            'content_rejected', 'vote_received', 'mention', 'milestone',
            'moderation', 'security', 'promotional'
          ]
        },
        title: { bsonType: 'string', minLength: 1, maxLength: 100 },
        message: { bsonType: 'string', minLength: 1, maxLength: 500 },
        
        // Notification metadata
        priority: { bsonType: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        category: { bsonType: 'string', maxLength: 50 },
        
        // Action and navigation
        actionUrl: { bsonType: 'string', description: 'URL to navigate when clicked' },
        actionButton: {
          bsonType: 'object',
          properties: {
            text: { bsonType: 'string', maxLength: 20 },
            url: { bsonType: 'string' },
            action: { bsonType: 'string' }
          }
        },
        
        // Status tracking
        isRead: { bsonType: 'bool' },
        readAt: { bsonType: 'date' },
        isArchived: { bsonType: 'bool' },
        archivedAt: { bsonType: 'date' },
        
        // Rich content
        image: { bsonType: 'string', description: 'Notification image URL' },
        icon: { bsonType: 'string', description: 'Notification icon' },
        
        // Related entities
        relatedEntityId: { bsonType: 'string', description: 'Related content/clan/user ID' },
        relatedEntityType: { 
          bsonType: 'string',
          enum: ['user', 'clan', 'content', 'achievement', 'proposal']
        },
        
        // Delivery tracking
        deliveryChannels: {
          bsonType: 'array',
          items: { bsonType: 'string', enum: ['web', 'email', 'push', 'sms'] }
        },
        deliveryStatus: {
          bsonType: 'object',
          properties: {
            web: { bsonType: 'string', enum: ['pending', 'delivered', 'failed'] },
            email: { bsonType: 'string', enum: ['pending', 'sent', 'delivered', 'failed'] },
            push: { bsonType: 'string', enum: ['pending', 'sent', 'delivered', 'failed'] }
          }
        },
        
        createdAt: { bsonType: 'date' },
        expiresAt: { bsonType: 'date', description: 'TTL expiry date' }
      }
    }
  },
  
  indexes: [
    { key: { userId: 1, createdAt: -1 }, name: 'user_notifications_timeline' },
    { key: { userId: 1, isRead: 1, priority: 1 }, name: 'unread_notifications_priority' },
    { key: { type: 1, createdAt: -1 }, name: 'notification_type_timeline' },
    { key: { priority: 1, createdAt: -1 }, name: 'priority_timeline' },
    { key: { isArchived: 1, userId: 1 }, name: 'archived_notifications' },
    { key: { relatedEntityId: 1, relatedEntityType: 1 }, name: 'related_entity_notifications', sparse: true },
    { key: { expiresAt: 1 }, name: 'ttl_expiry', expireAfterSeconds: 0 },
    { key: { createdAt: -1 }, name: 'global_notifications_timeline' }
  ],
  
  ttlSeconds: 90 * 24 * 60 * 60, // Keep notifications for 90 days
  shardKey: { userId: 1, createdAt: 1 }
};

/**
 * Chat Messages Collection
 * Stores clan chat messages and direct messages
 */
export const CHAT_MESSAGES_COLLECTION = {
  name: 'chat_messages',
  
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['senderId', 'channelId', 'channelType', 'content', 'timestamp'],
      properties: {
        _id: { bsonType: 'objectId' },
        senderId: { bsonType: 'string', description: 'Sender user UUID' },
        senderUsername: { bsonType: 'string', maxLength: 32 },
        senderDisplayName: { bsonType: 'string', maxLength: 50 },
        senderAvatarUrl: { bsonType: 'string' },
        
        // Channel information
        channelId: { bsonType: 'string', description: 'Channel UUID (clan ID for clan chat)' },
        channelType: {
          bsonType: 'string',
          enum: ['clan_general', 'clan_admin', 'direct_message', 'group_chat', 'system']
        },
        
        // Message content
        content: { bsonType: 'string', minLength: 1, maxLength: 1000 },
        messageType: {
          bsonType: 'string',
          enum: ['text', 'image', 'file', 'system_announcement', 'achievement_share', 'content_share'],
          description: 'Type of message content'
        },
        
        // Rich content and attachments
        attachments: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            properties: {
              type: { bsonType: 'string', enum: ['image', 'video', 'file'] },
              url: { bsonType: 'string' },
              filename: { bsonType: 'string' },
              size: { bsonType: 'long' },
              mimeType: { bsonType: 'string' }
            }
          }
        },
        
        // Message references and threading
        parentMessageId: { bsonType: 'objectId', description: 'Reply to message ID' },
        threadId: { bsonType: 'objectId', description: 'Thread root message ID' },
        replyCount: { bsonType: 'int', minimum: 0 },
        
        // Reactions and engagement
        reactions: {
          bsonType: 'object',
          patternProperties: {
            '^[a-zA-Z0-9_-]+$': { // Emoji names as keys
              bsonType: 'object',
              properties: {
                count: { bsonType: 'int', minimum: 0 },
                users: {
                  bsonType: 'array',
                  items: { bsonType: 'string' }, // User IDs
                  maxItems: 50
                }
              }
            }
          }
        },
        
        // Moderation
        isDeleted: { bsonType: 'bool' },
        deletedAt: { bsonType: 'date' },
        deletedBy: { bsonType: 'string', description: 'Moderator user ID' },
        deleteReason: { bsonType: 'string', maxLength: 100 },
        
        isEdited: { bsonType: 'bool' },
        editedAt: { bsonType: 'date' },
        originalContent: { bsonType: 'string', description: 'Original message before edit' },
        
        // Mentions and notifications
        mentions: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            properties: {
              userId: { bsonType: 'string' },
              username: { bsonType: 'string' },
              displayName: { bsonType: 'string' }
            }
          }
        },
        
        // Message metadata
        timestamp: { bsonType: 'date' },
        clientId: { bsonType: 'string', description: 'Client-generated message ID for deduplication' },
        ipAddress: { bsonType: 'string' },
        userAgent: { bsonType: 'string' },
        
        expiresAt: { bsonType: 'date', description: 'TTL expiry date' }
      }
    }
  },
  
  indexes: [
    { key: { channelId: 1, timestamp: -1 }, name: 'channel_messages_timeline' },
    { key: { senderId: 1, timestamp: -1 }, name: 'sender_messages_timeline' },
    { key: { channelType: 1, timestamp: -1 }, name: 'channel_type_timeline' },
    { key: { parentMessageId: 1 }, name: 'message_replies', sparse: true },
    { key: { threadId: 1, timestamp: 1 }, name: 'thread_messages', sparse: true },
    { key: { 'mentions.userId': 1, timestamp: -1 }, name: 'user_mentions' },
    { key: { isDeleted: 1, channelId: 1, timestamp: -1 }, name: 'active_messages' },
    { key: { clientId: 1, senderId: 1 }, name: 'deduplication', unique: true, sparse: true },
    { key: { timestamp: -1 }, name: 'global_messages_timeline' },
    { key: { expiresAt: 1 }, name: 'ttl_expiry', expireAfterSeconds: 0 }
  ],
  
  ttlSeconds: 365 * 24 * 60 * 60, // Keep chat messages for 1 year
  shardKey: { channelId: 1, timestamp: 1 }
};

/**
 * Analytics Events Collection
 * Time-series data for user behavior analytics
 */
export const ANALYTICS_EVENTS_COLLECTION = {
  name: 'analytics_events',
  
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'eventType', 'timestamp'],
      properties: {
        _id: { bsonType: 'objectId' },
        userId: { bsonType: 'string', description: 'User UUID' },
        sessionId: { bsonType: 'string', description: 'Session UUID' },
        
        // Event classification
        eventType: {
          bsonType: 'string',
          enum: [
            'page_view', 'content_view', 'content_interaction', 'vote_cast',
            'search_query', 'clan_visit', 'achievement_view', 'wallet_connect',
            'transaction_initiate', 'transaction_complete', 'error_occurred'
          ]
        },
        eventCategory: { bsonType: 'string', maxLength: 50 },
        eventAction: { bsonType: 'string', maxLength: 50 },
        eventLabel: { bsonType: 'string', maxLength: 100 },
        
        // Event data and context
        properties: {
          bsonType: 'object',
          description: 'Event-specific properties',
          additionalProperties: true
        },
        
        // Page and navigation context
        pageUrl: { bsonType: 'string', maxLength: 500 },
        referrer: { bsonType: 'string', maxLength: 500 },
        userAgent: { bsonType: 'string', maxLength: 500 },
        
        // Device and technical context
        deviceInfo: {
          bsonType: 'object',
          properties: {
            type: { bsonType: 'string', enum: ['desktop', 'mobile', 'tablet'] },
            os: { bsonType: 'string' },
            browser: { bsonType: 'string' },
            screenResolution: { bsonType: 'string' },
            viewportSize: { bsonType: 'string' }
          }
        },
        
        // Geographic and network context
        ipAddress: { bsonType: 'string' },
        country: { bsonType: 'string', minLength: 2, maxLength: 2 },
        region: { bsonType: 'string', maxLength: 100 },
        city: { bsonType: 'string', maxLength: 100 },
        
        // Performance metrics
        loadTime: { bsonType: 'int', minimum: 0, description: 'Page load time in milliseconds' },
        networkType: { bsonType: 'string', enum: ['slow-2g', '2g', '3g', '4g', '5g', 'wifi', 'unknown'] },
        
        // Business metrics
        value: { bsonType: 'double', description: 'Monetary or point value of event' },
        conversionGoal: { bsonType: 'string', description: 'Associated conversion goal' },
        
        timestamp: { bsonType: 'date' },
        expiresAt: { bsonType: 'date' }
      }
    }
  },
  
  indexes: [
    { key: { timestamp: -1 }, name: 'timestamp_desc' },
    { key: { userId: 1, timestamp: -1 }, name: 'user_events_timeline' },
    { key: { eventType: 1, timestamp: -1 }, name: 'event_type_timeline' },
    { key: { eventCategory: 1, eventAction: 1, timestamp: -1 }, name: 'category_action_timeline' },
    { key: { sessionId: 1, timestamp: 1 }, name: 'session_events', sparse: true },
    { key: { pageUrl: 1, timestamp: -1 }, name: 'page_analytics' },
    { key: { country: 1, timestamp: -1 }, name: 'geographic_analytics' },
    { key: { 'deviceInfo.type': 1, timestamp: -1 }, name: 'device_analytics' },
    { key: { expiresAt: 1 }, name: 'ttl_expiry', expireAfterSeconds: 0 }
  ],
  
  // Time-series collection optimizations
  timeseries: {
    timeField: 'timestamp',
    metaField: 'userId',
    granularity: 'minutes'
  },
  
  ttlSeconds: 180 * 24 * 60 * 60, // Keep analytics for 6 months
  shardKey: { userId: 1, timestamp: 1 }
};

/**
 * File Metadata Collection
 * Stores metadata for uploaded files and processing status
 */
export const FILE_METADATA_COLLECTION = {
  name: 'file_metadata',
  
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['fileId', 'userId', 'filename', 'fileSize', 'mimeType', 'uploadedAt'],
      properties: {
        _id: { bsonType: 'objectId' },
        fileId: { bsonType: 'string', description: 'Unique file identifier' },
        userId: { bsonType: 'string', description: 'Uploader user UUID' },
        contentId: { bsonType: 'string', description: 'Associated content submission UUID' },
        
        // File basic properties
        filename: { bsonType: 'string', minLength: 1, maxLength: 255 },
        originalFilename: { bsonType: 'string', maxLength: 255 },
        fileSize: { bsonType: 'long', minimum: 0 },
        mimeType: { bsonType: 'string', maxLength: 100 },
        fileType: {
          bsonType: 'string',
          enum: ['video', 'image', 'audio', 'document'],
          description: 'Categorized file type'
        },
        
        // File storage information
        storageProvider: { bsonType: 'string', enum: ['s3', 'cloudflare', 'ipfs', 'local'] },
        storagePath: { bsonType: 'string', maxLength: 500 },
        publicUrl: { bsonType: 'string', maxLength: 500 },
        
        // File processing status
        processingStatus: {
          bsonType: 'string',
          enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
          description: 'File processing status'
        },
        processingStartedAt: { bsonType: 'date' },
        processingCompletedAt: { bsonType: 'date' },
        processingError: { bsonType: 'string', maxLength: 500 },
        processingProgress: { bsonType: 'int', minimum: 0, maximum: 100 },
        
        // Media-specific properties
        mediaProperties: {
          bsonType: 'object',
          properties: {
            duration: { bsonType: 'int', minimum: 0, description: 'Duration in seconds' },
            width: { bsonType: 'int', minimum: 0 },
            height: { bsonType: 'int', minimum: 0 },
            aspectRatio: { bsonType: 'string' },
            bitrate: { bsonType: 'int', minimum: 0 },
            framerate: { bsonType: 'double', minimum: 0 },
            codec: { bsonType: 'string' },
            hasAudio: { bsonType: 'bool' },
            audioCodec: { bsonType: 'string' },
            audioChannels: { bsonType: 'int', minimum: 0 }
          }
        },
        
        // Thumbnails and previews
        thumbnails: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            properties: {
              size: { bsonType: 'string', enum: ['small', 'medium', 'large'] },
              url: { bsonType: 'string' },
              width: { bsonType: 'int' },
              height: { bsonType: 'int' }
            }
          }
        },
        
        // Content analysis results
        contentAnalysis: {
          bsonType: 'object',
          properties: {
            moderationFlags: {
              bsonType: 'array',
              items: { bsonType: 'string' }
            },
            confidenceScores: {
              bsonType: 'object',
              additionalProperties: { bsonType: 'double' }
            },
            detectedObjects: {
              bsonType: 'array',
              items: {
                bsonType: 'object',
                properties: {
                  name: { bsonType: 'string' },
                  confidence: { bsonType: 'double' },
                  boundingBox: {
                    bsonType: 'object',
                    properties: {
                      x: { bsonType: 'int' },
                      y: { bsonType: 'int' },
                      width: { bsonType: 'int' },
                      height: { bsonType: 'int' }
                    }
                  }
                }
              }
            }
          }
        },
        
        // File access and security
        isPublic: { bsonType: 'bool' },
        accessToken: { bsonType: 'string', description: 'Secure access token for private files' },
        downloadCount: { bsonType: 'int', minimum: 0 },
        lastAccessedAt: { bsonType: 'date' },
        
        // Virus scanning
        virusScanStatus: {
          bsonType: 'string',
          enum: ['pending', 'scanning', 'clean', 'infected', 'quarantined'],
          description: 'Virus scan status'
        },
        virusScanResults: {
          bsonType: 'object',
          properties: {
            scannedAt: { bsonType: 'date' },
            scanner: { bsonType: 'string' },
            threats: {
              bsonType: 'array',
              items: { bsonType: 'string' }
            }
          }
        },
        
        uploadedAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' },
        expiresAt: { bsonType: 'date', description: 'TTL expiry date for temporary files' }
      }
    }
  },
  
  indexes: [
    { key: { fileId: 1 }, name: 'file_id', unique: true },
    { key: { userId: 1, uploadedAt: -1 }, name: 'user_files_timeline' },
    { key: { contentId: 1 }, name: 'content_files', sparse: true },
    { key: { processingStatus: 1, processingStartedAt: 1 }, name: 'processing_queue' },
    { key: { fileType: 1, uploadedAt: -1 }, name: 'file_type_timeline' },
    { key: { mimeType: 1 }, name: 'mime_type' },
    { key: { storageProvider: 1, storagePath: 1 }, name: 'storage_location' },
    { key: { virusScanStatus: 1 }, name: 'virus_scan_status' },
    { key: { isPublic: 1, uploadedAt: -1 }, name: 'public_files' },
    { key: { expiresAt: 1 }, name: 'ttl_expiry', expireAfterSeconds: 0 }
  ],
  
  shardKey: { userId: 1, uploadedAt: 1 }
};

/**
 * Cache Collections for Performance Optimization
 */

/**
 * User Cache Collection
 * Cached user data for fast lookups
 */
export const USER_CACHE_COLLECTION = {
  name: 'user_cache',
  
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'cacheKey', 'data', 'createdAt', 'expiresAt'],
      properties: {
        _id: { bsonType: 'objectId' },
        userId: { bsonType: 'string', description: 'User UUID' },
        cacheKey: { bsonType: 'string', maxLength: 100, description: 'Cache key identifier' },
        
        data: {
          bsonType: 'object',
          description: 'Cached data',
          additionalProperties: true
        },
        
        // Cache metadata
        version: { bsonType: 'int', minimum: 1, description: 'Cache version for invalidation' },
        tags: {
          bsonType: 'array',
          items: { bsonType: 'string' },
          description: 'Tags for cache invalidation'
        },
        
        // Access tracking
        hitCount: { bsonType: 'int', minimum: 0 },
        lastAccessedAt: { bsonType: 'date' },
        
        createdAt: { bsonType: 'date' },
        expiresAt: { bsonType: 'date' }
      }
    }
  },
  
  indexes: [
    { key: { userId: 1, cacheKey: 1 }, name: 'user_cache_key', unique: true },
    { key: { tags: 1 }, name: 'cache_tags' },
    { key: { lastAccessedAt: -1 }, name: 'cache_access_timeline' },
    { key: { expiresAt: 1 }, name: 'ttl_expiry', expireAfterSeconds: 0 }
  ],
  
  ttlSeconds: 24 * 60 * 60, // Default cache TTL: 24 hours
  shardKey: { userId: 1 }
};

/**
 * Content Cache Collection
 * Cached content data and computed metrics
 */
export const CONTENT_CACHE_COLLECTION = {
  name: 'content_cache',
  
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['contentId', 'cacheType', 'data', 'createdAt', 'expiresAt'],
      properties: {
        _id: { bsonType: 'objectId' },
        contentId: { bsonType: 'string', description: 'Content UUID' },
        cacheType: {
          bsonType: 'string',
          enum: ['metrics', 'comments', 'related_content', 'trending_score', 'engagement_stats'],
          description: 'Type of cached data'
        },
        
        data: {
          bsonType: 'object',
          description: 'Cached content data',
          additionalProperties: true
        },
        
        // Computed metrics
        computedAt: { bsonType: 'date', description: 'When metrics were computed' },
        computationDuration: { bsonType: 'int', description: 'Computation time in milliseconds' },
        
        createdAt: { bsonType: 'date' },
        expiresAt: { bsonType: 'date' }
      }
    }
  },
  
  indexes: [
    { key: { contentId: 1, cacheType: 1 }, name: 'content_cache_type', unique: true },
    { key: { cacheType: 1, computedAt: -1 }, name: 'cache_type_timeline' },
    { key: { expiresAt: 1 }, name: 'ttl_expiry', expireAfterSeconds: 0 }
  ],
  
  ttlSeconds: 6 * 60 * 60, // Cache TTL: 6 hours
  shardKey: { contentId: 1 }
};

/**
 * Event Logs Collection
 * Audit trail and system logs
 */
export const EVENT_LOGS_COLLECTION = {
  name: 'event_logs',
  
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['eventType', 'timestamp', 'source'],
      properties: {
        _id: { bsonType: 'objectId' },
        
        // Event classification
        eventType: {
          bsonType: 'string',
          enum: [
            'user_action', 'system_event', 'security_event', 'error_event',
            'audit_event', 'performance_event', 'business_event'
          ]
        },
        eventSubtype: { bsonType: 'string', maxLength: 50 },
        
        // Event source and context
        source: { bsonType: 'string', maxLength: 50, description: 'Service or component that generated the event' },
        userId: { bsonType: 'string', description: 'Associated user UUID' },
        sessionId: { bsonType: 'string', description: 'Session UUID' },
        
        // Event details
        message: { bsonType: 'string', maxLength: 500 },
        details: {
          bsonType: 'object',
          description: 'Detailed event data',
          additionalProperties: true
        },
        
        // Severity and impact
        severity: {
          bsonType: 'string',
          enum: ['debug', 'info', 'warn', 'error', 'critical'],
          description: 'Event severity level'
        },
        impact: {
          bsonType: 'string',
          enum: ['none', 'low', 'medium', 'high', 'critical'],
          description: 'Business impact level'
        },
        
        // Technical context
        ipAddress: { bsonType: 'string' },
        userAgent: { bsonType: 'string' },
        requestId: { bsonType: 'string', description: 'Request correlation ID' },
        traceId: { bsonType: 'string', description: 'Distributed tracing ID' },
        
        // Related entities
        relatedEntities: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            properties: {
              type: { bsonType: 'string', enum: ['user', 'clan', 'content', 'transaction'] },
              id: { bsonType: 'string' },
              metadata: { bsonType: 'object' }
            }
          }
        },
        
        // Error information (if applicable)
        errorInfo: {
          bsonType: 'object',
          properties: {
            code: { bsonType: 'string' },
            message: { bsonType: 'string' },
            stack: { bsonType: 'string' },
            context: { bsonType: 'object' }
          }
        },
        
        timestamp: { bsonType: 'date' },
        expiresAt: { bsonType: 'date' }
      }
    }
  },
  
  indexes: [
    { key: { timestamp: -1 }, name: 'timestamp_desc' },
    { key: { eventType: 1, timestamp: -1 }, name: 'event_type_timeline' },
    { key: { severity: 1, timestamp: -1 }, name: 'severity_timeline' },
    { key: { userId: 1, timestamp: -1 }, name: 'user_events', sparse: true },
    { key: { source: 1, timestamp: -1 }, name: 'source_events' },
    { key: { requestId: 1 }, name: 'request_correlation', sparse: true },
    { key: { traceId: 1 }, name: 'trace_correlation', sparse: true },
    { key: { expiresAt: 1 }, name: 'ttl_expiry', expireAfterSeconds: 0 }
  ],
  
  // Time-series collection for logs
  timeseries: {
    timeField: 'timestamp',
    metaField: 'source',
    granularity: 'seconds'
  },
  
  ttlSeconds: 30 * 24 * 60 * 60, // Keep logs for 30 days
  shardKey: { source: 1, timestamp: 1 }
};

/**
 * Collection Creation and Initialization Functions
 */

/**
 * Initialize all MongoDB collections with validation and indexes
 * @param {MongoClient} client - MongoDB client instance
 * @returns {Promise<Object>} - Collection creation results
 */
export async function initializeCollections(client) {
  const db = client.db(MONGODB_CONFIG.database);
  const results = {};
  
  // Collection definitions
  const collections = [
    ACTIVITY_FEEDS_COLLECTION,
    NOTIFICATIONS_COLLECTION,
    CHAT_MESSAGES_COLLECTION,
    ANALYTICS_EVENTS_COLLECTION,
    FILE_METADATA_COLLECTION,
    USER_CACHE_COLLECTION,
    CONTENT_CACHE_COLLECTION,
    EVENT_LOGS_COLLECTION
  ];
  
  for (const collectionDef of collections) {
    try {
      console.log(`Initializing collection: ${collectionDef.name}`);
      
      // Create collection with validation
      const collection = await db.createCollection(collectionDef.name, {
        validator: collectionDef.validator,
        ...MONGODB_CONFIG.collectionOptions,
        ...(collectionDef.timeseries && { timeseries: collectionDef.timeseries })
      });
      
      // Create indexes
      if (collectionDef.indexes && collectionDef.indexes.length > 0) {
        await collection.createIndexes(collectionDef.indexes);
      }
      
      results[collectionDef.name] = {
        created: true,
        indexCount: collectionDef.indexes ? collectionDef.indexes.length : 0
      };
      
      console.log(`✓ Collection ${collectionDef.name} initialized with ${results[collectionDef.name].indexCount} indexes`);
      
    } catch (error) {
      console.error(`Error initializing collection ${collectionDef.name}:`, error);
      results[collectionDef.name] = {
        created: false,
        error: error.message
      };
    }
  }
  
  return results;
}

/**
 * Health check function for MongoDB collections
 * @param {MongoClient} client - MongoDB client instance
 * @returns {Promise<Object>} - Health check results
 */
export async function healthCheck(client) {
  const db = client.db(MONGODB_CONFIG.database);
  const health = {
    status: 'healthy',
    collections: {},
    totalDocuments: 0,
    errors: []
  };
  
  const collections = [
    'activity_feeds', 'notifications', 'chat_messages', 'analytics_events',
    'file_metadata', 'user_cache', 'content_cache', 'event_logs'
  ];
  
  for (const collectionName of collections) {
    try {
      const collection = db.collection(collectionName);
      const stats = await collection.stats();
      const documentCount = await collection.countDocuments();
      
      health.collections[collectionName] = {
        status: 'ok',
        documentCount,
        avgDocSize: stats.avgObjSize || 0,
        storageSize: stats.storageSize || 0,
        indexCount: stats.nindexes || 0
      };
      
      health.totalDocuments += documentCount;
      
    } catch (error) {
      health.collections[collectionName] = {
        status: 'error',
        error: error.message
      };
      health.errors.push(`Collection ${collectionName}: ${error.message}`);
    }
  }
  
  if (health.errors.length > 0) {
    health.status = 'degraded';
  }
  
  return health;
}

/**
 * Cleanup expired documents across all collections
 * @param {MongoClient} client - MongoDB client instance
 * @returns {Promise<Object>} - Cleanup results
 */
export async function cleanupExpiredDocuments(client) {
  const db = client.db(MONGODB_CONFIG.database);
  const results = {
    totalCleaned: 0,
    collections: {}
  };
  
  const cleanupTasks = [
    { collection: 'activity_feeds', field: 'expiresAt' },
    { collection: 'notifications', field: 'expiresAt' },
    { collection: 'chat_messages', field: 'expiresAt' },
    { collection: 'analytics_events', field: 'expiresAt' },
    { collection: 'file_metadata', field: 'expiresAt' },
    { collection: 'user_cache', field: 'expiresAt' },
    { collection: 'content_cache', field: 'expiresAt' },
    { collection: 'event_logs', field: 'expiresAt' }
  ];
  
  for (const task of cleanupTasks) {
    try {
      const collection = db.collection(task.collection);
      const result = await collection.deleteMany({
        [task.field]: { $lt: new Date() }
      });
      
      results.collections[task.collection] = {
        deletedCount: result.deletedCount
      };
      results.totalCleaned += result.deletedCount;
      
    } catch (error) {
      results.collections[task.collection] = {
        error: error.message
      };
    }
  }
  
  return results;
}

/**
 * Export all collection definitions for external use
 */
export const COLLECTIONS = {
  ACTIVITY_FEEDS: ACTIVITY_FEEDS_COLLECTION,
  NOTIFICATIONS: NOTIFICATIONS_COLLECTION,
  CHAT_MESSAGES: CHAT_MESSAGES_COLLECTION,
  ANALYTICS_EVENTS: ANALYTICS_EVENTS_COLLECTION,
  FILE_METADATA: FILE_METADATA_COLLECTION,
  USER_CACHE: USER_CACHE_COLLECTION,
  CONTENT_CACHE: CONTENT_CACHE_COLLECTION,
  EVENT_LOGS: EVENT_LOGS_COLLECTION
};

console.log('MLG.clan MongoDB Collections Schema loaded successfully');
console.log('Total collections defined:', Object.keys(COLLECTIONS).length);