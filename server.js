/**
 * MLG.clan Development Server with SSL Security Integration
 * Express server with comprehensive SSL security for gaming platform
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Import SSL Security Integration
import sslIntegration from './src/core/security/ssl/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

// Initialize SSL Security Integration
console.log('🔐 Initializing SSL Security Integration for MLG.clan...');
const sslMiddlewares = sslIntegration.getExpressMiddleware();

// Enhanced CORS Configuration for MLG.clan Development with HTTPS Support
const corsOptions = {
  origin: [
    'http://localhost:9000', // Frontend development server
    'http://localhost:3000', // Main development server
    'http://localhost:3001', // Demo server
    'http://127.0.0.1:9000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    // HTTPS origins for SSL testing
    'https://localhost:3443',
    'https://127.0.0.1:3443',
    'https://localhost:3000',
    'https://127.0.0.1:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'X-API-Key',
    // SSL and gaming-specific headers
    'X-Gaming-Platform',
    'X-Tournament-ID',
    'X-Clan-ID',
    'X-Wallet-Address',
    'X-SSL-Client-Certificate'
  ],
  credentials: true,
  maxAge: 86400, // 24 hours for preflight cache
  optionsSuccessStatus: 200 // Support legacy browsers
};

// Security middleware - Helmet with CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", // Required for Solana wallet integration
        "'unsafe-eval'", // Required for some crypto libraries
        "https://unpkg.com",
        "https://cdn.jsdelivr.net",
        "https://api.mainnet-beta.solana.com",
        "https://api.devnet.solana.com",
        "https://api.testnet.solana.com"
      ],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", // Required for dynamic styles
        "https://fonts.googleapis.com",
        "https://unpkg.com",
        "https://cdn.jsdelivr.net"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "data:"
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "blob:",
        "https:",
        "http://localhost:*"
      ],
      connectSrc: [
        "'self'",
        "https://api.mainnet-beta.solana.com",
        "https://api.devnet.solana.com", 
        "https://api.testnet.solana.com",
        "wss://api.mainnet-beta.solana.com",
        "wss://api.devnet.solana.com",
        "wss://api.testnet.solana.com",
        "http://localhost:*",
        "ws://localhost:*"
      ],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "data:", "blob:"],
      frameSrc: ["'none'"],
      childSrc: ["'none'"],
      workerSrc: ["'self'", "blob:"],
      manifestSrc: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false, // Required for SharedArrayBuffer in crypto
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for static assets
    return req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/);
  }
});

app.use(limiter);

// Apply SSL Security Middlewares first (HTTPS enforcement, security headers)
sslMiddlewares.forEach(middleware => {
  app.use(middleware);
});

// CORS configuration
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Parse JSON bodies with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Performance optimization middleware for static files
const staticOptions = {
  maxAge: '1y', // Cache static assets for 1 year
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // Set security headers for static files
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    
    // Cache control based on file type
    if (path.endsWith('.html')) {
      res.set('Cache-Control', 'public, max-age=300'); // 5 minutes for HTML
    } else if (path.match(/\.(css|js)$/)) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year for CSS/JS
    } else if (path.match(/\.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year for assets
    }
    
    // Compression hint
    if (path.match(/\.(css|js|html|json|xml|txt)$/)) {
      res.set('Vary', 'Accept-Encoding');
    }
  }
};

// Serve static files with optimization
app.use(express.static(path.join(__dirname, 'public'), staticOptions)); // PWA files
app.use(express.static(path.join(__dirname, 'src'), staticOptions));
app.use('/ui', express.static(path.join(__dirname, 'src/ui'), staticOptions));
app.use('/examples', express.static(path.join(__dirname, 'src/ui/examples'), staticOptions));

// Serve build files (when in production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist'), {
    ...staticOptions,
    maxAge: '1y',
    setHeaders: (res, path) => {
      staticOptions.setHeaders(res, path);
      // Additional production headers
      res.set('X-Robots-Tag', 'index, follow');
    }
  }));
}

// API endpoints (mock for development)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    network: 'mainnet-beta',
    mlgToken: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL'
  });
});

// Serve main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'index.html'));
});

// Serve demos and examples
app.get('/demo/voting', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/ui/examples/vote-display-demo.html'));
});

app.get('/demo/burn-vote', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/ui/examples/burn-vote-confirmation-demo.html'));
});

app.get('/demo/clan-management', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/ui/examples/clan-management-demo.html'));
});

app.get('/demo/content-submission', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/ui/examples/content-submission-demo.html'));
});

// SSL status endpoint
app.get('/api/ssl-status', (req, res) => {
  const sslStatus = sslIntegration.getStatus();
  res.json({
    ...sslStatus,
    server: {
      httpPort: PORT,
      httpsPort: HTTPS_PORT,
      protocol: req.secure ? 'https' : 'http',
      sslEnabled: req.secure || req.headers['x-forwarded-proto'] === 'https'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  // Track SSL errors
  if (err.code === 'ECONNABORTED' || err.message.includes('SSL')) {
    sslIntegration.trackError();
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Create dual server setup (HTTP + HTTPS) if SSL is configured
const dualServerSetup = sslIntegration.createDualServerSetup(app);

if (dualServerSetup) {
  // HTTPS server
  if (dualServerSetup.httpsServer) {
    dualServerSetup.httpsServer.listen(HTTPS_PORT, () => {
      console.log(`🔒 MLG.clan HTTPS Server running on port ${HTTPS_PORT}`);
      console.log(`🔗 Secure app: https://localhost:${HTTPS_PORT}`);
      console.log(`🗳️  Secure voting: https://localhost:${HTTPS_PORT}/demo/voting`);
      console.log(`🔥 Secure burn vote: https://localhost:${HTTPS_PORT}/demo/burn-vote`);
      console.log(`👥 Secure clan management: https://localhost:${HTTPS_PORT}/demo/clan-management`);
      console.log(`📝 Secure content submission: https://localhost:${HTTPS_PORT}/demo/content-submission`);
      console.log(`📊 SSL Status: https://localhost:${HTTPS_PORT}/api/ssl-status`);
    });
  }
  
  // HTTP server (for redirects)
  if (dualServerSetup.httpServer) {
    dualServerSetup.httpServer.listen(PORT, () => {
      console.log(`🌐 MLG.clan HTTP Server running on port ${PORT} (redirects to HTTPS)`);
    });
  }
} else {
  // Standard HTTP server for development
  app.listen(PORT, () => {
    console.log(`🎮 MLG.clan Development Server running on port ${PORT}`);
    console.log(`🔗 Main app: http://localhost:${PORT}`);
    console.log(`🗳️  Voting demo: http://localhost:${PORT}/demo/voting`);
    console.log(`🔥 Burn vote demo: http://localhost:${PORT}/demo/burn-vote`);
    console.log(`👥 Clan management: http://localhost:${PORT}/demo/clan-management`);
    console.log(`📝 Content submission: http://localhost:${PORT}/demo/content-submission`);
    console.log(`📊 SSL Status: http://localhost:${PORT}/api/ssl-status`);
  });
}

console.log('');
console.log('🔐 SSL Security Features:');
console.log('   ✅ HTTPS Enforcement with Gaming Optimization');
console.log('   ✅ SSL Certificate Management');
console.log('   ✅ Gaming-Optimized SSL Configuration');
console.log('   ✅ Advanced Security Headers with SSL Pinning');
console.log('   ✅ Real-time SSL Monitoring');
console.log('   ✅ Web3 Blockchain SSL Security');
console.log('   ✅ Tournament and Competitive Gaming SSL');
console.log('');
console.log('🎯 Performance Targets:');
console.log('   ⚡ SSL Handshake: <100ms');
console.log('   🚀 Additional Latency: <5ms');
console.log('   🏆 Tournament Grade: Enhanced Security');
console.log('   📱 Mobile Optimized: ChaCha20-Poly1305');
console.log('');
console.log('✨ All systems ready for secure gaming!');

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔐 Shutting down SSL Security Integration...');
  
  try {
    await sslIntegration.shutdown();
    console.log('✅ SSL Security Integration shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during SSL shutdown:', error);
    process.exit(1);
  }
});

export default app;