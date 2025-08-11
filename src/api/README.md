# MLG.clan Content Storage and Retrieval API

## Overview

This directory contains the comprehensive API contracts, documentation, and testing resources for the MLG.clan gaming platform's content storage and retrieval system. The API supports video clips, screenshots, guides, reviews, and integrates with the MLG token voting system on the Solana blockchain.

## Architecture

The API is designed as a scalable, production-ready system with the following key features:

- **Content Management**: Full CRUD operations for gaming content
- **MLG Token Integration**: Blockchain-based voting system with Solana wallet verification
- **Advanced Search**: AI-powered content discovery and filtering
- **Content Moderation**: Community-driven reporting and moderation tools
- **Real-time Analytics**: Comprehensive metrics and insights
- **Scalable File Handling**: Chunked uploads and CDN integration

## Files Structure

```
src/api/
├── content-api.contracts.js          # Main API contracts and mock implementation
├── content-api-openapi.yaml          # OpenAPI 3.0 specification
├── content-api.test.js               # Comprehensive test suite
├── MLG-Content-API.postman_collection.json  # Postman collection for testing
└── README.md                         # This documentation file
```

## Quick Start

### 1. API Contracts

The main API contracts are defined in `content-api.contracts.js`:

```javascript
import { ContentAPIClient, CONTENT_API_CONFIG } from './content-api.contracts.js';

// Initialize API client
const apiClient = new ContentAPIClient({
  API_BASE_URL: 'https://api.mlg.clan/v1'
});

// Create content
const contentData = {
  metadata: {
    title: 'Epic Fortnite Victory',
    description: 'Amazing clutch play',
    contentType: 'video_clip',
    game: 'Fortnite',
    platform: 'pc',
    category: 'highlights',
    tags: ['fortnite', 'victory', 'clutch']
  },
  files: [/* file objects */]
};

const response = await apiClient.createContent(contentData);
```

### 2. Testing

Run the comprehensive test suite:

```bash
# Install dependencies
npm install

# Run tests
npm test src/api/content-api.test.js

# Run specific test suites
npm test -- --grep "Content CRUD"
npm test -- --grep "MLG Token Voting"
```

### 3. API Documentation

View the OpenAPI specification:
- **File**: `content-api-openapi.yaml`
- **Online Viewer**: Upload to [Swagger Editor](https://editor.swagger.io/)
- **Local Docs**: Use tools like Redoc or Swagger UI

### 4. Postman Collection

Import the Postman collection for interactive testing:
1. Open Postman
2. Import `MLG-Content-API.postman_collection.json`
3. Set environment variables:
   - `baseUrl`: Your API base URL
   - `authToken`: Your JWT token
   - `walletAddress`: Your Solana wallet address

## Core Features

### Content Management

#### Create Content
- **Endpoint**: `POST /api/v1/content`
- **Features**: File validation, metadata processing, thumbnail generation
- **File Types**: Video clips, images, documents, audio
- **Max Size**: 500MB per file, 1GB total per upload

#### Content Filtering & Search
- **Endpoint**: `GET /api/v1/content`
- **Filters**: Game, platform, category, user, tags, status, quality score
- **Search**: Full-text search with fuzzy matching and semantic search
- **Pagination**: Cursor-based and offset-based pagination

### MLG Token Voting System

#### Vote Types & Costs
- **Upvote**: 1 MLG token
- **Downvote**: 2 MLG tokens  
- **Super Vote**: 5 MLG tokens

#### Blockchain Integration
- **Network**: Solana
- **Contract**: `7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL`
- **Verification**: Wallet signature + transaction signature
- **Security**: Anti-spam measures and duplicate vote prevention

#### Vote Submission
```javascript
const voteData = {
  voteType: 'upvote',
  tokenAmount: 1,
  transactionSignature: 'solana-tx-signature',
  walletSignature: {
    signature: 'wallet-signature',
    message: 'MLG.clan Vote Verification',
    publicKey: 'wallet-public-key'
  }
};

await apiClient.submitVote(contentId, voteData);
```

### Content Discovery

#### Trending Algorithm
Trending score calculation considers:
- View velocity and engagement rate
- MLG token voting activity
- Content quality score
- Recency factor
- Community interaction (comments, shares)

#### Search Features
- **Full-text search**: Title, description, tags
- **Faceted search**: Filter by multiple criteria
- **AI-powered**: Semantic search for better relevance
- **Typo tolerance**: Fuzzy matching for user queries
- **Autocomplete**: Search suggestions and query completion

### Analytics & Metrics

#### Content Analytics
- View counts (total, unique)
- Watch time and completion rates
- Geographic distribution
- Device and platform breakdown
- Traffic source analysis
- Engagement metrics

#### User Statistics
- Content creation metrics
- Token earnings and spending
- Vote activity (given and received)
- Quality scores and achievements
- Content performance across games

## Authentication & Security

### JWT Authentication
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Wallet Signature Verification
```http
X-Wallet-Address: 7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL
X-Wallet-Signature: signature:message:publicKey
```

### Rate Limiting
- **Content Upload**: 5 per hour
- **Voting**: 50 per minute
- **Search**: 100 per minute
- **General API**: 1000 per hour

### Security Measures
- Input sanitization and validation
- SQL injection prevention
- XSS protection
- CSRF tokens for state-changing operations
- Wallet signature verification for blockchain operations

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "details": {
    "field": "specific error details"
  },
  "meta": {
    "timestamp": "2024-01-01T12:00:00Z",
    "requestId": "req-uuid",
    "version": "1.0.0"
  }
}
```

### Error Codes
- **AUTH_001**: Invalid or expired JWT token
- **AUTH_002**: Wallet signature verification failed
- **CONTENT_001**: Content not found
- **VOTE_001**: Insufficient MLG tokens
- **VOTE_002**: Already voted on this content
- **FILE_001**: File too large
- **RATE_001**: Too many requests

## Performance & Scalability

### Caching Strategy
- **Content List**: 5-minute cache with smart invalidation
- **Individual Content**: 10-minute cache
- **Search Results**: 3-minute cache
- **Analytics**: 30-minute cache for heavy computations

### Database Optimization
- Proper indexing on search and filter fields
- Connection pooling (5-50 connections)
- Read replicas for analytics queries
- Partitioning for large tables (content, votes, analytics)

### CDN Integration
- **Base URL**: `https://cdn.mlg.clan`
- **Thumbnails**: `https://thumbnails.mlg.clan`
- **Global Distribution**: Multi-region CDN
- **Caching**: 1-year cache for static assets

### File Processing
- **Concurrent Jobs**: 10 simultaneous video processing jobs
- **Timeout**: 10 minutes for video processing
- **Quality Options**: 360p, 720p, 1080p, 4K
- **Formats**: MP4, WebM for broad compatibility

## Development Setup

### Mock Implementation
```javascript
import { ContentAPIClient } from './content-api.contracts.js';

// Initialize with mock data
const apiClient = new ContentAPIClient({ MOCK_MODE: true });

// All endpoints return realistic mock responses
const response = await apiClient.getContentList();
console.log(response.data.content); // Mock content array
```

### Environment Variables
```env
API_BASE_URL=https://api.mlg.clan/v1
MLG_TOKEN_CONTRACT=7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL
JWT_SECRET=your-jwt-secret
DATABASE_URL=your-database-url
REDIS_URL=your-redis-url
CDN_BASE_URL=https://cdn.mlg.clan
```

### Local Development
```bash
# Start local API server
npm run dev:api

# Run tests in watch mode
npm run test:watch

# Generate API documentation
npm run docs:generate

# Validate OpenAPI spec
npm run validate:openapi
```

## Integration Examples

### Frontend Integration
```javascript
// React hook for content fetching
const useContent = (filters) => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      const response = await apiClient.getContentList(filters);
      setContent(response.data.content);
      setLoading(false);
    };
    
    fetchContent();
  }, [filters]);
  
  return { content, loading };
};
```

### Backend Integration
```javascript
// Express.js route handler
app.post('/api/v1/content', async (req, res) => {
  try {
    // Validate authentication
    const user = await validateJWT(req.headers.authorization);
    
    // Validate wallet signature
    const walletValid = await validateWalletSignature(
      req.headers['x-wallet-signature'],
      req.headers['x-wallet-address']
    );
    
    if (!walletValid) {
      return res.status(401).json({
        success: false,
        error: 'AUTH_002',
        message: 'Wallet signature verification failed'
      });
    }
    
    // Process content creation
    const contentData = { ...req.body, userId: user.id };
    const response = await apiClient.createContent(contentData);
    
    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'SYSTEM_001',
      message: 'Internal server error'
    });
  }
});
```

### Solana Integration
```javascript
// Vote submission with Solana transaction
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createBurnInstruction } from '@solana/spl-token';

const submitVoteWithToken = async (contentId, voteType, tokenAmount) => {
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const wallet = getWallet(); // Your wallet implementation
  
  // Create burn transaction
  const mintAddress = new PublicKey(CONTENT_API_CONFIG.MLG_TOKEN.CONTRACT_ADDRESS);
  const tokenAccount = await getAssociatedTokenAddress(mintAddress, wallet.publicKey);
  
  const burnInstruction = createBurnInstruction(
    tokenAccount,
    mintAddress,
    wallet.publicKey,
    tokenAmount * Math.pow(10, 9) // Convert to token decimals
  );
  
  const transaction = new Transaction().add(burnInstruction);
  const signature = await wallet.sendTransaction(transaction, connection);
  
  // Wait for confirmation
  await connection.confirmTransaction(signature);
  
  // Submit vote to API
  const voteData = {
    voteType,
    tokenAmount,
    transactionSignature: signature,
    walletSignature: await signMessage(wallet, 'MLG.clan Vote Verification')
  };
  
  return await apiClient.submitVote(contentId, voteData);
};
```

## Testing

### Test Coverage
- **Unit Tests**: Individual function and component testing
- **Integration Tests**: API endpoint testing with database
- **Load Tests**: Performance testing under high load
- **Security Tests**: Authentication, authorization, input validation
- **E2E Tests**: Complete user workflows

### Test Data
```javascript
// Generate test content
const testContent = APITestUtils.generateMockContent({
  title: 'Test Content',
  game: 'Fortnite',
  contentType: 'video_clip'
});

// Generate test vote
const testVote = APITestUtils.generateMockVote({
  voteType: 'upvote',
  tokenAmount: 1
});

// Validate response
expect(APITestUtils.validateResponse(response, expectedSchema)).toBe(true);
```

### Performance Benchmarks
- **Content List**: <100ms for 20 items
- **Content Search**: <200ms with filters
- **Vote Submission**: <500ms including blockchain verification
- **File Upload**: 1MB/s minimum throughput
- **Analytics**: <1s for complex queries

## Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] CDN endpoints configured
- [ ] Rate limiting rules applied
- [ ] Monitoring and alerting setup
- [ ] SSL certificates installed
- [ ] Backup procedures tested
- [ ] Load balancer configured
- [ ] Health checks implemented

### Monitoring
- **API Response Times**: <1s average
- **Error Rates**: <1% for 2xx responses
- **Database Performance**: Query time monitoring
- **File Upload Success**: >99% success rate
- **Token Transaction Success**: >95% (allowing for blockchain issues)

## Contributing

### Code Standards
- Follow existing code style and patterns
- Add comprehensive tests for new features
- Update API documentation for changes
- Validate OpenAPI specification
- Test against Postman collection

### API Design Principles
1. **Consistent**: Follow established patterns
2. **Secure**: Authentication and validation first
3. **Performant**: Cache and optimize by default
4. **Documented**: Clear, comprehensive documentation
5. **Tested**: High test coverage and quality

## Support

For API support and questions:
- **Documentation**: This README and OpenAPI spec
- **Issues**: Create GitHub issues for bugs
- **Testing**: Use Postman collection for manual testing
- **Development**: Check test suite for examples

## License

This API implementation is part of the MLG.clan platform and follows the project's overall licensing terms.