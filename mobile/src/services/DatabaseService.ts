/**
 * Database Service for Offline Data Management
 * Uses SQLite for local data persistence and caching
 */

import SQLite from 'react-native-sqlite-storage';
import {User, Clan, Content, Vote, Notification} from '@/types';

interface DatabaseConfig {
  name: string;
  version: string;
  displayName: string;
  size: number;
}

class DatabaseServiceClass {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  private config: DatabaseConfig = {
    name: 'mlg_clan_mobile.db',
    version: '1.0',
    displayName: 'MLG.clan Mobile Database',
    size: 20 * 1024 * 1024, // 20MB
  };

  /**
   * Initialize database
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Enable debugging
      SQLite.DEBUG(false);
      SQLite.enablePromise(true);

      // Open database
      this.db = await SQLite.openDatabase(this.config);
      
      // Create tables
      await this.createTables();
      
      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create database tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createTables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        email TEXT NOT NULL,
        walletAddress TEXT,
        profilePicture TEXT,
        clanId TEXT,
        stats TEXT,
        preferences TEXT,
        achievements TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        syncStatus INTEGER DEFAULT 0
      )`,

      // Clans table
      `CREATE TABLE IF NOT EXISTS clans (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        logo TEXT,
        members TEXT,
        achievements TEXT,
        stats TEXT,
        settings TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        syncStatus INTEGER DEFAULT 0
      )`,

      // Content table
      `CREATE TABLE IF NOT EXISTS content (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        mediaUrl TEXT,
        thumbnailUrl TEXT,
        authorId TEXT NOT NULL,
        clanId TEXT,
        votes TEXT,
        comments TEXT,
        tags TEXT,
        metadata TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        syncStatus INTEGER DEFAULT 0
      )`,

      // Votes table
      `CREATE TABLE IF NOT EXISTS votes (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        contentId TEXT NOT NULL,
        type TEXT NOT NULL,
        tokensSpent REAL NOT NULL,
        signature TEXT NOT NULL,
        blockchainTxId TEXT,
        createdAt TEXT NOT NULL,
        syncStatus INTEGER DEFAULT 0
      )`,

      // Voting proposals table
      `CREATE TABLE IF NOT EXISTS voting_proposals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        options TEXT,
        creatorId TEXT NOT NULL,
        clanId TEXT,
        votes TEXT,
        status TEXT NOT NULL,
        startDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        syncStatus INTEGER DEFAULT 0
      )`,

      // Notifications table
      `CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        data TEXT,
        isRead INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        syncStatus INTEGER DEFAULT 0
      )`,

      // Transactions table
      `CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        token TEXT NOT NULL,
        toAddress TEXT,
        fromAddress TEXT,
        status TEXT NOT NULL,
        signature TEXT NOT NULL,
        blockTime INTEGER,
        fee REAL,
        memo TEXT,
        createdAt TEXT NOT NULL,
        syncStatus INTEGER DEFAULT 0
      )`,

      // Cache metadata table
      `CREATE TABLE IF NOT EXISTS cache_metadata (
        key TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )`,

      // Sync queue table
      `CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        operation TEXT NOT NULL,
        data TEXT NOT NULL,
        priority INTEGER DEFAULT 0,
        retries INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        scheduledAt TEXT
      )`
    ];

    for (const sql of createTables) {
      await this.db.executeSql(sql);
    }

    // Create indexes
    await this.createIndexes();
  }

  /**
   * Create database indexes
   */
  private async createIndexes(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(walletAddress)',
      'CREATE INDEX IF NOT EXISTS idx_content_author ON content(authorId)',
      'CREATE INDEX IF NOT EXISTS idx_content_clan ON content(clanId)',
      'CREATE INDEX IF NOT EXISTS idx_content_created ON content(createdAt)',
      'CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(userId)',
      'CREATE INDEX IF NOT EXISTS idx_votes_content ON votes(contentId)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(type)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(fromAddress)',
      'CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache_metadata(expiresAt)',
      'CREATE INDEX IF NOT EXISTS idx_sync_priority ON sync_queue(priority, createdAt)',
    ];

    for (const sql of indexes) {
      await this.db.executeSql(sql);
    }
  }

  // User operations
  async getUser(id: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const [result] = await this.db.executeSql(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows.item(0);
      return this.parseUserRow(row);
    } catch (error) {
      console.error('Failed to get user:', error);
      throw error;
    }
  }

  async saveUser(user: User): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.executeSql(
        `INSERT OR REPLACE INTO users (
          id, username, email, walletAddress, profilePicture, clanId,
          stats, preferences, achievements, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          user.username,
          user.email,
          user.walletAddress || null,
          user.profilePicture || null,
          user.clan?.id || null,
          JSON.stringify(user.stats),
          JSON.stringify(user.preferences),
          JSON.stringify(user.achievements),
          user.createdAt,
          user.updatedAt,
        ]
      );
    } catch (error) {
      console.error('Failed to save user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const user = await this.getUser(id);
      if (!user) {
        throw new Error('User not found');
      }

      const updatedUser = { ...user, ...updates, updatedAt: new Date().toISOString() };
      await this.saveUser(updatedUser);
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }

  // Clan operations
  async getClan(id: string): Promise<Clan | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const [result] = await this.db.executeSql(
        'SELECT * FROM clans WHERE id = ?',
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows.item(0);
      return this.parseClanRow(row);
    } catch (error) {
      console.error('Failed to get clan:', error);
      throw error;
    }
  }

  async saveClan(clan: Clan): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.executeSql(
        `INSERT OR REPLACE INTO clans (
          id, name, description, logo, members, achievements,
          stats, settings, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          clan.id,
          clan.name,
          clan.description,
          clan.logo || null,
          JSON.stringify(clan.members),
          JSON.stringify(clan.achievements),
          JSON.stringify(clan.stats),
          JSON.stringify(clan.settings),
          clan.createdAt,
          clan.updatedAt,
        ]
      );
    } catch (error) {
      console.error('Failed to save clan:', error);
      throw error;
    }
  }

  async updateClan(id: string, updates: Partial<Clan>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const clan = await this.getClan(id);
      if (!clan) {
        throw new Error('Clan not found');
      }

      const updatedClan = { ...clan, ...updates, updatedAt: new Date().toISOString() };
      await this.saveClan(updatedClan);
    } catch (error) {
      console.error('Failed to update clan:', error);
      throw error;
    }
  }

  // Content operations
  async getContent(id: string): Promise<Content | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const [result] = await this.db.executeSql(
        'SELECT * FROM content WHERE id = ?',
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows.item(0);
      return this.parseContentRow(row);
    } catch (error) {
      console.error('Failed to get content:', error);
      throw error;
    }
  }

  async getContentList(limit = 20, offset = 0): Promise<Content[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const [result] = await this.db.executeSql(
        'SELECT * FROM content ORDER BY createdAt DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );

      const content: Content[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        content.push(this.parseContentRow(result.rows.item(i)));
      }

      return content;
    } catch (error) {
      console.error('Failed to get content list:', error);
      throw error;
    }
  }

  async saveContent(content: Content): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.executeSql(
        `INSERT OR REPLACE INTO content (
          id, title, description, type, mediaUrl, thumbnailUrl,
          authorId, clanId, votes, comments, tags, metadata,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          content.id,
          content.title,
          content.description,
          content.type,
          content.mediaUrl || null,
          content.thumbnailUrl || null,
          content.author.id,
          content.clan?.id || null,
          JSON.stringify(content.votes),
          JSON.stringify(content.comments),
          JSON.stringify(content.tags),
          JSON.stringify(content.metadata),
          content.createdAt,
          content.updatedAt,
        ]
      );
    } catch (error) {
      console.error('Failed to save content:', error);
      throw error;
    }
  }

  async updateContent(id: string, updates: Partial<Content>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const content = await this.getContent(id);
      if (!content) {
        throw new Error('Content not found');
      }

      const updatedContent = { ...content, ...updates, updatedAt: new Date().toISOString() };
      await this.saveContent(updatedContent);
    } catch (error) {
      console.error('Failed to update content:', error);
      throw error;
    }
  }

  // Vote operations
  async saveVote(vote: Vote): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.executeSql(
        `INSERT OR REPLACE INTO votes (
          id, userId, contentId, type, tokensSpent, signature,
          blockchainTxId, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          vote.id,
          vote.userId,
          vote.contentId,
          vote.type,
          vote.tokensSpent,
          vote.signature,
          vote.blockchainTxId || null,
          vote.createdAt,
        ]
      );
    } catch (error) {
      console.error('Failed to save vote:', error);
      throw error;
    }
  }

  async updateVote(id: string, updates: Partial<Vote>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updates);
      values.push(id);

      await this.db.executeSql(
        `UPDATE votes SET ${setClause} WHERE id = ?`,
        values
      );
    } catch (error) {
      console.error('Failed to update vote:', error);
      throw error;
    }
  }

  // Notification operations
  async saveNotification(notification: Notification): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.executeSql(
        `INSERT OR REPLACE INTO notifications (
          id, type, title, body, data, isRead, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          notification.id,
          notification.type,
          notification.title,
          notification.body,
          JSON.stringify(notification.data),
          notification.isRead ? 1 : 0,
          notification.createdAt,
        ]
      );
    } catch (error) {
      console.error('Failed to save notification:', error);
      throw error;
    }
  }

  async getNotifications(limit = 50): Promise<Notification[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const [result] = await this.db.executeSql(
        'SELECT * FROM notifications ORDER BY createdAt DESC LIMIT ?',
        [limit]
      );

      const notifications: Notification[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        notifications.push({
          id: row.id,
          type: row.type,
          title: row.title,
          body: row.body,
          data: row.data ? JSON.parse(row.data) : null,
          isRead: row.isRead === 1,
          createdAt: row.createdAt,
        });
      }

      return notifications;
    } catch (error) {
      console.error('Failed to get notifications:', error);
      throw error;
    }
  }

  async updateNotification(id: string, updates: Partial<Notification>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updates).map(value => 
        typeof value === 'object' ? JSON.stringify(value) : value
      );
      values.push(id);

      await this.db.executeSql(
        `UPDATE notifications SET ${setClause} WHERE id = ?`,
        values
      );
    } catch (error) {
      console.error('Failed to update notification:', error);
      throw error;
    }
  }

  // Cache operations
  async setCache(key: string, data: any, ttlMinutes = 60): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
      
      await this.db.executeSql(
        'INSERT OR REPLACE INTO cache_metadata (key, data, expiresAt, createdAt) VALUES (?, ?, ?, ?)',
        [key, JSON.stringify(data), expiresAt, new Date().toISOString()]
      );
    } catch (error) {
      console.error('Failed to set cache:', error);
      throw error;
    }
  }

  async getCache<T = any>(key: string): Promise<T | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const [result] = await this.db.executeSql(
        'SELECT data, expiresAt FROM cache_metadata WHERE key = ?',
        [key]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows.item(0);
      const expiresAt = new Date(row.expiresAt).getTime();
      
      if (Date.now() > expiresAt) {
        // Cache expired, delete it
        await this.db.executeSql('DELETE FROM cache_metadata WHERE key = ?', [key]);
        return null;
      }

      return JSON.parse(row.data);
    } catch (error) {
      console.error('Failed to get cache:', error);
      return null;
    }
  }

  async clearExpiredCache(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.executeSql(
        'DELETE FROM cache_metadata WHERE expiresAt < ?',
        [new Date().toISOString()]
      );
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
    }
  }

  // Utility methods
  private parseUserRow(row: any): User {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      walletAddress: row.walletAddress,
      profilePicture: row.profilePicture,
      clan: null, // Would need to join with clans table
      achievements: JSON.parse(row.achievements || '[]'),
      stats: JSON.parse(row.stats || '{}'),
      preferences: JSON.parse(row.preferences || '{}'),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private parseClanRow(row: any): Clan {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      logo: row.logo,
      members: JSON.parse(row.members || '[]'),
      achievements: JSON.parse(row.achievements || '[]'),
      stats: JSON.parse(row.stats || '{}'),
      settings: JSON.parse(row.settings || '{}'),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private parseContentRow(row: any): Content {
    // This would need to be expanded with proper joins for author and clan data
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      mediaUrl: row.mediaUrl,
      thumbnailUrl: row.thumbnailUrl,
      author: { id: row.authorId } as User, // Simplified
      clan: null,
      votes: JSON.parse(row.votes || '[]'),
      comments: JSON.parse(row.comments || '[]'),
      tags: JSON.parse(row.tags || '[]'),
      metadata: JSON.parse(row.metadata || '{}'),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const queries = [
        'SELECT COUNT(*) as count FROM users',
        'SELECT COUNT(*) as count FROM clans',
        'SELECT COUNT(*) as count FROM content',
        'SELECT COUNT(*) as count FROM votes',
        'SELECT COUNT(*) as count FROM notifications',
        'SELECT COUNT(*) as count FROM cache_metadata',
      ];

      const results = await Promise.all(
        queries.map(query => this.db!.executeSql(query))
      );

      return {
        users: results[0][0].rows.item(0).count,
        clans: results[1][0].rows.item(0).count,
        content: results[2][0].rows.item(0).count,
        votes: results[3][0].rows.item(0).count,
        notifications: results[4][0].rows.item(0).count,
        cache: results[5][0].rows.item(0).count,
      };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      throw error;
    }
  }
}

export const DatabaseService = new DatabaseServiceClass();