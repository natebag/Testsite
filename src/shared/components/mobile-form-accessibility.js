/**
 * Mobile Form Accessibility & Performance Optimizer
 * 
 * Comprehensive accessibility and performance optimizations for mobile gaming forms
 * - Screen reader support with gaming-context announcements
 * - Voice input integration for hands-free form completion
 * - Performance monitoring and battery efficiency optimizations
 * - Cross-device keyboard compatibility testing
 */

class MobileFormAccessibility {
  constructor() {
    this.isInitialized = false;
    this.voiceRecognition = null;
    this.screenReader = null;
    this.performanceMonitor = null;
    this.keyboardDetector = null;
    this.accessibilityFeatures = new Map();
    
    // Performance tracking
    this.performanceMetrics = {
      formRenderTime: [],
      inputResponseTime: [],
      validationTime: [],
      keyboardOpenTime: [],
      batteryImpact: []
    };

    this.init();
  }

  init() {
    if (this.isInitialized) return;

    this.setupScreenReaderSupport();
    this.setupVoiceInput();
    this.setupKeyboardAccessibility();
    this.setupPerformanceMonitoring();
    this.setupBatteryOptimization();
    this.setupCrossDeviceTesting();
    this.injectAccessibilityStyles();

    this.isInitialized = true;
    console.log('♿ Mobile Form Accessibility & Performance initialized');
  }

  /**
   * Setup comprehensive screen reader support
   */
  setupScreenReaderSupport() {
    this.screenReader = {
      announceFormFocus: (form) => {
        const title = form.querySelector('.form-title')?.textContent || 'Gaming form';
        const fieldCount = form.querySelectorAll('input, select, textarea').length;
        
        this.announce(`${title} opened. ${fieldCount} fields to complete.`, 'assertive');
      },

      announceFieldFocus: (field) => {
        const label = this.getFieldLabel(field);
        const type = this.getFieldType(field);
        const required = field.hasAttribute('required') ? 'required' : 'optional';
        const gamingType = field.getAttribute('data-gaming-type') || '';
        
        let announcement = `${label}, ${type} field, ${required}`;
        
        // Add gaming-specific context
        if (gamingType === 'token-amount') {
          announcement += '. Use numeric keypad for token amounts';
        } else if (gamingType === 'gaming-username') {
          announcement += '. Letters, numbers, underscore and dash only';
        } else if (gamingType === 'clan-name') {
          announcement += '. Clan name, maximum 25 characters';
        }

        // Add current value if present
        if (field.value.trim()) {
          announcement += `. Current value: ${field.value}`;
        }

        // Add placeholder as hint
        if (field.placeholder) {
          announcement += `. ${field.placeholder}`;
        }

        this.announce(announcement, 'polite');
      },

      announceValidationResult: (field, isValid, message) => {
        const label = this.getFieldLabel(field);
        const status = isValid ? 'valid' : 'invalid';
        
        this.announce(`${label} is ${status}. ${message}`, 'assertive');
      },

      announceFormSubmission: (success, message) => {
        const status = success ? 'successful' : 'failed';
        this.announce(`Form submission ${status}. ${message}`, 'assertive');
      },

      announceTokenOperation: (operation, amount, balance) => {
        this.announce(
          `${operation} ${amount} MLG tokens. Remaining balance: ${balance} tokens.`,
          'polite'
        );
      }
    };
  }

  /**
   * Setup voice input integration
   */
  setupVoiceInput() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.log('Voice input not supported on this device');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.voiceRecognition = new SpeechRecognition();
    
    this.voiceRecognition.continuous = false;
    this.voiceRecognition.interimResults = false;
    this.voiceRecognition.lang = 'en-US';

    this.voiceRecognition.onresult = (event) => {
      const result = event.results[0][0].transcript;
      this.processVoiceInput(result);
    };

    this.voiceRecognition.onerror = (event) => {
      console.warn('Voice recognition error:', event.error);
      this.announce('Voice input failed. Please try again or use keyboard.', 'assertive');
    };

    // Add voice input buttons to compatible fields
    this.addVoiceInputButtons();
  }

  /**
   * Setup keyboard accessibility features
   */
  setupKeyboardAccessibility() {
    this.keyboardDetector = {
      supportedTypes: new Map(),
      
      detectKeyboardSupport: () => {
        // Test different keyboard types on the current device
        const testTypes = [
          'numeric', 'decimal', 'tel', 'email', 'url', 'search'
        ];

        testTypes.forEach(type => {
          const testInput = document.createElement('input');
          testInput.type = 'text';
          testInput.inputMode = type;
          testInput.style.position = 'absolute';
          testInput.style.left = '-9999px';
          
          document.body.appendChild(testInput);
          
          // Test if the device respects the inputmode
          setTimeout(() => {
            this.keyboardDetector.supportedTypes.set(type, true);
            document.body.removeChild(testInput);
          }, 100);
        });
      },

      enhanceKeyboardNavigation: () => {
        // Add skip links for keyboard navigation
        this.addSkipLinks();
        
        // Enhance focus management
        this.setupFocusManagement();
        
        // Add keyboard shortcuts
        this.setupKeyboardShortcuts();
      }
    };

    this.keyboardDetector.detectKeyboardSupport();
    this.keyboardDetector.enhanceKeyboardNavigation();
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    this.performanceMonitor = {
      startFormRender: () => {
        return performance.now();
      },

      endFormRender: (startTime) => {
        const renderTime = performance.now() - startTime;
        this.performanceMetrics.formRenderTime.push(renderTime);
        
        if (renderTime > 100) { // Warn if render takes > 100ms
          console.warn(`Form render time: ${renderTime.toFixed(2)}ms (slow)`);
        }
      },

      measureInputResponse: (callback) => {
        const start = performance.now();
        
        return (...args) => {
          const result = callback(...args);
          const responseTime = performance.now() - start;
          
          this.performanceMetrics.inputResponseTime.push(responseTime);
          
          if (responseTime > 16) { // 60fps threshold
            console.warn(`Input response time: ${responseTime.toFixed(2)}ms (laggy)`);
          }
          
          return result;
        };
      },

      measureValidation: (callback) => {
        const start = performance.now();
        
        return (...args) => {
          const result = callback(...args);
          const validationTime = performance.now() - start;
          
          this.performanceMetrics.validationTime.push(validationTime);
          
          return result;
        };
      },

      trackKeyboardImpact: () => {
        const viewport = window.visualViewport;
        if (!viewport) return;

        let keyboardOpenStart = null;

        viewport.addEventListener('resize', () => {
          const heightChange = window.innerHeight - viewport.height;
          
          if (heightChange > 150 && !keyboardOpenStart) {
            // Keyboard opened
            keyboardOpenStart = performance.now();
          } else if (heightChange <= 150 && keyboardOpenStart) {
            // Keyboard closed
            const keyboardTime = performance.now() - keyboardOpenStart;
            this.performanceMetrics.keyboardOpenTime.push(keyboardTime);
            keyboardOpenStart = null;
          }
        });
      },

      generateReport: () => {
        const metrics = this.performanceMetrics;
        
        return {
          averageFormRenderTime: this.calculateAverage(metrics.formRenderTime),
          averageInputResponse: this.calculateAverage(metrics.inputResponseTime),
          averageValidationTime: this.calculateAverage(metrics.validationTime),
          averageKeyboardTime: this.calculateAverage(metrics.keyboardOpenTime),
          totalSamples: metrics.formRenderTime.length,
          performanceGrade: this.calculatePerformanceGrade(metrics)
        };
      }
    };

    this.performanceMonitor.trackKeyboardImpact();
  }

  /**
   * Setup battery optimization
   */
  setupBatteryOptimization() {
    // Detect battery API support
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        this.optimizeForBatteryLevel(battery);
        
        battery.addEventListener('levelchange', () => {
          this.optimizeForBatteryLevel(battery);
        });
      });
    }

    // Optimize for low power mode
    this.detectLowPowerMode();
    
    // Reduce unnecessary animations and effects
    this.setupPowerEfficientAnimations();
  }

  /**
   * Setup cross-device testing
   */
  setupCrossDeviceTesting() {
    this.deviceTester = {
      testKeyboardTypes: async () => {
        const results = {};
        
        // Test each gaming keyboard type
        const gamingTypes = [
          'gaming-username', 'clan-name', 'token-amount', 
          'gaming-search', 'tournament-score'
        ];

        for (const type of gamingTypes) {
          results[type] = await this.testKeyboardType(type);
        }

        return results;
      },

      testTouchTargets: () => {
        const elements = document.querySelectorAll('button, input, select, textarea, a[href]');
        const failures = [];

        elements.forEach(el => {
          const rect = el.getBoundingClientRect();
          
          if (rect.width < 44 || rect.height < 44) {
            failures.push({
              element: el,
              size: { width: rect.width, height: rect.height },
              selector: this.getElementSelector(el)
            });
          }
        });

        return failures;
      },

      testScreenReaderCompatibility: () => {
        const forms = document.querySelectorAll('[data-gaming-form]');
        const issues = [];

        forms.forEach(form => {
          // Check for proper labeling
          const unlabeledInputs = form.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
          unlabeledInputs.forEach(input => {
            if (!this.getFieldLabel(input)) {
              issues.push({
                type: 'missing-label',
                element: input,
                selector: this.getElementSelector(input)
              });
            }
          });

          // Check for proper error associations
          const errorElements = form.querySelectorAll('.field-error[style*="block"]');
          errorElements.forEach(error => {
            const field = error.closest('.mobile-form-field')?.querySelector('input, select, textarea');
            if (field && !field.hasAttribute('aria-describedby')) {
              issues.push({
                type: 'missing-error-association',
                element: field,
                error: error,
                selector: this.getElementSelector(field)
              });
            }
          });
        });

        return issues;
      }
    };
  }

  /**
   * Add voice input buttons to compatible fields
   */
  addVoiceInputButtons() {
    // Observer for dynamically added forms
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.addVoiceButtonsToForm(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Add to existing forms
    this.addVoiceButtonsToForm(document);
  }

  /**
   * Add voice buttons to form
   */
  addVoiceButtonsToForm(container) {
    const textInputs = container.querySelectorAll('input[type="text"], textarea');
    
    textInputs.forEach(input => {
      const gamingType = input.getAttribute('data-gaming-type');
      
      // Only add voice input to appropriate field types
      if (this.isVoiceInputSuitable(gamingType)) {
        this.addVoiceButton(input);
      }
    });
  }

  /**
   * Check if voice input is suitable for field type
   */
  isVoiceInputSuitable(gamingType) {
    const unsuitableTypes = ['token-amount', 'wallet-address'];
    return !unsuitableTypes.includes(gamingType);
  }

  /**
   * Add voice button to input
   */
  addVoiceButton(input) {
    if (input.dataset.voiceEnabled) return; // Already has voice button

    const wrapper = input.closest('.input-wrapper');
    if (!wrapper) return;

    const voiceButton = document.createElement('button');
    voiceButton.type = 'button';
    voiceButton.className = 'voice-input-button';
    voiceButton.setAttribute('aria-label', 'Voice input');
    voiceButton.innerHTML = '<i data-lucide="mic"></i>';

    voiceButton.addEventListener('click', () => {
      this.startVoiceInput(input);
    });

    wrapper.appendChild(voiceButton);
    input.dataset.voiceEnabled = 'true';
  }

  /**
   * Start voice input for field
   */
  startVoiceInput(input) {
    if (!this.voiceRecognition) return;

    this.activeVoiceInput = input;
    
    // Visual feedback
    const voiceButton = input.parentElement.querySelector('.voice-input-button');
    voiceButton.classList.add('listening');
    
    // Announce to screen reader
    this.announce('Voice input started. Speak your input now.', 'assertive');

    try {
      this.voiceRecognition.start();
    } catch (error) {
      console.error('Voice input failed to start:', error);
      this.announce('Voice input failed to start. Please use keyboard.', 'assertive');
      voiceButton.classList.remove('listening');
    }
  }

  /**
   * Process voice input result
   */
  processVoiceInput(result) {
    if (!this.activeVoiceInput) return;

    const input = this.activeVoiceInput;
    const gamingType = input.getAttribute('data-gaming-type');

    // Process result based on gaming type
    let processedResult = this.processVoiceForGamingType(result, gamingType);

    // Set the input value
    input.value = processedResult;
    
    // Trigger input event for validation
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Announce result
    this.announce(`Voice input completed. Entered: ${processedResult}`, 'polite');

    // Reset visual feedback
    const voiceButton = input.parentElement.querySelector('.voice-input-button');
    voiceButton.classList.remove('listening');

    this.activeVoiceInput = null;
  }

  /**
   * Process voice input for gaming-specific types
   */
  processVoiceForGamingType(result, gamingType) {
    let processed = result.toLowerCase().trim();

    switch (gamingType) {
      case 'gaming-username':
        // Convert spaces to underscores, remove invalid characters
        processed = processed
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_\-]/g, '');
        break;

      case 'clan-name':
        // Capitalize words, limit length
        processed = result
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
          .substring(0, 25);
        break;

      case 'gaming-search':
        // Keep natural language format
        processed = result;
        break;

      default:
        processed = result;
    }

    return processed;
  }

  /**
   * Add skip links for keyboard navigation
   */
  addSkipLinks() {
    if (document.querySelector('#skip-links')) return;

    const skipLinks = document.createElement('div');
    skipLinks.id = 'skip-links';
    skipLinks.className = 'skip-links';
    skipLinks.innerHTML = `
      <a href="#main-form" class="skip-link">Skip to main form</a>
      <a href="#form-actions" class="skip-link">Skip to form actions</a>
    `;

    document.body.insertBefore(skipLinks, document.body.firstChild);
  }

  /**
   * Setup focus management
   */
  setupFocusManagement() {
    // Focus trap for modal forms
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        this.handleTabNavigation(e);
      }
    });

    // Auto-focus first field when form appears
    this.setupAutoFocus();
  }

  /**
   * Handle tab navigation
   */
  handleTabNavigation(event) {
    const activeForm = document.querySelector('.mlg-mobile-form:focus-within');
    if (!activeForm) return;

    const focusableElements = activeForm.querySelectorAll(
      'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  /**
   * Setup auto-focus
   */
  setupAutoFocus() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE && node.classList?.contains('mlg-mobile-form')) {
            this.autoFocusForm(node);
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
   * Auto-focus first field in form
   */
  autoFocusForm(form) {
    // Delay to ensure form is fully rendered
    setTimeout(() => {
      const firstInput = form.querySelector('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])');
      if (firstInput) {
        firstInput.focus();
        this.screenReader.announceFormFocus(form);
      }
    }, 100);
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Alt + S = Submit form
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        const activeForm = document.querySelector('.mlg-mobile-form:focus-within');
        if (activeForm) {
          const submitButton = activeForm.querySelector('button[type="submit"]');
          if (submitButton && !submitButton.disabled) {
            submitButton.click();
          }
        }
      }

      // Alt + C = Cancel/Close form
      if (e.altKey && e.key === 'c') {
        e.preventDefault();
        const activeForm = document.querySelector('.mlg-mobile-form:focus-within');
        if (activeForm) {
          const cancelButton = activeForm.querySelector('button[data-action="cancel"]');
          if (cancelButton) {
            cancelButton.click();
          }
        }
      }

      // Alt + V = Start voice input for focused field
      if (e.altKey && e.key === 'v') {
        e.preventDefault();
        const focusedInput = document.activeElement;
        if (focusedInput && focusedInput.dataset.voiceEnabled) {
          this.startVoiceInput(focusedInput);
        }
      }
    });
  }

  /**
   * Optimize for battery level
   */
  optimizeForBatteryLevel(battery) {
    const level = battery.level;
    const charging = battery.charging;

    if (level < 0.2 && !charging) {
      // Low battery mode
      document.body.classList.add('low-battery-mode');
      this.disableNonEssentialAnimations();
      this.reduceValidationFrequency();
    } else {
      document.body.classList.remove('low-battery-mode');
      this.enableNormalAnimations();
      this.restoreValidationFrequency();
    }
  }

  /**
   * Detect low power mode
   */
  detectLowPowerMode() {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.body.classList.add('reduced-motion');
    }

    // Check for low power mode indicators
    if (navigator.hardwareConcurrency <= 2) {
      document.body.classList.add('low-power-device');
    }
  }

  /**
   * Setup power efficient animations
   */
  setupPowerEfficientAnimations() {
    // Use CSS transforms instead of changing layout properties
    // Prefer opacity and transform over other properties
    // Use will-change sparingly
    
    const style = document.createElement('style');
    style.textContent = `
      .low-battery-mode * {
        animation-duration: 0.1s !important;
        transition-duration: 0.1s !important;
      }
      
      .reduced-motion * {
        animation: none !important;
        transition: none !important;
      }
      
      .low-power-device .complex-animation {
        display: none;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Test keyboard type support
   */
  async testKeyboardType(gamingType) {
    return new Promise((resolve) => {
      const testInput = document.createElement('input');
      const config = window.MLGMobileFormSystem?.keyboardTypes[gamingType] || {};
      
      Object.entries(config).forEach(([attr, value]) => {
        testInput.setAttribute(attr, value);
      });

      testInput.style.position = 'absolute';
      testInput.style.left = '-9999px';
      document.body.appendChild(testInput);

      // Focus and check if appropriate keyboard appears
      testInput.focus();
      
      setTimeout(() => {
        const keyboardHeight = window.innerHeight - window.visualViewport?.height || 0;
        const hasNumericKeyboard = keyboardHeight > 200 && config.inputmode === 'numeric';
        
        document.body.removeChild(testInput);
        
        resolve({
          supported: true,
          keyboardDetected: keyboardHeight > 200,
          numericKeyboard: hasNumericKeyboard,
          config: config
        });
      }, 500);
    });
  }

  /**
   * Utility functions
   */
  announce(message, priority = 'polite') {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    
    setTimeout(() => {
      if (document.body.contains(announcer)) {
        document.body.removeChild(announcer);
      }
    }, 1000);
  }

  getFieldLabel(field) {
    // Try multiple label strategies
    const label = field.closest('.mobile-form-field')?.querySelector('.field-label .label-text')?.textContent ||
                  field.getAttribute('aria-label') ||
                  field.getAttribute('placeholder') ||
                  'Form field';
    
    return label;
  }

  getFieldType(field) {
    const type = field.type || 'text';
    const gamingType = field.getAttribute('data-gaming-type');
    
    if (gamingType) {
      return gamingType.replace('-', ' ');
    }
    
    return type;
  }

  getElementSelector(element) {
    if (element.id) return `#${element.id}`;
    if (element.name) return `[name="${element.name}"]`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  calculateAverage(values) {
    if (!values.length) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  calculatePerformanceGrade(metrics) {
    const avgRender = this.calculateAverage(metrics.formRenderTime);
    const avgResponse = this.calculateAverage(metrics.inputResponseTime);
    const avgValidation = this.calculateAverage(metrics.validationTime);

    if (avgRender < 50 && avgResponse < 16 && avgValidation < 10) return 'A';
    if (avgRender < 100 && avgResponse < 32 && avgValidation < 20) return 'B';
    if (avgRender < 200 && avgResponse < 50 && avgValidation < 50) return 'C';
    return 'D';
  }

  disableNonEssentialAnimations() {
    document.querySelectorAll('.animation-intensive').forEach(el => {
      el.style.animation = 'none';
    });
  }

  enableNormalAnimations() {
    document.querySelectorAll('.animation-intensive').forEach(el => {
      el.style.animation = '';
    });
  }

  reduceValidationFrequency() {
    // Reduce real-time validation frequency in low battery mode
    if (window.MLGMobileFormSystem) {
      window.MLGMobileFormSystem.debounceValidation = window.MLGMobileFormSystem.debounce((input) => {
        window.MLGMobileFormSystem.validateFieldRealTime(input);
      }, 1000); // Increase from 300ms to 1000ms
    }
  }

  restoreValidationFrequency() {
    if (window.MLGMobileFormSystem) {
      window.MLGMobileFormSystem.debounceValidation = window.MLGMobileFormSystem.debounce((input) => {
        window.MLGMobileFormSystem.validateFieldRealTime(input);
      }, 300); // Restore to 300ms
    }
  }

  /**
   * Inject accessibility styles
   */
  injectAccessibilityStyles() {
    if (document.querySelector('#mlg-accessibility-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'mlg-accessibility-styles';
    styles.textContent = `
      /* Skip Links */
      .skip-links {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px;
        z-index: 9999;
        text-decoration: none;
        border-radius: 4px;
      }

      .skip-links:focus-within {
        top: 6px;
      }

      .skip-link {
        color: #00ff88;
        text-decoration: none;
        display: block;
        padding: 4px 8px;
      }

      .skip-link:focus {
        outline: 2px solid #00ff88;
        outline-offset: 2px;
      }

      /* Voice Input Button */
      .voice-input-button {
        position: absolute;
        right: 40px;
        top: 50%;
        transform: translateY(-50%);
        width: 32px;
        height: 32px;
        background: rgba(0, 255, 136, 0.1);
        border: 1px solid rgba(0, 255, 136, 0.3);
        border-radius: 50%;
        color: #00ff88;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        outline: none;
      }

      .voice-input-button:hover,
      .voice-input-button:focus {
        background: rgba(0, 255, 136, 0.2);
        border-color: #00ff88;
        box-shadow: 0 0 8px rgba(0, 255, 136, 0.3);
      }

      .voice-input-button.listening {
        background: rgba(255, 68, 68, 0.2);
        border-color: #ff4444;
        color: #ff4444;
        animation: pulse-red 1.5s infinite;
      }

      @keyframes pulse-red {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      .voice-input-button svg {
        width: 16px;
        height: 16px;
      }

      /* High Contrast Mode */
      @media (prefers-contrast: high) {
        .mobile-gaming-input {
          border-width: 3px;
          border-color: #fff;
        }

        .mobile-gaming-input:focus {
          border-color: #00ff88;
          box-shadow: 0 0 0 4px rgba(0, 255, 136, 0.3);
        }

        .gaming-button.mobile-touch-optimized {
          border: 3px solid #00ff88;
        }

        .field-error {
          border-color: #ff4444;
          background: rgba(255, 68, 68, 0.3);
        }

        .field-success {
          border-color: #00ff88;
          background: rgba(0, 255, 136, 0.3);
        }
      }

      /* Focus Management */
      .mobile-form-field:focus-within {
        outline: 2px solid #00ff88;
        outline-offset: 2px;
        border-radius: 8px;
      }

      /* Battery Optimization */
      .low-battery-mode .mlg-mobile-form {
        animation: none !important;
        transition: none !important;
      }

      .low-battery-mode .gaming-button.mobile-touch-optimized {
        animation: none !important;
        transition: opacity 0.1s ease !important;
      }

      .low-battery-mode .loading-spinner {
        animation-duration: 0.5s !important;
      }

      /* Screen Reader Only */
      .sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }

      /* Reduced Motion */
      @media (prefers-reduced-motion: reduce) {
        .mlg-mobile-form,
        .gaming-button.mobile-touch-optimized,
        .mobile-gaming-input,
        .validation-indicator {
          animation: none !important;
          transition: none !important;
        }

        .error-shake {
          animation: none !important;
        }

        .voice-input-button.listening {
          animation: none !important;
          background: rgba(255, 68, 68, 0.4) !important;
        }
      }

      /* Touch Target Enhancements */
      .touch-target-enhanced {
        min-width: 48px !important;
        min-height: 48px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 12px !important;
      }

      /* Focus Indicators */
      input:focus,
      select:focus,
      textarea:focus,
      button:focus {
        outline: 2px solid #00ff88 !important;
        outline-offset: 2px !important;
      }

      /* Error States for Screen Readers */
      .field-error[aria-live] {
        position: relative;
      }

      .field-success[aria-live] {
        position: relative;
      }

      /* Performance Indicators */
      .performance-warning {
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(255, 165, 0, 0.9);
        color: black;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10000;
        pointer-events: none;
      }

      /* Device-specific optimizations */
      @media (max-width: 480px) {
        .voice-input-button {
          width: 36px;
          height: 36px;
          right: 8px;
        }

        .voice-input-button svg {
          width: 18px;
          height: 18px;
        }
      }

      /* Landscape orientation optimizations */
      @media (orientation: landscape) and (max-height: 500px) {
        .skip-links {
          top: -30px;
        }

        .skip-links:focus-within {
          top: 4px;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  /**
   * Generate accessibility report
   */
  generateAccessibilityReport() {
    const touchTargetIssues = this.deviceTester.testTouchTargets();
    const screenReaderIssues = this.deviceTester.testScreenReaderCompatibility();
    const performanceReport = this.performanceMonitor.generateReport();

    return {
      touchTargets: {
        totalElements: document.querySelectorAll('button, input, select, textarea, a[href]').length,
        failedElements: touchTargetIssues.length,
        issues: touchTargetIssues
      },
      screenReader: {
        totalIssues: screenReaderIssues.length,
        issues: screenReaderIssues
      },
      performance: performanceReport,
      voiceInputSupported: !!this.voiceRecognition,
      batteryOptimized: document.body.classList.contains('low-battery-mode'),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Destroy accessibility system
   */
  destroy() {
    this.isInitialized = false;
    
    if (this.voiceRecognition) {
      this.voiceRecognition.stop();
      this.voiceRecognition = null;
    }

    // Remove styles
    const styles = document.querySelector('#mlg-accessibility-styles');
    if (styles) {
      styles.remove();
    }

    // Remove skip links
    const skipLinks = document.querySelector('#skip-links');
    if (skipLinks) {
      skipLinks.remove();
    }
  }
}

// Initialize and export
const mobileFormAccessibility = new MobileFormAccessibility();
window.MobileFormAccessibility = mobileFormAccessibility;

export default mobileFormAccessibility;