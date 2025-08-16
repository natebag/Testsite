/**
 * MLG Username Tagging Service for MLG.clan Platform
 * 
 * Provides automatic [MLG] username tagging for all clan members across the platform.
 * Ensures consistent MLG branding and manages tag application, validation, and display.
 * 
 * Features:
 * - Automatic [MLG] tag addition for clan members
 * - Username display formatting and validation
 * - Integration with user profiles and clan systems
 * - Cache management for tagged usernames
 * - Event-driven tag application and removal
 * - Xbox 360 gaming theme compatibility
 * 
 * @author Claude Code - Frontend Production Engineer
 * @version 1.0.0
 * @created 2025-08-13
 */

import { EventEmitter } from 'events';

/**
 * MLG Tagging Configuration
 */
const MLG_CONFIG = {
  // Tag Configuration
  TAG_PREFIX: '[MLG]',
  TAG_SUFFIX: '',
  TAG_SEPARATOR: ' ',
  
  // Display Options
  TAG_COLOR: '#00d4ff', // Gaming accent color
  TAG_WEIGHT: 'bold',
  TAG_CASE: 'uppercase',
  
  // Validation Rules
  MAX_USERNAME_LENGTH: 32,
  MIN_USERNAME_LENGTH: 3,
  USERNAME_PATTERN: /^[a-zA-Z0-9_-]+$/,
  RESERVED_PREFIXES: ['[ADMIN]', '[MOD]', '[DEV]', '[SYSTEM]'],
  
  // Cache Configuration
  CACHE_TTL: 600, // 10 minutes
  CACHE_KEY_PREFIX: 'mlg_username',
  
  // Event Configuration
  ENABLE_EVENTS: true,
  EVENT_NAMESPACE: 'mlg_tagging'
};

/**
 * MLG Username Tagging Service Class
 */
class MLGUsernameTaggingService extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = { ...MLG_CONFIG, ...options };
    this.cache = options.cache || null; // Redis or memory cache
    this.db = options.db || null;
    this.logger = options.logger || console;
    
    // Internal state
    this.taggedUsernameCache = new Map();
    this.clanMembershipCache = new Map();
    this.isInitialized = false;
    
    // Bind methods
    this.tagUsername = this.tagUsername.bind(this);
    this.untagUsername = this.untagUsername.bind(this);
    this.getDisplayUsername = this.getDisplayUsername.bind(this);
    this.validateUsername = this.validateUsername.bind(this);
    this.applyClanMemberTagging = this.applyClanMemberTagging.bind(this);
    
    this.logger.info('🏷️ MLG Username Tagging Service initialized');
  }

  /**
   * Initialize the service
   */
  async initialize() {
    try {
      if (this.isInitialized) return;
      
      this.logger.info('🚀 Initializing MLG Username Tagging Service...');
      
      // Load existing clan memberships for tagging
      await this.loadClanMemberships();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Start cache maintenance
      this.startCacheMaintenance();
      
      this.isInitialized = true;
      this.logger.info('✅ MLG Username Tagging Service initialized successfully');
      
      return true;
    } catch (error) {
      this.logger.error('❌ Failed to initialize MLG Username Tagging Service:', error);
      throw error;
    }
  }

  /**
   * Apply [MLG] tag to username
   * @param {string} username - Original username
   * @param {Object} options - Tagging options
   * @returns {string} Tagged username
   */
  tagUsername(username, options = {}) {
    try {
      if (!username || typeof username !== 'string') {
        throw new Error('Invalid username provided');
      }

      // Clean and validate username
      const cleanUsername = this.cleanUsername(username);
      this.validateUsername(cleanUsername);

      // Check if already tagged
      if (this.isAlreadyTagged(cleanUsername)) {
        return cleanUsername;
      }

      // Apply MLG tag
      const taggedUsername = `${this.config.TAG_PREFIX}${this.config.TAG_SEPARATOR}${cleanUsername}`;
      
      // Validate final tagged username length
      if (taggedUsername.length > this.config.MAX_USERNAME_LENGTH + this.config.TAG_PREFIX.length + this.config.TAG_SEPARATOR.length) {
        this.logger.warn(`⚠️ Tagged username too long: ${taggedUsername}`);
        return cleanUsername; // Return original if too long
      }

      // Cache the tagged username
      this.cacheTaggedUsername(cleanUsername, taggedUsername);

      // Emit tagging event
      if (this.config.ENABLE_EVENTS) {
        this.emit('username_tagged', {
          originalUsername: cleanUsername,
          taggedUsername,
          timestamp: new Date(),
          options
        });
      }

      this.logger.debug(`🏷️ Username tagged: ${cleanUsername} → ${taggedUsername}`);
      return taggedUsername;

    } catch (error) {
      this.logger.error('❌ Error tagging username:', error);
      return username; // Return original on error
    }
  }

  /**
   * Remove [MLG] tag from username
   * @param {string} taggedUsername - Tagged username
   * @returns {string} Clean username
   */
  untagUsername(taggedUsername) {
    try {
      if (!taggedUsername || typeof taggedUsername !== 'string') {
        return taggedUsername;
      }

      // Check if username has MLG tag
      if (!this.isAlreadyTagged(taggedUsername)) {
        return taggedUsername;
      }

      // Remove MLG tag
      const cleanUsername = taggedUsername
        .replace(this.config.TAG_PREFIX + this.config.TAG_SEPARATOR, '')
        .trim();

      // Remove from cache
      this.removeFromCache(cleanUsername);

      // Emit untagging event
      if (this.config.ENABLE_EVENTS) {
        this.emit('username_untagged', {
          taggedUsername,
          cleanUsername,
          timestamp: new Date()
        });
      }

      this.logger.debug(`🏷️ Username untagged: ${taggedUsername} → ${cleanUsername}`);
      return cleanUsername;

    } catch (error) {
      this.logger.error('❌ Error untagging username:', error);
      return taggedUsername;
    }
  }

  /**
   * Get display username based on clan membership
   * @param {string} userId - User ID
   * @param {string} username - Original username
   * @param {Object} options - Display options
   * @returns {Promise<string>} Display username
   */
  async getDisplayUsername(userId, username, options = {}) {
    try {
      if (!userId || !username) {
        return username;
      }

      // Check cache first
      const cacheKey = `${this.config.CACHE_KEY_PREFIX}:display:${userId}`;
      if (this.cache) {
        const cached = await this.cache.get(cacheKey);
        if (cached) {
          return JSON.parse(cached).displayUsername;
        }
      }

      // Check clan membership
      const isClanMember = await this.checkClanMembership(userId);
      
      let displayUsername = username;
      
      if (isClanMember) {
        displayUsername = this.tagUsername(username, {
          userId,
          source: 'clan_membership',
          ...options
        });
      }

      // Cache the result
      if (this.cache) {
        await this.cache.setEx(cacheKey, this.config.CACHE_TTL, JSON.stringify({
          displayUsername,
          isClanMember,
          timestamp: Date.now()
        }));
      }

      return displayUsername;

    } catch (error) {
      this.logger.error('❌ Error getting display username:', error);
      return username;
    }
  }

  /**
   * Apply MLG tagging to all clan members
   * @param {string} clanId - Clan ID (optional, processes all clans if not provided)
   * @returns {Promise<Object>} Processing results
   */
  async applyClanMemberTagging(clanId = null) {
    try {
      this.logger.info('🎯 Applying MLG tagging to clan members...');
      
      const results = {
        processed: 0,
        tagged: 0,
        errors: 0,
        clanId: clanId
      };

      // Get clan members
      const members = await this.getClanMembers(clanId);
      
      for (const member of members) {
        try {
          results.processed++;
          
          // Apply tagging if not already tagged
          const displayUsername = await this.getDisplayUsername(
            member.user_id, 
            member.username || member.display_name, 
            { clanId: member.clan_id }
          );
          
          // Update user display if changed
          if (displayUsername !== (member.username || member.display_name)) {
            await this.updateUserDisplayName(member.user_id, displayUsername);
            results.tagged++;
          }
          
        } catch (memberError) {
          this.logger.error(`❌ Error processing member ${member.user_id}:`, memberError);
          results.errors++;
        }
      }

      this.logger.info(`✅ MLG tagging complete: ${results.tagged}/${results.processed} users tagged`);
      
      // Emit batch tagging event
      if (this.config.ENABLE_EVENTS) {
        this.emit('batch_tagging_complete', results);
      }

      return results;

    } catch (error) {
      this.logger.error('❌ Error applying clan member tagging:', error);
      throw error;
    }
  }

  /**
   * Validate username format and constraints
   * @param {string} username - Username to validate
   * @returns {boolean} True if valid
   */
  validateUsername(username) {
    if (!username || typeof username !== 'string') {
      throw new Error('Username is required and must be a string');
    }

    // Check length
    if (username.length < this.config.MIN_USERNAME_LENGTH) {
      throw new Error(`Username must be at least ${this.config.MIN_USERNAME_LENGTH} characters`);
    }

    if (username.length > this.config.MAX_USERNAME_LENGTH) {
      throw new Error(`Username must not exceed ${this.config.MAX_USERNAME_LENGTH} characters`);
    }

    // Check pattern
    if (!this.config.USERNAME_PATTERN.test(username)) {
      throw new Error('Username can only contain letters, numbers, underscores, and hyphens');
    }

    // Check reserved prefixes
    for (const prefix of this.config.RESERVED_PREFIXES) {
      if (username.toUpperCase().startsWith(prefix)) {
        throw new Error(`Username cannot start with reserved prefix: ${prefix}`);
      }
    }

    return true;
  }

  /**
   * Check if username is already tagged
   * @param {string} username - Username to check
   * @returns {boolean} True if already tagged
   */
  isAlreadyTagged(username) {
    return username.startsWith(this.config.TAG_PREFIX + this.config.TAG_SEPARATOR);
  }

  /**
   * Clean username of extra whitespace and invalid characters
   * @param {string} username - Username to clean
   * @returns {string} Cleaned username
   */
  cleanUsername(username) {
    return username.trim().replace(/\s+/g, '_');
  }

  /**
   * Check if user is a clan member
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if clan member
   */
  async checkClanMembership(userId) {
    try {
      // Check cache first
      if (this.clanMembershipCache.has(userId)) {
        const cached = this.clanMembershipCache.get(userId);
        if (Date.now() - cached.timestamp < this.config.CACHE_TTL * 1000) {
          return cached.isMember;
        }
      }

      // Query database
      let isMember = false;
      
      if (this.db) {
        const result = await this.db.query(`
          SELECT COUNT(*) as member_count
          FROM clan_members cm
          JOIN clans c ON cm.clan_id = c.id
          WHERE cm.user_id = $1 
            AND cm.is_active = true 
            AND c.status = 'active'
        `, [userId]);
        
        isMember = parseInt(result.rows[0].member_count) > 0;
      }

      // Cache the result
      this.clanMembershipCache.set(userId, {
        isMember,
        timestamp: Date.now()
      });

      return isMember;

    } catch (error) {
      this.logger.error('❌ Error checking clan membership:', error);
      return false;
    }
  }

  /**
   * Get clan members for tagging
   * @param {string} clanId - Clan ID (optional)
   * @returns {Promise<Array>} Array of clan members
   */
  async getClanMembers(clanId = null) {
    try {
      if (!this.db) {
        return [];
      }

      let query = `
        SELECT 
          cm.user_id,
          cm.clan_id,
          u.username,
          up.display_name,
          c.name as clan_name
        FROM clan_members cm
        JOIN users u ON cm.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        JOIN clans c ON cm.clan_id = c.id
        WHERE cm.is_active = true 
          AND u.status = 'active'
          AND c.status = 'active'
      `;
      
      const params = [];
      
      if (clanId) {
        query += ' AND cm.clan_id = $1';
        params.push(clanId);
      }
      
      query += ' ORDER BY c.name, u.username';

      const result = await this.db.query(query, params);
      return result.rows;

    } catch (error) {
      this.logger.error('❌ Error getting clan members:', error);
      return [];
    }
  }

  /**
   * Update user display name
   * @param {string} userId - User ID
   * @param {string} displayName - New display name
   * @returns {Promise<boolean>} Success status
   */
  async updateUserDisplayName(userId, displayName) {
    try {
      if (!this.db) {
        return false;
      }

      await this.db.query(`
        UPDATE user_profiles 
        SET display_name = $1, updated_at = NOW()
        WHERE user_id = $2
      `, [displayName, userId]);

      // Invalidate cache
      const cacheKey = `${this.config.CACHE_KEY_PREFIX}:display:${userId}`;
      if (this.cache) {
        await this.cache.del(cacheKey);
      }

      return true;

    } catch (error) {
      this.logger.error('❌ Error updating user display name:', error);
      return false;
    }
  }

  /**
   * Load existing clan memberships for caching
   */
  async loadClanMemberships() {
    try {
      if (!this.db) return;

      const result = await this.db.query(`
        SELECT DISTINCT cm.user_id
        FROM clan_members cm
        JOIN clans c ON cm.clan_id = c.id
        WHERE cm.is_active = true AND c.status = 'active'
      `);

      // Cache all active clan members
      result.rows.forEach(row => {
        this.clanMembershipCache.set(row.user_id, {
          isMember: true,
          timestamp: Date.now()
        });
      });

      this.logger.info(`📊 Loaded ${result.rows.length} clan memberships into cache`);

    } catch (error) {
      this.logger.error('❌ Error loading clan memberships:', error);
    }
  }

  /**
   * Cache tagged username
   * @param {string} originalUsername - Original username
   * @param {string} taggedUsername - Tagged username
   */
  cacheTaggedUsername(originalUsername, taggedUsername) {
    this.taggedUsernameCache.set(originalUsername, {
      taggedUsername,
      timestamp: Date.now()
    });
  }

  /**
   * Remove username from cache
   * @param {string} username - Username to remove
   */
  removeFromCache(username) {
    this.taggedUsernameCache.delete(username);
  }

  /**
   * Setup event listeners for clan membership changes
   */
  setupEventListeners() {
    // Listen for clan membership events
    this.on('clan_member_added', async (data) => {
      try {
        await this.handleClanMemberAdded(data);
      } catch (error) {
        this.logger.error('❌ Error handling clan member added:', error);
      }
    });

    this.on('clan_member_removed', async (data) => {
      try {
        await this.handleClanMemberRemoved(data);
      } catch (error) {
        this.logger.error('❌ Error handling clan member removed:', error);
      }
    });

    this.logger.debug('🎧 Event listeners setup complete');
  }

  /**
   * Handle new clan member addition
   * @param {Object} data - Member data
   */
  async handleClanMemberAdded(data) {
    const { userId, username } = data;
    
    // Update cache
    this.clanMembershipCache.set(userId, {
      isMember: true,
      timestamp: Date.now()
    });

    // Apply MLG tagging
    if (username) {
      const taggedUsername = this.tagUsername(username, {
        userId,
        source: 'new_member'
      });
      
      await this.updateUserDisplayName(userId, taggedUsername);
    }

    this.logger.info(`🆕 Applied MLG tagging to new clan member: ${userId}`);
  }

  /**
   * Handle clan member removal
   * @param {Object} data - Member data
   */
  async handleClanMemberRemoved(data) {
    const { userId, username } = data;
    
    // Update cache
    this.clanMembershipCache.set(userId, {
      isMember: false,
      timestamp: Date.now()
    });

    // Remove MLG tagging
    if (username) {
      const cleanUsername = this.untagUsername(username);
      await this.updateUserDisplayName(userId, cleanUsername);
    }

    this.logger.info(`🗑️ Removed MLG tagging from former clan member: ${userId}`);
  }

  /**
   * Start cache maintenance tasks
   */
  startCacheMaintenance() {
    // Clean expired cache entries every 10 minutes
    setInterval(() => {
      this.cleanExpiredCache();
    }, 10 * 60 * 1000);

    // Refresh clan memberships every hour
    setInterval(() => {
      this.loadClanMemberships();
    }, 60 * 60 * 1000);

    this.logger.debug('🧹 Cache maintenance tasks started');
  }

  /**
   * Clean expired cache entries
   */
  cleanExpiredCache() {
    const now = Date.now();
    const expiry = this.config.CACHE_TTL * 1000;

    // Clean tagged username cache
    for (const [key, entry] of this.taggedUsernameCache.entries()) {
      if (now - entry.timestamp > expiry) {
        this.taggedUsernameCache.delete(key);
      }
    }

    // Clean clan membership cache
    for (const [key, entry] of this.clanMembershipCache.entries()) {
      if (now - entry.timestamp > expiry) {
        this.clanMembershipCache.delete(key);
      }
    }
  }

  /**
   * Get service statistics
   * @returns {Object} Service statistics
   */
  getStatistics() {
    return {
      isInitialized: this.isInitialized,
      taggedUsernamesCached: this.taggedUsernameCache.size,
      clanMembershipsCached: this.clanMembershipCache.size,
      config: {
        tagPrefix: this.config.TAG_PREFIX,
        cacheTTL: this.config.CACHE_TTL,
        eventsEnabled: this.config.ENABLE_EVENTS
      },
      uptime: process.uptime()
    };
  }

  /**
   * Shutdown the service
   */
  async shutdown() {
    try {
      this.logger.info('🛑 Shutting down MLG Username Tagging Service...');
      
      // Clear caches
      this.taggedUsernameCache.clear();
      this.clanMembershipCache.clear();
      
      // Remove all listeners
      this.removeAllListeners();
      
      this.isInitialized = false;
      this.logger.info('✅ MLG Username Tagging Service shutdown complete');
      
    } catch (error) {
      this.logger.error('❌ Error during shutdown:', error);
    }
  }
}

// Export the service and configuration
export { MLGUsernameTaggingService, MLG_CONFIG };
export default MLGUsernameTaggingService;