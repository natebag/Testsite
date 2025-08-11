/**
 * Room Manager for WebSocket Server
 * 
 * Manages WebSocket room subscriptions and channel management for the MLG.clan platform.
 * Provides efficient room-based event broadcasting, permission-based access control,
 * and subscription management for gaming-specific features.
 * 
 * Features:
 * - Room-based event broadcasting
 * - Permission-based room access control
 * - Subscription management with filtering
 * - Room statistics and monitoring
 * - Dynamic room creation and cleanup
 * - Cross-server room synchronization with Redis
 * 
 * @author Claude Code - Room Management Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import { EventEmitter } from 'events';

/**
 * Room Manager Configuration
 */
const ROOM_CONFIG = {
  // Room types and their access controls
  roomTypes: {
    'user': {
      pattern: /^user:(.+)$/,
      access: 'owner_only',
      maxMembers: 1,
      persistent: true
    },
    'clan': {
      pattern: /^clan:(.+)$/,
      access: 'clan_member',
      maxMembers: 1000,
      persistent: true
    },
    'content': {
      pattern: /^content:(.+)$/,
      access: 'public',
      maxMembers: 500,
      persistent: false
    },
    'voting': {
      pattern: /^voting:(.+)$/,
      access: 'authenticated',
      maxMembers: 10000,
      persistent: false
    },
    'global': {
      pattern: /^global:(.+)$/,
      access: 'public',
      maxMembers: 50000,
      persistent: true
    },
    'admin': {
      pattern: /^admin:(.+)$/,
      access: 'admin_only',
      maxMembers: 50,
      persistent: true
    },
    'moderator': {
      pattern: /^moderator:(.+)$/,
      access: 'moderator_only',
      maxMembers: 100,
      persistent: true
    }
  },
  
  // Cleanup settings
  cleanupInterval: 5 * 60 * 1000, // 5 minutes
  emptyRoomTTL: 10 * 60 * 1000, // 10 minutes
  maxRooms: 100000,
  
  // Redis synchronization
  redis: {
    keyPrefix: 'ws_room',
    syncInterval: 30000 // 30 seconds
  }
};

/**
 * Room Manager Class
 */
export class RoomManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = { ...ROOM_CONFIG, ...options };
    this.logger = options.logger || console;
    this.redisClient = options.redisClient;
    
    // Room tracking
    this.rooms = new Map(); // roomId -> room info
    this.socketRooms = new Map(); // socketId -> Set of roomIds
    this.roomSubscriptions = new Map(); // roomId -> Map of socketId -> subscription info
    
    // Statistics
    this.stats = {
      totalRooms: 0,
      activeRooms: 0,
      totalSubscriptions: 0,
      roomsByType: {},
      subscriptionsByType: {}
    };
    
    // Initialize room type stats
    Object.keys(this.config.roomTypes).forEach(type => {
      this.stats.roomsByType[type] = 0;
      this.stats.subscriptionsByType[type] = 0;
    });
    
    // Start cleanup timer
    this.startCleanupTimer();
    
    // Start Redis synchronization if enabled
    if (this.redisClient) {
      this.startRedisSyncTimer();
    }
    
    this.logger.info('Room Manager initialized');
  }

  /**
   * Join a room
   */
  async joinRoom(socket, data) {
    try {
      const { roomId, subscriptionOptions = {} } = data;
      
      if (!roomId || typeof roomId !== 'string') {
        throw new Error('Invalid room ID');
      }
      
      // Validate room access
      await this.validateRoomAccess(socket, roomId);
      
      // Get or create room
      const room = await this.getOrCreateRoom(roomId);
      
      // Check room capacity
      if (room.members.size >= room.maxMembers) {
        throw new Error('Room capacity exceeded');
      }
      
      // Join the socket.io room
      socket.join(roomId);
      
      // Add socket to room tracking
      this.addSocketToRoom(socket, roomId, subscriptionOptions);
      
      // Update room statistics
      this.updateRoomStats(roomId, 'join');
      
      // Sync with Redis if enabled
      if (this.redisClient) {
        await this.syncRoomToRedis(roomId, room);
      }
      
      // Emit events
      socket.emit('room_joined', { 
        roomId, 
        memberCount: room.members.size,
        subscriptionOptions 
      });
      
      this.emit('room_joined', { 
        socket, 
        roomId, 
        room, 
        subscriptionOptions 
      });
      
      this.logger.info(`Socket ${socket.id} joined room ${roomId}`);
      
    } catch (error) {
      this.logger.error(`Failed to join room ${data.roomId} for socket ${socket.id}:`, error);
      socket.emit('room_join_failed', { 
        roomId: data.roomId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Leave a room
   */
  async leaveRoom(socket, data) {
    try {
      const { roomId } = data;
      
      if (!roomId || typeof roomId !== 'string') {
        throw new Error('Invalid room ID');
      }
      
      // Leave the socket.io room
      socket.leave(roomId);
      
      // Remove socket from room tracking
      this.removeSocketFromRoom(socket, roomId);
      
      // Update room statistics
      this.updateRoomStats(roomId, 'leave');
      
      // Clean up empty room if not persistent
      await this.cleanupRoomIfEmpty(roomId);
      
      // Emit events
      socket.emit('room_left', { roomId });
      
      this.emit('room_left', { socket, roomId });
      
      this.logger.info(`Socket ${socket.id} left room ${roomId}`);
      
    } catch (error) {
      this.logger.error(`Failed to leave room ${data.roomId} for socket ${socket.id}:`, error);
      socket.emit('room_leave_failed', { 
        roomId: data.roomId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Validate room access permissions
   */
  async validateRoomAccess(socket, roomId) {
    const roomType = this.getRoomType(roomId);
    const roomConfig = this.config.roomTypes[roomType];
    
    if (!roomConfig) {
      throw new Error(`Unknown room type: ${roomType}`);
    }
    
    switch (roomConfig.access) {
      case 'owner_only':
        // For user rooms, only the owner can join
        const match = roomId.match(roomConfig.pattern);
        if (!match || match[1] !== socket.userId) {
          throw new Error('Access denied: Owner only');
        }
        break;
        
      case 'clan_member':
        // For clan rooms, user must be a member
        const clanMatch = roomId.match(roomConfig.pattern);
        if (!clanMatch || clanMatch[1] !== socket.clanId) {
          throw new Error('Access denied: Clan membership required');
        }
        break;
        
      case 'admin_only':
        if (!socket.roles || !socket.roles.includes('admin')) {
          throw new Error('Access denied: Admin role required');
        }
        break;
        
      case 'moderator_only':
        if (!socket.roles || 
            (!socket.roles.includes('moderator') && !socket.roles.includes('admin'))) {
          throw new Error('Access denied: Moderator role required');
        }
        break;
        
      case 'authenticated':
        if (!socket.userId) {
          throw new Error('Access denied: Authentication required');
        }
        break;
        
      case 'public':
        // Anyone can join
        break;
        
      default:
        throw new Error(`Invalid access control: ${roomConfig.access}`);
    }
  }

  /**
   * Get room type from room ID
   */
  getRoomType(roomId) {
    for (const [type, config] of Object.entries(this.config.roomTypes)) {
      if (config.pattern.test(roomId)) {
        return type;
      }
    }
    return 'unknown';
  }

  /**
   * Get or create room
   */
  async getOrCreateRoom(roomId) {
    let room = this.rooms.get(roomId);
    
    if (!room) {
      const roomType = this.getRoomType(roomId);
      const roomConfig = this.config.roomTypes[roomType];
      
      room = {
        id: roomId,
        type: roomType,
        createdAt: new Date(),
        lastActivity: new Date(),
        members: new Set(),
        subscriptions: new Map(),
        maxMembers: roomConfig?.maxMembers || 1000,
        persistent: roomConfig?.persistent || false,
        metadata: {}
      };
      
      this.rooms.set(roomId, room);
      this.stats.totalRooms++;
      this.stats.activeRooms++;
      this.stats.roomsByType[roomType]++;
      
      this.emit('room_created', { roomId, room });
      this.logger.info(`Room created: ${roomId} (type: ${roomType})`);
    }
    
    room.lastActivity = new Date();
    return room;
  }

  /**
   * Add socket to room tracking
   */
  addSocketToRoom(socket, roomId, subscriptionOptions) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    
    // Add to room members
    room.members.add(socket.id);
    
    // Track socket rooms
    if (!this.socketRooms.has(socket.id)) {
      this.socketRooms.set(socket.id, new Set());
    }
    this.socketRooms.get(socket.id).add(roomId);
    
    // Create subscription info
    const subscription = {
      socketId: socket.id,
      userId: socket.userId,
      joinedAt: new Date(),
      options: subscriptionOptions,
      active: true
    };
    
    // Track room subscriptions
    if (!this.roomSubscriptions.has(roomId)) {
      this.roomSubscriptions.set(roomId, new Map());
    }
    this.roomSubscriptions.get(roomId).set(socket.id, subscription);
    
    // Update room subscriptions
    room.subscriptions.set(socket.id, subscription);
    
    // Update statistics
    this.stats.totalSubscriptions++;
    this.stats.subscriptionsByType[room.type]++;
  }

  /**
   * Remove socket from room tracking
   */
  removeSocketFromRoom(socket, roomId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }
    
    // Remove from room members
    room.members.delete(socket.id);
    room.subscriptions.delete(socket.id);
    
    // Remove from socket rooms
    const socketRooms = this.socketRooms.get(socket.id);
    if (socketRooms) {
      socketRooms.delete(roomId);
      if (socketRooms.size === 0) {
        this.socketRooms.delete(socket.id);
      }
    }
    
    // Remove from room subscriptions
    const roomSubs = this.roomSubscriptions.get(roomId);
    if (roomSubs) {
      roomSubs.delete(socket.id);
      if (roomSubs.size === 0) {
        this.roomSubscriptions.delete(roomId);
      }
    }
    
    // Update statistics
    this.stats.totalSubscriptions--;
    this.stats.subscriptionsByType[room.type]--;
  }

  /**
   * Clean up socket from all rooms
   */
  async cleanupSocket(socket) {
    const socketRooms = this.socketRooms.get(socket.id);
    if (!socketRooms) {
      return;
    }
    
    const roomIds = Array.from(socketRooms);
    
    for (const roomId of roomIds) {
      try {
        this.removeSocketFromRoom(socket, roomId);
        await this.cleanupRoomIfEmpty(roomId);
      } catch (error) {
        this.logger.error(`Failed to cleanup room ${roomId} for socket ${socket.id}:`, error);
      }
    }
    
    this.logger.debug(`Cleaned up ${roomIds.length} rooms for socket ${socket.id}`);
  }

  /**
   * Clean up empty room if not persistent
   */
  async cleanupRoomIfEmpty(roomId) {
    const room = this.rooms.get(roomId);
    if (!room || room.members.size > 0 || room.persistent) {
      return;
    }
    
    // Remove from tracking
    this.rooms.delete(roomId);
    this.roomSubscriptions.delete(roomId);
    
    // Update statistics
    this.stats.activeRooms--;
    this.stats.roomsByType[room.type]--;
    
    // Remove from Redis if enabled
    if (this.redisClient) {
      await this.removeRoomFromRedis(roomId);
    }
    
    this.emit('room_deleted', { roomId, room });
    this.logger.info(`Empty room cleaned up: ${roomId}`);
  }

  /**
   * Update room statistics
   */
  updateRoomStats(roomId, action) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }
    
    room.lastActivity = new Date();
    
    // Update room metadata based on action
    if (!room.metadata.stats) {
      room.metadata.stats = {
        totalJoins: 0,
        totalLeaves: 0,
        peakMembers: 0
      };
    }
    
    if (action === 'join') {
      room.metadata.stats.totalJoins++;
      room.metadata.stats.peakMembers = Math.max(
        room.metadata.stats.peakMembers, 
        room.members.size
      );
    } else if (action === 'leave') {
      room.metadata.stats.totalLeaves++;
    }
  }

  /**
   * Get room information
   */
  getRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return null;
    }
    
    return {
      ...room,
      members: Array.from(room.members),
      subscriptions: Array.from(room.subscriptions.entries())
    };
  }

  /**
   * Get rooms for socket
   */
  getSocketRooms(socketId) {
    const roomIds = this.socketRooms.get(socketId);
    if (!roomIds) {
      return [];
    }
    
    return Array.from(roomIds).map(roomId => this.getRoom(roomId)).filter(Boolean);
  }

  /**
   * Get room members
   */
  getRoomMembers(roomId) {
    const subscriptions = this.roomSubscriptions.get(roomId);
    if (!subscriptions) {
      return [];
    }
    
    return Array.from(subscriptions.values());
  }

  /**
   * Broadcast to room with filtering
   */
  broadcastToRoom(io, roomId, event, data, filter = null) {
    try {
      const room = this.rooms.get(roomId);
      if (!room) {
        this.logger.warn(`Attempted to broadcast to non-existent room: ${roomId}`);
        return false;
      }
      
      const subscriptions = this.roomSubscriptions.get(roomId);
      if (!subscriptions || subscriptions.size === 0) {
        return false;
      }
      
      let sentCount = 0;
      
      // If no filter, broadcast to entire room
      if (!filter) {
        io.to(roomId).emit(event, {
          ...data,
          _room: roomId,
          _timestamp: new Date().toISOString()
        });
        sentCount = room.members.size;
      } else {
        // Filter and send to specific sockets
        for (const [socketId, subscription] of subscriptions) {
          if (filter(subscription)) {
            io.to(socketId).emit(event, {
              ...data,
              _room: roomId,
              _timestamp: new Date().toISOString()
            });
            sentCount++;
          }
        }
      }
      
      this.logger.debug(`Broadcasted ${event} to ${sentCount} members in room ${roomId}`);
      return true;
      
    } catch (error) {
      this.logger.error(`Failed to broadcast to room ${roomId}:`, error);
      return false;
    }
  }

  /**
   * Start cleanup timer
   */
  startCleanupTimer() {
    setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);
    
    this.logger.info('Room cleanup timer started');
  }

  /**
   * Perform room cleanup
   */
  async performCleanup() {
    const now = Date.now();
    const roomsToCleanup = [];
    
    for (const [roomId, room] of this.rooms) {
      const timeSinceActivity = now - room.lastActivity.getTime();
      
      // Clean up empty non-persistent rooms
      if (!room.persistent && room.members.size === 0 && timeSinceActivity > this.config.emptyRoomTTL) {
        roomsToCleanup.push(roomId);
      }
    }
    
    if (roomsToCleanup.length > 0) {
      this.logger.info(`Cleaning up ${roomsToCleanup.length} empty rooms`);
      
      for (const roomId of roomsToCleanup) {
        await this.cleanupRoomIfEmpty(roomId);
      }
    }
  }

  /**
   * Sync room to Redis for clustering
   */
  async syncRoomToRedis(roomId, room) {
    if (!this.redisClient) {
      return;
    }
    
    try {
      const roomData = {
        id: room.id,
        type: room.type,
        memberCount: room.members.size,
        createdAt: room.createdAt.toISOString(),
        lastActivity: room.lastActivity.toISOString(),
        metadata: room.metadata
      };
      
      const key = `${this.config.redis.keyPrefix}:${roomId}`;
      await this.redisClient.hset(key, roomData);
      await this.redisClient.expire(key, 3600); // 1 hour TTL
      
    } catch (error) {
      this.logger.error(`Failed to sync room ${roomId} to Redis:`, error);
    }
  }

  /**
   * Remove room from Redis
   */
  async removeRoomFromRedis(roomId) {
    if (!this.redisClient) {
      return;
    }
    
    try {
      const key = `${this.config.redis.keyPrefix}:${roomId}`;
      await this.redisClient.del(key);
    } catch (error) {
      this.logger.error(`Failed to remove room ${roomId} from Redis:`, error);
    }
  }

  /**
   * Start Redis synchronization timer
   */
  startRedisSyncTimer() {
    setInterval(async () => {
      await this.syncAllRoomsToRedis();
    }, this.config.redis.syncInterval);
    
    this.logger.info('Redis synchronization timer started');
  }

  /**
   * Sync all rooms to Redis
   */
  async syncAllRoomsToRedis() {
    for (const [roomId, room] of this.rooms) {
      await this.syncRoomToRedis(roomId, room);
    }
  }

  /**
   * Get room statistics
   */
  getStats() {
    return {
      ...this.stats,
      roomDetails: Array.from(this.rooms.values()).map(room => ({
        id: room.id,
        type: room.type,
        memberCount: room.members.size,
        createdAt: room.createdAt,
        lastActivity: room.lastActivity,
        stats: room.metadata.stats
      }))
    };
  }

  /**
   * Shutdown room manager
   */
  async shutdown() {
    this.logger.info('Shutting down Room Manager...');
    
    // Clear all rooms and subscriptions
    this.rooms.clear();
    this.socketRooms.clear();
    this.roomSubscriptions.clear();
    
    this.logger.info('Room Manager shutdown completed');
  }
}

export default RoomManager;