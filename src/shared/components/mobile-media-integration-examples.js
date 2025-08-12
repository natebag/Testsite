/**
 * Mobile Media Integration Examples for MLG.clan
 * 
 * Comprehensive integration examples demonstrating how to use the mobile
 * media optimization system across different gaming contexts:
 * 
 * - Tournament page with bracket images and live updates
 * - Clan management with optimized banners and member avatars
 * - Gaming content gallery with clips and screenshots
 * - Social gaming feed with user-generated content
 * - Profile pages with achievements and gaming history
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 */

import MobileMediaOptimizer from './mobile-media-optimizer.js';
import MobileGamingContentManager from './mobile-gaming-content-manager.js';
import MobileMediaAnalytics from './mobile-media-analytics.js';

/**
 * Tournament Page Integration Example
 */
export class TournamentPageExample {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.mediaOptimizer = MobileMediaOptimizer;
    this.contentManager = MobileGamingContentManager;
    
    this.init();
  }

  async init() {
    this.container.innerHTML = '';
    this.container.className = 'tournament-page-example';
    
    // Set gaming context
    this.contentManager.currentContext = 'tournament';
    
    // Create tournament header with hero image
    await this.createTournamentHeader();
    
    // Create live tournament bracket
    await this.createLiveTournamentBracket();
    
    // Create participant showcase
    await this.createParticipantShowcase();
    
    // Create live leaderboard
    await this.createLiveLeaderboard();
    
    // Create recent clips gallery
    await this.createRecentClipsGallery();
    
    console.log('🏆 Tournament page example initialized');
  }

  async createTournamentHeader() {
    const headerSection = document.createElement('section');
    headerSection.className = 'tournament-header-section';
    
    const heroImage = this.mediaOptimizer.createMobileGamingHero({
      src: 'https://example.com/tournament-hero.jpg',
      alt: 'MLG Championship Tournament',
      aspectRatio: '16/9',
      overlay: true,
      content: `
        <h1>MLG Championship 2024</h1>
        <p>Epic battles, legendary moments, ultimate gaming glory</p>
        <div class="tournament-stats">
          <span>🏆 $50,000 Prize Pool</span>
          <span>👥 64 Teams</span>
          <span>🔴 LIVE</span>
        </div>
      `,
      priority: 'critical',
      className: 'tournament-hero'
    });

    headerSection.appendChild(heroImage);
    this.container.appendChild(headerSection);

    // Track gaming interaction
    MobileMediaAnalytics.trackGamingInteraction('tournament_accessed', {
      context: 'tournament',
      tournamentId: 'mlg-championship-2024'
    });
  }

  async createLiveTournamentBracket() {
    const bracketSection = document.createElement('section');
    bracketSection.className = 'tournament-bracket-section';
    
    const sectionTitle = document.createElement('h2');
    sectionTitle.textContent = '🏆 Tournament Bracket';
    sectionTitle.className = 'section-title';
    bracketSection.appendChild(sectionTitle);

    const bracketContainer = this.contentManager.createTournamentBracket({
      tournamentData: {
        id: 'mlg-championship-2024',
        name: 'MLG Championship',
        status: 'live'
      },
      rounds: [
        {
          name: 'Round of 64',
          matches: this.generateMockMatches(32)
        },
        {
          name: 'Round of 32', 
          matches: this.generateMockMatches(16)
        },
        {
          name: 'Round of 16',
          matches: this.generateMockMatches(8)
        },
        {
          name: 'Quarter Finals',
          matches: this.generateMockMatches(4)
        },
        {
          name: 'Semi Finals',
          matches: this.generateMockMatches(2)
        },
        {
          name: 'Grand Final',
          matches: this.generateMockMatches(1)
        }
      ],
      isLive: true,
      showAdvancement: true,
      className: 'mobile-optimized-bracket'
    });

    bracketSection.appendChild(bracketContainer);
    this.container.appendChild(bracketSection);
  }

  async createParticipantShowcase() {
    const participantsSection = document.createElement('section');
    participantsSection.className = 'participants-showcase-section';
    
    const sectionTitle = document.createElement('h2');
    sectionTitle.textContent = '⭐ Featured Teams';
    sectionTitle.className = 'section-title';
    participantsSection.appendChild(sectionTitle);

    const participantGrid = document.createElement('div');
    participantGrid.className = 'participant-grid';
    participantGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      padding: 1rem;
    `;

    const featuredTeams = [
      { name: 'Team Alpha', logo: 'team-alpha.jpg', rank: 1 },
      { name: 'Gaming Legends', logo: 'gaming-legends.jpg', rank: 2 },
      { name: 'Pro Gamers', logo: 'pro-gamers.jpg', rank: 3 },
      { name: 'Elite Squad', logo: 'elite-squad.jpg', rank: 4 }
    ];

    featuredTeams.forEach(team => {
      const teamCard = document.createElement('div');
      teamCard.className = 'team-card';
      teamCard.style.cssText = `
        background: linear-gradient(135deg, rgba(26, 26, 46, 0.9), rgba(10, 10, 15, 0.95));
        border-radius: 12px;
        border: 1px solid rgba(0, 255, 136, 0.3);
        padding: 1rem;
        text-align: center;
        transition: transform 0.2s ease;
      `;

      const teamLogo = this.mediaOptimizer.createOptimizedGamingImage({
        src: `https://example.com/team-logos/${team.logo}`,
        alt: `${team.name} Logo`,
        type: 'avatar',
        size: 'large',
        priority: 'high',
        className: 'team-logo'
      });

      const teamName = document.createElement('h3');
      teamName.textContent = team.name;
      teamName.style.cssText = `
        color: var(--gaming-accent);
        margin: 0.5rem 0;
        font-size: 1rem;
      `;

      const teamRank = document.createElement('div');
      teamRank.textContent = `Rank #${team.rank}`;
      teamRank.style.cssText = `
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.8rem;
      `;

      teamCard.appendChild(teamLogo);
      teamCard.appendChild(teamName);
      teamCard.appendChild(teamRank);
      participantGrid.appendChild(teamCard);
    });

    participantsSection.appendChild(participantGrid);
    this.container.appendChild(participantsSection);
  }

  async createLiveLeaderboard() {
    const leaderboardSection = document.createElement('section');
    leaderboardSection.className = 'live-leaderboard-section';
    
    const sectionTitle = document.createElement('h2');
    sectionTitle.textContent = '📊 Live Leaderboard';
    sectionTitle.className = 'section-title';
    leaderboardSection.appendChild(sectionTitle);

    const leaderboard = this.contentManager.createMobileLeaderboard({
      leaderboardData: this.generateMockLeaderboardData(),
      type: 'tournament',
      showRankChange: true,
      isRealTime: true,
      maxEntries: 10,
      className: 'tournament-leaderboard'
    });

    leaderboardSection.appendChild(leaderboard);
    this.container.appendChild(leaderboardSection);

    // Track leaderboard view
    MobileMediaAnalytics.trackGamingInteraction('leaderboard_viewed', {
      context: 'tournament',
      type: 'live'
    });
  }

  async createRecentClipsGallery() {
    const clipsSection = document.createElement('section');
    clipsSection.className = 'recent-clips-section';
    
    const sectionTitle = document.createElement('h2');
    sectionTitle.textContent = '🎬 Tournament Highlights';
    sectionTitle.className = 'section-title';
    clipsSection.appendChild(sectionTitle);

    const clipsGallery = this.contentManager.createGamingClipGallery({
      clips: this.generateMockClipsData(),
      layout: 'grid',
      autoPlay: false,
      showControls: true,
      enableInfiniteScroll: false,
      className: 'tournament-clips'
    });

    clipsSection.appendChild(clipsGallery);
    this.container.appendChild(clipsSection);
  }

  generateMockMatches(count) {
    return Array.from({ length: count }, (_, i) => ({
      id: `match-${i}`,
      team1: `Team ${String.fromCharCode(65 + i * 2)}`,
      team2: `Team ${String.fromCharCode(65 + i * 2 + 1)}`,
      score1: Math.floor(Math.random() * 3),
      score2: Math.floor(Math.random() * 3),
      status: i < count / 2 ? 'completed' : 'pending'
    }));
  }

  generateMockLeaderboardData() {
    const teams = ['Team Alpha', 'Gaming Legends', 'Pro Gamers', 'Elite Squad', 'Victory Squad'];
    return teams.map((team, i) => ({
      rank: i + 1,
      name: team,
      score: 1000 - i * 50,
      change: Math.floor(Math.random() * 5) - 2,
      avatar: `https://example.com/team-avatars/${team.toLowerCase().replace(/ /g, '-')}.jpg`
    }));
  }

  generateMockClipsData() {
    return [
      {
        id: 'clip-1',
        title: 'Epic Tournament Moment',
        thumbnailUrl: 'https://example.com/clips/clip-1-thumb.jpg',
        duration: 45,
        views: 15420,
        creator: 'Tournament Stream'
      },
      {
        id: 'clip-2', 
        title: 'Amazing Comeback Victory',
        thumbnailUrl: 'https://example.com/clips/clip-2-thumb.jpg',
        duration: 32,
        views: 8930,
        creator: 'Pro Player'
      }
    ];
  }
}

/**
 * Clan Management Integration Example
 */
export class ClanManagementExample {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.mediaOptimizer = MobileMediaOptimizer;
    this.contentManager = MobileGamingContentManager;
    
    this.init();
  }

  async init() {
    this.container.innerHTML = '';
    this.container.className = 'clan-management-example';
    
    // Set gaming context
    this.contentManager.currentContext = 'clan';
    
    // Create clan header with banner
    await this.createClanHeader();
    
    // Create member roster
    await this.createMemberRoster();
    
    // Create clan statistics
    await this.createClanStatistics();
    
    // Create recent clan activity
    await this.createClanActivity();
    
    console.log('🏰 Clan management example initialized');
  }

  async createClanHeader() {
    const headerSection = document.createElement('section');
    headerSection.className = 'clan-header-section';
    
    const clanBanner = this.contentManager.createClanBanner({
      clanData: {
        name: 'Elite Gaming Clan',
        bannerUrl: 'https://example.com/clan-banners/elite-gaming.jpg',
        memberCount: 47,
        rank: 12,
        ranking: {
          global: 12,
          regional: 3
        }
      },
      showMemberCount: true,
      showRanking: true,
      showRecentActivity: false,
      enableParallax: true,
      className: 'clan-main-banner'
    });

    headerSection.appendChild(clanBanner);
    this.container.appendChild(headerSection);

    // Track clan access
    MobileMediaAnalytics.trackGamingInteraction('clan_accessed', {
      context: 'clan',
      clanId: 'elite-gaming-clan'
    });
  }

  async createMemberRoster() {
    const rosterSection = document.createElement('section');
    rosterSection.className = 'member-roster-section';
    
    const sectionTitle = document.createElement('h2');
    sectionTitle.textContent = '👥 Clan Members';
    sectionTitle.className = 'section-title';
    rosterSection.appendChild(sectionTitle);

    const memberGrid = document.createElement('div');
    memberGrid.className = 'member-grid';
    memberGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 1rem;
      padding: 1rem;
    `;

    const mockMembers = this.generateMockMemberData();
    
    mockMembers.slice(0, 12).forEach(member => {
      const memberCard = document.createElement('div');
      memberCard.className = 'member-card';
      memberCard.style.cssText = `
        text-align: center;
        padding: 1rem;
        background: linear-gradient(135deg, rgba(26, 26, 46, 0.9), rgba(10, 10, 15, 0.95));
        border-radius: 12px;
        border: 1px solid rgba(0, 255, 136, 0.2);
        transition: all 0.2s ease;
      `;

      const memberAvatar = this.contentManager.createGamingUserAvatar({
        userId: member.id,
        username: member.username,
        avatarUrl: member.avatarUrl,
        size: 'medium',
        showOnlineStatus: true,
        showClanInfo: false,
        showRankBadge: true,
        isInteractive: true,
        className: 'member-avatar'
      });

      const memberName = document.createElement('div');
      memberName.textContent = member.username;
      memberName.style.cssText = `
        color: var(--gaming-accent);
        margin: 0.5rem 0;
        font-weight: 500;
        font-size: 0.9rem;
      `;

      const memberRole = document.createElement('div');
      memberRole.textContent = member.role;
      memberRole.style.cssText = `
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.7rem;
      `;

      memberCard.appendChild(memberAvatar);
      memberCard.appendChild(memberName);
      memberCard.appendChild(memberRole);
      memberGrid.appendChild(memberCard);
    });

    rosterSection.appendChild(memberGrid);
    this.container.appendChild(rosterSection);
  }

  generateMockMemberData() {
    const roles = ['Leader', 'Officer', 'Member', 'Recruit'];
    return Array.from({ length: 20 }, (_, i) => ({
      id: `member-${i}`,
      username: `Player${i + 1}`,
      avatarUrl: `https://example.com/avatars/player-${i + 1}.jpg`,
      role: roles[Math.floor(Math.random() * roles.length)],
      isOnline: Math.random() > 0.3,
      rank: Math.floor(Math.random() * 100) + 1
    }));
  }
}

/**
 * Gaming Content Gallery Integration Example
 */
export class GamingContentGalleryExample {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.mediaOptimizer = MobileMediaOptimizer;
    this.contentManager = MobileGamingContentManager;
    
    this.init();
  }

  async init() {
    this.container.innerHTML = '';
    this.container.className = 'gaming-content-gallery-example';
    
    // Set gaming context
    this.contentManager.currentContext = 'social';
    
    // Create content filter tabs
    await this.createContentTabs();
    
    // Create clips gallery
    await this.createClipsGallery();
    
    // Create screenshots gallery
    await this.createScreenshotsGallery();
    
    console.log('🎮 Gaming content gallery example initialized');
  }

  async createContentTabs() {
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'content-tabs';
    tabsContainer.style.cssText = `
      display: flex;
      background: rgba(26, 26, 46, 0.5);
      border-radius: 12px;
      padding: 0.5rem;
      margin-bottom: 1rem;
      gap: 0.5rem;
      overflow-x: auto;
    `;

    const tabs = [
      { id: 'clips', label: '🎬 Gaming Clips', active: true },
      { id: 'screenshots', label: '📸 Screenshots', active: false },
      { id: 'highlights', label: '⭐ Highlights', active: false }
    ];

    tabs.forEach(tab => {
      const tabButton = document.createElement('button');
      tabButton.className = `content-tab ${tab.active ? 'active' : ''}`;
      tabButton.textContent = tab.label;
      tabButton.style.cssText = `
        padding: 0.75rem 1rem;
        border: none;
        border-radius: 8px;
        background: ${tab.active ? 'var(--gaming-accent)' : 'transparent'};
        color: ${tab.active ? 'black' : 'var(--gaming-accent)'};
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
        min-width: var(--touch-target-recommended);
      `;

      tabButton.addEventListener('click', () => {
        this.switchContentTab(tab.id);
      });

      tabsContainer.appendChild(tabButton);
    });

    this.container.appendChild(tabsContainer);
  }

  async createClipsGallery() {
    const clipsSection = document.createElement('section');
    clipsSection.className = 'clips-gallery-section';
    clipsSection.id = 'clips-content';
    
    const clipsGallery = this.contentManager.createGamingClipGallery({
      clips: this.generateMockExtendedClipsData(),
      layout: 'grid',
      autoPlay: false,
      showControls: true,
      enableInfiniteScroll: true,
      className: 'social-clips-gallery'
    });

    clipsSection.appendChild(clipsGallery);
    this.container.appendChild(clipsSection);
  }

  async createScreenshotsGallery() {
    const screenshotsSection = document.createElement('section');
    screenshotsSection.className = 'screenshots-gallery-section';
    screenshotsSection.id = 'screenshots-content';
    screenshotsSection.style.display = 'none';
    
    const screenshotsGallery = this.contentManager.createScreenshotGallery({
      screenshots: this.generateMockScreenshotData(),
      layout: 'masonry',
      enableLightbox: true,
      enableSwipeGestures: true,
      className: 'social-screenshots-gallery'
    });

    screenshotsSection.appendChild(screenshotsGallery);
    this.container.appendChild(screenshotsSection);
  }

  switchContentTab(tabId) {
    // Update tab active states
    const tabs = this.container.querySelectorAll('.content-tab');
    tabs.forEach(tab => {
      const isActive = tab.textContent.includes(tabId);
      tab.className = `content-tab ${isActive ? 'active' : ''}`;
      tab.style.background = isActive ? 'var(--gaming-accent)' : 'transparent';
      tab.style.color = isActive ? 'black' : 'var(--gaming-accent)';
    });

    // Show/hide content sections
    const sections = this.container.querySelectorAll('[id$="-content"]');
    sections.forEach(section => {
      section.style.display = section.id.includes(tabId) ? 'block' : 'none';
    });

    // Track tab switch
    MobileMediaAnalytics.trackGamingInteraction('content_tab_switched', {
      context: 'social',
      tab: tabId
    });
  }

  generateMockExtendedClipsData() {
    return Array.from({ length: 24 }, (_, i) => ({
      id: `clip-${i}`,
      title: `Epic Gaming Moment ${i + 1}`,
      thumbnailUrl: `https://example.com/clips/clip-${i}-thumb.jpg`,
      duration: Math.floor(Math.random() * 120) + 15,
      views: Math.floor(Math.random() * 50000) + 1000,
      creator: `Player${Math.floor(Math.random() * 10) + 1}`
    }));
  }

  generateMockScreenshotData() {
    return Array.from({ length: 32 }, (_, i) => ({
      id: `screenshot-${i}`,
      imageUrl: `https://example.com/screenshots/screenshot-${i}.jpg`,
      description: `Amazing gaming screenshot ${i + 1}`,
      creator: `Player${Math.floor(Math.random() * 10) + 1}`,
      likes: Math.floor(Math.random() * 1000) + 50
    }));
  }
}

/**
 * Demo integration function for easy testing
 */
export function initializeMobileMediaDemo() {
  // Add styles to the document
  const demoStyles = document.createElement('style');
  demoStyles.textContent = `
    .mobile-media-demo {
      max-width: 100%;
      margin: 0 auto;
      padding: 1rem;
      background: var(--gaming-bg);
      min-height: 100vh;
    }
    
    .section-title {
      color: var(--gaming-accent);
      font-size: 1.2rem;
      margin: 1rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(0, 255, 136, 0.2);
    }
    
    .demo-tab-controls {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
      padding: 1rem;
      background: rgba(26, 26, 46, 0.5);
      border-radius: 12px;
      overflow-x: auto;
    }
    
    .demo-tab-button {
      padding: 0.75rem 1rem;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: var(--gaming-accent);
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
      min-width: var(--touch-target-recommended);
    }
    
    .demo-tab-button.active {
      background: var(--gaming-accent);
      color: black;
    }
    
    .demo-content-section {
      min-height: 400px;
    }
  `;
  document.head.appendChild(demoStyles);

  // Create demo container
  const demoContainer = document.createElement('div');
  demoContainer.id = 'mobile-media-demo-container';
  demoContainer.className = 'mobile-media-demo';
  
  // Create demo navigation
  const demoNav = document.createElement('div');
  demoNav.className = 'demo-tab-controls';
  
  const demoTabs = [
    { id: 'tournament', label: '🏆 Tournament', class: TournamentPageExample },
    { id: 'clan', label: '🏰 Clan Management', class: ClanManagementExample },
    { id: 'gallery', label: '🎮 Content Gallery', class: GamingContentGalleryExample }
  ];

  demoTabs.forEach((tab, index) => {
    const tabButton = document.createElement('button');
    tabButton.className = `demo-tab-button ${index === 0 ? 'active' : ''}`;
    tabButton.textContent = tab.label;
    
    tabButton.addEventListener('click', () => {
      switchDemoTab(tab.id, tab.class);
      
      // Update active state
      demoNav.querySelectorAll('.demo-tab-button').forEach(btn => {
        btn.classList.remove('active');
      });
      tabButton.classList.add('active');
    });
    
    demoNav.appendChild(tabButton);
  });

  // Create demo content area
  const demoContent = document.createElement('div');
  demoContent.id = 'demo-content-area';
  demoContent.className = 'demo-content-section';
  
  demoContainer.appendChild(demoNav);
  demoContainer.appendChild(demoContent);
  document.body.appendChild(demoContainer);

  // Initialize first demo
  switchDemoTab('tournament', TournamentPageExample);
  
  console.log('🚀 Mobile Media Demo initialized');
}

function switchDemoTab(tabId, DemoClass) {
  const contentArea = document.getElementById('demo-content-area');
  if (contentArea && DemoClass) {
    contentArea.innerHTML = '';
    contentArea.innerHTML = '<div id="demo-content"></div>';
    new DemoClass('demo-content');
  }
}

// Auto-initialize if in demo mode
if (window.location.search.includes('demo=mobile-media')) {
  document.addEventListener('DOMContentLoaded', initializeMobileMediaDemo);
}