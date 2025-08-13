/**
 * MLG.clan Platform API Server
 * 
 * Express.js server configuration with middleware, routes, and error handling
 * for the MLG.clan gaming platform API.
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Import middleware
import { authMiddleware } from './middleware/auth.middleware.js';
import { validationMiddleware } from './middleware/validation.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { rateLimiterMiddleware } from './middleware/rateLimiter.middleware.js';
import { configureComprehensiveRateLimiting } from './middleware/comprehensive-rate-limiter.js';
import { rateLimitAnalyticsMiddleware } from './middleware/rate-limit-analytics.js';

// Import DDoS protection
import { configureDDoSProtection, getDDoSProtectionStatus } from '../security/ddos/ddos-integration.js';

// Import route modules
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import clanRoutes from './routes/clan.routes.js';
import votingRoutes from './routes/voting.routes.js';
import contentRoutes from './routes/content.routes.js';
import transactionRoutes from './routes/transaction.routes.js';

// Import services and repositories
import AuthService from '../auth/auth-service.js';
import UserRepository from '../data/repositories/UserRepository.js';
import ClanRepository from '../data/repositories/ClanRepository.js';
import VotingRepository from '../data/repositories/VotingRepository.js';
import ContentRepository from '../data/repositories/ContentRepository.js';

/**
 * API Server Configuration
 */
const API_CONFIG = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_PREFIX: '/api',
  API_VERSION: 'v1',
  
  // CORS Settings - Enhanced for development
  CORS_ORIGIN: process.env.CORS_ORIGIN || [
    'http://localhost:9000', // Frontend development server
    'http://localhost:3000', // Main development server
    'http://localhost:3001', // Demo server
    'http://127.0.0.1:9000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ],
  CORS_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  CORS_HEADERS: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'X-API-Key'
  ],
  
  // Rate Limiting
  GLOBAL_RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  // Request Size Limits
  JSON_LIMIT: '10mb',
  URL_LIMIT: '1mb',
  
  // Socket.IO Configuration
  SOCKET_CONFIG: {
    cors: {
      origin: [
        'http://localhost:9000', // Frontend development server
        'http://localhost:3000', // Main development server
        'http://localhost:3001', // Demo server
        'http://127.0.0.1:9000',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001'
      ],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  }
};

/**
 * MLG API Server Class
 */
class MLGApiServer {
  constructor(options = {}) {
    this.options = { ...API_CONFIG, ...options };
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, this.options.SOCKET_CONFIG);
    
    // Initialize services
    this.authService = null;
    this.userRepository = null;
    this.clanRepository = null;
    this.votingRepository = null;
    this.contentRepository = null;
    
    this.logger = options.logger || console;
  }

  /**
   * Initialize services and repositories
   */
  async initializeServices() {
    try {
      // Initialize authentication service
      this.authService = new AuthService({
        logger: this.logger
      });
      await this.authService.initializeDatabase();
      
      // Initialize repositories
      const repositoryOptions = {
        logger: this.logger,
        metrics: this.options.metrics
      };
      
      this.userRepository = new UserRepository(repositoryOptions);
      this.clanRepository = new ClanRepository(repositoryOptions);
      this.votingRepository = new VotingRepository(repositoryOptions);
      this.contentRepository = new ContentRepository(repositoryOptions);
      
      this.logger.info('Services initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize services:', error);
      throw error;
    }
  }

  /**
   * Configure Express middleware
   */
  async setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false
    }));
    
    // CORS configuration with enhanced options
    const corsOptions = {
      origin: this.options.CORS_ORIGIN,
      methods: this.options.CORS_METHODS,
      allowedHeaders: this.options.CORS_HEADERS,
      credentials: true,
      maxAge: 86400, // 24 hours for preflight cache
      optionsSuccessStatus: 200 // Support legacy browsers
    };
    
    this.app.use(cors(corsOptions));
    
    // Handle preflight requests explicitly
    this.app.options('*', cors(corsOptions));
    
    // Compression
    this.app.use(compression());
    
    // Configure comprehensive DDoS protection (includes rate limiting)
    await configureDDoSProtection(this.app);
    
    // Body parsing
    this.app.use(express.json({
      limit: this.options.JSON_LIMIT,
      verify: (req, res, buf) => {
        // Store raw body for webhook verification if needed
        req.rawBody = buf;
      }
    }));
    this.app.use(express.urlencoded({
      extended: true,
      limit: this.options.URL_LIMIT
    }));
    
    // Request logging middleware
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.logger.info(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
      });
      next();
    });
    
    // Add services to request context
    this.app.use((req, res, next) => {
      req.services = {
        auth: this.authService,
        userRepository: this.userRepository,
        clanRepository: this.clanRepository,
        votingRepository: this.votingRepository,
        contentRepository: this.contentRepository
      };
      req.io = this.io;
      next();
    });
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    const apiRouter = express.Router();
    
    // Health check endpoint
    apiRouter.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: this.options.API_VERSION,
        environment: this.options.NODE_ENV
      });
    });
    
    // API status endpoint with service checks
    apiRouter.get('/status', async (req, res) => {
      const status = {
        api: 'ok',
        database: 'unknown',
        redis: 'unknown',
        ddos_protection: getDDoSProtectionStatus(),
        timestamp: new Date().toISOString()
      };
      
      try {
        // Check database connectivity
        if (this.authService && this.authService.db) {
          await this.authService.db.query('SELECT 1');
          status.database = 'ok';
        }
        
        // Check Redis connectivity
        if (this.authService && this.authService.redis) {
          await this.authService.redis.ping();
          status.redis = 'ok';
        }
      } catch (error) {
        status.database = 'error';
        status.redis = 'error';
      }
      
      const isHealthy = Object.values(status).every(s => s === 'ok' || s === 'unknown');
      res.status(isHealthy ? 200 : 503).json(status);
    });
    
    // Mount route modules
    apiRouter.use('/auth', authRoutes);
    apiRouter.use('/users', userRoutes);
    apiRouter.use('/clans', clanRoutes);
    apiRouter.use('/voting', votingRoutes);
    apiRouter.use('/content', contentRoutes);
    apiRouter.use('/transactions', transactionRoutes);
    
    // Mount API router
    this.app.use(this.options.API_PREFIX, apiRouter);
    
    // Catch-all for undefined API routes
    this.app.all(`${this.options.API_PREFIX}/*`, (req, res) => {
      res.status(404).json({
        error: 'API endpoint not found',
        method: req.method,
        path: req.path,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Setup Socket.IO for real-time features
   */
  setupSocketIO() {
    this.io.on('connection', (socket) => {
      this.logger.info(`Socket connected: ${socket.id}`);
      
      // Handle authentication for socket connections
      socket.on('authenticate', async (data) => {
        try {
          const { token } = data;
          const decoded = await this.authService.validateToken(token);
          
          socket.userId = decoded.sub;
          socket.walletAddress = decoded.wallet;
          socket.join(`user:${decoded.sub}`);
          
          socket.emit('authenticated', { success: true });
          this.logger.info(`Socket authenticated: ${socket.id} - User: ${decoded.sub}`);
        } catch (error) {
          socket.emit('authentication_failed', { error: error.message });
        }
      });
      
      // Join clan channels for real-time updates
      socket.on('join_clan', (clanId) => {
        if (socket.userId) {
          socket.join(`clan:${clanId}`);
          socket.emit('joined_clan', { clanId });
        }
      });
      
      // Leave clan channels
      socket.on('leave_clan', (clanId) => {
        socket.leave(`clan:${clanId}`);
        socket.emit('left_clan', { clanId });
      });
      
      // Handle disconnection
      socket.on('disconnect', () => {
        this.logger.info(`Socket disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // 404 handler for non-API routes
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Route not found',
        message: 'The requested resource does not exist',
        timestamp: new Date().toISOString()
      });
    });
    
    // Global error handler
    this.app.use(errorMiddleware);
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception:', error);
      this.shutdown(1);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.shutdown(1);
    });
    
    // Handle SIGINT and SIGTERM for graceful shutdown
    process.on('SIGINT', () => {
      this.logger.info('Received SIGINT, shutting down gracefully');
      this.shutdown(0);
    });
    
    process.on('SIGTERM', () => {
      this.logger.info('Received SIGTERM, shutting down gracefully');
      this.shutdown(0);
    });
  }

  /**
   * Start the server
   */
  async start() {
    try {
      // Initialize services
      await this.initializeServices();
      
      // Setup middleware and routes
      await this.setupMiddleware();
      this.setupRoutes();
      this.setupSocketIO();
      this.setupErrorHandling();
      
      // Start the server
      this.server.listen(this.options.PORT, () => {
        this.logger.info(`MLG.clan API Server running on port ${this.options.PORT}`);
        this.logger.info(`Environment: ${this.options.NODE_ENV}`);
        this.logger.info(`API Base URL: http://localhost:${this.options.PORT}${this.options.API_PREFIX}`);
      });
      
    } catch (error) {
      this.logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(exitCode = 0) {
    try {
      this.logger.info('Starting graceful shutdown...');
      
      // Close Socket.IO connections
      this.io.close();
      
      // Close HTTP server
      this.server.close(() => {
        this.logger.info('HTTP server closed');
      });
      
      // Close database connections
      if (this.authService) {
        await this.authService.shutdown();
      }
      
      this.logger.info('Graceful shutdown completed');
      process.exit(exitCode);
      
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Get the Express app instance
   */
  getApp() {
    return this.app;
  }

  /**
   * Get the HTTP server instance
   */
  getServer() {
    return this.server;
  }

  /**
   * Get the Socket.IO instance
   */
  getIO() {
    return this.io;
  }
}

// Export the server class and create default instance
export { MLGApiServer, API_CONFIG };

// Create and export default server instance
export default new MLGApiServer();

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new MLGApiServer();
  server.start();
}