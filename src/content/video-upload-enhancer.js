/**
 * MLG.clan Enhanced Video Upload System - Sub-task 6.8
 * 
 * Enhanced drag-and-drop video upload system with:
 * - Video transcoding and optimization
 * - Thumbnail generation
 * - Multiple format support
 * - CDN integration
 * - Performance optimization
 * - Progress tracking
 * 
 * @author Claude Code - Production Video Systems Engineer
 * @version 1.0.0
 */

/**
 * Video Upload Configuration
 */
const VIDEO_UPLOAD_CONFIG = {
  // Supported video formats
  SUPPORTED_FORMATS: {
    input: ['mp4', 'mov', 'avi', 'wmv', 'webm', 'mkv', 'flv', 'ogv', '3gp', 'mp4v'],
    output: ['mp4', 'webm'], // Optimized formats
    priority: 'mp4' // Primary format for compatibility
  },
  
  // File size limits
  MAX_FILE_SIZE: 2 * 1024 * 1024 * 1024, // 2GB
  MAX_CONCURRENT_UPLOADS: 3,
  CHUNK_SIZE: 5 * 1024 * 1024, // 5MB chunks
  
  // Video processing settings
  TRANSCODING: {
    qualities: [
      { name: '1080p', width: 1920, height: 1080, bitrate: '5000k', crf: 23 },
      { name: '720p', width: 1280, height: 720, bitrate: '3000k', crf: 23 },
      { name: '480p', width: 854, height: 480, bitrate: '1500k', crf: 28 }
    ],
    defaultQuality: '720p',
    audio: {
      codec: 'aac',
      bitrate: '128k',
      sampleRate: 44100
    },
    frameRate: 30,
    keyframeInterval: 2
  },
  
  // Thumbnail settings
  THUMBNAIL: {
    count: 3,
    positions: [0.1, 0.5, 0.9], // 10%, 50%, 90% of video
    width: 1280,
    height: 720,
    format: 'jpg',
    quality: 85
  },
  
  // CDN settings
  CDN: {
    enabled: true,
    endpoint: 'https://cdn.mlg.clan',
    regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
    cacheTTL: 86400 // 24 hours
  },
  
  // Processing limits
  LIMITS: {
    maxDuration: 1800, // 30 minutes
    maxDimensions: { width: 3840, height: 2160 }, // 4K
    minDimensions: { width: 480, height: 270 },
    maxBitrate: 50000, // 50 Mbps
    maxFrameRate: 60
  }
};

/**
 * Enhanced Video Upload System
 */
export class VideoUploadEnhancer {
  constructor(options = {}) {
    this.config = { ...VIDEO_UPLOAD_CONFIG, ...options.config };
    this.container = null;
    this.dropZone = null;
    this.fileInput = null;
    this.uploadQueue = [];
    this.activeUploads = new Map();
    this.workers = new Map();
    
    // Event handlers
    this.onProgress = options.onProgress || this.defaultProgressHandler;
    this.onComplete = options.onComplete || this.defaultCompleteHandler;
    this.onError = options.onError || this.defaultErrorHandler;
    
    // Initialize Web Workers for video processing
    this.initializeWorkers();
    
    console.log('VideoUploadEnhancer initialized');
  }

  /**
   * Initialize video processing workers
   */
  initializeWorkers() {
    // FFmpeg Web Worker for transcoding
    if (window.Worker) {
      this.workers.set('transcoder', new Worker('/src/workers/video-transcoder-worker.js'));
      this.workers.set('thumbnail', new Worker('/src/workers/thumbnail-generator-worker.js'));
      
      // Set up worker message handlers
      this.workers.get('transcoder').onmessage = (e) => this.handleTranscoderMessage(e);
      this.workers.get('thumbnail').onmessage = (e) => this.handleThumbnailMessage(e);
    }
  }

  /**
   * Create enhanced drag-and-drop interface
   */
  createDropZone(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container ${containerId} not found`);
    }

    this.container.innerHTML = `
      <div class="enhanced-video-upload-zone">
        <div class="drop-zone ${this.getDragClass()}" id="enhanced-drop-zone">
          <div class="drop-zone-content">
            <div class="upload-icon">
              <svg viewBox="0 0 24 24" class="upload-svg">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" fill="currentColor"/>
                <path d="M12,14L8,10H11V6H13V10H16L12,14Z" fill="#10b981"/>
              </svg>
            </div>
            
            <div class="upload-text">
              <h3>Drop your videos here</h3>
              <p>Or <span class="browse-link" role="button" tabindex="0">browse files</span></p>
              <div class="supported-formats">
                Supports: ${this.config.SUPPORTED_FORMATS.input.map(f => f.toUpperCase()).join(', ')}
              </div>
            </div>
            
            <div class="upload-limits">
              <div class="limit-item">
                <span class="limit-label">Max file size:</span>
                <span class="limit-value">${this.formatFileSize(this.config.MAX_FILE_SIZE)}</span>
              </div>
              <div class="limit-item">
                <span class="limit-label">Max duration:</span>
                <span class="limit-value">${Math.floor(this.config.LIMITS.maxDuration / 60)} minutes</span>
              </div>
              <div class="limit-item">
                <span class="limit-label">Max resolution:</span>
                <span class="limit-value">${this.config.LIMITS.maxDimensions.width}x${this.config.LIMITS.maxDimensions.height}</span>
              </div>
            </div>
          </div>
          
          <div class="processing-overlay" style="display: none;">
            <div class="processing-content">
              <div class="processing-spinner"></div>
              <h4>Processing Video...</h4>
              <p>This may take a few minutes</p>
            </div>
          </div>
        </div>
        
        <input type="file" 
               id="enhanced-file-input" 
               multiple 
               accept="${this.getAcceptString()}"
               style="display: none;">
        
        <div class="upload-queue" id="upload-queue" style="display: none;">
          <h4>Upload Queue</h4>
          <div class="queue-items"></div>
        </div>
        
        <div class="upload-settings" id="upload-settings">
          <div class="settings-header">
            <h4>Processing Settings</h4>
            <button class="toggle-settings" aria-label="Toggle settings">⚙️</button>
          </div>
          
          <div class="settings-content" style="display: none;">
            <div class="setting-group">
              <label for="quality-select">Output Quality:</label>
              <select id="quality-select" class="quality-selector">
                ${this.config.TRANSCODING.qualities.map(q => 
                  `<option value="${q.name}" ${q.name === this.config.TRANSCODING.defaultQuality ? 'selected' : ''}>${q.name}</option>`
                ).join('')}
              </select>
            </div>
            
            <div class="setting-group">
              <label for="format-select">Output Format:</label>
              <select id="format-select" class="format-selector">
                ${this.config.SUPPORTED_FORMATS.output.map(format => 
                  `<option value="${format}" ${format === this.config.SUPPORTED_FORMATS.priority ? 'selected' : ''}>${format.toUpperCase()}</option>`
                ).join('')}
              </select>
            </div>
            
            <div class="setting-group">
              <label class="checkbox-label">
                <input type="checkbox" id="auto-thumbnail" checked>
                <span class="checkmark"></span>
                Generate thumbnails automatically
              </label>
            </div>
            
            <div class="setting-group">
              <label class="checkbox-label">
                <input type="checkbox" id="cdn-upload" ${this.config.CDN.enabled ? 'checked' : ''}>
                <span class="checkmark"></span>
                Upload to CDN for faster delivery
              </label>
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupEventHandlers();
    return this.container;
  }

  /**
   * Set up event handlers
   */
  setupEventHandlers() {
    this.dropZone = this.container.querySelector('#enhanced-drop-zone');
    this.fileInput = this.container.querySelector('#enhanced-file-input');
    const browseLink = this.container.querySelector('.browse-link');
    const settingsToggle = this.container.querySelector('.toggle-settings');

    // Drag and drop handlers
    this.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.dropZone.addEventListener('dragenter', (e) => this.handleDragEnter(e));
    this.dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    this.dropZone.addEventListener('drop', (e) => this.handleDrop(e));

    // File input handlers
    this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    browseLink.addEventListener('click', () => this.fileInput.click());
    browseLink.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        this.fileInput.click();
      }
    });

    // Settings toggle
    settingsToggle.addEventListener('click', () => this.toggleSettings());

    // Prevent default drag behaviors
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());
  }

  /**
   * Handle drag over event
   */
  handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    this.dropZone.classList.add('drag-over');
  }

  /**
   * Handle drag enter event
   */
  handleDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    this.dropZone.classList.add('drag-active');
  }

  /**
   * Handle drag leave event
   */
  handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Only remove classes if leaving the drop zone entirely
    if (!this.dropZone.contains(e.relatedTarget)) {
      this.dropZone.classList.remove('drag-over', 'drag-active');
    }
  }

  /**
   * Handle drop event
   */
  handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    this.dropZone.classList.remove('drag-over', 'drag-active');
    
    const files = Array.from(e.dataTransfer.files);
    this.processFiles(files);
  }

  /**
   * Handle file select from input
   */
  handleFileSelect(e) {
    const files = Array.from(e.target.files);
    this.processFiles(files);
    e.target.value = ''; // Clear input for reuse
  }

  /**
   * Process uploaded files
   */
  async processFiles(files) {
    if (!files || files.length === 0) return;

    // Filter video files
    const videoFiles = files.filter(file => this.isVideoFile(file));
    
    if (videoFiles.length === 0) {
      this.showError('No video files found. Please upload video files only.');
      return;
    }

    // Validate files
    const validFiles = [];
    for (const file of videoFiles) {
      try {
        await this.validateFile(file);
        validFiles.push(file);
      } catch (error) {
        this.showError(`${file.name}: ${error.message}`);
      }
    }

    if (validFiles.length === 0) return;

    // Add files to upload queue
    this.addToQueue(validFiles);
    
    // Start processing if not at limit
    this.processQueue();
  }

  /**
   * Validate uploaded file
   */
  async validateFile(file) {
    // Check file size
    if (file.size > this.config.MAX_FILE_SIZE) {
      throw new Error(`File too large. Maximum size: ${this.formatFileSize(this.config.MAX_FILE_SIZE)}`);
    }

    // Check file type
    if (!this.isVideoFile(file)) {
      throw new Error('Invalid file type. Please upload video files only.');
    }

    // Get video metadata
    try {
      const metadata = await this.getVideoMetadata(file);
      
      // Check duration
      if (metadata.duration > this.config.LIMITS.maxDuration) {
        throw new Error(`Video too long. Maximum duration: ${Math.floor(this.config.LIMITS.maxDuration / 60)} minutes`);
      }

      // Check dimensions
      if (metadata.width > this.config.LIMITS.maxDimensions.width || 
          metadata.height > this.config.LIMITS.maxDimensions.height) {
        throw new Error(`Resolution too high. Maximum: ${this.config.LIMITS.maxDimensions.width}x${this.config.LIMITS.maxDimensions.height}`);
      }

      if (metadata.width < this.config.LIMITS.minDimensions.width || 
          metadata.height < this.config.LIMITS.minDimensions.height) {
        throw new Error(`Resolution too low. Minimum: ${this.config.LIMITS.minDimensions.width}x${this.config.LIMITS.minDimensions.height}`);
      }

      return metadata;
    } catch (error) {
      if (error.message.includes('Resolution') || error.message.includes('duration')) {
        throw error;
      }
      // If we can't read metadata, assume it's valid
      console.warn('Could not read video metadata:', error);
      return null;
    }
  }

  /**
   * Get video metadata using HTML5 video element
   */
  getVideoMetadata(file) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight
        });
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        reject(new Error('Could not read video metadata'));
        URL.revokeObjectURL(video.src);
      };

      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Add files to upload queue
   */
  addToQueue(files) {
    const queueContainer = this.container.querySelector('#upload-queue');
    const queueItems = queueContainer.querySelector('.queue-items');

    files.forEach(file => {
      const uploadId = this.generateUploadId();
      const queueItem = {
        id: uploadId,
        file,
        status: 'pending',
        progress: 0,
        startTime: null,
        metadata: null
      };

      this.uploadQueue.push(queueItem);

      // Create queue item UI
      const itemElement = this.createQueueItemElement(queueItem);
      queueItems.appendChild(itemElement);
    });

    // Show queue container
    queueContainer.style.display = 'block';
  }

  /**
   * Create queue item UI element
   */
  createQueueItemElement(queueItem) {
    const element = document.createElement('div');
    element.className = 'queue-item';
    element.setAttribute('data-upload-id', queueItem.id);
    
    element.innerHTML = `
      <div class="queue-item-info">
        <div class="file-icon">🎬</div>
        <div class="file-details">
          <div class="file-name">${queueItem.file.name}</div>
          <div class="file-size">${this.formatFileSize(queueItem.file.size)}</div>
        </div>
      </div>
      
      <div class="queue-item-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: 0%"></div>
        </div>
        <div class="progress-text">Pending...</div>
      </div>
      
      <div class="queue-item-actions">
        <button class="action-btn cancel-btn" onclick="videoUploader.cancelUpload('${queueItem.id}')" title="Cancel">
          ✕
        </button>
      </div>
    `;

    return element;
  }

  /**
   * Process upload queue
   */
  async processQueue() {
    // Check if we can start more uploads
    if (this.activeUploads.size >= this.config.MAX_CONCURRENT_UPLOADS) {
      return;
    }

    // Find next pending upload
    const nextUpload = this.uploadQueue.find(item => item.status === 'pending');
    if (!nextUpload) {
      return;
    }

    // Start the upload
    nextUpload.status = 'processing';
    nextUpload.startTime = Date.now();
    this.activeUploads.set(nextUpload.id, nextUpload);

    try {
      await this.processVideo(nextUpload);
    } catch (error) {
      console.error('Upload processing error:', error);
      this.handleUploadError(nextUpload.id, error);
    }

    // Process next in queue
    setTimeout(() => this.processQueue(), 100);
  }

  /**
   * Process individual video
   */
  async processVideo(uploadItem) {
    const { id, file } = uploadItem;
    
    this.updateProgress(id, 10, 'Analyzing video...');

    // Get video metadata
    try {
      const metadata = await this.getVideoMetadata(file);
      uploadItem.metadata = metadata;
    } catch (error) {
      console.warn('Could not get metadata:', error);
    }

    this.updateProgress(id, 20, 'Preparing for processing...');

    // Get processing settings
    const settings = this.getProcessingSettings();
    
    // Generate thumbnails
    let thumbnails = [];
    if (settings.autoThumbnail) {
      this.updateProgress(id, 30, 'Generating thumbnails...');
      thumbnails = await this.generateThumbnails(file);
    }

    this.updateProgress(id, 50, 'Transcoding video...');

    // Transcode video
    const transcodedVideo = await this.transcodeVideo(file, settings);
    
    this.updateProgress(id, 80, 'Uploading to server...');

    // Upload files
    const uploadResults = await this.uploadFiles(id, {
      originalFile: file,
      transcodedVideo,
      thumbnails,
      metadata: uploadItem.metadata
    });

    this.updateProgress(id, 100, 'Complete!');

    // Mark as completed
    uploadItem.status = 'completed';
    uploadItem.results = uploadResults;
    this.activeUploads.delete(id);

    // Notify completion
    this.onComplete(uploadItem);

    // Clean up UI
    setTimeout(() => this.removeFromQueue(id), 3000);
  }

  /**
   * Generate video thumbnails
   */
  async generateThumbnails(file) {
    return new Promise((resolve, reject) => {
      const worker = this.workers.get('thumbnail');
      const requestId = this.generateUploadId();

      const handleMessage = (e) => {
        const { id, type, data, error } = e.data;
        
        if (id !== requestId) return;

        if (type === 'thumbnails-generated') {
          worker.removeEventListener('message', handleMessage);
          resolve(data.thumbnails);
        } else if (type === 'thumbnail-error') {
          worker.removeEventListener('message', handleMessage);
          reject(new Error(error));
        }
      };

      worker.addEventListener('message', handleMessage);

      worker.postMessage({
        id: requestId,
        type: 'generate-thumbnails',
        file: file,
        config: this.config.THUMBNAIL
      });
    });
  }

  /**
   * Transcode video
   */
  async transcodeVideo(file, settings) {
    return new Promise((resolve, reject) => {
      const worker = this.workers.get('transcoder');
      const requestId = this.generateUploadId();

      const handleMessage = (e) => {
        const { id, type, data, progress, error } = e.data;
        
        if (id !== requestId) return;

        if (type === 'transcode-progress') {
          // Update progress based on transcoding
          const totalProgress = 50 + (progress * 0.3); // 50-80% range
          this.updateProgressForTranscode(requestId, totalProgress, 'Transcoding...');
        } else if (type === 'transcode-complete') {
          worker.removeEventListener('message', handleMessage);
          resolve(data.transcodedFile);
        } else if (type === 'transcode-error') {
          worker.removeEventListener('message', handleMessage);
          reject(new Error(error));
        }
      };

      worker.addEventListener('message', handleMessage);

      worker.postMessage({
        id: requestId,
        type: 'transcode-video',
        file: file,
        settings: {
          quality: settings.quality,
          format: settings.format,
          transcoding: this.config.TRANSCODING
        }
      });
    });
  }

  /**
   * Upload processed files
   */
  async uploadFiles(uploadId, files) {
    const formData = new FormData();
    
    // Add original file
    formData.append('original', files.originalFile);
    
    // Add transcoded video
    if (files.transcodedVideo) {
      formData.append('video', files.transcodedVideo);
    }
    
    // Add thumbnails
    files.thumbnails.forEach((thumbnail, index) => {
      formData.append(`thumbnail_${index}`, thumbnail);
    });
    
    // Add metadata
    formData.append('metadata', JSON.stringify(files.metadata));
    
    // Upload settings
    const settings = this.getProcessingSettings();
    formData.append('settings', JSON.stringify(settings));

    try {
      const response = await fetch('/api/content/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'X-Upload-Id': uploadId
        }
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Upload error: ${error.message}`);
    }
  }

  /**
   * Update upload progress
   */
  updateProgress(uploadId, progress, status) {
    const item = this.uploadQueue.find(item => item.id === uploadId);
    if (item) {
      item.progress = progress;
      item.status = status;
    }

    // Update UI
    const element = this.container.querySelector(`[data-upload-id="${uploadId}"]`);
    if (element) {
      const progressFill = element.querySelector('.progress-fill');
      const progressText = element.querySelector('.progress-text');
      
      progressFill.style.width = `${progress}%`;
      progressText.textContent = status;

      // Add completion class
      if (progress === 100) {
        element.classList.add('completed');
      }
    }
  }

  /**
   * Update progress specifically for transcoding
   */
  updateProgressForTranscode(uploadId, progress, status) {
    // Find the actual upload item that matches this transcode operation
    const activeUpload = Array.from(this.activeUploads.values()).find(upload => 
      upload.status === 'processing'
    );
    
    if (activeUpload) {
      this.updateProgress(activeUpload.id, progress, status);
    }
  }

  /**
   * Handle upload error
   */
  handleUploadError(uploadId, error) {
    const item = this.uploadQueue.find(item => item.id === uploadId);
    if (item) {
      item.status = 'error';
      item.error = error;
    }

    // Update UI
    const element = this.container.querySelector(`[data-upload-id="${uploadId}"]`);
    if (element) {
      element.classList.add('error');
      const progressText = element.querySelector('.progress-text');
      progressText.textContent = `Error: ${error.message}`;
    }

    this.activeUploads.delete(uploadId);
    this.onError(error, uploadId);
  }

  /**
   * Cancel upload
   */
  cancelUpload(uploadId) {
    const item = this.uploadQueue.find(item => item.id === uploadId);
    if (!item) return;

    if (item.status === 'processing') {
      // Cancel active processing
      this.activeUploads.delete(uploadId);
    }

    this.removeFromQueue(uploadId);
  }

  /**
   * Remove item from queue
   */
  removeFromQueue(uploadId) {
    // Remove from queue array
    const index = this.uploadQueue.findIndex(item => item.id === uploadId);
    if (index !== -1) {
      this.uploadQueue.splice(index, 1);
    }

    // Remove from UI
    const element = this.container.querySelector(`[data-upload-id="${uploadId}"]`);
    if (element) {
      element.remove();
    }

    // Hide queue if empty
    if (this.uploadQueue.length === 0) {
      const queueContainer = this.container.querySelector('#upload-queue');
      queueContainer.style.display = 'none';
    }

    // Process next in queue
    this.processQueue();
  }

  /**
   * Get current processing settings
   */
  getProcessingSettings() {
    return {
      quality: this.container.querySelector('#quality-select')?.value || this.config.TRANSCODING.defaultQuality,
      format: this.container.querySelector('#format-select')?.value || this.config.SUPPORTED_FORMATS.priority,
      autoThumbnail: this.container.querySelector('#auto-thumbnail')?.checked || false,
      cdnUpload: this.container.querySelector('#cdn-upload')?.checked || false
    };
  }

  /**
   * Toggle settings panel
   */
  toggleSettings() {
    const content = this.container.querySelector('.settings-content');
    const toggle = this.container.querySelector('.toggle-settings');
    
    if (content.style.display === 'none') {
      content.style.display = 'block';
      toggle.textContent = '🔼';
    } else {
      content.style.display = 'none';
      toggle.textContent = '⚙️';
    }
  }

  /**
   * Utility methods
   */
  isVideoFile(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    return this.config.SUPPORTED_FORMATS.input.includes(extension);
  }

  getAcceptString() {
    return this.config.SUPPORTED_FORMATS.input.map(ext => `.${ext}`).join(',');
  }

  getDragClass() {
    return 'enhanced-drop-zone';
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  generateUploadId() {
    return 'upload_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  showError(message) {
    // Create or update error display
    let errorDiv = this.container.querySelector('.upload-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'upload-error';
      this.container.appendChild(errorDiv);
    }
    
    errorDiv.innerHTML = `
      <div class="error-message">
        <span class="error-icon">⚠️</span>
        <span class="error-text">${message}</span>
        <button class="close-error" onclick="this.parentElement.parentElement.remove()">✕</button>
      </div>
    `;

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 5000);
  }

  /**
   * Default event handlers
   */
  defaultProgressHandler(uploadId, progress, status) {
    console.log(`Upload ${uploadId}: ${progress}% - ${status}`);
  }

  defaultCompleteHandler(uploadItem) {
    console.log('Upload completed:', uploadItem);
  }

  defaultErrorHandler(error, uploadId) {
    console.error('Upload error:', error, uploadId);
  }

  /**
   * Handle worker messages
   */
  handleTranscoderMessage(e) {
    // Handled in transcodeVideo method
  }

  handleThumbnailMessage(e) {
    // Handled in generateThumbnails method
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Terminate workers
    this.workers.forEach(worker => worker.terminate());
    this.workers.clear();
    
    // Clear upload queue
    this.uploadQueue = [];
    this.activeUploads.clear();
  }
}

/**
 * Export factory function
 */
export function createVideoUploadEnhancer(options = {}) {
  return new VideoUploadEnhancer(options);
}

/**
 * Export configuration
 */
export { VIDEO_UPLOAD_CONFIG };