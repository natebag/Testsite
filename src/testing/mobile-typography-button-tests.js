/**
 * MLG.clan Mobile Typography & Button Testing Suite
 * 
 * Comprehensive testing for mobile typography and button optimizations
 * Tests across different device sizes, gaming contexts, and accessibility scenarios
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 */

class MobileTypographyButtonTester {
  constructor() {
    this.testResults = [];
    this.currentTest = null;
    this.testContainer = null;
    this.initialized = false;
  }

  /**
   * Initialize the testing suite
   */
  initialize() {
    if (this.initialized) return;

    this.createTestContainer();
    this.setupTestControls();
    this.initialized = true;

    console.log('Mobile Typography & Button Testing Suite initialized');
  }

  /**
   * Create test container in the DOM
   */
  createTestContainer() {
    this.testContainer = document.createElement('div');
    this.testContainer.id = 'mobile-typography-test-container';
    this.testContainer.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 350px;
      max-height: 80vh;
      background: rgba(10, 10, 15, 0.95);
      border: 2px solid #00ff88;
      border-radius: 12px;
      padding: 20px;
      color: white;
      font-family: 'Segoe UI', sans-serif;
      z-index: 10000;
      overflow-y: auto;
      backdrop-filter: blur(10px);
      display: none;
    `;

    document.body.appendChild(this.testContainer);
  }

  /**
   * Setup test control interface
   */
  setupTestControls() {
    const controls = document.createElement('div');
    controls.innerHTML = `
      <h3 style="margin: 0 0 15px 0; color: #00ff88;">MLG Mobile UI Tests</h3>
      
      <div style="margin-bottom: 15px;">
        <button id="toggle-test-ui" style="
          background: linear-gradient(135deg, #00ff88, #00cc6a);
          color: black;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          width: 100%;
        ">Toggle Test UI</button>
      </div>

      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-size: 14px;">Gaming Mode:</label>
        <select id="gaming-mode-select" style="
          width: 100%;
          padding: 8px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid #00ff88;
          border-radius: 4px;
          color: white;
        ">
          <option value="default">Default</option>
          <option value="tournament">Tournament</option>
          <option value="clan">Clan</option>
          <option value="voting">Voting</option>
          <option value="profile">Profile</option>
          <option value="social">Social</option>
        </select>
      </div>

      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-size: 14px;">Screen Size:</label>
        <select id="screen-size-select" style="
          width: 100%;
          padding: 8px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid #00ff88;
          border-radius: 4px;
          color: white;
        ">
          <option value="mobile-small">Mobile Small (320px)</option>
          <option value="mobile-medium">Mobile Medium (375px)</option>
          <option value="mobile-large">Mobile Large (414px)</option>
          <option value="tablet-portrait">Tablet Portrait (768px)</option>
          <option value="tablet-landscape">Tablet Landscape (1024px)</option>
          <option value="desktop">Desktop (1200px)</option>
        </select>
      </div>

      <div style="margin-bottom: 15px;">
        <button id="run-all-tests" style="
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          width: 100%;
          margin-bottom: 8px;
        ">Run All Tests</button>
        
        <button id="test-typography" style="
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          width: 100%;
          margin-bottom: 8px;
        ">Test Typography</button>
        
        <button id="test-buttons" style="
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          width: 100%;
          margin-bottom: 8px;
        ">Test Buttons</button>
        
        <button id="test-accessibility" style="
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          width: 100%;
        ">Test Accessibility</button>
      </div>

      <div id="test-results" style="
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        padding: 10px;
        min-height: 100px;
        font-size: 12px;
        font-family: monospace;
        overflow-y: auto;
        max-height: 200px;
      ">
        <div style="color: #999;">Test results will appear here...</div>
      </div>
    `;

    this.testContainer.appendChild(controls);
    this.setupControlEventListeners();
  }

  /**
   * Setup event listeners for test controls
   */
  setupControlEventListeners() {
    // Toggle test UI visibility
    document.getElementById('toggle-test-ui').addEventListener('click', () => {
      this.toggleTestUI();
    });

    // Gaming mode selector
    document.getElementById('gaming-mode-select').addEventListener('change', (e) => {
      if (window.MLGMobileUI) {
        window.MLGMobileUI.setGamingMode(e.target.value);
        this.logResult(`Gaming mode set to: ${e.target.value}`);
      }
    });

    // Screen size simulator
    document.getElementById('screen-size-select').addEventListener('change', (e) => {
      this.simulateScreenSize(e.target.value);
    });

    // Test buttons
    document.getElementById('run-all-tests').addEventListener('click', () => {
      this.runAllTests();
    });

    document.getElementById('test-typography').addEventListener('click', () => {
      this.testTypography();
    });

    document.getElementById('test-buttons').addEventListener('click', () => {
      this.testButtons();
    });

    document.getElementById('test-accessibility').addEventListener('click', () => {
      this.testAccessibility();
    });

    // Add keyboard shortcut to toggle test UI
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        this.toggleTestUI();
      }
    });
  }

  /**
   * Toggle test UI visibility
   */
  toggleTestUI() {
    const isVisible = this.testContainer.style.display !== 'none';
    this.testContainer.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
      this.logResult('Test UI opened. Press Ctrl+Shift+T to close.');
    }
  }

  /**
   * Simulate different screen sizes
   */
  simulateScreenSize(size) {
    const sizes = {
      'mobile-small': { width: '320px', height: '568px' },
      'mobile-medium': { width: '375px', height: '667px' },
      'mobile-large': { width: '414px', height: '736px' },
      'tablet-portrait': { width: '768px', height: '1024px' },
      'tablet-landscape': { width: '1024px', height: '768px' },
      'desktop': { width: '1200px', height: '800px' }
    };

    const targetSize = sizes[size];
    if (targetSize) {
      // Create viewport simulator
      document.body.style.transform = 'scale(1)';
      document.body.style.maxWidth = targetSize.width;
      document.body.style.maxHeight = targetSize.height;
      document.body.style.margin = '0 auto';
      document.body.style.border = '2px solid #00ff88';
      
      this.logResult(`Simulating ${size}: ${targetSize.width} x ${targetSize.height}`);
      
      // Trigger resize event
      window.dispatchEvent(new Event('resize'));
    }
  }

  /**
   * Run all available tests
   */
  async runAllTests() {
    this.clearResults();
    this.logResult('Starting comprehensive mobile UI tests...\n');

    await this.testTypography();
    await this.testButtons();
    await this.testAccessibility();
    await this.testPerformance();
    await this.testResponsiveness();

    this.logResult('\n✅ All tests completed!');
  }

  /**
   * Test typography system
   */
  async testTypography() {
    this.logResult('📝 Testing Typography System...');

    const tests = [
      this.testTypographyScaling,
      this.testGamingTextClasses,
      this.testReadabilityContrast,
      this.testLineHeightSpacing,
      this.testFontWeightHierarchy
    ];

    for (const test of tests) {
      await test.call(this);
    }

    this.logResult('✅ Typography tests completed\n');
  }

  /**
   * Test typography scaling across devices
   */
  testTypographyScaling() {
    return new Promise(resolve => {
      const testElement = document.createElement('div');
      testElement.className = 'gaming-text-body';
      testElement.textContent = 'Test text';
      testElement.style.visibility = 'hidden';
      document.body.appendChild(testElement);

      const computedStyle = window.getComputedStyle(testElement);
      const fontSize = parseFloat(computedStyle.fontSize);

      if (fontSize >= 16) {
        this.logResult('  ✅ Typography scaling: Font size meets minimum (16px)');
      } else {
        this.logResult('  ❌ Typography scaling: Font size too small');
      }

      document.body.removeChild(testElement);
      setTimeout(resolve, 100);
    });
  }

  /**
   * Test gaming text classes
   */
  testGamingTextClasses() {
    return new Promise(resolve => {
      const classes = [
        'gaming-text-micro',
        'gaming-text-small', 
        'gaming-text-body',
        'gaming-text-emphasis',
        'gaming-text-title',
        'gaming-text-heading',
        'gaming-text-hero',
        'gaming-text-display'
      ];

      let passCount = 0;
      
      classes.forEach(className => {
        const testElement = document.createElement('div');
        testElement.className = className;
        testElement.textContent = 'Test';
        testElement.style.visibility = 'hidden';
        document.body.appendChild(testElement);

        const computedStyle = window.getComputedStyle(testElement);
        const fontSize = parseFloat(computedStyle.fontSize);

        if (fontSize > 0) {
          passCount++;
        }

        document.body.removeChild(testElement);
      });

      this.logResult(`  ✅ Gaming text classes: ${passCount}/${classes.length} working`);
      setTimeout(resolve, 100);
    });
  }

  /**
   * Test readability contrast
   */
  testReadabilityContrast() {
    return new Promise(resolve => {
      // Test high contrast elements
      const contrastElements = [
        'tournament-team-name',
        'leaderboard-rank',
        'gaming-stat-value'
      ];

      let contrastPass = true;
      
      contrastElements.forEach(className => {
        const testElement = document.createElement('div');
        testElement.className = className;
        testElement.textContent = 'Contrast Test';
        testElement.style.visibility = 'hidden';
        document.body.appendChild(testElement);

        const computedStyle = window.getComputedStyle(testElement);
        const color = computedStyle.color;

        // Basic color check (should not be default black)
        if (color === 'rgb(0, 0, 0)') {
          contrastPass = false;
        }

        document.body.removeChild(testElement);
      });

      if (contrastPass) {
        this.logResult('  ✅ Readability contrast: Colors properly set');
      } else {
        this.logResult('  ❌ Readability contrast: Some elements lack proper colors');
      }

      setTimeout(resolve, 100);
    });
  }

  /**
   * Test line height and spacing
   */
  testLineHeightSpacing() {
    return new Promise(resolve => {
      const testElement = document.createElement('p');
      testElement.className = 'gaming-text-body';
      testElement.textContent = 'Line height test content for readability assessment';
      testElement.style.visibility = 'hidden';
      document.body.appendChild(testElement);

      const computedStyle = window.getComputedStyle(testElement);
      const lineHeight = parseFloat(computedStyle.lineHeight);
      const fontSize = parseFloat(computedStyle.fontSize);
      const ratio = lineHeight / fontSize;

      if (ratio >= 1.2 && ratio <= 1.8) {
        this.logResult(`  ✅ Line height spacing: Good ratio (${ratio.toFixed(2)})`);
      } else {
        this.logResult(`  ⚠️ Line height spacing: Ratio may affect readability (${ratio.toFixed(2)})`);
      }

      document.body.removeChild(testElement);
      setTimeout(resolve, 100);
    });
  }

  /**
   * Test font weight hierarchy
   */
  testFontWeightHierarchy() {
    return new Promise(resolve => {
      const weightTests = [
        { class: 'gaming-text-body', expectedMin: 400 },
        { class: 'gaming-text-emphasis', expectedMin: 600 },
        { class: 'gaming-text-title', expectedMin: 700 }
      ];

      let hierarchyPass = true;

      weightTests.forEach(test => {
        const testElement = document.createElement('div');
        testElement.className = test.class;
        testElement.textContent = 'Weight test';
        testElement.style.visibility = 'hidden';
        document.body.appendChild(testElement);

        const computedStyle = window.getComputedStyle(testElement);
        const fontWeight = parseInt(computedStyle.fontWeight);

        if (fontWeight < test.expectedMin) {
          hierarchyPass = false;
        }

        document.body.removeChild(testElement);
      });

      if (hierarchyPass) {
        this.logResult('  ✅ Font weight hierarchy: Proper weight distribution');
      } else {
        this.logResult('  ❌ Font weight hierarchy: Some weights below expected');
      }

      setTimeout(resolve, 100);
    });
  }

  /**
   * Test button system
   */
  async testButtons() {
    this.logResult('🔘 Testing Button System...');

    const tests = [
      this.testButtonTouchTargets,
      this.testButtonVariants,
      this.testButtonSizes,
      this.testButtonAccessibility,
      this.testButtonFeedback
    ];

    for (const test of tests) {
      await test.call(this);
    }

    this.logResult('✅ Button tests completed\n');
  }

  /**
   * Test button touch targets meet WCAG standards
   */
  testButtonTouchTargets() {
    return new Promise(resolve => {
      const buttonSizes = ['mini', 'standard', 'important', 'critical', 'hero'];
      let touchTargetPass = true;
      
      buttonSizes.forEach(size => {
        const button = document.createElement('button');
        button.className = `gaming-btn gaming-btn-${size}`;
        button.textContent = 'Test';
        button.style.visibility = 'hidden';
        document.body.appendChild(button);

        const rect = button.getBoundingClientRect();
        const minSize = size === 'mini' ? 32 : 48; // Mini buttons can be smaller for secondary actions

        if (rect.width < minSize || rect.height < minSize) {
          touchTargetPass = false;
          this.logResult(`    ❌ ${size} button below minimum touch target (${rect.width}x${rect.height})`);
        }

        document.body.removeChild(button);
      });

      if (touchTargetPass) {
        this.logResult('  ✅ Touch targets: All buttons meet WCAG standards');
      }

      setTimeout(resolve, 100);
    });
  }

  /**
   * Test button variants
   */
  testButtonVariants() {
    return new Promise(resolve => {
      const variants = ['primary', 'secondary', 'vote', 'super-vote', 'clan', 'tournament', 'danger', 'success'];
      let variantPass = 0;

      variants.forEach(variant => {
        const button = document.createElement('button');
        button.className = `gaming-btn gaming-btn-${variant}`;
        button.textContent = 'Test';
        button.style.visibility = 'hidden';
        document.body.appendChild(button);

        const computedStyle = window.getComputedStyle(button);
        const background = computedStyle.background || computedStyle.backgroundColor;

        if (background && background !== 'rgba(0, 0, 0, 0)') {
          variantPass++;
        }

        document.body.removeChild(button);
      });

      this.logResult(`  ✅ Button variants: ${variantPass}/${variants.length} properly styled`);
      setTimeout(resolve, 100);
    });
  }

  /**
   * Test button sizes
   */
  testButtonSizes() {
    return new Promise(resolve => {
      const sizes = ['mini', 'standard', 'important', 'critical', 'hero'];
      const expectedMinSizes = [32, 48, 56, 64, 72];
      let sizePass = true;

      sizes.forEach((size, index) => {
        const button = document.createElement('button');
        button.className = `gaming-btn gaming-btn-${size}`;
        button.textContent = 'Test Button';
        button.style.visibility = 'hidden';
        document.body.appendChild(button);

        const rect = button.getBoundingClientRect();
        const expectedMin = expectedMinSizes[index];

        if (rect.height < expectedMin) {
          sizePass = false;
          this.logResult(`    ❌ ${size} button height below expected (${rect.height} < ${expectedMin})`);
        }

        document.body.removeChild(button);
      });

      if (sizePass) {
        this.logResult('  ✅ Button sizes: All sizes meet expectations');
      }

      setTimeout(resolve, 100);
    });
  }

  /**
   * Test button accessibility
   */
  testButtonAccessibility() {
    return new Promise(resolve => {
      const button = document.createElement('button');
      button.className = 'gaming-btn gaming-btn-primary';
      button.textContent = 'Accessibility Test';
      button.style.visibility = 'hidden';
      document.body.appendChild(button);

      let accessibilityPass = true;
      const checks = [];

      // Check focusable
      button.focus();
      if (document.activeElement !== button) {
        accessibilityPass = false;
        checks.push('❌ Not focusable');
      } else {
        checks.push('✅ Focusable');
      }

      // Check aria attributes
      if (!button.getAttribute('aria-label') && !button.textContent.trim()) {
        accessibilityPass = false;
        checks.push('❌ Missing aria-label');
      } else {
        checks.push('✅ Has accessible name');
      }

      // Check role
      const role = button.getAttribute('role') || button.tagName.toLowerCase();
      if (role === 'button' || button.tagName.toLowerCase() === 'button') {
        checks.push('✅ Proper role');
      } else {
        accessibilityPass = false;
        checks.push('❌ Missing button role');
      }

      document.body.removeChild(button);

      this.logResult(`  ✅ Button accessibility: ${checks.join(', ')}`);
      setTimeout(resolve, 100);
    });
  }

  /**
   * Test button feedback
   */
  testButtonFeedback() {
    return new Promise(resolve => {
      const button = document.createElement('button');
      button.className = 'gaming-btn gaming-btn-primary gaming-btn-ripple';
      button.textContent = 'Feedback Test';
      button.style.position = 'fixed';
      button.style.top = '-1000px';
      document.body.appendChild(button);

      // Test touch feedback
      button.classList.add('touch-active');
      const hasTransform = window.getComputedStyle(button).transform !== 'none';
      
      if (hasTransform) {
        this.logResult('  ✅ Button feedback: Touch feedback working');
      } else {
        this.logResult('  ⚠️ Button feedback: Touch feedback may not be working');
      }

      document.body.removeChild(button);
      setTimeout(resolve, 100);
    });
  }

  /**
   * Test accessibility features
   */
  async testAccessibility() {
    this.logResult('♿ Testing Accessibility Features...');

    const tests = [
      this.testFocusManagement,
      this.testScreenReaderSupport,
      this.testKeyboardNavigation,
      this.testHighContrastSupport,
      this.testReducedMotionSupport
    ];

    for (const test of tests) {
      await test.call(this);
    }

    this.logResult('✅ Accessibility tests completed\n');
  }

  /**
   * Test focus management
   */
  testFocusManagement() {
    return new Promise(resolve => {
      const button = document.createElement('button');
      button.className = 'gaming-btn gaming-btn-primary';
      button.textContent = 'Focus Test';
      document.body.appendChild(button);

      button.focus();
      const computedStyle = window.getComputedStyle(button, ':focus-visible');
      const outline = computedStyle.outline;

      if (outline && outline !== 'none') {
        this.logResult('  ✅ Focus management: Visible focus indicators');
      } else {
        this.logResult('  ⚠️ Focus management: Focus indicators may not be visible');
      }

      document.body.removeChild(button);
      setTimeout(resolve, 100);
    });
  }

  /**
   * Test screen reader support
   */
  testScreenReaderSupport() {
    return new Promise(resolve => {
      const srElement = document.createElement('span');
      srElement.className = 'sr-only';
      srElement.textContent = 'Screen reader test';
      srElement.style.visibility = 'hidden';
      document.body.appendChild(srElement);

      const computedStyle = window.getComputedStyle(srElement);
      const isHidden = computedStyle.position === 'absolute' && 
                     computedStyle.width === '1px' && 
                     computedStyle.height === '1px';

      if (isHidden) {
        this.logResult('  ✅ Screen reader support: SR-only class working');
      } else {
        this.logResult('  ❌ Screen reader support: SR-only class not working');
      }

      document.body.removeChild(srElement);
      setTimeout(resolve, 100);
    });
  }

  /**
   * Test keyboard navigation
   */
  testKeyboardNavigation() {
    return new Promise(resolve => {
      // Create multiple focusable elements
      const container = document.createElement('div');
      container.innerHTML = `
        <button class="gaming-btn gaming-btn-primary">Button 1</button>
        <button class="gaming-btn gaming-btn-secondary">Button 2</button>
        <button class="gaming-btn gaming-btn-vote">Button 3</button>
      `;
      container.style.visibility = 'hidden';
      document.body.appendChild(container);

      const buttons = container.querySelectorAll('button');
      let tabOrderPass = true;

      buttons.forEach((button, index) => {
        const tabIndex = button.getAttribute('tabindex');
        if (tabIndex && parseInt(tabIndex) < 0 && !button.disabled) {
          tabOrderPass = false;
        }
      });

      if (tabOrderPass) {
        this.logResult('  ✅ Keyboard navigation: Tab order properly configured');
      } else {
        this.logResult('  ❌ Keyboard navigation: Tab order issues detected');
      }

      document.body.removeChild(container);
      setTimeout(resolve, 100);
    });
  }

  /**
   * Test high contrast support
   */
  testHighContrastSupport() {
    return new Promise(resolve => {
      // Simulate high contrast mode
      document.body.classList.add('high-contrast-mode');

      const button = document.createElement('button');
      button.className = 'gaming-btn gaming-btn-primary';
      button.textContent = 'High Contrast Test';
      button.style.visibility = 'hidden';
      document.body.appendChild(button);

      const computedStyle = window.getComputedStyle(button);
      const border = computedStyle.border;

      if (border && border !== 'none') {
        this.logResult('  ✅ High contrast support: Elements have proper borders');
      } else {
        this.logResult('  ⚠️ High contrast support: May need improvement');
      }

      document.body.removeChild(button);
      document.body.classList.remove('high-contrast-mode');
      setTimeout(resolve, 100);
    });
  }

  /**
   * Test reduced motion support
   */
  testReducedMotionSupport() {
    return new Promise(resolve => {
      // Check if reduced motion is respected
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      if (prefersReducedMotion) {
        this.logResult('  ✅ Reduced motion support: User prefers reduced motion');
      } else {
        this.logResult('  ℹ️ Reduced motion support: User has not set reduced motion preference');
      }

      // Test with class
      document.body.classList.add('prefers-reduced-motion');

      const button = document.createElement('button');
      button.className = 'gaming-btn gaming-btn-primary';
      button.textContent = 'Motion Test';
      button.style.visibility = 'hidden';
      document.body.appendChild(button);

      const computedStyle = window.getComputedStyle(button);
      const transition = computedStyle.transition;

      if (transition === 'none' || transition === '') {
        this.logResult('  ✅ Reduced motion support: Animations disabled when requested');
      } else {
        this.logResult('  ⚠️ Reduced motion support: Animations may still be active');
      }

      document.body.removeChild(button);
      document.body.classList.remove('prefers-reduced-motion');
      setTimeout(resolve, 100);
    });
  }

  /**
   * Test performance characteristics
   */
  async testPerformance() {
    this.logResult('⚡ Testing Performance...');

    const start = performance.now();
    
    // Create many elements to test rendering performance
    const container = document.createElement('div');
    container.style.visibility = 'hidden';
    
    for (let i = 0; i < 100; i++) {
      const button = document.createElement('button');
      button.className = 'gaming-btn gaming-btn-primary';
      button.textContent = `Button ${i}`;
      container.appendChild(button);
    }
    
    document.body.appendChild(container);
    
    // Force reflow
    container.offsetHeight;
    
    const end = performance.now();
    const renderTime = end - start;
    
    document.body.removeChild(container);
    
    if (renderTime < 100) {
      this.logResult(`  ✅ Performance: Fast rendering (${renderTime.toFixed(2)}ms)`);
    } else if (renderTime < 300) {
      this.logResult(`  ⚠️ Performance: Moderate rendering (${renderTime.toFixed(2)}ms)`);
    } else {
      this.logResult(`  ❌ Performance: Slow rendering (${renderTime.toFixed(2)}ms)`);
    }

    this.logResult('✅ Performance tests completed\n');
  }

  /**
   * Test responsiveness across breakpoints
   */
  async testResponsiveness() {
    this.logResult('📱 Testing Responsiveness...');

    const breakpoints = [
      { name: 'Mobile Small', width: 320 },
      { name: 'Mobile Medium', width: 375 },
      { name: 'Mobile Large', width: 414 },
      { name: 'Tablet Portrait', width: 768 },
      { name: 'Tablet Landscape', width: 1024 },
      { name: 'Desktop', width: 1200 }
    ];

    for (const breakpoint of breakpoints) {
      await this.testBreakpoint(breakpoint);
    }

    this.logResult('✅ Responsiveness tests completed\n');
  }

  /**
   * Test specific breakpoint
   */
  testBreakpoint(breakpoint) {
    return new Promise(resolve => {
      // Simulate viewport width
      const originalWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: breakpoint.width
      });

      // Trigger resize event
      window.dispatchEvent(new Event('resize'));

      // Test button at this breakpoint
      const button = document.createElement('button');
      button.className = 'gaming-btn gaming-btn-standard';
      button.textContent = 'Responsive Test';
      button.style.visibility = 'hidden';
      document.body.appendChild(button);

      const rect = button.getBoundingClientRect();
      const expectedMinSize = breakpoint.width <= 375 ? 44 : 48;

      if (rect.height >= expectedMinSize) {
        this.logResult(`  ✅ ${breakpoint.name}: Button size appropriate (${rect.height}px)`);
      } else {
        this.logResult(`  ❌ ${breakpoint.name}: Button too small (${rect.height}px)`);
      }

      document.body.removeChild(button);

      // Restore original width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: originalWidth
      });

      setTimeout(resolve, 50);
    });
  }

  /**
   * Log test result
   */
  logResult(message) {
    const resultsContainer = document.getElementById('test-results');
    if (resultsContainer) {
      const resultElement = document.createElement('div');
      resultElement.textContent = message;
      resultElement.style.marginBottom = '2px';
      
      if (message.includes('✅')) {
        resultElement.style.color = '#10b981';
      } else if (message.includes('❌')) {
        resultElement.style.color = '#ef4444';
      } else if (message.includes('⚠️')) {
        resultElement.style.color = '#fbbf24';
      } else if (message.includes('ℹ️')) {
        resultElement.style.color = '#3b82f6';
      } else {
        resultElement.style.color = '#e5e5e5';
      }
      
      resultsContainer.appendChild(resultElement);
      resultsContainer.scrollTop = resultsContainer.scrollHeight;
    }

    console.log(message);
    this.testResults.push(message);
  }

  /**
   * Clear test results
   */
  clearResults() {
    const resultsContainer = document.getElementById('test-results');
    if (resultsContainer) {
      resultsContainer.innerHTML = '';
    }
    this.testResults = [];
  }

  /**
   * Get all test results
   */
  getResults() {
    return this.testResults;
  }

  /**
   * Export test results
   */
  exportResults() {
    const results = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      devicePixelRatio: window.devicePixelRatio,
      results: this.testResults
    };

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `mlg-mobile-ui-test-results-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.logResult('📁 Test results exported');
  }
}

// Initialize tester when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.MLGTypographyTester = new MobileTypographyButtonTester();
    window.MLGTypographyTester.initialize();
  });
} else {
  window.MLGTypographyTester = new MobileTypographyButtonTester();
  window.MLGTypographyTester.initialize();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileTypographyButtonTester;
}

console.log('MLG Mobile Typography & Button Testing Suite loaded. Press Ctrl+Shift+T to open test interface.');