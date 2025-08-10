# MLG.clan Gaming Platform

A complete competitive gaming platform built on Solana blockchain with MLG token integration, clan management, voting systems, and content curation.

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ 
- NPM or Yarn
- Phantom Wallet browser extension

### Installation

1. **Clone the repository** (or you already have it)
2. **Install dependencies:**
```bash
npm install
```

3. **Environment setup:**
   - Copy `.env.example` to `.env` 
   - The `.env` file is already configured with the real MLG token address

4. **Start the development server:**
```bash
npm run dev
```

5. **Open your browser:**
   - Main platform: http://localhost:3000
   - Voting demo: http://localhost:3000/demo/voting
   - Burn vote demo: http://localhost:3000/demo/burn-vote
   - Clan management: http://localhost:3000/demo/clan-management
   - Content submission: http://localhost:3000/demo/content-submission

## 🎮 Platform Features

### ✅ **Completed Systems**

- **🗳️ Voting System** - MLG token burn-to-vote with Phantom wallet integration
- **📝 Content Curation** - Community-driven content management and moderation  
- **👥 Clan Management** - Token-staked clans with role hierarchies and governance
- **🏆 Leaderboards** - Multi-category clan rankings and competitive analytics
- **🎖️ Achievements** - NFT-backed achievement system with MLG token rewards
- **📊 Statistics** - Comprehensive analytics and performance tracking
- **🎨 Retro UI** - Xbox 360-inspired gaming interface

### 🔑 **Key Technologies**

- **Blockchain:** Solana mainnet with real MLG token (7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL)
- **Wallet:** Phantom wallet adapter integration  
- **Frontend:** Modern ES6 modules with responsive design
- **Testing:** Jest with 95%+ coverage across components

## 🧪 Testing

Run the comprehensive test suite:
```bash
npm test
```

View test coverage:
```bash
npm run test:coverage
```

## 📁 Directory Structure

```
src/
├── clans/          # Clan management, voting, leaderboards, achievements
├── content/        # Content curation, moderation, rewards
├── tokens/         # MLG token integration and utilities  
├── ui/             # React components and demos
├── voting/         # Core voting system with burn mechanics
├── wallet/         # Phantom wallet integration
└── config/         # Solana network and token configuration
```

## 🔧 Configuration

### Environment Variables

The platform uses these key environment variables (already configured in `.env`):

- `REACT_APP_MLG_TOKEN_ADDRESS` - Real MLG token contract address
- `REACT_APP_SOLANA_NETWORK` - Network configuration (mainnet-beta)
- `REACT_APP_SOLANA_RPC_URL` - Primary RPC endpoint

### MLG Token Integration

The platform integrates with the real MLG SPL token:
- **Contract:** `7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL`
- **Network:** Solana Mainnet
- **Decimals:** 9 (standard SPL token format)

## 🎯 Demo Scenarios

### 1. **Voting System Demo**
- Create proposals with different voting pools
- Cast votes with role-based weights
- Burn MLG tokens for additional voting power
- View real-time results and analytics

### 2. **Clan Management Demo**  
- Create token-staked clans (Bronze: 100 MLG, Silver: 500 MLG, etc.)
- Manage members with role hierarchies
- Track clan statistics and achievements
- View leaderboard rankings

### 3. **Content Curation Demo**
- Submit gaming content with validation
- Participate in community moderation
- Earn rewards for quality contributions
- Track content performance metrics

## 🔐 Security Features

- **Phantom Wallet Integration** - Secure transaction signing
- **Token Gating** - MLG token requirements for premium features
- **Permission System** - Role-based access controls
- **Rate Limiting** - Abuse prevention mechanisms
- **Input Validation** - Comprehensive sanitization and validation

## 📱 Mobile Support

The platform is fully responsive with:
- Touch-friendly interfaces
- Mobile-optimized layouts  
- Progressive Web App features
- Cross-device synchronization

## 🏆 Production Ready

All systems include:
- Comprehensive error handling
- Loading states and user feedback
- Accessibility compliance (WCAG 2.1 AA)
- Performance optimizations
- Security best practices

## 🤝 Contributing

The platform follows enterprise development practices:
- ES6 modules with JSDoc documentation
- Jest testing with high coverage requirements
- Storybook component documentation
- Code reviews and quality gates

## 📞 Support

For technical issues or questions about the MLG.clan platform, please check:
1. Test reports in the root directory
2. Component README files in `/src/ui/components/`
3. Integration examples in `/src/*/examples/`

---

**🎮 Ready to experience the future of competitive gaming communities!** 

Launch the development server and explore the full MLG.clan ecosystem with real Solana blockchain integration.