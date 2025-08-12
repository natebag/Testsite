/**
 * MLG.clan Fallback Data System
 * Comprehensive fallback data management for graceful degradation
 * 
 * @author Claude Code - Frontend Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

class MLGFallbackSystem {
  constructor() {
    this.fallbackData = new Map();
    this.generators = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
    this.isInitialized = false;
    
    // Gaming-themed fallback data with realistic content
    this.staticFallbacks = {
      userProfile: {
        id: 'fallback_user',
        gamertag: 'OfflineGamer',
        level: 42,
        xp: 13337,
        rank: 'MLG Pro',
        avatar: '🎮',
        clan: null,
        achievements: ['🏆 First Steps', '⚡ Speed Demon', '🎯 Marksman'],
        stats: {
          gamesPlayed: 256,
          victories: 184,
          winRate: 72,
          hoursPlayed: 420
        },
        joinDate: '2023-01-15T00:00:00Z',
        lastActive: new Date().toISOString()
      },
      
      clanData: {
        totalClans: 1337,
        activeClans: 892,
        totalMembers: 15420,
        clans: [
          {
            id: 'clan_1',
            name: '[MLG] Elite Gamers',
            tag: 'ELITE',
            description: 'Top-tier competitive gaming clan',
            members: 156,
            level: 89,
            founded: '2022-03-15T00:00:00Z',
            logo: '👑',
            isRecruiting: true,
            requirements: {
              minLevel: 25,
              minWinRate: 65
            },
            stats: {
              totalWins: 2847,
              tournaments: 23,
              ranking: 3
            }
          },
          {
            id: 'clan_2', 
            name: '[PRO] Night Raiders',
            tag: 'RAID',
            description: 'Late-night gaming specialists',
            members: 89,
            level: 72,
            founded: '2022-07-20T00:00:00Z',
            logo: '🌙',
            isRecruiting: true,
            requirements: {
              minLevel: 30,
              minWinRate: 60
            },
            stats: {
              totalWins: 1956,
              tournaments: 15,
              ranking: 7
            }
          },
          {
            id: 'clan_3',
            name: '[GG] Casual Legends',
            tag: 'CASU',
            description: 'Friendly community for all skill levels',
            members: 234,
            level: 45,
            founded: '2021-11-10T00:00:00Z',
            logo: '🎯',
            isRecruiting: true,
            requirements: {
              minLevel: 1,
              minWinRate: 0
            },
            stats: {
              totalWins: 3421,
              tournaments: 8,
              ranking: 12
            }
          }
        ]
      },
      
      votingData: {
        activeVotes: [
          {
            id: 'vote_1',
            title: 'New Tournament Format',
            description: 'Should we introduce a battle royale tournament?',
            type: 'proposal',
            creator: 'TournamentMaster',
            startTime: new Date(Date.now() - 86400000).toISOString(),
            endTime: new Date(Date.now() + 172800000).toISOString(),
            options: [
              { id: 'yes', text: 'Yes, bring on the battles!', votes: 1247 },
              { id: 'no', text: 'No, stick to current format', votes: 823 }
            ],
            totalVotes: 2070,
            burnRequirement: 10,
            status: 'active'
          },
          {
            id: 'vote_2',
            title: 'Clan Size Limit',
            description: 'Should we increase the maximum clan size from 200 to 300 members?',
            type: 'governance',
            creator: 'ClanLeader',
            startTime: new Date(Date.now() - 43200000).toISOString(),
            endTime: new Date(Date.now() + 259200000).toISOString(),
            options: [
              { id: 'increase', text: 'Yes, bigger clans!', votes: 892 },
              { id: 'keep', text: 'Keep current limit', votes: 567 },
              { id: 'decrease', text: 'Actually, make them smaller', votes: 123 }
            ],
            totalVotes: 1582,
            burnRequirement: 25,
            status: 'active'
          }
        ],
        completedVotes: [
          {
            id: 'vote_old1',
            title: 'Weekly Tournament Schedule',
            result: 'saturday_sunday',
            totalVotes: 3456,
            completedAt: new Date(Date.now() - 604800000).toISOString()
          }
        ],
        userVotes: 15,
        totalParticipation: 3456
      },
      
      leaderboardData: {
        users: [
          { rank: 1, gamertag: 'ProGamer2024', level: 99, xp: 250000, clan: '[MLG] Elite Gamers', winRate: 89 },
          { rank: 2, gamertag: 'EliteSniper', level: 97, xp: 245000, clan: '[PRO] Night Raiders', winRate: 87 },
          { rank: 3, gamertag: 'GameMaster', level: 95, xp: 240000, clan: '[MLG] Elite Gamers', winRate: 85 },
          { rank: 4, gamertag: 'SkillfulPlayer', level: 93, xp: 235000, clan: '[GG] Casual Legends', winRate: 83 },
          { rank: 5, gamertag: 'CompetitiveGamer', level: 91, xp: 230000, clan: '[PRO] Night Raiders', winRate: 81 }
        ],
        clans: [
          { rank: 1, name: '[MLG] Elite Gamers', members: 156, avgLevel: 67, totalXP: 2450000, tournaments: 23 },
          { rank: 2, name: '[PRO] Night Raiders', members: 89, avgLevel: 63, totalXP: 1890000, tournaments: 15 },
          { rank: 3, name: '[GG] Casual Legends', members: 234, avgLevel: 45, totalXP: 3421000, tournaments: 8 },
          { rank: 4, name: '[CORE] Veterans', members: 78, avgLevel: 71, totalXP: 1567000, tournaments: 12 },
          { rank: 5, name: '[NOVA] Rising Stars', members: 145, avgLevel: 39, totalXP: 2100000, tournaments: 6 }
        ],
        lastUpdated: new Date().toISOString()
      },
      
      contentData: {
        featured: [
          {
            id: 'content_1',
            title: 'Epic 1v5 Clutch Victory',
            description: 'Watch this insane comeback in ranked play',
            creator: 'ClutchKing',
            type: 'video',
            thumbnail: '🎬',
            views: 15420,
            likes: 2847,
            duration: '2:34',
            uploadDate: new Date(Date.now() - 86400000).toISOString(),
            tags: ['clutch', 'ranked', 'highlights']
          },
          {
            id: 'content_2',
            title: 'Advanced Movement Guide',
            description: 'Master these techniques to dominate',
            creator: 'MovementGuru', 
            type: 'tutorial',
            thumbnail: '📚',
            views: 8932,
            likes: 1456,
            duration: '8:45',
            uploadDate: new Date(Date.now() - 172800000).toISOString(),
            tags: ['tutorial', 'movement', 'tips']
          }
        ],
        recent: [
          {
            id: 'content_3',
            title: 'Funny Gaming Moments Compilation',
            creator: 'FunnyGamer',
            type: 'highlight',
            thumbnail: '😂',
            views: 3421,
            likes: 567,
            uploadDate: new Date(Date.now() - 43200000).toISOString()
          }
        ],
        totalContent: 12847,
        activeCreators: 1456
      },
      
      systemStats: {
        totalUsers: 25847,
        activeUsers: 15420,
        totalClans: 1337,
        activeClans: 892,
        totalVotes: 456,
        totalContent: 12847,
        systemStatus: 'operational',
        uptime: '99.9%',
        lastMaintenance: new Date(Date.now() - 2592000000).toISOString(),
        serverLoad: 65,
        responseTime: 45
      }
    };

    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    // Load static fallbacks
    this.loadStaticFallbacks();
    
    // Setup data generators
    this.setupDataGenerators();
    
    // Load cached fallbacks from storage
    this.loadCachedFallbacks();
    
    this.isInitialized = true;
    console.log('🎮 MLG Fallback System initialized');
  }

  loadStaticFallbacks() {
    Object.entries(this.staticFallbacks).forEach(([key, data]) => {
      this.fallbackData.set(key, {
        data,
        timestamp: Date.now(),
        source: 'static',
        expires: Date.now() + this.cacheTimeout
      });
    });
  }

  setupDataGenerators() {
    // Dynamic user profile generator
    this.generators.set('userProfile', (baseData = {}) => ({
      id: baseData.id || `user_${Date.now()}`,
      gamertag: baseData.gamertag || this.generateGamertag(),
      level: baseData.level || this.randomBetween(1, 99),
      xp: baseData.xp || this.randomBetween(0, 250000),
      rank: this.generateRank(),
      avatar: this.randomEmoji(['🎮', '👨‍💻', '🎯', '⚡', '🏆', '🎲']),
      clan: baseData.clan || null,
      achievements: this.generateAchievements(),
      stats: this.generateUserStats(),
      joinDate: baseData.joinDate || this.randomPastDate(),
      lastActive: new Date().toISOString()
    }));

    // Dynamic clan generator
    this.generators.set('clanData', () => ({
      totalClans: this.randomBetween(1000, 2000),
      activeClans: this.randomBetween(800, 1200),
      totalMembers: this.randomBetween(10000, 20000),
      clans: Array.from({ length: 10 }, () => this.generateClan())
    }));

    // Dynamic leaderboard generator
    this.generators.set('leaderboardData', () => ({
      users: Array.from({ length: 10 }, (_, i) => this.generateLeaderboardUser(i + 1)),
      clans: Array.from({ length: 10 }, (_, i) => this.generateLeaderboardClan(i + 1)),
      lastUpdated: new Date().toISOString()
    }));

    // Dynamic content generator
    this.generators.set('contentData', () => ({
      featured: Array.from({ length: 5 }, () => this.generateContent('featured')),
      recent: Array.from({ length: 10 }, () => this.generateContent('recent')),
      totalContent: this.randomBetween(10000, 15000),
      activeCreators: this.randomBetween(1000, 2000)
    }));
  }

  loadCachedFallbacks() {
    try {
      const cached = localStorage.getItem('mlg_fallback_cache');
      if (cached) {
        const cacheData = JSON.parse(cached);
        Object.entries(cacheData).forEach(([key, value]) => {
          if (value.expires > Date.now()) {
            this.fallbackData.set(key, value);
          }
        });
        console.log('📂 Loaded cached fallback data');
      }
    } catch (error) {
      console.warn('Failed to load cached fallbacks:', error);
    }
  }

  saveCachedFallbacks() {
    try {
      const cacheData = {};
      this.fallbackData.forEach((value, key) => {
        if (value.source !== 'static') {
          cacheData[key] = value;
        }
      });
      localStorage.setItem('mlg_fallback_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save fallback cache:', error);
    }
  }

  // Main fallback retrieval method
  getFallbackData(dataType, options = {}) {
    const cached = this.fallbackData.get(dataType);
    
    // Check if cached data is still valid
    if (cached && cached.expires > Date.now()) {
      console.log(`📋 Using cached fallback for ${dataType}`);
      return this.enrichFallbackData(cached.data, dataType, options);
    }
    
    // Generate fresh data if generator exists
    if (this.generators.has(dataType)) {
      console.log(`🎲 Generating dynamic fallback for ${dataType}`);
      const generated = this.generators.get(dataType)(options);
      
      // Cache the generated data
      this.fallbackData.set(dataType, {
        data: generated,
        timestamp: Date.now(),
        source: 'generated',
        expires: Date.now() + this.cacheTimeout
      });
      
      this.saveCachedFallbacks();
      return this.enrichFallbackData(generated, dataType, options);
    }
    
    // Fallback to static data
    console.log(`📄 Using static fallback for ${dataType}`);
    const staticData = this.staticFallbacks[dataType];
    return staticData ? this.enrichFallbackData(staticData, dataType, options) : null;
  }

  enrichFallbackData(data, dataType, options) {
    // Add fallback metadata
    const enriched = {
      ...data,
      _fallback: {
        isFallback: true,
        dataType,
        timestamp: new Date().toISOString(),
        source: 'offline_cache',
        options
      }
    };

    // Apply filters if provided
    if (options.filter) {
      return this.applyFilters(enriched, options.filter);
    }

    // Apply pagination if provided
    if (options.pagination) {
      return this.applyPagination(enriched, options.pagination);
    }

    return enriched;
  }

  applyFilters(data, filters) {
    // Simple filter implementation for common cases
    if (filters.search && data.clans) {
      data.clans = data.clans.filter(clan =>
        clan.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        clan.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.minLevel && data.users) {
      data.users = data.users.filter(user => user.level >= filters.minLevel);
    }

    return data;
  }

  applyPagination(data, pagination) {
    const { page = 1, limit = 10 } = pagination;
    const start = (page - 1) * limit;
    const end = start + limit;

    if (data.clans) {
      data.clans = data.clans.slice(start, end);
    }

    if (data.users) {
      data.users = data.users.slice(start, end);
    }

    if (data.featured) {
      data.featured = data.featured.slice(start, end);
    }

    return data;
  }

  // Data generators
  generateGamertag() {
    const prefixes = ['Pro', 'Elite', 'Master', 'Gaming', 'MLG', 'Skill', 'Epic', 'Legend'];
    const suffixes = ['Gamer', 'Player', 'Pro', 'King', 'God', 'Beast', 'Ninja', 'Sniper'];
    const numbers = Math.floor(Math.random() * 9999);
    
    return `${this.randomChoice(prefixes)}${this.randomChoice(suffixes)}${numbers}`;
  }

  generateRank() {
    const ranks = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'MLG Pro'];
    return this.randomChoice(ranks);
  }

  generateAchievements() {
    const achievements = [
      '🏆 Tournament Winner', '⚡ Speed Demon', '🎯 Marksman',
      '🛡️ Defender', '👑 Clan Leader', '🔥 Killstreak',
      '💎 Diamond Rank', '🎮 Gaming Legend', '⭐ Rising Star'
    ];
    
    const count = this.randomBetween(3, 8);
    return this.shuffleArray(achievements).slice(0, count);
  }

  generateUserStats() {
    const gamesPlayed = this.randomBetween(50, 1000);
    const victories = this.randomBetween(20, Math.floor(gamesPlayed * 0.8));
    
    return {
      gamesPlayed,
      victories,
      winRate: Math.round((victories / gamesPlayed) * 100),
      hoursPlayed: this.randomBetween(100, 2000)
    };
  }

  generateClan() {
    const names = ['Elite Warriors', 'Night Raiders', 'Storm Bringers', 'Void Hunters', 'Cyber Knights'];
    const tags = ['ELIT', 'RAID', 'STRM', 'VOID', 'CYBR', 'APEX', 'CORE', 'NOVA'];
    const logos = ['👑', '🌙', '⚡', '🗡️', '🛡️', '⭐', '🔥', '💎'];
    
    const members = this.randomBetween(20, 250);
    const level = this.randomBetween(10, 99);
    
    return {
      id: `clan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `[${this.randomChoice(tags)}] ${this.randomChoice(names)}`,
      tag: this.randomChoice(tags),
      description: 'A competitive gaming clan focused on excellence',
      members,
      level,
      founded: this.randomPastDate(),
      logo: this.randomChoice(logos),
      isRecruiting: Math.random() > 0.3,
      requirements: {
        minLevel: this.randomBetween(1, 50),
        minWinRate: this.randomBetween(50, 80)
      },
      stats: {
        totalWins: this.randomBetween(100, 5000),
        tournaments: this.randomBetween(1, 50),
        ranking: this.randomBetween(1, 100)
      }
    };
  }

  generateLeaderboardUser(rank) {
    return {
      rank,
      gamertag: this.generateGamertag(),
      level: this.randomBetween(80, 99),
      xp: this.randomBetween(200000, 250000 - (rank * 1000)),
      clan: this.randomChoice(['[MLG] Elite Gamers', '[PRO] Night Raiders', '[GG] Casual Legends', null]),
      winRate: this.randomBetween(70, 90)
    };
  }

  generateLeaderboardClan(rank) {
    const clan = this.generateClan();
    return {
      rank,
      name: clan.name,
      members: clan.members,
      avgLevel: this.randomBetween(40, 80),
      totalXP: this.randomBetween(1000000, 3000000 - (rank * 100000)),
      tournaments: clan.stats.tournaments
    };
  }

  generateContent(type = 'featured') {
    const titles = [
      'Epic Gaming Moments', 'Pro Tips and Tricks', 'Tournament Highlights',
      'Funny Gaming Fails', 'Strategy Guide', 'Weapon Review',
      'Map Analysis', 'Team Coordination', 'Solo Queue Tips'
    ];
    
    const creators = [
      'ProGamer', 'ContentKing', 'GameMaster', 'SkillGuru', 'EpicPlayer'
    ];
    
    const contentTypes = ['video', 'tutorial', 'highlight', 'review'];
    const thumbnails = ['🎬', '📚', '🎯', '⚡', '🏆', '🎲'];
    
    return {
      id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: this.randomChoice(titles),
      description: 'Amazing gaming content you don\'t want to miss',
      creator: this.randomChoice(creators),
      type: this.randomChoice(contentTypes),
      thumbnail: this.randomChoice(thumbnails),
      views: this.randomBetween(100, 50000),
      likes: this.randomBetween(10, 5000),
      duration: `${this.randomBetween(1, 15)}:${String(this.randomBetween(0, 59)).padStart(2, '0')}`,
      uploadDate: this.randomPastDate(),
      tags: ['gaming', 'mlg', 'competitive'].concat(this.randomChoice(['tutorial', 'highlight', 'funny']))
    };
  }

  // Cache management
  updateFallbackData(dataType, data, source = 'api') {
    this.fallbackData.set(dataType, {
      data,
      timestamp: Date.now(),
      source,
      expires: Date.now() + this.cacheTimeout
    });
    
    this.saveCachedFallbacks();
    console.log(`💾 Updated fallback data for ${dataType}`);
  }

  clearFallbackData(dataType = null) {
    if (dataType) {
      this.fallbackData.delete(dataType);
      console.log(`🗑️ Cleared fallback data for ${dataType}`);
    } else {
      this.fallbackData.clear();
      localStorage.removeItem('mlg_fallback_cache');
      this.loadStaticFallbacks(); // Reload static data
      console.log('🧹 Cleared all fallback data');
    }
  }

  // Utility methods
  randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  randomEmoji(emojis) {
    return this.randomChoice(emojis);
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  randomPastDate() {
    const now = Date.now();
    const pastTime = this.randomBetween(86400000, 31536000000); // 1 day to 1 year ago
    return new Date(now - pastTime).toISOString();
  }

  // Public API
  registerGenerator(dataType, generatorFn) {
    this.generators.set(dataType, generatorFn);
    console.log(`📝 Registered generator for ${dataType}`);
  }

  isDataAvailable(dataType) {
    return this.fallbackData.has(dataType) || this.generators.has(dataType) || this.staticFallbacks[dataType];
  }

  getAvailableDataTypes() {
    const types = new Set();
    
    // Add cached types
    this.fallbackData.forEach((_, key) => types.add(key));
    
    // Add generator types
    this.generators.forEach((_, key) => types.add(key));
    
    // Add static types
    Object.keys(this.staticFallbacks).forEach(key => types.add(key));
    
    return Array.from(types);
  }

  getDataStatus() {
    const status = {};
    
    this.getAvailableDataTypes().forEach(dataType => {
      const cached = this.fallbackData.get(dataType);
      status[dataType] = {
        available: true,
        cached: !!cached,
        source: cached?.source || 'static',
        age: cached ? Date.now() - cached.timestamp : null,
        expires: cached?.expires || null
      };
    });
    
    return status;
  }

  // Integration methods
  wrapApiCall(apiCall, fallbackType, options = {}) {
    return async (...args) => {
      try {
        const result = await apiCall(...args);
        
        // Update fallback data with successful API response
        if (result && fallbackType) {
          this.updateFallbackData(fallbackType, result, 'api');
        }
        
        return result;
      } catch (error) {
        console.warn(`API call failed, using fallback for ${fallbackType}:`, error);
        
        // Return fallback data
        const fallbackData = this.getFallbackData(fallbackType, options);
        
        if (fallbackData) {
          // Show user notification about fallback usage
          if (window.MLGErrorHandler) {
            window.MLGErrorHandler.createNotification({
              type: 'info',
              title: '📋 Using Cached Data',
              message: `Showing offline data for ${fallbackType.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
              icon: '💾'
            });
          }
          
          return fallbackData;
        }
        
        throw error; // Re-throw if no fallback available
      }
    };
  }
}

// Create global instance
window.MLGFallbackSystem = new MLGFallbackSystem();

// Export for ES6 modules
export default MLGFallbackSystem;
export { MLGFallbackSystem };