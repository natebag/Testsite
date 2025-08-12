/**
 * MLG.clan Mobile Clan Management Interface
 * 
 * Touch-optimized clan management for mobile gaming
 * Features mobile-first design with gaming-specific workflows
 * 
 * Features:
 * - Mobile-optimized clan dashboard
 * - Touch-friendly member management
 * - Swipe actions for clan operations
 * - Mobile clan creation wizard
 * - Tournament management interface
 * - Real-time clan activity feed
 * - Mobile-optimized clan settings
 * - Responsive clan statistics
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 */

import { 
  generateGamingClasses, 
  getTouchOptimizedClasses,
  deviceUtils,
  touchUtils,
  responsivePatterns
} from './ui/utils.js';

/**
 * Mobile Clan Management Configuration
 */
const MOBILE_CLAN_CONFIG = {
  // Layout settings
  TAB_HEIGHT: '56px',
  ACTION_BUTTON_SIZE: '48px',
  MEMBER_CARD_HEIGHT: '72px',
  
  // Touch interactions
  SWIPE_THRESHOLD: 60,
  LONG_PRESS_DURATION: 500,
  
  // Mobile-specific features
  QUICK_ACTIONS_LIMIT: 4,
  VISIBLE_MEMBERS_LIMIT: 50,
  ACTIVITY_FEED_LIMIT: 20
};

/**
 * Mobile Clan Management Component
 */
export class MobileClanManagement {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      clanId: null,
      userRole: 'member', // member, officer, leader
      mode: 'dashboard', // dashboard, members, settings, tournaments
      onClanUpdate: () => {},
      onMemberAction: () => {},
      ...options
    };
    
    this.state = {
      currentTab: 'dashboard',
      clanData: null,
      members: [],
      activities: [],
      isLoading: false,
      selectedMembers: new Set(),
      showQuickActions: false
    };
    
    this.touchState = {
      startX: 0,
      startY: 0,
      element: null,
      longPressTimer: null
    };
    
    this.init();
  }

  /**
   * Initialize mobile clan management
   */
  init() {
    this.createMobileLayout();
    this.setupTouchHandlers();
    this.loadClanData();
    
    if (deviceUtils.isTouchDevice()) {
      this.enableMobileOptimizations();
    }
  }

  /**
   * Create mobile-optimized clan management layout
   */
  createMobileLayout() {
    this.container.innerHTML = `
      <div class="mobile-clan-container ${generateGamingClasses('dashboard')}">
        <!-- Mobile Header -->
        <div class="mobile-clan-header ${this.getHeaderClasses()}">
          <div class="clan-header-info">
            <div class="clan-avatar">
              <img src="/assets/icons/default-clan.png" alt="Clan Logo" class="clan-logo">
              <div class="clan-level-badge">
                <span>Lvl 15</span>
              </div>
            </div>
            
            <div class="clan-basic-info">
              <h1 class="clan-name">Loading...</h1>
              <div class="clan-stats-quick">
                <span class="member-count">-- members</span>
                <span class="clan-rank">#-- rank</span>
              </div>
            </div>
          </div>
          
          <div class="clan-header-actions">
            ${this.createHeaderActions()}
          </div>
        </div>

        <!-- Mobile Tab Navigation -->
        <div class="mobile-clan-tabs ${this.getTabsClasses()}">
          ${this.createTabNavigation()}
        </div>

        <!-- Tab Content Container -->
        <div class="clan-content-container">
          <!-- Dashboard Tab -->
          <div class="tab-content dashboard-content ${this.state.currentTab === 'dashboard' ? 'active' : ''}">
            ${this.createDashboardContent()}
          </div>

          <!-- Members Tab -->
          <div class="tab-content members-content ${this.state.currentTab === 'members' ? 'active' : ''}">
            ${this.createMembersContent()}
          </div>

          <!-- Activities Tab -->
          <div class="tab-content activities-content ${this.state.currentTab === 'activities' ? 'active' : ''}">
            ${this.createActivitiesContent()}
          </div>

          <!-- Settings Tab -->
          <div class="tab-content settings-content ${this.state.currentTab === 'settings' ? 'active' : ''}">
            ${this.createSettingsContent()}
          </div>
        </div>

        <!-- Mobile Action FAB -->
        ${this.createFloatingActionButton()}

        <!-- Quick Actions Modal -->
        ${this.createQuickActionsModal()}

        <!-- Mobile Member Actions Sheet -->
        ${this.createMemberActionsSheet()}
      </div>
    `;

    this.bindEvents();
  }

  /**
   * Create header actions based on user role
   */
  createHeaderActions() {
    const canManage = this.options.userRole === 'leader' || this.options.userRole === 'officer';
    
    return `
      <div class="header-actions-row">
        <button class="clan-action-btn ${getTouchOptimizedClasses(touchUtils.touchTarget)}"
                data-action="notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
          <span class="notification-badge">3</span>
        </button>
        
        ${canManage ? `
          <button class="clan-action-btn ${getTouchOptimizedClasses(touchUtils.touchTarget)}"
                  data-action="invite-members">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V8c0-.55-.45-1-1-1s-1 .45-1 1v2H2c-.55 0-1 .45-1 1s.45 1 1 1h2v2c0 .55.45 1 1 1s1-.45 1-1v-2h2c.55 0 1-.45 1-1s-.45-1-1-1H6z"/>
            </svg>
          </button>
        ` : ''}
        
        <button class="clan-action-btn ${getTouchOptimizedClasses(touchUtils.touchTarget)}"
                data-action="clan-menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </button>
      </div>
    `;
  }

  /**
   * Create tab navigation
   */
  createTabNavigation() {
    const tabs = [
      { id: 'dashboard', label: 'Dashboard', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
      { id: 'members', label: 'Members', icon: 'M16 7c0 2.21-1.79 4-4 4s-4-1.79-4-4 1.79-4 4-4 4 1.79 4 4zM12 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z' },
      { id: 'activities', label: 'Activity', icon: 'M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2.5-5H19v-.5C19 4.119 17.881 3 16.5 3h-9C6.119 3 5 4.119 5 5.5V6H3.5C2.674 6 2 6.674 2 7.5s.674 1.5 1.5 1.5H5v12C5 21.881 6.119 23 7.5 23h9c1.381 0 2.5-1.119 2.5-2.5V9h1.5c.826 0 1.5-.674 1.5-1.5S20.326 6 19.5 6z' },
      { id: 'settings', label: 'Settings', icon: 'M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z' }
    ];

    return `
      <div class="tab-nav-container">
        ${tabs.map(tab => `
          <button class="tab-nav-item ${this.state.currentTab === tab.id ? 'active' : ''}"
                  data-tab="${tab.id}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="${tab.icon}"/>
            </svg>
            <span class="tab-label">${tab.label}</span>
          </button>
        `).join('')}
      </div>
    `;
  }

  /**
   * Create dashboard content
   */
  createDashboardContent() {
    return `
      <div class="dashboard-scroll">
        <!-- Clan Statistics -->
        <div class="clan-stats-section">
          <h3 class="section-title">Clan Overview</h3>
          <div class="stats-grid-mobile">
            ${this.createStatCard('Members', '24/30', 'trending_up')}
            ${this.createStatCard('Rank', '#142', 'emoji_events')}
            ${this.createStatCard('Win Rate', '78%', 'celebration')}
            ${this.createStatCard('Active Today', '12', 'people')}
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions-section">
          <h3 class="section-title">Quick Actions</h3>
          <div class="quick-actions-grid">
            ${this.createQuickActionCard('Start Tournament', 'sports_esports', 'primary')}
            ${this.createQuickActionCard('Clan War', 'gavel', 'danger')}
            ${this.createQuickActionCard('Training', 'school', 'secondary')}
            ${this.createQuickActionCard('Recruitment', 'person_add', 'accent')}
          </div>
        </div>

        <!-- Recent Activity Preview -->
        <div class="recent-activity-section">
          <div class="section-header">
            <h3 class="section-title">Recent Activity</h3>
            <button class="view-all-btn" data-tab="activities">View All</button>
          </div>
          <div class="activity-preview">
            ${this.createActivityItem('ProGamer joined the clan', '2 hours ago', 'person_add')}
            ${this.createActivityItem('Tournament match won!', '4 hours ago', 'celebration')}
            ${this.createActivityItem('ClanLeader promoted Officer', '1 day ago', 'star')}
          </div>
        </div>

        <!-- Top Members Preview -->
        <div class="top-members-section">
          <div class="section-header">
            <h3 class="section-title">Top Performers</h3>
            <button class="view-all-btn" data-tab="members">View All</button>
          </div>
          <div class="top-members-preview">
            ${this.createTopMemberCard('ClanLeader', '2,543 MLG', '1st', true)}
            ${this.createTopMemberCard('ProSniper', '1,987 MLG', '2nd', true)}
            ${this.createTopMemberCard('GameMaster', '1,654 MLG', '3rd', false)}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create members content
   */
  createMembersContent() {
    return `
      <div class="members-scroll">
        <!-- Members Header -->
        <div class="members-header">
          <div class="members-search">
            <input type="text" 
                   class="search-input" 
                   placeholder="Search members..."
                   data-action="search-members">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="search-icon">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </div>
          
          <div class="members-filters">
            <button class="filter-btn active" data-filter="all">All</button>
            <button class="filter-btn" data-filter="online">Online</button>
            <button class="filter-btn" data-filter="officers">Officers</button>
          </div>
        </div>

        <!-- Members List -->
        <div class="members-list">
          ${this.createMembersList()}
        </div>
      </div>
    `;
  }

  /**
   * Create activities content
   */
  createActivitiesContent() {
    return `
      <div class="activities-scroll">
        <!-- Activity Filters -->
        <div class="activity-filters">
          <button class="filter-btn active" data-filter="all">All</button>
          <button class="filter-btn" data-filter="joins">Joins</button>
          <button class="filter-btn" data-filter="battles">Battles</button>
          <button class="filter-btn" data-filter="promotions">Promotions</button>
        </div>

        <!-- Activities Feed -->
        <div class="activities-feed">
          ${this.createActivitiesFeed()}
        </div>
      </div>
    `;
  }

  /**
   * Create settings content
   */
  createSettingsContent() {
    const canManage = this.options.userRole === 'leader' || this.options.userRole === 'officer';
    
    return `
      <div class="settings-scroll">
        ${canManage ? `
          <!-- Clan Management Settings -->
          <div class="settings-section">
            <h3 class="section-title">Clan Management</h3>
            <div class="settings-list">
              ${this.createSettingItem('Clan Information', 'Edit name, description, logo', 'edit', 'clan-info')}
              ${this.createSettingItem('Member Permissions', 'Manage roles and permissions', 'security', 'permissions')}
              ${this.createSettingItem('Recruitment Settings', 'Set join requirements', 'person_add', 'recruitment')}
              ${this.createSettingItem('Tournament Settings', 'Configure clan tournaments', 'sports_esports', 'tournaments')}
            </div>
          </div>
        ` : ''}

        <!-- Personal Settings -->
        <div class="settings-section">
          <h3 class="section-title">Personal Settings</h3>
          <div class="settings-list">
            ${this.createSettingItem('Notifications', 'Manage clan notifications', 'notifications', 'notifications')}
            ${this.createSettingItem('Privacy', 'Control visibility settings', 'visibility', 'privacy')}
            ${this.createSettingItem('Leave Clan', 'Leave this clan', 'exit_to_app', 'leave-clan', 'danger')}
          </div>
        </div>

        <!-- Clan Information -->
        <div class="settings-section">
          <h3 class="section-title">About This Clan</h3>
          <div class="clan-info-card">
            <div class="info-row">
              <span class="info-label">Founded</span>
              <span class="info-value">March 2024</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Battles</span>
              <span class="info-value">1,247</span>
            </div>
            <div class="info-row">
              <span class="info-label">Win Rate</span>
              <span class="info-value">78.3%</span>
            </div>
            <div class="info-row">
              <span class="info-label">Clan Tag</span>
              <span class="info-value">[MLG]</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create floating action button
   */
  createFloatingActionButton() {
    const canManage = this.options.userRole === 'leader' || this.options.userRole === 'officer';
    
    if (!canManage) return '';
    
    return `
      <button class="floating-action-btn ${getTouchOptimizedClasses(touchUtils.touchTargetLarge)}"
              data-action="show-quick-actions">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </button>
    `;
  }

  /**
   * Create quick actions modal
   */
  createQuickActionsModal() {
    return `
      <div class="quick-actions-modal hidden">
        <div class="modal-backdrop" data-action="close-quick-actions"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3>Quick Actions</h3>
            <button class="close-btn" data-action="close-quick-actions">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
          
          <div class="quick-actions-list">
            ${this.createQuickActionItem('Invite Members', 'person_add', 'invite-members')}
            ${this.createQuickActionItem('Start Tournament', 'sports_esports', 'start-tournament')}
            ${this.createQuickActionItem('Promote Member', 'trending_up', 'promote-member')}
            ${this.createQuickActionItem('Clan Announcement', 'campaign', 'announcement')}
            ${this.createQuickActionItem('Kick Member', 'person_remove', 'kick-member')}
            ${this.createQuickActionItem('Clan Settings', 'settings', 'clan-settings')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create member actions sheet
   */
  createMemberActionsSheet() {
    return `
      <div class="member-actions-sheet hidden">
        <div class="sheet-backdrop" data-action="close-member-actions"></div>
        <div class="sheet-content">
          <div class="sheet-handle"></div>
          
          <div class="selected-member-info">
            <div class="member-avatar-large">
              <img src="" alt="" class="member-avatar-img">
            </div>
            <div class="member-details-large">
              <h3 class="member-name-large"></h3>
              <p class="member-role-large"></p>
            </div>
          </div>
          
          <div class="member-actions-list">
            <!-- Actions will be populated based on user permissions -->
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Helper methods to create content components
   */
  createStatCard(title, value, icon) {
    return `
      <div class="stat-card">
        <div class="stat-icon">
          <span class="material-icons">${icon}</span>
        </div>
        <div class="stat-content">
          <div class="stat-value">${value}</div>
          <div class="stat-title">${title}</div>
        </div>
      </div>
    `;
  }

  createQuickActionCard(title, icon, variant = 'primary') {
    return `
      <button class="quick-action-card ${variant}" data-action="quick-${title.toLowerCase().replace(' ', '-')}">
        <div class="action-icon">
          <span class="material-icons">${icon}</span>
        </div>
        <span class="action-title">${title}</span>
      </button>
    `;
  }

  createActivityItem(text, time, icon) {
    return `
      <div class="activity-item">
        <div class="activity-icon">
          <span class="material-icons">${icon}</span>
        </div>
        <div class="activity-content">
          <p class="activity-text">${text}</p>
          <span class="activity-time">${time}</span>
        </div>
      </div>
    `;
  }

  createTopMemberCard(name, score, rank, isOnline) {
    return `
      <div class="top-member-card">
        <div class="member-rank">${rank}</div>
        <div class="member-avatar-small">
          <img src="/assets/avatars/default.png" alt="${name}">
          ${isOnline ? '<div class="online-dot"></div>' : ''}
        </div>
        <div class="member-info-small">
          <div class="member-name">${name}</div>
          <div class="member-score">${score}</div>
        </div>
      </div>
    `;
  }

  createMembersList() {
    // Mock data for testing
    const mockMembers = [
      { id: 1, name: 'ClanLeader', role: 'Leader', level: 50, isOnline: true, lastSeen: 'now' },
      { id: 2, name: 'ProSniper', role: 'Officer', level: 45, isOnline: true, lastSeen: 'now' },
      { id: 3, name: 'GameMaster', role: 'Member', level: 42, isOnline: false, lastSeen: '2h ago' },
      { id: 4, name: 'NoobSlayer', role: 'Member', level: 38, isOnline: true, lastSeen: 'now' },
      { id: 5, name: 'SnipeKing', role: 'Member', level: 35, isOnline: false, lastSeen: '1d ago' }
    ];

    return mockMembers.map(member => this.createMemberCard(member)).join('');
  }

  createMemberCard(member) {
    return `
      <div class="member-card ${getTouchOptimizedClasses('')}" 
           data-member-id="${member.id}">
        <div class="member-avatar">
          <img src="/assets/avatars/default.png" alt="${member.name}">
          ${member.isOnline ? '<div class="online-indicator"></div>' : ''}
        </div>
        
        <div class="member-info">
          <div class="member-name">${member.name}</div>
          <div class="member-details">
            <span class="member-role ${member.role.toLowerCase()}">${member.role}</span>
            <span class="member-level">Level ${member.level}</span>
          </div>
          <div class="member-status">
            ${member.isOnline ? 'Online' : `Last seen ${member.lastSeen}`}
          </div>
        </div>
        
        <div class="member-actions">
          <button class="member-action-btn" data-action="member-menu" data-member-id="${member.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  createActivitiesFeed() {
    // Mock activities data
    const mockActivities = [
      { type: 'join', text: 'ProGamer joined the clan', time: '2 hours ago', icon: 'person_add' },
      { type: 'battle', text: 'Tournament match won against [PROS]!', time: '4 hours ago', icon: 'celebration' },
      { type: 'promotion', text: 'ClanLeader promoted ProSniper to Officer', time: '1 day ago', icon: 'star' },
      { type: 'join', text: 'GameMaster joined the clan', time: '2 days ago', icon: 'person_add' },
      { type: 'battle', text: 'Clan war victory! +500 clan points', time: '3 days ago', icon: 'military_tech' }
    ];

    return mockActivities.map(activity => this.createActivityItem(activity.text, activity.time, activity.icon)).join('');
  }

  createSettingItem(title, description, icon, action, variant = 'default') {
    return `
      <button class="setting-item ${variant} ${getTouchOptimizedClasses('')}" 
              data-action="${action}">
        <div class="setting-icon">
          <span class="material-icons">${icon}</span>
        </div>
        <div class="setting-content">
          <div class="setting-title">${title}</div>
          <div class="setting-description">${description}</div>
        </div>
        <div class="setting-arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
        </div>
      </button>
    `;
  }

  createQuickActionItem(title, icon, action) {
    return `
      <button class="quick-action-item ${getTouchOptimizedClasses('')}" 
              data-action="${action}">
        <div class="action-item-icon">
          <span class="material-icons">${icon}</span>
        </div>
        <span class="action-item-title">${title}</span>
      </button>
    `;
  }

  /**
   * Get responsive CSS classes
   */
  getHeaderClasses() {
    return generateGamingClasses('gamingCard', {
      base: 'bg-gaming-surface border-b border-tile-border p-4 sticky top-0 z-20',
      sm: 'p-6'
    });
  }

  getTabsClasses() {
    return generateGamingClasses('navigation', {
      base: 'bg-gaming-surface border-b border-tile-border sticky top-[80px] z-10',
      sm: 'top-[96px]'
    });
  }

  /**
   * Setup touch event handlers
   */
  setupTouchHandlers() {
    // Add swipe gestures for member cards
    this.container.addEventListener('touchstart', (e) => {
      const memberCard = e.target.closest('.member-card');
      if (memberCard) {
        this.handleMemberTouchStart(e, memberCard);
      }
    });

    this.container.addEventListener('touchmove', (e) => {
      if (this.touchState.element) {
        this.handleMemberTouchMove(e);
      }
    });

    this.container.addEventListener('touchend', (e) => {
      if (this.touchState.element) {
        this.handleMemberTouchEnd(e);
      }
    });
  }

  /**
   * Handle member card touch interactions
   */
  handleMemberTouchStart(e, memberCard) {
    const touch = e.touches[0];
    this.touchState.startX = touch.clientX;
    this.touchState.startY = touch.clientY;
    this.touchState.element = memberCard;

    // Start long press timer
    this.touchState.longPressTimer = setTimeout(() => {
      this.handleMemberLongPress(memberCard);
    }, MOBILE_CLAN_CONFIG.LONG_PRESS_DURATION);
  }

  handleMemberTouchMove(e) {
    const touch = e.touches[0];
    const deltaX = touch.clientX - this.touchState.startX;
    const deltaY = Math.abs(touch.clientY - this.touchState.startY);

    // Clear long press if moved too much
    if (Math.abs(deltaX) > 10 || deltaY > 10) {
      clearTimeout(this.touchState.longPressTimer);
    }

    // Handle swipe gestures
    if (Math.abs(deltaX) > MOBILE_CLAN_CONFIG.SWIPE_THRESHOLD && deltaY < 50) {
      e.preventDefault();
      this.updateMemberSwipeFeedback(deltaX);
    }
  }

  handleMemberTouchEnd(e) {
    clearTimeout(this.touchState.longPressTimer);
    
    const deltaX = this.touchState.element ? 
      (e.changedTouches[0].clientX - this.touchState.startX) : 0;

    if (Math.abs(deltaX) > MOBILE_CLAN_CONFIG.SWIPE_THRESHOLD) {
      if (deltaX > 0) {
        this.handleMemberSwipeRight(this.touchState.element);
      } else {
        this.handleMemberSwipeLeft(this.touchState.element);
      }
    }

    this.resetMemberTouchState();
  }

  /**
   * Handle member interactions
   */
  handleMemberLongPress(memberCard) {
    const memberId = memberCard.dataset.memberId;
    this.showMemberActions(memberId);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }

  updateMemberSwipeFeedback(deltaX) {
    if (!this.touchState.element) return;

    const transform = `translateX(${deltaX * 0.3}px)`;
    this.touchState.element.style.transform = transform;

    // Add color feedback
    if (deltaX > 0) {
      this.touchState.element.style.backgroundColor = 'rgba(0, 255, 136, 0.1)';
    } else {
      this.touchState.element.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
    }
  }

  handleMemberSwipeRight(memberCard) {
    const memberId = memberCard.dataset.memberId;
    // Quick action: View profile or promote
    console.log('Swipe right on member:', memberId);
  }

  handleMemberSwipeLeft(memberCard) {
    const memberId = memberCard.dataset.memberId;
    // Quick action: More options or remove
    this.showMemberActions(memberId);
  }

  resetMemberTouchState() {
    if (this.touchState.element) {
      this.touchState.element.style.transform = '';
      this.touchState.element.style.backgroundColor = '';
    }
    
    this.touchState = {
      startX: 0,
      startY: 0,
      element: null,
      longPressTimer: null
    };
  }

  /**
   * Bind event handlers
   */
  bindEvents() {
    // Tab navigation
    this.container.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-tab]');
      if (tab) {
        this.switchTab(tab.dataset.tab);
      }
    });

    // Action handlers
    this.container.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action) {
        this.handleAction(action, e);
      }
    });

    // Search functionality
    const searchInput = this.container.querySelector('.search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleMemberSearch(e.target.value);
      });
    }
  }

  /**
   * Enable mobile-specific optimizations
   */
  enableMobileOptimizations() {
    // Optimize scrolling
    this.container.style.webkitOverflowScrolling = 'touch';
    this.container.style.overscrollBehavior = 'contain';
    
    // Prevent text selection
    this.container.style.userSelect = 'none';
    this.container.style.webkitUserSelect = 'none';
  }

  /**
   * Handle tab switching
   */
  switchTab(tabId) {
    this.state.currentTab = tabId;
    
    // Update tab navigation
    this.container.querySelectorAll('.tab-nav-item').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    
    // Update content visibility
    this.container.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.classList.contains(`${tabId}-content`));
    });
  }

  /**
   * Handle various actions
   */
  handleAction(action, event) {
    const element = event.target.closest(`[data-action="${action}"]`);
    
    switch (action) {
      case 'show-quick-actions':
        this.showQuickActions();
        break;
      case 'close-quick-actions':
        this.hideQuickActions();
        break;
      case 'member-menu':
        const memberId = element.dataset.memberId;
        this.showMemberActions(memberId);
        break;
      case 'close-member-actions':
        this.hideMemberActions();
        break;
      case 'notifications':
        this.showNotifications();
        break;
      case 'invite-members':
        this.showInviteModal();
        break;
      case 'clan-menu':
        this.showClanMenu();
        break;
      // Add more action handlers
      default:
        console.log('Unhandled action:', action);
    }
  }

  /**
   * Modal and sheet management
   */
  showQuickActions() {
    const modal = this.container.querySelector('.quick-actions-modal');
    modal.classList.remove('hidden');
    modal.classList.add('show');
  }

  hideQuickActions() {
    const modal = this.container.querySelector('.quick-actions-modal');
    modal.classList.add('hidden');
    modal.classList.remove('show');
  }

  showMemberActions(memberId) {
    const sheet = this.container.querySelector('.member-actions-sheet');
    // Populate member info and actions based on permissions
    sheet.classList.remove('hidden');
    sheet.classList.add('show');
  }

  hideMemberActions() {
    const sheet = this.container.querySelector('.member-actions-sheet');
    sheet.classList.add('hidden');
    sheet.classList.remove('show');
  }

  /**
   * Data management
   */
  async loadClanData() {
    this.state.isLoading = true;
    
    try {
      // Simulate API call
      const mockClanData = {
        id: 'clan-123',
        name: 'MLG Elite Squad',
        tag: '[MLG]',
        level: 15,
        memberCount: 24,
        maxMembers: 30,
        rank: 142,
        winRate: 78.3,
        activeToday: 12
      };
      
      this.state.clanData = mockClanData;
      this.updateClanHeader();
      
    } catch (error) {
      console.error('Failed to load clan data:', error);
    } finally {
      this.state.isLoading = false;
    }
  }

  updateClanHeader() {
    if (!this.state.clanData) return;
    
    const clanName = this.container.querySelector('.clan-name');
    const memberCount = this.container.querySelector('.member-count');
    const clanRank = this.container.querySelector('.clan-rank');
    
    if (clanName) clanName.textContent = this.state.clanData.name;
    if (memberCount) memberCount.textContent = `${this.state.clanData.memberCount} members`;
    if (clanRank) clanRank.textContent = `#${this.state.clanData.rank} rank`;
  }

  handleMemberSearch(query) {
    const memberCards = this.container.querySelectorAll('.member-card');
    
    memberCards.forEach(card => {
      const memberName = card.querySelector('.member-name').textContent.toLowerCase();
      const matches = memberName.includes(query.toLowerCase());
      card.style.display = matches ? '' : 'none';
    });
  }

  /**
   * Placeholder methods for additional functionality
   */
  showNotifications() {
    console.log('Show notifications');
  }

  showInviteModal() {
    console.log('Show invite modal');
  }

  showClanMenu() {
    console.log('Show clan menu');
  }

  /**
   * Destroy component and cleanup
   */
  destroy() {
    clearTimeout(this.touchState.longPressTimer);
    this.state = {};
    this.touchState = {};
    this.container.innerHTML = '';
  }
}

/**
 * Mobile Clan Management Styles
 */
export const mobileClanStyles = `
  .mobile-clan-container {
    height: 100vh;
    overflow-y: auto;
    background: var(--gaming-bg);
    color: white;
  }

  .mobile-clan-header {
    backdrop-filter: blur(10px);
  }

  .clan-header-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .clan-avatar {
    position: relative;
    width: 60px;
    height: 60px;
  }

  .clan-logo {
    width: 100%;
    height: 100%;
    border-radius: 12px;
    object-fit: cover;
    border: 2px solid var(--gaming-accent);
  }

  .clan-level-badge {
    position: absolute;
    bottom: -4px;
    right: -4px;
    background: var(--gaming-accent);
    color: black;
    font-size: 0.625rem;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 10px;
  }

  .clan-basic-info {
    flex: 1;
  }

  .clan-name {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
    color: var(--gaming-accent);
  }

  .clan-stats-quick {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 0.25rem;
  }

  .header-actions-row {
    display: flex;
    gap: 0.5rem;
  }

  .clan-action-btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--tile-bg-primary);
    border: 1px solid var(--tile-border);
    border-radius: 8px;
    color: var(--gaming-accent);
    transition: all 0.2s ease;
  }

  .notification-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: var(--gaming-red);
    color: white;
    font-size: 0.625rem;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 16px;
    text-align: center;
  }

  .mobile-clan-tabs {
    background: var(--gaming-surface);
    border-bottom: 1px solid var(--tile-border);
  }

  .tab-nav-container {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
  }

  .tab-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.75rem 0.5rem;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    transition: all 0.2s ease;
    min-height: ${MOBILE_CLAN_CONFIG.TAB_HEIGHT};
  }

  .tab-nav-item.active {
    color: var(--gaming-accent);
    background: rgba(0, 255, 136, 0.1);
    border-bottom: 2px solid var(--gaming-accent);
  }

  .tab-label {
    font-size: 0.75rem;
    font-weight: 500;
  }

  .clan-content-container {
    flex: 1;
    overflow: hidden;
  }

  .tab-content {
    display: none;
    height: 100%;
    overflow-y: auto;
  }

  .tab-content.active {
    display: block;
  }

  .dashboard-scroll,
  .members-scroll,
  .activities-scroll,
  .settings-scroll {
    padding: 1rem;
    min-height: calc(100vh - 200px);
  }

  .section-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--gaming-accent);
    margin: 0 0 1rem 0;
  }

  .stats-grid-mobile {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: var(--tile-bg-primary);
    border: 1px solid var(--tile-border);
    border-radius: 8px;
    padding: 1rem;
  }

  .stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--gaming-accent);
    color: black;
    border-radius: 8px;
  }

  .stat-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: white;
  }

  .stat-title {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .quick-actions-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .quick-action-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background: var(--tile-bg-primary);
    border: 1px solid var(--tile-border);
    border-radius: 8px;
    color: white;
    transition: all 0.2s ease;
    min-height: 80px;
  }

  .quick-action-card:active {
    transform: scale(0.95);
  }

  .quick-action-card.primary {
    border-color: var(--gaming-accent);
    background: rgba(0, 255, 136, 0.1);
  }

  .quick-action-card.danger {
    border-color: var(--gaming-red);
    background: rgba(239, 68, 68, 0.1);
  }

  .floating-action-btn {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
    background: linear-gradient(45deg, var(--gaming-accent), var(--xbox-green-light));
    color: black;
    border: none;
    border-radius: 50%;
    box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
    z-index: 100;
    transition: all 0.3s ease;
  }

  .floating-action-btn:active {
    transform: scale(0.9);
  }

  .member-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: var(--tile-bg-primary);
    border: 1px solid var(--tile-border);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 0.5rem;
    transition: all 0.2s ease;
    min-height: ${MOBILE_CLAN_CONFIG.MEMBER_CARD_HEIGHT};
  }

  .member-avatar {
    position: relative;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
  }

  .member-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .online-indicator {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 12px;
    height: 12px;
    background: var(--gaming-accent);
    border: 2px solid var(--gaming-surface);
    border-radius: 50%;
  }

  .member-info {
    flex: 1;
    min-width: 0;
  }

  .member-name {
    font-weight: 600;
    color: white;
    margin-bottom: 0.25rem;
  }

  .member-details {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .member-role {
    font-size: 0.75rem;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 500;
  }

  .member-role.leader {
    background: var(--gaming-yellow);
    color: black;
  }

  .member-role.officer {
    background: var(--gaming-purple);
    color: white;
  }

  .member-role.member {
    background: var(--tile-bg-secondary);
    color: var(--gaming-accent);
  }

  .member-level {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .member-status {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .member-actions {
    flex-shrink: 0;
  }

  .member-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: var(--tile-bg-secondary);
    border: 1px solid var(--tile-border);
    border-radius: 50%;
    color: rgba(255, 255, 255, 0.7);
    transition: all 0.2s ease;
  }

  .quick-actions-modal,
  .member-actions-sheet {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-backdrop,
  .sheet-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
  }

  .modal-content {
    background: var(--gaming-surface);
    border: 1px solid var(--tile-border);
    border-radius: 12px;
    max-width: 320px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    z-index: 201;
  }

  .sheet-content {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--gaming-surface);
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
    max-height: 80vh;
    overflow-y: auto;
    z-index: 201;
  }

  .sheet-handle {
    width: 40px;
    height: 4px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
    margin: 12px auto;
  }

  @media (max-width: 640px) {
    .stats-grid-mobile {
      grid-template-columns: 1fr;
    }
    
    .quick-actions-grid {
      grid-template-columns: 1fr;
    }
    
    .clan-header-info {
      flex-direction: column;
      align-items: flex-start;
      text-align: left;
    }
  }
`;

export default MobileClanManagement;