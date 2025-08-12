/**
 * Authentication Middleware for MLG.clan API
 * 
 * JWT token validation, user authentication, and role-based access control
 * middleware for protecting API endpoints.
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

import jwt from 'jsonwebtoken';

/**
 * Authentication middleware configuration
 */
const AUTH_CONFIG = {
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  JWT_ALGORITHM: 'HS256',
  HEADER_NAME: 'authorization',
  TOKEN_PREFIX: 'Bearer ',
  COOKIE_NAME: 'mlg_auth_token'
};

/**
 * Extract token from request headers or cookies
 */
function extractToken(req) {
  let token = null;
  
  // Check Authorization header first
  const authHeader = req.headers[AUTH_CONFIG.HEADER_NAME];
  if (authHeader && authHeader.startsWith(AUTH_CONFIG.TOKEN_PREFIX)) {
    token = authHeader.substring(AUTH_CONFIG.TOKEN_PREFIX.length);
  }
  
  // Fallback to cookie
  if (!token && req.cookies && req.cookies[AUTH_CONFIG.COOKIE_NAME]) {
    token = req.cookies[AUTH_CONFIG.COOKIE_NAME];
  }
  
  // Check query parameter (for WebSocket or special cases)
  if (!token && req.query.token) {
    token = req.query.token;
  }
  
  return token;
}

/**
 * Main authentication middleware
 * Validates JWT token and adds user info to request
 */
export const authMiddleware = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_TOKEN',
        message: 'Access token is required for this endpoint'
      });
    }
    
    // Verify and decode token
    const decoded = jwt.verify(token, AUTH_CONFIG.JWT_SECRET, {
      algorithms: [AUTH_CONFIG.JWT_ALGORITHM]
    });
    
    // Check token type
    if (decoded.type !== 'access') {
      return res.status(401).json({
        error: 'Invalid token type',
        code: 'INVALID_TOKEN_TYPE',
        message: 'Access token required'
      });
    }
    
    // Check if session is still valid (if Redis is available)
    if (req.services?.auth?.redis) {
      const sessionKey = `session:${decoded.jti || 'unknown'}`;
      const sessionExists = await req.services.auth.redis.exists(sessionKey);
      
      if (!sessionExists) {
        return res.status(401).json({
          error: 'Session expired',
          code: 'SESSION_EXPIRED',
          message: 'Your session has expired. Please log in again.'
        });
      }
    }
    
    // Add user info to request
    req.user = {
      id: decoded.sub,
      walletAddress: decoded.wallet,
      roles: decoded.roles || [],
      permissions: decoded.permissions || [],
      iat: decoded.iat,
      exp: decoded.exp
    };
    
    next();
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
        message: 'Your access token has expired. Please refresh your token.'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
        message: 'The provided token is invalid'
      });
    } else {
      return res.status(500).json({
        error: 'Authentication error',
        code: 'AUTH_ERROR',
        message: 'An error occurred during authentication'
      });
    }
  }
};

/**
 * Optional authentication middleware
 * Adds user info to request if token is present, but doesn't require it
 */
export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = jwt.verify(token, AUTH_CONFIG.JWT_SECRET, {
        algorithms: [AUTH_CONFIG.JWT_ALGORITHM]
      });
      
      if (decoded.type === 'access') {
        req.user = {
          id: decoded.sub,
          walletAddress: decoded.wallet,
          roles: decoded.roles || [],
          permissions: decoded.permissions || [],
          iat: decoded.iat,
          exp: decoded.exp
        };
      }
    }
    
    next();
    
  } catch (error) {
    // For optional auth, we don't return errors, just continue without user
    req.user = null;
    next();
  }
};

/**
 * Role-based access control middleware
 */
export const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_AUTH',
        message: 'You must be authenticated to access this endpoint'
      });
    }
    
    const userRoles = req.user.roles || [];
    
    // Role hierarchy: member < moderator < admin < owner
    const roleHierarchy = ['member', 'moderator', 'admin', 'owner'];
    const userLevel = Math.max(...userRoles.map(role => roleHierarchy.indexOf(role)));
    const requiredLevel = roleHierarchy.indexOf(requiredRole);
    
    if (userLevel < requiredLevel) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_ROLE',
        message: `This endpoint requires ${requiredRole} role or higher`,
        required: requiredRole,
        current: userRoles
      });
    }
    
    next();
  };
};

/**
 * Permission-based access control middleware
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_AUTH',
        message: 'You must be authenticated to access this endpoint'
      });
    }
    
    const userPermissions = req.user.permissions || [];
    
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSION',
        message: `This endpoint requires '${permission}' permission`,
        required: permission,
        current: userPermissions
      });
    }
    
    next();
  };
};

/**
 * Clan membership validation middleware
 */
export const requireClanMembership = (paramName = 'clanId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH',
          message: 'You must be authenticated to access this endpoint'
        });
      }
      
      const clanId = req.params[paramName] || req.body[paramName];
      
      if (!clanId) {
        return res.status(400).json({
          error: 'Missing clan ID',
          code: 'MISSING_CLAN_ID',
          message: `Clan ID is required in ${paramName}`
        });
      }
      
      // Check membership using clan repository
      const clanRepository = req.services.clanRepository;
      if (!clanRepository) {
        return res.status(500).json({
          error: 'Service unavailable',
          code: 'SERVICE_ERROR',
          message: 'Clan service is not available'
        });
      }
      
      const membership = await clanRepository.clanDAO.getMembership(clanId, req.user.id);
      
      if (!membership) {
        return res.status(403).json({
          error: 'Clan membership required',
          code: 'NOT_CLAN_MEMBER',
          message: 'You must be a member of this clan to access this endpoint'
        });
      }
      
      // Add membership info to request
      req.membership = membership;
      
      next();
      
    } catch (error) {
      return res.status(500).json({
        error: 'Membership validation error',
        code: 'MEMBERSHIP_ERROR',
        message: 'Failed to validate clan membership'
      });
    }
  };
};

/**
 * Clan role validation middleware
 */
export const requireClanRole = (requiredRole, paramName = 'clanId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH',
          message: 'You must be authenticated to access this endpoint'
        });
      }
      
      const clanId = req.params[paramName] || req.body[paramName];
      
      if (!clanId) {
        return res.status(400).json({
          error: 'Missing clan ID',
          code: 'MISSING_CLAN_ID',
          message: `Clan ID is required in ${paramName}`
        });
      }
      
      const clanRepository = req.services.clanRepository;
      if (!clanRepository) {
        return res.status(500).json({
          error: 'Service unavailable',
          code: 'SERVICE_ERROR',
          message: 'Clan service is not available'
        });
      }
      
      const membership = await clanRepository.clanDAO.getMembership(clanId, req.user.id);
      
      if (!membership) {
        return res.status(403).json({
          error: 'Clan membership required',
          code: 'NOT_CLAN_MEMBER',
          message: 'You must be a member of this clan'
        });
      }
      
      // Check role hierarchy
      const roleHierarchy = ['member', 'moderator', 'admin', 'owner'];
      const userLevel = roleHierarchy.indexOf(membership.role);
      const requiredLevel = roleHierarchy.indexOf(requiredRole);
      
      if (userLevel < requiredLevel) {
        return res.status(403).json({
          error: 'Insufficient clan role',
          code: 'INSUFFICIENT_CLAN_ROLE',
          message: `This action requires ${requiredRole} role or higher in the clan`,
          required: requiredRole,
          current: membership.role
        });
      }
      
      req.membership = membership;
      next();
      
    } catch (error) {
      return res.status(500).json({
        error: 'Role validation error',
        code: 'ROLE_ERROR',
        message: 'Failed to validate clan role'
      });
    }
  };
};

/**
 * Self-access validation middleware
 * Ensures user can only access their own resources or has admin permissions
 */
export const requireSelfOrAdmin = (paramName = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_AUTH',
        message: 'You must be authenticated to access this endpoint'
      });
    }
    
    const targetUserId = req.params[paramName] || req.body[paramName];
    const isOwnResource = targetUserId === req.user.id;
    const isAdmin = req.user.roles.includes('admin') || req.user.roles.includes('owner');
    
    if (!isOwnResource && !isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED',
        message: 'You can only access your own resources or need admin permissions'
      });
    }
    
    next();
  };
};

/**
 * Wallet ownership validation middleware
 */
export const requireWalletOwnership = (paramName = 'walletAddress') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_AUTH',
        message: 'You must be authenticated to access this endpoint'
      });
    }
    
    const targetWallet = req.params[paramName] || req.body[paramName];
    
    if (targetWallet !== req.user.walletAddress) {
      return res.status(403).json({
        error: 'Wallet ownership required',
        code: 'WALLET_MISMATCH',
        message: 'You can only access resources owned by your authenticated wallet'
      });
    }
    
    next();
  };
};

// Export all middleware functions
export default {
  authMiddleware,
  optionalAuthMiddleware,
  requireRole,
  requirePermission,
  requireClanMembership,
  requireClanRole,
  requireSelfOrAdmin,
  requireWalletOwnership
};