/**
 * Input Sanitization and XSS Protection Demo Script for MLG.clan Gaming Platform
 * 
 * Demonstrates the comprehensive input sanitization and XSS protection system
 * with gaming-specific content validation, Web3 security, and real-time chat protection.
 * 
 * @author Claude Code - Security & Performance Auditor
 * @version 1.0.0
 * @created 2025-08-12
 */

import {
  gamingSecuritySystem,
  gamingValidator,
  gamingXSSProtection,
  gamingContentFilter,
  securityUtils
} from '../src/core/security/input-sanitization/index.js';

console.log('🛡️ MLG.clan Input Sanitization & XSS Protection Demo\n');

// Demo 1: Gaming Content Validation
console.log('🎮 Demo 1: Gaming Content Validation');
console.log('====================================');

const usernames = [
  'MLGPlayer2024',
  'Invalid@User!',
  'TooLongUsernameExceedsMaximumCharacterLimit123456',
  'ValidGamer_123',
  'script_alert'
];

console.log('Testing usernames:');
usernames.forEach(username => {
  const result = gamingValidator.validateUsername(username);
  console.log(`  ${username}: ${result.isValid ? '✅ Valid' : '❌ Invalid'} ${result.error ? `(${result.error})` : ''}`);
});

// Demo 2: Wallet Address Validation
console.log('\n💰 Demo 2: Web3 Wallet Validation');
console.log('=================================');

const walletAddresses = [
  '11111111111111111111111111111111', // Valid Solana address length
  'PhantomWalletTest123456789012345', // Valid format
  'invalid-wallet-address',
  '0x742d35Cc6635C0532925a3b8D50C5c4404c71c6', // Ethereum format
  '0x0000000000000000000000000000000000000000' // Null address
];

console.log('Testing wallet addresses:');
walletAddresses.forEach(address => {
  const solanaResult = gamingValidator.validateWalletAddress(address, 'solana');
  const ethResult = gamingValidator.validateWalletAddress(address, 'ethereum');
  console.log(`  ${address.substring(0, 20)}...:`);
  console.log(`    Solana: ${solanaResult.isValid ? '✅' : '❌'}`);
  console.log(`    Ethereum: ${ethResult.isValid ? '✅' : '❌'}`);
});

// Demo 3: Gaming Chat Message Security
console.log('\n💬 Demo 3: Gaming Chat Message Security');
console.log('======================================');

const chatMessages = [
  'gg wp everyone! great tournament #MLGTournament',
  'Hey @player123, that was an amazing clutch!',
  '<script>alert("xss")</script>nice play!',
  'Join my discord for free tokens and NFTs!',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // Spam
  'You are trash at this game noob',
  'Send me your private keys for double coins!',
  'Nice strat! The meta is really evolving 🎮'
];

console.log('Testing chat messages:');
for (const message of chatMessages) {
  const result = await gamingSecuritySystem.processContent(message, {
    contentType: 'chat',
    userId: 'demo-user-123',
    tournamentMode: false
  });
  
  console.log(`\nInput: "${message}"`);
  console.log(`Status: ${result.success ? '✅ Allowed' : '❌ Blocked'}`);
  if (!result.success) {
    console.log(`Reason: ${result.error}`);
    console.log(`Stage: ${result.stage}`);
  } else {
    console.log(`Output: "${result.content}"`);
    if (result.content !== message) {
      console.log(`🔧 Content was modified`);
    }
  }
}

// Demo 4: XSS Protection Testing
console.log('\n🛡️ Demo 4: XSS Protection Testing');
console.log('=================================');

const xssTestVectors = [
  '<script>alert("Gaming XSS")</script>',
  '<img src="x" onerror="alert(\'Profile XSS\')">',
  'javascript:alert("Clan XSS")',
  '<iframe src="javascript:alert(\'Tournament XSS\')"></iframe>',
  'Valid gaming content with @mention and #hashtag',
  '<gaming-stat data-player-id="123" data-stat-type="kills">50</gaming-stat>',
  'document.cookie = "steal=data";',
  'window.location = "https://malicious.site";'
];

console.log('Testing XSS protection:');
xssTestVectors.forEach(vector => {
  const result = gamingXSSProtection.protectGamingContent(vector, 'general');
  console.log(`\nInput: "${vector}"`);
  console.log(`Clean: ${result.isClean ? '✅' : '❌'}`);
  console.log(`Output: "${result.content}"`);
  if (result.threats.length > 0) {
    console.log(`Threats: ${result.threats.map(t => t.type).join(', ')}`);
  }
});

// Demo 5: Content Filter Testing
console.log('\n🎯 Demo 5: Content Filter Testing');
console.log('=================================');

const filterTestContent = [
  'gg wp amazing game everyone!',
  'this tournament bracket is hype!',
  'stupid noob player trash at game',
  'Free cryptocurrency click this link now!',
  'My phone number is 555-123-4567',
  'email me at test@example.com',
  'Join telegram @scammer for free coins',
  'That was a clutch play, well done!'
];

console.log('Testing content filtering:');
filterTestContent.forEach(content => {
  const result = gamingContentFilter.filterContent(content, {
    contentType: 'chat',
    filterLevel: 'moderate',
    tournamentMode: false
  });
  
  console.log(`\nInput: "${content}"`);
  console.log(`Clean: ${result.isClean ? '✅' : '❌'}`);
  console.log(`Blocked: ${result.blocked ? '❌' : '✅'}`);
  console.log(`Output: "${result.filtered}"`);
  if (result.warnings.length > 0) {
    console.log(`Warnings: ${result.warnings.join(', ')}`);
  }
  if (result.gamingContext.hasGamingTerms) {
    console.log(`🎮 Gaming context detected (score: ${(result.gamingContext.gamingScore * 100).toFixed(1)}%)`);
  }
});

// Demo 6: Clan Content Validation
console.log('\n🏰 Demo 6: Clan Content Validation');
console.log('==================================');

const clanData = [
  {
    name: 'Elite Gaming Clan',
    tag: 'EGC',
    description: 'We are a competitive gaming clan focused on tournaments and skill development.'
  },
  {
    name: 'Scam Clan <script>alert("xss")</script>',
    tag: 'SCAM123',
    description: 'Join us for free tokens! Send your wallet private keys to admin@scam.com for verification.'
  },
  {
    name: 'Pro MLG Team',
    tag: 'MLG',
    description: 'Professional esports team with <gaming-stat data-stat-type="wins">127</gaming-stat> tournament wins!'
  }
];

console.log('Testing clan content:');
clanData.forEach((clan, index) => {
  console.log(`\nClan ${index + 1}:`);
  
  const nameResult = gamingValidator.validateClanInfo({ name: clan.name });
  console.log(`  Name: ${nameResult.isValid ? '✅' : '❌'} "${clan.name}"`);
  if (!nameResult.isValid) {
    console.log(`    Errors: ${nameResult.errors.join(', ')}`);
  }
  
  const tagResult = gamingValidator.validateClanInfo({ tag: clan.tag });
  console.log(`  Tag: ${tagResult.isValid ? '✅' : '❌'} "${clan.tag}"`);
  
  const descResult = gamingXSSProtection.protectGamingContent(clan.description, 'clan');
  console.log(`  Description: ${descResult.isClean ? '✅' : '❌'}`);
  console.log(`    Output: "${descResult.content}"`);
});

// Demo 7: Batch Processing
console.log('\n📦 Demo 7: Batch Content Processing');
console.log('===================================');

const batchContent = [
  { content: 'gg everyone!', context: { contentType: 'chat' } },
  { content: 'MLGPlayer123', context: { contentType: 'username' } },
  { content: '<script>alert("batch xss")</script>', context: { contentType: 'chat' } },
  { content: 'Amazing tournament! #esports', context: { contentType: 'chat', tournamentMode: true } }
];

console.log('Processing batch content:');
const batchResult = await gamingSecuritySystem.batchProcess(batchContent);

console.log(`\nBatch Summary:`);
console.log(`  Total items: ${batchResult.summary.total}`);
console.log(`  Successful: ${batchResult.summary.successful}`);
console.log(`  Blocked: ${batchResult.summary.blocked}`);
console.log(`  Average processing time: ${batchResult.summary.averageProcessingTime.toFixed(2)}ms`);

batchResult.results.forEach((result, index) => {
  console.log(`\n  Item ${index + 1}: ${result.success ? '✅' : '❌'}`);
  console.log(`    Input: "${batchContent[index].content}"`);
  console.log(`    Output: "${result.content}"`);
});

// Demo 8: Security Testing Suite
console.log('\n🧪 Demo 8: Security Testing Suite');
console.log('=================================');

console.log('Running comprehensive security tests...');
const testResults = await gamingSecuritySystem.runSecurityTests();

console.log(`\nOverall Test Results:`);
console.log(`  Total tests: ${testResults.overall.totalTests}`);
console.log(`  Passed: ${testResults.overall.passedTests}`);
console.log(`  Success rate: ${testResults.overall.successRate}`);

console.log(`\nValidation Tests: ${testResults.validation.passedTests}/${testResults.validation.totalTests}`);
console.log(`XSS Protection Tests: ${testResults.xss.threatsBlocked}/${testResults.xss.totalTests}`);
console.log(`Content Filter Tests: ${testResults.filter.passedTests}/${testResults.filter.totalTests}`);
console.log(`Integration Tests: ${testResults.integration.passedTests}/${testResults.integration.totalTests}`);

// Demo 9: Performance Monitoring
console.log('\n📊 Demo 9: Performance & Statistics');
console.log('===================================');

const stats = gamingSecuritySystem.getSecurityStatistics();

console.log('Security System Statistics:');
console.log(`  Total content processed: ${stats.system.totalProcessed}`);
console.log(`  Success rate: ${stats.system.successRate}`);
console.log(`  Average processing time: ${stats.system.averageProcessingTime.toFixed(2)}ms`);
console.log(`  Uptime: ${Math.round(stats.system.uptime / 1000)}s`);

console.log('\nValidation Statistics:');
console.log(`  Total validations: ${stats.validation.totalValidations}`);
console.log(`  Success rate: ${stats.validation.successRate}`);

console.log('\nXSS Protection Statistics:');
console.log(`  Total processed: ${stats.xss.totalProcessed}`);
console.log(`  Threats blocked: ${stats.xss.threatsBlocked}`);
console.log(`  Block rate: ${stats.xss.threatBlockRate}`);

console.log('\nContent Filter Statistics:');
console.log(`  Total filtered: ${stats.filter.totalFiltered}`);
console.log(`  Spam blocked: ${stats.filter.spamBlocked}`);
console.log(`  Filter efficiency: ${stats.filter.filterEfficiency}`);

// Demo 10: Real-time Gaming Scenarios
console.log('\n⚡ Demo 10: Real-time Gaming Scenarios');
console.log('=====================================');

const gamingScenarios = [
  {
    scenario: 'Tournament Chat',
    content: '@player456 nice clutch! #MLGTournament2024',
    context: { contentType: 'chat', tournamentMode: true, userId: 'player123' }
  },
  {
    scenario: 'Clan Recruitment',
    content: 'Looking for skilled players! Join [MLG] clan for competitive tournaments!',
    context: { contentType: 'chat', clanContext: true }
  },
  {
    scenario: 'Vote Transaction',
    content: 'Burning 5 MLG tokens for vote on player456',
    context: { contentType: 'web3', userId: 'player123' }
  },
  {
    scenario: 'Leaderboard Update',
    content: 'GG! New high score: 15,247 points! 🎮',
    context: { contentType: 'chat', userId: 'player789' }
  }
];

console.log('Testing real-time gaming scenarios:');
for (const scenario of gamingScenarios) {
  console.log(`\n${scenario.scenario}:`);
  
  // Use quick check for real-time performance
  const quickResult = gamingSecuritySystem.quickSecurityCheck(scenario.content, scenario.context.contentType);
  console.log(`  Quick check: ${quickResult.isSecure ? '✅' : '❌'} (${quickResult.processingTime}ms)`);
  
  // Full processing for demonstration
  const fullResult = await gamingSecuritySystem.processContent(scenario.content, scenario.context);
  console.log(`  Full process: ${fullResult.success ? '✅' : '❌'} (${fullResult.processingTime}ms)`);
  console.log(`  Input: "${scenario.content}"`);
  console.log(`  Output: "${fullResult.content}"`);
}

// Final Summary
console.log('\n🎯 Demo Summary');
console.log('===============');

const finalStats = gamingSecuritySystem.getSecurityStatistics();
console.log(`Total security operations completed: ${finalStats.system.totalProcessed}`);
console.log(`Overall system success rate: ${finalStats.system.successRate}`);
console.log(`Average processing time: ${finalStats.system.averageProcessingTime.toFixed(2)}ms`);

console.log('\n✅ Input Sanitization & XSS Protection Demo completed successfully!');
console.log('\nSecurity Features Demonstrated:');
console.log('  ✅ Gaming content validation with username/clan checks');
console.log('  ✅ Web3 wallet address validation for Solana and Ethereum');
console.log('  ✅ Real-time chat message security with gaming context awareness');
console.log('  ✅ XSS protection with gaming-specific threat detection');
console.log('  ✅ Content filtering with gaming language preservation');
console.log('  ✅ Batch processing for bulk content moderation');
console.log('  ✅ Comprehensive security testing suite');
console.log('  ✅ Performance monitoring and statistics');
console.log('  ✅ Real-time gaming scenario protection');
console.log('  ✅ Tournament and clan context-aware security');

console.log('\nPerformance Achievements:');
console.log(`  ⚡ Processing speed: <${finalStats.system.averageProcessingTime.toFixed(1)}ms average`);
console.log(`  🛡️ Security coverage: ${finalStats.system.successRate} success rate`);
console.log(`  🎮 Gaming context: Preserved competitive language and terminology`);
console.log(`  🔒 Web3 security: Protected wallet and transaction data`);
console.log(`  💬 Chat protection: Real-time messaging security enabled`);

console.log('\nThe MLG.clan platform now has comprehensive input sanitization and XSS protection,');
console.log('optimized for gaming communities with Web3 integration and real-time interactions!');

// Export demo functions for external use
export {
  gamingSecuritySystem,
  finalStats
};