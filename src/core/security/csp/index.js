/**
 * Content Security Policy (CSP) System for MLG.clan Gaming Platform
 * 
 * Comprehensive CSP implementation with gaming-specific security features,
 * Web3 blockchain integration, and advanced violation monitoring.
 * 
 * Main Entry Point for CSP System
 * 
 * @author Claude Code - Security & Performance Auditor
 * @version 1.0.0
 * @created 2025-08-12
 */

// Core CSP Configuration
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
} from './csp-config.js';

// CSP Middleware
export {
  gamingCSPMiddleware,
  cspNonceMiddleware,
  cspViolationHandler,
  gamingSecurityHeadersMiddleware,
  cspStatsMiddleware,
  createEnvironmentCSP,
  developmentCSPMiddleware,
  stagingCSPMiddleware,
  productionCSPMiddleware,
  getViolationReporter,
  cleanup as cleanupCSPMiddleware
} from './csp-middleware.js';

// Web3 Integration
export {
  web3CSPMiddleware,
  phantomWalletCSP,
  solflareWalletCSP,
  createWeb3CSPDirectives,
  createGamingTokenCSP,
  validateGamingWeb3CSP,
  SOLANA_NETWORKS,
  WALLET_PROVIDERS,
  DEFI_PROTOCOLS,
  WEB3_INFRASTRUCTURE,
  GAMING_METADATA_SOURCES
} from './web3-csp.js';

// Monitoring and Analytics
export {
  CSPViolationMonitor,
  MONITOR_CONFIG,
  GAMING_VIOLATION_PATTERNS
} from './csp-monitor.js';

// Testing and Validation
export {
  CSPTestSuite,
  CSP_TEST_CONFIG,
  quickCSPValidation,
  validateGamingCSP
} from './csp-testing.js';

/**
 * Create a complete CSP middleware stack for MLG.clan platform
 */
export function createMLGCSPStack(options = {}) {
  const {
    environment = process.env.NODE_ENV || 'development',
    solanaNetwork = process.env.SOLANA_NETWORK || 'mainnet-beta',
    enabledWallets = ['phantom', 'solflare', 'backpack'],
    enableReporting = true,
    enableMonitoring = true
  } = options;

  const middleware = createEnvironmentCSP(environment);
  
  // Add Web3 support
  middleware.unshift(web3CSPMiddleware({
    network: solanaNetwork,
    enabledWallets,
    enableDeFi: true,
    enableNFTs: true,
    enableGamingProtocols: true
  }));

  return middleware;
}

/**
 * Initialize CSP system with monitoring
 */
export function initializeCSPSystem(options = {}) {
  const monitor = new CSPViolationMonitor(options);
  
  // Setup event handlers
  monitor.on('alertTriggered', (alert) => {
    console.warn('🚨 CSP Security Alert:', alert);
  });
  
  monitor.on('suspiciousActivity', (activity) => {
    console.warn('🔍 Suspicious CSP Activity:', activity);
  });
  
  monitor.on('ipBlocked', (data) => {
    console.warn('🚫 IP Blocked:', data);
  });

  return monitor;
}

/**
 * Validate CSP configuration for gaming platform
 */
export async function validateCSPConfiguration(environment = 'production') {
  const testSuite = new CSPTestSuite();
  const results = await testSuite.runComprehensiveTests(environment);
  
  return {
    isValid: results.summary.score >= 80,
    score: results.summary.score,
    results,
    report: testSuite.generateTestReport(results)
  };
}

/**
 * Get recommended CSP configuration for environment
 */
export function getRecommendedCSPConfig(environment = 'production', features = {}) {
  const {
    enableTwitch = true,
    enableYouTube = true,
    enableDiscord = true,
    enablePhantomWallet = true,
    enableSolflareWallet = true,
    enableGameAnalytics = true
  } = features;

  const config = createGamingCSPConfig(environment, {
    enabledWallets: [],
    customDomains: []
  });

  // Add feature-specific domains
  if (enableTwitch) {
    config.directives.frameSrc.push('https://twitch.tv', 'https://player.twitch.tv');
  }
  
  if (enableYouTube) {
    config.directives.frameSrc.push('https://youtube.com', 'https://www.youtube.com');
  }
  
  if (enableDiscord) {
    config.directives.frameSrc.push('https://discord.com');
    config.directives.imgSrc.push('https://cdn.discordapp.com');
  }

  const wallets = [];
  if (enablePhantomWallet) wallets.push('phantom');
  if (enableSolflareWallet) wallets.push('solflare');

  // Add Web3 directives
  const web3Config = createWeb3CSPDirectives('mainnet-beta', {
    enabledWallets: wallets
  });

  // Merge Web3 directives
  Object.entries(web3Config).forEach(([directive, sources]) => {
    if (config.directives[directive]) {
      config.directives[directive] = [
        ...new Set([...config.directives[directive], ...sources])
      ];
    } else {
      config.directives[directive] = sources;
    }
  });

  return config;
}

export default {
  createMLGCSPStack,
  initializeCSPSystem,
  validateCSPConfiguration,
  getRecommendedCSPConfig,
  
  // Re-export main classes and functions
  createGamingCSPConfig,
  gamingCSPMiddleware,
  web3CSPMiddleware,
  CSPViolationMonitor,
  CSPTestSuite
};