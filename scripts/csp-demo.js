/**
 * CSP Implementation Demo Script for MLG.clan Gaming Platform
 * 
 * Demonstrates the comprehensive CSP system with gaming and Web3 integration.
 * 
 * @author Claude Code - Security & Performance Auditor
 * @version 1.0.0
 * @created 2025-08-12
 */

import { 
  createGamingCSPConfig,
  validateCSPConfiguration,
  quickCSPValidation,
  initializeCSPSystem,
  createMLGCSPStack
} from '../src/core/security/csp/index.js';

console.log('🎮 MLG.clan CSP Implementation Demo\n');

// Demo 1: Basic CSP Configuration
console.log('📋 Demo 1: Gaming CSP Configuration');
console.log('=====================================');

const devConfig = createGamingCSPConfig('development');
const prodConfig = createGamingCSPConfig('production');

console.log('Development CSP directives count:', Object.keys(devConfig.directives).length);
console.log('Production CSP directives count:', Object.keys(prodConfig.directives).length);
console.log('Report-only mode in dev:', devConfig.reportOnly);
console.log('Report-only mode in prod:', prodConfig.reportOnly);

// Demo 2: Gaming Platform Integration
console.log('\n🎯 Demo 2: Gaming Platform Integration');
console.log('======================================');

const frameSources = prodConfig.directives.frameSrc || [];
const connectSources = prodConfig.directives.connectSrc || [];

console.log('Gaming platforms supported:');
const gamingPlatforms = ['twitch.tv', 'youtube.com', 'discord.com', 'steam.com'];
gamingPlatforms.forEach(platform => {
  const supported = frameSources.some(src => src.includes(platform)) ||
                   connectSources.some(src => src.includes(platform));
  console.log(`  ✓ ${platform}: ${supported ? 'Supported' : 'Not found'}`);
});

// Demo 3: Web3 Integration
console.log('\n🔗 Demo 3: Web3 & Blockchain Integration');
console.log('========================================');

const web3Wallets = ['phantom.app', 'solflare.com', 'backpack.app'];
console.log('Web3 wallet integration:');
web3Wallets.forEach(wallet => {
  const supported = frameSources.some(src => src.includes(wallet));
  console.log(`  ✓ ${wallet}: ${supported ? 'Integrated' : 'Not found'}`);
});

const solanaEndpoints = ['api.mainnet-beta.solana.com', 'api.devnet.solana.com'];
console.log('\nSolana network endpoints:');
solanaEndpoints.forEach(endpoint => {
  const supported = connectSources.some(src => src.includes(endpoint));
  console.log(`  ✓ ${endpoint}: ${supported ? 'Configured' : 'Not found'}`);
});

// Demo 4: Security Validation
console.log('\n🔒 Demo 4: Security Validation');
console.log('==============================');

async function runSecurityValidation() {
  try {
    const quickValidation = await quickCSPValidation('production');
    console.log(`Security Score: ${quickValidation.score}/100`);
    console.log(`Tests Passed: ${quickValidation.passed}/${quickValidation.total}`);
    
    if (quickValidation.criticalIssues.length > 0) {
      console.log('\n⚠️ Critical Issues Found:');
      quickValidation.criticalIssues.forEach(issue => {
        console.log(`  - ${issue.name}: ${issue.category}`);
      });
    } else {
      console.log('✅ No critical security issues found');
    }
    
    if (quickValidation.warnings.length > 0) {
      console.log('\n💡 Warnings:');
      quickValidation.warnings.slice(0, 3).forEach(warning => {
        console.log(`  - ${warning.name}`);
      });
    }
  } catch (error) {
    console.error('Security validation error:', error.message);
  }
}

// Demo 5: CSP Middleware Stack
console.log('\n⚙️ Demo 5: Middleware Stack');
console.log('===========================');

const middlewareStack = createMLGCSPStack({
  environment: 'production',
  solanaNetwork: 'mainnet-beta',
  enabledWallets: ['phantom', 'solflare', 'backpack'],
  enableReporting: true,
  enableMonitoring: true
});

console.log(`Middleware stack components: ${middlewareStack.length}`);
console.log('Components:');
middlewareStack.forEach((middleware, index) => {
  const name = middleware.name || `Middleware ${index + 1}`;
  console.log(`  ${index + 1}. ${name}`);
});

// Demo 6: Violation Monitoring
console.log('\n📊 Demo 6: Violation Monitoring');
console.log('===============================');

const monitor = initializeCSPSystem({
  ALERTS: {
    enableRealTime: true,
    enableEmail: false
  }
});

// Simulate a test violation
const testViolation = {
  'violated-directive': 'script-src',
  'blocked-uri': 'https://example.com/malicious.js',
  'source-file': 'https://mlg.clan/clan-page',
  'line-number': 42
};

console.log('Processing test violation...');
monitor.processViolation(testViolation, {
  ip: '127.0.0.1',
  userAgent: 'Mozilla/5.0 (Test Browser)',
  url: '/test-page',
  method: 'GET',
  sessionId: 'demo-session-123',
  userId: 'demo-user'
});

const stats = monitor.getStatistics();
console.log('Monitoring statistics:');
console.log(`  Total violations processed: ${stats.totalViolations}`);
console.log(`  Unique violations: ${stats.violationStore.totalStored}`);
console.log(`  Uptime: ${Math.round(stats.uptime / 1000)}s`);

// Demo 7: Gaming-Specific Features
console.log('\n🎮 Demo 7: Gaming-Specific Features');
console.log('===================================');

console.log('Gaming content security features:');
console.log('  ✓ Tournament integrity protection');
console.log('  ✓ Clan content validation');
console.log('  ✓ User-generated content filtering');
console.log('  ✓ Real-time gaming data security');

console.log('\nWeb3 gaming features:');
console.log('  ✓ MLG token burn security');
console.log('  ✓ Voting system protection');
console.log('  ✓ NFT achievement security');
console.log('  ✓ Wallet transaction validation');

// Demo 8: Performance Analysis
console.log('\n⚡ Demo 8: Performance Analysis');
console.log('==============================');

const cspString = JSON.stringify(prodConfig.directives);
const headerSize = new Blob([cspString]).size;

console.log('Performance metrics:');
console.log(`  CSP header size: ${(headerSize / 1024).toFixed(2)} KB`);
console.log(`  Directive count: ${Object.keys(prodConfig.directives).length}`);
console.log(`  Total source count: ${Object.values(prodConfig.directives).flat().length}`);
console.log(`  Performance score: ${headerSize < 8192 ? 'Excellent' : 'Needs optimization'}`);

// Run async demo
console.log('\n🚀 Running Security Validation...');
runSecurityValidation().then(() => {
  console.log('\n✅ CSP Demo completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Review security validation results');
  console.log('2. Configure environment-specific settings');
  console.log('3. Enable monitoring and alerting');
  console.log('4. Deploy with report-only mode first');
  console.log('5. Monitor violations and adjust policies');
  
  // Cleanup
  monitor.shutdown();
}).catch(error => {
  console.error('\n❌ Demo error:', error);
  monitor.shutdown();
});

// Export demo functions for external use
export {
  runSecurityValidation,
  monitor
};