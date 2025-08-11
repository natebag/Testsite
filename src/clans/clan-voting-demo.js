/**
 * MLG.clan Voting System - Interactive Demo
 * 
 * This demonstration showcases the clan voting system capabilities including:
 * - Creating different types of proposals
 * - Role-based voting with different weights
 * - MLG token burning for additional votes
 * - Vote delegation and proxy voting
 * - Analytics and governance health scoring
 * - Dashboard integration
 */

import ClanVotingSystem, { CLAN_VOTING_CONFIG, ClanVotingDashboard } from './clan-voting.js';

/**
 * Demo Configuration
 */
const DEMO_CONFIG = {
  clanId: 'demo-clan-mlg-2024',
  clanName: 'MLG Champions',
  demoWallets: [
    { address: 'owner_demo_wallet', role: 'owner', name: 'ClanLeader' },
    { address: 'admin_demo_wallet', role: 'admin', name: 'AdminUser' },
    { address: 'moderator_demo_wallet', role: 'moderator', name: 'ModUser' },
    { address: 'officer_demo_wallet', role: 'officer', name: 'OfficerUser' },
    { address: 'member_demo_wallet_1', role: 'member', name: 'Member1' },
    { address: 'member_demo_wallet_2', role: 'member', name: 'Member2' }
  ],
  demoProposals: [
    {
      type: 'governance',
      title: 'Update Competitive Gaming Rules',
      description: 'Proposal to implement new competitive gaming rules for tournaments and ranking systems.',
      options: ['Approve New Rules', 'Modify Rules', 'Keep Current Rules'],
      creator: 'owner_demo_wallet'
    },
    {
      type: 'budget',
      title: 'Allocate Tournament Prize Pool',
      description: 'Allocate 10,000 MLG tokens from clan treasury for upcoming championship prize pool.',
      options: ['Approve Full Amount', 'Approve 7,500 MLG', 'Approve 5,000 MLG', 'Reject Allocation'],
      creator: 'admin_demo_wallet'
    },
    {
      type: 'membership',
      title: 'Promote Active Member',
      description: 'Promote Member2 to Officer role based on outstanding performance and leadership.',
      options: ['Promote to Officer', 'Promote to Moderator', 'Keep Current Role'],
      creator: 'moderator_demo_wallet'
    }
  ]
};

/**
 * Mock Wallet Class for Demo
 */
class MockWallet {
  constructor(address, role, name) {
    this.address = address;
    this.role = role;
    this.name = name;
    this.publicKey = {
      toString: () => address
    };
  }

  async signTransaction(transaction) {
    console.log(`${this.name} (${this.role}) signing transaction...`);
    return { ...transaction, signature: `mock_signature_${this.address}_${Date.now()}` };
  }
}

/**
 * Mock Clan Voting System for Demo
 */
class DemoClanVotingSystem extends ClanVotingSystem {
  constructor(options) {
    super(options);
    this.demoMode = true;
    this.demoData = {
      members: DEMO_CONFIG.demoWallets,
      proposals: new Map(),
      votes: new Map(),
      delegations: new Map()
    };
  }

  async initializeConnections() {
    console.log('🔗 Initializing demo clan voting system...');
    this.connection = {
      getBalance: async () => 1000000, // 1 SOL
      sendAndConfirmTransaction: async (tx) => `demo_tx_${Date.now()}`
    };
    this.mlgTokenConnection = {};
    this.baseVotingSystem = {
      burnTokensForVotes: async (votes) => ({
        transaction: { signature: `burn_tx_${Date.now()}` },
        burnedTokens: votes * 10,
        totalCost: this.calculateBurnCost(votes)
      })
    };
    return true;
  }

  async getMemberRole(memberAddress) {
    const member = this.demoData.members.find(m => m.address === memberAddress);
    return member ? member.role : 'member';
  }

  async getClanMembers() {
    return this.demoData.members;
  }

  async validateWallet() {
    return true; // Always valid in demo
  }

  async validateClanMembership() {
    return true; // Always valid in demo
  }

  async validateProposalCreationPermissions(proposalType) {
    const poolConfig = CLAN_VOTING_CONFIG.POOL_TYPES[proposalType.toUpperCase()];
    const userRole = await this.getMemberRole(this.wallet.publicKey.toString());
    return poolConfig.roleRestrictions.includes(userRole);
  }

  async recordProposalOnChain(proposal) {
    console.log(`📝 Recording proposal "${proposal.title}" on blockchain...`);
    return {
      signature: `proposal_tx_${Date.now()}`,
      confirmed: true
    };
  }

  async recordVoteOnChain(proposalId, vote) {
    console.log(`🗳️ Recording vote for proposal ${proposalId} on blockchain...`);
    return {
      signature: `vote_tx_${Date.now()}`,
      confirmed: true
    };
  }

  calculateBurnCost(votes) {
    let totalCost = 0;
    for (let i = 1; i <= votes; i++) {
      totalCost += CLAN_VOTING_CONFIG.CLAN_BURN_COSTS[i] || 0;
    }
    return totalCost;
  }
}

/**
 * Demo Class - Main Demo Controller
 */
export class ClanVotingDemo {
  constructor() {
    this.currentWallet = null;
    this.votingSystem = null;
    this.activeProposals = [];
    this.demoStep = 0;
    this.results = {
      proposals: [],
      votes: [],
      analytics: null
    };
  }

  /**
   * Start the interactive demo
   */
  async startDemo() {
    console.log('🎮 MLG.clan Voting System Demo Starting...\n');
    console.log('='.repeat(60));
    console.log('🏆 Welcome to MLG Champions Clan Governance Demo');
    console.log('='.repeat(60));

    try {
      // Step 1: Setup
      await this.demoStep1_Setup();
      
      // Step 2: Create Proposals
      await this.demoStep2_CreateProposals();
      
      // Step 3: Demonstrate Voting
      await this.demoStep3_VotingScenarios();
      
      // Step 4: Show Delegations
      await this.demoStep4_Delegations();
      
      // Step 5: Analytics
      await this.demoStep5_Analytics();
      
      // Step 6: Dashboard
      await this.demoStep6_Dashboard();
      
      console.log('\n🎯 Demo completed successfully!');
      return this.results;

    } catch (error) {
      console.error('❌ Demo failed:', error);
      throw error;
    }
  }

  /**
   * Demo Step 1: System Setup and Initialization
   */
  async demoStep1_Setup() {
    console.log('\n📦 Step 1: System Setup and Initialization');
    console.log('-'.repeat(50));

    // Initialize with owner wallet
    const ownerWallet = new MockWallet(
      DEMO_CONFIG.demoWallets[0].address,
      DEMO_CONFIG.demoWallets[0].role,
      DEMO_CONFIG.demoWallets[0].name
    );

    this.votingSystem = new DemoClanVotingSystem({
      wallet: ownerWallet,
      clanId: DEMO_CONFIG.clanId
    });

    await this.votingSystem.initializeConnections();
    this.currentWallet = ownerWallet;

    console.log('✅ Clan voting system initialized');
    console.log(`   - Clan ID: ${DEMO_CONFIG.clanId}`);
    console.log(`   - Current User: ${ownerWallet.name} (${ownerWallet.role})`);
    console.log(`   - Members: ${DEMO_CONFIG.demoWallets.length}`);

    // Display configuration
    console.log('\n⚙️ Voting Configuration:');
    Object.entries(CLAN_VOTING_CONFIG.POOL_TYPES).forEach(([type, config]) => {
      console.log(`   ${config.icon} ${config.name}: ${config.passingThreshold * 100}% threshold, ${config.votingPeriodHours}h period`);
    });

    console.log('\n👥 Role Voting Weights:');
    Object.entries(CLAN_VOTING_CONFIG.ROLE_VOTING_WEIGHTS).forEach(([role, weight]) => {
      console.log(`   - ${role.charAt(0).toUpperCase() + role.slice(1)}: ${weight}x voting power`);
    });
  }

  /**
   * Demo Step 2: Create Different Types of Proposals
   */
  async demoStep2_CreateProposals() {
    console.log('\n📝 Step 2: Creating Different Types of Proposals');
    console.log('-'.repeat(50));

    for (const proposalData of DEMO_CONFIG.demoProposals) {
      // Switch to appropriate wallet for proposal creation
      const creatorWallet = new MockWallet(
        proposalData.creator,
        DEMO_CONFIG.demoWallets.find(w => w.address === proposalData.creator).role,
        DEMO_CONFIG.demoWallets.find(w => w.address === proposalData.creator).name
      );

      this.votingSystem.wallet = creatorWallet;

      console.log(`\n📋 Creating ${proposalData.type} proposal...`);
      console.log(`   Creator: ${creatorWallet.name} (${creatorWallet.role})`);
      console.log(`   Title: "${proposalData.title}"`);

      try {
        const result = await this.votingSystem.createProposal(proposalData);
        
        if (result.success) {
          console.log(`✅ Proposal created successfully!`);
          console.log(`   - Proposal ID: ${result.proposalId}`);
          console.log(`   - Voting Period: ${result.proposal.poolConfig.votingPeriodHours} hours`);
          console.log(`   - Passing Threshold: ${result.proposal.poolConfig.passingThreshold * 100}%`);
          console.log(`   - Options: ${proposalData.options.join(', ')}`);
          
          this.activeProposals.push(result);
          this.results.proposals.push(result);
        }
      } catch (error) {
        console.log(`❌ Failed to create proposal: ${error.message}`);
      }
    }

    console.log(`\n📊 Created ${this.activeProposals.length} proposals successfully`);
  }

  /**
   * Demo Step 3: Demonstrate Various Voting Scenarios
   */
  async demoStep3_VotingScenarios() {
    console.log('\n🗳️ Step 3: Voting Scenarios with Different Roles and Strategies');
    console.log('-'.repeat(50));

    if (this.activeProposals.length === 0) {
      console.log('⚠️ No active proposals to vote on');
      return;
    }

    const governanceProposal = this.activeProposals.find(p => p.proposal.type === 'governance');
    if (!governanceProposal) {
      console.log('⚠️ No governance proposal found');
      return;
    }

    const proposalId = governanceProposal.proposalId;
    console.log(`\n🎯 Voting on: "${governanceProposal.proposal.title}"`);

    // Define voting scenarios
    const votingScenarios = [
      {
        wallet: DEMO_CONFIG.demoWallets[0], // Owner
        option: 'Approve New Rules',
        burnVotes: 0,
        description: 'Owner supports with base voting power'
      },
      {
        wallet: DEMO_CONFIG.demoWallets[1], // Admin
        option: 'Approve New Rules',
        burnVotes: 2,
        description: 'Admin burns MLG for additional influence'
      },
      {
        wallet: DEMO_CONFIG.demoWallets[2], // Moderator
        option: 'Modify Rules',
        burnVotes: 1,
        description: 'Moderator suggests modifications with 1 burn vote'
      },
      {
        wallet: DEMO_CONFIG.demoWallets[4], // Member 1
        option: 'Approve New Rules',
        burnVotes: 0,
        description: 'Member votes with base power only'
      },
      {
        wallet: DEMO_CONFIG.demoWallets[5], // Member 2
        option: 'Keep Current Rules',
        burnVotes: 3,
        description: 'Member opposes with significant MLG investment'
      }
    ];

    for (const scenario of votingScenarios) {
      const voterWallet = new MockWallet(scenario.wallet.address, scenario.wallet.role, scenario.wallet.name);
      this.votingSystem.wallet = voterWallet;

      console.log(`\n👤 ${scenario.description}`);
      console.log(`   Voter: ${voterWallet.name} (${voterWallet.role})`);
      console.log(`   Choice: "${scenario.option}"`);
      console.log(`   Burn Votes: ${scenario.burnVotes}`);

      const baseVotingPower = CLAN_VOTING_CONFIG.ROLE_VOTING_WEIGHTS[voterWallet.role];
      const burnCost = scenario.burnVotes > 0 ? this.votingSystem.calculateBurnCost(scenario.burnVotes) : 0;
      const totalVotingPower = baseVotingPower + scenario.burnVotes;

      console.log(`   Expected Power: ${baseVotingPower} + ${scenario.burnVotes} = ${totalVotingPower}`);
      if (burnCost > 0) {
        console.log(`   MLG Burn Cost: ${burnCost} tokens`);
      }

      try {
        // Simulate the vote (in demo mode)
        const voteResult = {
          success: true,
          totalVotingPower,
          vote: {
            voter: voterWallet.address,
            option: scenario.option,
            votingPower: totalVotingPower,
            burnCost,
            burnedVotes: scenario.burnVotes
          }
        };

        console.log(`✅ Vote cast successfully!`);
        console.log(`   Total Voting Power Used: ${voteResult.totalVotingPower}`);
        
        this.results.votes.push(voteResult);

      } catch (error) {
        console.log(`❌ Vote failed: ${error.message}`);
      }

      // Small delay for demo readability
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n📈 Voting Summary:`);
    console.log(`   Total Votes Cast: ${this.results.votes.length}`);
    
    // Calculate vote distribution
    const optionTotals = {};
    let totalPower = 0;
    
    this.results.votes.forEach(vote => {
      if (!optionTotals[vote.vote.option]) {
        optionTotals[vote.vote.option] = 0;
      }
      optionTotals[vote.vote.option] += vote.totalVotingPower;
      totalPower += vote.totalVotingPower;
    });

    Object.entries(optionTotals).forEach(([option, power]) => {
      const percentage = ((power / totalPower) * 100).toFixed(1);
      console.log(`   - "${option}": ${power} power (${percentage}%)`);
    });
  }

  /**
   * Demo Step 4: Delegation Examples
   */
  async demoStep4_Delegations() {
    console.log('\n🤝 Step 4: Vote Delegation Examples');
    console.log('-'.repeat(50));

    // Example 1: Member delegates to Admin
    const memberWallet = new MockWallet(
      DEMO_CONFIG.demoWallets[4].address,
      DEMO_CONFIG.demoWallets[4].role,
      DEMO_CONFIG.demoWallets[4].name
    );

    const adminWallet = new MockWallet(
      DEMO_CONFIG.demoWallets[1].address,
      DEMO_CONFIG.demoWallets[1].role,
      DEMO_CONFIG.demoWallets[1].name
    );

    this.votingSystem.wallet = memberWallet;

    console.log(`\n📤 Creating delegation...`);
    console.log(`   From: ${memberWallet.name} (${memberWallet.role})`);
    console.log(`   To: ${adminWallet.name} (${adminWallet.role})`);
    console.log(`   Duration: 7 days`);
    console.log(`   Proposal Types: governance, budget`);

    try {
      // Simulate delegation creation
      const delegationResult = {
        success: true,
        delegation: {
          id: `delegation_${Date.now()}`,
          delegator: memberWallet.address,
          delegate: adminWallet.address,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          proposalTypes: ['governance', 'budget']
        },
        transaction: `delegation_tx_${Date.now()}`
      };

      console.log(`✅ Delegation created successfully!`);
      console.log(`   - Delegation ID: ${delegationResult.delegation.id}`);
      console.log(`   - Expires: ${new Date(delegationResult.delegation.expiresAt).toLocaleDateString()}`);
      console.log(`   - Blockchain TX: ${delegationResult.transaction}`);

      // Example 2: Demonstrate proxy voting power
      console.log(`\n🔄 Proxy Voting Power Calculation:`);
      console.log(`   Admin Base Power: ${CLAN_VOTING_CONFIG.ROLE_VOTING_WEIGHTS.admin}`);
      console.log(`   Delegated Power from Member: ${CLAN_VOTING_CONFIG.ROLE_VOTING_WEIGHTS.member}`);
      console.log(`   Total Proxy Power: ${CLAN_VOTING_CONFIG.ROLE_VOTING_WEIGHTS.admin + CLAN_VOTING_CONFIG.ROLE_VOTING_WEIGHTS.member}`);

    } catch (error) {
      console.log(`❌ Delegation failed: ${error.message}`);
    }

    // Example 3: Revocation process
    console.log(`\n🚫 Delegation Revocation Process:`);
    console.log(`   1. Member gives revocation notice`);
    console.log(`   2. 24-hour notice period begins`);
    console.log(`   3. Delegation remains active during notice`);
    console.log(`   4. After notice period: delegation revoked`);
    console.log(`   5. Blockchain transaction confirms revocation`);
  }

  /**
   * Demo Step 5: Analytics and Governance Health
   */
  async demoStep5_Analytics() {
    console.log('\n📊 Step 5: Clan Voting Analytics and Governance Health');
    console.log('-'.repeat(50));

    try {
      // Simulate analytics calculation
      const mockAnalytics = {
        overview: {
          totalProposals: this.activeProposals.length,
          activeProposals: this.activeProposals.length,
          completedProposals: 0,
          totalVotes: this.results.votes.length,
          uniqueVoters: new Set(this.results.votes.map(v => v.vote.voter)).size,
          averageParticipation: this.results.votes.length / DEMO_CONFIG.demoWallets.length,
          totalMLGBurned: this.results.votes.reduce((sum, v) => sum + (v.vote.burnCost || 0), 0)
        },
        
        governanceHealth: {
          score: 85,
          grade: 'B+',
          factors: {
            participation: 75,
            diversity: 90,
            activity: 85,
            engagement: 80
          },
          recommendations: [
            'Encourage more member participation in voting',
            'Consider incentive programs for active governance participation',
            'Maintain current level of proposal diversity'
          ]
        },
        
        delegationMetrics: {
          totalDelegations: 1,
          activeDelegations: 1,
          proxyVotingRate: 0.17 // 1 out of 6 members
        }
      };

      console.log('\n📈 Voting Overview:');
      console.log(`   Total Proposals: ${mockAnalytics.overview.totalProposals}`);
      console.log(`   Total Votes Cast: ${mockAnalytics.overview.totalVotes}`);
      console.log(`   Unique Voters: ${mockAnalytics.overview.uniqueVoters}`);
      console.log(`   Participation Rate: ${(mockAnalytics.overview.averageParticipation * 100).toFixed(1)}%`);
      console.log(`   MLG Tokens Burned: ${mockAnalytics.overview.totalMLGBurned}`);

      console.log('\n🏥 Governance Health Score:');
      console.log(`   Overall Score: ${mockAnalytics.governanceHealth.score}/100 (${mockAnalytics.governanceHealth.grade})`);
      console.log(`   Participation: ${mockAnalytics.governanceHealth.factors.participation}/100`);
      console.log(`   Role Diversity: ${mockAnalytics.governanceHealth.factors.diversity}/100`);
      console.log(`   Activity Level: ${mockAnalytics.governanceHealth.factors.activity}/100`);
      console.log(`   Engagement: ${mockAnalytics.governanceHealth.factors.engagement}/100`);

      console.log('\n💡 Governance Recommendations:');
      mockAnalytics.governanceHealth.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });

      console.log('\n🤝 Delegation Analytics:');
      console.log(`   Total Delegations: ${mockAnalytics.delegationMetrics.totalDelegations}`);
      console.log(`   Active Delegations: ${mockAnalytics.delegationMetrics.activeDelegations}`);
      console.log(`   Proxy Voting Rate: ${(mockAnalytics.delegationMetrics.proxyVotingRate * 100).toFixed(1)}%`);

      this.results.analytics = mockAnalytics;

    } catch (error) {
      console.log(`❌ Analytics calculation failed: ${error.message}`);
    }
  }

  /**
   * Demo Step 6: Dashboard Integration
   */
  async demoStep6_Dashboard() {
    console.log('\n🖥️ Step 6: Dashboard Integration Demo');
    console.log('-'.repeat(50));

    try {
      const dashboard = new ClanVotingDashboard({
        clanId: DEMO_CONFIG.clanId,
        wallet: this.currentWallet
      });

      console.log('✅ Dashboard component created');
      console.log('   Features included:');
      console.log('   - Proposal creation interface');
      console.log('   - Voting pools with role-based access');
      console.log('   - Burn vote selection with cost preview');
      console.log('   - Delegation management');
      console.log('   - Real-time analytics dashboard');
      console.log('   - Mobile-responsive design');

      // Simulate dashboard HTML generation
      const htmlPreview = dashboard.render();
      console.log(`   - Generated HTML: ${htmlPreview.length} characters`);
      console.log('   - CSS styles: Responsive with Xbox 360 aesthetic');
      console.log('   - JavaScript: Interactive voting interface');

      console.log('\n🎨 Dashboard Features:');
      console.log('   📊 Quick stats: Active proposals, voting power, participation');
      console.log('   📋 Proposal pools: Governance, Budget, Membership, Content, Events, Alliance');
      console.log('   🗳️ Voting interface: Option selection, burn vote configuration');
      console.log('   📈 Analytics: Real-time governance health monitoring');
      console.log('   🤝 Delegation: Easy delegation setup and management');

    } catch (error) {
      console.log(`❌ Dashboard integration failed: ${error.message}`);
    }
  }

  /**
   * Generate Demo Report
   */
  generateReport() {
    console.log('\n📋 Demo Report Summary');
    console.log('='.repeat(60));
    
    console.log(`\n✅ Successfully Demonstrated:`);
    console.log(`   - Clan voting system initialization`);
    console.log(`   - Multi-type proposal creation (${this.results.proposals.length} proposals)`);
    console.log(`   - Role-based voting with burn mechanics (${this.results.votes.length} votes)`);
    console.log(`   - Vote delegation and proxy voting`);
    console.log(`   - Comprehensive governance analytics`);
    console.log(`   - Dashboard integration with full UI`);

    console.log(`\n📊 Demo Statistics:`);
    console.log(`   - Clan Members: ${DEMO_CONFIG.demoWallets.length}`);
    console.log(`   - Proposals Created: ${this.results.proposals.length}`);
    console.log(`   - Votes Cast: ${this.results.votes.length}`);
    console.log(`   - Voting Pools Used: ${new Set(this.results.proposals.map(p => p.proposal.type)).size}`);
    console.log(`   - MLG Tokens Burned: ${this.results.votes.reduce((sum, v) => sum + (v.vote.burnCost || 0), 0)}`);

    if (this.results.analytics) {
      console.log(`   - Governance Health: ${this.results.analytics.governanceHealth.score}/100 (${this.results.analytics.governanceHealth.grade})`);
    }

    console.log(`\n🎯 Key Features Showcased:`);
    console.log(`   ✓ Role-based voting weights (Owner: 10x, Admin: 5x, etc.)`);
    console.log(`   ✓ MLG token burn-to-vote mechanics (1-5 additional votes)`);
    console.log(`   ✓ Six different proposal pool types`);
    console.log(`   ✓ Vote delegation and proxy voting system`);
    console.log(`   ✓ Blockchain integration with transaction signing`);
    console.log(`   ✓ Comprehensive analytics and health scoring`);
    console.log(`   ✓ Full dashboard with responsive UI`);

    return this.results;
  }
}

/**
 * Run the demo if this file is executed directly
 */
if (typeof window === 'undefined' && import.meta.url === new URL(import.meta.url).href) {
  const demo = new ClanVotingDemo();
  demo.startDemo()
    .then(() => {
      demo.generateReport();
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Demo failed:', error);
      process.exit(1);
    });
}

// Export for use in other files
export default ClanVotingDemo;
export { DEMO_CONFIG, MockWallet, DemoClanVotingSystem };