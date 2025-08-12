/**
 * Error Handling Middleware for MLG.clan API
 * 
 * Centralized error handling, logging, and response formatting
 * for consistent error responses across all API endpoints.
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

/**
 * Error configuration and types
 */
const ERROR_CONFIG = {
  // Environment settings
  NODE_ENV: process.env.NODE_ENV || 'development',
  INCLUDE_STACK: process.env.NODE_ENV === 'development',
  LOG_ERRORS: true,
  
  // Error categories
  CATEGORIES: {
    VALIDATION: 'validation',
    AUTHENTICATION: 'authentication',
    AUTHORIZATION: 'authorization',
    NOT_FOUND: 'not_found',
    RATE_LIMIT: 'rate_limit',
    DATABASE: 'database',
    EXTERNAL_SERVICE: 'external_service',
    BUSINESS_LOGIC: 'business_logic',
    INTERNAL: 'internal'
  },
  
  // HTTP status codes
  STATUS_CODES: {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503
  }
};

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(message, code, statusCode = 500, category = 'internal', details = null) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.statusCode = statusCode;
    this.category = category;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace
    Error.captureStackTrace(this, APIError);
  }
  
  toJSON() {
    return {
      error: this.message,
      code: this.code,
      category: this.category,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      ...(ERROR_CONFIG.INCLUDE_STACK && { stack: this.stack })
    };
  }
}

/**
 * Predefined API errors
 */
export const APIErrors = {
  // Validation errors
  VALIDATION_FAILED: (details) => new APIError(
    'Validation failed',
    'VALIDATION_FAILED',
    ERROR_CONFIG.STATUS_CODES.BAD_REQUEST,
    ERROR_CONFIG.CATEGORIES.VALIDATION,
    details
  ),
  
  // Authentication errors
  AUTHENTICATION_REQUIRED: () => new APIError(
    'Authentication required',
    'AUTHENTICATION_REQUIRED',
    ERROR_CONFIG.STATUS_CODES.UNAUTHORIZED,
    ERROR_CONFIG.CATEGORIES.AUTHENTICATION
  ),
  
  INVALID_TOKEN: () => new APIError(
    'Invalid or expired token',
    'INVALID_TOKEN',
    ERROR_CONFIG.STATUS_CODES.UNAUTHORIZED,
    ERROR_CONFIG.CATEGORIES.AUTHENTICATION
  ),
  
  // Authorization errors
  INSUFFICIENT_PERMISSIONS: (required, current) => new APIError(
    'Insufficient permissions',
    'INSUFFICIENT_PERMISSIONS',
    ERROR_CONFIG.STATUS_CODES.FORBIDDEN,
    ERROR_CONFIG.CATEGORIES.AUTHORIZATION,
    { required, current }
  ),
  
  // Resource errors
  RESOURCE_NOT_FOUND: (resource, id) => new APIError(
    `${resource} not found`,
    'RESOURCE_NOT_FOUND',
    ERROR_CONFIG.STATUS_CODES.NOT_FOUND,
    ERROR_CONFIG.CATEGORIES.NOT_FOUND,
    { resource, id }
  ),
  
  RESOURCE_CONFLICT: (resource, reason) => new APIError(
    `${resource} conflict: ${reason}`,
    'RESOURCE_CONFLICT',
    ERROR_CONFIG.STATUS_CODES.CONFLICT,
    ERROR_CONFIG.CATEGORIES.BUSINESS_LOGIC,
    { resource, reason }
  ),
  
  // Rate limiting
  RATE_LIMITED: (limit, windowMs) => new APIError(
    'Rate limit exceeded',
    'RATE_LIMITED',
    ERROR_CONFIG.STATUS_CODES.TOO_MANY_REQUESTS,
    ERROR_CONFIG.CATEGORIES.RATE_LIMIT,
    { limit, windowMs }
  ),
  
  // Business logic errors
  BUSINESS_RULE_VIOLATION: (rule, details) => new APIError(
    `Business rule violation: ${rule}`,
    'BUSINESS_RULE_VIOLATION',
    ERROR_CONFIG.STATUS_CODES.UNPROCESSABLE_ENTITY,
    ERROR_CONFIG.CATEGORIES.BUSINESS_LOGIC,
    details
  ),
  
  // Database errors
  DATABASE_ERROR: (operation) => new APIError(
    'Database operation failed',
    'DATABASE_ERROR',
    ERROR_CONFIG.STATUS_CODES.INTERNAL_SERVER_ERROR,
    ERROR_CONFIG.CATEGORIES.DATABASE,
    { operation }
  ),
  
  // External service errors
  EXTERNAL_SERVICE_ERROR: (service, details) => new APIError(
    `External service error: ${service}`,
    'EXTERNAL_SERVICE_ERROR',
    ERROR_CONFIG.STATUS_CODES.BAD_GATEWAY,
    ERROR_CONFIG.CATEGORIES.EXTERNAL_SERVICE,
    details
  ),
  
  // Generic internal error
  INTERNAL_ERROR: (message = 'Internal server error') => new APIError(
    message,
    'INTERNAL_ERROR',
    ERROR_CONFIG.STATUS_CODES.INTERNAL_SERVER_ERROR,
    ERROR_CONFIG.CATEGORIES.INTERNAL
  )
};

/**
 * Error type detection and mapping
 */
const detectErrorType = (error) => {
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return APIErrors.INVALID_TOKEN();
  }
  
  if (error.name === 'TokenExpiredError') {
    return APIErrors.INVALID_TOKEN();
  }
  
  // Joi validation errors
  if (error.name === 'ValidationError' && error.isJoi) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));
    return APIErrors.VALIDATION_FAILED(details);
  }
  
  // PostgreSQL errors
  if (error.code) {
    switch (error.code) {
      case '23505': // Unique constraint violation
        return APIErrors.RESOURCE_CONFLICT('Resource', 'Duplicate entry');
      case '23503': // Foreign key violation
        return APIErrors.RESOURCE_CONFLICT('Resource', 'Referenced resource not found');
      case '23502': // Not null violation
        return APIErrors.VALIDATION_FAILED([{
          field: error.column,
          message: 'Field is required',
          value: null
        }]);
      default:
        return APIErrors.DATABASE_ERROR(error.code);
    }
  }
  
  // MongoDB errors
  if (error.name === 'MongoError') {
    if (error.code === 11000) {
      return APIErrors.RESOURCE_CONFLICT('Resource', 'Duplicate entry');
    }
    return APIErrors.DATABASE_ERROR('mongo');
  }
  
  // HTTP errors from external services
  if (error.response) {
    return APIErrors.EXTERNAL_SERVICE_ERROR('HTTP', {
      status: error.response.status,
      statusText: error.response.statusText,
      url: error.response.config?.url
    });
  }
  
  // Connection errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return APIErrors.EXTERNAL_SERVICE_ERROR('Connection', {
      code: error.code,
      host: error.hostname,
      port: error.port
    });
  }
  
  // Default to internal error
  return null;
};

/**
 * Sanitize error for logging
 */
const sanitizeErrorForLogging = (error, req) => {
  const sanitized = {
    message: error.message,
    name: error.name,
    code: error.code,
    statusCode: error.statusCode,
    category: error.category,
    timestamp: error.timestamp || new Date().toISOString(),
    stack: error.stack,
    
    // Request context
    request: {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
      walletAddress: req.user?.walletAddress ? 
        `${req.user.walletAddress.substring(0, 8)}...` : undefined
    }
  };
  
  // Add error details if available
  if (error.details) {
    sanitized.details = error.details;
  }
  
  return sanitized;
};

/**
 * Format error response for client
 */
const formatErrorResponse = (error, req) => {
  const response = {
    error: error.message,
    code: error.code,
    timestamp: error.timestamp || new Date().toISOString()
  };
  
  // Add details in development or for specific error types
  if (ERROR_CONFIG.INCLUDE_STACK || error.category === ERROR_CONFIG.CATEGORIES.VALIDATION) {
    if (error.details) {
      response.details = error.details;
    }
  }
  
  // Add stack trace in development
  if (ERROR_CONFIG.INCLUDE_STACK && error.stack) {
    response.stack = error.stack;
  }
  
  // Add request ID for tracking
  if (req.id) {
    response.requestId = req.id;
  }
  
  return response;
};

/**
 * Log error with appropriate level
 */
const logError = (error, req, logger = console) => {
  if (!ERROR_CONFIG.LOG_ERRORS) return;
  
  const sanitizedError = sanitizeErrorForLogging(error, req);
  
  // Determine log level based on error category and status code
  if (error.statusCode >= 500) {
    logger.error('Server Error:', sanitizedError);
  } else if (error.statusCode === 429) {
    logger.warn('Rate Limit Exceeded:', sanitizedError);
  } else if (error.statusCode >= 400) {
    logger.info('Client Error:', sanitizedError);
  } else {
    logger.debug('Error:', sanitizedError);
  }
};

/**
 * Main error handling middleware
 */
export const errorMiddleware = (error, req, res, next) => {
  // Skip if response already sent
  if (res.headersSent) {
    return next(error);
  }
  
  let apiError;
  
  // Handle APIError instances
  if (error instanceof APIError) {
    apiError = error;
  } else {
    // Try to detect and map error type
    apiError = detectErrorType(error);
    
    // Fall back to generic internal error
    if (!apiError) {
      apiError = APIErrors.INTERNAL_ERROR(error.message);
    }
  }
  
  // Log error
  const logger = req.services?.logger || console;
  logError(apiError, req, logger);
  
  // Send error response
  const errorResponse = formatErrorResponse(apiError, req);
  res.status(apiError.statusCode).json(errorResponse);
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not found middleware for handling 404 errors
 */
export const notFoundMiddleware = (req, res, next) => {
  const error = APIErrors.RESOURCE_NOT_FOUND('Route', req.originalUrl);
  next(error);
};

/**
 * Create error for common scenarios
 */
export const createError = {
  badRequest: (message, details) => new APIError(
    message,
    'BAD_REQUEST',
    ERROR_CONFIG.STATUS_CODES.BAD_REQUEST,
    ERROR_CONFIG.CATEGORIES.VALIDATION,
    details
  ),
  
  unauthorized: (message = 'Unauthorized') => new APIError(
    message,
    'UNAUTHORIZED',
    ERROR_CONFIG.STATUS_CODES.UNAUTHORIZED,
    ERROR_CONFIG.CATEGORIES.AUTHENTICATION
  ),
  
  forbidden: (message = 'Forbidden') => new APIError(
    message,
    'FORBIDDEN',
    ERROR_CONFIG.STATUS_CODES.FORBIDDEN,
    ERROR_CONFIG.CATEGORIES.AUTHORIZATION
  ),
  
  notFound: (resource = 'Resource', id = null) => new APIError(
    `${resource} not found`,
    'NOT_FOUND',
    ERROR_CONFIG.STATUS_CODES.NOT_FOUND,
    ERROR_CONFIG.CATEGORIES.NOT_FOUND,
    { resource, id }
  ),
  
  conflict: (message, details) => new APIError(
    message,
    'CONFLICT',
    ERROR_CONFIG.STATUS_CODES.CONFLICT,
    ERROR_CONFIG.CATEGORIES.BUSINESS_LOGIC,
    details
  ),
  
  internal: (message = 'Internal server error') => new APIError(
    message,
    'INTERNAL_ERROR',
    ERROR_CONFIG.STATUS_CODES.INTERNAL_SERVER_ERROR,
    ERROR_CONFIG.CATEGORIES.INTERNAL
  )
};

// Export everything
export default {
  errorMiddleware,
  asyncHandler,
  notFoundMiddleware,
  APIError,
  APIErrors,
  createError,
  ERROR_CONFIG
};