# MLG.clan Platform - File Structure Documentation

## Overview

This document describes the reorganized file structure for the MLG.clan platform, implemented as part of Task 16.6. The new structure follows industry best practices for maintainability, developer experience, and scalability.

## New Directory Structure

```
F:\websites\notthenewone\
├── build/                          # Build configuration
│   ├── babel.config.cjs             # Babel transpilation config
│   ├── build.js                     # Custom build script
│   ├── postcss.config.js            # PostCSS configuration
│   ├── tailwind.config.js           # Tailwind CSS config
│   └── vite.config.js               # Vite bundler configuration
│
├── config/                          # Application configuration
│   ├── environment/                 # Environment-specific configs
│   │   └── solana-config.js         # Solana blockchain configuration
│   ├── jest.config.cjs              # Jest test configuration
│   └── jest.setup.js                # Jest setup file
│
├── public/                          # Static assets and HTML pages
│   └── pages/                       # HTML page templates
│       ├── analytics.html           # Analytics dashboard page
│       ├── clans.html              # Clan management page
│       ├── content.html            # Content hub page
│       ├── dao.html                # DAO governance page
│       ├── index.html              # Main landing page
│       ├── profile.html            # User profile page
│       └── voting.html             # Voting interface page
│
├── scripts/                         # Utility scripts
│   ├── optimize-js.js               # JavaScript optimization script
│   ├── performance-audit.js         # Performance auditing tool
│   └── vite-compression-plugin.js   # Vite compression plugin
│
├── src/                             # Source code
│   ├── core/                        # Core system modules
│   │   ├── api/                     # API layer
│   │   │   ├── controllers/         # API controllers
│   │   │   ├── middleware/          # API middleware
│   │   │   ├── routes/              # API routes
│   │   │   └── server.js            # API server
│   │   ├── auth/                    # Authentication system
│   │   │   ├── middleware/          # Auth middleware
│   │   │   ├── auth-service.js      # Core auth service
│   │   │   ├── mfa.js              # Multi-factor authentication
│   │   │   ├── rbac.js             # Role-based access control
│   │   │   └── session-manager.js  # Session management
│   │   ├── cache/                   # Caching system
│   │   │   ├── invalidation/        # Cache invalidation
│   │   │   ├── middleware/          # Cache middleware
│   │   │   ├── monitoring/          # Cache monitoring
│   │   │   ├── strategies/          # Cache strategies
│   │   │   ├── cache-manager.js     # Main cache manager
│   │   │   └── redis-client.js      # Redis client
│   │   ├── data/                    # Data layer
│   │   │   ├── daos/               # Data Access Objects
│   │   │   ├── models/             # Data models
│   │   │   └── repositories/       # Repository pattern
│   │   ├── database/                # Database configuration
│   │   │   ├── migrations/          # Database migrations
│   │   │   └── seeds/              # Database seeds
│   │   ├── security/                # Security modules
│   │   │   ├── auth/               # Enhanced security auth
│   │   │   ├── detection/          # Threat detection
│   │   │   ├── emergency/          # Emergency protocols
│   │   │   ├── gaming/             # Gaming-specific security
│   │   │   ├── middleware/         # Security middleware
│   │   │   ├── monitoring/         # Security monitoring
│   │   │   └── testing/            # Security testing
│   │   └── websocket/               # WebSocket system
│   │       ├── clients/            # WebSocket clients
│   │       ├── events/             # Event handlers
│   │       ├── managers/           # Connection managers
│   │       ├── middleware/         # WebSocket middleware
│   │       └── monitoring/         # WebSocket monitoring
│   │
│   ├── features/                    # Feature-based modules
│   │   ├── clans/                   # Clan management features
│   │   │   ├── clan-achievements.js # Achievement system
│   │   │   ├── clan-invitations.js  # Invitation system
│   │   │   ├── clan-leaderboard.js  # Leaderboards
│   │   │   ├── clan-management.js   # Core clan management
│   │   │   ├── clan-roles.js        # Role system
│   │   │   ├── clan-statistics.js   # Statistics tracking
│   │   │   └── clan-voting.js       # Clan voting system
│   │   ├── content/                 # Content management features
│   │   │   ├── content-moderation.js    # Content moderation
│   │   │   ├── content-ranking-algorithm.js # Ranking algorithm
│   │   │   ├── content-rewards.js       # Reward system
│   │   │   └── content-validator.js     # Content validation
│   │   ├── tokens/                  # Token management
│   │   │   └── spl-mlg-token.js     # MLG SPL token operations
│   │   ├── voting/                  # Voting system
│   │   │   ├── mlg-voting-integration.js # Voting integration
│   │   │   └── solana-voting-system.js   # Solana voting system
│   │   └── wallet/                  # Wallet features
│   │       ├── phantom-wallet.js    # Phantom wallet integration
│   │       └── (test files)
│   │
│   ├── shared/                      # Shared utilities and components
│   │   ├── components/              # Reusable UI components
│   │   │   ├── examples/            # Component usage examples
│   │   │   ├── burn-vote-confirmation-ui.js # Vote confirmation UI
│   │   │   ├── clan-leaderboard-ui.jsx      # Clan leaderboard UI
│   │   │   ├── clan-management-ui.jsx       # Clan management UI
│   │   │   ├── content-submission-form.js   # Content submission
│   │   │   ├── gaming-loading-states.js     # Loading states
│   │   │   ├── mlg-loading-system.js        # Loading system
│   │   │   ├── vote-display-ui.js           # Vote display
│   │   │   ├── voting-interface-ui.js       # Voting interface
│   │   │   ├── wallet-loading-states.js     # Wallet loading
│   │   │   └── xbox-page-transitions.js     # Xbox transitions
│   │   ├── performance/             # Performance utilities
│   │   │   ├── gamingOptimizations.js # Gaming optimizations
│   │   │   ├── memoryManager.js       # Memory management
│   │   │   └── queryOptimizer.js      # Query optimization
│   │   ├── router/                  # Routing system
│   │   │   ├── navigation-manager.js  # Navigation management
│   │   │   ├── page-loader.js         # Page loading
│   │   │   ├── route-config.js        # Route configuration
│   │   │   ├── router-loader.js       # Router loading
│   │   │   ├── router-main.js         # Main router
│   │   │   ├── spa-router.js          # SPA routing
│   │   │   ├── transition-manager.js  # Page transitions
│   │   │   └── view-manager.js        # View management
│   │   └── utils/                   # Utility functions
│   │       ├── api/                 # API utilities
│   │       │   └── mlg-api-client-consolidated.js
│   │       ├── cache/               # Cache utilities
│   │       │   └── mlg-cache-manager.js
│   │       ├── error/               # Error handling
│   │       │   ├── mlg-error-handler.js
│   │       │   ├── mlg-error-logger.js
│   │       │   └── mlg-error-system.js
│   │       ├── loading/             # Loading utilities
│   │       │   └── mlg-loading-states.js
│   │       ├── offline/             # Offline utilities
│   │       │   ├── mlg-fallback-system.js
│   │       │   └── mlg-offline-manager.js
│   │       ├── wallet/              # Wallet utilities
│   │       │   └── mlg-wallet-init-consolidated.js
│   │       ├── mlg-connection-status.js
│   │       ├── module-loader.js
│   │       └── shared-config.js
│   │
│   ├── styles/                      # Application styles
│   │   ├── main.css                 # Main stylesheet
│   │   └── video-components.css     # Video component styles
│   │
│   └── main.js                      # Application entry point
│
└── temp/                            # Temporary files and build artifacts
    ├── coverage/                    # Test coverage reports
    ├── dist/                        # Build output
    └── reports/                     # Various reports

```

## Key Improvements

### 1. Logical Grouping
- **Core modules**: Essential system functionality (auth, cache, database, security, websocket)
- **Features**: Business logic organized by domain (clans, content, voting, wallet, tokens)
- **Shared utilities**: Reusable components and utilities across the application

### 2. Clear Separation of Concerns
- Build configuration isolated in `/build/`
- Environment configuration in `/config/`
- Source code organized by responsibility
- Static assets in `/public/`
- Temporary files in `/temp/`

### 3. Improved Developer Experience
- Clear naming conventions
- Consistent directory structure
- Easy-to-find components and utilities
- Logical import paths using path aliases

### 4. Build System Integration
- Updated Vite configuration with new path mappings
- Jest configuration aligned with new structure
- All import paths updated and verified
- Successful build verification completed

## Path Aliases

The following path aliases are configured in `build/vite.config.js`:

```javascript
'@': '../src',
'@core': '../src/core',
'@features': '../src/features',
'@shared': '../src/shared',
'@components': '../src/shared/components',
'@utils': '../src/shared/utils',
'@router': '../src/shared/router',
'@wallet': '../src/features/wallet',
'@voting': '../src/features/voting',
'@clans': '../src/features/clans',
'@content': '../src/features/content',
'@tokens': '../src/features/tokens',
'@styles': '../src/styles'
```

## Benefits Achieved

1. **Better Maintainability**: Clear separation makes it easier to locate and modify code
2. **Improved Scalability**: Feature-based organization supports growth
3. **Enhanced Developer Experience**: Logical structure reduces cognitive overhead
4. **Consistent Architecture**: Standardized patterns across the codebase
5. **Better Testing**: Organized structure supports comprehensive testing strategies

## Migration Summary

- **Total files reorganized**: 100+ files moved to appropriate directories
- **Import paths updated**: 200+ import statements corrected
- **Build system verified**: All builds pass successfully
- **No functionality lost**: All existing features preserved

This reorganization provides a solid foundation for future development and maintenance of the MLG.clan platform.