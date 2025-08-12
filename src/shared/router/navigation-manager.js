/**
 * MLG.clan Navigation Manager
 * Centralized navigation system that works with both SPA and multi-page modes
 * Provides consistent navigation behavior and active state management
 */

class NavigationManager {
  constructor() {
    this.currentPage = this.getCurrentPage();
    this.routerAvailable = false;
    this.pageColorMap = {
      'index.html': { bg: 'bg-gaming-accent', text: 'text-black' },
      'voting.html': { bg: 'bg-gaming-accent', text: 'text-black' },
      'clans.html': { bg: 'bg-gaming-purple', text: 'text-white' },
      'content.html': { bg: 'bg-gaming-blue', text: 'text-white' },
      'dao.html': { bg: 'bg-gaming-yellow', text: 'text-black' },
      'analytics.html': { bg: 'bg-gaming-red', text: 'text-white' },
      'profile.html': { bg: 'bg-gaming-accent', text: 'text-black' }
    };
    
    this.init();
  }

  /**
   * Initialize the navigation manager
   */
  init() {
    this.checkRouterAvailability();
    this.setupEventListeners();
    this.updateActiveNavigation();
    
    console.log('🧭 Navigation Manager initialized for:', this.currentPage);
  }

  /**
   * Check if SPA router is available and ready
   */
  checkRouterAvailability() {
    this.routerAvailable = !!(
      window.router && 
      window.router.push && 
      typeof window.router.push === 'function'
    );
    
    // Re-check periodically for late router initialization
    if (!this.routerAvailable) {
      setTimeout(() => this.checkRouterAvailability(), 1000);
    }
  }

  /**
   * Get current page filename from URL
   */
  getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
    return filename === '' ? 'index.html' : filename;
  }

  /**
   * Universal navigation handler for both SPA and multi-page modes
   */
  handleNavigation(event, pageUrl) {
    // Check if SPA router is available and ready
    if (this.routerAvailable) {
      event.preventDefault();
      const routePath = '/' + pageUrl.replace('.html', '').replace('index', 'dashboard');
      
      try {
        window.router.push(routePath);
        this.currentPage = pageUrl;
        this.updateActiveNavigation();
      } catch (error) {
        console.warn('🧭 Router navigation failed, falling back to page reload:', error);
        window.location.href = pageUrl;
      }
    } else {
      // Let the default link behavior happen (multi-page navigation)
      console.log('🧭 Using multi-page navigation to:', pageUrl);
    }
  }

  /**
   * Navigate to a page programmatically
   */
  navigateToPage(pageUrl) {
    if (this.routerAvailable) {
      const routePath = '/' + pageUrl.replace('.html', '').replace('index', 'dashboard');
      try {
        window.router.push(routePath);
        this.currentPage = pageUrl;
        this.updateActiveNavigation();
      } catch (error) {
        console.warn('🧭 Router navigation failed, falling back to page reload:', error);
        window.location.href = pageUrl;
      }
    } else {
      window.location.href = pageUrl;
    }
  }

  /**
   * Update active navigation states across all nav links
   */
  updateActiveNavigation() {
    // Remove all active classes from nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      // Remove all possible active classes
      Object.values(this.pageColorMap).forEach(colors => {
        link.classList.remove(colors.bg, colors.text);
      });
      link.classList.add('text-gray-300');
    });

    // Add active class to current page link
    const activeLink = document.querySelector(`.nav-link[href="${this.currentPage}"]`);
    if (activeLink && this.pageColorMap[this.currentPage]) {
      const colors = this.pageColorMap[this.currentPage];
      activeLink.classList.remove('text-gray-300');
      activeLink.classList.add(colors.bg, colors.text);
    }

    // Special handling for profile page (icon in user menu)
    if (this.currentPage === 'profile.html') {
      const profileIcon = document.querySelector('a[href="profile.html"]');
      if (profileIcon) {
        profileIcon.classList.add('text-gaming-accent');
        profileIcon.classList.remove('text-gray-300');
      }
    }

    // Update page title and meta if needed
    this.updatePageMeta();
  }

  /**
   * Update page title and meta information
   */
  updatePageMeta() {
    const pageTitles = {
      'index.html': 'Dashboard - MLG.clan Gaming Platform',
      'voting.html': 'Vote Vault - MLG Token Burn Voting | MLG.clan',
      'clans.html': 'Clan Hub - Complete Clan Management | MLG.clan',
      'content.html': 'Content Hub - Multi-Platform Integration | MLG.clan',
      'dao.html': 'DAO Governance - Democratic Control | MLG.clan',
      'analytics.html': 'Analytics Dashboard - Platform Insights | MLG.clan',
      'profile.html': 'User Profile - Gaming Profile Management | MLG.clan'
    };

    if (pageTitles[this.currentPage]) {
      document.title = pageTitles[this.currentPage];
    }
  }

  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    // Listen for router navigation events
    window.addEventListener('router:navigate', (event) => {
      if (event.detail && event.detail.to) {
        const pageName = event.detail.to.replace('/', '').replace('dashboard', 'index') + '.html';
        this.currentPage = pageName;
        this.updateActiveNavigation();
      }
    });

    // Listen for popstate events (back/forward buttons)
    window.addEventListener('popstate', () => {
      this.currentPage = this.getCurrentPage();
      this.updateActiveNavigation();
    });
  }

  /**
   * Get navigation status
   */
  getStatus() {
    return {
      currentPage: this.currentPage,
      routerAvailable: this.routerAvailable,
      activeNavigation: document.querySelector('.nav-link[href="' + this.currentPage + '"]') !== null
    };
  }

  /**
   * Force update navigation state (useful for manual updates)
   */
  forceUpdate() {
    this.currentPage = this.getCurrentPage();
    this.checkRouterAvailability();
    this.updateActiveNavigation();
  }
}

// Create global navigation manager instance
let navigationManager = null;

/**
 * Initialize navigation manager when DOM is ready
 */
function initNavigationManager() {
  if (!navigationManager) {
    navigationManager = new NavigationManager();
    
    // Make navigation functions globally available for backward compatibility
    window.handleNavigation = (event, pageUrl) => navigationManager.handleNavigation(event, pageUrl);
    window.navigateToPage = (pageUrl) => navigationManager.navigateToPage(pageUrl);
    window.updateActiveNavigation = () => navigationManager.updateActiveNavigation();
    
    // Export navigation manager instance
    window.navigationManager = navigationManager;
    
    console.log('✅ Global navigation system ready');
  }
  
  return navigationManager;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavigationManager);
} else {
  initNavigationManager();
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NavigationManager;
}

// Export for ES6 modules
if (typeof window !== 'undefined') {
  window.NavigationManager = NavigationManager;
}