/**
 * @fileoverview Gaming Media Handler for CDN
 * Specialized handling for gaming content: textures, audio, video clips, 3D models, etc.
 */

import { EventEmitter } from 'events';

/**
 * Gaming Media Handler
 */
export class GamingMediaHandler extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Gaming asset types
      supportedAssets: {
        textures: ['dds', 'ktx', 'astc', 'etc2', 'png', 'jpg', 'tga', 'exr', 'hdr'],
        models: ['gltf', 'glb', 'fbx', 'obj', 'dae', 'blend', '3ds', 'ply'],
        audio: ['ogg', 'wav', 'mp3', 'aac', 'flac', 'wem', 'fsb'],
        video: ['mp4', 'webm', 'mov', 'avi', 'mkv', 'ogv'],
        shaders: ['glsl', 'hlsl', 'spv', 'cso', 'fxc'],
        data: ['json', 'xml', 'yaml', 'bin', 'dat', 'pak', 'zip'],
        fonts: ['ttf', 'otf', 'woff', 'woff2', 'eot']
      },
      
      // Optimization settings
      optimization: {
        textureCompression: config.optimization?.textureCompression !== false,
        modelOptimization: config.optimization?.modelOptimization !== false,
        audioCompression: config.optimization?.audioCompression !== false,
        shaderMinification: config.optimization?.shaderMinification !== false,
        ...config.optimization
      },
      
      // Quality levels
      qualityProfiles: {
        mobile: {
          textureSize: 512,
          audioQuality: 128, // kbps
          modelLOD: 'low',
          compressionLevel: 'high'
        },
        desktop: {
          textureSize: 1024,
          audioQuality: 192,
          modelLOD: 'medium',
          compressionLevel: 'medium'
        },
        highEnd: {
          textureSize: 2048,
          audioQuality: 320,
          modelLOD: 'high',
          compressionLevel: 'low'
        },
        ultra: {
          textureSize: 4096,
          audioQuality: 'lossless',
          modelLOD: 'ultra',
          compressionLevel: 'none'
        }
      },
      
      // Platform-specific settings
      platformOptimizations: {
        web: {
          preferredFormats: {
            texture: ['ktx2', 'webp', 'jpg'],
            model: ['gltf', 'glb'],
            audio: ['ogg', 'mp3'],
            video: ['webm', 'mp4']
          },
          compressionSupport: ['gzip', 'brotli']
        },
        mobile: {
          preferredFormats: {
            texture: ['astc', 'etc2', 'jpg'],
            model: ['gltf'],
            audio: ['aac', 'ogg'],
            video: ['mp4', 'webm']
          },
          memoryLimits: {
            texture: 256 * 1024 * 1024, // 256MB
            model: 64 * 1024 * 1024,    // 64MB
            audio: 32 * 1024 * 1024     // 32MB
          }
        },
        console: {
          preferredFormats: {
            texture: ['dds', 'ktx'],
            model: ['fbx', 'gltf'],
            audio: ['wav', 'ogg'],
            video: ['mp4', 'mov']
          },
          highQuality: true
        }
      },
      
      // Streaming settings
      streaming: {
        enableProgressiveLoading: config.streaming?.enableProgressiveLoading !== false,
        chunkSize: config.streaming?.chunkSize || 1024 * 1024, // 1MB
        preloadDistance: config.streaming?.preloadDistance || 100, // units
        priorityLevels: config.streaming?.priorityLevels || ['critical', 'high', 'normal', 'low'],
        ...config.streaming
      },
      
      ...config
    };
    
    this.assetCache = new Map();
    this.loadingQueue = [];
    this.streamingConnections = new Map();
    this.optimizationTasks = new Map();
    this.performanceMetrics = {
      texturesLoaded: 0,
      modelsLoaded: 0,
      audioLoaded: 0,
      averageLoadTime: 0,
      compressionRatio: 0,
      cacheHitRate: 0
    };
    
    this.initializeGamingHandler();
  }

  /**
   * Initialize gaming media handler
   */
  initializeGamingHandler() {
    this.setupAssetPreprocessing();
    this.initializeProgressiveLoading();
    this.startPerformanceTracking();
  }

  /**
   * Handle gaming asset request
   * @param {Object} request - Asset request
   * @returns {Promise<Object>} - Asset response
   */
  async handleAssetRequest(request) {
    const {
      assetPath,
      assetType,
      platform = 'web',
      quality = 'medium',
      userContext = {},
      streaming = false,
      priority = 'normal'
    } = request;
    
    try {
      // Detect asset type if not provided
      const detectedType = assetType || this.detectAssetType(assetPath);
      
      // Check cache first
      const cached = this.checkAssetCache(assetPath, platform, quality);
      if (cached) {
        this.recordCacheHit();
        return cached;
      }
      
      // Determine optimal format and settings
      const optimization = this.determineOptimization(
        detectedType, 
        platform, 
        quality, 
        userContext
      );
      
      // Handle streaming vs regular loading
      if (streaming) {
        return await this.handleStreamingAsset(assetPath, optimization, priority);
      } else {
        return await this.handleStaticAsset(assetPath, optimization);
      }
    } catch (error) {
      console.error('Gaming asset handling failed:', error);
      throw new Error(`Failed to handle gaming asset: ${error.message}`);
    }
  }

  /**
   * Detect asset type from file path
   * @param {string} assetPath - Asset file path
   * @returns {string} - Asset type
   */
  detectAssetType(assetPath) {
    const extension = assetPath.split('.').pop()?.toLowerCase();
    if (!extension) return 'unknown';
    
    for (const [type, extensions] of Object.entries(this.config.supportedAssets)) {
      if (extensions.includes(extension)) {
        return type;
      }
    }
    
    return 'unknown';
  }

  /**
   * Check asset cache
   * @param {string} assetPath - Asset path
   * @param {string} platform - Target platform
   * @param {string} quality - Quality level
   * @returns {Object|null} - Cached asset or null
   */
  checkAssetCache(assetPath, platform, quality) {
    const cacheKey = `${assetPath}|${platform}|${quality}`;
    const cached = this.assetCache.get(cacheKey);
    
    if (cached && !this.isCacheExpired(cached)) {
      return {
        data: cached.data,
        metadata: cached.metadata,
        fromCache: true,
        cacheAge: Date.now() - cached.timestamp
      };
    }
    
    return null;
  }

  /**
   * Check if cache entry is expired
   * @param {Object} cacheEntry - Cache entry
   * @returns {boolean} - Is expired
   */
  isCacheExpired(cacheEntry) {
    const maxAge = 3600000; // 1 hour for gaming assets
    return (Date.now() - cacheEntry.timestamp) > maxAge;
  }

  /**
   * Determine optimization settings
   * @param {string} assetType - Asset type
   * @param {string} platform - Target platform
   * @param {string} quality - Quality level
   * @param {Object} userContext - User context
   * @returns {Object} - Optimization settings
   */
  determineOptimization(assetType, platform, quality, userContext) {
    const platformConfig = this.config.platformOptimizations[platform] || 
                          this.config.platformOptimizations.web;
    const qualityProfile = this.config.qualityProfiles[quality] || 
                          this.config.qualityProfiles.desktop;
    
    const optimization = {
      platform,
      quality,
      assetType,
      preferredFormats: platformConfig.preferredFormats[assetType] || [],
      qualitySettings: qualityProfile,
      compressionSupport: platformConfig.compressionSupport || [],
      memoryLimits: platformConfig.memoryLimits || {},
      adaptations: this.calculateAdaptations(userContext, qualityProfile)
    };
    
    return optimization;
  }

  /**
   * Calculate adaptations based on user context
   * @param {Object} userContext - User context
   * @param {Object} qualityProfile - Quality profile
   * @returns {Object} - Adaptations
   */
  calculateAdaptations(userContext, qualityProfile) {
    const adaptations = {};
    
    // Connection-based adaptations
    if (userContext.connectionSpeed) {
      if (userContext.connectionSpeed < 5) {
        // Slow connection - reduce quality
        adaptations.textureSize = Math.min(qualityProfile.textureSize, 512);
        adaptations.audioQuality = Math.min(qualityProfile.audioQuality, 128);
        adaptations.compressionLevel = 'high';
      } else if (userContext.connectionSpeed > 50) {
        // Fast connection - can handle higher quality
        adaptations.textureSize = qualityProfile.textureSize * 1.5;
        adaptations.compressionLevel = 'low';
      }
    }
    
    // Memory-based adaptations
    if (userContext.deviceMemory && userContext.deviceMemory < 4) {
      // Low memory device
      adaptations.textureSize = Math.min(adaptations.textureSize || qualityProfile.textureSize, 1024);
      adaptations.modelLOD = 'low';
    }
    
    // CPU-based adaptations
    if (userContext.hardwareConcurrency && userContext.hardwareConcurrency < 4) {
      // Lower processing power
      adaptations.compressionLevel = 'medium'; // Balance between size and decode time
    }
    
    return adaptations;
  }

  /**
   * Handle static asset loading
   * @param {string} assetPath - Asset path
   * @param {Object} optimization - Optimization settings
   * @returns {Promise<Object>} - Asset data
   */
  async handleStaticAsset(assetPath, optimization) {
    const startTime = Date.now();
    
    try {
      // Load original asset
      const originalAsset = await this.loadOriginalAsset(assetPath);
      
      // Apply optimizations
      const optimizedAsset = await this.optimizeAsset(originalAsset, optimization);
      
      // Cache the result
      this.cacheAsset(assetPath, optimization, optimizedAsset);
      
      // Record metrics
      this.recordAssetLoad(optimization.assetType, Date.now() - startTime);
      
      return {
        data: optimizedAsset.data,
        metadata: {
          ...optimizedAsset.metadata,
          originalSize: originalAsset.size,
          optimizedSize: optimizedAsset.size,
          compressionRatio: originalAsset.size / optimizedAsset.size,
          loadTime: Date.now() - startTime,
          optimization: optimization
        },
        fromCache: false
      };
    } catch (error) {
      console.error('Static asset handling failed:', error);
      throw error;
    }
  }

  /**
   * Handle streaming asset
   * @param {string} assetPath - Asset path
   * @param {Object} optimization - Optimization settings
   * @param {string} priority - Loading priority
   * @returns {Promise<Object>} - Streaming response
   */
  async handleStreamingAsset(assetPath, optimization, priority) {
    const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Create streaming connection
      const streamConnection = {
        id: streamId,
        assetPath,
        optimization,
        priority,
        chunks: [],
        totalSize: 0,
        loadedSize: 0,
        startTime: Date.now(),
        status: 'initializing'
      };
      
      this.streamingConnections.set(streamId, streamConnection);
      
      // Initialize streaming
      const assetInfo = await this.initializeAssetStreaming(streamConnection);
      
      return {
        streamId,
        streamUrl: `/cdn/stream/${streamId}`,
        totalSize: assetInfo.totalSize,
        chunkSize: this.config.streaming.chunkSize,
        metadata: assetInfo.metadata,
        estimatedLoadTime: this.estimateStreamingTime(assetInfo.totalSize),
        streaming: true
      };
    } catch (error) {
      console.error('Streaming asset initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize asset streaming
   * @param {Object} streamConnection - Stream connection object
   * @returns {Promise<Object>} - Asset info
   */
  async initializeAssetStreaming(streamConnection) {
    // Load asset metadata first
    const assetInfo = await this.loadAssetInfo(streamConnection.assetPath);
    
    // Prepare chunks based on asset type
    const chunks = await this.prepareAssetChunks(
      streamConnection.assetPath, 
      streamConnection.optimization,
      assetInfo
    );
    
    streamConnection.chunks = chunks;
    streamConnection.totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    streamConnection.status = 'ready';
    
    return {
      totalSize: streamConnection.totalSize,
      chunkCount: chunks.length,
      metadata: assetInfo.metadata
    };
  }

  /**
   * Load original asset
   * @param {string} assetPath - Asset path
   * @returns {Promise<Object>} - Original asset data
   */
  async loadOriginalAsset(assetPath) {
    // In production, this would load from file system or origin server
    // For now, return mock data
    const mockData = Buffer.from(`mock-asset-data-${assetPath}`);
    
    return {
      path: assetPath,
      data: mockData,
      size: mockData.length,
      mimeType: this.getMimeType(assetPath),
      metadata: {
        width: 1024,
        height: 1024,
        channels: 4,
        format: 'rgba'
      }
    };
  }

  /**
   * Load asset information
   * @param {string} assetPath - Asset path
   * @returns {Promise<Object>} - Asset information
   */
  async loadAssetInfo(assetPath) {
    // Mock implementation
    return {
      size: 2048576, // 2MB
      type: this.detectAssetType(assetPath),
      metadata: {
        dimensions: { width: 1024, height: 1024 },
        format: 'png',
        hasAlpha: true
      }
    };
  }

  /**
   * Optimize asset based on settings
   * @param {Object} originalAsset - Original asset
   * @param {Object} optimization - Optimization settings
   * @returns {Promise<Object>} - Optimized asset
   */
  async optimizeAsset(originalAsset, optimization) {
    const { assetType, quality, preferredFormats, adaptations } = optimization;
    
    switch (assetType) {
      case 'textures':
        return await this.optimizeTexture(originalAsset, optimization);
      
      case 'models':
        return await this.optimizeModel(originalAsset, optimization);
      
      case 'audio':
        return await this.optimizeAudio(originalAsset, optimization);
      
      case 'video':
        return await this.optimizeVideo(originalAsset, optimization);
      
      case 'shaders':
        return await this.optimizeShader(originalAsset, optimization);
      
      default:
        return await this.optimizeGenericAsset(originalAsset, optimization);
    }
  }

  /**
   * Optimize texture asset
   * @param {Object} originalAsset - Original texture
   * @param {Object} optimization - Optimization settings
   * @returns {Promise<Object>} - Optimized texture
   */
  async optimizeTexture(originalAsset, optimization) {
    const { preferredFormats, qualitySettings, adaptations } = optimization;
    
    // Determine target size
    const targetSize = adaptations.textureSize || qualitySettings.textureSize;
    
    // Choose best format
    const targetFormat = this.selectBestFormat(preferredFormats, 'texture');
    
    // Mock optimization process
    const compressionRatio = this.getCompressionRatio(targetFormat, qualitySettings.compressionLevel);
    const optimizedSize = Math.floor(originalAsset.size / compressionRatio);
    
    return {
      data: Buffer.alloc(optimizedSize, 'optimized-texture'),
      size: optimizedSize,
      metadata: {
        ...originalAsset.metadata,
        format: targetFormat,
        size: targetSize,
        compressionRatio: compressionRatio,
        quality: qualitySettings.compressionLevel
      }
    };
  }

  /**
   * Optimize 3D model asset
   * @param {Object} originalAsset - Original model
   * @param {Object} optimization - Optimization settings
   * @returns {Promise<Object>} - Optimized model
   */
  async optimizeModel(originalAsset, optimization) {
    const { preferredFormats, qualitySettings, adaptations } = optimization;
    
    const targetFormat = this.selectBestFormat(preferredFormats, 'model');
    const lodLevel = adaptations.modelLOD || qualitySettings.modelLOD;
    
    // LOD reduction ratios
    const lodReduction = {
      'low': 0.3,
      'medium': 0.6,
      'high': 0.8,
      'ultra': 1.0
    };
    
    const reductionFactor = lodReduction[lodLevel] || 0.6;
    const optimizedSize = Math.floor(originalAsset.size * reductionFactor);
    
    return {
      data: Buffer.alloc(optimizedSize, 'optimized-model'),
      size: optimizedSize,
      metadata: {
        ...originalAsset.metadata,
        format: targetFormat,
        lodLevel: lodLevel,
        vertexReduction: 1 - reductionFactor,
        triangleCount: Math.floor(50000 * reductionFactor)
      }
    };
  }

  /**
   * Optimize audio asset
   * @param {Object} originalAsset - Original audio
   * @param {Object} optimization - Optimization settings
   * @returns {Promise<Object>} - Optimized audio
   */
  async optimizeAudio(originalAsset, optimization) {
    const { preferredFormats, qualitySettings, adaptations } = optimization;
    
    const targetFormat = this.selectBestFormat(preferredFormats, 'audio');
    const targetQuality = adaptations.audioQuality || qualitySettings.audioQuality;
    
    // Estimate size based on bitrate and duration (assume 60 seconds)
    const duration = 60;
    const bitrate = typeof targetQuality === 'number' ? targetQuality : 192;
    const estimatedSize = (bitrate * 1000 * duration) / 8; // Convert to bytes
    
    return {
      data: Buffer.alloc(estimatedSize, 'optimized-audio'),
      size: estimatedSize,
      metadata: {
        ...originalAsset.metadata,
        format: targetFormat,
        bitrate: bitrate,
        duration: duration,
        quality: targetQuality
      }
    };
  }

  /**
   * Optimize video asset
   * @param {Object} originalAsset - Original video
   * @param {Object} optimization - Optimization settings
   * @returns {Promise<Object>} - Optimized video
   */
  async optimizeVideo(originalAsset, optimization) {
    const { preferredFormats, qualitySettings } = optimization;
    
    const targetFormat = this.selectBestFormat(preferredFormats, 'video');
    
    // Mock video optimization
    const compressionRatio = targetFormat === 'webm' ? 2.5 : 2.0;
    const optimizedSize = Math.floor(originalAsset.size / compressionRatio);
    
    return {
      data: Buffer.alloc(optimizedSize, 'optimized-video'),
      size: optimizedSize,
      metadata: {
        ...originalAsset.metadata,
        format: targetFormat,
        resolution: '1080p',
        fps: 30,
        compressionRatio: compressionRatio
      }
    };
  }

  /**
   * Optimize shader asset
   * @param {Object} originalAsset - Original shader
   * @param {Object} optimization - Optimization settings
   * @returns {Promise<Object>} - Optimized shader
   */
  async optimizeShader(originalAsset, optimization) {
    const { qualitySettings } = optimization;
    
    // Shader minification reduces size by ~30%
    const minificationReduction = qualitySettings.compressionLevel === 'high' ? 0.7 : 0.85;
    const optimizedSize = Math.floor(originalAsset.size * minificationReduction);
    
    return {
      data: Buffer.alloc(optimizedSize, 'minified-shader'),
      size: optimizedSize,
      metadata: {
        ...originalAsset.metadata,
        minified: true,
        sizeReduction: 1 - minificationReduction,
        preservesSemantics: true
      }
    };
  }

  /**
   * Optimize generic asset
   * @param {Object} originalAsset - Original asset
   * @param {Object} optimization - Optimization settings
   * @returns {Promise<Object>} - Optimized asset
   */
  async optimizeGenericAsset(originalAsset, optimization) {
    const { compressionSupport } = optimization;
    
    // Apply generic compression if supported
    const compressionRatio = compressionSupport.includes('brotli') ? 3.0 :
                            compressionSupport.includes('gzip') ? 2.5 : 1.0;
    
    const optimizedSize = Math.floor(originalAsset.size / compressionRatio);
    
    return {
      data: Buffer.alloc(optimizedSize, 'compressed-asset'),
      size: optimizedSize,
      metadata: {
        ...originalAsset.metadata,
        compression: compressionSupport.length > 0 ? compressionSupport[0] : 'none',
        compressionRatio: compressionRatio
      }
    };
  }

  /**
   * Select best format from preferred formats
   * @param {Array} preferredFormats - Preferred formats array
   * @param {string} assetType - Asset type
   * @returns {string} - Best format
   */
  selectBestFormat(preferredFormats, assetType) {
    if (!preferredFormats || preferredFormats.length === 0) {
      // Default formats for each asset type
      const defaults = {
        texture: 'jpg',
        model: 'gltf',
        audio: 'ogg',
        video: 'mp4',
        shader: 'glsl'
      };
      return defaults[assetType] || 'bin';
    }
    
    return preferredFormats[0];
  }

  /**
   * Get compression ratio for format and level
   * @param {string} format - Target format
   * @param {string} level - Compression level
   * @returns {number} - Compression ratio
   */
  getCompressionRatio(format, level) {
    const ratios = {
      'jpg': { high: 8, medium: 5, low: 3 },
      'webp': { high: 10, medium: 6, low: 4 },
      'avif': { high: 12, medium: 8, low: 5 },
      'ktx2': { high: 6, medium: 4, low: 2.5 },
      'astc': { high: 8, medium: 5, low: 3 }
    };
    
    return ratios[format]?.[level] || 2;
  }

  /**
   * Prepare asset chunks for streaming
   * @param {string} assetPath - Asset path
   * @param {Object} optimization - Optimization settings
   * @param {Object} assetInfo - Asset information
   * @returns {Promise<Array>} - Array of chunks
   */
  async prepareAssetChunks(assetPath, optimization, assetInfo) {
    const chunkSize = this.config.streaming.chunkSize;
    const totalSize = assetInfo.size;
    const chunkCount = Math.ceil(totalSize / chunkSize);
    
    const chunks = [];
    
    for (let i = 0; i < chunkCount; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, totalSize);
      const size = end - start;
      
      chunks.push({
        index: i,
        start,
        end,
        size,
        priority: this.calculateChunkPriority(i, chunkCount, optimization.assetType),
        url: `/cdn/chunk/${assetPath}/${i}`
      });
    }
    
    return chunks;
  }

  /**
   * Calculate chunk priority for streaming
   * @param {number} chunkIndex - Chunk index
   * @param {number} totalChunks - Total number of chunks
   * @param {string} assetType - Asset type
   * @returns {string} - Priority level
   */
  calculateChunkPriority(chunkIndex, totalChunks, assetType) {
    // First chunk is always critical
    if (chunkIndex === 0) return 'critical';
    
    // For textures, prioritize lower-resolution data first
    if (assetType === 'textures') {
      if (chunkIndex < totalChunks * 0.25) return 'high';
      if (chunkIndex < totalChunks * 0.5) return 'normal';
      return 'low';
    }
    
    // For models, prioritize base geometry
    if (assetType === 'models') {
      if (chunkIndex < totalChunks * 0.3) return 'high';
      return 'normal';
    }
    
    // For audio/video, prioritize beginning
    if (assetType === 'audio' || assetType === 'video') {
      if (chunkIndex < totalChunks * 0.1) return 'high';
      return 'normal';
    }
    
    return 'normal';
  }

  /**
   * Cache asset
   * @param {string} assetPath - Asset path
   * @param {Object} optimization - Optimization settings
   * @param {Object} optimizedAsset - Optimized asset data
   */
  cacheAsset(assetPath, optimization, optimizedAsset) {
    const cacheKey = `${assetPath}|${optimization.platform}|${optimization.quality}`;
    
    this.assetCache.set(cacheKey, {
      data: optimizedAsset.data,
      metadata: optimizedAsset.metadata,
      timestamp: Date.now(),
      size: optimizedAsset.size
    });
    
    // Limit cache size (remove oldest entries if needed)
    if (this.assetCache.size > 1000) {
      const oldestKey = this.assetCache.keys().next().value;
      this.assetCache.delete(oldestKey);
    }
  }

  /**
   * Get MIME type for asset
   * @param {string} assetPath - Asset path
   * @returns {string} - MIME type
   */
  getMimeType(assetPath) {
    const extension = assetPath.split('.').pop()?.toLowerCase();
    
    const mimeTypes = {
      // Textures
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      avif: 'image/avif',
      dds: 'image/vnd-ms.dds',
      ktx: 'image/ktx',
      
      // Models
      gltf: 'model/gltf+json',
      glb: 'model/gltf-binary',
      fbx: 'application/octet-stream',
      obj: 'text/plain',
      
      // Audio
      mp3: 'audio/mpeg',
      ogg: 'audio/ogg',
      wav: 'audio/wav',
      aac: 'audio/aac',
      
      // Video
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
      
      // Shaders
      glsl: 'text/plain',
      hlsl: 'text/plain',
      
      // Data
      json: 'application/json',
      xml: 'application/xml',
      bin: 'application/octet-stream'
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
  }

  /**
   * Estimate streaming time
   * @param {number} totalSize - Total asset size
   * @returns {number} - Estimated time in milliseconds
   */
  estimateStreamingTime(totalSize) {
    // Assume average connection speed of 10 Mbps
    const averageSpeed = 10 * 1024 * 1024 / 8; // Convert to bytes per second
    return Math.ceil((totalSize / averageSpeed) * 1000);
  }

  /**
   * Setup asset preprocessing
   */
  setupAssetPreprocessing() {
    // This would set up background processes for asset optimization
    console.log('Gaming asset preprocessing initialized');
  }

  /**
   * Initialize progressive loading
   */
  initializeProgressiveLoading() {
    if (!this.config.streaming.enableProgressiveLoading) return;
    
    // Set up progressive loading queues
    this.loadingQueue = [];
    console.log('Progressive loading system initialized');
  }

  /**
   * Start performance tracking
   */
  startPerformanceTracking() {
    setInterval(() => {
      this.updatePerformanceMetrics();
    }, 60000); // Update every minute
  }

  /**
   * Record cache hit
   */
  recordCacheHit() {
    // Update cache hit rate
    const totalRequests = this.performanceMetrics.texturesLoaded + 
                         this.performanceMetrics.modelsLoaded + 
                         this.performanceMetrics.audioLoaded;
    
    if (totalRequests > 0) {
      this.performanceMetrics.cacheHitRate = 
        (this.performanceMetrics.cacheHitRate * (totalRequests - 1) + 1) / totalRequests;
    }
  }

  /**
   * Record asset load
   * @param {string} assetType - Asset type
   * @param {number} loadTime - Load time in milliseconds
   */
  recordAssetLoad(assetType, loadTime) {
    // Update type-specific counters
    const typeCounters = {
      'textures': 'texturesLoaded',
      'models': 'modelsLoaded',
      'audio': 'audioLoaded'
    };
    
    const counter = typeCounters[assetType];
    if (counter) {
      this.performanceMetrics[counter]++;
    }
    
    // Update average load time
    const totalLoads = Object.values(typeCounters).reduce(
      (sum, key) => sum + this.performanceMetrics[key], 0
    );
    
    this.performanceMetrics.averageLoadTime = 
      (this.performanceMetrics.averageLoadTime * (totalLoads - 1) + loadTime) / totalLoads;
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics() {
    // Calculate cache efficiency
    const cacheSize = this.assetCache.size;
    const totalMemory = Array.from(this.assetCache.values())
      .reduce((sum, entry) => sum + entry.size, 0);
    
    console.log(`Gaming Media Cache: ${cacheSize} assets, ${(totalMemory / 1024 / 1024).toFixed(2)}MB`);
  }

  /**
   * Get gaming media statistics
   * @returns {Object} - Statistics
   */
  getStatistics() {
    return {
      cache: {
        size: this.assetCache.size,
        hitRate: this.performanceMetrics.cacheHitRate,
        totalMemory: Array.from(this.assetCache.values())
          .reduce((sum, entry) => sum + entry.size, 0)
      },
      performance: {
        ...this.performanceMetrics
      },
      streaming: {
        activeStreams: this.streamingConnections.size,
        enabledFeatures: {
          progressiveLoading: this.config.streaming.enableProgressiveLoading,
          textureCompression: this.config.optimization.textureCompression,
          modelOptimization: this.config.optimization.modelOptimization
        }
      },
      supportedAssets: this.config.supportedAssets
    };
  }

  /**
   * Clear cache
   * @param {string} pattern - Optional pattern to match
   */
  clearCache(pattern = null) {
    if (pattern) {
      for (const [key] of this.assetCache) {
        if (key.includes(pattern)) {
          this.assetCache.delete(key);
        }
      }
    } else {
      this.assetCache.clear();
    }
    
    console.log(`Gaming media cache cleared${pattern ? ` (pattern: ${pattern})` : ''}`);
  }
}

/**
 * Create and export default gaming media handler
 */
export const gamingMediaHandler = new GamingMediaHandler();

/**
 * Express middleware for gaming media handling
 * @param {Object} options - Middleware options
 * @returns {Function} - Express middleware function
 */
export function gamingMediaMiddleware(options = {}) {
  return async (req, res, next) => {
    const assetPath = req.path;
    const assetType = gamingMediaHandler.detectAssetType(assetPath);
    
    // Check if this is a gaming asset
    if (assetType === 'unknown') {
      return next();
    }
    
    try {
      const userContext = {
        deviceType: req.get('x-device-type') || 'desktop',
        connectionSpeed: req.get('x-connection-speed') ? 
          parseFloat(req.get('x-connection-speed')) : null,
        deviceMemory: req.get('x-device-memory') ? 
          parseFloat(req.get('x-device-memory')) : null,
        hardwareConcurrency: req.get('x-hardware-concurrency') ? 
          parseInt(req.get('x-hardware-concurrency')) : null
      };
      
      const platform = req.query.platform || 'web';
      const quality = req.query.quality || 'medium';
      const streaming = req.query.stream === 'true';
      
      const result = await gamingMediaHandler.handleAssetRequest({
        assetPath,
        assetType,
        platform,
        quality,
        userContext,
        streaming,
        priority: req.query.priority || 'normal'
      });
      
      if (result.streaming) {
        // Return streaming info
        res.json(result);
      } else {
        // Return optimized asset
        res.set({
          'Content-Type': gamingMediaHandler.getMimeType(assetPath),
          'Content-Length': result.data.length,
          'X-Gaming-Optimized': 'true',
          'X-Original-Size': result.metadata.originalSize,
          'X-Compression-Ratio': result.metadata.compressionRatio.toFixed(2),
          'X-Cache-Status': result.fromCache ? 'HIT' : 'MISS'
        });
        
        res.send(result.data);
      }
    } catch (error) {
      console.error('Gaming media middleware error:', error);
      next();
    }
  };
}