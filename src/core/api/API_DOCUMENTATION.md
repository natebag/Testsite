# MLG.clan Platform API Documentation

## Overview

The MLG.clan Platform API is a comprehensive RESTful API built with Node.js and Express.js that powers a gaming platform with Solana blockchain integration. The API supports user authentication via wallet signatures, clan management, content submission and voting, governance proposals, and transaction tracking.

## Table of Contents

- [Quick Start](#quick-start)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [API Endpoints](#api-endpoints)
- [WebSocket Events](#websocket-events)
- [Error Handling](#error-handling)
- [Validation Schemas](#validation-schemas)
- [Database Integration](#database-integration)
- [Deployment](#deployment)

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL or MongoDB
- Redis (optional, for caching and rate limiting)
- Solana RPC endpoint

### Installation

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Start production server
npm start
```

### Environment Variables

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
API_PREFIX=/api

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mlg_clan
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256

# CORS
CORS_ORIGIN=http://localhost:3000

# Solana
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_NETWORK=mainnet-beta
```

## Authentication

The API uses Solana wallet-based authentication with JWT tokens for session management.

### Authentication Flow

1. **Generate Challenge**: Client requests a challenge for wallet signature
2. **Sign Challenge**: Client signs the challenge with their Solana wallet
3. **Verify Signature**: Server verifies the signature and issues JWT tokens
4. **Use Access Token**: Client includes Bearer token in subsequent requests

### Example Authentication

```javascript
// 1. Generate challenge
const challenge = await fetch('/api/auth/challenge', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletAddress: 'YourSolanaWalletAddress',
    walletType: 'phantom'
  })
});

// 2. Sign challenge message with wallet
const { message } = await challenge.json();
const signature = await wallet.signMessage(message);

// 3. Verify signature
const auth = await fetch('/api/auth/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletAddress: 'YourSolanaWalletAddress',
    signature: signature,
    nonce: challenge.nonce
  })
});

// 4. Use access token
const { accessToken } = await auth.json();
const response = await fetch('/api/users/profile', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
```

## Rate Limiting

The API implements multiple rate limiting strategies:

- **Global**: 1000 requests per 15 minutes per IP
- **Authentication**: 10 attempts per 15 minutes per wallet/IP
- **User Operations**: 100 requests per 5 minutes
- **Voting**: 10 votes per minute
- **Content Submission**: 20 submissions per hour
- **Search**: 30 searches per minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

## API Endpoints

### Authentication (`/api/auth/`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/challenge` | Generate authentication challenge | No |
| POST | `/verify` | Verify wallet signature | No |
| POST | `/refresh` | Refresh access token | No |
| POST | `/logout` | Logout and revoke session | Yes |
| GET | `/session` | Get current session info | Yes |
| POST | `/validate` | Validate token | No |
| GET | `/stats` | Get auth statistics | Yes (Admin) |

### Users (`/api/users/`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/profile` | Get current user profile | Yes |
| PUT | `/profile` | Update user profile | Yes |
| GET | `/search` | Search users | No |
| GET | `/leaderboard` | Get user leaderboard | No |
| GET | `/:id/dashboard` | Get user dashboard | Yes (Self/Admin) |
| GET | `/:id/achievements` | Get user achievements | No |
| POST | `/:id/activity` | Update user activity | Yes (Self/Admin) |

### Clans (`/api/clans/`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Create new clan | Yes |
| GET | `/` | List clans with filters | No |
| GET | `/leaderboard` | Get clan leaderboard | No |
| GET | `/:id` | Get clan details | No |
| PUT | `/:id` | Update clan settings | Yes (Admin/Owner) |
| POST | `/:id/join` | Join clan | Yes |
| POST | `/:id/leave` | Leave clan | Yes (Member) |
| POST | `/:id/invite` | Invite member | Yes (Moderator+) |
| POST | `/:id/kick` | Kick member | Yes (Admin+) |
| PUT | `/:id/members/:userId/role` | Update member role | Yes (Admin+) |
| GET | `/:id/stats` | Get clan statistics | No |

### Voting (`/api/voting/`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/votes/purchase` | Purchase votes with MLG tokens | Yes |
| POST | `/votes/cast` | Cast vote on content | Yes |
| GET | `/votes/daily` | Get daily vote status | Yes |
| POST | `/proposals` | Create governance proposal | Yes |
| GET | `/proposals` | List proposals | No |
| GET | `/proposals/:id` | Get proposal details | No |
| POST | `/proposals/:id/vote` | Vote on proposal | Yes |
| GET | `/proposals/:id/results` | Get voting results | No |
| GET | `/trending` | Get trending content | No |

### Content (`/api/content/`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/submit` | Submit new content | Yes |
| GET | `/` | List content with filters | No |
| GET | `/trending` | Get trending content | No |
| GET | `/leaderboard` | Get content leaderboard | No |
| GET | `/:id` | Get content details | No |
| PUT | `/:id` | Update content | Yes (Owner/Admin) |
| DELETE | `/:id` | Delete content | Yes (Owner/Admin) |
| POST | `/:id/vote` | Vote on content | Yes |
| POST | `/:id/moderate` | Moderate content | Yes (Moderator+) |
| POST | `/:id/report` | Report content | Yes |

### Transactions (`/api/transactions/`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get user transactions | Yes |
| GET | `/pending` | Get pending transactions | Yes |
| GET | `/stats` | Get transaction statistics | Yes |
| POST | `/confirm` | Confirm blockchain transaction | Yes |
| GET | `/:signature` | Get transaction by signature | Yes |
| POST | `/:id/cancel` | Cancel pending transaction | Yes (Owner/Admin) |
| POST | `/:id/retry` | Retry failed transaction | Yes (Admin) |

## WebSocket Events

The API supports real-time updates via Socket.IO:

### Connection Events
- `connection` - Client connects
- `authenticate` - Authenticate socket connection
- `join_clan` - Join clan channel
- `leave_clan` - Leave clan channel

### Real-time Events
- `content_submitted` - New content submitted
- `content_voted` - Content received vote
- `clan_member_joined` - Member joined clan
- `clan_member_left` - Member left clan
- `proposal_created` - New governance proposal
- `proposal_vote_cast` - Vote cast on proposal
- `transaction_confirmed` - Transaction confirmed

### Example Socket Usage

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

// Authenticate socket
socket.emit('authenticate', { token: accessToken });

// Join clan channel for real-time updates
socket.emit('join_clan', clanId);

// Listen for real-time events
socket.on('clan_member_joined', (data) => {
  console.log('New member joined:', data);
});

socket.on('content_voted', (data) => {
  console.log('Content received vote:', data);
});
```

## Error Handling

The API uses consistent error response formats:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "message": "Detailed error description",
  "timestamp": "2025-08-11T12:00:00.000Z",
  "details": {
    "field": "field_name",
    "message": "Field-specific error",
    "value": "invalid_value"
  }
}
```

### Error Codes

- `AUTHENTICATION_REQUIRED` (401) - Authentication required
- `INVALID_TOKEN` (401) - Invalid or expired token
- `INSUFFICIENT_PERMISSIONS` (403) - Insufficient permissions
- `RESOURCE_NOT_FOUND` (404) - Resource not found
- `VALIDATION_FAILED` (400) - Request validation failed
- `RATE_LIMITED` (429) - Rate limit exceeded
- `INTERNAL_ERROR` (500) - Internal server error

## Validation Schemas

The API uses Joi for request validation. Key validation rules:

### Solana Address
```javascript
const solanaAddress = Joi.string()
  .pattern(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)
  .required()
  .messages({
    'string.pattern.base': 'Must be a valid Solana wallet address'
  });
```

### Username
```javascript
const username = Joi.string()
  .min(3)
  .max(30)
  .pattern(/^[a-zA-Z0-9_-]+$/)
  .messages({
    'string.pattern.base': 'Username can only contain letters, numbers, underscores, and hyphens'
  });
```

### Clan Slug
```javascript
const clanSlug = Joi.string()
  .min(3)
  .max(50)
  .pattern(/^[a-z0-9-]+$/)
  .messages({
    'string.pattern.base': 'Clan slug can only contain lowercase letters, numbers, and hyphens'
  });
```

## Database Integration

The API supports both PostgreSQL and MongoDB through a repository pattern:

### Repository Structure
- `BaseRepository` - Common repository functionality
- `UserRepository` - User management and authentication
- `ClanRepository` - Clan operations and member management
- `VotingRepository` - Vote purchasing and governance
- `ContentRepository` - Content submission and moderation

### DAO Layer
- `BaseDAO` - Database abstraction layer
- `UserDAO` - User data operations
- `ClanDAO` - Clan data operations
- `VotingDAO` - Voting data operations
- `ContentDAO` - Content data operations
- `TransactionDAO` - Transaction tracking

## Deployment

### Production Checklist

1. **Environment Configuration**
   - Set `NODE_ENV=production`
   - Configure secure JWT secret
   - Set up production database
   - Configure Redis for caching
   - Set proper CORS origins

2. **Security**
   - Enable HTTPS
   - Set secure cookie flags
   - Configure rate limiting
   - Enable security headers (Helmet)
   - Set up monitoring and logging

3. **Performance**
   - Enable compression
   - Configure database connection pooling
   - Set up Redis caching
   - Optimize queries with indexes
   - Monitor response times

4. **Monitoring**
   - Set up application monitoring
   - Configure error tracking
   - Monitor database performance
   - Set up alerts for critical errors

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

### Health Checks

The API includes health check endpoints:

- `GET /api/health` - Basic health check
- `GET /api/status` - Detailed service status with database and Redis connectivity

```json
{
  "api": "ok",
  "database": "ok",
  "redis": "ok",
  "timestamp": "2025-08-11T12:00:00.000Z"
}
```

## Security Considerations

1. **Authentication Security**
   - Challenge-response prevents replay attacks
   - JWT tokens have short expiration times
   - Refresh tokens are HTTP-only cookies
   - Rate limiting on authentication endpoints

2. **Input Validation**
   - All inputs validated with Joi schemas
   - HTML sanitization for text inputs
   - File upload restrictions
   - SQL injection prevention

3. **API Security**
   - CORS properly configured
   - Security headers with Helmet
   - Rate limiting per endpoint type
   - Request size limits

4. **Data Privacy**
   - No sensitive data in logs
   - Wallet addresses partially masked in logs
   - User data access restrictions
   - GDPR compliance considerations

## Performance Optimization

1. **Caching Strategy**
   - Redis caching for frequently accessed data
   - In-memory caching for static data
   - CDN for static assets
   - Database query result caching

2. **Database Optimization**
   - Proper indexing on query fields
   - Connection pooling
   - Query optimization
   - Pagination for large datasets

3. **API Optimization**
   - Compression middleware
   - Response streaming for large data
   - Batch operations where appropriate
   - Efficient serialization

## Testing

The API includes comprehensive testing:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Categories
- Unit tests for individual components
- Integration tests for API endpoints
- Authentication flow tests
- Database operation tests
- Real-time event tests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Follow coding standards
6. Submit a pull request

## License

MIT License - See LICENSE file for details.

---

For additional support or questions, please refer to the GitHub repository or contact the development team.