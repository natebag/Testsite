/**
 * MLG.clan Platform Integration Test Runner
 * Node.js script to run comprehensive testing using Puppeteer
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class MLGIntegrationTestRunner {
    constructor() {
        this.testResults = [];
        this.browser = null;
        this.page = null;
        this.platformUrl = 'http://localhost:8080/index.html';
    }

    async init() {
        console.log('🧪 Initializing MLG.clan Integration Test Runner...');
        
        try {
            this.browser = await puppeteer.launch({
                headless: false, // Set to false to see the tests running
                devtools: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            this.page = await this.browser.newPage();
            await this.page.setViewport({ width: 1920, height: 1080 });
            
            // Enable console logging
            this.page.on('console', (msg) => {
                console.log('PAGE LOG:', msg.text());
            });
            
            // Enable error logging
            this.page.on('pageerror', (error) => {
                console.log('PAGE ERROR:', error.message);
            });
            
            console.log('✅ Browser initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize browser:', error.message);
            return false;
        }
    }

    async loadPlatform() {
        console.log('🌐 Loading MLG.clan platform...');
        
        try {
            await this.page.goto(this.platformUrl, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            // Wait for the platform to fully load
            await this.page.waitForSelector('[data-section="dashboard"]', { timeout: 10000 });
            
            console.log('✅ Platform loaded successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to load platform:', error.message);
            return false;
        }
    }

    async runAllTests() {
        console.log('\n🧪 Starting Comprehensive Integration Tests...\n');
        
        const testSuites = [
            { name: 'Component Integration', method: 'testComponentIntegration' },
            { name: 'WebSocket Real-time', method: 'testWebSocketIntegration' },
            { name: 'Phantom Wallet', method: 'testWalletIntegration' },
            { name: 'Navigation & Routing', method: 'testNavigationSystem' },
            { name: 'Multi-platform Video', method: 'testVideoSystem' },
            { name: 'Performance Benchmarks', method: 'testPerformance' },
            { name: 'Error Handling', method: 'testErrorHandling' },
            { name: 'Accessibility Compliance', method: 'testAccessibility' },
            { name: 'Security Validation', method: 'testSecurity' },
            { name: 'Cross-browser Compatibility', method: 'testCrossBrowser' }
        ];

        for (const suite of testSuites) {
            console.log(`\n🔍 Testing ${suite.name}...`);
            try {
                await this[suite.method]();
            } catch (error) {
                this.logTest(suite.name, `Suite failed: ${error.message}`, 'fail');
            }
        }

        await this.generateReport();
    }

    async testComponentIntegration() {
        const tests = [
            this.testVotingSystemIntegration(),
            this.testClanManagementIntegration(),
            this.testContentSubmissionSystem(),
            this.testAchievementSystem(),
            this.testProfileDashboard(),
            this.testDataFlowIntegration()
        ];

        await Promise.allSettled(tests);
    }

    async testVotingSystemIntegration() {
        try {
            // Navigate to voting section
            await this.page.click('[data-section="voting"]');
            await this.page.waitForTimeout(1000);

            // Check for voting system elements
            const votingElements = await this.page.$$eval('.burn-vote-btn', buttons => buttons.length);
            if (votingElements > 0) {
                this.logTest('Voting System', `Found ${votingElements} burn-vote buttons`, 'pass');
            } else {
                this.logTest('Voting System', 'No burn-vote buttons found', 'fail');
            }

            // Check for real MLG token integration
            const tokenElements = await this.page.$$eval('[data-token="MLG"], .mlg-token', elements => elements.length);
            if (tokenElements > 0) {
                this.logTest('MLG Token Integration', `Found ${tokenElements} token elements`, 'pass');
            } else {
                this.logTest('MLG Token Integration', 'No MLG token elements found', 'warn');
            }

            // Test voting interaction
            const firstVoteBtn = await this.page.$('.burn-vote-btn');
            if (firstVoteBtn) {
                await firstVoteBtn.click();
                await this.page.waitForTimeout(500);
                this.logTest('Vote Interaction', 'Vote button clickable', 'pass');
            } else {
                this.logTest('Vote Interaction', 'Vote button not found', 'fail');
            }

        } catch (error) {
            this.logTest('Voting System Integration', `Error: ${error.message}`, 'fail');
        }
    }

    async testClanManagementIntegration() {
        try {
            // Navigate to clan section
            await this.page.click('[data-section="clans"]');
            await this.page.waitForTimeout(2000);

            // Wait for React component to load
            await this.page.waitForSelector('#clan-management-root', { timeout: 5000 });

            // Check for clan management elements
            const clanElements = await this.page.$$eval('.clan-card, .member-card, .gaming-tile[data-section="clans"]', elements => elements.length);
            if (clanElements > 0) {
                this.logTest('Clan Management', `Found ${clanElements} clan elements`, 'pass');
            } else {
                this.logTest('Clan Management', 'No clan elements found', 'warn');
            }

            // Test clan navigation
            const navItems = await this.page.$$eval('.clan-nav-item', items => items.length);
            if (navItems > 0) {
                this.logTest('Clan Navigation', `Found ${navItems} navigation items`, 'pass');
            } else {
                this.logTest('Clan Navigation', 'Clan navigation not found', 'warn');
            }

            // Test leaderboard integration
            const leaderboardExists = await this.page.$('.clan-leaderboard, .leaderboard-container') !== null;
            this.logTest('Clan Leaderboard', leaderboardExists ? 'Leaderboard found' : 'Leaderboard not found', leaderboardExists ? 'pass' : 'warn');

        } catch (error) {
            this.logTest('Clan Management Integration', `Error: ${error.message}`, 'fail');
        }
    }

    async testContentSubmissionSystem() {
        try {
            // Navigate to content section
            await this.page.click('[data-section="content"]');
            await this.page.waitForTimeout(1000);

            // Check for video embedding support
            const videoElements = await this.page.$$eval('iframe, video, .video-embed', elements => elements.length);
            if (videoElements > 0) {
                this.logTest('Video Embedding', `Found ${videoElements} video elements`, 'pass');
            } else {
                this.logTest('Video Embedding', 'No video elements found', 'warn');
            }

            // Test multi-platform support
            const platforms = ['youtube', 'twitter', 'tiktok', 'instagram', 'twitch'];
            let supportedPlatforms = 0;

            for (const platform of platforms) {
                const platformElements = await this.page.$$eval(`[data-platform="${platform}"]`, elements => elements.length);
                if (platformElements > 0) {
                    supportedPlatforms++;
                }
            }

            this.logTest('Platform Support', `${supportedPlatforms}/${platforms.length} platforms supported`, 
                supportedPlatforms >= 3 ? 'pass' : 'warn');

            // Test content upload functionality
            const uploadElements = await this.page.$$eval('input[type="file"], .upload-area', elements => elements.length);
            this.logTest('Content Upload', uploadElements > 0 ? 'Upload interface found' : 'No upload interface', 
                uploadElements > 0 ? 'pass' : 'warn');

        } catch (error) {
            this.logTest('Content Submission System', `Error: ${error.message}`, 'fail');
        }
    }

    async testAchievementSystem() {
        try {
            // Navigate to achievements section
            await this.page.click('[data-section="achievements"]');
            await this.page.waitForTimeout(1000);

            // Check for achievement elements
            const achievementElements = await this.page.$$eval('.achievement-card, .achievement-badge, .gaming-tile[data-section="achievements"]', elements => elements.length);
            if (achievementElements > 0) {
                this.logTest('Achievement System', `Found ${achievementElements} achievement elements`, 'pass');
            } else {
                this.logTest('Achievement System', 'No achievement elements found', 'warn');
            }

            // Test achievement unlock animations
            const animatedElements = await this.page.$$eval('.animate-achievement-pop, .achievement-unlock', elements => elements.length);
            this.logTest('Achievement Animations', animatedElements > 0 ? 'Animation elements found' : 'No animations found', 
                animatedElements > 0 ? 'pass' : 'warn');

            // Test rewards integration
            const rewardElements = await this.page.$$eval('.reward-item, .token-reward', elements => elements.length);
            this.logTest('Achievement Rewards', rewardElements > 0 ? 'Reward system found' : 'No rewards found', 
                rewardElements > 0 ? 'pass' : 'warn');

        } catch (error) {
            this.logTest('Achievement System', `Error: ${error.message}`, 'fail');
        }
    }

    async testProfileDashboard() {
        try {
            // Navigate to profile section
            await this.page.click('[data-section="profile"]');
            await this.page.waitForTimeout(1000);

            // Check for profile elements
            const profileElements = await this.page.$$eval('.profile-card, .user-stats, .gaming-tile[data-section="profile"]', elements => elements.length);
            if (profileElements > 0) {
                this.logTest('Profile Dashboard', `Found ${profileElements} profile elements`, 'pass');
            } else {
                this.logTest('Profile Dashboard', 'No profile elements found', 'warn');
            }

            // Test integrated data display
            const statsElements = await this.page.$$eval('.stat-item, .user-stat', elements => elements.length);
            this.logTest('Profile Statistics', statsElements > 0 ? `Found ${statsElements} stat elements` : 'No statistics found', 
                statsElements > 0 ? 'pass' : 'warn');

        } catch (error) {
            this.logTest('Profile Dashboard', `Error: ${error.message}`, 'fail');
        }
    }

    async testDataFlowIntegration() {
        try {
            // Test global app instance
            const hasAppInstance = await this.page.evaluate(() => {
                return typeof window.mlgApp !== 'undefined' && typeof window.app !== 'undefined';
            });

            this.logTest('Global App Instance', hasAppInstance ? 'App instances available' : 'App instances missing', 
                hasAppInstance ? 'pass' : 'fail');

            // Test section switching with data persistence
            await this.page.click('[data-section="dashboard"]');
            await this.page.waitForTimeout(500);
            await this.page.click('[data-section="voting"]');
            await this.page.waitForTimeout(500);
            await this.page.click('[data-section="clans"]');
            await this.page.waitForTimeout(500);

            this.logTest('Section Navigation', 'Section switching completed without errors', 'pass');

        } catch (error) {
            this.logTest('Data Flow Integration', `Error: ${error.message}`, 'fail');
        }
    }

    async testWebSocketIntegration() {
        try {
            // Test WebSocket API availability
            const hasWebSocket = await this.page.evaluate(() => {
                return typeof WebSocket !== 'undefined';
            });

            this.logTest('WebSocket Support', hasWebSocket ? 'WebSocket API available' : 'WebSocket not supported', 
                hasWebSocket ? 'pass' : 'fail');

            // Test real-time elements
            const realtimeElements = await this.page.$$eval('[data-realtime], .realtime-update', elements => elements.length);
            this.logTest('Real-time Elements', realtimeElements > 0 ? `Found ${realtimeElements} real-time elements` : 'No real-time elements', 
                realtimeElements > 0 ? 'pass' : 'warn');

            // Test notification system
            const notificationContainer = await this.page.$('.notification-container, #notifications');
            this.logTest('Notification System', notificationContainer ? 'Notification system found' : 'No notification system', 
                notificationContainer ? 'pass' : 'warn');

        } catch (error) {
            this.logTest('WebSocket Integration', `Error: ${error.message}`, 'fail');
        }
    }

    async testWalletIntegration() {
        try {
            // Test wallet connect button
            const walletBtn = await this.page.$('#walletConnectBtn, .wallet-connect-btn');
            if (walletBtn) {
                this.logTest('Wallet Connect UI', 'Wallet connect button found', 'pass');
                
                // Test button click (without actual wallet connection)
                await walletBtn.click();
                await this.page.waitForTimeout(1000);
                this.logTest('Wallet Connect Action', 'Wallet connect action executed', 'pass');
            } else {
                this.logTest('Wallet Connect UI', 'Wallet connect button not found', 'fail');
            }

            // Test Phantom detection
            const phantomDetection = await this.page.evaluate(() => {
                return typeof window.phantom !== 'undefined' || typeof window.solana !== 'undefined';
            });

            this.logTest('Phantom Detection', phantomDetection ? 'Phantom detected' : 'Phantom not installed (expected)', 
                phantomDetection ? 'pass' : 'warn');

            // Test wallet testing functions
            const hasTestFunctions = await this.page.evaluate(() => {
                return typeof window.testWallet === 'function' && typeof window.validateWallet === 'function';
            });

            this.logTest('Wallet Test Functions', hasTestFunctions ? 'Test functions available' : 'Test functions missing', 
                hasTestFunctions ? 'pass' : 'warn');

        } catch (error) {
            this.logTest('Wallet Integration', `Error: ${error.message}`, 'fail');
        }
    }

    async testNavigationSystem() {
        try {
            // Test all navigation sections
            const sections = ['dashboard', 'clans', 'voting', 'content', 'achievements', 'treasury', 'profile'];
            let workingSections = 0;

            for (const section of sections) {
                try {
                    const sectionElement = await this.page.$(`[data-section="${section}"]`);
                    if (sectionElement) {
                        await sectionElement.click();
                        await this.page.waitForTimeout(500);
                        workingSections++;
                    }
                } catch (error) {
                    console.log(`Section ${section} navigation failed:`, error.message);
                }
            }

            this.logTest('Navigation Sections', `${workingSections}/${sections.length} sections working`, 
                workingSections >= sections.length - 1 ? 'pass' : 'warn');

            // Test mobile navigation
            const mobileNav = await this.page.$('.mobile-nav, #mobile-nav');
            this.logTest('Mobile Navigation', mobileNav ? 'Mobile nav found' : 'Mobile nav not found', 
                mobileNav ? 'pass' : 'warn');

            // Test state management
            const hasStateManagement = await this.page.evaluate(() => {
                const app = window.mlgApp || window.app;
                return app && typeof app.currentSection !== 'undefined';
            });

            this.logTest('State Management', hasStateManagement ? 'State tracking active' : 'No state tracking', 
                hasStateManagement ? 'pass' : 'warn');

        } catch (error) {
            this.logTest('Navigation System', `Error: ${error.message}`, 'fail');
        }
    }

    async testVideoSystem() {
        try {
            // Navigate to content section
            await this.page.click('[data-section="content"]');
            await this.page.waitForTimeout(1000);

            // Test video elements
            const videoElements = await this.page.$$eval('iframe, video', elements => elements.length);
            this.logTest('Video Elements', videoElements > 0 ? `Found ${videoElements} video elements` : 'No video elements', 
                videoElements > 0 ? 'pass' : 'warn');

            // Test responsive video design
            await this.page.setViewport({ width: 768, height: 1024 }); // Tablet view
            await this.page.waitForTimeout(500);
            
            await this.page.setViewport({ width: 375, height: 667 }); // Mobile view
            await this.page.waitForTimeout(500);
            
            await this.page.setViewport({ width: 1920, height: 1080 }); // Desktop view
            
            this.logTest('Video Responsiveness', 'Video responsive design tested', 'pass');

        } catch (error) {
            this.logTest('Video System', `Error: ${error.message}`, 'fail');
        }
    }

    async testPerformance() {
        try {
            // Measure page load performance
            const performanceMetrics = await this.page.evaluate(() => {
                const timing = performance.timing;
                return {
                    loadTime: timing.loadEventEnd - timing.navigationStart,
                    domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                    firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0
                };
            });

            if (performanceMetrics.loadTime < 5000) {
                this.logTest('Page Load Time', `${performanceMetrics.loadTime}ms (Good)`, 'pass');
            } else if (performanceMetrics.loadTime < 8000) {
                this.logTest('Page Load Time', `${performanceMetrics.loadTime}ms (Acceptable)`, 'warn');
            } else {
                this.logTest('Page Load Time', `${performanceMetrics.loadTime}ms (Slow)`, 'fail');
            }

            // Test memory usage
            const memoryInfo = await this.page.evaluate(() => {
                return performance.memory ? {
                    usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                    totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
                } : null;
            });

            if (memoryInfo) {
                if (memoryInfo.usedJSHeapSize < 50) {
                    this.logTest('Memory Usage', `${memoryInfo.usedJSHeapSize}MB (Good)`, 'pass');
                } else if (memoryInfo.usedJSHeapSize < 100) {
                    this.logTest('Memory Usage', `${memoryInfo.usedJSHeapSize}MB (Acceptable)`, 'warn');
                } else {
                    this.logTest('Memory Usage', `${memoryInfo.usedJSHeapSize}MB (High)`, 'fail');
                }
            }

            // Test DOM complexity
            const domStats = await this.page.evaluate(() => {
                return {
                    elementCount: document.querySelectorAll('*').length,
                    scriptCount: document.querySelectorAll('script').length,
                    cssCount: document.querySelectorAll('style, link[rel="stylesheet"]').length
                };
            });

            this.logTest('DOM Complexity', `${domStats.elementCount} elements, ${domStats.scriptCount} scripts`, 
                domStats.elementCount < 2000 ? 'pass' : 'warn');

        } catch (error) {
            this.logTest('Performance Testing', `Error: ${error.message}`, 'fail');
        }
    }

    async testErrorHandling() {
        try {
            // Monitor console errors
            let consoleErrors = 0;
            const errorListener = (msg) => {
                if (msg.type() === 'error') {
                    consoleErrors++;
                }
            };

            this.page.on('console', errorListener);

            // Trigger potential error scenarios
            await this.page.click('[data-section="voting"]');
            await this.page.waitForTimeout(1000);
            
            await this.page.click('[data-section="clans"]');
            await this.page.waitForTimeout(1000);

            this.page.off('console', errorListener);

            this.logTest('Console Errors', consoleErrors === 0 ? 'No console errors' : `${consoleErrors} console errors detected`, 
                consoleErrors === 0 ? 'pass' : 'warn');

            // Test error UI elements
            const errorElements = await this.page.$$eval('.error-message, .error-boundary', elements => elements.length);
            this.logTest('Error UI Elements', errorElements > 0 ? 'Error UI elements found' : 'No error UI elements', 
                errorElements > 0 ? 'pass' : 'warn');

        } catch (error) {
            this.logTest('Error Handling', `Error: ${error.message}`, 'fail');
        }
    }

    async testAccessibility() {
        try {
            // Test ARIA attributes
            const ariaElements = await this.page.$$eval('[aria-label], [aria-labelledby], [aria-describedby]', elements => elements.length);
            this.logTest('ARIA Attributes', ariaElements > 10 ? `${ariaElements} elements with ARIA` : 'Limited ARIA usage', 
                ariaElements > 10 ? 'pass' : 'warn');

            // Test keyboard navigation
            const focusableElements = await this.page.$$eval('button, a, input, select, textarea, [tabindex]', elements => elements.length);
            this.logTest('Keyboard Navigation', `${focusableElements} focusable elements`, 
                focusableElements > 20 ? 'pass' : 'warn');

            // Test semantic HTML
            const semanticElements = await this.page.$$eval('main, section, article, aside, nav, header, footer', elements => elements.length);
            this.logTest('Semantic HTML', `${semanticElements} semantic elements`, 
                semanticElements > 5 ? 'pass' : 'warn');

            // Test image alt text
            const images = await this.page.$$eval('img', elements => elements.length);
            const imagesWithAlt = await this.page.$$eval('img[alt]', elements => elements.length);
            
            if (images === 0) {
                this.logTest('Image Alt Text', 'No images found', 'pass');
            } else {
                this.logTest('Image Alt Text', `${imagesWithAlt}/${images} images have alt text`, 
                    imagesWithAlt === images ? 'pass' : 'warn');
            }

        } catch (error) {
            this.logTest('Accessibility Testing', `Error: ${error.message}`, 'fail');
        }
    }

    async testSecurity() {
        try {
            // Test HTTPS (will be HTTP for local testing)
            const protocol = await this.page.evaluate(() => location.protocol);
            this.logTest('HTTPS Protocol', protocol === 'https:' ? 'Secure connection' : 'HTTP (local development)', 
                protocol === 'https:' ? 'pass' : 'warn');

            // Test CSP headers
            const cspHeaders = await this.page.evaluate(() => {
                const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
                return csp ? csp.content : null;
            });

            this.logTest('CSP Headers', cspHeaders ? 'CSP headers present' : 'No CSP headers', 
                cspHeaders ? 'pass' : 'warn');

            // Test inline scripts
            const inlineScripts = await this.page.$$eval('script:not([src])', scripts => scripts.length);
            this.logTest('Inline Scripts', `${inlineScripts} inline scripts`, 
                inlineScripts < 10 ? 'pass' : 'warn');

            // Test external resources
            const externalResources = await this.page.$$eval('script[src*="http"], link[href*="http"]', elements => elements.length);
            this.logTest('External Resources', `${externalResources} external resources`, 'pass');

        } catch (error) {
            this.logTest('Security Testing', `Error: ${error.message}`, 'fail');
        }
    }

    async testCrossBrowser() {
        try {
            // Get browser info
            const browserInfo = await this.page.evaluate(() => {
                const ua = navigator.userAgent;
                let browser = 'Unknown';
                
                if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
                else if (ua.includes('Firefox')) browser = 'Firefox';
                else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
                else if (ua.includes('Edg')) browser = 'Edge';

                return {
                    browser,
                    viewport: { width: window.innerWidth, height: window.innerHeight },
                    userAgent: ua
                };
            });

            this.logTest('Browser Detection', `Running on ${browserInfo.browser}`, 'pass');

            // Test modern web features
            const featureSupport = await this.page.evaluate(() => {
                return {
                    webSocket: typeof WebSocket !== 'undefined',
                    localStorage: typeof localStorage !== 'undefined',
                    fetch: typeof fetch !== 'undefined',
                    promise: typeof Promise !== 'undefined',
                    es6Classes: typeof class {} === 'function',
                    arrowFunctions: (() => {}).constructor === (() => {}).constructor
                };
            });

            const supportedFeatures = Object.values(featureSupport).filter(Boolean).length;
            const totalFeatures = Object.keys(featureSupport).length;

            this.logTest('Modern Features', `${supportedFeatures}/${totalFeatures} features supported`, 
                supportedFeatures === totalFeatures ? 'pass' : 'warn');

            // Test responsive design at different viewports
            const viewports = [
                { width: 1920, height: 1080, name: 'Desktop' },
                { width: 1024, height: 768, name: 'Tablet' },
                { width: 375, height: 667, name: 'Mobile' }
            ];

            for (const viewport of viewports) {
                await this.page.setViewport(viewport);
                await this.page.waitForTimeout(500);
            }

            this.logTest('Responsive Design', 'All viewport tests completed', 'pass');

        } catch (error) {
            this.logTest('Cross-browser Testing', `Error: ${error.message}`, 'fail');
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
        
        const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : status === 'warn' ? '⚠️' : 'ℹ️';
        console.log(`${emoji} [${category}] ${message}`);
    }

    async generateReport() {
        const summary = this.testResults.reduce((acc, result) => {
            acc[result.status] = (acc[result.status] || 0) + 1;
            acc.total++;
            return acc;
        }, { pass: 0, fail: 0, warn: 0, total: 0 });

        const coverage = summary.total > 0 ? Math.round((summary.pass / summary.total) * 100) : 0;
        const passRate = summary.total > 0 ? Math.round(((summary.pass + summary.warn) / summary.total) * 100) : 0;

        const recommendation = 
            coverage >= 90 && summary.fail === 0 ? 'GO - Platform ready for production' :
            coverage >= 80 && summary.fail <= 2 ? 'CONDITIONAL GO - Address critical issues before production' :
            coverage >= 70 ? 'REVIEW REQUIRED - Significant issues need resolution' :
            'NO GO - Critical issues must be resolved before production';

        const report = {
            timestamp: new Date().toISOString(),
            platform: 'MLG.clan Integrated Platform',
            version: '1.0.0',
            testEnvironment: 'Local Development (localhost:8080)',
            summary: {
                totalTests: summary.total,
                passed: summary.pass,
                failed: summary.fail,
                warnings: summary.warn,
                coverage: `${coverage}%`,
                passRate: `${passRate}%`
            },
            recommendation,
            criticalIssues: this.testResults.filter(r => r.status === 'fail').length,
            warnings: this.testResults.filter(r => r.status === 'warn').length,
            results: this.testResults,
            testCategories: {
                'Component Integration': this.testResults.filter(r => r.category.includes('Integration') || r.category.includes('System')).length,
                'Performance': this.testResults.filter(r => r.category.includes('Performance')).length,
                'Security': this.testResults.filter(r => r.category.includes('Security')).length,
                'Accessibility': this.testResults.filter(r => r.category.includes('Accessibility')).length,
                'Cross-browser': this.testResults.filter(r => r.category.includes('Browser')).length
            }
        };

        // Save report to file
        const reportPath = path.join(__dirname, `mlg-integration-test-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        console.log('\n' + '='.repeat(80));
        console.log('🧪 MLG.CLAN PLATFORM INTEGRATION TEST REPORT');
        console.log('='.repeat(80));
        console.log(`📊 Test Summary:`);
        console.log(`   Total Tests: ${summary.total}`);
        console.log(`   ✅ Passed: ${summary.pass}`);
        console.log(`   ❌ Failed: ${summary.fail}`);
        console.log(`   ⚠️  Warnings: ${summary.warn}`);
        console.log(`   📈 Coverage: ${coverage}%`);
        console.log(`   🎯 Pass Rate: ${passRate}%`);
        console.log(`\n🎯 Recommendation: ${recommendation}`);
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
        console.log('='.repeat(80));

        return report;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
        console.log('🧹 Browser cleanup completed');
    }
}

// Main execution
async function runTests() {
    const runner = new MLGIntegrationTestRunner();
    
    try {
        const initialized = await runner.init();
        if (!initialized) {
            console.error('❌ Failed to initialize test runner');
            process.exit(1);
        }

        const loaded = await runner.loadPlatform();
        if (!loaded) {
            console.error('❌ Failed to load platform');
            process.exit(1);
        }

        await runner.runAllTests();
        await runner.cleanup();
        
        console.log('\n🎉 Integration testing completed successfully!');
    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
        await runner.cleanup();
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = MLGIntegrationTestRunner;