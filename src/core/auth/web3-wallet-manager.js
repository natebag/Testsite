/**
 * Web3 Wallet Manager for MLG.clan Gaming Platform
 * Advanced multi-wallet support with gaming optimizations
 * 
 * Features:
 * - Phantom, Solflare, Backpack wallet integration
 * - Gaming-optimized wallet switching
 * - Token-gated access controls
 * - NFT-based authentication for achievements
 * - Multi-wallet session management
 * - Gaming performance optimizations
 * 
 * @author Claude Code - Security and Performance Auditor
 * @version 2.0.0
 * @created 2025-08-13
 */

import { PublicKey, Connection, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import bs58 from 'bs58';
import nacl from 'tweetnacl';

/**
 * Web3 Wallet Configuration
 */
const WEB3_CONFIG = {
  // Solana Network Configuration
  SOLANA_NETWORKS: {
    mainnet: {
      name: 'Mainnet Beta',
      rpc: 'https://api.mainnet-beta.solana.com',
      chainId: 101
    },
    devnet: {
      name: 'Devnet',
      rpc: 'https://api.devnet.solana.com',
      chainId: 102
    },
    testnet: {
      name: 'Testnet',
      rpc: 'https://api.testnet.solana.com',
      chainId: 103
    }
  },
  
  // MLG Token Configuration
  MLG_TOKEN: {
    mintAddress: process.env.MLG_TOKEN_MINT || 'MLGTokenMintAddressHere',
    decimals: 9,
    symbol: 'MLG',
    name: 'MLG.clan Token'
  },
  
  // Gaming NFT Collections
  GAMING_NFT_COLLECTIONS: {
    achievements: process.env.ACHIEVEMENT_NFT_COLLECTION,
    tournament_badges: process.env.TOURNAMENT_NFT_COLLECTION,
    clan_badges: process.env.CLAN_NFT_COLLECTION
  },
  
  // Performance Settings
  CONNECTION_TIMEOUT: 5000, // 5 seconds
  TRANSACTION_TIMEOUT: 30000, // 30 seconds
  BALANCE_CACHE_TTL: 60000, // 1 minute
  
  // Wallet Detection
  WALLET_DETECTION_TIMEOUT: 1000, // 1 second
  
  // Gaming Features
  MINIMUM_MLG_FOR_VOTING: 100,
  MINIMUM_MLG_FOR_TOURNAMENTS: 50,
  CLAN_CREATION_COST: 1000
};

/**
 * Supported Wallet Providers
 */
const WALLET_PROVIDERS = {
  phantom: {
    name: 'Phantom',
    icon: '/assets/icons/phantom.svg',
    downloadUrl: 'https://phantom.app/',
    detectMethod: () => window.solana?.isPhantom,
    getProvider: () => window.solana
  },
  solflare: {
    name: 'Solflare',
    icon: '/assets/icons/solflare.svg',
    downloadUrl: 'https://solflare.com/',
    detectMethod: () => window.solflare?.isSolflare,
    getProvider: () => window.solflare
  },
  backpack: {
    name: 'Backpack',
    icon: '/assets/icons/backpack.svg',
    downloadUrl: 'https://backpack.app/',
    detectMethod: () => window.backpack?.isBackpack,
    getProvider: () => window.backpack
  },
  ledger: {
    name: 'Ledger',
    icon: '/assets/icons/ledger.svg',
    downloadUrl: 'https://www.ledger.com/',
    detectMethod: () => false, // Requires special handling
    getProvider: () => null
  }
};

/**
 * Web3 Wallet Manager Class
 */
class Web3WalletManager {
  constructor(options = {}) {
    this.network = options.network || 'mainnet';
    this.connection = new Connection(WEB3_CONFIG.SOLANA_NETWORKS[this.network].rpc);
    this.logger = options.logger || console;
    this.authService = options.authService;
    
    // Wallet state
    this.connectedWallet = null;
    this.walletProvider = null;
    this.publicKey = null;
    this.walletType = null;
    
    // Multi-wallet management
    this.connectedWallets = new Map();
    this.primaryWallet = null;
    
    // Performance optimization
    this.balanceCache = new Map();
    this.nftCache = new Map();
    this.lastBalanceCheck = new Map();
    
    // Event listeners
    this.eventListeners = {
      connect: new Set(),
      disconnect: new Set(),
      accountChanged: new Set(),
      networkChanged: new Set(),
      error: new Set()
    };
    
    this.init();
  }
  
  async init() {
    this.logger.info('🔗 Initializing Web3 Wallet Manager...');
    
    // Detect available wallets
    await this.detectAvailableWallets();
    
    // Setup wallet event listeners
    this.setupWalletEventListeners();
    
    // Check for existing connections
    await this.checkExistingConnections();
    
    // Setup automatic reconnection
    this.setupAutoReconnect();
    
    this.logger.info('✅ Web3 Wallet Manager initialized');
  }
  
  /**
   * Detect Available Wallets
   */
  async detectAvailableWallets() {
    this.availableWallets = {};
    
    for (const [walletType, config] of Object.entries(WALLET_PROVIDERS)) {
      try {
        // Give wallets time to inject
        await new Promise(resolve => setTimeout(resolve, WEB3_CONFIG.WALLET_DETECTION_TIMEOUT));
        
        if (config.detectMethod()) {
          this.availableWallets[walletType] = {
            ...config,
            available: true,
            provider: config.getProvider()
          };
          this.logger.info(`📱 Detected ${config.name} wallet`);
        } else {
          this.availableWallets[walletType] = {
            ...config,
            available: false,
            provider: null
          };
        }
      } catch (error) {
        this.logger.warn(`Failed to detect ${config.name}:`, error);
        this.availableWallets[walletType] = {
          ...config,
          available: false,
          provider: null
        };
      }
    }
  }
  
  /**
   * Connect to Wallet
   */
  async connectWallet(walletType, options = {}) {
    try {
      if (!this.availableWallets[walletType]?.available) {
        throw new Error(`${walletType} wallet is not available`);
      }
      
      const provider = this.availableWallets[walletType].provider;
      
      // Connect to wallet
      const response = await Promise.race([
        provider.connect({ onlyIfTrusted: false }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), WEB3_CONFIG.CONNECTION_TIMEOUT)
        )
      ]);
      
      // Store connection info
      this.connectedWallet = provider;
      this.walletProvider = provider;
      this.publicKey = response.publicKey;
      this.walletType = walletType;
      
      // Add to connected wallets
      this.connectedWallets.set(walletType, {
        provider,
        publicKey: response.publicKey,
        connectedAt: new Date(),
        lastUsed: new Date()
      });
      
      // Set as primary if first connection
      if (!this.primaryWallet) {
        this.primaryWallet = walletType;
      }
      
      // Get initial token balances and NFTs
      await this.refreshWalletData();
      
      // Emit connect event
      this.emit('connect', {
        walletType,
        publicKey: response.publicKey.toString(),
        provider
      });
      
      this.logger.info(`✅ Connected to ${walletType} wallet: ${response.publicKey.toString()}`);
      
      return {
        success: true,
        walletType,
        publicKey: response.publicKey.toString(),
        address: response.publicKey.toString()
      };
      
    } catch (error) {
      this.logger.error(`Failed to connect to ${walletType}:`, error);
      this.emit('error', { type: 'connection_failed', walletType, error });
      throw error;
    }
  }
  
  /**
   * Switch Between Connected Wallets
   */
  async switchWallet(walletType) {
    if (!this.connectedWallets.has(walletType)) {
      throw new Error(`${walletType} is not connected`);
    }
    
    const walletInfo = this.connectedWallets.get(walletType);
    
    // Update current wallet
    this.connectedWallet = walletInfo.provider;
    this.walletProvider = walletInfo.provider;
    this.publicKey = walletInfo.publicKey;
    this.walletType = walletType;
    this.primaryWallet = walletType;
    
    // Update last used
    walletInfo.lastUsed = new Date();
    
    // Refresh wallet data
    await this.refreshWalletData();
    
    this.emit('accountChanged', {
      walletType,
      publicKey: walletInfo.publicKey.toString()
    });
    
    this.logger.info(`🔄 Switched to ${walletType} wallet`);
  }
  
  /**
   * Disconnect Wallet
   */
  async disconnectWallet(walletType = null) {
    const targetWallet = walletType || this.walletType;
    
    if (targetWallet && this.connectedWallets.has(targetWallet)) {
      const walletInfo = this.connectedWallets.get(targetWallet);
      
      try {
        if (walletInfo.provider.disconnect) {
          await walletInfo.provider.disconnect();
        }
      } catch (error) {
        this.logger.warn(`Error disconnecting ${targetWallet}:`, error);
      }
      
      // Remove from connected wallets
      this.connectedWallets.delete(targetWallet);
      
      // Clear current wallet if it was the disconnected one
      if (this.walletType === targetWallet) {
        this.connectedWallet = null;
        this.walletProvider = null;
        this.publicKey = null;
        this.walletType = null;
        
        // Switch to another connected wallet if available
        if (this.connectedWallets.size > 0) {
          const nextWallet = this.connectedWallets.keys().next().value;
          await this.switchWallet(nextWallet);
        } else {
          this.primaryWallet = null;
        }
      }
      
      // Clear caches for this wallet
      this.clearWalletCaches(targetWallet);
      
      this.emit('disconnect', { walletType: targetWallet });
      this.logger.info(`❌ Disconnected ${targetWallet} wallet`);
    }
  }
  
  /**
   * Sign Message for Authentication
   */
  async signMessage(message) {
    if (!this.connectedWallet || !this.publicKey) {
      throw new Error('No wallet connected');
    }
    
    try {
      const encodedMessage = new TextEncoder().encode(message);
      const signature = await this.connectedWallet.signMessage(encodedMessage);
      
      return {
        signature: bs58.encode(signature),
        publicKey: this.publicKey.toString(),
        message
      };
    } catch (error) {
      this.logger.error('Message signing failed:', error);
      throw error;
    }
  }
  
  /**
   * Sign Transaction
   */
  async signTransaction(transaction) {
    if (!this.connectedWallet) {
      throw new Error('No wallet connected');
    }
    
    try {
      const signedTransaction = await this.connectedWallet.signTransaction(transaction);
      return signedTransaction;
    } catch (error) {
      this.logger.error('Transaction signing failed:', error);
      throw error;
    }
  }
  
  /**
   * Get MLG Token Balance
   */
  async getMLGTokenBalance(publicKey = null) {
    const targetKey = publicKey || this.publicKey;
    if (!targetKey) {
      throw new Error('No public key provided');
    }
    
    const cacheKey = `mlg_balance:${targetKey.toString()}`;
    const lastCheck = this.lastBalanceCheck.get(cacheKey);
    
    // Use cache if recent
    if (lastCheck && Date.now() - lastCheck < WEB3_CONFIG.BALANCE_CACHE_TTL) {
      const cached = this.balanceCache.get(cacheKey);
      if (cached !== undefined) {
        return cached;
      }
    }
    
    try {
      const tokenAccount = await getAssociatedTokenAddress(
        new PublicKey(WEB3_CONFIG.MLG_TOKEN.mintAddress),
        new PublicKey(targetKey.toString())
      );
      
      const balance = await this.connection.getTokenAccountBalance(tokenAccount);
      const amount = balance.value.uiAmount || 0;
      
      // Cache the result
      this.balanceCache.set(cacheKey, amount);
      this.lastBalanceCheck.set(cacheKey, Date.now());
      
      return amount;
    } catch (error) {
      // Account might not exist yet
      this.logger.debug(`MLG token account not found for ${targetKey.toString()}`);
      this.balanceCache.set(cacheKey, 0);
      this.lastBalanceCheck.set(cacheKey, Date.now());
      return 0;
    }
  }
  
  /**
   * Get Gaming NFTs (Achievements, Tournament Badges, etc.)
   */
  async getGamingNFTs(publicKey = null) {
    const targetKey = publicKey || this.publicKey;
    if (!targetKey) {
      throw new Error('No public key provided');
    }
    
    const cacheKey = `nfts:${targetKey.toString()}`;
    const cached = this.nftCache.get(cacheKey);
    
    // Use cache if recent (NFTs don't change often)
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes
      return cached.data;
    }
    
    try {
      // Get all token accounts for the wallet
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        new PublicKey(targetKey.toString()),
        { programId: TOKEN_PROGRAM_ID }
      );
      
      const nfts = {
        achievements: [],
        tournamentBadges: [],
        clanBadges: [],
        total: 0
      };
      
      // Filter for NFTs (tokens with supply of 1)
      for (const account of tokenAccounts.value) {
        const tokenInfo = account.account.data.parsed.info;
        if (tokenInfo.tokenAmount.amount === '1' && tokenInfo.tokenAmount.decimals === 0) {
          // This is likely an NFT, categorize it
          const mint = tokenInfo.mint;
          
          // Check against known collections
          if (WEB3_CONFIG.GAMING_NFT_COLLECTIONS.achievements && 
              mint.includes(WEB3_CONFIG.GAMING_NFT_COLLECTIONS.achievements)) {
            nfts.achievements.push(mint);
          } else if (WEB3_CONFIG.GAMING_NFT_COLLECTIONS.tournament_badges && 
                     mint.includes(WEB3_CONFIG.GAMING_NFT_COLLECTIONS.tournament_badges)) {
            nfts.tournamentBadges.push(mint);
          } else if (WEB3_CONFIG.GAMING_NFT_COLLECTIONS.clan_badges && 
                     mint.includes(WEB3_CONFIG.GAMING_NFT_COLLECTIONS.clan_badges)) {
            nfts.clanBadges.push(mint);
          }
        }
      }
      
      nfts.total = nfts.achievements.length + nfts.tournamentBadges.length + nfts.clanBadges.length;
      
      // Cache the result
      this.nftCache.set(cacheKey, {
        data: nfts,
        timestamp: Date.now()
      });
      
      return nfts;
    } catch (error) {
      this.logger.error('Failed to fetch gaming NFTs:', error);
      return { achievements: [], tournamentBadges: [], clanBadges: [], total: 0 };
    }
  }
  
  /**
   * Check Token-Gated Access
   */
  async checkTokenGatedAccess(requirement) {
    if (!this.publicKey) {
      return { hasAccess: false, reason: 'No wallet connected' };
    }
    
    const balance = await this.getMLGTokenBalance();
    
    switch (requirement.type) {
      case 'voting':
        const hasVotingTokens = balance >= WEB3_CONFIG.MINIMUM_MLG_FOR_VOTING;
        return {
          hasAccess: hasVotingTokens,
          reason: hasVotingTokens ? 'Sufficient MLG tokens' : `Need ${WEB3_CONFIG.MINIMUM_MLG_FOR_VOTING} MLG tokens`,
          currentBalance: balance,
          requiredBalance: WEB3_CONFIG.MINIMUM_MLG_FOR_VOTING
        };
        
      case 'tournament':
        const hasTournamentTokens = balance >= WEB3_CONFIG.MINIMUM_MLG_FOR_TOURNAMENTS;
        return {
          hasAccess: hasTournamentTokens,
          reason: hasTournamentTokens ? 'Sufficient MLG tokens' : `Need ${WEB3_CONFIG.MINIMUM_MLG_FOR_TOURNAMENTS} MLG tokens`,
          currentBalance: balance,
          requiredBalance: WEB3_CONFIG.MINIMUM_MLG_FOR_TOURNAMENTS
        };
        
      case 'clan_creation':
        const hasClanTokens = balance >= WEB3_CONFIG.CLAN_CREATION_COST;
        return {
          hasAccess: hasClanTokens,
          reason: hasClanTokens ? 'Sufficient MLG tokens' : `Need ${WEB3_CONFIG.CLAN_CREATION_COST} MLG tokens`,
          currentBalance: balance,
          requiredBalance: WEB3_CONFIG.CLAN_CREATION_COST
        };
        
      case 'nft_achievement':
        const nfts = await this.getGamingNFTs();
        const hasAchievement = nfts.achievements.includes(requirement.achievementId);
        return {
          hasAccess: hasAchievement,
          reason: hasAchievement ? 'Achievement NFT owned' : 'Achievement NFT required',
          ownedAchievements: nfts.achievements
        };
        
      default:
        return { hasAccess: false, reason: 'Unknown requirement type' };
    }
  }
  
  /**
   * Refresh Wallet Data
   */
  async refreshWalletData() {
    if (!this.publicKey) return;
    
    try {
      // Clear caches to force refresh
      const walletAddress = this.publicKey.toString();
      this.balanceCache.delete(`mlg_balance:${walletAddress}`);
      this.nftCache.delete(`nfts:${walletAddress}`);
      this.lastBalanceCheck.delete(`mlg_balance:${walletAddress}`);
      
      // Fetch fresh data
      const [balance, nfts] = await Promise.all([
        this.getMLGTokenBalance(),
        this.getGamingNFTs()
      ]);
      
      this.logger.info(`💰 Wallet balance: ${balance} MLG, NFTs: ${nfts.total}`);
      
      return { balance, nfts };
    } catch (error) {
      this.logger.error('Failed to refresh wallet data:', error);
    }
  }
  
  /**
   * Setup Wallet Event Listeners
   */
  setupWalletEventListeners() {
    // Listen for account changes on available wallets
    for (const [walletType, walletInfo] of Object.entries(this.availableWallets)) {
      if (walletInfo.available && walletInfo.provider) {
        const provider = walletInfo.provider;
        
        // Account changed
        if (provider.on) {
          provider.on('accountChanged', (publicKey) => {
            if (publicKey && this.walletType === walletType) {
              this.publicKey = publicKey;
              this.refreshWalletData();
              this.emit('accountChanged', { walletType, publicKey: publicKey.toString() });
            }
          });
          
          // Disconnection
          provider.on('disconnect', () => {
            if (this.walletType === walletType) {
              this.disconnectWallet(walletType);
            }
          });
        }
      }
    }
  }
  
  /**
   * Check for Existing Connections
   */
  async checkExistingConnections() {
    for (const [walletType, walletInfo] of Object.entries(this.availableWallets)) {
      if (walletInfo.available && walletInfo.provider) {
        try {
          // Try to connect if already trusted
          const response = await walletInfo.provider.connect({ onlyIfTrusted: true });
          if (response.publicKey) {
            this.connectedWallets.set(walletType, {
              provider: walletInfo.provider,
              publicKey: response.publicKey,
              connectedAt: new Date(),
              lastUsed: new Date()
            });
            
            // Set as current if first connection
            if (!this.connectedWallet) {
              this.connectedWallet = walletInfo.provider;
              this.walletProvider = walletInfo.provider;
              this.publicKey = response.publicKey;
              this.walletType = walletType;
              this.primaryWallet = walletType;
              
              await this.refreshWalletData();
              this.logger.info(`🔄 Restored connection to ${walletType}`);
            }
          }
        } catch (error) {
          // Silent fail for auto-connection attempts
        }
      }
    }
  }
  
  /**
   * Setup Auto-Reconnect
   */
  setupAutoReconnect() {
    // Periodically check connection status
    this.reconnectInterval = setInterval(async () => {
      if (this.connectedWallet && this.publicKey) {
        try {
          // Test connection by getting balance
          await this.connection.getBalance(this.publicKey);
        } catch (error) {
          this.logger.warn('Connection test failed, attempting reconnect...');
          // Attempt to reconnect
          if (this.walletType) {
            try {
              await this.connectWallet(this.walletType);
            } catch (reconnectError) {
              this.logger.error('Auto-reconnect failed:', reconnectError);
            }
          }
        }
      }
    }, 60000); // Check every minute
  }
  
  /**
   * Event Management
   */
  on(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].add(callback);
    }
  }
  
  off(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].delete(callback);
    }
  }
  
  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          this.logger.error(`Error in ${event} event handler:`, error);
        }
      });
    }
  }
  
  /**
   * Utility Methods
   */
  clearWalletCaches(walletType = null) {
    const targetWallet = walletType || this.walletType;
    if (targetWallet && this.connectedWallets.has(targetWallet)) {
      const walletInfo = this.connectedWallets.get(targetWallet);
      const address = walletInfo.publicKey.toString();
      
      this.balanceCache.delete(`mlg_balance:${address}`);
      this.nftCache.delete(`nfts:${address}`);
      this.lastBalanceCheck.delete(`mlg_balance:${address}`);
    }
  }
  
  getConnectedWallets() {
    return Array.from(this.connectedWallets.keys());
  }
  
  getCurrentWallet() {
    return {
      type: this.walletType,
      publicKey: this.publicKey?.toString(),
      provider: this.walletProvider
    };
  }
  
  isConnected() {
    return !!(this.connectedWallet && this.publicKey);
  }
  
  getNetworkInfo() {
    return WEB3_CONFIG.SOLANA_NETWORKS[this.network];
  }
  
  // Cleanup method
  destroy() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
    }
    
    // Disconnect all wallets
    for (const walletType of this.connectedWallets.keys()) {
      this.disconnectWallet(walletType);
    }
    
    // Clear all caches
    this.balanceCache.clear();
    this.nftCache.clear();
    this.lastBalanceCheck.clear();
    
    this.logger.info('🔗 Web3 Wallet Manager destroyed');
  }
}

export default Web3WalletManager;
export { WEB3_CONFIG, WALLET_PROVIDERS };