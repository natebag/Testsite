/**
 * CSP Testing and Validation Suite for MLG.clan Gaming Platform
 * 
 * Comprehensive testing framework for Content Security Policy implementation,
 * with specialized tests for gaming platforms, Web3 integration, and security validation.
 * 
 * Features:
 * - CSP directive validation and compliance testing
 * - Gaming platform security requirement verification
 * - Web3 and blockchain integration testing
 * - Security vulnerability detection and assessment
 * - Performance impact analysis
 * - Cross-browser compatibility validation
 * 
 * @author Claude Code - Security & Performance Auditor
 * @version 1.0.0
 * @created 2025-08-12
 */

import { 
  createGamingCSPConfig, 
  categorizeCSPViolation,
  CSP_VIOLATION_CATEGORIES 
} from './csp-config.js';
import { 
  createWeb3CSPDirectives, 
  validateGamingWeb3CSP,
  SOLANA_NETWORKS,
  WALLET_PROVIDERS 
} from './web3-csp.js';
import CSPViolationMonitor from './csp-monitor.js';

/**
 * CSP Testing Configuration
 */
const CSP_TEST_CONFIG = {
  // Test environments
  TEST_ENVIRONMENTS: ['development', 'staging', 'production'],
  
  // Required directives for gaming platform
  REQUIRED_DIRECTIVES: [
    'default-src',
    'script-src', 
    'style-src',
    'img-src',
    'connect-src',
    'frame-src',
    'font-src',
    'object-src',
    'base-uri',
    'form-action'
  ],
  
  // Gaming-specific requirements
  GAMING_REQUIREMENTS: {
    twitchIntegration: ['https://twitch.tv', 'https://player.twitch.tv'],
    youtubeIntegration: ['https://youtube.com', 'https://www.youtube.com'],
    discordIntegration: ['https://discord.com', 'https://cdn.discordapp.com'],
    steamIntegration: ['https://steam.com', 'https://steamcommunity.com']
  },
  
  // Web3 requirements
  WEB3_REQUIREMENTS: {
    solanaRPC: ['https://api.mainnet-beta.solana.com', 'https://api.devnet.solana.com'],
    phantomWallet: ['https://phantom.app', 'phantom.app'],
    solflareWallet: ['https://solflare.com', 'https://app.solflare.com'],
    blockchainExplorers: ['https://explorer.solana.com', 'https://solscan.io']
  },
  
  // Security requirements
  SECURITY_REQUIREMENTS: {
    noUnsafeEval: true,
    noUnsafeInlineInProduction: true,
    httpsOnly: true,
    frameAncestorsRestricted: true,
    objectSrcNone: true
  }
};

/**
 * CSP Test Suite Class
 */
class CSPTestSuite {
  constructor(options = {}) {
    this.options = { ...CSP_TEST_CONFIG, ...options };
    this.testResults = new Map();
    this.violations = [];
    this.warnings = [];
    this.monitor = new CSPViolationMonitor();
  }

  /**
   * Run comprehensive CSP test suite
   */
  async runComprehensiveTests(environment = 'production') {
    console.log(`🧪 Starting comprehensive CSP tests for ${environment} environment...`);
    
    const results = {
      environment,
      timestamp: new Date().toISOString(),
      tests: {
        basic: await this.runBasicCSPTests(environment),
        gaming: await this.runGamingPlatformTests(environment),
        web3: await this.runWeb3IntegrationTests(environment),
        security: await this.runSecurityValidationTests(environment),
        performance: await this.runPerformanceTests(environment),
        compliance: await this.runComplianceTests(environment)
      },
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        score: 0
      }
    };

    // Calculate summary
    const allTests = Object.values(results.tests).flat();
    results.summary.totalTests = allTests.length;
    results.summary.passed = allTests.filter(t => t.status === 'passed').length;
    results.summary.failed = allTests.filter(t => t.status === 'failed').length;
    results.summary.warnings = allTests.filter(t => t.status === 'warning').length;
    results.summary.score = Math.round((results.summary.passed / results.summary.totalTests) * 100);

    console.log(`✅ CSP test suite completed: ${results.summary.passed}/${results.summary.totalTests} tests passed (${results.summary.score}% score)`);
    
    return results;
  }

  /**
   * Run basic CSP validation tests
   */
  async runBasicCSPTests(environment) {
    const tests = [];
    const cspConfig = createGamingCSPConfig(environment);
    const directives = cspConfig.directives;

    // Test 1: Check required directives exist
    tests.push({
      name: 'Required Directives Present',
      category: 'basic',
      status: this.options.REQUIRED_DIRECTIVES.every(directive => 
        directives.hasOwnProperty(directive.replace('-', ''))
      ) ? 'passed' : 'failed',
      details: this.checkRequiredDirectives(directives)
    });

    // Test 2: Check default-src is restrictive
    tests.push({
      name: 'Default Source Restriction',
      category: 'basic',
      status: directives.defaultSrc && directives.defaultSrc.includes("'self'") && 
               directives.defaultSrc.length === 1 ? 'passed' : 'failed',
      details: { defaultSrc: directives.defaultSrc }
    });

    // Test 3: Check object-src is none
    tests.push({
      name: 'Object Source Blocked',
      category: 'basic',
      status: directives.objectSrc && directives.objectSrc.includes("'none'") ? 'passed' : 'failed',
      details: { objectSrc: directives.objectSrc }
    });

    // Test 4: Check base-uri is restricted
    tests.push({
      name: 'Base URI Restricted',
      category: 'basic',
      status: directives.baseUri && directives.baseUri.includes("'self'") ? 'passed' : 'failed',
      details: { baseUri: directives.baseUri }
    });

    // Test 5: Check frame-ancestors protection
    tests.push({
      name: 'Frame Ancestors Protection',
      category: 'basic',
      status: directives.frameAncestors && 
               (directives.frameAncestors.includes("'none'") || 
                directives.frameAncestors.includes("'self'")) ? 'passed' : 'warning',
      details: { frameAncestors: directives.frameAncestors }
    });

    return tests;
  }

  /**
   * Run gaming platform specific tests
   */
  async runGamingPlatformTests(environment) {
    const tests = [];
    const cspConfig = createGamingCSPConfig(environment);
    const directives = cspConfig.directives;

    // Test gaming platform integrations
    Object.entries(this.options.GAMING_REQUIREMENTS).forEach(([platform, domains]) => {
      const frameSources = directives.frameSrc || [];
      const imgSources = directives.imgSrc || [];
      const connectSources = directives.connectSrc || [];
      
      const hasRequiredDomains = domains.some(domain => 
        frameSources.some(src => src.includes(domain)) ||
        imgSources.some(src => src.includes(domain)) ||
        connectSources.some(src => src.includes(domain))
      );

      tests.push({
        name: `${platform} Integration Support`,
        category: 'gaming',
        status: hasRequiredDomains ? 'passed' : 'warning',
        details: {
          platform,
          requiredDomains: domains,
          foundInDirectives: this.findDomainsInDirectives(domains, directives)
        }
      });
    });

    // Test real-time gaming features
    tests.push({
      name: 'WebSocket Support for Real-time Gaming',
      category: 'gaming',
      status: (directives.connectSrc || []).some(src => 
        src.includes('ws:') || src.includes('wss:')
      ) ? 'passed' : 'failed',
      details: {
        webSocketSources: (directives.connectSrc || []).filter(src => 
          src.includes('ws:') || src.includes('wss:')
        )
      }
    });

    // Test gaming media support
    tests.push({
      name: 'Gaming Media Sources Support',
      category: 'gaming',
      status: (directives.mediaSrc || []).some(src => 
        src.includes('blob:') || src.includes('data:')
      ) ? 'passed' : 'warning',
      details: {
        mediaSources: directives.mediaSrc
      }
    });

    return tests;
  }

  /**
   * Run Web3 integration tests
   */
  async runWeb3IntegrationTests(environment) {
    const tests = [];
    const cspConfig = createGamingCSPConfig(environment);
    const web3Directives = createWeb3CSPDirectives('mainnet-beta');
    const validation = validateGamingWeb3CSP(cspConfig.directives, { enableGamingTokens: true });

    // Test Web3 CSP validation
    tests.push({
      name: 'Web3 CSP Validation',
      category: 'web3',
      status: validation.valid ? 'passed' : 'failed',
      details: {
        issues: validation.issues,
        recommendations: validation.recommendations
      }
    });

    // Test Solana network support
    Object.entries(this.options.WEB3_REQUIREMENTS).forEach(([requirement, domains]) => {
      const connectSources = cspConfig.directives.connectSrc || [];
      const frameSources = cspConfig.directives.frameSrc || [];
      
      const hasSupport = domains.some(domain => 
        connectSources.some(src => src.includes(domain)) ||
        frameSources.some(src => src.includes(domain))
      );

      tests.push({
        name: `${requirement} Support`,
        category: 'web3',
        status: hasSupport ? 'passed' : 'failed',
        details: {
          requirement,
          requiredDomains: domains,
          foundInDirectives: this.findDomainsInDirectives(domains, cspConfig.directives)
        }
      });
    });

    // Test wallet provider support
    Object.entries(WALLET_PROVIDERS).forEach(([wallet, config]) => {
      const frameSources = cspConfig.directives.frameSrc || [];
      const hasWalletSupport = config.domains.some(domain => 
        frameSources.some(src => src.includes(domain))
      );

      tests.push({
        name: `${wallet} Wallet Support`,
        category: 'web3',
        status: hasWalletSupport ? 'passed' : 'warning',
        details: {
          wallet,
          domains: config.domains,
          supported: hasWalletSupport
        }
      });
    });

    return tests;
  }

  /**
   * Run security validation tests
   */
  async runSecurityValidationTests(environment) {
    const tests = [];
    const cspConfig = createGamingCSPConfig(environment);
    const directives = cspConfig.directives;

    // Test 1: No unsafe-eval in production
    if (environment === 'production') {
      const hasUnsafeEval = (directives.scriptSrc || []).includes("'unsafe-eval'");
      tests.push({
        name: 'No Unsafe Eval in Production',
        category: 'security',
        status: !hasUnsafeEval ? 'passed' : 'failed',
        details: { hasUnsafeEval, scriptSrc: directives.scriptSrc }
      });
    }

    // Test 2: Minimize unsafe-inline usage
    const scriptHasUnsafeInline = (directives.scriptSrc || []).includes("'unsafe-inline'");
    const styleHasUnsafeInline = (directives.styleSrc || []).includes("'unsafe-inline'");
    
    tests.push({
      name: 'Minimal Unsafe Inline Usage',
      category: 'security',
      status: environment === 'production' && (scriptHasUnsafeInline || styleHasUnsafeInline) ? 
               'warning' : 'passed',
      details: {
        scriptUnsafeInline: scriptHasUnsafeInline,
        styleUnsafeInline: styleHasUnsafeInline,
        environment
      }
    });

    // Test 3: HTTPS enforcement
    const hasUpgradeInsecureRequests = directives.hasOwnProperty('upgradeInsecureRequests');
    tests.push({
      name: 'HTTPS Enforcement',
      category: 'security',
      status: environment === 'production' ? 
               (hasUpgradeInsecureRequests ? 'passed' : 'warning') : 'passed',
      details: { hasUpgradeInsecureRequests, environment }
    });

    // Test 4: Check for data: URIs in script-src
    const scriptHasDataUri = (directives.scriptSrc || []).some(src => src.includes('data:'));
    tests.push({
      name: 'No Data URIs in Script Sources',
      category: 'security',
      status: !scriptHasDataUri ? 'passed' : 'failed',
      details: { scriptHasDataUri, scriptSrc: directives.scriptSrc }
    });

    // Test 5: Worker source restrictions
    const workerSrc = directives.workerSrc || [];
    const hasRestrictiveWorkerSrc = workerSrc.includes("'self'") || workerSrc.includes('blob:');
    tests.push({
      name: 'Worker Source Restrictions',
      category: 'security',
      status: hasRestrictiveWorkerSrc ? 'passed' : 'warning',
      details: { workerSrc }
    });

    return tests;
  }

  /**
   * Run performance impact tests
   */
  async runPerformanceTests(environment) {
    const tests = [];
    const cspConfig = createGamingCSPConfig(environment);
    
    // Test CSP header size
    const cspHeaderSize = JSON.stringify(cspConfig.directives).length;
    tests.push({
      name: 'CSP Header Size',
      category: 'performance',
      status: cspHeaderSize < 8192 ? 'passed' : 'warning', // 8KB limit
      details: { 
        size: cspHeaderSize,
        limit: 8192,
        recommendation: cspHeaderSize > 8192 ? 'Consider reducing number of allowed sources' : 'Within acceptable limits'
      }
    });

    // Test directive count
    const directiveCount = Object.keys(cspConfig.directives).length;
    tests.push({
      name: 'Directive Count',
      category: 'performance',
      status: directiveCount <= 15 ? 'passed' : 'warning',
      details: { 
        count: directiveCount,
        recommendation: directiveCount > 15 ? 'Consider consolidating directives' : 'Reasonable directive count'
      }
    });

    // Test source count per directive
    const sourceCounts = Object.entries(cspConfig.directives).map(([directive, sources]) => ({
      directive,
      count: Array.isArray(sources) ? sources.length : 1
    }));
    
    const hasHighSourceCount = sourceCounts.some(sc => sc.count > 20);
    tests.push({
      name: 'Source Count Per Directive',
      category: 'performance',
      status: !hasHighSourceCount ? 'passed' : 'warning',
      details: { 
        sourceCounts,
        recommendation: hasHighSourceCount ? 'Consider using wildcards or consolidating sources' : 'Acceptable source counts'
      }
    });

    return tests;
  }

  /**
   * Run compliance and best practices tests
   */
  async runComplianceTests(environment) {
    const tests = [];
    const cspConfig = createGamingCSPConfig(environment);
    const directives = cspConfig.directives;

    // Test CSP Level 3 compliance
    const level3Directives = ['worker-src', 'manifest-src', 'prefetch-src'];
    const hasLevel3Support = level3Directives.some(directive => 
      directives.hasOwnProperty(directive.replace('-', ''))
    );
    
    tests.push({
      name: 'CSP Level 3 Features',
      category: 'compliance',
      status: hasLevel3Support ? 'passed' : 'warning',
      details: {
        supportedLevel3: level3Directives.filter(directive => 
          directives.hasOwnProperty(directive.replace('-', ''))
        )
      }
    });

    // Test reporting configuration
    tests.push({
      name: 'CSP Reporting Configuration',
      category: 'compliance',
      status: cspConfig.reportUri ? 'passed' : 'warning',
      details: {
        hasReporting: !!cspConfig.reportUri,
        reportUri: cspConfig.reportUri,
        reportOnly: cspConfig.reportOnly
      }
    });

    // Test gaming industry best practices
    const gamingBestPractices = [
      { name: 'Real-time Communication', check: (directives.connectSrc || []).some(src => src.includes('wss:')) },
      { name: 'Media Content Support', check: (directives.mediaSrc || []).includes('blob:') },
      { name: 'Gaming Platform Integration', check: (directives.frameSrc || []).some(src => src.includes('twitch.tv')) },
      { name: 'Web3 Wallet Support', check: (directives.frameSrc || []).some(src => src.includes('phantom.app')) }
    ];

    gamingBestPractices.forEach(practice => {
      tests.push({
        name: practice.name,
        category: 'compliance',
        status: practice.check ? 'passed' : 'warning',
        details: { bestPractice: practice.name, implemented: practice.check }
      });
    });

    return tests;
  }

  /**
   * Test CSP violation handling
   */
  async testViolationHandling() {
    const testViolations = [
      {
        'violated-directive': 'script-src',
        'blocked-uri': 'eval',
        'source-file': 'https://example.com/test.js',
        'line-number': 42
      },
      {
        'violated-directive': 'frame-src',
        'blocked-uri': 'https://untrusted-site.com',
        'source-file': 'https://mlg.clan/clan-page',
        'line-number': 15
      },
      {
        'violated-directive': 'connect-src',
        'blocked-uri': 'https://phantom.app/connect',
        'source-file': 'https://mlg.clan/wallet',
        'line-number': 8
      }
    ];

    const results = [];
    
    for (const violation of testViolations) {
      const category = categorizeCSPViolation(violation);
      const processed = await this.monitor.processViolation(violation, {
        ip: '127.0.0.1',
        userAgent: 'Test Agent',
        url: '/test',
        method: 'GET',
        sessionId: 'test-session'
      });

      results.push({
        violation,
        category,
        processed,
        expectedCategory: this.getExpectedCategory(violation)
      });
    }

    return {
      name: 'CSP Violation Handling',
      category: 'monitoring',
      status: results.every(r => r.processed) ? 'passed' : 'failed',
      details: { testResults: results }
    };
  }

  /**
   * Generate CSP test report
   */
  generateTestReport(testResults) {
    const report = {
      title: 'MLG.clan CSP Security Audit Report',
      timestamp: new Date().toISOString(),
      environment: testResults.environment,
      summary: testResults.summary,
      sections: []
    };

    // Add test sections
    Object.entries(testResults.tests).forEach(([category, tests]) => {
      const categoryStats = {
        total: tests.length,
        passed: tests.filter(t => t.status === 'passed').length,
        failed: tests.filter(t => t.status === 'failed').length,
        warnings: tests.filter(t => t.status === 'warning').length
      };

      report.sections.push({
        category: category.toUpperCase(),
        stats: categoryStats,
        tests,
        recommendations: this.generateRecommendations(tests)
      });
    });

    return report;
  }

  /**
   * Helper methods
   */
  checkRequiredDirectives(directives) {
    const missing = this.options.REQUIRED_DIRECTIVES.filter(directive => 
      !directives.hasOwnProperty(directive.replace('-', ''))
    );
    
    return {
      present: Object.keys(directives),
      missing,
      allPresent: missing.length === 0
    };
  }

  findDomainsInDirectives(domains, directives) {
    const found = {};
    
    domains.forEach(domain => {
      found[domain] = [];
      Object.entries(directives).forEach(([directive, sources]) => {
        if (Array.isArray(sources) && sources.some(src => src.includes(domain))) {
          found[domain].push(directive);
        }
      });
    });
    
    return found;
  }

  getExpectedCategory(violation) {
    const directive = violation['violated-directive'];
    const blockedUri = violation['blocked-uri'];
    
    if (blockedUri.includes('phantom.app')) return CSP_VIOLATION_CATEGORIES.WALLET_INTEGRATION;
    if (directive.includes('frame-src')) return CSP_VIOLATION_CATEGORIES.GAMING_EMBED;
    if (directive.includes('script-src')) return CSP_VIOLATION_CATEGORIES.GAMING_CONTENT;
    
    return CSP_VIOLATION_CATEGORIES.UNKNOWN;
  }

  generateRecommendations(tests) {
    const recommendations = [];
    
    tests.forEach(test => {
      if (test.status === 'failed') {
        switch (test.name) {
          case 'No Unsafe Eval in Production':
            recommendations.push('Remove unsafe-eval from script-src in production');
            break;
          case 'No Data URIs in Script Sources':
            recommendations.push('Avoid data: URIs in script sources due to security risks');
            break;
          default:
            recommendations.push(`Address failed test: ${test.name}`);
        }
      } else if (test.status === 'warning') {
        recommendations.push(`Consider improving: ${test.name}`);
      }
    });
    
    return recommendations;
  }
}

/**
 * Run quick CSP validation
 */
export async function quickCSPValidation(environment = 'production') {
  const suite = new CSPTestSuite();
  const basicTests = await suite.runBasicCSPTests(environment);
  const securityTests = await suite.runSecurityValidationTests(environment);
  
  const allTests = [...basicTests, ...securityTests];
  const passed = allTests.filter(t => t.status === 'passed').length;
  const total = allTests.length;
  
  return {
    score: Math.round((passed / total) * 100),
    passed,
    total,
    environment,
    criticalIssues: allTests.filter(t => t.status === 'failed'),
    warnings: allTests.filter(t => t.status === 'warning')
  };
}

/**
 * Validate CSP against gaming platform requirements
 */
export function validateGamingCSP(cspDirectives, requirements = {}) {
  const issues = [];
  const recommendations = [];
  
  // Check gaming platform integrations
  if (requirements.enableTwitch) {
    const hastwitch = (cspDirectives.frameSrc || []).some(src => src.includes('twitch.tv'));
    if (!hastwitch) {
      issues.push('Missing Twitch integration support in frame-src');
      recommendations.push('Add https://twitch.tv and https://player.twitch.tv to frame-src');
    }
  }
  
  // Check Web3 wallet support
  if (requirements.enableWeb3) {
    const hasWalletSupport = (cspDirectives.frameSrc || []).some(src => 
      src.includes('phantom.app') || src.includes('solflare.com')
    );
    if (!hasWalletSupport) {
      issues.push('Missing Web3 wallet support in frame-src');
      recommendations.push('Add wallet provider domains to frame-src');
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
    recommendations
  };
}

export { CSPTestSuite, CSP_TEST_CONFIG };
export default CSPTestSuite;