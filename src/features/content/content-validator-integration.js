/**
 * MLG.clan Content Validator Integration Examples - Sub-task 4.2
 * 
 * Integration examples and utilities for connecting the content validation system
 * with the existing content submission form and other platform components.
 * 
 * Features:
 * - Form integration utilities
 * - Real-time validation feedback
 * - Error message formatting for UI
 * - Progress tracking integration
 * - Batch validation helpers
 * - Performance monitoring
 * 
 * @author Claude Code - Production General Purpose Agent
 * @version 1.0.0
 */

import { ContentValidator, ValidationUtils } from './content-validator.js';

/**
 * Content Validation Integration Manager
 * Provides seamless integration between content validator and submission form
 */
export class ContentValidationIntegration {
  constructor(options = {}) {
    this.validator = new ContentValidator(options.validatorConfig);
    this.formElement = null;
    this.progressCallback = options.onProgress || (() => {});
    this.validationCallback = options.onValidation || (() => {});
    this.errorCallback = options.onError || (() => {});
    
    // UI element selectors
    this.selectors = {
      fileInput: '[data-field="files"]',
      titleInput: '[data-field="title"]',
      descriptionInput: '[data-field="description"]',
      tagsInput: '[data-field="tags"]',
      platformSelect: '[data-field="platform"]',
      categorySelect: '[data-field="category"]',
      gameInput: '[data-field="game"]',
      errorContainer: '.validation-errors',
      warningContainer: '.validation-warnings',
      progressBar: '.validation-progress'
    };

    this.validationCache = new Map();
    this.realTimeValidationEnabled = true;
    this.validationTimeout = null;
  }

  /**
   * Initialize integration with content submission form
   * @param {HTMLElement} formElement - Form element to integrate with
   */
  initializeFormIntegration(formElement) {
    this.formElement = formElement;
    
    if (!formElement) {
      console.error('ContentValidationIntegration: Form element not provided');
      return;
    }

    // Set up real-time validation listeners
    this.setupRealTimeValidation();
    
    // Set up file validation
    this.setupFileValidation();
    
    // Set up form submission validation
    this.setupSubmissionValidation();

    console.log('Content validation integration initialized');
  }

  /**
   * Set up real-time validation for form fields
   */
  setupRealTimeValidation() {
    if (!this.formElement) return;

    // Title validation
    const titleInput = this.formElement.querySelector(this.selectors.titleInput);
    if (titleInput) {
      titleInput.addEventListener('input', (e) => {
        this.debounceValidateField('title', e.target.value, e.target);
      });
    }

    // Description validation
    const descriptionInput = this.formElement.querySelector(this.selectors.descriptionInput);
    if (descriptionInput) {
      descriptionInput.addEventListener('input', (e) => {
        this.debounceValidateField('description', e.target.value, e.target);
      });
    }

    // Platform validation
    const platformSelect = this.formElement.querySelector(this.selectors.platformSelect);
    if (platformSelect) {
      platformSelect.addEventListener('change', (e) => {
        this.validateField('platform', e.target.value, e.target);
      });
    }

    // Category validation
    const categorySelect = this.formElement.querySelector(this.selectors.categorySelect);
    if (categorySelect) {
      categorySelect.addEventListener('change', (e) => {
        this.validateField('category', e.target.value, e.target);
      });
    }

    // Game validation
    const gameInput = this.formElement.querySelector(this.selectors.gameInput);
    if (gameInput) {
      gameInput.addEventListener('input', (e) => {
        this.debounceValidateField('game', e.target.value, e.target);
      });
    }

    // Tags validation (if using tag input)
    const tagsInput = this.formElement.querySelector(this.selectors.tagsInput);
    if (tagsInput) {
      tagsInput.addEventListener('change', (e) => {
        const tags = this.parseTagsFromInput(e.target.value);
        this.validateField('tags', tags, e.target);
      });
    }
  }

  /**
   * Set up file validation with drag-and-drop support
   */
  setupFileValidation() {
    if (!this.formElement) return;

    const fileInput = this.formElement.querySelector(this.selectors.fileInput);
    if (!fileInput) return;

    // File input change handler
    fileInput.addEventListener('change', (e) => {
      this.validateFiles(Array.from(e.target.files));
    });

    // Drag and drop support
    const dropZone = this.formElement.querySelector('.file-upload-area') || this.formElement;
    
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      
      const files = Array.from(e.dataTransfer.files);
      this.validateFiles(files);
    });
  }

  /**
   * Set up form submission validation
   */
  setupSubmissionValidation() {
    if (!this.formElement) return;

    this.formElement.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const isValid = await this.validateCompleteForm();
      if (isValid) {
        // Allow form submission to proceed
        this.formElement.dispatchEvent(new CustomEvent('validationSuccess'));
      } else {
        // Prevent submission and show errors
        this.formElement.dispatchEvent(new CustomEvent('validationFailure'));
      }
    });
  }

  /**
   * Validate a single field with debouncing
   * @param {string} fieldName - Field name
   * @param {*} value - Field value
   * @param {HTMLElement} element - Form element
   */
  debounceValidateField(fieldName, value, element) {
    clearTimeout(this.validationTimeout);
    
    this.validationTimeout = setTimeout(() => {
      this.validateField(fieldName, value, element);
    }, 300); // 300ms debounce
  }

  /**
   * Validate a single field
   * @param {string} fieldName - Field name
   * @param {*} value - Field value
   * @param {HTMLElement} element - Form element
   */
  validateField(fieldName, value, element) {
    if (!this.realTimeValidationEnabled) return;

    try {
      const result = this.validator.validateMetadataField(fieldName, value);
      this.displayFieldValidation(fieldName, result, element);
      
      // Cache result
      this.validationCache.set(fieldName, result);
      
      // Trigger callback
      this.validationCallback({ field: fieldName, result });

    } catch (error) {
      console.error(`Field validation error for ${fieldName}:`, error);
      this.errorCallback({ field: fieldName, error });
    }
  }

  /**
   * Validate uploaded files
   * @param {File[]} files - Files to validate
   */
  async validateFiles(files) {
    if (files.length === 0) return;

    try {
      // Show progress for file validation
      this.showValidationProgress(0);

      const result = await this.validator.fileValidator.validateFiles(files, {
        onProgress: (progress) => {
          this.showValidationProgress(progress);
        }
      });

      // Display results
      this.displayFileValidationResults(result);
      
      // Cache results
      this.validationCache.set('files', result);

      // Hide progress
      this.hideValidationProgress();

      // Trigger callback
      this.validationCallback({ field: 'files', result });

    } catch (error) {
      console.error('File validation error:', error);
      this.hideValidationProgress();
      this.errorCallback({ field: 'files', error });
    }
  }

  /**
   * Validate complete form before submission
   * @returns {Promise<boolean>}
   */
  async validateCompleteForm() {
    if (!this.formElement) {
      console.error('Form element not available for validation');
      return false;
    }

    try {
      // Gather form data
      const formData = this.gatherFormData();
      
      // Show overall validation progress
      this.showValidationProgress(0, 'Validating content...');

      // Perform complete validation
      const result = await this.validator.validateContent(formData, {
        onProgress: (progress) => {
          this.showValidationProgress(progress, 'Validating content...');
        }
      });

      // Display comprehensive results
      this.displayCompleteValidationResults(result);
      
      // Hide progress
      this.hideValidationProgress();

      return result.isValid;

    } catch (error) {
      console.error('Complete form validation error:', error);
      this.hideValidationProgress();
      this.showError('Validation failed', 'An unexpected error occurred during validation');
      return false;
    }
  }

  /**
   * Gather form data for validation
   * @returns {Object}
   */
  gatherFormData() {
    if (!this.formElement) return {};

    const fileInput = this.formElement.querySelector(this.selectors.fileInput);
    const files = fileInput ? Array.from(fileInput.files) : [];

    const titleInput = this.formElement.querySelector(this.selectors.titleInput);
    const descriptionInput = this.formElement.querySelector(this.selectors.descriptionInput);
    const platformSelect = this.formElement.querySelector(this.selectors.platformSelect);
    const categorySelect = this.formElement.querySelector(this.selectors.categorySelect);
    const gameInput = this.formElement.querySelector(this.selectors.gameInput);
    const tagsInput = this.formElement.querySelector(this.selectors.tagsInput);

    return {
      files,
      metadata: {
        title: titleInput?.value || '',
        description: descriptionInput?.value || '',
        platform: platformSelect?.value || '',
        category: categorySelect?.value || '',
        game: gameInput?.value || '',
        tags: tagsInput ? this.parseTagsFromInput(tagsInput.value) : []
      },
      userId: this.getCurrentUserId()
    };
  }

  /**
   * Display field validation result
   * @param {string} fieldName - Field name
   * @param {Object} result - Validation result
   * @param {HTMLElement} element - Form element
   */
  displayFieldValidation(fieldName, result, element) {
    if (!element) return;

    // Find or create error display element
    const errorId = `${fieldName}-validation-error`;
    let errorElement = document.getElementById(errorId);
    
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.id = errorId;
      errorElement.className = 'field-validation-error';
      errorElement.setAttribute('aria-live', 'polite');
      
      // Insert after the form element
      element.parentNode.insertBefore(errorElement, element.nextSibling);
    }

    // Update element state
    element.classList.remove('validation-error', 'validation-success', 'validation-warning');

    if (result.isValid) {
      element.classList.add('validation-success');
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    } else {
      element.classList.add('validation-error');
      
      const firstError = result.errors[0];
      errorElement.textContent = `${firstError.message}: ${firstError.details}`;
      errorElement.style.display = 'block';
      
      // Add severity class
      errorElement.className = `field-validation-error severity-${firstError.severity}`;
    }

    // Handle warnings
    if (result.warnings && result.warnings.length > 0) {
      element.classList.add('validation-warning');
    }
  }

  /**
   * Display file validation results
   * @param {Object} result - File validation result
   */
  displayFileValidationResults(result) {
    const container = this.getOrCreateContainer('file-validation-results');
    
    if (result.isValid) {
      container.innerHTML = `
        <div class="validation-success">
          <span class="success-icon">✓</span>
          ${result.validatedFiles.length} file(s) ready for upload
        </div>
      `;
      
      // Show file details
      if (result.validatedFiles.length > 0) {
        const fileList = document.createElement('div');
        fileList.className = 'validated-file-list';
        
        result.validatedFiles.forEach(({ file }) => {
          const fileItem = document.createElement('div');
          fileItem.className = 'validated-file-item';
          fileItem.innerHTML = `
            <span class="file-name">${file.name}</span>
            <span class="file-size">${this.formatFileSize(file.size)}</span>
          `;
          fileList.appendChild(fileItem);
        });
        
        container.appendChild(fileList);
      }
    } else {
      container.innerHTML = `
        <div class="validation-errors">
          <h4>File Validation Errors:</h4>
          <ul>
            ${result.errors.map(error => 
              `<li class="error severity-${error.severity}">
                <strong>${error.message}</strong>: ${error.details}
              </li>`
            ).join('')}
          </ul>
        </div>
      `;
    }

    // Show warnings if any
    if (result.warnings && result.warnings.length > 0) {
      const warningDiv = document.createElement('div');
      warningDiv.className = 'validation-warnings';
      warningDiv.innerHTML = `
        <h4>Warnings:</h4>
        <ul>
          ${result.warnings.map(warning => 
            `<li class="warning severity-${warning.severity}">
              <strong>${warning.message}</strong>: ${warning.details}
            </li>`
          ).join('')}
        </ul>
      `;
      container.appendChild(warningDiv);
    }
  }

  /**
   * Display complete validation results
   * @param {Object} result - Complete validation result
   */
  displayCompleteValidationResults(result) {
    const container = this.getOrCreateContainer('complete-validation-results');
    
    if (result.isValid) {
      container.innerHTML = `
        <div class="validation-success-complete">
          <span class="success-icon">✓</span>
          <h3>Content is ready for upload!</h3>
          <p>All validation checks passed successfully.</p>
          ${result.warnings.length > 0 ? 
            `<div class="minor-warnings">
              <p><strong>Note:</strong> ${result.warnings.length} minor warning(s) detected.</p>
            </div>` : ''
          }
          <div class="validation-summary">
            <p>Validation completed in ${result.performance.duration}ms</p>
          </div>
        </div>
      `;
    } else {
      const errorsByType = this.groupErrorsByType(result.errors);
      
      container.innerHTML = `
        <div class="validation-failure-complete">
          <span class="error-icon">✗</span>
          <h3>Content validation failed</h3>
          <p>Please fix the following issues before uploading:</p>
          
          <div class="error-groups">
            ${Object.entries(errorsByType).map(([type, errors]) => `
              <div class="error-group">
                <h4>${this.formatErrorType(type)}</h4>
                <ul>
                  ${errors.map(error => 
                    `<li class="error severity-${error.severity}">
                      <strong>${error.message}</strong>: ${error.details}
                    </li>`
                  ).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Scroll to results
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Show validation progress
   * @param {number} progress - Progress percentage (0-100)
   * @param {string} message - Progress message
   */
  showValidationProgress(progress, message = 'Validating...') {
    let progressContainer = this.formElement?.querySelector(this.selectors.progressBar);
    
    if (!progressContainer) {
      progressContainer = this.getOrCreateContainer('validation-progress');
    }

    progressContainer.innerHTML = `
      <div class="progress-bar-container">
        <div class="progress-label">${message}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="progress-percentage">${Math.round(progress)}%</div>
      </div>
    `;

    progressContainer.style.display = 'block';
  }

  /**
   * Hide validation progress
   */
  hideValidationProgress() {
    const progressContainer = this.formElement?.querySelector(this.selectors.progressBar);
    if (progressContainer) {
      progressContainer.style.display = 'none';
    }
  }

  /**
   * Show error message
   * @param {string} title - Error title
   * @param {string} message - Error message
   */
  showError(title, message) {
    const container = this.getOrCreateContainer('validation-error');
    container.innerHTML = `
      <div class="validation-error-message">
        <h4>${title}</h4>
        <p>${message}</p>
      </div>
    `;
  }

  /**
   * Parse tags from input string
   * @param {string} input - Tags input string
   * @returns {string[]}
   */
  parseTagsFromInput(input) {
    if (!input) return [];
    
    return input
      .split(/[,\s]+/)
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0);
  }

  /**
   * Get current user ID (mock implementation)
   * @returns {string}
   */
  getCurrentUserId() {
    // In a real implementation, this would get the actual user ID
    return 'current-user-id';
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
   * Group errors by type
   * @param {Array} errors - Error array
   * @returns {Object}
   */
  groupErrorsByType(errors) {
    return errors.reduce((groups, error) => {
      const type = error.type || 'other';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(error);
      return groups;
    }, {});
  }

  /**
   * Format error type for display
   * @param {string} type - Error type
   * @returns {string}
   */
  formatErrorType(type) {
    const typeMap = {
      'file_size_limit': 'File Size Issues',
      'unsupported_file_type': 'File Type Issues',
      'required_field': 'Required Fields',
      'min_length': 'Content Length',
      'max_length': 'Content Length',
      'invalid_value': 'Invalid Values',
      'banned_content': 'Content Guidelines',
      'profane_tags': 'Content Guidelines',
      'daily_limit': 'Upload Limits',
      'rate_limit': 'Upload Limits'
    };

    return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get or create a container element
   * @param {string} className - Container class name
   * @returns {HTMLElement}
   */
  getOrCreateContainer(className) {
    let container = this.formElement?.querySelector(`.${className}`);
    
    if (!container) {
      container = document.createElement('div');
      container.className = className;
      
      // Insert at the end of the form
      if (this.formElement) {
        this.formElement.appendChild(container);
      }
    }

    return container;
  }

  /**
   * Enable or disable real-time validation
   * @param {boolean} enabled - Whether to enable real-time validation
   */
  setRealTimeValidation(enabled) {
    this.realTimeValidationEnabled = enabled;
  }

  /**
   * Clear all validation results
   */
  clearValidationResults() {
    this.validationCache.clear();
    
    // Clear UI validation displays
    const containers = [
      'file-validation-results',
      'complete-validation-results',
      'validation-progress',
      'validation-error'
    ];

    containers.forEach(className => {
      const container = this.formElement?.querySelector(`.${className}`);
      if (container) {
        container.innerHTML = '';
        container.style.display = 'none';
      }
    });

    // Clear field validation states
    if (this.formElement) {
      const fields = this.formElement.querySelectorAll('.validation-error, .validation-success, .validation-warning');
      fields.forEach(field => {
        field.classList.remove('validation-error', 'validation-success', 'validation-warning');
      });

      const errorElements = this.formElement.querySelectorAll('[id$="-validation-error"]');
      errorElements.forEach(element => {
        element.style.display = 'none';
        element.textContent = '';
      });
    }
  }

  /**
   * Get validation statistics
   * @returns {Object}
   */
  getValidationStats() {
    const cached = Array.from(this.validationCache.values());
    
    return {
      totalValidations: cached.length,
      successfulValidations: cached.filter(result => result.isValid).length,
      failedValidations: cached.filter(result => !result.isValid).length,
      totalErrors: cached.reduce((sum, result) => sum + (result.errors?.length || 0), 0),
      totalWarnings: cached.reduce((sum, result) => sum + (result.warnings?.length || 0), 0)
    };
  }
}

/**
 * Quick validation helpers for immediate use
 */
export class QuickValidation {
  static validator = new ContentValidator();

  /**
   * Quick file validation
   * @param {File} file - File to validate
   * @returns {Promise<Object>}
   */
  static async validateFile(file) {
    try {
      const result = await this.validator.quickValidateFile(file);
      return {
        isValid: result.isValid,
        message: result.isValid ? 'File is valid' : result.errors[0]?.message,
        errors: result.errors,
        warnings: result.warnings
      };
    } catch (error) {
      return {
        isValid: false,
        message: 'Validation failed',
        errors: [{ message: error.message, type: 'validation_error' }],
        warnings: []
      };
    }
  }

  /**
   * Quick metadata field validation
   * @param {string} field - Field name
   * @param {*} value - Field value
   * @returns {Object}
   */
  static validateField(field, value) {
    try {
      const result = this.validator.validateMetadataField(field, value);
      return {
        isValid: result.isValid,
        message: result.isValid ? 'Field is valid' : result.errors[0]?.message,
        errors: result.errors,
        warnings: result.warnings
      };
    } catch (error) {
      return {
        isValid: false,
        message: 'Validation failed',
        errors: [{ message: error.message, type: 'validation_error' }],
        warnings: []
      };
    }
  }

  /**
   * Quick batch file validation
   * @param {File[]} files - Files to validate
   * @returns {Promise<Object>}
   */
  static async validateFiles(files) {
    try {
      const results = await Promise.all(files.map(file => this.validateFile(file)));
      const allValid = results.every(result => result.isValid);
      
      return {
        isValid: allValid,
        results,
        summary: {
          total: files.length,
          valid: results.filter(r => r.isValid).length,
          invalid: results.filter(r => !r.isValid).length
        }
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
        results: [],
        summary: { total: files.length, valid: 0, invalid: files.length }
      };
    }
  }
}

/**
 * Utility functions for integration
 */
export const IntegrationUtils = {
  /**
   * Create validation error toast notification
   * @param {Object} result - Validation result
   * @returns {HTMLElement}
   */
  createErrorToast(result) {
    const toast = document.createElement('div');
    toast.className = 'validation-toast error';
    
    const highPriorityErrors = ValidationUtils.filterErrorsBySeverity(result.errors, 'high');
    const errorMessage = highPriorityErrors.length > 0 
      ? highPriorityErrors[0].message 
      : result.errors[0]?.message || 'Validation failed';

    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">⚠️</span>
        <span class="toast-message">${errorMessage}</span>
        <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    return toast;
  },

  /**
   * Create validation success toast notification
   * @param {Object} result - Validation result
   * @returns {HTMLElement}
   */
  createSuccessToast(result) {
    const toast = document.createElement('div');
    toast.className = 'validation-toast success';
    
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">✅</span>
        <span class="toast-message">Content validated successfully</span>
        <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    return toast;
  },

  /**
   * Add CSS styles for validation UI
   */
  addValidationStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Validation UI Styles */
      .validation-success { border: 2px solid #4CAF50; }
      .validation-error { border: 2px solid #f44336; }
      .validation-warning { border: 2px solid #FF9800; }
      
      .field-validation-error {
        color: #f44336;
        font-size: 0.875rem;
        margin-top: 4px;
        display: none;
      }
      
      .field-validation-error.severity-high { color: #d32f2f; font-weight: bold; }
      .field-validation-error.severity-medium { color: #f57c00; }
      .field-validation-error.severity-low { color: #1976d2; }
      
      .validation-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        min-width: 300px;
      }
      
      .validation-toast.error { border-left: 4px solid #f44336; }
      .validation-toast.success { border-left: 4px solid #4CAF50; }
      
      .toast-content {
        display: flex;
        align-items: center;
        padding: 16px;
        gap: 12px;
      }
      
      .toast-close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        margin-left: auto;
      }
      
      .progress-bar-container {
        background: #f5f5f5;
        border-radius: 8px;
        padding: 16px;
        margin: 16px 0;
      }
      
      .progress-bar {
        background: #e0e0e0;
        border-radius: 4px;
        height: 8px;
        margin: 8px 0;
        overflow: hidden;
      }
      
      .progress-fill {
        background: #4CAF50;
        height: 100%;
        transition: width 0.3s ease;
      }
      
      .validated-file-list {
        background: #f8f9fa;
        border-radius: 4px;
        padding: 12px;
        margin-top: 8px;
      }
      
      .validated-file-item {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
        font-size: 0.875rem;
      }
    `;
    
    document.head.appendChild(style);
  }
};

// Default export
export default ContentValidationIntegration;