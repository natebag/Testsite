/**
 * MLG Branding Initialization Script
 * 
 * Automatically initializes and applies MLG branding across all pages
 * when the DOM is loaded. Integrates with the username tagging system
 * and ensures consistent visual identity.
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 * @created 2025-08-13
 * @task Task 21.2 - Add MLG branding to profile headers and rosters
 */

import { MLGBrandingSystem, MLGBrandingUtils } from '../components/mlg-branding-system.js';
import { MLGUsernameTaggingService } from '../../core/auth/mlg-username-tagging-service.js';

/**
 * MLG Branding Initialization Manager
 */
class MLGBrandingInitializer {
  constructor() {
    this.brandingSystem = null;
    this.usernameTaggingService = null;
    this.isInitialized = false;
    this.logger = console;
    
    this.logger.info('🏆 MLG Branding Initializer created');
  }

  /**
   * Initialize MLG branding on page load
   */
  async initialize() {
    try {
      if (this.isInitialized) return;
      
      this.logger.info('🚀 Initializing MLG Branding System...');
      
      // Initialize branding system
      this.brandingSystem = new MLGBrandingSystem({
        logger: this.logger
      });
      
      await this.brandingSystem.initialize();
      
      // Initialize username tagging service
      this.usernameTaggingService = new MLGUsernameTaggingService({
        logger: this.logger
      });
      
      await this.usernameTaggingService.initialize();
      
      // Apply branding to existing elements
      this.applyBrandingToExistingElements();
      
      // Set up dynamic branding for new elements
      this.setupDynamicBranding();
      
      // Make utilities globally available
      this.setupGlobalUtilities();
      
      this.isInitialized = true;
      this.logger.info('✅ MLG Branding System fully initialized');
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize MLG Branding System:', error);
    }
  }

  /**
   * Apply branding to existing elements on the page
   */
  applyBrandingToExistingElements() {
    try {
      this.logger.info('🎨 Applying MLG branding to existing elements...');
      
      // Apply to profile headers
      const profileHeaders = document.querySelectorAll('[data-mlg-branding="header"], .profile-header');
      profileHeaders.forEach(header => {
        this.brandingSystem.enhanceExistingElement(header, 'header');
      });
      
      // Apply to roster displays
      const rosterDisplays = document.querySelectorAll('[data-mlg-branding="roster"], .clan-member-roster');
      rosterDisplays.forEach(roster => {
        this.brandingSystem.enhanceExistingElement(roster, 'roster');
      });
      
      // Apply to profile cards
      const profileCards = document.querySelectorAll('[data-mlg-branding="profile"], .profile-card');
      profileCards.forEach(card => {
        this.brandingSystem.enhanceExistingElement(card, 'profile');
      });
      
      // Apply to general cards
      const generalCards = document.querySelectorAll('[data-mlg-branding="card"]');
      generalCards.forEach(card => {
        this.brandingSystem.enhanceExistingElement(card, 'card');
      });
      
      // Apply username tagging to existing usernames
      this.applyUsernameTagging();
      
      this.logger.info('✅ Applied branding to existing elements');
      
    } catch (error) {
      this.logger.error('❌ Error applying branding to existing elements:', error);
    }
  }

  /**
   * Apply username tagging to existing username displays
   */
  applyUsernameTagging() {
    try {
      // Find and enhance usernames
      const usernameElements = document.querySelectorAll('.username, .user-name, [data-username]');
      
      usernameElements.forEach(element => {
        const username = element.textContent || element.dataset.username;
        if (username && !element.querySelector('.mlg-tag')) {
          // Check if this should be an MLG member (simplified check)
          const isClanMember = element.closest('.clan-member, .mlg-member') || 
                              element.classList.contains('clan-member') ||
                              element.dataset.clanMember === 'true';
          
          if (isClanMember) {
            // Apply MLG tagging
            const taggedElement = this.createMLGTaggedUsername(username);
            element.innerHTML = '';
            element.appendChild(taggedElement);
          }
        }
      });
      
    } catch (error) {
      this.logger.error('❌ Error applying username tagging:', error);
    }
  }

  /**
   * Create MLG tagged username element
   * @param {string} username - Original username
   * @returns {HTMLElement} Tagged username element
   */
  createMLGTaggedUsername(username) {
    const container = document.createElement('span');
    container.className = 'mlg-tagged-username flex items-center space-x-2';
    
    // MLG tag
    const tag = document.createElement('span');
    tag.className = 'mlg-tag bg-gaming-accent bg-opacity-20 text-gaming-accent px-2 py-1 rounded text-xs font-bold border border-gaming-accent border-opacity-50';
    tag.textContent = '[MLG]';
    
    // Username
    const usernameSpan = document.createElement('span');
    usernameSpan.className = 'mlg-username text-gaming-accent font-semibold';
    usernameSpan.textContent = username;
    
    container.appendChild(tag);
    container.appendChild(usernameSpan);
    
    return container;
  }

  /**
   * Set up dynamic branding for elements added after page load
   */
  setupDynamicBranding() {
    try {
      // Set up MutationObserver to watch for new elements
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.applyBrandingToNewElement(node);
            }
          });
        });
      });
      
      // Start observing
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      this.logger.debug('🔍 Dynamic branding observer setup complete');
      
    } catch (error) {
      this.logger.error('❌ Error setting up dynamic branding:', error);
    }
  }

  /**
   * Apply branding to newly added elements
   * @param {HTMLElement} element - New element to brand
   */
  applyBrandingToNewElement(element) {
    try {
      // Check for branding attributes
      const brandingType = element.dataset.mlgBranding;
      if (brandingType) {
        this.brandingSystem.enhanceExistingElement(element, brandingType);
        return;
      }
      
      // Check for specific classes
      if (element.classList.contains('profile-header')) {
        this.brandingSystem.enhanceExistingElement(element, 'header');
      } else if (element.classList.contains('clan-member-roster')) {
        this.brandingSystem.enhanceExistingElement(element, 'roster');
      } else if (element.classList.contains('profile-card')) {
        this.brandingSystem.enhanceExistingElement(element, 'profile');
      }
      
      // Check for username elements within the new element
      const usernameElements = element.querySelectorAll('.username, .user-name, [data-username]');
      if (usernameElements.length > 0) {
        this.applyUsernameTagging();
      }
      
    } catch (error) {
      this.logger.error('❌ Error applying branding to new element:', error);
    }
  }

  /**
   * Set up global utilities
   */
  setupGlobalUtilities() {
    try {
      // Make branding utilities globally available
      window.MLGBranding = {
        system: this.brandingSystem,
        tagging: this.usernameTaggingService,
        utils: MLGBrandingUtils,
        
        // Convenience methods
        addBranding: (element, variant) => {
          if (typeof element === 'string') {
            element = document.querySelector(element);
          }
          if (element && this.brandingSystem) {
            this.brandingSystem.enhanceExistingElement(element, variant);
          }
        },
        
        createBrandElement: (variant, options) => {
          if (this.brandingSystem) {
            return this.brandingSystem.createBrandingElement(variant, options);
          }
          return null;
        },
        
        tagUsername: (username, options) => {
          if (this.usernameTaggingService) {
            return this.usernameTaggingService.tagUsername(username, options);
          }
          return username;
        }
      };
      
      // Emit initialization complete event
      window.dispatchEvent(new CustomEvent('mlg:branding:ready', {
        detail: {
          brandingSystem: this.brandingSystem,
          usernameTaggingService: this.usernameTaggingService
        }
      }));
      
      this.logger.debug('🌐 Global utilities setup complete');
      
    } catch (error) {
      this.logger.error('❌ Error setting up global utilities:', error);
    }
  }

  /**
   * Get initialization statistics
   * @returns {Object} Initialization stats
   */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      brandingSystemReady: !!this.brandingSystem?.isInitialized,
      usernameTaggingReady: !!this.usernameTaggingService?.isInitialized,
      elementsEnhanced: this.brandingSystem?.cache?.size || 0
    };
  }
}

// Auto-initialize when DOM is ready
let initializer = null;

function initializeMLGBranding() {
  if (!initializer) {
    initializer = new MLGBrandingInitializer();
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializer.initialize();
    });
  } else {
    // DOM is already ready
    initializer.initialize();
  }
}

// Initialize immediately
initializeMLGBranding();

// Export for manual initialization if needed
export { MLGBrandingInitializer, initializeMLGBranding };
export default initializer;