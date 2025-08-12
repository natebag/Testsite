/**
 * MLG.clan Frontend Development Server (Port 9000)
 * 
 * Serves the frontend application with CORS support and API proxy
 * to backend services on ports 3000 and 3001.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 9000;

// CORS Configuration for Development
const corsOptions = {
  origin: [
    'http://localhost:9000',
    'http://localhost:3000', 
    'http://localhost:3001',
    'http://127.0.0.1:9000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  credentials: true,
  maxAge: 86400, // 24 hours for preflight cache
  optionsSuccessStatus: 200 // Support legacy browsers
};

// Enable CORS for all routes
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Proxy Configuration
// Proxy /api/demo/* requests to demo server (port 3001)
app.use('/api/demo', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/demo': '/api/demo'
  },
  onError: (err, req, res) => {
    console.error('Demo API Proxy Error:', err.message);
    res.status(503).json({
      error: 'Demo API service unavailable',
      message: 'Unable to connect to demo server on port 3001',
      timestamp: new Date().toISOString()
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying: ${req.method} ${req.path} -> http://localhost:3001${req.path}`);
  }
}));

// Proxy /api/* requests (except /api/demo) to main API server (port 3000)
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('Main API Proxy Error:', err.message);
    res.status(503).json({
      error: 'Main API service unavailable', 
      message: 'Unable to connect to main server on port 3000',
      timestamp: new Date().toISOString()
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying: ${req.method} ${req.path} -> http://localhost:3000${req.path}`);
  }
}));

// Serve static files with proper headers
app.use(express.static(__dirname, {
  setHeaders: (res, path, stat) => {
    // Add CORS headers to static files
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: 'MLG.clan Frontend Server',
    port: PORT,
    timestamp: new Date().toISOString(),
    cors_enabled: true,
    api_proxy: {
      demo: 'http://localhost:3001',
      main: 'http://localhost:3000'
    }
  });
});

// CORS test endpoint
app.get('/cors-test', (req, res) => {
  res.json({
    message: 'CORS is working correctly',
    origin: req.headers.origin,
    method: req.method,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
});

// Serve main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    message: 'The requested resource was not found on this server',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🎮 MLG.clan Frontend Server running on http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${__dirname}`);
  console.log(`📄 Main file: index.html`);
  console.log(`🌐 CORS enabled for cross-origin development`);
  console.log(`🔄 API Proxy:`);
  console.log(`   /api/demo/* -> http://localhost:3001`);
  console.log(`   /api/*      -> http://localhost:3000`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 CORS test: http://localhost:${PORT}/cors-test`);
});