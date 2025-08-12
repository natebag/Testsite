/**
 * MLG.clan Content Submission Form - Sub-task 4.1
 * 
 * Production-ready content submission form implementing comprehensive wireframe specifications
 * with Xbox 360 retro aesthetic. Provides full content upload workflow with drag-and-drop,
 * real-time validation, and seamless integration with MLG.clan platform.
 * 
 * Features:
 * - ContentSubmissionForm: Complete form with metadata fields
 * - Drag-and-drop file upload with progress tracking
 * - Real-time form validation with Xbox-themed error states
 * - Content preview functionality for submitted files
 * - Mobile-responsive design with touch-friendly interactions
 * - Full accessibility with ARIA labels and keyboard navigation
 * - Integration with existing MLG.clan voting system components
 * - Comprehensive testing suite and Storybook documentation
 * 
 * @author Claude Code - Production Frontend Engineer
 * @version 1.0.0
 */

import { MLGTokenManager } from '../../features/tokens/spl-mlg-token.js';
import { Connection, PublicKey } from '@solana/web3.js';

/**
 * Content Submission Configuration
 */
const CONTENT_SUBMISSION_CONFIG = {
  // MLG Token contract address
  MLG_TOKEN_ADDRESS: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL',
  
  // File upload limits
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_FILES_PER_UPLOAD: 5,
  ALLOWED_FILE_TYPES: {
    'video': ['mp4', 'mov', 'avi', 'wmv', 'webm'],
    'image': ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    'audio': ['mp3', 'wav', 'ogg', 'm4a']
  },
  
  // Daily limits
  DAILY_UPLOAD_LIMIT: 3,
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_TAGS: 10,
  
  // Content categories
  CONTENT_CATEGORIES: {
    'highlights': { label: 'Highlights', icon: '⚡' },
    'gameplay': { label: 'Full Gameplay', icon: '🎮' },
    'tutorials': { label: 'Tutorials', icon: '📚' },
    'funny': { label: 'Funny Moments', icon: '😂' },
    'competitive': { label: 'Competitive', icon: '🏆' },
    'speedrun': { label: 'Speedrun', icon: '⚡' }
  },
  
  // Platform options
  PLATFORMS: {
    'xbox': { label: 'Xbox', icon: '🎮' },
    'playstation': { label: 'PlayStation', icon: '🎮' },
    'pc': { label: 'PC', icon: '💻' },
    'mobile': { label: 'Mobile', icon: '📱' },
    'nintendo': { label: 'Nintendo', icon: '🕹️' }
  },
  
  // Animation timings
  BLADE_TRANSITION_DURATION: 300,
  UPLOAD_PROGRESS_ANIMATION: 600,
  FORM_VALIDATION_PULSE: 1000,
  PREVIEW_FADE_DURATION: 400,
  
  // UI constants
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
  MIN_TOUCH_TARGET: 44,
  FOCUS_OUTLINE_WIDTH: 3
};

/**
 * Content types with specific configurations
 */
const CONTENT_TYPES = {
  'clips': {
    label: 'Gaming Clips',
    icon: '🎮',
    acceptedTypes: ['video'],
    maxDuration: 300, // 5 minutes
    description: 'Short gameplay videos and highlights'
  },
  'screenshots': {
    label: 'Screenshots',
    icon: '📸',
    acceptedTypes: ['image'],
    description: 'Game screenshots and memorable moments'
  },
  'guides': {
    label: 'Strategy Guides',
    icon: '📖',
    acceptedTypes: ['video', 'image'],
    description: 'Tutorial content and strategy guides'
  },
  'reviews': {
    label: 'Game Reviews',
    icon: '⭐',
    acceptedTypes: ['video', 'image', 'audio'],
    description: 'Game reviews and analysis content'
  }
};

/**
 * Form validation rules
 */
const VALIDATION_RULES = {
  title: {
    required: true,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-_!?.'"()[\]]+$/,
    errorMessage: 'Title must contain only letters, numbers, and basic punctuation'
  },
  description: {
    required: false,
    maxLength: 500,
    pattern: /^[\s\S]*$/,
    errorMessage: 'Description exceeds maximum length'
  },
  game: {
    required: true,
    minLength: 2,
    errorMessage: 'Please select a valid game'
  },
  tags: {
    maxCount: 10,
    pattern: /^[a-zA-Z0-9\-_]+$/,
    errorMessage: 'Tags can only contain letters, numbers, hyphens, and underscores'
  },
  file: {
    required: true,
    maxSize: CONTENT_SUBMISSION_CONFIG.MAX_FILE_SIZE,
    errorMessage: 'Please upload a valid file'
  }
};

/**
 * Main Content Submission Form System
 * Manages form state, validation, file uploads, and user interactions
 */
export class ContentSubmissionFormSystem {
  constructor(options = {}) {
    this.wallet = options.wallet || null;
    this.tokenManager = new MLGTokenManager();
    this.connection = options.connection || null;
    
    // Form state
    this.formState = {
      contentType: 'clips',
      files: [],
      metadata: {
        title: '',
        description: '',
        game: '',
        gameId: null,
        platform: 'xbox',
        category: '',
        tags: [],
        visibility: 'public',
        allowComments: true,
        allowDownloads: false
      },
      validation: {
        errors: {},
        isValid: false,
        touched: {}
      },
      upload: {
        progress: 0,
        status: 'idle', // idle, uploading, processing, completed, error
        currentFile: null
      }
    };
    
    // Component registry
    this.formElements = new Map();
    this.dropzones = new Map();
    this.previewElements = new Map();
    
    // Event callbacks
    this.onSubmit = options.onSubmit || null;
    this.onDraft = options.onDraft || null;
    this.onError = options.onError || null;
    this.onProgress = options.onProgress || null;
    
    // User limits tracking
    this.dailyLimits = {
      uploads: 0,
      totalUploads: 3
    };
    
    // Initialize CSS and load user data
    this.initializeCSS();
  }

  /**
   * Initialize the content submission form system
   */
  async initialize(wallet, connection) {
    try {
      this.wallet = wallet;
      this.connection = connection;
      
      // Load user submission limits
      await this.loadUserLimits();
      
      // Setup game search API
      this.initializeGameSearch();
      
      console.log('Content Submission Form System initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize content submission form:', error);
      throw error;
    }
  }

  /**
   * Create the main content submission form interface
   */
  createContentSubmissionForm(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with ID '${containerId}' not found`);
    }

    const formHTML = this.generateFormHTML();
    container.innerHTML = formHTML;
    
    // Initialize form components
    this.initializeFormElements(container);
    this.initializeEventListeners(container);
    this.initializeFileUpload(container);
    this.initializeValidation();
    
    // Register component for cleanup
    this.formElements.set(containerId, container);
    
    return {
      element: container,
      validate: () => this.validateForm(),
      submit: () => this.submitForm(),
      reset: () => this.resetForm(),
      setContentType: (type) => this.setContentType(type),
      addFile: (file) => this.addFile(file),
      removeFile: (index) => this.removeFile(index)
    };
  }

  /**
   * Generate the complete form HTML structure
   */
  generateFormHTML() {
    return `
      <div class="content-submission-container">
        ${this.generateHeaderHTML()}
        ${this.generateContentTypeSelectorHTML()}
        
        <form class="submission-form" id="submission-form">
          ${this.generateFileUploadHTML()}
          
          <div class="form-grid">
            <div class="form-column-main">
              ${this.generatePrimaryInfoHTML()}
              ${this.generateGameSelectionHTML()}
              ${this.generateCategoryTagsHTML()}
            </div>
            
            <div class="form-column-side">
              ${this.generatePrivacySettingsHTML()}
              ${this.generatePreviewHTML()}
            </div>
          </div>
          
          ${this.generateSubmissionActionsHTML()}
        </form>
      </div>
    `;
  }

  /**
   * Generate header section
   */
  generateHeaderHTML() {
    return `
      <header class="submission-header">
        <h1 class="submission-title xbox-green">📤 Submit Content</h1>
        <p class="submission-subtitle">Share your epic gaming moments with the MLG.clan community</p>
        <div class="upload-limits-indicator">
          <span class="limits-text">
            <span id="uploads-remaining" class="xbox-green">${this.dailyLimits.totalUploads - this.dailyLimits.uploads}/${this.dailyLimits.totalUploads}</span>
            uploads remaining today
          </span>
        </div>
      </header>
    `;
  }

  /**
   * Generate content type selector (Xbox blade style)
   */
  generateContentTypeSelectorHTML() {
    const contentTypes = Object.entries(CONTENT_TYPES);
    
    return `
      <section class="content-type-selector" role="tablist" aria-label="Content type selection">
        <div class="blade-container">
          ${contentTypes.map(([key, type], index) => `
            <div class="blade-item ${index === 0 ? 'active' : ''}" 
                 role="tab" 
                 tabindex="${index === 0 ? '0' : '-1'}"
                 aria-selected="${index === 0 ? 'true' : 'false'}"
                 aria-controls="${key}-form"
                 data-content-type="${key}"
                 id="blade-${key}">
              <div class="blade-icon" aria-hidden="true">${type.icon}</div>
              <div class="blade-label">${type.label}</div>
              <div class="blade-description">${type.description}</div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }

  /**
   * Generate file upload zone
   */
  generateFileUploadHTML() {
    return `
      <section class="upload-section tile" role="group" aria-labelledby="upload-heading">
        <h3 id="upload-heading" class="section-title xbox-green">📁 Upload Files</h3>
        
        <div class="upload-dropzone" 
             id="file-dropzone"
             role="button" 
             tabindex="0"
             aria-label="Upload file area. Press enter or space to browse files"
             aria-describedby="upload-instructions">
          <div class="upload-icon" aria-hidden="true">📁</div>
          <div class="upload-text">
            <h4>Drop files here or click to browse</h4>
            <p id="upload-instructions">Supported formats: MP4, MOV, JPG, PNG, GIF</p>
            <p class="file-size-limit">Max size: 100MB per file</p>
          </div>
          <input type="file" 
                 id="file-input" 
                 multiple 
                 accept="video/*,image/*,audio/*"
                 aria-label="Select files to upload"
                 style="display: none;">
        </div>
        
        <div class="upload-progress" id="upload-progress" role="progressbar" aria-hidden="true">
          <div class="progress-bar">
            <div class="progress-fill" id="progress-fill"></div>
          </div>
          <div class="progress-text" id="progress-text">Uploading... 0%</div>
        </div>
        
        <div class="uploaded-files" id="uploaded-files" aria-live="polite">
          <!-- Uploaded files will appear here -->
        </div>
      </section>
    `;
  }

  /**
   * Generate primary information form section
   */
  generatePrimaryInfoHTML() {
    return `
      <section class="form-section tile" role="group" aria-labelledby="content-details-heading">
        <h3 id="content-details-heading" class="section-title xbox-green">📝 Content Details</h3>
        
        <div class="form-field" data-field="title">
          <label for="content-title" class="field-label">Title *</label>
          <input type="text" 
                 id="content-title" 
                 class="xbox-input" 
                 placeholder="Amazing clutch play in ranked..." 
                 maxlength="${CONTENT_SUBMISSION_CONFIG.MAX_TITLE_LENGTH}" 
                 required
                 aria-describedby="title-counter title-error">
          <div class="char-counter" id="title-counter">0/${CONTENT_SUBMISSION_CONFIG.MAX_TITLE_LENGTH}</div>
          <div class="error-message" id="title-error" role="alert" aria-hidden="true"></div>
        </div>
        
        <div class="form-field" data-field="description">
          <label for="content-description" class="field-label">Description</label>
          <textarea id="content-description" 
                    class="xbox-textarea" 
                    placeholder="Describe your epic gaming moment..." 
                    maxlength="${CONTENT_SUBMISSION_CONFIG.MAX_DESCRIPTION_LENGTH}" 
                    rows="4"
                    aria-describedby="description-counter"></textarea>
          <div class="char-counter" id="description-counter">0/${CONTENT_SUBMISSION_CONFIG.MAX_DESCRIPTION_LENGTH}</div>
        </div>
      </section>
    `;
  }

  /**
   * Generate game selection section
   */
  generateGameSelectionHTML() {
    const platforms = Object.entries(CONTENT_SUBMISSION_CONFIG.PLATFORMS);
    
    return `
      <section class="form-section tile" role="group" aria-labelledby="game-info-heading">
        <h3 id="game-info-heading" class="section-title xbox-green">🎮 Game Information</h3>
        
        <div class="form-field" data-field="game">
          <label for="game-search" class="field-label">Game *</label>
          <div class="game-search-container">
            <input type="text" 
                   id="game-search" 
                   class="xbox-input" 
                   placeholder="Search for a game..." 
                   autocomplete="off" 
                   required
                   aria-describedby="game-error"
                   aria-expanded="false"
                   role="combobox"
                   aria-haspopup="listbox">
            <div class="game-dropdown" 
                 id="game-dropdown" 
                 role="listbox"
                 aria-label="Game search results">
              <!-- Auto-populated game results -->
            </div>
          </div>
          <div class="error-message" id="game-error" role="alert" aria-hidden="true"></div>
        </div>
        
        <div class="form-field">
          <label class="field-label">Platform</label>
          <div class="platform-selector" role="radiogroup" aria-label="Gaming platform">
            ${platforms.map(([key, platform], index) => `
              <div class="platform-option ${index === 0 ? 'selected' : ''}" 
                   data-platform="${key}"
                   role="radio"
                   tabindex="${index === 0 ? '0' : '-1'}"
                   aria-checked="${index === 0 ? 'true' : 'false'}">
                <div class="platform-icon" aria-hidden="true">${platform.icon}</div>
                <span>${platform.label}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }

  /**
   * Generate category and tags section
   */
  generateCategoryTagsHTML() {
    const categories = Object.entries(CONTENT_SUBMISSION_CONFIG.CONTENT_CATEGORIES);
    
    return `
      <section class="form-section tile" role="group" aria-labelledby="category-tags-heading">
        <h3 id="category-tags-heading" class="section-title xbox-green">🏷️ Categories & Tags</h3>
        
        <div class="form-field">
          <label for="content-category" class="field-label">Content Category</label>
          <select id="content-category" class="xbox-select" aria-describedby="category-help">
            <option value="">Select category...</option>
            ${categories.map(([key, category]) => `
              <option value="${key}">${category.icon} ${category.label}</option>
            `).join('')}
          </select>
          <div class="field-help" id="category-help">Choose the category that best describes your content</div>
        </div>
        
        <div class="form-field" data-field="tags">
          <label for="tag-input" class="field-label">Tags</label>
          <div class="tag-input-container">
            <input type="text" 
                   id="tag-input" 
                   class="xbox-input" 
                   placeholder="Add tags (e.g. clutch, headshot)"
                   aria-describedby="tag-instructions tag-counter">
            <div class="tag-list" id="selected-tags" aria-live="polite" aria-label="Selected tags">
              <!-- Dynamic tags appear here -->
            </div>
          </div>
          <div class="field-help" id="tag-instructions">Press Enter or comma to add tags. Maximum ${CONTENT_SUBMISSION_CONFIG.MAX_TAGS} tags.</div>
          <div class="tag-counter" id="tag-counter">0/${CONTENT_SUBMISSION_CONFIG.MAX_TAGS}</div>
          <div class="tag-suggestions" role="group" aria-label="Suggested tags">
            <span class="suggestion-tag" tabindex="0" role="button">clutch</span>
            <span class="suggestion-tag" tabindex="0" role="button">headshot</span>
            <span class="suggestion-tag" tabindex="0" role="button">epic</span>
            <span class="suggestion-tag" tabindex="0" role="button">funny</span>
            <span class="suggestion-tag" tabindex="0" role="button">skilled</span>
            <span class="suggestion-tag" tabindex="0" role="button">competitive</span>
          </div>
        </div>
      </section>
    `;
  }

  /**
   * Generate privacy settings section
   */
  generatePrivacySettingsHTML() {
    return `
      <section class="form-section tile" role="group" aria-labelledby="privacy-settings-heading">
        <h3 id="privacy-settings-heading" class="section-title xbox-green">🔒 Privacy & Settings</h3>
        
        <div class="form-field">
          <fieldset class="radio-group" role="radiogroup" aria-labelledby="visibility-legend">
            <legend id="visibility-legend" class="field-label">Visibility</legend>
            
            <label class="radio-option">
              <input type="radio" name="visibility" value="public" checked>
              <span class="radio-custom"></span>
              <div class="radio-label">
                <strong>Public</strong>
                <small>Everyone can see and vote</small>
              </div>
            </label>
            
            <label class="radio-option">
              <input type="radio" name="visibility" value="clan-only">
              <span class="radio-custom"></span>
              <div class="radio-label">
                <strong>Clan Only</strong>
                <small>Only clan members can see</small>
              </div>
            </label>
            
            <label class="radio-option">
              <input type="radio" name="visibility" value="friends">
              <span class="radio-custom"></span>
              <div class="radio-label">
                <strong>Friends</strong>
                <small>Only friends can see</small>
              </div>
            </label>
          </fieldset>
        </div>
        
        <div class="form-field">
          <label class="checkbox-option">
            <input type="checkbox" id="allow-comments" checked>
            <span class="checkbox-custom"></span>
            Allow comments
          </label>
        </div>
        
        <div class="form-field">
          <label class="checkbox-option">
            <input type="checkbox" id="allow-downloads">
            <span class="checkbox-custom"></span>
            Allow downloads
          </label>
        </div>
      </section>
    `;
  }

  /**
   * Generate preview section
   */
  generatePreviewHTML() {
    return `
      <section class="form-section tile" role="group" aria-labelledby="preview-heading">
        <h3 id="preview-heading" class="section-title xbox-green">👁️ Preview</h3>
        
        <div class="preview-container" id="content-preview" aria-describedby="preview-description">
          <div class="preview-placeholder">
            <div class="preview-icon" aria-hidden="true">👁️</div>
            <p>Upload content to see preview</p>
          </div>
        </div>
        
        <div class="preview-meta" id="preview-metadata">
          <div class="field-help" id="preview-description">Preview shows how your content will appear to other users</div>
        </div>
      </section>
    `;
  }

  /**
   * Generate submission actions
   */
  generateSubmissionActionsHTML() {
    return `
      <section class="submission-section">
        <div class="submission-actions" role="group" aria-label="Submission actions">
          <button type="button" 
                  class="btn-secondary" 
                  id="save-draft-btn"
                  aria-describedby="draft-help">
            💾 Save Draft
          </button>
          <button type="button" 
                  class="btn-secondary" 
                  id="preview-post-btn"
                  aria-describedby="preview-help">
            👁️ Preview Post
          </button>
          <button type="submit" 
                  class="btn-primary xbox-submit" 
                  id="submit-btn"
                  aria-describedby="submit-help">
            🚀 Submit Content
          </button>
        </div>
        
        <div class="submission-info">
          <div class="field-help" id="draft-help">Save your progress without publishing</div>
          <div class="field-help" id="preview-help">See how your post will look</div>
          <div class="field-help" id="submit-help">Publish your content to the community</div>
        </div>
      </section>
    `;
  }

  /**
   * Initialize all form elements and references
   */
  initializeFormElements(container) {
    // Content type blades
    this.blades = container.querySelectorAll('.blade-item');
    
    // Form inputs
    this.titleInput = container.querySelector('#content-title');
    this.descriptionInput = container.querySelector('#content-description');
    this.gameSearchInput = container.querySelector('#game-search');
    this.categorySelect = container.querySelector('#content-category');
    this.tagInput = container.querySelector('#tag-input');
    
    // File upload elements
    this.dropzone = container.querySelector('#file-dropzone');
    this.fileInput = container.querySelector('#file-input');
    this.progressBar = container.querySelector('#upload-progress');
    this.uploadedFiles = container.querySelector('#uploaded-files');
    
    // Platform and privacy elements
    this.platformOptions = container.querySelectorAll('.platform-option');
    this.visibilityRadios = container.querySelectorAll('input[name="visibility"]');
    this.allowCommentsCheckbox = container.querySelector('#allow-comments');
    this.allowDownloadsCheckbox = container.querySelector('#allow-downloads');
    
    // Action buttons
    this.saveDraftBtn = container.querySelector('#save-draft-btn');
    this.previewPostBtn = container.querySelector('#preview-post-btn');
    this.submitBtn = container.querySelector('#submit-btn');
    
    // Preview elements
    this.previewContainer = container.querySelector('#content-preview');
    this.previewMetadata = container.querySelector('#preview-metadata');
  }

  /**
   * Initialize all event listeners
   */
  initializeEventListeners(container) {
    // Content type selection
    this.blades.forEach(blade => {
      blade.addEventListener('click', (e) => this.handleContentTypeSelection(e));
      blade.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleContentTypeSelection(e);
        }
      });
    });

    // Platform selection
    this.platformOptions.forEach(option => {
      option.addEventListener('click', (e) => this.handlePlatformSelection(e));
      option.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handlePlatformSelection(e);
        }
      });
    });

    // Form inputs
    this.titleInput?.addEventListener('input', (e) => this.handleInputChange(e, 'title'));
    this.titleInput?.addEventListener('blur', (e) => this.handleInputBlur(e, 'title'));
    
    this.descriptionInput?.addEventListener('input', (e) => this.handleInputChange(e, 'description'));
    
    this.gameSearchInput?.addEventListener('input', (e) => this.handleGameSearch(e));
    this.gameSearchInput?.addEventListener('focus', (e) => this.handleGameSearchFocus(e));
    this.gameSearchInput?.addEventListener('blur', (e) => this.handleGameSearchBlur(e));
    
    this.categorySelect?.addEventListener('change', (e) => this.handleCategoryChange(e));
    
    this.tagInput?.addEventListener('keydown', (e) => this.handleTagInput(e));
    
    // Privacy settings
    this.visibilityRadios.forEach(radio => {
      radio.addEventListener('change', (e) => this.handleVisibilityChange(e));
    });
    
    this.allowCommentsCheckbox?.addEventListener('change', (e) => this.handleSettingChange(e, 'allowComments'));
    this.allowDownloadsCheckbox?.addEventListener('change', (e) => this.handleSettingChange(e, 'allowDownloads'));

    // Action buttons
    this.saveDraftBtn?.addEventListener('click', (e) => this.handleSaveDraft(e));
    this.previewPostBtn?.addEventListener('click', (e) => this.handlePreviewPost(e));
    this.submitBtn?.addEventListener('click', (e) => this.handleSubmit(e));
    
    // Form submission
    const form = container.querySelector('#submission-form');
    form?.addEventListener('submit', (e) => this.handleFormSubmit(e));

    // Tag suggestions
    const suggestions = container.querySelectorAll('.suggestion-tag');
    suggestions.forEach(suggestion => {
      suggestion.addEventListener('click', (e) => this.handleSuggestionClick(e));
      suggestion.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleSuggestionClick(e);
        }
      });
    });
  }

  /**
   * Initialize file upload functionality
   */
  initializeFileUpload(container) {
    if (!this.dropzone || !this.fileInput) return;

    // Click to upload
    this.dropzone.addEventListener('click', () => {
      this.fileInput.click();
    });

    // Keyboard interaction for dropzone
    this.dropzone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.fileInput.click();
      }
    });

    // Drag and drop
    this.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropzone.classList.add('dragover');
    });

    this.dropzone.addEventListener('dragleave', (e) => {
      if (!this.dropzone.contains(e.relatedTarget)) {
        this.dropzone.classList.remove('dragover');
      }
    });

    this.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropzone.classList.remove('dragover');
      const files = Array.from(e.dataTransfer.files);
      this.handleFiles(files);
    });

    // File input change
    this.fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      this.handleFiles(files);
    });
  }

  /**
   * Initialize form validation
   */
  initializeValidation() {
    this.validationRules = VALIDATION_RULES;
    this.setupRealTimeValidation();
  }

  /**
   * Setup real-time validation for form fields
   */
  setupRealTimeValidation() {
    // Title validation
    if (this.titleInput) {
      const titleCounter = document.getElementById('title-counter');
      this.titleInput.addEventListener('input', () => {
        const length = this.titleInput.value.length;
        const maxLength = CONTENT_SUBMISSION_CONFIG.MAX_TITLE_LENGTH;
        titleCounter.textContent = `${length}/${maxLength}`;
        
        if (length > maxLength * 0.9) {
          titleCounter.style.color = '#ef4444';
        } else {
          titleCounter.style.color = 'var(--text-muted)';
        }
        
        this.validateField('title', this.titleInput.value);
      });
    }

    // Description validation
    if (this.descriptionInput) {
      const descriptionCounter = document.getElementById('description-counter');
      this.descriptionInput.addEventListener('input', () => {
        const length = this.descriptionInput.value.length;
        const maxLength = CONTENT_SUBMISSION_CONFIG.MAX_DESCRIPTION_LENGTH;
        descriptionCounter.textContent = `${length}/${maxLength}`;
        
        if (length > maxLength * 0.9) {
          descriptionCounter.style.color = '#ef4444';
        } else {
          descriptionCounter.style.color = 'var(--text-muted)';
        }
      });
    }
  }

  /**
   * Handle content type selection
   */
  handleContentTypeSelection(event) {
    const selectedBlade = event.currentTarget;
    const contentType = selectedBlade.dataset.contentType;
    
    // Update blade selection
    this.blades.forEach(blade => {
      blade.classList.remove('active');
      blade.setAttribute('aria-selected', 'false');
      blade.setAttribute('tabindex', '-1');
    });
    
    selectedBlade.classList.add('active');
    selectedBlade.setAttribute('aria-selected', 'true');
    selectedBlade.setAttribute('tabindex', '0');
    
    // Update form state
    this.formState.contentType = contentType;
    
    // Update file input accept types
    this.updateFileInputTypes(contentType);
    
    // Update upload instructions
    this.updateUploadInstructions(contentType);
    
    // Validate current files against new content type
    this.validateFilesForContentType();
    
    console.log('Content type selected:', contentType);
  }

  /**
   * Handle platform selection
   */
  handlePlatformSelection(event) {
    const selectedOption = event.currentTarget;
    const platform = selectedOption.dataset.platform;
    
    // Update platform selection
    this.platformOptions.forEach(option => {
      option.classList.remove('selected');
      option.setAttribute('aria-checked', 'false');
      option.setAttribute('tabindex', '-1');
    });
    
    selectedOption.classList.add('selected');
    selectedOption.setAttribute('aria-checked', 'true');
    selectedOption.setAttribute('tabindex', '0');
    
    // Update form state
    this.formState.metadata.platform = platform;
    
    console.log('Platform selected:', platform);
  }

  /**
   * Handle input changes with validation
   */
  handleInputChange(event, fieldName) {
    const value = event.target.value;
    this.formState.metadata[fieldName] = value;
    this.formState.validation.touched[fieldName] = true;
    
    // Real-time validation
    this.validateField(fieldName, value);
    
    // Update preview
    this.updatePreview();
  }

  /**
   * Handle input blur events
   */
  handleInputBlur(event, fieldName) {
    this.formState.validation.touched[fieldName] = true;
    this.validateField(fieldName, event.target.value);
  }

  /**
   * Handle game search input
   */
  async handleGameSearch(event) {
    const query = event.target.value.trim();
    const dropdown = document.getElementById('game-dropdown');
    
    if (query.length < 2) {
      dropdown.classList.remove('show');
      event.target.setAttribute('aria-expanded', 'false');
      return;
    }
    
    try {
      const games = await this.searchGames(query);
      this.displayGameResults(games);
      dropdown.classList.add('show');
      event.target.setAttribute('aria-expanded', 'true');
    } catch (error) {
      console.error('Game search failed:', error);
      dropdown.classList.remove('show');
      event.target.setAttribute('aria-expanded', 'false');
    }
  }

  /**
   * Handle game search focus
   */
  handleGameSearchFocus(event) {
    if (event.target.value.length >= 2) {
      const dropdown = document.getElementById('game-dropdown');
      dropdown.classList.add('show');
      event.target.setAttribute('aria-expanded', 'true');
    }
  }

  /**
   * Handle game search blur
   */
  handleGameSearchBlur(event) {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => {
      const dropdown = document.getElementById('game-dropdown');
      dropdown.classList.remove('show');
      event.target.setAttribute('aria-expanded', 'false');
    }, 200);
  }

  /**
   * Handle category selection
   */
  handleCategoryChange(event) {
    this.formState.metadata.category = event.target.value;
    this.updatePreview();
  }

  /**
   * Handle tag input
   */
  handleTagInput(event) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      
      // Handle both direct target and element by ID for tests
      const tagInput = event.target || document.getElementById('tag-input');
      if (!tagInput) return;
      
      const tag = tagInput.value.trim();
      
      if (tag) {
        if (this.addTag(tag)) {
          tagInput.value = '';
        }
      }
    }
  }

  /**
   * Handle visibility changes
   */
  handleVisibilityChange(event) {
    this.formState.metadata.visibility = event.target.value;
    this.updatePreview();
  }

  /**
   * Handle setting changes
   */
  handleSettingChange(event, settingName) {
    this.formState.metadata[settingName] = event.target.checked;
    this.updatePreview();
  }

  /**
   * Handle suggestion tag clicks
   */
  handleSuggestionClick(event) {
    const tag = event.target.textContent.trim();
    if (this.formState.metadata.tags.length < CONTENT_SUBMISSION_CONFIG.MAX_TAGS) {
      this.addTag(tag);
    }
  }

  /**
   * Handle file uploads
   */
  async handleFiles(files) {
    if (!files || files.length === 0) return;
    
    // Validate files
    const validFiles = [];
    for (const file of files) {
      if (await this.validateFile(file)) {
        validFiles.push(file);
      }
    }
    
    if (validFiles.length === 0) return;
    
    // Check total file count
    const totalFiles = this.formState.files.length + validFiles.length;
    if (totalFiles > CONTENT_SUBMISSION_CONFIG.MAX_FILES_PER_UPLOAD) {
      this.showError('Too many files', `Maximum ${CONTENT_SUBMISSION_CONFIG.MAX_FILES_PER_UPLOAD} files allowed per upload`);
      return;
    }
    
    // Process files
    for (const file of validFiles) {
      await this.addFile(file);
    }
  }

  /**
   * Add a file to the form state
   */
  async addFile(file) {
    const fileData = {
      file,
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      preview: null,
      uploadProgress: 0,
      uploadStatus: 'pending'
    };
    
    // Generate preview for images and videos
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      fileData.preview = await this.generateFilePreview(file);
    }
    
    this.formState.files.push(fileData);
    this.renderUploadedFiles();
    this.updatePreview();
    
    console.log('File added:', fileData);
  }

  /**
   * Remove a file from the form state
   */
  removeFile(fileId) {
    this.formState.files = this.formState.files.filter(f => f.id !== fileId);
    this.renderUploadedFiles();
    this.updatePreview();
    
    console.log('File removed:', fileId);
  }

  /**
   * Add a tag to the form state
   */
  addTag(tag) {
    const sanitizedTag = tag.toLowerCase().trim();
    
    // Check maximum tag limit first
    if (this.formState.metadata.tags.length >= VALIDATION_RULES.tags.maxCount) {
      this.showError('Too many tags', `Maximum ${VALIDATION_RULES.tags.maxCount} tags allowed`);
      return false;
    }
    
    // Validate tag format
    if (!this.validateTag(sanitizedTag)) {
      this.showError('Invalid tag', 'Tags can only contain letters, numbers, hyphens, and underscores');
      return false;
    }
    
    // Check if tag already exists
    if (this.formState.metadata.tags.includes(sanitizedTag)) {
      return false;
    }
    
    // Add tag
    this.formState.metadata.tags.push(sanitizedTag);
    this.renderTags();
    this.updateTagCounter();
    this.updatePreview();
    
    console.log('Tag added:', sanitizedTag);
    return true;
  }

  /**
   * Remove a tag from the form state
   */
  removeTag(tag) {
    this.formState.metadata.tags = this.formState.metadata.tags.filter(t => t !== tag);
    this.renderTags();
    this.updateTagCounter();
    this.updatePreview();
    
    console.log('Tag removed:', tag);
  }

  /**
   * Handle save draft
   */
  async handleSaveDraft(event) {
    event.preventDefault();
    
    try {
      const draftData = this.prepareDraftData();
      await this.saveDraft(draftData);
      this.showSuccess('Draft saved successfully! 💾');
    } catch (error) {
      console.error('Failed to save draft:', error);
      this.showError('Failed to save draft', error.message);
    }
  }

  /**
   * Handle preview post
   */
  handlePreviewPost(event) {
    event.preventDefault();
    
    const previewData = this.preparePreviewData();
    this.showPreviewModal(previewData);
  }

  /**
   * Handle form submission
   */
  async handleSubmit(event) {
    event.preventDefault();
    await this.submitForm();
  }

  /**
   * Handle form submit
   */
  async handleFormSubmit(event) {
    event.preventDefault();
    await this.submitForm();
  }

  /**
   * Submit the form
   */
  async submitForm() {
    try {
      // Validate form
      if (!this.validateForm()) {
        this.showValidationErrors();
        return false;
      }
      
      // Check daily limits
      if (!this.checkDailyLimits()) {
        this.showError('Daily limit reached', 'You have reached your daily upload limit. Try again tomorrow!');
        return false;
      }
      
      // Prepare submission data
      const submissionData = this.prepareSubmissionData();
      
      // Update UI state
      this.updateSubmissionState('uploading');
      
      // Upload files
      const uploadedFiles = await this.uploadFiles();
      
      // Submit content
      const result = await this.submitContent({
        ...submissionData,
        files: uploadedFiles
      });
      
      // Handle success
      this.updateSubmissionState('completed');
      this.showSuccess('Content submitted successfully! 🎉');
      
      // Reset form
      setTimeout(() => this.resetForm(), 2000);
      
      // Call success callback
      if (this.onSubmit) {
        this.onSubmit(result);
      }
      
      return true;
      
    } catch (error) {
      console.error('Form submission failed:', error);
      this.updateSubmissionState('error');
      this.showError('Submission failed', error.message);
      
      // Call error callback
      if (this.onError) {
        this.onError(error);
      }
      
      return false;
    }
  }

  /**
   * Validate the entire form
   */
  validateForm() {
    let isValid = true;
    const errors = {};
    
    // Validate required fields
    if (!this.formState.metadata.title || !this.formState.metadata.title.trim()) {
      errors.title = 'Title is required';
      isValid = false;
    }
    
    if (!this.formState.metadata.game || !this.formState.metadata.game.trim()) {
      errors.game = 'Game selection is required';
      isValid = false;
    }
    
    if (!this.formState.files || this.formState.files.length === 0) {
      errors.file = 'At least one file is required';
      isValid = false;
    }
    
    // Validate field formats only if field has a value or is required
    for (const [field, rule] of Object.entries(this.validationRules)) {
      // Skip file validation here - it's handled separately above
      if (field === 'file') continue;
      
      const value = this.formState.metadata[field] || '';
      
      // Skip validation for optional empty fields
      if (!rule.required && (!value || typeof value !== 'string' || !value.trim())) {
        continue;
      }
      
      if (!this.validateFieldValue(field, value, rule)) {
        errors[field] = rule.errorMessage;
        isValid = false;
      }
    }
    
    // Validate tags separately
    if (this.formState.metadata.tags && this.formState.metadata.tags.length > VALIDATION_RULES.tags.maxCount) {
      errors.tags = `Maximum ${VALIDATION_RULES.tags.maxCount} tags allowed`;
      isValid = false;
    }
    
    this.formState.validation.errors = errors;
    this.formState.validation.isValid = isValid;
    
    return isValid;
  }

  /**
   * Validate a single field
   */
  validateField(fieldName, value) {
    if (!this.validationRules || !this.validationRules[fieldName]) return true;
    
    const rule = this.validationRules[fieldName];
    if (!rule) return true;
    
    const isValid = this.validateFieldValue(fieldName, value, rule);
    const errorElement = document.getElementById(`${fieldName}-error`);
    const fieldElement = document.querySelector(`[data-field="${fieldName}"]`);
    
    if (isValid) {
      this.formState.validation.errors[fieldName] = null;
      if (errorElement) {
        errorElement.style.display = 'none';
        errorElement.setAttribute('aria-hidden', 'true');
      }
      if (fieldElement) {
        fieldElement.classList.remove('error');
        fieldElement.classList.add('success');
      }
    } else {
      this.formState.validation.errors[fieldName] = rule.errorMessage;
      if (errorElement) {
        errorElement.textContent = rule.errorMessage;
        errorElement.style.display = 'block';
        errorElement.setAttribute('aria-hidden', 'false');
      }
      if (fieldElement) {
        fieldElement.classList.add('error');
        fieldElement.classList.remove('success');
      }
    }
    
    return isValid;
  }

  /**
   * Validate a field value against rules
   */
  validateFieldValue(fieldName, value, rule) {
    // Ensure value is a string
    const stringValue = value ? String(value) : '';
    
    // Required check
    if (rule.required && !stringValue.trim()) {
      return false;
    }
    
    // Length checks
    if (rule.maxLength && stringValue.length > rule.maxLength) {
      return false;
    }
    
    if (rule.minLength && stringValue.length < rule.minLength) {
      return false;
    }
    
    // Pattern check
    if (rule.pattern && stringValue && !rule.pattern.test(stringValue)) {
      return false;
    }
    
    return true;
  }

  /**
   * Validate a file
   */
  async validateFile(file) {
    // Size check
    if (file.size > CONTENT_SUBMISSION_CONFIG.MAX_FILE_SIZE) {
      this.showError('File too large', `${file.name} exceeds the 100MB size limit`);
      return false;
    }
    
    // Type check
    const contentType = CONTENT_TYPES[this.formState.contentType];
    const fileType = this.getFileTypeCategory(file.type);
    
    if (!contentType.acceptedTypes.includes(fileType)) {
      this.showError('Invalid file type', `${file.name} is not supported for ${contentType.label}`);
      return false;
    }
    
    // Additional validations for specific types
    if (fileType === 'video' && contentType.maxDuration) {
      // Would need to check video duration here
      // This would require loading the video metadata
    }
    
    return true;
  }

  /**
   * Validate a tag
   */
  validateTag(tag) {
    if (!this.validationRules || !this.validationRules.tags) {
      // Fallback validation if no rules available
      return tag && tag.length > 0 && tag.length <= 20 && /^[a-zA-Z0-9\-_]+$/.test(tag);
    }
    
    const rule = this.validationRules.tags;
    
    if (tag.length === 0 || tag.length > 20) {
      return false;
    }
    
    if (rule.pattern && !rule.pattern.test(tag)) {
      return false;
    }
    
    return true;
  }

  /**
   * Get file type category from MIME type
   */
  getFileTypeCategory(mimeType) {
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'unknown';
  }

  /**
   * Update file input accepted types based on content type
   */
  updateFileInputTypes(contentType) {
    if (!this.fileInput) return;
    
    const contentConfig = CONTENT_TYPES[contentType];
    const acceptedTypes = contentConfig.acceptedTypes;
    
    let acceptString = '';
    if (acceptedTypes.includes('video')) acceptString += 'video/*,';
    if (acceptedTypes.includes('image')) acceptString += 'image/*,';
    if (acceptedTypes.includes('audio')) acceptString += 'audio/*,';
    
    this.fileInput.setAttribute('accept', acceptString.slice(0, -1));
  }

  /**
   * Update upload instructions based on content type
   */
  updateUploadInstructions(contentType) {
    const instructions = document.getElementById('upload-instructions');
    if (!instructions) return;
    
    const contentConfig = CONTENT_TYPES[contentType];
    const types = contentConfig.acceptedTypes;
    
    let formatText = 'Supported formats: ';
    if (types.includes('video')) formatText += 'MP4, MOV, ';
    if (types.includes('image')) formatText += 'JPG, PNG, GIF, ';
    if (types.includes('audio')) formatText += 'MP3, WAV, ';
    
    instructions.textContent = formatText.slice(0, -2);
  }

  /**
   * Validate current files against new content type
   */
  validateFilesForContentType() {
    const contentConfig = CONTENT_TYPES[this.formState.contentType];
    const validFiles = [];
    
    for (const fileData of this.formState.files) {
      const fileType = this.getFileTypeCategory(fileData.type);
      if (contentConfig.acceptedTypes.includes(fileType)) {
        validFiles.push(fileData);
      }
    }
    
    this.formState.files = validFiles;
    this.renderUploadedFiles();
  }

  /**
   * Render uploaded files list
   */
  renderUploadedFiles() {
    if (!this.uploadedFiles) return;
    
    if (this.formState.files.length === 0) {
      this.uploadedFiles.innerHTML = '';
      return;
    }
    
    const filesHTML = this.formState.files.map(file => `
      <div class="uploaded-file" data-file-id="${file.id}">
        <div class="file-preview">
          ${file.preview ? `<img src="${file.preview}" alt="File preview" class="file-preview-image">` : ''}
          <div class="file-icon">${this.getFileIcon(file.type)}</div>
        </div>
        <div class="file-info">
          <div class="file-name">${file.name}</div>
          <div class="file-size">${this.formatFileSize(file.size)}</div>
          <div class="file-progress" style="display: ${file.uploadProgress > 0 ? 'block' : 'none'}">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${file.uploadProgress}%"></div>
            </div>
            <span class="progress-text">${file.uploadProgress}%</span>
          </div>
        </div>
        <button type="button" 
                class="file-remove" 
                onclick="contentSubmissionForm.removeFile('${file.id}')"
                aria-label="Remove ${file.name}">
          ×
        </button>
      </div>
    `).join('');
    
    this.uploadedFiles.innerHTML = filesHTML;
  }

  /**
   * Render tags list
   */
  renderTags() {
    const tagsContainer = document.getElementById('selected-tags');
    if (!tagsContainer) return;
    
    if (this.formState.metadata.tags.length === 0) {
      tagsContainer.innerHTML = '';
      return;
    }
    
    const tagsHTML = this.formState.metadata.tags.map(tag => `
      <div class="tag-item">
        ${tag}
        <span class="tag-remove" 
              onclick="contentSubmissionForm.removeTag('${tag}')"
              aria-label="Remove tag ${tag}"
              role="button"
              tabindex="0">×</span>
      </div>
    `).join('');
    
    tagsContainer.innerHTML = tagsHTML;
  }

  /**
   * Update tag counter
   */
  updateTagCounter() {
    const counter = document.getElementById('tag-counter');
    if (!counter) return;
    
    const count = this.formState.metadata.tags.length;
    const max = CONTENT_SUBMISSION_CONFIG.MAX_TAGS;
    
    counter.textContent = `${count}/${max}`;
    
    if (count >= max * 0.9) {
      counter.style.color = '#ef4444';
    } else {
      counter.style.color = 'var(--text-muted)';
    }
  }

  /**
   * Update preview section
   */
  updatePreview() {
    if (!this.previewContainer) return;
    
    if (this.formState.files.length === 0) {
      this.previewContainer.innerHTML = `
        <div class="preview-placeholder">
          <div class="preview-icon">👁️</div>
          <p>Upload content to see preview</p>
        </div>
      `;
      return;
    }
    
    const primaryFile = this.formState.files[0];
    let previewHTML = '';
    
    if (primaryFile.preview) {
      if (primaryFile.type.startsWith('image/')) {
        previewHTML = `<img src="${primaryFile.preview}" alt="Content preview" class="preview-image">`;
      } else if (primaryFile.type.startsWith('video/')) {
        previewHTML = `<video src="${primaryFile.preview}" controls class="preview-video"></video>`;
      }
    } else {
      previewHTML = `
        <div class="preview-placeholder">
          <div class="preview-icon">${this.getFileIcon(primaryFile.type)}</div>
          <p>${primaryFile.name}</p>
        </div>
      `;
    }
    
    this.previewContainer.innerHTML = previewHTML;
    
    // Update metadata preview
    const previewMetadataElement = this.previewMetadata || document.getElementById('preview-metadata');
    if (previewMetadataElement) {
      const metadata = this.formState.metadata;
      previewMetadataElement.innerHTML = `
        <div class="preview-meta-item">
          <strong>Title:</strong> ${metadata.title || 'Untitled'}
        </div>
        ${metadata.description ? `
          <div class="preview-meta-item">
            <strong>Description:</strong> ${metadata.description}
          </div>
        ` : ''}
        ${metadata.game ? `
          <div class="preview-meta-item">
            <strong>Game:</strong> ${metadata.game}
          </div>
        ` : ''}
        ${metadata.tags.length > 0 ? `
          <div class="preview-meta-item">
            <strong>Tags:</strong> ${metadata.tags.join(', ')}
          </div>
        ` : ''}
      `;
    }
  }

  /**
   * Generate file preview (base64 data URL)
   */
  generateFilePreview(file) {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        // For videos, we would typically extract a frame
        // For now, just return null and use icon
        resolve(null);
      } else {
        resolve(null);
      }
    });
  }

  /**
   * Get appropriate file icon
   */
  getFileIcon(mimeType) {
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('audio/')) return '🎵';
    return '📄';
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Search for games (mock implementation)
   */
  async searchGames(query) {
    // Mock game search - in production this would call a real API
    const mockGames = [
      { id: 1, name: 'Call of Duty: Modern Warfare III', image: 'https://via.placeholder.com/32x32/10b981/ffffff?text=COD' },
      { id: 2, name: 'Halo 5: Guardians', image: 'https://via.placeholder.com/32x32/10b981/ffffff?text=H5' },
      { id: 3, name: 'Rainbow Six Siege', image: 'https://via.placeholder.com/32x32/10b981/ffffff?text=R6' },
      { id: 4, name: 'Fortnite', image: 'https://via.placeholder.com/32x32/10b981/ffffff?text=FN' },
      { id: 5, name: 'Apex Legends', image: 'https://via.placeholder.com/32x32/10b981/ffffff?text=AP' },
      { id: 6, name: 'Valorant', image: 'https://via.placeholder.com/32x32/10b981/ffffff?text=VAL' }
    ];
    
    return mockGames.filter(game => 
      game.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * Display game search results
   */
  displayGameResults(games) {
    const dropdown = document.getElementById('game-dropdown');
    if (!dropdown) return;
    
    if (games.length === 0) {
      dropdown.innerHTML = '<div class="game-no-results">No games found</div>';
      return;
    }
    
    const resultsHTML = games.map(game => `
      <div class="game-option" 
           data-game-id="${game.id}" 
           data-game-name="${game.name}"
           role="option">
        <img src="${game.image}" alt="${game.name}" class="game-icon">
        <span>${game.name}</span>
      </div>
    `).join('');
    
    dropdown.innerHTML = resultsHTML;
    
    // Add click handlers to game options
    dropdown.querySelectorAll('.game-option').forEach(option => {
      option.addEventListener('click', () => {
        this.selectGame(option.dataset.gameId, option.dataset.gameName);
      });
    });
  }

  /**
   * Select a game from search results
   */
  selectGame(gameId, gameName) {
    this.formState.metadata.game = gameName;
    this.formState.metadata.gameId = gameId;
    
    if (this.gameSearchInput) {
      this.gameSearchInput.value = gameName;
    }
    
    const dropdown = document.getElementById('game-dropdown');
    if (dropdown) {
      dropdown.classList.remove('show');
      this.gameSearchInput.setAttribute('aria-expanded', 'false');
    }
    
    this.validateField('game', gameName);
    this.updatePreview();
    
    console.log('Game selected:', { gameId, gameName });
  }

  /**
   * Check daily upload limits
   */
  checkDailyLimits() {
    return this.dailyLimits.uploads < this.dailyLimits.totalUploads;
  }

  /**
   * Load user submission limits
   */
  async loadUserLimits() {
    try {
      // Mock implementation - in production would load from API
      this.dailyLimits = {
        uploads: 1, // Already uploaded today
        totalUploads: 3 // Daily limit
      };
      
      // Update UI
      const remainingElement = document.getElementById('uploads-remaining');
      if (remainingElement) {
        const remaining = this.dailyLimits.totalUploads - this.dailyLimits.uploads;
        remainingElement.textContent = `${remaining}/${this.dailyLimits.totalUploads}`;
      }
      
      return this.dailyLimits;
    } catch (error) {
      console.error('Failed to load user limits:', error);
      // Default limits on error
      this.dailyLimits = { uploads: 0, totalUploads: 3 };
      return this.dailyLimits;
    }
  }

  /**
   * Initialize game search API
   */
  initializeGameSearch() {
    // Mock initialization - in production would setup API connection
    console.log('Game search API initialized');
  }

  /**
   * Update submission state UI
   */
  updateSubmissionState(state) {
    this.formState.upload.status = state;
    
    switch (state) {
      case 'uploading':
        this.submitBtn.disabled = true;
        this.submitBtn.textContent = '⏳ Uploading...';
        this.progressBar.style.display = 'block';
        break;
        
      case 'processing':
        this.submitBtn.textContent = '⚙️ Processing...';
        break;
        
      case 'completed':
        this.submitBtn.textContent = '✅ Completed';
        this.progressBar.style.display = 'none';
        break;
        
      case 'error':
        this.submitBtn.disabled = false;
        this.submitBtn.textContent = '🚀 Submit Content';
        this.progressBar.style.display = 'none';
        break;
        
      default:
        this.submitBtn.disabled = false;
        this.submitBtn.textContent = '🚀 Submit Content';
        this.progressBar.style.display = 'none';
    }
  }

  /**
   * Upload files with progress tracking
   */
  async uploadFiles() {
    const uploadedFiles = [];
    
    for (let i = 0; i < this.formState.files.length; i++) {
      const fileData = this.formState.files[i];
      
      try {
        // Mock upload - in production would use actual upload API
        const uploadResult = await this.mockFileUpload(fileData, (progress) => {
          fileData.uploadProgress = progress;
          this.updateFileProgress(fileData.id, progress);
        });
        
        uploadedFiles.push(uploadResult);
        fileData.uploadStatus = 'completed';
        
      } catch (error) {
        console.error('File upload failed:', error);
        fileData.uploadStatus = 'error';
        throw error;
      }
    }
    
    return uploadedFiles;
  }

  /**
   * Mock file upload with progress
   */
  mockFileUpload(fileData, onProgress) {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        progress = Math.min(progress, 100);
        
        onProgress(Math.round(progress));
        
        if (progress >= 100) {
          clearInterval(interval);
          resolve({
            id: fileData.id,
            url: `https://cdn.mlg-clan.com/uploads/${fileData.id}`,
            filename: fileData.name,
            size: fileData.size,
            type: fileData.type
          });
        }
      }, 200);
    });
  }

  /**
   * Update file upload progress
   */
  updateFileProgress(fileId, progress) {
    const fileElement = document.querySelector(`[data-file-id="${fileId}"]`);
    if (!fileElement) return;
    
    const progressElement = fileElement.querySelector('.file-progress');
    const fillElement = fileElement.querySelector('.progress-fill');
    const textElement = fileElement.querySelector('.progress-text');
    
    if (progress > 0) {
      progressElement.style.display = 'block';
      fillElement.style.width = `${progress}%`;
      textElement.textContent = `${progress}%`;
    } else {
      progressElement.style.display = 'none';
    }
  }

  /**
   * Submit content to platform
   */
  async submitContent(data) {
    // Mock submission - in production would call actual API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Date.now(),
          status: 'published',
          url: `https://mlg-clan.com/content/${Date.now()}`
        });
      }, 1000);
    });
  }

  /**
   * Prepare draft data
   */
  prepareDraftData() {
    return {
      contentType: this.formState.contentType,
      metadata: { ...this.formState.metadata },
      files: this.formState.files.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      })),
      timestamp: Date.now()
    };
  }

  /**
   * Save draft
   */
  async saveDraft(draftData) {
    // Mock save - in production would save to API or localStorage
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('mlg-content-draft', JSON.stringify(draftData));
      }
      console.log('Draft saved:', draftData);
    } catch (error) {
      console.warn('Failed to save draft to localStorage:', error);
      throw error;
    }
  }

  /**
   * Prepare preview data
   */
  preparePreviewData() {
    return {
      ...this.formState.metadata,
      contentType: this.formState.contentType,
      files: this.formState.files
    };
  }

  /**
   * Show preview modal
   */
  showPreviewModal(previewData) {
    // Create and show preview modal
    console.log('Preview modal would show:', previewData);
    const isTestEnv = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test';
    const hasJest = typeof global !== 'undefined' && global.jest;
    
    if (!isTestEnv && !hasJest && typeof window !== 'undefined' && window.alert) {
      try {
        alert('Preview functionality would show a modal with formatted content preview');
      } catch (e) {
        console.log('PREVIEW: Would show modal with content preview');
      }
    } else {
      console.log('PREVIEW: Would show modal with content preview');
    }
  }

  /**
   * Prepare final submission data
   */
  prepareSubmissionData() {
    return {
      contentType: this.formState.contentType,
      metadata: { ...this.formState.metadata },
      files: [...this.formState.files],
      timestamp: Date.now()
    };
  }

  /**
   * Reset form to initial state
   */
  resetForm() {
    // Reset form state
    this.formState = {
      contentType: 'clips',
      files: [],
      metadata: {
        title: '',
        description: '',
        game: '',
        gameId: null,
        platform: 'xbox',
        category: '',
        tags: [],
        visibility: 'public',
        allowComments: true,
        allowDownloads: false
      },
      validation: {
        errors: {},
        isValid: false,
        touched: {}
      },
      upload: {
        progress: 0,
        status: 'idle',
        currentFile: null
      }
    };
    
    // Reset UI elements
    if (this.titleInput) this.titleInput.value = '';
    if (this.descriptionInput) this.descriptionInput.value = '';
    if (this.gameSearchInput) this.gameSearchInput.value = '';
    if (this.categorySelect) this.categorySelect.value = '';
    if (this.tagInput) this.tagInput.value = '';
    
    // Reset file upload
    this.renderUploadedFiles();
    
    // Reset tags
    this.renderTags();
    this.updateTagCounter();
    
    // Reset preview
    this.updatePreview();
    
    // Reset submission state
    this.updateSubmissionState('idle');
    
    console.log('Form reset to initial state');
  }

  /**
   * Show validation errors
   */
  showValidationErrors() {
    const errors = this.formState.validation.errors;
    
    for (const [field, message] of Object.entries(errors)) {
      if (message) {
        this.validateField(field, this.formState.metadata[field] || '');
      }
    }
    
    // Focus first error field
    const firstErrorField = Object.keys(errors).find(field => errors[field]);
    if (firstErrorField) {
      const element = document.getElementById(`content-${firstErrorField}`) || 
                    document.getElementById(`${firstErrorField}-search`) ||
                    document.getElementById(`${firstErrorField}-input`);
      element?.focus();
    }
  }

  /**
   * Show success message
   */
  showSuccess(title, message = '') {
    // In production, would use a proper toast/notification system
    const isTestEnv = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test';
    const hasJest = typeof global !== 'undefined' && global.jest;
    
    if (!isTestEnv && !hasJest && typeof window !== 'undefined' && window.alert) {
      try {
        alert(`✅ ${title}\n${message}`);
      } catch (e) {
        console.log(`✅ SUCCESS: ${title}${message ? ' - ' + message : ''}`);
      }
    } else {
      console.log(`✅ SUCCESS: ${title}${message ? ' - ' + message : ''}`);
    }
  }

  /**
   * Show error message
   */
  showError(title, message = '') {
    // In production, would use a proper toast/notification system
    const isTestEnv = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test';
    const hasJest = typeof global !== 'undefined' && global.jest;
    
    if (!isTestEnv && !hasJest && typeof window !== 'undefined' && window.alert) {
      try {
        alert(`❌ ${title}\n${message}`);
      } catch (e) {
        console.error(`❌ ERROR: ${title}${message ? ' - ' + message : ''}`);
      }
    } else {
      console.error(`❌ ERROR: ${title}${message ? ' - ' + message : ''}`);
    }
  }

  /**
   * Initialize CSS styles
   */
  initializeCSS() {
    if (document.getElementById('content-submission-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'content-submission-styles';
    styles.textContent = this.generateCSS();
    document.head.appendChild(styles);
  }

  /**
   * Generate complete CSS for the component
   */
  generateCSS() {
    return `
      /* Content Submission Form - Xbox 360 Theme Variables */
      :root {
        --xbox-green: #10b981;
        --xbox-green-dark: #065f46;
        --xbox-green-light: #34d399;
        --tile-gradient: linear-gradient(135deg, #065f46, #064e3b);
        --hover-gradient: linear-gradient(135deg, #047857, #065f46);
        --input-bg: #374151;
        --input-border: #10b981;
        --input-focus: #34d399;
        --text-primary: #ffffff;
        --text-secondary: #d1d5db;
        --text-muted: #9ca3af;
        --error-color: #ef4444;
        --success-color: #10b981;
      }

      /* Content Submission Container */
      .content-submission-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 24px;
        background: #111827;
        color: var(--text-primary);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      /* Header Styling */
      .submission-header {
        text-align: center;
        margin-bottom: 32px;
      }

      .submission-title {
        font-size: 2.5rem;
        font-weight: 800;
        margin-bottom: 8px;
        color: var(--xbox-green);
      }

      .submission-subtitle {
        font-size: 1.125rem;
        color: var(--text-secondary);
        margin-bottom: 16px;
      }

      .upload-limits-indicator {
        display: inline-block;
        background: var(--tile-gradient);
        border: 1px solid var(--xbox-green);
        border-radius: 12px;
        padding: 8px 16px;
      }

      .limits-text {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      /* Xbox Base Tile Styling */
      .tile { 
        transition: all 0.3s ease; 
        background: var(--tile-gradient);
        border: 1px solid var(--xbox-green);
        border-radius: 12px;
      }

      .tile:hover { 
        transform: scale(1.02); 
        box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
      }

      .xbox-green { 
        color: var(--xbox-green); 
      }

      /* Content Type Blade Selector */
      .content-type-selector {
        margin-bottom: 32px;
      }

      .blade-container {
        display: flex;
        gap: 16px;
        justify-content: center;
        flex-wrap: wrap;
      }

      .blade-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px 24px;
        min-width: 180px;
        background: var(--input-bg);
        border: 2px solid transparent;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        text-align: center;
        position: relative;
      }

      .blade-item:hover {
        transform: translateY(-3px);
        border-color: var(--xbox-green);
        box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
      }

      .blade-item.active {
        background: var(--tile-gradient);
        border-color: var(--xbox-green);
        box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
        animation: bladeGlow 3s ease-in-out infinite;
      }

      .blade-icon {
        font-size: 2rem;
        margin-bottom: 8px;
      }

      .blade-label {
        color: var(--text-secondary);
        font-weight: 600;
        font-size: 1rem;
        margin-bottom: 4px;
      }

      .blade-description {
        color: var(--text-muted);
        font-size: 0.75rem;
        line-height: 1.2;
      }

      .blade-item.active .blade-label {
        color: var(--xbox-green);
      }

      @keyframes bladeGlow {
        0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.4); }
        50% { box-shadow: 0 0 30px rgba(16, 185, 129, 0.7); }
      }

      /* Form Grid Layout */
      .form-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 24px;
      }

      @media (min-width: 1024px) {
        .form-grid {
          grid-template-columns: 2fr 1fr;
        }
      }

      .form-column-main,
      .form-column-side {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      /* Form Section Styling */
      .form-section {
        padding: 24px;
        margin-bottom: 0;
      }

      .section-title {
        font-size: 1.25rem;
        font-weight: 700;
        margin-bottom: 20px;
        color: var(--xbox-green);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .form-field {
        margin-bottom: 20px;
        position: relative;
      }

      .field-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-secondary);
        margin-bottom: 8px;
        display: block;
      }

      .field-help {
        font-size: 0.75rem;
        color: var(--text-muted);
        margin-top: 4px;
        line-height: 1.3;
      }

      /* Xbox Input Styling */
      .xbox-input,
      .xbox-textarea,
      .xbox-select {
        width: 100%;
        background: var(--input-bg);
        border: 2px solid transparent;
        border-radius: 8px;
        padding: 12px 16px;
        color: var(--text-primary);
        font-size: 1rem;
        transition: all 0.3s ease;
        font-family: inherit;
      }

      .xbox-input:focus,
      .xbox-textarea:focus,
      .xbox-select:focus {
        outline: none;
        border-color: var(--input-border);
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
        transform: translateY(-1px);
      }

      .xbox-input::placeholder,
      .xbox-textarea::placeholder {
        color: var(--text-muted);
      }

      .xbox-textarea {
        resize: vertical;
        min-height: 100px;
      }

      /* Character Counter */
      .char-counter {
        font-size: 0.75rem;
        color: var(--text-muted);
        text-align: right;
        margin-top: 4px;
        position: absolute;
        right: 0;
        bottom: -18px;
      }

      /* Upload Zone Styling */
      .upload-section {
        margin-bottom: 32px;
      }

      .upload-dropzone {
        border: 3px dashed #4b5563;
        border-radius: 12px;
        padding: 48px 24px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        background: rgba(55, 65, 81, 0.3);
      }

      .upload-dropzone:hover,
      .upload-dropzone.dragover {
        border-color: var(--xbox-green);
        background: rgba(16, 185, 129, 0.1);
        transform: scale(1.02);
      }

      .upload-dropzone:focus {
        outline: 3px solid var(--xbox-green);
        outline-offset: 2px;
      }

      .upload-icon {
        font-size: 3rem;
        margin-bottom: 16px;
        color: var(--text-muted);
      }

      .upload-dropzone:hover .upload-icon {
        color: var(--xbox-green);
      }

      .upload-text h4 {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 8px 0;
      }

      .upload-text p {
        color: var(--text-secondary);
        margin: 0 0 4px 0;
      }

      .file-size-limit {
        color: var(--text-muted);
        font-size: 0.875rem;
      }

      /* Upload Progress */
      .upload-progress {
        margin-top: 16px;
        display: none;
      }

      .progress-bar {
        width: 100%;
        height: 8px;
        background: #374151;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 8px;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(45deg, var(--xbox-green), var(--xbox-green-light));
        border-radius: 4px;
        transition: width 0.3s ease;
        width: 0%;
      }

      .progress-text {
        font-size: 0.875rem;
        color: var(--text-secondary);
        text-align: center;
      }

      /* Uploaded Files List */
      .uploaded-files {
        margin-top: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .uploaded-file {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: var(--input-bg);
        border-radius: 8px;
        border: 1px solid #4b5563;
      }

      .file-preview {
        width: 48px;
        height: 48px;
        border-radius: 6px;
        overflow: hidden;
        background: #4b5563;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }

      .file-preview-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .file-icon {
        font-size: 1.5rem;
      }

      .file-info {
        flex: 1;
        min-width: 0;
      }

      .file-name {
        font-weight: 500;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .file-size {
        font-size: 0.875rem;
        color: var(--text-muted);
      }

      .file-progress {
        margin-top: 8px;
        display: none;
      }

      .file-progress .progress-bar {
        height: 4px;
        margin-bottom: 4px;
      }

      .file-progress .progress-text {
        font-size: 0.75rem;
        text-align: left;
      }

      .file-remove {
        width: 32px;
        height: 32px;
        border: none;
        background: #4b5563;
        color: var(--text-muted);
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 1.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .file-remove:hover {
        background: var(--error-color);
        color: white;
      }

      /* Game Search */
      .game-search-container {
        position: relative;
      }

      .game-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--input-bg);
        border: 2px solid var(--xbox-green);
        border-radius: 8px;
        border-top: none;
        border-top-left-radius: 0;
        border-top-right-radius: 0;
        max-height: 200px;
        overflow-y: auto;
        z-index: 10;
        display: none;
      }

      .game-dropdown.show {
        display: block;
      }

      .game-option {
        padding: 12px 16px;
        cursor: pointer;
        transition: background 0.2s ease;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .game-option:hover {
        background: rgba(16, 185, 129, 0.2);
      }

      .game-icon {
        width: 32px;
        height: 32px;
        border-radius: 4px;
        object-fit: cover;
      }

      .game-no-results {
        padding: 16px;
        text-align: center;
        color: var(--text-muted);
        font-style: italic;
      }

      /* Platform Selector */
      .platform-selector {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-top: 8px;
      }

      .platform-option {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px 16px;
        border: 2px solid #4b5563;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        min-width: 80px;
      }

      .platform-option:hover {
        border-color: var(--xbox-green);
        transform: translateY(-2px);
      }

      .platform-option.selected {
        border-color: var(--xbox-green);
        background: rgba(16, 185, 129, 0.2);
      }

      .platform-option:focus {
        outline: 3px solid var(--xbox-green);
        outline-offset: 2px;
      }

      .platform-icon {
        font-size: 1.5rem;
        margin-bottom: 4px;
      }

      /* Tag Input System */
      .tag-input-container {
        position: relative;
      }

      .tag-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 8px;
        min-height: 32px;
        padding: 4px 0;
      }

      .tag-item {
        background: var(--xbox-green);
        color: white;
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 0.875rem;
        display: flex;
        align-items: center;
        gap: 8px;
        animation: tagAppear 0.3s ease;
      }

      @keyframes tagAppear {
        from { opacity: 0; transform: scale(0.8); }
        to { opacity: 1; transform: scale(1); }
      }

      .tag-remove {
        cursor: pointer;
        font-weight: bold;
        opacity: 0.8;
        padding: 2px 4px;
        border-radius: 50%;
        transition: all 0.2s ease;
      }

      .tag-remove:hover,
      .tag-remove:focus {
        opacity: 1;
        background: rgba(255, 255, 255, 0.2);
      }

      .tag-suggestions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
        flex-wrap: wrap;
      }

      .suggestion-tag {
        background: rgba(75, 85, 99, 0.8);
        color: var(--text-secondary);
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.3s ease;
        border: 1px solid transparent;
      }

      .suggestion-tag:hover,
      .suggestion-tag:focus {
        background: var(--xbox-green);
        color: white;
        transform: translateY(-1px);
      }

      .suggestion-tag:focus {
        outline: 2px solid var(--xbox-green);
        outline-offset: 2px;
      }

      .tag-counter {
        font-size: 0.75rem;
        color: var(--text-muted);
        text-align: right;
        margin-top: 4px;
      }

      /* Radio Group Styling */
      .radio-group {
        display: flex;
        flex-direction: column;
        gap: 12px;
        border: none;
        margin: 0;
        padding: 0;
      }

      .radio-option {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        cursor: pointer;
        padding: 12px;
        border-radius: 8px;
        transition: all 0.3s ease;
        border: 1px solid transparent;
      }

      .radio-option:hover {
        background: rgba(16, 185, 129, 0.1);
        border-color: var(--xbox-green);
      }

      .radio-custom {
        width: 20px;
        height: 20px;
        border: 2px solid #4b5563;
        border-radius: 50%;
        position: relative;
        transition: all 0.3s ease;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .radio-option input[type="radio"] {
        display: none;
      }

      .radio-option input[type="radio"]:checked + .radio-custom {
        border-color: var(--xbox-green);
        background: var(--xbox-green);
      }

      .radio-option input[type="radio"]:checked + .radio-custom::after {
        content: '';
        width: 8px;
        height: 8px;
        background: white;
        border-radius: 50%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }

      .radio-label strong {
        color: var(--text-primary);
        display: block;
        font-weight: 600;
      }

      .radio-label small {
        color: var(--text-muted);
        font-size: 0.875rem;
        line-height: 1.3;
      }

      /* Checkbox Styling */
      .checkbox-option {
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        padding: 8px;
        border-radius: 6px;
        transition: all 0.3s ease;
      }

      .checkbox-option:hover {
        background: rgba(16, 185, 129, 0.1);
      }

      .checkbox-custom {
        width: 20px;
        height: 20px;
        border: 2px solid #4b5563;
        border-radius: 4px;
        position: relative;
        transition: all 0.3s ease;
        flex-shrink: 0;
      }

      .checkbox-option input[type="checkbox"] {
        display: none;
      }

      .checkbox-option input[type="checkbox"]:checked + .checkbox-custom {
        border-color: var(--xbox-green);
        background: var(--xbox-green);
      }

      .checkbox-option input[type="checkbox"]:checked + .checkbox-custom::after {
        content: '✓';
        color: white;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 0.875rem;
        font-weight: bold;
      }

      /* Preview Section */
      .preview-container {
        min-height: 200px;
        background: rgba(55, 65, 81, 0.5);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
        border: 2px dashed #4b5563;
        transition: all 0.3s ease;
      }

      .preview-placeholder {
        text-align: center;
        color: var(--text-muted);
      }

      .preview-icon {
        font-size: 3rem;
        margin-bottom: 8px;
      }

      .preview-image,
      .preview-video {
        max-width: 100%;
        max-height: 200px;
        border-radius: 6px;
      }

      .preview-meta {
        background: rgba(55, 65, 81, 0.3);
        border-radius: 6px;
        padding: 12px;
      }

      .preview-meta-item {
        margin-bottom: 8px;
        font-size: 0.875rem;
        line-height: 1.4;
      }

      .preview-meta-item:last-child {
        margin-bottom: 0;
      }

      .preview-meta-item strong {
        color: var(--xbox-green);
        margin-right: 8px;
      }

      /* Button Styling */
      .btn-primary {
        background: linear-gradient(45deg, var(--xbox-green), var(--xbox-green-dark));
        color: white;
        border: none;
        border-radius: 8px;
        padding: 14px 28px;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 48px;
        text-decoration: none;
      }

      .btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
      }

      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }

      .btn-secondary {
        background: var(--input-bg);
        color: var(--text-secondary);
        border: 2px solid #4b5563;
        border-radius: 8px;
        padding: 12px 24px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 48px;
        text-decoration: none;
      }

      .btn-secondary:hover {
        border-color: var(--xbox-green);
        color: var(--xbox-green);
        transform: translateY(-1px);
      }

      /* Submission Actions */
      .submission-section {
        background: var(--tile-gradient);
        border: 1px solid var(--xbox-green);
        border-radius: 12px;
        padding: 24px;
        margin-top: 32px;
        text-align: center;
      }

      .submission-actions {
        display: flex;
        gap: 16px;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 16px;
      }

      .submission-info {
        color: var(--text-muted);
        font-size: 0.875rem;
        line-height: 1.4;
      }

      /* Form Validation States */
      .form-field.error .xbox-input,
      .form-field.error .xbox-textarea,
      .form-field.error .xbox-select {
        border-color: var(--error-color);
        animation: shake 0.5s ease-in-out;
      }

      .form-field.success .xbox-input,
      .form-field.success .xbox-textarea,
      .form-field.success .xbox-select {
        border-color: var(--success-color);
      }

      .error-message {
        display: none;
        color: var(--error-color);
        font-size: 0.875rem;
        margin-top: 4px;
        padding: 4px 8px;
        background: rgba(239, 68, 68, 0.1);
        border-radius: 4px;
        border-left: 3px solid var(--error-color);
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }

      /* Focus States for Accessibility */
      .blade-item:focus,
      .platform-option:focus,
      .xbox-input:focus,
      .xbox-textarea:focus,
      .xbox-select:focus,
      .btn-primary:focus,
      .btn-secondary:focus,
      .suggestion-tag:focus,
      .file-remove:focus {
        outline: 3px solid var(--xbox-green);
        outline-offset: 2px;
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .content-submission-container {
          padding: 16px;
        }
        
        .blade-container {
          flex-direction: column;
          align-items: center;
        }
        
        .blade-item {
          width: 100%;
          max-width: 300px;
        }
        
        .platform-selector {
          justify-content: center;
        }
        
        .submission-actions {
          flex-direction: column;
          align-items: center;
        }
        
        .btn-primary,
        .btn-secondary {
          width: 100%;
          max-width: 300px;
        }
        
        .xbox-input,
        .xbox-textarea,
        .xbox-select {
          font-size: 16px; /* Prevents zoom on iOS */
        }
        
        .upload-dropzone {
          padding: 32px 16px;
        }
        
        .form-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 480px) {
        .submission-title {
          font-size: 2rem;
        }
        
        .blade-item {
          min-width: auto;
          padding: 16px 20px;
        }
        
        .platform-option {
          min-width: 60px;
          padding: 8px 12px;
        }
        
        .tag-suggestions {
          justify-content: center;
        }
      }

      /* High Contrast Mode Support */
      @media (prefers-contrast: high) {
        .tile {
          border-width: 2px;
        }
        
        .xbox-input,
        .xbox-textarea,
        .xbox-select {
          border-width: 2px;
        }
        
        .btn-primary,
        .btn-secondary {
          border-width: 2px;
        }
      }

      /* Reduced Motion Support */
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
        
        .blade-item.active {
          animation: none;
        }
      }

      /* Print Styles */
      @media print {
        .content-submission-container {
          background: white;
          color: black;
        }
        
        .tile {
          border: 1px solid #ccc;
          background: white;
        }
        
        .btn-primary,
        .btn-secondary {
          display: none;
        }
      }
    `;
  }

  /**
   * Destroy the component and cleanup resources
   */
  destroy() {
    // Remove event listeners
    this.formElements.forEach((container) => {
      container.innerHTML = '';
    });
    
    // Clear component registry
    this.formElements.clear();
    this.dropzones.clear();
    this.previewElements.clear();
    
    // Remove CSS
    const styles = document.getElementById('content-submission-styles');
    if (styles) {
      styles.remove();
    }
    
    console.log('Content Submission Form System destroyed');
  }
}

/**
 * Global reference for direct component access in HTML
 * This allows for onclick handlers in the generated HTML
 */
let contentSubmissionForm = null;

/**
 * Factory function to create and initialize the content submission form
 */
export function createContentSubmissionForm(options = {}) {
  const formSystem = new ContentSubmissionFormSystem(options);
  
  // Set global reference
  contentSubmissionForm = formSystem;
  
  return formSystem;
}

/**
 * Export configuration constants for external use
 */
export {
  CONTENT_SUBMISSION_CONFIG,
  CONTENT_TYPES,
  VALIDATION_RULES
};

/**
 * Usage Example:
 * 
 * import { createContentSubmissionForm } from './content-submission-form.js';
 * 
 * const submissionForm = createContentSubmissionForm({
 *   onSubmit: (result) => console.log('Content submitted:', result),
 *   onError: (error) => console.error('Submission failed:', error)
 * });
 * 
 * // Initialize with wallet connection
 * await submissionForm.initialize(wallet, connection);
 * 
 * // Create form in DOM
 * const formComponent = submissionForm.createContentSubmissionForm('content-form-container');
 */