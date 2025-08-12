# MLG.clan Security System Integration Guide

This document provides comprehensive guidance for integrating and using the MLG.clan platform security systems.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Security Components](#security-components)
3. [Integration Examples](#integration-examples)
4. [Configuration](#configuration)
5. [Monitoring and Alerts](#monitoring-and-alerts)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

## Quick Start

### Installation and Setup

1. **Install Required Dependencies**
```bash
npm install express-rate-limit rate-limit-redis redis helmet joi winston
npm install isomorphic-dompurify validator tweetnacl bs58
```

2. **Environment Variables**
```bash
# Security Configuration
JWT_ACCESS_SECRET=your-super-secure-access-secret
JWT_REFRESH_SECRET=your-super-secure-refresh-secret
SESSION_ENCRYPTION_KEY=your-32-byte-encryption-key
RATE_LIMIT_SALT=your-rate-limit-salt
LOG_SALT=your-logging-salt

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_AUTH_TOKEN=your-redis-auth-token
REDIS_TLS_ENABLED=false

# Security Features
ENABLE_THREAT_DETECTION=true
ENABLE_EMERGENCY_LOCKDOWN=true
ENABLE_REALTIME_STORAGE=true
```

3. **Basic Integration**
```javascript
import express from 'express';
import { rateLimiters } from './security/rateLimiter.js';
import { inputValidationMiddleware } from './security/middleware/inputValidator.js';
import { enhancedAuthMiddleware } from './security/auth/enhancedAuth.js';
import { requestLoggingMiddleware } from './security/monitoring/requestLogger.js';

const app = express();

// Apply security middleware
app.use(requestLoggingMiddleware);
app.use(rateLimiters.global);
app.use(inputValidationMiddleware());
app.use(enhancedAuthMiddleware);
```

## Security Components

### 1. Rate Limiting System

**Location:** `src/security/rateLimiter.js`

**Features:**
- Multi-tier rate limiting (Basic, Premium, VIP, Admin)
- Wallet-based and IP-based limiting
- Gaming-specific limits
- Emergency mode activation

**Usage:**
```javascript
import { rateLimiters } from '../security/rateLimiter.js';

// Apply global rate limiting
app.use(rateLimiters.global);

// Gaming-specific rate limiters
app.post('/api/voting/vote', rateLimiters.voting, voteController);
app.post('/api/clan/invite', rateLimiters.clan, clanController);
app.post('/api/token/burn', rateLimiters.mlgBurn, tokenController);
```

### 2. Input Validation and Security

**Location:** `src/security/middleware/inputValidator.js`

**Features:**
- SQL/NoSQL injection prevention
- XSS protection
- Gaming-specific validation
- File upload security

**Usage:**
```javascript
import { gamingValidationMiddleware } from '../security/middleware/inputValidator.js';

// Gaming-specific validation
app.post('/api/user/register', gamingValidationMiddleware.username, userController);
app.post('/api/clan/create', gamingValidationMiddleware.clan, clanController);
app.post('/api/voting/vote', gamingValidationMiddleware.voting, voteController);
```

### 3. Enhanced Authentication

**Location:** `src/security/auth/enhancedAuth.js`

**Features:**
- JWT hardening with refresh tokens
- Phantom wallet signature validation
- Brute force protection
- Device fingerprinting

**Usage:**
```javascript
import { enhancedAuthMiddleware, walletAuthMiddleware } from '../security/auth/enhancedAuth.js';

// Enhanced JWT authentication
app.use('/api/protected', enhancedAuthMiddleware);

// Wallet-based authentication
app.post('/api/auth/wallet', walletAuthMiddleware, authController);
```

### 4. Gaming-Specific Security

#### Vote Protection
**Location:** `src/security/gaming/voteProtection.js`

```javascript
import { voteProtectionMiddleware } from '../security/gaming/voteProtection.js';

app.post('/api/voting/vote', 
  enhancedAuthMiddleware,
  voteProtectionMiddleware,
  voteController
);
```

#### Clan Security
**Location:** `src/security/gaming/clanSecurity.js`

```javascript
import { 
  clanInvitationSecurityMiddleware,
  clanRoleSecurityMiddleware 
} from '../security/gaming/clanSecurity.js';

app.post('/api/clan/invite', clanInvitationSecurityMiddleware, clanController);
app.put('/api/clan/role', clanRoleSecurityMiddleware, clanController);
```

### 5. Threat Detection

**Location:** `src/security/detection/threatDetector.js`

**Features:**
- AI-powered anomaly detection
- Real-time threat analysis
- Automated response

**Usage:**
```javascript
import { threatDetectionMiddleware } from '../security/detection/threatDetector.js';

// Apply to all routes for threat detection
app.use(threatDetectionMiddleware);
```

### 6. Emergency Lockdown

**Location:** `src/security/emergency/lockdownSystem.js`

**Features:**
- Multi-level lockdown procedures
- Automated threat response
- Recovery protocols

**Usage:**
```javascript
import { emergencyLockdownMiddleware } from '../security/emergency/lockdownSystem.js';

// Apply emergency lockdown checks
app.use(emergencyLockdownMiddleware);
```

## Integration Examples

### Complete API Endpoint Protection

```javascript
import express from 'express';
import { 
  rateLimiters,
  enhancedAuthMiddleware,
  inputValidationMiddleware,
  voteProtectionMiddleware,
  threatDetectionMiddleware,
  emergencyLockdownMiddleware,
  requestLoggingMiddleware
} from './security/index.js';

const app = express();

// Global security middleware (applied to all routes)
app.use(requestLoggingMiddleware);
app.use(emergencyLockdownMiddleware);
app.use(threatDetectionMiddleware);
app.use(rateLimiters.global);

// Vote endpoint with comprehensive protection
app.post('/api/voting/vote',
  rateLimiters.voting,                    // Gaming-specific rate limiting
  enhancedAuthMiddleware,                 // JWT + wallet authentication
  inputValidationMiddleware(voteSchema),  // Input validation
  voteProtectionMiddleware,               // Vote manipulation detection
  async (req, res) => {
    try {
      // Process vote with security context
      const result = await processVote(req.body, req.user, req.voteAnalysis);
      
      // Log successful vote
      req.logGamingEvent('Vote processed', {
        contentId: req.body.contentId,
        voteType: req.body.voteType,
        securityScore: req.voteAnalysis.riskScore
      });
      
      res.json({ success: true, result });
    } catch (error) {
      req.logSecurityEvent('error', 'Vote processing failed', { error: error.message });
      res.status(500).json({ error: 'Vote processing failed' });
    }
  }
);
```

### Wallet Authentication Flow

```javascript
// Generate nonce for wallet authentication
app.post('/api/auth/wallet/nonce', 
  rateLimiters.auth,
  generateWalletNonce
);

// Validate wallet signature and authenticate
app.post('/api/auth/wallet/verify',
  rateLimiters.auth,
  walletAuthMiddleware,
  async (req, res) => {
    try {
      // Create user session with wallet verification
      const user = await authenticateWallet(req.wallet.address);
      const tokens = generateTokens(user, req);
      
      res.json({
        success: true,
        tokens,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          roles: user.roles
        }
      });
    } catch (error) {
      req.logSecurityEvent('warning', 'Wallet authentication failed', {
        walletAddress: req.wallet?.address,
        error: error.message
      });
      res.status(401).json({ error: 'Authentication failed' });
    }
  }
);
```

### Clan Management with Security

```javascript
// Clan invitation with security checks
app.post('/api/clan/invite',
  rateLimiters.clan,
  enhancedAuthMiddleware,
  inputValidationMiddleware(clanInviteSchema),
  clanInvitationSecurityMiddleware,
  async (req, res) => {
    try {
      const result = await inviteUserToClan(
        req.user.id,
        req.body.inviteeId,
        req.body.clanId,
        req.invitationAnalysis
      );
      
      req.logGamingEvent('Clan invitation sent', {
        clanId: req.body.clanId,
        inviteeId: req.body.inviteeId,
        securityScore: req.invitationAnalysis.riskScore
      });
      
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
```

## Configuration

### Rate Limiting Configuration

```javascript
// Custom rate limiting tiers
const customRateLimits = {
  CUSTOM_TIER: {
    GLOBAL: { windowMs: 15 * 60 * 1000, max: 2000 },
    VOTING: { windowMs: 60 * 1000, max: 20 },
    CONTENT: { windowMs: 60 * 60 * 1000, max: 100 }
  }
};

// Apply custom configuration
rateLimiters.customTier = createTieredRateLimiter('custom', customRateLimits);
```

### Security Headers Configuration

```javascript
import { securityHeadersMiddleware, web3SecurityHeaders } from '../security/middleware/securityHeaders.js';

app.use(securityHeadersMiddleware);
app.use(web3SecurityHeaders); // For Web3/Phantom wallet support
```

### Threat Detection Tuning

```javascript
import { getThreatDetectionEngine } from '../security/detection/threatDetector.js';

// Adjust threat detection sensitivity
const threatEngine = getThreatDetectionEngine();
threatEngine.updateThresholds({
  ANOMALY_SCORE: 0.8,        // Higher threshold = less sensitive
  BEHAVIOR_DEVIATION: 0.9,   // Higher threshold = less sensitive
  THREAT_SCORE: 60          // Lower threshold = more aggressive blocking
});
```

## Monitoring and Alerts

### Security Dashboard Endpoints

```javascript
// Get security statistics (admin only)
app.get('/api/admin/security/stats', 
  enhancedAuthMiddleware,
  requireRole('admin'),
  getMonitoringStats
);

// Get threat detection statistics
app.get('/api/admin/security/threats',
  enhancedAuthMiddleware,
  requireRole('admin'),
  getThreatStatistics
);

// Get emergency lockdown status
app.get('/api/admin/security/emergency',
  enhancedAuthMiddleware,
  requireRole('admin'),
  getEmergencyStatus
);
```

### Custom Alerts Setup

```javascript
import { getSecurityLogger } from '../security/monitoring/requestLogger.js';

const logger = getSecurityLogger();

// Custom alert for high-value transactions
app.post('/api/token/transfer', async (req, res) => {
  if (req.body.amount > 10000) { // High-value transfer
    logger.logSecurityEvent('alert', 'High-value token transfer detected', {
      amount: req.body.amount,
      userId: req.user.id,
      walletAddress: req.user.walletAddress
    });
  }
  
  // Process transfer...
});
```

### Performance Monitoring

```javascript
// Monitor security middleware performance
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    if (duration > 5000) { // Slow response
      req.logSecurityEvent('warning', 'Slow security processing detected', {
        duration,
        path: req.path,
        securityMiddleware: req.securityContext
      });
    }
  });
  
  next();
});
```

## Testing

### Security Testing Suite

```javascript
import { runSecurityPerformanceTests } from '../security/testing/securityPerformanceTest.js';

// Run comprehensive security tests
async function runSecurityTests() {
  console.log('Running security performance tests...');
  
  const results = await runSecurityPerformanceTests();
  
  console.log('Security Test Results:');
  console.log(`Overall Grade: ${results.overallGrade}`);
  console.log(`Critical Issues: ${results.criticalIssues.length}`);
  console.log(`Recommendations: ${results.recommendations.length}`);
  
  return results;
}

// Example usage
if (process.env.NODE_ENV === 'test') {
  runSecurityTests();
}
```

### Unit Testing Security Components

```javascript
import request from 'supertest';
import { app } from '../app.js';

describe('Security Middleware Tests', () => {
  test('Rate limiting blocks excessive requests', async () => {
    // Send requests above limit
    for (let i = 0; i < 20; i++) {
      await request(app).get('/api/test');
    }
    
    // Next request should be rate limited
    const response = await request(app).get('/api/test');
    expect(response.status).toBe(429);
    expect(response.body.code).toBe('RATE_LIMITED');
  });
  
  test('Input validation blocks malicious input', async () => {
    const maliciousInput = {
      username: '<script>alert("xss")</script>',
      content: 'DROP TABLE users;'
    };
    
    const response = await request(app)
      .post('/api/content/create')
      .send(maliciousInput);
      
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('DANGEROUS_INPUT_DETECTED');
  });
});
```

## Troubleshooting

### Common Issues

#### High Memory Usage in Threat Detection

**Problem:** Threat detection system using too much memory

**Solution:**
```javascript
import { getThreatDetectionEngine } from '../security/detection/threatDetector.js';

const threatEngine = getThreatDetectionEngine();

// Reduce memory usage
threatEngine.updateConfig({
  MAX_USER_PROFILES: 1000,     // Reduce from default 10000
  CLEANUP_INTERVAL: 30000,     // More frequent cleanup
  MAX_HISTORY_LENGTH: 50       // Reduce history per user
});
```

#### Rate Limiting Too Aggressive

**Problem:** Legitimate users being rate limited

**Solution:**
```javascript
// Adjust rate limits for specific user tiers
import { rateLimiters } from '../security/rateLimiter.js';

// Create more lenient rate limiter
const lenientRateLimit = createTieredRateLimiter('voting', {
  BASIC: { windowMs: 60 * 1000, max: 10 },    // Increased from 5
  PREMIUM: { windowMs: 60 * 1000, max: 25 },  // Increased from 15
});
```

#### Emergency Lockdown False Positives

**Problem:** Emergency lockdown activating unnecessarily

**Solution:**
```javascript
import { getEmergencyLockdownSystem } from '../security/emergency/lockdownSystem.js';

const lockdownSystem = getEmergencyLockdownSystem();

// Adjust thresholds
lockdownSystem.updateTriggers({
  DDOS_DETECTION: {
    REQUESTS_PER_SECOND: 2000,    // Increased from 1000
    ERROR_RATE_THRESHOLD: 0.7     // Increased from 0.5
  }
});
```

### Debug Mode

Enable debug logging for troubleshooting:

```javascript
// Enable debug logging
process.env.DEBUG_SECURITY = 'true';
process.env.LOG_LEVEL = 'debug';

// This will provide detailed logs for all security operations
```

### Performance Debugging

```javascript
// Add performance monitoring
app.use((req, res, next) => {
  req.securityTiming = {};
  
  const originalNext = next;
  next = (err) => {
    console.log('Security timing:', req.securityTiming);
    originalNext(err);
  };
  
  next();
});
```

## Security Best Practices

1. **Regular Updates:** Keep security thresholds updated based on platform usage patterns
2. **Monitor Logs:** Regularly review security logs for patterns and anomalies
3. **Test Regularly:** Run security tests after any major changes
4. **Backup Configurations:** Keep security configurations in version control
5. **Document Changes:** Document any security configuration changes
6. **Monitor Performance:** Keep track of security middleware performance impact

## Support and Maintenance

- **Log Location:** `/logs/security.log`
- **Metrics Dashboard:** `/api/admin/security/stats`
- **Emergency Controls:** `/api/admin/security/emergency`
- **Configuration Files:** `src/security/`

For additional support or questions about the security implementation, refer to the comprehensive audit report or contact the security team.

---

*This guide is maintained by the MLG.clan security team and should be updated as new security features are implemented.*