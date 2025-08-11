/**
 * Direct File Upload System
 * Handles CDN integration, transcoding, file validation, and processing
 * Sub-task 9.8
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;

class DirectUploadManager {
  constructor(config) {
    this.config = {
      maxFileSize: config.maxFileSize || 500 * 1024 * 1024, // 500MB default
      allowedMimeTypes: config.allowedMimeTypes || [
        'video/mp4', 'video/webm', 'video/avi', 'video/quicktime', 'video/x-msvideo',
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac'
      ],
      uploadPath: config.uploadPath || './uploads',
      cdnConfig: config.cdnConfig || {},
      transcodingConfig: config.transcodingConfig || {},
      thumbnailConfig: config.thumbnailConfig || {},
      storageProvider: config.storageProvider || 'local', // local, aws-s3, cloudinary, etc.
      virusScanEnabled: config.virusScanEnabled || false
    };
    
    this.uploadSessions = new Map();
    this.setupUploadDirectory();
  }

  /**
   * Setup upload directory
   */
  async setupUploadDirectory() {
    try {
      await fs.mkdir(this.config.uploadPath, { recursive: true });
      await fs.mkdir(path.join(this.config.uploadPath, 'temp'), { recursive: true });
      await fs.mkdir(path.join(this.config.uploadPath, 'processed'), { recursive: true });
      await fs.mkdir(path.join(this.config.uploadPath, 'thumbnails'), { recursive: true });
    } catch (error) {
      console.error('Error setting up upload directory:', error);
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file, metadata = {}) {
    const errors = [];

    // Check file size
    if (file.size > this.config.maxFileSize) {
      errors.push(`File size ${this.formatFileSize(file.size)} exceeds maximum allowed size ${this.formatFileSize(this.config.maxFileSize)}`);
    }

    // Check MIME type
    if (!this.config.allowedMimeTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} is not allowed`);
    }

    // Check file extension
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = this.getAllowedExtensions();
    if (!allowedExtensions.includes(fileExtension)) {
      errors.push(`File extension ${fileExtension} is not allowed`);
    }

    // Validate filename
    if (!this.isValidFilename(file.originalname)) {
      errors.push('Invalid filename. Only alphanumeric characters, dots, hyphens, and underscores are allowed');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Get allowed file extensions based on MIME types
   */
  getAllowedExtensions() {
    const mimeToExt = {
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/avi': '.avi',
      'video/quicktime': '.mov',
      'video/x-msvideo': '.avi',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'audio/mp3': '.mp3',
      'audio/wav': '.wav',
      'audio/ogg': '.ogg',
      'audio/aac': '.aac'
    };

    return this.config.allowedMimeTypes.map(mime => mimeToExt[mime] || '').filter(Boolean);
  }

  /**
   * Validate filename
   */
  isValidFilename(filename) {
    const validFilenameRegex = /^[a-zA-Z0-9._-]+$/;
    return validFilenameRegex.test(filename) && filename.length <= 255;
  }

  /**
   * Generate unique filename
   */
  generateUniqueFilename(originalName) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    
    return `${baseName}_${timestamp}_${randomString}${extension}`;
  }

  /**
   * Start upload session
   */
  async startUploadSession(userId, fileMetadata, uploadOptions = {}) {
    const sessionId = crypto.randomUUID();
    
    const session = {
      id: sessionId,
      userId: userId,
      originalName: fileMetadata.originalName,
      size: fileMetadata.size,
      mimetype: fileMetadata.mimetype,
      uploadedSize: 0,
      status: 'initialized',
      createdAt: new Date(),
      chunks: [],
      options: {
        generateThumbnails: uploadOptions.generateThumbnails !== false,
        transcode: uploadOptions.transcode !== false,
        quality: uploadOptions.quality || 'auto',
        resolutions: uploadOptions.resolutions || ['720p', '1080p'],
        extractMetadata: uploadOptions.extractMetadata !== false,
        virusScan: uploadOptions.virusScan && this.config.virusScanEnabled
      }
    };

    this.uploadSessions.set(sessionId, session);
    
    return {
      sessionId: sessionId,
      chunkSize: 1024 * 1024 * 5, // 5MB chunks
      uploadUrl: `/api/upload/${sessionId}/chunk`,
      session: session
    };
  }

  /**
   * Upload file chunk
   */
  async uploadChunk(sessionId, chunkIndex, chunkData, isLastChunk = false) {
    const session = this.uploadSessions.get(sessionId);
    
    if (!session) {
      throw new Error('Upload session not found');
    }

    if (session.status === 'completed' || session.status === 'failed') {
      throw new Error('Upload session is already completed or failed');
    }

    try {
      // Save chunk to temporary file
      const tempChunkPath = path.join(
        this.config.uploadPath, 
        'temp', 
        `${sessionId}_chunk_${chunkIndex}`
      );

      await fs.writeFile(tempChunkPath, chunkData);

      // Update session
      session.chunks.push({
        index: chunkIndex,
        path: tempChunkPath,
        size: chunkData.length,
        uploadedAt: new Date()
      });

      session.uploadedSize += chunkData.length;
      session.status = isLastChunk ? 'assembling' : 'uploading';

      if (isLastChunk) {
        // Assemble all chunks
        return await this.assembleFile(sessionId);
      }

      return {
        sessionId: sessionId,
        uploadedSize: session.uploadedSize,
        totalSize: session.size,
        progress: (session.uploadedSize / session.size) * 100,
        status: session.status
      };
    } catch (error) {
      session.status = 'failed';
      session.error = error.message;
      console.error('Error uploading chunk:', error);
      throw error;
    }
  }

  /**
   * Assemble file from chunks
   */
  async assembleFile(sessionId) {
    const session = this.uploadSessions.get(sessionId);
    
    if (!session) {
      throw new Error('Upload session not found');
    }

    try {
      session.status = 'assembling';

      // Sort chunks by index
      const sortedChunks = session.chunks.sort((a, b) => a.index - b.index);

      // Generate final filename
      const finalFilename = this.generateUniqueFilename(session.originalName);
      const finalPath = path.join(this.config.uploadPath, 'temp', finalFilename);

      // Assemble file
      const writeStream = require('fs').createWriteStream(finalPath);
      
      for (const chunk of sortedChunks) {
        const chunkData = await fs.readFile(chunk.path);
        writeStream.write(chunkData);
        
        // Clean up chunk file
        await fs.unlink(chunk.path).catch(() => {}); // Ignore errors
      }

      writeStream.end();

      // Wait for write to complete
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      // Verify file size
      const stats = await fs.stat(finalPath);
      if (stats.size !== session.size) {
        throw new Error('Assembled file size does not match expected size');
      }

      // Update session
      session.tempFilePath = finalPath;
      session.finalFilename = finalFilename;
      session.status = 'assembled';

      // Start processing
      return await this.processFile(sessionId);
    } catch (error) {
      session.status = 'failed';
      session.error = error.message;
      console.error('Error assembling file:', error);
      throw error;
    }
  }

  /**
   * Process uploaded file
   */
  async processFile(sessionId) {
    const session = this.uploadSessions.get(sessionId);
    
    if (!session) {
      throw new Error('Upload session not found');
    }

    try {
      session.status = 'processing';
      const results = {};

      // Virus scan if enabled
      if (session.options.virusScan) {
        session.status = 'scanning';
        const scanResult = await this.scanForViruses(session.tempFilePath);
        if (!scanResult.clean) {
          throw new Error('File failed virus scan');
        }
        results.virusScan = scanResult;
      }

      // Extract metadata
      if (session.options.extractMetadata) {
        session.status = 'extracting-metadata';
        results.metadata = await this.extractMetadata(session.tempFilePath, session.mimetype);
      }

      // Generate thumbnails for video/images
      if (session.options.generateThumbnails && this.shouldGenerateThumbnails(session.mimetype)) {
        session.status = 'generating-thumbnails';
        results.thumbnails = await this.generateThumbnails(session.tempFilePath, session.mimetype, sessionId);
      }

      // Transcode video if needed
      if (session.options.transcode && this.isVideoFile(session.mimetype)) {
        session.status = 'transcoding';
        results.transcoded = await this.transcodeVideo(session.tempFilePath, session.options, sessionId);
      }

      // Move to final location
      const finalPath = path.join(this.config.uploadPath, 'processed', session.finalFilename);
      await fs.rename(session.tempFilePath, finalPath);

      // Upload to CDN if configured
      if (this.config.cdnConfig.enabled) {
        session.status = 'uploading-cdn';
        results.cdn = await this.uploadToCDN(finalPath, session.finalFilename);
      }

      // Update session
      session.status = 'completed';
      session.finalPath = finalPath;
      session.results = results;
      session.completedAt = new Date();

      // Clean up temporary files
      await this.cleanupTempFiles(sessionId);

      return {
        sessionId: sessionId,
        status: session.status,
        filename: session.finalFilename,
        originalName: session.originalName,
        size: session.size,
        mimetype: session.mimetype,
        path: finalPath,
        url: this.generateFileUrl(session.finalFilename),
        results: results
      };
    } catch (error) {
      session.status = 'failed';
      session.error = error.message;
      console.error('Error processing file:', error);
      
      // Clean up on error
      await this.cleanupTempFiles(sessionId);
      
      throw error;
    }
  }

  /**
   * Extract file metadata
   */
  async extractMetadata(filePath, mimetype) {
    try {
      if (this.isVideoFile(mimetype)) {
        return await this.extractVideoMetadata(filePath);
      } else if (this.isImageFile(mimetype)) {
        return await this.extractImageMetadata(filePath);
      } else if (this.isAudioFile(mimetype)) {
        return await this.extractAudioMetadata(filePath);
      }
      
      return await this.extractBasicMetadata(filePath);
    } catch (error) {
      console.error('Error extracting metadata:', error);
      return { error: error.message };
    }
  }

  /**
   * Extract video metadata (requires ffprobe)
   */
  async extractVideoMetadata(filePath) {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
      const { stdout } = await execAsync(
        `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`
      );
      
      const metadata = JSON.parse(stdout);
      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

      return {
        format: metadata.format?.format_name,
        duration: parseFloat(metadata.format?.duration) || 0,
        size: parseInt(metadata.format?.size) || 0,
        bitrate: parseInt(metadata.format?.bit_rate) || 0,
        video: videoStream ? {
          codec: videoStream.codec_name,
          width: videoStream.width,
          height: videoStream.height,
          frameRate: eval(videoStream.r_frame_rate),
          bitrate: parseInt(videoStream.bit_rate) || 0,
          pixelFormat: videoStream.pix_fmt
        } : null,
        audio: audioStream ? {
          codec: audioStream.codec_name,
          sampleRate: parseInt(audioStream.sample_rate) || 0,
          channels: audioStream.channels,
          bitrate: parseInt(audioStream.bit_rate) || 0
        } : null
      };
    } catch (error) {
      console.error('Error extracting video metadata:', error);
      return { error: 'Failed to extract video metadata' };
    }
  }

  /**
   * Extract image metadata (requires sharp or similar)
   */
  async extractImageMetadata(filePath) {
    try {
      // This is a placeholder - you would use a library like sharp
      const stats = await fs.stat(filePath);
      
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        // Add more metadata extraction here using image processing library
        width: null,
        height: null,
        colorSpace: null,
        hasAlpha: null
      };
    } catch (error) {
      console.error('Error extracting image metadata:', error);
      return { error: 'Failed to extract image metadata' };
    }
  }

  /**
   * Extract audio metadata
   */
  async extractAudioMetadata(filePath) {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
      const { stdout } = await execAsync(
        `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`
      );
      
      const metadata = JSON.parse(stdout);
      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

      return {
        format: metadata.format?.format_name,
        duration: parseFloat(metadata.format?.duration) || 0,
        size: parseInt(metadata.format?.size) || 0,
        bitrate: parseInt(metadata.format?.bit_rate) || 0,
        codec: audioStream?.codec_name,
        sampleRate: parseInt(audioStream?.sample_rate) || 0,
        channels: audioStream?.channels,
        channelLayout: audioStream?.channel_layout
      };
    } catch (error) {
      console.error('Error extracting audio metadata:', error);
      return { error: 'Failed to extract audio metadata' };
    }
  }

  /**
   * Extract basic file metadata
   */
  async extractBasicMetadata(filePath) {
    try {
      const stats = await fs.stat(filePath);
      
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        permissions: stats.mode
      };
    } catch (error) {
      console.error('Error extracting basic metadata:', error);
      return { error: 'Failed to extract metadata' };
    }
  }

  /**
   * Generate thumbnails for video or image files
   */
  async generateThumbnails(filePath, mimetype, sessionId) {
    try {
      const thumbnailPath = path.join(this.config.uploadPath, 'thumbnails', sessionId);
      await fs.mkdir(thumbnailPath, { recursive: true });

      if (this.isVideoFile(mimetype)) {
        return await this.generateVideoThumbnails(filePath, thumbnailPath);
      } else if (this.isImageFile(mimetype)) {
        return await this.generateImageThumbnails(filePath, thumbnailPath);
      }

      return null;
    } catch (error) {
      console.error('Error generating thumbnails:', error);
      return { error: error.message };
    }
  }

  /**
   * Generate video thumbnails using ffmpeg
   */
  async generateVideoThumbnails(filePath, outputPath) {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
      const thumbnails = [];
      const sizes = ['320x180', '640x360', '1280x720'];
      
      // Generate thumbnail at 10% of video duration
      for (let i = 0; i < sizes.length; i++) {
        const size = sizes[i];
        const thumbnailFile = `thumbnail_${size.replace('x', '_')}.jpg`;
        const thumbnailFullPath = path.join(outputPath, thumbnailFile);
        
        await execAsync(
          `ffmpeg -i "${filePath}" -ss 00:00:01.000 -vframes 1 -s ${size} -y "${thumbnailFullPath}"`
        );

        thumbnails.push({
          size: size,
          path: thumbnailFullPath,
          url: this.generateThumbnailUrl(thumbnailFile, outputPath)
        });
      }

      return thumbnails;
    } catch (error) {
      console.error('Error generating video thumbnails:', error);
      return { error: 'Failed to generate video thumbnails' };
    }
  }

  /**
   * Generate image thumbnails
   */
  async generateImageThumbnails(filePath, outputPath) {
    try {
      // This is a placeholder - you would use a library like sharp
      const thumbnails = [];
      const sizes = [{ width: 320, height: 180 }, { width: 640, height: 360 }, { width: 1280, height: 720 }];
      
      // Use sharp or similar library to generate thumbnails
      for (const size of sizes) {
        const thumbnailFile = `thumbnail_${size.width}x${size.height}.jpg`;
        const thumbnailFullPath = path.join(outputPath, thumbnailFile);
        
        // Placeholder for thumbnail generation
        // await sharp(filePath).resize(size.width, size.height).jpeg().toFile(thumbnailFullPath);
        
        thumbnails.push({
          size: `${size.width}x${size.height}`,
          path: thumbnailFullPath,
          url: this.generateThumbnailUrl(thumbnailFile, outputPath)
        });
      }

      return thumbnails;
    } catch (error) {
      console.error('Error generating image thumbnails:', error);
      return { error: 'Failed to generate image thumbnails' };
    }
  }

  /**
   * Transcode video to different formats and resolutions
   */
  async transcodeVideo(filePath, options, sessionId) {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
      const transcodedPath = path.join(this.config.uploadPath, 'processed', `transcoded_${sessionId}`);
      await fs.mkdir(transcodedPath, { recursive: true });

      const transcodedVersions = [];
      const resolutions = options.resolutions || ['720p', '1080p'];

      for (const resolution of resolutions) {
        const outputFile = `video_${resolution}.mp4`;
        const outputFullPath = path.join(transcodedPath, outputFile);
        
        let ffmpegOptions = '';
        switch (resolution) {
          case '480p':
            ffmpegOptions = '-vf scale=854:480 -b:v 1000k -b:a 128k';
            break;
          case '720p':
            ffmpegOptions = '-vf scale=1280:720 -b:v 2500k -b:a 128k';
            break;
          case '1080p':
            ffmpegOptions = '-vf scale=1920:1080 -b:v 5000k -b:a 192k';
            break;
          default:
            ffmpegOptions = '-b:v 2500k -b:a 128k';
        }

        await execAsync(
          `ffmpeg -i "${filePath}" ${ffmpegOptions} -c:v libx264 -preset fast -c:a aac -y "${outputFullPath}"`
        );

        const stats = await fs.stat(outputFullPath);
        transcodedVersions.push({
          resolution: resolution,
          path: outputFullPath,
          size: stats.size,
          url: this.generateFileUrl(path.relative(this.config.uploadPath, outputFullPath))
        });
      }

      return transcodedVersions;
    } catch (error) {
      console.error('Error transcoding video:', error);
      return { error: 'Failed to transcode video' };
    }
  }

  /**
   * Scan file for viruses (placeholder - integrate with actual antivirus)
   */
  async scanForViruses(filePath) {
    try {
      // Placeholder for virus scanning
      // You would integrate with ClamAV, VirusTotal API, or other antivirus solutions
      
      return {
        clean: true,
        scannedAt: new Date(),
        scanner: 'placeholder',
        signature: null
      };
    } catch (error) {
      console.error('Error scanning for viruses:', error);
      return {
        clean: false,
        error: error.message
      };
    }
  }

  /**
   * Upload file to CDN
   */
  async uploadToCDN(filePath, filename) {
    try {
      if (this.config.storageProvider === 'aws-s3') {
        return await this.uploadToS3(filePath, filename);
      } else if (this.config.storageProvider === 'cloudinary') {
        return await this.uploadToCloudinary(filePath, filename);
      }
      
      return { url: this.generateFileUrl(filename) };
    } catch (error) {
      console.error('Error uploading to CDN:', error);
      throw error;
    }
  }

  /**
   * Upload to AWS S3 (placeholder)
   */
  async uploadToS3(filePath, filename) {
    // Placeholder for AWS S3 upload
    return {
      provider: 'aws-s3',
      url: `https://your-bucket.s3.amazonaws.com/${filename}`,
      key: filename
    };
  }

  /**
   * Upload to Cloudinary (placeholder)
   */
  async uploadToCloudinary(filePath, filename) {
    // Placeholder for Cloudinary upload
    return {
      provider: 'cloudinary',
      url: `https://res.cloudinary.com/your-cloud/video/upload/${filename}`,
      publicId: filename
    };
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(sessionId) {
    try {
      const session = this.uploadSessions.get(sessionId);
      if (session && session.tempFilePath) {
        await fs.unlink(session.tempFilePath).catch(() => {});
      }
      
      // Clean up any remaining chunk files
      const tempDir = path.join(this.config.uploadPath, 'temp');
      const files = await fs.readdir(tempDir);
      
      for (const file of files) {
        if (file.startsWith(sessionId)) {
          await fs.unlink(path.join(tempDir, file)).catch(() => {});
        }
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }

  /**
   * Get upload session status
   */
  getUploadSession(sessionId) {
    return this.uploadSessions.get(sessionId) || null;
  }

  /**
   * Cancel upload session
   */
  async cancelUploadSession(sessionId) {
    const session = this.uploadSessions.get(sessionId);
    
    if (session) {
      session.status = 'cancelled';
      await this.cleanupTempFiles(sessionId);
      this.uploadSessions.delete(sessionId);
    }
  }

  /**
   * Helper methods
   */
  isVideoFile(mimetype) {
    return mimetype.startsWith('video/');
  }

  isImageFile(mimetype) {
    return mimetype.startsWith('image/');
  }

  isAudioFile(mimetype) {
    return mimetype.startsWith('audio/');
  }

  shouldGenerateThumbnails(mimetype) {
    return this.isVideoFile(mimetype) || this.isImageFile(mimetype);
  }

  formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  generateFileUrl(filename) {
    return `/api/files/${filename}`;
  }

  generateThumbnailUrl(filename, basePath) {
    return `/api/thumbnails/${path.basename(basePath)}/${filename}`;
  }
}

// Integration with MLG platform
class MLGDirectUploadIntegration {
  constructor(uploadConfig, cacheManager, contentValidator) {
    this.uploadManager = new DirectUploadManager(uploadConfig);
    this.cache = cacheManager;
    this.contentValidator = contentValidator;
  }

  /**
   * Start MLG content upload
   */
  async startContentUpload(userId, fileMetadata, contentMetadata = {}) {
    try {
      // Validate user permissions
      await this.validateUserPermissions(userId, fileMetadata);

      // Start upload session
      const session = await this.uploadManager.startUploadSession(userId, fileMetadata, {
        generateThumbnails: true,
        transcode: this.uploadManager.isVideoFile(fileMetadata.mimetype),
        extractMetadata: true,
        virusScan: true,
        quality: contentMetadata.quality || 'auto',
        resolutions: contentMetadata.resolutions || ['720p', '1080p']
      });

      // Store content metadata
      await this.cache.set(`upload_content:${session.sessionId}`, {
        userId: userId,
        title: contentMetadata.title,
        description: contentMetadata.description,
        tags: contentMetadata.tags || [],
        clanId: contentMetadata.clanId,
        category: contentMetadata.category || 'general',
        privacy: contentMetadata.privacy || 'public',
        scheduledPublish: contentMetadata.scheduledPublish
      }, 3600); // 1 hour

      return session;
    } catch (error) {
      console.error('Error starting content upload:', error);
      throw error;
    }
  }

  /**
   * Complete content upload and create MLG content entry
   */
  async completeContentUpload(sessionId) {
    try {
      const uploadResult = await this.uploadManager.getUploadSession(sessionId);
      
      if (!uploadResult || uploadResult.status !== 'completed') {
        throw new Error('Upload not completed or session not found');
      }

      // Get stored content metadata
      const contentMetadata = await this.cache.get(`upload_content:${sessionId}`);
      
      if (!contentMetadata) {
        throw new Error('Content metadata not found');
      }

      // Create MLG content object
      const mlgContent = {
        platform: 'direct-upload',
        externalId: sessionId,
        title: contentMetadata.title || uploadResult.originalName,
        description: contentMetadata.description || '',
        thumbnailUrl: this.getBestThumbnail(uploadResult.results.thumbnails),
        duration: uploadResult.results.metadata?.duration || 0,
        embedUrl: uploadResult.url,
        metadata: {
          originalFilename: uploadResult.originalName,
          fileSize: uploadResult.size,
          mimetype: uploadResult.mimetype,
          uploadedAt: uploadResult.completedAt,
          dimensions: uploadResult.results.metadata?.video ? {
            width: uploadResult.results.metadata.video.width,
            height: uploadResult.results.metadata.video.height
          } : null,
          codec: uploadResult.results.metadata?.video?.codec,
          bitrate: uploadResult.results.metadata?.bitrate,
          thumbnails: uploadResult.results.thumbnails || [],
          transcoded: uploadResult.results.transcoded || [],
          virusScan: uploadResult.results.virusScan,
          tags: contentMetadata.tags,
          category: contentMetadata.category
        },
        submittedBy: contentMetadata.userId,
        clanId: contentMetadata.clanId,
        createdAt: new Date(),
        status: contentMetadata.scheduledPublish ? 'scheduled' : 'active',
        privacy: contentMetadata.privacy,
        scheduledPublishAt: contentMetadata.scheduledPublish
      };

      // Validate content before saving
      const validation = await this.contentValidator.validateContent(mlgContent);
      
      if (!validation.isValid) {
        mlgContent.status = 'pending-review';
        mlgContent.moderationFlags = validation.flags;
      }

      // Clean up cache
      await this.cache.del(`upload_content:${sessionId}`);

      return mlgContent;
    } catch (error) {
      console.error('Error completing content upload:', error);
      throw error;
    }
  }

  /**
   * Validate user upload permissions
   */
  async validateUserPermissions(userId, fileMetadata) {
    // Implement user permission validation
    // Check upload quotas, file type permissions, etc.
    return true;
  }

  /**
   * Get best thumbnail from generated thumbnails
   */
  getBestThumbnail(thumbnails) {
    if (!thumbnails || thumbnails.length === 0) return null;
    
    // Prefer 720p thumbnail, fallback to largest available
    const preferred = thumbnails.find(t => t.size === '1280x720');
    return preferred?.url || thumbnails[thumbnails.length - 1]?.url;
  }

  /**
   * Get upload progress
   */
  async getUploadProgress(sessionId) {
    const session = this.uploadManager.getUploadSession(sessionId);
    
    if (!session) {
      return { error: 'Session not found' };
    }

    return {
      sessionId: sessionId,
      status: session.status,
      progress: session.uploadedSize > 0 ? (session.uploadedSize / session.size) * 100 : 0,
      uploadedSize: session.uploadedSize,
      totalSize: session.size,
      error: session.error
    };
  }

  /**
   * Cancel upload
   */
  async cancelUpload(sessionId) {
    await this.uploadManager.cancelUploadSession(sessionId);
    await this.cache.del(`upload_content:${sessionId}`);
  }
}

module.exports = { DirectUploadManager, MLGDirectUploadIntegration };