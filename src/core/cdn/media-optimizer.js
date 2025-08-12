/**
 * @fileoverview Media Optimization Pipeline for CDN
 * Handles image optimization, video transcoding, and format conversion
 */

/**
 * Media Optimization Pipeline Manager
 */
export class MediaOptimizer {
  constructor(config = {}) {
    this.config = {
      imageFormats: ['webp', 'avif', 'jpeg', 'png'],
      videoFormats: ['mp4', 'webm', 'hls'],
      audioFormats: ['mp3', 'ogg', 'aac'],
      qualityLevels: {
        low: 60,
        medium: 80,
        high: 95,
        lossless: 100
      },
      imageSizes: {
        thumbnail: { width: 150, height: 150 },
        small: { width: 400, height: 300 },
        medium: { width: 800, height: 600 },
        large: { width: 1200, height: 900 },
        xlarge: { width: 1920, height: 1080 }
      },
      videoResolutions: {
        '240p': { width: 426, height: 240, bitrate: 400 },
        '360p': { width: 640, height: 360, bitrate: 800 },
        '480p': { width: 854, height: 480, bitrate: 1200 },
        '720p': { width: 1280, height: 720, bitrate: 2500 },
        '1080p': { width: 1920, height: 1080, bitrate: 5000 },
        '1440p': { width: 2560, height: 1440, bitrate: 10000 }
      },
      ...config
    };
    
    this.processingQueue = [];
    this.processingStatus = new Map();
    this.optimizationCache = new Map();
    this.isProcessing = false;
  }

  /**
   * Optimize image based on format and quality requirements
   * @param {Buffer|string} input - Image buffer or file path
   * @param {Object} options - Optimization options
   * @returns {Promise<Object>} - Optimized image data
   */
  async optimizeImage(input, options = {}) {
    const {
      format = 'auto',
      quality = 85,
      width,
      height,
      resize = 'contain',
      progressive = true,
      removeMetadata = true
    } = options;

    try {
      const imageData = await this.loadImageData(input);
      const originalFormat = await this.detectImageFormat(imageData);
      
      // Determine optimal format
      const targetFormat = format === 'auto' ? 
        this.selectOptimalImageFormat(originalFormat, options) : format;
      
      // Create optimization pipeline
      const pipeline = this.createImagePipeline(imageData, {
        format: targetFormat,
        quality,
        width,
        height,
        resize,
        progressive,
        removeMetadata
      });
      
      const optimized = await this.processImagePipeline(pipeline);
      
      // Generate multiple formats if requested
      const variants = await this.generateImageVariants(optimized, options);
      
      return {
        original: {
          format: originalFormat,
          size: imageData.length,
          dimensions: await this.getImageDimensions(imageData)
        },
        optimized: {
          format: targetFormat,
          data: optimized.data,
          size: optimized.data.length,
          dimensions: optimized.dimensions,
          quality: quality,
          savings: ((imageData.length - optimized.data.length) / imageData.length) * 100
        },
        variants: variants
      };
    } catch (error) {
      console.error('Image optimization failed:', error);
      throw new Error(`Image optimization failed: ${error.message}`);
    }
  }

  /**
   * Optimize video for different resolutions and formats
   * @param {string} inputPath - Video file path
   * @param {Object} options - Optimization options
   * @returns {Promise<Object>} - Optimized video data
   */
  async optimizeVideo(inputPath, options = {}) {
    const {
      formats = ['mp4', 'webm'],
      resolutions = ['720p', '1080p'],
      enableHLS = true,
      enableDASH = false,
      fastStart = true,
      crf = 23 // Constant Rate Factor for quality
    } = options;

    try {
      const videoInfo = await this.getVideoInfo(inputPath);
      const optimizationTasks = [];
      
      // Generate different format/resolution combinations
      for (const format of formats) {
        for (const resolution of resolutions) {
          if (this.shouldGenerateVariant(videoInfo, format, resolution)) {
            optimizationTasks.push({
              type: 'video',
              input: inputPath,
              format,
              resolution,
              options: { crf, fastStart }
            });
          }
        }
      }
      
      // Add streaming formats
      if (enableHLS) {
        optimizationTasks.push({
          type: 'hls',
          input: inputPath,
          resolutions: resolutions.filter(res => 
            this.config.videoResolutions[res]?.bitrate <= 5000
          )
        });
      }
      
      if (enableDASH) {
        optimizationTasks.push({
          type: 'dash',
          input: inputPath,
          resolutions: resolutions
        });
      }
      
      // Process all variants
      const results = await Promise.all(
        optimizationTasks.map(task => this.processVideoTask(task))
      );
      
      return {
        original: videoInfo,
        variants: results.reduce((acc, result) => {
          acc[`${result.format}_${result.resolution || 'adaptive'}`] = result;
          return acc;
        }, {}),
        metadata: {
          processedAt: new Date().toISOString(),
          totalVariants: results.length,
          totalSize: results.reduce((sum, r) => sum + (r.size || 0), 0)
        }
      };
    } catch (error) {
      console.error('Video optimization failed:', error);
      throw new Error(`Video optimization failed: ${error.message}`);
    }
  }

  /**
   * Optimize audio files for web delivery
   * @param {string} inputPath - Audio file path
   * @param {Object} options - Optimization options
   * @returns {Promise<Object>} - Optimized audio data
   */
  async optimizeAudio(inputPath, options = {}) {
    const {
      formats = ['mp3', 'ogg'],
      bitrates = [128, 192],
      normalize = true,
      removeMetadata = true
    } = options;

    try {
      const audioInfo = await this.getAudioInfo(inputPath);
      const optimizationTasks = [];
      
      for (const format of formats) {
        for (const bitrate of bitrates) {
          if (bitrate <= audioInfo.bitrate) {
            optimizationTasks.push({
              type: 'audio',
              input: inputPath,
              format,
              bitrate,
              options: { normalize, removeMetadata }
            });
          }
        }
      }
      
      const results = await Promise.all(
        optimizationTasks.map(task => this.processAudioTask(task))
      );
      
      return {
        original: audioInfo,
        variants: results.reduce((acc, result) => {
          acc[`${result.format}_${result.bitrate}k`] = result;
          return acc;
        }, {}),
        metadata: {
          processedAt: new Date().toISOString(),
          totalVariants: results.length
        }
      };
    } catch (error) {
      console.error('Audio optimization failed:', error);
      throw new Error(`Audio optimization failed: ${error.message}`);
    }
  }

  /**
   * Process gaming-specific assets (textures, models, etc.)
   * @param {string} inputPath - Asset file path
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - Processed asset data
   */
  async processGamingAsset(inputPath, options = {}) {
    const {
      assetType = 'texture',
      compressionLevel = 'medium',
      generateMipmaps = true,
      targetPlatforms = ['web', 'mobile']
    } = options;

    try {
      switch (assetType) {
        case 'texture':
          return await this.optimizeTexture(inputPath, {
            compressionLevel,
            generateMipmaps,
            targetPlatforms
          });
        
        case 'model':
          return await this.optimizeModel(inputPath, options);
        
        case 'audio':
          return await this.optimizeGameAudio(inputPath, options);
        
        case 'shader':
          return await this.optimizeShader(inputPath, options);
        
        default:
          throw new Error(`Unsupported gaming asset type: ${assetType}`);
      }
    } catch (error) {
      console.error('Gaming asset optimization failed:', error);
      throw error;
    }
  }

  /**
   * Batch process multiple media files
   * @param {Array} files - Array of file objects
   * @param {Object} options - Batch processing options
   * @returns {Promise<Array>} - Processing results
   */
  async batchProcess(files, options = {}) {
    const {
      concurrency = 3,
      priority = 'normal',
      callback
    } = options;

    const processingId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.processingStatus.set(processingId, {
      total: files.length,
      completed: 0,
      failed: 0,
      startTime: Date.now(),
      results: []
    });

    try {
      // Process files in batches with concurrency limit
      const results = [];
      for (let i = 0; i < files.length; i += concurrency) {
        const batch = files.slice(i, i + concurrency);
        const batchPromises = batch.map(async (file) => {
          try {
            const result = await this.processMediaFile(file, options);
            this.updateProcessingStatus(processingId, 'completed');
            if (callback) callback({ type: 'progress', processingId, result });
            return result;
          } catch (error) {
            this.updateProcessingStatus(processingId, 'failed');
            console.error(`Failed to process ${file.path}:`, error);
            return { error: error.message, file: file.path };
          }
        });
        
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults.map(r => r.value || r.reason));
      }
      
      const finalStatus = this.processingStatus.get(processingId);
      finalStatus.endTime = Date.now();
      finalStatus.results = results;
      
      if (callback) {
        callback({ 
          type: 'complete', 
          processingId, 
          results,
          summary: {
            total: finalStatus.total,
            completed: finalStatus.completed,
            failed: finalStatus.failed,
            duration: finalStatus.endTime - finalStatus.startTime
          }
        });
      }
      
      return results;
    } catch (error) {
      console.error('Batch processing failed:', error);
      throw error;
    }
  }

  /**
   * Process individual media file based on type
   * @param {Object} file - File object
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - Processing result
   */
  async processMediaFile(file, options = {}) {
    const fileExtension = file.path.split('.').pop().toLowerCase();
    const mimeType = this.getMimeTypeFromExtension(fileExtension);
    
    if (mimeType.startsWith('image/')) {
      return await this.optimizeImage(file.path, options.image || {});
    } else if (mimeType.startsWith('video/')) {
      return await this.optimizeVideo(file.path, options.video || {});
    } else if (mimeType.startsWith('audio/')) {
      return await this.optimizeAudio(file.path, options.audio || {});
    } else if (this.isGamingAsset(fileExtension)) {
      return await this.processGamingAsset(file.path, options.gaming || {});
    } else {
      throw new Error(`Unsupported file type: ${fileExtension}`);
    }
  }

  /**
   * Create responsive image set
   * @param {string} imagePath - Source image path
   * @param {Object} options - Responsive options
   * @returns {Promise<Object>} - Responsive image set
   */
  async createResponsiveImageSet(imagePath, options = {}) {
    const {
      sizes = Object.keys(this.config.imageSizes),
      formats = ['webp', 'jpeg'],
      qualities = [80, 90]
    } = options;

    const responsiveSet = {
      srcset: {},
      sizes: [],
      fallback: null
    };

    for (const sizeName of sizes) {
      const sizeConfig = this.config.imageSizes[sizeName];
      if (!sizeConfig) continue;

      for (const format of formats) {
        for (const quality of qualities) {
          const optimized = await this.optimizeImage(imagePath, {
            format,
            quality,
            width: sizeConfig.width,
            height: sizeConfig.height,
            resize: 'cover'
          });

          const key = `${sizeName}_${format}_q${quality}`;
          responsiveSet.srcset[key] = {
            url: `optimized_${key}_${path.basename(imagePath)}`,
            width: sizeConfig.width,
            height: sizeConfig.height,
            format,
            quality,
            size: optimized.optimized.size
          };
        }
      }
    }

    // Create fallback (medium JPEG)
    responsiveSet.fallback = responsiveSet.srcset['medium_jpeg_q80'];

    return responsiveSet;
  }

  /**
   * Helper methods for media processing
   */

  selectOptimalImageFormat(originalFormat, options = {}) {
    const { supportWebP = true, supportAVIF = true, maxQuality = 90 } = options;
    
    // Prefer modern formats for better compression
    if (supportAVIF && maxQuality <= 90) return 'avif';
    if (supportWebP) return 'webp';
    
    // Fallback to original or JPEG
    return originalFormat === 'png' && maxQuality > 80 ? 'png' : 'jpeg';
  }

  async loadImageData(input) {
    if (Buffer.isBuffer(input)) return input;
    
    // In a real implementation, this would read the file
    // For now, return a mock buffer
    return Buffer.from('mock-image-data');
  }

  async detectImageFormat(buffer) {
    // Mock implementation - would use actual image detection
    return 'jpeg';
  }

  async getImageDimensions(buffer) {
    // Mock implementation - would extract real dimensions
    return { width: 1920, height: 1080 };
  }

  createImagePipeline(imageData, options) {
    // Mock pipeline creation - would use real image processing library
    return {
      input: imageData,
      operations: [
        { type: 'resize', ...options },
        { type: 'format', format: options.format },
        { type: 'quality', level: options.quality }
      ]
    };
  }

  async processImagePipeline(pipeline) {
    // Mock pipeline processing
    return {
      data: Buffer.from('optimized-image-data'),
      dimensions: { width: 800, height: 600 }
    };
  }

  async generateImageVariants(optimized, options) {
    const variants = {};
    
    if (options.generateVariants) {
      const formats = options.variantFormats || ['webp', 'jpeg'];
      
      for (const format of formats) {
        variants[format] = {
          data: Buffer.from(`variant-${format}`),
          format,
          size: optimized.data.length * 0.8 // Mock size reduction
        };
      }
    }
    
    return variants;
  }

  async getVideoInfo(inputPath) {
    // Mock video info - would use ffprobe or similar
    return {
      duration: 120,
      width: 1920,
      height: 1080,
      fps: 30,
      bitrate: 5000,
      format: 'mp4',
      size: 50000000
    };
  }

  async getAudioInfo(inputPath) {
    // Mock audio info
    return {
      duration: 180,
      bitrate: 320,
      sampleRate: 44100,
      channels: 2,
      format: 'mp3',
      size: 7200000
    };
  }

  shouldGenerateVariant(videoInfo, format, resolution) {
    const resConfig = this.config.videoResolutions[resolution];
    return resConfig && resConfig.height <= videoInfo.height;
  }

  async processVideoTask(task) {
    // Mock video processing - would use ffmpeg or similar
    const resConfig = this.config.videoResolutions[task.resolution];
    
    return {
      format: task.format,
      resolution: task.resolution,
      width: resConfig?.width || 1920,
      height: resConfig?.height || 1080,
      bitrate: resConfig?.bitrate || 5000,
      size: 25000000, // Mock size
      url: `video_${task.format}_${task.resolution}.${task.format}`
    };
  }

  async processAudioTask(task) {
    // Mock audio processing
    return {
      format: task.format,
      bitrate: task.bitrate,
      size: 3600000, // Mock size
      url: `audio_${task.format}_${task.bitrate}k.${task.format}`
    };
  }

  async optimizeTexture(inputPath, options) {
    // Mock texture optimization for gaming assets
    return {
      original: {
        format: 'png',
        size: 4000000,
        dimensions: { width: 1024, height: 1024 }
      },
      optimized: {
        format: 'ktx2',
        size: 1000000,
        compressionRatio: 4.0,
        mipmaps: options.generateMipmaps
      }
    };
  }

  async optimizeModel(inputPath, options) {
    // Mock 3D model optimization
    return {
      original: { format: 'obj', vertices: 50000, size: 2000000 },
      optimized: { format: 'gltf', vertices: 25000, size: 1000000 }
    };
  }

  async optimizeGameAudio(inputPath, options) {
    // Mock game audio optimization
    return await this.optimizeAudio(inputPath, {
      formats: ['ogg', 'mp3'],
      bitrates: [96, 128],
      ...options
    });
  }

  async optimizeShader(inputPath, options) {
    // Mock shader optimization
    return {
      original: { size: 5000, lines: 200 },
      optimized: { size: 3000, minified: true }
    };
  }

  getMimeTypeFromExtension(extension) {
    const mimeTypes = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      avif: 'image/avif',
      mp4: 'video/mp4',
      webm: 'video/webm',
      mp3: 'audio/mpeg',
      ogg: 'audio/ogg',
      wav: 'audio/wav'
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
  }

  isGamingAsset(extension) {
    const gamingExtensions = ['texture', 'unity3d', 'pak', 'asset', 'fbx', 'obj', 'gltf', 'ktx2'];
    return gamingExtensions.includes(extension);
  }

  updateProcessingStatus(processingId, status) {
    const current = this.processingStatus.get(processingId);
    if (current) {
      current[status]++;
    }
  }

  /**
   * Get processing status
   * @param {string} processingId - Processing ID
   * @returns {Object} - Processing status
   */
  getProcessingStatus(processingId) {
    return this.processingStatus.get(processingId);
  }

  /**
   * Cancel processing
   * @param {string} processingId - Processing ID
   */
  cancelProcessing(processingId) {
    // In real implementation, would cancel ongoing processes
    this.processingStatus.delete(processingId);
    console.log(`Processing cancelled: ${processingId}`);
  }
}

/**
 * Create and export default media optimizer instance
 */
export const mediaOptimizer = new MediaOptimizer();

/**
 * Express middleware for automatic media optimization
 * @param {Object} options - Middleware options
 * @returns {Function} - Express middleware function
 */
export function mediaOptimizationMiddleware(options = {}) {
  return async (req, res, next) => {
    // Check if request is for a media file
    const path = req.path;
    const extension = path.split('.').pop()?.toLowerCase();
    
    if (!extension || !mediaOptimizer.getMimeTypeFromExtension(extension).startsWith('image/')) {
      return next();
    }
    
    try {
      // Check if optimized version exists
      const optimizedPath = `${path}_optimized_${options.format || 'webp'}`;
      
      // In real implementation, would check filesystem or cache
      // For now, continue to original file
      next();
    } catch (error) {
      console.error('Media optimization middleware error:', error);
      next();
    }
  };
}