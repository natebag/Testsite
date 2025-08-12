import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep, group } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

/**
 * MLG.clan Gaming Platform - K6 Load Testing Scenarios
 * Comprehensive API load testing for gaming workflows
 */

// Custom metrics for gaming scenarios
const votingLatency = new Trend('voting_latency');
const tokenBurnRate = new Rate('token_burn_success_rate');
const clanBattleMetrics = new Trend('clan_battle_response_time');
const leaderboardUpdates = new Counter('leaderboard_update_count');
const tournamentJoins = new Counter('tournament_join_count');

// Configuration
export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Warm up
    { duration: '1m', target: 200 },   // Ramp up to normal load
    { duration: '2m', target: 500 },   // Stay at normal load
    { duration: '1m', target: 1000 },  // Ramp up to peak load
    { duration: '3m', target: 1000 },  // Stay at peak load
    { duration: '1m', target: 500 },   // Ramp down
    { duration: '1m', target: 0 },     // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],              // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],                 // Error rate under 10%
    voting_latency: ['p(95)<100'],                 // Voting under 100ms
    token_burn_success_rate: ['rate>0.95'],        // Token burns 95% success
    clan_battle_response_time: ['p(90)<300'],      // Clan battles under 300ms
    leaderboard_update_count: ['count>100'],       // At least 100 leaderboard updates
    tournament_join_count: ['count>50'],           // At least 50 tournament joins
  },
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

let testUsers = [];
let testClans = [];
let testContent = [];

// Initialize test data
export function setup() {
  console.log('🎮 Setting up MLG.clan gaming load test scenarios');
  
  // Generate test data
  testUsers = generateTestUsers(1000);
  testClans = generateTestClans(50);
  testContent = generateTestContent(200);

  return {
    users: testUsers,
    clans: testClans,
    content: testContent,
    baseUrl: BASE_URL,
    apiUrl: API_URL
  };
}

export default function(data) {
  const { users, clans, content, apiUrl } = data;
  
  // Select random test data for this VU
  const user = users[Math.floor(Math.random() * users.length)];
  const clan = clans[Math.floor(Math.random() * clans.length)];
  const contentItem = content[Math.floor(Math.random() * content.length)];

  // Run gaming scenarios based on weighted distribution
  const scenario = selectScenario();
  
  switch (scenario) {
    case 'voting':
      runVotingScenario(apiUrl, user, contentItem);
      break;
    case 'clan-management':
      runClanManagementScenario(apiUrl, user, clan);
      break;
    case 'tournament':
      runTournamentScenario(apiUrl, user);
      break;
    case 'leaderboard':
      runLeaderboardScenario(apiUrl, user);
      break;
    case 'content-browsing':
      runContentBrowsingScenario(apiUrl, user);
      break;
    case 'clan-battle':
      runClanBattleScenario(apiUrl, user, clan);
      break;
    default:
      runMixedScenario(apiUrl, user, clan, contentItem);
  }

  sleep(Math.random() * 2 + 1); // Random sleep between 1-3 seconds
}

function selectScenario() {
  const scenarios = [
    { name: 'voting', weight: 30 },
    { name: 'content-browsing', weight: 25 },
    { name: 'leaderboard', weight: 15 },
    { name: 'clan-management', weight: 10 },
    { name: 'tournament', weight: 10 },
    { name: 'clan-battle', weight: 10 }
  ];

  const random = Math.random() * 100;
  let cumulative = 0;

  for (const scenario of scenarios) {
    cumulative += scenario.weight;
    if (random <= cumulative) {
      return scenario.name;
    }
  }

  return 'voting'; // Default fallback
}

function runVotingScenario(apiUrl, user, contentItem) {
  group('Gaming Voting Scenario', function() {
    // 1. Get user authentication token
    const authResponse = authenticateUser(apiUrl, user);
    if (!check(authResponse, { 'auth successful': (r) => r.status === 200 })) {
      return;
    }

    const token = JSON.parse(authResponse.body).token;
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Get content details
    const startTime = Date.now();
    const contentResponse = http.get(`${apiUrl}/content/${contentItem.id}`, { headers });
    check(contentResponse, {
      'content loaded': (r) => r.status === 200,
      'content has vote data': (r) => JSON.parse(r.body).votes !== undefined
    });

    // 3. Check user token balance
    const balanceResponse = http.get(`${apiUrl}/users/${user.id}/tokens`, { headers });
    check(balanceResponse, {
      'balance retrieved': (r) => r.status === 200,
      'sufficient tokens': (r) => JSON.parse(r.body).balance >= 10
    });

    // 4. Vote on content (burn-to-vote mechanism)
    const votePayload = {
      contentId: contentItem.id,
      voteType: 'up',
      tokensToBurn: 10,
      walletSignature: generateMockSignature()
    };

    const voteStart = Date.now();
    const voteResponse = http.post(`${apiUrl}/voting/burn-vote`, JSON.stringify(votePayload), { headers });
    const voteLatency = Date.now() - voteStart;
    
    votingLatency.add(voteLatency);
    tokenBurnRate.add(voteResponse.status === 200);

    check(voteResponse, {
      'vote submitted': (r) => r.status === 200,
      'tokens burned': (r) => JSON.parse(r.body).tokensBurned === 10,
      'vote recorded': (r) => JSON.parse(r.body).voteId !== undefined
    });

    // 5. Verify vote was recorded
    sleep(0.1); // Small delay for processing
    const verifyResponse = http.get(`${apiUrl}/content/${contentItem.id}/votes`, { headers });
    check(verifyResponse, {
      'vote count updated': (r) => r.status === 200,
      'user vote recorded': (r) => {
        const votes = JSON.parse(r.body);
        return votes.some(v => v.userId === user.id);
      }
    });
  });
}

function runClanManagementScenario(apiUrl, user, clan) {
  group('Clan Management Scenario', function() {
    const authResponse = authenticateUser(apiUrl, user);
    if (!check(authResponse, { 'auth successful': (r) => r.status === 200 })) {
      return;
    }

    const token = JSON.parse(authResponse.body).token;
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 1. Get clan details
    const clanResponse = http.get(`${apiUrl}/clans/${clan.id}`, { headers });
    check(clanResponse, {
      'clan details loaded': (r) => r.status === 200,
      'clan has members': (r) => JSON.parse(r.body).memberCount > 0
    });

    // 2. Get clan leaderboard
    const leaderboardStart = Date.now();
    const leaderboardResponse = http.get(`${apiUrl}/clans/${clan.id}/leaderboard`, { headers });
    const leaderboardTime = Date.now() - leaderboardStart;
    
    clanBattleMetrics.add(leaderboardTime);

    check(leaderboardResponse, {
      'leaderboard loaded': (r) => r.status === 200,
      'leaderboard has rankings': (r) => JSON.parse(r.body).rankings.length > 0
    });

    // 3. Update clan activity (if user is member)
    if (user.clanId === clan.id) {
      const activityPayload = {
        activityType: 'gaming_session',
        duration: Math.floor(Math.random() * 120) + 30, // 30-150 minutes
        tokensEarned: Math.floor(Math.random() * 100) + 10
      };

      const activityResponse = http.post(`${apiUrl}/clans/${clan.id}/activity`, 
        JSON.stringify(activityPayload), { headers });
      
      check(activityResponse, {
        'activity recorded': (r) => r.status === 200,
        'clan stats updated': (r) => JSON.parse(r.body).success === true
      });
    }

    // 4. Check clan battles
    const battlesResponse = http.get(`${apiUrl}/clans/${clan.id}/battles/active`, { headers });
    check(battlesResponse, {
      'battles loaded': (r) => r.status === 200
    });
  });
}

function runTournamentScenario(apiUrl, user) {
  group('Tournament Scenario', function() {
    const authResponse = authenticateUser(apiUrl, user);
    if (!check(authResponse, { 'auth successful': (r) => r.status === 200 })) {
      return;
    }

    const token = JSON.parse(authResponse.body).token;
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 1. Get active tournaments
    const tournamentsResponse = http.get(`${apiUrl}/tournaments/active`, { headers });
    check(tournamentsResponse, {
      'tournaments loaded': (r) => r.status === 200
    });

    const tournaments = JSON.parse(tournamentsResponse.body);
    if (tournaments.length === 0) return;

    const tournament = tournaments[0];

    // 2. Get tournament details
    const tournamentResponse = http.get(`${apiUrl}/tournaments/${tournament.id}`, { headers });
    check(tournamentResponse, {
      'tournament details loaded': (r) => r.status === 200,
      'tournament has brackets': (r) => JSON.parse(r.body).brackets !== undefined
    });

    // 3. Join tournament (if not full)
    const tournamentData = JSON.parse(tournamentResponse.body);
    if (tournamentData.participants.length < tournamentData.maxParticipants) {
      const joinPayload = {
        tournamentId: tournament.id,
        entryFee: tournamentData.entryFee || 0
      };

      const joinResponse = http.post(`${apiUrl}/tournaments/${tournament.id}/join`, 
        JSON.stringify(joinPayload), { headers });
      
      if (check(joinResponse, { 'joined tournament': (r) => r.status === 200 })) {
        tournamentJoins.add(1);
      }
    }

    // 4. Get tournament leaderboard
    const tournamentLeaderboardResponse = http.get(`${apiUrl}/tournaments/${tournament.id}/leaderboard`, { headers });
    check(tournamentLeaderboardResponse, {
      'tournament leaderboard loaded': (r) => r.status === 200
    });
  });
}

function runLeaderboardScenario(apiUrl, user) {
  group('Leaderboard Scenario', function() {
    const authResponse = authenticateUser(apiUrl, user);
    if (!check(authResponse, { 'auth successful': (r) => r.status === 200 })) {
      return;
    }

    const token = JSON.parse(authResponse.body).token;
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 1. Global leaderboard
    const globalResponse = http.get(`${apiUrl}/leaderboard/global`, { headers });
    check(globalResponse, {
      'global leaderboard loaded': (r) => r.status === 200,
      'has top players': (r) => JSON.parse(r.body).players.length > 0
    });
    leaderboardUpdates.add(1);

    // 2. Clan leaderboard
    if (user.clanId) {
      const clanLeaderboardResponse = http.get(`${apiUrl}/leaderboard/clan/${user.clanId}`, { headers });
      check(clanLeaderboardResponse, {
        'clan leaderboard loaded': (r) => r.status === 200
      });
      leaderboardUpdates.add(1);
    }

    // 3. Content leaderboard
    const contentLeaderboardResponse = http.get(`${apiUrl}/leaderboard/content`, { headers });
    check(contentLeaderboardResponse, {
      'content leaderboard loaded': (r) => r.status === 200
    });
    leaderboardUpdates.add(1);

    // 4. User ranking
    const userRankingResponse = http.get(`${apiUrl}/users/${user.id}/ranking`, { headers });
    check(userRankingResponse, {
      'user ranking loaded': (r) => r.status === 200,
      'user has rank': (r) => JSON.parse(r.body).rank !== undefined
    });
  });
}

function runContentBrowsingScenario(apiUrl, user) {
  group('Content Browsing Scenario', function() {
    const authResponse = authenticateUser(apiUrl, user);
    if (!check(authResponse, { 'auth successful': (r) => r.status === 200 })) {
      return;
    }

    const token = JSON.parse(authResponse.body).token;
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 1. Browse trending content
    const trendingResponse = http.get(`${apiUrl}/content/trending`, { headers });
    check(trendingResponse, {
      'trending content loaded': (r) => r.status === 200,
      'has trending items': (r) => JSON.parse(r.body).length > 0
    });

    // 2. Browse by category
    const categories = ['gaming', 'esports', 'streaming', 'clips'];
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    const categoryResponse = http.get(`${apiUrl}/content/category/${category}`, { headers });
    check(categoryResponse, {
      'category content loaded': (r) => r.status === 200
    });

    // 3. Search content
    const searchQuery = 'gaming';
    const searchResponse = http.get(`${apiUrl}/content/search?q=${searchQuery}`, { headers });
    check(searchResponse, {
      'search results loaded': (r) => r.status === 200
    });

    // 4. Get content recommendations
    const recommendationsResponse = http.get(`${apiUrl}/users/${user.id}/recommendations`, { headers });
    check(recommendationsResponse, {
      'recommendations loaded': (r) => r.status === 200
    });
  });
}

function runClanBattleScenario(apiUrl, user, clan) {
  group('Clan Battle Scenario', function() {
    const authResponse = authenticateUser(apiUrl, user);
    if (!check(authResponse, { 'auth successful': (r) => r.status === 200 })) {
      return;
    }

    const token = JSON.parse(authResponse.body).token;
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Only run if user is in a clan
    if (!user.clanId) return;

    // 1. Get active clan battles
    const battlesStart = Date.now();
    const battlesResponse = http.get(`${apiUrl}/clans/${user.clanId}/battles`, { headers });
    const battlesTime = Date.now() - battlesStart;
    
    clanBattleMetrics.add(battlesTime);

    check(battlesResponse, {
      'clan battles loaded': (r) => r.status === 200
    });

    // 2. Join or participate in battle
    const battles = JSON.parse(battlesResponse.body || '[]');
    if (battles.length > 0) {
      const battle = battles[0];
      
      const participatePayload = {
        battleId: battle.id,
        action: 'participate',
        contribution: Math.floor(Math.random() * 100) + 10
      };

      const participateResponse = http.post(`${apiUrl}/clan-battles/${battle.id}/participate`, 
        JSON.stringify(participatePayload), { headers });
      
      check(participateResponse, {
        'battle participation recorded': (r) => r.status === 200
      });
    }

    // 3. Get battle results
    const resultsResponse = http.get(`${apiUrl}/clans/${user.clanId}/battle-results`, { headers });
    check(resultsResponse, {
      'battle results loaded': (r) => r.status === 200
    });
  });
}

function runMixedScenario(apiUrl, user, clan, contentItem) {
  group('Mixed Gaming Scenario', function() {
    // Simulate realistic user behavior with mixed actions
    runContentBrowsingScenario(apiUrl, user);
    sleep(0.5);
    
    if (Math.random() > 0.5) {
      runVotingScenario(apiUrl, user, contentItem);
      sleep(0.3);
    }
    
    if (user.clanId && Math.random() > 0.7) {
      runClanManagementScenario(apiUrl, user, clan);
    }
    
    if (Math.random() > 0.8) {
      runLeaderboardScenario(apiUrl, user);
    }
  });
}

// Helper functions
function authenticateUser(apiUrl, user) {
  const loginPayload = {
    username: user.username,
    password: 'loadtest123', // Standard load test password
    walletAddress: user.walletAddress
  };

  return http.post(`${apiUrl}/auth/login`, JSON.stringify(loginPayload), {
    headers: { 'Content-Type': 'application/json' }
  });
}

function generateMockSignature() {
  // Generate a mock Solana transaction signature for testing
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz123456789';
  return Array.from({ length: 88 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function generateTestUsers(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `load_test_user_${i}`,
    username: `gamer_${i}`,
    email: `loadtest${i}@mlg.clan`,
    walletAddress: generateFakeWalletAddress(),
    clanId: i % 20 === 0 ? null : `load_test_clan_${Math.floor(i / 20)}`, // Some users not in clans
    tokenBalance: Math.floor(Math.random() * 10000) + 100,
    level: Math.floor(Math.random() * 50) + 1,
    achievements: Math.floor(Math.random() * 10)
  }));
}

function generateTestClans(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `load_test_clan_${i}`,
    name: `Clan ${i}`,
    memberCount: 20,
    level: Math.floor(Math.random() * 10) + 1,
    totalTokens: Math.floor(Math.random() * 100000) + 10000
  }));
}

function generateTestContent(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `load_test_content_${i}`,
    title: `Gaming Content ${i}`,
    type: ['video', 'clip', 'stream', 'tournament'][Math.floor(Math.random() * 4)],
    creatorId: `load_test_user_${Math.floor(Math.random() * 1000)}`,
    votes: Math.floor(Math.random() * 1000),
    tokensEarned: Math.floor(Math.random() * 5000)
  }));
}

function generateFakeWalletAddress() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz123456789';
  return Array.from({ length: 44 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function teardown(data) {
  console.log('🏁 K6 gaming scenarios completed');
  console.log(`📊 Total leaderboard updates: ${leaderboardUpdates.count}`);
  console.log(`🏆 Total tournament joins: ${tournamentJoins.count}`);
}