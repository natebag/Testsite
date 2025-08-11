/**
 * WebSocket Authentication Middleware for MLG.clan Platform
 * 
 * Provides wallet-based authentication for WebSocket connections using JWT tokens
 * and Phantom wallet signature verification. Integrates with the existing authentication
 * system to ensure secure real-time connections.
 * 
 * Features:
 * - JWT token validation for WebSocket handshakes
 * - Phantom wallet signature verification
 * - User session management for WebSocket connections
 * - Permission-based access control for rooms and events
 * - Token refresh handling for long-lived connections
 * 
 * @author Claude Code - WebSocket Security Engineer
 * @version 1.0.0
 * @created 2025-08-11
 */

import jwt from 'jsonwebtoken';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

/**
 * Authentication middleware configuration
 */
const AUTH_CONFIG = {
  jwtSecret: process.env.JWT_SECRET || 'mlg-clan-secret-key',
  jwtExpiration: '24h',
  allowedNetworks: ['mainnet-beta', 'devnet', 'testnet'],
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  refreshThreshold: 60 * 60 * 1000, // 1 hour before expiry
};

/**
 * WebSocket Authentication Middleware
 * 
 * Validates JWT tokens and wallet signatures for incoming WebSocket connections
 */
export function authMiddleware(options = {}) {
  const config = { ...AUTH_CONFIG, ...options };
  const logger = options.logger || console;

  return async (socket, next) => {
    try {
      const token = extractToken(socket);
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Validate JWT token
      const decoded = await validateJWTToken(token, config, logger);
      
      // Verify wallet signature if present
      if (decoded.signature && decoded.message) {
        await verifyWalletSignature(decoded, logger);
      }
      
      // Attach user information to socket
      await attachUserContext(socket, decoded, config, logger);
      
      // Setup token refresh mechanism
      setupTokenRefresh(socket, decoded, config, logger);
      
      logger.info(`WebSocket authenticated: ${socket.id} - User: ${decoded.sub} - Wallet: ${decoded.wallet}`);
      next();
      
    } catch (error) {
      logger.error(`WebSocket authentication failed for ${socket.id}:`, error);
      next(new Error(`Authentication failed: ${error.message}`));
    }
  };
}

/**
 * Extract authentication token from socket handshake
 */
function extractToken(socket) {
  // Try multiple token extraction methods
  const auth = socket.handshake.auth;
  const query = socket.handshake.query;
  const headers = socket.handshake.headers;
  
  // Method 1: Auth object
  if (auth && auth.token) {
    return auth.token;
  }
  
  // Method 2: Query parameters
  if (query && query.token) {
    return query.token;
  }
  
  // Method 3: Authorization header
  if (headers && headers.authorization) {
    const match = headers.authorization.match(/Bearer\s+(.+)/i);
    if (match) {
      return match[1];
    }
  }
  
  // Method 4: Custom header
  if (headers && headers['x-auth-token']) {
    return headers['x-auth-token'];
  }
  
  return null;
}

/**
 * Validate JWT token
 */
async function validateJWTToken(token, config, logger) {
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Validate required fields
    if (!decoded.sub || !decoded.wallet) {
      throw new Error('Invalid token payload: missing user ID or wallet address');
    }
    
    // Validate expiration
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token has expired');
    }
    
    // Validate network
    if (decoded.network && !config.allowedNetworks.includes(decoded.network)) {
      throw new Error(`Invalid network: ${decoded.network}`);
    }
    
    return decoded;
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw error;
    }
  }
}

/**
 * Verify Phantom wallet signature
 */
async function verifyWalletSignature(decoded, logger) {
  try {
    const { wallet, signature, message, timestamp } = decoded;
    
    if (!signature || !message) {
      logger.debug('No signature verification required');
      return true;
    }
    
    // Validate signature timestamp (within 5 minutes)
    if (timestamp) {
      const now = Date.now();
      const signatureTime = new Date(timestamp).getTime();
      const maxAge = 5 * 60 * 1000; // 5 minutes
      
      if (now - signatureTime > maxAge) {
        throw new Error('Signature has expired');
      }
    }
    
    // Verify the signature
    const publicKey = new PublicKey(wallet);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    
    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKey.toBytes()
    );
    
    if (!isValid) {
      throw new Error('Invalid wallet signature');
    }
    
    logger.debug(`Wallet signature verified for: ${wallet}`);
    return true;
    
  } catch (error) {
    logger.error('Wallet signature verification failed:', error);
    throw new Error(`Signature verification failed: ${error.message}`);
  }
}

/**
 * Attach user context to socket
 */
async function attachUserContext(socket, decoded, config, logger) {
  try {
    // Basic user information
    socket.userId = decoded.sub;
    socket.walletAddress = decoded.wallet;
    socket.network = decoded.network || 'mainnet-beta';
    socket.authenticatedAt = new Date();
    
    // User permissions and roles
    socket.permissions = decoded.permissions || [];
    socket.roles = decoded.roles || ['user'];
    socket.clanId = decoded.clanId || null;
    
    // Session management
    socket.sessionId = decoded.jti || `${decoded.sub}_${Date.now()}`;
    socket.tokenExpiresAt = new Date(decoded.exp * 1000);
    
    // Join user-specific room
    socket.join(`user:${decoded.sub}`);
    
    // Join clan room if user is in a clan
    if (socket.clanId) {
      socket.join(`clan:${socket.clanId}`);
    }
    
    // Join role-based rooms
    socket.roles.forEach(role => {
      socket.join(`role:${role}`);
    });
    
    // Track session
    socket.sessionInfo = {
      userId: socket.userId,
      walletAddress: socket.walletAddress,
      connectedAt: socket.authenticatedAt,
      lastActivity: new Date(),
      permissions: socket.permissions,
      roles: socket.roles,
      clanId: socket.clanId
    };
    
    logger.debug(`User context attached to socket ${socket.id}:`, {
      userId: socket.userId,
      walletAddress: socket.walletAddress,
      roles: socket.roles,
      clanId: socket.clanId
    });
    
  } catch (error) {
    logger.error('Failed to attach user context:', error);
    throw error;
  }
}

/**
 * Setup token refresh mechanism
 */
function setupTokenRefresh(socket, decoded, config, logger) {
  const expiresAt = decoded.exp * 1000;
  const now = Date.now();
  const timeToExpiry = expiresAt - now;
  const refreshAt = timeToExpiry - config.refreshThreshold;
  
  if (refreshAt > 0) {
    const refreshTimer = setTimeout(() => {
      socket.emit('token_refresh_required', {
        message: 'Authentication token will expire soon',
        expiresAt: new Date(expiresAt),
        refreshBefore: new Date(expiresAt - (60 * 1000)) // 1 minute before expiry
      });
      
      logger.info(`Token refresh reminder sent to user ${socket.userId}`);
    }, refreshAt);
    
    socket.refreshTimer = refreshTimer;
    
    // Clean up timer on disconnect
    socket.on('disconnect', () => {
      if (socket.refreshTimer) {
        clearTimeout(socket.refreshTimer);
      }
    });
  }
  
  // Handle token refresh
  socket.on('refresh_token', async (data, callback) => {
    try {
      const newToken = data.token;
      if (!newToken) {
        throw new Error('New token required');
      }
      
      // Validate new token
      const newDecoded = await validateJWTToken(newToken, config, logger);
      
      // Verify it's for the same user
      if (newDecoded.sub !== socket.userId) {
        throw new Error('Token user mismatch');
      }
      
      // Update socket context
      socket.tokenExpiresAt = new Date(newDecoded.exp * 1000);
      
      // Setup new refresh timer
      setupTokenRefresh(socket, newDecoded, config, logger);
      
      logger.info(`Token refreshed for user ${socket.userId}`);
      
      if (callback) {
        callback({ success: true, message: 'Token refreshed successfully' });
      }
      
    } catch (error) {
      logger.error(`Token refresh failed for user ${socket.userId}:`, error);
      
      if (callback) {
        callback({ success: false, error: error.message });
      }
      
      // Force disconnect on refresh failure
      socket.disconnect(true);
    }
  });
}

/**
 * Permission checking utility
 */
export function hasPermission(socket, permission) {
  return socket.permissions && socket.permissions.includes(permission);
}

/**
 * Role checking utility
 */
export function hasRole(socket, role) {
  return socket.roles && socket.roles.includes(role);
}

/**
 * Clan membership checking utility
 */
export function isClanMember(socket, clanId) {
  return socket.clanId === clanId;
}

/**
 * Authentication validation middleware for specific events
 */
export function requireAuth(socket, next) {
  if (!socket.userId || !socket.walletAddress) {
    return next(new Error('Authentication required'));
  }
  
  // Check token expiry
  if (socket.tokenExpiresAt && new Date() > socket.tokenExpiresAt) {
    return next(new Error('Token has expired'));
  }
  
  next();
}

/**
 * Permission validation middleware
 */
export function requirePermission(permission) {
  return (socket, next) => {
    if (!hasPermission(socket, permission)) {
      return next(new Error(`Permission required: ${permission}`));
    }
    next();
  };
}

/**
 * Role validation middleware
 */
export function requireRole(role) {
  return (socket, next) => {
    if (!hasRole(socket, role)) {
      return next(new Error(`Role required: ${role}`));
    }
    next();
  };
}

/**
 * Clan membership validation middleware
 */
export function requireClanMembership(clanId) {
  return (socket, next) => {
    if (!isClanMember(socket, clanId)) {
      return next(new Error('Clan membership required'));
    }
    next();
  };
}

/**
 * Update socket activity timestamp
 */
export function updateActivity(socket) {
  if (socket.sessionInfo) {
    socket.sessionInfo.lastActivity = new Date();
  }
}

/**
 * Get user session information
 */
export function getSessionInfo(socket) {
  return socket.sessionInfo || null;
}

export default authMiddleware;