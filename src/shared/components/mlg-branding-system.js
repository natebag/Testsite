/**
 * MLG Branding System for Profile Headers and Roster Displays
 * 
 * Provides comprehensive MLG branding components for all profile headers,
 * clan rosters, and user displays across the platform. Integrates with
 * the username tagging system from Task 21.1 to create a cohesive
 * visual identity.
 * 
 * Features:
 * - MLG logo and branding elements for profile headers
 * - Consistent MLG visual identity across all displays
 * - Professional gaming aesthetic with Xbox 360 retro theme
 * - Responsive design for mobile and desktop
 * - Integration with existing username tagging system
 * - Customizable branding components
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 * @created 2025-08-13
 * @task Task 21.2 - Add MLG branding to profile headers and rosters
 */

import { EventEmitter } from 'events';

/**
 * MLG Branding Configuration
 */
const MLG_BRANDING_CONFIG = {
  // Brand Identity
  BRAND_NAME: 'MLG',
  BRAND_TAGLINE: 'Major League Gaming',
  BRAND_MOTTO: 'Elite Gaming Excellence',
  
  // Visual Identity
  COLORS: {
    primary: '#00ff88',      // Gaming accent green
    secondary: '#00d4ff',    // Gaming blue
    tertiary: '#8b5cf6',     // Gaming purple
    accent: '#fbbf24',       // Gaming yellow
    danger: '#ef4444',       // Gaming red
    dark: '#0a0a0f',         // Gaming dark background
    surface: '#1a1a2e',      // Gaming surface
    text: '#ffffff',         // Primary text
    textMuted: '#9ca3af'     // Muted text
  },
  
  // MLG Official Typography
  FONTS: {
    primary: "'Rajdhani', 'Segoe UI', system-ui, -apple-system, sans-serif",
    heading: "'Orbitron', 'Segoe UI', system-ui, sans-serif",
    display: "'Exo 2', 'Orbitron', system-ui, sans-serif",
    gaming: "'Play', 'Rajdhani', monospace, system-ui",
    mono: "'Fira Code', 'SF Mono', 'Monaco', 'Cascadia Code', monospace"
  },
  
  // Logo Configuration
  LOGO: {
    text: '🏆 MLG',
    icon: '🎮',
    badge: '[MLG]',
    size: {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-xl',
      xlarge: 'text-2xl'
    }
  },
  
  // Animation Settings
  ANIMATIONS: {
    duration: '300ms',
    easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
    glow: {
      duration: '2s',
      intensity: 'infinite alternate'
    }
  },
  
  // Component Variants
  VARIANTS: {
    header: 'header',
    roster: 'roster', 
    profile: 'profile',
    card: 'card',
    badge: 'badge',
    mini: 'mini'
  }
};

/**
 * MLG Branding System Class
 */
class MLGBrandingSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = { ...MLG_BRANDING_CONFIG, ...options };
    this.cache = new Map();
    this.isInitialized = false;
    this.logger = options.logger || console;
    
    // Bind methods
    this.createBrandingElement = this.createBrandingElement.bind(this);
    this.createProfileHeader = this.createProfileHeader.bind(this);
    this.createRosterHeader = this.createRosterHeader.bind(this);
    this.createBrandBadge = this.createBrandBadge.bind(this);
    this.applyBrandingStyling = this.applyBrandingStyling.bind(this);
    
    this.logger.info('🏆 MLG Branding System initialized');
  }

  /**
   * Initialize the branding system
   */
  async initialize() {
    try {
      if (this.isInitialized) return;
      
      this.logger.info('🚀 Initializing MLG Branding System...');
      
      // Inject global CSS styles
      await this.injectGlobalStyles();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Apply branding to existing elements
      this.applyExistingElementBranding();
      
      this.isInitialized = true;
      this.logger.info('✅ MLG Branding System initialized successfully');
      
      return true;
    } catch (error) {
      this.logger.error('❌ Failed to initialize MLG Branding System:', error);
      throw error;
    }
  }

  /**
   * Create a branded MLG element
   * @param {string} variant - Element variant (header, roster, profile, etc.)
   * @param {Object} options - Configuration options
   * @returns {HTMLElement} Branded element
   */
  createBrandingElement(variant = 'badge', options = {}) {
    try {
      const {
        size = 'medium',
        showIcon = true,
        showText = true,
        showTagline = false,
        className = '',
        interactive = false,
        userData = null
      } = options;

      const element = document.createElement('div');
      element.className = `mlg-branding mlg-branding-${variant} ${className}`;
      
      switch (variant) {
        case 'header':
          return this.createProfileHeader(options);
        case 'roster':
          return this.createRosterHeader(options);
        case 'profile':
          return this.createProfileBranding(options);
        case 'card':
          return this.createCardBranding(options);
        case 'badge':
          return this.createBrandBadge(options);
        case 'mini':
          return this.createMiniBranding(options);
        default:
          return this.createBrandBadge(options);
      }
    } catch (error) {
      this.logger.error('❌ Error creating branding element:', error);
      return this.createFallbackElement();
    }
  }

  /**
   * Create MLG profile header branding
   * @param {Object} options - Header options
   * @returns {HTMLElement} Profile header element
   */
  createProfileHeader(options = {}) {
    const {
      userName = 'MLG Player',
      userTitle = 'Elite Member',
      showLogo = true,
      showBackground = true,
      showEffects = true,
      className = ''
    } = options;

    const header = document.createElement('div');
    header.className = `mlg-profile-header ${className}`;
    
    // Apply header styling
    this.applyBrandingStyling(header, {
      variant: 'header',
      showBackground,
      showEffects
    });

    header.innerHTML = `
      <div class="mlg-header-content">
        ${showLogo ? `
          <div class="mlg-header-logo">
            <div class="mlg-logo-container">
              <span class="mlg-logo-icon">${this.config.LOGO.icon}</span>
              <span class="mlg-logo-text">${this.config.BRAND_NAME}</span>
            </div>
            <div class="mlg-tagline">${this.config.BRAND_TAGLINE}</div>
          </div>
        ` : ''}
        
        <div class="mlg-header-user">
          <div class="mlg-user-info">
            <h1 class="mlg-user-name">${userName}</h1>
            <p class="mlg-user-title">${userTitle}</p>
          </div>
          ${this.createBrandBadge({ size: 'large', animated: true }).outerHTML}
        </div>
        
        <div class="mlg-header-decoration">
          <div class="mlg-glow-effect"></div>
          <div class="mlg-pattern-overlay"></div>
        </div>
      </div>
    `;

    return header;
  }

  /**
   * Create MLG roster header branding
   * @param {Object} options - Roster options
   * @returns {HTMLElement} Roster header element
   */
  createRosterHeader(options = {}) {
    const {
      clanName = 'MLG Elite',
      memberCount = 0,
      onlineCount = 0,
      showStats = true,
      className = ''
    } = options;

    const header = document.createElement('div');
    header.className = `mlg-roster-header ${className}`;
    
    this.applyBrandingStyling(header, {
      variant: 'roster',
      showBackground: true,
      showEffects: true
    });

    header.innerHTML = `
      <div class="mlg-roster-content">
        <div class="mlg-roster-branding">
          <div class="mlg-roster-logo">
            ${this.createBrandBadge({ size: 'large', showIcon: true }).outerHTML}
          </div>
          <div class="mlg-roster-info">
            <h2 class="mlg-clan-name">${clanName}</h2>
            <p class="mlg-clan-subtitle">${this.config.BRAND_MOTTO}</p>
          </div>
        </div>
        
        ${showStats ? `
          <div class="mlg-roster-stats">
            <div class="mlg-stat-item">
              <span class="mlg-stat-value">${memberCount}</span>
              <span class="mlg-stat-label">Members</span>
            </div>
            <div class="mlg-stat-separator"></div>
            <div class="mlg-stat-item">
              <span class="mlg-stat-value mlg-online">${onlineCount}</span>
              <span class="mlg-stat-label">Online</span>
            </div>
          </div>
        ` : ''}
        
        <div class="mlg-roster-decoration">
          <div class="mlg-brand-pattern"></div>
        </div>
      </div>
    `;

    return header;
  }

  /**
   * Create MLG brand badge
   * @param {Object} options - Badge options
   * @returns {HTMLElement} Brand badge element
   */
  createBrandBadge(options = {}) {
    const {
      size = 'medium',
      showIcon = true,
      showText = true,
      animated = false,
      variant = 'primary',
      className = ''
    } = options;

    const badge = document.createElement('div');
    badge.className = `mlg-brand-badge mlg-badge-${size} mlg-badge-${variant} ${animated ? 'mlg-animated' : ''} ${className}`;
    
    this.applyBrandingStyling(badge, {
      variant: 'badge',
      size,
      animated
    });

    const iconHtml = showIcon ? `<span class="mlg-badge-icon">${this.config.LOGO.icon}</span>` : '';
    const textHtml = showText ? `<span class="mlg-badge-text">${this.config.LOGO.badge}</span>` : '';

    badge.innerHTML = `
      <div class="mlg-badge-content">
        ${iconHtml}
        ${textHtml}
      </div>
      ${animated ? '<div class="mlg-badge-glow"></div>' : ''}
    `;

    return badge;
  }

  /**
   * Create profile branding element
   * @param {Object} options - Profile branding options
   * @returns {HTMLElement} Profile branding element
   */
  createProfileBranding(options = {}) {
    const {
      showAchievements = true,
      showMembership = true,
      compact = false,
      className = ''
    } = options;

    const branding = document.createElement('div');
    branding.className = `mlg-profile-branding ${compact ? 'mlg-compact' : ''} ${className}`;
    
    this.applyBrandingStyling(branding, {
      variant: 'profile',
      compact
    });

    branding.innerHTML = `
      <div class="mlg-profile-brand-content">
        <div class="mlg-profile-brand-header">
          ${this.createBrandBadge({ size: 'large', animated: true }).outerHTML}
          <div class="mlg-profile-brand-text">
            <h3 class="mlg-brand-title">${this.config.BRAND_NAME} Member</h3>
            <p class="mlg-brand-subtitle">Elite Gaming Community</p>
          </div>
        </div>
        
        ${showMembership ? `
          <div class="mlg-membership-info">
            <div class="mlg-membership-badge">
              <span class="mlg-membership-icon">🏆</span>
              <span class="mlg-membership-text">Elite Tier</span>
            </div>
            <div class="mlg-membership-since">
              Member since 2024
            </div>
          </div>
        ` : ''}
        
        ${showAchievements ? `
          <div class="mlg-achievements-preview">
            <div class="mlg-achievement-badge">🎯</div>
            <div class="mlg-achievement-badge">🏅</div>
            <div class="mlg-achievement-badge">⚡</div>
          </div>
        ` : ''}
      </div>
    `;

    return branding;
  }

  /**
   * Create card branding element
   * @param {Object} options - Card branding options
   * @returns {HTMLElement} Card branding element
   */
  createCardBranding(options = {}) {
    const {
      position = 'top-right',
      showGlow = true,
      size = 'small',
      className = ''
    } = options;

    const branding = document.createElement('div');
    branding.className = `mlg-card-branding mlg-position-${position} ${className}`;
    
    this.applyBrandingStyling(branding, {
      variant: 'card',
      position,
      showGlow,
      size
    });

    branding.innerHTML = `
      <div class="mlg-card-brand-content">
        ${this.createBrandBadge({ size, showIcon: true, showText: false, animated: showGlow }).outerHTML}
      </div>
    `;

    return branding;
  }

  /**
   * Create mini branding element
   * @param {Object} options - Mini branding options
   * @returns {HTMLElement} Mini branding element
   */
  createMiniBranding(options = {}) {
    const {
      inline = true,
      className = ''
    } = options;

    const branding = document.createElement('span');
    branding.className = `mlg-mini-branding ${inline ? 'mlg-inline' : ''} ${className}`;
    
    this.applyBrandingStyling(branding, {
      variant: 'mini',
      inline
    });

    branding.innerHTML = `
      <span class="mlg-mini-icon">${this.config.LOGO.icon}</span>
      <span class="mlg-mini-text">${this.config.LOGO.badge}</span>
    `;

    return branding;
  }

  /**
   * Apply branding styling to element
   * @param {HTMLElement} element - Element to style
   * @param {Object} options - Styling options
   */
  applyBrandingStyling(element, options = {}) {
    const {
      variant = 'badge',
      size = 'medium',
      showBackground = true,
      showEffects = true,
      animated = false
    } = options;

    // Base styling
    element.style.fontFamily = this.config.FONTS.primary;
    
    // Apply variant-specific styling
    switch (variant) {
      case 'header':
        this.applyHeaderStyling(element, options);
        break;
      case 'roster':
        this.applyRosterStyling(element, options);
        break;
      case 'profile':
        this.applyProfileStyling(element, options);
        break;
      case 'card':
        this.applyCardStyling(element, options);
        break;
      case 'badge':
        this.applyBadgeStyling(element, options);
        break;
      case 'mini':
        this.applyMiniStyling(element, options);
        break;
    }

    // Apply effects if enabled
    if (showEffects) {
      this.applyBrandingEffects(element, options);
    }
  }

  /**
   * Apply header styling
   * @param {HTMLElement} element - Header element
   * @param {Object} options - Styling options
   */
  applyHeaderStyling(element, options) {
    Object.assign(element.style, {
      background: `linear-gradient(135deg, ${this.config.COLORS.dark} 0%, ${this.config.COLORS.surface} 50%, ${this.config.COLORS.dark} 100%)`,
      border: `1px solid ${this.config.COLORS.primary}`,
      borderRadius: '12px',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    });
  }

  /**
   * Apply roster styling
   * @param {HTMLElement} element - Roster element
   * @param {Object} options - Styling options
   */
  applyRosterStyling(element, options) {
    Object.assign(element.style, {
      background: `linear-gradient(90deg, ${this.config.COLORS.surface} 0%, ${this.config.COLORS.dark} 100%)`,
      border: `1px solid ${this.config.COLORS.primary}20`,
      borderRadius: '8px',
      padding: '16px',
      backdropFilter: 'blur(10px)'
    });
  }

  /**
   * Apply badge styling
   * @param {HTMLElement} element - Badge element
   * @param {Object} options - Styling options
   */
  applyBadgeStyling(element, options) {
    const { size = 'medium', animated = false } = options;
    
    const sizeStyles = {
      small: { padding: '4px 8px', fontSize: '12px' },
      medium: { padding: '6px 12px', fontSize: '14px' },
      large: { padding: '8px 16px', fontSize: '16px' }
    };

    Object.assign(element.style, {
      background: `linear-gradient(135deg, ${this.config.COLORS.primary} 0%, ${this.config.COLORS.secondary} 100%)`,
      color: this.config.COLORS.dark,
      border: `1px solid ${this.config.COLORS.primary}`,
      borderRadius: '6px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      transition: `all ${this.config.ANIMATIONS.duration} ${this.config.ANIMATIONS.easing}`,
      ...sizeStyles[size]
    });

    if (animated) {
      element.style.animation = `mlg-glow ${this.config.ANIMATIONS.glow.duration} ${this.config.ANIMATIONS.glow.intensity}`;
    }
  }

  /**
   * Apply branding effects
   * @param {HTMLElement} element - Element to add effects to
   * @param {Object} options - Effect options
   */
  applyBrandingEffects(element, options) {
    const { animated = false } = options;

    // Add hover effects
    element.addEventListener('mouseenter', () => {
      element.style.transform = 'translateY(-2px) scale(1.02)';
      element.style.boxShadow = `0 8px 25px ${this.config.COLORS.primary}40`;
    });

    element.addEventListener('mouseleave', () => {
      element.style.transform = 'translateY(0) scale(1)';
      element.style.boxShadow = 'none';
    });

    if (animated) {
      // Add glow animation
      element.style.animation = `mlg-pulse ${this.config.ANIMATIONS.glow.duration} ${this.config.ANIMATIONS.glow.intensity}`;
    }
  }

  /**
   * Inject global CSS styles for MLG branding
   */
  async injectGlobalStyles() {
    const styleId = 'mlg-branding-styles';
    
    // Remove existing styles if present
    const existingStyles = document.getElementById(styleId);
    if (existingStyles) {
      existingStyles.remove();
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* MLG Branding System Styles */
      .mlg-branding {
        --mlg-primary: ${this.config.COLORS.primary};
        --mlg-secondary: ${this.config.COLORS.secondary};
        --mlg-tertiary: ${this.config.COLORS.tertiary};
        --mlg-accent: ${this.config.COLORS.accent};
        --mlg-dark: ${this.config.COLORS.dark};
        --mlg-surface: ${this.config.COLORS.surface};
        --mlg-text: ${this.config.COLORS.text};
        --mlg-text-muted: ${this.config.COLORS.textMuted};
      }

      /* MLG Animations */
      @keyframes mlg-glow {
        from {
          box-shadow: 0 0 10px var(--mlg-primary);
        }
        to {
          box-shadow: 0 0 20px var(--mlg-primary), 0 0 30px var(--mlg-primary);
        }
      }

      @keyframes mlg-pulse {
        0%, 100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.8;
          transform: scale(1.05);
        }
      }

      @keyframes mlg-float {
        0%, 100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-10px);
        }
      }

      /* Profile Header Styles */
      .mlg-profile-header {
        position: relative;
        background: linear-gradient(135deg, var(--mlg-dark) 0%, var(--mlg-surface) 50%, var(--mlg-dark) 100%);
        border: 1px solid var(--mlg-primary);
        border-radius: 12px;
        padding: 24px;
        overflow: hidden;
      }

      .mlg-header-content {
        position: relative;
        z-index: 2;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .mlg-header-logo {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }

      .mlg-logo-container {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 24px;
        font-weight: bold;
        color: var(--mlg-primary);
      }

      .mlg-tagline {
        font-size: 14px;
        color: var(--mlg-text-muted);
        text-transform: uppercase;
        letter-spacing: 2px;
      }

      .mlg-header-user {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .mlg-user-name {
        font-size: 28px;
        font-weight: bold;
        color: var(--mlg-text);
        margin: 0;
      }

      .mlg-user-title {
        font-size: 16px;
        color: var(--mlg-primary);
        margin: 0;
      }

      /* Roster Header Styles */
      .mlg-roster-header {
        background: linear-gradient(90deg, var(--mlg-surface) 0%, var(--mlg-dark) 100%);
        border: 1px solid rgba(var(--mlg-primary), 0.2);
        border-radius: 8px;
        padding: 16px;
        backdrop-filter: blur(10px);
      }

      .mlg-roster-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .mlg-roster-branding {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .mlg-clan-name {
        font-size: 20px;
        font-weight: bold;
        color: var(--mlg-text);
        margin: 0;
      }

      .mlg-clan-subtitle {
        font-size: 12px;
        color: var(--mlg-primary);
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .mlg-roster-stats {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .mlg-stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }

      .mlg-stat-value {
        font-size: 18px;
        font-weight: bold;
        color: var(--mlg-primary);
      }

      .mlg-stat-value.mlg-online {
        color: var(--mlg-accent);
      }

      .mlg-stat-label {
        font-size: 12px;
        color: var(--mlg-text-muted);
        text-transform: uppercase;
      }

      .mlg-stat-separator {
        width: 1px;
        height: 24px;
        background: var(--mlg-text-muted);
        opacity: 0.3;
      }

      /* Brand Badge Styles */
      .mlg-brand-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: linear-gradient(135deg, var(--mlg-primary) 0%, var(--mlg-secondary) 100%);
        color: var(--mlg-dark);
        border: 1px solid var(--mlg-primary);
        border-radius: 6px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
        transition: all 300ms cubic-bezier(0.4, 0, 0.6, 1);
        position: relative;
        overflow: hidden;
      }

      .mlg-badge-small {
        padding: 4px 8px;
        font-size: 12px;
      }

      .mlg-badge-medium {
        padding: 6px 12px;
        font-size: 14px;
      }

      .mlg-badge-large {
        padding: 8px 16px;
        font-size: 16px;
      }

      .mlg-brand-badge:hover {
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 8px 25px rgba(var(--mlg-primary), 0.4);
      }

      .mlg-animated {
        animation: mlg-glow 2s infinite alternate;
      }

      .mlg-badge-glow {
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: linear-gradient(45deg, var(--mlg-primary), var(--mlg-secondary), var(--mlg-tertiary));
        border-radius: 8px;
        z-index: -1;
        animation: mlg-pulse 2s infinite;
      }

      /* Profile Branding Styles */
      .mlg-profile-branding {
        background: rgba(var(--mlg-surface), 0.8);
        border: 1px solid rgba(var(--mlg-primary), 0.2);
        border-radius: 8px;
        padding: 16px;
        backdrop-filter: blur(10px);
      }

      .mlg-profile-brand-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }

      .mlg-brand-title {
        font-size: 16px;
        font-weight: bold;
        color: var(--mlg-primary);
        margin: 0;
      }

      .mlg-brand-subtitle {
        font-size: 12px;
        color: var(--mlg-text-muted);
        margin: 0;
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .mlg-header-content {
          text-align: center;
        }

        .mlg-header-user {
          flex-direction: column;
          align-items: center;
        }

        .mlg-roster-content {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
        }

        .mlg-roster-stats {
          width: 100%;
          justify-content: space-around;
        }
      }

      /* Xbox 360 Gaming Theme Compatibility */
      .mlg-branding.xbox-theme {
        --mlg-primary: #9ACD32;
        --mlg-secondary: #32CD32;
        font-family: 'Segoe UI', sans-serif;
      }

      .mlg-branding.xbox-theme .mlg-brand-badge {
        background: linear-gradient(135deg, #9ACD32 0%, #32CD32 100%);
        border-radius: 4px;
      }
    `;

    document.head.appendChild(style);
    this.logger.debug('✨ MLG branding styles injected');
  }

  /**
   * Apply branding to existing elements
   */
  applyExistingElementBranding() {
    // Find and enhance existing profile headers
    const profileHeaders = document.querySelectorAll('.profile-header, [data-mlg-branding="header"]');
    profileHeaders.forEach(header => {
      this.enhanceExistingElement(header, 'header');
    });

    // Find and enhance existing roster displays
    const rosterDisplays = document.querySelectorAll('.clan-member-roster, [data-mlg-branding="roster"]');
    rosterDisplays.forEach(roster => {
      this.enhanceExistingElement(roster, 'roster');
    });

    // Find and enhance existing profile cards
    const profileCards = document.querySelectorAll('.profile-card, [data-mlg-branding="profile"]');
    profileCards.forEach(card => {
      this.enhanceExistingElement(card, 'profile');
    });

    this.logger.debug('🎨 Applied branding to existing elements');
  }

  /**
   * Enhance existing element with MLG branding
   * @param {HTMLElement} element - Element to enhance
   * @param {string} variant - Branding variant
   */
  enhanceExistingElement(element, variant) {
    try {
      // Add MLG branding class
      element.classList.add('mlg-branding', `mlg-branding-${variant}`);
      
      // Apply styling based on variant
      this.applyBrandingStyling(element, { variant });
      
      // Add branding elements if needed
      const existingBranding = element.querySelector('.mlg-brand-badge');
      if (!existingBranding) {
        const branding = this.createBrandBadge({ size: 'small', animated: true });
        branding.style.position = 'absolute';
        branding.style.top = '8px';
        branding.style.right = '8px';
        branding.style.zIndex = '10';
        element.style.position = 'relative';
        element.appendChild(branding);
      }
      
      this.logger.debug(`🎨 Enhanced ${variant} element with MLG branding`);
    } catch (error) {
      this.logger.error(`❌ Error enhancing ${variant} element:`, error);
    }
  }

  /**
   * Create fallback element for error cases
   * @returns {HTMLElement} Fallback element
   */
  createFallbackElement() {
    const fallback = document.createElement('span');
    fallback.className = 'mlg-branding-fallback';
    fallback.textContent = '[MLG]';
    fallback.style.cssText = `
      display: inline-block;
      background: #00ff88;
      color: #000;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
    `;
    return fallback;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for dynamic content updates
    this.on('element_added', (data) => {
      if (data.element && data.variant) {
        this.enhanceExistingElement(data.element, data.variant);
      }
    });

    // Listen for theme changes
    this.on('theme_changed', (data) => {
      if (data.theme === 'xbox') {
        document.body.classList.add('xbox-theme');
      } else {
        document.body.classList.remove('xbox-theme');
      }
    });

    this.logger.debug('🎧 Event listeners setup complete');
  }

  /**
   * Get branding statistics
   * @returns {Object} Branding statistics
   */
  getStatistics() {
    return {
      isInitialized: this.isInitialized,
      elementsEnhanced: this.cache.size,
      brandingVariants: Object.keys(this.config.VARIANTS),
      activeTheme: document.body.classList.contains('xbox-theme') ? 'xbox' : 'default'
    };
  }

  /**
   * Shutdown the branding system
   */
  async shutdown() {
    try {
      this.logger.info('🛑 Shutting down MLG Branding System...');
      
      // Remove injected styles
      const styles = document.getElementById('mlg-branding-styles');
      if (styles) {
        styles.remove();
      }
      
      // Clear cache
      this.cache.clear();
      
      // Remove all listeners
      this.removeAllListeners();
      
      this.isInitialized = false;
      this.logger.info('✅ MLG Branding System shutdown complete');
      
    } catch (error) {
      this.logger.error('❌ Error during shutdown:', error);
    }
  }
}

// Global MLG Branding Utilities
const MLGBrandingUtils = {
  /**
   * Quick method to add MLG branding to any element
   * @param {string|HTMLElement} target - Target element or selector
   * @param {string} variant - Branding variant
   * @param {Object} options - Options
   */
  addBranding(target, variant = 'badge', options = {}) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return;

    const brandingSystem = new MLGBrandingSystem();
    brandingSystem.enhanceExistingElement(element, variant);
  },

  /**
   * Create standalone MLG brand element
   * @param {string} variant - Element variant
   * @param {Object} options - Creation options
   * @returns {HTMLElement} Brand element
   */
  createBrandElement(variant = 'badge', options = {}) {
    const brandingSystem = new MLGBrandingSystem();
    return brandingSystem.createBrandingElement(variant, options);
  }
};

// Export the system and utilities
export { MLGBrandingSystem, MLG_BRANDING_CONFIG, MLGBrandingUtils };
export default MLGBrandingSystem;