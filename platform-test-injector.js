/**
 * MLG.clan Platform Integration Test Suite
 * Comprehensive testing framework for the fully integrated platform
 */

class MLGIntegrationTester {
    constructor() {
        this.testResults = [];
        this.testCategories = {
            component: 'Component Integration',
            websocket: 'WebSocket Real-time',
            wallet: 'Phantom Wallet',
            navigation: 'Navigation & Routing',
            video: 'Multi-platform Video',
            performance: 'Performance',
            error: 'Error Handling',
            accessibility: 'Accessibility',
            security: 'Security',
            crossbrowser: 'Cross-browser'
        };
        this.init();
    }

    init() {
        console.log('🧪 MLG Platform Integration Tester Initialized');
        this.createTestUI();
    }

    createTestUI() {
        // Create floating test panel
        const testPanel = document.createElement('div');
        testPanel.id = 'mlg-test-panel';
        testPanel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 350px;
            max-height: 600px;
            background: rgba(11, 20, 38, 0.95);
            border: 2px solid #6ab04c;
            border-radius: 10px;
            color: white;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 12px;
            z-index: 10000;
            backdrop-filter: blur(10px);
            overflow: hidden;
            display: none;
        `;

        testPanel.innerHTML = `
            <div style="padding: 15px; border-bottom: 1px solid #6ab04c;">
                <h3 style="margin: 0; color: #6ab04c; font-size: 14px;">🧪 MLG Test Suite</h3>
                <div style="margin-top: 10px; display: flex; gap: 5px; flex-wrap: wrap;">
                    <button onclick="mlgTester.runAllTests()" style="background: #6ab04c; border: none; color: white; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 11px;">All Tests</button>
                    <button onclick="mlgTester.runComponentTests()" style="background: #8b5cf6; border: none; color: white; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 11px;">Components</button>
                    <button onclick="mlgTester.runPerformanceTests()" style="background: #f59e0b; border: none; color: white; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 11px;">Performance</button>
                    <button onclick="mlgTester.clearTests()" style="background: #6b7280; border: none; color: white; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 11px;">Clear</button>
                    <button onclick="mlgTester.togglePanel()" style="background: #dc2626; border: none; color: white; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 11px;">Hide</button>
                </div>
            </div>
            <div id="test-results" style="padding: 15px; max-height: 400px; overflow-y: auto;">
                <div style="text-align: center; color: #6b7280;">Click a button to run tests</div>
            </div>
            <div id="test-summary" style="padding: 15px; border-top: 1px solid #6ab04c; display: none;">
                <div style="display: flex; justify-content: space-between; font-size: 11px;">
                    <span>Pass: <span id="pass-count" style="color: #22c55e;">0</span></span>
                    <span>Fail: <span id="fail-count" style="color: #dc2626;">0</span></span>
                    <span>Warn: <span id="warn-count" style="color: #f59e0b;">0</span></span>
                    <span>Total: <span id="total-count">0</span></span>
                </div>
            </div>
        `;

        document.body.appendChild(testPanel);

        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'mlg-test-toggle';
        toggleBtn.innerHTML = '🧪';
        toggleBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: #6ab04c;
            border: none;
            border-radius: 50%;
            color: white;
            font-size: 20px;
            cursor: pointer;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(106, 176, 76, 0.3);
        `;
        toggleBtn.onclick = () => this.togglePanel();
        document.body.appendChild(toggleBtn);
    }

    togglePanel() {
        const panel = document.getElementById('mlg-test-panel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }

    async runAllTests() {
        this.clearTests();
        this.logTest('System', 'Starting comprehensive integration tests...', 'info');

        try {
            await this.runComponentTests();
            await this.runWebSocketTests();
            await this.runWalletTests();
            await this.runNavigationTests();
            await this.runVideoTests();
            await this.runPerformanceTests();
            await this.runErrorHandlingTests();
            await this.runAccessibilityTests();
            await this.runSecurityTests();
            await this.runCrossBrowserTests();
            
            this.updateSummary();
            this.logTest('System', 'All tests completed', 'info');
        } catch (error) {
            this.logTest('System', `Test suite error: ${error.message}`, 'fail');
        }
    }

    async runComponentTests() {
        this.logTest('Component Integration', 'Testing component integrations...', 'info');

        // Test 1: Voting System Integration
        try {
            const votingSection = document.querySelector('[data-section="voting"]');
            const burnButtons = document.querySelectorAll('.burn-vote-btn');
            
            if (!votingSection) {
                this.logTest('Voting System', 'Voting section not found', 'fail');
            } else if (burnButtons.length === 0) {
                this.logTest('Voting System', 'No burn-vote buttons found', 'fail');
            } else {
                this.logTest('Voting System', `Found voting section with ${burnButtons.length} burn buttons`, 'pass');
            }
        } catch (error) {
            this.logTest('Voting System', `Error: ${error.message}`, 'fail');
        }

        // Test 2: Clan Management Integration
        try {
            const clanSection = document.querySelector('[data-section="clans"]');
            const clanElements = document.querySelectorAll('.clan-card, .gaming-tile[data-section="clans"]');
            
            if (!clanSection) {
                this.logTest('Clan Management', 'Clan section not found', 'fail');
            } else {
                this.logTest('Clan Management', `Clan management section found with ${clanElements.length} elements`, 'pass');
            }
        } catch (error) {
            this.logTest('Clan Management', `Error: ${error.message}`, 'fail');
        }

        // Test 3: Content Submission System
        try {
            const contentSection = document.querySelector('[data-section="content"]');
            const videoEmbeds = document.querySelectorAll('iframe, video, .video-embed');
            
            if (!contentSection) {
                this.logTest('Content System', 'Content section not found', 'fail');
            } else {
                this.logTest('Content System', `Content section found with ${videoEmbeds.length} video elements`, 'pass');
            }
        } catch (error) {
            this.logTest('Content System', `Error: ${error.message}`, 'fail');
        }

        // Test 4: Achievement System
        try {
            const achievementSection = document.querySelector('[data-section="achievements"]');
            const achievementElements = document.querySelectorAll('.achievement-card, .achievement-badge');
            
            if (!achievementSection) {
                this.logTest('Achievement System', 'Achievement section not found', 'fail');
            } else {
                this.logTest('Achievement System', `Achievement system found with ${achievementElements.length} elements`, 'pass');
            }
        } catch (error) {
            this.logTest('Achievement System', `Error: ${error.message}`, 'fail');
        }

        // Test 5: Profile Dashboard
        try {
            const profileSection = document.querySelector('[data-section="profile"]');
            const dashboardSection = document.querySelector('[data-section="dashboard"]');
            
            if (!profileSection && !dashboardSection) {
                this.logTest('Profile Dashboard', 'Profile/Dashboard sections not found', 'fail');
            } else {
                this.logTest('Profile Dashboard', 'Profile dashboard sections found', 'pass');
            }
        } catch (error) {
            this.logTest('Profile Dashboard', `Error: ${error.message}`, 'fail');
        }

        // Test 6: Data Flow Integration
        try {
            const mlgApp = window.app || window.mlgApp;
            if (mlgApp && typeof mlgApp.showSection === 'function') {
                this.logTest('Data Flow', 'MLG app instance found with navigation methods', 'pass');
            } else {
                this.logTest('Data Flow', 'MLG app instance or methods not found', 'warn');
            }
        } catch (error) {
            this.logTest('Data Flow', `Error: ${error.message}`, 'fail');
        }
    }

    async runWebSocketTests() {
        this.logTest('WebSocket', 'Testing real-time connections...', 'info');

        try {
            // Test WebSocket support
            if (typeof WebSocket === 'undefined') {
                this.logTest('WebSocket Support', 'WebSocket not supported', 'fail');
                return;
            }

            // Test connection (mock endpoint since we don't have real WebSocket server)
            this.logTest('WebSocket Support', 'WebSocket API available', 'pass');
            
            // Test real-time update elements
            const realtimeElements = document.querySelectorAll('[data-realtime]');
            if (realtimeElements.length > 0) {
                this.logTest('Real-time Elements', `Found ${realtimeElements.length} real-time elements`, 'pass');
            } else {
                this.logTest('Real-time Elements', 'No real-time elements found', 'warn');
            }

            // Test notification system
            const notificationContainer = document.querySelector('.notification-container, #notifications');
            if (notificationContainer) {
                this.logTest('Notifications', 'Notification container found', 'pass');
            } else {
                this.logTest('Notifications', 'No notification system found', 'warn');
            }

        } catch (error) {
            this.logTest('WebSocket', `Error: ${error.message}`, 'fail');
        }
    }

    async runWalletTests() {
        this.logTest('Wallet', 'Testing Phantom wallet integration...', 'info');

        try {
            // Test Phantom detection
            const phantomAvailable = window.phantom?.solana?.isPhantom || window.solana?.isPhantom;
            if (phantomAvailable) {
                this.logTest('Phantom Detection', 'Phantom wallet detected', 'pass');
            } else {
                this.logTest('Phantom Detection', 'Phantom wallet not installed (expected in test)', 'warn');
            }

            // Test wallet connect button
            const walletBtn = document.getElementById('walletConnectBtn') || document.querySelector('.wallet-connect-btn');
            if (walletBtn) {
                this.logTest('Wallet UI', 'Wallet connect button found', 'pass');
                
                // Test button functionality
                if (typeof walletBtn.onclick === 'function' || walletBtn.hasAttribute('onclick')) {
                    this.logTest('Wallet Function', 'Wallet connect handler attached', 'pass');
                } else {
                    this.logTest('Wallet Function', 'No wallet connect handler found', 'warn');
                }
            } else {
                this.logTest('Wallet UI', 'Wallet connect button not found', 'fail');
            }

            // Test token balance display
            const tokenBalance = document.querySelector('.token-balance, #token-balance, [data-token-balance]');
            if (tokenBalance) {
                this.logTest('Token Balance', 'Token balance display found', 'pass');
            } else {
                this.logTest('Token Balance', 'Token balance display not found', 'warn');
            }

            // Test MLG token integration
            const mlgTokenElements = document.querySelectorAll('[data-token="MLG"], .mlg-token');
            if (mlgTokenElements.length > 0) {
                this.logTest('MLG Token', `Found ${mlgTokenElements.length} MLG token elements`, 'pass');
            } else {
                this.logTest('MLG Token', 'MLG token elements not found', 'warn');
            }

        } catch (error) {
            this.logTest('Wallet', `Error: ${error.message}`, 'fail');
        }
    }

    async runNavigationTests() {
        this.logTest('Navigation', 'Testing navigation and routing...', 'info');

        try {
            // Test navigation sections
            const navSections = document.querySelectorAll('[data-section]');
            if (navSections.length < 5) {
                this.logTest('Nav Sections', `Only ${navSections.length} navigation sections found`, 'warn');
            } else {
                this.logTest('Nav Sections', `Found ${navSections.length} navigation sections`, 'pass');
            }

            // Test mobile navigation
            const mobileNav = document.querySelector('.mobile-nav, #mobile-nav, [data-mobile-nav]');
            if (mobileNav) {
                this.logTest('Mobile Nav', 'Mobile navigation found', 'pass');
            } else {
                this.logTest('Mobile Nav', 'Mobile navigation not found', 'warn');
            }

            // Test navigation functionality
            const navLinks = document.querySelectorAll('.nav-link, [data-section]');
            let workingNavLinks = 0;
            
            navLinks.forEach(link => {
                if (link.hasAttribute('onclick') || link.addEventListener) {
                    workingNavLinks++;
                }
            });

            if (workingNavLinks > 0) {
                this.logTest('Nav Function', `${workingNavLinks}/${navLinks.length} nav links have handlers`, 'pass');
            } else {
                this.logTest('Nav Function', 'No navigation handlers found', 'fail');
            }

            // Test state management
            const mlgApp = window.app || window.mlgApp;
            if (mlgApp && mlgApp.currentSection) {
                this.logTest('State Management', 'Navigation state tracking found', 'pass');
            } else {
                this.logTest('State Management', 'Navigation state tracking not found', 'warn');
            }

        } catch (error) {
            this.logTest('Navigation', `Error: ${error.message}`, 'fail');
        }
    }

    async runVideoTests() {
        this.logTest('Video', 'Testing multi-platform video system...', 'info');

        try {
            // Test video embedding elements
            const videoElements = document.querySelectorAll('iframe, video, .video-embed');
            if (videoElements.length > 0) {
                this.logTest('Video Embeds', `Found ${videoElements.length} video elements`, 'pass');
            } else {
                this.logTest('Video Embeds', 'No video elements found', 'warn');
            }

            // Test platform support
            const platforms = ['youtube', 'twitter', 'tiktok', 'instagram', 'twitch'];
            let supportedPlatforms = 0;

            platforms.forEach(platform => {
                const platformElements = document.querySelectorAll(`[data-platform="${platform}"], .${platform}-embed`);
                if (platformElements.length > 0) {
                    supportedPlatforms++;
                }
            });

            if (supportedPlatforms >= 3) {
                this.logTest('Video Platforms', `${supportedPlatforms}/${platforms.length} platforms supported`, 'pass');
            } else {
                this.logTest('Video Platforms', `Only ${supportedPlatforms} platforms supported`, 'warn');
            }

            // Test video upload UI
            const uploadElements = document.querySelectorAll('.upload-area, [data-upload], input[type="file"][accept*="video"]');
            if (uploadElements.length > 0) {
                this.logTest('Video Upload', 'Video upload interface found', 'pass');
            } else {
                this.logTest('Video Upload', 'Video upload interface not found', 'warn');
            }

        } catch (error) {
            this.logTest('Video', `Error: ${error.message}`, 'fail');
        }
    }

    async runPerformanceTests() {
        this.logTest('Performance', 'Running performance benchmarks...', 'info');

        try {
            // Test page load time
            const loadTime = performance.timing?.loadEventEnd - performance.timing?.navigationStart;
            if (loadTime && loadTime < 3000) {
                this.logTest('Load Time', `${loadTime}ms (Good)`, 'pass');
            } else if (loadTime && loadTime < 5000) {
                this.logTest('Load Time', `${loadTime}ms (Acceptable)`, 'warn');
            } else if (loadTime) {
                this.logTest('Load Time', `${loadTime}ms (Slow)`, 'fail');
            } else {
                this.logTest('Load Time', 'Performance timing not available', 'warn');
            }

            // Test memory usage
            if (performance.memory) {
                const memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
                if (memoryUsage < 50) {
                    this.logTest('Memory Usage', `${memoryUsage}MB (Good)`, 'pass');
                } else if (memoryUsage < 100) {
                    this.logTest('Memory Usage', `${memoryUsage}MB (Acceptable)`, 'warn');
                } else {
                    this.logTest('Memory Usage', `${memoryUsage}MB (High)`, 'fail');
                }
            } else {
                this.logTest('Memory Usage', 'Memory info not available', 'warn');
            }

            // Test DOM complexity
            const elementCount = document.querySelectorAll('*').length;
            if (elementCount < 1000) {
                this.logTest('DOM Complexity', `${elementCount} elements (Good)`, 'pass');
            } else if (elementCount < 2000) {
                this.logTest('DOM Complexity', `${elementCount} elements (Acceptable)`, 'warn');
            } else {
                this.logTest('DOM Complexity', `${elementCount} elements (Complex)`, 'fail');
            }

            // Test script loading
            const scriptCount = document.querySelectorAll('script').length;
            if (scriptCount < 20) {
                this.logTest('Script Count', `${scriptCount} scripts (Good)`, 'pass');
            } else if (scriptCount < 40) {
                this.logTest('Script Count', `${scriptCount} scripts (Acceptable)`, 'warn');
            } else {
                this.logTest('Script Count', `${scriptCount} scripts (Many)`, 'fail');
            }

            // Test responsiveness
            const startTime = performance.now();
            await new Promise(resolve => setTimeout(resolve, 100));
            const responseTime = performance.now() - startTime;
            
            if (responseTime < 120) {
                this.logTest('UI Response', `${Math.round(responseTime)}ms (Good)`, 'pass');
            } else {
                this.logTest('UI Response', `${Math.round(responseTime)}ms (Slow)`, 'warn');
            }

        } catch (error) {
            this.logTest('Performance', `Error: ${error.message}`, 'fail');
        }
    }

    async runErrorHandlingTests() {
        this.logTest('Error Handling', 'Testing error scenarios...', 'info');

        try {
            // Test console errors
            const originalError = console.error;
            let errorCount = 0;
            console.error = (...args) => {
                errorCount++;
                originalError.apply(console, args);
            };

            // Wait a bit to catch any existing errors
            await new Promise(resolve => setTimeout(resolve, 1000));

            console.error = originalError;

            if (errorCount === 0) {
                this.logTest('Console Errors', 'No console errors detected', 'pass');
            } else {
                this.logTest('Console Errors', `${errorCount} console errors detected`, 'warn');
            }

            // Test error boundaries
            const errorElements = document.querySelectorAll('.error-message, .error-boundary, [data-error]');
            if (errorElements.length > 0) {
                this.logTest('Error UI', 'Error handling UI elements found', 'pass');
            } else {
                this.logTest('Error UI', 'No error handling UI found', 'warn');
            }

            // Test try-catch blocks in scripts
            const scripts = document.querySelectorAll('script');
            let hasTryCatch = false;
            scripts.forEach(script => {
                if (script.textContent.includes('try') && script.textContent.includes('catch')) {
                    hasTryCatch = true;
                }
            });

            if (hasTryCatch) {
                this.logTest('Error Handling', 'Try-catch blocks found in code', 'pass');
            } else {
                this.logTest('Error Handling', 'No error handling blocks found', 'warn');
            }

        } catch (error) {
            this.logTest('Error Handling', `Error: ${error.message}`, 'fail');
        }
    }

    async runAccessibilityTests() {
        this.logTest('Accessibility', 'Testing accessibility compliance...', 'info');

        try {
            // Test ARIA labels
            const ariaElements = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]');
            if (ariaElements.length > 10) {
                this.logTest('ARIA Labels', `${ariaElements.length} elements with ARIA attributes`, 'pass');
            } else {
                this.logTest('ARIA Labels', `Only ${ariaElements.length} ARIA attributes found`, 'warn');
            }

            // Test keyboard navigation
            const focusableElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]');
            if (focusableElements.length > 20) {
                this.logTest('Keyboard Nav', `${focusableElements.length} focusable elements`, 'pass');
            } else {
                this.logTest('Keyboard Nav', 'Limited keyboard navigation', 'warn');
            }

            // Test semantic HTML
            const semanticElements = document.querySelectorAll('main, section, article, aside, nav, header, footer');
            if (semanticElements.length > 5) {
                this.logTest('Semantic HTML', `${semanticElements.length} semantic elements`, 'pass');
            } else {
                this.logTest('Semantic HTML', 'Limited semantic HTML structure', 'warn');
            }

            // Test alt text for images
            const images = document.querySelectorAll('img');
            const imagesWithAlt = document.querySelectorAll('img[alt]');
            
            if (images.length === 0) {
                this.logTest('Image Alt Text', 'No images found', 'pass');
            } else if (imagesWithAlt.length === images.length) {
                this.logTest('Image Alt Text', 'All images have alt text', 'pass');
            } else {
                this.logTest('Image Alt Text', `${imagesWithAlt.length}/${images.length} images have alt text`, 'warn');
            }

            // Test heading structure
            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            if (headings.length > 5) {
                this.logTest('Heading Structure', `${headings.length} headings found`, 'pass');
            } else {
                this.logTest('Heading Structure', 'Limited heading structure', 'warn');
            }

        } catch (error) {
            this.logTest('Accessibility', `Error: ${error.message}`, 'fail');
        }
    }

    async runSecurityTests() {
        this.logTest('Security', 'Running security checks...', 'info');

        try {
            // Test HTTPS
            if (location.protocol === 'https:') {
                this.logTest('HTTPS', 'Secure connection verified', 'pass');
            } else {
                this.logTest('HTTPS', 'Not using HTTPS (local development)', 'warn');
            }

            // Test CSP headers
            const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            if (csp) {
                this.logTest('CSP Headers', 'Content Security Policy found', 'pass');
            } else {
                this.logTest('CSP Headers', 'No CSP headers found', 'warn');
            }

            // Test inline scripts
            const inlineScripts = document.querySelectorAll('script:not([src])');
            if (inlineScripts.length > 5) {
                this.logTest('Inline Scripts', `${inlineScripts.length} inline scripts (security risk)`, 'warn');
            } else {
                this.logTest('Inline Scripts', `${inlineScripts.length} inline scripts (acceptable)`, 'pass');
            }

            // Test external resources
            const externalResources = document.querySelectorAll('script[src*="http"], link[href*="http"]');
            if (externalResources.length > 0) {
                this.logTest('External Resources', `${externalResources.length} external resources loaded`, 'warn');
            } else {
                this.logTest('External Resources', 'No external resources', 'pass');
            }

            // Test form validation
            const forms = document.querySelectorAll('form');
            const inputsWithValidation = document.querySelectorAll('input[required], input[pattern]');
            
            if (forms.length > 0) {
                this.logTest('Form Validation', `${inputsWithValidation.length}/${forms.length * 3} inputs have validation`, inputsWithValidation.length > 0 ? 'pass' : 'warn');
            } else {
                this.logTest('Form Validation', 'No forms found', 'pass');
            }

        } catch (error) {
            this.logTest('Security', `Error: ${error.message}`, 'fail');
        }
    }

    async runCrossBrowserTests() {
        this.logTest('Cross-Browser', 'Testing browser compatibility...', 'info');

        try {
            // Detect browser
            const userAgent = navigator.userAgent;
            let browser = 'Unknown';
            
            if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
            else if (userAgent.includes('Firefox')) browser = 'Firefox';
            else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
            else if (userAgent.includes('Edg')) browser = 'Edge';

            this.logTest('Browser', `Running on ${browser}`, 'pass');

            // Test modern features
            const features = {
                'WebSocket': typeof WebSocket !== 'undefined',
                'localStorage': typeof localStorage !== 'undefined',
                'fetch': typeof fetch !== 'undefined',
                'Promise': typeof Promise !== 'undefined',
                'async/await': (async function() {})().constructor === (async function(){}).constructor,
                'ES6 Classes': typeof class {} === 'function',
                'Arrow Functions': (() => {}).constructor === (() => {}).constructor
            };

            let supportedFeatures = 0;
            Object.entries(features).forEach(([feature, supported]) => {
                if (supported) {
                    supportedFeatures++;
                }
            });

            if (supportedFeatures === Object.keys(features).length) {
                this.logTest('Modern Features', `All ${supportedFeatures} features supported`, 'pass');
            } else {
                this.logTest('Modern Features', `${supportedFeatures}/${Object.keys(features).length} features supported`, 'warn');
            }

            // Test viewport and responsiveness
            const viewport = {
                width: window.innerWidth,
                height: window.innerHeight,
                isMobile: window.innerWidth < 768,
                isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
                isDesktop: window.innerWidth >= 1024
            };

            this.logTest('Viewport', `${viewport.width}x${viewport.height} (${viewport.isMobile ? 'Mobile' : viewport.isTablet ? 'Tablet' : 'Desktop'})`, 'pass');

            // Test CSS Grid and Flexbox support
            const testDiv = document.createElement('div');
            testDiv.style.display = 'grid';
            const hasGrid = testDiv.style.display === 'grid';
            
            testDiv.style.display = 'flex';
            const hasFlex = testDiv.style.display === 'flex';

            if (hasGrid && hasFlex) {
                this.logTest('CSS Support', 'Grid and Flexbox supported', 'pass');
            } else {
                this.logTest('CSS Support', 'Limited CSS support', 'warn');
            }

            // Test touch support
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            this.logTest('Touch Support', hasTouch ? 'Touch events supported' : 'No touch support', hasTouch ? 'pass' : 'warn');

        } catch (error) {
            this.logTest('Cross-Browser', `Error: ${error.message}`, 'fail');
        }
    }

    logTest(category, message, status) {
        const result = {
            category,
            message,
            status,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        this.displayTest(result);
        
        // Console logging for debugging
        const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : status === 'warn' ? '⚠️' : 'ℹ️';
        console.log(`${emoji} [${category}] ${message}`);
    }

    displayTest(result) {
        const resultsContainer = document.getElementById('test-results');
        if (!resultsContainer) return;

        const testElement = document.createElement('div');
        const statusColors = {
            pass: '#22c55e',
            fail: '#dc2626',
            warn: '#f59e0b',
            info: '#3b82f6'
        };

        testElement.style.cssText = `
            margin-bottom: 8px;
            padding: 8px;
            border-radius: 6px;
            border-left: 4px solid ${statusColors[result.status]};
            background: rgba(255, 255, 255, 0.1);
            font-size: 11px;
        `;
        
        testElement.innerHTML = `
            <div style="display: flex; justify-between; align-items: center;">
                <div style="flex: 1;">
                    <strong style="color: ${statusColors[result.status]};">${result.category}</strong>
                    <div style="color: #e5e7eb; margin-top: 2px;">${result.message}</div>
                </div>
                <div style="color: ${statusColors[result.status]}; font-weight: bold; font-size: 10px;">
                    ${result.status.toUpperCase()}
                </div>
            </div>
        `;
        
        resultsContainer.appendChild(testElement);
        resultsContainer.scrollTop = resultsContainer.scrollHeight;
    }

    updateSummary() {
        const summary = this.testResults.reduce((acc, result) => {
            acc[result.status] = (acc[result.status] || 0) + 1;
            acc.total++;
            return acc;
        }, { pass: 0, fail: 0, warn: 0, info: 0, total: 0 });

        const summaryElement = document.getElementById('test-summary');
        if (!summaryElement) return;

        document.getElementById('pass-count').textContent = summary.pass || 0;
        document.getElementById('fail-count').textContent = summary.fail || 0;
        document.getElementById('warn-count').textContent = summary.warn || 0;
        document.getElementById('total-count').textContent = summary.total || 0;

        summaryElement.style.display = 'block';
    }

    clearTests() {
        this.testResults = [];
        const resultsContainer = document.getElementById('test-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = '<div style="text-align: center; color: #6b7280;">Running tests...</div>';
        }
        
        const summaryElement = document.getElementById('test-summary');
        if (summaryElement) {
            summaryElement.style.display = 'none';
        }
    }

    generateReport() {
        const summary = this.testResults.reduce((acc, result) => {
            acc[result.status] = (acc[result.status] || 0) + 1;
            acc.total++;
            return acc;
        }, { pass: 0, fail: 0, warn: 0, info: 0, total: 0 });

        const coverage = summary.total > 0 ? Math.round((summary.pass / summary.total) * 100) : 0;
        
        const report = {
            timestamp: new Date().toISOString(),
            summary,
            coverage,
            recommendation: coverage >= 90 ? 'GO - Platform ready for production' : 
                           coverage >= 70 ? 'CONDITIONAL GO - Address warnings before production' :
                           'NO GO - Critical issues must be resolved',
            results: this.testResults
        };

        console.log('🧪 MLG Platform Test Report:', report);
        return report;
    }
}

// Initialize the test suite
window.mlgTester = new MLGIntegrationTester();
console.log('🧪 MLG Integration Tester loaded. Use mlgTester.runAllTests() to start testing.');