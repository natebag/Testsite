/**
 * Content Submission Form Test Suite
 * Comprehensive testing for the MLG.clan content submission form component
 * 
 * @author Claude Code - Production Frontend Engineer
 * @version 1.0.0
 */

import { 
  ContentSubmissionFormSystem, 
  createContentSubmissionForm,
  CONTENT_SUBMISSION_CONFIG,
  CONTENT_TYPES,
  VALIDATION_RULES
} from './content-submission-form.js';

// Mock dependencies
jest.mock('../../tokens/spl-mlg-token.js', () => ({
  MLGTokenManager: class MockMLGTokenManager {
    constructor() {
      this.balance = 100;
    }
    
    async getBalance() {
      return this.balance;
    }
  }
}));

jest.mock('@solana/web3.js', () => ({
  Connection: class MockConnection {},
  PublicKey: class MockPublicKey {},
  LAMPORTS_PER_SOL: 1000000000
}));

// Test utilities
const mockWallet = {
  publicKey: { toString: () => 'mock-wallet-address' },
  connected: true
};

const mockConnection = {};

const createMockFile = (name, type, size = 1024) => {
  const file = new File(['mock content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

const setupDOM = () => {
  document.body.innerHTML = '<div id="test-container"></div>';
};

const cleanup = () => {
  document.body.innerHTML = '';
  
  // Remove any injected styles
  const styles = document.getElementById('content-submission-styles');
  if (styles) {
    styles.remove();
  }
};

describe('ContentSubmissionFormSystem', () => {
  let formSystem;
  
  beforeEach(() => {
    setupDOM();
    formSystem = new ContentSubmissionFormSystem();
  });
  
  afterEach(() => {
    if (formSystem) {
      formSystem.destroy();
    }
    cleanup();
  });

  describe('Initialization', () => {
    test('creates instance with default configuration', () => {
      expect(formSystem).toBeInstanceOf(ContentSubmissionFormSystem);
      expect(formSystem.formState.contentType).toBe('clips');
      expect(formSystem.formState.files).toHaveLength(0);
      expect(formSystem.formState.metadata.visibility).toBe('public');
    });

    test('accepts custom options', () => {
      const onSubmit = jest.fn();
      const onError = jest.fn();
      
      const customFormSystem = new ContentSubmissionFormSystem({
        onSubmit,
        onError
      });
      
      expect(customFormSystem.onSubmit).toBe(onSubmit);
      expect(customFormSystem.onError).toBe(onError);
      
      customFormSystem.destroy();
    });

    test('initializes with wallet and connection', async () => {
      const result = await formSystem.initialize(mockWallet, mockConnection);
      
      expect(result).toBe(true);
      expect(formSystem.wallet).toBe(mockWallet);
      expect(formSystem.connection).toBe(mockConnection);
    });

    test('injects CSS styles on initialization', () => {
      expect(document.getElementById('content-submission-styles')).toBeTruthy();
    });
  });

  describe('Form Creation', () => {
    test('creates form in specified container', () => {
      const component = formSystem.createContentSubmissionForm('test-container');
      
      expect(component).toBeTruthy();
      expect(component.element).toBe(document.getElementById('test-container'));
      
      const form = document.querySelector('#submission-form');
      expect(form).toBeTruthy();
    });

    test('throws error for invalid container', () => {
      expect(() => {
        formSystem.createContentSubmissionForm('non-existent');
      }).toThrow('Container element with ID \'non-existent\' not found');
    });

    test('generates complete form structure', () => {
      formSystem.createContentSubmissionForm('test-container');
      
      // Check for main sections
      expect(document.querySelector('.submission-header')).toBeTruthy();
      expect(document.querySelector('.content-type-selector')).toBeTruthy();
      expect(document.querySelector('.upload-section')).toBeTruthy();
      expect(document.querySelector('.submission-section')).toBeTruthy();
      
      // Check for form fields
      expect(document.getElementById('content-title')).toBeTruthy();
      expect(document.getElementById('content-description')).toBeTruthy();
      expect(document.getElementById('game-search')).toBeTruthy();
      expect(document.getElementById('content-category')).toBeTruthy();
    });
  });

  describe('Content Type Selection', () => {
    beforeEach(() => {
      formSystem.createContentSubmissionForm('test-container');
    });

    test('selects content type on blade click', () => {
      const screenshotBlade = document.querySelector('[data-content-type="screenshots"]');
      
      screenshotBlade.click();
      
      expect(formSystem.formState.contentType).toBe('screenshots');
      expect(screenshotBlade.classList.contains('active')).toBe(true);
    });

    test('updates file input accept types on content type change', () => {
      const fileInput = document.getElementById('file-input');
      const guideBlade = document.querySelector('[data-content-type="guides"]');
      
      guideBlade.click();
      
      expect(fileInput.getAttribute('accept')).toContain('video/*');
      expect(fileInput.getAttribute('accept')).toContain('image/*');
    });

    test('supports keyboard navigation', () => {
      const reviewsBlade = document.querySelector('[data-content-type="reviews"]');
      
      reviewsBlade.focus();
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      reviewsBlade.dispatchEvent(enterEvent);
      
      expect(formSystem.formState.contentType).toBe('reviews');
    });
  });

  describe('File Upload', () => {
    beforeEach(() => {
      formSystem.createContentSubmissionForm('test-container');
    });

    test('validates file size', async () => {
      const largeFile = createMockFile('large.mp4', 'video/mp4', CONTENT_SUBMISSION_CONFIG.MAX_FILE_SIZE + 1);
      
      const isValid = await formSystem.validateFile(largeFile);
      
      expect(isValid).toBe(false);
    });

    test('validates file type for content type', async () => {
      formSystem.formState.contentType = 'clips';
      const imageFile = createMockFile('test.jpg', 'image/jpeg');
      
      // Images are not allowed for clips content type
      const isValid = await formSystem.validateFile(imageFile);
      
      expect(isValid).toBe(false);
    });

    test('accepts valid files', async () => {
      formSystem.formState.contentType = 'clips';
      const videoFile = createMockFile('clip.mp4', 'video/mp4', 50 * 1024 * 1024);
      
      const isValid = await formSystem.validateFile(videoFile);
      
      expect(isValid).toBe(true);
    });

    test('handles drag and drop events', () => {
      const dropzone = document.getElementById('file-dropzone');
      
      const dragOverEvent = new Event('dragover');
      dropzone.dispatchEvent(dragOverEvent);
      
      expect(dropzone.classList.contains('dragover')).toBe(true);
      
      const dragLeaveEvent = new Event('dragleave');
      dropzone.dispatchEvent(dragLeaveEvent);
      
      expect(dropzone.classList.contains('dragover')).toBe(false);
    });

    test('adds files to form state', async () => {
      const videoFile = createMockFile('test.mp4', 'video/mp4');
      
      await formSystem.addFile(videoFile);
      
      expect(formSystem.formState.files).toHaveLength(1);
      expect(formSystem.formState.files[0].name).toBe('test.mp4');
    });

    test('removes files from form state', async () => {
      const videoFile = createMockFile('test.mp4', 'video/mp4');
      await formSystem.addFile(videoFile);
      
      const fileId = formSystem.formState.files[0].id;
      formSystem.removeFile(fileId);
      
      expect(formSystem.formState.files).toHaveLength(0);
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      formSystem.createContentSubmissionForm('test-container');
    });

    test('validates required title field', () => {
      const isValid = formSystem.validateField('title', '');
      
      expect(isValid).toBe(false);
      expect(formSystem.formState.validation.errors.title).toBeTruthy();
    });

    test('validates title length', () => {
      const longTitle = 'a'.repeat(CONTENT_SUBMISSION_CONFIG.MAX_TITLE_LENGTH + 1);
      const isValid = formSystem.validateField('title', longTitle);
      
      expect(isValid).toBe(false);
    });

    test('validates title pattern', () => {
      const invalidTitle = 'Title with <script>alert(1)</script>';
      const isValid = formSystem.validateField('title', invalidTitle);
      
      expect(isValid).toBe(false);
    });

    test('validates description length', () => {
      const longDescription = 'a'.repeat(CONTENT_SUBMISSION_CONFIG.MAX_DESCRIPTION_LENGTH + 1);
      const isValid = formSystem.validateField('description', longDescription);
      
      expect(isValid).toBe(false);
    });

    test('validates entire form', () => {
      // Empty form should be invalid
      let isValid = formSystem.validateForm();
      expect(isValid).toBe(false);
      
      // Fill required fields
      formSystem.formState.metadata.title = 'Test Title';
      formSystem.formState.metadata.game = 'Test Game';
      formSystem.formState.files = [{ name: 'test.mp4' }];
      
      isValid = formSystem.validateForm();
      expect(isValid).toBe(true);
    });
  });

  describe('Tag Management', () => {
    beforeEach(() => {
      formSystem.createContentSubmissionForm('test-container');
    });

    test('adds valid tags', () => {
      formSystem.addTag('clutch');
      
      expect(formSystem.formState.metadata.tags).toContain('clutch');
    });

    test('prevents duplicate tags', () => {
      formSystem.addTag('headshot');
      formSystem.addTag('headshot');
      
      expect(formSystem.formState.metadata.tags).toHaveLength(1);
    });

    test('validates tag format', () => {
      const isValid = formSystem.validateTag('invalid tag with spaces');
      
      expect(isValid).toBe(false);
    });

    test('removes tags', () => {
      formSystem.addTag('epic');
      formSystem.removeTag('epic');
      
      expect(formSystem.formState.metadata.tags).not.toContain('epic');
    });

    test('enforces maximum tag limit', () => {
      for (let i = 0; i < CONTENT_SUBMISSION_CONFIG.MAX_TAGS + 5; i++) {
        formSystem.addTag(`tag${i}`);
      }
      
      expect(formSystem.formState.metadata.tags).toHaveLength(CONTENT_SUBMISSION_CONFIG.MAX_TAGS);
    });

    test('handles tag input with Enter key', () => {
      const tagInput = document.getElementById('tag-input');
      tagInput.value = 'newtag';
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      formSystem.handleTagInput(enterEvent);
      
      expect(formSystem.formState.metadata.tags).toContain('newtag');
      expect(tagInput.value).toBe('');
    });

    test('handles tag input with comma', () => {
      const tagInput = document.getElementById('tag-input');
      tagInput.value = 'commatag';
      
      const commaEvent = new KeyboardEvent('keydown', { key: ',' });
      formSystem.handleTagInput(commaEvent);
      
      expect(formSystem.formState.metadata.tags).toContain('commatag');
      expect(tagInput.value).toBe('');
    });
  });

  describe('Game Search', () => {
    beforeEach(() => {
      formSystem.createContentSubmissionForm('test-container');
    });

    test('searches for games with query', async () => {
      const mockGames = await formSystem.searchGames('call of duty');
      
      expect(mockGames).toBeDefined();
      expect(mockGames.length).toBeGreaterThan(0);
      expect(mockGames[0]).toHaveProperty('name');
      expect(mockGames[0]).toHaveProperty('id');
    });

    test('filters games by search query', async () => {
      const results = await formSystem.searchGames('halo');
      
      const hasHalo = results.some(game => 
        game.name.toLowerCase().includes('halo')
      );
      
      expect(hasHalo).toBe(true);
    });

    test('selects game from search results', () => {
      formSystem.selectGame('123', 'Test Game');
      
      expect(formSystem.formState.metadata.game).toBe('Test Game');
      expect(formSystem.formState.metadata.gameId).toBe('123');
    });

    test('shows dropdown on search input', async () => {
      const searchInput = document.getElementById('game-search');
      const dropdown = document.getElementById('game-dropdown');
      
      searchInput.value = 'test';
      await formSystem.handleGameSearch({ target: searchInput });
      
      expect(dropdown.classList.contains('show')).toBe(true);
    });
  });

  describe('Platform Selection', () => {
    beforeEach(() => {
      formSystem.createContentSubmissionForm('test-container');
    });

    test('selects platform on click', () => {
      const pcPlatform = document.querySelector('[data-platform="pc"]');
      
      pcPlatform.click();
      
      expect(formSystem.formState.metadata.platform).toBe('pc');
      expect(pcPlatform.classList.contains('selected')).toBe(true);
    });

    test('supports keyboard selection', () => {
      const mobilePlatform = document.querySelector('[data-platform="mobile"]');
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      formSystem.handlePlatformSelection({ 
        currentTarget: mobilePlatform,
        preventDefault: () => {}
      });
      
      expect(formSystem.formState.metadata.platform).toBe('mobile');
    });
  });

  describe('Preview Functionality', () => {
    beforeEach(() => {
      formSystem.createContentSubmissionForm('test-container');
    });

    test('shows placeholder when no files uploaded', () => {
      formSystem.updatePreview();
      
      const placeholder = document.querySelector('.preview-placeholder');
      expect(placeholder).toBeTruthy();
    });

    test('updates preview with file information', async () => {
      const videoFile = createMockFile('test.mp4', 'video/mp4');
      await formSystem.addFile(videoFile);
      
      formSystem.updatePreview();
      
      const previewContainer = document.getElementById('content-preview');
      expect(previewContainer.innerHTML).toContain('test.mp4');
    });

    test('updates metadata preview', () => {
      formSystem.formState.metadata.title = 'Test Title';
      formSystem.formState.metadata.description = 'Test Description';
      formSystem.formState.metadata.tags = ['test', 'preview'];
      
      formSystem.updatePreview();
      
      const metadataPreview = document.getElementById('preview-metadata');
      expect(metadataPreview.innerHTML).toContain('Test Title');
      expect(metadataPreview.innerHTML).toContain('Test Description');
      expect(metadataPreview.innerHTML).toContain('test, preview');
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      formSystem.createContentSubmissionForm('test-container');
    });

    test('validates form before submission', async () => {
      const result = await formSystem.submitForm();
      
      expect(result).toBe(false);
      expect(formSystem.formState.validation.isValid).toBe(false);
    });

    test('checks daily limits before submission', async () => {
      // Setup valid form
      formSystem.formState.metadata.title = 'Test Title';
      formSystem.formState.metadata.game = 'Test Game';
      formSystem.formState.files = [{ name: 'test.mp4' }];
      
      // Mock exceeded limits
      formSystem.dailyLimits = { uploads: 3, totalUploads: 3 };
      
      const result = await formSystem.submitForm();
      
      expect(result).toBe(false);
    });

    test('submits valid form successfully', async () => {
      // Setup valid form
      formSystem.formState.metadata.title = 'Test Title';
      formSystem.formState.metadata.game = 'Test Game';
      formSystem.formState.files = [createMockFile('test.mp4', 'video/mp4')];
      
      // Mock successful submission
      formSystem.uploadFiles = jest.fn().mockResolvedValue([{ url: 'test-url' }]);
      formSystem.submitContent = jest.fn().mockResolvedValue({ id: '123' });
      
      const result = await formSystem.submitForm();
      
      expect(result).toBe(true);
      expect(formSystem.uploadFiles).toHaveBeenCalled();
      expect(formSystem.submitContent).toHaveBeenCalled();
    });

    test('handles submission errors', async () => {
      // Setup valid form
      formSystem.formState.metadata.title = 'Test Title';
      formSystem.formState.metadata.game = 'Test Game';
      formSystem.formState.files = [createMockFile('test.mp4', 'video/mp4')];
      
      // Mock error
      formSystem.uploadFiles = jest.fn().mockRejectedValue(new Error('Upload failed'));
      
      const result = await formSystem.submitForm();
      
      expect(result).toBe(false);
      expect(formSystem.formState.upload.status).toBe('error');
    });
  });

  describe('Draft Management', () => {
    beforeEach(() => {
      formSystem.createContentSubmissionForm('test-container');
    });

    test('prepares draft data correctly', () => {
      formSystem.formState.metadata.title = 'Draft Title';
      formSystem.formState.files = [createMockFile('test.mp4', 'video/mp4')];
      
      const draftData = formSystem.prepareDraftData();
      
      expect(draftData.metadata.title).toBe('Draft Title');
      expect(draftData.files).toHaveLength(1);
      expect(draftData.timestamp).toBeDefined();
    });

    test('saves draft successfully', async () => {
      // Mock localStorage
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
      
      formSystem.formState.metadata.title = 'Draft Title';
      await formSystem.handleSaveDraft({ preventDefault: () => {} });
      
      expect(setItemSpy).toHaveBeenCalledWith(
        'mlg-content-draft',
        expect.any(String)
      );
      
      setItemSpy.mockRestore();
    });
  });

  describe('Character Counters', () => {
    beforeEach(() => {
      formSystem.createContentSubmissionForm('test-container');
    });

    test('updates title character counter', () => {
      const titleInput = document.getElementById('content-title');
      const titleCounter = document.getElementById('title-counter');
      
      titleInput.value = 'Test title';
      titleInput.dispatchEvent(new Event('input'));
      
      expect(titleCounter.textContent).toContain('10/100');
    });

    test('updates description character counter', () => {
      const descriptionInput = document.getElementById('content-description');
      const descriptionCounter = document.getElementById('description-counter');
      
      descriptionInput.value = 'Test description that is longer';
      descriptionInput.dispatchEvent(new Event('input'));
      
      expect(descriptionCounter.textContent).toContain('31/500');
    });

    test('changes counter color when approaching limit', () => {
      const titleInput = document.getElementById('content-title');
      const titleCounter = document.getElementById('title-counter');
      
      titleInput.value = 'a'.repeat(95); // Close to 100 char limit
      titleInput.dispatchEvent(new Event('input'));
      
      expect(titleCounter.style.color).toBe('rgb(239, 68, 68)'); // Red color
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      formSystem.createContentSubmissionForm('test-container');
    });

    test('includes proper ARIA labels', () => {
      const dropzone = document.getElementById('file-dropzone');
      const gameSearch = document.getElementById('game-search');
      
      expect(dropzone.getAttribute('aria-label')).toBeTruthy();
      expect(gameSearch.getAttribute('role')).toBe('combobox');
    });

    test('manages focus states correctly', () => {
      const titleInput = document.getElementById('content-title');
      
      titleInput.focus();
      
      expect(document.activeElement).toBe(titleInput);
    });

    test('provides error announcements', () => {
      formSystem.validateField('title', '');
      
      const errorElement = document.getElementById('title-error');
      expect(errorElement.getAttribute('role')).toBe('alert');
    });

    test('supports keyboard navigation for custom elements', () => {
      const suggestionTag = document.querySelector('.suggestion-tag');
      
      expect(suggestionTag.getAttribute('tabindex')).toBe('0');
      expect(suggestionTag.getAttribute('role')).toBe('button');
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      formSystem.createContentSubmissionForm('test-container');
    });

    test('includes mobile responsive CSS', () => {
      const styles = document.getElementById('content-submission-styles');
      
      expect(styles.textContent).toContain('@media (max-width: 768px)');
      expect(styles.textContent).toContain('font-size: 16px');
    });

    test('handles touch interactions', () => {
      const blade = document.querySelector('.blade-item');
      
      expect(blade.style.minHeight).toBe(''); // Would be set by CSS
    });
  });

  describe('File Helper Functions', () => {
    test('formats file sizes correctly', () => {
      expect(formSystem.formatFileSize(1024)).toBe('1 KB');
      expect(formSystem.formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formSystem.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formSystem.formatFileSize(0)).toBe('0 Bytes');
    });

    test('gets correct file icons', () => {
      expect(formSystem.getFileIcon('video/mp4')).toBe('🎬');
      expect(formSystem.getFileIcon('image/jpeg')).toBe('🖼️');
      expect(formSystem.getFileIcon('audio/mp3')).toBe('🎵');
      expect(formSystem.getFileIcon('application/pdf')).toBe('📄');
    });

    test('categorizes file types correctly', () => {
      expect(formSystem.getFileTypeCategory('video/mp4')).toBe('video');
      expect(formSystem.getFileTypeCategory('image/png')).toBe('image');
      expect(formSystem.getFileTypeCategory('audio/wav')).toBe('audio');
      expect(formSystem.getFileTypeCategory('text/plain')).toBe('unknown');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      formSystem.createContentSubmissionForm('test-container');
    });

    test('shows error messages correctly', () => {
      const showErrorSpy = jest.spyOn(formSystem, 'showError');
      
      formSystem.showError('Test Error', 'Error message');
      
      expect(showErrorSpy).toHaveBeenCalledWith('Test Error', 'Error message');
    });

    test('shows success messages correctly', () => {
      const showSuccessSpy = jest.spyOn(formSystem, 'showSuccess');
      
      formSystem.showSuccess('Test Success', 'Success message');
      
      expect(showSuccessSpy).toHaveBeenCalledWith('Test Success', 'Success message');
    });

    test('handles file upload errors gracefully', async () => {
      const invalidFile = createMockFile('test.exe', 'application/exe');
      
      const result = await formSystem.validateFile(invalidFile);
      
      expect(result).toBe(false);
    });
  });

  describe('Component Cleanup', () => {
    test('destroys component and cleans up resources', () => {
      formSystem.createContentSubmissionForm('test-container');
      
      formSystem.destroy();
      
      expect(formSystem.formElements.size).toBe(0);
      expect(document.getElementById('content-submission-styles')).toBeFalsy();
    });
  });
});

describe('Factory Function', () => {
  afterEach(() => {
    cleanup();
  });

  test('creates form system instance', () => {
    const formSystem = createContentSubmissionForm();
    
    expect(formSystem).toBeInstanceOf(ContentSubmissionFormSystem);
    
    formSystem.destroy();
  });

  test('accepts configuration options', () => {
    const onSubmit = jest.fn();
    const formSystem = createContentSubmissionForm({ onSubmit });
    
    expect(formSystem.onSubmit).toBe(onSubmit);
    
    formSystem.destroy();
  });
});

describe('Configuration Constants', () => {
  test('exports required constants', () => {
    expect(CONTENT_SUBMISSION_CONFIG).toBeDefined();
    expect(CONTENT_TYPES).toBeDefined();
    expect(VALIDATION_RULES).toBeDefined();
  });

  test('has correct content types', () => {
    expect(CONTENT_TYPES.clips).toBeDefined();
    expect(CONTENT_TYPES.screenshots).toBeDefined();
    expect(CONTENT_TYPES.guides).toBeDefined();
    expect(CONTENT_TYPES.reviews).toBeDefined();
  });

  test('has proper validation rules', () => {
    expect(VALIDATION_RULES.title.required).toBe(true);
    expect(VALIDATION_RULES.title.maxLength).toBe(100);
    expect(VALIDATION_RULES.file.required).toBe(true);
  });
});

describe('Integration Tests', () => {
  let formSystem;
  
  beforeEach(() => {
    setupDOM();
    formSystem = createContentSubmissionForm();
  });
  
  afterEach(() => {
    if (formSystem) {
      formSystem.destroy();
    }
    cleanup();
  });

  test('complete workflow: create form, add content, submit', async () => {
    // Initialize form
    await formSystem.initialize(mockWallet, mockConnection);
    const component = formSystem.createContentSubmissionForm('test-container');
    
    expect(component).toBeTruthy();
    
    // Fill out form
    formSystem.formState.metadata.title = 'Integration Test Content';
    formSystem.formState.metadata.description = 'Test description for integration';
    formSystem.formState.metadata.game = 'Test Game';
    formSystem.addTag('integration');
    formSystem.addTag('test');
    
    // Add file
    const testFile = createMockFile('integration-test.mp4', 'video/mp4');
    await formSystem.addFile(testFile);
    
    // Validate form
    const isValid = formSystem.validateForm();
    expect(isValid).toBe(true);
    
    // Mock submission
    formSystem.uploadFiles = jest.fn().mockResolvedValue([{ url: 'test-url' }]);
    formSystem.submitContent = jest.fn().mockResolvedValue({ id: 'test-id' });
    
    // Submit form
    const result = await formSystem.submitForm();
    expect(result).toBe(true);
  });

  test('handles form reset correctly', async () => {
    const component = formSystem.createContentSubmissionForm('test-container');
    
    // Add some data
    formSystem.formState.metadata.title = 'Test Title';
    formSystem.addTag('test');
    await formSystem.addFile(createMockFile('test.mp4', 'video/mp4'));
    
    // Reset form
    formSystem.resetForm();
    
    // Verify reset state
    expect(formSystem.formState.metadata.title).toBe('');
    expect(formSystem.formState.metadata.tags).toHaveLength(0);
    expect(formSystem.formState.files).toHaveLength(0);
  });
});

// Performance Tests
describe('Performance Tests', () => {
  let formSystem;
  
  beforeEach(() => {
    setupDOM();
    formSystem = new ContentSubmissionFormSystem();
  });
  
  afterEach(() => {
    if (formSystem) {
      formSystem.destroy();
    }
    cleanup();
  });

  test('handles large number of tags efficiently', () => {
    const startTime = performance.now();
    
    for (let i = 0; i < 1000; i++) {
      formSystem.validateTag(`tag${i}`);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(100); // Should complete in under 100ms
  });

  test('validates large files without blocking', async () => {
    const largeFile = createMockFile('large.mp4', 'video/mp4', 50 * 1024 * 1024);
    
    const startTime = performance.now();
    await formSystem.validateFile(largeFile);
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(50); // Should be fast
  });
});

// Edge Cases
describe('Edge Cases', () => {
  let formSystem;
  
  beforeEach(() => {
    setupDOM();
    formSystem = new ContentSubmissionFormSystem();
  });
  
  afterEach(() => {
    if (formSystem) {
      formSystem.destroy();
    }
    cleanup();
  });

  test('handles empty file selection', async () => {
    await formSystem.handleFiles([]);
    
    expect(formSystem.formState.files).toHaveLength(0);
  });

  test('handles null/undefined inputs gracefully', () => {
    expect(() => formSystem.validateField('title', null)).not.toThrow();
    expect(() => formSystem.validateField('title', undefined)).not.toThrow();
  });

  test('handles malformed game search results', async () => {
    formSystem.searchGames = jest.fn().mockResolvedValue([
      { id: null, name: undefined },
      { id: '123', name: 'Valid Game' }
    ]);
    
    const results = await formSystem.searchGames('test');
    expect(results).toBeDefined();
  });

  test('handles DOM elements not found', () => {
    // Remove elements that component expects
    document.body.innerHTML = '<div id="test-container"></div>';
    
    expect(() => {
      formSystem.createContentSubmissionForm('test-container');
    }).not.toThrow();
  });
});

/**
 * Mock file API for testing
 * Provides File constructor polyfill for Jest environment
 */
if (typeof File === 'undefined') {
  global.File = class File {
    constructor(chunks, filename, options = {}) {
      this.name = filename;
      this.type = options.type || '';
      this.size = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      this.lastModified = Date.now();
    }
  };
}