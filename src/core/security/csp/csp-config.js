/**
 * Content Security Policy (CSP) Configuration for MLG.clan Gaming Platform
 * 
 * Comprehensive CSP implementation designed specifically for gaming platforms
 * with Web3 blockchain integration, real-time features, and gaming content.
 * 
 * Features:
 * - Gaming-specific CSP directives for tournament and clan systems
 * - Web3 and blockchain integration with Solana/Phantom wallet support
 * - Gaming content security for user-generated content and media
 * - Real-time WebSocket and SSE security configurations
 * - Environment-specific policies (development, staging, production)
 * - CSP violation reporting and monitoring
 * 
 * @author Claude Code - Security & Performance Auditor
 * @version 1.0.0
 * @created 2025-08-12
 */

/**
 * Gaming Platform Domains Configuration
 */
const GAMING_DOMAINS = {
  // Major gaming platforms
  PLATFORMS: [
    'twitch.tv',
    'youtube.com',
    'discord.com',
    'steam.com',
    'epic.com',
    'battle.net',
    'ea.com',
    'ubisoft.com',
    'riotgames.com',
    'valorant.com',
    'leagueoflegends.com'
  ],
  
  // Gaming CDNs and static content
  GAMING_CDNS: [
    'static.twitch.tv',
    'i.ytimg.com',
    'cdn.discordapp.com',
    'steamcdn-a.akamaihd.net',
    'epicgames-download1.akamaized.net',
    'blzddist1-a.akamaihd.net'
  ],
  
  // Gaming analytics and metrics
  GAMING_ANALYTICS: [
    'stats.twitch.tv',
    'analytics.discord.com',
    'metrics.steam.com',
    'telemetry.epicgames.com'
  ],
  
  // Gaming authentication providers
  GAMING_AUTH: [
    'id.twitch.tv',
    'discord.com',
    'steamcommunity.com',
    'accounts.epicgames.com',
    'account.battle.net'
  ]
};

/**
 * Web3 and Blockchain Domains Configuration
 */
const WEB3_DOMAINS = {
  // Solana ecosystem
  SOLANA: [
    'solana.com',
    'solflare.com',
    'solanart.io',
    'magiceden.io',
    'raydium.io',
    'serum.com',
    'marinade.finance',
    'solend.fi'
  ],
  
  // Wallet providers
  WALLETS: [
    'phantom.app',
    'solflare.com',
    'backpack.app',
    'glow.app',
    'slope.finance',
    'trust.com',
    'metamask.io'
  ],
  
  // Solana RPC endpoints
  RPC_ENDPOINTS: [
    'api.mainnet-beta.solana.com',
    'api.devnet.solana.com',
    'api.testnet.solana.com',
    'solana-api.projectserum.com',
    'rpc.ankr.com'
  ],
  
  // Web3 infrastructure
  INFRASTRUCTURE: [
    'infura.io',
    'alchemy.com',
    'quicknode.com',
    'moralis.io',
    'helius.dev',
    'triton.one'
  ],
  
  // Blockchain explorers
  EXPLORERS: [
    'explorer.solana.com',
    'solscan.io',
    'solanafm.com',
    'solanabeach.io'
  ]
};

/**
 * CDN and Static Content Domains
 */
const CDN_DOMAINS = {
  // Popular CDNs
  MAJOR_CDNS: [
    'cdnjs.cloudflare.com',
    'unpkg.com',
    'jsdelivr.net',
    'fastly.com',
    'maxcdn.bootstrapcdn.com'
  ],
  
  // Font providers
  FONTS: [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'use.typekit.net',
    'cloud.typography.com'
  ],
  
  // Image and media CDNs
  MEDIA: [
    'images.unsplash.com',
    'pixabay.com',
    'pexels.com',
    'cloudinary.com',
    'imgur.com'
  ],
  
  // Gaming asset CDNs
  GAMING_ASSETS: [
    'assets.twitch.tv',
    'cdn.discord.com',
    'steamuserimages-a.akamaihd.net',
    'epicgames.com'
  ]
};

/**
 * Analytics and Monitoring Domains
 */
const ANALYTICS_DOMAINS = {
  // Web analytics
  WEB_ANALYTICS: [
    'google-analytics.com',
    'googletagmanager.com',
    'doubleclick.net',
    'facebook.com',
    'connect.facebook.net'
  ],
  
  // User experience monitoring
  UX_MONITORING: [
    'hotjar.com',
    'fullstory.com',
    'logrocket.com',
    'sentry.io',
    'bugsnag.com'
  ],
  
  // Performance monitoring
  PERFORMANCE: [
    'speedcurve.com',
    'newrelic.com',
    'datadoghq.com',
    'segment.com'
  ],
  
  // Gaming-specific analytics
  GAMING_METRICS: [
    'gameanalytics.com',
    'unity3d.com',
    'unreal.com',
    'amplitude.com'
  ]
};

/**
 * Environment-specific CSP configurations
 */
const ENVIRONMENT_CONFIGS = {
  development: {
    // More permissive for development
    scriptSrc: ["'unsafe-eval'", "'unsafe-inline'"],
    styleSrc: ["'unsafe-inline'"],
    connectSrc: ['localhost:*', '127.0.0.1:*', 'ws://localhost:*', 'wss://localhost:*'],
    reportOnly: true,
    additionalSources: [
      'localhost:3000',
      'localhost:3001', 
      'localhost:9000',
      '127.0.0.1:3000',
      '127.0.0.1:3001',
      '127.0.0.1:9000'
    ]
  },
  
  staging: {
    // Stricter than development but allows testing
    scriptSrc: ["'unsafe-inline'"], // Limited unsafe-inline for testing
    styleSrc: ["'unsafe-inline'"],
    connectSrc: ['*.staging.mlg.clan', 'wss://*.staging.mlg.clan'],
    reportOnly: false,
    additionalSources: [
      '*.staging.mlg.clan',
      'staging-api.mlg.clan'
    ]
  },
  
  production: {
    // Strictest security for production
    scriptSrc: [], // No unsafe directives
    styleSrc: [], // No unsafe directives  
    connectSrc: ['*.mlg.clan', 'wss://*.mlg.clan'],
    reportOnly: false,
    additionalSources: [
      '*.mlg.clan',
      'api.mlg.clan',
      'cdn.mlg.clan'
    ]
  }
};

/**
 * Gaming-specific CSP nonces and hashes
 */
class CSPNonceManager {
  constructor() {
    this.nonces = new Map();
    this.hashCache = new Map();
  }

  /**
   * Generate a cryptographically secure nonce
   */
  generateNonce() {
    const nonce = require('crypto').randomBytes(16).toString('base64');
    return nonce;
  }

  /**
   * Generate nonce for request
   */
  generateRequestNonce(req) {
    const nonce = this.generateNonce();
    this.nonces.set(req.id || req.sessionID, nonce);
    return nonce;
  }

  /**
   * Get nonce for request
   */
  getNonce(req) {
    return this.nonces.get(req.id || req.sessionID);
  }

  /**
   * Generate hash for inline script/style
   */
  generateHash(content, algorithm = 'sha256') {
    const hash = require('crypto')
      .createHash(algorithm)
      .update(content)
      .digest('base64');
    return `${algorithm}-${hash}`;
  }

  /**
   * Cache hash for reuse
   */
  cacheHash(identifier, content, algorithm = 'sha256') {
    const hash = this.generateHash(content, algorithm);
    this.hashCache.set(identifier, hash);
    return hash;
  }

  /**
   * Get cached hash
   */
  getCachedHash(identifier) {
    return this.hashCache.get(identifier);
  }
}

/**
 * Create comprehensive CSP configuration for MLG.clan platform
 */
function createGamingCSPConfig(environment = 'production', options = {}) {
  const envConfig = ENVIRONMENT_CONFIGS[environment] || ENVIRONMENT_CONFIGS.production;
  
  // Combine all allowed domains
  const allGamingDomains = [
    ...GAMING_DOMAINS.PLATFORMS,
    ...GAMING_DOMAINS.GAMING_CDNS,
    ...GAMING_DOMAINS.GAMING_ANALYTICS,
    ...GAMING_DOMAINS.GAMING_AUTH
  ];
  
  const allWeb3Domains = [
    ...WEB3_DOMAINS.SOLANA,
    ...WEB3_DOMAINS.WALLETS,
    ...WEB3_DOMAINS.RPC_ENDPOINTS,
    ...WEB3_DOMAINS.INFRASTRUCTURE,
    ...WEB3_DOMAINS.EXPLORERS
  ];
  
  const allCDNDomains = [
    ...CDN_DOMAINS.MAJOR_CDNS,
    ...CDN_DOMAINS.FONTS,
    ...CDN_DOMAINS.MEDIA,
    ...CDN_DOMAINS.GAMING_ASSETS
  ];
  
  const allAnalyticsDomains = [
    ...ANALYTICS_DOMAINS.WEB_ANALYTICS,
    ...ANALYTICS_DOMAINS.UX_MONITORING,
    ...ANALYTICS_DOMAINS.PERFORMANCE,
    ...ANALYTICS_DOMAINS.GAMING_METRICS
  ];

  // Build CSP directives
  const cspDirectives = {
    // Default source - only self
    defaultSrc: ["'self'"],
    
    // Script sources - gaming and Web3 integration
    scriptSrc: [
      "'self'",
      ...envConfig.scriptSrc,
      ...allCDNDomains.map(domain => `https://${domain}`),
      ...allAnalyticsDomains.map(domain => `https://${domain}`),
      ...allWeb3Domains.map(domain => `https://${domain}`),
      // Gaming platform scripts
      ...allGamingDomains.map(domain => `https://${domain}`),
      // Environment-specific sources
      ...envConfig.additionalSources.map(source => 
        source.includes('://') ? source : `https://${source}`
      )
    ],
    
    // Style sources - gaming UI and frameworks
    styleSrc: [
      "'self'",
      ...envConfig.styleSrc,
      ...allCDNDomains.map(domain => `https://${domain}`),
      ...allGamingDomains.map(domain => `https://${domain}`),
      // Environment-specific sources
      ...envConfig.additionalSources.map(source => 
        source.includes('://') ? source : `https://${source}`
      )
    ],
    
    // Image sources - gaming content and Web3 assets
    imgSrc: [
      "'self'",
      'data:',
      'blob:',
      ...allGamingDomains.map(domain => `https://${domain}`),
      ...allCDNDomains.map(domain => `https://${domain}`),
      ...allWeb3Domains.map(domain => `https://${domain}`),
      // Gaming-specific image sources
      'https://*.twitch.tv',
      'https://*.discord.com',
      'https://*.steam.com',
      // Web3 NFT and token images
      'https://*.arweave.net',
      'https://*.ipfs.io',
      // Environment-specific sources
      ...envConfig.additionalSources.map(source => 
        source.includes('://') ? source : `https://${source}`
      )
    ],
    
    // Connect sources - APIs, WebSockets, and blockchain
    connectSrc: [
      "'self'",
      ...envConfig.connectSrc,
      // Web3 and blockchain connections
      ...allWeb3Domains.map(domain => `https://${domain}`),
      ...allWeb3Domains.map(domain => `wss://${domain}`),
      // Gaming platform APIs
      ...allGamingDomains.map(domain => `https://${domain}`),
      ...allGamingDomains.map(domain => `wss://${domain}`),
      // Analytics and monitoring
      ...allAnalyticsDomains.map(domain => `https://${domain}`),
      // WebSocket connections for real-time gaming
      'wss:',
      'ws:',
      // Environment-specific connections
      ...envConfig.additionalSources.map(source => {
        if (source.includes('://')) return source;
        return [`https://${source}`, `wss://${source}`];
      }).flat()
    ],
    
    // Font sources
    fontSrc: [
      "'self'",
      ...CDN_DOMAINS.FONTS.map(domain => `https://${domain}`),
      ...envConfig.additionalSources.map(source => 
        source.includes('://') ? source : `https://${source}`
      )
    ],
    
    // Media sources - gaming videos and audio
    mediaSrc: [
      "'self'",
      'blob:',
      'data:',
      ...allGamingDomains.map(domain => `https://${domain}`),
      ...allCDNDomains.map(domain => `https://${domain}`),
      // Gaming-specific media sources
      'https://*.twitch.tv',
      'https://*.youtube.com',
      'https://*.discord.com',
      // Environment-specific sources
      ...envConfig.additionalSources.map(source => 
        source.includes('://') ? source : `https://${source}`
      )
    ],
    
    // Frame sources - gaming embeds and Web3 interfaces
    frameSrc: [
      "'self'",
      ...allGamingDomains.map(domain => `https://${domain}`),
      // Specific gaming embeds
      'https://player.twitch.tv',
      'https://www.youtube.com',
      'https://clips.twitch.tv',
      // Web3 wallet interfaces
      'https://phantom.app',
      'https://solflare.com',
      // Environment-specific sources
      ...envConfig.additionalSources.map(source => 
        source.includes('://') ? source : `https://${source}`
      )
    ],
    
    // Object sources - restrict plugins
    objectSrc: ["'none'"],
    
    // Base URI - only self
    baseUri: ["'self'"],
    
    // Form actions - only self and trusted gaming platforms
    formAction: [
      "'self'",
      ...allGamingDomains.map(domain => `https://${domain}`),
      ...allWeb3Domains.map(domain => `https://${domain}`),
      // Environment-specific sources
      ...envConfig.additionalSources.map(source => 
        source.includes('://') ? source : `https://${source}`
      )
    ],
    
    // Frame ancestors - prevent clickjacking
    frameAncestors: environment === 'development' ? ["'self'"] : ["'none'"],
    
    // Upgrade insecure requests
    upgradeInsecureRequests: environment === 'production' ? [] : undefined,
    
    // Worker sources - for gaming and Web3 workers
    workerSrc: [
      "'self'",
      'blob:',
      ...allWeb3Domains.map(domain => `https://${domain}`),
      // Environment-specific sources
      ...envConfig.additionalSources.map(source => 
        source.includes('://') ? source : `https://${source}`
      )
    ],
    
    // Manifest source - PWA support
    manifestSrc: ["'self'"],
    
    // Prefetch sources - performance optimization
    prefetchSrc: [
      "'self'",
      ...allCDNDomains.map(domain => `https://${domain}`),
      ...allGamingDomains.map(domain => `https://${domain}`),
      // Environment-specific sources
      ...envConfig.additionalSources.map(source => 
        source.includes('://') ? source : `https://${source}`
      )
    ]
  };

  // Remove undefined directives
  Object.keys(cspDirectives).forEach(key => {
    if (cspDirectives[key] === undefined) {
      delete cspDirectives[key];
    }
  });

  return {
    directives: cspDirectives,
    reportOnly: envConfig.reportOnly,
    reportUri: options.reportUri || '/api/security/csp-violation',
    reportTo: options.reportTo || 'csp-endpoint'
  };
}

/**
 * Gaming-specific CSP violation categories
 */
const CSP_VIOLATION_CATEGORIES = {
  GAMING_CONTENT: 'gaming-content-violation',
  WEB3_BLOCKCHAIN: 'web3-blockchain-violation', 
  USER_GENERATED: 'user-generated-content-violation',
  REAL_TIME_DATA: 'real-time-data-violation',
  GAMING_EMBED: 'gaming-embed-violation',
  WALLET_INTEGRATION: 'wallet-integration-violation',
  ANALYTICS_TRACKING: 'analytics-tracking-violation',
  UNKNOWN: 'unknown-violation'
};

/**
 * Categorize CSP violations for gaming platform
 */
function categorizeCSPViolation(violation) {
  const blockedUri = violation['blocked-uri'] || '';
  const violatedDirective = violation['violated-directive'] || '';
  
  // Gaming content violations
  if (blockedUri.includes('twitch.tv') || 
      blockedUri.includes('youtube.com') || 
      blockedUri.includes('discord.com') ||
      blockedUri.includes('steam.com')) {
    return CSP_VIOLATION_CATEGORIES.GAMING_CONTENT;
  }
  
  // Web3/blockchain violations
  if (blockedUri.includes('phantom.app') ||
      blockedUri.includes('solana.com') ||
      blockedUri.includes('solflare.com') ||
      violatedDirective.includes('connect-src')) {
    return CSP_VIOLATION_CATEGORIES.WEB3_BLOCKCHAIN;
  }
  
  // User-generated content violations
  if (violatedDirective.includes('img-src') ||
      violatedDirective.includes('media-src')) {
    return CSP_VIOLATION_CATEGORIES.USER_GENERATED;
  }
  
  // Real-time data violations (WebSockets)
  if (blockedUri.includes('ws://') || 
      blockedUri.includes('wss://')) {
    return CSP_VIOLATION_CATEGORIES.REAL_TIME_DATA;
  }
  
  // Gaming embed violations
  if (violatedDirective.includes('frame-src')) {
    return CSP_VIOLATION_CATEGORIES.GAMING_EMBED;
  }
  
  // Wallet integration violations
  if (blockedUri.includes('wallet') ||
      blockedUri.includes('phantom') ||
      blockedUri.includes('solflare')) {
    return CSP_VIOLATION_CATEGORIES.WALLET_INTEGRATION;
  }
  
  // Analytics violations
  if (blockedUri.includes('analytics') ||
      blockedUri.includes('google-analytics') ||
      blockedUri.includes('hotjar')) {
    return CSP_VIOLATION_CATEGORIES.ANALYTICS_TRACKING;
  }
  
  return CSP_VIOLATION_CATEGORIES.UNKNOWN;
}

// Initialize nonce manager
const cspNonceManager = new CSPNonceManager();

export {
  createGamingCSPConfig,
  CSPNonceManager,
  cspNonceManager,
  categorizeCSPViolation,
  CSP_VIOLATION_CATEGORIES,
  GAMING_DOMAINS,
  WEB3_DOMAINS,
  CDN_DOMAINS,
  ANALYTICS_DOMAINS,
  ENVIRONMENT_CONFIGS
};

export default {
  createGamingCSPConfig,
  CSPNonceManager,
  cspNonceManager,
  categorizeCSPViolation,
  CSP_VIOLATION_CATEGORIES
};