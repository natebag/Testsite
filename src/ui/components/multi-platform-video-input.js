/**
 * MLG.clan Multi-Platform Video Input Component - Sub-task 6.8
 * 
 * Enhanced video URL input component with platform detection,
 * preview generation, and metadata extraction for the Content Hub.
 * 
 * Integrates with:
 * - MultiPlatformVideoEmbed system
 * - Content submission form
 * - Video upload enhancer
 * - Xbox 360 retro aesthetic
 * 
 * @author Claude Code - Production UI/UX Engineer
 * @version 1.0.0
 */

import { MultiPlatformVideoEmbed } from '../../content/multi-platform-video-embed.js';
import { VideoUploadEnhancer } from '../../content/video-upload-enhancer.js';

/**
 * Multi-Platform Video Input Configuration
 */
const VIDEO_INPUT_CONFIG = {
  // Supported platforms
  PLATFORMS: [
    'youtube', 'twitter', 'tiktok', 'instagram', 
    'twitch', 'vimeo', 'dailymotion'
  ],
  
  // Input modes
  MODES: {
    URL: 'url',
    UPLOAD: 'upload',
    MIXED: 'mixed'
  },
  
  // Validation settings
  URL_VALIDATION: {
    maxLength: 2048,
    timeout: 30000 // 30 seconds for metadata fetching
  },
  
  // Preview settings
  PREVIEW: {
    enabled: true,
    thumbnailSize: { width: 320, height: 180 },
    maxPreviews: 5
  }
};

/**
 * Multi-Platform Video Input Component
 */
export class MultiPlatformVideoInput {
  constructor(options = {}) {
    this.containerId = options.containerId || 'video-input-container';
    this.mode = options.mode || VIDEO_INPUT_CONFIG.MODES.MIXED;
    this.onVideoAdded = options.onVideoAdded || this.defaultVideoAddedHandler;
    this.onVideoRemoved = options.onVideoRemoved || this.defaultVideoRemovedHandler;
    this.onError = options.onError || this.defaultErrorHandler;
    
    // Initialize video systems
    this.videoEmbed = new MultiPlatformVideoEmbed({
      errorHandler: this.onError,
      successHandler: this.handleMetadataSuccess.bind(this)
    });
    
    this.videoUploader = new VideoUploadEnhancer({
      onComplete: this.handleUploadComplete.bind(this),
      onError: this.onError
    });
    
    // Component state
    this.videos = new Map(); // Store added videos with metadata
    this.isProcessing = false;
    this.currentMode = this.mode;
    
    console.log('MultiPlatformVideoInput initialized');
  }

  /**
   * Create the video input interface
   */
  create() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      throw new Error(`Container ${this.containerId} not found`);
    }

    container.innerHTML = this.generateHTML();
    this.setupEventHandlers();
    this.initializeComponents();
    
    return container;
  }

  /**
   * Generate the main HTML structure
   */
  generateHTML() {
    return `
      <div class="multi-platform-video-input">
        <div class="video-input-header">
          <h3 class="input-title">
            <span class="title-icon">🎬</span>
            Video Content
          </h3>
          <div class="input-mode-selector">
            ${this.generateModeSelector()}
          </div>
        </div>

        <div class="video-input-content">
          ${this.generateURLInput()}
          ${this.generateUploadSection()}
          ${this.generateVideoPreview()}
        </div>

        <div class="video-input-footer">
          <div class="input-stats">
            <span class="stat-item">
              <span class="stat-label">Videos:</span>
              <span class="stat-value" id="video-count">0</span>
            </span>
            <span class="stat-item">
              <span class="stat-label">Platforms:</span>
              <span class="stat-value" id="platform-count">0</span>
            </span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate mode selector
   */
  generateModeSelector() {
    if (this.mode !== VIDEO_INPUT_CONFIG.MODES.MIXED) {
      return '';
    }

    return `
      <div class="mode-selector" role="tablist">
        <button class="mode-tab active" 
                data-mode="url" 
                role="tab" 
                aria-selected="true"
                id="url-tab">
          <span class="tab-icon">🌐</span>
          Video URL
        </button>
        <button class="mode-tab" 
                data-mode="upload" 
                role="tab" 
                aria-selected="false"
                id="upload-tab">
          <span class="tab-icon">📤</span>
          Upload Video
        </button>
      </div>
    `;
  }

  /**
   * Generate URL input section
   */
  generateURLInput() {
    const isVisible = this.currentMode === VIDEO_INPUT_CONFIG.MODES.URL || 
                     this.currentMode === VIDEO_INPUT_CONFIG.MODES.MIXED;

    return `
      <div class="url-input-section ${isVisible ? 'active' : 'hidden'}" 
           role="tabpanel" 
           aria-labelledby="url-tab">
        <div class="url-input-container">
          <div class="input-field">
            <label for="video-url-input" class="field-label">Video URL</label>
            <div class="url-input-wrapper">
              <input type="url" 
                     id="video-url-input" 
                     class="xbox-input url-input" 
                     placeholder="Paste YouTube, TikTok, Twitter, Instagram, Twitch, Vimeo, or Dailymotion URL..."
                     maxlength="${VIDEO_INPUT_CONFIG.URL_VALIDATION.maxLength}"
                     aria-describedby="url-help url-error">
              <button type="button" 
                      class="add-url-btn" 
                      id="add-url-btn"
                      aria-label="Add video URL">
                <span class="btn-icon">➕</span>
                Add
              </button>
            </div>
            <div class="field-help" id="url-help">
              Supports: ${VIDEO_INPUT_CONFIG.PLATFORMS.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}
            </div>
            <div class="error-message" id="url-error" role="alert" aria-hidden="true"></div>
          </div>

          <div class="platform-detection" id="platform-detection" style="display: none;">
            <div class="detection-content">
              <div class="detected-platform">
                <span class="platform-icon" id="detected-icon">🎬</span>
                <span class="platform-name" id="detected-name">Detecting...</span>
              </div>
              <div class="detection-status" id="detection-status">
                Analyzing video...
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate upload section
   */
  generateUploadSection() {
    const isVisible = this.currentMode === VIDEO_INPUT_CONFIG.MODES.UPLOAD || 
                     this.currentMode === VIDEO_INPUT_CONFIG.MODES.MIXED;

    return `
      <div class="upload-section ${isVisible ? 'active' : 'hidden'}" 
           role="tabpanel" 
           aria-labelledby="upload-tab">
        <div id="enhanced-upload-container">
          <!-- Enhanced video upload interface will be injected here -->
        </div>
      </div>
    `;
  }

  /**
   * Generate video preview section
   */
  generateVideoPreview() {
    return `
      <div class="video-preview-section" id="video-preview-section" style="display: none;">
        <div class="preview-header">
          <h4 class="preview-title">Added Videos</h4>
          <button type="button" class="clear-all-btn" id="clear-all-btn">
            <span class="btn-icon">🗑️</span>
            Clear All
          </button>
        </div>
        <div class="video-preview-grid" id="video-preview-grid">
          <!-- Video previews will be added here -->
        </div>
      </div>
    `;
  }

  /**
   * Set up event handlers
   */
  setupEventHandlers() {
    const container = document.getElementById(this.containerId);
    
    // Mode selector
    const modeTabs = container.querySelectorAll('.mode-tab');
    modeTabs.forEach(tab => {
      tab.addEventListener('click', (e) => this.handleModeChange(e));
    });

    // URL input
    const urlInput = container.querySelector('#video-url-input');
    const addUrlBtn = container.querySelector('#add-url-btn');
    
    if (urlInput) {
      urlInput.addEventListener('input', (e) => this.handleURLInput(e));
      urlInput.addEventListener('paste', (e) => this.handleURLPaste(e));
      urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.addVideoFromURL();
        }
      });
    }

    if (addUrlBtn) {
      addUrlBtn.addEventListener('click', () => this.addVideoFromURL());
    }

    // Clear all button
    const clearAllBtn = container.querySelector('#clear-all-btn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => this.clearAllVideos());
    }
  }

  /**
   * Initialize sub-components
   */
  initializeComponents() {
    // Initialize video uploader if upload mode is enabled
    if (this.currentMode === VIDEO_INPUT_CONFIG.MODES.UPLOAD || 
        this.currentMode === VIDEO_INPUT_CONFIG.MODES.MIXED) {
      
      const uploadContainer = document.querySelector('#enhanced-upload-container');
      if (uploadContainer) {
        this.videoUploader.createDropZone('enhanced-upload-container');
      }
    }
  }

  /**
   * Handle mode change (URL vs Upload)
   */
  handleModeChange(event) {
    const newMode = event.target.dataset.mode;
    const container = document.getElementById(this.containerId);
    
    // Update tab states
    container.querySelectorAll('.mode-tab').forEach(tab => {
      tab.classList.remove('active');
      tab.setAttribute('aria-selected', 'false');
    });
    
    event.target.classList.add('active');
    event.target.setAttribute('aria-selected', 'true');
    
    // Update sections
    container.querySelectorAll('.url-input-section, .upload-section').forEach(section => {
      section.classList.remove('active');
      section.classList.add('hidden');
    });
    
    const activeSection = container.querySelector(
      newMode === 'url' ? '.url-input-section' : '.upload-section'
    );
    
    if (activeSection) {
      activeSection.classList.remove('hidden');
      activeSection.classList.add('active');
    }
    
    this.currentMode = newMode;
  }

  /**
   * Handle URL input changes
   */
  async handleURLInput(event) {
    const url = event.target.value.trim();
    const detectionDiv = document.getElementById('platform-detection');
    
    if (!url) {
      detectionDiv.style.display = 'none';
      this.clearURLError();
      return;
    }
    
    // Show detection UI
    detectionDiv.style.display = 'block';
    this.updateDetectionStatus('Analyzing URL...', '🔍');
    
    try {
      // Detect platform
      const detection = this.videoEmbed.detectPlatform(url);
      
      if (detection) {
        this.updateDetectionStatus(
          `${detection.config.name} video detected`,
          detection.config.icon
        );
        
        // Enable add button
        const addBtn = document.getElementById('add-url-btn');
        addBtn.disabled = false;
        addBtn.classList.add('ready');
        
      }
    } catch (error) {
      this.updateDetectionStatus('URL not supported', '❌');
      this.showURLError(error.message);
      
      // Disable add button
      const addBtn = document.getElementById('add-url-btn');
      addBtn.disabled = true;
      addBtn.classList.remove('ready');
    }
  }

  /**
   * Handle URL paste event
   */
  handleURLPaste(event) {
    // Small delay to allow paste to complete
    setTimeout(() => {
      this.handleURLInput(event);
    }, 10);
  }

  /**
   * Add video from URL
   */
  async addVideoFromURL() {
    const urlInput = document.getElementById('video-url-input');
    const url = urlInput.value.trim();
    
    if (!url) {
      this.showURLError('Please enter a video URL');
      return;
    }

    this.setProcessingState(true);
    
    try {
      // Detect and validate platform
      const detection = this.videoEmbed.detectPlatform(url);
      
      // Check for duplicates
      if (this.videos.has(url)) {
        throw new Error('This video has already been added');
      }

      // Fetch metadata
      this.updateDetectionStatus('Fetching video information...', '⏳');
      const metadata = await this.videoEmbed.fetchVideoMetadata(detection.platform, detection.id);
      
      // Create video card
      const videoCard = await this.videoEmbed.createVideoCard(url, {
        autoplay: false,
        muted: true
      });

      // Store video data
      const videoData = {
        url,
        platform: detection.platform,
        id: detection.id,
        metadata,
        element: videoCard,
        type: 'url'
      };

      this.videos.set(url, videoData);
      this.addVideoToPreview(videoData);
      this.updateStats();
      
      // Clear input
      urlInput.value = '';
      document.getElementById('platform-detection').style.display = 'none';
      
      // Reset add button
      const addBtn = document.getElementById('add-url-btn');
      addBtn.disabled = false;
      addBtn.classList.remove('ready');
      
      // Notify parent component
      this.onVideoAdded(videoData);

    } catch (error) {
      console.error('Error adding video from URL:', error);
      this.showURLError(error.message);
      
    } finally {
      this.setProcessingState(false);
    }
  }

  /**
   * Add video to preview section
   */
  addVideoToPreview(videoData) {
    const previewSection = document.getElementById('video-preview-section');
    const previewGrid = document.getElementById('video-preview-grid');
    
    // Show preview section
    previewSection.style.display = 'block';
    
    // Create preview item wrapper
    const previewItem = document.createElement('div');
    previewItem.className = 'video-preview-item';
    previewItem.setAttribute('data-video-key', videoData.url || videoData.file?.name);
    
    // Add remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-video-btn';
    removeBtn.innerHTML = '<span class="btn-icon">✕</span>';
    removeBtn.setAttribute('aria-label', 'Remove video');
    removeBtn.addEventListener('click', () => {
      this.removeVideo(videoData.url || videoData.file?.name);
    });
    
    // Add video card
    previewItem.appendChild(videoData.element);
    previewItem.appendChild(removeBtn);
    
    previewGrid.appendChild(previewItem);
  }

  /**
   * Remove video from preview and storage
   */
  removeVideo(key) {
    const videoData = this.videos.get(key);
    if (!videoData) return;
    
    // Remove from storage
    this.videos.delete(key);
    
    // Remove from UI
    const previewItem = document.querySelector(`[data-video-key="${key}"]`);
    if (previewItem) {
      previewItem.remove();
    }
    
    // Hide preview section if empty
    if (this.videos.size === 0) {
      document.getElementById('video-preview-section').style.display = 'none';
    }
    
    this.updateStats();
    this.onVideoRemoved(videoData);
  }

  /**
   * Clear all videos
   */
  clearAllVideos() {
    const keys = Array.from(this.videos.keys());
    keys.forEach(key => this.removeVideo(key));
  }

  /**
   * Handle upload completion
   */
  handleUploadComplete(uploadItem) {
    const videoData = {
      file: uploadItem.file,
      results: uploadItem.results,
      metadata: uploadItem.metadata,
      type: 'upload',
      element: this.createUploadVideoCard(uploadItem)
    };

    this.videos.set(uploadItem.file.name, videoData);
    this.addVideoToPreview(videoData);
    this.updateStats();
    this.onVideoAdded(videoData);
  }

  /**
   * Create video card for uploaded file
   */
  createUploadVideoCard(uploadItem) {
    const card = document.createElement('div');
    card.className = 'video-card upload-card';
    
    const thumbnails = uploadItem.results?.thumbnails || [];
    const thumbnail = thumbnails[0]; // Use first thumbnail
    
    card.innerHTML = `
      <div class="video-card-header">
        <div class="platform-badge">
          <span class="platform-icon">📤</span>
          <span class="platform-name">UPLOADED</span>
        </div>
        ${uploadItem.metadata?.duration ? 
          `<div class="duration-badge">${this.formatDuration(uploadItem.metadata.duration)}</div>` : ''}
      </div>
      
      <div class="video-thumbnail-container">
        ${thumbnail ? 
          `<img src="${URL.createObjectURL(thumbnail)}" alt="${uploadItem.file.name}" class="video-thumbnail">` :
          `<div class="video-placeholder">🎬</div>`
        }
        <div class="play-overlay">
          <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      </div>
      
      <div class="video-metadata">
        <h3 class="video-title">${uploadItem.file.name}</h3>
        <p class="video-description">Uploaded video file • ${this.formatFileSize(uploadItem.file.size)}</p>
        
        <div class="video-stats">
          ${uploadItem.metadata?.width && uploadItem.metadata?.height ?
            `<span class="stat resolution">${uploadItem.metadata.width}×${uploadItem.metadata.height}</span>` : ''
          }
          <span class="stat size">${this.formatFileSize(uploadItem.file.size)}</span>
        </div>
      </div>
    `;

    return card;
  }

  /**
   * Update platform detection status
   */
  updateDetectionStatus(message, icon = '🔍') {
    const statusElement = document.getElementById('detection-status');
    const iconElement = document.getElementById('detected-icon');
    
    if (statusElement) statusElement.textContent = message;
    if (iconElement) iconElement.textContent = icon;
  }

  /**
   * Update statistics display
   */
  updateStats() {
    const videoCount = this.videos.size;
    const platforms = new Set();
    
    this.videos.forEach(video => {
      if (video.platform) {
        platforms.add(video.platform);
      } else {
        platforms.add('upload');
      }
    });

    const videoCountEl = document.getElementById('video-count');
    const platformCountEl = document.getElementById('platform-count');
    
    if (videoCountEl) videoCountEl.textContent = videoCount;
    if (platformCountEl) platformCountEl.textContent = platforms.size;
  }

  /**
   * Show URL error
   */
  showURLError(message) {
    const errorEl = document.getElementById('url-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.setAttribute('aria-hidden', 'false');
      errorEl.style.display = 'block';
    }
  }

  /**
   * Clear URL error
   */
  clearURLError() {
    const errorEl = document.getElementById('url-error');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.setAttribute('aria-hidden', 'true');
      errorEl.style.display = 'none';
    }
  }

  /**
   * Set processing state
   */
  setProcessingState(processing) {
    this.isProcessing = processing;
    const addBtn = document.getElementById('add-url-btn');
    
    if (addBtn) {
      addBtn.disabled = processing;
      addBtn.innerHTML = processing ? 
        '<span class="spinner"></span>Processing...' : 
        '<span class="btn-icon">➕</span>Add';
    }
  }

  /**
   * Handle metadata fetch success
   */
  handleMetadataSuccess(data, platform, videoId) {
    console.log(`Metadata fetched for ${platform}/${videoId}:`, data);
  }

  /**
   * Get all added videos
   */
  getVideos() {
    return Array.from(this.videos.values());
  }

  /**
   * Clear all videos and reset state
   */
  reset() {
    this.clearAllVideos();
    
    // Reset form inputs
    const urlInput = document.getElementById('video-url-input');
    if (urlInput) {
      urlInput.value = '';
    }
    
    // Hide detection
    const detectionDiv = document.getElementById('platform-detection');
    if (detectionDiv) {
      detectionDiv.style.display = 'none';
    }
    
    this.clearURLError();
  }

  /**
   * Utility functions
   */
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  formatFileSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Default event handlers
   */
  defaultVideoAddedHandler(videoData) {
    console.log('Video added:', videoData);
  }

  defaultVideoRemovedHandler(videoData) {
    console.log('Video removed:', videoData);
  }

  defaultErrorHandler(error) {
    console.error('Video input error:', error);
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.videoEmbed?.destroy();
    this.videoUploader?.destroy();
    this.videos.clear();
  }
}

/**
 * Export factory function
 */
export function createMultiPlatformVideoInput(options = {}) {
  return new MultiPlatformVideoInput(options);
}

/**
 * Export configuration
 */
export { VIDEO_INPUT_CONFIG };