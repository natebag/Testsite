/**
 * Web3 and Blockchain Content Security Policy (CSP) Module for MLG.clan
 * 
 * Specialized CSP configurations for Web3 and blockchain integration,
 * focusing on Solana ecosystem, Phantom wallet, and gaming token security.
 * 
 * Features:
 * - Solana blockchain integration security
 * - Phantom wallet connection protection
 * - SPL token interaction security
 * - Gaming NFT and achievement security
 * - Web3 provider CSP configuration
 * - Blockchain RPC endpoint protection
 * 
 * @author Claude Code - Security & Performance Auditor
 * @version 1.0.0
 * @created 2025-08-12
 */

/**
 * Solana Network Configurations
 */
const SOLANA_NETWORKS = {
  'mainnet-beta': {
    rpcEndpoints: [
      'api.mainnet-beta.solana.com',
      'solana-api.projectserum.com',
      'rpc.ankr.com/solana',
      'api.mainnet.rpcpool.com'
    ],
    wsEndpoints: [
      'api.mainnet-beta.solana.com',
      'solana-api.projectserum.com'
    ],
    explorers: [
      'explorer.solana.com',
      'solscan.io',
      'solanafm.com'
    ]
  },
  'devnet': {
    rpcEndpoints: [
      'api.devnet.solana.com',
      'rpc.ankr.com/solana_devnet'
    ],
    wsEndpoints: [
      'api.devnet.solana.com'
    ],
    explorers: [
      'explorer.solana.com',
      'solscan.io'
    ]
  },
  'testnet': {
    rpcEndpoints: [
      'api.testnet.solana.com'
    ],
    wsEndpoints: [
      'api.testnet.solana.com'
    ],
    explorers: [
      'explorer.solana.com'
    ]
  }
};

/**
 * Wallet Provider Configurations
 */
const WALLET_PROVIDERS = {
  phantom: {
    domains: [
      'phantom.app',
      'phantom.tech',
      'get.phantom.app'
    ],
    connectEndpoints: [
      'phantom.app/ul/browse',
      'phantom.app/ul/v1/connect'
    ],
    cdnDomains: [
      'assets.phantom.app',
      'cdn.phantom.app'
    ]
  },
  solflare: {
    domains: [
      'solflare.com',
      'app.solflare.com'
    ],
    connectEndpoints: [
      'solflare.com/access-wallet',
      'solflare.com/connect'
    ],
    cdnDomains: [
      'assets.solflare.com'
    ]
  },
  backpack: {
    domains: [
      'backpack.app',
      'app.backpack.app'
    ],
    connectEndpoints: [
      'backpack.app/connect'
    ],
    cdnDomains: [
      'assets.backpack.app'
    ]
  },
  glow: {
    domains: [
      'glow.app',
      'app.glow.app'
    ],
    connectEndpoints: [
      'glow.app/connect'
    ],
    cdnDomains: [
      'assets.glow.app'
    ]
  }
};

/**
 * DeFi and Gaming Protocol Configurations
 */
const DEFI_PROTOCOLS = {
  // Gaming-focused DeFi
  gaming: [
    'fractal.is',
    'stepn.com',
    'defiland.app',
    'guildfi.com',
    'ygg.io'
  ],
  
  // Major Solana DeFi protocols
  defi: [
    'raydium.io',
    'serum.com',
    'marinade.finance',
    'solend.fi',
    'tulip.garden',
    'francium.io',
    'mango.markets',
    'drift.trade'
  ],
  
  // NFT marketplaces
  nft: [
    'magiceden.io',
    'solanart.io',
    'solsea.io',
    'opensea.io',
    'holaplex.com'
  ]
};

/**
 * Web3 Infrastructure Providers
 */
const WEB3_INFRASTRUCTURE = {
  rpcProviders: [
    'infura.io',
    'alchemy.com',
    'quicknode.com',
    'moralis.io',
    'helius.dev',
    'triton.one',
    'genesysgo.net'
  ],
  ipfsGateways: [
    'ipfs.io',
    'gateway.pinata.cloud',
    'cloudflare-ipfs.com',
    'dweb.link'
  ],
  arweaveGateways: [
    'arweave.net',
    'ar.xyz',
    'viewblock.io'
  ]
};

/**
 * Gaming Token and NFT Metadata Sources
 */
const GAMING_METADATA_SOURCES = [
  // IPFS gateways for NFT metadata
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  
  // Arweave for permanent storage
  'https://arweave.net/',
  'https://ar.xyz/',
  
  // Gaming-specific metadata
  'https://metadata.fractal.is/',
  'https://assets.stepn.com/',
  'https://metadata.guildfi.com/'
];

/**
 * Create Web3-specific CSP directives
 */
function createWeb3CSPDirectives(network = 'mainnet-beta', options = {}) {
  const {
    enabledWallets = ['phantom', 'solflare', 'backpack'],
    enableDeFi = true,
    enableNFTs = true,
    enableGamingProtocols = true,
    customRpcEndpoints = [],
    customDomains = []
  } = options;

  const networkConfig = SOLANA_NETWORKS[network] || SOLANA_NETWORKS['mainnet-beta'];
  
  // Collect all Web3 domains
  const web3Domains = new Set();
  
  // Add Solana network endpoints
  networkConfig.rpcEndpoints.forEach(endpoint => web3Domains.add(endpoint));
  networkConfig.explorers.forEach(explorer => web3Domains.add(explorer));
  
  // Add enabled wallet providers
  enabledWallets.forEach(wallet => {
    const walletConfig = WALLET_PROVIDERS[wallet];
    if (walletConfig) {
      walletConfig.domains.forEach(domain => web3Domains.add(domain));
      walletConfig.cdnDomains.forEach(domain => web3Domains.add(domain));
    }
  });
  
  // Add DeFi protocols if enabled
  if (enableDeFi) {
    DEFI_PROTOCOLS.defi.forEach(domain => web3Domains.add(domain));
  }
  
  // Add gaming protocols if enabled
  if (enableGamingProtocols) {
    DEFI_PROTOCOLS.gaming.forEach(domain => web3Domains.add(domain));
  }
  
  // Add NFT marketplaces if enabled
  if (enableNFTs) {
    DEFI_PROTOCOLS.nft.forEach(domain => web3Domains.add(domain));
  }
  
  // Add Web3 infrastructure
  WEB3_INFRASTRUCTURE.rpcProviders.forEach(domain => web3Domains.add(domain));
  WEB3_INFRASTRUCTURE.ipfsGateways.forEach(domain => web3Domains.add(domain));
  WEB3_INFRASTRUCTURE.arweaveGateways.forEach(domain => web3Domains.add(domain));
  
  // Add custom domains
  customDomains.forEach(domain => web3Domains.add(domain));
  customRpcEndpoints.forEach(endpoint => web3Domains.add(endpoint));

  const web3DomainsArray = Array.from(web3Domains);

  return {
    // Script sources for Web3 libraries and wallet adapters
    scriptSrc: [
      ...web3DomainsArray.map(domain => `https://${domain}`),
      // Specific Web3 script requirements
      'https://unpkg.com/@solana/wallet-adapter-phantom@*',
      'https://unpkg.com/@solana/web3.js@*',
      'https://unpkg.com/@solana/spl-token@*'
    ],
    
    // Connect sources for blockchain RPC calls and WebSocket connections
    connectSrc: [
      ...web3DomainsArray.map(domain => `https://${domain}`),
      ...web3DomainsArray.map(domain => `wss://${domain}`),
      ...networkConfig.rpcEndpoints.map(endpoint => `https://${endpoint}`),
      ...networkConfig.wsEndpoints.map(endpoint => `wss://${endpoint}`),
      // Custom RPC endpoints
      ...customRpcEndpoints.map(endpoint => `https://${endpoint}`),
      ...customRpcEndpoints.map(endpoint => `wss://${endpoint}`)
    ],
    
    // Image sources for NFTs, tokens, and gaming assets
    imgSrc: [
      ...web3DomainsArray.map(domain => `https://${domain}`),
      // IPFS and Arweave for NFT metadata
      ...GAMING_METADATA_SOURCES,
      // Wallet and protocol assets
      'https://assets.phantom.app',
      'https://assets.solflare.com',
      'https://assets.backpack.app'
    ],
    
    // Frame sources for wallet connection interfaces
    frameSrc: [
      ...enabledWallets.map(wallet => {
        const walletConfig = WALLET_PROVIDERS[wallet];
        return walletConfig ? walletConfig.domains.map(domain => `https://${domain}`) : [];
      }).flat(),
      // Specific wallet connect frames
      'https://phantom.app/ul/browse',
      'https://app.solflare.com',
      'https://app.backpack.app'
    ],
    
    // Worker sources for Web3 background processing
    workerSrc: [
      'blob:', // For dynamic Web3 workers
      ...web3DomainsArray.map(domain => `https://${domain}`)
    ],
    
    // Font sources for Web3 UI components
    fontSrc: [
      ...web3DomainsArray.map(domain => `https://${domain}`)
    ],
    
    // Style sources for Web3 UI components
    styleSrc: [
      ...web3DomainsArray.map(domain => `https://${domain}`)
    ],
    
    // Form actions for Web3 interactions
    formAction: [
      ...web3DomainsArray.map(domain => `https://${domain}`)
    ]
  };
}

/**
 * Gaming Token Security CSP
 */
function createGamingTokenCSP(options = {}) {
  const {
    mlgTokenAddress = process.env.MLG_TOKEN_ADDRESS,
    enableTokenBurn = true,
    enableVoting = true,
    enableRewards = true
  } = options;

  return {
    // Connect sources for token operations
    connectSrc: [
      // MLG token-specific endpoints
      'https://api.mlg.clan/tokens',
      'https://api.mlg.clan/voting',
      'https://api.mlg.clan/rewards',
      
      // Solana network for token operations
      'https://api.mainnet-beta.solana.com',
      'wss://api.mainnet-beta.solana.com'
    ],
    
    // Script sources for token management
    scriptSrc: [
      // Token management scripts
      'https://cdn.mlg.clan/js/mlg-token.js',
      'https://cdn.mlg.clan/js/token-burn.js',
      'https://cdn.mlg.clan/js/voting-system.js'
    ],
    
    // Image sources for token and achievement assets
    imgSrc: [
      // MLG token images and icons
      'https://assets.mlg.clan/tokens/',
      'https://assets.mlg.clan/achievements/',
      'https://assets.mlg.clan/badges/'
    ]
  };
}

/**
 * Web3 Security Headers
 */
function createWeb3SecurityHeaders(network = 'mainnet-beta', options = {}) {
  const headers = {
    // Solana network information
    'X-Solana-Network': network,
    'X-Solana-Cluster': network === 'mainnet-beta' ? 'mainnet' : network,
    
    // Supported wallet providers
    'X-Supported-Wallets': options.enabledWallets?.join(',') || 'phantom,solflare,backpack',
    
    // Web3 security features
    'X-Web3-Security-Level': 'strict',
    'X-Wallet-Connect-Security': 'enabled',
    'X-Transaction-Verification': 'required',
    
    // Gaming token features
    'X-MLG-Token-Enabled': 'true',
    'X-Token-Burn-Protected': 'true',
    'X-Voting-Security': 'verified',
    
    // Cross-origin policies for Web3
    'Cross-Origin-Embedder-Policy': 'unsafe-none', // Required for some Web3 libraries
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups' // For wallet popups
  };

  return headers;
}

/**
 * Web3 CSP Middleware
 */
export const web3CSPMiddleware = (options = {}) => {
  const {
    network = process.env.SOLANA_NETWORK || 'mainnet-beta',
    enabledWallets = ['phantom', 'solflare', 'backpack'],
    enableDeFi = true,
    enableNFTs = true,
    enableGamingProtocols = true,
    customDomains = [],
    customRpcEndpoints = []
  } = options;

  return (req, res, next) => {
    // Add Web3 security headers
    const securityHeaders = createWeb3SecurityHeaders(network, options);
    Object.entries(securityHeaders).forEach(([header, value]) => {
      res.setHeader(header, value);
    });
    
    // Store Web3 CSP directives in res.locals for use by main CSP middleware
    res.locals.web3CSP = createWeb3CSPDirectives(network, {
      enabledWallets,
      enableDeFi,
      enableNFTs,
      enableGamingProtocols,
      customDomains,
      customRpcEndpoints
    });
    
    // Store gaming token CSP directives
    res.locals.gamingTokenCSP = createGamingTokenCSP(options);
    
    next();
  };
};

/**
 * Phantom Wallet Specific CSP
 */
export const phantomWalletCSP = {
  scriptSrc: [
    'https://phantom.app',
    'https://get.phantom.app',
    'https://assets.phantom.app'
  ],
  connectSrc: [
    'https://phantom.app',
    'https://phantom.app/ul/browse',
    'https://phantom.app/ul/v1/connect',
    'wss://phantom.app'
  ],
  frameSrc: [
    'https://phantom.app/ul/browse',
    'https://phantom.app/connect'
  ],
  imgSrc: [
    'https://assets.phantom.app',
    'https://phantom.app/img'
  ]
};

/**
 * Solflare Wallet Specific CSP
 */
export const solflareWalletCSP = {
  scriptSrc: [
    'https://solflare.com',
    'https://app.solflare.com',
    'https://assets.solflare.com'
  ],
  connectSrc: [
    'https://solflare.com',
    'https://app.solflare.com',
    'https://solflare.com/access-wallet',
    'wss://solflare.com'
  ],
  frameSrc: [
    'https://app.solflare.com',
    'https://solflare.com/access-wallet'
  ],
  imgSrc: [
    'https://assets.solflare.com',
    'https://solflare.com/img'
  ]
};

/**
 * Gaming-specific Web3 CSP validation
 */
export function validateGamingWeb3CSP(cspDirectives, context = {}) {
  const issues = [];
  
  // Check for required Solana endpoints
  const connectSrc = cspDirectives.connectSrc || [];
  const requiredSolanaEndpoints = [
    'api.mainnet-beta.solana.com',
    'api.devnet.solana.com'
  ];
  
  requiredSolanaEndpoints.forEach(endpoint => {
    if (!connectSrc.some(src => src.includes(endpoint))) {
      issues.push({
        severity: 'high',
        type: 'missing_solana_endpoint',
        message: `Missing required Solana endpoint: ${endpoint}`,
        directive: 'connect-src'
      });
    }
  });
  
  // Check for wallet support
  const frameSrc = cspDirectives.frameSrc || [];
  const supportedWallets = ['phantom.app', 'solflare.com', 'backpack.app'];
  
  const walletSupport = supportedWallets.filter(wallet => 
    frameSrc.some(src => src.includes(wallet))
  );
  
  if (walletSupport.length === 0) {
    issues.push({
      severity: 'critical',
      type: 'no_wallet_support',
      message: 'No supported wallet providers found in frame-src',
      directive: 'frame-src'
    });
  }
  
  // Check for gaming token support
  if (context.enableGamingTokens) {
    const requiredTokenEndpoints = ['api.mlg.clan/tokens'];
    requiredTokenEndpoints.forEach(endpoint => {
      if (!connectSrc.some(src => src.includes(endpoint))) {
        issues.push({
          severity: 'medium',
          type: 'missing_token_endpoint',
          message: `Missing gaming token endpoint: ${endpoint}`,
          directive: 'connect-src'
        });
      }
    });
  }
  
  return {
    valid: issues.length === 0,
    issues,
    recommendations: generateWeb3CSPRecommendations(issues)
  };
}

/**
 * Generate recommendations for Web3 CSP issues
 */
function generateWeb3CSPRecommendations(issues) {
  const recommendations = [];
  
  issues.forEach(issue => {
    switch (issue.type) {
      case 'missing_solana_endpoint':
        recommendations.push(`Add Solana RPC endpoint to connect-src: https://${issue.message.split(': ')[1]}`);
        break;
      case 'no_wallet_support':
        recommendations.push('Add wallet provider domains to frame-src for Web3 authentication');
        break;
      case 'missing_token_endpoint':
        recommendations.push(`Add gaming token API endpoint to connect-src: https://${issue.message.split(': ')[1]}`);
        break;
      default:
        recommendations.push(`Address ${issue.type} in ${issue.directive} directive`);
    }
  });
  
  return recommendations;
}

export {
  createWeb3CSPDirectives,
  createGamingTokenCSP,
  createWeb3SecurityHeaders,
  validateGamingWeb3CSP,
  SOLANA_NETWORKS,
  WALLET_PROVIDERS,
  DEFI_PROTOCOLS,
  WEB3_INFRASTRUCTURE,
  GAMING_METADATA_SOURCES
};

export default {
  web3CSPMiddleware,
  phantomWalletCSP,
  solflareWalletCSP,
  createWeb3CSPDirectives,
  createGamingTokenCSP,
  validateGamingWeb3CSP
};