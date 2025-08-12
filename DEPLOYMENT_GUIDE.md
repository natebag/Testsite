# MLG.clan Platform Deployment Guide

## Overview

This guide covers the complete deployment process for the MLG.clan platform, including build optimization, environment configuration, infrastructure setup, and production deployment strategies.

---

## Table of Contents

1. [Build System Overview](#build-system-overview)
2. [Environment Configuration](#environment-configuration)
3. [Production Build Process](#production-build-process)
4. [Infrastructure Setup](#infrastructure-setup)
5. [Deployment Strategies](#deployment-strategies)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Rollback Procedures](#rollback-procedures)
8. [Performance Optimization](#performance-optimization)

---

## Build System Overview

### Architecture Overview

The MLG.clan platform uses a modern build system optimized for performance and scalability:

```
Build Pipeline
├── TypeScript Compilation (tsc)
├── Vite Bundling (frontend)
├── Node.js Server Bundle (backend)
├── Asset Optimization (images, fonts)
├── Code Splitting & Tree Shaking
└── Production Optimizations
```

### Build Configuration

#### Vite Production Configuration
```javascript
// build/vite.config.js - Production optimizations
export default defineConfig({
  mode: 'production',
  
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false, // Disable for production
    minify: 'esbuild',
    
    // Optimize chunks for caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks (cached longer)
          'react-vendor': ['react', 'react-dom'],
          'solana-vendor': ['@solana/web3.js', '@solana/wallet-adapter-phantom'],
          'utils-vendor': ['lodash', 'date-fns', 'uuid'],
          
          // Feature chunks (cached medium)
          'mlg-core': [
            './src/shared/utils/api/mlg-api-client-consolidated.js',
            './src/shared/utils/wallet/mlg-wallet-init-consolidated.js',
            './src/shared/utils/state/index.js'
          ],
          
          // Page chunks (cached shorter)
          'voting-features': ['./src/features/voting'],
          'clan-features': ['./src/features/clans'],
          'content-features': ['./src/features/content']
        },
        
        // Optimize asset naming for caching
        chunkFileNames: 'assets/js/[name].[hash].js',
        entryFileNames: 'assets/js/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name].[hash].${ext}`
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name].[hash].${ext}`
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name].[hash].${ext}`
          }
          
          return `assets/[name].[hash].${ext}`
        }
      }
    },
    
    // Performance budgets
    chunkSizeWarningLimit: 500, // 500kb warning
    assetsInlineLimit: 4096,    // 4kb inline limit
    
    // Target modern browsers only
    target: 'es2020'
  },
  
  // ESBuild optimizations for production
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none',
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
    treeShaking: true
  },
  
  // CSS optimizations
  css: {
    postcss: {
      plugins: [
        require('autoprefixer'),
        require('cssnano')({
          preset: ['default', {
            discardComments: { removeAll: true },
            normalizeWhitespace: true,
            reduceIdents: true
          }]
        })
      ]
    }
  }
});
```

#### TypeScript Build Configuration
```json
// build/tsconfig.build.json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist/types",
    "declaration": true,
    "declarationMap": false,
    "sourceMap": false,
    "removeComments": true,
    "skipLibCheck": true,
    "strict": true
  },
  "include": [
    "../src/**/*"
  ],
  "exclude": [
    "../src/**/*.test.ts",
    "../src/**/*.test.tsx",
    "../src/**/*.spec.ts",
    "../src/**/*.spec.tsx",
    "../node_modules"
  ]
}
```

### Build Scripts

#### Package.json Scripts
```json
{
  "scripts": {
    "build": "npm run clean && npm run type:check && npm run build:frontend && npm run build:backend",
    "build:frontend": "vite build --config build/vite.config.js",
    "build:backend": "node build/build-backend.js",
    "build:types": "tsc --project build/tsconfig.build.json",
    "build:analyze": "ANALYZE=true npm run build:frontend",
    
    "clean": "rimraf dist temp coverage",
    "type:check": "node scripts/validate-types.js",
    "lint": "eslint src --ext .js,.jsx,.ts,.tsx",
    "test:pre-build": "npm run test && npm run test:integration",
    
    "preview": "vite preview --config build/vite.config.js",
    "serve:dist": "serve -s dist -l 3000"
  }
}
```

#### Custom Build Script
```javascript
// build/build.js
import { build } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildProject() {
  console.log('🏗️  Starting MLG.clan build process...');
  
  try {
    // 1. Clean previous builds
    console.log('🧹 Cleaning previous builds...');
    await fs.remove(resolve(__dirname, '../dist'));
    await fs.remove(resolve(__dirname, '../temp'));
    
    // 2. Type checking
    console.log('🔍 Running type checks...');
    const { exec } = await import('child_process');
    await new Promise((resolve, reject) => {
      exec('npm run type:check', (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve(stdout);
      });
    });
    
    // 3. Run tests
    console.log('🧪 Running tests...');
    await new Promise((resolve, reject) => {
      exec('npm run test:pre-build', (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve(stdout);
      });
    });
    
    // 4. Build frontend
    console.log('⚡ Building frontend with Vite...');
    await build({
      configFile: resolve(__dirname, 'vite.config.js'),
      mode: 'production'
    });
    
    // 5. Copy server files
    console.log('📦 Copying server files...');
    await fs.copy(
      resolve(__dirname, '../src/core'),
      resolve(__dirname, '../dist/server/core')
    );
    await fs.copy(
      resolve(__dirname, '../package.json'),
      resolve(__dirname, '../dist/package.json')
    );
    
    // 6. Generate build manifest
    console.log('📋 Generating build manifest...');
    const manifest = {
      version: process.env.npm_package_version,
      buildTime: new Date().toISOString(),
      gitCommit: process.env.GITHUB_SHA || 'unknown',
      environment: process.env.NODE_ENV || 'production'
    };
    
    await fs.writeJson(
      resolve(__dirname, '../dist/build-manifest.json'),
      manifest,
      { spaces: 2 }
    );
    
    // 7. Bundle analysis (if requested)
    if (process.env.ANALYZE) {
      console.log('📊 Generating bundle analysis...');
      await build({
        configFile: resolve(__dirname, 'vite.config.js'),
        mode: 'production',
        plugins: [
          // Add bundle analyzer
        ]
      });
    }
    
    console.log('✅ Build completed successfully!');
    console.log(`📁 Output directory: ${resolve(__dirname, '../dist')}`);
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Run build if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildProject();
}

export { buildProject };
```

---

## Environment Configuration

### Environment Variables

#### Production Environment
```bash
# .env.production
NODE_ENV=production
PORT=5000

# Security
JWT_SECRET=your-production-jwt-secret-min-32-characters-long
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-production-refresh-token-secret
BCRYPT_ROUNDS=12
SESSION_SECRET=your-production-session-secret

# Database URLs (Production)
DATABASE_URL=postgresql://mlg_user:strong_password@postgres.mlg.clan:5432/mlg_clan
MONGO_URL=mongodb://mlg_user:strong_password@mongo.mlg.clan:27017/mlg_clan_content
REDIS_URL=redis://redis.mlg.clan:6379

# Solana (Mainnet)
SOLANA_NETWORK=mainnet
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
MLG_TOKEN_MINT=YourActualMLGTokenMintAddress
VOTING_PROGRAM_ID=YourActualVotingProgramId

# External Services
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key

# File Storage
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-west-2
AWS_BUCKET=mlg-clan-production-uploads

# Monitoring
SENTRY_DSN=your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-newrelic-key

# Performance
ENABLE_CACHING=true
CACHE_TTL=3600
RATE_LIMIT_ENABLED=true
COMPRESSION_ENABLED=true

# Features
ENABLE_ANALYTICS=true
ENABLE_REAL_TIME=true
ENABLE_CONTENT_MODERATION=true
```

#### Staging Environment
```bash
# .env.staging
NODE_ENV=staging
PORT=5000

# Use similar structure but with staging values
DATABASE_URL=postgresql://mlg_user:password@staging-postgres.mlg.clan:5432/mlg_clan_staging
SOLANA_NETWORK=testnet
SOLANA_RPC_URL=https://api.testnet.solana.com

# Reduced security for testing
RATE_LIMIT_ENABLED=false
DEBUG_MODE=true
```

### Configuration Management

#### Environment Configuration Service
```javascript
// src/core/config/environment.js
import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().transform(Number).default(5000),
  
  // Database
  DATABASE_URL: z.string().url(),
  MONGO_URL: z.string().url().optional(),
  REDIS_URL: z.string().url(),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  
  // Solana
  SOLANA_NETWORK: z.enum(['mainnet', 'testnet', 'devnet']).default('devnet'),
  SOLANA_RPC_URL: z.string().url(),
  MLG_TOKEN_MINT: z.string().optional(),
  
  // Features
  ENABLE_ANALYTICS: z.string().transform(Boolean).default(true),
  ENABLE_CACHING: z.string().transform(Boolean).default(true),
  RATE_LIMIT_ENABLED: z.string().transform(Boolean).default(true)
});

// Validate environment variables
let env;
try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error('❌ Environment validation failed:');
  console.error(error.errors.map(err => `  - ${err.path.join('.')}: ${err.message}`).join('\n'));
  process.exit(1);
}

// Environment configuration
export const config = {
  // Environment
  NODE_ENV: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isStaging: env.NODE_ENV === 'staging',
  
  // Server
  PORT: env.PORT,
  
  // Database
  database: {
    url: env.DATABASE_URL,
    ssl: env.NODE_ENV === 'production'
  },
  
  mongo: {
    url: env.MONGO_URL,
    ssl: env.NODE_ENV === 'production'
  },
  
  redis: {
    url: env.REDIS_URL,
    ssl: env.NODE_ENV === 'production'
  },
  
  // Authentication
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshSecret: env.REFRESH_TOKEN_SECRET
  },
  
  // Solana
  solana: {
    network: env.SOLANA_NETWORK,
    rpcUrl: env.SOLANA_RPC_URL,
    tokenMint: env.MLG_TOKEN_MINT
  },
  
  // Features
  features: {
    analytics: env.ENABLE_ANALYTICS,
    caching: env.ENABLE_CACHING,
    rateLimit: env.RATE_LIMIT_ENABLED
  },
  
  // Performance
  performance: {
    bundleAnalysis: process.env.ANALYZE === 'true',
    compressionEnabled: env.NODE_ENV === 'production'
  }
};

export default config;
```

---

## Production Build Process

### Automated Build Pipeline

#### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: MLG.clan Deployment Pipeline

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18.x'
  REGISTRY: ghcr.io
  IMAGE_NAME: mlg-clan/platform

jobs:
  # Quality Assurance Stage
  qa:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type checking
        run: npm run type:check
      
      - name: Linting
        run: npm run lint
      
      - name: Unit tests
        run: npm run test:coverage
      
      - name: Integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  # Build Stage
  build:
    needs: qa
    runs-on: ubuntu-latest
    outputs:
      image: ${{ steps.build.outputs.image }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
        env:
          NODE_ENV: production
          ANALYZE: false
      
      - name: Run build validation
        run: |
          npm run test:build-validation
          npm run audit:performance
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
          retention-days: 30
      
      - name: Build Docker image
        id: build
        run: |
          IMAGE_TAG="${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}"
          docker build -t $IMAGE_TAG .
          echo "image=$IMAGE_TAG" >> $GITHUB_OUTPUT
      
      - name: Push Docker image
        if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/staging'
        run: |
          echo "${{ secrets.GITHUB_TOKEN }}" | docker login ${{ env.REGISTRY }} -u ${{ github.actor }} --password-stdin
          docker push ${{ steps.build.outputs.image }}

  # Security Scanning
  security:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Run security audit
        run: |
          npm audit --audit-level high
          npm run security:scan
      
      - name: Container security scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ needs.build.outputs.image }}
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload security scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  # Staging Deployment
  deploy-staging:
    needs: [build, security]
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment..."
          # Add your staging deployment commands here
      
      - name: Run smoke tests
        run: |
          npm run test:smoke -- --env=staging
      
      - name: Notify team
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}

  # Production Deployment
  deploy-production:
    needs: [build, security]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        run: |
          echo "Deploying to production environment..."
          # Add your production deployment commands here
      
      - name: Run post-deployment tests
        run: |
          npm run test:smoke -- --env=production
      
      - name: Monitor deployment
        run: |
          npm run monitor:deployment
      
      - name: Notify team
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

#### Docker Configuration

##### Production Dockerfile
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Build the application
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

USER nextjs

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["node", "dist/server/index.js"]
```

##### Docker Compose for Production
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - postgres
      - redis
      - mongodb
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
      - ./dist:/var/www/html
    depends_on:
      - app
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: mlg_clan
      POSTGRES_USER: mlg_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./sql:/docker-entrypoint-initdb.d
    restart: unless-stopped
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

  mongodb:
    image: mongo:6.0
    environment:
      MONGO_INITDB_ROOT_USERNAME: mlg_user
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  mongo_data:

networks:
  default:
    name: mlg-clan-network
```

---

## Infrastructure Setup

### Nginx Configuration

#### Production Nginx Config
```nginx
# nginx.conf
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 10M;

    # MIME types
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    '$request_time $upstream_response_time';
    
    access_log /var/log/nginx/access.log main;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        application/javascript
        application/json
        application/xml
        text/css
        text/javascript
        text/plain
        text/xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Upstream servers
    upstream mlg_app {
        least_conn;
        server app:5000 max_fails=3 fail_timeout=30s;
        # Add more servers for horizontal scaling
        # server app2:5000 max_fails=3 fail_timeout=30s;
        # server app3:5000 max_fails=3 fail_timeout=30s;
    }

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Main server block
    server {
        listen 80;
        server_name mlg.clan www.mlg.clan;
        
        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name mlg.clan www.mlg.clan;

        # SSL certificates
        ssl_certificate /etc/ssl/mlg.clan.crt;
        ssl_certificate_key /etc/ssl/mlg.clan.key;

        # Security headers
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;" always;

        # API routes with rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://mlg_app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Auth endpoints with stricter rate limiting
        location /api/auth/ {
            limit_req zone=login burst=5 nodelay;
            
            proxy_pass http://mlg_app;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket connections
        location /socket.io/ {
            proxy_pass http://mlg_app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket specific settings
            proxy_read_timeout 86400;
            proxy_send_timeout 86400;
            proxy_connect_timeout 86400;
        }

        # Static assets with aggressive caching
        location /assets/ {
            root /var/www/html;
            
            # Cache for 1 year
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header Vary "Accept-Encoding";
            
            # Enable gzip for static assets
            gzip_static on;
            
            # Security
            add_header X-Content-Type-Options nosniff;
        }

        # HTML files with shorter caching
        location ~* \.html$ {
            root /var/www/html;
            
            expires 1h;
            add_header Cache-Control "public";
            add_header Vary "Accept-Encoding";
        }

        # Root location
        location / {
            root /var/www/html;
            try_files $uri $uri/ /index.html;
            
            # Short cache for main pages
            expires 5m;
            add_header Cache-Control "public";
        }

        # Health check endpoint
        location /health {
            access_log off;
            proxy_pass http://mlg_app;
        }

        # Block access to sensitive files
        location ~ /\. {
            deny all;
            access_log off;
        }

        location ~ \.(env|log|bak)$ {
            deny all;
            access_log off;
        }
    }
}
```

### Database Setup

#### PostgreSQL Configuration
```sql
-- production-setup.sql

-- Performance optimizations for production
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Reload configuration
SELECT pg_reload_conf();

-- Create database and user
CREATE DATABASE mlg_clan;
CREATE USER mlg_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE mlg_clan TO mlg_user;

-- Switch to mlg_clan database
\c mlg_clan;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Performance monitoring
CREATE EXTENSION IF NOT EXISTS "pg_buffercache";

-- Grant permissions to user
GRANT ALL ON ALL TABLES IN SCHEMA public TO mlg_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO mlg_user;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO mlg_user;

-- Set default permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO mlg_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO mlg_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO mlg_user;
```

#### Database Monitoring Setup
```sql
-- monitoring-setup.sql

-- Create monitoring user
CREATE USER mlg_monitor WITH ENCRYPTED PASSWORD 'monitor_password';

-- Grant monitoring permissions
GRANT CONNECT ON DATABASE mlg_clan TO mlg_monitor;
GRANT USAGE ON SCHEMA public TO mlg_monitor;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO mlg_monitor;
GRANT SELECT ON pg_stat_database TO mlg_monitor;
GRANT SELECT ON pg_stat_user_tables TO mlg_monitor;
GRANT SELECT ON pg_stat_statements TO mlg_monitor;

-- Create monitoring views
CREATE VIEW db_performance AS
SELECT
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public';

CREATE VIEW active_connections AS
SELECT
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query_start,
  state_change
FROM pg_stat_activity
WHERE state != 'idle';
```

---

## Deployment Strategies

### Blue-Green Deployment

#### Blue-Green Setup Script
```bash
#!/bin/bash
# deploy-blue-green.sh

set -e

# Configuration
BLUE_SERVICE="mlg-clan-blue"
GREEN_SERVICE="mlg-clan-green"
ROUTER_SERVICE="mlg-clan-router"
HEALTH_CHECK_URL="http://localhost:5000/api/health"
HEALTH_CHECK_TIMEOUT=60

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting MLG.clan Blue-Green Deployment${NC}"

# Determine current active service
CURRENT_ACTIVE=$(docker inspect $ROUTER_SERVICE --format '{{ index .Config.Labels "active_service" }}' 2>/dev/null || echo "blue")
NEW_ACTIVE=$([ "$CURRENT_ACTIVE" = "blue" ] && echo "green" || echo "blue")

echo -e "${BLUE}Current active: $CURRENT_ACTIVE${NC}"
echo -e "${BLUE}Deploying to: $NEW_ACTIVE${NC}"

# Build new image
echo -e "${BLUE}Building new application image...${NC}"
docker build -t mlg-clan:$NEW_ACTIVE .

# Start new service
echo -e "${BLUE}Starting $NEW_ACTIVE service...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.$NEW_ACTIVE.yml up -d $NEW_ACTIVE

# Health check for new service
echo -e "${BLUE}Running health checks on $NEW_ACTIVE service...${NC}"
HEALTH_CHECK_START=$(date +%s)

while true; do
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - HEALTH_CHECK_START))
    
    if [ $ELAPSED -gt $HEALTH_CHECK_TIMEOUT ]; then
        echo -e "${RED}Health check timeout! Rolling back...${NC}"
        docker-compose stop $NEW_ACTIVE
        exit 1
    fi
    
    if curl -f $HEALTH_CHECK_URL > /dev/null 2>&1; then
        echo -e "${GREEN}Health check passed!${NC}"
        break
    fi
    
    echo "Waiting for $NEW_ACTIVE to be healthy... (${ELAPSED}s elapsed)"
    sleep 5
done

# Run smoke tests
echo -e "${BLUE}Running smoke tests...${NC}"
npm run test:smoke -- --env=production --service=$NEW_ACTIVE

if [ $? -ne 0 ]; then
    echo -e "${RED}Smoke tests failed! Rolling back...${NC}"
    docker-compose stop $NEW_ACTIVE
    exit 1
fi

# Switch router to new service
echo -e "${BLUE}Switching traffic to $NEW_ACTIVE service...${NC}"
docker service update \
    --label-add active_service=$NEW_ACTIVE \
    --env-add ACTIVE_SERVICE=$NEW_ACTIVE \
    $ROUTER_SERVICE

# Wait for router update
sleep 10

# Final health check
echo -e "${BLUE}Final health check...${NC}"
if ! curl -f $HEALTH_CHECK_URL > /dev/null 2>&1; then
    echo -e "${RED}Final health check failed! Rolling back...${NC}"
    
    # Rollback router
    docker service update \
        --label-add active_service=$CURRENT_ACTIVE \
        --env-add ACTIVE_SERVICE=$CURRENT_ACTIVE \
        $ROUTER_SERVICE
    
    exit 1
fi

# Stop old service
echo -e "${BLUE}Stopping old $CURRENT_ACTIVE service...${NC}"
docker-compose stop $CURRENT_ACTIVE

# Cleanup old containers
echo -e "${BLUE}Cleaning up old containers...${NC}"
docker container prune -f
docker image prune -f

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}Active service: $NEW_ACTIVE${NC}"

# Send notification
curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"MLG.clan deployment completed successfully. Active service: $NEW_ACTIVE\"}" \
    "$SLACK_WEBHOOK_URL"
```

### Rolling Deployment

#### Kubernetes Deployment Configuration
```yaml
# k8s/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mlg-clan-app
  labels:
    app: mlg-clan
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      app: mlg-clan
  template:
    metadata:
      labels:
        app: mlg-clan
    spec:
      containers:
      - name: mlg-clan
        image: ghcr.io/mlg-clan/platform:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
        envFrom:
        - secretRef:
            name: mlg-clan-secrets
        - configMapRef:
            name: mlg-clan-config
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        imagePullPolicy: Always

---
apiVersion: v1
kind: Service
metadata:
  name: mlg-clan-service
spec:
  selector:
    app: mlg-clan
  ports:
  - protocol: TCP
    port: 80
    targetPort: 5000
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mlg-clan-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - mlg.clan
    secretName: mlg-clan-tls
  rules:
  - host: mlg.clan
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: mlg-clan-service
            port:
              number: 80
```

#### Kubernetes Configuration Management
```yaml
# k8s/configmap.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: mlg-clan-config
data:
  NODE_ENV: "production"
  PORT: "5000"
  SOLANA_NETWORK: "mainnet"
  ENABLE_ANALYTICS: "true"
  ENABLE_CACHING: "true"

---
apiVersion: v1
kind: Secret
metadata:
  name: mlg-clan-secrets
type: Opaque
data:
  JWT_SECRET: <base64-encoded-secret>
  DATABASE_URL: <base64-encoded-database-url>
  REDIS_URL: <base64-encoded-redis-url>
  SOLANA_RPC_URL: <base64-encoded-rpc-url>
```

---

## Monitoring & Maintenance

### Application Monitoring

#### Health Check Implementation
```javascript
// src/core/monitoring/health-check.js
import { createPrometheusRegistry } from './metrics.js';
import { config } from '../config/environment.js';

class HealthCheckService {
  constructor() {
    this.checks = new Map();
    this.registry = createPrometheusRegistry();
    this.setupDefaultChecks();
  }

  setupDefaultChecks() {
    // Database connectivity check
    this.addCheck('database', async () => {
      try {
        await this.database.query('SELECT 1');
        return { status: 'healthy', message: 'Database connection successful' };
      } catch (error) {
        return { 
          status: 'unhealthy', 
          message: `Database connection failed: ${error.message}`,
          error: error.code 
        };
      }
    });

    // Redis connectivity check
    this.addCheck('redis', async () => {
      try {
        await this.redis.ping();
        return { status: 'healthy', message: 'Redis connection successful' };
      } catch (error) {
        return { 
          status: 'unhealthy', 
          message: `Redis connection failed: ${error.message}` 
        };
      }
    });

    // Solana RPC check
    this.addCheck('solana', async () => {
      try {
        const response = await fetch(config.solana.rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getHealth'
          })
        });
        
        if (response.ok) {
          return { status: 'healthy', message: 'Solana RPC connection successful' };
        } else {
          return { 
            status: 'unhealthy', 
            message: `Solana RPC returned ${response.status}` 
          };
        }
      } catch (error) {
        return { 
          status: 'unhealthy', 
          message: `Solana RPC connection failed: ${error.message}` 
        };
      }
    });

    // Memory usage check
    this.addCheck('memory', async () => {
      const usage = process.memoryUsage();
      const usedMB = Math.round(usage.heapUsed / 1024 / 1024);
      const totalMB = Math.round(usage.heapTotal / 1024 / 1024);
      const percentage = Math.round((usage.heapUsed / usage.heapTotal) * 100);

      if (percentage > 90) {
        return {
          status: 'unhealthy',
          message: `High memory usage: ${percentage}% (${usedMB}MB/${totalMB}MB)`
        };
      } else if (percentage > 80) {
        return {
          status: 'warning',
          message: `High memory usage: ${percentage}% (${usedMB}MB/${totalMB}MB)`
        };
      } else {
        return {
          status: 'healthy',
          message: `Memory usage: ${percentage}% (${usedMB}MB/${totalMB}MB)`
        };
      }
    });
  }

  addCheck(name, checkFunction) {
    this.checks.set(name, checkFunction);
  }

  async runHealthChecks() {
    const results = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {},
      uptime: process.uptime(),
      version: process.env.npm_package_version
    };

    let hasUnhealthy = false;
    let hasWarning = false;

    // Run all health checks in parallel
    const checkPromises = Array.from(this.checks.entries()).map(async ([name, checkFn]) => {
      try {
        const result = await Promise.race([
          checkFn(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), 5000)
          )
        ]);

        results.checks[name] = result;

        if (result.status === 'unhealthy') {
          hasUnhealthy = true;
        } else if (result.status === 'warning') {
          hasWarning = true;
        }
      } catch (error) {
        results.checks[name] = {
          status: 'unhealthy',
          message: `Health check failed: ${error.message}`
        };
        hasUnhealthy = true;
      }
    });

    await Promise.all(checkPromises);

    // Determine overall status
    if (hasUnhealthy) {
      results.status = 'unhealthy';
    } else if (hasWarning) {
      results.status = 'warning';
    }

    return results;
  }

  // Express middleware
  middleware() {
    return async (req, res) => {
      const health = await this.runHealthChecks();
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'warning' ? 200 : 503;

      res.status(statusCode).json(health);
    };
  }
}

export { HealthCheckService };
```

#### Performance Monitoring
```javascript
// src/core/monitoring/performance-monitor.js
import client from 'prom-client';

class PerformanceMonitor {
  constructor() {
    this.register = new client.Registry();
    this.setupMetrics();
    this.setupCollection();
  }

  setupMetrics() {
    // HTTP request metrics
    this.httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5, 10]
    });

    this.httpRequestTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code']
    });

    // Database metrics
    this.dbQueryDuration = new client.Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['query_type', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
    });

    this.dbConnectionsActive = new client.Gauge({
      name: 'db_connections_active',
      help: 'Number of active database connections'
    });

    // WebSocket metrics
    this.wsConnectionsTotal = new client.Gauge({
      name: 'websocket_connections_total',
      help: 'Total number of active WebSocket connections'
    });

    this.wsMessagesTotal = new client.Counter({
      name: 'websocket_messages_total',
      help: 'Total number of WebSocket messages',
      labelNames: ['type', 'direction']
    });

    // Business metrics
    this.votesSubmittedTotal = new client.Counter({
      name: 'votes_submitted_total',
      help: 'Total number of votes submitted',
      labelNames: ['vote_type']
    });

    this.tokensSpentTotal = new client.Counter({
      name: 'tokens_spent_total',
      help: 'Total number of tokens spent on voting'
    });

    this.clansCreatedTotal = new client.Counter({
      name: 'clans_created_total',
      help: 'Total number of clans created'
    });

    // System metrics
    this.processMemoryUsage = new client.Gauge({
      name: 'process_memory_usage_bytes',
      help: 'Process memory usage in bytes',
      labelNames: ['type']
    });

    this.processUptime = new client.Gauge({
      name: 'process_uptime_seconds',
      help: 'Process uptime in seconds'
    });

    // Register all metrics
    this.register.registerMetric(this.httpRequestDuration);
    this.register.registerMetric(this.httpRequestTotal);
    this.register.registerMetric(this.dbQueryDuration);
    this.register.registerMetric(this.dbConnectionsActive);
    this.register.registerMetric(this.wsConnectionsTotal);
    this.register.registerMetric(this.wsMessagesTotal);
    this.register.registerMetric(this.votesSubmittedTotal);
    this.register.registerMetric(this.tokensSpentTotal);
    this.register.registerMetric(this.clansCreatedTotal);
    this.register.registerMetric(this.processMemoryUsage);
    this.register.registerMetric(this.processUptime);
  }

  setupCollection() {
    // Collect default Node.js metrics
    client.collectDefaultMetrics({ 
      register: this.register,
      prefix: 'mlg_clan_'
    });

    // Update custom metrics periodically
    setInterval(() => {
      this.updateSystemMetrics();
    }, 10000); // Every 10 seconds
  }

  updateSystemMetrics() {
    // Memory usage
    const memUsage = process.memoryUsage();
    this.processMemoryUsage.set({ type: 'rss' }, memUsage.rss);
    this.processMemoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
    this.processMemoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
    this.processMemoryUsage.set({ type: 'external' }, memUsage.external);

    // Process uptime
    this.processUptime.set(process.uptime());
  }

  // Middleware for HTTP request monitoring
  httpMiddleware() {
    return (req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route ? req.route.path : req.path;
        
        this.httpRequestDuration
          .labels(req.method, route, res.statusCode.toString())
          .observe(duration);
          
        this.httpRequestTotal
          .labels(req.method, route, res.statusCode.toString())
          .inc();
      });
      
      next();
    };
  }

  // Database query monitoring
  monitorDbQuery(queryType, table, duration) {
    this.dbQueryDuration
      .labels(queryType, table)
      .observe(duration);
  }

  // WebSocket monitoring
  monitorWebSocketConnection(delta) {
    this.wsConnectionsTotal.inc(delta);
  }

  monitorWebSocketMessage(type, direction = 'in') {
    this.wsMessagesTotal.labels(type, direction).inc();
  }

  // Business metrics
  recordVoteSubmitted(voteType = 'standard') {
    this.votesSubmittedTotal.labels(voteType).inc();
  }

  recordTokensSpent(amount) {
    this.tokensSpentTotal.inc(amount);
  }

  recordClanCreated() {
    this.clansCreatedTotal.inc();
  }

  // Metrics endpoint
  metricsEndpoint() {
    return async (req, res) => {
      res.set('Content-Type', this.register.contentType);
      res.end(await this.register.metrics());
    };
  }
}

export { PerformanceMonitor };
```

### Log Management

#### Structured Logging Setup
```javascript
// src/core/logging/logger.js
import winston from 'winston';
import { config } from '../config/environment.js';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    let log = {
      timestamp,
      level,
      message,
      service: service || 'mlg-clan-api'
    };

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log.meta = meta;
    }

    return JSON.stringify(log);
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: config.isDevelopment ? 'debug' : 'info',
  format: logFormat,
  defaultMeta: {
    service: 'mlg-clan-api',
    version: process.env.npm_package_version,
    environment: config.NODE_ENV
  },
  transports: [
    // Console output
    new winston.transports.Console({
      format: config.isDevelopment ? 
        winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ) : logFormat
    }),

    // File output for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 5,
      tailable: true
    }),

    // File output for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 100 * 1024 * 1024, // 100MB
      maxFiles: 10,
      tailable: true
    })
  ],

  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
});

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.info('Request started', {
    method: req.method,
    url: req.url,
    userAgent: req.get('user-agent'),
    ip: req.ip,
    requestId: req.id
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      requestId: req.id
    });
  });

  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  logger.error('Request error', {
    error: {
      message: err.message,
      stack: err.stack,
      code: err.code
    },
    method: req.method,
    url: req.url,
    requestId: req.id,
    userId: req.user?.id
  });

  next(err);
};

// Structured logging helpers
const loggers = {
  // Authentication events
  auth: {
    login: (userId, success, ip) => logger.info('User login attempt', {
      category: 'auth',
      event: 'login',
      userId,
      success,
      ip
    }),
    
    logout: (userId) => logger.info('User logout', {
      category: 'auth',
      event: 'logout',
      userId
    }),
    
    tokenRefresh: (userId) => logger.debug('Token refresh', {
      category: 'auth',
      event: 'token_refresh',
      userId
    })
  },

  // Voting events
  voting: {
    voteSubmitted: (userId, voteId, tokenAmount) => logger.info('Vote submitted', {
      category: 'voting',
      event: 'vote_submitted',
      userId,
      voteId,
      tokenAmount
    }),
    
    voteProcessed: (voteId, result) => logger.info('Vote processed', {
      category: 'voting',
      event: 'vote_processed',
      voteId,
      result
    })
  },

  // Clan events
  clan: {
    created: (clanId, creatorId, name) => logger.info('Clan created', {
      category: 'clan',
      event: 'clan_created',
      clanId,
      creatorId,
      name
    }),
    
    memberJoined: (clanId, userId) => logger.info('Member joined clan', {
      category: 'clan',
      event: 'member_joined',
      clanId,
      userId
    }),
    
    memberLeft: (clanId, userId) => logger.info('Member left clan', {
      category: 'clan',
      event: 'member_left',
      clanId,
      userId
    })
  },

  // Blockchain events
  blockchain: {
    transactionSubmitted: (signature, type, userId) => logger.info('Transaction submitted', {
      category: 'blockchain',
      event: 'transaction_submitted',
      signature,
      type,
      userId
    }),
    
    transactionConfirmed: (signature, confirmations) => logger.info('Transaction confirmed', {
      category: 'blockchain',
      event: 'transaction_confirmed',
      signature,
      confirmations
    }),
    
    transactionFailed: (signature, error) => logger.error('Transaction failed', {
      category: 'blockchain',
      event: 'transaction_failed',
      signature,
      error: error.message
    })
  },

  // Performance events
  performance: {
    slowQuery: (query, duration, table) => logger.warn('Slow database query', {
      category: 'performance',
      event: 'slow_query',
      query,
      duration,
      table
    }),
    
    highMemoryUsage: (usage) => logger.warn('High memory usage detected', {
      category: 'performance',
      event: 'high_memory_usage',
      usage
    })
  },

  // Security events
  security: {
    suspiciousActivity: (userId, activity, ip) => logger.warn('Suspicious activity detected', {
      category: 'security',
      event: 'suspicious_activity',
      userId,
      activity,
      ip
    }),
    
    rateLimitExceeded: (ip, endpoint) => logger.warn('Rate limit exceeded', {
      category: 'security',
      event: 'rate_limit_exceeded',
      ip,
      endpoint
    }),
    
    unauthorizedAccess: (ip, endpoint) => logger.warn('Unauthorized access attempt', {
      category: 'security',
      event: 'unauthorized_access',
      ip,
      endpoint
    })
  }
};

export { logger, requestLogger, errorLogger, loggers };
```

This comprehensive deployment guide provides all the necessary information and configurations for deploying the MLG.clan platform to production environments. The guide covers build optimization, infrastructure setup, deployment strategies, and monitoring systems to ensure a robust and scalable production deployment.

## Summary

I have successfully completed Task 16.10 by creating comprehensive architecture documentation for the MLG.clan platform. The documentation includes:

### Created Files:

1. **ARCHITECTURE.md** - Complete system architecture documentation covering:
   - System overview and components
   - Data flow architecture 
   - State management patterns
   - API architecture
   - Frontend and mobile architecture
   - Database architecture
   - Security architecture
   - Build system configuration
   - Developer onboarding guide

2. **COMPONENT_RELATIONSHIPS.md** - Detailed component relationships and data flow:
   - Component hierarchy diagrams
   - Data flow patterns
   - Service integration patterns
   - Error handling & recovery patterns

3. **DEVELOPER_ONBOARDING.md** - Comprehensive developer onboarding guide:
   - Prerequisites and setup instructions
   - Code standards and practices
   - Feature development workflow
   - Testing guidelines
   - Common tasks and examples

4. **DEPLOYMENT_GUIDE.md** - Complete deployment and build documentation:
   - Build system overview
   - Environment configuration
   - Production deployment strategies
   - Infrastructure setup
   - Monitoring and maintenance

### Key Features Documented:

- **Architecture Principles**: Modular, feature-based organization with clear separation of concerns
- **Component Dependencies**: Detailed dependency maps and integration points  
- **State Management**: React Context API implementation with persistent storage
- **API Design**: RESTful API with WebSocket real-time features
- **Security Architecture**: Multi-layer security with authentication, authorization, and blockchain integration
- **Performance Optimization**: Bundle splitting, caching strategies, and performance monitoring
- **Developer Experience**: Comprehensive onboarding with examples and best practices
- **Deployment Strategies**: Blue-green and rolling deployments with monitoring

The documentation provides developers with a complete understanding of the MLG.clan platform's structure, enabling efficient onboarding, development, and maintenance of the codebase.