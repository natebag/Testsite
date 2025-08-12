/**
 * Role-Based Access Control (RBAC) Service for MLG.clan Platform
 * 
 * Comprehensive RBAC implementation with hierarchical roles,
 * dynamic permissions, and context-aware access control.
 * 
 * Features:
 * - Hierarchical role system with inheritance
 * - Dynamic role assignment and permission updates
 * - Context-aware permissions (clan-specific, content-specific)
 * - Permission caching and performance optimization
 * - Audit logging for role and permission changes
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 */

import Redis from 'redis';
import { Pool } from 'pg';

/**
 * RBAC Configuration
 */
const RBAC_CONFIG = {
  // Cache Configuration
  CACHE_TTL: 15 * 60, // 15 minutes in seconds
  PERMISSION_CACHE_PREFIX: 'mlg:permissions:',
  ROLE_CACHE_PREFIX: 'mlg:roles:',
  
  // Role Hierarchy Levels
  ROLE_LEVELS: {
    'guest': 0,
    'member': 10,
    'moderator': 20,
    'admin': 30,
    'owner': 40,
    'super_admin': 50
  },
  
  // Clan-specific Role Levels
  CLAN_ROLE_LEVELS: {
    'member': 10,
    'officer': 20,
    'admin': 30,
    'owner': 40
  },
  
  // Permission Categories
  PERMISSION_CATEGORIES: {
    CONTENT: 'content',
    CLAN: 'clan',
    MODERATION: 'moderation',
    VOTING: 'voting',
    ADMIN: 'admin'
  },
  
  // Context Types
  CONTEXT_TYPES: {
    GLOBAL: 'global',
    CLAN: 'clan',
    CONTENT: 'content',
    USER: 'user'
  }
};

/**
 * Predefined Platform Roles
 */
const PLATFORM_ROLES = {
  guest: {
    name: 'Guest',
    level: 0,
    description: 'Unregistered user with limited access',
    permissions: [
      'content:view:public',
      'clan:view:public'
    ]
  },
  member: {
    name: 'Member',
    level: 10,
    description: 'Registered platform member',
    permissions: [
      'content:view:all',
      'content:create:own',
      'content:edit:own',
      'content:vote',
      'clan:view:all',
      'clan:join',
      'clan:leave:own',
      'voting:participate',
      'profile:edit:own'
    ]
  },
  moderator: {
    name: 'Moderator',
    level: 20,
    description: 'Content moderator with review permissions',
    permissions: [
      '*member', // Inherit all member permissions
      'content:moderate',
      'content:flag',
      'content:approve',
      'content:reject',
      'moderation:queue:view',
      'moderation:action:basic',
      'users:warn',
      'reports:view',
      'reports:action'
    ]
  },
  admin: {
    name: 'Admin',
    level: 30,
    description: 'Platform administrator',
    permissions: [
      '*moderator', // Inherit all moderator permissions
      'content:delete:any',
      'clan:manage:any',
      'users:suspend',
      'users:ban',
      'moderation:action:advanced',
      'system:stats:view',
      'achievements:manage'
    ]
  },
  owner: {
    name: 'Owner',
    level: 40,
    description: 'Clan owner with full clan control',
    permissions: [
      'clan:manage:owned',
      'clan:delete:owned',
      'clan:members:manage',
      'clan:roles:assign',
      'clan:settings:manage',
      'clan:treasury:manage'
    ]
  },
  super_admin: {
    name: 'Super Admin',
    level: 50,
    description: 'Platform super administrator',
    permissions: [
      '*admin', // Inherit all admin permissions
      'system:config:manage',
      'users:delete',
      'roles:manage',
      'permissions:manage',
      'database:access',
      'system:shutdown'
    ]
  }
};

/**
 * Predefined Clan Roles
 */
const CLAN_ROLES = {
  member: {
    name: 'Clan Member',
    level: 10,
    description: 'Basic clan member',
    permissions: [
      'clan:content:view',
      'clan:chat:participate',
      'clan:events:view',
      'clan:voting:participate'
    ]
  },
  officer: {
    name: 'Clan Officer',
    level: 20,
    description: 'Clan officer with member management',
    permissions: [
      '*member', // Inherit member permissions
      'clan:members:invite',
      'clan:members:kick:basic',
      'clan:content:moderate',
      'clan:events:create',
      'clan:announcements:create'
    ]
  },
  admin: {
    name: 'Clan Admin',
    level: 30,
    description: 'Clan administrator',
    permissions: [
      '*officer', // Inherit officer permissions
      'clan:settings:edit',
      'clan:roles:assign:limited',
      'clan:treasury:view',
      'clan:members:kick:advanced',
      'clan:voting:create'
    ]
  },
  owner: {
    name: 'Clan Owner',
    level: 40,
    description: 'Clan owner with full control',
    permissions: [
      '*admin', // Inherit admin permissions
      'clan:delete',
      'clan:ownership:transfer',
      'clan:roles:assign:all',
      'clan:treasury:manage',
      'clan:settings:manage'
    ]
  }
};

/**
 * RBAC Service Class
 */
class RBACService {
  constructor(options = {}) {
    this.db = options.db || null;
    this.redis = options.redis || null;
    this.logger = options.logger || console;
    
    // Cache for permissions and roles
    this.permissionCache = new Map();
    this.roleCache = new Map();
    
    // Initialize
    this.initialize();
  }

  /**
   * Initialize RBAC service
   */
  async initialize() {
    try {
      // Connect to database if not provided
      if (!this.db) {
        await this.initializeDatabase();
      }
      
      // Connect to Redis if not provided
      if (!this.redis) {
        await this.initializeRedis();
      }
      
      // Initialize roles and permissions
      await this.initializeRolesAndPermissions();
      
      // Start cache cleanup
      this.startCacheCleanup();
      
      this.logger.info('RBAC Service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize RBAC Service:', error);
      throw error;
    }
  }

  /**
   * Initialize database connection
   */
  async initializeDatabase() {
    const connectionString = process.env.DATABASE_URL || 
      'postgresql://username:password@localhost:5432/mlg_clan';
    
    this.db = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    await this.db.query('SELECT 1');
    this.logger.info('Database connection established for RBAC');
  }

  /**
   * Initialize Redis connection
   */
  async initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.redis = Redis.createClient({ url: redisUrl });
      
      this.redis.on('error', (err) => {
        this.logger.warn('Redis connection error in RBAC:', err);
      });
      
      await this.redis.connect();
      this.logger.info('Redis connection established for RBAC');
    } catch (error) {
      this.logger.warn('Redis connection failed, using memory cache:', error);
      this.redis = null;
    }
  }

  /**
   * Initialize roles and permissions in database
   */
  async initializeRolesAndPermissions() {
    try {
      // Create roles table if not exists
      await this.createRolesTable();
      await this.createPermissionsTable();
      await this.createUserRolesTable();
      
      // Insert default platform roles
      await this.insertDefaultRoles();
      
      this.logger.info('RBAC tables and default roles initialized');
    } catch (error) {
      this.logger.error('Error initializing RBAC tables:', error);
      throw error;
    }
  }

  /**
   * Create roles table
   */
  async createRolesTable() {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(50) UNIQUE NOT NULL,
        slug VARCHAR(50) UNIQUE NOT NULL,
        level INTEGER NOT NULL DEFAULT 0,
        description TEXT,
        is_platform_role BOOLEAN DEFAULT TRUE,
        is_clan_role BOOLEAN DEFAULT FALSE,
        permissions TEXT[] DEFAULT '{}',
        inherits_from VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        CONSTRAINT valid_role_name CHECK (LENGTH(name) >= 2),
        CONSTRAINT valid_role_slug CHECK (slug ~ '^[a-z0-9_-]+$')
      )
    `);
    
    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_roles_slug ON roles (slug);
      CREATE INDEX IF NOT EXISTS idx_roles_level ON roles (level);
      CREATE INDEX IF NOT EXISTS idx_roles_platform ON roles (is_platform_role);
      CREATE INDEX IF NOT EXISTS idx_roles_clan ON roles (is_clan_role);
    `);
  }

  /**
   * Create permissions table
   */
  async createPermissionsTable() {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) UNIQUE NOT NULL,
        category VARCHAR(50) NOT NULL,
        description TEXT,
        context_type VARCHAR(20) DEFAULT 'global',
        is_system_permission BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        CONSTRAINT valid_permission_name CHECK (name ~ '^[a-z0-9:_-]+$'),
        CONSTRAINT valid_context_type CHECK (
          context_type IN ('global', 'clan', 'content', 'user')
        )
      )
    `);
    
    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions (name);
      CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions (category);
      CREATE INDEX IF NOT EXISTS idx_permissions_context ON permissions (context_type);
    `);
  }

  /**
   * Create user roles table
   */
  async createUserRolesTable() {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_slug VARCHAR(50) NOT NULL,
        context_type VARCHAR(20) DEFAULT 'global',
        context_id UUID,
        granted_by UUID REFERENCES users(id),
        granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT TRUE,
        
        CONSTRAINT unique_user_role_context UNIQUE (user_id, role_slug, context_type, context_id),
        CONSTRAINT valid_context_type CHECK (
          context_type IN ('global', 'clan', 'content', 'user')
        )
      )
    `);
    
    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles (user_id);
      CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles (role_slug);
      CREATE INDEX IF NOT EXISTS idx_user_roles_context ON user_roles (context_type, context_id);
      CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles (is_active);
    `);
  }

  /**
   * Insert default platform roles
   */
  async insertDefaultRoles() {
    for (const [slug, roleData] of Object.entries(PLATFORM_ROLES)) {
      await this.db.query(`
        INSERT INTO roles (name, slug, level, description, is_platform_role, is_clan_role, permissions, inherits_from)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          level = EXCLUDED.level,
          description = EXCLUDED.description,
          permissions = EXCLUDED.permissions,
          inherits_from = EXCLUDED.inherits_from,
          updated_at = NOW()
      `, [
        roleData.name,
        slug,
        roleData.level,
        roleData.description,
        true, // is_platform_role
        false, // is_clan_role
        roleData.permissions,
        roleData.permissions.includes('*') ? roleData.permissions.find(p => p.startsWith('*'))?.substring(1) : null
      ]);
    }
    
    // Insert clan roles
    for (const [slug, roleData] of Object.entries(CLAN_ROLES)) {
      await this.db.query(`
        INSERT INTO roles (name, slug, level, description, is_platform_role, is_clan_role, permissions, inherits_from)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          level = EXCLUDED.level,
          description = EXCLUDED.description,
          permissions = EXCLUDED.permissions,
          inherits_from = EXCLUDED.inherits_from,
          updated_at = NOW()
      `, [
        roleData.name,
        `clan_${slug}`,
        roleData.level,
        roleData.description,
        false, // is_platform_role
        true, // is_clan_role
        roleData.permissions,
        roleData.permissions.includes('*') ? roleData.permissions.find(p => p.startsWith('*'))?.substring(1) : null
      ]);
    }
  }

  /**
   * Check if user has specific permissions
   * @param {string} userId - User ID
   * @param {Array} permissions - Required permissions
   * @param {Object} options - Check options
   * @returns {boolean} True if user has permissions
   */
  async checkPermissions(userId, permissions, options = {}) {
    try {
      const {
        requireAll = false,
        context = {},
        ignoreExpired = false
      } = options;
      
      // Get user permissions from cache or database
      const userPermissions = await this.getUserPermissions(userId, context, ignoreExpired);
      
      // Check each required permission
      const permissionResults = permissions.map(permission => 
        this.hasPermission(userPermissions, permission, context)
      );
      
      // Return based on requireAll flag
      if (requireAll) {
        return permissionResults.every(result => result);
      } else {
        return permissionResults.some(result => result);
      }
    } catch (error) {
      this.logger.error('Error checking permissions:', error);
      return false;
    }
  }

  /**
   * Check if user has specific roles
   * @param {string} userId - User ID
   * @param {Array} roles - Required roles
   * @param {Object} options - Check options
   * @returns {boolean} True if user has roles
   */
  async checkRoles(userId, roles, options = {}) {
    try {
      const {
        requireAll = false,
        context = {},
        ignoreExpired = false
      } = options;
      
      // Get user roles from cache or database
      const userRoles = await this.getUserRoles(userId, context, ignoreExpired);
      const userRoleSlugs = userRoles.map(role => role.role_slug);
      
      // Check each required role
      const roleResults = roles.map(role => userRoleSlugs.includes(role));
      
      // Return based on requireAll flag
      if (requireAll) {
        return roleResults.every(result => result);
      } else {
        return roleResults.some(result => result);
      }
    } catch (error) {
      this.logger.error('Error checking roles:', error);
      return false;
    }
  }

  /**
   * Get user permissions
   * @param {string} userId - User ID
   * @param {Object} context - Permission context
   * @param {boolean} ignoreExpired - Ignore expired roles
   * @returns {Array} User permissions
   */
  async getUserPermissions(userId, context = {}, ignoreExpired = false) {
    try {
      const cacheKey = `${RBAC_CONFIG.PERMISSION_CACHE_PREFIX}${userId}:${JSON.stringify(context)}`;
      
      // Check cache first
      let permissions = await this.getCachedData(cacheKey);
      if (permissions) {
        return permissions;
      }
      
      // Get user roles
      const userRoles = await this.getUserRoles(userId, context, ignoreExpired);
      
      // Collect permissions from all roles
      permissions = new Set();
      
      for (const userRole of userRoles) {
        const rolePermissions = await this.getRolePermissions(userRole.role_slug);
        
        for (const permission of rolePermissions) {
          // Skip inheritance markers
          if (permission.startsWith('*')) continue;
          
          permissions.add(permission);
        }
      }
      
      // Convert to array
      const permissionArray = Array.from(permissions);
      
      // Cache permissions
      await this.cacheData(cacheKey, permissionArray, RBAC_CONFIG.CACHE_TTL);
      
      return permissionArray;
    } catch (error) {
      this.logger.error('Error getting user permissions:', error);
      return [];
    }
  }

  /**
   * Get user roles
   * @param {string} userId - User ID
   * @param {Object} context - Role context
   * @param {boolean} ignoreExpired - Ignore expired roles
   * @returns {Array} User roles
   */
  async getUserRoles(userId, context = {}, ignoreExpired = false) {
    try {
      const contextType = context.type || 'global';
      const contextId = context.id || null;
      
      let query = `
        SELECT ur.*, r.name, r.level, r.permissions
        FROM user_roles ur
        JOIN roles r ON ur.role_slug = r.slug
        WHERE ur.user_id = $1 AND ur.is_active = TRUE
      `;
      
      const params = [userId];
      
      // Add context filtering
      if (contextType !== 'all') {
        query += ` AND ur.context_type = $${params.length + 1}`;
        params.push(contextType);
        
        if (contextId) {
          query += ` AND ur.context_id = $${params.length + 1}`;
          params.push(contextId);
        }
      }
      
      // Add expiry filtering
      if (!ignoreExpired) {
        query += ` AND (ur.expires_at IS NULL OR ur.expires_at > NOW())`;
      }
      
      query += ` ORDER BY r.level DESC`;
      
      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      this.logger.error('Error getting user roles:', error);
      return [];
    }
  }

  /**
   * Get role permissions with inheritance
   * @param {string} roleSlug - Role slug
   * @returns {Array} Role permissions
   */
  async getRolePermissions(roleSlug) {
    try {
      const cacheKey = `${RBAC_CONFIG.ROLE_CACHE_PREFIX}${roleSlug}`;
      
      // Check cache
      let permissions = await this.getCachedData(cacheKey);
      if (permissions) {
        return permissions;
      }
      
      const result = await this.db.query(`
        SELECT permissions, inherits_from
        FROM roles
        WHERE slug = $1
      `, [roleSlug]);
      
      if (result.rows.length === 0) {
        return [];
      }
      
      const roleData = result.rows[0];
      permissions = new Set(roleData.permissions || []);
      
      // Handle inheritance
      for (const permission of roleData.permissions || []) {
        if (permission.startsWith('*')) {
          const inheritedRole = permission.substring(1);
          const inheritedPermissions = await this.getRolePermissions(inheritedRole);
          
          for (const inherited of inheritedPermissions) {
            if (!inherited.startsWith('*')) {
              permissions.add(inherited);
            }
          }
        }
      }
      
      const permissionArray = Array.from(permissions);
      
      // Cache permissions
      await this.cacheData(cacheKey, permissionArray, RBAC_CONFIG.CACHE_TTL);
      
      return permissionArray;
    } catch (error) {
      this.logger.error('Error getting role permissions:', error);
      return [];
    }
  }

  /**
   * Assign role to user
   * @param {string} userId - User ID
   * @param {string} roleSlug - Role slug to assign
   * @param {Object} options - Assignment options
   * @returns {boolean} True if successful
   */
  async assignRole(userId, roleSlug, options = {}) {
    try {
      const {
        contextType = 'global',
        contextId = null,
        grantedBy = null,
        expiresAt = null
      } = options;
      
      // Check if role exists
      const roleExists = await this.db.query(`
        SELECT id FROM roles WHERE slug = $1
      `, [roleSlug]);
      
      if (roleExists.rows.length === 0) {
        throw new Error(`Role '${roleSlug}' does not exist`);
      }
      
      // Insert or update user role
      await this.db.query(`
        INSERT INTO user_roles (user_id, role_slug, context_type, context_id, granted_by, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, role_slug, context_type, context_id)
        DO UPDATE SET
          granted_by = EXCLUDED.granted_by,
          granted_at = NOW(),
          expires_at = EXCLUDED.expires_at,
          is_active = TRUE
      `, [userId, roleSlug, contextType, contextId, grantedBy, expiresAt]);
      
      // Clear cache
      await this.clearUserCache(userId);
      
      // Log role assignment
      this.logRBACEvent('ROLE_ASSIGNED', {
        userId,
        roleSlug,
        contextType,
        contextId,
        grantedBy
      });
      
      return true;
    } catch (error) {
      this.logger.error('Error assigning role:', error);
      return false;
    }
  }

  /**
   * Revoke role from user
   * @param {string} userId - User ID
   * @param {string} roleSlug - Role slug to revoke
   * @param {Object} options - Revocation options
   * @returns {boolean} True if successful
   */
  async revokeRole(userId, roleSlug, options = {}) {
    try {
      const {
        contextType = 'global',
        contextId = null
      } = options;
      
      await this.db.query(`
        UPDATE user_roles
        SET is_active = FALSE
        WHERE user_id = $1 AND role_slug = $2 AND context_type = $3 
          AND ($4 IS NULL OR context_id = $4)
      `, [userId, roleSlug, contextType, contextId]);
      
      // Clear cache
      await this.clearUserCache(userId);
      
      // Log role revocation
      this.logRBACEvent('ROLE_REVOKED', {
        userId,
        roleSlug,
        contextType,
        contextId
      });
      
      return true;
    } catch (error) {
      this.logger.error('Error revoking role:', error);
      return false;
    }
  }

  /**
   * Check if user has specific permission
   * @param {Array} userPermissions - User's permissions
   * @param {string} permission - Required permission
   * @param {Object} context - Permission context
   * @returns {boolean} True if user has permission
   */
  hasPermission(userPermissions, permission, context = {}) {
    // Direct permission check
    if (userPermissions.includes(permission)) {
      return true;
    }
    
    // Wildcard permission check
    const permissionParts = permission.split(':');
    for (let i = permissionParts.length; i > 0; i--) {
      const wildcardPermission = permissionParts.slice(0, i).join(':') + ':*';
      if (userPermissions.includes(wildcardPermission)) {
        return true;
      }
    }
    
    // Check for global wildcard
    if (userPermissions.includes('*')) {
      return true;
    }
    
    return false;
  }

  /**
   * Cache data in Redis or memory
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live in seconds
   */
  async cacheData(key, data, ttl) {
    try {
      if (this.redis) {
        await this.redis.setEx(key, ttl, JSON.stringify(data));
      } else {
        this.permissionCache.set(key, {
          data,
          expiresAt: Date.now() + (ttl * 1000)
        });
      }
    } catch (error) {
      this.logger.warn('Error caching data:', error);
    }
  }

  /**
   * Get cached data
   * @param {string} key - Cache key
   * @returns {any} Cached data or null
   */
  async getCachedData(key) {
    try {
      if (this.redis) {
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
      } else {
        const cached = this.permissionCache.get(key);
        if (cached && cached.expiresAt > Date.now()) {
          return cached.data;
        } else if (cached) {
          this.permissionCache.delete(key);
        }
        return null;
      }
    } catch (error) {
      this.logger.warn('Error getting cached data:', error);
      return null;
    }
  }

  /**
   * Clear user cache
   * @param {string} userId - User ID
   */
  async clearUserCache(userId) {
    try {
      if (this.redis) {
        const pattern = `${RBAC_CONFIG.PERMISSION_CACHE_PREFIX}${userId}:*`;
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        // Clear memory cache entries for this user
        for (const key of this.permissionCache.keys()) {
          if (key.includes(userId)) {
            this.permissionCache.delete(key);
          }
        }
      }
    } catch (error) {
      this.logger.warn('Error clearing user cache:', error);
    }
  }

  /**
   * Log RBAC events
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  logRBACEvent(event, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      data: {
        ...data,
        // Sanitize sensitive data
        userId: data.userId ? `${data.userId.substring(0, 8)}...` : undefined
      }
    };
    
    this.logger.info('RBAC Event:', logEntry);
  }

  /**
   * Start cache cleanup tasks
   */
  startCacheCleanup() {
    // Clean memory cache every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, cached] of this.permissionCache.entries()) {
        if (cached.expiresAt <= now) {
          this.permissionCache.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Get RBAC metrics
   * @returns {Object} RBAC metrics
   */
  async getMetrics() {
    try {
      const userRolesCount = await this.db.query(`
        SELECT COUNT(*) FROM user_roles WHERE is_active = TRUE
      `);
      
      const rolesCount = await this.db.query(`
        SELECT COUNT(*) FROM roles
      `);
      
      return {
        activeUserRoles: parseInt(userRolesCount.rows[0].count),
        totalRoles: parseInt(rolesCount.rows[0].count),
        cacheSize: this.permissionCache.size,
        uptime: process.uptime()
      };
    } catch (error) {
      this.logger.error('Error getting RBAC metrics:', error);
      return {};
    }
  }

  /**
   * Shutdown RBAC service
   */
  async shutdown() {
    try {
      if (this.redis) {
        await this.redis.disconnect();
      }
      
      if (this.db) {
        await this.db.end();
      }
      
      this.permissionCache.clear();
      this.roleCache.clear();
      
      this.logger.info('RBAC Service shutdown complete');
    } catch (error) {
      this.logger.error('Error during RBAC shutdown:', error);
    }
  }
}

// Export RBAC service and constants
export { RBACService, RBAC_CONFIG, PLATFORM_ROLES, CLAN_ROLES };
export default RBACService;