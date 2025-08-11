/**
 * Burn-to-Vote Mechanism Demo
 * 
 * This demo file showcases the enhanced burn-to-vote functionality
 * implemented in sub-task 3.2 of the MLG.clan task list.
 * 
 * Features demonstrated:
 * - Progressive pricing system (1, 2, 3, 4 MLG tokens)
 * - User balance validation and affordability checks
 * - Comprehensive burn vote preview generation
 * - Transaction fee estimation for burn operations
 * - Enhanced user confirmation flows with detailed information
 */

import { 
  generateBurnVotePreview,
  calculateTotalBurnCost,
  getNextBurnVoteCost,
  validateBurnVoteAffordability,
  validateBurnAmount,
  getVotingConfig
} from './solana-voting-system.js';

/**
 * Demo scenarios for burn-to-vote mechanism
 */
export const BURN_VOTE_DEMO_SCENARIOS = {
  // User with plenty of MLG tokens
  WEALTHY_USER: {
    mlgBalance: 50.0,
    solBalance: 0.1,
    burnVotesUsed: 0,
    description: 'User with abundant MLG tokens who can afford all burn votes'
  },
  
  // User with limited MLG tokens
  BUDGET_USER: {
    mlgBalance: 3.5,
    solBalance: 0.01,
    burnVotesUsed: 0,
    description: 'User with limited MLG tokens who can afford only first 2 burn votes'
  },
  
  // User who has already used some burn votes
  PARTIAL_USER: {
    mlgBalance: 8.0,
    solBalance: 0.05,
    burnVotesUsed: 2,
    description: 'User who has used 2 burn votes and can afford remaining ones'
  },
  
  // User at maximum burn votes
  MAX_VOTES_USER: {
    mlgBalance: 100.0,
    solBalance: 0.1,
    burnVotesUsed: 4,
    description: 'User who has used all 4 burn votes for the day'
  },
  
  // User with insufficient SOL for fees
  LOW_SOL_USER: {
    mlgBalance: 10.0,
    solBalance: 0.0001,
    burnVotesUsed: 0,
    description: 'User with MLG tokens but insufficient SOL for transaction fees'
  }
};

/**
 * Run comprehensive burn-to-vote demo
 */
export function runBurnVoteDemo() {
  console.log('\n🔥 BURN-TO-VOTE MECHANISM DEMO\n');
  console.log('='.repeat(50));
  
  // Display system configuration
  const config = getVotingConfig();
  console.log('\n📊 PROGRESSIVE PRICING SYSTEM:');
  console.log('Vote #1: 1 MLG token');
  console.log('Vote #2: 2 MLG tokens'); 
  console.log('Vote #3: 3 MLG tokens');
  console.log('Vote #4: 4 MLG tokens');
  console.log(`Total cost for all 4 votes: ${Object.values(config.BURN_VOTE_COSTS).reduce((a, b) => a + b, 0)} MLG tokens`);
  
  console.log('\n' + '='.repeat(50));
  
  // Test each demo scenario
  Object.entries(BURN_VOTE_DEMO_SCENARIOS).forEach(([scenarioName, scenario]) => {
    console.log(`\n🧪 SCENARIO: ${scenarioName}`);
    console.log(`📋 ${scenario.description}`);
    console.log(`💰 MLG Balance: ${scenario.mlgBalance}`);
    console.log(`💎 SOL Balance: ${scenario.solBalance}`);
    console.log(`🔥 Burn Votes Used: ${scenario.burnVotesUsed}/4`);
    
    // Generate comprehensive preview
    const preview = generateBurnVotePreview(
      scenario.mlgBalance,
      scenario.burnVotesUsed,
      scenario.solBalance
    );
    
    console.log('\n📈 AVAILABLE BURN VOTES:');
    if (preview.availableVotes.length === 0) {
      console.log('  ❌ No burn votes available (max reached)');
    } else {
      preview.availableVotes.forEach(vote => {
        const status = vote.affordable ? '✅ Affordable' : '❌ Too expensive';
        console.log(`  Vote #${vote.voteNumber}: ${vote.cost} MLG - ${status}`);
      });
    }
    
    // Display cost breakdown
    if (preview.costBreakdown.totalCostAllRemaining > 0) {
      console.log(`\n💸 Total cost for remaining votes: ${preview.costBreakdown.totalCostAllRemaining} MLG`);
    }
    
    // Show recommendations
    console.log('\n🎯 RECOMMENDATIONS:');
    preview.recommendations.forEach(rec => {
      const icon = {
        'success': '✅',
        'warning': '⚠️',
        'error': '❌',
        'info': 'ℹ️',
        'tip': '💡'
      }[rec.type] || 'ℹ️';
      console.log(`  ${icon} ${rec.message}`);
    });
    
    // Test next vote cost function
    const nextVote = getNextBurnVoteCost(scenario.burnVotesUsed);
    if (nextVote.hasNextVote) {
      console.log(`\n🔮 Next burn vote: #${nextVote.voteNumber} costs ${nextVote.cost} MLG`);
      
      // Test affordability
      const affordability = validateBurnVoteAffordability(scenario.mlgBalance, scenario.burnVotesUsed);
      if (affordability.canAfford) {
        console.log('  ✅ User can afford next burn vote');
      } else {
        console.log(`  ❌ ${affordability.reason}`);
        if (affordability.shortfall > 0) {
          console.log(`  💰 Shortfall: ${affordability.shortfall.toFixed(2)} MLG`);
        }
      }
    }
    
    console.log('\n' + '-'.repeat(30));
  });
  
  // Demonstrate utility functions
  console.log('\n🛠️ UTILITY FUNCTIONS DEMO:\n');
  
  // Calculate costs for different vote ranges
  console.log('📊 BULK COST CALCULATIONS:');
  const scenarios = [
    { from: 1, to: 4, description: 'All 4 burn votes' },
    { from: 1, to: 2, description: 'First 2 burn votes' },
    { from: 3, to: 4, description: 'Last 2 burn votes' }
  ];
  
  scenarios.forEach(({ from, to, description }) => {
    const cost = calculateTotalBurnCost(from, to);
    if (cost.isValid) {
      console.log(`  ${description}: ${cost.totalCost} MLG`);
      console.log(`    Breakdown: ${cost.breakdown.map(b => `Vote #${b.voteNumber}: ${b.cost} MLG`).join(', ')}`);
      console.log(`    Average cost per vote: ${cost.averageCost.toFixed(2)} MLG`);
    }
  });
  
  // Test burn amount validation
  console.log('\n🔍 BURN AMOUNT VALIDATION:');
  const validationTests = [
    { amount: 1, voteNumber: 1 },
    { amount: 2, voteNumber: 2 },
    { amount: 3, voteNumber: 3 },
    { amount: 4, voteNumber: 4 },
    { amount: 2, voteNumber: 1 }, // Wrong amount for vote 1
    { amount: 5, voteNumber: 5 }  // Invalid vote number
  ];
  
  validationTests.forEach(test => {
    const result = validateBurnAmount(test.amount, test.voteNumber);
    const status = result.isValid ? '✅ Valid' : '❌ Invalid';
    console.log(`  ${test.amount} MLG for vote #${test.voteNumber}: ${status}`);
    if (!result.isValid) {
      console.log(`    Error: ${result.error}`);
    }
  });
  
  console.log('\n🎉 BURN-TO-VOTE DEMO COMPLETE!');
  console.log('='.repeat(50));
  
  return {
    scenarios: Object.keys(BURN_VOTE_DEMO_SCENARIOS),
    totalTests: Object.keys(BURN_VOTE_DEMO_SCENARIOS).length + validationTests.length,
    systemReady: true
  };
}

/**
 * Generate burn vote cost table for documentation
 */
export function generateBurnVoteCostTable() {
  const config = getVotingConfig();
  const table = {
    headers: ['Vote Number', 'MLG Cost', 'Cumulative Cost'],
    rows: [],
    totalCost: 0
  };
  
  let cumulativeCost = 0;
  for (let voteNum = 1; voteNum <= config.MAX_BURN_VOTES; voteNum++) {
    const cost = config.BURN_VOTE_COSTS[voteNum];
    cumulativeCost += cost;
    table.rows.push([`Vote #${voteNum}`, `${cost} MLG`, `${cumulativeCost} MLG`]);
  }
  
  table.totalCost = cumulativeCost;
  
  return table;
}

/**
 * Simulate burn vote transaction flow
 */
export function simulateBurnVoteFlow(mlgBalance, solBalance, burnVotesUsed, targetVote = null) {
  const simulation = {
    userState: { mlgBalance, solBalance, burnVotesUsed },
    steps: [],
    success: false,
    errors: [],
    finalState: null
  };
  
  // Step 1: Validate user eligibility
  simulation.steps.push({
    step: 1,
    action: 'Validate user eligibility',
    status: 'in_progress'
  });
  
  const nextVote = getNextBurnVoteCost(burnVotesUsed);
  if (!nextVote.hasNextVote) {
    simulation.steps[0].status = 'failed';
    simulation.errors.push('Maximum burn votes reached for today');
    return simulation;
  }
  
  const voteNumber = targetVote || nextVote.voteNumber;
  const mlgCost = nextVote.cost;
  
  // Step 2: Check MLG balance
  simulation.steps.push({
    step: 2,
    action: `Check MLG balance for ${mlgCost} MLG`,
    status: 'in_progress'
  });
  
  if (mlgBalance < mlgCost) {
    simulation.steps[1].status = 'failed';
    simulation.errors.push(`Insufficient MLG balance. Need ${mlgCost}, have ${mlgBalance}`);
    return simulation;
  }
  
  // Step 3: Check SOL balance for fees
  simulation.steps.push({
    step: 3,
    action: 'Check SOL balance for transaction fees',
    status: 'in_progress'
  });
  
  const requiredSOL = 0.001; // Minimum for transaction fees
  if (solBalance < requiredSOL) {
    simulation.steps[2].status = 'failed';
    simulation.errors.push(`Insufficient SOL for transaction fees. Need ${requiredSOL}, have ${solBalance}`);
    return simulation;
  }
  
  // Step 4: User confirmation (simulated)
  simulation.steps.push({
    step: 4,
    action: 'User confirmation for token burn',
    status: 'completed'
  });
  
  // Step 5: Create burn transaction
  simulation.steps.push({
    step: 5,
    action: 'Create MLG token burn transaction',
    status: 'completed'
  });
  
  // Step 6: Simulate burn transaction
  simulation.steps.push({
    step: 6,
    action: 'Simulate burn transaction',
    status: 'completed'
  });
  
  // Step 7: Execute burn
  simulation.steps.push({
    step: 7,
    action: `Burn ${mlgCost} MLG tokens`,
    status: 'completed'
  });
  
  // Step 8: Submit vote
  simulation.steps.push({
    step: 8,
    action: `Submit burn vote #${voteNumber}`,
    status: 'completed'
  });
  
  // Mark all steps as completed
  simulation.steps.forEach(step => {
    if (step.status === 'in_progress') {
      step.status = 'completed';
    }
  });
  
  simulation.success = true;
  simulation.finalState = {
    mlgBalance: mlgBalance - mlgCost,
    solBalance: solBalance - 0.001, // Approximate fee
    burnVotesUsed: burnVotesUsed + 1,
    newVoteSubmitted: voteNumber
  };
  
  return simulation;
}

// Export for testing and integration
export default {
  runBurnVoteDemo,
  generateBurnVoteCostTable,
  simulateBurnVoteFlow,
  BURN_VOTE_DEMO_SCENARIOS
};