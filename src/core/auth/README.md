# MLG.clan Authentication System

A comprehensive, enterprise-grade authentication system for the MLG.clan gaming platform, featuring Phantom wallet integration, JWT session management, role-based access control (RBAC), and multi-factor authentication (MFA).

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Security Features](#security-features)
- [Configuration](#configuration)
- [Testing](#testing)
- [Performance](#performance)
- [Deployment](#deployment)

## Features

### 🔐 Phantom Wallet Authentication
- **Challenge-Response Authentication**: Secure wallet signature verification using Solana cryptography
- **Multi-Wallet Support**: Prepared for MetaMask, Solflare, and other wallet integrations
- **Signature Verification**: Uses Solana public key cryptography with nacl and bs58 encoding
- **Replay Attack Prevention**: Time-limited challenges with unique nonces

### 🎫 JWT Token Management
- **Access & Refresh Tokens**: Secure token generation with configurable expiration
- **Token Refresh Mechanism**: Sliding session expiration for better user experience
- **Session Persistence**: Redis-backed session storage for scalability
- **Secure Token Storage**: HTTP-only cookies with CSRF protection

### 🏢 Role-Based Access Control (RBAC)
- **Hierarchical Roles**: Platform roles (Guest, Member, Moderator, Admin, Owner, Super Admin)
- **Clan-Specific Roles**: Context-aware permissions for clan management
- **Dynamic Permissions**: Runtime permission evaluation with inheritance
- **Permission Caching**: Redis-cached permissions for high performance

### 🛡️ Multi-Factor Authentication (MFA)
- **TOTP Integration**: Time-based One-Time Passwords using speakeasy
- **Backup Codes**: Recovery codes for account access
- **Trusted Devices**: Device registration and management
- **Account Recovery**: Secure recovery procedures

### 🔒 Security Features
- **Rate Limiting**: IP and user-based request throttling
- **Account Lockout**: Brute force protection with progressive delays
- **Session Management**: Secure session lifecycle with activity tracking
- **Security Logging**: Comprehensive audit trail for all authentication events

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MLG.clan Auth System                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │ AuthService │  │ SessionMgr   │  │ AuthMiddleware  │   │
│  │             │  │              │  │                 │   │
│  │ • Challenge │  │ • Redis      │  │ • Express       │   │
│  │ • Signature │  │ • Encryption │  │ • Rate Limiting │   │
│  │ • JWT Tokens│  │ • Cleanup    │  │ • Security      │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐                        │
│  │ RBACService │  │ MFAService   │                        │
│  │             │  │              │                        │
│  │ • Roles     │  │ • TOTP       │                        │
│  │ • Permissions│ │ • Backup     │                        │
│  │ • Context   │  │ • Devices    │                        │
│  └─────────────┘  └──────────────┘                        │
├─────────────────────────────────────────────────────────────┤
│           Storage Layer: PostgreSQL + Redis                │
└─────────────────────────────────────────────────────────────┘
```

## Installation

### Prerequisites

- Node.js 18+ with ES modules support
- PostgreSQL 14+
- Redis 6+
- Solana wallet (Phantom recommended)

### Install Dependencies

```bash
npm install @solana/web3.js @solana/wallet-adapter-phantom jsonwebtoken \
  speakeasy qrcode tweetnacl bs58 redis pg express cors helmet \
  bcryptjs uuid winston
```

### Database Setup

1. Create PostgreSQL database:
```sql
CREATE DATABASE mlg_clan;
```

2. Run database migrations:
```bash
npm run db:migrate
```

3. Seed initial data (optional):
```bash
npm run db:seed
```

### Environment Variables

Create a `.env` file:
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/mlg_clan

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
SESSION_ENCRYPTION_KEY=your-32-byte-hex-encryption-key

# Server
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## Quick Start

### 1. Initialize Services

```javascript
import { AuthService, SessionManager, RBACService, MFAService } from './auth/index.js';

// Initialize services
const authService = new AuthService();
const sessionManager = new SessionManager();
const rbacService = new RBACService();
const mfaService = new MFAService();

// Initialize connections
await authService.initializeDatabase();
await authService.initializeRedis();
await sessionManager.initialize();
await rbacService.initialize();
await mfaService.initialize();
```

### 2. Express Integration

```javascript
import express from 'express';
import { auth } from './auth/middleware/auth-middleware.js';

const app = express();

// Security middleware
app.use(auth.securityCheck());

// Public endpoint
app.get('/api/public', auth.optional(), (req, res) => {
  res.json({ user: req.user });
});

// Protected endpoint
app.get('/api/profile', auth.required(), (req, res) => {
  res.json({ user: req.user });
});

// Permission-based endpoint
app.get('/api/admin', auth.requirePermissions(['admin:dashboard']), (req, res) => {
  res.json({ message: 'Admin access granted' });
});
```

### 3. Wallet Authentication Flow

```javascript
// Frontend: Generate challenge
const response = await fetch('/auth/challenge', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ walletAddress: phantom.publicKey.toString() })
});

const { nonce, message } = await response.json();

// Frontend: Sign message with wallet
const signature = await phantom.signMessage(new TextEncoder().encode(message));

// Frontend: Verify signature
const authResponse = await fetch('/auth/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletAddress: phantom.publicKey.toString(),
    signature: bs58.encode(signature),
    nonce
  })
});

const { user, tokens } = await authResponse.json();
```

## API Documentation

### Authentication Endpoints

#### POST `/auth/challenge`
Generate authentication challenge for wallet.

**Request:**
```json
{
  "walletAddress": "4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM",
  "walletType": "phantom"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nonce": "abc123",
    "message": "MLG.clan Authentication - abc123\nWallet: 4uQ...\nTimestamp: 1641234567890",
    "expiresAt": 1641234867890,
    "walletType": "phantom"
  }
}
```

#### POST `/auth/verify`
Verify wallet signature and create session.

**Request:**
```json
{
  "walletAddress": "4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM",
  "signature": "base58-encoded-signature",
  "nonce": "abc123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "walletAddress": "4uQ...",
      "username": "player123",
      "roles": ["member"]
    },
    "tokens": {
      "accessToken": "jwt-access-token",
      "refreshToken": "jwt-refresh-token",
      "expiresAt": "2024-01-01T12:00:00.000Z"
    },
    "session": {
      "id": "session-uuid",
      "expiresAt": "2024-01-02T12:00:00.000Z"
    }
  }
}
```

### MFA Endpoints

#### POST `/auth/mfa/setup`
Setup TOTP multi-factor authentication.

**Headers:**
```
Authorization: Bearer jwt-access-token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCode": "data:image/png;base64,...",
    "manualEntryKey": "JBSWY3DPEHPK3PXP",
    "instructions": {
      "app": "Install Google Authenticator or Authy",
      "scan": "Scan the QR code or enter manual key",
      "verify": "Enter 6-digit code to complete setup"
    }
  }
}
```

#### POST `/auth/mfa/verify-setup`
Verify TOTP setup and enable MFA.

**Request:**
```json
{
  "token": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "backupCodes": [
      "ABC12345", "DEF67890", "GHI13579", "JKL24681", "MNO97531",
      "PQR86420", "STU75319", "VWX64208", "YZA53197", "BCD42086"
    ],
    "message": "TOTP enabled. Save backup codes securely."
  }
}
```

### RBAC Examples

#### Role Assignment
```javascript
// Assign moderator role to user
await rbacService.assignRole('user-id', 'moderator', {
  contextType: 'global',
  grantedBy: 'admin-user-id'
});

// Assign clan admin role with context
await rbacService.assignRole('user-id', 'clan_admin', {
  contextType: 'clan',
  contextId: 'clan-uuid',
  grantedBy: 'clan-owner-id'
});
```

#### Permission Checking
```javascript
// Check global permissions
const canModerate = await rbacService.checkPermissions('user-id', [
  'content:moderate', 'content:approve'
], { requireAll: false });

// Check context-specific permissions
const canManageClan = await rbacService.checkPermissions('user-id', [
  'clan:manage'
], {
  context: { type: 'clan', id: 'clan-uuid' }
});
```

## Security Features

### Rate Limiting
- **IP-based**: 100 requests per minute per IP
- **User-based**: Configurable limits per authenticated user
- **Endpoint-specific**: Auth endpoints have stricter limits
- **Burst protection**: Prevents rapid successive requests

### Session Security
- **Encryption**: All session data encrypted using AES-256-GCM
- **Rotation**: Session tokens rotate on security events
- **Cleanup**: Automatic cleanup of expired sessions
- **Device tracking**: Monitor and manage user devices

### Account Protection
- **Progressive delays**: Increasing delays after failed attempts
- **Account lockout**: Temporary lockouts after repeated failures
- **Security notifications**: Email/SMS alerts for suspicious activity
- **Audit logging**: Comprehensive logs for security analysis

## Configuration

### Authentication Config
```javascript
const AUTH_CONFIG = {
  // JWT settings
  JWT_SECRET: process.env.JWT_SECRET,
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  
  // Rate limiting
  MAX_ATTEMPTS_PER_IP: 5,
  MAX_ATTEMPTS_PER_WALLET: 3,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  
  // Session settings
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  ACTIVITY_TIMEOUT: 2 * 60 * 60 * 1000, // 2 hours
  
  // Security
  REQUIRE_HTTPS: process.env.NODE_ENV === 'production',
  SECURE_COOKIES: process.env.NODE_ENV === 'production'
};
```

### RBAC Configuration
```javascript
const RBAC_CONFIG = {
  // Cache settings
  CACHE_TTL: 15 * 60, // 15 minutes
  
  // Role levels
  ROLE_LEVELS: {
    'guest': 0,
    'member': 10,
    'moderator': 20,
    'admin': 30,
    'owner': 40,
    'super_admin': 50
  }
};
```

## Testing

### Run All Tests
```bash
npm test
```

### Run Authentication Tests
```bash
npm run test:auth
```

### Run with Coverage
```bash
npm run test:coverage
```

### Example Test
```javascript
import { AuthService } from '../auth-service.js';

describe('AuthService', () => {
  test('should generate valid challenge', async () => {
    const authService = new AuthService();
    const challenge = await authService.generateChallenge(
      '4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM'
    );
    
    expect(challenge.nonce).toBeDefined();
    expect(challenge.message).toContain('MLG.clan Authentication');
    expect(challenge.expiresAt).toBeGreaterThan(Date.now());
  });
});
```

## Performance

### Benchmarks
- **Authentication**: ~50ms average response time
- **Session retrieval**: ~5ms with Redis cache
- **Permission checking**: ~10ms with cache, ~100ms without
- **MFA verification**: ~20ms average

### Optimization Features
- **Redis caching**: Permissions and session data
- **Connection pooling**: Database connection reuse
- **Lazy loading**: Services initialized on demand
- **Batch operations**: Multiple permission checks in single query

### Monitoring
```javascript
// Get system metrics
const metrics = {
  sessions: await sessionManager.getMetrics(),
  rbac: await rbacService.getMetrics(),
  mfa: await mfaService.getMetrics()
};

console.log('Active sessions:', metrics.sessions.activeSessions);
console.log('Cache hit ratio:', metrics.rbac.cacheHitRatio);
console.log('MFA enabled users:', metrics.mfa.enabledUsers);
```

## Deployment

### Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3000

CMD ["npm", "start"]
```

### Environment Variables (Production)
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/mlg_clan
REDIS_URL=redis://prod-redis:6379
JWT_SECRET=your-production-secret-key
SESSION_ENCRYPTION_KEY=your-production-encryption-key
REQUIRE_HTTPS=true
SECURE_COOKIES=true
```

### Security Checklist
- [ ] Use strong JWT secrets (256-bit minimum)
- [ ] Enable HTTPS in production
- [ ] Configure secure session cookies
- [ ] Set up proper CORS policies
- [ ] Enable rate limiting
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerting
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Backup encryption keys securely

## Support

For issues and questions:
- Create an issue in the repository
- Check the comprehensive test suite for usage examples
- Review the example server implementation
- Consult the security documentation

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add comprehensive tests
4. Ensure security compliance
5. Submit a pull request

---

**Built with ❤️ for the MLG.clan gaming community**