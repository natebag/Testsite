// JavaScript Function Validation Script
// This script validates that all key interactive functions are properly defined

const validationResults = [];

function validateFunction(objName, functionName, expectedType = 'function') {
  try {
    if (objName === 'window') {
      const func = window[functionName];
      if (typeof func === expectedType) {
        validationResults.push({ name: functionName, status: '✅', type: typeof func });
      } else if (func !== undefined) {
        validationResults.push({ name: functionName, status: '⚠️', type: typeof func, expected: expectedType });
      } else {
        validationResults.push({ name: functionName, status: '❌', type: 'undefined', expected: expectedType });
      }
    } else {
      const obj = window[objName];
      if (obj && typeof obj[functionName] === expectedType) {
        validationResults.push({ name: `${objName}.${functionName}`, status: '✅', type: typeof obj[functionName] });
      } else if (obj) {
        validationResults.push({ name: `${objName}.${functionName}`, status: '❌', type: obj[functionName] ? typeof obj[functionName] : 'undefined', expected: expectedType });
      } else {
        validationResults.push({ name: `${objName}.${functionName}`, status: '❌', type: 'object undefined', expected: expectedType });
      }
    }
  } catch (error) {
    validationResults.push({ name: functionName, status: '❌', error: error.message });
  }
}

// Test window-level functions
validateFunction('window', 'handleNavigation');
validateFunction('window', 'updateActiveNavigation');

// Test API clients
validateFunction('window', 'MLGApiClient', 'object');
validateFunction('window', 'MLGVotingIntegration', 'object');
validateFunction('window', 'MLGErrorHandler', 'object');
validateFunction('window', 'MLGWebSocketManager', 'object');

// Test platform classes
validateFunction('window', 'DashboardPlatform', 'function');
validateFunction('window', 'ContentPlatform', 'function');
validateFunction('window', 'VotingPlatform', 'function');
validateFunction('window', 'ClanPlatform', 'function');
validateFunction('window', 'ProfilePlatform', 'function');

console.log('\n🔍 JavaScript Function Validation Results:');
console.log('==========================================');

let passed = 0;
let total = validationResults.length;

validationResults.forEach(result => {
  if (result.status === '✅') {
    console.log(`${result.status} ${result.name} (${result.type})`);
    passed++;
  } else if (result.status === '⚠️') {
    console.log(`${result.status} ${result.name} - Expected ${result.expected}, got ${result.type}`);
  } else {
    console.log(`${result.status} ${result.name} - ${result.error || `Expected ${result.expected}, got ${result.type}`}`);
  }
});

console.log(`\n📊 Validation Summary: ${passed}/${total} functions validated (${Math.round((passed/total)*100)}%)`);

if (passed === total) {
  console.log('🎉 All functions are properly defined and accessible!');
} else if (passed >= total * 0.8) {
  console.log('⚠️ Most functions are working, but some issues detected.');
} else {
  console.log('❌ Significant issues detected with function definitions.');
}

// Export results for external access
window.functionValidationResults = {
  results: validationResults,
  summary: { passed, total, percentage: Math.round((passed/total)*100) }
};