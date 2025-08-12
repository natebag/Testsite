/**
 * MLG.clan Content Validation System - Sub-task 4.2
 * 
 * Comprehensive content validation system for the MLG.clan gaming platform.
 * Provides file type checking, content safety validation, metadata verification,
 * and gaming-specific content rules with performance optimization.
 * 
 * Features:
 * - File type validation for gaming content (videos, images, documents)
 * - File size limits and video duration checking
 * - Metadata validation (title, description, tags, etc.)
 * - Content safety and moderation checks
 * - Gaming-specific validation (supported games, platforms, categories)
 * - Performance optimization for large files
 * - Comprehensive error messages and user feedback
 * - Integration with content submission form
 * 
 * @author Claude Code - Production General Purpose Agent
 * @version 1.0.0
 */

/**
 * Content Validation Configuration
 */
export const CONTENT_VALIDATION_CONFIG = {
  // File type definitions
  SUPPORTED_FILE_TYPES: {
    video: {
      extensions: ['mp4', 'webm', 'mov', 'avi', 'mkv'],
      mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'],
      maxSize: 500 * 1024 * 1024, // 500MB
      maxDuration: 1800, // 30 minutes
      description: 'Gaming clips, highlights, and gameplay videos'
    },
    image: {
      extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'],
      mimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp'],
      maxSize: 50 * 1024 * 1024, // 50MB
      minDimensions: { width: 320, height: 240 },
      maxDimensions: { width: 7680, height: 4320 }, // 8K support
      description: 'Screenshots, artwork, and gaming images'
    },
    document: {
      extensions: ['pdf', 'txt', 'md', 'rtf'],
      mimeTypes: ['application/pdf', 'text/plain', 'text/markdown', 'application/rtf'],
      maxSize: 25 * 1024 * 1024, // 25MB
      description: 'Gaming guides, reviews, and documentation'
    },
    audio: {
      extensions: ['mp3', 'wav', 'ogg', 'm4a', 'flac'],
      mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/flac'],
      maxSize: 100 * 1024 * 1024, // 100MB
      maxDuration: 3600, // 1 hour
      description: 'Gaming audio, commentary, and sound effects'
    }
  },

  // Global file limits
  GLOBAL_LIMITS: {
    maxFilesPerUpload: 5,
    maxTotalSize: 1024 * 1024 * 1024, // 1GB total per upload
    dailyUploadLimit: 3,
    maxFileNameLength: 255
  },

  // Metadata validation rules
  METADATA_RULES: {
    title: {
      minLength: 3,
      maxLength: 100,
      required: true,
      pattern: /^[a-zA-Z0-9\s\-_.,!?()':]+$/,
      forbiddenPatterns: [/^\s+$/, /^\.+$/, /^[^\w\s]+$/]
    },
    description: {
      minLength: 10,
      maxLength: 1000,
      required: true,
      pattern: /^[\w\s\-_.,!?()'":#@\n\r]+$/,
      lineLimit: 50
    },
    tags: {
      required: true,
      minCount: 1,
      maxCount: 15,
      maxTagLength: 25,
      pattern: /^[a-zA-Z0-9\-_]+$/,
      reservedTags: ['admin', 'moderator', 'official', 'mlg', 'featured']
    },
    platform: {
      required: true,
      allowedValues: ['xbox', 'playstation', 'pc', 'mobile', 'nintendo', 'steam-deck', 'other']
    },
    category: {
      required: true,
      allowedValues: ['highlights', 'gameplay', 'tutorials', 'funny', 'competitive', 'speedrun', 'review', 'guide']
    },
    game: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z0-9\s\-_.:'"]+$/
    }
  },

  // Gaming content specific rules
  GAMING_RULES: {
    supportedGames: [
      'Call of Duty', 'Fortnite', 'Apex Legends', 'Valorant', 'Counter-Strike',
      'League of Legends', 'Overwatch', 'Rocket League', 'Destiny 2', 'Halo',
      'FIFA', 'NBA 2K', 'Madden NFL', 'Minecraft', 'Grand Theft Auto',
      'Red Dead Redemption', 'Cyberpunk 2077', 'The Witcher', 'Elden Ring',
      'Dark Souls', 'Sekiro', 'Bloodborne', 'Monster Hunter', 'Street Fighter'
    ],
    competitiveModes: ['ranked', 'tournament', 'scrimmage', 'casual', 'custom'],
    contentRatings: ['e', 't', 'm', 'ao'], // ESRB ratings
    bannedContent: ['cheat', 'cheating', 'exploit', 'exploiting', 'harassment', 'hate-speech', 'doxxing']
  },

  // Content safety configuration
  SAFETY_CONFIG: {
    profanityFilter: true,
    toxicityThreshold: 0.7,
    explicitContentDetection: true,
    copyrightDetection: false, // Would require external service
    virusScanEnabled: false, // Would require external service
    maxConsecutiveUploads: 3,
    cooldownPeriod: 300000 // 5 minutes
  },

  // Performance optimization settings
  PERFORMANCE_CONFIG: {
    chunkSize: 1024 * 1024, // 1MB chunks for large files
    maxConcurrentValidations: 3,
    validationTimeout: 30000, // 30 seconds
    enableProgressCallback: true,
    cacheValidationResults: true,
    cacheTTL: 300000 // 5 minutes
  }
};

/**
 * Profanity filter word list (basic implementation)
 */
const PROFANITY_LIST = [
  'damn', 'hell', 'crap', 'shit', 'fuck', 'bitch', 'asshole', 'bastard',
  // Add more comprehensive list in production
];

/**
 * Main Content Validation System
 */
export class ContentValidator {
  constructor(config = {}) {
    this.config = { ...CONTENT_VALIDATION_CONFIG, ...config };
    this.validationCache = new Map();
    this.activeValidations = new Set();
    this.userUploadHistory = new Map();
    
    // Initialize validation modules
    this.fileValidator = new FileValidator(this.config);
    this.metadataValidator = new MetadataValidator(this.config);
    this.contentSafetyValidator = new ContentSafetyValidator(this.config);
    this.gamingValidator = new GamingValidator(this.config);
  }

  /**
   * Validate complete content submission
   * @param {Object} contentData - Complete content submission data
   * @param {Object} options - Validation options
   * @returns {Promise<ValidationResult>}
   */
  async validateContent(contentData, options = {}) {
    const startTime = Date.now();
    const validationId = this.generateValidationId(contentData);
    
    try {
      // Check cache first
      if (this.config.PERFORMANCE_CONFIG.cacheValidationResults) {
        const cached = this.getValidationCache(validationId);
        if (cached && !cached.expired) {
          return cached.result;
        }
      }

      // Initialize validation result
      const result = {
        isValid: true,
        errors: [],
        warnings: [],
        validatedFiles: [],
        metadata: {},
        performance: {
          startTime,
          duration: 0,
          validationSteps: []
        }
      };

      // Progress callback setup
      const progressCallback = options.onProgress || (() => {});
      let currentProgress = 0;
      const totalSteps = 6;

      // Step 1: Rate limiting check
      progressCallback(currentProgress = Math.round((1/totalSteps) * 100));
      result.performance.validationSteps.push({ step: 'rate_limiting', startTime: Date.now() });
      
      const rateLimitResult = await this.checkRateLimits(contentData);
      if (!rateLimitResult.isValid) {
        result.isValid = false;
        result.errors.push(...rateLimitResult.errors);
        return this.finalizeResult(result, validationId);
      }

      // Step 2: File validation
      progressCallback(currentProgress = Math.round((2/totalSteps) * 100));
      result.performance.validationSteps.push({ step: 'file_validation', startTime: Date.now() });
      
      if (contentData.files && contentData.files.length > 0) {
        const fileResults = await this.fileValidator.validateFiles(contentData.files, {
          onProgress: (fileProgress) => progressCallback(currentProgress + Math.round(fileProgress * 0.3))
        });
        
        if (!fileResults.isValid) {
          result.isValid = false;
          result.errors.push(...fileResults.errors);
        }
        
        result.warnings.push(...fileResults.warnings);
        result.validatedFiles = fileResults.validatedFiles;
      }

      // Step 3: Metadata validation
      progressCallback(currentProgress = Math.round((3/totalSteps) * 100));
      result.performance.validationSteps.push({ step: 'metadata_validation', startTime: Date.now() });
      
      const metadataResults = await this.metadataValidator.validateMetadata(contentData.metadata || {});
      if (!metadataResults.isValid) {
        result.isValid = false;
        result.errors.push(...metadataResults.errors);
      }
      
      result.warnings.push(...metadataResults.warnings);
      result.metadata = metadataResults.validatedMetadata;

      // Step 4: Gaming-specific validation
      progressCallback(currentProgress = Math.round((4/totalSteps) * 100));
      result.performance.validationSteps.push({ step: 'gaming_validation', startTime: Date.now() });
      
      const gamingResults = await this.gamingValidator.validateGamingContent(contentData);
      if (!gamingResults.isValid) {
        result.isValid = false;
        result.errors.push(...gamingResults.errors);
      }
      
      result.warnings.push(...gamingResults.warnings);

      // Step 5: Content safety validation
      progressCallback(currentProgress = Math.round((5/totalSteps) * 100));
      result.performance.validationSteps.push({ step: 'safety_validation', startTime: Date.now() });
      
      const safetyResults = await this.contentSafetyValidator.validateContentSafety(contentData);
      if (!safetyResults.isValid) {
        result.isValid = false;
        result.errors.push(...safetyResults.errors);
      }
      
      result.warnings.push(...safetyResults.warnings);

      // Step 6: Final validation
      progressCallback(100);
      result.performance.validationSteps.push({ step: 'finalization', startTime: Date.now() });

      return this.finalizeResult(result, validationId);

    } catch (error) {
      return {
        isValid: false,
        errors: [{
          type: 'validation_error',
          message: 'Unexpected validation error occurred',
          details: error.message,
          severity: 'high'
        }],
        warnings: [],
        validatedFiles: [],
        metadata: {},
        performance: {
          startTime,
          duration: Date.now() - startTime,
          error: error.message
        }
      };
    }
  }

  /**
   * Quick file validation for real-time feedback
   * @param {File} file - File to validate
   * @returns {Promise<ValidationResult>}
   */
  async quickValidateFile(file) {
    return await this.fileValidator.validateSingleFile(file, { quick: true });
  }

  /**
   * Validate metadata in real-time
   * @param {string} field - Field name
   * @param {*} value - Field value
   * @returns {ValidationResult}
   */
  validateMetadataField(field, value) {
    return this.metadataValidator.validateField(field, value);
  }

  /**
   * Check rate limits for user
   * @param {Object} contentData - Content data
   * @returns {Promise<ValidationResult>}
   */
  async checkRateLimits(contentData) {
    const userId = contentData.userId || 'anonymous';
    const now = Date.now();
    const userHistory = this.userUploadHistory.get(userId) || { uploads: [], lastUpload: 0 };

    // Check cooldown period
    if (now - userHistory.lastUpload < this.config.SAFETY_CONFIG.cooldownPeriod) {
      return {
        isValid: false,
        errors: [{
          type: 'rate_limit',
          message: 'Please wait before uploading again',
          details: `Cooldown period: ${Math.ceil((this.config.SAFETY_CONFIG.cooldownPeriod - (now - userHistory.lastUpload)) / 1000)} seconds`,
          severity: 'medium'
        }]
      };
    }

    // Check daily upload limit
    const today = new Date().toDateString();
    const todayUploads = userHistory.uploads.filter(upload => 
      new Date(upload.timestamp).toDateString() === today
    );

    if (todayUploads.length >= this.config.GLOBAL_LIMITS.dailyUploadLimit) {
      return {
        isValid: false,
        errors: [{
          type: 'daily_limit',
          message: 'Daily upload limit exceeded',
          details: `You can upload ${this.config.GLOBAL_LIMITS.dailyUploadLimit} items per day`,
          severity: 'high'
        }]
      };
    }

    return { isValid: true, errors: [] };
  }

  /**
   * Update user upload history
   * @param {string} userId - User ID
   * @param {Object} uploadData - Upload data
   */
  updateUploadHistory(userId, uploadData) {
    const userHistory = this.userUploadHistory.get(userId) || { uploads: [], lastUpload: 0 };
    userHistory.uploads.push({
      timestamp: Date.now(),
      files: uploadData.files?.length || 0,
      size: uploadData.totalSize || 0
    });
    userHistory.lastUpload = Date.now();

    // Keep only recent uploads (last 7 days)
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    userHistory.uploads = userHistory.uploads.filter(upload => upload.timestamp > weekAgo);

    this.userUploadHistory.set(userId, userHistory);
  }

  /**
   * Generate validation ID for caching
   * @param {Object} contentData - Content data
   * @returns {string}
   */
  generateValidationId(contentData) {
    const hash = this.simpleHash(JSON.stringify({
      files: contentData.files?.map(f => ({ name: f.name, size: f.size, type: f.type })),
      metadata: contentData.metadata,
      timestamp: Math.floor(Date.now() / 60000) // Cache for 1 minute intervals
    }));
    return `validation_${hash}`;
  }

  /**
   * Simple hash function
   * @param {string} str - String to hash
   * @returns {string}
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get validation result from cache
   * @param {string} validationId - Validation ID
   * @returns {Object|null}
   */
  getValidationCache(validationId) {
    const cached = this.validationCache.get(validationId);
    if (cached && Date.now() - cached.timestamp < this.config.PERFORMANCE_CONFIG.cacheTTL) {
      return { result: cached.result, expired: false };
    }
    return null;
  }

  /**
   * Set validation result in cache
   * @param {string} validationId - Validation ID
   * @param {Object} result - Validation result
   */
  setValidationCache(validationId, result) {
    this.validationCache.set(validationId, {
      result,
      timestamp: Date.now()
    });

    // Clean old cache entries
    if (this.validationCache.size > 100) {
      const oldestKey = this.validationCache.keys().next().value;
      this.validationCache.delete(oldestKey);
    }
  }

  /**
   * Finalize validation result
   * @param {Object} result - Validation result
   * @param {string} validationId - Validation ID
   * @returns {Object}
   */
  finalizeResult(result, validationId) {
    result.performance.duration = Date.now() - result.performance.startTime;
    result.performance.endTime = Date.now();

    // Cache successful results
    if (this.config.PERFORMANCE_CONFIG.cacheValidationResults && result.isValid) {
      this.setValidationCache(validationId, result);
    }

    return result;
  }
}

/**
 * File Validation Module
 */
class FileValidator {
  constructor(config) {
    this.config = config;
  }

  /**
   * Validate multiple files
   * @param {File[]} files - Files to validate
   * @param {Object} options - Validation options
   * @returns {Promise<ValidationResult>}
   */
  async validateFiles(files, options = {}) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      validatedFiles: []
    };

    // Check global limits
    if (files.length > this.config.GLOBAL_LIMITS.maxFilesPerUpload) {
      result.isValid = false;
      result.errors.push({
        type: 'file_count_limit',
        message: 'Too many files',
        details: `Maximum ${this.config.GLOBAL_LIMITS.maxFilesPerUpload} files allowed per upload`,
        severity: 'high'
      });
      return result;
    }

    // Check total size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > this.config.GLOBAL_LIMITS.maxTotalSize) {
      result.isValid = false;
      result.errors.push({
        type: 'total_size_limit',
        message: 'Upload too large',
        details: `Total size ${this.formatFileSize(totalSize)} exceeds limit of ${this.formatFileSize(this.config.GLOBAL_LIMITS.maxTotalSize)}`,
        severity: 'high'
      });
      return result;
    }

    // Validate each file
    const progressCallback = options.onProgress || (() => {});
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileResult = await this.validateSingleFile(file);
      
      if (!fileResult.isValid) {
        result.isValid = false;
        result.errors.push(...fileResult.errors);
      }
      
      result.warnings.push(...fileResult.warnings);
      result.validatedFiles.push({
        file,
        validation: fileResult
      });

      // Progress update
      progressCallback(Math.round(((i + 1) / files.length) * 100));
    }

    return result;
  }

  /**
   * Validate single file
   * @param {File} file - File to validate
   * @param {Object} options - Validation options
   * @returns {Promise<ValidationResult>}
   */
  async validateSingleFile(file, options = {}) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      }
    };

    try {
      // Basic file checks
      if (!file.name || file.name.length === 0 || file.name.length > this.config.GLOBAL_LIMITS.maxFileNameLength || file.name.includes('\0')) {
        result.isValid = false;
        result.errors.push({
          type: 'invalid_filename',
          message: 'Invalid filename',
          details: `Filename must be 1-${this.config.GLOBAL_LIMITS.maxFileNameLength} characters and cannot contain null characters`,
          severity: 'medium'
        });
      }

      // Get file type category
      const fileTypeCategory = this.getFileTypeCategory(file);
      if (!fileTypeCategory) {
        result.isValid = false;
        result.errors.push({
          type: 'unsupported_file_type',
          message: 'Unsupported file type',
          details: `File type ${file.type} is not supported`,
          severity: 'high'
        });
        return result;
      }

      const typeConfig = this.config.SUPPORTED_FILE_TYPES[fileTypeCategory];
      result.fileInfo.category = fileTypeCategory;

      // Size validation
      if (file.size > typeConfig.maxSize) {
        result.isValid = false;
        result.errors.push({
          type: 'file_size_limit',
          message: 'File too large',
          details: `${file.name} (${this.formatFileSize(file.size)}) exceeds ${fileTypeCategory} limit of ${this.formatFileSize(typeConfig.maxSize)}`,
          severity: 'high'
        });
      }

      // File extension validation
      const extension = this.getFileExtension(file.name);
      if (!typeConfig.extensions.includes(extension)) {
        result.warnings.push({
          type: 'extension_mismatch',
          message: 'Extension mismatch',
          details: `File extension .${extension} doesn't match MIME type ${file.type}`,
          severity: 'low'
        });
      }

      // Type-specific validation
      if (!options.quick) {
        switch (fileTypeCategory) {
          case 'video':
            await this.validateVideoFile(file, result);
            break;
          case 'image':
            await this.validateImageFile(file, result);
            break;
          case 'audio':
            await this.validateAudioFile(file, result);
            break;
          case 'document':
            await this.validateDocumentFile(file, result);
            break;
        }
      }

    } catch (error) {
      result.isValid = false;
      result.errors.push({
        type: 'validation_error',
        message: 'File validation error',
        details: error.message,
        severity: 'high'
      });
    }

    return result;
  }

  /**
   * Validate video file specifics
   * @param {File} file - Video file
   * @param {Object} result - Validation result to update
   */
  async validateVideoFile(file, result) {
    try {
      const videoMetadata = await this.getVideoMetadata(file);
      result.fileInfo.metadata = videoMetadata;

      const typeConfig = this.config.SUPPORTED_FILE_TYPES.video;

      if (videoMetadata.duration > typeConfig.maxDuration) {
        result.isValid = false;
        result.errors.push({
          type: 'video_duration_limit',
          message: 'Video too long',
          details: `Video duration ${Math.round(videoMetadata.duration)}s exceeds limit of ${typeConfig.maxDuration}s`,
          severity: 'high'
        });
      }

      // Additional video checks
      if (videoMetadata.width < 320 || videoMetadata.height < 240) {
        result.warnings.push({
          type: 'low_resolution',
          message: 'Low resolution video',
          details: `Resolution ${videoMetadata.width}x${videoMetadata.height} may not display well`,
          severity: 'low'
        });
      }

    } catch (error) {
      result.warnings.push({
        type: 'metadata_extraction_failed',
        message: 'Could not analyze video',
        details: 'Video metadata extraction failed, but file appears valid',
        severity: 'low'
      });
    }
  }

  /**
   * Validate image file specifics
   * @param {File} file - Image file
   * @param {Object} result - Validation result to update
   */
  async validateImageFile(file, result) {
    try {
      const imageMetadata = await this.getImageMetadata(file);
      result.fileInfo.metadata = imageMetadata;

      const typeConfig = this.config.SUPPORTED_FILE_TYPES.image;

      // Dimension validation
      if (imageMetadata.width < typeConfig.minDimensions.width || 
          imageMetadata.height < typeConfig.minDimensions.height) {
        result.warnings.push({
          type: 'low_resolution',
          message: 'Low resolution image',
          details: `Image ${imageMetadata.width}x${imageMetadata.height} is below recommended minimum`,
          severity: 'low'
        });
      }

      if (imageMetadata.width > typeConfig.maxDimensions.width || 
          imageMetadata.height > typeConfig.maxDimensions.height) {
        result.warnings.push({
          type: 'high_resolution',
          message: 'Very high resolution image',
          details: `Image ${imageMetadata.width}x${imageMetadata.height} may take longer to process`,
          severity: 'low'
        });
      }

    } catch (error) {
      result.warnings.push({
        type: 'metadata_extraction_failed',
        message: 'Could not analyze image',
        details: 'Image metadata extraction failed, but file appears valid',
        severity: 'low'
      });
    }
  }

  /**
   * Validate audio file specifics
   * @param {File} file - Audio file
   * @param {Object} result - Validation result to update
   */
  async validateAudioFile(file, result) {
    try {
      const audioMetadata = await this.getAudioMetadata(file);
      result.fileInfo.metadata = audioMetadata;

      const typeConfig = this.config.SUPPORTED_FILE_TYPES.audio;

      if (audioMetadata.duration > typeConfig.maxDuration) {
        result.isValid = false;
        result.errors.push({
          type: 'audio_duration_limit',
          message: 'Audio too long',
          details: `Audio duration ${Math.round(audioMetadata.duration)}s exceeds limit of ${typeConfig.maxDuration}s`,
          severity: 'high'
        });
      }

    } catch (error) {
      result.warnings.push({
        type: 'metadata_extraction_failed',
        message: 'Could not analyze audio',
        details: 'Audio metadata extraction failed, but file appears valid',
        severity: 'low'
      });
    }
  }

  /**
   * Validate document file specifics
   * @param {File} file - Document file
   * @param {Object} result - Validation result to update
   */
  async validateDocumentFile(file, result) {
    // Basic document validation
    const extension = this.getFileExtension(file.name);
    
    if (extension === 'pdf') {
      result.warnings.push({
        type: 'pdf_processing',
        message: 'PDF uploaded',
        details: 'PDF content will be processed for text extraction',
        severity: 'info'
      });
    }

    if (file.size < 100) {
      result.warnings.push({
        type: 'small_document',
        message: 'Very small document',
        details: 'Document appears to be very small or empty',
        severity: 'low'
      });
    }
  }

  /**
   * Get file type category from file
   * @param {File} file - File object
   * @returns {string|null}
   */
  getFileTypeCategory(file) {
    const mimeType = file.type.toLowerCase();
    const extension = this.getFileExtension(file.name).toLowerCase();

    for (const [category, config] of Object.entries(this.config.SUPPORTED_FILE_TYPES)) {
      if (config.mimeTypes.includes(mimeType) || config.extensions.includes(extension)) {
        return category;
      }
    }

    return null;
  }

  /**
   * Get file extension
   * @param {string} filename - Filename
   * @returns {string}
   */
  getFileExtension(filename) {
    return filename.toLowerCase().split('.').pop() || '';
  }

  /**
   * Format file size for display
   * @param {number} bytes - Size in bytes
   * @returns {string}
   */
  formatFileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Get video metadata
   * @param {File} file - Video file
   * @returns {Promise<Object>}
   */
  getVideoMetadata(file) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          aspectRatio: video.videoWidth / video.videoHeight
        });
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not load video metadata'));
      };
      
      video.src = url;
    });
  }

  /**
   * Get image metadata
   * @param {File} file - Image file
   * @returns {Promise<Object>}
   */
  getImageMetadata(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight
        });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not load image metadata'));
      };
      
      img.src = url;
    });
  }

  /**
   * Get audio metadata (simplified)
   * @param {File} file - Audio file
   * @returns {Promise<Object>}
   */
  getAudioMetadata(file) {
    return new Promise((resolve, reject) => {
      const audio = document.createElement('audio');
      const url = URL.createObjectURL(file);
      
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve({
          duration: audio.duration
        });
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not load audio metadata'));
      };
      
      audio.src = url;
    });
  }
}

/**
 * Metadata Validation Module
 */
class MetadataValidator {
  constructor(config) {
    this.config = config;
  }

  /**
   * Validate complete metadata
   * @param {Object} metadata - Metadata to validate
   * @returns {ValidationResult}
   */
  validateMetadata(metadata) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      validatedMetadata: {}
    };

    for (const [field, rule] of Object.entries(this.config.METADATA_RULES)) {
      const fieldResult = this.validateField(field, metadata[field]);
      
      if (!fieldResult.isValid) {
        result.isValid = false;
        result.errors.push(...fieldResult.errors);
      }
      
      result.warnings.push(...fieldResult.warnings);
      result.validatedMetadata[field] = fieldResult.value;
    }

    return result;
  }

  /**
   * Validate single metadata field
   * @param {string} field - Field name
   * @param {*} value - Field value
   * @returns {ValidationResult}
   */
  validateField(field, value) {
    const rule = this.config.METADATA_RULES[field];
    if (!rule) {
      return { 
        isValid: true, 
        errors: [], 
        warnings: [], 
        value: value 
      };
    }

    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      value: value
    };

    // Check required fields
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      result.isValid = false;
      result.errors.push({
        type: 'required_field',
        message: `${this.capitalizeFirst(field)} is required`,
        details: `Please provide a ${field}`,
        severity: 'high'
      });
      return result;
    }

    // Skip validation for empty optional fields
    if (!rule.required && (!value || (typeof value === 'string' && !value.trim()) || (Array.isArray(value) && value.length === 0))) {
      return result;
    }

    // String-based validations
    if (typeof value === 'string') {
      const trimmedValue = value.trim();
      result.value = trimmedValue;

      // Length validation
      if (rule.minLength && trimmedValue.length < rule.minLength) {
        result.isValid = false;
        result.errors.push({
          type: 'min_length',
          message: `${this.capitalizeFirst(field)} too short`,
          details: `Minimum ${rule.minLength} characters required`,
          severity: 'medium'
        });
      }

      if (rule.maxLength && trimmedValue.length > rule.maxLength) {
        result.isValid = false;
        result.errors.push({
          type: 'max_length',
          message: `${this.capitalizeFirst(field)} too long`,
          details: `Maximum ${rule.maxLength} characters allowed`,
          severity: 'medium'
        });
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(trimmedValue)) {
        result.isValid = false;
        result.errors.push({
          type: 'pattern_mismatch',
          message: `Invalid ${field} format`,
          details: `${this.capitalizeFirst(field)} contains invalid characters`,
          severity: 'medium'
        });
      }

      // Forbidden patterns
      if (rule.forbiddenPatterns) {
        for (const pattern of rule.forbiddenPatterns) {
          if (pattern.test(trimmedValue)) {
            result.isValid = false;
            result.errors.push({
              type: 'forbidden_pattern',
              message: `Invalid ${field}`,
              details: `${this.capitalizeFirst(field)} format is not allowed`,
              severity: 'medium'
            });
            break;
          }
        }
      }

      // Line limit for multi-line fields
      if (rule.lineLimit) {
        const lines = trimmedValue.split(/\r?\n/);
        if (lines.length > rule.lineLimit) {
          result.warnings.push({
            type: 'line_limit',
            message: `Many lines in ${field}`,
            details: `Consider keeping ${field} under ${rule.lineLimit} lines for better readability`,
            severity: 'low'
          });
        }
      }
    }

    // Array-based validations (for tags)
    if (Array.isArray(value)) {
      if (rule.minCount && value.length < rule.minCount) {
        result.isValid = false;
        result.errors.push({
          type: 'min_count',
          message: `Not enough ${field}`,
          details: `Minimum ${rule.minCount} ${field} required`,
          severity: 'medium'
        });
      }

      if (rule.maxCount && value.length > rule.maxCount) {
        result.isValid = false;
        result.errors.push({
          type: 'max_count',
          message: `Too many ${field}`,
          details: `Maximum ${rule.maxCount} ${field} allowed`,
          severity: 'medium'
        });
      }

      // Validate individual tags
      if (field === 'tags') {
        const validTags = [];
        for (const tag of value) {
          const tagResult = this.validateTag(tag, rule);
          if (tagResult.isValid) {
            validTags.push(tagResult.value);
          } else {
            result.errors.push(...tagResult.errors);
            result.isValid = false;
          }
        }
        result.value = validTags;
      }
    }

    // Allowed values validation
    if (rule.allowedValues && !rule.allowedValues.includes(value)) {
      result.isValid = false;
      result.errors.push({
        type: 'invalid_value',
        message: `Invalid ${field}`,
        details: `${field} must be one of: ${rule.allowedValues.join(', ')}`,
        severity: 'medium'
      });
    }

    return result;
  }

  /**
   * Validate individual tag
   * @param {string} tag - Tag to validate
   * @param {Object} rule - Validation rule
   * @returns {ValidationResult}
   */
  validateTag(tag, rule) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      value: tag.toLowerCase().trim()
    };

    if (!result.value) {
      result.isValid = false;
      result.errors.push({
        type: 'empty_tag',
        message: 'Empty tag',
        details: 'Tags cannot be empty',
        severity: 'medium'
      });
      return result;
    }

    if (result.value.length > rule.maxTagLength) {
      result.isValid = false;
      result.errors.push({
        type: 'tag_too_long',
        message: 'Tag too long',
        details: `Tag "${result.value}" exceeds ${rule.maxTagLength} characters`,
        severity: 'medium'
      });
    }

    if (rule.pattern && !rule.pattern.test(result.value)) {
      result.isValid = false;
      result.errors.push({
        type: 'invalid_tag_format',
        message: 'Invalid tag format',
        details: `Tag "${result.value}" contains invalid characters`,
        severity: 'medium'
      });
    }

    if (rule.reservedTags && rule.reservedTags.includes(result.value)) {
      result.isValid = false;
      result.errors.push({
        type: 'reserved_tag',
        message: 'Reserved tag',
        details: `Tag "${result.value}" is reserved and cannot be used`,
        severity: 'high'
      });
    }

    return result;
  }

  /**
   * Capitalize first letter
   * @param {string} str - String to capitalize
   * @returns {string}
   */
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

/**
 * Gaming-Specific Validation Module
 */
class GamingValidator {
  constructor(config) {
    this.config = config;
  }

  /**
   * Validate gaming-specific content
   * @param {Object} contentData - Content data
   * @returns {ValidationResult}
   */
  validateGamingContent(contentData) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    const metadata = contentData.metadata || {};

    // Game title validation
    if (metadata.game) {
      const gameValidation = this.validateGame(metadata.game);
      if (!gameValidation.isValid) {
        result.warnings.push(...gameValidation.warnings);
      }
    }

    // Platform validation
    if (metadata.platform) {
      const platformValidation = this.validatePlatform(metadata.platform);
      if (!platformValidation.isValid) {
        result.isValid = false;
        result.errors.push(...platformValidation.errors);
      }
    }

    // Content category validation
    if (metadata.category) {
      const categoryValidation = this.validateContentCategory(metadata.category);
      if (!categoryValidation.isValid) {
        result.isValid = false;
        result.errors.push(...categoryValidation.errors);
      }
    }

    // Gaming mode validation (if applicable)
    if (metadata.gameMode) {
      const modeValidation = this.validateGameMode(metadata.gameMode);
      if (!modeValidation.isValid) {
        result.warnings.push(...modeValidation.warnings);
      }
    }

    // Content rating validation
    if (metadata.contentRating) {
      const ratingValidation = this.validateContentRating(metadata.contentRating);
      if (!ratingValidation.isValid) {
        result.warnings.push(...ratingValidation.warnings);
      }
    }

    // Banned content check
    const bannedContentCheck = this.checkBannedContent(contentData);
    if (!bannedContentCheck.isValid) {
      result.isValid = false;
      result.errors.push(...bannedContentCheck.errors);
    }

    return result;
  }

  /**
   * Validate game title
   * @param {string} game - Game title
   * @returns {ValidationResult}
   */
  validateGame(game) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    const normalizedGame = game.toLowerCase().trim();
    const supportedGames = this.config.GAMING_RULES.supportedGames.map(g => g.toLowerCase());

    // Check if it's a supported game (exact and partial matching)
    const isSupported = supportedGames.some(supportedGame => {
      return normalizedGame === supportedGame || 
             normalizedGame.includes(supportedGame) || 
             supportedGame.includes(normalizedGame);
    });

    if (!isSupported) {
      result.warnings.push({
        type: 'unsupported_game',
        message: 'Game not in supported list',
        details: `"${game}" may not have official MLG.clan support`,
        severity: 'low'
      });
    }

    return result;
  }

  /**
   * Validate gaming platform
   * @param {string} platform - Gaming platform
   * @returns {ValidationResult}
   */
  validatePlatform(platform) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    const allowedPlatforms = this.config.METADATA_RULES.platform.allowedValues;
    
    if (!allowedPlatforms.includes(platform.toLowerCase())) {
      result.isValid = false;
      result.errors.push({
        type: 'invalid_platform',
        message: 'Invalid gaming platform',
        details: `Platform "${platform}" is not supported`,
        severity: 'high'
      });
    }

    return result;
  }

  /**
   * Validate content category
   * @param {string} category - Content category
   * @returns {ValidationResult}
   */
  validateContentCategory(category) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    const allowedCategories = this.config.METADATA_RULES.category.allowedValues;
    
    if (!allowedCategories.includes(category.toLowerCase())) {
      result.isValid = false;
      result.errors.push({
        type: 'invalid_category',
        message: 'Invalid content category',
        details: `Category "${category}" is not supported`,
        severity: 'high'
      });
    }

    return result;
  }

  /**
   * Validate game mode
   * @param {string} gameMode - Game mode
   * @returns {ValidationResult}
   */
  validateGameMode(gameMode) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    const competitiveModes = this.config.GAMING_RULES.competitiveModes;
    
    if (!competitiveModes.includes(gameMode.toLowerCase())) {
      result.warnings.push({
        type: 'unknown_game_mode',
        message: 'Unknown game mode',
        details: `Game mode "${gameMode}" is not in our standard list`,
        severity: 'low'
      });
    }

    return result;
  }

  /**
   * Validate content rating
   * @param {string} rating - Content rating
   * @returns {ValidationResult}
   */
  validateContentRating(rating) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    const contentRatings = this.config.GAMING_RULES.contentRatings;
    
    if (!contentRatings.includes(rating.toLowerCase())) {
      result.warnings.push({
        type: 'unknown_content_rating',
        message: 'Unknown content rating',
        details: `Content rating "${rating}" is not recognized`,
        severity: 'low'
      });
    }

    return result;
  }

  /**
   * Check for banned content
   * @param {Object} contentData - Content data
   * @returns {ValidationResult}
   */
  checkBannedContent(contentData) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    const bannedContent = this.config.GAMING_RULES.bannedContent;
    const metadata = contentData.metadata || {};

    // Check title and description for banned content keywords
    const textFields = [metadata.title, metadata.description].filter(Boolean);
    
    for (const text of textFields) {
      const lowerText = text.toLowerCase();
      for (const banned of bannedContent) {
        // Use word boundary matching to avoid false positives
        const regex = new RegExp(`\\b${banned}\\b`, 'i');
        if (regex.test(lowerText)) {
          result.isValid = false;
          result.errors.push({
            type: 'banned_content',
            message: 'Content violates community guidelines',
            details: 'Content contains prohibited material',
            severity: 'high'
          });
          break;
        }
      }
      if (!result.isValid) break;
    }

    // Check tags for banned content
    if (metadata.tags && Array.isArray(metadata.tags)) {
      for (const tag of metadata.tags) {
        if (bannedContent.includes(tag.toLowerCase())) {
          result.isValid = false;
          result.errors.push({
            type: 'banned_tag',
            message: 'Prohibited tag detected',
            details: `Tag "${tag}" violates community guidelines`,
            severity: 'high'
          });
          break;
        }
      }
    }

    return result;
  }

  /**
   * Calculate string similarity
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} - Similarity score (0-1)
   */
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    return (longer.length - this.editDistance(longer, shorter)) / longer.length;
  }

  /**
   * Calculate edit distance between strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} - Edit distance
   */
  editDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}

/**
 * Content Safety Validation Module
 */
class ContentSafetyValidator {
  constructor(config) {
    this.config = config;
  }

  /**
   * Validate content safety
   * @param {Object} contentData - Content data
   * @returns {ValidationResult}
   */
  validateContentSafety(contentData) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    const metadata = contentData.metadata || {};

    // Profanity filtering
    if (this.config.SAFETY_CONFIG.profanityFilter) {
      const profanityCheck = this.checkProfanity(metadata);
      if (!profanityCheck.isValid) {
        result.isValid = false;
        result.errors.push(...profanityCheck.errors);
      }
      result.warnings.push(...profanityCheck.warnings);
    }

    // Toxicity detection (simplified)
    const toxicityCheck = this.detectToxicity(metadata);
    if (!toxicityCheck.isValid) {
      result.isValid = false;
      result.errors.push(...toxicityCheck.errors);
    }

    // Explicit content detection for files
    if (contentData.files && this.config.SAFETY_CONFIG.explicitContentDetection) {
      const explicitCheck = this.checkExplicitContent(contentData.files);
      if (!explicitCheck.isValid) {
        result.warnings.push(...explicitCheck.warnings);
      }
    }

    return result;
  }

  /**
   * Check for profanity in text content
   * @param {Object} metadata - Metadata containing text
   * @returns {ValidationResult}
   */
  checkProfanity(metadata) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    const textFields = [metadata.title, metadata.description].filter(Boolean);
    
    for (const text of textFields) {
      const words = text.toLowerCase().split(/\s+/);
      const foundProfanity = [];

      for (const word of words) {
        const cleanWord = word.replace(/[^\w]/g, '');
        // Check both exact match and partial match for profanity
        if (PROFANITY_LIST.some(profane => cleanWord.includes(profane) || word.includes(profane))) {
          foundProfanity.push(word);
        }
      }

      if (foundProfanity.length > 0) {
        if (foundProfanity.length > 3) {
          result.isValid = false;
          result.errors.push({
            type: 'excessive_profanity',
            message: 'Content contains excessive profanity',
            details: 'Please reduce the use of profane language',
            severity: 'high'
          });
        } else {
          result.warnings.push({
            type: 'mild_profanity',
            message: 'Content contains some profanity',
            details: 'Consider using more appropriate language for better community engagement',
            severity: 'low'
          });
        }
      }
    }

    // Check tags for profanity
    if (metadata.tags && Array.isArray(metadata.tags)) {
      const profaneTags = metadata.tags.filter(tag => 
        PROFANITY_LIST.includes(tag.toLowerCase())
      );

      if (profaneTags.length > 0) {
        result.isValid = false;
        result.errors.push({
          type: 'profane_tags',
          message: 'Tags contain inappropriate language',
          details: `Please remove inappropriate tags: ${profaneTags.join(', ')}`,
          severity: 'high'
        });
      }
    }

    return result;
  }

  /**
   * Detect toxicity in content (simplified implementation)
   * @param {Object} metadata - Metadata to check
   * @returns {ValidationResult}
   */
  detectToxicity(metadata) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Simplified toxicity detection based on patterns
    const toxicPatterns = [
      /k[yi]ll\s+(yourself|urself)/i,
      /(hate|kill)\s+all\s+/i,
      /you\s+(should|deserve)\s+(to\s+)?die/i,
      /go\s+die\s+in\s+a\s+fire/i,
      /(stupid|dumb|retarded)\s+(idiot|moron)/i
    ];

    const textContent = [metadata.title, metadata.description].filter(Boolean).join(' ');

    if (textContent.trim()) {
      for (const pattern of toxicPatterns) {
        if (pattern.test(textContent)) {
          result.isValid = false;
          result.errors.push({
            type: 'toxic_content',
            message: 'Content contains toxic language',
            details: 'Please revise content to follow community guidelines',
            severity: 'high'
          });
          break;
        }
      }
    }

    return result;
  }

  /**
   * Check for explicit content in files (placeholder)
   * @param {File[]} files - Files to check
   * @returns {ValidationResult}
   */
  checkExplicitContent(files) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // This would typically integrate with external services
    // For now, just provide a placeholder warning for certain file types
    const explicitRiskFiles = files.filter(file => 
      file.type.startsWith('image/') && file.size > 10 * 1024 * 1024 // Large images
    );

    if (explicitRiskFiles.length > 0) {
      result.warnings.push({
        type: 'explicit_content_risk',
        message: 'Large image files detected',
        details: 'Large images will be reviewed for appropriate content',
        severity: 'info'
      });
    }

    return result;
  }
}

/**
 * Validation utilities and helpers
 */
export const ValidationUtils = {
  /**
   * Format validation errors for user display
   * @param {Object} validationResult - Validation result
   * @returns {Object}
   */
  formatErrors(validationResult) {
    return {
      hasErrors: !validationResult.isValid,
      errorCount: validationResult.errors.length,
      warningCount: validationResult.warnings.length,
      errors: validationResult.errors.map(error => ({
        message: error.message,
        details: error.details,
        type: error.type,
        severity: error.severity
      })),
      warnings: validationResult.warnings.map(warning => ({
        message: warning.message,
        details: warning.details,
        type: warning.type,
        severity: warning.severity
      }))
    };
  },

  /**
   * Get validation summary text
   * @param {Object} validationResult - Validation result
   * @returns {string}
   */
  getValidationSummary(validationResult) {
    if (validationResult.isValid) {
      if (validationResult.warnings.length > 0) {
        return `Content is valid with ${validationResult.warnings.length} warning(s)`;
      }
      return 'Content is valid and ready for upload';
    }

    return `Content validation failed with ${validationResult.errors.length} error(s)`;
  },

  /**
   * Filter errors by severity
   * @param {Array} errors - Error array
   * @param {string} severity - Severity level
   * @returns {Array}
   */
  filterErrorsBySeverity(errors, severity) {
    return errors.filter(error => error.severity === severity);
  },

  /**
   * Get highest severity level from errors
   * @param {Array} errors - Error array
   * @returns {string}
   */
  getHighestSeverity(errors) {
    if (errors.some(e => e.severity === 'high')) return 'high';
    if (errors.some(e => e.severity === 'medium')) return 'medium';
    if (errors.some(e => e.severity === 'low')) return 'low';
    return 'info';
  }
};

// Default export
export default ContentValidator;