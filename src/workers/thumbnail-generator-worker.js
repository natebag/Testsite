/**
 * MLG.clan Thumbnail Generator Web Worker - Sub-task 6.8
 * 
 * High-performance video thumbnail generation using Canvas API
 * Generates multiple thumbnails from different video timestamps
 * 
 * Features:
 * - Multiple thumbnail extraction from video
 * - Custom thumbnail positioning and sizing
 * - Image format and quality optimization
 * - Memory-efficient processing
 * - Progress tracking and error handling
 * 
 * @author Claude Code - Production Video Processing Engineer
 * @version 1.0.0
 */

/**
 * Thumbnail Generator Worker Class
 */
class ThumbnailGeneratorWorker {
  constructor() {
    this.currentJob = null;
    this.isReady = true;

    // Default configuration
    this.config = {
      // Thumbnail settings
      defaultWidth: 1280,
      defaultHeight: 720,
      defaultFormat: 'image/jpeg',
      defaultQuality: 0.85,
      defaultPositions: [0.1, 0.5, 0.9], // 10%, 50%, 90% of video duration
      
      // Processing limits
      maxThumbnails: 10,
      maxDimensions: { width: 3840, height: 2160 }, // 4K
      minDimensions: { width: 160, height: 90 },
      
      // Canvas limits
      maxCanvasSize: 4096,
      
      // Quality presets
      qualityPresets: {
        low: { width: 640, height: 360, quality: 0.7 },
        medium: { width: 1280, height: 720, quality: 0.85 },
        high: { width: 1920, height: 1080, quality: 0.95 },
        ultra: { width: 3840, height: 2160, quality: 0.95 }
      }
    };

    this.postMessage({
      type: 'worker-ready',
      ready: true
    });

    console.log('Thumbnail Generator Worker initialized');
  }

  /**
   * Handle incoming messages
   */
  handleMessage(event) {
    const { id, type, file, config } = event.data;

    switch (type) {
      case 'ping':
        this.postMessage({
          id,
          type: 'pong',
          ready: this.isReady
        });
        break;

      case 'generate-thumbnails':
        this.generateThumbnails(id, file, config);
        break;

      case 'generate-single-thumbnail':
        this.generateSingleThumbnail(id, file, config);
        break;

      case 'cancel-job':
        this.cancelCurrentJob();
        break;

      default:
        this.postMessage({
          id,
          type: 'thumbnail-error',
          error: `Unknown message type: ${type}`
        });
    }
  }

  /**
   * Generate multiple thumbnails from video
   */
  async generateThumbnails(jobId, file, config = {}) {
    this.currentJob = { id: jobId, cancelled: false };

    try {
      this.postMessage({
        id: jobId,
        type: 'thumbnail-progress',
        progress: 0,
        stage: 'initializing'
      });

      // Merge configuration
      const settings = {
        ...this.config,
        ...config,
        count: Math.min(config.count || 3, this.config.maxThumbnails),
        positions: config.positions || this.config.defaultPositions,
        width: Math.min(config.width || this.config.defaultWidth, this.config.maxDimensions.width),
        height: Math.min(config.height || this.config.defaultHeight, this.config.maxDimensions.height),
        quality: Math.min(Math.max(config.quality || this.config.defaultQuality, 0.1), 1.0),
        format: config.format || this.config.defaultFormat
      };

      // Validate dimensions
      settings.width = Math.max(settings.width, this.config.minDimensions.width);
      settings.height = Math.max(settings.height, this.config.minDimensions.height);

      // Create video element
      const video = await this.createVideoElement(file);
      
      if (this.currentJob.cancelled) {
        throw new Error('Job cancelled');
      }

      this.postMessage({
        id: jobId,
        type: 'thumbnail-progress',
        progress: 20,
        stage: 'loading-video'
      });

      // Wait for video metadata
      await this.waitForVideoMetadata(video);
      const duration = video.duration;

      if (!duration || duration <= 0) {
        throw new Error('Invalid video duration');
      }

      this.postMessage({
        id: jobId,
        type: 'thumbnail-progress',
        progress: 30,
        stage: 'extracting-frames'
      });

      // Calculate thumbnail positions
      const positions = this.calculateThumbnailPositions(duration, settings);
      const thumbnails = [];

      // Generate thumbnails
      for (let i = 0; i < positions.length; i++) {
        if (this.currentJob.cancelled) {
          throw new Error('Job cancelled');
        }

        const position = positions[i];
        
        this.postMessage({
          id: jobId,
          type: 'thumbnail-progress',
          progress: 30 + ((i + 1) / positions.length) * 60,
          stage: `extracting-frame-${i + 1}`,
          currentFrame: i + 1,
          totalFrames: positions.length
        });

        try {
          const thumbnail = await this.extractThumbnailAtTime(video, position, settings, i);
          thumbnails.push(thumbnail);
        } catch (error) {
          console.warn(`Failed to extract thumbnail at ${position}s:`, error);
          // Continue with other thumbnails
        }
      }

      if (thumbnails.length === 0) {
        throw new Error('No thumbnails could be generated');
      }

      this.postMessage({
        id: jobId,
        type: 'thumbnail-progress',
        progress: 95,
        stage: 'finalizing'
      });

      // Cleanup video element
      this.cleanupVideoElement(video);

      this.postMessage({
        id: jobId,
        type: 'thumbnails-generated',
        data: {
          thumbnails: thumbnails,
          count: thumbnails.length,
          duration: duration,
          settings: settings,
          metadata: {
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            duration: duration
          }
        }
      });

      this.currentJob = null;

    } catch (error) {
      console.error('Thumbnail generation error:', error);

      this.postMessage({
        id: jobId,
        type: 'thumbnail-error',
        error: error.message
      });

      this.currentJob = null;
    }
  }

  /**
   * Generate single thumbnail at specific time
   */
  async generateSingleThumbnail(jobId, file, config = {}) {
    this.currentJob = { id: jobId, cancelled: false };

    try {
      const settings = {
        ...this.config,
        ...config,
        width: Math.min(config.width || this.config.defaultWidth, this.config.maxDimensions.width),
        height: Math.min(config.height || this.config.defaultHeight, this.config.maxDimensions.height),
        quality: Math.min(Math.max(config.quality || this.config.defaultQuality, 0.1), 1.0),
        format: config.format || this.config.defaultFormat,
        time: config.time || 0
      };

      const video = await this.createVideoElement(file);
      await this.waitForVideoMetadata(video);

      const thumbnail = await this.extractThumbnailAtTime(video, settings.time, settings, 0);
      
      this.cleanupVideoElement(video);

      this.postMessage({
        id: jobId,
        type: 'thumbnail-generated',
        data: {
          thumbnail: thumbnail,
          time: settings.time,
          settings: settings
        }
      });

      this.currentJob = null;

    } catch (error) {
      this.postMessage({
        id: jobId,
        type: 'thumbnail-error',
        error: error.message
      });

      this.currentJob = null;
    }
  }

  /**
   * Create video element from file
   */
  async createVideoElement(file) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.preload = 'metadata';

      const objectUrl = URL.createObjectURL(file);

      video.onloadedmetadata = () => {
        resolve(video);
      };

      video.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load video file'));
      };

      video.src = objectUrl;
      video.load();
    });
  }

  /**
   * Wait for video metadata to be fully loaded
   */
  waitForVideoMetadata(video) {
    return new Promise((resolve, reject) => {
      if (video.readyState >= video.HAVE_METADATA) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        video.removeEventListener('loadedmetadata', onLoaded);
        video.removeEventListener('error', onError);
        reject(new Error('Timeout waiting for video metadata'));
      }, 10000); // 10 second timeout

      const onLoaded = () => {
        clearTimeout(timeout);
        video.removeEventListener('error', onError);
        resolve();
      };

      const onError = () => {
        clearTimeout(timeout);
        video.removeEventListener('loadedmetadata', onLoaded);
        reject(new Error('Error loading video metadata'));
      };

      video.addEventListener('loadedmetadata', onLoaded);
      video.addEventListener('error', onError);
    });
  }

  /**
   * Calculate thumbnail positions based on duration and settings
   */
  calculateThumbnailPositions(duration, settings) {
    const positions = [];
    
    if (settings.positions && Array.isArray(settings.positions)) {
      // Use provided positions (as percentages or absolute times)
      for (const pos of settings.positions) {
        if (pos <= 1.0) {
          // Percentage of duration
          positions.push(Math.max(0.1, pos * duration));
        } else {
          // Absolute time in seconds
          positions.push(Math.min(pos, duration - 0.1));
        }
      }
    } else {
      // Generate evenly spaced positions
      const count = settings.count || 3;
      for (let i = 0; i < count; i++) {
        const pos = (i + 1) / (count + 1); // Evenly spaced excluding start/end
        positions.push(pos * duration);
      }
    }

    return positions.slice(0, this.config.maxThumbnails);
  }

  /**
   * Extract thumbnail at specific time
   */
  async extractThumbnailAtTime(video, time, settings, index) {
    return new Promise((resolve, reject) => {
      const seeked = () => {
        try {
          video.removeEventListener('seeked', seeked);
          video.removeEventListener('error', error);

          // Create canvas for thumbnail extraction
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Calculate dimensions maintaining aspect ratio
          const { width, height } = this.calculateThumbnailDimensions(
            video.videoWidth,
            video.videoHeight,
            settings.width,
            settings.height
          );

          canvas.width = width;
          canvas.height = height;

          // Draw video frame to canvas
          ctx.drawImage(video, 0, 0, width, height);

          // Convert to blob
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to create thumbnail blob'));
              return;
            }

            // Create file with metadata
            const thumbnailFile = new File(
              [blob],
              `thumbnail_${index}_${Math.floor(time)}s.${this.getExtensionFromMimeType(settings.format)}`,
              { 
                type: settings.format,
                lastModified: Date.now()
              }
            );

            // Add metadata
            thumbnailFile.metadata = {
              time: time,
              index: index,
              dimensions: { width, height },
              originalDimensions: { 
                width: video.videoWidth, 
                height: video.videoHeight 
              }
            };

            resolve(thumbnailFile);
          }, settings.format, settings.quality);

        } catch (err) {
          video.removeEventListener('seeked', seeked);
          video.removeEventListener('error', error);
          reject(err);
        }
      };

      const error = () => {
        video.removeEventListener('seeked', seeked);
        video.removeEventListener('error', error);
        reject(new Error(`Failed to seek to time ${time}`));
      };

      video.addEventListener('seeked', seeked);
      video.addEventListener('error', error);

      // Seek to the desired time
      video.currentTime = Math.max(0, Math.min(time, video.duration - 0.1));
    });
  }

  /**
   * Calculate thumbnail dimensions maintaining aspect ratio
   */
  calculateThumbnailDimensions(videoWidth, videoHeight, targetWidth, targetHeight) {
    const videoAspectRatio = videoWidth / videoHeight;
    const targetAspectRatio = targetWidth / targetHeight;

    let width, height;

    if (videoAspectRatio > targetAspectRatio) {
      // Video is wider than target - fit by width
      width = targetWidth;
      height = Math.round(targetWidth / videoAspectRatio);
    } else {
      // Video is taller than target - fit by height
      height = targetHeight;
      width = Math.round(targetHeight * videoAspectRatio);
    }

    // Ensure dimensions are within limits
    width = Math.min(Math.max(width, this.config.minDimensions.width), this.config.maxDimensions.width);
    height = Math.min(Math.max(height, this.config.minDimensions.height), this.config.maxDimensions.height);

    // Ensure even dimensions for better video compatibility
    width = width % 2 === 0 ? width : width - 1;
    height = height % 2 === 0 ? height : height - 1;

    return { width, height };
  }

  /**
   * Get file extension from MIME type
   */
  getExtensionFromMimeType(mimeType) {
    const mimeMap = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/bmp': 'bmp'
    };

    return mimeMap[mimeType] || 'jpg';
  }

  /**
   * Cleanup video element
   */
  cleanupVideoElement(video) {
    try {
      if (video.src) {
        URL.revokeObjectURL(video.src);
      }
      video.src = '';
      video.load(); // Reset video element
    } catch (error) {
      console.warn('Error cleaning up video element:', error);
    }
  }

  /**
   * Cancel current job
   */
  cancelCurrentJob() {
    if (this.currentJob) {
      this.currentJob.cancelled = true;
      
      this.postMessage({
        id: this.currentJob.id,
        type: 'thumbnail-cancelled'
      });
    }
  }

  /**
   * Post message wrapper
   */
  postMessage(data) {
    try {
      self.postMessage(data);
    } catch (error) {
      console.error('Failed to post message:', error);
    }
  }
}

// Initialize worker
const thumbnailGenerator = new ThumbnailGeneratorWorker();

// Handle incoming messages
self.addEventListener('message', (event) => {
  thumbnailGenerator.handleMessage(event);
});

// Handle worker errors
self.addEventListener('error', (event) => {
  console.error('Thumbnail Worker error:', event);
  thumbnailGenerator.postMessage({
    type: 'worker-error',
    error: event.message || 'Unknown worker error'
  });
});

// Handle unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection in thumbnail worker:', event.reason);
  thumbnailGenerator.postMessage({
    type: 'worker-error',
    error: `Unhandled promise rejection: ${event.reason}`
  });
});

console.log('Thumbnail Generator Worker initialized');