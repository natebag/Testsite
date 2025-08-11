/**
 * MLG.clan Platform Accessibility Enhancement Patch
 * Adds comprehensive ARIA attributes and accessibility features
 */

class AccessibilityEnhancer {
    constructor() {
        this.init();
    }

    init() {
        console.log('🔧 Applying accessibility enhancements...');
        this.enhanceNavigation();
        this.enhanceButtons();
        this.enhanceFormElements();
        this.enhanceInteractiveElements();
        this.addLandmarks();
        this.enhanceHeadings();
        this.addKeyboardSupport();
        console.log('✅ Accessibility enhancements applied successfully');
    }

    enhanceNavigation() {
        // Add ARIA attributes to navigation elements
        const navLinks = document.querySelectorAll('[data-section]');
        navLinks.forEach((link, index) => {
            const section = link.getAttribute('data-section');
            link.setAttribute('aria-label', `Navigate to ${section.charAt(0).toUpperCase() + section.slice(1)} section`);
            link.setAttribute('role', 'menuitem');
            link.setAttribute('tabindex', '0');
        });

        // Enhance main navigation container
        const navContainer = document.querySelector('.nav-link')?.closest('.hidden.lg\\:flex');
        if (navContainer) {
            navContainer.setAttribute('role', 'menubar');
            navContainer.setAttribute('aria-label', 'Main navigation menu');
        }

        // Enhance mobile navigation
        const mobileNavLinks = document.querySelectorAll('[data-mobile-nav] a, .mobile-nav a');
        mobileNavLinks.forEach(link => {
            if (!link.hasAttribute('aria-label')) {
                const text = link.textContent.trim();
                link.setAttribute('aria-label', `Navigate to ${text}`);
            }
        });
    }

    enhanceButtons() {
        // Enhance wallet connect button
        const walletBtn = document.getElementById('walletConnectBtn');
        if (walletBtn) {
            walletBtn.setAttribute('aria-label', 'Connect Phantom wallet to access Web3 features');
            walletBtn.setAttribute('aria-describedby', 'wallet-status');
        }

        // Enhance burn vote buttons
        const burnButtons = document.querySelectorAll('.burn-vote-btn');
        burnButtons.forEach((btn, index) => {
            btn.setAttribute('aria-label', `Burn MLG tokens to vote on proposal ${index + 1}`);
            btn.setAttribute('role', 'button');
            btn.setAttribute('aria-describedby', 'voting-instructions');
        });

        // Enhance gaming tiles
        const gamingTiles = document.querySelectorAll('.gaming-tile');
        gamingTiles.forEach(tile => {
            const section = tile.getAttribute('data-section');
            if (section) {
                tile.setAttribute('aria-label', `Open ${section.charAt(0).toUpperCase() + section.slice(1)} section`);
                tile.setAttribute('role', 'button');
                tile.setAttribute('tabindex', '0');
            }
        });

        // Enhance general buttons
        const buttons = document.querySelectorAll('button:not([aria-label])');
        buttons.forEach(btn => {
            const text = btn.textContent.trim();
            if (text && text.length > 0) {
                btn.setAttribute('aria-label', text);
            }
        });
    }

    enhanceFormElements() {
        // Enhance input elements
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (!input.hasAttribute('aria-label') && !input.hasAttribute('aria-labelledby')) {
                const placeholder = input.getAttribute('placeholder');
                const name = input.getAttribute('name');
                const type = input.getAttribute('type');
                
                if (placeholder) {
                    input.setAttribute('aria-label', placeholder);
                } else if (name) {
                    input.setAttribute('aria-label', name.replace(/([A-Z])/g, ' $1').trim());
                } else if (type) {
                    input.setAttribute('aria-label', `${type} input field`);
                }
            }
            
            // Add required indicator
            if (input.hasAttribute('required')) {
                const currentLabel = input.getAttribute('aria-label') || '';
                input.setAttribute('aria-label', `${currentLabel} (required)`);
            }
        });

        // Enhance file upload areas
        const uploadAreas = document.querySelectorAll('.upload-area, [data-upload]');
        uploadAreas.forEach(area => {
            area.setAttribute('aria-label', 'Drag and drop files here or click to select files');
            area.setAttribute('role', 'button');
            area.setAttribute('tabindex', '0');
        });
    }

    enhanceInteractiveElements() {
        // Enhance clan cards
        const clanCards = document.querySelectorAll('.clan-card');
        clanCards.forEach((card, index) => {
            card.setAttribute('aria-label', `Clan information card ${index + 1}`);
            card.setAttribute('role', 'article');
        });

        // Enhance achievement cards
        const achievementCards = document.querySelectorAll('.achievement-card');
        achievementCards.forEach((card, index) => {
            const title = card.querySelector('h3, h4, .title')?.textContent?.trim();
            card.setAttribute('aria-label', title ? `Achievement: ${title}` : `Achievement card ${index + 1}`);
            card.setAttribute('role', 'article');
        });

        // Enhance video elements
        const videos = document.querySelectorAll('video');
        videos.forEach((video, index) => {
            if (!video.hasAttribute('aria-label')) {
                video.setAttribute('aria-label', `Video player ${index + 1}`);
            }
        });

        const iframes = document.querySelectorAll('iframe');
        iframes.forEach((iframe, index) => {
            if (!iframe.hasAttribute('aria-label')) {
                const src = iframe.getAttribute('src');
                if (src && src.includes('youtube')) {
                    iframe.setAttribute('aria-label', 'YouTube video player');
                } else if (src && src.includes('twitch')) {
                    iframe.setAttribute('aria-label', 'Twitch video player');
                } else {
                    iframe.setAttribute('aria-label', `Embedded content ${index + 1}`);
                }
            }
        });

        // Enhance modal and popup elements
        const modals = document.querySelectorAll('.modal, [data-modal]');
        modals.forEach(modal => {
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            if (!modal.hasAttribute('aria-label')) {
                modal.setAttribute('aria-label', 'Dialog window');
            }
        });
    }

    addLandmarks() {
        // Add main landmark
        const mainContent = document.querySelector('main, #main-content, .main-content');
        if (mainContent) {
            mainContent.setAttribute('role', 'main');
            mainContent.setAttribute('aria-label', 'Main content area');
        } else {
            // Find the main content area and add role
            const contentArea = document.querySelector('.container, .content, .max-w-7xl');
            if (contentArea) {
                contentArea.setAttribute('role', 'main');
                contentArea.setAttribute('aria-label', 'Main content area');
            }
        }

        // Add header landmark
        const header = document.querySelector('header, .header');
        if (header) {
            header.setAttribute('role', 'banner');
            header.setAttribute('aria-label', 'Site header');
        }

        // Add navigation landmark
        const nav = document.querySelector('nav');
        if (nav) {
            nav.setAttribute('role', 'navigation');
            nav.setAttribute('aria-label', 'Main navigation');
        }

        // Add complementary sections
        const sidebars = document.querySelectorAll('.sidebar, .aside, [data-sidebar]');
        sidebars.forEach(sidebar => {
            sidebar.setAttribute('role', 'complementary');
            sidebar.setAttribute('aria-label', 'Sidebar content');
        });
    }

    enhanceHeadings() {
        // Ensure proper heading hierarchy
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => {
            if (!heading.hasAttribute('id')) {
                const text = heading.textContent.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                heading.setAttribute('id', `heading-${text}`);
            }
        });

        // Add section headings where missing
        const sections = document.querySelectorAll('[data-section]');
        sections.forEach(section => {
            const sectionName = section.getAttribute('data-section');
            if (!section.querySelector('h1, h2, h3, h4, h5, h6')) {
                // Look for existing headings that could be enhanced
                const titleElements = section.querySelectorAll('.title, .section-title, .heading');
                titleElements.forEach(title => {
                    if (!title.matches('h1, h2, h3, h4, h5, h6')) {
                        title.setAttribute('role', 'heading');
                        title.setAttribute('aria-level', '2');
                    }
                });
            }
        });
    }

    addKeyboardSupport() {
        // Add keyboard support to clickable elements
        const clickableElements = document.querySelectorAll('[data-section], .gaming-tile, .clan-card, .achievement-card');
        clickableElements.forEach(element => {
            if (!element.hasAttribute('tabindex')) {
                element.setAttribute('tabindex', '0');
            }
            
            // Add keyboard event listeners
            element.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    element.click();
                }
            });
        });

        // Enhance focus indicators
        const focusableElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex="0"]');
        focusableElements.forEach(element => {
            element.addEventListener('focus', () => {
                element.style.outline = '2px solid #6ab04c';
                element.style.outlineOffset = '2px';
            });
            
            element.addEventListener('blur', () => {
                element.style.outline = '';
                element.style.outlineOffset = '';
            });
        });

        // Add skip navigation link
        this.addSkipLink();
    }

    addSkipLink() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'skip-link';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: #6ab04c;
            color: white;
            padding: 8px;
            text-decoration: none;
            border-radius: 4px;
            z-index: 10000;
            transition: top 0.3s;
        `;
        
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
        
        // Ensure main content has an ID
        let mainContent = document.getElementById('main-content');
        if (!mainContent) {
            mainContent = document.querySelector('main, .container, .max-w-7xl');
            if (mainContent) {
                mainContent.id = 'main-content';
            }
        }
    }

    // Add live region for dynamic content updates
    addLiveRegions() {
        const liveRegion = document.createElement('div');
        liveRegion.id = 'live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        document.body.appendChild(liveRegion);
        
        // Make live region globally accessible
        window.announceLiveRegion = (message) => {
            liveRegion.textContent = message;
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        };
    }

    // Generate accessibility report
    generateAccessibilityReport() {
        const report = {
            timestamp: new Date().toISOString(),
            ariaAttributes: document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby], [role]').length,
            headings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
            landmarks: document.querySelectorAll('[role="main"], [role="banner"], [role="navigation"], [role="complementary"]').length,
            focusableElements: document.querySelectorAll('button, a, input, select, textarea, [tabindex]').length,
            altText: document.querySelectorAll('img[alt]').length,
            totalImages: document.querySelectorAll('img').length
        };
        
        console.log('📊 Accessibility Enhancement Report:', report);
        return report;
    }
}

// Initialize accessibility enhancer when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.accessibilityEnhancer = new AccessibilityEnhancer();
    });
} else {
    window.accessibilityEnhancer = new AccessibilityEnhancer();
}