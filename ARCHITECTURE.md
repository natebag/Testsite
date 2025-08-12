# MLG.clan Platform Architecture Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [System Components](#system-components)
4. [Data Flow Architecture](#data-flow-architecture)
5. [State Management](#state-management)
6. [API Architecture](#api-architecture)
7. [Frontend Architecture](#frontend-architecture)
8. [Mobile Architecture](#mobile-architecture)
9. [Database Architecture](#database-architecture)
10. [Security Architecture](#security-architecture)
11. [Build System](#build-system)
12. [Deployment Architecture](#deployment-architecture)
13. [Developer Onboarding](#developer-onboarding)
14. [Code Organization](#code-organization)
15. [Component Dependencies](#component-dependencies)

---

## System Overview

The MLG.clan platform is a comprehensive gaming ecosystem that combines traditional web technologies with blockchain integration (Solana), providing a multi-platform experience across web and mobile applications.

### Core Features
- **Clan Management**: Hierarchical clan systems with roles and permissions
- **Voting & Governance**: Blockchain-based voting using SPL MLG tokens
- **Content Management**: User-generated content with moderation systems
- **Wallet Integration**: Phantom wallet integration for Solana blockchain operations
- **Real-time Features**: WebSocket-based real-time updates and notifications
- **Cross-platform**: Web application with React Native mobile companion

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES6+), React (for components), Vite (build)
- **Mobile**: React Native with TypeScript, Redux Toolkit
- **Backend**: Node.js, Express.js, Socket.IO
- **Database**: PostgreSQL (primary), MongoDB (flexible data), Redis (caching)
- **Blockchain**: Solana, SPL Tokens, Phantom Wallet
- **Build Tools**: Vite, TypeScript, Jest, Puppeteer

---

## Architecture Principles

### 1. Modular Architecture
- **Feature-based modules**: Each major feature (voting, clans, content) is self-contained
- **Shared utilities**: Common functionality centralized in shared modules
- **Clean separation**: Clear boundaries between core, features, and shared components

### 2. Progressive Enhancement
- **Graceful degradation**: Core functionality works without advanced features
- **Offline capability**: Service workers and local storage for offline functionality
- **Performance first**: Bundle splitting and lazy loading for optimal performance

### 3. Security by Design
- **Zero trust**: All inputs validated, all connections authenticated
- **Defense in depth**: Multiple layers of security controls
- **Least privilege**: Minimal permissions for all system components

### 4. Scalability Patterns
- **Horizontal scaling**: Stateless services for easy scaling
- **Caching layers**: Multi-level caching strategy
- **Microservice ready**: Modular design supports future service extraction

---

## System Components

### Core Infrastructure
```
┌─────────────────────────────────────────────────────────┐
│                   MLG.clan Platform                      │
├─────────────────────────────────────────────────────────┤
│  Web Frontend  │  Mobile App   │  API Gateway  │  WS    │
│  (Vite/React)  │ (React Native)│  (Express.js) │(Socket)│
├─────────────────────────────────────────────────────────┤
│           Core Services Layer                           │
│  Auth Service  │ Clan Service  │ Vote Service  │Content │
├─────────────────────────────────────────────────────────┤
│              Data Layer                                 │
│  PostgreSQL   │   MongoDB     │    Redis      │ Solana │
│  (Relational) │  (Flexible)   │  (Caching)    │(Tokens)│
└─────────────────────────────────────────────────────────┘
```

### Application Layers

#### 1. Presentation Layer
- **Web Frontend**: Modern JavaScript with React components
- **Mobile App**: React Native with native performance optimizations
- **UI Components**: Shared design system with Xbox-inspired aesthetics

#### 2. Business Logic Layer
- **Core Services**: Authentication, clan management, voting systems
- **Feature Modules**: Self-contained feature implementations
- **Integration Services**: Blockchain and external API integrations

#### 3. Data Access Layer
- **Repository Pattern**: Abstracted data access with caching
- **DAO Pattern**: Direct database operations with optimization
- **Cache Management**: Multi-level caching with invalidation strategies

#### 4. Infrastructure Layer
- **Database**: Multi-database approach for different data types
- **Message Queue**: Redis for real-time communications
- **Blockchain**: Solana integration for token operations

---

## Data Flow Architecture

### Request/Response Flow
```
User Action (Web/Mobile)
       ↓
State Management (Redux/Context)
       ↓
API Client (HTTP/WebSocket)
       ↓
API Gateway (Express.js)
       ↓
Business Logic (Services)
       ↓
Data Layer (Repository/DAO)
       ↓
Database (PostgreSQL/MongoDB/Redis)
```

### Real-time Data Flow
```
Database Change
       ↓
Change Detection (Triggers/Events)
       ↓
Event Publisher (Node.js)
       ↓
WebSocket Manager (Socket.IO)
       ↓
Client State Update (Real-time)
       ↓
UI Re-render (React/DOM)
```

### Blockchain Integration Flow
```
User Transaction Intent
       ↓
Wallet Connection (Phantom)
       ↓
Transaction Building (Solana Web3.js)
       ↓
User Signature (Wallet)
       ↓
Blockchain Submission (Solana Network)
       ↓
Confirmation & State Update
```

---

## State Management

### Frontend State Architecture

#### Web Application State
```javascript
// Global State Structure
{
  user: {
    profile: UserProfile,
    preferences: UserPreferences,
    authentication: AuthState
  },
  wallet: {
    connected: boolean,
    address: string,
    balance: TokenBalance,
    transactions: Transaction[]
  },
  voting: {
    activeVotes: ActiveVote[],
    voteHistory: VoteHistory[],
    statistics: VotingStats
  },
  clans: {
    userClans: Clan[],
    currentClan: Clan | null,
    invitations: ClanInvitation[]
  },
  ui: {
    modals: ModalState,
    notifications: Notification[],
    loading: LoadingState
  }
}
```

#### State Management Pattern
- **Context API**: React Context for global state management
- **Local State**: useState and useReducer for component-specific state
- **Persistent State**: localStorage for user preferences and cache
- **Server State**: React Query pattern for server data synchronization

#### Mobile State Architecture
- **Redux Toolkit**: Centralized state management with RTK
- **Redux Persist**: Automatic state persistence
- **Async Thunks**: Asynchronous action creators for API calls
- **Normalized State**: Entity-based state structure for performance

---

## API Architecture

### RESTful API Design
```
/api/v1/
├── /auth
│   ├── POST /register
│   ├── POST /login
│   ├── POST /logout
│   └── POST /refresh
├── /users
│   ├── GET /profile
│   ├── PUT /profile
│   └── GET /statistics
├── /clans
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   ├── PUT /:id
│   ├── DELETE /:id
│   ├── POST /:id/join
│   ├── POST /:id/leave
│   └── GET /:id/members
├── /voting
│   ├── GET /active
│   ├── POST /vote
│   ├── GET /history
│   └── GET /statistics
├── /content
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   ├── PUT /:id
│   └── DELETE /:id
└── /transactions
    ├── GET /
    ├── POST /validate
    └── GET /:signature
```

### API Security Features
- **JWT Authentication**: Stateless authentication with refresh tokens
- **Rate Limiting**: Per-endpoint and global rate limiting
- **Input Validation**: Comprehensive request validation using Joi
- **CORS Configuration**: Flexible CORS setup for multi-domain access
- **Request Signing**: Optional request signing for sensitive operations

### WebSocket Architecture
```javascript
// Real-time Event Categories
const SOCKET_EVENTS = {
  SYSTEM: 'system:*',
  USER: 'user:*',
  CLAN: 'clan:*',
  VOTING: 'voting:*',
  CONTENT: 'content:*'
};

// Event Broadcasting Pattern
io.to(`clan:${clanId}`).emit('clan:member_joined', memberData);
io.to(`user:${userId}`).emit('user:notification', notification);
```

---

## Frontend Architecture

### Component Architecture
```
src/
├── main.js                 # Application entry point
├── shared/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # Base UI components (Button, Input, Modal)
│   │   ├── gaming/        # Gaming-specific components
│   │   └── wallet/        # Wallet-related components
│   ├── utils/             # Shared utilities
│   │   ├── api/           # API client utilities
│   │   ├── wallet/        # Wallet integration utilities
│   │   ├── state/         # State management utilities
│   │   ├── cache/         # Caching utilities
│   │   └── error/         # Error handling utilities
│   └── router/            # Client-side routing
├── features/              # Feature-specific modules
│   ├── voting/            # Voting system
│   ├── clans/             # Clan management
│   ├── content/           # Content management
│   ├── wallet/            # Wallet integration
│   └── tokens/            # Token operations
├── core/                  # Core platform services
│   ├── auth/              # Authentication system
│   ├── api/               # Backend API services
│   ├── websocket/         # Real-time communications
│   ├── security/          # Security services
│   └── cache/             # Caching layer
├── styles/                # Global styles and themes
└── types/                 # TypeScript definitions
```

### Component Design Patterns

#### 1. Compound Components
```javascript
// Example: Modal compound component
<Modal isOpen={isOpen} onClose={onClose}>
  <Modal.Header>
    <Modal.Title>Confirm Vote</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <VoteConfirmation vote={vote} />
  </Modal.Body>
  <Modal.Footer>
    <Modal.Actions>
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={onConfirm}>Confirm</Button>
    </Modal.Actions>
  </Modal.Footer>
</Modal>
```

#### 2. Render Props Pattern
```javascript
// Example: Wallet connection render prop
<WalletProvider>
  {({ connected, connect, disconnect, balance }) => (
    <WalletInfo 
      connected={connected}
      balance={balance}
      onConnect={connect}
      onDisconnect={disconnect}
    />
  )}
</WalletProvider>
```

#### 3. Custom Hooks Pattern
```javascript
// Example: useWallet hook
const useWallet = () => {
  const [state, setState] = useContext(WalletContext);
  
  return {
    connected: state.connected,
    address: state.address,
    balance: state.balance,
    connect: useCallback(() => connectWallet(setState), [setState]),
    disconnect: useCallback(() => disconnectWallet(setState), [setState])
  };
};
```

### Performance Optimizations

#### 1. Code Splitting
```javascript
// Route-based code splitting
const VotingPage = lazy(() => import('@features/voting/VotingPage'));
const ClansPage = lazy(() => import('@features/clans/ClansPage'));
const ContentPage = lazy(() => import('@features/content/ContentPage'));

// Component-based code splitting
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

#### 2. Bundle Optimization
- **Manual chunks**: Strategic bundle splitting in Vite configuration
- **Tree shaking**: Automatic removal of unused code
- **Asset optimization**: Image compression and format selection
- **CSS optimization**: PostCSS with cssnano

#### 3. Runtime Optimizations
- **React.memo**: Prevent unnecessary re-renders
- **useMemo/useCallback**: Expensive computation caching
- **Virtual scrolling**: For large lists (leaderboards, clan members)
- **Intersection Observer**: For lazy loading and infinite scroll

---

## Mobile Architecture

### React Native Structure
```
mobile/src/
├── App.tsx                # Main application component
├── components/            # Reusable mobile components
│   ├── common/           # Common UI components
│   ├── gaming/           # Gaming-specific mobile components
│   └── theme/            # Theme and styling components
├── screens/              # Screen components
│   ├── auth/             # Authentication screens
│   ├── clans/            # Clan management screens
│   ├── voting/           # Voting screens
│   └── profile/          # Profile screens
├── navigation/           # Navigation configuration
│   ├── AppNavigator.tsx  # Main app navigation
│   ├── AuthNavigator.tsx # Authentication flow
│   └── MainNavigator.tsx # Authenticated user navigation
├── services/             # Platform services
│   ├── ApiService.ts     # API communication
│   ├── WalletService.ts  # Blockchain wallet integration
│   ├── AuthService.ts    # Authentication service
│   └── SyncService.ts    # Data synchronization
├── store/                # Redux state management
│   ├── index.ts          # Store configuration
│   └── slices/           # Feature-based state slices
├── hooks/                # Custom React hooks
├── utils/                # Utility functions
└── types/                # TypeScript type definitions
```

### Mobile-Specific Features

#### 1. Biometric Authentication
```typescript
// Biometric authentication integration
import BiometricService from '@/services/BiometricService';

const useBiometricAuth = () => {
  const authenticate = useCallback(async () => {
    const isAvailable = await BiometricService.isAvailable();
    if (isAvailable) {
      return await BiometricService.authenticate();
    }
    throw new Error('Biometric authentication not available');
  }, []);

  return { authenticate };
};
```

#### 2. Offline Synchronization
```typescript
// Offline data synchronization
import SyncService from '@/services/SyncService';
import NetInfo from '@react-native-async-storage/async-storage';

const useSyncService = () => {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        SyncService.syncPendingChanges();
      }
    });

    return unsubscribe;
  }, []);
};
```

#### 3. Push Notifications
```typescript
// Push notification service
import NotificationService from '@/services/NotificationService';

const useNotifications = () => {
  useEffect(() => {
    NotificationService.initialize();
    NotificationService.requestPermissions();
    
    return () => {
      NotificationService.cleanup();
    };
  }, []);
};
```

### Cross-Platform Data Synchronization
- **Shared API contracts**: Consistent data models between web and mobile
- **Real-time sync**: WebSocket connections for instant updates
- **Conflict resolution**: Last-write-wins with user override options
- **Optimistic updates**: Immediate UI updates with rollback capability

---

## Database Architecture

### Multi-Database Strategy

#### PostgreSQL (Primary Relational Data)
```sql
-- Core entity relationships
Users ──── UserProfiles
  │
  ├──── ClanMemberships ──── Clans
  │                           │
  │                           ├──── ClanRoles
  │                           └──── ClanTreasury
  │
  ├──── VoteTransactions ──── Votes
  │                           │
  │                           └──── VoteResults
  │
  └──── AuthSessions ──── RefreshTokens
```

#### MongoDB (Flexible Document Data)
```javascript
// Content and analytics collections
{
  // Content documents
  content: {
    _id: ObjectId,
    authorId: String,
    type: 'video|image|text|stream',
    metadata: {
      title: String,
      description: String,
      tags: [String],
      fileUrls: [String]
    },
    moderation: {
      status: 'pending|approved|rejected',
      flags: [ModerationFlag],
      reviewedAt: Date,
      reviewedBy: String
    },
    analytics: {
      views: Number,
      likes: Number,
      shares: Number,
      comments: Number
    },
    createdAt: Date,
    updatedAt: Date
  },
  
  // Analytics events
  events: {
    _id: ObjectId,
    userId: String,
    eventType: String,
    eventData: Object,
    timestamp: Date,
    sessionId: String
  }
}
```

#### Redis (Caching and Sessions)
```
# Cache key patterns
user:profile:{userId}           # User profile cache
clan:members:{clanId}          # Clan member list cache
voting:active                  # Active votes cache
leaderboard:global            # Global leaderboard cache
session:{sessionId}           # User session data
websocket:rooms:{roomId}      # WebSocket room membership
rate_limit:{ip}:{endpoint}    # Rate limiting data
```

### Data Consistency Strategies

#### 1. Eventual Consistency
- **Cross-database sync**: Scheduled synchronization jobs
- **Event sourcing**: Audit trail for critical operations
- **Conflict resolution**: Timestamp-based conflict resolution

#### 2. ACID Transactions
- **PostgreSQL transactions**: Atomic operations for critical data
- **Distributed transactions**: Two-phase commit for cross-system updates
- **Rollback strategies**: Comprehensive error recovery

#### 3. Caching Strategy
- **Write-through cache**: Immediate cache updates on write
- **Cache invalidation**: Event-driven cache invalidation
- **Cache warming**: Proactive cache population for hot data

---

## Security Architecture

### Authentication & Authorization

#### Multi-Factor Authentication Flow
```
1. Username/Password Authentication
   ↓
2. JWT Token Generation
   ↓
3. Optional 2FA Challenge (TOTP/SMS)
   ↓
4. Biometric Verification (Mobile)
   ↓
5. Wallet Signature Challenge (Optional)
   ↓
6. Session Establishment
```

#### Role-Based Access Control (RBAC)
```javascript
// Permission matrix
const PERMISSIONS = {
  CLAN_ADMIN: [
    'clan.manage',
    'clan.invite_members',
    'clan.kick_members',
    'clan.manage_roles',
    'clan.treasury.view',
    'clan.treasury.spend'
  ],
  CLAN_MODERATOR: [
    'clan.invite_members',
    'clan.moderate_content',
    'clan.view_analytics'
  ],
  CLAN_MEMBER: [
    'clan.vote',
    'clan.view',
    'clan.chat'
  ],
  CONTENT_CREATOR: [
    'content.create',
    'content.edit_own',
    'content.delete_own',
    'content.analytics.view_own'
  ]
};
```

### Security Controls

#### 1. Input Validation
```javascript
// Comprehensive input validation
const validationSchemas = {
  userRegistration: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(PASSWORD_REGEX).required(),
    walletAddress: Joi.string().custom(validateSolanaAddress)
  }),
  
  voteSubmission: Joi.object({
    voteId: Joi.string().uuid().required(),
    choice: Joi.string().valid('yes', 'no', 'abstain').required(),
    tokensToSpend: Joi.number().positive().max(MAX_VOTE_TOKENS).required(),
    signature: Joi.string().required()
  })
};
```

#### 2. Rate Limiting
```javascript
// Multi-level rate limiting
const rateLimits = {
  global: { windowMs: 15 * 60 * 1000, max: 1000 }, // 1000 requests per 15min
  auth: { windowMs: 15 * 60 * 1000, max: 10 },     // 10 auth attempts per 15min
  voting: { windowMs: 60 * 60 * 1000, max: 100 },  // 100 votes per hour
  content: { windowMs: 60 * 60 * 1000, max: 50 }   // 50 content operations per hour
};
```

#### 3. Content Security Policy
```javascript
// CSP configuration
const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", "data:", "https:"],
  connectSrc: ["'self'", "wss:", "https://api.mainnet-beta.solana.com"],
  fontSrc: ["'self'", "https://fonts.googleapis.com"],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'", "https:"],
  frameSrc: ["'none'"]
};
```

### Blockchain Security

#### Transaction Validation
```javascript
// Comprehensive transaction validation
const validateTransaction = async (transaction) => {
  // 1. Signature verification
  const signatureValid = await verifyTransactionSignature(transaction);
  
  // 2. Balance verification
  const hasSufficientBalance = await checkTokenBalance(
    transaction.from,
    transaction.amount
  );
  
  // 3. Rate limiting check
  const withinRateLimit = await checkTransactionRateLimit(transaction.from);
  
  // 4. Duplicate prevention
  const isUnique = await checkTransactionUniqueness(transaction.signature);
  
  return signatureValid && hasSufficientBalance && withinRateLimit && isUnique;
};
```

#### Smart Contract Integration
- **Program validation**: Verify all Solana program interactions
- **Instruction validation**: Validate transaction instructions
- **Account verification**: Ensure account ownership and permissions
- **Slippage protection**: Prevent MEV attacks and front-running

---

## Build System

### Vite Configuration

#### Development Environment
```javascript
// Development optimizations
export default defineConfig({
  build: {
    sourcemap: true,
    minify: false,
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000,
    hot: true,
    proxy: {
      '/api': 'http://localhost:5000'
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@solana/web3.js']
  }
});
```

#### Production Environment
```javascript
// Production optimizations
export default defineConfig({
  build: {
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'solana-vendor': ['@solana/web3.js', '@solana/wallet-adapter-phantom'],
          'utils-vendor': ['lodash', 'date-fns'],
          'crypto-vendor': ['crypto-js', 'buffer']
        }
      }
    }
  },
  esbuild: {
    drop: ['console', 'debugger'],
    pure: ['console.log'],
    minifyIdentifiers: true,
    minifySyntax: true
  }
});
```

### Bundle Optimization

#### Code Splitting Strategy
```
dist/
├── assets/
│   ├── js/
│   │   ├── main-[hash].js          # Main application bundle
│   │   ├── react-vendor-[hash].js  # React ecosystem
│   │   ├── solana-vendor-[hash].js # Solana/blockchain
│   │   ├── utils-vendor-[hash].js  # Utility libraries
│   │   ├── feature-voting-[hash].js # Voting feature
│   │   ├── feature-clans-[hash].js  # Clan management
│   │   └── feature-content-[hash].js # Content management
│   ├── css/
│   │   ├── main-[hash].css         # Global styles
│   │   └── components-[hash].css   # Component styles
│   └── images/
│       ├── icons/                  # Application icons
│       └── assets/                 # Static images
└── pages/
    ├── index.html                  # Main page
    ├── voting.html                 # Voting page
    ├── clans.html                  # Clans page
    └── content.html                # Content page
```

#### Performance Budgets
```javascript
// Performance budget configuration
const performanceBudgets = {
  maxBundleSize: '250kb',      // Maximum main bundle size
  maxChunkSize: '150kb',       # Maximum individual chunk size
  maxAssetSize: '100kb',       # Maximum individual asset size
  maxInitialLoadTime: '3s',    # Maximum initial page load time
  maxLCPTime: '2.5s',          # Largest Contentful Paint target
  maxFIDTime: '100ms',         # First Input Delay target
  maxCLSScore: '0.1'           # Cumulative Layout Shift target
};
```

### Testing Infrastructure

#### Unit Testing
```javascript
// Jest configuration
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/config/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.{js,jsx,ts,tsx}'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

#### Integration Testing
```javascript
// Puppeteer integration tests
const integrationTests = [
  'wallet-connection-flow',
  'voting-process-e2e',
  'clan-management-flow',
  'content-submission-flow',
  'authentication-flow'
];

// Test execution strategy
for (const test of integrationTests) {
  await runE2ETest(test, {
    headless: process.env.CI === 'true',
    slowMo: process.env.DEBUG ? 250 : 0,
    devtools: process.env.DEBUG === 'true'
  });
}
```

#### Performance Testing
```javascript
// Performance audit configuration
const performanceConfig = {
  lighthouse: {
    performance: 90,
    accessibility: 95,
    bestPractices: 90,
    seo: 80,
    pwa: 70
  },
  budgets: [
    {
      resourceType: 'script',
      budget: 300
    },
    {
      resourceType: 'total',
      budget: 500
    }
  ]
};
```

---

## Deployment Architecture

### Environment Configuration

#### Development Environment
```javascript
// Development configuration
const devConfig = {
  apiUrl: 'http://localhost:5000/api',
  wsUrl: 'ws://localhost:5000',
  solanaNetwork: 'devnet',
  debug: true,
  analytics: false,
  features: {
    voting: 'enabled',
    clans: 'enabled',
    content: 'beta',
    mobile: 'enabled'
  }
};
```

#### Staging Environment
```javascript
// Staging configuration
const stagingConfig = {
  apiUrl: 'https://staging-api.mlg.clan/api',
  wsUrl: 'wss://staging-api.mlg.clan',
  solanaNetwork: 'testnet',
  debug: false,
  analytics: true,
  features: {
    voting: 'enabled',
    clans: 'enabled',
    content: 'enabled',
    mobile: 'enabled'
  }
};
```

#### Production Environment
```javascript
// Production configuration
const prodConfig = {
  apiUrl: 'https://api.mlg.clan/api',
  wsUrl: 'wss://api.mlg.clan',
  solanaNetwork: 'mainnet',
  debug: false,
  analytics: true,
  features: {
    voting: 'enabled',
    clans: 'enabled',
    content: 'enabled',
    mobile: 'enabled'
  }
};
```

### CI/CD Pipeline
```yaml
# GitHub Actions workflow
name: MLG.clan CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type checking
        run: npm run type:check
      
      - name: Unit tests
        run: npm run test:coverage
      
      - name: Integration tests
        run: npm run test:integration
      
      - name: Performance audit
        run: npm run audit:performance

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        run: echo "Deploy to production server"
```

### Infrastructure Components

#### Load Balancer Configuration
```nginx
# Nginx configuration
upstream mlg_backend {
    server backend1.mlg.clan:5000;
    server backend2.mlg.clan:5000;
    server backend3.mlg.clan:5000;
}

upstream mlg_websocket {
    ip_hash;
    server websocket1.mlg.clan:5001;
    server websocket2.mlg.clan:5001;
}

server {
    listen 443 ssl http2;
    server_name mlg.clan www.mlg.clan;
    
    # SSL configuration
    ssl_certificate /etc/ssl/certs/mlg.clan.crt;
    ssl_certificate_key /etc/ssl/private/mlg.clan.key;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # API proxy
    location /api {
        proxy_pass http://mlg_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket proxy
    location /socket.io {
        proxy_pass http://mlg_websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
    
    # Static files
    location / {
        root /var/www/mlg.clan;
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Database Deployment
```yaml
# Docker Compose for database stack
version: '3.8'
services:
  postgresql:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: mlg_clan
      POSTGRES_USER: mlg_user
      POSTGRES_PASSWORD: ${PG_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./sql/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mlg_user -d mlg_clan"]
      interval: 10s
      timeout: 5s
      retries: 5

  mongodb:
    image: mongo:6.0
    environment:
      MONGO_INITDB_DATABASE: mlg_clan_content
      MONGO_INITDB_ROOT_USERNAME: mlg_user
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

volumes:
  postgres_data:
  mongo_data:
  redis_data:
```

---

## Developer Onboarding

### Getting Started

#### Prerequisites
```bash
# Required software
Node.js >= 18.x
npm >= 8.x
Git >= 2.30.x
PostgreSQL >= 14.x
Redis >= 6.x
MongoDB >= 6.x (optional)

# Development tools (recommended)
Visual Studio Code
Phantom Wallet Browser Extension
Postman or similar API testing tool
```

#### Quick Setup
```bash
# 1. Clone the repository
git clone https://github.com/mlg-clan/platform.git
cd platform

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 4. Initialize databases
npm run db:migrate
npm run db:seed

# 5. Start development servers
npm run dev          # Start backend API server
npm run dev:frontend # Start frontend development server (in new terminal)

# 6. Run tests
npm run test
npm run test:integration
```

#### Environment Variables
```bash
# .env.example
NODE_ENV=development
PORT=5000

# Database Configuration
DATABASE_URL=postgresql://mlg_user:password@localhost:5432/mlg_clan
MONGO_URL=mongodb://mlg_user:password@localhost:27017/mlg_clan_content
REDIS_URL=redis://:password@localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret

# Solana Configuration
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
MLG_TOKEN_MINT=your-token-mint-address

# External Services
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_CONTENT_MODERATION=true
ENABLE_REAL_TIME_UPDATES=true
```

### Development Workflow

#### 1. Feature Development Process
```bash
# Create feature branch
git checkout -b feature/new-voting-mechanism

# Make changes following coding standards
# - Write tests first (TDD approach)
# - Follow TypeScript best practices
# - Update documentation

# Run full test suite
npm run test:ci

# Create pull request
# - PR must include tests
# - PR must pass all checks
# - PR must be reviewed by team member
```

#### 2. Code Quality Standards
```javascript
// ESLint configuration
module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'error',
    'no-var': 'error'
  },
  overrides: [
    {
      files: ['*.test.js', '*.test.ts'],
      env: { jest: true }
    }
  ]
};
```

#### 3. Debugging Guidelines

##### Frontend Debugging
```javascript
// Enable debug mode
localStorage.setItem('mlg-debug', 'true');

// Use browser developer tools
// - React Developer Tools extension
// - Redux DevTools extension
// - Network tab for API calls
// - Console for error messages

// Debug wallet connections
window.MLGWalletDebug = true;
```

##### Backend Debugging
```javascript
// Enable debug logging
process.env.DEBUG = 'mlg:*';

// Use debugging tools
// - Node.js inspect mode: node --inspect server.js
// - VS Code debugger configuration
// - Postman for API testing
// - Database query logging
```

### Code Architecture Patterns

#### 1. Error Handling Pattern
```javascript
// Consistent error handling
class MLGError extends Error {
  constructor(message, code = 'GENERIC_ERROR', context = {}) {
    super(message);
    this.name = 'MLGError';
    this.code = code;
    this.context = context;
    this.timestamp = Date.now();
  }
}

// Usage
try {
  await performVoteTransaction(voteData);
} catch (error) {
  if (error instanceof MLGError) {
    // Handle known MLG errors
    handleMLGError(error);
  } else {
    // Handle unexpected errors
    handleUnknownError(error);
  }
}
```

#### 2. API Response Pattern
```javascript
// Consistent API responses
const createApiResponse = (data, success = true, message = null) => ({
  success,
  message,
  data,
  timestamp: new Date().toISOString(),
  version: process.env.API_VERSION
});

// Success response
res.json(createApiResponse({ userId: 123, username: 'player1' }));

// Error response
res.status(400).json(createApiResponse(
  null, 
  false, 
  'Invalid wallet address format'
));
```

#### 3. Component Props Pattern
```typescript
// Consistent component props interface
interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
  loading?: boolean;
  disabled?: boolean;
}

interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: (event: React.MouseEvent) => void;
}
```

### Testing Standards

#### Unit Testing
```javascript
// Test structure example
describe('VotingService', () => {
  let votingService;
  let mockWalletService;
  
  beforeEach(() => {
    mockWalletService = createMockWalletService();
    votingService = new VotingService(mockWalletService);
  });
  
  describe('submitVote', () => {
    it('should successfully submit a valid vote', async () => {
      // Arrange
      const voteData = createValidVoteData();
      mockWalletService.signTransaction.mockResolvedValue('signature123');
      
      // Act
      const result = await votingService.submitVote(voteData);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.transactionSignature).toBe('signature123');
    });
    
    it('should reject invalid vote data', async () => {
      // Arrange
      const invalidVoteData = createInvalidVoteData();
      
      // Act & Assert
      await expect(votingService.submitVote(invalidVoteData))
        .rejects.toThrow('Invalid vote data');
    });
  });
});
```

#### Integration Testing
```javascript
// E2E test example
describe('Voting Flow E2E', () => {
  let page;
  
  beforeAll(async () => {
    page = await browser.newPage();
    await page.goto('http://localhost:3000/voting');
  });
  
  test('complete voting process', async () => {
    // Connect wallet
    await page.click('[data-testid="connect-wallet-btn"]');
    await page.waitForSelector('[data-testid="wallet-connected"]');
    
    // Select vote option
    await page.click('[data-testid="vote-option-yes"]');
    
    // Enter token amount
    await page.fill('[data-testid="token-amount-input"]', '100');
    
    // Submit vote
    await page.click('[data-testid="submit-vote-btn"]');
    
    // Verify success
    await page.waitForSelector('[data-testid="vote-success-message"]');
    const successMessage = await page.textContent('[data-testid="vote-success-message"]');
    expect(successMessage).toContain('Vote submitted successfully');
  });
});
```

---

## Code Organization

### Directory Structure Philosophy

The MLG.clan platform follows a feature-based architecture with clear separation of concerns:

#### Core Principles
1. **Feature Isolation**: Each major feature is self-contained
2. **Shared Resources**: Common utilities and components are centralized
3. **Clean Boundaries**: Clear interfaces between modules
4. **Testability**: Every module is easily testable in isolation
5. **Scalability**: Structure supports future growth and refactoring

#### Folder Structure Explanation
```
src/
├── main.js                    # Application entry point - bootstraps entire app
├── core/                      # Core platform infrastructure
│   ├── auth/                  # Authentication & authorization system
│   ├── api/                   # Backend API server and routes
│   ├── websocket/             # Real-time communication layer
│   ├── security/              # Security services and middleware
│   ├── cache/                 # Multi-level caching system
│   └── database/              # Database configuration and migrations
├── features/                  # Business domain modules
│   ├── voting/                # Blockchain-based voting system
│   ├── clans/                 # Clan management and social features
│   ├── content/               # Content creation and moderation
│   ├── wallet/                # Blockchain wallet integration
│   └── tokens/                # Token operations and management
├── shared/                    # Shared resources across features
│   ├── components/            # Reusable UI components
│   │   ├── ui/                # Base UI components (buttons, inputs, etc.)
│   │   ├── gaming/            # Gaming-specific UI components
│   │   └── examples/          # Component usage examples
│   ├── utils/                 # Utility functions and helpers
│   │   ├── api/               # API client and communication utilities
│   │   ├── wallet/            # Wallet interaction utilities
│   │   ├── state/             # State management system
│   │   ├── cache/             # Client-side caching utilities
│   │   └── error/             # Error handling and logging
│   ├── router/                # Client-side routing system
│   └── performance/           # Performance optimization utilities
├── styles/                    # Global styles and theming
├── types/                     # TypeScript type definitions
└── mobile/                    # React Native mobile application
    ├── src/
    │   ├── components/        # Mobile-specific components
    │   ├── screens/           # Mobile screen components
    │   ├── navigation/        # Mobile navigation setup
    │   ├── services/          # Mobile platform services
    │   └── store/             # Redux state management
    └── assets/                # Mobile app assets (icons, images)
```

### Module Dependencies

#### Dependency Flow
```
┌─────────────────────────────────────────────┐
│                   main.js                   │ ← Application Entry
├─────────────────────────────────────────────┤
│  features/     shared/        core/         │ ← Feature Layer
│  - voting     - components   - auth         │
│  - clans      - utils        - api          │
│  - content    - router       - websocket    │
│  - wallet     - state        - security     │
│  - tokens     - performance  - cache        │
│              └──────────────── database     │
├─────────────────────────────────────────────┤
│           External Dependencies             │ ← Infrastructure
│  - React      - Node.js      - PostgreSQL  │
│  - Solana     - Express      - MongoDB     │
│  - Phantom    - Socket.IO    - Redis       │
└─────────────────────────────────────────────┘
```

#### Import Hierarchy Rules
1. **No Circular Dependencies**: Strict enforcement of unidirectional imports
2. **Feature Isolation**: Features can only import from `shared/` and `core/`
3. **Shared Utilities**: Can import from `core/` but not from `features/`
4. **Core Services**: Can only import from external libraries and other core modules

#### Example Import Patterns
```javascript
// ✅ Correct: Feature importing from shared utilities
// src/features/voting/solana-voting-system.js
import { MLGApiClient } from '../../shared/utils/api/mlg-api-client-consolidated.js';
import { WalletManager } from '../../shared/utils/wallet/mlg-wallet-init-consolidated.js';

// ✅ Correct: Shared utility importing from core
// src/shared/utils/api/mlg-api-client-consolidated.js
import { AuthService } from '../../core/auth/auth-service.js';

// ❌ Incorrect: Core importing from features
// src/core/auth/auth-service.js
// import { VotingService } from '../../features/voting/voting-service.js'; // DON'T DO THIS

// ❌ Incorrect: Features importing from each other
// src/features/voting/voting-service.js
// import { ClanManager } from '../clans/clan-management.js'; // DON'T DO THIS
```

---

## Component Dependencies

### Frontend Component Hierarchy

#### UI Component System
```
Base Components
├── Button (variants: primary, secondary, danger)
│   ├── XboxButton (Xbox-styled gaming button)
│   └── BurnButton (token burning confirmation)
├── Input (text, email, password, number)
│   ├── SearchInput (with search icon and filtering)
│   └── TokenInput (for token amount entry with validation)
├── Card (container with gaming aesthetics)
│   └── GamingCard (enhanced with animations and hover effects)
├── Modal (overlay dialogs)
│   ├── VoteConfirmationModal
│   ├── WalletConnectionModal
│   └── ClanInviteModal
├── Form (form containers with validation)
├── Select (dropdown selections)
├── LoadingSpinner (loading indicators)
│   └── GamingLoadingSpinner (Xbox-style loading)
└── SkeletonLoader (content placeholders)
```

#### Feature-Specific Components
```
Voting Components
├── BurnVoteConfirmationUI
│   ├── Uses: Button, Modal, TokenInput
│   └── Manages: Vote confirmation flow
├── VoteDisplayUI
│   ├── Uses: Card, Button, LoadingSpinner
│   └── Manages: Vote results and history
└── VotingInterfaceUI
    ├── Uses: Form, Button, TokenInput, Modal
    └── Manages: Complete voting experience

Clan Components
├── ClanManagementUI
│   ├── Uses: Card, Button, Form, Modal
│   └── Manages: Clan creation and settings
├── ClanLeaderboardUI
│   ├── Uses: Card, Table, LoadingSpinner
│   └── Manages: Clan rankings and statistics
└── ClanInvitationUI
    ├── Uses: Form, Button, Modal
    └── Manages: Member invitations

Content Components
├── ContentSubmissionForm
│   ├── Uses: Form, Input, Button, FileUpload
│   └── Manages: Content upload and metadata
├── ContentDisplayComponents
│   ├── Uses: Card, Button, Modal
│   └── Manages: Content viewing and interaction
└── ModerationQueueInterface
    ├── Uses: Card, Button, Form, Modal
    └── Manages: Content moderation workflow
```

### Service Dependencies

#### Core Services Architecture
```
Authentication Service
├── Dependencies:
│   ├── JWT Library (jsonwebtoken)
│   ├── bcryptjs (password hashing)
│   ├── PostgreSQL Client
│   ├── Redis Client (session storage)
│   └── Email Service (nodemailer)
├── Provides:
│   ├── User registration/login
│   ├── Token management (JWT + refresh)
│   ├── Session management
│   ├── Password reset functionality
│   └── Multi-factor authentication
└── Used by:
    ├── API Middleware (auth protection)
    ├── WebSocket Manager (socket authentication)
    ├── Frontend Auth Context
    └── Mobile Auth Service

Wallet Service
├── Dependencies:
│   ├── @solana/web3.js
│   ├── @solana/wallet-adapter-phantom
│   ├── Solana RPC Connection
│   └── Token Program Integration
├── Provides:
│   ├── Wallet connection management
│   ├── Transaction signing
│   ├── Balance checking
│   ├── Token transfers
│   └── Program interaction
└── Used by:
    ├── Voting System (token operations)
    ├── Clan Treasury (financial operations)
    ├── Content Rewards (token distribution)
    └── User Profile (balance display)

API Client Service
├── Dependencies:
│   ├── Fetch API (or axios)
│   ├── Authentication Service (token management)
│   ├── Error Handler
│   └── Cache Manager
├── Provides:
│   ├── HTTP request abstraction
│   ├── Automatic token refresh
│   ├── Request/response caching
│   ├── Error handling and retry logic
│   └── Request deduplication
└── Used by:
    ├── All Frontend Components
    ├── State Management (data fetching)
    ├── Mobile Services
    └── Background Sync
```

### Data Flow Dependencies

#### State Management Flow
```
User Action (UI Component)
       ↓
State Action Creator
       ↓
Service Layer (API/Wallet)
       ↓
State Reducer
       ↓
State Update
       ↓
Component Re-render
```

#### Real-time Update Flow
```
Database Change (PostgreSQL/MongoDB)
       ↓
Change Detection (Database Triggers)
       ↓
Event Publisher (Node.js Service)
       ↓
WebSocket Manager (Socket.IO)
       ↓
Client Event Handler
       ↓
State Management Update
       ↓
UI Component Update
```

#### Caching Dependencies
```
Cache Hierarchy:
1. Browser Cache (HTTP caching)
   ├── Static assets (images, CSS, JS)
   └── API responses (with TTL)

2. Application Cache (Memory/LocalStorage)
   ├── User preferences
   ├── Authentication tokens
   ├── Recent data (leaderboards, clan info)
   └── Offline data (for mobile)

3. Server-side Cache (Redis)
   ├── Database query results
   ├── Session data
   ├── Rate limiting counters
   └── WebSocket room membership

Cache Invalidation Strategy:
- Time-based: TTL for all cached data
- Event-based: Real-time invalidation on data changes
- Manual: Admin controls for cache clearing
- Versioning: Cache keys include version information
```

### Integration Points

#### External Service Integration
```
Solana Blockchain Integration
├── Connection: @solana/web3.js RPC client
├── Wallet: Phantom wallet adapter
├── Programs: Custom MLG token program
└── Monitoring: Transaction confirmation tracking

Database Integration
├── PostgreSQL: Primary relational data
│   ├── Connection pooling (pg)
│   ├── Migration system (custom)
│   └── Query optimization
├── MongoDB: Flexible document storage
│   ├── Content metadata
│   ├── Analytics events
│   └── User activity logs
└── Redis: Caching and sessions
    ├── Session storage
    ├── Rate limiting
    ├── WebSocket state
    └── Cache invalidation

Third-party Service Integration
├── Email Service (SMTP/SendGrid)
│   ├── User verification
│   ├── Password reset
│   └── Notifications
├── File Storage (AWS S3/CloudFlare)
│   ├── Content uploads
│   ├── Profile images
│   └── Static assets
└── Analytics (Custom/Google Analytics)
    ├── User behavior tracking
    ├── Performance monitoring
    └── Error tracking
```

### Performance Considerations

#### Bundle Dependencies
```javascript
// Vite bundle analysis
{
  "chunks": {
    "main": {
      "size": "245kb",
      "dependencies": [
        "application-core",
        "shared-utilities",
        "ui-components"
      ]
    },
    "react-vendor": {
      "size": "142kb",
      "dependencies": ["react", "react-dom"]
    },
    "solana-vendor": {
      "size": "320kb",
      "dependencies": [
        "@solana/web3.js",
        "@solana/wallet-adapter-phantom"
      ]
    },
    "feature-voting": {
      "size": "87kb",
      "dependencies": [
        "voting-components",
        "blockchain-utilities"
      ]
    }
  }
}
```

#### Runtime Dependencies
```javascript
// Critical path optimization
const criticalDependencies = [
  'authentication-service',    // Required for app initialization
  'wallet-connection',        // Core blockchain functionality
  'error-handling-system',    // Essential for stability
  'state-management-core'     // Required for React components
];

const lazyDependencies = [
  'analytics-tracking',       // Can be loaded after initial render
  'advanced-charting',       // Loaded when viewing statistics
  'video-player',            // Loaded when viewing content
  'advanced-moderation'      # Loaded for moderator actions
];
```

This comprehensive architecture documentation provides developers with a complete understanding of the MLG.clan platform's structure, dependencies, and integration points. The documentation serves as both a reference guide and an onboarding resource for new team members.