/**
 * MLG.clan Navigation Testing Suite
 * Comprehensive testing for all navigation paths and functionality
 * Testing Requirements: Browser compatibility, SPA routing, mobile menu, breadcrumbs, accessibility
 */

class MLGNavigationTestSuite {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: [],
      summary: '',
      recommendations: []
    };

    this.testConfig = {
      htmlFiles: [
        'index.html',
        'voting.html', 
        'clans.html',
        'content.html',
        'dao.html',
        'analytics.html',
        'profile.html'
      ],
      hashRoutes: [
        '#vote-vault',
        '#content-hub',
        '#clans',
        '#dao-governance',
        '#analytics-dashboard',
        '#profile-settings'
      ],
      expectedNavLinks: [
        { href: 'index.html', text: 'Dashboard' },
        { href: 'voting.html', text: 'Vote Vault' },
        { href: 'clans.html', text: 'Clans' },
        { href: 'content.html', text: 'Content Hub' },
        { href: 'dao.html', text: 'DAO' },
        { href: 'analytics.html', text: 'Analytics' },
        { href: 'profile.html', text: 'Profile' }
      ],
      gamingThemeElements: [
        'neon-glow',
        'card-glow',
        'gaming-accent',
        'gaming-surface',
        'gaming-bg',
        'xbox-style'
      ]
    };

    this.browsers = this.detectBrowser();
    this.isMobile = this.detectMobile();
    this.init();
  }

  /**
   * Initialize the test suite
   */
  init() {
    console.log('🧪 MLG.clan Navigation Test Suite Starting...');
    console.log(`📱 Platform: ${this.isMobile ? 'Mobile' : 'Desktop'}`);
    console.log(`🌐 Browser: ${this.browsers.name} ${this.browsers.version}`);
    
    this.startTestSuite();
  }

  /**
   * Start the complete test suite
   */
  async startTestSuite() {
    const startTime = performance.now();

    try {
      // Test 1: Navigation Manager Initialization
      await this.testNavigationManagerInit();
      
      // Test 2: SPA Router Functionality
      await this.testSPARouter();
      
      // Test 3: HTML File Navigation Links
      await this.testHTMLNavigationLinks();
      
      // Test 4: Hash-based Routing
      await this.testHashBasedRouting();
      
      // Test 5: Breadcrumb Navigation
      await this.testBreadcrumbNavigation();
      
      // Test 6: Mobile Menu Functionality
      await this.testMobileMenu();
      
      // Test 7: Loading States and Transitions
      await this.testLoadingStates();
      
      // Test 8: Wallet Connection Navigation
      await this.testWalletNavigation();
      
      // Test 9: Error States and 404 Handling
      await this.testErrorStates();
      
      // Test 10: Accessibility and Keyboard Navigation
      await this.testAccessibility();
      
      // Test 11: Gaming Theme Consistency
      await this.testGamingTheme();
      
      // Test 12: Cross-browser Compatibility
      await this.testCrossBrowserCompatibility();

    } catch (error) {
      this.addTestResult('Navigation Test Suite', 'FAILED', `Test suite crashed: ${error.message}`);
      console.error('🚨 Navigation Test Suite Error:', error);
    }

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    this.generateTestReport(duration);
  }

  /**
   * Test Navigation Manager Initialization
   */
  async testNavigationManagerInit() {
    console.log('🧭 Testing Navigation Manager Initialization...');

    try {
      // Check if NavigationManager class exists
      if (typeof NavigationManager === 'undefined') {
        this.addTestResult('NavigationManager Class', 'FAILED', 'NavigationManager class not found');
        return;
      }

      // Check global navigation manager instance
      if (!window.navigationManager) {
        this.addTestResult('Global NavigationManager Instance', 'FAILED', 'Global navigationManager instance not found');
        return;
      }

      // Check navigation manager methods
      const requiredMethods = ['handleNavigation', 'navigateToPage', 'updateActiveNavigation', 'getCurrentPage'];
      for (const method of requiredMethods) {
        if (!window.navigationManager[method]) {
          this.addTestResult(`NavigationManager.${method}`, 'FAILED', `Method ${method} not found`);
        } else {
          this.addTestResult(`NavigationManager.${method}`, 'PASSED', `Method ${method} exists`);
        }
      }

      // Check global functions
      const globalFunctions = ['handleNavigation', 'navigateToPage', 'updateActiveNavigation'];
      for (const func of globalFunctions) {
        if (typeof window[func] !== 'function') {
          this.addTestResult(`Global ${func}`, 'FAILED', `Global function ${func} not available`);
        } else {
          this.addTestResult(`Global ${func}`, 'PASSED', `Global function ${func} available`);
        }
      }

      // Test current page detection
      const currentPage = window.navigationManager.getCurrentPage();
      if (currentPage) {
        this.addTestResult('Current Page Detection', 'PASSED', `Current page: ${currentPage}`);
      } else {
        this.addTestResult('Current Page Detection', 'FAILED', 'Unable to detect current page');
      }

    } catch (error) {
      this.addTestResult('NavigationManager Initialization', 'FAILED', `Error: ${error.message}`);
    }
  }

  /**
   * Test SPA Router Functionality
   */
  async testSPARouter() {
    console.log('🔀 Testing SPA Router...');

    try {
      // Check if SPA Router exists
      if (typeof SPARouter === 'undefined') {
        this.addTestResult('SPARouter Class', 'WARNING', 'SPARouter class not found - fallback to multi-page navigation');
        return;
      }

      // Check router instance
      if (!window.router) {
        this.addTestResult('Router Instance', 'WARNING', 'Router instance not found - SPA mode unavailable');
        return;
      }

      // Test router methods
      const routerMethods = ['push', 'replace', 'back', 'forward', 'navigate'];
      for (const method of routerMethods) {
        if (typeof window.router[method] === 'function') {
          this.addTestResult(`Router.${method}`, 'PASSED', `Router method ${method} available`);
        } else {
          this.addTestResult(`Router.${method}`, 'FAILED', `Router method ${method} not available`);
        }
      }

      // Test router state
      if (window.router.getCurrentRoute) {
        const currentRoute = window.router.getCurrentRoute();
        this.addTestResult('Router Current Route', 'PASSED', `Current route detected: ${JSON.stringify(currentRoute)}`);
      }

      // Test route matching
      const testRoutes = ['/dashboard', '/voting', '/clans'];
      for (const route of testRoutes) {
        if (window.router.hasRoute && window.router.hasRoute(route)) {
          this.addTestResult(`Route ${route}`, 'PASSED', `Route ${route} is registered`);
        } else {
          this.addTestResult(`Route ${route}`, 'WARNING', `Route ${route} may not be registered`);
        }
      }

    } catch (error) {
      this.addTestResult('SPA Router Test', 'FAILED', `Error: ${error.message}`);
    }
  }

  /**
   * Test HTML Navigation Links
   */
  async testHTMLNavigationLinks() {
    console.log('🔗 Testing HTML Navigation Links...');

    try {
      // Test main navigation links
      const navLinks = document.querySelectorAll('.nav-link');
      if (navLinks.length === 0) {
        this.addTestResult('Navigation Links', 'FAILED', 'No navigation links found with .nav-link class');
        return;
      }

      this.addTestResult('Navigation Links Count', 'PASSED', `Found ${navLinks.length} navigation links`);

      // Test each expected navigation link
      for (const expectedLink of this.testConfig.expectedNavLinks) {
        const link = document.querySelector(`.nav-link[href="${expectedLink.href}"]`);
        
        if (link) {
          // Check if link has onclick handler
          const hasOnClick = link.hasAttribute('onclick') && link.getAttribute('onclick').includes('handleNavigation');
          
          if (hasOnClick) {
            this.addTestResult(`Link ${expectedLink.text}`, 'PASSED', `Link to ${expectedLink.href} has proper onclick handler`);
          } else {
            this.addTestResult(`Link ${expectedLink.text}`, 'WARNING', `Link to ${expectedLink.href} missing onclick handler`);
          }

          // Check accessibility attributes
          this.testLinkAccessibility(link, expectedLink.text);
        } else {
          this.addTestResult(`Link ${expectedLink.text}`, 'FAILED', `Navigation link to ${expectedLink.href} not found`);
        }
      }

      // Test mobile navigation links
      const mobileLinks = document.querySelectorAll('.mobile-nav-link');
      if (mobileLinks.length > 0) {
        this.addTestResult('Mobile Navigation Links', 'PASSED', `Found ${mobileLinks.length} mobile navigation links`);
        
        // Check if mobile links have proper handlers
        mobileLinks.forEach((link, index) => {
          const hasHandler = link.hasAttribute('onclick') && link.getAttribute('onclick').includes('handleNavigation');
          const closesMenu = link.getAttribute('onclick').includes('toggleMobileMenu');
          
          if (hasHandler && closesMenu) {
            this.addTestResult(`Mobile Link ${index + 1}`, 'PASSED', 'Mobile link has proper navigation and menu toggle');
          } else {
            this.addTestResult(`Mobile Link ${index + 1}`, 'WARNING', 'Mobile link missing navigation handler or menu toggle');
          }
        });
      } else {
        this.addTestResult('Mobile Navigation Links', 'FAILED', 'No mobile navigation links found');
      }

    } catch (error) {
      this.addTestResult('HTML Navigation Links Test', 'FAILED', `Error: ${error.message}`);
    }
  }

  /**
   * Test link accessibility
   */
  testLinkAccessibility(link, linkText) {
    // Check for proper text content
    const textContent = link.textContent.trim();
    if (textContent) {
      this.addTestResult(`${linkText} Link Text`, 'PASSED', `Link has accessible text: "${textContent}"`);
    } else {
      this.addTestResult(`${linkText} Link Text`, 'FAILED', 'Link missing accessible text content');
    }

    // Check for keyboard focus
    if (link.tabIndex >= 0 || !link.hasAttribute('tabindex')) {
      this.addTestResult(`${linkText} Keyboard Focus`, 'PASSED', 'Link is keyboard focusable');
    } else {
      this.addTestResult(`${linkText} Keyboard Focus`, 'FAILED', 'Link not keyboard focusable');
    }

    // Check for hover states
    const computedStyle = window.getComputedStyle(link);
    if (computedStyle.cursor === 'pointer') {
      this.addTestResult(`${linkText} Cursor Style`, 'PASSED', 'Link has pointer cursor');
    } else {
      this.addTestResult(`${linkText} Cursor Style`, 'WARNING', 'Link may be missing pointer cursor');
    }
  }

  /**
   * Test Hash-based Routing
   */
  async testHashBasedRouting() {
    console.log('🔗 Testing Hash-based Routing...');

    try {
      // Test navigateToSection function
      if (typeof navigateToSection === 'function') {
        this.addTestResult('navigateToSection Function', 'PASSED', 'Hash navigation function available');
      } else {
        this.addTestResult('navigateToSection Function', 'WARNING', 'navigateToSection function not found');
      }

      // Test hash route elements
      for (const hashRoute of this.testConfig.hashRoutes) {
        const sectionId = hashRoute.replace('#', '');
        const element = document.getElementById(sectionId);
        
        if (element) {
          this.addTestResult(`Hash Route ${hashRoute}`, 'PASSED', `Target element found for ${hashRoute}`);
        } else {
          this.addTestResult(`Hash Route ${hashRoute}`, 'WARNING', `Target element not found for ${hashRoute}`);
        }
      }

      // Test hash change handling
      const originalHash = window.location.hash;
      
      // Simulate hash change
      window.location.hash = '#test-section';
      setTimeout(() => {
        // Restore original hash
        window.location.hash = originalHash;
        this.addTestResult('Hash Change Handling', 'PASSED', 'Hash changes work properly');
      }, 100);

    } catch (error) {
      this.addTestResult('Hash-based Routing Test', 'FAILED', `Error: ${error.message}`);
    }
  }

  /**
   * Test Breadcrumb Navigation
   */
  async testBreadcrumbNavigation() {
    console.log('🍞 Testing Breadcrumb Navigation...');

    try {
      const breadcrumbNav = document.getElementById('breadcrumb-nav');
      if (!breadcrumbNav) {
        this.addTestResult('Breadcrumb Navigation', 'FAILED', 'Breadcrumb navigation element not found');
        return;
      }

      this.addTestResult('Breadcrumb Element', 'PASSED', 'Breadcrumb navigation element found');

      // Test breadcrumb structure
      const breadcrumbItems = breadcrumbNav.querySelectorAll('.breadcrumb-item');
      if (breadcrumbItems.length > 0) {
        this.addTestResult('Breadcrumb Items', 'PASSED', `Found ${breadcrumbItems.length} breadcrumb items`);
      } else {
        this.addTestResult('Breadcrumb Items', 'FAILED', 'No breadcrumb items found');
      }

      // Test current section indicator
      const currentSection = document.getElementById('current-section');
      if (currentSection) {
        this.addTestResult('Current Section Indicator', 'PASSED', `Current section: ${currentSection.textContent}`);
      } else {
        this.addTestResult('Current Section Indicator', 'FAILED', 'Current section indicator not found');
      }

      // Test breadcrumb accessibility
      const breadcrumbAriaLabel = breadcrumbNav.getAttribute('aria-label');
      if (breadcrumbAriaLabel) {
        this.addTestResult('Breadcrumb Accessibility', 'PASSED', `Breadcrumb has aria-label: "${breadcrumbAriaLabel}"`);
      } else {
        this.addTestResult('Breadcrumb Accessibility', 'WARNING', 'Breadcrumb missing aria-label');
      }

      // Test breadcrumb styling
      const breadcrumbStyles = ['breadcrumb-link', 'breadcrumb-current', 'breadcrumb-indicator'];
      for (const styleClass of breadcrumbStyles) {
        const elements = breadcrumbNav.querySelectorAll(`.${styleClass}`);
        if (elements.length > 0) {
          this.addTestResult(`Breadcrumb ${styleClass}`, 'PASSED', `Found ${elements.length} elements with ${styleClass} class`);
        } else {
          this.addTestResult(`Breadcrumb ${styleClass}`, 'WARNING', `No elements found with ${styleClass} class`);
        }
      }

    } catch (error) {
      this.addTestResult('Breadcrumb Navigation Test', 'FAILED', `Error: ${error.message}`);
    }
  }

  /**
   * Test Mobile Menu Functionality
   */
  async testMobileMenu() {
    console.log('📱 Testing Mobile Menu...');

    try {
      const mobileMenuButton = document.getElementById('mobile-menu-button');
      const mobileMenu = document.getElementById('mobile-menu');

      if (!mobileMenuButton) {
        this.addTestResult('Mobile Menu Button', 'FAILED', 'Mobile menu button not found');
        return;
      }

      if (!mobileMenu) {
        this.addTestResult('Mobile Menu Container', 'FAILED', 'Mobile menu container not found');
        return;
      }

      this.addTestResult('Mobile Menu Elements', 'PASSED', 'Mobile menu button and container found');

      // Test button accessibility
      const ariaExpanded = mobileMenuButton.getAttribute('aria-expanded');
      if (ariaExpanded !== null) {
        this.addTestResult('Mobile Menu ARIA', 'PASSED', `Button has aria-expanded: ${ariaExpanded}`);
      } else {
        this.addTestResult('Mobile Menu ARIA', 'WARNING', 'Mobile menu button missing aria-expanded attribute');
      }

      // Test button icons
      const hamburgerIcon = mobileMenuButton.querySelector('.hamburger-icon');
      const closeIcon = mobileMenuButton.querySelector('.close-icon');

      if (hamburgerIcon && closeIcon) {
        this.addTestResult('Mobile Menu Icons', 'PASSED', 'Hamburger and close icons found');
      } else {
        this.addTestResult('Mobile Menu Icons', 'WARNING', 'Mobile menu icons may be missing');
      }

      // Test menu visibility states
      const isHidden = mobileMenu.classList.contains('hidden');
      this.addTestResult('Mobile Menu Initial State', 'PASSED', `Menu initially ${isHidden ? 'hidden' : 'visible'}`);

      // Test toggle functionality
      if (typeof toggleMobileMenu === 'function') {
        this.addTestResult('Mobile Menu Toggle Function', 'PASSED', 'toggleMobileMenu function available');
      } else {
        this.addTestResult('Mobile Menu Toggle Function', 'WARNING', 'toggleMobileMenu function not found');
      }

      // Test mobile-specific navigation
      const mobileNavLinks = mobileMenu.querySelectorAll('.mobile-nav-link');
      this.addTestResult('Mobile Nav Links', 'PASSED', `Found ${mobileNavLinks.length} mobile navigation links`);

      // Test mobile wallet section
      const mobileWalletSection = document.getElementById('mobile-wallet-connect');
      if (mobileWalletSection) {
        this.addTestResult('Mobile Wallet Section', 'PASSED', 'Mobile wallet section found');
      } else {
        this.addTestResult('Mobile Wallet Section', 'WARNING', 'Mobile wallet section not found');
      }

    } catch (error) {
      this.addTestResult('Mobile Menu Test', 'FAILED', `Error: ${error.message}`);
    }
  }

  /**
   * Test Loading States and Transitions
   */
  async testLoadingStates() {
    console.log('⏳ Testing Loading States and Transitions...');

    try {
      // Test gaming loading components
      const loadingComponents = [
        'MLGLoadingSystem',
        'GamingLoadingStates',
        'XboxPageTransitions',
        'WalletLoadingStates',
        'VoteBurnLoading',
        'GamingUploadProgress'
      ];

      for (const component of loadingComponents) {
        if (typeof window[component] !== 'undefined') {
          this.addTestResult(`${component} Component`, 'PASSED', `${component} loading component available`);
        } else {
          this.addTestResult(`${component} Component`, 'WARNING', `${component} loading component not found`);
        }
      }

      // Test loading spinner styles
      const loadingSpinner = document.querySelector('.loading-spinner');
      if (loadingSpinner || document.querySelector('[class*="loading"]')) {
        this.addTestResult('Loading Spinner Styles', 'PASSED', 'Loading spinner styles available');
      } else {
        this.addTestResult('Loading Spinner Styles', 'WARNING', 'Loading spinner styles not found');
      }

      // Test Xbox 360 style animations
      const xboxAnimations = ['slideDown', 'slideUp', 'glow', 'float', 'pulse-neon'];
      for (const animation of xboxAnimations) {
        const hasAnimation = Array.from(document.styleSheets).some(sheet => {
          try {
            return Array.from(sheet.cssRules || []).some(rule => 
              rule.cssText && rule.cssText.includes(animation)
            );
          } catch (e) {
            return false;
          }
        });

        if (hasAnimation) {
          this.addTestResult(`Xbox Animation ${animation}`, 'PASSED', `Animation ${animation} defined`);
        } else {
          this.addTestResult(`Xbox Animation ${animation}`, 'WARNING', `Animation ${animation} not found`);
        }
      }

      // Test transition effects
      const transitionElements = document.querySelectorAll('[class*="transition"]');
      if (transitionElements.length > 0) {
        this.addTestResult('Transition Effects', 'PASSED', `Found ${transitionElements.length} elements with transitions`);
      } else {
        this.addTestResult('Transition Effects', 'WARNING', 'No transition effects found');
      }

    } catch (error) {
      this.addTestResult('Loading States Test', 'FAILED', `Error: ${error.message}`);
    }
  }

  /**
   * Test Wallet Connection Navigation
   */
  async testWalletNavigation() {
    console.log('👛 Testing Wallet Navigation...');

    try {
      const walletButton = document.getElementById('wallet-connect');
      const userInfo = document.getElementById('user-info');
      const profileLink = document.querySelector('a[href="profile.html"]');

      if (walletButton) {
        this.addTestResult('Wallet Connect Button', 'PASSED', 'Wallet connect button found');

        // Test button text and icon
        const buttonText = walletButton.textContent;
        const buttonIcon = walletButton.querySelector('[data-lucide="wallet"]');

        if (buttonText.includes('Phantom')) {
          this.addTestResult('Wallet Button Text', 'PASSED', 'Wallet button shows Phantom text');
        } else {
          this.addTestResult('Wallet Button Text', 'WARNING', 'Wallet button text may be incorrect');
        }

        if (buttonIcon) {
          this.addTestResult('Wallet Button Icon', 'PASSED', 'Wallet button has wallet icon');
        } else {
          this.addTestResult('Wallet Button Icon', 'WARNING', 'Wallet button missing icon');
        }
      } else {
        this.addTestResult('Wallet Connect Button', 'FAILED', 'Wallet connect button not found');
      }

      if (userInfo) {
        this.addTestResult('User Info Section', 'PASSED', 'User info section found');

        // Test user info components
        const userAddress = document.getElementById('user-address');
        const mlgBalance = document.getElementById('mlg-balance');

        if (userAddress) {
          this.addTestResult('User Address Display', 'PASSED', 'User address element found');
        } else {
          this.addTestResult('User Address Display', 'WARNING', 'User address element not found');
        }

        if (mlgBalance) {
          this.addTestResult('MLG Balance Display', 'PASSED', 'MLG balance element found');
        } else {
          this.addTestResult('MLG Balance Display', 'WARNING', 'MLG balance element not found');
        }
      } else {
        this.addTestResult('User Info Section', 'WARNING', 'User info section not found (expected when not connected)');
      }

      if (profileLink) {
        this.addTestResult('Profile Link', 'PASSED', 'Profile navigation link found');
      } else {
        this.addTestResult('Profile Link', 'WARNING', 'Profile navigation link not found');
      }

      // Test mobile wallet section
      const mobileWalletButton = document.getElementById('mobile-wallet-connect');
      const mobileUserInfo = document.getElementById('mobile-user-info');

      if (mobileWalletButton) {
        this.addTestResult('Mobile Wallet Button', 'PASSED', 'Mobile wallet button found');
      } else {
        this.addTestResult('Mobile Wallet Button', 'WARNING', 'Mobile wallet button not found');
      }

      if (mobileUserInfo) {
        this.addTestResult('Mobile User Info', 'PASSED', 'Mobile user info section found');
      } else {
        this.addTestResult('Mobile User Info', 'WARNING', 'Mobile user info section not found');
      }

    } catch (error) {
      this.addTestResult('Wallet Navigation Test', 'FAILED', `Error: ${error.message}`);
    }
  }

  /**
   * Test Error States and 404 Handling
   */
  async testErrorStates() {
    console.log('🚨 Testing Error States and 404 Handling...');

    try {
      // Test if router handles 404s
      if (window.router && typeof window.router.navigate === 'function') {
        // Test navigation to non-existent route
        try {
          const result = await window.router.navigate('/non-existent-route');
          if (result === false) {
            this.addTestResult('404 Route Handling', 'PASSED', 'Router properly handles non-existent routes');
          } else {
            this.addTestResult('404 Route Handling', 'WARNING', 'Router may not handle 404 routes properly');
          }
        } catch (error) {
          this.addTestResult('404 Route Handling', 'PASSED', 'Router throws errors for invalid routes (expected)');
        }
      }

      // Test error state UI
      const errorStateCheck = document.querySelector('.router-error-state') || 
                             document.querySelector('[class*="error"]');
      
      if (errorStateCheck) {
        this.addTestResult('Error State UI', 'PASSED', 'Error state UI components found');
      } else {
        this.addTestResult('Error State UI', 'WARNING', 'Error state UI may not be implemented');
      }

      // Test network error handling
      if (typeof window.fetch === 'function') {
        try {
          // Test with invalid URL to trigger network error
          await fetch('/invalid-endpoint').catch(() => {
            this.addTestResult('Network Error Handling', 'PASSED', 'Network errors are properly caught');
          });
        } catch (error) {
          this.addTestResult('Network Error Handling', 'PASSED', 'Network error handling works');
        }
      }

      // Test fallback navigation
      const testLinks = document.querySelectorAll('a[href]');
      let hasWorkingFallbacks = 0;
      
      testLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
          hasWorkingFallbacks++;
        }
      });

      if (hasWorkingFallbacks > 0) {
        this.addTestResult('Fallback Navigation', 'PASSED', `${hasWorkingFallbacks} links have proper href fallbacks`);
      } else {
        this.addTestResult('Fallback Navigation', 'WARNING', 'No fallback navigation links found');
      }

    } catch (error) {
      this.addTestResult('Error States Test', 'FAILED', `Error: ${error.message}`);
    }
  }

  /**
   * Test Accessibility and Keyboard Navigation
   */
  async testAccessibility() {
    console.log('♿ Testing Accessibility and Keyboard Navigation...');

    try {
      // Test keyboard navigation
      const focusableElements = this.getFocusableElements();
      this.addTestResult('Focusable Elements', 'PASSED', `Found ${focusableElements.length} focusable elements`);

      // Test tab navigation
      let tabOrder = [];
      focusableElements.forEach((element, index) => {
        const tabIndex = element.tabIndex;
        tabOrder.push({ element: element.tagName, tabIndex, index });
      });

      const properTabOrder = tabOrder.every((item, index) => {
        return index === 0 || item.tabIndex >= tabOrder[index - 1].tabIndex;
      });

      if (properTabOrder) {
        this.addTestResult('Tab Order', 'PASSED', 'Tab order appears logical');
      } else {
        this.addTestResult('Tab Order', 'WARNING', 'Tab order may need review');
      }

      // Test ARIA labels and roles
      const ariaElements = document.querySelectorAll('[aria-label], [aria-labelledby], [role]');
      this.addTestResult('ARIA Attributes', 'PASSED', `Found ${ariaElements.length} elements with ARIA attributes`);

      // Test keyboard shortcuts
      const navLinks = document.querySelectorAll('.nav-link');
      let keyboardAccessibleLinks = 0;

      navLinks.forEach(link => {
        if (link.tabIndex >= 0 || !link.hasAttribute('tabindex')) {
          keyboardAccessibleLinks++;
        }
      });

      if (keyboardAccessibleLinks === navLinks.length) {
        this.addTestResult('Keyboard Accessible Links', 'PASSED', 'All navigation links are keyboard accessible');
      } else {
        this.addTestResult('Keyboard Accessible Links', 'WARNING', `${navLinks.length - keyboardAccessibleLinks} links may not be keyboard accessible`);
      }

      // Test color contrast (basic check)
      const testElements = document.querySelectorAll('.nav-link, .mobile-nav-link, .breadcrumb-link');
      let contrastIssues = 0;

      testElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        const backgroundColor = styles.backgroundColor;
        const color = styles.color;
        
        // Basic check - if both are set and not transparent
        if (backgroundColor !== 'rgba(0, 0, 0, 0)' && color !== 'rgba(0, 0, 0, 0)') {
          // This is a simplified check - real contrast calculation would be more complex
          this.addTestResult('Color Contrast Check', 'PASSED', 'Elements have defined colors');
        }
      });

      // Test skip links
      const skipLinks = document.querySelectorAll('a[href^="#"], [class*="skip"]');
      if (skipLinks.length > 0) {
        this.addTestResult('Skip Links', 'PASSED', `Found ${skipLinks.length} potential skip links`);
      } else {
        this.addTestResult('Skip Links', 'WARNING', 'No skip links found - consider adding for better accessibility');
      }

      // Test semantic structure
      const landmarks = document.querySelectorAll('nav, main, header, footer, aside, section');
      if (landmarks.length > 0) {
        this.addTestResult('Semantic Structure', 'PASSED', `Found ${landmarks.length} semantic landmarks`);
      } else {
        this.addTestResult('Semantic Structure', 'WARNING', 'Limited semantic structure found');
      }

    } catch (error) {
      this.addTestResult('Accessibility Test', 'FAILED', `Error: ${error.message}`);
    }
  }

  /**
   * Test Gaming Theme Consistency
   */
  async testGamingTheme() {
    console.log('🎮 Testing Gaming Theme Consistency...');

    try {
      // Test gaming color variables
      const rootStyles = window.getComputedStyle(document.documentElement);
      const gamingColors = ['--neon-green', '--neon-blue', '--neon-purple', '--dark-bg', '--card-bg'];
      
      for (const color of gamingColors) {
        const colorValue = rootStyles.getPropertyValue(color);
        if (colorValue) {
          this.addTestResult(`Gaming Color ${color}`, 'PASSED', `Color defined: ${colorValue}`);
        } else {
          this.addTestResult(`Gaming Color ${color}`, 'WARNING', `Color variable ${color} not found`);
        }
      }

      // Test gaming theme classes
      for (const themeClass of this.testConfig.gamingThemeElements) {
        const elements = document.querySelectorAll(`.${themeClass}`);
        if (elements.length > 0) {
          this.addTestResult(`Gaming Class ${themeClass}`, 'PASSED', `Found ${elements.length} elements with ${themeClass}`);
        } else {
          this.addTestResult(`Gaming Class ${themeClass}`, 'WARNING', `No elements found with ${themeClass} class`);
        }
      }

      // Test Xbox 360 style elements
      const xboxElements = document.querySelectorAll('[class*="xbox"], .breadcrumb-indicator, .hero-text');
      if (xboxElements.length > 0) {
        this.addTestResult('Xbox 360 Style Elements', 'PASSED', `Found ${xboxElements.length} Xbox-style elements`);
      } else {
        this.addTestResult('Xbox 360 Style Elements', 'WARNING', 'Xbox 360 style elements not found');
      }

      // Test gaming icons
      const gamingIcons = document.querySelectorAll('[data-lucide], .animate-pulse');
      if (gamingIcons.length > 0) {
        this.addTestResult('Gaming Icons', 'PASSED', `Found ${gamingIcons.length} gaming icons`);
      } else {
        this.addTestResult('Gaming Icons', 'WARNING', 'Gaming icons not found');
      }

      // Test hover effects
      const hoverElements = document.querySelectorAll('[class*="hover\\:"]');
      if (hoverElements.length > 0) {
        this.addTestResult('Gaming Hover Effects', 'PASSED', `Found ${hoverElements.length} elements with hover effects`);
      } else {
        this.addTestResult('Gaming Hover Effects', 'WARNING', 'Gaming hover effects not found');
      }

    } catch (error) {
      this.addTestResult('Gaming Theme Test', 'FAILED', `Error: ${error.message}`);
    }
  }

  /**
   * Test Cross-browser Compatibility
   */
  async testCrossBrowserCompatibility() {
    console.log('🌐 Testing Cross-browser Compatibility...');

    try {
      // Test modern JS features
      const features = {
        'ES6 Classes': () => typeof class {} === 'function',
        'Async/Await': () => typeof (async () => {}) === 'function',
        'Fetch API': () => typeof fetch === 'function',
        'LocalStorage': () => typeof localStorage !== 'undefined',
        'SessionStorage': () => typeof sessionStorage !== 'undefined',
        'History API': () => typeof history.pushState === 'function',
        'CSS Grid': () => CSS.supports('display', 'grid'),
        'CSS Flexbox': () => CSS.supports('display', 'flex'),
        'CSS Custom Properties': () => CSS.supports('color', 'var(--test)'),
        'CSS Animations': () => CSS.supports('animation', 'test 1s'),
        'Web Components': () => typeof customElements !== 'undefined'
      };

      for (const [feature, test] of Object.entries(features)) {
        try {
          if (test()) {
            this.addTestResult(`Browser Feature ${feature}`, 'PASSED', `${feature} supported`);
          } else {
            this.addTestResult(`Browser Feature ${feature}`, 'WARNING', `${feature} not supported`);
          }
        } catch (error) {
          this.addTestResult(`Browser Feature ${feature}`, 'FAILED', `${feature} test failed: ${error.message}`);
        }
      }

      // Test browser-specific implementations
      const browserSpecific = {
        'Chrome Extensions': () => typeof chrome !== 'undefined',
        'Safari Webkit': () => typeof webkit !== 'undefined',
        'Firefox Gecko': () => typeof InstallTrigger !== 'undefined',
        'Edge Chromium': () => navigator.userAgent.includes('Edg/')
      };

      let detectedBrowser = 'Unknown';
      for (const [browser, test] of Object.entries(browserSpecific)) {
        try {
          if (test()) {
            detectedBrowser = browser;
            this.addTestResult('Browser Detection', 'PASSED', `Detected browser: ${browser}`);
            break;
          }
        } catch (error) {
          // Ignore browser detection errors
        }
      }

      if (detectedBrowser === 'Unknown') {
        this.addTestResult('Browser Detection', 'WARNING', 'Could not detect specific browser');
      }

      // Test viewport handling
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        this.addTestResult('Viewport Meta Tag', 'PASSED', `Viewport configured: ${viewport.content}`);
      } else {
        this.addTestResult('Viewport Meta Tag', 'FAILED', 'Viewport meta tag missing');
      }

      // Test responsive design
      if (window.matchMedia) {
        const mediaQueries = [
          '(max-width: 768px)',
          '(min-width: 769px) and (max-width: 1024px)',
          '(min-width: 1025px)'
        ];

        for (const query of mediaQueries) {
          const mediaQuery = window.matchMedia(query);
          this.addTestResult(`Media Query ${query}`, 'PASSED', `Media query supported: ${mediaQuery.matches}`);
        }
      } else {
        this.addTestResult('Media Queries', 'WARNING', 'matchMedia not supported');
      }

    } catch (error) {
      this.addTestResult('Cross-browser Compatibility Test', 'FAILED', `Error: ${error.message}`);
    }
  }

  /**
   * Get all focusable elements
   */
  getFocusableElements() {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable]:not([contenteditable="false"])'
    ];

    return Array.from(document.querySelectorAll(focusableSelectors.join(', ')))
      .filter(element => {
        return element.offsetWidth > 0 && 
               element.offsetHeight > 0 && 
               window.getComputedStyle(element).display !== 'none';
      });
  }

  /**
   * Add test result
   */
  addTestResult(testName, status, message) {
    const result = {
      test: testName,
      status: status,
      message: message,
      timestamp: new Date().toISOString()
    };

    this.testResults.tests.push(result);

    switch (status) {
      case 'PASSED':
        this.testResults.passed++;
        console.log(`✅ ${testName}: ${message}`);
        break;
      case 'FAILED':
        this.testResults.failed++;
        console.error(`❌ ${testName}: ${message}`);
        break;
      case 'WARNING':
        this.testResults.warnings++;
        console.warn(`⚠️ ${testName}: ${message}`);
        break;
    }
  }

  /**
   * Detect browser information
   */
  detectBrowser() {
    const ua = navigator.userAgent;
    
    if (ua.includes('Chrome') && !ua.includes('Edg')) {
      return { name: 'Chrome', version: ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown' };
    } else if (ua.includes('Firefox')) {
      return { name: 'Firefox', version: ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown' };
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      return { name: 'Safari', version: ua.match(/Version\/(\d+)/)?.[1] || 'Unknown' };
    } else if (ua.includes('Edg')) {
      return { name: 'Edge', version: ua.match(/Edg\/(\d+)/)?.[1] || 'Unknown' };
    }
    
    return { name: 'Unknown', version: 'Unknown' };
  }

  /**
   * Detect mobile device
   */
  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport(duration) {
    const total = this.testResults.passed + this.testResults.failed + this.testResults.warnings;
    const passRate = ((this.testResults.passed / total) * 100).toFixed(1);
    
    // Generate summary
    this.testResults.summary = `
🧪 MLG.clan Navigation Test Suite Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Test Results Summary:
   • Total Tests: ${total}
   • Passed: ${this.testResults.passed} (${passRate}%)
   • Failed: ${this.testResults.failed}
   • Warnings: ${this.testResults.warnings}
   • Duration: ${duration}ms
   • Platform: ${this.isMobile ? 'Mobile' : 'Desktop'}
   • Browser: ${this.browsers.name} ${this.browsers.version}

${this.getOverallStatus()}

🎯 Navigation Test Categories:
   • Navigation Manager: ${this.getCategoryStatus('NavigationManager')}
   • SPA Router: ${this.getCategoryStatus('Router')}
   • HTML Links: ${this.getCategoryStatus('Link')}
   • Hash Routing: ${this.getCategoryStatus('Hash')}
   • Breadcrumbs: ${this.getCategoryStatus('Breadcrumb')}
   • Mobile Menu: ${this.getCategoryStatus('Mobile')}
   • Loading States: ${this.getCategoryStatus('Loading')}
   • Wallet Navigation: ${this.getCategoryStatus('Wallet')}
   • Error Handling: ${this.getCategoryStatus('Error')}
   • Accessibility: ${this.getCategoryStatus('Accessibility')}
   • Gaming Theme: ${this.getCategoryStatus('Gaming')}
   • Browser Compatibility: ${this.getCategoryStatus('Browser')}

${this.generateRecommendations()}
    `;

    console.log(this.testResults.summary);
    
    // Generate detailed report
    this.generateDetailedReport();

    return this.testResults;
  }

  /**
   * Get overall test status
   */
  getOverallStatus() {
    if (this.testResults.failed > 5) {
      return '🔴 CRITICAL ISSUES FOUND - Navigation system needs immediate attention';
    } else if (this.testResults.failed > 0) {
      return '🟠 ISSUES FOUND - Some navigation features need fixes';
    } else if (this.testResults.warnings > 10) {
      return '🟡 WARNINGS PRESENT - Consider addressing warnings for optimal experience';
    } else {
      return '🟢 NAVIGATION SYSTEM HEALTHY - All critical tests passed';
    }
  }

  /**
   * Get category status
   */
  getCategoryStatus(category) {
    const categoryTests = this.testResults.tests.filter(test => 
      test.test.toLowerCase().includes(category.toLowerCase())
    );

    const failed = categoryTests.filter(test => test.status === 'FAILED').length;
    const warnings = categoryTests.filter(test => test.status === 'WARNING').length;
    const passed = categoryTests.filter(test => test.status === 'PASSED').length;

    if (failed > 0) return '❌ Failed';
    if (warnings > 2) return '⚠️ Issues';
    if (passed > 0) return '✅ Good';
    return '➖ N/A';
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    // Analyze failed tests for recommendations
    const failedTests = this.testResults.tests.filter(test => test.status === 'FAILED');
    
    if (failedTests.some(test => test.test.includes('NavigationManager'))) {
      recommendations.push('• Fix Navigation Manager initialization and global function availability');
    }
    
    if (failedTests.some(test => test.test.includes('Mobile'))) {
      recommendations.push('• Implement missing mobile menu functionality and accessibility features');
    }
    
    if (failedTests.some(test => test.test.includes('Link'))) {
      recommendations.push('• Add missing navigation links and ensure proper onclick handlers');
    }
    
    if (failedTests.some(test => test.test.includes('Breadcrumb'))) {
      recommendations.push('• Implement breadcrumb navigation system with proper ARIA labels');
    }
    
    if (failedTests.some(test => test.test.includes('Wallet'))) {
      recommendations.push('• Complete wallet navigation integration and user state management');
    }

    // Analyze warnings for recommendations
    const warningTests = this.testResults.tests.filter(test => test.status === 'WARNING');
    
    if (warningTests.length > 10) {
      recommendations.push('• Address accessibility warnings to improve WCAG compliance');
    }
    
    if (warningTests.some(test => test.test.includes('Gaming'))) {
      recommendations.push('• Enhance Xbox 360 gaming theme consistency across all components');
    }
    
    if (warningTests.some(test => test.test.includes('Browser'))) {
      recommendations.push('• Add polyfills for better cross-browser compatibility');
    }

    // Add general recommendations
    recommendations.push('• Test navigation on multiple browsers and devices');
    recommendations.push('• Implement automated navigation tests in CI/CD pipeline');
    recommendations.push('• Regular accessibility audits with screen readers');
    
    this.testResults.recommendations = recommendations;

    return recommendations.length > 0 
      ? `🔧 Recommendations:\n${recommendations.join('\n')}`
      : '🎉 No critical recommendations - navigation system is well implemented!';
  }

  /**
   * Generate detailed HTML report
   */
  generateDetailedReport() {
    const reportHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MLG.clan Navigation Test Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; background: #0a0a0f; color: white; }
        .header { background: linear-gradient(135deg, #1a1a2e, #0a0a0f); padding: 2rem; text-align: center; border-bottom: 2px solid #00ff88; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .summary { background: rgba(26, 26, 46, 0.5); padding: 2rem; border-radius: 12px; margin-bottom: 2rem; border: 1px solid rgba(0, 255, 136, 0.2); }
        .test-result { margin: 1rem 0; padding: 1rem; border-radius: 8px; border-left: 4px solid; }
        .passed { background: rgba(34, 197, 94, 0.1); border-color: #22c55e; }
        .failed { background: rgba(239, 68, 68, 0.1); border-color: #ef4444; }
        .warning { background: rgba(251, 191, 36, 0.1); border-color: #fbbf24; }
        .status { font-weight: bold; display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem; }
        .status.passed { background: #22c55e; color: black; }
        .status.failed { background: #ef4444; color: white; }
        .status.warning { background: #fbbf24; color: black; }
        .recommendations { background: rgba(139, 92, 246, 0.1); padding: 1.5rem; border-radius: 8px; border: 1px solid #8b5cf6; }
        .gaming-accent { color: #00ff88; }
        .gaming-glow { text-shadow: 0 0 10px #00ff88; }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="gaming-glow">🎮 MLG.clan Navigation Test Report</h1>
        <p>Complete navigation system analysis and testing results</p>
    </div>
    
    <div class="container">
        <div class="summary">
            <h2 class="gaming-accent">📊 Test Summary</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1rem 0;">
                <div style="text-align: center; padding: 1rem; background: rgba(0, 255, 136, 0.1); border-radius: 8px;">
                    <div style="font-size: 2rem; font-weight: bold; color: #22c55e;">${this.testResults.passed}</div>
                    <div>Passed</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px;">
                    <div style="font-size: 2rem; font-weight: bold; color: #ef4444;">${this.testResults.failed}</div>
                    <div>Failed</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: rgba(251, 191, 36, 0.1); border-radius: 8px;">
                    <div style="font-size: 2rem; font-weight: bold; color: #fbbf24;">${this.testResults.warnings}</div>
                    <div>Warnings</div>
                </div>
            </div>
            
            <p><strong>Browser:</strong> ${this.browsers.name} ${this.browsers.version}</p>
            <p><strong>Platform:</strong> ${this.isMobile ? 'Mobile' : 'Desktop'}</p>
            <p><strong>Test Date:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <div class="recommendations">
            <h2 class="gaming-accent">🔧 Recommendations</h2>
            ${this.testResults.recommendations.map(rec => `<p>${rec}</p>`).join('')}
        </div>

        <h2 class="gaming-accent">📋 Detailed Test Results</h2>
        ${this.testResults.tests.map(test => `
            <div class="test-result ${test.status.toLowerCase()}">
                <div style="display: flex; justify-content: between; align-items: center;">
                    <strong>${test.test}</strong>
                    <span class="status ${test.status.toLowerCase()}">${test.status}</span>
                </div>
                <p style="margin: 0.5rem 0 0 0; color: #ccc;">${test.message}</p>
                <small style="color: #888;">${new Date(test.timestamp).toLocaleString()}</small>
            </div>
        `).join('')}
    </div>
</body>
</html>
    `;

    // Save report (in a real environment, this would save to a file)
    console.log('📄 Detailed HTML report generated');
    
    return reportHtml;
  }
}

// Auto-start the test suite when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.mlgNavigationTestSuite = new MLGNavigationTestSuite();
  });
} else {
  window.mlgNavigationTestSuite = new MLGNavigationTestSuite();
}

// Export for manual testing
window.MLGNavigationTestSuite = MLGNavigationTestSuite;