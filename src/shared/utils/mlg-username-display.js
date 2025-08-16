/**
 * MLG Username Display Utility for MLG.clan Platform
 * 
 * Provides frontend utilities for displaying MLG-tagged usernames consistently 
 * across all platform UI components with Xbox 360 gaming theme styling.
 * 
 * Features:
 * - Consistent [MLG] tag rendering and styling
 * - Dynamic username display based on clan membership
 * - Xbox 360 gaming theme integration
 * - Responsive design adaptations
 * - Accessibility features for screen readers
 * - Cache management for display names
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 * @created 2025-08-13
 */

/**
 * MLG Display Configuration
 */
const MLG_DISPLAY_CONFIG = {
  // Tag Styling
  TAG_COLOR: '#00d4ff', // Gaming accent color
  TAG_BACKGROUND: 'rgba(0, 212, 255, 0.1)',
  TAG_BORDER: '1px solid rgba(0, 212, 255, 0.3)',
  TAG_BORDER_RADIUS: '4px',
  TAG_FONT_WEIGHT: '700',
  TAG_FONT_SIZE: '0.875rem',
  TAG_PADDING: '2px 6px',
  TAG_MARGIN: '0 4px 0 0',
  
  // Username Styling
  USERNAME_COLOR: '#ffffff',
  USERNAME_HOVER_COLOR: '#00d4ff',
  USERNAME_FONT_WEIGHT: '600',
  
  // Animation Settings
  HOVER_TRANSITION: 'all 0.2s ease-in-out',
  GLOW_EFFECT: '0 0 8px rgba(0, 212, 255, 0.4)',
  
  // Cache Settings
  CACHE_TTL: 300000, // 5 minutes
  CACHE_KEY_PREFIX: 'mlg_display',
  
  // Accessibility
  TAG_ARIA_LABEL: 'MLG Clan Member',
  TAG_TITLE: 'MLG Clan Member'
};

/**
 * MLG Username Display Utility Class
 */
class MLGUsernameDisplayUtil {
  constructor() {
    this.displayCache = new Map();
    this.styleSheet = null;
    this.initialized = false;
    
    this.initializeStyles();
  }

  /**
   * Initialize MLG username display styles
   */
  initializeStyles() {
    if (this.initialized) return;
    
    try {
      // Create stylesheet for MLG username styling
      this.styleSheet = document.createElement('style');
      this.styleSheet.type = 'text/css';
      this.styleSheet.id = 'mlg-username-styles';
      
      const css = `
        /* MLG Tag Styling */
        .mlg-tag {
          display: inline-block;
          background: ${MLG_DISPLAY_CONFIG.TAG_BACKGROUND};
          color: ${MLG_DISPLAY_CONFIG.TAG_COLOR};
          border: ${MLG_DISPLAY_CONFIG.TAG_BORDER};
          border-radius: ${MLG_DISPLAY_CONFIG.TAG_BORDER_RADIUS};
          font-weight: ${MLG_DISPLAY_CONFIG.TAG_FONT_WEIGHT};
          font-size: ${MLG_DISPLAY_CONFIG.TAG_FONT_SIZE};
          padding: ${MLG_DISPLAY_CONFIG.TAG_PADDING};
          margin: ${MLG_DISPLAY_CONFIG.TAG_MARGIN};
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transition: ${MLG_DISPLAY_CONFIG.HOVER_TRANSITION};
          vertical-align: middle;
        }
        
        .mlg-tag:hover {
          box-shadow: ${MLG_DISPLAY_CONFIG.GLOW_EFFECT};
          background: rgba(0, 212, 255, 0.2);
        }
        
        /* Username Container */
        .mlg-username-container {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: ${MLG_DISPLAY_CONFIG.HOVER_TRANSITION};
        }
        
        .mlg-username-container:hover .mlg-tag {
          box-shadow: ${MLG_DISPLAY_CONFIG.GLOW_EFFECT};
        }
        
        /* Username Text */
        .mlg-username {
          color: ${MLG_DISPLAY_CONFIG.USERNAME_COLOR};
          font-weight: ${MLG_DISPLAY_CONFIG.USERNAME_FONT_WEIGHT};
          transition: ${MLG_DISPLAY_CONFIG.HOVER_TRANSITION};
        }
        
        .mlg-username-container:hover .mlg-username {
          color: ${MLG_DISPLAY_CONFIG.USERNAME_HOVER_COLOR};
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          .mlg-tag {
            font-size: 0.75rem;
            padding: 1px 4px;
            margin: 0 2px 0 0;
          }
        }
        
        /* High Contrast Mode */
        @media (prefers-contrast: high) {
          .mlg-tag {
            border: 2px solid ${MLG_DISPLAY_CONFIG.TAG_COLOR};
            background: transparent;
          }
        }
        
        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .mlg-tag,
          .mlg-username-container,
          .mlg-username {
            transition: none;
          }
        }
        
        /* Dark Mode Enhancement */
        @media (prefers-color-scheme: dark) {
          .mlg-tag {
            background: rgba(0, 212, 255, 0.15);
            border-color: rgba(0, 212, 255, 0.4);
          }
        }
      `;
      
      this.styleSheet.innerHTML = css;
      document.head.appendChild(this.styleSheet);
      
      this.initialized = true;
      console.log('🎨 MLG username display styles initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize MLG username styles:', error);
    }
  }

  /**
   * Create MLG tagged username display element
   * @param {string} originalUsername - Original username
   * @param {string} displayUsername - MLG tagged username (if applicable)
   * @param {Object} options - Display options
   * @returns {HTMLElement} Styled username element
   */
  createUsernameElement(originalUsername, displayUsername = null, options = {}) {
    try {
      const {
        showTag = true,
        interactive = true,
        size = 'normal',
        userId = null,
        clanName = null
      } = options;

      // Determine if username should be tagged
      const shouldShowTag = displayUsername && displayUsername.startsWith('[MLG]');
      const username = shouldShowTag && showTag ? 
        displayUsername.replace('[MLG] ', '') : 
        (displayUsername || originalUsername);

      // Create container element
      const container = document.createElement('span');
      container.className = `mlg-username-container ${size === 'small' ? 'text-sm' : ''}`;
      
      // Add data attributes for tracking
      if (userId) container.setAttribute('data-user-id', userId);
      if (clanName) container.setAttribute('data-clan', clanName);
      
      // Create MLG tag if applicable
      if (shouldShowTag && showTag) {
        const tag = document.createElement('span');
        tag.className = 'mlg-tag';
        tag.textContent = 'MLG';
        tag.setAttribute('aria-label', MLG_DISPLAY_CONFIG.TAG_ARIA_LABEL);
        tag.setAttribute('title', MLG_DISPLAY_CONFIG.TAG_TITLE);
        tag.setAttribute('role', 'badge');
        container.appendChild(tag);
      }
      
      // Create username text element
      const usernameElement = document.createElement('span');
      usernameElement.className = 'mlg-username';
      usernameElement.textContent = username;
      usernameElement.setAttribute('data-username', originalUsername);
      
      // Add accessibility attributes
      if (shouldShowTag && showTag) {
        usernameElement.setAttribute('aria-label', `${username}, MLG clan member`);
      } else {
        usernameElement.setAttribute('aria-label', username);
      }
      
      container.appendChild(usernameElement);
      
      // Add interactive features
      if (interactive) {
        container.style.cursor = 'pointer';
        container.addEventListener('click', (e) => {
          this.handleUsernameClick(e, {
            userId,
            username: originalUsername,
            displayUsername,
            isClanMember: shouldShowTag
          });
        });
      }
      
      return container;
      
    } catch (error) {
      console.error('❌ Error creating username element:', error);
      
      // Fallback to simple text
      const fallback = document.createElement('span');
      fallback.textContent = originalUsername;
      fallback.className = 'mlg-username';
      return fallback;
    }
  }

  /**
   * Update existing username elements with MLG tagging
   * @param {string} selector - CSS selector for username elements
   * @param {Array} userData - Array of user data with MLG tagging info
   */
  updateUsernameElements(selector, userData) {
    try {
      const elements = document.querySelectorAll(selector);
      
      elements.forEach((element, index) => {
        const user = userData[index];
        if (!user) return;
        
        // Create new MLG-styled element
        const newElement = this.createUsernameElement(
          user.username || user.original_username,
          user.mlg_display_name || user.display_username,
          {
            userId: user.id || user.user_id,
            clanName: user.clan_name,
            size: element.classList.contains('text-sm') ? 'small' : 'normal'
          }
        );
        
        // Replace existing element
        element.parentNode.replaceChild(newElement, element);
      });
      
      console.log(`🔄 Updated ${elements.length} username elements with MLG tagging`);
      
    } catch (error) {
      console.error('❌ Error updating username elements:', error);
    }
  }

  /**
   * Create leaderboard username display
   * @param {Object} userData - User data with ranking info
   * @param {number} rank - User's rank position
   * @returns {HTMLElement} Formatted leaderboard entry
   */
  createLeaderboardEntry(userData, rank) {
    try {
      const entry = document.createElement('div');
      entry.className = 'leaderboard-entry flex items-center space-x-3 p-3 rounded-lg bg-gaming-bg border border-gaming-accent border-opacity-20';
      
      // Rank number
      const rankElement = document.createElement('div');
      rankElement.className = 'rank-number text-gaming-accent font-bold text-lg min-w-[3rem] text-center';
      rankElement.textContent = `#${rank}`;
      entry.appendChild(rankElement);
      
      // Avatar placeholder
      const avatar = document.createElement('div');
      avatar.className = 'avatar w-10 h-10 rounded-full bg-gaming-accent bg-opacity-20 flex items-center justify-center';
      avatar.innerHTML = '<i data-lucide="user" class="w-5 h-5 text-gaming-accent"></i>';
      entry.appendChild(avatar);
      
      // Username with MLG tag
      const usernameContainer = this.createUsernameElement(
        userData.username,
        userData.mlg_display_name,
        {
          userId: userData.id,
          clanName: userData.clan_name,
          interactive: true
        }
      );
      usernameContainer.className += ' flex-1';
      entry.appendChild(usernameContainer);
      
      // Stats (votes, MLG burned, etc.)
      if (userData.stats) {
        const statsContainer = document.createElement('div');
        statsContainer.className = 'stats flex space-x-4 text-sm text-gray-400';
        
        Object.entries(userData.stats).forEach(([key, value]) => {
          const stat = document.createElement('div');
          stat.className = 'stat';
          stat.innerHTML = `<span class="label">${key}:</span> <span class="value text-white">${value}</span>`;
          statsContainer.appendChild(stat);
        });
        
        entry.appendChild(statsContainer);
      }
      
      return entry;
      
    } catch (error) {
      console.error('❌ Error creating leaderboard entry:', error);
      return document.createElement('div');
    }
  }

  /**
   * Create voting interface username display
   * @param {Object} voterData - Voter information
   * @returns {HTMLElement} Formatted voter display
   */
  createVoterDisplay(voterData) {
    try {
      const container = document.createElement('div');
      container.className = 'voter-display flex items-center space-x-2 p-2 rounded bg-gaming-bg bg-opacity-50';
      
      // Username with MLG tag
      const usernameElement = this.createUsernameElement(
        voterData.username,
        voterData.mlg_display_name,
        {
          userId: voterData.id,
          size: 'small',
          interactive: true
        }
      );
      container.appendChild(usernameElement);
      
      // Verification badge if applicable
      if (voterData.verified) {
        const badge = document.createElement('i');
        badge.setAttribute('data-lucide', 'check-circle');
        badge.className = 'w-4 h-4 text-gaming-accent';
        container.appendChild(badge);
      }
      
      return container;
      
    } catch (error) {
      console.error('❌ Error creating voter display:', error);
      return document.createElement('div');
    }
  }

  /**
   * Handle username click events
   * @param {Event} event - Click event
   * @param {Object} userData - User data
   */
  handleUsernameClick(event, userData) {
    try {
      event.preventDefault();
      
      console.log('👤 Username clicked:', userData);
      
      // Emit custom event for username interaction
      const customEvent = new CustomEvent('mlg:username:click', {
        detail: userData,
        bubbles: true
      });
      
      event.target.dispatchEvent(customEvent);
      
      // Optional: Navigate to user profile
      if (userData.userId && window.location.pathname !== '/profile') {
        // window.location.href = `/profile?user=${userData.userId}`;
      }
      
    } catch (error) {
      console.error('❌ Error handling username click:', error);
    }
  }

  /**
   * Apply MLG tagging to all usernames on current page
   * @param {Array} usersData - Array of user data with MLG tagging
   */
  async applyMLGTaggingToPage(usersData) {
    try {
      console.log('🏷️ Applying MLG tagging to page...');
      
      // Common username selectors across the platform
      const usernameSelectors = [
        '[data-username]',
        '.username',
        '.user-name',
        '.display-name',
        '.voter-name',
        '.member-name',
        '.author-name'
      ];
      
      for (const selector of usernameSelectors) {
        const elements = document.querySelectorAll(selector);
        
        elements.forEach(element => {
          const username = element.textContent.trim();
          const userData = usersData.find(user => 
            user.username === username || 
            user.original_username === username ||
            user.display_name === username
          );
          
          if (userData && userData.mlg_display_name) {
            // Replace with MLG-styled element
            const newElement = this.createUsernameElement(
              username,
              userData.mlg_display_name,
              {
                userId: userData.id,
                clanName: userData.clan_name
              }
            );
            
            element.parentNode.replaceChild(newElement, element);
          }
        });
      }
      
      console.log('✅ MLG tagging applied to page');
      
    } catch (error) {
      console.error('❌ Error applying MLG tagging to page:', error);
    }
  }

  /**
   * Get cached display name
   * @param {string} userId - User ID
   * @returns {string|null} Cached display name
   */
  getCachedDisplayName(userId) {
    const cacheKey = `${MLG_DISPLAY_CONFIG.CACHE_KEY_PREFIX}:${userId}`;
    const cached = this.displayCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < MLG_DISPLAY_CONFIG.CACHE_TTL) {
      return cached.displayName;
    }
    
    return null;
  }

  /**
   * Cache display name
   * @param {string} userId - User ID
   * @param {string} displayName - Display name to cache
   */
  cacheDisplayName(userId, displayName) {
    const cacheKey = `${MLG_DISPLAY_CONFIG.CACHE_KEY_PREFIX}:${userId}`;
    this.displayCache.set(cacheKey, {
      displayName,
      timestamp: Date.now()
    });
  }

  /**
   * Clean expired cache entries
   */
  cleanCache() {
    const now = Date.now();
    for (const [key, entry] of this.displayCache.entries()) {
      if (now - entry.timestamp > MLG_DISPLAY_CONFIG.CACHE_TTL) {
        this.displayCache.delete(key);
      }
    }
  }

  /**
   * Get utility statistics
   * @returns {Object} Utility statistics
   */
  getStatistics() {
    return {
      initialized: this.initialized,
      cachedDisplayNames: this.displayCache.size,
      config: MLG_DISPLAY_CONFIG
    };
  }

  /**
   * Cleanup utility
   */
  cleanup() {
    try {
      // Clear cache
      this.displayCache.clear();
      
      // Remove stylesheet
      if (this.styleSheet && this.styleSheet.parentNode) {
        this.styleSheet.parentNode.removeChild(this.styleSheet);
      }
      
      this.initialized = false;
      console.log('🧹 MLG username display utility cleaned up');
      
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }
}

// Global instance
const mlgUsernameDisplay = new MLGUsernameDisplayUtil();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 MLG Username Display Utility ready');
  });
} else {
  console.log('🚀 MLG Username Display Utility ready');
}

// Export for use in other modules
export { MLGUsernameDisplayUtil, MLG_DISPLAY_CONFIG, mlgUsernameDisplay };
export default mlgUsernameDisplay;