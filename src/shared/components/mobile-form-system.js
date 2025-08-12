/**
 * MLG.clan Mobile Form System
 * 
 * Comprehensive mobile form optimizations for gaming workflows
 * - Context-aware keyboard types
 * - Gaming-optimized touch interactions
 * - Mobile form validation with Xbox 360 styling
 * - Performance optimized for low-end devices
 */

class MLGMobileFormSystem {
  constructor() {
    this.isInitialized = false;
    this.activeForm = null;
    this.keyboardHeight = 0;
    this.formData = new Map();
    this.validationErrors = new Map();
    this.touchTargetMinSize = 48; // Minimum 48px touch targets
    
    // Gaming-specific keyboard configurations
    this.keyboardTypes = {
      'gaming-username': {
        inputmode: 'text',
        autocapitalize: 'off',
        autocorrect: 'off',
        spellcheck: false,
        pattern: '[a-zA-Z0-9_\\-]+',
        title: 'Gaming username (letters, numbers, underscore, dash only)'
      },
      'clan-name': {
        inputmode: 'text',
        autocapitalize: 'words',
        autocorrect: 'off',
        spellcheck: false,
        maxlength: 25,
        title: 'Clan name (max 25 characters)'
      },
      'token-amount': {
        inputmode: 'decimal',
        pattern: '[0-9]+(\\.[0-9]+)?',
        autocapitalize: 'off',
        autocorrect: 'off',
        spellcheck: false,
        title: 'Token amount (numbers and decimal only)'
      },
      'gaming-search': {
        inputmode: 'search',
        autocapitalize: 'off',
        autocorrect: 'on',
        spellcheck: true,
        title: 'Search gaming content'
      },
      'tournament-score': {
        inputmode: 'numeric',
        pattern: '[0-9]+',
        autocapitalize: 'off',
        autocorrect: 'off',
        spellcheck: false,
        title: 'Tournament score (numbers only)'
      }
    };

    this.init();
  }

  init() {
    if (this.isInitialized) return;

    this.setupKeyboardDetection();
    this.setupTouchOptimizations();
    this.setupFormValidation();
    this.setupPerformanceOptimizations();
    this.injectMobileFormStyles();

    this.isInitialized = true;
    console.log('🎮 MLG Mobile Form System initialized');
  }

  /**
   * Create a mobile-optimized gaming form
   */
  createGamingForm(config) {
    const {
      id,
      title,
      subtitle,
      fields,
      onSubmit,
      validationRules = {},
      className = '',
      gamingTheme = 'xbox360'
    } = config;

    const form = document.createElement('form');
    form.id = id;
    form.className = `mlg-mobile-form ${className} ${gamingTheme}-theme`;
    form.setAttribute('data-gaming-form', 'true');
    form.setAttribute('novalidate', 'true');

    // Form header
    if (title || subtitle) {
      const header = this.createFormHeader(title, subtitle);
      form.appendChild(header);
    }

    // Form fields container
    const fieldsContainer = document.createElement('div');
    fieldsContainer.className = 'form-fields-container';
    
    fields.forEach(fieldConfig => {
      const fieldElement = this.createFormField(fieldConfig);
      fieldsContainer.appendChild(fieldElement);
    });

    form.appendChild(fieldsContainer);

    // Form actions
    const actions = this.createFormActions(config.actions || []);
    form.appendChild(actions);

    // Setup form handlers
    this.setupFormHandlers(form, onSubmit, validationRules);

    return form;
  }

  /**
   * Create optimized form header
   */
  createFormHeader(title, subtitle) {
    const header = document.createElement('div');
    header.className = 'form-header mobile-optimized';
    
    header.innerHTML = `
      <div class="header-content">
        ${title ? `<h2 class="form-title">${title}</h2>` : ''}
        ${subtitle ? `<p class="form-subtitle">${subtitle}</p>` : ''}
      </div>
      <div class="xbox-accent-line"></div>
    `;

    return header;
  }

  /**
   * Create mobile-optimized form field
   */
  createFormField(config) {
    const {
      type = 'text',
      name,
      label,
      placeholder,
      required = false,
      gamingType = 'default',
      icon = '',
      helperText = '',
      value = ''
    } = config;

    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'mobile-form-field';
    fieldContainer.setAttribute('data-field-name', name);

    // Get keyboard configuration
    const keyboardConfig = this.keyboardTypes[gamingType] || {};

    const fieldHTML = `
      <div class="field-wrapper">
        ${label ? `
          <label for="${name}" class="field-label ${required ? 'required' : ''}">
            ${icon ? `<i class="field-icon" data-lucide="${icon}"></i>` : ''}
            <span class="label-text">${label}</span>
            ${required ? '<span class="required-indicator">*</span>' : ''}
          </label>
        ` : ''}
        
        <div class="input-wrapper">
          <input
            type="${type}"
            id="${name}"
            name="${name}"
            class="mobile-gaming-input"
            placeholder="${placeholder}"
            value="${value}"
            ${required ? 'required' : ''}
            ${Object.entries(keyboardConfig).map(([attr, val]) => 
              `${attr}="${val}"`
            ).join(' ')}
            data-gaming-type="${gamingType}"
          />
          <div class="input-accent-border"></div>
          <div class="validation-indicator"></div>
        </div>
        
        ${helperText ? `
          <div class="field-helper-text">${helperText}</div>
        ` : ''}
        
        <div class="field-error" style="display: none;"></div>
        <div class="field-success" style="display: none;"></div>
      </div>
    `;

    fieldContainer.innerHTML = fieldHTML;
    
    // Setup field interactivity
    this.setupFieldInteractivity(fieldContainer);

    return fieldContainer;
  }

  /**
   * Create form actions (buttons)
   */
  createFormActions(actions) {
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'form-actions mobile-optimized';

    actions.forEach(action => {
      const button = this.createGamingButton(action);
      actionsContainer.appendChild(button);
    });

    // Default submit button if no actions provided
    if (actions.length === 0) {
      const submitButton = this.createGamingButton({
        type: 'submit',
        text: 'Submit',
        variant: 'primary',
        icon: 'check'
      });
      actionsContainer.appendChild(submitButton);
    }

    return actionsContainer;
  }

  /**
   * Create mobile-optimized gaming button
   */
  createGamingButton(config) {
    const {
      type = 'button',
      text,
      variant = 'primary',
      icon = '',
      disabled = false,
      onClick,
      className = ''
    } = config;

    const button = document.createElement('button');
    button.type = type;
    button.className = `gaming-button mobile-touch-optimized ${variant} ${className}`;
    button.disabled = disabled;

    button.innerHTML = `
      <div class="button-content">
        ${icon ? `<i class="button-icon" data-lucide="${icon}"></i>` : ''}
        <span class="button-text">${text}</span>
      </div>
      <div class="button-glow"></div>
      <div class="button-press-effect"></div>
    `;

    if (onClick) {
      button.addEventListener('click', onClick);
    }

    // Touch feedback
    this.addTouchFeedback(button);

    return button;
  }

  /**
   * Setup field interactivity and keyboard management
   */
  setupFieldInteractivity(fieldContainer) {
    const input = fieldContainer.querySelector('input');
    const gamingType = input.getAttribute('data-gaming-type');

    // Focus management for mobile
    input.addEventListener('focus', (e) => {
      this.handleInputFocus(e, fieldContainer);
    });

    input.addEventListener('blur', (e) => {
      this.handleInputBlur(e, fieldContainer);
    });

    // Real-time validation
    input.addEventListener('input', (e) => {
      this.handleInputChange(e, fieldContainer);
    });

    // Gaming-specific input helpers
    if (gamingType === 'token-amount') {
      this.setupTokenAmountHelper(input);
    } else if (gamingType === 'gaming-username') {
      this.setupUsernameHelper(input);
    }
  }

  /**
   * Handle input focus with keyboard management
   */
  handleInputFocus(event, fieldContainer) {
    const input = event.target;
    const gamingType = input.getAttribute('data-gaming-type');

    // Add focused state
    fieldContainer.classList.add('focused');
    
    // Store active form reference
    this.activeForm = input.closest('form');

    // Keyboard height compensation
    this.compensateForKeyboard(fieldContainer);

    // Gaming type specific focus handling
    if (gamingType === 'token-amount') {
      this.showTokenBalanceHelper(input);
    }

    // Accessibility announcement
    this.announceFieldFocus(input);
  }

  /**
   * Handle input blur
   */
  handleInputBlur(event, fieldContainer) {
    const input = event.target;

    // Remove focused state
    fieldContainer.classList.remove('focused');

    // Validate field on blur
    this.validateField(input);

    // Hide helpers
    this.hideInputHelpers();
  }

  /**
   * Handle input changes with gaming-specific logic
   */
  handleInputChange(event, fieldContainer) {
    const input = event.target;
    const gamingType = input.getAttribute('data-gaming-type');

    // Real-time validation
    this.validateFieldRealTime(input);

    // Gaming-specific input processing
    if (gamingType === 'gaming-username') {
      this.processGamingUsername(input);
    } else if (gamingType === 'token-amount') {
      this.processTokenAmount(input);
    }
  }

  /**
   * Setup token amount input helper
   */
  setupTokenAmountHelper(input) {
    // Add token type selector if not present
    const wrapper = input.closest('.input-wrapper');
    if (!wrapper.querySelector('.token-selector')) {
      const tokenSelector = document.createElement('div');
      tokenSelector.className = 'token-selector';
      tokenSelector.innerHTML = `
        <button type="button" class="token-type-btn active" data-token="MLG">
          <span class="token-icon">🎮</span>
          <span class="token-name">MLG</span>
        </button>
      `;
      wrapper.appendChild(tokenSelector);
    }

    // Add max button for token inputs
    if (!wrapper.querySelector('.max-button')) {
      const maxButton = document.createElement('button');
      maxButton.type = 'button';
      maxButton.className = 'max-button';
      maxButton.textContent = 'MAX';
      maxButton.addEventListener('click', () => {
        this.setMaxTokenAmount(input);
      });
      wrapper.appendChild(maxButton);
    }
  }

  /**
   * Setup username input helper
   */
  setupUsernameHelper(input) {
    // Add username availability checker
    let debounceTimer;
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.checkUsernameAvailability(input);
      }, 500);
    });
  }

  /**
   * Keyboard height compensation
   */
  compensateForKeyboard(fieldContainer) {
    // Detect keyboard height on mobile
    const viewport = window.visualViewport;
    if (viewport) {
      const handleViewportChange = () => {
        this.keyboardHeight = window.innerHeight - viewport.height;
        
        if (this.keyboardHeight > 100) { // Keyboard is likely open
          this.adjustFormForKeyboard(fieldContainer);
        } else {
          this.resetFormPosition();
        }
      };

      viewport.addEventListener('resize', handleViewportChange);
      
      // Cleanup function
      setTimeout(() => {
        viewport.removeEventListener('resize', handleViewportChange);
      }, 10000);
    }
  }

  /**
   * Adjust form position for keyboard
   */
  adjustFormForKeyboard(fieldContainer) {
    const form = fieldContainer.closest('form');
    if (!form) return;

    // Scroll field into view
    fieldContainer.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });

    // Adjust form padding to accommodate keyboard
    form.style.paddingBottom = `${this.keyboardHeight}px`;
  }

  /**
   * Reset form position
   */
  resetFormPosition() {
    if (this.activeForm) {
      this.activeForm.style.paddingBottom = '';
    }
  }

  /**
   * Gaming username processing
   */
  processGamingUsername(input) {
    let value = input.value;
    
    // Remove invalid characters for gaming usernames
    value = value.replace(/[^a-zA-Z0-9_\-]/g, '');
    
    // Enforce max length
    if (value.length > 20) {
      value = value.substring(0, 20);
    }

    if (value !== input.value) {
      input.value = value;
    }
  }

  /**
   * Token amount processing
   */
  processTokenAmount(input) {
    let value = input.value;
    
    // Remove invalid characters for token amounts
    value = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }

    if (value !== input.value) {
      input.value = value;
    }

    // Update token amount display
    this.updateTokenAmountDisplay(input, value);
  }

  /**
   * Set maximum token amount
   */
  setMaxTokenAmount(input) {
    // This would connect to wallet balance
    const maxBalance = 1250; // Example balance
    input.value = maxBalance.toString();
    this.updateTokenAmountDisplay(input, maxBalance);
  }

  /**
   * Update token amount display
   */
  updateTokenAmountDisplay(input, amount) {
    const wrapper = input.closest('.input-wrapper');
    let display = wrapper.querySelector('.token-amount-display');
    
    if (!display) {
      display = document.createElement('div');
      display.className = 'token-amount-display';
      wrapper.appendChild(display);
    }

    const numericAmount = parseFloat(amount) || 0;
    display.innerHTML = `
      <div class="amount-info">
        <span class="amount-value">${numericAmount.toLocaleString()}</span>
        <span class="amount-label">MLG Tokens</span>
      </div>
      <div class="amount-usd">≈ $${(numericAmount * 0.15).toFixed(2)} USD</div>
    `;
  }

  /**
   * Check username availability
   */
  async checkUsernameAvailability(input) {
    const username = input.value.trim();
    if (username.length < 3) return;

    const fieldContainer = input.closest('.mobile-form-field');
    const indicator = fieldContainer.querySelector('.validation-indicator');
    
    indicator.className = 'validation-indicator checking';
    indicator.innerHTML = '<div class="spinner"></div>';

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      const isAvailable = Math.random() > 0.3; // 70% available

      if (isAvailable) {
        this.showFieldSuccess(input, 'Username is available!');
      } else {
        this.showFieldError(input, 'Username is already taken');
      }
    } catch (error) {
      this.showFieldError(input, 'Could not check availability');
    }
  }

  /**
   * Real-time field validation
   */
  validateFieldRealTime(input) {
    const value = input.value.trim();
    const gamingType = input.getAttribute('data-gaming-type');

    // Clear previous validation state
    this.clearFieldValidation(input);

    if (!value && input.required) {
      return; // Don't show error while typing required field
    }

    // Gaming-specific validation
    if (gamingType === 'gaming-username' && value) {
      if (value.length < 3) {
        this.showFieldError(input, 'Username must be at least 3 characters');
      } else if (!/^[a-zA-Z0-9_\-]+$/.test(value)) {
        this.showFieldError(input, 'Only letters, numbers, underscore, and dash allowed');
      }
    }

    if (gamingType === 'token-amount' && value) {
      const amount = parseFloat(value);
      if (isNaN(amount) || amount < 0) {
        this.showFieldError(input, 'Enter a valid token amount');
      } else if (amount > 1000000) {
        this.showFieldError(input, 'Amount too large');
      }
    }
  }

  /**
   * Validate field on blur
   */
  validateField(input) {
    const value = input.value.trim();
    
    if (input.required && !value) {
      this.showFieldError(input, 'This field is required');
      return false;
    }

    return true;
  }

  /**
   * Show field error
   */
  showFieldError(input, message) {
    const fieldContainer = input.closest('.mobile-form-field');
    const errorElement = fieldContainer.querySelector('.field-error');
    const indicator = fieldContainer.querySelector('.validation-indicator');
    
    fieldContainer.classList.add('has-error');
    fieldContainer.classList.remove('has-success');
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    indicator.className = 'validation-indicator error';
    indicator.innerHTML = '<i data-lucide="x-circle"></i>';

    // Gaming-style error animation
    input.classList.add('error-shake');
    setTimeout(() => {
      input.classList.remove('error-shake');
    }, 600);
  }

  /**
   * Show field success
   */
  showFieldSuccess(input, message) {
    const fieldContainer = input.closest('.mobile-form-field');
    const successElement = fieldContainer.querySelector('.field-success');
    const indicator = fieldContainer.querySelector('.validation-indicator');
    
    fieldContainer.classList.add('has-success');
    fieldContainer.classList.remove('has-error');
    
    successElement.textContent = message;
    successElement.style.display = 'block';
    
    indicator.className = 'validation-indicator success';
    indicator.innerHTML = '<i data-lucide="check-circle"></i>';
  }

  /**
   * Clear field validation
   */
  clearFieldValidation(input) {
    const fieldContainer = input.closest('.mobile-form-field');
    
    fieldContainer.classList.remove('has-error', 'has-success');
    fieldContainer.querySelector('.field-error').style.display = 'none';
    fieldContainer.querySelector('.field-success').style.display = 'none';
    
    const indicator = fieldContainer.querySelector('.validation-indicator');
    indicator.className = 'validation-indicator';
    indicator.innerHTML = '';
  }

  /**
   * Add touch feedback to buttons
   */
  addTouchFeedback(button) {
    button.addEventListener('touchstart', (e) => {
      button.classList.add('touch-active');
    });

    button.addEventListener('touchend', (e) => {
      setTimeout(() => {
        button.classList.remove('touch-active');
      }, 150);
    });

    // Prevent double-tap zoom on buttons
    button.addEventListener('touchend', (e) => {
      e.preventDefault();
    });
  }

  /**
   * Setup form submission handlers
   */
  setupFormHandlers(form, onSubmit, validationRules) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (await this.validateForm(form, validationRules)) {
        const formData = this.getFormData(form);
        
        if (onSubmit) {
          try {
            await onSubmit(formData, form);
          } catch (error) {
            this.showFormError(form, 'Submission failed. Please try again.');
          }
        }
      }
    });
  }

  /**
   * Validate entire form
   */
  async validateForm(form, validationRules) {
    const inputs = form.querySelectorAll('input[required], input[data-gaming-type]');
    let isValid = true;

    for (const input of inputs) {
      if (!this.validateField(input)) {
        isValid = false;
      }
    }

    return isValid;
  }

  /**
   * Get form data
   */
  getFormData(form) {
    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }

    return data;
  }

  /**
   * Show form-level error
   */
  showFormError(form, message) {
    // Create or update form error display
    let errorDisplay = form.querySelector('.form-error-display');
    if (!errorDisplay) {
      errorDisplay = document.createElement('div');
      errorDisplay.className = 'form-error-display';
      form.insertBefore(errorDisplay, form.firstChild);
    }

    errorDisplay.innerHTML = `
      <div class="error-content">
        <i data-lucide="alert-triangle"></i>
        <span>${message}</span>
      </div>
    `;
    errorDisplay.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorDisplay.style.display = 'none';
    }, 5000);
  }

  /**
   * Accessibility announcements
   */
  announceFieldFocus(input) {
    const announcement = input.getAttribute('title') || 
                       input.getAttribute('placeholder') || 
                       'Form field focused';
    
    // Create hidden announcement for screen readers
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = announcement;
    
    document.body.appendChild(announcer);
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }

  /**
   * Setup keyboard detection
   */
  setupKeyboardDetection() {
    // Detect keyboard open/close for better UX
    const initialViewportHeight = window.innerHeight;
    
    window.addEventListener('resize', () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialViewportHeight - currentHeight;
      
      if (heightDifference > 150) {
        document.body.classList.add('keyboard-open');
        this.keyboardHeight = heightDifference;
      } else {
        document.body.classList.remove('keyboard-open');
        this.keyboardHeight = 0;
      }
    });
  }

  /**
   * Setup touch optimizations
   */
  setupTouchOptimizations() {
    // Increase touch targets that are too small
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.optimizeTouchTargets(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Optimize touch targets
   */
  optimizeTouchTargets(element) {
    const touchables = element.querySelectorAll('button, input, select, textarea, a[href]');
    
    touchables.forEach(el => {
      const rect = el.getBoundingClientRect();
      
      if (rect.width < this.touchTargetMinSize || rect.height < this.touchTargetMinSize) {
        el.classList.add('touch-target-enhanced');
      }
    });
  }

  /**
   * Setup performance optimizations
   */
  setupPerformanceOptimizations() {
    // Debounce input validations
    this.debounceValidation = this.debounce((input) => {
      this.validateFieldRealTime(input);
    }, 300);

    // Optimize scroll performance
    let ticking = false;
    const optimizeScroll = () => {
      if (this.activeForm && this.keyboardHeight > 0) {
        this.adjustFormForKeyboard(this.activeForm.querySelector('.focused'));
      }
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(optimizeScroll);
        ticking = true;
      }
    }, { passive: true });
  }

  /**
   * Debounce utility
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Hide input helpers
   */
  hideInputHelpers() {
    document.querySelectorAll('.token-balance-helper, .username-suggestions').forEach(el => {
      el.style.display = 'none';
    });
  }

  /**
   * Show token balance helper
   */
  showTokenBalanceHelper(input) {
    const wrapper = input.closest('.input-wrapper');
    let helper = wrapper.querySelector('.token-balance-helper');
    
    if (!helper) {
      helper = document.createElement('div');
      helper.className = 'token-balance-helper';
      helper.innerHTML = `
        <div class="balance-info">
          <span class="balance-label">Available Balance:</span>
          <span class="balance-amount">1,250 MLG</span>
        </div>
      `;
      wrapper.appendChild(helper);
    }
    
    helper.style.display = 'block';
  }

  /**
   * Inject mobile form styles
   */
  injectMobileFormStyles() {
    if (document.querySelector('#mlg-mobile-form-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'mlg-mobile-form-styles';
    styles.textContent = `
      /* MLG Mobile Form System Styles */
      .mlg-mobile-form {
        max-width: 100%;
        margin: 0 auto;
        padding: 1rem;
        background: linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(10, 10, 15, 0.98) 100%);
        border-radius: 12px;
        border: 1px solid rgba(0, 255, 136, 0.2);
        backdrop-filter: blur(10px);
      }

      .mlg-mobile-form.xbox360-theme {
        background: linear-gradient(135deg, rgba(15, 15, 15, 0.95) 0%, rgba(25, 25, 25, 0.98) 100%);
        border: 2px solid rgba(0, 255, 136, 0.3);
        box-shadow: 0 0 20px rgba(0, 255, 136, 0.1);
      }

      .form-header.mobile-optimized {
        text-align: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid rgba(0, 255, 136, 0.2);
      }

      .form-title {
        font-size: 1.5rem;
        font-weight: bold;
        color: #00ff88;
        margin-bottom: 0.5rem;
        text-shadow: 0 0 10px rgba(0, 255, 136, 0.3);
      }

      .form-subtitle {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.9rem;
      }

      .xbox-accent-line {
        height: 2px;
        background: linear-gradient(90deg, transparent, #00ff88, transparent);
        margin-top: 1rem;
        border-radius: 1px;
      }

      .mobile-form-field {
        margin-bottom: 1.5rem;
      }

      .field-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        color: rgba(255, 255, 255, 0.9);
        font-weight: 500;
        font-size: 0.9rem;
      }

      .field-label.required .required-indicator {
        color: #ff4444;
        font-weight: bold;
      }

      .field-icon {
        width: 16px;
        height: 16px;
        color: #00ff88;
      }

      .input-wrapper {
        position: relative;
      }

      .mobile-gaming-input {
        width: 100%;
        min-height: 48px; /* Touch target requirement */
        padding: 12px 16px;
        background: rgba(0, 0, 0, 0.3);
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: white;
        font-size: 16px; /* Prevent zoom on iOS */
        transition: all 0.3s ease;
        outline: none;
      }

      .mobile-gaming-input:focus {
        border-color: #00ff88;
        box-shadow: 0 0 0 3px rgba(0, 255, 136, 0.1);
        background: rgba(0, 0, 0, 0.5);
      }

      .mobile-gaming-input::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }

      .input-accent-border {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 2px;
        width: 0;
        background: linear-gradient(90deg, #00ff88, #00ffff);
        transition: width 0.3s ease;
        border-radius: 1px;
      }

      .mobile-form-field.focused .input-accent-border {
        width: 100%;
      }

      .validation-indicator {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .validation-indicator.checking {
        color: #fbbf24;
      }

      .validation-indicator.success {
        color: #00ff88;
      }

      .validation-indicator.error {
        color: #ff4444;
      }

      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(251, 191, 36, 0.2);
        border-top: 2px solid #fbbf24;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .field-error,
      .field-success {
        margin-top: 0.5rem;
        padding: 0.5rem;
        border-radius: 6px;
        font-size: 0.8rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .field-error {
        background: rgba(255, 68, 68, 0.1);
        border: 1px solid rgba(255, 68, 68, 0.3);
        color: #ff4444;
      }

      .field-success {
        background: rgba(0, 255, 136, 0.1);
        border: 1px solid rgba(0, 255, 136, 0.3);
        color: #00ff88;
      }

      .mobile-form-field.has-error .mobile-gaming-input {
        border-color: #ff4444;
        box-shadow: 0 0 0 3px rgba(255, 68, 68, 0.1);
      }

      .mobile-form-field.has-success .mobile-gaming-input {
        border-color: #00ff88;
        box-shadow: 0 0 0 3px rgba(0, 255, 136, 0.1);
      }

      .error-shake {
        animation: shake 0.6s ease-in-out;
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }

      .form-actions.mobile-optimized {
        margin-top: 2rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .gaming-button.mobile-touch-optimized {
        min-height: 48px;
        padding: 12px 24px;
        background: linear-gradient(135deg, #00ff88, #00cc6a);
        border: none;
        border-radius: 8px;
        color: black;
        font-weight: bold;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
        outline: none;
      }

      .gaming-button.mobile-touch-optimized:active,
      .gaming-button.mobile-touch-optimized.touch-active {
        transform: scale(0.95);
        box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
      }

      .gaming-button.mobile-touch-optimized.secondary {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .button-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        position: relative;
        z-index: 1;
      }

      .button-glow {
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 204, 106, 0.1));
        opacity: 0;
        transition: opacity 0.3s ease;
        border-radius: 8px;
      }

      .gaming-button.mobile-touch-optimized:hover .button-glow,
      .gaming-button.mobile-touch-optimized:focus .button-glow {
        opacity: 1;
      }

      .button-press-effect {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
        opacity: 0;
        transform: scale(0);
        transition: all 0.3s ease;
        border-radius: 8px;
      }

      .gaming-button.mobile-touch-optimized:active .button-press-effect,
      .gaming-button.mobile-touch-optimized.touch-active .button-press-effect {
        opacity: 1;
        transform: scale(1);
      }

      .token-selector {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }

      .token-type-btn {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        color: white;
        font-size: 0.8rem;
        transition: all 0.3s ease;
      }

      .token-type-btn.active {
        background: rgba(0, 255, 136, 0.2);
        border-color: #00ff88;
        color: #00ff88;
      }

      .max-button {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        padding: 0.25rem 0.5rem;
        background: rgba(0, 255, 136, 0.2);
        border: 1px solid #00ff88;
        border-radius: 4px;
        color: #00ff88;
        font-size: 0.7rem;
        font-weight: bold;
        transition: all 0.3s ease;
      }

      .max-button:active {
        background: rgba(0, 255, 136, 0.3);
        transform: translateY(-50%) scale(0.95);
      }

      .token-amount-display {
        margin-top: 0.5rem;
        padding: 0.5rem;
        background: rgba(0, 255, 136, 0.05);
        border: 1px solid rgba(0, 255, 136, 0.2);
        border-radius: 6px;
      }

      .amount-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .amount-value {
        font-weight: bold;
        color: #00ff88;
      }

      .amount-label {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.8rem;
      }

      .amount-usd {
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.7rem;
        text-align: right;
      }

      .token-balance-helper {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: 0.5rem;
        padding: 0.5rem;
        background: rgba(0, 0, 0, 0.9);
        border: 1px solid rgba(0, 255, 136, 0.3);
        border-radius: 6px;
        z-index: 10;
      }

      .balance-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .balance-label {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.8rem;
      }

      .balance-amount {
        color: #00ff88;
        font-weight: bold;
        font-size: 0.9rem;
      }

      .form-error-display {
        margin-bottom: 1rem;
        padding: 1rem;
        background: rgba(255, 68, 68, 0.1);
        border: 1px solid rgba(255, 68, 68, 0.3);
        border-radius: 8px;
        color: #ff4444;
      }

      .error-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      /* Touch target enhancements */
      .touch-target-enhanced {
        min-width: 48px !important;
        min-height: 48px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }

      /* Keyboard open adjustments */
      body.keyboard-open .mlg-mobile-form {
        padding-bottom: 2rem;
      }

      /* Screen reader only */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      /* Media queries for different screen sizes */
      @media (max-width: 480px) {
        .mlg-mobile-form {
          padding: 0.75rem;
          margin: 0.5rem;
          border-radius: 8px;
        }

        .form-title {
          font-size: 1.25rem;
        }

        .mobile-gaming-input {
          font-size: 16px; /* Prevent zoom */
          padding: 14px 16px;
        }

        .gaming-button.mobile-touch-optimized {
          min-height: 52px;
          font-size: 1.1rem;
        }
      }

      @media (orientation: landscape) and (max-height: 500px) {
        .form-header.mobile-optimized {
          margin-bottom: 1rem;
        }

        .mobile-form-field {
          margin-bottom: 1rem;
        }

        .form-actions.mobile-optimized {
          margin-top: 1rem;
        }
      }

      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .mobile-gaming-input {
          border-width: 3px;
        }

        .gaming-button.mobile-touch-optimized {
          border: 2px solid #00ff88;
        }
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .mobile-gaming-input,
        .gaming-button.mobile-touch-optimized,
        .validation-indicator {
          transition: none;
        }

        .error-shake {
          animation: none;
        }

        .spinner {
          animation: none;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  /**
   * Destroy the mobile form system
   */
  destroy() {
    this.isInitialized = false;
    this.activeForm = null;
    this.formData.clear();
    this.validationErrors.clear();
    
    // Remove styles
    const styles = document.querySelector('#mlg-mobile-form-styles');
    if (styles) {
      styles.remove();
    }
  }
}

// Global instance
window.MLGMobileFormSystem = new MLGMobileFormSystem();

export default MLGMobileFormSystem;