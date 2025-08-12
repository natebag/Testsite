# MLG.clan Platform Developer Onboarding Guide

## Welcome to MLG.clan Development Team! 🎮

This guide will help you get up to speed with the MLG.clan platform architecture, development practices, and contribution guidelines.

---

## Table of Contents

1. [Prerequisites & Setup](#prerequisites--setup)
2. [Understanding the Architecture](#understanding-the-architecture)
3. [Development Environment](#development-environment)
4. [Code Standards & Practices](#code-standards--practices)
5. [Feature Development Workflow](#feature-development-workflow)
6. [Testing Guidelines](#testing-guidelines)
7. [Debugging & Troubleshooting](#debugging--troubleshooting)
8. [Deployment Process](#deployment-process)
9. [Common Tasks & Examples](#common-tasks--examples)
10. [Team Communication](#team-communication)

---

## Prerequisites & Setup

### Required Knowledge

#### Essential Skills
- **JavaScript/TypeScript**: ES6+, async/await, destructuring, modules
- **React**: Hooks, Context API, component lifecycle, state management
- **Node.js**: Express.js, middleware, async programming
- **Git**: Branching, merging, pull requests, conflict resolution
- **HTML/CSS**: Semantic HTML, Flexbox/Grid, responsive design

#### Recommended Skills
- **Blockchain**: Basic understanding of Solana, wallet integration
- **Databases**: PostgreSQL basics, MongoDB fundamentals
- **Testing**: Jest, React Testing Library, E2E testing
- **DevOps**: Docker basics, CI/CD concepts

### Required Software

#### Development Tools
```bash
# Core Requirements
Node.js v18.x or higher
npm v8.x or higher
Git v2.30.x or higher

# Database Systems
PostgreSQL v14.x or higher
Redis v6.x or higher
MongoDB v6.x or higher (optional)

# Recommended Editors
Visual Studio Code (with extensions)
- ES7+ React/Redux/React-Native snippets
- TypeScript Hero
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens
```

#### Browser Extensions
```bash
# Essential Extensions
Phantom Wallet (for blockchain testing)
React Developer Tools
Redux DevTools Extension

# Recommended Extensions
Metamask (alternative wallet)
Web3 Inspector
GraphQL Playground
```

### Initial Setup Process

#### 1. Repository Setup
```bash
# Clone the repository
git clone https://github.com/mlg-clan/platform.git
cd platform

# Install dependencies
npm install

# Install mobile dependencies (optional)
cd mobile
npm install
cd ..
```

#### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
# Use your preferred editor to configure:
# - Database connections
# - API keys
# - Solana network settings
# - Feature flags
```

#### 3. Database Setup
```bash
# Start database services (using Docker)
docker-compose up -d postgres redis mongodb

# Run database migrations
npm run db:migrate

# Seed development data
npm run db:seed
```

#### 4. Verification
```bash
# Run type checking
npm run type:check

# Run tests
npm run test

# Start development servers
npm run dev          # Backend API (terminal 1)
npm run dev:frontend # Frontend dev server (terminal 2)

# Verify setup by visiting:
# http://localhost:3000 (frontend)
# http://localhost:5000/api/health (backend)
```

---

## Understanding the Architecture

### High-Level Overview

The MLG.clan platform follows a modular, feature-based architecture:

```
┌─────────────────────────────────────────────────────────┐
│                   User Interface                        │
│  Web Frontend (Vite) │ Mobile App (React Native)       │
├─────────────────────────────────────────────────────────┤
│                  API Gateway Layer                      │
│  Express.js Server │ WebSocket Server │ Auth Middleware │
├─────────────────────────────────────────────────────────┤
│                 Business Logic Layer                    │
│   Voting Service   │  Clan Service   │ Content Service │
├─────────────────────────────────────────────────────────┤
│                   Data Access Layer                     │
│  PostgreSQL (Core) │ MongoDB (Flex)  │ Redis (Cache)   │
├─────────────────────────────────────────────────────────┤
│                  Integration Layer                      │
│  Solana Blockchain │ Phantom Wallet  │ External APIs   │
└─────────────────────────────────────────────────────────┘
```

### Key Architectural Principles

#### 1. Feature-Based Organization
```
src/
├── features/           # Business domain modules
│   ├── voting/        # Everything related to voting
│   ├── clans/         # Clan management features
│   ├── content/       # Content creation & moderation
│   └── wallet/        # Blockchain wallet integration
├── shared/            # Shared utilities and components
├── core/              # Core platform services
└── mobile/            # React Native mobile app
```

#### 2. Separation of Concerns
- **Presentation Layer**: UI components and user interaction
- **Business Logic Layer**: Feature-specific services and rules
- **Data Access Layer**: Repository pattern with caching
- **Integration Layer**: External service connections

#### 3. State Management Strategy
- **Global State**: React Context API for app-wide state
- **Local State**: useState/useReducer for component state
- **Server State**: Custom hooks for API data management
- **Cache State**: Multi-level caching strategy

### Important Files to Review

#### Essential Reading List (Priority Order)
1. `ARCHITECTURE.md` - Complete system architecture
2. `src/main.js` - Application entry point
3. `src/types/index.d.ts` - TypeScript definitions
4. `package.json` - Dependencies and scripts
5. `build/vite.config.js` - Build configuration

#### Core System Files
1. `src/shared/utils/state/index.js` - State management
2. `src/shared/utils/api/mlg-api-client-consolidated.js` - API client
3. `src/shared/utils/wallet/mlg-wallet-init-consolidated.js` - Wallet integration
4. `src/core/auth/auth-service.js` - Authentication system
5. `src/core/api/server.js` - Backend API server

---

## Development Environment

### Recommended VS Code Configuration

#### Workspace Settings (`.vscode/settings.json`)
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "javascript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  },
  "files.associations": {
    "*.jsx": "javascriptreact"
  }
}
```

#### Recommended Extensions (`.vscode/extensions.json`)
```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode.hexeditor"
  ]
}
```

### Development Scripts Reference

#### Frontend Development
```bash
# Start frontend development server
npm run dev:frontend

# Build frontend for production
npm run build

# Preview production build
npm run preview

# Analyze bundle size
npm run build:analyze
```

#### Backend Development
```bash
# Start backend development server (with nodemon)
npm run dev

# Start production server
npm start

# Run specific backend tests
npm run test:auth
npm run test:integration
```

#### Testing & Quality
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Type checking
npm run type:check

# Performance audit
npm run audit:performance
```

#### Database Operations
```bash
# Run database migrations
npm run db:migrate

# Seed development data
npm run db:seed

# Reset database (careful!)
npm run db:reset
```

### Environment Variables Reference

#### Core Configuration
```bash
# Application
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Frontend URLs
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000,http://localhost:9000
```

#### Database Configuration
```bash
# PostgreSQL (primary database)
DATABASE_URL=postgresql://username:password@localhost:5432/mlg_clan
DB_POOL_SIZE=20

# MongoDB (flexible data)
MONGO_URL=mongodb://username:password@localhost:27017/mlg_clan_content

# Redis (caching and sessions)
REDIS_URL=redis://localhost:6379
REDIS_PREFIX=mlg_clan:
```

#### Authentication & Security
```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRES_IN=30d

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret
```

#### Solana Blockchain
```bash
# Network Configuration
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WS_URL=wss://api.devnet.solana.com

# Token Configuration
MLG_TOKEN_MINT=your-mlg-token-mint-address
MLG_TOKEN_DECIMALS=9
VOTING_PROGRAM_ID=your-voting-program-id
```

#### External Services
```bash
# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Storage (optional)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-west-2
AWS_BUCKET=mlg-clan-uploads
```

#### Feature Flags
```bash
# Feature Toggles
ENABLE_VOTING=true
ENABLE_CLANS=true
ENABLE_CONTENT=true
ENABLE_MOBILE_API=true
ENABLE_ANALYTICS=true
ENABLE_REAL_TIME=true
```

---

## Code Standards & Practices

### JavaScript/TypeScript Standards

#### Naming Conventions
```javascript
// Variables and functions: camelCase
const userBalance = 1000;
const calculateVotingPower = (tokens) => tokens * 0.1;

// Constants: UPPER_SNAKE_CASE
const MAX_VOTE_TOKENS = 10000;
const API_ENDPOINTS = {
  VOTING: '/api/v1/voting',
  CLANS: '/api/v1/clans'
};

// Components: PascalCase
const VoteConfirmationModal = () => { /* ... */ };

// Files: kebab-case
// vote-confirmation-modal.jsx
// clan-management-service.js
// user-authentication.test.js
```

#### Code Organization Patterns
```javascript
// File structure example: src/features/voting/solana-voting-system.js

// 1. Imports (external first, then internal)
import { Connection, PublicKey } from '@solana/web3.js';
import { getPhantomWallet } from '@solana/wallet-adapter-phantom';

import { MLGApiClient } from '../../shared/utils/api/mlg-api-client-consolidated.js';
import { MLGErrorHandler } from '../../shared/utils/error/mlg-error-handler.js';

// 2. Constants and configuration
const VOTING_PROGRAM_ID = new PublicKey(process.env.VOTING_PROGRAM_ID);
const MAX_RETRIES = 3;

// 3. Main class/function implementation
class SolanaVotingSystem {
  constructor(options = {}) {
    this.connection = new Connection(options.rpcUrl);
    this.programId = VOTING_PROGRAM_ID;
    // ...
  }

  // Public methods first
  async submitVote(voteData) {
    // Implementation
  }

  // Private methods last
  #validateVoteData(voteData) {
    // Implementation
  }
}

// 4. Export
export { SolanaVotingSystem };
export default SolanaVotingSystem;
```

#### Error Handling Standards
```javascript
// Use custom error classes
class VotingError extends Error {
  constructor(message, code = 'VOTING_ERROR', context = {}) {
    super(message);
    this.name = 'VotingError';
    this.code = code;
    this.context = context;
  }
}

// Consistent error handling pattern
const submitVote = async (voteData) => {
  try {
    // Validate input
    if (!voteData || !voteData.choice) {
      throw new VotingError(
        'Vote choice is required',
        'INVALID_INPUT',
        { voteData }
      );
    }

    // Perform operation
    const result = await performVoteTransaction(voteData);
    return { success: true, data: result };

  } catch (error) {
    // Log error
    console.error('Vote submission failed:', error);

    // Handle specific errors
    if (error instanceof VotingError) {
      return { success: false, error: error.message, code: error.code };
    }

    // Handle unexpected errors
    return {
      success: false,
      error: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR'
    };
  }
};
```

### React Component Standards

#### Component Structure
```javascript
// Component file: src/shared/components/VoteConfirmationModal.jsx
import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';

import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { TokenInput } from './ui/TokenInput';

// Component implementation
const VoteConfirmationModal = ({
  isOpen,
  voteData,
  userBalance,
  onConfirm,
  onCancel
}) => {
  // State declarations
  const [tokenAmount, setTokenAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Effect hooks
  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setTokenAmount(0);
    }
  }, [isOpen]);

  // Event handlers
  const handleConfirm = useCallback(async () => {
    if (tokenAmount <= 0 || tokenAmount > userBalance) return;

    setIsSubmitting(true);
    try {
      await onConfirm({ ...voteData, tokenAmount });
    } finally {
      setIsSubmitting(false);
    }
  }, [voteData, tokenAmount, userBalance, onConfirm]);

  // Computed values
  const isValid = tokenAmount > 0 && tokenAmount <= userBalance;

  // Render
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Confirm Vote">
      <div className="space-y-4">
        <div>
          <p>You are voting: <strong>{voteData?.choice}</strong></p>
        </div>
        
        <TokenInput
          value={tokenAmount}
          onChange={setTokenAmount}
          max={userBalance}
          label="Tokens to Spend"
          placeholder="Enter amount"
        />

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!isValid || isSubmitting}
            loading={isSubmitting}
          >
            Confirm Vote
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// PropTypes definition
VoteConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  voteData: PropTypes.shape({
    id: PropTypes.string.isRequired,
    choice: PropTypes.oneOf(['yes', 'no', 'abstain']).isRequired,
    title: PropTypes.string.isRequired
  }),
  userBalance: PropTypes.number.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export { VoteConfirmationModal };
```

#### Custom Hooks Pattern
```javascript
// Custom hook: src/shared/hooks/useWallet.js
import { useState, useEffect, useCallback } from 'react';
import { useWalletContext } from '../utils/state/WalletContext';

const useWallet = () => {
  const {
    state: { connected, address, balance, loading },
    actions: { connect, disconnect, refreshBalance }
  } = useWalletContext();

  // Connect wallet with error handling
  const connectWallet = useCallback(async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Wallet connection failed:', error);
      // Handle error appropriately
    }
  }, [connect]);

  // Auto-refresh balance
  useEffect(() => {
    if (connected && address) {
      const interval = setInterval(refreshBalance, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [connected, address, refreshBalance]);

  return {
    // State
    connected,
    address,
    balance,
    loading,
    
    // Actions
    connect: connectWallet,
    disconnect,
    refreshBalance
  };
};

export { useWallet };
```

### API Development Standards

#### Route Structure
```javascript
// Route file: src/core/api/routes/voting.routes.js
import express from 'express';
import { body, param, query } from 'express-validator';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { validationMiddleware } from '../middleware/validation.middleware.js';
import { rateLimiterMiddleware } from '../middleware/rateLimiter.middleware.js';
import { VotingController } from '../controllers/voting.controller.js';

const router = express.Router();

// Get active votes (public)
router.get(
  '/active',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validationMiddleware,
  VotingController.getActiveVotes
);

// Submit vote (authenticated, rate limited)
router.post(
  '/vote',
  authMiddleware,
  rateLimiterMiddleware('voting', { max: 100, windowMs: 60 * 60 * 1000 }),
  body('voteId').isUUID(),
  body('choice').isIn(['yes', 'no', 'abstain']),
  body('tokenAmount').isFloat({ min: 0.000000001 }),
  body('transactionSignature').isString().isLength({ min: 64, max: 128 }),
  validationMiddleware,
  VotingController.submitVote
);

// Get vote history (authenticated)
router.get(
  '/history',
  authMiddleware,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validationMiddleware,
  VotingController.getVoteHistory
);

export default router;
```

#### Controller Pattern
```javascript
// Controller file: src/core/api/controllers/voting.controller.js
import { VotingService } from '../../services/VotingService.js';
import { createApiResponse, createApiError } from '../utils/response.js';

class VotingController {
  static async getActiveVotes(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      
      const result = await VotingService.getActiveVotes({
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json(createApiResponse(result, 'Active votes retrieved successfully'));
    } catch (error) {
      next(createApiError('Failed to retrieve active votes', 500, error));
    }
  }

  static async submitVote(req, res, next) {
    try {
      const { voteId, choice, tokenAmount, transactionSignature } = req.body;
      const userId = req.user.id;

      const result = await VotingService.submitVote({
        userId,
        voteId,
        choice,
        tokenAmount,
        transactionSignature
      });

      res.status(201).json(createApiResponse(result, 'Vote submitted successfully'));
    } catch (error) {
      if (error.code === 'INSUFFICIENT_BALANCE') {
        next(createApiError('Insufficient token balance', 400, error));
      } else if (error.code === 'VOTE_ALREADY_SUBMITTED') {
        next(createApiError('Vote already submitted for this proposal', 409, error));
      } else {
        next(createApiError('Failed to submit vote', 500, error));
      }
    }
  }

  static async getVoteHistory(req, res, next) {
    try {
      const { page = 1, limit = 50 } = req.query;
      const userId = req.user.id;

      const result = await VotingService.getVoteHistory(userId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json(createApiResponse(result, 'Vote history retrieved successfully'));
    } catch (error) {
      next(createApiError('Failed to retrieve vote history', 500, error));
    }
  }
}

export { VotingController };
```

---

## Feature Development Workflow

### Development Process Overview

```
1. Planning Phase
   ├── Feature Requirements Analysis
   ├── Architecture Design
   ├── Task Breakdown
   └── Timeline Estimation

2. Implementation Phase
   ├── Branch Creation
   ├── Test-Driven Development
   ├── Code Implementation
   ├── Documentation Updates
   └── Self-Review

3. Review Phase
   ├── Pull Request Creation
   ├── Code Review Process
   ├── Integration Testing
   └── Performance Testing

4. Deployment Phase
   ├── Staging Deployment
   ├── User Acceptance Testing
   ├── Production Deployment
   └── Monitoring & Rollback Plan
```

### Branch Management Strategy

#### Branch Naming Convention
```bash
# Feature branches
feature/vote-burn-mechanism
feature/clan-leaderboard-ui
feature/mobile-wallet-integration

# Bug fix branches
bugfix/vote-calculation-error
bugfix/wallet-connection-timeout

# Hotfix branches (for production)
hotfix/security-vulnerability-fix
hotfix/critical-balance-display-bug

# Release branches
release/v1.2.0
release/v1.3.0-beta
```

#### Git Workflow Process
```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/new-voting-mechanism

# 2. Make changes and commit regularly
git add .
git commit -m "feat: implement vote token burning logic

- Add token burn transaction building
- Integrate with Solana token program
- Add comprehensive error handling
- Update TypeScript definitions

Closes #123"

# 3. Keep branch updated
git fetch origin
git rebase origin/develop

# 4. Push branch and create PR
git push -u origin feature/new-voting-mechanism

# 5. After PR approval and merge, cleanup
git checkout develop
git pull origin develop
git branch -d feature/new-voting-mechanism
```

### Commit Message Standards

#### Conventional Commits Format
```bash
<type>[(scope)]: <description>

[optional body]

[optional footer(s)]
```

#### Commit Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes
- `perf`: Performance improvements
- `ci`: CI configuration changes

#### Examples
```bash
# Feature commit
feat(voting): implement burn-to-vote mechanism

Add ability for users to burn MLG tokens when voting to increase
voting power. Includes transaction validation, balance checking,
and real-time UI updates.

Closes #234
Breaking-change: Changes voting API response format

# Bug fix commit
fix(wallet): resolve connection timeout on slow networks

Increase connection timeout from 5s to 30s and add retry logic
with exponential backoff to handle slow wallet responses.

Fixes #567

# Documentation commit
docs(api): update voting endpoints documentation

Add examples for new burn-vote endpoints and update response
schemas to match current implementation.
```

### Pull Request Guidelines

#### PR Title Format
```bash
feat(voting): implement burn-to-vote mechanism
fix(wallet): resolve phantom wallet connection issues
docs(readme): update installation instructions
```

#### PR Description Template
```markdown
## Summary
Brief description of what this PR accomplishes.

## Changes Made
- [ ] Feature implementation
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Type definitions updated

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Performance impact assessed

## Screenshots/Demo
[Include screenshots for UI changes or demo links]

## Breaking Changes
[List any breaking changes]

## Related Issues
Closes #123
Related to #456

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Tests added for new functionality
- [ ] Documentation updated
- [ ] No console.log statements left in code
- [ ] Performance impact considered
```

---

## Testing Guidelines

### Testing Strategy Overview

```
Testing Pyramid
├── Unit Tests (70%)
│   ├── Individual functions
│   ├── React components
│   ├── Service classes
│   └── Utility functions
│
├── Integration Tests (20%)
│   ├── API endpoints
│   ├── Database operations
│   ├── Component interactions
│   └── Service integrations
│
└── End-to-End Tests (10%)
    ├── User workflows
    ├── Cross-browser testing
    ├── Performance testing
    └── Accessibility testing
```

### Unit Testing Standards

#### Component Testing Example
```javascript
// Test file: src/shared/components/__tests__/VoteConfirmationModal.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VoteConfirmationModal } from '../VoteConfirmationModal';

// Mock dependencies
jest.mock('../ui/Modal', () => ({
  Modal: ({ children, isOpen, title }) => isOpen ? (
    <div data-testid="modal">
      <h2>{title}</h2>
      {children}
    </div>
  ) : null
}));

describe('VoteConfirmationModal', () => {
  const defaultProps = {
    isOpen: true,
    voteData: {
      id: 'vote-123',
      choice: 'yes',
      title: 'Test Proposal'
    },
    userBalance: 1000,
    onConfirm: jest.fn(),
    onCancel: jest.fn()
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when open', () => {
    render(<VoteConfirmationModal {...defaultProps} />);
    
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Confirm Vote')).toBeInTheDocument();
    expect(screen.getByText('You are voting: yes')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<VoteConfirmationModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('handles token amount input correctly', async () => {
    render(<VoteConfirmationModal {...defaultProps} />);
    
    const tokenInput = screen.getByLabelText('Tokens to Spend');
    fireEvent.change(tokenInput, { target: { value: '500' } });
    
    expect(tokenInput.value).toBe('500');
  });

  it('enables confirm button only with valid amount', async () => {
    render(<VoteConfirmationModal {...defaultProps} />);
    
    const confirmButton = screen.getByRole('button', { name: 'Confirm Vote' });
    const tokenInput = screen.getByLabelText('Tokens to Spend');
    
    // Initially disabled (no amount entered)
    expect(confirmButton).toBeDisabled();
    
    // Valid amount enables button
    fireEvent.change(tokenInput, { target: { value: '500' } });
    await waitFor(() => {
      expect(confirmButton).not.toBeDisabled();
    });
    
    // Invalid amount (exceeds balance) disables button
    fireEvent.change(tokenInput, { target: { value: '1500' } });
    await waitFor(() => {
      expect(confirmButton).toBeDisabled();
    });
  });

  it('calls onConfirm with correct data', async () => {
    render(<VoteConfirmationModal {...defaultProps} />);
    
    const tokenInput = screen.getByLabelText('Tokens to Spend');
    const confirmButton = screen.getByRole('button', { name: 'Confirm Vote' });
    
    fireEvent.change(tokenInput, { target: { value: '250' } });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(defaultProps.onConfirm).toHaveBeenCalledWith({
        id: 'vote-123',
        choice: 'yes',
        title: 'Test Proposal',
        tokenAmount: 250
      });
    });
  });

  it('shows loading state during submission', async () => {
    const slowOnConfirm = jest.fn(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    render(<VoteConfirmationModal {...defaultProps} onConfirm={slowOnConfirm} />);
    
    const tokenInput = screen.getByLabelText('Tokens to Spend');
    const confirmButton = screen.getByRole('button', { name: 'Confirm Vote' });
    
    fireEvent.change(tokenInput, { target: { value: '100' } });
    fireEvent.click(confirmButton);
    
    // Button should show loading state
    expect(confirmButton).toHaveAttribute('aria-busy', 'true');
    expect(confirmButton).toBeDisabled();
    
    await waitFor(() => {
      expect(confirmButton).not.toHaveAttribute('aria-busy');
    });
  });
});
```

#### Service Testing Example
```javascript
// Test file: src/features/voting/__tests__/solana-voting-system.test.js
import { SolanaVotingSystem } from '../solana-voting-system';
import { Connection } from '@solana/web3.js';

// Mock Solana dependencies
jest.mock('@solana/web3.js');
jest.mock('@solana/wallet-adapter-phantom');

describe('SolanaVotingSystem', () => {
  let votingSystem;
  let mockConnection;

  beforeEach(() => {
    mockConnection = {
      sendTransaction: jest.fn(),
      confirmTransaction: jest.fn(),
      getAccountInfo: jest.fn()
    };
    
    Connection.mockImplementation(() => mockConnection);
    
    votingSystem = new SolanaVotingSystem({
      rpcUrl: 'https://api.devnet.solana.com'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('submitVote', () => {
    const validVoteData = {
      voteId: 'vote-123',
      choice: 'yes',
      tokenAmount: 100,
      userWallet: 'wallet-address-123'
    };

    it('successfully submits a valid vote', async () => {
      const mockSignature = 'transaction-signature-123';
      mockConnection.sendTransaction.mockResolvedValue(mockSignature);
      mockConnection.confirmTransaction.mockResolvedValue({ confirmed: true });

      const result = await votingSystem.submitVote(validVoteData);

      expect(result.success).toBe(true);
      expect(result.signature).toBe(mockSignature);
      expect(mockConnection.sendTransaction).toHaveBeenCalledTimes(1);
    });

    it('rejects invalid vote data', async () => {
      const invalidVoteData = {
        // Missing required fields
        choice: 'yes'
      };

      await expect(votingSystem.submitVote(invalidVoteData))
        .rejects.toThrow('Invalid vote data');
    });

    it('handles transaction failures gracefully', async () => {
      const transactionError = new Error('Transaction failed');
      mockConnection.sendTransaction.mockRejectedValue(transactionError);

      const result = await votingSystem.submitVote(validVoteData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Transaction failed');
    });

    it('validates token amount against balance', async () => {
      const mockBalance = 50; // Less than vote amount
      mockConnection.getAccountInfo.mockResolvedValue({
        lamports: mockBalance * 1e9 // Convert to lamports
      });

      await expect(
        votingSystem.submitVote({
          ...validVoteData,
          tokenAmount: 100 // More than balance
        })
      ).rejects.toThrow('Insufficient balance');
    });
  });

  describe('getVoteHistory', () => {
    it('retrieves vote history for user', async () => {
      const mockHistory = [
        { voteId: 'vote-1', choice: 'yes', timestamp: Date.now() },
        { voteId: 'vote-2', choice: 'no', timestamp: Date.now() - 86400000 }
      ];

      // Mock API response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: mockHistory
        })
      });

      const result = await votingSystem.getVoteHistory('user-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHistory);
    });

    it('handles API errors gracefully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({
          error: 'Internal server error'
        })
      });

      const result = await votingSystem.getVoteHistory('user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('server error');
    });
  });
});
```

### Integration Testing

#### API Integration Tests
```javascript
// Test file: src/core/api/__tests__/voting.integration.test.js
import request from 'supertest';
import app from '../server.js';
import { setupTestDatabase, cleanupTestDatabase } from '../../test-utils/database';

describe('Voting API Integration Tests', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    await setupTestDatabase();
    
    // Create test user and get auth token
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        walletAddress: 'test-wallet-address'
      });

    testUser = userResponse.body.data;
    authToken = userResponse.body.token;
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('GET /api/voting/active', () => {
    it('returns active votes without authentication', async () => {
      const response = await request(app)
        .get('/api/voting/active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.votes)).toBe(true);
    });

    it('supports pagination parameters', async () => {
      const response = await request(app)
        .get('/api/voting/active?page=1&limit=5')
        .expect(200);

      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 5
      });
    });

    it('validates pagination parameters', async () => {
      await request(app)
        .get('/api/voting/active?page=0&limit=200')
        .expect(400);
    });
  });

  describe('POST /api/voting/vote', () => {
    let testVote;

    beforeEach(async () => {
      // Create a test vote
      testVote = await createTestVote();
    });

    it('submits vote with valid data and authentication', async () => {
      const voteData = {
        voteId: testVote.id,
        choice: 'yes',
        tokenAmount: 100,
        transactionSignature: 'mock-signature-123'
      };

      const response = await request(app)
        .post('/api/voting/vote')
        .set('Authorization', `Bearer ${authToken}`)
        .send(voteData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.vote.choice).toBe('yes');
    });

    it('rejects unauthenticated requests', async () => {
      const voteData = {
        voteId: testVote.id,
        choice: 'yes',
        tokenAmount: 100,
        transactionSignature: 'mock-signature-123'
      };

      await request(app)
        .post('/api/voting/vote')
        .send(voteData)
        .expect(401);
    });

    it('validates required fields', async () => {
      const invalidVoteData = {
        // Missing required fields
        choice: 'yes'
      };

      const response = await request(app)
        .post('/api/voting/vote')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidVoteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('prevents duplicate votes', async () => {
      const voteData = {
        voteId: testVote.id,
        choice: 'yes',
        tokenAmount: 100,
        transactionSignature: 'mock-signature-456'
      };

      // Submit first vote
      await request(app)
        .post('/api/voting/vote')
        .set('Authorization', `Bearer ${authToken}`)
        .send(voteData)
        .expect(201);

      // Attempt duplicate vote
      await request(app)
        .post('/api/voting/vote')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...voteData,
          transactionSignature: 'different-signature'
        })
        .expect(409);
    });
  });

  describe('GET /api/voting/history', () => {
    it('returns user vote history with authentication', async () => {
      const response = await request(app)
        .get('/api/voting/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.votes)).toBe(true);
    });

    it('requires authentication', async () => {
      await request(app)
        .get('/api/voting/history')
        .expect(401);
    });

    it('supports pagination', async () => {
      const response = await request(app)
        .get('/api/voting/history?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 10
      });
    });
  });
});

// Helper function
async function createTestVote() {
  return {
    id: 'test-vote-' + Date.now(),
    title: 'Test Vote',
    description: 'Test vote description',
    options: ['yes', 'no', 'abstain'],
    startTime: Date.now(),
    endTime: Date.now() + 86400000, // 24 hours
    active: true
  };
}
```

### End-to-End Testing

#### E2E Test Example with Puppeteer
```javascript
// Test file: tests/e2e/voting-flow.e2e.test.js
const puppeteer = require('puppeteer');

describe('Voting Flow E2E Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.CI === 'true',
      slowMo: process.env.DEBUG ? 250 : 0,
      devtools: process.env.DEBUG === 'true'
    });
    
    page = await browser.newPage();
    
    // Set viewport for consistent testing
    await page.setViewport({ width: 1200, height: 800 });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    // Navigate to voting page
    await page.goto('http://localhost:3000/voting', {
      waitUntil: 'networkidle0'
    });
  });

  it('completes full voting process', async () => {
    // Step 1: Connect wallet
    await page.click('[data-testid="connect-wallet-btn"]');
    await page.waitForSelector('[data-testid="wallet-connected"]', { timeout: 10000 });
    
    // Verify wallet connection
    const walletStatus = await page.textContent('[data-testid="wallet-status"]');
    expect(walletStatus).toContain('Connected');

    // Step 2: Select a vote
    await page.waitForSelector('[data-testid="vote-card"]');
    await page.click('[data-testid="vote-card"]:first-child');

    // Step 3: Choose vote option
    await page.click('[data-testid="vote-option-yes"]');
    
    // Step 4: Enter token amount
    await page.fill('[data-testid="token-amount-input"]', '100');

    // Step 5: Submit vote
    await page.click('[data-testid="submit-vote-btn"]');

    // Step 6: Confirm in modal
    await page.waitForSelector('[data-testid="vote-confirmation-modal"]');
    await page.click('[data-testid="confirm-vote-btn"]');

    // Step 7: Wait for transaction completion
    await page.waitForSelector('[data-testid="vote-success-message"]', {
      timeout: 30000 // Blockchain transactions can be slow
    });

    // Verify success
    const successMessage = await page.textContent('[data-testid="vote-success-message"]');
    expect(successMessage).toContain('Vote submitted successfully');

    // Verify vote appears in history
    await page.click('[data-testid="vote-history-tab"]');
    await page.waitForSelector('[data-testid="vote-history-item"]');
    
    const historyItems = await page.$$('[data-testid="vote-history-item"]');
    expect(historyItems.length).toBeGreaterThan(0);
  });

  it('handles wallet connection errors gracefully', async () => {
    // Mock wallet connection failure
    await page.evaluateOnNewDocument(() => {
      window.phantom = {
        solana: {
          connect: () => Promise.reject(new Error('User rejected'))
        }
      };
    });

    await page.reload({ waitUntil: 'networkidle0' });

    // Attempt to connect wallet
    await page.click('[data-testid="connect-wallet-btn"]');

    // Verify error message appears
    await page.waitForSelector('[data-testid="wallet-error-message"]');
    const errorMessage = await page.textContent('[data-testid="wallet-error-message"]');
    expect(errorMessage).toContain('connection failed');
  });

  it('validates token amount input', async () => {
    // Connect wallet first (assuming success)
    await mockWalletConnection();

    // Try to vote with invalid amount
    await page.click('[data-testid="vote-card"]:first-child');
    await page.click('[data-testid="vote-option-yes"]');
    
    // Enter amount exceeding balance
    await page.fill('[data-testid="token-amount-input"]', '999999');

    // Submit button should be disabled
    const submitButton = await page.$('[data-testid="submit-vote-btn"]');
    const isDisabled = await page.evaluate(btn => btn.disabled, submitButton);
    expect(isDisabled).toBe(true);

    // Error message should appear
    await page.waitForSelector('[data-testid="insufficient-balance-error"]');
  });

  it('shows real-time vote updates', async () => {
    // Connect wallet and navigate to an active vote
    await mockWalletConnection();
    await page.click('[data-testid="vote-card"]:first-child');

    // Get initial vote counts
    const initialYesCount = await page.textContent('[data-testid="yes-vote-count"]');
    
    // Submit a vote
    await page.click('[data-testid="vote-option-yes"]');
    await page.fill('[data-testid="token-amount-input"]', '50');
    await page.click('[data-testid="submit-vote-btn"]');
    await page.click('[data-testid="confirm-vote-btn"]');

    // Wait for real-time update
    await page.waitForFunction(
      (initialCount) => {
        const currentCount = document.querySelector('[data-testid="yes-vote-count"]').textContent;
        return currentCount !== initialCount;
      },
      {},
      initialYesCount
    );

    // Verify count increased
    const updatedYesCount = await page.textContent('[data-testid="yes-vote-count"]');
    expect(parseInt(updatedYesCount)).toBeGreaterThan(parseInt(initialYesCount));
  });

  // Helper function
  async function mockWalletConnection() {
    await page.evaluateOnNewDocument(() => {
      window.phantom = {
        solana: {
          isConnected: true,
          connect: () => Promise.resolve(),
          publicKey: { toString: () => 'mock-wallet-address' }
        }
      };
    });
    
    await page.reload({ waitUntil: 'networkidle0' });
    await page.click('[data-testid="connect-wallet-btn"]');
    await page.waitForSelector('[data-testid="wallet-connected"]');
  }
});
```

---

## Common Tasks & Examples

### Adding a New Feature

This section walks through adding a complete new feature to the MLG.clan platform.

#### Example: Adding Clan Achievement System

##### 1. Planning and Design
```markdown
## Feature: Clan Achievement System

### Requirements
- Track clan member activities
- Award achievements for milestones
- Display achievement badges on profiles
- Achievement notification system
- Achievement leaderboards

### Database Schema
```sql
-- achievements table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url VARCHAR(255),
  criteria JSONB NOT NULL,
  points INTEGER DEFAULT 0,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- user_achievements table
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  achievement_id UUID REFERENCES achievements(id),
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  progress JSONB,
  UNIQUE(user_id, achievement_id)
);
```

##### 2. Backend Implementation

###### Database Migration
```javascript
// src/core/database/migrations/003_achievements.sql
-- Create achievements system tables

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon_url VARCHAR(255),
  criteria JSONB NOT NULL,
  points INTEGER DEFAULT 0,
  category VARCHAR(50),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  progress JSONB DEFAULT '{}',
  notified BOOLEAN DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

-- Indexes for performance
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_earned_at ON user_achievements(earned_at);
CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_achievements_active ON achievements(active);

-- Insert default achievements
INSERT INTO achievements (name, description, criteria, points, category) VALUES
('First Vote', 'Cast your first vote in clan governance', '{"action": "vote", "count": 1}', 10, 'voting'),
('Voting Veteran', 'Cast 50 votes in clan governance', '{"action": "vote", "count": 50}', 100, 'voting'),
('Clan Founder', 'Create a new clan', '{"action": "create_clan", "count": 1}', 50, 'leadership'),
('Community Builder', 'Invite 10 members to your clan', '{"action": "invite_member", "count": 10}', 75, 'social');
```

###### Achievement Service
```javascript
// src/core/services/AchievementService.js
import { AchievementDAO } from '../data/daos/AchievementDAO.js';
import { NotificationService } from './NotificationService.js';
import { EventEmitter } from 'events';

class AchievementService extends EventEmitter {
  constructor(options = {}) {
    super();
    this.achievementDAO = new AchievementDAO(options);
    this.notificationService = new NotificationService(options);
  }

  /**
   * Check and award achievements for user action
   */
  async checkAchievements(userId, action, data = {}) {
    try {
      // Get all active achievements for this action type
      const achievements = await this.achievementDAO.getAchievementsByAction(action);
      const newlyEarned = [];

      for (const achievement of achievements) {
        // Check if user already has this achievement
        const hasAchievement = await this.achievementDAO.userHasAchievement(userId, achievement.id);
        if (hasAchievement) continue;

        // Update user progress
        const progress = await this.updateProgress(userId, achievement, action, data);
        
        // Check if achievement criteria is met
        if (this.criteriasMet(achievement.criteria, progress)) {
          await this.awardAchievement(userId, achievement);
          newlyEarned.push(achievement);
        }
      }

      // Send notifications for newly earned achievements
      if (newlyEarned.length > 0) {
        await this.notifyAchievements(userId, newlyEarned);
        this.emit('achievements_earned', { userId, achievements: newlyEarned });
      }

      return { success: true, newlyEarned };
    } catch (error) {
      console.error('Error checking achievements:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user progress towards achievement
   */
  async updateProgress(userId, achievement, action, data) {
    const currentProgress = await this.achievementDAO.getUserProgress(userId, achievement.id);
    
    let newProgress = { ...currentProgress };

    // Update progress based on action type
    switch (action) {
      case 'vote':
        newProgress.voteCount = (newProgress.voteCount || 0) + 1;
        break;
      case 'create_clan':
        newProgress.clansCreated = (newProgress.clansCreated || 0) + 1;
        break;
      case 'invite_member':
        newProgress.membersInvited = (newProgress.membersInvited || 0) + 1;
        break;
      case 'content_create':
        newProgress.contentCreated = (newProgress.contentCreated || 0) + 1;
        newProgress.totalLikes = (newProgress.totalLikes || 0) + (data.likes || 0);
        break;
    }

    // Save updated progress
    await this.achievementDAO.updateUserProgress(userId, achievement.id, newProgress);
    return newProgress;
  }

  /**
   * Check if achievement criteria is met
   */
  criteriasMet(criteria, progress) {
    for (const [key, requiredValue] of Object.entries(criteria)) {
      const currentValue = progress[key] || 0;
      
      if (typeof requiredValue === 'number') {
        if (currentValue < requiredValue) return false;
      } else if (typeof requiredValue === 'object') {
        // Handle complex criteria
        if (requiredValue.min && currentValue < requiredValue.min) return false;
        if (requiredValue.max && currentValue > requiredValue.max) return false;
      }
    }
    return true;
  }

  /**
   * Award achievement to user
   */
  async awardAchievement(userId, achievement) {
    await this.achievementDAO.awardAchievement(userId, achievement.id);
    
    // Update user points
    await this.achievementDAO.updateUserPoints(userId, achievement.points);
    
    console.log(`Achievement awarded: ${achievement.name} to user ${userId}`);
  }

  /**
   * Send achievement notifications
   */
  async notifyAchievements(userId, achievements) {
    for (const achievement of achievements) {
      await this.notificationService.sendNotification(userId, {
        type: 'achievement_earned',
        title: 'Achievement Unlocked!',
        message: `You earned the "${achievement.name}" achievement!`,
        data: { achievementId: achievement.id }
      });
    }
  }

  /**
   * Get user achievements
   */
  async getUserAchievements(userId) {
    return await this.achievementDAO.getUserAchievements(userId);
  }

  /**
   * Get achievement leaderboard
   */
  async getLeaderboard(limit = 50) {
    return await this.achievementDAO.getTopUsersByPoints(limit);
  }
}

export { AchievementService };
```

###### Achievement DAO
```javascript
// src/core/data/daos/AchievementDAO.js
import { BaseDAO } from './BaseDAO.js';

class AchievementDAO extends BaseDAO {
  /**
   * Get achievements by action type
   */
  async getAchievementsByAction(action) {
    const query = `
      SELECT * FROM achievements 
      WHERE active = true 
      AND criteria->>'action' = $1
      ORDER BY points ASC
    `;
    
    const result = await this.query(query, [action]);
    return result.rows;
  }

  /**
   * Check if user has specific achievement
   */
  async userHasAchievement(userId, achievementId) {
    const query = `
      SELECT 1 FROM user_achievements 
      WHERE user_id = $1 AND achievement_id = $2
    `;
    
    const result = await this.query(query, [userId, achievementId]);
    return result.rows.length > 0;
  }

  /**
   * Get user's progress for specific achievement
   */
  async getUserProgress(userId, achievementId) {
    const query = `
      SELECT progress FROM user_achievements 
      WHERE user_id = $1 AND achievement_id = $2
    `;
    
    const result = await this.query(query, [userId, achievementId]);
    
    if (result.rows.length > 0) {
      return result.rows[0].progress || {};
    }
    
    // Create progress entry if doesn't exist
    await this.query(
      'INSERT INTO user_achievements (user_id, achievement_id, progress) VALUES ($1, $2, $3)',
      [userId, achievementId, {}]
    );
    
    return {};
  }

  /**
   * Update user progress
   */
  async updateUserProgress(userId, achievementId, progress) {
    const query = `
      INSERT INTO user_achievements (user_id, achievement_id, progress)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, achievement_id)
      DO UPDATE SET progress = $3, updated_at = CURRENT_TIMESTAMP
    `;
    
    await this.query(query, [userId, achievementId, progress]);
  }

  /**
   * Award achievement to user
   */
  async awardAchievement(userId, achievementId) {
    const query = `
      UPDATE user_achievements 
      SET earned_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND achievement_id = $2 AND earned_at IS NULL
    `;
    
    await this.query(query, [userId, achievementId]);
  }

  /**
   * Update user total points
   */
  async updateUserPoints(userId, points) {
    // Assuming users table has a points column
    const query = `
      UPDATE users 
      SET achievement_points = COALESCE(achievement_points, 0) + $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    
    await this.query(query, [userId, points]);
  }

  /**
   * Get user achievements with details
   */
  async getUserAchievements(userId) {
    const query = `
      SELECT a.*, ua.earned_at, ua.progress
      FROM achievements a
      JOIN user_achievements ua ON a.id = ua.achievement_id
      WHERE ua.user_id = $1 AND ua.earned_at IS NOT NULL
      ORDER BY ua.earned_at DESC
    `;
    
    const result = await this.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get top users by achievement points
   */
  async getTopUsersByPoints(limit = 50) {
    const query = `
      SELECT u.id, u.username, u.achievement_points,
             COUNT(ua.id) as total_achievements
      FROM users u
      LEFT JOIN user_achievements ua ON u.id = ua.user_id AND ua.earned_at IS NOT NULL
      WHERE u.achievement_points > 0
      GROUP BY u.id, u.username, u.achievement_points
      ORDER BY u.achievement_points DESC, total_achievements DESC
      LIMIT $1
    `;
    
    const result = await this.query(query, [limit]);
    return result.rows;
  }
}

export { AchievementDAO };
```

###### API Routes
```javascript
// src/core/api/routes/achievements.routes.js
import express from 'express';
import { query, param } from 'express-validator';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { validationMiddleware } from '../middleware/validation.middleware.js';
import { AchievementController } from '../controllers/achievement.controller.js';

const router = express.Router();

// Get user achievements (authenticated)
router.get(
  '/user/:userId?',
  authMiddleware,
  param('userId').optional().isUUID(),
  validationMiddleware,
  AchievementController.getUserAchievements
);

// Get achievement leaderboard (public)
router.get(
  '/leaderboard',
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validationMiddleware,
  AchievementController.getLeaderboard
);

// Get all available achievements (public)
router.get(
  '/',
  query('category').optional().isString(),
  validationMiddleware,
  AchievementController.getAllAchievements
);

// Manual achievement check (authenticated, admin only)
router.post(
  '/check/:userId',
  authMiddleware,
  // requireRole('admin'), // Uncomment when role system is implemented
  param('userId').isUUID(),
  validationMiddleware,
  AchievementController.manualCheck
);

export default router;
```

###### API Controller
```javascript
// src/core/api/controllers/achievement.controller.js
import { AchievementService } from '../../services/AchievementService.js';
import { createApiResponse, createApiError } from '../utils/response.js';

class AchievementController {
  static async getUserAchievements(req, res, next) {
    try {
      const userId = req.params.userId || req.user.id;
      
      // Check if user is requesting their own achievements or has permission
      if (userId !== req.user.id && !req.user.isAdmin) {
        return next(createApiError('Access denied', 403));
      }

      const achievements = await AchievementService.getUserAchievements(userId);

      res.json(createApiResponse(
        { achievements },
        'User achievements retrieved successfully'
      ));
    } catch (error) {
      next(createApiError('Failed to retrieve achievements', 500, error));
    }
  }

  static async getLeaderboard(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 50;

      const leaderboard = await AchievementService.getLeaderboard(limit);

      res.json(createApiResponse(
        { leaderboard },
        'Achievement leaderboard retrieved successfully'
      ));
    } catch (error) {
      next(createApiError('Failed to retrieve leaderboard', 500, error));
    }
  }

  static async getAllAchievements(req, res, next) {
    try {
      const { category } = req.query;

      // This would require adding method to service
      const achievements = await AchievementService.getAllAchievements({ category });

      res.json(createApiResponse(
        { achievements },
        'Achievements retrieved successfully'
      ));
    } catch (error) {
      next(createApiError('Failed to retrieve achievements', 500, error));
    }
  }

  static async manualCheck(req, res, next) {
    try {
      const { userId } = req.params;

      const result = await AchievementService.checkAllAchievements(userId);

      res.json(createApiResponse(
        result,
        'Achievement check completed'
      ));
    } catch (error) {
      next(createApiError('Failed to check achievements', 500, error));
    }
  }
}

export { AchievementController };
```

##### 3. Frontend Implementation

###### Achievement Components
```javascript
// src/shared/components/achievements/AchievementBadge.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Card } from '../ui/Card';

const AchievementBadge = ({ achievement, earned = false, progress = null }) => {
  const progressPercentage = progress 
    ? Math.min((progress.current / progress.required) * 100, 100)
    : 0;

  return (
    <Card 
      className={`achievement-badge ${earned ? 'earned' : 'unearned'}`}
      hoverable={earned}
    >
      <div className="achievement-icon">
        <img 
          src={achievement.iconUrl} 
          alt={achievement.name}
          className={earned ? 'icon-earned' : 'icon-locked'}
        />
        {!earned && progress && (
          <div className="progress-overlay">
            <div 
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}
      </div>
      
      <div className="achievement-info">
        <h3 className={earned ? 'text-gold' : 'text-gray'}>
          {achievement.name}
        </h3>
        <p className="text-sm text-gray-600">
          {achievement.description}
        </p>
        
        {!earned && progress && (
          <div className="progress-text">
            {progress.current} / {progress.required}
          </div>
        )}
        
        {earned && (
          <div className="achievement-points">
            +{achievement.points} points
          </div>
        )}
      </div>
    </Card>
  );
};

AchievementBadge.propTypes = {
  achievement: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    iconUrl: PropTypes.string.isRequired,
    points: PropTypes.number.isRequired
  }).isRequired,
  earned: PropTypes.bool,
  progress: PropTypes.shape({
    current: PropTypes.number.isRequired,
    required: PropTypes.number.isRequired
  })
};

export { AchievementBadge };
```

```javascript
// src/shared/components/achievements/AchievementGrid.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { AchievementBadge } from './AchievementBadge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useAchievements } from '../../hooks/useAchievements';

const AchievementGrid = ({ userId }) => {
  const {
    achievements,
    userAchievements,
    loading,
    error,
    fetchUserAchievements
  } = useAchievements();

  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchUserAchievements(userId);
  }, [userId, fetchUserAchievements]);

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  if (error) {
    return <div className="error-message">Failed to load achievements</div>;
  }

  const earnedIds = new Set(userAchievements.map(ua => ua.achievementId));
  
  const filteredAchievements = achievements.filter(achievement => {
    if (filter === 'earned') return earnedIds.has(achievement.id);
    if (filter === 'unearned') return !earnedIds.has(achievement.id);
    return true;
  });

  return (
    <div className="achievement-grid">
      <div className="achievement-filters">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All ({achievements.length})
        </button>
        <button 
          className={filter === 'earned' ? 'active' : ''}
          onClick={() => setFilter('earned')}
        >
          Earned ({userAchievements.length})
        </button>
        <button 
          className={filter === 'unearned' ? 'active' : ''}
          onClick={() => setFilter('unearned')}
        >
          Unearned ({achievements.length - userAchievements.length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map(achievement => (
          <AchievementBadge
            key={achievement.id}
            achievement={achievement}
            earned={earnedIds.has(achievement.id)}
            progress={getAchievementProgress(achievement, userAchievements)}
          />
        ))}
      </div>
    </div>
  );
};

// Helper function to get achievement progress
function getAchievementProgress(achievement, userAchievements) {
  const userAchievement = userAchievements.find(
    ua => ua.achievementId === achievement.id
  );
  
  if (!userAchievement || !userAchievement.progress) return null;

  const criteria = achievement.criteria;
  const progress = userAchievement.progress;

  // Calculate progress based on criteria type
  if (criteria.voteCount) {
    return {
      current: progress.voteCount || 0,
      required: criteria.voteCount
    };
  }

  if (criteria.clansCreated) {
    return {
      current: progress.clansCreated || 0,
      required: criteria.clansCreated
    };
  }

  return null;
}

AchievementGrid.propTypes = {
  userId: PropTypes.string.isRequired
};

export { AchievementGrid };
```

###### Custom Hook for Achievements
```javascript
// src/shared/hooks/useAchievements.js
import { useState, useCallback } from 'react';
import { MLGApiClient } from '../utils/api/mlg-api-client-consolidated';

const useAchievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAllAchievements = useCallback(async (category = null) => {
    setLoading(true);
    try {
      const params = category ? { category } : {};
      const response = await MLGApiClient.get('/achievements', { params });
      
      if (response.success) {
        setAchievements(response.data.achievements);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to fetch achievements');
      console.error('Achievement fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserAchievements = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await MLGApiClient.get(`/achievements/user/${userId}`);
      
      if (response.success) {
        setUserAchievements(response.data.achievements);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to fetch user achievements');
      console.error('User achievement fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeaderboard = useCallback(async (limit = 50) => {
    setLoading(true);
    try {
      const response = await MLGApiClient.get('/achievements/leaderboard', {
        params: { limit }
      });
      
      if (response.success) {
        setLeaderboard(response.data.leaderboard);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to fetch leaderboard');
      console.error('Leaderboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const manualCheck = useCallback(async (userId) => {
    try {
      const response = await MLGApiClient.post(`/achievements/check/${userId}`);
      
      if (response.success) {
        // Refresh user achievements if any were newly earned
        if (response.data.newlyEarned.length > 0) {
          await fetchUserAchievements(userId);
        }
        return response.data;
      } else {
        setError(response.error);
        return null;
      }
    } catch (err) {
      setError('Failed to check achievements');
      console.error('Achievement check error:', err);
      return null;
    }
  }, [fetchUserAchievements]);

  return {
    achievements,
    userAchievements,
    leaderboard,
    loading,
    error,
    fetchAllAchievements,
    fetchUserAchievements,
    fetchLeaderboard,
    manualCheck
  };
};

export { useAchievements };
```

##### 4. Integration with Existing Systems

###### Integrate with Voting System
```javascript
// src/features/voting/solana-voting-system.js
// Add to existing voting system

import { AchievementService } from '../../core/services/AchievementService.js';

class SolanaVotingSystem {
  // ... existing code ...

  async submitVote(voteData) {
    try {
      // ... existing vote submission logic ...

      // After successful vote submission
      if (result.success) {
        // Check for voting achievements
        await AchievementService.checkAchievements(
          voteData.userId,
          'vote',
          {
            voteId: voteData.voteId,
            tokenAmount: voteData.tokenAmount
          }
        );
      }

      return result;
    } catch (error) {
      // ... existing error handling ...
    }
  }
}
```

###### Add to Clan Management
```javascript
// src/features/clans/clan-management.js
// Add to existing clan system

import { AchievementService } from '../../core/services/AchievementService.js';

class ClanManager {
  // ... existing code ...

  async createClan(clanData, creatorId) {
    try {
      // ... existing clan creation logic ...

      if (result.success) {
        // Check for clan creation achievements
        await AchievementService.checkAchievements(
          creatorId,
          'create_clan',
          {
            clanId: result.clan.id,
            clanName: clanData.name
          }
        );
      }

      return result;
    } catch (error) {
      // ... existing error handling ...
    }
  }

  async inviteMember(clanId, inviterId, inviteeData) {
    try {
      // ... existing invitation logic ...

      if (result.success) {
        // Check for invitation achievements
        await AchievementService.checkAchievements(
          inviterId,
          'invite_member',
          {
            clanId,
            inviteeId: result.invitation.inviteeId
          }
        );
      }

      return result;
    } catch (error) {
      // ... existing error handling ...
    }
  }
}
```

##### 5. Testing the New Feature

###### Unit Tests
```javascript
// src/core/services/__tests__/AchievementService.test.js
import { AchievementService } from '../AchievementService';
import { AchievementDAO } from '../data/daos/AchievementDAO';
import { NotificationService } from '../NotificationService';

// Mock dependencies
jest.mock('../data/daos/AchievementDAO');
jest.mock('../NotificationService');

describe('AchievementService', () => {
  let achievementService;
  let mockAchievementDAO;
  let mockNotificationService;

  beforeEach(() => {
    mockAchievementDAO = new AchievementDAO();
    mockNotificationService = new NotificationService();
    achievementService = new AchievementService();
    
    achievementService.achievementDAO = mockAchievementDAO;
    achievementService.notificationService = mockNotificationService;
  });

  describe('checkAchievements', () => {
    it('awards achievement when criteria is met', async () => {
      const userId = 'user-123';
      const action = 'vote';
      const achievement = {
        id: 'achievement-1',
        name: 'First Vote',
        criteria: { voteCount: 1 },
        points: 10
      };

      mockAchievementDAO.getAchievementsByAction.mockResolvedValue([achievement]);
      mockAchievementDAO.userHasAchievement.mockResolvedValue(false);
      mockAchievementDAO.getUserProgress.mockResolvedValue({ voteCount: 0 });

      const result = await achievementService.checkAchievements(userId, action);

      expect(result.success).toBe(true);
      expect(result.newlyEarned).toHaveLength(1);
      expect(result.newlyEarned[0]).toEqual(achievement);
      expect(mockAchievementDAO.awardAchievement).toHaveBeenCalledWith(userId, achievement.id);
    });

    it('does not award achievement if user already has it', async () => {
      const userId = 'user-123';
      const action = 'vote';
      const achievement = {
        id: 'achievement-1',
        name: 'First Vote',
        criteria: { voteCount: 1 }
      };

      mockAchievementDAO.getAchievementsByAction.mockResolvedValue([achievement]);
      mockAchievementDAO.userHasAchievement.mockResolvedValue(true);

      const result = await achievementService.checkAchievements(userId, action);

      expect(result.newlyEarned).toHaveLength(0);
      expect(mockAchievementDAO.awardAchievement).not.toHaveBeenCalled();
    });

    it('updates progress without awarding if criteria not met', async () => {
      const userId = 'user-123';
      const action = 'vote';
      const achievement = {
        id: 'achievement-1',
        name: 'Voting Veteran',
        criteria: { voteCount: 50 }
      };

      mockAchievementDAO.getAchievementsByAction.mockResolvedValue([achievement]);
      mockAchievementDAO.userHasAchievement.mockResolvedValue(false);
      mockAchievementDAO.getUserProgress.mockResolvedValue({ voteCount: 25 });

      const result = await achievementService.checkAchievements(userId, action);

      expect(result.newlyEarned).toHaveLength(0);
      expect(mockAchievementDAO.updateUserProgress).toHaveBeenCalledWith(
        userId,
        achievement.id,
        { voteCount: 26 }
      );
    });
  });

  describe('criteriasMet', () => {
    it('returns true when all criteria are met', () => {
      const criteria = { voteCount: 10, clansJoined: 2 };
      const progress = { voteCount: 15, clansJoined: 3 };

      const result = achievementService.criteriasMet(criteria, progress);
      expect(result).toBe(true);
    });

    it('returns false when criteria are not met', () => {
      const criteria = { voteCount: 10, clansJoined: 2 };
      const progress = { voteCount: 5, clansJoined: 3 };

      const result = achievementService.criteriasMet(criteria, progress);
      expect(result).toBe(false);
    });
  });
});
```

###### Integration Tests
```javascript
// src/core/api/__tests__/achievements.integration.test.js
import request from 'supertest';
import app from '../server.js';
import { setupTestDatabase, cleanupTestDatabase } from '../../test-utils/database';

describe('Achievements API Integration', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    await setupTestDatabase();
    
    // Create test user
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

    testUser = userResponse.body.data;
    authToken = userResponse.body.token;
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('GET /api/achievements', () => {
    it('returns list of all achievements', async () => {
      const response = await request(app)
        .get('/api/achievements')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.achievements)).toBe(true);
      expect(response.body.data.achievements.length).toBeGreaterThan(0);
    });

    it('filters achievements by category', async () => {
      const response = await request(app)
        .get('/api/achievements?category=voting')
        .expect(200);

      expect(response.body.success).toBe(true);
      const achievements = response.body.data.achievements;
      expect(achievements.every(a => a.category === 'voting')).toBe(true);
    });
  });

  describe('GET /api/achievements/user/:userId', () => {
    it('returns user achievements with authentication', async () => {
      const response = await request(app)
        .get(`/api/achievements/user/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.achievements)).toBe(true);
    });

    it('requires authentication', async () => {
      await request(app)
        .get(`/api/achievements/user/${testUser.id}`)
        .expect(401);
    });
  });

  describe('GET /api/achievements/leaderboard', () => {
    it('returns achievement leaderboard', async () => {
      const response = await request(app)
        .get('/api/achievements/leaderboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.leaderboard)).toBe(true);
    });

    it('supports limit parameter', async () => {
      const response = await request(app)
        .get('/api/achievements/leaderboard?limit=10')
        .expect(200);

      const leaderboard = response.body.data.leaderboard;
      expect(leaderboard.length).toBeLessThanOrEqual(10);
    });
  });
});
```

##### 6. Documentation and Deployment

###### Update API Documentation
```yaml
# Add to existing OpenAPI spec
paths:
  /achievements:
    get:
      summary: Get all achievements
      tags: [Achievements]
      parameters:
        - name: category
          in: query
          schema:
            type: string
          description: Filter by achievement category
      responses:
        200:
          description: List of achievements
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: object
                    properties:
                      achievements:
                        type: array
                        items:
                          $ref: '#/components/schemas/Achievement'

  /achievements/user/{userId}:
    get:
      summary: Get user achievements
      tags: [Achievements]
      security:
        - BearerAuth: []
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        200:
          description: User achievements
        401:
          description: Unauthorized
        403:
          description: Access denied

components:
  schemas:
    Achievement:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        description:
          type: string
        iconUrl:
          type: string
        criteria:
          type: object
        points:
          type: integer
        category:
          type: string
        active:
          type: boolean
```

This comprehensive example demonstrates the complete process of adding a new feature to the MLG.clan platform, from planning and database design to implementation, testing, and documentation. The achievement system integrates cleanly with existing systems while maintaining code quality standards and architectural principles.

This completes the comprehensive developer onboarding guide for the MLG.clan platform. The guide provides all the necessary information for new developers to understand the architecture, set up their development environment, follow coding standards, and contribute effectively to the platform.